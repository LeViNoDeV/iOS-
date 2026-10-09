// LifeSim Organized Crime: work your way into a crime family. Respect (your standing) and
// loyalty (the boss's trust) decide promotions. Rackets earn money but draw heat from the FBI.
// Every year the family hands you orders, and every choice has a cost.
"use strict";

const CrimeFamilies = [
  { id: "moretti", name: "The Moretti family", emoji: "🎩", desc: "An old family that controls the docks, the unions and half the city council." },
  { id: "sokolov", name: "The Sokolov organization", emoji: "♟️", desc: "Disciplined and secretive. Big in smuggling and financial fraud." },
  { id: "kuroda", name: "The Kuroda syndicate", emoji: "🃏", desc: "Runs gambling dens and takes a cut of every construction contract." },
  { id: "vargas", name: "The Vargas organization", emoji: "🌹", desc: "Moves product across borders. Pays well, forgives nothing." },
  { id: "doyle", name: "The Doyle crew", emoji: "🗝️", desc: "A tight neighborhood crew that runs the waterfront and the trucking yards." },
];
const MobRanks = ["Associate", "Soldier", "Capo", "Underboss", "Boss"];
const MobPromotion = [null, { respect: 35, loyalty: 60, years: 2 }, { respect: 60, loyalty: 65, years: 5 }, { respect: 80, loyalty: 75, years: 9 }, null];
const Rackets = {
  loansharking: { name: "Loansharking", emoji: "💵", cost: 50000, income: 40000, heat: 3, rank: 1, desc: "Lend at brutal interest" },
  gambling: { name: "Illegal gambling", emoji: "🎲", cost: 80000, income: 60000, heat: 3, rank: 1, desc: "Card games and a sports book" },
  protection: { name: "Protection", emoji: "🏪", cost: 10000, income: 30000, heat: 4, rank: 1, desc: "Local businesses pay to stay safe" },
  smuggling: { name: "Smuggling", emoji: "🚢", cost: 250000, income: 150000, heat: 7, rank: 2, desc: "Move goods through the port" },
};
const racketCap = (mob) => [0, 2, 3 + Math.floor(mob.crew / 2), 8, 12][mob.rank];
const racketLevels = (mob) => Object.values(mob.rackets).reduce((s, x) => s + x, 0);
const mobFamily = (L) => (L.mob ? CrimeFamilies.find((f) => f.id === L.mob.familyId) : null);
const streetCred = (L) => L.criminalRecord.length + Math.floor(count(L, "crimes") / 3);

function joinMob(L, familyId) {
  if (L.age < 18 || inPrison(L)) return out(L, "Organized Crime", "That's not possible right now.", false);
  if (L.mob) return out(L, "Organized Crime", "I'm already with a family.", false);
  const f = CrimeFamilies.find((x) => x.id === familyId);
  if (usedThisYear(L, "mob-join")) return out(L, f.name, "I already tried to get in with a family this year.", false);
  markUsed(L, "mob-join");
  if (!roll(clamp(0.12 + streetCred(L) * 0.12 + (L.karma < 35 ? 0.1 : 0), 0, 0.85))) {
    return out(L, f.name, `${f.emoji} I asked around about working for ${f.name}. Nobody would vouch for me. They don't know me on the street yet.`);
  }
  L.mob = { familyId, rank: 0, respect: 15, loyalty: 50, heat: 10, crew: 0, rackets: { loansharking: 0, gambling: 0, protection: 0, smuggling: 0 }, skimming: false, years: 0, boss: `${Names.first("male")} ${Names.randomLast()}` };
  L.karma -= 5;
  return out(L, f.name, `${f.emoji} A capo for ${f.name} agreed to take me on as an associate. I answer to the family now. Boss: ${L.mob.boss}.`);
}

