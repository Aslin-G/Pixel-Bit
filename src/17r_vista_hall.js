/* =====================================================================
   17r_vista_hall.js — Kit VISTA (rollout B): gran salón ceremonial.
     VISTA.royalWall(pb, x0, y0, w, h, {k, ramp, seed})       muro azul real con paneles y estuco
     VISTA.mosaicBand(pb, x0, x1, y, h, {k, cols, cell})      friso de teselas (agua, sol, viento, hoja…)
     VISTA.goldTrim(pb, x0, x1, y, {k})                       moldura dorada de 3 px
     VISTA.goldColumn(pb, x, y0, y1, w, {k})                  columna dorada estriada con capitel y basa
     VISTA.sconce(pb, x, y, {k}) → [x, y]                     aplique de pared cálido
     VISTA.beam(w, h, slant, {col, a0, w0}) → lienzo de haz de luz inclinado (alfa en bandas)
     VISTA.bench3q(pb, x, y, w, {k})                          banco de madera en 3/4
     VISTA.planter(pb, x, y, {k, seed})                       maceta de cerámica con agave
   ===================================================================== */
(() => {
  const V = VISTA;
  const ramp = (r, k, hz) => V.P32(V.hz(r, k || 0, hz));
  const ROYAL = ['#060c2e', '#0a1440', '#0e1f5a', '#14287a', '#1c3596', '#2a46b0', '#3a5ac4', '#5a7ad4'];
  const GOLD = ['#3a2408', '#5a3a0e', '#8a5e14', '#b07a1c', '#c8861a', '#e0a83a', '#f0c860', '#ffe08a', '#fff4c8'];
  const WOODH = ['#200e06', '#3a1c0c', '#5a3016', '#7a4620', '#9a5e2c', '#ba7c3e', '#d49c58'];
  V.HALL = { ROYAL, GOLD, WOODH };
  V.royalWall = function (pb, x0, y0, w, h, o = {}) {
    const R = ramp(o.ramp || ROYAL, o.k), n = R.length, seed = o.seed || 9;
    for (let y = Math.max(0, y0); y < Math.min(pb.h, y0 + h); y++) for (let x = Math.max(0, x0); x < Math.min(pb.w, x0 + w); x++) {
      const v = (y - y0) / h, st = fbm(x * 0.03, y * 0.03, 3, seed);
      let t = 0.42 + (st - 0.5) * 0.18 - Math.abs(v - 0.45) * 0.25;
      // paneles rehundidos de 40×30 con bisel claro arriba-izquierda
      const px = (x - x0) % 44, py = (y - y0) % 34;
      if (px === 0 || py === 0) t -= 0.16; else if (px === 1 || py === 1) t += 0.12; else if (px === 43 || py === 33) t -= 0.08;
      pb.data[y * pb.w + x] = R[V.band(clamp(t, 0, 0.999), n, x, y, 0.04, seed)];
    }
  };
  V.mosaicBand = function (pb, x0, x1, y, h, o = {}) {
    const cols = (o.cols || ['#20d6c7', '#ffe14d', '#4ccb70', '#ff6b6b', '#ffffff', '#1f854c', '#3a8adc']).map(c => U(V.hzc(c, o.k || 0))), cell = o.cell || 4;
    const G = U(V.hzc('#0a1440', o.k || 0));
    for (let yy = y; yy < y + h; yy++) for (let x = Math.round(x0); x < x1; x++) {
      const cx = Math.floor(x / cell), cy = Math.floor((yy - y) / cell);
      const grout = (x % cell === 0) || ((yy - y) % cell === 0);
      // motivo: ondas (agua) y rombos (sol) alternos
      const m = (cx + Math.round(Math.sin(cx * 0.5) * 1.5) + cy * 3) % cols.length;
      V.put(pb, x, yy, grout ? G : cols[(m + cols.length) % cols.length]);
    }
    V.goldTrim(pb, x0, x1, y - 3, o); V.goldTrim(pb, x0, x1, y + h, o);
  };
  V.goldTrim = function (pb, x0, x1, y, o = {}) {
    const G = ramp(GOLD, o.k);
    for (let x = Math.round(x0); x < x1; x++) { V.put(pb, x, y, G[7]); V.put(pb, x, y + 1, (x % 6 < 3) ? G[5] : G[4]); V.put(pb, x, y + 2, G[2]); }
  };
  V.goldColumn = function (pb, x, y0, y1, w, o = {}) {
    const G = ramp(GOLD, o.k), n = G.length;
    for (let y = y0; y < y1; y++) for (let xx = 0; xx < w; xx++) {
      const t = xx / Math.max(1, w - 1), flute = (xx % 4) === 3;
      let i = t < 0.15 ? n - 2 : t < 0.35 ? n - 1 : t < 0.6 ? n - 4 : t < 0.85 ? 3 : 2;
      if (flute) i = Math.max(1, i - 2);
      V.put(pb, x + xx, y, G[i]);
    }
    // capitel y basa
    for (let q = 0; q < 6; q++) for (let xx = -3 + Math.min(q, 3); xx < w + 3 - Math.min(q, 3); xx++) { V.put(pb, x + xx, y0 + q, G[q === 0 ? n - 1 : q < 3 ? n - 3 : 3]); V.put(pb, x + xx, y1 - 1 - q, G[q === 0 ? 1 : q < 3 ? n - 4 : 4]); }
  };
  V.sconce = function (pb, x, y, o = {}) {
    const G = ramp(GOLD, o.k);
    V.rect(pb, x - 2, y, 5, 2, G[4]); V.put(pb, x, y + 2, G[3]); V.put(pb, x, y + 3, G[2]);
    V.put(pb, x - 1, y - 1, U('#ffe8a8')); V.put(pb, x, y - 1, U('#fff8e0')); V.put(pb, x + 1, y - 1, U('#ffe8a8')); V.put(pb, x, y - 2, U('#ffd070'));
    return [x, y - 1];
  };
  const _beam = new Map();
  /** Haz de luz inclinado (paralelogramo) con alfa en bandas: borde más tenue, se desvanece hacia abajo */
  V.beam = function (w, h, slant, o = {}) {
    const key = [w, h, slant, o.col, o.a0, o.w0].join('|'); let c = _beam.get(key); if (c) return c;
    const W2 = Math.ceil(w + Math.abs(slant) + 2), pb = new PixelBuffer(W2, h), u = U(o.col || '#ffd8a0') & 0xffffff, a0 = o.a0 ?? 0.2, w0 = o.w0 ?? w;
    for (let y = 0; y < h; y++) {
      const v = y / h, cx = (slant >= 0 ? 0 : -slant) + slant * v, bw = lerp(w0, w, v);
      for (let x = 0; x < W2; x++) {
        const d = (x - cx) / bw; if (d < 0 || d > 1) continue;
        const edge = Math.min(d, 1 - d) * 2, lv = Math.floor(Math.min(1, edge * 2.2) * (1 - v * 0.7) * 4);
        if (lv > 0) pb.data[y * W2 + x] = ((Math.round(a0 * lv / 4 * 255) << 24) | u) >>> 0;
      }
    }
    c = { c: pb.toCanvas(), w: W2, h }; _beam.set(key, c); return c;
  };
  V.bench3q = function (pb, x, y, w, o = {}) {
    const k = o.k || 0, Wd = ramp(WOODH, k), n = Wd.length;
    for (let xx = 0; xx < w; xx++) { V.put(pb, x + xx + 2, y - 7, Wd[n - 1]); V.put(pb, x + xx + 1, y - 6, Wd[n - 2]); V.put(pb, x + xx, y - 5, Wd[n - 3]); V.put(pb, x + xx, y - 4, Wd[2]); }
    for (let xx = 0; xx < w; xx++) { V.put(pb, x + xx + 3, y - 13, Wd[n - 2]); V.put(pb, x + xx + 3, y - 12, Wd[3]); }
    for (const lx of [2, w - 3]) { for (let yy = y - 4; yy <= y; yy++) V.put(pb, x + lx, yy, Wd[1]); for (let yy = y - 12; yy < y - 7; yy++) V.put(pb, x + lx + 3, yy, Wd[2]); }
    for (let xx = 0; xx < w + 3; xx++) V.blend(pb, x + xx + 1, y + 1, U('#05081d'), 0.5);
  };
  V.planter = function (pb, x, y, o = {}) {
    const k = o.k || 0, r = RNG(o.seed || 3), C = ramp(['#5a2414', '#80381c', '#a85024', '#c06a30', '#d4843e', '#e8a868'], k), Gr = ramp(V.LIFE.FOL, k);
    for (let yy = 0; yy < 12; yy++) { const hw = Math.round(lerp(7, 5, yy / 12)); for (let xx = -hw; xx <= hw; xx++) V.put(pb, x + xx, y - yy, C[clamp(Math.round(3 - xx / hw * 1.5 + (yy > 9 ? 1 : 0)), 0, 5)]); }
    for (let xx = -8; xx <= 8; xx++) V.put(pb, x + xx, y - 12, C[5]);
    for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.32, L = r.int(8, 14); for (let q = 2; q < L; q++) V.put(pb, Math.round(x + Math.cos(a) * q), Math.round(y - 13 + Math.sin(a) * q), Gr[clamp(6 - (q >> 2) - (i % 2), 1, 8)]); }
  };
})();
