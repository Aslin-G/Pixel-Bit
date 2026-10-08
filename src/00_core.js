'use strict';
/* =====================================================================
   ARIDIA NEXUS — 00_core.js
   Utilidades generales: matemáticas, RNG con semilla, ruido, colores y
   paleta maestra en rampas con desplazamiento de tono (hue-shifting).
   ===================================================================== */

const W = 640, H = 360;           // resolución lógica
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const invLerp = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));
const smooth = (t) => t * t * (3 - 2 * t);
const easeOut = (t) => 1 - (1 - t) * (1 - t);
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const sign = (v) => (v < 0 ? -1 : v > 0 ? 1 : 0);
const approach = (v, target, d) => (v < target ? Math.min(v + d, target) : Math.max(v - d, target));
const round = Math.round, floor = Math.floor;
const fmt = (v, d = 1) => {
  if (!isFinite(v)) return '—';
  const s = v.toFixed(d);
  return s.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};
const fmt0 = (v) => fmt(v, 0);
const pct = (v, d = 0) => fmt(v * 100, d) + ' %';

/* ---------- RNG determinista (mulberry32) ---------- */
function RNG(seed) {
  let a = (seed >>> 0) || 0x9e3779b9;
  const r = function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.range = (lo, hi) => lo + (hi - lo) * r();
  r.int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  r.chance = (p) => r() < p;
  r.shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; };
  return r;
}
const rng = RNG(20260101);

/* ---------- hash y ruido de valor ---------- */
function hash2(x, y, s = 0) {
  let h = (x | 0) * 374761393 + (y | 0) * 668265263 + (s | 0) * 1442695041;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
}
function hash1(x, s = 0) { return hash2(x, 0x5bd1e995, s); }
function vnoise(x, y, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
function fbm(x, y, oct = 4, s = 0) {
  let amp = 0.5, f = 1, sum = 0, norm = 0;
  for (let i = 0; i < oct; i++) { sum += amp * vnoise(x * f, y * f, s + i * 17); norm += amp; amp *= 0.5; f *= 2.03; }
  return sum / norm;
}
function noise1(x, s = 0) {
  const xi = Math.floor(x), xf = x - xi; const u = xf * xf * (3 - 2 * xf);
  return lerp(hash1(xi, s), hash1(xi + 1, s), u);
}
function fbm1(x, oct = 4, s = 0) {
  let amp = 0.5, f = 1, sum = 0, norm = 0;
  for (let i = 0; i < oct; i++) { sum += amp * noise1(x * f, s + i * 31); norm += amp; amp *= 0.5; f *= 2.1; }
  return sum / norm;
}

/* ---------- color ---------- */
const _rgbCache = new Map();
function hexToRgb(hex) {
  let c = _rgbCache.get(hex);
  if (c) return c;
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h.slice(0, 6), 16);
  c = [(n >> 16) & 255, (n >> 8) & 255, n & 255, h.length === 8 ? parseInt(h.slice(6, 8), 16) : 255];
  _rgbCache.set(hex, c);
  return c;
}
const rgbToHex = (r, g, b) => '#' + ((1 << 24) | (clamp(r | 0, 0, 255) << 16) | (clamp(g | 0, 0, 255) << 8) | clamp(b | 0, 0, 255)).toString(16).slice(1);
const _u32Cache = new Map();
/** Color hex → entero 32 bits ABGR (little-endian ImageData) */
function U(hex) {
  let v = _u32Cache.get(hex);
  if (v !== undefined) return v;
  const [r, g, b, a] = hexToRgb(hex);
  v = ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
  _u32Cache.set(hex, v);
  return v;
}
function u32ToHex(u) { return rgbToHex(u & 255, (u >>> 8) & 255, (u >>> 16) & 255); }
function mixHex(h1, h2, t) {
  const a = hexToRgb(h1), b = hexToRgb(h2);
  return rgbToHex(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t));
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, s = 0; const l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h * 360, s, l];
}
function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360; s = clamp(s, 0, 1); l = clamp(l, 0, 1);
  const f = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
  let r, g, b;
  if (s === 0) r = g = b = l;
  else { const q = l < 0.5 ? l * (1 + s) : l + s - l * s; const p = 2 * l - q; r = f(p, q, h + 1 / 3); g = f(p, q, h); b = f(p, q, h - 1 / 3); }
  return rgbToHex(r * 255, g * 255, b * 255);
}
/** Oscurece/aclara con desplazamiento de tono (sombras → violeta, luces → amarillo) */
function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  let [h, s, l] = rgbToHsl(r, g, b);
  if (amt < 0) { h = lerpHue(h, 255, -amt * 0.35); s = clamp(s + (-amt) * 0.12, 0, 1); }
  else { h = lerpHue(h, 55, amt * 0.25); s = clamp(s - amt * 0.05, 0, 1); }
  return hslToHex(h, s, clamp(l + amt * 0.5, 0, 1));
}
function lerpHue(a, b, t) { let d = ((b - a + 540) % 360) - 180; return a + d * t; }
/** Genera rampa de n tonos a partir de un color base (índice medio ≈ base) */
function makeRamp(base, n = 6, spread = 0.9) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * 2 - 1; // -1..1
    out.push(shade(base, t * spread * 0.62));
  }
  return out;
}

