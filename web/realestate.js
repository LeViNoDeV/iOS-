// LifeSim: real estate. Homes have an address, size, age and condition. A local housing
// market moves prices every year; homes you keep up and renovate gain value, neglected
// ones lose it. Inspections, renovations, mortgages, renting out and foreclosure.
"use strict";

// MARK: - Data

const HomeTypes = [
  { id: "studio", name: "Studio apartment", emoji: "🏢", beds: [0, 0], baths: [1, 1], sqft: [350, 550], base: 170000, unit: true, group: "apartments", age: [5, 60] },
  { id: "condo1", name: "1-bedroom condo", emoji: "🏢", beds: [1, 1], baths: [1, 1], sqft: [550, 850], base: 250000, unit: true, group: "apartments", age: [2, 50] },
  { id: "condo2", name: "2-bedroom condo", emoji: "🏬", beds: [2, 2], baths: [1, 2], sqft: [850, 1250], base: 340000, unit: true, group: "apartments", age: [2, 50] },
  { id: "loft", name: "Converted warehouse loft", emoji: "🏭", beds: [1, 2], baths: [1, 2], sqft: [1000, 1800], base: 480000, unit: true, group: "apartments", age: [80, 120] },
  { id: "townhouse", name: "Townhouse", emoji: "🏘️", beds: [2, 3], baths: [2, 3], sqft: [1200, 1900], base: 430000, group: "houses", age: [3, 40] },
  { id: "bungalow", name: "Craftsman bungalow", emoji: "🏡", beds: [2, 3], baths: [1, 2], sqft: [1000, 1600], base: 390000, group: "houses", age: [70, 110] },
  { id: "ranch", name: "Ranch house", emoji: "🏡", beds: [3, 4], baths: [2, 2], sqft: [1400, 2200], base: 450000, group: "houses", age: [30, 70] },
  { id: "colonial", name: "Colonial house", emoji: "🏠", beds: [3, 5], baths: [2, 3], sqft: [2000, 3000], base: 630000, group: "houses", age: [15, 90] },
  { id: "victorian", name: "Victorian house", emoji: "🏠", beds: [3, 5], baths: [2, 3], sqft: [2200, 3400], base: 720000, group: "houses", age: [110, 150] },
  { id: "modern", name: "Modern new build", emoji: "🏠", beds: [3, 5], baths: [3, 4], sqft: [2500, 4000], base: 1100000, group: "houses", age: [0, 3] },
  { id: "farmhouse", name: "Farmhouse on 10 acres", emoji: "🌾", beds: [3, 4], baths: [2, 3], sqft: [1800, 2800], base: 520000, group: "houses", age: [40, 120] },
  { id: "cabin", name: "Lakeside cabin", emoji: "🛖", beds: [1, 3], baths: [1, 2], sqft: [700, 1400], base: 300000, group: "houses", age: [15, 70] },
  { id: "fixer", name: "Fixer-upper", emoji: "🏚️", beds: [2, 4], baths: [1, 2], sqft: [1100, 2000], base: 420000, group: "fixers", age: [40, 100], rough: true },
  { id: "fixerVictorian", name: "Run-down Victorian", emoji: "🏚️", beds: [4, 6], baths: [2, 3], sqft: [2400, 3600], base: 780000, group: "fixers", age: [110, 150], rough: true },
  { id: "beach", name: "Beachfront house", emoji: "🏖️", beds: [3, 5], baths: [3, 4], sqft: [2000, 3500], base: 1700000, group: "luxury", age: [5, 50] },
  { id: "penthouse", name: "Penthouse", emoji: "🌆", beds: [3, 4], baths: [3, 5], sqft: [2500, 4500], base: 3200000, unit: true, group: "luxury", age: [0, 25] },
  { id: "mansion", name: "Mansion", emoji: "🏛️", beds: [6, 9], baths: [6, 10], sqft: [7000, 12000], base: 6500000, group: "luxury", age: [5, 60] },
  { id: "estate", name: "Gated estate", emoji: "🏛️", beds: [8, 12], baths: [9, 14], sqft: [12000, 20000], base: 18000000, group: "luxury", age: [2, 40] },
  { id: "castle", name: "Historic castle", emoji: "🏰", beds: [10, 20], baths: [8, 16], sqft: [15000, 40000], base: 15000000, group: "luxury", age: [300, 700] },
];
const HomeGroups = { all: "All", apartments: "Apartments", houses: "Houses", fixers: "Fixer-uppers", luxury: "Luxury" };
const homeType = (a) => HomeTypes.find((t) => t.id === a.typeId) || HomeTypes[6];

