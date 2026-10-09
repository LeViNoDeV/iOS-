// LifeSim Royalty: be born into one of the world's real monarchies. Each has its own titles,
// succession law (equal, male-preference or male-only) and powers (constitutional or absolute).
// Your place in line comes from your actual family; public approval is earned through duty.
"use strict";

const RoyalHouses = { "United Kingdom": "Windsor", "Spain": "Borbón", "Netherlands": "Orange-Nassau", "Belgium": "Saxe-Coburg", "Norway": "Glücksburg", "Sweden": "Bernadotte", "Denmark": "Glücksburg", "Luxembourg": "Nassau-Weilburg", "Monaco": "Grimaldi", "Liechtenstein": "Liechtenstein", "Japan": "Yamato", "Thailand": "Chakri", "Bhutan": "Wangchuck", "Cambodia": "Norodom", "Tonga": "Tupou", "Lesotho": "Moshoeshoe", "Jordan": "Al-Hashimi", "Morocco": "Alaoui", "Bahrain": "Al Khalifa", "Kuwait": "Al-Sabah", "Saudi Arabia": "Al Saud", "Qatar": "Al Thani", "Oman": "Al Said", "Brunei": "Bolkiah", "Eswatini": "Dlamini" };
const mon = (country, monarch, heir, succession, gov, purse, royal = ["Prince", "Princess"]) => ({ country, monarch, heir, succession, gov, purse, royal, house: RoyalHouses[country] });
const Monarchies = [
  mon("United Kingdom", ["King", "Queen"], ["Prince of Wales", "Princess of Wales"], "equal", "constitutional", 3000000),
  mon("Spain", ["King", "Queen"], ["Prince of Asturias", "Princess of Asturias"], "male-pref", "constitutional", 300000, ["Infante", "Infanta"]),
  mon("Netherlands", ["King", "Queen"], ["Prince of Orange", "Princess of Orange"], "equal", "constitutional", 1500000),
  mon("Belgium", ["King", "Queen"], ["Duke of Brabant", "Duchess of Brabant"], "equal", "constitutional", 1000000),
  mon("Norway", ["King", "Queen"], ["Crown Prince", "Crown Princess"], "equal", "constitutional", 600000),
  mon("Sweden", ["King", "Queen"], ["Crown Prince", "Crown Princess"], "equal", "constitutional", 600000),
  mon("Denmark", ["King", "Queen"], ["Crown Prince", "Crown Princess"], "equal", "constitutional", 600000),
  mon("Luxembourg", ["Grand Duke", "Grand Duchess"], ["Hereditary Grand Duke", "Hereditary Grand Duchess"], "equal", "constitutional", 500000),
  mon("Monaco", ["Sovereign Prince", "Sovereign Princess"], ["Hereditary Prince", "Hereditary Princess"], "male-pref", "constitutional", 5000000),
  mon("Liechtenstein", ["Reigning Prince", "Reigning Princess"], ["Hereditary Prince", "Hereditary Princess"], "male-only", "constitutional", 5000000),
  mon("Japan", ["Emperor", "Empress"], ["Crown Prince", "Crown Princess"], "male-only", "constitutional", 1000000),
  mon("Thailand", ["King", "Queen"], ["Crown Prince", "Crown Princess"], "male-pref", "constitutional", 20000000),
  mon("Bhutan", ["King", "Queen"], ["Crown Prince", "Crown Princess"], "male-pref", "constitutional", 300000),
  mon("Cambodia", ["King", "Queen"], ["Crown Prince", "Crown Princess"], "male-only", "constitutional", 300000),
  mon("Tonga", ["King", "Queen"], ["Crown Prince", "Crown Princess"], "male-pref", "constitutional", 300000),
  mon("Lesotho", ["King", "Queen"], ["Crown Prince", "Crown Princess"], "male-only", "constitutional", 200000),
  mon("Jordan", ["King", "Queen"], ["Crown Prince", "Crown Princess"], "male-only", "constitutional", 3000000),
  mon("Morocco", ["King", "Queen"], ["Crown Prince", "Crown Princess"], "male-only", "constitutional", 5000000),
  mon("Bahrain", ["King", "Queen"], ["Crown Prince", "Crown Princess"], "male-only", "constitutional", 10000000),
  mon("Kuwait", ["Emir", "Emira"], ["Crown Prince", "Crown Princess"], "male-only", "constitutional", 20000000, ["Sheikh", "Sheikha"]),
  mon("Saudi Arabia", ["King", "Queen"], ["Crown Prince", "Crown Princess"], "male-only", "absolute", 50000000),
  mon("Qatar", ["Emir", "Emira"], ["Deputy Emir", "Deputy Emira"], "male-only", "absolute", 40000000, ["Sheikh", "Sheikha"]),
  mon("Oman", ["Sultan", "Sultana"], ["Crown Prince", "Crown Princess"], "male-only", "absolute", 20000000, ["Sayyid", "Sayyida"]),
  mon("Brunei", ["Sultan", "Sultana"], ["Crown Prince", "Crown Princess"], "male-only", "absolute", 30000000, ["Pengiran Muda", "Pengiran Anak"]),
  mon("Eswatini", ["King", "Queen"], ["Crown Prince", "Crown Princess"], "male-only", "absolute", 3000000),
];
const monarchyOf = (country) => Monarchies.find((m) => m.country === country) || Monarchies[0];
const SuccessionText = {
  equal: "The eldest child inherits, whether a son or a daughter.",
  "male-pref": "Sons inherit before daughters; a daughter reigns only if she has no brothers.",
  "male-only": "Only men can inherit the throne.",
};

