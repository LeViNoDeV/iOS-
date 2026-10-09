// LifeSim: jobs that feel like jobs. Every job has hours, a schedule, stress, physical demands,
// danger and benefits. Your boss, your coworkers, your commute and your workload change your
// health, happiness and relationships. Yearly reviews decide raises; recessions bring layoffs.
"use strict";

// hours: per week · stress/physical: 0-100 · danger: yearly injury risk · shift: day/night/rotating/irregular
// benefits: health insurance, 401(k) match %, government pension, vacation days · game: the mini-game for working hard
const prof = (hours, stress, physical, shift, extra = {}) => ({ hours, stress, physical, shift, danger: 0, hourly: false, health: true, match: 3, pension: false, vacation: 15, remote: false, away: false, game: ["typing", { words: "office" }], ...extra });
const JobProfiles = {
  babysitter: prof(15, 25, 30, "irregular", { hourly: true, health: false, match: 0, vacation: 0, game: ["catch", { target: "🧸", title: "Keep the kids out of trouble" }] }),
  cashier: prof(20, 35, 25, "day", { hourly: true, health: false, match: 0, vacation: 5, game: ["math", { level: 1, title: "Count the change" }] }),
  lifeguard: prof(20, 20, 60, "day", { hourly: true, health: false, match: 0, vacation: 0, game: ["catch", { target: "🏊", title: "Spot the swimmer in trouble" }] }),
  dogwalker: prof(15, 10, 55, "day", { hourly: true, health: false, match: 0, vacation: 0, game: ["catch", { target: "🐕", title: "Round up the dogs" }] }),
  janitor: prof(40, 30, 60, "night", { hourly: true, danger: 0.01, vacation: 10, game: ["catch", { target: "🧽", title: "Clean every spill" }] }),
  fastfood: prof(35, 55, 45, "rotating", { hourly: true, health: false, match: 0, vacation: 5, game: ["catch", { target: "🍔", title: "Lunch rush" }] }),
  barista: prof(32, 45, 35, "day", { hourly: true, vacation: 10, game: ["catch", { target: "☕", title: "Morning rush" }] }),
  construction: prof(45, 45, 85, "day", { hourly: true, danger: 0.04, vacation: 10, game: ["timing", { verb: "Nail it!", title: "Frame the wall" }] }),
  trucker: prof(55, 50, 40, "irregular", { hourly: true, danger: 0.02, away: true, vacation: 10, game: ["timing", { verb: "Brake!", title: "Back into the loading dock" }] }),
  receptionist: prof(40, 40, 10, "day", { vacation: 12, game: ["typing", { words: "office", title: "Answer the emails" }] }),
  police: prof(45, 75, 60, "rotating", { danger: 0.03, pension: true, match: 0, vacation: 20, game: ["catch", { target: "🦹", title: "Chase the suspect" }] }),
  firefighter: prof(48, 65, 85, "rotating", { danger: 0.03, pension: true, match: 0, vacation: 20, game: ["timing", { verb: "Spray!", title: "Hit the fire's base" }] }),
  model: prof(30, 55, 30, "irregular", { health: false, match: 0, vacation: 0, game: ["memory", { pads: ["💃", "🕺", "😎", "📸"], title: "Hit your poses" }] }),
  teacher: prof(50, 60, 20, "day", { pension: true, match: 0, vacation: 40, game: ["math", { level: 2, title: "Grade the tests" }] }),
  nurse: prof(40, 70, 55, "rotating", { danger: 0.01, match: 4, vacation: 18, game: ["memory", { pads: ["💊", "💉", "🩺", "🩹"], title: "Remember each patient's meds" }] }),
  engineer: prof(42, 45, 15, "day", { match: 5, vacation: 18, game: ["math", { level: 3, title: "Check the load calculations" }] }),
  software: prof(45, 50, 5, "day", { match: 5, vacation: 20, remote: true, game: ["typing", { words: "code", title: "Fix the bug before the deadline" }] }),
  accountant: prof(45, 55, 5, "day", { match: 4, vacation: 18, game: ["math", { level: 3, title: "Balance the books" }] }),
  marketing: prof(42, 50, 5, "day", { match: 4, vacation: 18, remote: true, game: ["typing", { words: "office", title: "Write the campaign brief" }] }),
  psych: prof(40, 55, 5, "day", { match: 4, vacation: 20, game: ["memory", { pads: ["😢", "😠", "😟", "😊"], title: "Remember what your patient said" }] }),
  doctor: prof(60, 80, 30, "rotating", { match: 6, vacation: 20, game: ["timing", { verb: "Cut!", title: "Steady hands in surgery", zone: 0.12 }] }),
  lawyer: prof(60, 80, 5, "day", { match: 6, vacation: 15, game: ["typing", { words: "legal", title: "Draft the motion" }] }),
  banker: prof(75, 90, 5, "day", { match: 6, vacation: 15, game: ["math", { level: 3, title: "Price the deal" }] }),
  chef: prof(50, 75, 60, "night", { hourly: true, danger: 0.02, vacation: 10, game: ["catch", { target: "🍳", title: "Dinner service" }] }),
  pilot: prof(35, 55, 20, "irregular", { away: true, match: 8, vacation: 25, game: ["timing", { verb: "Touch down!", title: "Land in a crosswind", zone: 0.13 }] }),
  scientist: prof(45, 45, 15, "day", { match: 5, vacation: 20, game: ["memory", { pads: ["🧪", "🧫", "🔬", "🧬"], title: "Run the experiment protocol" }] }),
  soldier: prof(60, 75, 85, "irregular", { danger: 0.04, away: true, pension: true, match: 0, vacation: 30, game: ["timing", { verb: "Fire!", title: "Qualify on the range" }] }),
  actor: prof(40, 60, 30, "irregular", { health: false, match: 0, vacation: 0, game: ["memory", { pads: ["😀", "😢", "😡", "😱"], title: "Remember your lines" }] }),
  musician: prof(35, 55, 25, "night", { health: false, match: 0, vacation: 0, game: ["memory", { pads: ["🎵", "🎶", "🥁", "🎸"], title: "Play the riff back" }] }),
  athlete: prof(40, 65, 95, "irregular", { danger: 0.05, match: 0, vacation: 0, game: ["timing", { verb: "Shoot!", title: "Take the winning shot" }] }),
};
const jobProfile = (t) => JobProfiles[t.id] || prof(40, 50, 20, "day");

