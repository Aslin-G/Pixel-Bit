/* =====================================================================
   06_ui.js — Kit de interfaz pixel: paneles, iconos procedurales,
   GUI inmediata con navegación por teclado, y gráficos científicos.
   ===================================================================== */

/* ---------- Paneles (STYLE LOCK §11) ----------
   Capas de fuera a dentro: tinta 1 px · bisel claro 1 px (arriba/izquierda hi, abajo/derecha lo) ·
   medio 1 px · relleno plano en dos bandas (42 % superior más claro) · línea interior (paneles grandes) ·
   chaflanes 2–3 px · destellos de esquina. Sin tramado ni sombras tramadas. Los marcos se prerenderizan
   en lienzos (caché LRU) y se dibujan con un solo drawImage. */
const UI_INK = {
  body: '#e2ebfc', head: '#e6f8fe', dim: '#93a6c8', off: '#4f5f7f', ink: '#000633',
  key: '#f5dc5a', key2: '#f5a576', good: '#3fe0a0', bad: '#ff8a7a', gold: '#ffd23a', cyan: '#8fdfff',
};
const PANEL_STYLES = {
  tech: { ink: '#000633', hi: '#a8c8ff', lo: '#6d9be8', mid: '#3a64b0', fill: ['#072248', '#041533'], key: '#12305a', spark: '#7fb8ff', text: '#e2ebfc', title: '#e6f8fe', dim: '#93a6c8', well: '#020e26' },
  hud: { ink: '#000633', hi: '#b8d4ff', lo: '#7bacfb', mid: '#3a64b0', fill: ['#082650', '#051a3a'], key: '#12305a', spark: '#e8f6ff', text: '#e2ebfc', title: '#edfcfe', dim: '#93a6c8', well: '#051a36' },
  green: { ink: '#00140c', hi: '#7fe6bb', lo: '#4cc796', mid: '#1f8a5c', fill: ['#0b513b', '#073d2e'], key: '#0f5a40', spark: '#c2f5de', text: '#eafff6', title: '#eafff6', dim: '#9fd8bf', well: '#052a20' },
  alert: { ink: '#1a0010', hi: '#ff9a8a', lo: '#e06a6a', mid: '#a8243c', fill: ['#3a0c1c', '#2a0814'], key: '#4a1426', spark: '#ffc6b4', text: '#ffe8e4', title: '#fff0ec', dim: '#e0a8a0', well: '#1e0610' },
  mirage: { ink: '#12001e', hi: '#f6a8f0', lo: '#d070d0', mid: '#8a2c9c', fill: ['#24093e', '#170628'], key: '#3a1250', spark: '#56e5ff', text: '#f6e6fa', title: '#fff0fc', dim: '#c8a0d8', well: '#10041e' },
  limen: { ink: '#001018', hi: '#c8f8ff', lo: '#7ee8f0', mid: '#2f9ab8', fill: ['#06283a', '#041c2a'], key: '#0f3a50', spark: '#ffffff', text: '#e6fbff', title: '#f0feff', dim: '#9cc8d4', well: '#031420' },
  mosaic: { ink: '#00140a', hi: '#d2f5a0', lo: '#86e36f', mid: '#3a8a3a', fill: ['#0c2a1c', '#081e14'], key: '#16402a', spark: '#ffe14d', text: '#eefce0', title: '#f6ffe8', dim: '#a8c89a', well: '#061810' },
  violet: { ink: '#0a0026', hi: '#b49cff', lo: '#977ccb', mid: '#5a44a8', fill: ['#0b0a2e', '#08082a'], key: '#1a1650', spark: '#dcd0ff', text: '#ece6ff', title: '#f4f0ff', dim: '#a89cc8', well: '#06061e' },
  gold: { ink: '#1a0f00', hi: '#ffe58a', lo: '#e0b440', mid: '#9a6a12', fill: ['#3a2a08', '#2a1e06'], key: '#4a3a12', spark: '#fff6d8', text: '#fff6e0', title: '#fffaf0', dim: '#d8c08a', well: '#1e1404' },
  paper: { ink: '#1f0803', hi: '#c08a5c', lo: '#9f6f4d', mid: '#74381c', fill: ['#f6e6cc', '#ecd6b0'], key: '#d8b88a', spark: '#fff6d8', text: '#3a1a10', title: '#3a1a10', dim: '#7a5a40', well: '#e8d0a8' },
  sheet: { ink: '#000633', hi: '#8fdfff', lo: '#5ab0d8', mid: '#1e5a8a', fill: ['#061a36', '#04142c'], key: '#12305a', spark: '#c4fbff', text: '#d9eefc', title: '#e6f8fe', dim: '#93a6c8', well: '#020e26' },
  hc: { ink: '#000000', hi: '#ffffff', lo: '#ffffff', mid: '#000000', fill: ['#000820', '#000820'], key: '#3a3a3a', spark: null, text: '#ffffff', title: '#ffffff', dim: '#d0d0d0', well: '#000000' },
};
// alias de compatibilidad: una sola familia navy (los acentos de color quedan para estados semánticos)
PANEL_STYLES.glass = PANEL_STYLES.tech;
PANEL_STYLES.dialog = PANEL_STYLES.tech;
PANEL_STYLES.toast = PANEL_STYLES.hud;
function panelStyle(style) {
  if (typeof Game !== 'undefined' && Game.settings && Game.settings.highContrast && style !== 'paper') return PANEL_STYLES.hc;
  return PANEL_STYLES[style] || PANEL_STYLES.tech;
}
/** Rectángulo con chaflanes independientes (tl,tr,bl,br); j0..j1 limita las filas dibujadas */
function chamRect(g, x, y, w, h, tl, tr, bl, br, col, j0 = 0, j1 = h) {
  if (w <= 0 || h <= 0) return;
  g.fillStyle = col;
  const top = Math.max(tl, tr), bot = Math.max(bl, br);
  for (let j = Math.max(0, j0); j < Math.min(h, j1); j++) {
    if (j >= top && j < h - bot) { const je = Math.min(h - bot, j1); g.fillRect(x, y + j, w, je - j); j = je - 1; continue; }
    const l = Math.max(tl - j, bl - (h - 1 - j), 0), r = Math.max(tr - j, br - (h - 1 - j), 0);
    if (w - l - r > 0) g.fillRect(x + l, y + j, w - l - r, 1);
  }
}
const _panelCache = new Map();
function _cacheGet(map, k, make, cap = 260) {
  let c = map.get(k);
  if (c) { if (map.size > cap * 0.7) { map.delete(k); map.set(k, c); } return c; }
  c = make(); map.set(k, c);
  if (map.size > cap) map.delete(map.keys().next().value);
  return c;
}
const UIK = {
  /** Dibuja el marco completo en g (sin caché). o: chamfer, cbr (inferior derecho), key, spark, tl/tr/bl */
  drawFrame(g, x, y, w, h, s, accent, o = {}) {
    const c = o.chamfer ?? (w >= 48 && h >= 30 ? 3 : 2);
    const tl = o.tl ?? c, tr = o.tr ?? c, bl = o.bl ?? c, br = o.cbr ?? c;
    const hi = accent || s.hi, lo = accent ? shade(accent, -0.2) : s.lo, mid = accent ? mixHex(s.mid, accent, 0.35) : s.mid;
    const d = (v, k) => Math.max(0, v - k);
    chamRect(g, x, y, w, h, tl, tr, bl, br, s.ink);
    chamRect(g, x + 1, y + 1, w - 2, h - 2, tl, tr, bl, br, hi);
    chamRect(g, x + 2, y + 2, w - 3, h - 3, tl, tr, bl, br, lo);
    chamRect(g, x + 2, y + 2, w - 4, h - 4, d(tl, 1), d(tr, 1), d(bl, 1), d(br, 1), mid);
    const fx = x + 3, fy = y + 3, fw = w - 6, fh = h - 6;
    const split = Math.max(1, Math.round(fh * (o.split ?? 0.42)));
    chamRect(g, fx, fy, fw, fh, d(tl, 2), d(tr, 2), d(bl, 2), d(br, 2), s.fill[1]);
    if (s.fill[0] !== s.fill[1]) chamRect(g, fx, fy, fw, fh, d(tl, 2), d(tr, 2), d(bl, 2), d(br, 2), s.fill[0], 0, split);
    const key = o.key ?? (w >= 96 && h >= 48);
    if (key && s.key) {
      const k = 5;
      frect(g, x + k + 2, y + k, w - 2 * k - 4, 1, s.key); frect(g, x + k + 2, y + h - k - 1, w - 2 * k - 4, 1, s.key);
      frect(g, x + k, y + k + 2, 1, h - 2 * k - 4, s.key); frect(g, x + w - k - 1, y + k + 2, 1, h - 2 * k - 4, s.key);
    }
    const sp = o.spark ?? (w > 34 && h > 16);
    if (sp && s.spark) {
      fpx(g, x + w - 6 - tr, y + 4, s.spark); fpx(g, x + w - 5 - tr, y + 5, '#e8f6ff'); fpx(g, x + w - 4 - tr, y + 4, s.spark);
      if (h > 22) { fpx(g, x + w - 7 - br, y + h - 4, s.spark); fpx(g, x + w - 4, y + h - 6 - br, '#e8f6ff'); fpx(g, x + w - 5 - br, y + h - 5, s.spark); }
    }
  },
  /** Panel navy con bisel (misma firma que antes; opts opcional como 8.º parámetro) */
  panel(g, x, y, w, h, style = 'tech', accent = null, o = {}) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    if (w < 4 || h < 4) return;
    const s = panelStyle(style);
    const k = (s === PANEL_STYLES.hc ? 'hc' : style) + '|' + w + '|' + h + '|' + (accent || '') + '|' + (o.chamfer ?? '') + '|' + (o.cbr ?? '') + '|' + (o.tl ?? '') + (o.tr ?? '') + (o.bl ?? '') + '|' + (o.key ?? '') + '|' + (o.spark ?? '') + '|' + (o.split ?? '');
    const c = _cacheGet(_panelCache, k, () => { const cc = makeCanvas(w, h); cc.g.imageSmoothingEnabled = false; UIK.drawFrame(cc.g, 0, 0, w, h, s, accent, o); return cc; });
    if (o.alpha != null && o.alpha < 1) { g.globalAlpha = o.alpha; g.drawImage(c, x, y); g.globalAlpha = 1; }
    else g.drawImage(c, x, y);
  },
  /** Cabecera: insignia de icono que desborda la esquina, título en negrita y divisor (contenido desde y+22) */
  header(g, x, y, w, title, style = 'tech', icon = null) {
    const s = panelStyle(style);
    x = Math.round(x); y = Math.round(y);
    let tx = x + 9;
    if (icon) { UIK.badge(g, icon, x - 3, y - 3, 22, style); tx = x + 26; }
    const maxW = w - (tx - x) - 10;
    drawText(g, fitText(title, maxW, 'bold'), tx, y + 7, { font: 'bold', color: s.title });
    const dx = icon ? x + 22 : x + 6;
    frect(g, dx, y + 18, x + w - 6 - dx, 1, s.key); frect(g, dx, y + 19, x + w - 6 - dx, 1, mixHex(s.mid, s.fill[1], 0.55));
  },
  /** Marco de retrato: panel con chaflán 3 y ventana interior con tinta (el contenido se dibuja encima) */
  frame(g, x, y, w, h, style = 'tech', o = {}) {
    UIK.panel(g, x, y, w, h, style, o.accent || null, { chamfer: o.chamfer ?? 3, key: false, spark: o.spark ?? false });
    const s = panelStyle(style);
    frect(g, x + 3, y + 3, w - 6, h - 6, s.ink);
    frect(g, x + 4, y + 4, w - 8, h - 8, o.bg || s.well);
  },
  /** Insignia octogonal (icono grande 22 px; si no existe, icono de 12 px centrado) */
  badge(g, icon, x, y, size = 22, style = 'tech', o = {}) {
    x = Math.round(x); y = Math.round(y);
    const s = panelStyle(style);
    const k = 'badge|' + icon + '|' + size + '|' + (s === PANEL_STYLES.hc ? 'hc' : style) + '|' + (o.rim || '');
    const c = _cacheGet(_panelCache, k, () => {
      const cc = makeCanvas(size, size); const b = cc.g;
      const ch = size >= 20 ? 5 : size >= 16 ? 4 : 3;
      chamRect(b, 0, 0, size, size, ch, ch, ch, ch, s.ink);
      chamRect(b, 1, 1, size - 2, size - 2, ch, ch, ch, ch, o.rim || '#d2efff');
      chamRect(b, 2, 2, size - 3, size - 3, ch, ch, ch, ch, o.rim ? shade(o.rim, -0.25) : s.lo);
      chamRect(b, 2, 2, size - 4, size - 4, ch - 1, ch - 1, ch - 1, ch - 1, s.ink);
      chamRect(b, 3, 3, size - 6, size - 6, ch - 2, ch - 2, ch - 2, ch - 2, o.bg || '#06183a');
      chamRect(b, 3, 3, size - 6, Math.round((size - 6) * 0.45), ch - 2, ch - 2, 0, 0, o.bg ? shade(o.bg, 0.08) : '#0a2450');
      if (size >= 20 && Icons.hasBig(icon) && Icons.mid) b.drawImage(Icons.mid(icon), Math.round(size / 2 - 9), Math.round(size / 2 - 9));
      else b.drawImage(Icons.get(icon), Math.round(size / 2 - 7), Math.round(size / 2 - 7));
      return cc;
    });
    g.drawImage(c, x, y);
  },
  /** Barra con tinta, pista teñida, brillo superior, sombra inferior y extremos redondeados */
  bar(g, x, y, w, h, frac, col, bg = null, segs = 0) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    const ink = '#000633';
    const track = (!bg || bg === '#0a0c22') ? mixHex('#0b2444', col, 0.12) : bg;
    frect(g, x + 1, y, w - 2, h, ink); frect(g, x, y + 1, w, h - 2, ink);
    frect(g, x + 1, y + 1, w - 2, h - 2, track);
    const fw = Math.round((w - 2) * clamp(frac, 0, 1));
    if (fw > 0) {
      frect(g, x + 1, y + 1, fw, h - 2, col);
      if (h >= 4) { frect(g, x + 1, y + 1, fw, 1, mixHex(col, '#ffffff', 0.45)); frect(g, x + 1, y + h - 2, fw, 1, shade(col, -0.25)); }
      if (fw >= 2 && h >= 4) { fpx(g, x + 1, y + 1, mixHex(col, ink, 0.4)); fpx(g, x + 1, y + h - 2, mixHex(col, ink, 0.5)); }
    }
    if (segs) for (let i = 1; i < segs; i++) frect(g, x + 1 + Math.round(i * (w - 2) / segs), y + 1, 1, h - 2, 'rgba(0,6,51,0.55)');
  },
};
/** Recorta un texto con «…» para que quepa en maxW */
function fitText(text, maxW, font = 'main') {
  const f = FONTS[font];
  if (f.measure(text) <= maxW) return text;
  let s = stripMarkup(text);
  while (s.length > 1 && f.measure(s + '…') > maxW) s = s.slice(0, -1);
  return s.trimEnd() + '…';
}

