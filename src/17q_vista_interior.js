/* =====================================================================
   17q_vista_interior.js — Kit VISTA (rollout B): interiores profundos.
   Salas en capas (cada muro con vanos que dejan ver la sala de detrás),
   roca tallada con vetas minerales, bastidores BESS en 3/4, bandejas de
   cable con flujo, sala de control acristalada, climatización con vapor,
   tiras de luz emisivas, suelo reflectante y arcos con vistas al exterior.
     VISTA.rockFill(pb, x0, y0, w, h, {seed, ramp, vein, veinK, sc, k}) → {veins:[[x,y]]}
     VISTA.carveArch(pb, cx, yTop, w, h, {frame, k, rib}) → {x0, x1, yTop, yBot}   vano transparente con dovelas
     VISTA.bessRack(pb, x, y, w, h, d, {k, accent}) → {leds:[[x,y]], top}
     VISTA.cableTray(pb, x0, x1, y, {k, cols}) → {flow:[[x0,y],[x1,y]]}
     VISTA.controlRoom(pb, x, y, w, h, {k}) → {screens:[[x,y,w,h]], top}
     VISTA.hvac(pb, x, y, w, h, {k}) → {vent:[x,y]}
     VISTA.lightStrip(pb, x0, x1, y, col) → [x0, x1, y]
     VISTA.reflectFloor(pb, x0, x1, y0, y1, {k, ramp, lights:[x...], col})
     VISTA.column(pb, x, y0, y1, w, {k, ramp})              pilar de acero/piedra con capitel
     VISTA.drawSteam(g, x, y, t, {n, h, col})
     VISTA.drawStrips(g, strips, ox, oy, t, {col})          pulso que recorre las tiras de luz
   ===================================================================== */