const StreetNames = ["Maple", "Oak", "Willow", "Cedar", "Pine", "Elm", "Birch", "Chestnut", "Magnolia", "Juniper", "Linden", "Sycamore",
  "Hawthorne", "Ashford", "Lakeview", "Riverside", "Hillcrest", "Sunset", "Highland", "Meadow", "Orchard", "Harbor", "Park", "Church",
  "Mill", "Bridge", "Station", "King", "Queen", "Victoria", "Washington", "Lincoln", "Franklin", "Jefferson", "Madison", "Main", "Market",
  "Spring", "Rosewood", "Bayview", "Fairview", "Kingsley", "Brookside", "Foxglove", "Wellington", "Primrose", "Clifton", "Grove"];
const StreetSuffixes = ["Street", "Avenue", "Lane", "Road", "Drive", "Court", "Boulevard", "Place", "Way", "Terrace", "Row", "Close"];
const Neighborhoods = ["Downtown", "Old Town", "Riverside", "Hillcrest", "Westside", "Lakeview", "Midtown", "the Harbor District",
  "Oak Park", "the University District", "Northgate", "Southbank", "Greenwood", "the Arts District", "Eastwood", "Beacon Hill"];

const RichCountries = new Set(["United States", "Canada", "United Kingdom", "Ireland", "France", "Germany", "Netherlands", "Belgium", "Luxembourg",
  "Switzerland", "Austria", "Denmark", "Sweden", "Norway", "Finland", "Iceland", "Australia", "New Zealand", "Japan", "South Korea", "Singapore",
  "Israel", "United Arab Emirates", "Qatar", "Kuwait", "Monaco", "Liechtenstein", "Andorra", "San Marino", "Italy", "Spain", "Portugal",
  "Malta", "Cyprus", "Slovenia", "Estonia", "Czech Republic", "Czechia", "Bahrain", "Brunei", "Saudi Arabia", "Taiwan", "Bahamas"]);
const MidCountries = new Set(["China", "Brazil", "Mexico", "Turkey", "Russia", "Poland", "Hungary", "Slovakia", "Croatia", "Greece", "Lithuania",
  "Latvia", "Romania", "Bulgaria", "Serbia", "Argentina", "Chile", "Uruguay", "Costa Rica", "Panama", "Malaysia", "Thailand", "South Africa",
  "Oman", "Kazakhstan", "Colombia", "Peru", "Dominican Republic", "Mauritius", "Botswana", "Montenegro", "Georgia", "Armenia", "Jordan"]);
const PricyCities = new Set(["New York", "New York City", "San Francisco", "Los Angeles", "Boston", "Seattle", "Miami", "London", "Paris", "Tokyo",
  "Singapore", "Zurich", "Geneva", "Sydney", "Monaco", "Dubai", "Tel Aviv", "Vancouver", "Munich", "Amsterdam", "Oslo", "Copenhagen",
  "Stockholm", "Dublin", "Seoul", "Toronto", "Melbourne", "Hong Kong", "Shanghai", "Beijing", "Shenzhen", "Mumbai", "Luxembourg City", "Abu Dhabi"]);

function cityPriceFactor(city, country) {
  let f = RichCountries.has(country) ? 1 : MidCountries.has(country) ? 0.45 : 0.22;
  if (PricyCities.has(city)) f *= 2;
  else if (typeof capitalOf === "function" && capitalOf(country) === city) f *= 1.25;
  return f;
}

