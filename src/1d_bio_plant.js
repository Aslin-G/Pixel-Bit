/* =====================================================================
   1d_bio_plant.js — BIOMA PLANTA DE ÓSMOSIS INVERSA (Nivel 02) con el
   kit VISTA: nave interior a pleno sol de tarde, en 3/4, con la costa a
   la vista por los ventanales.
   r3-int-a (ronda 3): la nave tiene profundidad real y color pintado.
   Planos (atrás → delante):
     EXTERIOR (se ve por los ventanales, paralaje creciente):
       cielo + sol (0) · nubes (0,03–0,08) · cordillera lila (0,06) ·
       mar (0,1) · colinas de la costa con ARIDIA, la torre de SYNARA,
       bancales verdes y aerogeneradores (0,3) · paseo marítimo con casas
       encaladas, palmeras, buganvillas y los depósitos de la toma (0,4)
     INTERIOR:
       muro acristalado (0,5): enlucido cálido soleado arriba, zócalo
       turquesa, marcos azul cobalto, alféizares con macetas, colectores
       con código de color (alimentación turquesa, permeado cian luminoso,
       salmuera violeta), armarios azules · haces de los ventanales (0,5)
       · fila trasera de trenes de OI con su pasarela y jardineras, en
       bruma atmosférica lavanda (0,7) · pilares de minio, grúa puente,
       tuberías elevadas y cestas colgantes con potos (0,85)
   Contrato: B.horizon, B.sun, B.seaY(cam).
   ===================================================================== */
var BIOME_LABELS = (typeof BIOME_LABELS !== 'undefined') ? BIOME_LABELS : {};
/** r2-biomes-b: acero estructural pintado (no gris): pilares cercanos en minio terracota, cerchas y montantes en turquesa */
const R2BB_OXIDE = ['#2a0e0a', '#4a1810', '#6e2616', '#94361c', '#b84a26', '#d86a36', '#f09050', '#ffc488'];
const R2BB_TEALST = ['#06262a', '#0a3c42', '#105a5e', '#18787a', '#2a9896', '#4ab8b0', '#86d8cc', '#d0f4ec'];
/** r3-int-a: rampas pintadas de la nave (sin grises neutros) */
const R3INTA_PLASTER = ['#3a2236', '#5a3040', '#7e4446', '#a65e4c', '#c87c58', '#e09c68', '#f0bc80', '#f8d6a0', '#fdecc8'];
const R3INTA_TEAL = ['#08222a', '#0c3440', '#124a56', '#1a6470', '#26808a', '#3aa0a4', '#5cbcb8', '#8cd8ca', '#c4f0e0'];
const R3INTA_COBALT = ['#0a1430', '#122250', '#1a3270', '#24468e', '#3460ac', '#4c7ec8', '#74a4e0', '#a8ccf4'];
const R3INTA_NAVY = ['#060a1e', '#0c1430', '#141e44', '#1e2c5a', '#2a3c72', '#3a5090', '#5470b0'];
const R3INTA_TERRA = ['#2a1008', '#4a1e10', '#6e3018', '#94461f', '#b85e28', '#d67e3c', '#eca262'];
const R3INTA_LEAF = ['#0a1a0c', '#13301a', '#1f4a22', '#2f6626', '#46842c', '#68a43a', '#94c64c', '#c8e470'];
const R3INTA_FEED = ['#04282a', '#08484a', '#0d7270', '#159e96', '#2cc4b6', '#7ae4d4', '#d8fff4'];
const R3INTA_PERM = ['#0c2e4a', '#217b9c', '#22c1e7', '#71dfef', '#abfafd'];
const R3INTA_BRINE = ['#120a2e', '#24164e', '#3a2470', '#563a92', '#7a58b4', '#a080d4'];

