/* =====================================================================
   19p_scb_epi.js — Arte del FINAL DEL EPÍLOGO (pantalla pública de la
   plaza y chiste del título que no cabe) y fondo de BlankScene.
   SCBEpi.drawScreen(g, S, x, y, t)  pantalla LED 166×86 en coordenadas de
     pantalla: S.title2 (0 panel en vivo · 1 el título desborda · 2 SYNARA 2.0),
     S.mosaicProj (proyección de MOSAICO con capas de teselas)
   SCBEpi.drawBlank(g, t)             noche en bandas con estrellas tenues
   Paneles navy con bisel (STYLE LOCK §11), sin tramado: bandas, alfa plana
   y halos en anillos.
   ===================================================================== */
const SCBEpi = (() => {
  const SW = 166, SH = 86;
  const LAYERS = [['AGUA', '#20d6c7'], ['ENERGÍA', '#ffe14d'], ['CULTIVOS', '#4ccb70'], ['ECOSISTEMAS', '#1f9a5c'], ['PERSONAS', '#f78acb'], ['SALMUERA', '#c8861a'], ['DATOS', '#b49cff']];
  let _base = null, _blank = null;
  /** Fondo del panel LED: bandas navy con rejilla de píxeles de LED y viñeta en anillos */
  function base() {
    if (_base) return _base;
    const pb = new PixelBuffer(SW, SH), R = PFK.P32(['#030716', '#050a1d', '#081028', '#0b1634', '#0f1c40']);
    for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
      const dx = (x - SW / 2) / (SW / 2), dy = (y - SH / 2) / (SH / 2), d = Math.sqrt(dx * dx * 0.8 + dy * dy);
      let k = clamp(Math.round(4 - d * 3.2), 0, 4);
      if (y % 3 === 2) k = Math.max(0, k - 1); // filas de LED
      pb.data[y * SW + x] = R[k];
    }
    _base = pb.toCanvas(); return _base;
  }
  /** Mini-panel con bisel (UI navy) */
  function tile(g, x, y, w, h, acc) {
    frect(g, x + 1, y, w - 2, h, '#000633'); frect(g, x, y + 1, w, h - 2, '#000633');
    frect(g, x + 1, y + 1, w - 2, h - 2, '#3a64b0');
    frect(g, x + 2, y + 2, w - 4, h - 4, '#072248'); frect(g, x + 2, y + 2 + Math.round((h - 4) / 2), w - 4, Math.floor((h - 4) / 2), '#041533');
    frect(g, x + 2, y + 1, w - 4, 1, '#a8c8ff'); frect(g, x + 2, y + h - 2, w - 4, 1, '#6d9be8');
    frect(g, x + 2, y + 2, 2, h - 4, acc);
  }
  function spark(g, x, y, w, h, t, col, seed, sp = 1) {
    g.fillStyle = col;
    for (let i = 0; i < w; i++) { const v = 0.5 + 0.28 * Math.sin((i + t * 14 * sp) * 0.21 + seed) + 0.16 * Math.sin((i + t * 9) * 0.53 + seed * 2); g.fillRect(x + i, y + Math.round((1 - v) * (h - 1)), 1, 1); }
  }
  function drawScreen(g, S, x, y, t) {
    g.drawImage(base(), x, y);
    if (S.mosaicProj) {
      // MOSAICO: siete capas de teselas que ondulan (cada capa es una dimensión del sistema)
      const cell = 4;
      for (let i = 0; i < 7; i++) {
        const [, col] = LAYERS[i], cy = y + 3 + i * 11;
        for (let cx = 0; cx < SW - 4; cx += cell) {
          const w = Math.sin(cx * 0.09 + t * 1.6 + i * 0.8), on = w > -0.55;
          if (!on) continue;
          const a = 0.35 + 0.45 * (w * 0.5 + 0.5);
          g.globalAlpha = a; g.fillStyle = col; g.fillRect(x + 2 + cx, cy + Math.round(w * 1.2), cell - 1, 8);
          if (w > 0.75) { g.globalAlpha = 0.8; g.fillStyle = '#ffffff'; g.fillRect(x + 2 + cx, cy + Math.round(w * 1.2), cell - 1, 1); }
        }
      }
      g.globalAlpha = 1;
      // banda navy con el veredicto (texto fijo de la escena)
      g.globalAlpha = 0.72; frect(g, x + 14, y + 12, SW - 28, 46, '#041533'); g.globalAlpha = 1;
      frect(g, x + 14, y + 12, SW - 28, 1, '#a8c8ff'); frect(g, x + 14, y + 57, SW - 28, 1, '#6d9be8');
      ['INCERTIDUMBRE: VISIBLE', 'ALTERNATIVAS: 4', 'DECISIÓN: PENDIENTE', 'DE DELIBERACIÓN'].forEach((s2, i) => drawText(g, s2, x + 83, y + 15 + i * 10, { font: 'tiny', align: 'center', color: i === 2 || i === 3 ? '#f5dc5a' : '#e6f8fe', shadow: '#000633' }));
      drawText(g, 'MOSAICO', x + 83, y + 70, { font: 'tiny', align: 'center', color: '#c2f58e', shadow: '#000633' });
      VISTA.drawSoftGlow(g, x + SW / 2, y + SH / 2, 70, '#9ae8ff', 0.1 + 0.03 * Math.sin(t * 2), 6);
    } else if (S.title2 === 2) {
      // SYNARA 2.0: título, lema y tres capas visibles
      frect(g, x + 4, y + 4, SW - 8, 16, '#072248'); frect(g, x + 4, y + 4, SW - 8, 1, '#a8c8ff'); frect(g, x + 4, y + 19, SW - 8, 1, '#3a64b0');
      drawText(g, 'SYNARA 2.0', x + 83, y + 8, { font: 'bold', align: 'center', color: '#56e5ff', shadow: '#000633' });
      drawTextBlock(g, 'NINGÚN DATO ES RUIDO HASTA ENTENDER SU HISTORIA', x + 10, y + 25, 146, { font: 'tiny', color: '#f5dc5a', align: 'center', lineH: 8 });
      const cols = [['AGUA', '#20d6c7', 0], ['ENERGÍA', '#ffe14d', 1], ['SALMUERA', '#c244a2', 2]];
      for (const [lab, col, i] of cols) {
        const tx = x + 6 + i * 52, ty = y + 50;
        tile(g, tx, ty, 50, 30, col);
        drawText(g, lab, tx + 27, ty + 4, { font: 'tiny', align: 'center', color: '#e6f8fe' });
        spark(g, tx + 6, ty + 13, 40, 12, t, col, i * 3, 0.6 + i * 0.3);
      }
      VISTA.drawSoftGlow(g, x + SW / 2, y + 12, 50, '#56e5ff', 0.08, 5);
    } else if (S.title2 === 1) {
      // el título no cabe: desborda el marco (el chiste de la escena)
      const msg = 'SYNARA 2.0 — NINGÚN DATO ES RUIDO HASTA ENTENDER SU HISTORIA';
      g.save(); g.beginPath(); g.rect(x - 34, y - 6, SW + 68, 98); g.clip();
      drawTitleText(g, msg, x + 6 - ((t * 30) % 40), y + 30, 2, ['#fff6d8', '#f5dc5a', '#ff9f43'], { shadow: '#000633' });
      g.restore();
      // la luz del texto que se sale del panel ilumina los bordes del marco
      VISTA.drawSoftGlow(g, x - 6, y + 38, 22, '#ffb050', 0.22, 4); VISTA.drawSoftGlow(g, x + SW + 6, y + 38, 22, '#ffb050', 0.22, 4);
      if (Math.floor(t * 4) % 2) { frect(g, x + 4, y + 74, 48, 7, '#3a0a14'); drawText(g, 'DESBORDE', x + 8, y + 75, { font: 'tiny', color: '#ff6b6b' }); }
    } else {
      // panel público en vivo: turbidez, energía disponible, salmuera y cultivos
      frect(g, x + 3, y + 3, SW - 6, 11, '#072248'); frect(g, x + 3, y + 3, SW - 6, 1, '#a8c8ff');
      drawText(g, 'PANEL PÚBLICO · EN VIVO', x + 10, y + 6, { font: 'tiny', color: '#e6f8fe' });
      if (Math.floor(t * 2) % 2) { frect(g, x + SW - 12, y + 6, 4, 4, '#ff4e5d'); }
      const rows = [['TURBIDEZ', '#20d6c7', ((1.2 + 0.2 * Math.sin(t * 0.7)).toFixed(1)) + ' NTU'], ['ENERGÍA', '#ffe14d', Math.round(72 + 6 * Math.sin(t * 0.4)) + ' %'], ['SALMUERA', '#c244a2', 'BOYA OK'], ['RIEGO', '#4ccb70', 'GOTEO']];
      rows.forEach(([lab, col, val], i) => {
        const ry = y + 18 + i * 16;
        frect(g, x + 6, ry, 3, 11, col);
        drawText(g, lab, x + 12, ry + 2, { font: 'tiny', color: '#cfe0ff' });
        spark(g, x + 58, ry, 54, 11, t, col, i * 2.1, 0.5 + i * 0.2);
        drawText(g, val, x + SW - 6, ry + 2, { font: 'tiny', align: 'right', color: col });
      });
    }
    // reflejo del cristal: dos franjas diagonales tenues
    g.globalAlpha = 0.06; g.fillStyle = '#ffffff';
    for (let i = 0; i < 18; i++) { g.fillRect(x + 20 + i, y + i * 2, 2, 2); g.fillRect(x + 30 + i, y + i * 2, 1, 2); }
    g.globalAlpha = 1;
  }
  /** Fondo de BlankScene (detrás de los créditos): noche en bandas con estrellas */
  function drawBlank(g, t) {
    if (!_blank) {
      const pb = SCBK.nightSky(W, H, { horizonY: H + 60, stops: ['#03020c', '#05030f', '#070516', '#0a081e', '#0e0c28', '#141236', '#1a1842', '#20204c', '#28285a', '#323268'] });
      SCBK.stars(pb, W, H, 7, { n: 90, y1: H });
      _blank = pb.toCanvas();
    }
    g.drawImage(_blank, 0, 0);
  }
  return { drawScreen, drawBlank, SW, SH };
})();
