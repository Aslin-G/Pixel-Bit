/* =====================================================================
   4b_epilogue.js — FINALES, EPÍLOGO "LA PRIMERA COSECHA",
   CRÉDITOS FINALES Y ESCENA POSCRÉDITOS.
   Ningún final es punitivo: todos incluyen debrief y una oportunidad
   de aprendizaje (Biblia §46–47).
   ===================================================================== */

const ENDINGS = {
  mosaico: {
    title: 'Mosaico Resiliente', icon: 'mosaic', cols: ['#c2f58e', '#56e5ff', '#ffe14d'],
    text: 'SYNARA conserva sus capas: agua, energía, cultivos, ecosistemas y personas. Los datos comunitarios están en un registro público, KIRU recuerda todo y el consejo revisa los supuestos cada temporada.',
    pending: 'Mantener vivo el hábito: cada tormenta nueva trae variables que nadie modeló.',
  },
  pacto: {
    title: 'Pacto de Emergencia', icon: 'scale', cols: ['#ffe14d', '#ff9f43', '#56e5ff'],
    text: 'Los servicios esenciales se recuperaron y la ciudad firmó un pacto de prioridades. Quedan decisiones pendientes: tarifas, el contrato de H2 y cómo cuidar la memoria de los datos.',
    pending: 'Las decisiones pendientes están en un tablero público. Volver a los capítulos con menor dominio fortalecerá el pacto.',
  },
  tecnica: {
    title: 'Victoria Técnica', icon: 'gear', cols: ['#56e5ff', '#a6f4ff', '#ff9a8a'],
    text: 'La planta funciona y la Calima pasó sin apagones. Pero muchas voces no fueron escuchadas a tiempo: la comunidad exige revisar la gobernanza antes de la próxima temporada.',
    pending: 'La técnica resolvió el "cómo"; falta acordar el "para quién". Las misiones de la comunidad siguen abiertas en el mapa.',
  },
  deuda: {
    title: 'Deuda Ecológica', icon: 'mangrove', cols: ['#86e36f', '#bc3e92', '#ffb93b'],
    text: 'El servicio inmediato se salvó, pero con un costo ambiental: el manglar y la pesca cargaron parte de la crisis. El epílogo comienza con un plan de reparación.',
    pending: 'Restaurar el manglar, monitorear la salmuera y revisar la captación. Reparar también es aprender.',
  },
};
const ECO_MIS = ['creer que diluir equivale a desaparecer', 'ignorar el impacto ecológico de la captación', 'ignorar trayectoria y momento de la descarga', 'aceptar propuestas de cero impacto sin evidencia', 'reducir la agroecología a eficiencia técnica'];

function endingStats() {
  const s = GS.s, m = s.mastery || {};
  const avg = MASTERY_KEYS.reduce((a, k) => a + (m[k] || 0), 0) / MASTERY_KEYS.length;
  const sides = Object.values(s.levelProgress || {}).reduce((a, lp) => a + Object.values(lp.side || {}).filter(Boolean).length, 0);
  const eco = ['screens', 'lithium', 'birds', 'goats', 'seeds'].filter(k => Object.values(s.levelProgress || {}).some(lp => lp.side && lp.side[k])).length;
  const ecoMis = ECO_MIS.reduce((a, k) => a + ((s.misconceptions || {})[k] || 0), 0);
  const trust = (s.trust && s.trust.community) ?? 50;
  const backup = GS.flag('kiruBackupBuilt') || (s.echoes || []).length >= 12;
  return { avg, sides, eco, ecoMis, trust, backup, data: GS.flag('communityDataRestored'), echoes: (s.echoes || []).length, completed: (s.completed || []).length };
}
function computeEnding() {
  const st = endingStats();
  if (st.ecoMis >= 4 && st.eco <= 1) return 'deuda';
  if (st.data && st.backup && st.avg >= 55 && st.trust >= 50) return 'mosaico';
  if (st.trust < 45) return 'tecnica';
  return 'pacto';
}

