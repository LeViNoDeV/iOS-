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

// MARK: Packs hub

const kpis = (items) => `<div class="kpis">${items.filter(Boolean).map(([label, value]) => `<div class="kpi"><span>${esc(label)}</span><b>${value}</b></div>`).join("")}</div>`;
const intro = (html) => `<div class="pack-intro">${html}</div>`;
const doneSub = (L, key, sub) => (usedThisYear(L, key) ? "Done this year" : sub);
const settingRow = (label, items, current, onPick) => `<div class="seg-row"><span>${esc(label)}</span><div class="seg">${items.map(([id, text]) =>
  `<button class="btn small" aria-pressed="${current === id}" data-h="${h(() => onPick(id))}">${esc(text)}</button>`).join("")}</div></div>`;
const setAndSave = (fn) => { fn(); save(); render(); };

function renderPacks(L) {
  const bizCount = (L.businesses || []).length;
  const pets = L.relationships.filter((p) => p.isAlive && p.kind === "pet").length;
  const rows = [
    row("💼", "Boss Mode", bizCount ? `${bizCount} ${bizCount === 1 ? "business" : "businesses"} · worth ${formatMoney((L.businesses || []).reduce((s, b) => s + businessValuation(b) * ownerStake(b), 0))}` : "Start and run your own company", () => push({ type: "pack", id: "boss" }), { chev: true }),
    row("👑", "Royalty", L.royal ? (royalActive(L) ? `${royalTitle(L)} of ${L.royal.country} · approval ${L.royal.approval}%` : royalTitle(L) || "Former royal") : "Royal lives start from the main menu", () => push({ type: "pack", id: "royal" }), { chev: true }),
    row("🕴️", "Organized Crime", L.mob ? `${MobRanks[L.mob.rank]} · ${mobFamily(L).name}` : "Get in with a crime family", () => push({ type: "pack", id: "crime" }), { chev: true }),
    row("🐾", "Pets & Exotic Animals", pets ? `${plural(pets, "pet")}` : "Permits, land and the animals you can keep", () => push({ type: "pack", id: "pets" }), { chev: true }),
    row("🦒", "Zoo", L.zoo ? `${L.zoo.name}${L.zoo.accredited ? " · Accredited" : ""}` : `Buy a struggling zoo · ${formatMoney(ZOO_PRICE)}`, () => push({ type: "pack", id: "zoo" }), { chev: true }),
    row("⭐", "Fame", isCelebrity(L) ? `Fame ${L.fame}% · Image ${celebImage(L)}%` : "Become famous first", () => push({ type: "pack", id: "fame" }), { chev: true }),
    row("⛓️", "Prison", inPrison(L) ? `${plural(L.prisonYearsLeft, "year")} left` : L.fugitive ? "On the run" : "Life inside, if it comes to that", () => push({ type: "pack", id: "prison" }), { chev: true }),
  ];
  return intro("<b>Expansion packs.</b> Deeper ways to live: run a company, wear a crown, join the mob, keep animals, manage fame, or survive prison. God Mode has its own tab.")
    + section("Packs", rows.join(""));
}

function renderPack(L, view) {
  switch (view.id) {
    case "boss": return renderBossMode(L);
    case "royal": return renderRoyaltyPack(L);
    case "crime": return renderMobPack(L);
    case "pets": return renderPetsPack(L);
    case "zoo": return renderZooPack(L);
    case "fame": return renderFamePack(L);
    case "prison": return inPrison(L) || L.fugitive ? renderPrisonPack(L) : intro("You're not in prison. If you ever are, this is where you'll do your time: jobs, school, gangs, appeals, parole and escape plans.");
  }
  return "";
}

// MARK: Boss Mode

function renderBossMode(L) {
  let html = intro("<b>Boss Mode.</b> You set prices, wages, staffing and marketing. Customers, revenue and costs follow from those choices. Each business has its own bank account; it can borrow, and you can pay yourself a salary or dividends.");
  const mine = (L.businesses || []).map((b) => row(industryOf(b).emoji, b.name, `${industryOf(b).name}${b.isPublic ? " · Public" : ""}${b.ceo ? "" : " · Not CEO"} · ${b.last ? `${b.last.profit >= 0 ? "+" : "-"}${formatMoney(Math.abs(b.last.profit))} last year` : "Just opened"}`,
    () => push({ type: "business", id: b.id }), { right: formatMoney(Math.round(businessValuation(b) * ownerStake(b))) })).join("");
  if (mine) html += section("Your businesses", mine);
  const canStart = L.age >= 18 && !inPrison(L);
  html += section("Start a business", Object.entries(Industries).map(([id, t]) => row(t.emoji, t.name,
    `${formatMoney(t.startup)} to open · ${t.tech ? "engineers" : `${t.staffPer} staff`} · rent ${formatMoney(t.rent)}/yr${t.tech ? " · high risk, high growth" : ""}`,
    () => choose(`Open a ${t.name.toLowerCase()}?`, `It costs ${formatMoney(t.startup)}. A quarter of that goes into the business account to cover the first bills.\nTypical staff wage: ${formatMoney(t.wage)}/yr.`, [
      { label: `Open it (${formatMoney(t.startup)})`, fn: () => act((x) => startBusiness(x, id)) }, { label: "Cancel", secondary: true, fn: () => {} },
    ]), { disabled: !canStart || L.money < t.startup, right: `<span class="${L.money >= t.startup ? "money-pos" : "money-neg"}">${formatMoney(t.startup)}</span>` })).join(""),
    canStart ? null : "Available to adults outside prison.");
  return html;
}

