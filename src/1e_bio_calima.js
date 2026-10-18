/* =====================================================================
   1e_bio_calima.js — BIOMA CALIMA (Nivel 10 «La Gran Calima») con el kit
   VISTA. Sustituye a BIOMES.calima de 16_biomes.js.
   Tormenta de polvo sobre la ciudad: cielo ocre/óxido en bandas (sin
   Bayer), muro de tormenta (MIRAGE) con brasas por ojos, velos de polvo en
   capas que borran las siluetas con la distancia, ARIDIA en el cabo con
   luces de emergencia, SYNARA (desaladora, FV polvorienta, aerogeneradores
   en bandera, tanques de H₂, terrazas) y el pueblo con persianas cerradas.
   La progresión la dirige el nivel: skyFx publica B.calima = {storm, gust,
   clear, transformed} antes de pintar el panorama; al despejar, los velos
   se retiran, vuelve el cielo azul y los rotores arrancan.
   Planos: cielo (0) · muro de tormenta (0,02) · cordillera (0,05) ·
   velo · ARIDIA (0,09) · velo · SYNARA (0,18) · velo · pueblo (0,32) · velo
   ===================================================================== */
var BIOME_LABELS = (typeof BIOME_LABELS !== 'undefined') ? BIOME_LABELS : {};

