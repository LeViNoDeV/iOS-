// LifeSim game engine — a JavaScript port of the iOS app's Core folder.
// Pure game logic: no DOM access. `game-data.js` must load first.
"use strict";

// MARK: - Helpers

const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const rndf = (a, b) => Math.random() * (b - a) + a;
const roll = (p) => Math.random() < p;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const idiv = (a, b) => Math.trunc(a / b);
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function formatMoney(amount) {
  const digits = Math.abs(Math.round(amount)).toLocaleString("en-US");
  return amount < 0 ? `-$${digits}` : `$${digits}`;
}
function formatCount(n) { return Math.round(n).toLocaleString("en-US"); }

function gradeLetter(g) {
  if (g >= 90) return "A+";
  if (g >= 80) return "A";
  if (g >= 70) return "B";
  if (g >= 60) return "C";
  if (g >= 50) return "D";
  return "F";
}

// MARK: - Static data

const Names = {
  male: ["James", "Liam", "Noah", "Oliver", "Elijah", "Lucas", "Mason", "Logan", "Ethan", "Aiden", "Jacob", "Michael", "Daniel", "Henry", "Jackson", "Sebastian", "Mateo", "Leo", "Owen", "Samuel", "David", "Joseph", "Carter", "Wyatt", "Jayden", "Gabriel", "Julian", "Isaac", "Anthony", "Dylan", "Noam", "Ari", "Omar", "Kenji", "Diego", "Marco", "Andre", "Felix", "Hugo", "Ravi"],
  female: ["Olivia", "Emma", "Charlotte", "Amelia", "Ava", "Sophia", "Isabella", "Mia", "Evelyn", "Harper", "Luna", "Camila", "Gianna", "Elizabeth", "Eleanor", "Ella", "Abigail", "Sofia", "Avery", "Scarlett", "Emily", "Aria", "Penelope", "Chloe", "Layla", "Mila", "Nora", "Hazel", "Madison", "Ellie", "Noa", "Yael", "Aisha", "Yuki", "Lucia", "Chiara", "Zara", "Ingrid", "Priya", "Maya"],
  last: ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris", "Clark", "Lewis", "Robinson", "Walker", "Young", "King", "Wright", "Levi", "Cohen", "Tanaka", "Rossi", "Müller", "Nguyen", "Kim", "Patel", "Silva", "Novak"],
  places: [["New York", "United States"], ["Los Angeles", "United States"], ["Chicago", "United States"], ["Austin", "United States"], ["London", "United Kingdom"], ["Manchester", "United Kingdom"], ["Toronto", "Canada"], ["Vancouver", "Canada"], ["Sydney", "Australia"], ["Melbourne", "Australia"], ["Tel Aviv", "Israel"], ["Berlin", "Germany"], ["Paris", "France"], ["Rome", "Italy"], ["Madrid", "Spain"], ["Tokyo", "Japan"], ["Dublin", "Ireland"], ["Amsterdam", "Netherlands"]],
  boats: [["Fishing Boat", 25000], ["Speedboat", 80000], ["Sailboat", 150000], ["Yacht", 2500000], ["Superyacht", 40000000]],
  cars: [["Used Hatchback", 4000], ["Compact Sedan", 18000], ["Family SUV", 35000], ["Pickup Truck", 42000], ["Electric Sedan", 55000], ["Luxury Sedan", 85000], ["Sports Car", 140000], ["Supercar", 320000]],
  houses: [["Studio Apartment", 120000], ["Condo", 240000], ["Townhouse", 380000], ["Suburban House", 520000], ["Beach House", 950000], ["Penthouse", 1800000], ["Mansion", 4500000], ["Castle", 12000000]],
  petNames: ["Max", "Bella", "Charlie", "Luna", "Rocky", "Coco", "Buddy", "Daisy", "Milo", "Pepper"],
  petSpecies: ["Dog", "Cat", "Rabbit", "Parrot", "Hamster"],
  first(gender) { return pick(gender === "male" ? this.male : this.female); },
  randomLast() { return pick(this.last); },
};

const petEmoji = { Dog: "🐶", Cat: "🐱", Rabbit: "🐰", Parrot: "🦜", Hamster: "🐹" };

const universityMajors = ["Computer Science", "Engineering", "Biology", "Nursing", "Business", "Psychology", "English", "Art", "Economics", "Education"];
const universityTuitionPerYear = 25000;

const GraduateFields = {
  medicine: { schoolName: "Medical School", degreeName: "M.D.", years: 4, tuition: 55000 },
  law: { schoolName: "Law School", degreeName: "J.D.", years: 3, tuition: 48000 },
  business: { schoolName: "Business School", degreeName: "MBA", years: 2, tuition: 60000 },
};

const EducationLevels = ["none", "highSchool", "bachelor", "graduate"];
const eduRank = (e) => EducationLevels.indexOf(e);
const eduLabel = { none: "None", highSchool: "High School Diploma", bachelor: "Bachelor's Degree", graduate: "Graduate Degree" };

const companyNames = ["Acme Corp", "Globex", "Initech", "Umbrella Inc", "Stark Industries", "Wayne Enterprises", "Hooli", "Pied Piper", "Vandelay Industries", "Dunder Mifflin", "Soylent", "Cyberdyne", "City Hospital", "County Schools", "Burger Barn", "Bean Machine", "MegaMart"];

const Illnesses = {
  cold: { name: "Common Cold", damage: 2, cure: 0.9 },
  flu: { name: "Flu", damage: 4, cure: 0.9 },
  migraine: { name: "Migraines", damage: 2, cure: 0.9 },
  backPain: { name: "Back Pain", damage: 4, cure: 0.7 },
  depression: { name: "Depression", damage: 2, cure: 0.4 },
  insomnia: { name: "Insomnia", damage: 2, cure: 0.7 },
  pneumonia: { name: "Pneumonia", damage: 8, cure: 0.7 },
  diabetes: { name: "Diabetes", damage: 8, cure: 0.25 },
  heartDisease: { name: "Heart Disease", damage: 12, cure: 0.35 },
  cancer: { name: "Cancer", damage: 18, cure: 0.3 },
  std: { name: "an STD", damage: 4, cure: 0.7 },
  brokenArm: { name: "a Broken Arm", damage: 2, cure: 0.9 },
};
function randomIllness(age) {
  let pool = ["cold", "cold", "flu", "flu", "migraine", "brokenArm"];
  if (age >= 13) pool.push("depression", "insomnia");
  if (age >= 30) pool.push("backPain", "pneumonia");
  if (age >= 45) pool.push("backPain", "flu", "diabetes", "heartDisease", "cancer");
  if (age >= 65) pool.push("heartDisease", "cancer", "pneumonia");
  return pick(pool);
}

