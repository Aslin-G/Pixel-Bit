/* =====================================================================
   13_bg.js — Fondos parallax (5–8 capas) por bioma.
   Cada bioma devuelve: { layers:[{c, f, fy, y, dyn?}], sky, clouds,
   front:[…], tint } — capas prerenderizadas + dibujo dinámico.
   ===================================================================== */

const BG_CACHE = new Map();

class Backdrop {
  constructor(levelW, levelH) {
    this.levelW = levelW; this.levelH = levelH;
    this.layers = []; // detrás del juego
    this.front = [];  // delante del juego
    this.skyC = null; this.skyKey = '';
    this.clouds = [];
    this.weather = { wind: 0.3, dust: 0, clouds: 0.5, rain: 0 };
    this.time = 0;
  }
  /** Crea capa con ancho suficiente para su factor de parallax */
  layer(f, h, y, drawFn, opts = {}) {
    const w = Math.ceil(W + Math.max(0, this.levelW - W) * f) + 2;
    const pb = new PixelBuffer(w, h);
    drawFn(pb, w, h);
    const L = { c: pb.toCanvas(), f, fy: opts.fy ?? f * 0.3, y, dyn: opts.dyn || null, pre: opts.pre || null, w, h };
    (opts.front ? this.front : this.layers).push(L);
    return L;
  }
  dynLayer(f, dyn, opts = {}) { const L = { c: null, f, fy: opts.fy ?? f * 0.3, y: 0, dyn }; (opts.front ? this.front : this.layers).push(L); return L; }
  addClouds(n, pals, seed, yMin, yMax, f0 = 0.04, f1 = 0.18) {
    const r = RNG(seed);
    for (let i = 0; i < n; i++) {
      const w = r.int(40, 120), h = Math.round(w * r.range(0.32, 0.45));
      const f = lerp(f0, f1, r());
      const spr = ART.cloudSprite(w, h, seed * 13 + i, pals).toCanvas();
      this.clouds.push({ spr, x: r.range(0, W + (this.levelW - W) * f + 200), y: r.range(yMin, yMax), f, speed: r.range(3, 9) * (0.5 + f * 4), w, h, shadow: true });
    }
    this.clouds.sort((a, b) => a.f - b.f);
  }
  drawClouds(g, cam, wind = 1) {
    for (const c of this.clouds) {
      const span = W + (this.levelW - W) * c.f + c.w + 200;
      c.x += c.speed * Game.dt * wind;
      if (c.x > span) c.x -= span + c.w;
      const sx = Math.round(c.x - cam.x * c.f - c.w), sy = Math.round(c.y - cam.y * c.f * 0.3);
      if (sx > W || sx + c.w < 0) continue;
      g.drawImage(c.spr, sx, sy);
    }
  }
  /** Proyección de sombras de nubes sobre el suelo del juego (coordenadas de mundo) */
  cloudShadowAt(worldX) {
    let s = 0;
    for (const c of this.clouds) {
      if (c.f < 0.12) continue;
      // proyección aproximada: la nube a factor f proyecta sombra desplazada
      const cx = c.x - c.w * 0.5 + (Game.cam ? Game.cam.x : 0) * (1 - c.f);
      const d = Math.abs(worldX - cx);
      if (d < c.w * 0.45) s = Math.max(s, 1 - d / (c.w * 0.45));
    }
    return clamp(s, 0, 1);
  }
  render(g, cam, which = 'back') {
    const list = which === 'back' ? this.layers : this.front;
    for (const L of list) {
      if (L.pre) L.pre(g, cam, L);
      if (L.c) {
        const ox = Math.round(cam.x * L.f), oy = Math.round(cam.y * L.fy);
        g.drawImage(L.c, -ox, L.y - oy);
      }
      if (L.dyn) L.dyn(g, cam, L);
    }
  }
}

/* ---------- helpers de nubes por paleta ---------- */
const CLOUD_PALS = {
  day: ['#9ab8e0', '#c8dcf2', '#eef6fc', '#ffffff'],
  dusk: ['#8a4a8a', '#d06a8a', '#ffa88a', '#ffe0b0'],
  dawn: ['#7a5aa0', '#c07aa8', '#ffb8a8', '#fff0d0'],
  night: ['#141c44', '#22305e', '#34467a', '#4a5e98'],
  storm: ['#6a3a22', '#94582e', '#c08048', '#e0aa6a'],
  tech: ['#2a3a6a', '#3e5a8e', '#6a88b8', '#a0bce0'],
};

