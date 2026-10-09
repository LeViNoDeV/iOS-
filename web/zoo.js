// LifeSim Pets & Zoo: pets cost money, live for realistic spans and need care. Exotic animals
// need a permit, land and sometimes an enclosure, or you buy them illegally and risk a raid.
// The zoo is a real operation: exhibits, keepers, habitats, ticket prices and conservation.
"use strict";

// MARK: Pets

const PetCare = {
  Dog: { upkeep: 1500, life: 13, trainable: true, show: true, groom: true, walk: true },
  Cat: { upkeep: 1000, life: 15, show: true, groom: true },
  Rabbit: { upkeep: 600, life: 9, groom: true },
  Parrot: { upkeep: 600, life: 40, trainable: true },
  Hamster: { upkeep: 200, life: 3 },
};

const ExoticPets = [
  { species: "Ball python", emoji: "🐍", price: 300, upkeep: 400, life: 25 },
  { species: "Bearded dragon", emoji: "🦎", price: 250, upkeep: 500, life: 12 },
  { species: "Tortoise", emoji: "🐢", price: 400, upkeep: 300, life: 80 },
  { species: "Macaw", emoji: "🦜", price: 3000, upkeep: 1200, life: 50, trainable: true },
  { species: "Horse", emoji: "🐴", price: 8000, upkeep: 7000, life: 28, land: true, trainable: true, show: true, groom: true, ride: true },
  { species: "Alpaca", emoji: "🦙", price: 3500, upkeep: 2000, life: 20, land: true, groom: true },
  { species: "Fennec fox", emoji: "🦊", price: 3000, upkeep: 1500, life: 12, permit: true },
  { species: "Kangaroo", emoji: "🦘", price: 4000, upkeep: 3000, life: 20, permit: true, land: true },
  { species: "Capuchin monkey", emoji: "🐒", price: 9000, upkeep: 6000, life: 40, permit: true, trainable: true, danger: 0.01 },
  { species: "Alligator", emoji: "🐊", price: 3000, upkeep: 4000, life: 50, permit: true, land: true, enclosure: true, danger: 0.03 },
  { species: "Tiger", emoji: "🐯", price: 15000, upkeep: 12000, life: 20, permit: true, land: true, enclosure: true, danger: 0.04 },
  { species: "Lion", emoji: "🦁", price: 20000, upkeep: 12000, life: 18, permit: true, land: true, enclosure: true, danger: 0.04 },
];
for (const p of ExoticPets) petEmoji[p.species] = p.emoji;

const petInfo = (p) => PetCare[p.species] || ExoticPets.find((x) => x.species === p.species) || { upkeep: 500, life: 12 };
const LandHomes = new Set(["farmhouse", "estate", "castle", "mansion"]);
const hasLand = (L) => L.assets.some((a) => a.kind === "house" && !a.rented && LandHomes.has(a.typeId));
const hasHouseForPets = (L) => L.assets.some((a) => a.kind === "house" && !a.rented && !homeType(a).unit);

const PetExtraActions = { train: "Train", groom: "Groom", vet: "Vet checkup", show: "Enter a show", ride: "Go for a ride", rehome: "Rehome to a sanctuary", rename: "✏️ Rename" };

function petActionsFor(p) {
  const info = petInfo(p);
  const list = ["play"];
  if (info.walk) list.push("walkPet");
  if (info.trainable) list.push("train");
  if (info.groom) list.push("groom");
  list.push("vet");
  if (info.show) list.push("show");
  if (info.ride) list.push("ride");
  if (p.exotic) list.push("rehome");
  list.push("rename");
  return list;
}

