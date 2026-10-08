// LifeSim: deeper relationships (memories, people living their own lives, new interactions, exes),
// school life (classmates and teachers) and a livelier childhood.
// Romance between characters only happens within the same age band: teens (13–17) with teens, adults with adults.
// Anything sexual is adults-only and lives behind Mature Mode in mature.js.
"use strict";

// MARK: Helpers

/// Picks an age for a romantic interest that keeps teens with teens and adults with adults.
function datingAge(L, spread = 4) {
  if (L.age < 18) return clamp(L.age + rnd(-1, 1), 13, 17);
  return Math.max(18, L.age + rnd(-spread, spread));
}

/// Whether the player and this person are in the same dating age band.
function sameDatingBand(L, p) {
  if (L.age >= 13 && L.age <= 17) return p.age >= 13 && p.age <= 17;
  return L.age >= 18 && p.age >= 18;
}

const canDate = (L, p) => !romanticPartner(L) && sameDatingBand(L, p) && !p.species;

/// Turns a partner into an ex instead of deleting them, so they stay part of your story.
function becomeEx(L, p) {
  p.kind = "ex";
  p.bond = Math.max(0, p.bond - 20);
  p.yearsTogether = 0;
}

/// Adds a line to this person's shared history and returns the text.
function remember(L, p, text) {
  const person = findRel(L, p.id);
  if (person) {
    person.history = person.history || [];
    person.history.push({ age: L.age, text });
    if (person.history.length > 8) person.history.shift();
  }
  return text;
}

const friendlyActions = new Set(["spendTime", "conversation", "gift", "hangOut", "deepTalk", "hug"]);

/// People on bad terms with you sometimes refuse to see you.
function rejectionText(L, p, action) {
  if (!friendlyActions.has(action) || p.species) return null;
  const threshold = p.kind === "ex" ? 40 : 25;
  if (p.bond >= threshold || !roll(p.kind === "ex" ? 0.5 : 0.4)) return null;
  updateRel(L, p.id, (x) => { x.bond -= 1; });
  return `🚪 ${p.firstName} ${pick(["doesn't want to see me right now", "left me on read", "said they're busy. Again.", "won't return my calls"])}.`;
}

// MARK: New relationship actions

const EXTRA_REL = {
  hangOut: "Hang Out", deepTalk: "Have a Deep Talk", hug: "Give a Hug", apologize: "Apologize", askAdvice: "Ask for Advice",
  askForToy: "Ask for a Toy", befriend: "Befriend", askOut: "Ask Out 💌", getBackTogether: "Get Back Together", hookUpWith: "Hook Up 🔥",
  askHelp: "Ask for Help", suckUp: "Suck Up", disrespect: "Talk Back",
};

function extraRelActions(L, p) {
  if (p.species || p.kind === "teacher") return [];
  const list = ["hangOut"];
  if (L.age >= 10) list.push("deepTalk");
  if (p.kind !== "classmate" && p.kind !== "ex") list.push("hug");
  if (p.bond < 70) list.push("apologize");
  if ((isParent(p.kind) || ((p.kind === "sibling" || p.kind === "friend") && p.age > L.age)) && L.age >= 8) list.push("askAdvice");
  if (isParent(p.kind) && L.age < 13) list.push("askForToy");
  if (p.kind === "classmate") list.unshift("befriend");
  if ((p.kind === "friend" || p.kind === "classmate") && canDate(L, p)) list.push("askOut");
  if (p.kind === "ex" && canDate(L, p)) list.push("getBackTogether");
  if (isMature(L) && p.age >= 18 && (p.kind === "friend" || p.kind === "ex" || p.kind === "classmate")) list.push("hookUpWith");
  return list;
}

function hangOutIdea(L) {
  if (L.age < 13) return pick(["played tag", "built a pillow fort", "had a water balloon fight", "played video games", "drew comics together"]);
  if (L.age < 18) return pick(["went to the mall", "played video games all night", "hung out at the skate park", "binge-watched a show", "got milkshakes"]);
  if (L.age < 60) return pick(["grabbed dinner", "went bowling", "did karaoke", "went on a road trip", "watched the game", "went hiking"]);
  return pick(["played bingo", "went to the farmers' market", "had tea and gossiped", "went fishing", "did a jigsaw puzzle"]);
}

