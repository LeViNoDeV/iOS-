// LifeSim web UI: renders the game and wires clicks to engine actions.
"use strict";

const SAVE_KEY = "lifesim-save-v1";
const store = { life: null, graveyard: [], settings: { mature: true } };
const ui = {
  tab: "career", stack: [], outcome: null, choice: null, openings: null, bet: 1000,
  form: { first: "", last: "", gender: "male" }, lastAgeShown: -1,
};
let handlers = [];

// MARK: Persistence

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(store)); } catch (e) { /* storage unavailable */ }
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    store.life = data.life || null;
    store.graveyard = data.graveyard || [];
    store.timeMachine = data.timeMachine || [];
    store.settings = { mature: true, ...(data.settings || {}) };
  } catch (e) { /* ignore a corrupt or blocked save */ }
}

// MARK: Small helpers

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const h = (fn) => { handlers.push(fn); return handlers.length - 1; };
const statColor = (v) => (v < 25 ? "var(--bad)" : v < 50 ? "var(--warn)" : v < 75 ? "var(--ok)" : "var(--good)");

function statBar(label, emoji, value) {
  return `<div class="stat"><span>${emoji}</span><span class="stat-label">${esc(label)}</span>
    <div class="bar" role="meter" aria-label="${esc(label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}"><i style="width:${Math.max(4, value)}%;background:${statColor(value)}"></i></div>
    <span class="stat-val">${value}%</span></div>`;
}

function row(emoji, title, sub, fn, opts = {}) {
  const dis = opts.disabled || !fn;
  return `<button class="row${opts.danger ? " danger" : ""}" ${dis ? "disabled" : `data-h="${h(fn)}"`}>
    <span class="row-emoji">${emoji}</span>
    <span class="row-main"><span class="row-title">${esc(title)}</span>${sub ? `<div class="row-sub">${esc(sub)}</div>` : ""}${opts.extra || ""}</span>
    ${opts.right != null ? `<span class="row-right">${opts.right}</span>` : opts.chev ? `<span class="chev">›</span>` : ""}
  </button>`;
}
const lv = (label, value, cls = "") => `<div class="lv"><span>${esc(label)}</span><span class="${cls}">${value}</span></div>`;
const section = (title, inner, foot, right) =>
  inner ? `<div class="sec"><div class="sec-title"><span>${esc(title)}</span>${right || ""}</div><div class="list">${inner}</div>${foot ? `<div class="sec-foot">${esc(foot)}</div>` : ""}</div>` : "";
const button = (label, fn, cls = "") => `<button class="btn ${cls}" data-h="${h(fn)}">${esc(label)}</button>`;

// MARK: Actions glue

const snap = (L) => ({ happiness: L.stats.happiness, health: L.stats.health, smarts: L.stats.smarts, looks: L.stats.looks, money: L.money });

/// What changed between two snapshots, as display chips.
function deltasBetween(a, b) {
  const out = [];
  for (const [k, emoji] of [["happiness", "😊"], ["health", "❤️"], ["smarts", "🧠"], ["looks", "✨"]]) {
    const d = b[k] - a[k];
    if (d) out.push({ text: `${emoji} ${d > 0 ? "+" : ""}${d}`, good: d > 0 });
  }
  const m = b.money - a.money;
  if (m) out.push({ text: `💵 ${m > 0 ? "+" : "-"}${formatMoney(Math.abs(m))}`, good: m > 0 });
  return out;
}

function act(fn) {
  const L = store.life;
  if (!L || !L.isAlive) return;
  const before = snap(L);
  const ids = relIds(L);
  const result = fn(L);
  queueNewNames(L, ids);
  if (!L.isAlive) store.graveyard.unshift(summaryOf(L));
  if (result) ui.outcome = { ...result, deltas: deltasBetween(before, snap(L)), dead: !L.isAlive };
  save();
  render();
}

function ageUpNow() {
  const L = store.life;
  if (!L || !L.isAlive || L.pendingEvents.length || (L.popups || []).length || (L.toName || []).length || ui.outcome || ui.choice) return;
  pushSnapshot(L);
  const ids = relIds(L);
  ageUp(L);
  queueNewNames(L, ids);
  if (!L.isAlive) store.graveyard.unshift(summaryOf(L));
  ui.openings = null;
  save();
  render(true);
}

function choose(title, message, options) { ui.choice = { title, message, options }; render(); }

/// Asks "protected or unprotected?" before any sexual action (adult characters only).
function askProtection(title, run) {
  choose(title, "Protected or unprotected?", [
    { label: "🛡️ Protected", fn: () => run(true) },
    { label: "⚠️ Unprotected", fn: () => run(false) },
    { label: "Never mind", secondary: true, fn: () => {} },
  ]);
}

function startLife(first, last, gender) {
  store.life = newLife(first, last, gender);
  store.life.mature = !!store.settings.mature;
  store.life.protection = true;
  ui.tab = "career"; ui.stack = []; ui.outcome = null; ui.choice = null; ui.openings = null;
  save();
  render(true);
}

// MARK: Render root

function render(scrollLog = false) {
  handlers = [];
  const app = document.getElementById("app");
  const sideScroll = app.querySelector(".side-body")?.scrollTop ?? 0;
  const logEl = app.querySelector(".log");
  const logScroll = logEl ? logEl.scrollTop : 0;
  const L = store.life;
  let html;
  if (!L) html = renderStart();
  else if (!L.isAlive) html = renderDeath(L);
  else html = renderGame(L);
  html += renderModals(L);
  app.innerHTML = html;
  const side = app.querySelector(".side-body");
  if (side) side.scrollTop = sideScroll;
  const log = app.querySelector(".log");
  if (log) log.scrollTop = scrollLog || ui.lastAgeShown !== L?.age ? log.scrollHeight : logScroll;
  ui.lastAgeShown = L?.age ?? -1;
  app.querySelector(".modal .choice")?.focus();
}

// MARK: Mature Mode

