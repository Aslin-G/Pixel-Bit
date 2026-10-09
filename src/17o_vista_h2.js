/* =====================================================================
   17o_vista_h2.js — Kit VISTA (rollout B): ciudadela del hidrógeno y
   paisaje de hora azul (luces emisivas, estrellas, bahía con reflejos).
   Generadores (solo añaden):
     VISTA.stars(pb, {n, y1, seed, hz})                      estrellas en el lienzo del cielo
     VISTA.h2Tank(pb, cx, y, rx, h, {k, label, lit}) → {top, glow:[x,y,r], band:[x0,x1,y]}
     VISTA.sphereTank(pb, cx, y, r, {k}) → {top}
     VISTA.electroHall(pb, x, y, w, h, {k, cells}) → {win:[[x,y,w,h]], cells:[[x,y]]}
     VISTA.whiteTower(pb, x, y, w, h, seed, {k, lit}) → {top, lights:[[x,y]], beacon:[x,y]}
     VISTA.ventStack(pb, x, y, h, {k}) → {lx, ly}
     VISTA.catwalk(pb, x0, x1, y, {k})
     VISTA.skyline(pb, x0, x1, yBase, {k, seed, hMin, hMax, lit}) → {lights:[[x,y,c]]}
     VISTA.bay(pb, y0, y1, {stops, seed, glowX, glowCol}) → bahía al anochecer con columna de reflejo
     VISTA.drawLights(g, list, ox, oy, t, {blink})          ventanas/balizas que titilan (fillRect 1–2 px)
     VISTA.drawBubbles(g, x, y, w, h, t, {n, col})          burbujas de gas que suben (O₂/H₂) en las celdas
   ===================================================================== */
