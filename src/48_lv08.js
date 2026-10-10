/* =====================================================================
   48_lv08.js — NIVEL 08: EL OASIS DE LAS RAÍCES
   Parcelas agroecológicas, viveros, banco de semillas y red de riego.
   RA-07 · Mapa de Raíces · Guardián: La Cosecha Transparente
   KIRU revela la memoria cifrada con los datos comunitarios.
   ===================================================================== */

const IRR_SOURCES = {
  perm: { name: 'Permeado de OI', ec: 0.05, boron: 0.9, na: 0.4, cam: 0.1, max: 1, col: '#56e5ff' },
  well: { name: 'Pozo 4 (salobre)', ec: 2.6, boron: 2.4, na: 18, cam: 6, max: 1, col: '#c97c38' },
  rain: { name: 'Cisterna de lluvia', ec: 0.08, boron: 0, na: 0.2, cam: 0.4, max: 0.4, col: '#86e36f' },
};
const AGRO_CROPS = ['maiz', 'frijol', 'ahuyama', 'tomate', 'aji', 'sorgo', 'nopal'];
function irrigationBlend(f, gypsum) {
  const s = ['perm', 'well', 'rain'].map(k => Object.assign({ q: f[k] }, IRR_SOURCES[k]));
  const b = AgroModel.blend(s);
  if (gypsum) { b.cam += 4; b.ec += 0.35; b.sar = b.na / Math.sqrt(Math.max(0.05, b.cam / 2)); }
  b.infil = AgroModel.infiltrationRisk(b.ec, b.sar);
  return b;
}

