// LifeSim UI for the expansion packs, the world map picker and naming prompts.
// Loaded before ui.js; these functions use ui.js globals (store, ui, render, act, row, section...) when called.
"use strict";

// MARK: Naming

/// After anything that can add people to your life, ask to name new babies, adopted kids and pets.
function queueNewNames(L, beforeIds) {
  for (const p of L.relationships) {
    if (beforeIds.has(p.id)) continue;
    if ((p.kind === "child" && p.age <= 12) || p.kind === "pet") requestName(L, "rel", p.id);
  }
}
const relIds = (L) => new Set(L.relationships.map((p) => p.id));

function renderNamingModal(L) {
  while ((L.toName || []).length && !nameTargetLabel(L, L.toName[0])) L.toName.shift();
  if (!(L.toName || []).length) return "";
  const item = L.toName[0];
  const info = nameTargetLabel(L, item);
  const ok = h(() => {
    const value = document.getElementById("name-input")?.value;
    const swap = applyName(L, item, value);
    if (swap && ui.outcome) ui.outcome = { ...ui.outcome, message: swap(ui.outcome.message) };
    L.toName.shift();
    save();
    render();
  });
  const random = h(() => { const el = document.getElementById("name-input"); if (el) { el.value = randomNameFor(L, item); el.focus(); } });
  const keep = h(() => { L.toName.shift(); save(); render(); });
  return `<div class="scrim"><div class="modal event news" role="dialog" aria-modal="true" aria-labelledby="m-title" data-stop="1">
    <div class="event-head"><div class="event-emoji" aria-hidden="true">${info.emoji}</div><h3 id="m-title">${esc(info.title)}</h3></div>
    <div class="event-body">
      <div class="field"><label for="name-input">Name</label><input id="name-input" value="${esc(info.current)}" maxlength="40" autocomplete="off"></div>
      <div class="choices">
        <button class="choice" data-name-ok="1" data-h="${ok}">Use this name</button>
        <button class="choice secondary" data-h="${random}">🎲 Random name</button>
        <button class="choice secondary" data-h="${keep}">Keep "${esc(info.current)}"</button>
      </div></div></div></div>`;
}

// MARK: World picker

function renderWorldPicker(L) {
  if (ui.emigrateCountry) {
    const c = countryOf(ui.emigrateCountry);
    const back = `<button class="back" data-h="${h(() => { ui.emigrateCountry = null; render(); })}">‹ All countries</button>`;
    return back + section(`${c[0]} · ${formatMoney(emigrationCost(L, c[0]))}`, c[1].map((city, i) => {
      const home = L.city === city && L.country === c[0];
      return row(i === 0 ? "🏛️" : "🏙️", city, home ? "You live here" : i === 0 ? "Capital" : null, () => {
        ui.stack.pop(); ui.emigrateCountry = null;
        act((x) => emigrateTo(x, c[0], city));
      }, { disabled: home, chev: !home });
    }).join(""));
  }
  const q = (ui.emigrateQuery || "").toLowerCase();
  const rows = WORLD.map(([name, cities]) => {
    const hidden = q && !(`${name} ${cities.join(" ")}`.toLowerCase().includes(q));
    return `<div data-country="${esc(`${name} ${cities.join(" ")}`.toLowerCase())}" ${hidden ? "hidden" : ""}>${row(name === L.country ? "📍" : "🌍", name,
      `Capital: ${cities[0]}${cities.length > 1 ? ` · ${cities.length - 1} more ${cities.length === 2 ? "city" : "cities"}` : ""}`,
      () => { ui.emigrateCountry = name; render(); }, { chev: true })}</div>`;
  }).join("");
  return `<div class="field"><label for="emigrate-search">Search ${WORLD.length} countries and their cities</label><input id="emigrate-search" value="${esc(ui.emigrateQuery || "")}" placeholder="Try Japan, Lagos or Lima" autocomplete="off"></div>`
    + section("Where to?", rows, `You're in ${L.city}, ${L.country}. Moving abroad costs $5,000 and you'll leave your job.`);
}