/** Cielo en lienzo de pantalla (factor 0) */
function makeSkyCanvas(ramp, horizon, opts = {}) {
  const k = ramp.join() + horizon + JSON.stringify(opts);
  if (BG_CACHE.has(k)) return BG_CACHE.get(k);
  const pb = new PixelBuffer(W, Math.max(horizon + 40, opts.h || H));
  ART.sky(pb, ramp, horizon, opts);
  const c = pb.toCanvas();
  BG_CACHE.set(k, c);
  return c;
}

/* ---------- Agua animada (superficie de mar en capa) ---------- */
function drawSeaSparkles(g, x0, y0, w, h, t, density = 1, cols = ['#ffffff', '#c6fff2', '#6cf0db']) {
  const n = Math.floor(w * h / 900 * density);
  for (let i = 0; i < n; i++) {
    const hx = hash1(i, 3), hy = hash1(i, 7);
    const ph = hash1(i, 11) * TAU;
    const life = (Math.sin(t * (1.5 + hash1(i, 13) * 2) + ph) + 1) / 2;
    if (life < 0.55) continue;
    const yy = Math.round(y0 + Math.pow(hy, 1.4) * h);
    const len = Math.max(1, Math.round((1 + (yy - y0) / h * 4) * (life - 0.5) * 2));
    const xx = Math.round(x0 + ((hx * w + t * 4 * (0.3 + hy)) % w));
    g.fillStyle = cols[i % cols.length];
    g.fillRect(xx, yy, len, 1);
  }
}
/** Columna de destellos del sol sobre el agua */
function drawSunGlitter(g, cx, y0, y1, t, col = '#fff6d8') {
  for (let y = y0; y < y1; y += 1) {
    const spread = 2 + (y - y0) * 0.35;
    const n = 1 + Math.floor((y - y0) / 12);
    for (let k = 0; k < n; k++) {
      const v = Math.sin(t * 3 + y * 1.7 + k * 2.3);
      if (v < 0.4) continue;
      const xx = Math.round(cx + Math.sin(y * 3.1 + k * 7.7 + t) * spread);
      g.fillStyle = v > 0.85 ? '#ffffff' : col;
      g.fillRect(xx, y, Math.round(1 + v * 2), 1);
    }
  }
}
/** Líneas de oleaje desplazándose */
function drawWaveBands(g, x0, y0, w, h, t, col, spacing = 7) {
  g.fillStyle = col;
  for (let y = y0; y < y0 + h; y += spacing) {
    const k = (y - y0) / h;
    const seg = 6 + k * 18;
    for (let x = x0 - ((t * (6 + k * 14) + y * 13) % (seg * 3)); x < x0 + w; x += seg * 3) {
      g.fillRect(Math.round(x), y + Math.round(Math.sin(x * 0.05 + t) * 0.6), Math.round(seg), 1);
    }
  }
}

/* =====================================================================
   BIOMAS
   ===================================================================== */
const BIOMES = {};