/* ---------- Iconos procedurales 12x12 (contorno selectivo de color) ---------- */
const Icons = {
  cache: new Map(),
  defs: {},
  bigDefs: {},
  def(name, fn) { this.defs[name] = fn; },
  /** Icono grande 22×22 (lienzo 24×24 con contorno); ver 06c_ui_widgets.js */
  defBig(name, fn) { this.bigDefs[name] = fn; },
  hasBig(name) { return !!this.bigDefs[name]; },
  big(name) {
    const k = 'BIG|' + name;
    let c = this.cache.get(k);
    if (c) return c;
    const fn = this.bigDefs[name];
    if (!fn) return this.get(name, 2);
    const pb = new PixelBuffer(24, 24);
    fn(pb);
    pb.outline(n => darkOf(n, -0.66));
    c = pb.toCanvas();
    this.cache.set(k, c);
    return c;
  },
  get(name, scale = 1) {
    const k = name + '@' + scale;
    let c = this.cache.get(k);
    if (c) return c;
    const fn = this.defs[name] || this.defs.info;
    const pb = new PixelBuffer(14, 14);
    fn(pb);
    // contorno selectivo: cada borde toma un tono muy oscuro de su propio color (no un negro único)
    pb.outline(n => darkOf(n, -0.62));
    c = pb.toCanvas();
    if (scale !== 1) { const s = makeCanvas(14 * scale, 14 * scale); s.g.imageSmoothingEnabled = false; s.g.drawImage(c, 0, 0, 14 * scale, 14 * scale); c = s; }
    this.cache.set(k, c);
    return c;
  },
  draw(g, name, x, y, scale = 1) { g.drawImage(this.get(name, scale), Math.round(x - scale), Math.round(y - scale)); },
  /** Icono grande centrado en (cx,cy) */
  drawBig(g, name, cx, cy) { const c = this.big(name); g.drawImage(c, Math.round(cx - c.width / 2), Math.round(cy - c.height / 2)); },
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
// paletas de botón: relleno superior / inferior / borde / tinta / texto (sin tramado; 2 bandas planas)
const BTN_STYLES = {
  primary: { top: '#0b2a5a', bot: '#082048', rim: '#8fb4ff', ink: '#000633', text: '#e6f0ff' },
  ghost: { top: '#061a38', bot: '#041530', rim: '#3a5a8a', ink: '#000633', text: '#b8c8e8' },
  good: { top: '#0e6e57', bot: '#0a5646', rim: '#3fe0a0', ink: '#00140c', text: '#eafff6' },
  gold: { top: '#6a4a0e', bot: '#553a08', rim: '#ffd23a', ink: '#1a0f00', text: '#fff6d8' },
  danger: { top: '#5a1424', bot: '#46101c', rim: '#ff8a7a', ink: '#1a0010', text: '#ffe8e4' },
  choice: { top: '#0b1c3a', bot: '#081530', rim: '#6d8fd0', ink: '#000633', text: '#e6f0ff' },
  tab: { top: '#061a38', bot: '#041530', rim: '#3a5a8a', ink: '#000633', text: '#b8c8e8' },
  paper: { top: '#f6e6cc', bot: '#ecd6b0', rim: '#74381c', ink: '#1f0803', text: '#3a1a10' },
};
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
  /** Botón. opts: icon, style('primary'|'ghost'|'danger'|'choice'|'tab'|'good'|'gold'|'paper'), disabled, selected, tip, key */
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
    else if (focused) { const c = '#e8f6ff'; frect(g, x, y, w, 1, c); frect(g, x, y + h - 1, w, 1, c); frect(g, x, y, 1, h, c); frect(g, x + w - 1, y, 1, h, c); }
    if (clicked) { Audio2.sfx(opts.sfx || 'ui'); Input.consumePointer(); }
    return clicked;
  },
  /** Botón solo de puntero: no entra en la navegación por teclado (atajos que ya tienen tecla propia, tarjetas) */
  pbutton(g, id, x, y, w, h, label, opts = {}) {
    const p = Input.pointer;
    const over = p.x >= x && p.x < x + w && p.y >= y && p.y < y + h;
    let clicked = false;
    if (!opts.disabled) {
      if (over && p.pressed) this.active = id;
      if (this.active === id && p.released) { if (over) clicked = true; this.active = null; }
    }
    if (over && opts.tip) this.tooltip = opts.tip;
    if (!opts.noDraw) this.drawButton(g, x, y, w, h, label, Object.assign({}, opts, { focused: over, pressed: this.active === id && over }));
    else if (over) { const c = '#e8f6ff'; frect(g, x, y, w, 1, c); frect(g, x, y + h - 1, w, 1, c); frect(g, x, y, 1, h, c); frect(g, x + w - 1, y, 1, h, c); }
    if (clicked) { Audio2.sfx(opts.sfx || 'ui'); Input.consumePointer(); }
    return clicked;
  },
  drawButton(g, x, y, w, h, label, o) {
    const st = o.style || 'primary';
    const P = BTN_STYLES[st] || BTN_STYLES.primary;
    let top = P.top, bot = P.bot, rim = P.rim, ink = P.ink, tcol = o.textColor || P.text;
    if (o.selected && st !== 'tab') { top = shade(top, 0.14); bot = shade(bot, 0.1); rim = st === 'gold' ? '#fff2a0' : '#ffd23a'; }
    if (o.selected && st === 'tab') { top = '#0b2a5a'; bot = '#082048'; rim = '#8fb4ff'; tcol = '#fff6d8'; }
    if (o.focused && !o.disabled) rim = st === 'paper' ? '#3a1a10' : '#e8f6ff';
    if (o.disabled) { top = '#0a1222'; bot = '#081020'; rim = '#24324a'; tcol = '#4f5f7f'; ink = '#000633'; }
    const dy = o.pressed ? 1 : 0;
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    if (!o.pressed) frect(g, x + 1, y + h, w - 2, 1, 'rgba(0,6,51,0.55)');
    frect(g, x + 1, y + dy, w - 2, h, ink); frect(g, x, y + 1 + dy, w, h - 2, ink);
    frect(g, x + 1, y + 1 + dy, w - 2, h - 2, rim);
    frect(g, x + 2, y + 2 + dy, w - 4, h - 4, bot);
    frect(g, x + 2, y + 2 + dy, w - 4, Math.max(1, Math.round((h - 4) * 0.45)), top);
    if (h >= 14) frect(g, x + 3, y + 2 + dy, w - 6, 1, mixHex(top, rim, 0.35));
    if (o.selected && st === 'tab') frect(g, x + 3, y + h - 4 + dy, w - 6, 2, '#ffd23a');
    if (o.focused && !o.disabled && ((Game.frame >> 4) & 1)) { const cy = y + Math.round(h / 2) + dy; fpx(g, x - 2, cy, rim); fpx(g, x - 3, cy - 1, rim); fpx(g, x - 3, cy + 1, rim); fpx(g, x - 4, cy - 2, rim); fpx(g, x - 4, cy + 2, rim); }
    const ty = y + Math.round(h / 2) - 4 + dy;
    const font = o.bold ? 'bold' : 'main';
    if (o.icon) {
      const room = w - 26;
      const lbl = label ? fitText(label, room, font) : '';
      const lw = lbl ? FONTS[font].measure(lbl) : 0;
      const total = 13 + (lbl ? lw + 3 : 0);
      const ix = o.align === 'left' ? x + 5 : Math.round(x + w / 2 - total / 2);
      Icons.draw(g, o.icon, ix, y + Math.round(h / 2) - 6 + dy);
      if (lbl) drawText(g, lbl, ix + 15, ty, { color: tcol, font });
    } else if (label) {
      const lbl = fitText(label, w - 8, font);
      if (o.align === 'left') drawText(g, lbl, x + 6, ty, { color: tcol, font });
      else drawText(g, lbl, x + w / 2, ty, { color: tcol, align: 'center', font });
    }
    if (o.key) drawText(g, o.key, x + w - 4, y + 3 + dy, { font: 'tiny', color: rim, align: 'right' });
  },
  /** Fila de opción de la referencia (respuestas A–D): caja de letra separada + fila; estado correcto en verde */
  choice(g, id, x, y, w, label, letter, opts = {}) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w);
    const lw = 15, gap = 3, rx = x + lw + gap, rw = w - lw - gap;
    const lines = wrapText(label, rw - 14);
    const h = Math.max(15, lines.length * 11 + 4);
    const over = this._reg(id, x, y, w, h, 'button');
    const p = Input.pointer;
    let clicked = false;
    if (!opts.disabled) {
      if (over && p.pressed) this.active = id;
      if (this.active === id && p.released) { if (over) clicked = true; this.active = null; }
      if (this.focus === id && Input.pressed('confirm') && this.wasShown(id)) clicked = true;
    }
    const focused = !opts.disabled && (this.isFocused(id) || (over && !this.keyNav));
    const st = opts.state; // 'correct' | 'wrong' | 'selected' | 'dim'
    let R = { ink: '#000633', rim: '#2b3b5d', inner: '#031632', fill: '#031632', text: '#ceddf8' };
    let L = { ink: '#000633', rim: '#9fb0ca', fill: '#05122d', text: '#ebfaff' };
    if (focused) { R.rim = '#6d9be8'; R.fill = '#06204a'; R.inner = '#082652'; L.rim = '#d2efff'; }
    if (st === 'selected') { R = { ink: '#1a0f00', rim: '#ffd23a', inner: '#0b2450', fill: '#0b2450', text: '#fff6d8' }; L = { ink: '#1a0f00', rim: '#ffd23a', fill: '#ffd23a', text: '#1a0f00' }; }
    if (st === 'correct') { R = { ink: '#00140c', rim: '#3fe0a0', inner: '#0f9e6e', fill: '#056050', text: '#eafff6' }; L = { ink: '#00140c', rim: '#2ed899', fill: '#0a5a44', text: '#eafff6' }; }
    if (st === 'wrong') { R = { ink: '#1a0010', rim: '#ff6b6b', inner: '#5a1424', fill: '#3a0c1c', text: '#ffe8e4' }; L = { ink: '#1a0010', rim: '#ff9a8a', fill: '#3a0c1c', text: '#ffe8e4' }; }
    if (st === 'dim') { R = { ink: '#000633', rim: '#16243e', inner: '#020e26', fill: '#020e26', text: '#4f5f7f' }; L = { ink: '#000633', rim: '#24324a', fill: '#020e26', text: '#4f5f7f' }; }
    // caja de letra
    frect(g, x + 1, y, lw - 2, h, L.ink); frect(g, x, y + 1, lw, h - 2, L.ink);
    frect(g, x + 1, y + 1, lw - 2, h - 2, L.rim); frect(g, x + 2, y + 2, lw - 4, h - 4, L.fill);
    drawText(g, letter, x + Math.round(lw / 2) - Math.round(FONTS.bold.measure(letter) / 2), y + Math.round(h / 2) - 3, { font: 'bold', color: L.text });
    // fila
    frect(g, rx + 1, y, rw - 2, h, R.ink); frect(g, rx, y + 1, rw, h - 2, R.ink);
    frect(g, rx + 1, y + 1, rw - 2, h - 2, R.rim); frect(g, rx + 2, y + 2, rw - 4, h - 4, R.inner);
    if (R.inner !== R.fill) frect(g, rx + 3, y + 3, rw - 6, h - 6, R.fill);
    if (st === 'correct') { frect(g, rx + 3, y + 3, rw - 6, Math.max(1, Math.round((h - 6) * 0.45)), '#0a6e58'); }
    lines.forEach((ln, i) => drawText(g, ln, rx + 6, y + 4 + i * 11, { color: R.text }));
    if (st === 'correct') Icons.draw(g, 'check', rx + rw - 16, y + Math.round(h / 2) - 6);
    if (st === 'wrong') Icons.draw(g, 'cross', rx + rw - 16, y + Math.round(h / 2) - 6);
    if (focused && st !== 'correct' && st !== 'wrong' && ((Game.frame >> 4) & 1)) { const cy = y + Math.round(h / 2); fpx(g, x - 2, cy, '#e8f6ff'); fpx(g, x - 3, cy - 1, '#e8f6ff'); fpx(g, x - 3, cy + 1, '#e8f6ff'); }
    if (clicked) Audio2.sfx('ui');
    return { clicked, h };
  },
  /** Deslizador. Retorna nuevo valor. opts: label, unit, fmt(v), color, disabled, marks:[{v,col,label,zone}] */
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
    const col = opts.disabled ? '#4f5f7f' : (opts.color || '#56e5ff');
    // etiqueta y valor
    if (opts.label) drawText(g, opts.label, x, y + 1, { color: focused ? '#e6f8fe' : UI_INK.dim });
    const vs = (opts.fmt ? opts.fmt(v) : fmt(v, step < 1 ? (step < 0.1 ? 2 : 1) : 0)) + (opts.unit ? ' ' + opts.unit : '');
    drawText(g, vs, x + w, y + 1, { color: col, align: 'right' });
    // pista: pozo hundido de 5 px
    frect(g, tx0 - 1, ty - 1, tw + 2, 5, '#000633');
    frect(g, tx0, ty, tw, 3, '#020e26'); frect(g, tx0, ty + 2, tw, 1, '#163a6a');
    const f = (v - min) / (max - min);
    const fw = Math.round(tw * f);
    if (fw > 0) { frect(g, tx0, ty, fw, 3, col); frect(g, tx0, ty, fw, 1, mixHex(col, '#ffffff', 0.45)); frect(g, tx0, ty + 2, fw, 1, shade(col, -0.25)); }
    if (opts.marks) for (const m of opts.marks) {
      const mx = Math.round(tx0 + tw * (m.v - min) / (max - min));
      if (m.zone) { g.globalAlpha = 0.28; frect(g, mx, ty - 2, Math.round(tw * (m.zone - m.v) / (max - min)), 7, m.col || '#ff4e5d'); g.globalAlpha = 1; }
      frect(g, mx, ty - 3, 1, 9, m.col || '#ff4e5d');
    }
    const kx = Math.round(tx0 + tw * f);
    frect(g, kx - 3, ty - 4, 7, 11, '#000633');
    frect(g, kx - 2, ty - 3, 5, 9, focused ? '#e8f6ff' : '#d2efff');
    frect(g, kx - 2, ty - 1, 5, 5, focused ? col : '#8fb4ff');
    frect(g, kx - 2, ty + 4, 5, 2, '#3a64b0');
    fpx(g, kx, ty + 1, '#000633');
    if (opts.tip && over) this.tooltip = opts.tip;
    return v;
  },
  /** Interruptor: color, posición y palabra (SÍ/NO) llevan el estado */
  toggle(g, id, x, y, label, on, opts = {}) {
    const w = opts.w || (FONTS.main.measure(label) + 30), h = 14;
    const over = this._reg(id, x, y, w, h, 'button');
    const p = Input.pointer;
    let changed = false;
    if (over && p.pressed) this.active = id;
    if (this.active === id && p.released) { if (over) changed = true; this.active = null; }
    if (this.focus === id && Input.pressed('confirm') && this.wasShown(id)) changed = true;
    const focused = this.isFocused(id) || (over && !this.keyNav);
    const rim = focused ? '#e8f6ff' : on ? '#3fe0a0' : '#3a5a8a';
    frect(g, x + 1, y + 2, 20, 10, '#000633'); frect(g, x, y + 3, 22, 8, '#000633');
    frect(g, x + 1, y + 3, 20, 8, rim);
    frect(g, x + 2, y + 4, 18, 6, on ? '#0e6e57' : '#0b1c3a');
    if (on) { frect(g, x + 12, y + 4, 8, 6, '#c2f5de'); frect(g, x + 12, y + 9, 8, 1, '#7fe6bb'); drawText(g, 'SÍ', x + 3, y + 4, { font: 'tiny', color: '#eafff6' }); }
    else { frect(g, x + 2, y + 4, 8, 6, '#8a97b8'); frect(g, x + 2, y + 9, 8, 1, '#5a6a8a'); drawText(g, 'NO', x + 12, y + 4, { font: 'tiny', color: '#93a6c8' }); }
    drawText(g, label, x + 27, y + 3, { color: focused ? '#ffe58a' : UI_INK.body });
    if (changed) Audio2.sfx('ui');
    return changed ? !on : on;
  },
  renderTooltip(g) {
    if (!this.tooltip) return;
    const p = Input.pointer;
    const lines = wrapText(this.tooltip, 180);
    const w = Math.min(196, Math.max(...lines.map(l => FONTS.main.measure(l))) + 14), h = lines.length * 11 + 10;
    const x = clamp(p.x + 10, 2, W - w - 2), y = clamp(p.y + 12, 2, H - h - 2);
    UIK.panel(g, x, y, w, h, 'tech', null, { chamfer: 2, key: false, spark: false });
    lines.forEach((l, i) => drawText(g, l, x + 7, y + 5 + i * 11, { color: UI_INK.body }));
  },
};

