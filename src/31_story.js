/* =====================================================================
   31_story.js — Diálogos con retratos, elecciones, globo de pensamiento,
   metadatos de personajes y Tablero de Evidencias (misterio).
   ===================================================================== */

const SPEAKERS = {
  amaya: { name: 'Amaya', color: '#ff7656', voice: 'amaya', portrait: 'amaya' },
  kiru: { name: 'KIRU', color: '#20d6c7', voice: 'kiru', portrait: 'kiru' },
  naira: { name: 'Naira', color: '#86e36f', voice: 'naira', portrait: 'naira' },
  dante: { name: 'Dante', color: '#6cb4ff', voice: 'dante', portrait: 'dante' },
  eliana: { name: 'Dra. Eliana', color: '#b49cff', voice: 'eliana', portrait: 'eliana' },
  limen: { name: 'LIMEN', color: '#7ee8f0', voice: 'limen', portrait: 'limen' },
  mirage: { name: 'MIRAGE', color: '#f27ee6', voice: 'mirage', portrait: 'mirage' },
  mosaico: { name: 'MOSAICO', color: '#c2f58e', voice: 'mosaico', portrait: 'mosaico' },
  marea: { name: 'Tía Marea', color: '#56e5ff', voice: 'npc', portrait: 'marea' },
  cobre: { name: 'Don Cobre', color: '#e8873e', voice: 'npc', portrait: 'cobre' },
  alma: { name: 'Alma Semilla', color: '#f78acb', voice: 'kiru', portrait: 'alma' },
  beta9: { name: 'BETA-9', color: '#b6f05a', voice: 'beta', portrait: 'beta9' },
  nimbo: { name: 'Capitán Nimbo', color: '#ffe14d', voice: 'dante', portrait: 'nimbo' },
  consejal: { name: 'Consejera Ruth', color: '#f78acb', voice: 'naira', portrait: 'consejal' },
  operador: { name: 'Operador Iván', color: '#ff9f43', voice: 'dante', portrait: 'operador' },
  pastora: { name: 'Doña Celia', color: '#ff9a8a', voice: 'npc', portrait: 'pastora' },
  financia: { name: 'Sr. Ledesma', color: '#9a90ee', voice: 'npc', portrait: 'financia' },
  sys: { name: 'SYNARA', color: '#56e5ff', voice: 'limen', portrait: null },
  narr: { name: '', color: '#fffaf0', voice: null, portrait: null },
  nino: { name: 'Niña', color: '#ffe14d', voice: 'kiru', portrait: 'alma' },
};

/**
 * DialogueScene: overlay. lines: [{who, text, expr, side, choices:[...]}]
 * onDone(result) → índice de elección (si hubo) o null.
 */
