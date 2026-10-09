// LifeSim: appearance. Everyone has a look (skin tone, eyes, hair texture and color, hairstyle,
// facial hair, accessories, outfit) drawn as an SVG portrait that ages with them.
// Children inherit skin tone, eye color, hair texture and natural hair color from their parents.
// Accessories, facial hair, dyes and outfits are choices, so they're never inherited.
"use strict";

// MARK: - Data

const SkinTones = ["#fbe4d3", "#f4d0b5", "#e9b893", "#d9a074", "#c0835a", "#a2663f", "#81502f", "#603a22", "#432818"];
const HairColors = {
  black: ["Black", "#1d1a1a"], darkBrown: ["Dark brown", "#3b2a20"], brown: ["Brown", "#6b4630"], auburn: ["Auburn", "#8e3c22"],
  red: ["Red", "#b9562d"], blonde: ["Blonde", "#d6b06a"], platinum: ["Platinum", "#ede0bf"],
  gray: ["Gray", "#a9a9a9"], white: ["White", "#ececec"], pink: ["Pink", "#ec7bb4"], blue: ["Blue", "#4d7fe6"], green: ["Green", "#3fae6a"], purple: ["Purple", "#8b5cd6"],
};
const NaturalHair = ["black", "darkBrown", "brown", "auburn", "red", "blonde", "platinum"];
const EyeColors = { darkBrown: ["Dark brown", "#3b2416"], brown: ["Brown", "#6b4226"], hazel: ["Hazel", "#8e6b35"], green: ["Green", "#4f8a4b"], blue: ["Blue", "#4a7fc1"], gray: ["Gray", "#7d8a96"] };
const Outfits = ["#3e6fd8", "#d84b4b", "#3fa66b", "#e0a339", "#7b5bd6", "#2b2f3a", "#e86fa8", "#2aa3a3", "#f2f2f2", "#8a5a3c"];
const AvatarBackgrounds = ["#dbe7ff", "#ffe3d6", "#e2f5e6", "#fff1c9", "#ece3ff", "#ffe0ec", "#dff4f4", "#eceff3"];

const HairStyles = {
  bald: { name: "Bald", texture: null },
  buzz: { name: "Buzz cut", texture: null },
  short: { name: "Short", texture: "straight" },
  sidepart: { name: "Side part", texture: "straight" },
  spiky: { name: "Spiky", texture: "straight" },
  mohawk: { name: "Mohawk", texture: null },
  bob: { name: "Bob", texture: "straight" },
  long: { name: "Long", texture: "straight" },
  ponytail: { name: "Ponytail", texture: "straight" },
  bun: { name: "Bun", texture: null },
  pigtails: { name: "Pigtails", texture: null },
  curlyShort: { name: "Short curls", texture: "curly" },
  afro: { name: "Afro", texture: "curly" },
  curlyLong: { name: "Long curls", texture: "curly" },
  braids: { name: "Braids", texture: "curly" },
  locs: { name: "Locs", texture: "curly" },
};
const StylePool = {
  male: { straight: ["short", "short", "sidepart", "sidepart", "buzz", "spiky"], curly: ["curlyShort", "curlyShort", "afro", "buzz", "locs"] },
  female: { straight: ["long", "long", "bob", "ponytail", "bun"], curly: ["curlyLong", "curlyLong", "afro", "braids", "bun"] },
  girl: { straight: ["long", "ponytail", "pigtails", "bob"], curly: ["curlyLong", "pigtails", "braids", "afro"] },
};
const FacialHair = { none: "Clean-shaven", stubble: "Stubble", mustache: "Mustache", goatee: "Goatee", beard: "Full beard" };
const Accessories = {
  glasses: { name: "Glasses", emoji: "👓", slot: "eyes", price: 150 },
  sunglasses: { name: "Sunglasses", emoji: "🕶️", slot: "eyes", price: 120 },
  earrings: { name: "Earrings", emoji: "💎", slot: "ears", price: 80 },
  necklace: { name: "Necklace", emoji: "📿", slot: "neck", price: 250 },
  cap: { name: "Baseball cap", emoji: "🧢", slot: "head", price: 25 },
  beanie: { name: "Beanie", emoji: "🧶", slot: "head", price: 20 },
  fedora: { name: "Fedora", emoji: "🎩", slot: "head", price: 90 },
  cowboy: { name: "Cowboy hat", emoji: "🤠", slot: "head", price: 120 },
  headband: { name: "Headband", emoji: "🎀", slot: "head", price: 15 },
  flower: { name: "Hair flower", emoji: "🌸", slot: "flower", price: 10 },
};

