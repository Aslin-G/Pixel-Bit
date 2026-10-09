/* =====================================================================
   06_ui.js — Kit de interfaz pixel: paneles, iconos procedurales,
   GUI inmediata con navegación por teclado, y gráficos científicos.
   ===================================================================== */

/* ---------- Paneles ---------- */
const PANEL_STYLES = {
  tech: { bg: ['#0e1430', '#121a3c'], edge: '#22bdd0', edge2: '#106884', hi: '#56e5ff', ink: '#070a1c', corner: '#a6f4ff' },
  dialog: { bg: ['#16123a', '#1d1848'], edge: '#eab02a', edge2: '#8a5e14', hi: '#ffe14d', ink: '#0a0718', corner: '#fff08a' },
  paper: { bg: ['#f8e6b8', '#f2d898'], edge: '#a65f30', edge2: '#7e4429', hi: '#fff6d8', ink: '#3a1a10', corner: '#c97c38' },
  alert: { bg: ['#2a0c18', '#3a1020'], edge: '#ff4e5d', edge2: '#a82c40', hi: '#ff9a8a', ink: '#12040a', corner: '#ffc6b4' },
  mirage: { bg: ['#1d0b3a', '#2a1050'], edge: '#e050c8', edge2: '#6a1c94', hi: '#ffd0e8', ink: '#0a0418', corner: '#56e5ff' },
  mosaic: { bg: ['#0e1a2a', '#132438'], edge: '#86e36f', edge2: '#1f854c', hi: '#c2f58e', ink: '#06100a', corner: '#ffe14d' },
  glass: { bg: ['rgba(14,20,48,0.86)', 'rgba(18,26,60,0.86)'], edge: '#3cc0d6', edge2: '#165a7a', hi: '#a6f4ff', ink: '#070a1c', corner: '#c4fbff' },
  toast: { bg: ['#121a3c', '#16204a'], edge: '#56e5ff', edge2: '#106884', hi: '#a6f4ff', ink: '#070a1c', corner: '#ffffff' },
  green: { bg: ['#0b2a22', '#0f3a2c'], edge: '#4ccb70', edge2: '#156647', hi: '#c2f58e', ink: '#04140c', corner: '#ffe14d' },
  limen: { bg: ['#0a2236', '#0e2e48'], edge: '#7ee8f0', edge2: '#1f8aa8', hi: '#ffffff', ink: '#041018', corner: '#b49cff' },
};
const UIK = {
  panel(g, x, y, w, h, style = 'tech', accent = null) {
    const s = PANEL_STYLES[style] || PANEL_STYLES.tech;
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    const edge = accent || s.edge;
    // sombra discretizada
    fdither(g, x + 2, y + 2, w, h, '#05030f', 0.6);
    // contorno exterior
    frect(g, x + 1, y, w - 2, h, s.ink); frect(g, x, y + 1, w, h - 2, s.ink);
    // fondo con gradiente tramado
    frect(g, x + 1, y + 1, w - 2, h - 2, s.bg[0]);
    fdither(g, x + 1, y + 1, w - 2, Math.floor((h - 2) / 2), s.bg[1], 0.5);
    frect(g, x + 1, y + 1, w - 2, Math.max(1, Math.floor((h - 2) / 4)), s.bg[1]);
    // bordes
    frect(g, x + 2, y + 1, w - 4, 1, edge); frect(g, x + 2, y + h - 2, w - 4, 1, s.edge2);
    frect(g, x + 1, y + 2, 1, h - 4, edge); frect(g, x + w - 2, y + 2, 1, h - 4, s.edge2);
    frect(g, x + 3, y + 2, Math.max(0, w - 6), 1, 'rgba(255,255,255,0.08)');
    // esquinas
    if (w > 20 && h > 14) {
      fpx(g, x + 2, y + 2, s.corner); fpx(g, x + w - 3, y + 2, s.corner);
      fpx(g, x + 2, y + h - 3, s.edge2); fpx(g, x + w - 3, y + h - 3, s.edge2);
      if (style === 'tech' || style === 'glass' || style === 'limen') {
        frect(g, x + 4, y + 3, 6, 1, s.hi); frect(g, x + 4, y + 3, 1, 3, s.hi);
        frect(g, x + w - 10, y + h - 4, 6, 1, s.edge); frect(g, x + w - 5, y + h - 6, 1, 3, s.edge);
      }
      if (style === 'dialog') {
        for (const [cx, cy] of [[x + 5, y + 4], [x + w - 6, y + 4], [x + 5, y + h - 5], [x + w - 6, y + h - 5]]) { fpx(g, cx, cy, s.hi); fpx(g, cx + 1, cy + 1, s.edge2); }
      }
      if (style === 'paper') { fdither(g, x + 3, y + 3, w - 6, h - 6, '#e8c47a', 0.12); }
      if (style === 'alert') for (let i = 0; i < w - 8; i += 6) { frect(g, x + 4 + i, y + h - 4, 3, 1, '#ffb83e'); }
      if (style === 'mirage') { const t = Game.time; for (let i = 0; i < 6; i++) fpx(g, x + 4 + ((t * 30 + i * 37) % (w - 8)), y + 1, '#56e5ff'); }
    }
  },
  /** Barra de título de panel */
  header(g, x, y, w, title, style = 'tech', icon = null) {
    const s = PANEL_STYLES[style] || PANEL_STYLES.tech;
    frect(g, x + 3, y + 3, w - 6, 13, s.edge2);
    fdither(g, x + 3, y + 3, w - 6, 6, s.edge, 0.5);
    frect(g, x + 3, y + 15, w - 6, 1, s.ink);
    let tx = x + 8;
    if (icon) { Icons.draw(g, icon, x + 5, y + 3); tx += 14; }
    drawText(g, title, tx, y + 5, { color: style === 'paper' ? '#fff6d8' : '#fffaf0', shadow: s.ink });
  },
  /** Marco decorativo grueso para retratos */
  frame(g, x, y, w, h, col = '#eab02a', col2 = '#8a5e14') {
    frect(g, x - 2, y - 2, w + 4, h + 4, '#0a0718');
    frect(g, x - 1, y - 1, w + 2, h + 2, col);
    frect(g, x, y + h, w + 1, 1, col2); frect(g, x + w, y, 1, h + 1, col2);
  },
  bar(g, x, y, w, h, frac, col, bg = '#0a0c22', segs = 0) {
    frect(g, x, y, w, h, '#05030f'); frect(g, x + 1, y + 1, w - 2, h - 2, bg);
    const fw = Math.round((w - 2) * clamp(frac, 0, 1));
    if (fw > 0) { frect(g, x + 1, y + 1, fw, h - 2, col); frect(g, x + 1, y + 1, fw, 1, shade(col, 0.25)); frect(g, x + 1, y + h - 2, fw, 1, shade(col, -0.3)); }
    if (segs) for (let i = 1; i < segs; i++) frect(g, x + 1 + Math.round(i * (w - 2) / segs), y + 1, 1, h - 2, 'rgba(5,3,15,0.5)');
  },
};