function onWorldSearch(e) {
  if (e.target.id !== "emigrate-search") return;
  ui.emigrateQuery = e.target.value;
  const q = e.target.value.toLowerCase();
  document.querySelectorAll("[data-country]").forEach((el) => { el.hidden = !!q && !el.dataset.country.includes(q); });
}

// MARK: Packs tab

function renderPacks(L) {
  let html = `<div class="god-banner"><b>🎁 Expansion Packs</b><span>Boss Mode, Royalty, Organized Crime, Pets & Zoo, Fame, and Prison life. God Mode has its own tab.</span></div>`;
  html += renderBossMode(L) + renderRoyaltyPack(L) + renderMobPack(L) + renderPetsPack(L) + renderFamePack(L);
  if (inPrison(L)) html += renderPrisonPack(L);
  return html;
}

function renderBossMode(L) {
  let rows = (L.businesses || []).map((b) => {
    const t = businessType(b);
    return row(t.emoji, b.name, `${t.name} · ${b.employees} staff · Rep ${b.reputation}% · Last year ${b.lastProfit >= 0 ? "+" : ""}${formatMoney(b.lastProfit)}`, () => push({ type: "business", id: b.id }), { right: formatMoney(b.value), chev: true });
  }).join("");
  if (L.age >= 18 && !inPrison(L)) rows += row("➕", "Start a business", "Coffee shops to car dealerships", () => choose("What kind of business?", `You have ${formatMoney(L.money)}.`,
    BusinessTypes.map((t) => ({ label: `${t.emoji} ${t.name} · ${formatMoney(t.cost)}`, fn: () => act((x) => startBusiness(x, t.id)) }))), { chev: true });
  if (!rows) rows = `<div class="pad muted">Available at 18.</div>`;
  return section("💼 Boss Mode", rows, "Your businesses make (or lose) money every year.");
}

function renderBusiness(L, view) {
  const b = (L.businesses || []).find((x) => x.id === view.id);
  if (!b) return `<div class="pad muted">That business no longer exists.</div>`;
  const t = businessType(b);
  let html = `<div class="hero-person"><div class="big">${t.emoji}</div><h3>${esc(b.name)}</h3><div class="muted">${t.name} · founded at age ${b.founded}${b.isPublic ? " · Publicly traded" : ""}</div></div>`;
  html += section("Numbers", lv("Value", formatMoney(b.value)) + lv("Last year's profit", `${b.lastProfit >= 0 ? "+" : ""}${formatMoney(b.lastProfit)}`, b.lastProfit >= 0 ? "money-pos" : "money-neg")
    + lv("Employees", b.employees) + lv("Locations", Math.floor(b.stage)) + `<div class="pad">${statBar("Reputation", "⭐", b.reputation)}</div>`);
  const used = (a) => usedThisYear(L, `biz-${b.id}-${a}`);
  html += section("Run it", [
    row("👔", "Hire an employee", "$5,000 · more capacity", () => act((x) => businessAction(x, b.id, "hire"))),
    row("✂️", "Lay someone off", "Cuts costs, hurts morale", () => act((x) => businessAction(x, b.id, "layoff")), { disabled: b.employees <= 1 }),
    row("📣", "Ad campaign", used("marketing") ? "Done this year" : "Boost reputation", () => act((x) => businessAction(x, b.id, "marketing")), { disabled: used("marketing") }),
    row("🧪", "Launch a new product", used("launch") ? "Done this year" : "Big upside, real risk", () => act((x) => businessAction(x, b.id, "launch")), { disabled: used("launch") }),
    row("🏢", "Expand", used("expand") ? "Done this year" : `Open another location · ${formatMoney(Math.trunc(t.cost * b.stage))}`, () => act((x) => businessAction(x, b.id, "expand")), { disabled: used("expand") }),
    row("🔔", "Go public (IPO)", b.isPublic ? "Already public" : "Needs a $5M valuation", () => act((x) => businessAction(x, b.id, "ipo")), { disabled: b.isPublic || b.value < 5000000 }),
    row("✏️", "Rename", null, () => { requestName(L, "business", b.id); save(); render(); }),
    row("🤝", "Sell the business", formatMoney(b.value), () => choose(`Sell ${b.name}?`, `You'll get ${formatMoney(b.value)}.`, [{ label: "Sell", fn: () => { ui.stack.pop(); act((x) => businessAction(x, b.id, "sell")); } }, { label: "Keep it", secondary: true, fn: () => {} }])),
    row("🔒", "Close it down", null, () => choose(`Close ${b.name}?`, "You won't get anything for it.", [{ label: "Close", danger: true, fn: () => { ui.stack.pop(); act((x) => businessAction(x, b.id, "close")); } }, { label: "Keep it", secondary: true, fn: () => {} }]), { danger: true }),
  ].join(""));
  return html;
}