// MARK: - Making and inheriting looks

const lighter = (skin) => skin <= 3;
function weightedPick(items) {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [v, w] of items) { r -= w; if (r <= 0) return v; }
  return items[items.length - 1][0];
}
function styleFor(gender, age, texture) {
  const pool = gender === "male" ? StylePool.male : age < 13 ? StylePool.girl : StylePool.female;
  return pick(pool[texture] || pool.straight);
}

/// A random look. Hair and eye colors lean the way they do in real families: lighter colors with lighter skin.
function randomLook(gender, age = 30) {
  const skin = rnd(0, SkinTones.length - 1);
  const light = lighter(skin);
  const natural = weightedPick(light
    ? [["black", 2], ["darkBrown", 4], ["brown", 5], ["auburn", 1.5], ["red", 1], ["blonde", 3], ["platinum", 1]]
    : [["black", 8], ["darkBrown", 5], ["brown", 1.5], ["auburn", 0.3]]);
  const eyes = weightedPick(light ? [["darkBrown", 1], ["brown", 3], ["hazel", 2], ["green", 1.5], ["blue", 3], ["gray", 1]] : [["darkBrown", 6], ["brown", 3], ["hazel", 0.8], ["green", 0.2]]);
  const texture = roll(skin >= 5 ? 0.7 : 0.25) ? "curly" : "straight";
  const look = { skin, natural, hairColor: natural, eyes, texture, hair: styleFor(gender, age, texture), facial: "none", acc: [], outfit: rnd(0, Outfits.length - 1) };
  if (gender === "male" && age >= 40 && roll(0.2)) look.hair = pick(["bald", "buzz"]);
  if (gender === "male" && age >= 18 && roll(0.35)) look.facial = pick(["stubble", "mustache", "goatee", "beard", "beard"]);
  if (roll(age >= 45 ? 0.45 : 0.15)) look.acc.push("glasses");
  if (roll(gender === "female" ? 0.4 : 0.06)) look.acc.push("earrings");
  if (age >= 16 && roll(0.08)) look.acc.push(pick(["cap", "beanie", "fedora", "headband"]));
  if (age >= 16 && roll(0.08)) look.acc.push("necklace");
  return look;
}

/// A child's look: genes from both parents, styling of their own. Accessories are never inherited.
function inheritLook(a, b, gender, age = 0) {
  const skin = clamp(Math.round((a.skin + b.skin) / 2 + rndf(-0.8, 0.8)), 0, SkinTones.length - 1);
  // Darker hair tends to win; sometimes a lighter shade from either side shows up.
  const [darker, lighterHair] = NaturalHair.indexOf(a.natural) <= NaturalHair.indexOf(b.natural) ? [a.natural, b.natural] : [b.natural, a.natural];
  const natural = roll(0.62) ? darker : roll(0.85) ? lighterHair : pick(NaturalHair.slice(Math.max(0, NaturalHair.indexOf(darker) - 1), NaturalHair.indexOf(lighterHair) + 2));
  const brownish = (e) => e === "darkBrown" || e === "brown";
  let eyes;
  if (brownish(a.eyes) !== brownish(b.eyes)) eyes = roll(0.7) ? (brownish(a.eyes) ? a.eyes : b.eyes) : (brownish(a.eyes) ? b.eyes : a.eyes);
  else eyes = pick([a.eyes, b.eyes]);
  const texture = a.texture === b.texture ? (roll(0.92) ? a.texture : pick(["curly", "straight"])) : roll(0.62) ? "curly" : "straight";
  return { skin, natural, hairColor: natural, eyes, texture, hair: styleFor(gender, Math.max(age, 3), texture), facial: "none", acc: [], outfit: rnd(0, Outfits.length - 1) };
}

/// Two parents whose genes could plausibly have produced this look (for custom characters).
function parentsFor(look) {
  const sk = (d) => clamp(look.skin + d, 0, SkinTones.length - 1);
  const d = rnd(-1, 1);
  const mom = randomLook("female", 30), dad = randomLook("male", 32);
  mom.skin = sk(d); dad.skin = sk(-d);
  const hairSide = roll(0.5) ? mom : dad;
  hairSide.natural = hairSide.hairColor = look.natural;
  (roll(0.5) ? mom : dad).eyes = look.eyes;
  (roll(0.5) ? mom : dad).texture = look.texture;
  mom.hair = styleFor("female", 30, mom.texture); dad.hair = styleFor("male", 32, dad.texture);
  return [mom, dad];
}

