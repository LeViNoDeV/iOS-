// LifeSim expansion packs, in the spirit of BitLife's DLC:
// Boss Mode (businesses), Royalty, Organized Crime, Pets & Zoo, Fame, and Prison life.
// God Mode and the Time Machine live in godmode.js.
"use strict";

// MARK: - Naming (children, pets, businesses, zoos)

/// Queues a "name it" prompt for something new in your life.
function requestName(L, target, id) {
  L.toName = L.toName || [];
  if (!L.toName.some((t) => t.target === target && t.id === id)) L.toName.push({ target, id });
}

function nameTargetLabel(L, item) {
  if (item.target === "rel") {
    const p = findRel(L, item.id);
    if (!p) return null;
    if (p.species) return { title: `Name your ${p.species.toLowerCase()}`, current: p.firstName, emoji: relEmoji(p) };
    return { title: p.age === 0 ? `Name your baby ${p.gender === "male" ? "boy" : "girl"}` : `Name your new ${relTitle(p).toLowerCase()}`, current: p.firstName, emoji: relEmoji(p) };
  }
  if (item.target === "business") { const b = (L.businesses || []).find((x) => x.id === item.id); return b ? { title: "Name your business", current: b.name, emoji: businessType(b).emoji } : null; }
  if (item.target === "zoo") return L.zoo ? { title: "Name your zoo", current: L.zoo.name, emoji: "🦒" } : null;
  return null;
}

/// Renames something and updates this year's story so it uses the new name.
function applyName(L, item, name) {
  name = String(name || "").trim().slice(0, 40);
  if (!name) return;
  let old = null;
  if (item.target === "rel") { const p = findRel(L, item.id); if (p) { old = p.firstName; p.firstName = name; } }
  if (item.target === "business") { const b = (L.businesses || []).find((x) => x.id === item.id); if (b) { old = b.name; b.name = name; } }
  if (item.target === "zoo" && L.zoo) { old = L.zoo.name; L.zoo.name = name; }
  if (!old || old === name) return;
  const swap = (s) => s.split(old).join(name);
  for (const y of L.log.slice(-2)) y.entries = y.entries.map(swap);
  for (const p of L.popups || []) p.message = swap(p.message);
  return swap;
}

function randomNameFor(L, item) {
  if (item.target === "rel") { const p = findRel(L, item.id); if (p) return p.species ? pick(Names.petNames) : Names.first(p.gender); }
  if (item.target === "business") { const b = (L.businesses || []).find((x) => x.id === item.id); if (b) return `${pick(["Golden", "Blue Sky", "Apex", "Urban", "Lucky", "North Star", "Red Fox"])} ${businessType(b).name}`; }
  if (item.target === "zoo") return `${pick(["Wild", "Safari", "Kingdom", "Savanna"])} ${pick(["Park", "Zoo", "World"])}`;
  return "";
}

// Once-a-year limits for pack actions, keyed by pack.
function usedThisYear(L, key) {
  L.packUsed = L.packUsed || {};
  return L.packUsed[key] === L.age;
}
function markUsed(L, key) {
  L.packUsed = L.packUsed || {};
  L.packUsed[key] = L.age;
}

// MARK: - Boss Mode: businesses

const BusinessTypes = [
  { id: "coffee", name: "Coffee Shop", emoji: "☕", cost: 80000, revenue: 140000, margin: 0.16 },
  { id: "restaurant", name: "Restaurant", emoji: "🍽️", cost: 250000, revenue: 450000, margin: 0.12 },
  { id: "gym", name: "Gym", emoji: "🏋️", cost: 150000, revenue: 220000, margin: 0.18 },
  { id: "clothing", name: "Clothing Brand", emoji: "👕", cost: 120000, revenue: 260000, margin: 0.2 },
  { id: "tech", name: "Tech Startup", emoji: "💻", cost: 300000, revenue: 180000, margin: 0.05, volatile: true },
  { id: "label", name: "Record Label", emoji: "💿", cost: 400000, revenue: 520000, margin: 0.14 },
  { id: "construction", name: "Construction Company", emoji: "🏗️", cost: 500000, revenue: 1300000, margin: 0.09 },
  { id: "dealership", name: "Car Dealership", emoji: "🚘", cost: 1000000, revenue: 3200000, margin: 0.05 },
];
const businessType = (b) => BusinessTypes.find((t) => t.id === b.typeId);

function startBusiness(L, typeId) {
  const t = BusinessTypes.find((x) => x.id === typeId);
  if (L.age < 18) return out(L, "Boss Mode", "I'm too young to start a business.", false);
  if (L.money < t.cost) return out(L, "Boss Mode", `I need ${formatMoney(t.cost)} to start a ${t.name.toLowerCase()}.`, false);
  L.money -= t.cost;
  const b = { id: uid(), typeId, name: `${L.lastName} ${t.name}`, founded: L.age, employees: 3, reputation: 50, stage: 1, value: t.cost, lastProfit: 0, isPublic: false, losingYears: 0 };
  L.businesses = (L.businesses || []).concat([b]);
  requestName(L, "business", b.id);
  adjust(L, { happiness: 8 });
  return out(L, "Boss Mode", `${t.emoji} I opened my own ${t.name.toLowerCase()}: ${b.name}!`);
}

