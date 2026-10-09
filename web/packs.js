// LifeSim expansion packs: shared helpers and the yearly hook.
// Each pack lives in its own file: business.js (Boss Mode), royalty.js, crime.js (Organized Crime),
// zoo.js (Pets & Zoo), fame.js and prison.js. God Mode and the Time Machine live in godmode.js.
"use strict";

// MARK: - Naming (children, pets, businesses, zoos)

/// Queues a "name it" prompt for something new in your life.
function requestName(L, target, id) {
  L.toName = L.toName || [];
  if (!L.toName.some((t) => t.target === target && t.id === id)) L.toName.push({ target, id });
}

function nameTargetLabel(L, item) {
  if (item.target === "rel") {
    const p = findRel(L, item.id);
    if (!p) return null;
    if (p.species) return { title: `Name your ${p.species.toLowerCase()}`, current: p.firstName, emoji: relEmoji(p) };
    return { title: p.age === 0 ? `Name your baby ${p.gender === "male" ? "boy" : "girl"}` : `Name your new ${relTitle(p).toLowerCase()}`, current: p.firstName, emoji: relEmoji(p) };
  }
  if (item.target === "business") { const b = (L.businesses || []).find((x) => x.id === item.id); return b ? { title: "Name your business", current: b.name, emoji: industryOf(b).emoji } : null; }
  if (item.target === "zoo") return L.zoo ? { title: "Name your zoo", current: L.zoo.name, emoji: "🦒" } : null;
  return null;
}

/// Renames something and updates this year's story so it uses the new name.
function applyName(L, item, name) {
  name = String(name || "").trim().slice(0, 40);
  if (!name) return;
  let old = null;
  if (item.target === "rel") { const p = findRel(L, item.id); if (p) { old = p.firstName; p.firstName = name; } }
  if (item.target === "business") { const b = (L.businesses || []).find((x) => x.id === item.id); if (b) { old = b.name; b.name = name; } }
  if (item.target === "zoo" && L.zoo) { old = L.zoo.name; L.zoo.name = name; }
  if (!old || old === name) return;
  const swap = (s) => s.split(old).join(name);
  for (const y of L.log.slice(-2)) y.entries = y.entries.map(swap);
  for (const p of L.popups || []) p.message = swap(p.message);
  return swap;
}

function randomNameFor(L, item) {
  if (item.target === "rel") { const p = findRel(L, item.id); if (p) return p.species ? pick(Names.petNames) : Names.first(p.gender); }
  if (item.target === "business") {
    const b = (L.businesses || []).find((x) => x.id === item.id);
    if (b) return `${pick(["Harbor", "Northside", "Golden Hour", "Blue Door", "Second Street", "Oak & Iron", "Brightline", "Summit", "Copper", "Fieldstone"])} ${industryOf(b).short}`;
  }
  if (item.target === "zoo") return `${pick([L.city, "Riverbend", "Greenhill", "Lakeshore", "Sunvalley"])} ${pick(["Zoo", "Wildlife Park", "Zoological Gardens"])}`;
  return "";
}

// MARK: - Once-a-year limits

function usedThisYear(L, key) {
  L.packUsed = L.packUsed || {};
  return L.packUsed[key] === L.age;
}
function markUsed(L, key) {
  L.packUsed = L.packUsed || {};
  L.packUsed[key] = L.age;
}

/// Queues a decision card owned by a pack. Pack events are never picked at random.
function packEvent(L, kind, data, message, options) {
  L.pendingEvents.push(ev(kind, data, SIMPLE_EVENTS[kind].title, message, options));
}
/// Registers pack decision cards (min age 999 keeps them out of the random pool).
function packEvents(defs) {
  for (const [kind, d] of Object.entries(defs)) SIMPLE_EVENTS[kind] = { min: 999, max: 0, options: [], ...d };
}

// MARK: - Yearly hook

function progressPacks(L) {
  const steps = [progressBusinesses, progressRoyalty, progressMob, progressPets, progressZoo, progressCelebrity, progressPrisonLife];
  for (const step of steps) {
    if (!L.isAlive) return;
    step(L);
  }
}
