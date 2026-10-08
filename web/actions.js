// LifeSim player actions. Each returns an outcome { title, message } and records it in the log.
"use strict";

const out = (L, title, message, log = true) => { if (log) record(L, message); return { title, message }; };

// MARK: Activities

const canDoActivity = (L, id) => L.age >= Activities[id][3] && !inPrison(L);

function performActivity(L, id) {
  const title = Activities[id][0];
  let m;
  switch (id) {
    case "gym": { const g = rnd(1, 6); bump(L, "gym"); adjust(L, { happiness: 2, health: g, looks: rnd(0, 3) }); m = `I had a great workout at the gym. Health +${g}.`; break; }
    case "library": { const g = rnd(1, 5); adjust(L, { happiness: 1, smarts: g }); m = `I read a fascinating book at the library. Smarts +${g}.`; break; }
    case "meditate": { const g = rnd(2, 7); adjust(L, { happiness: g, health: 1 }); m = `I meditated and found some inner peace. Happiness +${g}.`; break; }
    case "walk": adjust(L, { happiness: 2, health: 1 }); m = `I went for a relaxing walk around ${L.city}.`; break;
    case "martialArts":
      L.money -= 150;
      if (roll(0.1)) { adjust(L, { health: -8 }); m = "I got hurt sparring at my martial arts class."; }
      else { adjust(L, { happiness: 3, health: rnd(2, 5) }); m = `I trained hard at my ${pick(["karate", "judo", "kung fu", "taekwondo", "jiu-jitsu"])} class.`; }
      break;
    case "salon": L.money -= 250; adjust(L, { happiness: 6, looks: rnd(1, 4) }); m = "I got pampered at the salon and spa. I look fabulous."; break;
    case "diet": {
      const diet = pick(["keto", "vegan", "Mediterranean", "paleo", "intermittent fasting"]);
      if (roll(0.7)) { adjust(L, { health: rnd(2, 6), looks: rnd(0, 3) }); m = `I stuck to a ${diet} diet and feel great.`; }
      else { adjust(L, { happiness: -3 }); m = `I tried a ${diet} diet but gave up after a week.`; }
      break;
    }
    case "party":
      L.money -= 100; bump(L, "parties");
      if (roll(0.15)) { adjust(L, { happiness: 5, health: -8 }); m = "I partied too hard and woke up with a terrible hangover."; }
      else { adjust(L, { happiness: rnd(6, 12) }); m = "I danced the night away at the club!"; }
      break;
    case "bar":
      L.money -= 60; bump(L, "parties"); adjust(L, { happiness: rnd(3, 8), health: -2 });
      m = "I had a few drinks at a local bar.";
      if (!L.addictions.includes("alcohol") && roll(0.08)) { L.addictions.push("alcohol"); m += " I think I'm developing a drinking problem."; }
      break;
    case "drugs":
      L.money -= 100;
      if (roll(0.04)) { die(L, "a drug overdose"); m = "I overdosed."; }
      else {
        adjust(L, { happiness: rnd(8, 15), health: -rnd(5, 12), smarts: -2 });
        m = `I got high on ${pick(["ecstasy", "cocaine", "mushrooms", "pills"])}.`;
        if (!L.addictions.includes("drugs") && roll(0.25)) { L.addictions.push("drugs"); m += " I'm hooked."; }
      }
      break;
    case "movies": L.money -= 15; adjust(L, { happiness: rnd(3, 7) }); m = `I watched ${pick(["an action movie", "a romantic comedy", "a horror film", "an animated movie", "a documentary"])} at the movie theater.`; break;
    case "concert": L.money -= 120; adjust(L, { happiness: rnd(6, 12) }); m = `I went to an amazing ${pick(["rock", "pop", "hip-hop", "jazz", "country"])} concert.`; break;
    case "vacation": { L.money -= 3000; const p = pick(Names.places); adjust(L, { happiness: rnd(12, 25), health: 3 }); m = `I took a relaxing vacation to ${p[0]}, ${p[1]}.`; break; }
    case "plasticSurgery":
      L.money -= 10000;
      if (roll(0.2)) { adjust(L, { happiness: -20, looks: -rnd(10, 30) }); m = "The surgery was botched! I look worse than before."; }
      else { const g = rnd(8, 25); adjust(L, { happiness: 10, looks: g }); m = `The surgery was a success. Looks +${g}.`; }
      break;
    case "lottery":
      L.money -= 20;
      if (roll(0.0005)) { const j = rnd(5000000, 150000000); L.money += j; bump(L, "lotteryWins"); adjust(L, { happiness: 50 }); m = `🎉 I WON THE LOTTERY JACKPOT: ${formatMoney(j)}!`; }
      else if (roll(0.03)) { L.money += 1000; adjust(L, { happiness: 8 }); m = "I matched a few numbers and won $1,000!"; }
      else m = "My lottery ticket was a dud.";
      break;
  }
  return out(L, title, m);
}

