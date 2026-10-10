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
  /* plano jugable con kit PF al atardecer (19q_scb_lv11.js): mismo suelo, actores y guion */
  pf: SCBL11.pf,
  labels: SCBL11.labels,
  props(pb, world) { SCBL11.props(pb, world); },
  propsFront(pb, world) { SCBL11.propsFront(pb, world); },
  renderBack(g, sc, cam) { SCBL11.renderBack(g, sc, cam); },
  renderMid(g, sc, cam) {
    const S = sc.state, t = Game.time, ox = cam.x, oy = cam.y;
    SCBL11.renderMidFx(g, sc, cam);
    // pantalla: SYNARA 2.0 (el título que no cabe) → MOSAICO proyecta al final
    const x = 722 - ox, y = 292 - 118 - oy;
    if (x < -180 || x > W + 10) return;
    SCBEpi.drawScreen(g, S, x, y, t); // 19p_scb_epi.js: panel en vivo · título que desborda · SYNARA 2.0 · MOSAICO
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

const BlankScene = { enter() { }, update() { }, render(g) { SCBEpi.drawBlank(g, Game.time); } };

/* ---------------------------------------------------------------------
   Poscréditos: una variable desconocida en el vivero
   --------------------------------------------------------------------- */
const PostCreditsScene = {
  enter() {
    this.t = 0; this.i = 0; this.ps = new Particles(120); Audio2.playMusic('oasis');
    this.lines = [['kiru', 'Amaya.'], ['amaya', '¿Qué ocurre?'], ['kiru', 'El sensor del vivero reporta una variable desconocida.'], ['amaya', '¿La eliminaste?'], ['kiru', 'Preparé té.']];
    this.lt = 0;
    this.art = SCBPost.make();
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
    // noche en el vivero (19o_scb_post.js): cielo estrellado, invernadero con luz cálida, faroles, luciérnagas
    if (!this.art) this.art = SCBPost.make();
    this.art.draw(g, t, { amayaExpr: this.i >= 4 ? 'smile' : 'surprised' });
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