const Treatments = [
  { id: "doctor", title: "Doctor", emoji: "🩺", cost: 200, mult: 1.0 },
  { id: "specialist", title: "Specialist", emoji: "👩‍⚕️", cost: 5000, mult: 1.4 },
  { id: "herbalist", title: "Herbalist", emoji: "🌿", cost: 80, mult: 0.4 },
  { id: "witchDoctor", title: "Witch Doctor", emoji: "🪬", cost: 30, mult: 0.2 },
  { id: "therapist", title: "Therapist", emoji: "🛋️", cost: 300, mult: 0 },
];

const Addictions = {
  alcohol: "Alcoholism", drugs: "Drug Addiction", gambling: "Gambling Addiction", smoking: "Nicotine Addiction",
};

const schoolClubs = [["Sports Team", "⚽"], ["Drama Club", "🎭"], ["Debate Team", "🗣️"], ["Marching Band", "🎺"], ["Chess Club", "♟️"], ["Student Council", "🗳️"]];

const Gigs = [
  { id: "mowLawns", title: "Mow Lawns", emoji: "🌱", minAge: 10, pay: [20, 80] },
  { id: "babysit", title: "Babysit", emoji: "🍼", minAge: 10, pay: [30, 120] },
  { id: "deliverFood", title: "Deliver Food", emoji: "🛵", minAge: 16, pay: [50, 200] },
  { id: "rideshare", title: "Drive for Rideshare", emoji: "🚕", minAge: 18, pay: [100, 400] },
  { id: "streetPerform", title: "Street Perform", emoji: "🎸", minAge: 10, pay: [0, 150] },
];

const Ribbons = {
  notorious: ["Notorious", "🔪", "Left a trail of bodies behind."],
  famous: ["Famous", "⭐", "The whole world knew your name."],
  rich: ["Rich", "💰", "Died with a fortune."],
  criminal: ["Criminal", "🦹", "A life of crime."],
  casanova: ["Casanova", "💋", "So many lovers."],
  family: ["Family", "👨‍👩‍👧‍👦", "Raised a big family."],
  scholar: ["Scholar", "🎓", "A brilliant, educated mind."],
  ancient: ["Ancient", "🐢", "Lived to a ripe old age."],
  partyAnimal: ["Party Animal", "🎉", "Never missed a party."],
  athlete: ["Athlete", "🏅", "Lived at the gym."],
  saint: ["Saint", "😇", "A truly good person."],
  wicked: ["Wicked", "😈", "A rotten soul."],
  shortLived: ["Short-Lived", "🥀", "Gone too soon."],
  broke: ["Broke", "💸", "Died deep in debt."],
  average: ["Average", "😐", "A perfectly ordinary life."],
};

const Traits = {
  kind: ["💗", "Looks after you when you're sick or down."],
  generous: ["🎁", "Happy to help out with money."],
  funny: ["😂", "Always cheers you up."],
  ambitious: ["🚀", "Driven, and earns more."],
  jealous: ["😒", "Hates it when you spend time with others."],
  lazy: ["🛋️", "Earns less and doesn't pull their weight."],
  toxic: ["☠️", "Draining to be around. The bond decays faster."],
};
const randomTrait = () => (roll(0.75) ? pick(Object.keys(Traits)) : null);

const npcOccupations = [
  ["Teacher", 40000, 65000], ["Nurse", 55000, 90000], ["Electrician", 45000, 80000], ["Accountant", 55000, 95000],
  ["Software Engineer", 90000, 180000], ["Chef", 30000, 70000], ["Police Officer", 50000, 90000], ["Lawyer", 90000, 250000],
  ["Doctor", 180000, 350000], ["Barista", 22000, 30000], ["Mechanic", 38000, 65000], ["Real Estate Agent", 30000, 150000],
  ["Graphic Designer", 40000, 85000], ["Pharmacist", 110000, 150000], ["Plumber", 45000, 90000], ["Cashier", 20000, 28000],
  ["Pilot", 100000, 220000], ["Artist", 10000, 60000],
];

// Activities: [title, emoji, subtitle, minAge]
const Activities = {
  gym: ["Gym", "🏋️", "Get in shape", 12],
  library: ["Library", "📚", "Read some books", 6],
  meditate: ["Meditate", "🧘", "Find inner peace", 6],
  walk: ["Go for a Walk", "🚶", "Fresh air", 4],
  martialArts: ["Martial Arts", "🥋", "Learn to fight · $150", 6],
  salon: ["Salon & Spa", "💅", "Pamper yourself · $250", 12],
  diet: ["Go on a Diet", "🥗", "Eat healthier", 12],
  party: ["Night Club", "🪩", "Dance the night away · $100", 18],
  bar: ["Go to a Bar", "🍺", "Have a few drinks · $60", 18],
  drugs: ["Do Drugs", "💊", "A dangerous high", 14],
  movies: ["Movie Theater", "🎬", "Catch a film · $15", 5],
  concert: ["Concert", "🎤", "See a live show · $120", 12],
  vacation: ["Vacation", "🏖️", "Get away · $3,000", 18],
  plasticSurgery: ["Plastic Surgery", "💉", "Change your look · $10,000", 18],
  lottery: ["Lottery", "🎟️", "Buy a ticket · $20", 18],
};
const ActivityGroups = [
  ["Mind & Body", ["gym", "library", "meditate", "walk", "martialArts", "salon", "diet"]],
  ["Nightlife", ["party", "bar", "drugs"]],
  ["Leisure", ["movies", "concert", "vacation", "plasticSurgery", "lottery"]],
];

