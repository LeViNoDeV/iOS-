// LifeSim: extra BitLife-style popup events for every stage of life.
// Each entry: { emoji, title, min, max, when?(L), weight?, make?(L) -> { data, message }, message?, options, resolve(L, data, choice) -> log text }
"use strict";

const firstOf = (L, test) => L.relationships.filter((p) => p.isAlive && test(p));
const pickOf = (L, test) => { const all = firstOf(L, test); return all.length ? pick(all) : null; };

const SIMPLE_EVENTS = {
  // MARK: Childhood
  imaginaryFriend: {
    emoji: "🧸", title: "Imaginary Friend", min: 3, max: 7,
    make: () => { const name = pick(["Mr. Sprinkles", "Captain Fuzz", "Bloop", "Zorbo", "Princess Pickle"]); return { data: { name }, message: `You've been playing with an imaginary friend named ${name}.` }; },
    options: ["Keep playing with them", "Say goodbye"],
    resolve: (L, d, c) => {
      if (c === 0) { adjust(L, { happiness: 5, smarts: 1 }); return `${d.name} and I went on a thousand adventures together.`; }
      adjust(L, { happiness: -2 }); return `I said goodbye to ${d.name}. I'm a big kid now.`;
    },
  },
  lostTooth: {
    emoji: "🦷", title: "Wiggly Tooth", min: 5, max: 8, message: "Your tooth just fell out!",
    options: ["Put it under my pillow", "Keep it in a jar"],
    resolve: (L, d, c) => {
      if (c === 0) { const cash = rnd(1, 5); L.money += cash; adjust(L, { happiness: 4 }); return `The tooth fairy left me ${formatMoney(cash)}!`; }
      return "I kept my tooth in a jar on my shelf. My parents think it's weird.";
    },
  },
  strangerCandy: {
    emoji: "🍬", title: "Stranger Danger", min: 5, max: 11, message: "A stranger in a parked van offers you free candy.",
    options: ["Take the candy", "Run away", "Tell my parents"],
    resolve: (L, d, c) => {
      if (c === 0) {
        if (roll(0.6)) { adjust(L, { happiness: 3 }); return "It was just the ice cream truck driver giving out samples. Phew."; }
        adjust(L, { happiness: -6 }); for (const p of firstOf(L, (x) => isParent(x.kind))) updateRel(L, p.id, (x) => { x.bond -= 4; });
        return "My parents found out and gave me a very long talk about strangers.";
      }
      if (c === 1) return "I ran home as fast as I could.";
      for (const p of firstOf(L, (x) => isParent(x.kind))) { touch(L, p.id); updateRel(L, p.id, (x) => { x.bond += 5; }); }
      L.karma += 2; return "I told my parents and they called the police. They were proud of me.";
    },
  },
  brokenToy: {
    emoji: "🧩", title: "Broken Toy", min: 4, max: 12, when: (L) => firstOf(L, (p) => p.kind === "sibling").length > 0,
    make: (L) => { const s = pickOf(L, (p) => p.kind === "sibling"); return { data: { id: s.id }, message: `Your ${relTitle(s).toLowerCase()} ${s.firstName} broke your favorite toy.` }; },
    options: ["Forgive them", "Tell on them", "Break their toy back"],
    resolve: (L, d, c) => {
      const s = findRel(L, d.id); if (!s) return "Never mind."; touch(L, s.id);
      if (c === 0) { updateRel(L, s.id, (x) => { x.bond += 8; }); L.karma += 1; return `I forgave ${s.firstName}. It was just a toy.`; }
      if (c === 1) { updateRel(L, s.id, (x) => { x.bond -= 5; }); return `I told on ${s.firstName}, who got grounded.`; }
      updateRel(L, s.id, (x) => { x.bond -= 15; }); adjust(L, { happiness: 3 }); return `I smashed ${s.firstName}'s favorite toy. We're even now.`;
    },
  },
  lunchMoney: {
    emoji: "🥪", title: "Lunch Money", min: 6, max: 12, message: "A bigger kid demands your lunch money.",
    options: ["Hand it over", "Refuse", "Tell a teacher"],
    resolve: (L, d, c) => {
      if (c === 0) { adjust(L, { happiness: -4 }); return "I handed over my lunch money and went hungry."; }
      if (c === 1) {
        if (roll(0.5)) { adjust(L, { happiness: 6 }); L.popularity = Math.min(100, L.popularity + 4); return "I stood my ground and the kid backed off!"; }
        adjust(L, { health: -6, happiness: -5 }); return "I refused and got pushed into the mud.";
      }
      adjust(L, { happiness: 2 }); return "I told a teacher and the kid got detention.";
    },
  },
  spellingBee: {
    emoji: "🐝", title: "Spelling Bee", min: 7, max: 13, message: "Your school is holding a spelling bee.",
    options: ["Enter it", "Skip it"],
    resolve: (L, d, c) => {
      if (c === 1) return "I skipped the spelling bee.";
      if (roll(L.stats.smarts / 130)) { L.money += 50; adjust(L, { happiness: 10, smarts: 2 }); L.schoolGrades += 3; return "🏆 I won the spelling bee and a $50 prize!"; }
      adjust(L, { happiness: -4 }); return `I was knocked out on the word "${pick(["onomatopoeia", "rhythm", "necessary", "Wednesday", "mischievous"])}".`;
    },
  },
  schoolPlay: {
    emoji: "🎭", title: "School Play", min: 6, max: 14, message: "Tryouts for the school play are this week.",
    options: ["Try out for the lead", "Join the stage crew", "Skip it"],
    resolve: (L, d, c) => {
      if (c === 0) {
        if (roll(0.25 + L.stats.looks / 200)) { adjust(L, { happiness: 10, looks: 1 }); L.popularity = Math.min(100, L.popularity + 8); return "I landed the lead role and got a standing ovation!"; }
        adjust(L, { happiness: -5 }); return "I got cast as Tree #3.";
      }
      if (c === 1) { adjust(L, { happiness: 4, smarts: 1 }); return "I helped build the sets. The play looked amazing."; }
      return "I skipped the school play tryouts.";
    },
  },
  summerCamp: {
    emoji: "🏕️", title: "Summer Camp", min: 8, max: 15, message: "Your parents ask if you want to go to summer camp.",
    options: ["Go to camp", "Stay home"],
    resolve: (L, d, c) => {
      if (c === 1) { adjust(L, { happiness: 1 }); return "I spent the summer playing video games."; }
      if (roll(0.15)) { adjust(L, { happiness: -5, health: -4 }); return "I got poison ivy on the first day of camp."; }
      const f = makePerson("friend", L.age + rnd(-1, 1), { bond: rnd(50, 75) });
      f.lastContact = L.age; L.relationships.push(f);
      adjust(L, { happiness: 10, health: 3 }); return `I had the best summer ever at camp and made a new friend, ${relName(f)}.`;
    },
  },

  // MARK: Teens
  sneakOut: {
    emoji: "🌙", title: "Party Invite", min: 13, max: 17, message: "Your friends want you to sneak out to a party tonight.",
    options: ["Sneak out", "Stay home"],
    resolve: (L, d, c) => {
      if (c === 1) return "I stayed home. Probably for the best.";
      bump(L, "parties");
      if (roll(0.35)) {
        for (const p of firstOf(L, (x) => isParent(x.kind))) updateRel(L, p.id, (x) => { x.bond -= 8; });
        adjust(L, { happiness: -4 }); return "My parents caught me climbing back through the window. I'm grounded for a month.";
      }
      adjust(L, { happiness: 9 }); L.popularity = Math.min(100, L.popularity + 5); return "I snuck out and had the night of my life.";
    },
  },
  lockerNote: {
    emoji: "💌", title: "Secret Admirer", min: 13, max: 17, message: "Someone slipped a note in your locker: \"I like you.\"",
    options: ["Find out who it is", "Ignore it"],
    resolve: (L, d, c) => {
      if (c === 1) return "I ignored the note from my secret admirer.";
      if (!romanticPartner(L) && L.age >= 14 && roll(0.6)) {
        const p = makePerson("partner", L.age, { gender: preferredGender(L), bond: rnd(60, 85) });
        p.money = 0; p.lastContact = L.age; L.relationships.push(p); bump(L, "partners");
        adjust(L, { happiness: 10 }); return `The note was from ${relName(p)}. We started dating! 💕`;
      }
      adjust(L, { happiness: -3 }); return "It turned out to be a prank by the kids in the back row.";
    },
  },
  fakeId: {
    emoji: "🪪", title: "Fake ID", min: 16, max: 20, message: "A friend offers to make you a fake ID for $50.",
    options: ["Buy one", "No thanks"],
    resolve: (L, d, c) => {
      if (c === 1) return "I passed on the fake ID.";
      L.money -= 50;
      if (roll(0.3)) {
        L.karma -= 3; adjust(L, { happiness: -6 });
        if (L.age >= 18) { L.criminalRecord.push("Fake ID"); L.money -= 500; return "A bouncer confiscated my fake ID and called the cops. I paid a $500 fine."; }
        return "A bouncer confiscated my fake ID and called my parents.";
      }
      bump(L, "parties"); adjust(L, { happiness: 7 }); return "My fake ID worked like a charm.";
    },
  },
  viralChallenge: {
    emoji: "📹", title: "Viral Challenge", min: 12, max: 30, message: "Everyone online is doing a dangerous viral challenge.",
    options: ["Try it", "Film a friend doing it", "Skip it"],
    resolve: (L, d, c) => {
      if (c === 2) return "I skipped the challenge. It looked stupid anyway.";
      if (c === 1) { L.followers += rnd(10, 400); adjust(L, { happiness: 3 }); return "I filmed my friend doing the challenge. The video did pretty well."; }
      if (roll(0.3)) { adjust(L, { health: -rnd(8, 20), happiness: -4 }); return "I tried the challenge and ended up in the ER."; }
      const gained = rnd(100, 5000); L.followers += gained; adjust(L, { happiness: 7 });
      return `I nailed the challenge and gained ${formatCount(gained)} followers!`;
    },
  },
  learnerPermit: {
    emoji: "🚙", title: "Driving Lessons", min: 15, max: 16, when: (L) => firstOf(L, (p) => isParent(p.kind)).length > 0,
    make: (L) => { const p = pickOf(L, (x) => isParent(x.kind)); return { data: { id: p.id }, message: `Your ${relTitle(p).toLowerCase()} offers to teach you how to drive.` }; },
    options: ["Let's go!", "Maybe later"],
    resolve: (L, d, c) => {
      const p = findRel(L, d.id); if (!p) return "Never mind.";
      if (c === 1) return "I put off learning to drive.";
      touch(L, p.id);
      if (roll(0.25)) { updateRel(L, p.id, (x) => { x.bond -= 4; }); return `I backed into the mailbox. ${p.firstName} was not amused.`; }
      updateRel(L, p.id, (x) => { x.bond += 8; }); adjust(L, { happiness: 5, smarts: 1 }); return `${p.firstName} taught me to drive. I'm getting pretty good!`;
    },
  },

  // MARK: Adults
  lostDog: {
    emoji: "🐕", title: "Lost Dog", min: 12, max: 90, message: "You found a lost dog wearing a collar with a phone number.",
    options: ["Call the owner", "Keep the dog"],
    resolve: (L, d, c) => {
      if (c === 0) {
        L.karma += 4; adjust(L, { happiness: 5 });
        if (roll(0.4)) { const reward = rnd(50, 500); L.money += reward; return `I returned the dog. The owner cried and gave me a ${formatMoney(reward)} reward.`; }
        return "I returned the dog to its very happy owner.";
      }
      L.karma -= 4;
      const pet = { ...makePerson("pet", rnd(1, 6), { noTrait: true, bond: 70 }), lastName: "", firstName: pick(Names.petNames), species: "Dog", occupation: null, salary: 0, lastContact: L.age };
      L.relationships.push(pet); adjust(L, { happiness: 6 });
      return `I kept the dog and renamed it ${pet.firstName}.`;
    },
  },
  scamCall: {
    emoji: "☎️", title: "Suspicious Call", min: 18, max: 59,
    make: () => { const amount = rnd(500, 5000); return { data: { amount }, message: `A caller says they're from the tax office and you owe ${formatMoney(amount)} in back taxes, payable in gift cards.` }; },
    options: ["Pay them", "Hang up", "Report the scam"],
    resolve: (L, d, c) => {
      if (c === 0) { L.money -= d.amount; adjust(L, { happiness: -10 }); return `I sent ${formatMoney(d.amount)} in gift cards. It was a scam, obviously.`; }
      if (c === 1) return "I hung up on the scammer.";
      L.karma += 2; return "I reported the scam number to the authorities.";
    },
  },
  homeless: {
    emoji: "🥫", title: "Spare Change?", min: 16, max: 90, message: "A homeless person asks you for spare change.",
    options: ["Give $20", "Buy them lunch", "Ignore them"],
    resolve: (L, d, c) => {
      if (c === 0) { L.money -= 20; L.karma += 3; adjust(L, { happiness: 3 }); return "I gave a homeless person $20."; }
      if (c === 1) { L.money -= 15; L.karma += 4; adjust(L, { happiness: 5 }); return "I bought a homeless person lunch and we had a nice chat."; }
      L.karma -= 1; return "I walked past without making eye contact.";
    },
  },
  carBreakdown: {
    emoji: "🚗", title: "Car Trouble", min: 16, max: 90, when: (L) => L.assets.some((a) => a.kind === "car"),
    message: "Your car broke down on the highway.",
    options: ["Call a tow truck ($300)", "Fix it myself"],
    resolve: (L, d, c) => {
      if (c === 0) { L.money -= 300; return "I paid $300 to get my car towed and fixed."; }
      if (roll(0.3 + L.stats.smarts / 250)) { adjust(L, { happiness: 6, smarts: 1 }); return "I fixed the car myself with some duct tape and YouTube."; }
      L.money -= 1200; adjust(L, { happiness: -5 }); return "I made it worse. The repair cost me $1,200.";
    },
  },
  wedding: {
    emoji: "💒", title: "Wedding Invitation", min: 20, max: 70, when: (L) => firstOf(L, (p) => p.kind === "friend" || p.kind === "sibling").some((p) => p.age >= 20),
    make: (L) => { const p = pickOf(L, (x) => (x.kind === "friend" || x.kind === "sibling") && x.age >= 20); return { data: { id: p.id }, message: `${relName(p)} is getting married and invited you to the wedding.` }; },
    options: ["Go and bring a gift ($200)", "Go empty-handed", "Decline"],
    resolve: (L, d, c) => {
      const p = findRel(L, d.id); if (!p) return "The wedding was called off.";
      touch(L, p.id);
      if (c === 0) { L.money -= 200; updateRel(L, p.id, (x) => { x.bond += 15; }); adjust(L, { happiness: 6 }); bump(L, "parties"); return `I danced all night at ${p.firstName}'s wedding.`; }
      if (c === 1) { updateRel(L, p.id, (x) => { x.bond += 3; }); adjust(L, { happiness: 4 }); bump(L, "parties"); return `I went to ${p.firstName}'s wedding without a gift. A few people noticed.`; }
      updateRel(L, p.id, (x) => { x.bond -= 15; }); return `I skipped ${p.firstName}'s wedding. ${cap(pronoun(p.gender).subject)} was hurt.`;
    },
  },
  witness: {
    emoji: "🚨", title: "Witness", min: 16, max: 90, message: "You saw someone rob a convenience store. The police are asking for witnesses.",
    options: ["Testify", "Stay quiet"],
    resolve: (L, d, c) => {
      if (c === 1) { L.karma -= 2; return "I kept quiet about the robbery I witnessed."; }
      L.karma += 5;
      if (roll(0.1)) { adjust(L, { happiness: -8, health: -5 }); return "I testified, and the robber's friends roughed me up afterward."; }
      adjust(L, { happiness: 4 }); return "My testimony helped put the robber behind bars.";
    },
  },
  charity: {
    emoji: "🎗️", title: "Charity Drive", min: 18, max: 95, when: (L) => L.money > 1000,
    make: () => { const cause = pick(["children's hospital", "animal shelter", "food bank", "disaster relief fund", "cancer research foundation"]); return { data: { cause }, message: `A ${cause} is asking for donations.` }; },
    options: ["Donate $500", "Donate $50", "Decline"],
    resolve: (L, d, c) => {
      if (c === 0) { L.money -= 500; L.karma += 6; adjust(L, { happiness: 6 }); return `I donated $500 to a ${d.cause}.`; }
      if (c === 1) { L.money -= 50; L.karma += 2; adjust(L, { happiness: 2 }); return `I donated $50 to a ${d.cause}.`; }
      return `I declined to donate to the ${d.cause}.`;
    },
  },
  noisyNeighbor: {
    emoji: "🔊", title: "Noisy Neighbor", min: 18, max: 90, message: "Your neighbor blasts loud music every single night.",
    options: ["Ask them politely", "Call the police", "Blast my own music"],
    resolve: (L, d, c) => {
      if (c === 0) { if (roll(0.6)) { adjust(L, { happiness: 4 }); return "My neighbor apologized and turned the music down."; } adjust(L, { happiness: -3 }); return "My neighbor slammed the door in my face."; }
      if (c === 1) { adjust(L, { happiness: 2 }); return "The police gave my neighbor a noise complaint."; }
      adjust(L, { happiness: 5, health: -2 }); return "I started a music war with my neighbor. Nobody on the street is sleeping.";
    },
  },
  raffle: {
    emoji: "🎟️", title: "Raffle", min: 18, max: 90, message: "The local fire station is selling $10 raffle tickets. The grand prize is a new car.",
    options: ["Buy a ticket", "Pass"],
    resolve: (L, d, c) => {
      if (c === 1) return "I passed on the raffle.";
      L.money -= 10; L.karma += 1;
      if (roll(0.03)) {
        L.assets.push({ id: uid(), kind: "car", name: "Compact Sedan", purchasePrice: 0, value: 22000, yearsOwned: 0, loan: 0 });
        adjust(L, { happiness: 25 }); return "🎉 I won the raffle! I drove home in a brand-new car.";
      }
      return "I didn't win the raffle, but it was for a good cause.";
    },
  },
  bossParty: {
    emoji: "🥂", title: "Boss's Party", min: 18, max: 75, when: (L) => L.job && !L.job.partTime,
    message: "Your boss invited the whole team to a party at their house.",
    options: ["Go and mingle", "Go and drink too much", "Skip it"],
    resolve: (L, d, c) => {
      if (c === 0) { jobPerf(L, 8); adjust(L, { happiness: 4 }); bump(L, "parties"); return "I charmed my boss at the party."; }
      if (c === 1) {
        bump(L, "parties");
        if (roll(0.5)) { jobPerf(L, -12); adjust(L, { happiness: -4 }); return "I drank too much and threw up in my boss's pool. Everyone saw."; }
        jobPerf(L, 4); adjust(L, { happiness: 8 }); return "I got tipsy and became the life of the party.";
      }
      jobPerf(L, -3); return "I skipped my boss's party.";
    },
  },
  officeFlirt: {
    emoji: "😏", title: "Office Flirt", min: 18, max: 65, when: (L) => !!L.job,
    make: (L) => { const p = makePerson("partner", Math.max(18, L.age + rnd(-6, 6)), { gender: preferredGender(L), bond: rnd(55, 80) }); return { data: { person: p }, message: `Your coworker ${relName(p)} has been flirting with you.` }; },
    options: ["Flirt back", "Keep it professional"],
    resolve: (L, d, c) => {
      if (c === 1) { jobPerf(L, 2); return `I kept things professional with ${d.person.firstName}.`; }
      const partner = romanticPartner(L);
      if (partner) {
        L.karma -= 4;
        if (roll(partner.trait === "jealous" ? 0.6 : 0.35)) { updateRel(L, partner.id, (x) => { x.bond -= 35; }); adjust(L, { happiness: -10 }); return `${partner.firstName} found my flirty texts with ${d.person.firstName}. Big fight.`; }
        adjust(L, { happiness: 5 }); return `I've been secretly flirting with ${d.person.firstName} at work.`;
      }
      d.person.lastContact = L.age; L.relationships.push(d.person); bump(L, "partners"); adjust(L, { happiness: 9 });
      return `I started dating my coworker ${d.person.firstName}. 💕`;
    },
  },
  steroids: {
    emoji: "💉", title: "Gym Offer", min: 18, max: 50, message: "A huge guy at the gym offers to sell you steroids.",
    options: ["Buy some", "No thanks"],
    resolve: (L, d, c) => {
      if (c === 1) return "I turned down the steroids.";
      L.money -= 300;
      if (roll(0.3)) { adjust(L, { health: -15, happiness: -5 }); return "The steroids messed up my heart. My doctor was furious."; }
      adjust(L, { health: 4, looks: 6, happiness: 4 }); return "I bulked up fast. Nobody needs to know how.";
    },
  },
  hauntedHouse: {
    emoji: "👻", title: "Bump in the Night", min: 18, max: 95, when: (L) => L.assets.some((a) => a.kind === "house"),
    message: "You keep hearing strange noises in your house at night.",
    options: ["Investigate", "Hire a ghost hunter ($500)", "Ignore it"],
    resolve: (L, d, c) => {
      if (c === 0) {
        if (roll(0.7)) { adjust(L, { happiness: 3 }); return `It was ${pick(["a raccoon in the attic", "a loose pipe", "the neighbor's cat", "the wind"])}. Mystery solved.`; }
        adjust(L, { happiness: -8, health: -3 }); return "I saw something I can't explain. I haven't slept since.";
      }
      if (c === 1) { L.money -= 500; adjust(L, { happiness: 2 }); return "The ghost hunter burned some sage and declared my house 'spiritually clean'."; }
      adjust(L, { happiness: -2 }); return "I put in earplugs and ignored the noises.";
    },
  },
  taxAudit: {
    emoji: "🧾", title: "Tax Audit", min: 18, max: 80, when: (L) => L.job && L.job.salary > 60000,
    make: (L) => ({ data: { salary: L.job.salary }, message: "The tax office is auditing your returns." }),
    options: ["Hire an accountant ($2,000)", "Handle it myself"],
    resolve: (L, d, c) => {
      if (c === 0) { L.money -= 2000; return "My accountant handled the audit. Everything checked out."; }
      if (roll(0.3 + L.stats.smarts / 200)) { adjust(L, { happiness: 3 }); return "I handled the audit myself and owed nothing."; }
      const fine = Math.trunc(d.salary * rndf(0.05, 0.2)); L.money -= fine; adjust(L, { happiness: -8 });
      return `I messed up my audit and owed ${formatMoney(fine)} in back taxes.`;
    },
  },
  reunion: {
    emoji: "🏫", title: "High School Reunion", min: 28, max: 50, message: "Your high school reunion is this weekend.",
    options: ["Go", "Skip it"],
    resolve: (L, d, c) => {
      if (c === 1) return "I skipped my high school reunion.";
      bump(L, "parties");
      if (roll(0.4)) {
        const f = makePerson("friend", L.age, { bond: rnd(55, 80) }); f.lastContact = L.age; L.relationships.push(f);
        adjust(L, { happiness: 7 }); return `I reconnected with my old classmate ${relName(f)} at the reunion.`;
      }
      if (L.job && L.job.salary > 100000) { adjust(L, { happiness: 8 }); return "Everyone at the reunion was impressed by how well I'm doing."; }
      adjust(L, { happiness: -3 }); return "The reunion was awkward. Everyone asked what I do for a living.";
    },
  },
  promoteGig: {
    emoji: "🎤", title: "Open Mic", min: 16, max: 60, message: "A local bar is hosting an open mic night.",
    options: ["Perform a song", "Do stand-up comedy", "Just watch"],
    resolve: (L, d, c) => {
      if (c === 2) { adjust(L, { happiness: 2 }); return "I watched the open mic. Some people were brave."; }
      if (roll(0.3 + L.stats.looks / 300 + L.fame / 200)) { L.followers += rnd(20, 600); L.fame = Math.min(100, L.fame + 1); adjust(L, { happiness: 9 }); return c === 0 ? "My song got the whole bar singing along!" : "My stand-up set killed. People were crying with laughter."; }
      adjust(L, { happiness: -6 }); return c === 0 ? "My voice cracked on the high note. Brutal." : "Crickets. Not a single laugh.";
    },
  },

  // MARK: Seniors
  grandScam: {
    emoji: "📞", title: "Urgent Call", min: 60, max: 110, message: "A caller says your grandchild is in jail and needs $5,000 for bail, right now.",
    options: ["Send the money", "Hang up and call family"],
    resolve: (L, d, c) => {
      if (c === 0) { L.money -= 5000; adjust(L, { happiness: -10 }); return "I wired $5,000. My grandchild was never in jail. It was a scam."; }
      for (const k of firstOf(L, (p) => p.kind === "child")) { touch(L, k.id); updateRel(L, k.id, (x) => { x.bond += 3; }); }
      return "I hung up and called my family. Everyone was fine; it was a scam.";
    },
  },
  memoir: {
    emoji: "📖", title: "Memoir Offer", min: 55, max: 100, message: "A publisher wants you to write a memoir about your life.",
    options: ["Write it", "Decline"],
    resolve: (L, d, c) => {
      if (c === 1) return "I turned down the memoir deal.";
      const advance = 5000 + L.fame * 4000 + rnd(0, 20000); L.money += advance; adjust(L, { happiness: 8, smarts: 2 });
      return `I wrote my memoir and earned ${formatMoney(advance)}.`;
    },
  },
  seniorDance: {
    emoji: "💃", title: "Senior Dance", min: 60, max: 100, message: "There's a dance night at the community center.",
    options: ["Go dancing", "Stay home"],
    resolve: (L, d, c) => {
      if (c === 1) return "I stayed home and watched game shows.";
      if (!romanticPartner(L) && roll(0.3)) {
        const p = makePerson("partner", L.age + rnd(-5, 5), { gender: preferredGender(L), bond: rnd(60, 85) }); p.lastContact = L.age;
        L.relationships.push(p); bump(L, "partners"); adjust(L, { happiness: 12 });
        return `I met ${relName(p)} on the dance floor. We've been inseparable since. 💕`;
      }
      if (roll(0.15)) { adjust(L, { health: -8 }); return "I threw out my hip doing the twist."; }
      adjust(L, { happiness: 8, health: 2 }); return "I danced the night away like I was 20 again.";
    },
  },
  retirementHome: {
    emoji: "🏡", title: "Retirement Home", min: 75, max: 110, message: "Your family suggests moving into a retirement home.",
    options: ["Move in", "Refuse"],
    resolve: (L, d, c) => {
      if (c === 0) { L.money -= 20000; adjust(L, { health: 8, happiness: 4 }); return "I moved into a retirement home. The bingo nights are fierce."; }
      adjust(L, { happiness: 3, health: -3 }); return "I refused to leave my home. I'm not that old!";
    },
  },
};
