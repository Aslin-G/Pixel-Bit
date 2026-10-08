/* =====================================================================
   40_common.js — Utilidades comunes de niveles: marco de simulador,
   fases pedagógicas, error seguro, criterios de finalización, insignias,
   pantalla de nivel completado, decoración compartida.
   ===================================================================== */

const LEVEL_META = {
  0: { title: 'El Mapa del Nexo', chapter: 'CAPÍTULO 00', badge: 'Cartógrafa del Nexo', tool: 'lente', ra: 'RA-08', debrief: 'Un mapa simple puede ser más útil que uno espectacular si muestra límites y supuestos.', pal: ['#20d6c7', '#ff6b6b', '#ffe14d', '#102a43'] },
  1: { title: 'La Boca del Mar', chapter: 'CAPÍTULO 01', badge: 'Guardiana de la Toma', tool: 'barrido', ra: 'RA-01', debrief: 'Captar más no significa producir mejor si el agua cruda supera el diseño.', pal: ['#0d3168', '#20d6c7', '#f2c14e', '#ff4e5d'] },
  2: { title: 'El Laberinto Osmótico', chapter: 'CAPÍTULO 02', badge: 'Tejedora Osmótica', tool: 'tejedor', ra: 'RA-02', debrief: 'La mejor operación no es la que produce más durante un minuto, sino la que sostiene calidad y disponibilidad.', pal: ['#fff4de', '#56e5ff', '#8d6bff', '#263442'] },
  3: { title: 'Los Cañones de Sal', chapter: 'CAPÍTULO 03', badge: 'Custodia del Límite', tool: 'brujula', ra: 'RA-03', debrief: 'Una solución ambiental debe mirar trayectoria, duración y receptores, no solo el punto de salida.', pal: ['#f78acb', '#ff9f43', '#0f4a5a', '#33946a'] },
  4: { title: 'Las Dunas Fotónicas', chapter: 'CAPÍTULO 04', badge: 'Guía Fotónica', tool: 'rele', ra: 'RA-04', debrief: 'Un pico brillante puede ocultar una noche sin reserva.', pal: ['#ffe14d', '#ff9f43', '#20d6c7', '#4ccb70'] },
  5: { title: 'Las Torres de Brisa', chapter: 'CAPÍTULO 05', badge: 'Navegante de Brisa', tool: 'vela', ra: 'RA-04', debrief: 'Más viento puede exigir menos producción por seguridad.', pal: ['#7ccaf4', '#ffffff', '#8ff5c8', '#e34ad8'] },
  6: { title: 'La Bóveda de Carga', chapter: 'CAPÍTULO 06', badge: 'Custodia de Reserva', tool: 'reserva', ra: 'RA-05', debrief: 'La energía almacenada tiene valor por cuándo puede usarse.', pal: ['#2c63c0', '#b6f05a', '#8d6bff', '#ff6b6b'] },
  7: { title: 'La Ciudadela del Hidrógeno', chapter: 'CAPÍTULO 07', badge: 'Sincronista H2', tool: 'sincro', ra: 'RA-06', debrief: 'El hidrógeno hereda impactos de la electricidad y del agua que lo producen.', pal: ['#56e5ff', '#ffffff', '#86e36f', '#ffb93b'] },
  8: { title: 'El Oasis de las Raíces', chapter: 'CAPÍTULO 08', badge: 'Tejedora de Raíces', tool: 'raices', ra: 'RA-07', debrief: 'Una planta puede recibir agua y seguir teniendo sed fisiológica.', pal: ['#4ccb70', '#c9622e', '#20d6c7', '#ffe14d'] },
  9: { title: 'La Mesa del Nexo', chapter: 'CAPÍTULO 09', badge: 'Mediadora del Nexo', tool: 'tablero', ra: 'RA-08', debrief: 'Una decisión transparente puede ser discutida; una puntuación opaca solo puede obedecerse.', pal: ['#2152b5', '#eab02a', '#ff6b6b', '#1f854c'] },
  10: { title: 'La Gran Calima', chapter: 'CAPÍTULO 10', badge: 'Arquitecta Mosaico', tool: 'mosaicoVivo', ra: 'RA-08', debrief: 'Resiliencia es conservar funciones esenciales, aprender y reconstruir.', pal: ['#c97c38', '#d8343c', '#56e5ff', '#86e36f'] },
};
const CRITERIA_LABELS = { tech: 'Completó la tarea técnica', explain: 'Explicó una relación causal', variant: 'Aplicó el concepto en una variante', feedback: 'Recibió feedback causal', codex: 'Desbloqueó fichas del Atlas', mastery: 'Actualizó su dominio estimado' };

