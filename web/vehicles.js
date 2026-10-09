// LifeSim: real cars, motorcycles, boats, yachts, planes, jets and helicopters,
// and the licenses you need to use them. Prices are rough US list prices in dollars.
"use strict";

// MARK: - Loans (shared with real estate)

/// Yearly payment that pays off `amount` over `years` at `rate` interest.
function loanPayment(amount, rate, years) {
  if (amount <= 0) return 0;
  return Math.ceil(amount * rate / (1 - Math.pow(1 + rate, -years)));
}

/// Pays one year of an asset's loan. Returns the amount paid.
function payLoanYear(L, a) {
  if (!(a.loan > 0)) return 0;
  const interest = Math.trunc(a.loan * (a.rate || 0.06));
  const due = Math.min(a.payment || loanPayment(a.loan, a.rate || 0.06, 10), a.loan + interest);
  a.loan = Math.max(0, a.loan + interest - due);
  L.money -= due;
  if (a.loan === 0) record(L, `🎉 I paid off the loan on my ${a.name}!`);
  return due;
}

// MARK: - Catalog

const VehicleClasses = {
  used: { kind: "car", label: "Used cars", emoji: "🚙", license: "driver", dep: 0.88, upkeep: (p) => 1300 + p * 0.06 },
  everyday: { kind: "car", label: "Everyday cars", emoji: "🚗", license: "driver", dep: 0.86, upkeep: (p) => 1500 + p * 0.035 },
  suv: { kind: "car", label: "SUVs, trucks & vans", emoji: "🛻", license: "driver", dep: 0.87, upkeep: (p) => 1800 + p * 0.035 },
  electric: { kind: "car", label: "Electric cars", emoji: "🔋", license: "driver", dep: 0.84, upkeep: (p) => 1000 + p * 0.025 },
  luxury: { kind: "car", label: "Luxury cars", emoji: "🚘", license: "driver", dep: 0.84, upkeep: (p) => 2500 + p * 0.04 },
  sports: { kind: "car", label: "Sports cars", emoji: "🏎️", license: "driver", dep: 0.88, upkeep: (p) => 2500 + p * 0.045, sporty: true },
  exotic: { kind: "car", label: "Supercars", emoji: "🏎️", license: "driver", dep: 0.93, upkeep: (p) => 8000 + p * 0.04, sporty: true },
  motorcycle: { kind: "motorcycle", label: "Motorcycles", emoji: "🏍️", license: "motorcycle", dep: 0.88, upkeep: (p) => 600 + p * 0.04 },
  boat: { kind: "boat", label: "Boats & jet skis", emoji: "🚤", license: "boating", dep: 0.9, upkeep: (p) => 800 + p * 0.08 },
  yacht: { kind: "boat", label: "Yachts", emoji: "🛥️", license: "captain", dep: 0.92, upkeep: (p) => p * 0.08, crew: (p) => Math.max(90000, Math.trunc(p * 0.05)), crewName: "captain and crew" },
  plane: { kind: "plane", label: "Small planes", emoji: "🛩️", license: "pilot", dep: 0.95, upkeep: (p) => 20000 + p * 0.03, crew: () => 95000, crewName: "pilot" },
  jet: { kind: "plane", label: "Private jets", emoji: "✈️", license: "jet", dep: 0.94, upkeep: (p) => p * 0.06, crew: (p) => (p > 20000000 ? 450000 : 300000), crewName: "flight crew" },
  helicopter: { kind: "helicopter", label: "Helicopters", emoji: "🚁", license: "helicopter", dep: 0.94, upkeep: (p) => 25000 + p * 0.05, crew: () => 140000, crewName: "pilot" },
};

const VehicleGroups = {
  car: { label: "Car dealership", emoji: "🚗", classes: ["used", "everyday", "suv", "electric", "luxury", "sports", "exotic", "motorcycle"] },
  boat: { label: "Marina", emoji: "⛵", classes: ["boat", "yacht"] },
  air: { label: "Aircraft sales", emoji: "✈️", classes: ["plane", "jet", "helicopter"] },
};

