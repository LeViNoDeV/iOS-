// LifeSim God Mode: edit your stats, money and identity, edit the people in your life,
// and use the Time Machine to rewind up to five years (even after you die).
// Loaded before ui.js; these functions use ui.js globals (store, ui, render, act...) when called.
"use strict";

const TIME_MACHINE_YEARS = 5;

// MARK: Time Machine

/// Saves a copy of the life before each birthday so you can come back to it.
function pushSnapshot(L) {
  store.timeMachine = store.timeMachine || [];
  const { popups, pendingEvents, ...rest } = L;
  store.timeMachine.push({ lifeId: L.id, age: L.age, data: JSON.stringify({ ...rest, popups: [], pendingEvents: [] }) });
  while (store.timeMachine.length > TIME_MACHINE_YEARS) store.timeMachine.shift();
}

function snapshotsFor(L) {
  return (store.timeMachine || []).filter((s) => s.lifeId === L.id).slice().reverse();
}

function travelTo(snapshot) {
  const L = store.life;
  const restored = JSON.parse(snapshot.data);
  // Coming back from the dead: forget the graveyard entry for this life.
  if (L && !L.isAlive && store.graveyard[0] && store.graveyard[0].name === fullName(L)) store.graveyard.shift();
  store.timeMachine = (store.timeMachine || []).filter((s) => s.lifeId !== L.id || s.age < snapshot.age);
  record(restored, `⏳ I used the Time Machine to go back to age ${snapshot.age}.`);
  store.life = restored;
  ui.stack = []; ui.outcome = null; ui.choice = null; ui.openings = null; ui.tab = "god";
  save();
  render(true);
}

function timeMachineRows(L) {
  const snaps = snapshotsFor(L);
  if (!snaps.length) return `<div class="pad muted">Age up at least once to unlock the Time Machine.</div>`;
  return snaps.map((s) => row("⏳", `Go back to age ${s.age}`, `${plural(L.age - s.age, "year")} ago`, () =>
    choose(`Go back to age ${s.age}?`, "Everything that happened since then will be undone.", [
      { label: `Travel to age ${s.age}`, fn: () => travelTo(s) },
      { label: "Cancel", secondary: true, fn: () => {} },
    ]), { chev: true })).join("");
}

// MARK: Sliders

function godSlider(label, emoji, value, attrs, min = 0, max = 100) {
  const id = `god-${attrs.replace(/[^a-z0-9]/gi, "-")}`;
  return `<div class="god-slider"><label for="${id}">${emoji} ${esc(label)}</label>
    <input type="range" id="${id}" min="${min}" max="${max}" value="${value}" ${attrs}>
    <output>${value}</output></div>`;
}

function onGodInput(e) {
  const el = e.target;
  if (!el.matches("input[type=range][data-god]")) return;
  const outEl = el.parentElement.querySelector("output");
  if (outEl) outEl.textContent = el.value;
}

function onGodChange(e) {
  const el = e.target;
  if (!el.matches("[data-god]")) return;
  const L = store.life;
  if (!L) return;
  const value = el.type === "range" ? Number(el.value) : el.value;
  const [scope, field, id] = el.dataset.god.split(":");
  if (scope === "me") {
    if (field === "city") { const place = Names.places.find((p) => p[0] === value); if (place) { L.city = place[0]; L.country = place[1]; } }
    else if (field in L.stats) L.stats[field] = value;
    else L[field] = value;
  } else if (scope === "person") {
    const p = findRel(L, id);
    if (p) p[field] = field === "trait" ? (value || null) : value;
  }
  save();
  render();
}

// MARK: God Mode tab