const CasinoGames = [
  { id: "blackjack", title: "Blackjack", emoji: "🃏", chance: 0.46, payout: 2 },
  { id: "roulette", title: "Roulette", emoji: "🎡", chance: 0.18, payout: 6 },
  { id: "slots", title: "Slot Machines", emoji: "🎰", chance: 0.05, payout: 15 },
  { id: "horseRacing", title: "Horse Racing", emoji: "🏇", chance: 0.12, payout: 8 },
];
const casinoBets = [100, 1000, 10000, 100000];

const Crimes = [
  { id: "shoplift", title: "Shoplift", emoji: "🛍️", minAge: 10, catchChance: 0.25, loot: [20, 300], sentence: [1, 1] },
  { id: "porchPirate", title: "Porch Pirate", emoji: "📦", minAge: 10, catchChance: 0.2, loot: [20, 600], sentence: [1, 1] },
  { id: "pickpocket", title: "Pickpocket", emoji: "👛", minAge: 10, catchChance: 0.3, loot: [10, 800], sentence: [1, 2] },
  { id: "burglary", title: "Burglary", emoji: "🏚️", minAge: 14, catchChance: 0.35, loot: [500, 15000], sentence: [2, 5] },
  { id: "extortion", title: "Extortion", emoji: "✉️", minAge: 18, catchChance: 0.4, loot: [2000, 50000], sentence: [2, 6] },
  { id: "carTheft", title: "Grand Theft Auto", emoji: "🚙", minAge: 16, catchChance: 0.4, loot: [3000, 40000], sentence: [3, 8] },
  { id: "trainRobbery", title: "Train Robbery", emoji: "🚂", minAge: 18, catchChance: 0.5, loot: [10000, 300000], sentence: [5, 15] },
  { id: "bankRobbery", title: "Rob a Bank", emoji: "🏦", minAge: 18, catchChance: 0.6, loot: [50000, 2000000], sentence: [10, 30] },
];

const PrisonActions = [
  { id: "workout", title: "Work Out in the Yard", emoji: "💪" },
  { id: "study", title: "Study in the Prison Library", emoji: "📖" },
  { id: "appeal", title: "Appeal My Sentence ($5,000)", emoji: "⚖️" },
  { id: "bribe", title: "Bribe the Warden ($25,000)", emoji: "💵" },
  { id: "riot", title: "Start a Riot", emoji: "🔥" },
  { id: "escape", title: "Attempt an Escape", emoji: "🏃" },
];

const RelActions = {
  spendTime: "Spend Time", conversation: "Have a Conversation", compliment: "Compliment", gift: "Give a Gift ($100)",
  askForMoney: "Ask for Money", argue: "Argue", propose: "Propose 💍", marry: "Get Married 💒", haveBaby: "Try for a Baby 👶",
  breakUp: "Break Up", play: "Play", walkPet: "Go for a Walk", insult: "Insult", prank: "Prank", assault: "Assault 👊", murder: "Murder 🔪",
};
const hostileActions = new Set(["argue", "breakUp", "insult", "prank", "assault", "murder"]);

// MARK: - People

const isParent = (k) => k === "mother" || k === "father";
const isRomantic = (k) => k === "partner" || k === "fiance" || k === "spouse";

function avatarEmoji(age, gender) {
  if (age < 3) return "👶";
  if (age < 13) return gender === "male" ? "👦" : "👧";
  if (age < 20) return gender === "male" ? "🧑" : "👩‍🦰";
  if (age < 60) return gender === "male" ? "👨" : "👩";
  return gender === "male" ? "👴" : "👵";
}
const pronoun = (g) => ({ subject: g === "male" ? "he" : "she", object: g === "male" ? "him" : "her", possessive: g === "male" ? "his" : "her" });

function relTitle(p) {
  const m = p.gender === "male";
  switch (p.kind) {
    case "sibling": return m ? "Brother" : "Sister";
    case "child": return m ? "Son" : "Daughter";
    case "partner": return m ? "Boyfriend" : "Girlfriend";
    case "spouse": return m ? "Husband" : "Wife";
    case "fiance": return m ? "Fiancé" : "Fiancée";
    case "pet": return p.species || "Pet";
    case "mother": return "Mother";
    case "father": return "Father";
    case "friend": return "Friend";
  }
  return p.kind;
}
const relName = (p) => (p.species ? p.firstName : `${p.firstName} ${p.lastName}`);
const relEmoji = (p) => (p.species ? petEmoji[p.species] || "🐾" : !p.isAlive ? "🪦" : avatarEmoji(p.age, p.gender));

function relStatus(p) {
  if (!p.isAlive || p.species) return null;
  if (p.bond >= 90) return p.kind === "friend" ? "Best Friend" : "Inseparable";
  if (p.bond >= 70) return "Close";
  if (p.bond >= 30) return null;
  if (p.bond >= 15) return "Strained";
  return "Estranged";
}
const yearsSinceContact = (p, playerAge) => (p.lastContact == null ? null : playerAge - p.lastContact);

function assignOccupation(p) {
  if (p.age < 18 || p.species) return;
  if (p.age >= 67) { p.occupation = "Retired"; p.salary = 0; return; }
  if (roll(p.trait === "lazy" ? 0.4 : 0.1)) { p.occupation = "Unemployed"; p.salary = 0; return; }
  const job = pick(npcOccupations);
  let pay = rnd(job[1], job[2]);
  if (p.trait === "ambitious") pay = Math.trunc(pay * 1.4);
  if (p.trait === "lazy") pay = Math.trunc(pay * 0.7);
  p.occupation = job[0];
  p.salary = idiv(pay, 100) * 100;
}

function makePerson(kind, age, opts = {}) {
  const g = opts.gender || pick(["male", "female"]);
  const p = {
    id: uid(), kind, firstName: Names.first(g), lastName: opts.lastName || Names.randomLast(), gender: g, age,
    bond: opts.bond ?? rnd(40, 90), looks: rnd(10, 100), money: rnd(0, 80000), species: null, isAlive: true,
    trait: opts.noTrait ? null : randomTrait(), occupation: null, salary: 0, lastContact: null, yearsTogether: 0,
  };
  assignOccupation(p);
  return p;
}

// MARK: - Jobs & careers