const HomeIssues = [
  ["termites", 0.04], ["cracks in the foundation", 0.1], ["mold behind the walls", 0.05], ["ancient wiring", 0.035],
  ["a roof at the end of its life", 0.06], ["a cracked sewer line", 0.03], ["asbestos insulation", 0.05],
];

const Renovations = {
  paint: { name: "Repaint inside and out", emoji: "🎨", cost: 0.015, premium: 0.01, cond: 10, life: 8 },
  kitchen: { name: "Kitchen remodel", emoji: "🍳", cost: 0.08, premium: 0.06, cond: 5, life: 20, happiness: 4 },
  bathroom: { name: "Bathroom remodel", emoji: "🛁", cost: 0.05, premium: 0.04, cond: 4, life: 20, happiness: 3 },
  floors: { name: "New hardwood floors", emoji: "🪵", cost: 0.03, premium: 0.025, cond: 5, life: 25 },
  windows: { name: "Energy-efficient windows", emoji: "🪟", cost: 0.03, premium: 0.02, cond: 6, life: 25 },
  roof: { name: "New roof", emoji: "🏠", cost: 0.04, premium: 0.02, cond: 20, life: 25, house: true },
  landscaping: { name: "Landscaping", emoji: "🌳", cost: 0.02, premium: 0.02, cond: 3, life: 10, house: true, happiness: 2 },
  pool: { name: "Swimming pool", emoji: "🏊", cost: 0.07, premium: 0.05, life: 30, house: true, happiness: 6 },
  solar: { name: "Solar panels", emoji: "☀️", cost: 0.03, premium: 0.03, life: 25, house: true },
  basement: { name: "Finish the basement", emoji: "🛋️", cost: 0.06, premium: 0.07, life: 30, house: true, sqft: 0.25 },
  extension: { name: "Build an extension (+1 bedroom)", emoji: "🏗️", cost: 0.14, premium: 0.13, life: 40, house: true, beds: 1, sqft: 0.2 },
  smart: { name: "Smart-home upgrade", emoji: "📱", cost: 0.015, premium: 0.01, life: 10 },
};

// MARK: - Market

const homeCondFactor = (c) => 0.55 + 0.45 * c / 100;
const housingIndex = (L) => (L.housing ||= { index: 1, last: 0 }).index;

function progressHousingMarket(L) {
  const hm = (L.housing ||= { index: 1, last: 0 });
  let change = rndf(-0.03, 0.06);
  if (roll(0.05)) {
    change = -rndf(0.12, 0.25);
    if (L.assets.some((a) => a.kind === "house")) notify(L, "📉", "Housing Crash", `📉 The housing market crashed. Home prices fell ${Math.round(-change * 100)}% this year.`);
  } else if (roll(0.05)) {
    change = rndf(0.1, 0.16);
    if (L.age >= 18) record(L, `📈 The housing market is booming. Prices jumped ${Math.round(change * 100)}% this year.`);
  }
  hm.last = change;
  hm.index = Math.max(0.3, hm.index * (1 + change));
}

function randomAddress(t) {
  const num = rnd(1, t.unit ? 400 : 2400);
  const street = `${pick(StreetNames)} ${pick(StreetSuffixes)}`;
  if (t.id === "penthouse") return `Penthouse, ${num} ${street}`;
  if (t.unit) return `${num} ${street}, Apt ${rnd(1, 30)}${pick(["A", "B", "C", "D"])}`;
  if (t.id === "farmhouse" || t.id === "castle" || t.id === "estate") return `${num} ${pick(StreetNames)} ${pick(["Road", "Lane", "Hill Road"])}`;
  return `${num} ${street}`;
}