function renderRoyaltyPack(L) {
  const r = L.royal;
  if (!r || r.renounced) {
    return section("👑 Royalty", `<div class="pad muted">${r && r.renounced ? "You gave up (or lost) your royal title." : "Start a royal life from the start screen (\"Be born royal\") to rule a kingdom."}</div>`);
  }
  let html = lv("Title", `${royalTitle(L)} of ${esc(r.country)}`) + (r.isMonarch ? lv("Status", "Reigning monarch") : lv("Line of succession", ordinal(r.line)))
    + `<div class="pad">${statBar("Popularity", "📊", r.popularity)}</div>`;
  html += royalActionsFor(L).map((a) => {
    const [emoji, title, sub] = RoyalActions[a];
    const done = !["abdicate", "renounce"].includes(a) && usedThisYear(L, `royal-${a}`);
    const run = () => act((x) => royalAction(x, a));
    const fn = a === "abdicate" || a === "renounce" ? () => choose(`${title}?`, "This can't be undone.", [{ label: title, danger: true, fn: run }, { label: "Cancel", secondary: true, fn: () => {} }]) : run;
    return row(emoji, title, done ? "Done this year" : sub, fn, { disabled: done, danger: a === "abdicate" || a === "renounce" });
  }).join("");
  return section("👑 Royalty", html, r.isMonarch ? "Keep the people happy. Monarchs with very low popularity get overthrown." : "When the monarch dies, the next in line is crowned.");
}

function renderMobPack(L) {
  const mob = L.mob;
  if (!mob) {
    if (L.age < 18 || inPrison(L)) return section("🕴️ Organized Crime", `<div class="pad muted">Crime families recruit adults only.</div>`);
    return section("🕴️ Organized Crime", CrimeFamilies.map((f) => row(f.emoji, `Join ${f.name}`, f.style, () => choose(`Join ${f.name}?`, "Once you're in, leaving is dangerous.", [{ label: "Ask to join", fn: () => act((x) => joinMob(x, f.id)) }, { label: "Cancel", secondary: true, fn: () => {} }]), { chev: true })).join(""),
      "A criminal record and low karma make them trust you more.");
  }
  const f = mobFamily(L);
  let html = lv("Family", `${f.emoji} ${esc(f.name)}`) + lv("Rank", MobRanks[mob.rank]) + `<div class="pad">${statBar("Respect", "🤝", mob.respect)}${statBar("Police heat", "🚨", mob.heat)}</div>`;
  html += Object.entries(MobActions).filter(([a]) => !(a === "hit" && mob.rank < 1) && !(a === "promote" && mob.rank >= MobRanks.length - 1)).map(([a, [emoji, title]]) => {
    const done = ["protection", "smuggle", "heist", "hit", "bribe", "lieLow", "promote"].includes(a) && usedThisYear(L, `mob-${a}`);
    const sub = a === "promote" ? `Next: ${MobRanks[mob.rank + 1]} · needs ${mobRespectNeeded[mob.rank + 1]} respect` : a === "bribe" ? formatMoney(20000 * (mob.rank + 1)) : null;
    const run = () => act((x) => mobAction(x, a));
    const fn = a === "leave" || a === "snitch" ? () => choose(`${title}?`, a === "leave" ? "They might not take it well." : "You'll get a new identity in a new country, but they never forget.", [{ label: title, danger: true, fn: run }, { label: "Cancel", secondary: true, fn: () => {} }]) : run;
    return row(emoji, title, done ? "Done this year" : sub, fn, { disabled: done || inPrison(L), danger: a === "leave" || a === "snitch" });
  }).join("");
  return section("🕴️ Organized Crime", html, "High heat means the FBI may raid you. Bosses earn tribute from their crews.");
}