/** Comprueba criterios y abre la pantalla de nivel completado */
function completeLevel(sc, extra = {}) {
  const id = sc.levelId, lp = GS.lp(id), M = LEVEL_META[id];
  if (!GS.s.completed.includes(id)) GS.s.completed.push(id);
  if (!GS.s.badges.includes(M.badge)) GS.s.badges.push(M.badge);
  const next = id + 1;
  if (LEVELS[next] && !GS.s.unlocked.includes(next)) GS.s.unlocked.push(next);
  GS.s.checkpoint = null;
  GS.save();
  return sc.open(LevelCompleteScene, { level: id, extra });
}

const LevelCompleteScene = {
  overlay: true,
  enter(p) { this.id = p.level; this.t = 0; this.onDone = p.onDone; Audio2.sfx('unlock'); Audio2.playMusic('ending'); this.ps = new Particles(300); },
  update(dt) {
    this.t += dt; this.ps.update(dt);
    if (Math.random() < 0.4) this.ps.emit('confetti', Math.random() * W, -4, 0, 30, 1);
  },
  render(g) {
    const M = LEVEL_META[this.id], lp = GS.lp(this.id);
    fdither(g, 0, 0, W, H, '#05030f', 0.78);
    this.ps.render(g);
    const x = 70, y = 22, w = W - 140, h = H - 44;
    UIK.panel(g, x, y, w, h, 'dialog');
    drawText(g, M.chapter + ' COMPLETADO', W / 2, y + 10, { align: 'center', font: 'tiny', color: '#ffe14d' });
    drawTitleText(g, M.title, W / 2, y + 20, 2, ['#fffaf0', '#ffe14d', '#ff9f43'], { align: 'center', shadow: '#140d26', depth: 2 });
    // insignia
    const bx = x + 46, by = y + 92;
    const k = Math.min(1, this.t * 1.5);
    fdisc(g, bx, by, 26 * k, '#8a5e14'); fdisc(g, bx, by, 23 * k, '#eab02a'); fdisc(g, bx, by, 18 * k, M.pal[0]);
    for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + this.t; fpx(g, bx + Math.cos(a) * 30, by + Math.sin(a) * 30, '#fff08a'); }
    if (k >= 1) Icons.draw(g, TOOLS[M.tool].icon, bx - 14, by - 14, 2);
    drawText(g, 'INSIGNIA', bx, by + 32, { align: 'center', font: 'tiny', color: '#ffe14d' });
    drawTextBlock(g, M.badge, bx - 40, by + 40, 80, { align: 'center', color: '#fffaf0' });
    // criterios
    let yy = y + 56;
    drawText(g, 'CRITERIOS DE FINALIZACIÓN', x + 100, yy, { font: 'tiny', color: '#ffe14d' }); yy += 10;
    for (const c in CRITERIA_LABELS) { Icons.draw(g, lp[c] ? 'check' : 'cross', x + 98, yy - 2); drawText(g, CRITERIA_LABELS[c], x + 116, yy + 1, { color: lp[c] ? '#fffaf0' : '#8a8fb8' }); yy += 15; }
    yy += 2;
    drawText(g, 'HERRAMIENTA', x + 100, yy, { font: 'tiny', color: '#ffe14d' }); yy += 9;
    Icons.draw(g, TOOLS[M.tool].icon, x + 98, yy - 2); drawText(g, TOOLS[M.tool].name, x + 116, yy + 1, { color: '#a6f4ff' }); yy += 18;
    UIK.panel(g, x + 16, yy, w - 32, 40, 'glass');
    drawTextBlock(g, '{y}Debrief:{/} ' + M.debrief, x + 24, yy + 6, w - 48, { color: '#fffaf0' });
    Gui.begin();
    if (this.t > 1 && Gui.button(g, 'cont', W / 2 - 80, y + h - 28, 160, 20, 'Continuar', { style: 'good', icon: 'play' })) { Game.pop(); this.onDone && this.onDone(); }
    Gui.end();
  },
};

/* =====================================================================
   Marco de simulador (laboratorio / gemelo digital)
   Uso: const S = makeSim({...}) → escena overlay con fases, panel de
   controles, error seguro y registro de evidencia.
   ===================================================================== */