const ordinal = (n) => `${n}${n % 10 === 1 && n % 100 !== 11 ? "st" : n % 10 === 2 && n % 100 !== 12 ? "nd" : n % 10 === 3 && n % 100 !== 13 ? "rd" : "th"}`;
const gi = (g) => (g === "male" ? 0 : 1);
const canInherit = (m, gender) => m.succession !== "male-only" || gender === "male";
/// Whether a comes before b in the line (both children of the same monarch).
function comesBefore(m, a, b) {
  if (m.succession === "male-pref" && a.gender !== b.gender) return a.gender === "male";
  return a.age > b.age;
}

const royalActive = (L) => !!(L.royal && !L.royal.renounced && !L.royal.abolished);

function newRoyalState(country) {
  return {
    country, isMonarch: false, wasMonarch: false, abdicated: false, approval: rnd(55, 72), patronages: [], duties: 0,
    renounced: false, abolished: false, distant: false, served: false, lastRecord: 0, reignStart: null,
    siblingMonarch: null, nephewsAhead: 0, spouseId: null, taxCut: false, heirWarned: false,
  };
}

function newRoyalLife(country, first, gender) {
  const m = monarchyOf(country);
  const L = newLife(first, m.house, gender);
  L.country = m.country;
  L.city = (typeof capitalOf === "function" && capitalOf(m.country)) || L.city;
  const rulerKind = m.succession === "equal" ? pick(["father", "mother"]) : m.succession === "male-pref" && roll(0.15) ? "mother" : "father";
  const ruler = L.relationships.find((p) => p.kind === rulerKind);
  ruler.monarch = true;
  for (const p of L.relationships) if (isParent(p.kind)) p.money = m.purse * rnd(15, 40);
  L.royal = newRoyalState(m.country);
  const line = royalLine(L);
  L.log[0].entries[0] = `👑 I was born into the House of ${m.house}, the royal family of ${m.country}. My ${rulerKind}, ${relName(ruler)}, is the reigning ${m.monarch[gi(ruler.gender)]}. `
    + (line ? `I am ${ordinal(line)} in line to the throne.` : "Only men can inherit the throne here, so I'm not in the line of succession.");
  return L;
}

/// Your place in the line of succession: 0 if you reign, null if you can't inherit.
function royalLine(L) {
  const r = L.royal;
  if (!royalActive(L)) return null;
  if (r.isMonarch) return 0;
  const m = monarchyOf(r.country);
  if (r.distant || r.abdicated || !canInherit(m, L.gender)) return null;
  const me = { gender: L.gender, age: L.age };
  const sibs = L.relationships.filter((p) => p.kind === "sibling" && p.isAlive && !p.renounced && canInherit(m, p.gender) && p.id !== r.siblingMonarch);
  let ahead = sibs.filter((s) => comesBefore(m, s, me)).length;
  if (r.siblingMonarch) ahead += r.nephewsAhead;
  return ahead + 1;
}