const findTemplate = (id) => jobCatalog.find((t) => t.id === id);
const tpl = (t) => ({
  requiredEducation: "none", requiredField: null, requiredMajor: null, minAge: 18, minSmarts: 0, minLooks: 0,
  partTime: false, famous: false, military: false, maxAge: 70, minHealth: 0, ...t,
});
const ladderOf = (t) => careerLadders[t.id] || [t.title];
const entryTitle = (t) => ladderOf(t)[0];
const branchOf = (t) => careerBranches[t.id] || null;
function topTitle(t) {
  const b = branchOf(t);
  if (b) return b.tracks.map((tr) => tr.titles[tr.titles.length - 1]).join(" / ");
  const l = ladderOf(t);
  return l[l.length - 1];
}
const hasCareerPath = (t) => ladderOf(t).length > 1 || !!branchOf(t);
const trackOf = (t, id) => (id && branchOf(t) ? branchOf(t).tracks.find((tr) => tr.id === id) : null);
const ladderWithTrack = (t, id) => ladderOf(t).concat(trackOf(t, id)?.titles || []);
const templateSalary = (t, level, base) => Math.trunc((base ?? t.baseSalary) * Math.pow(1.3, level));
const trackDefaults = (tr) => ({ minSmarts: 0, minHealth: 0, payMultiplier: 1, selectivity: 1, ...tr });
function trackRequirementText(tr) {
  tr = trackDefaults(tr);
  const parts = [];
  if (tr.minSmarts > 0) parts.push(`Smarts ${tr.minSmarts}%+`);
  if (tr.minHealth > 0) parts.push(`Health ${tr.minHealth}%+`);
  return parts.length ? parts.join(" · ") : "Open to everyone";
}

function requirementText(t) {
  t = tpl(t);
  const parts = [];
  if (t.requiredField) parts.push(GraduateFields[t.requiredField].degreeName);
  else if (t.requiredMajor) parts.push(`Degree in ${t.requiredMajor}`);
  else if (eduRank(t.requiredEducation) > 0) parts.push(eduLabel[t.requiredEducation]);
  if (t.minLooks > 0) parts.push("Good looks");
  if (t.minHealth > 0) parts.push("Fit & healthy");
  if (t.maxAge < 70) parts.push(`Age ${t.minAge}–${t.maxAge}`);
  if (t.famous) parts.push("Audition");
  return parts.length ? parts.join(" · ") : "No requirements";
}

const jobActionDefaults = (a) => ({
  successChance: 0.7, performance: 8, happiness: 0, fame: 0, bonus: null, karma: 0, injury: 0,
  deathRisk: 0, deathCause: "an accident at work", firedRisk: 0, prison: null, minLevel: 0, ...a,
});

// MARK: - Life

function randomStats() {
  return { happiness: rnd(60, 100), health: rnd(70, 100), smarts: rnd(5, 100), looks: rnd(5, 100) };
}

function blankLife(firstName, lastName, gender, city, country) {
  return {
    id: uid(), firstName, lastName, gender, city, country, age: 0, stats: randomStats(), money: 0, karma: 50,
    isAlive: true, causeOfDeath: null,
    education: "none", major: null, graduateDegrees: [], schoolGrades: 50, droppedOut: false, enrollment: null, studentLoans: 0,
    job: null, isRetired: false, pension: 0,
    relationships: [], assets: [],
    prisonYearsLeft: 0, criminalRecord: [],
    illnesses: [], addictions: [], hasDriversLicense: false, fame: 0, followers: 0, popularity: 50, clubs: [],
    datingPreference: null, generation: 1, counters: {},
    log: [], pendingEvents: [], popups: [],
  };
}

function newLife(first, last, gender) {
  const g = gender || pick(["male", "female"]);
  last = last && last.trim() ? last.trim() : Names.randomLast();
  first = first && first.trim() ? first.trim() : Names.first(g);
  const place = pick(Names.places);
  const L = blankLife(first, last, g, place[0], place[1]);
  const wealth = rnd(5000, 400000);
  const mother = makePerson("mother", rnd(19, 42), { gender: "female", lastName: last, bond: rnd(60, 100) });
  const father = makePerson("father", rnd(20, 48), { gender: "male", lastName: last, bond: rnd(50, 100) });
  mother.money = idiv(wealth, 2);
  father.money = idiv(wealth, 2);
  L.relationships = [mother, father];
  const siblingCount = pick([0, 0, 1, 1, 1, 2, 3]);
  for (let i = 0; i < siblingCount; i++) {
    const s = makePerson("sibling", rnd(1, Math.min(15, Math.max(1, mother.age - 18))), { lastName: last });
    s.money = 0;
    L.relationships.push(s);
  }
  let intro = `I was born a ${g} in ${place[0]}, ${place[1]}. My mother is ${relName(mother)} (${mother.age}) and my father is ${relName(father)} (${father.age}).`;
  if (siblingCount > 0) {
    const names = L.relationships.filter((p) => p.kind === "sibling").map((p) => `${relTitle(p).toLowerCase()} ${p.firstName}`);
    intro += ` I have ${names.length === 1 ? "a" : `${names.length} siblings:`} ${names.join(", ")}.`;
  }
  L.log = [{ age: 0, entries: [intro] }];
  return L;
}

// Derived values
const fullName = (L) => `${L.firstName} ${L.lastName}`;
const lifeEmoji = (L) => (L.isAlive ? avatarEmoji(L.age, L.gender) : "🪦");
const inPrison = (L) => L.prisonYearsLeft > 0;
const inGradeSchool = (L) => L.age >= 5 && L.age <= 17 && !L.droppedOut;
const netWorth = (L) => L.money + L.assets.reduce((s, a) => s + a.value - a.loan, 0) - L.studentLoans;
const preferredGender = (L) => L.datingPreference || (L.gender === "male" ? "female" : "male");
const childrenOf = (L) => L.relationships.filter((p) => p.kind === "child");
const romanticPartner = (L) => L.relationships.find((p) => p.isAlive && isRomantic(p.kind)) || null;
const count = (L, key) => L.counters[key] || 0;
const bump = (L, key, n = 1) => { L.counters[key] = (L.counters[key] || 0) + n; };
const findRel = (L, id) => L.relationships.find((p) => p.id === id) || null;