function setMature(on) {
  const apply = () => {
    store.settings.mature = on;
    if (store.life) { store.life.mature = on; if (store.life.protection == null) store.life.protection = true; }
    save();
  };
  if (!on) { apply(); render(); return; }
  choose("Turn on Mature Mode?", "Mature Mode adds drinking, hard drugs and sex (kept non-explicit) for adult characters. You must be 18 or older to play it.", [
    { label: "I'm 18 or older, turn it on", fn: apply },
    { label: "Cancel", secondary: true, fn: () => {} },
  ]);
}

function matureToggleRow() {
  const on = !!store.settings.mature;
  return row("🔞", `Mature Mode: ${on ? "On" : "Off"}`, on ? "Drinking, drugs and sex for adult characters" : "Adds drinking, drugs and sex (18+ only)", () => setMature(!on), { right: on ? "Turn off" : "Turn on" });
}

// MARK: Start screen

function renderStart() {
  const f = ui.form;
  const grave = store.graveyard.length
    ? section("Graveyard", store.graveyard.slice(0, 30).map((g) => {
      const r = Ribbons[g.ribbon] || Ribbons.average;
      return `<div class="row" style="cursor:default"><span class="row-emoji">${r[1]}</span><span class="row-main"><span class="row-title">${esc(g.name)}${(g.generation || 1) > 1 ? ` <span class="muted">· Gen ${g.generation}</span>` : ""}</span>
        <div class="row-sub">Died at ${g.ageAtDeath} from ${esc(g.causeOfDeath)} · ${r[0]} ribbon</div></span><span class="row-right">${formatMoney(g.netWorth)}</span></div>`;
    }).join(""))
    : "";
  return `<div class="center-wrap"><div class="card">
    <div class="brand"><h1>LifeSim</h1><p>Live a whole life, one year at a time.</p></div>
    ${store.settings.mature ? `<p class="muted" style="margin:0;font-size:13px">🔞 For players 18+. Mature Mode is on: adult characters can drink, do drugs and have (non-explicit) sex. You can turn it off under Settings below.</p>` : ""}
    <button class="age-btn big-go" data-h="${h(() => startLife())}">🎲 Start a random life</button>
    <button class="btn" data-h="${h(chooseRoyalStart)}">👑 Be born royal</button>
    <div class="sec"><div class="sec-title"><span>Or make your own</span></div>
      <div class="fields">
        <div class="field"><label for="f-first">First name</label><input id="f-first" value="${esc(f.first)}" placeholder="Random" autocomplete="off"></div>
        <div class="field"><label for="f-last">Last name</label><input id="f-last" value="${esc(f.last)}" placeholder="Random" autocomplete="off"></div>
      </div>
      <div class="seg" role="group" aria-label="Gender">
        <button class="btn" aria-pressed="${f.gender === "male"}" data-h="${h(() => { readForm(); f.gender = "male"; render(); })}">Male</button>
        <button class="btn" aria-pressed="${f.gender === "female"}" data-h="${h(() => { readForm(); f.gender = "female"; render(); })}">Female</button>
        <button class="btn primary" style="margin-left:auto" data-h="${h(() => { readForm(); startLife(f.first, f.last, f.gender); })}">Start this life</button>
      </div>
    </div>
    ${section("Settings", matureToggleRow())}
    ${grave}
  </div></div>`;
}
function readForm() {
  ui.form.first = document.getElementById("f-first")?.value ?? ui.form.first;
  ui.form.last = document.getElementById("f-last")?.value ?? ui.form.last;
}

// MARK: Death screen

function renderDeath(L) {
  const r = Ribbons[ribbonOf(L)];
  const heirs = heirsOf(L);
  const spouse = L.relationships.find((p) => p.kind === "spouse" && p.isAlive);
  return `<div class="center-wrap"><div class="card">
    <div class="tomb"><div class="stone">🪦</div><h1>Rest in Peace</h1><div style="font-size:20px">${esc(fullName(L))}</div>
      <div class="muted">Died at age ${L.age} from ${esc(L.causeOfDeath || "unknown causes")}.</div></div>
    <div class="ribbon"><div class="r-emoji">${r[1]}</div><b>${r[0]} Ribbon</b><span class="muted">${r[2]}</span></div>
    <div class="list">
      ${lv("Net worth", formatMoney(netWorth(L)))}
      ${lv("Education", eduLabel[L.education])}
      ${lv("Last job", esc(L.job ? L.job.title : L.isRetired ? "Retired" : "None"))}
      ${lv("Children", childrenOf(L).length)}
      ${lv("Spouse", esc(spouse ? relName(spouse) : "None"))}
      ${lv("Criminal record", L.criminalRecord.length ? `${L.criminalRecord.length} offense(s)` : "Clean")}
      ${lv("Generation", L.generation)}
    </div>
    ${heirs.length ? section("Continue as your child", heirs.map((c) => row(relEmoji(c), relName(c), `${relTitle(c)} · Age ${c.age}`, () => {
      store.life = continueAs(L, c); store.life.mature = !!store.settings.mature; store.life.protection = true; ui.stack = []; ui.tab = "career"; ui.openings = null; save(); render(true);
    }, { chev: true })).join(""), "Your money is split between your living children.") : ""}
    ${snapshotsFor(L).length ? section("⏳ Time Machine", timeMachineRows(L), "Not ready to go? Go back in time and live it differently.") : ""}
    <button class="age-btn" data-h="${h(() => { store.life = null; save(); render(); })}">Start a new life</button>
  </div></div>`;
}

// MARK: Game screen

function subtitleOf(L) {
  if (inPrison(L)) return `Inmate · ${plural(L.prisonYearsLeft, "year")} left`;
  if (L.royal && !L.royal.renounced) return `${royalTitle(L)} of ${L.royal.country}`;
  if (L.job) return `${L.job.title} at ${L.job.company}`;
  const s = schoolName(L);
  if (s) return `Student · ${s}`;
  if (L.isRetired) return "Retired";
  return L.age < 5 ? `${L.city}, ${L.country}` : "Unemployed";
}

