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
  const SUN = { x: 420, y: 74, r: 9, halo: 22 };
  const T = () => Game.time;
  const st = () => B.calima || { storm: 1, gust: 0.5, clear: 0, transformed: false };
  B.horizon = HZ;
  B.sun = SUN;
  B.weather.wind = 2.5;
  B.calima = null;
  // cielo de tormenta (bandas óxido → ocre, sol pálido difuso) y cielo despejado para el final
  B.sky = V.timed('sky', () => {
    const pb = V.sky(W, H, { horizonY: HZ, stops: D.sky, haze: ['#f2b860', '#f6c470', '#f8cc7c', '#fad488'], bands: 24, curve: 0.9 });
    // sol velado: disco pálido sin rayos y corona ocre en anillos
    for (let y = SUN.y - 30; y <= SUN.y + 30; y++) for (let x = SUN.x - 30; x <= SUN.x + 30; x++) {
      const d = Math.hypot(x - SUN.x, y - SUN.y) + (hash2(x >> 1, y >> 1, 3) - 0.5) * 1.4;
      if (d <= SUN.r) V.put(pb, x, y, U(d > SUN.r - 1 ? '#f6dcae' : '#fbecc8'));
      else if (d < 30) V.put(pb, x, y, V.mixU(V.get(pb, x, y), U('#f0c890'), [0.5, 0.36, 0.24, 0.14, 0.07][Math.min(4, Math.floor((d - SUN.r) / 4.2))]));
    }
    return pb.toCanvas();
  });
  B.skyClear = V.timed('skyClear', () => V.sky(W, H, { horizonY: HZ, stops: D.clear, haze: ['#d8c4b4', '#e0c8b0', '#e8ccb0', '#eed4b8'], sun: { x: SUN.x, y: SUN.y - 20, r: 11, halo: 24 } }).toCanvas());
  // halo del sol (débil con tormenta, fuerte al despejar)
  B.vdyn(0, (g) => { const S = st(); V.sunBloom(g, SUN, T(), { a: 0.16 + 0.22 * S.clear, r: 60, col: '#ffd8a0' }); }, { tag: 'sun' });
  /* ---------------- muro de tormenta: MIRAGE (0,02) ---------------- */
  const wallH = 196, wallW = Math.ceil(W + (L.width - W) * 0.02) + 2;
  const wallC = V.timed('wall', () => V.stormWall(wallW, wallH, { seed: 1001, n: 8, pal: D.wall, tint: '#8a3a1e', wMin: 170, wMax: 270, hK0: 0.62, hK1: 0.86 }).toCanvas());
  const eyes = [[296, 62], [328, 60]];
  B.vdyn(0.02, (g, cam) => {
    const S = st(), a = clamp(S.storm * 1.1 - S.clear * 0.3, 0, 1); if (a <= 0.02) return;
    const ox = -Math.round(cam.x * 0.02), y = Math.round(HZ - wallH + 12 + S.clear * 60);
    g.globalAlpha = a; g.drawImage(wallC, ox, y); g.globalAlpha = 1;
    // brasas de MIRAGE dentro del muro (se apagan cuando se transforma en MOSAICO)
    if (!S.transformed && S.storm > 0.4) { const p = 0.35 + 0.25 * Math.sin(T() * 1.3); for (const [ex, ey] of eyes) { V.drawGlow(g, ex + ox, ey + y, 6, '#ff8a3a', p * S.storm); g.fillStyle = '#ffd8a0'; g.globalAlpha = p * S.storm; g.fillRect(ex + ox - 1, ey + y, 3, 1); g.globalAlpha = 1; } }
  }, { tag: 'wall' });
  B.cloudDeck({ n: 7, seed: 1011, f: [0.03, 0.08], y: [-10, 70], w: [90, 170], speed: [10, 18], pal: D.pal, sunX: SUN.x, haze: 0.12, hazeCol: '#c46a34' });
  /* ---------------- cordillera disuelta (0,05) ---------------- */
  B.vplane(0.05, at(0.05, HZ - 56), 58, (pb, w, h) => {
    const r = RNG(1021), peaks = [];
    for (let x = -40; x < w + 60;) { const ww = r.int(50, 130); peaks.push({ x: x + ww * 0.5, v: r.int(14, 30), h: r.int(16, 50), w: ww, d: r.int(16, 28) }); x += r.int(36, 90); }
    V.relief(pb, {
      yBase: h - 1, nv: 40, dvy: 0.3, seed: 1023, hMax: 50,
      H: V.massif(peaks, { seed: 1023, rough: 0.5, scale: 0.05, apron: 5, spurs: 5, spurW: 0.4 }),
      ramp: V.RAMPS.hill, contrast: 1.6, t0: 0.5,
      haze: { col: '#d08a54', k0: 0.55, k: 0.15 }, mist: { col: '#e09a5a', h: 22, k: 0.7 }, rim: '#f6c080', tex: 0.04,
    });
  }, { tag: 'far' });
  const veils = [
    V.timed('veil0', () => V.dustVeil(W * 2, 70, { seed: 1, a0: 0.2, a1: 0.8 })),
    V.timed('veil1', () => V.dustVeil(W * 2, 90, { seed: 2, a0: 0.15, a1: 0.7 })),
    V.timed('veil2', () => V.dustVeil(W * 2, 110, { seed: 3, a0: 0.1, a1: 0.46, billow: 0.5 })),
    V.timed('veil3', () => V.dustVeil(W * 2, 120, { seed: 4, a0: 0.06, a1: 0.38, billow: 0.55, dense: false })),
  ];
  const veilLayer = (i, f, y, sp, aK) => B.vdyn(f, (g, cam) => {
    const S = st(), a = (S.storm * (0.75 + 0.25 * S.gust)) * aK; if (a <= 0.02) return;
    V.drawVeil(g, veils[i], y + Math.round(S.clear * 30), cam.x * f + T() * sp * (0.6 + S.gust), a);
  }, { tag: 'veil' + i });
  veilLayer(0, 0.05, HZ - 44, 14, 0.9);
  /* ---------------- ARIDIA en el cabo con luces de emergencia (0,09) ---------------- */
  const ariFx = { beacons: [], lights: [] };
  B.vplane(0.09, at(0.09, HZ - 70), 82, (pb, w, h) => {
    const cx = 250, r = RNG(1031);
    const info = V.relief(pb, {
      yBase: h - 1, nv: 30, dvy: 0.3, seed: 1033, hMax: 50,
      H: V.massif([{ x: cx, v: 12, h: 44, w: 130, d: 20, k: 0.8 }, { x: cx + 120, v: 10, h: 26, w: 100, d: 18 }, { x: cx - 120, v: 10, h: 22, w: 90, d: 18 }, { x: 640, v: 12, h: 30, w: 140, d: 20 }, { x: 880, v: 10, h: 24, w: 120, d: 18 }],
        { seed: 1033, rough: 0.45, scale: 0.05, apron: 4, plateaus: [{ x: cx, w: 30, h: 40 }] }),
      ramp: V.RAMPS.hill, contrast: 1.6, t0: 0.5,
      haze: { col: '#c87a48', k0: 0.45, k: 0.1 }, mist: { col: '#d88a52', h: 18, k: 0.6 }, rim: '#f0b070', tex: 0.04,
    });
    const dc = V.domeCity(pb, cx, info.top[cx] + 6, { k: 0.5, s: 0.5, label: false });
    ariFx.beacons.push([cx, dc.top + 1, '#ff5040'], ...dc.towers.map(tw => [tw.x + (tw.w >> 1), tw.top, '#56e5ff']).slice(0, 4));
    for (let i = 0; i < 40; i++) { const x = r.int(cx - 50, cx + 50), y = info.top[x] + r.int(2, 14); if (V.get(pb, x, y) >>> 24) { V.put(pb, x, y, U('#ffd890')); if (r.chance(0.3)) ariFx.lights.push([x, y, '#ffe0a0']); } }
    V.dustPlane(pb, '#c87a48', 0.55);
  }, {
    tag: 'aridia', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      V.drawLights(g, ariFx.lights, ox, oy, t, { blink: 0.1 });
      for (let i = 0; i < ariFx.beacons.length; i++) { const [x, y, c] = ariFx.beacons[i]; if ((Math.floor(t * 1.4 + i * 0.5) % 2) === 0) V.drawGlow(g, x + ox, y + oy, 4, c, 0.6); }
    },
  });
  veilLayer(1, 0.1, HZ - 40, 22, 0.85);
  /* ---------------- SYNARA bajo el polvo (0,18) ---------------- */
  const synFx = { turb: [], beacons: [], glows: [] };
  B.vplane(0.18, at(0.18, 96), 140, (pb, w, h) => {
    const r = RNG(1041), k = 0.12, base = h - 38;
    const info = V.relief(pb, {
      yBase: h - 1, nv: 40, dvy: 0.9, seed: 1043, hMax: 44,
      H: V.massif([{ x: 80, v: 12, h: 30, w: 150, d: 20 }, { x: 420, v: 12, h: 22, w: 160, d: 20 }, { x: 700, v: 14, h: 44, w: 140, d: 22, k: 0.8 }, { x: 960, v: 12, h: 26, w: 150, d: 20 }, { x: 1180, v: 12, h: 34, w: 140, d: 20 }],
        { seed: 1043, rough: 0.4, scale: 0.05, apron: 4, base: 6 }),
      ramp: V.RAMPS.hill, contrast: 1.7, t0: 0.5, facet: 0.3,
      haze: { col: '#c87a48', k0: 0.2, k: 0.1 }, mist: { col: '#d88a52', h: 20, k: 0.55 }, rim: '#f4b878', tex: 0.05,
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
    V.dustPlane(pb, '#9a4a26', 0.3);
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
  veilLayer(2, 0.2, 112, 34, 0.75);
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
    V.dustPlane(pb, '#4a1c10', 0.42, { y0: 0 });
    for (const [lx, ly] of townFx.lit) { V.put(pb, lx, ly, U('#ffd890')); V.put(pb, lx + 1, ly, U('#ffe8b0')); }
  }, {
    tag: 'town', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T(), S = st();
      V.drawLights(g, townFx.lights, ox, oy, t, { blink: -0.4 });
      for (let i = 0; i < townFx.beacons.length; i++) { const [x, y] = townFx.beacons[i]; if ((Math.floor(t * 1.5 + i) % 2) === 0) V.drawGlow(g, x + ox, y + oy, 5, '#ff4030', 0.65); }
      if (S.storm > 0.2) V.drawSandWisps(g, townFx.crests, ox, oy, t, { n: 3, a: 0.55 * S.storm, wind: 1.6, col: '#f0c080' });
    },
  });
  veilLayer(3, 0.4, 168, 60, 0.7);
  B.vistaInfo = { planes: B.layers.length, ms: Object.assign({}, V.stats.ms) };
  return B;
}

BIOME_LABELS.calima = BIOME_LABELS.calima || [];