function renderPetsPack(L) {
  let html = "";
  if (L.age >= 18 && !inPrison(L)) {
    html += row("🦁", "Exotic pet store", "Tigers, monkeys, snakes and more", () => choose("Exotic pet store", `You have ${formatMoney(L.money)}. Dangerous animals can turn on you.`,
      ExoticPets.map((p) => ({ label: `${p.emoji} ${p.species} · ${formatMoney(p.price)}${p.danger >= 0.03 ? " ⚠️" : ""}`, fn: () => act((x) => buyExoticPet(x, p.species)) }))), { chev: true });
  }
  const z = L.zoo;
  if (z) {
    html += lv("Zoo", `🦒 ${esc(z.name)}`) + lv("Animals", z.animals) + `<div class="pad">${statBar("Reputation", "⭐", z.reputation)}</div>`;
    const used = (a) => usedThisYear(L, `zoo-${a}`);
    html += row("🐘", "Open a new exhibit", used("exhibit") ? "Done this year" : "$250,000", () => act((x) => zooAction(x, "exhibit")), { disabled: used("exhibit") });
    html += row("📣", "Advertise the zoo", used("marketing") ? "Done this year" : "$60,000", () => act((x) => zooAction(x, "marketing")), { disabled: used("marketing") });
    html += row("🐣", "Breeding program", used("breeding") ? "Done this year" : "Baby animals draw crowds", () => act((x) => zooAction(x, "breeding")), { disabled: used("breeding") });
    html += row("✏️", "Rename the zoo", null, () => { requestName(L, "zoo", "zoo"); save(); render(); });
    html += row("🤝", "Sell the zoo", null, () => act((x) => zooAction(x, "sell")));
  } else if (L.age >= 18) {
    html += row("🦒", "Buy a zoo", "$2,500,000 · earns money from visitors", () => act(buyZoo), { disabled: L.money < 2500000 });
  }
  if (!html) html = `<div class="pad muted">Available at 18. Visit the pet shelter in the People tab for regular pets.</div>`;
  return section("🐾 Pets & Zoo", html, "Train, groom and show your pets from their page in the People tab.");
}

function renderFamePack(L) {
  if (!isCelebrity(L)) return section("🌟 Fame", `<div class="pad muted">Become famous (fame 20%+ or 50,000 followers) to unlock celebrity life. Try acting, music, sports or social media.</div>`);
  const html = `<div class="pad">${statBar("Fame", "⭐", L.fame)}</div>` + lv("Followers", formatCount(L.followers)) + Object.entries(FameActions).map(([a, [emoji, title, sub]]) => {
    const done = usedThisYear(L, `fame-${a}`);
    return row(emoji, title, done ? "Done this year" : sub, () => act((x) => fameAction(x, a)), { disabled: done });
  }).join("");
  return section("🌟 Fame", html, "Famous people also attract the paparazzi.");
}

function renderPrisonPack(L) {
  const pl = prisonLife(L);
  let html = lv("Behavior", `${pl.behavior}/100`) + lv("Respect", `${pl.respect}/100`) + lv("Gang", pl.gang ? esc(pl.gang) : "None") + (pl.tunnel ? lv("Escape tunnel", `${pl.tunnel}% dug`) : "");
  html += Object.entries(PrisonPackActions).map(([a, [emoji, title, sub]]) => {
    const done = usedThisYear(L, `prison-${a}`);
    return row(emoji, title, done ? "Done this year" : sub, () => act((x) => prisonPackAction(x, a)), { disabled: done || (a === "gang" && !!pl.gang) });
  }).join("");
  return section("⛓️ Prison Life", html, "Good behavior helps at parole hearings. Gangs and fights hurt it.");
}

// MARK: Royal start

function chooseRoyalStart() {
  readForm();
  choose("Be born royal", "Pick the kingdom you'll be born into.", Monarchies.map(([country, capital]) => ({
    label: `👑 ${country}`,
    fn: () => {
      store.life = newRoyalLife(country, ui.form.first, ui.form.gender);
      store.life.mature = !!store.settings.mature;
      ui.tab = "packs"; ui.stack = []; ui.outcome = null; ui.openings = null;
      save();
    },
  })));
}
