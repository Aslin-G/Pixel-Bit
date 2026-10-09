/* =====================================================================
   21_learning.js — Modelo de dominio, motor SOLO, pistas, feedback,
   metacognición, analítica local y micro-retos de adversarios.
   ===================================================================== */

/** Adversario conceptual: concepción errónea encarnada; se disuelve corrigiéndola */
const ADVERSARIES = {
  fouler: { name: 'Fouler', col: ['#3a2a10', '#6a5020', '#9a7a3a', '#c8a860'], desc: 'Oscurece sensores y aumenta la pérdida de carga.' },
  scale: { name: 'Scale Wisp', col: ['#5c2550', '#b44d88', '#ffd8ec', '#ffffff'], desc: 'Cristaliza cuando se fuerzan los límites.' },
  saltMirage: { name: 'Salt Mirage', col: ['#621a66', '#bc3e92', '#f888b8', '#ffc4dc'], desc: 'Hace parecer que diluir equivale a desaparecer.' },
  peak: { name: 'Peak Sprite', col: ['#8a5e14', '#e0b41e', '#ffe14d', '#fffbd0'], desc: 'Confunde potencia máxima con energía diaria.' },
  gust: { name: 'Gust Loop', col: ['#3a4a6e', '#8396ba', '#cbdaea', '#ffffff'], desc: 'Extrapola el viento sin respetar el cut-out.' },
  socEater: { name: 'SOC Eater', col: ['#1a1240', '#5a38b8', '#b6f05a', '#e6ffc0'], desc: 'Vacía la reserva por un beneficio inmediato.' },
  greenwash: { name: 'Greenwash Phantom', col: ['#0e3a1c', '#2e8a4e', '#86e36f', '#e6ffc0'], desc: 'Etiqueta el H2 como verde sin verificar la electricidad.' },
  monoscore: { name: 'MonoScore', col: ['#3a2208', '#c8861a', '#ffd84a', '#ffffff'], desc: 'Oculta criterios dentro de una única puntuación.' },
};

const MASTERY_KEYS = ['systemsThinking', 'waterQuality', 'pretreatment', 'reverseOsmosis', 'massBalance', 'brine', 'photovoltaics', 'wind', 'battery', 'microgrid', 'electrolysis', 'hydrogenSafety', 'irrigationQuality', 'agroecology', 'waterProductivity', 'economics', 'multiobjective', 'steamInquiry', 'communication', 'ethics'];
const MASTERY_LABELS = {
  systemsThinking: 'Pensamiento sistémico', waterQuality: 'Calidad de agua', pretreatment: 'Captación y pretratamiento', reverseOsmosis: 'Ósmosis inversa', massBalance: 'Balances de masa', brine: 'Salmuera', photovoltaics: 'Fotovoltaica', wind: 'Eólica', battery: 'Baterías (BESS)', microgrid: 'Microred y despacho', electrolysis: 'Electrólisis', hydrogenSafety: 'Seguridad H2', irrigationQuality: 'Calidad para riego', agroecology: 'Agroecología', waterProductivity: 'Productividad hídrica', economics: 'Economía', multiobjective: 'Multiobjetivo', steamInquiry: 'Indagación STEAM', communication: 'Comunicación', ethics: 'Ética y gobernanza',
};
const SOLO_NAMES = ['', 'Preestructural', 'Uniestructural', 'Multiestructural', 'Relacional', 'Abstracto extendido'];
const SOLO_TASKS = ['', 'Identificar la interpretación o decisión que no se sostiene con los datos.', 'Aplicar un concepto, indicador, unidad o regla central.', 'Usar varios datos para calcular, comparar o clasificar.', 'Integrar variables, restricciones y consecuencias para justificar una decisión.', 'Transferir el razonamiento y diseñar una estrategia robusta para un escenario nuevo.'];
const RA = {
  'RA-01': 'Analiza la calidad del agua de alimentación y selecciona estrategias de captación y pretratamiento pertinentes, considerando desempeño, seguridad y protección ambiental.',
  'RA-02': 'Aplica balances de caudal, sal y energía para interpretar y ajustar un sistema de ósmosis inversa sin sobrepasar restricciones operativas.',
  'RA-03': 'Evalúa alternativas de gestión de salmuera con criterios técnicos, ambientales, sociales y económicos, reconociendo incertidumbres y límites de valorización.',
  'RA-04': 'Modela la generación fotovoltaica y eólica, su variabilidad y complementariedad para programar cargas flexibles en una microred.',
  'RA-05': 'Diseña reglas de despacho para baterías, desalinización, riego y electrólisis, manteniendo estado de carga, reservas y cargas críticas.',
  'RA-06': 'Explica y dimensiona conceptualmente la producción de hidrógeno por electrólisis: electricidad, agua, eficiencia, origen renovable, almacenamiento y seguridad.',
  'RA-07': 'Diseña un esquema agroecológico de riego para zona árida integrando calidad de agua, cultivo, suelo, eficiencia, diversidad y productividad hídrica.',
  'RA-08': 'Integra agua–energía–hidrógeno–agroecología mediante evaluación multiobjetivo y propone estrategias resilientes, éticas y territorialmente pertinentes.',
  'RA-09': 'Aplica competencias STEAM para investigar, prototipar, modelar, comunicar y mejorar soluciones interdisciplinarias basadas en evidencia.',
};
const RA_CONCEPTS = {
  'RA-01': ['waterQuality', 'pretreatment'], 'RA-02': ['reverseOsmosis', 'massBalance'], 'RA-03': ['brine', 'massBalance', 'ethics'],
  'RA-04': ['photovoltaics', 'wind', 'microgrid'], 'RA-05': ['battery', 'microgrid'], 'RA-06': ['electrolysis', 'hydrogenSafety'],
  'RA-07': ['irrigationQuality', 'agroecology', 'waterProductivity'], 'RA-08': ['multiobjective', 'systemsThinking', 'economics', 'ethics'], 'RA-09': ['steamInquiry', 'communication'],
};

