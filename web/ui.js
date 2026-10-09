// LifeSim web UI: renders the game and wires clicks to engine actions.
"use strict";

const SAVE_KEY = "lifesim-save-v1";
const store = { life: null, graveyard: [], settings: { mature: true } };
const ui = {
  tab: "occupation", stack: [], sheetOpen: false, outcome: null, choice: null, openings: null, bet: 1000,
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
  if (!L || !L.isAlive || L.pendingEvents.length || (L.popups || []).length || (L.toName || []).length || ui.outcome || ui.choice || ui.candidate) return;
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

function startLife(first, last, gender, look) {
  ui.startView = null;
  store.life = newLife(first, last, gender);
  if (look) applyChosenLook(store.life, look);
  store.life.mature = !!store.settings.mature;
  store.life.protection = true;
  ui.tab = "occupation"; ui.stack = []; ui.outcome = null; ui.choice = null; ui.openings = null;
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
  const top = ui.stack[ui.stack.length - 1];
  const viewKey = `${store.life ? "game" : ui.startView || "start"}|${ui.tab}|${ui.sheetOpen}|${ui.stack.length}|${top ? top.type + (top.id || top.group || "") : ""}`;
  if (side) side.scrollTop = viewKey === ui.lastViewKey ? sideScroll : 0;
  ui.lastViewKey = viewKey;
  ui.sheetAnim = false;
  ui.lastMode = store.life ? layoutMode() : null;
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

function minigameToggleRow() {
  const on = store.settings.minigames !== false;
  return row("🎮", `Mini-games: ${on ? "On" : "Off"}`, on ? "Skill games for work, interviews, tests, the gym and crimes" : "Everything is left to luck", () => { store.settings.minigames = !on; save(); render(); }, { right: on ? "Turn off" : "Turn on" });
}

/// Which mini-game a work action uses (none for slacking, socializing or crooked actions).
function jobGameFor(L, a) {
  if (["coworkers", "slack"].includes(a.id) || a.karma < 0 || a.prison) return null;
  return jobProfile(jobTemplate(L)).game;
}
const CrimeGames = {
  shoplift: ["catch", { target: "🛍️", title: "Grab it while nobody's looking" }],
  porchPirate: ["catch", { target: "📦", title: "Snatch the packages" }],
  pickpocket: ["catch", { target: "👛", title: "Lift the wallet" }],
  burglary: ["timing", { verb: "Turn!", title: "Pick the lock", zone: 0.13 }],
  carTheft: ["timing", { verb: "Spark!", title: "Hotwire the car", zone: 0.12 }],
  trainRobbery: ["memory", { pads: ["🚂", "💰", "🧨", "🐎"], title: "Follow the plan" }],
  bankRobbery: ["memory", { pads: ["🔫", "💰", "🚪", "🚗"], title: "Follow the plan" }],
};

/// How your current job shapes your life, in plain words.
function jobEffects(L) {
  const j = L.job, p = jobProfile(jobTemplate(L));
  const e = [];
  const hours = jobHours(L);
  if (j.stress >= 55 || p.stress >= 70) e.push("😫 High stress drags your happiness down, and very high stress hurts your health.");
  if (p.physical >= 60) e.push("💪 Physical work keeps you fit, until about 50, when it starts wearing you down.");
  else if (p.physical <= 15) e.push("🪑 A desk job: after 35, your health slips unless you hit the gym.");
  if (p.shift === "night" || p.shift === "rotating") e.push("🌙 Night and rotating shifts wear down your health and mood.");
  if (hours >= 48) e.push(`⏰ ${hours} hours a week: your partner and kids see less of you.`);
  if (p.away) e.push("🧳 Time away from home strains your relationships.");
  if (j.remote) e.push("🏠 Working from home: no commute and a happier you.");
  else if (j.commute >= 40) e.push(`🚗 A ${j.commute}-minute commute drags your mood.`);
  if (p.danger) e.push("⚠️ You can get hurt on the job. Overtime makes it likelier.");
  e.push(j.benefits.health ? "🩺 Health insurance: doctors and treatment cost 70% less." : "🩺 No health insurance: you pay full price for medical care.");
  if (j.benefits.match) e.push(`💰 The company adds ${j.benefits.match}% of your salary to your 401(k) every year.`);
  if (j.benefits.pension) e.push("🏛️ A government pension when you retire, and protection from layoffs.");
  else e.push("📉 In a recession, you could be laid off. Strong performance helps.");
  return e;
}

function matureToggleRow() {
  const on = !!store.settings.mature;
  return row("🔞", `Mature Mode: ${on ? "On" : "Off"}`, on ? "Drinking, drugs and sex for adult characters" : "Adds drinking, drugs and sex (18+ only)", () => setMature(!on), { right: on ? "Turn off" : "Turn on" });
}

// MARK: Start screen

function renderStart() {
  const f = ui.form;
  if (ui.startView === "create") {
    return `<div class="center-wrap"><div class="card start-card">
      <div class="start-head"><button class="sheet-back" aria-label="Back" data-h="${h(() => { readForm(); ui.startView = null; render(); })}">‹</button><h2>Create your character</h2></div>
      <div class="fields">
        <div class="field"><label for="f-first">First name</label><input id="f-first" value="${esc(f.first)}" placeholder="Random" autocomplete="off"></div>
        <div class="field"><label for="f-last">Last name</label><input id="f-last" value="${esc(f.last)}" placeholder="Random" autocomplete="off"></div>
      </div>
      <div class="seg" role="group" aria-label="Gender">
        <button class="btn" aria-pressed="${f.gender === "male"}" data-h="${h(() => { readForm(); setFormGender("male"); })}">♂ Male</button>
        <button class="btn" aria-pressed="${f.gender === "female"}" data-h="${h(() => { readForm(); setFormGender("female"); })}">♀ Female</button>
      </div>
      ${renderCreateLook()}
      <div class="sticky-start"><button class="age-btn" data-h="${h(() => { readForm(); startLife(f.first, f.last, f.gender, formLook()); })}">Start this life</button></div>
    </div></div>`;
  }
  if (ui.startView === "graveyard") {
    return `<div class="center-wrap"><div class="card start-card">
      <div class="start-head"><button class="sheet-back" aria-label="Back" data-h="${h(() => { ui.startView = null; render(); })}">‹</button><h2>Graveyard</h2></div>
      ${section("Past lives", store.graveyard.slice(0, 50).map((g) => {
        const r = Ribbons[g.ribbon] || Ribbons.average;
        return `<div class="row" style="cursor:default"><span class="row-emoji">${r[1]}</span><span class="row-main"><span class="row-title">${esc(g.name)}${(g.generation || 1) > 1 ? ` <span class="muted">· Gen ${g.generation}</span>` : ""}</span>
          <div class="row-sub">Died at ${g.ageAtDeath} from ${esc(g.causeOfDeath)} · ${r[0]} ribbon</div></span><span class="row-right">${formatMoney(g.netWorth)}</span></div>`;
      }).join("") || `<div class="pad muted">No one has died yet.</div>`)}
    </div></div>`;
  }
  return `<div class="center-wrap"><div class="card start-card">
    <div class="brand"><h1>LifeSim</h1><p>Live a whole life, one year at a time.</p></div>
    <button class="age-btn big-go" data-h="${h(() => startLife())}">🎲 Random life</button>
    ${tiles([
      tile("✏️", "Create", "Name, gender, looks", () => { ui.startView = "create"; render(); }),
      tile("👑", "Be Royal", "25 monarchies", chooseRoyalStart),
      tile("🪦", "Graveyard", store.graveyard.length ? `${store.graveyard.length} past lives` : "Empty", () => { ui.startView = "graveyard"; render(); }),
    ])}
    ${section("Settings", layoutRow() + matureToggleRow() + minigameToggleRow())}
    ${store.settings.mature ? `<p class="muted small" style="margin:0">🔞 For players 18+. Mature Mode adds drinking, drugs and (non-explicit) sex for adult characters.</p>` : ""}
  </div></div>`;
}
/// Switching gender keeps your genes but picks a fitting hairstyle (and drops the beard).
function setFormGender(g) {
  if (ui.form.gender === g) return;
  ui.form.gender = g;
  const look = formLook();
  ui.form.look = { ...look, hair: styleFor(g, 30, look.texture), facial: g === "female" ? "none" : look.facial };
  render();
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
      store.life = continueAs(L, c); store.life.mature = !!store.settings.mature; store.life.protection = true; ui.stack = []; ui.tab = "occupation"; ui.openings = null; save(); render(true);
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
  const mode = layoutMode();
  const s = L.stats;
  const chips = [];
  chips.push(`<span class="chip">📍 ${esc(L.city)}</span>`);
  if (L.generation > 1) chips.push(`<span class="chip">Gen ${L.generation}</span>`);
  if (L.fame > 0) chips.push(`<span class="chip">⭐ Fame ${L.fame}%</span>`);
  if (L.followers > 0) chips.push(`<span class="chip">📱 ${formatCount(L.followers)}</span>`);
  for (const id of L.illnesses) chips.push(`<span class="chip warn">🤒 ${esc(Illnesses[id].name.replace(/^an? /, ""))}</span>`);
  for (const a of L.addictions) chips.push(`<span class="chip bad">⚠️ ${esc(Addictions[a])}</span>`);
  if (inPrison(L)) chips.push(`<span class="chip bad">🔒 In prison</span>`);
  if (L.fugitive && !inPrison(L)) chips.push(`<span class="chip bad">🏃 Fugitive</span>`);
  if (L.mob) chips.push(`<span class="chip">🕴️ ${esc(MobRanks[L.mob.rank])}</span>`);
  if (L.pregnancy) chips.push(`<span class="chip warn">🤰 ${L.pregnancy.carrier === "me" ? "Pregnant" : `${esc(L.pregnancy.partnerName)} is pregnant`}</span>`);

  const blocked = L.pendingEvents.length > 0 || (L.popups || []).length > 0;
  const showing = mode === "desktop" || ui.sheetOpen;
  const dockBtn = (tab, emoji, label) => `<button class="dock-btn${showing && ui.tab === tab ? " on" : ""}" data-h="${h(() => openSheet(tab))}"><span class="dock-ico">${emoji}</span><span class="dock-label">${label}</span></button>`;
  const iconBtn = (emoji, label, fn, on) => `<button class="icon-btn${on ? " on" : ""}" title="${esc(label)}" aria-label="${esc(label)}" data-h="${h(fn)}"><span>${emoji}</span><small>${esc(label)}</small></button>`;
  const newLife = () => choose("Start a new life?", `${fullName(L)} will be sent to the graveyard.`, [
    { label: "Abandon this life", danger: true, fn: () => { L.causeOfDeath = "unknown causes"; store.graveyard.unshift(summaryOf(L)); store.life = null; save(); } },
    { label: "Keep playing", secondary: true, fn: () => {} },
  ]);
  const log = L.log.slice(-60);
  const phone = `<div class="phone">
    <header class="topbar">
      <button class="top-avatar" aria-label="Your profile" data-h="${h(() => openSheet("profile"))}">${lifeEmoji(L)}</button>
      <div class="top-who"><div class="who-name">${esc(fullName(L))}</div><div class="who-sub">${esc(subtitleOf(L))}</div></div>
      <div class="top-money"><span>Age ${L.age}</span><b class="${L.money < 0 ? "neg" : "pos"}">${formatMoney(L.money)}</b></div>
    </header>
    <nav class="topicons">
      ${iconBtn("🎁", "Packs", () => openSheet("packs"), showing && ui.tab === "packs")}
      ${iconBtn("🪪", "Me", () => openSheet("profile"), showing && ui.tab === "profile")}
      ${iconBtn("⚡", "God", () => openSheet("god"), showing && ui.tab === "god")}
      ${iconBtn(mode === "mobile" ? "🖥️" : "📱", mode === "mobile" ? "PC view" : "Phone view", toggleLayout)}
      ${iconBtn("🔄", "New life", newLife)}
    </nav>
    ${chips.length ? `<div class="chip-row">${chips.join("")}</div>` : ""}
    <main class="feed log" aria-label="Your life story">${log.map((y, i) => `<div class="year${i === log.length - 1 ? " latest" : ""}"><div class="year-age">Age ${y.age}</div>
      <div>${y.entries.length ? y.entries.map((e) => `<p>${esc(e)}</p>`).join("") : `<p class="quiet">Nothing much happened.</p>`}</div></div>`).join("")}</main>
    <div class="dock">
      ${dockBtn("occupation", inPrison(L) ? "⛓️" : L.age < 18 && !L.job ? "🎒" : "💼", inPrison(L) ? "Prison" : "Occupation")}
      ${dockBtn("assets", "🏠", "Assets")}
      <button class="age-orb" ${blocked ? "disabled" : ""} data-h="${h(ageUpNow)}" aria-label="Age up"><b>＋</b><span>Age</span></button>
      ${dockBtn("relationships", "❤️", "Relationships")}
      ${dockBtn("activities", "🎯", "Activities")}
    </div>
    <div class="statgrid">${statBar("Happiness", "😊", s.happiness)}${statBar("Health", "❤️", s.health)}${statBar("Smarts", "🧠", s.smarts)}${statBar("Looks", "✨", s.looks)}</div>
    ${mode === "mobile" && ui.sheetOpen ? `<div class="sheet-overlay${ui.sheetAnim ? " anim" : ""}">${renderSheet(L, mode)}</div>` : ""}
  </div>`;
  return `<div class="app-shell ${mode}">${phone}${mode === "desktop" ? `<aside class="sheet-panel">${renderSheet(L, mode)}</aside>` : ""}</div>`;
}

// MARK: Layout: phone or computer

function layoutMode() {
  const pref = store.settings.layout || "auto";
  if (pref !== "auto") return pref;
  return window.innerWidth < 900 ? "mobile" : "desktop";
}
function toggleLayout() {
  store.settings.layout = layoutMode() === "mobile" ? "desktop" : "mobile";
  save(); render();
}
function layoutRow() {
  const pref = store.settings.layout || "auto";
  return `<div class="seg-row"><span>📱 Layout</span><div class="seg">${[["auto", "Automatic"], ["mobile", "Phone"], ["desktop", "Computer"]].map(([id, label]) =>
    `<button class="btn small" aria-pressed="${pref === id}" data-h="${h(() => { store.settings.layout = id; save(); render(); })}">${label}</button>`).join("")}</div></div>`;
}

const SheetTitles = { occupation: "Occupation", assets: "Assets", relationships: "Relationships", activities: "Activities", packs: "Expansion Packs", profile: "Profile", god: "God Mode" };
function openSheet(tab) { ui.sheetAnim = !ui.sheetOpen; ui.tab = tab; ui.stack = []; ui.sheetOpen = true; render(); }
function closeSheet() { ui.sheetOpen = false; ui.stack = []; render(); }

function viewTitle(L, v) {
  const t = {
    job: "My Job", openings: "Job Openings", education: "Education", gigs: "Freelance Gigs", retirement: "Retirement", love: "Love Life", finances: "Finances",
    myHomes: "My Homes", myVehicles: "My Vehicles", homes: "Real Estate", licenses: "Licenses", casino: "Casino", emigrate: "Emigrate", look: v.mode === "god" ? "Appearance" : "Your Look",
  }[v.type];
  if (t) return t;
  if (v.type === "act") return ActGroups[v.id]?.[1] || "Activities";
  if (v.type === "person" || v.type === "godPerson") { const p = findRel(L, v.id); return p ? relName(p) : "Person"; }
  if (v.type === "vehicles") return VehicleGroups[v.group]?.label || "Vehicles";
  if (v.type === "vehicle") return L.assets.find((a) => a.id === v.id)?.name || "Vehicle";
  if (v.type === "home") return L.assets.find((a) => a.id === v.id)?.address || "Home";
  if (v.type === "listing") return v.listing.address;
  if (v.type === "license") return Licenses[v.id]?.name || "License";
  if (v.type === "business") return (L.businesses || []).find((b) => b.id === v.id)?.name || "Business";
  if (v.type === "pack") return { boss: "Boss Mode", royal: "Royalty", crime: "Organized Crime", pets: "Pets & Exotic Animals", zoo: "Zoo", fame: "Fame", prison: "Prison" }[v.id] || "Pack";
  return SheetTitles[ui.tab];
}

function renderSheet(L, mode) {
  const top = ui.stack[ui.stack.length - 1];
  const back = top ? `<button class="sheet-back" aria-label="Back" data-h="${h(() => { ui.stack.pop(); render(); })}">‹</button>` : "";
  const close = mode === "mobile" ? `<button class="sheet-close" aria-label="Close" data-h="${h(closeSheet)}">✕</button>` : "";
  return `<div class="sheet"><div class="sheet-head">${back}<h2>${esc(top ? viewTitle(L, top) : SheetTitles[ui.tab])}</h2>${close}</div>
    <div class="sheet-body side-body">${top ? renderSubview(L, top) : renderHub(L)}</div></div>`;
}

function renderHub(L) {
  switch (ui.tab) {
    case "occupation": return inPrison(L) ? renderPrison(L) : occupationHub(L);
    case "assets": return assetsHub(L);
    case "relationships": return renderPeople(L);
    case "activities": return inPrison(L) ? renderPrison(L) : activitiesHub(L);
    case "profile": return renderProfile(L);
    case "god": return renderGodMode(L);
    case "packs": return renderPacks(L);
  }
  return "";
}

/// A big square menu button, BitLife-style.
function tile(emoji, label, sub, fn, opts = {}) {
  const dis = opts.disabled || !fn;
  return `<button class="tile${opts.danger ? " danger" : ""}" ${dis ? "disabled" : `data-h="${h(fn)}"`}><span class="tile-emoji">${emoji}</span><span class="tile-label">${esc(label)}</span>${sub ? `<span class="tile-sub">${esc(sub)}</span>` : ""}</button>`;
}
const tiles = (arr) => `<div class="tiles">${arr.filter(Boolean).join("")}</div>`;
/// A summary card at the top of a menu.
const hubCard = (emoji, title, sub, extra = "", fn = null) => `<${fn ? `button data-h="${h(fn)}"` : "div"} class="hub-card"><span class="hub-emoji">${emoji}</span><span class="hub-main"><b>${esc(title)}</b>${sub ? `<span>${esc(sub)}</span>` : ""}${extra}</span>${fn ? `<span class="chev">›</span>` : ""}</${fn ? "button" : "div"}>`;

function push(view) { ui.stack.push(view); render(); }

// MARK: Occupation

function occupationHub(L) {
  let html = "";
  const school = schoolName(L);
  if (L.job) {
    const j = normalizeJob(L);
    html += hubCard("💼", j.title, `${j.company} · ${formatMoney(j.salary)}/yr`, `<div class="hub-bars">${statBar("Performance", "📊", j.performance)}</div>`, () => push({ type: "job" }));
  } else if (school) {
    const g = L.enrollment ? L.enrollment.grades : L.schoolGrades;
    html += hubCard("🎒", school, `Grades: ${gradeLetter(g)} (${g}%)`, "", () => push({ type: "education" }));
  } else if (L.isRetired) html += hubCard("🏖️", "Retired", `Pension ${formatMoney(L.pension)}/yr`, "", () => push({ type: "retirement" }));
  else if (L.age >= 14) html += hubCard("🔎", L.unemployment ? "Unemployed (on benefits)" : "Unemployed", "Look through the job openings below.");
  else html += hubCard("🧸", "Just a kid", "You can get a job at 14.");
  const gigsLeft = Math.max(0, 3 - count(L, "gigsThisYear"));
  html += tiles([
    L.job && tile("💼", "My Job", "Work, boss, promotions", () => push({ type: "job" })),
    school && tile("📝", "Study Harder", "🎮 Quiz yourself", () => withMinigame("math", { title: "Study session", emoji: "📝", level: L.age < 11 ? 1 : L.age < 16 ? 2 : 3 }, studyHarder)),
    L.age >= 14 && tile("📋", "Job Openings", L.job ? "Find something better" : "Get a job", () => push({ type: "openings" })),
    tile("🎓", "Education", school || eduLabel[L.education], () => push({ type: "education" })),
    L.age >= 10 && tile("🛠️", "Gigs", `${gigsLeft} left this year`, () => push({ type: "gigs" })),
    (L.isRetired || L.unemployment) && tile(L.isRetired ? "🏖️" : "📬", L.isRetired ? "Retirement" : "Unemployment", L.isRetired ? "Pension & 401(k)" : `${formatMoney(L.unemployment.amount)}/yr`, () => push({ type: "retirement" })),
  ]);
  return html;
}

function renderEducation(L) {
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
    edu += row("📝", "Study harder", "🎮 Quiz yourself to raise your grades", () => withMinigame("math", { title: "Study session", emoji: "📝", level: L.age < 11 ? 1 : L.age < 16 ? 2 : 3 }, studyHarder));
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

  return html;
}

function renderJob(L) {
  if (!L.job) return `<div class="pad muted">You don't have a job.</div>`;
  let html = "";
  {
    const j = normalizeJob(L);
    const t = jobTemplate(L);
    const p = jobProfile(t);
    const b = j.benefits;
    let cur = lv("Title", esc(j.title)) + lv("Company", esc(j.company)) + lv("Salary", `${formatMoney(j.salary)}/yr${p.hourly ? " (hourly)" : ""}`) + lv("Years", `${j.years} (${j.yearsInLevel} in this role)`)
      + lv("Hours", `${jobHours(L)} hours a week`) + lv("Schedule", ShiftNames[p.shift]) + lv("Commute", j.remote ? "Works from home" : `${j.commute} minutes each way`)
      + lv("Boss", `${esc(j.boss.name)} · ${BossStyles[j.boss.style][0]}`) + lv("Vacation", j.vacationDays ? `${j.vacationLeft} of ${j.vacationDays} days left` : "None paid")
      + lv("Benefits", [b.health ? "🩺 Health insurance" : "No health insurance", b.match ? `💰 ${b.match}% 401(k) match` : "", b.pension ? "🏛️ Pension" : ""].filter(Boolean).join(" · "));
    if (j.lastReview) cur += lv("Last review", `${j.lastReview.rating}${j.lastReview.raise ? ` · +${formatMoney(j.lastReview.raise)}` : ""}`, j.warnings ? "red" : "");
    if (j.warnings) cur += lv("Warnings", `${j.warnings} of 3`, "red");
    cur += `<div class="pad">${statBar("Performance", "📊", j.performance)}${statBar("Stress", "😫", j.stress)}${statBar("Satisfaction", "🙂", j.satisfaction)}${statBar("Boss", "🧑‍💼", j.boss.bond)}${L.fame > 0 ? statBar("Fame", "⭐", L.fame) : ""}</div>`;
    const details = section("Details", cur, BossStyles[j.boss.style][1]);
    let rest = "";
    rest += section("Work-life balance", settingRow("Hours", Object.entries(HoursModes).map(([id, m]) => [id, m[0]]), j.hoursMode, (v) => setAndSave(() => setHoursMode(L, v)))
      + `<div class="pad effects">${jobEffects(L).map((e) => `<div>${esc(e)}</div>`).join("")}</div>`,
      p.hourly ? "Overtime pays time-and-a-half here, but it adds stress." : "Overtime raises your performance and your stress. Coasting does the opposite.");

    if (hasCareerPath(t)) {
      const ladder = currentLadder(L);
      let rungs = ladder.map((rung, i) => `<div class="lv"><span style="color:inherit">${i < j.level ? "✅" : i === j.level ? "📍" : "🔒"} <span class="${i > j.level ? "muted" : ""}" style="${i === j.level ? "font-weight:700" : ""}">${esc(rung)}</span></span><span class="muted">${formatMoney(jobSalary(L, i))}</span></div>`).join("");
      const b = branchOf(t);
      if (b && !j.track) rungs += `<div class="lv"><span>🔀 Then: ${b.tracks.map((tr) => tr.name).join(", ")}</span><span></span></div>`;
      rest += section("Career ladder", rungs);
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
      const game = jobGameFor(L, a);
      const run = game ? () => withMinigame(game[0], { ...game[1], title: game[1].title || a.title, emoji: a.emoji }, (x) => performJobAction(x, a)) : () => act((x) => performJobAction(x, a));
      return row(a.emoji, a.title, used ? "Done this year" : game ? `🎮 ${game[1].title || "Mini-game"}` : null, run, { disabled: used });
    }).join("");
    work += row("🧑‍💼", "One-on-one with your boss", j.usedActions.includes("boss") ? "Done this year" : "Build the relationship", () => act(talkToBoss), { disabled: j.usedActions.includes("boss") });
    work += row("🏖️", "Take vacation days", j.vacationLeft ? `${j.vacationLeft} days left · lowers stress` : "No paid days left", () => act(takeVacationDays), { disabled: !j.vacationLeft });
    work += row("🤒", "Call in sick", j.usedActions.includes("sick") ? "Done this year" : "A day off, if your boss buys it", () => act(callInSick), { disabled: j.usedActions.includes("sick") });
    const ladder = currentLadder(L);
    if (!mustChooseTrack(L) && j.level < ladder.length - 1) work += row("🪜", "Ask for a promotion", `Next: ${ladder[j.level + 1]}`, () => act(askForPromotion));
    work += row("💵", "Ask for a raise", null, () => act(askForRaise));
    if (canRetire(L)) work += row("🏖️", "Retire", "Collect a pension", () => act(retire));
    work += row("🚪", "Quit job", null, () => choose("Quit your job?", `You'll stop earning ${formatMoney(j.salary)} a year.`, [
      { label: "Quit", danger: true, fn: () => act(quitJob) }, { label: "Stay", secondary: true, fn: () => {} },
    ]), { danger: true });
    html = hubCard("💼", j.title, `${j.company} · ${formatMoney(j.salary)}/yr`, `<div class="hub-bars">${statBar("Performance", "📊", j.performance)}${statBar("Stress", "😫", j.stress)}</div>`) + html;
    html += section("At work", work, "Each work action can be done once per year. Risky ones can get you fired, hurt or arrested.") + rest + details;
  }
  return html;
}

function renderRetirement(L) {
  let html = "";
  if (L.isRetired) {
    html += section("Retirement", lv("Pension", `${formatMoney(L.pension)}/yr`) + (L.retirement401k ? lv("401(k)", formatMoney(Math.round(L.retirement401k))) + row("💰", "Cash out your 401(k)", "Taxed as income", () => act(withdraw401k)) : ""));
  } else if (L.unemployment) {
    html += section("Unemployed", lv("Unemployment benefits", `${formatMoney(L.unemployment.amount)}/yr`) + lv("Remaining", plural(L.unemployment.years, "year")), "Benefits stop as soon as you take a new job.");
  }

  return html || `<div class="pad muted">Nothing here.</div>`;
}

function renderGigs(L) {
  let html = "";
  // Gigs
  if (L.age >= 10) {
    html += section("Freelance gigs", Gigs.map((g) => row(g.emoji, g.title,
      L.age < g.minAge ? `Available at ${g.minAge}` : `${formatMoney(g.pay[0])}–${formatMoney(g.pay[1])}`,
      () => act((x) => doGig(x, g)), { disabled: !canDoGig(L, g) })).join(""), `Up to 3 gigs per year. ${Math.max(0, 3 - count(L, "gigsThisYear"))} left this year.`);
  }

  return html;
}

function renderOpenings(L) {
  let html = "";
  // Openings
  if (L.age >= 14) {
    if (!ui.openings) ui.openings = jobListings(L);
    const rows = ui.openings.map((o) => {
      const t = o.template;
      const ok = meetsRequirements(L, t);
      const tags = (t.partTime ? " (Part-time)" : "") + (t.famous ? " ⭐" : "") + (t.military ? " 🪖" : "");
      const p = jobProfile(t);
      const d = o.details || openingDetails(t);
      const facts = `${p.hours} h/wk · ${ShiftNames[p.shift]} · ${stressWord(p.stress)} · ${d.remote ? "🏠 Remote" : `🚗 ${d.commute} min`}${d.health ? " · 🩺" : ""}${d.match ? ` · 💰 ${d.match}%` : ""}${d.pension ? " · 🏛️" : ""}`;
      const apply = () => {
        if (!ok) { act((x) => applyForJob(x, o)); return; }
        choose(`${entryTitle(t)} at ${o.company}`, `${formatMoney(o.salary)} a year${p.hourly ? " (hourly)" : ""} · ${p.hours} hours a week · ${ShiftNames[p.shift].toLowerCase()}\n${stressWord(p.stress)} · ${p.physical >= 60 ? "physically demanding" : p.physical <= 15 ? "desk job" : "some physical work"}${p.danger ? " · risk of injury" : ""}\n${d.remote ? "Remote" : `${d.commute}-minute commute`} · ${d.health ? "health insurance" : "no health insurance"}${d.match ? ` · ${d.match}% 401(k) match` : ""}${d.pension ? " · pension" : ""} · ${d.vacation} vacation days`, [
          { label: "🤝 Go to the interview", fn: () => withMinigame("interview", { title: `Interview at ${o.company}`, emoji: "🤝", count: t.partTime ? 2 : 3 }, (x) => applyForJob(x, o)) },
          { label: "Cancel", secondary: true, fn: () => {} },
        ]);
      };
      return row("", entryTitle(t) + tags, o.company, apply, {
        extra: `${hasCareerPath(t) ? `<div class="row-sub">Career path up to ${esc(topTitle(t))}</div>` : ""}<div class="row-sub">${esc(facts)}</div><div class="row-sub ${ok ? "" : "red"}">${esc(!ok && t.partTime && L.age >= 18 ? "Part-time jobs are for students, or if you have no other job" : requirementText(t))}</div>`,
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
  let html = renderPrisonPack(L);
  if (L.criminalRecord.length) html += section("Criminal record", L.criminalRecord.map((c) => `<div class="pad">${esc(c)}</div>`).join(""));
  return html;
}

// MARK: People tab

function renderPeople(L) {
  let html = "";
  if (!inPrison(L)) {
    html += tiles([
      canFindDate(L) && tile("❤️", "Find a Date", "See who's out there", () => choose("Who are you interested in?", null, [
        { label: "Men", fn: () => { L.datingPreference = "male"; openCandidate("date"); } },
        { label: "Women", fn: () => { L.datingPreference = "female"; openCandidate("date"); } },
      ])),
      L.age >= 5 && tile("🤝", "Make a Friend", "Meet someone new", () => openCandidate("friend")),
      canHookUp(L) && tile("🔥", "Hook Up", romanticPartner(L) ? "Cheat…" : "No strings", () => act(hookUp)),
      isMature(L) && L.age >= 18 && tile("🔞", "Love Life", `${count(L, "partners")} partners`, () => push({ type: "love" })),
      L.age >= 8 && tile("🐾", "Pet Shelter", "Adopt · $200", () => choose("Adopt a pet", null, Names.petSpecies.map((sp) => ({ label: `${petEmoji[sp]} ${sp}`, fn: () => act((x) => adoptPet(x, sp)) })))),
      canAdoptChild(L) && tile("🍼", "Adopt", "$10,000", () => act(adoptChild)),
    ]);
  }
  const support = socialSupport(L);
  html += `<div class="support">${statBar("Support", "🫂", support)}<div class="muted small">${isLonely(L) ? "You're lonely. Loneliness drags your happiness down every year." : support >= 70 ? "The people in your life have your back." : "Relationships you ignore for 2+ years fade."}</div></div>`;

  const groups = [
    ["Family", (p) => isParent(p.kind) || p.kind === "sibling"],
    ["Love", (p) => isRomantic(p.kind)],
    ["Children", (p) => p.kind === "child"],
    ["Friends", (p) => p.kind === "friend"],
    ["Work", (p) => p.kind === "coworker"],
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

function renderLoveLife(L) {
  if (!isMature(L) || L.age < 18) return `<div class="pad muted">Not available.</div>`;
  const partner = romanticPartner(L);
  const adultFriends = L.relationships.filter((p) => p.isAlive && p.kind === "friend" && p.age >= 18);
  let love = "";
  if (partner && partner.age >= 18) love += row("🔥", `Have sex with ${partner.firstName}`, L.pregnancy ? "A baby is already on the way" : "Unprotected sex can lead to a baby", () => askProtection(`Have sex with ${partner.firstName}?`, (safe) => act((x) => haveSex(x, partner.id, safe))), { chev: true });
  love += row("🍸", "One-night stand", partner ? "Cheat on your partner..." : "Find someone at a bar", () => askProtection("One-night stand", (safe) => act((x) => oneNightStand(x, safe))), { chev: true });
  love += row("📱", "Dating app hookup", "Swipe right", () => askProtection("Dating app hookup", (safe) => act((x) => datingAppHookup(x, safe))), { chev: true });
  if (adultFriends.length) love += row("😏", "Friends with benefits", "Ask a friend", () => choose("Who do you ask?", null, adultFriends.map((f) => ({ label: relName(f), fn: () => askProtection(`Friends with benefits with ${f.firstName}`, (safe) => act((x) => friendsWithBenefits(x, f.id, safe))) }))), { chev: true });
  love += row("💃", "Strip club", "$250", () => act(stripClub));
  return section("Love life 🔞", love, `${count(L, "partners")} partners so far.`);
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

/// Stat bars for a person (pets only show health).
function npcStatBars(p) {
  ensureNpcStats(p);
  if (p.species) return statBar("Health", "❤️", p.health);
  return NpcStats.map(([k, e, label]) => statBar(label, e, p[k])).join("");
}

function openCandidate(mode) {
  ui.candidate = { mode, person: makeCandidate(store.life, mode) };
  render();
}

const oddsWord = (c) => (c >= 0.7 ? "Good odds" : c >= 0.45 ? "Fair odds" : c >= 0.25 ? "Long shot" : "Very long shot");

function renderCandidateModal(L) {
  const { mode, person: p } = ui.candidate;
  const go = (as) => h(() => { ui.candidate = null; act((x) => approachCandidate(x, p, as)); });
  const next = h(() => { ui.candidate.person = makeCandidate(L, mode); render(); });
  const close = h(() => { ui.candidate = null; render(); });
  const facts = [p.occupation ? (p.salary > 0 ? `${p.occupation} · ${formatMoney(p.salary)}/yr` : p.occupation) : null, p.trait ? `${Traits[p.trait][0]} ${cap(p.trait)}` : null].filter(Boolean);
  let buttons = "";
  if (canAskOutCandidate(L, p)) buttons += `<button class="choice" data-h="${go("date")}">💌 Ask them out <span class="odds">· ${oddsWord(askOutChance(L, p))}</span></button>`;
  buttons += `<button class="choice${mode === "date" && canAskOutCandidate(L, p) ? " secondary" : ""}" data-h="${go("friend")}">🤝 Befriend them <span class="odds">· ${oddsWord(befriendChance(L, p))}</span></button>`;
  buttons += `<button class="choice secondary" data-h="${next}">Meet someone else ›</button>`;
  buttons += `<button class="choice secondary" data-h="${close}">Not now</button>`;
  return `<div class="scrim"><div class="modal event candidate" role="dialog" aria-modal="true" aria-labelledby="m-title" data-stop="1">
    <div class="event-head"><div class="event-emoji" aria-hidden="true">${personAvatar(p)}</div><div class="modal-tag">${mode === "date" ? "Dating" : "Making friends"}</div>
      <h3 id="m-title">${esc(relName(p))}, ${p.age}</h3></div>
    <div class="event-body"><p>You met ${esc(p.firstName)} ${esc(p.metAt)}.${facts.length ? ` ${esc(facts.join(" · "))}` : ""}</p>
      ${p.trait ? `<p class="muted" style="margin-top:-6px">${esc(Traits[p.trait][1])}</p>` : ""}
      <div class="cand-stats">${npcStatBars(p)}${lv("Money", formatMoney(p.money))}</div>
      <div class="choices">${buttons}</div></div></div></div>`;
}

function renderPerson(L, view) {
  const p = findRel(L, view.id);
  if (!p) return `<div class="pad muted">They're no longer in your life.</div>`;
  let html = `<div class="hero-person"><div class="big">${relEmoji(p)}</div><h3>${esc(relName(p))}</h3><div class="muted">${esc(relTitle(p))} · ${p.isAlive ? `Age ${p.age}` : "Deceased"}</div></div>`;
  if (p.isAlive) {
    html += `<div class="list pad">${statBar("Relationship", "💞", p.bond)}${npcStatBars(p)}</div>`;
  }
  if (p.isAlive && !p.species) {
    let about = "";
    const st = relStatus(p);
    if (st) about += lv("Status", st);
    if (p.trait) about += `<div class="pad"><b>${Traits[p.trait][0]} ${cap(p.trait)}</b><div class="row-sub">${Traits[p.trait][1]}</div></div>`;
    if (p.occupation) about += lv("Occupation", esc(p.salary > 0 ? `${p.occupation} · ${formatMoney(p.salary)}/yr` : p.occupation));
    about += lv("Money", formatMoney(p.money || 0));
    if (p.inherited && p.kind === "child") about += lv("Genes", "Takes after you and their other parent");
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

const ActGroups = {
  kid: ["🧸", "Kid Stuff"], mind: ["💪", "Mind & Body"], doctor: ["🩺", "Doctor"], social: ["📱", "Social Media"],
  leisure: ["🎬", "Leisure"], nightlife: ["🪩", "Nightlife"], crime: ["🦹", "Crime"], record: ["📜", "Criminal Record"],
};

function activitiesHub(L) {
  const problems = L.illnesses.length + L.addictions.length;
  return tiles([
    L.age < 13 && tile("🧸", "Kid Stuff", "Play, explore, learn", () => push({ type: "act", id: "kid" })),
    tile("💪", "Mind & Body", "🎮 Gym, library, diet…", () => push({ type: "act", id: "mind" })),
    tile("🩺", "Doctor", problems ? `${plural(problems, "condition")}` : "You're healthy", () => push({ type: "act", id: "doctor" })),
    tile("📱", "Social Media", L.age >= 13 ? `${formatCount(L.followers)} followers` : "At 13", () => push({ type: "act", id: "social" }), { disabled: L.age < 13 }),
    tile("🎬", "Leisure", "Movies, concerts, trips", () => push({ type: "act", id: "leisure" })),
    tile("🪩", "Nightlife", L.age >= 14 ? (isMature(L) ? "Clubs, bars, drugs 🔞" : "Clubs and bars") : "When you're older", () => push({ type: "act", id: "nightlife" }), { disabled: L.age < 14 }),
    tile("🦹", "Crime", "🎮 Risky business", () => push({ type: "act", id: "crime" }), { disabled: L.age < 10 }),
    tile("🎰", "Casino", L.age >= 18 ? "Try your luck" : "At 18", () => push({ type: "casino" }), { disabled: L.age < 18 }),
    tile("🪪", "Licenses", L.age >= 15 ? "Drive, sail, fly" : "At 15", () => push({ type: "licenses" }), { disabled: L.age < 15 }),
    tile("✈️", "Emigrate", L.age >= 18 ? `${WORLD.length} countries` : "At 18", () => { ui.emigrateCountry = null; push({ type: "emigrate" }); }, { disabled: L.age < 18 }),
    L.criminalRecord.length && tile("📜", "Record", plural(L.criminalRecord.length, "offense"), () => push({ type: "act", id: "record" })),
  ]);
}

function renderActGroup(L, id) {
  switch (id) {
    case "kid": return section("Kid stuff", KidActivities.filter((a) => L.age >= a.min).map((a) => row(a.emoji, a.title, a.sub, () => act((x) => doKidActivity(x, a.id)))).join("") || `<div class="pad muted">You're a baby. Enjoy it!</div>`);
    case "mind": return activitySection(L, ActivityGroups[0][0], ActivityGroups[0][1]);
    case "doctor": {
      let health = Treatments.map((t) => {
        const ok = t.id !== "therapist" || L.age >= 10;
        const cost = hasHealthInsurance(L) ? Math.round(t.cost * 0.3) : t.cost;
        return row(t.emoji, t.title, `${formatMoney(cost)}${hasHealthInsurance(L) && t.cost !== cost ? " with insurance" : ""}`, () => act((x) => treat(x, t)), { disabled: !ok });
      }).join("");
      if (L.addictions.length) health += row("🏥", "Rehab", "Beat your addictions · $15,000", () => act(goToRehab));
      const problems = L.illnesses.map((i) => Illnesses[i].name).concat(L.addictions.map((a) => Addictions[a]));
      return section("See someone", health, problems.length ? `Conditions: ${problems.join(", ")}` : "You're in good health.");
    }
    case "social": return section("Social media", row("📱", "Post on social media", `${formatCount(L.followers)} followers`, () => act(postOnSocialMedia), { disabled: !canPostOnSocialMedia(L) }), "Go viral, get followers, get paid by brands once you're big.");
    case "leisure": return ActivityGroups.slice(1).filter(([t]) => t !== "Nightlife").map(([t, ids]) => activitySection(L, t, ids)).join("");
    case "nightlife": {
      let html = ActivityGroups.filter(([t]) => t === "Nightlife").map(([t, ids]) => activitySection(L, t, ids)).join("");
      if (isMature(L)) {
        html += section("Bar 🔞", Drinks.map((d) => row(d.emoji, d.title, formatMoney(d.cost), () => act((x) => haveDrink(x, d.id)))).join(""),
          `You've had ${count(L, "drinks")} drinking nights. The more you drink, the likelier you are to get hooked.`);
        html += section("Drugs 🔞", Drugs.map((d) => row(d.emoji, d.title, `${formatMoney(d.cost)} · ${d.od >= 0.03 ? "Very dangerous" : d.addict >= 0.15 ? "Highly addictive" : d.trip ? "Bad trips happen" : "Risky"}`, () => act((x) => takeDrug(x, d.id)))).join("")
          + row("💰", "Deal drugs", "Big money, big risk of prison", () => act(dealDrugs), { danger: true }),
          "Drugs can get you hooked, arrested, or killed. Rehab is under Doctor.");
      }
      return html;
    }
    case "crime": return section("Crime", Crimes.map((c) => {
      const ok = L.age >= c.minAge;
      const game = CrimeGames[c.id];
      const run = game ? () => withMinigame(game[0], { ...game[1], emoji: c.emoji }, (x) => commitCrime(x, c.id)) : () => act((x) => commitCrime(x, c.id));
      return row(c.emoji, c.title, ok ? `${game ? "🎮 " : ""}${Math.round(c.catchChance * 100)}% chance of getting caught` : `Available at ${c.minAge}`, run, { disabled: !ok });
    }).join(""), "Crime pays... until it doesn't. Adults who get caught go to prison.");
    case "record": return section("Criminal record", L.criminalRecord.map((c) => `<div class="pad">${esc(c)}</div>`).join("") || `<div class="pad muted">Clean.</div>`);
  }
  return "";
}

function activitySection(L, title, ids) {
  return section(title, ids.map((id) => {
    const [t, e, sub, min] = Activities[id];
    const ok = canDoActivity(L, id);
    const run = id === "gym" ? () => withMinigame("timing", { title: "Hit your reps", verb: "Lift!", emoji: "🏋️", hint: "Lift when the bar is in the green zone." }, (x) => performActivity(x, id)) : () => act((x) => performActivity(x, id));
    return row(e, t, ok ? (id === "gym" ? `🎮 ${sub}` : sub) : `Available at ${min}`, run, { disabled: !ok });
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
  const look = ensureLook(L, L.gender, L.age);
  let html = section("Appearance", `<div class="profile-look">${playerAvatar(L)}<div class="muted small">${esc(describeLook(look))}</div></div>`
    + row("💇", "Change your look", inPrison(L) ? "Not from prison" : "Hair, dye, facial hair, accessories and outfits", () => push({ type: "look", mode: "salon" }), { chev: true, disabled: inPrison(L) }));
  let about = lv("Lives in", esc(`${L.city}, ${L.country}`)) + lv("Gender", cap(L.gender)) + lv("Generation", L.generation)
    + lv("Education", eduLabel[L.education]) + lv("Occupation", esc(L.job ? L.job.title : L.isRetired ? "Retired" : schoolName(L) || "None"))
    + lv("Net worth", formatMoney(netWorth(L))) + lv("Licenses", esc(Object.keys(Licenses).filter((id) => hasLicense(L, id)).map((id) => Licenses[id].name).join(", ") || "None"))
    + lv("Followers", formatCount(L.followers)) + lv("Partners", count(L, "partners")) + lv("Children", childrenOf(L).length);
  html += section("About me", about);
  let health = "";
  if (!L.illnesses.length && !L.addictions.length) health = `<div class="pad muted">No health problems 💪</div>`;
  health += L.illnesses.map((i) => `<div class="pad">🤒 ${esc(Illnesses[i].name)}</div>`).join("");
  health += L.addictions.map((a) => `<div class="pad">⚠️ ${esc(Addictions[a])}</div>`).join("");
  html += section("Health", health);
  if (L.criminalRecord.length || inPrison(L)) {
    html += section("Criminal record", (inPrison(L) ? lv("In prison", `${plural(L.prisonYearsLeft, "year")} left`) : "") + L.criminalRecord.map((c) => `<div class="pad">${esc(c)}</div>`).join(""));
  }
  html += section("Settings", layoutRow() + matureToggleRow() + minigameToggleRow());
  html += section("Ribbon so far", (() => { const r = Ribbons[ribbonOf(L)]; return `<div class="pad">${r[1]} <b>${r[0]}</b> <span class="muted">· ${r[2]}</span></div>`; })(),
    "The ribbon you earn is decided when you die.");
  return html;
}

function renderSubview(L, view) {
  switch (view.type) {
    case "person": return renderPerson(L, view);
    case "job": return renderJob(L);
    case "openings": return renderOpenings(L);
    case "education": return renderEducation(L);
    case "gigs": return renderGigs(L);
    case "retirement": return renderRetirement(L);
    case "act": return renderActGroup(L, view.id);
    case "love": return renderLoveLife(L);
    case "finances": return renderFinances(L);
    case "myHomes": return renderMyHomes(L);
    case "myVehicles": return renderMyVehicles(L);
    case "homes": return renderHomeMarket(L, view);
    case "listing": return renderListing(L, view);
    case "home": return renderHome(L, view);
    case "vehicles": return renderVehicleMarket(L, view);
    case "vehicle": return renderVehicle(L, view);
    case "licenses": return renderLicenses(L);
    case "license": return renderLicense(L, view);
    case "casino": return renderCasino(L);
    case "emigrate": return renderEmigrate(L);
    case "godPerson": return renderGodPerson(L, view);
    case "business": return renderBusiness(L, view);
    case "pack": return renderPack(L, view);
    case "look": return renderLookView(L, view);
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
      emoji: o.dead ? "☠️" : o.emoji || "📣", tag: o.tag, title: o.title, body: o.message, deltas: o.deltas, tone: o.dead ? "dark" : "result",
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
  // 4. Someone new you could date or befriend.
  if (ui.candidate && L && L.isAlive) return renderCandidateModal(L);
  // 5. Pickers and confirmations.
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
  if (MG.active) return;
  if (e.key === "Enter" && e.target.id === "name-input") { e.preventDefault(); document.querySelector("[data-name-ok]")?.click(); return; }
  if (e.target.closest("input, textarea, select")) return;
  if (store.life?.toName?.length) return;
  if (e.key === " " || e.key === "Spacebar") {
    if (ui.outcome) { e.preventDefault(); ui.outcome = null; render(); return; }
    if (store.life?.popups?.length && !store.life.pendingEvents.length) { e.preventDefault(); store.life.popups.shift(); save(); render(); return; }
    if (store.life && store.life.isAlive && !ui.choice && !ui.candidate && !store.life.pendingEvents.length) { e.preventDefault(); ageUpNow(); }
  } else if (e.key === "Escape") {
    if (ui.outcome || ui.choice || ui.candidate) { ui.outcome = null; ui.choice = null; ui.candidate = null; render(); }
    else if (store.life?.popups?.length && !store.life.pendingEvents.length) { store.life.popups.shift(); save(); render(); }
    else if (ui.stack.length) { ui.stack.pop(); render(); }
    else if (ui.sheetOpen && layoutMode() === "mobile") closeSheet();
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
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (store.life && (store.settings.layout || "auto") === "auto" && layoutMode() !== ui.lastMode) render(); }, 150);
  });
  render(true);
}

window.claude?.hot?.snapshot?.(() => ({ store }));
if (window.claude?.hot?.ready) window.claude.hot.ready(start);
else start(window.claude?.hot?.data ?? null);
