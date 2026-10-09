/* =====================================================================
   1e_bio_oasis.js — BIOMA OASIS (Nivel 08 «El Oasis de las Raíces»)
   con el kit VISTA. Sustituye a BIOMES.oasis de 16_biomes.js.
   El oasis está al sureste de la isla: al fondo las cordilleras lilas y,
   muy lejos, la cúpula de ARIDIA; un mar de dunas rodea el valle; las
   mesetas llevan aerogeneradores, FV y la tubería de permeado que llega
   desde SYNARA; la colina del oasis tiene terrazas con canales y
   cascadas, aldea de adobe, invernaderos y banco de semillas; delante,
   un humedal con garzas y, junto al plano jugable, huertos y frutales.
   Planos (atrás → delante): cielo+sol+rayos (0) · cirros · cúmulos altos ·
   cordillera lila (0,06) · cúmulos bajos · dunas (0,12) · mesetas con
   energía (0,2) · colina del oasis (0,3) · humedal (0,42) · huertos (0,56)
   La cámara del nivel queda en cam.y = 0 (suelo jugable en y ≈ 282).
   ===================================================================== */
var BIOME_LABELS = (typeof BIOME_LABELS !== 'undefined') ? BIOME_LABELS : {};

BIOMES.oasis = function (L) {
  const V = VISTA;
  const B = new Backdrop(L.width, L.height);
  const CY0 = 0; // cam.y típica de este nivel
  /** y de pantalla real (con cam.y = CY0) → yScreen de vplane */
  const at = (f, y) => Math.round(y - (V.CAMY - CY0) * f * 0.3);
  const HZ = 160;
  const SUN = { x: 452, y: 34, r: 11, halo: 26 };
  const labels = [];
  const T = () => Game.time;
  B.horizon = HZ;
  B.sun = SUN;
  B.sky = V.timed('sky', () => V.sky(W, H, {
    horizonY: HZ, sun: SUN,
    stops: ['#1468e0', '#1a76e8', '#2484ee', '#3092f4', '#3c9ef8', '#50aaf8', '#6cb8f6', '#8ec6f2', '#b0d0ec', '#cad4e6'],
    haze: ['#d6cad6', '#e0cccc', '#ead4c6', '#f0dcc4'],
  }).toCanvas());
  // halo del sol y rayos crepusculares (aditivos, detrás de todo el relieve)
  const raysC = V.timed('rays', () => V.rays(W, 200, SUN.x, SUN.y, { n: 8, len: 220, a0: 0.13, a1: 0.5, a2: 2.7, seed: 8 }));
  B.vdyn(0, (g) => {
    const t = T();
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.7 + 0.3 * Math.sin(t * 0.25);
    g.drawImage(raysC, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    V.sunBloom(g, SUN, t, { a: 0.34 });
  }, { tag: 'sun' });
  /* ---------------- nubes altas ---------------- */
  B.cloudDeck({ kind: 'cirrus', n: 6, seed: 31, f: [0.01, 0.03], y: [6, 46], w: [70, 160], speed: [1, 2] });
  B.cloudDeck({ n: 7, seed: 37, f: [0.03, 0.07], y: [-6, 56], w: [50, 124], bias: 0.6, speed: [2, 3.5], sunX: SUN.x });
  /* ---------------- cúmulos bajos (tras la cordillera) ---------------- */
  B.cloudDeck({ n: 6, seed: 41, f: [0.08, 0.11], y: [54, 100], w: [86, 130], speed: [1.4, 2.4], sunX: SUN.x, tall: true, haze: 0.08, hazeCol: '#e0d0d8' });
  /* ---------------- cordillera lila lejana con ARIDIA (0,06) ---------------- */
  const farGl = [];
  B.vplane(0.06, at(0.06, HZ - 74), 76, (pb, w, h) => {
    const r = RNG(171), peaks = [];
    for (let x = -40; x < w + 60;) {
      if (r.chance(0.25)) { x += r.int(50, 120); continue; }
      const ww = r.int(44, 120);
      peaks.push({ x: x + ww * 0.5, v: r.int(14, 34), h: r.int(20, 60), w: ww, d: r.int(16, 30) });
      x += r.int(30, 80);
    }
    peaks.push({ x: 236, v: 20, h: 48, w: 90, d: 24, k: 0.9 });
    const info = V.relief(pb, {
      yBase: h - 1, nv: 44, dvy: 0.32, seed: 173, hMax: 60,
      H: V.massif(peaks, { seed: 173, rough: 0.5, scale: 0.05, apron: 5, spurs: 5, spurW: 0.4, plateaus: [{ x: 236, w: 22, h: 44 }] }),
      ramp: V.RAMPS.far, contrast: 2.0, t0: 0.55,
      haze: { col: '#c4bcdc', k0: 0.02, k: 0.22 }, mist: { col: '#d4c8dc', h: 14, k: 0.55 }, rim: '#f0c8b4', tex: 0.04,
    });
    // ARIDIA muy lejos: cúpula y torres diminutas, casi disueltas en la bruma
    const dc = V.domeCity(pb, 236, info.top[236] + 9, { k: 0.52, s: 0.27, label: false });
    farGl.push([236 - 3, dc.top + 8]);
  }, { tag: 'far', dyn: (g, cam, Ly) => { const [ox, oy] = B.vofs(Ly, cam), t = T(); for (const [x, y] of farGl) V.drawGlow(g, x + ox, y + oy, 2, '#d8fcff', 0.3 + 0.25 * Math.sin(t * 1.1)); } });
  /* ---------------- mar de dunas (0,12) ---------------- */
  let duneCrests = [];
  B.vplane(0.12, at(0.12, 126), 62, (pb, w, h) => {
    const D = V.dunes(pb, { y0: 30, y1: 56, rows: 3, hBack: 14, hFront: 26, wMin: 60, wMax: 150, k0: 0.36, k1: 0.12, hazeCol: '#dccad6', seed: 121 });
    duneCrests = D.crests.filter(c => c[2] === 2).map(([x, y]) => [x, y]);
    // caravana diminuta sobre la duna delantera (silueta cálida)
    const C = V.P32(['#3a2418', '#6a4028', '#9a6038']);
    for (const cx of [410, 424, 438]) { const y = D.tops[2][cx] - 1; V.put(pb, cx, y - 2, C[1]); V.put(pb, cx + 1, y - 2, C[1]); V.put(pb, cx + 2, y - 3, C[2]); V.put(pb, cx, y - 1, C[0]); V.put(pb, cx + 2, y - 1, C[0]); }
  }, { tag: 'dunes', dyn: (g, cam, Ly) => { const [ox, oy] = B.vofs(Ly, cam); V.drawSandWisps(g, duneCrests, ox, oy, T(), { n: 3, a: 0.5 }); } });
  /* ---------------- mesetas con energía y tubería de permeado (0,2) ---------------- */
  const mesaT = [], mesaFx = { flow: [], pv: [], glows: [] };
  B.vplane(0.2, at(0.2, 92), 116, (pb, w, h) => {
    const r = RNG(201), peaks = [], plats = [];
    for (let x = -20; x < w + 60;) {
      const ww = r.int(70, 140), hh = r.int(28, 62);
      peaks.push({ x: x + ww * 0.5, v: r.int(10, 26), h: hh, w: ww, d: r.int(20, 32), k: 0.7 });
      if (r.chance(0.6)) plats.push({ x: x + ww * 0.5, w: ww * 0.28, h: hh * 0.82 });
      x += r.int(100, 170) + (r.chance(0.45) ? r.int(60, 130) : 0);
    }
    const info = V.relief(pb, {
      yBase: h - 1, nv: 48, dvy: 0.36, seed: 203, hMax: 70,
      H: V.massif(peaks, { seed: 203, rough: 0.55, scale: 0.04, apron: 6, spurs: 6, spurW: 0.5, plateaus: plats }),
      ramp: V.RAMPS.hill, contrast: 2.2, t0: 0.56, facet: 0.34, cav: 0.1,
      haze: { col: '#c8a8c0', k0: 0.12, k: 0.16 }, mist: { col: '#e4cccc', h: 22, k: 0.55 }, rim: '#ffdcae', tex: 0.05,
      veg: { ramp: V.RAMPS.vegMid, density: 0.02, maxSlope: 0.5, minY: 50 },
    });
    // aerogeneradores en las mesetas
    for (const P of plats) {
      const x = Math.round(P.x); if (x < 8 || x >= w - 8) continue;
      for (const dx of [-14, 12]) {
        const bx = x + dx, y = info.top[bx] + 1; if (y > h - 24) continue;
        const hub = V.turbineTower(pb, bx, y, 30, { k: 0.18, w: 2 });
        mesaT.push({ x: hub.hx, y: hub.hy, R: 12, k: 0.18, sp: 1.8 + (bx % 7) * 0.2, ph: bx });
      }
    }
    // campo FV en el llano entre mesetas
    for (const x0 of [300, 760]) if (x0 < w - 80) {
      const P = V.pvArray(pb, x0, h - 12, { tables: 3, cols: 12, rows: 2, cw: 4, ch: 2, gap: 2, skew: 2, k: 0.16, shift: 3 });
      mesaFx.pv.push(V.shadowCopy(pb, P.x0 - 2, P.y0 - 1, P.x1 - P.x0 + 6, P.y1 - P.y0 + 4));
    }
    // tubería de permeado desde SYNARA (sobre pilares) hasta el oasis: agua para mezclar con el pozo salobre
    const py = h - 22, PERM = ['#0c2e4a', '#217b9c', '#22c1e7', '#71dfef', '#abfafd'];
    for (let x = 0; x < w; x += 18) for (let yy = py + 2; yy < h - 2; yy++) V.put(pb, x, yy, V.P32(V.hz(V.TECH.CONC, 0.2))[yy === py + 2 ? 6 : 3]);
    V.pipe(pb, [[0, py], [w - 1, py]], 1, PERM, { k: 0.12, flange: 18 });
    mesaFx.flow.push([[0, py], [w - 1, py]]);
  }, {
    tag: 'mesa', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      drawTurbines(g, cam, Ly, mesaT);
      drawPvShade(g, mesaFx.pv, ox, oy, t);
      for (const p of mesaFx.flow) V.drawFlowC(g, p, ox, oy, t, { col: '#e8feff', speed: 16, gap: 9 });
    },
  });
  /* ---------------- colina del oasis: terrazas, aldea, cascadas (0,3) ---------------- */
  const hillFalls = [], hillFx = { fauna: [], glows: [], wheels: [] };
  const HILL_YS = 40, HILL_LY = at(0.3, HILL_YS) + Math.round(V.CAMY * 0.09);
  B.vplane(0.3, at(0.3, HILL_YS), 196, (pb, w, h) => {
    const k = 0.07, r = RNG(301);
    const info = V.relief(pb, {
      yBase: h - 1, nv: 40, dvy: 0.3, seed: 303, hMax: 128,
      H: V.massif([
        { x: 330, v: 20, h: 134, w: 150, d: 28, k: 1.1 }, { x: 236, v: 10, h: 70, w: 150, d: 22, k: 0.55 }, { x: 456, v: 12, h: 88, w: 110, d: 22, k: 0.9 },
        { x: 820, v: 18, h: 122, w: 140, d: 26, k: 1.1 }, { x: 740, v: 10, h: 64, w: 150, d: 20, k: 0.55 }, { x: 960, v: 12, h: 84, w: 110, d: 22 },
        { x: 1150, v: 14, h: 106, w: 130, d: 24, k: 1.0 }, { x: 1230, v: 10, h: 58, w: 130, d: 18, k: 0.55 }, { x: 590, v: 8, h: 40, w: 80, d: 16 }, { x: 60, v: 10, h: 50, w: 100, d: 18 },
      ], { seed: 303, rough: 0.5, scale: 0.05, apron: 5, spurs: 7, spurW: 0.5, plateaus: [{ x: 330, w: 26, h: 124 }, { x: 820, w: 22, h: 112 }, { x: 1150, w: 20, h: 98 }] }),
      ramp: V.RAMPS.low, contrast: 2.0, t0: 0.54, facet: 0.32, cav: 0.1,
      haze: { col: '#c8a8b8', k0: 0.06, k: 0.08 }, mist: { col: '#e8d4c4', h: 18, k: 0.4 }, rim: '#fde0a8', tex: 0.06,
      veg: { ramp: V.RAMPS.vegHill, density: 0.16, maxSlope: 1.2, minY: 30, size: 3 },
    });
    // terrazas en curvas de nivel que abrazan cada cerro (la cima queda de roca con el manantial)
    const TER = [
      { cx: 330, steps: 8, hwTop: 34, hwBot: 124, bow: 11, seed: 307, kinds: ['rows', 'vine', 'flowers', 'rows', 'orchard', 'rows', 'vine', 'flowers'], falls: [{ x: 327, w: 6, from: 0, to: 5 }, { x: 268, w: 3, from: 3, to: 6 }] },
      { cx: 820, steps: 7, hwTop: 30, hwBot: 110, bow: 10, seed: 311, kinds: ['orchard', 'rows', 'flowers', 'vine', 'rows', 'orchard', 'rows'], falls: [{ x: 817, w: 5, from: 0, to: 4 }] },
      { cx: 1150, steps: 6, hwTop: 26, hwBot: 92, bow: 9, seed: 313, kinds: ['vine', 'rows', 'orchard', 'rows', 'flowers', 'rows'], falls: [{ x: 1148, w: 4, from: 0, to: 3 }, { x: 1190, w: 3, from: 2, to: 5 }] },
    ];
    for (const t of TER) {
      t.yTop = info.top[t.cx] + 34;
      const R = V.contourTerraces(pb, Object.assign({ stepH: [10, 12], wallK: 0.42, k }, t));
      hillFalls.push(...R.falls);
      // cascada del manantial: baja por la roca desde la cisterna de la cima hasta la primera terraza
      const f0 = t.falls[0], y0 = info.top[t.cx] + 4, y1 = t.yTop + Math.round(t.bow * 0.55) + 1;
      if (y1 - y0 > 5) {
        const ym = Math.round((y0 + y1) / 2);
        V.fall(pb, f0.x, y0, ym, f0.w - 1, { k }); hillFalls.push({ x: f0.x, y0, y1: ym, w: f0.w - 1 });
        const RK = V.P32(V.RAMPS.low);
        for (let xx = f0.x - 3; xx < f0.x + f0.w + 3; xx++) { V.put(pb, xx, ym + 2, RK[2]); V.put(pb, xx, ym + 1, RK[7]); V.put(pb, xx, ym, U(xx < f0.x || xx >= f0.x + f0.w ? '#3adcf1' : '#e8f8fc')); }
        V.fall(pb, f0.x, ym + 2, y1, f0.w, { k }); hillFalls.push({ x: f0.x, y0: ym + 2, y1, w: f0.w });
      }
    }
    // manantial con cisterna en la meseta superior de cada colina
    for (const [x, ww] of [[330, 20], [820, 16], [1150, 14]]) {
      const y = info.top[x] + 3;
      V.box3q(pb, x - ww / 2 - 2, y + 2, ww + 4, 3, 6, { ramp: V.AGRO.ADOBE, k });
      for (let xx = x - ww / 2; xx < x + ww / 2; xx++) { V.put(pb, xx, y - 1, U('#3adcf1')); V.put(pb, xx, y - 2, U(xx % 5 ? '#11bedd' : '#bde9f2')); }
      hillFx.glows.push([x, y - 2]);
    }
    // aldea de adobe en los hombros, banco de semillas con cúpula y torre de agua
    for (let i = 0; i < 30; i++) {
      const x = r.pick([r.int(150, 215), r.int(470, 560), r.int(620, 705), r.int(955, 1060), r.int(1235, 1280), r.int(20, 120)]);
      const y = info.onSurf(x, r.int(3, 14)); if (y == null || y < 40 || y > h - 10) continue;
      V.adobe(pb, x, y + 1, r.int(7, 12), r.int(5, 8), 3100 + i, { k });
    }
    { const x = 540, y = info.onSurf(x, 6); if (y != null) { V.house(pb, x - 10, y + 1, 20, 10, 3201, { k, roof: 'dome', tint: '#e6ae72' }); hillFx.glows.push([x + 2, y - 14]); } }
    { const x = 1000, y = info.onSurf(x, 6); if (y != null) V.waterTower(pb, x, y + 1, 30, { k }); }
    // invernaderos y casa-malla junto a las terrazas
    for (const [x, ww, hh] of [[480, 30, 11], [612, 26, 10], [960, 32, 12], [1240, 24, 10]]) { const y = info.onSurf(x + ww / 2, 4); if (y != null && y < h - 4) V.greenhouse(pb, x, y + 2, ww, hh, { k }); }
    { const y = info.onSurf(150, 4); if (y != null) V.shadeHouse(pb, 136, y + 2, 34, 12, { k }); }
    // molinos de bombeo (rueda animada)
    for (const x of [610, 1040]) { const y = info.onSurf(x, 4); if (y == null) continue; const m = V.windPump(pb, x, y + 1, 22, { k }); hillFx.wheels.push({ x: m.hx, y: m.hy, R: 6 }); }
    // palmeras y vegetación densa
    V.scatterVeg(pb, (x) => (Math.abs(x - 330) < 22 || Math.abs(x - 820) < 18) ? null : info.top[x] + 1, 0, w, 3301, { k, gap: 6, mix: { tree: 4, shrub: 3, palm: 3, flower: 1 }, ramp: V.RAMPS.vegHill });
    for (let x = 10; x < w; x += r.int(16, 34)) { const y = info.onSurf(x, r.int(0, 3)); if (y != null && y > h - 60) V.palm(pb, x, y + 2, r.int(20, 30), r.range(-4, 4), 3400 + x, { k }); }
    // fauna: drones agrícolas, águila
    hillFx.fauna.push({ kind: 'drone', x: 380, y: info.top[330] - 22, r: 26 }, { kind: 'drone', x: 880, y: info.top[820] - 18, r: 20 }, { kind: 'eagle', x: 700, y: 20, r: 120 });
    labels.push({ x: 352, y: HILL_LY + info.top[330] - 26, f: 0.3, title: 'TERRAZAS', sub: 'Riego por gravedad', kind: 'green', ax: 330, ay: HILL_LY + info.top[330] + 8 });
  }, {
    tag: 'hill', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      V.drawFalls(g, hillFalls, ox, oy, t, { speed: 44, alpha: 0.85 });
      for (const [x, y] of hillFx.glows) V.drawGlow(g, x + ox, y + oy, 4, '#7ff4ff', 0.35 + 0.2 * Math.sin(t * 1.7 + x));
      for (const m of hillFx.wheels) { const x = m.x + ox; if (x < -20 || x > W + 20) continue; if (!m.s) m.s = V.pumpWheel(m.R, { k: 0.07 }); V.drawStrip(g, m.s, Math.floor(t * 9 + m.x), x - m.s.c0, m.y + oy - m.s.c0); }
      V.drawFauna(g, hillFx.fauna, ox, oy, t);
    },
  });
  /* ---------------- humedal con laguna, carrizo y garzas (0,42) ---------------- */
  const wetFx = { ponds: [], flocks: [] };
  const WET_YS = 172;
  B.vplane(0.42, at(0.42, WET_YS), 84, (pb, w, h) => {
    const k = 0.04, r = RNG(421);
    // orilla baja de pradera húmeda
    const info = V.relief(pb, {
      yBase: h - 1, nv: 24, dvy: 0.4, seed: 423, hMax: 30,
      H: V.massif([
        { x: 120, v: 10, h: 26, w: 120, d: 16 }, { x: 420, v: 10, h: 22, w: 140, d: 16 }, { x: 760, v: 10, h: 28, w: 130, d: 16 },
        { x: 1080, v: 10, h: 24, w: 150, d: 16 }, { x: 1400, v: 10, h: 26, w: 120, d: 16 }, { x: 1600, v: 10, h: 20, w: 100, d: 16 },
      ], { seed: 423, rough: 0.35, scale: 0.06, apron: 3, base: 6 }),
      ramp: ['#1e2a10', '#2e4014', '#46581a', '#5e7020', '#7a8a2a', '#98a438', '#b8bc4a', '#d4d064'], contrast: 1.5, t0: 0.58,
      haze: { col: '#b8b8a8', k0: 0.04, k: 0.06 }, rim: '#f4f0a0', tex: 0.08,
      veg: { ramp: V.RAMPS.vegLow, density: 0.16, maxSlope: 1.4, minY: 0, size: 3 },
    });
    // lagunas (agua dulce mezclada que se depura en el humedal)
    for (const [cx, hw] of [[260, 110], [620, 90], [960, 130], [1320, 100], [1700, 80]]) {
      if (cx - hw > w) continue;
      const y = h - 30;
      const P = V.pond(pb, cx, y, hw, 22, { k, seed: cx });
      wetFx.ponds.push(P);
      V.reeds(pb, cx - hw - 6, cx - hw * 0.5, y + 4, { k, seed: cx + 1, h: 10 });
      V.reeds(pb, cx + hw * 0.55, cx + hw + 8, y + 6, { k, seed: cx + 2, h: 11 });
      V.reeds(pb, cx - hw * 0.4, cx + hw * 0.3, y + 1, { k: k + 0.04, seed: cx + 3, h: 6, density: 0.25 });
      for (let i = 0; i < 4; i++) V.egret(pb, cx + r.int(-hw * 0.6, hw * 0.6), y + r.int(6, 14), { k, flip: r.chance(0.5) });
    }
    // borde delantero del humedal: carrizo y matorral de ribera
    V.scatterVeg(pb, (x) => h - 3 - Math.round(vnoise(x * 0.05, 1, 9) * 4), 0, w, 4201, { k, gap: 5, mix: { shrub: 4, tree: 2, flower: 1 }, ramp: V.RAMPS.vegLow });
    V.reeds(pb, 0, w, h - 1, { k, seed: 4211, h: 9, density: 0.45 });
    // pasarela de madera sobre la laguna central
    const WD = V.P32(V.hz(V.AGRO.WOOD, k));
    for (let x = 870; x < 1060; x++) { V.put(pb, x, h - 18, WD[5]); V.put(pb, x, h - 17, WD[3]); if (x % 8 === 0) for (let yy = h - 16; yy < h - 10; yy++) V.put(pb, x, yy, WD[1]); if (x % 4 === 0) V.put(pb, x, h - 21, WD[4]); }
    for (let x = 870; x < 1060; x++) V.put(pb, x, h - 21, WD[x % 4 === 0 ? 4 : 2]);
    // palmeras datileras y arbolado de ribera
    V.scatterVeg(pb, (x) => info.top[x] < h - 34 ? info.top[x] + 1 : null, 0, w, 4301, { k, gap: 9, mix: { tree: 4, shrub: 3, palm: 2 }, ramp: V.RAMPS.vegLow, scale: 1.2 });
    for (let x = 30; x < w; x += r.int(40, 90)) { const y = info.top[x]; if (y < h - 30) V.palm(pb, x, y + 2, r.int(26, 38), r.range(-5, 5), 4400 + x, { k }); }
    wetFx.flocks.push({ x: 600, y: 18, n: 7, sp: 9, span: 1500, col: '#fbfbff' }, { x: 1300, y: 4, n: 5, sp: -7, span: 1400, col: '#f2f4ff', ph: 400 });
    labels.push({ x: 1000, y: at(0.42, WET_YS) + Math.round(V.CAMY * 0.126) + h - 64, f: 0.42, title: 'HUMEDAL', sub: 'Filtro vivo', kind: 'water', ax: 960, ay: at(0.42, WET_YS) + Math.round(V.CAMY * 0.126) + h - 26 });
  }, {
    tag: 'wet', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      for (const P of wetFx.ponds) {
        const x0 = Math.round(P.x0 + ox); if (x0 > W || P.x1 + ox < 0) continue;
        V.drawSeaFx(g, x0 + 10, P.y + oy + 1, P.x1 - P.x0 - 20, Math.round(P.d * 0.7), t, { density: 0.6, sunX: SUN.x > x0 && SUN.x < P.x1 + ox ? SUN.x : null });
      }
      for (const fl of wetFx.flocks) V.drawFlock(g, fl, ox, oy, t);
    },
  });
  /* ---------------- huertos y frutales junto al plano jugable (0,56) ---------------- */
  const nearFx = { ch: [], fauna: [] };
  const NEAR_YS = 198;
  B.vplane(0.56, at(0.56, NEAR_YS), 96, (pb, w, h) => {
    const k = 0.02, r = RNG(561);
    // banda de suelo: arena al oeste (borde del desierto), vega verde al este; costura orgánica en clusters
    const nearH = V.massif([
      { x: 40, v: 22, h: 16, w: 120, d: 14 }, { x: 300, v: 26, h: 14, w: 150, d: 16 }, { x: 640, v: 24, h: 12, w: 160, d: 16 }, { x: 960, v: 26, h: 14, w: 150, d: 16 },
      { x: 1280, v: 24, h: 12, w: 170, d: 16 }, { x: 1600, v: 26, h: 14, w: 150, d: 16 }, { x: 1850, v: 22, h: 12, w: 120, d: 16 },
    ], { seed: 563, rough: 0.3, scale: 0.05, apron: 3, base: 3 });
    const relO = { yBase: h - 1, nv: 34, dvy: 1.4, seed: 563, hMax: 34, H: nearH, contrast: 1.5, t0: 0.6, haze: { col: '#c0b0a0', k0: 0.02, k: 0.04 }, rim: '#fff0a8', tex: 0.08 };
    V.relief(pb, Object.assign({}, relO, { x1: 300, ramp: V.AGRO.DUNE }));
    const sand = pb.data.slice();
    const info = V.relief(pb, Object.assign({}, relO, {
      x0: 150, ramp: ['#1a2a0c', '#2a3e10', '#3e5614', '#56701a', '#728a22', '#90a42e', '#b0bc40', '#ccd258'],
      veg: { ramp: V.RAMPS.vegLow, density: 0.1, maxSlope: 1.4, minY: 0, size: 3 },
    }));
    for (let y = 0; y < h; y++) for (let x = 150; x < 300; x++) { const q = (x - 150) / 150 + (vnoise(x * 0.08, y * 0.12, 5) - 0.5) * 0.7; if (q < 0.5 && (sand[y * w + x] >>> 24)) pb.data[y * w + x] = sand[y * w + x]; }
    for (let x = 14; x < 230; x += r.int(18, 40)) { const y = info.top[x] + 1; if (y < h - 4) ART.cactus(pb, x, y + 2, r.int(8, 14), x); }
    // huertas (bancales con canal), frutales en hileras y palmeras datileras
    let fi = 0;
    for (let x0 = 236; x0 < w - 40; fi++) {
      const fw = r.int(130, 180), x1 = Math.min(w - 2, x0 + fw), y0 = h - 54 + r.int(-3, 3), y1 = h - 24;
      // seto de linde al fondo del bancal
      V.orchard(pb, x0 + 4, x1 - 4, y0 - 1, y0 - 1, { k: k + 0.02, seed: x0 + 7, rows: 1, r0: 3, r1: 3, gap: 2, fruit: false });
      if (fi % 2 === 0) { const C = V.cropRows(pb, x0, x1, y0, y1, { k, seed: x0, channelEvery: 4, kinds: r.shuffle(['lettuce', 'tomato', 'flowers', 'maize', 'squash']) }); nearFx.ch.push(...C.channels); }
      else V.orchard(pb, x0 + 3, x1 - 3, y0 + 6, y1, { k, seed: x0, rows: 3, r0: 3, r1: 5, gap: 4 });
      // linde: matorral y flores entre bancales
      V.scatterVeg(pb, () => y1 - 2, x1 + 1, x1 + 18, x0 + 13, { k, gap: 4, mix: { shrub: 3, tree: 2, flower: 2 }, ramp: V.RAMPS.vegLow });
      x0 = x1 + r.int(16, 26);
    }
    // casas de labor, casa-malla y torre de agua de la vega
    for (const [x, ww, hh, s] of [[440, 12, 8, 1], [760, 14, 9, 2], [1060, 11, 7, 3], [1400, 13, 8, 4], [1690, 12, 8, 5]]) if (x < w - 10) V.adobe(pb, x, h - 22, ww, hh, 5600 + s, { k });
    if (w > 1130) V.shadeHouse(pb, 1110, h - 22, 46, 14, { k });
    if (w > 1460) V.waterTower(pb, 1460, h - 22, 38, { k });
    for (let x = 200; x < w; x += r.int(36, 80)) V.palm(pb, x, h - 14, r.int(34, 50), r.range(-6, 6), 5700 + x, { k });
    nearFx.fauna.push({ kind: 'drone', x: 700, y: h - 60, r: 30 }, { kind: 'drone', x: 1500, y: h - 64, r: 24 });
  }, {
    tag: 'near', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      // destellos que corren por los canales de riego
      g.fillStyle = '#e8ffff';
      for (const [x0, x1, y] of nearFx.ch) { const a = x0 + ox, b = x1 + ox; if (b < 0 || a > W) continue; for (let x = a + ((t * 18) % 14); x < b; x += 14) g.fillRect(Math.round(x), y + oy, 2, 1); }
      V.drawFauna(g, nearFx.fauna, ox, oy, t);
      V.drawMotes(g, 18, t, 11, { y0: 120, y1: 270, col: '#fff2b0' });
    },
  });
  function drawTurbines(g, cam, Ly, list) {
    const [ox, oy] = B.vofs(Ly, cam), t = T();
    for (const tb of list) {
      const x = tb.x + ox, y = tb.y + oy;
      if (x < -30 || x > W + 30) continue;
      if (!tb.rot) tb.rot = V.rotor(tb.R, { k: tb.k });
      V.drawRotor(g, tb.rot, x, y, t * tb.sp + tb.ph);
    }
  }
  function drawPvShade(g, list, ox, oy, t) {
    for (const S of list) {
      const span = S.w + 80, cx = ((t * 4.5 + S.x * 0.7) % span) - 40, cw = 22;
      const a0 = Math.max(0, Math.round(cx - cw / 2)), a1 = Math.min(S.w, Math.round(cx + cw / 2));
      if (a1 > a0) g.drawImage(S.c, a0, 0, a1 - a0, S.h, S.x + ox + a0, S.y + oy, a1 - a0, S.h);
    }
  }
  for (const Lb of labels) Lb.when = (sc) => !V.labelClash(Lb, sc);
  BIOME_LABELS.oasis = labels;
  B.vistaInfo = { planes: B.layers.length, ms: Object.assign({}, V.stats.ms) };
  return B;
};

BIOME_LABELS.oasis = BIOME_LABELS.oasis || [];