const LearningModel = {
  init(state) {
    if (!state.mastery) state.mastery = {};
    for (const k of MASTERY_KEYS) if (typeof state.mastery[k] !== 'number') state.mastery[k] = 0;
    if (!state.notes) state.notes = {};
    if (!state.misconceptions) state.misconceptions = {};
    if (!state.confidence) state.confidence = { poco: [0, 0], medio: [0, 0], mucho: [0, 0] };
    if (!state.solo) state.solo = [0, 0, 0, 0, 0, 0].map(() => [0, 0]);
  },
  get s() { return GS.s; },
  startLevel(id) { this.levelStart = nowMs(); this.currentLevel = id; },
  note(ev) { const n = GS.s.notes; n[ev] = (n[ev] || 0) + 1; },
  /** Registra evidencia. r: {kind, id, ra, concepts, solo, correct, hints, time, confidence, transfer, misconception, explanation, level} */
  record(r) {
    const s = GS.s; this.init(s);
    const solo = r.solo || 2;
    const concepts = r.concepts && r.concepts.length ? r.concepts : (RA_CONCEPTS[r.ra] || ['steamInquiry']);
    const deltas = {};
    for (const c of concepts) {
      const m = s.mastery[c] || 0;
      let d;
      if (r.correct) {
        d = (6 + 3 * solo) * (1 - m / 100) * (1 - 0.22 * Math.min(3, r.hints || 0));
        if (r.transfer) d *= 1.35;
        if (r.confidence === 'mucho') d *= 1.1;
        if (r.retry) d *= 0.6;
        if (r.time && r.time > 240) d *= 0.9;
      } else {
        d = -(3 + 1.5 * solo) * (0.3 + m / 100) * (r.confidence === 'mucho' ? 1.5 : 1);
      }
      s.mastery[c] = clamp(m + d, 0, 100);
      deltas[c] = d;
    }
    if (!r.correct && r.misconception) s.misconceptions[r.misconception] = (s.misconceptions[r.misconception] || 0) + 1;
    if (r.confidence && s.confidence[r.confidence]) { s.confidence[r.confidence][0]++; if (r.correct) s.confidence[r.confidence][1]++; }
    if (r.solo) { s.solo[r.solo][0]++; if (r.correct) s.solo[r.solo][1]++; }
    const entry = Object.assign({ t: Date.now(), level: this.currentLevel }, r, { deltas });
    (r.kind === 'item' ? s.questionHistory : s.challengeHistory).push(entry);
    if (s.questionHistory.length > 600) s.questionHistory.shift();
    if (s.challengeHistory.length > 600) s.challengeHistory.shift();
    const lp = GS.lp(this.currentLevel ?? 0);
    lp.mastery = true;
    return deltas;
  },
  /** Recomendación adaptativa para un concepto */
  adapt(concept) {
    const s = GS.s;
    const hist = s.challengeHistory.concat(s.questionHistory).filter(h => (h.concepts || []).includes(concept)).slice(-4);
    const fails = hist.filter(h => !h.correct).length;
    const m = s.mastery[concept] || 0;
    if (fails >= 2) return 'support';
    if (m >= 70) return 'challenge';
    return 'normal';
  },
  weakest(n = 4) { const m = GS.s.mastery; return MASTERY_KEYS.slice().sort((a, b) => m[a] - m[b]).slice(0, n); },
  analytics() {
    const s = GS.s; this.init(s);
    const all = s.questionHistory;
    const ch = s.challengeHistory;
    const mis = Object.entries(s.misconceptions).sort((a, b) => b[1] - a[1]);
    const transfers = ch.concat(all).filter(h => h.transfer && h.correct).length;
    const hints = all.concat(ch).reduce((a, h) => a + (h.hints || 0), 0);
    const times = ch.concat(all).filter(h => h.time).map(h => h.time);
    return {
      mastery: s.mastery, solo: s.solo, hints, transfers, misconceptions: mis, confidence: s.confidence,
      avgTime: times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0, items: all.length, challenges: ch.length,
      reinforce: this.weakest(4),
    };
  },
  exportCSV() {
    const s = GS.s;
    const rows = [['tipo', 'id', 'RA', 'nivel_SOLO', 'correcto', 'pistas', 'tiempo_s', 'confianza', 'transferencia', 'concepcion_erronea', 'conceptos', 'fecha']];
    for (const h of s.questionHistory.concat(s.challengeHistory)) rows.push([h.kind, h.id, h.ra || '', h.solo || '', h.correct ? 1 : 0, h.hints || 0, Math.round(h.time || 0), h.confidence || '', h.transfer ? 1 : 0, h.misconception || '', (h.concepts || []).join('|'), new Date(h.t).toISOString()]);
    rows.push([]); rows.push(['concepto', 'dominio_estimado_0_100']);
    for (const k of MASTERY_KEYS) rows.push([MASTERY_LABELS[k], Math.round(s.mastery[k])]);
    return rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
  },
  exportText() {
    const a = this.analytics();
    let t = 'ARIDIA NEXUS — Resumen local de aprendizaje\n' + new Date().toLocaleString() + '\n(Generado en el navegador; no se envía a ningún servidor. No infiere inteligencia ni capacidades fijas.)\n\n';
    t += 'DOMINIO ESTIMADO POR CONCEPTO (0–100)\n';
    for (const k of MASTERY_KEYS) t += '  ' + MASTERY_LABELS[k].padEnd(28) + ' ' + Math.round(a.mastery[k]) + '\n';
    t += '\nPRECISIÓN POR NIVEL SOLO\n';
    for (let i = 1; i <= 5; i++) { const [n, c] = a.solo[i]; t += '  ' + SOLO_NAMES[i].padEnd(22) + ' ' + (n ? Math.round(100 * c / n) + ' % (' + c + '/' + n + ')' : '—') + '\n'; }
    t += '\nPistas utilizadas: ' + a.hints + '\nTransferencias exitosas: ' + a.transfers + '\nTiempo medio por reto: ' + Math.round(a.avgTime) + ' s\n';
    t += '\nCONFIANZA DECLARADA (aciertos/total)\n';
    for (const k of ['poco', 'medio', 'mucho']) { const [n, c] = a.confidence[k]; t += '  ' + k.padEnd(8) + ' ' + c + '/' + n + '\n'; }
    t += '\nERRORES RECURRENTES (concepciones erróneas)\n';
    for (const [m, n] of a.misconceptions.slice(0, 8)) t += '  ×' + n + '  ' + m + '\n';
    t += '\nCONCEPTOS A REFORZAR: ' + a.reinforce.map(k => MASTERY_LABELS[k]).join(', ') + '\n';
    return t;
  },
};

