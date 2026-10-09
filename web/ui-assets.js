// LifeSim web UI: the Money tab, real estate, vehicles and licenses.
"use strict";

const pctText = (x) => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(1)}%`;
const segButtons = (items, current, onPick) => `<div class="pad seg wrap">${items.map(([id, label]) =>
  `<button class="btn small" aria-pressed="${current === id}" data-h="${h(() => onPick(id))}">${esc(label)}</button>`).join("")}</div>`;
const conditionWord = (c) => (c >= 85 ? "Excellent" : c >= 65 ? "Good" : c >= 45 ? "Fair" : c >= 25 ? "Poor" : "Falling apart");

// MARK: Money tab

function renderAssets(L) {
  for (const a of L.assets) { if (isHome(a)) normalizeHome(a, L); else normalizeVehicle(a); }
  let fin = lv("Bank balance", formatMoney(L.money), L.money < 0 ? "money-neg" : "money-pos") + lv("Net worth", formatMoney(netWorth(L)));
  if (L.studentLoans > 0) fin += lv("Student loans", formatMoney(L.studentLoans), "money-neg");
  if (L.job) fin += lv("Salary (after tax)", `${formatMoney(Math.trunc(L.job.salary * 0.75))}/yr`);
  if (spouseContribution(L) > 0) fin += lv("Spouse contributes", `+${formatMoney(spouseContribution(L))}/yr`, "money-pos");
  if (childExpenses(L) > 0) fin += lv("Child expenses", `-${formatMoney(childExpenses(L))}/yr`, "money-neg");
  const yearly = L.assets.reduce((s, a) => {
    if (isHome(a)) { const c = homeYearlyCosts(a); return s + c.tax + c.insurance + c.upkeep + (a.loan ? a.payment : 0) - (a.rented ? homeRent(a) : 0); }
    return s + vehicleUpkeep(a) + crewCost(a) + (a.loan ? a.payment : 0);
  }, 0);
  if (L.assets.length) fin += lv("Property & vehicle costs", `${yearly >= 0 ? "-" : "+"}${formatMoney(Math.abs(yearly))}/yr`, yearly > 0 ? "money-neg" : "money-pos");
  let html = section("Finances", fin);

  const homes = homesOf(L);
  const market = L.housing ? lv("Housing market last year", pctText(L.housing.last), L.housing.last >= 0 ? "money-pos" : "money-neg") : "";
  html += section("Homes", homes.map((a) => row(homeType(a).emoji, a.address, `${a.name} · ${a.rented ? "Rented out" : "I live here"} · Condition ${a.condition}%`,
    () => push({ type: "home", id: a.id }), { right: formatMoney(a.value) })).join("") + market
    || `<div class="pad muted">${L.age >= 18 ? "You don't own a home. Without one you pay rent once you move out." : "You live with your family."}</div>`);

  const vehicles = L.assets.filter(isVehicle);
  if (vehicles.length) {
    html += section("Vehicles", vehicles.map((a) => {
      const blocked = vehicleBlocker(L, a);
      return row(vehicleEmoji(a), a.name, `${vehicleClass(a).label} · Condition ${a.condition}%${blocked ? " · 🚫 Can't use it yet" : ""}`, () => push({ type: "vehicle", id: a.id }), { right: formatMoney(a.value) });
    }).join(""));
  }

  let shop;
  if (inPrison(L)) shop = `<div class="pad muted">You can't go shopping from prison.</div>`;
  else {
    shop = row("🏡", "Real estate", L.age >= 18 ? `Homes for sale in ${L.city}` : "Available at 18", () => push({ type: "homes", group: "all" }), { chev: true, disabled: L.age < 18 })
      + Object.entries(VehicleGroups).map(([g, d]) => row(d.emoji, d.label, d.classes.map((c) => VehicleClasses[c].label).join(" · "), () => push({ type: "vehicles", group: g, cls: d.classes[g === "car" ? 1 : 0] }), { chev: true, disabled: L.age < 16 })).join("");
  }
  html += section("Shopping", shop);
  html += section("Licenses", row("🪪", "Licenses", `${Object.keys(Licenses).filter((id) => hasLicense(L, id)).length} of ${Object.keys(Licenses).length} · drive, ride, sail and fly`, () => push({ type: "licenses" }), { chev: true }));
  return html;
}

// MARK: Real estate