function schoolName(L) {
  if (L.enrollment) return L.enrollment.kind === "university" ? `University (${L.enrollment.major})` : GraduateFields[L.enrollment.field].schoolName;
  if (!inGradeSchool(L)) return null;
  return L.age < 12 ? "Elementary School" : "High School";
}

/// Queues a news popup shown after the year's choices (deaths, promotions, diagnoses...).
function popup(L, emoji, title, message) {
  (L.popups ||= []).push({ emoji, title, message });
}
function notify(L, emoji, title, message) {
  record(L, message);
  popup(L, emoji, title, message);
}

function record(L, text) {
  const last = L.log[L.log.length - 1];
  if (last && last.age === L.age) last.entries.push(text);
  else L.log.push({ age: L.age, entries: [text] });
}

function adjust(L, d) {
  const s = L.stats;
  s.happiness = clamp(s.happiness + (d.happiness || 0), 0, 100);
  s.health = clamp(s.health + (d.health || 0), 0, 100);
  s.smarts = clamp(s.smarts + (d.smarts || 0), 0, 100);
  s.looks = clamp(s.looks + (d.looks || 0), 0, 100);
}

function updateRel(L, id, fn) {
  const p = findRel(L, id);
  if (!p) return;
  fn(p);
  p.bond = clamp(p.bond, 0, 100);
}
function touch(L, id) { const p = findRel(L, id); if (p) p.lastContact = L.age; }

// Career helpers on a life
const jobTemplate = (L) => (L.job ? tpl(findTemplate(L.job.templateID)) : null);
const jobTrack = (L) => (L.job ? trackOf(jobTemplate(L), L.job.track) : null);
const currentLadder = (L) => (L.job ? ladderWithTrack(jobTemplate(L), L.job.track) : []);
function jobSalary(L, level) {
  if (!L.job) return 0;
  const t = jobTemplate(L);
  const pay = templateSalary(t, level, L.job.baseSalary);
  const b = branchOf(t);
  return b && level >= b.atLevel ? Math.trunc(pay * trackDefaults(jobTrack(L) || {}).payMultiplier) : pay;
}
function mustChooseTrack(L) {
  if (!L.job) return false;
  const b = branchOf(jobTemplate(L));
  return !!b && !L.job.track && L.job.level === b.atLevel - 1;
}

// MARK: - Social helpers

function socialSupport(L) {
  let total = 0, weight = 0;
  for (const p of L.relationships) {
    if (!p.isAlive) continue;
    let w = 1;
    if (isRomantic(p.kind)) w = 3;
    else if (isParent(p.kind)) w = L.age < 25 ? 2 : 1;
    else if (p.kind === "child") w = 1.5;
    else if (p.kind === "sibling") w = 0.75;
    else if (p.kind === "pet") w = 0.5;
    total += p.bond * w;
    weight += w;
  }
  if (!weight) return 0;
  return Math.trunc((total / weight) * Math.min(1, weight / 4));
}
const isLonely = (L) => L.age >= 16 && !romanticPartner(L) && !L.relationships.some((p) => p.isAlive && p.kind === "friend" && p.bond >= 50);
function bestFriend(L) {
  const f = L.relationships.filter((p) => p.isAlive && p.kind === "friend" && p.bond >= 80);
  return f.length ? f.reduce((a, b) => (b.bond > a.bond ? b : a)) : null;
}
const spouseOf = (L) => L.relationships.find((p) => p.isAlive && p.kind === "spouse") || null;
function spouseContribution(L) {
  const s = spouseOf(L);
  if (!s || s.bond < 40) return 0;
  return Math.trunc(s.salary * (s.trait === "lazy" ? 0.15 : 0.35));
}
function childExpenses(L) {
  const kids = childrenOf(L).filter((c) => c.isAlive && c.age < 18).length;
  return kids * (spouseOf(L) ? 5000 : 8000);
}
const livesWithParents = (L) => L.age < 25 && L.relationships.some((p) => isParent(p.kind) && p.isAlive && p.bond >= 40);
const inheritanceShare = (parent) => (parent.bond >= 60 ? 1 : parent.bond >= 30 ? 0.5 : 0);

// MARK: - Age up

function ageUp(L) {
  if (!L.isAlive) return;
  L.age += 1;
  L.log.push({ age: L.age, entries: [] });
  L.counters.gigsThisYear = 0;
  ageStats(L);
  progressHealth(L);
  progressSchool(L);
  progressPrison(L);
  progressCareer(L);
  progressFame(L);
  progressFinances(L);
  progressAssets(L);
  progressRelationships(L);
  progressSocial(L);
  if (!inPrison(L)) generateEvents(L);
  checkForDeath(L);
}

function ageStats(L) {
  let health = rnd(-2, 2);
  if (L.age > 45) health -= rnd(0, 3);
  if (L.age > 70) health -= rnd(1, 4);
  let looks = rnd(-2, 2);
  if (L.age > 35) looks -= rnd(0, 2);
  if (L.age >= 13 && L.age <= 16) looks += rnd(-6, 6);
  let smarts = 0;
  if (L.age < 25) smarts += rnd(0, 2);
  if (L.age > 75) smarts -= rnd(0, 2);
  // Moods drift back toward normal over time instead of spiralling.
  const settle = Math.round((60 - L.stats.happiness) * 0.2);
  adjust(L, { happiness: rnd(-4, 3) + settle, health, smarts, looks });
  if (L.stats.happiness < 15) record(L, "I've been feeling really down lately.");
}