function makeHomeListing(L, t) {
  const sqft = Math.round(rnd(t.sqft[0], t.sqft[1]) / 10) * 10;
  const houseAge = rnd(t.age[0], t.age[1]);
  const condition = t.rough ? rnd(18, 42) : houseAge <= 3 ? rnd(95, 100) : clamp(rnd(55, 95) - Math.floor(houseAge / 40) * 4, 30, 100);
  const base = Math.round(t.base * cityPriceFactor(L.city, L.country) * housingIndex(L) * (0.85 + 0.3 * (sqft - t.sqft[0]) / Math.max(1, t.sqft[1] - t.sqft[0])) * rndf(0.92, 1.08) / 1000) * 1000;
  const issueChance = t.rough ? 0.6 : houseAge > 60 ? 0.4 : houseAge > 15 ? 0.2 : 0.05;
  const issue = roll(issueChance) ? (([name, pct]) => ({ name, pct, found: false }))(pick(HomeIssues)) : null;
  return {
    id: uid(), typeId: t.id, address: randomAddress(t), neighborhood: pick(Neighborhoods), city: L.city, country: L.country,
    beds: rnd(t.beds[0], t.beds[1]), baths: rnd(t.baths[0], t.baths[1]), sqft, houseAge, condition, base,
    price: Math.round(base * homeCondFactor(condition) / 1000) * 1000, issue, inspected: false,
  };
}

function homeListings(L, group = "all") {
  const types = HomeTypes.filter((t) => group === "all" || t.group === group);
  // "All" shows one of a dozen different kinds of home; a filter shows a few of each kind.
  const chosen = group === "all" ? types.slice().sort(() => Math.random() - 0.5).slice(0, 12) : Array.from({ length: 8 }, (_, i) => types[i % types.length]);
  return chosen.map((t) => makeHomeListing(L, t)).sort((a, b) => a.price - b.price);
}

const homeLabel = (h) => `${h.beds === 0 ? "Studio" : `${h.beds} bd`} · ${h.baths} ba · ${h.sqft.toLocaleString("en-US")} sq ft`;
const inspectionCost = (h) => clamp(Math.round(h.price * 0.001 / 50) * 50, 400, 5000);
const closingCosts = (price) => Math.round(price * 0.02);

function inspectListing(L, h) {
  const cost = inspectionCost(h);
  if (L.money < cost) return out(L, "Inspection", `An inspection costs ${formatMoney(cost)}.`, false);
  L.money -= cost;
  h.inspected = true;
  if (!h.issue) return out(L, "Inspection", `🔍 The inspector went over ${h.address} top to bottom and found nothing serious. (${formatMoney(cost)})`, false);
  h.issue.found = true;
  const repair = Math.round(h.base * h.issue.pct / 1000) * 1000;
  const cut = Math.round(repair * rndf(0.5, 0.9) / 1000) * 1000;
  h.price = Math.max(10000, h.price - cut);
  return out(L, "Inspection", `🔍 The inspector found ${h.issue.name} at ${h.address} (about ${formatMoney(repair)} to fix). I used it to negotiate ${formatMoney(cut)} off the price.`, false);
}

// MARK: - Mortgages

const MORTGAGE = { down: 0.2, rate: 0.065, years: 25 };
const householdIncome = (L) => (L.job && !L.job.partTime ? L.job.salary : 0) + (typeof spouseContribution === "function" ? spouseContribution(L) : 0);

function canMortgage(L, h) {
  if (L.age < 18) return false;
  const loan = h.price - Math.ceil(h.price * MORTGAGE.down);
  const payment = loanPayment(loan, MORTGAGE.rate, MORTGAGE.years);
  return householdIncome(L) > 0 && payment <= householdIncome(L) * 0.4 && L.money >= Math.ceil(h.price * MORTGAGE.down) + closingCosts(h.price);
}
const mortgagePaymentFor = (h) => loanPayment(h.price - Math.ceil(h.price * MORTGAGE.down), MORTGAGE.rate, MORTGAGE.years);