function renderGame(L) {
  const s = L.stats;
  const chips = [];
  chips.push(`<span class="chip">📍 ${esc(L.city)}</span>`);
  if (L.generation > 1) chips.push(`<span class="chip">Gen ${L.generation}</span>`);
  if (L.fame > 0) chips.push(`<span class="chip">⭐ Fame ${L.fame}%</span>`);
  if (L.followers > 0) chips.push(`<span class="chip">📱 ${formatCount(L.followers)}</span>`);
  for (const id of L.illnesses) chips.push(`<span class="chip warn">🤒 ${esc(Illnesses[id].name.replace(/^an? /, ""))}</span>`);
  for (const a of L.addictions) chips.push(`<span class="chip bad">⚠️ ${esc(Addictions[a])}</span>`);
  if (inPrison(L)) chips.push(`<span class="chip bad">🔒 In prison</span>`);
  if (L.mature) chips.push(`<span class="chip">🔞 Mature</span>`);
  if (L.pregnancy) chips.push(`<span class="chip warn">🤰 ${L.pregnancy.carrier === "me" ? "Pregnant" : `${esc(L.pregnancy.partnerName)} is pregnant`} · due next year</span>`);

  const blocked = L.pendingEvents.length > 0 || (L.popups || []).length > 0;
  const tabs = [["career", "💼", inPrison(L) ? "Prison" : "Career"], ["assets", "🏠", "Money"], ["people", "❤️", "People"], ["activities", "🎯", "Activities"], ["packs", "🎁", "Packs"], ["profile", "🪪", "Profile"], ["god", "⚡", "God"]];

  return `<div class="game">
    <aside class="pane me" aria-label="You">
      <div class="who"><div class="avatar" aria-hidden="true">${lifeEmoji(L)}</div>
        <div style="min-width:0"><div class="who-name">${esc(fullName(L))}</div><div class="who-sub">${esc(subtitleOf(L))}</div></div></div>
      <div class="age-row"><div><div class="age-cap">Age</div><div class="age-num">${L.age}</div></div>
        <div class="money"><div class="age-cap">Bank</div><b class="${L.money < 0 ? "neg" : "pos"}">${formatMoney(L.money)}</b></div></div>
      <div class="age-dock"><button class="age-btn" ${blocked ? "disabled" : ""} data-h="${h(ageUpNow)}">＋ Age up <span class="kbd">Space</span></button></div>
      <div class="stats">
        ${statBar("Happiness", "😊", s.happiness)}${statBar("Health", "❤️", s.health)}${statBar("Smarts", "🧠", s.smarts)}${statBar("Looks", "✨", s.looks)}
      </div>
      <div class="chips">${chips.join("")}</div>
      <div class="me-foot">${button("New life", () => choose("Start a new life?", `${fullName(L)} will be sent to the graveyard.`, [
        { label: "Abandon this life", danger: true, fn: () => { L.causeOfDeath = "unknown causes"; store.graveyard.unshift(summaryOf(L)); store.life = null; save(); } },
        { label: "Keep playing", secondary: true, fn: () => {} },
      ]), "small danger")}</div>
    </aside>

    <section class="pane story" aria-label="Your life story">
      <div class="story-head"><h2>Your story</h2><span>${plural(L.log.length, "year")} lived</span></div>
      <div class="log">${L.log.map((y, i) => `<div class="year${i === L.log.length - 1 ? " latest" : ""}"><div class="year-age">${y.age}<small>${y.age === 1 ? "year" : "years"}</small></div>
        <div>${y.entries.length ? y.entries.map((e) => `<p>${esc(e)}</p>`).join("") : `<p class="quiet">Nothing much happened.</p>`}</div></div>`).join("")}</div>
    </section>

    <section class="pane side" aria-label="Things you can do">
      <div class="tabs" role="tablist">${tabs.map(([id, em, label]) => `<button class="tab" role="tab" aria-selected="${ui.tab === id}" data-h="${h(() => { ui.tab = id; ui.stack = []; render(); })}"><span>${em}</span>${label}</button>`).join("")}</div>
      <div class="side-body">${renderSide(L)}</div>
    </section>
  </div>`;
}

function renderSide(L) {
  const top = ui.stack[ui.stack.length - 1];
  if (top) {
    const back = `<button class="back" data-h="${h(() => { ui.stack.pop(); render(); })}">‹ Back</button>`;
    return back + renderSubview(L, top);
  }
  switch (ui.tab) {
    case "career": return inPrison(L) ? renderPrison(L) : renderCareer(L);
    case "assets": return renderAssets(L);
    case "people": return renderPeople(L);
    case "activities": return inPrison(L) ? renderPrison(L) : renderActivities(L);
    case "profile": return renderProfile(L);
    case "god": return renderGodMode(L);
    case "packs": return renderPacks(L);
  }
  return "";
}

function push(view) { ui.stack.push(view); render(); }

// MARK: Career tab