BIOMES.calima = function (L) {
  const prevHaze = PAL_REF.haze; PAL_REF.haze = VISTA.DUST.haze;
  try { return buildCalima(L); } finally { PAL_REF.haze = prevHaze; }
};
function buildCalima(L) {
  const V = VISTA, D = V.DUST;
  const B = new Backdrop(L.width, L.height);
  const CY0 = 0;
  const at = (f, y) => Math.round(y - (V.CAMY - CY0) * f * 0.3);
  const HZ = 178;
  const T = () => Game.time;
  const st = () => B.calima || { storm: 1, gust: 0.5, clear: 0, transformed: false };
  /* ---------------- r2-biomes-b: cielo de tormenta con el COLOSO de polvo (MIRAGE), paralaje 0,02 ----------------
     Una sola pasada a pantalla completa: cielo + nubes colgantes + muro (haboob) + coloso + haces horneados. */
  const SF = 0.02, SWd = Math.ceil(W + Math.max(0, L.width - W) * SF) + 2;
  const R2S = V.timed('r2storm', () => R2BB_stormSky(SWd, H, {}));
  const S0 = R2S.sun;
  // sol en pantalla a mitad de recorrido (r2-light orienta las sombras con él)
  const SUN = { x: S0.x - Math.round(Math.max(0, L.width - W) * SF / 2), y: S0.y, r: S0.r, halo: 22 };
  B.horizon = HZ;
  B.sun = SUN;
  B.weather.wind = 2.5;
  B.calima = null;
  B.r2storm = R2S; B.r2sf = SF;
  B.sky = R2S.c;
  // cielo despejado: se hornea la primera vez que se pide (al despejar, en el clímax): −30 ms de prerender
  let skyClearC = null;
  Object.defineProperty(B, 'skyClear', { configurable: true, get: () => skyClearC || (skyClearC = V.sky(W, H, { horizonY: HZ, stops: D.clear, haze: ['#d8c4b4', '#e0c8b0', '#e8ccb0', '#eed4b8'], sun: { x: SUN.x, y: SUN.y - 20, r: 11, halo: 24 } }).toCanvas()) });
  // coloso vivo: halo del sol tras su hombro, ojos y fauces de brasa que respiran, grietas del pecho (se apagan con MOSAICO)
  B.vdyn(SF, (g, cam) => {
    const S = st(), t = T(), ox = -Math.round(cam.x * SF), a = clamp(1 - S.clear * 1.2, 0, 1);
    if (S.clear > 0.02) V.sunBloom(g, { x: SUN.x, y: SUN.y - 20, r: 11, halo: 24 }, t, { a: 0.4 * S.clear, r: 60, col: '#ffe8b0' });
    if (a <= 0.02) return;
    V.sunBloom(g, { x: S0.x + ox, y: S0.y, r: S0.r, halo: 24 }, t, { a: (0.26 + 0.06 * Math.sin(t * 0.7)) * a, r: 56, col: '#ffc070' });
    if (S.transformed) return;
    const p = (0.62 + 0.22 * Math.sin(t * 1.9) + 0.12 * Math.sin(t * 5.3)) * a;
    for (const [ex, ey] of R2S.eyes) { V.drawGlow(g, ex + ox, ey, 5, '#ff6a1a', p * 0.55); V.drawGlow(g, ex + ox, ey - 1, 2, '#ffe6a0', p * 0.8); }
    const m = R2S.maw[R2S.maw.length >> 1]; V.drawGlow(g, m[0] + ox, m[1] + 1, 12, '#ff5a1a', (0.26 + 0.18 * Math.sin(t * 1.3)) * a);
    for (let i = 0; i < R2S.cracks.length; i++) { const [x, y] = R2S.cracks[i]; V.drawGlow(g, x + ox, y, 4, '#ff8a30', (0.28 + 0.24 * Math.sin(t * 2.2 + i)) * a); }
  }, { tag: 'r2colossus' });
  // cúmulos blancos al despejar (solo aparecen con el cielo azul)
  const clearDeck = B.cloudDeck({ n: 7, seed: 1011, f: [0.03, 0.08], y: [-10, 70], w: [90, 170], speed: [10, 18], sunX: SUN.x, haze: 0.06, hazeCol: '#f2e2d0' });
  FIXLB_fadeDeck(B, clearDeck, () => st().clear);
  // jirones de polvo que el viento arranca del coloso (velo animado, 1 tira parcial)
  const veils = [
    V.timed('veil1', () => V.dustVeil(W * 2, 70, { seed: 2, a0: 0.1, a1: 0.5, billow: 0.6, dense: false, cols: ['#3a141a', '#5a2018', '#7e3420', '#a64c26', '#d27434'] })),
    V.timed('veil3', () => V.dustVeil(W * 2, 60, { seed: 4, a0: 0.06, a1: 0.42, billow: 0.55, dense: false, cols: ['#4a1c14', '#6e2c1a', '#96421e', '#c26428', '#e8944a'] })),
  ];
  const veilLayer = (i, f, y, sp, aK) => B.vdyn(f, (g, cam) => {
    const S = st(), a = (S.storm * (0.75 + 0.25 * S.gust)) * aK; if (a <= 0.02) return;
    V.drawVeil(g, veils[i], y + Math.round(S.clear * 30), cam.x * f - T() * sp * (0.6 + S.gust), a);
  }, { tag: 'veil' + i });
  veilLayer(0, 0.03, 112, 9, 0.55);
  /* ---------------- cordillera a contraluz (0,05): siluetas oscuras con borde encendido y bruma en la base ---------------- */
  B.vplane(0.05, at(0.05, HZ - 56), 58, (pb, w, h) => {
    const r = RNG(1021), peaks = [];
    for (let x = -40; x < w + 60;) { const ww = r.int(50, 130); peaks.push({ x: x + ww * 0.5, v: r.int(14, 30), h: r.int(16, 50), w: ww, d: r.int(16, 28) }); x += r.int(36, 90); }
    V.relief(pb, {
      yBase: h - 1, nv: 40, dvy: 0.3, seed: 1023, hMax: 50,
      H: V.massif(peaks, { seed: 1023, rough: 0.5, scale: 0.05, apron: 5, spurs: 5, spurW: 0.4 }),
      ramp: R2BB_FARR, contrast: 1.5, t0: 0.42,
      haze: { col: '#9a4424', k0: 0.3, k: 0.1 }, mist: { col: '#c4642e', h: 16, k: 0.6 }, rim: '#ffc06a', tex: 0.05,
    });
  }, { tag: 'far' });
  /* ---------------- ARIDIA en el cabo con luces de emergencia (0,09) ---------------- */
  const ariFx = { beacons: [], lights: [] };
  B.vplane(0.09, at(0.09, HZ - 70), 82, (pb, w, h) => {
    const cx = 250, r = RNG(1031);
    const info = V.relief(pb, {
      yBase: h - 1, nv: 30, dvy: 0.3, seed: 1033, hMax: 50,
      H: V.massif([{ x: cx, v: 12, h: 44, w: 130, d: 20, k: 0.8 }, { x: cx + 120, v: 10, h: 26, w: 100, d: 18 }, { x: cx - 120, v: 10, h: 22, w: 90, d: 18 }, { x: 640, v: 12, h: 30, w: 140, d: 20 }, { x: 880, v: 10, h: 24, w: 120, d: 18 }],
        { seed: 1033, rough: 0.45, scale: 0.05, apron: 4, plateaus: [{ x: cx, w: 30, h: 40 }] }),
      ramp: R2BB_MIDR, contrast: 1.6, t0: 0.45,
      haze: { col: '#7a3420', k0: 0.2, k: 0.08 }, mist: { col: '#b0542a', h: 16, k: 0.55 }, rim: '#ffb860', tex: 0.05,
    });
    const dc = V.domeCity(pb, cx, info.top[cx] + 6, { k: 0.5, s: 0.5, label: false });
    ariFx.beacons.push([cx, dc.top + 1, '#ff5040'], ...dc.towers.map(tw => [tw.x + (tw.w >> 1), tw.top, '#56e5ff']).slice(0, 4));
    for (let i = 0; i < 40; i++) { const x = r.int(cx - 50, cx + 50), y = info.top[x] + r.int(2, 14); if (V.get(pb, x, y) >>> 24) { V.put(pb, x, y, U('#ffd890')); if (r.chance(0.3)) ariFx.lights.push([x, y, '#ffe0a0']); } }
    V.dustPlane(pb, '#6a2c1c', 0.34);
    V.rim(pb, U('#ffb060'), 0.55, -1, -1);
  }, {
    tag: 'aridia', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      V.drawLights(g, ariFx.lights, ox, oy, t, { blink: 0.1 });
      for (let i = 0; i < ariFx.beacons.length; i++) { const [x, y, c] = ariFx.beacons[i]; if ((Math.floor(t * 1.4 + i * 0.5) % 2) === 0) V.drawGlow(g, x + ox, y + oy, 4, c, 0.6); }
    },
  });
  /* ---------------- SYNARA bajo el polvo (0,18) ---------------- */
  const synFx = { turb: [], beacons: [], glows: [] };
  B.vplane(0.18, at(0.18, 96), 140, (pb, w, h) => {
    const r = RNG(1041), k = 0.12, base = h - 38;
    const info = V.relief(pb, {
      yBase: h - 1, nv: 40, dvy: 0.9, seed: 1043, hMax: 44,
      H: V.massif([{ x: 80, v: 12, h: 30, w: 150, d: 20 }, { x: 420, v: 12, h: 22, w: 160, d: 20 }, { x: 700, v: 14, h: 44, w: 140, d: 22, k: 0.8 }, { x: 960, v: 12, h: 26, w: 150, d: 20 }, { x: 1180, v: 12, h: 34, w: 140, d: 20 }],
        { seed: 1043, rough: 0.4, scale: 0.05, apron: 4, base: 6 }),
      ramp: R2BB_MIDR, contrast: 1.7, t0: 0.42, facet: 0.3,
      haze: { col: '#6a2c1c', k0: 0.1, k: 0.06 }, mist: { col: '#a84c26', h: 18, k: 0.5 }, rim: '#ffb860', tex: 0.06,
      veg: { ramp: V.RAMPS.vegMid, density: 0.03, maxSlope: 0.8, minY: 40 },
    });
    // desaladora y FV a la izquierda (como en el recorrido del nivel)
    const dsl = V.desalChain(pb, 40, base, { k, s: 0.62 });
    synFx.beacons.push([dsl.anchors.membranas.x, dsl.anchors.membranas.y + 6, '#56e5ff']);
    for (const x0 of [300, 560]) { const P = V.pvArray(pb, x0, base - 2, { tables: 3, cols: 12, rows: 2, cw: 4, ch: 2, gap: 2, skew: 2, k, shift: 3 }); V.dustOn(pb, P.x0, P.y0, P.x1 - P.x0, P.y1 - P.y0, '#d89a5a', 0.55); }
    // aerogeneradores (en bandera durante la tormenta)
    for (const x of [470, 520, 760, 820, 880]) {
      if (x >= w) continue;
      let bx = x; for (let q = -10; q <= 10; q++) if (info.top[x + q] < info.top[bx]) bx = x + q;
      const hub = V.turbineTower(pb, bx, info.top[bx] + 2, 40, { k: 0.2 });
      synFx.turb.push({ x: hub.hx, y: hub.hy, R: 16, k: 0.2, sp: 1.6 + (bx % 5) * 0.2, ph: bx, rot: V.rotor(16, { k: 0.2 }) });
      synFx.beacons.push([hub.hx + 2, hub.hy - 1, '#ff5040']);
    }
    // ciudadela de H₂ y terrazas a la derecha
    if (w > 1000) { const h2 = V.h2Plant(pb, 960, base - 2, { k, s: 0.8 }); synFx.glows.push(...h2.glows.slice(0, 4)); }
    if (w > 1160) V.carveTerraces(pb, info, { x0: 1110, x1: Math.min(w - 2, 1250), yTop: base - 40, yBot: base, stepH: [8, 10], wallK: 0.45, k, seed: 1047, kinds: ['rows', 'vine', 'rows'] });
    V.scatterVeg(pb, (x) => info.top[x] > base - 30 ? info.top[x] + 1 : null, 0, w, 1049, { k, gap: 12, mix: { palm: 2, shrub: 3, tree: 1 } });
    V.dustPlane(pb, '#5a2418', 0.28);
    V.rim(pb, U('#ffa850'), 0.5, -1, -1);
  }, {
    tag: 'synara', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T(), S = st();
      // rotores: en bandera (parados) con viento > 25 m/s; arrancan al despejar
      const run = S.storm < 0.45;
      for (const tb of synFx.turb) { const x = tb.x + ox; if (x < -30 || x > W + 30) continue; V.drawRotor(g, tb.rot, x, tb.y + oy, run ? t * tb.sp + tb.ph : tb.ph * 0.01); }
      for (let i = 0; i < synFx.beacons.length; i++) { const [x, y, c] = synFx.beacons[i]; if ((Math.floor(t * 1.2 + i * 0.37) % 2) === 0 && x + ox > -6 && x + ox < W + 6) { V.drawGlow(g, x + ox, y + oy, 4, c, 0.6); } }
      for (const [x, y, rr] of synFx.glows) V.drawGlow(g, x + ox, y + oy, rr, '#4cd48e', 0.3 + 0.15 * Math.sin(t * 2 + x));
    },
  });
  /* ---------------- r2-biomes-b: haces crepusculares a través del polvo, delante del plano medio (sprite parcial) ---------------- */
  const R2FAN = V.timed('r2fan', () => R2BB_rayFan(R2S));
  B.vdyn(SF, (g, cam) => {
    const S = st(), a = clamp(1 - S.clear * 1.4, 0, 1) * (0.5 + 0.12 * Math.sin(Game.time * 0.45) + 0.1 * (S.gust || 0)); if (a <= 0.02) return;
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, a);
    g.drawImage(R2FAN.c, Math.round(S0.x - cam.x * SF - R2FAN.ox), Math.round(S0.y - cam.y * 0.05 - R2FAN.oy));
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }, { tag: 'r2rays' });
  /* ---------------- pueblo con persianas cerradas (0,32) ---------------- */
  const townFx = { lights: [], beacons: [], crests: [], lit: [] };
  B.vplane(0.32, at(0.32, 132), 156, (pb, w, h) => {
    const r = RNG(1051), k = 0.06, base = h - 6;
    const info = V.relief(pb, {
      yBase: h - 1, nv: 30, dvy: 1.1, seed: 1053, hMax: 40,
      H: V.massif([{ x: 120, v: 10, h: 28, w: 180, d: 16 }, { x: 520, v: 10, h: 24, w: 200, d: 16 }, { x: 900, v: 10, h: 30, w: 190, d: 16 }, { x: 1300, v: 10, h: 26, w: 200, d: 16 }, { x: 1700, v: 10, h: 30, w: 180, d: 16 }],
        { seed: 1053, rough: 0.35, scale: 0.05, apron: 3, base: 18 }),
      ramp: V.RAMPS.low, contrast: 1.6, t0: 0.52, haze: { col: '#c87a48', k0: 0.08, k: 0.06 }, rim: '#f8c080', tex: 0.06,
      veg: { ramp: V.RAMPS.vegLow, density: 0.04, maxSlope: 1.2, minY: 60 },
    });
    // casas blancas y de adobe con contraventanas cerradas, algunas ventanas encendidas
    for (let x = 10; x < w - 10; x += r.int(16, 30)) {
      const y = info.onSurf(x, r.int(2, 10)); if (y == null || y < 40) continue;
      const ww = r.int(10, 18), hh = r.int(8, 16);
      if (r.chance(0.5)) V.house(pb, x, y + 1, ww, hh, 5100 + x, { k, roof: r.pick(['flat', 'dome', 'solar', 'flat']) });
      else V.adobe(pb, x, y + 1, ww, hh, 5100 + x, { k });
      if (r.chance(0.55)) { const lx = x + 2 + r.int(0, ww - 4), ly = y - hh + 3; townFx.lit.push([lx, ly]); if (r.chance(0.5)) townFx.lights.push([lx, ly, '#ffe0a0']); }
      townFx.crests.push([x + (ww >> 1), y - hh - 2]);
    }
    // palmeras dobladas por el viento y torre de comunicaciones con baliza
    for (let x = 30; x < w; x += r.int(40, 90)) { const y = info.onSurf(x, 2); if (y != null) V.palm(pb, x, y + 2, r.int(26, 40), r.range(8, 14), 5200 + x, { k }); }
    for (const x of [300, 980, 1600]) if (x < w) { const y = info.top[x] + 2; for (let i = 0; i < 60; i++) { V.put(pb, x, y - i, U(V.hzc('#c8b8b0', k))); if (i % 6 === 0) { V.put(pb, x - 1, y - i, U('#8a7a76')); V.put(pb, x + 1, y - i, U('#8a7a76')); } } townFx.beacons.push([x, y - 61]); }
    // contraluz: el pueblo cercano queda en silueta cálida oscura; las ventanas encendidas destacan
    V.dustPlane(pb, '#2e1010', 0.5, { y0: 0 });
    V.rim(pb, U('#ff9c48'), 0.6, -1, -1);
    for (const [lx, ly] of townFx.lit) { V.put(pb, lx, ly, U('#ffd890')); V.put(pb, lx + 1, ly, U('#ffe8b0')); }
  }, {
    tag: 'town', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T(), S = st();
      V.drawLights(g, townFx.lights, ox, oy, t, { blink: -0.4 });
      for (let i = 0; i < townFx.beacons.length; i++) { const [x, y] = townFx.beacons[i]; if ((Math.floor(t * 1.5 + i) % 2) === 0) V.drawGlow(g, x + ox, y + oy, 5, '#ff4030', 0.65); }
      if (S.storm > 0.2) V.drawSandWisps(g, townFx.crests, ox, oy, t, { n: 3, a: 0.55 * S.storm, wind: 1.6, col: '#f0c080' });
    },
  });
  veilLayer(1, 0.4, 196, 40, 0.6);
  B.vistaInfo = { planes: B.layers.length, ms: Object.assign({}, V.stats.ms) };
  return B;
}

