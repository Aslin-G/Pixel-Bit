/* =====================================================================
   06c_ui_widgets.js — Lenguaje de interfaz de la referencia (STYLE LOCK §11,
   docs/art/analisis/04_interfaz.md §4.3): iconos grandes de 22 px, marcos por
   máscara (globo con cola, panel con muesca), bloque de retrato del HUD,
   corazones y energía, globo de diálogo anclado, panel PREGUNTA, minimapa
   «MAPA» con islas-nodo, tarjetas de capítulo con miniatura, teclas,
   placas de instrumentos y velos sin tramado.
   ===================================================================== */

/* ---------- Iconos grandes 22×22 (arte en 1..22 de un búfer de 24×24) ---------- */
(function defineBigIcons() {
  const I = Icons;
  I.defBig('book', p => {
    // libro abierto en 3/4: tapa naranja a la izquierda, página crema a la derecha
    p.poly([[2, 6], [11, 3], [11, 20], [2, 21]], '#e8761c');
    p.poly([[3, 7], [10, 5], [10, 9], [3, 11]], '#ffa63c');
    p.poly([[2, 6], [4, 5.4], [4, 20.5], [2, 21]], '#b8500e');
    p.line(5, 8, 9, 7, '#ffd08a'); p.line(5, 11, 9, 10, '#f09030');
    p.poly([[11, 3], [20, 5], [20, 20], [11, 20]], '#fff2d6');
    p.poly([[11, 3], [13, 3.5], [13, 20], [11, 20]], '#e2c49a');
    for (let k = 0; k < 4; k++) p.line(14, 8 + k * 3, 18, 8.6 + k * 3, '#c8a878');
    p.poly([[2, 21], [11, 20], [20, 20], [21, 22], [11, 22], [2, 22]], '#a8440c');
    p.hline(12, 19, 21, '#d8b080'); p.set(19, 6, '#ffffff'); p.set(18, 6, '#ffffff');
  });
  I.defBig('map', p => {
    p.poly([[1, 5], [7, 2], [14, 5], [21, 2], [21, 18], [14, 21], [7, 18], [1, 21]], '#f6dc8e');
    p.poly([[7, 2], [14, 5], [14, 21], [7, 18]], '#e0a44c');
    p.poly([[14, 5], [21, 2], [21, 18], [14, 21]], '#fbe8b0');
    p.poly([[2, 14], [6, 12], [7, 17], [3, 19]], '#5cc8a0'); p.poly([[15, 12], [20, 10], [20, 16], [16, 18]], '#5cb8e0');
    for (let k = 0; k < 6; k++) p.set(4 + k * 2.4, 10 - Math.sin(k) * 2, '#e8463a');
    p.disc(17, 7, 2.2, '#ff4e5d'); p.set(16, 6, '#ffc0b0'); p.vline(17, 9, 11, '#a82c40');
  });
  I.defBig('question', p => {
    p.disc(11.5, 11.5, 10, '#5a38c8'); p.disc(11.5, 11, 9, '#7a58ec'); p.disc(10, 8, 5, '#9a7cff');
    p.rect(8, 5, 7, 2, '#ffffff'); p.rect(14, 6, 2, 5, '#ffffff'); p.rect(11, 10, 4, 2, '#ffffff'); p.rect(11, 11, 2, 4, '#ffffff'); p.rect(11, 16, 2, 2, '#ffffff');
    p.rect(7, 6, 2, 2, '#ffffff'); p.set(6, 6, '#dcd0ff');
  });
  I.defBig('warn', p => {
    p.poly([[11.5, 1], [22, 20], [1, 20]], '#e8901c'); p.poly([[11.5, 4], [19.5, 18.5], [3.5, 18.5]], '#ffd23a');
    p.poly([[11.5, 4], [14, 8.5], [9, 8.5]], '#fff2a0');
    p.rect(10, 7, 3, 7, '#2a1404'); p.rect(10, 15, 3, 2, '#2a1404');
  });
  I.defBig('target', p => {
    p.disc(11.5, 11.5, 10, '#c8283c'); p.disc(11.5, 11.5, 8, '#ffffff'); p.disc(11.5, 11.5, 6, '#e8463a'); p.disc(11.5, 11.5, 4, '#ffffff'); p.disc(11.5, 11.5, 2, '#e8463a');
    p.set(7, 5, '#ffd8d0'); p.set(6, 6, '#ffd8d0');
  });
  I.defBig('kiru', p => {
    p.poly([[3, 2], [8, 7], [4, 10]], '#dc8a1f'); p.poly([[20, 2], [15, 7], [19, 10]], '#dc8a1f');
    p.poly([[4, 4], [7, 7], [5, 8]], '#29cae1'); p.poly([[19, 4], [16, 7], [18, 8]], '#29cae1');
    p.ellipse(11.5, 13, 9, 8, '#c7d8e1'); p.ellipse(11, 12, 8, 7, '#ebf1f3'); p.ellipse(9, 9, 4, 3, '#ffffff');
    p.ellipse(11.5, 14, 6.5, 4, '#061b4d'); p.ellipse(11.5, 14.5, 5.5, 3, '#050e2f');
    p.rect(8, 13, 2, 3, '#17f3f7'); p.rect(13, 13, 2, 3, '#17f3f7'); p.set(8, 13, '#e6fdff'); p.set(13, 13, '#e6fdff');
    p.hline(8, 15, 21, '#20c0ae');
  });
  I.defBig('sun', p => {
    for (let a = 0; a < 8; a++) { const an = a * Math.PI / 4; p.thick(11.5 + Math.cos(an) * 7, 11.5 + Math.sin(an) * 7, 11.5 + Math.cos(an) * 10, 11.5 + Math.sin(an) * 10, 1, a % 2 ? '#e8901c' : '#ffb02a'); }
    p.disc(11.5, 11.5, 6.5, '#e8901c'); p.disc(11.5, 11.5, 5.5, '#ffd23a'); p.disc(10.5, 10.5, 3.2, '#fff2a0'); p.set(9, 9, '#ffffff');
  });
  I.defBig('turbine', p => {
    p.poly([[10.5, 9], [12.5, 9], [13.5, 22], [9.5, 22]], '#dfe8f2'); p.vline(12, 10, 21, '#f4f6fb'); p.vline(10, 10, 21, '#a0a8c0');
    p.thick(11.5, 8, 11.5, 1, 0.9, '#f4f6fb'); p.thick(11.5, 8, 4.5, 13, 0.9, '#d8dde8'); p.thick(11.5, 8, 18.5, 13, 0.9, '#d8dde8');
    p.disc(11.5, 8, 1.8, '#7a84a0'); p.set(11, 7, '#ffffff'); p.hline(8, 15, 22, '#7a84a0');
  });
  I.defBig('water', p => {
    p.poly([[11.5, 1], [18, 11], [19, 15], [16, 20], [11.5, 22], [7, 20], [4, 15], [5, 11]], '#0a71a3');
    p.ellipse(11.5, 15, 6.6, 6, '#11bedd'); p.ellipse(12.5, 16, 5, 4.5, '#3adcf1');
    p.poly([[11.5, 3], [15, 9], [11.5, 10]], '#7cdfec'); p.rect(7, 13, 2, 4, '#e6fdff'); p.set(8, 12, '#bde3ed'); p.set(9, 18, '#bde3ed');
  });
  I.defBig('h2', p => {
    // tanque de hidrógeno verde con «H₂»
    p.rect(6, 3, 11, 18, '#2f9e62'); p.ellipse(11.5, 4, 5.5, 2.5, '#4cd48e'); p.ellipse(11.5, 20, 5.5, 2, '#1f6e48');
    p.rect(7, 4, 2, 15, '#80ecc2'); p.rect(15, 4, 1, 15, '#1f6e48'); p.rect(10, 1, 3, 2, '#c0bfb1');
    p.rect(8, 8, 1, 6, '#ffffff'); p.rect(11, 8, 1, 6, '#ffffff'); p.rect(9, 10, 2, 1, '#ffffff');
    p.rect(13, 12, 2, 1, '#ffffff'); p.set(14, 13, '#ffffff'); p.set(13, 14, '#ffffff'); p.rect(13, 15, 3, 1, '#ffffff');
  });
  I.defBig('plant', p => {
    p.poly([[5, 14], [18, 14], [16, 22], [7, 22]], '#c8861a'); p.rect(4, 13, 15, 3, '#ffd23a'); p.hline(5, 17, 13, '#fff2a0'); p.poly([[14, 16], [17, 16], [16, 22], [14, 22]], '#9a5e12');
    p.thick(11.5, 13, 11.5, 7, 0.7, '#2f9e62');
    p.poly([[11, 8], [6, 3], [2, 4], [4, 8], [8, 10]], '#4cc85a'); p.poly([[12, 8], [17, 2], [21, 3], [19, 8], [15, 10]], '#4cc85a');
    p.line(4, 5, 10, 8, '#9cf07a'); p.line(19, 4, 13, 8, '#9cf07a'); p.set(3, 4, '#c8ff9a'); p.set(20, 3, '#c8ff9a');
  });
  I.defBig('leaf', p => {
    p.poly([[2, 21], [3, 11], [9, 4], [21, 1], [19, 11], [11, 19]], '#2f9e48'); p.poly([[4, 16], [6, 10], [11, 5], [19, 3], [17, 9]], '#5cc85a');
    p.thick(3, 20, 17, 5, 0.6, '#1f6e38'); p.set(7, 9, '#c8ff9a'); p.set(8, 8, '#c8ff9a');
  });
  I.defBig('battery', p => {
    p.rect(2, 6, 18, 12, '#0e2850'); p.rect(20, 9, 2, 6, '#8fb4ff'); p.rect(3, 7, 16, 10, '#08183a');
    for (let k = 0; k < 4; k++) { p.rect(4 + k * 4, 8, 3, 8, k < 3 ? '#4ccb70' : '#1f4a3a'); if (k < 3) p.vline(4 + k * 4, 8, 15, '#9cf07a'); }
    p.hline(3, 18, 6, '#3a64b0'); p.poly([[12, 4], [8, 12], [11, 12], [9, 19], [15, 10], [12, 10]], '#ffd23a');
  });
  I.defBig('bolt', p => { p.poly([[14, 1], [5, 13], [10.5, 13], [8, 22], [18, 9], [12.5, 9]], '#f2ce4a'); p.line(13, 3, 8, 11, '#fff2a0'); p.poly([[17, 9.5], [9.5, 20], [12, 13]], '#c8901a'); });
  I.defBig('drop_brine', p => {
    p.poly([[11.5, 1], [18, 11], [19, 15], [16, 20], [11.5, 22], [7, 20], [4, 15], [5, 11]], '#822f7e');
    p.ellipse(11.5, 15, 6.6, 6, '#c244a2'); p.ellipse(12.5, 16, 5, 4.5, '#e07ecf');
    p.rect(7, 13, 2, 4, '#f4bef5'); for (const [x, y] of [[12, 13], [15, 17], [11, 18], [14, 14]]) p.set(x, y, '#ffffff');
  });
  I.defBig('salt', p => {
    p.poly([[11.5, 2], [20, 8], [17, 21], [6, 21], [3, 8]], '#e07ecf'); p.poly([[11.5, 2], [20, 8], [11.5, 11], [3, 8]], '#f4bef5');
    p.poly([[11.5, 11], [20, 8], [17, 21], [11.5, 21]], '#c244a2'); p.line(11.5, 11, 11.5, 21, '#822f7e'); p.set(9, 5, '#ffffff'); p.set(10, 4, '#ffffff');
  });
  I.defBig('membrane', p => {
    p.rect(2, 7, 19, 10, '#245f90'); p.ellipse(2.5, 12, 2, 5, '#31b4e2'); p.ellipse(20.5, 12, 2, 5, '#163e66');
    for (let k = 0; k < 4; k++) p.hline(4, 19, 8 + k * 2.5, k % 2 ? '#74c6de' : '#b6e9f7');
    p.rect(7, 6, 2, 12, '#d3ccc5'); p.rect(15, 6, 2, 12, '#d3ccc5'); p.hline(3, 20, 7, '#b6e9f7');
    p.set(5, 15, '#e07ecf'); p.set(11, 14, '#e07ecf'); p.set(18, 15, '#e07ecf');
  });
  I.defBig('mosaic', p => {
    p.rect(2, 2, 9, 9, '#22c1e7'); p.rect(12, 2, 9, 9, '#ffd23a'); p.rect(2, 12, 9, 9, '#4ccb70'); p.rect(12, 12, 9, 9, '#ff6b6b');
    p.hline(2, 10, 2, '#abfafd'); p.hline(12, 20, 2, '#fff2a0'); p.hline(2, 10, 12, '#9cf07a'); p.hline(12, 20, 12, '#ffb0a8');
    p.rect(8, 8, 7, 7, '#7a58ec'); p.rect(9, 9, 5, 2, '#b49cff');
  });
  I.defBig('gear', p => {
    for (let a = 0; a < 8; a++) { const an = a * Math.PI / 4 + 0.2; p.disc(11.5 + Math.cos(an) * 8, 11.5 + Math.sin(an) * 8, 2.3, '#6a8e9c'); }
    p.disc(11.5, 11.5, 7.5, '#9ab4be'); p.disc(11, 11, 6, '#cfe0e6'); p.disc(11.5, 11.5, 3, '#18334a'); p.set(8, 7, '#ffffff'); p.set(7, 8, '#ffffff');
  });
  I.defBig('eye', p => {
    p.ellipse(11.5, 11.5, 10, 6, '#c8d8f0'); p.ellipse(11.5, 11, 9, 5, '#f4f8ff'); p.disc(11.5, 11.5, 4.5, '#245f90'); p.disc(11.5, 11.5, 3.5, '#31b4e2'); p.disc(11.5, 11.5, 1.8, '#06183a'); p.rect(9, 9, 2, 2, '#ffffff');
  });
  I.defBig('hint', p => {
    p.disc(11.5, 9, 7.5, '#e8b020'); p.disc(11.5, 8.5, 6.5, '#ffd23a'); p.disc(10, 7, 3, '#fff2a0'); p.set(8, 5, '#ffffff');
    p.rect(8, 15, 7, 3, '#e8b020'); p.rect(8, 18, 7, 2, '#9ab4be'); p.rect(9, 20, 5, 2, '#6a8e9c'); p.hline(8, 14, 18, '#cfe0e6');
  });
  I.defBig('lens', p => {
    p.disc(9.5, 9.5, 8, '#8fdfff'); p.disc(9.5, 9.5, 6.5, '#0c4a78'); p.disc(9.5, 9.5, 5.5, '#1f86b8'); p.disc(8, 8, 2.5, '#7fd8f6'); p.set(7, 6, '#ffffff'); p.set(6, 7, '#ffffff');
    p.thick(15, 15, 20, 20, 1.6, '#c86a24'); p.thick(15, 15, 19, 19, 0.6, '#ffa060');
  });
  I.defBig('star', p => {
    const pts = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 4.4 : 10.5; const a = -Math.PI / 2 + i * Math.PI / 5; pts.push([11.5 + Math.cos(a) * r, 12.4 + Math.sin(a) * r]); }
    p.poly(pts, '#e8a020'); p.poly(pts.map(([x, y]) => [11.5 + (x - 11.5) * 0.8, 12 + (y - 12.4) * 0.8]), '#ffd23a'); p.disc(10, 9, 2, '#fff2a0'); p.set(9, 8, '#ffffff');
  });
  I.defBig('chart', p => {
    p.rect(1, 2, 21, 19, '#06183a'); p.rect(2, 3, 19, 17, '#0a2450');
    p.rect(4, 12, 4, 7, '#22c1e7'); p.rect(9, 8, 4, 11, '#ffd23a'); p.rect(14, 5, 4, 14, '#4ccb70');
    p.hline(4, 7, 12, '#abfafd'); p.hline(9, 12, 8, '#fff2a0'); p.hline(14, 17, 5, '#9cf07a'); p.hline(2, 20, 19, '#8fb4ff');
  });
  I.defBig('flask', p => {
    p.rect(8, 1, 7, 2, '#cfe0e6'); p.rect(9, 3, 5, 6, '#e6f0f7');
    p.poly([[9, 8], [14, 8], [21, 21], [2, 21]], '#d8e6f0'); p.poly([[6, 14], [17, 14], [21, 21], [2, 21]], '#4ccb70');
    p.hline(6, 17, 14, '#9cf07a'); p.set(8, 17, '#c8ff9a'); p.set(13, 18, '#c8ff9a'); p.vline(10, 4, 12, '#ffffff');
  });
  I.defBig('pause', p => { p.rect(5, 3, 5, 17, '#cfe0e6'); p.rect(13, 3, 5, 17, '#cfe0e6'); p.vline(5, 3, 19, '#ffffff'); p.vline(13, 3, 19, '#ffffff'); p.vline(9, 3, 19, '#8fa8c0'); p.vline(17, 3, 19, '#8fa8c0'); });
  I.defBig('play', p => { p.poly([[5, 2], [20, 11.5], [5, 21]], '#3fc070'); p.poly([[6, 4], [16, 10], [6, 10]], '#9cf07a'); });
  I.defBig('scale', p => {
    p.vline(11, 3, 20, '#e0b440'); p.vline(12, 3, 20, '#ffd23a'); p.hline(3, 20, 5, '#ffd23a'); p.rect(7, 20, 10, 2, '#c8861a');
    p.poly([[1, 13], [7, 13], [4, 6]], '#ffe58a'); p.poly([[16, 13], [22, 13], [19, 6]], '#ffe58a'); p.hline(1, 7, 13, '#c8861a'); p.hline(16, 22, 13, '#c8861a'); p.disc(11.5, 3, 1.6, '#fff2a0');
  });
  I.defBig('check', p => { p.thick(3.5, 12, 9, 17.5, 1.7, '#1f9e5a'); p.thick(9, 17.5, 19.5, 5, 1.7, '#1f9e5a'); p.line(4, 11, 9, 16, '#9cf07a'); p.line(10, 16, 19, 5, '#7fe6bb'); });
  I.defBig('cross', p => { p.thick(5, 5, 18, 18, 1.8, '#c8283c'); p.thick(18, 5, 5, 18, 1.8, '#c8283c'); p.line(5, 5, 17, 17, '#ff9a8a'); });
  I.defBig('lock', p => {
    p.ellipseOutline(11.5, 8, 5, 6, '#9ab4be'); p.ellipseOutline(11.5, 8, 4, 5, '#cfe0e6');
    p.rect(4, 10, 15, 11, '#c8861a'); p.rect(4, 10, 15, 4, '#ffd23a'); p.hline(5, 17, 10, '#fff2a0'); p.rect(10, 14, 3, 4, '#3a2208');
  });
  I.defBig('heart', p => { p.disc(7, 8, 5, '#e83b41'); p.disc(16, 8, 5, '#e83b41'); p.poly([[2, 10], [21, 10], [11.5, 21]], '#e83b41'); p.poly([[14, 10], [21, 10], [11.5, 21]], '#b42e3c'); p.disc(6, 6, 2, '#ffb0a8'); });
  I.defBig('sensor', p => {
    p.vline(11, 10, 22, '#9ab4be'); p.vline(12, 10, 22, '#6a8e9c'); p.rect(6, 6, 11, 6, '#18334a'); p.rect(7, 7, 4, 4, '#ff4e5d'); p.rect(12, 7, 4, 4, '#4ccb70');
    p.ellipseOutline(11.5, 6, 10, 5, '#56e5ff'); p.set(8, 7, '#ffc0b0'); p.set(13, 7, '#c8ff9a');
  });
  I.defBig('filter', p => { p.poly([[1, 3], [22, 3], [14, 12], [14, 19], [9, 22], [9, 12]], '#6a8e9c'); p.hline(2, 21, 4, '#cfe0e6'); p.hline(5, 18, 7, '#9ab4be'); p.hline(8, 15, 10, '#9ab4be'); p.vline(10, 12, 20, '#cfe0e6'); });
  I.defBig('mirror', p => { p.ellipse(11.5, 9, 7, 8, '#c244a2'); p.ellipse(11.5, 9, 5.5, 6.5, '#ffd0e8'); p.line(8, 5, 12, 3, '#ffffff'); p.line(8, 7, 14, 4, '#ffffff'); p.rect(10, 17, 3, 5, '#6a1c94'); p.rect(7, 21, 9, 1, '#6a1c94'); });
  I.defBig('save', p => { p.rect(2, 2, 19, 19, '#245f90'); p.rect(6, 2, 11, 7, '#cfe0e6'); p.rect(13, 3, 2, 4, '#245f90'); p.rect(5, 12, 13, 9, '#f4f8ff'); p.hline(6, 16, 14, '#9ab4be'); p.hline(6, 16, 17, '#9ab4be'); p.hline(2, 20, 2, '#5ab0d8'); });
  I.defBig('reset', p => { p.ellipseOutline(11.5, 12, 8, 8, '#ffd23a'); p.ellipseOutline(11.5, 12, 7, 7, '#e8a020'); p.rect(13, 1, 9, 8, null); p.poly([[12, 0], [21, 4], [13, 9]], '#ffd23a'); });
  I.defBig('wind', p => { p.thick(2, 7, 15, 7, 0.8, '#d8eef6'); p.thick(15, 7, 18, 4, 0.8, '#d8eef6'); p.thick(1, 12, 20, 12, 0.8, '#ffffff'); p.thick(20, 12, 21, 9, 0.8, '#ffffff'); p.thick(3, 17, 13, 17, 0.8, '#98c6d2'); p.thick(13, 17, 16, 20, 0.8, '#98c6d2'); });
  I.defBig('people', p => { p.disc(7, 7, 3.5, '#c37c4d'); p.poly([[1, 21], [2, 13], [7, 11], [12, 13], [12, 21]], '#4ccb70'); p.disc(16, 6, 3.8, '#e0a07a'); p.poly([[10, 22], [11, 13], [16, 11], [21, 13], [22, 22]], '#ff9f43'); p.set(15, 4, '#ffd0b0'); });
  I.defBig('person', p => { p.disc(11.5, 6, 4.5, '#e0a07a'); p.poly([[3, 22], [5, 14], [11.5, 12], [18, 14], [20, 22]], '#de3f22'); p.set(10, 4, '#ffd8c0'); p.hline(8, 15, 13, '#ff6a3a'); });
  I.defBig('drone', p => { p.rect(7, 10, 9, 5, '#ff8e34'); p.rect(8, 10, 7, 2, '#ffc070'); p.hline(1, 8, 7, '#cfe0e6'); p.hline(15, 22, 7, '#cfe0e6'); p.vline(4, 7, 10, '#6a8e9c'); p.vline(19, 7, 10, '#6a8e9c'); p.rect(10, 15, 3, 2, '#17f3f7'); });
  I.defBig('info', p => { p.disc(11.5, 11.5, 10, '#2c63c0'); p.disc(11.5, 11, 9, '#4a8ae0'); p.rect(10, 9, 3, 9, '#ffffff'); p.rect(10, 4, 3, 3, '#ffffff'); });
  I.defBig('coin', p => { p.disc(11.5, 11.5, 10, '#c8861a'); p.disc(11.5, 11.5, 8.5, '#ffd23a'); p.rect(10, 6, 3, 11, '#9a5e12'); p.disc(8, 7, 2, '#fff2a0'); });
  I.defBig('tank', p => { p.rect(4, 3, 15, 18, '#5a7a94'); p.rect(5, 9, 13, 11, '#22c1e7'); p.hline(5, 17, 9, '#abfafd'); p.hline(4, 18, 3, '#cfe0e6'); p.vline(6, 4, 19, '#e6f8fe'); });
  I.defBig('seed', p => { p.ellipse(11.5, 14, 6, 7, '#b86f44'); p.ellipse(10, 12, 3, 4, '#d18f5c'); p.thick(12, 7, 16, 2, 0.6, '#4ccb70'); p.poly([[16, 2], [21, 1], [19, 5]], '#9cf07a'); });
  I.defBig('cactus', p => { p.rect(9, 3, 5, 19, '#2f9e48'); p.rect(3, 8, 4, 7, '#2f9e48'); p.rect(3, 13, 7, 3, '#2f9e48'); p.rect(16, 6, 4, 7, '#2f9e48'); p.rect(13, 11, 4, 3, '#2f9e48'); p.vline(10, 4, 21, '#7fd06a'); p.set(11, 2, '#f78acb'); p.set(12, 2, '#f78acb'); });
  I.defBig('panel', p => { p.poly([[1, 15], [7, 5], [22, 5], [16, 15]], '#344675'); p.line(4, 10, 19, 10, '#8b9cc2'); p.line(9, 5, 4, 15, '#6a7aa4'); p.line(15, 5, 10, 15, '#6a7aa4'); p.vline(11, 15, 22, '#9ab4be'); p.set(19, 6, '#e6f0ff'); p.set(20, 6, '#e6f0ff'); });
  I.defBig('ear', p => { p.disc(11.5, 11.5, 10, '#7a58ec'); p.ellipseOutline(11.5, 11.5, 6, 6, '#dcd0ff'); p.ellipseOutline(11.5, 11.5, 3, 3, '#dcd0ff'); p.disc(11.5, 11.5, 1, '#ffffff'); });
  I.defBig('fish', p => { p.ellipse(10, 12, 8, 5, '#ff8e34'); p.poly([[16, 12], [22, 6], [22, 18]], '#ffc070'); p.rect(5, 10, 2, 2, '#140d26'); p.hline(5, 14, 14, '#ffe0a0'); });
  I.defBig('mangrove', p => { p.ellipse(11.5, 7, 9, 6, '#2f8a5a'); p.ellipse(10, 5, 5, 3, '#7fd394'); p.vline(11, 10, 17, '#7a3e2a'); p.line(11, 15, 5, 21, '#7a3e2a'); p.line(12, 15, 18, 21, '#7a3e2a'); p.hline(1, 22, 20, '#11bedd'); });
})();

