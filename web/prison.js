// LifeSim Prison: doing time. Behavior and programs (a job, a GED) earn parole once you've served
// a third of your sentence. Gangs offer protection at the cost of your record inside. Appeals need
// a lawyer. Escapes are possible, but fugitives get hunted.
"use strict";

const PrisonGangs = [
  { name: "the Eastside Kings", emoji: "👑" }, { name: "the Iron Brotherhood", emoji: "⛓️" },
  { name: "the Southside Locos", emoji: "🔥" }, { name: "the Old Heads", emoji: "🧓" },
];
const PrisonJobs = {
  kitchen: { name: "Kitchen", pay: 600, behavior: 4, sub: "Early mornings, extra food" },
  laundry: { name: "Laundry", pay: 450, behavior: 4, sub: "Hot, steady work" },
  library: { name: "Library", pay: 400, behavior: 6, sub: "Quiet. +Smarts", smarts: 2 },
  workshop: { name: "Workshop", pay: 900, behavior: 4, sub: "Make license plates and furniture" },
  infirmary: { name: "Infirmary orderly", pay: 500, behavior: 6, sub: "Trusted inmates only", minBehavior: 65 },
};
const Lawyers = {
  public: { name: "Public defender", cost: 0, chance: 0.07 },
  private: { name: "Private attorney", cost: 25000, chance: 0.18 },
  top: { name: "Top appeals firm", cost: 150000, chance: 0.32 },
};

function prisonLife(L) {
  if (!L.prisonLife || L.prisonLife.sentence == null) {
    L.prisonLife = { sentence: L.prisonYearsLeft, served: 0, behavior: 50, respect: 20, gang: null, job: null, ged: 0, appealedAt: null, solitary: 0, cellmate: `${Names.first(L.gender)} ${Names.randomLast()}`, cellBond: 30, tunnel: 0, paidProtection: false };
  }
  return L.prisonLife;
}
const paroleEligible = (pl) => pl.served >= Math.ceil(pl.sentence / 3);
const hasDiploma = (L) => eduRank(L.education) >= eduRank("highSchool");

const PrisonPackActions = {
  job: { emoji: "🧺", title: "Get a prison job", sub: "Pays a little every year and looks good to the parole board" },
  study: { emoji: "📚", title: "Study", sub: "Work toward a GED, or take courses" },
  workout: { emoji: "💪", title: "Work out in the yard", sub: "Health and respect" },
  cellmate: { emoji: "🛏️", title: "Talk with your cellmate", sub: "A friend inside makes the time pass" },
  gang: { emoji: "🤜", title: "Join a gang", sub: "Protection, at a price" },
  fight: { emoji: "🥊", title: "Pick a fight", sub: "Respect, or a trip to solitary" },
  contraband: { emoji: "📦", title: "Smuggle contraband", sub: "Money, or more time" },
  appeal: { emoji: "⚖️", title: "File an appeal", sub: "Once every two years. Needs a lawyer" },
  parole: { emoji: "📝", title: "Request a parole hearing", sub: "After a third of your sentence" },
  bribe: { emoji: "💵", title: "Bribe a guard to look away", sub: "$25,000 · a way out, or more time" },
  tunnel: { emoji: "⛏️", title: "Dig an escape tunnel", sub: "A little more each year" },
  riot: { emoji: "🔥", title: "Start a riot", sub: "Chaos. Dangerous for everyone" },
};

