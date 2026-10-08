/* =====================================================================
   99_main.js — Arranque. Modos de prueba vía ?test=nombre
   ===================================================================== */
const TESTS = {};
function boot() {
  Game.init();
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
      const x = 40 + (i % 8) * 76, y = 90 + Math.floor(i / 8) * 100;
      drawChar(g, ch, a, fr / (ANIMS[a].fps), x, y, 1);
      drawText(g, a, x, y + 4, { font: 'tiny', color: '#140d26', align: 'center' });
    });
    drawText(g, 'ÁÉÍÓÚ ñ ¿Qué es la salmuera? ¡Recuperación 42 %! m³/h · kWh → H₂', 8, 300, { color: '#fffaf0', shadow: '#140d26' });
    drawText(g, 'TINY 0123456789 KWH/M³ 35 G/L ÁREA Ñ', 8, 316, { font: 'tiny', color: '#140d26' });
    drawText(g, 'Agua · energía · hidrógeno · agroecología {y}amarillo{/} {c}cian{/} {p}rosa{/}', 8, 328, { color: '#140d26' });
    for (let i = 0; i < 12; i++) Icons.draw(g, Object.keys(Icons.defs)[i + (parseInt(q.get('ic') || '0'))], 8 + i * 18, 340);
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
