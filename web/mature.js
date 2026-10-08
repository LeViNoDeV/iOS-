// LifeSim Mature Mode (18+): drinking, drugs and (non-explicit) sex.
// Everything here is opt-in via the Mature Mode setting and only ever involves adult characters (18+).
"use strict";

const isMature = (L) => !!L.mature && L.age >= 18;

// MARK: Drinks

const Drinks = [
  { id: "beer", title: "Beer", emoji: "🍺", cost: 8, buzz: [2, 5], health: 0 },
  { id: "wine", title: "Glass of Wine", emoji: "🍷", cost: 15, buzz: [3, 6], health: 0 },
  { id: "cocktails", title: "Cocktails", emoji: "🍹", cost: 40, buzz: [5, 9], health: -1 },
  { id: "shots", title: "Round of Shots", emoji: "🥃", cost: 30, buzz: [6, 11], health: -2 },
  { id: "bender", title: "Drink Until I Black Out", emoji: "🍾", cost: 80, buzz: [8, 15], health: -6 },
];

const drunkStories = [
  { text: "I danced on the bar until the bouncer asked me to stop.", happiness: 4 },
  { text: "I woke up with a tattoo of a dolphin I don't remember getting.", happiness: -2, looks: -1 },
  { text: "I drunk-texted my ex at 3 a.m. The reply was \"new phone, who dis\".", happiness: -4 },
  { text: "I fell asleep in the back of a taxi and woke up two towns over.", money: -120 },
  { text: "I started a sing-along that the whole bar joined.", happiness: 6 },
  { text: "I got into a shoving match outside the club.", health: -6 },
  { text: "I lost my phone somewhere between the third and fourth bar.", money: -400 },
  { text: "I gave a heartfelt speech to a stranger about my life goals.", happiness: 3 },
];

function haveDrink(L, id) {
  const d = Drinks.find((x) => x.id === id);
  L.money -= d.cost;
  bump(L, "drinks");
  bump(L, "parties");
  adjust(L, { happiness: rnd(d.buzz[0], d.buzz[1]), health: d.health });
  let m = `${d.emoji} I had ${d.id === "bender" ? "way too much to drink" : `some ${d.title.toLowerCase()}`}.`;
  if (id === "shots" || id === "bender") {
    const s = pick(drunkStories);
    adjust(L, { happiness: s.happiness || 0, health: s.health || 0, looks: s.looks || 0 });
    if (s.money) L.money += s.money;
    m += " " + s.text;
  }
  if (id === "bender") {
    if (roll(0.04)) { die(L, "alcohol poisoning"); return out(L, d.title, m + " I never woke up."); }
    if (roll(0.2)) { adjust(L, { health: -5 }); m += " The hangover the next day was apocalyptic."; }
  }
  const addictChance = 0.01 + count(L, "drinks") * 0.0015 + (id === "bender" ? 0.04 : 0);
  if (!L.addictions.includes("alcohol") && roll(addictChance)) {
    L.addictions.push("alcohol");
    m += " I think I'm developing a drinking problem.";
  }
  return out(L, d.title, m);
}

// MARK: Drugs

const Drugs = [
  { id: "weed", title: "Weed", emoji: "🌿", cost: 40, high: [4, 10], health: -1, smarts: -1, addict: 0.03, od: 0, bust: 0.02 },
  { id: "shrooms", title: "Mushrooms", emoji: "🍄", cost: 60, high: [6, 14], health: -2, smarts: 1, addict: 0.01, od: 0.002, bust: 0.03, trip: true },
  { id: "lsd", title: "LSD", emoji: "🌈", cost: 50, high: [6, 16], health: -2, smarts: 0, addict: 0.01, od: 0.002, bust: 0.03, trip: true },
  { id: "ecstasy", title: "Ecstasy", emoji: "💊", cost: 80, high: [10, 18], health: -5, smarts: -1, addict: 0.08, od: 0.01, bust: 0.04 },
  { id: "cocaine", title: "Cocaine", emoji: "❄️", cost: 150, high: [10, 16], health: -6, smarts: -1, addict: 0.18, od: 0.02, bust: 0.05 },
  { id: "meth", title: "Meth", emoji: "🧪", cost: 100, high: [12, 20], health: -12, smarts: -3, looks: -5, addict: 0.35, od: 0.03, bust: 0.06 },
  { id: "heroin", title: "Heroin", emoji: "💉", cost: 120, high: [15, 25], health: -14, smarts: -2, looks: -3, addict: 0.45, od: 0.06, bust: 0.06 },
];