function ensureLook(p, gender, age) {
  if (!p || p.species) return null;
  if (!p.look) p.look = randomLook(gender || p.gender, age ?? p.age ?? 30);
  return p.look;
}

// MARK: - Drawing

let avatarSeq = 0;
const hairHex = (k) => (HairColors[k] || HairColors.brown)[1];

function mixHex(a, b, t) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return "#" + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("");
}
const shade = (hex, t) => mixHex(hex, "#000000", t);

function geometry(age) {
  if (age < 2) return { stage: "baby", cx: 50, cy: 54, rx: 22, ry: 22, eyeY: 56, eyeDx: 8, mouthY: 66, body: "M22 104 C24 88 36 81 50 81 C64 81 76 88 78 104 Z", neckY: 72, neckH: 10 };
  if (age < 13) return { stage: "kid", cx: 50, cy: 50, rx: 20, ry: 21, eyeY: 52, eyeDx: 8, mouthY: 61, body: "M18 104 C20 87 32 80 50 80 C68 80 80 87 82 104 Z", neckY: 66, neckH: 15 };
  return { stage: age >= 60 ? "old" : age < 18 ? "teen" : "adult", cx: 50, cy: 45, rx: 19, ry: 22, eyeY: 46, eyeDx: 8, mouthY: 57, body: "M12 104 C14 82 30 74 50 74 C70 74 86 82 88 104 Z", neckY: 60, neckH: 16 };
}

/// The top of the head above a hairline at y, as a path.
function topCap(g, y, pad = 2, fringe = 0) {
  const RX = g.rx + pad, RY = g.ry + pad;
  const t = (y - g.cy) / RY;
  const dx = RX * Math.sqrt(Math.max(0, 1 - t * t));
  return `M${(g.cx - dx).toFixed(1)} ${y} A${RX} ${RY} 0 ${y > g.cy ? 1 : 0} 1 ${(g.cx + dx).toFixed(1)} ${y} Q${g.cx} ${y + fringe} ${(g.cx - dx).toFixed(1)} ${y}Z`;
}
const sideburns = (g) => {
  const y = g.cy - g.ry * 0.42;
  return [-1, 1].map((s) => `<path d="M${g.cx + s * (g.rx + 1.5)} ${y} L${g.cx + s * (g.rx + 0.5)} ${g.eyeY + 1} L${g.cx + s * (g.rx - 3)} ${g.eyeY - 2} L${g.cx + s * (g.rx - 4)} ${y}Z"/>`).join("");
};
const curls = (g, r, from, to, n, dist, cyOff = -2) => {
  let s = "";
  for (let i = 0; i <= n; i++) {
    const a = (from + (to - from) * i / n) * Math.PI / 180;
    s += `<circle cx="${(g.cx + Math.cos(a) * dist).toFixed(1)}" cy="${(g.cy + cyOff + Math.sin(a) * dist * (g.ry / g.rx)).toFixed(1)}" r="${r}"/>`;
  }
  return s;
};
const partedTop = (g) => {
  const T = g.cy - g.ry;
  return `<path d="M${g.cx} ${T - 3} Q${g.cx - g.rx - 3} ${T - 2} ${g.cx - g.rx - 3} ${g.cy + 2} L${g.cx - g.rx + 2} ${g.cy - 3} Q${g.cx - g.rx + 5} ${T + 10} ${g.cx - 1} ${T + 5}Z"/>`
    + `<path d="M${g.cx} ${T - 3} Q${g.cx + g.rx + 3} ${T - 2} ${g.cx + g.rx + 3} ${g.cy + 2} L${g.cx + g.rx - 2} ${g.cy - 3} Q${g.cx + g.rx - 5} ${T + 10} ${g.cx + 1} ${T + 5}Z"/>`;
};