(() => {
  const V = VISTA;
  const ramp = (r, k, hz) => V.P32(V.hz(r, k || 0, hz));
  const ROCK = ['#05060f', '#0a0c1e', '#10142c', '#161c3a', '#1e2648', '#283258', '#343e6a', '#46507c'];
  const GRAPH = ['#07080e', '#0e1018', '#161a26', '#20263a', '#2c344e', '#3c4664', '#56627e', '#7a86a0'];
  const CONCI = ['#141626', '#1e2234', '#2a2e44', '#383c54', '#4a4e66', '#60647a', '#7c7e92', '#9c9cae'];
  V.INT = { ROCK, GRAPH, CONCI };
  V.rockFill = function (pb, x0, y0, w, h, o = {}) {
    const R = ramp(o.ramp || ROCK, o.k), n = R.length, seed = o.seed || 1, sc = o.sc || 0.02;
    const VU = U(o.vein || '#3e2a86'), VU2 = U(o.vein2 || '#7454c8'), veins = [];
    for (let y = Math.max(0, y0); y < Math.min(pb.h, y0 + h); y++) for (let x = Math.max(0, x0); x < Math.min(pb.w, x0 + w); x++) {
      const rd = V.ridged(x * sc, y * sc * 1.4, 4, seed), f = fbm(x * sc * 2.2, y * sc * 2.6, 3, seed + 3);
      let t = 0.18 + rd * 0.55 + (f - 0.5) * 0.25 + (o.tGrad ? o.tGrad((y - y0) / h) : 0);
      // facetas de talla: bloques de 6–10 px con luz arriba-izquierda
      const bx = Math.floor((x + (Math.floor(y / 9) & 1) * 4) / 9), by = Math.floor(y / 9);
      t += (hash2(bx, by, seed + 7) - 0.5) * 0.12 + ((x % 9) === 0 || (y % 9) === 0 ? -0.06 : 0);
      let u = R[V.band(clamp(t, 0, 0.999), n, x, y, 0.05, seed)];
      // vetas minerales (isolíneas de ruido)
      const vv = Math.abs(fbm(x * 0.018 + 5, y * 0.026, 3, seed + 8) - 0.5);
      if (vv < (o.veinK ?? 0.006)) { u = vv < (o.veinK ?? 0.006) * 0.4 ? VU2 : V.mixU(u, VU, 0.7); if (hash2(x, y, seed + 9) < 0.04) veins.push([x, y]); }
      pb.data[y * pb.w + x] = u;
    }
    return { veins };
  };
  V.carveArch = function (pb, cx, yTop, w, h, o = {}) {
    const hw = w / 2, rr = hw, yBot = yTop + h, ySpring = yTop + rr;
    const F = ramp(o.frame || CONCI, o.k), n = F.length, th = o.th ?? 4;
    for (let y = Math.max(0, Math.floor(yTop - th)); y < Math.min(pb.h, yBot); y++) for (let x = Math.floor(cx - hw - th); x <= cx + hw + th; x++) {
      if (x < 0 || x >= pb.w) continue;
      const dx = x + 0.5 - cx;
      // distancia al intradós
      let inside, d;
      if (y < ySpring) { const dy = ySpring - y - 0.5; d = Math.hypot(dx, dy) - rr; inside = d < 0; }
      else { d = Math.abs(dx) - hw; inside = d < 0; }
      if (inside) { pb.data[y * pb.w + x] = 0; continue; }
      if (d < th) {
        // dovelas: borde iluminado arriba-izquierda, juntas cada 6 px
        const ang = y < ySpring ? Math.atan2(ySpring - y, dx) : (dx < 0 ? Math.PI : 0);
        const joint = y < ySpring ? (Math.floor(ang / 0.16) % 2 === 0 && d > th - 1.5) : ((y - ySpring) % 7 === 0);
        let i = Math.round(n * 0.55 + (dx < 0 ? 1 : -1) * 1.2 - d * 0.5);
        if (d < 1) i = dx < 0 || y < ySpring - rr * 0.5 ? n - 1 : 2;
        if (joint) i = 1;
        pb.data[y * pb.w + x] = F[clamp(i, 0, n - 1)];
      }
    }
    return { x0: cx - hw, x1: cx + hw, yTop, yBot };
  };
  V.bessRack = function (pb, x, y, w, h, d, o = {}) {
    const k = o.k || 0, G = ramp(GRAPH, k), n = G.length, A = U(V.hzc(o.accent || '#2c63c0', k * 0.5));
    V.box3q(pb, x, y, w, h, d, { ramp: GRAPH, k, front: 4, side: 2, top: 5 });
    const leds = [];
    // módulos: rejilla de bandejas con asa y LED
    const mh = Math.max(5, Math.round(h / 8));
    for (let yy = y - h + 3; yy + mh <= y - 3; yy += mh) {
      for (let xx = x + 2; xx < x + w - 2; xx++) { V.put(pb, xx, yy, G[6]); V.put(pb, xx, yy + mh - 1, G[1]); }
      for (let yq = yy + 1; yq < yy + mh - 1; yq++) { V.put(pb, x + 2, yq, G[5]); V.put(pb, x + w - 3, yq, G[1]); }
      V.put(pb, x + 4, yy + 2, G[0]); V.put(pb, x + 5, yy + 2, G[0]);
      leds.push([x + w - 5, yy + Math.floor(mh / 2)]);
    }
    // franja de acento superior y rejilla lateral de ventilación
    for (let xx = x; xx < x + w; xx++) V.put(pb, xx, y - h + 1, A);
    const dx = Math.round(d * 0.55);
    for (let yy = y - h + 4; yy < y - 3; yy += 3) for (let q = 1; q < dx - 1; q++) V.put(pb, x + w + q, yy - Math.round(q * 0.9), G[0]);
    return { leds, top: y - h - Math.round(d * 0.5) };
  };
  V.cableTray = function (pb, x0, x1, y, o = {}) {
    const k = o.k || 0, S = ramp(V.TECH.STEEL, k), cols = (o.cols || ['#c8861a', '#2c63c0', '#3a3a4a', '#8d2a3a']).map(c => U(V.hzc(c, k)));
    for (let x = Math.round(x0); x <= x1; x++) {
      V.put(pb, x, y + 3, S[5]); V.put(pb, x, y + 4, S[2]);
      cols.forEach((c, i) => V.put(pb, x, y + 2 - (i >> 1) + ((x + i * 7) % 29 === 0 ? 1 : 0), c));
      if ((x - x0) % 40 === 0) for (let yy = y - (o.hang ?? 14); yy < y + 4; yy++) V.put(pb, x, yy, S[3]);
    }
    return { flow: [[x0, y + 1], [x1, y + 1]] };
  };
  V.controlRoom = function (pb, x, y, w, h, o = {}) {
    const k = o.k || 0, G = ramp(GRAPH, k), C = ramp(['#06203a', '#0a3a5e', '#1060a0', '#2a90d0', '#7ad4ff', '#d8f6ff'], k * 0.5);
    V.box3q(pb, x, y, w, h, 12, { ramp: GRAPH, k, front: 3, side: 2, top: 5 });
    const screens = [];
    // cristal: banda azul translúcida con reflejos diagonales y montantes
    const gy0 = y - h + 4, gy1 = y - Math.round(h * 0.35);
    for (let yy = gy0; yy < gy1; yy++) for (let xx = x + 2; xx < x + w - 2; xx++) {
      const m = (xx - x - 2) % 18 === 0, refl = ((xx + (yy - gy0) * 2) % 37) < 3;
      V.put(pb, xx, yy, m ? G[5] : refl ? C[3] : C[1]);
    }
    // pantallas y siluetas de operadores
    for (let sx = x + 6; sx + 12 < x + w - 4; sx += 18) {
      V.rect(pb, sx, gy1 - 9, 10, 6, C[0]); screens.push([sx + 1, gy1 - 8, 8, 4]);
      if (hash2(sx, y, 3) < 0.5) { const px = sx + 5; V.put(pb, px, gy1 - 2, G[1]); V.put(pb, px, gy1 - 3, G[1]); V.put(pb, px, gy1 - 4, G[2]); V.put(pb, px + 1, gy1 - 3, G[1]); }
    }
    for (let xx = x; xx < x + w; xx++) { V.put(pb, xx, gy1, G[6]); V.put(pb, xx, gy0 - 1, U(V.hzc('#56e5ff', k * 0.5))); }
    return { screens, top: y - h - 6, glass: [x + 2, gy0, w - 4, gy1 - gy0] };
  };
  V.hvac = function (pb, x, y, w, h, o = {}) {
    const k = o.k || 0, S = ramp(CONCI, k), n = S.length;
    V.box3q(pb, x, y, w, h, 8, { ramp: CONCI, k, front: 5, side: 2, top: 7 });
    // rejillas de ventilador
    const r = Math.max(3, Math.floor(Math.min(w / 4, h / 2) - 1));
    for (let i = 0; i < 2; i++) { const cx = x + Math.round(w * (0.28 + i * 0.44)), cy = y - Math.round(h / 2); V.ellipse(pb, cx + 0.5, cy + 0.5, r + 0.5, r + 0.5, (nx, ny, d) => S[d > 0.75 ? 1 : ((Math.atan2(ny, nx) * 3 / Math.PI + 6) | 0) % 2 ? 3 : 2]); V.put(pb, cx, cy, S[6]); }
    return { vent: [x + Math.round(w / 2) + 4, y - h - 4] };
  };
  V.lightStrip = function (pb, x0, x1, y, col) {
    const u = U(col), u2 = V.mixU(u, U('#ffffff'), 0.55);
    for (let x = Math.round(x0); x <= x1; x++) { V.put(pb, x, y, u2); V.blend(pb, x, y - 1, u, 0.55); V.blend(pb, x, y + 1, u, 0.55); }
    return [Math.round(x0), Math.round(x1), y];
  };
  V.reflectFloor = function (pb, x0, x1, y0, y1, o = {}) {
    const R = ramp(o.ramp || GRAPH, o.k), n = R.length, L = U(o.col || '#56e5ff');
    for (let y = y0; y < y1; y++) for (let x = Math.round(x0); x < x1; x++) {
      const v = (y - y0) / Math.max(1, y1 - y0);
      let u = R[V.band(clamp(0.5 - v * 0.35 + ((x >> 4) % 2 ? 0.04 : 0), 0, 0.999), n, x, y, 0.04, 5)];
      if (((x + 3) % 32) === 0) u = R[1]; // juntas de baldosa
      V.put(pb, x, y, u);
    }
    // reflejos verticales de las luces (más cortos y tenues hacia abajo)
    for (const lx of (o.lights || [])) for (let y = y0; y < y1; y++) { const v = (y - y0) / (y1 - y0); if (hash2(lx, y >> 1, 9) < 0.75 - v * 0.6) V.blend(pb, lx, y, L, 0.5 * (1 - v)); if (v < 0.5) V.blend(pb, lx + 1, y, L, 0.25 * (1 - v * 2)); }
  };
  V.column = function (pb, x, y0, y1, w, o = {}) {
    const R = ramp(o.ramp || CONCI, o.k), n = R.length;
    for (let y = y0; y < y1; y++) for (let xx = 0; xx < w; xx++) {
      const t = xx / Math.max(1, w - 1);
      V.put(pb, x + xx, y, R[t < 0.2 ? n - 2 : t < 0.55 ? n - 4 : t < 0.85 ? 2 : 1]);
    }
    for (let xx = -2; xx < w + 2; xx++) { V.put(pb, x + xx, y0, R[n - 1]); V.put(pb, x + xx, y0 + 1, R[n - 3]); V.put(pb, x + xx, y1 - 1, R[n - 3]); V.put(pb, x + xx, y1, R[1]); }
  };
  /** Cono de luz de una lámpara de techo: trapecio con alfa en bandas (se dibuja con 'lighter') */
  const _cone = new Map();
  V.lightCone = function (w0, w1, h, col, a0 = 0.22) {
    const key = [w0, w1, h, col, a0].join('|'); let c = _cone.get(key); if (c) return c;
    const pb = new PixelBuffer(w1, h), u = U(col) & 0xffffff;
    for (let y = 0; y < h; y++) { const v = y / h, hw = lerp(w0, w1, v) / 2; for (let x = 0; x < w1; x++) { const d = Math.abs(x + 0.5 - w1 / 2) / hw; if (d > 1) continue; const lv = Math.floor((1 - v * 0.75) * (1 - d * d) * 4); if (lv > 0) pb.data[y * w1 + x] = ((Math.round(a0 * lv / 4 * 255) << 24) | u) >>> 0; } }
    c = pb.toCanvas(); _cone.set(key, c); return c;
  };
  V.drawSteam = function (g, x, y, t, o = {}) {
    const n = o.n || 6, hh = o.h || 26;
    g.fillStyle = o.col || '#c8d8f0';
    for (let i = 0; i < n; i++) {
      const u = ((t * 0.4 + i / n) % 1), px = x + Math.sin(u * 5 + i) * 3 * u + u * 6, py = y - u * hh, s = 1 + Math.floor(u * 3);
      g.globalAlpha = 0.45 * (1 - u); g.fillRect(Math.round(px - s / 2), Math.round(py), s, s);
    }
    g.globalAlpha = 1;
  };
  V.drawStrips = function (g, strips, ox, oy, t, o = {}) {
    g.fillStyle = o.col || '#ffffff';
    for (const [x0, x1, y] of strips) {
      const a = x0 + ox, b = x1 + ox; if (b < 0 || a > W) continue;
      const span = x1 - x0 + 60, p = ((t * (o.speed ?? 50)) % span) + a - 30;
      if (p > a && p < b) { g.globalAlpha = 0.8; g.fillRect(Math.round(p), y + oy, 6, 1); g.globalAlpha = 1; }
    }
  };
})();