function prisonPackAction(L, action, arg) {
  if (!inPrison(L)) return out(L, "Prison", "I'm not in prison.", false);
  const pl = prisonLife(L);
  const a = PrisonPackActions[action];
  if (pl.solitary && !["study", "appeal"].includes(action)) return out(L, a.title, "I'm in solitary confinement this year.", false);
  if (usedThisYear(L, `prison-${action}`)) return out(L, a.title, "I already did that this year.", false);
  const beh = (d) => { pl.behavior = clamp(pl.behavior + d, 0, 100); };
  const rsp = (d) => { pl.respect = clamp(pl.respect + d, 0, 100); };
  let m;
  switch (action) {
    case "job": {
      const j = PrisonJobs[arg];
      if (!j) return out(L, a.title, "Pick a job.", false);
      if (j.minBehavior && pl.behavior < j.minBehavior) return out(L, a.title, `The infirmary only takes inmates with good behavior (${j.minBehavior}+).`, false);
      markUsed(L, `prison-${action}`);
      pl.job = arg; beh(3);
      m = `🧺 I was assigned to the ${j.name.toLowerCase()}. It pays about ${formatMoney(j.pay)} a year.`;
      break;
    }
    case "study":
      markUsed(L, `prison-${action}`);
      adjust(L, { smarts: rnd(2, 4) }); beh(3);
      if (!hasDiploma(L)) {
        pl.ged = Math.min(100, pl.ged + rnd(30, 45));
        if (pl.ged >= 100) { L.education = "highSchool"; adjust(L, { happiness: 10 }); m = "🎓 I passed my GED exams. I have a high school diploma now."; }
        else m = `📚 I studied for my GED in the prison classroom. (${pl.ged}% of the way there)`;
      } else m = `📚 I took a correspondence course in ${pick(["accounting", "psychology", "business", "history", "law"])}.`;
      break;
    case "workout": markUsed(L, `prison-${action}`); adjust(L, { health: rnd(3, 6), looks: 1 }); rsp(3); m = "💪 I worked out in the yard every day."; break;
    case "cellmate":
      markUsed(L, `prison-${action}`);
      pl.cellBond = Math.min(100, pl.cellBond + rnd(8, 15)); adjust(L, { happiness: 4 });
      m = `🛏️ I talked with my cellmate ${pl.cellmate} until lights out. ${pick(["We swapped life stories.", "They taught me to play chess.", "We laughed for the first time in months.", "They gave me advice for the parole board."])}`;
      if (pl.cellBond >= 70 && !pl.cellmateTip) { pl.cellmateTip = true; pl.tunnel = Math.max(pl.tunnel, 20); m += " They told me about a weak spot in the old drainage tunnel."; }
      break;
    case "gang": {
      if (pl.gang) return out(L, a.title, `I'm already with ${pl.gang}.`, false);
      markUsed(L, `prison-${action}`);
      const g = PrisonGangs.find((x) => x.name === arg) || pick(PrisonGangs);
      if (roll(0.45 + pl.respect / 200)) { pl.gang = g.name; rsp(15); beh(-10); m = `${g.emoji} I joined ${g.name}. Nobody bothers me now, but the guards are watching me.`; }
      else { adjust(L, { health: -10 }); rsp(-3); m = `${g.emoji} ${cap(g.name)} beat me up as a test and still said no.`; }
      break;
    }
    case "fight":
      markUsed(L, `prison-${action}`);
      beh(-12);
      if (roll(0.4 + L.stats.health / 400 + (pl.gang ? 0.1 : 0))) { rsp(12); adjust(L, { health: -5 }); m = "🥊 I won a fight in the yard. People step aside for me now."; }
      else { adjust(L, { health: -rnd(10, 25) }); rsp(-5); m = "🥊 I lost a fight in the yard and woke up in the infirmary."; }
      if (roll(0.35)) { pl.solitary = 1; m += " The guards threw me in solitary."; }
      break;
    case "contraband":
      markUsed(L, `prison-${action}`);
      if (roll(0.7)) { const pay = rnd(300, 3000); L.money += pay; rsp(3); m = `📦 I smuggled ${pick(["phones", "cigarettes", "snacks", "tattoo ink"])} into the cell block and sold them for ${formatMoney(pay)}.`; }
      else { L.prisonYearsLeft += 1; pl.sentence += 1; beh(-20); pl.solitary = 1; m = "📦 The guards found my stash. A year was added to my sentence and I went to solitary."; }
      break;
    case "appeal": {
      if (pl.appealedAt != null && L.age - pl.appealedAt < 2) return out(L, a.title, "My last appeal was too recent.", false);
      const lw = Lawyers[arg] || Lawyers.public;
      if (L.money < lw.cost) return out(L, a.title, `A ${lw.name.toLowerCase()} costs ${formatMoney(lw.cost)}.`, false);
      markUsed(L, `prison-${action}`);
      L.money -= lw.cost; pl.appealedAt = L.age;
      if (roll(lw.chance + L.stats.smarts / 1000)) {
        const cut = Math.ceil(L.prisonYearsLeft / 2);
        L.prisonYearsLeft -= cut;
        if (L.prisonYearsLeft <= 0) { L.prisonYearsLeft = 0; adjust(L, { happiness: 25 }); m = `⚖️ My ${lw.name.toLowerCase()} won the appeal. My conviction was overturned and I walked out a free person.`; }
        else m = `⚖️ My appeal partly succeeded. ${plural(cut, "year")} came off my sentence.`;
      } else m = `⚖️ The appeals court upheld my sentence.${lw.cost ? ` That was ${formatMoney(lw.cost)} for nothing.` : ""}`;
      break;
    }
    case "parole": {
      if (!paroleEligible(pl)) return out(L, a.title, `I'm not eligible yet. I have to serve ${plural(Math.ceil(pl.sentence / 3), "year")} first (${pl.served} so far).`, false);
      markUsed(L, `prison-${action}`);
      const chance = pl.behavior / 160 + (pl.job ? 0.08 : 0) + (pl.ged >= 100 || hasDiploma(L) ? 0.07 : 0) - (pl.gang ? 0.15 : 0) - (pl.solitary ? 0.3 : 0);
      if (roll(clamp(chance, 0.02, 0.85))) { L.prisonYearsLeft = 0; adjust(L, { happiness: 20 }); m = "📝 The parole board granted my release. I have to check in with my parole officer, but I'm out."; }
      else m = `📝 The parole board denied my request.${pl.behavior < 60 ? " They cited my behavior." : pl.gang ? " They cited my gang ties." : " Maybe next year."}`;
      break;
    }
    case "bribe":
      if (L.money < 25000) return out(L, a.title, "I'd need $25,000 on the outside.", false);
      markUsed(L, `prison-${action}`);
      L.money -= 25000;
      if (roll(0.3)) { L.prisonYearsLeft = 0; L.fugitive = { since: L.age, country: L.country }; L.criminalRecord.push("Prison escape"); m = "💵 A guard left a door unlocked at 3 a.m. I'm out, and now I'm a fugitive."; }
      else { L.prisonYearsLeft += 2; pl.sentence += 2; L.criminalRecord.push("Bribery"); beh(-25); m = "💵 The guard reported me. Two years were added to my sentence."; }
      break;
    case "tunnel":
      markUsed(L, `prison-${action}`);
      pl.tunnel = Math.min(100, pl.tunnel + rnd(15, 30));
      if (roll(0.12)) { pl.tunnel = 0; L.prisonYearsLeft += 2; pl.sentence += 2; pl.solitary = 1; m = "⛏️ A cell search found my tunnel. Two years added and a stretch in solitary."; break; }
      if (pl.tunnel >= 100) {
        if (roll(0.65)) { L.prisonYearsLeft = 0; L.fugitive = { since: L.age, country: L.country }; L.criminalRecord.push("Prison escape"); adjust(L, { happiness: 25 }); m = "⛏️ I crawled out through my tunnel and ran. I'm free, and every cop in the state is looking for me."; }
        else { pl.tunnel = 0; L.prisonYearsLeft += 3; pl.sentence += 3; m = "⛏️ My tunnel came up right next to the guard tower. Three years were added."; }
      } else m = `⛏️ I dug a little further with a spoon and a bent bedframe. It's ${pl.tunnel}% done.`;
      break;
    case "riot":
      markUsed(L, `prison-${action}`);
      beh(-30); rsp(10);
      if (roll(0.05)) { die(L, "a prison riot"); return out(L, a.title, "🔥 The riot got out of hand."); }
      if (roll(0.4)) { L.prisonYearsLeft += rnd(2, 5); m = `🔥 I started a riot. When it was over, I was charged for it. I have ${plural(L.prisonYearsLeft, "year")} left now.`; }
      else { adjust(L, { health: -rnd(5, 20) }); m = "🔥 I started a riot. The block burned for hours before the tactical team took it back."; }
      break;
  }
  return out(L, a.title, m);
}