function takeDrug(L, id, silent = false) {
  const d = Drugs.find((x) => x.id === id);
  L.money -= d.cost;
  bump(L, "drugUse");
  const hooked = L.addictions.includes("drugs");
  if (roll(d.od * (hooked ? 1.5 : 1))) {
    if (roll(0.5)) { die(L, `a ${d.title.toLowerCase()} overdose`); return out(L, d.title, `${d.emoji} I took ${d.title.toLowerCase()} and overdosed.`, !silent); }
    adjust(L, { health: -25, happiness: -10 });
    L.money -= 3000;
    return out(L, d.title, `${d.emoji} I overdosed on ${d.title.toLowerCase()}. Paramedics brought me back. The hospital bill was $3,000.`, !silent);
  }
  let m;
  if (d.trip && roll(0.25)) {
    adjust(L, { happiness: -8, health: d.health });
    m = `${d.emoji} I had a terrifying bad trip on ${d.title.toLowerCase()}. ${pick(["The walls were breathing.", "I was convinced my couch was judging me.", "I hid in the bathtub for six hours."])}`;
  } else {
    adjust(L, { happiness: rnd(d.high[0], d.high[1]), health: d.health, smarts: d.smarts || 0, looks: d.looks || 0 });
    m = `${d.emoji} I got high on ${d.title.toLowerCase()}. ${d.trip ? pick(["I understood the universe for about an hour.", "The colors! The colors!", "I made friends with a tree."]) : pick(["What a night.", "I felt on top of the world.", "Time stopped existing for a while."])}`;
  }
  if (roll(d.bust)) {
    L.criminalRecord.push(`Possession (${d.title})`);
    if (["meth", "heroin", "cocaine"].includes(id) && roll(0.4)) {
      sendToPrison(L, rnd(1, 3));
      m += ` The cops caught me holding and I got ${plural(L.prisonYearsLeft, "year")} in prison.`;
    } else {
      L.money -= 1000;
      m += " The cops caught me holding. I paid a $1,000 fine.";
    }
  }
  if (!hooked && roll(d.addict)) {
    L.addictions.push("drugs");
    m += " I'm hooked.";
  }
  return out(L, d.title, m, !silent);
}

function dealDrugs(L) {
  L.karma -= 6;
  bump(L, "crimes");
  if (roll(0.25)) {
    L.criminalRecord.push("Drug Dealing");
    sendToPrison(L, rnd(2, 6));
    return out(L, "Busted!", `🚔 I was arrested for dealing drugs and sentenced to ${plural(L.prisonYearsLeft, "year")} in prison.`);
  }
  if (roll(0.06)) {
    adjust(L, { health: -25 });
    return out(L, "Deal Gone Wrong", "🔫 A rival dealer jumped me. I barely made it out.");
  }
  const profit = rnd(500, 20000);
  L.money += profit;
  return out(L, "Dealing", `💵 I sold drugs on the corner and made ${formatMoney(profit)}.`);
}

// MARK: Sex (non-explicit) and its consequences