function buyHome(L, h, financed = false) {
  if (L.age < 18) return out(L, "Too Young", "I'm too young to buy a home.", false);
  if (inPrison(L)) return out(L, "Prison", "I can't buy a home from prison.", false);
  const down = financed ? Math.ceil(h.price * MORTGAGE.down) : h.price;
  const total = down + closingCosts(h.price);
  if (L.money < total || (financed && !canMortgage(L, h))) return out(L, "Can't Afford", `I need ${formatMoney(total)} including closing costs.`, false);
  L.money -= total;
  const t = HomeTypes.find((x) => x.id === h.typeId);
  const loan = h.price - down;
  const a = {
    id: uid(), kind: "house", typeId: h.typeId, name: t.name, address: h.address, neighborhood: h.neighborhood, city: h.city, country: h.country,
    beds: h.beds, baths: h.baths, sqft: h.sqft, houseAge: h.houseAge, condition: h.condition, base: h.base, reno: {},
    purchasePrice: h.price, value: h.price, yearsOwned: 0, loan, rate: loan ? MORTGAGE.rate : 0, payment: loan ? loanPayment(loan, MORTGAGE.rate, MORTGAGE.years) : 0,
    upkeep: true, rented: false, issue: h.issue, missed: 0,
  };
  L.assets.push(a);
  adjust(L, { happiness: 12 });
  const where = `${h.address}${h.city !== L.city ? `, ${h.city}` : ""}`;
  return out(L, "New Home", financed
    ? `🔑 I bought a ${t.name.toLowerCase()} at ${where} for ${formatMoney(h.price)} with a ${formatMoney(loan)} mortgage (${formatMoney(a.payment)} a year).`
    : `🔑 I bought a ${t.name.toLowerCase()} at ${where} for ${formatMoney(h.price)} in cash.`);
}

// MARK: - Owning a home

const isHome = (a) => a.kind === "house";
const homesOf = (L) => L.assets.filter(isHome);
const ownsHome = (L) => homesOf(L).some((a) => !a.rented);
const renoPremium = (a) => Object.entries(a.reno || {}).reduce((s, [id, done]) => {
  const r = Renovations[id];
  return r ? s + r.premium * Math.max(0, 1 - (a.yearsOwned - done) / r.life) : s;
}, 0);
const homeValue = (a) => Math.max(0, Math.round(a.base * homeCondFactor(a.condition) * (1 + renoPremium(a)) * (a.issue && a.issue.found ? 1 - a.issue.pct : 1) / 1000) * 1000);
const homeYearlyCosts = (a) => ({
  tax: Math.round(a.value * 0.009), insurance: Math.round(a.value * 0.003),
  upkeep: a.upkeep ? Math.max(1200, Math.round(a.value * (a.reno?.solar != null ? 0.008 : 0.01))) : 0,
});
const homeRent = (a) => Math.round(a.value * 0.05 / 100) * 100;

function renoCost(a, id) { return Math.max(3000, Math.round(a.base * Renovations[id].cost / 500) * 500); }
function renoAvailable(a, id) {
  const r = Renovations[id];
  if (r.house && homeType(a).unit) return false;
  const done = (a.reno || {})[id];
  return done == null || a.yearsOwned - done >= r.life / 2;
}
const repairCost = (a) => Math.round(a.base * (95 - a.condition) / 100 * 0.38 / 500) * 500;

/// Brings homes from older saves up to date.
function normalizeHome(a, L) {
  if (a.typeId) return a;
  const map = { "Studio Apartment": "studio", Condo: "condo2", Townhouse: "townhouse", "Suburban House": "colonial", "Beach House": "beach", Penthouse: "penthouse", Mansion: "mansion", Castle: "castle" };
  a.typeId = map[a.name] || "ranch";
  const t = homeType(a);
  a.name = t.name;
  a.address = randomAddress(t); a.neighborhood = pick(Neighborhoods); a.city = L.city; a.country = L.country;
  a.beds = rnd(t.beds[0], t.beds[1]); a.baths = rnd(t.baths[0], t.baths[1]); a.sqft = rnd(t.sqft[0], t.sqft[1]);
  a.houseAge = rnd(t.age[0], t.age[1]); a.condition = 70; a.base = Math.round(a.value / homeCondFactor(70)); a.reno = {};
  a.upkeep = true; a.rented = false; a.issue = null; a.missed = 0;
  if (a.loan > 0 && !a.payment) { a.rate = MORTGAGE.rate; a.payment = loanPayment(a.loan, MORTGAGE.rate, 15); }
  return a;
}