function renderCareer(L) {
  let html = "";

  // Education
  let edu = lv("Highest education", eduLabel[L.education]);
  if (L.major) edu += lv("Major", esc(L.major));
  if (L.graduateDegrees.length) edu += lv("Degrees", L.graduateDegrees.map((f) => GraduateFields[f].degreeName).join(", "));
  if (L.studentLoans > 0) edu += lv("Student loans", formatMoney(L.studentLoans), "money-neg");
  const school = schoolName(L);
  if (school) {
    const g = L.enrollment ? L.enrollment.grades : L.schoolGrades;
    edu += lv("Attending", esc(school)) + lv("Grades", `${gradeLetter(g)} (${g}%)`);
    edu += row("📝", "Study harder", "Improve your grades", () => act(studyHarder));
    if (inGradeSchool(L)) {
      edu += lv("Popularity", `${L.popularity}%`);
      if (L.clubs.length) edu += lv("Clubs", esc(L.clubs.join(", ")));
      edu += row("🏫", "Join a club", "Sports, drama, debate & more", () => choose("Join a club", null, schoolClubs.map(([n, e]) => ({ label: `${e} ${n}`, fn: () => act((x) => joinClub(x, n)) }))), { chev: true });
      edu += row("🛹", "Skip school", null, () => act(skipSchool));
    }
    if (L.age >= 16 || L.enrollment) edu += row("🚪", "Drop out", null, () => act(dropOut), { danger: true });
  }
  if (canEnrollInUniversity(L)) {
    edu += row("🏛️", "Enroll in university", `4 years · ${formatMoney(universityTuitionPerYear)}/yr`, () =>
      choose("Choose a major", "Your major decides which careers you can apply for.", universityMajors.map((m) => ({ label: m, fn: () => act((x) => enrollUniversity(x, m)) }))), { chev: true });
  }
  for (const [id, f] of Object.entries(GraduateFields)) {
    if (canEnrollGraduate(L, id)) edu += row("🎓", `Apply to ${f.schoolName}`, `${f.years} years · ${formatMoney(f.tuition)}/yr`, () => act((x) => enrollGraduate(x, id)));
  }
  html += section("Education", edu);

  // Current job
  if (L.job) {
    const j = L.job;
    const t = jobTemplate(L);
    let cur = lv("Title", esc(j.title)) + lv("Company", esc(j.company)) + lv("Salary", `${formatMoney(j.salary)}/yr`) + lv("Years", `${j.years} (${j.yearsInLevel} in this role)`);
    cur += `<div class="pad">${statBar("Performance", "📊", j.performance)}${L.fame > 0 ? statBar("Fame", "⭐", L.fame) : ""}</div>`;
    html += section("Current job", cur);

    if (hasCareerPath(t)) {
      const ladder = currentLadder(L);
      let rungs = ladder.map((rung, i) => `<div class="lv"><span style="color:inherit">${i < j.level ? "✅" : i === j.level ? "📍" : "🔒"} <span class="${i > j.level ? "muted" : ""}" style="${i === j.level ? "font-weight:700" : ""}">${esc(rung)}</span></span><span class="muted">${formatMoney(jobSalary(L, i))}</span></div>`).join("");
      const b = branchOf(t);
      if (b && !j.track) rungs += `<div class="lv"><span>🔀 Then: ${b.tracks.map((tr) => tr.name).join(", ")}</span><span></span></div>`;
      html += section("Career ladder", rungs);
    }

    if (mustChooseTrack(L)) {
      const tracks = branchOf(t).tracks.map((tr) => {
        const ok = meetsTrack(L, tr);
        return row(tr.emoji, tr.name, tr.blurb, () => act((x) => chooseTrack(x, tr)), {
          extra: `<div class="row-sub ${ok ? "" : "red"}">${esc(trackRequirementText(tr))} · Starts as ${esc(tr.titles[0])}</div>`,
        });
      }).join("");
      html += section("Choose your path", tracks, "Needs a year in your current role and decent performance. Specialist units are selective, so you may need to apply more than once.");
    }

    let work = availableJobActions(L).map((a) => {
      const used = hasUsedAction(L, a);
      return row(a.emoji, a.title, used ? "Done this year" : null, () => act((x) => performJobAction(x, a)), { disabled: used });
    }).join("");
    const ladder = currentLadder(L);
    if (!mustChooseTrack(L) && j.level < ladder.length - 1) work += row("🪜", "Ask for a promotion", `Next: ${ladder[j.level + 1]}`, () => act(askForPromotion));
    work += row("💵", "Ask for a raise", null, () => act(askForRaise));
    if (canRetire(L)) work += row("🏖️", "Retire", "Collect a pension", () => act(retire));
    work += row("🚪", "Quit job", null, () => choose("Quit your job?", `You'll stop earning ${formatMoney(j.salary)} a year.`, [
      { label: "Quit", danger: true, fn: () => act(quitJob) }, { label: "Stay", secondary: true, fn: () => {} },
    ]), { danger: true });
    html += section("At work", work, "Each work action can be done once per year. Risky ones can get you fired, hurt or arrested.");
  } else if (L.isRetired) {
    html += section("Retirement", lv("Pension", `${formatMoney(L.pension)}/yr`));
  }

  // Gigs
  if (L.age >= 10) {
    html += section("Freelance gigs", Gigs.map((g) => row(g.emoji, g.title,
      L.age < g.minAge ? `Available at ${g.minAge}` : `${formatMoney(g.pay[0])}–${formatMoney(g.pay[1])}`,
      () => act((x) => doGig(x, g)), { disabled: !canDoGig(L, g) })).join(""), `Up to 3 gigs per year. ${Math.max(0, 3 - count(L, "gigsThisYear"))} left this year.`);
  }

  // Openings
  if (L.age >= 14) {
    if (!ui.openings) ui.openings = jobListings(L);
    const rows = ui.openings.map((o) => {
      const t = o.template;
      const ok = meetsRequirements(L, t);
      const tags = (t.partTime ? " (Part-time)" : "") + (t.famous ? " ⭐" : "") + (t.military ? " 🪖" : "");
      return row("", entryTitle(t) + tags, o.company, () => act((x) => applyForJob(x, o)), {
        extra: `${hasCareerPath(t) ? `<div class="row-sub">Career path up to ${esc(topTitle(t))}</div>` : ""}<div class="row-sub ${ok ? "" : "red"}">${esc(requirementText(t))}</div>`,
        right: `<span class="money-pos">${formatMoney(o.salary)}</span>`,
      });
    }).join("").replaceAll('<span class="row-emoji"></span>', "");
    html += section("Job openings", rows, null, button("Refresh", () => { ui.openings = jobListings(L); render(); }, "small"));
  } else {
    html += section("Jobs", `<div class="pad muted">You're too young to work. Come back when you're 14!</div>`);
  }
  return html;
}

// MARK: Prison

function renderPrison(L) {
  let html = section(`Prison · ${plural(L.prisonYearsLeft, "year")} left`, PrisonActions.map((a) => row(a.emoji, a.title, null, () => act((x) => prisonAction(x, a.id)))).join(""));
  html += renderPrisonPack(L);
  if (L.criminalRecord.length) html += section("Criminal record", L.criminalRecord.map((c) => `<div class="pad">${esc(c)}</div>`).join(""));
  return html;
}