function progressPrisonLife(L) {
  if (L.fugitive && !inPrison(L)) {
    const abroad = L.country !== L.fugitive.country;
    if (roll(abroad ? 0.05 : 0.2)) {
      L.fugitive = null; L.prisonLife = null;
      sendToPrison(L, rnd(5, 12));
      notify(L, "🚓", "Caught", `🚓 ${abroad ? "Interpol tracked me down and had me extradited." : "The police caught up with me."} I'm going back to prison for ${plural(L.prisonYearsLeft, "year")}.`);
    } else if (L.age - L.fugitive.since >= 10) L.fugitive = null;
    return;
  }
  if (!inPrison(L)) { L.prisonLife = null; return; }
  const pl = prisonLife(L);
  pl.served += 1;
  if (pl.solitary) { pl.solitary = 0; adjust(L, { happiness: -10 }); }
  else pl.behavior = Math.min(100, pl.behavior + 3);
  if (pl.job) { L.money += PrisonJobs[pl.job].pay; pl.behavior = Math.min(100, pl.behavior + PrisonJobs[pl.job].behavior); if (PrisonJobs[pl.job].smarts) adjust(L, { smarts: PrisonJobs[pl.job].smarts }); }
  if (pl.paidProtection) L.money -= 500;
  // Life inside.
  if (!pl.gang && !pl.paidProtection && pl.respect < 30 && roll(0.25)) {
    packEvent(L, "prisonProtection", {}, `A gang shot-caller says you need protection now. "It's $500 a year. It'd be a shame if something happened to you."`, ["Pay up", "Refuse", "Tell the guards"]);
  } else if (roll(0.1)) {
    record(L, pick(["🔒 The whole prison was on lockdown for a month after a stabbing.", "✉️ I got a letter from home. I read it a hundred times.", "🍲 The food was so bad that half the block went on a hunger strike.", "📺 We were allowed to watch the big game in the rec room."]));
  }
}

packEvents({
  prisonProtection: {
    emoji: "🔪", title: "Protection",
    resolve: (L, d, c) => {
      const pl = prisonLife(L);
      if (c === 0) { pl.paidProtection = true; L.money -= 500; return "I paid. Nobody's bothered me since."; }
      if (c === 1) {
        if (roll(0.5)) { adjust(L, { health: -rnd(15, 30) }); return "I refused. They jumped me in the shower block."; }
        pl.respect = Math.min(100, pl.respect + 10); return "I refused and stared him down. He backed off. Word got around.";
      }
      pl.behavior = Math.min(100, pl.behavior + 10); pl.respect = Math.max(0, pl.respect - 20);
      if (roll(0.3)) { adjust(L, { health: -rnd(20, 35) }); return "I told the guards. Everyone knows I'm a snitch now, and someone made me pay for it."; }
      return "I told the guards. They moved me to a different block.";
    },
  },
});
