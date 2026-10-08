// LifeSim random events: things that just happen, and choices the player must make.
"use strict";

const EVENT_EMOJI = {
  bully: "😠", cheatOnTest: "📝", friendship: "🤝", drugsOffer: "💊", askedOut: "💘", strayAnimal: "🐾", foundWallet: "👛",
  streetFight: "👊", mugger: "🔪", investmentPitch: "📈", coworkerCredit: "😤", siblingNeedsMoney: "💸", prom: "💃",
  craving: "😩", celebrity: "🌟", juryDuty: "⚖️", drunkDriving: "🍻", parentNeedsCare: "🏥", partnerProposes: "💍",
  partnerCheated: "💔", childInTrouble: "🚨", friendNeedsHelp: "🙏", familyReunion: "👨‍👩‍👧‍👦",
};
const ev = (kind, data, title, message, options) => ({ id: uid(), kind, data, title, message, options, emoji: EVENT_EMOJI[kind] || SIMPLE_EVENTS[kind]?.emoji || "❗" });

function generateEvents(L) {
  passiveEvent(L);
  let e = null;
  if (roll(0.3)) e = socialEvent(L);
  if (!e && roll(0.8)) e = choiceEvent(L);
  if (e) L.pendingEvents.push(e);
  // Some years are eventful.
  if (e && roll(0.18)) {
    const extra = choiceEvent(L);
    if (extra && extra.kind !== e.kind) L.pendingEvents.push(extra);
  }
}

// MARK: Passive events

function passiveEvent(L) {
  if (!roll(0.5)) return;
  const age = L.age;
  const options = [];
  if (age <= 4) {
    options.push(() => { record(L, `I said my first words: "${pick(["mama", "dada", "no", "cookie", "dog"])}".`); adjust(L, { happiness: 3 }); });
    options.push(() => { record(L, "I fell off the couch and bumped my head."); adjust(L, { health: -3 }); });
    options.push(() => { record(L, "I learned to walk!"); adjust(L, { happiness: 4 }); });
  }
  if (age >= 5 && age <= 17) {
    options.push(() => { record(L, "I got a gold star from my teacher."); L.schoolGrades += 5; adjust(L, { happiness: 4 }); });
    options.push(() => { record(L, "I caught the flu and missed a week of school."); adjust(L, { health: -6 }); });
    options.push(() => { record(L, "I went on a school field trip to the museum."); adjust(L, { happiness: 5, smarts: 2 }); });
  }
  if (age >= 13 && age <= 19) {
    options.push(() => { record(L, "I got a bad case of acne."); adjust(L, { happiness: -4, looks: -4 }); });
    options.push(() => { record(L, "I hit a growth spurt!"); adjust(L, { looks: 4 }); });
  }
  if (age >= 18) {
    options.push(() => { const a = rnd(20, 500); L.money += a; record(L, `I found ${formatMoney(a)} on the sidewalk.`); adjust(L, { happiness: 3 }); });
    options.push(() => { record(L, "I sprained my ankle while jogging."); adjust(L, { health: -5 }); });
    options.push(() => { record(L, "I had a wonderful dream last night."); adjust(L, { happiness: 4 }); });
    options.push(() => { const b = rnd(200, 3000); L.money -= b; record(L, `My appliances broke down. Repairs cost ${formatMoney(b)}.`); adjust(L, { happiness: -3 }); });
  }
  if (age >= 50) options.push(() => { record(L, "My back has been aching."); adjust(L, { happiness: -3, health: -4 }); });
  if (options.length) pick(options)();
}

// MARK: Events driven by the people in your life