const MobActions = {
  errand: { emoji: "📦", title: "Run errands for your capo", sub: "Small money, earns trust", rank: 0 },
  fence: { emoji: "💍", title: "Fence stolen goods", sub: "Better money, some risk", rank: 0 },
  payoff: { emoji: "👮", title: "Pay off a detective", sub: "Cuts heat. Could be a sting", rank: 1 },
  lieLow: { emoji: "🕶️", title: "Lie low", sub: "Cuts heat, costs respect", rank: 0 },
  launder: { emoji: "🧺", title: "Launder money through a front", sub: "Cuts heat if you own a business or rental", rank: 1 },
  recruit: { emoji: "🧑‍🤝‍🧑", title: "Recruit a crew member", sub: "$20,000 · more rackets, more income", rank: 2 },
  promote: { emoji: "🪜", title: "Ask to move up", sub: "", rank: 0 },
  coup: { emoji: "🗡️", title: "Make a move on the boss", sub: "Take the family. If it fails, you won't survive it", rank: 3 },
  retire: { emoji: "🌅", title: "Step down and retire", sub: "Bosses can retire, if the family allows it", rank: 4 },
  walkAway: { emoji: "🚶", title: "Walk away", sub: "Associates can still leave. Barely", rank: 0, maxRank: 0 },
  flip: { emoji: "🐀", title: "Go to the FBI", sub: "Testify for a new identity. They never forget", rank: 0 },
};

function mobActionsFor(L) {
  const mob = L.mob;
  if (!mob || inPrison(L)) return [];
  return Object.entries(MobActions).filter(([id, a]) => mob.rank >= a.rank && (a.maxRank == null || mob.rank <= a.maxRank)
    && !(id === "promote" && (mob.rank >= 3 || !MobPromotion[mob.rank + 1]))
    && !(id === "retire" && L.age < 55)).map(([id]) => id);
}

function promotionNeeds(mob) {
  const need = MobPromotion[mob.rank + 1];
  if (!need) return null;
  const missing = [];
  if (mob.respect < need.respect) missing.push(`respect ${need.respect}+`);
  if (mob.loyalty < need.loyalty) missing.push(`loyalty ${need.loyalty}+`);
  if (mob.years < need.years) missing.push(`${need.years} years in`);
  return missing;
}