function progressBusinesses(L) {
  for (const b of [...(L.businesses || [])]) {
    const t = businessType(b);
    const repFactor = 0.5 + b.reputation / 100;
    const staffFactor = 0.7 + 0.12 * Math.log2(b.employees + 1);
    const revenue = Math.trunc(t.revenue * b.stage * repFactor * staffFactor * rndf(0.75, 1.25));
    const margin = t.volatile ? rndf(-0.4, 0.6) : t.margin + rndf(-0.06, 0.06);
    const profit = Math.trunc(revenue * margin - b.employees * 2000);
    b.lastProfit = profit;
    L.money += profit > 0 ? Math.trunc(profit * 0.75) : profit;
    b.reputation = clamp(b.reputation + Math.round((50 - b.reputation) * 0.1) + rnd(-4, 4), 0, 100);
    b.value = Math.max(0, Math.trunc(revenue * 1.2 + Math.max(0, profit) * 4));
    if (t.volatile && b.reputation > 60 && b.stage < 12 && roll(0.15)) {
      b.stage = +Math.min(12, b.stage * 1.4).toFixed(2);
      record(L, `🚀 ${b.name} is blowing up! Users are pouring in.`);
    } else if (t.volatile && b.stage > 2 && roll(0.08)) {
      b.stage = +(b.stage * 0.7).toFixed(2);
      record(L, `📉 ${b.name}'s users are leaving for a competitor.`);
    }
    b.losingYears = profit < 0 ? b.losingYears + 1 : 0;
    if (b.losingYears >= 3 && L.money < 0) {
      L.businesses = L.businesses.filter((x) => x.id !== b.id);
      notify(L, "📉", "Bankrupt", `📉 ${b.name} went bankrupt after three years of losses.`);
      adjust(L, { happiness: -15 });
    }
  }
}

function businessAction(L, id, action) {
  const b = (L.businesses || []).find((x) => x.id === id);
  if (!b) return out(L, "Boss Mode", "That business no longer exists.", false);
  const t = businessType(b);
  const key = `biz-${id}-${action}`;
  if (["marketing", "launch", "expand"].includes(action) && usedThisYear(L, key)) return out(L, b.name, "I already did that this year.", false);
  let m;
  switch (action) {
    case "hire": L.money -= 5000; b.employees += 1; b.reputation = Math.min(100, b.reputation + 1); m = `👔 I hired a new employee at ${b.name}. We have ${b.employees} staff now.`; break;
    case "layoff":
      if (b.employees <= 1) return out(L, b.name, "I can't run it with nobody.", false);
      b.employees -= 1; b.reputation = Math.max(0, b.reputation - 4); L.karma -= 1; m = `✂️ I laid off an employee at ${b.name}. Morale took a hit.`; break;
    case "marketing": {
      markUsed(L, key);
      const cost = Math.trunc(t.revenue * b.stage * 0.08);
      L.money -= cost;
      const gain = rnd(4, 14);
      b.reputation = Math.min(100, b.reputation + gain);
      m = `📣 I spent ${formatMoney(cost)} on an ad campaign for ${b.name}. Reputation +${gain}.`; break;
    }
    case "launch": {
      markUsed(L, key);
      const cost = Math.trunc(t.revenue * b.stage * 0.15);
      L.money -= cost;
      if (roll(0.35 + b.reputation / 250)) { b.stage = +(b.stage + 0.3).toFixed(2); b.reputation = Math.min(100, b.reputation + 10); m = `🎉 ${b.name}'s new product was a hit!`; }
      else { b.reputation = Math.max(0, b.reputation - 6); m = `🫠 ${b.name}'s new product flopped. That cost ${formatMoney(cost)}.`; }
      break;
    }
    case "expand": {
      markUsed(L, key);
      const cost = Math.trunc(t.cost * b.stage);
      if (L.money < cost) return out(L, b.name, `Expanding costs ${formatMoney(cost)}.`, false);
      L.money -= cost; b.stage = +(b.stage + 1).toFixed(2); b.employees += 3;
      m = `🏢 I expanded ${b.name} with a new location.`; break;
    }
    case "ipo":
      if (b.isPublic || b.value < 5000000) return out(L, b.name, "The company isn't big enough to go public yet ($5M value).", false);
      b.isPublic = true;
      L.money += Math.trunc(b.value * 0.3);
      bump(L, "ipos");
      m = `🔔 ${b.name} went public! I cashed out ${formatMoney(Math.trunc(b.value * 0.3))} in shares.`; break;
    case "sell":
      L.businesses = L.businesses.filter((x) => x.id !== id);
      L.money += b.value;
      m = `🤝 I sold ${b.name} for ${formatMoney(b.value)}.`; break;
    case "close":
      L.businesses = L.businesses.filter((x) => x.id !== id);
      adjust(L, { happiness: -5 });
      m = `🔒 I shut down ${b.name}.`; break;
  }
  return out(L, b.name, m);
}

// MARK: - Royalty

const Monarchies = [
  ["United Kingdom", "London"], ["Spain", "Madrid"], ["Netherlands", "Amsterdam"], ["Belgium", "Brussels"], ["Norway", "Oslo"],
  ["Sweden", "Stockholm"], ["Denmark", "Copenhagen"], ["Monaco", "Monaco"], ["Liechtenstein", "Vaduz"], ["Luxembourg", "Luxembourg City"],
  ["Japan", "Tokyo"], ["Thailand", "Bangkok"], ["Saudi Arabia", "Riyadh"], ["Morocco", "Rabat"], ["Jordan", "Amman"],
  ["Bhutan", "Thimphu"], ["Brunei", "Bandar Seri Begawan"],
];