const secrets = [
  "they've been feeling lost lately", "they're thinking about changing careers", "they've had a crush on someone for years",
  "they're secretly in debt", "they've always looked up to me", "they're scared of getting old", "they've been seeing a therapist",
];

function performExtraRelAction(L, action, p) {
  const name = p.firstName;
  const pr = pronoun(p.gender);
  const upd = (fn) => updateRel(L, p.id, fn);
  const done = (text) => out(L, relName(p), remember(L, p, text));
  const rejection = rejectionText(L, p, action);
  if (rejection) return done(rejection);

  switch (action) {
    case "hangOut": {
      const idea = hangOutIdea(L);
      if (p.trait === "toxic" && roll(0.4)) { upd((x) => { x.bond -= 4; }); adjust(L, { happiness: -3 }); return done(`${name} and I ${idea}, but ${pr.subject} complained the whole time.`); }
      upd((x) => { x.bond += rnd(4, 10) + (p.trait === "funny" ? 3 : 0); });
      adjust(L, { happiness: rnd(3, 7) + (p.trait === "funny" ? 2 : 0) });
      return done(`${name} and I ${idea}.`);
    }
    case "deepTalk":
      if (p.bond >= 45 || roll(0.4)) {
        upd((x) => { x.bond += rnd(6, 12); });
        adjust(L, { happiness: 3 });
        return done(`💬 ${name} and I talked for hours. ${cap(pr.subject)} told me ${pick(secrets)}.`);
      }
      upd((x) => { x.bond -= 2; });
      return done(`I tried to have a deep talk with ${name}, but ${pr.subject} kept changing the subject.`);
    case "hug":
      upd((x) => { x.bond += rnd(2, 6); });
      adjust(L, { happiness: 2 });
      return done(`🤗 I gave ${name} a big hug.`);
    case "apologize":
      if (p.trait === "toxic" && roll(0.5)) { return done(`I apologized to ${name}. ${cap(pr.subject)} said "whatever."`); }
      upd((x) => { x.bond += rnd(5, 15); });
      L.karma += 1;
      return done(`🙏 I apologized to ${name} for everything. ${cap(pr.subject)} appreciated it.`);
    case "askAdvice": {
      upd((x) => { x.bond += rnd(2, 6); });
      adjust(L, { smarts: rnd(0, 2), happiness: 2 });
      const advice = p.occupation && p.occupation !== "Unemployed" && p.occupation !== "Retired"
        ? `${name}, who works as a ${p.occupation.toLowerCase()}, told me to ${pick(["never stop learning", "save more than I spend", "trust my gut", "be patient with people"])}.`
        : `${name} told me to ${pick(["follow my heart", "stay in school", "be kind to everyone", "never trust a man in a fedora"])}.`;
      return done(`💡 ${advice}`);
    }
    case "askForToy":
      if (p.money > 200 && roll(p.bond / 110 + (p.trait === "generous" ? 0.2 : 0))) {
        const toy = pick(["a remote-control car", "a giant stuffed bear", "a new video game", "a bike", "a toy dinosaur", "a doll house"]);
        upd((x) => { x.money -= 60; x.bond += 2; });
        adjust(L, { happiness: 8 });
        return done(`🎁 My ${relTitle(p).toLowerCase()} bought me ${toy}!`);
      }
      upd((x) => { x.bond -= 1; });
      adjust(L, { happiness: -3 });
      return done(`My ${relTitle(p).toLowerCase()} said "maybe for your birthday."`);
    case "befriend":
      if (roll(0.35 + p.bond / 150 + L.popularity / 300)) {
        upd((x) => { x.kind = "friend"; x.bond += 15; });
        adjust(L, { happiness: 6 });
        return done(`🤝 ${name} and I are friends now!`);
      }
      upd((x) => { x.bond -= 3; });
      adjust(L, { happiness: -3 });
      return done(`I tried to make friends with ${name}, but ${pr.subject} sat with someone else at lunch.`);
    case "askOut":
      if (!canDate(L, p)) return out(L, relName(p), "That's not possible right now.", false);
      if (roll(p.bond / 140 + L.stats.looks / 300)) {
        upd((x) => { x.kind = "partner"; x.bond += 12; x.yearsTogether = 0; });
        bump(L, "partners");
        adjust(L, { happiness: 12 });
        return done(`💕 I asked ${name} out and ${pr.subject} said yes! We're dating now.`);
      }
      upd((x) => { x.bond -= 10; });
      adjust(L, { happiness: -8 });
      return done(`I asked ${name} out. ${cap(pr.subject)} said ${pick(["\"I just see you as a friend.\"", "no, and now it's awkward.", "\"let's not ruin our friendship.\""])}`);
    case "getBackTogether":
      if (!canDate(L, p)) return out(L, relName(p), "That's not possible right now.", false);
      if (roll(p.bond / 120)) {
        upd((x) => { x.kind = "partner"; x.bond += 15; x.yearsTogether = 0; });
        adjust(L, { happiness: 10 });
        return done(`💞 ${name} and I got back together.`);
      }
      upd((x) => { x.bond -= 8; });
      adjust(L, { happiness: -6 });
      return done(`${name} said there's no going back.`);
    case "hookUpWith": {
      if (!isMature(L) || p.age < 18) return out(L, relName(p), "That's not available.", false);
      if (!roll(0.3 + p.bond / 150 + L.stats.looks / 300)) {
        upd((x) => { x.bond -= 8; });
        adjust(L, { happiness: -4 });
        return done(`😬 I made a move on ${name}. ${cap(pr.subject)} turned me down.`);
      }
      bump(L, "partners");
      adjust(L, { happiness: rnd(6, 11) });
      upd((x) => { x.bond += rnd(-6, 10); });
      let m = `🔥 ${name} and I hooked up. ${pick(["Things got complicated.", "Neither of us regrets it.", "We agreed to never speak of it again."])}`;
      m += maybeStd(L, L.protection ? 0.01 : 0.05);
      if (!L.protection) m += maybePregnancy(L, p.gender, name, 0.1);
      if (romanticPartner(L) && romanticPartner(L).id !== p.id) m += caughtCheating(L, 0.4);
      return done(m);
    }
    case "askHelp":
      upd((x) => { x.bond += rnd(3, 8); });
      L.schoolGrades = Math.min(100, L.schoolGrades + rnd(2, 6));
      if (L.enrollment) L.enrollment.grades = Math.min(100, L.enrollment.grades + rnd(2, 6));
      adjust(L, { smarts: rnd(1, 2) });
      return done(`📚 ${name} stayed after class to help me understand the material.`);
    case "suckUp":
      upd((x) => { x.bond += rnd(4, 9); });
      L.schoolGrades = Math.min(100, L.schoolGrades + 2);
      L.popularity = Math.max(0, L.popularity - 3);
      return done(`🍎 I brought ${name} an apple. My classmates called me a teacher's pet.`);
    case "disrespect":
      upd((x) => { x.bond -= rnd(8, 15); });
      L.schoolGrades = Math.max(0, L.schoolGrades - 4);
      if (roll(0.5)) { adjust(L, { happiness: -4 }); return done(`I talked back to ${name} and got detention.`); }
      L.popularity = Math.min(100, L.popularity + 4);
      adjust(L, { happiness: 3 });
      return done(`I talked back to ${name}. The whole class laughed.`);
  }
  return out(L, relName(p), "Nothing happened.", false);
}