function socialEvent(L) {
  const events = [];
  const alive = L.relationships.filter((p) => p.isAlive && !p.species);
  for (const parent of alive) {
    if (isParent(parent.kind) && parent.age >= 68 && L.age >= 18) {
      events.push(ev("parentNeedsCare", { id: parent.id }, "Family Health Scare",
        `Your ${relTitle(parent).toLowerCase()} ${parent.firstName} (${parent.age}) is in poor health and needs help.`,
        ["Move in and care for them", "Send money ($2,000)", "Ignore it"]));
    }
  }
  const partner = alive.find((p) => p.kind === "partner");
  if (partner && partner.bond >= 75 && partner.yearsTogether >= 2 && L.age >= 18) {
    events.push(ev("partnerProposes", { id: partner.id }, "Will You Marry Me?", `${partner.firstName} got down on one knee and proposed to you! 💍`, ["Yes!", "No"]));
  }
  const lover = alive.find((p) => isRomantic(p.kind));
  if (lover && (lover.bond < 45 || (lover.trait === "toxic" && roll(0.5)))) {
    events.push(ev("partnerCheated", { id: lover.id }, "Betrayal", `You found messages on ${lover.firstName}'s phone. They've been cheating on you.`, ["Forgive them", "Confront them", "End it"]));
  }
  for (const kid of alive) {
    if (kid.kind === "child" && kid.age >= 13 && kid.age <= 19 && kid.bond < 45) {
      events.push(ev("childInTrouble", { id: kid.id }, "Trouble at Home",
        `Your ${relTitle(kid).toLowerCase()} ${kid.firstName} (${kid.age}) was caught ${pick(["shoplifting", "skipping school for a month", "vandalizing the school", "drinking at a party"])}.`,
        ["Have a heart-to-heart", "Ground them", "Let it slide"]));
    }
  }
  for (const friend of alive) {
    if (friend.kind === "friend" && friend.bond >= 40 && L.age >= 16) {
      const amount = rnd(200, 5000);
      events.push(ev("friendNeedsHelp", { id: friend.id, amount }, "A Friend in Need",
        `${friend.firstName} is going through a rough patch and asks to borrow ${formatMoney(amount)}.`, ["Help them out", "Say no"]));
    }
  }
  if (alive.filter((p) => isParent(p.kind) || p.kind === "sibling" || p.kind === "child").length >= 2 && L.age >= 10) {
    events.push(ev("familyReunion", {}, "Family Reunion", "The whole family is getting together for the holidays.", ["Go and have fun", "Go and start drama", "Skip it"]));
  }
  return events.length ? pick(events) : null;
}

// MARK: Choice events