function mobAction(L, action, arg) {
  const mob = L.mob;
  if (!mob) return out(L, "Organized Crime", "I'm not with a family.", false);
  const f = mobFamily(L);
  const a = MobActions[action];
  const once = !["walkAway", "flip", "retire", "coup"].includes(action);
  if (once) {
    if (usedThisYear(L, `mob-${action}`)) return out(L, a.title, "I already did that this year.", false);
    markUsed(L, `mob-${action}`);
  }
  const respect = (d) => { mob.respect = clamp(mob.respect + d, 0, 100); };
  const loyalty = (d) => { mob.loyalty = clamp(mob.loyalty + d, 0, 100); };
  const heat = (d) => { mob.heat = clamp(mob.heat + d, 0, 100); };
  mob.active = L.age;
  let m;
  switch (action) {
    case "errand": { const cash = rnd(2000, 8000); L.money += cash; respect(3); loyalty(4); heat(2); bump(L, "crimes"); m = `📦 I ${pick(["collected envelopes from a few bars", "drove a capo around for a week", "picked up a package at the airport", "kept watch outside a meeting"])}. ${formatMoney(cash)} for my trouble.`; break; }
    case "fence":
      bump(L, "crimes"); L.karma -= 2;
      if (roll(0.88)) { const cash = rnd(6000, 25000); L.money += cash; respect(4); heat(5); m = `💍 I moved a load of ${pick(["stolen watches", "designer bags", "electronics off a truck", "jewelry"])} and cleared ${formatMoney(cash)}.`; }
      else { L.criminalRecord.push("Receiving stolen property"); sendToPrison(L, rnd(1, 3)); m = `💍 The buyer was an undercover cop. I got ${plural(L.prisonYearsLeft, "year")}.`; if (mob.rank >= 1) loyalty(5); }
      break;
    case "payoff": {
      const cost = 25000 * (mob.rank + 1);
      if (L.money < cost) return out(L, a.title, `That takes ${formatMoney(cost)}.`, false);
      L.money -= cost;
      if (roll(0.1)) { L.criminalRecord.push("Bribery"); sendToPrison(L, rnd(2, 5)); m = `👮 The detective was wearing a wire. I got ${plural(L.prisonYearsLeft, "year")} for bribery.`; break; }
      heat(-25); m = `👮 I paid a detective ${formatMoney(cost)} to lose some paperwork. The heat's off, for now.`; break;
    }
    case "lieLow": heat(-15); respect(-3); adjust(L, { happiness: 2 }); m = "🕶️ I kept my head down for a while. Some of the guys think I've gone soft."; break;
    case "launder": {
      const front = (L.businesses || []).length > 0 || L.assets.some((x) => x.kind === "house" && x.rented);
      if (!front) return out(L, a.title, "I need a legitimate business or a rental property to wash money through.", false);
      L.money -= 15000; heat(-18); respect(2);
      m = `🧺 I ran dirty money through ${(L.businesses || [])[0]?.name || "my rental property"}. On paper, I'm just a successful ${L.businesses?.length ? "business owner" : "landlord"}.`; break;
    }
    case "recruit":
      if (mob.crew >= 10) return out(L, a.title, "My crew is as big as the boss will allow.", false);
      if (L.money < 20000) return out(L, a.title, "Recruiting costs $20,000.", false);
      L.money -= 20000; mob.crew += 1; respect(2);
      m = `🧑‍🤝‍🧑 I brought ${Names.first("male")} into my crew. My crew is ${mob.crew} strong now.`; break;
    case "promote": {
      const missing = promotionNeeds(mob);
      if (!missing) return out(L, a.title, "There's nowhere higher to go by asking.", false);
      if (missing.length) { respect(-2); m = `🪜 I asked to move up. The answer was no. (Still need: ${missing.join(", ")}.)`; break; }
      if (mob.rank === 0) {
        packEvent(L, "mobMade", {}, `${mob.boss} has agreed to make you a full member of ${f.name}. There's a ceremony: an oath, a burned card, a drop of blood. Once you're made, there's no leaving.`, ["Take the oath", "Not yet"]);
        m = "🪜 The family is considering me for membership."; break;
      }
      if (mob.rank === 2 && roll(0.5)) { m = "🪜 The boss said there's no room at the top right now. When the Underboss goes, I'm next."; break; }
      mob.rank += 1; adjust(L, { happiness: 10 }); loyalty(5);
      m = `🪜 I was made ${MobRanks[mob.rank]} of ${f.name}.${mob.rank === 2 ? " I have my own crew now." : ""}`; break;
    }
    case "coup":
      if (roll(0.25 + mob.respect / 250 + mob.crew * 0.02)) { mob.rank = 4; mob.boss = `${L.firstName} ${L.lastName}`; respect(15); heat(20); L.karma -= 20; m = `🗡️ I made my move and the old boss was gone by morning. I run ${f.name} now.`; }
      else if (roll(0.6)) { die(L, "a mob power struggle"); return out(L, a.title, "🗡️ The boss found out first."); }
      else { mob.rank = 1; respect(-30); loyalty(-40); adjust(L, { health: -30 }); m = "🗡️ My move failed. I was beaten half to death and busted down to soldier."; }
      break;
    case "retire":
      if (mob.loyalty < 40 && roll(0.5)) { die(L, "a farewell from the family"); return out(L, a.title, "🌅 Some people in the family didn't want me walking around with what I know."); }
      L.mob = null; L.mobRetired = true; adjust(L, { happiness: 10 });
      m = `🌅 I handed ${f.name} to my underboss and retired with my money and my secrets.`; break;
    case "walkAway":
      L.mob = null;
      if (roll(0.5)) m = `🚶 I told my capo I was done. They let me go. I was never really one of them.`;
      else { adjust(L, { health: -20, happiness: -10 }); m = "🚶 They let me walk away, but not before a beating to remind me to keep quiet."; }
      break;
    case "flip": {
      const ranks = MobRanks[mob.rank];
      L.mob = null; L.karma += 10; L.snitched = L.age;
      const c = pick(WORLD.filter((x) => x[0] !== L.country));
      L.country = c[0]; L.city = pick(c[1]); L.criminalRecord = []; L.lastName = Names.randomLast();
      if (L.job) { L.job = null; }
      adjust(L, { happiness: -10 });
      m = `🐀 I testified against ${f.name} as a former ${ranks}. The FBI gave me a new name and moved me to ${L.city}, ${L.country}. I'm ${L.firstName} ${L.lastName} now. I'll be looking over my shoulder forever.`;
      break;
    }
  }
  return out(L, a.title, m);
}