function gamble(L, gameId, bet) {
  const g = CasinoGames.find((x) => x.id === gameId);
  if (L.money < bet) return out(L, g.title, `I don't have ${formatMoney(bet)} to bet.`, false);
  let m;
  if (roll(g.chance)) {
    const winnings = bet * (g.payout - 1);
    L.money += winnings; adjust(L, { happiness: 12 });
    m = `${g.emoji} I bet ${formatMoney(bet)} on ${g.title.toLowerCase()} and WON ${formatMoney(winnings)}!`;
  } else {
    L.money -= bet; adjust(L, { happiness: -8 });
    m = `${g.emoji} I bet ${formatMoney(bet)} on ${g.title.toLowerCase()} and lost it all.`;
  }
  if (!L.addictions.includes("gambling") && roll(0.05)) { L.addictions.push("gambling"); m += " I can't stop thinking about my next bet..."; }
  return out(L, g.title, m);
}

// MARK: Crime & prison

function commitCrime(L, crimeId) {
  const c = Crimes.find((x) => x.id === crimeId);
  L.karma -= 5;
  bump(L, "crimes");
  if (roll(c.catchChance)) {
    const years = rnd(c.sentence[0], c.sentence[1]);
    L.criminalRecord.push(c.title);
    if (L.age < 18) {
      adjust(L, { happiness: -10 });
      return out(L, "Busted!", `I was caught trying to ${c.title.toLowerCase()}. Since I'm a minor, I got off with a warning and my parents grounded me.`);
    }
    sendToPrison(L, years);
    return out(L, "Busted!", `🚔 I was caught committing ${c.title.toLowerCase()} and sentenced to ${plural(years, "year")} in prison.`);
  }
  const loot = rnd(c.loot[0], c.loot[1]);
  L.money += loot;
  adjust(L, { happiness: 4 });
  return out(L, "Success", `I got away with it! I made ${formatMoney(loot)} from a ${c.title.toLowerCase()}.`);
}

function sendToPrison(L, years) {
  L.prisonYearsLeft = Math.max(L.prisonYearsLeft, years);
  if (L.job) { record(L, `I lost my job as a ${L.job.title}.`); L.job = null; }
  if (L.enrollment) { record(L, "I was expelled from school."); L.enrollment = null; }
  adjust(L, { happiness: -25 });
}

function prisonAction(L, id) {
  const a = PrisonActions.find((x) => x.id === id);
  let m;
  switch (id) {
    case "workout": adjust(L, { health: rnd(2, 6), looks: rnd(0, 2) }); m = "I lifted weights in the prison yard."; break;
    case "study": adjust(L, { smarts: rnd(2, 5) }); m = "I read some books in the prison library."; break;
    case "appeal":
      L.money -= 5000;
      if (roll(0.2)) { L.prisonYearsLeft = 0; adjust(L, { happiness: 25 }); m = "⚖️ My lawyer won the appeal! I'm a free person."; }
      else { adjust(L, { happiness: -5 }); m = "My appeal was denied."; }
      break;
    case "bribe":
      if (L.money < 25000) return out(L, a.title, "I don't have enough money to bribe the warden.", false);
      L.money -= 25000;
      if (roll(0.35)) { L.prisonYearsLeft = 0; adjust(L, { happiness: 25 }); m = "💵 The warden took my bribe and quietly released me."; }
      else { L.prisonYearsLeft += 2; m = "The warden took my money AND reported me. 2 years were added to my sentence."; }
      break;
    case "riot":
      if (roll(0.3)) { L.prisonYearsLeft += 2; adjust(L, { health: -15 }); m = "The riot failed. The guards beat me and added 2 years to my sentence."; }
      else { adjust(L, { happiness: 6, health: -5 }); m = "I started a riot! It was chaos, but I wasn't blamed."; }
      break;
    case "escape":
      if (roll(0.15)) { L.prisonYearsLeft = 0; L.criminalRecord.push("Prison Escape"); adjust(L, { happiness: 25 }); m = "🏃 I escaped from prison! I'm a free person... for now."; }
      else { L.prisonYearsLeft += 3; adjust(L, { happiness: -10 }); m = "My escape attempt failed. 3 years were added to my sentence."; }
      break;
  }
  return out(L, a.title, m);
}

// MARK: School

function studyHarder(L) {
  if (L.enrollment) L.enrollment.grades = Math.min(100, L.enrollment.grades + rnd(3, 8));
  else L.schoolGrades = Math.min(100, L.schoolGrades + rnd(3, 8));
  adjust(L, { happiness: -2, smarts: rnd(1, 3) });
  return out(L, "School", "I studied harder at school.");
}

function dropOut(L) {
  let m;
  if (L.enrollment) { m = `I dropped out of ${schoolName(L)}.`; L.enrollment = null; }
  else { L.droppedOut = true; m = "I dropped out of high school."; }
  adjust(L, { happiness: -5 });
  return out(L, "Dropped Out", m);
}

const canEnrollInUniversity = (L) => L.age >= 18 && eduRank(L.education) >= 1 && eduRank(L.education) < 2 && !L.enrollment && !inPrison(L);

