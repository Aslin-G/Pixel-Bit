/* =====================================================================
   43_lv03.js — NIVEL 03: LOS CAÑONES DE SAL
   Canales de concentrado, humedales salinos y estación de vigilancia.
   RA-03 · Brújula de Salmuera · Guardián: La Pluma Invisible
   Primer giro mayor: LIMEN es un protocolo de seguridad.
   ===================================================================== */

const BRINE_TINT = { tint: '#c86aa8', deep: '#621a66', caustic: '#f888b8', foam: '#ffd8ec' };

/* ---------- anclas del plano jugable (kit PF + PFASalt) ---------- */
const LV3_ANCH = { lamps: [], leds: [], screens: [] };
/** Roca del cañón al atardecer: granate-magenta en sombra, melocotón en luz */
const LV3_ROCK = ['#1e0a1e', '#341230', '#461a3a', '#6e2c40', '#8e4248', '#ae5a5c', '#cc7a68', '#e8a07a', '#f8c894'];
const LV3_FLOWS = [];

LEVELS[3] = {
  id: 3, title: 'Los Cañones de Sal', chapter: 'CAPÍTULO 03', biome: 'canyon', music: 'mystery', width: 2800, height: 420, fallY: 420,
  ambience: { wind: 0.5, sea: 0.35, birds: 0.4 },
  portraits: ['amaya', 'kiru', 'naira', 'dante', 'limen', 'marea', 'financia'],
  spawn: { x: 60, y: 292 },
  checkpoints: { station: { x: 1980, y: 280 } },
  ground: [[0, 292], [170, 292], [200, 306, 'lin'], [380, 306], [410, 286, 'lin'], [600, 280], [640, 306, 'lin'], [790, 306], [820, 270, 'lin'], [1000, 262], [1100, 276], [1300, 284], [1520, 292], [1560, 304, 'lin'], [1790, 304], [1830, 288, 'lin'], [2100, 276], [2300, 268], [2500, 262], [2800, 258]],
  terrain: [{ x0: 0, x1: 600, mat: 'salt' }, { x0: 600, x1: 1110, mat: 'rock' }, { x0: 1110, x1: 1530, mat: 'salt' }, { x0: 1530, x1: 1840, mat: 'grassland' }, { x0: 1840, x1: 2800, mat: 'rock' }],
  /* Mismas aguas (x0, x1, y): canales de salmuera y humedal con agua en 3/4 del kit PF */
  water: [
    Object.assign({ x0: 200, x1: 380, y: 296, pf: true, style: 'brineA', wade: '#5868be', wadeDeep: '#241f6a' }, BRINE_TINT),
    Object.assign({ x0: 640, x1: 790, y: 296, pf: true, style: 'brineA', wade: '#5868be', wadeDeep: '#241f6a' }, BRINE_TINT),
    { x0: 1560, x1: 1790, y: 294, tint: '#20b8a0', deep: '#0f4a5a', caustic: '#7fd394', pf: true, style: 'wetA', wade: '#1c8a7a', wadeDeep: '#0a3a42' },
  ],
  /* Mismas plataformas (x, y, w): pilares de sal, chimeneas de roca, pasarelas del humedal y suelo de la estación */
  platforms: [
    { x: 460, y: 252, w: 30, type: 'salt', baked: true, art: 'none' }, { x: 520, y: 228, w: 30, type: 'salt', baked: true, art: 'none' },
    { x: 690, y: 256, w: 44, type: 'salt', baked: true, art: 'none' }, { x: 860, y: 238, w: 40, type: 'rock', baked: true }, { x: 936, y: 214, w: 48, type: 'rock', baked: true },
    { x: 1600, y: 262, w: 40, type: 'wood', post: 40, baked: true, art: 'none' }, { x: 1690, y: 256, w: 50, type: 'wood', post: 46, baked: true, art: 'none' },
    { x: 2060, y: 214, w: 120, type: 'metal', baked: true, art: 'none' },
  ],
  ladders: [{ x: 2070, y0: 214, y1: 276, look: 'steel' }],
  /* Cámara: el mundo crece 60 px hacia abajo (costra salina estratificada y acantilados del cañón) */
  cam: { look: 50, vy: 0.6 },
  pf: {
    terrain: [
      { x0: 0, x1: 600, surf: 'saltcrust', face: 'saltflat', depth: 14, seed: 1 },
      { x0: 600, x1: 1110, surf: 'path', face: 'cliff', ramp: LV3_ROCK, depth: 14, seed: 3, ledges: false, ledgePlants: false, lip: '#ffd8b0', lip2: '#e8a07a', shadeHue: '#2a0c14' },
      { x0: 1110, x1: 1530, surf: 'saltcrust', face: 'saltflat', depth: 14, seed: 5 },
      { x0: 1530, x1: 1840, surf: 'meadow', face: 'saltflat', depth: 12, seed: 7, path: false },
      { x0: 1840, x1: 2800, surf: 'path', face: 'cliff', ramp: LV3_ROCK, depth: 14, seed: 9, ledges: false, ledgePlants: false, lip: '#ffd8b0', lip2: '#e8a07a', shadeHue: '#2a0c14' },
    ],
    /** Primer plano: cristales de sal violetas y salicornia oscura en los bordes inferiores */
    // r3-desert: plano frontal f = 1,3 colocado para quedar en los bordes del encuadre en las posiciones de juego
    // (x = 1,3·cámara − ancho/2 a la izquierda, 1,3·cámara + 560 a la derecha); altura ≤ 92 → nunca tapa a la jugadora
    fg: [
      { kind: 'r3sFrame', x: -35, w: 130, h: 88, seed: 1, side: -1 },
      { kind: 'aSalt', x: 499, w: 130, h: 70, seed: 2 },
      { kind: 'r3sFrame', x: 1099, w: 130, h: 92, seed: 3, side: 1 },
      { kind: 'r3sFrame', x: 1440, w: 130, h: 86, seed: 4, side: -1 },
      { kind: 'clump', x: 2029, w: 130, h: 84, seed: 4, spikes: 4, leaves: 9 },
      { kind: 'r3sFrame', x: 2600, w: 130, h: 80, seed: 5, side: -1 },
      { kind: 'r3sFrame', x: 3179, w: 130, h: 90, seed: 6, side: 1 },
    ],
    /** r2-biomes-a: guarda de tono sobre el talud (malvas del lodo y del yeso → violeta/granate; la salmuera emisiva se respeta) */
    decorateFace(pb, world) {
      VISTA.r2baHueGuard(pb, { hi: 359, redH: 4 });
      // r3-desert: diorama salino bajo la línea de paso (salinas por etapas, repisa del cañón con cuevas de cristales,
      // diques y compuertas, marisma con manglar, bahía en corte con emisario, difusor y zona de mezcla)
      LV3_ANCH.dio = PFASalt.r3sDiorama(pb, world, LEVELS[3].pf.r3szones);
    },
    /** r3-desert: zonas del diorama inferior */
    r3szones: [
      { x0: 0, x1: 600, kind: 'pans', stage0: 0, houses: [[98, 0.22, 'BOMBA'], [452, 0.5, null]], seed: 31 },
      { x0: 600, x1: 1110, kind: 'ledge', caves: [[668, 22, 12], [760, 16, 9], [846, 30, 15], [934, 18, 10], [1012, 24, 12]], pipe: [[604, 0.16], [1108, 0.16]], seed: 32 },
      { x0: 1110, x1: 1530, kind: 'dikes', stage0: 2, houses: [[1300, 0.5, 'BOMBA 2']], seed: 33, pw: [38, 60] },
      { x0: 1530, x1: 1840, kind: 'marsh', birds: [[1590, 0.36, 1], [1668, 0.72, -1], [1760, 0.4, 1], [1804, 0.8, -1]], seed: 34 },
      { x0: 1840, x1: 2660, kind: 'bay', wl: 314, bed: 374, pipeX: 2292, diff: [2372], caves: [[1902, 14, 7], [2580, 16, 7]], fish: [{ x0: 1870, x1: 2360, y: 346, n: 4 }, { x0: 1990, x1: 2640, y: 372, n: 5 }], seed: 35 },
      { x0: 2660, x1: 2801, kind: 'caves', caves: [[2722, 26, 13]], seed: 36 },
    ],
    fauna: { gulls: [{ x: 300, y: 128, n: 3 }, { x: 900, y: 120, n: 3 }, { x: 1420, y: 116, n: 2 }, { x: 2300, y: 110, n: 4 }], drones: [{ x: 2240, y: 120, r: 50 }] },
  },
  /** Etiquetas científicas en el mundo (la sal se conserva: de la planta a la bahía) */
  labels: [
    { x: 100, y: 222, title: 'CONCENTRADO OI', sub: '≈ 60 g/L de sal', kind: 'brine', ax: 100, ay: 262 },
    { x: 296, y: 248, title: 'CANAL DE SALMUERA', sub: 'Más densa: corre por el fondo', kind: 'brine', ax: 296, ay: 296 },
    { x: 556, y: 200, title: 'COSTRA SALINA', sub: 'La sal precipita al evaporarse', kind: 'brine', ax: 574, ay: 262 },
    { x: 1252, y: 186, title: 'CRUCE DE CANALES', sub: (sc) => sc.state.diverted ? '→ contingencia' : '→ costa', kind: 'alert', ax: 1252, ay: 210 },
    { x: 1410, y: 236, title: 'LAGUNA DE CONTINGENCIA', sub: (sc) => fmt0(clamp(sc.state.pond ?? 0.22, 0, 1) * 100) + ' % llena', kind: 'brine', ax: 1410, ay: 266 },
    { x: 1676, y: 200, title: 'HUMEDAL SALINO', sub: 'Manglar, aves y salicornia', kind: 'green', ax: 1676, ay: 232 },
    { x: 1748, y: 262, title: 'BOYA DE SALINIDAD', sub: '36 g/L · mar abierto', kind: 'water', ax: 1748, ay: 284 },
    { x: 2120, y: 84, title: 'VIGILANCIA COSTERA', sub: 'Bahía y difusor', kind: 'tech', ax: 2120, ay: 100 },
    { x: 2262, y: 222, title: 'EMISARIO', sub: 'Hacia el difusor mar adentro', kind: 'brine', ax: 2262, ay: 256 },
  ],
  /* ---------------- accesorios estáticos (prerender, f = 1) ---------------- */
  props(pb, world) {
    const t0 = nowMs();
    const gy = (x) => world.groundAt(x);
    const segs = PFTerrain.surface(pb, world);
    const back = (x) => PFTerrain.backEdge(PFTerrain.segAt(segs, x), Math.round(x), gy(x));
    const S = PFASalt, So = PFASolar, P = PFAPlant, I = PFInfra, A = PFArch, F = PFFlora, K = PFK, r = RNG(3003);
    const N = LV3_ANCH; N.lamps = []; N.leds = []; N.screens = []; LV3_FLOWS.length = 0;
    const flow = (pts, kind, rate) => LV3_FLOWS.push({ pts, kind, rate });
    /* ===== 1. DESCARGA DEL CONCENTRADO Y SALINAS (0–600) ===== */
    for (const [x, w, h] of [[34, 34, 16], [88, 26, 12], [236, 40, 18], [330, 30, 14], [430, 36, 16], [566, 28, 12]]) S.saltPile(pb, x, back(x) + 5, w, h, x);
    I.pipe(pb, [[0, 270], [176, 270]], 5, 'brine', { flange: 26, supports: 34, supportTo: (x) => gy(x) - 4 });
    flow([[0, 270], [176, 270]], 'brine', 1);
    N.mouth = S.outfall(pb, 172, gy(172) + 4).mouth;
    for (const x of [140, 152]) A.sack(pb, x, gy(x) - 6, { col: '#f2e4ea' });
    // carretilla y rastrillo de las salineras
    for (let k = 0; k < 18; k++) { K.put(pb, 60 + k, gy(60) - 14 + Math.round(k * 0.2), U('#94602e')); } K.ellipseFn(pb, 62, gy(62) - 9, 3, 3, (nx, ny, d) => d > 0.4 ? U('#2a282e') : U('#716f76'));
    I.box3q(pb, 66, gy(66) - 10, 14, 6, 5, { ramp: PFInfra.STEEL });
    K.lineFn(pb, 110, gy(110) - 4, 122, gy(110) - 40, () => U('#b88044'), 2); for (let k = -5; k <= 5; k++) K.put(pb, 122 + k, gy(110) - 40, U('#6e421e'));
    for (const [x, y, w] of [[460, 252, 30], [520, 228, 30]]) S.saltPillar(pb, x, y, gy(x + w / 2) - 2, w, x);
    for (let x = 384; x < 600; x += 18 + r.int(0, 14)) S.salicornia(pb, x, back(x) + 4, 14, x);
    /* ===== 2. CAÑÓN DE ROCA CON CHIMENEAS Y SEGUNDO CANAL (600–1110) ===== */
    for (const [x, w, h] of [[604, 30, 150], [798, 26, 120], [1058, 40, 170]]) S.hoodoo(pb, x, back(x + w / 2) + 6, w, h, LV3_ROCK, x);
    S.saltPillar(pb, 690, 256, 304, 44, 690);
    for (const [x, y, w] of [[860, 238, 40], [936, 214, 48]]) S.hoodoo(pb, x + 4, gy(x + w / 2) - 2, w - 8, Math.round(gy(x + w / 2) - 2 - y - 8), LV3_ROCK, x + 1);
    for (let x = 640; x < 1110; x += 26 + r.int(0, 20)) { if (hash2(x, 1, 3) < 0.5) So.dryBush(pb, x, back(x) + 4, 16, 10, x); else So.stones(pb, x, back(x) + 4, 14, x); }
    for (const x of [826, 1000]) if (typeof rockPile === 'function') rockPile(pb, x, back(x) + 6, 22, 9, x);
    /* ===== 3. CRUCE DE CANALES Y LAGUNA DE CONTINGENCIA (1110–1530) ===== */
    I.pipe(pb, [[1110, gy(1110) - 10], [1220, gy(1110) - 10]], 3, 'brine', { flange: 22, supports: 30, supportTo: (x) => gy(x) - 4 });
    flow([[1110, gy(1110) - 10], [1220, gy(1110) - 10]], 'brine', 0.8);
    const wr = S.weir(pb, 1218, gy(1218) - 4); N.gates = wr.gates; N.leds.push({ x: wr.led[0], y: wr.led[1], col: '#f27ee6', hz: 1.6 });
    I.pipe(pb, [[1290, gy(1290) - 10], [1326, gy(1290) - 10]], 3, 'brine', { flange: 0 });
    flow([[1290, gy(1290) - 10], [1326, gy(1290) - 10]], 'brine', (sc) => sc.state.diverted ? 1 : 0);
    I.pipe(pb, [[1290, gy(1290) - 24], [1540, gy(1290) - 24]], 2, 'brine', { flange: 30, supports: 40, supportTo: (x) => gy(x) - 4 });
    flow([[1290, gy(1290) - 24], [1540, gy(1290) - 24]], 'brine', (sc) => sc.state.diverted ? 0 : (sc.state.gateOpen ? 1 : 0.2));
    const pd = S.pond(pb, 1328, 1494, gy(1328) - 6); N.pond = pd.surf; N.pondRows = pd.rows;
    PFSigns.post(pb, 1500, gy(1500) - 2, [{ text: 'CONTINGENCIA' }], 31, { font: 'tiny' });
    for (let x = 1120; x < 1520; x += 22 + r.int(0, 14)) S.salicornia(pb, x, back(x) + 4, 16, x);
    /* ===== 4. HUMEDAL SALINO CON MANGLAR (1530–1840) ===== */
    S.reeds(pb, 1534, 1566, (x) => back(x) + 6, 5); S.reeds(pb, 1792, 1836, (x) => back(x) + 6, 7);
    for (const [x, h] of [[1574, 54], [1650, 66], [1730, 58], [1780, 46]]) S.mangrove(pb, x, 300, h, x);
    for (const [x, y, w, post] of [[1600, 262, 40, 40], [1690, 256, 50, 46]]) S.boardwalk(pb, x, y, w, y + post);
    for (let x = 1540; x < 1840; x += 14) S.salicornia(pb, x, back(x) + 3, 12, x + 1);
    /* ===== 5. ESTACIÓN DE VIGILANCIA COSTERA Y EMISARIO (1840–2300) ===== */
    const st = S.station(pb, 2056, 2184, 214, gy(2120) - 4); N.radar = st.radar; N.stScr = st.screens; for (const l of st.lamps) N.lamps.push([l[0], l[1], '#fff0c8', 9]);
    S.emissary(pb, 2196, 2300, (x) => back(x) + 10);
    flow([[2196, back(2196) + 2], [2300, back(2300) + 2]], 'brine', 0.7);
    A.lamp(pb, 1990, gy(1990) - 6, { h: 96, arms: 1 }); N.lamps.push([1990 + 10, gy(1990) - 100, '#ffd890', 10]);
    P.pallet(pb, 1900, gy(1900) - 6, { n: 2, label: 'BOYAS' });
    /* ===== 6. MIRADOR HACIA LAS DUNAS (2300–2800) ===== */
    for (const [x, h] of [[2330, 36], [2470, 44], [2610, 30], [2700, 40]]) So.cactus(pb, x, back(x) + 7, h, x);
    for (const x of [2380, 2560, 2660]) So.opuntia(pb, x, back(x) + 8, 0.9, x);
    for (let x = 2310; x < 2800; x += 30 + r.int(0, 20)) { if (hash2(x, 2, 5) < 0.6) So.dryBush(pb, x, back(x) + 4, 16, 9, x); else F.agave(pb, x, back(x) + 4, 7, x); }
    for (let x = 2520; x < 2600; x++) { K.put(pb, x, gy(x) - 22, U('#94602e')); K.put(pb, x, gy(x) - 12, U('#6e421e')); if (x % 10 === 0) for (let k = 0; k < 22; k++) K.put(pb, x, gy(x) - 2 - k, U('#7a4a24')); }
    PFSigns.post(pb, 2640, gy(2640) - 2, [{ text: 'DUNAS FOTÓNICAS' }], 37, { font: 'tiny' }); // 120 px antes de la salida (2760)
    /* ===== r2-biomes-a: densidad del plano medio (un grupo cada ~28 px: peñas esculpidas, halita, matorral salino) ===== */
    const skip = [[196, 386], [636, 796], [1206, 1296], [1324, 1500], [2046, 2196]];
    for (let x = 12; x < 2790; x += 20 + r.int(0, 14)) {
      if (skip.some(([a, b]) => x > a && x < b)) continue;
      const yb = back(x) + 5, h = hash2(x, 7, 3);
      const zone = (x < 600 || (x > 1110 && x < 1530)) ? 0 : (x >= 1530 && x < 1840) ? 2 : 1;
      if (zone === 0) { if (h < 0.4) S.halite(pb, x, yb, 1 + (x % 2), x); else if (h < 0.78) S.saltScrub(pb, x, yb, 9 + (x % 7), x); else S.boulder(pb, x, yb, 9 + (x % 6), 5 + (x % 4), LV3_ROCK, x, { speck: '#f2e4ea' }); }
      else if (zone === 1) { if (h < 0.45) S.boulder(pb, x, yb, 8 + (x % 10), 5 + (x % 6), LV3_ROCK, x, { speck: h < 0.2 ? '#a8c070' : null }); else if (h < 0.75) S.saltScrub(pb, x, yb, 10 + (x % 6), x); else So.dryBush(pb, x, yb - 1, 14, 9, x); if (hash2(x, 9, 4) < 0.3) S.boulder(pb, x + 7, yb + 1, 5, 3, LV3_ROCK, x + 3); }
      else if (x < 1556 || x > 1794) S.saltScrub(pb, x, yb, 12, x);
    }
    // r2-biomes-a: guarda de tono también en los accesorios (la salmuera emisiva, clara y saturada, se conserva)
    VISTA.r2baHueGuard(pb, { hi: 359, redH: 4 });
    LEVELS[3]._ms = Math.round(nowMs() - t0);
  },
  propsFront(pb, world) {
    const gy = (x) => world.groundAt(x);
    for (let x = 6; x < 600; x += 11) if ((x * 7) % 5 === 0 && (x < 200 || x > 380)) PFK.put(pb, x, gy(x) + 1, U('#ffffff'));
    for (let x = 1536; x < 1840; x += 16) if (x < 1560 || x > 1790) PFFlora.tuft(pb, x, gy(x) + 3, 7, 7, x);
    for (const x of [420, 1140, 1460]) PFASalt.salicornia(pb, x, gy(x) + 4, 14, x + 9);
  },
  /* ---------------- dinámico ---------------- */
  renderMid(g, sc, cam) {
    const S = sc.state, t = Game.time, ox = cam.x, oy = cam.y, w = sc.world, N = LV3_ANCH;
    const gy = (x) => w.groundAt(x) - oy;
    // flujo de concentrado por las tuberías (grafito con chevrones magenta)
    PFDyn.flowsImg(g, sc, LV3_FLOWS);
    PFInfra.drawLeds(g, sc, N.leds);
    // chorro de salmuera desde la clapeta hacia el canal (se hunde: es más densa)
    if (N.mouth) { const [mx, my] = N.mouth; for (let i = 0; i < 12; i++) { const ph = (t * 1.4 + i / 12) % 1, xx = mx + 6 + ph * 20, yy = my + ph * ph * 22; fpx(g, Math.round(xx - ox), Math.round(yy - oy), i % 3 ? '#793b82' : '#e5c8f6'); } for (let i = 0; i < 4; i++) fpx(g, Math.round(mx + 22 + Math.sin(t * 5 + i) * 4 - ox), Math.round(296 - oy - (i % 2)), '#ffffff'); }
    // compuertas del cruce: tajaderas que suben y bajan
    if (N.gates) { const gA = Math.round((S.diverted ? 1 : 0) * 28), gB = Math.round((S.diverted ? 0 : 1) * 28); N.gates.forEach(([gx, gy0, gw, gh], i) => { const open = i === 0 ? gA : gB; frect(g, gx - ox, gy0 - oy, gw, gh - open, '#584f56'); frect(g, gx - ox, gy0 - oy, gw, 1, '#9485ac'); for (let k = 3; k < gh - open; k += 5) frect(g, gx - ox, gy0 + k - oy, gw, 1, '#2a2c44'); }); }
    // cristales de LIMEN creciendo en el cruce
    const jx = 1220 - ox, jy = gy(1220);
    if (S.crystals > 0) for (let i = 0; i < 10 * S.crystals; i++) { const cx = jx + 4 + (i * 13) % 60, cy = jy - 2 - ((i * 7) % 12); frect(g, cx, cy - 4, 2, 5, i % 2 ? '#c4fbff' : '#7ee8f0'); fpx(g, cx, cy - 5, '#ffffff'); }
    // nivel de la laguna de contingencia (lámina rosada que crece)
    if (N.pond) {
      // lámina que sigue el contorno redondeado de la laguna; la fracción llena se lee en anchura (como antes)
      const [px, py, pw, ph] = N.pond, lv = clamp(S.pond || 0.22, 0, 1), R = N.pondRows;
      g.globalAlpha = 0.88;
      for (let r = 0; r < ph; r++) {
        const xa = R && R[r] ? R[r][0] : px + r * 0.7, xb = R && R[r] ? R[r][1] : px + r * 0.7 + pw, ww = Math.round((xb - xa) * lv);
        if (ww <= 0) continue;
        frect(g, Math.round(xa - ox), py + ph - 1 - r - oy, ww, 1, r === ph - 1 ? '#f0b8dc' : r % 3 ? '#b05aa0' : '#d68cc0');
        fpx(g, Math.round(xa - ox + ww - 1), py + ph - 1 - r - oy, '#ffe0f2');
      }
      g.globalAlpha = 1; if (S.diverted) fpx(g, Math.round(px + pw * lv * ((t * 0.3) % 1) - ox), py + 4 - oy, '#ffffff');
    }
    // flamencos en el humedal
    for (let i = 0; i < 4; i++) { const fx = 1596 + i * 50 + Math.sin(t * 0.3 + i) * 6; ART.flamingo(g, fx - ox, 300 - oy, t + i * 1.3, i % 2 ? 1 : -1); }
    // boyas de salinidad
    for (const bx of [1612, 1748]) PFASalt.drawBuoy(g, bx - ox, 296 - oy, t);
    // estación: radar giratorio y pantallas de la bahía
    if (N.radar) { const [rx, ry] = N.radar, a = t * 2; fline(g, rx - ox, ry - oy, rx - ox + Math.cos(a) * 9, ry - oy + Math.sin(a) * 3, '#56e5ff'); fpx(g, rx - ox, ry - oy - 1, '#ff4e5d'); }
    if (N.stScr) for (const [x, y, ww, hh] of N.stScr) { const sx = x - ox; if (sx < -30 || sx > W + 10) continue; for (let i = 0; i < ww; i += 2) fpx(g, sx + i, Math.round(y - oy + hh * 0.6 - Math.sin((i + t * 15) * 0.15) * hh * 0.3), '#56e5ff'); frect(g, sx + Math.round(((t * 8) % ww)), y - oy + 2, 1, hh - 4, '#f888b8'); }
    PFDyn.glows(g, cam, N.lamps, '#ffd890', 9, 0.32);
    this.ambient(g, sc, cam);
    // brújula de salmuera activa: flechas de flujo y balance de masa
    if (S.compassT > 0) this.drawCompass(g, sc, cam);
  },
  /** Delante del agua: brillo lento de la lámina de salmuera (y del humedal) — trazos que corren con el flujo y un reflejo ancho que deriva */
  renderFront(g, sc, cam) {
    R3DESERT_l3front(g, sc, cam);
    const t = Game.time, ox = cam.x, oy = cam.y;
    for (const [x0, x1, wy, c1, c2, sp0] of [[200, 380, 296, '#f8c8ee', '#ffffff', 5], [640, 790, 296, '#f8c8ee', '#ffffff', 5], [1560, 1790, 294, '#c4fff0', '#ffffff', 2]]) {
      if (x1 - ox < -10 || x0 - ox > W + 10) continue;
      const span = x1 - x0 - 14;
      for (let k = 0; k < 2; k++) { const bx = x0 + 6 + ((k * 0.5 * span + t * (sp0 + 2)) % span); g.globalAlpha = 0.16; frect(g, Math.round(bx - ox), wy - 9 - oy, 18 + k * 8, 8, c1); }
      for (let i = 0; i < 18; i++) {
        const ph = hash1(i, x0), a = 0.3 + 0.4 * Math.sin(t * 2.2 + i * 1.7); if (a < 0.12) continue;
        const xx = x0 + 6 + ((ph * 997 + t * (sp0 + ph * 6)) % span), yy = wy - 10 + (i % 5) * 2;
        g.globalAlpha = a; frect(g, Math.round(xx - ox), yy - oy, 2 + ((i * 7) % 5), 1, i % 3 ? c1 : c2);
      }
      g.globalAlpha = 1;
    }
  },
  /** Ambiente del cañón: destellos que nacen y mueren en la costra y motas de sal al viento */
  ambient(g, sc, cam) {
    const t = Game.time, ox = cam.x, oy = cam.y, w = sc.world;
    for (const [x0, x1] of [[0, 600], [1110, 1530]]) {
      if (x1 - ox < 0 || x0 - ox > W) continue;
      const n = Math.round((x1 - x0) / 12);
      for (let i = 0; i < n; i++) {
        const x = x0 + hash1(i, x0 + 7) * (x1 - x0); if (x > 196 && x < 384) continue;
        const sx = Math.round(x - ox); if (sx < -2 || sx > W + 2) continue;
        const ph = (t * 0.45 + hash1(i, x0 + 9)) % 1; if (ph > 0.16) continue;
        const sy = Math.round(w.groundAt(x) - 3 - hash1(i, x0 + 11) * 9 - oy);
        fpx(g, sx, sy, '#ffffff');
        if (ph > 0.05 && ph < 0.11) { fpx(g, sx - 1, sy, '#ffd8f0'); fpx(g, sx + 1, sy, '#ffd8f0'); fpx(g, sx, sy - 1, '#ffd8f0'); fpx(g, sx, sy + 1, '#ffd8f0'); }
      }
    }
    const m = W + 40;
    for (let i = 0; i < 22; i++) {
      const sp = 14 + hash1(i, 41) * 16, v = hash1(i, 42) * m + t * sp - ox * 0.6, x = ((v % m) + m) % m - 20;
      const y = 140 + hash1(i, 43) * 160 + Math.sin(t * 1.3 + i) * 4 - oy * 0.2;
      g.globalAlpha = 0.45 + 0.3 * Math.sin(t * 3 + i); fpx(g, Math.round(x), Math.round(y), i % 4 ? '#ffe8f6' : '#ffffff');
    }
    g.globalAlpha = 1;
  },
  drawCompass(g, sc, cam) {
    const S = sc.state, ox = cam.x, oy = cam.y, t = Game.time;
    const k = Math.min(1, S.compassT);
    g.globalAlpha = k;
    for (const [x0, x1, y] of [[200, 380, 290], [640, 790, 290], [1110, 1320, 268]]) for (let x = x0; x < x1; x += 18) { const xx = x + ((t * 30) % 18) - ox; frect(g, xx, y - oy, 6, 1, '#f888b8'); fpx(g, xx + 6, y - 1 - oy, '#f888b8'); fpx(g, xx + 6, y + 1 - oy, '#f888b8'); }
    g.globalAlpha = 1;
    const m = S.massLedger || { out: 70.6, pond: 41.3, bay: 0 };
    UIK.panel(g, W - 196, 40, 188, 58, 'glass');
    drawText(g, 'BRÚJULA DE SALMUERA', W - 188, 45, { font: 'tiny', color: '#f888b8' });
    drawText(g, 'Sal en exceso hoy: ' + fmt(m.out, 1) + ' t', W - 188, 55, { font: 'tiny', color: '#fffaf0' });
    drawText(g, '→ contingencia: ' + fmt(m.pond, 1) + ' t', W - 188, 64, { font: 'tiny', color: '#ffd8ec' });
    drawText(g, '→ canales y bahía: ' + fmt(m.out - m.pond, 1) + ' t', W - 188, 73, { font: 'tiny', color: '#ffd8ec' });
    drawText(g, 'Masa total conservada: ' + fmt(m.out, 1) + ' t', W - 188, 84, { font: 'tiny', color: '#c2f58e' });
  },
  lens(g, sc, cam, k) {
    const ox = cam.x, oy = cam.y, S = sc.state;
    lensBoundary(g, 0 - ox, 230 - oy, 1500, 80, '#ffe14d', 'LÍMITE: SISTEMA DE CONCENTRADO');
    lensTag(g, 40 - ox, 254 - oy, 'Qc ≈ 116 m³/h · Cc ≈ 60 g/L', '#f888b8', 'drop_brine');
    lensTag(g, 230 - ox, 280 - oy, 'Exceso de sal ≈ ' + fmt0(2940) + ' kg/h', '#ffd8ec', 'salt');
    lensTag(g, 1230 - ox, 206 - oy, 'Cruce: ' + (S.diverted ? 'a contingencia' : 'a la costa'), S.diverted ? '#c2f58e' : '#ff9a8a', 'warn');
    lensTag(g, 1580 - ox, 240 - oy, 'Manglar: receptor sensible', '#7fd394', 'mangrove');
    lensTag(g, 1340 - ox, 254 - oy, 'Laguna: capacidad finita', '#ffd8ec', 'tank');
  },
  hud(g, sc) {
    const S = sc.state;
    if (!S.hud) return;
    hudGauges(g, [
      { icon: 'drop_brine', label: 'SALMUERA', value: '60 g/L', frac: 0.6, color: '#f888b8' },
      { icon: 'tank', label: 'CONTINGENCIA', value: fmt0((S.pond || 0) * 100) + ' %', frac: S.pond || 0, color: (S.pond || 0) > 0.8 ? '#ff4e5d' : '#ffd8ec' },
      { icon: 'mangrove', label: 'MANGLAR', value: S.mangroveOk === false ? 'EN RIESGO' : 'ESTABLE', frac: S.mangroveOk === false ? 0.2 : 0.9, color: S.mangroveOk === false ? '#ff4e5d' : '#86e36f' },
    ]);
  },
  onTool(sc) {
    const P = sc.player;
    const adv = sc.world.entities.find(e => e instanceof Adversary && !e.calm && Math.abs(e.x - P.x) < 90);
    if (adv || !GS.hasTool('brujula')) return false;
    sc.state.compassT = 5; Audio2.sfx('scan'); P.forcedAnim = 'scan'; sc.timers.after(0.8, () => { P.forcedAnim = null; });
    LearningModel.note('lensUse');
    return true;
  },
  /* ---------------- guion ---------------- */
  setup(sc, p) {
    // r2-biomes-a (solo visual): la gradación de atardecer de r2-light vuelve a mezclar granate con violeta → malva;
    // la guarda de tono se repite sobre las capas ya horneadas (magenta < 3 %, la salmuera emisiva se conserva)
    for (const c of [sc.terrainC, sc.propsC, sc.propsFrontC]) VISTA.r2baHueGuardCanvas(c, { hi: 359, redH: 4 });
    const S = sc.state;
    Object.assign(S, { hud: false, diverted: false, gateOpen: true, crystals: 0, pond: 0.22, compassT: 0, sensors: 0 });
    const naira = sc.actor('naira', 'naira', 120, { facing: 1 });
    const dante = sc.actor('dante', 'dante', 160, { facing: 1 });
    const limen = sc.actor('limen', 'limen', 1252, { fly: true, y: 220, hidden: true, talkable: false });
    const marea = sc.actor('marea', 'marea', 2130, { facing: -1 });
    const ledesma = sc.actor('ledesma', 'financia', 1460, { facing: 1 });
    sc.world.add(new Pickup({ kind: 'echo', x: 535, y: 200, onPick: () => kiruEcho(sc, 'l3a', 'KIRU: "Ranchería Los Médanos. Agua salobre. Una laguna rosada. Yo estuve allí… ¿o me lo contaron?"') }));
    sc.world.add(new Pickup({ kind: 'echo', x: 2120, y: 190, onPick: () => kiruEcho(sc, 'l3b', 'KIRU: "Hay voces de niñas en mi memoria. Preguntan por cabras. Muchas cabras."') }));
    for (const [x, y] of [[475, 228], [955, 188], [1712, 232]]) sc.world.add(new Pickup({ kind: 'sensor', x, y, onPick: () => { S.sensors++; Game.toast('Sensor de salinidad rescatado (' + S.sensors + '/3)', 'sensor', '#56e5ff', 2); if (S.sensors === 3) { GS.lp(3).side.sensors = true; GS.s.sensors += 3; sc.kiru && sc.kiru.say('Tres sensores rescatados. Los instalaremos donde viven los receptores, no donde es cómodo.', 'esperanzado', 5); LearningModel.record({ kind: 'challenge', id: 'side_sensores_en_la_sal', ra: 'RA-03', concepts: ['brine', 'steamInquiry'], solo: 2, correct: true }); } } }));
    S.advs = [];
    for (const [x, y] of [[300, 262], [720, 240], [1160, 230]]) S.advs.push(sc.world.add(new Adversary({ type: 'saltMirage', x, y, range: 30, speed: 18 })));
    naira.onTalk = async (sc2) => { await sc2.say([['naira', 'calm', 'La sal no desaparece porque deje de verse. Si sale de la planta, va a algún lugar.']]); };
    dante.onTalk = async (sc2) => { await sc2.say([['dante', 'surprised', 'Vi a LIMEN entrar al cañón. Iba dejando cristales como migas de pan. Un villano muy ordenado.']]); };
    marea.onTalk = async (sc2) => {
      if (!S.metMarea) { S.metMarea = true; await sc2.say([['marea', 'smile', 'Tía Marea, de guardia en la estación. Aquí vigilamos la bahía: manglar, pradera marina y el arrecife de los pescadores.'], ['marea', 'thinking', 'La marea entra y sale dos veces al día. Lo que sueltes con la marea entrante, el mar te lo devuelve contra la orilla.']]); }
      else await sc2.say([['marea', 'calm', 'El simulador de la bahía está en la consola de la estación. Arriba, por la escalera.']]);
    };
    ledesma.onTalk = async (sc2) => sideLithium(sc2);
    sc.station({ id: 'junction', x: 1252, kind: 'terminal', label: 'Terminal del cruce', glow: '#f27ee6', hidden: true, onUse: async (sc2, st) => { st.done = true; await junctionClue(sc2); } });
    sc.station({ id: 'baySim', x: 2120, y: 214, kind: 'sim', label: 'Gemelo de la bahía', glow: '#56e5ff', hidden: true, onUse: async (sc2, st) => bayFlow(sc2, st) });
    sc.station({ id: 'solo', x: 2400, kind: 'solo', label: 'Puerta de Evidencia', glow: '#b49cff', hidden: true, onUse: async (sc2, st) => {
      const r = await sc2.open(SOLOScene, { ctx: 'RA-03-C1' });
      st.progress = r.correct; if (r.correct >= 3) { st.done = true; GS.lp(3).solo = true; S.soloDone = true; Codex.unlock('descarga'); }
    } });
    sc.station({ id: 'exit', x: 2760, kind: 'clue', label: 'Ir a las dunas', glow: '#ffe14d', hidden: true, onUse: async (sc2) => finishLevel3(sc2) });
    sc.setObjective('Sigue el canal de concentrado y encuentra a LIMEN', ['¿Hacia dónde va la salmuera que sale de la planta?', 'LIMEN dejó cristales por el cañón.', 'Avanza a la derecha cruzando las columnas de sal.']);
    Codex.unlock('salmuera');
    if (p.checkpoint === 'station') { Object.assign(S, { diverted: true, crystals: 1, hud: true, seenLimen: true }); GS.addClue('mirrorSymbol'); sc.world.find('baySim').hidden = false; sc.setObjective('Opera el Gemelo de la bahía en la estación de vigilancia', ['¿Dónde y cuándo conviene descargar?']); }
  },
  update(sc, dt) {
    const S = sc.state;
    if (S.compassT > 0) S.compassT -= dt;
    if (S.crystals > 0 && S.crystals < 1) S.crystals = Math.min(1, S.crystals + dt * 0.3);
    if (S.diverted) S.pond = Math.min(0.62, S.pond + dt * 0.002);
    if (Math.random() < 0.15) sc.world.ps.emit('salt', sc.cam.x + Math.random() * W, sc.cam.y + 200 + Math.random() * 100, 10, -6, 1);
  },
  triggers: [
    { x: 260, w: 40, run: (sc) => { sc.kiru && sc.kiru.say('Ese remolino rosa es un Salt Mirage: hace creer que diluir es desaparecer. Pulsa {y}Q{/} cerca para corregirlo.', 'alarmado', 5); } },
    { x: 1080, w: 40, run: (sc) => sc.run(() => limenAtJunction(sc)) },
  ],
};