function renderHomeMarket(L, view) {
  view.listings ||= {};
  view.listings[view.group] ||= homeListings(L, view.group);
  const rows = view.listings[view.group].map((hl) => {
    const t = HomeTypes.find((x) => x.id === hl.typeId);
    return row(t.emoji, hl.address, `${t.name} · ${hl.neighborhood} · ${homeLabel(hl)} · Condition ${hl.condition}%`, () => push({ type: "listing", listing: hl, from: view }),
      { right: `<span class="${L.money >= hl.price || canMortgage(L, hl) ? "money-pos" : "money-neg"}">${formatMoney(hl.price)}</span>` });
  }).join("");
  return section(`Homes for sale in ${L.city}`, lv("Bank balance", formatMoney(L.money)) + segButtons(Object.entries(HomeGroups), view.group, (g) => { view.group = g; render(); }) + rows,
    "Prices follow the local market. Older and cheaper homes are more likely to hide problems, so consider an inspection.");
}

function renderListing(L, view) {
  const hl = view.listing;
  const t = HomeTypes.find((x) => x.id === hl.typeId);
  let html = `<div class="hero-person"><div class="big">${t.emoji}</div><h3>${esc(hl.address)}</h3><div class="muted">${esc(t.name)} in ${esc(hl.neighborhood)}, ${esc(hl.city)}</div></div>`;
  const est = homeYearlyCosts({ value: hl.price, upkeep: true, reno: {} });
  html += section("The home", lv("Asking price", formatMoney(hl.price)) + lv("Layout", homeLabel(hl)) + lv("Built", hl.houseAge <= 1 ? "Brand new" : `${hl.houseAge} years ago`)
    + `<div class="pad">${statBar("Condition", "🧱", hl.condition)}</div>`
    + lv("Yearly costs", `${formatMoney(est.tax + est.insurance + est.upkeep)} (tax, insurance, upkeep)`)
    + lv("Could rent for", `${formatMoney(homeRent({ value: hl.price }))}/yr`));
  let insp;
  if (!hl.inspected) insp = row("🔍", "Get a home inspection", `${formatMoney(inspectionCost(hl))} · find hidden problems before you buy`, () => act((x) => inspectListing(x, hl)));
  else insp = `<div class="pad">${hl.issue ? `⚠️ The inspector found <b>${esc(hl.issue.name)}</b>. The seller lowered the price.` : "✅ The inspection found no major problems."}</div>`;
  html += section("Inspection", insp);
  const closing = closingCosts(hl.price);
  const buyDone = (r, x) => { if (x.assets.some((a) => a.address === hl.address)) { view.from.listings[view.from.group] = view.from.listings[view.from.group].filter((y) => y.id !== hl.id); ui.stack.pop(); } return r; };
  let buy = row("💵", "Pay cash", `${formatMoney(hl.price + closing)} including ${formatMoney(closing)} closing costs`, () => act((x) => buyDone(buyHome(x, hl, false), x)), { disabled: L.money < hl.price + closing });
  const down = Math.ceil(hl.price * MORTGAGE.down);
  const ok = canMortgage(L, hl);
  buy += row("🏦", "Get a mortgage", ok ? `${formatMoney(down + closing)} up front · ${formatMoney(mortgagePaymentFor(hl))}/yr for ${MORTGAGE.years} years at ${(MORTGAGE.rate * 100).toFixed(1)}%`
    : `Needs ${formatMoney(down + closing)} up front and a steady income that covers ${formatMoney(mortgagePaymentFor(hl))}/yr`, () => act((x) => buyDone(buyHome(x, hl, true), x)), { disabled: !ok });
  html += section("Buy it", buy, `You have ${formatMoney(L.money)}.`);
  return html;
}