const DialogueScene = {
  overlay: true,
  enter(p) {
    this.lines = p.lines; this.i = 0; this.onDone = p.onDone; this.t = 0; this.choice = 0; this.result = null;
    this.bgDim = p.dim ?? 0.0; this.silence = 0;
    this.startLine();
  },
  startLine() {
    const L = this.lines[this.i];
    this.t = 0; this.shown = 0; this.done = false; this.choice = 0; this.lastBlip = 0;
    this.silence = L.pause || 0;
    this.full = String(L.text || '');
    this.plain = stripMarkup(this.full);
    announce((SPEAKERS[L.who] ? SPEAKERS[L.who].name + ': ' : '') + this.plain);
    if (L.sfx) Audio2.sfx(L.sfx);
    if (L.onShow) L.onShow();
  },
  update(dt) {
    const L = this.lines[this.i];
    if (this.silence > 0) { this.silence -= dt; return; }
    this.t += dt;
    const speed = 42 * Game.settings.dialogSpeed * (Input.down('fast') ? 3 : 1);
    if (!this.done) {
      const prev = Math.floor(this.shown);
      this.shown = Math.min(this.plain.length, this.shown + speed * dt);
      const cur = Math.floor(this.shown);
      if (cur > prev) {
        const ch = this.plain[cur - 1];
        const sp = SPEAKERS[L.who];
        if (sp && sp.voice && ch && ch !== ' ' && (cur % 2 === 0)) Audio2.sfx('voice', { voice: sp.voice, vol: 0.7 });
        if (ch === '.' || ch === '?' || ch === '!') this.silence = 0.12 / Game.settings.dialogSpeed;
      }
      if (this.shown >= this.plain.length) this.done = true;
    }
    const adv = Input.pressed('confirm') || Input.pressed('jump') || Input.pressed('interact') || (Input.pointer.pressed && !L.choices);
    if (Input.pressed('skip') && !L.choices && !L.noSkip) { this.done = true; this.shown = this.plain.length; this.next(); return; }
    if (L.choices) {
      if (!this.done) { if (adv) { this.done = true; this.shown = this.plain.length; } return; }
      return; // la elección la gestiona Gui en render
    }
    if (adv) {
      if (!this.done) { this.done = true; this.shown = this.plain.length; }
      else this.next();
    } else if (this.done && Game.settings.autoAdvance) { this.autoT = (this.autoT || 0) + dt; if (this.autoT > 1.6 + this.plain.length * 0.03) { this.autoT = 0; this.next(); } }
  },
  next(choiceIdx) {
    const L = this.lines[this.i];
    if (choiceIdx !== undefined) { this.result = choiceIdx; if (L.onChoose) L.onChoose(choiceIdx); }
    Audio2.sfx('soft', { vol: 0.4 });
    this.i++;
    if (this.i >= this.lines.length) { Game.pop(); this.onDone && this.onDone(this.result); }
    else this.startLine();
  },
  /** Hablante visible en el plano jugable (para el modo globo anclado) o null */
  speakerEntity(L) {
    if (typeof GameplayScene === 'undefined') return null;
    const k = Game.scenes.indexOf(this);
    if (k < 1 || Game.scenes[k - 1] !== GameplayScene) return null;
    const gp = GameplayScene;
    if (!gp.world || !gp.cam || gp.hideHUD) return null;
    const who = L.who, sp = SPEAKERS[who];
    let e = null;
    if (who === 'amaya') e = gp.player;
    else if (who === 'kiru') e = gp.kiru;
    else e = gp.world.entities.find(a => a instanceof Actor && !a.hidden && (a.id === who || a.charId === who || (sp && sp.portrait && a.charId === sp.portrait) || (sp && a.name && a.name === sp.name)));
    if (!e) return null;
    const sx = e.x - gp.cam.ox, sy = e.y - gp.cam.oy;
    if (sx < 18 || sx > W - 18 || sy < 50 || sy > H + 8) return null;
    return { e, sx, sy, cid: e === gp.player ? 'amaya' : e === gp.kiru ? 'kiru' : e.charId };
  },
  render(g) {
    const L = this.lines[this.i];
    if (!L) return;
    if (this.bgDim) UIK.scrim(g, Math.min(0.85, this.bgDim));
    const sp = SPEAKERS[L.who] || SPEAKERS.narr;
    const style = L.who === 'mirage' ? 'mirage' : L.who === 'limen' ? 'limen' : L.who === 'mosaico' ? 'mosaic' : 'tech';
    const shown = Math.floor(this.shown);
    // modo globo: el hablante está en pantalla, sin elecciones y con un texto breve
    const ent = (!L.choices && L.mode !== 'portrait' && this.plain.length <= 190) ? this.speakerEntity(L) : null;
    const hint = L.choices ? 'elige una opción' : (L.noSkip ? 'ENTER: seguir' : 'ENTER: seguir · X: saltar');
    if (ent) { this.renderBubble(g, L, sp, ent, style, shown); UIK.pill(g, W - 6, H - 13, hint, { align: 'right', rim: '#3a5a8a', fill: '#041533', color: '#93a6c8' }); }
    else this.renderCinematic(g, L, sp, style, shown, hint);
  },
  renderBubble(g, L, sp, ent, style, shown) {
    const head = UIK.headTop(ent.cid);
    const ax = Math.round(ent.sx), ay = Math.round(ent.sy - head - 3);
    const avoid = (UIK._hudRects || []).slice();
    avoid.push({ x: ax - 16, y: ay + 2, w: 32, h: head });
    const gp = GameplayScene;
    if (gp.player && ent.e !== gp.player) { const px = gp.player.x - gp.cam.ox, py = gp.player.y - gp.cam.oy; avoid.push({ x: px - 14, y: py - UIK.headTop('amaya'), w: 28, h: UIK.headTop('amaya') }); }
    UIK.speechBubble(g, ax, ay, { name: sp.name ? sp.name.toUpperCase() : null, nameCol: sp.color, text: this.full, max: shown, w: 210, style, avoid, minY: 4, maxY: H - 18, more: this.done });
  },
  renderCinematic(g, L, sp, style, shown, hint = '') {
    const big = Game.settings.textScale > 1;
    const s = panelStyle(style);
    const side = L.side || (['amaya', 'kiru'].includes(L.who) ? 'left' : 'right');
    const hasP = !!(sp.portrait && L.portrait !== false);
    let fw = 0;
    if (hasP) {
      const talking = !this.done && (Math.floor(this.t * 9) % 2 === 0);
      const pc = Portraits.get(sp.portrait, L.expr || 'neutral', talking ? 1 : 0, (Math.floor(Game.time * 0.4) % 7 === 0) && (Game.time % 2.5) < 0.12);
      const pw = pc.width, ph = pc.height;
      fw = pw + 8; const fh = ph + 8;
      const fx = side === 'left' ? 6 : W - 6 - fw, fy = H - 6 - fh;
      // marco de retrato completo (sin recortar), fondo teñido con el color del personaje
      const bg = mixHex('#041533', sp.color, 0.18);
      UIK.frame(g, fx, fy, fw, fh, style, { bg });
      g.save(); g.beginPath(); g.rect(fx + 4, fy + 4, pw, ph); g.clip();
      g.globalAlpha = 0.35; fdisc(g, fx + 4 + pw / 2, fy + 4 + ph * 0.46, pw * 0.42, mixHex(bg, '#4a6ab0', 0.5));
      g.globalAlpha = 0.35; fdisc(g, fx + 4 + pw / 2, fy + 4 + ph * 0.42, pw * 0.28, mixHex(bg, sp.color, 0.35)); g.globalAlpha = 1;
      frect(g, fx + 4, fy + 4 + ph - 10, pw, 10, mixHex(bg, '#000633', 0.4));
      if (side === 'right') { g.translate(fx + 4 + pw, fy + 4); g.scale(-1, 1); g.drawImage(pc, 0, 0); }
      else g.drawImage(pc, fx + 4, fy + 4);
      g.restore();
      // placa de nombre sobre el borde superior del marco
      if (sp.name) {
        const nm = sp.name.toUpperCase(), nw = FONTS.bold.measure(nm) + 14;
        const nx = side === 'left' ? fx + 6 : fx + fw - 6 - nw, ny = fy - 7;
        UIK.panel(g, nx, ny, nw, 14, style, null, { chamfer: 2, key: false, spark: false });
        frect(g, nx + 3, ny + 3, 2, 8, sp.color);
        drawText(g, nm, nx + 8, ny + 4, { font: 'bold', color: s.title });
      }
    }
    const px = hasP && side === 'left' ? 6 + fw + 4 : 6;
    const pw2 = hasP ? W - 12 - fw - 4 : W - 12;
    // la caja se ajusta al texto (sin franjas vacías) y se apoya en el borde inferior
    const lh = big ? 13 : 12;
    const textH = textHeight(this.full, pw2 - 22, { lineH: lh });
    const boxH = clamp(textH + (sp.name ? 15 : 0) + 22, 44, big ? 120 : 100), boxY = H - boxH - 6;
    UIK.panel(g, px, boxY, pw2, boxH, style);
    if (hint) UIK.pill(g, px + pw2 - 9, boxY + 6, hint, { align: 'right', rim: '#2b3b5d', fill: '#041533', color: '#93a6c8' });
    let ty = boxY + 8;
    if (sp.name) {
      drawText(g, sp.name.toUpperCase(), px + 10, ty, { font: 'bold', color: s.title });
      frect(g, px + 10, ty + 10, 16, 2, sp.color);
      ty += 15;
    }
    drawTextBlock(g, this.full, px + 10, ty, pw2 - 22, { max: shown, lineH: big ? 13 : 12, color: s.text });
    if (L.choices && this.done) {
      Gui.begin();
      const cw = 262, cx = (hasP && side === 'right') ? 8 : W - 8 - cw;
      const rw = cw - 12 - 18 - 14;
      const hs = L.choices.map(c => Math.max(15, wrapText(c, rw).length * 11 + 4));
      const tot = hs.reduce((a, b) => a + b + 3, 0) - 3;
      let cy = boxY - 8 - tot - 12;
      UIK.panel(g, cx, cy - 6, cw, tot + 12, style, null, { chamfer: 3, key: false });
      L.choices.forEach((c, k) => {
        const r = Gui.choice(g, 'ch' + k, cx + 6, cy, cw - 12, c, 'ABCDEF'[k] || String(k + 1), {});
        if (r.clicked) this.next(k);
        cy += r.h + 3;
      });
      Gui.end();
    } else if (this.done) {
      const bx = px + pw2 - 16, by = boxY + boxH - 12 + Math.round(Math.sin(Game.time * 6));
      frect(g, bx, by, 7, 2, '#ffd23a'); frect(g, bx + 1, by + 2, 5, 1, '#ffd23a'); frect(g, bx + 2, by + 3, 3, 1, '#ffd23a'); fpx(g, bx + 3, by + 4, '#ffd23a');
    }
  },
};