function renderBusiness(L, view) {
  const b = (L.businesses || []).find((x) => x.id === view.id);
  if (!b) return `<div class="pad muted">That business no longer exists.</div>`;
  normalizeBusiness(b);
  const t = industryOf(b);
  const val = businessValuation(b);
  let html = `<div class="hero-person"><div class="big">${t.emoji}</div><h3>${esc(b.name)}</h3><div class="muted">${t.name} · founded at age ${b.founded}${b.isPublic ? " · Publicly traded" : ""}${ownerStake(b) < 1 ? ` · You own ${Math.round(ownerStake(b) * 100)}%` : ""}</div></div>`;
  html += kpis([
    ["Business cash", formatMoney(b.cash)], ["Debt", formatMoney(b.debt)], ["Company value", formatMoney(val)],
    ["Staff", `${b.staff} / ${staffNeeded(b)}`], ["Quality", `${b.quality}%`], ["Reputation", `${b.reputation}%`], ["Morale", `${b.morale}%`],
    t.tech ? ["Subscribers", formatCount(b.users)] : ["Locations", b.locations], t.tech && b.growth != null ? ["Growth", pctText(b.growth)] : null,
  ]);
  if (b.last) {
    const c = b.last.costs;
    let pl = lv(`Revenue (${formatCount(b.last.customers)} ${t.unit})`, formatMoney(b.last.revenue), "money-pos")
      + lv("Wages", `-${formatMoney(c.wages)}`) + lv(t.tech ? "Offices" : "Rent", `-${formatMoney(c.rent)}`) + lv(t.tech ? "Servers & support" : "Supplies", `-${formatMoney(c.supplies)}`);
    if (c.marketing) pl += lv("Marketing", `-${formatMoney(c.marketing)}`);
    if (c.interest) pl += lv("Interest", `-${formatMoney(c.interest)}`);
    if (c.owner) pl += lv("Your salary", `-${formatMoney(c.owner)}`);
    if (b.last.tax) pl += lv("Corporate tax", `-${formatMoney(b.last.tax)}`);
    pl += lv("Profit", `${b.last.profit >= 0 ? "" : "-"}${formatMoney(Math.abs(b.last.profit))}`, b.last.profit >= 0 ? "money-pos" : "money-neg");
    if (b.history.length > 1) pl += `<div class="pad muted small">History: ${b.history.slice(-6).map((y) => `${y.age}: ${y.profit >= 0 ? "+" : "-"}${formatMoney(Math.abs(y.profit))}`).join(" · ")}</div>`;
    html += section("Last year", pl);
  } else html += intro("Your first year's numbers will show up here after you age up.");
  if (!b.ceo) {
    html += section("Shares", row("📈", "Sell 10% of your shares", `About ${formatMoney(Math.round(val * Math.min(0.1, ownerStake(b))))}`, () => act((x) => businessAction(x, b.id, "sellShares"))),
      "The board replaced you as CEO. You still collect dividends on your shares.");
    return html;
  }
  const set = (field) => (v) => setAndSave(() => setBusiness(L, b.id, field, v));
  html += section("How you run it",
    settingRow("Prices", Object.entries(PriceLevels).map(([id, p]) => [id, `${p[0]} $${t.tickets[p[1]].toLocaleString("en-US")}`]), b.price, set("price"))
    + settingRow("Wages", Object.entries(WageLevels).map(([id, w]) => [id, w[0]]), b.wage, set("wage"))
    + settingRow("Marketing", Object.entries(MarketingLevels).map(([id, m]) => [id, m[0]]), b.marketing, set("marketing"))
    + settingRow("Your salary", OwnerPay.map((v) => [String(v), v ? formatMoney(v) : "$0"]), String(b.salary), set("salary")),
    "Premium prices need high quality. Low wages save money but hurt morale, and morale drives quality.");
  const need = staffNeeded(b) - b.staff;
  let staff = row("👔", need > 0 ? `Hire ${need} ${need === 1 ? "person" : "people"} to fill the gaps` : "Hire one more", need > 0 ? "You're understaffed: you're losing customers" : t.tech ? "More engineers, better product" : "Extra hands help quality a little", () => act((x) => businessAction(x, b.id, "hire", Math.max(1, need))));
  staff += row("✂️", "Lay off one person", "Severance, and morale drops", () => act((x) => businessAction(x, b.id, "fire", 1)), { disabled: b.staff <= 1 });
  html += section("Staff", staff);
  let grow = row("✨", t.tech ? "Invest in engineering" : "Invest in quality", doneSub(L, `biz-${b.id}-quality`, `${formatMoney(Math.max(15000, Math.round(t.startup * 0.12 * (t.tech ? 1 : b.locations))))} from the business account`), () => act((x) => businessAction(x, b.id, "quality")), { disabled: usedThisYear(L, `biz-${b.id}-quality`) });
  if (!t.tech) {
    grow += row("🏢", `Open another ${t.place}`, `${formatMoney(Math.round(t.startup * 0.85))} from the business account`, () => act((x) => businessAction(x, b.id, "expand")), { disabled: b.cash < Math.round(t.startup * 0.85) });
    if (b.locations > 1) grow += row("🔒", `Close a ${t.place}`, "Cut losses at a weak location", () => act((x) => businessAction(x, b.id, "closeLocation")));
  }
  html += section("Grow", grow);
  const room = Math.max(0, Math.round(Math.max(t.startup, (b.last?.revenue || 0) * 0.5) - b.debt));
  const amounts = (max, fn) => [0.25, 0.5, 1].map((f) => Math.round(max * f / 1000) * 1000).filter((v, i, a) => v > 0 && a.indexOf(v) === i).map((v) => ({ label: formatMoney(v), fn: () => fn(v) }));
  let money = row("🏦", "Borrow from the bank", room ? `Up to ${formatMoney(room)} at 9%` : "The bank won't lend more right now", () => choose("How much?", null, [...amounts(room, (v) => act((x) => businessAction(x, b.id, "loan", v))), { label: "Cancel", secondary: true, fn: () => {} }]), { disabled: !room });
  if (b.debt) money += row("💳", "Repay debt", `${formatMoney(Math.min(b.debt, b.cash))} from the business account`, () => act((x) => businessAction(x, b.id, "repay")), { disabled: b.cash <= 0 });
  money += row("💼", "Put your own money in", `You have ${formatMoney(L.money)}`, () => choose("How much?", null, [...amounts(Math.max(0, L.money), (v) => act((x) => businessAction(x, b.id, "invest", v))), { label: "Cancel", secondary: true, fn: () => {} }]), { disabled: L.money <= 0 });
  money += row("💵", "Pay yourself a dividend", b.cash > 0 ? `Up to ${formatMoney(b.cash)} · 15% dividend tax` : "No cash to pay out", () => choose("How much?", null, [...amounts(b.cash, (v) => act((x) => businessAction(x, b.id, "withdraw", v))), { label: "Cancel", secondary: true, fn: () => {} }]), { disabled: b.cash <= 0 });
  html += section("Money", money);
  let inv = "";
  if (t.tech && FundingRounds[b.round]) inv += row("🎤", `Pitch investors: ${FundingRounds[b.round][0]}`, doneSub(L, `biz-${b.id}-raise`, `Needs ${formatCount(FundingRounds[b.round][1])} subscribers · sell 20% for cash`), () => act((x) => businessAction(x, b.id, "fundraise")), { disabled: usedThisYear(L, `biz-${b.id}-raise`) || b.users < FundingRounds[b.round][1] });
  if (!b.isPublic) inv += row("🔔", "Go public (IPO)", val >= 150000000 ? "Raise money on the stock market" : `Needs a $150M valuation (now ${formatMoney(val)})`, () => act((x) => businessAction(x, b.id, "ipo")), { disabled: val < 150000000 });
  else inv += row("📈", "Sell 10% of your shares", `About ${formatMoney(Math.round(val * Math.min(0.1, ownerStake(b))))}`, () => act((x) => businessAction(x, b.id, "sellShares")));
  if (inv) html += section("Investors", inv, b.isPublic && ownerStake(b) < 0.5 ? "You own less than half. Two losing years and the board could replace you." : null);
  html += section("Exit", row("🤝", "Sell the business", `Buyers would pay around ${formatMoney(val)}`, () => choose(`Sell ${b.name}?`, `You'd get about ${formatMoney(Math.round(val * ownerStake(b)))} before 20% capital gains tax.`, [
    { label: "Sell it", fn: () => { ui.stack.pop(); act((x) => businessAction(x, b.id, "sell")); } }, { label: "Keep it", secondary: true, fn: () => {} },
  ])) + row("🔒", "Shut it down", "Pay off debts and close", () => choose(`Close ${b.name}?`, "This can't be undone.", [
    { label: "Close it", danger: true, fn: () => { ui.stack.pop(); act((x) => businessAction(x, b.id, "close")); } }, { label: "Keep it open", secondary: true, fn: () => {} },
  ]), { danger: true }));
  return html;
}