/* Versión media (arte 16 px en lienzo 18×18): la misma construcción vectorial a escala 0,72, no una reducción de píxeles */
Icons.mid = function (name) {
  const k = 'MID|' + name;
  let c = this.cache.get(k);
  if (c) return c;
  const fn = this.bigDefs[name];
  if (!fn) return this.get(name);
  const pb = new PixelBuffer(18, 18), K = 0.72, O = 0.5;
  const T = (v) => v * K + O;
  const q = {
    set: (x, y, col) => pb.set(Math.round(T(x)), Math.round(T(y)), col),
    rect: (x, y, w, h, col) => pb.rect(Math.round(T(x)), Math.round(T(y)), Math.max(1, Math.round(w * K)), Math.max(1, Math.round(h * K)), col),
    hline: (x0, x1, y, col) => pb.hline(Math.round(T(x0)), Math.round(T(x1)), Math.round(T(y)), col),
    vline: (x, y0, y1, col) => pb.vline(Math.round(T(x)), Math.round(T(y0)), Math.round(T(y1)), col),
    line: (x0, y0, x1, y1, col) => pb.line(T(x0), T(y0), T(x1), T(y1), col),
    thick: (x0, y0, x1, y1, r, col) => pb.thick(T(x0), T(y0), T(x1), T(y1), Math.max(0.5, r * K), col),
    disc: (cx, cy, r, col) => pb.disc(T(cx), T(cy), r * K, col),
    ellipse: (cx, cy, rx, ry, col) => pb.ellipse(T(cx), T(cy), rx * K, ry * K, col),
    ellipseOutline: (cx, cy, rx, ry, col) => pb.ellipseOutline(T(cx), T(cy), rx * K, ry * K, col),
    poly: (pts, col) => pb.poly(pts.map(([x, y]) => [T(x), T(y)]), col),
  };
  fn(q);
  pb.outline(n => darkOf(n, -0.66));
  c = pb.toCanvas();
  this.cache.set(k, c);
  return c;
};