const royalTitle = (L) => {
  if (!L.royal) return null;
  const m = L.gender === "male";
  return L.royal.isMonarch ? (m ? "King" : "Queen") : (m ? "Prince" : "Princess");
};

function newRoyalLife(country, first, gender) {
  const L = newLife(first, null, gender);
  const place = Monarchies.find((m) => m[0] === country);
  L.city = place[1]; L.country = place[0];
  const ruler = L.relationships.find((p) => p.kind === (roll(0.5) ? "father" : "mother")) || L.relationships[0];
  ruler.monarch = true;
  for (const p of L.relationships) if (isParent(p.kind)) p.money = rnd(20000000, 200000000);
  const olderSiblings = L.relationships.filter((p) => p.kind === "sibling").length;
  L.royal = { country: place[0], isMonarch: false, popularity: 60, line: 1 + olderSiblings, renounced: false };
  L.log[0].entries[0] = `👑 I was born into the royal family of ${place[0]}. My ${ruler.kind === "father" ? "father" : "mother"}, ${relName(ruler)}, is the reigning ${ruler.gender === "male" ? "King" : "Queen"}. I am ${ordinal(L.royal.line)} in line to the throne.`;
  return L;
}

const ordinal = (n) => `${n}${n % 10 === 1 && n % 100 !== 11 ? "st" : n % 10 === 2 && n % 100 !== 12 ? "nd" : n % 10 === 3 && n % 100 !== 13 ? "rd" : "th"}`;

function progressRoyalty(L) {
  const r = L.royal;
  if (!r || r.renounced) return;
  if (L.age >= 18) {
    const allowance = r.isMonarch ? rnd(3000000, 8000000) : rnd(200000, 900000);
    L.money += allowance;
  }
  r.popularity = clamp(r.popularity + rnd(-4, 3), 0, 100);
  if (!r.isMonarch) {
    const ruler = L.relationships.find((p) => p.monarch);
    if (!ruler || !ruler.isAlive) {
      if (ruler) ruler.monarch = false;
      if (r.line <= 1) {
        r.isMonarch = true;
        r.popularity = Math.max(r.popularity, 55);
        notify(L, "👑", "Long Live the Monarch!", `👑 I was crowned ${royalTitle(L)} of ${r.country}!`);
        adjust(L, { happiness: 20 });
      } else {
        r.line -= 1;
        const heir = L.relationships.find((p) => p.kind === "sibling" && p.isAlive);
        if (heir) { heir.monarch = true; record(L, `👑 My ${relTitle(heir).toLowerCase()} ${heir.firstName} was crowned. I'm now ${ordinal(r.line)} in line.`); }
      }
    }
  } else if (r.popularity < 15 && roll(0.4)) {
    r.isMonarch = false;
    r.renounced = true;
    notify(L, "🔥", "Overthrown", `🔥 The people rose up and overthrew me. I fled ${r.country} in disgrace.`);
    adjust(L, { happiness: -30 });
  }
}

const RoyalActions = {
  event: ["🎩", "Attend a Royal Event", "Smile and wave"],
  charity: ["🎗️", "Royal Charity Work", "Good for your image"],
  tour: ["✈️", "Go on a Royal Tour", "Visit another country"],
  interview: ["🎙️", "Give an Interview", "Risky but popular"],
  party: ["🍾", "Party with Commoners", "Scandal risk"],
  speech: ["📜", "Address the Nation", "Monarchs only"],
  raiseTaxes: ["💰", "Raise Taxes", "More money, less love"],
  lowerTaxes: ["🎉", "Lower Taxes", "The people cheer"],
  holiday: ["🎆", "Declare a National Holiday", "Everyone loves a day off"],
  abdicate: ["🚪", "Abdicate the Throne", "Pass the crown on"],
  renounce: ["❌", "Renounce Your Title", "Become a commoner"],
};

function royalActionsFor(L) {
  const r = L.royal;
  if (!r || r.renounced) return [];
  const list = ["event", "charity"];
  if (L.age >= 16) list.push("tour", "interview");
  if (L.age >= 18) list.push("party");
  if (r.isMonarch) list.push("speech", "raiseTaxes", "lowerTaxes", "holiday", "abdicate");
  else if (L.age >= 18) list.push("renounce");
  return list;
}