function renderGodMode(L) {
  let html = `<div class="god-banner"><b>⚡ God Mode</b><span>Change anything about this life. Edits take effect right away.</span></div>`;

  // Stats
  const s = L.stats;
  html += section("Your stats", `<div class="pad god-sliders">
    ${godSlider("Happiness", "😊", s.happiness, 'data-god="me:happiness"')}
    ${godSlider("Health", "❤️", s.health, 'data-god="me:health"')}
    ${godSlider("Smarts", "🧠", s.smarts, 'data-god="me:smarts"')}
    ${godSlider("Looks", "✨", s.looks, 'data-god="me:looks"')}
    ${godSlider("Fame", "⭐", L.fame, 'data-god="me:fame"')}
    ${godSlider("Karma", "😇", clamp(L.karma, 0, 100), 'data-god="me:karma"')}
  </div>`);

  // Money & identity
  html += section("Money & identity", `
    <div class="pad god-form">
      <div class="field"><label for="god-money">Bank balance ($)</label><input id="god-money" type="number" step="1000" value="${L.money}"></div>
      ${button("Set", () => { const v = Number(document.getElementById("god-money").value); if (Number.isFinite(v)) { L.money = Math.round(v); save(); render(); } }, "small primary")}
    </div>
    <div class="pad god-form">
      <div class="field"><label for="god-first">First name</label><input id="god-first" value="${esc(L.firstName)}"></div>
      <div class="field"><label for="god-last">Last name</label><input id="god-last" value="${esc(L.lastName)}"></div>
      ${button("Rename", () => {
        const f = document.getElementById("god-first").value.trim(), l = document.getElementById("god-last").value.trim();
        if (f && l) { L.firstName = f; L.lastName = l; save(); render(); }
      }, "small primary")}
    </div>
    <div class="pad seg">
      <button class="btn small" aria-pressed="${L.gender === "male"}" data-h="${h(() => { L.gender = "male"; save(); render(); })}">Male</button>
      <button class="btn small" aria-pressed="${L.gender === "female"}" data-h="${h(() => { L.gender = "female"; save(); render(); })}">Female</button>
      <select class="btn small" data-god="me:city" aria-label="City">${Names.places.map((p) => `<option ${p[0] === L.city ? "selected" : ""}>${esc(p[0])}</option>`).join("")}</select>
    </div>`);

  // Quick fixes
  html += section("Miracles", [
    row("💊", "Cure everything", "Remove all illnesses and addictions", () => { L.illnesses = []; L.addictions = []; L.stats.health = Math.max(L.stats.health, 80); save(); render(); }, { disabled: !L.illnesses.length && !L.addictions.length }),
    row("🔓", "Get out of prison", inPrison(L) ? `${plural(L.prisonYearsLeft, "year")} left` : "You're free", () => { L.prisonYearsLeft = 0; record(L, "⚡ I was mysteriously released from prison."); save(); render(); }, { disabled: !inPrison(L) }),
    row("🧽", "Clear criminal record", `${L.criminalRecord.length} offense(s)`, () => { L.criminalRecord = []; save(); render(); }, { disabled: !L.criminalRecord.length }),
    row("💳", "Pay off all debts", "Student loans, mortgages and a negative balance", () => {
      L.studentLoans = 0; for (const a of L.assets) a.loan = 0; L.money = Math.max(0, L.money); save(); render();
    }, { disabled: !L.studentLoans && !L.assets.some((a) => a.loan) && L.money >= 0 }),
    row("🎓", "Instant degree", L.education === "graduate" ? "Already highly educated" : "Skip straight to a bachelor's degree", () => {
      if (eduRank(L.education) < 2) { L.education = "bachelor"; L.major = L.major || pick(universityMajors); }
      L.enrollment = null; save(); render();
    }, { disabled: L.age < 18 || eduRank(L.education) >= 2 }),
  ].join(""));

  // People
  const people = L.relationships.filter((p) => p.isAlive);
  html += section("People", people.length
    ? people.map((p) => row(relEmoji(p), relName(p), `${relTitle(p)} · Relationship ${p.bond}%`, () => push({ type: "godPerson", id: p.id }), { chev: true })).join("")
    : `<div class="pad muted">There's no one in your life right now.</div>`);

  html += section("Time Machine", timeMachineRows(L), `Go back up to ${TIME_MACHINE_YEARS} years. Works after death too.`);
  return html;
}

function renderGodPerson(L, view) {
  const p = findRel(L, view.id);
  if (!p) return `<div class="pad muted">They're no longer in your life.</div>`;
  let html = `<div class="hero-person"><div class="big">${relEmoji(p)}</div><h3>${esc(relName(p))}</h3><div class="muted">${esc(relTitle(p))} · Age ${p.age}</div></div>`;
  html += section("Edit", `<div class="pad god-sliders">
    ${godSlider("Relationship", "💞", p.bond, `data-god="person:bond:${p.id}"`)}
    ${(ensureNpcStats(p), p.species ? godSlider("Health", "❤️", p.health, `data-god="person:health:${p.id}"`) : NpcStats.map(([k, e, label]) => godSlider(label, e, p[k], `data-god="person:${k}:${p.id}"`)).join(""))}
  </div>
  ${p.species ? "" : `<div class="pad god-form"><div class="field"><label for="god-trait">Personality</label>
    <select id="god-trait" data-god="person:trait:${p.id}"><option value="">No strong trait</option>${Object.keys(Traits).map((t) => `<option value="${t}" ${p.trait === t ? "selected" : ""}>${Traits[t][0]} ${cap(t)}</option>`).join("")}</select></div></div>`}`);
  return html;
}