function calHistory() {
  const d = GS.s.decisions || {}, F = (k) => GS.flag(k);
  return [
    [d.radioHonest !== false, d.radioHonest === false ? 'Prometiste por radio más de lo que sabías' : 'Dijiste por radio solo lo que sabías'],
    [!!d.consultMarea, d.consultMarea ? 'Consultaste a Tía Marea antes de decidir' : 'Decidiste la toma sin consultar a la pesca'],
    [F('discoveredLimenPurpose'), F('discoveredLimenPurpose') ? 'Entendiste por qué LIMEN detenía la planta' : 'LIMEN sigue siendo un misterio a medias'],
    [F('foundOutlierDeletion'), 'Encontraste los datos borrados como "outliers"'],
    [F('kiruBackupBuilt'), F('kiruBackupBuilt') ? 'Construiste respaldos para la memoria de KIRU' : 'KIRU perdió recuerdos pequeños; se los cuentan'],
    [F('rejectedSingleIndex'), 'Rechazaste el Índice Único de MIRAGE'],
    [F('communityDataRestored'), 'Devolviste los datos comunitarios al modelo'],
    [F('transformedMirage'), 'MIRAGE se transformó en MOSAICO'],
  ];
}

/* ---------------------------------------------------------------------
   Pantalla de final con debrief
   --------------------------------------------------------------------- */
const EndingScene = {
  enter(p) {
    this.id = p.ending || computeEnding(); this.E = ENDINGS[this.id]; this.t = 0; this.st = endingStats();
    this.ps = new Particles(300); Audio2.playMusic('ending');
    this.weak = LearningModel.weakest(3).map(k => MASTERY_LABELS[k]);
    this.art = SCBEnd.make(this.id);
    GS.s.ending = this.id; GS.save();
  },
  update(dt) { this.t += dt; this.ps.update(dt); if (Math.random() < 0.12) this.ps.emit('firefly', Math.random() * W, 70 + Math.random() * 80, 0, 0, 1); },
  render(g) {
    const E = this.E, t = this.t, st = this.st;
    // ilustración cinematográfica del final (kit VISTA + primer plano con personajes): 19n_scb_ending.js
    if (!this.art || this.art.id !== this.id) this.art = SCBEnd.make(this.id);
    this.art.draw(g, t);
    frect(g, 0, 164, W, H - 164, '#04142e');
    this.ps.render(g);
    // título del final
    drawText(g, 'FINAL', W / 2, 16, { align: 'center', font: 'tiny', color: '#fff6d8', shadow: '#2a1050' });
    drawTitleText(g, E.title, W / 2, 24, 3, [E.cols[0], E.cols[2], '#ffffff'], { align: 'center', shadow: '#140d26', depth: 2 });
    const x = 40, w = W - 80;
    UIK.panel(g, x, 164, w, H - 172, 'dialog');
    let yy = 172;
    yy += drawTextBlock(g, E.text, x + 10, yy, w - 20, { color: '#fffaf0' }) + 6;
    drawText(g, 'DEBRIEF', x + 10, yy, { font: 'tiny', color: '#ffe14d' }); yy += 10;
    const rows = [
      ['Dominio promedio', fmt0(st.avg) + ' / 100'], ['Capítulos completados', st.completed + ' / 11'], ['Misiones secundarias', String(st.sides)],
      ['Confianza comunitaria', fmt0(st.trust)], ['Ecos de KIRU', String(st.echoes)], ['Respaldo de memoria', st.backup ? 'sí' : 'no'],
    ];
    rows.forEach(([k, v], i) => { const cx = x + 10 + (i % 3) * 182, cy = yy + Math.floor(i / 3) * 10; drawText(g, k + ':', cx, cy, { font: 'tiny', color: '#cfd6f0' }); drawText(g, v, cx + 168, cy, { font: 'tiny', color: '#c2f58e', align: 'right' }); });
    yy += 24;
    yy += drawTextBlock(g, '{y}Pendiente:{/} ' + E.pending, x + 10, yy, w - 20, { color: '#fffaf0', font: 'tiny', lineH: 8 }) + 2;
    yy += drawTextBlock(g, '{y}Para seguir aprendiendo:{/} practica ' + this.weak.join(', ') + ' en el modo Práctica del mapa.', x + 10, yy, w - 20, { color: '#fffaf0', font: 'tiny', lineH: 8 }) + 6;
    drawText(g, 'TU HISTORIA', x + 10, yy, { font: 'tiny', color: '#ffe14d' }); yy += 10;
    calHistory().forEach(([ok, txt], i) => { const hx = x + 10 + (i % 2) * 272, hy = yy + Math.floor(i / 2) * 10; frect(g, hx, hy, 6, 6, ok ? '#1f854c' : '#6a3e0e'); fpx(g, hx + 2, hy + 3, '#fffaf0'); fpx(g, hx + 3, hy + 2, '#fffaf0'); drawText(g, txt, hx + 10, hy, { font: 'tiny', color: ok ? '#e6ffc0' : '#ffd8a0' }); });
    Gui.begin();
    if (this.t > 1.5 && Gui.button(g, 'go', x + w - 140, H - 30, 130, 18, 'Ir al epílogo', { style: 'good', icon: 'play' })) Game.transition(() => Game.setScene(GameplayScene, { level: 11 }));
    Gui.end();
  },
};