function enrollUniversity(L, major) {
  const parentsPay = L.relationships.some((p) => isParent(p.kind) && p.isAlive && p.bond >= 50 && p.money > universityTuitionPerYear * 4) && roll(0.75);
  if (!parentsPay) L.studentLoans += universityTuitionPerYear * 4;
  L.enrollment = { kind: "university", major, field: null, yearsLeft: 4, grades: L.schoolGrades };
  if (L.job && !L.job.partTime) L.job = null;
  adjust(L, { happiness: 8 });
  const funding = parentsPay ? "My parents are paying for it!" : `I took out ${formatMoney(universityTuitionPerYear * 4)} in student loans.`;
  return out(L, "University", `I enrolled at university to study ${major}. ${funding}`);
}

const canEnrollGraduate = (L, field) => eduRank(L.education) >= 2 && !L.enrollment && !L.graduateDegrees.includes(field) && !inPrison(L);

function enrollGraduate(L, field) {
  const f = GraduateFields[field];
  if (!(L.stats.smarts >= 45 || roll(0.3))) {
    adjust(L, { happiness: -8 });
    return out(L, "Rejected", `I was rejected from ${f.schoolName}. Maybe I should hit the books.`);
  }
  const cost = f.tuition * f.years;
  L.studentLoans += cost;
  L.enrollment = { kind: "graduate", major: null, field, yearsLeft: f.years, grades: 60 };
  if (L.job && !L.job.partTime) L.job = null;
  adjust(L, { happiness: 10 });
  return out(L, f.schoolName, `I was accepted to ${f.schoolName}! I took out ${formatMoney(cost)} in loans.`);
}

function joinClub(L, club) {
  if (!L.clubs.includes(club)) L.clubs.push(club);
  L.popularity = Math.min(100, L.popularity + rnd(3, 10));
  if (club === "Sports Team") adjust(L, { happiness: 4, health: 5 });
  else if (club === "Debate Team" || club === "Chess Club") adjust(L, { happiness: 2, smarts: 4 });
  else if (club === "Drama Club") adjust(L, { happiness: 5, looks: 2 });
  else adjust(L, { happiness: 4 });
  return out(L, club, `I joined the ${club.toLowerCase()}.`);
}

function skipSchool(L) {
  L.schoolGrades = Math.max(0, L.schoolGrades - rnd(3, 8));
  if (roll(0.3)) { adjust(L, { happiness: -6 }); return out(L, "Skip School", "I skipped school, got caught, and was given detention."); }
  adjust(L, { happiness: 6 });
  L.popularity = Math.min(100, L.popularity + 3);
  return out(L, "Skip School", "I skipped school and hung out at the mall all day.");
}

// MARK: Jobs

function meetsRequirements(L, t) {
  t = tpl(t);
  if (L.age < t.minAge || inPrison(L)) return false;
  if (t.partTime) return L.age < 18 || !!L.enrollment || !L.job;
  if (L.age < 18 || L.age > t.maxAge || L.stats.health < t.minHealth) return false;
  if (eduRank(L.education) < eduRank(t.requiredEducation)) return false;
  if (t.requiredField && !L.graduateDegrees.includes(t.requiredField)) return false;
  if (t.requiredMajor && L.major !== t.requiredMajor) return false;
  return true;
}

function jobListings(L) {
  return jobCatalog.map(tpl)
    .filter((t) => t.minAge <= Math.max(L.age, 14) && (L.age >= 18 || t.partTime))
    .map((t) => ({ id: uid(), template: t, company: pick(companyNames), salary: idiv(Math.trunc(t.baseSalary * rndf(0.85, 1.2)), 100) * 100 }));
}

function applyForJob(L, opening) {
  const t = opening.template;
  if (!meetsRequirements(L, t)) return out(L, "Not Qualified", `I don't meet the requirements for ${entryTitle(t)}: ${requirementText(t)}.`, false);
  let chance = 0.55 + (L.stats.smarts - t.minSmarts) / 200;
  if (L.stats.smarts < t.minSmarts) chance -= 0.3;
  if (L.stats.looks < t.minLooks) chance = 0.02;
  if (L.criminalRecord.length && !t.partTime && !t.famous) chance -= 0.2;
  if (t.famous) chance = 0.15 + (L.stats.looks + L.stats.smarts) / 400 + L.fame / 200;
  if (t.military) chance = 0.85;
  let referral = "";
  const bf = bestFriend(L);
  if (bf && bf.salary > 0 && !t.partTime) { chance += 0.15; referral = ` My best friend ${bf.firstName} put in a good word for me.`; }
  if (!roll(clamp(chance, 0.05, 0.95))) {
    adjust(L, { happiness: -3 });
    return out(L, "Rejected", `I interviewed for the ${entryTitle(t)} position at ${opening.company}, but they didn't hire me.`);
  }
  if (L.job) record(L, `I quit my job as a ${L.job.title}.`);
  L.job = {
    templateID: t.id, title: entryTitle(t), company: opening.company, salary: opening.salary, baseSalary: opening.salary,
    years: 0, performance: 50, partTime: t.partTime, level: 0, yearsInLevel: 0, track: null, usedActions: [],
  };
  L.isRetired = false;
  adjust(L, { happiness: 10 });
  return out(L, "Hired!", `🎉 I got hired as a ${entryTitle(t)} at ${opening.company} for ${formatMoney(opening.salary)}/yr!${referral}`);
}

