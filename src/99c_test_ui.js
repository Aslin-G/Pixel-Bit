/* =====================================================================
   99c_test_ui.js — Galería de widgets de interfaz: ?test=ui&page=0|1|2
   0: estilos de panel, cabeceras, botones, interruptores, deslizadores, barras
   1: composiciones de la referencia (HUD, MAPA, PREGUNTA, globos, tira de capítulos)
   2: iconos 12 px e iconos grandes 22 px con insignias
   ===================================================================== */
TESTS.ui = {
  enter() {
    this.t = 0; this.v = 0.62; this.on = true; this.sel = 2;
    GS.s.unlocked = [0, 1, 2, 3, 4, 5, 6, 7]; GS.s.completed = [0, 1];
    const q = new URLSearchParams(location.search);
    this.page = parseInt(q.get('page') || '0');
  },
  update(dt) { this.t += dt; if (Input.pressed('next')) this.page = (this.page + 1) % 3; },
  bg(g) {
    // fondo en bandas sólidas tipo referencia (cielo → bruma → mar), sin tramado
    const bands = [['#2186eb', 0], ['#3c9dfa', 0.16], ['#7fbcf2', 0.32], ['#c0d0ee', 0.44], ['#c5a9b9', 0.52], ['#0189d4', 0.6], ['#0692d5', 0.7], ['#11bedd', 0.82], ['#edaf5f', 0.92]];
    bands.forEach(([c, t], i) => { const ya = Math.round(t * H), yb = Math.round((bands[i + 1] ? bands[i + 1][1] : 1) * H); frect(g, 0, ya, W, yb - ya, c); });
  },
  render(g) {
    this.bg(g);
    Gui.begin();
    if (this.page === 0) this.page0(g); else if (this.page === 1) this.page1(g); else this.page2(g);
    Gui.end();
    Gui.renderTooltip(g);
    drawText(g, 'test=ui · página ' + this.page + ' (TAB cambia)', W - 6, H - 9, { font: 'tiny', color: '#e6f8fe', align: 'right' });
  },
  page0(g) {
    const styles = ['tech', 'hud', 'sheet', 'green', 'alert', 'mirage', 'limen', 'mosaic', 'violet', 'gold', 'paper'];
    styles.forEach((st, i) => {
      const x = 6 + (i % 6) * 105, y = 6 + Math.floor(i / 6) * 62;
      UIK.panel(g, x, y, 100, 56, st);
      UIK.header(g, x, y, 100, st.toUpperCase(), st, ['book', 'map', 'chart', 'check', 'warn', 'mirror', 'eye', 'mosaic', 'drop_brine', 'star', 'save'][i]);
      const s = PANEL_STYLES[st];
      drawText(g, 'Texto ñ ¿á?', x + 8, y + 26, { color: s.text });
      drawText(g, 'atenuado', x + 8, y + 38, { color: s.dim });
    });
    // botones
    const bs = ['primary', 'ghost', 'good', 'gold', 'danger', 'choice', 'tab', 'paper'];
    bs.forEach((st, i) => { Gui.button(g, 'b' + st, 6 + (i % 4) * 106, 134 + Math.floor(i / 4) * 24, 100, 20, st, { style: st, icon: i % 2 ? 'play' : null }); });
    Gui.drawButton(g, 6, 186, 100, 20, 'enfocado', { style: 'primary', focused: true });
    Gui.drawButton(g, 112, 186, 100, 20, 'elegido', { style: 'gold', selected: true });
    Gui.drawButton(g, 218, 186, 100, 20, 'pestaña', { style: 'tab', selected: true });
    Gui.drawButton(g, 324, 186, 100, 20, 'desactivado', { style: 'good', disabled: true });
    // interruptores y deslizadores
    this.on = Gui.toggle(g, 'tg1', 440, 136, 'Avance automático', this.on);
    Gui.toggle(g, 'tg2', 440, 154, 'Reducir destellos', false);
    this.v = Gui.slider(g, 'sl1', 440, 172, 190, this.v, 0, 1, 0.01, { label: 'Recuperación', fmt: v => fmt0(v * 100) + ' %', marks: [{ v: 0.75, col: '#ff6b6b', zone: 1 }] });
    Gui.slider(g, 'sl2', 440, 198, 190, 0.35, 0, 1, 0.05, { label: 'Presión', unit: 'bar', color: '#ffd23a' });
    // barras, corazones, energía, teclas, píldoras
    UIK.bar(g, 6, 216, 120, 6, 0.7, '#86e36f'); UIK.bar(g, 132, 216, 120, 6, 0.4, '#ffd23a', null, 10); UIK.bar(g, 258, 216, 120, 6, 0.9, '#56e5ff');
    for (let i = 0; i < 7; i++) UIK.heart(g, 6 + i * 11, 230, i < 5 ? 'full' : i === 5 ? 'flash' : 'empty');
    UIK.energyBar(g, 90, 231, 80, 0.8); UIK.energyBar(g, 176, 231, 80, 0.1, true);
    let kx = 266; for (const k of ['E', 'Q', 'N', 'TAB', 'ESC']) kx += UIK.keycap(g, kx, 228, k) + 4;
    UIK.pill(g, 6, 246, 'CAPTACIÓN', { rim: '#8fdfff' });
    UIK.pill(g, 70, 246, 'SALMUERA', { rim: '#a086d0', fill: '#0b0a2e' });
    UIK.pill(g, 130, 246, 'H₂ VERDE', { rim: '#78ce8d', fill: '#09513b' });
    UIK.pill(g, 190, 246, 'ALERTA', { rim: '#ff8a7a', fill: '#3a0c1c', icon: 'warn' });
    ['hint', 'sensor', 'lens', 'eye', 'book'].forEach((ic, i) => UIK.toolSlot(g, 290 + i * 21, 244, ic, ['H', 'Q', 'N', 'TAB', 'C'][i], i === 2));
    // gráficos en pozos hundidos
    Charts.line(g, 400, 228, 150, 60, [{ data: [3, 5, 4, 7, 8, 6, 9], color: '#56e5ff', area: true }, { data: [2, 2, 3, 3, 4, 4, 5], color: '#ffd23a', dashed: true }], { bands: [{ y0: 6, y1: 8, color: '#86e36f', level: 0.3 }] });
    Charts.bars(g, 556, 228, 78, 60, [{ v: 4, color: '#56e5ff', label: 'A' }, { v: 7, color: '#ffd23a', label: 'B' }, { v: 5, color: '#86e36f', label: 'C' }]);
    Charts.tank(g, 6, 266, 26, 60, 0.6, RAMP.sea, 'TANQUE'); Charts.battery(g, 40, 270, 22, 56, 0.55, 0.3, 'SOC');
    Charts.gauge(g, 100, 300, 22, 0.7, '#56e5ff', 'kW', '62');
    UIK.instrumentPlates(g, [{ icon: 'water', label: 'TURBIDEZ', value: '12 NTU', color: '#56e5ff', frac: 0.4 }, { icon: 'filter', label: 'ΔP FILTRO', value: '0,8 bar', color: '#ffd23a', frac: 0.7 }, { icon: 'bolt', label: 'ENERGÍA', value: '3,1 kWh/m³', color: '#86e36f', frac: 0.5 }], 140, 290);
  },
  page1(g) {
    UIK.hudPortraitBlock(g, 4, 4, { id: 'amaya', name: 'AMAYA', expr: 'smile', tint: '#ff7656', hp: 7, maxHp: 7, energy: 0.92, rank: 3, rankFrac: 0.6 });
    UIK.objectiveCard(g, 6, 64, 204, 'Sigue la costa hacia la {y}toma de SYNARA{/}', 'target');
    UIK.minimapPanel(g, W - 108, 4, 104, 70, { level: 1 });
    // globo de KIRU como en la referencia
    const kx = 120, ky = 150;
    drawChar(g, 'kiru', 'idle', this.t, kx, ky, 1, { shadow: false });
    UIK.speechBubble(g, kx + 14, ky - 46, { name: 'KIRU', nameCol: '#20d6c7', text: '¡Mira! Esa agua de mar se desaliniza usando {y}energía solar{/}. Luego se almacena para las comunidades y los cultivos.', w: 196, place: ['bl'] });
    UIK.speechBubble(g, 330, 170, { name: 'NAIRA', nameCol: '#86e36f', text: 'Cola a la derecha.', place: ['br'] });
    UIK.speechBubble(g, 260, 200, { text: 'Globo ambiental sin nombre, cola arriba.', place: ['tl'] });
    // panel PREGUNTA
    const qx = 410, qw = 222, stem = '¿Cuál es la función principal de las {o}membranas{/} en un sistema de ósmosis inversa?';
    const opts = ['Eliminar materia orgánica', 'Aumentar la temperatura del agua', 'Separar las sales del agua de mar', 'Generar energía eléctrica'];
    const M = UIK.measureQuestion(qw, stem, opts);
    const qy = 104;
    const r = UIK.questionPanel(g, qx, qy, qw, M.h, { title: 'PREGUNTA', icon: 'book', stem });
    let yy = r.contentY;
    opts.forEach((o2, i) => { const c = Gui.choice(g, 'q' + i, r.x, yy, r.w, o2, 'ABCD'[i], { state: i === 2 ? 'correct' : i === this.sel && i !== 2 ? 'selected' : null }); if (c.clicked) this.sel = i; yy += c.h + 3; });
    Gui.choice(g, 'qw', 160, 228, 230, 'Opción incorrecta marcada', 'B', { state: 'wrong' });
    Gui.choice(g, 'qd', 160, 248, 230, 'Opción atenuada', 'D', { state: 'dim', disabled: true });
    UIK.interactPrompt(g, 60, 220, 'Analizar muestra', {});
    UIK.interactPrompt(g, 60, 244, 'Hecho', { done: true });
    UIK.interactPrompt(g, 60, 268, '', {});
    // tira de capítulos
    frect(g, 0, 292, W, 68, '#00152c'); frect(g, 0, 292, W, 1, '#1e5a8a'); frect(g, 0, 293, W, 1, '#0a2444');
    for (let i = 0; i < 8; i++) UIK.levelCard(g, 6 + i * 79, 297, 74, 57, { id: i, label: LEVEL_CARD_NAME[i], state: i < 2 ? 'done' : i === 2 ? 'current' : i > 6 ? 'locked' : 'open', selected: i === 2 });
  },
  page2(g) {
    const names = Object.keys(Icons.defs);
    UIK.panel(g, 4, 4, W - 8, 120, 'tech');
    UIK.header(g, 4, 4, W - 8, 'ICONOS 12 PX (contorno de color)', 'tech', 'star');
    names.forEach((n, i) => { const x = 12 + (i % 30) * 20, y = 30 + Math.floor(i / 30) * 30; Icons.draw(g, n, x, y); drawText(g, n.slice(0, 4), x + 6, y + 15, { font: 'tiny', color: '#93a6c8', align: 'center' }); });
    const big = Object.keys(Icons.bigDefs);
    UIK.panel(g, 4, 130, W - 8, 226, 'hud');
    UIK.header(g, 4, 130, W - 8, 'ICONOS 22 PX E INSIGNIAS', 'hud', 'book');
    big.forEach((n, i) => { const x = 14 + (i % 16) * 38, y = 156 + Math.floor(i / 16) * 46; UIK.badge(g, n, x, y, 22, 'tech'); Icons.drawBig(g, n, x + 34 - 12 + 2, y + 11); drawText(g, n.slice(0, 7), x + 11, y + 26, { font: 'tiny', color: '#93a6c8', align: 'center' }); });
  },
};