function choiceEvent(L) {
  const age = L.age;
  const events = [];
  if (age >= 6 && age <= 17) {
    const bully = Names.first(pick(["male", "female"]));
    events.push(ev("bully", { name: bully }, "Bully", `${bully}, a kid at school, has been bullying you and just shoved you into a locker. What do you do?`, ["Fight back", "Tell a teacher", "Ignore it"]));
  }
  if (age >= 10 && age <= 17) {
    events.push(ev("cheatOnTest", {}, "Big Test", "A classmate offers you the answers to tomorrow's big exam.", ["Take the answers", "Study instead", "Report them"]));
    const friend = makePerson("friend", age + rnd(-1, 1), { bond: rnd(40, 70) });
    events.push(ev("friendship", { person: friend }, "New Classmate", `${relName(friend)} wants to be your friend.`, ["Accept", "Decline"]));
  }
  if (age >= 14 && age <= 30) {
    events.push(ev("drugsOffer", {}, "Party", "Someone at a party offers you some sketchy-looking pills.", ["Take them", "Say no"]));
  }
  if (age === 17) {
    const date = makePerson("partner", 17, { gender: preferredGender(L), bond: rnd(50, 80) });
    date.money = 0;
    events.push(ev("prom", { person: date }, "Prom Night", `${relName(date)} asked you to prom!`, ["Go together", "Go with friends", "Skip prom"]));
  }
  if (age >= 18) {
    const sibs = L.relationships.filter((p) => p.kind === "sibling" && p.isAlive && p.age >= 18);
    if (sibs.length) {
      const s = pick(sibs);
      const amount = rnd(500, 10000);
      events.push(ev("siblingNeedsMoney", { id: s.id, amount }, "Family Favor", `Your ${relTitle(s).toLowerCase()} ${s.firstName} is broke and asks to borrow ${formatMoney(amount)}.`, ["Lend it", "Refuse"]));
    }
  }
  if (L.addictions.length) {
    const a = pick(L.addictions);
    events.push(ev("craving", { addiction: a }, "Craving", `Your ${Addictions[a].toLowerCase()} is acting up. You feel a powerful urge.`, ["Give in", "Resist"]));
  }
  if (age >= 10) events.push(ev("celebrity", {}, "Celebrity Sighting", "You spot a famous movie star at a coffee shop.", ["Ask for a selfie", "Leave them alone", "Insult them"]));
  if (age >= 18 && !inPrison(L)) events.push(ev("juryDuty", {}, "Jury Duty", "You've been summoned for jury duty.", ["Serve", "Ignore the summons"]));
  if (L.hasDriversLicense && L.assets.some((a) => a.kind === "car") && (L.addictions.includes("alcohol") || roll(0.3))) {
    events.push(ev("drunkDriving", {}, "One Too Many", "You had a few drinks at a friend's party and your car is parked outside.", ["Drive home", "Call a cab"]));
  }
  if (age >= 16 && age <= 60 && !romanticPartner(L)) {
    const person = makePerson("partner", datingAge(L), { gender: preferredGender(L), bond: rnd(50, 80) });
    person.money = rnd(0, 150000);
    events.push(ev("askedOut", { person }, "Love is in the air", `${relName(person)} (${person.age}) asked you out on a date. Looks: ${person.looks}%.`, ["Say yes", "Say no"]));
  }
  if (age >= 8) {
    const species = pick(Names.petSpecies);
    events.push(ev("strayAnimal", { species }, `Stray ${species}`, `A stray ${species.toLowerCase()} followed you home. It looks hungry.`, ["Adopt it", "Shoo it away"]));
    const amount = rnd(50, 2000);
    events.push(ev("foundWallet", { amount }, "Lost Wallet", `You found a wallet on the ground containing ${formatMoney(amount)} and an ID.`, ["Return it", "Keep the cash"]));
  }
  if (age >= 18) {
    events.push(ev("streetFight", {}, "Confrontation", "A drunk stranger is trying to pick a fight with you outside a bar.", ["Fight", "Walk away", "Call the police"]));
    events.push(ev("mugger", {}, "Mugger!", "A man with a knife demands your wallet.", ["Hand it over", "Fight him", "Run"]));
  }
  if (age >= 21 && L.money > 5000) {
    const amount = Math.min(idiv(L.money, 2), rnd(2000, 50000));
    events.push(ev("investmentPitch", { amount }, "Investment Opportunity", `An old friend wants you to invest ${formatMoney(amount)} in their new startup.`, ["Invest", "Pass"]));
  }
  for (const [kind, def] of Object.entries(SIMPLE_EVENTS)) {
    if (age < def.min || age > def.max || (def.when && !def.when(L))) continue;
    const made = def.make ? def.make(L) : {};
    if (!made) continue;
    const e = ev(kind, made.data || {}, def.title, made.message || def.message, def.options);
    for (let w = 0; w < (def.weight || 1); w++) events.push(e);
  }
  if (L.job && !L.job.partTime) {
    events.push(ev("coworkerCredit", {}, "Office Drama", "A coworker took credit for your work in front of the boss.", ["Confront them", "Tell the boss", "Let it go"]));
  }
  return events.length ? pick(events) : null;
}

// MARK: Resolving choices

function resolveEvent(L, event, choice) {
  L.pendingEvents = L.pendingEvents.filter((e) => e.id !== event.id);
  const text = outcomeText(L, event, choice);
  record(L, text);
  return { title: event.title, message: text };
}

function jobPerf(L, delta) { if (L.job) L.job.performance = clamp(L.job.performance + delta, 0, 100); }