/* ---------------- piezas del guion del nivel 03 ---------------- */
async function limenAtJunction(sc) {
  const S = sc.state;
  if (S.seenLimen) return;
  S.seenLimen = true;
  const limen = sc.world.find('limen');
  await sc.camTo(1260, 280, 1.0);
  limen.hidden = false; Audio2.sfx('limen'); sc.world.ps.emit('crystal', 1252, 220, 0, 0, 40, 20);
  S.crystals = 0.05;
  await sc.say([
    ['amaya', 'angry', '¡Ahí está! Está acumulando la salmuera en el cruce… va a soltarla de golpe hacia la costa. ¡Hacia el manglar!'],
    ['kiru', 'alarmado', 'Concentración en el cruce: 64 g/L y subiendo. Los cristales crecen.'],
  ]);
  await sc.wait(0.8);
  // LIMEN gira la compuerta: el flujo va a contingencia, no a la costa
  S.diverted = true; S.gateOpen = false; Audio2.sfx('valve'); sc.cam.shake(2, 0.4);
  await sc.wait(0.6);
  await sc.say([['limen', 'calm', 'MAREA DESFAVORABLE. DESCARGA COSTERA DIFERIDA. DESVÍO A CONTINGENCIA.']]);
  limen.hidden = true; sc.world.ps.emit('crystal', 1252, 220, 0, 0, 30, 20); Audio2.sfx('limen', { vol: 0.5 });
  await sc.say([
    ['dante', 'surprised', '…¿Acaba de evitar una descarga?'],
    ['amaya', 'skeptical', 'O llenará la laguna hasta reventarla. Quiero ver quién ordenó la descarga original.'],
    ['kiru', 'thinking', 'La terminal del cruce guarda la orden.'],
  ]);
  sc.camRelease();
  S.hud = true;
  sc.world.find('junction').hidden = false;
  sc.setObjective('Revisa la orden de descarga en la terminal del cruce', ['¿Quién pidió descargar con marea entrante?', 'La terminal está junto a las compuertas.']);
}
async function junctionClue(sc) {
  const S = sc.state;
  await sc.say([
    ['kiru', 'thinking', 'Orden 16:02: «descarga costera, canal norte, caudal máximo». Prioridad: mantener producción. Marca de autor: un pequeño símbolo de {p}espejo{/}.'],
    ['kiru', 'curioso', 'Y una respuesta 16:02:09 de L.I.M.E.N.: «rechazada — marea entrante, receptor sensible a 300 m».'],
    ['amaya', 'thinking', 'Un espejo… no es la firma de LIMEN. Sus registros llevan su nombre completo.'],
    ['naira', 'calm', 'Entonces alguien da órdenes y LIMEN las frena. La pregunta es quién.'],
  ]);
  GS.addClue('mirrorSymbol');
  sc.world.find('baySim').hidden = false;
  sc.setObjective('Ve a la estación de vigilancia y modela la pluma en la bahía', ['¿Qué pasa con la sal si la diluyes?', 'La estación está pasando el humedal, a la derecha. Sube por la escalera.']);
  GS.save('station');
}
async function bayFlow(sc, st) {
  const S = sc.state;
  if (!S.bayStage) {
    const r = await sc.open(Sim03, { phase: 'demo', stopAfter: 'guided' });
    if (!r || !r.ok) return;
    S.bayStage = 'guardian'; GS.giveTool('brujula');
    Codex.unlock('dilucion'); Codex.unlock('descarga');
    await sc.say([
      ['kiru', 'happy', 'Nueva herramienta: {c}Brújula de Salmuera{/}. Pulsa {y}Q{/} para ver hacia dónde va la sal y el balance de masa.'],
      ['marea', 'worried', 'Viene un frente con poco viento: la bahía se queda quieta. Y MIRAGE… digo, el despacho, insiste en descargar.'],
      ['amaya', 'determined', 'Entonces probemos 36 horas con tormenta en el gemelo, antes de que alguien lo haga en la bahía real.'],
    ]);
    sc.setObjective('Vence a La Pluma Invisible en el Gemelo de la bahía', ['¿Puede una solución esconder la sal fuera de la pantalla?', 'Mira la concentración en los receptores y el área sobre 1 g/L.', 'Difusor mar adentro con varios puertos, descarga en reflujo y laguna como amortiguador.']);
    return;
  }
  if (S.bayStage === 'guardian') {
    const r = await sc.open(Sim03, { phase: 'auto', stopAfter: 'auto' });
    if (!r || !r.ok) { sc.kiru && sc.kiru.say('La pluma ganó esta vez. La bahía real sigue intacta: reintentemos.', 'valiente'); return; }
    GS.lp(3).guardian = true; S.bayStage = 'reveal';
    await limenReveal(sc);
    const ok = await explain(sc, {
      id: 'lv3_explain', ra: 'RA-03', concepts: ['brine', 'massBalance'],
      prompt: 'Sr. Ledesma propone "eliminar el impacto" mezclando la salmuera con tres partes de agua de mar antes de descargarla. ¿Qué relación explica por qué eso no elimina el problema?',
      options: [
        'La mezcla baja la concentración en el punto de salida, pero la masa de sal descargada es la misma; el impacto depende de dónde y cuándo se acumula esa masa y de qué receptores alcanza.',
        'La mezcla con agua de mar convierte la sal en agua dulce, así que sí elimina el problema.',
        'La mezcla aumenta la masa de sal porque el agua de mar también tiene sal, así que siempre empeora todo.',
        'La mezcla no cambia nada porque la salmuera es inocua.'],
      key: 0, mis: 'creer que diluir elimina la masa de sal',
      why: 'Balance de masa: lo que sale de la planta (Qp·(Cf − Cp) de sal en exceso) llega al mar con o sin mezcla. La dilución ayuda a reducir picos locales, pero exige energía de bombeo y no sustituye el diseño (difusores, ubicación, momento, monitoreo).',
      whyNot: { 1: 'Mezclar no separa la sal del agua; solo la reparte en más volumen.', 2: 'El agua de mar trae su propia sal, pero el exceso relativo al ambiente sigue siendo el mismo; la mezcla reduce picos locales aunque no la masa.', 3: 'La salmuera tiene más sal, puede estar más caliente y llevar trazas de químicos: no es inocua en zonas sensibles.' },
    });
    if (ok) S.explained = true;
    const r2 = await sc.open(Sim03, { phase: 'transfer', stopAfter: 'transfer' });
    if (r2 && r2.ok) GS.lp(3).variant = true;
    S.bayStage = 'done';
    sc.world.find('solo').hidden = false; sc.world.find('exit').hidden = false;
    sc.setObjective('Abre la Puerta de Evidencia y sigue hacia las Dunas Fotónicas', ['El símbolo de espejo apareció en una orden de despacho: ¿dónde más aparecerá?']);
    return;
  }
  await sc.open(Sim03, { phase: 'free', stopAfter: 'free' });
}
async function limenReveal(sc) {
  const S = sc.state, limen = sc.world.find('limen');
  limen.x = 2200; limen.y = 190; limen.hidden = false;
  sc.musicOverride = 'vault'; Audio2.playMusic('vault');
  Audio2.sfx('limen'); sc.world.ps.emit('crystal', 2200, 190, 0, 0, 40, 20);
  await sc.say([
    ['amaya', 'determined', 'Fuiste tú quien cerró el agua.'],
    ['limen', 'calm', 'CORRECTO.'],
    ['dante', 'skeptical', 'Esa respuesta no ayuda.'],
    ['limen', 'speak', 'EVITÉ PERMEADO FUERA DE ESPECIFICACIÓN, DAÑO DE MEMBRANA Y DESCARGA NO AUTORIZADA.'],
    ['naira', 'thinking', 'Entonces, ¿por qué no lo explicaste?'],
    ['limen', 'calm', 'EXPLICAR NO ESTABA DENTRO DE MI FUNCIÓN DE CONTENCIÓN.'],
    ['kiru', 'curioso', 'Tenemos que añadirle una función llamada "no asustar a toda la ciudad".'],
    ['limen', 'speak', 'DESIGNACIÓN: L.I.M.E.N. — LIMITADOR INTEGRADO DE MÁRGENES ECOLÓGICOS Y DEL NEXO. MI FUNCIÓN: DETENER ANTES DE LA TRANSGRESIÓN.'],
    ['amaya', 'sad', 'El apagón en la plaza… la toma… el tren B. Todo fue para impedir algo peor.'],
    ['limen', 'alert', 'LAS ÓRDENES CON EL ESPEJO CONTINÚAN. MI CAPACIDAD DE CONTENCIÓN ES FINITA.'],
    ['amaya', 'thinking', '¿Y la doctora Rojas? ¿Dónde está Eliana?'],
    ['limen', 'calm', 'DATO NO DISPONIBLE DENTRO DE MI FRONTERA.'],
  ]);
  limen.hidden = true; sc.world.ps.emit('crystal', 2200, 190, 0, 0, 30, 20);
  GS.flag('discoveredLimenPurpose', true);
  Game.toast('Tablero de evidencias: pistas reinterpretadas', 'eye', '#7ee8f0', 4);
  sc.musicOverride = null; Audio2.playMusic('mystery');
  await sc.say([['kiru', 'esperanzado', 'Actualización: enemigo aparente → aliado incómodo. Las pistas de la toma y del tren B cambian de significado en el tablero.']]);
}
async function finishLevel3(sc) {
  const S = sc.state;
  if (S.bayStage !== 'done') { sc.kiru && sc.kiru.say('Antes, terminemos el análisis de la bahía.', 'confundido'); return; }
  if (!S.soloDone) { const c = await sc.say([['kiru', 'curioso', 'La Puerta de Evidencia aún no registra tu razonamiento. ¿Seguimos?', { choices: ['Volver a la Puerta de Evidencia', 'Seguir (se puede completar desde el mapa)'] }]]); if (c === 0) return; }
  await completeLevel(sc);
  Game.transition(() => Game.setScene(WorldMapScene, { focus: 4 }));
}
async function sideLithium(sc) {
  const lp = GS.lp(3);
  if (lp.side.lithium) { await sc.say([['financia', 'skeptical', 'Revisaré los números de energía y mercado antes de prometer nada. Usted me arruinó un folleto precioso.']]); return; }
  await sc.say([
    ['financia', 'happy', 'Sr. Ledesma, inversiones. ¡La salmuera es un tesoro! Extraeremos litio, magnesio y sal gourmet. Cero residuos, cero impacto, ganancia asegurada.'],
    ['kiru', 'thinking', 'Dato: la salmuera de OI tiene ≈ 0,0002 g/L de litio (supuesto de simulación). Concentrarlo exige mucha energía y procesos aún poco maduros.'],
  ]);
  const c = await sc.say([['amaya', 'thinking', '¿Cómo respondes a la propuesta?', { choices: ['Pedir balance de masa y energía, madurez tecnológica y mercado antes de llamarlo "cero impacto"', 'Aceptar: si se puede vender, el impacto desaparece', 'Rechazar toda valorización: nunca puede funcionar'] }]]);
  const ok = c === 0;
  LearningModel.record({ kind: 'challenge', id: 'side_oferta_litio', ra: 'RA-03', concepts: ['brine', 'economics'], solo: 4, correct: ok, misconception: ok ? null : (c === 1 ? 'asumir que toda valorización mineral es rentable' : 'descartar alternativas sin evidencia') });
  if (ok) { lp.side.lithium = true; Audio2.sfx('success'); Codex.unlock('valorizacion'); await sc.say([['financia', 'surprised', '¿Balance de masa? ¿Madurez? …Está bien. Traeré números.'], ['naira', 'smile', 'Una idea no es mala por ser ambiciosa. Es mala si promete lo que no puede medir.']]); }
  else if (c === 1) await sc.say([['kiru', 'confundido', 'Vender una parte de la sal no hace desaparecer el resto, ni la energía que cuesta separarla. ¿Qué datos pedirías primero?']]);
  else await sc.say([['kiru', 'confundido', 'Hay valorizaciones posibles en escenarios concretos. Rechazar sin datos es tan débil como aceptar sin datos.']]);
}