function royalAction(L, action) {
  const r = L.royal;
  if (!r || r.renounced) return out(L, "Royalty", "I'm not royalty.", false);
  const [emoji, title] = RoyalActions[action];
  if (!["abdicate", "renounce"].includes(action)) {
    if (usedThisYear(L, `royal-${action}`)) return out(L, title, "I already did that this year.", false);
    markUsed(L, `royal-${action}`);
  }
  const pop = (d) => { r.popularity = clamp(r.popularity + d, 0, 100); };
  let m;
  switch (action) {
    case "event": pop(rnd(2, 6)); adjust(L, { happiness: 2 }); m = `${emoji} I attended ${pick(["a horse race", "a ship christening", "a museum opening", "the royal garden party"])} and waved to the crowds.`; break;
    case "charity": pop(rnd(4, 9)); L.karma += 4; m = `${emoji} I visited ${pick(["a children's hospital", "a homeless shelter", "flood victims", "a veterans' home"])}. The press loved it.`; break;
    case "tour": { pop(rnd(3, 8)); const c = pick(WORLD); adjust(L, { happiness: 6 }); m = `${emoji} I went on a royal tour of ${c[0]} and met the leaders in ${c[1][0]}.`; break; }
    case "interview":
      if (roll(0.65)) { pop(rnd(5, 10)); m = `${emoji} My TV interview was a hit. The public adores me.`; }
      else { pop(-rnd(8, 15)); m = `${emoji} I said something out of touch in an interview. The tabloids are furious.`; }
      break;
    case "party":
      adjust(L, { happiness: 8 }); bump(L, "parties");
      if (roll(0.4)) { pop(-rnd(8, 16)); m = `${emoji} Photos of me partying leaked to the tabloids. Scandal!`; }
      else m = `${emoji} I snuck out to party with commoners and nobody recognized me.`;
      break;
    case "speech": pop(rnd(-3, 9)); m = `${emoji} I addressed the nation on television.`; break;
    case "raiseTaxes": { const take = rnd(2000000, 10000000); L.money += take; pop(-rnd(10, 20)); m = `${emoji} I raised taxes and pocketed ${formatMoney(take)}. The people are grumbling.`; break; }
    case "lowerTaxes": L.money -= rnd(500000, 2000000); pop(rnd(8, 15)); m = `${emoji} I lowered taxes. The people are celebrating in the streets.`; break;
    case "holiday": pop(rnd(5, 12)); m = `${emoji} I declared ${pick(["National Pancake Day", "a royal birthday holiday", "Corgi Appreciation Day", "a long weekend"])}. Everyone got a day off.`; break;
    case "abdicate": r.isMonarch = false; r.line = 99; pop(-5); adjust(L, { happiness: 5 }); m = `${emoji} I abdicated the throne and handed the crown to my heir.`; break;
    case "renounce": r.renounced = true; adjust(L, { happiness: 3 }); m = `${emoji} I renounced my royal title. I'm just a regular person now.`; break;
  }
  return out(L, title, m);
}

// MARK: - Organized Crime

const CrimeFamilies = [
  { id: "bianchi", name: "The Bianchi Family", emoji: "🍝", style: "Italian mafia" },
  { id: "volkov", name: "The Volkov Bratva", emoji: "🐻", style: "Russian mob" },
  { id: "kuroda", name: "The Kuroda-gumi", emoji: "🐉", style: "Yakuza" },
  { id: "halcones", name: "Los Halcones", emoji: "🦅", style: "Cartel" },
  { id: "orourke", name: "The O'Rourke Crew", emoji: "☘️", style: "Irish mob" },
];
const MobRanks = ["Associate", "Soldier", "Capo", "Underboss", "Boss"];
const mobRespectNeeded = [0, 25, 50, 72, 90];
const mobFamily = (L) => (L.mob ? CrimeFamilies.find((f) => f.id === L.mob.familyId) : null);

function joinMob(L, familyId) {
  if (L.age < 18 || inPrison(L)) return out(L, "Organized Crime", "That's not possible right now.", false);
  const f = CrimeFamilies.find((x) => x.id === familyId);
  if (usedThisYear(L, "mob-join")) return out(L, f.name, "I already tried to join a family this year.", false);
  markUsed(L, "mob-join");
  const chance = 0.25 + Math.min(0.4, L.criminalRecord.length * 0.1) + (L.karma < 40 ? 0.2 : 0);
  if (!roll(chance)) return out(L, f.name, `${f.emoji} ${f.name} said they don't trust me yet. Maybe if I had a record...`);
  L.mob = { familyId, rank: 0, respect: 10, heat: 10, used: {} };
  L.karma -= 10;
  return out(L, f.name, `${f.emoji} I was initiated into ${f.name} as an Associate. There's no going back.`);
}

const MobActions = {
  protection: ["💼", "Collect Protection Money"],
  smuggle: ["🚢", "Smuggle a Shipment"],
  heist: ["💎", "Pull Off a Heist"],
  hit: ["🎯", "Carry Out a Hit"],
  bribe: ["👮", "Bribe a Cop"],
  lieLow: ["🕶️", "Lie Low"],
  promote: ["🪜", "Ask the Boss for a Promotion"],
  leave: ["🚪", "Leave the Family"],
  snitch: ["🐀", "Become an Informant"],
};

