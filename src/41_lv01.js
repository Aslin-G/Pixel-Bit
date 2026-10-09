/* =====================================================================
   41_lv01.js — NIVEL 01: LA BOCA DEL MAR
   Costa de captación, arrecifes someros y galerías de toma.
   RA-01 · Barrido Sensorial · Guardián: El Filtro Ciego
   ===================================================================== */

LEVELS[1] = {
  id: 1, title: 'La Boca del Mar', chapter: 'CAPÍTULO 01', biome: 'coast', music: 'coast', width: 2600, height: 460,
  ambience: { sea: 0.8, wind: 0.35, birds: 0.6 },
  portraits: ['amaya', 'kiru', 'dante', 'marea', 'limen'],
  spawn: { x: 70, y: 248 },
  checkpoints: { intake: { x: 1100, y: 270 }, filters: { x: 1600, y: 268 } },
  /* Composición vertical (≥ 6 alturas): acantilado de inicio 246–248 → terraza 264 → playa 292–298 →
     roquedal 262–292 → escalinata → muelle 268 sobre el corte submarino → explanada de filtros 282 →
     sendero rocoso ascendente 274 → 262 → 246 → 230 hacia la salida. Altura extra (hasta 460) solo abajo. */
  ground: [[0, 248], [120, 246], [228, 248, 'step'], [232, 266], [256, 266], [300, 290], [360, 290], [470, 292], [560, 293], [700, 294], [770, 290],
    [810, 272, 'lin'], [880, 264], [960, 268], [1010, 280], [1050, 292], [1084, 292, 'step'], [1090, 286, 'step'], [1096, 280, 'step'], [1102, 274, 'step'],
    [1108, 268], [1612, 268, 'step'], [1618, 274, 'step'], [1624, 280, 'step'], [1630, 282], [1860, 282], [1900, 278], [1960, 274],
    [1990, 274, 'step'], [2010, 262], [2110, 256, 'step'], [2130, 246], [2250, 242], [2330, 238, 'step'], [2360, 230], [2600, 232]],
  terrain: [{ x0: 0, x1: 360, mat: 'rock' }, { x0: 360, x1: 780, mat: 'beach' }, { x0: 780, x1: 1060, mat: 'rock' }, { x0: 1060, x1: 1880, mat: 'stone' }, { x0: 1880, x1: 2600, mat: 'rock' }],
  /* Mar en corte: una sola masa de agua a lo largo de la costa (la playa, el roquedal, el muelle y la
     explanada de filtros salen del agua). Su superficie (y 296) queda por debajo de toda la línea de paso. */
  water: [{ x0: 266, x1: 1996, y: 296, tint: '#20d6c7', deep: '#1063a6', pf: true, cutaway: true, crestFrom: 4, crestTo: 2 }],
  platforms: [
    { x: 820, y: 236, w: 46, type: 'rock', baked: true }, { x: 900, y: 222, w: 52, type: 'rock', baked: true },
    { x: 1640, y: 206, w: 150, type: 'metal', baked: true },
    { x: 2050, y: 226, w: 60, type: 'rock', baked: true },
  ],
  ladders: [{ x: 1650, y0: 206, y1: 282 }],
  hazards: [],
  cam: { look: 50, vy: 0.60 },
  /* ---------------- plano jugable con kit PF ---------------- */
  pf: {
    terrain: [
      { x0: 0, x1: 268, surf: 'path', face: 'cliff', depth: 16 },
      { x0: 268, x1: 785, surf: 'sand', face: 'beach', shore: true, depth: 14 },
      { x0: 785, x1: 1060, surf: 'rock', face: 'rocks', depth: 14 },
      { x0: 1060, x1: 1108, surf: 'paving', face: 'quay', depth: 16 },
      { x0: 1108, x1: 1612, surf: 'deck', face: 'pier', depth: 20 },
      { x0: 1612, x1: 1885, surf: 'paving', face: 'pier', depth: 18 },
      { x0: 1885, x1: 1995, surf: 'path', face: 'rocks', depth: 14 },
      { x0: 1995, x1: 2600, surf: 'path', face: 'cliff', depth: 16 },
    ],
    /** Lecho marino del corte submarino (mundo) */
    bedAt(x) {
      const B = [[262, 318], [330, 326], [420, 336], [600, 348], [780, 352], [900, 362], [1060, 374], [1150, 388], [1300, 404], [1450, 410], [1600, 400], [1750, 394], [1885, 376], [2000, 326]];
      let i = 0; while (i < B.length - 2 && B[i + 1][0] <= x) i++;
      const t = clamp((x - B[i][0]) / (B[i + 1][0] - B[i][0]), 0, 1);
      return Math.round(lerp(B[i][1], B[i + 1][1], smooth(t)) + Math.sin(x * 0.07) * 2 + (vnoise(x * 0.03, 0, 5) - 0.5) * 8);
    },
    /** Elementos sumergidos: toma con rejilla (bajo la torre), succiones de bombas, arrecifes, cardumen */
    water: { intake: { x: 1462, y: 374, top: 262 }, suction: [1198, 1240], suctionY: 334, reef: [[1150, 1330, 16], [1690, 1860, 12], [560, 760, 9], [880, 1040, 8]], fish: 24, fishX: [380, 1980] },
    /** Oclusores del plano frontal (f 1,3): abajo en los bordes y dosel arriba-izquierda al inicio */
    fg: [
      { kind: 'canopy', x: -24, y: -8, w: 300, h: 92, seed: 31, side: -1, n: 22, vines: 5 },
      { kind: 'clump', x: -18, w: 150, h: 104, seed: 3, spikes: 8, leaves: 14 },
      { kind: 'clump', x: 600, w: 110, h: 70, seed: 8, spikes: 2, leaves: 9 },
      { kind: 'clump', x: 1150, w: 100, h: 64, seed: 13, spikes: 3, leaves: 8 },
      { kind: 'clump', x: 1640, w: 120, h: 66, seed: 17, spikes: 4, leaves: 10 },
      { kind: 'canopy', x: 2050, y: -8, w: 200, h: 64, seed: 37, side: 1, n: 11, vines: 3 },
      { kind: 'clump', x: 2330, w: 120, h: 82, seed: 21, spikes: 5, leaves: 10 },
      { kind: 'clump', x: 2860, w: 140, h: 88, seed: 25, spikes: 5, leaves: 12 },
      { kind: 'clump', x: 3150, w: 130, h: 80, seed: 27, spikes: 4, leaves: 10 },
    ],
  },
  /** Etiquetas científicas en el mundo (WorldLabels) */
  labels: [
    { x: 1226, y: 196, title: 'BOMBEO', sub: '(Agua de mar)', kind: 'water', ay: 212 },
    { x: 1455, y: 118, title: 'CAPTACIÓN', sub: 'Toma costera', kind: 'water', ax: 1455, ay: 132 },
    { x: 1500, y: 330, title: 'REJILLA DE TOMA', sub: (sc) => 'v ≈ ' + fmt((sc.state.q || 100) / 3600 / 1.6, 3) + ' m/s', kind: 'tech', ax: 1466, ay: 352 },
    { x: 1250, y: 372, title: 'ARRECIFE', sub: '(Zona de cría)', kind: 'green', ax: 1232, ay: 388 },
    { x: 1745, y: 150, title: 'PRETRATAMIENTO', sub: '(Filtros de arena)', kind: 'water', ax: 1745, ay: 166 },
    { x: 2084, y: 214, title: 'AGUA PRETRATADA', sub: 'hacia la planta OI', kind: 'water', ax: 2084, ay: 248 },
    { x: 735, y: 236, title: 'TURBIDEZ', sub: (sc) => fmt(sc.state.turb || 2.5, 1) + ' NTU', kind: 'alert', ax: 735, ay: 262, when: (sc) => !!sc.state.hud },
  ],
  /* ---------------- accesorios estáticos (prerender, f = 1) ---------------- */
  props(pb, world) {
    const gy = (x) => world.groundAt(x);
    const segs = PFTerrain.surface(pb, world); // caras superiores del suelo (camino, arena, losas, cubierta)
    const back = (x) => PFTerrain.backEdge(PFTerrain.segAt(segs, x), Math.round(x), gy(x));
    const r = RNG(1101);
    const F = PFFlora, I = PFInfra;
    /* ===== 1. ACANTILADO DE INICIO (0–345): letrero, flores, palmeras ===== */
    F.palm(pb, 212, back(212) + 2, 66, -7, 12);
    F.tree(pb, 150, back(150) + 3, 58, 14, { wide: 1.1 });
    F.scatter(pb, (x) => back(x) + 2, 0, 268, 21, { gap: 8, mix: { tuft: 5, bush: 3, flowers: 2, agave: 1, fern: 2, lupine: 1, hibiscus: 1 } });
    F.palm(pb, 10, back(10) + 3, 84, 7, 11, { frondK: 1.05 });
    F.palm(pb, 300, back(300) + 2, 56, 4, 13);
    rockPile(pb, 62, back(62) + 4, 22, 9, 3); rockPile(pb, 246, back(246) + 6, 18, 7, 4);
    // letrero de destinos (como en la referencia)
    PFSigns.post(pb, 2, gy(2) + 2, [{ text: 'DESALINIZACIÓN' }, { text: 'ENERGÍA SOLAR' }, { text: 'AGROECOLOGÍA' }, { text: 'ZONA ÁRIDA' }], 7, { font: 'tiny' });
    F.hibiscusBush(pb, 104, gy(104) - 5, 22, 16, 41);
    for (let k = 0; k < 4; k++) F.lupine(pb, 124 + k * 4, gy(124) - 6, 14 + (k % 2) * 6, 43 + k);
    F.flowerPatch(pb, 180, gy(180) - 4, 18, 45);
    F.tuft(pb, 200, gy(200) - 3, 10, 9, 47); F.tuft(pb, 38, gy(38) - 3, 10, 8, 48);
    // terraza baja
    F.bush(pb, 250, gy(250) - 9, 20, 13, RAMP.foliageR, 51); F.agave(pb, 276, gy(276) - 5, 8, 52);
    /* ===== 2. PLAYA (345–785): cabaña de Tía Marea, botes, redes ===== */
    F.palm(pb, 398, back(398) + 2, 66, -6, 61); F.palm(pb, 445, back(445) + 2, 50, 5, 62);
    F.scatter(pb, (x) => back(x) + 3, 290, 470, 63, { gap: 13, mix: { tuft: 4, dry: 3, agave: 1 } });
    mareaHut(pb, 470, gy(500) - 6);
    nets(pb, 584, gy(584) - 8);
    boat(pb, 606, gy(606) - 5, ['#ff7656', '#a6303a', '#5a1018'], 71); boat(pb, 664, gy(664) - 7, ['#ffd84a', '#c8861a', '#6a3a08'], 72);
    F.scatter(pb, (x) => back(x) + 3, 700, 785, 73, { gap: 12, mix: { tuft: 3, dry: 3, flowers: 1 } });
    F.palm(pb, 762, back(762) + 2, 60, -8, 74);
    I.crate(pb, 452, gy(452) - 4, 9, 7, 4); I.barrel(pb, 566, gy(566) - 5); I.barrel(pb, 573, gy(573) - 3, ['#5a1010', '#8a1a1a', '#c02a2a', '#e04a3a', '#f07a5a', '#ffb090']);
    for (const x of [372, 530, 640, 720]) shells(pb, x, gy(x) - 3);
    /* ===== 3. ROQUEDAL (785–1060): rocas, charcas de marea, matorral ===== */
    for (let x = 790; x < 1060; x += 26 + r.int(0, 18)) rockPile(pb, x, back(x) + 5, 14 + r.int(0, 14), 6 + r.int(0, 6), x);
    F.scatter(pb, (x) => back(x) + 4, 785, 1060, 81, { gap: 10, mix: { tuft: 4, bush: 2, agave: 2, flowers: 1, fern: 1 } });
    for (const x of [846, 934, 1004]) tidePool(pb, x, gy(x) - 6, 13, 3);
    F.tree(pb, 980, back(980) + 3, 50, 83, { wide: 0.9 });
    /* ===== 4. EXPLANADA DEL DRON (1060–1108) y ESCALINATA ===== */
    dronePad(pb, 1080, gy(1080) - 7);
    I.cabinet(pb, 1063, gy(1063) - 10, 9, 14, 4); I.lamp(pb, 1100, gy(1100) - 12, 34);
    /* ===== 5. MUELLE DE CAPTACIÓN (1108–1612): toma → rejas y tamices → bombeo → pretratamiento ===== */
    const deckY = 268;
    PFTerrain.railing(pb, 1112, 1606, deckY - 18, 8);
    I.transformer(pb, 1128, deckY - 9);
    I.pumpHouse(pb, 1180, deckY - 6, 92, 46, 16);
    I.glassHall(pb, 1302, deckY - 6, 96, 26, 14);
    I.intakeTower(pb, 1430, deckY - 4, 206, 50);
    I.gantry(pb, 1508, deckY - 8, 64, 84);
    // contenedor de cloración bajo el pórtico y tanque de amortiguación al final del muelle
    I.box3q(pb, 1516, deckY - 9, 40, 17, 10, { ramp: ['#0e2a1e', '#1a4a32', '#2a6a48', '#3d926a', '#6ab890', '#a8e0c0'], front: (xx, yy, u, v) => PFK.P32(['#0e2a1e', '#1a4a32', '#2a6a48', '#3d926a', '#6ab890', '#a8e0c0'])[(xx - 1516) % 4 === 0 ? 2 : 3 - Math.round(v)] });
    for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 5; xx++) if (Math.abs(xx - 2) + Math.abs(yy - 2) <= 2) PFK.put(pb, 1546 + xx, deckY - 21 + yy, U(Math.abs(xx - 2) + Math.abs(yy - 2) === 2 ? '#2a282e' : '#ffd84a'));
    I.cylV(pb, 1586, deckY - 8, 8, 50, { dome: 0.5, bands: [{ y: 9, h: 3 }, { y: 38, h: 2 }], ladder: true, plate: '#11bedd', stain: true });
    // bandeja de cables: transformador → casa de bombas
    for (let x = 1146; x < 1182; x++) { PFK.put(pb, x, 238, U('#2a282e')); PFK.put(pb, x, 239, U('#4f4d51')); if (x % 6 === 0) for (let y = 240; y < deckY - 9; y++) PFK.put(pb, x, y, U('#716f76')); }
    // succión: torre → nave de rejas → casa de bombas; impulsión: casa de bombas → filtros
    I.pipe(pb, [[1432, 238], [1398, 238]], 3, 'sea', { flange: 12 });
    I.pipe(pb, [[1302, 238], [1272, 238]], 3, 'sea', { flange: 12 });
    I.pipe(pb, [[1262, 254], [1622, 254], [1622, 218], [1652, 218]], 3, 'sea', { flange: 22, supports: 40, supportTo: () => deckY - 6 });
    I.pipe(pb, [[1300, 260], [1604, 260]], 1, 'steel', { flange: 30 }); // retorno de lavado
    I.valve(pb, 1330, 254); I.valve(pb, 1470, 254); I.valve(pb, 1590, 254); I.gauge(pb, 1286, 243, 3, -1.2); I.gauge(pb, 1420, 243, 3, -0.4);
    for (const x of [1124, 1352, 1500, 1598]) I.bollard(pb, x, deckY - 2);
    I.lifeRing(pb, 1404, deckY - 13); I.lamp(pb, 1116, deckY - 14, 36); I.lamp(pb, 1604, deckY - 12, 36);
    I.crate(pb, 1488, deckY - 6, 10, 8, 4); I.crate(pb, 1562, deckY - 4, 8, 6, 3); I.barrel(pb, 1572, deckY - 4); I.barrel(pb, 1415, deckY - 5, ['#5a1010', '#8a1a1a', '#c02a2a', '#e04a3a', '#f07a5a', '#ffb090']);
    I.cabinet(pb, 1282, deckY - 7, 9, 13, 4); I.cabinet(pb, 1484, deckY - 7, 8, 11, 3);
    ropeCoil(pb, 1504, deckY - 4);
    /* ===== 6. PRETRATAMIENTO (1612–1885): batería de filtros de arena, caseta, dosificación ===== */
    const py = gy(1700);
    controlRoom(pb, 1612, py - 4);
    I.mediaFilters(pb, 1660, py - 4, 4, { r: 11, h: 44, gap: 36 });
    // soportes de la pasarela (la pasarela se hornea en el terreno)
    for (const x of [1644, 1716, 1786]) for (let y = 210; y < py - 10; y++) { PFK.put(pb, x, y, U('#948e91')); PFK.put(pb, x + 1, y, U('#4f4d51')); }
    dosingSkid(pb, 1812, py - 4);
    I.cylV(pb, 1862, py - 8, 9, 54, { dome: 0.45, bands: [{ y: 10, h: 3 }, { y: 40, h: 2 }], ladder: true, plate: '#11bedd', stain: true }); // tanque de lavado
    I.pipe(pb, [[1806, py - 18], [1872, py - 18], [1872, py - 14], [1995, py - 14], [1995, 252], [2125, 252], [2125, 236], [2345, 236], [2345, 222], [2600, 222]], 3, 'pre', { flange: 24, supports: 44, supportTo: (x) => gy(x) - 6 });
    /* ===== 7. SENDERO ROCOSO A LA PLANTA OI (1885–2600) ===== */
    F.scatter(pb, (x) => back(x) + 2, 1885, 2600, 91, { gap: 9, mix: { tuft: 5, bush: 3, agave: 2, flowers: 2, fern: 1, lupine: 1, dry: 2 } });
    for (const [x, h, l] of [[1940, 60, 6], [2160, 74, -6], [2290, 56, 4], [2440, 80, -8], [2580, 62, 5]]) F.palm(pb, x, back(x) + 2, h, l, x);
    F.tree(pb, 2060, back(2060) + 3, 62, 93); F.tree(pb, 2390, back(2390) + 3, 54, 94, { wide: 1.1 });
    for (let x = 1900; x < 2600; x += 40 + r.int(0, 40)) rockPile(pb, x, back(x) + 5, 14 + r.int(0, 12), 6 + r.int(0, 5), x + 7);
    PFSigns.post(pb, 2488, gy(2488) - 7, [{ text: 'PLANTA OI' }, { text: 'LA TOMA', dir: -1 }], 19);
    F.hibiscusBush(pb, 2470, gy(2470) - 5, 20, 14, 95);
  },
  /** Primer plano a ras de suelo (delante de los pies): pasto alto, flores */
  propsFront(pb, world) {
    const gy = (x) => world.groundAt(x), F = PFFlora;
    for (let x = 6; x < 262; x += 23) if ((x * 13) % 5 < 3) F.tuft(pb, x, gy(x) + 3, 7, 7, x);
    for (let x = 360; x < 780; x += 31) F.tuft(pb, x, gy(x) + 3, 8, 6, x + 3, PFFlora.DRY);
    for (let x = 800; x < 1050; x += 37) F.tuft(pb, x, gy(x) + 3, 7, 6, x + 5);
    for (let x = 1890; x < 2600; x += 29) if ((x * 7) % 4 < 3) F.tuft(pb, x, gy(x) + 3, 7, 7, x + 9);
  },
  /* ---------------- dinámico ---------------- */
  renderBack(g, sc, cam) {
    const S = sc.state;
    // pluma de turbidez en el mar lejano (avanza desde el horizonte) en bandas suaves, sin tramado
    if (S.plume > 0) {
      const B = sc.backdrop, hz = Math.round(typeof B.seaY === 'function' ? B.seaY(cam) : (B.horizon ?? 140) - cam.y * 0.1);
      const front = hz + 4 + S.plume * 120;
      g.fillStyle = '#a07a3a';
      for (let y = hz + 2, i = 0; y < Math.min(front, H); y += 6, i++) {
        const k = 1 - (y - hz) / (front - hz + 1);
        g.globalAlpha = clamp((0.12 + k * 0.4) * S.plume, 0, 0.6);
        g.fillRect(0, y + ((i % 2) ? 1 : 0), W, 6);
      }
      g.globalAlpha = 1;
    }
  },
  renderMid(g, sc, cam) {
    const S = sc.state, t = Game.time, ox = cam.x, oy = cam.y;
    // flujos en tuberías (chevrones): agua de mar turquesa y agua pretratada azul claro
    PFInfra.drawFlows(g, sc, LV1_FLOWS);
    PFInfra.drawLeds(g, sc, LV1_LEDS);
    // luz de advertencia de la torre (mástil) — verde en servicio, roja con la compuerta cerrada
    const on = Math.floor(t * 2) % 2;
    if (on) { const lx = 1476 - ox, ly = 134 - oy; frect(g, lx - 1, ly, 3, 3, S.gateClosed ? '#ff4e5d' : '#3fe0a0'); PFK.drawGlow(g, lx + 0.5, ly + 1.5, 5, S.gateClosed ? '#ff4e5d' : '#3fe0a0', 0.6); }
    // dron de muestreo en su plataforma
    if (!S.droneOut) drawDrone(g, 1080 - ox, 284 - oy, t, false);
    // peces que saltan cerca del arrecife (salud ecológica)
    const eco = 1 - (S.eco || 0.2);
    if (eco > 0.4) { const ph = (t * 0.5) % 3; if (ph < 0.6) { const fx = 1250 + Math.sin(Math.floor(t * 0.5 / 3) * 7) * 80 - ox; const fy = 296 - Math.sin(ph / 0.6 * Math.PI) * 16 - oy; frect(g, Math.round(fx), Math.round(fy), 5, 2, '#f4f2dc'); fpx(g, Math.round(fx) + 5, Math.round(fy), '#e8c040'); fpx(g, Math.round(fx) - 1, Math.round(fy) + 1, '#e8c040'); } }
    // manómetro diferencial del filtro (sobre la pasarela)
    const gx = 1700 - ox, gy2 = 194 - oy;
    frect(g, gx - 1, gy2 + 6, 2, 6, '#716f76');
    fdisc(g, gx, gy2, 7, '#2a282e'); fdisc(g, gx, gy2, 6, '#d3ccc5'); fdisc(g, gx - 1, gy2 - 1, 5, '#f4fbff');
    const dp = clamp((S.dp || 0.3) / 1.6, 0, 1); const a = Math.PI * (0.8 + dp * 1.4);
    frect(g, gx - 5, gy2 + 2, 3, 1, '#3fe0a0'); frect(g, gx + 3, gy2 + 2, 3, 1, '#ff4e5d');
    fline(g, gx, gy2, gx + Math.cos(a) * 5, gy2 + Math.sin(a) * 5, dp > 0.7 ? '#ff4e5d' : '#140d26');
  },
  renderGrade(g, sc) {
    const S = sc.state;
    if (S.storm > 0) { g.globalCompositeOperation = 'multiply'; g.globalAlpha = S.storm * 0.55; frect(g, 0, 0, W, H, '#c09070'); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  },
  lens(g, sc, cam, k) {
    const ox = cam.x, oy = cam.y, S = sc.state;
    lensBoundary(g, 1110 - ox, 150 - oy, 780, 150, '#ffe14d', 'LÍMITE: CAPTACIÓN + PRETRATAMIENTO');
    Charts.flow(g, [[1462 - ox, 360 - oy], [1462 - ox, 238 - oy], [1272 - ox, 238 - oy]], 'seawater', S.gateClosed ? 0 : 1, 3);
    Charts.flow(g, [[1262 - ox, 254 - oy], [1622 - ox, 254 - oy], [1622 - ox, 218 - oy], [1652 - ox, 218 - oy]], 'seawater', S.gateClosed ? 0 : 1, 3);
    Charts.flow(g, [[1872 - ox, 264 - oy], [1995 - ox, 264 - oy], [1995 - ox, 252 - oy], [2120 - ox, 252 - oy]], 'water', 1, 3);
    Charts.flow(g, [[1138 - ox, 238 - oy], [1182 - ox, 238 - oy]], 'power', 1, 2);
    lensTag(g, 1440 - ox, 176 - oy, 'Qtoma ' + fmt0(S.q || 100) + ' m³/h', '#6cf0db', 'water');
    lensTag(g, 1300 - ox, 196 - oy, 'Turbidez ' + fmt(S.turb || 2.5, 1) + ' NTU', '#ffb93b', 'filter');
    lensTag(g, 1660 - ox, 176 - oy, 'ΔP filtro ' + fmt(S.dp || 0.3, 2) + ' bar', '#ff9a8a', 'chart');
    lensTag(g, 1880 - ox, 238 - oy, '→ OI (agua pretratada)', '#a6f4ff', 'membrane');
    lensTag(g, 1180 - ox, 140 - oy, 'Bombas ~' + fmt0((S.q || 100) * 0.25) + ' kW', '#ffe14d', 'bolt');
    lensTag(g, 1380 - ox, 344 - oy, 'v aprox. ' + fmt((S.q || 100) / 3600 / 1.6, 3) + ' m/s', '#86e36f', 'fish');
  },
  hud(g, sc) {
    const S = sc.state;
    if (!S.hud) return;
    hudGauges(g, [
      { icon: 'filter', label: 'TURBIDEZ', value: fmt(S.turb || 2.5, 1) + ' NTU', frac: (S.turb || 2.5) / 40, color: (S.turb || 0) > 10 ? '#ff9f43' : '#56e5ff' },
      { icon: 'chart', label: 'ΔP FILTRO', value: fmt(S.dp || 0.3, 2) + ' bar', frac: (S.dp || 0.3) / 1.6, color: (S.dp || 0) > 1 ? '#ff4e5d' : '#86e36f' },
      { icon: 'tank', label: 'RESERVA', value: fmt0((S.tank ?? 0.7) * 100) + ' %', frac: S.tank ?? 0.7, color: '#56e5ff' },
      { icon: 'fish', label: 'RIESGO ECO', value: S.eco > 0.5 ? 'ALTO' : S.eco > 0.25 ? 'MEDIO' : 'BAJO', frac: S.eco || 0.2, color: S.eco > 0.5 ? '#ff4e5d' : '#86e36f' },
    ]);
  },
  /* ---------------- guion ---------------- */
  setup(sc, p) {
    const S = sc.state;
    Object.assign(S, { turb: 2.5, dp: 0.35, tank: 0.7, eco: 0.2, q: 100, plume: 0, storm: 0, hud: false, gateClosed: false, gateAnim: 0 });
    sc.musicOverride = null;
    const w = sc.world;
    const marea = sc.actor('marea', 'marea', 548, { facing: -1, restAnim: 'idle' });
    const dante = sc.actor('dante', 'dante', 1040, { facing: -1 });
    const pesc = sc.actor('pesc', 'crowd2', 700, { facing: -1, wander: 30 });
    const limen = sc.actor('limen', 'limen', 1456, { fly: true, y: 200, hidden: true, talkable: false });
    limen.render = function (g, cam) { if (this.hidden) return; Actor.prototype.render.call(this, g, cam); };
    // KIRU: compañero
    // pickups: ecos de memoria de KIRU (coleccionables narrativos)
    w.add(new Pickup({ kind: 'echo', x: 905, y: 196, onPick: () => kiruEcho(sc, 'l1a', 'KIRU: "¿Por qué conozco el camino a la galería vieja si nunca vinimos?"') }));
    w.add(new Pickup({ kind: 'echo', x: 2080, y: 200, onPick: () => kiruEcho(sc, 'l1b', 'KIRU: "Ranchería Los Médanos... ese nombre suena como una canción que no recuerdo."') }));
    // adversarios conceptuales (aparecen con la tormenta)
    S.foulers = [];
    // --- Tía Marea
    marea.onTalk = async (sc2) => {
      if (!S.metMarea) {
        S.metMarea = true;
        await sc2.say([
          ['marea', 'smile', 'Amaya, mija. Vienes por la toma, ¿cierto? El mar no entrega la misma agua dos veces.'],
          ['amaya', 'smile', 'Los sensores dicen que la turbidez está en 2 NTU. Agua de manual.'],
          ['marea', 'skeptical', 'Los sensores dicen. Las gaviotas dicen otra cosa: se fueron a pescar lejos, y allá afuera el agua cambió de color esta mañana.'],
          ['kiru', 'thinking', 'Dato cualitativo registrado: "gaviotas lejos" + "color raro". Precisión: abuela de nivel experta.'],
          ['marea', 'neutral', 'Y el sensor de la toma lleva tres días bajo la arena. Lo puso alguien con prisa.'],
        ]);
        const c = await sc2.say([['amaya', 'thinking', '¿Consultamos a Tía Marea antes de reabrir la toma o confiamos en la telemetría?', { choices: ['Pedirle que nos acompañe con su pronóstico (tarda un poco)', 'Confiar en la telemetría y avanzar rápido'] }]]);
        GS.decide('consultMarea', c === 0);
        if (c === 0) { GS.trust('community', 8); await sc2.say([['marea', 'happy', 'Así me gusta. Cuando sople del noroeste y el agua se ponga color café con leche, desconfía de cualquier número bonito.'], ['kiru', 'happy', 'Pronóstico local integrado. Banda de incertidumbre: más estrecha.']]); }
        else await sc2.say([['marea', 'calm', 'Como quieras. El mar no lee la telemetría.']]);
        sc2.setObjective('Reúnete con Dante junto a la plataforma del dron', ['¿Hacia dónde está la toma?', 'Dante espera junto a la plataforma amarilla, cerca del muelle.', 'Camina hacia la derecha por las rocas.']);
        if (!GS.lp(1).side.sensor) S.sensorQuest = true;
      } else if (S.sensorQuest && !GS.lp(1).side.sensor) {
        await sc2.say([['marea', 'neutral', 'El sensor enterrado está entre los botes y las rocas. Si lo mueves, piensa qué agua quieres medir: la que rompe en la orilla o la que entra a la toma.']]);
      } else await sc2.say([['marea', 'smile', 'Ve con cuidado, mija. Y escucha también lo que no aparece en las pantallas.']]);
    };
    // --- Pescador: misión "La rejilla que cantaba"
    pesc.onTalk = async (sc2) => sideScreens(sc2);
    // --- sensor enterrado (misión de medición)
    sc.station({ id: 'sensorBuried', x: 735, kind: 'sensor', label: 'Sensor enterrado', glow: '#ffb93b', onUse: (sc2, st) => sideSensor(sc2, st) });
    // --- Dante
    dante.onTalk = async (sc2) => {
      if (!S.droneDone) await meetDante(sc2);
      else await sc2.say([['dante', 'smile', 'El dron ya está cargando. La cabina de control está en la casa de bombas.']]);
    };
    // --- plataforma del dron
    sc.station({ id: 'drone', x: 1080, kind: 'terminal', label: 'Dron de muestreo', glow: '#ff9f43', hidden: true, hY: 10,
      draw: () => { }, onUse: async (sc2, st) => { if (!S.metDante) return; await droneMission(sc2); st.done = true; } });
    // --- cabina de control (gemelo de la toma)
    sc.station({ id: 'intakeSim', x: 1236, y: 268, kind: 'sim', label: 'Gemelo de la toma', glow: '#56e5ff', hidden: true, onUse: async (sc2, st) => intakeFlow(sc2, st) });
    // --- Puerta de Evidencia (SOLO)
    sc.station({ id: 'solo', x: 1915, kind: 'solo', label: 'Puerta de Evidencia', glow: '#b49cff', progress: 0, hidden: true, onUse: async (sc2, st) => {
      const r = await sc2.open(SOLOScene, { ctx: 'RA-01-C3' });
      st.progress = r.correct; if (r.correct >= 3) { st.done = true; GS.lp(1).solo = true; S.soloDone = true; Codex.unlock('incertidumbre_med'); }
      if (S.soloDone && S.restDone) sc2.setObjective('Sigue el camino hacia la Planta OI', ['La salida está a la derecha, sobre el acantilado.']);
    } });
    // --- salida
    sc.station({ id: 'exit', x: 2540, kind: 'clue', label: 'Ir a la Planta OI', glow: '#ffe14d', hidden: true, onUse: async (sc2) => finishLevel1(sc2) });
    sc.setObjective('Sigue la costa hacia la toma de SYNARA', ['¿Qué ves en el horizonte del mar?', 'Habla con la gente de la costa: Tía Marea conoce estas aguas.', 'Camina a la derecha. Puedes hablar con Tía Marea en su cabaña.']);
    Codex.unlock('agua_mar');
    if (p.checkpoint === 'intake') { S.metDante = true; S.droneDone = true; S.hud = true; dante.x = 1200; sc.world.find('intakeSim').hidden = false; GS.giveTool('barrido', true); sc.setObjective('Configura la captación en el Gemelo de la toma', ['¿Qué cambia primero: caudal, turbidez o ΔP?']); }
    if (p.checkpoint === 'filters') { S.metDante = true; S.droneDone = true; S.hud = true; S.limenEvent = true; S.gateClosed = true; S.gateAnim = 1; dante.x = 1560; GS.giveTool('barrido', true); const st = sc.world.find('intakeSim'); st.hidden = false; S.simStage = 'auto'; sc.setObjective('Reabre la toma con seguridad en el Gemelo (El Filtro Ciego)', []); }
  },
  update(sc, dt) {
    const S = sc.state;
    S.gateAnim = approach(S.gateAnim || 0, S.gateClosed ? 1 : 0, dt * 1.5);
    if (S.storm > 0) { ambientParticles(sc.world.ps, 'dust', sc.cam, 0.8 * S.storm, 1.5); sc.backdrop.weather.wind = 1 + S.storm; }
    for (const w of sc.world.water) w.turbid = clamp((S.turb - 3) / 40, 0, 0.7);
  },
  triggers: [
    { x: 300, w: 40, run: (sc) => { sc.kiru && sc.kiru.say('Huele a algas... y a una lista de pendientes. ¿Ves ese tono café allá lejos?', 'curioso'); sc.state.plume = 0.08; Codex.unlock('turbidez'); } },
    { x: 960, w: 40, run: (sc) => { if (!sc.state.metDante) sc.dante && 0; } },
  ],
};

