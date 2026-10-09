// LifeSim: stats for the people around you, stats children inherit from their parents,
// and meeting people one at a time (see who they are before you ask them out or befriend them).
"use strict";

// MARK: - NPC stats

const NpcStats = [
  ["looks", "✨", "Looks"], ["smarts", "🧠", "Smarts"], ["health", "❤️", "Health"],
  ["happiness", "😊", "Happiness"], ["craziness", "🌀", "Craziness"],
];

/// Fills in any missing stats (people from older saves, or made elsewhere).
function ensureNpcStats(p) {
  if (!p) return p;
  if (p.health == null) p.health = clamp(rnd(60, 100) - Math.max(0, (p.age || 0) - 55), 5, 100);
  if (p.species) return p;
  if (p.looks == null) p.looks = rnd(10, 100);
  if (p.smarts == null) p.smarts = clamp(rnd(10, 100) + (p.trait === "ambitious" ? 10 : 0), 0, 100);
  if (p.happiness == null) p.happiness = clamp(rnd(35, 95) + (p.trait === "funny" ? 10 : 0) - (p.trait === "toxic" ? 15 : 0), 0, 100);
  if (p.craziness == null) p.craziness = clamp(rnd(0, 55) + (p.trait === "jealous" || p.trait === "toxic" ? 25 : 0), 0, 100);
  return p;
}

/// One inherited stat: part parents, part luck.
function inheritStat(a, b, spread = 100) {
  const avg = (a + b) / 2;
  return clamp(Math.round(avg * 0.55 + rnd(Math.max(0, 100 - spread), 100) * 0.45 + rnd(-8, 8)), 0, 100);
}

/// Stats for a newborn, from two parents ({looks, smarts, health}).
function inheritedStats(mom, dad) {
  return {
    looks: inheritStat(mom.looks, dad.looks),
    smarts: inheritStat(mom.smarts, dad.smarts),
    // Babies are mostly healthy; a parent's constitution only nudges it.
    health: clamp(Math.round(rnd(72, 100) * 0.8 + ((mom.health + dad.health) / 2) * 0.2), 0, 100),
  };
}

const playerAsParent = (L) => ({ looks: L.stats.looks, smarts: L.stats.smarts, health: L.stats.health });
const strangerParent = () => ({ looks: rnd(10, 100), smarts: rnd(10, 100), health: rnd(50, 100) });

/// Gives a baby its parents' genes (looks, smarts, health).
function applyInheritance(child, mom, dad) {
  const s = inheritedStats(mom, dad);
  child.looks = s.looks; child.smarts = s.smarts; child.health = s.health;
  child.inherited = true;
  return child;
}

/// Each year: people's stats change a little as they age.
function progressNpcStats(L, p) {
  ensureNpcStats(p);
  if (p.species) {
    if (p.age > 6) p.health = clamp(p.health - rnd(0, 6), 0, 100);
    return;
  }
  if (p.age < 22) p.smarts = clamp(p.smarts + rnd(0, 2), 0, 100);
  if (p.age > 50) p.health = clamp(p.health - rnd(0, 3) - (p.age > 75 ? 2 : 0), 0, 100);
  else p.health = clamp(p.health + rnd(-2, 2), 0, 100);
  if (p.age > 45) p.looks = clamp(p.looks - rnd(0, 2), 0, 100);
  // Happiness drifts toward how they feel about life and about you.
  const target = 40 + p.bond * 0.3 + (p.salary > 60000 ? 8 : 0) - (p.trait === "toxic" ? 15 : 0);
  p.happiness = clamp(Math.round(p.happiness + (target - p.happiness) * 0.25 + rnd(-6, 6)), 0, 100);
}

/// How much a person's health raises or lowers their yearly death risk.
const npcHealthFactor = (p) => 1.6 - (p.health ?? 70) / 100;

// MARK: - Meeting someone new

const MeetPlaces = {
  kid: ["at the playground", "at school", "at a birthday party", "at summer camp", "at the park"],
  teen: ["at school", "at the mall", "at a party", "at the skate park", "in an online game", "at band practice"],
  adult: ["on a dating app", "at a friend's party", "at the gym", "at a coffee shop", "at a concert", "at a bookstore", "through a coworker", "at a bar", "on a hiking trail", "at a wedding"],
};

function meetPlace(L) {
  return pick(L.age < 13 ? MeetPlaces.kid : L.age < 18 ? MeetPlaces.teen : MeetPlaces.adult);
}

/// A person you could date or befriend. Nobody is added to your life until you choose.
function makeCandidate(L, mode) {
  let age, gender;
  if (mode === "date") { age = datingAge(L, 5); gender = preferredGender(L); }
  else { age = L.age < 18 ? clamp(L.age + rnd(-1, 1), 5, 17) : Math.max(18, L.age + rnd(-6, 6)); gender = pick(["male", "female"]); }
  const p = ensureNpcStats(makePerson(mode === "date" ? "partner" : "friend", age, { gender, bond: rnd(40, 70) }));
  if (age < 18) { p.money = rnd(0, 800); p.occupation = age >= 5 ? "Student" : null; p.salary = 0; }
  p.metAt = meetPlace(L);
  return p;
}