/* ---------- Iconos procedurales 12x12 (contorno automático) ---------- */
const Icons = {
  cache: new Map(),
  defs: {},
  def(name, fn) { this.defs[name] = fn; },
  get(name, scale = 1) {
    const k = name + '@' + scale;
    let c = this.cache.get(k);
    if (c) return c;
    const fn = this.defs[name] || this.defs.info;
    const pb = new PixelBuffer(14, 14);
    fn(pb);
    pb.outline('#140d26');
    c = pb.toCanvas();
    if (scale !== 1) { const s = makeCanvas(14 * scale, 14 * scale); s.g.drawImage(c, 0, 0, 14 * scale, 14 * scale); c = s; }
    this.cache.set(k, c);
    return c;
  },
  draw(g, name, x, y, scale = 1) { g.drawImage(this.get(name, scale), Math.round(x - scale), Math.round(y - scale)); },
};
(function defineIcons() {
  const I = Icons;
  I.def('water', p => { p.poly([[7, 1], [11, 7], [11, 9], [9, 12], [5, 12], [3, 9], [3, 7]], '#1491aa'); p.ellipse(7, 9, 3.6, 3, '#22bdd0'); p.poly([[7, 2], [10, 7], [7, 7]], '#56e5ff'); p.set(5, 8, '#e6fdff'); p.set(5, 9, '#e6fdff'); p.set(6, 7, '#a6f4ff'); });
  I.def('sun', p => { for (let a = 0; a < 8; a++) { const an = a * Math.PI / 4; p.line(7 + Math.cos(an) * 4, 7 + Math.sin(an) * 4, 7 + Math.cos(an) * 6, 7 + Math.sin(an) * 6, '#ffb83e'); } p.disc(7, 7, 3.5, '#ffe14d'); p.set(6, 5, '#fffbd0'); p.set(5, 6, '#fffbd0'); p.set(8, 9, '#e0b41e'); p.set(9, 8, '#e0b41e'); });
  I.def('wind', p => { p.hline(1, 9, 4, '#cfe8ee'); p.set(10, 3, '#cfe8ee'); p.set(11, 2, '#cfe8ee'); p.set(10, 1, '#cfe8ee'); p.hline(2, 12, 7, '#ffffff'); p.hline(1, 8, 10, '#98c6d2'); p.set(9, 11, '#98c6d2'); p.set(10, 12, '#98c6d2'); });
  I.def('battery', p => { p.rect(2, 3, 10, 8, '#1d2a48'); p.rect(12, 5, 1, 4, '#6aa0b4'); p.rect(3, 4, 2, 6, '#86e36f'); p.rect(5, 4, 2, 6, '#86e36f'); p.rect(7, 4, 2, 6, '#4ccb70'); p.hline(3, 8, 4, '#c2f58e'); });
  I.def('h2', p => { p.disc(7, 7, 5.5, '#16768c'); p.disc(7, 7, 4.5, '#22a2b2'); p.rect(4, 5, 1, 5, '#e6fdff'); p.rect(7, 5, 1, 5, '#e6fdff'); p.rect(5, 7, 2, 1, '#e6fdff'); p.rect(9, 8, 2, 1, '#e6fdff'); p.set(10, 9, '#e6fdff'); p.set(9, 10, '#e6fdff'); p.rect(9, 11, 3, 1, '#e6fdff'); p.set(5, 3, '#8cf4ec'); });
  I.def('leaf', p => { p.poly([[2, 12], [3, 6], [7, 2], [12, 1], [11, 6], [7, 11]], '#33a552'); p.poly([[4, 9], [5, 5], [8, 3], [11, 2]], '#86e36f'); p.line(2, 12, 10, 3, '#156647'); p.set(4, 6, '#c2f58e'); });
  I.def('salt', p => { p.poly([[7, 1], [12, 5], [10, 12], [4, 12], [2, 5]], '#f78acb'); p.poly([[7, 1], [12, 5], [7, 7], [2, 5]], '#ffd8ec'); p.line(7, 7, 7, 12, '#dc6aa4'); p.set(6, 3, '#ffffff'); });
  I.def('gear', p => { for (let a = 0; a < 8; a++) { const an = a * Math.PI / 4; p.disc(7 + Math.cos(an) * 5, 7 + Math.sin(an) * 5, 1.4, '#6aa0b4'); } p.disc(7, 7, 4.4, '#98c6d2'); p.disc(7, 7, 1.8, '#27405e'); p.set(5, 4, '#f4fdff'); });
  I.def('book', p => { p.rect(2, 2, 10, 10, '#a82c40'); p.rect(3, 3, 8, 8, '#d8434a'); p.rect(4, 4, 6, 2, '#ffe14d'); p.rect(2, 11, 10, 1, '#fff6d8'); p.vline(2, 2, 11, '#7a1f36'); p.set(5, 7, '#ff9a8a'); });
  I.def('map', p => { p.poly([[1, 3], [5, 1], [9, 3], [13, 1], [13, 11], [9, 13], [5, 11], [1, 13]], '#f8d677'); p.poly([[5, 1], [9, 3], [9, 13], [5, 11]], '#e49c44'); p.line(3, 9, 6, 6, '#ff4e5d'); p.line(6, 6, 10, 8, '#ff4e5d'); p.set(10, 5, '#20d6c7'); p.set(11, 5, '#20d6c7'); });
  I.def('lens', p => { p.disc(6, 6, 4.5, '#56e5ff'); p.disc(6, 6, 3.2, '#1491aa'); p.set(4, 4, '#e6fdff'); p.set(5, 4, '#e6fdff'); p.thick(9.5, 9.5, 12, 12, 1, '#e8873e'); p.set(7, 7, '#20d6c7'); });
  I.def('warn', p => { p.poly([[7, 1], [13, 12], [1, 12]], '#ffb83e'); p.poly([[7, 3], [11, 11], [3, 11]], '#ffe14d'); p.rect(6, 5, 2, 4, '#140d26'); p.rect(6, 10, 2, 1, '#140d26'); });
  I.def('check', p => { p.thick(2.5, 7.5, 5.5, 10.5, 1, '#33a552'); p.thick(5.5, 10.5, 11.5, 3.5, 1, '#33a552'); p.line(3, 7, 5, 9, '#c2f58e'); p.line(6, 9, 11, 3, '#86e36f'); });
  I.def('cross', p => { p.thick(3, 3, 11, 11, 1.1, '#d8434a'); p.thick(11, 3, 3, 11, 1.1, '#d8434a'); p.line(3, 3, 10, 10, '#ff9a8a'); });
  I.def('star', p => { const pts = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 2.6 : 6; const a = -Math.PI / 2 + i * Math.PI / 5; pts.push([7 + Math.cos(a) * r, 7.4 + Math.sin(a) * r]); } p.poly(pts, '#ffd84a'); p.set(6, 5, '#fff09a'); p.set(7, 4, '#fff09a'); p.set(9, 9, '#c8861a'); });
  I.def('lock', p => { p.ellipseOutline(7, 5, 3, 3.5, '#98c6d2'); p.ellipseOutline(7, 5, 2, 2.5, '#6aa0b4'); p.rect(3, 6, 9, 7, '#eab02a'); p.rect(3, 6, 9, 2, '#ffd84a'); p.rect(7, 9, 1, 2, '#3a2208'); });
  I.def('person', p => { p.disc(7, 4, 2.6, '#dc9d6a'); p.poly([[2, 13], [3, 8], [7, 7], [11, 8], [12, 13]], '#ff6b6b'); p.set(6, 3, '#efc193'); });
  I.def('people', p => { p.disc(4, 5, 2, '#c37c4d'); p.poly([[0, 12], [1, 8], [4, 7], [7, 8], [7, 12]], '#4ccb70'); p.disc(10, 4, 2.2, '#dca07a'); p.poly([[6, 13], [7, 8], [10, 7], [13, 8], [13, 13]], '#ff9f43'); });
  I.def('info', p => { p.disc(7, 7, 5.5, '#2c63c0'); p.disc(7, 7, 4.5, '#4a8ae0'); p.rect(6, 6, 2, 5, '#ffffff'); p.rect(6, 3, 2, 2, '#ffffff'); });
  I.def('clock', p => { p.disc(7, 7, 5.5, '#cfe8ee'); p.disc(7, 7, 4.5, '#f4fdff'); p.vline(7, 4, 7, '#140d26'); p.hline(7, 9, 7, '#ff4e5d'); });
  I.def('flask', p => { p.rect(5, 1, 4, 5, '#cfe8ee'); p.poly([[5, 5], [9, 5], [12, 12], [2, 12]], '#cfe8ee'); p.poly([[4, 8], [10, 8], [12, 12], [2, 12]], '#86e36f'); p.set(5, 10, '#c2f58e'); p.hline(4, 9, 1, '#98c6d2'); });
  I.def('plant', p => { p.rect(4, 9, 6, 4, '#c9622e'); p.rect(4, 9, 6, 1, '#e8873e'); p.vline(7, 4, 9, '#1f854c'); p.ellipse(5, 5, 2.5, 1.5, '#4ccb70'); p.ellipse(9.5, 3.5, 2.5, 1.5, '#86e36f'); });
  I.def('bolt', p => { p.poly([[8, 0], [3, 8], [7, 8], [5, 14], [11, 5], [7, 5]], '#ffe14d'); p.line(7, 2, 5, 7, '#fffbd0'); });
  I.def('thermo', p => { p.rect(6, 1, 3, 9, '#f4fdff'); p.disc(7.5, 11, 2.5, '#ff4e5d'); p.rect(7, 5, 1, 6, '#ff4e5d'); });
  I.def('filter', p => { p.poly([[1, 2], [13, 2], [8, 8], [8, 12], [6, 13], [6, 8]], '#6aa0b4'); p.hline(2, 12, 3, '#cfe8ee'); p.hline(4, 10, 5, '#98c6d2'); });
  I.def('membrane', p => { p.rect(1, 2, 12, 10, '#0f4888'); for (let y = 3; y < 11; y += 2) p.hline(2, 11, y, '#56e5ff'); p.vline(7, 2, 11, '#fff4de'); p.set(3, 4, '#f78acb'); p.set(4, 8, '#f78acb'); p.set(10, 5, '#a6f4ff'); });
  I.def('tank', p => { p.rect(2, 2, 10, 11, '#477a94'); p.rect(3, 6, 8, 6, '#22bdd0'); p.hline(3, 10, 6, '#a6f4ff'); p.hline(2, 11, 2, '#98c6d2'); });
  I.def('hint', p => { p.disc(7, 5, 4.2, '#ffe14d'); p.rect(5, 9, 5, 2, '#e0b41e'); p.rect(5, 11, 5, 2, '#98c6d2'); p.set(5, 3, '#fffbd0'); p.set(6, 3, '#fffbd0'); });
  I.def('question', p => { p.disc(7, 7, 5.5, '#7650dc'); p.disc(7, 7, 4.5, '#8d6bff'); p.rect(5, 3, 4, 1, '#fff'); p.rect(9, 4, 1, 2, '#fff'); p.rect(7, 6, 2, 1, '#fff'); p.rect(7, 7, 1, 2, '#fff'); p.rect(7, 10, 1, 1, '#fff'); });
  I.def('chart', p => { p.rect(1, 1, 12, 12, '#121736'); p.rect(3, 8, 2, 4, '#56e5ff'); p.rect(6, 5, 2, 7, '#ffe14d'); p.rect(9, 3, 2, 9, '#86e36f'); p.hline(2, 12, 12, '#cfe8ee'); });
  I.def('heart', p => { p.disc(4.5, 5, 3, '#ff6b6b'); p.disc(9.5, 5, 3, '#ff6b6b'); p.poly([[1.5, 6], [12.5, 6], [7, 12.5]], '#ff6b6b'); p.set(4, 4, '#ffc6b4'); });
  I.def('shield', p => { p.poly([[7, 1], [12, 3], [11, 9], [7, 13], [3, 9], [2, 3]], '#3cc0d6'); p.poly([[7, 2], [11, 4], [10, 8], [7, 11]], '#7ee8f0'); p.vline(7, 2, 12, '#c4fbff'); });
  I.def('eye', p => { p.ellipse(7, 7, 6, 3.5, '#f4fdff'); p.disc(7, 7, 2.6, '#2c63c0'); p.disc(7, 7, 1.2, '#140d26'); p.set(6, 6, '#fff'); });
  I.def('mirror', p => { p.ellipse(7, 6, 4.5, 5.5, '#e050c8'); p.ellipse(7, 6, 3.5, 4.5, '#ffd0e8'); p.line(5, 4, 8, 3, '#ffffff'); p.rect(6, 11, 3, 3, '#6a1c94'); });
  I.def('puzzle', p => { p.rect(2, 4, 8, 8, '#ff9f43'); p.disc(6, 3, 1.8, '#ff9f43'); p.disc(11, 8, 1.8, '#ff9f43'); p.hline(3, 8, 5, '#ffc06a'); });
  I.def('coin', p => { p.disc(7, 7, 5.5, '#c8861a'); p.disc(7, 7, 4.5, '#ffd84a'); p.rect(6, 4, 2, 6, '#9a5e12'); p.set(5, 4, '#fff09a'); });
  I.def('seed', p => { p.ellipse(7, 8, 3.5, 4.5, '#b86f44'); p.ellipse(6, 7, 1.5, 2.5, '#d18f5c'); p.line(7, 4, 9, 1, '#4ccb70'); p.set(10, 1, '#86e36f'); });
  I.def('sensor', p => { p.vline(7, 6, 13, '#98c6d2'); p.rect(4, 3, 7, 4, '#27405e'); p.rect(5, 4, 2, 2, '#ff4e5d'); p.rect(8, 4, 2, 2, '#86e36f'); p.ellipseOutline(7, 3, 6, 3, '#56e5ff'); });
  I.def('drone', p => { p.rect(4, 6, 6, 3, '#ff9f43'); p.hline(0, 4, 4, '#cfe8ee'); p.hline(10, 13, 4, '#cfe8ee'); p.vline(2, 4, 6, '#6aa0b4'); p.vline(11, 4, 6, '#6aa0b4'); p.set(7, 9, '#56e5ff'); p.set(7, 10, '#56e5ff'); });
  I.def('kiru', p => { p.poly([[2, 1], [5, 5], [3, 6]], '#2c63c0'); p.poly([[12, 1], [9, 5], [11, 6]], '#2c63c0'); p.ellipse(7, 8, 5, 4.5, '#20d6c7'); p.ellipse(7, 9, 3.5, 2.6, '#0f1e5c'); p.rect(5, 8, 1, 2, '#56e5ff'); p.rect(8, 8, 1, 2, '#56e5ff'); p.hline(5, 9, 12, '#ff9f43'); });
  I.def('save', p => { p.rect(2, 2, 10, 10, '#2c63c0'); p.rect(4, 2, 6, 4, '#cfe8ee'); p.rect(4, 8, 6, 4, '#f4fdff'); p.rect(8, 3, 1, 2, '#2c63c0'); });
  I.def('music', p => { p.vline(5, 2, 10, '#ffe14d'); p.vline(11, 1, 9, '#ffe14d'); p.line(5, 2, 11, 1, '#ffe14d'); p.ellipse(3.5, 10.5, 2, 1.6, '#ffe14d'); p.ellipse(9.5, 9.5, 2, 1.6, '#ffe14d'); });
  I.def('mosaic', p => { p.rect(1, 1, 6, 6, '#56e5ff'); p.rect(7, 1, 6, 6, '#ffe14d'); p.rect(1, 7, 6, 6, '#86e36f'); p.rect(7, 7, 6, 6, '#ff6b6b'); p.rect(5, 5, 4, 4, '#8d6bff'); });
  I.def('drop_brine', p => { p.poly([[7, 1], [11, 7], [11, 9], [9, 12], [5, 12], [3, 9], [3, 7]], '#bc3e92'); p.ellipse(7, 9, 3.6, 3, '#e05aa0'); p.set(5, 8, '#ffc4dc'); p.set(6, 7, '#f888b8'); p.set(8, 10, '#ffffff'); p.set(9, 8, '#ffffff'); });
  I.def('plug', p => { p.rect(4, 5, 6, 5, '#98c6d2'); p.vline(5, 2, 5, '#cfe8ee'); p.vline(8, 2, 5, '#cfe8ee'); p.vline(7, 10, 13, '#ffe14d'); });
  I.def('target', p => { p.disc(7, 7, 5.5, '#ff4e5d'); p.disc(7, 7, 4, '#fff'); p.disc(7, 7, 2.4, '#ff4e5d'); p.disc(7, 7, 1, '#fff'); });
  I.def('play', p => { p.poly([[3, 2], [12, 7], [3, 12]], '#86e36f'); p.line(4, 4, 9, 7, '#c2f58e'); });
  I.def('pause', p => { p.rect(3, 2, 3, 10, '#cfe8ee'); p.rect(8, 2, 3, 10, '#cfe8ee'); });
  I.def('reset', p => { p.ellipseOutline(7, 7, 5, 5, '#ffe14d'); p.ellipseOutline(7, 7, 4, 4, '#ffe14d'); p.rect(9, 1, 4, 4, null); p.poly([[8, 0], [13, 3], [8, 6]], '#ffe14d'); });
  I.def('mangrove', p => { p.ellipse(7, 4, 5, 3.5, '#33946a'); p.ellipse(6, 3, 3, 2, '#7fd394'); p.vline(7, 6, 10, '#7a3e2a'); p.line(7, 9, 3, 13, '#7a3e2a'); p.line(7, 9, 11, 13, '#7a3e2a'); p.hline(1, 13, 12, '#16a6cf'); });
  I.def('fish', p => { p.ellipse(6, 7, 4.5, 3, '#ff9f43'); p.poly([[10, 7], [13, 4], [13, 10]], '#ffc06a'); p.set(4, 6, '#140d26'); p.hline(4, 8, 8, '#ffe0a0'); });
  I.def('cactus', p => { p.rect(6, 2, 3, 11, '#33a552'); p.rect(3, 5, 2, 4, '#33a552'); p.rect(3, 8, 3, 2, '#33a552'); p.rect(10, 4, 2, 4, '#33a552'); p.rect(9, 7, 2, 2, '#33a552'); p.vline(7, 3, 12, '#86e36f'); p.set(7, 1, '#f78acb'); });
  I.def('turbine', p => { p.vline(7, 6, 13, '#f4fdff'); p.line(7, 6, 7, 0, '#f4fdff'); p.line(7, 6, 1, 9, '#cfe8ee'); p.line(7, 6, 13, 9, '#cfe8ee'); p.disc(7, 6, 1.2, '#98c6d2'); });
  I.def('panel', p => { p.poly([[1, 9], [5, 3], [13, 3], [9, 9]], '#1f469e'); p.line(3, 6, 11, 6, '#8cc4ff'); p.line(5, 3, 3, 9, '#4a8ae0'); p.line(9, 3, 7, 9, '#4a8ae0'); p.vline(7, 9, 13, '#98c6d2'); p.set(10, 4, '#d6efff'); });
  I.def('scale', p => { p.vline(7, 2, 12, '#eab02a'); p.hline(2, 12, 3, '#eab02a'); p.poly([[0, 8], [4, 8], [2, 4]], '#ffd84a'); p.poly([[10, 8], [14, 8], [12, 4]], '#ffd84a'); p.hline(4, 10, 12, '#c8861a'); });
  I.def('ear', p => { p.disc(7, 7, 5.5, '#8d6bff'); p.ellipseOutline(7, 7, 3, 3, '#dcd0ff'); p.set(7, 7, '#fff'); });
})();