function petAction(L, id, action) {
  const p = findRel(L, id);
  if (!p) return out(L, "Pets", "That pet is gone.", false);
  ensureNpcStats(p);
  touch(L, id);
  const info = petInfo(p);
  const key = `pet-${id}-${action}`;
  if (action !== "rehome" && usedThisYear(L, key)) return out(L, p.firstName, "We already did that this year.", false);
  markUsed(L, key);
  let m;
  switch (action) {
    case "train":
      if ((p.training || 0) >= 5) { m = `🎓 ${p.firstName} already knows every trick I can teach.`; break; }
      if (roll(0.75 - (p.training || 0) * 0.08 + p.bond / 400)) { updateRel(L, id, (x) => { x.bond += rnd(4, 8); x.training = (x.training || 0) + 1; }); m = `🦴 ${p.firstName} learned ${pick(["to sit and stay", "to come when called", "a new trick", "to stop pulling", "to wait at the door"])}. (Training ${p.training}/5)`; }
      else { updateRel(L, id, (x) => { x.bond -= 1; }); m = `${p.firstName} wasn't in the mood to learn anything today.`; }
      break;
    case "groom": updateRel(L, id, (x) => { x.bond += rnd(2, 5); x.looks = Math.min(100, (x.looks || 50) + rnd(3, 8)); }); m = `✂️ I groomed ${p.firstName}. Looking sharp!`; break;
    case "vet": {
      const cost = p.exotic ? 800 : 250;
      L.money -= cost;
      const was = p.health;
      updateRel(L, id, (x) => { x.health = Math.min(100, x.health + rnd(18, 30)); x.bond += 1; });
      m = was < 45 ? `🩺 The vet caught ${pick(["an infection", "a dental problem", "a heart murmur", "a parasite"])} in ${p.firstName} just in time. (${formatMoney(cost)})` : `🩺 ${p.firstName} got a clean bill of health. (${formatMoney(cost)})`;
      break;
    }
    case "show": {
      const score = (p.looks || 50) / 2 + (p.training || 0) * 7 + p.health / 5 + rnd(0, 25);
      if (score >= 90) { const prize = rnd(2000, 10000); L.money += prize; updateRel(L, id, (x) => { x.bond += 5; }); adjust(L, { happiness: 10 }); m = `🏆 ${p.firstName} won Best in Show! Prize: ${formatMoney(prize)}.`; }
      else if (score >= 72) { adjust(L, { happiness: 5 }); m = `🎀 ${p.firstName} took a ribbon in ${p.species === "Horse" ? "the dressage class" : "their group"}.`; }
      else m = `${p.firstName} didn't place this time. ${(p.training || 0) < 3 ? "More training would help." : "Better grooming might help."}`;
      break;
    }
    case "ride":
      adjust(L, { happiness: rnd(5, 9), health: 2 }); updateRel(L, id, (x) => { x.bond += 4; });
      if (roll(0.04)) { adjust(L, { health: -rnd(10, 25) }); m = `🐴 ${p.firstName} spooked at a plastic bag and threw me. I'm bruised but OK.`; }
      else m = `🐴 I rode ${p.firstName} ${pick(["across the fields", "along the trails", "through the woods", "at a gallop by the river"])}.`;
      break;
    case "rehome":
      L.relationships = L.relationships.filter((x) => x.id !== id);
      adjust(L, { happiness: -5 }); L.karma += p.exotic && petInfo(p).danger ? 3 : 0;
      return out(L, p.firstName, `I found ${p.firstName} a home at an accredited animal sanctuary. It was the responsible thing to do.`);
  }
  return out(L, p.firstName, remember(L, p, m));
}

// Exotic pets: permits, land and enclosures.

function applyExoticPermit(L) {
  if (L.age < 18) return out(L, "Permit", "I'm too young to apply.", false);
  if (L.permits?.exotic) return out(L, "Permit", "I already have an exotic animal permit.", false);
  if (usedThisYear(L, "permit")) return out(L, "Permit", "I already applied this year.", false);
  markUsed(L, "permit");
  L.money -= 1500;
  if (!hasHouseForPets(L)) return out(L, "Permit", "The wildlife agency rejected my application: I need to own a house, not an apartment. ($1,500 fee)");
  if (L.criminalRecord.length >= 3 || L.criminalRecord.some((c) => /animal/i.test(c))) return out(L, "Permit", "The wildlife agency rejected my application because of my criminal record. ($1,500 fee)");
  if (!roll(0.8)) return out(L, "Permit", "The wildlife agency said my application was incomplete. I can try again next year. ($1,500 fee)");
  (L.permits ||= {}).exotic = true;
  return out(L, "Permit", "📋 I was granted an exotic animal permit. ($1,500 fee)");
}