// MARK: Royalty

function renderRoyaltyPack(L) {
  if (!L.royal) return intro("<b>Royalty.</b> Royal lives start from the main menu: choose <b>👑 Be born royal</b> and pick one of 25 real monarchies. Each has its own titles, succession law and powers.");
  normalizeRoyal(L);
  const r = L.royal;
  const m = monarchyOf(r.country);
  const line = royalLine(L);
  let html = `<div class="hero-person"><div class="big">👑</div><h3>${esc(royalTitle(L) || "Former royal")}</h3><div class="muted">${esc(r.country)} · ${m.gov === "absolute" ? "Absolute monarchy" : "Constitutional monarchy"}</div></div>`;
  if (!royalActive(L)) return html + intro(r.abolished ? "The monarchy is gone. You kept your private fortune." : "You renounced your title. You're a private citizen now.");
  html += `<div class="pad">${statBar("Approval", "📊", r.approval)}</div>`;
  html += section("Your place", lv("Line of succession", r.isMonarch ? `You reign (since age ${r.reignStart})` : line ? `${ordinal(line)} in line` : r.abdicated ? "Abdicated" : r.distant ? "Distant from the throne" : "Not in line")
    + lv("Succession law", m.succession === "equal" ? "Absolute primogeniture" : m.succession === "male-pref" ? "Male preference" : "Male only")
    + lv("Patronages", r.patronages.length ? esc(r.patronages.join(", ")) : "None yet")
    + lv("Royal income", L.age < 18 ? "Your parents' household" : r.isMonarch ? `${formatMoney(m.purse)}/yr` : `${formatMoney(Math.round(m.purse * 0.25))}/yr if you work (2+ duties)`),
    `${SuccessionText[m.succession]} ${m.gov === "absolute" ? "Here the monarch rules by decree." : "Here the monarch reigns but doesn't rule: parliament makes the laws."}`);
  const acts = royalActionsFor(L).map((id) => {
    const a = RoyalActions[id];
    const used = !a.final && usedThisYear(L, `royal-${id}`);
    let fn = () => act((x) => royalAction(x, id));
    if (id === "patronage") fn = () => choose("Which cause?", "You'll be its royal patron for life.", RoyalCauses.filter((c) => !r.patronages.includes(c)).map((c) => ({ label: c, fn: () => act((x) => royalAction(x, id, c)) })).concat([{ label: "Cancel", secondary: true, fn: () => {} }]));
    if (a.final) fn = () => choose(`${a.title}?`, id === "abdicate" ? "Your heir will take the throne. You can't take it back." : "You'll lose your title, allowance and place in line, for good.", [
      { label: a.title, danger: true, fn: () => act((x) => royalAction(x, id)) }, { label: "Cancel", secondary: true, fn: () => {} },
    ]);
    return row(a.emoji, a.title, used ? "Done this year" : a.sub, fn, { disabled: used, danger: a.final });
  }).join("");
  html += section(r.isMonarch ? "Reign" : "Royal life", acts || `<div class="pad muted">Not much a young royal can do yet.</div>`,
    "Working royals carry out at least two duties a year. Scandals, arrests and neglected duties cost approval.");
  return html;
}