/// A one-in-whatever chance of a baby when two people of different genders sleep together unprotected.
function maybePregnancy(L, partnerGender, partnerName, chance) {
  if (partnerGender === L.gender || L.age > 50 || !roll(chance)) return "";
  const g = pick(["male", "female"]);
  const baby = makePerson("child", 0, { gender: g, lastName: L.lastName, bond: 90 });
  baby.occupation = null; baby.salary = 0; baby.money = 0; baby.lastContact = L.age;
  L.relationships.push(baby);
  adjust(L, { happiness: rnd(-5, 10) });
  const who = L.gender === "female" ? "I got pregnant" : `${partnerName} got pregnant`;
  return ` ${who}. Nine months later, baby ${baby.firstName} arrived. 👶`;
}

function maybeStd(L, chance) {
  if (L.illnesses.includes("std") || !roll(chance)) return "";
  L.illnesses.push("std");
  return " A week later, I tested positive for an STD.";
}

function caughtCheating(L, chance) {
  const partner = romanticPartner(L);
  if (!partner) return "";
  L.karma -= 5;
  if (!roll(partner.trait === "jealous" ? chance * 1.7 : chance)) return "";
  updateRel(L, partner.id, (x) => { x.bond -= 45; });
  adjust(L, { happiness: -12 });
  return ` ${partner.firstName} found out I cheated!`;
}

function romanticNight(L, partnerId) {
  const p = findRel(L, partnerId);
  if (!p) return out(L, "Romance", "That person isn't in my life anymore.", false);
  touch(L, p.id);
  updateRel(L, p.id, (x) => { x.bond += rnd(4, 12); });
  adjust(L, { happiness: rnd(6, 12), health: 1 });
  let m = `🌹 ${pick(["I spent a steamy night with", "I had a romantic evening in with", "Candles, music, and a long night with"])} ${p.firstName}. 🔥`;
  if (!L.protection) m += maybePregnancy(L, p.gender, p.firstName, 0.18);
  return out(L, "Romance", m);
}

function oneNightStand(L) {
  if (!roll(0.4 + L.stats.looks / 200)) {
    adjust(L, { happiness: -4 });
    return out(L, "One-Night Stand", "🙈 I struck out all night. Going home alone.");
  }
  const p = makePerson("friend", Math.max(18, L.age + rnd(-8, 8)), { gender: preferredGender(L) });
  bump(L, "partners");
  adjust(L, { happiness: rnd(6, 12) });
  let m = `🔥 I went home with ${relName(p)} (${p.age}) from the bar. ${pick(["No regrets.", "The walk of shame was worth it.", "We didn't exchange numbers."])}`;
  m += maybeStd(L, L.protection ? 0.02 : 0.12);
  if (!L.protection) m += maybePregnancy(L, p.gender, p.firstName, 0.08);
  m += caughtCheating(L, 0.35);
  return out(L, "One-Night Stand", m);
}

function datingAppHookup(L) {
  const p = makePerson("friend", Math.max(18, L.age + rnd(-6, 6)), { gender: preferredGender(L) });
  if (roll(0.2)) {
    adjust(L, { happiness: -5 });
    return out(L, "Dating App", `📱 I matched with "${p.firstName}", who turned out to look nothing like their photos. I left before dessert.`);
  }
  bump(L, "partners");
  adjust(L, { happiness: rnd(5, 10) });
  let m = `📱 I matched with ${relName(p)} (${p.age}) and we hooked up the same night. 🔥`;
  m += maybeStd(L, L.protection ? 0.02 : 0.1);
  if (!L.protection) m += maybePregnancy(L, p.gender, p.firstName, 0.08);
  m += caughtCheating(L, 0.3);
  return out(L, "Dating App", m);
}

function stripClub(L) {
  L.money -= 250;
  adjust(L, { happiness: rnd(4, 9) });
  let m = `💃 I spent $250 at the strip club. ${pick(["The DJ was great.", "I made it rain (one-dollar bills).", "My friends dragged me there, honest."])}`;
  const partner = romanticPartner(L);
  if (partner && roll(0.3)) {
    updateRel(L, partner.id, (x) => { x.bond -= 15; });
    m += ` ${partner.firstName} found the receipt.`;
  }
  return out(L, "Strip Club", m);
}