/* ---------- GUI inmediata ---------- */
const Gui = {
  items: [], prev: [], focus: null, active: null, hot: null, keyNav: false, tooltip: null, sliderDrag: null,
  begin() { this.prev = this.items; this.items = []; this.hot = null; this.tooltip = null; },
  /** Registrar elemento enfocable */
  _reg(id, x, y, w, h, kind) {
    const it = { id, x, y, w, h, kind };
    this.items.push(it);
    if (this.curIds) this.curIds.add(id);
    const p = Input.pointer;
    const over = p.x >= x && p.x < x + w && p.y >= y && p.y < y + h;
    if (over) { this.hot = id; if (p.moved && !this.keyNav) this.focus = id; if (p.moved) this.keyNav = false; }
    return over;
  },
  end() {
    // navegación por teclado entre elementos registrados en este cuadro
    const list = this.items;
    if (!list.length) return;
    if (!list.find(i => i.id === this.focus)) { if (this.keyNav || Input.lastDevice !== 'mouse') this.focus = list[0].id; }
    const cur = list.find(i => i.id === this.focus);
    let dir = null;
    if (Input.pressed('next')) { const k = list.indexOf(cur); this.focus = list[(k + (Input.down('fast') ? -1 : 1) + list.length) % list.length].id; this.keyNav = true; Audio2.sfx('uiMove'); return; }
    if (Input.pressed('uiUp')) dir = [0, -1];
    else if (Input.pressed('uiDown')) dir = [0, 1];
    else if (cur && cur.kind !== 'slider' && Input.pressed('uiLeft')) dir = [-1, 0];
    else if (cur && cur.kind !== 'slider' && Input.pressed('uiRight')) dir = [1, 0];
    if (dir && cur) {
      const cx = cur.x + cur.w / 2, cy = cur.y + cur.h / 2;
      let best = null, bd = Infinity;
      for (const it of list) {
        if (it === cur) continue;
        const dx = it.x + it.w / 2 - cx, dy = it.y + it.h / 2 - cy;
        const along = dx * dir[0] + dy * dir[1];
        if (along <= 2) continue;
        const across = Math.abs(dx * dir[1]) + Math.abs(dy * dir[0]);
        const d = along + across * 2.2;
        if (d < bd) { bd = d; best = it; }
      }
      if (best) { this.focus = best.id; this.keyNav = true; Audio2.sfx('uiMove'); }
    } else if (dir && !cur) { this.focus = list[0].id; this.keyNav = true; }
  },
  /** Un control recién aparecido no acepta ENTER en su primer cuadro (evita que la misma pulsación que lo mostró lo active) */
  wasShown(id) { return !!(this.prevIds && this.prevIds.has(id)); },
  /** Llamado una vez por cuadro antes de dibujar todas las escenas */
  newFrame() { this.prevIds = this.curIds || new Set(); this.curIds = new Set(); },
  isFocused(id) { return this.focus === id && (this.keyNav || Input.lastDevice !== 'mouse'); },
  /** Botón. opts: icon, style('primary'|'ghost'|'danger'|'choice'|'tab'), disabled, selected, tip, key */
  button(g, id, x, y, w, h, label, opts = {}) {
    const over = this._reg(id, x, y, w, h, 'button');
    const p = Input.pointer;
    let clicked = false;
    if (!opts.disabled) {
      if (over && p.pressed) this.active = id;
      if (this.active === id && p.released) { if (over) clicked = true; this.active = null; }
      if (this.focus === id && (Input.pressed('confirm')) && !opts.noKey && this.wasShown(id)) clicked = true;
    }
    if (over && opts.tip) this.tooltip = opts.tip;
    const focused = this.isFocused(id) || (over && !this.keyNav);
    const pressed = this.active === id && over;
    if (!opts.noDraw) this.drawButton(g, x, y, w, h, label, Object.assign({}, opts, { focused, pressed }));
    else if (focused) { frect(g, x, y, w, 1, '#ffe14d'); frect(g, x, y + h - 1, w, 1, '#ffe14d'); frect(g, x, y, 1, h, '#ffe14d'); frect(g, x + w - 1, y, 1, h, '#ffe14d'); }
    if (clicked) { Audio2.sfx(opts.sfx || 'ui'); Input.consumePointer(); }
    return clicked;
  },
  drawButton(g, x, y, w, h, label, o) {
    const st = o.style || 'primary';
    const pal = {
      primary: ['#1d346c', '#2c4f96', '#56e5ff', '#0a1030'],
      choice: ['#1a1640', '#262060', '#b49cff', '#0a0718'],
      danger: ['#4a1428', '#7a1f36', '#ff9a8a', '#12040a'],
      ghost: ['#121736', '#1c2350', '#8a8fb8', '#070a1c'],
      good: ['#0f4a3e', '#1f854c', '#c2f58e', '#04140c'],
      tab: ['#121736', '#1d346c', '#56e5ff', '#070a1c'],
      gold: ['#6a3e0e', '#9a5e12', '#ffe14d', '#1a0f04'],
      paper: ['#e8c47a', '#f8e6b8', '#7e4429', '#3a1a10'],
    }[st] || ['#1d346c', '#2c4f96', '#56e5ff', '#0a1030'];
    let [b0, b1, hi, ink] = pal;
    if (o.disabled) { b0 = '#141626'; b1 = '#1c1f34'; hi = '#4a4e70'; }
    if (o.selected) { b0 = shade(b1, 0.1); b1 = shade(b1, 0.25); }
    const dy = o.pressed ? 1 : 0;
    x = Math.round(x); y = Math.round(y);
    frect(g, x + 1, y + 1 + h - 1, w - 2, 1, '#05030f');
    frect(g, x + 1, y + dy, w - 2, h, ink); frect(g, x, y + 1 + dy, w, h - 2, ink);
    frect(g, x + 1, y + 1 + dy, w - 2, h - 2, b0);
    fdither(g, x + 1, y + 1 + dy, w - 2, Math.ceil((h - 2) / 2), b1, 0.5);
    frect(g, x + 1, y + 1 + dy, w - 2, 1, b1);
    if (o.focused || o.selected) {
      frect(g, x + 1, y + 1 + dy, w - 2, 1, hi); frect(g, x + 1, y + h - 2 + dy, w - 2, 1, hi);
      frect(g, x + 1, y + 1 + dy, 1, h - 2, hi); frect(g, x + w - 2, y + 1 + dy, 1, h - 2, hi);
      if (o.focused && ((Game.frame >> 4) & 1)) { fpx(g, x - 2, y + h / 2 + dy, hi); fpx(g, x - 3, y + h / 2 - 1 + dy, hi); fpx(g, x - 3, y + h / 2 + 1 + dy, hi); }
    }
    let tx = x + w / 2;
    const tcol = o.disabled ? '#5a5e80' : (o.textColor || (st === 'paper' ? '#3a1a10' : '#fffaf0'));
    const ty = y + Math.round(h / 2) - 4 + dy;
    if (o.icon) {
      const lw = label ? FONTS.main.measure(label) : 0;
      const total = 13 + (label ? lw + 3 : 0);
      const ix = o.align === 'left' ? x + 5 : Math.round(x + w / 2 - total / 2);
      Icons.draw(g, o.icon, ix, y + Math.round(h / 2) - 6 + dy);
      if (label) drawText(g, label, ix + 15, ty, { color: tcol, shadow: ink });
    } else if (label) {
      if (o.align === 'left') drawText(g, label, x + 6, ty, { color: tcol, shadow: ink });
      else drawText(g, label, tx, ty, { color: tcol, shadow: ink, align: 'center' });
    }
    if (o.key) drawText(g, o.key, x + w - 4, y + 3 + dy, { font: 'tiny', color: hi, align: 'right' });
  },
  /** Botón de opción multilínea (respuestas A–D) */
  choice(g, id, x, y, w, label, letter, opts = {}) {
    const lines = wrapText(label, w - 26);
    const h = Math.max(18, lines.length * 11 + 7);
    const over = this._reg(id, x, y, w, h, 'button');
    const p = Input.pointer;
    let clicked = false;
    if (!opts.disabled) {
      if (over && p.pressed) this.active = id;
      if (this.active === id && p.released) { if (over) clicked = true; this.active = null; }
      if (this.focus === id && Input.pressed('confirm') && this.wasShown(id)) clicked = true;
    }
    const focused = this.isFocused(id) || (over && !this.keyNav);
    const st = opts.state; // 'correct' | 'wrong' | 'selected' | 'dim'
    let bg = '#16123a', edge = focused ? '#b49cff' : '#3f2690', lc = '#ffe14d';
    if (st === 'selected') { bg = '#2a1a66'; edge = '#ffe14d'; }
    if (st === 'correct') { bg = '#0f3a2c'; edge = '#86e36f'; lc = '#c2f58e'; }
    if (st === 'wrong') { bg = '#3a1020'; edge = '#ff6b6b'; lc = '#ff9a8a'; }
    if (st === 'dim') { bg = '#100d26'; edge = '#2a2050'; lc = '#5a5e80'; }
    frect(g, x, y, w, h, '#0a0718'); frect(g, x + 1, y + 1, w - 2, h - 2, bg);
    frect(g, x + 1, y + 1, w - 2, 1, edge); frect(g, x + 1, y + h - 2, w - 2, 1, shade(edge, -0.3)); frect(g, x + 1, y + 1, 1, h - 2, edge);
    if (focused) fdither(g, x + 2, y + 2, w - 4, h - 4, '#8d6bff', 0.18);
    frect(g, x + 4, y + 4, 14, 11, '#0a0718'); frect(g, x + 5, y + 5, 12, 9, edge);
    drawText(g, letter, x + 11, y + 6, { align: 'center', color: '#0a0718' });
    lines.forEach((ln, i) => drawText(g, ln, x + 22, y + 5 + i * 11, { color: st === 'dim' ? '#6a6e90' : '#fffaf0', shadow: '#0a0718' }));
    if (st === 'correct') Icons.draw(g, 'check', x + w - 16, y + 3);
    if (st === 'wrong') Icons.draw(g, 'cross', x + w - 16, y + 3);
    if (clicked) Audio2.sfx('ui');
    return { clicked, h };
  },
  /** Deslizador. Retorna nuevo valor. opts: label, unit, fmt(v), color, disabled, marks:[{v,col,label}] */
  slider(g, id, x, y, w, value, min, max, step, opts = {}) {
    const h = 22;
    const over = this._reg(id, x, y, w, h, 'slider');
    const p = Input.pointer;
    const tx0 = x + 4, tw = w - 8, ty = y + 14;
    let v = value;
    if (!opts.disabled) {
      if (over && p.pressed) { this.active = id; this.sliderDrag = id; }
      if (this.sliderDrag === id) {
        if (p.down) { v = min + clamp((p.x - tx0) / tw, 0, 1) * (max - min); }
        else this.sliderDrag = null;
      }
      if (this.focus === id) {
        const big = Input.down('fast') ? 5 : 1;
        if (Input.pressed('uiLeft')) { v -= step * big; Audio2.sfx('uiMove'); }
        if (Input.pressed('uiRight')) { v += step * big; Audio2.sfx('uiMove'); }
      }
    }
    v = clamp(Math.round((v - min) / step) * step + min, min, max);
    v = parseFloat(v.toFixed(6));
    const focused = this.isFocused(id) || (over && !this.keyNav) || this.sliderDrag === id;
    const col = opts.disabled ? '#4a4e70' : (opts.color || '#56e5ff');
    // etiqueta
    if (opts.label) drawText(g, opts.label, x, y + 1, { color: focused ? '#fffaf0' : '#cfd6f0', shadow: '#0a0718' });
    const vs = (opts.fmt ? opts.fmt(v) : fmt(v, step < 1 ? (step < 0.1 ? 2 : 1) : 0)) + (opts.unit ? ' ' + opts.unit : '');
    drawText(g, vs, x + w, y + 1, { color: col, shadow: '#0a0718', align: 'right' });
    // pista
    frect(g, tx0 - 1, ty - 1, tw + 2, 5, '#05030f');
    frect(g, tx0, ty, tw, 3, '#1c2350');
    const f = (v - min) / (max - min);
    frect(g, tx0, ty, Math.round(tw * f), 3, col);
    frect(g, tx0, ty, Math.round(tw * f), 1, shade(col, 0.3));
    if (opts.marks) for (const m of opts.marks) {
      const mx = Math.round(tx0 + tw * (m.v - min) / (max - min));
      frect(g, mx, ty - 3, 1, 9, m.col || '#ff4e5d');
      if (m.zone) fdither(g, mx, ty - 2, Math.round(tw * (m.zone - m.v) / (max - min)), 7, m.col || '#ff4e5d', 0.25);
    }
    const kx = Math.round(tx0 + tw * f);
    frect(g, kx - 3, ty - 4, 7, 11, '#05030f');
    frect(g, kx - 2, ty - 3, 5, 9, focused ? '#fffaf0' : '#cfe8ee');
    frect(g, kx - 2, ty + 3, 5, 3, focused ? col : '#6aa0b4');
    fpx(g, kx, ty - 1, '#05030f');
    if (opts.tip && over) this.tooltip = opts.tip;
    return v;
  },
  toggle(g, id, x, y, label, on, opts = {}) {
    const w = opts.w || (FONTS.main.measure(label) + 30), h = 14;
    const over = this._reg(id, x, y, w, h, 'button');
    const p = Input.pointer;
    let changed = false;
    if (over && p.pressed) this.active = id;
    if (this.active === id && p.released) { if (over) changed = true; this.active = null; }
    if (this.focus === id && Input.pressed('confirm') && this.wasShown(id)) changed = true;
    const focused = this.isFocused(id) || (over && !this.keyNav);
    frect(g, x, y + 2, 20, 10, '#05030f');
    frect(g, x + 1, y + 3, 18, 8, on ? '#1f854c' : '#3a1020');
    frect(g, on ? x + 11 : x + 2, y + 4, 7, 6, on ? '#c2f58e' : '#ff9a8a');
    drawText(g, label, x + 25, y + 3, { color: focused ? '#ffe14d' : '#fffaf0', shadow: '#0a0718' });
    if (changed) Audio2.sfx('ui');
    return changed ? !on : on;
  },
  renderTooltip(g) {
    if (!this.tooltip) return;
    const p = Input.pointer;
    const lines = wrapText(this.tooltip, 180);
    const w = Math.min(190, Math.max(...lines.map(l => FONTS.main.measure(l))) + 10), h = lines.length * 11 + 8;
    const x = clamp(p.x + 10, 2, W - w - 2), y = clamp(p.y + 12, 2, H - h - 2);
    UIK.panel(g, x, y, w, h, 'glass');
    lines.forEach((l, i) => drawText(g, l, x + 5, y + 5 + i * 11, { color: '#fffaf0', shadow: '#0a0718' }));
  },
};