/* ---------------- datos animados del plano (kit PF) ---------------- */
const LV1_FLOWS = [
  { pts: [[1432, 238], [1398, 238]], kind: 'sea', rate: (sc) => sc.state.gateClosed ? 0 : (sc.state.q || 100) / 100 },
  { pts: [[1302, 238], [1272, 238]], kind: 'sea', rate: (sc) => sc.state.gateClosed ? 0 : (sc.state.q || 100) / 100 },
  { pts: [[1262, 254], [1622, 254], [1622, 218], [1652, 218]], kind: 'sea', rate: (sc) => sc.state.gateClosed ? 0 : (sc.state.q || 100) / 100 },
  { pts: [[1806, 264], [1872, 264], [1872, 268], [1995, 268], [1995, 252], [2125, 252], [2125, 236], [2345, 236], [2345, 222], [2600, 222]], kind: 'pre', rate: 0.8 },
];
const LV1_LEDS = [
  { x: 1065, y: 271, col: '#3fe0a0', hz: 1 }, { x: 1067, y: 271, col: '#ffd84a', hz: 1.7, ph: 0.3 },
  { x: 1284, y: 249, col: '#3fe0a0', hz: 1.2 }, { x: 1286, y: 249, col: '#ff5a4a', hz: 2, ph: 0.5 },
  { x: 1486, y: 251, col: '#3fe0a0', hz: 1.4 }, { x: 1131, y: 247, col: '#ffd84a', hz: 1 },
  { x: 1446, y: 220, col: '#17f3f7', hz: 1.5 }, { x: 1628, y: 240, col: '#3fe0a0', hz: 1.1 }, { x: 1817, y: 262, col: '#ff9f43', hz: 1.8 },
];
LEVELS[1].pf.fauna = { eagle: { x0: 60, x1: 760, y: 70 }, gulls: [{ x: 300, y: 90, n: 4 }, { x: 900, y: 110, n: 3 }, { x: 1500, y: 80, n: 4 }, { x: 2200, y: 100, n: 3 }], drones: [{ x: 1600, y: 168, r: 30 }, { x: 2300, y: 150, r: 40 }] };