function mobAction(L, action) {
  const mob = L.mob;
  if (!mob) return out(L, "Organized Crime", "I'm not in a crime family.", false);
  const f = mobFamily(L);
  const [emoji, title] = MobActions[action];
  const once = ["protection", "smuggle", "heist", "hit", "bribe", "lieLow", "promote"];
  if (once.includes(action)) { if (usedThisYear(L, `mob-${action}`)) return out(L, title, "I already did that this year.", false); markUsed(L, `mob-${action}`); }
  const lvl = mob.rank + 1;
  const respect = (d) => { mob.respect = clamp(mob.respect + d, 0, 100); };
  const heat = (d) => { mob.heat = clamp(mob.heat + d, 0, 100); };
  const arrest = (years, why) => { L.criminalRecord.push(why); sendToPrison(L, years); return ` I was arrested and sentenced to ${plural(L.prisonYearsLeft, "year")}.`; };
  L.karma -= action === "bribe" || action === "lieLow" ? 0 : 3;
  bump(L, "crimes");
  let m;
  switch (action) {
    case "protection": { const cash = rnd(5000, 30000) * lvl; L.money += cash; respect(3); heat(5); m = `${emoji} I collected ${formatMoney(cash)} in protection money from local shops.`; break; }
    case "smuggle":
      if (roll(0.72)) { const cash = rnd(20000, 120000) * lvl; L.money += cash; respect(6); heat(8); m = `${emoji} I smuggled a shipment past customs and earned ${formatMoney(cash)}.`; }
      else { heat(15); respect(-3); m = `${emoji} Customs seized the shipment.`; if (roll(0.35)) m += arrest(rnd(2, 6), "Smuggling"); }
      break;
    case "heist":
      if (roll(0.5)) { const cash = rnd(100000, 1500000); L.money += cash; respect(12); heat(22); m = `${emoji} We pulled off ${pick(["an armored-truck job", "a jewelry store heist", "a casino vault heist", "an art museum heist"])} and my cut was ${formatMoney(cash)}!`; }
      else if (roll(0.5)) m = `${emoji} The heist went wrong.` + arrest(rnd(5, 15), "Armed Robbery");
      else { adjust(L, { health: -20 }); respect(-5); m = `${emoji} The heist went wrong and I was hurt getting away.`; }
      break;
    case "hit":
      if (mob.rank < 1) return out(L, title, "Associates don't get trusted with that kind of job.", false);
      L.karma -= 25; bump(L, "murders");
      if (roll(0.05)) { die(L, "a mob job gone wrong"); return out(L, title, `${emoji} The target was waiting for me.`); }
      if (roll(0.15)) { m = `${emoji} I carried out the job, but the police were onto me.` + arrest(rnd(25, 50), "Murder"); break; }
      respect(15); heat(25); m = `${emoji} I took care of a rival for the family. Nobody will find him.`; break;
    case "bribe": { const cost = 20000 * lvl; L.money -= cost; heat(-25); m = `${emoji} I paid a detective ${formatMoney(cost)} to look the other way.`; break; }
    case "lieLow": heat(-15); respect(-2); adjust(L, { happiness: 2 }); m = `${emoji} I laid low for a while and stayed out of trouble.`; break;
    case "promote":
      if (mob.rank >= MobRanks.length - 1) return out(L, title, "I'm already the Boss.", false);
      if (mob.respect >= mobRespectNeeded[mob.rank + 1]) {
        mob.rank += 1; L.money += 50000 * mob.rank; adjust(L, { happiness: 10 });
        m = `${emoji} I was made ${MobRanks[mob.rank]} of ${f.name}!`;
      } else { respect(-3); m = `${emoji} The boss said I haven't earned it yet. (Respect needed: ${mobRespectNeeded[mob.rank + 1]}.)`; }
      break;
    case "leave":
      L.mob = null;
      if (roll(0.4)) m = `${emoji} The family let me walk away. I'm out.`;
      else if (roll(0.85)) { adjust(L, { health: -30, happiness: -10 }); m = `${emoji} They let me leave, but not before breaking my legs as a reminder.`; }
      else { die(L, "betraying the mob"); m = `${emoji} You don't just leave ${f.name}.`; }
      break;
    case "snitch": {
      L.mob = null; L.karma += 15;
      const c = pick(WORLD); L.country = c[0]; L.city = pick(c[1]);
      L.criminalRecord = [];
      m = `${emoji} I testified against ${f.name}. The FBI gave me a new identity and moved me to ${L.city}, ${L.country}. My record was wiped.`;
      L.snitched = true;
      break;
    }
  }
  return out(L, title, m);
}

function progressMob(L) {
  if (L.snitched && !L.mob && roll(0.03)) { die(L, "mob revenge for snitching"); return; }
  const mob = L.mob;
  if (!mob || inPrison(L)) return;
  if (mob.rank >= 2) { const tribute = mob.rank * mob.rank * rnd(15000, 40000); L.money += tribute; record(L, `💰 My crew paid me ${formatMoney(tribute)} in tribute.`); }
  mob.heat = clamp(mob.heat - 5, 0, 100);
  if (roll(mob.heat / 350)) {
    L.criminalRecord.push("Racketeering");
    sendToPrison(L, rnd(3, 12));
    notify(L, "🚔", "FBI Raid", `🚔 The FBI raided my home. I was convicted of racketeering and sentenced to ${plural(L.prisonYearsLeft, "year")}.`);
    return;
  }
  if (roll(0.05 + mob.rank * 0.01)) {
    if (roll(0.15)) { die(L, "a rival mob ambush"); return; }
    adjust(L, { health: -rnd(10, 25) });
    notify(L, "💥", "Ambush", "💥 A rival family ambushed me. I survived, barely.");
  }
}

// MARK: - Pets & Zoo

