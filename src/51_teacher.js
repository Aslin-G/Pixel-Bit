/* =====================================================================
   51_teacher.js — Modo docente, Sala de práctica y Créditos/Fuentes.
   ===================================================================== */

const TeacherScene = {
  overlay: true,
  enter() { this.tab = 'resumen'; this.ra = 'RA-01'; this.lv = GS.s.level || 0; this.val = null; this.confirmReset = false; Audio2.sfx('page'); },
  update() { if (Input.pressed('cancel')) Game.pop(); },
  render(g) {
    fdither(g, 0, 0, W, H, '#05030f', 0.85);
    UIK.panel(g, 6, 6, W - 12, H - 12, 'tech');
    UIK.header(g, 6, 6, W - 12, 'MODO DOCENTE · panel local (no envía datos)', 'tech', 'chart');
    Gui.begin();
    const tabs = ['resumen', 'retos', 'errores', 'fuentes', 'validación'];
    tabs.forEach((t, i) => { if (Gui.button(g, 'tt' + t, 12 + i * 92, 26, 88, 15, t.toUpperCase(), { style: this.tab === t ? 'gold' : 'tab', selected: this.tab === t })) this.tab = t; });
    const x = 14, y0 = 48;
    if (this.tab === 'resumen') this.renderSummary(g, x, y0);
    if (this.tab === 'retos') this.renderLaunch(g, x, y0);
    if (this.tab === 'errores') this.renderErrors(g, x, y0);
    if (this.tab === 'fuentes') this.renderSources(g, x, y0);
    if (this.tab === 'validación') this.renderValidation(g, x, y0);
    if (Gui.button(g, 'close', W - 92, H - 28, 80, 16, 'Cerrar', { style: 'ghost' })) Game.pop();
    Gui.end();
    Gui.renderTooltip(g);
  },
  renderSummary(g, x, y) {
    const a = LearningModel.analytics();
    drawText(g, 'DOMINIO ESTIMADO POR CONCEPTO (0–100)', x, y, { font: 'tiny', color: '#ffe14d' });
    MASTERY_KEYS.forEach((k, i) => { const cx = x + (i % 2) * 300, cy = y + 10 + Math.floor(i / 2) * 12; drawText(g, MASTERY_LABELS[k], cx, cy, { font: 'tiny', color: '#cfd6f0' }); UIK.bar(g, cx + 130, cy, 130, 5, a.mastery[k] / 100, '#86e36f'); drawText(g, fmt0(a.mastery[k]), cx + 266, cy, { font: 'tiny', color: '#fffaf0' }); });
    let yy = y + 136;
    drawText(g, 'PRECISIÓN POR NIVEL SOLO', x, yy, { font: 'tiny', color: '#ffe14d' });
    for (let i = 1; i <= 5; i++) { const [n, c] = a.solo[i]; drawText(g, SOLO_NAMES[i] + ': ' + (n ? Math.round(100 * c / n) + ' % (' + c + '/' + n + ')' : '—'), x + (i - 1) * 124, yy + 10, { font: 'tiny', color: '#cfd6f0' }); }
    yy += 24;
    drawText(g, 'Ítems: ' + a.items + ' · Retos: ' + a.challenges + ' · Pistas: ' + a.hints + ' · Transferencias: ' + a.transfers + ' · Tiempo medio: ' + Math.round(a.avgTime) + ' s · Capítulos completados: ' + GS.s.completed.length + '/11', x, yy, { font: 'tiny', color: '#fffaf0' });
    yy += 12;
    drawText(g, 'Conceptos a reforzar: ' + a.reinforce.map(k => MASTERY_LABELS[k]).join(', '), x, yy, { font: 'tiny', color: '#ff9a8a' });
    yy += 16;
    if (Gui.button(g, 'csv', x, yy, 120, 16, 'Exportar CSV', { icon: 'save', style: 'ghost' })) downloadText('aridia_nexus_docente.csv', LearningModel.exportCSV(), 'text/csv');
    if (Gui.button(g, 'txt', x + 126, yy, 120, 16, 'Exportar TXT', { icon: 'book', style: 'ghost' })) downloadText('aridia_nexus_resumen.txt', LearningModel.exportText());
    const nt = Gui.toggle(g, 'nt', x + 260, yy + 1, 'Modo sin tiempo', Game.settings.noTimeLimit); if (nt !== Game.settings.noTimeLimit) { Game.settings.noTimeLimit = nt; Game.saveSettings(); }
    yy += 22;
    if (Gui.button(g, 'unlock', x, yy, 200, 16, 'Desbloquear todos los capítulos', { icon: 'lock', style: 'primary', tip: 'Útil en clase para ir directo a un capítulo.' })) { for (let i = 0; i <= 10; i++) if (!GS.s.unlocked.includes(i)) GS.s.unlocked.push(i); for (const id in TOOLS) if (TOOLS[id].level < 10) GS.giveTool(id, true); GS.save(); Game.toast('Capítulos desbloqueados', 'check', '#86e36f'); }
    if (!this.confirmReset) { if (Gui.button(g, 'reset', x + 210, yy, 160, 16, 'Reiniciar progreso', { icon: 'reset', style: 'danger' })) this.confirmReset = true; }
    else { if (Gui.button(g, 'reset2', x + 210, yy, 160, 16, '¿Seguro? Confirmar', { icon: 'warn', style: 'danger' })) { SaveManager.wipe(); GS.reset(); this.confirmReset = false; Game.toast('Progreso reiniciado', 'reset', '#ff9a8a'); } }
  },
  renderLaunch(g, x, y) {
    drawText(g, 'LANZAR SUPERCONTEXTO SOLO (5 tareas en progresión)', x, y, { font: 'tiny', color: '#ffe14d' });
    Object.keys(RA).forEach((ra, i) => { if (Gui.button(g, 'ra' + ra, x + (i % 9) * 68, y + 10, 64, 15, ra, { style: this.ra === ra ? 'gold' : 'ghost' })) this.ra = ra; });
    drawTextBlock(g, RA[this.ra], x, y + 30, W - 40, { color: '#cfd6f0', font: 'tiny' });
    let yy = y + 50;
    for (let c = 1; c <= 3; c++) {
      const id = this.ra + '-C' + c, C = CONTEXTS[id];
      if (!C) continue;
      if (Gui.button(g, 'ctx' + id, x, yy, 360, 16, id + ' · ' + C.title, { style: 'choice', align: 'left' })) Game.push(SOLOScene, { ctx: id });
      yy += 19;
    }
    yy += 6;
    drawText(g, 'RETOS EXTRA DE ESTE RA', x, yy, { font: 'tiny', color: '#ffe14d' }); yy += 10;
    const dx = DIAGNOSTICS.filter(d => d.ra === this.ra), ca = CALCS.filter(c => c.ra === this.ra), db = DEBATES.filter(d => d.ra === this.ra);
    let bx = x;
    for (const d of dx) { if (Gui.button(g, 'dx' + d.id, bx, yy, 140, 15, 'Diagnóstico ' + d.id, { style: 'ghost', tip: d.title })) launchDiagnostic(d); bx += 144; if (bx > W - 150) { bx = x; yy += 18; } }
    for (const c of ca) { if (Gui.button(g, 'ca' + c.id, bx, yy, 140, 15, 'Cálculo ' + c.id, { style: 'ghost', tip: c.title })) Game.push(NumericScene, { calc: c }); bx += 144; if (bx > W - 150) { bx = x; yy += 18; } }
    for (const d of db) { if (Gui.button(g, 'db' + d.id, bx, yy, 140, 15, 'Debate ' + d.id, { style: 'ghost', tip: d.title })) Game.push(DebateScene, { debate: d }); bx += 144; if (bx > W - 150) { bx = x; yy += 18; } }
    yy += 24;
    drawText(g, 'IR A CAPÍTULO', x, yy, { font: 'tiny', color: '#ffe14d' }); yy += 10;
    for (let i = 0; i <= 10; i++) if (Gui.button(g, 'lv' + i, x + i * 54, yy, 50, 15, 'Cap. ' + i, { style: LEVELS[i] ? 'primary' : 'ghost', disabled: !LEVELS[i] })) { if (!GS.s.unlocked.includes(i)) GS.s.unlocked.push(i); Game.scenes.length = 0; Game.transition(() => Game.setScene(GameplayScene, { level: i })); }
  },
  renderErrors(g, x, y) {
    const a = LearningModel.analytics();
    drawText(g, 'ERRORES FRECUENTES (concepciones erróneas detectadas)', x, y, { font: 'tiny', color: '#ffe14d' });
    let yy = y + 12;
    if (!a.misconceptions.length) drawText(g, 'Sin registros todavía.', x, yy, { color: '#8a8fb8' });
    for (const [m, n] of a.misconceptions.slice(0, 14)) { drawText(g, '×' + n, x, yy, { color: '#ff9a8a' }); drawTextBlock(g, m, x + 30, yy, W - 70, { color: '#fffaf0' }); yy += 13; }
    yy += 6;
    drawText(g, 'CONFIANZA DECLARADA VS. ACIERTO (calibración metacognitiva)', x, yy, { font: 'tiny', color: '#ffe14d' }); yy += 12;
    for (const k of ['poco', 'medio', 'mucho']) { const [n, c] = a.confidence[k]; drawText(g, k.toUpperCase() + ': ' + (n ? Math.round(100 * c / n) + ' % de acierto en ' + n + ' respuestas' : '—'), x, yy, { color: '#cfd6f0' }); yy += 12; }
  },
  renderSources(g, x, y) {
    drawText(g, 'FUENTES Y SUPUESTOS', x, y, { font: 'tiny', color: '#ffe14d' });
    const e = CODEX_BY_ID.fuentes, s2 = CODEX_BY_ID.supuestos;
    let yy = y + 10;
    yy += drawTextBlock(g, s2.def, x, yy, W - 40, { color: '#cfd6f0', font: 'tiny', lineH: 7 }) + 6;
    for (const v of Object.values(SRC)) { yy += drawTextBlock(g, '• ' + v, x, yy, W - 40, { color: '#fffaf0', font: 'tiny', lineH: 7 }) + 1; }
  },
  renderValidation(g, x, y) {
    if (!this.val) this.val = ValidationSuite.run();
    const ok = this.val.filter(r => r.ok).length;
    drawText(g, 'SUITE DE VALIDACIÓN CIENTÍFICA: ' + ok + '/' + this.val.length + ' pruebas superadas', x, y, { color: ok === this.val.length ? '#86e36f' : '#ff9a8a' });
    let yy = y + 14;
    this.val.slice(0, 44).forEach((r, i) => { const cx = x + (i % 2) * 304, cy = yy + Math.floor(i / 2) * 9; drawText(g, (r.ok ? '✓ ' : '✗ ') + r.name.slice(0, 58), cx, cy, { font: 'tiny', color: r.ok ? '#86e36f' : '#ff4e5d' }); });
    drawText(g, 'Banco SOLO: ' + QBANK.length + ' ítems · ' + Object.keys(CONTEXTS).length + ' supercontextos · ' + DIAGNOSTICS.length + ' diagnósticos · ' + CALCS.length + ' cálculos · ' + DESIGN_TASKS.length + ' tareas de diseño · ' + DEBATES.length + ' debates · ' + CHALLENGES.length + ' retos manipulativos', x, H - 46, { font: 'tiny', color: '#a6f4ff' });
  },
};
function launchDiagnostic(d) {
  Game.push(ExplainScene, { id: d.id, ra: d.ra, prompt: '{y}' + d.title + ':{/} ' + d.prompt, options: d.options, key: d.key, why: d.why, mis: 'diagnóstico: ' + d.title, concepts: RA_CONCEPTS[d.ra] });
}

