/* =====================================================================
   19n_scb_ending.js — Ilustraciones de los FINALES (640×164 sobre el
   panel de debrief) con el kit de panorama VISTA, en diorama 3/4:
   cielo + sol · nubes que derivan · cordillera lila · mar con destellos ·
   montañas medias con aerogeneradores · llano costero con la desaladora,
   FV e H₂ · colina de ARIDIA con la cúpula, la torre de SYNARA, terrazas y
   cascadas · barrio bajo con vecinos · cornisa columnar de primer plano con
   Amaya, KIRU y vecinos (drawChar) · palmera y follaje de encuadre.
   Cada final cambia luz, color, vegetación y detalles:
     mosaico  mañana clara y vibrante; la torre de SYNARA lleva el mosaico de
              datos comunitarios; guirnaldas, cometas y la plaza llena.
     pacto    amanecer tras la tormenta: nubes residuales encendidas desde
              abajo, andamio y grúa en la cúpula, tablero de decisiones pendientes.
     tecnica  luz fría y eficiente: la planta domina, vallas y puertas cerradas,
              pocas personas, ventanas apagadas; color desaturado.
     deuda    calima residual: cielo ocre, sol apagado, manglar seco en la orilla,
              pluma de salmuera; plan de reparación con plantones.
   SCBEnd.make(id) → {draw(g, t)}  (prerender ≈ 300–500 ms; ≈250 fillRect/cuadro)
   ===================================================================== */