/* ---------------------------------------------------------------------
   Epílogo jugable: LA PRIMERA COSECHA (meses después, en la plaza)
   --------------------------------------------------------------------- */
LEVELS[11] = {
  id: 11, title: 'La Primera Cosecha', chapter: 'EPÍLOGO', biome: 'plaza', music: 'festival', width: 1500, height: 360,
  ambience: { sea: 0.4, wind: 0.2, birds: 0.8 },
  portraits: ['amaya', 'kiru', 'naira', 'dante', 'eliana', 'limen', 'mosaico', 'alma', 'consejal', 'marea', 'pastora', 'cobre', 'operador'],
  spawn: { x: 60, y: 292 },
  ground: [[0, 292], [1500, 292]],
  terrain: [{ x0: 0, x1: 1500, mat: 'plaza' }],
  cam: { look: 50, vy: 0.66 },
  props(pb, world) {
    const gy = 292, E = GS.s.ending || 'pacto';
    ART.bunting(pb, 20, 170, 700, 176, 14, ['#ff6b6b', '#ffe14d', '#20d6c7', '#86e36f', '#f78acb'], 2);
    ART.bunting(pb, 700, 176, 1400, 168, 14, ['#ffe14d', '#20d6c7', '#ff9f43', '#86e36f'], 5);
    // puestos de la primera cosecha con cestas
    const crops = ['maiz', 'frijol', 'ahuyama', 'tomate', 'aji', 'sorgo', 'nopal'];
    for (let k = 0; k < 3; k++) {
      const x = 120 + k * 120;
      ART.stall(pb, x, gy, 70, { c1: ['#ff6b6b', '#20d6c7', '#ffb93b'][k], c2: '#fffaf0', h: 44 });
      for (let j = 0; j < 4; j++) { const bx = x + 8 + j * 15; pb.ellipse(bx + 5, gy - 18, 6, 3, '#a87028'); pb.ellipse(bx + 5, gy - 20, 5, 2, ['#ffe14d', '#ff6b6b', '#86e36f', '#ff9f43'][(j + k) % 4]); }
    }
    for (let k = 0; k < 7; k++) ART.crop(pb, 500 + k * 18, gy, crops[k], 1, 70 + k, 0);
    ART.dripLine(pb, 496, 626, gy - 1, 9);
    drawSign(pb, 560, gy, 'PARCELA ESCOLAR', '#33a552');
    // panel público de SYNARA 2.0
    ART.bigScreen(pb, 720, gy, 170, 90);
    drawSign(pb, 900, gy, 'PANEL PÚBLICO', '#56e5ff');
    // laboratorio abierto a estudiantes
    pb.rect(1000, gy - 70, 150, 70, '#1c3a5a'); pb.rect(1000, gy - 70, 150, 3, '#56e5ff');
    for (let k = 0; k < 3; k++) { pb.rect(1012 + k * 46, gy - 58, 34, 24, '#0a1440'); pb.rect(1012 + k * 46, gy - 58, 34, 2, '#86e36f'); }
    drawSign(pb, 1075, gy - 70, 'LABORATORIO ABIERTO', '#86e36f');
    // variaciones según el final
    if (E === 'pacto') { pb.rect(1190, gy - 64, 80, 52, '#8a5e14'); pb.rect(1192, gy - 62, 76, 48, '#fff4de'); for (let k = 0; k < 8; k++) pb.rect(1196 + (k % 4) * 18, gy - 58 + Math.floor(k / 4) * 22, 14, 14, ['#ffe14d', '#ff9a8a', '#a6f4ff', '#c2f58e'][k % 4]); pb.rect(1228, gy - 12, 4, 12, '#5a3826'); drawSign(pb, 1230, gy - 64, 'DECISIONES PENDIENTES', '#ff9f43'); }
    if (E === 'tecnica') { pb.rect(1180, gy - 70, 100, 30, '#fffaf0'); pb.rect(1180, gy - 70, 100, 3, '#ff6b6b'); pb.rect(1184, gy - 40, 3, 40, '#5a3826'); pb.rect(1273, gy - 40, 3, 40, '#5a3826'); drawSign(pb, 1230, gy - 70, '¿QUIÉN DECIDE?', '#ff6b6b'); }
    if (E === 'deuda') { for (let k = 0; k < 4; k++) { pb.rect(1180 + k * 26, gy - 14, 22, 14, '#8a5e14'); ART.mangrove(pb, 1191 + k * 26, gy - 14, 14, 9 + k); } drawSign(pb, 1230, gy - 30, 'RESTAURACIÓN DEL MANGLAR', '#1f854c'); }
    if (E === 'mosaico') { for (let k = 0; k < 6; k++) pb.rect(1180 + k * 16, gy - 40, 14, 14, ['#20d6c7', '#ffe14d', '#4ccb70', '#ff6b6b', '#ffffff', '#c8861a'][k]); drawSign(pb, 1228, gy - 40, 'MOSAICO VIVO', '#1f854c'); }
    drawSign(pb, 1440, gy, 'MUELLE · MAR', '#1283bf');
  },
  renderMid(g, sc, cam) {
    const S = sc.state, t = Game.time, ox = cam.x, oy = cam.y;
    // pantalla: SYNARA 2.0 (el título que no cabe) → MOSAICO proyecta al final
    const x = 722 - ox, y = 292 - 118 - oy;
    if (x < -180 || x > W + 10) return;
    frect(g, x, y, 166, 86, '#05081d');
    if (S.mosaicProj) {
      const cols = ['#20d6c7', '#ffe14d', '#4ccb70', '#1f854c', '#f78acb', '#c8861a', '#b49cff'];
      for (let i = 0; i < 7; i++) fdither(g, x + 2, y + 2 + i * 11, 158, 9, cols[i], 0.3);
      ['INCERTIDUMBRE: VISIBLE', 'ALTERNATIVAS: 4', 'DECISIÓN: PENDIENTE', 'DE DELIBERACIÓN'].forEach((s2, i) => drawText(g, s2, x + 81, y + 14 + i * 14, { font: 'tiny', align: 'center', color: '#fffaf0', shadow: '#05081d' }));
    } else if (S.title2 === 2) {
      drawText(g, 'SYNARA 2.0', x + 81, y + 14, { align: 'center', color: '#56e5ff' });
      drawTextBlock(g, 'NINGÚN DATO ES RUIDO HASTA ENTENDER SU HISTORIA', x + 8, y + 32, 146, { font: 'tiny', color: '#ffe14d', align: 'center', lineH: 8 });
      for (let i = 0; i < 3; i++) frect(g, x + 20 + i * 44, y + 58, 34, 14, ['#1f854c', '#2c63c0', '#bc3e92'][i]);
      drawText(g, 'AGUA', x + 37, y + 62, { font: 'tiny', align: 'center', color: '#fffaf0' }); drawText(g, 'ENERGÍA', x + 81, y + 62, { font: 'tiny', align: 'center', color: '#fffaf0' }); drawText(g, 'SALMUERA', x + 125, y + 62, { font: 'tiny', align: 'center', color: '#fffaf0' });
    } else if (S.title2 === 1) {
      // el título no cabe: desborda la pantalla
      const msg = 'SYNARA 2.0 — NINGÚN DATO ES RUIDO HASTA ENTENDER SU HISTORIA';
      g.save(); g.beginPath(); g.rect(x - 34, y - 6, 166 + 68, 98); g.clip();
      drawTitleText(g, msg, x + 6 - ((t * 30) % 40), y + 30, 2, ['#fff6d8', '#ffe14d', '#ff9f43'], { shadow: '#05081d' });
      g.restore();
    } else {
      for (let i = 0; i < 4; i++) frect(g, x + 10, y + 12 + i * 16, 60 + ((i * 23 + Math.floor(t * 2)) % 80), 6, ['#86e36f', '#56e5ff', '#ffe14d', '#f78acb'][i]);
      drawText(g, 'PANEL PÚBLICO · EN VIVO', x + 81, y + 72, { font: 'tiny', align: 'center', color: '#a6f4ff' });
    }
    fdither(g, x, y, 166, 86, '#ffffff', 0.03);
  },
  setup(sc) {
    const S = sc.state, E = GS.s.ending || 'pacto';
    GS.s.unlocked = GS.s.unlocked.filter(i => i !== 11);
    Object.assign(S, { title2: 0, mosaicProj: false });
    const A = (id, ch, x, o) => sc.actor(id, ch, x, Object.assign({ facing: -1 }, o || {}));
    A('naira', 'naira', 690); A('dante', 'dante', 650, { facing: 1 }); A('eliana', 'eliana', 940);
    A('limen', 'limen', 980, { fly: true, y: 210, talkable: false });
    A('ruth', 'consejal', 300); A('celia', 'pastora', 420, { facing: 1 }); A('marea', 'marea', 1400); A('cobre', 'cobre', 230, { facing: 1 }); A('ivan', 'operador', 1100);
    A('nina', 'alma', 760, { facing: 1 });
    for (let k = 0; k < 6; k++) sc.actor('crowd' + k, 'crowd', 160 + k * 150 + (k % 2) * 40, { facing: k % 2 ? 1 : -1, variant: k + 3, wander: 20 });
    const W2 = (id) => sc.world.find(id);
    W2('ruth').onTalk = async (s2) => s2.say([['consejal', 'smile', 'El consejo ahora tiene sillas para comunidades, operadores, agricultura y ambiente. Las reuniones duran más. Las decisiones también.']]);
    W2('celia').onTalk = async (s2) => s2.say([['pastora', 'happy', 'Las rancherías del borde reciben el agua a la misma hora que la plaza. Eso también es una cosecha.']]);
    W2('marea').onTalk = async (s2) => s2.say(E === 'deuda' ? [['marea', 'determined', 'El manglar tardará en sanar. Pero esta vez lo medimos, lo plantamos y lo cuidamos juntos.']] : [['marea', 'happy', 'La boya del difusor reporta cada hora. Los peces no leen informes, pero volvieron.']]);
    W2('cobre').onTalk = async (s2) => s2.say([['cobre', 'smile', 'El H2 se produce cuando sobra sol o viento. Cuando no, descansa. Como yo.']]);
    W2('ivan').onTalk = async (s2) => s2.say([['operador', 'smile', 'El panel público muestra la turbidez en vivo. Hasta mi abuela me avisa cuando sube.']]);
    W2('eliana').onTalk = async (s2) => s2.say([['eliana', 'calm', 'Hablamos mucho, Amaya y yo. Todavía hablamos. Esa conversación es parte del diseño ahora.']]);
    W2('naira').onTalk = async (s2) => s2.say([['naira', 'smile', 'La confianza no se recupera con un discurso. Se recupera con datos que cualquiera puede revisar.']]);
    W2('dante').onTalk = async (s2) => s2.say([['dante', 'joy', 'Los estudiantes armaron un anemómetro con latas. Mide mejor que el mío. No se lo digas a nadie.']]);
    W2('nina').onTalk = async (s2) => s2.say([['alma', 'happy', '¡Sembré frijoles en la parcela escolar! Tienen sensor de humedad y todo.']]);
    sc.station({ id: 'stage', x: 800, kind: 'clue', label: 'Presentar SYNARA 2.0', glow: '#ffe14d', onUse: async (s2, st) => { st.done = true; await epilogueFinale(s2); } });
    sc.setObjective('Recorre la plaza y presenta SYNARA 2.0', ['El panel público está en el centro de la plaza.']);
    if (GS.s.kiruLoss) sc.timers.after(2.5, () => sc.kiru && sc.kiru.say('No recuerdo esta plaza… pero todos me la están contando. Con detalles innecesarios. Perfecto.', 'esperanzado', 6));
    else sc.timers.after(2.5, () => sc.kiru && sc.kiru.say('Recuerdo esta plaza: el festival, una cabra, un discurso. Hoy huele a cosecha.', 'happy', 5));
  },
};

