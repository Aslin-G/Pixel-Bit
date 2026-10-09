/* =====================================================================
   99_main.js — Arranque. Modos de prueba vía ?test=nombre
   ===================================================================== */
const TESTS = {};
function boot() {
  Game.init();
  GS.reset();
  const q = new URLSearchParams(location.search);
  const test = q.get('test');
  if (test && TESTS[test]) { Game.setScene(TESTS[test]); return; }
  if (typeof TitleScene !== 'undefined') Game.setScene(TitleScene);
}
TESTS.sprites = {
  enter() { this.t = 0; },
  update(dt) { this.t += dt; },
  render(g) {
    frect(g, 0, 0, W, H, '#7ccaf4');
    fdither(g, 0, 180, W, 180, '#f2c14e', 1);
    const anims = ['idle', 'walk', 'run', 'jump', 'fall', 'scan', 'talk', 'celebrate', 'frustrate', 'repair', 'program', 'sample', 'point', 'think', 'sad', 'help'];
    const q = new URLSearchParams(location.search);
    const ch = q.get('char') || 'amaya';
    const fr = parseInt(q.get('frame') || '0');
    anims.forEach((a, i) => {
      const x = 40 + (i % 8) * 76, y = 112 + Math.floor(i / 8) * 118;
      drawChar(g, ch, a, fr / (ANIMS[a].fps), x, y, 1);
      drawText(g, a, x, y + 4, { font: 'tiny', color: '#140d26', align: 'center' });
    });
    drawText(g, 'ÁÉÍÓÚ ñ ¿Qué es la salmuera? ¡Recuperación 42 %! m³/h · kWh → H₂', 8, 300, { color: '#fffaf0', shadow: '#140d26' });
    drawText(g, 'TINY 0123456789 KWH/M³ 35 G/L ÁREA Ñ', 8, 316, { font: 'tiny', color: '#140d26' });
    drawText(g, 'Agua · energía · hidrógeno · agroecología {y}amarillo{/} {c}cian{/} {p}rosa{/}', 8, 328, { color: '#140d26' });
    for (let i = 0; i < 12; i++) Icons.draw(g, Object.keys(Icons.defs)[i + (parseInt(q.get('ic') || '0'))], 8 + i * 18, 340);
  },
};
/* Hoja de personaje: ?test=charsheet&char=amaya&page=0&bg=grey|ref&z=1&anims=idle,run&expr=happy
   Cada fila = una animación con todos sus cuadros (capturar con escala 2 → 2×). */
const CHARSHEET_ANIMS = ['idle', 'walk', 'run', 'jump', 'fall', 'land', 'talk', 'scan', 'sample', 'repair', 'program', 'tool', 'help', 'point', 'think', 'sad', 'celebrate', 'frustrate', 'hit', 'climb', 'sit', 'wade', 'observe', 'surprise', 'worry', 'fear', 'determined', 'victory'];
function charsheetBg(g, kind, y0 = 0, h = H) {
  if (kind !== 'ref') { frect(g, 0, y0, W, h, '#7a7a86'); return; }
  // fondo tipo referencia en bandas sólidas (cielo → bruma → mar → arena), sin tramado
  const sky = RAMP.skyR || ['#2186eb'], bands = [[0, sky[2]], [0.18, sky[3]], [0.34, sky[4]], [0.48, sky[5]], [0.58, '#c5a9b9'], [0.64, '#9884ab'], [0.70, '#0189d4'], [0.78, '#0692d5'], [0.86, '#edaf5f'], [0.93, '#c58440']];
  bands.forEach(([t, c], i) => { const ya = y0 + Math.round(t * h), yb = y0 + Math.round((bands[i + 1] ? bands[i + 1][0] : 1) * h); frect(g, 0, ya, W, yb - ya, c); });
}
TESTS.charsheet = {
  enter() { this.t = 0; },
  update(dt) { this.t += dt; },
  render(g) {
    const q = new URLSearchParams(location.search);
    const ch = q.get('char') || 'amaya', def = CHARS[ch];
    const bg = q.get('bg') || 'grey', z = parseInt(q.get('z') || '1'), page = parseInt(q.get('page') || '0');
    const list = (q.get('anims') || CHARSHEET_ANIMS.join(',')).split(',').filter(a => ANIMS[a]);
    const c0 = SpriteCache.get(ch, 'idle', 0, {});
    const cw = Math.round((q.get('cw') ? parseInt(q.get('cw')) : Math.min(c0.width, ch === 'kiru' ? 56 : c0.width > 100 ? 100 : 72)) * z);
    const top = parseInt(q.get('crop') || (c0.height === 104 ? '18' : '0'));
    const rh = (c0.height - top) * z + 4;
    const rows = Math.max(1, Math.floor((H - 8) / rh));
    const sel = list.slice(page * rows, page * rows + rows);
    charsheetBg(g, bg);
    sel.forEach((a, r) => {
      const A = ANIMS[a], y = 4 + r * rh;
      drawText(g, a + ' ' + A.frames + '@' + A.fps, 2, y + 1, { font: 'tiny', color: bg === 'ref' ? '#fffaf0' : '#140d26', shadow: bg === 'ref' ? '#140d26' : null });
      for (let f = 0; f < A.frames; f++) {
        const c = SpriteCache.get(ch, a, f, { expr: q.get('expr') || undefined });
        const x = 44 + f * (cw + 2);
        if (x + cw > W) break;
        const sx = Math.max(0, Math.round((def.ox ?? 30) - cw / z / 2));
        g.drawImage(c, sx, top, cw / z, c.height - top, x, y, cw, (c.height - top) * z);
      }
    });
    drawText(g, ch + ' p' + page + '/' + Math.ceil(list.length / rows - 1), W - 4, H - 10, { font: 'tiny', color: '#fffaf0', shadow: '#140d26', align: 'right' });
  },
};
window.addEventListener('load', boot);
TESTS.zoom = {
  enter() { this.t = 0; },
  update(dt) { this.t += dt; },
  render(g) {
    frect(g, 0, 0, W, H, '#5aaee8');
    const q = new URLSearchParams(location.search);
    const ch = q.get('char') || 'amaya';
    const list = (q.get('list') || 'idle:0,walk:2,scan:1,talk:1,celebrate:2').split(',');
    const z = parseInt(q.get('z') || '3');
    list.forEach((it, i) => {
      const [chn, a, f, e] = it.includes('@') ? it.split(/[@:]/) : [ch].concat(it.split(':'));
      const c = SpriteCache.get(chn, a, parseInt(f), { expr: e });
      this.x = (i === 0 ? 4 : this.x);
      g.drawImage(c, this.x, H - 8 - c.height * z, c.width * z, c.height * z);
      this.x += c.width * z + 2;
    });
  },
};
TESTS.portraits = {
  enter() {},
  update() {},
  render(g) {
    frect(g, 0, 0, W, H, '#2a2a5a');
    const q = new URLSearchParams(location.search);
    const ids = (q.get('ids') || 'amaya,naira,dante,eliana,kiru').split(',');
    const ex = (q.get('ex') || 'neutral').split(',');
    let i = 0;
    for (const id of ids) for (const e of ex) {
      const c = Portraits.get(id, e, q.get('talk') ? 1 : 0);
      const x = (i % 5) * 128, y = Math.floor(i / 5) * 128;
      g.drawImage(c, x, y); drawText(g, id + ' ' + e, x + 4, y + 118, { font: 'tiny', color: '#fff', shadow: '#000' });
      i++;
    }
  },
};