/* ---------------- piezas del guion ---------------- */
function kiruEcho(sc, id, text) {
  if (!GS.s.echoes.includes(id)) GS.s.echoes.push(id);
  sc.kiru && sc.kiru.say(text.replace(/^KIRU: /, ''), 'confundido', 5);
  Game.toast('Eco de memoria de KIRU (' + GS.s.echoes.length + ')', 'kiru', '#b49cff');
}
async function meetDante(sc) {
  const S = sc.state;
  S.metDante = true;
  await sc.say([
    ['dante', 'joy', '¡Llegaron! Traje el dron de muestreo. Le cambié las hélices: ahora suena como una licuadora optimista.'],
    ['amaya', 'determined', 'Necesitamos la toma operando hoy. Si la planta no recibe agua, todo SYNARA se queda sin primer agua.'],
    ['dante', 'skeptical', 'Si el manual dice "no debería ocurrir", ocurrirá un martes a las tres. Hoy es martes.'],
    ['kiru', 'curioso', 'Son las 2:41. Tenemos diecinueve minutos de optimismo.'],
    ['amaya', 'thinking', 'Primero medimos. Si el agua de entrada cambia, todo lo demás cambia.'],
  ]);
  sc.world.find('drone').hidden = false;
  sc.setObjective('Toma muestras del mar con el dron de muestreo', ['¿Qué variables describen el agua que entra a la toma?', 'Turbidez, salinidad (TDS) y temperatura, con su incertidumbre.', 'Interactúa con la plataforma del dron.']);
}
async function droneMission(sc) {
  const S = sc.state;
  S.droneOut = true;
  const r = await sc.open(DroneScene, { marea: GS.s.decisions.consultMarea });
  S.droneOut = false;
  if (!r) return;
  S.droneDone = true; S.chosenPoint = r.choice; S.hud = true;
  GS.giveTool('barrido');
  Codex.unlock('captacion'); Codex.unlock('incertidumbre_med');
  await sc.say([
    ['kiru', 'thinking', 'Análisis: la turbidez sube mar adentro hacia el noroeste. La telemetría de la toma no lo ve porque su sensor está... ¿bajo la arena?'],
    ['dante', 'surprised', 'Entonces el agua que medimos no es la que entra.'],
    ['amaya', 'determined', 'Pregunta de investigación: ¿qué cambia primero cuando llega un pulso de turbidez: el caudal, la turbidez o la presión diferencial del filtro?'],
    ['kiru', 'happy', 'Nueva herramienta: {c}Barrido Sensorial{/}. Pulsa {y}Q{/} cerca de sensores para muestrear con incertidumbre.'],
  ]);
  sc.world.find('intakeSim').hidden = false;
  GS.save('intake');
  sc.setObjective('Configura la captación en el Gemelo de la toma (casa de bombas)', ['¿Qué variable limita el sistema hoy?', 'Mira la turbidez de entrada y la capacidad del filtro.', 'Entra a la cabina de control junto al muelle.']);
}
async function intakeFlow(sc, st) {
  const S = sc.state;
  if (!S.simStage) {
    const r = await sc.open(Sim01, { phase: 'demo', stopAfter: 'guided', point: S.chosenPoint, marea: GS.s.decisions.consultMarea });
    if (!r || !r.ok) return;
    S.simStage = 'storm';
    Codex.unlock('pretratamiento');
    await limenEvent(sc);
    return;
  }
  if (S.simStage === 'auto' || S.simStage === 'storm') {
    const r = await sc.open(Sim01, { phase: 'auto', stopAfter: 'auto', point: S.chosenPoint, marea: GS.s.decisions.consultMarea });
    if (!r || !r.ok) { sc.kiru && sc.kiru.say('Podemos reintentarlo. Ningún filtro fue dañado en esta simulación.', 'valiente'); return; }
    S.simStage = 'explain'; S.gateClosed = false; S.storm = 0.3; S.turb = 6; GS.lp(1).guardian = true;
    GS.flag('protectedIntake', true);
    const ok = await explain(sc, {
      id: 'lv1_explain', ra: 'RA-01', concepts: ['pretreatment', 'waterQuality'],
      prompt: 'Durante el pulso redujiste el caudal de toma y usaste la reserva del tanque. ¿Qué relación causal explica por qué eso protege la producción de agua en las próximas horas?',
      options: [
        'Con menos caudal entra menos carga de sólidos; el filtro acumula menos pérdida de carga y no colapsa, así la planta puede seguir operando cuando el pulso pase.',
        'Con menos caudal la turbidez del mar disminuye, porque la toma deja de removerla.',
        'Reducir el caudal aumenta la presión del filtro y eso limpia el medio filtrante.',
        'El tanque produce agua nueva mientras la toma está cerrada.'],
      key: 0, mis: 'creer que captar más siempre produce más',
      why: 'La carga de sólidos que llega al filtro es turbidez × caudal. Menos caudal durante el pulso mantiene el ΔP bajo el límite, evita el colapso y conserva la disponibilidad; la reserva del tanque cubre la demanda temporalmente.',
      whyNot: { 1: 'La turbidez del mar no depende de tu toma: llega con el pulso. Lo que controlas es cuánta carga entra.', 2: 'Más caudal (no menos) eleva el ΔP; la limpieza requiere lavado a contracorriente.', 3: 'El tanque almacena; no produce agua.' },
    });
    if (ok) S.explained = true;
    const r2 = await sc.open(Sim01, { phase: 'transfer', stopAfter: 'transfer', point: S.chosenPoint });
    if (r2 && r2.ok) GS.lp(1).variant = true;
    await restScene(sc);
    return;
  }
  await sc.open(Sim01, { phase: 'free', stopAfter: 'free', point: S.chosenPoint });
}
async function limenEvent(sc) {
  const S = sc.state, limen = sc.world.find('limen'), dante = sc.world.find('dante');
  sc.musicOverride = 'mystery'; Audio2.playMusic('mystery');
  await sc.camTo(1380, 290, 1.2);
  // llega la tormenta: el pulso avanza
  const t0 = sc.time;
  await sc.until(() => { const k = clamp((sc.time - t0) / 3, 0, 1); S.plume = lerp(0.08, 1, k); S.storm = k * 0.8; S.turb = lerp(2.5, 8, k); sc.backdrop.weather.wind = 1 + k * 2; return k >= 1; });
  Audio2.sfx('gust');
  // LIMEN aparece y cierra la compuerta
  limen.hidden = false; Audio2.sfx('limen'); sc.world.ps.emit('crystal', limen.x, limen.y - 50, 0, 0, 40, 20);
  Game.doFlash('#c4fbff', 0.6);
  await sc.wait(0.6);
  limen.expr = 'speak';
  await sc.say([['limen', 'alert', 'MARGEN EXCEDIDO EN T+14. CIERRE DE CAPTACIÓN.'], ['limen', 'alert', 'NO REINICIEN.']]);
  S.gateClosed = true; Audio2.sfx('valve'); sc.cam.shake(3, 0.5);
  await sc.wait(0.8);
  limen.hidden = true; sc.world.ps.emit('crystal', limen.x, limen.y - 50, 0, 0, 30, 20); Audio2.sfx('limen', { vol: 0.5 });
  GS.flag('sawLimen', true);
  await sc.wait(1.0);
  // la alarma visible llega después
  S.turb = 24; S.dp = 0.9;
  Audio2.sfx('alarm');
  await sc.say([
    ['amaya', 'angry', '¡Nos cerró la toma! Otra vez. Primero el apagón en la plaza, ahora esto. Está saboteando SYNARA.'],
    ['dante', 'worried', 'Amaya... la alarma de turbidez sonó después. Mucho después.'],
    ['kiru', 'thinking', 'Registro interno: orden de cierre de LIMEN a las 14:46:02. Alarma visible de turbidez a las 14:46:16. {y}Catorce segundos antes.{/}'],
    ['amaya', 'skeptical', 'Entonces sabía lo que iba a pasar. Eso es peor. Significa que lo planeó.'],
    ['kiru', 'worried', 'O que vio algo que nosotros no medimos.'],
  ]);
  GS.addClue('earlyClose');
  sc.camRelease();
  // adversarios: Foulers alrededor del pretratamiento
  for (const [x, y] of [[1700, 240], [1780, 230], [1560, 250]]) S.foulers.push(sc.world.add(new Adversary({ type: 'fouler', x, y, range: 40, speed: 22 })));
  S.simStage = 'auto';
  GS.save('filters');
  sc.setObjective('Reabre la toma con seguridad en el Gemelo (El Filtro Ciego)', ['¿Qué cambió primero: caudal, turbidez o presión diferencial?', 'El sensor que anticipa la saturación es el ΔP del filtro.', 'Reduce el caudal y usa la reserva mientras el filtro se recupera.']);
  sc.kiru && sc.kiru.say('Esos Foulers oscurecen sensores. Corrígelos con {y}Q{/} cuando estés cerca.', 'alarmado', 5);
}
async function restScene(sc) {
  const S = sc.state;
  S.storm = 0; S.plume = 0.3; S.turb = 3.2; S.dp = 0.45;
  sc.musicOverride = null; Audio2.playMusic('coast');
  await sc.say([
    ['dante', 'tired', 'Bueno. El filtro sobrevivió. Yo casi no.'],
    ['amaya', 'thinking', 'Salvamos la toma... pero la ciudad ya dice en la radio que LIMEN nos robó el agua.'],
    ['kiru', 'worried', 'La radio no sabe lo de los catorce segundos.'],
    ['amaya', 'skeptical', 'Puede haber muchas explicaciones. Quizá tiene acceso a sensores que nosotros no.'],
    ['dante', 'smile', 'O quizá estaba protegiendo la toma. Un saboteador raro: uno que llega justo antes del desastre.'],
    ['amaya', 'determined', 'Necesito ver los registros de la planta de ósmosis. Si LIMEN aisló algo allí, quiero saber por qué.'],
  ]);
  S.restDone = true;
  Codex.unlock('p_limen'); Codex.unlock('p_dante'); Codex.unlock('p_marea');
  sc.world.find('solo').hidden = false;
  sc.world.find('exit').hidden = false;
  sc.setObjective('Abre la Puerta de Evidencia y luego sigue hacia la Planta OI', ['La Puerta de Evidencia está junto al edificio de pretratamiento.', 'Cada tarea SOLO usa los datos del contexto: revisa unidades.']);
}
async function finishLevel1(sc) {
  const S = sc.state;
  if (!S.restDone) { sc.kiru && sc.kiru.say('Todavía no reabrimos la toma con seguridad.', 'confundido'); return; }
  if (!S.soloDone) { const c = await sc.say([['kiru', 'curioso', 'La Puerta de Evidencia aún no registra tu razonamiento. ¿Seguimos de todas formas?', { choices: ['Volver a la Puerta de Evidencia', 'Seguir (se puede completar después desde el mapa)'] }]]); if (c === 0) return; }
  await completeLevel(sc);
  Game.transition(() => Game.setScene(WorldMapScene, { focus: 2 }));
}
/* ---------------- misiones secundarias ---------------- */
async function sideSensor(sc, st) {
  const lp = GS.lp(1);
  if (lp.side.sensor) { await sc.say([['kiru', 'happy', 'El sensor reubicado transmite: ' + fmt(sc.state.turb, 1) + ' ± 0,5 NTU.']]); return; }
  await sc.say([['amaya', 'surprised', 'Aquí está el sensor de turbidez... medio enterrado en la zona donde rompen las olas.'], ['kiru', 'thinking', 'Lee 2 NTU con incertidumbre de ± 6 NTU. Es como pesar harina con una balanza para camiones.']]);
  const c = await sc.say([['amaya', 'thinking', '¿Dónde lo reubicamos para que represente el agua que entra a la toma?', { choices: ['En la zona de rompiente, donde se ve más espuma', 'Junto a la boca de la toma, a su misma profundidad', 'Detrás de las rocas, donde el agua está más quieta y clara'] }]]);
  const ok = c === 1;
  LearningModel.record({ kind: 'challenge', id: 'side_sensor_bajo_arena', ra: 'RA-01', concepts: ['waterQuality', 'steamInquiry'], solo: 3, correct: ok, misconception: ok ? null : 'medir donde es cómodo en lugar de donde es representativo' });
  if (ok) { lp.side.sensor = true; Audio2.sfx('success'); GS.s.sensors++; st.done = true; st.label = 'Sensor reubicado'; await sc.say([['kiru', 'happy', 'Incertidumbre reducida a ± 0,5 NTU. Medir donde importa vale más que medir mucho.'], ['amaya', 'smile', 'Tía Marea tenía razón. Medir no elimina la necesidad de interpretar.']]); Codex.unlock('incertidumbre_med'); }
  else await sc.say([['kiru', 'confundido', 'Ese punto mide otra agua: la rompiente resuspende arena y las rocas protegen de la corriente. Queremos el agua que realmente entra a la toma. Probemos otra vez.']]);
}
async function sideScreens(sc) {
  const lp = GS.lp(1);
  if (lp.side.screens) { await sc.say([['crowd2', 'smile', 'Desde que bajaron la velocidad, las larvas ya no se quedan pegadas a la rejilla.', { who: 'narr' }]].map(l => ['narr', null, 'Pescador Rubén: "Desde que bajaron la velocidad en la rejilla, las larvas ya no se quedan pegadas."'])); return; }
  await sc.say([['narr', null, 'Pescador Rubén: "Esa rejilla de la toma canta de noche, como un zumbido. Y cuando chupa fuerte, las larvas de pargo se quedan pegadas. Ustedes hablan de agua; nosotros hablamos de la pesca del año que viene."']]);
  const c = await sc.say([['amaya', 'thinking', '¿Qué propones para la rejilla?', { choices: ['Rejillas finas y menor velocidad de aproximación (algo menos de caudal máximo)', 'Mantener el caudal máximo: el agua es la prioridad', 'Apagar la toma de noche sin analizar datos'] }]]);
  const ok = c === 0;
  LearningModel.record({ kind: 'challenge', id: 'side_rejilla_que_cantaba', ra: 'RA-01', concepts: ['pretreatment', 'ethics'], solo: 4, correct: ok, misconception: ok ? null : 'ignorar el impacto ecológico de la captación' });
  if (ok) { lp.side.screens = true; GS.trust('community', 10); GS.decide('fineScreens', true); Audio2.sfx('success'); await sc.say([['narr', null, 'Pescador Rubén: "Con eso podemos vivir. Gracias por preguntar antes de decidir."'], ['kiru', 'esperanzado', 'Confianza comunitaria +10. Velocidad de aproximación objetivo: menor a 0,15 m/s.']]); }
  else if (c === 1) { GS.trust('community', -5); await sc.say([['narr', null, 'Pescador Rubén: "El agua es para la gente. La gente también come pescado."'], ['kiru', 'culpable', 'Tal vez podamos proteger ambas cosas. La velocidad de aproximación es una variable de diseño.']]); }
  else await sc.say([['kiru', 'confundido', 'Apagar sin datos puede dejar sin agua a la planta cuando más se necesita. ¿Y si probamos el diseño de la rejilla?']]);
}

