// LifeSim Fame: being famous is a business. Your public image is separate from how famous you are.
// An agent brings bigger deals (for a cut); a publicist softens scandals (for a fee).
// Deals and scandals arrive as decisions; your choices shape your image.
"use strict";

const isCelebrity = (L) => L.fame >= 15 || L.followers >= 50000;
const celebImage = (L) => (L.image ??= 60);
const team = (L) => (L.team ||= { agent: false, publicist: false });
const AGENT_CUT = 0.15;
const PUBLICIST_FEE = 120000;

/// What a brand would pay you for one campaign, before your agent's cut.
const dealValue = (L) => Math.round((L.fame * L.fame * 300 + L.followers * 0.04) * (0.6 + celebImage(L) / 100) * (team(L).agent ? 1.6 : 1));

const Brands = [
  ["a sportswear giant", false], ["a luxury watchmaker", false], ["a soft drink company", false], ["a phone maker", false],
  ["a car company", false], ["a skincare line", false], ["a fast-food chain", false], ["a bank", false],
  ["a vape company", true], ["a crypto exchange", true], ["an online casino", true], ["a fast-fashion retailer", true],
];

const FameActions = {
  talkShow: { emoji: "📺", title: "Go on a late-night talk show", sub: "Fame and image, if you're charming", min: 20 },
  redCarpet: { emoji: "📸", title: "Walk a red carpet", sub: "Best dressed, or worst", min: 15 },
  gala: { emoji: "🎗️", title: "Host a charity gala", sub: "$100,000 · lifts your image", min: 15 },
  memoir: { emoji: "📖", title: "Write a memoir", sub: "A book deal, if you have a story", min: 30 },
  product: { emoji: "🧴", title: "Launch your own product line", sub: "$250,000 · needs an agent", min: 30 },
  foundation: { emoji: "🏛️", title: "Start a foundation", sub: "$500,000 · a lasting legacy", min: 25 },
  offGrid: { emoji: "🌲", title: "Step out of the spotlight for a year", sub: "Rest. Some fans will forget you", min: 0 },
};

function fameActionsFor(L) {
  if (!isCelebrity(L) || inPrison(L)) return [];
  return Object.entries(FameActions).filter(([id, a]) => L.fame >= a.min || (a.min <= 20 && L.followers >= 50000))
    .filter(([id]) => !(id === "foundation" && L.foundation) && !(id === "memoir" && L.memoirAge && L.age - L.memoirAge < 15) && !(id === "memoir" && L.age < 25))
    .map(([id]) => id);
}

function fameAction(L, action, arg) {
  if (!isCelebrity(L)) return out(L, "Fame", "I'm not famous enough yet.", false);
  const a = FameActions[action];
  if (usedThisYear(L, `fame-${action}`)) return out(L, a.title, "I already did that this year.", false);
  markUsed(L, `fame-${action}`);
  const fame = (d) => { L.fame = clamp(L.fame + d, 0, 100); };
  const image = (d) => { L.image = clamp(celebImage(L) + d, 0, 100); };
  L.fameActive = L.age;
  let m;
  switch (action) {
    case "talkShow":
      if (roll(0.5 + L.stats.smarts / 300 + (L.stats.looks - 50) / 400)) { fame(rnd(2, 5)); image(rnd(2, 6)); L.followers += rnd(5000, 80000); m = `📺 I was funny and relaxed on a late-night show. The clip went viral.`; }
      else { fame(1); image(-rnd(4, 9)); m = `📺 My talk show appearance was awkward. ${pick(["I overshared.", "I couldn't stop rambling.", "I insulted the host's favorite team."])}`; }
      break;
    case "redCarpet":
      adjust(L, { happiness: 5 }); fame(rnd(1, 3));
      if (roll(0.3 + L.stats.looks / 200)) { image(3); m = `📸 I made every best-dressed list in a ${pick(["custom gown", "tailored suit", "vintage couture look"])}.`; }
      else if (roll(0.3)) { image(-3); m = "📸 I made the worst-dressed list. The memes were merciless."; }
      else m = "📸 I walked the red carpet and smiled for the cameras.";
      break;
    case "gala":
      L.money -= 100000; image(rnd(5, 9)); L.karma += 5; fame(1);
      m = `🎗️ I hosted a charity gala for ${pick(["children's hospitals", "ocean cleanup", "mental health research", "refugee families"])} and raised ${formatMoney(rnd(500000, 5000000))}.`;
      break;
    case "memoir": {
      L.memoirAge = L.age;
      const advance = Math.round((L.fame * L.fame * 120 + 30000) * (L.stats.smarts > 60 ? 1.2 : 1));
      L.money += advance; image(rnd(-2, 5)); fame(2);
      m = `📖 I signed a ${formatMoney(advance)} deal for my memoir. ${pick(["Critics called it brave.", "It spilled a lot of tea.", "It hit the bestseller list."])}`;
      break;
    }
    case "product": {
      if (!team(L).agent) return out(L, a.title, "I need an agent to set up the licensing and retail deals.", false);
      const kind = arg || pick(["fragrance", "clothing line", "skincare line", "sneaker", "cookbook series"]);
      L.money -= 250000;
      if (roll(0.25 + L.fame / 200 + celebImage(L) / 400)) { const pay = Math.round(rnd(1000000, 8000000) * (L.fame / 60)); L.money += pay; image(2); m = `🧴 My ${kind} sold out everywhere. It made me ${formatMoney(pay)}.`; }
      else { image(-3); m = `🧴 My ${kind} flopped. The $250,000 I put in is gone.`; }
      break;
    }
    case "foundation":
      L.money -= 500000; L.foundation = L.age; image(15); L.karma += 10;
      m = `🏛️ I started the ${L.lastName} Foundation to ${pick(["fund scholarships", "fight childhood hunger", "support veterans", "protect wildlife"])}.`;
      break;
    case "offGrid":
      fame(-rnd(5, 10)); image(4); adjust(L, { happiness: 12, health: 4 }); L.fameActive = null;
      m = "🌲 I stepped away from the spotlight for a year. I feel like a person again.";
      break;
  }
  return out(L, a.title, m);
}