function startRacket(L, id) {
  const mob = L.mob;
  const r = Rackets[id];
  if (!mob || mob.rank < r.rank) return out(L, r.name, `Only a ${MobRanks[r.rank]} or higher can run that.`, false);
  if (racketLevels(mob) >= racketCap(mob)) return out(L, r.name, `A ${MobRanks[mob.rank]} can only run ${racketCap(mob)} rackets${mob.rank === 2 ? " (more with a bigger crew)" : ""}.`, false);
  if (mob.rackets[id] >= 3) return out(L, r.name, "That racket is as big as it can get.", false);
  const cost = r.cost * (mob.rackets[id] + 1);
  if (L.money < cost) return out(L, r.name, `Setting that up costs ${formatMoney(cost)}.`, false);
  L.money -= cost; mob.rackets[id] += 1; mob.respect = Math.min(100, mob.respect + 4); mob.active = L.age;
  return out(L, r.name, `${r.emoji} I ${mob.rackets[id] === 1 ? "started" : "expanded"} ${mob.rackets[id] === 1 ? (/^[aeiou]/i.test(r.name) ? "an " : "a ") : "my "}${r.name.toLowerCase()} racket for ${formatMoney(cost)}. It should bring in about ${formatMoney(r.income * mob.rackets[id])} a year.`);
}

function setSkimming(L, on) {
  if (!L.mob) return;
  L.mob.skimming = on;
}

// MARK: Each year

/// Upgrades crime-family state from older saves.
function normalizeMob(L) {
  const mob = L.mob;
  if (!mob || mob.loyalty != null) return;
  const ids = { bianchi: "moretti", volkov: "sokolov", halcones: "vargas", orourke: "doyle", kuroda: "kuroda" };
  L.mob = { familyId: ids[mob.familyId] || "moretti", rank: Math.min(4, mob.rank || 0), respect: mob.respect ?? 20, loyalty: 55, heat: mob.heat ?? 10, crew: 0,
    rackets: { loansharking: 0, gambling: 0, protection: 0, smuggling: 0 }, skimming: false, years: 3, boss: `${Names.first("male")} ${Names.randomLast()}` };
}