function renderHome(L, view) {
  const a = L.assets.find((x) => x.id === view.id && isHome(x));
  if (!a) return `<div class="pad muted">You don't own that home anymore.</div>`;
  normalizeHome(a, L);
  const t = homeType(a);
  let html = `<div class="hero-person"><div class="big">${t.emoji}</div><h3>${esc(a.address)}</h3><div class="muted">${esc(a.name)} in ${esc(a.neighborhood)}, ${esc(a.city)} · ${a.rented ? "Rented out" : "Your home"}</div></div>`;
  const gain = a.value - a.purchasePrice;
  const c = homeYearlyCosts(a);
  let money = lv("Worth about", formatMoney(a.value)) + lv("You paid", formatMoney(a.purchasePrice)) + lv(gain >= 0 ? "Gain" : "Loss", formatMoney(Math.abs(gain)), gain >= 0 ? "money-pos" : "money-neg");
  if (a.loan > 0) money += lv("Mortgage left", formatMoney(a.loan), "money-neg") + lv("Mortgage payment", `${formatMoney(a.payment)}/yr`);
  money += lv("Property tax & insurance", `${formatMoney(c.tax + c.insurance)}/yr`) + lv("Upkeep", a.upkeep ? `${formatMoney(c.upkeep)}/yr` : "None (it's wearing down)");
  if (a.rented) money += lv("Rent from tenants", `+${formatMoney(homeRent(a))}/yr`, "money-pos");
  html += section("Value", money, "Homes follow the local market. Good condition and recent renovations add value; neglect takes it away.");
  html += section("Details", lv("Layout", homeLabel(a)) + lv("Built", `${a.houseAge} years ago`) + lv("Owned for", plural(a.yearsOwned, "year"))
    + `<div class="pad">${statBar("Condition", "🧱", a.condition)}</div>` + lv("Condition", conditionWord(a.condition)));

  let manage = "";
  if (a.issue && a.issue.found) manage += row("⚠️", `Fix the ${a.issue.name}`, `${formatMoney(Math.round(a.base * a.issue.pct / 500) * 500)} · it's hurting the value`, () => act((x) => homeAction(x, a.id, "fixIssue")), { danger: true });
  if (a.condition < 95) manage += row("🧰", "Major repairs", `${formatMoney(Math.max(1000, repairCost(a)))} · bring it back to 95%`, () => act((x) => homeAction(x, a.id, "repair")));
  manage += row("🧹", a.upkeep ? "Stop paying for upkeep" : "Start paying for upkeep", a.upkeep ? "Saves money now, wears the home down" : `${formatMoney(Math.max(1200, Math.round(a.value * 0.01)))}/yr · keeps it in shape`, () => act((x) => homeAction(x, a.id, "upkeep")));
  manage += row("🔑", a.rented ? "Move back in" : "Rent it out", a.rented ? "Stop renting to tenants" : `About ${formatMoney(homeRent(a))}/yr · tenants wear it down`, () => act((x) => homeAction(x, a.id, "rent")));
  html += section("Manage", manage);

  const renos = Object.entries(Renovations).filter(([id, r]) => !(r.house && t.unit)).map(([id, r]) => {
    const done = (a.reno || {})[id];
    const avail = renoAvailable(a, id);
    const adds = Math.round(a.base * homeCondFactor(Math.min(100, a.condition + (r.cond || 0))) * r.premium / 1000) * 1000;
    const sub = !avail ? `Done ${done === a.yearsOwned ? "this year" : `${plural(a.yearsOwned - done, "year")} ago`}` : `${formatMoney(renoCost(a, id))} · adds about ${formatMoney(adds)} in value${r.cond ? ` · condition +${r.cond}` : ""}`;
    return row(r.emoji, r.name, sub, () => act((x) => homeAction(x, a.id, "renovate", id)), { disabled: !avail });
  }).join("");
  html += section("Renovate", renos, "Renovations rarely pay back their full cost right away, but they lift the value as the market rises. Their effect fades over the years.");

  const offer = homeOffer(L, a);
  html += section("Sell", row("🤝", "Sell this home", `Best offer this year: ${formatMoney(offer)} · 5% agent fees`, () => choose(`Sell ${a.address}?`,
    `A buyer offered ${formatMoney(offer)}. After ${formatMoney(Math.round(offer * 0.05))} in fees${a.loan ? ` and paying off the ${formatMoney(a.loan)} mortgage` : ""}, you'd keep ${formatMoney(offer - Math.round(offer * 0.05) - a.loan)}.`, [
      { label: `Sell for ${formatMoney(offer)}`, fn: () => { ui.stack.pop(); act((x) => homeAction(x, a.id, "sell")); } },
      { label: "Keep it", secondary: true, fn: () => {} },
    ])));
  return html;
}

// MARK: Vehicles

function licenseTag(L, cls) {
  const vc = VehicleClasses[cls];
  if (hasLicense(L, vc.license)) return `✅ ${Licenses[vc.license].name}`;
  return vc.crew ? `Needs a ${Licenses[vc.license].name.toLowerCase()} or a hired ${vc.crewName}` : `🚫 Needs a ${Licenses[vc.license].name.toLowerCase()}`;
}