const HoursModes = { coast: ["Coast", 0.85, -6, 0.7], normal: ["Normal hours", 1, 0, 1], overtime: ["Overtime", 1.25, 6, 1.3] };
const BossStyles = {
  supportive: ["Supportive", "Has your back and helps you grow."], fair: ["Fair", "Judges you on your work."], micromanager: ["Micromanager", "Watches everything you do."],
  absent: ["Hands-off", "You rarely see them."], toxic: ["Toxic", "Yells, takes credit, plays favorites."],
};
const ShiftNames = { day: "Day shift", night: "Night shift", rotating: "Rotating shifts", irregular: "Irregular hours" };
const stressWord = (s) => (s >= 75 ? "Very high stress" : s >= 55 ? "High stress" : s >= 35 ? "Moderate stress" : "Low stress");

/// Details that differ between two offers for the same job.
function openingDetails(t) {
  const p = jobProfile(t);
  const remote = p.remote && roll(0.4);
  const government = p.pension;
  return {
    commute: remote ? 0 : rnd(8, 75), remote,
    health: p.health && (government || roll(0.85)),
    match: p.match ? clamp(p.match + rnd(-2, 2), 0, 8) : 0,
    pension: p.pension, vacation: p.vacation ? Math.max(5, p.vacation + rnd(-3, 5)) : 0,
  };
}