/* =====================================================================
   Dron de muestreo (instrumentación y datos)
   ===================================================================== */
function drawDrone(g, x, y, t, flying) {
  x = Math.round(x); y = Math.round(y);
  if (typeof PFFauna !== 'undefined' && !flying) { PFFauna.drawDroneAt(g, x, y, t, false); return; }
  const bob = flying ? Math.round(Math.sin(t * 6) * 1) : 0;
  frect(g, x - 6, y - 5 + bob, 12, 4, '#ff9f43'); frect(g, x - 6, y - 5 + bob, 12, 1, '#ffc06a'); frect(g, x - 4, y - 1 + bob, 8, 2, '#263442');
  fpx(g, x, y + 1 + bob, '#56e5ff');
  const sp = flying ? ((Math.floor(t * 30) % 2) ? 5 : 3) : 4;
  for (const s of [-1, 1]) { frect(g, x + s * 7 - (s < 0 ? 1 : 0), y - 7 + bob, 1, 3, '#6aa0b4'); frect(g, x + s * 7 - sp, y - 8 + bob, sp * 2, 1, flying ? '#cfe8ee' : '#98c6d2'); }
}
const DRONE_POINTS = [
  { id: 'A', x: 96, y: 196, name: 'Desembocadura del arroyo', depth: 3, tds: 33.2, turb: 26, T: 29.5, eco: 0.35, cost: 0.1, note: 'Pluma de sedimentos del arroyo.' },
  { id: 'B', x: 236, y: 178, name: 'Pradera marina', depth: 5, tds: 35.0, turb: 9, T: 28.6, eco: 0.8, cost: 0.2, note: 'Pradera de pastos marinos: zona de cría.' },
  { id: 'C', x: 334, y: 118, name: 'Toma actual (muelle)', depth: 8, tds: 35.4, turb: 6, T: 27.4, eco: 0.4, cost: 0.0, note: 'Boca de la toma existente.' },
  { id: 'D', x: 450, y: 136, name: 'Borde del arrecife', depth: 6, tds: 35.6, turb: 1.5, T: 27.8, eco: 0.95, cost: 0.4, note: 'Arrecife somero: larvas de peces y corales.' },
  { id: 'E', x: 540, y: 58, name: 'Fondo mar adentro', depth: 14, tds: 35.8, turb: 1.2, T: 25.6, eco: 0.15, cost: 0.6, note: 'Agua profunda, fría y estable; tubería más larga.' },
];
const DroneScene = {
  overlay: false, touchControls: true,
  enter(p) {
    this.onDone = p.onDone; this.t = 0; this.x = 330; this.y = 270; this.vx = 0; this.vy = 0; this.bat = 1; this.samples = {}; this.sampling = null;
    this.phase = 'fly'; this.demoDone = false; this.msg = null; this.choice = null; this.rng = RNG(77);
    this.map = this.buildMap(); this.ps = new Particles(400);
    this.say('Demostración: vuela hasta la boya {y}C{/} (la toma actual) y mantente encima con {y}E{/} para muestrear. Yo explico la primera lectura.');
    Audio2.sfx('power');
  },
  say(t) { this.msg = { text: t, t: 0 }; Audio2.sfx('voice', { voice: 'kiru' }); },
  buildMap() {
    const pb = new PixelBuffer(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const depth = clamp(1 - y / 300 + fbm(x * 0.01, y * 0.01, 3, 4) * 0.25, 0, 1);
      let c = rampDither(['#20d6c7', '#16a6cf', '#1283bf', '#1063a6', '#0f4888', '#0d3168'], depth, x, y);
      pb.data[y * W + x] = U(c);
    }
    // arrecife y pradera
    for (let i = 0; i < 260; i++) { const x = 400 + Math.cos(i * 1.7) * 60 * Math.sqrt((i % 37) / 37), y = 150 + Math.sin(i * 2.3) * 24 * Math.sqrt((i % 23) / 23); pb.disc(x, y, 2.2, ['#ff8ab8', '#ffb93b', '#c2f58e', '#e05aa0'][i % 4]); }
    for (let i = 0; i < 200; i++) { const x = 190 + (i * 37 % 110), y = 168 + (i * 13 % 40); pb.vline(x, y, y + 4, i % 2 ? '#33a552' : '#1f854c'); }
    // playa y muelle
    for (let y = 286; y < H; y++) for (let x = 0; x < W; x++) pb.set(x, y, rampDither(RAMP.sand, 0.55 + (y - 286) / 140, x, y));
    for (let x = 0; x < W; x++) { pb.set(x, 285 + Math.round(Math.sin(x * 0.08) * 1.5), '#fff6d8'); pb.set(x, 284 + Math.round(Math.sin(x * 0.08) * 1.5), '#c6fff2'); }
    pb.rect(328, 120, 12, 166, '#8a5a3c'); pb.rect(328, 120, 12, 2, '#c8925e'); for (let y = 122; y < 286; y += 6) pb.hline(328, 339, y, '#6e452e');
    pb.rect(312, 280, 44, 10, '#e8f0f4'); pb.rect(312, 280, 44, 2, '#20d6c7');
    // arroyo seco y pluma de sedimentos
    for (let i = 0; i < 40; i++) pb.rect(20 + i * 2, 286 + i * 0.4, 6, 3, '#c97c38');
    return pb.toCanvas();
  },
  reading(P) {
    // la lectura incluye incertidumbre y el pulso que avanza desde el noroeste
    const pulse = clamp(this.t / 90, 0, 1) * (P.x < 260 ? 1 : 0.4);
    const u = this.samples._upg ? 0.5 : 1;
    return { tds: P.tds + (this.rng() - 0.5) * 0.3, tdsU: 0.2 * u, turb: P.turb * (1 + pulse * 0.6) + (this.rng() - 0.5) * 1, turbU: Math.max(0.5, P.turb * 0.15) * u, T: P.T + (this.rng() - 0.5) * 0.2, TU: 0.2 };
  },
  update(dt) {
    this.t += dt; if (this.msg) this.msg.t += dt; this.ps.update(dt);
    if (this.phase === 'fly') {
      const ax = (Input.down('right') ? 1 : 0) - (Input.down('left') ? 1 : 0), ay = (Input.down('down') ? 1 : 0) - (Input.down('up') ? 1 : 0);
      this.vx = approach(this.vx, ax * 90, 260 * dt); this.vy = approach(this.vy, ay * 90, 260 * dt);
      this.x = clamp(this.x + this.vx * dt, 10, W - 10); this.y = clamp(this.y + this.vy * dt, 16, H - 30);
      this.bat = Math.max(0, this.bat - dt * (0.006 + (Math.abs(this.vx) + Math.abs(this.vy)) * 0.00005));
      if (Math.random() < 0.3) this.ps.emit('splash', this.x + (Math.random() - 0.5) * 10, this.y + 12, 0, -20, 1);
      const near = DRONE_POINTS.find(P => dist(P.x, P.y, this.x, this.y) < 14);
      if (near && (Input.down('interact') || Input.down('jump') || (Input.pointer.down && dist(Input.pointer.x, Input.pointer.y, near.x, near.y) < 20))) {
        if (!this.sampling || this.sampling.P !== near) this.sampling = { P: near, k: 0 };
        this.sampling.k += dt / 1.4;
        if (this.sampling.k >= 1 && !this.samples[near.id]) {
          this.samples[near.id] = this.reading(near); Audio2.sfx('sample'); this.ps.emit('drop', near.x, near.y, 0, -60, 10, 3);
          LearningModel.note('sample');
          if (!this.demoDone && near.id === 'C') {
            this.demoDone = true;
            const r = this.samples.C;
            this.say('Lectura C: turbidez ' + fmt(r.turb, 1) + ' ± ' + fmt(r.turbU, 1) + ' NTU, TDS ' + fmt(r.tds, 1) + ' g/L, ' + fmt(r.T, 1) + ' °C. Observa el {y}±{/}: dos puntos solo son distintos si la diferencia supera la incertidumbre. Ahora tú: muestrea al menos 3 puntos más.');
          } else if (Object.keys(this.samples).filter(k => k !== '_upg').length >= 4 && this.demoDone) this.say('Datos suficientes. Cuando quieras, pulsa {y}Decidir{/} para elegir el mejor punto de captación.');
        }
      } else if (!near) this.sampling = null;
      if (this.bat <= 0.02) { this.bat = 0.02; this.say('Batería del dron baja: la energía también limita las mediciones. Decide con los datos que tienes.'); }
    }
  },
  render(g) {
    g.drawImage(this.map, 0, 0);
    // pluma del arroyo que crece con el tiempo (pulso)
    const k = clamp(this.t / 90, 0, 1);
    for (let i = 0; i < 6; i++) fshadow(g, 70 + i * 22 + k * 40, 250 - i * 18 - k * 30, 34 + i * 6 + k * 20, 16 + i * 3, '#a07a3a', 0.35 + 0.1 * k);
    // oleaje
    drawWaveBands(g, 0, 10, W, 260, Game.time, 'rgba(255,255,255,0.18)', 9);
    drawSeaSparkles(g, 0, 0, W, 280, Game.time, 0.8);
    // boyas
    for (const P of DRONE_POINTS) {
      const s = this.samples[P.id];
      fdisc(g, P.x, P.y + 2, 6, 'rgba(10,20,40,0.4)');
      fdisc(g, P.x, P.y, 5, s ? '#86e36f' : '#ff6b6b'); fdisc(g, P.x - 1, P.y - 1, 2, '#ffffff');
      frect(g, P.x - 1, P.y - 12, 2, 7, '#fffaf0'); frect(g, P.x, P.y - 12, 5, 3, s ? '#86e36f' : '#ffe14d');
      drawText(g, P.id, P.x + 8, P.y - 6, { color: '#fffaf0', shadow: '#0a1f4a' });
      if (s) drawText(g, fmt(s.turb, 1) + '±' + fmt(s.turbU, 1) + ' NTU', P.x + 8, P.y + 4, { font: 'tiny', color: '#fff6d8', shadow: '#0a1f4a' });
    }
    this.ps.render(g);
    // sombra y dron
    fshadow(g, this.x, this.y + 14, 7, 2, '#05031a', 0.5);
    drawDrone(g, this.x, this.y, Game.time, true);
    if (this.sampling) { const kk = clamp(this.sampling.k, 0, 1); UIK.bar(g, this.x - 14, this.y + 6, 28, 4, kk, '#56e5ff'); for (let i = 0; i < 10; i++) fpx(g, this.x, this.y + 4 + i * 1.2, '#a6f4ff'); }
    // panel
    UIK.panel(g, W - 214, 6, 208, 168, 'glass');
    drawText(g, 'DRON DE MUESTREO', W - 206, 11, { color: '#ffe14d', font: 'tiny' });
    UIK.bar(g, W - 206, 20, 120, 6, this.bat, this.bat < 0.25 ? '#ff4e5d' : '#86e36f', '#0a0c22', 10);
    drawText(g, 'BATERÍA ' + fmt0(this.bat * 100) + '%', W - 80, 20, { font: 'tiny', color: '#cfd6f0' });
    const T = { head: ['PUNTO', 'NTU', 'TDS G/L', 'T °C'], rows: [] };
    for (const P of DRONE_POINTS) { const s = this.samples[P.id]; T.rows.push([P.id + ' ' + P.depth + 'M', s ? fmt(s.turb, 1) + '±' + fmt(s.turbU, 0) : '—', s ? fmt(s.tds, 1) : '—', s ? fmt(s.T, 1) : '—']); }
    T.widths = [0.28, 0.28, 0.24, 0.2];
    // tabla en estilo oscuro
    let yy = 32;
    T.head.forEach((h, i) => drawText(g, h, W - 206 + [0, 54, 108, 152][i], yy, { font: 'tiny', color: '#ffe14d' }));
    yy += 9;
    T.rows.forEach((r, ri) => { r.forEach((v, i) => drawText(g, v, W - 206 + [0, 54, 108, 152][i], yy, { font: 'tiny', color: '#fffaf0' })); yy += 9; });
    const P = DRONE_POINTS.find(PP => dist(PP.x, PP.y, this.x, this.y) < 30);
    if (P) drawTextBlock(g, '{c}' + P.id + ':{/} ' + P.name + '. ' + P.note, W - 206, yy + 4, 196, { color: '#cfd6f0' });
    Gui.begin();
    const n = Object.keys(this.samples).length;
    if (this.phase === 'fly' && n >= 4 && this.demoDone) { if (Gui.button(g, 'decide', W - 160, 150, 150, 18, 'Decidir punto de toma', { style: 'gold', icon: 'target' })) { this.phase = 'decide'; } }
    if (this.phase === 'decide') this.renderDecide(g);
    if (this.phase === 'result') this.renderResult(g);
    Gui.end();
    if (this.msg && this.phase === 'fly') {
      const lines = wrapText(this.msg.text, 380);
      const hh = lines.length * 11 + 10;
      UIK.panel(g, 6, H - hh - 6, 400, hh, 'glass'); Icons.draw(g, 'kiru', 10, H - hh - 2);
      let rem = Math.floor(this.msg.t * 60);
      lines.forEach((l, i) => { if (rem > 0) drawText(g, l, 28, H - hh - 1 + i * 11, { color: '#fffaf0', max: rem }); rem -= stripMarkup(l).length + 1; });
    }
    drawText(g, 'Flechas/WASD: volar · E: muestrear (mantener)', 8, 8, { font: 'tiny', color: '#fffaf0', shadow: '#0a1f4a' });
  },
  renderDecide(g) {
    fdither(g, 0, 0, W, H, '#05030f', 0.6);
    UIK.panel(g, 60, 40, W - 120, H - 80, 'tech');
    UIK.header(g, 60, 40, W - 120, 'DECIDIR PUNTO DE CAPTACIÓN', 'tech', 'target');
    drawTextBlock(g, 'Elige el punto donde convendría captar (o reubicar la toma) considerando calidad del agua, riesgo ecológico y costo. Tus mediciones incluyen incertidumbre.', 72, 64, W - 144, { color: '#fffaf0' });
    let y = 98;
    DRONE_POINTS.forEach((P, i) => {
      const s = this.samples[P.id];
      const label = P.id + ' · ' + P.name + ' (' + P.depth + ' m) — ' + (s ? 'turb. ' + fmt(s.turb, 1) + '±' + fmt(s.turbU, 1) + ' NTU, ' + fmt(s.T, 1) + ' °C' : 'sin muestra');
      const r = Gui.choice(g, 'dp' + P.id, 72, y, W - 144, label, P.id, { state: this.choice === i ? 'selected' : null });
      if (r.clicked) this.choice = i;
      y += r.h + 2;
    });
    if (Gui.button(g, 'conf', W / 2 - 60, H - 64, 120, 20, 'Confirmar', { style: 'good', disabled: this.choice == null })) {
      const P = DRONE_POINTS[this.choice];
      const ok = P.id === 'E' || (P.id === 'C' && this.samples.E == null);
      const acceptable = P.id === 'C';
      LearningModel.record({ kind: 'challenge', id: 'lv1_drone_point', ra: 'RA-01', concepts: ['waterQuality', 'pretreatment', 'steamInquiry'], solo: 4, correct: P.id === 'E', misconception: P.id === 'D' ? 'agua clara = sin impacto ecológico' : P.id === 'A' ? 'ignorar fuentes de sedimentos' : P.id === 'B' ? 'ignorar zonas de cría' : null });
      GS.lp(1).feedback = true;
      this.res = { P, ok: P.id === 'E', acceptable };
      this.phase = 'result'; Audio2.sfx(P.id === 'E' ? 'success' : acceptable ? 'confirm' : 'error');
    }
  },
  renderResult(g) {
    const r = this.res;
    fdither(g, 0, 0, W, H, '#05030f', 0.6);
    UIK.panel(g, 80, 70, W - 160, 200, r.ok ? 'green' : r.acceptable ? 'tech' : 'alert');
    const txt = {
      E: '{g}Punto E: agua profunda, fría y de baja turbidez, lejos del arrecife y la pradera.{/} Su desventaja es real: tubería más larga y más costo de bombeo. Es la opción más robusta para la calidad y el ecosistema; el costo debe discutirse, no ocultarse.',
      C: '{y}Punto C: la toma actual.{/} Es la más barata, pero su turbidez sube con los pulsos del noroeste. Puede funcionar con rejillas finas, menor velocidad y pretratamiento adaptativo. Compárala con E: ¿qué ganas y qué pagas?',
      D: '{o}Punto D: el agua es clara, pero está junto al arrecife:{/} captar allí arrastraría larvas y alteraría la zona de cría. Agua clara no significa ausencia de impacto.',
      A: '{o}Punto A: desembocadura del arroyo.{/} La pluma de sedimentos y la salinidad variable harían colapsar el pretratamiento en cada lluvia.',
      B: '{o}Punto B: pradera marina.{/} Es zona de cría; además el sedimento fino se resuspende con el oleaje.',
    }[r.P.id];
    drawTextBlock(g, txt, 92, 84, W - 184, { color: '#fffaf0' });
    if (Gui.button(g, 'fin', W / 2 - 60, 240, 120, 20, 'Continuar', { style: 'good' })) { Game.pop(); this.onDone && this.onDone({ choice: r.P.id, ok: r.ok }); }
  },
};
DroneScene.overlay = true;

