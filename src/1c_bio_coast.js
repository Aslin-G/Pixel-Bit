/* =====================================================================
   1c_bio_coast.js — BIOMA COSTA (Nivel 01) con el kit de panorama VISTA.
   Sustituye a BIOMES.coast de 13_bg.js. Planos (atrás → delante):
     cielo+sol (0) · cirros (0,01–0,03) · cúmulos altos (0,03–0,07) ·
     mar lejano (0,1) · cordillera lila (0,1) · cúmulos bajos (0,09–0,12) ·
     montañas medias esculpidas con aerogeneradores (0,18) · colina de la
     ciudad ARIDIA con cúpula, torres y cascadas (0,26) · terrazas
     agrícolas con canales y cascadas (0,36) · costa con FV, H₂ y la
     planta SYNARA en su plataforma (0,5)
   Publica BIOME_LABELS.coast (etiquetas de los planos lejanos) y B.seaY(cam).
   ===================================================================== */
var BIOME_LABELS = (typeof BIOME_LABELS !== 'undefined') ? BIOME_LABELS : {};

BIOMES.coast = function (L) {
  const V = VISTA;
  const B = new Backdrop(L.width, L.height);
  const HZ = 140;
  const SUN = { x: 408, y: 24, r: 11, halo: 24 };
  const planeY = (f, ys) => Math.round(ys + V.CAMY * f * 0.3);
  const labels = [];
  B.horizon = HZ;
  B.sun = SUN;
  B.sky = V.timed('sky', () => V.sky(W, H, { horizonY: HZ, sun: SUN }).toCanvas());
  /** y de pantalla del horizonte marino para la cámara dada */
  B.seaY = (cam) => Math.round(HZ - (((cam && cam.y) || 0) - V.CAMY) * 0.03);
  const T = () => Game.time;
  /* ---------------- nubes altas ---------------- */
  B.cloudDeck({ kind: 'cirrus', n: 6, seed: 3, f: [0.01, 0.03], y: [6, 50], w: [70, 160], speed: [1, 2] });
  B.cloudDeck({ n: 8, seed: 11, f: [0.03, 0.07], y: [-4, 54], w: [50, 128], bias: 0.6, speed: [2, 3.5], sunX: SUN.x });
  /* ---------------- mar lejano (0,1) ---------------- */
  B.vplane(0.1, HZ, H - HZ + 12, (pb) => V.seaFar(pb, 0, pb.h, { seed: 5 }), {
    tag: 'sea', dyn: (g, cam, Ly) => {
      const [, oy] = B.vofs(Ly, cam);
      V.drawSeaFx(g, 0, oy, W, 64, T(), { sunX: SUN.x, density: 0.9 });
    },
  });
  /* ---------------- cordillera lejana lila (0,1) ---------------- */
  B.vplane(0.1, HZ - 64, 65, (pb, w, h) => {
    const r = RNG(77), peaks = [];
    for (let x = -40; x < w + 60;) {
      if (r.chance(0.3)) { x += r.int(60, 140); continue; }
      const ww = r.int(40, 110);
      peaks.push({ x: x + ww * 0.5, v: r.int(14, 34), h: r.int(18, 52), w: ww, d: r.int(16, 30) });
      x += r.int(28, 80);
    }
    V.relief(pb, {
      yBase: h - 1, nv: 44, dvy: 0.32, seed: 7, hMax: 52,
      H: V.massif(peaks, { seed: 7, rough: 0.5, scale: 0.05, apron: 5, spurs: 5, spurW: 0.4 }),
      ramp: V.RAMPS.far, contrast: 2.0, t0: 0.55,
      haze: { col: '#b9bde0', k0: 0.0, k: 0.22 }, mist: { col: '#c3c7e6', h: 12, k: 0.5 }, rim: '#e8c2b4', tex: 0.04,
    });
  }, { tag: 'far' });
  /* ---------------- cúmulos bajos (algunos tras las montañas) ---------------- */
  B.cloudDeck({ n: 6, seed: 23, f: [0.09, 0.12], y: [40, 92], w: [90, 136], speed: [1.5, 2.5], sunX: SUN.x, tall: true, haze: 0.06 });
  /* ---------------- montañas medias (0,18) ---------------- */
  const midT = [];
  B.vplane(0.18, 16, 140, (pb, w, h) => {
    const r = RNG(91), peaks = [];
    for (let x = -30; x < w + 60;) {
      if (r.chance(0.2)) { x += r.int(50, 110); continue; }
      const ww = r.int(70, 150), hh = r.int(46, 112);
      peaks.push({ x: x + ww * 0.5, v: r.int(18, 40), h: hh, w: ww, d: r.int(24, 40) });
      if (r.chance(0.6)) peaks.push({ x: x + ww * r.range(0.15, 0.85), v: r.int(4, 14), h: hh * r.range(0.35, 0.6), w: ww * 0.55, d: 18 });
      x += r.int(70, 150);
    }
    const info = V.relief(pb, {
      yBase: h - 1, nv: 56, dvy: 0.4, seed: 19, hMax: 112,
      H: V.massif(peaks, { seed: 19, rough: 0.6, scale: 0.034, apron: 7, spurs: 6, spurW: 0.45 }),
      ramp: V.RAMPS.mid, contrast: 2.3, facet: 0.35, cav: 0.1,
      haze: { col: '#a9a6cc', k0: 0.0, k: 0.14 }, mist: { col: '#b4b4d8', h: 30, k: 0.55 }, rim: '#f6dcc8', tex: 0.05,
      veg: { ramp: V.RAMPS.vegMid, density: 0.025, maxSlope: 0.6, minY: 72 },
    });
    // aerogeneradores pequeños en crestas (los más lejanos)
    for (const x of [150, 470, 690, 980]) {
      if (x >= w) continue;
      let bx = x; for (let q = -20; q <= 20; q++) if (info.top[x + q] < info.top[bx]) bx = x + q;
      const y = info.top[bx] + 1; if (y > h - 30) continue;
      const hub = V.turbineTower(pb, bx, y, 22, { k: 0.3, w: 2 });
      midT.push({ x: hub.hx, y: hub.hy, R: 9, k: 0.3, sp: 1.9 + (x % 7) * 0.2, ph: x });
    }
  }, { tag: 'mid', dyn: (g, cam, Ly) => drawTurbines(g, cam, Ly, midT) });
  /* ---------------- colina de la ciudad ARIDIA (0,26) ---------------- */
  const cityT = [], cityFalls = [], cityGlints = [];
  const CITY_X = 520;
  B.vplane(0.26, 0, 194, (pb, w, h) => {
    const k = 0.1, r = RNG(41);
    const peaks = [
      { x: CITY_X, v: 24, h: 128, w: 170, d: 32, k: 0.8 }, { x: CITY_X - 92, v: 14, h: 70, w: 96, d: 22 }, { x: 330, v: 12, h: 50, w: 80, d: 18 },
      { x: CITY_X + 100, v: 14, h: 72, w: 100, d: 22 }, { x: 770, v: 10, h: 46, w: 82, d: 18 }, { x: 880, v: 10, h: 38, w: 70, d: 16 },
      { x: 1010, v: 20, h: 84, w: 124, d: 26, k: 0.9 }, { x: 1115, v: 14, h: 56, w: 90, d: 20 }, { x: 250, v: 8, h: 26, w: 60, d: 14 },
    ];
    const info = V.relief(pb, {
      yBase: h - 1, nv: 46, dvy: 0.3, seed: 41, hMax: 100,
      H: V.massif(peaks, { seed: 41, rough: 0.5, scale: 0.045, apron: 6, plateaus: [{ x: CITY_X, w: 76, h: 98 }, { x: 1010, w: 44, h: 78 }] }),
      ramp: V.RAMPS.hill, contrast: 2.2, t0: 0.54, facet: 0.32, cav: 0.1,
      haze: { col: '#b0a8d0', k0: 0.0, k: 0.1 }, mist: { col: '#c6bcd8', h: 14, k: 0.3 }, rim: '#fcd8ae', tex: 0.06,
      veg: { ramp: V.RAMPS.vegHill, density: 0.12, maxSlope: 1.1, minY: 92, size: 3 },
    });
    // vegetación densa en las crestas (copas redondas, matorral, palmeras)
    V.scatterVeg(pb, (x) => (x > CITY_X - 58 && x < CITY_X + 58) ? null : info.top[x] + 1, 240, w, 4101, { k: k + 0.02, gap: 6, mix: { tree: 4, shrub: 4, palm: 1 }, ramp: V.RAMPS.vegHill });
    // casas blancas en las laderas
    for (let i = 0; i < 26; i++) {
      const x = r.pick([r.int(360, 470), r.int(575, 720), r.int(940, 1100), r.int(800, 900)]);
      const y = info.onSurf(x, r.int(3, 16)); if (y == null || y < 70 || y > h - 8) continue;
      V.house(pb, x, y + 1, r.int(6, 10), r.int(4, 7), 4200 + i, { k: k + 0.02 });
    }
    // aerogeneradores en la cresta izquierda y en la segunda colina
    for (const [x, th, R] of [[296, 46, 17], [346, 52, 19], [396, 42, 16], [444, 50, 18], [905, 40, 16], [1084, 46, 17]]) {
      let bx = x; for (let q = -8; q <= 8; q++) if (info.top[x + q] < info.top[bx]) bx = x + q;
      const y = info.top[bx] + 2; const hub = V.turbineTower(pb, bx, y, th, { k: 0.12 });
      cityT.push({ x: hub.hx, y: hub.hy, R, k: 0.12, sp: 2.2 + (x % 5) * 0.35, ph: x * 0.37 });
    }
    // ciudad de ARIDIA sobre la meseta y torres del segundo distrito
    const py = info.top[CITY_X];
    const dc = V.domeCity(pb, CITY_X, py + 8, { k: 0.04, s: 0.86 });
    for (const [x, hh, ww] of [[985, 30, 5], [996, 44, 6], [1010, 36, 5], [1024, 50, 6], [1038, 28, 5]]) V.tower(pb, x, info.top[x] + 3, ww, hh, x, { k: 0.12 });
    cityGlints.push([CITY_X - 12, dc.top + 24], [CITY_X + 8, dc.top + 30]);
    // cascadas desde la base de la ciudad, en escalones con repisa de roca, poza y espuma
    for (const F of dc.falls) {
      let y0 = dc.base, x0 = F.x, wf = F.w;
      const tiers = F.w > 8 ? [0.3, 0.27, 0.24, 0.19] : [0.45, 0.55], total = h - 4 - y0;
      for (let ti = 0; ti < tiers.length; ti++) {
        const y1 = Math.round(y0 + total * tiers[ti]);
        V.fall(pb, x0, y0, y1, wf, { k: 0.02 });
        cityFalls.push({ x: x0, y0, y1, w: wf });
        // repisa de roca (labio iluminado) y poza turquesa bajo la espuma
        const RK = V.P32(V.RAMPS.hill);
        for (let xx = x0 - 4; xx < x0 + wf + 4; xx++) { V.put(pb, xx, y1 + 2, RK[2]); V.put(pb, xx, y1 + 1, RK[7]); V.put(pb, xx, y1, U(xx < x0 || xx >= x0 + wf ? '#3adcf1' : '#e8f8fc')); }
        y0 = y1 + 2; x0 += (ti % 2 ? -2 : 2); if (wf > 8) wf += 2;
      }
    }
    // árboles en los hombros de la meseta
    for (let i = 0; i < 18; i++) { const x = CITY_X + r.pick([-1, 1]) * r.int(48, 80); const y = info.onSurf(x, r.int(4, 18)); if (y != null) V.tree(pb, x, y + 1, r.int(3, 5), 4300 + i, { k }); }
  }, {
    tag: 'city', dyn: (g, cam, Ly) => {
      drawTurbines(g, cam, Ly, cityT);
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      V.drawFalls(g, cityFalls, ox, oy, t, { speed: 40, alpha: 0.8 });
      // destellos del cristal de la cúpula
      for (const [x, y] of cityGlints) { const a = 0.35 + 0.35 * Math.sin(t * 1.3 + x); V.drawGlow(g, x + ox, y + oy, 3, '#bff8ff', a); }
    },
  });
  /* ---------------- terrazas agrícolas (0,36) ---------------- */
  const terrFalls = [], terrFauna = [];
  const TERR_YS = 36, TERR_LY = planeY(0.36, TERR_YS);
  B.vplane(0.36, TERR_YS, 162, (pb, w, h) => {
    const k = 0.05, r = RNG(61);
    // cerros cálidos en los que se tallan las terrazas (siguen su contorno)
    const info = V.relief(pb, {
      yBase: h - 1, nv: 34, dvy: 0.3, seed: 63, hMax: 112,
      H: V.massif([
        { x: 770, v: 18, h: 116, w: 150, d: 26, k: 0.95 }, { x: 650, v: 12, h: 84, w: 130, d: 20, k: 0.8 }, { x: 560, v: 10, h: 56, w: 90, d: 16 }, { x: 905, v: 10, h: 56, w: 90, d: 16 },
        { x: 1190, v: 14, h: 96, w: 160, d: 22, k: 0.85 }, { x: 1320, v: 10, h: 54, w: 80, d: 16 }, { x: 1010, v: 8, h: 26, w: 60, d: 14 }, { x: 470, v: 8, h: 28, w: 70, d: 14 },
      ], { seed: 63, rough: 0.42, scale: 0.05, apron: 4 }),
      ramp: V.RAMPS.low, contrast: 1.8, haze: { col: '#c0a8c0', k0: 0.04, k: 0.06 }, rim: '#fde0a8', tex: 0.06,
      veg: { ramp: V.RAMPS.vegLow, density: 0.12, maxSlope: 1.2, minY: 40, size: 3 },
    });
    const TA = V.carveTerraces(pb, info, { x0: 560, x1: 930, yTop: 74, yBot: h - 16, stepH: [8, 12], wallK: 0.4, k, seed: 61, kinds: ['rows', 'vine', 'flowers', 'rows', 'orchard', 'rows', 'vine'], falls: [{ x: 704, w: 6, from: 0 }, { x: 788, w: 3, from: 2 }] });
    const TB = V.carveTerraces(pb, info, { x0: 1060, x1: 1340, yTop: 76, yBot: h - 16, stepH: [9, 11], wallK: 0.4, k, seed: 67, kinds: ['rows', 'orchard', 'rows', 'vine', 'flowers'], falls: [{ x: 1166, w: 4, from: 0 }] });
    terrFalls.push(...TA.falls, ...TB.falls);
    // invernaderos, casas de labor, palmeras y huertos
    V.greenhouse(pb, 952, h - 16, 30, 12, { k });
    V.greenhouse(pb, 1350, h - 12, 24, 10, { k });
    for (const [x, ww, hh, s] of [[990, 9, 6, 1], [500, 8, 5, 2], [1024, 7, 5, 3], [640, 7, 5, 4], [846, 8, 5, 5]]) { const y = info.onSurf(x, 10); if (y != null) V.house(pb, x, y + 1, ww, hh, 6100 + s, { k, roof: s % 2 ? 'terrace' : 'solar' }); }
    V.scatterVeg(pb, (x) => info.top[x] < h - 1 ? info.top[x] + 1 : null, 380, w, 6200, { k, gap: 6, mix: { tree: 5, shrub: 3, palm: 2, flower: 1 }, ramp: V.RAMPS.vegLow });
    for (let x = 440; x < w; x += r.int(14, 30)) if (info.top[x] < h - 6) V.palm(pb, x, h - 2, r.int(18, 28), r.range(-4, 4), 6300 + x, { k });
    // drones agrícolas y etiqueta
    const tA = info.top[730];
    terrFauna.push({ kind: 'drone', x: 790, y: tA - 16, r: 30 }, { kind: 'drone', x: 1200, y: info.top[1190] - 14, r: 24 });
    labels.push({ x: 800, y: TERR_LY + tA - 30, f: 0.36, title: 'AGRICULTURA', sub: 'Sostenible', kind: 'green', ax: 770, ay: TERR_LY + tA + 12 });
  }, {
    tag: 'terr', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      V.drawFalls(g, terrFalls, ox, oy, t, { speed: 46, alpha: 0.85 });
      V.drawFauna(g, terrFauna, ox, oy, t);
    },
  });
  /* ---------------- costa: FV, H₂, planta SYNARA (0,5) ---------------- */
  const COAST_YS = 96, COAST_LY = planeY(0.5, COAST_YS);
  const coastFx = { pv: [], glows: [], perm: null, outfall: null, fauna: [] };
  B.vplane(0.5, COAST_YS, 112, (pb, w, h) => {
    const k = 0.03, r = RNG(81);
    const yB = h - 16; // línea de costa (pantalla ≈ 192)
    const peaks = [
      { x: 384, v: 16, h: 54, w: 90, d: 18 }, { x: 470, v: 12, h: 40, w: 70, d: 16 }, { x: 566, v: 12, h: 46, w: 56, d: 16 }, { x: 680, v: 12, h: 34, w: 70, d: 16 }, { x: 850, v: 14, h: 44, w: 70, d: 18 },
      { x: 950, v: 16, h: 58, w: 100, d: 20, k: 0.9 }, { x: 1060, v: 12, h: 46, w: 80, d: 18 }, { x: 1180, v: 10, h: 30, w: 70, d: 16 },
      { x: 1330, v: 14, h: 40, w: 100, d: 18 }, { x: 1480, v: 16, h: 62, w: 100, d: 20 }, { x: 1600, v: 12, h: 44, w: 70, d: 16 },
    ];
    const info = V.relief(pb, {
      yBase: yB, nv: 30, dvy: 0.32, seed: 83, hMax: 60,
      H: V.massif(peaks, { seed: 83, rough: 0.45, scale: 0.055, apron: 3, plateaus: [{ x: 402, w: 50, h: 34 }, { x: 944, w: 50, h: 32 }, { x: 1306, w: 64, h: 22 }] }),
      ramp: V.RAMPS.low, contrast: 1.7, haze: { col: '#c8b0c0', k0: 0.0, k: 0.05 }, rim: '#fde6b0', tex: 0.07,
      veg: { ramp: V.RAMPS.vegLow, density: 0.1, maxSlope: 1.1, minY: 20, size: 3 },
    });
    // playa y espuma donde la tierra toca el mar
    const SAND = V.P32(['#c58440', '#edaf5f', '#fccf85']), FOAM = V.P32(['#7cdfec', '#d2ecee', '#ffffff']);
    for (let x = 0; x < w; x++) {
      if (info.top[x] > yB) continue;
      V.put(pb, x, yB - 1, SAND[1 + (hash2(x, 1, 3) < 0.5 ? 1 : 0)]); V.put(pb, x, yB, SAND[0]);
      V.put(pb, x, yB + 1, FOAM[(x >> 2) % 3 === 0 ? 2 : 1]); if (hash2(x >> 1, 2, 5) < 0.6) V.put(pb, x, yB + 2, FOAM[0]);
    }
    // FV en la meseta izquierda (3 mesas) y campo FV a la derecha
    const pvA = V.pvArray(pb, 364, info.yAt(402, 12) - 1, { tables: 3, cols: 11, rows: 2, cw: 5, ch: 3, gap: 3, skew: 3, k, shift: 2 });
    const pvB = V.pvArray(pb, 1256, info.yAt(1300, 6) - 1, { tables: 3, cols: 14, rows: 2, cw: 5, ch: 3, gap: 3, skew: 3, k, shift: 2 });
    for (const P of [pvA, pvB]) coastFx.pv.push(V.shadowCopy(pb, P.x0 - 2, P.y0 - 1, P.x1 - P.x0 + 6, P.y1 - P.y0 + 4));
    // casas, palmeras y vegetación
    for (const [x, ww, hh, s] of [[612, 8, 5, 1], [650, 9, 6, 2], [700, 7, 5, 3], [1090, 9, 6, 4], [1124, 7, 5, 5], [1380, 8, 6, 6], [1540, 9, 6, 7], [1572, 7, 5, 8]]) {
      const y = info.onSurf(x, 8); if (y != null) V.house(pb, x, y + 1, ww, hh, 8100 + s, { k, roof: s % 3 === 0 ? 'solar' : null });
    }
    V.scatterVeg(pb, (x) => info.top[x] < yB - 1 ? info.top[x] + 1 : null, 300, w, 8200, { k, gap: 8, mix: { tree: 3, shrub: 4, palm: 2, flower: 1 } });
    for (let x = 300; x < w; x += r.int(26, 60)) if (info.top[x] < yB - 2) V.palm(pb, x, yB - 1, r.int(18, 28), r.range(-5, 5), 8300 + x, { k });
    // planta de hidrógeno verde en la meseta central
    const h2 = V.h2Plant(pb, 896, info.yAt(940, 8) - 1, { k, s: 1 });
    coastFx.glows.push(...h2.glows);
    labels.push({ x: h2.label.x, y: COAST_LY + h2.label.y - 2, f: 0.5, title: 'H₂ VERDE', sub: 'Hidrógeno', kind: 'green', ax: h2.label.x, ay: COAST_LY + h2.label.y + 8 });
    // cadena desaladora SYNARA en su plataforma sobre la orilla
    // depósito de agua potable en la ladera (fin de la tubería de permeado, sube hacia el pueblo)
    const tkX = 568, tkY = (info.onSurf(tkX, 10) ?? 60) + 1;
    const dc = V.desalChain(pb, 330, yB + 4, { k, s: 1, climb: 0, permTo: [[tkX - 8, yB - 20], [tkX - 8, tkY - 4], [tkX - 6, tkY - 4]] });
    V.cylV(pb, tkX, tkY, 6, 11, V.ARCH.WHITE, { k, dome: 0.5, bands: [[3, 3, ['#0c2e4a', '#217b9c', '#22c1e7', '#71dfef', '#abfafd']]] });
    coastFx.perm = dc.perm; coastFx.outfall = dc.outfall;
    const A = dc.anchors;
    labels.push(
      { x: A.membranas.x - 40, y: COAST_LY + A.membranas.y - 22, f: 0.5, title: 'MEMBRANAS', kind: 'water', camX: [0, 760], ax: A.membranas.x, ay: COAST_LY + A.membranas.y + 8 },
      { x: A.potable.x + 40, y: COAST_LY + A.potable.y - 28, f: 0.5, title: 'AGUA POTABLE', sub: '(Permeado)', kind: 'water', camX: [0, 760], ax: A.potable.x + 10, ay: COAST_LY + A.potable.y + 8 },
      { x: A.salmuera.x - 4, y: COAST_LY + A.salmuera.y - 35, f: 0.5, title: 'SALMUERA', sub: '(Rechazo)', kind: 'brine', camX: [0, 760], ax: A.salmuera.x + 1, ay: COAST_LY + A.salmuera.y - 2 },
    );
    // rocas en la orilla con espuma
    for (let x = 300; x < w; x += r.int(30, 90)) {
      if (x > 326 && x < 566) continue;
      const rw = r.int(4, 9);
      V.ellipse(pb, x, yB + 1, rw, 3, (nx, ny) => V.P32(V.RAMPS.low)[clamp(Math.round(5 - nx * 2 - ny * 3), 0, 9)]);
      for (let q = -rw - 1; q <= rw + 1; q++) V.put(pb, x + q, yB + 3, FOAM[2]);
    }
    coastFx.fauna.push({ kind: 'drone', x: 940, y: 30, r: 40 }, { kind: 'gull', x: 420, y: 36, r: 260, sp: 7 }, { kind: 'gull', x: 1200, y: 26, r: 300, sp: -6 }, { kind: 'gull', x: 1210, y: 32, r: 300, sp: -5 });
  }, {
    tag: 'coast', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      // sombras de nube que recorren las filas FV (bajan la generación visiblemente)
      for (const S of coastFx.pv) {
        const span = S.w + 80, cx = ((t * 4.5 + S.x * 0.7) % span) - 40, cw = 26;
        const a0 = Math.max(0, Math.round(cx - cw / 2)), a1 = Math.min(S.w, Math.round(cx + cw / 2));
        if (a1 > a0) g.drawImage(S.c, a0, 0, a1 - a0, S.h, S.x + ox + a0, S.y + oy, a1 - a0, S.h);
        g.globalAlpha = 0.5;
        const b0 = Math.max(0, a0 - 8), b1 = Math.min(S.w, a1 + 8);
        if (a0 > b0) g.drawImage(S.c, b0, 0, a0 - b0, S.h, S.x + ox + b0, S.y + oy, a0 - b0, S.h);
        if (b1 > a1) g.drawImage(S.c, a1, 0, b1 - a1, S.h, S.x + ox + a1, S.y + oy, b1 - a1, S.h);
        g.globalAlpha = 1;
      }
      // halos esmeralda del H₂ (pulso suave)
      for (const [x, y, r] of coastFx.glows) V.drawGlow(g, x + ox, y + oy, r, '#4cd48e', 0.45 + 0.25 * Math.sin(t * 2 + x));
      // chevrones del permeado
      if (coastFx.perm) V.drawFlow(g, coastFx.perm, ox, oy, t, { col: '#f4ffff', speed: 12, gap: 6 });
      // pluma de salmuera controlada (magenta, se hunde y diluye junto al emisario)
      if (coastFx.outfall) {
        const { x, y } = coastFx.outfall;
        for (let i = 0; i < 12; i++) {
          const u = ((t * 0.25 + i / 12) % 1), px = x + ox + 1 + u * 16 + Math.sin(i * 2.1 + t) * 1.5, py = y + oy + 1 + u * 3;
          g.globalAlpha = 0.75 * (1 - u); g.fillStyle = i % 3 ? '#e07ecf' : '#c244a2'; g.fillRect(Math.round(px), Math.round(py), 1 + (u < 0.4 ? 1 : 0), 1);
        }
        g.globalAlpha = 1;
      }
      V.drawFauna(g, coastFx.fauna, ox, oy, t);
      V.drawMotes(g, 16, t, 7, { y0: 60, y1: 200 });
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
  // las etiquetas lejanas se ocultan si chocan con las del plano jugable (sc.def.labels)
  for (const Lb of labels) Lb.when = (sc) => !V.labelClash(Lb, sc);
  BIOME_LABELS.coast = labels;
  B.vistaInfo = { planes: B.layers.length, ms: Object.assign({}, V.stats.ms) };
  return B;
};

BIOME_LABELS.coast = BIOME_LABELS.coast || [];