function chooseRoyalStart() {
  readForm();
  const note = { equal: "", "male-pref": " · sons first", "male-only": " · men only" };
  choose("Be born royal", "Pick the monarchy you'll be born into.", Monarchies.map((m) => ({
    label: `👑 ${m.country}${note[m.succession]}${m.gov === "absolute" ? " · absolute" : ""}`,
    fn: () => {
      store.life = newRoyalLife(m.country, ui.form.first, ui.form.gender);
      if (ui.form.look) applyChosenLook(store.life, ui.form.look);
      store.life.mature = !!store.settings.mature;
      store.life.protection = true;
      ui.tab = "packs"; ui.stack = [{ type: "pack", id: "royal" }]; ui.outcome = null; ui.openings = null;
      save();
    },
  })));
}

// MARK: Organized Crime

function renderMobPack(L) {
  const mob = L.mob;
  if (!mob) {
    let html = intro(`<b>Organized Crime.</b> Families only take people the street can vouch for. Your street cred: <b>${streetCred(L)}</b> (from your criminal record and crimes you've committed). Once you're made, there's no walking away.`);
    if (L.snitched) return html + intro("You testified against a family. No one in this life will ever trust you again.");
    if (L.age < 18 || inPrison(L)) return html + intro("Families recruit adults on the outside.");
    return html + section("Families", CrimeFamilies.map((f) => row(f.emoji, f.name, doneSub(L, "mob-join", f.desc), () => choose(`Get in with ${f.name}?`, "You'll start as an associate, running errands. Getting made comes later.", [
      { label: "Ask around", fn: () => act((x) => joinMob(x, f.id)) }, { label: "Cancel", secondary: true, fn: () => {} },
    ]), { disabled: usedThisYear(L, "mob-join") })).join(""));
  }
  normalizeMob(L);
  const f = mobFamily(L);
  let html = `<div class="hero-person"><div class="big">${f.emoji}</div><h3>${MobRanks[mob.rank]}</h3><div class="muted">${esc(f.name)} · Boss: ${esc(mob.boss)}</div></div>`;
  html += `<div class="pad">${statBar("Respect", "🎩", mob.respect)}${statBar("Loyalty", "🤝", mob.loyalty)}${statBar("Heat", "🚨", mob.heat)}</div>`;
  const missing = promotionNeeds(mob);
  html += section("Standing", lv("Years in the family", mob.years) + (mob.rank >= 2 ? lv("Your crew", mob.crew) : "") + lv("Kick-up", mob.rank === 4 ? "You collect it" : mob.skimming ? "15% (skimming)" : "30% to the boss")
    + (missing ? lv(`Next: ${MobRanks[mob.rank + 1]}`, missing.length ? esc(`Needs ${missing.join(", ")}`) : "Ready to ask") : ""),
    "Respect is your standing on the street. Loyalty is how much the boss trusts you. Heat is how closely the FBI is watching.");
  if (mob.rank >= 1) {
    const cap = racketCap(mob);
    html += section(`Rackets (${racketLevels(mob)} of ${cap})`, Object.entries(Rackets).map(([id, rk]) => {
      const lvl = mob.rackets[id];
      const ok = mob.rank >= rk.rank;
      return row(rk.emoji, `${rk.name}${lvl ? ` · level ${lvl}` : ""}`, ok ? `${rk.desc} · ${lvl ? `${formatMoney(rk.income * lvl)}/yr now · ` : ""}${lvl >= 3 ? "maxed" : `${lvl ? "expand" : "start"} for ${formatMoney(rk.cost * (lvl + 1))}`}` : `${MobRanks[rk.rank]}s and up`,
        () => act((x) => startRacket(x, id)), { disabled: !ok || lvl >= 3 || racketLevels(mob) >= cap });
    }).join("") + (mob.rank < 4 ? row("🧮", mob.skimming ? "Pay your full kick-up" : "Skim from your kick-up", mob.skimming ? "Stop before the boss notices" : "Keep more. If they find out, it's bad", () => setAndSave(() => setSkimming(L, !mob.skimming)), { danger: !mob.skimming }) : ""),
    "Rackets pay every year and raise your heat.");
  }
  const acts = mobActionsFor(L).map((id) => {
    const a = MobActions[id];
    const final = ["walkAway", "flip", "coup", "retire"].includes(id);
    const used = !final && usedThisYear(L, `mob-${id}`);
    const sub = id === "promote" ? (missing && missing.length ? `Needs ${missing.join(", ")}` : `Ask to become ${MobRanks[mob.rank + 1]}`) : a.sub;
    const fn = final ? () => choose(`${a.title}?`, id === "flip" ? "You'll testify, get a new name and a new country. The family will never stop looking." : "There's no undoing this.", [
      { label: a.title, danger: true, fn: () => act((x) => mobAction(x, id)) }, { label: "Cancel", secondary: true, fn: () => {} },
    ]) : () => act((x) => mobAction(x, id));
    return row(a.emoji, a.title, used ? "Done this year" : sub, fn, { disabled: used, danger: final });
  }).join("");
  html += section("Business", acts || `<div class="pad muted">You're in prison. Keep your mouth shut.</div>`);
  return html;
}

