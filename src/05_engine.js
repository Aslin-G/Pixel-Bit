/* =====================================================================
   05_engine.js — Bucle de juego, pila de escenas, cámara, partículas,
   efectos de pantalla, avisos, ajustes y guardado local.
   ===================================================================== */

const DEFAULT_SETTINGS = {
  music: 0.6, sfx: 0.8, ambience: 0.8,
  textScale: 1, dialogSpeed: 1, autoAdvance: false,
  reduceFlash: false, reduceShake: false, highContrast: false, cbPalette: false,
  noTimeLimit: false, touch: 'auto', touchScale: 1, showFps: false, subtitles: true,
  bindings: null,
};

const Game = {
  canvas: null, g: null, scenes: [], time: 0, frame: 0, dt: 1 / 60, fps: 60,
  settings: deepClone(DEFAULT_SETTINGS),
  fade: { a: 0, target: 0, speed: 2, color: '#140d26', cb: null },
  flash: { a: 0, color: '#ffffff' },
  toasts: [],
  init() {
    this.canvas = document.getElementById('game');
    this.g = this.canvas.getContext('2d', { alpha: false });
    this.g.imageSmoothingEnabled = false;
    initFonts();
    this.loadSettings();
    Input.init(this.canvas);
    Input.loadBindings(this.settings.bindings);
    this.resize();
    window.addEventListener('resize', () => this.resize());
    let last = nowMs(), acc = 0, fpsAcc = 0, fpsN = 0;
    const loop = () => {
      const t = nowMs();
      let el = (t - last) / 1000; last = t;
      if (el > 0.25) el = 0.25;
      acc += el; fpsAcc += el; fpsN++;
      if (fpsAcc > 0.5) { this.fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; }
      let steps = 0;
      while (acc >= this.dt && steps < 5) {
        this.update(this.dt);
        acc -= this.dt; steps++;
      }
      if (steps >= 5) acc = 0;
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },
  resize() {
    const ww = window.innerWidth, wh = window.innerHeight;
    let s = Math.min(ww / W, wh / H);
    if (s >= 1) { const si = Math.floor(s); if (s - si < 0.35 || si >= 3) s = si; }
    this.canvas.style.width = Math.floor(W * s) + 'px';
    this.canvas.style.height = Math.floor(H * s) + 'px';
    this.viewScale = s;
  },
  loadSettings() {
    const s = SaveManager.readRaw('aridiaNexusSettings');
    if (s) Object.assign(this.settings, s);
  },
  saveSettings() { this.settings.bindings = Input.bindings; SaveManager.writeRaw('aridiaNexusSettings', this.settings); Audio2.applyVolumes(); },
  top() { return this.scenes[this.scenes.length - 1]; },
  setScene(scene, params) {
    while (this.scenes.length) { const s = this.scenes.pop(); s.exit && s.exit(); }
    this.scenes.push(scene);
    scene.enter && scene.enter(params || {});
  },
  push(scene, params) { this.scenes.push(scene); scene.enter && scene.enter(params || {}); },
  pop() { const s = this.scenes.pop(); s && s.exit && s.exit(); const t = this.top(); t && t.resume && t.resume(); return s; },
  /** Transición con fundido */
  transition(fn, color = '#140d26', speed = 2.5) {
    if (this.fade.busy) return;
    this.fade.busy = true; this.fade.color = color; this.fade.speed = speed; this.fade.target = 1;
    this.fade.cb = () => { fn(); this.fade.target = 0; this.fade.cb = null; setTimeout(() => { this.fade.busy = false; }, 50); };
  },
  doFlash(color = '#ffffff', a = 0.8) { if (this.settings.reduceFlash) a *= 0.25; this.flash.color = color; this.flash.a = a; },
  toast(text, icon = 'info', color = '#56e5ff', dur = 3.2) {
    this.toasts.push({ text, icon, color, t: 0, dur });
    if (this.toasts.length > 4) this.toasts.shift();
    announce(stripMarkup(text));
  },
  update(dt) {
    this.time += dt; this.frame++;
    Input.pollGamepad();
    if (Input.keyPressed('F9') || (Input.down('fast') && Input.keyPressed('KeyT') && Input.down('reset'))) { /* atajo docente gestionado por escenas */ }
    const top = this.top();
    if (top) {
      // escenas inferiores que piden actualizarse en segundo plano
      for (let i = 0; i < this.scenes.length - 1; i++) { const s = this.scenes[i]; if (s.updateBelow) s.updateBelow(dt); }
      if (!this.fade.busy || this.fade.target === 0) top.update(dt);
    }
    // fundido
    const f = this.fade;
    if (f.a !== f.target) {
      f.a = approach(f.a, f.target, f.speed * dt);
      if (f.a >= 1 && f.cb) f.cb();
    }
    this.flash.a = Math.max(0, this.flash.a - dt * 2.5);
    for (const t of this.toasts) t.t += dt;
    this.toasts = this.toasts.filter(t => t.t < t.dur);
    Audio2.updateAmbience(dt);
    Input.endStep();
  },
  render() {
    const g = this.g;
    g.imageSmoothingEnabled = false;
    g.setTransform(1, 0, 0, 1, 0, 0);
    // escenas: se dibujan desde la más baja opaca
    let start = 0;
    for (let i = this.scenes.length - 1; i >= 0; i--) { if (!this.scenes[i].overlay) { start = i; break; } }
    for (let i = start; i < this.scenes.length; i++) { g.save(); this.scenes[i].render(g); g.restore(); }
    Touch.render(g);
    this.renderToasts(g);
    if (this.flash.a > 0) { g.globalAlpha = this.flash.a; frect(g, 0, 0, W, H, this.flash.color); g.globalAlpha = 1; }
    if (this.fade.a > 0) {
      // fundido tramado (pixel art) en lugar de transparencia suave
      fdither(g, 0, 0, W, H, this.fade.color, this.fade.a);
    }
    if (this.settings.showFps) drawText(g, fmt0(this.fps) + ' FPS', 4, H - 10, { font: 'tiny', color: '#86e36f', shadow: '#140d26' });
  },
  renderToasts(g) {
    let y = 34;
    for (const t of this.toasts) {
      const a = t.t < 0.25 ? t.t / 0.25 : t.t > t.dur - 0.4 ? (t.dur - t.t) / 0.4 : 1;
      const w = Math.min(300, FONTS.main.measure(t.text) + 34);
      const x = Math.round(W - w - 8 + (1 - a) * 24);
      const yy = y;
      UIK.panel(g, x, yy, w, 18, 'toast', t.color);
      Icons.draw(g, t.icon, x + 5, yy + 2);
      drawText(g, t.text, x + 25, yy + 5, { color: '#fffaf0', shadow: '#140d26' });
      y += 22;
    }
  },
};

/* ---------- Anuncios para lectores de pantalla ---------- */
let _srLast = '';
function announce(text) {
  const el = typeof document !== 'undefined' && document.getElementById('sr');
  if (el && text !== _srLast) { el.textContent = text; _srLast = text; }
}

/* ---------- Cámara ---------- */
class Camera {
  constructor() { this.x = 0; this.y = 0; this.tx = 0; this.ty = 0; this.shakeT = 0; this.shakeA = 0; this.bounds = { x: 0, y: 0, w: W, h: H }; this.lookAhead = 0; this.zoom = 1; }
  follow(e, dt, opts = {}) {
    const dir = e.facing || 1;
    this.lookAhead = approach(this.lookAhead, dir * (opts.look ?? 40), dt * 60);
    this.tx = e.x - W / 2 + this.lookAhead;
    this.ty = e.y - H * (opts.vy ?? 0.62);
    const k = 1 - Math.pow(0.0008, dt);
    this.x += (this.tx - this.x) * k;
    this.y += (this.ty - this.y) * k * 0.8;
    this.clamp();
  }
  snap(e) { this.x = e.x - W / 2; this.y = e.y - H * 0.62; this.clamp(); }
  clamp() {
    const b = this.bounds;
    this.x = clamp(this.x, b.x, Math.max(b.x, b.x + b.w - W));
    this.y = clamp(this.y, b.y, Math.max(b.y, b.y + b.h - H));
  }
  shake(a, t = 0.3) { if (Game.settings.reduceShake) a *= 0.2; this.shakeA = Math.max(this.shakeA, a); this.shakeT = Math.max(this.shakeT, t); }
  update(dt) { if (this.shakeT > 0) { this.shakeT -= dt; if (this.shakeT <= 0) this.shakeA = 0; } }
  get ox() { return Math.round(this.x + (this.shakeT > 0 ? (Math.random() * 2 - 1) * this.shakeA : 0)); }
  get oy() { return Math.round(this.y + (this.shakeT > 0 ? (Math.random() * 2 - 1) * this.shakeA : 0)); }
}

/* ---------- Partículas (pool) ---------- */
const PTYPES = {
  sand: { cols: ['#f8d677', '#e49c44', '#fde8a8', '#c97c38'], g: 20, drag: 0.4, life: [1.5, 3.5], wind: 1, size: 1 },
  dust: { cols: ['#ecbf6e', '#d38a3e', '#f4d896', '#ba6c30'], g: 0, drag: 0.2, life: [2, 5], wind: 1.2, size: 1 },
  drop: { cols: ['#56e5ff', '#a6f4ff', '#20d6c7'], g: 300, drag: 0.1, life: [0.4, 1.2], wind: 0.2, size: 1 },
  splash: { cols: ['#c6fff2', '#6cf0db', '#ffffff'], g: 260, drag: 0.5, life: [0.3, 0.7], wind: 0, size: 1 },
  salt: { cols: ['#fff2f8', '#ffd8ec', '#ffffff', '#fbb0da'], g: 30, drag: 0.6, life: [1, 2.5], wind: 0.5, size: 1, sparkle: true },
  vapor: { cols: ['#e6fdff', '#c4fbff', '#ffffff'], g: -18, drag: 0.8, life: [1, 2.2], wind: 0.4, size: 2, fade: true },
  leaf: { cols: ['#86e36f', '#4ccb70', '#c2f58e', '#33a552'], g: 14, drag: 1.2, life: [3, 6], wind: 1.4, size: 1, flutter: true },
  petal: { cols: ['#f78acb', '#ffe14d', '#fbb0da'], g: 10, drag: 1.4, life: [3, 6], wind: 1.2, size: 1, flutter: true },
  spark: { cols: ['#ffe14d', '#fff08a', '#ffffff', '#ffb83e'], g: 0, drag: 2, life: [0.2, 0.6], wind: 0, size: 1, glow: true },
  energy: { cols: ['#56e5ff', '#a6f4ff', '#ffffff'], g: 0, drag: 1.5, life: [0.4, 1], wind: 0, size: 1, glow: true },
  windline: { cols: ['#ffffff', '#e6fdff', '#cfe8ee'], g: 0, drag: 0, life: [0.6, 1.2], wind: 0, size: 1, streak: true },
  bubble: { cols: ['#8cf4ec', '#d8fff8', '#40d0d4'], g: -40, drag: 1, life: [0.8, 1.8], wind: 0.1, size: 1, wobble: true },
  h2: { cols: ['#d8fff8', '#8cf4ec', '#ffffff'], g: -60, drag: 0.8, life: [0.8, 1.6], wind: 0.2, size: 2, wobble: true, ring: true },
  o2: { cols: ['#ffd0d6', '#ff9a8a', '#ffffff'], g: -50, drag: 0.8, life: [0.8, 1.6], wind: 0.2, size: 1, wobble: true },
  glitch: { cols: ['#e050c8', '#56e5ff', '#ffffff', '#8d6bff'], g: 0, drag: 3, life: [0.2, 0.6], wind: 0, size: 2, glow: true },
  crystal: { cols: ['#c4fbff', '#7ee8f0', '#ffffff', '#b49cff'], g: 0, drag: 1.2, life: [0.8, 1.8], wind: 0, size: 1, sparkle: true },
  firefly: { cols: ['#fff08a', '#ffe14d', '#c2f58e'], g: 0, drag: 0.6, life: [3, 6], wind: 0.2, size: 1, glow: true, wander: true },
  confetti: { cols: ['#ff6b6b', '#ffe14d', '#56e5ff', '#86e36f', '#f78acb', '#8d6bff', '#ff9f43'], g: 60, drag: 1.5, life: [2, 4], wind: 0.6, size: 2, flutter: true },
  smoke: { cols: ['#8a6a5c', '#a88878', '#6a4c48'], g: -12, drag: 0.9, life: [1.5, 3], wind: 0.8, size: 2, fade: true },
  rain: { cols: ['#a6e0f4', '#7ccaf4'], g: 500, drag: 0, life: [0.5, 1], wind: 0.6, size: 1, streak: true },
  brine: { cols: ['#e05aa0', '#f888b8', '#bc3e92'], g: 200, drag: 0.3, life: [0.4, 1], wind: 0, size: 1 },
  data: { cols: ['#8d6bff', '#b49cff', '#56e5ff', '#e6fdff'], g: 0, drag: 0.5, life: [1, 2], wind: 0, size: 1, glow: true, glyph: true },
};
class Particles {
  constructor(max = 1500) {
    this.max = max; this.n = 0;
    this.x = new Float32Array(max); this.y = new Float32Array(max); this.vx = new Float32Array(max); this.vy = new Float32Array(max);
    this.life = new Float32Array(max); this.maxLife = new Float32Array(max); this.type = new Array(max); this.col = new Array(max); this.seed = new Float32Array(max);
    this.wind = 0; this.windY = 0;
  }
  emit(type, x, y, vx = 0, vy = 0, n = 1, spread = 0) {
    const T = PTYPES[type]; if (!T) return;
    for (let k = 0; k < n; k++) {
      if (this.n >= this.max) return;
      const i = this.n++;
      this.x[i] = x + (spread ? (Math.random() * 2 - 1) * spread : 0); this.y[i] = y + (spread ? (Math.random() * 2 - 1) * spread * 0.5 : 0);
      this.vx[i] = vx + (Math.random() * 2 - 1) * Math.abs(vx * 0.3 + 10) * (spread ? 1 : 0.3);
      this.vy[i] = vy + (Math.random() * 2 - 1) * Math.abs(vy * 0.3 + 10) * (spread ? 1 : 0.3);
      const l = lerp(T.life[0], T.life[1], Math.random());
      this.life[i] = l; this.maxLife[i] = l; this.type[i] = type; this.col[i] = T.cols[(Math.random() * T.cols.length) | 0]; this.seed[i] = Math.random() * 100;
    }
  }
  update(dt) {
    let j = 0;
    for (let i = 0; i < this.n; i++) {
      const T = PTYPES[this.type[i]];
      this.life[i] -= dt;
      if (this.life[i] <= 0) continue;
      let vx = this.vx[i], vy = this.vy[i];
      vy += T.g * dt;
      vx += (this.wind * T.wind - vx * T.drag) * dt * (T.drag > 0 ? 1 : 0);
      if (T.drag === 0) vx += this.wind * T.wind * dt;
      if (T.flutter) vx += Math.sin(Game.time * 4 + this.seed[i]) * 20 * dt, vy += Math.cos(Game.time * 3 + this.seed[i]) * 10 * dt;
      if (T.wobble) vx += Math.sin(Game.time * 9 + this.seed[i]) * 30 * dt;
      if (T.wander) { vx += Math.sin(Game.time * 1.3 + this.seed[i]) * 12 * dt; vy += Math.cos(Game.time * 1.1 + this.seed[i] * 2) * 12 * dt; }
      this.x[j] = this.x[i] + vx * dt; this.y[j] = this.y[i] + vy * dt; this.vx[j] = vx; this.vy[j] = vy;
      this.life[j] = this.life[i]; this.maxLife[j] = this.maxLife[i]; this.type[j] = this.type[i]; this.col[j] = this.col[i]; this.seed[j] = this.seed[i];
      j++;
    }
    this.n = j;
  }
  render(g, ox = 0, oy = 0) {
    for (let i = 0; i < this.n; i++) {
      const T = PTYPES[this.type[i]];
      const x = Math.round(this.x[i] - ox), y = Math.round(this.y[i] - oy);
      if (x < -4 || y < -4 || x > W + 4 || y > H + 4) continue;
      const lf = this.life[i] / this.maxLife[i];
      if (T.fade && lf < 0.4 && ((x + y + (Game.frame >> 2)) & 1)) continue;
      if (T.sparkle && ((Game.frame + (this.seed[i] * 10 | 0)) % 20 < 3)) { g.fillStyle = '#ffffff'; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); continue; }
      g.fillStyle = this.col[i];
      if (T.streak) { const len = Math.min(8, Math.max(2, Math.abs(this.vx[i]) * 0.04 + Math.abs(this.vy[i]) * 0.02)); if (Math.abs(this.vy[i]) > Math.abs(this.vx[i])) g.fillRect(x, y, 1, len | 0); else g.fillRect(x, y, len | 0, 1); continue; }
      if (T.ring) { g.fillRect(x - 1, y, 1, 1); g.fillRect(x + 1, y, 1, 1); g.fillRect(x, y - 1, 1, 1); g.fillRect(x, y + 1, 1, 1); continue; }
      const s = T.size * (lf < 0.3 && T.size > 1 ? 0.5 : 1);
      const ss = Math.max(1, Math.round(s));
      g.fillRect(x, y, ss, ss);
      if (T.glow && lf > 0.5) { g.globalAlpha = 0.35; g.fillRect(x - 1, y, ss + 2, ss); g.fillRect(x, y - 1, ss, ss + 2); g.globalAlpha = 1; }
    }
  }
  clear() { this.n = 0; }
}