// MARK: School people

function schoolStageOf(L) {
  if (inPrison(L)) return null;
  if (L.enrollment) return L.enrollment.kind === "university" ? "university" : `grad-${L.enrollment.field}`;
  if (!inGradeSchool(L)) return null;
  return L.age < 12 ? "elementary" : "high";
}

function refreshSchoolPeople(L) {
  const stage = schoolStageOf(L);
  if (stage === (L.schoolStage || null)) return;
  // Leaving a school: classmates you never befriended fade out of your life.
  L.relationships = L.relationships.filter((p) => p.kind !== "classmate" && p.kind !== "teacher");
  L.schoolStage = stage;
  if (!stage) return;
  const count = stage === "elementary" || stage === "high" ? 6 : 5;
  for (let i = 0; i < count; i++) {
    const c = makePerson("classmate", stage.startsWith("grad") || stage === "university" ? rnd(Math.max(18, L.age - 1), L.age + 3) : clamp(L.age + rnd(-1, 0), 5, 17), { bond: rnd(20, 55) });
    if (c.age < 18) { c.occupation = null; c.salary = 0; c.money = 0; }
    c.lastContact = L.age;
    L.relationships.push(c);
  }
  const t = makePerson("teacher", rnd(26, 62), { bond: rnd(35, 60) });
  t.occupation = stage === "elementary" || stage === "high" ? "Teacher" : "Professor";
  t.lastContact = L.age;
  L.relationships.push(t);
  const where = { elementary: "elementary school", high: "high school", university: "university" }[stage] || "grad school";
  record(L, `🏫 I met my new classmates at ${where}.`);
}