const VehicleCatalog = {
  used: [["2008 Honda Civic", 5500], ["2011 Toyota Camry", 8500], ["2010 Ford Focus", 4500], ["2014 Mazda3", 9500], ["2013 Ford F-150", 15000],
    ["2015 BMW 3 Series", 14000], ["2016 Jeep Wrangler", 22000], ["2012 Subaru Outback", 9000], ["2009 Toyota Prius", 7000], ["2017 Tesla Model S", 26000]],
  everyday: [["Nissan Versa", 18000], ["Hyundai Elantra", 22500], ["Volkswagen Jetta", 22500], ["Toyota Corolla", 23000], ["Mazda3", 24500],
    ["Honda Civic", 25000], ["Subaru Impreza", 23500], ["Toyota Camry", 29000], ["Honda Accord", 29500], ["Kia K5", 27500]],
  suv: [["Toyota RAV4", 30000], ["Honda CR-V", 31000], ["Subaru Outback", 30000], ["Jeep Wrangler", 33000], ["Kia Telluride", 37000],
    ["Ford F-150", 39000], ["Ram 1500", 41000], ["Toyota Sienna", 40000], ["Toyota 4Runner", 42000], ["Chevrolet Tahoe", 59000]],
  electric: [["Nissan Leaf", 29000], ["Tesla Model 3", 39000], ["Ford Mustang Mach-E", 40000], ["Tesla Model Y", 45000], ["Hyundai Ioniq 5", 43000],
    ["Kia EV9", 56000], ["Lucid Air", 72000], ["Rivian R1S", 77000], ["Tesla Cybertruck", 82000], ["Porsche Taycan", 100000]],
  luxury: [["Lexus ES", 43000], ["BMW 3 Series", 46000], ["Mercedes-Benz C-Class", 48000], ["Audi Q5", 46000], ["BMW X5", 66000],
    ["Porsche Cayenne", 86000], ["Cadillac Escalade", 90000], ["Range Rover", 108000], ["Mercedes-Benz S-Class", 118000], ["Mercedes-Benz G-Class", 148000]],
  sports: [["Mazda MX-5 Miata", 30000], ["Ford Mustang GT", 44000], ["Toyota GR Supra", 47000], ["Chevrolet Camaro SS", 45000], ["BMW M4", 80000],
    ["Chevrolet Corvette Stingray", 70000], ["Porsche 718 Cayman", 72000], ["Nissan GT-R", 120000], ["Porsche 911 Carrera", 120000], ["Audi R8", 160000]],
  exotic: [["Aston Martin DB12", 250000], ["Bentley Continental GT", 300000], ["Lamborghini Urus", 240000], ["McLaren 750S", 330000], ["Ferrari 296 GTB", 340000],
    ["Rolls-Royce Cullinan", 400000], ["Rolls-Royce Phantom", 480000], ["Ferrari SF90 Stradale", 530000], ["Lamborghini Revuelto", 600000], ["Bugatti Chiron", 3000000]],
  motorcycle: [["Honda Grom", 3600], ["Kawasaki Ninja 500", 5600], ["Honda Rebel 500", 6600], ["Yamaha MT-07", 8600], ["Royal Enfield Interceptor 650", 6500],
    ["Triumph Bonneville T120", 13000], ["BMW R 1300 GS", 20000], ["Indian Chief", 21000], ["Harley-Davidson Street Glide", 27000], ["Ducati Panigale V4", 29000]],
  boat: [["Sea-Doo Spark jet ski", 7500], ["Yamaha VX Cruiser jet ski", 13000], ["Tracker Pro Team 175 bass boat", 22000], ["Boston Whaler 170 Montauk", 50000],
    ["Sea Ray SPX 210", 60000], ["Chaparral 23 SSi", 85000], ["MasterCraft X24 wake boat", 230000], ["Grady-White Canyon 336", 400000],
    ["Beneteau Oceanis 46.1 sailboat", 550000], ["Lagoon 46 catamaran", 900000]],
  yacht: [["Azimut 60 Flybridge", 2800000], ["Sunseeker Predator 65", 3800000], ["Princess Y85", 7500000], ["Benetti Oasis 40M", 20000000], ["Feadship 60m superyacht", 120000000]],
  plane: [["Cessna 172 Skyhawk", 460000], ["Piper Archer", 480000], ["Diamond DA40", 650000], ["Beechcraft Bonanza G36", 1000000], ["Cirrus SR22T", 1000000]],
  jet: [["Cirrus Vision Jet", 3200000], ["Pilatus PC-12", 6000000], ["HondaJet Elite II", 7500000], ["Embraer Phenom 300E", 11000000],
    ["Cessna Citation Latitude", 18000000], ["Bombardier Global 7500", 78000000], ["Gulfstream G700", 78000000], ["Boeing Business Jet", 100000000]],
  helicopter: [["Robinson R22", 350000], ["Robinson R44", 550000], ["Bell 505", 1800000], ["Airbus H125", 3500000], ["Sikorsky S-76D", 14000000]],
};