const SIM_PHASES = { demo: 'Demostración', guided: 'Práctica guiada', auto: 'Práctica autónoma', transfer: 'Transferencia', free: 'Laboratorio libre' };
function makeSim(def) {
  return Object.assign({
    overlay: true,
    enter(p) {
      this.p = p; this.onDone = p.onDone; this.gp = p.gameplay; this.t = 0; this.phase = p.phase || def.phases[0];
      this.hints = 0; this.attempts = 0; this.safeErr = null; this.msg = null; this.result = {}; this.startT = nowMs(); this.paused = false; this.speed = 1;
      this.ps = new Particles(600);
      Audio2.sfx('power', { vol: 0.5 });
      this.init && this.init(p);
      this.enterPhase(this.phase);
    },
    enterPhase(ph) {
      this.phase = ph; this.phaseT = 0; this.hints = 0; this.phaseStart = nowMs(); this.attemptsPhase = 0;
      this.onPhase && this.onPhase(ph);
    },
    nextPhase() {
      const i = def.phases.indexOf(this.phase);
      if (i < def.phases.length - 1) { Audio2.sfx('confirm'); this.enterPhase(def.phases[i + 1]); }
      else this.finish(true);
    },
    finish(ok) { Game.pop(); this.onDone && this.onDone(Object.assign({ ok }, this.result)); },
    /** Estado de error seguro: pausa, explica consecuencia reversible, permite inspeccionar */
    safeError(title, text, guide) { if (this.safeErr) return; this.safeErr = { title, text, guide, t: 0 }; this.paused = true; Audio2.sfx('alarm', { vol: 0.5 }); LearningModel.note('safeError'); },
    /** Registra evidencia de un reto manipulativo */
    evidence(id, correct, extra = {}) {
      const time = (nowMs() - this.phaseStart) / 1000;
      LearningModel.record(Object.assign({ kind: 'challenge', id, ra: def.ra, concepts: def.concepts, solo: extra.solo || 3, correct, hints: this.hints, time, transfer: this.phase === 'transfer' }, extra));
      const lp = GS.lp(LearningModel.currentLevel ?? 0);
      lp.feedback = true; lp.attempts++;
      if (correct && (this.phase === 'auto' || this.phase === 'guided')) lp.tech = true;
      if (correct && this.phase === 'transfer') lp.variant = true;
    },
    say(text, who = 'kiru') { this.msg = { text, who, t: 0 }; Audio2.sfx('voice', { voice: SPEAKERS[who] ? SPEAKERS[who].voice : 'kiru' }); },
    hint() {
      const hs = def.hintLadder || [];
      if (!hs.length) return;
      const h = hs[Math.min(this.hints, hs.length - 1)];
      this.say(['{y}Pregunta:{/} ', '{y}Evidencia:{/} ', '{y}Demostración parcial:{/} '][Math.min(this.hints, 2)] + h);
      if (this.hints === 2 && this.partial) this.partial();
      this.hints = Math.min(this.hints + 1, 3); GS.s.stats.hints++; LearningModel.note('hint');
    },
    update(dt) {
      this.t += dt; this.phaseT += dt;
      if (this.msg) this.msg.t += dt;
      if (this.safeErr) { this.safeErr.t += dt; return; }
      if (Input.pressed('hint')) this.hint();
      if (Input.pressed('cancel') && def.canExit !== false) { this.finish(false); return; }
      if (Input.pressed('reset') && this.reset) { this.reset(); Audio2.sfx('uiBack'); }
      if (!this.paused) for (let i = 0; i < this.speed; i++) this.step && this.step(dt);
      this.ps.update(dt);
    },
    render(g) {
      frect(g, 0, 0, W, H, '#070a1c');
      fdither(g, 0, 0, W, H, '#0e1430', 0.5);
      this.draw && this.draw(g);
      this.ps.render(g);
      // cabecera
      UIK.panel(g, 4, 4, W - 8, 20, def.style || 'tech');
      Icons.draw(g, def.icon || 'flask', 9, 7);
      drawText(g, def.title, 26, 10, { color: '#fffaf0', shadow: '#070a1c' });
      const ph = SIM_PHASES[this.phase] || this.phase;
      const phw = FONTS.main.measure(ph) + 14;
      frect(g, W - phw - 120, 7, phw, 13, '#ffe14d'); drawText(g, ph, W - phw / 2 - 120, 10, { align: 'center', color: '#140d26' });
      // indicadores de fase
      def.phases.forEach((p2, i) => { const on = def.phases.indexOf(this.phase) >= i; frect(g, W - 110 + i * 14, 10, 10, 7, on ? '#86e36f' : '#1c2350'); });
      drawText(g, def.ra || '', W - 52, 11, { font: 'tiny', color: '#a6f4ff' });
      if (this.msg && !this.verdict) {
        const m = this.msg, sp = SPEAKERS[m.who] || SPEAKERS.kiru;
        const lines = wrapText(m.text, 300);
        const hh = lines.length * 11 + 10;
        const by = H - hh - 6;
        UIK.panel(g, 6, by, 340, hh, 'glass');
        Icons.draw(g, m.who === 'kiru' ? 'kiru' : 'person', 10, by + 4);
        let rem = Math.floor(m.t * 60);
        lines.forEach((l, i) => { if (rem > 0) drawText(g, l, 28, by + 5 + i * 11, { color: '#fffaf0', max: rem, shadow: '#070a1c' }); rem -= stripMarkup(l).length + 1; });
      }
      if (this.safeErr) this.renderSafeErr(g);
      Gui.renderTooltip(g);
    },
    renderSafeErr(g) {
      const e = this.safeErr;
      fdither(g, 0, 0, W, H, '#2a0c18', 0.5);
      const w = 380, x = W / 2 - w / 2;
      const th = textHeight(e.text, w - 20) + textHeight(e.guide || '', w - 20) + 70;
      const y = H / 2 - th / 2;
      UIK.panel(g, x, y, w, th, 'alert');
      UIK.header(g, x, y, w, 'ESTADO DE ERROR SEGURO · ' + e.title, 'alert', 'warn');
      let yy = y + 22;
      yy += drawTextBlock(g, '{o}Consecuencia (reversible):{/} ' + e.text, x + 10, yy, w - 20, { color: '#fffaf0' }) + 4;
      if (e.guide) yy += drawTextBlock(g, '{y}Pregunta orientadora:{/} ' + e.guide, x + 10, yy, w - 20, { color: '#fffaf0' }) + 4;
      Gui.begin();
      if (Gui.button(g, 'serr_inspect', x + 10, y + th - 26, 150, 18, 'Inspeccionar datos', { icon: 'eye', style: 'ghost' })) { this.safeErr = null; this.inspect = true; }
      if (Gui.button(g, 'serr_retry', x + w - 160, y + th - 26, 150, 18, 'Corregir y continuar', { icon: 'reset', style: 'gold' })) { this.safeErr = null; this.paused = false; this.onSafeRetry && this.onSafeRetry(); }
      Gui.end();
    },
  }, def);
}