function buildEnclosure(L) {
  if (L.enclosure) return out(L, "Enclosure", "I already have a secure enclosure.", false);
  if (!hasLand(L)) return out(L, "Enclosure", "I need a property with land, like a farmhouse or an estate.", false);
  if (L.money < 60000) return out(L, "Enclosure", "A proper big-animal enclosure costs $60,000.", false);
  L.money -= 60000; L.enclosure = true;
  return out(L, "Enclosure", "🏗️ I built a secure, inspected enclosure for big animals. ($60,000)");
}

/// What's stopping you from legally owning this animal.
function exoticBlockers(L, ex) {
  const b = [];
  if (ex.land && !hasLand(L)) b.push("land (a farmhouse, mansion, estate or castle)");
  if (ex.permit && !L.permits?.exotic) b.push("an exotic animal permit");
  if (ex.enclosure && !L.enclosure) b.push("a secure enclosure");
  return b;
}

function buyExoticPet(L, species, blackMarket = false) {
  const ex = ExoticPets.find((x) => x.species === species);
  if (L.age < 18) return out(L, "Exotic Pets", "I'm too young to buy an exotic animal.", false);
  const blockers = exoticBlockers(L, ex);
  if (blockers.length && !blackMarket) return out(L, "Exotic Pets", `To own a ${species.toLowerCase()} legally I need ${blockers.join(" and ")}.`, false);
  const price = Math.round(ex.price * (blackMarket ? 1.4 : 1));
  if (L.money < price) return out(L, "Exotic Pets", `A ${species.toLowerCase()} costs ${formatMoney(price)}.`, false);
  L.money -= price;
  const pet = { ...makePerson("pet", rnd(1, 4), { noTrait: true, bond: 50 }), lastName: "", firstName: pick(Names.petNames), species, occupation: null, salary: 0, lastContact: L.age, exotic: true, training: 0 };
  if (blackMarket && blockers.length) { pet.illegal = true; L.karma -= 5; bump(L, "crimes"); }
  L.relationships.push(pet);
  adjust(L, { happiness: 10 });
  return out(L, "Exotic Pets", `${ex.emoji} I ${pet.illegal ? "bought a " + species.toLowerCase() + " from a shady dealer" : "bought a " + species.toLowerCase()} for ${formatMoney(price)}. It'll cost about ${formatMoney(ex.upkeep)} a year to keep.`);
}

function progressPets(L) {
  let upkeep = 0;
  for (const p of [...L.relationships]) {
    if (!p.isAlive || p.kind !== "pet") continue;
    const info = petInfo(p);
    upkeep += info.upkeep;
    if ((yearsSinceContact(p, L.age) ?? 0) >= 2) p.health = Math.max(0, (p.health ?? 70) - 10);
    if (p.illegal && roll(0.12)) {
      L.relationships = L.relationships.filter((x) => x.id !== p.id);
      L.money -= 10000; L.criminalRecord.push("Illegal possession of a wild animal");
      notify(L, "🚓", "Wildlife Raid", `🚓 Wildlife officers seized my ${p.species.toLowerCase()} ${p.firstName}. I was fined $10,000.`);
      continue;
    }
    if (info.danger) {
      const risk = info.danger * (1 - (p.training || 0) * 0.12) * (info.enclosure && !L.enclosure ? 2 : info.enclosure ? 0.4 : 1) * (p.bond < 40 ? 1.5 : 1);
      if (roll(risk)) {
        if (roll(0.12)) { die(L, `an attack by my pet ${p.species.toLowerCase()}`); return; }
        adjust(L, { health: -rnd(10, 30) });
        notify(L, petEmoji[p.species], "Animal Attack", `${petEmoji[p.species]} My ${p.species.toLowerCase()} ${p.firstName} attacked me. Wild animals are never fully tame.`);
      }
    }
  }
  if (upkeep) L.money -= upkeep;
}

// MARK: Zoo