/* =====================================================================
   Banco: se carga desde 22_questions.js en QBANK y CONTEXTS
   ===================================================================== */
const QBANK = []; const CONTEXTS = {};
function ctxItems(ctxId) { return QBANK.filter(q => q.ctx === ctxId).sort((a, b) => a.solo - b.solo); }

/* =====================================================================
   SOLOScene — supercontexto de 5 tareas en progresión SOLO
   params: ctx, onDone(result), title, gameplay
   ===================================================================== */
const SOLOScene = {
  overlay: true,
  enter(p) {
    this.ctxId = p.ctx; this.C = CONTEXTS[p.ctx]; this.items = ctxItems(p.ctx);
    this.onDone = p.onDone; this.i = 0; this.results = []; this.phase = 'intro';
    this.t = 0; this.startTime = nowMs();
    this.single = p.single; // índice opcional para presentar un único ítem
    if (this.single != null) { this.items = [this.items[this.single]].filter(Boolean); }
    this.prepareItem();
    Audio2.sfx('mystery', { vol: 0.5 });
  },
  prepareItem() {
    const Q = this.items[this.i];
    this.Q = Q; this.sel = -1; this.conf = null; this.hints = 0; this.eliminated = -1; this.feedback = null; this.attempt = 0; this.variant = false;
    this.itemStart = nowMs(); this.scroll = 0;
  },
  get cur() { return this.variant && this.Q.retry ? Object.assign({}, this.Q, this.Q.retry) : this.Q; },
  submit() {
    const Q = this.cur;
    const correct = this.sel === Q.key;
    const time = (nowMs() - this.itemStart) / 1000;
    const transfer = this.Q.solo === 5;
    LearningModel.record({ kind: 'item', id: this.Q.id + (this.variant ? '-V' : ''), ra: this.Q.ra, concepts: this.Q.concepts, solo: this.Q.solo, correct, hints: this.hints, time, confidence: this.conf, transfer, misconception: correct ? null : this.Q.mis, retry: this.attempt > 0 });
    this.feedback = { correct, chosen: this.sel, overconfident: !correct && this.conf === 'mucho' };
    this.attempt++;
    GS.lp(LearningModel.currentLevel ?? 0).feedback = true;
    if (correct) { Audio2.sfx('success'); this.results.push({ id: this.Q.id, solo: this.Q.solo, correct: true, attempts: this.attempt, hints: this.hints }); }
    else Audio2.sfx('error');
  },
  next() {
    this.i++;
    if (this.i >= this.items.length) { this.phase = 'summary'; Audio2.sfx('unlock'); return; }
    this.prepareItem();
  },
  update(dt) {
    this.t += dt;
    if (this.phase === 'intro' && (Input.pressed('confirm'))) { this.phase = 'item'; return; }
    if (Input.pressed('cancel') && this.phase !== 'item') { this.finish(); return; }
    if (this.phase === 'item' && !this.feedback) {
      const Q = this.cur;
      for (let k = 0; k < 4; k++) if (Input.keyPressed('Digit' + (k + 1)) || Input.keyPressed('Key' + 'ABCD'[k])) { if (k !== this.eliminated) { this.sel = k; Audio2.sfx('uiMove'); } }
      if (Input.pressed('hint')) this.useHint();
    }
  },
  useHint() {
    if (this.hints >= 3) return;
    this.hints++; GS.s.stats.hints++; LearningModel.note('hint'); Audio2.sfx('soft');
    if (this.hints === 3) { // demostración parcial: elimina un distractor
      const Q = this.cur; const opts = [0, 1, 2, 3].filter(k => k !== Q.key && k !== this.sel);
      this.eliminated = opts[(Q.id.length + this.attempt) % opts.length];
      if (this.sel === this.eliminated) this.sel = -1;
    }
  },
  finish() {
    Game.pop();
    const ok = this.results.filter(r => r.correct).length;
    this.onDone && this.onDone({ results: this.results, correct: ok, total: this.items.length });
  },
  render(g) {
    UIK.scrim(g, 0.72);
    const C = this.C;
    // cabecera: insignia + título + progreso SOLO (píldoras con número de nivel)
    UIK.panel(g, 8, 6, W - 16, 22, 'tech', null, { chamfer: 2, key: false });
    UIK.badge(g, 'question', 5, 3, 22, 'tech');
    drawText(g, fitText('PUERTA DE EVIDENCIA · ' + (C ? C.title : ''), W - 190, 'bold'), 32, 13, { font: 'bold', color: '#e6f8fe' });
    for (let k = 0; k < this.items.length; k++) {
      const r = this.results.find(rr => rr.id === this.items[k].id);
      const cur = k === this.i && this.phase === 'item';
      const col = r ? '#3fe0a0' : cur ? '#ffd23a' : '#3a5a8a';
      const px = W - 134 + k * 24;
      frect(g, px, 10, 20, 14, '#000633'); frect(g, px + 1, 11, 18, 12, col); frect(g, px + 2, 12, 16, 10, r ? '#0a5a44' : cur ? '#553a08' : '#061a38');
      drawText(g, String(this.items[k].solo), px + 10, 14, { font: 'bold', color: r ? '#eafff6' : cur ? '#fff2a0' : '#93a6c8', align: 'center' });
    }
    Gui.begin();
    if (this.phase === 'intro') this.renderIntro(g);
    else if (this.phase === 'item') this.renderItem(g);
    else this.renderSummary(g);
    Gui.end();
    Gui.renderTooltip(g);
  },
  renderContext(g, x, y, w, h) {
    const C = this.C;
    UIK.panel(g, x, y, w, h, 'sheet');
    UIK.badge(g, 'chart', x - 3, y - 3, 22, 'sheet');
    drawText(g, 'DATOS', x + 26, y + 7, { font: 'bold', color: '#e6f8fe' });
    UIK.pill(g, x + w - 7, y + 6, C.sim ? 'SIMULADOS · FINES EDUCATIVOS' : 'CON FUENTE', { align: 'right', rim: C.sim ? '#ff8a7a' : '#3fe0a0', fill: C.sim ? '#3a0c1c' : '#073d2e', color: C.sim ? '#ffd8d0' : '#c2f5de' });
    frect(g, x + 22, y + 18, w - 28, 1, '#12305a'); frect(g, x + 22, y + 19, w - 28, 1, '#0b2a58');
    let yy = y + 25;
    yy += drawTextBlock(g, C.text, x + 8, yy, w - 16, { color: '#d9eefc' }) + 4;
    if (C.table) yy = drawDataTable(g, C.table, x + 8, yy, w - 16) + 4;
    if (C.chart) { const ch = C.chart; Charts.line(g, x + 8, yy, w - 16, Math.min(70, y + h - yy - 8), ch.series, Object.assign({ bg: '#020e26' }, ch.opts)); }
  },
  renderIntro(g) {
    const C = this.C;
    this.renderContext(g, 20, 40, W - 40, 216);
    UIK.panel(g, 20, 262, W - 40, 50, 'tech', null, { chamfer: 2, key: false });
    drawTextBlock(g, '{y}' + (C.ra || '') + '{/} ' + (RA[C.ra] || ''), 28, 268, W - 56, { color: UI_INK.body });
    if (Gui.button(g, 'start', W / 2 - 90, H - 40, 180, 22, 'Comenzar (' + this.items.length + ' tareas)', { style: 'gold', icon: 'play' })) this.phase = 'item';
  },
  renderItem(g) {
    const Q = this.cur, fb = this.feedback;
    const leftW = 236;
    this.renderContext(g, 14, 38, leftW, H - 46);
    const x = 14 + leftW + 10, w = W - x - 12, y0 = 38, ph = H - 46;
    UIK.panel(g, x, y0, w, ph, 'tech', null, { chamfer: 3 });
    UIK.badge(g, 'book', x - 3, y0 - 3, 22, 'tech');
    drawText(g, 'PREGUNTA', x + 26, y0 + 7, { font: 'bold', color: '#e6f8fe' });
    UIK.pill(g, x + w - 7, y0 + 6, 'SOLO ' + this.Q.solo + ' · ' + SOLO_NAMES[this.Q.solo].toUpperCase() + (this.variant ? ' · VARIANTE' : ''), { align: 'right', rim: '#ffd23a', fill: '#1a1404', color: '#fff2c0' });
    frect(g, x + 22, y0 + 18, w - 28, 1, '#12305a'); frect(g, x + 22, y0 + 19, w - 28, 1, '#0b2a58');
    const ix = x + 8, iw = w - 16;
    let y = y0 + 25;
    y += drawTextBlock(g, Q.stem, ix, y, iw, { color: '#d5dcf5', lineH: 11 }) + 5;
    const letters = 'ABCD';
    Q.options.forEach((op, k) => {
      let st = this.sel === k ? 'selected' : null;
      if (k === this.eliminated) st = 'dim';
      if (fb) { if (k === Q.key && fb.correct) st = 'correct'; else if (k === fb.chosen && !fb.correct) st = 'wrong'; else st = 'dim'; }
      const r = Gui.choice(g, 'op' + k + '_' + this.i + '_' + this.attempt, ix, y, iw, op, letters[k], { state: st, disabled: !!fb || k === this.eliminated });
      if (r.clicked && !fb && k !== this.eliminated) this.sel = k;
      y += r.h + 3;
    });
    const by = y0 + ph - 28;
    if (!fb) {
      const needConf = this.Q.solo >= 3;
      if (needConf) {
        drawText(g, '¿Qué tan seguro estás?', ix, by - 17, { color: UI_INK.dim });
        ['poco', 'medio', 'mucho'].forEach((c, k) => { if (Gui.button(g, 'cf' + c, ix + 130 + k * 58, by - 21, 54, 16, c.toUpperCase(), { style: this.conf === c ? 'gold' : 'ghost', selected: this.conf === c })) this.conf = c; });
      }
      const hintLbl = ['Pista: pregunta', 'Pista: evidencia', 'Pista: parcial', 'Sin más pistas'][this.hints];
      if (Gui.button(g, 'hint', ix, by, 124, 20, hintLbl, { icon: 'hint', style: 'ghost', disabled: this.hints >= 3, tip: 'Las pistas reducen la recompensa, no el acceso al aprendizaje.' })) this.useHint();
      const can = this.sel >= 0 && (!needConf || this.conf);
      if (Gui.button(g, 'submit', ix + iw - 124, by, 124, 20, 'Comprobar', { style: 'good', icon: 'check', disabled: !can })) this.submit();
      if (this.hints > 0) {
        const htxt = this.hints >= 1 ? (Q.hints ? Q.hints[Math.min(this.hints - 1, Q.hints.length - 1)] : defaultHint(Q, this.hints)) : '';
        if (htxt) {
          const full = '{y}' + ['', 'Pregunta', 'Evidencia', 'Parcial'][this.hints] + ':{/} ' + htxt;
          const hh = textHeight(full, iw - 16) + 10;
          const hy = Math.max(y + 2, (needConf ? by - 25 : by - 5) - hh);
          UIK.panel(g, ix, hy, iw, hh, 'sheet', null, { chamfer: 2, key: false });
          drawTextBlock(g, full, ix + 8, hy + 5, iw - 16, { color: UI_INK.body });
        }
      }
    } else {
      // feedback causal (color + icono + palabra)
      const fy = Math.min(y + 2, by - 74);
      const fh = by - fy - 4;
      UIK.panel(g, ix, fy, iw, fh, fb.correct ? 'green' : 'alert', null, { chamfer: 2, key: false });
      Icons.draw(g, fb.correct ? 'check' : 'warn', ix + 5, fy + 4);
      let txt;
      if (fb.correct) txt = '{g}¡Correcto!{/} ' + Q.why;
      else {
        txt = '{o}Consecuencia segura:{/} ' + (Q.dist[fb.chosen] || 'Esa opción no se sostiene con los datos.') + ' {y}Pregunta orientadora:{/} ' + (Q.guide || defaultHint(Q, 1));
        if (fb.overconfident) txt += ' {p}Respondiste con mucha confianza: revisa la concepción "' + (this.Q.mis || 'relación causal') + '".{/}';
      }
      g.save(); g.beginPath(); g.rect(ix + 2, fy + 2, iw - 4, fh - 4); g.clip();
      drawTextBlock(g, txt, ix + 22, fy + 6, iw - 30, { color: fb.correct ? '#eafff6' : '#ffe8e4' });
      g.restore();
      if (fb.correct) { if (Gui.button(g, 'next', ix + iw - 124, by, 124, 20, this.i + 1 >= this.items.length ? 'Ver resumen' : 'Siguiente', { style: 'good', icon: 'play' })) this.next(); }
      else {
        if (Gui.button(g, 'retry', ix + iw - 160, by, 160, 20, this.Q.retry && !this.variant ? 'Reintentar (variante)' : 'Reintentar', { style: 'gold', icon: 'reset' })) {
          GS.s.stats.retries++;
          if (this.Q.retry && !this.variant) { this.variant = true; this.sel = -1; this.eliminated = -1; this.hints = 0; }
          else { this.eliminated = fb.chosen; this.sel = -1; }
          this.feedback = null; this.conf = null;
        }
      }
    }
  },
  renderSummary(g) {
    const ok = this.results.filter(r => r.correct && r.attempts === 1).length;
    const x = 60, y = 40, w = W - 120, h = H - 84;
    UIK.panel(g, x, y, w, h, 'tech');
    UIK.header(g, x, y, w, 'EVIDENCIA REGISTRADA', 'tech', 'star');
    let yy = y + 30;
    this.items.forEach((q, k) => {
      const r = this.results.find(rr => rr.id === q.id);
      const rowSt = r && r.attempts === 1 ? 'green' : r ? 'sheet' : 'alert';
      UIK.panel(g, x + 12, yy - 3, w - 24, 16, rowSt, null, { chamfer: 2, key: false, spark: false });
      Icons.draw(g, r && r.attempts === 1 ? 'star' : r ? 'check' : 'cross', x + 16, yy - 2);
      drawText(g, 'SOLO ' + q.solo + ' · ' + SOLO_NAMES[q.solo] + (r ? ' · intentos: ' + r.attempts + (r.hints ? ' · pistas: ' + r.hints : '') : ''), x + 34, yy + 1, { color: UI_INK.body });
      yy += 19;
    });
    yy += 6;
    drawTextBlock(g, 'Aciertos al primer intento: {y}' + ok + '/' + this.items.length + '{/}. Cada tarea alimenta tu dominio estimado en: ' + (RA_CONCEPTS[this.C.ra] || []).map(c => '{c}' + MASTERY_LABELS[c] + '{/}').join(', ') + '.', x + 14, yy, w - 28, { color: UI_INK.dim });
    if (Gui.button(g, 'done', W / 2 - 70, y + h - 30, 140, 22, 'Continuar', { style: 'good', icon: 'play' })) this.finish();
  },
};
function defaultHint(Q, level) {
  if (level <= 1) return '¿Qué relación entre variables pone a prueba esta tarea? Relee la pregunta: ' + SOLO_TASKS[Q.solo].toLowerCase();
  if (level === 2) return 'Revisa en la ficha de datos las unidades y la variable que limita el sistema.';
  return 'Se eliminó una opción que contradice los datos.';
}
/** Tabla de datos pixel: table = {head:[...], rows:[[...]...]} */
function drawDataTable(g, T, x, y, w) {
  const n = T.head.length;
  const cw = T.widths ? T.widths.map(f => f * w) : Array(n).fill(w / n);
  let cx = x;
  frect(g, x, y - 1, w, 13, '#000633');
  frect(g, x + 1, y, w - 2, 11, '#1e5a8a'); frect(g, x + 1, y, w - 2, 1, '#3a7ab0');
  T.head.forEach((hd, i) => { drawText(g, hd, cx + 3, y + 3, { font: 'tiny', color: '#e6f8fe' }); cx += cw[i]; });
  y += 11;
  T.rows.forEach((r, ri) => {
    frect(g, x, y, w, 10, '#000633'); frect(g, x + 1, y, w - 2, 10, ri % 2 ? '#082248' : '#061a36');
    cx = x;
    r.forEach((v, i) => { if (i > 0) frect(g, Math.round(cx), y, 1, 10, '#12305a'); drawText(g, String(v), cx + 3, y + 2, { font: 'tiny', color: '#ceddf8' }); cx += cw[i]; });
    y += 10;
  });
  frect(g, x, y, w, 1, '#000633'); frect(g, x + 1, y, w - 2, 1, '#163a6a');
  return y + 2;
}