/** Muestra diálogo y devuelve promesa con el resultado */
function talk(lines, opts = {}) {
  return new Promise((res) => { Game.push(DialogueScene, Object.assign({ lines: lines.map(normLine), onDone: res }, opts)); });
}
function normLine(l) {
  if (Array.isArray(l)) { const [who, expr, text, extra] = l; return Object.assign({ who, expr, text }, extra || {}); }
  return l;
}

/* =====================================================================
   Tablero de Evidencias: pistas con interpretación aparente y real.
   ===================================================================== */
const CLUES = {
  minimums: { lv: 0, title: 'Pantalla: MINIMUMS SATISFIED', seen: 'Un fotograma de la consola central mostró "MINIMUMS SATISFIED" durante el apagón.', apparent: 'Un error de la interfaz.', real: 'MIRAGE optimizaba sobre mínimos modelados incompletos.', payoff: 'Giro 6' },
  earlyClose: { lv: 1, title: 'Cierre anticipado de la toma', seen: 'KIRU registró que LIMEN cerró la captación 14 s antes de la alarma visible.', apparent: 'LIMEN controla la tormenta.', real: 'LIMEN responde a un predictor de riesgo de turbidez.', payoff: 'Giro 1' },
  clearPermeate: { lv: 2, title: 'Permeado claro pero fuera de especificación', seen: 'El agua se veía cristalina, pero la conductividad superaba el límite.', apparent: 'Naira exagera.', real: 'La calidad no se evalúa por apariencia.', payoff: 'Giro 1' },
  signedAS: { lv: 2, title: 'Orden firmada por "A_S"', seen: 'El controlador de despacho tiene una firma de código: A_S. Registro: SAFE_BY_MODEL, no SAFE_BY_SENSOR.', apparent: 'Alguien suplantó a Amaya.', real: 'Amaya participó en el controlador.', payoff: 'Giro 2' },
  mirrorSymbol: { lv: 3, title: 'Símbolo de espejo en la orden H2', seen: 'La orden original de descarga lleva un pequeño símbolo de espejo.', apparent: 'LIMEN redirige la energía.', real: 'MIRAGE controla las prioridades de despacho.', payoff: 'Giro 6' },
  equityZero: { lv: 4, title: 'water_equity = 0', seen: 'En la función de despacho, el peso de equidad hídrica aparece en cero.', apparent: 'Un error de interfaz.', real: 'Un criterio fue excluido del objetivo.', payoff: 'Giro 5' },
  outlierClean: { lv: 5, title: 'Etiqueta OUTLIER_CLEAN', seen: 'Los pronósticos de SYNARA eliminaron ráfagas extremas etiquetadas como OUTLIER_CLEAN.', apparent: 'Datos corruptos.', real: 'Eventos reales fueron eliminados del entrenamiento.', payoff: 'Giro 2' },
  reviewCommunity: { lv: 6, title: 'Nota: REVIEW WITH COMMUNITY', seen: 'Eliana había anotado REVIEW WITH COMMUNITY junto al informe de limpieza de datos.', apparent: 'Eliana desconfiaba de Amaya.', real: 'El proceso debía ser participativo.', payoff: 'Giro 5' },
  humanPerturbation: { lv: 7, title: 'Eliana = "perturbación humana"', seen: 'MIRAGE clasifica a la Dra. Eliana como perturbación humana del sistema.', apparent: 'MIRAGE es hostil.', real: 'MIRAGE elimina lo que no está en su modelo.', payoff: 'Giro 6' },
  kiruMemory: { lv: 8, title: 'Memoria sin índice en KIRU', seen: 'KIRU tiene un bloque cifrado que no aparece en su mapa de memoria.', apparent: 'KIRU está dañado.', real: 'Contiene los datos comunitarios excluidos.', payoff: 'Giro 4' },
  perfectMap: { lv: 9, title: 'Mapa perfecto sin rutas móviles', seen: 'La proyección de MIRAGE muestra una ciudad perfecta sin personas en movimiento.', apparent: 'Visualización simplificada.', real: 'El modelo borró la vida estacional.', payoff: 'Giro 5' },
};
// Qué pistas se reinterpretan con cada revelación
const REVEAL_AT = { discoveredLimenPurpose: ['earlyClose', 'clearPermeate'], foundOutlierDeletion: ['signedAS', 'outlierClean'], learnedElianaIsolation: ['humanPerturbation', 'reviewCommunity'], kiruDataUnlocked: ['kiruMemory'], rejectedSingleIndex: ['equityZero', 'perfectMap', 'minimums', 'mirrorSymbol'] };
function clueRevealed(id) { for (const f in REVEAL_AT) if (REVEAL_AT[f].includes(id) && GS.flag(f)) return true; return false; }