/* ---------- Gráficos científicos pixel ---------- */
const Charts = {
  /** Pozo hundido: tinta, relleno oscuro, fila superior en sombra y borde inferior/derecho iluminado */
  frame(g, x, y, w, h, bg = '#020e26') {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    if (bg === '#0a0f26' || bg === '#1a1838') bg = '#020e26';
    frect(g, x, y, w, h, '#000633'); frect(g, x + 1, y + 1, w - 2, h - 2, bg);
    frect(g, x + 1, y + 1, w - 2, 1, '#00081c'); frect(g, x + 1, y + h - 2, w - 2, 1, '#163a6a'); frect(g, x + w - 2, y + 2, 1, h - 3, '#163a6a');
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
      for (let xx = cx; xx < cx + cw; xx += 3) fpx(g, xx, yy, '#12305a');
      drawText(g, o.yFmt ? o.yFmt(v) : fmt(v, Math.abs(yMax - yMin) < 5 ? 1 : 0), cx - 3, yy - 2, { font: 'tiny', color: '#93a6c8', align: 'right' });
    }
    const nx = o.xTicks ?? 6;
    for (let i = 0; i <= nx; i++) {
      const v = xMin + (xMax - xMin) * i / nx, xx = X(v);
      for (let yy = cy; yy < cy + chh; yy += 3) fpx(g, xx, yy, '#0e2850');
      drawText(g, o.xFmt ? o.xFmt(v) : fmt(v, 0), xx, cy + chh + 2, { font: 'tiny', color: '#93a6c8', align: 'center' });
    }
    // banda (incertidumbre / límite)
    if (o.bands) for (const b of o.bands) {
      g.globalAlpha = clamp((b.level ?? 0.25) * 0.8, 0.08, 0.6);
      if (b.y0 != null) { const y0 = Y(b.y1), y1 = Y(b.y0); frect(g, cx, y0, cw, y1 - y0 + 1, b.color); }
      if (b.x0 != null) { const x0 = X(b.x0), x1 = X(b.x1); frect(g, x0, cy, x1 - x0 + 1, chh, b.color); }
      g.globalAlpha = 1;
      if (b.lo && b.hi) { // banda por serie
        for (let i = 0; i < b.lo.length - 1; i++) {
          const xa = X(i), xb = X(i + 1);
          for (let xx = xa; xx <= xb; xx++) {
            const t = (xx - xa) / Math.max(1, xb - xa);
            const lo = lerp(b.lo[i], b.lo[i + 1], t), hi = lerp(b.hi[i], b.hi[i + 1], t);
            const ya = Y(hi), yb = Y(lo);
            g.globalAlpha = clamp((b.level ?? 0.35) * 0.8, 0.08, 0.6); frect(g, xx, ya, 1, yb - ya + 1, b.color); g.globalAlpha = 1;
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
            g.globalAlpha = clamp((s.areaLevel ?? 0.35) * 0.75, 0.08, 0.6); frect(g, xx, yy, 1, Y(Math.max(yMin, 0)) - yy, s.color); g.globalAlpha = 1;
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
    if (o.cursor != null) { const xx = X(o.cursor); frect(g, xx, cy, 1, chh, '#e8f6ff'); }
    if (o.xLabel) drawText(g, o.xLabel, x + w - 3, y + h - 8, { font: 'tiny', color: '#b8c8e8', align: 'right' });
    if (o.yLabel) drawText(g, o.yLabel, x + 3, y + 2, { font: 'tiny', color: '#b8c8e8' });
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
      if (it.label) drawText(g, it.label, bx + bw / 2 - 1, y + h - 8, { font: 'tiny', color: '#b8c8e8', align: 'center' });
      if (o.values) drawText(g, o.fmt ? o.fmt(it.v) : fmt(it.v, 0), bx + bw / 2 - 1, by - 7, { font: 'tiny', color: it.color, align: 'center' });
    });
    if (o.limit != null) { const ly = y + h - 10 - Math.round((h - 16) * o.limit / max); for (let xx = x + 2; xx < x + w - 2; xx += 2) fpx(g, xx, ly, '#ff4e5d'); }
  },
  /** Tanque con líquido animado (fracción 0..1) */
  tank(g, x, y, w, h, frac, ramp = RAMP.sea, label = null, o = {}) {
    frect(g, x, y, w, h, '#000633');
    frect(g, x + 1, y + 1, w - 2, h - 2, '#0a1a36'); frect(g, x + 1, y + 1, w - 2, 1, '#00081c');
    const lh = Math.round((h - 4) * clamp(frac, 0, 1));
    const top = y + h - 2 - lh;
    const rn = ramp.length - 1;
    for (let yy = 0; yy < lh; yy++) {
      const t = yy / Math.max(1, h);
      frect(g, x + 2, top + yy, w - 4, 1, ramp[clamp(Math.round((0.75 - t * 0.6) * rn), 0, rn)]);
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
    if (label) drawText(g, label, x + w / 2, y + h + 2, { font: 'tiny', color: '#b8c8e8', align: 'center' });
  },
  /** Batería con módulos iluminados según SOC */
  battery(g, x, y, w, h, soc, reserve = 0, label = null) {
    frect(g, x + Math.round(w / 2) - 4, y - 3, 8, 3, '#6aa0b4');
    frect(g, x, y, w, h, '#000633'); frect(g, x + 1, y + 1, w - 2, h - 2, '#0a1a36');
    const n = 10, mh = Math.floor((h - 4) / n);
    for (let i = 0; i < n; i++) {
      const lv = (i + 0.5) / n;
      const my = y + h - 2 - (i + 1) * mh;
      const on = soc >= lv;
      const col = !on ? '#0e2850' : soc < 0.2 ? '#ff4e5d' : soc < 0.4 ? '#ffb83e' : '#86e36f';
      frect(g, x + 2, my + 1, w - 4, mh - 1, col);
      if (on) frect(g, x + 2, my + 1, w - 4, 1, shade(col, 0.35));
    }
    if (reserve > 0) { const ry = y + h - 2 - Math.round((h - 4) * reserve); frect(g, x - 2, ry, w + 4, 1, '#ff4e5d'); }
    if (label) drawText(g, label, x + w / 2, y + h + 2, { font: 'tiny', color: '#b8c8e8', align: 'center' });
  },
  gauge(g, cx, cy, r, frac, col = '#56e5ff', label = null, valueText = null) {
    for (let a = 0; a <= 40; a++) {
      const t = a / 40, an = Math.PI * (0.8 + t * 1.4);
      const on = t <= frac;
      const c = on ? (t > 0.85 ? '#ff4e5d' : t > 0.65 ? '#ffb83e' : col) : '#0e2850';
      fpx(g, cx + Math.cos(an) * r, cy + Math.sin(an) * r, c);
      fpx(g, cx + Math.cos(an) * (r - 1), cy + Math.sin(an) * (r - 1), c);
      fpx(g, cx + Math.cos(an) * (r - 2), cy + Math.sin(an) * (r - 2), shade(c, -0.3));
    }
    const an = Math.PI * (0.8 + clamp(frac, 0, 1) * 1.4);
    fline(g, cx, cy, cx + Math.cos(an) * (r - 4), cy + Math.sin(an) * (r - 4), '#fffaf0');
    frect(g, cx - 1, cy - 1, 3, 3, '#fffaf0');
    if (valueText) drawText(g, valueText, cx, cy + 4, { font: 'tiny', color: '#fffaf0', align: 'center' });
    if (label) drawText(g, label, cx, cy + r * 0.55 + 6, { font: 'tiny', color: '#93a6c8', align: 'center' });
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