const ZooAnimals = {
  flamingo: { name: "Flamingos", emoji: "🦩", price: 8000, upkeep: 3000, appeal: 3 },
  penguin: { name: "Penguins", emoji: "🐧", price: 25000, upkeep: 12000, appeal: 7 },
  otter: { name: "Otters", emoji: "🦦", price: 15000, upkeep: 8000, appeal: 6 },
  kangaroo: { name: "Kangaroos", emoji: "🦘", price: 12000, upkeep: 6000, appeal: 4 },
  zebra: { name: "Zebras", emoji: "🦓", price: 18000, upkeep: 8000, appeal: 4 },
  crocodile: { name: "Crocodiles", emoji: "🐊", price: 20000, upkeep: 8000, appeal: 5, danger: 0.01 },
  giraffe: { name: "Giraffes", emoji: "🦒", price: 60000, upkeep: 60000, appeal: 8 },
  hippo: { name: "Hippos", emoji: "🦛", price: 75000, upkeep: 50000, appeal: 7, danger: 0.01 },
  lion: { name: "Lions", emoji: "🦁", price: 60000, upkeep: 40000, appeal: 9, danger: 0.02 },
  tiger: { name: "Tigers", emoji: "🐯", price: 70000, upkeep: 45000, appeal: 9, danger: 0.02, endangered: true },
  gorilla: { name: "Gorillas", emoji: "🦍", price: 110000, upkeep: 60000, appeal: 9, endangered: true },
  rhino: { name: "Rhinos", emoji: "🦏", price: 125000, upkeep: 70000, appeal: 8, endangered: true, danger: 0.01 },
  elephant: { name: "Elephants", emoji: "🐘", price: 175000, upkeep: 180000, appeal: 10, endangered: true, danger: 0.01 },
  polarbear: { name: "Polar bears", emoji: "🐻‍❄️", price: 150000, upkeep: 120000, appeal: 10, endangered: true, danger: 0.02 },
  panda: { name: "Giant pandas (on loan)", emoji: "🐼", price: 250000, upkeep: 500000, appeal: 16, endangered: true, accredited: true },
};
const ZooPrices = { low: ["Low ($12)", 12, 1.25], standard: ["Standard ($20)", 20, 1], high: ["High ($32)", 32, 0.75] };
const ZooMarketing = { none: ["None", 0, 0.9], local: ["Local", 40000, 1.05], regional: ["Regional", 150000, 1.2] };
const ZOO_PRICE = 3000000;

const zooAnimalCount = (z) => Object.values(z.exhibits).reduce((s, n) => s + n, 0);
const keepersNeeded = (z) => Math.max(2, Math.ceil(zooAnimalCount(z) / 4));
const zooAppeal = (z) => Object.entries(z.exhibits).reduce((s, [id, n]) => s + ZooAnimals[id].appeal * (1 + 0.15 * Math.max(0, n - 2)), 0);
function zooValue(z) {
  const animals = Object.entries(z.exhibits).reduce((s, [id, n]) => s + ZooAnimals[id].price * n, 0);
  return Math.round((1500000 + animals * 0.6 + Math.max(0, z.last?.profit || 0) * 4 + z.reputation * 20000) / 1000) * 1000;
}

function buyZoo(L) {
  if (L.zoo) return out(L, "Zoo", "I already own a zoo.", false);
  if (L.age < 18 || L.money < ZOO_PRICE) return out(L, "Zoo", `A small struggling zoo is for sale for ${formatMoney(ZOO_PRICE)}.`, false);
  L.money -= ZOO_PRICE;
  L.zoo = { name: `${L.city} Zoo`, exhibits: { flamingo: 4, zebra: 3, kangaroo: 3 }, habitat: 45, keepers: 4, price: "standard", marketing: "local", reputation: 35, conservation: 5, accredited: false, last: null, years: 0 };
  requestName(L, "zoo", "zoo");
  adjust(L, { happiness: 12 });
  return out(L, "Zoo", "🦒 I bought a small, run-down zoo with flamingos, zebras and kangaroos. The habitats need work.");
}