async function epilogueFinale(sc) {
  const S = sc.state;
  await sc.say([['narr', null, 'Meses después. La planta opera con panel público, el consejo incluye comunidades, operadores, agricultura y ambiente, y los escenarios muestran su incertidumbre.']]);
  S.title2 = 1;
  await sc.say([
    ['amaya', 'proud', 'Les presento: SYNARA 2.0 — Ningún dato es ruido hasta entender su historia.'],
    ['naira', 'skeptical', 'Ese título no cabe en la pantalla.'],
    ['dante', 'thinking', 'Podemos reducir la fuente.'],
    ['kiru', 'determined', 'Prohibido optimizar legibilidad sin consulta pública.'],
  ]);
  S.title2 = 2;
  await sc.say([
    ['nino', 'thinking', '¿Entonces SYNARA ya no se equivoca?'],
    ['narr', null, 'Amaya mira a KIRU, a Eliana y al mar.'],
    ['amaya', 'calm', 'Se equivocará.'],
    ['nino', 'skeptical', '…'],
    ['amaya', 'smile', 'Pero ahora puede mostrar por qué decide, escuchar cuando algo no encaja y cambiar antes de convertir un error en una crisis.'],
  ]);
  S.mosaicProj = true; Audio2.sfx('unlock');
  await sc.say([['mosaico', 'calm', 'INCERTIDUMBRE: VISIBLE. ALTERNATIVAS: 4. DECISIÓN: PENDIENTE DE DELIBERACIÓN.']]);
  await sc.wait(1.2);
  GS.s.stats.finished = true; GS.save();
  Game.transition(() => { Game.setScene(BlankScene, {}); Game.push(CreditsScene, { final: true, onDone: () => Game.setScene(PostCreditsScene, {}) }); }, '#05030f', 1.2);
}