function askForRaise(L) {
  const j = L.job;
  if (!j) return out(L, "Raise", "I don't have a job.", false);
  if (j.usedActions.includes("raise")) return out(L, "Raise", "I already asked for a raise this year.", false);
  j.usedActions.push("raise");
  if (roll(j.performance / 130)) {
    const raise = Math.trunc(j.salary * rndf(0.05, 0.12));
    j.salary += raise;
    adjust(L, { happiness: 8 });
    return out(L, "Raise", `My boss gave me a ${formatMoney(raise)} raise!`);
  }
  j.performance -= 8;
  adjust(L, { happiness: -5 });
  return out(L, "Raise", "My boss laughed at my request for a raise.");
}

function quitJob(L) {
  if (!L.job) return out(L, "Quit", "I don't have a job.", false);
  const j = L.job;
  L.job = null;
  return out(L, "Quit", `I quit my job as a ${j.title} at ${j.company}.`);
}

const canRetire = (L) => L.age >= 60 && L.job && !L.job.partTime;

function retire(L) {
  const j = L.job;
  if (!j) return out(L, "Retire", "I don't have a job.", false);
  L.pension = Math.trunc(j.salary * Math.min(0.6, 0.02 * j.years));
  L.job = null;
  L.isRetired = true;
  adjust(L, { happiness: 15 });
  return out(L, "Retired", `🎉 I retired from my career as a ${j.title}. My pension is ${formatMoney(L.pension)}/yr.`);
}

// MARK: Careers: work actions, promotions, specializations

function availableJobActions(L) {
  if (!L.job) return [];
  const t = jobTemplate(L);
  const trackActions = L.job.track ? jobActions[`${t.id}.${L.job.track}`] || [] : [];
  const specific = (jobActions[t.id] || []).concat(trackActions).map(jobActionDefaults).filter((a) => a.minLevel <= L.job.level);
  const common = commonJobActions.map(jobActionDefaults);
  return t.partTime ? specific.concat([common[0]]) : specific.concat(common);
}

const hasUsedAction = (L, a) => (L.job ? L.job.usedActions.includes(a.id) : true);

function performJobAction(L, a) {
  const j = L.job;
  if (!j) return out(L, a.title, "I don't have a job.", false);
  if (j.usedActions.includes(a.id)) return out(L, a.title, "I've already done that this year.", false);
  j.usedActions.push(a.id);
  const skill = (L.stats.smarts + L.stats.health + L.stats.happiness) / 600 - 0.25;
  const chance = clamp(a.successChance + skill + j.level * 0.02, 0.05, 0.95);
  let m;
  if (roll(chance)) {
    j.performance = clamp(j.performance + a.performance, 0, 100);
    adjust(L, { happiness: a.happiness });
    L.fame = clamp(L.fame + a.fame, 0, 100);
    L.karma += a.karma;
    m = `${a.emoji} ${a.success}`;
    if (a.bonus) { const b = rnd(a.bonus[0], a.bonus[1]); L.money += b; m += ` (+${formatMoney(b)})`; }
  } else {
    j.performance = clamp(j.performance - Math.max(3, idiv(Math.abs(a.performance), 2)), 0, 100);
    adjust(L, { happiness: -3 - idiv(Math.abs(a.happiness), 2), health: -a.injury });
    if (a.karma < 0) L.karma += a.karma;
    m = `${a.emoji} ${a.failure}`;
    if (a.deathRisk > 0 && roll(a.deathRisk)) {
      die(L, a.deathCause);
      m += " I didn't survive.";
    } else if (a.prison && L.age >= 18) {
      const years = rnd(a.prison[0], a.prison[1]);
      L.criminalRecord.push(a.title);
      record(L, m);
      sendToPrison(L, years);
      record(L, `🚔 I was sentenced to ${plural(years, "year")} in prison.`);
      return { title: a.title, message: `${m} I was sentenced to ${plural(years, "year")} in prison.` };
    } else if (a.firedRisk > 0 && roll(a.firedRisk)) {
      L.job = null;
      adjust(L, { happiness: -10 });
      m += " I was fired!";
    }
  }
  return out(L, a.title, m);
}

function promote(L) {
  const ladder = currentLadder(L);
  const j = L.job;
  if (!j || j.level >= ladder.length - 1) return "";
  j.level += 1;
  j.yearsInLevel = 0;
  j.title = ladder[j.level];
  const newSalary = Math.max(j.salary, jobSalary(L, j.level));
  j.salary = newSalary;
  j.performance = Math.max(50, j.performance - 15);
  adjust(L, { happiness: 12 });
  const crown = j.level === ladder.length - 1 ? " I've reached the top of my field! 👑" : "";
  const m = `📈 I was promoted to ${j.title}! My salary is now ${formatMoney(newSalary)}.${crown}`;
  record(L, m);
  return m;
}