const isVehicle = (a) => a.kind !== "house";
const vehicleClass = (a) => VehicleClasses[a.cls] || VehicleClasses.everyday;
const conditionFactor = (c) => 0.5 + 0.5 * c / 100;
const vehicleEmoji = (a) => vehicleClass(a).emoji;
const vehicleUpkeep = (a) => Math.trunc(vehicleClass(a).upkeep(a.basePrice || a.purchasePrice || a.value));
const crewCost = (a) => (a.crew && vehicleClass(a).crew ? vehicleClass(a).crew(a.basePrice || a.value) : 0);

function vehicleListings(cls) {
  return VehicleCatalog[cls].map(([name, price]) => {
    const used = cls === "used";
    const condition = used ? rnd(40, 78) : 100;
    return { id: uid(), cls, name, condition, price: Math.round(price * rndf(used ? 0.85 : 0.97, used ? 1.15 : 1.06) / 100) * 100 };
  });
}

// MARK: - Licenses

const Licenses = {
  driver: {
    name: "Driver's license", emoji: "🚗", minAge: 16, fee: 100,
    train: { label: "Take driving lessons", cost: 400, max: 3, sub: "Each lesson makes the test easier" },
    pass: (L, t) => 0.4 + L.stats.smarts / 250 + t * 0.12,
    fails: ["I hit a cone.", "I forgot to signal.", "I rolled through a stop sign.", "I parallel parked on the curb.", "I drove in the bike lane."],
  },
  motorcycle: {
    name: "Motorcycle license", emoji: "🏍️", minAge: 16, fee: 150,
    train: { label: "Motorcycle safety course", cost: 350, max: 2, sub: "Learn to ride before the road test" },
    pass: (L, t) => 0.4 + L.stats.smarts / 300 + L.stats.health / 400 + t * 0.15,
    fails: ["I dropped the bike in the cone weave.", "I put my foot down in the slow ride.", "I stalled three times."],
  },
  boating: {
    name: "Boating license", emoji: "🚤", minAge: 16, fee: 60,
    train: { label: "Boating safety course", cost: 200, max: 1, sub: "Rules of the water, knots and buoys" },
    pass: (L, t) => 0.55 + L.stats.smarts / 250 + t * 0.2,
    fails: ["I mixed up port and starboard.", "I couldn't remember what a red buoy means."],
  },
  captain: {
    name: "Captain's license", emoji: "⚓", minAge: 19, fee: 1500, requires: "boating", log: "sea", need: 90, unit: "days at sea",
    train: { label: "Crew on a charter yacht for a season", cost: -8000, gain: [20, 32], once: true, sub: "Earn $8,000 and log sea time" },
    pass: (L) => 0.5 + L.stats.smarts / 250,
    fails: ["I botched the navigation exam.", "My chart plotting was way off."],
  },
  pilot: {
    name: "Private pilot license", emoji: "🛩️", minAge: 17, fee: 1000, log: "flight", need: 40, unit: "flight hours", minHealth: 40,
    train: { label: "Flight lessons", cost: 3500, gain: [8, 12], sub: "About 10 hours with an instructor" },
    pass: (L) => 0.5 + L.stats.smarts / 300 + Math.min(0.15, ((L.logs || {}).flight - 40) / 200),
    fails: ["I bounced the landing three times.", "I busted my altitude on steep turns.", "I got lost on the cross-country leg."],
  },
  jet: {
    name: "Jet type rating", emoji: "✈️", minAge: 21, fee: 30000, requires: "pilot", log: "flight", need: 250, unit: "flight hours", minHealth: 50,
    train: { label: "Rent a plane to build hours", cost: 2000, gain: [9, 12], sub: "Hours count toward the 250 you need" },
    pass: (L) => 0.45 + L.stats.smarts / 250,
    fails: ["I failed the engine-out drill in the simulator.", "I missed a checklist item on the checkride."],
  },
  helicopter: {
    name: "Helicopter license", emoji: "🚁", minAge: 17, fee: 1200, log: "heli", need: 40, unit: "flight hours", minHealth: 40,
    train: { label: "Helicopter lessons", cost: 5000, gain: [8, 12], sub: "Hovering is harder than it looks" },
    pass: (L) => 0.45 + L.stats.smarts / 300,
    fails: ["I couldn't hold a steady hover.", "My autorotation landing was too hard."],
  },
};

