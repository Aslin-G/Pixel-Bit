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
  enter(p) { this.id = p.level; this.t = 0; this.onDone = p.onDone; Audio2.sfx('unlock'); Audio2.playMusic('ending'); this.ps = new Particles(300); this.banner = SCACards.captureBanner(typeof GameplayScene !== 'undefined' ? GameplayScene : null); },
  update(dt) {
    this.t += dt; this.ps.update(dt);
    // recompensa sobria: destellos de cristal y luciérnagas, sin confeti
    if (Math.random() < 0.1) this.ps.emit(Math.random() < 0.5 ? 'crystal' : 'firefly', 120 + Math.random() * (W - 240), 60 + Math.random() * 200, 0, -6, 1);
  },
  render(g) {
    const M = LEVEL_META[this.id], lp = GS.lp(this.id);
    SCACards.completeBackdrop(g, this.t);
    this.ps.render(g);
    const x = 70, y = 22, w = W - 140, h = H - 44;
    UIK.panel(g, x, y, w, h, 'tech');
    // franja ilustrada con el panorama del capítulo detrás del título
    SCACards.drawBanner(g, this.banner, x + 16, y + 21, w - 32, 34, this.t);
    UIK.badge(g, 'star', x - 3, y - 3, 22, 'tech');
    drawText(g, M.chapter + ' COMPLETADO', x + 28, y + 7, { font: 'bold', color: '#ffd23a' });
    frect(g, x + 22, y + 18, w - 28, 1, '#12305a'); frect(g, x + 22, y + 19, w - 28, 1, '#0b2a58');
    drawTitleText(g, M.title, W / 2, y + 24, 2, ['#ffffff', '#e6f8fe', '#a8c8ff'], { align: 'center', font: 'bold', shadow: '#000633', depth: 1, outline: '#000633' });
    // insignia (medalla de 48 px con el icono de la herramienta)
    const bx = x + 50, by = y + 98;
    const k = Math.min(1, this.t * 1.5);
    if (k > 0.05) {
      const r = Math.round(26 * k);
      fdisc(g, bx, by, r + 1, '#000633'); fdisc(g, bx, by, r, '#ffd23a'); fdisc(g, bx, by, r - 2, '#9a6a12'); fdisc(g, bx, by, r - 4, mixHex('#041533', M.pal[0], 0.35)); fdisc(g, bx - 3, by - 4, (r - 4) * 0.55, mixHex('#072248', M.pal[0], 0.5));
    }
    for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + this.t * 0.6; fpx(g, bx + Math.cos(a) * 31, by + Math.sin(a) * 31, i % 2 ? '#fff2a0' : '#ffd23a'); }
    if (k >= 1) { const ic = TOOLS[M.tool].icon; if (Icons.hasBig(ic)) Icons.drawBig(g, ic, bx, by); else Icons.draw(g, ic, bx - 14, by - 14, 2); }
    UIK.pill(g, bx, by + 32, 'INSIGNIA', { align: 'center', rim: '#ffd23a', fill: '#1a1404', color: '#fff2c0' });
    drawTextBlock(g, M.badge, bx - 44, by + 48, 88, { align: 'center', color: UI_INK.body });
    // criterios
    let yy = y + 58;
    drawText(g, 'CRITERIOS DE FINALIZACIÓN', x + 104, yy, { font: 'tiny', color: '#ffd23a' }); yy += 10;
    for (const c in CRITERIA_LABELS) { Icons.draw(g, lp[c] ? 'check' : 'cross', x + 102, yy - 2); drawText(g, CRITERIA_LABELS[c], x + 120, yy + 1, { color: lp[c] ? UI_INK.body : UI_INK.dim }); yy += 15; }
    yy += 2;
    drawText(g, 'HERRAMIENTA', x + 104, yy, { font: 'tiny', color: '#ffd23a' }); yy += 9;
    Icons.draw(g, TOOLS[M.tool].icon, x + 102, yy - 2); drawText(g, TOOLS[M.tool].name, x + 120, yy + 1, { color: '#8fdfff' }); yy += 18;
    const dt = '{y}Debrief:{/} ' + M.debrief, dh = textHeight(dt, w - 52) + 12;
    UIK.panel(g, x + 16, yy, w - 32, dh, 'sheet', null, { chamfer: 2, key: false });
    drawTextBlock(g, dt, x + 26, yy + 6, w - 52, { color: UI_INK.body });
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
/** Fondo común de simuladores (cacheado): azul noche plano con rejilla de 16 px y viñeta en bandas */
let _simBg = null;
function simBackdrop() {
  if (_simBg) return _simBg;
  const c = makeCanvas(W, H), b = c.getContext('2d');
  b.fillStyle = '#041026'; b.fillRect(0, 0, W, H);
  b.fillStyle = '#071a36'; b.fillRect(0, Math.round(H * 0.42), W, H);
  b.fillStyle = '#0a1e3a'; for (let x = 8; x < W; x += 16) b.fillRect(x, 0, 1, H); for (let y = 8; y < H; y += 16) b.fillRect(0, y, W, 1);
  b.fillStyle = '#0e2850'; for (let x = 8; x < W; x += 64) for (let y = 8; y < H; y += 64) b.fillRect(x - 1, y, 3, 1), b.fillRect(x, y - 1, 1, 3);
  b.globalAlpha = 0.5; b.fillStyle = '#020a1e'; b.fillRect(0, 0, W, 10); b.fillRect(0, H - 10, W, 10); b.globalAlpha = 1;
  _simBg = c; return c;
}
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
      // fondo de laboratorio: azul noche plano con rejilla de 16 px (prerenderizado, sin tramado)
      g.drawImage(simBackdrop(), 0, 0);
      this.draw && this.draw(g);
      this.ps.render(g);
      // cabecera: insignia + título en negrita + fase + puntos de fase + RA
      UIK.panel(g, 4, 4, W - 8, 22, def.style || 'hud', null, { chamfer: 2, key: false });
      UIK.badge(g, def.icon || 'flask', 2, 2, 22, def.style || 'hud');
      const ph = SIM_PHASES[this.phase] || this.phase;
      const phw = FONTS.main.measure(ph) + 14;
      const phx = W - phw - 128;
      drawText(g, fitText(def.title || '', phx - 40, 'bold'), 30, 11, { font: 'bold', color: '#edfcfe' });
      frect(g, phx, 8, phw, 14, '#000633'); frect(g, phx + 1, 9, phw - 2, 12, '#ffd23a'); frect(g, phx + 2, 10, phw - 4, 5, '#ffe58a');
      drawText(g, ph, phx + phw / 2, 11, { align: 'center', color: '#1a0f00' });
      def.phases.forEach((p2, i) => { const on = def.phases.indexOf(this.phase) >= i; const dx = W - 118 + i * 14; frect(g, dx, 11, 11, 8, '#000633'); frect(g, dx + 1, 12, 9, 6, on ? '#3fe0a0' : '#0b2444'); if (on) frect(g, dx + 1, 12, 9, 1, '#c2f5de'); });
      if (def.ra) UIK.pill(g, W - 9, 9, def.ra, { align: 'right', rim: '#8fdfff', fill: '#031128', color: '#c4fbff' });
      // mensaje de KIRU (u otro guía) como globo con cola hacia su busto
      if (this.msg && !this.verdict) {
        const m = this.msg, sp = SPEAKERS[m.who] || SPEAKERS.kiru;
        const bx = 6, by = H - 40;
        UIK.frame(g, bx, by, 34, 34, 'hud', { bg: mixHex('#0a2450', sp.color, 0.2) });
        const bust = UIK.bust(sp.portrait || 'kiru', 'smile');
        // recorte 1:1 de la cara (sin reescalar el arte)
        const cx0 = Math.round(bust.width / 2 - 13), cy0 = Math.max(0, Math.round(bust.height * 0.12));
        g.drawImage(bust, cx0, cy0, 26, 26, bx + 4, by + 4, 26, 26);
        UIK.speechBubble(g, bx + 34, by + 3, { name: sp.name ? sp.name.toUpperCase() : null, nameCol: sp.color, text: m.text, max: Math.floor(m.t * 60), w: 340, place: ['bl'], minY: 30 });
      }
      if (this.safeErr) this.renderSafeErr(g);
      Gui.renderTooltip(g);
    },
    renderSafeErr(g) {
      const e = this.safeErr;
      UIK.scrim(g, 0.55, '#1a0612');
      const w = 380, x = W / 2 - w / 2;
      const th = textHeight('{o}Consecuencia (reversible):{/} ' + e.text, w - 20) + textHeight(e.guide ? '{y}Pregunta orientadora:{/} ' + e.guide : '', w - 20) + 70;
      const y = Math.round(H / 2 - th / 2);
      UIK.panel(g, x, y, w, th, 'alert');
      UIK.header(g, x, y, w, 'ERROR SEGURO · ' + e.title, 'alert', 'warn');
      let yy = y + 24;
      yy += drawTextBlock(g, '{o}Consecuencia (reversible):{/} ' + e.text, x + 10, yy, w - 20, { color: '#ffe8e4' }) + 4;
      if (e.guide) yy += drawTextBlock(g, '{y}Pregunta orientadora:{/} ' + e.guide, x + 10, yy, w - 20, { color: '#ffe8e4' }) + 4;
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
    UIK.scrim(g, 0.62);
    const x = 50, w = W - 100;
    const opts = this.order.map(k => p.options[k]);
    const M = UIK.measureQuestion(w, p.prompt, opts);
    let fbTxt = '';
    if (this.fb) fbTxt = this.fb.ok ? '{g}Relación bien explicada.{/} ' + p.why : '{o}Revisa:{/} ' + (p.whyNot ? p.whyNot[this.fb.c] || p.why : p.why) + (this.conf === 'mucho' ? ' {p}(Respondiste con mucha confianza: es una buena oportunidad para revisar la concepción.){/}' : '');
    const fbh = this.fb ? textHeight(fbTxt, w - 46, { lineH: 11 }) + 12 : 0;
    const h = Math.min(H - 12, M.h + 34 + (fbh ? fbh + 4 : 0));
    const y = Math.max(6, Math.round(H / 2 - h / 2));
    const r = UIK.questionPanel(g, x, y, w, h, { title: 'EXPLICA LA RELACIÓN', icon: 'chart', stem: p.prompt, tag: 'RELACIONAL' });
    let yy = r.contentY;
    Gui.begin();
    this.order.forEach((k, i) => {
      let st = this.sel === k ? 'selected' : null;
      if (this.fb) st = k === p.key ? 'correct' : (k === this.fb.c ? 'wrong' : 'dim');
      const c = Gui.choice(g, 'ex' + i, r.x, yy, r.w, p.options[k], 'ABCD'[i], { state: st, disabled: !!this.fb });
      if (c.clicked && !this.fb) this.sel = k;
      yy += c.h + 3;
    });
    const by = y + h - 26;
    if (!this.fb) {
      drawText(g, '¿Qué tan seguro estás?', r.x, by + 5, { color: UI_INK.dim });
      ['poco', 'medio', 'mucho'].forEach((c, k) => { if (Gui.button(g, 'cf' + c, r.x + 130 + k * 58, by + 1, 54, 16, c.toUpperCase(), { style: this.conf === c ? 'gold' : 'ghost', selected: this.conf === c })) this.conf = c; });
      if (Gui.button(g, 'ok', r.x + r.w - 120, by, 120, 20, 'Explicar', { style: 'good', icon: 'check', disabled: this.sel < 0 || !this.conf })) {
        const ok = this.sel === p.key;
        this.fb = { c: this.sel, ok };
        LearningModel.record({ kind: 'challenge', id: p.id, ra: p.ra, concepts: p.concepts, solo: 4, correct: ok, confidence: this.conf, time: (nowMs() - this.t0) / 1000, misconception: ok ? null : p.mis, explanation: p.options[this.sel] });
        const lp = GS.lp(LearningModel.currentLevel ?? 0); lp.feedback = true; if (ok) lp.explain = true;
        Audio2.sfx(ok ? 'success' : 'error');
      }
    } else {
      UIK.panel(g, r.x, yy + 1, r.w, fbh, this.fb.ok ? 'green' : 'alert', null, { chamfer: 2, key: false, spark: false });
      Icons.draw(g, this.fb.ok ? 'check' : 'warn', r.x + 5, yy + 4);
      drawTextBlock(g, fbTxt, r.x + 22, yy + 7, w - 46, { color: this.fb.ok ? '#eafff6' : '#ffe8e4', lineH: 11 });
      if (!this.fb.ok && Gui.button(g, 'retry', r.x, by, 120, 20, 'Reintentar', { style: 'gold', icon: 'reset' })) { this.fb = null; this.sel = -1; this.conf = null; }
      if (Gui.button(g, 'cont', r.x + r.w - 120, by, 120, 20, 'Continuar', { style: 'good', icon: 'play' })) { Game.pop(); this.onDone && this.onDone(this.fb.ok); }
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
  for (let i = 0; i < text.length; i++) {
    const raw = text[i], up = raw.toUpperCase();
    const gl = TINY_SRC[TINY_MAP[up] || TINY_MAP[raw] || up]; if (!gl) continue;
    gl.forEach((row, ry) => { for (let k = 0; k < row.length; k++) if (row[k] === '#') pb.set(x - w / 2 + 4 + i * 4 + k, y - 28 + ry, '#fff6d8'); });
    if ('ÁÉÍÓÚ'.includes(up)) pb.set(x - w / 2 + 4 + i * 4 + 2, y - 29, '#fff6d8');
    if (up === 'Ñ') { pb.set(x - w / 2 + 4 + i * 4 + 1, y - 29, '#fff6d8'); pb.set(x - w / 2 + 4 + i * 4 + 2, y - 29, '#fff6d8'); }
  }
}
function drawLampPost(g, x, y, on = true, col = '#ffe14d') {
  frect(g, x, y - 34, 2, 34, '#263442'); frect(g, x - 3, y - 36, 8, 3, '#345a78'); frect(g, x - 2, y - 33, 6, 3, on ? col : '#3a4a6e');
  if (on) { fdither(g, x - 12, y - 40, 26, 20, col, 0.18); fdither(g, x - 6, y - 36, 14, 12, col, 0.3); }
}
/** Panel de HUD de nivel con varias medidas: placas de instrumento (insignia + etiqueta + valor + barra) */
function hudGauges(g, items, x = 6, y = H - 34) {
  UIK.instrumentPlates(g, items, x - 2, y - 2);
}
/** Etiqueta flotante para la Lente Nexo: píldora navy con borde del color del sistema */
function lensTag(g, x, y, text, col = '#56e5ff', icon = null) {
  const w = FONTS.tiny.measure(stripMarkup(text)) + (icon ? 18 : 8);
  x = Math.round(x); y = Math.round(y);
  frect(g, x, y - 1, w, 11, '#000633'); frect(g, x - 1, y, w + 2, 9, '#000633');
  frect(g, x, y, w, 9, col); frect(g, x + 1, y + 1, w - 2, 7, '#031128'); frect(g, x + 1, y + 1, w - 2, 1, mixHex('#031128', col, 0.25));
  if (icon) Icons.draw(g, icon, x + 2, y - 3);
  drawText(g, text, x + (icon ? 16 : 4), y + 2, { font: 'tiny', color: mixHex(col, '#ffffff', 0.6) });
}
function lensBoundary(g, x, y, w, h, col = '#ffe14d', label = null) {
  const t = Math.floor(Game.time * 12);
  for (let i = 0; i < w; i++) if (((i + t) >> 2) & 1) { fpx(g, x + i, y, col); fpx(g, x + i, y + h, col); }
  for (let i = 0; i < h; i++) if (((i + t) >> 2) & 1) { fpx(g, x, y + i, col); fpx(g, x + w, y + i, col); }
  if (label) drawText(g, label, x + 3, y + 3, { font: 'tiny', color: col });
}