/* ---------- Paleta maestra (rampas oscuro → claro) ---------- */
const PAL = {
  ink: '#140d26', ink2: '#1f1638', ink3: '#2b2150',
  white: '#fffaf0', salt: '#fff4de',
  deep: '#102a43', turq: '#20d6c7', cyan: '#56e5ff', sand: '#f2c14e', solar: '#ff9f43', coral: '#ff6b6b',
  pink: '#f78acb', cactus: '#4ccb70', root: '#86e36f', violet: '#8d6bff', graphite: '#263442', red: '#ff4e5d',
  yellow: '#ffe14d', lime: '#b6f05a', magenta: '#e34ad8', amber: '#ffb93b', mint: '#8ff5c8',
};
const RAMP = {
  skyDay: ['#1a3a8f', '#2152b5', '#2b6fd2', '#3d8fe6', '#58aef0', '#7ccaf4', '#a6e0f4', '#d2f2ef', '#fff3d4'],
  skyDawn: ['#28225e', '#46307e', '#71409a', '#a2509e', '#d4638f', '#f58781', '#ffad7c', '#ffd28d', '#fff0b8'],
  skyDusk: ['#191744', '#2f2368', '#55308a', '#88409a', '#c2508f', '#ee6b7c', '#ff9068', '#ffb862', '#ffe08a'],
  skyNight: ['#05081d', '#0a1030', '#101a46', '#17265c', '#203472', '#2c4488', '#3d579a', '#5a6fb0', '#8a8ccb'],
  skyStorm: ['#3a1c1a', '#58281c', '#7a3a20', '#9c5226', '#ba6c30', '#d38a3e', '#e3a552', '#ecbf6e', '#f4d896'],
  skyTech: ['#0a0f2a', '#101a40', '#162656', '#1d346c', '#274684', '#33599a', '#4870b0', '#6a8ec6', '#9cb6de'],
  sea: ['#0a1f4a', '#0d3168', '#0f4888', '#1063a6', '#1283bf', '#16a6cf', '#20d6c7', '#6cf0db', '#c6fff2', '#ffffff'],
  sand: ['#5a2e22', '#7e4429', '#a65f30', '#c97c38', '#e49c44', '#f2c14e', '#f8d677', '#fde8a8', '#fff6d8'],
  dune: ['#6a3226', '#8d4a2d', '#b26634', '#d4853c', '#eba64a', '#f6c35c', '#fbdc86'],
  salt: ['#5c2550', '#86346c', '#b44d88', '#dc6aa4', '#f78acb', '#fbb0da', '#ffd8ec', '#fff2f8'],
  leaf: ['#0b2e33', '#0f4a3e', '#156647', '#1f854c', '#33a552', '#4ccb70', '#86e36f', '#c2f58e'],
  moss: ['#1a3324', '#28503a', '#3a6e48', '#5a8c52', '#7fae5e', '#a8cc6e'],
  mangrove: ['#0b2a30', '#11403f', '#185a4e', '#22765c', '#33946a', '#4fb27a', '#7fd394'],
  mesa: ['#2e1838', '#4a2240', '#6d2f44', '#933f47', '#b8564b', '#d77558', '#eb9a6c', '#f7c08e', '#ffe0b8'],
  rock: ['#231a36', '#352646', '#4b3554', '#664664', '#865a72', '#a77484', '#c79a9e'],
  soil: ['#2a1418', '#3f1e1c', '#5a2c22', '#7a3e2a', '#9a5434', '#b86f44', '#d18f5c'],
  metal: ['#141d36', '#1d2a48', '#27405e', '#345a78', '#477a94', '#6aa0b4', '#98c6d2', '#cfe8ee', '#f4fdff'],
  steelW: ['#3a4a6e', '#5b6f96', '#8396ba', '#a9bbd6', '#cbdaea', '#e6f0f7', '#ffffff'],
  pv: ['#0a1440', '#0f1e5c', '#16307e', '#1f469e', '#2c63c0', '#4a8ae0', '#8cc4ff', '#d6efff'],
  copper: ['#3d1a14', '#6a2c1c', '#9a4426', '#c9622e', '#e8873e', '#f9b35e', '#ffd99a'],
  coral: ['#4a1428', '#7a1f36', '#a82c40', '#d8434a', '#ff6b6b', '#ff9a8a', '#ffc6b4'],
  orange: ['#4d1d12', '#7d2f16', '#ad4a1a', '#d96a1e', '#ff9f43', '#ffc06a', '#ffe0a0'],
  yellow: ['#5a3a10', '#8a5e14', '#b88a18', '#e0b41e', '#ffe14d', '#fff08a', '#fffbd0'],
  cyan: ['#082840', '#0c4560', '#106884', '#1491aa', '#22bdd0', '#56e5ff', '#a6f4ff', '#e6fdff'],
  violet: ['#1a1040', '#2a1a66', '#3f2690', '#5a38b8', '#7650dc', '#8d6bff', '#b49cff', '#dcd0ff'],
  magenta: ['#3a0c3a', '#5e1460', '#8a1e88', '#b52eac', '#e34ad8', '#f27ee6', '#fbb8f4'],
  navy: ['#0a0c22', '#121736', '#1c2350', '#283268', '#364585', '#4a5da2'],
  skinA: ['#3a1a17', '#5f2c22', '#86432c', '#a65d38', '#c37c4d', '#dc9d6a', '#efc193'],
  skinN: ['#26120f', '#401f16', '#5e3020', '#7c452b', '#98593a', '#b5744d', '#cf9668'],
  skinD: ['#43221c', '#6e3a2a', '#9a5a40', '#c07e5c', '#dca07a', '#efc3a0', '#fbe1c8'],
  skinE: ['#33201a', '#583826', '#7f5434', '#a3724a', '#c39264', '#dcb486', '#f0d4ac'],
  skinM: ['#2c1714', '#4b281e', '#6d3d2b', '#8f563b', '#ad724e', '#c99068', '#e2b48c'],
  hairA: ['#100914', '#1e1026', '#321c3a', '#48294e', '#623a66', '#835482', '#a878a4'],
  hairN: ['#0a0918', '#15132a', '#211e40', '#2f2c5a', '#433f78', '#5a5898'],
  hairD: ['#260e0c', '#46180f', '#6e2614', '#9a3a1a', '#c35626', '#e07c38', '#f4a35a'],
  hairE: ['#3a3c5c', '#5c5e80', '#8284a6', '#a8aac6', '#cdcfe2', '#eeeffa'],
  limen: ['#0e2b4a', '#165a7a', '#1f8aa8', '#3cc0d6', '#7ee8f0', '#c4fbff', '#ffffff'],
  mirage: ['#1d0b3a', '#3a1268', '#6a1c94', '#a830b8', '#e050c8', '#ff8ad0', '#ffd0e8', '#fff6ff'],
  gold: ['#3a2208', '#6a3e0e', '#9a5e12', '#c8861a', '#eab02a', '#ffd84a', '#fff09a'],
  brine: ['#3c1046', '#621a66', '#8e2a80', '#bc3e92', '#e05aa0', '#f888b8', '#ffc4dc'],
  h2: ['#0b2b40', '#0f4e66', '#16768c', '#22a2b2', '#40d0d4', '#8cf4ec', '#d8fff8'],
  fire: ['#3a0a0a', '#701414', '#a82418', '#e0401e', '#ff7a2a', '#ffb83e', '#ffe878'],
};
/** Acceso seguro a rampa con índice recortado */
function R(name, i) { const r = RAMP[name]; return r[clamp(i | 0, 0, r.length - 1)]; }