function royalTitle(L) {
  const r = L.royal;
  if (!r) return null;
  const m = monarchyOf(r.country);
  const g = gi(L.gender);
  if (r.abolished) return r.wasMonarch ? `Former ${m.monarch[g]}` : `Former ${m.royal[g]}`;
  if (r.renounced) return null;
  if (r.isMonarch) return m.monarch[g];
  if (r.abdicated) return `Former ${m.monarch[g]}`;
  return royalLine(L) === 1 ? m.heir[g] : m.royal[g];
}

function crown(L, how) {
  const r = L.royal;
  const m = monarchyOf(r.country);
  r.isMonarch = true; r.wasMonarch = true; r.reignStart = L.age; r.siblingMonarch = null;
  r.approval = Math.max(r.approval, 55);
  adjust(L, { happiness: 20 });
  notify(L, "👑", "Long Live the Monarch!", `👑 ${how} I was crowned ${m.monarch[gi(L.gender)]} of ${r.country}.`);
}

/// Works out who takes the throne after a monarch dies or steps down.
function passTheCrown(L, from) {
  const r = L.royal;
  const m = monarchyOf(r.country);
  if (from === "sibling" && r.nephewsAhead > 0) {
    r.siblingMonarch = null; r.distant = true;
    record(L, `👑 The crown passed to my ${pick(["nephew", "niece"])}. My branch of the family is further from the throne now.`);
    return;
  }
  const me = { id: "me", gender: L.gender, age: L.age };
  const pool = L.relationships.filter((p) => p.kind === "sibling" && p.isAlive && !p.renounced && canInherit(m, p.gender) && p.id !== r.siblingMonarch);
  if (!r.abdicated && !r.distant && canInherit(m, L.gender)) pool.push(me);
  pool.sort((a, b) => (comesBefore(m, a, b) ? -1 : 1));
  const next = pool[0];
  r.siblingMonarch = null; r.nephewsAhead = 0;
  if (!next) { r.distant = true; record(L, "👑 With no heir among us, the crown passed to a cousin."); return; }
  if (next.id === "me") { crown(L, from === "parent" ? "My parent's reign is over." : "The throne came to me."); return; }
  next.monarch = true;
  r.siblingMonarch = next.id;
  r.nephewsAhead = next.age >= 25 ? rnd(0, 3) : 0;
  record(L, `👑 My ${relTitle(next).toLowerCase()} ${next.firstName} was crowned ${m.monarch[gi(next.gender)]}.${royalLine(L) ? ` I'm now ${ordinal(royalLine(L))} in line.` : ""}`);
}

/// When you die and continue as your child, they inherit your royal status.
function inheritRoyalty(L, next, child) {
  if (!royalActive(L)) return;
  const m = monarchyOf(L.royal.country);
  next.royal = newRoyalState(L.royal.country);
  next.royal.approval = L.royal.isMonarch ? clamp(L.royal.approval, 40, 80) : rnd(50, 70);
  if (!L.royal.isMonarch) { next.royal.distant = true; return; }
  const heirs = heirsOf(L).filter((c) => canInherit(m, c.gender)).sort((a, b) => (comesBefore(m, a, b) ? -1 : 1));
  if (heirs[0] && heirs[0].id === child.id) {
    next.royal.isMonarch = true; next.royal.wasMonarch = true; next.royal.reignStart = child.age;
    next.log[0].entries.push(`👑 I succeeded my ${L.gender === "male" ? "father" : "mother"} as ${m.monarch[gi(child.gender)]} of ${m.country}.`);
  } else if (heirs[0]) {
    const sib = next.relationships.find((p) => p.kind === "sibling" && p.firstName === heirs[0].firstName);
    if (sib) { sib.monarch = true; next.royal.siblingMonarch = sib.id; next.royal.nephewsAhead = sib.age >= 25 ? rnd(0, 3) : 0; }
    next.log[0].entries.push(`👑 My ${heirs[0].gender === "male" ? "brother" : "sister"} ${heirs[0].firstName} inherited the throne.`);
  } else next.royal.distant = true;
}

// MARK: Duties and decisions

const RoyalCauses = ["Children's hospitals", "Mental health", "Wildlife conservation", "Veterans", "Literacy", "Homelessness", "Cancer research", "The arts", "Clean oceans", "Disaster relief"];
const Engagements = ["opened a new children's hospital wing", "visited a town hit by flooding", "presented medals at a national championship", "toured a factory and met the workers",
  "laid a wreath at the war memorial", "visited a primary school", "launched a ship at the naval dockyard", "met volunteers at a food bank", "attended a state memorial service"];

const RoyalActions = {
  engagement: { emoji: "🎗️", title: "Carry out a royal engagement", sub: "Visits, openings, ceremonies. Builds approval", minAge: 12, duty: 1 },
  patronage: { emoji: "🤝", title: "Become patron of a charity", sub: "A lasting cause that lifts approval every year", minAge: 18 },
  tour: { emoji: "✈️", title: "Go on an overseas tour", sub: "Represent the country abroad", minAge: 18, duty: 2 },
  interview: { emoji: "🎙️", title: "Give a TV interview", sub: "Can win hearts, or backfire badly", minAge: 16 },
  military: { emoji: "🎖️", title: "Serve in the armed forces", sub: "A royal tradition. Once, between 18 and 30", minAge: 18, maxAge: 30 },
  holiday: { emoji: "🏝️", title: "Take a private holiday", sub: "Rest, away from the cameras", minAge: 0 },
  nightOut: { emoji: "🍸", title: "Slip out for a night on the town", sub: "Fun, unless the tabloids find out", minAge: 18 },
  audience: { emoji: "🏛️", title: "Hold audiences with the Prime Minister", sub: "Stay informed, stay above politics", monarch: "constitutional", duty: 1 },
  parliament: { emoji: "📜", title: "Open the new session of parliament", sub: "Read the government's program", monarch: "constitutional", duty: 1 },
  stateVisit: { emoji: "🎺", title: "Host a state visit", sub: "Banquets and diplomacy", monarch: true, duty: 1 },
  honours: { emoji: "🏅", title: "Award the national honours", sub: "Recognize heroes and achievers", monarch: true, duty: 1 },
  address: { emoji: "📺", title: "Address the nation", sub: "The annual broadcast", monarch: true, duty: 1 },
  services: { emoji: "🏥", title: "Decree: fund hospitals and schools", sub: "Costs the royal treasury; very popular", monarch: "absolute" },
  taxCut: { emoji: "💸", title: "Decree: cut taxes", sub: "Popular, but your income shrinks this year", monarch: "absolute" },
  taxRise: { emoji: "💰", title: "Decree: raise taxes", sub: "Fills the treasury; the people resent it", monarch: "absolute" },
  crackdown: { emoji: "🚨", title: "Crack down on dissent", sub: "Silences critics. At a cost", monarch: "absolute" },
  reshuffle: { emoji: "🔄", title: "Reshuffle the cabinet", sub: "Fresh faces in government", monarch: "absolute", duty: 1 },
  abdicate: { emoji: "🚪", title: "Abdicate the throne", sub: "Hand the crown to your heir", monarch: true, final: true },
  renounce: { emoji: "❌", title: "Renounce your royal title", sub: "Leave royal life for good", minAge: 18, notMonarch: true, final: true },
};

function royalActionsFor(L) {
  if (!royalActive(L) || inPrison(L)) return [];
  const r = L.royal;
  const gov = monarchyOf(r.country).gov;
  return Object.entries(RoyalActions).filter(([id, a]) => {
    if (a.minAge && L.age < a.minAge) return false;
    if (a.maxAge && L.age > a.maxAge) return false;
    if (a.monarch && (!r.isMonarch || (a.monarch !== true && a.monarch !== gov))) return false;
    if (a.notMonarch && r.isMonarch) return false;
    if (id === "military" && r.served) return false;
    if (id === "patronage" && r.patronages.length >= RoyalCauses.length) return false;
    return true;
  }).map(([id]) => id);
}

function royalAction(L, action, arg) {
  const r = L.royal;
  if (!royalActive(L)) return out(L, "Royalty", "I'm not a working royal.", false);
  const a = RoyalActions[action];
  const m = monarchyOf(r.country);
  if (!a.final) {
    if (usedThisYear(L, `royal-${action}`)) return out(L, a.title, "I already did that this year.", false);
    markUsed(L, `royal-${action}`);
  }
  // The more popular you already are, the less each good deed moves the needle.
  const pop = (d) => { r.approval = clamp(r.approval + (d > 0 ? Math.round(d * (1 - r.approval / 115)) : d), 0, 100); };
  r.duties += a.duty || 0;
  let msg;
  switch (action) {
    case "engagement": pop(rnd(2, 5)); msg = `🎗️ I ${pick(Engagements)}.`; break;
    case "patronage": {
      const cause = arg || pick(RoyalCauses.filter((c) => !r.patronages.includes(c)));
      r.patronages.push(cause); pop(3); L.karma += 3;
      msg = `🤝 I became royal patron of a charity for ${cause.toLowerCase()}. I'll champion it for years to come.`; break;
    }
    case "tour": {
      const c = pick(WORLD.filter((x) => x[0] !== r.country));
      pop(rnd(3, 7)); adjust(L, { happiness: 5 });
      msg = `✈️ I went on a royal tour of ${c[0]}, meeting leaders in ${c[1][0]} and crowds in ${pick(c[1])}.`; break;
    }
    case "interview":
      if (roll(0.45 + L.stats.smarts / 250)) { pop(rnd(5, 9)); msg = "🎙️ My TV interview came across as warm and honest. The public loved it."; }
      else { pop(-rnd(8, 14)); msg = `🎙️ I said something out of touch in a TV interview. ${pick(["The headlines were brutal.", "It's all anyone is talking about.", "My press secretary wants to quit."])}`; }
      break;
    case "military":
      r.served = true; pop(10); adjust(L, { health: 6, happiness: -3, smarts: 2 });
      msg = `🎖️ I served in the ${pick(["navy", "army", "air force"])} like royals before me. The public respected it.`; break;
    case "holiday":
      adjust(L, { happiness: 8, health: 2 });
      if (r.approval > 50 && roll(0.3)) { pop(-2); msg = "🏝️ I took a private holiday. The press grumbled about the cost."; }
      else msg = `🏝️ I spent a quiet holiday ${pick(["at the royal estate", "on a private island", "skiing in the mountains", "sailing along the coast"])}.`;
      break;
    case "nightOut":
      adjust(L, { happiness: 8 }); bump(L, "parties");
      if (roll(0.35)) { pop(-rnd(8, 14)); r.scandals = (r.scandals || 0) + 1; msg = "🍸 Photos of my night out ended up on every front page. Scandal!"; }
      else msg = "🍸 I slipped out with friends in a baseball cap. Nobody recognized me.";
      break;
    case "audience": pop(1); adjust(L, { smarts: 1 }); msg = "🏛️ I held my weekly audiences with the Prime Minister. What's said stays private."; break;
    case "parliament": pop(rnd(2, 4)); msg = "📜 I opened the new session of parliament and read out the government's plans."; break;
    case "stateVisit": { const c = pick(WORLD.filter((x) => x[0] !== r.country)); pop(rnd(3, 5)); msg = `🎺 I hosted a state visit from the leader of ${c[0]}, with a banquet at the palace.`; break; }
    case "honours": pop(2); msg = "🏅 I awarded the national honours to nurses, scientists and volunteers."; break;
    case "address": pop(rnd(2, 6)); msg = "📺 I addressed the nation in my annual broadcast."; break;
    case "services": { const cost = Math.round(m.purse * 0.8); L.money -= cost; pop(rnd(8, 12)); L.karma += 5; msg = `🏥 I decreed new hospitals and schools across ${r.country}, paid for from the royal treasury (${formatMoney(cost)}).`; break; }
    case "taxCut": r.taxCut = true; pop(rnd(8, 12)); msg = "💸 I decreed a tax cut. People are celebrating; the royal treasury will be leaner this year."; break;
    case "taxRise": { const take = Math.round(m.purse * 0.6); L.money += take; pop(-rnd(10, 16)); msg = `💰 I decreed higher taxes, bringing ${formatMoney(take)} into the royal coffers. People are grumbling.`; break; }
    case "crackdown": r.unrestLow = 2; pop(-4); L.karma -= 15; msg = "🚨 I ordered a crackdown on critics. The streets went quiet, but the world noticed."; break;
    case "reshuffle":
      if (roll(0.6)) { pop(rnd(3, 6)); msg = "🔄 I reshuffled the cabinet. The new ministers are popular."; }
      else { pop(-rnd(2, 5)); msg = "🔄 I reshuffled the cabinet. Critics called it change for its own sake."; }
      break;
    case "abdicate": {
      r.isMonarch = false; r.abdicated = true;
      const heirs = childrenOf(L).filter((c) => c.isAlive && canInherit(m, c.gender)).sort((a2, b2) => (comesBefore(m, a2, b2) ? -1 : 1));
      adjust(L, { happiness: 5 });
      msg = heirs[0] ? `🚪 I abdicated. My ${heirs[0].gender === "male" ? "son" : "daughter"} ${heirs[0].firstName} is now ${m.monarch[gi(heirs[0].gender)]}.` : "🚪 I abdicated. With no child to succeed me, the crown passed to my next of kin.";
      break;
    }
    case "renounce": r.renounced = true; adjust(L, { happiness: 3 }); msg = "❌ I renounced my royal title and allowance. I'm a private citizen now."; break;
  }
  return out(L, a.title, msg);
}

// MARK: Each year

/// Upgrades royal state from older saves.
function normalizeRoyal(L) {
  const r = L.royal;
  if (!r || r.approval != null) return;
  Object.assign(r, { ...newRoyalState(r.country), isMonarch: !!r.isMonarch, wasMonarch: !!r.isMonarch, renounced: !!r.renounced, approval: r.popularity ?? 60 });
}

function progressRoyalty(L) {
  normalizeRoyal(L);
  if (!royalActive(L)) return;
  const r = L.royal;
  const m = monarchyOf(r.country);
  // Succession: watch the reigning monarch in the family.
  if (!r.isMonarch) {
    const ruler = L.relationships.find((p) => p.monarch);
    if (ruler && !ruler.isAlive) {
      ruler.monarch = false;
      passTheCrown(L, ruler.kind === "sibling" ? "sibling" : "parent");
    } else if (ruler && ruler.kind === "sibling" && ruler.age < 45 && roll(0.12)) r.nephewsAhead += 1;
    else if (ruler && isParent(ruler.kind) && ruler.age >= 82 && roll(0.15)) {
      ruler.monarch = false;
      record(L, `👑 My ${ruler.kind} ${ruler.firstName} abdicated after a long reign.`);
      passTheCrown(L, "parent");
    }
  }
  // Income: the monarch's purse, or an allowance for working royals.
  if (L.age >= 18 && !r.abdicated) {
    const working = r.duties >= 2;
    const share = r.isMonarch ? (r.taxCut ? 0.7 : 1) : working ? 0.25 : 0.08;
    L.money += Math.round(m.purse * share);
  } else if (r.abdicated) L.money += Math.round(m.purse * 0.1);
  // Approval: duty, causes, scandals, and the question of an heir.
  let drift = Math.round((55 - r.approval) * 0.08) + Math.min(3, r.patronages.length * 0.5);
  if (L.age >= 21 && r.duties === 0 && !r.abdicated) drift -= 4;
  if (r.patronages.length > 2 && r.duties < r.patronages.length / 2) drift -= 1;
  if (L.criminalRecord.length > r.lastRecord) {
    drift -= 12 * (L.criminalRecord.length - r.lastRecord);
    record(L, `📰 My arrest was front-page news. Calls for me to step back from royal duties grew louder.`);
  }
  r.lastRecord = L.criminalRecord.length;
  if (L.addictions.length) drift -= 3;
  const spouse = L.relationships.find((p) => p.kind === "spouse" && p.isAlive);
  if (spouse && spouse.id !== r.spouseId) {
    r.spouseId = spouse.id;
    const good = (spouse.craziness ?? 30) < 65;
    drift += good ? 6 : -4;
    record(L, `👰 My wedding to ${relName(spouse)} was watched by ${rnd(20, 900)} million people.${good ? "" : " The press had doubts about my choice."}`);
  }
  if (r.isMonarch && L.age >= 40 && !childrenOf(L).some((c) => c.isAlive)) {
    drift -= 2;
    if (!r.heirWarned) { r.heirWarned = true; record(L, "📰 The newspapers keep asking who will succeed me. The country wants an heir."); }
  }
  r.approval = clamp(r.approval + drift + rnd(-3, 3), 0, 100);
  r.duties = 0; r.taxCut = false; r.unrestLow = Math.max(0, (r.unrestLow || 0) - 1);
  // Politics.
  if (r.isMonarch && m.gov === "constitutional") {
    if (r.approval < 25 && roll(0.3)) packEvent(L, "royalReferendum", {}, `With your approval at ${r.approval}%, the government has called a referendum on abolishing the monarchy.`, ["Campaign to keep the monarchy ($2,000,000)", "Stay above politics", "Abdicate to save the crown"]);
    else if (roll(0.12)) packEvent(L, "royalAssent", {}, "Parliament passed a bitterly divisive law. It needs your signature to take effect.", ["Sign it. It's not my place to block it", "Refuse royal assent"]);
  }
  if (r.isMonarch && m.gov === "absolute" && r.approval < 20 && !r.unrestLow && roll(0.35)) {
    packEvent(L, "royalUnrest", {}, `Protesters fill the streets of ${L.city}, demanding reform.`, ["Promise real reforms", "Order a crackdown", "Abdicate in favor of my heir"]);
  }
}

function endMonarchy(L, why) {
  const r = L.royal;
  r.isMonarch = false; r.abolished = true;
  adjust(L, { happiness: -20 });
  return why;
}

packEvents({
  royalReferendum: {
    emoji: "🗳️", title: "Referendum",
    resolve: (L, d, c) => {
      const r = L.royal;
      if (!r || !r.isMonarch) return "The referendum was called off.";
      if (c === 2) return royalAction(L, "abdicate").message + " The referendum was quietly dropped.";
      if (c === 0) L.money -= 2000000;
      const keep = roll((c === 0 ? 0.35 : 0.2) + r.approval / 100);
      if (keep) { r.approval = clamp(r.approval + 15, 0, 100); return `🗳️ The people voted to keep the monarchy. ${c === 0 ? "My campaign made the difference." : "Staying out of it was the right call."}`; }
      return endMonarchy(L, `🗳️ The people voted to abolish the monarchy. ${r.country} is a republic now. I keep my private fortune, but not my crown.`);
    },
  },
  royalAssent: {
    emoji: "📜", title: "Royal Assent",
    resolve: (L, d, c) => {
      const r = L.royal;
      if (!r) return "The bill passed.";
      if (c === 0) { r.approval = clamp(r.approval + rnd(-3, 3), 0, 100); return "📜 I signed the bill into law, as monarchs here always do."; }
      r.approval = clamp(r.approval - 15, 0, 100);
      return "📜 I refused royal assent. It's the first time in generations, and the country is in uproar.";
    },
  },
  royalUnrest: {
    emoji: "📣", title: "Unrest",
    resolve: (L, d, c) => {
      const r = L.royal;
      if (!r || !r.isMonarch) return "The protests faded.";
      if (c === 0) { r.approval = clamp(r.approval + 15, 0, 100); L.karma += 5; return "📣 I promised elections for a new council and a free press. The crowds went home."; }
      if (c === 2) return royalAction(L, "abdicate").message;
      L.karma -= 20;
      if (roll(0.6)) { r.approval = clamp(r.approval - 5, 0, 100); r.unrestLow = 3; return "🚨 Security forces cleared the streets. The protests stopped, for now."; }
      const c2 = pick(WORLD.filter((x) => x[0] !== r.country));
      L.country = c2[0]; L.city = c2[1][0];
      return endMonarchy(L, `🔥 The crackdown backfired and the army sided with the people. I fled into exile in ${L.city}, ${L.country}.`);
    },
  },
});