function friendsWithBenefits(L, friendId) {
  const f = findRel(L, friendId);
  if (!f) return out(L, "Friends with Benefits", "They're not in my life anymore.", false);
  touch(L, f.id);
  if (roll(f.bond / 130)) {
    bump(L, "partners");
    updateRel(L, f.id, (x) => { x.bond += rnd(-5, 10); });
    adjust(L, { happiness: rnd(5, 10) });
    let m = `😏 ${f.firstName} and I agreed to be friends with benefits.`;
    if (!romanticPartner(L) && roll(0.25)) {
      updateRel(L, f.id, (x) => { x.kind = "partner"; x.bond += 10; x.yearsTogether = 0; });
      m += " Then we caught feelings. We're officially dating now. 💕";
    }
    m += maybeStd(L, L.protection ? 0.01 : 0.05);
    if (!L.protection) m += maybePregnancy(L, f.gender, f.firstName, 0.1);
    m += caughtCheating(L, 0.35);
    return out(L, "Friends with Benefits", m);
  }
  updateRel(L, f.id, (x) => { x.bond -= 12; });
  adjust(L, { happiness: -4 });
  return out(L, "Friends with Benefits", `😬 I suggested being friends with benefits to ${f.firstName}. ${cap(pronoun(f.gender).subject)} said no, and now things are awkward.`);
}

// MARK: Mature popup events (adult characters only)

const mature18 = (L) => isMature(L);