/* ---------- Sala de práctica (recuperación espaciada) ---------- */
const PracticeScene = {
  overlay: true,
  enter() { Audio2.sfx('page'); },
  update() { if (Input.pressed('cancel')) Game.pop(); },
  render(g) {
    fdither(g, 0, 0, W, H, '#05030f', 0.8);
    UIK.panel(g, 20, 14, W - 40, H - 28, 'green');
    UIK.header(g, 20, 14, W - 40, 'SALA DE PRÁCTICA · recuperación espaciada', 'green', 'flask');
    Gui.begin();
    drawTextBlock(g, 'Repasa con supercontextos de capítulos ya visitados, diagnósticos, cálculos y debates. Se priorizan los conceptos con menor dominio estimado.', 30, 38, W - 60, { color: '#fffaf0' });
    const weak = LearningModel.weakest(3);
    drawText(g, 'Sugerido para ti: ' + weak.map(k => MASTERY_LABELS[k]).join(' · '), 30, 62, { font: 'tiny', color: '#ffe14d' });
    let y = 76;
    const visited = GS.s.unlocked.map(l => LEVEL_META[l].ra);
    const ras = [...new Set(visited)];
    ras.forEach((ra, i) => {
      for (let c = 1; c <= 3; c++) { const id = ra + '-C' + c; const C = CONTEXTS[id]; if (!C) continue; if (Gui.button(g, 'p' + id, 30 + (c - 1) * 196, y, 190, 16, id + ' ' + C.title.slice(0, 20), { style: 'ghost', align: 'left', tip: C.title })) Game.push(SOLOScene, { ctx: id }); }
      y += 19;
    });
    y += 6;
    const pool = DIAGNOSTICS.filter(d => ras.includes(d.ra)).slice(0, 6);
    pool.forEach((d, i) => { if (Gui.button(g, 'pd' + d.id, 30 + (i % 3) * 196, y + Math.floor(i / 3) * 19, 190, 16, 'Diagnóstico: ' + d.title.slice(0, 18), { style: 'choice', align: 'left', tip: d.title })) launchDiagnostic(d); });
    y += 44;
    const cs = CALCS.filter(c => ras.includes(c.ra)).slice(0, 6);
    cs.forEach((c, i) => { if (Gui.button(g, 'pc' + c.id, 30 + (i % 3) * 196, y + Math.floor(i / 3) * 19, 190, 16, 'Cálculo: ' + c.title, { style: 'primary', align: 'left' })) Game.push(NumericScene, { calc: c }); });
    y += 44;
    const ds = DEBATES.filter(d => ras.includes(d.ra)).slice(0, 3);
    ds.forEach((d, i) => { if (Gui.button(g, 'pb' + d.id, 30 + i * 196, y, 190, 16, 'Debate: ' + d.title.slice(0, 20), { style: 'gold', align: 'left' })) Game.push(DebateScene, { debate: d }); });
    if (Gui.button(g, 'close', W - 120, H - 36, 90, 16, 'Cerrar', { style: 'ghost' })) Game.pop();
    Gui.end();
    Gui.renderTooltip(g);
  },
};

