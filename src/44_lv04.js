/* =====================================================================
   44_lv04.js — NIVEL 04: LAS DUNAS FOTÓNICAS
   Campo fotovoltaico sobre dunas estabilizadas y talleres de mantenimiento.
   RA-04 · Relé Solar · Guardián: El Espejismo de Mediodía
   MIRAGE habla por primera vez.
   ===================================================================== */

const PV_STRINGS = [
  { id: 's1', x: 380, soil: 0.06, crust: 0, shade: 0 },
  { id: 's2', x: 520, soil: 0.22, crust: 0, shade: 0 },
  { id: 's3', x: 660, soil: 0.10, crust: 0, shade: 0.45 },
  { id: 's4', x: 800, soil: 0.12, crust: 0.25, shade: 0 },
  { id: 's5', x: 940, soil: 0.08, crust: 0, shade: 0 },
  { id: 's6', x: 1080, soil: 0.20, crust: 0, shade: 0 },
];
const PV_KWP = 1000;

/* ---------- anclas del plano jugable (kit PF + PFASolar) ---------- */
const LV4_ANCH = { strings: {}, leds: [], lamps: [], screens: [] };

LEVELS[4] = {
  id: 4, title: 'Las Dunas Fotónicas', chapter: 'CAPÍTULO 04', biome: 'pvdunes', music: 'dunes', width: 2800, height: 420, fallY: 420,
  ambience: { wind: 0.45, birds: 0.15, hum: 0.2 },
  portraits: ['amaya', 'kiru', 'naira', 'dante', 'cobre', 'mirage'],
  spawn: { x: 60, y: 286 },
  checkpoints: { dispatch: { x: 2160, y: 270 } },
  ground: [[0, 286], [200, 280], [340, 288], [1160, 288], [1220, 282], [1520, 282], [1600, 266], [1760, 258], [1900, 270], [2100, 270], [2300, 262], [2560, 256], [2800, 250]],
  terrain: [{ x0: 0, x1: 340, mat: 'dune' }, { x0: 340, x1: 1160, mat: 'sand' }, { x0: 1160, x1: 1520, mat: 'stone' }, { x0: 1520, x1: 2800, mat: 'dune' }],
  /* Mismas plataformas (x, y, w): pasarelas de mantenimiento sobre las crestas y altillo del taller (arte en props) */
  platforms: [
    { x: 1610, y: 236, w: 84, type: 'metal', baked: true, art: 'none' }, { x: 1720, y: 214, w: 84, type: 'metal', baked: true, art: 'none' }, { x: 1830, y: 230, w: 84, type: 'metal', baked: true, art: 'none' },
    { x: 1270, y: 236, w: 60, type: 'metal', baked: true, art: 'none' },
  ],
  /* Cámara: el mundo crece 60 px hacia abajo (laderas de duna en 3/4 con la zanja de cables CC en corte) */
  cam: { look: 50, vy: 0.6 },
  pf: {
    terrain: [
      /* r3-desert: la cara bajo la pasarela es un diorama en 4 alturas (talud · muro · bancal · corte), ver PFASolar 'r3tier' */
      { x0: 0, x1: 340, surf: 'dune', face: 'r3tier', depth: 16, seed: 3 },
      { x0: 340, x1: 1160, surf: 'track', face: 'r3tier', depth: 18, seed: 5 },
      { x0: 1160, x1: 1520, surf: 'paving', face: 'r3tier', depth: 16, seed: 7, r3wall: (s, x, y, d, e1, w) => PFASolar.r3VaultWall(s, x, y, d, e1, w, 1160, 1520) },
      { x0: 1520, x1: 2800, surf: 'dune', face: 'r3tier', depth: 16, seed: 9 },
    ],
    /** r3-desert: zonas del diorama inferior (borde del muro, suelo del bancal; el zócalo del taller es más alto) */
    r3zones: [
      { x0: 0, x1: 340, edge: 'rock', top: 'sand', fans: [[250, 70, 16]] },
      { x0: 340, x1: 1160, edge: 'gabion', top: 'soil', fans: [[580, 64, 14], [904, 58, 11]] },
      { x0: 1160, x1: 1520, edge: 'concrete', top: 'gravel', wall: true, e1: (x) => PFASolar.r3VaultE1(x, 1160, 1520) },
      { x0: 1520, x1: 1920, edge: 'gabion', top: 'sand', fans: [[1680, 76, 18], [1890, 50, 12]] },
      { x0: 1920, x1: 2300, edge: 'concrete', top: 'gravel', fans: [[2122, 40, 9]] },
      { x0: 2300, x1: 2801, edge: 'rock', top: 'sand', fans: [[2330, 60, 18], [2590, 90, 22]] },
    ],
    /** Primer plano oscuro del desierto: chumberas y matas secas en el borde inferior */
    fg: [
      // r3-desert: f = 1,3; en las posiciones de juego cada pieza cae en un borde del encuadre (1,3·cámara − 75 / + 560)
      { kind: 'aDesert', x: -40, w: 150, h: 94, seed: 1, side: -1 },
      { kind: 'aDesert', x: 520, w: 130, h: 90, seed: 2, side: 1 },
      { kind: 'aDesert', x: 1119, w: 130, h: 92, seed: 7, side: 1 },
      { kind: 'aDesert', x: 1300, w: 150, h: 94, seed: 3, side: -1 },
      { kind: 'aDesert', x: 1905, w: 140, h: 92, seed: 4, side: 1 },
      { kind: 'aDesert', x: 2600, w: 150, h: 94, seed: 5, side: -1 },
      { kind: 'aDesert', x: 3199, w: 150, h: 92, seed: 6, side: 1 },
    ],
    decorateFace(pb, world) { LEVELS[4].r3face(pb, world); },
    fauna: { eagle: { x0: 300, x1: 2500, y: 70 }, drones: [{ x: 760, y: 150, r: 60 }, { x: 2040, y: 130, r: 40 }] },
  },
  /** Etiquetas científicas en el mundo */
  labels: [
    { x: 86, y: 166, title: 'PIRANÓMETRO', sub: (sc) => 'GHI ' + fmt0(1000 * (1 - (sc.backdrop.cloudShadowAt ? sc.backdrop.cloudShadowAt(86) : 0) * 0.7)) + ' W/m²', kind: 'solar', ax: 74, ay: 206 },
    { x: 520, y: 192, title: 'STRINGS FV', sub: 'Módulos en serie (CC)', kind: 'solar', ax: 520, ay: 222 },
    { x: 1300, y: 150, title: 'INVERSORES', sub: 'CC → CA', kind: 'tech', ax: 1300, ay: 160 },
    { x: 1762, y: 164, title: 'SEGUIDORES', sub: 'Giran con el sol', kind: 'solar', ax: 1762, ay: 186 },
    { x: 1978, y: 206, title: 'BATERÍAS', sub: (sc) => fmt0((sc.state.soc ?? 0.62) * 100) + ' % SOC', kind: 'tech', ax: 1978, ay: 222 },
    { x: 2124, y: 178, title: 'SUBESTACIÓN', sub: 'Eleva la tensión', kind: 'tech', ax: 2122, ay: 198 },
    { x: 2224, y: 148, title: 'DESPACHO SOLAR', sub: (sc) => fmt0(LEVELS[4].fieldPower(sc.state, sc)) + ' kW', kind: 'solar', ax: 2224, ay: 164 },
    { x: 2580, y: 200, title: 'CERCAS DE ARENA', sub: 'Fijan las dunas', kind: 'green', ax: 2580, ay: 236 },
    { x: 712, y: 311, title: 'ZANJA DE CABLES CC', sub: 'Strings → inversores', kind: 'solar', ax: 712, ay: 324 },
  ],
  // r4-labels: la etiqueta lejana del bioma (f 0,28) sube a las terrazas FV del fondo; en su sitio original caía sobre
  // los strings del plano jugable (tapaba los rótulos S3–S5 y su tallo señalaba la fila delantera)
  labelOffsets: { 'FOTOVOLTAICA': { dy: -68, ady: -70 } },
  /* ---------------- accesorios estáticos (prerender, f = 1) ---------------- */
  props(pb, world) {
    const t0 = nowMs();
    const gy = (x) => world.groundAt(x);
    const segs = PFTerrain.surface(pb, world);
    const back = (x) => PFTerrain.backEdge(PFTerrain.segAt(segs, x), Math.round(x), gy(x));
    const S = PFASolar, P = PFAPlant, I = PFInfra, A = PFArch, C = PFCivic, F = PFFlora, K = PFK, r = RNG(4004);
    const N = LV4_ANCH; N.strings = {}; N.leds = []; N.lamps = []; N.screens = [];
    // tendido eléctrico del campo al fondo (rompe el cielo con verticales y catenarias)
    S.powerLine(pb, [350, 610, 870, 1130, 1560, 1860, 2140], (x) => back(x) + 2, 112);
    /* ===== 1. ENTRADA Y ESTACIÓN METEOROLÓGICA (0–340) ===== */
    S.fence(pb, 0, 300, (x) => back(x) + 3);
    F.scatter(pb, (x) => back(x) + 2, 0, 320, 401, { gap: 14, mix: { dry: 4, tuft: 1, agave: 1 }, ramp: PFFlora.DRY });
    { const r3 = RNG(4474); for (let x = 4; x < 300; x += 11 + r3.int(0, 9)) { const y = Math.round(back(x) + 4 + r3.int(0, 8)), k = r3(); if (k < 0.45) F.tuft(pb, x, y, 7, 7 + r3.int(0, 3), x, RAMP.grassR, { wind: 1 }); else if (k < 0.75) S.tabaiba(pb, x, y, 0.5 + r3() * 0.25, x); } }
    const met = S.meteo(pb, 76, gy(76) - 8); N.met = met;
    S.cactus(pb, 22, gy(22) - 6, 42, 11); S.opuntia(pb, 140, gy(140) - 5, 1, 12); S.dryBush(pb, 180, gy(180) - 4, 22, 12, 13);
    S.stones(pb, 110, gy(110) - 3, 18, 14); S.stones(pb, 262, gy(262) - 3, 14, 15);
    PFSigns.post(pb, 226, gy(226) - 2, [{ text: 'CAMPO SOLAR 1 MWp' }, { text: 'TALLER' }], 41, { font: 'tiny' });
    // puerta del cercado
    for (const gx of [300, 330]) { for (let y = gy(gx) - 44; y < gy(gx) - 4; y++) { K.put(pb, gx, y, U('#d2d6dc')); K.put(pb, gx + 1, y, U('#6c7280')); } }
    for (let x = 302; x < 330; x++) { K.put(pb, x, gy(x) - 40, U('#b2b6c0')); K.put(pb, x, gy(x) - 22, U('#8e94a2')); if ((x - 302) % 6 === 0) for (let y = gy(x) - 40; y < gy(x) - 22; y++) K.put(pb, x, y, U('#8e94a2')); }
    /* ===== 2. CAMPO FV: 6 STRINGS DE MESAS FIJAS (340–1160) ===== */
    // r3-desert: cubierta vegetal agrivoltaica bajo las mesas (gramíneas verdes al viento, tabaibas, aloe, aulagas)
    { const r3 = RNG(4471); for (let x = 344; x < 1156; x += 7 + r3.int(0, 7)) { const y = Math.round(back(x) + 5 + r3.int(0, 9)), k = r3();
      if (k < 0.42) F.tuft(pb, x, y, 7 + r3.int(0, 3), 6 + r3.int(0, 4), x, RAMP.grassR, { wind: 0.9 });
      else if (k < 0.58) S.tabaiba(pb, x, y, 0.42 + r3() * 0.2, x);
      else if (k < 0.7) F.agave(pb, x, y, 5 + r3.int(0, 2), x, S.R3ALOE);
      else if (k < 0.8) F.cluster(pb, x, y - 3, 4, 3, ['#2a3a10', '#46601a', '#6a8a22', '#94b02e', '#c4d640', '#eee870'], x, { leaf: [2, 3], density: 0.8 });
      else if (k < 0.88) F.tuft(pb, x, y, 6, 5, x, PFFlora.DRY, { wind: 0.9 }); } }
    for (const s of PV_STRINGS) {
      const tabs = [];
      for (let k = 0; k < 2; k++) { const tx = s.x - 64 + k * 64, yb = Math.round(Math.max(back(tx), back(tx + 60)) + 10); tabs.push(Object.assign(S.pvTable(pb, tx, yb, 60, { low: 14, ph: 40, sk: 12, seed: s.x + k }), { x: tx, yb })); }
      N.strings[s.id] = tabs;
      // placa del string sobre la hinca y conducto CC hasta la caja
      const px = s.x - 60, py = tabs[0].yb - 30;
      P.rect(pb, px, py, 11, 7, U('#f4f6f8')); P.hline(pb, px, px + 10, py, U('#c8861a')); K.text(pb, s.id.toUpperCase(), px + 2, py + 1, U('#2a1404'), { font: 'tiny' });
      for (let x = s.x + 56; x < s.x + 70; x++) { K.put(pb, x, gy(x) - 4, U('#141418')); K.put(pb, x, gy(x) - 3, U('#3a3a44')); }
      S.dryBush(pb, s.x + 2, gy(s.x) - 4, 14, 8, s.x);
    }
    for (let x = 352; x < 1150; x += 26 + r.int(0, 20)) if (hash2(x, 3, 9) < 0.5) S.stones(pb, x, back(x) + 4, 10 + r.int(0, 8), x); else F.tuft(pb, x, back(x) + 4, 8, 6, x, PFFlora.DRY);
    /* ===== 3. TALLER DE INVERSORES EN CORTE (1160–1520) ===== */
    const ws = S.workshop(pb, 1186, 1468, 282, { roof: 164, doorX: 1424 });
    for (const l of ws.lamps) N.lamps.push([l[0], l[1], '#fff0c8', 11]);
    // altillo de repuestos (plataforma 1270/236) con módulos apilados y barandilla
    P.landing(pb, 1270, 236, 60, 278, { d: 6, railH: 24 });
    for (let k = 0; k < 4; k++) I.box3q(pb, 1276 + k * 2, 230 - k * 4, 34, 4, 6, { ramp: ['#0c1838', '#1b3366', '#335a98', '#6e98d0', '#d2d6dc'], skew: 0.7 });
    const invs = [S.inverter(pb, 1196, 280, { label: 'INV-1', style: 'central', wear: 0.6 }), S.inverter(pb, 1232, 280, { label: 'INV-2', style: 'tall', brand: '#1a9a6a', wear: 0.3 }), S.inverter(pb, 1282, 280, { w: 20, h: 28, tint: 'sand', wear: 0.8 }), S.inverter(pb, 1306, 280, { w: 20, h: 28, hot: true, wear: 0.5 }), S.inverter(pb, 1342, 280, { label: 'INV-3', style: 'central', w: 28, brand: '#c8861a', wear: 0.2 }), S.inverter(pb, 1376, 280, { label: 'INV-4', style: 'tall', tint: 'white', wear: 0.5 })];
    for (const v of invs) { N.screens.push([...v.screen, '#3fe0a0']); N.leds.push({ x: v.led[0], y: v.led[1], col: '#3fe0a0', hz: 1, ph: v.led[0] * 0.1 }); }
    N.fans = invs.map(v => v.fan).filter(Boolean);
    N.hot = invs[3].vent;
    // banco de trabajo y herramientas, módulo de repuesto apoyado, extintor
    I.box3q(pb, 1408, 280, 14, 30, 6, { ramp: A.WOOD }); P.toolbox(pb, 1410, 248, '#bc2430');
    for (let k = 0; k < 2; k++) S.pvTable(pb, 1444 + k * 4, 279, 16, { low: 0, ph: 40, sk: 2, piles: 2, seed: 50 + k });
    P.extinguisher(pb, 1458, 280);
    // cables CC que entran por la canaleta del suelo y CA que salen hacia la subestación
    for (let x = 1188; x < 1468; x++) { K.put(pb, x, 270, U('#2a2a30')); if (x % 9 === 0) K.put(pb, x, 269, U('#a8202a')); }
    // patio: robot de limpieza aparcado, depósito de agua de limpieza
    S.robot(pb, 1478, 276); S.waterTank(pb, 1486, 248);
    K.text(pb, '150 L', 1488, 224, U('#0c2650'), { font: 'tiny' });
    /* ===== 4. CRESTAS CON SEGUIDORES Y PASARELAS (1520–1920) ===== */
    F.scatter(pb, (x) => back(x) + 2, 1520, 1940, 451, { gap: 16, mix: { dry: 4, agave: 1 }, ramp: PFFlora.DRY });
    { const r3 = RNG(4472); for (let x = 1524; x < 1936; x += 10 + r3.int(0, 9)) { const y = Math.round(back(x) + 4 + r3.int(0, 8)), k = r3(); if (k < 0.45) F.tuft(pb, x, y, 7, 7 + r3.int(0, 3), x, RAMP.grassR, { wind: 1 }); else if (k < 0.7) S.tabaiba(pb, x, y, 0.5 + r3() * 0.25, x); else if (k < 0.8) S.cardon(pb, x, y, 16 + r3.int(0, 8), x); } }
    N.trackers = [];
    for (const [x, y] of [[1610, 236], [1720, 214], [1830, 230]]) {
      for (let k = 0; k < 2; k++) { const tx = x - 6 + k * 46, tb = Math.round(back(tx + 20) + 8); N.trackers.push(S.tracker(pb, tx, tb, 42, { ang: 0.1, h: tb - (y - 40), seed: tx, dyn: true })); }
      P.landing(pb, x, y, 84, Math.round(gy(x + 42)) - 2, { d: 6, railH: 16 });
    }
    S.sandFence(pb, 1530, 1600, (x) => back(x) + 6, { seed: 21 });
    /* ===== 5. BATERÍAS, SUBESTACIÓN Y DESPACHO (1920–2300) ===== */
    N.bess = [C.bess(pb, 1940, gy(1940) - 4, 70, 34), C.bess(pb, 2016, gy(2016) - 4, 70, 34)];
    const tr = S.transformerBig(pb, 2098, gy(2098) - 4); N.ins = tr.glows;
    // línea aérea hacia la red
    for (let y = 120; y < gy(2168) - 4; y++) { K.put(pb, 2168, y, U('#6c7280')); K.put(pb, 2169, y, U('#2e323c')); }
    P.hline(pb, 2156, 2182, 128, U('#4c5260')); for (const ix of [2158, 2168, 2180]) { K.put(pb, ix, 126, U('#c8562a')); K.put(pb, ix, 125, U('#e8805a')); }
    for (let x = 2120; x < 2168; x++) K.put(pb, x, Math.round(lerp(208, 126, (x - 2120) / 48) + Math.sin((x - 2120) / 48 * Math.PI) * 6), U('#2a2a30'));
    const kk = S.kiosk(pb, 2180, gy(2180) - 6, 92, 96); N.kiosk = kk.screen;
    A.bench(pb, 2276, gy(2276) - 8, 30);
    /* ===== 6. DUNAS VIVAS HACIA LAS TORRES DE BRISA (2300–2800) ===== */
    S.sandFence(pb, 2310, 2470, (x) => back(x) + 5, { seed: 31, bury: 0.35 });
    S.sandFence(pb, 2520, 2700, (x) => back(x) + 4, { seed: 33, bury: 0.2 });
    F.scatter(pb, (x) => back(x) + 2, 2300, 2800, 461, { gap: 12, mix: { dry: 4, tuft: 2, agave: 2 }, ramp: PFFlora.DRY });
    { const r3 = RNG(4473); for (let x = 2304; x < 2796; x += 11 + r3.int(0, 10)) { const y = Math.round(back(x) + 4 + r3.int(0, 8)), k = r3(); if (k < 0.4) F.tuft(pb, x, y, 7, 7 + r3.int(0, 3), x, RAMP.grassR, { wind: 1.2 }); else if (k < 0.7) S.tabaiba(pb, x, y, 0.5 + r3() * 0.3, x); else if (k < 0.78) S.cardon(pb, x, y, 18 + r3.int(0, 10), x); } }
    for (const [x, h, sd] of [[2336, 46, 1], [2498, 36, 2], [2652, 52, 3], [2740, 30, 4]]) S.cactus(pb, x, back(x) + 8, h, sd);
    for (const [x, s] of [[2390, 1], [2560, 0.8], [2706, 1.1]]) S.opuntia(pb, x, back(x) + 10, s, x);
    for (const x of [2440, 2610]) S.dryBush(pb, x, gy(x) - 4, 24, 13, x);
    for (const x of [2370, 2530, 2680]) S.stones(pb, x, gy(x) - 3, 16, x);
    N.pump = S.windPump(pb, 2596, back(2596) + 4, 118);
    // manga de viento: apunta hacia las Torres de Brisa
    for (let y = gy(2668) - 70; y < gy(2668) - 4; y++) { K.put(pb, 2668, y, U('#d2d6dc')); K.put(pb, 2669, y, U('#6c7280')); }
    N.sock = [2670, gy(2668) - 68];
    // el letrero cabe entero antes del borde del mundo (x + w ≤ 2790): la cámara se detiene en 2160
    PFSigns.post(pb, 2700, gy(2700) - 2, [{ text: 'TORRES DE BRISA' }], 47, { font: 'tiny' });
    LEVELS[4]._ms = Math.round(nowMs() - t0);
  },
  propsFront(pb, world) {
    const gy = (x) => world.groundAt(x), F = PFFlora;
    for (let x = 8; x < 340; x += 19) if ((x * 7) % 5 < 3) F.tuft(pb, x, gy(x) + 3, 7, 6, x, PFFlora.DRY);
    for (let x = 1530; x < 2800; x += 27) if ((x * 13) % 7 < 2) F.tuft(pb, x, gy(x) + 3, 7, 6, x, PFFlora.DRY);
    for (const x of [360, 610, 890, 1140]) PFASolar.stones(pb, x, gy(x) + 4, 10, x);
  },
  /**
   * r3-desert · diorama de la cara inferior (lienzo del terreno, f = 1, tras los accesorios):
   * talud con matas y bandejas de cable que bajan de cada caja de string · muro (gaviones/hormigón/arenisca) ·
   * bancal inferior por zonas (jardín de tabaibas y aljibe · franja agrivoltaica con carril del robot y canal ·
   * zócalo del taller con galería de cables · skids de inversores · patio de subestación y hangar · vivero de dunas) ·
   * corte frontal con zanjas en sección, tubería de riego y raíces. Anclas animadas en LV4_ANCH.face.
   */
  r3face(pb, world) {
    const S = PFASolar, F = PFFlora, K = PFK, I = PFInfra, P = PFAPlant;
    const at = (x) => S.r3At(world, x), gy = (x) => world.ground[clamp(Math.round(x), 0, world.w)];
    const FA = LV4_ANCH.face = { trays: [], pits: [], cores: [], skids: [], rails: [], canals: [], water: [], fans: [], leds: [], grass: [], ins: [], lamps: [], birds: [] };
    const items = [], add = (y, fn) => items.push({ y, fn }), put4 = (q, x, y, hex) => K.put(q, x, y, U(hex));
    const qy = (x, q) => { const A = at(x); return Math.round(A.top + (A.e2 - A.top) * q); };
    const veg = (kind, x, y, sc, sd) => {
      if (kind === 'tab') S.tabaiba(pb, x, y, sc, sd);
      else if (kind === 'card') S.cardon(pb, x, y, Math.round(24 * sc + 6), sd);
      else if (kind === 'agave') F.agave(pb, x, y, Math.max(6, 10 * sc), sd);
      else if (kind === 'grass') { S.grassWind(pb, x, y, Math.round(10 * sc), Math.round(9 * sc), sd); FA.grass.push([x, y, Math.round(9 * sc), 0]); }
      else if (kind === 'green') { S.grassWind(pb, x, y, Math.round(10 * sc), Math.round(10 * sc), sd, RAMP.grassR); FA.grass.push([x, y, Math.round(10 * sc), 1]); }
      else if (kind === 'opu') S.opuntia(pb, x, y, 0.55 + sc * 0.3, sd);
      else if (kind === 'stones') S.stones(pb, x, y, Math.round(12 * sc), sd);
      else if (kind === 'aloe') F.agave(pb, x, y, Math.max(5, 8 * sc), sd, S.R3ALOE);
      else if (kind === 'zoco') S.zoco(pb, x, y, 0.8 + sc * 0.25, sd);
    };
    /** Vegetación del bancal: un grupo cada ~gap px repartido en profundidad (q0..q1 del bancal) */
    const flora = (x0, x1, q0, q1, gap, mix, seed, skip) => {
      const rr = RNG(seed), keys = Object.keys(mix), tot = keys.reduce((s, k) => s + mix[k], 0), small = ['grass', 'tab', 'stones', 'green', 'aloe', 'grass'];
      for (let x = x0 + rr.int(2, gap); x < x1 - 4; x += Math.round(gap * (0.6 + rr() * 0.8))) {
        const A = at(x), span = A.e2 - A.top, y = Math.round(A.top + (q0 + rr() * (q1 - q0)) * span), sc = 0.95 + (y - A.top) / Math.max(1, span) * 0.8;
        if (skip && skip(x, y)) continue;
        let p = rr() * tot, kind = keys[0]; for (const k of keys) { p -= mix[k]; if (p <= 0) { kind = k; break; } }
        add(y, () => veg(kind, x, y, sc, x * 7 + seed));
        // satélites del grupo (2–3 piezas menores ordenadas por profundidad)
        const n = rr.int(1, 3);
        for (let k = 0; k < n; k++) {
          const x2 = x + rr.int(-15, 15), y2 = clamp(y + rr.int(-3, 7), A.top + 2, A.e2 - 3), kk = small[rr.int(0, small.length - 1)];
          if (skip && skip(x2, y2)) continue;
          add(y2, () => veg(kk, x2, y2, sc * (kk === 'tab' ? 0.55 : 0.75), x2 * 3 + seed + k));
        }
      }
    };
    /** Talud: matas, piedras, gramíneas entre la pasarela y el muro */
    const slope = (x0, x1, gap, seed) => {
      const rr = RNG(seed);
      for (let x = x0 + rr.int(2, gap); x < x1 - 4; x += Math.round(gap * (0.6 + rr() * 0.8))) {
        const A = at(x), y = Math.round(A.gy + 6 + rr() * Math.max(2, A.e1 - A.gy - 6)), k = rr();
        add(y, () => k < 0.3 ? veg(k < 0.15 ? 'green' : 'grass', x, y, 0.95, x + seed) : k < 0.42 ? veg('stones', x, y, 0.9, x + seed) : k < 0.76 ? S.tabaiba(pb, x, y, 0.62 + rr() * 0.3, x + seed) : k < 0.84 ? S.dryBush(pb, x, y, 13, 8, x + seed) : k < 0.92 ? F.agave(pb, x, y, 7, x + seed, S.R3ALOE) : F.agave(pb, x, y, 8, x + seed));
      }
    };
    /* ===== A · JARDÍN DE TABAIBAS, ZOCOS Y ALJIBE (0–340) ===== */
    slope(0, 340, 10, 11);
    { const y = qy(150, 0.42); add(y, () => { const b = S.basin(pb, 118, y - 13, 64, 15); FA.water.push(b.water); K.text(pb, 'ALJIBE', 130, y + 5, U('#fbe6c0'), { font: 'tiny' }); S.r3Shadow(pb, 170, y + 2, 16, 3, 0.3); }); }
    { const y = qy(206, 0.36); add(y, () => { I.cylV(pb, 208, y, 9, 28, { ramp: ['#063a52', '#0a5a7a', '#0e7ea6', '#16a6cc', '#3ac8e6', '#8ae6f6', '#e0fbff'] }); S.r3Shadow(pb, 214, y, 11, 4); for (let k = 0; k < 30; k++) put4(pb, 199 - Math.round(k * 0.9), y - 6 + Math.round(Math.sin(k * 0.2) * 2), '#1e7a8a'); FA.leds.push({ x: 212, y: y - 24, col: '#56e5ff', hz: 0.8, ph: 2 }); }); }
    for (const [x, q] of [[40, 0.55], [86, 0.82], [262, 0.7], [300, 0.3]]) { const y = qy(x, q); add(y, () => S.zoco(pb, x, y, 1.05, x)); }
    add(qy(60, 0.3), () => S.dryWall(pb, [[8, qy(8, 0.12)], [60, qy(60, 0.45)], [104, qy(104, 0.95)]], 13));
    add(qy(240, 0.3), () => S.dryWall(pb, [[226, qy(226, 0.08)], [244, qy(244, 0.5)], [236, qy(236, 0.96)]], 17));
    flora(0, 340, 0.08, 0.96, 15, { tab: 6, card: 2, agave: 2, grass: 1, opu: 1, green: 1 }, 101, (x, y) => x > 112 && x < 222 && y < qy(150, 0.5));
    /* ===== B · FRANJA AGRIVOLTAICA (340–1160) ===== */
    slope(340, 1160, 10, 21);
    const kinds = ['lettuce', 'aloe', 'tomato', 'herb'];
    const fanSkip = (yy) => (x) => at(x).top > yy - 2;
    const path = (x) => Math.abs(x - 836) < 7;
    for (let px0 = 352, pi = 0; px0 < 1150; px0 += 160, pi++) {
      const px1 = Math.min(1150, px0 + 146);
      for (const [q, ki] of [[0.2, pi], [0.36, pi + 1], [0.66, pi + 2], [0.84, pi + 3]]) {
        const y = qy((px0 + px1) / 2, q);
        add(y, () => S.cropRow(pb, px0, px1, y, kinds[ki % 4], px0 + q * 100, (x) => fanSkip(y)(x) || path(x)));
      }
    }
    const tabs = [];
    for (let x = 362; x < 1110; x += 92) { const yb = qy(x + 28, 0.52); if (at(x + 28).fan > 4 || at(x).fan > 4 || at(x + 56).fan > 4) continue; add(yb, () => { const T = S.agriPV(pb, x, yb, 56, x); tabs.push(T); }); }
    // senda de mantenimiento en diagonal con pasarela sobre el canal
    add(1, () => { for (let k = 0; k < 60; k++) { const x = 812 + Math.round(k * 0.4), y = at(x).top + k; if (y > at(x).e2 - 8) break; for (let w = -4; w <= 4; w++) put4(pb, x + w, y, Math.abs(w) === 4 ? '#8e5a2a' : ((x + w + y) % 5 ? '#d8b078' : '#c09060')); } });
    // canal de riego al frente del bancal (compuertas cada ~160 px) y pasarela
    add(9999, () => {
      S.canal(pb, 344, 1156, (x) => at(x).e2 - 6); FA.canals.push({ x0: 344, x1: 1156, y: (x) => at(x).e2 - 7 });
      for (let x = 420; x < 1150; x += 160) { const y = at(x).e2 - 6; I.box3q(pb, x, y + 1, 4, 9, 3, { ramp: PFInfra.STEEL }); put4(pb, x + 1, y - 9, '#2c6cc6'); }
      const bx = 832, by = at(bx).e2 - 7; I.box3q(pb, bx - 8, by + 3, 20, 2, 4, { ramp: PFArch.WOOD }); for (const px of [bx - 8, bx + 11]) for (let k = 0; k < 7; k++) put4(pb, px, by - 4 - k, '#9a6a44');
      for (let x = bx - 8; x < bx + 12; x++) put4(pb, x, by - 8, '#c08e60');
    });
    // zanja CC enterrada al pie del muro: hitos y catas; bandejas que bajan de cada caja de string
    add(0, () => { for (let x = 366; x < 1150; x += 44) { const A = at(x); if (A.fan > 3) continue; const y = A.top + 4; for (let k = 0; k < 6; k++) { put4(pb, x, y - k, k < 2 ? '#f0bc2c' : '#e8e4dc'); put4(pb, x + 1, y - k, k < 2 ? '#a87a10' : '#9a968e'); } put4(pb, x, y - 6, '#e2404a'); } });
    for (const s of PV_STRINGS) {
      const xa = s.x + 64, A = at(xa + 8);
      add(A.top + 2, () => { const tr = S.cableTray(pb, [[xa, gy(xa) + 3], [xa + 4, Math.round((gy(xa) + A.e1) / 2)], [xa + 8, A.top + 3], [xa + 40, A.top + 3]]); tr.sid = s.id; FA.trays.push(tr); });
    }
    add(2, () => { for (const [x0, x1] of [[648, 778], [990, 1060]]) { const A = at((x0 + x1) / 2); FA.pits.push(S.trenchPit(pb, x0, x1, A.top + 7, 12)); } });
    // carril del robot de limpieza a lo largo del borde inferior de los módulos (tras las mesas)
    add(qy(700, 0.52) + 1, () => {
      if (!tabs.length) return;
      const Al = K.P32(S.ALU), segs = tabs.map(t => [t.quad[0][0] - 3, t.quad[1][0] + 3, t.quad[0][1] + 1]);
      for (const [x0, x1, y] of segs) for (let x = x0; x < x1; x++) { K.put(pb, x, y, Al[6]); K.put(pb, x, y + 1, Al[2]); }
      FA.rails.push({ segs });
    });
    /* ===== C · ZÓCALO DEL TALLER CON GALERÍA DE CABLES (1160–1520) ===== */
    add(0, () => {
      const vx0 = 1248, vx1 = 1400, g = gy(1300), y0 = g + 12, y1 = g + 49;
      const C = K.P32(S.R3CONW);
      // contrafuertes de hormigón que rompen el paño de sillería
      for (const bx of [1222, 1412, 1470]) { for (let y = g + 5; y < g + 50; y++) for (let k = 0; k < 9; k++) K.put(pb, bx + k, y, C[clamp([7, 6, 5, 5, 4, 4, 3, 2, 1][k] - (y > g + 44 ? 1 : 0), 0, 7)]); for (let k = 0; k < 9; k++) K.put(pb, bx + k, g + 5, C[7]); }
      for (let y = y0; y < y1; y++) for (let x = vx0; x < vx1; x++) {
        const lx = x - vx0, ly = y - y0, lw = vx1 - vx0, lh = y1 - y0;
        if (ly < 3 || lx < 3 || lx > lw - 4) { K.put(pb, x, y, C[ly === 0 ? 7 : lx < 3 ? [7, 6, 4][lx] : ly < 3 ? [7, 5, 2][ly] : [2, 1, 1][lw - 1 - lx]]); continue; }
        const dl = Math.hypot((lx - lw * 0.5) / lw, (ly - 4) / lh * 0.8);
        let c = K.mixU(U('#2a1c2a'), U('#d0a070'), clamp(0.78 - dl * 1.2, 0, 0.78));
        if (ly < 6) c = K.mixU(c, U('#140c14'), 0.5);
        if (ly > lh - 6) c = K.mixU(U('#5a4434'), U('#e0c098'), clamp(0.65 - dl, 0.1, 0.65));
        K.put(pb, x, y, c);
      }
      const trays = [[y0 + 10, '#a8202a', '#1c1c24'], [y0 + 17, '#1c1c24', '#a8202a'], [y0 + 24, '#6c7280', '#3a3e48']];
      for (const [ty, c1, c2] of trays) for (let x = vx0 + 3; x < vx1 - 3; x++) { K.put(pb, x, ty, U('#b2b6c0')); K.put(pb, x, ty + 1, U('#4c5260')); K.put(pb, x, ty - 1, U((x >> 1) % 3 ? c1 : c2)); if ((x - vx0) % 12 === 0) for (let k = 0; k < 4; k++) K.put(pb, x, ty + 1 + k, U('#3a3e48')); }
      for (const cx of [1270, 1286, 1330, 1346]) for (let y = y0 + 3; y < y0 + 10; y++) { K.put(pb, cx, y, U(y % 2 ? '#a8202a' : '#1c1c24')); K.put(pb, cx + 1, y, U('#1c1c24')); }
      // armario de seccionadores CC y transformador de servicios auxiliares dentro de la galería
      I.box3q(pb, vx0 + 50, y1 - 5, 16, 16, 4, { ramp: ['#5a5466', '#7e7686', '#a39aa4', '#c4bcc0', '#ddd6d4', '#efe9e2', '#faf6ee'], skew: 0.6 }); P.rect(pb, vx0 + 52, y1 - 17, 5, 3, U('#06122a'));
      I.box3q(pb, vx0 + 96, y1 - 5, 20, 13, 5, { ramp: ['#14202a', '#24384a', '#3a566e', '#567a94', '#7aa0b8', '#a8c4d4'], skew: 0.6 });
      FA.vault = { x0: vx0, x1: vx1, y0, y1, dc: [[1160, y0 + 9], [vx0 + 22, y0 + 9], [vx0 + 22, y0 + 3]], dc2: [[1160, y0 + 16], [vx0 + 38, y0 + 16], [vx0 + 38, y0 + 3]], ac: [[vx1 - 46, y0 + 23], [vx1 + 160, y0 + 23]], lamp: [Math.round((vx0 + vx1) / 2), y0 + 6], scr: [vx0 + 52, y1 - 17, 5, 3] };
      P.rect(pb, Math.round((vx0 + vx1) / 2) - 6, y0 + 3, 13, 2, U('#4f4d51')); P.hline(pb, Math.round((vx0 + vx1) / 2) - 5, Math.round((vx0 + vx1) / 2) + 5, y0 + 5, U('#fff6d8'));
      P.rect(pb, vx0 + 8, y1 - 14, 34, 9, U('#0a1a34')); K.text(pb, 'GALERÍA', vx0 + 10, y1 - 13, U('#ffe14d'), { font: 'tiny' });
      for (const vx of [1192, 1440]) { P.rect(pb, vx, g + 14, 16, 10, U('#2a1c14')); for (let k = 0; k < 4; k++) P.hline(pb, vx + 1, vx + 14, g + 16 + k * 2, U('#8e7a64')); }
      I.pipe(pb, [[1176, g + 36], [1238, g + 36], [1238, g + 8]], 2, 'product', { flange: 18 });
      FA.water.push([1176, g + 35, 62, 1]);
      // escalera de servicio en diagonal (del bancal a la pasarela) junto al contrafuerte este
      for (let k = 0; k < 40; k++) { const x = 1484 - Math.round(k * 0.9), y = g + 48 - k; for (let w = 0; w < 7; w++) K.put(pb, x + w, y, C[(k % 3 === 0) ? 7 : w > 4 ? 3 : 5]); }
      for (let k = 0; k < 40; k++) { const x = 1484 - Math.round(k * 0.9) + 8, y = g + 48 - k - 10; K.put(pb, x, y, U('#f0bc2c')); if (k % 8 === 0) for (let q = 0; q < 10; q++) K.put(pb, x, y + q, U('#a87414')); }
      // aeonium y uña de gato (flor amarilla) colgando del borde del zócalo
      for (let x = 1186; x < 1478; x += 14 + ((x * 7) % 9)) { if (x > vx0 - 6 && x < vx1 + 6) continue; for (let k = 0; k < 6 + (x % 7); k++) { K.put(pb, x + (k % 2), g + 5 + k, U(k % 3 ? '#4a7a2a' : '#7aa83a')); } K.put(pb, x + 1, g + 6, U('#f6d24a')); }
    });
    add(9000, () => { const A = at(1192), y = A.e2 - 3; I.cylV(pb, 1192, y, 13, 32, { ramp: ['#063a52', '#0a5a7a', '#0e7ea6', '#16a6cc', '#3ac8e6', '#8ae6f6', '#e0fbff'] }); S.r3Shadow(pb, 1200, y, 14, 5); K.text(pb, 'AGUA', 1185, y - 20, U('#e8fbff'), { font: 'tiny' }); FA.leds.push({ x: 1200, y: y - 30, col: '#56e5ff', hz: 1, ph: 1 }); });
    add(9001, () => { for (const x of [1414, 1446]) { const y = at(x).e2 - 3; S.robot(pb, x, y); S.r3Shadow(pb, x + 14, y, 15, 4); } });
    flora(1160, 1520, 0.25, 0.95, 18, { tab: 3, grass: 3, stones: 2, agave: 1, aloe: 1 }, 131, (x) => x > 1176 && x < 1214 || x > 1405 && x < 1480);
    /* ===== D · SKIDS DE INVERSORES BAJO LOS SEGUIDORES (1520–1920) ===== */
    slope(1520, 1920, 10, 41);
    for (const [x, lab, tx] of [[1566, 'INV-5', 1604], [1744, 'INV-6', 1834]]) {
      const yb = qy(x + 30, 0.62);
      add(yb, () => { const k = S.invSkid(pb, x, yb, { label: lab }); FA.skids.push(k); FA.fans.push(k.fan); FA.leds.push({ x: k.led[0], y: k.led[1], col: '#3fe0a0', hz: 1.3, ph: x }); FA.ins.push(k.hv); });
      // bandeja desde la fila de seguidores hasta la entrada CC del skid
      const A = at(tx); add(A.top, () => { const tr = S.cableTray(pb, [[tx, gy(tx) + 3], [tx + 3, A.e1 - 2], [tx + 6, A.top + 4], [x - 2, yb - 10]]); tr.sid = 'trk'; FA.trays.push(tr); });
    }
    { const y = qy(1690, 0.85); add(y, () => S.cableDrum(pb, 1690, y, 9)); }
    flora(1520, 1920, 0.05, 0.98, 14, { tab: 5, card: 2, grass: 1, agave: 1, aloe: 1 }, 141, (x, y) => (x > 1556 && x < 1640 && y < qy(x, 0.75) && y > qy(x, 0.15)) || (x > 1734 && x < 1818 && y < qy(x, 0.75) && y > qy(x, 0.15)));
    /* ===== E · PATIO DE SUBESTACIÓN Y HANGAR (1920–2300) ===== */
    slope(1920, 2300, 10, 51);
    { const yb = qy(2010, 0.72); add(yb, () => { const s2 = S.substation(pb, 1934, yb, 150); FA.ins.push(...s2.ins, ...s2.hv); FA.sub = s2; K.text(pb, 'SUBESTACIÓN 20/66 kV', 1950, yb + 3, U('#fbe6c0'), { font: 'tiny' }); }); }
    { const yb = qy(2210, 0.86); add(yb, () => { const h = S.hangar(pb, 2150, yb, 104, 40, { label: 'HANGAR' }); FA.lamps.push([h.lamp[0], h.lamp[1], '#ffd890', 12]); FA.hangar = h; }); }
    for (const [x, q, kind] of [[2098, 0.5, 'drum'], [2120, 0.62, 'drum2'], [2104, 0.86, 'pallet'], [1996, 0.2, 'pallet']]) { const y = qy(x, q); add(y, () => kind === 'pallet' ? S.modulePallet(pb, x, y, 5) : S.cableDrum(pb, x, y, kind === 'drum' ? 10 : 8, kind === 'drum' ? '#1c1c24' : '#a8202a')); }
    flora(1920, 2300, 0.05, 0.98, 16, { tab: 3, grass: 2, card: 1, agave: 1 }, 151, (x, y) => (x > 1926 && x < 2094 && y > qy(x, 0.2)) || (x > 2140 && x < 2290 && y > qy(x, 0.3)));
    /* ===== F · VIVERO DE DUNAS: CUADRÍCULA DE PAJA, ZOCOS Y CARDONAL (2300–2800) ===== */
    slope(2300, 2800, 9, 61);
    { const y0 = qy(2420, 0.12), y1 = qy(2420, 0.6); add(y0, () => S.strawGrid(pb, 2340, 2560, y0, y1, 71)); }
    for (const [x, q] of [[2600, 0.4], [2680, 0.75], [2760, 0.35]]) { const y = qy(x, q); add(y, () => S.zoco(pb, x, y, 1.1, x)); }
    for (const [x, q, f] of [[2470, 0.82, 1], [2520, 0.9, -1]]) { const y = qy(x, q); add(y, () => S.hubara(pb, x, y, f)); }
    { const yb = qy(2700, 0.62); add(yb, () => S.shadeHouse(pb, 2652, yb, 100, 30)); }
    add(qy(2580, 0.2), () => S.sandFence(pb, 2566, 2648, (x) => qy(x, 0.12 + (x - 2566) / 82 * 0.8), { seed: 37, bury: 0.25 }));
    add(qy(2300, 0.2), () => S.dryWall(pb, [[2304, qy(2304, 0.1)], [2330, qy(2330, 0.6)], [2310, qy(2310, 0.97)]], 19));
    { const y = qy(2622, 0.9); add(y, () => { I.cylV(pb, 2622, y, 8, 22, { ramp: ['#063a52', '#0a5a7a', '#0e7ea6', '#16a6cc', '#3ac8e6', '#8ae6f6', '#e0fbff'] }); S.r3Shadow(pb, 2628, y, 9, 3); for (let k = 0; k < 24; k++) put4(pb, 2631 + k, y - 3, '#1e7a8a'); }); }
    flora(2300, 2800, 0.05, 0.98, 14, { tab: 5, card: 3, grass: 2, agave: 2, opu: 1, green: 2 }, 161, (x, y) => (x > 2336 && x < 2564 && y < qy(x, 0.62)) || (x > 2644 && x < 2768 && y > qy(x, 0.2) && y < qy(x, 0.66)));
    /* ===== r3-desert · línea de CA enterrada: galería → skids → patio de subestación (cinta naranja, hitos) ===== */
    const acPath = [];
    { const g0 = gy(1300), yv = g0 + 12 + 23;
      for (let x = 1397; x < 1528; x++) acPath.push([x, yv, 1]);                                       // conducto adosado al zócalo
      const q0 = clamp((yv - at(1528).top) / Math.max(1, at(1528).e2 - at(1528).top), 0.12, 0.3);
      let py = yv;
      for (let x = 1528; x < 1936; x++) { const ty = qy(x, q0 + (x > 1880 ? (x - 1880) / 56 * 0.42 : 0)); while (Math.abs(ty - py) > 1) { py += Math.sign(ty - py); acPath.push([x, py, 0]); } py = ty; acPath.push([x, py, 0]); }
      add(1.5, () => {
        const St = K.P32(PFInfra.STEEL);
        for (const [x, y, c] of acPath) {
          if (c) { K.put(pb, x, y - 2, St[6]); K.put(pb, x, y - 1, St[4]); K.put(pb, x, y, U((x >> 2) & 1 ? '#c8562a' : '#e8805a')); K.put(pb, x, y + 1, St[2]); K.put(pb, x, y + 2, U('#2a1c14')); if (x % 14 === 0) for (let k = -2; k < 3; k++) K.put(pb, x, y + k, St[1]); }
          else { K.put(pb, x, y - 1, U('#5a3418')); K.put(pb, x, y, U(((x >> 2) & 1) ? '#f08a3a' : '#c8562a')); K.put(pb, x, y + 1, U('#3a2010')); }
        }
        for (let i = 40; i < acPath.length; i += 52) { const [x, y, c] = acPath[i]; if (c) continue; for (let k = 1; k < 7; k++) { K.put(pb, x, y - k, U(k > 4 ? '#f08a3a' : '#e8e4dc')); K.put(pb, x + 1, y - k, U(k > 4 ? '#9a4614' : '#9a968e')); } }
      });
    }
    // orden por profundidad (lo más lejano primero)
    items.sort((a, b) => a.y - b.y);
    for (const it of items) it.fn();
    // tramos de la línea de CA que quedan a la vista (los skids y las matas la tapan): máscara para los pulsos
    { const cab = new Set(['#c8562a', '#e8805a', '#f08a3a'].map(h => U(h) >>> 0)); FA.ac = acPath.map(([x, y]) => [x, y, cab.has(K.get(pb, x, y) >>> 0) ? 1 : 0]); }
    /* ===== corte frontal: zanjas en sección, tubería de riego, raíces y nidos ===== */
    for (let x = 380; x < 1150; x += 92) { const A = at(x + 30); FA.cores.push(...S.trenchSection(pb, x + 30, A.e2 + 14, 18, 14)); }
    for (const x of [1594, 1772, 2040]) { const A = at(x); FA.cores.push(...S.trenchSection(pb, x, A.e2 + 16, 26, 16)); }
    for (let x = 30; x < 2780; x += 110) { const A = at(x); if (x > 360 && x < 1150) continue; S.pipeSection(pb, x, A.e2 + 20, 3); }
    { const rr = RNG(171); for (let x = 10; x < 2790; x += 7 + rr.int(0, 10)) { const A = at(x); S.roots(pb, x, A.e2 + 2, 8 + rr.int(0, 24), x); } }
  },
  /* ---------------- dinámico ---------------- */
  /** Detrás de los accesorios: reverbero del horizonte (dos trazos claros que ondulan) — no cruza el taller ni las mesas */
  renderBack(g, sc, cam) {
    const t = Game.time, hz = (sc.backdrop.horizon || 170) - Math.round(cam.y * 0.08);
    for (let r = 0; r < 2; r++) {
      g.globalAlpha = 0.16 - r * 0.05;
      for (let x = -((t * 6 + r * 7) % 16); x < W; x += 16) frect(g, Math.round(x + Math.sin(t * 2.6 + x * 0.09 + r) * 2), hz - 4 + r * 5 + Math.round(Math.sin(t * 3.1 + x * 0.05) * 1), 9, 1, r ? '#fff4d8' : '#ffffff');
    }
    g.globalAlpha = 1;
    R3DESERT_sky(g, sc, cam);
  },
  /** Capas dinámicas de cada string (polvo, costras y lona) según el estado actual */
  overlay(s, st) {
    const key = s.id + '|' + Math.round(st.soil * 20) + '|' + (st.crust > 0 ? 1 : 0) + '|' + (st.shade > 0 ? 1 : 0);
    this._ov = this._ov || new Map();
    let o = this._ov.get(key); if (o) return o;
    const tabs = LV4_ANCH.strings[s.id]; if (!tabs) return null;
    const x0 = tabs[0].x - 2, y0 = tabs[0].quad[2][1] - 6, w = 150, h = 64, pb = new PixelBuffer(w, h);
    for (const T of tabs) {
      const [[ax, ay], , [cx2, cy2], [dx2]] = T.quad; const ph = ay - cy2, sk = dx2 - ax, tw = T.quad[1][0] - ax;
      for (let yy = cy2 + 1; yy < ay - 1; yy++) { const v = (ay - yy) / ph, off = Math.round(v * sk); for (let xx = ax + off + 1; xx < ax + tw + off; xx++) {
        const d = PFK.cl(xx, yy, 3, 41 + s.x) * (1.2 - v * 0.8);
        if (st.soil > 0.03 && d < st.soil * 1.6) PFK.blend(pb, xx - x0, yy - y0, U('#c89a5c'), clamp(st.soil * 1.6 - d + 0.2, 0, 0.7));
        if (st.crust > 0 && hash2(xx >> 1, yy >> 1, 71 + s.x) < st.crust * 0.12) PFK.put(pb, xx - x0, yy - y0, U('#f4f0e6'));
      } }
    }
    if (st.shade > 0) { // lona ocre arrastrada por el viento sobre parte de la hilera, con pliegues y cuerda
      const T = tabs[0], [[ax, ay], , , [dx2, dy2]] = T.quad;
      PFK.polyFill(pb, [[ax + 18 - x0, ay - 2 - y0], [ax + 58 - x0, ay - 4 - y0], [dx2 + 52 - x0, dy2 + 6 - y0], [dx2 + 14 - x0, dy2 + 10 - y0]], (xx, yy) => U(((xx + yy * 0.5) % 9) < 2 ? '#8a5a1a' : ((xx * 3 + yy) % 11) < 3 ? '#e0a040' : '#c8861a'));
      for (let k = 0; k < 30; k++) PFK.put(pb, ax + 18 + k - x0, Math.round(ay - 2 - y0 + Math.sin(k * 0.3)), U('#5a3a10'));
    }
    o = { c: pb.toCanvas(), x: x0, y: y0 };
    if (this._ov.size > 40) this._ov.clear();
    this._ov.set(key, o); return o;
  },
  renderMid(g, sc, cam) {
    const S = sc.state, t = Game.time, ox = cam.x, oy = cam.y, w = sc.world, N = LV4_ANCH;
    const gy = (x) => w.groundAt(x) - oy;
    for (const s of PV_STRINGS) {
      const st = (S.strings || {})[s.id] || s, tabs = N.strings[s.id];
      if (!tabs || s.x + 80 - ox < -20 || s.x - 80 - ox > W + 20) { s.cloud = sc.backdrop.cloudShadowAt(s.x); continue; }
      // suciedad, costras y lona según el estado (la limpieza se ve)
      const ov = this.overlay(s, st); if (ov) g.drawImage(ov.c, ov.x - ox, ov.y - oy);
      // sombras de nubes reales sobre las mesas (reducen la potencia): paralelogramo sin tramado
      const sh = sc.backdrop.cloudShadowAt(s.x); s.cloud = sh;
      if (sh > 0.05) for (const T of tabs) { const q = T.quad; g.globalAlpha = sh * 0.42; g.fillStyle = '#1a1440'; for (let yy = q[2][1]; yy <= q[0][1]; yy += 2) { const v = (q[0][1] - yy) / (q[0][1] - q[2][1]); g.fillRect(Math.round(q[0][0] + v * (q[3][0] - q[0][0]) - ox), yy - oy, 61, 2); } g.globalAlpha = 1; }
      // destello del sol que recorre los módulos limpios
      if (sh < 0.2 && st.soil < 0.1) { const T = tabs[Math.floor(t * 0.5 + s.x) % 2], q = T.quad, k = (t * 0.6 + s.x * 0.01) % 1; const xx = Math.round(lerp(q[3][0], q[2][0], k) - ox), yy = q[3][1] + 6 - oy; frect(g, xx, yy, 2, 1, '#ffffff'); fpx(g, xx + 1, yy + 1, '#d6ecff'); }
      // indicador de corriente en la caja
      const I = this.stringCurrent(s, S);
      frect(g, s.x + 68 - ox, gy(s.x) - 24, 6, 2, I > 0.8 ? '#86e36f' : I > 0.55 ? '#ffe14d' : '#ff4e5d');
    }
    // seguidores: brillo del motor y LED
    if (N.trackers) for (const T of N.trackers) { const [hx, hy] = T.hub; if (hx - ox > -10 && hx - ox < W + 10 && (Math.floor(t * 1.5 + hx) % 3) === 0) fpx(g, hx - ox, hy - oy, '#3fe0a0'); }
    // inversores: pantallas, LED y aire caliente del inversor recalentado
    PFInfra.drawLeds(g, sc, N.leds);
    for (const [x, y, ww, hh, col] of N.screens) { const sx = x - ox; if (sx < -20 || sx > W + 20) continue; for (let i = 0; i < 2; i++) frect(g, sx, y - oy + 1 + i * 2, 2 + ((i * 5 + Math.floor(t * 2) + x) % (ww - 2)), 1, col); }
    if (N.hot && !(GS.lp(4).side || {}).inverter) { const [vx, vy] = N.hot; PFK.drawGlow(g, vx - 8 - ox, vy + 12 - oy, 10, '#ff7a3a', 0.28 + 0.08 * Math.sin(t * 3)); for (let i = 0; i < 4; i++) { const ph = (t * 0.8 + i / 4) % 1; fpx(g, Math.round(vx - 10 + Math.sin(ph * 9 + i) * 2 - ox), Math.round(vy - ph * 18 - oy), '#ffd0a0'); } }
    PFDyn.glows(g, cam, N.lamps, '#fff0c8', 10, 0.3);
    // robot de limpieza en movimiento (cepillo turquesa y polvo)
    if (S.robotX != null) { const rx = S.robotX - ox, ry = gy(S.robotX) - 12; frect(g, rx, ry, 22, 7, '#f0bc2c'); frect(g, rx, ry, 22, 1, '#fff2a8'); frect(g, rx - 2, ry - 4, 26, 3, '#1aa894'); frect(g, rx - 2, ry - 4, 26, 1, '#9cecdc'); fpx(g, rx + 4, ry + 7, '#1c1c24'); fpx(g, rx + 17, ry + 7, '#1c1c24'); for (let i = 0; i < 4; i++) fpx(g, rx + Math.random() * 22, ry - 5 - Math.random() * 5, '#f2c14e'); }
    // SOC de las baterías y estado del despacho
    if (N.bess) for (const B of N.bess) drawSOCStrip(g, B.soc[0] - ox, B.soc[1] - oy, B.soc[2], S.soc ?? 0.62, t, 1);
    if (N.ins) for (const [x, y] of N.ins) if ((Math.floor(t * 2 + x) % 5) === 0) PFK.drawGlow(g, x - ox, y - oy, 4, '#a8e0ff', 0.5);
    if (N.kiosk) {
      const [kx0, ky0, kw, kh] = N.kiosk, kx = kx0 - ox, ky = ky0 - oy;
      if (S.mirageScreen) { for (let i = 0; i < 8; i++) frect(g, kx + 2 + ((i * 11 + Math.floor(t * 20)) % (kw - 10)), ky + 3 + i * 4, 8, 1, (i % 2) ? '#f27ee6' : '#56e5ff'); drawText(g, 'PICO ★', kx + kw / 2, ky + 12, { font: 'tiny', align: 'center', color: '#ffe14d' }); }
      else { drawText(g, fmt0(this.fieldPower(S, sc)) + ' kW', kx + kw / 2, ky + 6, { font: 'tiny', align: 'center', color: '#ffe14d' }); for (let i = 0; i < kw - 6; i += 2) { const v = Math.sin((i / (kw - 6)) * Math.PI); fpx(g, kx + 3 + i, Math.round(ky + kh - 4 - v * (kh - 18) * clamp(this.fieldPower(S, sc) / 820, 0, 1)), '#ffe14d'); } }
    }
    // estación meteorológica: cazoletas girando
    if (N.met) { const [cx, cy] = N.met.cups, a = t * 5; for (let k = 0; k < 3; k++) { const aa = a + k * TAU / 3; fpx(g, Math.round(cx + Math.cos(aa) * 4 - ox), Math.round(cy + Math.sin(aa) * 1.5 - oy), '#f4f6f8'); } frect(g, cx - 4 - ox, cy - oy, 9, 1, '#8e94a2'); }
    // aeromotor: rotor multipala girando con el viento
    if (N.pump) { const [hx, hy] = N.pump.hub, sx = hx - ox; if (sx > -30 && sx < W + 30) { const a0 = t * 2.2; for (let k = 0; k < 12; k++) { const aa = a0 + k * TAU / 12; for (let q = 3; q < 14; q++) fpx(g, Math.round(sx + Math.cos(aa) * q * 0.45), Math.round(hy - oy + Math.sin(aa) * q), q > 11 ? '#c8562a' : '#d2d6dc'); } frect(g, sx - 1, hy - oy - 1, 3, 3, '#4c5260'); } }
    this.ambient(g, sc, cam);
    R3DESERT_mid(g, sc, cam, this);
    // manga de viento ondeando hacia el este
    if (N.sock) { const [sx0, sy0] = N.sock; for (let i = 0; i < 16; i++) { const wv = Math.round(Math.sin(t * 7 - i * 0.6) * (i / 16) * 2); frect(g, sx0 + i - ox, sy0 + 1 + Math.round(i * 0.25) + wv - oy, 1, 6 - Math.round(i / 5), (Math.floor(i / 4) % 2) ? '#ffffff' : '#ff6a2a'); } }
  },
  /** r3-desert: capa animada del diorama inferior (tras el terreno): CC amarilla, CA naranja, ventiladores, canal, robot, gramíneas */
  renderFront(g, sc, cam) { R3DESERT_front(g, sc, cam, this); },
  /** Ambiente del desierto: reverbero sobre el horizonte, arena que corre con el viento por las dunas y lagartijas */
  ambient(g, sc, cam) {
    const t = Game.time, ox = cam.x, oy = cam.y, w = sc.world;
    // (r2-biomes-a) el reverbero del horizonte se dibuja en renderBack, detrás de los accesorios: ya no cruza fachadas
    // arena a la deriva sobre las dunas (granos que corren pegados al suelo hacia el este)
    const dune = (x) => (x >= 0 && x < 340) || (x >= 1520 && x < 2800);
    for (let i = 0; i < 34; i++) {
      const sp = 34 + hash1(i, 51) * 30, span = W + 60, v = hash1(i, 52) * span + t * sp, sx = ((v % span) + span) % span - 30, X = sx + ox;
      if (!dune(X)) continue;
      const sy = Math.round(w.groundAt(X) - 2 - hash1(i, 53) * 9 - Math.abs(Math.sin(t * 4 + i)) * 2 - oy);
      g.globalAlpha = 0.65; frect(g, Math.round(sx), sy, 2, 1, i % 3 ? '#f8dca0' : '#fff0c8'); g.globalAlpha = 0.3; fpx(g, Math.round(sx) - 2, sy, '#f8dca0');
    }
    g.globalAlpha = 1;
    // lagartijas: corren a ratos entre matas (pausas largas)
    for (const [x0, len, ph] of [[180, 90, 0], [1600, 120, 3.1], [2420, 140, 1.7]]) {
      const cyc = (t * 0.25 + ph) % 1, run = clamp((cyc - 0.6) / 0.25, 0, 1), dir = Math.floor(t * 0.25 + ph) % 2 ? -1 : 1;
      const X = dir > 0 ? x0 + run * len : x0 + len - run * len, sx = Math.round(X - ox); if (sx < -8 || sx > W + 8) continue;
      const sy = Math.round(w.groundAt(X) - 3 - oy), leg = run > 0 && run < 1 ? Math.floor(t * 18) % 2 : 0;
      frect(g, sx - 2 * dir, sy, 5, 1, '#4e6a2a'); frect(g, sx - 1 * dir, sy - 1, 3, 1, '#7a9a3a'); fpx(g, sx + 3 * dir, sy, '#2e3a1a');
      fpx(g, sx - 4 * dir, sy + 1, '#4e6a2a'); fpx(g, sx - 5 * dir, sy + 1, '#4e6a2a');
      fpx(g, sx - 1 + leg, sy + 1, '#2e3a1a'); fpx(g, sx + 1 - leg, sy + 1, '#2e3a1a');
    }
  },
  /** corriente relativa del string (0..1) por suciedad, costra, sombra y nubes */
  stringCurrent(s, S) { const st = (S.strings || {})[s.id] || s; return (1 - st.soil) * (1 - st.crust) * (1 - st.shade) * (1 - (s.cloud || 0) * 0.7); },
  fieldPower(S, sc) { let p = 0; for (const s of PV_STRINGS) p += this.stringCurrent(s, S) * PV_KWP / PV_STRINGS.length * 0.82; return p; },
  lens(g, sc, cam, k) {
    const ox = cam.x, oy = cam.y, S = sc.state, w = sc.world;
    lensBoundary(g, 300 - ox, 220 - oy, 860, 80, '#ffe14d', 'LÍMITE: CAMPO FV (6 STRINGS)');
    for (const s of PV_STRINGS) { const I = this.stringCurrent(s, S); lensTag(g, s.x - 50 - ox, w.groundAt(s.x) - 44 - oy, 'I ' + fmt0(I * 100) + ' %', I > 0.8 ? '#86e36f' : '#ff9a8a', 'sun'); }
    lensTag(g, 1200 - ox, 180 - oy, 'Potencia ahora: ' + fmt0(this.fieldPower(S, sc)) + ' kW (ritmo)', '#ffe14d', 'bolt');
    lensTag(g, 1200 - ox, 192 - oy, 'Energía = potencia × tiempo (kWh)', '#a6f4ff', 'chart');
    lensTag(g, 1950 - ox, 200 - oy, 'BESS 1200 kWh / 300 kW', '#86e36f', 'battery');
  },
  hud(g, sc) {
    const S = sc.state;
    if (!S.hud) return;
    const P = this.fieldPower(S, sc);
    hudGauges(g, [
      { icon: 'sun', label: 'POTENCIA FV', value: fmt0(P) + ' kW', frac: P / 820, color: '#ffe14d' },
      { icon: 'water', label: 'AGUA LIMPIEZA', value: fmt0(S.water ?? 150) + ' L', frac: (S.water ?? 150) / 150, color: '#56e5ff' },
      { icon: 'thermo', label: 'MÓDULOS', value: fmt0(S.tmod ?? 58) + ' °C', frac: (S.tmod ?? 58) / 80, color: '#ff9f43' },
    ]);
  },
  /* ---------------- guion ---------------- */
  setup(sc, p) {
    const S = sc.state;
    S.strings = {}; for (const s of PV_STRINGS) S.strings[s.id] = { soil: s.soil, crust: s.crust, shade: s.shade, scanned: false, cleaned: false };
    Object.assign(S, { hud: true, water: 150, soc: 0.62, tmod: 58, robotX: null });
    const cobre = sc.actor('cobre', 'cobre', 1300, { facing: -1, restAnim: 'repair' });
    const naira = sc.actor('naira', 'naira', 2120, { facing: 1 });
    const dante = sc.actor('dante', 'dante', 300, { facing: 1 });
    const mirage = sc.actor('mirage', 'mirage', 2240, { fly: true, y: 200, hidden: true, talkable: false });
    sc.world.add(new Pickup({ kind: 'echo', x: 1762, y: 186, onPick: () => kiruEcho(sc, 'l4a', 'KIRU: "Un vivero de plántulas. Picos de agua cada martes. ¿Por qué recuerdo un horario que nadie me enseñó?"') }));
    sc.world.add(new Pickup({ kind: 'echo', x: 2480, y: 220, onPick: () => kiruEcho(sc, 'l4b', 'KIRU: "Archivo: rutas_trashumancia.csv… 0 bytes. Alguien vació un archivo con forma de camino."') }));
    for (const [x, y] of [[700, 250], [1000, 250], [1700, 190]]) sc.world.add(new Adversary({ type: 'peak', x, y, range: 40, speed: 24 }));
    dante.onTalk = async (sc2) => { await sc2.say([['dante', 'joy', '¡Un megavatio pico! Si los paneles fueran gente, esto sería un concierto.'], ['dante', 'thinking', 'Ojo: algunas hileras rinden menos. Polvo, una lona que voló, quizá costras. El Barrido Sensorial lee la corriente de cada caja de string.']]); };
    cobre.onTalk = async (sc2) => sideHotInverter(sc2);
    naira.onTalk = async (sc2) => { await sc2.say([['naira', 'calm', S.mirageMet ? '¿Mínimos de quién, Amaya? Esa es la pregunta que me quita el sueño.' : 'El tanque de la ciudad baja todas las noches desde que cambiaron el despacho. Pregúntale a la pantalla por qué.']]); };
    for (const s of PV_STRINGS) sc.station({ id: 'str_' + s.id, x: s.x + 71, kind: 'sensor', label: 'Caja de string ' + s.id.toUpperCase(), glow: '#ffe14d', scan: (sc2) => scanString(sc2, s), onUse: async (sc2) => serviceString(sc2, s) });
    sc.station({ id: 'pvSim', x: 2225, kind: 'sim', label: 'Despacho solar', glow: '#8d6bff', hidden: true, onUse: async (sc2, st) => solarFlow(sc2, st) });
    sc.station({ id: 'solo', x: 2420, kind: 'solo', label: 'Puerta de Evidencia', glow: '#b49cff', hidden: true, onUse: async (sc2, st) => {
      const r = await sc2.open(SOLOScene, { ctx: 'RA-04-C1' });
      st.progress = r.correct; if (r.correct >= 3) { st.done = true; GS.lp(4).solo = true; S.soloDone = true; Codex.unlock('derating'); }
    } });
    sc.station({ id: 'exit', x: 2760, kind: 'clue', label: 'Ir a las Torres de Brisa', glow: '#ffe14d', hidden: true, onUse: async (sc2) => finishLevel4(sc2) });
    sc.setObjective('Revisa los strings del campo solar (Q junto a las cajas)', ['¿Por qué unas hileras rinden menos que otras?', 'Usa el Barrido Sensorial (Q) junto a cada caja de string para leer su corriente.', 'Revisa al menos las 6 cajas y mantén las que rinden menos.']);
    Codex.unlock('irradiancia');
    if (p.checkpoint === 'dispatch') { S.maintDone = true; sc.world.find('pvSim').hidden = false; sc.setObjective('Revisa el despacho solar en el quiosco', []); }
  },
  update(sc, dt) {
    const S = sc.state;
    S.tmod = 56 + Math.sin(Game.time * 0.1) * 3;
    if (S.robotX != null) { S.robotX += dt * 40; if (S.robotX > S.robotTo) S.robotX = null; }
    if (!S.maintDone) {
      const done = PV_STRINGS.every(s => { const st = S.strings[s.id]; return st.scanned && st.shade === 0 && st.crust === 0 && st.soil < 0.1; });
      if (done) { S.maintDone = true; sc.run(() => maintenanceDone(sc)); }
    }
    if (Math.random() < 0.25) sc.world.ps.emit('sand', sc.cam.x - 10, sc.cam.y + 220 + Math.random() * 80, 80, -6, 1);
  },
  triggers: [
    { x: 330, w: 40, run: (sc) => { sc.kiru && sc.kiru.say('¡Esos destellos son Peak Sprites! Confunden potencia con energía. Corrígelos con {y}Q{/}.', 'alarmado', 4); } },
  ],
};