Object.assign(SIMPLE_EVENTS, {
  vegasWedding: {
    emoji: "🎰", title: "What Happens in Vegas", min: 21, max: 60, when: (L) => mature18(L) && !romanticPartner(L),
    make: (L) => { const p = makePerson("spouse", Math.max(21, L.age + rnd(-6, 6)), { gender: preferredGender(L), bond: rnd(30, 70) }); return { data: { person: p }, message: `You woke up in Las Vegas with a splitting headache and a wedding ring. Your new spouse is ${relName(p)}.` }; },
    options: ["Stay married", "Get it annulled ($1,500)"],
    resolve: (L, d, c) => {
      if (c === 0) { d.person.lastContact = L.age; L.relationships.push(d.person); bump(L, "partners"); adjust(L, { happiness: 6 }); return `💒 I decided to stay married to ${d.person.firstName}, the stranger I married in Vegas.`; }
      L.money -= 1500; adjust(L, { happiness: -3 }); return `I annulled my Vegas wedding to ${d.person.firstName}.`;
    },
  },
  exHookup: {
    emoji: "📲", title: "U Up?", min: 18, max: 60, when: mature18,
    make: (L) => { const n = Names.first(preferredGender(L)); return { data: { name: n }, message: `Your ex ${n} texted at 2 a.m.: "u up?"` }; },
    options: ["Go over", "Leave them on read"],
    resolve: (L, d, c) => {
      if (c === 1) { adjust(L, { happiness: 2 }); return `I left ${d.name} on read. Growth.`; }
      bump(L, "partners"); adjust(L, { happiness: rnd(-4, 8) });
      return `🔥 I went over to ${d.name}'s place. ${pick(["It was a mistake.", "Old habits die hard.", "We are definitely not getting back together."])}` + maybeStd(L, L.protection ? 0.01 : 0.06) + caughtCheating(L, 0.35);
    },
  },
  bachelorParty: {
    emoji: "🥳", title: "Party Weekend", min: 21, max: 50, when: (L) => mature18(L) && firstOf(L, (p) => p.kind === "friend" && p.age >= 21).length > 0,
    make: (L) => { const f = pickOf(L, (p) => p.kind === "friend" && p.age >= 21); return { data: { id: f.id }, message: `${f.firstName} is getting married and invited you to a wild ${f.gender === "male" ? "bachelor" : "bachelorette"} weekend.` }; },
    options: ["Go all out", "Go but take it easy", "Stay home"],
    resolve: (L, d, c) => {
      const f = findRel(L, d.id);
      if (c === 2) { if (f) updateRel(L, f.id, (x) => { x.bond -= 10; }); return "I skipped the party weekend."; }
      if (f) { touch(L, f.id); updateRel(L, f.id, (x) => { x.bond += 12; }); }
      bump(L, "parties");
      if (c === 1) { L.money -= 400; adjust(L, { happiness: 7 }); return "I had a great time at the party weekend and remembered all of it."; }
      L.money -= 1200; bump(L, "drinks", 3); adjust(L, { happiness: 12, health: -6 });
      return `🍾 The party weekend was legendary. ${pick(drunkStories).text}`;
    },
  },
  afterParty: {
    emoji: "❄️", title: "After-Party", min: 18, max: 45, when: mature18,
    message: "At an after-party, someone offers you a line of cocaine.",
    options: ["Try it", "Pass"],
    resolve: (L, d, c) => {
      if (c === 1) return "I passed on the cocaine.";
      L.money += 150; // it was free
      return takeDrug(L, "cocaine", true).message;
    },
  },
  intervention: {
    emoji: "🫂", title: "Intervention", min: 18, max: 90, when: (L) => !!L.mature && L.addictions.length > 0 && firstOf(L, (p) => p.bond >= 50 && !p.species).length > 0,
    message: "Your family and friends sat you down for an intervention about your addiction.",
    options: ["Agree to go to rehab", "Storm out"],
    resolve: (L, d, c) => {
      const loved = firstOf(L, (p) => p.bond >= 50 && !p.species);
      if (c === 0) {
        for (const p of loved) { touch(L, p.id); updateRel(L, p.id, (x) => { x.bond += 10; }); }
        if (roll(0.6)) { L.addictions = []; adjust(L, { happiness: 10, health: 10 }); return "🏥 I went to rehab with my family's support and got clean."; }
        adjust(L, { happiness: -4 }); return "I went to rehab, but I relapsed a few months later.";
      }
      for (const p of loved) updateRel(L, p.id, (x) => { x.bond -= 12; });
      adjust(L, { happiness: -6 }); return "I stormed out of my own intervention.";
    },
  },
  pregnancyScare: {
    emoji: "😰", title: "Pregnancy Scare", min: 18, max: 45, when: (L) => !!L.mature && !L.protection && romanticPartner(L) && romanticPartner(L).gender !== L.gender,
    make: (L) => { const p = romanticPartner(L); return { data: { id: p.id }, message: `${L.gender === "female" ? "You're" : `${p.firstName} is`} late. It might be a pregnancy.` }; },
    options: ["Take a test together", "Panic"],
    resolve: (L, d, c) => {
      const p = findRel(L, d.id);
      if (!p) return "False alarm.";
      touch(L, p.id);
      if (c === 0) updateRel(L, p.id, (x) => { x.bond += 6; }); else adjust(L, { happiness: -5 });
      const baby = maybePregnancy(L, p.gender, p.firstName, 0.5);
      return baby ? `It's positive!${baby}` : "😮‍💨 False alarm. The test was negative.";
    },
  },
  strippoker: {
    emoji: "🃏", title: "Party Game", min: 18, max: 40, when: mature18,
    message: "Someone at the party suggests strip poker.",
    options: ["Deal me in", "I'll watch", "Leave"],
    resolve: (L, d, c) => {
      if (c === 2) return "I left before the strip poker started.";
      bump(L, "parties");
      if (c === 1) { adjust(L, { happiness: 4 }); return "I watched the strip poker game. Someone lost everything but their socks."; }
      if (roll(0.25 + L.stats.smarts / 300)) { adjust(L, { happiness: 9 }); return "🃏 I cleaned up at strip poker and kept my clothes on."; }
      adjust(L, { happiness: rnd(-3, 6) }); return "🃏 I lost badly at strip poker. Down to my underwear by midnight.";
    },
  },
});
