/* =====================================================================
   1d_bio_plaza.js — BIOMA PLAZA DE ARIDIA (Nivel 00 y epílogo, Nivel 11)
   con el kit de panorama VISTA. Sustituye a BIOMES.plaza de 16_biomes.js.
   El fondo es la propia ciudad en la colina, con todo el nexo a la vista:
   cielo+sol (0) · cirros/cúmulos (0,01–0,07) · cordillera lila (0,08) ·
   mar lejano (0,1) · cúmulos bajos (0,1) · montañas medias con
   aerogeneradores (0,15) · llano costero con la desaladora SYNARA, FV,
   H₂ verde e invernaderos (0,2) · colina de ARIDIA con la cúpula, la
   torre de SYNARA, cascadas y terrazas de cultivo (0,26) · barrio alto
   en terrazas (0,36) · barrio bajo con banderines, cometas y jardines (0,48)
   Nivel 11 («La Primera Cosecha»): misma ciudad al atardecer, más verde,
   con cosecha dorada en las terrazas, ventanas encendidas y fuegos.
   Contrato: B.horizon, B.sun, B.seaY(cam), B.power (0 = apagón: la torre
   de SYNARA parpadea en rojo; lo fija LEVELS[0].skyFx).
   ===================================================================== */
var BIOME_LABELS = (typeof BIOME_LABELS !== 'undefined') ? BIOME_LABELS : {};

