/* =====================================================================
   17i_vista_light.js — Luz del panorama (VISTA): soles de color propio
   (atardecer, mediodía blanco), haces de luz horneados en el cielo,
   resplandor solar dinámico en anillos (aditivo, sin tramado), brillo
   de calor (espejismo) y destellos especulares que recorren superficies.
   API:
     VISTA.sunDisc(pb, cx, cy, r, halo, {disc, core, edge, rings:[[dr, col, a]...]})
     VISTA.rays(pb, sx, sy, {n, len, col, a, seed, spread, ang, w})   haces horneados
     VISTA.drawBloom(g, x, y, r, col, a, t)    resplandor solar en 2 anillos (≤ 2 drawImage)
     VISTA.drawHeat(g, x0, y0, w, h, t, {col, a, n})   ondulación de calor (líneas 1 px)
     VISTA.drawGlints(g, list, ox, oy, t)      list: [{x, y, len, ph, sp}] destello que recorre una fila
     VISTA.drawPulse(g, list, ox, oy, t, col, a0, a1, sp)  halos [[x,y,r]] que laten
   ===================================================================== */
(() => {
  const V = VISTA;
  V.SUNS = {
    dusk: { disc: '#ffd890', core: '#fff4d0', edge: '#ffc070', rings: [[1.6, '#ffc070', 0.95], [3.4, '#f8a868', 0.62], [6, '#ec9478', 0.44], [9, '#d8849a', 0.32], [12.5, '#b87ab0', 0.22], [0, '#9a78c0', 0.13]] },
    noon: { disc: '#fffcea', core: '#ffffff', edge: '#fff4c0', rings: [[1.4, '#fff6c8', 0.95], [3.2, '#fbe6b0', 0.66], [5.6, '#ead2b4', 0.46], [8.6, '#cdbcc6', 0.32], [12, '#aab4dc', 0.22], [0, '#8aa6e4', 0.14]] },
  };
  /** Sol con colores propios (anillos con borde desplazado por clusters, sin halo tramado) */
  V.sunDisc = function (pb, cx, cy, r = 11, haloR = 24, o = {}) {
    const S = typeof o === 'string' ? V.SUNS[o] : (o.rings ? o : V.SUNS[o.kind || 'noon']);
    const ring = S.rings.map(([dr, c, a]) => [dr ? r + dr : haloR, U(c), a]);
    const DISC = U(S.disc), CORE = U(S.core), EDGE = U(S.edge);
    const x0 = Math.floor(cx - haloR - 2), x1 = Math.ceil(cx + haloR + 2), y0 = Math.floor(cy - haloR - 2), y1 = Math.ceil(cy + haloR + 2);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (x < 0 || y < 0 || x >= pb.w || y >= pb.h) continue;
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy), i = y * pb.w + x;
      if (d <= r) { const kk = Math.hypot(x + 0.5 - (cx - r * 0.3), y + 0.5 - (cy - r * 0.3)) / r; pb.data[i] = d > r - 1 ? EDGE : kk < 0.55 ? CORE : DISC; continue; }
      const j = (hash2((x / 2) | 0, (y / 2) | 0, 77) - 0.5) * 1.6;
      for (const [rr, u, a] of ring) if (d + j <= rr) { pb.data[i] = V.mixU(pb.data[i], u, a); break; }
    }
  };
  /** Haces de luz horneados: cuñas muy suaves que salen del sol (2 niveles de alfa, borde en clusters) */
  V.rays = function (pb, sx, sy, o = {}) {
    const r = RNG(o.seed || 9), n = o.n || 6, len = o.len || 260, col = U(o.col || '#fff4d8'), a = o.a ?? 0.1;
    const base = o.ang ?? Math.PI / 2, spread = o.spread ?? 1.4, yMax = o.yMax ?? pb.h;
    for (let i = 0; i < n; i++) {
      const ang = base + (i / Math.max(1, n - 1) - 0.5) * spread + r.range(-0.08, 0.08), hw = (o.w || 0.035) * r.range(0.6, 1.4);
      const ca = Math.cos(ang), sa = Math.sin(ang);
      const x0 = Math.max(0, Math.floor(sx - len)), x1 = Math.min(pb.w - 1, Math.ceil(sx + len)), y0 = Math.max(0, Math.floor(sy)), y1 = Math.min(yMax - 1, Math.ceil(sy + len));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const dx = x - sx, dy = y - sy, along = dx * ca + dy * sa; if (along < 6 || along > len) continue;
        const across = Math.abs(-dx * sa + dy * ca) / along;
        const j = (hash2((x / 3) | 0, (y / 2) | 0, 31 + i) - 0.5) * 0.012;
        if (across + j > hw) continue;
        const fade = 1 - along / len, inner = across < hw * 0.45;
        const k = a * fade * (inner ? 1 : 0.55);
        if (k < 0.012) continue;
        const idx = y * pb.w + x; pb.data[idx] = V.mixU(pb.data[idx], col, k);
      }
    }
  };
  /** Resplandor solar aditivo que respira (2 halos cacheados en anillos) */
  V.drawBloom = function (g, x, y, r, col, a = 0.3, t = 0) {
    const k = 1 + Math.sin(t * 0.9) * 0.08;
    V.drawGlow(g, x, y, r, col, a * k);
    V.drawGlow(g, x, y, Math.round(r * 0.45), '#ffffff', a * 0.9 * k);
  };
  /** Ondulación de calor: segmentos horizontales claros que se desplazan (≤ n fillRect) */
  V.drawHeat = function (g, x0, y0, w, h, t, o = {}) {
    const n = o.n || 40;
    g.fillStyle = o.col || '#fff4dc';
    for (let i = 0; i < n; i++) {
      const hy = hash1(i, 41), hx = hash1(i, 43), ph = hash1(i, 47) * TAU;
      const y = Math.round(y0 + hy * h + Math.sin(t * 2.4 + ph) * 1.2), len = 3 + Math.round(hash1(i, 53) * 9);
      const x = Math.round(x0 + ((hx * w + t * (6 + hy * 8)) % w));
      const a = (Math.sin(t * 3 + ph) + 1) * 0.5;
      if (a < 0.35) continue;
      g.globalAlpha = (o.a ?? 0.35) * a; g.fillRect(x, y, len, 1);
    }
    g.globalAlpha = 1;
  };
  /** Destello especular que recorre filas (paneles, cristal): 1 fillRect por destello */
  V.drawGlints = function (g, list, ox, oy, t) {
    for (const G of list) {
      const u = ((t * (G.sp || 0.25) + (G.ph || 0)) % 1.6);
      if (u > 1) continue;
      const x = Math.round(G.x + ox + u * G.len), y = Math.round(G.y + oy + u * (G.dy || 0));
      if (x < -4 || x > W + 4) continue;
      g.globalAlpha = Math.sin(u * Math.PI) * (G.a ?? 0.9); g.fillStyle = G.col || '#ffffff'; g.fillRect(x, y, G.w || 2, 1);
      g.globalAlpha = 1;
    }
  };
  /** Halos que laten (emisivos) */
  V.drawPulse = function (g, list, ox, oy, t, col, a0 = 0.35, a1 = 0.25, sp = 2) {
    for (const [x, y, r] of list) { const sx = x + ox; if (sx < -r - 4 || sx > W + r + 4) continue; V.drawGlow(g, sx, y + oy, r, col, a0 + a1 * Math.sin(t * sp + x * 0.7)); }
  };
})();