function hasLicense(L, id) {
  if (id === "driver") return !!L.hasDriversLicense;
  return !!(L.licenses || {})[id];
}
function grantLicense(L, id) {
  if (id === "driver") L.hasDriversLicense = true;
  else (L.licenses ||= {})[id] = true;
}
const logOf = (L, key) => (L.logs || {})[key] || 0;
function addLog(L, key, n) { (L.logs ||= {})[key] = logOf(L, key) + n; }
const trainingOf = (L, id) => (L.licenseTraining || {})[id] || 0;

/// Why you can't take this license test yet (empty when you can).
function licenseBlockers(L, id) {
  const lic = Licenses[id];
  const out = [];
  if (L.age < lic.minAge) out.push(`You must be ${lic.minAge}`);
  if (lic.requires && !hasLicense(L, lic.requires)) out.push(`Needs a ${Licenses[lic.requires].name.toLowerCase()} first`);
  if (lic.minHealth && L.stats.health < lic.minHealth) out.push(`Needs ${lic.minHealth}% health for the medical exam`);
  if (lic.log && logOf(L, lic.log) < lic.need) out.push(`${logOf(L, lic.log)} of ${lic.need} ${lic.unit}`);
  if (inPrison(L)) out.push("Not from prison");
  return out;
}

function licenseTrain(L, id) {
  const lic = Licenses[id];
  const t = lic.train;
  if (inPrison(L) || L.age < Math.max(lic.minAge - 1, 15)) return out(L, lic.name, "I'm not old enough to start training.", false);
  if (lic.requires && !hasLicense(L, lic.requires)) return out(L, lic.name, `I need a ${Licenses[lic.requires].name.toLowerCase()} first.`, false);
  if (t.max && trainingOf(L, id) >= t.max) return out(L, lic.name, "I've had all the practice I need. Time for the test.", false);
  if (t.once && usedThisYear(L, `train-${id}`)) return out(L, lic.name, "I already did a season this year.", false);
  if (t.cost > 0 && L.money < t.cost) return out(L, lic.name, `That costs ${formatMoney(t.cost)}.`, false);
  if (t.once) markUsed(L, `train-${id}`);
  L.money -= t.cost;
  if (t.max) {
    (L.licenseTraining ||= {})[id] = trainingOf(L, id) + 1;
    adjust(L, { smarts: 1 });
    return out(L, lic.name, `${lic.emoji} ${t.label}: done (${trainingOf(L, id)} of ${t.max}). I feel more confident.`);
  }
  const gained = rnd(t.gain[0], t.gain[1]);
  addLog(L, lic.log, gained);
  adjust(L, { happiness: 2 });
  const extra = t.cost < 0 ? ` I earned ${formatMoney(-t.cost)}.` : "";
  return out(L, lic.name, `${lic.emoji} ${t.label}: +${gained} ${lic.unit} (${logOf(L, lic.log)} of ${lic.need}).${extra}`);
}

function takeLicenseTest(L, id) {
  const lic = Licenses[id];
  if (hasLicense(L, id)) return out(L, lic.name, "I already have it.", false);
  const blockers = licenseBlockers(L, id);
  if (blockers.length) return out(L, lic.name, `Not yet: ${blockers.join("; ")}.`, false);
  if (L.money < lic.fee) return out(L, lic.name, `The test costs ${formatMoney(lic.fee)}.`, false);
  L.money -= lic.fee;
  if (roll(clamp(lic.pass(L, trainingOf(L, id)), 0.05, 0.97))) {
    grantLicense(L, id);
    adjust(L, { happiness: 10 });
    bump(L, "licenses");
    return out(L, lic.name, `${lic.emoji} I passed! I got my ${lic.name.toLowerCase()}.`);
  }
  adjust(L, { happiness: -5 });
  return out(L, lic.name, `I failed the ${lic.name.toLowerCase()} test. ${pick(lic.fails)}`);
}

// Keep the old driving-test helpers working.
function takeDrivingTest(L) { return takeLicenseTest(L, "driver"); }