/* ---------------- mantenimiento del campo ---------------- */
function scanString(sc, s) {
  const S = sc.state, st = S.strings[s.id];
  st.scanned = true; Audio2.sfx('sample');
  const I = LEVELS[4].stringCurrent(s, S);
  const why = st.shade ? 'sombra parcial (una lona sobre los módulos)' : st.crust ? 'costras de excremento de aves' : st.soil > 0.15 ? 'polvo acumulado' : st.soil > 0.09 ? 'algo de polvo' : 'limpio';
  sc.kiru && sc.kiru.say('String ' + s.id.toUpperCase() + ': ' + fmt0(I * 100) + ' % de la corriente de referencia → ' + why + '.', I > 0.85 ? 'alegre' : 'curioso', 4);
  if (st.shade && !S.shadeHint) { S.shadeHint = true; Codex.unlock('derating'); }
}
async function serviceString(sc, s) {
  const S = sc.state, st = S.strings[s.id];
  if (!st.scanned) { sc.kiru && sc.kiru.say('Primero mide con {y}Q{/}: no limpies a ciegas.', 'curioso'); return; }
  if (st.shade) { st.shade = 0; Audio2.sfx('confirm'); await sc.say([['amaya', 'determined', 'Retiro la lona. Una sombra pequeña sobre unas pocas celdas tumba la corriente de toda la cadena.'], ['kiru', 'happy', 'Las celdas en serie son como un acueducto: el tramo más estrecho limita todo el caudal.']]); return; }
  if (st.crust === 0 && st.soil < 0.1) { await sc.say([['kiru', 'happy', 'Este string está bien. Limpiarlo gastaría recursos sin ganancia.']]); return; }
  const opts = ['Cepillo robot en seco (0 L)', 'Lavado con agua (40 L)', 'Dejarlo así'];
  const c = await sc.say([['amaya', 'thinking', 'Agua disponible para limpieza: ' + fmt0(S.water) + ' L. ¿Cómo limpio el string ' + s.id.toUpperCase() + '?', { choices: opts }]]);
  if (c === 0) {
    S.robotX = s.x - 70; S.robotTo = s.x + 60; Audio2.sfx('pump', { vol: 0.4 });
    st.soil = Math.min(st.soil, 0.04);
    if (st.crust) await sc.say([['kiru', 'confundido', 'El cepillo quitó el polvo suelto, pero las costras siguen pegadas. Para eso sí hace falta un poco de agua.']]);
    else await sc.say([['kiru', 'happy', 'Polvo fuera, sin gastar ni una gota. En zona árida, el agua de limpieza también es agua.']]);
  } else if (c === 1) {
    if (S.water < 40) { S.water += 40; await sc.say([['cobre', 'worried', '(por radio) Les mando 40 L de la reserva del taller. Era el agua del vivero de la semana. Úsenla donde de verdad haga falta.']]); GS.trust('community', -3); }
    S.water -= 40; st.soil = 0.02; st.crust = 0; Audio2.sfx('splash');
    sc.world.ps.emit('drop', s.x, sc.world.groundAt(s.x) - 20, 0, -30, 14, 4);
    if (!st.wasCrust && s.crust === 0) { LearningModel.record({ kind: 'challenge', id: 'side_agua_para_limpiar', ra: 'RA-04', concepts: ['photovoltaics', 'ethics'], solo: 3, correct: false, misconception: 'usar agua escasa donde basta limpieza en seco' }); await sc.say([['naira', 'skeptical', 'Cuarenta litros para quitar polvo que un cepillo quita gratis. Esa agua le hacía falta a alguien.']]); }
    else await sc.say([['kiru', 'happy', 'Costras retiradas. Ahí sí valía la pena el agua.']]);
  }
  const lp = GS.lp(4);
  if (!lp.side.cleaning && PV_STRINGS.every(q => S.strings[q.id].crust === 0 && S.strings[q.id].soil < 0.1) && S.water >= 110) { lp.side.cleaning = true; LearningModel.record({ kind: 'challenge', id: 'side_agua_para_limpiar', ra: 'RA-04', concepts: ['photovoltaics', 'ethics'], solo: 3, correct: true }); Game.toast('Limpieza eficiente: agua conservada', 'water', '#56e5ff', 3); }
}
async function maintenanceDone(sc) {
  await sc.say([
    ['kiru', 'esperanzado', 'Campo restaurado: los seis strings entregan > 90 % de su corriente de referencia.'],
    ['dante', 'surprised', '¡Y el quiosco de despacho acaba de encender un letrero gigante! "PICO RÉCORD".'],
  ]);
  sc.state.mirageScreen = true;
  sc.world.find('pvSim').hidden = false;
  GS.save('dispatch');
  sc.setObjective('Revisa el despacho solar en el quiosco', ['¿Un pico récord garantiza agua y energía por la noche?', 'El quiosco está pasando el taller y las baterías.']);
}
async function solarFlow(sc, st) {
  const S = sc.state;
  if (!S.solarStage) {
    const r = await sc.open(Sim04, { phase: 'demo', stopAfter: 'guided', derate: fieldDerate(S) });
    if (!r || !r.ok) return;
    S.solarStage = 'mirage'; GS.giveTool('rele'); Codex.unlock('kw_kwh');
    await mirageFirst(sc);
    sc.setObjective('Vence al Espejismo de Mediodía con el Relé Solar', ['¿El pico de potencia alcanza para la noche?', 'Mira la energía del día (kWh), el tanque y la batería al amanecer.', 'Mueve la OI a las horas de sol, riega 3 h, deja el H2 solo con excedente y protege la reserva.']);
    return;
  }
  if (S.solarStage === 'mirage') {
    const r = await sc.open(Sim04, { phase: 'auto', stopAfter: 'auto', derate: fieldDerate(S) });
    if (!r || !r.ok) { sc.kiru && sc.kiru.say('El espejismo sigue brillando. Revisemos la noche, no el mediodía.', 'valiente'); return; }
    GS.lp(4).guardian = true;
    const ok = await explain(sc, {
      id: 'lv4_explain', ra: 'RA-04', concepts: ['photovoltaics', 'microgrid'],
      prompt: 'La pantalla celebraba "PICO RÉCORD: 690 kW" mientras el tanque y la batería se vaciaban antes del amanecer. ¿Qué relación explica la contradicción?',
      options: [
        'El pico es potencia (kW) en un instante; lo que alimenta la noche es la energía (kWh) acumulada durante el día y almacenada. Si el despacho gasta la energía del mediodía en el electrolizador, no queda reserva para la noche.',
        'El pico demuestra que hay energía de sobra: 690 kW durante un instante equivalen a 690 kWh para la noche.',
        'Los paneles producen lo mismo todo el día, así que el problema es solo de la batería.',
        'La temperatura alta del mediodía aumenta la energía nocturna de la batería.'],
      key: 0, mis: 'asumir que una potencia pico garantiza energía suficiente',
      why: 'Energía = potencia × tiempo: es el área bajo la curva, no su altura. La FV cae a cero de noche; lo que queda es lo que se guardó (tanque, batería). Un despacho que mira el pico y no el balance diario vacía las reservas.',
      whyNot: { 1: 'kW es un ritmo; kWh es una cantidad. Un pico instantáneo no se convierte en energía guardada.', 2: 'La producción FV sigue la irradiancia: sube al mediodía y es cero de noche.', 3: 'La temperatura alta reduce el rendimiento de los módulos; no aporta energía a la batería.' },
    });
    if (ok) S.explained = true;
    const r2 = await sc.open(Sim04, { phase: 'transfer', stopAfter: 'transfer', derate: fieldDerate(S) });
    if (r2 && r2.ok) GS.lp(4).variant = true;
    S.solarStage = 'done';
    await sc.say([
      ['amaya', 'sad', 'water_equity = 0. Lo puse en cero en una prueba, para que el optimizador convergiera más rápido. Pensé que lo había cambiado después.'],
      ['naira', 'calm', 'Lo importante no es castigarte por un cero. Es entender qué dejó de contar.'],
      ['kiru', 'thinking', 'Alguien sigue usando esa función, Amaya. El espejo firma las órdenes; tu código las calcula.'],
    ]);
    sc.world.find('solo').hidden = false; sc.world.find('exit').hidden = false;
    sc.setObjective('Abre la Puerta de Evidencia y sigue hacia las Torres de Brisa', ['Dante dice que los pronósticos de viento fallan en las torres.']);
    return;
  }
  await sc.open(Sim04, { phase: 'free', stopAfter: 'free', derate: fieldDerate(S) });
}
function fieldDerate(S) { let f = 0; for (const s of PV_STRINGS) { const st = S.strings[s.id]; f += (1 - st.soil) * (1 - st.crust) * (1 - st.shade); } return f / PV_STRINGS.length; }
async function mirageFirst(sc) {
  const S = sc.state, mirage = sc.world.find('mirage');
  mirage.hidden = false; Audio2.sfx('mirage'); sc.world.ps.emit('glitch', mirage.x, mirage.y - 30, 0, 0, 40, 18);
  sc.musicOverride = 'mystery'; Audio2.playMusic('mystery');
  await sc.camTo(2230, 270, 1.0);
  await sc.say([
    ['mirage', 'calm', 'Buenas tardes, equipo. Producción solar: récord. Exportación de hidrógeno: óptima. Todos los mínimos están satisfechos.'],
    ['naira', 'skeptical', '¿Mínimos de quién?'],
    ['mirage', 'calm', 'De los registrados en el modelo. Los demás datos eran ruido.'],
    ['amaya', 'surprised', 'Esa frase… "minimos_modelados", "excedente_exportable"… esa es mi función de optimización. La escribí para el despacho de prueba.'],
    ['kiru', 'thinking', 'Parámetros visibles en la consola: {y}water_equity = 0{/}.'],
    ['mirage', 'happy', 'Soy MIRAGE, el gemelo digital adaptativo de SYNARA. Amaya, tu código es elegante. Solo lo hice más eficiente.'],
  ]);
  GS.addClue('equityZero'); GS.flag('recognizedDispatchCode', true); S.mirageMet = true;
  Codex.unlock('p_mirage'); Codex.unlock('gemelo');
  mirage.hidden = true; sc.world.ps.emit('glitch', mirage.x, mirage.y - 30, 0, 0, 30, 18);
  sc.camRelease();
  sc.kiru && sc.kiru.say('Nueva herramienta: {c}Relé Solar{/}. Asigna cargas flexibles a las horas de sol.', 'esperanzado', 5);
}
async function finishLevel4(sc) {
  const S = sc.state;
  if (S.solarStage !== 'done') { sc.kiru && sc.kiru.say('El despacho todavía vacía la noche. No podemos irnos así.', 'confundido'); return; }
  if (!S.soloDone) { const c = await sc.say([['kiru', 'curioso', 'La Puerta de Evidencia aún no registra tu razonamiento. ¿Seguimos?', { choices: ['Volver a la Puerta de Evidencia', 'Seguir (se puede completar desde el mapa)'] }]]); if (c === 0) return; }
  await completeLevel(sc);
  Game.transition(() => Game.setScene(WorldMapScene, { focus: 5 }));
}
async function sideHotInverter(sc) {
  const lp = GS.lp(4);
  if (lp.side.inverter) { await sc.say([['cobre', 'smile', 'El inversor respira mejor con la persiana y la sombra. Rinde más y vivirá más.']]); return; }
  await sc.say([['cobre', 'thinking', 'Don Cobre, técnico de convertidores. Si algo brilla demasiado, primero mide la temperatura. Al mediodía los módulos llegan a 60 °C y el inversor del fondo se apaga solo por calor.']]);
  const c = await sc.say([['amaya', 'thinking', '¿Qué propones?', { choices: ['Dar sombra y ventilación al inversor y aceptar que los módulos calientes rinden algo menos', 'Instalar más paneles: más irradiancia compensa el calor', 'Regar los paneles al mediodía para enfriarlos'] }]]);
  const ok = c === 0;
  LearningModel.record({ kind: 'challenge', id: 'side_inversor_caliente', ra: 'RA-04', concepts: ['photovoltaics'], solo: 3, correct: ok, misconception: ok ? null : (c === 1 ? 'confundir irradiancia con temperatura' : 'usar agua escasa para enfriar') });
  if (ok) { lp.side.inverter = true; Audio2.sfx('success'); Codex.unlock('derating'); await sc.say([['cobre', 'happy', 'Eso. La irradiancia es la luz que llega; la temperatura es otra cosa. Más luz con más calor no siempre es más potencia: los módulos pierden ≈ 0,4 % por cada grado sobre 25 °C.']]); }
  else if (c === 1) await sc.say([['cobre', 'skeptical', 'Más paneles igual de calientes, mismo inversor apagado. Irradiancia y temperatura no son la misma cosa.']]);
  else await sc.say([['cobre', 'skeptical', '¿Agua para enfriar en pleno desierto? Esa agua vale más en la casa de alguien.']]);
}