function renderVehicleMarket(L, view) {
  const group = VehicleGroups[view.group];
  view.listings ||= {};
  view.listings[view.cls] ||= vehicleListings(view.cls);
  const vc = VehicleClasses[view.cls];
  const rows = view.listings[view.cls].map((l) => {
    const upkeep = Math.trunc(vc.upkeep(l.price / conditionFactor(l.condition)));
    const fin = canFinanceVehicle(L, l);
    const affordable = L.money >= l.price || fin;
    return row(vc.emoji, l.name, `${view.cls === "used" ? `Condition ${l.condition}%` : "New"} · upkeep ~${formatMoney(upkeep)}/yr`, () => {
      const opts = [];
      const buy = (financed) => act((x) => {
        const r = buyVehicle(x, l, financed);
        if (x.assets.some((a) => a.basePrice && a.name === l.name && a.purchasePrice === l.price)) view.listings[view.cls] = view.listings[view.cls].filter((y) => y.id !== l.id);
        return r;
      });
      if (L.money >= l.price) opts.push({ label: `Pay ${formatMoney(l.price)}`, fn: () => buy(false) });
      if (fin) {
        const down = Math.ceil(l.price * vehicleDown(l.cls));
        const terms = vehicleLoanTerms(l.cls);
        opts.push({ label: `Finance: ${formatMoney(down)} down, ${formatMoney(loanPayment(l.price - down, terms.rate, terms.years))}/yr for ${terms.years} years`, fn: () => buy(true) });
      }
      opts.push({ label: "Cancel", secondary: true, fn: () => {} });
      const crew = vc.crew ? ` A ${vc.crewName} costs about ${formatMoney(vc.crew(l.price))}/yr if you hire one.` : "";
      choose(`Buy the ${l.name}?`, `Price ${formatMoney(l.price)} · upkeep about ${formatMoney(upkeep)}/yr (insurance, storage, maintenance).${crew}\n${licenseTag(L, l.cls)}.`, opts);
    }, { disabled: !affordable, right: `<span class="${affordable ? "money-pos" : "money-neg"}">${formatMoney(l.price)}</span>` });
  }).join("");
  return section(group.label, lv("Bank balance", formatMoney(L.money)) + segButtons(group.classes.map((c) => [c, VehicleClasses[c].label]), view.cls, (c) => { view.cls = c; render(); })
    + `<div class="pad muted small">${esc(licenseTag(L, view.cls))}</div>` + rows,
    "You can buy without a license, but you need one to use it.");
}

function renderVehicle(L, view) {
  const a = L.assets.find((x) => x.id === view.id && isVehicle(x));
  if (!a) return `<div class="pad muted">You don't own that anymore.</div>`;
  normalizeVehicle(a);
  const vc = vehicleClass(a);
  let html = `<div class="hero-person"><div class="big">${vc.emoji}</div><h3>${esc(a.name)}</h3><div class="muted">${esc(vc.label)} · owned ${plural(a.yearsOwned, "year")}</div></div>`;
  let facts = `<div class="pad">${statBar("Condition", "🔧", a.condition)}</div>` + lv("Worth about", formatMoney(a.value)) + lv("You paid", formatMoney(a.purchasePrice))
    + lv("Upkeep", `${formatMoney(vehicleUpkeep(a))}/yr`);
  if (vc.crew) facts += lv(`Hired ${vc.crewName}`, a.crew ? `${formatMoney(crewCost(a))}/yr` : "None");
  if (a.loan > 0) facts += lv("Loan left", formatMoney(a.loan), "money-neg") + lv("Loan payment", `${formatMoney(a.payment)}/yr`);
  if (vc.kind === "plane") facts += lv("Your flight hours", logOf(L, "flight"));
  if (vc.kind === "helicopter") facts += lv("Your helicopter hours", logOf(L, "heli"));
  if (vc.kind === "boat") facts += lv("Your days at sea", logOf(L, "sea"));
  html += section("Details", facts);

  const blocker = vehicleBlocker(L, a);
  html += section("License", `<div class="pad">${blocker ? `🚫 ${esc(blocker)}` : hasLicense(L, vc.license) ? `✅ You have a ${esc(Licenses[vc.license].name.toLowerCase())}.` : `👨‍✈️ Your hired ${esc(vc.crewName)} handles it.`}</div>`
    + (hasLicense(L, vc.license) ? "" : row(Licenses[vc.license].emoji, `Get a ${Licenses[vc.license].name.toLowerCase()}`, null, () => push({ type: "license", id: vc.license }), { chev: true })));

  const acts = vehicleActionsFor(a).map((id) => {
    const d = VehicleActions[id];
    const used = id !== "service" && usedThisYear(L, `veh-${a.id}-${id}`);
    const needsLicense = id !== "service" && id !== "charter" && blocker;
    let sub = used ? "Done this year" : id === "service" ? (a.condition >= 95 ? "In perfect shape" : `${formatMoney(serviceCost(a))} · condition +40`) : d.sub || null;
    if (!used && needsLicense) sub = canRiskIt(a) ? "No license: you could get caught" : "You can't legally do this yet";
    let fn = () => act((x) => vehicleAction(x, a.id, id));
    if (needsLicense && canRiskIt(a)) fn = () => choose(`${d.label} without a license?`, "If the police stop you, you'll be fined and it goes on your record.", [
      { label: "Do it anyway", danger: true, fn: () => act((x) => vehicleAction(x, a.id, id, true)) },
      { label: "Never mind", secondary: true, fn: () => {} },
    ]);
    return row(d.emoji, d.label, sub, fn, { disabled: used || (needsLicense && !canRiskIt(a)) || (id === "service" && a.condition >= 95) });
  }).join("");
  html += section("Use it", acts);
  let more = "";
  if (vc.crew) more += row("👨‍✈️", a.crew ? `Let the ${vc.crewName} go` : `Hire a ${vc.crewName}`, a.crew ? `Saves ${formatMoney(crewCost(a))}/yr` : `${formatMoney(vc.crew(a.basePrice))}/yr · use it without a license`, () => act((x) => toggleCrew(x, a.id)));
  more += row("🤝", "Sell it", `About ${formatMoney(a.value)}${a.loan ? ` (${formatMoney(a.loan)} goes to the loan)` : ""}`, () => choose(`Sell your ${a.name}?`, `It's worth about ${formatMoney(a.value)}.`, [
    { label: `Sell for ${formatMoney(a.value)}`, fn: () => { ui.stack.pop(); act((x) => sellVehicle(x, a.id)); } },
    { label: "Keep it", secondary: true, fn: () => {} },
  ]));
  html += section("Manage", more);
  return html;
}