const ExoticPets = [
  { species: "Tiger", emoji: "🐯", price: 15000, danger: 0.05 }, { species: "Lion", emoji: "🦁", price: 30000, danger: 0.05 },
  { species: "Monkey", emoji: "🐒", price: 5000, danger: 0.01 }, { species: "Snake", emoji: "🐍", price: 800, danger: 0.02 },
  { species: "Wolf", emoji: "🐺", price: 6000, danger: 0.03 }, { species: "Alligator", emoji: "🐊", price: 9000, danger: 0.05 },
  { species: "Horse", emoji: "🐴", price: 8000, danger: 0 }, { species: "Pig", emoji: "🐷", price: 600, danger: 0 },
  { species: "Tortoise", emoji: "🐢", price: 300, danger: 0 }, { species: "Lizard", emoji: "🦎", price: 250, danger: 0 },
  { species: "Fox", emoji: "🦊", price: 2500, danger: 0.01 }, { species: "Penguin", emoji: "🐧", price: 12000, danger: 0 },
  { species: "Owl", emoji: "🦉", price: 1500, danger: 0 }, { species: "Peacock", emoji: "🦚", price: 2000, danger: 0 },
];
for (const p of ExoticPets) petEmoji[p.species] = p.emoji;

function buyExoticPet(L, species) {
  const p = ExoticPets.find((x) => x.species === species);
  if (L.age < 18) return out(L, "Exotic Pets", "I'm too young to buy an exotic pet.", false);
  if (L.money < p.price) return out(L, "Exotic Pets", `A ${species.toLowerCase()} costs ${formatMoney(p.price)}.`, false);
  L.money -= p.price;
  const pet = { ...makePerson("pet", rnd(1, 4), { noTrait: true, bond: 55 }), lastName: "", firstName: pick(Names.petNames), species, occupation: null, salary: 0, lastContact: L.age, exotic: true };
  L.relationships.push(pet);
  adjust(L, { happiness: 10 });
  return out(L, "Exotic Pets", `${p.emoji} I bought a ${species.toLowerCase()} named ${pet.firstName}!`);
}

const PetExtraActions = { train: "Train", groom: "Groom", vet: "Take to the Vet ($200)", show: "Enter a Pet Show", rename: "✏️ Rename" };

function petAction(L, id, action) {
  const p = findRel(L, id);
  if (!p) return out(L, "Pets", "That pet is gone.", false);
  touch(L, id);
  const key = `pet-${id}-${action}`;
  if (action !== "vet" && usedThisYear(L, key)) return out(L, p.firstName, "We already did that this year.", false);
  markUsed(L, key);
  let m;
  switch (action) {
    case "train":
      if (roll(0.7)) { updateRel(L, id, (x) => { x.bond += rnd(5, 10); x.trained = (x.trained || 0) + 1; }); m = `🦴 ${p.firstName} learned a new trick!`; }
      else { updateRel(L, id, (x) => { x.bond -= 2; }); m = `${p.firstName} refused to learn anything today.`; }
      break;
    case "groom": updateRel(L, id, (x) => { x.bond += rnd(2, 6); x.looks = Math.min(100, x.looks + rnd(3, 8)); }); m = `✂️ I groomed ${p.firstName}. Looking sharp!`; break;
    case "vet": L.money -= 200; updateRel(L, id, (x) => { x.bond += 2; x.age = Math.max(0, x.age - 1); }); m = `🩺 The vet gave ${p.firstName} a clean bill of health.`; break;
    case "show": {
      const score = p.looks / 2 + p.bond / 3 + (p.trained || 0) * 5 + rnd(0, 30);
      if (score > 85) { const prize = rnd(500, 5000); L.money += prize; updateRel(L, id, (x) => { x.bond += 5; }); adjust(L, { happiness: 8 }); m = `🏆 ${p.firstName} won Best in Show! Prize: ${formatMoney(prize)}.`; }
      else m = `🎀 ${p.firstName} didn't place at the pet show, but looked adorable.`;
      break;
    }
  }
  return out(L, p.firstName, remember(L, p, m));
}

function buyZoo(L) {
  if (L.zoo) return out(L, "Zoo", "I already own a zoo.", false);
  if (L.age < 18 || L.money < 2500000) return out(L, "Zoo", "Buying a zoo costs $2,500,000.", false);
  L.money -= 2500000;
  L.zoo = { name: `${L.lastName} Zoo`, animals: 12, reputation: 50 };
  requestName(L, "zoo", "zoo");
  adjust(L, { happiness: 12 });
  return out(L, "Zoo", "🦒 I bought my very own zoo!");
}

function zooAction(L, action) {
  const z = L.zoo;
  if (!z) return out(L, "Zoo", "I don't own a zoo.", false);
  if (usedThisYear(L, `zoo-${action}`) && action !== "sell") return out(L, z.name, "I already did that this year.", false);
  markUsed(L, `zoo-${action}`);
  let m;
  switch (action) {
    case "exhibit": L.money -= 250000; z.animals += 3; z.reputation = Math.min(100, z.reputation + 5); m = `🐘 I opened a new ${pick(["elephant", "giraffe", "gorilla", "panda", "reptile", "aquarium"])} exhibit at ${z.name}.`; break;
    case "marketing": L.money -= 60000; z.reputation = Math.min(100, z.reputation + rnd(4, 10)); m = `📣 I ran an ad campaign for ${z.name}.`; break;
    case "breeding":
      if (roll(0.5)) { z.animals += 2; z.reputation = Math.min(100, z.reputation + 6); m = `🐣 Our breeding program produced adorable babies. Visitors flocked in.`; }
      else m = "🥚 The breeding program had no success this year.";
      break;
    case "sell": { const price = 1500000 + z.animals * 80000 + z.reputation * 20000; L.money += price; L.zoo = null; m = `🤝 I sold ${z.name} for ${formatMoney(price)}.`; break; }
  }
  return out(L, "Zoo", m);
}