// MARK: - Buying and selling

const vehicleDown = (cls) => (VehicleClasses[cls].kind === "car" || VehicleClasses[cls].kind === "motorcycle" ? 0.1 : 0.2);
const vehicleLoanTerms = (cls) => (VehicleClasses[cls].kind === "car" || VehicleClasses[cls].kind === "motorcycle" ? { rate: 0.07, years: 5 } : { rate: 0.075, years: 10 });

function canFinanceVehicle(L, listing) {
  if (!L.job || L.job.partTime || L.age < 18) return false;
  const reach = VehicleClasses[listing.cls].kind === "car" || VehicleClasses[listing.cls].kind === "motorcycle" ? 1.2 : 2.5;
  return listing.price <= L.job.salary * reach && L.money >= Math.ceil(listing.price * vehicleDown(listing.cls));
}

function makeVehicleAsset(listing, loan = 0) {
  const vc = VehicleClasses[listing.cls];
  const a = {
    id: uid(), kind: vc.kind, cls: listing.cls, name: listing.name, purchasePrice: listing.price, value: listing.price,
    basePrice: Math.round(listing.price / conditionFactor(listing.condition)), condition: listing.condition, yearsOwned: 0,
    loan, payment: 0, rate: 0, crew: false,
  };
  if (loan > 0) { const t = vehicleLoanTerms(listing.cls); a.rate = t.rate; a.payment = loanPayment(loan, t.rate, t.years); }
  return a;
}

function buyVehicle(L, listing, financed = false) {
  const vc = VehicleClasses[listing.cls];
  const minAge = vc.kind === "car" || vc.kind === "motorcycle" ? 16 : 18;
  if (L.age < minAge) return out(L, "Too Young", `I need to be ${minAge} to buy that.`, false);
  if (inPrison(L)) return out(L, "Prison", "I can't go shopping from prison.", false);
  const down = financed ? Math.ceil(listing.price * vehicleDown(listing.cls)) : listing.price;
  if (L.money < down || (financed && !canFinanceVehicle(L, listing))) return out(L, "Can't Afford", `I can't afford the ${listing.name}. I need ${formatMoney(down)}.`, false);
  L.money -= down;
  const a = makeVehicleAsset(listing, listing.price - down);
  L.assets.push(a);
  adjust(L, { happiness: listing.price > 1000000 ? 15 : 10 });
  let m = financed ? `${vc.emoji} I bought a ${listing.name}, putting ${formatMoney(down)} down and financing the rest.` : `${vc.emoji} I bought a ${listing.name} for ${formatMoney(listing.price)}!`;
  if (!hasLicense(L, vc.license) && !vc.crew) m += ` Now I just need a ${Licenses[vc.license].name.toLowerCase()}.`;
  else if (!hasLicense(L, vc.license)) m += ` I'll need a ${Licenses[vc.license].name.toLowerCase()} or a hired ${vc.crewName} to use it.`;
  return out(L, "Purchased", m);
}

/// Gives the player a vehicle for free (prizes, gifts).
function giveVehicle(L, cls, name) {
  const entry = VehicleCatalog[cls].find((v) => v[0] === name) || VehicleCatalog[cls][0];
  const a = makeVehicleAsset({ cls, name: entry[0], price: entry[1], condition: 100 });
  a.purchasePrice = 0;
  L.assets.push(a);
  return a;
}

function sellVehicle(L, id) {
  const a = L.assets.find((x) => x.id === id);
  if (!a) return out(L, "Oops", "I don't own that anymore.", false);
  L.assets = L.assets.filter((x) => x.id !== id);
  L.money += a.value - a.loan;
  const payoff = a.loan > 0 ? ` After paying off the loan I kept ${formatMoney(a.value - a.loan)}.` : "";
  return out(L, "Sold", `I sold my ${a.name} for ${formatMoney(a.value)}.${payoff}`);
}

// MARK: - Using them

/// Can you legally use it? Returns null if yes, or what's missing.
function vehicleBlocker(L, a) {
  const vc = vehicleClass(a);
  if (hasLicense(L, vc.license) || a.crew) return null;
  return vc.crew ? `You need a ${Licenses[vc.license].name.toLowerCase()} or a hired ${vc.crewName}.` : `You need a ${Licenses[vc.license].name.toLowerCase()}.`;
}
/// Cars, bikes and small boats can be used without a license, at a risk. Aircraft and yachts can't.
const canRiskIt = (a) => !vehicleClass(a).crew;