BIOMES.plant = function (L) {
  const V = VISTA;
  const B = new Backdrop(L.width, L.height);
  const HZ = 128;
  const SUN = { x: 168, y: 34, r: 11, halo: 26 };
  B.horizon = HZ; B.sun = SUN; B.seaY = () => HZ;
  const T = () => Game.time;
  const P = (f, ys, h, draw, opts) => B.vplane(f, ys - Math.round(V.CAMY * f * 0.3), h, draw, opts);
  const PERM = R3INTA_PERM, FEED = R3INTA_FEED, BRP = R3INTA_BRINE;
  /* ---------------- cielo exterior ---------------- */
  B.sky = V.timed('sky', () => {
    const pb = V.sky(W, H, { horizonY: HZ, sun: SUN, curve: 1.2, stops: ['#0e5ed8', '#166ae0', '#1e78ea', '#2886f2', '#3494f6', '#44a2f8', '#5ab0f8', '#74bef6', '#8ec8f2', '#a6d0ee'], haze: ['#b0c0ee', '#c0b8e2', '#d6b6cc', '#e8bcae'] });
    V.rays(pb, SUN.x, SUN.y, { n: 5, len: 200, col: '#fff6dc', a: 0.07, spread: 1.4, ang: Math.PI / 2 - 0.2, w: 0.04, seed: 6, yMax: HZ });
    return pb.toCanvas();
  });
  B.vdyn(0, (g) => V.drawBloom(g, SUN.x, SUN.y, 38, '#fff0c0', 0.2, T()), { tag: 'bloom' });
  B.cloudDeck({ n: 7, seed: 51, f: [0.03, 0.06], y: [-4, 56], w: [50, 120], bias: 0.6, speed: [2, 3.5], sunX: SUN.x });
  /* ---------------- cordillera lila (0,06) ---------------- */
  P(0.06, HZ - 52, 54, (pb, w, h) => {
    const r = RNG(141), peaks = [];
    for (let x = 120; x < w + 60;) { const ww = r.int(50, 110); peaks.push({ x: x + ww * 0.5, v: r.int(14, 30), h: r.int(18, 46), w: ww, d: r.int(16, 28) }); x += r.int(40, 90); }
    V.relief(pb, { yBase: h - 1, nv: 40, dvy: 0.3, seed: 143, hMax: 46, H: V.massif(peaks, { seed: 143, rough: 0.5, scale: 0.05, apron: 5, spurs: 5, spurW: 0.4 }), ramp: V.RAMPS.far, contrast: 2.0, t0: 0.55, haze: { col: '#b9bde0', k: 0.22 }, mist: { col: '#c3c7e6', h: 10, k: 0.5 }, rim: '#e8c2b4', tex: 0.04 });
  }, { tag: 'far' });
  /* ---------------- mar (0,1) ---------------- */
  P(0.1, HZ, 90, (pb) => V.seaFar(pb, 0, pb.h, { seed: 9 }), {
    tag: 'sea', dyn: (g, cam, Ly) => { const [, oy] = B.vofs(Ly, cam); V.drawSeaFx(g, 0, oy, W, 60, T(), { sunX: SUN.x, density: 0.8 }); },
  });
  B.cloudDeck({ n: 4, seed: 53, f: [0.08, 0.1], y: [54, 92], w: [80, 130], speed: [1.5, 2.5], sunX: SUN.x, tall: true, haze: 0.06 });
  /* ---------------- colinas de la costa con ARIDIA y SYNARA (0,3) ---------------- */
  const coastT = [], coastFx = { glows: [], fauna: [] };
  P(0.3, 34, 124, (pb, w, h) => {
    const k = 0.12, r = RNG(151);
    // ARIDIA queda centrada en la vista cuando la cámara pasa por la zona 4 (px ≈ 1300)
    const CX = 620;
    const peaks = [{ x: CX, v: 16, h: 70, w: 150, d: 24, k: 0.85 }, { x: CX - 230, v: 12, h: 56, w: 110, d: 18 }, { x: CX + 150, v: 12, h: 44, w: 110, d: 18 }];
    for (let x = 40; x < w; x += r.int(150, 210)) if (Math.abs(x - CX) > 190 && Math.abs(x - (CX - 230)) > 110) peaks.push({ x, v: r.int(10, 16), h: r.int(28, 52), w: r.int(80, 120), d: r.int(14, 20) });
    const info = V.relief(pb, {
      yBase: h - 4, nv: 36, dvy: 0.3, seed: 153, hMax: 80,
      H: V.massif(peaks, { seed: 153, rough: 0.5, scale: 0.05, apron: 4, plateaus: [{ x: CX, w: 40, h: 60 }, { x: CX - 230, w: 16, h: 50 }] }),
      ramp: V.RAMPS.hill, contrast: 2.0, t0: 0.55, facet: 0.3, haze: { col: '#c0a8c8', k0: 0.08, k: 0.08 }, mist: { col: '#d6c0d0', h: 8, k: 0.35 }, rim: '#fcd8ae', tex: 0.05,
      veg: { ramp: V.RAMPS.vegHill, density: 0.16, maxSlope: 1.1, minY: 34, size: 2 },
    });
    // pueblos encalados en las laderas, bancales con frutales
    for (let i = 0; i < 60; i++) { const x = r.int(10, w - 10); if (Math.abs(x - CX) < 30) continue; const y = info.onSurf(x, r.int(3, 16)); if (y != null && y > 34) { if (r.chance(0.7)) V.house(pb, x, y + 1, r.int(5, 9), r.int(3, 6), 15200 + i, { k }); else V.tree(pb, x, y + 1, r.int(2, 4), 15600 + i, { k, ramp: V.RAMPS.vegHill }); } }
    V.domeCity(pb, CX, info.top[CX] + 5, { k, s: 0.5, label: false });
    const tw = V.synaraTower(pb, CX - 230, info.top[CX - 230] + 3, 50, { k: k * 0.8 });
    coastFx.glows.push(...tw.glows.slice(0, 1).map(([x, y, rr]) => [x, y, Math.max(3, rr - 3)]));
    for (const x of [140, 200, 860, 930, 1110]) { if (x >= w - 10) continue; let bx = x; for (let q = -10; q <= 10; q++) if (info.top[x + q] < info.top[bx]) bx = x + q; const hub = V.turbineTower(pb, bx, info.top[bx] + 1, 30, { k: 0.18, w: 2 }); coastT.push({ x: hub.hx, y: hub.hy, R: 12, k: 0.18, sp: 2 + (x % 5) * 0.3, ph: x }); }
    // orilla con espuma
    const FOAM = V.P32(['#7cdfec', '#d2ecee', '#ffffff']);
    for (let x = 0; x < w; x++) if (info.top[x] < h - 4) { V.put(pb, x, h - 3, FOAM[1 + ((x >> 2) & 1)]); V.put(pb, x, h - 2, FOAM[0]); }
    coastFx.fauna.push({ kind: 'gull', x: 320, y: 30, r: 260, sp: 6 }, { kind: 'gull', x: 360, y: 38, r: 240, sp: 5 }, { kind: 'gull', x: 900, y: 26, r: 200, sp: 7 }, { kind: 'drone', x: CX + 40, y: 20, r: 24 });
  }, {
    tag: 'coast', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      for (const tb of coastT) { const x = tb.x + ox; if (x < -20 || x > W + 20) continue; if (!tb.rot) tb.rot = V.rotor(tb.R, { k: tb.k }); V.drawRotor(g, tb.rot, x, tb.y + oy, t * tb.sp + tb.ph); }
      V.drawPulse(g, coastFx.glows, ox, oy, t, '#5ae8f0', 0.35, 0.2, 1.6);
      V.drawFauna(g, coastFx.fauna, ox, oy, t);
    },
  });
  /* ---------------- paseo marítimo: casas, palmeras, buganvillas y la toma (0,4) ---------------- */
  P(0.4, 120, 60, (pb, w, h) => {
    const k = 0.04, r = RNG(181), yb = 46;
    // muro del paseo (piedra dorada) y acera
    const ST = V.P32(V.hz(['#4a2a1e', '#6e4028', '#94583a', '#b8744a', '#d4925e', '#e8b27a', '#f6d29c'], k));
    for (let x = 0; x < w; x++) for (let y = yb; y < h; y++) { const d = y - yb; V.put(pb, x, y, ST[d === 0 ? 6 : d === 1 ? 5 : ((x + (d >> 2) * 5) % 11 === 0 || d % 4 === 0) ? 2 : 4 - (hash2(x >> 1, y, 5) < 0.2 ? 1 : 0)]); }
    for (let x = 0; x < w;) {
      const kind = r.pick(['house', 'house', 'palm', 'bush', 'tanks', 'house', 'palm']);
      if (kind === 'house') { const ww = r.int(14, 24), hh = r.int(10, 18); V.townHouse(pb, x, yb, ww, hh, 18100 + x, { k }); x += ww + r.int(4, 12); }
      else if (kind === 'palm') { V.palm(pb, x + 4, yb, r.int(22, 34), r.int(-4, 4), 18200 + x, { k }); x += r.int(10, 18); }
      else if (kind === 'bush') { V.flowerBush(pb, x + 5, yb, r.int(4, 6), 18300 + x, { k }); x += r.int(10, 16); }
      else { V.cylV(pb, x + 10, yb, 9, 22, V.TECH.STEEL, { k, dome: 0.4, bands: [[10, 2, ['#163e66', '#245f90', '#31b4e2']]] }); V.cylV(pb, x + 30, yb, 7, 15, V.ARCH.WHITE, { k, bands: [[6, 2, PERM]] }); V.pipe(pb, [[x + 38, yb - 6], [x + 56, yb - 6], [x + 56, yb]], 1, FEED, { k }); x += 62; }
    }
    for (let x = 6; x < w; x += r.int(16, 40)) V.flowerBush(pb, x, yb + 1, r.int(2, 4), 18400 + x, { k });
  }, { tag: 'yard' });
  /* ---------------- muro acristalado de la nave (0,5) ---------------- */
  const wallFx = { leds: [], screens: [], perm: [], lamps: [], brineLeds: [] };
  const BAY = 186, BAY_W = 150, WIN_Y = 54, WIN_H = 112;
  P(0.5, 0, 300, (pb, w, h) => {
    const k = 0, r = RNG(161);
    const PL = V.P32(R3INTA_PLASTER), nP = PL.length, TE = V.P32(R3INTA_TEAL), nT = TE.length, NV = V.P32(R3INTA_NAVY), CB = V.P32(R3INTA_COBALT);
    // muro: enlucido cálido soleado (arriba) y zócalo turquesa pintado (abajo, bajo la pasarela)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let u;
      if (y < 184) {
        let i = V.band(clamp(0.6 - Math.abs(y / 184 - 0.35) * 0.5, 0, 0.999), nP, x, y, 0.05, 163);
        if (y % 24 === 0) i = Math.max(0, i - 2); else if (y % 24 === 1) i = Math.min(nP - 1, i + 1);
        if (x % 62 === 0) i = Math.max(0, i - 1);
        u = PL[i];
      } else {
        const d = y - 184;
        let i = V.band(clamp(0.62 - d / 120 * 0.4, 0, 0.999), nT, x, y, 0.05, 164);
        if (d % 26 === 0) i = Math.max(0, i - 2); else if (d % 26 === 1) i = Math.min(nT - 1, i + 1);
        if (x % 40 === 0) i = Math.max(0, i - 1); else if (x % 40 === 1) i = Math.min(nT - 1, i + 1);
        u = TE[i];
      }
      V.put(pb, x, y, u);
    }
    // techo: chapa azul marino con lucernarios (transparentes) y cercha turquesa
    for (let y = 0; y < 26; y++) for (let x = 0; x < w; x++) V.put(pb, x, y, NV[y < 2 ? 1 : (y % 5 === 0) ? 2 : 3 + ((x >> 3) & 1)]);
    for (let x = 40; x < w; x += BAY) { for (let y = 3; y < 20; y++) for (let xx = x; xx < x + 90; xx++) V.put(pb, xx, y, 0); V.glazing(pb, x, 3, 90, 17, { k, cols: 6, rows: 1, a: 0.1, frame: R3INTA_COBALT, tint: '#ffe8c0' }); }
    const tr = V.truss(pb, 0, w, 26, 14, { k, step: 24, lamps: 4, ramp: R2BB_TEALST });
    wallFx.lamps = tr.lights;
    for (const [lx, ly] of tr.lights) { V.rect(pb, lx - 5, ly, 10, 2, NV[1]); V.rect(pb, lx - 4, ly + 2, 8, 1, U('#fff6d8')); }
    // ventanales entre pilastras (se ve la costa), marcos azul cobalto, alféizar soleado con macetas
    for (let x = 18; x < w; x += BAY) {
      for (let y = WIN_Y; y < WIN_Y + WIN_H; y++) for (let xx = x; xx < x + BAY_W; xx++) V.put(pb, xx, y, 0);
      V.glazing(pb, x, WIN_Y, BAY_W, WIN_H, { k, cols: 5, rows: 3, a: 0.04, seed: x, frame: R3INTA_COBALT, tint: '#bfe8ff' });
      // jamba iluminada por el sol (borde cálido 1 px en el lado de la luz) y sombra del dintel
      for (let y = WIN_Y - 3; y < WIN_Y + WIN_H + 3; y++) V.put(pb, x + BAY_W + 3, y, U('#fbc371'));
      for (let xx = x - 3; xx < x + BAY_W + 3; xx++) { V.put(pb, xx, WIN_Y - 6, PL[2]); V.put(pb, xx, WIN_Y - 5, PL[3]); }
      // alféizar de piedra dorada y macetas de terracota con plantas
      for (let xx = x - 4; xx < x + BAY_W + 4; xx++) { V.put(pb, xx, WIN_Y + WIN_H + 4, U('#fde6b8')); V.put(pb, xx, WIN_Y + WIN_H + 5, U('#e8b070')); V.put(pb, xx, WIN_Y + WIN_H + 6, U('#a8643a')); V.put(pb, xx, WIN_Y + WIN_H + 7, U('#5a2e2a')); }
      for (let q = 0; q < 4; q++) {
        const px = x + 14 + q * 38 + r.int(-3, 3), py = WIN_Y + WIN_H + 4, TR = V.P32(R3INTA_TERRA);
        for (let yy = 0; yy < 6; yy++) for (let xx = -4 + (yy >> 2); xx <= 4 - (yy >> 2); xx++) V.put(pb, px + xx, py - 1 - yy, TR[yy === 5 ? 6 : xx < -2 ? 5 : xx > 2 ? 2 : 4]);
        if (q % 2 === 0) PFFlora.bush(pb, px, py - 6, 12, 9, R3INTA_LEAF, 16500 + x + q, { density: 0.7 });
        else { PFFlora.agave(pb, px, py - 6, 5, 16600 + x + q); }
        if (q === 1 && typeof R2BB_vine === 'function') R2BB_vine(pb, px + 3, py - 2, 10 + r.int(0, 8), 16700 + x, { sway: 1.2 });
      }
      V.ibeam(pb, x + BAY_W + 10, 40, 184, 14, { k, ramp: R2BB_TEALST });
      // hiedra que trepa por la pilastra
      if (typeof R2BB_vine === 'function') for (let q = 0; q < 2; q++) R2BB_vine(pb, x + BAY_W + 12 + q * 9, 44 + q * 8, 40 + r.int(0, 50), 16800 + x + q, { sway: 1.8, ramp: R3INTA_LEAF });
    }
    const signs = ['SYNARA · PLANTA DE ÓSMOSIS INVERSA', 'AGUA DE MAR → PERMEADO', 'SALA DE TRENES · 3 × 8 TUBOS', 'RECUPERACIÓN DE ENERGÍA'];
    for (let x = 18 + 30, i = 0; x < w - 60; x += BAY * 2, i++) V.sign(pb, x, 42, signs[i % signs.length], { k, bg: '#0a2a5e', border: '#fbc371' });
    // pasarela del entresuelo con barandilla amarilla
    V.catwalk(pb, 0, w, 176, { k });
    for (let x = 0; x < w; x++) for (let y = 179; y < 184; y++) V.put(pb, x, y, NV[y === 179 ? 3 : 1]);
    // colectores en el muro: alimentación (turquesa), permeado (cian luminoso), concentrado (violeta)
    V.pipe(pb, [[0, 204], [w, 204]], 3, FEED, { k, flange: 32 });
    V.pipe(pb, [[0, 214], [w, 214]], 2, PERM, { k: 0, flange: 40 });
    for (let x = 0; x < w; x++) { V.blend(pb, x, 211, U('#48b6ec'), 0.5); V.blend(pb, x, 217, U('#48b6ec'), 0.5); }
    V.pipe(pb, [[0, 222], [w, 222]], 2, BRP, { k: 0, flange: 40 });
    wallFx.perm.push([0, 214], [w, 214]);
    // bandas de identificación sobre los colectores
    for (let x = 70; x < w; x += 140) for (const [yy, col] of [[204, '#2cc4b6'], [214, '#48d4f0'], [222, '#a080d4']]) for (let q = -2; q <= 2; q++) for (let k2 = 0; k2 < 8; k2++) V.put(pb, x + k2, yy + q, U(k2 < 1 || k2 > 6 ? '#fff4dc' : col));
    // soportes de los colectores, armarios eléctricos azules, pantallas, extintores y helechos
    for (let x = 10; x < w; x += 40) for (let y = 198; y < 228; y++) V.put(pb, x, y, NV[(y & 1) ? 3 : 4]);
    for (let x = 60; x < w; x += BAY) {
      V.box3q(pb, x, 262, 30, 28, 5, { ramp: R3INTA_COBALT, k, front: 4, side: 2, top: 6 });
      for (let q = 0; q < 4; q++) wallFx.leds.push([x + 4 + q * 6, 240, ['#3fe0a0', '#56e5ff', '#f5dc5a', '#3fe0a0'][q], q === 2 ? 1.5 : 0.7]);
      V.rect(pb, x + 46, 234, 34, 20, U('#0a1440')); V.rect(pb, x + 46, 234, 34, 1, U('#56e5ff'));
      wallFx.screens.push({ x: x + 46, y: 234, w: 34, h: 20, kind: (x / BAY | 0) % 2 ? 'curve' : 'bars' });
      V.rect(pb, x + 94, 246, 5, 10, U('#c03030')); V.put(pb, x + 95, 247, U('#ff8a6a'));
      wallFx.brineLeds.push([x + 120, 222, 3]);
      PFFlora.fern(pb, x + 110, 262, 10, 16900 + x, R3INTA_LEAF);
    }
    // escaleras al entresuelo (amarillas)
    const YE = V.P32(['#5a3a0a', '#9a6a10', '#d8a020', '#f8d040', '#fff0a0']);
    for (let x = 130; x < w; x += BAY * 3) for (let q = 0; q < 26; q++) { V.put(pb, x + q * 2, 262 - q * 3, YE[3]); V.put(pb, x + q * 2 + 1, 262 - q * 3, YE[2]); V.put(pb, x + q * 2, 263 - q * 3, YE[0]); }
  }, {
    tag: 'wall', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      V.drawFlow(g, wallFx.perm, ox, oy, t, { col: '#f4ffff', speed: 22, gap: 9 });
      V.drawLeds(g, wallFx.leds, ox, oy, t);
      V.drawScreens(g, wallFx.screens, ox, oy, t);
      V.drawPulse(g, wallFx.brineLeds, ox, oy, t, '#a080ff', 0.4, 0.25, 2.5);
      for (const [x, y] of wallFx.lamps) { const sx = x + ox; if (sx < -20 || sx > W + 20) continue; V.drawGlow(g, sx, y + oy + 3, 9, '#fff0c8', 0.28); }
    },
  });
  /* ---------------- haces de luz de los ventanales (0,5, aditivos) ---------------- */
  const shaftC = V.timed('shafts', () => {
    const sw = Math.ceil(W + Math.max(0, L.width - W) * 0.5) + 2, pb = new PixelBuffer(sw, 300), list = [];
    for (let x = 18; x < sw; x += BAY) for (let c = 0; c < 5; c++) list.push([x + c * 30 + 4, WIN_Y + 4, 20, 236, 0.55]);
    for (let x = 40; x < sw; x += BAY) list.push([x + 10, 20, 60, 150, 0.35]);
    V.shafts(pb, list, { col: '#ffcf7e', a: 0.3 });
    return pb.toCanvas();
  });
  B.vdyn(0.5, (g, cam) => {
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5 + 0.06 * Math.sin(T() * 0.6);
    g.drawImage(shaftC, -Math.round(cam.x * 0.5), Math.round(-(cam.y - V.CAMY) * 0.15) - 3);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }, { tag: 'shafts' });
  /* ---------------- fila trasera de trenes de OI en bruma atmosférica (0,7) ---------------- */
  const midFx = { leds: [], perm: [] };
  const HAZE = '#b4aedc';
  P(0.7, 96, 160, (pb, w, h) => {
    const k = 0.34, r = RNG(171), yb = 138; // base de los equipos (pantalla ≈ 232)
    V.floorShine(pb, 0, w, yb, h, { k, ramp: ['#3a2a3a', '#5a3a40', '#7a5048', '#9a6a52', '#b88a62', '#d2a878', '#e8c898'], refl: Array.from({ length: Math.ceil(w / 90) }, (_, i) => 40 + i * 90) });
    // muro trasero bajo de la galería (zócalo turquesa en bruma)
    const TE = V.P32(V.hz(R3INTA_TEAL, k + 0.1, HAZE));
    for (let x = 0; x < w; x++) for (let y = 70; y < yb; y++) { if (y > 74 && y < 128 && (x % 96) > 30 && (x % 96) < 90) continue; V.put(pb, x, y, TE[(y - 70) % 14 === 0 ? 2 : 4 + ((x >> 5) & 1)]); }
    for (let x = 16; x < w;) {
      const kind = r.pick(['rack', 'tanks', 'rack', 'pumps', 'rack', 'tanks']);
      if (kind === 'rack') {
        const len = r.int(96, 124), R = V.roRack(pb, x + 8, yb, { k, cols: 2, rows: 5, len, r: 4, ramp: V.hz(['#1a2a5a', '#2a4a86', '#3e6cb0', '#6a9ad4', '#a8c8ec', '#eaf4fc'], k, HAZE), caps: V.hz(['#0e2a4a', '#1e4a7c', '#3a78b0', '#6ab4e8'], k, HAZE) });
        for (const [lx, ly] of R.leds) midFx.leds.push([lx, ly, '#3fe0a0', 0.8, lx * 0.1]);
        midFx.perm.push([[R.permX, R.permY1], [R.permX, R.permY0]]);
        x += len + 46;
      } else if (kind === 'tanks') {
        V.cylV(pb, x + 16, yb, 14, 92, V.hz(['#2a3a6a', '#3e5a8e', '#6a8cbc', '#9cbade', '#d0e2f4', '#f4faff'], k, HAZE), { k: 0, dome: 0.5, bands: [[18, 3, V.hz(PERM, k * 0.5, HAZE)], [52, 2]] });
        V.cylV(pb, x + 48, yb, 10, 50, V.hz(R3INTA_TEAL.slice(2), k, HAZE), { k: 0, dome: 0.6, bands: [[14, 2, V.hz(FEED, k, HAZE)]] });
        V.pipe(pb, [[x + 30, yb - 12], [x + 38, yb - 12]], 1, PERM, { k });
        midFx.leds.push([x + 10, yb - 34, '#56e5ff', 0]);
        x += 74;
      } else {
        for (let q = 0; q < 2; q++) {
          const px = x + q * 40;
          V.box3q(pb, px, yb, 34, 5, 9, { ramp: V.TECH.CONC, k });
          V.cylH(pb, px + 2, yb - 11, 19, 5, ['#06221a', '#0c3a28', '#1e6e4a', '#42a676', '#72c69a'], { k, caps: ['#3a3d48', '#716f76', '#b5aba8'] });
          V.cylH(pb, px + 23, yb - 10, 9, 4, ['#081432', '#16367a', '#3064c2', '#80aeee'], { k });
          midFx.leds.push([px + 6, yb - 18, '#f5dc5a', 1.2]);
        }
        x += 90;
      }
    }
    // pasarela de inspección sobre los trenes con jardineras y potos colgando
    V.catwalk(pb, 0, w, 62, { k });
    const TR = V.P32(V.hz(R3INTA_TERRA, k * 0.6, HAZE));
    for (let x = 30; x < w; x += 120) for (let y = 64; y < yb; y++) V.put(pb, x, y, V.P32(V.hz(R3INTA_COBALT, k, HAZE))[(y & 3) ? 3 : 5]);
    for (let x = 50; x < w; x += 70 + r.int(0, 40)) {
      for (let xx = 0; xx < 18; xx++) for (let q = 0; q < 4; q++) V.put(pb, x + xx, 52 + q, TR[q === 0 ? 6 : q === 3 ? 1 : 4]);
      PFFlora.bush(pb, x + 9, 52, 18, 8, V.hz(R3INTA_LEAF, k * 0.6, HAZE), 17100 + x, { density: 0.6 });
      if (typeof R2BB_vine === 'function') for (let q = 0; q < 2; q++) R2BB_vine(pb, x + 4 + q * 9, 56, 14 + r.int(0, 22), 17200 + x + q, { sway: 1.4, ramp: V.hz(R3INTA_LEAF, k * 0.6, HAZE) });
    }
  }, {
    tag: 'hall', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      V.drawLeds(g, midFx.leds, ox, oy, t);
      for (const p of midFx.perm) V.drawFlow(g, p, ox, oy, t, { col: '#e8feff', speed: 16, gap: 6 });
    },
  });
  /* ---------------- pilares, grúa puente, tuberías elevadas y cestas colgantes (0,85) ---------------- */
  const nearFx = { hooks: [], lamps: [], perm: [] };
  P(0.85, 0, 300, (pb, w, h) => {
    const k = 0, Y = V.P32(['#5a3a0a', '#9a6a10', '#d8a020', '#f8d040', '#fff0a0']);
    // viga carril de la grúa puente
    for (let x = 0; x < w; x++) for (let y = 0; y < 9; y++) V.put(pb, x, y, Y[y === 0 ? 2 : y < 3 ? 3 : y < 6 ? 2 : 1]);
    for (let x = 0; x < w; x += 8) { V.put(pb, x, 4, Y[0]); V.put(pb, x + 1, 5, Y[0]); }
    for (let x = 220; x < w; x += 560) { V.box3q(pb, x, 16, 34, 7, 5, { ramp: ['#5a3a0a', '#9a6a10', '#d8a020', '#f8d040', '#fff0a0'], k, front: 3, side: 1, top: 4 }); nearFx.hooks.push({ x: x + 17, y: 16, len: 70 + (x % 3) * 12 }); }
    // haz de tuberías elevado con colgadores
    V.pipe(pb, [[0, 13], [w, 13]], 3, PERM, { k, flange: 48 });
    for (let x = 0; x < w; x++) { V.blend(pb, x, 9, U('#48b6ec'), 0.5); V.blend(pb, x, 17, U('#48b6ec'), 0.5); }
    nearFx.perm.push([0, 13], [w, 13]);
    // pilares en I de minio con tornapuntas y luminarias colgantes
    for (let x = 120; x < w; x += 330) {
      V.ibeam(pb, x, 0, h, 18, { k, brace: 30, ramp: R2BB_OXIDE });
      for (let q = 0; q < 30; q++) V.put(pb, x + 60, 17 + q, V.P32(R3INTA_NAVY)[3]);
      V.rect(pb, x + 54, 47, 13, 3, V.P32(R3INTA_NAVY)[4]); V.rect(pb, x + 55, 50, 11, 1, U('#fff6d8'));
      nearFx.lamps.push([x + 60, 52, 12]);
    }
    // cestas colgantes con potos (de la viga carril)
    for (let x = 270; x < w; x += 330) {
      for (let q = 0; q < 20; q++) V.put(pb, x, 9 + q, U((q & 1) ? '#4a3a2a' : '#7a5a3a'));
      const TR = V.P32(R3INTA_TERRA);
      for (let yy = 0; yy < 7; yy++) for (let xx = -6 + (yy >> 1); xx <= 6 - (yy >> 1); xx++) V.put(pb, x + xx, 30 + yy, TR[yy === 0 ? 6 : xx < -3 ? 5 : xx > 3 ? 1 : 3]);
      PFFlora.bush(pb, x, 30, 18, 10, R3INTA_LEAF, 17400 + x, { density: 0.7 });
      if (typeof R2BB_vine === 'function') for (let q = 0; q < 4; q++) R2BB_vine(pb, x - 6 + q * 4, 34, 12 + ((x + q * 7) % 26), 17500 + x + q, { sway: 1.6 });
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