function outcomeText(L, event, c) {
  const d = event.data;
  switch (event.kind) {
    case "bully":
      if (c === 0) {
        if (roll(0.5)) { adjust(L, { happiness: 10, health: -3 }); return `I fought back and gave ${d.name} a black eye. They won't bother me again.`; }
        adjust(L, { happiness: -10, health: -10 }); return `I tried to fight ${d.name} but got beaten up.`;
      }
      if (c === 1) { adjust(L, { happiness: 3 }); return `I told a teacher and ${d.name} got detention.`; }
      adjust(L, { happiness: -5 }); return `I ignored ${d.name}'s bullying.`;

    case "cheatOnTest":
      if (c === 0) {
        if (roll(0.3)) { L.schoolGrades -= 15; L.karma -= 5; adjust(L, { happiness: -10 }); return "I got caught cheating and received a zero!"; }
        L.schoolGrades += 8; L.karma -= 3; return "I used the answers and aced the exam.";
      }
      if (c === 1) { L.schoolGrades += 4; adjust(L, { smarts: 3 }); return "I studied hard for the exam."; }
      L.karma += 5; return "I reported the cheater to the principal.";

    case "friendship":
      if (c === 0) { d.person.lastContact = L.age; L.relationships.push(d.person); adjust(L, { happiness: 5 }); return `I became friends with ${relName(d.person)}.`; }
      return `I turned down ${d.person.firstName}'s friendship.`;

    case "drugsOffer":
      if (c === 0) {
        if (roll(0.15)) { die(L, "a drug overdose"); return "I overdosed."; }
        adjust(L, { happiness: 8, health: -12, smarts: -3 }); return "I took the pills and had a wild night. I feel awful now.";
      }
      return "I said no to drugs.";

    case "askedOut":
      if (c === 0) { d.person.lastContact = L.age; L.relationships.push(d.person); bump(L, "partners"); adjust(L, { happiness: 10 }); return `I started dating ${relName(d.person)}.`; }
      return `I turned ${d.person.firstName} down.`;

    case "strayAnimal":
      if (c === 0) {
        const pet = { ...makePerson("pet", rnd(1, 4), { noTrait: true, bond: 70 }), lastName: "", firstName: pick(Names.petNames), species: d.species, occupation: null, salary: 0, lastContact: L.age };
        L.relationships.push(pet); adjust(L, { happiness: 10 });
        return `I adopted a ${d.species.toLowerCase()} and named it ${pet.firstName}.`;
      }
      return `I shooed the ${d.species.toLowerCase()} away.`;

    case "foundWallet":
      if (c === 0) {
        L.karma += 6; adjust(L, { happiness: 5 });
        if (roll(0.3)) { L.money += 100; return "I returned the wallet. The grateful owner gave me a $100 reward!"; }
        return "I returned the wallet to its owner.";
      }
      L.karma -= 6; L.money += d.amount; return `I kept the ${formatMoney(d.amount)}.`;

    case "streetFight":
      if (c === 0) {
        if (roll(0.5)) { adjust(L, { happiness: 5, health: -4 }); return "I won the fight and walked away with a few bruises."; }
        if (roll(0.2)) { L.criminalRecord.push("Assault"); sendToPrison(L, 1); return "I won, but the police arrested me for assault. I was sentenced to 1 year in prison."; }
        adjust(L, { happiness: -5, health: -15 }); return "I lost the fight and ended up in the hospital.";
      }
      if (c === 1) return "I walked away from the fight.";
      L.karma += 2; return "I called the police and they took the stranger away.";

    case "mugger":
      if (c === 0) { const lost = Math.min(Math.max(L.money, 0), rnd(20, 400)); L.money -= lost; adjust(L, { happiness: -5 }); return `I handed over my wallet and lost ${formatMoney(lost)}.`; }
      if (c === 1) {
        if (roll(0.4)) { adjust(L, { happiness: 10 }); return "I disarmed the mugger and he ran off!"; }
        if (roll(0.1)) { die(L, "a stab wound"); return "The mugger stabbed me."; }
        adjust(L, { health: -25 }); return "The mugger stabbed me. I survived, but barely.";
      }
      if (roll(0.7)) return "I ran away and escaped.";
      adjust(L, { health: -8 }); return "I tripped while running and the mugger caught me.";

    case "investmentPitch":
      if (c === 0) {
        L.money -= d.amount;
        if (roll(0.25)) { const payout = d.amount * rnd(3, 10); L.money += payout; adjust(L, { happiness: 20 }); return `The startup was a huge success! My ${formatMoney(d.amount)} investment returned ${formatMoney(payout)}.`; }
        adjust(L, { happiness: -10 }); return `The startup went bust and I lost my ${formatMoney(d.amount)} investment.`;
      }
      return "I passed on the investment.";

    case "coworkerCredit":
      if (c === 0) {
        if (roll(0.5)) { jobPerf(L, 5); return "I confronted my coworker and they backed down."; }
        jobPerf(L, -5); return "Confronting my coworker turned into an HR complaint against me.";
      }
      if (c === 1) { jobPerf(L, 8); return "My boss believed me and praised my work."; }
      adjust(L, { happiness: -4 }); return "I let my coworker take the credit.";

    case "siblingNeedsMoney": {
      const s = findRel(L, d.id);
      if (s) {
        touch(L, s.id);
        if (c === 0) {
          L.money -= d.amount; L.karma += 3;
          updateRel(L, s.id, (p) => { p.bond += 15; p.money += d.amount; });
          return `I lent ${s.firstName} ${formatMoney(d.amount)}. ${cap(pronoun(s.gender).subject)} was very grateful.`;
        }
        updateRel(L, s.id, (p) => { p.bond -= 12; });
        return `I refused to lend ${s.firstName} any money.`;
      }
      return "It sorted itself out.";
    }

    case "prom":
      if (c === 0) {
        d.person.lastContact = L.age; L.relationships.push(d.person); bump(L, "partners"); bump(L, "parties");
        adjust(L, { happiness: 15 }); L.popularity = Math.min(100, L.popularity + 8);
        return `I went to prom with ${d.person.firstName} and we started dating! 💃`;
      }
      if (c === 1) { adjust(L, { happiness: 8 }); bump(L, "parties"); return "I went to prom with my friends and had a blast."; }
      adjust(L, { happiness: -3 }); return "I skipped prom and stayed home.";

    case "craving": {
      const name = Addictions[d.addiction].toLowerCase();
      if (c === 0) { adjust(L, { happiness: 6, health: -6 }); L.money -= 500; return `I gave in to my ${name}.`; }
      if (roll(0.3)) { L.addictions = L.addictions.filter((a) => a !== d.addiction); adjust(L, { happiness: 10 }); return `I resisted the urge and finally beat my ${name}!`; }
      adjust(L, { happiness: -3 }); return "I resisted the urge. It wasn't easy.";
    }

    case "celebrity":
      if (c === 0) {
        if (roll(0.7)) { L.followers += rnd(50, 2000); adjust(L, { happiness: 8 }); return "The celebrity happily took a selfie with me. My followers loved it!"; }
        adjust(L, { happiness: -4 }); return "The celebrity's bodyguard pushed me away.";
      }
      if (c === 1) return "I let the celebrity enjoy their coffee in peace.";
      L.karma -= 2; return "I told the celebrity their last movie was garbage.";

    case "juryDuty":
      if (c === 0) { L.karma += 2; L.money += 300; return "I served on a jury and helped reach a verdict."; }
      if (roll(0.3)) { L.money -= 1000; return "I ignored my jury summons and was fined $1,000."; }
      return "I ignored my jury summons and nobody noticed.";

    case "drunkDriving":
      if (c === 0) {
        L.karma -= 5;
        if (roll(0.1)) { die(L, "a drunk-driving crash"); return "I crashed my car on the way home."; }
        if (roll(0.25)) { L.criminalRecord.push("DUI"); L.hasDriversLicense = false; L.money -= 5000; return "I was pulled over for drunk driving. I lost my license and paid a $5,000 fine."; }
        return "I drove home drunk and somehow made it.";
      }
      L.money -= 40; return "I took a cab home. Better safe than sorry.";

    case "parentNeedsCare": {
      const p = findRel(L, d.id);
      if (!p) return "It turned out to be nothing.";
      touch(L, p.id);
      const pr = pronoun(p.gender);
      if (c === 0) {
        updateRel(L, p.id, (x) => { x.bond += 25; }); L.karma += 5; adjust(L, { happiness: -4, health: -3 });
        if (L.job && !L.job.partTime) jobPerf(L, -10);
        return `I moved in to care for ${p.firstName}. It was exhausting, but ${pr.subject} was so grateful.`;
      }
      if (c === 1) { L.money -= 2000; updateRel(L, p.id, (x) => { x.bond += 8; }); return `I sent ${p.firstName} $2,000 for medical bills.`; }
      updateRel(L, p.id, (x) => { x.bond -= 25; }); L.karma -= 5;
      return `I ignored ${p.firstName}'s health problems. ${cap(pr.subject)} won't forget that.`;
    }

    case "partnerProposes": {
      const p = findRel(L, d.id);
      if (!p) return "Never mind.";
      touch(L, p.id);
      if (c === 0) { updateRel(L, p.id, (x) => { x.kind = "fiance"; x.bond += 15; }); adjust(L, { happiness: 20 }); return `💍 I said YES to ${p.firstName}! We're engaged!`; }
      updateRel(L, p.id, (x) => { x.bond -= 35; }); adjust(L, { happiness: -8 });
      return `I turned down ${p.firstName}'s proposal. ${cap(pronoun(p.gender).subject)} was heartbroken.`;
    }

    case "partnerCheated": {
      const p = findRel(L, d.id);
      if (!p) return "Never mind.";
      touch(L, p.id);
      adjust(L, { happiness: -15 });
      if (c === 0) { updateRel(L, p.id, (x) => { x.bond += 10; }); return `I forgave ${p.firstName} for cheating. I hope I don't regret it.`; }
      if (c === 1) {
        if (roll(0.5)) { updateRel(L, p.id, (x) => { x.bond += 15; }); return `I confronted ${p.firstName}. ${cap(pronoun(p.gender).subject)} begged for forgiveness and promised to change.`; }
        updateRel(L, p.id, (x) => { x.bond -= 20; }); return `I confronted ${p.firstName} and it turned into a screaming match.`;
      }
      const wasSpouse = p.kind === "spouse";
      becomeEx(L, p);
      if (wasSpouse) {
        const settlement = Math.max(0, idiv(L.money, 3)); L.money -= settlement;
        return `💔 I divorced ${p.firstName} for cheating. The settlement cost me ${formatMoney(settlement)}.`;
      }
      return `💔 I dumped ${p.firstName} for cheating on me.`;
    }

    case "childInTrouble": {
      const k = findRel(L, d.id);
      if (!k) return "It sorted itself out.";
      touch(L, k.id);
      const pr = pronoun(k.gender);
      if (c === 0) {
        if (roll(0.65)) { updateRel(L, k.id, (x) => { x.bond += 20; }); return `I had a long talk with ${k.firstName}. We understand each other much better now.`; }
        updateRel(L, k.id, (x) => { x.bond -= 5; }); return `I tried to talk with ${k.firstName}, but ${pr.subject} just rolled ${pr.possessive} eyes and slammed the door.`;
      }
      if (c === 1) { updateRel(L, k.id, (x) => { x.bond -= 8; }); return `I grounded ${k.firstName} for a month. ${cap(pr.subject)} says ${pr.subject} hates me.`; }
      updateRel(L, k.id, (x) => { x.bond -= 3; }); L.karma -= 2; return `I let ${k.firstName}'s behavior slide.`;
    }

    case "friendNeedsHelp": {
      const f = findRel(L, d.id);
      if (!f) return "Never mind.";
      touch(L, f.id);
      if (c === 0) {
        L.money -= d.amount; L.karma += 3; updateRel(L, f.id, (x) => { x.bond += 20; });
        if (f.trait === "generous" || roll(0.4)) {
          const repaid = d.amount + idiv(d.amount, 5); L.money += repaid;
          return `I lent ${f.firstName} ${formatMoney(d.amount)}. ${cap(pronoun(f.gender).subject)} paid me back ${formatMoney(repaid)} with a thank-you card.`;
        }
        return `I lent ${f.firstName} ${formatMoney(d.amount)}. I doubt I'll see it again, but our friendship is stronger.`;
      }
      updateRel(L, f.id, (x) => { x.bond -= 15; });
      return `I told ${f.firstName} I couldn't help. Things are awkward between us now.`;
    }

    case "familyReunion": {
      const family = L.relationships.filter((p) => p.isAlive && (isParent(p.kind) || p.kind === "sibling" || p.kind === "child"));
      if (c === 0) {
        for (const p of family) { touch(L, p.id); updateRel(L, p.id, (x) => { x.bond += rnd(3, 10); }); }
        adjust(L, { happiness: 8 }); return "👨‍👩‍👧‍👦 I had a wonderful time catching up with the whole family.";
      }
      if (c === 1) {
        for (const p of family) { touch(L, p.id); updateRel(L, p.id, (x) => { x.bond -= rnd(5, 15); }); }
        adjust(L, { happiness: 3 }); L.karma -= 2; return "🍿 I brought up old grudges at dinner and the reunion descended into chaos.";
      }
      for (const p of family) updateRel(L, p.id, (x) => { x.bond -= rnd(1, 5); });
      return "I skipped the family reunion. Nobody was thrilled about it.";
    }
  }
  const simple = SIMPLE_EVENTS[event.kind];
  if (simple) return simple.resolve(L, d, c);
  return "Nothing happened.";
}