function homeAction(L, id, action, arg) {
  const a = L.assets.find((x) => x.id === id && isHome(x));
  if (!a) return out(L, "Real estate", "I don't own that anymore.", false);
  if (inPrison(L) && action !== "sell") return out(L, a.address, "I can't do that from prison.", false);
  let m;
  switch (action) {
    case "renovate": {
      const r = Renovations[arg];
      if (!r || !renoAvailable(a, arg)) return out(L, a.address, "That's not possible right now.", false);
      const cost = renoCost(a, arg);
      if (L.money < cost) return out(L, a.address, `${r.name} costs ${formatMoney(cost)}.`, false);
      const before = a.value;
      L.money -= cost;
      (a.reno ||= {})[arg] = a.yearsOwned;
      if (r.cond) a.condition = Math.min(100, a.condition + r.cond);
      if (r.beds) a.beds += r.beds;
      if (r.sqft) a.sqft = Math.round(a.sqft * (1 + r.sqft) / 10) * 10;
      if (r.happiness) adjust(L, { happiness: r.happiness });
      a.value = homeValue(a);
      m = `${r.emoji} ${r.name} at ${a.address}: done for ${formatMoney(cost)}. The home is now worth about ${formatMoney(a.value)} (${a.value >= before ? "+" : ""}${formatMoney(a.value - before)}).`;
      break;
    }
    case "repair": {
      if (a.condition >= 95) return out(L, a.address, "It's in great shape already.", false);
      const cost = Math.max(1000, repairCost(a));
      if (L.money < cost) return out(L, a.address, `Repairs cost ${formatMoney(cost)}.`, false);
      L.money -= cost; a.condition = 95; a.value = homeValue(a);
      m = `🧰 I had contractors fix everything at ${a.address} for ${formatMoney(cost)}. It's worth about ${formatMoney(a.value)} now.`;
      break;
    }
    case "fixIssue": {
      if (!a.issue || !a.issue.found) return out(L, a.address, "Nothing to fix.", false);
      const cost = Math.round(a.base * a.issue.pct / 500) * 500;
      if (L.money < cost) return out(L, a.address, `Fixing it costs ${formatMoney(cost)}.`, false);
      L.money -= cost; const name = a.issue.name; a.issue = null; a.value = homeValue(a);
      m = `🛠️ I paid ${formatMoney(cost)} to fix the ${name} at ${a.address}.`;
      break;
    }
    case "upkeep":
      a.upkeep = !a.upkeep;
      m = a.upkeep ? `🧹 I'm keeping up with maintenance at ${a.address} again.` : `I stopped paying for upkeep at ${a.address}. It'll start to show.`;
      return out(L, a.address, m, false);
    case "rent":
      a.rented = !a.rented;
      m = a.rented ? `🔑 I found tenants for ${a.address}. They'll pay about ${formatMoney(homeRent(a))} a year.` : `I moved back into ${a.address}.`;
      break;
    case "sell": {
      const offer = homeOffer(L, a);
      const fees = Math.round(offer * 0.05);
      L.assets = L.assets.filter((x) => x.id !== a.id);
      L.money += offer - fees - a.loan;
      const gain = offer - a.purchasePrice;
      m = `🤝 I sold ${a.address} for ${formatMoney(offer)}. After ${formatMoney(fees)} in agent fees${a.loan ? ` and paying off the ${formatMoney(a.loan)} mortgage` : ""}, I kept ${formatMoney(offer - fees - a.loan)}. That's ${gain >= 0 ? "a gain" : "a loss"} of ${formatMoney(Math.abs(gain))} on what I paid.`;
      break;
    }
  }
  return out(L, a.address, m);
}