function progressPets(L) {
  for (const p of L.relationships) {
    if (!p.isAlive || !p.exotic) continue;
    const ex = ExoticPets.find((x) => x.species === p.species);
    if (ex && ex.danger && roll(ex.danger * (p.bond < 40 ? 2 : 1))) {
      if (roll(0.12)) { die(L, `being attacked by my pet ${p.species.toLowerCase()}`); return; }
      adjust(L, { health: -rnd(10, 30) });
      notify(L, ex.emoji, "Animal Attack", `${ex.emoji} My ${p.species.toLowerCase()} ${p.firstName} attacked me!`);
    }
  }
  const z = L.zoo;
  if (z) {
    const profit = Math.trunc(z.animals * 20000 * (z.reputation / 50) * rndf(0.8, 1.2) - z.animals * 12000);
    L.money += profit;
    z.reputation = clamp(z.reputation + rnd(-3, 3), 0, 100);
    if (roll(0.06)) { z.reputation = Math.max(0, z.reputation - 15); notify(L, "🦍", "Escape!", `🦍 An animal escaped from ${z.name} and made the evening news.`); }
  }
}

// MARK: - Fame

const FameActions = {
  publicist: ["🧑‍💼", "Hire a Publicist", "$50,000 · keeps you in the headlines"],
  interview: ["📺", "Do a TV Interview", "Fame boost, small scandal risk"],
  endorsement: ["🤝", "Sign an Endorsement Deal", "Get paid to promote a brand"],
  productLine: ["🧴", "Launch a Product Line", "Perfume, clothes or sneakers"],
  podcast: ["🎧", "Start a Podcast", "Grow your followers"],
  gala: ["🌟", "Attend a Celebrity Gala", "Rub shoulders with stars"],
  feud: ["🔥", "Start a Public Feud", "Drama sells"],
};

const isCelebrity = (L) => L.fame >= 20 || L.followers >= 50000;

function fameAction(L, action) {
  if (!isCelebrity(L)) return out(L, "Fame", "I'm not famous enough yet.", false);
  const [emoji, title] = FameActions[action];
  if (usedThisYear(L, `fame-${action}`)) return out(L, title, "I already did that this year.", false);
  markUsed(L, `fame-${action}`);
  const fame = (d) => { L.fame = clamp(L.fame + d, 0, 100); };
  let m;
  switch (action) {
    case "publicist": L.money -= 50000; fame(rnd(2, 5)); m = `${emoji} I hired a publicist. My name is everywhere.`; break;
    case "interview":
      if (roll(0.8)) { fame(rnd(1, 4)); L.followers += rnd(1000, 50000); m = `${emoji} My interview on a late-night show went viral.`; }
      else { fame(-3); m = `${emoji} I said something dumb on live TV. I'm being dragged online.`; }
      break;
    case "endorsement": { const pay = Math.trunc(Math.pow(L.fame, 2) * rnd(50, 200) + L.followers * 0.2); L.money += pay; m = `${emoji} I signed a deal with ${pick(["a soda brand", "a sportswear giant", "a phone company", "a luxury watchmaker"])} worth ${formatMoney(pay)}.`; break; }
    case "productLine": {
      const cost = 100000; L.money -= cost;
      if (roll(0.3 + L.fame / 200)) { const pay = rnd(200000, 3000000); L.money += pay; m = `${emoji} My ${pick(["perfume", "clothing line", "sneakers", "makeup line"])} sold out everywhere! I made ${formatMoney(pay)}.`; }
      else m = `${emoji} My product line flopped. Nobody wanted it.`;
      break;
    }
    case "podcast": { const gain = rnd(2000, 80000) + L.fame * 500; L.followers += gain; m = `${emoji} My podcast took off and gained ${formatCount(gain)} listeners.`; break; }
    case "gala": fame(rnd(1, 3)); adjust(L, { happiness: 6 }); bump(L, "parties"); m = `${emoji} I walked the red carpet at a celebrity gala.`; break;
    case "feud": fame(rnd(2, 6)); L.karma -= 3; L.followers += rnd(5000, 60000); m = `${emoji} I started a feud with ${pick(["a rapper", "a reality TV star", "a famous chef", "an ex-bandmate"])}. The internet picked sides.`; break;
  }
  return out(L, title, m);
}

// MARK: - Prison life

const PrisonGangs = [["The Iron Fists", "✊"], ["Los Cuervos", "🐦‍⬛"], ["The Saints", "😇"], ["The Bone Yard", "💀"]];

function prisonLife(L) {
  L.prisonLife = L.prisonLife || { behavior: 50, gang: null, tunnel: 0, respect: 20, served: 0 };
  return L.prisonLife;
}

const PrisonPackActions = {
  job: ["🧺", "Work a Prison Job", "Laundry, kitchen or library"],
  gang: ["🤜", "Join a Gang", "Protection and respect"],
  fight: ["🥊", "Pick a Fight", "Earn respect, or a beating"],
  contraband: ["📦", "Smuggle Contraband", "Money, but more time if caught"],
  tunnel: ["⛏️", "Dig an Escape Tunnel", "A little more each year"],
  parole: ["⚖️", "Request a Parole Hearing", "Needs good behavior"],
};