/// Hair behind the head (drawn first) and in front of it (drawn after the face).
function hairLayers(style, g) {
  const { cx, cy, rx, ry } = g;
  const T = cy - ry;
  const hl = cy - ry * 0.42;
  const cap = (pad = 2.5, fringe = 2, y = hl) => `<path d="${topCap(g, y, pad, fringe)}"/>`;
  switch (style) {
    case "bald": return { back: "", front: "" };
    case "buzz": return { back: "", front: `<path opacity="0.85" d="${topCap(g, cy - ry * 0.48, 0.6, 0)}"/>` };
    case "short": return { back: "", front: cap() + `<ellipse cx="${cx}" cy="${T + 1}" rx="${rx * 0.85}" ry="5"/>` + sideburns(g) };
    case "sidepart": return { back: "", front: cap() + sideburns(g) + `<path d="M${cx - rx - 1} ${T + 13} Q${cx - 4} ${T - 5} ${cx + rx + 3} ${T + 9} L${cx + rx} ${T + 3} Q${cx} ${T - 9} ${cx - rx} ${T + 5}Z"/>` };
    case "spiky": {
      let spikes = "";
      for (let i = -3; i <= 3; i++) { const x = cx + i * 5.2; const dy = Math.abs(i) * 1.6; spikes += `<path d="M${x - 4} ${T + 5 + dy} L${x} ${T - 8 + dy} L${x + 4} ${T + 5 + dy}Z"/>`; }
      return { back: "", front: cap() + spikes + sideburns(g) };
    }
    case "mohawk": return { back: "", front: `<path opacity="0.35" d="${topCap(g, cy - ry * 0.48, 0.6, 0)}"/><path d="M${cx - 5} ${T + 14} Q${cx - 7} ${T - 12} ${cx} ${T - 15} Q${cx + 7} ${T - 12} ${cx + 5} ${T + 14}Z"/>` };
    case "bob": return {
      back: `<path d="M${cx - rx - 5} ${cy - 4} Q${cx - rx - 7} ${T - 5} ${cx} ${T - 5} Q${cx + rx + 7} ${T - 5} ${cx + rx + 5} ${cy - 4} L${cx + rx + 5} ${cy + 14} Q${cx + rx + 2} ${cy + 18} ${cx + rx - 3} ${cy + 16} L${cx - rx + 3} ${cy + 16} Q${cx - rx - 2} ${cy + 18} ${cx - rx - 5} ${cy + 14}Z"/>`,
      front: `<path d="${topCap(g, cy - ry * 0.36, 3, 0)}"/>` + [-1, 1].map((s) => `<path d="M${cx + s * (rx + 3)} ${cy - 8} L${cx + s * (rx + 4)} ${cy + 15} L${cx + s * (rx - 2)} ${cy + 15} L${cx + s * (rx - 2)} ${cy - 6}Z"/>`).join(""),
    };
    case "long": return {
      back: `<path d="M${cx - rx - 5} ${cy - 6} Q${cx - rx - 7} ${T - 5} ${cx} ${T - 5} Q${cx + rx + 7} ${T - 5} ${cx + rx + 5} ${cy - 6} L${cx + rx + 9} ${cy + 34} Q${cx} ${cy + 40} ${cx - rx - 9} ${cy + 34}Z"/>`,
      front: partedTop(g) + [-1, 1].map((s) => `<path d="M${cx + s * (rx + 3)} ${cy - 6} Q${cx + s * (rx + 6)} ${cy + 14} ${cx + s * (rx + 4)} ${cy + 33} L${cx + s * (rx - 2)} ${cy + 31} Q${cx + s * (rx + 0)} ${cy + 12} ${cx + s * (rx - 2)} ${cy - 3}Z"/>`).join(""),
    };
    case "ponytail": return {
      back: `<ellipse cx="${cx + rx + 3}" cy="${cy + 9}" rx="5.5" ry="15" transform="rotate(14 ${cx + rx + 3} ${cy + 9})"/>`,
      front: cap(2.5, 1) + `<rect x="${cx + rx - 1}" y="${cy - 9}" width="5" height="4" rx="1.5" fill="#e85d75"/>`,
    };
    case "bun": return { back: `<circle cx="${cx}" cy="${T - 5}" r="8.5"/>`, front: cap(2.5, 1) };
    case "pigtails": return { back: [-1, 1].map((s) => `<ellipse cx="${cx + s * (rx + 6)}" cy="${cy + 2}" rx="6" ry="9"/>`).join(""), front: partedTop(g) };
    case "curlyShort": return { back: "", front: `<path d="${topCap(g, cy - ry * 0.45, 3, 0)}"/>` + curls(g, 5, 195, 345, 9, rx + 1.5, -3) };
    case "afro": return { back: `<ellipse cx="${cx}" cy="${cy - 6}" rx="${rx + 13}" ry="${ry + 9}"/>`, front: `<path d="${topCap(g, cy - ry * 0.45, 4, 0)}"/>` + curls(g, 5, 200, 340, 8, rx + 2, -4) };
    case "curlyLong": {
      let mass = "";
      for (let row = 0; row < 6; row++) for (let i = -3; i <= 3; i++) {
        const y = T + row * 9; const x = cx + i * ((rx + 8) / 3);
        if (row > 1 && Math.abs(i) < 2) continue;
        mass += `<circle cx="${x.toFixed(1)}" cy="${y}" r="7.5"/>`;
      }
      return { back: mass, front: `<path d="${topCap(g, cy - ry * 0.4, 3, 0)}"/>` + curls(g, 5.5, 190, 350, 10, rx + 2, -2) };
    }
    case "braids": return {
      back: `<path d="${topCap(g, cy, 4, 0)}"/>`,
      front: partedTop(g) + [-1, 1].map((s) => {
        let seg = `<rect x="${cx + s * (rx + 2) - 3.5}" y="${cy - 6}" width="7" height="${40}" rx="3.5"/>`;
        for (let y = cy - 2; y < cy + 33; y += 5) seg += `<path d="M${cx + s * (rx + 2) - 3.5} ${y} l7 2" stroke="rgba(0,0,0,0.3)" stroke-width="1"/>`;
        return seg;
      }).join(""),
    };
    case "locs": {
      let strands = "";
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) strands += `<rect x="${cx + s * (rx - 2 + k * 3.6) - 2}" y="${cy - 10 + k * 2}" width="4" height="${34 - k * 4}" rx="2"/>`;
      return { back: `<path d="${topCap(g, cy, 4, 0)}"/>`, front: `<path d="${topCap(g, cy - ry * 0.4, 3, 3)}"/>` + strands };
    }
  }
  return { back: "", front: cap() };
}

