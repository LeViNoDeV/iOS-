// LifeSim web UI: the appearance editor, used when creating a character, at the salon
// (Profile tab) and in God Mode.
"use strict";

const swatch = (color, pressed, label, fn) => `<button class="swatch" style="background:${color}" aria-pressed="${pressed}" aria-label="${esc(label)}" title="${esc(label)}" data-h="${h(fn)}"></button>`;
const chip = (label, pressed, fn, sub) => `<button class="btn small" aria-pressed="${pressed}" data-h="${h(fn)}">${esc(label)}${sub ? ` <span class="odds">${esc(sub)}</span>` : ""}</button>`;
const lookGroup = (label, inner) => `<div class="look-group"><div class="look-label">${esc(label)}</div>${inner}</div>`;

function describeLook(look) {
  const hairName = look.hair === "bald" ? "Bald" : `${HairColors[look.hairColor][0]} ${look.texture === "curly" ? "curly" : "straight"} hair, ${HairStyles[look.hair].name.toLowerCase()}`;
  const parts = [`Skin tone ${look.skin + 1} of ${SkinTones.length}`, `${EyeColors[look.eyes][0]} eyes`, hairName];
  if (look.facial && look.facial !== "none") parts.push(FacialHair[look.facial]);
  if ((look.acc || []).length) parts.push(look.acc.map((a) => Accessories[a].name).join(", "));
  return parts.join(" · ");
}

/// The editor. `mode` is "create", "salon" or "god"; `set` receives the updated look.
function renderLookEditor(look, gender, mode, set) {
  const genetic = mode !== "salon";
  const upd = (patch) => () => set({ ...look, ...patch });
  let html = "";
  if (genetic) {
    html += lookGroup("Skin tone", `<div class="swatches">${SkinTones.map((c, i) => swatch(c, look.skin === i, `Skin tone ${i + 1}`, upd({ skin: i }))).join("")}</div>`);
    html += lookGroup("Eyes", `<div class="swatches">${Object.entries(EyeColors).map(([k, [n, c]]) => swatch(c, look.eyes === k, n, upd({ eyes: k }))).join("")}</div>`);
    html += lookGroup("Natural hair color", `<div class="swatches">${NaturalHair.map((k) => swatch(HairColors[k][1], look.natural === k, HairColors[k][0], upd({ natural: k, hairColor: look.hairColor === look.natural ? k : look.hairColor }))).join("")}</div>`);
  }
  if (mode !== "create") {
    html += lookGroup(mode === "salon" ? "Hair color (dye)" : "Dyed hair color", `<div class="swatches">${swatch(HairColors[look.natural][1], look.hairColor === look.natural, `Natural (${HairColors[look.natural][0]})`, upd({ hairColor: look.natural }))}<span class="swatch-sep"></span>${Object.keys(HairColors).filter((k) => k !== look.natural).map((k) => swatch(HairColors[k][1], look.hairColor === k, HairColors[k][0], upd({ hairColor: k }))).join("")}</div>`);
  }
  const styleBtns = Object.entries(HairStyles).map(([id, st]) => {
    const preview = avatarSvg({ ...look, hair: id, acc: [], facial: "none" }, 30, { bg: "#eef1f6" });
    const texture = st.texture && genetic ? st.texture : look.texture;
    return `<button class="style-pick" aria-pressed="${look.hair === id}" title="${esc(st.name)}" data-h="${h(upd({ hair: id, texture }))}">${preview}<span>${esc(st.name)}</span></button>`;
  }).join("");
  html += lookGroup("Hairstyle", `<div class="style-grid">${styleBtns}</div>`);
  html += lookGroup("Facial hair", `<div class="seg wrap">${Object.entries(FacialHair).map(([k, n]) => chip(n, (look.facial || "none") === k, upd({ facial: k }))).join("")}</div>`);
  html += lookGroup("Accessories", `<div class="seg wrap">${Object.entries(Accessories).map(([k, a]) => chip(`${a.emoji} ${a.name}`, (look.acc || []).includes(k), () => set(toggleAccessory(look, k)), mode === "salon" ? formatMoney(a.price) : null)).join("")}</div>`);
  html += lookGroup("Outfit", `<div class="swatches">${Outfits.map((c, i) => swatch(c, look.outfit === i, `Outfit ${i + 1}`, upd({ outfit: i }))).join("")}</div>`);
  return `<div class="look-editor">${html}</div>`;
}