LEVELS[8] = {
  id: 8, title: 'El Oasis de las Raíces', chapter: 'CAPÍTULO 08', biome: 'oasis', music: 'oasis', width: 2800, height: 360,
  ambience: { birds: 0.9, wind: 0.2, sea: 0 },
  portraits: ['amaya', 'kiru', 'naira', 'dante', 'alma', 'pastora', 'eliana'],
  spawn: { x: 60, y: 286 },
  checkpoints: { hub: { x: 1360, y: 284 }, tree: { x: 2300, y: 276 } },
  ground: [[0, 286], [280, 284], [320, 278], [900, 278], [960, 284], [1300, 284], [1800, 280], [2300, 276], [2600, 270], [2800, 266]],
  terrain: [{ x0: 0, x1: 300, mat: 'sand' }, { x0: 300, x1: 2800, mat: 'grassland' }],
  water: [{ x0: 1180, x1: 1260, y: 282, tint: '#20d6c7', deep: '#0f6a7a', pf: true, style: 'pond' }],
  platforms: [{ x: 1010, y: 236, w: 140, type: 'wood', baked: true, look: 'deck', railing: false, postGap: 46 }, { x: 2380, y: 214, w: 70, type: 'wood', baked: true, look: 'none' }, { x: 2470, y: 188, w: 60, type: 'wood', baked: true, look: 'none' }],
  ladders: [{ x: 1020, y0: 236, y1: 284, look: 'wood' }],
  cam: { look: 50, vy: 0.66 },
  /* ---------------- plano jugable con kit PF (B) ----------------
     Suelo en 3/4: arena y arenisca al llegar del desierto → senda de tierra entre bancales elevados
     (delante, dos bancales inferiores con muros de piedra seca, canal turquesa y cascaditas) →
     corte de suelo con raíces bajo el vivero y el banco de semillas → estanque → losa de hormigón
     del nodo hidráulico → pradera con sendero, bancal inferior y corte de suelo → raíces del cují. */
  pf: {
    kitB: true,
    terrain: [
      { x0: 0, x1: 300, surf: 'sand', face: 'sandstone', depth: 12 },
      { x0: 300, x1: 905, surf: 'path', face: 'terrace', depth: 16, falls: [362, 548, 716, 884], roots: [400, 452, 590, 640, 760, 820], tiers: [{ wall: 17, top: 10, channel: true, crop: 'lettuce' }, { wall: 14, top: 9, crop: 'bean' }] },
      { x0: 905, x1: 1172, surf: 'path', face: 'soilcut', depth: 16, roots: [930, 980, 1040, 1100, 1150] },
      { x0: 1172, x1: 1268, surf: 'grass', face: 'soilcut', depth: 14 },
      { x0: 1268, x1: 1600, surf: 'path', face: 'concrete', depth: 18 },
      { x0: 1600, x1: 1960, surf: 'grass', face: 'soilcut', depth: 16, trail: true, roots: [1640, 1700, 1790, 1880, 1930] },
      { x0: 1960, x1: 2250, surf: 'grass', face: 'terrace', depth: 16, trail: true, falls: [2110], tiers: [{ wall: 20, top: 11, channel: true, crop: 'chard' }] },
      { x0: 2250, x1: 2610, surf: 'grass', face: 'soilcut', depth: 16, roots: [2330, 2380, 2420, 2440, 2470, 2520] },
      { x0: 2610, x1: 2800, surf: 'path', face: 'sandstone', depth: 14 },
    ],
    fg: [
      { kind: 'clump', x: -30, w: 150, h: 96, seed: 81, spikes: 3, leaves: 12 },
      { kind: 'dark', x: 520, w: 120, h: 70, seed: 83, leaves: 9 },
      { kind: 'reeds', x: 1300, w: 130, h: 92, seed: 85 },
      { kind: 'clump', x: 1720, w: 120, h: 74, seed: 87, spikes: 5, leaves: 9 },
      { kind: 'canopy', x: 2350, y: -6, w: 260, h: 78, seed: 89, side: -1, n: 16, vines: 4 },
      { kind: 'reeds', x: 2700, w: 110, h: 80, seed: 91 },
      { kind: 'clump', x: 3040, w: 150, h: 92, seed: 93, spikes: 6, leaves: 11 },
      { kind: 'canopy', x: 3300, y: -6, w: 220, h: 70, seed: 95, side: 1, n: 12, vines: 3 },
    ],
    fauna: { drones: [{ x: 1380, y: 120, r: 30 }] },
  },
  /** Etiquetas científicas en el mundo */
  labels: [
    { x: 450, y: 150, title: 'MILPA', sub: 'Maíz · frijol · ahuyama', kind: 'green', ax: 450, ay: 196 },
    { x: 628, y: 172, title: 'HUERTA', sub: 'Tomate · ají', kind: 'green', ax: 628, ay: 214, when: (sc) => !sc.state.rootsView },
    { x: 800, y: 150, title: 'SECANO', sub: 'Sorgo · nopal', kind: 'green', ax: 800, ay: 200 },
    { x: 628, y: 172, title: 'SAL EN LA RAÍZ', sub: 'CE suelo 3,4 dS/m · boro alto', kind: 'alert', ax: 628, ay: 300, when: (sc) => !!sc.state.rootsView },
    { x: 452, y: 330, title: 'ZONA RADICULAR', sub: 'Humedad + raíces', kind: 'water', ax: 452, ay: 318, when: (sc) => !!sc.state.rootsView },
    { x: 1300, y: 150, title: 'POZO 4', sub: 'Agua salobre', kind: 'solar', ax: 1300, ay: 196 },
    { x: 1356, y: 118, title: 'PERMEADO', sub: 'Agua de la planta OI', kind: 'water', ax: 1356, ay: 150 },
    { x: 1424, y: 196, title: 'CISTERNA', sub: 'Agua de lluvia', kind: 'green', ax: 1424, ay: 226 },
    { x: 1500, y: 132, title: 'MEZCLA DE RIEGO', sub: (sc) => (sc.state.blend && isFinite(sc.state.blend.ec)) ? ('EC ' + fmt(sc.state.blend.ec, 2) + ' dS/m · SAR ' + fmt(sc.state.blend.sar || 0, 1)) : 'EC · boro · SAR', kind: 'water', ax: 1490, ay: 180 },
    { x: 1560, y: 190, title: 'COMPOST', sub: 'Materia orgánica', kind: 'green', ax: 1566, ay: 238 },
    { x: 1760, y: 176, title: 'PASTOREO', sub: 'Ruta de las cabras', kind: 'green', ax: 1760, ay: 236 },
    { x: 2010, y: 160, title: 'CORREDOR', sub: 'Polinizadores', kind: 'green', ax: 2010, ay: 222 },
  ],
  /* ---------------- accesorios estáticos (prerender) ---------------- */
  props(pb, world) {
    const t0 = nowMs();
    const gy = (x) => world.groundAt(x);
    const segs = PFGround.surface(pb, world);
    const back = (x) => PFGround.backEdge(PFGround.segAt(segs, x), Math.round(x), gy(x));
    const F = PFFlora, A = PFAgro, B = PFB, I = PFInfra;
    const r = RNG(808);
    /* ===== 1. LINDE DEL DESIERTO (0–300): cardones, agaves, rocas, letrero ===== */
    for (const [x, h] of [[24, 58], [96, 44], [168, 64], [214, 40]]) B.cactus(pb, x, back(x) + 3, h, x);
    for (let x = 10; x < 290; x += 26 + r.int(0, 20)) B.rocks(pb, x, back(x) + 5, 14 + r.int(0, 12), 6 + r.int(0, 5), x);
    F.scatter(pb, (x) => back(x) + 3, 0, 300, 801, { gap: 12, mix: { dry: 4, agave: 2, tuft: 1 } });
    F.agave(pb, 60, gy(60) - 4, 12, 802); F.agave(pb, 140, gy(140) - 4, 9, 803);
    PFSigns.post(pb, 236, gy(236) - 6, [{ text: 'OASIS DE LAS RAÍCES' }, { text: 'MESA DEL NEXO' }, { text: 'DESIERTO', dir: -1 }], 17, { font: 'tiny' });
    // seto cortavientos (al borde del oasis)
    for (let x = 268; x < 372; x += 12) F.bush(pb, x, back(x) + 2, 22, 22 + (x % 3) * 4, RAMP.foliageR, x);
    F.palm(pb, 330, back(330) + 2, 74, -6, 21); F.palm(pb, 882, back(882) + 2, 70, 6, 22);
    /* ===== 2. BANCALES (380–870): milpa, huerta, secano con goteo y sensores ===== */
    const plots = [
      [372, 524, ['maiz', 'frijol', 'ahuyama'], { mulch: true, seed: 11 }],
      [556, 704, ['tomate', 'aji'], { stress: 0.7, seed: 23, spacing: 18 }],
      [728, 874, ['sorgo', 'nopal'], { seed: 37, spacing: 24, frame: PFB.R.STONE }],
    ];
    LV8_DRIPS.length = 0; LV8_FLOWS.length = 0; LV8_GLOWS.length = 0; LV8_FALLS.length = 0;
    for (const [x0, x1, crops, o] of plots) {
      const yb = back(x0) + 3;
      const bd = A.bed(pb, x0, x1, yb, Object.assign({ crops, depth: 20, board: 10, rows: 3 }, o));
      LV8_DRIPS.push(...bd.drips);
    }
    // sensores de suelo decorativos (el de la huerta es la estación)
    for (const x of [404, 846]) { const L = A.sensor(pb, x, back(x) - 8); LV8_GLOWS.push({ x: L.lx, y: L.ly, r: 3, col: '#3fe0a0', a: 0.7, mode: 'blink', hz: 0.7, ph: x, core: '#b0ffd8' }); }
    // cabezal de riego entre milpa y huerta: depósito, filtro de anillas, manómetro
    const hx = 540, hy = back(hx) + 2;
    B.tank(pb, hx, hy, 7, 26, { ramp: ['#0a2a2a', '#124444', '#1c6060', '#2a8080', '#4aa8a0', '#8ad0c4', '#d0f4ec'], bands: [{ y: 5, h: 2 }], dome: 0.5 });
    I.pipe(pb, [[hx + 8, hy - 10], [hx + 16, hy - 10], [hx + 16, hy - 4]], 1, 'irrig', { flange: 0 }); I.gauge(pb, hx + 4, hy - 34, 2, -0.8);
    for (const [x0, x1] of [[372, 524], [556, 704], [728, 874]]) I.pipe(pb, [[x0 + 2, back(x0) - 16], [x1 - 2, back(x0) - 16]], 1, 'irrig', { flange: 30 });
    // milpa: espantapájaros y cesta; secano: piedras de lindero
    lv8Scarecrow(pb, 500, back(500) - 2); lv8Basket(pb, 532, gy(532) - 3);
    for (const x of [716, 888]) B.rocks(pb, x, back(x) + 4, 12, 6, x);
    F.scatter(pb, (x) => back(x) + 3, 300, 905, 806, { gap: 9, mix: { tuft: 5, flowers: 2, lupine: 1, fern: 1 } });
    /* ===== 3. VIVERO DE ALMA (905–1000): casa-malla ===== */
    A.shadeHouse(pb, 906, back(906) + 2, 92, 62, 18);
    for (let k = 0; k < 5; k++) { const px = 912 + k * 16; PFB.rect(pb, px, gy(px) - 14, 10, 6, U('#c9622e')); PFB.rect(pb, px, gy(px) - 14, 10, 1, U('#e88a52')); A.put(pb, ['tomate', 'aji', 'frijol', 'girasol', 'aji'][k], px + 5, gy(px) - 14, 0.35, 0, k); }
    /* ===== 4. BANCO DE SEMILLAS (1006–1156) sobre zócalo de piedra; secadero = plataforma ===== */
    const sbY = 236;
    I.box3q(pb, 1004, back(1080) + 4, 152, back(1080) + 4 - sbY, 18, { ramp: PFB.R.STONE, front: (xx, yy) => PFGround.wallPix(xx, yy - sbY, 40, 61, PFK.P32(PFB.R.STONE), { rh: 7, sw: 14 }) });
    for (let k = 0; k < 5; k++) PFB.rect(pb, 1020 + k * 28, sbY + 10, 8, 4, U('#140a06'));
    A.seedBank(pb, 1010, sbY - 2, 140, 112, 22);
    for (let k = 0; k < 6; k++) { const tx = 1036 + k * 18; PFB.rect(pb, tx, sbY - 3, 14, 2, U(['#e8c040', '#c8562a', '#86b03a', '#f4e8d6', '#a03a2a', '#e8a040'][k])); PFB.rect(pb, tx, sbY - 1, 14, 1, U('#4a2a14')); }
    /* ===== 5. ESTANQUE (1172–1268): juncos, eneas, nenúfares ===== */
    for (let x = 1166; x < 1276; x += 7) { if (x > 1186 && x < 1256) continue; F.tuft(pb, x, back(x) + 4, 9, 18 + (x % 3) * 6, x, ['#22300e', '#344812', '#4c6418', '#688020', '#88a02a', '#acbc3e', '#d0d460']); }
    for (const x of [1176, 1262, 1170]) for (let k = 0; k < 9; k++) { PFK.put(pb, x, back(x) - 18 - k, U(k < 1 ? '#3a2410' : '#6a3c1a')); PFK.put(pb, x + 1, back(x) - 18 - k, U('#3a2410')); }
    /* ===== 6. NODO HIDRÁULICO (1270–1600) ===== */
    const ny = back(1400) + 2;
    A.well(pb, 1300, back(1300) + 3);
    B.tank(pb, 1356, ny, 15, 64, { ramp: PFInfra.STEEL, band: ['#0c2e4a', '#106a8a', '#1ebde3', '#48d4f0', '#6de1f1', '#d0f4f8'], bands: [{ y: 8, h: 3 }, { y: 40, h: 3 }], ladder: true, label: 'PERMEADO' });
    A.cistern(pb, 1424, ny, 46, 30);
    B.tank(pb, 1492, ny, 11, 40, { ramp: PFInfra.STEEL, band: ['#062a2a', '#0a4e4a', '#12786a', '#1ca08a', '#3cc4a6', '#8ae6cc'], bands: [{ y: 6, h: 3 }, { y: 26, h: 2 }], label: 'MEZCLA', labelBg: '#062a24', labelBd: '#3cc4a6' });
    // permeado que llega de SYNARA (desde el fondo) → tanque; tanque → mezcla; pozo → mezcla; cisterna → mezcla
    I.pipe(pb, [[1328, 150], [1356, 150], [1356, ny - 82]], 2, 'perm', { flange: 18 });
    I.pipe(pb, [[1372, ny - 22], [1470, ny - 22], [1470, ny - 30], [1481, ny - 30]], 2, 'perm', { flange: 24, supports: 34, supportTo: () => ny - 4 });
    I.pipe(pb, [[1316, ny - 12], [1478, ny - 12]], 2, 'well', { flange: 26, supports: 40, supportTo: () => ny - 3 });
    I.pipe(pb, [[1448, ny - 32], [1462, ny - 32], [1462, ny - 38], [1481, ny - 38]], 1, 'rain', { flange: 0 });
    // salida de agua mezclada → pradera y frutales (hacia el este)
    I.pipe(pb, [[1503, ny - 16], [1600, ny - 16], [1600, ny - 8], [1960, ny - 8]], 2, 'irrig', { flange: 30, supports: 46, supportTo: (x) => back(x) + 2 });
    for (const [x, y] of [[1400, ny - 12], [1440, ny - 22], [1520, ny - 16]]) I.valve(pb, x, y);
    I.gauge(pb, 1388, ny - 30, 3, -0.4); I.gauge(pb, 1470, ny - 48, 3, -1.1);
    I.cabinet(pb, 1520, ny - 2, 12, 22, 5);
    const lp = PFB.lampPost(pb, 1276, back(1276) + 2, 92, { dir: 1 });
    LV8_GLOWS.push({ x: lp.x, y: lp.y, r: 7, col: '#fff2b0', a: 0.35, mode: 'flicker' }, { x: 1356, y: ny - 34, r: 9, col: '#48d4f0', a: 0.28, mode: 'pulse', hz: 0.4 }, { x: 1526, y: ny - 18, r: 3, col: '#3fe0a0', a: 0.7, mode: 'blink', hz: 1.1 }, { x: 1306, y: back(1300) - 35, r: 3, col: '#3fe0a0', a: 0.7, mode: 'blink', hz: 0.9 });
    LV8_FLOWS.push(
      { pts: [[1328, 150], [1356, 150], [1356, ny - 82]], kind: 'perm', rate: 0.8 },
      { pts: [[1372, ny - 22], [1470, ny - 22], [1470, ny - 30], [1481, ny - 30]], kind: 'perm' },
      { pts: [[1316, ny - 12], [1478, ny - 12]], kind: 'well', rate: 0.7 },
      { pts: [[1448, ny - 32], [1462, ny - 32], [1462, ny - 38], [1481, ny - 38]], kind: 'rain', rate: 0.5 },
      { pts: [[1503, ny - 16], [1600, ny - 16], [1600, ny - 8], [1960, ny - 8]], kind: 'irrig' });
    for (const [x0, x1] of [[372, 524], [556, 704], [728, 874]]) LV8_FLOWS.push({ pts: [[x0 + 2, back(x0) - 16], [x1 - 2, back(x0) - 16]], kind: 'irrig', rate: 0.6 });
    /* ===== 7. COMPOST e INVERNADERO (1530–1600) ===== */
    A.greenhouse(pb, 1536, back(1536) - 6, 60, 64, 18, 7);
    A.compost(pb, 1540, back(1540) + 4);
    /* ===== 8. PRADERA DE DOÑA CELIA (1600–2250): valla, bebedero, colmenas, flores, frutales ===== */
    PFB.fence(pb, 1610, 1960, back(1700) - 4, { gap: 24 });
    F.scatter(pb, (x) => back(x) + 3, 1600, 2250, 811, { gap: 8, mix: { tuft: 5, flowers: 3, lupine: 2, bush: 1 } });
    // bebedero (abrevadero de piedra con agua)
    const bx = 1902, by = back(bx) + 4;
    I.box3q(pb, bx - 22, by, 44, 10, 8, { ramp: PFB.R.STONE });
    PFB.rect(pb, bx - 20, by - 17, 40, 5, (xx, yy) => U(yy === by - 17 ? '#bde9f2' : (xx + yy) % 7 === 0 ? '#3adcf1' : '#11a0c0'));
    for (let x = 1980; x < 2240; x += 9) A.put(pb, ['girasol', 'flor', 'flor', 'girasol', 'flor'][Math.floor(x / 9) % 5], x, back(x) + 2, 0.8 + (x % 3) * 0.1, 0, x);
    for (const [x, sd] of [[2000, 0], [2022, 1], [2044, 2]]) A.hive(pb, x, back(x) + 2, sd);
    for (const [x, h, f] of [[2096, 70, '#ff9a2a'], [2160, 62, '#ffd83a'], [2226, 74, '#f05a3a']]) A.fruitTree(pb, x, back(x) + 3, h, x, f);
    /* ===== 9. CUJÍ ANTIGUO (2250–2610) y PUERTA DE EVIDENCIA ===== */
    F.scatter(pb, (x) => back(x) + 3, 2250, 2610, 812, { gap: 9, mix: { tuft: 5, flowers: 2, fern: 2, bush: 1 } });
    A.cuji(pb, 2420, back(2420) + 4, 128, [{ x: 2380, y: 214, w: 70 }, { x: 2470, y: 188, w: 60 }], 9);
    for (const [x, h] of [[2300, 60], [2560, 66]]) F.palm(pb, x, back(x) + 2, h, x % 2 ? 5 : -5, x);
    /* ===== 10. CAMINO A LA MESA DEL NEXO (2610–2800) ===== */
    for (let x = 2620; x < 2800; x += 30 + r.int(0, 20)) B.rocks(pb, x, back(x) + 5, 14 + r.int(0, 10), 6 + r.int(0, 4), x);
    for (const [x, h] of [[2650, 46], [2770, 56]]) B.cactus(pb, x, back(x) + 3, h, x);
    PFSigns.post(pb, 2690, gy(2690) - 6, [{ text: 'MESA DEL NEXO' }, { text: 'BANCALES', dir: -1 }], 29, { font: 'tiny' });
    // canales y cascaditas de los bancales inferiores (para el brillo animado)
    LV8_CHANNELS.fill(-1);
    for (let x = 0; x < world.w; x++) { const sg = PFGround.segAt(segs, x); if (sg.face !== 'terrace') continue; const ti = PFGround.tierInfo(sg, x, gy(x)); const c = ti.find(q => q.channel); if (c) LV8_CHANNELS[x] = c.topY + c.topH - 3; }
    for (const sg of segs) if (sg.face === 'terrace') for (const fx of (sg.falls || [])) { const ti = PFGround.tierInfo(sg, fx, gy(fx)); const i = ti.findIndex(q => q.channel); if (i >= 0 && ti[i + 1]) LV8_FALLS.push([fx, ti[i].topY + ti[i].topH - 3, ti[i + 1].topY]); }
    LEVELS[8]._propsMs = Math.round(nowMs() - t0);
  },
  /** Primer plano a ras de suelo: pasto, flores y juncos delante de los pies */
  propsFront(pb, world) {
    const gy = (x) => world.groundAt(x), F = PFFlora;
    for (let x = 6; x < 300; x += 31) F.tuft(pb, x, gy(x) + 3, 7, 6, x + 3, PFFlora.DRY);
    for (let x = 304; x < 1170; x += 21) if ((x * 13) % 5 < 3) F.tuft(pb, x, gy(x) + 3, 7, 7, x);
    for (let x = 1166; x < 1276; x += 9) F.tuft(pb, x, gy(x) + 4, 6, 10, x, ['#22300e', '#344812', '#4c6418', '#688020', '#88a02a', '#acbc3e', '#d0d460']);
    for (let x = 1604; x < 2610; x += 17) { if ((x * 7) % 4 < 3) F.tuft(pb, x, gy(x) + 3, 7, 8, x + 9); if ((x * 11) % 9 === 0) F.flowerPatch(pb, x, gy(x) + 3, 8, x); }
  },
  /* ---------------- dinámico ---------------- */
  renderMid(g, sc, cam) {
    const S = sc.state, t = Game.time, w = sc.world, ox = cam.x, oy = cam.y;
    const gy = (x) => w.groundAt(x) - oy;
    // goteo: gotas que caen de los emisores de cada hilera
    g.fillStyle = '#9cf0f8';
    for (const [x0, x1, yb] of LV8_DRIPS) { if (x1 - ox < 0 || x0 - ox > W) continue; for (let x = x0, i = 0; x < x1; x += 10, i++) { const ph = (t * 1.1 + i * 0.37) % 1; if (ph < 0.5) g.fillRect(Math.round(x - ox), Math.round(yb - oy + ph * 4), 1, 1 + (ph > 0.3 ? 1 : 0)); } }
    // flujos (chevrones): permeado cian, pozo ámbar, lluvia verde, mezcla turquesa
    PFInfra.drawFlows(g, sc, LV8_FLOWS);
    PFB.glows(g, sc, LV8_GLOWS);
    // cabras de Doña Celia (escala de personaje)
    for (let i = 0; i < 5; i++) { const gx = 1700 + i * 34 + Math.sin(t * 0.25 + i * 1.7) * 16; PFAgro.drawGoat(g, gx - ox, gy(gx) - 2, t + i, Math.cos(t * 0.25 + i * 1.7) >= 0 ? 1 : -1, i * 1.3); }
    // mariposas y abejas en el corredor y la milpa
    for (let i = 0; i < 14; i++) { const bx = (i < 9 ? 1980 : 380) + ((t * 18 + i * 61) % (i < 9 ? 260 : 480)) - ox, by = (i < 9 ? gy(2000) - 30 : gy(400) - 46) - Math.abs(Math.sin(t * 3 + i)) * 12; if (bx < -4 || bx > W + 4) continue; const wing = Math.floor(t * 10 + i) % 2; fpx(g, bx, by, i % 3 ? '#ffe14d' : '#f6a0d0'); fpx(g, bx + 1, by - wing, i % 3 ? '#fff6a0' : '#ffe0f0'); fpx(g, bx - 1, by - wing, i % 3 ? '#fff6a0' : '#ffe0f0'); }
    // brillo del compartimento de KIRU en el cují
    if (S.memGlow) VISTA.drawGlow(g, 2422 - ox, gy(2420) - 46, 22, '#b49cff', 0.5 + 0.25 * Math.sin(t * 4));
  },
  /** Delante de las entidades: corte de suelo del Mapa de Raíces y brillo de los canales */
  renderFront(g, sc, cam) {
    const S = sc.state, t = Game.time, w = sc.world, ox = cam.x, oy = cam.y;
    // destellos en los canales y cascaditas de los bancales inferiores
    g.fillStyle = '#e8ffff';
    const ph = Math.floor(t * 16) % 12;
    for (let x = Math.max(0, Math.floor(ox) - ((Math.floor(ox) - ph) % 12 + 12) % 12); x < Math.min(w.w, ox + W); x += 12) { const cy = LV8_CHANNELS[x]; if (cy >= 0) g.fillRect(Math.round(x - ox), Math.round(cy - oy), 2, 1); }
    for (const [fx, y0, y1] of LV8_FALLS) { const x = fx - ox; if (x < -6 || x > W + 6) continue; for (let k = 0; k < 4; k++) { const yy = y0 + ((t * 40 + k * 7) % Math.max(4, y1 - y0)); g.fillRect(Math.round(x + k), Math.round(yy - oy), 1, 2); } g.globalAlpha = 0.5; g.fillRect(Math.round(x - 2), Math.round(y1 - oy - 1), 8, 1); g.globalAlpha = 1; }
    if (!S.rootsView) return;
    // Mapa de Raíces: humedad (azul), raíces (claras) y sal acumulada (cristales blancos) bajo cada bancal
    for (const [x0, x1, salt, dy] of [[372, 524, 0.18, 52], [556, 704, 0.75, 52], [728, 874, 0.12, 52], [1600, 1960, 0.08, 6]]) {
      const a = Math.max(x0, ox - 2), b = Math.min(x1, ox + W + 2); if (b <= a) continue;
      for (let x = a; x < b; x += 2) {
        const y0 = w.groundAt(x) + dy - oy, wet = 10 + Math.round(Math.sin(x * 0.07) * 3);
        g.globalAlpha = 0.32; g.fillStyle = '#2c8ad8'; g.fillRect(Math.round(x - ox), Math.round(y0 + 4), 2, wet); g.globalAlpha = 1;
        if (hash2(x, 3, 1) < salt) { g.fillStyle = '#ffffff'; g.fillRect(Math.round(x - ox), Math.round(y0 + 1 + (x % 3)), 1, 1); g.fillStyle = '#f0e8ff'; g.fillRect(Math.round(x - ox) + 1, Math.round(y0 + 2 + (x % 3)), 1, 1); }
      }
      // costra salina en la superficie del corte (franja blanca intermitente)
      if (salt > 0.5) { g.fillStyle = '#f4f0ff'; for (let x = a; x < b; x += 3) if (Math.sin(x * 0.4 + t) > -0.2) g.fillRect(Math.round(x - ox), Math.round(w.groundAt(x) + dy - oy), 2, 1); }
    }
  },
  lens(g, sc, cam, k) {
    const S = sc.state, ox = cam.x, oy = cam.y, w = sc.world;
    lensBoundary(g, 360 - ox, 200 - oy, 540, 100, '#ffe14d', 'LÍMITE: PARCELAS (SUELO + CULTIVO + AGUA + CLIMA)');
    lensTag(g, 390 - ox, 214 - oy, 'ETc = Kc · ET0 (ET0 ≈ 6,5 mm/d)', '#86e36f', 'plant');
    lensTag(g, 570 - ox, 226 - oy, 'Hojas verdes ≠ sin estrés salino', '#ff9a8a', 'leaf');
    lensTag(g, 1300 - ox, 220 - oy, 'Mezcla: EC, boro y SAR', '#20d6c7', 'water');
    lensTag(g, 1700 - ox, 230 - oy, 'Ruta de pastoreo (no estaba en el modelo)', '#ffe14d', 'people');
  },
  hud(g, sc) {
    const S = sc.state;
    if (!S.hud) return;
    hudGauges(g, [
      { icon: 'leaf', label: 'APARIENCIA', value: 'VERDE', frac: 0.9, color: '#86e36f' },
      { icon: 'salt', label: 'SAL SUELO', value: S.rootsView ? 'ALTA (huerta)' : '¿?', frac: S.rootsView ? 0.7 : 0, color: '#ff9a8a' },
      { icon: 'kiru', label: 'ECOS KIRU', value: String(GS.s.echoes.length), frac: Math.min(1, GS.s.echoes.length / 18), color: '#b49cff' },
    ]);
  },
  onTool(sc) {
    const P = sc.player;
    const adv = sc.world.entities.find(e => e instanceof Adversary && !e.calm && Math.abs(e.x - P.x) < 90);
    if (adv || !GS.hasTool('raices')) return false;
    sc.state.rootsView = !sc.state.rootsView; Audio2.sfx('scan');
    sc.kiru && sc.kiru.say(sc.state.rootsView ? 'Mapa de Raíces: sal acumulada bajo la huerta. Las hojas no lo cuentan.' : 'Vista normal: todo parece sano.', 'curioso', 3);
    return true;
  },
  /* ---------------- guion ---------------- */
  setup(sc, p) {
    const S = sc.state;
    Object.assign(S, { hud: true, rootsView: false, nodes: 0, memGlow: false });
    const naira = sc.actor('naira', 'naira', 1080, { facing: -1 }); naira.y = 284;
    const alma = sc.actor('alma', 'alma', 960, { facing: -1 });
    const celia = sc.actor('celia', 'pastora', 1820, { facing: -1 });
    const dante = sc.actor('dante', 'dante', 1460, { facing: -1, restAnim: 'repair' });
    sc.world.add(new Pickup({ kind: 'echo', x: 1080, y: 210, onPick: () => kiruEcho(sc, 'l8a', 'KIRU: "Parcela 07, Las Abuelas. Riego de madrugada. Lo sé como sé mi nombre."') }));
    sc.world.add(new Pickup({ kind: 'echo', x: 2495, y: 160, onPick: () => kiruEcho(sc, 'l8b', 'KIRU: "Bajo este árbol, Eliana me dijo: «Cuando llegue el momento, tú decides»."') }));
    for (const [x, y] of [[620, 236], [1560, 240]]) sc.world.add(new Adversary({ type: 'saltMirage', x, y, range: 40, speed: 20 }));
    naira.onTalk = async (sc2) => sideSeedBank(sc2);
    alma.onTalk = async (sc2) => sideBackupNodes(sc2);
    celia.onTalk = async (sc2) => sideGoatRoute(sc2);
    dante.onTalk = async (sc2) => { await sc2.say([['dante', 'smile', 'El nodo hidráulico mezcla tres aguas: permeado, pozo 4 y lluvia. El gemelo de riego está en la consola junto al mezclador.']]); };
    sc.station({ id: 'plotHuerta', x: 640, kind: 'sensor', label: 'Plantas de la huerta', glow: '#ff9a8a', onUse: async (sc2, st) => plotsFirst(sc2, st), scan: (sc2, st) => sc2.run(() => plotsFirst(sc2, st)) });
    sc.station({ id: 'agroSim', x: 1475, kind: 'sim', label: 'Gemelo de riego', glow: '#86e36f', hidden: true, onUse: async (sc2, st) => agroFlow(sc2, st) });
    sc.station({ id: 'tree', x: 2420, kind: 'clue', label: 'El cují antiguo', glow: '#b49cff', hidden: true, draw: PFB.drawClue, onUse: async (sc2, st) => { st.done = true; await kiruMemoryScene(sc2); } });
    sc.station({ id: 'solo', x: 2560, kind: 'solo', label: 'Puerta de Evidencia', glow: '#b49cff', hidden: true, onUse: async (sc2, st) => {
      const r = await sc2.open(SOLOScene, { ctx: 'RA-07-C1' });
      st.progress = r.correct; if (r.correct >= 3) { st.done = true; GS.lp(8).solo = true; S.soloDone = true; Codex.unlock('calidad_riego'); }
    } });
    sc.station({ id: 'exit', x: 2740, kind: 'clue', label: 'Ir a la Mesa del Nexo', glow: '#ffe14d', hidden: true, draw: PFB.drawClue, onUse: async (sc2) => finishLevel8(sc2) });
    // nodos de respaldo de la memoria de KIRU (misión de Alma)
    for (const [x, y] of [[520, 240], [1130, 214], [2060, 250]]) sc.world.add(new Pickup({ kind: 'node', x, y, draw: (g, px, py, pk) => { if (!S.nodeQuest) return; fdisc(g, px, py, 4, '#3f2690'); fdisc(g, px, py, 3, '#b49cff'); fpx(g, px - 1, py - 1, '#ffffff'); for (let k = 0; k < 3; k++) fpx(g, px + Math.cos(pk.t * 3 + k * 2) * 7, py + Math.sin(pk.t * 3 + k * 2) * 7, '#b49cff'); }, onPick: () => { S.nodes++; Game.toast('Nodo de respaldo (' + S.nodes + '/3)', 'save', '#b49cff', 2); if (S.nodes >= 3) { GS.flag('kiruBackupBuilt', true); GS.lp(8).side.backup = true; LearningModel.record({ kind: 'challenge', id: 'side_nodos_respaldo', ra: 'RA-09', concepts: ['steamInquiry'], solo: 2, correct: true }); sc.kiru && sc.kiru.say('Tres nodos de respaldo activos. Si algo se borra, tendré dónde volver.', 'esperanzado', 5); } } }));
    for (const e of sc.world.entities) if (e.kind === 'node') { const up = e.update.bind(e); e.update = (dt) => { if (S.nodeQuest) up(dt); else e.t += dt; }; }
    sc.setObjective('Revisa las plantas de la huerta', ['¿Una planta verde puede tener estrés?', 'La huerta (tomate y ají) está en la segunda terraza.']);
    Codex.unlock('agroeco10');
    if (p.checkpoint === 'hub') { S.sawPlots = true; sc.world.find('agroSim').hidden = false; sc.setObjective('Usa el Gemelo de riego en el nodo hidráulico', []); }
    if (p.checkpoint === 'tree') { S.sawPlots = true; S.agroStage = 'tree'; GS.giveTool('raices', true); sc.world.find('tree').hidden = false; S.memGlow = true; sc.setObjective('Ve al cují antiguo con KIRU', []); }
  },
  update(sc, dt) { if (Math.random() < 0.05) sc.world.ps.emit('leaf', sc.cam.x + Math.random() * W, sc.cam.y + 120, 10, 10, 1); },
  triggers: [
    { x: 330, w: 40, run: (sc) => { sc.kiru && sc.kiru.say('Huele a tierra mojada. Y a algo que conozco… no sé de dónde.', 'curioso', 4); } },
  ],
};