function progressHealth(L) {
  for (const id of [...L.illnesses]) {
    const ill = Illnesses[id];
    adjust(L, { happiness: -2, health: -ill.damage });
    const heal = id === "depression" ? clamp(0.1 + (L.stats.happiness - 30) / 80, 0.05, 0.6) : ill.cure >= 0.7 ? 0.45 : 0.04;
    if (roll(heal)) {
      L.illnesses = L.illnesses.filter((x) => x !== id);
      record(L, `My ${ill.name.replace("a ", "").toLowerCase()} went away on its own.`);
    }
  }
  // Young bodies bounce back when nothing is wrong.
  if (!L.illnesses.length && L.age < 50 && L.stats.health < 90) adjust(L, { health: rnd(0, 3) });
  const sick = L.age < 5 ? 0.08 : L.age < 40 ? 0.1 : 0.1 + (L.age - 40) * 0.003;
  if (roll(sick)) {
    const id = randomIllness(L.age);
    if (!L.illnesses.includes(id)) {
      L.illnesses.push(id);
      notify(L, "🤒", "Diagnosis", `🤒 I was diagnosed with ${Illnesses[id].name}.`);
      adjust(L, { happiness: -5, health: -5 });
    }
  }
  if (L.stats.happiness < 20 && L.age >= 13 && !L.illnesses.includes("depression") && roll(0.3)) {
    L.illnesses.push("depression");
    record(L, "😞 I was diagnosed with Depression.");
  }
  for (const a of L.addictions) {
    if (a === "alcohol") { adjust(L, { health: -4, smarts: -1 }); L.money -= 1500; }
    if (a === "drugs") { adjust(L, { happiness: -3, health: -7 }); L.money -= 4000; }
    if (a === "gambling") {
      const lost = rnd(500, 8000);
      L.money -= lost;
      adjust(L, { happiness: -4 });
      record(L, `I lost ${formatMoney(lost)} feeding my gambling habit.`);
    }
    if (a === "smoking") { adjust(L, { health: -3, looks: -1 }); L.money -= 2000; }
  }
}

function progressSchool(L) {
  if (L.age === 5 && !L.droppedOut) record(L, "I started elementary school.");
  if (L.age === 12 && !L.droppedOut) record(L, "I started high school.");
  if (inGradeSchool(L)) L.schoolGrades = clamp(L.schoolGrades + idiv(L.stats.smarts - 50, 10) + rnd(-8, 8), 0, 100);
  if (L.age === 18 && !L.droppedOut && !inPrison(L)) {
    if (eduRank(L.education) < 1) L.education = "highSchool";
    notify(L, "🎓", "Graduation", `I graduated from high school with a ${gradeLetter(L.schoolGrades)} average.`);
    adjust(L, { happiness: 8 });
  }
  const e = L.enrollment;
  if (!e) return;
  e.yearsLeft -= 1;
  e.grades = clamp(e.grades + idiv(L.stats.smarts - 50, 8) + rnd(-6, 6), 0, 100);
  adjust(L, { smarts: rnd(1, 4) });
  if (e.yearsLeft > 0) return;
  L.enrollment = null;
  if (e.kind === "university") {
    if (eduRank(L.education) < 2) L.education = "bachelor";
    L.major = e.major;
    notify(L, "🎓", "Graduation", `🎓 I graduated from university with a degree in ${e.major}!`);
  } else {
    L.education = "graduate";
    if (!L.graduateDegrees.includes(e.field)) L.graduateDegrees.push(e.field);
    const f = GraduateFields[e.field];
    notify(L, "🎓", "Graduation", `🎓 I graduated from ${f.schoolName} and earned my ${f.degreeName}!`);
  }
  adjust(L, { happiness: 15 });
}

function progressPrison(L) {
  if (!inPrison(L)) return;
  L.prisonYearsLeft -= 1;
  adjust(L, { happiness: -6, health: -2 });
  if (L.prisonYearsLeft === 0) {
    notify(L, "🔓", "Released", "🔓 I was released from prison.");
    adjust(L, { happiness: 20 });
  } else {
    record(L, `I spent another year behind bars. ${plural(L.prisonYearsLeft, "year")} left.`);
  }
}

function progressCareer(L) {
  if (L.isRetired) { L.money += L.pension; return; }
  const j = L.job;
  if (!j) return;
  j.years += 1;
  j.yearsInLevel += 1;
  j.usedActions = [];
  j.performance = clamp(j.performance + rnd(-10, 8) + idiv(L.stats.smarts - 50, 15), 0, 100);
  L.money += Math.trunc(j.salary * 0.75);
  const loanPayment = Math.min(L.studentLoans, Math.trunc(j.salary * 0.1));
  if (loanPayment > 0) {
    L.studentLoans -= loanPayment;
    L.money -= loanPayment;
    if (L.studentLoans === 0) record(L, "I paid off my student loans!");
  }
  if (j.performance < 15 && roll(0.5)) {
    L.job = null;
    notify(L, "❌", "Fired", `❌ I was fired from my job as a ${j.title} at ${j.company}.`);
    adjust(L, { happiness: -15 });
    return;
  }
  const top = currentLadder(L).length - 1;
  if (mustChooseTrack(L) && j.yearsInLevel === 1 && j.performance >= 50) {
    record(L, "🔀 I've earned the right to specialize. Time to choose my path at work.");
  }
  if (j.performance > 75 && j.yearsInLevel >= 2 && j.level < top && roll(0.3)) {
    popup(L, "📈", "Promoted!", promote(L));
    return;
  }
  if (j.performance > 70 && j.years >= 2 && roll(0.25)) {
    j.salary += Math.trunc(j.salary * rndf(0.04, 0.1));
    record(L, `💵 I got a raise! My salary is now ${formatMoney(j.salary)}.`);
    adjust(L, { happiness: 6 });
  }
}

function progressFame(L) {
  if (L.job) {
    const t = jobTemplate(L);
    if (!t.military && L.age > t.maxAge) {
      record(L, `I hung up my boots as a ${L.job.title}. I'm too old to keep going.`);
      L.job = null;
    }
  }
  if (L.job && jobTemplate(L).famous) {
    const gain = idiv(L.job.performance - 40, 6) + rnd(-3, 6);
    L.fame = clamp(L.fame + gain, 0, 100);
    L.job.salary = jobSalary(L, L.job.level) + L.fame * L.fame * 250;
    if (L.fame >= 50 && roll(0.2)) record(L, "⭐ Paparazzi followed me around all week. I'm famous!");
  } else if (L.fame > 0) {
    L.fame = Math.max(0, L.fame - rnd(1, 4));
  }
  if (L.followers > 0) L.followers = Math.max(0, L.followers + Math.trunc(L.followers * rndf(-0.1, 0.05)));
  if (L.job && jobTemplate(L).military && roll(0.25)) {
    if (roll(0.06)) { die(L, "wounds suffered in combat"); return; }
    if (roll(0.3)) {
      adjust(L, { happiness: 10 });
      L.job.performance = 100;
      notify(L, "🎖️", "Medal of Honor", "🎖️ I was deployed overseas and awarded a medal for bravery.");
    } else {
      adjust(L, { happiness: -10, health: -rnd(0, 15) });
      record(L, "🪖 I was deployed overseas for a tour of duty.");
    }
  }
}