function progressMob(L) {
  normalizeMob(L);
  if (L.snitched && !L.mob && L.age - L.snitched < 15 && roll(0.02)) { die(L, "mob revenge"); return; }
  const mob = L.mob;
  if (!mob) return;
  const f = mobFamily(L);
  mob.years += 1;
  if (inPrison(L)) {
    if (mob.rank >= 1) { mob.loyalty = Math.min(100, mob.loyalty + 4); mob.respect = Math.min(100, mob.respect + 2); record(L, `🤐 I kept my mouth shut inside. ${f.name} is looking after my family.`); }
    return;
  }
  // Rackets pay, and draw attention.
  const crewBoost = 1 + mob.crew * 0.1;
  let gross = 0;
  for (const [id, lvl] of Object.entries(mob.rackets)) {
    if (!lvl) continue;
    gross += Math.round(Rackets[id].income * lvl * crewBoost * rndf(0.8, 1.2));
    mob.heat = clamp(mob.heat + Rackets[id].heat * lvl, 0, 100);
  }
  if (mob.rank >= 2) mob.heat = clamp(mob.heat + mob.crew, 0, 100);
  if (gross) {
    const share = mob.rank === 4 ? 0 : mob.skimming ? 0.15 : 0.3;
    L.money += Math.round(gross * (1 - share));
    if (share) record(L, `💰 My rackets brought in ${formatMoney(gross)}. I kicked up ${formatMoney(Math.round(gross * share))} to the boss.`);
    else record(L, `💰 My rackets brought in ${formatMoney(gross)}.`);
    if (mob.skimming && roll(0.18)) {
      mob.loyalty = Math.max(0, mob.loyalty - 30);
      if (mob.loyalty < 15 && roll(0.4)) { die(L, "skimming from the mob"); return; }
      adjust(L, { health: -25 });
      notify(L, "🩸", "Caught Skimming", "🩸 The boss found out I was skimming. I was beaten badly and I'm on thin ice.");
      mob.skimming = false;
    } else if (!mob.skimming) mob.loyalty = Math.min(100, mob.loyalty + 2);
  }
  if (mob.rank === 3) L.money += rnd(150000, 300000);
  if (mob.rank === 4) { const take = rnd(800000, 2000000); L.money += take; record(L, `💰 My capos kicked up ${formatMoney(take)} this year.`); }
  if (mob.active !== L.age - 1 && mob.active !== L.age) mob.respect = Math.max(0, mob.respect - 4);
  mob.heat = clamp(mob.heat - 6, 0, 100);
  // The law.
  if (mob.heat >= 65 && roll(0.3)) {
    packEvent(L, "mobSubpoena", {}, "A federal grand jury has subpoenaed you. Prosecutors want you to talk about the family.", ["Keep your mouth shut", "Hire a top defense lawyer ($250,000)", "Cooperate with the prosecutors"]);
    return;
  }
  // Orders and rivals.
  if (roll(0.4)) mobOrder(L);
  else if (roll(0.1)) packEvent(L, "mobRival", {}, "A rival crew hit one of your family's card games and roughed up your people.", ["Hit back hard", "Negotiate a truce ($50,000)", "Take it to the boss"]);
  if (mob.rank === 3 && roll(0.07)) packEvent(L, "mobSuccession", {}, `${mob.boss} was arrested in a dawn raid and won't be coming home. The family needs a new boss.`, ["Take the chair", "Back another capo"]);
  if (mob.rank < 4 && roll(0.04)) packEvent(L, "mobAmbush", {}, "A car has been parked outside your house for three nights in a row.", ["Confront them", "Move your family somewhere safe ($30,000)", "Ignore it"]);
}

function mobOrder(L) {
  const mob = L.mob;
  const orders = [
    ["mobCollect", `A gambler owes the family $${rnd(40, 120)},000 and is dodging your calls. The boss wants it collected.`, ["Lean on him", "Give him another month", "Pay part of it yourself ($20,000)"]],
    ["mobHijack", "The boss wants a truckload of electronics taken off the interstate tonight.", mob.rank >= 2 ? ["Do it yourself", "Send your crew", "Refuse"] : ["Do it", "Refuse"]],
    ["mobWitness", "A shop owner is talking to the police about the family's business.", ["Offer him money to forget", "Pay him a visit", "Tell the boss you won't do it"]],
    ["mobFall", "A made man's nephew got caught with family property. The boss wants someone to take the fall.", ["Take the fall", "Refuse"]],
  ];
  const [kind, msg, opts] = pick(orders);
  packEvent(L, kind, {}, msg, opts);
}

const mobOf = (L) => L.mob || { respect: 0, loyalty: 0, heat: 0 };
const mobBump = (L, r = 0, l = 0, h = 0) => { const m = L.mob; if (!m) return; m.respect = clamp(m.respect + r, 0, 100); m.loyalty = clamp(m.loyalty + l, 0, 100); m.heat = clamp(m.heat + h, 0, 100); m.active = L.age; };