(() => {
  const V = VISTA;
  const ramp = (r, k, hz) => V.P32(V.hz(r, k || 0, hz));
  const H2G = ['#06301e', '#0c4a2e', '#146a40', '#1f8a52', '#2fae68', '#46cc82', '#74e6aa', '#b4f6d2'];
  const WHT = ['#3a4256', '#56607a', '#76809a', '#98a2b8', '#bcc4d4', '#dce2ec', '#f0f4f8', '#ffffff'];
  const CYAN = ['#06304a', '#0a5a7a', '#1090b4', '#22c1e7', '#71dfef', '#c8faff'];
  const CELL = ['#0a3a22', '#13603a', '#1f8a52', '#36c070', '#5ee69a', '#a8ffd0'];
  /** Paleta activa (un bioma puede sustituirla temporalmente, p. ej. por su versión de anochecer) */
  V.H2K = { H2G, WHT, CYAN, CELL };
  V.H2K_BASE = { H2G, WHT, CYAN, CELL };
  /** Rampa «de hora azul»: multiplica por un tinte frío y levanta un poco las sombras */
  V.duskRamp = function (rp, tint = '#a4a8dc', lift = 0.06, liftCol = '#1a2050') {
    const [tr, tg, tb] = hexToRgb(tint);
    return rp.map(c => { const [r, g, b] = hexToRgb(c); return mixHex(rgbToHex(Math.round(r * tr / 255), Math.round(g * tg / 255), Math.round(b * tb / 255)), liftCol, lift); });
  };
  /* ---------------- cielo nocturno ---------------- */
  V.stars = function (pb, o = {}) {
    const r = RNG(o.seed || 3), n = o.n || 120, y1 = o.y1 || 90;
    for (let i = 0; i < n; i++) {
      const x = r.int(0, pb.w - 1), y = Math.floor(Math.pow(r(), 1.6) * y1), b = r();
      const c = V.get(pb, x, y), a = clamp(1 - y / y1, 0.15, 1) * (0.45 + b * 0.55);
      V.put(pb, x, y, V.mixU(c, U(b > 0.85 ? '#fff6e0' : b > 0.5 ? '#e8f0ff' : '#b8c8ff'), a));
      if (b > 0.93 && y < y1 * 0.6) { for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) V.put(pb, x + dx, y + dy, V.mixU(V.get(pb, x + dx, y + dy), U('#c8d8ff'), a * 0.45)); }
    }
  };
  /* ---------------- tanques y esferas ---------------- */
  V.h2Tank = function (pb, cx, y, rx, h, o = {}) {
    const P = V.H2K, k = o.k || 0, W8 = ramp(P.WHT, k), n = W8.length;
    const body = o.white ? P.WHT : P.H2G, bandR = o.white ? P.H2G : P.WHT;
    V.cylV(pb, cx, y, rx, h, body, { k, dome: 0.75, bands: [[Math.round(h * 0.18), 2, bandR], [Math.round(h * 0.72), 3, bandR]] });
    // anillo emisivo bajo la banda alta (luz de estado esmeralda)
    const ringY = y - Math.round(h * 0.72) + Math.max(1, Math.round(rx * 0.4)) + 1, RC = ramp(P.CELL, 0);
    if (o.ring !== false) for (let xx = -rx + 1; xx < rx; xx++) V.put(pb, cx + xx, ringY + Math.round(Math.sqrt(Math.max(0, 1 - (xx / (rx + 0.5)) ** 2)) * Math.max(1, Math.round(rx * 0.4))) - Math.max(1, Math.round(rx * 0.4)), RC[xx < 0 ? 5 : 4]);
    const ell = Math.max(1, Math.round(rx * 0.4));
    // cúpula blanca superior
    const top = y - h;
    V.ellipse(pb, cx + 0.5, top + 0.5, rx + 0.5, Math.round(rx * 0.75) + 0.5, (nx, ny) => ny > 0.1 ? 0 : W8[clamp(Math.round((0.8 - nx * 0.45 - ny * 0.25) * (n - 1)), 1, n - 1)]);
    // válvula y barandilla de coronación
    V.rect(pb, cx - 1, top - Math.round(rx * 0.75) - 2, 3, 2, W8[n - 2]); V.put(pb, cx, top - Math.round(rx * 0.75) - 3, W8[n - 1]);
    // escalera de servicio a la derecha
    const L = U(V.hzc('#2a3448', k));
    for (let yy = top + 2; yy < y; yy++) { V.put(pb, cx + rx - 1, yy + ell, L); if (yy % 3 === 0) V.put(pb, cx + rx - 2, yy + ell, L); }
    // rótulo H₂
    if (o.label && rx >= 6 && typeof PFK !== 'undefined') {
      const tw = V.measure('H2', { font: 'tiny', bold: true });
      V.text(pb, 'H2', cx - Math.round(tw / 2) - 1, y - Math.round(h * 0.5) - 2, U(V.hzc('#f4fff8', k)), { font: 'tiny', bold: true });
    }
    return { top: top - Math.round(rx * 0.75) - 3, glow: [cx - Math.round(rx * 0.35), y - Math.round(h * 0.45), Math.max(4, rx + 2)], ring: [cx, ringY, rx], band: [cx - rx, cx + rx, y - Math.round(h * 0.72) - 1] };
  };
  V.sphereTank = function (pb, cx, cy, r, o = {}) {
    const k = o.k || 0, R = ramp(V.H2K.WHT, k), n = R.length, LG = ramp(V.TECH.STEEL, k);
    // patas
    for (const dx of [-0.7, -0.25, 0.25, 0.7]) { const x = Math.round(cx + dx * r); for (let yy = cy; yy <= cy + r + 2; yy++) { V.put(pb, x, yy, LG[dx < 0 ? 4 : 2]); } }
    V.ellipse(pb, cx + 0.5, cy + 0.5, r + 0.5, r + 0.5, (nx, ny, d) => {
      const nz = Math.sqrt(Math.max(0, 1 - d)), I = clamp(-nx * 0.5 - ny * 0.55 + nz * 0.6, 0, 1);
      let i = Math.round(1 + I * (n - 2));
      if (Math.abs(ny + 0.05) < 0.07) i = Math.max(0, i - 2); // ecuador
      if (d > 0.88) i = Math.max(0, i - 1);
      if (nx < -0.25 && nx > -0.5 && ny < -0.3 && ny > -0.55) i = n - 1;
      return R[clamp(i, 0, n - 1)];
    });
    return { top: cy - r };
  };
  /* ---------------- edificios ---------------- */
  V.electroHall = function (pb, x, y, w, h, o = {}) {
    const P = V.H2K, k = o.k || 0, d = o.d ?? Math.round(w * 0.16);
    V.box3q(pb, x, y, w, h, d, { ramp: P.WHT, k, front: 5, side: 2, top: 6 });
    const G = ramp(P.CELL, k * 0.3), C = ramp(P.CYAN, k), D = ramp(P.WHT, k);
    // cubierta en diente de sierra (lucernarios)
    const dx = Math.round(d * 0.55), dy = Math.round(d * 0.5);
    for (let sx = x + 2; sx < x + w - 4; sx += 8) for (let i = 0; i < 4; i++) { V.put(pb, sx + i + dx, y - h - dy - i, D[6]); V.put(pb, sx + i + dx, y - h - dy - i + 1, C[3 - Math.min(2, i)]); }
    // banda acristalada con celdas de electrólisis iluminadas
    const wy = y - Math.round(h * 0.72), wh = Math.round(h * 0.42), cells = [], win = [[x + 3, wy, w - 6, wh]];
    for (let yy = wy; yy < wy + wh; yy++) for (let xx = x + 3; xx < x + w - 3; xx++) {
      const col = (xx - x - 3) % 6, row = yy - wy;
      let u = C[0];
      if (col === 0) u = D[2]; // montante
      else if (col < 5 && row > 1 && row < wh - 1) u = G[(row + col) % 3 === 0 ? 4 : 3 - (col === 4 ? 1 : 0)];
      if (row === 0) u = D[3];
      V.put(pb, xx, yy, u);
    }
    for (let xx = x + 6; xx < x + w - 6; xx += 6) cells.push([xx, wy + Math.round(wh / 2)]);
    // franja cian corporativa y rótulo de nave
    for (let xx = x; xx < x + w; xx++) { V.put(pb, xx, y - Math.round(h * 0.2), C[3]); V.put(pb, xx, y - Math.round(h * 0.2) + 1, C[2]); }
    return { win, cells, top: y - h - dy };
  };
  V.whiteTower = function (pb, x, y, w, h, seed, o = {}) {
    const k = o.k || 0, R = ramp(V.H2K.WHT, k), C = ramp(V.H2K.CYAN, k), n = R.length, r = RNG(seed);
    const lights = [];
    for (let yy = y - h; yy < y; yy++) for (let xx = 0; xx < w; xx++) {
      const t = xx / Math.max(1, w - 1);
      let i = t < 0.18 ? n - 1 : t < 0.5 ? n - 2 : t < 0.8 ? n - 4 : n - 5;
      if ((yy - (y - h)) % 5 === 0) i = Math.max(0, i - 2);
      V.put(pb, x + xx, yy, R[i]);
    }
    // franja cian vertical
    const sx = x + Math.round(w * 0.38);
    for (let yy = y - h + 2; yy < y - 2; yy++) { V.put(pb, sx, yy, C[4]); if (w > 6) V.put(pb, sx + 1, yy, C[3]); }
    // ventanas encendidas
    for (let yy = y - h + 3; yy < y - 3; yy += 5) for (let xx = x + 1; xx < x + w - 1; xx += 3) if (xx !== sx && xx !== sx + 1 && r.chance(o.lit ?? 0.5)) { V.put(pb, xx, yy, U(V.hzc(r.chance(0.7) ? '#ffe2a0' : '#bff4ff', k * 0.12))); if (r.chance(0.25)) lights.push([xx, yy]); }
    // corona y antena
    V.rect(pb, x - 1, y - h - 2, w + 2, 2, R[n - 1]);
    const ah = Math.max(4, Math.round(h * 0.18));
    for (let i = 0; i < ah; i++) V.put(pb, x + Math.floor(w / 2), y - h - 3 - i, R[n - 3]);
    return { top: y - h - 3 - ah, lights, beacon: [x + Math.floor(w / 2), y - h - 3 - ah] };
  };
  V.ventStack = function (pb, x, y, h, o = {}) {
    const k = o.k || 0, R = ramp(V.H2K.WHT, k), Y = U(V.hzc('#f0c040', k)), n = R.length;
    for (let i = 0; i < h; i++) { V.put(pb, x, y - i, R[n - 2]); V.put(pb, x + 1, y - i, R[n - 4]); V.put(pb, x + 2, y - i, R[2]); if (i % 12 === 6) { V.put(pb, x, y - i, Y); V.put(pb, x + 1, y - i, Y); } }
    V.rect(pb, x - 1, y - h - 1, 5, 2, R[n - 1]);
    return { lx: x + 1, ly: y - h - 2 };
  };
  V.catwalk = function (pb, x0, x1, y, o = {}) {
    const k = o.k || 0, R = ramp(V.TECH.STEEL, k), Y = U(V.hzc('#f0c040', k));
    for (let x = Math.round(x0); x <= x1; x++) {
      V.put(pb, x, y, R[6]); V.put(pb, x, y + 1, R[2]);
      V.put(pb, x, y - 4, x % 2 ? Y : R[5]);
      if ((x - x0) % 6 === 0) for (let yy = y - 4; yy < y; yy++) V.put(pb, x, yy, R[4]);
      else if ((x - x0) % 6 === 3) V.put(pb, x, y - 2, R[3]);
    }
  };
  V.skyline = function (pb, x0, x1, yBase, o = {}) {
    const k = o.k || 0, r = RNG(o.seed || 21), lights = [];
    const B = ramp(o.ramp || ['#141a36', '#1c2446', '#262f58', '#323c6a', '#44507e'], k), nB = B.length;
    for (let x = x0; x < x1;) {
      const bw = r.int(4, 10), bh = r.int(o.hMin || 6, o.hMax || 24), tower = r.chance(0.12);
      const hh = tower ? bh + r.int(8, 18) : bh;
      for (let xx = x; xx < x + bw; xx++) for (let yy = yBase - hh; yy <= yBase; yy++) V.put(pb, xx, yy, B[clamp(Math.round((xx === x ? 3 : xx === x + bw - 1 ? 1 : 2) + (yy < yBase - hh + 2 ? 1 : 0)), 0, nB - 1)]);
      if (r.chance(0.4)) V.put(pb, x + (bw >> 1), yBase - hh - 1, B[nB - 1]);
      for (let yy = yBase - hh + 2; yy < yBase - 1; yy += 3) for (let xx = x + 1; xx < x + bw - 1; xx += 2) if (r.chance(o.lit ?? 0.35)) {
        const c = r.chance(0.75) ? '#ffd88a' : '#9ef2ff'; V.put(pb, xx, yy, U(V.hzc(c, k * 0.15)));
        if (r.chance(0.08)) lights.push([xx, yy, c]);
      }
      x += bw + (r.chance(0.2) ? r.int(2, 8) : 0);
    }
    return { lights };
  };
  /** Bahía al anochecer: degradado en bandas, rizos, columna de reflejo del resplandor */
  V.bay = function (pb, y0, y1, o = {}) {
    const stops = o.stops || ['#c89ab8', '#8a7ab8', '#4a5a9c', '#2a3c7a', '#1a2a5e', '#142250'];
    const nb = 14, R = V.P32(V.expand(stops, nb)), G = U(o.glowCol || '#ffb48a');
    for (let y = y0; y < y1; y++) {
      const t = Math.pow((y - y0) / Math.max(1, y1 - y0), 0.6);
      for (let x = 0; x < pb.w; x++) {
        let u = R[V.band(t, nb, x, y, 0.04, 9)];
        const wv = vnoise(x * 0.08, y * 0.9, 31);
        if (wv > 0.76) u = V.shU(u, 0.1); else if (wv < 0.2) u = V.shU(u, -0.08, 240);
        if (o.glowX != null) { const dx = Math.abs(x - o.glowX) / (10 + (y - y0) * 1.4); if (dx < 1 && wv > 0.45) u = V.mixU(u, G, (1 - dx) * 0.7 * (1 - t * 0.6)); }
        pb.data[y * pb.w + x] = u;
      }
    }
    for (let x = 0; x < pb.w; x++) pb.data[y0 * pb.w + x] = U(o.horizonCol || '#e8b8b8');
  };
  /* ---------------- dinámico ---------------- */
  V.drawLights = function (g, list, ox, oy, t, o = {}) {
    for (let i = 0; i < list.length; i++) {
      const L = list[i], x = L[0] + ox; if (x < -2 || x > W + 2) continue;
      const on = Math.sin(t * (o.speed ?? 0.9) + i * 2.3) > (o.blink ?? -0.6);
      if (!on) continue;
      g.fillStyle = L[2] || o.col || '#ffe8b0'; g.fillRect(Math.round(x), Math.round(L[1] + oy), 1, 1);
    }
  };
  /** Chevrones por una polilínea, solo los que caen en pantalla (versión con recorte de V.drawFlow) */
  V.drawFlowC = function (g, pts, ox, oy, t, o = {}) {
    const sp = o.speed ?? 14, gap = o.gap ?? 7;
    g.fillStyle = o.col || '#e8feff';
    let acc = 0;
    for (let s = 0; s + 1 < pts.length; s++) {
      const [x0, y0] = pts[s], [x1, y1] = pts[s + 1];
      const len = Math.hypot(x1 - x0, y1 - y0);
      if (Math.max(x0, x1) + ox < -2 || Math.min(x0, x1) + ox > W + 2) { acc += len; continue; }
      let d = (gap - ((t * sp - acc) % gap + gap) % gap);
      if (y0 === y1 && len > 0) { const lo = (-2 - ox - Math.min(x0, x1)); if (lo > d) d += Math.ceil((lo - d) / gap) * gap; }
      for (; d < len; d += gap) { const u = d / len, x = lerp(x0, x1, u) + ox; if (x > W + 2) { if (y0 === y1) break; continue; } if (x < -2) continue; g.fillRect(Math.round(x), Math.round(lerp(y0, y1, u) + oy), 1, 1); }
      acc += len;
    }
  };
  /**
   * Charts.flow recortado a la pantalla: los tramos horizontales se recortan alineando el
   * corte al espaciado de los pulsos (los pulsos siguen anclados al mundo); el resto se delega.
   */
  V.flowClip = function (g, pts, kind, rate = 1, width = 3) {
    const K = (typeof FLOW_KINDS !== 'undefined' && FLOW_KINDS[kind]) || null, sp = (K && K.spacing) || 12;
    for (let i = 0; i + 1 < pts.length; i++) {
      let [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      if (y0 !== y1 || !K) { Charts.flow(g, [[x0, y0], [x1, y1]], kind, rate, width); continue; }
      const dir = x1 >= x0 ? 1 : -1, lo = -6, hi = W + 6;
      if (Math.max(x0, x1) < lo || Math.min(x0, x1) > hi) continue;
      // recorte del inicio en múltiplos del espaciado; recorte libre del final
      if (dir > 0 && x0 < lo) x0 += Math.floor((lo - x0) / sp) * sp;
      if (dir < 0 && x0 > hi) x0 -= Math.floor((x0 - hi) / sp) * sp;
      if (dir > 0 && x1 > hi) x1 = hi;
      if (dir < 0 && x1 < lo) x1 = lo;
      Charts.flow(g, [[x0, y0], [x1, y1]], kind, rate, width);
    }
  };
  /** Velo plano translúcido (sustituto sin tramado de fdither para lavados de color) */
  V.veil = function (g, x, y, w, h, col, a) {
    if (a <= 0) return;
    g.globalAlpha = Math.min(1, a); g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); g.globalAlpha = 1;
  };
  /** Halo amplio y suave (más anillos que drawGlow), aditivo */
  V.drawSoftGlow = function (g, x, y, r, col, a = 0.2, rings = 6) {
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = a;
    g.drawImage(V.glow(r, col, rings, 0.4), Math.round(x - r), Math.round(y - r));
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  };
  /** Farola de plataforma: poste + luminaria cálida → {x, y} de la luz */
  V.lamp = function (pb, x, y, h, o = {}) {
    const k = o.k || 0, S = ramp(V.TECH.STEEL, k);
    for (let i = 0; i < h; i++) V.put(pb, x, y - i, S[i < 2 ? 1 : 3]);
    V.put(pb, x + 1, y - h, S[4]); V.put(pb, x + 2, y - h, S[4]); V.put(pb, x + 2, y - h + 1, U('#fff0c0'));
    return { x: x + 2, y: y - h + 1 };
  };
  /** Rack de tuberías: n tubos paralelos sobre pórticos */
  V.pipeRack = function (pb, x0, x1, y, rps, o = {}) {
    const k = o.k || 0, S = ramp(o.steel || V.TECH.STEEL, k);
    for (let x = x0; x <= x1; x += o.span || 14) { for (let yy = y - 2; yy < y + rps.length * 4 + 6; yy++) { V.put(pb, x, yy, S[4]); V.put(pb, x + 1, yy, S[2]); } V.put(pb, x - 1, y - 2, S[5]); V.put(pb, x + 2, y - 2, S[5]); }
    rps.forEach((rp, i) => V.pipe(pb, [[x0 - 4, y + i * 4], [x1 + 4, y + i * 4]], 1, rp, { k }));
  };
  V.drawBubbles = function (g, x, y, w, h, t, o = {}) {
    const n = o.n || 8; g.fillStyle = o.col || '#d8fff0';
    for (let i = 0; i < n; i++) {
      const u = ((t * (0.35 + hash1(i, 3) * 0.3) + hash1(i, 5)) % 1);
      const bx = Math.round(x + hash1(i, 7) * w + Math.sin(t * 3 + i) * 0.8), by = Math.round(y - u * h);
      g.globalAlpha = 0.9 - u * 0.6; g.fillRect(bx, by, 1, 1);
    }
    g.globalAlpha = 1;
  };
})();