function askForPromotion(L) {
  const j = L.job;
  if (!j) return out(L, "Promotion", "I don't have a job.", false);
  if (mustChooseTrack(L)) return out(L, "Promotion", `To move up from ${j.title}, I need to choose a specialization first.`, false);
  if (j.level >= currentLadder(L).length - 1) return out(L, "Promotion", `I'm already the ${j.title}. There's nowhere left to climb!`, false);
  if (j.usedActions.includes("promotion")) return out(L, "Promotion", "I already asked for a promotion this year.", false);
  j.usedActions.push("promotion");
  const chance = (j.performance - 40) / 80 + (j.yearsInLevel >= 2 ? 0.15 : -0.2);
  if (j.performance >= 60 && j.yearsInLevel >= 1 && roll(chance)) return { title: "Promotion", message: promote(L) };
  j.performance = Math.max(0, j.performance - 5);
  adjust(L, { happiness: -5 });
  return out(L, "Promotion", j.yearsInLevel < 1 ? "My boss said I need more time in my current role first." : "My boss turned down my request for a promotion.");
}

const meetsTrack = (L, tr) => { tr = trackDefaults(tr); return L.stats.smarts >= tr.minSmarts && L.stats.health >= tr.minHealth; };

function chooseTrack(L, tr) {
  tr = trackDefaults(tr);
  const j = L.job;
  if (!j || !mustChooseTrack(L)) return out(L, tr.name, "I can't switch tracks right now.", false);
  if (!(j.yearsInLevel >= 1 && j.performance >= 50)) return out(L, tr.name, "I need at least a year on the job and solid performance before I can specialize.", false);
  if (j.usedActions.includes("track")) return out(L, tr.name, "I already applied for a new role this year.", false);
  if (!meetsTrack(L, tr)) return out(L, tr.name, `I don't meet the requirements for ${tr.name}: ${trackRequirementText(tr)}.`, false);
  j.usedActions.push("track");
  const chance = tr.selectivity >= 1 ? 1 : tr.selectivity + (j.performance - 50) / 150;
  if (!roll(chance)) {
    adjust(L, { happiness: -6 });
    return out(L, tr.name, `${tr.emoji} I applied to join ${tr.name}, but I wasn't selected. Maybe next year.`);
  }
  j.track = tr.id;
  record(L, `${tr.emoji} I chose the ${tr.name} career path.`);
  return { title: tr.name, message: promote(L) };
}

// MARK: Gigs, health, licenses, moving, adoption, social media

const canDoGig = (L, g) => L.age >= g.minAge && !inPrison(L) && count(L, "gigsThisYear") < 3;

function doGig(L, g) {
  bump(L, "gigsThisYear");
  const pay = rnd(g.pay[0], g.pay[1]);
  L.money += pay;
  return out(L, g.title, pay === 0 ? `${g.emoji} Nobody paid me anything for my ${g.title.toLowerCase()} gig.` : `${g.emoji} I earned ${formatMoney(pay)} doing a ${g.title.toLowerCase()} gig.`);
}

function treat(L, t) {
  L.money -= t.cost;
  if (t.id === "therapist") {
    adjust(L, { happiness: rnd(5, 12) });
    if (L.illnesses.includes("depression") && roll(0.5)) {
      L.illnesses = L.illnesses.filter((x) => x !== "depression");
      return out(L, t.title, "🛋️ My therapist helped me beat my depression.");
    }
    return out(L, t.title, "🛋️ I talked through my problems with a therapist. I feel a bit lighter.");
  }
  if (t.id === "witchDoctor" && roll(0.25)) {
    adjust(L, { health: -10 });
    return out(L, t.title, "🪬 The witch doctor made me drink something foul. I feel worse.");
  }
  if (!L.illnesses.length) {
    adjust(L, { health: rnd(2, 8) });
    return out(L, t.title, `${t.emoji} The ${t.title.toLowerCase()} says I'm perfectly healthy.`);
  }
  const cured = L.illnesses.filter((id) => roll(Math.min(0.97, Illnesses[id].cure * t.mult)));
  L.illnesses = L.illnesses.filter((id) => !cured.includes(id));
  if (!cured.length) return out(L, t.title, `${t.emoji} The ${t.title.toLowerCase()} couldn't cure me.`);
  adjust(L, { happiness: 8, health: 10 * cured.length });
  return out(L, t.title, `${t.emoji} The ${t.title.toLowerCase()} cured my ${cured.map((id) => Illnesses[id].name).join(", ")}!`);
}

function goToRehab(L) {
  L.money -= 15000;
  if (roll(0.6)) {
    const fixed = L.addictions.map((a) => Addictions[a]).join(", ");
    L.addictions = [];
    adjust(L, { happiness: 10, health: 10 });
    return out(L, "Rehab", `I completed rehab and kicked my ${fixed.toLowerCase()}!`);
  }
  return out(L, "Rehab", "I went to rehab, but I relapsed as soon as I got out.");
}

const canTakeDrivingTest = (L) => L.age >= 16 && !L.hasDriversLicense && !inPrison(L);

function takeDrivingTest(L) {
  if (roll(0.4 + L.stats.smarts / 200)) {
    L.hasDriversLicense = true;
    adjust(L, { happiness: 10 });
    return out(L, "Driving Test", "🚗 I passed my driving test and got my license!");
  }
  adjust(L, { happiness: -5 });
  return out(L, "Driving Test", `I failed my driving test. ${pick(["I hit a cone.", "I forgot to signal.", "I ran a stop sign.", "I parallel parked on the curb."])}`);
}