/* ---------- Velo de fondo sin tramado ---------- */
UIK.scrim = function (g, a = 0.62, col = '#020a1e') {
  g.globalAlpha = clamp(a, 0, 1); frect(g, 0, 0, W, H, col);
  g.globalAlpha = clamp(a * 0.35, 0, 1); frect(g, 0, 0, W, 24, col); frect(g, 0, H - 24, W, 24, col);
  g.globalAlpha = 1;
};

/* ---------- Marco por máscara: tinta → bisel (hi arriba/izq, lo abajo/der) → medio → relleno ---------- */
UIK.shapeFrame = function (w, h, inside, s, o = {}) {
  const pb = new PixelBuffer(w, h);
  const D = new Int16Array(w * h).fill(-1);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (inside(x, y)) D[y * w + x] = 99;
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? -2 : D[y * w + x];
  for (let L = 0; L < 3; L++) {
    const want = L === 0 ? -1 : L - 1;
    const mark = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (D[y * w + x] !== 99) continue;
      let hit = false;
      for (let dy = -1; dy <= 1 && !hit; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const v = at(x + dx, y + dy);
        if (L === 0 ? v < 0 : v === want) { hit = true; break; }
      }
      if (hit) mark.push(y * w + x);
    }
    for (const i of mark) D[i] = L;
  }
  const split = Math.round(h * (o.split ?? 0.42));
  const hiU = U(o.hi || s.hi), loU = U(o.lo || s.lo), midU = U(s.mid), inkU = U(s.ink), f0 = U(s.fill[0]), f1 = U(s.fill[1]);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = D[y * w + x];
    if (d < 0) continue;
    let c;
    if (d === 0) c = inkU;
    else if (d === 1) c = (at(x, y - 1) === 0 || at(x - 1, y) === 0 || at(x - 1, y - 1) === 0) ? hiU : loU;
    else if (d === 2) c = midU;
    else c = y < split ? f0 : f1;
    pb.data[y * w + x] = c;
  }
  return pb.toCanvas();
};
UIK._shapeCache = new Map();

/* ---------- Sprites pequeños del HUD ---------- */
const HUD_SPR = {};
(function () {
  const mk = (rows, pal) => { const pb = new PixelBuffer(rows[0].length, rows.length); rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (pal[r[x]]) pb.set(x, y, pal[r[x]]); }); return pb.toCanvas(); };
  const HEART = ['.ooo.ooo.', 'ohhbobbbo', 'ohbbbbbbo', 'obbbbbbso', '.obbbbso.', '..obbso..', '...oso...', '....o....'];
  HUD_SPR.heartFull = mk(HEART, { o: '#801728', h: '#ffb0a8', b: '#e83b41', s: '#b42e3c' });
  HUD_SPR.heartEmpty = mk(HEART, { o: '#3a1a2a', h: '#2a2040', b: '#1d1934', s: '#1d1934' });
  HUD_SPR.heartFlash = mk(HEART, { o: '#ffffff', h: '#ffffff', b: '#ffe8e8', s: '#ffd0d0' });
  HUD_SPR.bolt = mk(['...oyo', '..oyo.', '.oyyo.', 'oyyyyo', '..oyo.', '.oyo..', '.oo...'], { o: '#a8701a', y: '#f2ce4a' });
  HUD_SPR.boltHi = mk(['...oyo', '..owo.', '.oyyo.', 'oyyyyo', '..oyo.', '.oyo..', '.oo...'], { o: '#a8701a', y: '#f2ce4a', w: '#fff2a0' });
})();
UIK.heart = function (g, x, y, state = 'full') { g.drawImage(state === 'full' ? HUD_SPR.heartFull : state === 'flash' ? HUD_SPR.heartFlash : HUD_SPR.heartEmpty, Math.round(x), Math.round(y)); };
/** Barra de energía cian de la referencia (6 px de alto) */
UIK.energyBar = function (g, x, y, w, frac, low = false) {
  x = Math.round(x); y = Math.round(y);
  frect(g, x + 1, y, w - 2, 6, '#001a34'); frect(g, x, y + 1, w, 4, '#001a34');
  frect(g, x + 1, y + 1, w - 2, 4, '#0b4b72');
  const fw = Math.round((w - 2) * clamp(frac, 0, 1));
  if (fw > 0) {
    const blink = low && ((Game.frame >> 3) & 1);
    const c = low ? (blink ? '#ffc070' : '#ff9f43') : '#1ef4fd', t = low ? '#ffe0b0' : '#9ffcff', b = low ? '#c86a1a' : '#13a3d3';
    frect(g, x + 1, y + 1, fw, 4, c); frect(g, x + 1, y + 1, fw, 1, t); frect(g, x + 1, y + 4, fw, 1, b);
    if (fw > 3) fpx(g, x + fw, y + 1, mixHex(c, '#001a34', 0.4));
  }
};