BIOME_LABELS.calima = BIOME_LABELS.calima || [];

/* FIXLB: cortinas de polvo que funden los planos lejanos con el cielo de tormenta.
   Lienzo W×h con alfa en 6 bandas (borde de banda en clusters 3×2, sin tramado) y color de cada
   fila tomado del cielo; se dibuja con alfa ∝ intensidad de la tormenta (0 al despejar). */
const FIXLB_CAL = { skyRows: null, cache: new Map() };
function FIXLB_curtainCanvas(y0, h, a0, a1) {
  const key = y0 + '|' + h + '|' + a0 + '|' + a1; let c = FIXLB_CAL.cache.get(key); if (c) return c;
  const pb = new PixelBuffer(W, h), rows = FIXLB_CAL.skyRows || [], nb = 6;
  for (let y = 0; y < h; y++) {
    const sy = clamp(Math.round(y0 + y), 0, Math.max(0, rows.length - 1)), rc = rows[sy] || [226, 140, 70];
    const col = ((Math.round(Math.min(255, rc[2] * 1.04)) << 16) | (Math.round(Math.min(255, rc[1] * 1.04)) << 8) | Math.round(Math.min(255, rc[0] * 1.03))) >>> 0;
    const v = y / Math.max(1, h - 1), top = Math.min(1, v * 4);
    for (let x = 0; x < W; x++) {
      const f = clamp((a0 + (a1 - a0) * v) * top + (hash2((x / 3) | 0, (y / 2) | 0, 77) - 0.5) / nb * 0.9, 0, 1);
      const lv = Math.round(f * nb); if (!lv) continue;
      pb.data[y * W + x] = ((Math.round(lv / nb * 255) << 24) | col) >>> 0;
    }
  }
  c = pb.toCanvas(); FIXLB_CAL.cache.set(key, c); return c;
}
/** Atenúa una cubierta de nubes con k() (0..1); por debajo de 0,02 solo avanza las nubes (siguen sincronizadas) */
function FIXLB_fadeDeck(B, deck, k) {
  const f = deck.L.dyn;
  deck.L.dyn = (g, cam, L) => {
    const a = clamp(k(), 0, 1);
    if (a < 0.02) { const wind = 0.6 + (B.weather.wind || 0) * 0.8; for (const c of deck.clouds) { c.x += c.speed * Game.dt * wind; if (c.x > c.span) c.x -= c.span + c.w; } return; }
    const ga = g.globalAlpha; g.globalAlpha = ga * a; f(g, cam, L); g.globalAlpha = ga;
  };
}
function FIXLB_curtain(B, f, y, h, a0, a1, st, from) {
  B.vdyn(f, (g, cam) => {
    const S = st(), a = clamp((S.storm - from) / (1 - from), 0, 1); if (a <= 0.02) return;
    const yy = y - Math.round(cam.y * f * 0.3);
    g.globalAlpha = a; g.drawImage(FIXLB_curtainCanvas(y, h, a0, a1), 0, yy); g.globalAlpha = 1;
  }, { tag: 'fixlbCurtain' });
}