function emigrate(L, place) {
  if (L.age < 18) return out(L, "Emigrate", "I'm too young to move abroad by myself.", false);
  if (L.money < 5000) return out(L, "Emigrate", "I need $5,000 to move abroad.", false);
  L.money -= 5000;
  L.city = place[0];
  L.country = place[1];
  if (L.job) record(L, `I left my job as a ${L.job.title}.`);
  L.job = null;
  adjust(L, { happiness: 8 });
  return out(L, "Emigrate", `✈️ I emigrated to ${place[0]}, ${place[1]}!`);
}

function adoptPet(L, species) {
  if (L.age < 8) return out(L, "Pet Shelter", "My parents said I'm too young for a pet.", false);
  L.money -= 200;
  const pet = { ...makePerson("pet", rnd(0, 6), { noTrait: true, bond: 75 }), lastName: "", firstName: pick(Names.petNames), species, occupation: null, salary: 0, lastContact: L.age };
  L.relationships.push(pet);
  adjust(L, { happiness: 10 });
  return out(L, "Pet Shelter", `${petEmoji[species] || "🐾"} I adopted a ${species.toLowerCase()} named ${pet.firstName} from the shelter.`);
}

const canAdoptChild = (L) => L.age >= 21 && L.age <= 65 && !inPrison(L);

function adoptChild(L) {
  if (L.money < 10000) return out(L, "Adoption", "I need $10,000 to cover the adoption fees.", false);
  if (!(L.criminalRecord.length === 0 || roll(0.2))) return out(L, "Adoption", "The agency rejected me because of my criminal record.", false);
  L.money -= 10000;
  const child = makePerson("child", rnd(0, 10), { lastName: L.lastName, bond: 80 });
  child.occupation = null; child.salary = 0; child.money = 0; child.lastContact = L.age;
  L.relationships.push(child);
  adjust(L, { happiness: 15 });
  return out(L, "Adoption", `👶 I adopted a ${child.age}-year-old ${child.gender === "male" ? "boy" : "girl"} named ${child.firstName}!`);
}

const canPostOnSocialMedia = (L) => L.age >= 13 && !inPrison(L);

function postOnSocialMedia(L) {
  const base = (L.stats.looks + L.fame * 2) / 100;
  const viral = roll(0.04 + L.fame / 500);
  let gained = Math.trunc(rndf(1, 40) * base * (viral ? 200 : 1)) + idiv(L.followers, 50);
  if (roll(0.1)) gained = -Math.trunc(L.followers * 0.1);
  L.followers = Math.max(0, L.followers + gained);
  let m;
  if (viral) { m = `📱 My post went VIRAL! I gained ${formatCount(gained)} followers.`; L.fame = Math.min(100, L.fame + 5); adjust(L, { happiness: 12 }); }
  else if (gained < 0) { m = `📱 My post was ratioed and I lost ${formatCount(-gained)} followers.`; adjust(L, { happiness: -5 }); }
  else { m = `📱 I posted on social media and gained ${formatCount(gained)} followers.`; adjust(L, { happiness: 2 }); }
  if (L.followers >= 100000) {
    const deal = idiv(L.followers, 20);
    L.money += deal;
    L.fame = Math.min(100, Math.max(L.fame, idiv(L.followers, 20000)));
    m += ` A brand paid me ${formatMoney(deal)} for a sponsored post.`;
  }
  return out(L, "Social Media", m);
}

// MARK: Relationships

const canFindDate = (L) => L.age >= 16 && !romanticPartner(L) && !inPrison(L);
const canHookUp = (L) => L.age >= 18 && !inPrison(L);

function findDate(L, gender) {
  if (gender) L.datingPreference = gender;
  if (!roll(0.35 + L.stats.looks / 200)) {
    adjust(L, { happiness: -3 });
    return out(L, "Dating", "I went looking for love, but struck out.");
  }
  const p = makePerson("partner", Math.max(16, L.age + rnd(-5, 5)), { gender: preferredGender(L), bond: rnd(50, 80) });
  p.lastContact = L.age;
  L.relationships.push(p);
  bump(L, "partners");
  adjust(L, { happiness: 10 });
  return out(L, "Dating", `❤️ I met ${relName(p)} (${p.age}) and we started dating!`);
}

function makeFriend(L) {
  const f = makePerson("friend", Math.max(5, L.age + rnd(-3, 3)), { bond: rnd(40, 70) });
  f.lastContact = L.age;
  L.relationships.push(f);
  adjust(L, { happiness: 4 });
  let m = `I made a new friend named ${relName(f)}.`;
  const partner = romanticPartner(L);
  if (partner && partner.trait === "jealous") {
    updateRel(L, partner.id, (p) => { p.bond -= 8; });
    m += ` ${partner.firstName} got jealous of how much time I spend with them.`;
  }
  return out(L, "New Friend", m);
}