const SCBEnd = (() => {
  const V = VISTA;
  const IH = 164; // alto de la ilustración
  const MOODS = {
    mosaico: {
      sun: { x: 556, y: 26, r: 11, halo: 26 }, sunKind: 'noon', HZ: 96,
      sky: ['#1466d8', '#1a74e2', '#2484ec', '#3292f2', '#40a0f6', '#58acf6', '#7cbcf2', '#a2caf0', '#c4d0ec', '#dcd2e2'],
      skyHaze: ['#d8cce0', '#e4cad4', '#ecd0c8', '#f0d8c4'], clouds: null, cloudN: 7,
      farHaze: '#b9bde0', farRim: '#e8c2b4', hzc: '#a9a6cc', rim: '#f6dcc8', rimN: '#fcd8ae',
      vegK: 1.5, gold: 0.25, lit: null, grade: { sat: 1.12 }, sea: null, folk: 46, festive: true,
    },
    pacto: {
      sun: { x: 452, y: 90, r: 13, halo: 34 }, sunKind: 'dusk', HZ: 96,
      sky: ['#2a1a5e', '#3a2470', '#523080', '#6e3c8c', '#8c4890', '#b05a90', '#d07090', '#ec9090', '#f8b48c', '#fcd49a'],
      skyHaze: ['#f4c0a0', '#f8c898', '#fcd8a0', '#ffe4b0'], cloudN: 6,
      clouds: ['#4a2a6a', '#6a3a7a', '#8c4a84', '#b05a88', '#d47088', '#f09488', '#fcb890', '#ffdcac'],
      farHaze: '#d4a8c0', farRim: '#ffd0a0', hzc: '#c49ab4', rim: '#ffc890', rimN: '#ffd8a0',
      vegK: 1.1, gold: 0.4, lit: { off: 0.45 }, grade: { sat: 1.02 }, folk: 26,
      sea: ['#e8b8b0', '#b49ac0', '#7a86c0', '#4a74b8', '#2a66ae', '#2a6aae', '#3474b4', '#3c80ba'], seaH: '#ffe0c0', scaffold: true, board: true, storm: true,
    },
    tecnica: {
      sun: { x: 300, y: 22, r: 10, halo: 22 }, sunKind: 'noon', HZ: 96,
      sky: ['#2a4a7a', '#30568a', '#3a6498', '#4672a6', '#5480b0', '#6890bc', '#7ea0c4', '#96b0cc', '#adbed2', '#c2cad6'],
      skyHaze: ['#c4ccd8', '#cad0da', '#d0d4dc', '#d6dae0'], cloudN: 5,
      clouds: ['#6a7a94', '#8494ac', '#9eacc0', '#b8c4d2', '#cfd8e2', '#e2e8ee', '#f0f4f6', '#ffffff'],
      farHaze: '#a8b4cc', farRim: '#d8dce6', hzc: '#9aa6c0', rim: '#e0e4ec', rimN: '#e8eaf0',
      vegK: 0.55, gold: 0.05, lit: null, grade: { sat: 0.62, tint: '#8aa8d0', tintK: 0.14 }, folk: 6, cold: true,
      sea: ['#b8c8dc', '#7a9ac0', '#4a7aae', '#2a64a0', '#1e5894', '#1e5a94', '#24629a', '#2a6aa0'], seaH: '#dce4ee',
    },
    deuda: {
      sun: { x: 508, y: 54, r: 12, halo: 30 }, sunKind: 'dusk', HZ: 96,
      sky: ['#4a2418', '#5e2e1c', '#743a20', '#8a4824', '#a0582a', '#b46a34', '#c47e40', '#d2944e', '#dcaa60', '#e4bc74'],
      skyHaze: ['#d8a878', '#dcb080', '#e0b888', '#e4c094'], cloudN: 5,
      clouds: ['#5a2a1a', '#74361e', '#8e4624', '#a8582e', '#c06e3a', '#d4884a', '#e2a460', '#eec080'],
      farHaze: '#c09078', farRim: '#e8b888', hzc: '#b08a78', rim: '#e8b080', rimN: '#ecc090',
      vegK: 0.45, gold: 0.6, lit: { off: 0.7 }, grade: { sat: 0.78, tint: '#c89060', tintK: 0.2, bright: 0.92 }, folk: 14, dust: true,
      sea: ['#c8a088', '#9a8a90', '#6a7690', '#46648a', '#345680', '#345882', '#3a5e86', '#40668a'], seaH: '#f0c8a0', mangrove: true,
    },
  };
  /** Ilustración del final id */
  function make(id) {
    const M = MOODS[id] || MOODS.pacto;
    const B = new Backdrop(W, H);
    const HZ = M.HZ, SUN = M.sun, T = () => Game.time;
    const fx = { turb: [], falls: [], glints: [], glows: [], perm: null, fauna: [], flags: [], kites: [], lanterns: [], tower: null, plume: null, beacons: [] };
    const P = (ys, h, draw, opts) => B.vplane(0, ys, h, (pb, w, hh) => { draw(pb, w, hh); SCBK.grade(pb, M.grade); }, opts);
    /* ---------- cielo, sol y haces ---------- */
    const sky = V.sky(W, IH, { horizonY: HZ, sun: SUN, curve: 1.15, stops: M.sky, haze: M.skyHaze });
    if (M.sunKind === 'dusk') V.sunDisc(sky, SUN.x, SUN.y, SUN.r, SUN.halo, 'dusk');
    V.rays(sky, SUN.x, SUN.y, M.sunKind === 'dusk' ? { n: 8, len: 300, col: M.dust ? '#ffd090' : '#ffe0b0', a: M.dust ? 0.07 : 0.11, spread: 2.8, ang: -Math.PI / 2, w: 0.05, seed: 4, yMax: HZ + 10 }
      : { n: 6, len: 220, col: '#fff6dc', a: M.cold ? 0.04 : 0.08, spread: 1.6, ang: Math.PI / 2 + 0.3, w: 0.04, seed: 4, yMax: HZ });
    SCBK.grade(sky, M.grade);
    const skyC = sky.toCanvas();
    B.vdyn(0, (g) => g.drawImage(skyC, 0, 0), { tag: 'sky' });
    B.vdyn(0, (g) => V.drawBloom(g, SUN.x, SUN.y, M.dust ? 56 : 42, M.dust ? '#ffb070' : M.cold ? '#f0f4ff' : M.sunKind === 'dusk' ? '#ffb070' : '#fff0c0', M.dust ? 0.3 : 0.22, T()), { tag: 'bloom' });
    /* ---------- nubes ---------- */
    B.cloudDeck({ kind: 'cirrus', n: 5, seed: 31, f: [0.01, 0.03], y: [4, 34], w: [80, 160], speed: [1, 2], pal: M.clouds ? M.clouds.slice(3, 7) : null });
    B.cloudDeck({ n: M.cloudN, seed: M.storm ? 51 : 37, f: [0.03, 0.07], y: [-4, 46], w: M.storm ? [80, 150] : [50, 120], bias: 0.6, speed: [2, 3.5], sunX: SUN.x, pal: M.clouds, tall: !!M.storm });
    /* ---------- cordillera lejana ---------- */
    P(HZ - 52, 54, (pb, w, h) => {
      const r = RNG(57), peaks = [];
      for (let x = 210; x < w + 60;) { const ww = r.int(50, 120); peaks.push({ x: x + ww * 0.5, v: r.int(14, 30), h: r.int(20, 48) * (x < 330 ? 0.55 : 1), w: ww, d: r.int(16, 28) }); x += r.int(34, 80); }
      V.relief(pb, { yBase: h - 1, nv: 40, dvy: 0.3, seed: 59, hMax: 48, H: V.massif(peaks, { seed: 59, rough: 0.5, scale: 0.05, apron: 5, spurs: 5, spurW: 0.4 }), ramp: V.RAMPS.far, contrast: 2.0, t0: 0.55, haze: { col: M.farHaze, k0: 0, k: 0.22 }, mist: { col: M.farHaze, h: 10, k: 0.5 }, rim: M.farRim, tex: 0.04 });
    }, { tag: 'far' });
    /* ---------- mar ---------- */
    P(HZ, 62, (pb) => V.seaFar(pb, 0, pb.h, { seed: 7, stops: M.sea, horizonCol: M.seaH }), {
      tag: 'sea', dyn: (g) => {
        V.drawSeaFx(g, 0, HZ, W, 48, T(), { sunX: SUN.x, density: 0.8 });
        if (fx.plume) V.drawPlume(g, fx.plume[0], fx.plume[1], T(), { n: 26, len: 34 });
      },
    });
    /* ---------- cabos lejanos a la izquierda con faro y barcas ---------- */
    P(HZ - 30, 50, (pb, w, h) => {
      const k = 0.22;
      const C = V.headlands(pb, { seed: 93, k, base: h - 8, yTop: [8, 22], w: [60, 120], gap: [24, 60], x0: -30, x1: 250, end: 0.25, ramp: M.cold ? V.RAMPS.cliff : null });
      const sp = C.spans[1] || C.spans[0];
      if (sp) { const lx = Math.round(sp[0] + (sp[1] - sp[0]) * 0.7), ly = C.top[lx] + 1; const L = V.lighthouse(pb, lx, ly, 12, { k }); fx.light = [L.lx, HZ - 30 + L.ly]; }
      for (const s0 of C.spans) for (let x = s0[0] + 6; x < s0[1] - 8; x += 9) { const y = C.top[x]; if (y < 32000 && hash2(x, 3, 5) < 0.6) V.house(pb, x, y + 1, 5 + (x % 3), 3 + (x % 2), 6100 + x, { k }); }
      // barcas de pesca fondeadas
      const HL = V.P32(V.hz(['#3a1a14', '#7a2a1e', '#c84a2a', '#f0e6d8'], k * 0.5));
      for (const [bx, by] of [[44, h - 3], [120, h - 1], [190, h - 4]]) { for (let q = 0; q < 7; q++) { V.put(pb, bx + q, by, HL[q === 0 || q === 6 ? 1 : 2]); V.put(pb, bx + q + (q > 0 && q < 6 ? 0 : 1), by + 1, HL[0]); } V.put(pb, bx + 3, by - 1, HL[3]); V.put(pb, bx + 3, by - 2, HL[3]); for (let q = 0; q < 4; q++) V.put(pb, bx + 2, by - 1 - q, HL[1]); }
    }, { tag: 'cape', dyn: (g) => { if (fx.light && Math.floor(Game.time * 1.2) % 3 === 0) V.drawGlow(g, fx.light[0], fx.light[1], 5, '#fff0b0', 0.7); } });
    /* ---------- montañas medias con aerogeneradores ---------- */
    P(34, 86, (pb, w, h) => {
      const r = RNG(63), peaks = [];
      for (let x = 330; x < w + 60;) { const ww = r.int(80, 150), hh = r.int(40, 76); peaks.push({ x: x + ww * 0.5, v: r.int(18, 34), h: hh, w: ww, d: r.int(22, 36) }); if (r.chance(0.6)) peaks.push({ x: x + ww * r.range(0.2, 0.8), v: r.int(4, 12), h: hh * 0.5, w: ww * 0.5, d: 16 }); x += r.int(70, 120); }
      const info = V.relief(pb, { yBase: h - 1, nv: 50, dvy: 0.36, seed: 67, hMax: 76, H: V.massif(peaks, { seed: 67, rough: 0.6, scale: 0.034, apron: 7, spurs: 6, spurW: 0.45 }), ramp: V.RAMPS.mid, contrast: 2.3, facet: 0.35, cav: 0.1, haze: { col: M.hzc, k0: 0, k: 0.14 }, mist: { col: M.hzc, h: 22, k: 0.5 }, rim: M.rim, tex: 0.05, veg: { ramp: V.RAMPS.vegMid, density: 0.03 * M.vegK, maxSlope: 0.6, minY: 40 } });
      for (const x of [372, 418, 600, 628]) {
        let bx = x; for (let q = -14; q <= 14; q++) if (info.top[x + q] < info.top[bx]) bx = x + q;
        const y = info.top[bx] + 1; if (y > h - 20) continue;
        const hub = V.turbineTower(pb, bx, y, 18, { k: 0.3, w: 2 });
        fx.turb.push({ x: hub.hx, y: hub.hy + 34, R: 8, k: 0.3, sp: 1.6 + (x % 7) * 0.2, ph: x, stop: M.dust && x === 418 });
      }
    }, { tag: 'mid', dyn: (g) => { const t = T(); for (const tb of fx.turb) { if (!tb.rot) tb.rot = V.rotor(tb.R, { k: tb.k }); V.drawRotor(g, tb.rot, tb.x, tb.y, tb.stop ? 0.4 : t * tb.sp + tb.ph); } } });
    /* ---------- llano costero: desaladora, FV, H₂ e invernaderos ---------- */
    const PLY = 100;
    P(PLY, 34, (pb, w, h) => {
      const k = 0.1, r = RNG(71), yB = 16;
      const info = V.relief(pb, { yBase: yB + 2, nv: 22, dvy: 0.3, seed: 73, hMax: 16, x0: 300, H: V.massif([{ x: 380, v: 10, h: 12, w: 90, d: 14 }, { x: 520, v: 12, h: 16, w: 120, d: 16 }, { x: 640, v: 12, h: 14, w: 100, d: 14 }], { seed: 73, rough: 0.4, scale: 0.06, apron: 3 }), ramp: V.RAMPS.low, contrast: 1.7, haze: { col: M.hzc, k0: 0.1, k: 0.06 }, rim: M.rimN, tex: 0.06, veg: { ramp: V.RAMPS.vegLow, density: 0.12 * M.vegK, maxSlope: 1.1, minY: 0, size: 2 } });
      V.fields(pb, 300, w, yB + 3, h, { k: 0.08, seed: 75, gold: M.gold, irrig: !M.dust });
      const SAND = V.P32(V.hz(['#c58440', '#edaf5f', '#fccf85'], k)), FOAM = V.P32(['#7cdfec', '#d2ecee', '#ffffff']);
      for (let x = 150; x < w; x++) { V.put(pb, x, yB, SAND[2]); V.put(pb, x, yB + 1, SAND[1]); V.put(pb, x, yB + 2, SAND[0]); if (info.top[x] >= yB) V.put(pb, x, yB - 1, FOAM[(x >> 2) % 3 === 0 ? 2 : 1]); for (let y = yB + 3; y < h; y++) if (x < 300) V.put(pb, x, y, SAND[y > yB + 6 ? 0 : 1]); }
      // la desaladora SYNARA, con el mismo orden de proceso del Nivel 1 (más grande en la victoria técnica)
      const dc = V.desalChain(pb, M.cold ? 168 : 178, yB + 3, { k, s: M.cold ? 0.62 : 0.52, climb: 5 });
      fx.perm = dc.perm;
      if (M.mangrove) fx.plume = [dc.outfall.x, PLY + dc.outfall.y];
      const pv = V.pvArray(pb, 330, info.yAt(380, 6) - 1, { tables: M.cold ? 4 : 3, cols: 10, rows: 2, cw: 3, ch: 2, gap: 2, skew: 2, k, shift: 2 });
      fx.glints.push({ x: pv.x0 + 2, y: PLY + pv.y0 + 2, len: pv.x1 - pv.x0 - 4, ph: 0.2, sp: 0.18 });
      if (M.dust) V.dustOn(pb, pv.x0, pv.y0, pv.x1 - pv.x0, pv.y1 - pv.y0, '#c88a50', 0.5);
      const h2 = V.h2Plant(pb, 560, info.yAt(560, 8) - 1, { k, s: 0.5 });
      fx.glows.push(...h2.glows.map(([x, y, rr]) => [x, PLY + y, Math.max(2, rr - 1)]));
      if (!M.cold) { V.greenhouse(pb, 470, yB + 1, 18, 8, { k }); V.greenhouse(pb, 500, yB + 1, 14, 7, { k }); }
      for (let x = 310; x < w; x += r.int(22, 48)) if (!(x > 540 && x < 620)) V.palm(pb, x, yB + 1, r.int(8, 13), r.range(-3, 3), 7300 + x, { k });
      if (M.cold) { const FN = U(V.hzc('#9aa4b8', k)); for (let x = 160; x < 330; x++) { if (x % 3 === 0) for (let q = 0; q < 4; q++) V.put(pb, x, yB + 2 - q, FN); V.put(pb, x, yB - 2, FN); } }
      fx.fauna.push({ kind: 'gull', x: 230, y: PLY - 20, r: 120, sp: 6 }, { kind: 'gull', x: 260, y: PLY - 30, r: 150, sp: 5 });
    }, {
      tag: 'plain', dyn: (g) => {
        const t = T();
        if (fx.perm) V.drawFlow(g, fx.perm, 0, PLY, t, { col: '#f4ffff', speed: 10, gap: 5 });
        V.drawPulse(g, fx.glows, 0, 0, t, '#4cd48e', 0.35, 0.2, 2);
        V.drawGlints(g, fx.glints, 0, 0, t);
      },
    });
    /* ---------- colina de ARIDIA: cúpula, torre de SYNARA, terrazas, cascadas ---------- */
    const CITY_X = 560, TOWER_X = 466;
    P(0, 150, (pb, w, h) => {
      const k = 0.08, r = RNG(81);
      const peaks = [{ x: CITY_X, v: 22, h: 84, w: 150, d: 30, k: 0.8 }, { x: TOWER_X, v: 16, h: 62, w: 90, d: 22, k: 0.85 }, { x: 380, v: 12, h: 40, w: 110, d: 18 }, { x: 650, v: 14, h: 60, w: 90, d: 20 }];
      const info = V.relief(pb, { yBase: h - 1, nv: 44, dvy: 0.3, seed: 83, hMax: 90, x0: 280, H: V.massif(peaks, { seed: 83, rough: 0.5, scale: 0.045, apron: 6, plateaus: [{ x: CITY_X, w: 66, h: 76 }, { x: TOWER_X, w: 24, h: 58 }] }), ramp: V.RAMPS.hill, contrast: 2.2, t0: 0.54, facet: 0.32, cav: 0.1, haze: { col: M.hzc, k0: 0, k: 0.1 }, mist: { col: M.hzc, h: 14, k: 0.3 }, rim: M.rimN, tex: 0.06, veg: { ramp: V.RAMPS.vegHill, density: 0.13 * M.vegK, maxSlope: 1.1, minY: 60, size: 3 } });
      const TA = V.carveTerraces(pb, info, { x0: 360, x1: 430, yTop: 104, yBot: 142, stepH: [7, 9], wallK: 0.42, k, seed: 85, kinds: ['rows', 'orchard', 'flowers', 'rows', 'vine'], crop: M.gold > 0.3 ? ['#3a2a0c', '#5a4414', '#86661c', '#b08a24', '#d4ac34', '#ecc84a', '#f8e070', '#fff0a0'] : null, falls: [{ x: 396, w: 3, from: 0 }] });
      const TB = V.carveTerraces(pb, info, { x0: 600, x1: 640, yTop: 96, yBot: 140, stepH: [7, 9], wallK: 0.42, k, seed: 87, kinds: ['rows', 'orchard', 'rows'], falls: [] });
      fx.falls.push(...TA.falls, ...TB.falls);
      V.scatterVeg(pb, (x) => (Math.abs(x - CITY_X) < 50 || Math.abs(x - TOWER_X) < 18) ? null : info.top[x] + 1, 290, w, 8101, { k: k + 0.02, gap: Math.round(7 / M.vegK), mix: { tree: 4, shrub: 3, palm: 1 }, ramp: V.RAMPS.vegHill });
      for (let i = 0; i < 30; i++) { const x = r.pick([r.int(300, 440), r.int(480, 520), r.int(600, 640)]); const y = info.onSurf(x, r.int(4, 16)); if (y == null || y < 60 || y > h - 8 || Math.abs(x - TOWER_X) < 14) continue; V.house(pb, x, y + 1, r.int(6, 10), r.int(4, 7), 8200 + i, { k: k + 0.02 }); }
      // torre de SYNARA (en el final mosaico, envuelta en el mosaico de datos comunitarios)
      const tw = V.synaraTower(pb, TOWER_X, info.top[TOWER_X] + 4, 70, { k: 0.04 });
      fx.tower = tw;
      if (id === 'mosaico') {
        const cols = ['#20d6c7', '#ffe14d', '#4ccb70', '#ff6b6b', '#f78acb', '#ff9f43', '#8d6bff'];
        const yb = info.top[TOWER_X] + 4 - 4;
        for (let q = 0; q < 5; q++) { const y0 = yb - 10 - q * 11, hw = Math.round(lerp(6, 3, (10 + q * 11) / 70)); SCBK.mosaicTiles(pb, TOWER_X - hw, y0 - 6, hw * 2 + 3, 6, 90 + q, cols); }
        fx.orbit = { x: TOWER_X, y: yb - 40, cols };
      }
      if (id === 'tecnica') { const yb = info.top[TOWER_X] + 4; const FN = U('#8a94ac'); for (let x = TOWER_X - 22; x < TOWER_X + 24; x++) { V.put(pb, x, yb - 1, FN); if (x % 3 === 0) for (let q = 2; q < 6; q++) V.put(pb, x, yb - q, FN); V.put(pb, x, yb - 6, FN); } }
      // ciudad de ARIDIA sobre la meseta
      const dc = V.domeCity(pb, CITY_X, info.top[CITY_X] + 8, { k: 0.03, s: 0.72 });
      for (const F of dc.falls) {
        let y0 = dc.base, x0 = F.x, wf = F.w; const total = h - 6 - y0, tiers = F.w > 8 ? [0.34, 0.3, 0.26] : [0.5, 0.45];
        for (let ti = 0; ti < tiers.length; ti++) {
          const y1 = Math.round(y0 + total * tiers[ti]);
          if (!M.dust || ti === 0) { V.fall(pb, x0, y0, y1, M.dust ? Math.max(2, wf >> 2) : wf, { k: 0.02 }); fx.falls.push({ x: x0, y0, y1, w: M.dust ? Math.max(2, wf >> 2) : wf }); }
          const RK = V.P32(V.RAMPS.hill);
          for (let xx = x0 - 4; xx < x0 + wf + 4; xx++) { V.put(pb, xx, y1 + 2, RK[2]); V.put(pb, xx, y1 + 1, RK[7]); V.put(pb, xx, y1, U(M.dust ? '#b89a7a' : (xx < x0 || xx >= x0 + wf ? '#3adcf1' : '#e8f8fc'))); }
          y0 = y1 + 2; x0 += (ti % 2 ? -2 : 2); if (wf > 8) wf += 2;
        }
      }
      // pacto: andamio y grúa sobre el flanco de la cúpula (obra sin terminar)
      if (M.scaffold) {
        const SC = U('#f0b040'), SD = U('#8a5a20'), x0 = CITY_X + 18, y0 = dc.top + 14;
        for (let yy = y0; yy < y0 + 30; yy++) { V.put(pb, x0, yy, SD); V.put(pb, x0 + 10, yy, SD); V.put(pb, x0 + 20, yy, SD); if ((yy - y0) % 6 === 0) for (let xx = x0; xx <= x0 + 20; xx++) V.put(pb, xx, yy, SC); }
        for (let q = 0; q < 6; q++) V.put(pb, x0 + q * 2, y0 + 6 + q * 2, SC);
        const cx = CITY_X - 30, cy = dc.top + 4; for (let yy = cy; yy < cy + 44; yy++) { V.put(pb, cx, yy, SC); if (yy % 3 === 0) V.put(pb, cx + 1, yy, SD); }
        for (let xx = cx - 10; xx < cx + 34; xx++) { V.put(pb, xx, cy, SC); if (xx % 3 === 0) V.put(pb, xx, cy + 1, SD); }
        for (let q = 0; q < 10; q++) V.put(pb, cx + 28, cy + 1 + q, U('#3a3040'));
        fx.beacons.push([cx, cy - 1]);
      }
      fx.fauna.push({ kind: 'eagle', x: 300, y: 28, r: 70 }, { kind: 'drone', x: CITY_X + 60, y: dc.top + 6, r: 24 });
      if (!M.dust && !M.cold) fx.fauna.push({ kind: 'drone', x: 610, y: 60, r: 20 });
    }, {
      tag: 'hill', dyn: (g) => {
        const t = T();
        V.drawFalls(g, fx.falls, 0, 0, t, { speed: 40, alpha: 0.8 });
        const tw = fx.tower;
        if (tw) V.drawPulse(g, tw.glows, 0, 0, t, id === 'mosaico' ? '#ffe14d' : M.cold ? '#a8f0ff' : '#5ae8f0', id === 'deuda' ? 0.2 : 0.4, 0.2, 1.6);
        if (tw && Math.floor(t * 1.5) % 2) { g.fillStyle = id === 'deuda' ? '#ffb04a' : '#ff6a5a'; g.fillRect(tw.beacon[0], tw.beacon[1] - 1, 1, 1); }
        for (const [x, y] of fx.beacons) if (Math.floor(t * 2) % 2) V.drawGlow(g, x, y, 3, '#ff6a40', 0.8);
        if (fx.orbit) {
          const O = fx.orbit;
          for (let i = 0; i < 14; i++) {
            const a = t * 0.8 + i * TAU / 14, ry = 4 + (i % 3) * 3, x = O.x + Math.cos(a) * (16 + (i % 2) * 5), y = O.y - i * 2.2 + Math.sin(a) * ry * 0.4;
            if (Math.sin(a) < -0.2 && Math.abs(x - O.x) < 6) continue; // detrás de la torre
            g.fillStyle = O.cols[i % O.cols.length]; g.globalAlpha = 0.6 + 0.4 * Math.sin(a); g.fillRect(Math.round(x), Math.round(y), 2, 2);
          }
          g.globalAlpha = 1;
        }
        V.drawFauna(g, fx.fauna, 0, 0, t);
      },
    });
    /* ---------- barrio bajo con vecinos (plano medio) ---------- */
    P(108, 56, (pb, w, h) => {
      const k = 0.03, r = RNG(101);
      const info = V.relief(pb, { yBase: h - 10, nv: 20, dvy: 0.3, seed: 105, hMax: 30, x0: 250, H: V.massif([{ x: 380, v: 10, h: 18, w: 150, d: 14, k: 1.1 }, { x: 560, v: 10, h: 26, w: 200, d: 16, k: 1.1 }], { seed: 105, rough: 0.4, scale: 0.06, apron: 3 }), ramp: V.RAMPS.low, contrast: 1.7, facet: 0.25, haze: { col: M.hzc, k0: 0, k: 0.03 }, rim: M.rimN, tex: 0.06, veg: { ramp: V.RAMPS.vegLow, density: 0.16 * M.vegK, maxSlope: 1.3, minY: 6, size: 3 } });
      const GR = V.P32(V.hz(M.dust ? ['#4a3a1c', '#6a5226', '#8a6a32', '#a88440', '#c49c52'] : ['#2a3a0c', '#3b5312', '#597611', '#7b981a', '#9cb42c'], k));
      for (let x = 250; x < w; x++) for (let y = h - 10; y < h; y++) V.put(pb, x, y, GR[1 + (hash2(x >> 1, y >> 1, 9) < 0.4 ? 1 : 0)]);
      const town = V.hillTown(pb, { x0: 268, x1: w + 8, seed: 109, k, bunting: M.festive ? 0.9 : M.cold ? 0 : 0.4, lit: M.lit, rows: [{ y: (x) => h - 4 + Math.round(Math.sin(x * 0.03) * 1), w: [14, 24], h: [10, 18], gap: [-4, 8], hole: 0.15, veg: 0.85 * M.vegK, vegGap: [10, 24], roofs: M.cold ? ['flat', 'solar', 'flat'] : ['terrace', 'tiles', 'dome', 'solar', 'terrace', 'tiles'], scale: 1.2, s: 2, flowers: M.dust ? 0.05 : 0.5 }] });
      for (const [x, y] of town.tops) if (M.festive && hash2(x, y, 11) < 0.3) { const PL = U('#e8e4de'); for (let q = 0; q < 8; q++) V.put(pb, x, y - q, PL); fx.flags.push({ x, y: 108 + y - 8, col: SCBK.CLOTH[(x >> 3) % 6] }); }
      if (M.lit) for (const hs of town.houses) if (hash2(hs.x, 1, 3) < 0.5) fx.lanterns.push([hs.x + 3, 108 + hs.y - hs.h + 2, 3]);
      // vecinos en la calle (más gente en el mosaico; casi nadie en la victoria técnica)
      for (let i = 0; i < M.folk; i++) { const x = r.int(262, w - 4); SCBK.folk(pb, x, h - 2 - r.int(0, 3), 900 + i, { k, pose: M.festive ? 'cheer' : null, cols: M.cold ? ['#8a94ac', '#c8d0dc', '#5a6a8a'] : null }); }
      if (M.festive) { const KC = ['#e83b41', '#f5dc5a', '#8d6bff', '#11bedd', '#ff9f43', '#3fe0a0']; for (let i = 0; i < 4; i++) fx.kites.push({ x: 300 + i * 90, y: 60 + (i % 2) * 12, col: KC[i], sp: 0.6, ph: i, tail: 10, line: [8, 30] }); }
    }, {
      tag: 'low', dyn: (g) => {
        const t = T();
        V.drawFlags(g, fx.flags, 0, 0, t);
        V.drawKites(g, fx.kites, 0, 0, t);
        if (fx.lanterns.length) V.drawPulse(g, fx.lanterns, 0, 0, t, '#ffb050', 0.4, 0.15, 3);
      },
    });
    /* ---------- primer plano: cornisa columnar, palmera, follaje ---------- */
    const topF = (x) => x < 196 ? 146 - Math.round(Math.sin(x * 0.03) * 2) + (x > 150 ? Math.round((x - 150) * 0.16) : 0) : 153 + (x - 196) * 0.55;
    const fg = new PixelBuffer(W, IH);
    // cornisa de primer plano con el terreno del plano jugable (PFTerrain: acantilado columnar en 3/4)
    const ground = new Int16Array(W + 1).fill(9999);
    for (let x = 0; x < 236; x++) ground[x] = Math.round(topF(x));
    const rockR = M.cold ? ['#1e1a28', '#2e2838', '#463a48', '#5e4c56', '#7a6268', '#967c7c', '#b0989a', '#c8b4b0', '#dccac4']
      : M.dust ? ['#2a120a', '#3e1c10', '#562816', '#6a361c', '#8e5228', '#ac6c36', '#c48a4a', '#dcaa6a', '#ecc898'] : RAMP.rockWarmR;
    const world = { def: { pf: { terrain: [{ x0: 0, x1: 236, surf: 'grass', face: 'cliff', ramp: rockR, ledges: false, ledgePlants: false, lip: M.cold ? '#dcd8e0' : '#fde3a8' }] } }, w: W, h: IH, ground, platforms: [], water: [] };
    const surfPB = new PixelBuffer(W, IH);
    PFTerrain.surface(surfPB, world);
    const terrC = PFTerrain.render(world);
    const ledgeTop = ground;
    const gy = (x) => ledgeTop[Math.max(0, Math.min(235, Math.round(x)))] - 3;
    if (M.dust) PFFlora.scatter(fg, gy, 4, 220, 41, { mix: { dry: 5, agave: 1 }, gap: 12 });
    else PFFlora.scatter(fg, gy, 4, 220, 41, { mix: M.cold ? { tuft: 4, agave: 2 } : { tuft: 4, flowers: 3, lupine: 1, hibiscus: 1 }, gap: 12 });
    PFFlora.palm(fg, 20, gy(20), 96, 10, 77, M.dust ? { ramp: ['#1a1408', '#2e240c', '#4a3a14', '#6a5420', '#8a7030', '#a88a44', '#c4a45a', '#dcc070'] } : {});
    // matas oscuras del borde derecho (oclusor frío)
    const clump = PFFlora.fgClump(80, 40, 9, { spikes: M.dust ? 0 : 3 });
    V.blit(fg, clump, 572, IH - 40);
    // flores en el labio de la cornisa (más en el mosaico, ninguna en la deuda)
    if (!M.dust) for (let x = 12; x < 220; x += M.festive ? 9 : 17) if (hash2(x, 3, 71) < 0.7) PFFlora.flowerPatch(fg, x, gy(x) + 1, 7, x + 3, M.cold ? ['#c8d0e0', '#e8ecf4', '#8a94ac', '#ffffff'] : undefined);
    // follaje de encuadre que cuelga en la esquina superior izquierda (el plano más oscuro)
    const canopyC = PFFlora.canopy(180, 56, 21, { side: -1, n: 9, vines: 2 }).toCanvas();

    // manglar seco (deuda): raíces grises sobre la orilla y plantones nuevos en cajas
    if (M.mangrove) {
      const DW = V.P32(['#2a2420', '#4a403a', '#6a5e56', '#8a7e74', '#a89c90']);
      for (let i = 0; i < 4; i++) {
        const bx = 226 + i * 18, by = 150 + (i & 1) * 3;
        for (let q = -3; q <= 3; q++) for (let s = 0; s < 8; s++) { V.put(fg, bx + q * 2 + Math.round(q * (8 - s) * 0.35), by - s, DW[1 + (s & 1)]); V.put(fg, bx + q * 2 + Math.round(q * (8 - s) * 0.35) + 1, by - s, DW[0]); }
        for (let s = 0; s < 16; s++) { V.put(fg, bx, by - 8 - s, DW[3]); V.put(fg, bx + 1, by - 8 - s, DW[1]); }
        for (const [dx, dy] of [[-7, -28], [6, -30], [-4, -33], [9, -24], [2, -36]]) { V.line(fg, bx, by - 20, bx + dx, by + dy, () => DW[4]); V.line(fg, bx + 1, by - 20, bx + dx + 1, by + dy, () => DW[1]); }
        // agua turbia con espuma de salmuera al pie de las raíces
        for (let xx = -9; xx < 10; xx++) { V.put(fg, bx + xx, by + 1, U(xx % 3 ? '#8a6a7a' : '#c08ab0')); V.put(fg, bx + xx, by + 2, U('#5a4a62')); }
      }
    }
    SCBK.grade(fg, M.cold ? { sat: 0.8, tint: '#8aa8d0', tintK: 0.08 } : M.dust ? { sat: 0.86, tint: '#c89060', tintK: 0.1 } : { sat: 1.05 });
    const fgC = fg.toCanvas(), surfC = surfPB.toCanvas();
    // tablero de decisiones pendientes (pacto) / caja de plantones (deuda) / mosaico (mosaico), horneados aparte
    const props = new PixelBuffer(W, IH);
    if (M.board) {
      const x = 186, y = gy(186) - 40, WD = U('#5a3826'), WL = U('#8e542f');
      for (let q = 0; q < 40; q++) { V.put(props, x + 2, y + q, WD); V.put(props, x + 33, y + q, WD); }
      for (let yy = 0; yy < 22; yy++) for (let xx = 0; xx < 36; xx++) V.put(props, x + xx, y + yy, U(yy === 0 || xx === 0 ? '#cb9772' : yy === 21 || xx === 35 ? '#4e2519' : hash2(xx >> 1, yy >> 1, 3) < 0.2 ? '#7a4a28' : '#8e542f'));
      const NC = ['#ffe14d', '#ff9a8a', '#a6f4ff', '#c2f58e'];
      for (let i = 0; i < 8; i++) { const nx = x + 3 + (i % 4) * 8, ny = y + 3 + Math.floor(i / 4) * 9; for (let yy = 0; yy < 6; yy++) for (let xx = 0; xx < 6; xx++) V.put(props, nx + xx, ny + yy, U(yy === 0 ? shadeTo(NC[i % 4], 0.3) : yy === 5 ? shadeTo(NC[i % 4], -0.25) : NC[i % 4])); V.put(props, nx + 1, ny + 2, U('#3a2a40')); V.put(props, nx + 3, ny + 2, U('#3a2a40')); V.put(props, nx + 2, ny + 4, U('#3a2a40')); }
      for (let xx = 0; xx < 36; xx++) V.put(props, x + xx, y - 1, WL);
    }
    if (M.mangrove) {
      const x = 170, y = gy(170);
      for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < 26; xx++) V.put(props, x + xx, y - 8 + yy, U(yy === 0 ? '#cb9772' : yy === 7 ? '#4e2519' : xx % 9 === 0 ? '#5a2d21' : '#8e542f'));
      for (let i = 0; i < 5; i++) PFFlora.leaf(props, x + 3 + i * 5, y - 8, -Math.PI / 2 - 0.4 + i * 0.2, 7, 3, V.P32(RAMP.foliageR), 4);
    }
    const propsC = props.toCanvas();
    // personajes del primer plano por final
    const cast = {
      mosaico: [['amaya', 'victory', 104, 1, { expr: 'happy' }], ['alma', 'celebrate', 56, 1, {}], ['crowd3', 'celebrate', 196, -1, {}]],
      pacto: [['amaya', 'observe', 112, 1, { expr: 'smile' }], ['consejal', 'talk', 58, 1, {}]],
      tecnica: [['amaya', 'think', 112, 1, { expr: 'thinking' }], ['operador', 'idle', 186, -1, {}]],
      deuda: [['amaya', 'determined', 104, 1, {}], ['marea', 'talk', 214, -1, {}]],
    }[id] || [];
    // luz de borde de los personajes según la hora del final (rig: RIM_ENV)
    const ENV = M.dust ? 'calima' : M.sunKind === 'dusk' ? 'dusk' : 'coast';
    const kiruExpr = { mosaico: 'happy', pacto: 'smile', tecnica: 'calm', deuda: 'brave' }[id];
    return {
      id, B, cast,
      draw(g, t) {
        g.save(); g.beginPath(); g.rect(0, 0, W, IH); g.clip();
        B.render(g, { x: 0, y: V.CAMY });
        if (M.dust) { V.drawSand(g, 24, t, 5, { y0: 40, y1: 150, col: '#f0c890', wind: 0.6 }); }
        g.drawImage(surfC, 0, 0); g.drawImage(terrC, 0, 0);
        g.drawImage(fgC, 0, 0);
        g.drawImage(propsC, 0, 0);
        for (const [cid, anim, x, f, op] of cast) drawChar(g, cid, anim, t, x, gy(x), f, Object.assign({ env: ENV }, op));
        drawChar(g, 'kiru', 'idle', t, 148, gy(148) - 10, 1, { expr: kiruExpr, env: ENV });
        if (M.sunKind === 'dusk' || M.festive) V.drawMotes(g, 12, t, 13, { y0: 60, y1: 160, col: M.dust ? '#f0c890' : '#ffe8b0' });
        g.drawImage(canopyC, -8 + Math.round(Math.sin(t * 1.1) * 1), -6);
        // borde inferior: sombra de contacto suave sobre el panel
        g.fillStyle = '#04142e'; g.globalAlpha = 0.5; g.fillRect(0, IH - 2, W, 2); g.globalAlpha = 1;
        g.restore();
      },
    };
  }
  return { make, MOODS, IH };
})();