/// This year's best offer from buyers (stable within a year).
function homeOffer(L, a) {
  if (a.offerAge !== L.age || !a.offer) { a.offer = Math.round(a.value * rndf(0.94, 1.05) / 1000) * 1000; a.offerAge = L.age; }
  return a.offer;
}

// MARK: - Each year

function progressHomes(L) {
  progressHousingMarket(L);
  const change = L.housing.last;
  for (const a of [...homesOf(L)]) {
    normalizeHome(a, L);
    a.yearsOwned += 1;
    a.houseAge += 1;
    a.base = Math.round(a.base * (1 + change + rndf(-0.015, 0.015)));
    let decay = a.upkeep ? rnd(0, 2) : rnd(3, 7);
    if (a.houseAge > 60) decay += 1;
    if (a.rented) decay += rnd(0, 2);
    if (a.issue && a.issue.found) decay += 2;
    a.condition = clamp(a.condition - decay, 0, 100);
    a.value = homeValue(a);
    const c = homeYearlyCosts(a);
    L.money -= c.tax + c.insurance + c.upkeep;
    if (a.rented) {
      let rent = homeRent(a);
      if (roll(0.08)) { rent = Math.round(rent / 2); record(L, `🏚️ My tenants at ${a.address} stopped paying rent for months before moving out.`); }
      if (roll(0.07)) { a.condition = Math.max(0, a.condition - 10); record(L, `🏚️ My tenants at ${a.address} left the place damaged.`); }
      L.money += rent;
    }
    const paid = payLoanYear(L, a);
    if (a.loan > 0 && L.money < -Math.max(paid, a.payment) * 1.5) {
      a.missed = (a.missed || 0) + 1;
      if (a.missed >= 2) {
        L.assets = L.assets.filter((x) => x.id !== a.id);
        const left = Math.max(0, Math.round(a.value * 0.7) - a.loan);
        L.money += left;
        notify(L, "🏚️", "Foreclosure", `🏚️ I fell too far behind on the mortgage and the bank foreclosed on ${a.address}.${left ? ` I got ${formatMoney(left)} back after the sale.` : ""}`);
        adjust(L, { happiness: -25 });
        continue;
      }
      record(L, `⚠️ I'm behind on the mortgage for ${a.address}. If it happens again, the bank will take it.`);
    } else a.missed = 0;
    if (a.issue && !a.issue.found && roll(0.35)) {
      a.issue.found = true;
      a.value = homeValue(a);
      const cost = Math.round(a.base * a.issue.pct / 500) * 500;
      L.pendingEvents.push(ev("homeIssue", { id: a.id, cost }, "Problem at Home", `You discovered ${a.issue.name} at ${a.address}. Fixing it properly will cost about ${formatMoney(cost)}.`, [`Fix it properly (${formatMoney(cost)})`, `Patch it cheaply (${formatMoney(Math.round(cost / 4))})`, "Ignore it"]));
    }
  }
}

Object.assign(SIMPLE_EVENTS, {
  homeIssue: {
    emoji: "🏚️", title: "Problem at Home", min: 999, max: 0, options: [],
    resolve: (L, d, c) => {
      const a = L.assets.find((x) => x.id === d.id);
      if (!a || !a.issue) return "The problem sorted itself out.";
      const name = a.issue.name;
      if (c === 0) { L.money -= d.cost; a.issue = null; a.value = homeValue(a); return `🛠️ I paid ${formatMoney(d.cost)} to fix the ${name} at ${a.address} properly.`; }
      if (c === 1) {
        L.money -= Math.round(d.cost / 4);
        if (roll(0.5)) { a.issue = null; a.value = homeValue(a); return `🩹 A cheap patch job on the ${name} actually held up.`; }
        a.condition = Math.max(0, a.condition - 8); a.value = homeValue(a); return `🩹 I patched the ${name} cheaply. It didn't really fix it.`;
      }
      a.condition = Math.max(0, a.condition - 15); a.value = homeValue(a);
      return `I ignored the ${name} at ${a.address}. The house is getting worse.`;
    },
  },
});