function newBoss() {
  const style = weightedPick([["supportive", 3], ["fair", 3], ["micromanager", 2], ["absent", 1.5], ["toxic", 1]]);
  const g = pick(["male", "female"]);
  return { name: `${Names.first(g)} ${Names.randomLast()}`, gender: g, style, bond: style === "toxic" ? 35 : 50 };
}

/// Sets up the parts of a job that make it feel real (also upgrades jobs from older saves).
function normalizeJob(L, details) {
  const j = L.job;
  if (!j || j.boss) return j;
  const d = details || openingDetails(jobTemplate(L));
  Object.assign(j, {
    hoursMode: "normal", stress: 25, satisfaction: 60, boss: newBoss(), warnings: 0, lastReview: null,
    commute: d.commute, remote: d.remote, benefits: { health: d.health, match: d.match, pension: d.pension }, vacationDays: d.vacation, vacationLeft: d.vacation,
  });
  return j;
}

const jobHours = (L) => (L.job ? Math.round(jobProfile(jobTemplate(L)).hours * HoursModes[L.job.hoursMode || "normal"][1]) : 0);
const hasHealthInsurance = (L) => !!(L.job && L.job.benefits && L.job.benefits.health) || (L.isRetired && L.age >= 65);

/// Adds two coworkers to your life when you start a job.
function meetCoworkers(L) {
  for (let i = 0; i < 2; i++) {
    const c = makePerson("coworker", clamp(L.age + rnd(-12, 12), 18, 70), { bond: rnd(35, 60) });
    c.lastContact = L.age;
    L.relationships.push(c);
  }
}
/// When you leave a job, work friends stay friends; the rest drift away.
function leaveCoworkers(L) {
  for (const p of [...L.relationships]) {
    if (p.kind !== "coworker") continue;
    if (p.isAlive && p.bond >= 60) p.kind = "friend";
    else L.relationships = L.relationships.filter((x) => x.id !== p.id);
  }
}

// MARK: Actions

function setHoursMode(L, mode) { if (L.job && HoursModes[mode]) L.job.hoursMode = mode; }

function talkToBoss(L) {
  const j = L.job;
  if (!j) return out(L, "Boss", "I don't have a job.", false);
  normalizeJob(L);
  if (j.usedActions.includes("boss")) return out(L, "Boss", "I already had a one-on-one with my boss this year.", false);
  j.usedActions.push("boss");
  const b = j.boss;
  const gain = { supportive: [6, 12], fair: [4, 9], micromanager: [2, 7], absent: [0, 4], toxic: [-4, 5] }[b.style];
  const d = rnd(gain[0], gain[1]);
  b.bond = clamp(b.bond + d, 0, 100);
  if (d > 0) j.performance = clamp(j.performance + 2, 0, 100);
  const line = {
    supportive: `${b.name.split(" ")[0]} gave me honest feedback and offered to mentor me.`,
    fair: `${b.name.split(" ")[0]} and I went over my goals for the year.`,
    micromanager: `${b.name.split(" ")[0]} spent the meeting going through my spreadsheet line by line.`,
    absent: `${b.name.split(" ")[0]} canceled our meeting twice, then gave me five minutes.`,
    toxic: d > 0 ? `${b.name.split(" ")[0]} was in a rare good mood.` : `${b.name.split(" ")[0]} spent the meeting criticizing me in front of the team.`,
  }[b.style];
  return out(L, "One-on-one", `🧑‍💼 ${line}`);
}