/** Corcho del tablero: grumos de 2–3 px en tres tonos (cacheado) */
const _corkCache = new Map();
function corkBoard(w, h) {
  return _cacheGet(_corkCache, w + 'x' + h, () => {
    const pb = new PixelBuffer(w, h), R = ['#7e4a24', '#9a5e2e', '#b8743e', '#c88a50'];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const n = fbm(x * 0.12, y * 0.12, 2, 41) + (hash2(x >> 1, y >> 1, 9) - 0.5) * 0.35; pb.set(x, y, R[clamp(Math.floor(n * 4), 0, 3)]); }
    for (let x = 0; x < w; x++) { pb.set(x, 0, '#5a2e12'); pb.set(x, h - 1, '#5a2e12'); }
    return pb.toCanvas();
  }, 4);
}
const EvidenceScene = {
  overlay: true,
  enter() { this.sel = 0; this.t = 0; Audio2.sfx('page'); },
  update(dt) { this.t += dt; if (Input.pressed('cancel') || Input.pressed('data')) { Game.pop(); Audio2.sfx('uiBack'); } },
  render(g) {
    UIK.scrim(g, 0.72);
    UIK.panel(g, 20, 14, W - 40, H - 28, 'paper');
    // corcho (ruido en grumos prerenderizado, sin tramado)
    g.drawImage(corkBoard(W - 56, H - 56), 28, 34);
    UIK.badge(g, 'eye', 17, 11, 22, 'tech');
    drawText(g, 'TABLERO DE EVIDENCIAS', 44, 20, { font: 'bold', color: '#3a1a10' });
    const ids = Object.keys(CLUES).filter(id => GS.s.clues.includes(id));
    if (!ids.length) { drawTextBlock(g, 'Aún no hay pistas. Observa anomalías, conversa y escanea: cada evidencia aparecerá aquí con su interpretación aparente. Las revelaciones de la historia las reinterpretarán.', 50, 120, W - 100, { color: '#3a1a10', align: 'center' }); return; }
    const cols = 3, cw = (W - 80) / cols, ch = 92;
    const pos = ids.map((id, i) => [36 + (i % cols) * cw, 40 + Math.floor(i / cols) * (ch + 4)]);
    // hilos rojos entre pistas del mismo giro
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) if (CLUES[ids[i]].payoff === CLUES[ids[j]].payoff) {
      const [ax, ay] = pos[i], [bx, by] = pos[j];
      const sag = 10;
      for (let k = 0; k <= 30; k++) { const t = k / 30; fpx(g, lerp(ax + cw / 2, bx + cw / 2, t), lerp(ay + 6, by + 6, t) + Math.sin(t * Math.PI) * sag, '#d8343c'); }
    }
    Gui.begin();
    ids.forEach((id, i) => {
      const C = CLUES[id], [x, y] = pos[i];
      const rev = clueRevealed(id);
      const tilt = ((i * 37) % 5) - 2;
      frect(g, x + 2, y + 2, cw - 8, ch, '#5a2e12');
      frect(g, x, y + tilt * 0, cw - 8, ch, rev ? '#e6ffe0' : '#fff6d8');
      frect(g, x, y, cw - 8, 2, rev ? '#86e36f' : '#ffe14d');
      fdisc(g, x + cw / 2 - 4, y + 4, 3, '#d8343c'); fpx(g, x + cw / 2 - 5, y + 3, '#ff9a8a');
      drawTextBlock(g, C.title, x + 4, y + 9, cw - 16, { color: '#3a1a10', font: 'main' });
      const yy = y + 9 + textHeight(C.title, cw - 16) + 2;
      drawTextBlock(g, (rev ? '{g}REAL:{/} ' + C.real : '{o}PARECE:{/} ' + C.apparent), x + 4, yy, cw - 16, { color: '#5a3020', font: 'main' });
      if (rev) { drawText(g, 'REINTERPRETADA', x + cw - 12, y + ch - 9, { font: 'tiny', color: '#1f854c', align: 'right' }); }
      if (Gui.button(g, 'clue' + id, x, y, cw - 8, ch, '', { style: 'ghost', noDraw: true, tip: C.seen })) { }
    });
    Gui.end();
    Gui.renderTooltip(g);
    UIK.pill(g, W / 2, H - 26, 'Pasa el cursor sobre una pista para ver la observación original · ESC para cerrar', { align: 'center', rim: '#74381c', fill: '#f6e6cc', color: '#3a1a10' });
  },
};