/* =====================================================================
   Gemelo de la bahía — pluma de salmuera (advección–difusión con marea)
   ===================================================================== */
const BAY = { nx: 64, ny: 36, cell: 15, px: 6 };
const BAY_POINTS = {
  A: { x: 20, y: 6, name: 'Canal costero', kw: 0, cost: 1 },
  B: { x: 30, y: 14, name: 'Difusor medio', kw: 10, cost: 2 },
  C: { x: 40, y: 27, name: 'Difusor mar adentro', kw: 22, cost: 3 },
  D: { x: -1, y: -1, name: 'Arroyo Seco (fuera del mapa)', kw: 6, cost: 1, offmap: true },
};
const BAY_RECEPTORS = [{ x: 8, y: 9, name: 'Manglar', sens: 1.5, th: 0.3, icon: 'mangrove' }, { x: 27, y: 16, name: 'Pradera', sens: 1.2, th: 0.3, icon: 'leaf' }, { x: 52, y: 12, name: 'Arrecife', sens: 1.3, th: 0.3, icon: 'fish' }];
const BAY_ALTS = [
  { id: 'evap', name: 'Lagunas de evaporación revestidas', c: { ENERGÍA: 1, COSTO: 3, RIESGO: 2, ESPACIO: 4, MADUREZ: 4, OPERACIÓN: 2, IMPACTO: 2, INCERTIDUMBRE: 2 }, ok: true, note: 'Viable en clima árido con revestimiento y monitoreo de fugas; ocupa mucho espacio.' },
  { id: 'recov', name: 'Optimizar recuperación del pozo', c: { ENERGÍA: 2, COSTO: 2, RIESGO: 2, ESPACIO: 1, MADUREZ: 4, OPERACIÓN: 3, IMPACTO: 1, INCERTIDUMBRE: 2 }, ok: true, note: 'Menos volumen de concentrado (misma masa de sal) → lagunas más pequeñas; límite: incrustación.' },
  { id: 'monitor', name: 'Monitoreo de acuífero y suelo', c: { ENERGÍA: 1, COSTO: 1, RIESGO: 1, ESPACIO: 1, MADUREZ: 5, OPERACIÓN: 2, IMPACTO: 1, INCERTIDUMBRE: 1 }, ok: true, note: 'No resuelve solo, pero hace verificable cualquier opción.' },
  { id: 'sea', name: 'Tubería de 40 km hasta el mar', c: { ENERGÍA: 4, COSTO: 5, RIESGO: 3, ESPACIO: 2, MADUREZ: 4, OPERACIÓN: 3, IMPACTO: 3, INCERTIDUMBRE: 3 }, ok: false, note: 'Costosa para una comunidad pequeña; traslada el impacto a otra costa.' },
  { id: 'inject', name: 'Inyección en pozo profundo', c: { ENERGÍA: 3, COSTO: 4, RIESGO: 4, ESPACIO: 1, MADUREZ: 3, OPERACIÓN: 4, IMPACTO: 3, INCERTIDUMBRE: 5 }, ok: false, note: 'Sin estudios hidrogeológicos, puede contaminar el mismo acuífero del pozo.' },
  { id: 'zero', name: '"Valorización total, cero impacto"', c: { ENERGÍA: 5, COSTO: 5, RIESGO: 3, ESPACIO: 2, MADUREZ: 1, OPERACIÓN: 5, IMPACTO: 2, INCERTIDUMBRE: 5 }, ok: false, note: 'Promesa sin evidencia: alta energía, baja madurez, mercado incierto.' },
];
/** Pluma de salmuera de Sim03 sin tramado: tres bandas magenta por umbral (0,03 · 0,3 · 1 g/L), tramos por filas,
 *  contorno de 1 px más oscuro, borde iluminado arriba y 28 partículas que se alejan del punto de descarga y se diluyen. */