function takeVacationDays(L) {
  const j = L.job;
  if (!j) return out(L, "Vacation", "I don't have a job.", false);
  normalizeJob(L);
  if (j.vacationLeft <= 0) return out(L, "Vacation", j.vacationDays ? "I've used all my vacation days this year." : "This job doesn't give paid vacation.", false);
  const days = Math.min(j.vacationLeft, rnd(5, 10));
  j.vacationLeft -= days;
  j.stress = Math.max(0, j.stress - days * 2.5);
  adjust(L, { happiness: rnd(4, 9), health: 2 });
  const partner = romanticPartner(L);
  if (partner) { touch(L, partner.id); updateRel(L, partner.id, (x) => { x.bond += rnd(2, 6); }); }
  return out(L, "Vacation", `🏖️ I took ${days} days off${partner ? ` with ${partner.firstName}` : ""} and actually unplugged. ${j.vacationLeft} vacation days left this year.`);
}

function callInSick(L) {
  const j = L.job;
  if (!j) return out(L, "Sick day", "I don't have a job.", false);
  normalizeJob(L);
  if (j.usedActions.includes("sick")) return out(L, "Sick day", "Calling in sick twice in a year would look bad.", false);
  j.usedActions.push("sick");
  j.stress = Math.max(0, j.stress - 6);
  adjust(L, { happiness: 3 });
  if (j.boss.style === "micromanager" || j.boss.style === "toxic" ? roll(0.4) : roll(0.15)) { j.performance = clamp(j.performance - 6, 0, 100); j.boss.bond = clamp(j.boss.bond - 6, 0, 100); return out(L, "Sick day", "🤒 I called in sick. My boss saw my beach photos on social media."); }
  return out(L, "Sick day", "🤒 I called in sick and spent the day on the couch. Nobody questioned it.");
}

function withdraw401k(L) {
  const bal = Math.round(L.retirement401k || 0);
  if (!bal) return out(L, "401(k)", "There's nothing in my retirement account.", false);
  const early = L.age < 60;
  const net = Math.round(bal * (early ? 0.65 : 0.8));
  L.money += net; L.retirement401k = 0;
  return out(L, "401(k)", `💰 I cashed out my retirement account: ${formatMoney(bal)}. After ${early ? "taxes and the early-withdrawal penalty" : "taxes"} I got ${formatMoney(net)}.`);
}

// MARK: Each year

function progressUnemployment(L) {
  const u = L.unemployment;
  if (!u) return;
  if (L.job) { L.unemployment = null; return; }
  L.money += u.amount;
  record(L, `📬 I collected ${formatMoney(u.amount)} in unemployment benefits.`);
  u.years -= 1;
  if (u.years <= 0) L.unemployment = null;
}

function grow401k(L) {
  if (L.retirement401k > 0) L.retirement401k = Math.round(L.retirement401k * rndf(0.98, 1.1));
}