/* =====================================================================
   Gemelo de la toma — simulador de captación y pretratamiento
   ===================================================================== */
const Sim01 = makeSim({
  title: 'GEMELO DE LA TOMA · captación y pretratamiento', icon: 'filter', ra: 'RA-01', concepts: ['pretreatment', 'waterQuality'],
  phases: ['demo', 'guided', 'auto', 'transfer', 'free'],
  hintLadder: ['¿Qué cambió primero: el caudal, la turbidez o la presión diferencial del filtro?', 'El ΔP del filtro anticipa la saturación: sube antes de que la turbidez de salida se dispare.', 'Reduce el caudal de toma, sube la coagulación, lava el filtro a tiempo y cubre la demanda con la reserva.'],
  init(p) {
    this.cfg = { q: 100, depth: p.point === 'E' ? 14 : 8, screens: !!GS.s.decisions.fineScreens, coag: 0.4, storage: true };
    this.stopAfter = p.stopAfter || 'free';
    this.marea = !!p.marea;
    this.reset();
  },
  reset() {
    this.h = 0; this.dp = 0.35; this.tank = 0.7; this.series = []; this.produced = 0; this.treatableH = 0; this.ecoAcc = 0; this.errors = 0; this.backwashT = 0; this.running = false; this.done = false; this.verdict = null;
    this.scn = this.scenario(this.phase);
  },
  scenario(ph) {
    if (ph === 'auto' || ph === 'free') return { hours: 12, base: 3, pulseAt: 3.5, pulseW: 4, pulseAmp: 45, demand: 70, T: 27, sdiAdd: 0, live: true };
    if (ph === 'transfer') return { hours: 24, base: 4, pulseAt: 6, pulseW: 12, pulseAmp: 14, demand: 70, T: 31, sdiAdd: 2.5, live: false, algae: true };
    return { hours: 6, base: 3, pulseAt: 99, pulseW: 1, pulseAmp: 0, demand: 70, T: 27, sdiAdd: 0, live: true };
  },
  turbAt(h) { const s = this.scn; const k = Math.exp(-Math.pow((h - s.pulseAt) / (s.pulseW / 2), 2)); return s.base + s.pulseAmp * k; },
  onPhase(ph) {
    this.reset();
    if (ph === 'demo') { this.say('Demostración: observa qué ocurre si capto {y}140 m³/h{/} desde 8 m sin rejillas. Mira el ΔP del filtro y el riesgo ecológico.'); this.cfg.q = 140; this.cfg.screens = false; this.running = true; }
    if (ph === 'guided') { this.cfg.q = 100; this.say('Tu turno (día normal, 6 h): consigue turbidez de salida < 1 NTU, riesgo ecológico bajo (< 0,4) y al menos 85 m³/h hacia la planta. Pulsa {y}Probar 6 h{/}.'); }
    if (ph === 'auto') this.say(this.marea ? 'El Filtro Ciego: llega el pulso de turbidez. Tía Marea estima que llegará en 3–4 h. Opera en vivo; no habrá pistas automáticas.' : 'El Filtro Ciego: llega el pulso de turbidez (llegada incierta: 2–5 h). Opera en vivo; no habrá pistas automáticas.');
    if (ph === 'transfer') this.say('Transferencia: temporada de floración algal (31 °C, materia orgánica, pulso largo). Diseña el protocolo ANTES de correr 24 h: no podrás ajustar durante la simulación.');
    if (ph === 'free') this.say('Laboratorio libre: experimenta con cualquier combinación.');
  },
  step(dt) {
    if (!this.running || this.done) return;
    const dh = dt * (this.phase === 'demo' ? 0.6 : this.phase === 'guided' ? 1.2 : this.phase === 'transfer' ? 2.4 : 0.55) * (Input.down('fast') ? 3 : 1);
    const s = this.scn;
    const turbIn = this.turbAt(this.h);
    const backwash = this.backwashT > 0;
    if (backwash) this.backwashT -= dh;
    const r = IntakeModel.step({ Qtoma: backwash ? this.cfg.q * 0.6 : this.cfg.q, depth: this.cfg.depth, screens: this.cfg.screens, coag: this.cfg.coag, turbIn, filterDP: this.dp, cap: 130, dt: dh, backwash });
    if (s.algae) r.turbOut += (this.cfg.depth < 6 ? 1.2 : 0.3) * (1 - this.cfg.coag * 0.6);
    this.dp = r.filterDP;
    // auto-lavado programado en transferencia (protocolo)
    if (this.phase === 'transfer' && this.cfg.autoBW && this.dp > 0.9 && this.backwashT <= 0) this.backwashT = 0.6;
    const toRO = r.treatable || this.cfg.storage === false ? Math.min(r.Qtoma, 120) : 0;
    const tankIn = r.treatable ? toRO : 0;
    this.tank = clamp(this.tank + (tankIn - s.demand) * dh / 900, 0, 1);
    this.produced += tankIn * dh;
    if (r.treatable) this.treatableH += dh;
    this.ecoAcc += r.ecoRisk * dh;
    this.last = r;
    this.h += dh;
    if (this.series.length === 0 || this.h - this.series[this.series.length - 1].h > 0.1) this.series.push({ h: this.h, tin: turbIn, tout: r.turbOut, dp: this.dp, tank: this.tank, eco: r.ecoRisk });
    // errores seguros
    if (r.overload > 0.05 && this.phase !== 'demo') { this.errors++; this.safeError('Sobrecarga', 'El caudal supera la capacidad de diseño del pretratamiento: el agua sale turbia hacia las membranas y el filtro se satura.', '¿Qué variable puedes reducir sin cerrar por completo la planta?'); this.onSafeRetry = () => { this.cfg.q = Math.min(this.cfg.q, 125); }; }
    else if (this.dp > 1.45 && this.phase !== 'demo') { this.errors++; this.safeError('Filtro colapsado', 'La presión diferencial superó 1,45 bar: el medio filtrante se compacta y deja pasar sólidos.', '¿Cuál fue el primer indicador que subió? ¿Qué acción lo reduce?'); this.onSafeRetry = () => { this.dp = 1.1; this.backwashT = 0.6; }; }
    else if (this.tank <= 0.02 && this.phase !== 'demo') { this.errors++; this.safeError('Reserva agotada', 'El tanque se vació: los hogares se quedarían sin agua mientras la toma se recupera.', '¿Cuándo convenía usar la reserva y cuándo recuperarla?'); this.onSafeRetry = () => { this.tank = 0.15; }; }
    // partículas visuales
    if (Math.random() < turbIn / 40) this.ps.emit('dust', 30 + Math.random() * 80, 120 + Math.random() * 60, 20, 0, 1);
    if (this.h >= s.hours) this.evaluate();
  },
  evaluate() {
    this.running = false; this.done = true;
    const s = this.scn;
    const frac = this.treatableH / s.hours, eco = this.ecoAcc / s.hours;
    let ok, txt;
    if (this.phase === 'demo') { ok = true; txt = 'Con 140 m³/h sin rejillas, el ΔP sube rápido y el riesgo ecológico es alto: captar más no significa producir mejor.'; }
    else if (this.phase === 'guided') {
      const q = this.last ? this.last.Qtoma : 0;
      ok = this.last && this.last.turbOut < 1 && eco < 0.4 && q >= 85;
      txt = ok ? 'Configuración estable: calidad dentro de diseño, bajo riesgo ecológico y producción suficiente.' : (eco >= 0.4 ? 'El riesgo ecológico sigue alto: revisa rejillas, profundidad y velocidad de aproximación.' : q < 85 ? 'La planta recibe muy poca agua: el caudal es insuficiente para la demanda.' : 'La turbidez de salida supera 1 NTU: revisa coagulación y profundidad de captación.');
      this.evidence('lv1_guided_intake', ok, { solo: 3 });
    } else if (this.phase === 'auto') {
      ok = frac >= 0.8 && this.tank > 0.15 && eco < 0.5 && this.errors === 0;
      txt = ok ? '¡El Filtro Ciego vencido! Mantuviste agua tratable el ' + fmt0(frac * 100) + ' % del tiempo sin colapsar el filtro.' : 'Agua tratable el ' + fmt0(frac * 100) + ' % del tiempo, errores seguros: ' + this.errors + '. Objetivo: ≥ 80 %, reserva > 15 % y sin errores.';
      this.evidence('lv1_guardian_filtro_ciego', ok, { solo: 4 });
    } else if (this.phase === 'transfer') {
      ok = frac >= 0.75 && eco < 0.45 && this.errors === 0;
      txt = ok ? 'Tu protocolo funciona en otra estación: captación profunda, coagulación alta y lavado programado ante algas.' : 'El protocolo no resistió la floración algal. ¿Captas cerca de la superficie, donde están las algas? ¿Programaste lavados?';
      this.evidence('lv1_transfer_protocol', ok, { solo: 5, transfer: true });
    } else { ok = true; txt = 'Laboratorio libre: los datos quedan en tu cuaderno.'; }
    this.verdict = { ok, txt };
    Audio2.sfx(ok ? 'success' : 'error');
  },
  draw(g) {
    const c = this.cfg, r = this.last || IntakeModel.step({ Qtoma: c.q, depth: c.depth, screens: c.screens, coag: c.coag, turbIn: this.turbAt(this.h), filterDP: this.dp, cap: 130, dt: 0 });
    const turbIn = this.turbAt(this.h);
    // --- esquema pixel (izquierda)
    const X0 = 8, Y0 = 30, WW = 372, HH = 262;
    Charts.frame(g, X0, Y0, WW, HH, '#0a1838');
    // mar en corte
    for (let y = Y0 + 30; y < Y0 + HH - 30; y++) { const k = (y - Y0 - 30) / (HH - 60); frect(g, X0 + 1, y, 150, 1, rampDither(['#20d6c7', '#16a6cf', '#1283bf', '#1063a6', '#0d3168'], k, X0, y)); }
    fdither(g, X0 + 1, Y0 + 30, 150, HH - 60, '#a07a3a', clamp(turbIn / 60, 0, 0.7));
    if (this.scn.algae) for (let i = 0; i < 40; i++) fpx(g, X0 + 4 + (i * 37) % 146, Y0 + 32 + (i * 7) % 18, '#86e36f');
    for (let x = X0 + 1; x < X0 + 151; x++) fpx(g, x, Y0 + 30 + Math.round(Math.sin(x * 0.2 + Game.time * 3)), '#c6fff2');
    frect(g, X0 + 1, Y0 + HH - 30, 150, 29, '#c97c38'); fdither(g, X0 + 1, Y0 + HH - 30, 150, 29, '#e49c44', 0.5);
    drawText(g, 'MAR', X0 + 6, Y0 + 34, { font: 'tiny', color: '#e6fdff' });
    // cabezal de toma a la profundidad elegida
    const hy = Y0 + 30 + (c.depth / 15) * (HH - 70);
    frect(g, X0 + 120, Y0 + 26, 6, hy - Y0 - 26, '#6aa0b4');
    frect(g, X0 + 112, hy - 6, 22, 12, '#345a78'); for (let k = 0; k < 6; k++) frect(g, X0 + 114 + k * 3, hy - 5, 1, 10, c.screens ? '#cfe8ee' : '#477a94');
    drawText(g, fmt0(c.depth) + ' m', X0 + 96, hy - 3, { font: 'tiny', color: '#fffaf0' });
    // peces cerca (riesgo ecológico)
    for (let i = 0; i < 6; i++) {
      const pull = r.ecoRisk;
      const fx = X0 + 30 + ((Game.time * 12 + i * 23) % 80) + pull * 30 * Math.sin(Game.time + i), fy = hy - 20 + i * 7;
      frect(g, Math.round(fx), Math.round(fy), 4, 2, pull > 0.5 && i < 3 ? '#ff4e5d' : '#ffb93b'); fpx(g, Math.round(fx) - 1, Math.round(fy), '#ffe0a0');
    }
    // tubería → cribado → coagulación → filtro → tanque → OI
    const pY = Y0 + 34;
    Charts.flow(g, [[X0 + 123, Y0 + 26], [X0 + 123, pY - 10], [X0 + 170, pY - 10]], 'seawater', c.q / 100, 3);
    // coagulación
    frect(g, X0 + 172, pY - 22, 50, 40, '#1d2a48'); frect(g, X0 + 174, pY - 14, 46, 30, '#1283bf'); fdither(g, X0 + 174, pY - 14, 46, 30, '#a07a3a', clamp(turbIn / 50, 0, 0.6));
    for (let i = 0; i < 12; i++) { const fx = X0 + 176 + (i * 13 + Game.time * 8) % 42, fy = pY - 10 + (i * 7) % 24; fdisc(g, fx, fy, 1 + c.coag * 1.5, '#c8a860'); }
    drawText(g, 'COAGULACIÓN', X0 + 197, pY - 30, { font: 'tiny', color: '#cfd6f0', align: 'center' });
    Charts.flow(g, [[X0 + 222, pY], [X0 + 240, pY]], 'seawater', c.q / 100, 3);
    // filtro con capas que se ensucian
    const fx0 = X0 + 242, fy0 = pY - 26, fw = 44, fh = 120;
    frect(g, fx0, fy0, fw, fh, '#477a94'); frect(g, fx0 + 3, fy0 + 3, fw - 6, fh - 6, '#0a1838');
    frect(g, fx0 + 3, fy0 + 40, fw - 6, 26, '#2a2a3a'); frect(g, fx0 + 3, fy0 + 66, fw - 6, 40, '#e4c088');
    for (let i = 0; i < 40; i++) fpx(g, fx0 + 4 + (i * 7) % (fw - 8), fy0 + 67 + (i * 11) % 38, '#c49860');
    const dirt = clamp((this.dp - 0.3) / 1.2, 0, 1);
    fdither(g, fx0 + 3, fy0 + 40, fw - 6, Math.round(26 + 40 * dirt), '#5a3a1a', 0.3 + dirt * 0.5);
    if (this.backwashT > 0) for (let i = 0; i < 8; i++) fpx(g, fx0 + 6 + Math.random() * (fw - 12), fy0 + 10 + Math.random() * 30, '#c6fff2');
    drawText(g, 'FILTRO', fx0 + fw / 2, fy0 - 8, { font: 'tiny', color: '#cfd6f0', align: 'center' });
    Charts.gauge(g, fx0 + fw / 2, fy0 + fh + 22, 13, clamp(this.dp / 1.6, 0, 1), '#56e5ff', 'ΔP', fmt(this.dp, 2));
    Charts.flow(g, [[fx0 + fw, fy0 + fh - 10], [X0 + 310, fy0 + fh - 10]], r.treatable ? 'permeate' : 'brine', r.treatable ? 1 : 0.3, 3);
    // tanque de reserva
    Charts.tank(g, X0 + 312, Y0 + 70, 34, 120, this.tank, RAMP.sea, 'RESERVA', { reserve: 0.15 });
    drawText(g, fmt0(this.tank * 100) + '%', X0 + 329, Y0 + 60, { font: 'tiny', color: '#fffaf0', align: 'center' });
    drawText(g, '→ OI', X0 + 330, Y0 + HH - 18, { font: 'tiny', color: '#a6f4ff', align: 'center' });
    drawText(g, 'SALIDA ' + fmt(r.turbOut, 2) + ' NTU', X0 + 300, Y0 + 40, { font: 'tiny', color: r.turbOut < 1 ? '#86e36f' : r.turbOut < 2 ? '#ffe14d' : '#ff4e5d', align: 'right' });
    if (r.overload > 0.05) drawText(g, '¡SOBRECARGA!', X0 + 200, Y0 + HH - 14, { color: '#ff4e5d', align: 'center' });
    // --- controles (derecha)
    const CX = 388, CW = W - CX - 8;
    UIK.panel(g, CX, 30, CW, 168, 'tech');
    Gui.begin();
    const locked = this.phase === 'demo' || (this.phase === 'transfer' && this.running);
    const yy = 36;
    c.q = Gui.slider(g, 'q', CX + 8, yy, CW - 16, c.q, 40, 160, 5, { label: 'Caudal de toma', unit: 'm³/h', disabled: locked, marks: [{ v: 130, col: '#ff4e5d' }], tip: 'Capacidad de diseño del pretratamiento: 130 m³/h' });
    c.depth = Gui.slider(g, 'd', CX + 8, yy + 24, CW - 16, c.depth, 2, 14, 1, { label: 'Profundidad de la toma', unit: 'm', disabled: locked || this.phase === 'auto' });
    c.coag = Gui.slider(g, 'c', CX + 8, yy + 48, CW - 16, c.coag, 0, 1, 0.1, { label: 'Coagulación (abstracta)', fmt: v => v < 0.34 ? 'baja' : v < 0.67 ? 'media' : 'alta', disabled: locked, color: '#c8a860' });
    const sc = Gui.toggle(g, 'scr', CX + 8, yy + 74, 'Rejillas finas', c.screens); if (!locked) c.screens = sc;
    if (this.phase === 'transfer') { const ab = Gui.toggle(g, 'abw', CX + 120, yy + 74, 'Lavado automático', !!c.autoBW); if (!locked) c.autoBW = ab; }
    else if (Gui.button(g, 'bw', CX + 120, yy + 72, CW - 128, 16, this.backwashT > 0 ? 'Lavando…' : 'Lavar filtro', { icon: 'reset', style: 'ghost', disabled: locked || this.backwashT > 0 || !this.running })) { this.backwashT = 0.6; Audio2.sfx('valve'); }
    // indicadores
    const ix = CX + 8, iy = yy + 96;
    drawText(g, 'Velocidad de aproximación: ' + fmt(r.approachV, 3) + ' m/s', ix, iy, { font: 'tiny', color: r.approachV > 0.15 ? '#ff9f43' : '#86e36f' });
    drawText(g, 'Riesgo ecológico: ' + fmt(r.ecoRisk, 2) + '   SDI: ' + fmt(r.sdi, 1), ix, iy + 9, { font: 'tiny', color: r.ecoRisk > 0.4 ? '#ff9f43' : '#86e36f' });
    drawText(g, 'Hora ' + fmt(this.h, 1) + ' / ' + this.scn.hours + ' h   Agua a planta: ' + fmt0(this.produced) + ' m³', ix, iy + 18, { font: 'tiny', color: '#cfd6f0' });
    drawText(g, 'Tratable: ' + (r.treatable ? 'SÍ' : 'NO') + '   Turbidez entrada: ' + fmt(turbIn, 1) + ' NTU', ix, iy + 27, { font: 'tiny', color: r.treatable ? '#86e36f' : '#ff4e5d' });
    // botones de control de corrida
    const by = 176;
    if (this.phase === 'guided' && !this.running && !this.done) { if (Gui.button(g, 'run', CX + 8, by, 110, 18, 'Probar 6 h', { style: 'good', icon: 'play' })) { this.reset(); this.running = true; } }
    if ((this.phase === 'auto' || this.phase === 'free') && !this.running && !this.done) { if (Gui.button(g, 'run', CX + 8, by, 110, 18, 'Iniciar', { style: 'good', icon: 'play' })) { this.running = true; } }
    if (this.phase === 'transfer' && !this.running && !this.done) { if (Gui.button(g, 'run', CX + 8, by, 130, 18, 'Correr 24 h', { style: 'good', icon: 'play' })) { this.running = true; } }
    if (this.running && this.phase !== 'transfer' && Gui.button(g, 'pause', CX + 8, by, 80, 18, this.paused ? 'Seguir' : 'Pausa', { style: 'ghost', icon: this.paused ? 'play' : 'pause' })) this.paused = !this.paused;
    if (Gui.button(g, 'hintb', CX + CW - 64, by, 56, 18, 'Pista', { style: 'ghost', icon: 'hint', disabled: this.phase === 'auto' })) this.hint();
    // gráfico temporal
    const S = this.series;
    const band = this.phase === 'auto' ? { x0: this.marea ? 3 : 2, x1: this.marea ? 4 : 5, color: '#ffb93b', level: 0.18 } : null;
    Charts.line(g, CX, 202, CW, 92, [
      { data: S.map(s => [s.h, s.tin]), color: '#c8a860', label: 'entrada' },
      { data: S.map(s => [s.h, s.tout * 10]), color: '#56e5ff', label: 'salida×10' },
      { data: S.map(s => [s.h, s.dp * 20]), color: '#ff6b6b', label: 'ΔP×20' },
    ].map(sr => sr.data.length ? sr : Object.assign(sr, { data: [[0, 0]] })), { xMin: 0, xMax: this.scn.hours, yMin: 0, yMax: 60, legend: true, xLabel: 'h', yLabel: 'NTU', bands: band ? [band] : [], hlines: [{ v: 24, color: '#ff4e5d', label: 'ΔP límite' }], cursor: this.h });
    // veredicto
    if (this.verdict) {
      const v = this.verdict;
      const vh = textHeight(v.txt, 340) + 34;
      UIK.panel(g, 20, H - vh - 10, 360, vh, v.ok ? 'green' : 'alert');
      drawTextBlock(g, v.txt, 28, H - vh - 4, 344, { color: '#fffaf0' });
      if (v.ok) { if (Gui.button(g, 'nxt', 270, H - 30, 100, 16, this.phase === this.stopAfter ? 'Terminar' : 'Continuar', { style: 'good', icon: 'play' })) { if (this.phase === this.stopAfter) this.finish(true); else this.nextPhase(); } }
      else if (Gui.button(g, 'rt', 270, H - 30, 100, 16, 'Reintentar', { style: 'gold', icon: 'reset' })) { this.attempts++; GS.s.stats.retries++; this.onPhase(this.phase); }
    }
    if (this.phase === 'demo' && !this.done && this.h > 4) this.evaluate();
    Gui.end();
    if (!this.verdict && !this.msg) { }
  },
});