function progressFinances(L) {
  for (const a of L.assets) {
    L.money -= a.kind === "house" ? idiv(a.value, 100) : idiv(a.value, 20);
    if (a.loan > 0) {
      const payment = Math.min(a.loan, Math.max(1000, idiv(a.purchasePrice, 15)));
      a.loan -= payment;
      L.money -= payment;
      if (a.loan === 0) record(L, `I paid off the loan on my ${a.name}!`);
    }
  }
  if (L.age >= 18 && !L.enrollment && !inPrison(L) && !L.job && !L.isRetired && L.assets.length === 0 && !livesWithParents(L)) {
    L.money -= 6000;
  }
  if (L.money < -50000 && roll(0.3)) {
    record(L, `Debt collectors keep calling me about my ${formatMoney(L.money)} balance.`);
    adjust(L, { happiness: -8 });
  }
}

function progressAssets(L) {
  for (const a of L.assets) {
    a.yearsOwned += 1;
    a.value = Math.trunc(a.value * (a.kind === "house" ? rndf(0.97, 1.08) : rndf(0.82, 0.92)));
  }
}

function personDies(age, isPet) {
  if (isPet) return age > 8 && roll((age - 8) * 0.08);
  let p = 0.0005;
  if (age > 60) p += (age - 60) * 0.008;
  if (age > 85) p += (age - 85) * 0.04;
  return roll(p);
}

function progressRelationships(L) {
  for (const p of [...L.relationships]) {
    if (!p.isAlive) continue;
    p.age += 1;
    if (p.lastContact == null) p.lastContact = L.age - 1;
    let drift = rnd(-2, 1);
    if (p.kind === "pet" || (p.kind === "child" && p.age < 6) || ((isParent(p.kind) || p.kind === "sibling") && L.age < 12)) {
      drift = rnd(-1, 2);
    } else if ((yearsSinceContact(p, L.age) ?? 99) >= 2) {
      drift -= rnd(1, 4);
    }
    if (p.trait === "toxic") drift -= 2;
    p.bond = clamp(p.bond + drift, 0, 100);
    if (p.age === 18 && !p.occupation && p.kind !== "child") assignOccupation(p);
    if (p.age === 67 && p.salary > 0) { p.occupation = "Retired"; p.salary = 0; }

    if (personDies(p.age, p.kind === "pet")) {
      p.isAlive = false;
      notify(L, "🕊️", "Rest in Peace", `🕊️ My ${relTitle(p).toLowerCase()} ${p.firstName} ${p.kind === "pet" ? "passed away" : "died"} at age ${p.age}.`);
      adjust(L, { happiness: -(idiv(p.bond, 4) + 5) });
      if (isParent(p.kind) && p.money > 0) {
        const fullShare = idiv(p.money, Math.max(1, L.relationships.filter((s) => s.kind === "sibling" && s.isAlive).length + 1));
        const share = Math.trunc(fullShare * inheritanceShare(p));
        if (share === 0) notify(L, "📜", "The Will", `📜 ${p.firstName} cut me out of the will. We were never close.`);
        else {
          L.money += share;
          notify(L, "📜", "Inheritance", `📜 I inherited ${formatMoney(share)} from ${p.firstName}${share < fullShare ? ". It would have been more if we'd been closer." : "."}`);
        }
      }
      continue;
    }
    if (p.kind === "friend" && p.bond <= 5) {
      L.relationships = L.relationships.filter((x) => x.id !== p.id);
      record(L, `👋 ${p.firstName} and I drifted apart. We're not friends anymore.`);
      adjust(L, { happiness: -3 });
      continue;
    }
    if (isRomantic(p.kind) && p.bond < 15 && roll(0.4)) {
      L.relationships = L.relationships.filter((x) => x.id !== p.id);
      if (p.kind === "spouse") {
        const settlement = Math.max(0, idiv(L.money, 2));
        L.money -= settlement;
        notify(L, "💔", "Divorced", `💔 ${p.firstName} divorced me and took ${formatMoney(settlement)} in the settlement.`);
      } else notify(L, "💔", "Dumped", `💔 ${p.firstName} broke up with me.`);
      adjust(L, { happiness: -15 });
    }
  }
}