packEvents({
  mobMade: {
    emoji: "🃏", title: "The Ceremony",
    resolve: (L, d, c) => {
      if (!L.mob) return "The ceremony never happened.";
      if (c === 1) { mobBump(L, -5, -10); return "I said I wasn't ready. The boss didn't like it."; }
      L.mob.rank = 1; L.mob.made = true; mobBump(L, 10, 10); adjust(L, { happiness: 8 }); L.karma -= 5;
      return `🃏 I took the oath. I'm a made member of ${mobFamily(L).name} now. Nobody touches me without permission, and I can never leave.`;
    },
  },
  mobCollect: {
    emoji: "💵", title: "Collection",
    resolve: (L, d, c) => {
      if (!L.mob) return "It wasn't my problem anymore.";
      if (c === 0) {
        L.karma -= 5; bump(L, "crimes");
        if (roll(0.15)) { L.criminalRecord.push("Extortion"); sendToPrison(L, rnd(2, 6)); mobBump(L, 5, 5); return `💵 He went to the police. I got ${plural(L.prisonYearsLeft, "year")} for extortion.`; }
        mobBump(L, 6, 6, 6); return "💵 I explained the situation to him in a parking garage. He found the money by Friday.";
      }
      if (c === 1) { mobBump(L, -4, -6); return "I gave him another month. The boss thinks I'm soft."; }
      L.money -= 20000; mobBump(L, 1, 3); return "I covered part of his debt myself. The boss got paid and nobody got hurt.";
    },
  },
  mobHijack: {
    emoji: "🚛", title: "The Job",
    resolve: (L, d, c) => {
      const mob = L.mob; if (!mob) return "Not my job anymore.";
      const refuse = (mob.rank >= 2 && c === 2) || (mob.rank < 2 && c === 1);
      if (refuse) { mobBump(L, -6, -12); return "I refused the job. People noticed."; }
      bump(L, "crimes"); L.karma -= 4;
      const delegate = mob.rank >= 2 && c === 1;
      if (roll(delegate ? Math.min(0.95, 0.8 + 0.02 * mob.crew) : 0.75)) { const cut = rnd(30000, 90000) * (mob.rank + 1); L.money += cut; mobBump(L, 7, 6, delegate ? 6 : 10); return `🚛 ${delegate ? "My crew" : "We"} took the truck clean. My cut: ${formatMoney(cut)}.`; }
      if (delegate) { mob.crew = Math.max(0, mob.crew - 1); mobBump(L, -3, 0, 12); return "🚛 Two of my guys were arrested on the job. They're keeping quiet, for now."; }
      L.criminalRecord.push("Hijacking"); sendToPrison(L, rnd(3, 8)); mobBump(L, 5, 8); return `🚛 State troopers were waiting. I got ${plural(L.prisonYearsLeft, "year")}.`;
    },
  },
  mobWitness: {
    emoji: "🤫", title: "A Witness",
    resolve: (L, d, c) => {
      if (!L.mob) return "Not my problem anymore.";
      if (c === 0) { L.money -= 25000; mobBump(L, 2, 5, 3); return "I paid him $25,000 to develop a bad memory. It worked."; }
      if (c === 1) { L.karma -= 10; bump(L, "crimes"); if (roll(0.2)) { L.criminalRecord.push("Witness intimidation"); sendToPrison(L, rnd(3, 7)); return `🤫 He'd already told the FBI about me. I got ${plural(L.prisonYearsLeft, "year")} for witness intimidation.`; } mobBump(L, 8, 8, 10); return "🤫 I paid him a visit. He's decided he didn't see anything after all."; }
      mobBump(L, -5, -15); return "I told the boss I wouldn't do it. He said he'd remember that.";
    },
  },
  mobFall: {
    emoji: "⛓️", title: "Taking the Fall",
    resolve: (L, d, c) => {
      if (!L.mob) return "Not my problem anymore.";
      if (c === 0) { L.criminalRecord.push("Possession of stolen property"); sendToPrison(L, rnd(1, 3)); L.money += 100000; mobBump(L, 12, 20); return `⛓️ I took the fall. ${plural(L.prisonYearsLeft, "year")} inside, and $100,000 waiting for me. The family won't forget it.`; }
      mobBump(L, -4, -15); return "I refused to take the fall. Someone else did, and they resent me for it.";
    },
  },
  mobRival: {
    emoji: "💥", title: "Rivals",
    resolve: (L, d, c) => {
      if (!L.mob) return "Not my war anymore.";
      if (c === 0) { L.karma -= 6; if (roll(0.15)) { adjust(L, { health: -rnd(15, 35) }); mobBump(L, 8, 5, 15); return "💥 We hit back. It got ugly and I was hurt, but they backed off."; } mobBump(L, 10, 5, 15); return "💥 We hit back hard. Nobody touches our games now."; }
      if (c === 1) { L.money -= 50000; mobBump(L, -5, 3); return "We sat down and made a deal. It cost $50,000, but nobody else got hurt."; }
      mobBump(L, -3, 6); return "I took it to the boss. He'll handle it his way.";
    },
  },
  mobSuccession: {
    emoji: "🪑", title: "An Empty Chair",
    resolve: (L, d, c) => {
      const mob = L.mob; if (!mob) return "Not my family anymore.";
      if (c === 1) { mobBump(L, -2, 12); return "I backed another capo for the chair. He owes me now."; }
      if (mob.loyalty >= 50 && mob.respect >= 65 && roll(0.75)) { mob.rank = 4; mob.boss = `${L.firstName} ${L.lastName}`; mobBump(L, 10, 0, 15); adjust(L, { happiness: 15 }); return `🪑 The capos agreed. I'm the boss of ${mobFamily(L).name}.`; }
      if (roll(0.3)) { die(L, "a mob power struggle"); return "🪑 Not everyone agreed I should take the chair."; }
      mobBump(L, -10, -10); return "🪑 The other capos backed someone else. I'll have to live with it.";
    },
  },
  mobSubpoena: {
    emoji: "⚖️", title: "Grand Jury",
    resolve: (L, d, c) => {
      const mob = L.mob; if (!mob) return "The subpoena was withdrawn.";
      if (c === 2) { const r = mobAction(L, "flip"); return r.message; }
      let chance = 0.35 + mob.heat / 250;
      if (c === 1) { L.money -= 250000; chance /= 2; }
      if (roll(chance)) { L.criminalRecord.push("Racketeering"); sendToPrison(L, rnd(4, 12)); mob.heat = 20; mobBump(L, 10, 15); return `⚖️ I was convicted of racketeering and sentenced to ${plural(L.prisonYearsLeft, "year")}. I never said a word.`; }
      mob.heat = Math.max(0, mob.heat - 30); mobBump(L, 6, 10); return `⚖️ ${c === 1 ? "My lawyer tore their case apart." : "I said nothing."} The grand jury didn't indict.`;
    },
  },
  mobAmbush: {
    emoji: "🚗", title: "Being Watched",
    resolve: (L, d, c) => {
      if (!L.mob) return "The car left.";
      if (c === 0) { if (roll(0.3)) { adjust(L, { health: -rnd(15, 30) }); return "🚗 It was a rival crew. There was a fight and I got hurt."; } mobBump(L, 4); return "🚗 It was a rival crew. They drove off when I walked up."; }
      if (c === 1) { L.money -= 30000; return "I moved my family to a safe house for a few months. Nothing happened."; }
      if (roll(0.15)) { adjust(L, { health: -rnd(20, 40) }); return "🚗 I ignored it. One night they jumped me outside my house."; }
      return "I ignored it. Eventually the car was gone. FBI, probably.";
    },
  },
});

// Street criminals get noticed.
Object.assign(SIMPLE_EVENTS, {
  mobRecruit: {
    emoji: "🎩", title: "A Man in a Nice Suit", min: 18, max: 60,
    when: (L) => !L.mob && !L.snitched && streetCred(L) >= 2 && !inPrison(L),
    make: (L) => { const f = pick(CrimeFamilies); return { data: { fid: f.id }, message: `A man in a tailored suit says ${f.name} has heard about you. "We could use someone like you."` }; },
    options: ["Hear him out", "Tell him you're not interested"],
    resolve: (L, d, c) => {
      if (c === 1) return "I told him I wasn't interested. He smiled and said the offer stands.";
      const f = CrimeFamilies.find((x) => x.id === d.fid);
      L.mob = { familyId: f.id, rank: 0, respect: 20, loyalty: 55, heat: 10, crew: 0, rackets: { loansharking: 0, gambling: 0, protection: 0, smuggling: 0 }, skimming: false, years: 0, boss: `${Names.first("male")} ${Names.randomLast()}` };
      return `${f.emoji} I started doing work for ${f.name}. I'm an associate now.`;
    },
  },
});
