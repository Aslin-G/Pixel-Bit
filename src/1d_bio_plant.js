/* =====================================================================
   1d_bio_plant.js — BIOMA PLANTA DE ÓSMOSIS INVERSA (Nivel 02) con el
   kit VISTA: nave interior luminosa en 3/4 con la costa a la vista.
   Planos (atrás → delante): cielo+sol (0) · nubes (0,03–0,08) ·
   cordillera lila (0,06) · mar (0,08) · costa con ARIDIA, la torre de
   SYNARA y aerogeneradores (0,1) · patio exterior con la toma (0,14) ·
   muro acristalado con cerchas, lucernarios, colectores de alimentación,
   permeado y concentrado (0,22) · nave media con trenes de OI, depósitos
   y pasarelas (0,32) · haces de luz de los ventanales (0,22) · pilares,
   grúa puente y tuberías elevadas (0,45).
   Contrato: B.horizon, B.sun, B.seaY(cam).
   ===================================================================== */
var BIOME_LABELS = (typeof BIOME_LABELS !== 'undefined') ? BIOME_LABELS : {};

BIOMES.plant = function (L) {
  const V = VISTA;
  const B = new Backdrop(L.width, L.height);
  const HZ = 128;
  const SUN = { x: 168, y: 34, r: 11, halo: 26 };
  B.horizon = HZ; B.sun = SUN; B.seaY = () => HZ;
  const T = () => Game.time;
  const P = (f, ys, h, draw, opts) => B.vplane(f, ys - Math.round(V.CAMY * f * 0.3), h, draw, opts);
  const PERM = ['#0c2e4a', '#217b9c', '#22c1e7', '#71dfef', '#abfafd'], FEED = ['#0e2a4a', '#1e4a7c', '#2e6aa0', '#4a8cc0', '#9ad0f0'], BRP = ['#080e26', '#212846', '#3a405d', '#555a78', '#787a9b'];
  /* ---------------- cielo exterior ---------------- */
  B.sky = V.timed('sky', () => {
    const pb = V.sky(W, H, { horizonY: HZ, sun: SUN, curve: 1.2 });
    V.rays(pb, SUN.x, SUN.y, { n: 5, len: 200, col: '#fff6dc', a: 0.07, spread: 1.4, ang: Math.PI / 2 - 0.2, w: 0.04, seed: 6, yMax: HZ });
    return pb.toCanvas();
  });
  B.vdyn(0, (g) => V.drawBloom(g, SUN.x, SUN.y, 38, '#fff0c0', 0.2, T()), { tag: 'bloom' });
  B.cloudDeck({ n: 7, seed: 51, f: [0.03, 0.06], y: [-4, 56], w: [50, 120], bias: 0.6, speed: [2, 3.5], sunX: SUN.x });
  /* ---------------- cordillera lila (0,06) ---------------- */
  P(0.06, HZ - 52, 54, (pb, w, h) => {
    const r = RNG(141), peaks = [];
    for (let x = 200; x < w + 60;) { const ww = r.int(50, 110); peaks.push({ x: x + ww * 0.5, v: r.int(14, 30), h: r.int(18, 46), w: ww, d: r.int(16, 28) }); x += r.int(40, 90); }
    V.relief(pb, { yBase: h - 1, nv: 40, dvy: 0.3, seed: 143, hMax: 46, H: V.massif(peaks, { seed: 143, rough: 0.5, scale: 0.05, apron: 5, spurs: 5, spurW: 0.4 }), ramp: V.RAMPS.far, contrast: 2.0, t0: 0.55, haze: { col: '#b9bde0', k: 0.22 }, mist: { col: '#c3c7e6', h: 10, k: 0.5 }, rim: '#e8c2b4', tex: 0.04 });
  }, { tag: 'far' });
  /* ---------------- mar (0,08) ---------------- */
  P(0.08, HZ, 90, (pb) => V.seaFar(pb, 0, pb.h, { seed: 9 }), {
    tag: 'sea', dyn: (g, cam, Ly) => { const [, oy] = B.vofs(Ly, cam); V.drawSeaFx(g, 0, oy, W, 60, T(), { sunX: SUN.x, density: 0.8 }); },
  });
  B.cloudDeck({ n: 4, seed: 53, f: [0.07, 0.09], y: [54, 92], w: [80, 130], speed: [1.5, 2.5], sunX: SUN.x, tall: true, haze: 0.06 });
  /* ---------------- costa con ARIDIA y la torre de SYNARA (0,1) ---------------- */
  const coastT = [], coastFx = { glows: [], fauna: [] };
  P(0.1, 40, 116, (pb, w, h) => {
    const k = 0.18, r = RNG(151);
    const CX = 560;
    const info = V.relief(pb, {
      yBase: h - 4, nv: 36, dvy: 0.3, seed: 153, hMax: 80,
      H: V.massif([{ x: CX, v: 16, h: 74, w: 150, d: 24, k: 0.85 }, { x: CX - 120, v: 12, h: 52, w: 100, d: 18 }, { x: CX + 130, v: 12, h: 48, w: 110, d: 18 }, { x: 760, v: 10, h: 34, w: 90, d: 16 }, { x: 300, v: 10, h: 26, w: 80, d: 14 }],
        { seed: 153, rough: 0.5, scale: 0.05, apron: 4, plateaus: [{ x: CX, w: 40, h: 64 }, { x: CX - 120, w: 16, h: 46 }] }),
      ramp: V.RAMPS.hill, contrast: 2.0, t0: 0.55, facet: 0.3, haze: { col: '#b0a8d0', k0: 0.12, k: 0.08 }, mist: { col: '#c6bcd8', h: 10, k: 0.4 }, rim: '#fcd8ae', tex: 0.05,
      veg: { ramp: V.RAMPS.vegHill, density: 0.1, maxSlope: 1.1, minY: 40, size: 2 },
    });
    for (let i = 0; i < 26; i++) { const x = r.int(CX - 190, CX + 200); if (Math.abs(x - CX) < 26) continue; const y = info.onSurf(x, r.int(3, 14)); if (y != null && y > 40) V.house(pb, x, y + 1, r.int(5, 8), r.int(3, 6), 15200 + i, { k }); }
    V.domeCity(pb, CX, info.top[CX] + 5, { k, s: 0.42, label: false });
    const tw = V.synaraTower(pb, CX - 120, info.top[CX - 120] + 3, 44, { k: k * 0.8 });
    coastFx.glows.push(...tw.glows.slice(0, 1).map(([x, y, rr]) => [x, y, Math.max(3, rr - 3)]));
    for (const x of [360, 410, 720, 780]) { let bx = x; for (let q = -10; q <= 10; q++) if (info.top[x + q] < info.top[bx]) bx = x + q; const hub = V.turbineTower(pb, bx, info.top[bx] + 1, 26, { k: 0.22, w: 2 }); coastT.push({ x: hub.hx, y: hub.hy, R: 10, k: 0.22, sp: 2 + (x % 5) * 0.3, ph: x }); }
    // orilla con espuma
    const FOAM = V.P32(['#7cdfec', '#d2ecee', '#ffffff']);
    for (let x = 0; x < w; x++) if (info.top[x] < h - 4) { V.put(pb, x, h - 3, FOAM[1 + ((x >> 2) & 1)]); V.put(pb, x, h - 2, FOAM[0]); }
    coastFx.fauna.push({ kind: 'gull', x: 200, y: 30, r: 240, sp: 6 }, { kind: 'gull', x: 230, y: 38, r: 220, sp: 5 }, { kind: 'drone', x: CX + 40, y: 20, r: 24 });
  }, {
    tag: 'coast', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      for (const tb of coastT) { const x = tb.x + ox; if (x < -20 || x > W + 20) continue; if (!tb.rot) tb.rot = V.rotor(tb.R, { k: tb.k }); V.drawRotor(g, tb.rot, x, tb.y + oy, t * tb.sp + tb.ph); }
      V.drawPulse(g, coastFx.glows, ox, oy, t, '#5ae8f0', 0.35, 0.2, 1.6);
      V.drawFauna(g, coastFx.fauna, ox, oy, t);
    },
  });
  /* ---------------- patio exterior: muelle de la toma y depósitos (0,14) ---------------- */
  P(0.14, 136, 64, (pb, w, h) => {
    const k = 0.1;
    const CONC = V.P32(V.hz(V.TECH.CONC, k));
    for (let x = 0; x < w; x++) for (let y = 28; y < h; y++) V.put(pb, x, y, CONC[y === 28 ? 7 : y < 31 ? 5 : 4 - (hash2(x >> 2, y >> 1, 3) < 0.25 ? 1 : 0)]);
    for (let x = 30; x < w; x += 170) {
      V.cylV(pb, x, 28, 9, 18, V.TECH.STEEL, { k, dome: 0.4, bands: [[10, 2, ['#163e66', '#245f90', '#31b4e2']]] });
      V.cylV(pb, x + 26, 28, 6, 12, V.ARCH.WHITE, { k, bands: [[5, 2, PERM]] });
      V.box3q(pb, x + 44, 28, 26, 9, 6, { ramp: V.ARCH.WHITE, k });
      V.pipe(pb, [[x + 70, 22], [x + 110, 22], [x + 110, 30]], 1, FEED, { k });
      V.palm(pb, x + 128, 28, 18, -2, 16000 + x, { k }); V.palm(pb, x + 140, 28, 14, 3, 16100 + x, { k });
    }
  }, { tag: 'yard' });
  /* ---------------- muro acristalado de la nave (0,22) ---------------- */
  const wallFx = { leds: [], screens: [], perm: [], lamps: [], brineLeds: [] };
  const BAY = 186, BAY_W = 150, WIN_Y = 54, WIN_H = 112;
  P(0.22, 0, 300, (pb, w, h) => {
    const k = 0.04, r = RNG(161);
    const HW = V.P32(V.hz(V.HALLW, k)), nH = HW.length, ST = V.P32(V.hz(V.STEELW, k));
    // muro: paneles claros con juntas, más oscuro hacia el techo (luz de los ventanales)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const t = y / h;
      let i = V.band(clamp(0.82 - Math.abs(t - 0.45) * 0.7, 0, 0.999), nH, x, y, 0.05, 163);
      if (y % 22 === 0) i = Math.max(0, i - 2); else if (y % 22 === 1) i = Math.min(nH - 1, i + 1);
      if (x % 46 === 0) i = Math.max(0, i - 1);
      V.put(pb, x, y, HW[i]);
    }
    // techo: bandeja oscura con lucernarios (transparentes) y cercha
    for (let y = 0; y < 26; y++) for (let x = 0; x < w; x++) V.put(pb, x, y, ST[y < 2 ? 1 : (y % 5 === 0) ? 2 : 3]);
    for (let x = 40; x < w; x += BAY) { for (let y = 3; y < 20; y++) for (let xx = x; xx < x + 90; xx++) V.put(pb, xx, y, 0); V.glazing(pb, x, 3, 90, 17, { k, cols: 6, rows: 1, a: 0.1 }); }
    const tr = V.truss(pb, 0, w, 26, 14, { k, step: 24, lamps: 4 });
    wallFx.lamps = tr.lights;
    for (const [lx, ly] of tr.lights) { V.rect(pb, lx - 5, ly, 10, 2, ST[1]); V.rect(pb, lx - 4, ly + 2, 8, 1, U('#fff6d8')); }
    // ventanales entre pilares (se ve la costa) con rótulos encima
    for (let x = 18; x < w; x += BAY) {
      for (let y = WIN_Y; y < WIN_Y + WIN_H; y++) for (let xx = x; xx < x + BAY_W; xx++) V.put(pb, xx, y, 0);
      V.glazing(pb, x, WIN_Y, BAY_W, WIN_H, { k, cols: 5, rows: 3, a: 0.12, seed: x });
      V.ibeam(pb, x + BAY_W + 10, 40, h, 14, { k });
    }
    const signs = ['SYNARA · PLANTA DE ÓSMOSIS INVERSA', 'AGUA DE MAR → PERMEADO', 'SALA DE TRENES · 3 × 8 TUBOS', 'RECUPERACIÓN DE ENERGÍA'];
    for (let x = 18 + 30, i = 0; x < w - 60; x += BAY * 2, i++) V.sign(pb, x, 42, signs[i % signs.length], { k, bg: '#072248', border: '#6d9be8' });
    // pasarela del entresuelo con barandilla amarilla
    V.catwalk(pb, 0, w, 176, { k });
    for (let x = 0; x < w; x++) for (let y = 179; y < 184; y++) V.put(pb, x, y, ST[y === 179 ? 2 : 1]);
    // colectores en el muro: alimentación (azul), permeado (cian), concentrado (grafito)
    V.pipe(pb, [[0, 204], [w, 204]], 3, FEED, { k, flange: 32 });
    V.pipe(pb, [[0, 214], [w, 214]], 2, PERM, { k: 0, flange: 40 });
    for (let x = 0; x < w; x++) { V.blend(pb, x, 211, U('#48b6ec'), 0.5); V.blend(pb, x, 217, U('#48b6ec'), 0.5); }
    V.pipe(pb, [[0, 222], [w, 222]], 2, BRP, { k: 0, flange: 40 });
    wallFx.perm.push([0, 214], [w, 214]);
    // soportes de los colectores, armarios eléctricos, pantallas y extintores
    for (let x = 10; x < w; x += 40) for (let y = 198; y < 228; y++) V.put(pb, x, y, ST[(y & 1) ? 2 : 3]);
    for (let x = 60; x < w; x += BAY) {
      V.box3q(pb, x, 262, 30, 28, 5, { ramp: V.STEELW, k, front: 4, side: 1, top: 6 });
      for (let q = 0; q < 4; q++) wallFx.leds.push([x + 4 + q * 6, 240, ['#3fe0a0', '#56e5ff', '#f5dc5a', '#3fe0a0'][q], q === 2 ? 1.5 : 0.7]);
      V.rect(pb, x + 46, 234, 34, 20, U('#0a1440')); V.rect(pb, x + 46, 234, 34, 1, U('#56e5ff'));
      wallFx.screens.push({ x: x + 46, y: 234, w: 34, h: 20, kind: (x / BAY | 0) % 2 ? 'curve' : 'bars' });
      V.rect(pb, x + 94, 246, 5, 10, U('#c03030')); V.put(pb, x + 95, 247, U('#ff8a6a'));
      wallFx.brineLeds.push([x + 120, 222, 3]);
    }
    // escaleras al entresuelo
    for (let x = 130; x < w; x += BAY * 3) for (let q = 0; q < 26; q++) { V.put(pb, x + q * 2, 262 - q * 3, ST[6]); V.put(pb, x + q * 2 + 1, 262 - q * 3, ST[4]); V.put(pb, x + q * 2, 263 - q * 3, ST[1]); }
  }, {
    tag: 'wall', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      V.drawFlow(g, wallFx.perm, ox, oy, t, { col: '#f4ffff', speed: 22, gap: 9 });
      V.drawLeds(g, wallFx.leds, ox, oy, t);
      V.drawScreens(g, wallFx.screens, ox, oy, t);
      V.drawPulse(g, wallFx.brineLeds, ox, oy, t, '#c244a2', 0.4, 0.25, 2.5);
      for (const [x, y] of wallFx.lamps) { const sx = x + ox; if (sx < -20 || sx > W + 20) continue; V.drawGlow(g, sx, y + oy + 3, 9, '#fff0c8', 0.28); }
    },
  });
  /* ---------------- nave media: trenes de OI, depósitos, bombas (0,32) ---------------- */
  const midFx = { leds: [], perm: [] };
  P(0.32, 120, 176, (pb, w, h) => {
    const k = 0.02, r = RNG(171), yb = 132; // base de los equipos (pantalla ≈ 252)
    V.floorShine(pb, 0, w, yb, h, { k, refl: Array.from({ length: Math.ceil(w / 90) }, (_, i) => 40 + i * 90) });
    for (let x = 16; x < w;) {
      const kind = r.pick(['rack', 'tanks', 'rack', 'pumps', 'tanks']);
      if (kind === 'rack') {
        const len = r.int(70, 96), R = V.roRack(pb, x + 8, yb, { k, cols: 2, rows: 5, len, r: 3, ramp: ['#0e2440', '#22466a', '#3a6c96', '#6a9cc4', '#a8cce4', '#e8f4fa'] });
        for (const [lx, ly] of R.leds) midFx.leds.push([lx, ly, '#3fe0a0', 0.8, lx * 0.1]);
        midFx.perm.push([[R.permX, R.permY1], [R.permX, R.permY0]]);
        x += len + 40;
      } else if (kind === 'tanks') {
        V.cylV(pb, x + 14, yb, 12, 78, V.ARCH.WHITE, { k, dome: 0.5, bands: [[16, 3, PERM], [44, 2]] });
        V.cylV(pb, x + 42, yb, 9, 40, V.TECH.STEEL, { k, dome: 0.6, bands: [[12, 2, FEED]] });
        V.pipe(pb, [[x + 26, yb - 10], [x + 33, yb - 10]], 1, PERM, { k });
        midFx.leds.push([x + 10, yb - 30, '#56e5ff', 0]);
        x += 64;
      } else {
        for (let q = 0; q < 2; q++) {
          const px = x + q * 34;
          V.box3q(pb, px, yb, 28, 4, 8, { ramp: V.TECH.CONC, k });
          V.cylH(pb, px + 2, yb - 9, 16, 4, ['#3a1a10', '#6a2a1a', '#a8402a', '#d8603a', '#f0905a'], { k, caps: ['#3a3d48', '#716f76', '#b5aba8'] });
          V.cylH(pb, px + 19, yb - 8, 7, 3, V.TECH.STEEL, { k });
          midFx.leds.push([px + 6, yb - 15, '#f5dc5a', 1.2]);
        }
        x += 76;
      }
    }
    // pasarela de inspección sobre los trenes
    V.catwalk(pb, 0, w, 64, { k });
    for (let x = 30; x < w; x += 120) for (let y = 66; y < yb; y++) V.put(pb, x, y, V.P32(V.STEELW)[(y & 3) ? 3 : 5]);
  }, {
    tag: 'hall', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      V.drawLeds(g, midFx.leds, ox, oy, t);
      for (const p of midFx.perm) V.drawFlow(g, p, ox, oy, t, { col: '#e8feff', speed: 16, gap: 6 });
    },
  });
  /* ---------------- haces de luz de los ventanales (0,22, aditivos) ---------------- */
  const shaftC = V.timed('shafts', () => {
    const sw = Math.ceil(W + Math.max(0, L.width - W) * 0.22) + 2, pb = new PixelBuffer(sw, 300), list = [];
    for (let x = 18; x < sw; x += BAY) for (let c = 0; c < 5; c++) list.push([x + c * 30 + 4, WIN_Y + 4, 20, 236, 0.55]);
    for (let x = 40; x < sw; x += BAY) list.push([x + 10, 20, 60, 150, 0.35]);
    V.shafts(pb, list, { col: '#ffe2a8', a: 0.2 });
    return pb.toCanvas();
  });
  B.vdyn(0.22, (g, cam) => {
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.42 + 0.06 * Math.sin(T() * 0.6);
    g.drawImage(shaftC, -Math.round(cam.x * 0.22), Math.round(-(cam.y - V.CAMY) * 0.066) - 3);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }, { tag: 'shafts' });
  /* ---------------- pilares, grúa puente y tuberías elevadas (0,45) ---------------- */
  const nearFx = { hooks: [], lamps: [], perm: [] };
  P(0.45, 0, 300, (pb, w, h) => {
    const k = 0, Y = V.P32(['#5a3a0a', '#9a6a10', '#d8a020', '#f8d040', '#fff0a0']);
    // viga carril de la grúa puente
    for (let x = 0; x < w; x++) for (let y = 0; y < 9; y++) V.put(pb, x, y, Y[y === 0 ? 2 : y < 3 ? 3 : y < 6 ? 2 : 1]);
    for (let x = 0; x < w; x += 8) { V.put(pb, x, 4, Y[0]); V.put(pb, x + 1, 5, Y[0]); }
    for (let x = 220; x < w; x += 520) { V.box3q(pb, x, 16, 34, 7, 5, { ramp: ['#5a3a0a', '#9a6a10', '#d8a020', '#f8d040', '#fff0a0'], k, front: 3, side: 1, top: 4 }); nearFx.hooks.push({ x: x + 17, y: 16, len: 70 + (x % 3) * 12 }); }
    // haz de tuberías elevado con colgadores
    V.pipe(pb, [[0, 13], [w, 13]], 3, PERM, { k, flange: 48 });
    for (let x = 0; x < w; x++) { V.blend(pb, x, 9, U('#48b6ec'), 0.5); V.blend(pb, x, 17, U('#48b6ec'), 0.5); }
    nearFx.perm.push([0, 13], [w, 13]);
    // pilares en I con tornapuntas y luminarias colgantes
    for (let x = 120; x < w; x += 300) {
      V.ibeam(pb, x, 0, h, 18, { k, brace: 30 });
      for (let q = 0; q < 30; q++) V.put(pb, x + 60, 17 + q, V.P32(V.STEELW)[1]);
      V.rect(pb, x + 54, 47, 13, 3, V.P32(V.STEELW)[2]); V.rect(pb, x + 55, 50, 11, 1, U('#fff6d8'));
      nearFx.lamps.push([x + 60, 52, 12]);
    }
  }, {
    tag: 'near', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      V.drawFlow(g, nearFx.perm, ox, oy, t, { col: '#ffffff', speed: 24, gap: 10 });
      for (const Hk of nearFx.hooks) V.drawHook(g, Hk, ox, oy, t);
      V.drawPulse(g, nearFx.lamps, ox, oy, t, '#fff0c8', 0.3, 0.04, 1);
      V.drawMotes(g, 18, t, 21, { y0: 60, y1: 240, col: '#fff8e0' });
    },
  });
  BIOME_LABELS.plant = [];
  B.vistaInfo = { planes: B.layers.length, ms: Object.assign({}, V.stats.ms) };
  return B;
};

BIOME_LABELS.plant = BIOME_LABELS.plant || [];