/* ---------- Busto 48×46 para el HUD (contrato Portraits.bust; si falta, reducción 2:1 por moda) ---------- */
UIK._bustCache = new Map();
UIK.bust = function (id, expr = 'smile') {
  if (typeof Portraits !== 'undefined' && typeof Portraits.bust === 'function') {
    try { const c = Portraits.bust(id, expr); if (c) return c; } catch (e) { /* recurre a la reducción */ }
  }
  return _cacheGet(UIK._bustCache, id + '|' + expr, () => {
    const src = Portraits.get(id, expr, 0, false);
    const sw = src.width, sh = src.height;
    // región del busto: en retratos de 128 se recorta (16,8)–(112,100); en otros tamaños se toma el cuadro completo
    const r = sw >= 128 ? [Math.round(sw * 0.125), Math.round(sh * 0.0625), Math.round(sw * 0.75), Math.round(sh * 0.72)] : [0, Math.round(sh * 0.02), sw, Math.round(sh * 0.96)];
    const tmp = makeCanvas(r[2], r[3]); tmp.g.drawImage(src, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]);
    const sd = tmp.g.getImageData(0, 0, r[2], r[3]).data;
    const ow = 48, oh = 46, out = new PixelBuffer(ow, oh);
    const kx = r[2] / ow, ky = r[3] / oh;
    for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
      const x0 = Math.floor(x * kx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * kx)), y0 = Math.floor(y * ky), y1 = Math.max(y0 + 1, Math.floor((y + 1) * ky));
      const counts = new Map(); let opaque = 0, n = 0;
      for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) {
        n++; const i = (yy * r[2] + xx) * 4; if (sd[i + 3] < 128) continue; opaque++;
        const key = (sd[i] << 16) | (sd[i + 1] << 8) | sd[i + 2]; counts.set(key, (counts.get(key) || 0) + 1);
      }
      if (opaque * 2 < n) continue;
      let best = -1, bc = 0, bl = 1e9;
      for (const [k, c] of counts) { const l = ((k >> 16) & 255) * 0.3 + ((k >> 8) & 255) * 0.59 + (k & 255) * 0.11; if (c > bc || (c === bc && l < bl)) { best = k; bc = c; bl = l; } }
      out.data[y * ow + x] = (0xff000000 | ((best & 255) << 16) | (best & 0xff00) | ((best >> 16) & 255)) >>> 0;
    }
    return out.toCanvas();
  }, 64);
};

/* ---------- Altura de la cabeza de un personaje (px sobre los pies), medida en su sprite ---------- */
UIK._headCache = new Map();
UIK.headTop = function (charId) {
  if (UIK._headCache.has(charId)) return UIK._headCache.get(charId);
  let v = charId === 'kiru' ? 56 : 76;
  try {
    const def = CHARS[charId];
    if (def) {
      const c = SpriteCache.get(charId, 'idle', 0, {});
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let top = -1;
      for (let y = 0; y < c.height && top < 0; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 0) { top = y; break; }
      if (top >= 0) v = (def.oy ?? 78) - top;
    }
  } catch (e) { /* valor por defecto */ }
  UIK._headCache.set(charId, v);
  return v;
};

/* ---------- Bloque de retrato del HUD: marco 54×52 + panel con muesca (nombre, 7 corazones, energía, Nv.) ---------- */
UIK.hudPortraitBlock = function (g, x = 4, y = 4, d = {}) {
  const s = PANEL_STYLES.hud;
  // marco del retrato (prerenderizado por expresión)
  const pk = 'hudp|' + (d.id || 'amaya') + '|' + (d.expr || 'smile') + '|' + (d.tint || '');
  const pf = _cacheGet(UIK._shapeCache, pk, () => {
    const c = makeCanvas(54, 52); const b = c.g;
    UIK.drawFrame(b, 0, 0, 54, 52, s, null, { chamfer: 3, key: false, spark: false });
    frect(b, 3, 3, 48, 46, '#000633');
    // ventana: fondo navy con halo suave del color del personaje
    const bg = mixHex('#0a1a3a', d.tint || '#ff7656', 0.12);
    frect(b, 4, 4, 46, 44, bg);
    b.fillStyle = mixHex(bg, '#2a4a8a', 0.35); b.beginPath(); b.arc(27, 22, 17, 0, TAU); b.fill();
    b.fillStyle = mixHex(bg, '#4a6ab0', 0.35); b.beginPath(); b.arc(27, 20, 11, 0, TAU); b.fill();
    b.save(); b.beginPath(); b.rect(4, 4, 46, 44); b.clip();
    const bust = UIK.bust(d.id || 'amaya', d.expr || 'smile');
    b.drawImage(bust, 4 + Math.round((46 - bust.width) / 2), 4 + Math.round(44 - bust.height) + 1);
    b.restore();
    frect(b, 4, 4, 46, 1, 'rgba(255,255,255,0.10)');
    return c;
  }, 48);
  // panel de estado con muesca: cuerpo 94×42 y pestaña «Nv.» que baja a la izquierda con chaflán a 45°
  const PW = 94, PH = 52, bodyH = 42, tabW = 58;
  const sf = _cacheGet(UIK._shapeCache, 'hudstat|' + PW, () => {
    const inside = (px, py) => {
      if (px < 0 || px >= PW || py < 0 || py >= PH) return false;
      if (py < 3 && (px < 3 - py || px >= PW - (3 - py))) return false;
      if (py < bodyH) { const inset = Math.max(0, 6 - (bodyH - 1 - py)); return px < PW - inset; }
      if (py >= PH - 3 && px < 3 - (PH - 1 - py)) return false;
      return px <= tabW - 1 - (py - bodyH);
    };
    const c = UIK.shapeFrame(PW, PH, inside, s, { split: 0.38 });
    const b = c.getContext('2d');
    fpx(b, PW - 7, 4, s.spark); fpx(b, PW - 6, 5, '#e8f6ff'); fpx(b, PW - 5, 4, s.spark);
    fpx(b, PW - 12, bodyH - 4, s.spark); fpx(b, PW - 10, bodyH - 5, '#e8f6ff');
    frect(b, 7, 15, PW - 14, 1, '#12305a'); frect(b, 7, 16, PW - 14, 1, '#0b2a58');
    return c;
  });
  const sx = x + 52, sy = y + 4;
  g.drawImage(sf, sx, sy);
  g.drawImage(pf, x, y);
  drawText(g, d.name || 'AMAYA', sx + 8, sy + 5, { font: 'bold', color: '#edfcfe' });
  const maxHp = d.maxHp || 7, hp = d.hp ?? maxHp;
  for (let i = 0; i < maxHp; i++) UIK.heart(g, sx + 6 + i * 11, sy + 19, i < hp ? 'full' : (d.lostIdx === i && d.flash > 0 && ((Game.frame >> 2) & 1) ? 'flash' : 'empty'));
  g.drawImage(HUD_SPR.boltHi, sx + 6, sy + 30);
  UIK.energyBar(g, sx + 14, sy + 30, PW - 22, d.energy ?? 1, (d.energy ?? 1) < 0.15);
  const nv = 'Nv. ' + (d.rank || 1);
  drawText(g, nv, sx + 7, sy + 40, { font: 'bold', color: '#ebfcff' });
  if (d.rankFrac != null) { const bx = sx + 10 + FONTS.bold.measure(nv), bw = Math.max(8, tabW - 14 - (bx - sx)); frect(g, bx, sy + 44, bw, 4, '#000633'); frect(g, bx + 1, sy + 45, bw - 2, 2, '#3a2a08'); frect(g, bx + 1, sy + 45, Math.round((bw - 2) * clamp(d.rankFrac, 0, 1)), 2, '#ffd23a'); frect(g, bx + 1, sy + 45, Math.round((bw - 2) * clamp(d.rankFrac, 0, 1)), 1, '#fff2a0'); }
  return { x, y, w: 52 + PW, h: 4 + PH };
};

/* ---------- Teclas e indicaciones de interacción ---------- */
UIK.keycap = function (g, x, y, key) {
  key = String(key || '?');
  const kw = Math.max(11, FONTS.bold.measure(key) + 6);
  x = Math.round(x); y = Math.round(y);
  frect(g, x + 1, y, kw - 2, 12, '#000633'); frect(g, x, y + 1, kw, 10, '#000633');
  frect(g, x + 1, y + 1, kw - 2, 10, '#d2efff'); frect(g, x + 2, y + 2, kw - 4, 7, '#0b2a5a'); frect(g, x + 2, y + 9, kw - 4, 1, '#06183a');
  frect(g, x + 2, y + 2, kw - 4, 1, '#3a64b0');
  drawText(g, key, x + Math.round(kw / 2), y + 2, { font: key.length > 1 ? 'tiny' : 'bold', color: '#e6f8fe', align: 'center' });
  return kw;
};
/** Indicación «[E] Etiqueta» centrada en cx: tecla + píldora navy (verde si ya se hizo) */
UIK.interactPrompt = function (g, cx, y, label, o = {}) {
  const key = o.key || (Input.touchMode ? 'E' : keyName(Input.codesFor('interact')[0]));
  const lw = label ? FONTS.main.measure(label) : 0;
  const kw = Math.max(11, FONTS.bold.measure(key) + 6);
  const w = label ? lw + kw + 13 : kw + 18;
  const x = Math.round(cx - w / 2); y = Math.round(y);
  UIK.panel(g, x, y, w, 17, o.done ? 'green' : 'hud', null, { chamfer: 2, key: false, spark: false });
  UIK.keycap(g, x + 4, y + 3, key);
  if (label) drawText(g, label, x + kw + 8, y + 5, { color: o.done ? '#c2f5de' : UI_INK.body });
  else for (let i = 0; i < 3; i++) frect(g, x + kw + 6 + i * 4, y + 8, 2, 2, (Math.floor(Game.time * 4) % 3) === i ? '#ffd23a' : '#e2ebfc');
  // flecha hacia el objeto
  const ax = Math.round(cx);
  frect(g, ax - 2, y + 17, 5, 1, '#000633'); frect(g, ax - 1, y + 18, 3, 1, '#000633'); fpx(g, ax, y + 19, '#000633');
  frect(g, ax - 1, y + 17, 3, 1, o.done ? '#7fe6bb' : '#b8d4ff'); fpx(g, ax, y + 18, o.done ? '#7fe6bb' : '#b8d4ff');
  return { x, y, w, h: 20 };
};

/* ---------- Píldora (etiquetas, fichas de estado) ---------- */
UIK.pill = function (g, x, y, text, o = {}) {
  const font = o.font || 'tiny';
  const tw = FONTS[font].measure(stripMarkup(text)), ih = font === 'tiny' ? 7 : 11;
  const w = tw + (o.icon ? 18 : 8), h = ih + 4;
  x = Math.round(o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x); y = Math.round(y);
  frect(g, x + 1, y, w - 2, h, '#000633'); frect(g, x, y + 1, w, h - 2, '#000633');
  frect(g, x + 1, y + 1, w - 2, h - 2, o.rim || '#8fdfff'); frect(g, x + 2, y + 2, w - 4, h - 4, o.fill || '#031128');
  if (o.icon) Icons.draw(g, o.icon, x + 2, y + Math.round(h / 2) - 6);
  drawText(g, text, x + (o.icon ? 15 : 4), y + (font === 'tiny' ? 3 : 2), { font, color: o.color || '#e8fcff' });
  return { x, y, w, h };
};