/* ---------------- datos del plano jugable (los rellena props al entrar) ---------------- */
const LV8_DRIPS = [], LV8_FLOWS = [], LV8_GLOWS = [], LV8_FALLS = [];
const LV8_CHANNELS = new Int16Array(2801).fill(-1);
/** Espantapájaros de la milpa (≈66 px): cruz de palos, camisa de colores y sombrero de paja */
function lv8Scarecrow(pb, x, y) {
  const s = PFB.sprite(34, 72), b = 70, Wd = PFK.P32(PFB.R.WOODG);
  for (let yy = b - 64; yy < b; yy++) { PFK.put(s, 16, yy, Wd[5]); PFK.put(s, 17, yy, Wd[3]); }
  for (let xx = 3; xx < 31; xx++) { PFK.put(s, xx, b - 50, Wd[6]); PFK.put(s, xx, b - 49, Wd[3]); }
  PFB.rect(s, 9, b - 50, 16, 20, (xx, yy, u, v) => U(['#7a1a1c', '#c8384a', '#e86a4a', '#2a6ab0', '#4a8ad0'][((xx >> 2) + (yy >> 2)) % 2 ? 1 + Math.round(u) : 3 + Math.round(v)]));
  PFB.rect(s, 4, b - 50, 6, 4, U('#c8384a')); PFB.rect(s, 24, b - 50, 6, 4, U('#c8384a'));
  for (let k = 0; k < 4; k++) { PFK.put(s, 3 - k % 2, b - 47 + k, U('#e6c46a')); PFK.put(s, 30 + k % 2, b - 47 + k, U('#e6c46a')); }
  PFK.ellipseFn(s, 17, b - 56, 5, 5, (nx, ny) => U(ny < -0.3 && nx < 0 ? '#f6e2b8' : '#d8c090'));
  PFK.put(s, 15, b - 57, U('#2a1a10')); PFK.put(s, 19, b - 57, U('#2a1a10'));
  PFK.ellipseFn(s, 17, b - 61, 11, 2.5, (nx, ny) => U(ny < 0 ? '#f0d68a' : '#b48a3a')); PFB.rect(s, 13, b - 66, 9, 5, (xx, yy) => U(yy === b - 66 ? '#f0d68a' : '#d8b25a'));
  PFB.rect(s, 13, b - 63, 9, 1, U('#c8384a'));
  PFB.finish(s); PFB.stamp(pb, s, x - 17, y - b); PFB.contact(pb, x, y, 6, 1.5);
}
/** Cesta de cosecha con mazorcas y tomates */
function lv8Basket(pb, x, y) {
  const s = PFB.sprite(20, 16), b = 14;
  for (let yy = b - 8; yy < b; yy++) for (let xx = 2; xx < 18; xx++) PFK.put(s, xx, yy, U(((xx + yy) % 3 === 0) ? '#6a4220' : (yy - b) % 2 ? '#c89458' : '#a87440'));
  for (let k = 0; k < 4; k++) PFK.ellipseFn(s, 5 + k * 3.5, b - 9, 2, 1.6, (nx, ny) => U(k % 2 ? (ny < 0 ? '#ff8a6a' : '#c8281e') : (ny < 0 ? '#ffe070' : '#d8a428')));
  PFB.finish(s); PFB.stamp(pb, s, x - 10, y - b); PFB.contact(pb, x, y, 9, 1.5);
}