function hookUp(L) {
  const p = makePerson("friend", Math.max(18, L.age + rnd(-6, 6)), { gender: preferredGender(L) });
  bump(L, "partners");
  adjust(L, { happiness: 8 });
  let m = `🔥 I hooked up with ${relName(p)} (${p.age}).`;
  if (roll(0.08) && !L.illnesses.includes("std")) { L.illnesses.push("std"); m += " A week later I tested positive for an STD."; }
  const partner = romanticPartner(L);
  if (partner) {
    L.karma -= 5;
    if (roll(partner.trait === "jealous" ? 0.6 : 0.35)) {
      updateRel(L, partner.id, (x) => { x.bond -= 45; });
      adjust(L, { happiness: -15 });
      m += ` ${partner.firstName} found out I cheated!`;
    }
  }
  return out(L, "Hookup", m);
}

function relationshipActions(L, p) {
  if (!p.isAlive || inPrison(L)) return [];
  if (p.kind === "pet") return ["play", "walkPet"];
  const list = ["spendTime", "conversation", "compliment"];
  if (L.age >= 10) list.push("gift");
  if (isParent(p.kind) || isRomantic(p.kind)) list.push("askForMoney");
  list.push("argue", "insult");
  if (L.age >= 6) list.push("prank");
  if (L.age >= 14) list.push("assault");
  if (L.age >= 16) list.push("murder");
  if (p.kind === "partner") { if (L.age >= 18) list.push("propose"); list.push("breakUp"); if (L.age >= 18) list.push("haveBaby"); }
  if (p.kind === "fiance") list.push("marry", "haveBaby", "breakUp");
  if (p.kind === "spouse") list.push("haveBaby", "breakUp");
  return list;
}

function performRelAction(L, action, id) {
  const p = findRel(L, id);
  if (!p) return out(L, "Oops", "That person is no longer in my life.", false);
  const name = p.firstName;
  const pr = pronoun(p.gender);
  const upd = (fn) => updateRel(L, id, fn);
  let m;
  touch(L, id);
  switch (action) {
    case "spendTime": upd((x) => { x.bond += rnd(3, 10); }); adjust(L, { happiness: 4 }); m = `I spent quality time with my ${relTitle(p).toLowerCase()} ${name}.`; break;
    case "conversation":
      if (p.trait === "funny") { upd((x) => { x.bond += rnd(3, 7); }); adjust(L, { happiness: 5 }); m = `😂 ${name} had me laughing so hard my sides hurt.`; }
      else if (roll(0.85)) { upd((x) => { x.bond += rnd(2, 6); }); m = `I had a nice conversation with ${name}.`; }
      else { upd((x) => { x.bond -= 4; }); m = `My conversation with ${name} turned into an awkward silence.`; }
      break;
    case "compliment": upd((x) => { x.bond += rnd(1, 5); }); m = `I told ${name} ${pick(["they look great", "they're really smart", "they have a great laugh", "I admire them"])}.`; break;
    case "gift": L.money -= 100; upd((x) => { x.bond += rnd(5, 12); }); m = `I gave ${name} a thoughtful gift. ${cap(pr.subject)} loved it!`; break;
    case "askForMoney": {
      let chance = p.bond / 140;
      if (p.trait === "generous") chance += 0.3;
      if (p.trait === "lazy" || p.trait === "toxic") chance -= 0.2;
      if (p.money > 100 && roll(chance)) {
        const amount = Math.min(p.money, rnd(10, Math.max(11, idiv(p.money, 20))));
        L.money += amount;
        upd((x) => { x.money -= amount; x.bond -= 2; });
        m = `${name} gave me ${formatMoney(amount)}.`;
      } else { upd((x) => { x.bond -= 5; }); m = `${name} refused to give me any money.`; }
      break;
    }
    case "argue": upd((x) => { x.bond -= rnd(5, 15); }); adjust(L, { happiness: -3 }); m = `I got into a heated argument with ${name} about ${pick(["politics", "money", "chores", "the past", "nothing in particular"])}.`; break;
    case "propose":
      if (roll(p.bond / 110)) { upd((x) => { x.kind = "fiance"; x.bond += 10; }); adjust(L, { happiness: 15 }); m = `💍 I proposed to ${name} and ${pr.subject} said YES!`; }
      else { upd((x) => { x.bond -= 15; }); adjust(L, { happiness: -15 }); m = `I proposed to ${name}, but ${pr.subject} said no.`; }
      break;
    case "marry": { const cost = rnd(5000, 30000); L.money -= cost; upd((x) => { x.kind = "spouse"; x.bond += 10; }); adjust(L, { happiness: 20 }); m = `💒 I married ${name} in a beautiful ${formatMoney(cost)} ceremony!`; break; }
    case "haveBaby":
      if (L.age > 50 || p.age > 50 || !roll(0.55)) m = "We tried for a baby, but it didn't happen this time.";
      else {
        const g = pick(["male", "female"]);
        const baby = makePerson("child", 0, { gender: g, lastName: L.lastName, bond: 100 });
        baby.occupation = null; baby.salary = 0; baby.money = 0; baby.lastContact = L.age;
        L.relationships.push(baby);
        upd((x) => { x.bond += 5; });
        adjust(L, { happiness: 15 });
        m = `👶 We welcomed a baby ${g === "male" ? "boy" : "girl"} named ${baby.firstName}!`;
      }
      break;
    case "breakUp":
      L.relationships = L.relationships.filter((x) => x.id !== id);
      adjust(L, { happiness: -10 });
      if (p.kind === "spouse") { const s = Math.max(0, idiv(L.money, 2)); L.money -= s; m = `I divorced ${name}. The settlement cost me ${formatMoney(s)}.`; }
      else m = `I broke up with ${name}.`;
      break;
    case "play": upd((x) => { x.bond += rnd(4, 10); }); adjust(L, { happiness: 5 }); m = `I played with ${name}. ${p.species === "Cat" ? "Purrr!" : "So much fun!"}`; break;
    case "walkPet": upd((x) => { x.bond += rnd(3, 8); }); adjust(L, { happiness: 3, health: 2 }); m = `I took ${name} for a walk.`; break;
    case "insult": upd((x) => { x.bond -= rnd(6, 14); }); L.karma -= 1; m = `I called ${name} ${pick(["a loser", "ugly", "a waste of space", "boring", "a clown"])}.`; break;
    case "prank":
      if (roll(0.6)) { upd((x) => { x.bond += 2; }); adjust(L, { happiness: 5 }); m = `I pranked ${name} and we both laughed about it.`; }
      else { upd((x) => { x.bond -= 10; }); m = `I pranked ${name}. ${cap(pr.subject)} did NOT find it funny.`; }
      break;
    case "assault":
      L.karma -= 8; bump(L, "crimes"); upd((x) => { x.bond -= 40; });
      if (roll(0.35) && L.age >= 18) {
        L.criminalRecord.push("Assault");
        sendToPrison(L, rnd(1, 3));
        m = `I attacked ${name}. ${cap(pr.subject)} pressed charges and I was sent to prison for ${plural(L.prisonYearsLeft, "year")}.`;
      } else { adjust(L, { health: -rnd(0, 8) }); m = `I got into a fistfight with ${name} and beat ${pr.object} up.`; }
      break;
    case "murder":
      L.karma -= 40; bump(L, "crimes");
      if (roll(0.55)) {
        bump(L, "murders");
        upd((x) => { x.isAlive = false; });
        if (roll(0.45)) {
          L.criminalRecord.push("Murder");
          sendToPrison(L, rnd(25, 60));
          m = `🔪 I murdered ${name}. The police caught me and I was sentenced to ${L.prisonYearsLeft} years in prison.`;
        } else m = `🔪 I murdered ${name} and got away with it... for now.`;
      } else {
        upd((x) => { x.bond = 0; });
        if (roll(0.5) && L.age >= 18) {
          L.criminalRecord.push("Attempted Murder");
          sendToPrison(L, rnd(8, 20));
          m = `I tried to kill ${name} but failed. I was sentenced to ${L.prisonYearsLeft} years for attempted murder.`;
        } else m = `I tried to kill ${name} but ${pr.subject} escaped.`;
      }
      break;
  }
  return out(L, relName(p), m);
}