// MARK: Licenses

function licenseStatusText(L, id) {
  const lic = Licenses[id];
  if (hasLicense(L, id)) return "✅ Licensed";
  const b = licenseBlockers(L, id);
  if (b.length) return b.join(" · ");
  return `Ready for the test · ${formatMoney(lic.fee)}`;
}

function renderLicenses(L) {
  return section("Licenses", Object.entries(Licenses).map(([id, lic]) => row(lic.emoji, lic.name, licenseStatusText(L, id), () => push({ type: "license", id }), { chev: true })).join(""),
    "Cars and motorcycles need a license to drive legally. Small boats need a boating license. Yachts, planes and helicopters need a license or a hired crew.");
}

function renderLicense(L, view) {
  const lic = Licenses[view.id];
  const have = hasLicense(L, view.id);
  let html = `<div class="hero-person"><div class="big">${lic.emoji}</div><h3>${esc(lic.name)}</h3><div class="muted">${have ? "You have this license" : `From age ${lic.minAge}`}</div></div>`;
  let info = "";
  if (lic.requires) info += lv("Requires", Licenses[lic.requires].name);
  if (lic.minHealth) info += lv("Medical", `Health ${lic.minHealth}%+`);
  if (lic.log) {
    const have2 = logOf(L, lic.log);
    info += `<div class="pad">${statBar(lic.unit[0].toUpperCase() + lic.unit.slice(1), "⏱️", Math.min(100, Math.round(have2 / lic.need * 100)))}</div>` + lv("Logged", `${have2} of ${lic.need} ${lic.unit}`);
  }
  if (lic.train.max) info += lv("Practice", `${trainingOf(L, view.id)} of ${lic.train.max}`);
  info += lv("Test fee", formatMoney(lic.fee));
  html += section("Requirements", info);
  if (!have) {
    const t = lic.train;
    const trainDone = (t.max && trainingOf(L, view.id) >= t.max) || (t.once && usedThisYear(L, `train-${view.id}`));
    const tooYoung = L.age < Math.max(lic.minAge - 1, 15);
    const blocked = licenseBlockers(L, view.id);
    let acts = row("📚", t.label, trainDone ? (t.max ? "You've had all the practice you need" : "Done this year") : tooYoung ? `From age ${Math.max(lic.minAge - 1, 15)}` : `${t.cost > 0 ? formatMoney(t.cost) : `Earn ${formatMoney(-t.cost)}`} · ${t.sub}`,
      () => act((x) => licenseTrain(x, view.id)), { disabled: trainDone || tooYoung || inPrison(L) || (lic.requires && !hasLicense(L, lic.requires)) });
    acts += row("📝", "Take the test", blocked.length ? blocked.join(" · ") : `${formatMoney(lic.fee)}`, () => act((x) => takeLicenseTest(x, view.id)), { disabled: blocked.length > 0 });
    html += section("Get it", acts);
  }
  return html;
}