const VehicleActions = {
  drive: { label: "Go for a drive", kinds: ["car"], emoji: "🛣️" },
  ride: { label: "Go for a ride", kinds: ["motorcycle"], emoji: "🏍️" },
  roadTrip: { label: "Take a road trip", kinds: ["car", "motorcycle"], emoji: "🗺️", sub: "$800–$2,500" },
  trackDay: { label: "Track day", kinds: ["car", "motorcycle"], emoji: "🏁", sub: "$1,500 · fast and a little dangerous", sporty: true },
  cruise: { label: "Take it out on the water", kinds: ["boat"], emoji: "🌊" },
  fishing: { label: "Go fishing", kinds: ["boat"], emoji: "🎣", small: true },
  boatParty: { label: "Throw a party on board", kinds: ["boat"], emoji: "🥂", yacht: true },
  fly: { label: "Take it up for a flight", kinds: ["plane", "helicopter"], emoji: "☁️" },
  flyAway: { label: "Fly somewhere for the weekend", kinds: ["plane", "helicopter"], emoji: "🌍" },
  charter: { label: "Charter it out this year", kinds: ["boat", "plane", "helicopter"], emoji: "💼", big: true },
  service: { label: "Service it", kinds: ["car", "motorcycle", "boat", "plane", "helicopter"], emoji: "🔧" },
};

function vehicleActionsFor(a) {
  const vc = vehicleClass(a);
  return Object.entries(VehicleActions).filter(([, d]) => d.kinds.includes(a.kind)
    && (!d.sporty || vc.sporty || a.cls === "motorcycle")
    && (!d.yacht || a.cls === "yacht")
    && (!d.small || a.cls === "boat")
    && (!d.big || a.cls === "yacht" || a.cls === "jet" || a.cls === "helicopter")).map(([id]) => id);
}

const serviceCost = (a) => Math.max(150, Math.trunc(vehicleUpkeep(a) * (1 - a.condition / 100) * 0.8));

/// Using a vehicle you're not licensed for: you might get caught.
function unlicensedRisk(L, a) {
  const caught = roll(a.kind === "boat" ? 0.12 : 0.2);
  if (!caught) return "";
  const fine = a.kind === "boat" ? 500 : 1000;
  L.money -= fine;
  const charge = a.kind === "boat" ? "Operating a boat without a license" : "Driving without a license";
  L.criminalRecord.push(charge);
  return ` The police stopped me and charged me with ${charge.toLowerCase()}. Fine: ${formatMoney(fine)}.`;
}

/// A crash when you're behind the wheel or the controls.
function crashCheck(L, a, base) {
  let p = base + (a.condition < 30 ? 0.03 : a.condition < 50 ? 0.01 : 0);
  if (a.kind === "plane" || a.kind === "helicopter") p += logOf(L, a.kind === "plane" ? "flight" : "heli") < 80 ? 0.003 : 0;
  if (L.addictions.includes("alcohol")) p += 0.01;
  if (!roll(p)) return "";
  const air = a.kind === "plane" || a.kind === "helicopter";
  if (roll(air ? 0.55 : 0.15)) { die(L, air ? `a ${a.kind === "plane" ? "plane" : "helicopter"} crash` : a.kind === "motorcycle" ? "a motorcycle crash" : a.kind === "boat" ? "a boating accident" : "a car crash"); return " It ended in a crash."; }
  adjust(L, { health: -rnd(15, 40), happiness: -10 });
  if (air || roll(0.4)) {
    const payout = Math.trunc(a.value * 0.8);
    L.assets = L.assets.filter((x) => x.id !== a.id);
    L.money += payout - a.loan;
    return ` I crashed and the ${a.name} was destroyed. I survived with injuries. Insurance paid ${formatMoney(payout)}.`;
  }
  a.condition = Math.max(5, a.condition - 40);
  return " I crashed and got hurt. The damage is bad.";
}