/* =====================================================================
   MicroCheckScene — corregir la concepción de un adversario conceptual
   ===================================================================== */
const ADV_QUIZ = {
  fouler: [{ q: 'El diferencial de presión del filtro sube de 0,4 a 1,1 bar mientras la turbidez de entrada se duplica. ¿Qué indica?', o: ['Ensuciamiento: el filtro retiene sólidos y necesita lavado o menor carga.', 'Que el agua ya está desalinizada.', 'Que conviene aumentar el caudal para limpiar el filtro.'], k: 0, w: 'La pérdida de carga crece cuando el medio filtrante acumula sólidos.' }],
  scale: [{ q: 'Al subir la recuperación de 45 % a 70 % con la misma alimentación, ¿qué ocurre en el concentrado?', o: ['Se concentra más y aumenta el riesgo de incrustación.', 'Se diluye porque sale menos agua.', 'Nada: la membrana destruye la sal.'], k: 0, w: 'Con menos caudal de concentrado, la misma sal queda en menos agua: Cc ≈ Cf/(1−R).' }],
  saltMirage: [{ q: 'Si mezclas 1 m³ de salmuera con 9 m³ de agua de mar, ¿qué pasa con la masa de sal?', o: ['Se conserva: baja la concentración, no la cantidad total.', 'Desaparece al diluirse.', 'Se transforma en agua dulce.'], k: 0, w: 'Diluir reparte la sal en más volumen; la masa total se conserva.' }],
  peak: [{ q: 'Un campo FV alcanza 600 kW a mediodía. ¿Garantiza 600 kWh para la noche?', o: ['No: kW es potencia instantánea; la energía depende del tiempo y del almacenamiento.', 'Sí: 600 kW equivalen a 600 kWh.', 'Sí, si el día está despejado.'], k: 0, w: 'La energía es el área bajo la curva de potencia y debe almacenarse para usarse de noche.' }],
  gust: [{ q: 'Con viento de 28 m/s y cut-out de 25 m/s, ¿qué hace la turbina?', o: ['Se detiene por seguridad: su potencia cae a cero.', 'Produce 8 veces más que a 14 m/s (relación cúbica).', 'Sigue en potencia nominal sin riesgo.'], k: 0, w: 'La curva de potencia se aplana en nominal y se corta en cut-out; v³ solo vale en la región parcial.' }],
  socEater: [{ q: 'Se pronostica una noche sin viento. ¿Qué hacer con la batería al 35 % y reserva mínima del 30 %?', o: ['Proteger la reserva y modular cargas flexibles.', 'Descargarla al 0 % para maximizar el H2 ahora.', 'Ignorar el pronóstico: la batería es una fuente primaria.'], k: 0, w: 'La batería almacena, no genera; su valor depende de cuándo puede usarse.' }],
  greenwash: [{ q: 'Un electrolizador opera de noche con electricidad de un generador diésel. ¿El H2 es verde?', o: ['No: el atributo depende del origen eléctrico y la frontera de análisis.', 'Sí: toda electrólisis produce H2 verde.', 'Sí, porque el H2 no emite al usarse.'], k: 0, w: 'El hidrógeno hereda los impactos de la electricidad y del agua que lo producen.' }],
  monoscore: [{ q: 'Un tablero muestra "Índice: 98/100" sumando costo (USD), agua (m³) y equidad (%). ¿Qué falla?', o: ['Suma unidades incompatibles y oculta ponderaciones y afectados.', 'Nada: un índice alto siempre es bueno.', 'Solo falta redondear a 100.'], k: 0, w: 'Los criterios deben normalizarse, sus pesos declararse y discutirse.' }],
};
const MicroCheckScene = {
  overlay: true,
  enter(p) {
    const list = ADV_QUIZ[p.advType] || ADV_QUIZ.fouler;
    this.Q = p.quiz || list[Math.floor(Math.random() * list.length)];
    this.A = ADVERSARIES[p.advType] || ADVERSARIES.fouler; this.type = p.advType;
    this.onDone = p.onDone; this.fb = null; this.t = 0;
    // orden de opciones mezclado
    this.order = RNG(Date.now() & 0xffff).shuffle([0, 1, 2]);
    this.startT = nowMs();
  },
  update(dt) { this.t += dt; },
  render(g) {
    // panel PREGUNTA compacto a la derecha, sobre el mundo visible (velo ligero sin tramado)
    UIK.scrim(g, 0.32);
    const w = 236, x = W - 8 - w, y = 104;
    const desc = '{p}' + this.A.desc + '{/} Se disuelve solo si corriges la concepción.';
    const iw = w - 16, rw = iw - 18 - 14;
    const dh = textHeight(desc, iw, { lineH: 11 }), sh = textHeight(this.Q.q, iw, { lineH: 11 });
    const rows = this.order.map(k => Math.max(15, wrapText(this.Q.o[k], rw).length * 11 + 4));
    const fbTxt = this.fb ? (this.fb.ok ? '{g}Concepción corregida.{/} ' : '{o}El adversario se refuerza (empujón no letal).{/} ') + this.Q.w : '';
    const fbh = this.fb ? textHeight(fbTxt, iw - 24, { lineH: 11 }) + 10 + 26 : 0;
    const h = Math.min(H - y - 6, 26 + dh + 4 + sh + 6 + rows.reduce((a, b) => a + b + 3, 0) + 4 + fbh);
    UIK.panel(g, x, y, w, h, 'mirage', null, { chamfer: 3 });
    UIK.badge(g, 'warn', x - 3, y - 3, 22, 'mirage');
    drawText(g, 'PREGUNTA', x + 26, y + 7, { font: 'bold', color: '#fff0fc' });
    UIK.pill(g, x + w - 7, y + 6, fitText(this.A.name.toUpperCase(), 92, 'tiny'), { align: 'right', rim: '#f6a8f0', fill: '#24093e', color: '#ffd0f4' });
    frect(g, x + 22, y + 18, w - 28, 1, '#3a1250'); frect(g, x + 22, y + 19, w - 28, 1, '#2a0c40');
    let yy = y + 25;
    yy += drawTextBlock(g, desc, x + 8, yy, iw, { color: '#f6e6fa', lineH: 11 }) + 4;
    yy += drawTextBlock(g, this.Q.q, x + 8, yy, iw, { color: '#e2ebfc', lineH: 11 }) + 6;
    Gui.begin();
    this.order.forEach((k, i) => {
      const st = this.fb ? (k === this.Q.k ? 'correct' : (k === this.fb.c ? 'wrong' : 'dim')) : null;
      const r = Gui.choice(g, 'mc' + i, x + 8, yy, iw, this.Q.o[k], 'ABC'[i], { state: st, disabled: !!this.fb });
      if (r.clicked && !this.fb) {
        const ok = k === this.Q.k;
        this.fb = { c: k, ok };
        LearningModel.record({ kind: 'challenge', id: 'adv_' + this.type, concepts: advConcepts(this.type), solo: 2, correct: ok, time: (nowMs() - this.startT) / 1000, misconception: ok ? null : this.A.desc });
        Audio2.sfx(ok ? 'success' : 'error');
      }
      yy += r.h + 3;
    });
    if (this.fb) {
      const fh = textHeight(fbTxt, iw - 24, { lineH: 11 }) + 10;
      UIK.panel(g, x + 8, yy + 2, iw, fh, this.fb.ok ? 'green' : 'alert', null, { chamfer: 2, key: false, spark: false });
      Icons.draw(g, this.fb.ok ? 'check' : 'warn', x + 12, yy + 5);
      drawTextBlock(g, fbTxt, x + 28, yy + 7, iw - 24, { color: this.fb.ok ? '#eafff6' : '#ffe8e4', lineH: 11 });
      if (Gui.button(g, 'mcok', x + w / 2 - 60, Math.min(y + h - 26, yy + fh + 6), 120, 20, 'Continuar', { style: this.fb.ok ? 'good' : 'gold', icon: 'play' })) { Game.pop(); this.onDone && this.onDone(this.fb.ok); }
    }
    Gui.end();
  },
};
function advConcepts(t) { return { fouler: ['pretreatment'], scale: ['reverseOsmosis', 'massBalance'], saltMirage: ['brine', 'massBalance'], peak: ['photovoltaics'], gust: ['wind'], socEater: ['battery'], greenwash: ['electrolysis'], monoscore: ['multiobjective'] }[t] || ['steamInquiry']; }