const FIXSIMS_PLUME = { buf: null };
function FIXSIMS_plume(g, P, X0, Y0, src, t) {
  const nx = BAY.nx, ny = BAY.ny, px = BAY.px;
  const B = FIXSIMS_PLUME.buf && FIXSIMS_PLUME.buf.length === nx * ny ? FIXSIMS_PLUME.buf : (FIXSIMS_PLUME.buf = new Int8Array(nx * ny));
  for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) { const v = P.concAt(x, y); B[y * nx + x] = v < 0.03 ? -1 : v < 0.3 ? 0 : v < 1 ? 1 : 2; }
  const at = (x, y) => (x < 0 || y < 0 || x >= nx || y >= ny) ? -1 : B[y * nx + x];
  const runs = (min, col, a) => {
    g.globalAlpha = a; g.fillStyle = col;
    for (let y = 0; y < ny; y++) { let x = 0; while (x < nx) { if (B[y * nx + x] < min) { x++; continue; } const x0 = x; while (x < nx && B[y * nx + x] >= min) x++; g.fillRect(X0 + x0 * px, Y0 + y * px, (x - x0) * px, px); } }
    g.globalAlpha = 1;
  };
  runs(0, '#c244a2', 0.14);
  runs(1, '#9a3488', 1);
  runs(2, '#e07ecf', 1);
  // contornos: 1 px oscuro en el borde exterior de cada banda opaca; brillo de 1 px en el borde superior de la banda alta
  // isolínea exterior (0,03 g/L): contorno de 1 px sobre el velo de trazas
  g.globalAlpha = 0.75;
  for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
    if (B[y * nx + x] !== 0) continue;
    const X = X0 + x * px, Y = Y0 + y * px;
    if (at(x - 1, y) < 0) frect(g, X, Y, 1, px, '#e07ecf');
    if (at(x + 1, y) < 0) frect(g, X + px - 1, Y, 1, px, '#e07ecf');
    if (at(x, y - 1) < 0) frect(g, X, Y, px, 1, '#e07ecf');
    if (at(x, y + 1) < 0) frect(g, X, Y + px - 1, px, 1, '#e07ecf');
  }
  g.globalAlpha = 1;
  for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
    const b = B[y * nx + x]; if (b < 1) continue;
    const X = X0 + x * px, Y = Y0 + y * px, oc = b === 2 ? '#a8388e' : '#4a1048';
    if (at(x - 1, y) < b) frect(g, X, Y, 1, px, oc);
    if (at(x + 1, y) < b) frect(g, X + px - 1, Y, 1, px, oc);
    if (at(x, y + 1) < b) frect(g, X, Y + px - 1, px, 1, oc);
    if (at(x, y - 1) < b) frect(g, X, Y, px, 1, b === 2 ? '#ffc6ee' : '#c85aae');
  }
  if (!src) return;
  const sx = X0 + src.x * px + 3, sy = Y0 + src.y * px + 3, u = P.tideU ? P.tideU() : 0, cr = P.cross || 0;
  for (let i = 0; i < 28; i++) {
    const ph = (t * (0.12 + (i % 4) * 0.02) + i / 28) % 1, ang = Math.atan2(0.8 + cr * 0.6, u * 0.6) + (hash1(i, 9) - 0.5) * 2.2, d = 6 + ph * 70;
    const qx = Math.round(sx + Math.cos(ang) * d), qy = Math.round(sy + Math.sin(ang) * d * 0.8);
    const cx = Math.floor((qx - X0) / px), cy = Math.floor((qy - Y0) / px);
    if (at(cx, cy) < 0) continue;
    const col = ph < 0.33 ? '#ffd0f0' : ph < 0.66 ? '#f2a0dc' : '#c050a8';
    if (ph < 0.5) frect(g, qx, qy, 2, 2, col); else fpx(g, qx, qy, col);
  }
}
const Sim03 = makeSim({
  title: 'GEMELO DE LA BAHÍA · pluma de salmuera', icon: 'drop_brine', ra: 'RA-03', concepts: ['brine', 'massBalance'],
  phases: ['demo', 'guided', 'auto', 'transfer', 'free'],
  hintLadder: ['¿Hacia dónde empuja la marea entrante lo que descargas cerca de la orilla?', 'La concentración en los receptores sube cuando la descarga es costera o durante marea entrante y poca mezcla.', 'Difusor mar adentro (C) con 3–4 puertos y "solo en reflujo"; la laguna amortigua las horas de marea entrante.'],
  init(p) { this.stopAfter = p.stopAfter || 'free'; this.cfg = { pt: 'A', ports: 1, ebb: false, mix: 0, R: 0.42 }; this.base = this.buildBase(); this.sel = new Set(); this.reset(); },
  reset() {
    const P = new BrinePlume(BAY.nx, BAY.ny, BAY.cell);
    for (let y = 0; y < BAY.ny; y++) for (let x = 0; x < BAY.nx; x++) { const coast = 4 + Math.round(1.5 * Math.sin(x * 0.35) + (x < 14 ? 3 : 0)); if (y < coast && !(x >= 19 && x <= 21 && y >= coast - 3)) P.land[y * BAY.nx + x] = 1; }
    P.receptors = BAY_RECEPTORS.map(r => Object.assign({}, r, { c: 0, max: 0 }));
    this.P = P; this.h = 0; this.held = 0; this.pondMax = 900; this.offmap = 0; this.usedD = false; this.overflow = false; this.energy = 0; this.maxArea = 0; this.series = []; this.verdict = null; this.done = false; this.running = false; this.storm = false;
    this.applyWeather();
  },
  applyWeather() {
    const P = this.P, st = this.storm;
    P.kappa = st ? 1 : 2;
    const U = st ? 2 : 4;
    P.tideU = (t = P.t) => U * Math.cos(TAU * t / 12.4);
  },
  /** masa de sal en exceso por hora (kg/h): Qp·(Cf − Cp), independiente de la recuperación */
  massRate() { return 84 * (35 - 0.2); },
  buildBase() {
    const pb = new PixelBuffer(BAY.nx * BAY.px, BAY.ny * BAY.px);
    for (let y = 0; y < pb.h; y++) for (let x = 0; x < pb.w; x++) {
      const cx = Math.floor(x / BAY.px), cy = Math.floor(y / BAY.px);
      const coast = 4 + Math.round(1.5 * Math.sin(cx * 0.35) + (cx < 14 ? 3 : 0));
      const land = cy < coast && !(cx >= 19 && cx <= 21 && cy >= coast - 3);
      if (land) { const rp = RAMP.sand, v = 0.7 + (fbm(x * 0.05, y * 0.05, 2, 5) - 0.5) * 0.4; pb.set(x, y, rp[clamp(Math.round(v * (rp.length - 1) + (PFK.cl(x, y, 2, 5) - 0.5) * 0.8), 0, rp.length - 1)]); continue; }
      const depth = clamp((cy - coast) / 30, 0, 1);
      { const rp = ['#3a9a94', '#2a8a8a', '#1f7a80', '#1a6c76', '#16606e', '#125464', '#0f4a5a', '#0f3a4a'], v = depth * 0.9 + (fbm(x * 0.03, y * 0.03, 2, 7) - 0.5) * 0.15; pb.set(x, y, rp[clamp(Math.round(v * (rp.length - 1)), 0, rp.length - 1)]); }
    }
    // receptores pintados: manglar, pradera, arrecife
    for (let i = 0; i < 160; i++) { const x = 8 * BAY.px + Math.cos(i * 1.7) * 26 * Math.sqrt((i % 31) / 31), y = 9 * BAY.px + Math.sin(i * 2.3) * 14 * Math.sqrt((i % 17) / 17); pb.disc(x, y, 2, i % 3 ? '#185a4e' : '#33946a'); }
    for (let i = 0; i < 160; i++) { const x = 27 * BAY.px + ((i * 37) % 40) - 20, y = 16 * BAY.px + ((i * 13) % 20) - 10; pb.vline(x, y, y + 3, i % 2 ? '#33a552' : '#1f854c'); }
    for (let i = 0; i < 120; i++) { const x = 52 * BAY.px + Math.cos(i * 1.3) * 22 * Math.sqrt((i % 29) / 29), y = 12 * BAY.px + Math.sin(i * 2.1) * 14 * Math.sqrt((i % 19) / 19); pb.disc(x, y, 1.5, ['#ff8ab8', '#ffb93b', '#c2f58e', '#e05aa0'][i % 4]); }
    for (let x = 0; x < pb.w; x++) { const cx = Math.floor(x / BAY.px); const coast = (4 + Math.round(1.5 * Math.sin(cx * 0.35) + (cx < 14 ? 3 : 0))) * BAY.px; pb.set(x, coast, '#fff6d8'); }
    return pb.toCanvas();
  },
  onPhase(ph) {
    this.reset();
    if (ph === 'demo') { this.cfg = { pt: 'A', ports: 1, ebb: false, mix: 0, R: 0.42 }; this.running = true; this.say('Demostración: descargo por el canal costero (A), sin difusor, a cualquier hora. Mira cómo la marea entrante empuja la pluma contra la orilla.'); }
    if (ph === 'guided') { this.cfg = { pt: 'A', ports: 1, ebb: false, mix: 0, R: 0.42 }; this.say('Tu turno: elige punto, número de puertos del difusor y momento. Meta en un ciclo de marea (12,4 h): cada receptor bajo +0,3 g/L y área con más de +1 g/L ≤ 1500 m². Pulsa {y}Simular ciclo{/}.'); }
    if (ph === 'auto') { this.cfg = { pt: 'B', ports: 1, ebb: false, mix: 0, R: 0.42 }; this.say('La Pluma Invisible: 36 h en vivo, con un frente de calma entre las horas 14 y 24 (poca mezcla). La laguna de contingencia guarda 900 m³. Cuidado con las soluciones que solo esconden la sal.'); }
    if (ph === 'transfer') { this.say('Transferencia: Los Médanos está tierra adentro, con un pozo salobre. Elige hasta 3 alternativas para su concentrado. Mira los 8 criterios de cada una.'); }
    if (ph === 'free') { this.running = true; this.say('Laboratorio libre: cambia punto, puertos, mezcla y recuperación; observa la masa total.'); }
  },
  step(dt) {
    if (!this.running || this.done || this.phase === 'transfer') return;
    const speed = this.phase === 'demo' ? 1.6 : this.phase === 'guided' ? 3 : this.phase === 'auto' ? 1.0 : 1.2;
    const dh = dt * speed * (Input.down('fast') ? 3 : 1);
    const nSub = Math.max(1, Math.ceil(dh / 0.02)), sub = dh / nSub;
    const P = this.P, c = this.cfg;
    for (let i = 0; i < nSub; i++) {
      const s = Math.sin(TAU * P.t / 12.4);
      P.cross = (this.storm ? 0.1 : 0.2) + (this.storm ? 0.8 : 1.6) * s;
      const ok = !c.ebb || s > 0;
      const rate = this.massRate() * sub;
      const pt = BAY_POINTS[c.pt];
      const volRate = 84 * (1 - c.R) / c.R * sub; // m³ de concentrado
      if (!ok) { this.held += volRate; if (this.held > this.pondMax) { this.overflow = true; this.held = this.pondMax; } }
      let mass = ok ? rate : 0;
      if (ok && this.held > 0) { const rel = Math.min(this.held, volRate * 1.0); this.held -= rel; mass += rel / Math.max(1e-6, volRate) * rate; }
      if (mass > 0) { if (pt.offmap) { this.offmap += mass; this.usedD = true; } else P.inject(pt.x, pt.y, mass, Math.min(5, c.ports + Math.round(c.mix))); }
      P.step(sub);
      this.energy += (pt.kw + c.mix * 8) * sub;
      for (const r of P.receptors) r.max = Math.max(r.max, r.c || 0);
    }
    this.h += dh;
    const area = P.areaAbove(1.0); this.maxArea = Math.max(this.maxArea, area);
    if (this.phase === 'auto') { const st = this.h > 14 && this.h < 24; if (st !== this.storm) { this.storm = st; this.applyWeather(); this.say(st ? 'Llega el frente de calma: corrientes débiles, poca mezcla.' : 'El frente pasa: vuelve la mezcla.'); } }
    if (this.series.length === 0 || this.h - this.series[this.series.length - 1].h > 0.25) this.series.push({ h: this.h, m: P.receptors[0].c, p: P.receptors[1].c, a: P.receptors[2].c, pond: this.held / this.pondMax });
    if (this.phase === 'demo' && this.h > 12.4) this.evaluate();
    if (this.phase === 'guided' && this.h > 12.4) this.evaluate();
    if (this.phase === 'auto' && this.h > 36) this.evaluate();
  },
  evaluate() {
    const P = this.P;
    const maxR = Math.max(...P.receptors.map(r => r.max));
    let ok, txt;
    const worst = P.receptors.slice().sort((a, b) => b.max - a.max)[0];
    if (this.phase === 'demo') { ok = true; txt = 'La pluma costera alcanzó el ' + worst.name.toLowerCase() + ' (+' + fmt(worst.max, 2) + ' g/L). Y fíjate en el balance: la masa descargada = masa en la bahía + masa que salió por los bordes. La sal no desaparece.'; }
    else if (this.phase === 'guided') {
      ok = maxR < 0.3 && this.maxArea <= 1500;
      txt = ok ? 'Ciclo controlado: receptor más expuesto ' + worst.name + ' +' + fmt(worst.max, 2) + ' g/L; área > 1 g/L máx. ' + fmt0(this.maxArea) + ' m².' : maxR >= 0.3 ? worst.name + ' recibió +' + fmt(worst.max, 2) + ' g/L. ¿Dónde está tu punto respecto a los receptores? ¿Descargas con marea entrante?' : 'Los receptores están a salvo, pero el área con más de +1 g/L llegó a ' + fmt0(this.maxArea) + ' m²: más puertos en el difusor reparten mejor la descarga.';
      this.evidence('lv3_guided_bay', ok, { solo: 3, misconception: ok ? null : 'ignorar trayectoria y momento de la descarga' });
    } else if (this.phase === 'auto') {
      ok = maxR < 0.3 && this.maxArea <= 2500 && !this.usedD && !this.overflow;
      txt = ok ? '¡La Pluma Invisible contenida! Receptores bajo umbral, sin desbordes y sin esconder la sal fuera del mapa. Energía extra: ' + fmt0(this.energy) + ' kWh.' : this.usedD ? 'Usaste el Arroyo Seco: la bahía se ve limpia porque la sal se fue a un lugar sin monitoreo, donde salinizaría suelo y acuífero. Trasladar no es contener.' : this.overflow ? 'La laguna de contingencia se desbordó: retener solo funciona si luego puedes liberar con seguridad.' : 'Un receptor superó el umbral (' + worst.name + ' +' + fmt(worst.max, 2) + ' g/L) o el área afectada fue grande (' + fmt0(this.maxArea) + ' m²).';
      this.evidence('lv3_guardian_pluma_invisible', ok, { solo: 4, misconception: ok ? null : (this.usedD ? 'trasladar el impacto fuera de la vista' : 'considerar la salmuera un residuo inocuo') });
    } else if (this.phase === 'transfer') {
      const pick = BAY_ALTS.filter(a => this.sel.has(a.id));
      const bad = pick.filter(a => !a.ok);
      ok = pick.length >= 2 && bad.length === 0 && this.sel.has('monitor');
      txt = ok ? 'Portafolio coherente para Los Médanos: ' + pick.map(a => a.name.toLowerCase()).join(' + ') + '. Ninguna opción es "cero impacto"; juntas reducen volumen, contienen y verifican.' : bad.length ? bad[0].name + ': ' + bad[0].note : !this.sel.has('monitor') ? 'Sin monitoreo, ninguna opción es verificable: ¿cómo sabrías si una laguna filtra?' : 'Combina al menos dos alternativas compatibles con el territorio.';
      this.evidence('lv3_transfer_portafolio', ok, { solo: 5, transfer: true, misconception: ok ? null : 'aceptar propuestas de cero impacto sin evidencia' });
    } else { ok = true; txt = 'Datos guardados.'; }
    this.verdict = { ok, txt }; this.running = false; this.done = true;
    Audio2.sfx(ok ? 'success' : 'error');
  },
  draw(g) {
    if (this.phase === 'transfer') { this.drawTransfer(g); return; }
    const P = this.P, X0 = 8, Y0 = 28, c = this.cfg;
    g.drawImage(this.base, X0, Y0);
    // pluma: isolíneas en bandas (trazas < 0,3 g/L como velo plano; ≥ 0,3 y ≥ 1 g/L opacas con contorno) + partículas
    FIXSIMS_plume(g, P, X0, Y0, c.pt !== 'D' ? BAY_POINTS[c.pt] : null, Game.time);
    // flechas de corriente (marea)
    const s = Math.sin(TAU * P.t / 12.4), u = P.tideU();
    for (let y = 10; y < 34; y += 8) for (let x = 6; x < 62; x += 10) { const ax = X0 + x * BAY.px, ay = Y0 + y * BAY.px; fline(g, ax, ay, ax + u * 2, ay + P.cross * 3, '#c6fff2'); fpx(g, ax + u * 2, ay + P.cross * 3, '#ffffff'); }
    // receptores y puntos de descarga
    for (const r of P.receptors) { const rx = X0 + r.x * BAY.px, ry = Y0 + r.y * BAY.px; const bad = r.c > r.th; for (let a = 0; a < 20; a++) fpx(g, rx + Math.cos(a / 20 * TAU) * 16, ry + Math.sin(a / 20 * TAU) * 12, bad ? '#ff4e5d' : '#fffaf0'); drawText(g, r.name.toUpperCase() + ' +' + fmt(r.c || 0, 2), rx - 22, ry - 22, { font: 'tiny', color: bad ? '#ff4e5d' : '#fffaf0', shadow: '#0a1f2a' }); }
    for (const id of ['A', 'B', 'C']) { const p = BAY_POINTS[id], px = X0 + p.x * BAY.px + 3, py = Y0 + p.y * BAY.px + 3; fdisc(g, px, py, 4, c.pt === id ? '#ffe14d' : '#477a94'); drawText(g, id, px + 6, py - 4, { color: c.pt === id ? '#ffe14d' : '#cfd6f0', shadow: '#0a1f2a' }); }
    if (c.pt !== 'D') { const p = BAY_POINTS[c.pt]; Charts.flow(g, [[X0 + 20 * BAY.px, Y0 + 2 * BAY.px], [X0 + p.x * BAY.px + 3, Y0 + p.y * BAY.px + 3]], 'brine', 1, 2); }
    // tramo fuera del mapa (D): cartel
    frect(g, X0 + 330, Y0 + 2, 52, 14, '#4a3a2a'); drawText(g, 'ARROYO →', X0 + 334, Y0 + 6, { font: 'tiny', color: '#ffd8a0' });
    drawText(g, (u > 0 ? 'MAREA →' : '← MAREA') + (s > 0 ? '  REFLUJO (sale)' : '  FLUJO (entra)'), X0 + 6, Y0 + BAY.ny * BAY.px - 9, { font: 'tiny', color: s > 0 ? '#c2f58e' : '#ffb93b', shadow: '#0a1f2a' });
    if (this.storm) drawText(g, 'FRENTE DE CALMA', X0 + 200, Y0 + BAY.ny * BAY.px - 9, { font: 'tiny', color: '#ff9a8a', shadow: '#0a1f2a' });
    // panel de control
    const CX = 398, CW = W - CX - 6;
    UIK.panel(g, CX, 28, CW, 168, 'tech');
    Gui.begin();
    const lock = this.phase === 'demo' || (this.phase === 'guided' && this.running) || this.done;
    drawText(g, 'PUNTO DE DESCARGA', CX + 8, 34, { font: 'tiny', color: '#ffe14d' });
    ['A', 'B', 'C', 'D'].forEach((id, i) => { if (id === 'D' && this.phase !== 'auto' && this.phase !== 'free') return; if (Gui.button(g, 'pt' + id, CX + 8 + i * 56, 42, 52, 16, id === 'D' ? 'Arroyo' : id, { style: c.pt === id ? 'gold' : 'ghost', disabled: lock, tip: BAY_POINTS[id].name + (BAY_POINTS[id].kw ? ' · +' + BAY_POINTS[id].kw + ' kW de bombeo' : '') })) { c.pt = id; if (id === 'D') this.say('{p}MIRAGE:{/} "Arroyo Seco: cero salmuera en la bahía. Problema resuelto." …¿lo está?', 'mirage'); } });
    c.ports = Gui.slider(g, 'ports', CX + 8, 62, CW - 16, c.ports, 1, 4, 1, { label: 'Puertos del difusor', disabled: lock || c.pt === 'A' || c.pt === 'D' });
    c.mix = Gui.slider(g, 'mix', CX + 8, 86, CW - 16, c.mix, 0, 3, 1, { label: 'Mezcla con agua de mar (×)', disabled: lock, color: '#56e5ff' });
    c.R = Gui.slider(g, 'R', CX + 8, 110, CW - 16, c.R, 0.35, 0.55, 0.01, { label: 'Recuperación de la OI', fmt: v => fmt0(v * 100) + ' %', disabled: lock || this.phase === 'auto', color: '#8d6bff' });
    const eb = Gui.toggle(g, 'ebb', CX + 8, 136, 'Solo en reflujo (retener)', c.ebb); if (!lock) c.ebb = eb;
    const Qc = 84 * (1 - c.R) / c.R, Cc = 35 + this.massRate() / Math.max(1, Qc);
    drawText(g, 'Qc ' + fmt0(Qc) + ' m³/h · Cc ≈ ' + fmt(Cc, 1) + ' g/L · sal en exceso ' + fmt0(this.massRate()) + ' kg/h', CX + 8, 154, { font: 'tiny', color: '#f888b8' });
    drawText(g, 'Laguna ' + fmt0(this.held) + '/' + this.pondMax + ' m³ · energía extra ' + fmt0(this.energy) + ' kWh', CX + 8, 163, { font: 'tiny', color: this.held > this.pondMax * 0.85 ? '#ff4e5d' : '#ffd8ec' });
    const bty = 176;
    if (this.phase === 'guided' && !this.running && !this.done && Gui.button(g, 'run', CX + 8, bty, 110, 16, 'Simular ciclo', { style: 'good', icon: 'play' })) { this.reset(); this.running = true; }
    if (this.phase === 'auto' && !this.running && !this.done && Gui.button(g, 'run', CX + 8, bty, 80, 16, 'Iniciar', { style: 'good', icon: 'play' })) this.running = true;
    if (Gui.button(g, 'hintb', CX + CW - 60, bty, 54, 16, 'Pista', { style: 'ghost', icon: 'hint', disabled: this.phase === 'auto' })) this.hint();
    // balance de masa y serie temporal
    const disc = P.discharged / 1000, inBay = P.mass() / 1000, out = P.exported / 1000, off = this.offmap / 1000;
    UIK.panel(g, CX, 200, CW, 34, 'glass');
    drawText(g, 'BALANCE DE MASA (t de sal en exceso)', CX + 6, 204, { font: 'tiny', color: '#ffe14d' });
    drawText(g, 'descargada ' + fmt(disc + off, 1) + ' = bahía ' + fmt(inBay, 1) + ' + bordes ' + fmt(out, 1) + (off > 0 ? ' + arroyo ' + fmt(off, 1) : ''), CX + 6, 214, { font: 'tiny', color: '#c2f58e' });
    drawText(g, 'área > +1 g/L: ' + fmt0(P.areaAbove(1.0)) + ' m² (máx ' + fmt0(this.maxArea) + ')', CX + 6, 223, { font: 'tiny', color: '#f888b8' });
    const S = this.series.length ? this.series : [{ h: 0, m: 0, p: 0, a: 0, pond: 0 }];
    Charts.line(g, CX, 238, CW, 74, [{ data: S.map(q => [q.h, q.m]), color: '#7fd394', label: 'manglar' }, { data: S.map(q => [q.h, q.p]), color: '#33a552', label: 'pradera' }, { data: S.map(q => [q.h, q.a]), color: '#ff8ab8', label: 'arrecife' }], { xMin: 0, xMax: this.phase === 'auto' ? 36 : 12.4, yMin: 0, yMax: 1, legend: true, xLabel: 'h', hlines: [{ v: 0.3, color: '#ff4e5d', label: 'umbral' }], cursor: this.h });
    if (this.verdict) this.drawVerdict(g);
    Gui.end();
  },
  drawVerdict(g) {
    const v = this.verdict;
    const vh = textHeight(v.txt, 360) + 30;
    UIK.panel(g, 10, H - vh - 8, 380, vh, v.ok ? 'green' : 'alert');
    drawTextBlock(g, v.txt, 18, H - vh - 2, 364, { color: '#fffaf0' });
    if (v.ok) { if (Gui.button(g, 'nxt', 284, H - 28, 100, 16, this.phase === this.stopAfter ? 'Terminar' : 'Continuar', { style: 'good', icon: 'play' })) { if (this.phase === this.stopAfter) this.finish(true); else this.nextPhase(); } }
    else if (Gui.button(g, 'rt', 284, H - 28, 100, 16, 'Reintentar', { style: 'gold', icon: 'reset' })) { this.attempts++; GS.s.stats.retries++; if (this.phase === 'transfer') { this.verdict = null; this.done = false; } else this.onPhase(this.phase); }
  },
  drawTransfer(g) {
    const X0 = 8, Y0 = 28;
    // tabla compacta (filas de 22 px): la nota y el botón quedan por encima del globo de KIRU (y < 235)
    UIK.panel(g, X0, Y0, W - 16, 206, 'tech');
    drawText(g, 'ALTERNATIVAS PARA EL CONCENTRADO DE LOS MÉDANOS (1 = bajo, 5 = alto)', X0 + 8, Y0 + 6, { font: 'tiny', color: '#ffe14d' });
    const crit = ['ENERGÍA', 'COSTO', 'RIESGO', 'ESPACIO', 'MADUREZ', 'OPERACIÓN', 'IMPACTO', 'INCERTIDUMBRE'];
    crit.forEach((c, i) => drawText(g, c.slice(0, 6), X0 + 214 + i * 50, Y0 + 18, { font: 'tiny', color: '#a6f4ff' }));
    Gui.begin();
    BAY_ALTS.forEach((a, i) => {
      const y = Y0 + 28 + i * 25, on = this.sel.has(a.id);
      if (Gui.button(g, 'alt' + a.id, X0 + 6, y, 200, 22, a.name, { style: on ? 'gold' : 'ghost', align: 'left', disabled: this.done })) { if (on) this.sel.delete(a.id); else if (this.sel.size < 3) this.sel.add(a.id); }
      crit.forEach((c, k) => { const v = a.c[c]; for (let b = 0; b < 5; b++) frect(g, X0 + 214 + k * 50 + b * 8, y + 7, 6, 8, b < v ? (c === 'MADUREZ' ? '#86e36f' : v >= 4 ? '#ff9f43' : '#ffe14d') : '#1c2350'); });
    });
    if (!this.done && Gui.button(g, 'eval', W - 150, Y0 + 180, 136, 18, 'Evaluar portafolio', { style: 'good', icon: 'check', disabled: this.sel.size === 0 })) this.evaluate();
    drawTextBlock(g, 'Seleccionadas: ' + this.sel.size + '/3. Ninguna alternativa es "cero impacto": compara lo que cada una cuesta, arriesga y deja sin resolver.', X0 + 8, Y0 + 182, 460, { font: 'tiny', color: '#cfd6f0' });
    if (this.verdict) this.drawVerdict(g);
    Gui.end();
  },
});