/* ---------- Pregunta de "explicar la relación" (criterio explain) ---------- */
const ExplainScene = {
  overlay: true,
  enter(p) { this.p = p; this.onDone = p.onDone; this.sel = -1; this.fb = null; this.order = RNG((p.id || 'x').length * 31 + 7).shuffle(p.options.map((_, i) => i)); this.t0 = nowMs(); this.conf = null; },
  update() { },
  render(g) {
    const p = this.p;
    fdither(g, 0, 0, W, H, '#05030f', 0.75);
    const x = 50, w = W - 100;
    UIK.panel(g, x, 30, w, H - 60, 'tech');
    UIK.header(g, x, 30, w, 'EXPLICA LA RELACIÓN', 'tech', 'chart');
    let y = 52;
    y += drawTextBlock(g, p.prompt, x + 10, y, w - 20, { color: '#fffaf0' }) + 6;
    Gui.begin();
    this.order.forEach((k, i) => {
      let st = this.sel === k ? 'selected' : null;
      if (this.fb) st = k === p.key ? 'correct' : (k === this.fb.c ? 'wrong' : 'dim');
      const r = Gui.choice(g, 'ex' + i, x + 10, y, w - 20, p.options[k], 'ABCD'[i], { state: st, disabled: !!this.fb });
      if (r.clicked && !this.fb) this.sel = k;
      y += r.h + 3;
    });
    if (!this.fb) {
      drawText(g, '¿Qué tan seguro estás?', x + 10, H - 56, { font: 'tiny', color: '#cfd6f0' });
      ['poco', 'medio', 'mucho'].forEach((c, k) => { if (Gui.button(g, 'cf' + c, x + 110 + k * 56, H - 60, 52, 14, c.toUpperCase(), { style: this.conf === c ? 'gold' : 'ghost' })) this.conf = c; });
      if (Gui.button(g, 'ok', x + w - 130, H - 62, 120, 20, 'Explicar', { style: 'good', icon: 'check', disabled: this.sel < 0 || !this.conf })) {
        const ok = this.sel === p.key;
        this.fb = { c: this.sel, ok };
        LearningModel.record({ kind: 'challenge', id: p.id, ra: p.ra, concepts: p.concepts, solo: 4, correct: ok, confidence: this.conf, time: (nowMs() - this.t0) / 1000, misconception: ok ? null : p.mis, explanation: p.options[this.sel] });
        const lp = GS.lp(LearningModel.currentLevel ?? 0); lp.feedback = true; if (ok) lp.explain = true;
        Audio2.sfx(ok ? 'success' : 'error');
      }
    } else {
      const txt = this.fb.ok ? '{g}Relación bien explicada.{/} ' + p.why : '{o}Revisa:{/} ' + (p.whyNot ? p.whyNot[this.fb.c] || p.why : p.why) + (this.conf === 'mucho' ? ' {p}(Respondiste con mucha confianza: es una buena oportunidad para revisar la concepción.){/}' : '');
      const hh = textHeight(txt, w - 40) + 10;
      UIK.panel(g, x + 10, H - 70 - hh, w - 20, hh, this.fb.ok ? 'green' : 'alert');
      drawTextBlock(g, txt, x + 16, H - 65 - hh, w - 32, { color: '#fffaf0' });
      if (!this.fb.ok && Gui.button(g, 'retry', x + 10, H - 62, 120, 20, 'Reintentar', { style: 'gold', icon: 'reset' })) { this.fb = null; this.sel = -1; this.conf = null; }
      if (Gui.button(g, 'cont', x + w - 130, H - 62, 120, 20, 'Continuar', { style: 'good', icon: 'play' })) { Game.pop(); this.onDone && this.onDone(this.fb.ok); }
    }
    Gui.end();
  },
};
function explain(sc, p) { return sc.open(ExplainScene, p); }