function zooAction(L, action, arg) {
  const z = L.zoo;
  if (!z) return out(L, "Zoo", "I don't own a zoo.", false);
  const onceYear = ["habitat", "breed", "conservation", "accredit"];
  if (onceYear.includes(action)) {
    if (usedThisYear(L, `zoo-${action}`)) return out(L, z.name, "I already did that this year.", false);
  }
  let m;
  switch (action) {
    case "add": {
      const a = ZooAnimals[arg];
      if (a.accredited && !z.accredited) return out(L, z.name, "Only accredited zoos are trusted with giant pandas.", false);
      const cost = a.price * 2;
      if (L.money < cost) return out(L, z.name, `A pair of ${a.name.toLowerCase()} costs ${formatMoney(cost)}.`, false);
      L.money -= cost; z.exhibits[arg] = (z.exhibits[arg] || 0) + 2;
      m = `${a.emoji} ${z.exhibits[arg] === 2 ? `I opened a new ${a.name.toLowerCase()} exhibit` : `I added two more ${a.name.toLowerCase()}`} at ${z.name} for ${formatMoney(cost)}. They'll cost about ${formatMoney(a.upkeep * 2)} a year to care for.`;
      break;
    }
    case "remove": {
      const a = ZooAnimals[arg]; const n = z.exhibits[arg] || 0;
      if (!n) return out(L, z.name, "We don't have those.", false);
      const back = Math.round(a.price * n * 0.5);
      delete z.exhibits[arg]; L.money += back;
      m = `🚚 I transferred our ${a.name.toLowerCase()} to another zoo and recovered ${formatMoney(back)}.`;
      break;
    }
    case "hire": z.keepers += 1; m = `🧑‍🌾 I hired another zookeeper. We have ${z.keepers} (${keepersNeeded(z)} needed).`; return out(L, z.name, m, false);
    case "fire":
      if (z.keepers <= 1) return out(L, z.name, "Someone has to feed the animals.", false);
      z.keepers -= 1; m = `I let a zookeeper go. We have ${z.keepers} (${keepersNeeded(z)} needed).`; return out(L, z.name, m, false);
    case "habitat": {
      const cost = Object.keys(z.exhibits).length * 60000;
      if (L.money < cost) return out(L, z.name, `Upgrading every habitat costs ${formatMoney(cost)}.`, false);
      markUsed(L, "zoo-habitat");
      L.money -= cost; z.habitat = Math.min(100, z.habitat + 30);
      m = `🌿 I upgraded the habitats at ${z.name} for ${formatMoney(cost)}: more space, enrichment and shade. (Habitat ${z.habitat}%)`;
      break;
    }
    case "breed": {
      const a = ZooAnimals[arg];
      if ((z.exhibits[arg] || 0) < 2) return out(L, z.name, "We need at least a pair.", false);
      markUsed(L, "zoo-breed");
      if (roll(0.35 + z.habitat / 250)) {
        const babies = a.endangered ? 1 : rnd(1, 2);
        z.exhibits[arg] += babies; z.reputation = Math.min(100, z.reputation + (a.endangered ? 6 : 3)); if (a.endangered) z.conservation = Math.min(100, z.conservation + 10);
        m = `🍼 Our ${a.name.toLowerCase()} had ${babies === 1 ? "a baby" : "babies"}! ${a.endangered ? "A win for an endangered species, and" : ""} visitors are lining up to see.`;
      } else m = `Our breeding program for ${a.name.toLowerCase()} had no success this year.`;
      break;
    }
    case "conservation":
      if (L.money < 150000) return out(L, z.name, "Funding a field project costs $150,000.", false);
      markUsed(L, "zoo-conservation");
      L.money -= 150000; z.conservation = Math.min(100, z.conservation + 12); z.reputation = Math.min(100, z.reputation + 3); L.karma += 3;
      m = `🌍 ${z.name} funded a ${pick(["rhino anti-poaching patrol", "coral reef restoration", "rainforest corridor", "snow leopard tracking study"])} in the wild. ($150,000)`;
      break;
    case "accredit": {
      markUsed(L, "zoo-accredit");
      const missing = [];
      if (z.conservation < 40) missing.push("conservation 40+");
      if (z.habitat < 70) missing.push("habitats 70%+");
      if (z.keepers < keepersNeeded(z)) missing.push("enough keepers");
      L.money -= 50000;
      if (missing.length) { m = `📋 The accreditation board turned us down. Still needed: ${missing.join(", ")}. ($50,000 fee)`; break; }
      z.accredited = true; z.reputation = Math.min(100, z.reputation + 15);
      m = `🏅 ${z.name} is now an accredited zoo. Grants, better animals, and giant pandas are within reach.`;
      break;
    }
    case "sell": {
      const price = zooValue(z);
      L.money += price; L.zoo = null;
      return out(L, "Zoo", `🤝 I sold ${z.name} for ${formatMoney(price)}.`);
    }
  }
  return out(L, z.name, m);
}