// MARK: Assets

function marketListings(kind) {
  const source = kind === "house" ? Names.houses : kind === "car" ? Names.cars : Names.boats;
  return source.map(([name, price]) => ({ id: uid(), kind, name, price: idiv(Math.trunc(price * rndf(0.85, 1.2)), 100) * 100 }));
}

const assetEmoji = (kind) => ({ house: "🏠", car: "🚗", boat: "🛥️" }[kind]);

const canFinance = (L, listing) =>
  listing.kind === "house" && L.job && !L.job.partTime && L.money >= idiv(listing.price, 5) && L.job.salary * 6 >= listing.price;

function buyAsset(L, listing, financed = false) {
  if (L.age < 18) return out(L, "Too Young", "I'm too young to buy that.", false);
  if (listing.kind === "car" && !L.hasDriversLicense) return out(L, "No License", "I need a driver's license before I can buy a car.", false);
  const down = financed ? idiv(listing.price, 5) : listing.price;
  if (L.money < down || (financed && !canFinance(L, listing))) return out(L, "Can't Afford", `I can't afford the ${listing.name}. I need ${formatMoney(down)}.`, false);
  L.money -= down;
  L.assets.push({ id: uid(), kind: listing.kind, name: listing.name, purchasePrice: listing.price, value: listing.price, yearsOwned: 0, loan: listing.price - down });
  adjust(L, { happiness: 10 });
  return out(L, "Purchased", financed ? `I bought a ${listing.name} with a ${formatMoney(listing.price - down)} mortgage!` : `I bought a ${listing.name} for ${formatMoney(listing.price)}!`);
}

function sellAsset(L, id) {
  const a = L.assets.find((x) => x.id === id);
  if (!a) return out(L, "Oops", "I don't own that anymore.", false);
  L.assets = L.assets.filter((x) => x.id !== id);
  L.money += a.value - a.loan;
  const payoff = a.loan > 0 ? ` After paying off the loan I kept ${formatMoney(a.value - a.loan)}.` : "";
  return out(L, "Sold", `I sold my ${a.name} for ${formatMoney(a.value)}.${payoff}`);
}