function facialHairSvg(kind, g, color) {
  const { cx, cy, rx, ry, mouthY, eyeY } = g;
  const top = eyeY + 6;
  const jaw = `M${cx - rx + 0.5} ${top} Q${cx - rx + 3} ${cy + ry - 1} ${cx} ${cy + ry + 2} Q${cx + rx - 3} ${cy + ry - 1} ${cx + rx - 0.5} ${top} L${cx + rx - 4} ${top + 1} Q${cx + 5} ${mouthY - 5} ${cx} ${mouthY - 4} Q${cx - 5} ${mouthY - 5} ${cx - rx + 4} ${top + 1}Z`;
  const stache = `<path d="M${cx - 7.5} ${mouthY - 2} Q${cx - 4} ${mouthY - 6.5} ${cx} ${mouthY - 4.5} Q${cx + 4} ${mouthY - 6.5} ${cx + 7.5} ${mouthY - 2} Q${cx} ${mouthY - 3} ${cx - 7.5} ${mouthY - 2}Z" fill="${color}"/>`;
  switch (kind) {
    case "stubble": return `<path d="${jaw}" fill="${color}" opacity="0.22"/>`;
    case "mustache": return stache;
    case "goatee": return stache + `<ellipse cx="${cx}" cy="${cy + ry - 2}" rx="4.5" ry="4" fill="${color}"/>`;
    case "beard": return `<path d="${jaw}" fill="${color}"/>` + stache;
  }
  return "";
}