/* ---------- Globo de diálogo anclado (cola hacia la cabeza del hablante) ---------- */
// cola: 'bl' (abajo-izquierda), 'br' (abajo-derecha), 'tl' (arriba-izquierda), 'tr' (arriba-derecha)
UIK.bubbleCanvas = function (w, h, tail, style = 'tech') {
  const s = panelStyle(style);
  return _cacheGet(UIK._shapeCache, 'bub|' + w + '|' + h + '|' + tail + '|' + (s === PANEL_STYLES.hc ? 'hc' : style), () => {
    const TH = 8, top = tail[0] === 't' ? TH : 0, ch = 3;
    const bw = w, bh = h - TH;
    const left = tail[1] === 'l';
    const tx0 = left ? 8 : bw - 8 - 10; // base de la cola (10 px de ancho)
    const inside = (x, y) => {
      const by = y - top;
      if (by >= 0 && by < bh) {
        if (by < ch && (x < ch - by || x >= bw - (ch - by))) return false;
        if (by >= bh - ch && (x < ch - (bh - 1 - by) || x >= bw - (ch - (bh - 1 - by)))) return false;
        return x >= 0 && x < bw;
      }
      // cola: cuña escalonada que se estrecha hacia la punta (inclinada hacia fuera)
      const k = by < 0 ? -by : by - bh + 1; // 1..TH
      if (k < 1 || k > TH) return false;
      const wTop = 10, frac = 1 - (k - 1) / TH;
      const ww = Math.max(2, Math.round(wTop * frac * 0.9));
      const shift = Math.round((k - 1) * 0.55);
      const xa = left ? tx0 - shift : tx0 + (wTop - ww) + shift;
      return x >= xa && x < xa + ww;
    };
    const c = UIK.shapeFrame(bw, h, inside, s, { split: 0.4 });
    const b = c.getContext('2d');
    // destellos de esquina como en la referencia
    const yb = top + bh;
    fpx(b, bw - 7, top + 4, s.spark || '#7fb8ff'); fpx(b, bw - 6, top + 5, '#e8f6ff'); fpx(b, bw - 5, top + 4, s.spark || '#7fb8ff');
    fpx(b, bw - 8, yb - 5, s.spark || '#7fb8ff'); fpx(b, bw - 6, yb - 6, '#e8f6ff'); fpx(b, bw - 5, yb - 7, s.spark || '#7fb8ff');
    fpx(b, 5, top + 6, s.spark || '#7fb8ff');
    return c;
  }, 120);
};
/**
 * Globo anclado: ax,ay = punto de la cabeza del hablante (pantalla). o: {name, nameCol, text, max, w, style,
 * avoid:[{x,y,w,h}], lineH, place} → {x,y,w,h,tail}. El texto respeta el marcado de color {y}…{/}.
 */
UIK.speechBubble = function (g, ax, ay, o = {}) {
  const lineH = o.lineH || (Game.settings && Game.settings.textScale > 1 ? 13 : 12);
  const maxW = o.w || 200;
  const lines = wrapText(o.text || '', maxW - 16);
  const nameW = o.name ? FONTS.bold.measure(o.name) : 0;
  const w = Math.round(clamp(Math.max(nameW + 24, ...lines.map(l => FONTS.main.measure(l))) + 18, 60, maxW));
  const bodyH = (o.name ? 19 : 7) + lines.length * lineH + 5;
  const TH = 8, h = bodyH + TH;
  const minY = o.minY ?? 4, maxY = o.maxY ?? (H - 4);
  const avoid = o.avoid || [];
  const cands = [];
  const order = o.place || ['bl', 'br', 'tl', 'tr'];
  for (const tail of order) {
    const left = tail[1] === 'l', up = tail[0] === 'b'; // cola abajo → globo arriba
    const tipDX = left ? 8 - Math.round(TH * 0.55) + 1 : w - 8 - 1 + Math.round(TH * 0.55) - 1;
    let bx = Math.round(ax - tipDX);
    let by = up ? Math.round(ay - h) : Math.round(ay);
    bx = clamp(bx, 4, W - w - 4);
    const r = { x: bx, y: by, w, h };
    let pen = 0;
    if (by < minY) pen += (minY - by) * 4;
    if (by + h > maxY) pen += (by + h - maxY) * 4;
    for (const a of avoid) if (rectsOverlap(r, a)) pen += 60 + Math.min(r.x + r.w, a.x + a.w) - Math.max(r.x, a.x);
    if (Math.abs((bx + tipDX) - ax) > 6) pen += 10;
    cands.push({ tail, r, pen: pen + cands.length * 2 });
  }
  cands.sort((a, b) => a.pen - b.pen);
  const C = cands[0];
  const r = C.r; r.y = clamp(r.y, minY, maxY - h);
  const cv = UIK.bubbleCanvas(w, h, C.tail, o.style || 'tech');
  g.drawImage(cv, r.x, r.y);
  const s = panelStyle(o.style || 'tech');
  const ty = r.y + (C.tail[0] === 't' ? TH : 0);
  let yy = ty + 6;
  if (o.name) {
    drawText(g, o.name, r.x + 8, yy, { font: 'bold', color: s.title });
    if (o.nameCol) frect(g, r.x + 8, yy + 10, Math.min(16, nameW), 2, o.nameCol);
    yy += 14;
  }
  let rem = o.max ?? Infinity;
  lines.forEach((l, i) => { if (rem > 0) drawText(g, l, r.x + 8, yy + i * lineH, { color: s.text, max: rem }); rem -= stripMarkup(l).length + 1; });
  if (o.more) { const bx = r.x + w - 12, by2 = ty + bodyH - 9 + Math.round(Math.sin(Game.time * 6)); frect(g, bx, by2, 5, 1, '#ffd23a'); frect(g, bx + 1, by2 + 1, 3, 1, '#ffd23a'); fpx(g, bx + 2, by2 + 2, '#ffd23a'); }
  return { x: r.x, y: r.y, w, h, tail: C.tail };
};

/* ---------- Panel PREGUNTA: insignia que rompe la esquina + título + enunciado (opciones con Gui.choice) ---------- */
UIK.measureQuestion = function (w, stem, options = [], o = {}) {
  const sh = textHeight(stem || '', w - 16, { lineH: 11 });
  const rw = w - 12 - 18 - 14;
  const rows = options.map(t => Math.max(15, wrapText(t, rw).length * 11 + 4));
  const extra = o.extra || 0;
  return { stemH: sh, rows, h: 26 + sh + 6 + rows.reduce((a, b) => a + b + 3, 0) + 4 + extra };
};
UIK.questionPanel = function (g, x, y, w, h, o = {}) {
  const style = o.style || 'tech';
  const s = panelStyle(style);
  UIK.panel(g, x, y, w, h, style, null, { chamfer: 3 });
  UIK.badge(g, o.icon || 'book', x - 3, y - 3, 22, style, { rim: o.badgeRim });
  drawText(g, fitText(o.title || 'PREGUNTA', w - 40, 'bold'), x + 26, y + 7, { font: 'bold', color: s.title });
  frect(g, x + 22, y + 18, w - 28, 1, s.key); frect(g, x + 22, y + 19, w - 28, 1, mixHex(s.mid, s.fill[1], 0.55));
  if (o.tag) UIK.pill(g, x + w - 7, y + 6, o.tag, { align: 'right', rim: o.tagRim || '#ffd23a', fill: '#1a1404', color: '#fff2c0' });
  let yy = y + 25;
  if (o.stem) yy += drawTextBlock(g, o.stem, x + 8, yy, w - 16, { color: o.stemColor || '#d5dcf5', lineH: 11 });
  return { contentY: yy + 5, x: x + 6, w: w - 12 };
};

/* ---------- Tarjetas de objetivo y ranuras de herramienta ---------- */
UIK.objectiveCard = function (g, x, y, w, text, icon = 'target') {
  const lines = wrapText(text, w - 26);
  const h = 17 + lines.length * 11;
  UIK.panel(g, x, y, w, h, 'hud', null, { chamfer: 2, key: false });
  UIK.badge(g, icon, x - 2, y - 2, 16, 'hud');
  drawText(g, 'OBJETIVO', x + 18, y + 4, { font: 'tiny', color: '#ffd23a' });
  lines.forEach((l, i) => drawText(g, l, x + 18, y + 12 + i * 11, { color: UI_INK.body }));
  return h;
};
UIK.toolSlot = function (g, x, y, icon, key, on = false) {
  UIK.panel(g, x, y, 20, 20, 'hud', on ? '#ffd23a' : null, { chamfer: 2, key: false, spark: false });
  Icons.draw(g, icon, x + 4, y + 3);
  if (key) {
    const kw = FONTS.tiny.measure(key) + 3;
    frect(g, x + 20 - kw - 1, y + 14, kw + 1, 7, '#000633');
    drawText(g, key, x + 20 - kw + 1, y + 15, { font: 'tiny', color: on ? '#fff2a0' : '#ffd23a' });
  }
};

/* ---------- Placas de instrumentos científicos (HUD inferior izquierdo) ---------- */
UIK.instrumentPlates = function (g, items, x = 4, y = H - 36) {
  const pw = 96, w = items.length * pw + 6, h = 32;
  UIK.panel(g, x, y, w, h, 'hud', null, { chamfer: 3, key: false });
  items.forEach((it, i) => {
    const xx = x + 3 + i * pw;
    if (i > 0) { frect(g, xx, y + 5, 1, h - 10, '#12305a'); frect(g, xx + 1, y + 5, 1, h - 10, '#0a2450'); }
    UIK.badge(g, it.icon || 'info', xx + 3, y + 4, 16, 'hud');
    drawText(g, fitText(String(it.label || ''), pw - 26, 'tiny'), xx + 22, y + 5, { font: 'tiny', color: UI_INK.dim });
    drawText(g, fitText(String(it.value ?? ''), pw - 26), xx + 22, y + 12, { color: it.color || UI_INK.body });
    if (it.frac != null) UIK.bar(g, xx + 4, y + 24, pw - 10, 5, it.frac, it.color || '#56e5ff');
  });
  return { x, y, w, h };
};

/* ---------- Cinta de capítulo (sin caja: título en negrita ×2 con contorno) ---------- */
UIK.chapterRibbon = function (g, title, sub, a = 1, y0 = 30) {
  const y = Math.round(y0 - (1 - a) * 46);
  const tw = FONTS.bold.measure(title || '') * 2;
  const bw = Math.max(220, tw + 70), bx = Math.round(W / 2 - bw / 2);
  // cinta: banda navy translúcida con bordes de luz
  g.globalAlpha = 0.82 * a; frect(g, bx, y, bw, 40, '#041533'); g.globalAlpha = a;
  frect(g, bx, y, bw, 1, '#6d9be8'); frect(g, bx, y + 39, bw, 1, '#3a64b0');
  frect(g, bx - 6, y + 4, 6, 32, '#041533'); frect(g, bx + bw, y + 4, 6, 32, '#041533');
  frect(g, bx + 10, y + 13, Math.round(bw / 2 - tw / 2 - 16), 1, '#3a64b0'); frect(g, Math.round(W / 2 + tw / 2 + 6), y + 13, Math.round(bw / 2 - tw / 2 - 16), 1, '#3a64b0');
  drawText(g, sub || '', W / 2, y + 5, { align: 'center', font: 'tiny', color: '#ffd23a' });
  drawTitleText(g, title || '', W / 2, y + 12, 2, ['#ffffff', '#e6f8fe', '#a8c8ff'], { align: 'center', font: 'bold', shadow: '#000633', depth: 1, outline: '#000633' });
  g.globalAlpha = 1;
};