// MARK: Assets tab

function renderAssets(L) {
  let fin = lv("Bank balance", formatMoney(L.money), L.money < 0 ? "money-neg" : "money-pos") + lv("Net worth", formatMoney(netWorth(L)));
  if (L.studentLoans > 0) fin += lv("Student loans", formatMoney(L.studentLoans), "money-neg");
  if (L.job) fin += lv("Salary (after tax)", `${formatMoney(Math.trunc(L.job.salary * 0.75))}/yr`);
  if (spouseContribution(L) > 0) fin += lv("Spouse contributes", `+${formatMoney(spouseContribution(L))}/yr`, "money-pos");
  if (childExpenses(L) > 0) fin += lv("Child expenses", `-${formatMoney(childExpenses(L))}/yr`, "money-neg");
  let html = section("Finances", fin);

  const stuff = L.assets.length
    ? L.assets.map((a) => row(assetEmoji(a.kind), a.name, a.loan > 0 ? `Loan: ${formatMoney(a.loan)}` : `Bought for ${formatMoney(a.purchasePrice)}`, () =>
      choose(`Sell your ${a.name}?`, `It's worth ${formatMoney(a.value)} today${a.loan > 0 ? `, and ${formatMoney(a.loan)} goes to paying off the loan` : ""}.`, [
        { label: `Sell for ${formatMoney(a.value)}`, fn: () => act((x) => sellAsset(x, a.id)) }, { label: "Keep it", secondary: true, fn: () => {} },
      ]), { right: formatMoney(a.value) })).join("")
    : `<div class="pad muted">You don't own anything yet.</div>`;
  html += section("My stuff", stuff, L.assets.length ? "Houses cost 1% of their value a year to keep up; cars and boats cost 5%. Click one to sell it." : null);

  let shop;
  if (L.age < 18) shop = `<div class="pad muted">You can start buying property and cars at 18.</div>`;
  else if (inPrison(L)) shop = `<div class="pad muted">You can't go shopping from prison.</div>`;
  else shop = row("🏡", "Real estate", "Buy a home, with cash or a mortgage", () => push({ type: "market", kind: "house" }), { chev: true })
    + row("🚘", "Car dealership", L.hasDriversLicense ? "Buy a ride" : "Requires a driver's license", () => push({ type: "market", kind: "car" }), { chev: true })
    + row("⛵", "Boat dealership", "Hit the water", () => push({ type: "market", kind: "boat" }), { chev: true });
  html += section("Shopping", shop);
  return html;
}

function renderMarket(L, view) {
  if (!view.listings) view.listings = marketListings(view.kind);
  const title = { house: "Real estate", car: "Car dealership", boat: "Boat dealership" }[view.kind];
  const rows = view.listings.map((l) => {
    const fin = canFinance(L, l);
    const affordable = L.money >= l.price || fin;
    const buy = (financed) => act((x) => {
      const before = x.assets.length;
      const r = buyAsset(x, l, financed);
      if (x.assets.length > before) view.listings = view.listings.filter((y) => y.id !== l.id);
      return r;
    });
    return row(assetEmoji(l.kind), l.name, fin ? `Mortgage available · ${formatMoney(Math.trunc(l.price / 5))} down` : null, () => {
      if (!fin) return buy(false);
      const opts = [];
      if (L.money >= l.price) opts.push({ label: `Pay ${formatMoney(l.price)} cash`, fn: () => buy(false) });
      opts.push({ label: `Mortgage (${formatMoney(Math.trunc(l.price / 5))} down)`, fn: () => buy(true) });
      opts.push({ label: "Cancel", secondary: true, fn: () => {} });
      choose(`Buy the ${l.name}?`, `Price: ${formatMoney(l.price)}. A mortgage is paid off over about 12 years.`, opts);
    }, { disabled: !affordable, right: `<span class="${affordable ? "money-pos" : "money-neg"}">${formatMoney(l.price)}</span>` });
  }).join("");
  return section(title, lv("Bank balance", formatMoney(L.money)) + rows);
}

// MARK: People tab

function renderPeople(L) {
  const supportFoot = isLonely(L)
    ? "You're lonely. Make friends or find a partner; loneliness drags your happiness down every year."
    : socialSupport(L) >= 70 ? "The people in your life have your back. Strong relationships boost your happiness every year."
    : "Spend time with people to keep bonds strong. Relationships you ignore for 2+ years fade.";
  let html = section("Social support", `<div class="pad">${statBar("Support", "🫂", socialSupport(L))}</div>`, supportFoot);

  if (!inPrison(L)) {
    let meet = "";
    if (canFindDate(L)) meet += row("❤️", "Find a date", "Look for love", () => choose("Who are you interested in?", null, [
      { label: "Men", fn: () => act((x) => findDate(x, "male")) }, { label: "Women", fn: () => act((x) => findDate(x, "female")) },
    ]), { chev: true });
    if (canHookUp(L)) meet += row("🔥", "Hook up", romanticPartner(L) ? "Cheat on your partner..." : "No strings attached", () => act(hookUp));
    if (L.age >= 5) meet += row("🤝", "Make a friend", null, () => act(makeFriend));
    if (L.age >= 8) meet += row("🐾", "Pet shelter", "Adopt a pet · $200", () => choose("Adopt a pet", null, Names.petSpecies.map((sp) => ({ label: `${petEmoji[sp]} ${sp}`, fn: () => act((x) => adoptPet(x, sp)) }))), { chev: true });
    if (canAdoptChild(L)) meet += row("🍼", "Adopt a child", "Agency fees · $10,000", () => act(adoptChild));
    html += section("Meet people", meet);
  }

  if (isMature(L) && !inPrison(L)) {
    const partner = romanticPartner(L);
    const adultFriends = L.relationships.filter((p) => p.isAlive && p.kind === "friend" && p.age >= 18);
    let love = "";
    if (partner && partner.age >= 18) love += row("🔥", `Have sex with ${partner.firstName}`, L.pregnancy ? "A baby is already on the way" : "Unprotected sex can lead to a baby", () => askProtection(`Have sex with ${partner.firstName}?`, (safe) => act((x) => haveSex(x, partner.id, safe))), { chev: true });
    love += row("🍸", "One-night stand", partner ? "Cheat on your partner..." : "Find someone at a bar", () => askProtection("One-night stand", (safe) => act((x) => oneNightStand(x, safe))), { chev: true });
    love += row("📱", "Dating app hookup", "Swipe right", () => askProtection("Dating app hookup", (safe) => act((x) => datingAppHookup(x, safe))), { chev: true });
    if (adultFriends.length) love += row("😏", "Friends with benefits", "Ask a friend", () => choose("Who do you ask?", null, adultFriends.map((f) => ({ label: relName(f), fn: () => askProtection(`Friends with benefits with ${f.firstName}`, (safe) => act((x) => friendsWithBenefits(x, f.id, safe))) }))), { chev: true });
    love += row("💃", "Strip club", "$250", () => act(stripClub));
    html += section("Love life 🔞", love, `${count(L, "partners")} partners so far.`);
  }

  const groups = [
    ["Family", (p) => isParent(p.kind) || p.kind === "sibling"],
    ["Love", (p) => isRomantic(p.kind)],
    ["Children", (p) => p.kind === "child"],
    ["Friends", (p) => p.kind === "friend"],
    ["School", (p) => p.kind === "classmate" || p.kind === "teacher"],
    ["Exes", (p) => p.kind === "ex"],
    ["Pets", (p) => p.kind === "pet"],
  ];
  for (const [title, test] of groups) {
    const people = L.relationships.filter(test);
    if (!people.length) continue;
    html += section(title, people.map((p) => personRow(L, p)).join(""));
  }
  return html;
}