// MARK: Pets & exotic animals

function renderPetsPack(L) {
  const pets = L.relationships.filter((p) => p.isAlive && p.kind === "pet");
  let html = intro("<b>Pets & exotic animals.</b> Every animal costs money each year and lives a realistic lifespan. Exotic animals need a permit, some need land, and big predators need a secure enclosure. Training makes them safer.");
  if (pets.length) html += section("Your animals", pets.map((p) => row(relEmoji(p), p.firstName, `${p.species} · age ${p.age} · health ${ensureNpcStats(p).health}%${p.illegal ? " · ⚠️ illegal" : ""} · ${formatMoney(petInfo(p).upkeep)}/yr`, () => push({ type: "person", id: p.id }), { chev: true })).join(""));
  if (L.age < 18) return html + intro("You can keep exotic animals as an adult.");
  const permit = L.permits?.exotic;
  html += section("Paperwork & property",
    row("📋", permit ? "Exotic animal permit: granted" : "Apply for an exotic animal permit", permit ? "You can legally keep permitted species" : doneSub(L, "permit", "$1,500 · needs a house, not an apartment, and a clean-ish record"), () => act(applyExoticPermit), { disabled: permit || usedThisYear(L, "permit") })
    + row("🌾", hasLand(L) ? "You have land" : "You need land for some animals", hasLand(L) ? "Horses, alpacas and big animals can live here" : "Buy a farmhouse, mansion, estate or castle under Money › Real estate", null)
    + row("🏗️", L.enclosure ? "Secure enclosure: built" : "Build a secure enclosure", L.enclosure ? "Big predators are contained" : "$60,000 · needs land · required for big predators", () => act(buildEnclosure), { disabled: !!L.enclosure || !hasLand(L) }));
  html += section("Exotic animals for sale", ExoticPets.map((ex) => {
    const blockers = exoticBlockers(L, ex);
    const sub = `${formatMoney(ex.upkeep)}/yr · lives ~${ex.life} years${ex.danger ? " · dangerous" : ""}${blockers.length ? ` · needs ${blockers.join(", ")}` : ""}`;
    const fn = blockers.length ? () => choose(`Buy a ${ex.species.toLowerCase()} illegally?`, `You don't have ${blockers.join(" or ")}. A dealer will sell you one for ${formatMoney(Math.round(ex.price * 1.4))}, but wildlife officers raid illegal owners.`, [
      { label: "Buy it from the dealer", danger: true, fn: () => act((x) => buyExoticPet(x, ex.species, true)) }, { label: "Never mind", secondary: true, fn: () => {} },
    ]) : () => act((x) => buyExoticPet(x, ex.species));
    return row(ex.emoji, ex.species, sub, fn, { right: `<span class="${L.money >= ex.price ? "money-pos" : "money-neg"}">${formatMoney(ex.price)}</span>` });
  }).join(""), "Ordinary pets are adopted from the shelter in the People tab.");
  return html;
}