function hatSvg(kind, g, color) {
  const { cx, cy, rx, ry } = g;
  const T = cy - ry;
  switch (kind) {
    case "cap": return `<path d="M${cx - rx - 2} ${T + 10} Q${cx - rx - 1} ${T - 7} ${cx} ${T - 8} Q${cx + rx + 1} ${T - 7} ${cx + rx + 2} ${T + 10}Z" fill="${color}"/><path d="M${cx - rx - 2} ${T + 9} Q${cx + 4} ${T + 5} ${cx + rx + 15} ${T + 11} Q${cx + rx + 8} ${T + 15} ${cx - rx - 2} ${T + 13}Z" fill="${shade(color, 0.2)}"/>`;
    case "beanie": return `<path d="M${cx - rx - 2.5} ${T + 13} Q${cx - rx - 2} ${T - 9} ${cx} ${T - 10} Q${cx + rx + 2} ${T - 9} ${cx + rx + 2.5} ${T + 13}Z" fill="${color}"/><rect x="${cx - rx - 3}" y="${T + 7}" width="${rx * 2 + 6}" height="7" rx="3" fill="${shade(color, 0.18)}"/><circle cx="${cx}" cy="${T - 11}" r="4.5" fill="${shade(color, 0.1)}"/>`;
    case "fedora": return `<ellipse cx="${cx}" cy="${T + 8}" rx="${rx + 12}" ry="4.5" fill="${shade(color, 0.15)}"/><path d="M${cx - rx + 1} ${T + 8} L${cx - rx + 3} ${T - 8} Q${cx} ${T - 13} ${cx + rx - 3} ${T - 8} L${cx + rx - 1} ${T + 8}Z" fill="${color}"/><rect x="${cx - rx + 1.5}" y="${T + 2}" width="${rx * 2 - 3}" height="4" fill="#2a2a2a"/>`;
    case "cowboy": return `<path d="M${cx - rx - 15} ${T + 3} Q${cx} ${T + 17} ${cx + rx + 15} ${T + 3} Q${cx} ${T + 10} ${cx - rx - 15} ${T + 3}Z" fill="${shade(color, 0.15)}"/><path d="M${cx - rx + 2} ${T + 9} L${cx - rx + 4} ${T - 9} Q${cx - 4} ${T - 13} ${cx} ${T - 8} Q${cx + 4} ${T - 13} ${cx + rx - 4} ${T - 9} L${cx + rx - 2} ${T + 9}Z" fill="${color}"/>`;
    case "headband": return `<path d="M${cx - rx - 1} ${T + 11} Q${cx} ${T + 1} ${cx + rx + 1} ${T + 11} L${cx + rx + 1} ${T + 15} Q${cx} ${T + 5} ${cx - rx - 1} ${T + 15}Z" fill="${color}"/>`;
  }
  return "";
}