const canAskOutCandidate = (L, p) => !romanticPartner(L) && sameDatingBand(L, p) && L.age >= 13;

/// Your odds that they say yes, from 5% to 95%.
function askOutChance(L, p) {
  let c = 0.5 + (L.stats.looks - p.looks) / 160 + (L.stats.happiness - 50) / 400;
  if (L.age >= 18 && L.money > p.money * 2 && L.money > 50000) c += 0.08;
  if (L.fame >= 30) c += 0.12;
  if (p.trait === "kind") c += 0.05;
  if (p.craziness > 70) c += 0.05; // impulsive
  return clamp(c, 0.05, 0.95);
}

function befriendChance(L, p) {
  let c = 0.7 + (L.stats.happiness - 50) / 300 + (p.happiness - 50) / 400;
  if (p.trait === "toxic") c -= 0.1;
  return clamp(c, 0.15, 0.97);
}

/// Acts on a candidate: "date" asks them out, "friend" tries to befriend them.
function approachCandidate(L, p, as) {
  if (inPrison(L)) return out(L, "Meeting people", "I can't meet anyone from prison.", false);
  if (as === "date") {
    if (!canAskOutCandidate(L, p)) return out(L, "Dating", romanticPartner(L) ? "I'm already in a relationship." : "That wouldn't be appropriate.", false);
    if (!roll(askOutChance(L, p))) {
      adjust(L, { happiness: -4 });
      return out(L, "Dating", `💔 I met ${relName(p)} ${p.metAt} and asked them out. ${pick(["They said they weren't interested.", "They laughed and walked away.", "They gave me a fake number.", "They said they're seeing someone."])}`);
    }
    p.kind = "partner"; p.lastContact = L.age; p.bond = rnd(55, 80);
    L.relationships.push(p);
    bump(L, "partners");
    adjust(L, { happiness: 10 });
    return out(L, "Dating", remember(L, p, `❤️ I met ${relName(p)} (${p.age}) ${p.metAt}. I asked them out and we started dating!`));
  }
  if (!roll(befriendChance(L, p))) {
    adjust(L, { happiness: -2 });
    return out(L, "New friend", `I tried to befriend ${relName(p)} ${p.metAt}, but we didn't really click.`);
  }
  p.kind = "friend"; p.lastContact = L.age; p.bond = rnd(40, 65);
  L.relationships.push(p);
  adjust(L, { happiness: 4 });
  let m = `🤝 I met ${relName(p)} ${p.metAt} and we became friends.`;
  const partner = romanticPartner(L);
  if (partner && partner.trait === "jealous") {
    updateRel(L, partner.id, (x) => { x.bond -= 8; });
    m += ` ${partner.firstName} got jealous of how much time I spend with them.`;
  }
  return out(L, "New friend", remember(L, p, m));
}

/// Short stat line for event text.
const statLine = (p) => `Looks ${p.looks}% · Smarts ${p.smarts}% · Health ${p.health}% · Craziness ${p.craziness}%`;

// MARK: - Partner drama driven by craziness

Object.assign(SIMPLE_EVENTS, {
  partnerDrama: {
    emoji: "🌀", title: "Drama", min: 16, max: 90,
    when: (L) => { const p = romanticPartner(L); return p && ensureNpcStats(p).craziness >= 65; },
    make: (L) => {
      const p = romanticPartner(L);
      const what = pick([
        `went through your phone while you were asleep`,
        `showed up at your work and made a scene`,
        `accused you of flirting with a waiter`,
        `threw your clothes out of the window after an argument`,
        `tattooed your name on their arm without telling you`,
      ]);
      return { data: { id: p.id }, message: `${relName(p)} ${what}.` };
    },
    options: ["Talk it through calmly", "Yell back", "Say you need space"],
    resolve: (L, d, c) => {
      const p = findRel(L, d.id);
      if (!p) return "It blew over.";
      touch(L, p.id);
      if (c === 0) {
        if (roll(0.6)) { updateRel(L, p.id, (x) => { x.bond += 4; x.craziness = Math.max(0, x.craziness - 5); }); return remember(L, p, `We talked it through calmly. ${p.firstName} promised to work on it.`); }
        updateRel(L, p.id, (x) => { x.bond -= 4; }); adjust(L, { happiness: -4 }); return remember(L, p, `I tried to stay calm, but ${p.firstName} wasn't having it.`);
      }
      if (c === 1) { updateRel(L, p.id, (x) => { x.bond -= rnd(8, 15); }); adjust(L, { happiness: -6 }); return remember(L, p, `We screamed at each other until the neighbors called the police.`); }
      updateRel(L, p.id, (x) => { x.bond -= rnd(3, 8); }); adjust(L, { happiness: 2 }); return remember(L, p, `I told ${p.firstName} I needed some space.`);
    },
  },
});