function toggleTeam(L, who) {
  const t = team(L);
  t[who] = !t[who];
  if (who === "agent") return out(L, "Agent", t.agent ? `🧑‍💼 I signed with a talent agent. They take ${AGENT_CUT * 100}% of my deals, but the deals get bigger.` : "I parted ways with my agent.", false);
  return out(L, "Publicist", t.publicist ? `🗞️ I hired a publicist for ${formatMoney(PUBLICIST_FEE)} a year to manage my image.` : "I let my publicist go.", false);
}

function progressCelebrity(L) {
  if (L.image != null) L.image = clamp(Math.round(L.image + (60 - L.image) * 0.08), 0, 100);
  if (L.foundation) L.image = clamp((L.image ?? 60) + 1, 0, 100);
  if (!isCelebrity(L)) return;
  const t = team(L);
  if (t.publicist) L.money -= PUBLICIST_FEE;
  if (inPrison(L)) return;
  if (roll(t.agent ? 0.55 : 0.22)) {
    const [brand, shady] = pick(Brands);
    const value = dealValue(L);
    packEvent(L, "brandDeal", { brand, shady, value }, `${cap(brand)} wants you as the face of their next campaign. They're offering ${formatMoney(value)}.${t.agent ? " Your agent thinks there's room to negotiate." : ""}`, ["Accept", "Negotiate for more", "Turn it down"]);
  } else if (roll(0.12 + (L.karma < 30 ? 0.1 : 0) + (L.criminalRecord.length ? 0.05 : 0))) {
    const story = pick([
      "an old video of you being rude to a waiter", "claims you were difficult on set", "photos from a wild party", "a leaked argument with your ex",
      "old posts you'd rather forget", "a former assistant's tell-all interview",
    ]);
    packEvent(L, "scandal", { story }, `A tabloid is about to publish ${story}.`, ["Issue a sincere apology", "Deny everything", "Say nothing", "Lean into it"]);
  } else if (roll(0.1)) {
    packEvent(L, "celebFeud", {}, `A bigger star mocked you in an interview that's all over social media.`, ["Respond with class", "Clap back hard", "Ignore it"]);
  }
}

packEvents({
  brandDeal: {
    emoji: "🤝", title: "Brand Deal",
    resolve: (L, d, c) => {
      if (c === 2) { if (d.shady) L.image = clamp(celebImage(L) + 2, 0, 100); return `I turned down ${d.brand}.${d.shady ? " Fans respected that." : ""}`; }
      let value = d.value;
      if (c === 1) {
        if (roll(team(L).agent ? 0.7 : 0.45)) value = Math.round(value * rndf(1.25, 1.6));
        else return `I pushed ${d.brand} for more money and they walked away.`;
      }
      const cut = team(L).agent ? Math.round(value * AGENT_CUT) : 0;
      L.money += value - cut;
      if (d.shady) L.image = clamp(celebImage(L) - rnd(6, 12), 0, 100);
      L.fameActive = L.age;
      return `🤝 I signed with ${d.brand} for ${formatMoney(value)}${cut ? ` (my agent took ${formatMoney(cut)})` : ""}.${d.shady ? " Some fans are disappointed in me." : ""}`;
    },
  },
  scandal: {
    emoji: "🗞️", title: "Scandal",
    resolve: (L, d, c) => {
      const pr = team(L).publicist;
      const hit = (n) => { L.image = clamp(celebImage(L) - Math.round(n * (pr ? 0.5 : 1)), 0, 100); };
      if (c === 0) { hit(rnd(2, 6)); return `🗞️ I apologized for ${d.story}. ${pr ? "My publicist made sure it landed well." : "Most people accepted it."}`; }
      if (c === 1) {
        if (roll(0.45)) { hit(1); return `🗞️ I denied ${d.story}. The story fizzled out.`; }
        hit(rnd(12, 20)); return "🗞️ I denied everything, then more proof came out. It's much worse now.";
      }
      if (c === 2) { hit(rnd(5, 10)); return "🗞️ I said nothing. The story ran for a week, then people moved on."; }
      L.fame = clamp(L.fame + rnd(2, 5), 0, 100); hit(rnd(8, 14));
      return "🗞️ I leaned into the controversy. More people know my name now, but fewer like me.";
    },
  },
  celebFeud: {
    emoji: "🔥", title: "Feud",
    resolve: (L, d, c) => {
      if (c === 0) { L.image = clamp(celebImage(L) + 5, 0, 100); return "🔥 I responded with a gracious joke. Everyone agreed I won."; }
      if (c === 1) { L.followers += rnd(20000, 200000); L.fame = clamp(L.fame + 2, 0, 100); L.image = clamp(celebImage(L) - 6, 0, 100); return "🔥 I clapped back hard. The internet loved the drama, if not me."; }
      return "I ignored it. It blew over in a few days.";
    },
  },
});
