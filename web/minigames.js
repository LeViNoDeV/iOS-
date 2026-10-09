// LifeSim mini-games: quick skill games attached to certain actions (work, interviews, exams,
// license tests, the gym, crimes). Each returns a score from 0 to 1 that replaces some of the luck.
// They run in their own overlay outside #app, so the game's re-renders don't interrupt them.
"use strict";

const MG = { active: null };

const InterviewQuestions = [
  ["Why do you want this job?", [["I've researched the company and I think my skills fit what you need.", 1], ["Honestly, I need the money.", 0.2], ["It seemed like the easiest job to get.", 0], ["I'm passionate about the work and want to grow here.", 0.9]]],
  ["What's your biggest weakness?", [["I sometimes take on too much, so I've learned to prioritize.", 1], ["I don't have any weaknesses.", 0.1], ["I'm late a lot.", 0], ["I'm a perfectionist.", 0.5]]],
  ["Tell me about a time you disagreed with a coworker.", [["We talked it through and found a compromise that worked.", 1], ["I went straight to the boss.", 0.3], ["I just did it my way anyway.", 0.1], ["I avoid conflict, so I let it go.", 0.4]]],
  ["Where do you see yourself in five years?", [["Taking on more responsibility here and learning new skills.", 1], ["Running this company.", 0.5], ["Probably somewhere else.", 0], ["I don't really plan that far ahead.", 0.2]]],
  ["Why should we hire you over the other candidates?", [["I bring relevant experience and I learn fast. Here's an example...", 1], ["Because I really, really want it.", 0.3], ["The others are probably worse.", 0.1], ["I'm reliable and easy to work with.", 0.75]]],
  ["What salary are you expecting?", [["Something in line with the market for this role. I'm flexible.", 1], ["Double what you're offering.", 0.1], ["Whatever you'll give me.", 0.4], ["I've checked the range, and the upper end reflects my experience.", 0.85]]],
  ["How do you handle stress?", [["I break big tasks into small steps and keep communicating.", 1], ["I don't get stressed.", 0.3], ["I usually need a few days off.", 0.1], ["Exercise and good sleep keep me steady.", 0.8]]],
  ["Do you have any questions for us?", [["What does success look like in the first six months?", 1], ["No, I think I'm good.", 0.2], ["How much vacation do I get?", 0.3], ["What do you enjoy most about working here?", 0.85]]],
];

const TypingWords = {
  office: ["quarterly", "deadline", "invoice", "meeting", "proposal", "schedule", "forecast", "client", "agenda", "budget", "report", "follow-up"],
  code: ["function", "return", "async", "deploy", "commit", "variable", "refactor", "server", "branch", "compile", "debug", "array"],
  legal: ["plaintiff", "contract", "motion", "verdict", "evidence", "counsel", "statute", "appeal", "witness", "liable", "clause", "testimony"],
  writing: ["chapter", "memory", "childhood", "honest", "journey", "regret", "family", "triumph", "secret", "lesson", "summer", "promise"],
};

function mgRoot() {
  let el = document.getElementById("mg-root");
  if (!el) { el = document.createElement("div"); el.id = "mg-root"; document.body.appendChild(el); }
  return el;
}

/// Plays a mini-game, then calls done(score) with 0..1, or done(null) if skipped or turned off.
function playMinigame(kind, opts, done) {
  if (store.settings.minigames === false || !MiniGames[kind]) { done(null); return; }
  const root = mgRoot();
  root.innerHTML = `<div class="mg-scrim"><div class="mg-card" role="dialog" aria-modal="true" aria-labelledby="mg-title">
    <div class="mg-head"><div class="mg-emoji" aria-hidden="true">${opts.emoji || "🎮"}</div><div><div class="modal-tag">Mini-game</div><h3 id="mg-title">${esc(opts.title)}</h3><p class="muted">${esc(opts.hint || MiniGames[kind].hint)}</p></div></div>
    <div class="mg-body"></div>
    <div class="mg-foot"><button class="btn small mg-skip">Skip: leave it to luck</button></div></div></div>`;
  const body = root.querySelector(".mg-body");
  const state = { kind, timers: [], raf: null, keys: null, over: false };
  MG.active = state;
  const cleanup = () => {
    state.timers.forEach(clearTimeout); state.timers.forEach(clearInterval);
    if (state.raf) cancelAnimationFrame(state.raf);
    document.removeEventListener("keydown", onKeyMg, true);
  };
  const close = (score) => { cleanup(); MG.active = null; root.innerHTML = ""; done(score); };
  const finish = (score) => {
    if (state.over) return;
    state.over = true;
    cleanup();
    score = clamp(score, 0, 1);
    const pct = Math.round(score * 100);
    Sfx.play(pct >= 70 ? "great" : pct >= 40 ? "good" : "bad");
    const word = pct >= 90 ? "Outstanding!" : pct >= 70 ? "Great job!" : pct >= 45 ? "Not bad." : pct >= 20 ? "Rough one." : "Disaster.";
    body.innerHTML = `<div class="mg-result"><div class="mg-score">${pct}%</div><div>${word}</div></div><button class="btn primary mg-continue">Continue <span class="kbd">Enter</span></button>`;
    root.querySelector(".mg-skip").remove();
    const btn = body.querySelector(".mg-continue");
    btn.onclick = () => close(score);
    btn.focus();
    state.keys = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); close(score); } };
    document.addEventListener("keydown", onKeyMg, true);
  };
  function onKeyMg(e) {
    if (e.key === "Escape" && !state.over) { e.preventDefault(); e.stopPropagation(); close(null); return; }
    if (state.keys) state.keys(e);
  }
  root.querySelector(".mg-skip").onclick = () => close(null);
  document.addEventListener("keydown", onKeyMg, true);
  MiniGames[kind].run(body, opts, finish, state);
}