/// The year at work and what it does to the rest of your life. Runs after you're paid.
function jobLifeYear(L) {
  const j = L.job;
  const t = jobTemplate(L);
  const p = jobProfile(t);
  const mode = HoursModes[j.hoursMode || "normal"];
  const hours = jobHours(L);
  // Overtime pays extra for hourly workers.
  if (p.hourly && j.hoursMode === "overtime") {
    const extra = Math.round(j.salary * 0.25 * 1.5 * 0.75);
    L.money += extra;
    record(L, `⏱️ Overtime pay added ${formatMoney(extra)} this year.`);
  }
  // Retirement savings.
  if (j.benefits.match > 0) {
    const contrib = Math.round(j.salary * 0.06);
    L.money -= Math.round(contrib * 0.75);
    L.retirement401k = (L.retirement401k || 0) + contrib + Math.round(j.salary * j.benefits.match / 100);
  }
  // Stress builds from the job, the hours, the boss and the commute.
  const bossStress = { supportive: -8, fair: 0, micromanager: 8, absent: -2, toxic: 16 }[j.boss.style];
  const target = clamp(p.stress * mode[3] + bossStress + j.commute / 6 - (j.remote ? 6 : 0), 0, 100);
  j.stress = clamp(Math.round(j.stress + (target - j.stress) * 0.45 + rnd(-4, 4)), 0, 100);
  const effects = [];
  if (j.stress >= 45) { adjust(L, { happiness: -Math.round((j.stress - 40) / 8) }); }
  if (j.stress >= 75) { adjust(L, { health: -2 }); effects.push("stress"); }
  // The body: physical work keeps you fit; desk jobs don't. Night shifts wear you down.
  if (p.physical >= 60) adjust(L, { health: L.age < 50 ? 1 : -1 });
  else if (p.physical <= 15 && L.age >= 35 && count(L, "gym") < L.age / 3) adjust(L, { health: -1 });
  if (p.shift === "night" || p.shift === "rotating") { adjust(L, { health: -1, happiness: -1 }); }
  // Time: long hours, travel and night shifts cost your relationships.
  const loved = L.relationships.filter((x) => x.isAlive && (isRomantic(x.kind) || (x.kind === "child" && x.age < 18)));
  const away = hours >= 55 ? 3 : hours >= 48 ? 2 : 0;
  const hit = away + (p.away ? 2 : 0) + (p.shift === "night" ? 1 : 0);
  if (hit && loved.length) {
    for (const x of loved) x.bond = clamp(x.bond - hit, 0, 100);
    if (roll(0.3)) record(L, pick([`👨‍👩‍👧 My family says they never see me. I worked about ${hours} hours a week.`, `💔 ${loved[0].firstName} is tired of me always being at work.`, "🍽️ I missed dinner at home more nights than I made it."]));
  }
  // The commute.
  if (j.commute >= 60) adjust(L, { happiness: -3 });
  else if (j.commute >= 40) adjust(L, { happiness: -1 });
  if (j.remote) adjust(L, { happiness: 2 });
  // Injuries on dangerous jobs.
  if (p.danger && roll(p.danger * (j.hoursMode === "overtime" ? 1.4 : 1))) {
    const hurt = rnd(10, 25);
    adjust(L, { health: -hurt });
    const comp = Math.round(j.salary * 0.1);
    L.money += comp;
    notify(L, "🩹", "Hurt at Work", `🩹 I was injured on the job${pick([" when a ladder gave way", " lifting something too heavy", " in an accident", ""])}. Workers' comp paid ${formatMoney(comp)}.`);
  }
  // How you feel about the job.
  const payRatio = j.salary / Math.max(1, jobSalary(L, j.level));
  const satTarget = 55 + (payRatio - 1) * 40 + (j.boss.bond - 50) / 3 - (j.stress - 50) / 3 - (j.commute >= 60 ? 6 : 0) + (j.remote ? 5 : 0);
  j.satisfaction = clamp(Math.round(j.satisfaction + (satTarget - j.satisfaction) * 0.35 + rnd(-4, 4)), 0, 100);
  if (j.satisfaction < 25) { adjust(L, { happiness: -4 }); if (roll(0.4)) record(L, `😩 I dread going to work at ${j.company} every morning.`); }
  else if (j.satisfaction > 80) adjust(L, { happiness: 3 });
  // Effort and your boss shape performance.
  const bossPerf = { supportive: 2, fair: 0, micromanager: -1, absent: 0, toxic: -3 }[j.boss.style];
  j.performance = clamp(j.performance + mode[2] + bossPerf + Math.round((j.satisfaction - 50) / 20) - (j.stress >= 80 ? 5 : 0), 0, 100);
  j.boss.bond = clamp(j.boss.bond + Math.round((j.performance - 55) / 15) + rnd(-3, 3), 0, 100);
  j.vacationLeft = j.vacationDays;
  return effects;
}