/* =====================================================================
   AnalyticsScene — "Mi aprendizaje" (también usada por Modo Docente)
   ===================================================================== */
const AnalyticsScene = {
  overlay: true,
  enter() { Audio2.sfx('page'); },
  update() { if (Input.pressed('cancel')) Game.pop(); },
  render(g) {
    UIK.scrim(g, 0.78);
    UIK.panel(g, 10, 10, W - 20, H - 20, 'tech');
    UIK.header(g, 10, 10, W - 20, 'MI APRENDIZAJE · dominio estimado (no mide capacidades fijas)', 'tech', 'chart');
    const a = LearningModel.analytics();
    // barras de dominio
    MASTERY_KEYS.forEach((k, i) => {
      const col = i < 10 ? 0 : 1, row = i % 10;
      const x = 20 + col * 200, y = 34 + row * 17;
      drawText(g, MASTERY_LABELS[k], x, y, { font: 'tiny', color: '#b8c8e8' });
      const v = a.mastery[k] / 100;
      UIK.bar(g, x, y + 7, 180, 6, v, v > 0.7 ? '#3fe0a0' : v > 0.4 ? '#ffd23a' : '#ff9f43', null, 10);
    });
    // SOLO
    const sx = 430;
    drawText(g, 'PRECISIÓN POR NIVEL SOLO', sx, 34, { font: 'tiny', color: '#ffe14d' });
    for (let i = 1; i <= 5; i++) { const [n, c] = a.solo[i]; const f = n ? c / n : 0; drawText(g, i + ' ' + SOLO_NAMES[i], sx, 44 + i * 14, { font: 'tiny', color: '#cfd6f0' }); UIK.bar(g, sx + 110, 44 + i * 14, 80, 6, f, '#56e5ff'); drawText(g, n ? Math.round(f * 100) + '%' : '—', sx + 196, 44 + i * 14, { font: 'tiny', color: '#fffaf0' }); }
    let y = 136;
    drawText(g, 'Pistas: ' + a.hints + '   Transferencias: ' + a.transfers, sx, y, { font: 'tiny', color: '#fffaf0' }); y += 10;
    drawText(g, 'Tiempo medio por reto: ' + Math.round(a.avgTime) + ' s', sx, y, { font: 'tiny', color: '#fffaf0' }); y += 14;
    drawText(g, 'CONFIANZA DECLARADA', sx, y, { font: 'tiny', color: '#ffe14d' }); y += 10;
    for (const k of ['poco', 'medio', 'mucho']) { const [n, c] = a.confidence[k]; drawText(g, k.toUpperCase() + ': ' + c + '/' + n + ' aciertos', sx, y, { font: 'tiny', color: '#cfd6f0' }); y += 9; }
    y += 6; drawText(g, 'CONCEPTOS A REFORZAR', sx, y, { font: 'tiny', color: '#ffe14d' }); y += 10;
    for (const k of a.reinforce) { drawText(g, '• ' + MASTERY_LABELS[k], sx, y, { font: 'tiny', color: '#ff9a8a' }); y += 9; }
    y = 214;
    drawText(g, 'ERRORES RECURRENTES', 20, y, { font: 'tiny', color: '#ffe14d' }); y += 10;
    if (!a.misconceptions.length) drawText(g, 'Aún no hay registros.', 20, y, { color: '#93a6c8' });
    for (const [m, n] of a.misconceptions.slice(0, 5)) { drawText(g, fitText('×' + n + ' ' + m, 400), 20, y, { color: '#ffd0e8' }); y += 12; }
    Gui.begin();
    if (Gui.button(g, 'csv', W - 230, H - 36, 100, 18, 'Exportar CSV', { icon: 'save', style: 'ghost' })) downloadText('aridia_nexus_aprendizaje.csv', LearningModel.exportCSV(), 'text/csv');
    if (Gui.button(g, 'txt', W - 124, H - 36, 100, 18, 'Exportar TXT', { icon: 'book', style: 'ghost' })) downloadText('aridia_nexus_resumen.txt', LearningModel.exportText());
    if (Gui.button(g, 'close', 20, H - 36, 90, 18, 'Cerrar', { style: 'ghost' })) Game.pop();
    Gui.end();
  },
};