function personRow(L, p) {
  const parts = [p.isAlive ? `${relTitle(p)} · Age ${p.age}` : `${relTitle(p)} · Deceased`];
  if (p.isAlive) {
    const st = relStatus(p);
    if (st) parts.push(st);
    if (p.trait) parts.push(Traits[p.trait][0]);
    if ((yearsSinceContact(p, L.age) ?? 0) >= 2) parts.push("💤 Neglected");
  }
  const bar = p.isAlive ? `<div class="mini-bar"><i style="width:${p.bond}%;background:${statColor(p.bond)}"></i></div>` : "";
  return row(relEmoji(p), relName(p), parts.join(" · "), () => push({ type: "person", id: p.id }), { extra: bar, chev: true });
}

function renderPerson(L, view) {
  const p = findRel(L, view.id);
  if (!p) return `<div class="pad muted">They're no longer in your life.</div>`;
  let html = `<div class="hero-person"><div class="big">${relEmoji(p)}</div><h3>${esc(relName(p))}</h3><div class="muted">${esc(relTitle(p))} · ${p.isAlive ? `Age ${p.age}` : "Deceased"}</div></div>`;
  if (p.isAlive) {
    html += `<div class="list pad">${statBar("Relationship", "💞", p.bond)}${p.species ? "" : statBar("Looks", "✨", p.looks)}</div>`;
  }
  if (p.isAlive && !p.species) {
    let about = "";
    const st = relStatus(p);
    if (st) about += lv("Status", st);
    if (p.trait) about += `<div class="pad"><b>${Traits[p.trait][0]} ${cap(p.trait)}</b><div class="row-sub">${Traits[p.trait][1]}</div></div>`;
    if (p.occupation) about += lv("Occupation", esc(p.salary > 0 ? `${p.occupation} · ${formatMoney(p.salary)}/yr` : p.occupation));
    if (isRomantic(p.kind) && p.yearsTogether > 0) about += lv("Together", plural(p.yearsTogether, "year"));
    const ys = yearsSinceContact(p, L.age);
    if (ys != null) about += lv("Last talked", ys <= 0 ? "This year" : `${plural(ys, "year")} ago`, ys >= 2 ? "red" : "");
    html += section(`About ${p.firstName}`, about);
  }
  if (p.history && p.history.length) {
    html += section("Memories", p.history.slice().reverse().map((h) => `<div class="lv"><span>Age ${h.age}</span><span style="font-weight:400;text-align:left;flex:1;margin-left:12px">${esc(h.text)}</span></div>`).join(""));
  }
  const actions = relationshipActions(L, p);
  if (p.isAlive && p.kind === "child" && !inPrison(L)) actions.push("rename");
  if (actions.length) {
    html += section("Interact", actions.map((a) => {
      let run = () => act((x) => performRelAction(x, a, p.id));
      if (a === "rename") run = () => { requestName(L, "rel", p.id); save(); render(); };
      if (a === "haveSex") run = () => askProtection(`Have sex with ${p.firstName}?`, (safe) => act((x) => haveSex(x, p.id, safe)));
      if (a === "hookUpWith") run = () => askProtection(`Hook up with ${p.firstName}?`, (safe) => act((x) => hookUpWithPerson(x, p.id, safe)));
      const fn = a === "murder" || a === "breakUp"
        ? () => choose(a === "murder" ? `Murder ${p.firstName}?` : `${p.kind === "spouse" ? "Divorce" : "Break up with"} ${p.firstName}?`,
          a === "murder" ? "This can't be undone, and you may spend decades in prison." : null,
          [{ label: RelActions[a], danger: true, fn: run }, { label: "Cancel", secondary: true, fn: () => {} }])
        : run;
      return row("", RelActions[a] || EXTRA_REL[a] || PetExtraActions[a], null, fn, { danger: hostileActions.has(a) || a === "disrespect" });
    }).join("").replaceAll('<span class="row-emoji"></span>', ""));
  } else if (p.isAlive && inPrison(L)) {
    html += `<div class="muted pad">You can't visit anyone while you're in prison.</div>`;
  }
  return html;
}

// MARK: Activities tab