TESTS.level = { enter() { const q = new URLSearchParams(location.search); const lv = parseInt(q.get('lv') || '1'); if (q.get('tools')) for (const t of q.get('tools').split(',')) GS.giveTool(t, true); Game.setScene(GameplayScene, { level: lv, checkpoint: q.get('cp') || null }); if (q.get('px')) { const P = GameplayScene.player; P.x = parseFloat(q.get('px')); P.y = GameplayScene.world.groundAt(P.x); GameplayScene.kiru && (GameplayScene.kiru.x = P.x - (P.facing || 1) * KIRU_FOLLOW); GameplayScene.cam.snap(P); } if (q.get('lens')) { GameplayScene.lens = true; GameplayScene.lensT = 1; } if (q.get('nocard')) GameplayScene.chapterCard.t = 9; }, update() { }, render() { } };
TESTS.title = { enter() { Game.setScene(TitleScene); }, update() { }, render() { } };
TESTS.map = { enter() { for (let i = 0; i <= 10; i++) GS.s.unlocked.push(i); GS.s.completed.push(0, 1); Game.setScene(WorldMapScene, { focus: 2 }); }, update() { }, render() { } };
TESTS.scene = { enter() { const q = new URLSearchParams(location.search); const sc = window[q.get('s')] || eval(q.get('s')); Game.setScene(sc, JSON.parse(q.get('p') || '{}')); }, update() { }, render() { } };
TESTS.sim = { enter() { const q = new URLSearchParams(location.search); const lv = q.get('lv'); if (lv) { Game.setScene(GameplayScene, { level: parseInt(lv) }); GameplayScene.chapterCard.t = 9; } const sc = eval(q.get('s')); Game.push(sc, { phase: q.get('phase') || undefined, stopAfter: 'free', onDone: () => { } }); }, update() { }, render() { } };
/* ---------- Piloto automático para pruebas de guion (solo ?test=) ---------- */
function AUTOPILOT_ON(choices = []) {
  if (window.__autopilot) return;
  window.__autopilot = { choices: choices.slice(), log: [] };
  const push = Game.push.bind(Game);
  Game.push = function (scene, params = {}) {
    const AP = window.__autopilot;
    const resolve = (v) => setTimeout(() => params.onDone && params.onDone(v), 30);
    if (scene === DialogueScene) {
      const lines = params.lines || [];
      const hasChoice = lines.some(l => l && (l.choices || (Array.isArray(l) && l[3] && l[3].choices)));
      AP.log.push('dlg:' + lines.length);
      return resolve(hasChoice ? (AP.choices.length ? AP.choices.shift() : 0) : null);
    }
    if (scene === SOLOScene) return resolve({ correct: 5, total: 5 });
    if (scene === ExplainScene || scene === MicroCheckScene) return resolve(true);
    if (typeof DroneScene !== 'undefined' && scene === DroneScene) return resolve({ choice: 'E', ok: true });
    if (scene === LevelCompleteScene) return resolve();
    if (scene.nextPhase) { AP.log.push('sim:' + (scene.title || '')); return resolve({ ok: true }); }
    if (scene === PauseScene || scene === CodexScene || scene === EvidenceScene) return push(scene, params);
    AP.log.push('scene?'); return resolve({ ok: true });
  };
}
