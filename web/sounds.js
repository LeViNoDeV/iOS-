// LifeSim sound effects, synthesized with the Web Audio API (no audio files to load).
// Muting is a setting (store.settings.sound); the M key toggles it.
"use strict";

const Sfx = {
  ctx: null,
  master: null,
  lastAt: {},

  on() { return typeof store === "undefined" || store.settings.sound !== false; },

  audio() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  },

  /// One note: frequency (Hz), start offset and length (seconds), waveform, volume, optional pitch slide.
  tone(freq, at = 0, dur = 0.12, type = "sine", vol = 0.5, slideTo = null) {
    const ctx = this.audio();
    if (!ctx) return;
    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  },

  noise(at = 0, dur = 0.2, vol = 0.25, from = 1800, to = 300) {
    const ctx = this.audio();
    if (!ctx) return;
    const t = ctx.currentTime + at;
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(from, t);
    filter.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(g).connect(this.master);
    src.start(t);
  },

  /// Plays a named sound, skipping repeats within a few milliseconds.
  play(name) {
    if (!this.on() || !Sounds[name]) return;
    const now = performance.now();
    if (now - (this.lastAt[name] || 0) < 40) return;
    this.lastAt[name] = now;
    try { Sounds[name](this); } catch (e) { /* audio unavailable */ }
  },
};

const Sounds = {
  click: (s) => s.tone(1100, 0, 0.035, "triangle", 0.18),
  open: (s) => { s.tone(520, 0, 0.07, "triangle", 0.22); s.tone(780, 0.05, 0.08, "triangle", 0.2); },
  back: (s) => { s.tone(700, 0, 0.06, "triangle", 0.2); s.tone(470, 0.05, 0.07, "triangle", 0.18); },
  age: (s) => { s.noise(0, 0.25, 0.12, 600, 3000); [523, 659, 784].forEach((f, i) => s.tone(f, 0.05 + i * 0.07, 0.22, "sine", 0.32)); },
  good: (s) => { [659, 880].forEach((f, i) => s.tone(f, i * 0.08, 0.18, "triangle", 0.3)); },
  great: (s) => { [523, 659, 784, 1047].forEach((f, i) => s.tone(f, i * 0.09, 0.26, "triangle", 0.32)); s.tone(1568, 0.38, 0.35, "sine", 0.18); },
  bad: (s) => { s.tone(392, 0, 0.18, "sawtooth", 0.14, 330); s.tone(294, 0.15, 0.28, "sawtooth", 0.12, 220); },
  money: (s) => { s.tone(988, 0, 0.08, "square", 0.12); s.tone(1319, 0.07, 0.22, "square", 0.12); },
  lose: (s) => { s.tone(330, 0, 0.12, "square", 0.08, 260); s.tone(220, 0.1, 0.2, "square", 0.08, 165); },
  event: (s) => { s.tone(880, 0, 0.09, "sine", 0.3); s.tone(1175, 0.09, 0.16, "sine", 0.28); },
  news: (s) => s.tone(740, 0, 0.14, "sine", 0.25),
  love: (s) => { [587, 740, 880].forEach((f, i) => s.tone(f, i * 0.1, 0.3, "sine", 0.25)); },
  baby: (s) => { [1047, 1319, 1568, 1319].forEach((f, i) => s.tone(f, i * 0.08, 0.14, "sine", 0.22)); },
  siren: (s) => { for (let i = 0; i < 3; i++) { s.tone(700, i * 0.3, 0.15, "square", 0.07, 1000); s.tone(1000, i * 0.3 + 0.15, 0.15, "square", 0.07, 700); } },
  death: (s) => { [392, 349, 311, 262].forEach((f, i) => s.tone(f, i * 0.28, 0.5, "sine", 0.3)); },
  hit: (s) => s.tone(1320, 0, 0.07, "triangle", 0.25),
  miss: (s) => s.tone(180, 0, 0.12, "square", 0.1),
  tick: (s) => s.tone(1800, 0, 0.02, "square", 0.05),
};

/// Picks a sound for the result of an action or choice.
function soundForOutcome(o) {
  if (!o) return null;
  if (o.dead) return "death";
  const m = `${o.title || ""} ${o.message || ""}`;
  if (/sentenced|arrested|Busted|police|raided|fined|FBI/i.test(m)) return "siren";
  if (/baby|gave birth|It's a (Boy|Girl)/i.test(m)) return "baby";
  if (/died|passed away|Rest in Peace|foreclos|bankrupt|fired|laid off|dumped|broke up/i.test(m)) return "bad";
  if (/promoted|hired|passed|won |Best in Show|crowned|accepted|IPO|went public|jackpot|VIRAL/i.test(m)) return "great";
  if (/married|started dating|said yes|in love|❤️|💒/i.test(m)) return "love";
  const ds = o.deltas || [];
  const money = ds.find((d) => d.text.startsWith("💵"));
  const ups = ds.filter((d) => d.good).length, downs = ds.filter((d) => !d.good).length;
  if (money && money.good && ups >= downs) return "money";
  if (downs > ups) return money && !money.good && downs === 1 ? "lose" : "bad";
  if (ups) return "good";
  return "news";
}