function vehicleAction(L, id, action, risky = false) {
  const a = L.assets.find((x) => x.id === id);
  if (!a) return out(L, "Garage", "I don't own that anymore.", false);
  if (inPrison(L)) return out(L, a.name, "I'm in prison.", false);
  const vc = vehicleClass(a);
  const d = VehicleActions[action];
  const blocker = action === "service" || action === "charter" ? null : vehicleBlocker(L, a);
  if (blocker && !(risky && canRiskIt(a))) return out(L, a.name, blocker, false);
  const unlicensed = blocker ? unlicensedRisk(L, a) : "";
  const once = !["service"].includes(action);
  if (once) {
    if (usedThisYear(L, `veh-${id}-${action}`)) return out(L, a.name, "I already did that this year.", false);
    markUsed(L, `veh-${id}-${action}`);
  }
  const wear = (n) => { a.condition = clamp(a.condition - n, 0, 100); };
  const selfPiloted = !a.crew || hasLicense(L, vc.license);
  let m;
  switch (action) {
    case "drive": case "ride":
      adjust(L, { happiness: rnd(3, 7) }); wear(1);
      m = `${d.emoji} I took my ${a.name} for a ${pick(["spin around town", "drive along the coast", "late-night cruise", "drive with the windows down"])}.`;
      break;
    case "roadTrip": {
      const cost = rnd(800, 2500); L.money -= cost; adjust(L, { happiness: rnd(8, 14) }); wear(4);
      const c = countryOf(L.country);
      const dest = c ? pick(c[1].filter((x) => x !== L.city).concat([c[1][0]])) : "the coast";
      const partner = romanticPartner(L);
      if (partner) { touch(L, partner.id); updateRel(L, partner.id, (x) => { x.bond += rnd(4, 8); }); }
      m = `${d.emoji} I took a road trip to ${dest} in my ${a.name}${partner ? ` with ${partner.firstName}` : ""}. It cost ${formatMoney(cost)}.`;
      break;
    }
    case "trackDay":
      L.money -= 1500; adjust(L, { happiness: rnd(8, 14) }); wear(6);
      m = `${d.emoji} I spent a day lapping a race track in my ${a.name}. ${pick(["I shaved two seconds off my best lap.", "The tires were screaming.", "A pro driver gave me tips."])}`;
      m += crashCheck(L, a, 0.02);
      break;
    case "cruise":
      adjust(L, { happiness: rnd(5, 10) }); wear(2); addLog(L, "sea", rnd(3, 8));
      m = `${d.emoji} I took my ${a.name} out on the water${a.crew && !hasLicense(L, vc.license) ? " with my crew at the helm" : ""}.`;
      if (selfPiloted) m += crashCheck(L, a, 0.003);
      break;
    case "fishing": {
      adjust(L, { happiness: rnd(4, 8) }); wear(2); addLog(L, "sea", rnd(2, 5));
      if (roll(0.15)) { const prize = rnd(200, 3000); L.money += prize; m = `${d.emoji} I caught a ${pick(["giant tuna", "huge marlin", "record bass", "massive halibut"])} and sold it for ${formatMoney(prize)}!`; }
      else m = `${d.emoji} I went fishing on my ${a.name}. ${pick(["I caught a few small ones.", "Nothing was biting.", "I caught dinner."])}`;
      break;
    }
    case "boatParty": {
      const cost = Math.min(80000, Math.max(5000, Math.trunc(a.value * 0.003))); L.money -= cost; wear(3);
      const friends = L.relationships.filter((p) => p.isAlive && (p.kind === "friend" || isRomantic(p.kind)) && p.age >= 18);
      for (const f of friends) { touch(L, f.id); updateRel(L, f.id, (x) => { x.bond += rnd(3, 7); }); }
      adjust(L, { happiness: rnd(8, 14) }); bump(L, "parties");
      m = `${d.emoji} I threw a party on my ${a.name}${friends.length ? ` for ${plural(friends.length, "friend")}` : ""}. It cost ${formatMoney(cost)}.`;
      break;
    }
    case "fly": {
      const key = a.kind === "plane" ? "flight" : "heli";
      adjust(L, { happiness: rnd(5, 10) }); wear(2);
      if (selfPiloted) addLog(L, key, rnd(3, 6));
      m = `${d.emoji} ${selfPiloted ? "I flew" : "My pilot flew"} my ${a.name} ${pick(["over the city at sunset", "along the coastline", "above the clouds", "over the mountains"])}.`;
      if (selfPiloted) m += crashCheck(L, a, 0.002);
      break;
    }
    case "flyAway": {
      const key = a.kind === "plane" ? "flight" : "heli";
      const longRange = a.cls === "jet";
      const c = longRange ? pick(WORLD) : (countryOf(L.country) || pick(WORLD));
      const city = pick(c[1].filter((x) => x !== L.city).concat([c[1][0]]));
      const cost = longRange ? rnd(20000, 90000) : a.kind === "helicopter" ? rnd(3000, 9000) : rnd(800, 3000);
      L.money -= cost; adjust(L, { happiness: rnd(10, 16) }); wear(3);
      if (selfPiloted) addLog(L, key, rnd(4, longRange ? 14 : 8));
      m = `${d.emoji} ${selfPiloted ? "I flew" : "My pilots flew"} my ${a.name} to ${city}${c[0] !== L.country ? `, ${c[0]}` : ""} for the weekend. Fuel and fees: ${formatMoney(cost)}.`;
      if (selfPiloted) m += crashCheck(L, a, 0.002);
      break;
    }
    case "charter": {
      const income = Math.trunc(a.value * rndf(0.04, 0.08)); L.money += income; wear(8);
      m = `${d.emoji} I chartered out my ${a.name} for the season and earned ${formatMoney(income)}. The wear and tear adds up.`;
      break;
    }
    case "service": {
      if (a.condition >= 95) return out(L, a.name, "It's in perfect shape already.", false);
      const cost = serviceCost(a);
      if (L.money < cost) return out(L, a.name, `Servicing it costs ${formatMoney(cost)}.`, false);
      L.money -= cost; a.condition = Math.min(100, a.condition + 40);
      a.value = Math.trunc(vehicleBaseValue(a) * conditionFactor(a.condition));
      m = `🔧 I had my ${a.name} serviced for ${formatMoney(cost)}. Condition is now ${a.condition}%.`;
      break;
    }
  }
  return out(L, a.name, m + unlicensed);
}