// MARK: People living their own lives

function progressPeople(L) {
  refreshSchoolPeople(L);

  for (const p of L.relationships) {
    if (!p.isAlive || p.species || p.kind === "teacher" || p.kind === "classmate" || p.age < 18 || p.bond < 25) continue;
    if (!roll(0.07)) continue;
    const who = `My ${relTitle(p).toLowerCase()} ${p.firstName}`;
    const options = [];
    if (!p.married && p.age >= 22 && p.age <= 50 && !isRomantic(p.kind) && !isParent(p.kind)) options.push(() => { p.married = true; return `💍 ${who} got married.`; });
    if (p.married && p.age >= 24 && p.age <= 42) options.push(() => { p.kids = (p.kids || 0) + 1; return `👶 ${who} had a baby.`; });
    if (p.salary > 0) options.push(() => { p.salary = Math.trunc(p.salary * 1.2); return `📈 ${who} got promoted.`; });
    const livesWithYou = (isParent(p.kind) || p.kind === "sibling") && L.age < 18;
    if (!isRomantic(p.kind) && p.kind !== "child" && !livesWithYou) options.push(() => { p.bond = Math.max(0, p.bond - 8); return `📦 ${who} moved to ${pick(Names.places)[0]}. We don't see each other as much.`; });
    options.push(() => `🐕 ${who} adopted a ${pick(["puppy", "kitten", "rescue dog", "parrot"])}.`);
    if (p.age >= 55) options.push(() => `🏥 ${who} was hospitalized for a few days but is recovering.`);
    const text = pick(options)();
    record(L, text);
    remember(L, p, text);
  }

  // Birthdays: people who love you remember.
  const close = L.relationships.filter((p) => p.isAlive && !p.species && p.bond >= 75 && p.kind !== "classmate" && p.kind !== "teacher" && p.kind !== "ex");
  if (close.length && roll(0.5)) {
    const p = pick(close);
    if (L.age < 18 || roll(0.5)) {
      const gift = L.age < 18 ? rnd(10, 60) : rnd(20, 200);
      L.money += gift;
      adjust(L, { happiness: 4 });
      record(L, remember(L, p, `🎂 ${p.firstName} gave me ${formatMoney(gift)} for my birthday.`));
    } else {
      adjust(L, { happiness: 8 });
      record(L, remember(L, p, `🎉 ${p.firstName} threw me a surprise birthday party!`));
    }
  }
}

// MARK: Childhood activities

const KidActivities = [
  { id: "playOutside", title: "Play Outside", emoji: "🌳", min: 3, sub: "Run around until dinner" },
  { id: "cartoons", title: "Watch Cartoons", emoji: "📺", min: 2, sub: "Saturday morning vibes" },
  { id: "videoGames", title: "Play Video Games", emoji: "🎮", min: 5, sub: "Just one more level" },
  { id: "fort", title: "Build a Fort", emoji: "🏰", min: 4, sub: "Blankets and couch cushions" },
  { id: "sleepover", title: "Have a Sleepover", emoji: "🛌", min: 6, sub: "Invite a friend" },
  { id: "instrument", title: "Practice an Instrument", emoji: "🎹", min: 6, sub: "Piano, violin or drums" },
  { id: "comics", title: "Read Comics", emoji: "🦸", min: 6, sub: "Superheroes!" },
  { id: "lemonade", title: "Run a Lemonade Stand", emoji: "🍋", min: 6, sub: "Make some money" },
];

