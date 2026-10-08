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
  water: [{ x0: 1180, x1: 1260, y: 282, tint: '#20d6c7', deep: '#0f6a7a' }],
  platforms: [{ x: 1010, y: 236, w: 140, type: 'wood' }, { x: 2380, y: 214, w: 70, type: 'wood' }, { x: 2470, y: 188, w: 60, type: 'wood' }],
  ladders: [{ x: 1020, y0: 236, y1: 284 }],
  cam: { look: 50, vy: 0.66 },
  /* ---------------- accesorios estáticos ---------------- */
  props(pb, world) {
    const gy = (x) => world.groundAt(x);
    for (let x = 20; x < 300; x += 40) ART.cactus(pb, x, gy(x) + 1, 18 + (x % 3) * 5, x);
    drawSign(pb, 250, gy(250), 'OASIS DE LAS RAÍCES', '#33a552');
    ART.palm(pb, 330, gy(330), 56, -5, 21); ART.palm(pb, 880, gy(880), 60, 6, 22);
    // parcelas en terraza con goteo y cultivos asociados (milpa)
    const plots = [[380, ['maiz', 'frijol', 'ahuyama', 'maiz', 'frijol', 'ahuyama', 'maiz']], [560, ['tomate', 'aji', 'tomate', 'aji', 'tomate', 'aji']], [730, ['sorgo', 'nopal', 'sorgo', 'nopal', 'sorgo']]];
    for (const [x0, crops] of plots) {
      // cantero elevado de tierra oscura para contraste
      for (let x = x0 - 8; x < x0 + 146; x++) for (let y = gy(x0) - 9; y < gy(x0); y++) pb.set(x, y, (y === gy(x0) - 9) ? '#8a5a3c' : rampDither(['#3a2418', '#5a3a24', '#7a4e2e'], (y - gy(x0) + 9) / 9, x, y));
      for (const px of [x0 - 8, x0 + 145]) pb.vline(px, gy(x0) - 22, gy(x0), '#8a5a3c');
      pb.rect(x0 - 6, gy(x0) - 3, 150, 3, '#a04a22'); pb.hline(x0 - 6, x0 + 143, gy(x0) - 3, '#c9622e');
      ART.dripLine(pb, x0, x0 + 140, gy(x0) - 10, 10);
      crops.forEach((c, i) => ART.crop(pb, x0 + 8 + i * 20, gy(x0) - 9, c, 1, x0 + i));
      // cobertura (mulch) en la primera parcela
      if (x0 === 380) for (let x = x0; x < x0 + 140; x += 2) pb.set(x, gy(x0) - 3, (x % 6) ? '#c8a860' : '#a08040');
    }
    drawSign(pb, 450, gy(450), 'MILPA', '#33a552'); drawSign(pb, 630, gy(630), 'HUERTA', '#ff4e5d'); drawSign(pb, 800, gy(800), 'SECANO', '#c97c38');
    // vivero de Alma (casa-malla)
    ART.shadeHouse(pb, 920, gy(920), 80, 46);
    for (let k = 0; k < 8; k++) { pb.rect(926 + k * 9, gy(920) - 8, 6, 6, '#c9622e'); ART.crop(pb, 929 + k * 9, gy(920) - 8, ['tomate', 'aji', 'frijol', 'maiz'][k % 4], 0.35, k); }
    // banco de semillas (adobe con puertas de colores)
    const bx = 1010;
    pb.rect(bx, 236, 140, 48, '#d8a070'); pb.rect(bx, 236, 140, 3, '#f2c48a'); pb.rect(bx + 136, 236, 4, 48, '#a06a3a');
    for (let k = 0; k < 4; k++) { pb.rect(bx + 12 + k * 32, 250, 16, 34, ['#20d6c7', '#ff6b6b', '#ffe14d', '#8d6bff'][k]); pb.rect(bx + 12 + k * 32, 250, 16, 2, '#fffaf0'); }
    drawSign(pb, bx + 70, 236, 'BANCO DE SEMILLAS', '#c9622e');
    // nodo hidráulico: pozo 4, tanque de permeado, cisterna de lluvia y mezclador
    const hx = 1300;
    pb.rect(hx, gy(hx) - 26, 24, 26, '#8a6a4a'); pb.rect(hx - 2, gy(hx) - 30, 28, 4, '#6a4a2a'); pb.vline(hx + 12, gy(hx) - 56, gy(hx) - 30, '#5a3826'); pb.rect(hx + 4, gy(hx) - 58, 16, 3, '#5a3826');
    drawSign(pb, hx + 12, gy(hx) - 58, 'POZO 4', '#c97c38');
    ART.tank(pb, hx + 50, gy(hx), 28, 56, RAMP.steelW, { band: '#56e5ff', label: true });
    pb.rect(hx + 100, gy(hx) - 22, 44, 22, '#a9bbd6'); pb.rect(hx + 102, gy(hx) - 20, 40, 6, '#20d6c7'); drawSign(pb, hx + 122, gy(hx) - 22, 'CISTERNA', '#33a552');
    pb.rect(hx + 160, gy(hx) - 40, 30, 40, '#e8f0f4'); pb.rect(hx + 160, gy(hx) - 40, 30, 3, '#86e36f'); drawSign(pb, hx + 175, gy(hx) - 40, 'MEZCLA', '#33a552');
    ART.pipe(pb, hx + 24, gy(hx) - 10, hx + 160, gy(hx) - 10, 2, 'irrigation');
    ART.pipe(pb, hx + 190, gy(hx) - 10, hx + 400, gy(hx) - 10, 2, 'irrigation');
    // pastizal de Doña Celia y corredor de flores
    for (let x = 1600; x < 2200; x += 6) { const k = hash2(x, 1, 8); if (k < 0.25) { pb.set(x, gy(x) - 3, '#ffe14d'); pb.vline(x, gy(x) - 2, gy(x) - 1, '#33a552'); } else if (k < 0.4) { pb.set(x, gy(x) - 4, '#b49cff'); pb.vline(x, gy(x) - 3, gy(x) - 1, '#33a552'); } }
    pb.rect(1900, gy(1900) - 10, 40, 10, '#8a6a4a'); pb.rect(1902, gy(1900) - 8, 36, 4, '#20d6c7'); drawSign(pb, 1920, gy(1920) - 10, 'BEBEDERO', '#8a6a4a');
    // árbol antiguo (cují) donde KIRU abre su memoria
    const tx = 2420;
    ART.tree(pb, tx, gy(tx), 120, 9, RAMP.leaf, ['#3a2218', '#5a3826', '#7a5236', '#9a6e4a']);
    for (let i = 0; i < 6; i++) pb.line(tx - 20 + i * 8, gy(tx), tx - 30 + i * 12, gy(tx) + 6, '#5a3826');
    drawSign(pb, 2700, gy(2700), 'MESA DEL NEXO', '#2152b5');
  },
  propsFront(pb, world) { for (let x = 300; x < 2800; x += 5) if ((x * 13) % 7 < 2) ART.grass(pb, x, world.groundAt(x) + 2, 2, x, RAMP.leaf); },
  /* ---------------- dinámico ---------------- */
  renderMid(g, sc, cam) {
    const S = sc.state, t = Game.time, w = sc.world, ox = cam.x, oy = cam.y;
    const gy = (x) => w.groundAt(x) - oy;
    for (const x0 of [380, 560, 730]) drawDrips(g, x0 - ox, x0 + 140 - ox, gy(x0) - 10, t, true, 10);
    // estrés invisible: con el Mapa de Raíces se ve la sal en el suelo
    if (S.rootsView) for (const [x0, k] of [[380, 0.3], [560, 0.7], [730, 0.2]]) { for (let x = x0; x < x0 + 140; x += 3) { const d = 4 + Math.round(Math.sin(x * 0.2) * 3) + 10; frect(g, x - ox, gy(x0) + 2, 1, d, '#c9a46a'); if (hash2(x, 3, 1) < k) fpx(g, x - ox, gy(x0) + 6 + (x % 7), '#ffffff'); } }
    // cabras de Doña Celia
    for (let i = 0; i < 5; i++) { const gx = 1700 + i * 34 + Math.sin(t * 0.4 + i) * 16 - ox, gyy = gy(1700 + i * 34) ; drawGoat(g, gx, gyy, t + i, i % 2 ? 1 : -1); }
    // mariposas y abejas en el corredor
    for (let i = 0; i < 10; i++) { const bx = 1600 + ((t * 20 + i * 61) % 600) - ox, by = gy(1600) - 14 - Math.abs(Math.sin(t * 3 + i)) * 10; fpx(g, bx, by, i % 2 ? '#ffe14d' : '#b49cff'); fpx(g, bx + 1, by - (Math.floor(t * 8 + i) % 2), i % 2 ? '#fff6a0' : '#e0d8ff'); }
    // brillo del compartimento de KIRU en el árbol
    if (S.memGlow) fdither(g, 2400 - ox, gy(2420) - 60, 40, 40, '#b49cff', 0.2 + 0.1 * Math.sin(t * 4));
    // flujo de riego por el nodo hidráulico
    Charts.flow(g, [[1324 - ox, gy(1300) - 10], [1460 - ox, gy(1300) - 10]], 'irrigation', 1, 2);
    Charts.flow(g, [[1490 - ox, gy(1300) - 10], [1700 - ox, gy(1300) - 10]], 'irrigation', 1, 2);
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
    sc.station({ id: 'tree', x: 2420, kind: 'clue', label: 'El cují antiguo', glow: '#b49cff', hidden: true, onUse: async (sc2, st) => { st.done = true; await kiruMemoryScene(sc2); } });
    sc.station({ id: 'solo', x: 2560, kind: 'solo', label: 'Puerta de Evidencia', glow: '#b49cff', hidden: true, onUse: async (sc2, st) => {
      const r = await sc2.open(SOLOScene, { ctx: 'RA-07-C1' });
      st.progress = r.correct; if (r.correct >= 3) { st.done = true; GS.lp(8).solo = true; S.soloDone = true; Codex.unlock('calidad_riego'); }
    } });
    sc.station({ id: 'exit', x: 2740, kind: 'clue', label: 'Ir a la Mesa del Nexo', glow: '#ffe14d', hidden: true, onUse: async (sc2) => finishLevel8(sc2) });
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

function drawGoat(g, x, y, t, dir) {
  x = Math.round(x); y = Math.round(y);
  const bob = Math.floor(t * 4) % 2;
  frect(g, x - 5, y - 8 - bob, 10, 5, '#f2e2c4'); frect(g, x - 5, y - 8 - bob, 10, 1, '#fffaf0'); frect(g, x - 4, y - 4, 1, 4, '#8a6a4a'); frect(g, x + 3, y - 4, 1, 4, '#8a6a4a');
  const hx = x + dir * 6;
  frect(g, hx - 2, y - 11 - bob, 4, 4, '#e8d0a8'); fpx(g, hx + dir, y - 10 - bob, '#140d26'); fpx(g, hx - dir, y - 12 - bob, '#8a6a4a'); fpx(g, hx, y - 7 - bob, '#d8c098');
  fpx(g, x - dir * 6, y - 8 - bob, '#d8c098');
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
    fdither(g, sx, sy, 110, depth, '#56e5ff', 0.35);
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