/* ---------- Gráficos científicos pixel ---------- */
const Charts = {
  frame(g, x, y, w, h, bg = '#0a0f26') {
    frect(g, x, y, w, h, '#05030f'); frect(g, x + 1, y + 1, w - 2, h - 2, bg);
  },
  /** Gráfico de líneas. series: [{data:[...y] | [[x,y]..], color, area, dashed, label, step}] */
  line(g, x, y, w, h, series, o = {}) {
    this.frame(g, x, y, w, h, o.bg);
    const pl = o.padL ?? 22, pb = o.padB ?? 10, pt = o.padT ?? 4, pr = o.padR ?? 4;
    const cx = x + pl, cy = y + pt, cw = w - pl - pr, chh = h - pt - pb;
    const pts = series.map(s => s.data.map((d, i) => Array.isArray(d) ? d : [i, d]));
    let xMin = o.xMin, xMax = o.xMax, yMin = o.yMin, yMax = o.yMax;
    const all = pts.flat();
    if (xMin == null) xMin = Math.min(...all.map(p => p[0]));
    if (xMax == null) xMax = Math.max(...all.map(p => p[0]));
    if (yMin == null) yMin = Math.min(0, ...all.map(p => p[1]));
    if (yMax == null) yMax = Math.max(...all.map(p => p[1])) * 1.1 || 1;
    const X = (v) => Math.round(cx + (v - xMin) / (xMax - xMin || 1) * (cw - 1));
    const Y = (v) => Math.round(cy + chh - 1 - (clamp(v, yMin, yMax) - yMin) / (yMax - yMin || 1) * (chh - 1));
    // rejilla punteada
    const ny = o.yTicks ?? 4;
    for (let i = 0; i <= ny; i++) {
      const v = yMin + (yMax - yMin) * i / ny, yy = Y(v);
      for (let xx = cx; xx < cx + cw; xx += 3) fpx(g, xx, yy, '#1f2a5a');
      drawText(g, o.yFmt ? o.yFmt(v) : fmt(v, Math.abs(yMax - yMin) < 5 ? 1 : 0), cx - 3, yy - 2, { font: 'tiny', color: '#8a8fb8', align: 'right' });
    }
    const nx = o.xTicks ?? 6;
    for (let i = 0; i <= nx; i++) {
      const v = xMin + (xMax - xMin) * i / nx, xx = X(v);
      for (let yy = cy; yy < cy + chh; yy += 3) fpx(g, xx, yy, '#18224c');
      drawText(g, o.xFmt ? o.xFmt(v) : fmt(v, 0), xx, cy + chh + 2, { font: 'tiny', color: '#8a8fb8', align: 'center' });
    }
    // banda (incertidumbre / límite)
    if (o.bands) for (const b of o.bands) {
      if (b.y0 != null) { const y0 = Y(b.y1), y1 = Y(b.y0); fdither(g, cx, y0, cw, y1 - y0 + 1, b.color, b.level ?? 0.25); }
      if (b.x0 != null) { const x0 = X(b.x0), x1 = X(b.x1); fdither(g, x0, cy, x1 - x0 + 1, chh, b.color, b.level ?? 0.25); }
      if (b.lo && b.hi) { // banda por serie
        for (let i = 0; i < b.lo.length - 1; i++) {
          const xa = X(i), xb = X(i + 1);
          for (let xx = xa; xx <= xb; xx++) {
            const t = (xx - xa) / Math.max(1, xb - xa);
            const lo = lerp(b.lo[i], b.lo[i + 1], t), hi = lerp(b.hi[i], b.hi[i + 1], t);
            const ya = Y(hi), yb = Y(lo);
            fdither(g, xx, ya, 1, yb - ya + 1, b.color, b.level ?? 0.35);
          }
        }
      }
    }
    if (o.hlines) for (const hl of o.hlines) { const yy = Y(hl.v); for (let xx = cx; xx < cx + cw; xx += 2) fpx(g, xx, yy, hl.color); if (hl.label) drawText(g, hl.label, cx + cw - 2, yy - 7, { font: 'tiny', color: hl.color, align: 'right' }); }
    if (o.vlines) for (const vl of o.vlines) { const xx = X(vl.v); for (let yy = cy; yy < cy + chh; yy += 2) fpx(g, xx, yy, vl.color); if (vl.label) drawText(g, vl.label, xx + 2, cy + 1, { font: 'tiny', color: vl.color }); }
    // series
    series.forEach((s, si) => {
      const P = pts[si];
      if (s.area) {
        for (let i = 0; i < P.length - 1; i++) {
          const xa = X(P[i][0]), xb = X(P[i + 1][0]);
          for (let xx = xa; xx <= xb; xx++) {
            const t = (xx - xa) / Math.max(1, xb - xa);
            const yy = Y(s.step ? P[i][1] : lerp(P[i][1], P[i + 1][1], t));
            fdither(g, xx, yy, 1, Y(Math.max(yMin, 0)) - yy, s.color, s.areaLevel ?? 0.35);
          }
        }
      }
      for (let i = 0; i < P.length - 1; i++) {
        const xa = X(P[i][0]), ya = Y(P[i][1]), xb = X(P[i + 1][0]), yb = Y(P[i + 1][1]);
        if (s.step) { fline(g, xa, ya, xb, ya, s.color); fline(g, xb, ya, xb, yb, s.color); }
        else if (s.dashed) { if (i % 2 === 0) fline(g, xa, ya, xb, yb, s.color); }
        else fline(g, xa, ya, xb, yb, s.color);
      }
      if (s.dots) for (const p of P) frect(g, X(p[0]) - 1, Y(p[1]) - 1, 3, 3, s.color);
      if (P.length === 1) frect(g, X(P[0][0]) - 1, Y(P[0][1]) - 1, 3, 3, s.color);
    });
    if (o.cursor != null) { const xx = X(o.cursor); frect(g, xx, cy, 1, chh, '#fffaf0'); }
    if (o.xLabel) drawText(g, o.xLabel, x + w - 3, y + h - 8, { font: 'tiny', color: '#cfd6f0', align: 'right' });
    if (o.yLabel) drawText(g, o.yLabel, x + 3, y + 2, { font: 'tiny', color: '#cfd6f0' });
    if (o.legend) {
      let lx = cx + 4;
      for (const s of series) if (s.label) { frect(g, lx, cy + 3, 5, 3, s.color); drawText(g, s.label, lx + 7, cy + 2, { font: 'tiny', color: s.color }); lx += FONTS.tiny.measure(s.label) + 14; }
    }
    return { X, Y, cx, cy, cw, ch: chh };
  },
  bars(g, x, y, w, h, items, o = {}) {
    this.frame(g, x, y, w, h, o.bg);
    const max = o.max ?? Math.max(...items.map(i => i.v)) * 1.15;
    const n = items.length, bw = Math.floor((w - 8) / n);
    items.forEach((it, i) => {
      const bh = Math.round((h - 16) * clamp(it.v / max, 0, 1));
      const bx = x + 4 + i * bw, by = y + h - 10 - bh;
      frect(g, bx + 1, by, bw - 3, bh, it.color);
      frect(g, bx + 1, by, bw - 3, 1, shade(it.color, 0.3));
      frect(g, bx + bw - 3, by, 1, bh, shade(it.color, -0.3));
      if (it.label) drawText(g, it.label, bx + bw / 2 - 1, y + h - 8, { font: 'tiny', color: '#cfd6f0', align: 'center' });
      if (o.values) drawText(g, o.fmt ? o.fmt(it.v) : fmt(it.v, 0), bx + bw / 2 - 1, by - 7, { font: 'tiny', color: it.color, align: 'center' });
    });
    if (o.limit != null) { const ly = y + h - 10 - Math.round((h - 16) * o.limit / max); for (let xx = x + 2; xx < x + w - 2; xx += 2) fpx(g, xx, ly, '#ff4e5d'); }
  },
  /** Tanque con líquido animado (fracción 0..1) */
  tank(g, x, y, w, h, frac, ramp = RAMP.sea, label = null, o = {}) {
    frect(g, x, y, w, h, '#05030f');
    frect(g, x + 1, y + 1, w - 2, h - 2, '#141d36');
    const lh = Math.round((h - 4) * clamp(frac, 0, 1));
    const top = y + h - 2 - lh;
    for (let yy = 0; yy < lh; yy++) {
      const t = yy / Math.max(1, h);
      frect(g, x + 2, top + yy, w - 4, 1, rampDither(ramp, 0.75 - t * 0.6, x, top + yy));
    }
    if (lh > 1) {
      for (let xx = x + 2; xx < x + w - 2; xx++) {
        const wv = Math.round(Math.sin(Game.time * 3 + xx * 0.5) * 0.8);
        fpx(g, xx, top + wv, ramp[ramp.length - 2]);
      }
    }
    if (o.reserve != null) { const ry = y + h - 2 - Math.round((h - 4) * o.reserve); for (let xx = x + 1; xx < x + w - 1; xx += 2) fpx(g, xx, ry, '#ff4e5d'); }
    frect(g, x + 2, y + 2, 1, h - 4, 'rgba(255,255,255,0.25)');
    for (let i = 1; i < 4; i++) frect(g, x + w - 4, y + Math.round(h * i / 4), 2, 1, '#6aa0b4');
    if (label) drawText(g, label, x + w / 2, y + h + 2, { font: 'tiny', color: '#cfd6f0', align: 'center' });
  },
  /** Batería con módulos iluminados según SOC */
  battery(g, x, y, w, h, soc, reserve = 0, label = null) {
    frect(g, x + Math.round(w / 2) - 4, y - 3, 8, 3, '#6aa0b4');
    frect(g, x, y, w, h, '#05030f'); frect(g, x + 1, y + 1, w - 2, h - 2, '#141d36');
    const n = 10, mh = Math.floor((h - 4) / n);
    for (let i = 0; i < n; i++) {
      const lv = (i + 0.5) / n;
      const my = y + h - 2 - (i + 1) * mh;
      const on = soc >= lv;
      const col = !on ? '#1c2350' : soc < 0.2 ? '#ff4e5d' : soc < 0.4 ? '#ffb83e' : '#86e36f';
      frect(g, x + 2, my + 1, w - 4, mh - 1, col);
      if (on) frect(g, x + 2, my + 1, w - 4, 1, shade(col, 0.35));
    }
    if (reserve > 0) { const ry = y + h - 2 - Math.round((h - 4) * reserve); frect(g, x - 2, ry, w + 4, 1, '#ff4e5d'); }
    if (label) drawText(g, label, x + w / 2, y + h + 2, { font: 'tiny', color: '#cfd6f0', align: 'center' });
  },
  gauge(g, cx, cy, r, frac, col = '#56e5ff', label = null, valueText = null) {
    for (let a = 0; a <= 40; a++) {
      const t = a / 40, an = Math.PI * (0.8 + t * 1.4);
      const on = t <= frac;
      const c = on ? (t > 0.85 ? '#ff4e5d' : t > 0.65 ? '#ffb83e' : col) : '#1c2350';
      fpx(g, cx + Math.cos(an) * r, cy + Math.sin(an) * r, c);
      fpx(g, cx + Math.cos(an) * (r - 1), cy + Math.sin(an) * (r - 1), c);
      fpx(g, cx + Math.cos(an) * (r - 2), cy + Math.sin(an) * (r - 2), shade(c, -0.3));
    }
    const an = Math.PI * (0.8 + clamp(frac, 0, 1) * 1.4);
    fline(g, cx, cy, cx + Math.cos(an) * (r - 4), cy + Math.sin(an) * (r - 4), '#fffaf0');
    frect(g, cx - 1, cy - 1, 3, 3, '#fffaf0');
    if (valueText) drawText(g, valueText, cx, cy + 4, { font: 'tiny', color: '#fffaf0', align: 'center' });
    if (label) drawText(g, label, cx, cy + r * 0.55 + 6, { font: 'tiny', color: '#8a8fb8', align: 'center' });
  },
  /** Flecha de flujo animada (líquido, energía, H2, datos) entre puntos (estilo Sankey pixel) */
  flow(g, pts, kind, rate = 1, width = 3) {
    const K = FLOW_KINDS[kind] || FLOW_KINDS.water;
    const wdt = Math.max(1, Math.round(width));
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const len = dist(x0, y0, x1, y1);
      const horiz = Math.abs(x1 - x0) >= Math.abs(y1 - y0);
      for (let s = 0; s <= len; s++) {
        const t = s / Math.max(1, len);
        const px = Math.round(lerp(x0, x1, t)), py = Math.round(lerp(y0, y1, t));
        for (let k = -Math.floor(wdt / 2); k <= Math.floor((wdt - 1) / 2); k++) {
          const qx = horiz ? px : px + k, qy = horiz ? py + k : py;
          fpx(g, qx, qy, k === -Math.floor(wdt / 2) ? K.hi : k === Math.floor((wdt - 1) / 2) ? K.lo : K.mid);
        }
      }
      // pulsos animados
      if (rate > 0) {
        const spacing = K.spacing, off = (Game.time * K.speed * rate) % spacing;
        for (let s = off; s < len; s += spacing) {
          const t = s / Math.max(1, len);
          const px = Math.round(lerp(x0, x1, t)), py = Math.round(lerp(y0, y1, t));
          if (K.dot === 'bubble') { fpx(g, px, py - 1, K.pulse); fpx(g, px - 1, py, K.pulse); fpx(g, px + 1, py, K.pulse); fpx(g, px, py + 1, K.pulse); }
          else if (K.dot === 'spark') { fpx(g, px, py, '#ffffff'); fpx(g, px + (horiz ? -1 : 0), py + (horiz ? 0 : -1), K.pulse); }
          else frect(g, px - (horiz ? 1 : 0), py - (horiz ? 0 : 1), horiz ? 3 : 1, horiz ? 1 : 3, K.pulse);
        }
      }
    }
    const [ex, ey] = pts[pts.length - 1], [px0, py0] = pts[pts.length - 2];
    const dx = sign(ex - px0), dy = sign(ey - py0);
    for (let k = 0; k < 4; k++) {
      for (let j = -k; j <= k; j++) fpx(g, ex - dx * (4 - k) + (dy ? j : 0) + dx, ey - dy * (4 - k) + (dx ? j : 0) + dy, K.mid);
    }
  },
};
const FLOW_KINDS = {
  water: { hi: '#a6f4ff', mid: '#22bdd0', lo: '#106884', pulse: '#ffffff', speed: 30, spacing: 10, dot: 'dash' },
  seawater: { hi: '#6cf0db', mid: '#1283bf', lo: '#0d3168', pulse: '#c6fff2', speed: 24, spacing: 12, dot: 'dash' },
  permeate: { hi: '#e6fdff', mid: '#56e5ff', lo: '#1491aa', pulse: '#ffffff', speed: 32, spacing: 9, dot: 'dash' },
  brine: { hi: '#f888b8', mid: '#bc3e92', lo: '#621a66', pulse: '#ffc4dc', speed: 18, spacing: 14, dot: 'dash' },
  power: { hi: '#fff08a', mid: '#ffd84a', lo: '#c8861a', pulse: '#ffffff', speed: 70, spacing: 16, dot: 'spark' },
  h2: { hi: '#d8fff8', mid: '#40d0d4', lo: '#16768c', pulse: '#ffffff', speed: 22, spacing: 12, dot: 'bubble' },
  data: { hi: '#dcd0ff', mid: '#8d6bff', lo: '#3f2690', pulse: '#ffffff', speed: 40, spacing: 11, dot: 'dash' },
  irrigation: { hi: '#c2f58e', mid: '#33a552', lo: '#156647', pulse: '#e6fdff', speed: 20, spacing: 10, dot: 'dash' },
  heat: { hi: '#ffe878', mid: '#ff7a2a', lo: '#a82418', pulse: '#ffffff', speed: 30, spacing: 12, dot: 'dash' },
};