function prisonPackAction(L, action) {
  if (!inPrison(L)) return out(L, "Prison", "I'm not in prison.", false);
  const pl = prisonLife(L);
  const [emoji, title] = PrisonPackActions[action];
  if (usedThisYear(L, `prison-${action}`)) return out(L, title, "I already did that this year.", false);
  markUsed(L, `prison-${action}`);
  let m;
  switch (action) {
    case "job": { const pay = rnd(50, 400); L.money += pay; pl.behavior = Math.min(100, pl.behavior + 8); m = `${emoji} I worked in the prison ${pick(["laundry", "kitchen", "library", "license plate shop"])} and earned ${formatMoney(pay)}.`; break; }
    case "gang": {
      if (pl.gang) return out(L, title, `I'm already in ${pl.gang}.`, false);
      const g = pick(PrisonGangs);
      if (roll(0.5 + pl.respect / 200)) { pl.gang = g[0]; pl.respect = Math.min(100, pl.respect + 15); pl.behavior = Math.max(0, pl.behavior - 10); m = `${g[1]} I joined ${g[0]}. Nobody messes with me now.`; }
      else { adjust(L, { health: -10 }); m = `${g[1]} ${g[0]} beat me up as a "tryout". They said no.`; }
      break;
    }
    case "fight":
      pl.behavior = Math.max(0, pl.behavior - 12);
      if (roll(0.45 + L.stats.health / 400 + (pl.gang ? 0.1 : 0))) { pl.respect = Math.min(100, pl.respect + 12); adjust(L, { health: -5 }); m = `${emoji} I won a fight in the yard. Respect earned.`; }
      else { adjust(L, { health: -rnd(10, 25) }); pl.respect = Math.max(0, pl.respect - 5); m = `${emoji} I lost a fight in the yard and ended up in the infirmary.`; }
      break;
    case "contraband":
      if (roll(0.7)) { const pay = rnd(200, 3000); L.money += pay; m = `${emoji} I smuggled ${pick(["cigarettes", "phones", "snacks", "magazines"])} into the cell block and sold them for ${formatMoney(pay)}.`; }
      else { L.prisonYearsLeft += 1; pl.behavior = Math.max(0, pl.behavior - 20); m = `${emoji} The guards found my stash. A year was added to my sentence.`; }
      break;
    case "tunnel":
      pl.tunnel = Math.min(100, pl.tunnel + rnd(15, 35));
      if (roll(0.12)) { pl.tunnel = 0; L.prisonYearsLeft += 2; m = `${emoji} The guards found my tunnel. 2 years were added to my sentence.`; break; }
      if (pl.tunnel >= 100) {
        if (roll(0.7)) { L.prisonYearsLeft = 0; L.criminalRecord.push("Prison Escape"); L.prisonLife = null; adjust(L, { happiness: 25 }); m = `${emoji} I finished my tunnel and crawled out to freedom! 🏃`; }
        else { pl.tunnel = 0; L.prisonYearsLeft += 3; m = `${emoji} My tunnel came up right inside the guard tower. 3 years were added.`; }
      } else m = `${emoji} I dug my tunnel a bit further. It's ${pl.tunnel}% done.`;
      break;
    case "parole":
      if (pl.behavior >= 60 && roll(pl.behavior / 160)) { L.prisonYearsLeft = 0; L.prisonLife = null; adjust(L, { happiness: 20 }); m = `${emoji} The parole board granted my release for good behavior!`; }
      else m = `${emoji} The parole board denied my request. (Behavior: ${pl.behavior}/100.)`;
      break;
  }
  return out(L, title, m);
}

// MARK: - Yearly hook

function progressPacks(L) {
  if (!L.isAlive) return;
  progressBusinesses(L);
  progressRoyalty(L);
  if (L.isAlive) progressMob(L);
  if (L.isAlive) progressPets(L);
  if (L.prisonLife && !inPrison(L)) L.prisonLife = null;
  if (inPrison(L)) prisonLife(L).behavior = Math.min(100, prisonLife(L).behavior + 3);
  if (L.isAlive && L.fame >= 50 && roll(0.25)) {
    L.pendingEvents.push(ev("paparazzi", {}, "Paparazzi!", "A swarm of paparazzi is blocking your path outside a restaurant.", ["Pose for photos", "Hide your face", "Shove a photographer"]));
  }
}

Object.assign(SIMPLE_EVENTS, {
  paparazzi: {
    emoji: "📸", title: "Paparazzi!", min: 200, max: 0, options: [], // only created by progressPacks
    resolve: (L, d, c) => {
      if (c === 0) { L.fame = Math.min(100, L.fame + 1); adjust(L, { happiness: 3 }); return "📸 I posed for the paparazzi. My outfit is trending."; }
      if (c === 1) { adjust(L, { happiness: -2 }); return "I hid my face from the cameras. The tabloids called me 'mysterious'."; }
      L.karma -= 3;
      if (roll(0.3)) { L.criminalRecord.push("Assault"); L.money -= 50000; return "I shoved a photographer. He sued me for $50,000."; }
      L.fame = Math.min(100, L.fame + 2); return "I shoved a photographer. The video went viral.";
    },
  },
});
