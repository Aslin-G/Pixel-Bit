/* =====================================================================
   19a_sca_title.js — Key art del TÍTULO (escenas A, kit VISTA + PF).
   Panorama cinematográfico al estilo de la referencia: Amaya y KIRU en
   el borde de un acantilado columnar con flora y poste de madera (primer
   plano izquierdo), la costa con la cadena desaladora SYNARA sobre su
   plataforma, corte submarino con peces y pluma de salmuera, la ciudad
   de ARIDIA con cúpula y cascadas, terrazas agrícolas, montañas con
   aerogeneradores, campos FV, la planta de H₂, cúmulos volumétricos,
   haces y resplandor solar. Todo estático se prerenderiza una vez.
   API:
     SCATitleArt.build()            → A (cacheado en BG_CACHE 'sca_title')
     SCATitleArt.render(g, A, t)    fondo completo + personajes + oclusores
   Planos (atrás → delante): cielo+sol · cirros · cúmulos altos · mar
   lejano · cordillera lila · cúmulos bajos · montañas medias con
   turbinas · colina de ARIDIA · terrazas · costa FV/H₂ · mar cercano ·
   SYNARA · corte submarino · acantilado · personajes · oclusores.
   ===================================================================== */
const SCATitleArt = (() => {
  const V = VISTA;
  const HZ = 150;
  const SUN = { x: 506, y: 30, r: 11, halo: 24 };
  const CLIFF_X1 = 220;         // borde del acantilado
  const CLIFF_Y = 254;          // línea de paso de Amaya
  const WY = 300;               // línea de agua del corte submarino
  const PLANT_X = 214, PLANT_Y = 132, PLANT_LY = 150; // SYNARA (plano local → pantalla y = LY + y; pie a y = 282)

  /** Águila grande (4 cuadros, 31×15) con plumas primarias abiertas */
  function eagleStrip() {
    return V.strip(4, 31, 15, (pb, i) => {
      const B = V.P32(['#1a0e08', '#2e1a0e', '#4a2c16', '#6a4422', '#8e6232', '#b48448', '#d8b070']);
      const lift = [-5, -2, 3, -1][i];
      for (const sd of [-1, 1]) for (let q = 1; q <= 14; q++) {
        const y = 7 + Math.round(lift * Math.pow(q / 14, 1.3)) + (q > 11 ? 1 : 0);
        const th = q < 4 ? 3 : q < 9 ? 2 : 1;
        for (let k = 0; k < th; k++) V.put(pb, 15 + sd * q, y + k, B[k === 0 ? (q > 10 ? 2 : 4) : k === 1 ? 2 : 1]);
        if (q > 10 && (q & 1)) V.put(pb, 15 + sd * q, y + 1, B[0]); // primarias separadas
      }
      for (let k = -1; k <= 2; k++) { V.put(pb, 15, 7 + k, B[k < 1 ? 5 : 3]); V.put(pb, 14, 7 + k, B[3]); V.put(pb, 16, 7 + k, B[2]); }
      V.put(pb, 15, 10, B[2]); V.put(pb, 14, 11, B[1]); V.put(pb, 16, 11, B[1]); V.put(pb, 15, 11, B[2]); // cola
      V.put(pb, 15, 5, U('#f4f0e6')); V.put(pb, 16, 5, U('#f4f0e6')); V.put(pb, 15, 4, U('#e8e2d4')); V.put(pb, 17, 5, U('#f0b030')); // cabeza blanca y pico
    });
  }

  function build() {
    if (BG_CACHE.has('sca_title')) return BG_CACHE.get('sca_title');
    const t0 = nowMs();
    const B = new Backdrop(W, H);
    const A = { B, fx: { turb: [], falls: [], glows: [], pglow: [], perm: [], feed: [], foam: [], pv: [], fauna: [], leds: [], glints: [] }, labels: [] };
    const FX = A.fx;
    B.horizon = HZ; B.sun = SUN;
    /* ---------------- cielo, sol y haces ---------------- */
    const sky = V.sky(W, H, { horizonY: HZ, sun: SUN });
    V.rays(sky, SUN.x, SUN.y, { n: 7, len: 300, a: 0.07, spread: 1.6, ang: Math.PI * 0.62, seed: 4, yMax: HZ + 10 });
    B.sky = sky.toCanvas();
    B.cloudDeck({ kind: 'cirrus', n: 5, seed: 13, f: [0.01, 0.03], y: [4, 44], w: [80, 170], speed: [1, 2] });
    B.cloudDeck({ n: 6, seed: 29, f: [0.03, 0.07], y: [-6, 40], w: [70, 150], bias: 0.5, speed: [2, 3.5], sunX: SUN.x });
    /* ---------------- mar lejano ---------------- */
    B.vplane(0, HZ, 120, (pb) => V.seaFar(pb, 0, pb.h, { seed: 9 }), {
      dyn: (g) => V.drawSeaFx(g, 0, HZ, W, 76, Game.time, { sunX: SUN.x, density: 1 }),
    });
    /* ---------------- cordillera lejana lila ---------------- */
    B.vplane(0, HZ - 66, 67, (pb, w, h) => {
      const peaks = [{ x: 30, v: 20, h: 40, w: 90, d: 22 }, { x: 120, v: 26, h: 54, w: 110, d: 26 }, { x: 214, v: 18, h: 36, w: 80, d: 18 }, { x: 300, v: 30, h: 60, w: 120, d: 28 }, { x: 390, v: 22, h: 46, w: 90, d: 22 }, { x: 470, v: 26, h: 56, w: 100, d: 24 }, { x: 600, v: 20, h: 44, w: 90, d: 20 }];
      V.relief(pb, {
        yBase: h - 1, nv: 44, dvy: 0.32, seed: 17, hMax: 60,
        H: V.massif(peaks, { seed: 17, rough: 0.5, scale: 0.05, apron: 5, spurs: 5, spurW: 0.4 }),
        ramp: V.RAMPS.far, contrast: 2.0, t0: 0.55,
        haze: { col: '#b9bde0', k0: 0.0, k: 0.22 }, mist: { col: '#c3c7e6', h: 12, k: 0.5 }, rim: '#e8c2b4', tex: 0.04,
      });
    });
    B.cloudDeck({ n: 4, seed: 41, f: [0.09, 0.12], y: [52, 96], w: [90, 130], speed: [1.5, 2.5], sunX: SUN.x, tall: true, haze: 0.06 });
    /* ---------------- montañas medias con aerogeneradores ---------------- */
    const midT = [];
    B.vplane(0, 36, 118, (pb, w, h) => {
      const peaks = [
        { x: 150, v: 26, h: 70, w: 120, d: 30 }, { x: 236, v: 34, h: 96, w: 140, d: 34, k: 0.9 }, { x: 318, v: 22, h: 64, w: 110, d: 26 },
        { x: 396, v: 30, h: 88, w: 130, d: 32 }, { x: 466, v: 18, h: 52, w: 90, d: 22 }, { x: 60, v: 14, h: 40, w: 90, d: 20 },
      ];
      const info = V.relief(pb, {
        yBase: h - 1, nv: 56, dvy: 0.4, seed: 23, hMax: 100,
        H: V.massif(peaks, { seed: 23, rough: 0.6, scale: 0.034, apron: 7, spurs: 6, spurW: 0.45 }),
        ramp: V.RAMPS.mid, contrast: 2.3, facet: 0.35, cav: 0.1,
        haze: { col: '#a9a6cc', k0: 0.0, k: 0.14 }, mist: { col: '#b4b4d8', h: 26, k: 0.5 }, rim: '#f6dcc8', tex: 0.05,
        veg: { ramp: V.RAMPS.vegMid, density: 0.03, maxSlope: 0.6, minY: 70 },
      });
      for (const [x, th, R] of [[204, 26, 10], [252, 30, 11], [300, 24, 9], [372, 28, 10], [420, 30, 11]]) {
        let bx = x; for (let q = -14; q <= 14; q++) if (info.top[x + q] < info.top[bx]) bx = x + q;
        const y = info.top[bx] + 1;
        const hub = V.turbineTower(pb, bx, y, th, { k: 0.26, w: 2 });
        midT.push({ x: hub.hx, y: hub.hy + 36, R, k: 0.26, sp: 2 + (x % 7) * 0.2, ph: x });
      }
    }, { dyn: (g) => drawTurbines(g, midT) });
    /* ---------------- colina de ARIDIA (derecha) ---------------- */
    const CITY_X = 556, CITY_LY = 20;
    const cityT = [], cityFalls = [], cityGlints = [];
    B.vplane(0, CITY_LY, 192, (pb, w, h) => {
      const k = 0.08, r = RNG(47);
      const peaks = [
        { x: CITY_X, v: 22, h: 92, w: 170, d: 30, k: 0.85 }, { x: CITY_X - 96, v: 14, h: 58, w: 96, d: 22 }, { x: 640, v: 16, h: 72, w: 100, d: 22 },
        { x: 436, v: 10, h: 40, w: 70, d: 18 }, { x: 400, v: 8, h: 24, w: 60, d: 14 },
      ];
      const info = V.relief(pb, {
        yBase: h - 1, nv: 46, dvy: 0.3, seed: 43, hMax: 100,
        H: V.massif(peaks, { seed: 43, rough: 0.5, scale: 0.045, apron: 6, plateaus: [{ x: CITY_X, w: 80, h: 80 }] }),
        ramp: V.RAMPS.hill, contrast: 2.2, t0: 0.54, facet: 0.32, cav: 0.1, x0: 360,
        haze: { col: '#b0a8d0', k0: 0.0, k: 0.1 }, mist: { col: '#c6bcd8', h: 14, k: 0.3 }, rim: '#fcd8ae', tex: 0.06,
        veg: { ramp: V.RAMPS.vegHill, density: 0.12, maxSlope: 1.1, minY: 92, size: 3 },
      });
      V.scatterVeg(pb, (x) => (x > CITY_X - 60 && x < CITY_X + 60) || info.top[x] >= h - 2 ? null : info.top[x] + 1, 380, w, 4701, { k: k + 0.02, gap: 6, mix: { tree: 4, shrub: 4, palm: 1 }, ramp: V.RAMPS.vegHill });
      for (let i = 0; i < 18; i++) {
        const x = r.pick([r.int(440, 490), r.int(620, 640), r.int(470, 500)]);
        const y = info.onSurf(x, r.int(3, 14)); if (y == null || y < 90 || y > h - 8) continue;
        V.house(pb, x, y + 1, r.int(6, 10), r.int(4, 7), 4800 + i, { k: k + 0.02 });
      }
      for (const [x, th, R] of [[452, 40, 15], [486, 46, 17], [628, 42, 16]]) {
        let bx = x; for (let q = -8; q <= 8; q++) if (info.top[x + q] < info.top[bx]) bx = x + q;
        const y = info.top[bx] + 2; const hub = V.turbineTower(pb, bx, y, th, { k: 0.12 });
        cityT.push({ x: hub.hx, y: hub.hy + CITY_LY, R, k: 0.12, sp: 2.4 + (x % 5) * 0.3, ph: x * 0.37 });
      }
      const py = info.top[CITY_X];
      const dc = V.domeCity(pb, CITY_X, py + 8, { k: 0.03, s: 0.92 });
      cityGlints.push([CITY_X - 11, dc.top + 22 + CITY_LY], [CITY_X + 8, dc.top + 28 + CITY_LY]);
      for (const F of dc.falls) {
        let y0 = dc.base, x0 = F.x, wf = F.w;
        const tiers = F.w > 8 ? [0.32, 0.3, 0.38] : [0.45, 0.55], total = h - 4 - y0;
        for (let ti = 0; ti < tiers.length; ti++) {
          const y1 = Math.round(y0 + total * tiers[ti]);
          V.fall(pb, x0, y0, y1, wf, { k: 0.02 });
          cityFalls.push({ x: x0, y0: y0 + CITY_LY, y1: y1 + CITY_LY, w: wf });
          const RK = V.P32(V.RAMPS.hill);
          for (let xx = x0 - 4; xx < x0 + wf + 4; xx++) { V.put(pb, xx, y1 + 2, RK[2]); V.put(pb, xx, y1 + 1, RK[7]); V.put(pb, xx, y1, U(xx < x0 || xx >= x0 + wf ? '#3adcf1' : '#e8f8fc')); }
          y0 = y1 + 2; x0 += (ti % 2 ? -2 : 2); if (wf > 8) wf += 2;
        }
      }
      for (let i = 0; i < 16; i++) { const x = CITY_X + r.pick([-1, 1]) * r.int(48, 84); const y = info.onSurf(x, r.int(4, 18)); if (y != null) V.tree(pb, x, y + 1, r.int(3, 5), 4900 + i, { k }); }
    }, {
      dyn: (g) => {
        drawTurbines(g, cityT);
        const t = Game.time;
        V.drawFalls(g, cityFalls, 0, 0, t, { speed: 40, alpha: 0.8 });
        for (const [x, y] of cityGlints) V.drawGlow(g, x, y, 3, '#bff8ff', 0.35 + 0.35 * Math.sin(t * 1.3 + x));
      },
    });
    /* ---------------- terrazas agrícolas (centro-derecha) ---------------- */
    const TER_LY = 104, terFalls = [];
    B.vplane(0, TER_LY, 124, (pb, w, h) => {
      const k = 0.05;
      const info = V.relief(pb, {
        yBase: h - 1, nv: 34, dvy: 0.3, seed: 67, hMax: 100, x0: 300,
        H: V.massif([
          { x: 452, v: 16, h: 86, w: 130, d: 24, k: 0.95 }, { x: 380, v: 12, h: 54, w: 100, d: 18 }, { x: 540, v: 12, h: 70, w: 120, d: 20 }, { x: 330, v: 8, h: 26, w: 60, d: 14 }, { x: 630, v: 10, h: 60, w: 90, d: 16 },
        ], { seed: 67, rough: 0.42, scale: 0.05, apron: 4 }),
        ramp: V.RAMPS.low, contrast: 1.8, haze: { col: '#c0a8c0', k0: 0.04, k: 0.06 }, rim: '#fde0a8', tex: 0.06,
        veg: { ramp: V.RAMPS.vegLow, density: 0.12, maxSlope: 1.2, minY: 30, size: 3 },
      });
      const TA = V.carveTerraces(pb, info, { x0: 384, x1: 560, yTop: 44, yBot: h - 14, stepH: [8, 11], wallK: 0.4, k, seed: 71, kinds: ['rows', 'vine', 'flowers', 'rows', 'orchard', 'rows', 'vine'], falls: [{ x: 440, w: 5, from: 0 }, { x: 410, w: 3, from: 2 }] });
      for (const f of TA.falls) terFalls.push({ x: f.x, y0: f.y0 + TER_LY, y1: f.y1 + TER_LY, w: f.w });
      V.greenhouse(pb, 352, h - 10, 26, 10, { k });
      V.scatterVeg(pb, (x) => info.top[x] < h - 1 ? info.top[x] + 1 : null, 300, w, 7200, { k, gap: 7, mix: { tree: 5, shrub: 3, palm: 2, flower: 1 }, ramp: V.RAMPS.vegLow });
      FX.fauna.push({ kind: 'drone', x: 470, y: TER_LY + info.top[452] - 14, r: 26 });
    }, { dyn: (g) => V.drawFalls(g, terFalls, 0, 0, Game.time, { speed: 46, alpha: 0.85 }) });
    /* ---------------- costa: FV, H₂, casas y palmeras ---------------- */
    const CO_LY = 148;
    B.vplane(0, CO_LY, 92, (pb, w, h) => {
      const k = 0.03, r = RNG(83), yB = h - 14;
      const info = V.relief(pb, {
        yBase: yB, nv: 30, dvy: 0.32, seed: 89, hMax: 50, x0: 160,
        H: V.massif([
          { x: 236, v: 14, h: 40, w: 90, d: 18 }, { x: 300, v: 12, h: 30, w: 70, d: 16 }, { x: 372, v: 16, h: 44, w: 80, d: 18, k: 0.9 }, { x: 430, v: 10, h: 26, w: 60, d: 14 },
          { x: 520, v: 12, h: 30, w: 80, d: 16 }, { x: 610, v: 12, h: 36, w: 80, d: 16 },
        ], { seed: 89, rough: 0.45, scale: 0.055, apron: 3, plateaus: [{ x: 250, w: 60, h: 30 }, { x: 372, w: 56, h: 34 }] }),
        ramp: V.RAMPS.low, contrast: 1.7, haze: { col: '#c8b0c0', k0: 0.0, k: 0.05 }, rim: '#fde6b0', tex: 0.07,
        veg: { ramp: V.RAMPS.vegLow, density: 0.1, maxSlope: 1.1, minY: 10, size: 3 },
      });
      const SAND = V.P32(['#c58440', '#edaf5f', '#fccf85']), FOAM = V.P32(['#7cdfec', '#d2ecee', '#ffffff']);
      for (let x = 160; x < w; x++) {
        if (info.top[x] > yB) continue;
        V.put(pb, x, yB - 1, SAND[1 + (hash2(x, 1, 3) < 0.5 ? 1 : 0)]); V.put(pb, x, yB, SAND[0]);
        V.put(pb, x, yB + 1, FOAM[(x >> 2) % 3 === 0 ? 2 : 1]); if (hash2(x >> 1, 2, 5) < 0.6) V.put(pb, x, yB + 2, FOAM[0]);
      }
      const pv = V.pvArray(pb, 206, info.yAt(250, 10) - 1, { tables: 3, cols: 12, rows: 2, cw: 5, ch: 3, gap: 3, skew: 3, k, shift: 2 });
      FX.pv.push(Object.assign(V.shadowCopy(pb, pv.x0 - 2, pv.y0 - 1, pv.x1 - pv.x0 + 6, pv.y1 - pv.y0 + 4), { ly: CO_LY }));
      for (let i = 0; i < 5; i++) FX.glints.push({ x: pv.x0 + 2, y: CO_LY + pv.y0 + 2 + i * 2, len: pv.x1 - pv.x0 - 4, dy: 0, ph: i * 0.3, sp: 0.22, a: 0.7 });
      for (const [x, ww, hh, s] of [[290, 8, 5, 1], [312, 9, 6, 2], [420, 7, 5, 3], [446, 9, 6, 4], [510, 8, 5, 5]]) {
        const y = info.onSurf(x, 8); if (y != null) V.house(pb, x, y + 1, ww, hh, 8400 + s, { k, roof: s % 2 ? 'solar' : null });
      }
      V.scatterVeg(pb, (x) => info.top[x] < yB - 1 ? info.top[x] + 1 : null, 170, w, 8500, { k, gap: 8, mix: { tree: 3, shrub: 4, palm: 2, flower: 1 } });
      for (let x = 260; x < w; x += r.int(24, 50)) if (info.top[x] < yB - 2) V.palm(pb, x, yB - 1, r.int(16, 24), r.range(-5, 5), 8600 + x, { k });
      const h2 = V.h2Plant(pb, 334, info.yAt(372, 8) - 1, { k, s: 0.9 });
      for (const [x, y, rr] of h2.glows) FX.glows.push([x, y + CO_LY, rr]);
      A.labels.push({ x: h2.label.x + 6, y: CO_LY + h2.label.y - 2, title: 'H₂ VERDE', sub: 'Hidrógeno', kind: 'green', ax: h2.label.x, ay: CO_LY + h2.label.y + 8 });
      FX.fauna.push({ kind: 'drone', x: 300, y: CO_LY + 6, r: 30 }, { kind: 'gull', x: 380, y: CO_LY - 20, r: 200, sp: 7 }, { kind: 'gull', x: 300, y: CO_LY - 30, r: 240, sp: -6 });
    });
    /* ---------------- mar cercano (bandas de profundidad y espuma) ---------------- */
    B.vplane(0, 226, WY - 226 + 2, (pb, w, h) => {
      const R = V.P32(V.expand(['#0a6fb8', '#0189d4', '#0692d5', '#11a8dc', '#11bedd', '#27cee1', '#3adcf1'], 14));
      const FO = V.P32(RAMP.foamR);
      for (let y = 0; y < h; y++) {
        const t = y / (h - 1);
        for (let x = 0; x < w; x++) {
          const n = (vnoise(x * 0.03, y * 0.09, 51) - 0.5) * 0.18 + (V.ridged(x * 0.02, y * 0.06, 3, 53) - 0.5) * 0.12;
          let u = R[V.band(clamp(0.18 + t * 0.78 + n, 0, 0.999), R.length, x, y, 0.05, 55)];
          // rizos de espuma que se ensanchan hacia el espectador
          const per = 6 + t * 10, ph = Math.sin(x * (0.06 - t * 0.03) + y * 0.9) * 2;
          if (((y + ph) % per) < 1 && vnoise(x * 0.05, y * 0.3, 57) > 0.58) u = FO[t > 0.5 ? 4 : 3];
          if (hash2(x, y, 59) < 0.004) u = FO[5];
          pb.data[y * w + x] = u;
        }
      }
    }, {
      dyn: (g) => {
        const t = Game.time;
        g.fillStyle = '#e6f8fc';
        for (let i = 0; i < 36; i++) {
          const y = 230 + Math.round(hash1(i, 3) * 66), len = 3 + Math.round((y - 226) / 10) + (i % 3);
          const x = Math.round((hash1(i, 5) * W + t * (4 + (y - 226) * 0.12)) % (W + 30)) - 15;
          const a = 0.5 + 0.5 * Math.sin(t * 2 + i);
          if (a < 0.4) continue;
          g.globalAlpha = a * 0.8; g.fillRect(x, y, len, 1);
        }
        g.globalAlpha = 1;
      },
    });
    /* ---------------- SYNARA: planta desaladora de plano medio (SCAKit.heroPlant) ---------------- */
    B.vplane(0, PLANT_LY, 170, (pb) => {
      const P = SCAKit.heroPlant(pb, PLANT_X, PLANT_Y, { k: 0, wp: 246 });
      const L = PLANT_LY, Aq = P.anchors;
      FX.perm.push(P.perm.map(([x, y]) => [x, y + L]), P.perm2.map(([x, y]) => [x, y + L]));
      FX.feed = P.feed.map(([x, y]) => [x, y + L]);
      for (const [x, y, c] of P.leds) FX.leds.push([x, y + L, c]);
      for (const [x, y, r] of P.glows) FX.pglow.push([x, y + L, r]);
      FX.foam = [{ x0: PLANT_X - 4, x1: P.x1 + 2, y: PLANT_Y + L + 1 }];
      A.labels.push(
        { x: Aq.captacion.x - 2, y: L + Aq.captacion.y - 4, title: 'CAPTACIÓN', kind: 'water', ax: Aq.captacion.x, ay: L + Aq.captacion.y + 6 },
        { x: Aq.pretrat.x + 8, y: L + Aq.pretrat.y - 2, title: 'PRETRATAMIENTO', kind: 'water', ax: Aq.pretrat.x, ay: L + Aq.pretrat.y + 8 },
        { x: Aq.membranas.x - 8, y: L + Aq.membranas.y + 2, title: 'MEMBRANAS', kind: 'water', ax: Aq.membranas.x, ay: L + Aq.membranas.y + 6 },
        { x: Aq.potable.x - 2, y: L + Aq.potable.y - 22, title: 'AGUA POTABLE', sub: '(Permeado)', kind: 'water', ax: Aq.potable.x + 10, ay: L + Aq.potable.y + 6 },
      );
      A.brineX = P.brine.x; A.intakeX = P.intake.x;
      A.labels.push({ x: P.brine.x - 34, y: WY + 54, title: 'SALMUERA', sub: '(Rechazo)', kind: 'brine' });
    }, {
      dyn: (g) => {
        const t = Game.time;
        for (const [x, y, r] of FX.pglow) V.drawGlow(g, x, y, r, '#48b6ec', 0.35 + 0.2 * Math.sin(t * 2.4 + x));
        for (const P of FX.perm) V.drawFlow(g, P, 0, 0, t, { col: '#ffffff', speed: 16, gap: 6 });
        V.drawFlow(g, FX.feed, 0, 0, t, { col: '#9cd8f8', speed: 10, gap: 5 });
        for (const [x, y, c] of FX.leds) if (Math.floor(t * 1.6 + x * 0.1) % 2) { g.fillStyle = c; g.fillRect(x, y, 1, 1); }
        SCAKit.foam(g, FX.foam, t);
      },
    });
    /* ---------------- corte submarino (kit PFWater con mundo ficticio) ---------------- */
    const bedAt = (x) => Math.round(352 - Math.max(0, 1 - (x - 230) / 120) * 18 + Math.sin(x * 0.05) * 2 + (vnoise(x * 0.03, 0, 5) - 0.5) * 8);
    const fakeW = {
      def: { pf: { terrain: [], bedAt, water: { reef: [[300, 420, 10], [520, 640, 9]], fish: 12, schools: 3, fishX: [250, 640] } } },
      w: W, h: H, ground: new Int16Array(W).fill(H), water: [], platforms: [],
    };
    A.water = PFWater.build(fakeW, { x0: CLIFF_X1 - 30, x1: W - 1, y: WY, crestFrom: 0, crestTo: 0 });
    A.wsc = { cam: { ox: 0, oy: 0, x: 0, y: 0 }, def: fakeW.def, state: { eco: 0.2 }, world: { ps: null } };
    /* ---------------- acantilado columnar del primer plano ---------------- */
    const gy = (x) => Math.round(CLIFF_Y + (x < 40 ? (40 - x) * 0.06 : 0) + Math.sin(x * 0.05) * 1.2 + (x > 200 ? (x - 200) * 0.05 : 0));
    const ground = new Int16Array(260);
    for (let x = 0; x < 260; x++) ground[x] = x < CLIFF_X1 ? gy(x) : 999;
    const cw = { def: { pf: { terrain: [{ x0: 0, x1: CLIFF_X1, surf: 'path', face: 'cliff', depth: 16, ledges: true }] } }, w: 260, h: H, ground, water: [], platforms: [] };
    const cliffC = PFTerrain.render(cw);
    const top = new PixelBuffer(260, H);
    PFTerrain.surface(top, cw);
    const fl = new PixelBuffer(260, H);
    // poste de madera con tablones en flecha (como la referencia)
    // flora del borde: pasto, flores, hibisco, lupinos, agave, helechos
    PFFlora.scatter(fl, (x) => gy(x) + 1, 96, CLIFF_X1 - 4, 31, { mix: { tuft: 5, flowers: 2, bush: 1, fern: 1 }, gap: 9 });
    PFFlora.hibiscusBush(fl, 198, gy(198) + 1, 20, 15, 5);
    PFFlora.agave(fl, 104, gy(104) + 1, 9, 3);
    for (let i = 0; i < 4; i++) PFFlora.lupine(fl, 84 + i * 4, gy(84) + 1, 16 + (i % 2) * 5, 40 + i);
    PFFlora.palm(fl, 82, gy(82) + 1, 66, -8, 11);
    PFSigns.post(fl, 6, gy(30), [{ text: 'DESALINIZACIÓN' }, { text: 'ENERGÍA SOLAR' }, { text: 'AGROECOLOGÍA' }, { text: 'ZONA ÁRIDA' }], 7, { font: 'tiny' });
    A.cliff = cliffC; A.cliffTop = top.toCanvas(); A.cliffFl = fl.toCanvas();
    /* ---------------- oclusores del primer plano ---------------- */
    A.canopy = PFFlora.canopy(250, 92, 31, { side: -1, n: 18, vines: 4 }).toCanvas();
    A.clumpL = PFFlora.fgClump(150, 96, 3, { spikes: 7, leaves: 13 }).toCanvas();
    A.clumpR = PFFlora.fgClump(124, 64, 8, { spikes: 3, leaves: 9 }).toCanvas();
    /* ---------------- fauna ---------------- */
    A.eagle = eagle();
    FX.fauna.push({ kind: 'gull', x: 520, y: 150, r: 160, sp: -5 }, { kind: 'drone', x: 610, y: 44, r: 20 });
    A.ms = Math.round(nowMs() - t0);
    BG_CACHE.set('sca_title', A);
    return A;

    function drawTurbines(g, list) {
      const t = Game.time;
      for (const tb of list) {
        if (!tb.rot) tb.rot = V.rotor(tb.R, { k: tb.k });
        V.drawRotor(g, tb.rot, tb.x, tb.y, t * tb.sp + tb.ph);
      }
    }
  }

  /** Dibuja el key art completo (sin logotipo ni menú) */
  const NOPS = { emit() { } };
  function render(g, A, t, ps) {
    const B = A.B, FX = A.fx;
    g.drawImage(B.sky, 0, 0);
    V.drawBloom(g, SUN.x, SUN.y, 30, '#fff4d0', 0.22, t);
    B.render(g, { x: 0, y: V.CAMY }, 'back');
    // sombra de nube que recorre el campo FV
    for (const S of FX.pv) {
      const span = S.w + 80, cx = ((t * 4.5) % span) - 40, cw = 26;
      const a0 = Math.max(0, Math.round(cx - cw / 2)), a1 = Math.min(S.w, Math.round(cx + cw / 2));
      if (a1 > a0) g.drawImage(S.c, a0, 0, a1 - a0, S.h, S.x + a0, S.y + S.ly + a0 * 0, a1 - a0, S.h);
    }
    V.drawGlints(g, FX.glints, 0, 0, t);
    for (const [x, y, r] of FX.glows) V.drawGlow(g, x, y, r, '#4cd48e', 0.4 + 0.25 * Math.sin(t * 2 + x));
    V.drawFauna(g, FX.fauna, 0, 0, t);
    // corte submarino + pluma de salmuera + cresta
    A.wsc.world.ps = ps || NOPS;
    PFWater.renderBack(g, A.wsc, A.water);
    drawUnderPipes(g, A, t);
    PFWater.renderFront(g, A.wsc, A.water);
    // etiquetas científicas
    for (const L of A.labels) WorldLabels.drawOne(g, L, { x: 0, y: 0 }, null);
    // acantilado
    g.drawImage(A.cliffTop, 0, 0);
    g.drawImage(A.cliff, 0, 0);
    g.drawImage(A.cliffFl, 0, 0);
    // águila
    const u = (t * 0.02) % 1, ex = 300 + Math.sin(u * TAU) * 70, ey = 120 + Math.sin(u * TAU * 2) * 8;
    V.drawStrip(g, A.eagle, (t % 4) < 1.2 ? Math.floor(t * 7) % 4 : 1, ex - 15, ey - 7, Math.cos(u * TAU) < 0);
    // personajes
    drawChar(g, 'kiru', 'idle', t, 116, 222, 1, { shadow: false, expr: 'esperanzado' });
    drawChar(g, 'amaya', A.pose || 'point', t, 162, CLIFF_Y, 1, { shadow: false });
    // oclusores
    g.drawImage(A.canopy, -26, -10);
    g.drawImage(A.clumpL, -20, H - 92);
    g.drawImage(A.clumpR, W - 104, H - 58);
    V.drawMotes(g, 18, t, 11, { y0: 120, y1: 300 });
  }
  /** Tuberías sumergidas y pluma de salmuera (sobre el corte submarino) */
  function drawUnderPipes(g, A, t) {
    const bx = A.brineX, ix = A.intakeX;
    // emisario de salmuera: baja (7 px), codo y tramo por el lecho hasta el difusor
    const BR = ['#06081a', '#141a32', '#262c48', '#3a405d', '#555a78', '#7a7e9e', '#262c48'];
    for (let q = 0; q < 7; q++) { g.fillStyle = BR[[1, 4, 5, 3, 2, 1, 0][q]]; g.fillRect(bx - 3 + q, WY - 6, 1, 24); g.fillRect(bx - 3, WY + 18 + q, 64, 1); }
    g.fillStyle = '#555a78'; for (let k = 0; k < 4; k++) g.fillRect(bx + 12 + k * 13, WY + 15, 3, 3);
    g.fillStyle = '#7a7e9e'; g.fillRect(bx - 4, WY + 6, 9, 2);
    // pluma magenta controlada: partículas que suben, se curvan con la corriente y se diluyen
    for (let i = 0; i < 28; i++) {
      const k = i % 4, u = ((t * 0.22 + i / 28) % 1);
      const px = bx + 13 + k * 13 + u * 24 + Math.sin(i * 1.7 + t * 1.3) * 2, py = WY + 14 - u * 13 + u * u * 18;
      g.globalAlpha = 0.85 * (1 - u); g.fillStyle = i % 3 ? '#e07ecf' : '#c244a2';
      g.fillRect(Math.round(px), Math.round(py), u < 0.45 ? 2 : 1, u < 0.25 ? 2 : 1);
    }
    g.globalAlpha = 1;
    // toma: tubería azul (5 px) hasta el cabezal con rejilla sobre zapata
    const FE = ['#0e2a48', '#4a9ad0', '#8cc8ec', '#2a72aa', '#1a4a78'];
    for (let q = 0; q < 5; q++) { g.fillStyle = FE[q]; g.fillRect(ix - 2 + q, WY - 6, 1, 30); }
    g.fillStyle = '#163e66'; g.fillRect(ix - 9, WY + 24, 19, 9);
    g.fillStyle = '#31b4e2'; g.fillRect(ix - 9, WY + 24, 19, 1);
    g.fillStyle = '#7fd8f6'; for (let k = 0; k < 6; k++) g.fillRect(ix - 8 + k * 3, WY + 26, 1, 6);
    g.fillStyle = '#5a5658'; g.fillRect(ix - 12, WY + 33, 25, 3);
  }
  let _eagle = null;
  function eagle() { return _eagle || (_eagle = eagleStrip()); }
  return { build, render, eagle, SUN, HZ, CLIFF_Y };
})();