function renderActivities(L) {
  let html = "";
  if (L.age < 13) {
    html += section("Kid stuff", KidActivities.filter((a) => L.age >= a.min).map((a) => row(a.emoji, a.title, a.sub, () => act((x) => doKidActivity(x, a.id)))).join("") || `<div class="pad muted">You're a baby. Enjoy it!</div>`);
  }
  for (const [title, ids] of ActivityGroups.slice(0, 1)) html += activitySection(L, title, ids);

  let health = Treatments.map((t) => {
    const ok = t.id !== "therapist" || L.age >= 10;
    return row(t.emoji, t.title, formatMoney(t.cost), () => act((x) => treat(x, t)), { disabled: !ok });
  }).join("");
  if (L.addictions.length) health += row("🏥", "Rehab", "Beat your addictions · $15,000", () => act(goToRehab));
  const problems = L.illnesses.map((i) => Illnesses[i].name).concat(L.addictions.map((a) => Addictions[a]));
  html += section("Health", health, problems.length ? `Conditions: ${problems.join(", ")}` : "You're in good health.");

  html += section("Social media", row("📱", "Post on social media", canPostOnSocialMedia(L) ? `${formatCount(L.followers)} followers` : "Available at 13", () => act(postOnSocialMedia), { disabled: !canPostOnSocialMedia(L) }));
  for (const [title, ids] of ActivityGroups.slice(1)) html += activitySection(L, title, ids);
  if (isMature(L)) {
    html += section("Bar 🔞", Drinks.map((d) => row(d.emoji, d.title, formatMoney(d.cost), () => act((x) => haveDrink(x, d.id)))).join(""),
      `You've had ${count(L, "drinks")} drinking nights. The more you drink, the likelier you are to get hooked.`);
    html += section("Drugs 🔞", Drugs.map((d) => row(d.emoji, d.title, `${formatMoney(d.cost)} · ${d.od >= 0.03 ? "Very dangerous" : d.addict >= 0.15 ? "Highly addictive" : d.trip ? "Bad trips happen" : "Risky"}`, () => act((x) => takeDrug(x, d.id)))).join("")
      + row("💰", "Deal drugs", "Big money, big risk of prison", () => act(dealDrugs), { danger: true }),
      "Drugs can get you hooked, arrested, or killed. Rehab is in the Health section.");
  }

  let more = row("🎰", "Casino", L.age >= 18 ? "Blackjack, roulette, slots & horses" : "Available at 18", () => push({ type: "casino" }), { disabled: L.age < 18, chev: true });
  if (canTakeDrivingTest(L)) more += row("🚦", "Driving test", "Get your license", () => act(takeDrivingTest));
  more += row("✈️", "Emigrate", L.age >= 18 ? `${WORLD.length} countries · from $2,000` : "Available at 18", () => { ui.emigrateCountry = null; push({ type: "emigrate" }); }, { disabled: L.age < 18, chev: true });
  html += section("More", more);

  html += section("Crime", Crimes.map((c) => {
    const ok = L.age >= c.minAge;
    return row(c.emoji, c.title, ok ? `Risky · ${Math.round(c.catchChance * 100)}% chance of getting caught` : `Available at ${c.minAge}`, () => act((x) => commitCrime(x, c.id)), { disabled: !ok });
  }).join(""), "Crime pays... until it doesn't. Adults who get caught go to prison.");
  if (L.criminalRecord.length) html += section("Criminal record", L.criminalRecord.map((c) => `<div class="pad">${esc(c)}</div>`).join(""));
  return html;
}

function activitySection(L, title, ids) {
  return section(title, ids.map((id) => {
    const [t, e, sub, min] = Activities[id];
    const ok = canDoActivity(L, id);
    return row(e, t, ok ? sub : `Available at ${min}`, () => act((x) => performActivity(x, id)), { disabled: !ok });
  }).join(""));
}

function renderCasino(L) {
  const bets = `<div class="pad seg">${casinoBets.map((b) => `<button class="btn small" aria-pressed="${ui.bet === b}" data-h="${h(() => { ui.bet = b; render(); })}">${formatMoney(b)}</button>`).join("")}</div>`;
  let html = section("Casino", lv("Bank balance", formatMoney(L.money)) + bets, "Pick your bet, then a game.");
  html += section("Games", CasinoGames.map((g) => row(g.emoji, g.title, `Pays ${g.payout}× · ${Math.round(g.chance * 100)}% chance`, () => act((x) => gamble(x, g.id, ui.bet)), { disabled: L.money < ui.bet })).join(""));
  return html;
}

function renderEmigrate(L) {
  return renderWorldPicker(L);
}

// MARK: Profile tab

function renderProfile(L) {
  let about = lv("Lives in", esc(`${L.city}, ${L.country}`)) + lv("Gender", cap(L.gender)) + lv("Generation", L.generation)
    + lv("Education", eduLabel[L.education]) + lv("Occupation", esc(L.job ? L.job.title : L.isRetired ? "Retired" : schoolName(L) || "None"))
    + lv("Net worth", formatMoney(netWorth(L))) + lv("Driver's license", L.hasDriversLicense ? "Yes" : "No")
    + lv("Followers", formatCount(L.followers)) + lv("Partners", count(L, "partners")) + lv("Children", childrenOf(L).length);
  let html = section("About me", about);
  let health = "";
  if (!L.illnesses.length && !L.addictions.length) health = `<div class="pad muted">No health problems 💪</div>`;
  health += L.illnesses.map((i) => `<div class="pad">🤒 ${esc(Illnesses[i].name)}</div>`).join("");
  health += L.addictions.map((a) => `<div class="pad">⚠️ ${esc(Addictions[a])}</div>`).join("");
  html += section("Health", health);
  if (L.criminalRecord.length || inPrison(L)) {
    html += section("Criminal record", (inPrison(L) ? lv("In prison", `${plural(L.prisonYearsLeft, "year")} left`) : "") + L.criminalRecord.map((c) => `<div class="pad">${esc(c)}</div>`).join(""));
  }
  html += section("Settings", matureToggleRow());
  html += section("Ribbon so far", (() => { const r = Ribbons[ribbonOf(L)]; return `<div class="pad">${r[1]} <b>${r[0]}</b> <span class="muted">· ${r[2]}</span></div>`; })(),
    "The ribbon you earn is decided when you die.");
  return html;
}