/* ---------- Minimapa «MAPA»: islas flotantes por sistema y enlaces en cadena ---------- */
const SYSTEM_NODES = [
  { id: 'solar', levels: [4], icon: 'sun', ring: '#ffd23a', x: 19, y: 31 },
  { id: 'bess', levels: [6], icon: 'battery', ring: '#b6f05a', x: 56, y: 20 },
  { id: 'wind', levels: [5], icon: 'turbine', ring: '#9fe6ff', x: 87, y: 22 },
  { id: 'core', levels: [0, 9, 10], icon: 'mosaic', ring: '#b49cff', x: 49, y: 39 },
  { id: 'h2', levels: [7], icon: 'h2', ring: '#40d0d4', x: 87, y: 47 },
  { id: 'agro', levels: [8], icon: 'plant', ring: '#4ccb70', x: 68, y: 51 },
  { id: 'brine', levels: [3], icon: 'drop_brine', ring: '#e050c8', x: 36, y: 52 },
  { id: 'water', levels: [1, 2], icon: 'water', ring: '#56e5ff', x: 13, y: 51 },
];
const SYSTEM_LINKS = [['solar', 'bess'], ['bess', 'wind'], ['wind', 'h2'], ['h2', 'agro'], ['agro', 'brine'], ['brine', 'water'], ['water', 'solar'], ['core', 'bess'], ['core', 'agro'], ['core', 'solar']];
UIK._islandCache = new Map();
/** Isla flotante 16×10: tapa de hierba con bandas, roca cálida que se estrecha y sombra violeta */
UIK.island = function (seed = 1) {
  return _cacheGet(UIK._islandCache, 'isl|' + seed, () => {
    const pb = new PixelBuffer(18, 12), r = RNG(seed * 31 + 7);
    for (let y = 3; y < 12; y++) { const hw = Math.round(8 - (y - 3) * 0.95 + r.range(-0.5, 0.5)); for (let x = 9 - hw; x < 9 + hw; x++) pb.set(x, y, y < 5 ? '#a24a1f' : (x < 9 - hw + 2 ? '#d07530' : y > 8 ? '#3e2448' : (x + y) % 4 === 0 ? '#602212' : '#813417')); }
    for (let x = 1; x < 17; x++) { const t = 1 + Math.round(Math.sin(x * 0.9 + seed) * 0.6); for (let y = t; y < 5; y++) pb.set(x, y, y === t ? '#bfd52c' : y === t + 1 ? '#7b981a' : '#597611'); }
    pb.set(4, 1, '#efd83f'); pb.set(13, 2, '#efd83f'); pb.set(7, 6, '#fbc371');
    pb.outline(n => darkOf(n, -0.6));
    return pb.toCanvas();
  }, 40);
};
UIK._mmCache = new Map();
UIK.minimapPanel = function (g, x = 532, y = 4, w = 104, h = 70, o = {}) {
  const s = PANEL_STYLES.hud;
  const lv = o.level ?? (GS.s.level || 0);
  const un = GS.s.unlocked.slice().sort((a, b) => a - b).join(','), done = GS.s.completed.slice().sort((a, b) => a - b).join(',');
  const N = (id) => SYSTEM_NODES.find(n => n.id === id);
  const cur = SYSTEM_NODES.find(n => n.levels.includes(lv)) || SYSTEM_NODES[3];
  const kx = (w - 8) / 96, ky = (h - 8) / 62;
  const P = (nd) => [Math.round(4 + nd.x * kx), Math.round(4 + nd.y * ky)];
  const st = _cacheGet(UIK._mmCache, w + '|' + h + '|' + un + '|' + done + '|' + cur.id, () => {
    const c = makeCanvas(w, h); const b = c.getContext('2d'); b.imageSmoothingEnabled = false;
    UIK.drawFrame(b, 0, 0, w, h, s, null, { chamfer: 3, key: false });
    frect(b, 4, 4, w - 8, h - 8, '#051a36');
    for (let i = 4 + 8; i < w - 4; i += 8) frect(b, i, 4, 1, h - 8, '#0a2444');
    for (let j = 4 + 8; j < h - 4; j += 8) frect(b, 4, j, w - 8, 1, '#0a2444');
    // enlaces en cadena: eslabones ovalados claros con hueco navy
    for (const [a2, b2] of SYSTEM_LINKS) {
      const [ax, ay] = P(N(a2)), [bx, by] = P(N(b2));
      const on = N(a2).levels.some(l => GS.s.unlocked.includes(l)) && N(b2).levels.some(l => GS.s.unlocked.includes(l));
      const L = dist(ax, ay, bx, by), n = Math.max(2, Math.round(L / 6));
      const hz = Math.abs(bx - ax) >= Math.abs(by - ay);
      for (let k = 1; k < n; k++) {
        const t = k / n; if (t < 0.18 || t > 0.82) continue;
        const px = Math.round(lerp(ax, bx, t)), py = Math.round(lerp(ay, by, t)) + 5;
        const lw = hz ? 4 : 3, lh = hz ? 3 : 4;
        frect(b, px - 1 - (lw >> 1), py - 1 - (lh >> 1), lw + 2, lh + 2, '#000633');
        frect(b, px - (lw >> 1), py - (lh >> 1), lw, lh, on ? '#e8f6ff' : '#4a6a9a');
        fpx(b, px - (lw >> 1) + 1, py - (lh >> 1) + 1, '#000633'); if (lw > 3) fpx(b, px - (lw >> 1) + 2, py - (lh >> 1) + 1, '#000633');
      }
    }
    for (const nd of SYSTEM_NODES) {
      const [nx, ny] = P(nd);
      const unl = nd.levels.some(l => GS.s.unlocked.includes(l)), dn = nd.levels.every(l => GS.s.completed.includes(l));
      // halo de neón bajo la isla (elipses sólidas translúcidas, sin tramado)
      b.globalAlpha = unl ? 0.32 : 0.12; b.fillStyle = nd.ring; b.beginPath(); b.ellipse(nx, ny + 9, 12, 4.5, 0, 0, TAU); b.fill();
      b.globalAlpha = unl ? 0.75 : 0.25; b.beginPath(); b.ellipse(nx, ny + 9, 10, 3, 0, 0, TAU); b.fill();
      b.globalAlpha = 1; b.fillStyle = '#051a36'; b.beginPath(); b.ellipse(nx, ny + 9, 8, 2, 0, 0, TAU); b.fill();
      b.globalAlpha = unl ? 1 : 0.55; b.drawImage(UIK.island(nd.x + nd.y), nx - 9, ny); b.globalAlpha = 1;
      // icono del sistema con brillo; atenuado si el capítulo está bloqueado
      if (unl) { b.globalAlpha = 0.28; b.fillStyle = nd.ring; b.beginPath(); b.arc(nx, ny - 6, 9, 0, TAU); b.fill(); b.globalAlpha = 0.4; b.beginPath(); b.arc(nx, ny - 6, 6, 0, TAU); b.fill(); b.globalAlpha = 1; }
      const ic = Icons.hasBig(nd.icon) ? Icons.mid(nd.icon) : Icons.get(nd.icon);
      b.globalAlpha = unl ? 1 : 0.4; b.drawImage(ic, Math.round(nx - ic.width / 2), ny - ic.height + 3); b.globalAlpha = 1;
      if (!unl) { frect(b, nx + 3, ny - 4, 5, 4, '#000633'); frect(b, nx + 4, ny - 3, 3, 2, '#c8861a'); fpx(b, nx + 4, ny - 5, '#9ab4be'); fpx(b, nx + 6, ny - 5, '#9ab4be'); fpx(b, nx + 5, ny - 6, '#9ab4be'); }
      if (dn) { fpx(b, nx + 6, ny - 10, '#ffd23a'); fpx(b, nx + 7, ny - 11, '#fff2a0'); fpx(b, nx + 8, ny - 10, '#ffd23a'); fpx(b, nx + 7, ny - 9, '#ffd23a'); }
    }
    // pestaña «MAPA»
    frect(b, 6, 5, 36, 13, '#000633'); frect(b, 7, 6, 34, 11, '#94acbf'); frect(b, 8, 7, 32, 9, '#041d3b'); frect(b, 8, 7, 32, 3, '#082650');
    drawText(b, 'MAPA', 24, 9, { font: 'bold', color: '#e8fdff', align: 'center' });
    return c;
  }, 12);
  g.drawImage(st, x, y);
  // nodo actual: anillo dorado pulsante
  const t = Game.time, [cx, cy] = P(cur), pr = 11 + Math.sin(t * 4) * 1;
  for (let a = 0; a < 22; a++) { const an = a / 22 * TAU + t * 0.8; fpx(g, x + cx + Math.cos(an) * pr, y + cy + 3 + Math.sin(an) * pr * 0.62, a % 2 ? '#ffd23a' : '#fff2a0'); }
  // progreso del nivel (franja inferior)
  if (o.sc && o.sc.world && o.sc.player) {
    const px0 = x + 6, pw = w - 12, py = y + h - 7;
    frect(g, px0, py, pw, 3, '#000633'); frect(g, px0 + 1, py + 1, pw - 2, 1, '#0b2444');
    for (const e of o.sc.world.entities) if (e instanceof Station && !e.hidden) fpx(g, px0 + 1 + Math.round((pw - 2) * e.x / o.sc.world.w), py + 1, e.done ? '#3fe0a0' : (e.glow || '#56e5ff'));
    frect(g, px0 + Math.round((pw - 3) * clamp(o.sc.player.x / o.sc.world.w, 0, 1)), py - 1, 2, 5, '#ffd23a');
  }
  return { x, y, w, h };
};