// MARK: Zoo

function renderZooPack(L) {
  if (!L.zoo) {
    return intro(`<b>Zoo.</b> A small, struggling zoo is for sale for ${formatMoney(ZOO_PRICE)}: flamingos, zebras and kangaroos, tired habitats and a skeleton staff. Turn it around with better exhibits, more keepers, conservation work and, one day, accreditation.`)
      + section("For sale", row("🦒", "Buy the zoo", L.age < 18 ? "Adults only" : formatMoney(ZOO_PRICE), () => act(buyZoo), { disabled: L.age < 18 || L.money < ZOO_PRICE }));
  }
  normalizeZoo(L);
  const z = L.zoo;
  let html = `<div class="hero-person"><div class="big">🦒</div><h3>${esc(z.name)}</h3><div class="muted">${z.accredited ? "🏅 Accredited zoo" : "Not accredited"} · owned ${plural(z.years, "year")}</div></div>`;
  html += kpis([["Visitors", z.last ? formatCount(z.last.visitors) : "—"], ["Profit", z.last ? `${z.last.profit >= 0 ? "" : "-"}${formatMoney(Math.abs(z.last.profit))}` : "—"],
    ["Keepers", `${z.keepers} / ${keepersNeeded(z)}`], ["Animals", zooAnimalCount(z)], ["Value", formatMoney(zooValue(z))]]);
  html += `<div class="pad">${statBar("Reputation", "⭐", z.reputation)}${statBar("Habitats", "🌿", z.habitat)}${statBar("Conservation", "🌍", z.conservation)}</div>`;
  if (z.last) {
    const c = z.last.costs;
    html += section("Last year", lv("Tickets, food & grants", formatMoney(z.last.revenue), "money-pos") + lv("Keepers", `-${formatMoney(c.keepers)}`) + lv("Animal care", `-${formatMoney(c.animals)}`)
      + lv("Habitat upkeep", `-${formatMoney(c.habitats)}`) + (c.marketing ? lv("Marketing", `-${formatMoney(c.marketing)}`) : "") + lv("Operations & staff", `-${formatMoney(c.operations)}`)
      + lv("Profit", `${z.last.profit >= 0 ? "" : "-"}${formatMoney(Math.abs(z.last.profit))}`, z.last.profit >= 0 ? "money-pos" : "money-neg"));
  }
  const set = (field) => (v) => setAndSave(() => setZoo(L, field, v));
  html += section("Running it", settingRow("Tickets", Object.entries(ZooPrices).map(([id, p]) => [id, p[0]]), z.price, set("price"))
    + settingRow("Marketing", Object.entries(ZooMarketing).map(([id, p]) => [id, `${p[0]}${p[1] ? ` ${formatMoney(p[1])}` : ""}`]), z.marketing, set("marketing"))
    + row("🧑‍🌾", "Hire a zookeeper", `$42,000/yr · you need ${keepersNeeded(z)}`, () => act((x) => zooAction(x, "hire")))
    + row("👋", "Let a zookeeper go", "Saves money; too few keepers hurts welfare", () => act((x) => zooAction(x, "fire")), { disabled: z.keepers <= 1 }));
  html += section("Exhibits", Object.entries(z.exhibits).map(([id, n]) => {
    const a = ZooAnimals[id];
    return row(a.emoji, `${a.name} · ${n}`, `${formatMoney(a.upkeep * n)}/yr${a.endangered ? " · endangered" : ""}${a.danger ? " · dangerous" : ""}`, () => choose(a.name, `${n} animals. Appeal ${a.appeal}/16.`, [
      { label: usedThisYear(L, "zoo-breed") ? "Breeding (done this year)" : "Start a breeding program", fn: () => act((x) => zooAction(x, "breed", id)) },
      { label: `Transfer them to another zoo (+${formatMoney(Math.round(a.price * n * 0.5))})`, danger: true, fn: () => act((x) => zooAction(x, "remove", id)) },
      { label: "Close", secondary: true, fn: () => {} },
    ]), { chev: true });
  }).join("") + row("➕", "Add a new exhibit", "Animals come in pairs", () => choose("Which animals?", `You have ${formatMoney(L.money)}.`, Object.entries(ZooAnimals).filter(([id]) => !z.exhibits[id]).map(([id, a]) => ({
    label: `${a.emoji} ${a.name} · ${formatMoney(a.price * 2)}${a.accredited && !z.accredited ? " (accredited zoos only)" : ""}`, fn: () => act((x) => zooAction(x, "add", id)),
  })).concat([{ label: "Cancel", secondary: true, fn: () => {} }])), { chev: true }));
  const habCost = Object.keys(z.exhibits).length * 60000;
  html += section("Improve", row("🌿", "Upgrade all habitats", doneSub(L, "zoo-habitat", `${formatMoney(habCost)} · habitats +30`), () => act((x) => zooAction(x, "habitat")), { disabled: usedThisYear(L, "zoo-habitat") })
    + row("🌍", "Fund a conservation project", doneSub(L, "zoo-conservation", "$150,000 · conservation +12"), () => act((x) => zooAction(x, "conservation")), { disabled: usedThisYear(L, "zoo-conservation") })
    + (z.accredited ? "" : row("🏅", "Apply for accreditation", doneSub(L, "zoo-accredit", "$50,000 · needs conservation 40+, habitats 70%+, enough keepers"), () => act((x) => zooAction(x, "accredit")), { disabled: usedThisYear(L, "zoo-accredit") })),
    "Endangered species and breeding raise conservation. Accredited zoos draw more visitors, get grants, and can host giant pandas.");
  html += section("Manage", row("✏️", "Rename the zoo", null, () => { requestName(L, "zoo", "zoo"); save(); render(); })
    + row("🤝", "Sell the zoo", `About ${formatMoney(zooValue(z))}`, () => choose(`Sell ${z.name}?`, `A buyer would pay about ${formatMoney(zooValue(z))}.`, [
      { label: "Sell it", fn: () => { ui.stack.pop(); act((x) => zooAction(x, "sell")); } }, { label: "Keep it", secondary: true, fn: () => {} },
    ])));
  return html;
}