function progressSocial(L) {
  adjust(L, { happiness: clamp(idiv(socialSupport(L) - 50, 10), -3, 5) });
  if (isLonely(L) && roll(0.3)) {
    adjust(L, { happiness: -3 });
    record(L, "😔 I've been feeling lonely. I wish I had someone to talk to.");
  }
  L.money += spouseContribution(L);
  L.money -= childExpenses(L);

  const parents = L.relationships.filter((p) => isParent(p.kind) && p.isAlive);
  const giving = parents.filter((p) => p.bond >= 60 && p.money > 2000);
  if (L.age >= 6 && L.age <= 17 && giving.length && roll(0.6)) {
    const parent = pick(giving);
    const allowance = rnd(3, 12) * L.age * (parent.trait === "generous" ? 2 : 1);
    L.money += allowance;
    parent.money -= allowance;
    record(L, `💵 My ${relTitle(parent).toLowerCase()} gave me ${formatMoney(allowance)} in allowance.`);
  }
  if (L.age === 18 && parents.length && parents.every((p) => p.bond < 35) && !inPrison(L)) {
    notify(L, "🧳", "Kicked Out", "🧳 My parents kicked me out of the house. I'm on my own now.");
    adjust(L, { happiness: -12 });
  }

  for (const p of L.relationships) {
    if (p.isAlive && p.trait === "kind" && p.bond >= 60 && (L.stats.health < 50 || L.illnesses.length) && roll(0.4)) {
      adjust(L, { happiness: 4, health: 4 });
      record(L, `💗 ${p.firstName} took care of me while I was unwell.`);
      break;
    }
  }
  for (const p of L.relationships) {
    if (p.isAlive && p.trait === "toxic" && p.bond >= 20 && !p.species && roll(0.3)) {
      adjust(L, { happiness: -5 });
      record(L, `☠️ ${p.firstName} has been making my life miserable.`);
      break;
    }
  }

  const adultKids = childrenOf(L).filter((c) => c.isAlive && c.age >= 18);
  if (L.age >= 65) {
    const caring = adultKids.filter((c) => c.bond >= 65);
    if (caring.length) {
      const n = Math.min(3, caring.length);
      adjust(L, { happiness: 3 * n, health: 2 * n });
      if (roll(0.4)) {
        const kid = pick(caring);
        const gift = Math.max(500, idiv(kid.salary, 20));
        L.money += gift;
        record(L, `👪 ${kid.firstName} visited and helped me out with ${formatMoney(gift)}.`);
      }
    } else if (adultKids.length && roll(0.5)) {
      adjust(L, { happiness: -6 });
      record(L, "📭 My kids never call or visit anymore.");
    }
  }
  for (const p of L.relationships) if (p.isAlive && isRomantic(p.kind)) p.yearsTogether += 1;
  for (const kid of childrenOf(L)) {
    if (!kid.isAlive) continue;
    if (kid.age === 18) {
      if (kid.bond >= 50 && roll(0.6)) {
        record(L, `🎓 My ${relTitle(kid).toLowerCase()} ${kid.firstName} went off to college. I'm so proud.`);
        adjust(L, { happiness: 5 });
      } else record(L, `My ${relTitle(kid).toLowerCase()} ${kid.firstName} turned 18 and moved out.`);
    }
    if (kid.age === 22 && !kid.occupation) {
      assignOccupation(kid);
      if (kid.occupation && kid.occupation !== "Unemployed") record(L, `💼 My ${relTitle(kid).toLowerCase()} ${kid.firstName} got a job as a ${kid.occupation.toLowerCase()}.`);
    }
  }
}

function checkForDeath(L) {
  if (!L.isAlive) return;
  let p = 0.0003;
  if (L.age > 60) p += (L.age - 60) * 0.006;
  if (L.age > 85) p += (L.age - 85) * 0.035;
  if (L.stats.health < 25) p += (25 - L.stats.health) * 0.015;
  if (L.stats.health === 0 || roll(p)) {
    let cause;
    if (L.stats.health < 20) cause = pick(["heart failure", "cancer", "pneumonia", "a stroke", "organ failure"]);
    else if (L.age > 75) cause = pick(["old age", "old age", "a heart attack", "a stroke"]);
    else cause = pick(["a car accident", "a freak accident", "a heart attack", "a mysterious illness", "falling down the stairs"]);
    die(L, cause);
  }
}

function die(L, cause) {
  if (!L.isAlive) return;
  L.isAlive = false;
  L.causeOfDeath = cause;
  L.pendingEvents = [];
  L.popups = [];
  record(L, `☠️ I died from ${cause} at age ${L.age}.`);
}

function ribbonOf(L) {
  if (count(L, "murders") >= 3) return "notorious";
  if (L.fame >= 80) return "famous";
  if (netWorth(L) >= 10000000) return "rich";
  if (L.criminalRecord.length >= 5 || count(L, "crimes") >= 15) return "criminal";
  if (count(L, "partners") >= 10) return "casanova";
  if (childrenOf(L).length >= 4) return "family";
  if (L.education === "graduate" && L.stats.smarts >= 80) return "scholar";
  if (L.age >= 100) return "ancient";
  if (count(L, "parties") >= 20) return "partyAnimal";
  if (count(L, "gym") >= 25) return "athlete";
  if (L.karma >= 85) return "saint";
  if (L.karma <= 15) return "wicked";
  if (L.age < 18) return "shortLived";
  if (netWorth(L) < -10000) return "broke";
  return "average";
}

function summaryOf(L) {
  return {
    id: uid(), name: fullName(L), gender: L.gender, ageAtDeath: L.age, causeOfDeath: L.causeOfDeath || "unknown",
    netWorth: netWorth(L), job: L.job ? L.job.title : L.isRetired ? "Retired" : null, children: childrenOf(L).length,
    ribbon: ribbonOf(L), generation: L.generation,
  };
}

const heirsOf = (L) => childrenOf(L).filter((c) => c.isAlive);

function continueAs(L, child) {
  const next = blankLife(child.firstName, child.lastName, child.gender, L.city, L.country);
  next.age = child.age;
  next.generation = L.generation + 1;
  next.stats.looks = child.looks;
  if (child.age >= 18) next.education = "highSchool";
  if (child.age >= 5 && child.age <= 17) next.schoolGrades = rnd(40, 90);
  const heirs = heirsOf(L);
  const inheritance = idiv(Math.max(0, netWorth(L)), Math.max(1, heirs.length));
  next.money = inheritance;
  const deceased = {
    id: uid(), kind: L.gender === "male" ? "father" : "mother", firstName: L.firstName, lastName: L.lastName, gender: L.gender,
    age: L.age, bond: child.bond, looks: L.stats.looks, money: 0, species: null, isAlive: false, trait: null, occupation: null,
    salary: 0, lastContact: null, yearsTogether: 0,
  };
  next.relationships = [deceased];
  const partner = L.relationships.find((p) => p.kind === "spouse" && p.isAlive);
  if (partner) next.relationships.push({ ...partner, id: uid(), kind: partner.gender === "male" ? "father" : "mother", bond: rnd(50, 95), lastContact: null, yearsTogether: 0 });
  for (const s of heirs) if (s.id !== child.id) next.relationships.push({ ...s, id: uid(), kind: "sibling", bond: rnd(30, 90), lastContact: null });
  let intro = `I am ${child.firstName} ${child.lastName}, generation ${next.generation}. My ${L.gender === "male" ? "father" : "mother"} ${fullName(L)} died at ${L.age}.`;
  if (inheritance > 0) intro += ` I inherited ${formatMoney(inheritance)}.`;
  next.log = [{ age: child.age, entries: [intro] }];
  return next;
}