/* ---------- Bayer ---------- */
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
const BAYER8 = (() => {
  const m = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21];
  return m.map(v => (v + 0.5) / 64);
})();
const bayer4 = (x, y) => BAYER4[((y & 3) << 2) | (x & 3)];
const bayer8 = (x, y) => BAYER8[((y & 7) << 3) | (x & 7)];

/** Muestra una rampa continua t∈[0,1] con tramado ordenado → color hex */
function rampDither(ramp, t, x, y, strength = 1) {
  const n = ramp.length - 1;
  const f = clamp(t, 0, 1) * n;
  const i = Math.floor(f);
  const fr = f - i;
  const th = strength >= 1 ? bayer4(x, y) : 0.5 + (bayer4(x, y) - 0.5) * strength;
  return ramp[clamp(fr > th ? i + 1 : i, 0, n)];
}

/* ---------- utilidades varias ---------- */
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  c.g = g;
  return c;
}
const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
function deepClone(o) { return JSON.parse(JSON.stringify(o)); }
function pick(obj, keys) { const o = {}; keys.forEach(k => { o[k] = obj[k]; }); return o; }
function wrapIndex(i, n) { return ((i % n) + n) % n; }
function dist(x1, y1, x2, y2) { const dx = x2 - x1, dy = y2 - y1; return Math.sqrt(dx * dx + dy * dy); }
function rectsOverlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function pointInRect(px, py, r) { return px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h; }