/// Draws a portrait. Accessories and facial hair only appear once someone is old enough for them.
function avatarSvg(look, age, opts = {}) {
  const g = geometry(age);
  const id = `av${++avatarSeq}`;
  const skin = SkinTones[clamp(look.skin, 0, SkinTones.length - 1)];
  const skinDark = shade(skin, 0.22);
  let hair = hairHex(look.hairColor);
  if (look.hairColor === look.natural && age >= 50) hair = mixHex(hair, age >= 75 ? "#ededed" : "#b4b4b4", Math.min(1, (age - 50) / 22));
  const brow = age >= 70 ? mixHex(hair, "#cfcfcf", 0.4) : hair;
  const eye = (EyeColors[look.eyes] || EyeColors.brown)[1];
  const outfit = Outfits[look.outfit ?? 0] || Outfits[0];
  const bg = opts.bg || AvatarBackgrounds[opts.seed ? [...String(opts.seed)].reduce((s, c) => s + c.charCodeAt(0), 0) % AvatarBackgrounds.length : 0];
  const { cx, cy, rx, ry, eyeY, eyeDx, mouthY } = g;
  const grown = age >= 3;
  const acc = grown ? (look.acc || []) : [];
  const has = (a) => acc.includes(a);
  const hatKind = acc.find((a) => Accessories[a]?.slot === "head");
  const style = g.stage === "baby" ? null : look.hair;
  const layers = style ? hairLayers(style, g) : { back: "", front: "" };
  let s = `<svg class="av${opts.dead ? " dead" : ""}" viewBox="0 0 100 100" role="img" aria-hidden="true"><defs><clipPath id="${id}"><circle cx="50" cy="50" r="50"/></clipPath></defs><g clip-path="url(#${id})">`;
  s += `<rect width="100" height="100" fill="${bg}"/>`;
  s += `<g fill="${hair}">${layers.back}</g>`;
  s += `<path d="${g.body}" fill="${outfit}"/>`;
  s += `<rect x="${cx - 6.5}" y="${g.neckY}" width="13" height="${g.neckH}" rx="5" fill="${skinDark}"/>`;
  s += `<path d="M${cx - 7} ${g.neckY + g.neckH - 2} Q${cx} ${g.neckY + g.neckH + 6} ${cx + 7} ${g.neckY + g.neckH - 2}Z" fill="${skinDark}"/>`;
  if (has("necklace")) s += `<path d="M${cx - 9} ${g.neckY + g.neckH - 3} Q${cx} ${g.neckY + g.neckH + 8} ${cx + 9} ${g.neckY + g.neckH - 3}" stroke="#e2b33c" stroke-width="1.4" fill="none"/><circle cx="${cx}" cy="${g.neckY + g.neckH + 4}" r="2" fill="#e2b33c"/>`;
  s += [-1, 1].map((d) => `<ellipse cx="${cx + d * (rx - 0.5)}" cy="${eyeY + 1}" rx="3.6" ry="5" fill="${skin}"/>`).join("");
  s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${skin}"/>`;
  if (g.stage === "baby" || g.stage === "kid") s += [-1, 1].map((d) => `<circle cx="${cx + d * 11}" cy="${eyeY + 6}" r="3.2" fill="#ff8f8f" opacity="0.3"/>`).join("");
  if (g.stage === "old") s += `<path d="M${cx - 8} ${cy - ry + 9} Q${cx} ${cy - ry + 7} ${cx + 8} ${cy - ry + 9}" stroke="${skinDark}" stroke-width="0.9" fill="none" opacity="0.6"/>` + [-1, 1].map((d) => `<path d="M${cx + d * (eyeDx + 5)} ${eyeY - 1} l${d * 2.5} 1.5 M${cx + d * (eyeDx + 5)} ${eyeY + 1.5} l${d * 2.5} 0.5" stroke="${skinDark}" stroke-width="0.8" opacity="0.6"/>`).join("");
  // Eyes and brows.
  for (const d of [-1, 1]) {
    const ex = cx + d * eyeDx;
    if (g.stage === "baby") s += `<path d="M${ex - 3} ${eyeY} Q${ex} ${eyeY + 2.5} ${ex + 3} ${eyeY}" stroke="#3a2a22" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
    else s += `<ellipse cx="${ex}" cy="${eyeY}" rx="3.7" ry="2.9" fill="#fff"/><circle cx="${ex}" cy="${eyeY}" r="2.3" fill="${eye}"/><circle cx="${ex}" cy="${eyeY}" r="1.1" fill="#141414"/><circle cx="${ex + 0.8}" cy="${eyeY - 0.8}" r="0.6" fill="#fff"/>`;
    if (g.stage !== "baby") s += `<path d="M${ex - 4.5} ${eyeY - 5.6} Q${ex} ${eyeY - 7.6} ${ex + 4.5} ${eyeY - 5.6}" stroke="${brow}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  }
  s += `<path d="M${cx} ${eyeY + 2} Q${cx - 2} ${eyeY + 7} ${cx} ${eyeY + 8} Q${cx + 2} ${eyeY + 8} ${cx + 2.2} ${eyeY + 7}" stroke="${skinDark}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
  if ((g.stage === "adult" || g.stage === "old" || (g.stage === "teen" && age >= 16)) && look.facial && look.facial !== "none") s += facialHairSvg(look.facial, g, hair);
  s += `<path d="M${cx - 5.5} ${mouthY} Q${cx} ${mouthY + (g.stage === "adult" || g.stage === "old" ? 4 : 5)} ${cx + 5.5} ${mouthY}" stroke="#7a3b3b" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  // Hair in front, then accessories on top.
  if (g.stage === "baby" && look.hair !== "bald") s += `<path d="M${cx - 3} ${cy - ry + 1} Q${cx} ${cy - ry - 7} ${cx + 4} ${cy - ry - 3} Q${cx + 1} ${cy - ry - 2} ${cx + 1} ${cy - ry + 2}Z" fill="${hair}"/>`;
  s += `<g fill="${hair}">${layers.front}</g>`;
  if (has("earrings")) s += [-1, 1].map((d) => `<circle cx="${cx + d * (rx - 0.5)}" cy="${eyeY + 7}" r="1.7" fill="#e2b33c"/>`).join("");
  if (has("glasses")) s += [-1, 1].map((d) => `<circle cx="${cx + d * eyeDx}" cy="${eyeY}" r="5.4" stroke="#2b2b2b" stroke-width="1.5" fill="rgba(255,255,255,0.18)"/>`).join("") + `<path d="M${cx - 2.6} ${eyeY - 0.5} Q${cx} ${eyeY - 2} ${cx + 2.6} ${eyeY - 0.5}" stroke="#2b2b2b" stroke-width="1.4" fill="none"/>`;
  if (has("sunglasses")) s += [-1, 1].map((d) => `<rect x="${cx + d * eyeDx - 6}" y="${eyeY - 3.8}" width="12" height="8" rx="3" fill="#161616"/>`).join("") + `<path d="M${cx - 2.5} ${eyeY - 1} L${cx + 2.5} ${eyeY - 1}" stroke="#161616" stroke-width="1.6"/>`;
  if (hatKind) s += hatSvg(hatKind, g, hatKind === "headband" ? "#e85d75" : hatKind === "cowboy" ? "#9a6a3f" : hatKind === "fedora" ? "#4a4f5c" : shade(outfit, 0.05));
  if (has("flower")) s += `<g transform="translate(${cx + rx - 4} ${cy - ry + 8})">${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(Math.cos(a * Math.PI / 180) * 3).toFixed(1)}" cy="${(Math.sin(a * Math.PI / 180) * 3).toFixed(1)}" r="2.6" fill="#ff8fb8"/>`).join("")}<circle r="1.8" fill="#ffd34d"/></g>`;
  s += `</g></svg>`;
  return s;
}

/// Portrait for a person in your life (pets keep their emoji).
function personAvatar(p) {
  if (p.species) return petEmoji[p.species] || "🐾";
  ensureLook(p);
  return avatarSvg(p.look, p.age, { seed: p.id, dead: !p.isAlive });
}
function playerAvatar(L) {
  ensureLook(L, L.gender, L.age);
  return avatarSvg(L.look, L.age, { bg: "#dfe8ff", dead: !L.isAlive });
}

// MARK: - Changing your look

const lookCost = (before, after) => {
  let c = 0;
  if (after.hair !== before.hair) c += 60;
  if (after.hairColor !== before.hairColor) c += after.hairColor === after.natural ? 60 : 120;
  if (after.outfit !== before.outfit) c += 100;
  for (const a of after.acc || []) if (!(before.acc || []).includes(a)) c += Accessories[a].price;
  return c;
};

function describeLookChange(before, after) {
  const bits = [];
  if (after.hair !== before.hair) {
    const n = HairStyles[after.hair].name.toLowerCase();
    bits.push(after.hair === "bald" ? "a shaved head" : /s$/.test(n) ? n : `${/^[aeiou]/.test(n) ? "an" : "a"} ${n}`);
  }
  if (after.hairColor !== before.hairColor) bits.push(after.hairColor === after.natural ? "my natural hair color back" : `${HairColors[after.hairColor][0].toLowerCase()} hair`);
  if (after.facial !== before.facial) bits.push(after.facial === "none" ? "a clean shave" : FacialHair[after.facial].toLowerCase());
  const added = (after.acc || []).filter((a) => !(before.acc || []).includes(a));
  const removed = (before.acc || []).filter((a) => !(after.acc || []).includes(a));
  if (added.length) bits.push(`new ${added.map((a) => Accessories[a].name.toLowerCase()).join(" and ")}`);
  if (removed.length) bits.push(`no more ${removed.map((a) => Accessories[a].name.toLowerCase()).join(" or ")}`);
  if (after.outfit !== before.outfit) bits.push("a new outfit");
  return bits;
}

/// Applies a makeover (salon, shopping). Kids' makeovers are paid for by their parents.
function changeLook(L, draft) {
  ensureLook(L);
  const before = L.look;
  const bits = describeLookChange(before, draft);
  if (!bits.length) return out(L, "New look", "Nothing changed.", false);
  const cost = L.age < 18 ? 0 : lookCost(before, draft);
  if (L.money < cost) return out(L, "New look", `That makeover costs ${formatMoney(cost)}.`, false);
  L.money -= cost;
  L.look = { ...draft, acc: [...(draft.acc || [])] };
  adjust(L, { happiness: rnd(2, 6) });
  return out(L, "New look", `💇 I treated myself to ${bits.join(", ")}.${cost ? ` (${formatMoney(cost)})` : L.age < 18 ? " My parents paid." : ""}`);
}

/// Toggles an accessory, keeping one item per slot (one hat, one pair of glasses).
function toggleAccessory(look, id) {
  const acc = (look.acc || []).slice();
  if (acc.includes(id)) return { ...look, acc: acc.filter((a) => a !== id) };
  const slot = Accessories[id].slot;
  return { ...look, acc: acc.filter((a) => Accessories[a].slot !== slot).concat([id]) };
}
