/* =====================================================================
   17p_vista_dust.js — Kit VISTA (rollout B): tormenta de polvo (calima).
   Sin tramado: velos con alfa cuantizado en bandas y borde de nubosidad
   periódico (se repiten sin costura al desplazarse con el viento).
     VISTA.dustVeil(w, h, {seed, cols, a0, a1, billow, streaks, dense}) → {c, w, h}
     VISTA.drawVeil(g, veil, y, off, alpha)                 2 drawImage (repetición horizontal)
     VISTA.stormWall(w, h, {seed, n, pal, tint, k}) → PixelBuffer   muro de polvo (haboob) de cúmulos
     VISTA.dustPlane(pb, col, k, {y0, y1})                  baña un plano en polvo (más abajo, más denso)
     VISTA.dustOn(pb, x0, y0, w, h, col, k)                 capa de polvo sobre FV / tejados
     VISTA.veilMask(w, h, {r0, r1, dens, col, bands, sy}) → lienzo con claro circular en bandas (sustituye al tramado)
   ===================================================================== */
(() => {
  const V = VISTA;
  V.DUST = {
    sky: ['#36100c', '#4e1810', '#682214', '#842e18', '#a03e1c', '#bc5222', '#d26a2c', '#e28838', '#eea64c', '#f6c266'],
    wall: ['#22090a', '#33100c', '#47160e', '#5e1e10', '#762a14', '#8e381a', '#a64a22', '#be622e', '#d47e3e'],
    clear: ['#2a6ad8', '#3a7ee4', '#4a90ec', '#62a2f0', '#82b4ee', '#a4c4e8', '#c4cad8', '#dcc4b0'],
    pal: ['#3a160e', '#56200f', '#742e16', '#92401e', '#ae5628', '#c66e34', '#d88a44', '#e6a65a', '#f0c07a'],
    veil: ['#7a3818', '#a04e22', '#c06a30', '#d8884a', '#e8a868'],
    haze: '#c87a48',
  };
  /** Velo de polvo periódico: alfa en 5 niveles, borde superior abombado, estrías de viento */
  V.dustVeil = function (w, h, o = {}) {
    const r = RNG(o.seed || 1), pb = new PixelBuffer(w, h);
    const cols = (o.cols || V.DUST.veil).map(U), nC = cols.length;
    const a0 = o.a0 ?? 0.15, a1 = o.a1 ?? 0.75;
    // borde abombado: suma de senos con número entero de ciclos → sin costura
    const waves = [];
    for (let i = 0; i < 5; i++) waves.push([r.int(2 + i * 2, 4 + i * 4), r.range(0, TAU), (o.billow ?? 0.32) * h * (0.5 / (i + 1)) * r.range(0.6, 1.2)]);
    const top = (x) => { let v = h * (o.topK ?? 0.3); for (const [kk, ph, a] of waves) v += Math.sin(x / w * TAU * kk + ph) * a; return v; };
    const per = (x, y, s) => hash2(((x % w) + w) % w >> 2, y >> 1, s);
    for (let x = 0; x < w; x++) {
      const yt = top(x);
      for (let y = Math.max(0, Math.floor(yt)); y < h; y++) {
        const v = clamp((y - yt) / Math.max(1, h - yt), 0, 1);
        // perfil: sube rápido bajo el borde y se mantiene denso (o se aclara abajo si dense=false)
        let a = a0 + (a1 - a0) * Math.min(1, v * 3.2);
        if (o.dense === false) a *= 1 - Math.max(0, v - 0.6) * 1.8;
        a += (per(x, y, 7) - 0.5) * 0.12;
        const lv = clamp(Math.round(a * 5), 0, 5); if (!lv) continue;
        // color: borde superior iluminado, interior más oscuro
        let ci = clamp(Math.round((1 - v) * (nC - 1) * 0.9 + (per(x, y, 9) - 0.5) * 1.2), 0, nC - 1);
        if (y - yt < 1.5) ci = nC - 1;
        // estrías horizontales de viento
        if (o.streaks !== false && ((y * 7 + Math.floor(x / 23)) % 11 === 0) && per(x, y, 3) < 0.7) ci = Math.min(nC - 1, ci + 1);
        pb.data[y * w + x] = ((Math.round(lv / 5 * 255) << 24) | (cols[ci] & 0xffffff)) >>> 0;
      }
    }
    return { c: pb.toCanvas(), w, h };
  };
  V.drawVeil = function (g, veil, y, off, alpha) {
    if (alpha <= 0.01) return;
    const o = ((off % veil.w) + veil.w) % veil.w;
    g.globalAlpha = Math.min(1, alpha);
    g.drawImage(veil.c, Math.round(-o), Math.round(y));
    if (veil.w - o < W) g.drawImage(veil.c, Math.round(veil.w - o), Math.round(y));
    g.globalAlpha = 1;
  };
  /** Muro de tormenta: cúmulos de polvo enormes unidos en una franja, con base difusa */
  V.stormWall = function (w, h, o = {}) {
    const r = RNG(o.seed || 5), pb = new PixelBuffer(w, h);
    const n = o.n || Math.ceil(w / 120);
    for (let i = 0; i < n; i++) {
      const cw = r.int(o.wMin ?? 150, o.wMax ?? 260), ch = Math.round(cw * r.range(o.hK0 ?? 0.5, o.hK1 ?? 0.68));
      const C = V.cumulus(cw, Math.min(h, ch), (o.seed || 5) * 50 + i, { pal: o.pal || V.DUST.pal, sun: r.range(-0.4, 0.6), tower: r.range(0.6, 1), warm: false });
      V.blit(pb, C, Math.round((i / n) * w + r.range(-30, 30) - cw / 2), h - C.h + r.int(0, 10));
      if (i % 2 === 0) V.blit(pb, C, Math.round((i / n) * w + r.range(-30, 30) - cw / 2) + w, h - C.h + r.int(0, 10)); // envoltura
    }
    // base difusa: los últimos píxeles se funden con un velo denso
    const FU = U(o.tint || '#c46a34');
    for (let y = Math.round(h * 0.65); y < h; y++) { const k = (y - h * 0.65) / (h * 0.35); for (let x = 0; x < w; x++) { const i = y * w + x; if (pb.data[i] >>> 24) pb.data[i] = V.mixU(pb.data[i], FU, k * 0.55); else if (k > 0.4) pb.data[i] = ((Math.round((k - 0.4) * 1.6 * 200) << 24) | (FU & 0xffffff)) >>> 0; } }
    return pb;
  };
  /** Baña un plano en polvo (más denso hacia la base) */
  V.dustPlane = function (pb, col, k, o = {}) {
    const u = U(col), y0 = o.y0 ?? 0, y1 = o.y1 ?? pb.h;
    for (let y = y0; y < y1; y++) {
      const kk = k * (0.7 + 0.3 * (y - y0) / Math.max(1, y1 - y0));
      for (let x = 0; x < pb.w; x++) { const i = y * pb.w + x; const c = pb.data[i]; if (c >>> 24) pb.data[i] = ((c & 0xff000000) | (V.mixU(c, u, kk) & 0xffffff)) >>> 0; }
    }
  };
  /** Capa de polvo sobre una superficie (FV sucia, tejados): mitad superior más cubierta */
  V.dustOn = function (pb, x0, y0, w, h, col, k) {
    const u = U(col);
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { const c = V.get(pb, x, y); if (!(c >>> 24)) continue; const kk = k * (1 - (y - y0) / h * 0.6) * (0.7 + hash2(x >> 1, y, 5) * 0.5); V.put(pb, x, y, V.mixU(c, u, clamp(kk, 0, 1))); }
  };
  /** Máscara de velo con claro circular: alfa en bandas con borde en clusters (sin tramado) */
  V.veilMask = function (w, h, o = {}) {
    const pb = new PixelBuffer(w, h), u = U(o.col || '#5a2410') & 0xffffff, nb = o.bands || 6;
    const r0 = o.r0 ?? 150, r1 = o.r1 ?? 330, dens = o.dens ?? 0.3, sy = o.sy ?? 1.25;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dd = Math.hypot(x - w / 2, (y - h / 2) * sy);
      let f = clamp((dd - r0) / r1, 0, 1);
      f += (hash2((x / 3) | 0, (y / 2) | 0, 41) - 0.5) * (1 / nb) * 0.9;
      const lv = clamp(Math.round(f * nb), 0, nb); if (!lv) continue;
      pb.data[y * w + x] = ((Math.round(lv / nb * dens * 255) << 24) | u) >>> 0;
    }
    return pb.toCanvas();
  };
})();