const lookPreviews = (look, ages) => `<div class="look-previews">${ages.map(([age, label]) => `<figure>${avatarSvg(look, age, { bg: "#dfe8ff" })}<figcaption>${esc(label)}</figcaption></figure>`).join("")}</div>`;

// MARK: Character creation

function formLook() {
  ui.form.look ||= randomLook(ui.form.gender, 30);
  return ui.form.look;
}

function renderCreateLook() {
  const look = formLook();
  const set = (nl) => { readForm(); ui.form.look = nl; render(); };
  return `<div class="sec"><div class="sec-title"><span>Appearance</span><button class="btn small" data-h="${h(() => { readForm(); ui.form.look = randomLook(ui.form.gender, 30); render(); })}">🎲 Randomize</button></div>
    <div class="list pad">${lookPreviews(look, [[1, "Baby"], [8, "Child"], [30, "Adult"], [72, "Elderly"]])}
    <p class="muted small" style="margin:6px 0 10px">Your parents will share your skin tone, eyes and hair. Accessories and facial hair show up once you're old enough.</p>
    ${renderLookEditor(look, ui.form.gender, "create", set)}</div></div>`;
}

/// Gives a custom character the chosen look, with parents and siblings to match.
function applyChosenLook(L, look) {
  L.look = { ...look, acc: [...(look.acc || [])] };
  const [momLook, dadLook] = parentsFor(look);
  for (const p of L.relationships) {
    if (p.kind === "mother") p.look = momLook;
    if (p.kind === "father") p.look = dadLook;
  }
  for (const p of L.relationships) if (p.kind === "sibling") p.look = inheritLook(momLook, dadLook, p.gender, p.age);
}

// MARK: Salon and God Mode

function renderLookView(L, view) {
  if (view.mode === "god") {
    const target = view.id ? findRel(L, view.id) : L;
    if (!target) return `<div class="pad muted">They're no longer in your life.</div>`;
    const look = ensureLook(target, target.gender, target.age);
    const set = (nl) => { target.look = nl; save(); render(); };
    return `<div class="hero-person"><div class="big">${view.id ? personAvatar(target) : playerAvatar(L)}</div><h3>${esc(view.id ? relName(target) : fullName(L))}</h3><div class="muted">⚡ God Mode: change anything, for free</div></div>`
      + lookPreviews(look, [[8, "Child"], [30, "Adult"], [72, "Elderly"]])
      + section("Appearance", `<div class="pad">${renderLookEditor(look, target.gender, "god", set)}</div>`, view.id ? null : "Your future children inherit your genes (skin, eyes, hair texture and natural color), not your styling.");
  }
  const current = ensureLook(L, L.gender, L.age);
  view.draft ||= { ...current, acc: [...(current.acc || [])] };
  const d = view.draft;
  const set = (nl) => { view.draft = nl; render(); };
  const cost = L.age < 18 ? 0 : lookCost(current, d);
  const changes = describeLookChange(current, d);
  let html = `<div class="look-previews salon"><figure>${avatarSvg(current, L.age, { bg: "#eceff3" })}<figcaption>Now</figcaption></figure><span class="arrow">→</span><figure>${avatarSvg(d, L.age, { bg: "#dfe8ff" })}<figcaption>New look</figcaption></figure></div>`;
  html += section("Salon & shopping", `<div class="pad">${renderLookEditor(d, L.gender, "salon", set)}</div>`,
    `Haircut $60 · dye $120 · back to natural $60 · new outfit $100 · facial hair is free. ${L.age < 18 ? "Your parents are paying." : ""}`);
  html += `<div class="pad look-save">${changes.length ? `<div class="muted small">${esc(changes.join(", "))}</div>` : ""}
    <button class="btn primary" ${changes.length ? "" : "disabled"} data-h="${h(() => { const draft = view.draft; ui.stack.pop(); act((x) => changeLook(x, draft)); })}">${changes.length ? `Save my new look${cost ? ` · ${formatMoney(cost)}` : ""}` : "No changes yet"}</button>
    ${changes.length ? `<button class="btn" data-h="${h(() => { view.draft = null; render(); })}">Start over</button>` : ""}</div>`;
  return html;
}