function doKidActivity(L, id) {
  const a = KidActivities.find((x) => x.id === id);
  let m;
  switch (id) {
    case "playOutside":
      if (roll(0.12)) { adjust(L, { health: -4 }); m = "I scraped my knee falling off the monkey bars."; }
      else { adjust(L, { happiness: rnd(3, 7), health: rnd(1, 3) }); m = `I ${pick(["climbed trees", "rode my bike around the block", "caught frogs at the creek", "played hide and seek"])} until the streetlights came on.`; }
      break;
    case "cartoons": adjust(L, { happiness: rnd(3, 6), smarts: -1 }); m = `I watched ${pick(["three hours", "a whole season", "the same episode twice"])} of cartoons.`; break;
    case "videoGames": adjust(L, { happiness: rnd(4, 8), health: -1 }); m = `I played ${pick(["racing games", "a dragon adventure game", "a block-building game", "a soccer game"])} all afternoon.`; break;
    case "fort": adjust(L, { happiness: rnd(4, 8), smarts: 1 }); m = "I built an epic blanket fort. No grown-ups allowed."; break;
    case "sleepover": {
      const friend = pickOf(L, (p) => p.kind === "friend" || p.kind === "classmate");
      if (!friend) { adjust(L, { happiness: -2 }); m = "I wanted to have a sleepover, but I don't have anyone to invite."; break; }
      touch(L, friend.id);
      updateRel(L, friend.id, (x) => { x.bond += rnd(6, 12); if (x.kind === "classmate" && x.bond >= 60) x.kind = "friend"; });
      adjust(L, { happiness: rnd(6, 10) });
      m = remember(L, friend, `🛌 ${friend.firstName} slept over. We stayed up telling ghost stories.`);
      break;
    }
    case "instrument": adjust(L, { smarts: rnd(1, 3), happiness: roll(0.3) ? -2 : 2 }); m = `I practiced the ${pick(["piano", "violin", "drums", "guitar", "recorder"])}. ${pick(["I'm getting better!", "The neighbors complained.", "My parents pretended to love it."])}`; break;
    case "comics": adjust(L, { smarts: 1, happiness: 3 }); m = "I read a stack of comic books."; break;
    case "lemonade": {
      const earned = roll(0.2) ? 0 : rnd(3, 25);
      L.money += earned;
      adjust(L, { happiness: earned ? 5 : -2 });
      m = earned ? `🍋 My lemonade stand made ${formatMoney(earned)}!` : "🍋 Nobody bought my lemonade. I drank it all myself.";
      break;
    }
  }
  return out(L, a.title, m);
}

// MARK: More childhood events & relationship events