/* ---------- Créditos y fuentes ---------- */
const CreditsScene = {
  overlay: true,
  enter(p) { this.t = 0; this.final = !!p.final; this.onDone = p.onDone; if (this.final) Audio2.playMusic('ending'); },
  update(dt) { this.t += dt * (Input.down('fast') || Input.down('confirm') ? 4 : 1); if (Input.pressed('cancel') || (this.final && this.t > 70)) { Game.pop(); this.onDone && this.onDone(); } },
  render(g) {
    frect(g, 0, 0, W, H, '#0a0718');
    for (let i = 0; i < 100; i++) fpx(g, hash1(i, 3) * W, (hash1(i, 4) * H + this.t * 4 * (0.3 + hash1(i, 5))) % H, '#5a6fb0');
    const lines = [
      ['t', 'ARIDIA NEXUS'], ['s', 'LA CIUDAD QUE BEBÍA EL MAR'], ['', ''],
      ['h', 'Diseño, programación, pixel art procedural, música y sonido'], ['', 'Generados con código para este proyecto: Canvas 2D y Web Audio, sin recursos externos.'], ['', ''],
      ['h', 'Personajes'], ['', 'Amaya Serrano · KIRU · Naira Valdés · Dante Vela · Dra. Eliana Rojas'], ['', 'L.I.M.E.N. · MIRAGE · MOSAICO · Tía Marea · Don Cobre · Alma Semilla · BETA-9 · Capitán Nimbo'], ['', ''],
      ['h', 'Fuentes científicas base'],
      ...Object.values(SRC).map(v => ['f', v]),
      ['', ''], ['h', 'Nota'], ['', 'Aridia es un territorio ficticio inspirado en costas áridas del Caribe.'], ['', 'Los datos de escenario son supuestos de simulación para fines educativos.'], ['', 'Ningún resultado constituye asesoría técnica, operativa ni financiera.'], ['', ''],
      ['h', 'Ningún dato es ruido hasta entender su historia.'], ['', ''], ['', 'Gracias por jugar.'],
    ];
    let y = H - this.t * 18;
    for (const [k, txt] of lines) {
      if (k === 't') { if (y > -40 && y < H) drawTitleText(g, txt, W / 2, y, 3, ['#fff6d8', '#ffe14d', '#ff7656'], { align: 'center', shadow: '#2a1040' }); y += 38; continue; }
      if (k === 's') { if (y > -20 && y < H) drawText(g, txt, W / 2, y, { align: 'center', color: '#56e5ff' }); y += 20; continue; }
      if (k === 'h') { if (y > -20 && y < H) drawText(g, txt, W / 2, y, { align: 'center', color: '#ffe14d' }); y += 14; continue; }
      if (k === 'f') { const hh = textHeight(txt, 520, { font: 'tiny', lineH: 8 }); if (y > -40 && y < H) drawTextBlock(g, txt, 60, y, 520, { font: 'tiny', color: '#cfd6f0', align: 'center', lineH: 8 }); y += hh + 4; continue; }
      if (y > -20 && y < H) drawText(g, txt, W / 2, y, { align: 'center', color: '#fffaf0' }); y += 12;
    }
    drawText(g, 'ESC: cerrar · mantén ENTER: acelerar', W - 8, H - 10, { font: 'tiny', color: '#5a5e80', align: 'right' });
  },
};