/* ---------------- piezas del guion del nivel 08 ---------------- */
async function plotsFirst(sc, st) {
  const S = sc.state;
  if (S.sawPlots) { await sc.say([['kiru', 'thinking', 'Hojas verdes, frutos pequeños, bordes quemados en las hojas viejas. Sal y boro, sobre todo en la huerta.']]); return; }
  S.sawPlots = true; st.done = true;
  await sc.say([
    ['naira', 'worried', 'Las riegan todos los días con agua "potable" del despacho, y aun así los tomates están chiquitos y el fríjol tiene los bordes quemados.'],
    ['amaya', 'thinking', 'Se ven verdes…'],
    ['kiru', 'thinking', 'Sensores de suelo: humedad alta, pero conductividad del suelo 3,4 dS/m en la huerta y boro alto. Y la infiltración es pésima: el agua se queda arriba y se evapora.'],
    ['naira', 'calm', 'Una planta puede recibir agua y seguir teniendo sed fisiológica. La sal le roba el agua por ósmosis.'],
    ['kiru', 'confundido', '…Esa es la parcela 07. "Las Abuelas". Nunca nadie me dijo su nombre. ¿Por qué lo sé?'],
  ]);
  Codex.unlock('etc'); Codex.unlock('lavado');
  sc.world.find('agroSim').hidden = false;
  GS.save('hub');
  sc.setObjective('Analiza el agua de riego en el Gemelo de riego (nodo hidráulico)', ['¿El agua potable es siempre la mejor para regar?', 'Mira EC, boro y SAR de cada fuente.', 'La consola está junto al mezclador, pasando el banco de semillas.']);
}
async function agroFlow(sc, st) {
  const S = sc.state;
  if (!S.agroStage) {
    const r = await sc.open(Sim08, { phase: 'demo', stopAfter: 'guided' });
    if (!r || !r.ok) return;
    S.agroStage = 'season'; S.blend = r.blend; GS.giveTool('raices'); Codex.unlock('calidad_riego');
    await sc.say([['kiru', 'happy', 'Nueva herramienta: {c}Mapa de Raíces{/}. Pulsa {y}Q{/} para ver bajo el suelo: humedad, sal y raíces.']]);
    sc.setObjective('Vence a La Cosecha Transparente: una temporada de 12 semanas', ['¿Qué indicador revela el estrés antes que las hojas?', 'Activa los sensores de suelo y mira la conductividad, no el color.', 'Cobertura, riego nocturno, lavado ocasional y cultivos tolerantes donde haya sal.']);
    return;
  }
  if (S.agroStage === 'season') {
    const r = await sc.open(Sim08, { phase: 'auto', stopAfter: 'auto', blend: S.blend });
    if (!r || !r.ok) { sc.kiru && sc.kiru.say('La temporada se perdió en el gemelo. La tierra real sigue esperando. Probemos otro plan.', 'valiente'); return; }
    GS.lp(8).guardian = true;
    const ok = await explain(sc, {
      id: 'lv8_explain', ra: 'RA-07', concepts: ['irrigationQuality', 'agroecology'],
      prompt: 'Las plantas de la huerta recibían más agua de la necesaria y se veían verdes, pero producían poco. ¿Qué relación lo explica?',
      options: [
        'La sal acumulada en el suelo baja el potencial del agua: la raíz tiene que esforzarse para absorberla (estrés osmótico), aunque haya humedad; además el boro se acumula y la mala infiltración deja el agua en superficie.',
        'Les faltaba agua: hay que regar el doble.',
        'El color verde demuestra que la planta está sana; el bajo rendimiento es mala suerte.',
        'El agua potable es siempre ideal para riego, así que el problema era la semilla.'],
      key: 0, mis: 'evaluar solo volumen y no calidad del agua',
      why: 'Con riego frecuente y sin lavado, las sales se concentran en la zona radical (ECe sube). La planta "ve" agua pero no puede tomarla: sed fisiológica. Calidad (EC, boro, SAR), suelo, horario y cobertura importan tanto como el volumen.',
      whyNot: { 1: 'Más agua sin drenaje puede empeorar el encharcamiento superficial y no lava si no infiltra.', 2: 'El estrés salino aparece primero en el rendimiento y en bordes de hojas viejas; el color engaña.', 3: 'El permeado tiene muy poca EC y calcio: favorece problemas de infiltración y puede traer boro.' },
    });
    if (ok) S.explained = true;
    const r2 = await sc.open(Sim08, { phase: 'transfer', stopAfter: 'transfer', blend: S.blend });
    if (r2 && r2.ok) GS.lp(8).variant = true;
    S.agroStage = 'tree'; S.memGlow = true;
    sc.world.find('tree').hidden = false;
    GS.save('tree');
    await sc.say([['kiru', 'confundido', 'Amaya… mi compartimento interno está vibrando. Como si quisiera que fuéramos al árbol viejo.']]);
    sc.setObjective('Ve al cují antiguo con KIRU', ['Al final del pastizal hay un árbol enorme.']);
    return;
  }
  await sc.open(Sim08, { phase: 'free', stopAfter: 'free', blend: S.blend });
}
async function kiruMemoryScene(sc) {
  const S = sc.state;
  sc.musicOverride = 'sad'; Audio2.playMusic('sad');
  const backup = GS.flag('kiruBackupBuilt') || GS.s.echoes.length >= 12;
  await sc.say([
    ['kiru', 'thinking', 'Abro mi compartimento… Hay un bloque de memoria que no aparece en mi mapa. 7,3 MB. Etiqueta: {g}NO_BORRAR · para la comunidad{/}.'],
    ['kiru', 'surprised', 'Mediciones comunitarias. Rutas de pastoreo. Demanda de viveros. Calidad de pozos. Límites ecológicos. Testimonios. Registros de cultivos. Incertidumbres.'],
    ['naira', 'surprised', 'Los datos que borró la limpieza… y los que nunca entraron.'],
    ['eliana', 'calm', '(nota de voz) KIRU: MIRAGE estaba eliminando entradas incompatibles con su función objetivo. Te las confío. Nadie revisa la memoria de un robot que hace chistes.'],
    ['kiru', 'worried', 'Problema: el bloque comparte espacio con mi sistema de identidad. Si lo descifro sin copia, puedo perder bromas, recuerdos, vínculos… preferencias.'],
    ['kiru', 'sad', 'Si abro esto, puede que deje de recordar cómo nos conocimos.'],
    ['amaya', 'worried', 'No tienes que hacerlo.'],
    ['kiru', 'thinking', '¿La ciudad necesita esos datos?'],
    ['amaya', 'sad', 'Sí.'],
    ['kiru', 'determined', '¿Tú los necesitas para arreglar lo que pasó?'],
    ['amaya', 'sad', 'Sí.'],
    ['kiru', 'determined', 'Entonces no me digas que no tengo que hacerlo para que tú te sientas mejor.'],
    ['narr', null, 'Pausa.'],
    ['amaya', 'calm', 'Tienes razón. Es tu decisión.'],
    ['kiru', 'valiente', 'Decido abrirlo.'],
  ]);
  GS.addClue('kiruMemory');
  Audio2.sfx('unlock'); Game.doFlash('#b49cff', 0.6); sc.world.ps.emit('data', sc.kiru ? sc.kiru.x : sc.player.x, sc.player.y - 30, 0, -20, 50, 20);
  await sc.wait(1.2);
  if (backup) {
    await sc.say([
      ['kiru', 'esperanzado', 'Descifrado completo. Los nodos de respaldo guardaron mi identidad… Recuerdo la plaza, la cinta de Dante, el olor a arepa. Y ahora también recuerdo a las 120 familias de Los Médanos.'],
      ['dante', 'joy', '¡Sigue siendo él! Dime un chiste, rápido.'],
      ['kiru', 'happy', '¿Por qué la membrana no va a fiestas? Porque es muy selectiva.'],
      ['naira', 'smile', 'Sí. Es él.'],
    ]);
  } else {
    GS.s.kiruLoss = true;
    await sc.say([
      ['kiru', 'tired', 'Descifrado completo. Los datos están a salvo. Mi memoria… tiene huecos. No recuerdo bien la plaza. Ni por qué Dante usa tanta cinta.'],
      ['dante', 'sad', 'Te lo vuelvo a contar. Las veces que haga falta.'],
      ['kiru', 'calm', 'Gracias. Parece que los vínculos se pueden reconstruir. Más despacio que los datos.'],
    ]);
  }
  GS.flag('kiruDataUnlocked', true);
  Game.toast('Tablero de evidencias: pistas reinterpretadas', 'eye', '#7ee8f0', 4);
  sc.musicOverride = null; Audio2.playMusic('oasis');
  await sc.say([['naira', 'determined', 'Con estos datos podemos sentarnos en la Mesa del Nexo y discutir con la ciudad lo que MIRAGE decidió a solas.']]);
  sc.world.find('solo').hidden = false; sc.world.find('exit').hidden = false;
  sc.setObjective('Abre la Puerta de Evidencia y ve a la Mesa del Nexo', ['El camino sigue tras el árbol.']);
}
async function finishLevel8(sc) {
  const S = sc.state;
  if (!GS.flag('kiruDataUnlocked')) { sc.kiru && sc.kiru.say('Algo me llama desde el árbol viejo.', 'confundido'); return; }
  if (!S.soloDone) { const c = await sc.say([['kiru', 'curioso', 'La Puerta de Evidencia aún no registra tu razonamiento. ¿Seguimos?', { choices: ['Volver a la Puerta de Evidencia', 'Seguir (se puede completar desde el mapa)'] }]]); if (c === 0) return; }
  await completeLevel(sc);
  Game.transition(() => Game.setScene(WorldMapScene, { focus: 9 }));
}
async function sideBackupNodes(sc) {
  const S = sc.state, lp = GS.lp(8);
  if (lp.side.backup) { await sc.say([['alma', 'happy', '¡Los tres nodos brillan! KIRU ahora tiene un "por si acaso". Como mis semillas.']]); return; }
  if (!S.nodeQuest) {
    S.nodeQuest = true;
    await sc.say([
      ['alma', 'thinking', 'Alma Semilla, del vivero. En el banco de semillas guardamos copias de cada semilla en tres lugares, por si una se pierde.'],
      ['alma', 'curious', '¿KIRU tiene copias de sí mismo? Encontré tres cajitas de datos viejas en el oasis. Si las enciendes, quizá sirvan de respaldo.'],
      ['kiru', 'esperanzado', 'Una red de respaldo distribuida. Alma, eres una ingeniera en potencia.'],
    ]);
    Codex.unlock('p_alma');
    return;
  }
  await sc.say([['alma', 'neutral', 'Llevas ' + S.nodes + ' de 3 nodos. Hay uno en la milpa, uno sobre el banco de semillas y uno en el pastizal.']]);
}
async function sideGoatRoute(sc) {
  const lp = GS.lp(8);
  if (lp.side.goats) { await sc.say([['pastora', 'smile', 'El bebedero quedó en el corredor. Las cabras pasan y las flores siguen. Así se hace.']]); return; }
  await sc.say([['pastora', 'worried', 'Doña Celia, pastora. El despacho cerró el bebedero de mis cabras porque "no consumía agua registrada". Pero mis cabras sí beben, aunque el modelo no las vea.']]);
  const c = await sc.say([['amaya', 'thinking', '¿Qué hacemos con la ruta de pastoreo?', { choices: ['Registrar la ruta y su demanda con Doña Celia y reabrir el bebedero en el corredor de flores', 'Mantenerlo cerrado: el agua es para cultivos', 'Que las cabras beban del canal de riego'] }]]);
  const ok = c === 0;
  LearningModel.record({ kind: 'challenge', id: 'side_ruta_de_las_cabras', ra: 'RA-07', concepts: ['agroecology', 'ethics'], solo: 4, correct: ok, misconception: ok ? null : 'ignorar actores y saberes locales' });
  if (ok) { lp.side.goats = true; GS.trust('community', 10); Audio2.sfx('success'); await sc.say([['pastora', 'happy', 'Por fin alguien pregunta antes de decidir. Las cabras también abonan las parcelas, ¿sabías?'], ['kiru', 'happy', 'Sinergia agroecológica registrada: reciclaje de nutrientes y corredor de biodiversidad.']]); }
  else await sc.say([['pastora', 'skeptical', c === 1 ? 'Pues sin cabras no hay queso, ni abono, ni familia en la ranchería.' : 'Y entonces pisotean el goteo. Hay que pensarlo juntos.']]);
}
async function sideSeedBank(sc) {
  const lp = GS.lp(8);
  if (lp.side.seeds) { await sc.say([['naira', 'smile', 'Las semillas criollas ya tienen su triple copia. Guardar diversidad es guardar opciones.']]); return; }
  await sc.say([['naira', 'thinking', 'Tengo espacio para conservar un solo lote más este año. MIRAGE recomienda la variedad híbrida de mayor rendimiento promedio.']]);
  const c = await sc.say([['amaya', 'thinking', '¿Qué priorizamos en el banco de semillas?', { choices: ['La variedad criolla tolerante a sal y sequía, aunque rinda menos en años buenos', 'La híbrida de mayor rendimiento promedio', 'Ninguna: comprar semilla cada año es más fácil'] }]]);
  const ok = c === 0;
  LearningModel.record({ kind: 'challenge', id: 'side_banco_semillas', ra: 'RA-07', concepts: ['agroecology'], solo: 4, correct: ok, misconception: ok ? null : 'optimizar solo el rendimiento promedio' });
  if (ok) { lp.side.seeds = true; Audio2.sfx('success'); Codex.unlock('agroeco10'); await sc.say([['naira', 'happy', 'La resiliencia no se ve en el promedio: se ve en el peor año. Gracias.']]); }
  else await sc.say([['naira', 'skeptical', 'En un año de sequía salina, el promedio no te alimenta. ¿Qué variedad sobrevive al peor año?']]);
}