Object.assign(SIMPLE_EVENTS, {
  firstDayOfSchool: {
    emoji: "🎒", title: "First Day of School", min: 5, max: 5, weight: 4, message: "It's your very first day of school!",
    options: ["Say hi to everyone", "Hide behind my parent", "Cry"],
    resolve: (L, d, c) => {
      const mates = L.relationships.filter((p) => p.kind === "classmate");
      if (c === 0) { for (const p of mates) updateRel(L, p.id, (x) => { x.bond += rnd(3, 10); }); L.popularity = Math.min(100, L.popularity + 8); adjust(L, { happiness: 6 }); return "I said hi to everyone. I think I'm going to like school!"; }
      if (c === 1) { adjust(L, { happiness: -2 }); return "I hid behind my parent until the teacher coaxed me inside."; }
      adjust(L, { happiness: -4 }); L.popularity = Math.max(0, L.popularity - 4); return "I cried on my first day of school. The teacher gave me a sticker.";
    },
  },
  snowDay: {
    emoji: "☃️", title: "Snow Day!", min: 5, max: 13, message: "School is cancelled because of a blizzard!",
    options: ["Build a snowman", "Snowball fight with classmates", "Stay in bed"],
    resolve: (L, d, c) => {
      if (c === 0) { adjust(L, { happiness: 6 }); return `I built a snowman and named him ${pick(["Frosty", "Gerald", "Sir Chills", "Bob"])}.`; }
      if (c === 1) {
        for (const p of L.relationships.filter((x) => x.kind === "classmate")) { touch(L, p.id); updateRel(L, p.id, (x) => { x.bond += rnd(2, 6); }); }
        if (roll(0.2)) { adjust(L, { health: -3, happiness: 3 }); return "I got hit in the face with an ice ball, but I won the snowball fight."; }
        adjust(L, { happiness: 8 }); return "I had an epic snowball fight with my classmates.";
      }
      adjust(L, { happiness: 4 }); return "I stayed in bed all day with hot chocolate.";
    },
  },
  talentShow: {
    emoji: "🎤", title: "Talent Show", min: 7, max: 15, message: "Your school is holding a talent show.",
    options: ["Sing a song", "Do a magic trick", "Watch from the crowd"],
    resolve: (L, d, c) => {
      if (c === 2) return "I watched the talent show from the crowd.";
      if (roll(0.3 + L.stats.looks / 300 + L.stats.smarts / 400)) { L.popularity = Math.min(100, L.popularity + 10); adjust(L, { happiness: 10 }); return c === 0 ? "🏆 My song won the talent show!" : "🏆 My magic trick wowed everyone. I won the talent show!"; }
      L.popularity = Math.max(0, L.popularity - 5); adjust(L, { happiness: -6 }); return c === 0 ? "I forgot the words halfway through my song." : "My magic trick failed and the rabbit escaped into the gym.";
    },
  },
  scienceFair: {
    emoji: "🧪", title: "Science Fair", min: 8, max: 15, message: "The science fair is next week. What's your project?",
    options: ["Baking-soda volcano", "Build a robot", "Skip it"],
    resolve: (L, d, c) => {
      if (c === 2) return "I skipped the science fair.";
      const chance = c === 1 ? L.stats.smarts / 140 : 0.35;
      if (roll(chance)) { adjust(L, { happiness: 8, smarts: 3 }); L.schoolGrades = Math.min(100, L.schoolGrades + 5); return c === 1 ? "🤖 My robot won first prize at the science fair!" : "🌋 My volcano won second place!"; }
      adjust(L, { happiness: -3, smarts: 1 }); return c === 1 ? "My robot caught fire during the demo." : "My volcano was the fifth volcano in a row. The judges yawned.";
    },
  },
  birthdayParty: {
    emoji: "🎈", title: "Birthday Party", min: 5, max: 12, message: "Your parents are throwing you a birthday party. Who do you invite?",
    options: ["The whole class", "Just my closest friends", "No party this year"],
    resolve: (L, d, c) => {
      if (c === 2) { adjust(L, { happiness: -3 }); return "I didn't have a birthday party this year."; }
      if (c === 0) {
        for (const p of L.relationships.filter((x) => x.kind === "classmate")) { touch(L, p.id); updateRel(L, p.id, (x) => { x.bond += rnd(5, 12); }); }
        L.popularity = Math.min(100, L.popularity + 8); adjust(L, { happiness: 10 });
        return "🎂 The whole class came to my birthday party. Best. Party. Ever.";
      }
      for (const p of L.relationships.filter((x) => x.kind === "friend")) { touch(L, p.id); updateRel(L, p.id, (x) => { x.bond += rnd(5, 10); }); }
      adjust(L, { happiness: 7 }); return "🎂 I had a small birthday party with my best friends.";
    },
  },
  fieldDay: {
    emoji: "🏃", title: "Field Day", min: 6, max: 12, message: "It's field day! Are you entering the big race?",
    options: ["Race!", "Cheer from the sidelines"],
    resolve: (L, d, c) => {
      if (c === 1) { adjust(L, { happiness: 2 }); return "I cheered my classmates on at field day."; }
      if (roll(L.stats.health / 150)) { adjust(L, { happiness: 9 }); L.popularity = Math.min(100, L.popularity + 6); return "🥇 I won the race at field day!"; }
      adjust(L, { happiness: -2 }); return "I came in last in the field day race, but I finished.";
    },
  },
  schoolCrush: {
    emoji: "💘", title: "Crush", min: 13, max: 17, when: (L) => !romanticPartner(L) && L.relationships.some((p) => (p.kind === "classmate" || p.kind === "friend") && p.isAlive && p.age >= 13 && p.age <= 17),
    make: (L) => { const p = pickOf(L, (x) => (x.kind === "classmate" || x.kind === "friend") && x.age >= 13 && x.age <= 17); return { data: { id: p.id }, message: `You have a huge crush on ${relName(p)}.` }; },
    options: ["Tell them", "Slip them a note", "Keep it a secret"],
    resolve: (L, d, c) => {
      const p = findRel(L, d.id);
      if (!p) return "My crush moved away.";
      if (c === 2) { adjust(L, { happiness: -2 }); return `I kept my crush on ${p.firstName} a secret.`; }
      touch(L, p.id);
      if (canDate(L, p) && roll(p.bond / 120 + L.stats.looks / 250 + (c === 1 ? 0.05 : 0))) {
        updateRel(L, p.id, (x) => { x.kind = "partner"; x.bond += 15; x.yearsTogether = 0; });
        bump(L, "partners"); adjust(L, { happiness: 12 });
        return `💕 ${p.firstName} likes me too! We're going out now.`;
      }
      updateRel(L, p.id, (x) => { x.bond -= 5; }); adjust(L, { happiness: -7 });
      return `${p.firstName} said ${pronoun(p.gender).subject} just wants to be friends.`;
    },
  },
  anniversary: {
    emoji: "💝", title: "Anniversary", min: 18, max: 110, weight: 2, when: (L) => !!spouseOf(L) && spouseOf(L).yearsTogether >= 1,
    make: (L) => { const s = spouseOf(L); return { data: { id: s.id }, message: `It's your anniversary with ${s.firstName}.` }; },
    options: ["Plan a romantic dinner ($300)", "Get a small gift ($50)", "Forget about it"],
    resolve: (L, d, c) => {
      const s = findRel(L, d.id);
      if (!s) return "Never mind.";
      touch(L, s.id);
      if (c === 0) { L.money -= 300; updateRel(L, s.id, (x) => { x.bond += rnd(10, 16); }); adjust(L, { happiness: 7 }); return remember(L, s, `💝 I took ${s.firstName} to a candlelit anniversary dinner.`); }
      if (c === 1) { L.money -= 50; updateRel(L, s.id, (x) => { x.bond += rnd(3, 7); }); return remember(L, s, `I gave ${s.firstName} a small anniversary gift.`); }
      updateRel(L, s.id, (x) => { x.bond -= 15; }); adjust(L, { happiness: -4 });
      return remember(L, s, `I forgot our anniversary. ${s.firstName} is furious.`);
    },
  },
  exReachesOut: {
    emoji: "📱", title: "Blast from the Past", min: 16, max: 80, when: (L) => L.relationships.some((p) => p.kind === "ex" && p.isAlive),
    make: (L) => { const p = pickOf(L, (x) => x.kind === "ex"); return { data: { id: p.id }, message: `Your ex ${relName(p)} messaged you out of the blue: "I've been thinking about you."` }; },
    options: ["Meet up for coffee", "Ignore them", "Block them"],
    resolve: (L, d, c) => {
      const p = findRel(L, d.id);
      if (!p) return "Never mind.";
      if (c === 0) {
        touch(L, p.id); updateRel(L, p.id, (x) => { x.bond += rnd(5, 15); });
        if (canDate(L, p) && roll(0.35)) { updateRel(L, p.id, (x) => { x.kind = "partner"; x.yearsTogether = 0; }); adjust(L, { happiness: 8 }); return remember(L, p, `☕ I met ${p.firstName} for coffee and the old spark came back. We're back together.`); }
        adjust(L, { happiness: 3 }); return remember(L, p, `☕ I had coffee with ${p.firstName}. It was nice to catch up.`);
      }
      if (c === 1) return `I ignored my ex ${p.firstName}.`;
      updateRel(L, p.id, (x) => { x.bond = 0; }); return `I blocked my ex ${p.firstName} everywhere.`;
    },
  },
});