/* ---------- Decoración compartida ---------- */
function drawSign(pb, x, y, text, col = '#8a5a3c') {
  pb.rect(x - 1, y - 22, 3, 22, '#5a3826');
  const w = text.length * 4 + 8;
  pb.rect(x - w / 2, y - 30, w, 11, col); pb.rect(x - w / 2, y - 30, w, 1, shade(col, 0.3)); pb.rect(x - w / 2, y - 20, w, 1, shade(col, -0.3));
  for (let i = 0; i < text.length; i++) { const gl = TINY_SRC[text[i].toUpperCase()]; if (!gl) continue; gl.forEach((row, ry) => { for (let k = 0; k < row.length; k++) if (row[k] === '#') pb.set(x - w / 2 + 4 + i * 4 + k, y - 28 + ry, '#fff6d8'); }); }
}
function drawLampPost(g, x, y, on = true, col = '#ffe14d') {
  frect(g, x, y - 34, 2, 34, '#263442'); frect(g, x - 3, y - 36, 8, 3, '#345a78'); frect(g, x - 2, y - 33, 6, 3, on ? col : '#3a4a6e');
  if (on) { fdither(g, x - 12, y - 40, 26, 20, col, 0.18); fdither(g, x - 6, y - 36, 14, 12, col, 0.3); }
}
/** Panel de HUD de nivel con varias medidas */
function hudGauges(g, items, x = 6, y = H - 34) {
  const w = items.length * 92 + 8;
  UIK.panel(g, x, y, w, 28, 'glass');
  items.forEach((it, i) => {
    const xx = x + 6 + i * 92;
    Icons.draw(g, it.icon, xx, y + 3);
    drawText(g, it.label, xx + 16, y + 4, { font: 'tiny', color: '#cfd6f0' });
    drawText(g, it.value, xx + 16, y + 12, { color: it.color || '#fffaf0', shadow: '#070a1c' });
    if (it.frac != null) UIK.bar(g, xx, y + 22, 84, 4, it.frac, it.color || '#56e5ff');
  });
}
/** Etiqueta flotante para la Lente Nexo */
function lensTag(g, x, y, text, col = '#56e5ff', icon = null) {
  const w = FONTS.tiny.measure(stripMarkup(text)) + (icon ? 18 : 8);
  x = Math.round(x); y = Math.round(y);
  frect(g, x - 1, y - 1, w + 2, 11, '#05031a'); frect(g, x, y, w, 9, '#0a1030'); frect(g, x, y, 2, 9, col);
  if (icon) Icons.draw(g, icon, x + 2, y - 3);
  drawText(g, text, x + (icon ? 16 : 5), y + 2, { font: 'tiny', color: col });
}
function lensBoundary(g, x, y, w, h, col = '#ffe14d', label = null) {
  const t = Math.floor(Game.time * 12);
  for (let i = 0; i < w; i++) if (((i + t) >> 2) & 1) { fpx(g, x + i, y, col); fpx(g, x + i, y + h, col); }
  for (let i = 0; i < h; i++) if (((i + t) >> 2) & 1) { fpx(g, x, y + i, col); fpx(g, x + w, y + i, col); }
  if (label) drawText(g, label, x + 3, y + 3, { font: 'tiny', color: col });
}