function toggleCrew(L, id) {
  const a = L.assets.find((x) => x.id === id);
  if (!a || !vehicleClass(a).crew) return out(L, "Crew", "That doesn't need a crew.", false);
  a.crew = !a.crew;
  const vc = vehicleClass(a);
  return out(L, a.name, a.crew ? `👨‍✈️ I hired a ${vc.crewName} for my ${a.name}: ${formatMoney(crewCost(a))} a year.` : `I let the ${vc.crewName} go.`);
}

// MARK: - Each year

const vehicleBaseValue = (a) => Math.trunc((a.basePrice || a.value) * Math.pow(vehicleClass(a).dep, a.yearsOwned));

/// Brings vehicles from older saves up to date.
function normalizeVehicle(a) {
  if (a.cls) return a;
  if (a.kind === "boat") a.cls = a.purchasePrice >= 1000000 || a.value >= 1000000 ? "yacht" : "boat";
  else if (a.kind === "car") a.cls = (a.purchasePrice || a.value) >= 200000 ? "exotic" : (a.purchasePrice || a.value) >= 80000 ? "luxury" : "everyday";
  else a.cls = "everyday";
  a.condition = a.condition ?? 75;
  a.basePrice = Math.round((a.value || 1) / Math.pow(VehicleClasses[a.cls].dep, a.yearsOwned || 0) / conditionFactor(a.condition));
  if (a.loan > 0 && !a.payment) { a.rate = 0.07; a.payment = loanPayment(a.loan, 0.07, 5); }
  a.crew = a.crew || false;
  return a;
}

function progressVehicles(L) {
  for (const a of [...L.assets]) {
    if (!isVehicle(a)) continue;
    normalizeVehicle(a);
    a.yearsOwned += 1;
    const wear = { car: [3, 7], motorcycle: [3, 7], boat: [4, 8], plane: [2, 5], helicopter: [3, 6] }[a.kind] || [3, 6];
    a.condition = clamp(a.condition - rnd(wear[0], wear[1]), 0, 100);
    a.value = Math.max(0, Math.trunc(vehicleBaseValue(a) * conditionFactor(a.condition)));
    L.money -= vehicleUpkeep(a) + crewCost(a);
    payLoanYear(L, a);
    if (a.condition < 25 && roll(0.3)) {
      const cost = Math.max(300, Math.trunc(vehicleUpkeep(a) * 0.5));
      L.money -= cost; a.condition = Math.min(100, a.condition + 15);
      record(L, `🔧 My ${a.name} broke down. Repairs cost ${formatMoney(cost)}. It needs a proper service.`);
    }
  }
}