function renderSubview(L, view) {
  switch (view.type) {
    case "person": return renderPerson(L, view);
    case "market": return renderMarket(L, view);
    case "casino": return renderCasino(L);
    case "emigrate": return renderEmigrate(L);
    case "godPerson": return renderGodPerson(L, view);
    case "business": return renderBusiness(L, view);
  }
  return "";
}

// MARK: Modals

function deltaChips(deltas) {
  if (!deltas || !deltas.length) return "";
  return `<div class="deltas">${deltas.map((d) => `<span class="delta ${d.good ? "up" : "down"}">${esc(d.text)}</span>`).join("")}</div>`;
}

function card({ emoji, tag, title, body, deltas, buttons, tone = "" }) {
  return `<div class="scrim"><div class="modal event ${tone}" role="dialog" aria-modal="true" aria-labelledby="m-title" data-stop="1">
    <div class="event-head"><div class="event-emoji" aria-hidden="true">${emoji || "❗"}</div>${tag ? `<div class="modal-tag">${esc(tag)}</div>` : ""}<h3 id="m-title">${esc(title)}</h3></div>
    <div class="event-body"><p>${esc(body)}</p>${deltaChips(deltas)}<div class="choices">${buttons}</div></div></div></div>`;
}

function renderModals(L) {
  // 1. Choices the player must make (BitLife-style event cards).
  if (L && L.isAlive && L.pendingEvents.length) {
    const e = L.pendingEvents[0];
    const left = L.pendingEvents.length - 1;
    return card({
      emoji: e.emoji, tag: `Age ${L.age}${left ? ` · ${left} more` : ""}`, title: e.title, body: e.message,
      buttons: e.options.map((o, i) => `<button class="choice" data-h="${h(() => {
        const before = snap(L);
        const ids = relIds(L);
        const r = resolveEvent(L, e, i);
        queueNewNames(L, ids);
        if (!L.isAlive) store.graveyard.unshift(summaryOf(L));
        ui.outcome = { ...r, emoji: e.emoji, deltas: deltasBetween(before, snap(L)), dead: !L.isAlive };
        save();
        render();
      })}">${esc(o)}</button>`).join(""),
    });
  }
  // 2. Naming new babies, pets and businesses.
  if (L && L.isAlive && (L.toName || []).length) {
    const naming = renderNamingModal(L);
    if (naming) return naming;
  }
  // 3. The result of the last choice or action.
  if (ui.outcome) {
    const o = ui.outcome;
    const close = h(() => { ui.outcome = null; render(); });
    return card({
      emoji: o.dead ? "☠️" : o.emoji || "📣", title: o.title, body: o.message, deltas: o.deltas, tone: o.dead ? "dark" : "result",
      buttons: `<button class="choice" data-h="${close}">${o.dead ? "See my life" : "OK"}</button>`,
    });
  }
  // 3. News from the year that just passed.
  if (L && L.isAlive && (L.popups || []).length) {
    const n = L.popups[0];
    const next = h(() => { L.popups.shift(); save(); render(); });
    return card({
      emoji: n.emoji, tag: `Age ${L.age}${L.popups.length > 1 ? ` · ${L.popups.length - 1} more` : ""}`, title: n.title, body: n.message, tone: "news",
      buttons: `<button class="choice" data-h="${next}">${L.popups.length > 1 ? "Next" : "OK"}</button>`,
    });
  }
  // 4. Pickers and confirmations.
  if (ui.choice) {
    const c = ui.choice;
    return `<div class="scrim" data-h="${h(() => { ui.choice = null; render(); })}"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="m-title" data-stop="1">
      <h3 id="m-title">${esc(c.title)}</h3>${c.message ? `<p class="muted">${esc(c.message)}</p>` : ""}
      <div class="choices">${c.options.map((o) => `<button class="choice${o.danger ? " danger" : o.secondary ? " secondary" : ""}" data-h="${h(() => { ui.choice = null; o.fn(); render(); })}">${esc(o.label)}</button>`).join("")}</div></div></div>`;
  }
  return "";
}

// MARK: Boot

function onClick(e) {
  const stop = e.target.closest("[data-stop]");
  const el = e.target.closest("[data-h]");
  if (!el) return;
  if (stop && !stop.contains(el)) return;
  if (stop && el.classList.contains("scrim")) return; // click inside the modal box, not on the backdrop
  const fn = handlers[Number(el.dataset.h)];
  if (fn) fn();
}

function onKey(e) {
  if (e.key === "Enter" && e.target.id === "name-input") { e.preventDefault(); document.querySelector("[data-name-ok]")?.click(); return; }
  if (e.target.closest("input, textarea, select")) return;
  if (store.life?.toName?.length) return;
  if (e.key === " " || e.key === "Spacebar") {
    if (ui.outcome) { e.preventDefault(); ui.outcome = null; render(); return; }
    if (store.life?.popups?.length && !store.life.pendingEvents.length) { e.preventDefault(); store.life.popups.shift(); save(); render(); return; }
    if (store.life && store.life.isAlive && !ui.choice && !store.life.pendingEvents.length) { e.preventDefault(); ageUpNow(); }
  } else if (e.key === "Escape") {
    if (ui.outcome || ui.choice) { ui.outcome = null; ui.choice = null; render(); }
    else if (store.life?.popups?.length && !store.life.pendingEvents.length) { store.life.popups.shift(); save(); render(); }
    else if (ui.stack.length) { ui.stack.pop(); render(); }
  }
}

function start(data) {
  if (data && data.store) { store.life = data.store.life; store.graveyard = data.store.graveyard || []; }
  else load();
  document.addEventListener("click", onClick);
  document.addEventListener("keydown", onKey);
  document.addEventListener("input", onGodInput);
  document.addEventListener("change", onGodChange);
  document.addEventListener("input", onWorldSearch);
  render(true);
}

window.claude?.hot?.snapshot?.(() => ({ store }));
if (window.claude?.hot?.ready) window.claude.hot.ready(start);
else start(window.claude?.hot?.data ?? null);