/** COSTA DE CAPTACIÓN (Nivel 01) */
BIOMES.coast = function (L) {
  const B = new Backdrop(L.width, L.height);
  const horizon = 168;
  B.horizon = horizon;
  B.sky = makeSkyCanvas(RAMP.skyDay, horizon, { sun: { x: 470, y: 62, r: 13, halo: '#fff3d4' }, curve: 1.15 });
  B.addClouds(9, CLOUD_PALS.day, 41, 18, 120);
  // 1. promontorio lejano con faro
  B.layer(0.08, 90, horizon - 60, (pb, w) => {
    const hazePal = ART.hazeRamp(RAMP.mesa, '#9cc0ec', 0.48);
    ART.ridge(pb, (x) => 60 - Math.max(0, 1 - Math.abs(x - 120) / 170) * 46 - fbm1(x * 0.03, 3, 2) * 10 + (x > 260 ? 30 : 0), hazePal, { mesa: true, baseIdx: 4, strata: 7 });
    pb.rect(158, 6, 4, 14, '#fffaf0'); pb.rect(158, 10, 4, 3, '#ff6b6b'); pb.rect(157, 4, 6, 2, '#5a6fb0'); pb.set(160, 3, '#ffe14d');
  });
  // 2. mar (pantalla) — degradado prerenderizado
  B.layer(0, H - horizon, horizon, (pb) => {
    ART.sea(pb, 0, pb.h, ['#1063a6', '#1283bf', '#16a6cf', '#1fc0d0', '#20d6c7', '#4ae4cf'], {});
    for (let x = 0; x < pb.w; x++) pb.set(x, 0, '#a6e0f4');
  }, { dyn: (g, cam) => {
    const t = Game.time;
    drawWaveBands(g, 0, horizon + 3, W, 60, t, '#56b8dc', 6);
    drawSunGlitter(g, 470 - cam.x * 0.02, horizon + 1, horizon + 70, t);
    drawSeaSparkles(g, 0, horizon + 2, W, 70, t, 1.2);
    // velero lejano
    const bx = Math.round(((t * 4) % (W + 60)) - 30 - cam.x * 0.1);
    frect(g, bx, horizon + 6, 9, 2, '#fffaf0'); frect(g, bx + 1, horizon + 8, 7, 1, '#3a4a6e');
    frect(g, bx + 4, horizon - 6, 1, 12, '#3a4a6e'); g.fillStyle = '#fffaf0'; for (let i = 0; i < 10; i++) g.fillRect(bx + 5, horizon - 5 + i, Math.round(i * 0.5), 1);
    frect(g, bx + 2, horizon - 2, 2, 7, '#ff9f43');
  } });
  // 3. costa media con pueblo de Aridia y aerogeneradores lejanos
  B.layer(0.25, 120, horizon - 52, (pb, w) => {
    const sand = ART.hazeRamp(RAMP.dune, '#c8eef4', 0.22);
    ART.dunes(pb, 70, 26, sand, 7, { minW: 90, maxW: 220, lit: 5, shadow: 2, ripples: true });
    const r = RNG(9);
    for (let x = 30; x < w - 40; x += r.int(50, 120)) {
      if (r.chance(0.55)) { const hw = r.int(18, 34), hh = r.int(14, 26); ART.house(pb, x, 68, hw, hh, x, { pal: HOUSE_COLS[r.int(0, 6)].map(c => mixHex(c, '#c8eef4', 0.3)) }); }
      else ART.palm(pb, x, 70, r.int(22, 34), r.range(-6, 6), x, ART.hazeRamp(RAMP.leaf, '#c8eef4', 0.3));
    }
    // franja de playa húmeda
    for (let x = 0; x < w; x++) { pb.set(x, 118, '#fde8a8'); pb.set(x, 119, '#c6fff2'); }
  }, { dyn: (g, cam, Ly) => {
    const ox = cam.x * 0.25;
    for (let i = 0; i < 5; i++) {
      const tx = 180 + i * 260 - ox;
      if (tx < -40 || tx > W + 40) continue;
      ART.turbine(g, tx, Ly.y - cam.y * Ly.fy + 64 - (i % 2) * 6, 34, Game.time * 1.6 + i, { col: '#e6f4fa', shade: '#a8c8d8' });
    }
  } });
  // 4. dunas cercanas con vegetación xerófita y rocas dispersas (deja ver el mar)
  B.layer(0.55, 120, H - 120 - 52, (pb, w) => {
    const r = RNG(21);
    const top = ART.dunes(pb, 96, 30, RAMP.dune, 23, { minW: 120, maxW: 260, lit: 5, shadow: 3, ripples: true });
    // rocas ocasionales
    for (let x = 60; x < w; x += r.int(160, 320)) { const y = Math.round(top[Math.min(w - 1, x)]) + 4; pb.ellipse(x, y, r.int(10, 18), r.int(6, 9), '#b8564b'); pb.ellipse(x - 3, y - 3, r.int(6, 10), 4, '#d77558'); pb.hline(x - 6, x + 2, y - 6, '#f7c08e'); }
    for (let x = 20; x < w; x += r.int(22, 60)) {
      const y = Math.round(top[Math.min(w - 1, x)]) + 2;
      const k = r();
      if (k < 0.22) ART.cactus(pb, x, y, r.int(14, 24), x);
      else if (k < 0.55) ART.shrub(pb, x, y, r.int(4, 7), x);
      else if (k < 0.7) ART.agave(pb, x, y, r.int(6, 9));
      else if (k < 0.82) ART.nopal(pb, x, y, r.int(3, 4), x);
      else ART.grass(pb, x, y, 4, x);
    }
  }, { fy: 0.3 });
  return B;
};

/** Utilidad: lluvia de partículas ambientales por bioma */
function ambientParticles(ps, kind, cam, rate, wind) {
  const n = Math.floor(rate * Game.dt * 60 + Math.random());
  for (let i = 0; i < n; i++) {
    const x = cam.x + Math.random() * (W + 80) - 40, y = cam.y + Math.random() * H;
    if (kind === 'dust') ps.emit('dust', x, y, wind * 40, Math.random() * 6 - 3);
    if (kind === 'sand') ps.emit('sand', cam.x - 10, cam.y + H * 0.4 + Math.random() * H * 0.6, 60 + wind * 80, -10);
    if (kind === 'leaf') ps.emit('leaf', x, cam.y - 5, wind * 30, 10);
    if (kind === 'firefly') ps.emit('firefly', x, y, 0, 0);
    if (kind === 'salt') ps.emit('salt', x, y, wind * 10, -5);
    if (kind === 'windline') ps.emit('windline', cam.x - 10, cam.y + Math.random() * H * 0.8, 120 + wind * 120, 0);
  }
}