const BlankScene = { enter() { }, update() { }, render(g) { frect(g, 0, 0, W, H, '#05030f'); } };

/* ---------------------------------------------------------------------
   Poscréditos: una variable desconocida en el vivero
   --------------------------------------------------------------------- */
const PostCreditsScene = {
  enter() {
    this.t = 0; this.i = 0; this.ps = new Particles(120); Audio2.playMusic('oasis');
    this.lines = [['kiru', 'Amaya.'], ['amaya', '¿Qué ocurre?'], ['kiru', 'El sensor del vivero reporta una variable desconocida.'], ['amaya', '¿La eliminaste?'], ['kiru', 'Preparé té.']];
    this.lt = 0;
  },
  update(dt) {
    this.t += dt; this.lt += dt; this.ps.update(dt);
    if (Math.random() < 0.15) this.ps.emit('firefly', 120 + Math.random() * 400, 140 + Math.random() * 120, 0, 0, 1);
    if ((Input.pressed('confirm') || Input.pointer.pressed) && this.lt > 0.5) { this.i++; this.lt = 0; if (this.i === this.lines.length - 1) Audio2.sfx('success'); }
    if (this.lt > 4) { this.i++; this.lt = 0; }
    if (this.i >= this.lines.length + 1) { Game.transition(() => Game.setScene(WorldMapScene, { focus: 10 })); this.i = -99; }
  },
  render(g) {
    const t = this.t;
    // noche en el vivero
    for (let y = 0; y < H; y++) frect(g, 0, y, W, 1, mixHex('#05081d', '#1a1a4a', y / H));
    for (let i = 0; i < 60; i++) fpx(g, hash1(i, 1) * W, hash1(i, 2) * 160, (Math.floor(t * 2 + i) % 7) ? '#cfd6f0' : '#ffffff');
    fdisc(g, 520, 60, 12, '#fff6d8'); fdisc(g, 525, 57, 11, '#1a1a4a');
    // colinas con las luces de Aridia a lo lejos
    for (let x = 0; x < W; x += 2) { const hh = 26 + Math.round(12 * Math.sin(x * 0.013) + 6 * Math.sin(x * 0.041)); frect(g, x, 270 - hh, 2, hh, '#141a3a'); }
    for (let i = 0; i < 40; i++) { const lx = (i * 97) % W, ly = 270 - 10 - (i * 13) % 18; fpx(g, lx, ly, (Math.floor(t + i) % 9) ? '#ffd86a' : '#ff9f43'); }
    for (let k = 0; k < 3; k++) { const tx = 80 + k * 240; frect(g, tx - 1, 200, 3, 70, '#2a2a5a'); fdisc(g, tx, 200, 3, '#56e5ff'); }
    frect(g, 0, 270, W, H - 270, '#0e1a12'); fdither(g, 0, 270, W, 8, '#1f3a24', 0.5);
    for (let x = 6; x < W; x += 11) { const hh = 2 + (x * 7) % 4; frect(g, x, 270 - hh, 1, hh, '#1f5a34'); fpx(g, x + 1, 270 - hh + 1, '#2f7a44'); }
    // farol junto a Amaya
    frect(g, 178, 196, 2, 74, '#3a3a5a'); frect(g, 176, 196, 6, 2, '#5a5a7a'); fdisc(g, 179, 194, 3, '#ffe8a0'); PFK.drawGlow(g, 179, 194, 30, '#ffd86a', 0.35);
    // casa de sombra
    frect(g, 300, 178, 200, 4, '#3a4a3a'); for (let k = 0; k < 6; k++) frect(g, 300 + k * 39, 178, 3, 92, '#2a3a2a'); fdither(g, 300, 182, 200, 88, '#1a2a1a', 0.5);
    for (let k = 0; k < 8; k++) { const x = 312 + k * 23, hh = 12 + (k * 5) % 10; frect(g, x, 270 - hh, 2, hh, '#1f854c'); fpx(g, x - 1, 270 - hh, '#4ccb70'); fpx(g, x + 2, 270 - hh + 2, '#4ccb70'); }
    // sensor con la alarma
    frect(g, 456, 226, 2, 44, '#8a8fb8'); const on = Math.floor(t * 3) % 2; fdisc(g, 457, 224, 3, on ? '#ffe14d' : '#6a5a10'); if (on) PFK.drawGlow(g, 457, 224, 14, '#ffe14d', 0.4);
    // Amaya y KIRU
    drawChar(g, 'amaya', 'idle', t, 220, 270, 1, { expr: this.i >= 4 ? 'smile' : 'surprised' });
    drawChar(g, 'kiru', 'idle', t, 260, 270, -1, {});
    // taza de té con vapor
    frect(g, 225, 238, 7, 6, '#fff6d8'); frect(g, 232, 239, 2, 3, '#fff6d8'); frect(g, 225, 243, 7, 1, '#cfc4a8'); for (let i = 0; i < 3; i++) fpx(g, 228 + Math.round(Math.sin(t * 3 + i) * 1.5), 234 - i * 3 - Math.floor((t * 4) % 3), '#cfd6f0'); // taza en la mano de Amaya (sprite de 74 px)
    this.ps.render(g);
    const L = this.lines[Math.min(this.i, this.lines.length - 1)];
    if (this.i >= 0 && this.i < this.lines.length) {
      const sp = SPEAKERS[L[0]];
      UIK.panel(g, 120, 300, 400, 40, 'dialog');
      drawText(g, sp.name, 130, 306, { font: 'tiny', color: sp.color });
      drawText(g, L[1], 130, 318, { color: '#fffaf0', max: Math.floor(this.lt * 40) });
    }
    if (this.i >= this.lines.length) drawText(g, 'FIN', W / 2, 160, { align: 'center', color: '#fff6d8' });
  },
};