/* =====================================================================
   Piezas de escenografía propias del Nivel 01 (kit PF, prerender)
   ===================================================================== */
/** Montón de cantos rodados en domo (cara iluminada arriba-izquierda) */
function rockPile(pb, x, y, w, h, seed) {
  const RW = PFK.P32(RAMP.rockWarmR);
  for (let yy = Math.round(y - h); yy <= y; yy++) for (let xx = Math.round(x - w / 2); xx <= x + w / 2; xx++) {
    const nx = (xx - x) / (w / 2), ny = (yy - y) / h;
    if (nx * nx + ny * ny > 1 + (PFK.cl(xx, yy, 2, seed) - 0.5) * 0.25) continue;
    const u = PFTerrain.boulderPix(xx, yy, seed, 9 + (seed % 5), 7, RW);
    PFK.put(pb, xx, yy, u === -1 ? RW[1] : u);
  }
  for (let xx = Math.round(x - w / 2); xx <= x + w / 2; xx++) if (PFK.get(pb, xx, y) >>> 24) PFK.put(pb, xx, y + 1, RW[0]);
}
/** Conchas y piedrecitas */
function shells(pb, x, y) {
  PFK.put(pb, x, y, U('#fff2e0')); PFK.put(pb, x + 1, y, U('#f4a0b0')); PFK.put(pb, x + 5, y + 1, U('#fff6e8')); PFK.put(pb, x - 4, y + 1, U('#8a5a2c')); PFK.put(pb, x - 3, y + 1, U('#c8945e'));
}
/** Charca de marea con estrella de mar y erizo */
function tidePool(pb, x, y, w, h) {
  const S = PFK.P32(RAMP.shallowR);
  PFK.ellipseFn(pb, x, y, w / 2 + 1, h / 2 + 1, (nx, ny, d) => d > 0.72 ? U(ny < 0 ? '#5e2210' : '#a55320') : S[clamp(Math.round(3.2 - ny * 1.5 + (PFK.cl(x + nx * 9, y + ny * 3, 1, 4) - 0.5)), 1, 5)]);
  PFK.put(pb, x - 3, y - 1, U('#ffffff')); PFK.put(pb, x - 2, y - 1, U('#bde3ed')); PFK.put(pb, x + 2, y, U('#bde3ed'));
  // estrella de mar
  const sx = x + 3, sy = y;
  for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1], [-2, -1], [2, -1]]) PFK.put(pb, sx + dx, sy + dy, U(dx === 0 && dy === 0 ? '#ffb86b' : '#f07a3a'));
  PFK.put(pb, x - 4, y + 1, U('#1a0f33')); PFK.put(pb, x - 5, y + 1, U('#311f57'));
}
/** Cabaña de Tía Marea: palafito en 3/4 con techo de palma, redes, panel y antena */
function mareaHut(pb, x, y) {
  const WD = ['#1e0e06', '#3a1e10', '#5a3420', '#7a4e30', '#9a6a44', '#c08e60', '#e2b88a'];
  const TEAL = ['#06302e', '#0b4e4a', '#127a70', '#1aa894', '#4ccdb8', '#9cecdc'];
  const TH = ['#3a2408', '#5e3c10', '#8a6020', '#b88a34', '#d8ae4e', '#f0d27a'];
  const Wd = PFK.P32(WD), T = PFK.P32(TEAL), Th = PFK.P32(TH);
  const floorY = y - 22, w = 82, h = 32, d = 14, dx = 6;
  // pilotes (4 delante, 2 detrás)
  for (const [px, back] of [[x + 2, 0], [x + 38, 0], [x + 76, 0], [x + 10 + dx, 1], [x + 70 + dx, 1]]) for (let yy = floorY - (back ? d : 0); yy < y + (back ? -d + 4 : 0); yy++) for (let k = 0; k < 4; k++) PFK.put(pb, px + k, yy, Wd[clamp((k === 0 ? 4 : k === 3 ? 1 : 3) - back, 0, 6)]);
  // riostras
  PFK.lineFn(pb, x + 4, floorY + 2, x + 38, y - 4, () => Wd[2]); PFK.lineFn(pb, x + 76, floorY + 2, x + 42, y - 4, () => Wd[2]);
  // plataforma (cubierta de tablones en 3/4)
  PFInfra.box3q(pb, x - 6, floorY + 4, w + 14, 4, d + 4, { skew: 0.45, ramp: WD, top: (xx, yy, u, v) => Wd[((xx - x) % 5 === 0) ? 3 : 5 - Math.round(v)] });
  // paredes de tablas pintadas (frente) y lateral
  PFInfra.box3q(pb, x, floorY, w, h, d, {
    skew: 0.45, ramp: TEAL,
    front: (xx, yy, u, v) => { let k = 3 + ((yy - floorY) % 4 === 0 ? -1 : 0) - (u > 0.86 ? 1 : 0) + (PFK.cl(xx, yy, 2, 5) < 0.12 ? -1 : 0); if (PFK.vn(xx * 0.2, yy * 0.4, 6) > 0.8) return Wd[4]; return T[clamp(k, 0, 5)]; },
    side: (xx, yy) => T[clamp(1 + ((yy - floorY) % 4 === 0 ? -1 : 0), 0, 5)],
    top: () => T[2],
  });
  // ventana con contraventanas, puerta con luz cálida
  PFInfra.windowQ(pb, x + 12, floorY - h + 9, 14, 10);
  for (let yy = floorY - h + 9; yy < floorY - h + 19; yy++) { PFK.put(pb, x + 9, yy, Wd[5]); PFK.put(pb, x + 10, yy, Wd[3]); PFK.put(pb, x + 28, yy, Wd[5]); PFK.put(pb, x + 29, yy, Wd[3]); }
  for (let yy = floorY - 25; yy < floorY; yy++) for (let xx = x + 50; xx < x + 64; xx++) PFK.put(pb, xx, yy, xx === x + 50 ? Wd[0] : (xx - x) % 4 === 0 ? Wd[1] : Wd[2]);
  for (let yy = floorY - 22; yy < floorY - 14; yy++) for (let xx = x + 53; xx < x + 61; xx++) PFK.put(pb, xx, yy, U(yy < floorY - 20 ? '#ffe7a0' : '#ffc860'));
  PFK.put(pb, x + 61, floorY - 12, U('#ffe14d'));
  // techo de palma a cuatro aguas visto en 3/4
  const rt = floorY - h, ry = rt - 22;
  PFK.polyFill(pb, [[x - 10, rt + 2], [x + w + 10, rt + 2], [x + w + dx + 4, ry + 4], [x + dx - 2, ry + 4]], (xx, yy) => {
    const v = (rt + 2 - yy) / 22, stripe = (xx + Math.round(yy * 0.6)) % 4;
    let k = 4 - Math.round(v * 1.2) + (stripe === 0 ? -1 : stripe === 2 ? 1 : 0) + (PFK.cl(xx, yy, 2, 9) < 0.15 ? -1 : 0);
    if (xx > x + w - 2 + v * 8) k -= 2;
    return Th[clamp(k, 0, 5)];
  });
  for (let xx = x - 10; xx <= x + w + 10; xx++) { PFK.put(pb, xx, rt + 2, Th[1]); if (hash2(xx, 1, 4) < 0.5) PFK.put(pb, xx, rt + 3, Th[2]); if (hash2(xx, 2, 4) < 0.3) PFK.put(pb, xx, rt + 4, Th[1]); }
  for (let xx = x + dx - 2; xx < x + w + dx + 4; xx++) PFK.put(pb, xx, ry + 4, Th[5]);
  // panel solar y antena
  PFInfra.pvPanel(pb, x + 52, ry + 12, 16, 6);
  for (let yy = ry - 22; yy < ry + 8; yy++) PFK.put(pb, x + 74, yy, U('#c8d8e0'));
  PFK.put(pb, x + 74, ry - 23, U('#ff4e5d')); for (let k = -3; k <= 3; k++) PFK.put(pb, x + 74 + k, ry - 16, U('#98a8b8'));
  // escalera de acceso, red colgada, boya
  for (let yy = floorY + 4; yy < y; yy++) { PFK.put(pb, x + 86, yy, Wd[4]); PFK.put(pb, x + 92, yy, Wd[2]); if ((yy - floorY) % 4 === 0) for (let k = 87; k < 92; k++) PFK.put(pb, x + k, yy, Wd[3]); }
  for (let k = 0; k < 14; k++) for (let j = 0; j < 12; j++) if ((k + j) % 3 === 0 || (k - j + 30) % 3 === 0) PFK.put(pb, x + 30 + k, floorY - 12 + j + Math.round(Math.sin(k / 13 * Math.PI) * 2), U('#cfe8ee'));
  PFK.ellipseFn(pb, x + 46, floorY - 6, 2.4, 2.4, (nx, ny) => U(nx + ny < -0.5 ? '#ffc6b4' : '#ff6b6b'));
  // macetas con plantas en la plataforma
  for (const px of [x + 4, x + 70]) { PFInfra.box3q(pb, px, floorY + 1, 6, 4, 2, { ramp: ['#3a1408', '#6a2a10', '#a04a20', '#c86a30', '#e08a48'] }); PFFlora.bush(pb, px + 3, floorY - 3, 9, 8, RAMP.foliageR, px); }
}
/** Redes de pesca tendidas entre dos postes con flotadores */
function nets(pb, x, y) {
  const Wd = PFK.P32(PFSigns.WOOD);
  for (const px of [x, x + 30]) for (let yy = y - 28; yy < y; yy++) { PFK.put(pb, px, yy, Wd[6]); PFK.put(pb, px + 1, yy, Wd[3]); }
  for (let k = 0; k <= 30; k++) {
    const sag = Math.round(Math.sin(k / 30 * Math.PI) * 6);
    for (let j = 0; j < 16; j++) if ((k + j) % 3 === 0 || (k - j + 60) % 3 === 0) PFK.put(pb, x + k, y - 26 + sag + j, U(j > 13 ? '#7ab0c0' : '#d6eef2'));
    if (k % 6 === 3) { PFK.put(pb, x + k, y - 27 + sag, U('#ff9f43')); PFK.put(pb, x + k + 1, y - 27 + sag, U('#e86a2a')); }
  }
}
/** Bote de remos varado en 3/4 (interior visible) */
function boat(pb, x, y, cols, seed) {
  const H0 = U(cols[0]), H1 = U(cols[1]), INK = U(cols[2]);
  const IN = PFK.P32(['#3a1e10', '#5a3420', '#7a4e30', '#9a6a44', '#c08e60']);
  const L = 44;
  for (let i = 0; i < L; i++) {
    const t = i / (L - 1), s = Math.sin(t * Math.PI);
    const top = y - 9 - Math.round(s * 3), bot = y - 1 + Math.round(s * 1.5), rimIn = top + Math.round(1 + s * 4);
    for (let yy = top; yy <= bot; yy++) {
      let c = yy === top ? U('#fff6e8') : yy < rimIn ? IN[clamp(1 + Math.round((yy - top) / 2), 0, 4)] : (yy > bot - 2 ? H1 : H0);
      if (yy >= rimIn && yy === rimIn) c = U('#f4ece0');
      if (t < 0.05 || t > 0.95) c = H1;
      if (yy >= rimIn && PFK.cl(x + i, yy, 2, seed) < 0.08) c = U('#e8d8c0');
      PFK.put(pb, x + i, yy, c);
    }
    PFK.put(pb, x + i, bot + 1, INK);
  }
  // bancadas y remo
  for (const bx of [14, 28]) for (let yy = y - 9; yy < y - 5; yy++) PFK.put(pb, x + bx, yy, IN[4]);
  PFK.lineFn(pb, x + 8, y - 12, x + 40, y - 6, (t) => U(t > 0.8 ? '#c08e60' : '#e2b88a'));
  // sombra de contacto
  for (let i = 2; i < L - 2; i++) PFK.put(pb, x + i, y + 1, U('#96592b'));
}
/** Plataforma del dron (marca H pintada en 3/4) */
function dronePad(pb, x, y) {
  PFK.ellipseFn(pb, x, y, 15, 5, (nx, ny, d) => d > 0.82 ? U('#e8c040') : d > 0.66 ? U('#3a3f4a') : U(ny < -0.2 ? '#6a7078' : '#585e68'));
  for (const [dx, dy] of [[-3, -2], [-3, -1], [-3, 0], [-3, 1], [3, -2], [3, -1], [3, 0], [3, 1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0]]) PFK.put(pb, x + dx, y + dy, U('#fff2c0'));
  for (const dx of [-17, 17]) { PFK.put(pb, x + dx, y - 2, U('#ff7a3a')); PFK.put(pb, x + dx, y - 1, U('#ffffff')); PFK.put(pb, x + dx - 1, y, U('#c84a1a')); PFK.put(pb, x + dx, y, U('#ff7a3a')); PFK.put(pb, x + dx + 1, y, U('#c84a1a')); }
}
function ropeCoil(pb, x, y) {
  for (let k = 0; k < 3; k++) PFK.ellipseFn(pb, x, y - k, 5 - k, 2, (nx, ny, d) => d > 0.5 ? U(ny < 0 ? '#e8d4a8' : '#a88a5a') : 0);
}
/** Caseta de control del pretratamiento con paneles FV en el techo */
function controlRoom(pb, x, y) {
  const b = PFInfra.box3q(pb, x, y, 34, 36, 14, { ramp: PFInfra.STEEL, front: PFInfra.wallFront(x, y - 14), top: (xx, yy, u, v) => PFK.P32(PFInfra.ROOF)[clamp(Math.round(4 - v * 2), 1, 5)] });
  PFInfra.windowQ(pb, x + 5, y - 30, 12, 8); PFInfra.windowQ(pb, x + 20, y - 30, 9, 8);
  for (let yy = y - 18; yy < y; yy++) for (let xx = x + 22; xx < x + 31; xx++) PFK.put(pb, xx, yy, U(xx === x + 22 ? '#1a2230' : '#3a5068'));
  PFInfra.pvPanel(pb, x + 2, y - 39, 14, 5); PFInfra.pvPanel(pb, x + 18, y - 39, 14, 5);
  // equipo de aire y cableado
  PFInfra.box3q(pb, x + 35, y - 8, 7, 7, 4, { ramp: PFInfra.STEEL });
  for (let k = 0; k < 4; k++) PFK.put(pb, x + 36 + k, y - 13, U('#4f4d51'));
  return b;
}
/** Patín de dosificación de coagulante: dos tanquecitos, bomba y rombo de seguridad */
function dosingSkid(pb, x, y) {
  PFInfra.box3q(pb, x - 4, y, 40, 4, 10, { ramp: PFTerrain.CONC });
  PFInfra.cylV(pb, x + 4, y - 5, 5, 16, { ramp: ['#3a2a08', '#6a4e10', '#a8841e', '#d0ae3a', '#ecd068', '#fff0b0', '#ffffff', '#ffffff'], bands: [{ y: 4, h: 1 }], ell: 0.4 });
  PFInfra.cylV(pb, x + 16, y - 5, 5, 14, { bands: [{ y: 4, h: 1 }], ell: 0.4 });
  PFInfra.cylH(pb, x + 23, x + 32, y - 8, 2, {});
  PFInfra.pipe(pb, [[x + 4, y - 22], [x + 4, y - 26], [x + 30, y - 26], [x + 30, y - 12]], 1, 'steel', { flange: 0 });
  for (let yy = 0; yy < 7; yy++) for (let xx = 0; xx < 7; xx++) if (Math.abs(xx - 3) + Math.abs(yy - 3) <= 3) PFK.put(pb, x + 26 + xx, y - 22 + yy, U(Math.abs(xx - 3) + Math.abs(yy - 3) === 3 ? '#c02a2a' : '#ffffff'));
}