// MARK: Fame

function renderFamePack(L) {
  if (!isCelebrity(L)) return intro(`<b>Fame.</b> You're not famous yet. Get there through a famous career (acting, music, sports, modeling) or by building a following on social media. Celebrity starts at 15% fame or 50,000 followers. You have ${L.fame}% fame and ${formatCount(L.followers)} followers.`);
  const t = team(L);
  let html = `<div class="pad">${statBar("Fame", "⭐", L.fame)}${statBar("Public image", "😇", celebImage(L))}</div>` + kpis([["Followers", formatCount(L.followers)], ["Deal value", formatMoney(dealValue(L))]]);
  html += section("Your team", row("🧑‍💼", t.agent ? "Your agent" : "Sign with an agent", t.agent ? `Takes ${AGENT_CUT * 100}% of deals, brings bigger and more frequent ones · tap to part ways` : `They take ${AGENT_CUT * 100}%, but deals get much bigger and more frequent`, () => act((x) => toggleTeam(x, "agent")))
    + row("🗞️", t.publicist ? "Your publicist" : "Hire a publicist", t.publicist ? `${formatMoney(PUBLICIST_FEE)}/yr · halves the damage from scandals · tap to let go` : `${formatMoney(PUBLICIST_FEE)}/yr · halves the damage from scandals`, () => act((x) => toggleTeam(x, "publicist"))),
    "Fame is how many people know you. Image is how many like you. Brands pay for both.");
  html += section("Things to do", fameActionsFor(L).map((id) => {
    const a = FameActions[id];
    const used = usedThisYear(L, `fame-${id}`);
    let fn = () => act((x) => fameAction(x, id));
    if (id === "product") fn = () => choose("What kind of product?", t.agent ? "It costs $250,000 to launch." : "You need an agent to set up the deals.", ["fragrance", "clothing line", "skincare line", "sneaker", "cookbook series"].map((k) => ({ label: cap(k), fn: () => act((x) => fameAction(x, id, k)) })).concat([{ label: "Cancel", secondary: true, fn: () => {} }]));
    return row(a.emoji, a.title, used ? "Done this year" : a.sub, fn, { disabled: used });
  }).join(""), "Brand deals, scandals and feuds come to you as decisions.");
  return html;
}