/* ---------- Guardado ---------- */
const SAVE_KEY = 'aridiaNexusSave';
const SAVE_VERSION = 3;
const SaveManager = {
  readRaw(key) { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : null; } catch (e) { return null; } },
  writeRaw(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); return true; } catch (e) { return false; } },
  exists() { return !!this.readRaw(SAVE_KEY); },
  load() { const s = this.readRaw(SAVE_KEY); if (!s || s.version > SAVE_VERSION) return null; return s; },
  save(state) { state.version = SAVE_VERSION; state.timestamp = Date.now(); return this.writeRaw(SAVE_KEY, state); },
  wipe() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } },
};

/* ---------- Temporizadores simples ---------- */
class Timers {
  constructor() { this.list = []; }
  after(t, fn) { this.list.push({ t, fn }); }
  update(dt) { for (const it of this.list) { it.t -= dt; if (it.t <= 0 && !it.done) { it.done = true; it.fn(); } } this.list = this.list.filter(i => !i.done); }
  clear() { this.list.length = 0; }
}

/* ---------- descarga local de archivos (exportar) ---------- */
function downloadText(filename, text, mime = 'text/plain') {
  try {
    const blob = new Blob([text], { type: mime + ';charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  } catch (e) { Game.toast('No se pudo exportar el archivo', 'warn', '#ff4e5d'); }
}
