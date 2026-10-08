/* =====================================================================
   32_gameplay.js — Escena de juego: carga de nivel, bucle de mundo,
   interacción, herramientas, Lente Nexo, HUD, guiones asíncronos.
   ===================================================================== */

const LEVELS = {};

const GameplayScene = {
  touchControls: true,
  enter(p) {
    this.levelId = p.level;
    const def = LEVELS[p.level];
    this.def = def;
    this.cam = new Camera(); Game.cam = this.cam;
    this.world = new World(def, this);
    this.terrainC = renderTerrain(this.world);
    this.backdrop = (BIOMES[def.biome] || BIOMES.coast)(def);
    this.propsC = null;
    if (def.props) { const pb = new PixelBuffer(this.world.w, this.world.h); def.props(pb, this.world); this.propsC = pb.toCanvas(); }
    if (def.propsFront) { const pb = new PixelBuffer(this.world.w, this.world.h); def.propsFront(pb, this.world); this.propsFrontC = pb.toCanvas(); } else this.propsFrontC = null;
    const sp = (p.checkpoint && def.checkpoints && def.checkpoints[p.checkpoint]) || def.spawn;
    this.player = this.world.add(new Player({ x: sp.x, y: sp.y, facing: sp.facing || 1 }));
    this.kiru = def.noKiru ? null : this.world.add(new Kiru({ x: sp.x - 30, y: sp.y }));
    this.cam.bounds = { x: 0, y: 0, w: this.world.w, h: this.world.h };
    this.cam.snap(this.player);
    this.lens = false; this.lensT = 0;
    this.cutscene = 0; this.waiters = []; this.timers = new Timers();
    this.objective = null; this.hintLevel = 0;
    this.chapterCard = { t: 0, title: def.title, sub: def.chapter };
    this.state = {}; // estado de guion del nivel
    this.time = 0;
    this.grade = def.grade || null;
    GS.s.level = p.level; GS.s.scene = 'level';
    if (!GS.s.unlocked.includes(p.level)) GS.s.unlocked.push(p.level);
    LearningModel.startLevel(p.level);
    if (def.portraits) Portraits.warm(def.portraits);
    Audio2.playMusic(def.music || 'coast');
    Audio2.setAmbience(def.ambience || { sea: 0.5, wind: 0.3, birds: 0.5 });
    if (def.setup) def.setup(this, p);
    this.cam.snap(this.player);
  },
  resume() { Audio2.playMusic(this.musicOverride || this.def.music || 'coast'); },
  exit() { },
  inputEnabled() { return this.cutscene === 0 && Game.top() === this && !Game.fade.busy; },
  /* ---------- API de guion ---------- */
  run(fn) {
    this.cutscene++;
    const done = () => { this.cutscene = Math.max(0, this.cutscene - 1); };
    return Promise.resolve().then(() => fn(this)).then((r) => { done(); return r; }, (e) => { done(); console.error(e); });
  },
  until(pred) { return new Promise(res => this.waiters.push({ pred, res })); },
  wait(t) { const end = this.time + t; return this.until(() => this.time >= end); },
  say(lines, opts) { return talk(Array.isArray(lines[0]) || typeof lines[0] === 'object' ? lines : [lines], opts); },
  walk(actor, x, speed = 70) { const tg = { x, speed, done: false }; actor.target = tg; return this.until(() => tg.done); },
  camTo(x, y, t = 1) {
    const sx = this.cam.x, sy = this.cam.y, start = this.time;
    this.camLock = true;
    return this.until(() => { const k = smooth(clamp((this.time - start) / t, 0, 1)); this.cam.x = lerp(sx, x - W / 2, k); this.cam.y = lerp(sy, (y ?? sy + H * 0.62) - H * 0.62, k); this.cam.clamp(); return k >= 1; });
  },
  camRelease() { this.camLock = false; },
  open(scene, params = {}) { return new Promise(res => Game.push(scene, Object.assign({}, params, { onDone: res, gameplay: this }))); },
  setObjective(text, hints = [], opts = {}) {
    this.objective = { text, hints, t: 0, icon: opts.icon || 'target' };
    this.hintLevel = 0;
    announce('Objetivo: ' + stripMarkup(text));
  },
  actor(id, charId, x, opts = {}) { return this.world.add(new Actor(Object.assign({ id, charId, x, y: this.world.groundAt(x) }, opts))); },
  station(o) { return this.world.add(new Station(Object.assign({ y: o.y ?? this.world.groundAt(o.x) }, o))); },
  /* ---------- bucle ---------- */
  update(dt) {
    this.time += dt;
    this.chapterCard.t += dt;
    // esperas de guion
    if (this.waiters.length) { const ws = this.waiters; this.waiters = []; for (const w of ws) { if (w.pred()) w.res(); else this.waiters.push(w); } }
    this.timers.update(dt);
    const W_ = this.world;
    W_.time += dt;
    // entrada
    if (this.inputEnabled()) this.handleInput();
    for (const e of W_.entities) if (!e.dead) e.update(dt);
    W_.entities = W_.entities.filter(e => !e.dead);
    W_.ps.wind = (this.backdrop.weather.wind || 0) * 60;
    W_.ps.update(dt);
    if (!this.camLock) this.cam.follow(this.player, dt, this.def.cam || {});
    this.cam.update(dt);
    if (this.def.update) this.def.update(this, dt);
    // disparadores por posición
    if (this.def.triggers) for (const tr of this.def.triggers) {
      if (tr.done || (tr.flag && !GS.flag(tr.flag)) || (tr.notFlag && GS.flag(tr.notFlag))) continue;
      if (this.player.x >= tr.x && this.player.x <= tr.x + (tr.w || 20) && this.cutscene === 0) { tr.done = !tr.repeat; tr.run(this); }
    }
    if (this.lens) this.lensT = Math.min(1, this.lensT + dt * 4); else this.lensT = Math.max(0, this.lensT - dt * 4);
    if (this.objective) this.objective.t += dt;
    GS.s.stats.playTime += dt;
  },
  nearestInteract() {
    const P = this.player;
    let best = null, bd = 1e9;
    for (const e of this.world.entities) {
      if (e instanceof Station && e.near(P)) { const d = Math.abs(e.x - P.x); if (d < bd) { bd = d; best = e; } }
      if (e instanceof Actor && !e.hidden && e.talkable && e.onTalk && Math.abs(e.x - P.x) < 30 && Math.abs(e.y - P.y) < 40) { const d = Math.abs(e.x - P.x) + 4; if (d < bd) { bd = d; best = e; } }
    }
    return best;
  },
  handleInput() {
    const P = this.player;
    if (Input.pressed('pause')) { Game.push(PauseScene, { gameplay: this }); Audio2.sfx('uiBack'); return; }
    if (Input.pressed('interact')) {
      const it = this.nearestInteract();
      if (it) {
        Audio2.sfx('confirm');
        if (it instanceof Station) { it.onUse && this.run(async () => { P.vx = 0; P.facing = sign(it.x - P.x) || P.facing; await it.onUse(this, it); }); }
        else if (it instanceof Actor) { this.run(async () => { P.vx = 0; P.facing = sign(it.x - P.x) || P.facing; it.facing = -P.facing; await it.onTalk(this, it); }); }
        return;
      }
    }
    if (Input.pressed('lens')) {
      if (GS.hasTool('lente')) { this.lens = !this.lens; Audio2.sfx(this.lens ? 'scan' : 'uiBack', { vol: 0.6 }); if (this.lens) LearningModel.note('lensUse'); }
      else Game.toast('La {c}Lente Nexo{/} aún no está calibrada', 'lock', '#8a8fb8', 2);
    }
    if (Input.pressed('tool')) this.useTool();
    if (Input.pressed('codex')) { Game.push(CodexScene, {}); return; }
    if (Input.pressed('data')) { Game.push(EvidenceScene, {}); return; }
    if (Input.pressed('map')) { Game.push(PauseScene, { gameplay: this, tab: 'map' }); return; }
    if (Input.pressed('hint')) this.showHint();
  },
  showHint() {
    const o = this.objective;
    if (!o || !o.hints || !o.hints.length) { this.kiru && this.kiru.say('Mi radar de pistas no detecta nada aquí. Explora y conversa.', 'confundido'); return; }
    const h = o.hints[Math.min(this.hintLevel, o.hints.length - 1)];
    const lbl = ['Pregunta', 'Evidencia', 'Demostración parcial'][Math.min(this.hintLevel, 2)];
    this.kiru && this.kiru.say(lbl + ': ' + h, 'curioso', 6);
    this.hintLevel = Math.min(this.hintLevel + 1, o.hints.length - 1);
    GS.s.stats.hints++; GS.lp(this.levelId).hints++;
    LearningModel.note('hint');
  },
  useTool() {
    const P = this.player;
    if (this.def.onTool && this.def.onTool(this) === true) return;
    // corrige adversarios conceptuales cercanos
    const adv = this.world.entities.find(e => e instanceof Adversary && !e.calm && Math.abs(e.x - P.x) < 90 && Math.abs(e.y - (P.y - 28)) < 60);
    if (adv && GS.s.tools.length) {
      this.run(async () => {
        P.forcedAnim = 'tool'; Audio2.sfx('scan');
        await this.wait(0.4); P.forcedAnim = null;
        const ok = await this.open(MicroCheckScene, { advType: adv.type, quiz: adv.quiz });
        if (ok) { adv.calm = true; Audio2.sfx('success'); this.world.ps.emit('crystal', adv.x, adv.y, 0, 0, 30, 12); Codex.unlock('adv_' + adv.type); if (adv.onCalm) adv.onCalm(this); }
        else { P.hurt(sign(P.x - adv.x) || 1, 120); }
      });
      return;
    }
    if (GS.hasTool('barrido')) {
      P.forcedAnim = 'scan'; Audio2.sfx('scan');
      this.kiru && (this.kiru.scanT = 1.2);
      this.timers.after(0.9, () => { P.forcedAnim = null; });
      const st = this.world.entities.find(e => e instanceof Station && e.scan && Math.abs(e.x - P.x) < 120);
      if (st) this.timers.after(0.5, () => st.scan(this, st));
      else if (this.def.onScan) this.timers.after(0.5, () => this.def.onScan(this));
      return;
    }
    if (GS.s.tools.length === 0) Game.toast('Aún no tienes herramientas activas', 'lock', '#8a8fb8', 2);
  },
  /* ---------- render ---------- */
  render(g) {
    const cam = this.cam, B = this.backdrop, def = this.def;
    const ox = cam.ox, oy = cam.oy;
    const camI = { x: ox, y: oy };
    // cielo
    if (def.renderSky) def.renderSky(g, this, camI); else if (B.sky) g.drawImage(B.sky, 0, Math.round(-oy * 0.05));
    if (def.skyFx) def.skyFx(g, this, camI);
    B.drawClouds(g, camI, 1 + (B.weather.wind || 0));
    B.render(g, camI, 'back');
    if (def.renderBack) def.renderBack(g, this, camI);
    // accesorios estáticos de fondo (mundo)
    if (this.propsC) g.drawImage(this.propsC, ox, oy, W, H, 0, 0, W, H);
    if (def.renderMid) def.renderMid(g, this, camI);
    // terreno
    g.drawImage(this.terrainC, ox, oy, W, H, 0, 0, W, H);
    for (const p of this.world.platforms) drawPlatform(g, p, ox, oy);
    for (const l of this.world.ladders) drawLadder(g, l, ox, oy);
    // entidades: estaciones, actores, kiru, jugadora
    const ents = this.world.entities.slice().sort((a, b) => (a.z || 0) - (b.z || 0) || ((a instanceof Station) ? -1 : 0) - ((b instanceof Station) ? -1 : 0));
    for (const e of ents) if (!(e instanceof Player) && !(e instanceof Kiru)) e.render(g, cam);
    if (this.kiru) this.kiru.render(g, cam);
    this.player.render(g, cam);
    // agua delante (superficie translúcida tramada)
    for (const w of this.world.water) drawWaterFront(g, w, ox, oy, this);
    if (def.renderFront) def.renderFront(g, this, camI);
    if (this.propsFrontC) g.drawImage(this.propsFrontC, ox, oy, W, H, 0, 0, W, H);
    this.world.ps.render(g, ox, oy);
    B.render(g, camI, 'front');
    // gradación de luz / clima
    if (def.renderGrade) def.renderGrade(g, this);
    else if (this.grade) { g.globalCompositeOperation = this.grade.op || 'multiply'; g.globalAlpha = this.grade.a ?? 1; frect(g, 0, 0, W, H, this.grade.col); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    // Lente Nexo
    if (this.lensT > 0) this.renderLens(g, camI);
    // globos
    for (const e of this.world.entities) if (e.renderBubble) e.renderBubble(g, cam);
    // indicador de interacción
    if (this.inputEnabled()) { const it = this.nearestInteract(); if (it && it.renderPrompt) it.renderPrompt(g, cam, this.player); else if (it instanceof Actor) drawTalkPrompt(g, it, cam); }
    this.renderHUD(g);
  },
  renderLens(g, cam) {
    const k = this.lensT;
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.55 * k; frect(g, 0, 0, W, H, '#3a4a8a'); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    // rejilla técnica
    if (k > 0.5) { g.fillStyle = 'rgba(86,229,255,0.10)'; for (let x = -(cam.x % 32); x < W; x += 32) g.fillRect(Math.round(x), 0, 1, H); for (let y = -(cam.y % 32); y < H; y += 32) g.fillRect(0, Math.round(y), W, 1); }
    if (this.def.lens) this.def.lens(g, this, cam, k);
    UIK.panel(g, W - 192, H - 26, 184, 18, 'glass');
    Icons.draw(g, 'lens', W - 186, H - 24);
    drawText(g, 'LENTE NEXO · flujos y unidades', W - 92, H - 21, { align: 'center', color: '#a6f4ff', shadow: '#070a1c' });
  },
  renderHUD(g) {
    if (this.hideHUD) return;
    const def = this.def;
    // tarjeta de capítulo (cinta con borde, sin oscurecer el cielo)
    const ct = this.chapterCard.t;
    if (ct < 4.2) {
      const a = ct < 0.5 ? ct / 0.5 : ct > 3.4 ? (4.2 - ct) / 0.8 : 1;
      const tw = Math.max(220, FONTS.main.measure(this.chapterCard.title || '') * 2 + 60);
      const bx = Math.round(W / 2 - tw / 2), by = Math.round(30 - (1 - a) * 46);
      UIK.panel(g, bx, by, tw, 44, 'dialog');
      drawText(g, this.chapterCard.sub || '', W / 2, by + 6, { align: 'center', font: 'tiny', color: '#ffe14d' });
      drawTitleText(g, this.chapterCard.title || '', W / 2, by + 13, 2, ['#fffaf0', '#ffe14d', '#ff9f43'], { align: 'center', shadow: '#140d26', depth: 1 });
      frect(g, bx + 10, by + 40, tw - 20, 1, '#8a5e14');
    }
    // objetivo
    if (this.objective && ct > 3.5) {
      const o = this.objective;
      const lines = wrapText(o.text, 200);
      const h = 18 + lines.length * 11;
      const slide = Math.min(1, o.t * 3);
      const x = Math.round(6 - (1 - slide) * 240);
      UIK.panel(g, x, 6, 236, h, 'glass');
      Icons.draw(g, o.icon, x + 6, 9);
      drawText(g, 'OBJETIVO', x + 22, 10, { font: 'tiny', color: '#ffe14d' });
      lines.forEach((l, i) => drawText(g, l, x + 22, 18 + i * 11, { color: '#fffaf0', shadow: '#070a1c' }));
    }
    // herramienta activa y teclas
    const tools = GS.s.tools;
    let tx = W - 8;
    const slot = (icon, key, on) => { tx -= 26; UIK.panel(g, tx, 6, 24, 24, on ? 'glass' : 'tech', on ? '#ffe14d' : null); Icons.draw(g, icon, tx + 5, 9); drawText(g, key, tx + 20, 22, { font: 'tiny', color: '#ffe14d', align: 'right', shadow: '#070a1c' }); };
    if (!Input.touchMode) {
      slot('book', keyName(Input.codesFor('codex')[0]), false);
      slot('eye', 'TAB', false);
      if (GS.hasTool('lente')) slot('lens', keyName(Input.codesFor('lens')[0]), this.lens);
      const tl = tools.filter(t => t !== 'lente'); if (tl.length) { const t = TOOLS[GS.s.activeTool || tl[tl.length - 1]]; if (t) slot(t.icon, keyName(Input.codesFor('tool')[0]), false); }
      slot('hint', keyName(Input.codesFor('hint')[0]), false);
    }
    if (def.hud) def.hud(g, this);
  },
};

function drawTalkPrompt(g, a, cam) {
  const x = Math.round(a.x - cam.ox), y = Math.round(a.y - cam.oy - (a.bubbleH || 74) - 6 + Math.sin(Game.time * 5) * 1.5);
  UIK.panel(g, x - 18, y, 36, 15, 'glass');
  const key = keyName(Input.codesFor('interact')[0]);
  frect(g, x - 14, y + 2, 11, 11, '#fffaf0'); drawText(g, key, x - 8, y + 4, { color: '#140d26', align: 'center' });
  for (let i = 0; i < 3; i++) frect(g, x + 1 + i * 4, y + 7, 2, 2, (Math.floor(Game.time * 4) % 3) === i ? '#ffe14d' : '#fffaf0');
}
function drawLadder(g, l, ox, oy) {
  const x = Math.round(l.x - ox), y0 = Math.round(l.y0 - oy), y1 = Math.round(l.y1 - oy);
  if (x < -20 || x > W + 20) return;
  frect(g, x - 7, y0, 2, y1 - y0, '#6aa0b4'); frect(g, x + 5, y0, 2, y1 - y0, '#477a94');
  for (let y = y0 + 3; y < y1; y += 6) { frect(g, x - 6, y, 12, 2, '#98c6d2'); frect(g, x - 6, y + 2, 12, 1, '#1d2a48'); }
}
function drawWaterFront(g, w, ox, oy, sc) {
  const x0 = Math.round(w.x0 - ox), x1 = Math.round(w.x1 - ox), y = Math.round(w.y - oy);
  if (x1 < 0 || x0 > W) return;
  const xa = Math.max(0, x0), xb = Math.min(W, x1);
  const depthPx = Math.max(4, H - y);
  // cuerpo de agua translúcido en bandas (sin malla de tramado)
  g.globalAlpha = w.alpha ?? 0.55; frect(g, xa, y + 1, xb - xa, depthPx, w.tint || '#20d6c7');
  g.globalAlpha = 0.45; frect(g, xa, y + 9, xb - xa, depthPx, w.deep || '#1063a6');
  g.globalAlpha = 0.35; frect(g, xa, y + 22, xb - xa, depthPx, '#0d3168');
  if (w.turbid) { g.globalAlpha = clamp(w.turbid, 0, 0.75); frect(g, xa, y + 1, xb - xa, depthPx, '#a0783a'); }
  g.globalAlpha = 1;
  // cáusticas animadas
  const t = Game.time;
  for (let k = 0; k < (xb - xa) / 9; k++) {
    const xx = xa + ((k * 37 + Math.floor((t * 6 + k * 3) % 9)) % (xb - xa));
    const yy = y + 4 + ((k * 13) % Math.max(4, depthPx - 8));
    if (((k + Math.floor(t * 2)) % 3) === 0) frect(g, xx, yy, 3 + (k % 3), 1, w.caustic || '#6cf0db');
  }
  // superficie con oleaje y espuma
  for (let x = xa; x < xb; x++) {
    const wy = Math.round(Math.sin((x + ox) * 0.08 + t * 2.2) * 1.2);
    fpx(g, x, y + wy, w.foam || '#c6fff2');
    if (((x + ox + Math.floor(t * 12)) % 17) < 3) fpx(g, x, y + wy - 1, '#ffffff');
    if (((x + ox) % 5) === 0) fpx(g, x, y + wy + 1, w.caustic || '#6cf0db');
  }
}

/* =====================================================================
   Pausa / menú en juego
   ===================================================================== */
const PauseScene = {
  overlay: true,
  enter(p) { this.gp = p.gameplay; this.tab = p.tab || 'main'; Audio2.sfx('uiBack'); },
  update() { if (Input.pressed('cancel') || Input.pressed('pause')) { if (this.tab !== 'main') this.tab = 'main'; else Game.pop(); } },
  render(g) {
    fdither(g, 0, 0, W, H, '#05030f', 0.7);
    const x = W / 2 - 120, y = 40, w = 240;
    UIK.panel(g, x, y, w, 270, 'dialog');
    UIK.header(g, x, y, w, 'PAUSA · ' + (LEVELS[this.gp.levelId].title || ''), 'dialog', 'pause');
    Gui.begin();
    const B = (id, label, icon, fn, st) => { if (Gui.button(g, id, x + 20, this._y, w - 40, 22, label, { icon, align: 'left', style: st })) fn(); this._y += 26; };
    this._y = y + 26;
    if (this.tab === 'map') {
      drawTextBlock(g, '¿Volver al mapa del Nexo? El progreso del nivel se conserva en el último punto de control.', x + 16, this._y, w - 32, { color: '#fffaf0' });
      this._y += 50;
      B('ymap', 'Sí, ir al mapa', 'map', () => { Game.pop(); GS.save(); Game.transition(() => Game.setScene(WorldMapScene)); });
      B('nmap', 'Seguir aquí', 'play', () => { this.tab = 'main'; });
    } else {
      B('cont', 'Continuar', 'play', () => Game.pop(), 'good');
      B('codex', 'Atlas del Nexo', 'book', () => Game.push(CodexScene, {}));
      B('evid', 'Tablero de Evidencias', 'eye', () => Game.push(EvidenceScene, {}));
      B('mast', 'Mi aprendizaje', 'chart', () => Game.push(AnalyticsScene, {}));
      B('sett', 'Ajustes y accesibilidad', 'gear', () => Game.push(SettingsScene, {}));
      B('ckpt', 'Reiniciar desde punto de control', 'reset', () => { Game.pop(); const lv = this.gp.levelId; Game.transition(() => Game.setScene(GameplayScene, { level: lv, checkpoint: GS.s.checkpoint })); });
      B('map', 'Mapa del Nexo', 'map', () => { this.tab = 'map'; });
      B('menu', 'Guardar y salir al título', 'save', () => { Game.pop(); GS.save(); Game.transition(() => Game.setScene(TitleScene)); }, 'ghost');
    }
    Gui.end();
  },
};