const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const MiniGames = {
  // Stop a sliding marker inside the green zone.
  timing: {
    hint: "Press Space (or the button) when the marker is inside the green zone.",
    run(body, o, finish, st) {
      const rounds = o.rounds || 3;
      let round = 0, t = 0, last = performance.now(), speed = o.speed || 1, zc = 0, zw = o.zone || 0.16;
      const scores = [];
      body.innerHTML = `<div class="mg-track"><div class="mg-zone"></div><div class="mg-marker"></div></div><div class="mg-status muted">Round 1 of ${rounds}</div>
        <button class="btn primary mg-act">${esc(o.verb || "Stop!")} <span class="kbd">Space</span></button>`;
      const zone = body.querySelector(".mg-zone"), marker = body.querySelector(".mg-marker"), status = body.querySelector(".mg-status");
      let pos = 0, paused = false;
      const setZone = () => { zc = 0.15 + Math.random() * 0.7; zone.style.left = `${(zc - zw / 2) * 100}%`; zone.style.width = `${zw * 100}%`; };
      setZone();
      const frame = (now) => {
        const dt = (now - last) / 1000; last = now;
        if (!paused) { t += dt * speed * 2.1; pos = (Math.sin(t) + 1) / 2; marker.style.left = `${pos * 100}%`; }
        st.raf = requestAnimationFrame(frame);
      };
      st.raf = requestAnimationFrame(frame);
      const hit = () => {
        if (paused || st.over) return;
        paused = true;
        const d = Math.abs(pos - zc);
        const s = d <= zw / 2 ? 1 - (d / (zw / 2)) * 0.2 : Math.max(0, 1 - (d - zw / 2) / 0.28) * 0.55;
        scores.push(s);
        status.textContent = s >= 0.9 ? "Perfect!" : s >= 0.8 ? "Good!" : s >= 0.3 ? "Close..." : "Missed!";
        Sfx.play(s >= 0.8 ? "hit" : "miss");
        round += 1;
        st.timers.push(setTimeout(() => {
          if (round >= rounds) { finish(scores.reduce((a, b) => a + b, 0) / rounds); return; }
          speed *= 1.18; setZone(); paused = false; status.textContent = `Round ${round + 1} of ${rounds}`;
        }, 650));
      };
      body.querySelector(".mg-act").onclick = hit;
      body.querySelector(".mg-act").focus();
      st.keys = (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); hit(); } };
    },
  },

  // Answer quick arithmetic before time runs out.
  math: {
    hint: "Pick the right answer. Number keys 1–4 work too.",
    run(body, o, finish, st) {
      const total = o.count || 5, level = o.level || 1, time = o.time || 22;
      let i = 0, correct = 0, left = time;
      const make = () => {
        let a, b, q, ans;
        const k = level >= 3 ? pick(["×", "%", "+"]) : level === 2 ? pick(["+", "−", "×"]) : pick(["+", "−"]);
        if (k === "+") { a = rnd(level * 5, level * 40); b = rnd(level * 3, level * 30); ans = a + b; q = `${a} + ${b}`; }
        else if (k === "−") { a = rnd(10, level * 50); b = rnd(1, a); ans = a - b; q = `${a} − ${b}`; }
        else if (k === "×") { a = rnd(2, level >= 3 ? 15 : 9); b = rnd(2, level >= 3 ? 12 : 9); ans = a * b; q = `${a} × ${b}`; }
        else { a = pick([10, 15, 20, 25, 50]); b = pick([40, 60, 80, 120, 200, 360]); ans = a * b / 100; q = `${a}% of ${b}`; }
        const opts = new Set([ans]);
        while (opts.size < 4) opts.add(ans + pick([-10, -3, -2, -1, 1, 2, 3, 5, 10]) * (ans > 50 ? rnd(1, 3) : 1));
        return { q, ans, opts: shuffle([...opts]) };
      };
      let cur;
      const draw = () => {
        cur = make();
        body.innerHTML = `<div class="mg-timer"><i style="width:${(left / time) * 100}%"></i></div><div class="mg-q">${esc(cur.q)} = ?</div>
          <div class="mg-choices">${cur.opts.map((v, k) => `<button class="btn" data-v="${v}">${k + 1}. ${v}</button>`).join("")}</div><div class="mg-status muted">Question ${i + 1} of ${total} · ${correct} right</div>`;
        body.querySelectorAll("[data-v]").forEach((b) => { b.onclick = () => answer(Number(b.dataset.v)); });
      };
      const answer = (v) => { if (st.over) return; Sfx.play(v === cur.ans ? "hit" : "miss"); if (v === cur.ans) correct++; i++; if (i >= total) finish(correct / total); else draw(); };
      st.keys = (e) => { const n = Number(e.key); if (n >= 1 && n <= 4 && cur) { e.preventDefault(); answer(cur.opts[n - 1]); } };
      draw();
      st.timers.push(setInterval(() => {
        left -= 0.25;
        const bar = body.querySelector(".mg-timer i"); if (bar) bar.style.width = `${Math.max(0, left / time) * 100}%`;
        if (left <= 0) finish(correct / total);
      }, 250));
    },
  },

  // Watch the sequence, then repeat it.
  memory: {
    hint: "Watch the pads light up, then tap them in the same order. Keys 1–4 work too.",
    run(body, o, finish, st) {
      const pads = o.pads || ["🔴", "🔵", "🟢", "🟡"];
      const rounds = o.rounds || 3;
      let round = 0, seq = [], input = [], showing = false, points = 0;
      body.innerHTML = `<div class="mg-pads">${pads.map((p, k) => `<button class="mg-pad" data-k="${k}">${p}<small>${k + 1}</small></button>`).join("")}</div><div class="mg-status muted"></div>`;
      const status = body.querySelector(".mg-status");
      const padEls = [...body.querySelectorAll(".mg-pad")];
      const flash = (k) => { if (Sfx.on()) Sfx.tone([523, 659, 784, 1047][k % 4], 0, 0.3, "triangle", 0.3); padEls[k].classList.add("lit"); st.timers.push(setTimeout(() => padEls[k].classList.remove("lit"), 380)); };
      const play = () => {
        showing = true; input = [];
        seq = Array.from({ length: (o.start || 3) + round }, () => rnd(0, pads.length - 1));
        status.textContent = `Watch... (round ${round + 1} of ${rounds})`;
        seq.forEach((k, n) => st.timers.push(setTimeout(() => flash(k), 600 + n * 620)));
        st.timers.push(setTimeout(() => { showing = false; status.textContent = "Your turn!"; }, 600 + seq.length * 620));
      };
      const press = (k) => {
        if (showing || st.over) return;
        flash(k);
        input.push(k);
        const n = input.length - 1;
        if (input[n] !== seq[n]) { Sfx.play("miss"); points += n / seq.length; round++; status.textContent = "Wrong!"; next(); return; }
        if (input.length === seq.length) { points += 1; round++; status.textContent = "Correct!"; next(); }
      };
      const next = () => { showing = true; st.timers.push(setTimeout(() => (round >= rounds ? finish(points / rounds) : play()), 700)); };
      padEls.forEach((el, k) => { el.onclick = () => press(k); });
      st.keys = (e) => { const n = Number(e.key); if (n >= 1 && n <= pads.length) { e.preventDefault(); press(n - 1); } };
      play();
    },
  },

  // Click the targets before they vanish.
  catch: {
    hint: "Click each target before it disappears.",
    run(body, o, finish, st) {
      const total = o.targets || 10;
      let shown = 0, hits = 0, cell = -1;
      body.innerHTML = `<div class="mg-grid">${Array.from({ length: 9 }, (_, k) => `<button class="mg-cell" data-k="${k}"></button>`).join("")}</div><div class="mg-status muted">0 of ${total}</div>`;
      const cells = [...body.querySelectorAll(".mg-cell")];
      const status = body.querySelector(".mg-status");
      const spawn = () => {
        if (st.over) return;
        if (cell >= 0) cells[cell].textContent = "";
        if (shown >= total) { finish(hits / total); return; }
        let k; do { k = rnd(0, 8); } while (k === cell);
        cell = k; shown++;
        cells[k].textContent = o.target || "🎯";
        const life = Math.max(560, 1050 - shown * 45) / (o.speed || 1);
        st.timers.push(setTimeout(() => { if (cell === k) { cells[k].textContent = ""; cell = -1; spawn(); } }, life));
      };
      cells.forEach((el, k) => {
        el.onclick = () => {
          if (k !== cell || st.over) return;
          hits++; Sfx.play("hit"); el.textContent = ""; el.classList.add("hit"); st.timers.push(setTimeout(() => el.classList.remove("hit"), 200));
          cell = -1; status.textContent = `${hits} of ${total}`;
          st.timers.push(setTimeout(spawn, 180));
        };
      });
      st.timers.push(setTimeout(spawn, 500));
    },
  },

  // Type the words before time runs out.
  typing: {
    hint: "Type each word and press Space or Enter.",
    run(body, o, finish, st) {
      const words = shuffle(TypingWords[o.words] || TypingWords.office).slice(0, o.count || 5);
      const time = o.time || 16;
      let i = 0, correct = 0, left = time;
      body.innerHTML = `<div class="mg-timer"><i style="width:100%"></i></div><div class="mg-words">${words.map((w, k) => `<span data-k="${k}">${esc(w)}</span>`).join(" ")}</div>
        <input class="mg-input" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Type here"><div class="mg-status muted">0 of ${words.length}</div>`;
      const input = body.querySelector(".mg-input");
      const spans = [...body.querySelectorAll(".mg-words span")];
      spans[0].classList.add("cur");
      input.focus();
      const submit = () => {
        const v = input.value.trim().toLowerCase();
        if (!v || st.over) return;
        const ok = v === words[i];
        if (ok) correct++;
        Sfx.play(ok ? "hit" : "miss");
        spans[i].classList.remove("cur"); spans[i].classList.add(ok ? "ok" : "bad");
        input.value = ""; i++;
        body.querySelector(".mg-status").textContent = `${correct} of ${words.length}`;
        if (i >= words.length) finish(correct / words.length * (0.85 + 0.15 * left / time));
        else spans[i].classList.add("cur");
      };
      input.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); submit(); } });
      st.timers.push(setInterval(() => {
        left -= 0.25;
        body.querySelector(".mg-timer i").style.width = `${Math.max(0, left / time) * 100}%`;
        if (left <= 0) finish(correct / words.length * 0.85);
      }, 250));
    },
  },

  // A short job interview: pick the best answers.
  interview: {
    hint: "Choose your answers. The interviewer is judging every word.",
    run(body, o, finish, st) {
      const qs = shuffle(InterviewQuestions).slice(0, o.count || 3);
      let i = 0, total = 0;
      const draw = () => {
        const [q, answers] = qs[i];
        const opts = shuffle(answers);
        body.innerHTML = `<div class="mg-interviewer">🧑‍💼 <span>“${esc(q)}”</span></div><div class="mg-choices col">${opts.map(([a, s], k) => `<button class="btn" data-s="${s}">${k + 1}. ${esc(a)}</button>`).join("")}</div><div class="mg-status muted">Question ${i + 1} of ${qs.length}</div>`;
        const btns = [...body.querySelectorAll("[data-s]")];
        btns.forEach((b) => { b.onclick = () => choose(Number(b.dataset.s)); });
        st.keys = (e) => { const n = Number(e.key); if (n >= 1 && n <= btns.length) { e.preventDefault(); btns[n - 1].click(); } };
      };
      const choose = (s) => { if (st.over) return; Sfx.play("click"); total += s; i++; if (i >= qs.length) finish(total / qs.length); else draw(); };
      draw();
    },
  },
};

/// Plays a mini-game, then runs the action with the score applied, and shows the score on the result.
function withMinigame(kind, opts, run) {
  playMinigame(kind, opts, (score) => {
    act((x) => {
      if (score != null) x.mg = score;
      try { return run(x); } finally { delete x.mg; }
    });
    if (score != null && ui.outcome) { ui.outcome.tag = `Your score: ${Math.round(score * 100)}%`; render(); }
  });
}