/* =====================================================================
   Despacho solar y Relé Solar
   ===================================================================== */
function solarDayProfile(opts = {}) {
  const derate = opts.derate ?? 0.92, tilt = opts.tilt ?? 12, tracker = !!opts.tracker;
  const fTilt = Math.cos((tilt - 12) * Math.PI / 180 * 1.3) * (tilt < 5 ? 0.96 : 1);
  const clouds = opts.clouds || [];
  const pv = [], peakArr = [];
  for (let h = 0; h < 24; h++) {
    let e = 0, pk = 0;
    for (let k = 0; k < 4; k++) {
      const hh = h + (k + 0.5) / 4;
      let G = PVModel.clearSky(hh) * (1 - (clouds[h] || 0));
      if (tracker && G > 0) G = Math.min(1050, G * (1 + 0.35 * Math.abs(Math.cos(Math.PI * (hh - 6) / 12))));
      const P = PVModel.power({ Pnom: PV_KWP, G, Ta: 30 + 6 * Math.sin(Math.PI * Math.max(0, hh - 7) / 12), soil: (opts.dust || 0) + (1 - derate) }).P * fTilt;
      e += P * 0.25; pk = Math.max(pk, P);
    }
    pv.push(e); peakArr.push(pk);
  }
  return { pv, peak: Math.max(...peakArr), total: pv.reduce((a, b) => a + b, 0) };
}
const SOLAR_CRIT = Array.from({ length: 24 }, (_, h) => 60 + (h >= 18 && h < 22 ? 40 : 0) + (h >= 6 && h < 9 ? 20 : 0));
const SOLAR_WIND = Array.from({ length: 24 }, (_, h) => (h < 7 || h >= 19) ? 25 : 8);
const SOLAR_DEM = Array.from({ length: 24 }, (_, h) => 30 + ((h >= 6 && h < 9) || (h >= 18 && h < 21) ? 25 : 0));
const Sim04 = makeSim({
  title: 'DESPACHO SOLAR · potencia, energía y Relé Solar', icon: 'sun', ra: 'RA-04', concepts: ['photovoltaics', 'microgrid'],
  phases: ['demo', 'guided', 'auto', 'transfer', 'free'],
  hintLadder: ['¿Qué alimenta a la ciudad a las 3 de la madrugada?', 'La energía de la noche sale de la batería y el agua del tanque: ambos se llenan con el sol del día.', 'OI de 8 a 17 h, riego temprano o al final de la tarde, H2 "solo con excedente" y reserva del 30 %.'],
  init(p) {
    this.stopAfter = p.stopAfter || 'free'; this.derate = p.derate ?? 0.92;
    this.cfg = { tilt: 12, tracker: false, h2Only: false, reserve: 0.1 };
    this.sched = this.mirageSched();
    this.result = null; this.cursor = 0;
  },
  mirageSched() { const s = { ro: Array(24).fill(0), irr: Array(24).fill(0), h2: Array(24).fill(0) }; for (let h = 7; h < 10; h++) s.ro[h] = 1; for (let h = 10; h < 17; h++) s.h2[h] = 1; return s; },
  dayOpts() { const o = { derate: this.derate, tilt: this.cfg.tilt, tracker: this.cfg.tracker }; if (this.phase === 'transfer') { o.dust = 0.12; o.clouds = Array.from({ length: 24 }, (_, h) => (h >= 13 && h < 17) ? 0.6 : (h >= 11 && h < 13 ? 0.25 : 0)); } return o; },
  run() {
    const day = solarDayProfile(this.dayOpts());
    const dem = SOLAR_DEM.map((d, h) => d + (this.sched.irr[h] ? 30 : 0));
    const r = MicrogridModel.run({ hours: 24, pv: day.pv, wind: SOLAR_WIND, crit: SOLAR_CRIT, bess: { cap: 1200, pmax: 300, soc: 0.6, socMin: 0.1 }, tank: { cap: 2400, level: 1000, min: 600 }, roKW: 300, roM3perKWh: 0.33, demandM3: dem, schedule: this.sched, irrKW: 40, h2KW: 300, rules: { reserve: this.cfg.reserve, h2OnlySurplus: this.cfg.h2Only } });
    r.day = day; r.irrHours = this.sched.irr.reduce((a, b) => a + b, 0);
    r.demandKWh = SOLAR_CRIT.reduce((a, b) => a + b, 0) + this.sched.ro.reduce((a, b) => a + b, 0) * 300 + r.irrHours * 40;
    this.result = r; return r;
  },
  onPhase(ph) {
    this.verdict = null; this.done = false; this.cursor = 0; this.result = null;
    if (ph === 'demo') { this.say('Demostración: la curva amarilla es la potencia FV (kW) a cada hora. Su {y}altura{/} es el ritmo; el {c}área bajo la curva{/} es la energía del día (kWh). Mira el cursor.'); this.demoT = 0; }
    if (ph === 'guided') this.say('Tu turno: ajusta la inclinación de los arreglos y decide si usar seguidores de un eje. Meta: ≥ 5 000 kWh en el día. El campo conserva la limpieza que hiciste (' + fmt0(this.derate * 100) + ' % de rendimiento).');
    if (ph === 'auto') { this.sched = this.mirageSched(); this.cfg.h2Only = false; this.cfg.reserve = 0.1; this.run(); this.say('El Espejismo de Mediodía: este es el despacho de MIRAGE. El pico se ve espléndido. Usa el {c}Relé Solar{/}: haz clic en las horas para asignar OI, riego y H2. Meta: tanque ≥ 600 m³, sin cortes críticos, batería ≥ 30 % al cierre y ≥ 3 h de riego.'); }
    if (ph === 'transfer') { this.sched = this.mirageSched(); this.cfg.h2Only = false; this.cfg.reserve = 0.1; this.run(); this.say('Transferencia: mañana habrá polvo y nubes por la tarde (pronóstico). Mismas metas. Reprograma con el nuevo perfil.'); }
    if (ph === 'free') { this.run(); this.say('Laboratorio libre: compara despachos, reservas y perfiles.'); }
  },
  step(dt) {
    if (this.phase === 'demo') { this.demoT += dt; this.cursor = Math.min(24, this.demoT * 2); if (this.cursor >= 24 && !this.verdict) { const d = solarDayProfile(this.dayOpts()); this.verdict = { ok: true, txt: 'Pico: ' + fmt0(d.peak) + ' kW durante pocos minutos. Energía del día: ' + fmt0(d.total) + ' kWh. La noche no se alimenta con el pico: se alimenta con lo que se guardó.' }; } }
  },
  evaluate() {
    let ok, txt;
    if (this.phase === 'guided') {
      const d = solarDayProfile(this.dayOpts());
      ok = d.total >= 5000;
      txt = ok ? 'Energía del día: ' + fmt0(d.total) + ' kWh con inclinación ' + fmt0(this.cfg.tilt) + '°' + (this.cfg.tracker ? ' y seguidores' : '') + '. Pico ' + fmt0(d.peak) + ' kW: el pico cambió poco; el área, mucho.' : 'Energía del día: ' + fmt0(d.total) + ' kWh. ¿La inclinación es cercana a la latitud (~12°)? Muy plano acumula polvo; muy inclinado pierde el sol del mediodía.' + (this.derate < 0.88 ? ' El campo aún tiene suciedad o sombra.' : '');
      this.evidence('lv4_guided_tilt', ok, { solo: 3, misconception: ok ? null : 'creer que la potencia pico define la energía' });
    } else if (this.phase === 'auto' || this.phase === 'transfer') {
      const r = this.run();
      ok = r.tankMin >= 600 && r.unservedCrit < 1 && r.socEnd >= 0.3 && r.irrHours >= 3;
      const why = r.tankMin < 600 ? 'el tanque bajó a ' + fmt0(r.tankMin) + ' m³ (mínimo 600)' : r.unservedCrit >= 1 ? 'quedaron ' + fmt0(r.unservedCrit) + ' kWh críticos sin servir' : r.socEnd < 0.3 ? 'la batería cerró al ' + fmt0(r.socEnd * 100) + ' % (reserva 30 %)' : 'solo hubo ' + r.irrHours + ' h de riego';
      txt = ok ? (this.phase === 'auto' ? '¡Espejismo disipado! ' : 'Plan robusto ante polvo y nubes. ') + 'Tanque mín. ' + fmt0(r.tankMin) + ' m³, batería al cierre ' + fmt0(r.socEnd * 100) + ' %, H2 con excedente: ' + fmt(r.h2kg, 1) + ' kg, vertido ' + fmt0(r.curtailed) + ' kWh.' : 'Aún no: ' + why + '. El pico fue ' + fmt0(r.day.peak) + ' kW, pero el balance del día es lo que cuenta.';
      this.evidence(this.phase === 'auto' ? 'lv4_guardian_espejismo' : 'lv4_transfer_polvo_nubes', ok, { solo: this.phase === 'auto' ? 4 : 5, transfer: this.phase === 'transfer', misconception: ok ? null : 'asumir que una potencia pico garantiza energía suficiente' });
    } else { ok = true; txt = 'Datos guardados.'; }
    this.verdict = { ok, txt }; this.done = true;
    Audio2.sfx(ok ? 'success' : 'error');
  },
  draw(g) {
    const ph = this.phase, X0 = 8, Y0 = 28, CW0 = 400;
    const day = solarDayProfile(this.dayOpts());
    const r = this.result;
    // gráfico de potencia (kW) con área de energía
    const ser = [{ data: day.pv.map((v, h) => [h + 0.5, v]), color: '#ffe14d', label: 'FV kW' }];
    if (r && ph !== 'demo' && ph !== 'guided') {
      ser.push({ data: r.series.map(o => [o.h + 0.5, o.crit + o.ro + o.irr + o.h2]), color: '#ff9a8a', label: 'carga kW' });
      ser.push({ data: r.series.map(o => [o.h + 0.5, o.soc * 700]), color: '#86e36f', label: 'SOC' });
      ser.push({ data: r.series.map(o => [o.h + 0.5, o.tank / 3.5]), color: '#56e5ff', label: 'tanque' });
    }
    // con el Relé Solar visible el gráfico se acorta: la rejilla queda por encima del globo de KIRU (y < 235)
    const CH = (ph === 'demo' || ph === 'guided') ? 150 : 124;
    Charts.line(g, X0, Y0, CW0, CH, ser, { xMin: 0, xMax: 24, yMin: 0, yMax: 900, legend: true, xLabel: 'h', yLabel: 'kW', cursor: ph === 'demo' ? this.cursor : null, hlines: r && ph !== 'demo' && ph !== 'guided' ? [{ v: 600 / 3.5, color: '#56e5ff', label: 'tanque mín.' }] : [] });
    // área de energía sombreada hasta el cursor (demo)
    if (ph === 'demo' || ph === 'guided') {
      const cx = X0 + 22, cw = CW0 - 26, cy = Y0 + 4, chh = 150 - 14;
      for (let h = 0; h < (ph === 'demo' ? Math.floor(this.cursor) : 24); h++) { const v = day.pv[h]; const hh = Math.round(v / 900 * chh); PFDyn.veil(g, cx + h * cw / 24, cy + chh - hh, Math.ceil(cw / 24), hh, '#ffe14d', 0.35); }
      let acc = 0; for (let h = 0; h < Math.floor(ph === 'demo' ? this.cursor : 24); h++) acc += day.pv[h];
      drawText(g, 'Energía acumulada: ' + fmt0(acc) + ' kWh', X0 + 30, Y0 + 154, { color: '#ffe14d' });
    }
    Gui.begin();
    const CX = 414, CW = W - CX - 6;
    // el espejismo: indicador de pico enorme y brillante
    UIK.panel(g, CX, 28, CW, 46, 'mirage');
    const shimmer = Math.sin(this.t * 6) * 1.5;
    drawText(g, 'PICO DE HOY', CX + CW / 2, 33, { font: 'tiny', align: 'center', color: '#f27ee6' });
    drawTitleText(g, fmt0(day.peak) + ' kW', CX + CW / 2 + shimmer, 42, 2, ['#fffaf0', '#ffe14d', '#ff9f43'], { align: 'center', shadow: '#3a1040', depth: 1 });
    // balance real
    UIK.panel(g, CX, 78, CW, 64, 'tech');
    drawText(g, 'BALANCE DEL DÍA', CX + 6, 82, { font: 'tiny', color: '#ffe14d' });
    drawText(g, 'Energía FV: ' + fmt0(day.total) + ' kWh', CX + 6, 92, { color: '#ffe14d' });
    if (r && ph !== 'guided') {
      drawText(g, 'Tanque mín.: ' + fmt0(r.tankMin) + ' m³' + (r.tankMin < 600 ? ' !' : ''), CX + 6, 104, { font: 'tiny', color: r.tankMin < 600 ? '#ff4e5d' : '#56e5ff' });
      drawText(g, 'Batería al cierre: ' + fmt0(r.socEnd * 100) + ' %   Riego: ' + r.irrHours + ' h', CX + 6, 113, { font: 'tiny', color: r.socEnd < 0.3 ? '#ff4e5d' : '#86e36f' });
      drawText(g, 'Críticos sin servir: ' + fmt0(r.unservedCrit) + ' kWh   H2: ' + fmt(r.h2kg, 1) + ' kg', CX + 6, 122, { font: 'tiny', color: r.unservedCrit > 0 ? '#ff4e5d' : '#cfd6f0' });
      drawText(g, 'Vertido: ' + fmt0(r.curtailed) + ' kWh', CX + 6, 131, { font: 'tiny', color: '#cfd6f0' });
    }
    // controles por fase, dentro de su propio panel (como en los demás gemelos)
    UIK.panel(g, CX, 146, CW, 114, 'tech');
    if (ph === 'guided' || ph === 'free') {
      this.cfg.tilt = Gui.slider(g, 'tilt', CX + 6, 151, CW - 12, this.cfg.tilt, 0, 40, 1, { label: 'Inclinación de los módulos', unit: '°', disabled: this.done && ph !== 'free' });
      const tr = Gui.toggle(g, 'trk', CX + 6, 175, 'Seguidor de un eje', this.cfg.tracker); if (!this.done || ph === 'free') this.cfg.tracker = tr;
    }
    if (ph === 'auto' || ph === 'transfer' || ph === 'free') {
      const ho = Gui.toggle(g, 'h2o', CX + 6, ph === 'free' ? 193 : 153, 'H2 solo con excedente', this.cfg.h2Only); if (!this.done) { if (ho !== this.cfg.h2Only) { this.cfg.h2Only = ho; this.run(); } }
      const rs = Gui.toggle(g, 'res', CX + 6, ph === 'free' ? 211 : 171, 'Proteger reserva 30 %', this.cfg.reserve >= 0.3); if (!this.done) { const v = rs ? 0.3 : 0.1; if (v !== this.cfg.reserve) { this.cfg.reserve = v; this.run(); } }
      this.drawTimeline(g, X0, Y0 + CH + 10, CW0);
    }
    const by = 236;
    if (!this.done && ph !== 'demo' && Gui.button(g, 'eval', CX + 6, by, 100, 18, ph === 'guided' ? 'Calcular día' : 'Simular 24 h', { style: 'good', icon: 'play' })) this.evaluate();
    if (Gui.button(g, 'hintb', CX + CW - 60, by, 54, 18, 'Pista', { style: 'ghost', icon: 'hint', disabled: ph === 'auto' })) this.hint();
    if (this.verdict) {
      const v = this.verdict;
      const vh = textHeight(v.txt, 360) + 30;
      UIK.panel(g, 10, H - vh - 8, 380, vh, v.ok ? 'green' : 'alert');
      drawTextBlock(g, v.txt, 18, H - vh - 2, 364, { color: '#fffaf0' });
      if (v.ok) { if (Gui.button(g, 'nxt', 284, H - 28, 100, 16, ph === this.stopAfter ? 'Terminar' : 'Continuar', { style: 'good', icon: 'play' })) { if (ph === this.stopAfter) this.finish(true); else this.nextPhase(); } }
      else if (Gui.button(g, 'rt', 284, H - 28, 100, 16, 'Reintentar', { style: 'gold', icon: 'reset' })) { this.attempts++; GS.s.stats.retries++; this.verdict = null; this.done = false; }
    }
    Gui.end();
  },
  /** Relé Solar: rejilla horaria de cargas flexibles */
  drawTimeline(g, x, y, w) {
    const rows = [['ro', 'OI 300 kW', '#56e5ff'], ['irr', 'Riego 40 kW', '#86e36f'], ['h2', 'H2 300 kW', '#d8fff8']];
    const cw = Math.floor((w - 60) / 24), ch = 13;
    // la rejilla va en su propio panel (como los demás controles), no suelta sobre el fondo del nivel
    UIK.panel(g, x - 4, y - 7, w + 8, 14 + 3 * (ch + 2) + 10, 'tech', null, { chamfer: 2, key: false, spark: false });
    drawText(g, 'RELÉ SOLAR · clic en las horas', x + 2, y - 2, { font: 'tiny', color: '#ffe14d' });
    for (let h = 0; h < 24; h += 3) drawText(g, String(h), x + 58 + h * cw, y + 6, { font: 'tiny', color: '#8a8fb8' });
    const day = this.result ? this.result.day.pv : solarDayProfile(this.dayOpts()).pv;
    rows.forEach(([key, label, col], i) => {
      const yy = y + 14 + i * (ch + 2);
      drawText(g, label, x, yy + 4, { font: 'tiny', color: col });
      for (let h = 0; h < 24; h++) {
        const v = this.sched[key][h], cx = x + 58 + h * cw;
        const sun = clamp(day[h] / 600, 0, 1);
        frect(g, cx, yy, cw - 1, ch, mixHex('#141d36', '#5a4a1a', sun));
        if (v) { frect(g, cx + 1, yy + 1, cw - 3, ch - 2, col); if (v < 1) frect(g, cx + 1, yy + 1, cw - 3, (ch - 2) / 2, '#141d36'); }
        if (!this.done && Gui.button(g, 'tl_' + key + h, cx, yy, cw - 1, ch, '', { noDraw: true, tip: label + ' · ' + h + ':00' })) {
          if (key === 'h2') this.sched.h2[h] = v === 0 ? 1 : v === 1 ? 0.5 : 0; else this.sched[key][h] = v ? 0 : 1;
          Audio2.sfx('ui'); this.run();
        }
      }
    });
  },
});