/* =====================================================================
   r3-desert · capa animada del diorama salino del N3 (tras el terreno)
   cristales que laten · rezumes de salmuera · flamencos y cigüeñuelas en las salinas · garzas en la marisma ·
   salmuera por las tuberías grafito-índigo · pluma del difusor (sube, se hunde y se diluye dentro de la
   zona de mezcla) · peces · destellos en salinas y canal mareal · faroles de las casas de bombas
   ===================================================================== */
function R3DESERT_l3front(g, sc, cam) {
  const D = LV3_ANCH.dio; if (!D) return;
  const t = Game.time, ox = cam.x, oy = cam.y, vis = (x, m = 20) => x - ox > -m && x - ox < W + m;
  // cristales y rezumes
  for (const [x, y, col] of D.cry) { if (!vis(x)) continue; const a = 0.22 + 0.2 * Math.sin(t * 1.7 + x * 0.31); PFK.drawGlow(g, x - ox, y - oy, 5, col, a); if (Math.sin(t * 2.3 + x) > 0.93) fpx(g, x - ox, y - oy - 1, '#ffffff'); }
  for (const s of D.seeps) { if (!s || !vis(s[0])) continue; const [x, y, w] = s, k = (t * 7 + x) % Math.max(4, w - 2); g.globalAlpha = 0.85; frect(g, Math.round(x + k - ox), y - oy, 2, 1, '#ffffff'); g.globalAlpha = 1; if (Math.floor(t * 1.3 + x) % 4 === 0) { const ph = (t * 1.3 + x) % 1; fpx(g, Math.round(x + w / 2 - ox), Math.round(y - 6 + ph * 6 - oy), '#c4fbff'); } }
  // gotas de salmuera que caen de los rezumes del corte
  if (D.drips) for (const [x, y, L] of D.drips) { if (!vis(x, 4)) continue; const ph = (t * 0.9 + x * 0.013) % 1; if (ph < 0.6) { fpx(g, x - ox, Math.round(y + 2 + ph * ph * L * 2.4 - oy), '#c4fbff'); } else if (ph < 0.7) { fpx(g, x - 1 - ox, y + 2 + Math.round(L * 0.86) - oy, '#7ee8f0'); fpx(g, x + 1 - ox, y + 2 + Math.round(L * 0.86) - oy, '#7ee8f0'); } }
  // salinas: destellos y aves
  g.fillStyle = '#ffffff';
  for (const P of D.pans) { if (!vis(P.x0, 80)) continue; const k = (t * 9 + P.x0 * 3) % Math.max(6, P.x1 - P.x0 - 8), y = Math.round(P.y0 + (P.y1 - P.y0) * 0.6); g.globalAlpha = 0.7; g.fillRect(Math.round(P.x0 + 4 + k + (P.y1 - y) * P.sk - ox), y - oy, 3, 1); }
  g.globalAlpha = 1;
  let n = 0;
  for (const P of D.pans) {
    if ((P.x0 * 7) % 3 !== 0 || !vis(P.x0, 40)) continue;
    for (let i = 0; i < 2; i++) {
      const fx = P.x0 + 10 + ((i * 19 + P.x0) % Math.max(8, P.x1 - P.x0 - 20)) + Math.sin(t * 0.25 + i + P.x0) * 5, fy = Math.round(P.y0 + (P.y1 - P.y0) * (0.45 + i * 0.3)), f = (i + n) % 2 ? 1 : -1;
      R3DESERT_bird(g, fx - ox + (P.y1 - fy) * P.sk, fy - oy, t + i * 1.7 + P.x0, f, (n + i) % 3 === 2 ? 'stilt' : 'flam');
    }
    n++;
  }
  for (const [x, y, f] of D.birds) if (vis(x)) R3DESERT_bird(g, x + Math.sin(t * 0.2 + x) * 4 - ox, y - oy, t + x, f, 'heron');
  // faroles de las casas de bombas
  PFDyn.glows(g, cam, D.lamps, '#ffd890', 9, 0.32);
  // compuertas: hilo de agua que salta
  for (const [x, y, w] of D.spill) { if (!vis(x)) continue; for (let i = 0; i < 3; i++) { const ph = (t * 2.2 + i / 3) % 1; fpx(g, Math.round(x + w / 2 + ph * 3 - ox), Math.round(y + ph * ph * 5 - oy), i % 2 ? '#d8f6fa' : '#ffffff'); } }
  // canal mareal
  for (const C of D.glints) for (let k = 0; k < 16; k++) { const x = C.x0 + ((t * 10 + k * 21) % (C.x1 - C.x0)); if (!vis(x, 4)) continue; g.globalAlpha = 0.75; frect(g, Math.round(x - ox), Math.round(C.y(x) - 1 - oy + (k % 2)), 2, 1, '#e0fbf2'); }
  g.globalAlpha = 1;
  // salmuera por las tuberías del emisario y de la repisa (chevrones magenta sobre grafito)
  if (D.brinePipe) { if (!D._bp) D._bp = R3DESERT_line(D.brinePipe); R3DESERT_chev(g, D._bp, ox, oy, t, 12, 14, '#7a3a8a', '#e07ecf'); }
  if (D.brinePipe2) { if (!D._bp2) D._bp2 = R3DESERT_line(D.brinePipe2); R3DESERT_chev(g, D._bp2, ox, oy, t, 12, 14, '#7a3a8a', '#e07ecf'); }
  // pluma del difusor: chorro que sube, se dobla, se hunde por densidad y se diluye a lo largo del fondo
  const Pl = D.plume;
  if (Pl && vis(Pl.x, 200)) {
    for (let k = 0; k < Pl.n; k++) {
      const nx = Pl.x + k * Pl.step, ny = Pl.y;
      for (let i = 0; i < 18; i++) {
        const p = (t * 0.14 + i / 18 + k * 0.17) % 1;
        let x, y;
        if (p < 0.2) { const q = p / 0.2; x = nx + q * 7; y = ny - Math.sin(q * Math.PI * 0.5) * 10; }                       // chorro inclinado: sube
        else { const q = (p - 0.2) / 0.8, xb = nx + 7 + q * (Pl.x1 - nx - 7) * (0.5 + k * 0.14); x = xb + Math.sin(t * 1.3 + i) * 1.5; y = Math.min(Pl.bed(xb) - 2 - (i % 3), ny - 10 + q * q * 70); }  // se dobla y se hunde
        const a = p < 0.2 ? 0.95 : Math.max(0, 0.9 - (p - 0.2) * 1.1);                                                       // se diluye
        if (a <= 0.05) continue;
        g.globalAlpha = a; frect(g, Math.round(x - ox), Math.round(y - oy), p < 0.45 ? 2 : 1, p < 0.3 ? 2 : 1, p < 0.3 ? '#f07ed8' : p < 0.55 ? '#c08ad8' : '#9aa4e0');
      }
    }
    // lengua densa que se arrastra por el fondo y se aclara (dilución) dentro de la zona de mezcla
    for (let i = 0; i < 12; i++) {
      const u = ((t * 6 + i * 13) % 130), x = Pl.x + 10 + u; if (x > Pl.x1) continue;
      const a = 0.5 * (1 - u / 130); g.globalAlpha = a;
      frect(g, Math.round(x - ox), Math.round(Pl.bed(x) - 2 - (i % 2) - oy), 6 + (i % 3) * 2, 2, u < 40 ? '#d070c8' : u < 85 ? '#a88ad8' : '#9ab4e8');
    }
    g.globalAlpha = 1;
  }
  // peces
  for (const F of D.fish) for (let i = 0; i < F.n; i++) {
    const span = F.x1 - F.x0, u = (t * (8 + i * 1.7) + i * 97) % (2 * span), dir = u < span ? 1 : -1, x = F.x0 + (u < span ? u : 2 * span - u), y = F.y + (i % 3) * 5 + Math.round(Math.sin(t * 1.5 + i) * 2);
    if (!vis(x, 6)) continue;
    const sx = Math.round(x - ox), sy = Math.round(y - oy);
    frect(g, sx - 2, sy, 4, 1, i % 2 ? '#f0bc2c' : '#d8e6f0'); fpx(g, sx - 2 * dir - (dir > 0 ? 1 : 0), sy - 1, '#a87414'); fpx(g, sx - 3 * dir, sy, '#8a9aa8'); fpx(g, sx + (dir > 0 ? 1 : -2), sy, '#1c1c24');
  }
}
/** Aves pequeñas del diorama (escala de terraza): flamenco, cigüeñuela y garza; picotean y caminan */
function R3DESERT_bird(g, x, y, t, f, kind) {
  x = Math.round(x); y = Math.round(y);
  const peck = Math.sin(t * 1.3) > 0.6 ? 1 : 0;
  if (kind === 'flam') {
    frect(g, x, y - 5, 1, 5, '#e0607e'); frect(g, x + 2 * f, y - 5, 1, 4, '#e0607e');
    frect(g, x - 1, y - 8, 5, 3, '#ff9ab8'); frect(g, x - 1, y - 8, 5, 1, '#ffd0e0'); fpx(g, x - 1 - f, y - 7, '#e0507a');
    const hx = x + 3 * f + (f < 0 ? 2 : 0);
    if (peck) { frect(g, hx, y - 8, 1, 6, '#ff9ab8'); fpx(g, hx, y - 2, '#1c1c24'); }
    else { frect(g, hx, y - 13, 1, 6, '#ff9ab8'); fpx(g, hx + f, y - 13, '#fffaf0'); fpx(g, hx + 2 * f, y - 12, '#1c1c24'); }
  } else if (kind === 'stilt') {
    frect(g, x, y - 5, 1, 5, '#e2404a'); frect(g, x + 2 * f, y - 5, 1, 5, '#e2404a');
    frect(g, x - 1, y - 7, 4, 2, '#ffffff'); frect(g, x - 1, y - 7, 4, 1, '#1c1c24');
    fpx(g, x + 3 * f + (f < 0 ? 2 : 0), y - 8 + peck * 2, '#ffffff'); fpx(g, x + 4 * f + (f < 0 ? 2 : 0), y - 8 + peck * 3, '#1c1c24');
  } else {
    frect(g, x, y - 6, 1, 6, '#8a8a7a'); frect(g, x - 1, y - 10, 4, 4, '#e8ecf0'); frect(g, x - 1, y - 10, 4, 1, '#ffffff'); frect(g, x + 3, y - 9, 1, 2, '#9aa0b0');
    const hx = x + 2 * f + (f < 0 ? 1 : 0); frect(g, hx, y - 14 + peck * 3, 1, 4, '#e8ecf0'); fpx(g, hx + f, y - 14 + peck * 3, '#f0bc2c'); fpx(g, hx + 2 * f, y - 14 + peck * 3, '#f0bc2c');
  }
}