function setZoo(L, field, value) { if (L.zoo) L.zoo[field] = value; }

function progressZoo(L) {
  normalizeZoo(L);
  const z = L.zoo;
  if (!z) return;
  z.years += 1;
  const short = z.keepers < keepersNeeded(z);
  const econ = clamp(1 + (L.housing ? L.housing.last : 0), 0.8, 1.1);
  const pr = ZooPrices[z.price];
  const mk = ZooMarketing[z.marketing];
  const visitors = Math.round((10000 + 15000 * Math.sqrt(zooAppeal(z))) * (0.6 + z.reputation / 125) * pr[2] * mk[2] * econ * (z.accredited ? 1.15 : 1) * rndf(0.9, 1.1));
  const revenue = visitors * (pr[1] + 5) + (z.accredited ? 150000 : 0);
  const care = Object.entries(z.exhibits).reduce((s, [id, n]) => s + ZooAnimals[id].upkeep * n, 0);
  const costs = { keepers: z.keepers * 42000, animals: care, habitats: Object.keys(z.exhibits).length * 12000, marketing: mk[1], operations: 1000000 };
  const total = Object.values(costs).reduce((s, x) => s + x, 0);
  const profit = revenue - total;
  L.money += profit;
  z.last = { visitors, revenue, costs, profit };
  z.habitat = clamp(z.habitat - rnd(3, 6) - (short ? 3 : 0), 0, 100);
  const target = z.habitat * 0.6 + Math.min(30, Object.keys(z.exhibits).length * 3) + (z.accredited ? 10 : 0) - (short ? 15 : 0);
  z.reputation = clamp(Math.round(z.reputation + (target - z.reputation) * 0.25 + rnd(-3, 3)), 0, 100);
  const endangered = Object.keys(z.exhibits).filter((id) => ZooAnimals[id].endangered).length;
  z.conservation = clamp(z.conservation + endangered - 2, 0, 100);
  record(L, `🦒 ${z.name} welcomed ${formatCount(visitors)} visitors and ${profit >= 0 ? `made ${formatMoney(profit)}` : `lost ${formatMoney(-profit)}`}.`);
  if (z.accredited && (z.habitat < 50 || short)) {
    z.accredited = false; z.reputation = Math.max(0, z.reputation - 10);
    if (z.exhibits.panda) { delete z.exhibits.panda; record(L, "🐼 The pandas were recalled when we lost our accreditation."); }
    notify(L, "📋", "Accreditation Lost", `📋 ${z.name} lost its accreditation after an inspection found ${short ? "too few keepers" : "run-down habitats"}.`);
  }
  if (short && roll(0.3)) { z.reputation = Math.max(0, z.reputation - 8); record(L, `📰 A newspaper reported overworked keepers and neglected animals at ${z.name}.`); }
  for (const [id, n] of Object.entries(z.exhibits)) {
    const a = ZooAnimals[id];
    if (!a.danger || !roll(a.danger * (z.habitat < 50 ? 4 : 1) * Math.min(3, n / 2))) continue;
    z.reputation = Math.max(0, z.reputation - 15);
    let msg = `${a.emoji} One of our ${a.name.toLowerCase()} escaped its enclosure and the zoo had to be evacuated.`;
    if (roll(0.3)) { L.money -= 250000; msg += " A visitor was hurt and sued for $250,000."; }
    notify(L, a.emoji, "Escape!", msg);
    break;
  }
}

// Old saves: the previous zoo format had only an animal count.
function normalizeZoo(L) {
  const z = L.zoo;
  if (!z || z.exhibits) return;
  L.zoo = { name: z.name, exhibits: { flamingo: 4, zebra: 4, kangaroo: Math.max(2, (z.animals || 12) - 8) }, habitat: 50, keepers: 4, price: "standard", marketing: "local", reputation: z.reputation ?? 40, conservation: 5, accredited: false, last: null, years: 0 };
}