/* =====================================================================
   Gemelo de riego: calidad de agua, suelo, cultivo y temporada
   ===================================================================== */
const Sim08 = makeSim({
  title: 'MAPA DE RAÍCES · agua, suelo y cultivo', icon: 'leaf', ra: 'RA-07', concepts: ['irrigationQuality', 'agroecology'],
  phases: ['demo', 'guided', 'auto', 'transfer', 'free'],
  hintLadder: ['¿Qué tiene el permeado que no tiene el pozo, y al revés?', 'El permeado casi no tiene calcio: con EC tan baja el suelo pierde infiltración; el pozo trae sal y boro.', 'Mezcla ~50 % permeado + 40 % lluvia + 10 % pozo y agrega yeso para subir el calcio.'],
  init(p) { this.stopAfter = p.stopAfter || 'free'; this.f = p.blend ? Object.assign({}, p.blend.f) : { perm: 1, well: 0, rain: 0 }; this.gyp = p.blend ? !!p.blend.gyp : false; this.plotsCfg = null; },
  blend() { return irrigationBlend(this.f, this.gyp); },
  onPhase(ph) {
    this.verdict = null; this.done = false;
    if (ph === 'demo') { this.dT = 0; this.say('Demostración: la raíz toma agua del suelo. Si el suelo se saliniza, el agua "se queda" retenida por las sales (estrés osmótico). Mira la planta: sigue verde mientras su rendimiento cae.'); }
    if (ph === 'guided') { this.f = { perm: 1, well: 0, rain: 0 }; this.gyp = false; this.say('Tu turno: MIRAGE riega con 100 % permeado ("agua potable = ideal"). Mezcla las fuentes para la parcela de fríjol: ECw < 1,0 dS/m, boro < 0,75 mg/L y riesgo de infiltración < 30 %. La cisterna aporta como máximo 40 %.'); }
    if (ph === 'auto' || ph === 'transfer') {
      const tr = ph === 'transfer';
      this.plotsCfg = [{ crop: 'maiz', irr: 55, mulch: false, night: false, leach: false }, { crop: 'tomate', irr: 55, mulch: false, night: false, leach: false }, { crop: 'frijol', irr: 55, mulch: false, night: false, leach: false }];
      this.sensors = false; this.week = 0; this.running = false; this.ET0 = tr ? 7.5 : 6.5; this.budget = tr ? 120 : 170;
      this.resetPlots();
      this.say(tr ? 'Transferencia: sequía prolongada. ET0 sube a 7,5 mm/d y el presupuesto baja a 120 m³ para las tres parcelas. Rediseña: cultivos, cobertura, horario y lavado.' : 'La Cosecha Transparente: 12 semanas, tres parcelas de 100 m². Presupuesto 170 m³. Las plantas se ven verdes aunque sufran: decide con sensores, no con el color.');
    }
    if (ph === 'free') this.say('Laboratorio libre: prueba mezclas y manejo.');
  },
  resetPlots() { this.plots = this.plotsCfg.map(c => ({ crop: c.crop, theta: 0.5, ECe: 1.2, B: 0.4, health: 1, mulch: c.mulch, drainage: 0.7, water: 0, yieldAcc: 0 })); this.week = 0; this.water = 0; this.hist = []; },
  step(dt) {
    if (this.phase === 'demo' && !this.verdict) { this.dT += dt; if (this.dT > 8) this.verdict = { ok: true, txt: 'El agua del suelo con sal no está "libre" para la raíz. Por eso una planta bien regada puede tener sed fisiológica. Hoja verde ≠ planta sin estrés.' }; return; }
    if ((this.phase === 'auto' || this.phase === 'transfer') && this.running && !this.done) {
      this.wt = (this.wt || 0) + dt * (Input.down('fast') ? 3 : 1);
      if (this.wt > 0.7) { this.wt = 0; this.advanceWeek(); }
    }
  },
  advanceWeek() {
    const b = this.blend();
    this.plots.forEach((pl, i) => {
      const c = this.plotsCfg[i];
      pl.crop = c.crop; pl.mulch = c.mulch;
      const irr = c.irr + (c.leach && this.week % 4 === 3 ? 40 : 0);
      AgroModel.week(pl, { ET0: this.ET0, irr, eff: c.night ? 0.9 : 0.72, ecw: b.ec, boron: b.boron, sar: b.sar, rain: 0, pollinators: GS.lp(8).side.goats ? 0.6 : 0.3 }, this.week, 12);
      this.water += irr * 0.1; // 100 m² → 1 mm = 0.1 m³
    });
    this.hist.push(this.plots.map(p => ({ h: p.health, e: p.ECe })));
    this.week++;
    if (this.week >= 12) this.evaluate();
  },
  evaluate() {
    const ph = this.phase;
    let ok, txt;
    if (ph === 'guided' || (ph === 'free' && !this.plots)) {
      const b = this.blend();
      ok = b.ec < 1.0 && b.boron < 0.75 && b.infil < 0.3;
      txt = ok ? 'Mezcla adecuada para fríjol: ECw ' + fmt(b.ec, 2) + ' dS/m, boro ' + fmt(b.boron, 2) + ' mg/L, SAR ' + fmt(b.sar, 1) + ', riesgo de infiltración ' + fmt0(b.infil * 100) + ' %. El agua potable sola no era la mejor para regar.' : b.boron >= 0.75 ? 'Boro ' + fmt(b.boron, 2) + ' mg/L: el fríjol es sensible. ¿Qué fuente no trae boro?' : b.ec >= 1.0 ? 'ECw ' + fmt(b.ec, 2) + ' dS/m: demasiada sal para el fríjol.' : 'Riesgo de infiltración ' + fmt0(b.infil * 100) + ' %: agua muy pura con sodio relativo alto sella el suelo. ¿Calcio (yeso)?';
      if (ph === 'guided') this.evidence('lv8_guided_mezcla', ok, { solo: 3, misconception: ok ? null : 'asumir que agua potable siempre es ideal para riego' });
      this.blendOut = { f: Object.assign({}, this.f), gyp: this.gyp };
      this.result = { blend: this.blendOut };
    } else {
      const crops = new Set(this.plotsCfg.map(c => c.crop));
      const yields = this.plots.map(p => p.yieldAcc);
      const minY = Math.min(...yields), salty = this.plots.filter(p => p.ECe > CROPS[p.crop].ecT + 1.5);
      ok = minY >= (ph === 'transfer' ? 0.55 : 0.65) && this.water <= this.budget && crops.size >= 3 && salty.length === 0;
      const prod = this.plots.reduce((a, p) => a + p.yieldAcc * CROPS[p.crop].kgPerM2 * 100, 0);
      const wp = this.water > 0 ? prod / this.water : 0;
      txt = ok ? 'Temporada sostenida: rendimiento mínimo ' + fmt0(minY * 100) + ' %, agua ' + fmt0(this.water) + ' m³, productividad hídrica ' + fmt(wp, 1) + ' kg/m³, ' + crops.size + ' cultivos distintos y suelo bajo control.' : this.water > this.budget ? 'Agua usada ' + fmt0(this.water) + ' m³ > presupuesto ' + this.budget + ' m³. ¿Cobertura? ¿Riego nocturno?' : salty.length ? 'El suelo de la parcela de ' + CROPS[salty[0].crop].name.toLowerCase() + ' acumuló sal (ECe ' + fmt(salty[0].ECe, 1) + '). ¿Lavado ocasional? ¿Cultivo más tolerante?' : crops.size < 3 ? 'Poca diversidad: el monocultivo es frágil.' : 'Rendimiento mínimo ' + fmt0(minY * 100) + ' %. Mira los sensores de suelo, no el color.';
      this.evidence(ph === 'transfer' ? 'lv8_transfer_sequia' : 'lv8_guardian_cosecha_transparente', ok, { solo: ph === 'transfer' ? 5 : 4, transfer: ph === 'transfer', misconception: ok ? null : 'evaluar solo volumen y no calidad' });
    }
    this.verdict = { ok, txt }; this.done = true; this.running = false;
    Audio2.sfx(ok ? 'success' : 'error');
  },
  finish(ok) { Game.pop(); this.onDone && this.onDone(Object.assign({ ok }, this.result || {})); },
  draw(g) {
    const ph = this.phase, X0 = 8, Y0 = 28;
    Gui.begin();
    if (ph === 'demo') this.drawDemo(g, X0, Y0);
    if (ph === 'guided' || ph === 'free') this.drawBlend(g, X0, Y0);
    if (ph === 'auto' || ph === 'transfer') this.drawSeason(g, X0, Y0);
    if (this.verdict) {
      const v = this.verdict;
      const vh = textHeight(v.txt, 360) + 30;
      UIK.panel(g, 10, H - vh - 8, 380, vh, v.ok ? 'green' : 'alert');
      drawTextBlock(g, v.txt, 18, H - vh - 2, 364, { color: '#fffaf0' });
      if (v.ok) { if (Gui.button(g, 'nxt', 284, H - 28, 100, 16, ph === this.stopAfter ? 'Terminar' : 'Continuar', { style: 'good', icon: 'play' })) { if (ph === this.stopAfter) this.finish(true); else this.nextPhase(); } }
      else if (Gui.button(g, 'rt', 284, H - 28, 100, 16, 'Reintentar', { style: 'gold', icon: 'reset' })) { this.attempts++; GS.s.stats.retries++; this.verdict = null; this.done = false; if (ph === 'auto' || ph === 'transfer') this.resetPlots(); }
    }
    Gui.end();
  },
  drawDemo(g, x, y) {
    const k = clamp(this.dT / 8, 0, 1);
    frect(g, x, y, 400, 230, '#0e2a1e');
    // perfil de suelo con sal que se acumula
    for (let yy = 0; yy < 120; yy++) { const t = yy / 120; frect(g, x + 40, y + 100 + yy, 320, 1, mixHex('#7a4e2e', '#3a2418', t)); }
    for (let i = 0; i < 80 * k; i++) fpx(g, x + 40 + ((i * 53) % 320), y + 104 + ((i * 29) % 60), '#ffffff');
    // planta (siempre verde) con raíces
    const cx = x + 200;
    frect(g, cx - 1, y + 40, 3, 60, '#1f854c');
    for (let i = 0; i < 6; i++) { const ly = y + 50 + i * 8; fline(g, cx, ly, cx + (i % 2 ? 22 : -22), ly - 6, '#33a552'); fline(g, cx, ly + 1, cx + (i % 2 ? 20 : -20), ly - 4, '#86e36f'); }
    for (let i = 0; i < 7; i++) fline(g, cx, y + 100, cx - 40 + i * 13, y + 150 + (i % 3) * 10, '#d8c098');
    // gotas que intentan entrar a la raíz y se frenan
    for (let i = 0; i < 12; i++) { const ph = ((this.t * 0.6 + i / 12) % 1); const dx = cx - 50 + (i * 9); const yy = y + 160 - ph * (50 * (1 - k * 0.7)); fdisc(g, dx, yy, 1.5, '#56e5ff'); }
    drawText(g, 'Humedad del suelo: alta', x + 50, y + 12, { color: '#56e5ff' });
    drawText(g, 'ECe del suelo: ' + fmt(lerp(1.2, 4.2, k), 1) + ' dS/m', x + 50, y + 26, { color: '#ff9a8a' });
    drawText(g, 'Hojas: verdes', x + 260, y + 12, { color: '#86e36f' });
    drawText(g, 'Rendimiento: ' + fmt0(lerp(100, 58, k)) + ' %', x + 260, y + 26, { color: k > 0.5 ? '#ff9a8a' : '#c2f58e' });
    const CX = 414, CW = W - CX - 6;
    UIK.panel(g, CX, 28, CW, 120, 'tech');
    drawTextBlock(g, 'ETc = Kc · ET0. En Aridia, ET0 ≈ 6,5 mm/día. El tomate en floración (Kc ≈ 1,15) pierde ≈ 7,5 mm/día. Con goteo (eficiencia ≈ 0,9) hay que aplicar ≈ 8,3 mm/día brutos.', CX + 8, 34, CW - 16, { font: 'tiny', color: '#cfd6f0' });
  },
  drawBlend(g, x, y) {
    const b = this.blend();
    // tres fuentes con sus barras de mezcla
    UIK.panel(g, x, y, 400, 230, 'tech');
    drawText(g, 'MEZCLA DE FUENTES PARA RIEGO', x + 8, y + 6, { font: 'tiny', color: '#ffe14d' });
    let yy = y + 18;
    const keys = ['perm', 'well', 'rain'];
    for (const k of keys) {
      const S = IRR_SOURCES[k];
      Icons.draw(g, k === 'rain' ? 'water' : k === 'perm' ? 'membrane' : 'salt', x + 8, yy + 6);
      const v = Gui.slider(g, 'src' + k, x + 28, yy, 240, this.f[k], 0, S.max, 0.05, { label: S.name, fmt: q => fmt0(q * 100) + ' %', disabled: this.done && this.phase !== 'free', color: S.col });
      if (v !== this.f[k]) { this.f[k] = v; const others = keys.filter(q => q !== k); const rest = Math.max(0, 1 - v); const sum = others.reduce((a, q) => a + this.f[q], 0) || 1; for (const q of others) this.f[q] = Math.min(IRR_SOURCES[q].max, this.f[q] / sum * rest); }
      drawText(g, 'EC ' + fmt(S.ec, 2) + ' · B ' + fmt(S.boron, 1) + ' · Na ' + S.na + ' · Ca+Mg ' + S.cam, x + 280, yy + 10, { font: 'tiny', color: '#cfd6f0' });
      yy += 30;
    }
    const gp = Gui.toggle(g, 'gyp', x + 28, yy + 4, 'Dosificar yeso (calcio)', this.gyp); if (!this.done || this.phase === 'free') this.gyp = gp;
    // resultado con semáforos
    const row = (label, val, ok, ry) => { fdisc(g, x + 18, ry + 4, 3, ok ? '#86e36f' : '#ff4e5d'); drawText(g, label + ': ' + val, x + 28, ry, { color: '#fffaf0' }); };
    row('ECw', fmt(b.ec, 2) + ' dS/m (< 1,0)', b.ec < 1.0, yy + 30);
    row('Boro', fmt(b.boron, 2) + ' mg/L (< 0,75 fríjol)', b.boron < 0.75, yy + 44);
    row('SAR', fmt(b.sar, 1) + ' · riesgo de infiltración ' + fmt0(b.infil * 100) + ' %', b.infil < 0.3, yy + 58);
    // dibujo de suelo según infiltración
    const sx = x + 280, sy = y + 128;
    frect(g, sx, sy, 110, 80, '#7a4e2e');
    const depth = Math.round((1 - b.infil) * 60);
    g.globalAlpha = 0.22; frect(g, sx, sy, 110, depth, '#56e5ff'); g.globalAlpha = 0.14; frect(g, sx, sy + Math.round(depth * 0.5), 110, depth - Math.round(depth * 0.5), '#2c8ad8'); g.globalAlpha = 1;
    if (b.infil > 0.3) { frect(g, sx, sy - 4, 110, 4, '#7fd0e8'); drawText(g, 'encharca', sx + 55, sy - 12, { font: 'tiny', align: 'center', color: '#ff9a8a' }); }
    drawText(g, 'Infiltración', sx + 55, sy + 84, { font: 'tiny', align: 'center', color: '#cfd6f0' });
    const CX = 414, CW = W - CX - 6;
    UIK.panel(g, CX, 28, CW, 120, 'glass');
    drawTextBlock(g, 'Calidad para riego (FAO-29, orientativo): la EC mide sales; el boro es tóxico en dosis bajas para cultivos sensibles; el SAR (sodio frente a calcio y magnesio) con agua muy pura sella el suelo. Los umbrales dependen de especie, suelo y manejo.', CX + 8, 34, CW - 16, { font: 'tiny', color: '#cfd6f0' });
    if (this.phase === 'guided' && !this.done && Gui.button(g, 'ev', CX + 8, 204, 100, 18, 'Evaluar mezcla', { style: 'good', icon: 'check' })) this.evaluate();
    if (Gui.button(g, 'hintb', CX + CW - 60, 204, 54, 18, 'Pista', { style: 'ghost', icon: 'hint' })) this.hint();
  },
  drawSeason(g, x, y) {
    const pw = 128;
    for (let i = 0; i < 3; i++) {
      const pl = this.plots[i], c = this.plotsCfg[i], px = x + i * (pw + 6), py = y;
      UIK.panel(g, px, py, pw, 230, 'tech');
      // planta dibujada según semana; el color solo refleja estrés hídrico (la sal es "transparente")
      const key = c.crop + '|' + this.week + '|' + Math.round((1 - (pl.visualGreen ?? 1)) * 4) + '|' + c.mulch;
      if (!pl._spr || pl._key !== key) { const pb = new PixelBuffer(pw - 8, 70); for (let k = 0; k < 4; k++) ART.crop(pb, 14 + k * 28, 64, c.crop, clamp(this.week / 10, 0.2, 1), i * 10 + k, 1 - (pl.visualGreen ?? 1)); if (c.mulch) for (let xx = 0; xx < pw - 8; xx += 2) pb.set(xx, 66, (xx % 6) ? '#c8a860' : '#a08040'); for (let xx = 0; xx < pw - 8; xx++) { pb.set(xx, 67, '#5a3a24'); pb.set(xx, 68, '#3a2418'); } pl._spr = pb.toCanvas(); pl._key = key; }
      g.drawImage(pl._spr, px + 4, py + 6);
      // sensores
      if (this.sensors) {
        const sal = clamp(pl.ECe / (CROPS[c.crop].ecT + 3), 0, 1);
        drawText(g, 'ECe ' + fmt(pl.ECe, 1) + ' dS/m', px + 6, py + 80, { font: 'tiny', color: pl.ECe > CROPS[c.crop].ecT ? '#ff9a8a' : '#86e36f' });
        UIK.bar(g, px + 6, py + 88, pw - 12, 4, sal, sal > 0.5 ? '#ff9a8a' : '#86e36f');
        drawText(g, 'Humedad ' + fmt0((pl.theta || 0) * 100) + ' %', px + 6, py + 95, { font: 'tiny', color: '#56e5ff' });
        drawText(g, 'Salud ' + fmt0((pl.health ?? 1) * 100) + ' %', px + 6, py + 104, { font: 'tiny', color: '#fffaf0' });
      } else drawText(g, 'Apariencia: verde', px + 6, py + 86, { font: 'tiny', color: '#86e36f' });
      // controles por parcela
      const lock = this.running || this.done;
      if (Gui.button(g, 'crop' + i, px + 6, py + 116, pw - 12, 16, CROPS[c.crop].name, { style: 'ghost', disabled: lock, tip: 'Cambiar cultivo' })) { c.crop = AGRO_CROPS[(AGRO_CROPS.indexOf(c.crop) + 1) % AGRO_CROPS.length]; pl._key = null; }
      c.irr = Gui.slider(g, 'irr' + i, px + 6, py + 136, pw - 12, c.irr, 10, 70, 5, { label: 'Riego', unit: 'mm/sem', disabled: lock, color: '#56e5ff' });
      const m = Gui.toggle(g, 'mul' + i, px + 6, py + 162, 'Cobertura', c.mulch); if (!lock) c.mulch = m;
      const n = Gui.toggle(g, 'ngt' + i, px + 6, py + 178, 'Riego nocturno', c.night); if (!lock) c.night = n;
      const l = Gui.toggle(g, 'lea' + i, px + 6, py + 194, 'Lavado periódico', c.leach); if (!lock) c.leach = l;
      drawText(g, 'Kc · ET0 = ' + fmt(AgroModel.kcAt(c.crop, Math.min(this.week, 11)) * this.ET0 * 7 * (c.mulch ? 0.85 : 1), 0) + ' mm/sem', px + 6, py + 212, { font: 'tiny', color: '#cfd6f0' });
    }
    const CX = 414, CW = W - CX - 6;
    UIK.panel(g, CX, 28, CW, 230, 'glass');
    drawText(g, 'TEMPORADA · semana ' + this.week + ' / 12', CX + 8, 34, { color: '#ffe14d' });
    drawText(g, 'Agua: ' + fmt0(this.water) + ' / ' + this.budget + ' m³', CX + 8, 48, { color: this.water > this.budget ? '#ff4e5d' : '#56e5ff' });
    const b = this.blend();
    drawText(g, 'Mezcla: EC ' + fmt(b.ec, 2) + ' · B ' + fmt(b.boron, 2) + ' · SAR ' + fmt(b.sar, 1), CX + 8, 62, { font: 'tiny', color: '#cfd6f0' });
    drawText(g, 'Diversidad: ' + new Set(this.plotsCfg.map(c => c.crop)).size + ' cultivos', CX + 8, 72, { font: 'tiny', color: '#86e36f' });
    const se = Gui.toggle(g, 'sens', CX + 8, 86, 'Sensores de suelo', this.sensors); this.sensors = se;
    if (this.hist.length) {
      const series = [0, 1, 2].map(i => ({ data: this.hist.map((hh, w) => [w + 1, hh[i].h * 100]), color: ['#ffe14d', '#ff4e5d', '#b86f44'][i], label: CROPS[this.plotsCfg[i].crop].name }));
      Charts.line(g, CX + 4, 106, CW - 8, 90, series, { xMin: 0, xMax: 12, yMin: 0, yMax: 100, legend: true, xLabel: 'sem' });
    }
    if (!this.running && !this.done && Gui.button(g, 'go', CX + 8, 236, 120, 18, 'Iniciar temporada', { style: 'good', icon: 'play' })) { this.resetPlots(); this.running = true; }
  },
});