/// The annual review: your rating, your raise, and warnings if it's going badly.
function annualReview(L) {
  const j = L.job;
  const perf = j.performance;
  let rating, raise = 0;
  if (perf >= 80) { rating = "Exceeds expectations"; raise = rndf(0.04, 0.07); j.warnings = Math.max(0, j.warnings - 1); }
  else if (perf >= 55) { rating = "Meets expectations"; raise = rndf(0.015, 0.035); j.warnings = Math.max(0, j.warnings - 1); }
  else if (perf >= 35) { rating = "Needs improvement"; j.warnings += 1; }
  else { rating = "Unsatisfactory"; j.warnings += 2; }
  raise += (j.boss.bond - 50) / 2000;
  const amount = Math.max(0, Math.min(salaryCap(L) - j.salary, Math.round(j.salary * Math.max(0, raise))));
  j.salary += amount;
  j.lastReview = { age: L.age, rating, raise: amount };
  if (j.warnings >= 3) {
    leaveCoworkers(L);
    L.job = null;
    notify(L, "❌", "Fired", `❌ After repeated poor reviews, ${j.company} let me go.`);
    adjust(L, { happiness: -15 });
    return;
  }
  record(L, `📋 Annual review: "${rating}."${amount ? ` Raise: ${formatMoney(amount)} (now ${formatMoney(j.salary)}).` : ""}${j.warnings ? ` ⚠️ I'm on warning ${j.warnings} of 3.` : ""}`);
  if (j.warnings === 2) popup(L, "⚠️", "Final Warning", `⚠️ My boss put me on a performance improvement plan. One more bad review and I'm out.`);
}

function layoffCheck(L) {
  const j = L.job;
  const p = jobProfile(jobTemplate(L));
  if (p.pension || !L.housing || L.housing.last > -0.05) return false;
  if (!roll(Math.max(0.03, 0.18 - j.performance / 700))) return false;
  const severance = Math.round(j.salary * Math.min(0.5, 0.04 * Math.max(1, j.years)));
  L.money += severance;
  L.unemployment = { amount: Math.round(j.salary * 0.4), years: 1 };
  leaveCoworkers(L);
  L.job = null;
  notify(L, "📦", "Laid Off", `📦 The recession hit ${j.company} hard and I was laid off. I got ${formatMoney(severance)} in severance and can claim unemployment.`);
  adjust(L, { happiness: -15 });
  return true;
}

function workEvent(L) {
  const j = L.job;
  const opts = ["weekend", "mistake", "training", "party", "headhunter"];
  if (!jobProfile(jobTemplate(L)).pension) opts.push("transfer");
  if (j.stress >= 82) opts.push("burnout", "burnout", "burnout");
  const k = pick(opts);
  const boss = j.boss.name.split(" ")[0];
  switch (k) {
    case "weekend": packEvent(L, "workWeekend", {}, `${boss} needs you to work this weekend to hit a deadline.`, ["Work the weekend", "Say you have plans", "Agree, then call in sick"]); break;
    case "mistake": packEvent(L, "workMistake", {}, "You made a costly mistake at work. Nobody's noticed yet.", ["Own up to it", "Blame a coworker", "Quietly fix it and hope"]); break;
    case "training": packEvent(L, "workTraining", {}, `${j.company} will pay for a professional certification course. It means studying nights for months.`, ["Take the course", "Pass for now"]); break;
    case "party": packEvent(L, "workParty", {}, "The office holiday party is tonight. Open bar.", ["Go and mingle", "Go and drink too much", "Skip it"]); break;
    case "headhunter": {
      const offer = Math.round(j.salary * rndf(1.1, 1.3) / 100) * 100;
      const company = pick(companyNames.filter((c) => c !== j.company));
      packEvent(L, "workHeadhunter", { offer, company }, `A recruiter wants you for a ${j.title} role at ${company} paying ${formatMoney(offer)}.`, ["Take the new job", "Use it to ask for a raise", "Not interested"]);
      break;
    }
    case "transfer": {
      const c = pick(WORLD.filter((x) => x[0] === L.country)) || pick(WORLD);
      const city = pick(c[1].filter((x) => x !== L.city).concat([c[1][0]]));
      packEvent(L, "workTransfer", { city, country: c[0] }, `${j.company} offered you a transfer to its ${city} office with a 15% raise.`, ["Move for the job", "Stay where I am"]);
      break;
    }
    case "burnout": packEvent(L, "workBurnout", {}, "You're completely burned out. You can't sleep, and you snap at everyone.", ["Take three months of unpaid leave", "Push through it", "Quit"]); break;
  }
}

function progressJob(L) {
  const j = L.job;
  normalizeJob(L);
  jobLifeYear(L);
  if (layoffCheck(L)) return "gone";
  annualReview(L);
  if (!L.job) return "gone";
  if (roll(0.3) && !L.pendingEvents.some((e) => e.kind.startsWith("work"))) workEvent(L);
  return j;
}

const jobOf = (L) => { const j = L.job; if (j) normalizeJob(L); return j; };

packEvents({
  workWeekend: {
    emoji: "📆", title: "Weekend Work",
    resolve: (L, d, c) => {
      const j = jobOf(L); if (!j) return "Not my problem anymore.";
      if (c === 0) { j.performance = clamp(j.performance + 6, 0, 100); j.stress = clamp(j.stress + 8, 0, 100); j.boss.bond = clamp(j.boss.bond + 6, 0, 100); adjust(L, { happiness: -3 }); return "I worked all weekend. We hit the deadline, and my boss noticed."; }
      if (c === 1) { j.boss.bond = clamp(j.boss.bond - 6, 0, 100); adjust(L, { happiness: 3 }); return "I said I had plans. My boss wasn't thrilled."; }
      L.karma -= 2;
      if (roll(0.4)) { j.boss.bond = clamp(j.boss.bond - 15, 0, 100); j.performance = clamp(j.performance - 8, 0, 100); return "I said yes, then called in sick. My boss saw right through it."; }
      return "I said yes, then called in sick. I got away with it.";
    },
  },
  workMistake: {
    emoji: "😬", title: "A Mistake",
    resolve: (L, d, c) => {
      const j = jobOf(L); if (!j) return "Not my problem anymore.";
      if (c === 0) { j.performance = clamp(j.performance - 3, 0, 100); j.boss.bond = clamp(j.boss.bond + 6, 0, 100); return "I owned up. My boss respected the honesty, and we fixed it together."; }
      if (c === 1) {
        L.karma -= 8;
        const cw = L.relationships.find((x) => x.kind === "coworker" && x.isAlive);
        if (cw) updateRel(L, cw.id, (x) => { x.bond -= 20; });
        if (roll(0.35)) { j.performance = clamp(j.performance - 15, 0, 100); j.warnings += 1; return `I blamed ${cw ? cw.firstName : "a coworker"}. HR investigated and found out it was me. I got a written warning.`; }
        return `I blamed ${cw ? cw.firstName : "a coworker"}. It worked, but I feel terrible.`;
      }
      if (roll(0.5)) return "I quietly fixed it. Nobody ever found out.";
      j.performance = clamp(j.performance - 10, 0, 100); j.boss.bond = clamp(j.boss.bond - 10, 0, 100); return "I tried to hide it, but it came out in an audit. That looked bad.";
    },
  },
  workTraining: {
    emoji: "🎓", title: "Training",
    resolve: (L, d, c) => {
      const j = jobOf(L); if (!j) return "Not my problem anymore.";
      if (c === 1) return "I passed on the course.";
      adjust(L, { smarts: rnd(2, 5), happiness: -2 }); j.performance = clamp(j.performance + 7, 0, 100); j.stress = clamp(j.stress + 5, 0, 100);
      return "📜 I studied nights for months and earned the certification. It shows at work.";
    },
  },
  workParty: {
    emoji: "🎉", title: "Office Party",
    resolve: (L, d, c) => {
      const j = jobOf(L); if (!j) return "Not my problem anymore.";
      const cws = L.relationships.filter((x) => x.kind === "coworker" && x.isAlive);
      if (c === 0) { for (const x of cws) updateRel(L, x.id, (y) => { y.bond += rnd(4, 9); }); j.boss.bond = clamp(j.boss.bond + 3, 0, 100); adjust(L, { happiness: 5 }); return "I mingled, told a few good stories, and got to know people outside of meetings."; }
      if (c === 1) {
        adjust(L, { happiness: 6, health: -2 });
        if (roll(0.5)) { j.boss.bond = clamp(j.boss.bond - 10, 0, 100); j.performance = clamp(j.performance - 5, 0, 100); return `🍾 I drank way too much and ${pick(["sang karaoke on the CEO's table", "told my boss what I really think of them", "fell asleep in the coat room"])}.`; }
        return "🍾 I drank too much, but so did everyone else. Legendary night.";
      }
      return "I skipped the party.";
    },
  },
  workHeadhunter: {
    emoji: "📞", title: "A Recruiter Calls",
    resolve: (L, d, c) => {
      const j = jobOf(L); if (!j) return "Not my problem anymore.";
      if (c === 2) return "I told the recruiter I'm happy where I am.";
      if (c === 1) {
        if (roll(0.55 + (j.boss.bond - 50) / 200)) { const r = Math.min(salaryCap(L) - j.salary, Math.round(j.salary * rndf(0.05, 0.1))); j.salary += Math.max(0, r); return `I told my boss about the offer. They gave me a ${formatMoney(Math.max(0, r))} raise to stay.`; }
        j.boss.bond = clamp(j.boss.bond - 12, 0, 100); return "I used the offer to ask for a raise. My boss told me to take it then. Awkward.";
      }
      leaveCoworkers(L);
      j.company = d.company; j.salary = d.offer; j.baseSalary = Math.max(j.baseSalary, Math.round(d.offer / Math.pow(1.3, j.level))); j.yearsInLevel = 0; j.boss = newBoss(); j.stress = 25; j.satisfaction = 65; j.warnings = 0;
      j.commute = j.remote ? 0 : rnd(8, 75);
      meetCoworkers(L);
      adjust(L, { happiness: 8 });
      return `💼 I took the job at ${d.company} for ${formatMoney(d.offer)}.`;
    },
  },
  workTransfer: {
    emoji: "🧳", title: "Transfer",
    resolve: (L, d, c) => {
      const j = jobOf(L); if (!j) return "Not my problem anymore.";
      if (c === 1) return "I turned down the transfer.";
      L.city = d.city; j.salary = Math.round(j.salary * 1.15); j.commute = j.remote ? 0 : rnd(8, 60);
      for (const x of L.relationships) if (x.isAlive && (x.kind === "friend" || isParent(x.kind) || x.kind === "sibling")) x.bond = Math.max(0, x.bond - rnd(3, 10));
      adjust(L, { happiness: 3 });
      return `🧳 I moved to ${d.city} for work. My salary is now ${formatMoney(j.salary)}. I miss people back home.`;
    },
  },
  workBurnout: {
    emoji: "🫠", title: "Burnout",
    resolve: (L, d, c) => {
      const j = jobOf(L); if (!j) return "Not my problem anymore.";
      if (c === 0) { L.money -= Math.round(j.salary * 0.25 * 0.75); j.stress = 30; j.performance = clamp(j.performance - 5, 0, 100); adjust(L, { happiness: 10, health: 5 }); return "I took three months of unpaid leave. I slept, I walked, I remembered who I am."; }
      if (c === 1) { adjust(L, { health: -8, happiness: -8 }); j.stress = clamp(j.stress + 5, 0, 100); return "I pushed through. I'm running on coffee and spite."; }
      leaveCoworkers(L); L.job = null; adjust(L, { happiness: 12 }); return `I quit ${j.company}. The relief was immediate.`;
    },
  },
});