// MARK: Prison

function renderPrisonPack(L) {
  if (L.fugitive && !inPrison(L)) return intro(`<b>You're a fugitive.</b> You escaped at age ${L.fugitive.since}. Police are looking for you${L.country !== L.fugitive.country ? ", though being abroad makes it harder for them" : ". Leaving the country would make it harder for them to find you"}. After ten years on the run, the search goes cold.`);
  if (!inPrison(L)) return "";
  const pl = prisonLife(L);
  let html = kpis([["Sentence", plural(pl.sentence, "year")], ["Served", plural(pl.served, "year")], ["Left", plural(L.prisonYearsLeft, "year")],
    ["Parole", paroleEligible(pl) ? "Eligible" : `After ${plural(Math.ceil(pl.sentence / 3), "year")}`]]);
  html += `<div class="pad">${statBar("Behavior", "📋", pl.behavior)}${statBar("Respect", "💪", pl.respect)}</div>`;
  html += section("Your situation", lv("Cellmate", `${esc(pl.cellmate)} · ${pl.cellBond >= 70 ? "close friends" : pl.cellBond >= 40 ? "friendly" : "strangers"}`) + lv("Job", pl.job ? PrisonJobs[pl.job].name : "None") + lv("Gang", pl.gang ? cap(pl.gang) : "None")
    + lv("Education", hasDiploma(L) ? "Diploma" : `GED ${pl.ged}%`) + (pl.solitary ? lv("Status", "In solitary this year", "red") : ""),
    "The parole board looks at your behavior, your job and your education, and frowns on gang ties.");
  const acts = Object.entries(PrisonPackActions).map(([id, a]) => {
    const used = usedThisYear(L, `prison-${id}`);
    let sub = used ? "Done this year" : a.sub;
    let disabled = used || (pl.solitary && !["study", "appeal"].includes(id));
    if (id === "gang" && pl.gang) { sub = `You're with ${pl.gang}`; disabled = true; }
    if (id === "job" && pl.job) sub = used ? sub : `Currently: ${PrisonJobs[pl.job].name} · switch jobs`;
    if (id === "parole" && !paroleEligible(pl)) { sub = `Eligible after ${plural(Math.ceil(pl.sentence / 3), "year")} served`; disabled = true; }
    if (id === "appeal" && pl.appealedAt != null && L.age - pl.appealedAt < 2) { sub = "Too soon after your last appeal"; disabled = true; }
    if (id === "study") sub = used ? sub : hasDiploma(L) ? "Correspondence courses · smarts and behavior" : `Work toward your GED (${pl.ged}%)`;
    if (id === "tunnel" && pl.tunnel) sub = used ? sub : `${pl.tunnel}% dug`;
    let fn = () => act((x) => prisonPackAction(x, id));
    if (id === "job") fn = () => choose("Which job?", null, Object.entries(PrisonJobs).map(([jid, j]) => ({ label: `${j.name} · ${formatMoney(j.pay)}/yr · ${j.sub}`, fn: () => act((x) => prisonPackAction(x, id, jid)) })).concat([{ label: "Cancel", secondary: true, fn: () => {} }]));
    if (id === "appeal") fn = () => choose("Who handles your appeal?", null, Object.entries(Lawyers).map(([lid, lw]) => ({ label: `${lw.name} · ${lw.cost ? formatMoney(lw.cost) : "free"} · ${Math.round(lw.chance * 100)}% odds`, fn: () => act((x) => prisonPackAction(x, id, lid)) })).concat([{ label: "Cancel", secondary: true, fn: () => {} }]));
    if (id === "gang") fn = () => choose("Which gang?", "Protection and respect, but the parole board will hold it against you.", PrisonGangs.map((g) => ({ label: `${g.emoji} ${cap(g.name)}`, fn: () => act((x) => prisonPackAction(x, id, g.name)) })).concat([{ label: "Cancel", secondary: true, fn: () => {} }]));
    if (["riot", "bribe", "tunnel"].includes(id)) { const run = fn; fn = () => choose(`${a.title}?`, id === "riot" ? "People get hurt in riots. Possibly you." : "If it goes wrong, you'll get more time.", [{ label: "Do it", danger: true, fn: run }, { label: "Cancel", secondary: true, fn: () => {} }]); }
    return row(a.emoji, a.title, sub, fn, { disabled, danger: ["riot", "bribe", "tunnel", "fight", "contraband"].includes(id) });
  }).join("");
  html += section("Doing time", acts);
  return html;
}