BIOMES.plaza = function (L) {
  const V = VISTA;
  const B = new Backdrop(L.width, L.height);
  const EV = L.id === 11;
  const HZ = 172;
  const SUN = EV ? { x: 128, y: 132, r: 13, halo: 32 } : { x: 452, y: 30, r: 11, halo: 26 };
  B.horizon = HZ; B.sun = SUN; B.power = 1;
  B.seaY = () => HZ;
  const T = () => Game.time;
  const labels = [];
  /** plano cuya parte superior queda en ys de pantalla con cam.y = 0 (cámara de la plaza) */
  const P = (f, ys, h, draw, opts) => B.vplane(f, ys - Math.round(V.CAMY * f * 0.3), h, draw, opts);
  // paleta del momento del día
  const HZC = EV ? '#c49ab4' : '#a9a6cc';            // bruma de montañas
  const RIM = EV ? '#ffc890' : '#f6dcc8';
  const RIMN = EV ? '#ffd8a0' : '#fcd8ae';
  const vegK = EV ? 1.45 : 1;
  const CLOUD = EV ? ['#6a4a8a', '#8c5a9a', '#b46c9c', '#d88494', '#f0a490', '#fcc49a', '#ffe0b4', '#fff0c8'] : null;
  /* ---------------- cielo, sol y haces ---------------- */
  B.sky = V.timed('sky', () => {
    const pb = V.sky(W, H, {
      horizonY: HZ, sun: SUN, curve: EV ? 1.1 : 1.2,
      stops: EV ? ['#1c2a6e', '#283a88', '#3a4a9e', '#5a5aae', '#7c64b0', '#a46cac', '#cc7ca4', '#ec9a98', '#f8b890', '#fcd49a']
        : ['#1466d8', '#1a74e2', '#2484ec', '#3292f2', '#40a0f6', '#58acf6', '#7cbcf2', '#a2caf0', '#c4d0ec', '#dcd2e2'],
      haze: EV ? ['#f4c0a0', '#f8c898', '#fcd8a0', '#ffe4b0'] : ['#d8cce0', '#e4cad4', '#ecd0c8', '#f0d8c4'],
    });
    if (EV) V.sunDisc(pb, SUN.x, SUN.y, SUN.r, SUN.halo, 'dusk');
    V.rays(pb, SUN.x, SUN.y, EV ? { n: 7, len: 300, col: '#ffe0b0', a: 0.1, spread: 2.6, ang: -0.2, w: 0.05, seed: 4, yMax: HZ + 20 }
      : { n: 6, len: 230, col: '#fff6dc', a: 0.07, spread: 1.6, ang: Math.PI / 2 + 0.15, w: 0.04, seed: 4, yMax: HZ });
    return pb.toCanvas();
  });
  B.vdyn(0, (g) => V.drawBloom(g, SUN.x, SUN.y, EV ? 48 : 40, EV ? '#ffb070' : '#fff0c0', EV ? 0.24 : 0.2, T()), { tag: 'bloom' });
  /* ---------------- nubes altas ---------------- */
  B.cloudDeck({ kind: 'cirrus', n: 6, seed: 31, f: [0.01, 0.03], y: [6, 46], w: [70, 160], speed: [1, 2], pal: EV ? ['#c88aa8', '#e8a8a8', '#f8c8b0', '#fff0d0'] : null });
  B.cloudDeck({ n: 8, seed: 37, f: [0.03, 0.07], y: [-6, 50], w: [50, 124], bias: 0.6, speed: [2, 3.5], sunX: SUN.x, pal: CLOUD });
  // fuegos artificiales de la fiesta (tras las montañas)
  const fireworks = EV ? [{ x: 220, y: 60, col: '#ff6aa0', per: 4.2, ph: 0 }, { x: 420, y: 46, col: '#f5dc5a', per: 5.1, ph: 1.7, r: 20 }, { x: 560, y: 72, col: '#3fe0f0', per: 4.6, ph: 3.1 }, { x: 330, y: 84, col: '#9cff8a', per: 5.6, ph: 2.4, r: 13 }] : [];
  if (EV) B.vdyn(0.02, (g, cam) => V.drawFireworks(g, fireworks, -Math.round(cam.x * 0.02), 0, T()), { tag: 'fireworks' });
  /* ---------------- cordillera lejana lila (0,08) ---------------- */
  P(0.08, HZ - 72, 75, (pb, w, h) => {
    const r = RNG(57), peaks = [];
    for (let x = 120; x < w + 60;) {
      const ww = r.int(50, 120);
      peaks.push({ x: x + ww * 0.5, v: r.int(14, 34), h: r.int(22, 58) * (x < 260 ? 0.6 : 1), w: ww, d: r.int(16, 30) });
      x += r.int(34, 84);
    }
    V.relief(pb, {
      yBase: h - 1, nv: 44, dvy: 0.32, seed: 59, hMax: 58,
      H: V.massif(peaks, { seed: 59, rough: 0.5, scale: 0.05, apron: 5, spurs: 5, spurW: 0.4 }),
      ramp: V.RAMPS.far, contrast: 2.0, t0: 0.55,
      haze: { col: EV ? '#d4a8c0' : '#b9bde0', k0: 0.0, k: 0.22 }, mist: { col: EV ? '#e8b8b8' : '#c3c7e6', h: 12, k: 0.5 }, rim: EV ? '#ffd0a0' : '#e8c2b4', tex: 0.04,
    });
  }, { tag: 'far' });
  /* ---------------- mar lejano (0,1) ---------------- */
  P(0.1, HZ, 84, (pb) => V.seaFar(pb, 0, pb.h, { seed: 7, stops: EV ? ['#e8b8b0', '#b49ac0', '#7a86c0', '#4a74b8', '#2a66ae', '#2a6aae', '#3474b4', '#3c80ba'] : null, horizonCol: EV ? '#ffe0c0' : null }), {
    tag: 'sea', dyn: (g, cam, Ly) => { const [, oy] = B.vofs(Ly, cam); V.drawSeaFx(g, 0, oy, W, 50, T(), { sunX: SUN.x, density: 0.7 }); },
  });
  /* ---------------- cúmulos bajos ---------------- */
  B.cloudDeck({ n: 5, seed: 41, f: [0.09, 0.12], y: [56, 100], w: [90, 140], speed: [1.5, 2.5], sunX: SUN.x, tall: true, haze: 0.06, pal: CLOUD });
  /* ---------------- montañas medias con aerogeneradores (0,15) ---------------- */
  const midT = [];
  P(0.15, 46, 166, (pb, w, h) => {
    const r = RNG(63), peaks = [];
    for (let x = 140; x < w + 60;) {
      if (r.chance(0.18)) { x += r.int(40, 90); continue; }
      const ww = r.int(80, 160), hh = r.int(54, 118) * (x < 300 ? 0.55 : 1);
      peaks.push({ x: x + ww * 0.5, v: r.int(18, 40), h: hh, w: ww, d: r.int(24, 40) });
      if (r.chance(0.6)) peaks.push({ x: x + ww * r.range(0.15, 0.85), v: r.int(4, 14), h: hh * r.range(0.35, 0.6), w: ww * 0.55, d: 18 });
      x += r.int(70, 140);
    }
    const info = V.relief(pb, {
      yBase: h - 1, nv: 56, dvy: 0.4, seed: 67, hMax: 118,
      H: V.massif(peaks, { seed: 67, rough: 0.6, scale: 0.034, apron: 7, spurs: 6, spurW: 0.45 }),
      ramp: V.RAMPS.mid, contrast: 2.3, facet: 0.35, cav: 0.1,
      haze: { col: HZC, k0: 0.0, k: 0.14 }, mist: { col: EV ? '#e0b0b8' : '#b4b4d8', h: 30, k: 0.55 }, rim: RIM, tex: 0.05,
      veg: { ramp: V.RAMPS.vegMid, density: 0.03 * vegK, maxSlope: 0.6, minY: 70 },
    });
    for (const x of [330, 410, 560, 700, 820, 980, 1100]) {
      if (x >= w - 10) continue;
      let bx = x; for (let q = -20; q <= 20; q++) if (info.top[x + q] < info.top[bx]) bx = x + q;
      const y = info.top[bx] + 1; if (y > h - 34) continue;
      const hub = V.turbineTower(pb, bx, y, 24, { k: 0.3, w: 2 });
      midT.push({ x: hub.hx, y: hub.hy, R: 10, k: 0.3, sp: 1.8 + (x % 7) * 0.2, ph: x });
    }
  }, { tag: 'mid', dyn: (g, cam, Ly) => drawTurbines(g, cam, Ly, midT) });
  /* ---------------- llano costero: la cadena del nexo en miniatura (0,2) ---------------- */
  const plainFx = { glows: [], perm: null, fauna: [], glints: [] };
  const PLAIN_YS = 150;
  const plainL = P(0.2, PLAIN_YS, 74, (pb, w, h) => {
    const k = 0.1, r = RNG(71), yB = 28; // orilla (pantalla ≈ 178)
    const info = V.relief(pb, {
      yBase: yB + 2, nv: 26, dvy: 0.3, seed: 73, hMax: 30,
      H: V.massif([{ x: 330, v: 12, h: 20, w: 90, d: 16 }, { x: 470, v: 14, h: 26, w: 110, d: 18 }, { x: 640, v: 14, h: 30, w: 120, d: 20 }, { x: 820, v: 12, h: 24, w: 100, d: 16 }, { x: 960, v: 12, h: 22, w: 90, d: 16 }],
        { seed: 73, rough: 0.4, scale: 0.06, apron: 3, plateaus: [{ x: 300, w: 60, h: 10 }, { x: 640, w: 50, h: 18 }] }),
      ramp: V.RAMPS.low, contrast: 1.7, haze: { col: EV ? '#d0a0b0' : '#c0b0cc', k0: 0.1, k: 0.06 }, rim: RIMN, tex: 0.06,
      veg: { ramp: V.RAMPS.vegLow, density: 0.12 * vegK, maxSlope: 1.1, minY: 0, size: 2 },
    });
    // tierra baja hasta el borde inferior (tapada casi siempre por la colina)
    V.fields(pb, 0, w, yB + 3, h, { k: 0.08, seed: 75, gold: EV ? 0.45 : 0.15, irrig: true });
    const SAND = V.P32(V.hz(['#c58440', '#edaf5f', '#fccf85'], k)), FOAM = V.P32(['#7cdfec', '#d2ecee', '#ffffff']);
    for (let x = 0; x < w; x++) { V.put(pb, x, yB, SAND[2]); V.put(pb, x, yB + 1, SAND[1]); V.put(pb, x, yB + 2, SAND[0]); if (info.top[x] >= yB) V.put(pb, x, yB - 1, FOAM[(x >> 2) % 3 === 0 ? 2 : 1]); }
    // desaladora SYNARA en miniatura sobre la orilla (mismo orden de proceso que el Nivel 1)
    const dc = V.desalChain(pb, 34, yB + 3, { k, s: 0.55, climb: 6 });
    plainFx.perm = dc.perm;
    // FV en la meseta y H₂ verde en la loma
    const pv = V.pvArray(pb, 262, info.yAt(300, 8) - 1, { tables: 3, cols: 12, rows: 2, cw: 3, ch: 2, gap: 2, skew: 2, k, shift: 2 });
    plainFx.glints.push({ x: pv.x0 + 2, y: pv.y0 + 2, len: pv.x1 - pv.x0 - 4, ph: 0.2, sp: 0.18 }, { x: pv.x0 + 4, y: pv.y1 - 4, len: pv.x1 - pv.x0 - 8, ph: 0.9, sp: 0.2 });
    const h2 = V.h2Plant(pb, 600, info.yAt(640, 10) - 1, { k, s: 0.62 });
    plainFx.glows.push(...h2.glows.map(([x, y, rr]) => [x, y, Math.max(2, rr - 1)]));
    // invernaderos, casas de labor, palmeras y huertos
    V.greenhouse(pb, 740, yB + 1, 22, 9, { k }); V.greenhouse(pb, 900, yB + 1, 18, 8, { k });
    for (const [x, ww, hh, s] of [[200, 7, 5, 1], [226, 6, 4, 2], [500, 8, 5, 3], [790, 7, 5, 4], [850, 8, 6, 5], [1000, 7, 5, 6]]) { const y = info.onSurf(x, 6); if (y != null) V.house(pb, x, y + 1, ww, hh, 7100 + s, { k, roof: s % 2 ? 'solar' : 'terrace' }); }
    V.scatterVeg(pb, (x) => info.top[x] < yB ? info.top[x] + 1 : null, 160, w, 7200, { k, gap: 7, mix: { tree: 4, shrub: 3, palm: 2 }, ramp: V.RAMPS.vegLow, scale: 0.8 });
    for (let x = 170; x < w; x += r.int(20, 46)) if (!(x > 560 && x < 700)) V.palm(pb, x, yB + 1, r.int(10, 16), r.range(-3, 3), 7300 + x, { k });
    plainFx.fauna.push({ kind: 'gull', x: 120, y: 10, r: 200, sp: 6 }, { kind: 'gull', x: 140, y: 16, r: 220, sp: 5 });
  }, {
    tag: 'plain', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      if (plainFx.perm) V.drawFlow(g, plainFx.perm, ox, oy, t, { col: '#f4ffff', speed: 10, gap: 5 });
      V.drawPulse(g, plainFx.glows, ox, oy, t, '#4cd48e', 0.35, 0.2, 2);
      V.drawGlints(g, plainFx.glints, ox, oy, t);
      V.drawFauna(g, plainFx.fauna, ox, oy, t);
    },
  });
  /* ---------------- colina de ARIDIA: cúpula, torre de SYNARA, cascadas (0,26) ---------------- */
  const hillT = [], hillFalls = [], hillGlints = [], towerFx = { glows: [], beacon: null }, hillFauna = [];
  const CITY_X = 476, TOWER_X = 272;
  P(0.26, 0, 252, (pb, w, h) => {
    const k = 0.08, r = RNG(81);
    const peaks = [
      { x: CITY_X, v: 26, h: 150, w: 190, d: 34, k: 0.8 }, { x: TOWER_X, v: 18, h: 120, w: 120, d: 26, k: 0.85 }, { x: CITY_X + 120, v: 16, h: 96, w: 120, d: 24 },
      { x: 160, v: 10, h: 54, w: 90, d: 18 }, { x: 760, v: 14, h: 84, w: 120, d: 22 }, { x: 880, v: 12, h: 70, w: 100, d: 20 }, { x: 1010, v: 16, h: 92, w: 130, d: 24, k: 0.9 }, { x: 1110, v: 10, h: 60, w: 90, d: 18 },
    ];
    const info = V.relief(pb, {
      yBase: h - 1, nv: 48, dvy: 0.3, seed: 83, hMax: 150,
      H: V.massif(peaks, { seed: 83, rough: 0.5, scale: 0.045, apron: 6, plateaus: [{ x: CITY_X, w: 80, h: 128 }, { x: TOWER_X, w: 30, h: 110 }, { x: 1010, w: 40, h: 80 }] }),
      ramp: V.RAMPS.hill, contrast: 2.2, t0: 0.54, facet: 0.32, cav: 0.1,
      haze: { col: EV ? '#c8a0b8' : '#b0a8d0', k0: 0.0, k: 0.1 }, mist: { col: EV ? '#e8c0b8' : '#c6bcd8', h: 16, k: 0.3 }, rim: RIMN, tex: 0.06,
      veg: { ramp: V.RAMPS.vegHill, density: 0.13 * vegK, maxSlope: 1.1, minY: 96, size: 3 },
    });
    // terrazas de cultivo talladas en los flancos (cosecha dorada en el epílogo)
    const TA = V.carveTerraces(pb, info, { x0: 560, x1: 700, yTop: 118, yBot: 172, stepH: [8, 11], wallK: 0.42, k, seed: 85, kinds: EV ? ['rows', 'orchard', 'flowers', 'rows', 'vine'] : ['rows', 'vine', 'rows', 'orchard'], crop: EV ? ['#3a2a0c', '#5a4414', '#86661c', '#b08a24', '#d4ac34', '#ecc84a', '#f8e070', '#fff0a0'] : null, falls: [{ x: 620, w: 3, from: 0 }] });
    const TB = V.carveTerraces(pb, info, { x0: 940, x1: 1080, yTop: 168, yBot: h - 24, stepH: [8, 10], wallK: 0.42, k, seed: 87, kinds: ['rows', 'orchard', 'rows', 'flowers'], falls: [] });
    hillFalls.push(...TA.falls, ...TB.falls);
    V.scatterVeg(pb, (x) => (Math.abs(x - CITY_X) < 60 || Math.abs(x - TOWER_X) < 22) ? null : info.top[x] + 1, 100, w, 8101, { k: k + 0.02, gap: 7, mix: { tree: 4, shrub: 3, palm: 1 }, ramp: V.RAMPS.vegHill });
    // casas blancas en las laderas altas
    for (let i = 0; i < 40; i++) {
      const x = r.pick([r.int(140, 420), r.int(560, 760), r.int(800, 1100)]);
      const y = info.onSurf(x, r.int(4, 18)); if (y == null || y < 100 || y > h - 10) continue;
      if (Math.abs(x - TOWER_X) < 16) continue;
      V.house(pb, x, y + 1, r.int(6, 10), r.int(4, 7), 8200 + i, { k: k + 0.02 });
    }
    // aerogeneradores en las crestas de la derecha
    for (const [x, th, R] of [[760, 44, 16], [812, 50, 18], [880, 40, 15], [1110, 46, 17]]) {
      if (x >= w - 8) continue;
      let bx = x; for (let q = -8; q <= 8; q++) if (info.top[x + q] < info.top[bx]) bx = x + q;
      const hub = V.turbineTower(pb, bx, info.top[bx] + 2, th, { k: 0.12 });
      hillT.push({ x: hub.hx, y: hub.hy, R, k: 0.12, sp: 2.1 + (x % 5) * 0.3, ph: x * 0.37 });
    }
    // torre de SYNARA en su loma (hito visible desde toda la isla)
    const tw = V.synaraTower(pb, TOWER_X, info.top[TOWER_X] + 4, 92, { k: 0.04 });
    towerFx.glows = tw.glows; towerFx.beacon = tw.beacon;
    // ciudad de ARIDIA sobre la meseta
    const dc = V.domeCity(pb, CITY_X, info.top[CITY_X] + 8, { k: 0.03, s: 0.9 });
    hillGlints.push([CITY_X - 12, dc.top + 26], [CITY_X + 8, dc.top + 32], [CITY_X - 4, dc.top + 40]);
    for (const F of dc.falls) {
      let y0 = dc.base, x0 = F.x, wf = F.w;
      const tiers = F.w > 8 ? [0.3, 0.27, 0.24, 0.19] : [0.45, 0.55], total = h - 6 - y0;
      for (let ti = 0; ti < tiers.length; ti++) {
        const y1 = Math.round(y0 + total * tiers[ti]);
        V.fall(pb, x0, y0, y1, wf, { k: 0.02 });
        hillFalls.push({ x: x0, y0, y1, w: wf });
        const RK = V.P32(V.RAMPS.hill);
        for (let xx = x0 - 4; xx < x0 + wf + 4; xx++) { V.put(pb, xx, y1 + 2, RK[2]); V.put(pb, xx, y1 + 1, RK[7]); V.put(pb, xx, y1, U(xx < x0 || xx >= x0 + wf ? '#3adcf1' : '#e8f8fc')); }
        y0 = y1 + 2; x0 += (ti % 2 ? -2 : 2); if (wf > 8) wf += 2;
      }
    }
    for (let i = 0; i < 20; i++) { const x = CITY_X + r.pick([-1, 1]) * r.int(50, 84); const y = info.onSurf(x, r.int(4, 18)); if (y != null) V.tree(pb, x, y + 1, r.int(3, 5), 8300 + i, { k }); }
    hillFauna.push({ kind: 'eagle', x: 360, y: 40, r: 90 }, { kind: 'drone', x: CITY_X + 70, y: info.top[CITY_X] - 40, r: 30 }, { kind: 'drone', x: 960, y: 120, r: 26 });
    if (!EV) labels.push({ x: 646, y: 112, f: 0.26, title: 'AGRICULTURA', sub: 'Terrazas con riego', kind: 'green', ax: 632, ay: 134, camX: [700, 1700] });
  }, {
    tag: 'hill', dyn: (g, cam, Ly) => {
      drawTurbines(g, cam, Ly, hillT);
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      V.drawFalls(g, hillFalls, ox, oy, t, { speed: 40, alpha: 0.8 });
      for (const [x, y] of hillGlints) V.drawGlow(g, x + ox, y + oy, 3, '#bff8ff', 0.35 + 0.35 * Math.sin(t * 1.3 + x));
      // torre de SYNARA: núcleo cian que late; en el apagón, baliza roja intermitente
      const on = B.power > 0.5;
      if (on) V.drawPulse(g, towerFx.glows, ox, oy, t, '#5ae8f0', 0.4, 0.2, 1.6);
      else if (Math.floor(t * 3) % 3 === 0) V.drawGlow(g, towerFx.beacon[0] + ox, towerFx.beacon[1] + oy, 6, '#ff4e5d', 0.7);
      if (on && towerFx.beacon && Math.floor(t * 1.5) % 2) { g.fillStyle = '#ff6a5a'; g.fillRect(towerFx.beacon[0] + ox, towerFx.beacon[1] + oy - 1, 1, 1); }
      V.drawFauna(g, hillFauna, ox, oy, t);
    },
  });
  /* ---------------- barrio alto sobre la colina (0,36) ---------------- */
  const upFx = { kites: [], flags: [] };
  P(0.36, 96, 166, (pb, w, h) => {
    const k = 0.05, r = RNG(91);
    const peaks = [];
    peaks.push({ x: 150, v: 8, h: 26, w: 120, d: 14 });
    for (let x = 330, i = 0; x < w + 80; i++) { const ww = r.int(150, 260); peaks.push({ x, v: r.int(10, 16), h: r.int(70, 118), w: ww, d: r.int(18, 24), k: r.range(0.8, 1.1) }); x += r.int(130, 230); }
    const info = V.relief(pb, {
      yBase: h - 1, nv: 34, dvy: 0.3, seed: 93, hMax: 118,
      H: V.massif(peaks, { seed: 93, rough: 0.45, scale: 0.05, apron: 3, spurs: 6, spurW: 0.4 }),
      ramp: V.RAMPS.hill, contrast: 2.0, t0: 0.55, facet: 0.3, cav: 0.1,
      haze: { col: EV ? '#c8a0a8' : '#b8a8c8', k0: 0.04, k: 0.05 }, rim: RIMN, tex: 0.06,
      veg: { ramp: V.RAMPS.vegHill, density: 0.14 * vegK, maxSlope: 1.2, minY: 20, size: 3 },
    });
    const town = V.slopeTown(pb, info, {
      x0: 0, x1: w, n: Math.round(w * 0.42), v: [2, 28], w: [8, 13], h: [6, 10], seed: 95, k, minY: 30, steep: 8, cluster: 0.3, trees: 0.32 * vegK,
      roofs: ['dome', 'flat', 'terrace', 'solar', 'tiles', 'tiles', 'tank', 'terrace', 'belfry'], lit: EV ? { off: 0.35 } : null,
    });
    // banderas en algunos tejados y cometas sobre el barrio
    for (const [x, y] of town.tops) if (hash2(x, y, 7) < 0.05) { const PL = U(V.hzc('#e8e4de', k)); for (let q = 0; q < 8; q++) V.put(pb, x, y - q, PL); upFx.flags.push({ x, y: y - 8, col: ['#e83b41', '#11bedd', '#f5dc5a', '#3fe0a0', '#8d6bff'][(x >> 3) % 5] }); }
    const KC = ['#e83b41', '#f5dc5a', '#8d6bff', '#11bedd', '#ff9f43', '#3fe0a0'];
    for (let x = 160, i = 0; x < w; x += r.int(150, 260), i++) upFx.kites.push({ x, y: -36 - r.int(0, 34), col: KC[i % KC.length], sp: r.range(0.4, 0.8), ph: r.range(0, 6), tail: r.int(8, 12), line: [r.int(-14, 14), 30] });
  }, {
    tag: 'up', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      V.drawFlags(g, upFx.flags, ox, oy, t);
      V.drawKites(g, upFx.kites, ox, oy, t);
    },
  });
  /* ---------------- barrio bajo junto a la plaza (0,48) ---------------- */
  const lowFx = { flags: [], lanterns: [] };
  P(0.48, 150, 142, (pb, w, h) => {
    const k = 0.02, r = RNG(101);
    const peaks = [];
    for (let x = 250; x < w + 80;) { const ww = r.int(140, 240); peaks.push({ x, v: r.int(8, 12), h: r.int(36, 66), w: ww, d: r.int(14, 18), k: 1.1 }); x += r.int(150, 260); }
    const info = V.relief(pb, {
      yBase: h - 12, nv: 24, dvy: 0.3, seed: 105, hMax: 66,
      H: V.massif(peaks, { seed: 105, rough: 0.4, scale: 0.06, apron: 3 }),
      ramp: V.RAMPS.low, contrast: 1.7, facet: 0.25, haze: { col: EV ? '#c8a0a8' : '#c0a8c0', k0: 0.0, k: 0.03 }, rim: RIMN, tex: 0.06,
      veg: { ramp: V.RAMPS.vegLow, density: 0.16 * vegK, maxSlope: 1.3, minY: 10, size: 3 },
    });
    // jardines al pie de la ladera
    const GR = V.P32(V.hz(['#2a3a0c', '#3b5312', '#597611', '#7b981a', '#9cb42c'], k));
    for (let x = 0; x < w; x++) for (let y = h - 12; y < h; y++) V.put(pb, x, y, GR[1 + (hash2(x >> 1, y >> 1, 9) < 0.4 ? 1 : 0)]);
    const up = V.slopeTown(pb, info, {
      x0: 0, x1: w, n: Math.round(w * 0.2), v: [2, 18], w: [14, 22], h: [11, 17], seed: 107, k, minY: 8, steep: 9, cluster: 0.26, trees: 0.34 * vegK, vegScale: 1.3, s: 2, flowers: 0.45,
      roofs: ['dome', 'terrace', 'tiles', 'solar', 'belfry', 'terrace', 'tiles'], lit: EV ? { off: 0.25 } : null,
    });
    // edificios cívicos: mercado con soportales, iglesia con campanario, escuela con FV
    for (const [x, ww, hh, kind] of [[430, 46, 18, 'arcade'], [900, 30, 20, 'church'], [1290, 42, 16, 'school'], [1760, 44, 18, 'arcade']]) {
      if (x > w - 30) continue;
      const y = info.onSurf(x + (ww >> 1), 3); if (y == null) continue;
      V.civic(pb, x, y + 1, ww, hh, 11000 + x, { k, kind, lit: EV ? { off: 0.15 } : null });
    }
    // fila de casas que cierra la plaza (más grandes, con toldos y buganvillas)
    const front = V.hillTown(pb, {
      x0: -8, x1: w + 8, seed: 109, k, bunting: 0.6, lit: EV ? { off: 0.2 } : null,
      rows: [{ y: (x) => h - 4 + Math.round(Math.sin(x * 0.02) * 1), w: [18, 30], h: [14, 24], gap: [-5, 10], hole: 0.22, veg: 0.85 * vegK, vegGap: [10, 24], roofs: ['terrace', 'tiles', 'dome', 'solar', 'terrace', 'tiles', 'flat'], scale: 1.45, s: 2, flowers: 0.55 }],
    });
    for (const [x, y] of [...up.tops, ...front.tops]) if (hash2(x, y, 11) < 0.1) { const PL = U(V.hzc('#e8e4de', k)); for (let q = 0; q < 10; q++) V.put(pb, x, y - q, PL); lowFx.flags.push({ x, y: y - 10, col: ['#e83b41', '#11bedd', '#f5dc5a', '#3fe0a0', '#8d6bff'][(x >> 4) % 5] }); }
    // jardineras y buganvillas al pie del muro de la plaza
    const BG = V.P32(V.hz(RAMP.bougainR, k)), FL = V.P32(V.hz(RAMP.flowerR, k));
    for (let x = 0; x < w; x += r.int(6, 14)) { const y = h - 1 - r.int(0, 2); V.shrub(pb, x, y, r.int(2, 4), 10100 + x, { k, ramp: V.RAMPS.vegLow }); for (let q = 0; q < 4; q++) V.put(pb, x + r.int(-3, 3), y - r.int(1, 5), r.chance(0.6) ? BG[r.int(0, 2)] : FL[r.int(1, 3)]); }
    if (EV) for (const hs of front.houses) if (hash2(hs.x, 1, 3) < 0.6) lowFx.lanterns.push([hs.x + 3, hs.y - hs.h + 2, 4]);
  }, {
    tag: 'low', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      V.drawFlags(g, lowFx.flags, ox, oy, t);
      if (EV) { V.drawPulse(g, lowFx.lanterns, ox, oy, t, '#ffb050', 0.4, 0.15, 3); g.fillStyle = '#ffe0a0'; for (const [x, y] of lowFx.lanterns) g.fillRect(x + ox, y + oy, 1, 2); }
      V.drawMotes(g, EV ? 22 : 16, t, 13, { y0: 40, y1: 230, col: EV ? '#ffd8a0' : '#fff6d0' });
    },
  });
  function drawTurbines(g, cam, Ly, list) {
    const [ox, oy] = B.vofs(Ly, cam), t = T();
    const spin = (L.windSpin ? L.windSpin() : 1.3) / 1.3;
    for (const tb of list) {
      const x = tb.x + ox, y = tb.y + oy;
      if (x < -30 || x > W + 30) continue;
      if (!tb.rot) tb.rot = V.rotor(tb.R, { k: tb.k });
      V.drawRotor(g, tb.rot, x, y, t * tb.sp * spin + tb.ph);
    }
  }
  for (const Lb of labels) Lb.when = (sc) => !V.labelClash(Lb, sc);
  BIOME_LABELS.plaza = labels;
  B.vistaInfo = { planes: B.layers.length, ms: Object.assign({}, V.stats.ms) };
  return B;
};

BIOME_LABELS.plaza = BIOME_LABELS.plaza || [];
