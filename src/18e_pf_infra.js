/* =====================================================================
   18e_pf_infra.js — Infraestructura científica en 3/4 (kit PF).
   Cajas con cara superior y lateral visibles, cilindros verticales con
   franja especular, sombra de núcleo y luz reflejada (STYLE LOCK §6),
   bandas azules curvadas, tuberías por tramos con bridas y soportes,
   válvulas, manómetros, LED, barandillas, plintos de hormigón.
   Unidades: casa de bombas, torre de toma, filtros de medios.
   PFInfra.drawFlows(g, sc, runs) anima chevrones de flujo por tramo.
   Código de fluidos (STYLE LOCK §12): agua de mar turquesa · pretratada
   acero + azul claro · permeado cian brillante · salmuera grafito-índigo.
   ===================================================================== */
const PFInfra = (() => {
  const STEEL = ['#2a282e', '#4f4d51', '#716f76', '#948e91', '#b5aba8', '#d3ccc5', '#f2efea', '#ffffff'];
  const BAND = ['#0e2a48', '#163e66', '#245f90', '#2f86c0', '#31b4e2', '#8ad8f4'];
  const GLASS = ['#0a1e36', '#12304e', '#1d4a7a', '#3a7ab8', '#7ab8e8', '#c8ecff'];
  const ROOF = ['#1c222e', '#2a3444', '#3c4a5e', '#56677e', '#7a8ba0', '#a8b6c6'];
  const PIPES = {
    sea: { ramp: ['#04263c', '#07507a', '#0a7fae', '#11bedd', '#3adcf1', '#9cf0f8', '#e6fdff'], ink: '#03192a', chev: '#bff6fb', glow: '#11bedd' },
    pre: { ramp: ['#16263a', '#2e4a6a', '#4f7aa6', '#7aaad6', '#a8d0f0', '#d6eeff', '#ffffff'], ink: '#101a28', chev: '#e6f6ff', glow: null },
    product: { ramp: ['#0c2e4a', '#106a8a', '#1ebde3', '#48d4f0', '#6de1f1', '#d0f4f8', '#ffffff'], ink: '#071c30', chev: '#ffffff', glow: '#48b6ec' },
    brine: { ramp: ['#05081a', '#0b0e20', '#12162f', '#2a2c44', '#584f56', '#9485ac', '#b8a8d0'], ink: '#030512', chev: '#e07ecf', glow: null },
    steel: { ramp: STEEL.slice(1), ink: '#24222a', chev: '#ffffff', glow: null },
  };

  /* ---------- caja en 3/4 ---------- */
  /** Prisma: frente [x,y-h,w,h]; tapa desplazada (d·sk, −d); lateral derecho. paint: {front,top,side}(x,y,u,v)→u32 */
  function box3q(pb, x, y, w, h, d, o = {}) {
    const sk = o.skew ?? 0.45, dx = Math.round(d * sk);
    const pal = PFK.P32(o.ramp || PFTerrain.CONC);
    const n = pal.length;
    const front = o.front || ((xx, yy, u, v) => pal[clamp(Math.round(n * 0.55 + (PFK.cl(xx, yy, 2, 3) - 0.5) * 1.5 - v * 1.2), 1, n - 2)]);
    const top = o.top || ((xx, yy, u, v) => pal[clamp(Math.round(n * 0.82 - v * 1.5 + (PFK.cl(xx, yy, 2, 5) - 0.5)), 1, n - 1)]);
    const side = o.side || ((xx, yy, u, v) => pal[clamp(Math.round(n * 0.3 - v + (PFK.cl(xx, yy, 2, 7) - 0.5)), 0, n - 2)]);
    // lateral
    if (dx > 0) PFK.polyFill(pb, [[x + w, y - h], [x + w + dx, y - h - d], [x + w + dx, y - d], [x + w, y]], (xx, yy) => side(xx, yy, (xx - x - w) / dx, (yy - (y - h - (xx - x - w) / sk)) / h));
    // tapa
    if (d > 0) for (let r = 0; r < d; r++) { const off = Math.round(r * sk), yy = y - h - 1 - r; for (let xx = x + off; xx < x + w + off; xx++) PFK.put(pb, xx, yy, top(xx, yy, (xx - x - off) / w, r / d)); }
    // frente
    for (let yy = y - h; yy < y; yy++) for (let xx = x; xx < x + w; xx++) PFK.put(pb, xx, yy, front(xx, yy, (xx - x) / w, (yy - y + h) / h));
    // aristas: labio superior iluminado, arista vertical derecha oscura, contorno inferior
    if (o.edges !== false) {
      for (let xx = x; xx < x + w; xx++) PFK.put(pb, xx, y - h, pal[n - 1]);
      for (let yy = y - h; yy < y; yy++) PFK.put(pb, x, yy, pal[clamp(n - 2, 0, n - 1)]);
      if (o.ink !== false) { const ink = U(o.ink || '#1a1418'); for (let xx = x; xx < x + w + dx; xx++) { if (xx < x + w) PFK.put(pb, xx, y, ink); } }
    }
    return { x, y, w, h, d, dx, topY: y - h - d };
  }

  /* ---------- cilindro vertical ---------- */
  /** Tono por columna de un cilindro iluminado arriba-izquierda: borde, luz, franja especular de 1–2 px
      casi blanca al ~25 %, medios, sombra de núcleo, luz reflejada y borde (STYLE LOCK §6) */
  function colTone(f) { return f < 0.06 ? 1 : f < 0.14 ? 4 : f < 0.2 ? 6 : f < 0.27 ? 7 : f < 0.36 ? 6 : f < 0.5 ? 5 : f < 0.6 ? 4 : f < 0.8 ? 2 : f < 0.9 ? 3 : f < 0.96 ? 2 : 1; }
  function cylV(pb, cx, yb, r, h, o = {}) {
    const P = PFK.P32(o.ramp || STEEL), B = PFK.P32(o.band || BAND);
    const ry = Math.max(1, Math.round(r * (o.ell ?? 0.32)));
    const w = 2 * r + 1;
    const ellY = (i) => Math.round(ry * Math.sqrt(Math.max(0, 1 - Math.pow((i - r) / (r + 0.5), 2))));
    const bands = o.bands || [];
    // cuerpo
    for (let i = 0; i < w; i++) {
      const f = i / (w - 1), k = colTone(f), e = ellY(i);
      for (let yy = yb - h; yy <= yb + e; yy++) {
        let kk = k;
        const hy = yb - yy; // altura desde la base
        let col = P[clamp(kk, 0, P.length - 1)];
        for (const b of bands) { const by = yb - b.y + e; if (yy >= by - (b.h || 2) + 1 && yy <= by) { col = B[clamp(Math.round([0, 1, 4, 5, 3, 2, 1, 2][kk] || 2), 0, B.length - 1)]; if (yy === by - (b.h || 2) + 1 && kk >= 3) col = B[Math.min(B.length - 1, 5)]; } }
        if (yy > yb + e - 1) col = P[1];
        if (o.stain && hy < h * 0.25 && PFK.cl(cx + i, yy, 2, 4) < 0.25 && kk > 2) col = PFK.mixU(col, U('#6e625b'), 0.4);
        PFK.put(pb, cx - r + i, yy, col);
      }
    }
    // tapa: domo o elipse plana
    const domeH = o.dome ? Math.round(r * (o.dome === true ? 0.55 : o.dome)) : 0;
    PFK.ellipseFn(pb, cx, yb - h, r + 0.4, ry + domeH * 0.0001 + 0.4, (nx, ny) => {
      const lit = -nx * 0.6 - ny * 0.8;
      return P[clamp(Math.round(4.6 + lit * 1.8), 2, 7)];
    });
    if (domeH) PFK.ellipseFn(pb, cx, yb - h, r + 0.4, domeH + ry * 0.5, (nx, ny) => {
      if (ny > 0) return 0;
      const lit = -nx * 0.65 - ny * 0.75;
      return P[clamp(Math.round(3.6 + lit * 2.6), 1, 7)];
    });
    // contorno de la tapa
    const ink = U(o.ink || '#2a282e');
    for (let i = 0; i < w; i++) { const e = ellY(i); PFK.put(pb, cx - r + i, yb + e + 1, ink); }
    // escalera y placa
    if (o.ladder) for (let yy = yb - h + 3; yy < yb; yy++) { PFK.put(pb, cx + r - 3, yy, P[1]); PFK.put(pb, cx + r - 1, yy, P[1]); if (yy % 3 === 0) { PFK.put(pb, cx + r - 2, yy, P[2]); } }
    if (o.plate) { const py = yb - Math.round(h * 0.55); for (let yy = py; yy < py + 5; yy++) for (let xx = cx - 3; xx <= cx + 2; xx++) PFK.put(pb, xx, yy, yy === py ? U('#d6eeff') : U(o.plate)); }
    return { top: yb - h - domeH - ry };
  }
  /* ---------- cilindro horizontal (recipiente / tubo grueso) ---------- */
  function rowTone(f) { return f < 0.08 ? 0 : f < 0.2 ? 4 : f < 0.34 ? 6 : f < 0.55 ? 5 : f < 0.78 ? 3 : f < 0.9 ? 2 : 1; }
  function cylH(pb, x0, x1, cy, r, o = {}) {
    const P = PFK.P32(o.ramp || STEEL), B = PFK.P32(o.band || BAND);
    const t = 2 * r + 1;
    for (let j = 0; j < t; j++) { const f = j / (t - 1), k = rowTone(f); for (let x = x0; x <= x1; x++) { let col = P[k]; for (const bx of (o.bands || [])) if (x >= x0 + bx && x < x0 + bx + 3) col = B[clamp([0, 1, 2, 3, 4, 5, 5][k], 0, 5)]; PFK.put(pb, x, cy - r + j, col); } }
    // tapa izquierda (elipse vertical) iluminada
    PFK.ellipseFn(pb, x0, cy, Math.max(1.5, r * 0.35), r + 0.4, (nx, ny) => P[clamp(Math.round(4.5 - ny * 2 - nx), 1, 7)]);
    PFK.ellipseFn(pb, x1, cy, Math.max(1.5, r * 0.35), r + 0.4, (nx, ny) => nx < 0 ? 0 : P[clamp(Math.round(3 - ny * 1.5), 1, 7)]);
  }

  /* ---------- tuberías ---------- */
  /** pts: [[x,y],...] segmentos ortogonales. r radio (2–4). kind: sea|pre|product|brine|steel */
  function pipe(pb, pts, r, kind = 'sea', o = {}) {
    const K = PIPES[kind] || PIPES.steel, P = PFK.P32(K.ramp), ink = U(K.ink);
    const t = 2 * r + 1;
    const seg = (a, b) => {
      const [x0, y0] = a, [x1, y1] = b;
      if (y0 === y1) { // horizontal
        const xa = Math.min(x0, x1), xb = Math.max(x0, x1);
        for (let j = -1; j <= t; j++) { const f = j / (t - 1); for (let x = xa; x <= xb; x++) PFK.put(pb, x, y0 - r + j, (j < 0 || j === t) ? ink : P[clamp(rowTone(f), 0, P.length - 1)]); }
      } else { // vertical
        const ya = Math.min(y0, y1), yb = Math.max(y0, y1);
        for (let i = -1; i <= t; i++) { const f = i / (t - 1); for (let y = ya; y <= yb; y++) PFK.put(pb, x0 - r + i, y, (i < 0 || i === t) ? ink : P[clamp(colTone(f) - (f > 0.5 ? 0 : 0), 0, P.length - 1)]); }
      }
    };
    for (let i = 0; i < pts.length - 1; i++) seg(pts[i], pts[i + 1]);
    // codos redondeados
    for (let i = 1; i < pts.length - 1; i++) {
      const [x, y] = pts[i];
      PFK.ellipseFn(pb, x + 0.5, y + 0.5, r + 1.6, r + 1.6, (nx, ny, d) => d > 0.78 ? ink : P[clamp(Math.round(3.6 - nx * 1.6 - ny * 1.8), 1, P.length - 1)]);
    }
    // bridas
    const fl = o.flange ?? 22;
    if (fl) for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], L = Math.abs(x1 - x0) + Math.abs(y1 - y0);
      for (let s = fl * 0.6; s < L - 4; s += fl) {
        const fx = Math.round(x0 + Math.sign(x1 - x0) * s), fy = Math.round(y0 + Math.sign(y1 - y0) * s);
        if (y0 === y1) for (let j = -2; j <= t + 1; j++) { PFK.put(pb, fx, fy - r + j, j <= 0 ? P[5] : P[2]); PFK.put(pb, fx + 1, fy - r + j, j === -2 || j === t + 1 ? ink : P[1]); if ((j === -1 || j === t) ) PFK.put(pb, fx, fy - r + j, U('#e8e0d0')); }
        else for (let i2 = -2; i2 <= t + 1; i2++) { PFK.put(pb, fx - r + i2, fy, i2 <= 0 ? P[5] : P[3]); PFK.put(pb, fx - r + i2, fy + 1, i2 === -2 || i2 === t + 1 ? ink : P[1]); }
      }
    }
    // soportes bajo tramos horizontales
    if (o.supports) for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; if (y0 !== y1) continue;
      const xa = Math.min(x0, x1), xb = Math.max(x0, x1);
      for (let x = xa + 10; x < xb - 6; x += o.supports) {
        const C = PFK.P32(PFTerrain.CONC);
        const base = o.supportTo ? o.supportTo(x) : y0 + r + 6;
        for (let y = y0 + r + 1; y < base; y++) { PFK.put(pb, x, y, C[5]); PFK.put(pb, x + 1, y, C[3]); PFK.put(pb, x + 2, y, C[2]); }
        for (let k = -2; k <= 4; k++) PFK.put(pb, x + k, y0 + r + 1, U('#2a282e'));
      }
    }
  }
  /** Válvula de compuerta con volante */
  function valve(pb, x, y, o = {}) {
    const S = PFK.P32(STEEL), R = o.wheel || ['#5a0e10', '#a8242a', '#e04a3a', '#ff8a6a'];
    for (let yy = y - 3; yy <= y + 3; yy++) for (let xx = x - 3; xx <= x + 3; xx++) PFK.put(pb, xx, yy, S[clamp(4 - (xx - x) + (yy < y - 1 ? 1 : 0), 1, 6)]);
    for (let yy = y - 9; yy < y - 3; yy++) { PFK.put(pb, x, yy, S[5]); PFK.put(pb, x + 1, yy, S[2]); }
    PFK.ellipseFn(pb, x + 0.5, y - 9.5, 4, 1.6, (nx, ny, d) => d > 0.45 ? U(R[ny < 0 ? 3 : nx > 0.3 ? 1 : 2]) : 0);
    PFK.put(pb, x, y - 10, U(R[3]));
  }
  /** Manómetro (esfera blanca con aro y aguja estática) */
  function gauge(pb, x, y, r = 3, ang = -0.6) {
    PFK.ellipseFn(pb, x, y, r + 1, r + 1, (nx, ny, d) => d > 0.7 ? U(nx + ny < 0 ? '#d3ccc5' : '#4f4d51') : U(ny < -0.3 ? '#ffffff' : '#e8f0f4'));
    PFK.lineFn(pb, x, y, x + Math.cos(ang) * (r - 1), y + Math.sin(ang) * (r - 1), () => U('#c0242a'));
  }
  /** Gabinete eléctrico con LED (los LED vivos se dibujan por cuadro) */
  function cabinet(pb, x, y, w = 10, h = 14, d = 4) {
    box3q(pb, x, y, w, h, d, { ramp: ['#1a2230', '#2a3a50', '#3e5878', '#5a7aa0', '#86a4c8', '#bcd2ea'] });
    for (let k = 0; k < 3; k++) PFK.put(pb, x + 2 + k * 2, y - h + 3, U(['#3fe0a0', '#ffd84a', '#ff5a4a'][k]));
    for (let yy = y - h + 6; yy < y - 2; yy += 2) for (let xx = x + 2; xx < x + w - 2; xx++) PFK.put(pb, xx, yy, U('#24324a'));
  }
  /** Farola costera */
  function lamp(pb, x, y, h = 30) {
    const S = PFK.P32(STEEL);
    for (let yy = y - h; yy < y; yy++) { PFK.put(pb, x, yy, S[5]); PFK.put(pb, x + 1, yy, S[2]); }
    for (let k = 0; k < 6; k++) PFK.put(pb, x + 1 + k, y - h, S[k < 1 ? 5 : 3]);
    for (let k = 0; k < 5; k++) { PFK.put(pb, x + 4 + k, y - h + 1, U('#2a282e')); PFK.put(pb, x + 4 + k, y - h + 2, U(k > 0 && k < 4 ? '#fff2b0' : '#4f4d51')); }
    for (let k = -2; k <= 3; k++) PFK.put(pb, x + k, y - 1, S[k < 0 ? 4 : 2]);
  }
  function bollard(pb, x, y) {
    const S = PFK.P32(['#141418', '#2a2a34', '#44465a', '#666a80', '#8a90a8', '#c0c6d8']);
    for (let yy = y - 6; yy < y; yy++) for (let k = 0; k < 5; k++) PFK.put(pb, x + k, yy, S[[4, 3, 2, 2, 1][k]]);
    for (let k = -1; k < 6; k++) { PFK.put(pb, x + k, y - 7, S[k < 2 ? 5 : 3]); PFK.put(pb, x + k, y - 6, S[2]); }
  }
  function lifeRing(pb, x, y) {
    PFK.ellipseFn(pb, x, y, 4, 4, (nx, ny, d) => d < 0.25 ? 0 : U(((Math.atan2(ny, nx) + 7) * 2 | 0) % 2 ? '#f4f0e8' : '#e8402e'));
    PFK.put(pb, x - 2, y - 3, U('#ffffff'));
  }
  function crate(pb, x, y, w = 10, h = 8, d = 4) {
    const Wd = ['#2a1408', '#4a2a14', '#6e4422', '#8e5e32', '#b07e4a', '#d0a46a'];
    box3q(pb, x, y, w, h, d, { ramp: Wd, front: (xx, yy, u, v) => { const P = PFK.P32(Wd); return P[(xx - x) % 4 === 0 ? 2 : (yy - y) % 3 === 0 ? 3 : 4]; } });
    PFK.lineFn(pb, x + 1, y - 1, x + w - 2, y - h + 1, () => U('#8e5e32'));
  }
  function barrel(pb, x, y, col = ['#0e2a48', '#163e66', '#245f90', '#2f86c0', '#5ab4e0', '#a8e0f8']) {
    cylV(pb, x, y - 1, 3, 9, { ramp: col, band: ['#101010', '#202020', '#a0a0a0', '#d0d0d0', '#e0e0e0', '#ffffff'], bands: [{ y: 3, h: 1 }, { y: 7, h: 1 }], ell: 0.4 });
  }
  /** Panel solar pequeño inclinado en 3/4 */
  function pvPanel(pb, x, y, w, h) {
    const P = PFK.P32(RAMP.pvR);
    for (let r = 0; r < h; r++) for (let k = 0; k < w; k++) {
      const xx = x + k + Math.round(r * 0.4), yy = y - r;
      const grid = (k % 5 === 0) || (r % 3 === 0);
      const t = (k / w) * 0.5 + (r / h) * 0.6;
      PFK.put(pb, xx, yy, grid ? U('#d1d6e7') : P[clamp(Math.round(1 + t * 5), 0, 6)]);
    }
    for (let k = 0; k < w; k++) PFK.put(pb, x + k, y + 1, U('#2a282e'));
  }

  /* ---------- unidades de la planta ---------- */
  /** Muro de paneles de acero blanco cálido con juntas verticales y franja turquesa */
  function wallFront(x0, stripeY, stripe = '#11bedd') {
    const S = PFK.P32(STEEL);
    return (xx, yy, u, v) => {
      if (stripeY != null && yy >= stripeY && yy < stripeY + 3) return U(yy === stripeY ? '#7cdfec' : stripe);
      let k = 5 - Math.round(v * 1.4) + ((xx - x0) % 6 === 0 ? -1 : 0) + ((xx - x0) % 6 === 1 ? 1 : 0);
      if (u > 0.9) k -= 2;
      if (PFK.vn(xx * 0.4, yy * 0.05, 3) > 0.82) k -= 1;
      return S[clamp(k, 1, 7)];
    };
  }
  /** Ventana con reflejo de cielo */
  function windowQ(pb, x, y, w, h) {
    const G = PFK.P32(GLASS);
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      let k = 2 + Math.round((1 - yy / h) * 1.5 + (xx / w) * 0.5);
      if (xx + yy === Math.round(w * 0.5) || xx + yy === Math.round(w * 0.5) + 1) k = 5;
      PFK.put(pb, x + xx, y + yy, G[clamp(k, 0, 5)]);
    }
    for (let xx = -1; xx <= w; xx++) { PFK.put(pb, x + xx, y - 1, U('#2a282e')); PFK.put(pb, x + xx, y + h, U('#f2efea')); }
    for (let yy = 0; yy < h; yy++) { PFK.put(pb, x - 1, y + yy, U('#4f4d51')); PFK.put(pb, x + w, y + yy, U('#d3ccc5')); }
  }
  /** Casa de bombas en 3/4 con motores en el techo */
  function pumpHouse(pb, x, y, w = 92, h = 46, d = 16) {
    const S = PFK.P32(STEEL);
    // zócalo de hormigón
    box3q(pb, x - 4, y, w + 8, 6, d + 4, { ramp: PFTerrain.CONC });
    const b = box3q(pb, x, y - 6, w, h, d, {
      ramp: STEEL, front: wallFront(x, y - 6 - Math.round(h * 0.42)),
      top: (xx, yy, u, v) => { const R = PFK.P32(ROOF); return R[clamp(Math.round(4 - v * 1.5 + ((xx - x) % 8 === 0 ? -1 : 0) + (PFK.cl(xx, yy, 2, 8) - 0.5)), 1, 5)]; },
      side: (xx, yy) => S[clamp(2 + ((xx) % 5 === 0 ? -1 : 0), 1, 3)],
    });
    // alero
    for (let xx = x - 3; xx < x + w + 3 + b.dx; xx++) { PFK.put(pb, xx, y - 6 - h, U('#f2efea')); PFK.put(pb, xx, y - 6 - h + 1, U('#4f4d51')); }
    // ventanas y puerta
    windowQ(pb, x + 8, y - 6 - h + 8, 18, 10);
    for (let k = 0; k < 4; k++) windowQ(pb, x + 36 + k * 9, y - 6 - h + 8, 6, 10);
    const dxp = x + w - 24;
    for (let yy = y - 6 - 24; yy < y - 6; yy++) for (let xx = dxp; xx < dxp + 13; xx++) PFK.put(pb, xx, yy, xx === dxp ? U('#2a282e') : U(((xx - dxp) % 4 === 0) ? '#3a5068' : '#4a6a8a'));
    PFK.put(pb, dxp + 10, y - 6 - 12, U('#ffd84a'));
    // señal de seguridad
    for (let yy = 0; yy < 6; yy++) for (let xx = 0; xx < 6; xx++) if (Math.abs(xx - 2.5) <= yy * 0.5) PFK.put(pb, x + 10 + xx, y - 6 - 16 + yy, U(yy === 5 || Math.abs(xx - 2.5) > yy * 0.5 - 1 ? '#2a282e' : '#ffd84a'));
    // motores/bombas en el techo (cilindros horizontales) y rejillas de ventilación
    const roofY = y - 6 - h - 2;
    for (let k = 0; k < 3; k++) { const mx = x + 10 + k * 24 + Math.round(d * 0.45 * 0.5); cylH(pb, mx, mx + 12, roofY - 4 - Math.round(d * 0.2), 3, { ramp: ['#0e2a48', '#163e66', '#245f90', '#2f86c0', '#5ab4e0', '#a8e0f8', '#e6f6ff'] }); for (let q = 0; q < 4; q++) PFK.put(pb, mx + 14, roofY - 6 + q, U('#2a282e')); }
    cabinet(pb, x + w - 14 + b.dx - 6, roofY - 2, 9, 8, 3);
    return b;
  }
  /** Torre de toma: fuste de hormigón que sale del agua, cámara de rejillas, plataforma con barandilla y mástil */
  function intakeTower(pb, x, yDeck, yTop, w = 50) {
    const C = PFK.P32(PFTerrain.CONC);
    const b = box3q(pb, x, yDeck, w, yDeck - yTop, 12, {
      ramp: PFTerrain.CONC,
      front: (xx, yy, u, v) => {
        let k = 5 - Math.round(v * 1.2) + ((yy - yTop) % 12 === 0 ? -2 : (yy - yTop) % 12 === 1 ? 1 : 0);
        if (u > 0.82) k -= 2; else if (u < 0.05) k += 1;
        if (PFK.vn(xx * 0.3, yy * 0.04, 6) > 0.8) k -= 1;
        return C[clamp(k, 1, 7)];
      },
    });
    // cámara con rejilla (trash rack) y compuerta
    const rx = x + 8, ry = yTop + 34, rw = 30, rh = 22;
    for (let yy = ry; yy < ry + rh; yy++) for (let xx = rx; xx < rx + rw; xx++) PFK.put(pb, xx, yy, U(((xx - rx) % 3 === 0) ? '#8fb4c4' : ((yy - ry) % 5 === 0) ? '#4a7a94' : '#0e1c30'));
    for (let xx = rx - 1; xx <= rx + rw; xx++) { PFK.put(pb, xx, ry - 1, U('#f5e5c3')); PFK.put(pb, xx, ry + rh, U('#2a2420')); }
    // panel de estado
    for (let yy = yTop + 12; yy < yTop + 24; yy++) for (let xx = x + 14; xx < x + 32; xx++) PFK.put(pb, xx, yy, U(yy === yTop + 12 ? '#ffe58a' : xx === x + 14 ? '#ffe58a' : '#e8a020'));
    for (let yy = yTop + 15; yy < yTop + 21; yy++) for (let xx = x + 21; xx < x + 25; xx++) PFK.put(pb, xx, yy, U('#140d26'));
    // plataforma superior con barandilla, grúa y mástil
    PFTerrain.railing(pb, x - 2, x + w + b.dx, yTop - 12, 7);
    const mx = x + w - 4;
    for (let yy = yTop - 70; yy < yTop - 12; yy++) { PFK.put(pb, mx, yy, U('#d3ccc5')); PFK.put(pb, mx + 1, yy, U('#716f76')); if (yy % 6 === 0) { PFK.put(pb, mx - 1, yy, U('#948e91')); PFK.put(pb, mx + 2, yy, U('#948e91')); } }
    for (let k = 0; k < 5; k++) PFK.put(pb, mx - 2 + k, yTop - 71, U('#2a282e'));
    // pescante de izado
    for (let k = 0; k < 18; k++) { PFK.put(pb, x + 4 + k, yTop - 28 + Math.round(k * 0.3), U('#f0c040')); PFK.put(pb, x + 4 + k, yTop - 27 + Math.round(k * 0.3), U('#8a6a10')); }
    for (let yy = yTop - 28; yy < yTop - 12; yy++) { PFK.put(pb, x + 4, yy, U('#f0c040')); PFK.put(pb, x + 5, yy, U('#8a6a10')); }
    for (let yy = yTop - 22; yy < yTop - 16; yy++) PFK.put(pb, x + 21, yy, U('#4f4d51'));
    return b;
  }
  /** Batería de filtros de medios: n tanques verticales sobre plinto con colector */
  function mediaFilters(pb, x, y, n = 4, o = {}) {
    const r = o.r || 10, h = o.h || 44, gap = o.gap || 34, S = PFK.P32(STEEL);
    const xe = x + 8 + (n - 1) * gap + r + 8;
    box3q(pb, x - 8, y, xe - x + 8, 7, 14, { ramp: PFTerrain.CONC });
    // bastidor de acero detrás de los tanques: pilares, viga con diagonales (se ve entre los tanques)
    const fTop = y - 9 - h - 14;
    for (const px of [x - 6, xe - 6]) for (let yy = fTop; yy < y - 7; yy++) { PFK.put(pb, px, yy, S[5]); PFK.put(pb, px + 1, yy, S[3]); PFK.put(pb, px + 2, yy, S[1]); }
    for (let xx = x - 6; xx < xe - 3; xx++) { PFK.put(pb, xx, fTop, S[6]); PFK.put(pb, xx, fTop + 1, S[3]); PFK.put(pb, xx, fTop + 2, S[1]); }
    for (let k = 0; k < n + 1; k++) { const bx = x - 6 + k * gap; PFK.lineFn(pb, bx, fTop + 3, bx + gap - 2, y - 12, () => S[2]); PFK.lineFn(pb, bx + gap - 2, fTop + 3, bx, y - 12, () => S[1]); }
    // colector superior de agua de mar por detrás de los domos
    pipe(pb, [[x - 10, y - 9 - h - 7], [xe, y - 9 - h - 7]], 3, 'sea', { flange: 17 });
    for (let k = 0; k < n; k++) {
      const cx = x + 8 + k * gap;
      // sombra proyectada del tanque sobre el plinto (hacia la derecha-atrás) y sombra de contacto
      for (let yy = y - 9 - 3; yy < y - 7; yy++) for (let xx = cx - r + 2; xx < cx + r + 5; xx++) { const c = PFK.get(pb, xx, yy); if (c >>> 24) PFK.put(pb, xx, yy, PFK.shU(c, -0.28, 15)); }
      cylV(pb, cx, y - 9, r, h, { dome: 0.6, bands: [{ y: 8, h: 3 }, { y: h - 6, h: 2 }], ladder: k === n - 1, plate: '#245f90', stain: true });
      // patas
      for (const lx of [cx - r + 1, cx + r - 2]) for (let yy = y - 9; yy < y - 6; yy++) { PFK.put(pb, lx, yy, U('#4f4d51')); PFK.put(pb, lx + 1, yy, U('#2a282e')); }
      // boca de hombre (escotilla atornillada) y manómetro frontales
      PFK.ellipseFn(pb, cx - 2, y - 9 - Math.round(h * 0.42), 3.2, 3.2, (nx, ny, d) => d > 0.72 ? U(nx + ny < 0 ? '#f2efea' : '#4f4d51') : (d > 0.45 && ((Math.atan2(ny, nx) * 3 | 0) % 2) ? U('#2a282e') : U(ny < 0 ? '#d3ccc5' : '#948e91')));
      gauge(pb, cx - 5, y - 9 - h + 12, 2);
      valve(pb, cx + 5, y - 17);
      // bajante de agua de mar desde el colector superior
      pipe(pb, [[cx + r - 4, y - 9 - h - 7], [cx + r - 4, y - 9 - h + 5]], 1, 'sea', { flange: 0 });
    }
    // colector inferior (agua pretratada), más grueso y visible, con bridas
    pipe(pb, [[x - 4, y - 14], [xe, y - 14]], 3, 'pre', { flange: 15 });
  }

  /** Nave de rejas y tamices con techo abovedado de vidrio azul (como la CAPTACIÓN de la referencia) */
  function glassHall(pb, x, y, w = 96, h = 30, d = 16) {
    const G = PFK.P32(['#0a1e36', '#123a64', '#1d5a96', '#2f86c0', '#4fb0e4', '#8ad8f4', '#d8f4ff']);
    const S = PFK.P32(STEEL);
    const sk = 0.45, dx = Math.round(d * sk), rv = 9;
    // cuerpo de acero con persianas y ventanales
    box3q(pb, x, y, w, h, d, { ramp: STEEL, front: (xx, yy, u, v) => {
      const lx = xx - x;
      if (lx % 24 < 2) return S[lx % 24 === 0 ? 6 : 2];                // pilares
      if (yy > y - h + 4 && yy < y - h + 15) { const k = 2 + Math.round((1 - (yy - y + h - 4) / 11) * 2 + (lx % 24) / 24); return G[clamp((lx + yy) % 9 === 0 ? 5 : k, 0, 6)]; } // ventanal
      if (yy > y - 12) return S[((yy - y) % 2 === 0) ? 2 : 4];            // persianas
      return S[clamp(5 - Math.round(v), 1, 6)];
    }, top: () => S[3] });
    // bóveda de vidrio: costillas cada 8 px y franja especular
    for (let r = 0; r <= d + 2; r++) {
      const bump = Math.round(Math.sin(Math.PI * clamp(r / (d + 2), 0, 1)) * rv), off = Math.round(r * sk);
      const yy0 = y - h - 1 - r - bump;
      for (let xx = x - 1 + off; xx < x + w + 1 + off; xx++) {
        const front = r < (d + 2) / 2, rib = (xx - x - off) % 8 === 0;
        let k = front ? 4 + (r < 3 ? 1 : 0) : 3 - Math.round((r - (d + 2) / 2) / 3);
        if (rib) k = 6; if (r === 0) k = 6;
        if (front && Math.abs(r - 3) < 1 && !rib) k = 6;
        PFK.put(pb, xx, yy0, rib ? U('#e8f0f8') : G[clamp(k, 0, 6)]);
        // relleno entre filas para no dejar huecos por la curva
        const nb = Math.round(Math.sin(Math.PI * clamp((r + 1) / (d + 2), 0, 1)) * rv);
        for (let q = 1; q <= Math.max(0, nb - bump); q++) PFK.put(pb, xx, yy0 - q, rib ? U('#e8f0f8') : G[clamp(k + 1, 0, 6)]);
      }
    }
    // canalón y bajantes
    for (let xx = x - 2; xx < x + w + 2; xx++) PFK.put(pb, xx, y - h, U('#4f4d51'));
    return { x, y, w, h, d, dx };
  }
  /** Grúa pórtico de mantenimiento (amarilla) */
  function gantry(pb, x, y, w = 60, h = 78) {
    const Y = PFK.P32(['#3a2a04', '#7a5a10', '#c89020', '#f0c040', '#ffe58a']);
    const leg = (lx) => { for (let yy = y - h; yy < y; yy++) { PFK.put(pb, lx, yy, Y[3]); PFK.put(pb, lx + 1, yy, Y[2]); PFK.put(pb, lx + 2, yy, Y[1]); if ((yy - y) % 9 === 0) for (let k = -2; k < 5; k++) PFK.put(pb, lx + k, yy, Y[2]); } };
    leg(x); leg(x + w - 3);
    for (let yy = y - h - 5; yy < y - h; yy++) for (let xx = x - 4; xx < x + w + 4; xx++) PFK.put(pb, xx, yy, Y[yy === y - h - 5 ? 4 : yy === y - h - 1 ? 1 : ((xx - x) % 6 < 3 ? 3 : 2)]);
    // diagonales de la viga
    for (let xx = x; xx < x + w; xx += 6) PFK.lineFn(pb, xx, y - h - 4, xx + 3, y - h - 1, () => Y[1]);
    // polipasto con gancho
    const hx = x + Math.round(w * 0.62);
    for (let yy = y - h; yy < y - h + 6; yy++) for (let xx = hx - 3; xx < hx + 4; xx++) PFK.put(pb, xx, yy, U(yy === y - h ? '#f2efea' : '#4f4d51'));
    for (let yy = y - h + 6; yy < y - h + 30; yy++) PFK.put(pb, hx, yy, U('#2a282e'));
    PFK.put(pb, hx - 1, y - h + 30, U('#d3ccc5')); PFK.put(pb, hx, y - h + 31, U('#d3ccc5')); PFK.put(pb, hx + 1, y - h + 30, U('#d3ccc5'));
  }
  /** Transformador con aletas y aisladores */
  function transformer(pb, x, y) {
    box3q(pb, x, y, 22, 16, 8, { ramp: ['#14202a', '#24384a', '#3a566e', '#567a94', '#7aa0b8', '#a8c4d4'], front: (xx, yy, u, v) => PFK.P32(['#14202a', '#24384a', '#3a566e', '#567a94', '#7aa0b8', '#a8c4d4'])[(xx - x) % 3 === 0 ? 1 : 3 - Math.round(v)] });
    for (const bx of [x + 4, x + 11, x + 18]) for (let k = 0; k < 7; k++) { PFK.put(pb, bx + 2, y - 16 - 4 - k, U(k % 2 ? '#c8562a' : '#e8805a')); PFK.put(pb, bx + 3, y - 16 - 4 - k, U('#8a3a1a')); }
    for (let k = 0; k < 3; k++) PFK.put(pb, x + 3 + k * 7, y - 12, U(k === 1 ? '#ffd84a' : '#2a282e'));
  }
  /* ---------- flujo animado (chevrones) ---------- */
  /** runs: [{pts, kind, rate?, on?}] en coordenadas de mundo. Un chevrón cada 12 px, 20 px/s. */
  function drawFlows(g, sc, runs) {
    const ox = sc.cam.ox, oy = sc.cam.oy, t = Game.time;
    for (const run of runs) {
      const K = PIPES[run.kind] || PIPES.sea;
      const rate = typeof run.rate === 'function' ? run.rate(sc) : (run.rate ?? 1);
      if (rate <= 0) continue;
      g.fillStyle = K.chev;
      let acc = 0;
      for (let i = 0; i < run.pts.length - 1; i++) {
        const [x0, y0] = run.pts[i], [x1, y1] = run.pts[i + 1], L = Math.abs(x1 - x0) + Math.abs(y1 - y0);
        const sx = Math.sign(x1 - x0), sy = Math.sign(y1 - y0);
        if (Math.max(x0, x1) - ox < -8 || Math.min(x0, x1) - ox > W + 8 || Math.max(y0, y1) - oy < -8 || Math.min(y0, y1) - oy > H + 8) { acc += L; continue; }
        const ph = (t * 20 * rate + 1000 - acc) % 12;
        for (let s = ph; s < L - 2; s += 12) {
          const cx = Math.round(x0 + sx * s - ox), cy = Math.round(y0 + sy * s - oy);
          g.globalAlpha = 0.85;
          if (sx) { g.fillRect(cx, cy - 1, 1, 3); g.fillRect(cx + sx, cy, 1, 1); g.fillRect(cx - sx, cy - 2, 1, 1); g.fillRect(cx - sx, cy + 2, 1, 1); }
          else { g.fillRect(cx - 1, cy, 3, 1); g.fillRect(cx, cy + sy, 1, 1); g.fillRect(cx - 2, cy - sy, 1, 1); g.fillRect(cx + 2, cy - sy, 1, 1); }
        }
        acc += L;
      }
      g.globalAlpha = 1;
    }
  }
  /** LED parpadeantes: [{x,y,col,hz,ph}] mundo */
  function drawLeds(g, sc, leds) {
    const ox = sc.cam.ox, oy = sc.cam.oy, t = Game.time;
    for (const L of leds) {
      const x = L.x - ox, y = L.y - oy; if (x < -4 || x > W + 4 || y < -4 || y > H + 4) continue;
      const on = Math.sin((t * (L.hz || 1.5) + (L.ph || 0)) * TAU) > -0.2;
      if (!on) continue;
      g.fillStyle = L.col; g.fillRect(x, y, 1, 1);
      g.globalAlpha = 0.35; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); g.globalAlpha = 1;
    }
  }
  function gallery(pb) {
    pb.rect(0, 0, 640, 360, '#6fa4e8'); pb.rect(0, 250, 640, 110, '#cebaac');
    pumpHouse(pb, 20, 250);
    intakeTower(pb, 160, 250, 170);
    mediaFilters(pb, 260, 250, 4);
    pipe(pb, [[420, 230], [470, 230], [470, 200], [560, 200]], 3, 'sea', { supports: 30 });
    pipe(pb, [[420, 245], [600, 245]], 3, 'product');
    pipe(pb, [[420, 215], [520, 215], [520, 180]], 4, 'brine');
    cylH(pb, 540, 620, 160, 6, { bands: [10, 40, 70] });
    valve(pb, 600, 230); gauge(pb, 610, 215); cabinet(pb, 560, 250); lamp(pb, 590, 250); bollard(pb, 620, 250); lifeRing(pb, 630, 235); crate(pb, 540, 250); barrel(pb, 525, 250);
    pvPanel(pb, 430, 140, 30, 10);
  }
  return { box3q, cylV, cylH, pipe, valve, gauge, cabinet, lamp, bollard, lifeRing, crate, barrel, pvPanel, windowQ, wallFront, pumpHouse, intakeTower, mediaFilters, glassHall, gantry, transformer, drawFlows, drawLeds, gallery, STEEL, BAND, GLASS, ROOF, PIPES };
})();