/* ---------- Miniaturas de capítulo (70×41) y tarjetas de la tira inferior ---------- */
const LEVEL_CARD_ACCENT = { 0: '#54c3e2', 1: '#6dd0eb', 2: '#6dd0eb', 3: '#a086d0', 4: '#e0cb77', 5: '#9fe6ff', 6: '#e070d0', 7: '#54be93', 8: '#86e36f', 9: '#8fb4ff', 10: '#eb9484', 11: '#ffd23a' };
const LEVEL_CARD_NAME = { 0: 'ORIGEN', 1: 'LA TOMA', 2: 'DESALINIZACIÓN', 3: 'SALMUERA', 4: 'SOLAR', 5: 'EÓLICA', 6: 'BATERÍAS', 7: 'HIDRÓGENO VERDE', 8: 'AGROECOLOGÍA', 9: 'LA MESA', 10: 'GRAN CALIMA', 11: 'NEXO FINAL' };
const LevelThumbs = {
  cache: new Map(), lastBuild: -1,
  /** Devuelve la miniatura (o null si aún no se generó; se genera como máximo una por cuadro) */
  get(id, force = false) {
    if (this.cache.has(id)) return this.cache.get(id);
    if (!force && this.lastBuild === Game.frame) return null;
    this.lastBuild = Game.frame;
    let c = null;
    try { c = this.build(id); } catch (e) { c = this.placeholder(id); }
    this.cache.set(id, c);
    return c;
  },
  placeholder(id) {
    const pb = new PixelBuffer(70, 41);
    const pal = (LEVEL_META[id] && LEVEL_META[id].pal) || ['#20d6c7', '#ff6b6b', '#ffe14d', '#102a43'];
    for (let y = 0; y < 41; y++) for (let x = 0; x < 70; x++) pb.set(x, y, smoothBand([pal[3], mixHex(pal[3], pal[0], 0.5), pal[0]], y / 40, x, y));
    return pb.toCanvas();
  },
  build(id) {
    const w = 70, h = 41, pb = new PixelBuffer(w, h), r = RNG(id * 97 + 13);
    const sky = (ramp, hz, sun) => {
      for (let y = 0; y < hz; y++) for (let x = 0; x < w; x++) pb.set(x, y, smoothBand(ramp, y / Math.max(1, hz - 1), x, y, 0.05));
      if (sun) { pb.disc(sun[0], sun[1], sun[2] + 3, mixHex(ramp[Math.min(ramp.length - 1, 5)], '#fdfacd', 0.4)); pb.disc(sun[0], sun[1], sun[2] + 1, '#f4d8a1'); pb.disc(sun[0], sun[1], sun[2], '#fdfacd'); }
    };
    const clouds = (n, cols = ['#cdd2ee', '#f0eef1', '#ffffff'], y0 = 3, y1 = 14) => { for (let i = 0; i < n; i++) { const cx = r.int(4, w - 4), cy = r.int(y0, y1), cw = r.int(6, 12); pb.ellipse(cx, cy + 1, cw * 0.6, 2.2, cols[0]); pb.ellipse(cx - 1, cy, cw * 0.45, 2.4, cols[1]); pb.ellipse(cx - 2, cy - 1, cw * 0.25, 1.6, cols[2]); } };
    const ridge = (base, amp, ramp, seed, rough = 0.12) => { for (let x = 0; x < w; x++) { const top = Math.round(base - Math.abs(Math.sin(x * rough + seed)) * amp - fbm1(x * 0.15, 2, seed) * amp * 0.6); for (let y = Math.max(0, top); y < h; y++) pb.set(x, y, smoothBand(ramp, clamp((y - top) / 10, 0, 1) * 0.7 + (x % 7 < 3 ? 0.1 : 0), x, y)); } };
    const sea = (y0, ramp) => { for (let y = y0; y < h; y++) for (let x = 0; x < w; x++) { let c = smoothBand(ramp, (y - y0) / Math.max(1, h - y0), x, y); if (((x * 7 + y * 13) % 23) === 0) c = '#e6f8fc'; pb.set(x, y, c); } };
    const ground = (y0, ramp, wav = 1.5, seed = 1) => { for (let x = 0; x < w; x++) { const top = Math.round(y0 + Math.sin(x * 0.18 + seed) * wav); for (let y = top; y < h; y++) pb.set(x, y, smoothBand(ramp, clamp(1 - (y - top) / 14, 0, 1), x, y)); pb.set(x, top, ramp[ramp.length - 1]); } };
    const palm = (x, y, hh, lean = 1) => { for (let k = 0; k < hh; k++) pb.set(Math.round(x + lean * k * k / (hh * 3)), y - k, k % 3 ? '#a57432' : '#6b5020'); const tx = Math.round(x + lean * hh / 3), ty = y - hh; for (const [dx, dy] of [[-6, 2], [6, 2], [-4, -2], [4, -2], [-7, 4], [7, 4], [0, -3]]) pb.line(tx, ty, tx + dx, ty + dy, dy < 0 ? '#9cb42c' : '#597611'); pb.set(tx, ty, '#3b5312'); };
    const tank = (x, y, tw, th, body = RAMP.steelWR, cap = null) => { for (let yy = 0; yy < th; yy++) for (let xx = 0; xx < tw; xx++) pb.set(x + xx, y - yy, body[clamp(Math.round((1 - Math.abs(xx - tw * 0.35) / tw) * (body.length - 1)), 0, body.length - 1)]); pb.hline(x, x + tw - 1, y - th, cap || body[body.length - 1]); };
    const sunsetR = ['#3a2a6a', '#8a4a96', '#d06e94', '#f08a6a', '#ffb862', '#ffe08a'];
    switch (id) {
      case 0: { // plaza de Aridia: casas de colores, banderines y torre SYNARA
        sky(RAMP.skyR, 26, [58, 7, 3]); clouds(3); ridge(26, 5, RAMP.mountFarR, 2); ground(29, RAMP.sandR, 1, 3);
        const tx = 48; for (let y = 6; y < 30; y++) { const hw = 1 + Math.floor((y - 6) / 9); pb.hline(tx - hw, tx + hw, y, y % 4 ? '#e6eef6' : '#a8b8c8'); } pb.ellipse(tx, 10, 5, 1.6, '#56e5ff'); pb.disc(tx, 6, 1.6, '#ffffff');
        const HC = ['#ff7656', '#20d6c7', '#ffd23a', '#8d6bff', '#fff6e8', '#4ccb70'];
        for (let i = 0; i < 7; i++) { const hx = 3 + i * 9, hh2 = r.int(6, 10), c = HC[i % 6]; pb.rect(hx, 33 - hh2, 8, hh2, c); pb.rect(hx, 33 - hh2, 8, 1, shade(c, 0.3)); pb.rect(hx + 6, 33 - hh2 + 1, 2, hh2 - 1, shade(c, -0.25)); pb.rect(hx + 2, 33 - hh2 + 3, 2, 2, '#1e2a55'); pb.rect(hx + 3, 31, 2, 2, '#4e2519'); }
        for (let x = 0; x < w; x += 2) pb.set(x, 21 + Math.round(Math.sin(x * 0.12) * 2), ['#ff4e5d', '#ffd23a', '#20d6c7'][(x >> 1) % 3]);
        for (let x = 0; x < w; x++) for (let y = 34; y < h; y++) pb.set(x, y, smoothBand(['#a24a1f', '#d07530', '#edaf5f'], (y - 34) / 7, x, y));
        break;
      }
      case 1: { // costa con palmeras, acantilado y toma
        sky(RAMP.skyR, 18, [60, 5, 3]); clouds(4, undefined, 2, 10); ridge(18, 4, RAMP.mountFarR, 5); sea(18, RAMP.oceanR);
        for (let x = 0; x < 30; x++) { const top = Math.round(20 + x * 0.25 + Math.sin(x * 0.5) * 1.5); for (let y = top; y < h; y++) pb.set(x, y, smoothBand(RAMP.rockR, clamp(1 - (y - top) / 16, 0, 1) - ((x % 5) === 0 ? 0.2 : 0), x, y)); pb.set(x, top, '#9cb42c'); pb.set(x, top - 1, x % 3 ? '#bfd52c' : '#597611'); }
        for (let x = 30; x < w; x++) { const top = 33 + Math.round(Math.sin(x * 0.3)); for (let y = top; y < h; y++) pb.set(x, y, smoothBand(RAMP.sandR, 1 - (y - top) / 8, x, y)); pb.set(x, top - 1, '#d2ecee'); }
        palm(8, 22, 14, 1); palm(22, 25, 11, -1);
        pb.rect(44, 26, 14, 6, '#cebaac'); pb.rect(44, 26, 14, 1, '#f5e5c3'); pb.rect(47, 20, 8, 6, '#2186eb'); pb.rect(47, 20, 8, 1, '#9be4e6'); pb.rect(58, 29, 10, 2, '#22c1e7');
        break;
      }
      case 2: { // planta de ósmosis: tanques blancos, bastidor de membranas, cascada de permeado
        sky(RAMP.skyR, 16, null); clouds(4, undefined, 2, 9); ridge(16, 3, RAMP.mountFarR, 7); sea(30, RAMP.oceanR);
        pb.rect(0, 22, w, 9, '#ac9b82'); pb.rect(0, 22, w, 1, '#f5e5c3'); pb.rect(0, 30, w, 1, '#6e625b');
        for (let i = 0; i < 4; i++) tank(4 + i * 9, 22, 7, 14 + (i % 2) * 4);
        for (let k = 0; k < 3; k++) { pb.rect(42, 13 + k * 3, 22, 2, RAMP.membraneR[3]); pb.hline(42, 63, 13 + k * 3, '#b6e9f7'); }
        pb.rect(41, 12, 1, 10, '#555a78'); pb.rect(64, 12, 1, 10, '#555a78');
        for (let y = 30; y < h; y++) pb.hline(46, 49, y, y % 3 ? '#abfafd' : '#ffffff');
        pb.rect(30, 24, 30, 2, '#22c1e7'); pb.hline(30, 59, 24, '#abfafd');
        break;
      }
      case 3: { // cañones de sal: mesas rosadas, estanques y pila de sal
        sky(['#3c9dfa', '#7fbcf2', '#c0d0ee', '#ead0d8', '#f4d8c8'], 18, [12, 6, 3]);
        ridge(20, 7, ['#813417', '#a24a1f', '#d07530', '#efa04b', '#fbc371'], 3, 0.09);
        for (let k = 0; k < 4; k++) { const px = 4 + k * 17, py = 32 + (k % 2) * 3; pb.rect(px, py, 14, 4, '#f4bef5'); pb.hline(px, px + 13, py, '#ffffff'); pb.rect(px, py + 3, 14, 1, '#c244a2'); }
        for (let y = 36; y < h; y++) pb.hline(0, w - 1, y, y % 2 ? '#e07ecf' : '#c244a2');
        pb.poly([[46, 31], [56, 18], [66, 31]], '#fff2f8'); pb.poly([[56, 18], [66, 31], [58, 31]], '#e8c8e0');
        for (let i = 0; i < 6; i++) pb.set(r.int(40, 68), r.int(30, 40), '#ffffff');
        break;
      }
      case 4: { // dunas fotónicas al atardecer: hileras FV
        sky(sunsetR.slice().reverse(), 22, [52, 18, 5]); ridge(22, 3, ['#3a2a6a', '#5a3480', '#8a4a96'], 4);
        for (let x = 0; x < w; x++) { const top = 24 + Math.round(Math.sin(x * 0.07) * 2); for (let y = top; y < h; y++) pb.set(x, y, smoothBand(['#7a3a58', '#c8645e', '#e88a6a', '#ffb862'], 1 - (y - top) / 17, x, y)); }
        for (let k = 0; k < 4; k++) { const y0 = 25 + k * 4, x0 = -4 + k * 3; for (let x = x0; x < w - 10 + k * 3; x++) { if ((x - x0) % 9 === 8) continue; pb.set(x, y0, '#8b9cc2'); pb.set(x, y0 + 1, '#35528f'); pb.set(x, y0 + 2, '#1e2a55'); if ((x - x0) % 9 === 3) pb.set(x, y0 + 3, '#2a1a2a'); } }
        for (let x = 30; x < 60; x += 3) pb.set(x, 25, '#ffe08a');
        break;
      }
      case 5: { // torres de brisa: turbinas blancas en crestas
        sky(RAMP.skyR, 26, [10, 6, 3]); clouds(5); ridge(28, 8, RAMP.mountMidR.slice(3), 6, 0.07);
        for (let x = 0; x < w; x++) { const top = 34 + Math.round(Math.sin(x * 0.2) * 1.5); for (let y = top; y < h; y++) pb.set(x, y, smoothBand(RAMP.grassR, 1 - (y - top) / 8, x, y)); }
        for (const [tx, ty, s2] of [[18, 26, 14], [40, 22, 17], [58, 28, 11]]) { pb.vline(tx, ty - s2, ty, '#e8eef6'); pb.vline(tx + 1, ty - s2, ty, '#a0a8c0'); const hx = tx, hy = ty - s2; for (let a = 0; a < 3; a++) { const an = a * TAU / 3 - 0.5; pb.line(hx, hy, hx + Math.cos(an) * s2 * 0.6, hy + Math.sin(an) * s2 * 0.6, '#ffffff'); } pb.set(hx, hy, '#7a84a0'); }
        break;
      }
      case 6: { // bóveda de carga de noche: contenedores BESS con LED verdes
        sky(['#0a0c2a', '#14183e', '#22285a', '#3a3a78'], 24, null);
        for (let i = 0; i < 22; i++) pb.set(r.int(0, w - 1), r.int(0, 20), i % 4 ? '#8fb4ff' : '#ffffff');
        pb.disc(56, 7, 3, '#e6f0ff'); pb.disc(57, 6, 2.6, '#22285a');
        ridge(24, 4, ['#0e1430', '#1a2246', '#2a3460'], 9);
        pb.rect(0, 30, w, 11, '#1a2236'); pb.hline(0, w - 1, 30, '#3a4a6e');
        for (let k = 0; k < 3; k++) { const bx = 4 + k * 22; pb.rect(bx, 18, 19, 12, '#d8dde8'); pb.rect(bx, 18, 19, 1, '#f4f6fb'); pb.rect(bx + 17, 19, 2, 11, '#8a92a8'); for (let j = 0; j < 4; j++) pb.rect(bx + 2 + j * 4, 21, 2, 7, '#a0a8c0'); for (let j = 0; j < 4; j++) pb.set(bx + 3 + j * 4, 22, j < 3 - (k % 2) ? '#7cff9a' : '#ff6b6b'); }
        for (let x = 0; x < w; x += 4) pb.set(x, 33, '#b6f05a');
        break;
      }
      case 7: { // ciudadela del hidrógeno: tanques verdes y blancos
        sky(RAMP.skyR, 24, [62, 6, 3]); clouds(3); ridge(26, 5, RAMP.mountFarR, 8); ground(33, RAMP.concreteR.slice(2), 0.5, 2);
        for (let i = 0; i < 4; i++) { const tx = 6 + i * 11, th = 16 + (i % 2) * 5; tank(tx, 33, 8, th, RAMP.h2GreenR); pb.rect(tx + 2, 33 - th - 2, 4, 2, '#c0bfb1'); if (i === 1) { pb.rect(tx + 2, 22, 1, 4, '#ffffff'); pb.rect(tx + 4, 22, 1, 4, '#ffffff'); pb.set(tx + 3, 24, '#ffffff'); } }
        tank(52, 33, 12, 22, RAMP.h2WhiteR); pb.rect(50, 18, 16, 2, '#4cd48e');
        for (let x = 0; x < w; x += 3) pb.set(x, 35, '#4cd48e');
        break;
      }
      case 8: { // oasis: invernadero, hileras de cultivo y goteo
        sky(RAMP.skyR, 18, [10, 5, 3]); clouds(3, undefined, 2, 8); ridge(18, 3, RAMP.mountFarR, 1);
        for (let y = 18; y < h; y++) for (let x = 0; x < w; x++) pb.set(x, y, smoothBand(RAMP.cropSoilR, 0.6 - (y - 18) / 40, x, y));
        for (let row = 0; row < 5; row++) { const y0 = 22 + row * 4; for (let x = 2 + row; x < w - 2; x += 3) { pb.set(x, y0, '#9cb42c'); pb.set(x, y0 - 1, row % 2 ? '#efd83f' : '#bfd52c'); pb.set(x + 1, y0, '#597611'); } pb.hline(0, w - 1, y0 + 1, '#22c1e7'); }
        pb.rect(46, 9, 20, 11, '#9be4e6'); pb.poly([[45, 9], [56, 4], [67, 9]], '#c2d5ef'); for (let x = 48; x < 66; x += 4) pb.vline(x, 9, 19, '#597b8c'); pb.hline(46, 65, 19, '#597b8c');
        palm(6, 20, 10, 1);
        break;
      }
      case 9: { // mesa del nexo: sala con gran pantalla y público
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) pb.set(x, y, smoothBand(['#0a1430', '#12204a', '#1e3060'], y / h, x, y));
        pb.rect(10, 4, 50, 22, '#000633'); pb.rect(11, 5, 48, 20, '#06183a');
        for (let k = 0; k < 4; k++) pb.rect(14 + k * 11, 22 - (6 + k * 3), 7, 6 + k * 3, ['#22c1e7', '#ffd23a', '#4ccb70', '#ff6b6b'][k]);
        pb.hline(12, 57, 22, '#8fb4ff');
        pb.rect(0, 30, w, 11, '#3a2a20'); pb.hline(0, w - 1, 30, '#8e542f');
        for (let i = 0; i < 9; i++) { const px = 4 + i * 7 + r.int(-1, 1), c = ['#de3f22', '#20c0ae', '#ffd23a', '#8d6bff', '#4ccb70'][i % 5]; pb.disc(px, 30, 1.8, '#e0a07a'); pb.rect(px - 2, 32, 5, 6, c); }
        break;
      }
      case 10: { // la gran calima: cielo ocre y silueta del frente de polvo
        sky(['#5a2010', '#8a3a18', '#c06a2a', '#e09a40', '#f0c070'], 30, [50, 12, 4]);
        pb.poly([[18, 41], [26, 14], [34, 8], [44, 10], [52, 16], [60, 41]], '#6a2a14'); pb.poly([[26, 14], [34, 8], [36, 20], [30, 26]], '#8a3a18');
        pb.rect(31, 15, 2, 2, '#ffd23a'); pb.rect(39, 15, 2, 2, '#ffd23a');
        for (let x = 0; x < w; x++) { const top = 34 + Math.round(Math.sin(x * 0.15)); for (let y = top; y < h; y++) pb.set(x, y, '#2a0c04'); }
        for (const px of [8, 62]) { pb.rect(px - 1, 27, 3, 8, '#1a0804'); pb.disc(px, 25, 2, '#1a0804'); }
        for (let i = 0; i < 30; i++) pb.set(r.int(0, w - 1), r.int(0, 34), '#f0c070');
        break;
      }
      default: { // nexo final: ciudad isla flotante
        sky(RAMP.skyR, 41, [60, 6, 3]); clouds(6, undefined, 2, 30);
        pb.poly([[14, 26], [56, 26], [44, 38], [26, 38]], '#7a4a5a'); pb.rect(14, 23, 43, 4, '#4cc85a'); pb.hline(14, 56, 23, '#bfd52c');
        for (let i = 0; i < 6; i++) { const tx = 18 + i * 6, th = 6 + (i % 3) * 5; pb.rect(tx, 23 - th, 4, th, '#d8e6f0'); pb.vline(tx + 3, 23 - th, 22, '#8fa8c0'); pb.set(tx + 1, 23 - th, '#56e5ff'); }
        pb.ellipse(35, 12, 6, 4, '#9be4e6'); pb.ellipse(34, 11, 3, 2, '#e6f8fe');
        for (let y = 38; y < h; y++) pb.set(35, y, '#e6f8fe');
      }
    }
    return pb.toCanvas();
  },
};
/** Tarjeta de capítulo: miniatura, banda inferior «N. NOMBRE», borde del color del capítulo y estados */
UIK.levelCard = function (g, x, y, w, h, o = {}) {
  const acc = o.accent || LEVEL_CARD_ACCENT[o.id] || '#6dd0eb';
  x = Math.round(x); y = Math.round(y);
  const sel = !!o.selected, locked = o.state === 'locked';
  const rim = locked ? '#3a4a6a' : acc;
  frect(g, x + 1, y, w - 2, h, '#000633'); frect(g, x, y + 1, w, h - 2, '#000633');
  frect(g, x + 1, y + 1, w - 2, h - 2, sel ? '#fff2a0' : rim);
  if (sel) frect(g, x + 2, y + 2, w - 4, h - 4, mixHex(acc, '#fff2a0', 0.5));
  frect(g, x + (sel ? 3 : 2), y + (sel ? 3 : 2), w - (sel ? 6 : 4), h - (sel ? 6 : 4), '#011b2b');
  const th = h - 16;
  const tw = w - 4 - (sel ? 2 : 0), tx = x + 2 + (sel ? 1 : 0), ty = y + 2 + (sel ? 1 : 0);
  const thumb = LevelThumbs.get(o.id);
  if (thumb) g.drawImage(thumb, 0, 0, Math.min(thumb.width, tw), Math.min(thumb.height, th - (sel ? 1 : 0)), tx, ty, Math.min(thumb.width, tw), Math.min(thumb.height, th - (sel ? 1 : 0)));
  else frect(g, tx, ty, tw, th, '#0a2450');
  if (locked) { g.globalAlpha = 0.62; frect(g, tx, ty, tw, th, '#000633'); g.globalAlpha = 1; Icons.draw(g, 'lock', x + w / 2 - 7, y + th / 2 - 5); }
  // banda de nombre
  const by = y + h - 14;
  frect(g, x + 2, by, w - 4, 1, shade(acc, -0.4)); frect(g, x + 2, by + 1, w - 4, 11, '#011b2b');
  const label = (o.id != null ? o.id + '. ' : '') + (o.label || '');
  drawText(g, fitText(label, w - 10, 'tiny'), x + 5, by + 4, { font: 'tiny', color: locked ? '#5a7090' : '#d9f8fe' });
  if (o.state === 'done') { frect(g, x + w - 13, y + 3, 10, 9, '#000633'); Icons.draw(g, 'check', x + w - 14, y + 1); }
  if (o.state === 'current') { const t = Game.time; fpx(g, x + w - 6, y + 4 + Math.round(Math.sin(t * 5)), '#fff2a0'); fpx(g, x + w - 5, y + 5 + Math.round(Math.sin(t * 5)), '#ffffff'); }
  if (sel) { const t = (Game.time * 40) % (w + h); const sx = t < w ? x + t : x + w - 1, sy = t < w ? y : y + (t - w); fpx(g, sx, sy, '#ffffff'); }
};

/* ---------- Busto pequeño de KIRU (simuladores) ---------- */
UIK.kiruBust = function (g, x, y, expr = 'smile') {
  UIK.frame(g, x, y, 30, 30, 'hud', { bg: '#0a2450' });
  const b = UIK.bust('kiru', expr);
  g.save(); g.beginPath(); g.rect(x + 4, y + 4, 22, 22); g.clip();
  g.drawImage(b, 0, 0, b.width, b.height, x + 4 - 1, y + 3, 24, 23);
  g.restore();
};