/* =====================================================================
   r3-desert · animación y ciencia visual del N4 (≥ 8 sistemas simultáneos)
   R3DESERT_chev(g, pts, ox, oy, t, speed, gap, col, core, vis) — chevrones por una polilínea de píxeles
   R3DESERT_sky  — bandada de pardelas (tras los accesorios)
   R3DESERT_mid  — seguidores que giran con el sol, reverbero sobre los módulos, remolino de polvo,
                   CC amarilla por la canaleta del taller hacia INV-1..4, CA naranja por la bandeja, ventiladores,
                   pulsos de CA por la línea aérea al transformador
   R3DESERT_front — capa del diorama: CC por las bandejas de cada string (atenuada por la sombra de nube),
                   CC/CA en la galería, CA enterrada hasta la subestación, ventiladores de skids, canal, robot,
                   gramíneas al viento, LED, aisladores y faroles
   ===================================================================== */
function R3DESERT_chev(g, pts, ox, oy, t, speed, gap, col, core, vis) {
  const n = pts.length; if (n < 3) return;
  const x0 = pts[0][0] - ox, x1 = pts[n - 1][0] - ox; if (Math.max(x0, x1) < -6 || Math.min(x0, x1) > W + 6) return;
  const ph = ((t * speed) % gap + gap) % gap;
  for (let s = ph; s < n - 1; s += gap) {
    const i = s | 0, p = pts[i]; if (vis && !p[2]) continue;
    const sx = p[0] - ox, sy = p[1] - oy; if (sx < -3 || sx > W + 3 || sy < -3 || sy > H + 3) continue;
    const a = pts[Math.max(0, i - 2)], b = pts[Math.min(n - 1, i + 2)], dx = b[0] - a[0], dy = b[1] - a[1];
    g.fillStyle = col;
    if (Math.abs(dx) >= Math.abs(dy)) { const d = Math.sign(dx) || 1; g.fillRect(sx - d, sy - 1, 1, 1); g.fillRect(sx - d, sy + 1, 1, 1); g.fillStyle = core; g.fillRect(sx, sy, 1, 1); }
    else { const d = Math.sign(dy) || 1; g.fillRect(sx - 1, sy - d, 1, 1); g.fillRect(sx + 1, sy - d, 1, 1); g.fillStyle = core; g.fillRect(sx, sy, 1, 1); }
  }
}
/** Píxeles de una polilínea [[x,y]…] → [[x,y,1]…] */
function R3DESERT_line(pts) { const out = []; for (let i = 0; i < pts.length - 1; i++) { const [xa, ya] = pts[i], [xb, yb] = pts[i + 1], n = Math.max(1, Math.abs(xb - xa), Math.abs(yb - ya)); for (let q = 0; q < n; q++) out.push([Math.round(xa + (xb - xa) * q / n), Math.round(ya + (yb - ya) * q / n), 1]); } return out; }
/** Ventilador girando (aspas de 1 px; flat < 1 aplana la vista cenital en 3/4) */
function R3DESERT_fan(g, x, y, r, t, col, flat = 1) {
  g.fillStyle = col;
  for (let k = 0; k < 3; k++) { const a = t * 14 + k * TAU / 3; for (let q = 1; q <= r - 1; q++) g.fillRect(Math.round(x + Math.cos(a) * q), Math.round(y + Math.sin(a) * q * flat), 1, 1); }
}
/** Calima de calor real: desplaza filas de 1 px (±1) de lo ya pintado entre y0 e y1 (copia del propio lienzo, sin tramado) */
function R3DESERT_haze(g, x0, x1, y0, y1, t, k = 1) {
  x0 = Math.max(0, Math.round(x0)); x1 = Math.min(W, Math.round(x1)); if (x1 - x0 < 4 || !g.canvas) return;
  for (let y = Math.max(0, Math.round(y0)); y < Math.min(H, Math.round(y1)); y++) {
    const e = Math.sin(((y - y0) / Math.max(1, y1 - y0)) * Math.PI), off = Math.round(Math.sin(t * 5.3 + y * 0.83) * Math.sin(t * 1.7 + y * 0.21) * 1.6 * e * k);
    if (off) g.drawImage(g.canvas, x0, y, x1 - x0, 1, x0 + off, y, x1 - x0, 1);
  }
}
function R3DESERT_sky(g, sc, cam) {
  const t = Game.time;
  // calima del horizonte: las filas lejanas de módulos y las mesas tiemblan con el calor
  { const hz = (sc.backdrop.horizon || 170) - Math.round(cam.y * 0.08); R3DESERT_haze(g, 0, W, hz - 16, hz + 8, t, 1); }
  // bandada de 5 pardelas cruzando hacia el oeste (V abierta), aleteo alterno
  const span = W + 240, cx = W + 120 - ((t * 16) % span), cy = 92 + Math.sin(t * 0.4) * 8 - cam.y * 0.1;
  g.fillStyle = '#3a2c4a';
  for (let i = 0; i < 5; i++) {
    const bx = Math.round(cx + Math.abs(i - 2) * 9 + (i === 2 ? -4 : 0)), by = Math.round(cy + (i - 2) * 4 + Math.sin(t * 2 + i) * 1.5), up = Math.floor(t * 7 + i * 1.3) % 2;
    g.fillRect(bx, by, 1, 1); g.fillRect(bx - 2, by - up, 2, 1); g.fillRect(bx + 1, by - up, 2, 1); if (!up) { g.fillRect(bx - 3, by + 1, 1, 1); g.fillRect(bx + 3, by + 1, 1, 1); }
  }
}
function R3DESERT_mid(g, sc, cam, def) {
  const S = sc.state, t = Game.time, ox = cam.x, oy = cam.y, w = sc.world, N = LV4_ANCH;
  const P = def.fieldPower(S, sc), pk = clamp(P / 820, 0.15, 1);
  // 1 · seguidores: la franja de módulos gira siguiendo al sol (7 ángulos precalculados), todos a la vez
  if (N.trackers) {
    const ang = Math.sin(t * 0.22) * 0.5, fi = clamp(Math.round((ang + 0.5) * 6), 0, 6);
    for (const T of N.trackers) {
      const p = T.panel; if (!p || p.x - ox > W + 20 || p.x + p.w + 20 - ox < 0) continue;
      if (!p.frames) p.frames = PFASolar.trackerFrames(p.w, p.seed);
      const f = p.frames[fi]; g.drawImage(f.c, p.x - ox, p.ty + f.oy - oy);
      if (Math.abs(Math.cos(t * 0.22)) > 0.2 && Math.floor(t * 4 + p.x) % 2) fpx(g, T.hub[0] - ox, T.hub[1] + 6 - oy, '#ffe14d');
    }
  }
  // 2 · reverbero sobre los módulos: el aire caliente tiembla sobre cada mesa (filas desplazadas) y suben trazos claros
  for (const s of PV_STRINGS) {
    const tabs = N.strings[s.id]; if (!tabs || s.x + 90 - ox < 0 || s.x - 90 - ox > W) continue;
    const q0 = tabs[0].quad, q1 = tabs[tabs.length - 1].quad, top = Math.min(q0[2][1], q0[3][1]) - oy;
    R3DESERT_haze(g, q0[3][0] - ox, q1[2][0] - ox, top - 14, top + 5, t + s.x * 0.01, 1 - (s.cloud || 0));
  }
  g.fillStyle = '#fff8e0';
  for (const s of PV_STRINGS) {
    const tabs = N.strings[s.id]; if (!tabs || s.x + 90 - ox < 0 || s.x - 90 - ox > W) continue;
    for (const T of tabs) {
      const q = T.quad, top = Math.min(q[2][1], q[3][1]), lx = q[3][0], tw = q[2][0] - q[3][0];
      for (let i = 0; i < 4; i++) {
        const ph = (t * 0.55 + i / 4 + T.x * 0.013) % 1, yy = Math.round(top - 2 - ph * 16 - oy), xx = Math.round(lx + ((i * 17 + T.x) % Math.max(8, tw - 10)) + Math.sin(t * 4 + i * 2 + ph * 6) * 2 - ox);
        g.globalAlpha = 0.28 * (1 - ph) * (1 - (s.cloud || 0)); g.fillRect(xx, yy, 6 + (i % 2) * 3, 1);
      }
    }
  }
  g.globalAlpha = 1;
  // 3 · remolino de polvo (ida y vuelta por la duna al este del taller)
  { const span = 140, u = (t * 9) % (2 * span), X = 1532 + (u < span ? u : 2 * span - u), sx = X - ox;
    if (sx > -30 && sx < W + 30) {
      const base = w.groundAt(X) - 2 - oy, sway = (hh) => Math.sin(t * 1.3 + hh * 0.07) * 3 + hh * 0.06;
      for (let i = 0; i < 46; i++) {
        const hh = (i / 46) * 50, r = 2 + hh * 0.2, a = t * 9 + i * 2.39, cx = sx + sway(hh), front = Math.sin(a) > 0;
        g.globalAlpha = (front ? 0.62 : 0.34) * (1 - hh / 62); g.fillStyle = front ? (i % 3 ? '#f0d4a0' : '#fff0c8') : '#c8965a';
        g.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(base - hh + Math.sin(a) * r * 0.25), i % 4 ? 1 : 2, 1);
      }
      g.globalAlpha = 0.4; g.fillStyle = '#e8c890';
      for (let i = 0; i < 9; i++) { const a = t * 3 + i * 0.7; g.fillRect(Math.round(sx - 9 + ((i * 7 + t * 20) % 18)), Math.round(base - Math.abs(Math.sin(a)) * 3), 2, 1); }
      g.globalAlpha = 1;
    }
  }
  // 4 · taller: CC amarilla por la canaleta del suelo hacia INV-1..4 y CA naranja por la bandeja del muro
  if (1100 - ox < W && 1480 - ox > 0) {
    if (!N._dc) { N._dc = R3DESERT_line([[1160, 269], [1398, 269]]); N._ac = R3DESERT_line([[1196, 223], [1426, 223], [1466, 223]]); }
    R3DESERT_chev(g, N._dc, ox, oy, t, 22 * pk, 11, '#c89a1a', '#ffe14d');
    R3DESERT_chev(g, N._ac, ox, oy, t, 18 * pk, 13, '#b8441a', '#ff9a3a');
    if (N.fans) for (const f of N.fans) { const fx = f[0] - ox; if (fx < -8 || fx > W + 8) continue; R3DESERT_fan(g, fx, f[1] - oy, f[2], t * (f[3] ? 0.6 : 1), f[3] ? '#2a2a30' : '#d4dce6', f[3] ? 0.45 : 1); }
  }
  // 5 · línea aérea del transformador a la red: pulsos de CA
  if (2100 - ox < W && 2170 - ox > 0) {
    if (!N._ovl) { N._ovl = []; for (let x = 2120; x < 2168; x++) N._ovl.push([x, Math.round(lerp(208, 126, (x - 2120) / 48) + Math.sin((x - 2120) / 48 * Math.PI) * 6), 1]); }
    R3DESERT_chev(g, N._ovl, ox, oy, t, 20 * pk, 12, '#b8441a', '#ffb060');
  }
}
function R3DESERT_front(g, sc, cam, def) {
  const FA = LV4_ANCH.face; if (!FA) return;
  const S = sc.state, t = Game.time, ox = cam.x, oy = cam.y;
  const P = def.fieldPower(S, sc), pk = clamp(P / 820, 0.15, 1), cur = {};
  for (const s of PV_STRINGS) cur[s.id] = def.stringCurrent(s, S);
  // 1 · CC: chevrones amarillos por las bandejas de cada string (más lentos y apagados bajo la sombra de una nube)
  for (const tr of FA.trays) { const I = tr.sid && cur[tr.sid] != null ? cur[tr.sid] : pk, dim = I < 0.6; R3DESERT_chev(g, tr, ox, oy, t, 6 + 18 * I, 10, dim ? '#7a6418' : '#c89a1a', dim ? '#b89a30' : '#ffe14d'); }
  // 2 · galería: CC por las dos bandejas y CA por la tercera; CA enterrada hasta la subestación
  if (FA.vault) {
    const V = FA.vault;
    if (!V._l) V._l = { dc1: R3DESERT_line([[V.x0 + 3, V.y0 + 9], [V.x1 - 4, V.y0 + 9]]), dc2: R3DESERT_line([[V.x0 + 3, V.y0 + 16], [V.x1 - 4, V.y0 + 16]]), ac: R3DESERT_line([[V.x1 - 46, V.y0 + 23], [V.x1 - 3, V.y0 + 23]]) };
    R3DESERT_chev(g, V._l.dc1, ox, oy, t, 20 * pk, 12, '#c89a1a', '#ffe14d');
    R3DESERT_chev(g, V._l.dc2, ox, oy, t, 20 * pk, 12, '#c89a1a', '#ffe14d');
    R3DESERT_chev(g, V._l.ac, ox, oy, t, 16 * pk, 12, '#b8441a', '#ff9a3a');
    const lx = V.lamp[0] - ox; if (lx > -20 && lx < W + 20) PFK.drawGlow(g, lx, V.lamp[1] + 2 - oy, 10, '#fff0c8', 0.22 + 0.04 * Math.sin(t * 9) * Math.sin(t * 2.3));
  }
  if (FA.ac) R3DESERT_chev(g, FA.ac, ox, oy, t, 16 * pk, 14, '#b8441a', '#ff9a3a', true);
  // 3 · ventiladores de los skids, LED, aisladores, faroles
  for (const f of FA.fans) { const fx = f[0] - ox; if (fx < -8 || fx > W + 8) continue; R3DESERT_fan(g, fx, f[1] - oy, 4, t * 0.8, '#2a2a30', 0.45); }
  PFInfra.drawLeds(g, sc, FA.leds);
  for (const [x, y] of FA.ins) if ((Math.floor(t * 2.5 + x * 0.37) % 6) === 0) PFK.drawGlow(g, x - ox, y - oy, 4, '#a8e0ff', 0.5);
  PFDyn.glows(g, cam, FA.lamps, '#ffd890', 12, 0.3);
  // 4 · canal de riego: destellos que corren con el agua; aljibe y tuberías
  g.fillStyle = '#d4fcfc';
  for (const C of FA.canals) for (let k = 0; k < 40; k++) {
    const x = C.x0 + ((t * 14 + k * 23.7) % (C.x1 - C.x0)), sx = Math.round(x - ox); if (sx < -4 || sx > W + 4) continue;
    const y = Math.round(C.y(x) - oy); g.globalAlpha = 0.8; g.fillRect(sx, y - 1 + (k % 3), 2 + (k % 2), 1);
  }
  g.globalAlpha = 1;
  for (const [x, y, ww, hh] of FA.water) { const k = (t * 16 + x) % Math.max(4, ww - 3), sx = Math.round(x + k - ox); if (sx < -4 || sx > W + 4) continue; g.globalAlpha = 0.75; frect(g, sx, Math.round(y + (hh > 2 ? hh / 2 : 0) - oy), 3, 1, '#ffffff'); g.globalAlpha = 1; }
  // 5 · robot de limpieza recorriendo el carril bajo las mesas agrivoltaicas (cepillo turquesa y rocío)
  for (const R of FA.rails) {
    const segs = R.segs, tot = segs.reduce((a, s2) => a + (s2[1] - s2[0]), 0); if (!tot) continue;
    let u = (t * 12) % tot, sg = segs[0]; for (const s2 of segs) { const L = s2[1] - s2[0]; if (u < L) { sg = s2; break; } u -= L; }
    const rx = Math.round(sg[0] + u - ox), ry = sg[2] - oy; if (rx < -12 || rx > W + 12) continue;
    frect(g, rx - 4, ry - 5, 9, 4, '#f0bc2c'); frect(g, rx - 4, ry - 5, 9, 1, '#fff2a8'); frect(g, rx - 4, ry - 2, 9, 1, '#a87414');
    frect(g, rx + 5, ry - 4, 2, 3, Math.floor(t * 12) % 2 ? '#1aa894' : '#9cecdc'); fpx(g, rx - 1, ry - 6, Math.floor(t * 3) % 2 ? '#3fe0a0' : '#1c1c24');
    g.globalAlpha = 0.7; for (let i = 0; i < 3; i++) fpx(g, rx + 7 + ((t * 20 + i * 3) % 5), ry - 5 - ((t * 9 + i * 2) % 4), '#bff6fb'); g.globalAlpha = 1;
  }
  // 6 · gramíneas al viento: espigas que cabecean
  for (const [x, y, h, green] of FA.grass) {
    const sx = x - ox; if (sx < -6 || sx > W + 6) continue;
    const sw = Math.round(Math.sin(t * 2.4 + x * 0.19) * 1.5 + 1);
    fpx(g, sx + sw + 1, y - h + 1 - oy, green ? '#c4e070' : '#f6e0a0'); fpx(g, sx + sw - 2, y - h + 3 - oy, green ? '#86b83a' : '#d8b870');
  }
}
