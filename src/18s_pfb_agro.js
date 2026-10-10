/* =====================================================================
   18s_pfb_agro.js — Agroecología en el plano jugable (kit B, nivel 8).
   Cultivos a escala de personajes de ≈74 px (maíz ≈60, sorgo ≈56,
   tomate entutorado ≈38, ají ≈22, frijol, ahuyama rastrera, nopal ≈44),
   bancales elevados en 3/4 con hileras que se alejan, goteo con
   emisores, sensores de suelo, casa-malla, invernadero, banco de semillas
   de adobe con balcón, pozo con bomba solar, cisterna de lluvia, tanque
   de mezcla, compostera, colmenas, bebedero, frutales y el cují antiguo.
   Todo prerenderizado (props) salvo los sprites de cabra (tira).
   stress 0..1: quema de bordes en hojas viejas (la planta sigue verde).
   ===================================================================== */
const PFAgro = (() => {
  const K = PFK, B = PFB;
  const LEAF = ['#0e1e08', '#1c3410', '#2c4e16', '#3e6a1c', '#568a24', '#74a830', '#98c442', '#c0dc62', '#e2ee90'];
  const MAIZE = ['#162a0c', '#24421a', '#365e22', '#4a7a28', '#62962e', '#80b03a', '#a6c850', '#ccdc78'];
  const DRYL = ['#3a2410', '#6a4a1e', '#a07a34', '#c8a04a', '#e6c46a'];
  const NOPAL = ['#0e2418', '#1a3a26', '#285636', '#3a7248', '#4f8e5a', '#6eaa6e', '#9ac88a'];
  const cache = new Map();
  const leafK = (k, stress, s, seed) => (stress > 0.15 && s > 0.75 && hash1(seed, 7) < stress) ? -1 : k;
  /** Hoja larga y arqueada (maíz/sorgo): ancho 2→1, cae por gravedad */
  function blade(pb, x, y, dir, L, P, stress, seed) {
    let a = -0.9 * dir === 0 ? 0 : (dir > 0 ? -0.7 : -Math.PI + 0.7), xx = x, yy = y;
    for (let i = 0; i < L; i++) {
      const t = i / L; a += dir * 0.05 + (dir > 0 ? 0.035 : -0.035) * t * 2.2;
      xx += Math.cos(a); yy += Math.sin(a);
      const burnt = stress > 0.15 && t > 0.8 && hash1(seed, 3) < stress + 0.2;
      const k = burnt ? -1 : clamp(Math.round(5 - t * 2 + (dir < 0 ? 1 : 0)), 1, P.length - 1);
      const c = k < 0 ? U(DRYL[2 + (i % 2)]) : P[k];
      K.put(pb, Math.round(xx), Math.round(yy), c);
      if (t < 0.65) K.put(pb, Math.round(xx), Math.round(yy) + 1, k < 0 ? U(DRYL[1]) : P[Math.max(0, k - 2)]);
    }
  }
  /** Sprite de una planta. Devuelve {s, ox, oy} con ancla en la base */
  function plant(kind, growth = 1, stress = 0, seed = 1) {
    const key = kind + '|' + Math.round(growth * 4) + '|' + Math.round(stress * 4) + '|' + (seed % 5);
    let c = cache.get(key); if (c) return c;
    const r = RNG(seed * 13 + 7), g = clamp(growth, 0.15, 1);
    let s, ox, oy;
    const L = K.P32(LEAF), M = K.P32(MAIZE);
    if (kind === 'maiz' || kind === 'sorgo') {
      const h = Math.round((kind === 'maiz' ? 60 : 54) * g), w = 34;
      s = B.sprite(w, h + 8); ox = 17; oy = h + 4;
      const sx = 17;
      for (let y = 0; y < h; y++) { const yy = oy - y; K.put(s, sx, yy, M[5]); K.put(s, sx + 1, yy, M[3]); if (y < h * 0.3) K.put(s, sx - 1, yy, M[2]); if (y % 9 === 0) { K.put(s, sx, yy, M[6]); K.put(s, sx + 1, yy, M[4]); } }
      // raíces de anclaje
      for (const dx of [-3, -2, 2, 3]) K.put(s, sx + dx, oy, U('#7a5a2e'));
      for (let i = 0; i < Math.round(7 * g); i++) {
        const yy = oy - 6 - i * Math.round(h / 8), dir = i % 2 ? 1 : -1;
        blade(s, sx + (dir > 0 ? 1 : 0), yy, dir, Math.round((14 + r() * 6) * (1 - i * 0.05) * (0.6 + g * 0.4)), M, i < 2 ? stress : stress * 0.3, seed + i);
      }
      if (kind === 'maiz') {
        if (g > 0.6) { for (let k = 0; k < 7; k++) { K.put(s, sx + (k % 3) - 1, oy - h - k, U(k % 2 ? '#e6c46a' : '#c8a04a')); } K.put(s, sx - 2, oy - h - 2, U('#e6c46a')); K.put(s, sx + 3, oy - h - 3, U('#c8a04a')); }
        if (g > 0.7) for (const [cy, d] of [[Math.round(h * 0.45), 1], [Math.round(h * 0.6), -1]]) { const yy = oy - cy; for (let k = 0; k < 7; k++) { K.put(s, sx + d * 2, yy + k, M[k < 2 ? 6 : 4]); K.put(s, sx + d * 3, yy + k + 1, M[k < 3 ? 5 : 3]); } K.put(s, sx + d * 2, yy - 1, U('#e8a8a0')); K.put(s, sx + d * 3, yy - 2, U('#f4d0b0')); }
      } else {
        // panoja rojiza del sorgo
        if (g > 0.55) for (let k = 0; k < 9; k++) for (let j = -2; j <= 2; j++) if (Math.abs(j) <= 2 - Math.abs(k - 4) * 0.4) K.put(s, sx + j, oy - h - 8 + k, U(['#6a1a12', '#a8381e', '#d0582a', '#e88a4a'][clamp(2 - j + (k % 2), 0, 3)]));
      }
    } else if (kind === 'tomate') {
      const h = Math.round(38 * g); s = B.sprite(30, h + 6); ox = 15; oy = h + 3;
      const Wd = K.P32(B.R.WOOD);
      for (let y = 0; y < h + 2; y++) { K.put(s, 18, oy - y, Wd[5]); K.put(s, 19, oy - y, Wd[3]); }
      for (let i = 0; i < 4; i++) PFFlora.cluster(s, 15 + (i % 2 ? 4 : -3), oy - 6 - i * Math.round(h / 4.5), 6, 5, i < 1 && stress > 0.3 ? ['#2a2a0c', '#4a4a16', '#6e6a20', '#8a8a2a', '#a6a43a', '#c4c060'] : LEAF, seed + i, { density: 0.7, leaf: [3, 5] });
      for (let i = 0; i < Math.round(5 * g); i++) { const fx = 9 + Math.round(r() * 12), fy = oy - 8 - Math.round(r() * (h - 12)), big = stress < 0.4 || i % 2; const R_ = ['#5a0a0a', '#a8201a', '#e0402a', '#ff8a6a'], rr = big ? 2 : 1; K.ellipseFn(s, fx, fy, rr + 0.4, rr + 0.4, (nx, ny, d) => U(R_[d < 0.3 && nx < 0 && ny < 0 ? 3 : ny > 0.3 ? 1 : 2])); }
      for (let y = 6; y < h; y += 9) { K.put(s, 17, oy - y, U('#e8e0d0')); K.put(s, 20, oy - y, U('#e8e0d0')); }
    } else if (kind === 'aji') {
      const h = Math.round(24 * g); s = B.sprite(24, h + 6); ox = 12; oy = h + 3;
      PFFlora.cluster(s, 12, oy - h * 0.45, 8, h * 0.45, ['#0c1c10', '#18331a', '#2a4f22', '#3f6a26', '#5f8a2c', '#8fb03a', '#c4d45a'], seed, { density: 0.8, leaf: [3, 4] });
      for (let i = 0; i < Math.round(6 * g); i++) { const fx = 6 + Math.round(r() * 12), fy = oy - 4 - Math.round(r() * h * 0.7); for (let k = 0; k < 4; k++) K.put(s, fx, fy + k, U(k === 0 ? '#3a6a1c' : (i % 3 === 0 ? ['#2a5a10', '#4a8a1e', '#6aaa2a'] : ['#7a0a0a', '#c82a1a', '#f05a3a'])[k === 1 ? 2 : 1])); }
    } else if (kind === 'frijol') {
      const h = Math.round(20 * g); s = B.sprite(26, h + 6); ox = 13; oy = h + 3;
      for (let i = 0; i < 6; i++) { const lx = 4 + Math.round(r() * 18), ly = oy - 3 - Math.round(r() * h * 0.8); for (let k = 0; k < 3; k++) K.ellipseFn(s, lx + [0, -3, 3][k], ly + [-2, 1, 1][k], 2.2, 1.7, (nx, ny) => L[clamp(Math.round(5 - nx - ny * 1.5 - (i < 2 && stress > 0.3 && k === 2 ? 3 : 0)), 1, 8)]); }
      for (let i = 0; i < Math.round(4 * g); i++) { const px = 6 + Math.round(r() * 14), py = oy - 2 - Math.round(r() * h * 0.6); for (let k = 0; k < 5; k++) K.put(s, px + (k > 2 ? 1 : 0), py + k, U(k === 0 ? '#c8d880' : '#86b03a')); }
      if (g > 0.5) for (let i = 0; i < 3; i++) K.put(s, 6 + i * 6, oy - h + 2 + i, U('#f6f0ff'));
    } else if (kind === 'ahuyama') {
      s = B.sprite(40, 22); ox = 20; oy = 19;
      for (let i = 0; i < 7; i++) { const lx = 4 + Math.round(r() * 32), ly = oy - 2 - Math.round(r() * 10), rr = 4 + r() * 2.5; K.ellipseFn(s, lx, ly, rr, rr * 0.75, (nx, ny, d) => L[clamp(Math.round(5.4 - nx * 1.4 - ny * 1.8 - (d > 0.75 ? 1.5 : 0) + ((Math.atan2(ny, nx) * 2.5 | 0) % 2 ? 0.6 : 0)), 1, 8)]); }
      for (let x = 2; x < 38; x++) if (hash2(x, 1, seed) < 0.5) K.put(s, x, oy, L[2]);
      if (g > 0.5) { const fx = 14 + Math.round(r() * 10); K.ellipseFn(s, fx, oy - 3, 5.5, 3.8, (nx, ny, d) => U(['#7a3208', '#c0601a', '#e8862a', '#ffb860'][clamp(Math.round(2.2 - nx - ny * 1.2 + ((Math.abs(nx * 4) | 0) % 2 ? -0.6 : 0)), 0, 3)])); }
      for (let i = 0; i < 3; i++) { const fx = 6 + i * 12, fy = oy - 9 - (i % 2) * 3; K.put(s, fx, fy, U('#ffe14d')); K.put(s, fx + 1, fy, U('#f0a820')); K.put(s, fx, fy - 1, U('#fff6a0')); }
    } else if (kind === 'nopal') {
      const h = Math.round(44 * g); s = B.sprite(40, h + 6); ox = 20; oy = h + 3;
      const N = K.P32(NOPAL), pads = [[20, 0, 7, 10], [13, 14, 6, 8], [27, 14, 6, 8], [20, 22, 5, 7], [10, 28, 4, 6], [29, 28, 5, 6]];
      for (const [px, py, rx, ry] of pads.slice(0, Math.round(3 + g * 3))) {
        const cy = oy - 10 - py * (h / 44);
        K.ellipseFn(s, px, cy, rx, ry, (nx, ny, d) => N[clamp(Math.round(4 - nx * 1.6 - ny * 1.2 - (d > 0.8 ? 1.4 : 0)), 0, 6)]);
        for (let k = 0; k < 4; k++) K.put(s, Math.round(px + (hash2(px, k, 2) - 0.5) * rx * 1.4), Math.round(cy + (hash2(py, k, 3) - 0.5) * ry * 1.4), U('#f4f0d0'));
        if (g > 0.6 && py > 10) for (let k = 0; k < 2; k++) { const tx = px - 3 + k * 5, ty = Math.round(cy - ry); K.ellipseFn(s, tx, ty, 1.8, 1.6, (nx, ny) => U(ny < 0 ? '#ff5a9a' : '#b81a5a')); }
      }
    } else if (kind === 'girasol' || kind === 'flor') {
      const h = Math.round((kind === 'girasol' ? 46 : 18) * g); s = B.sprite(18, h + 8); ox = 9; oy = h + 4;
      for (let y = 0; y < h; y++) { K.put(s, 9, oy - y, M[4]); if (y % 8 === 4) { K.put(s, 10, oy - y, M[5]); K.put(s, 11, oy - y + 1, M[4]); K.put(s, 7, oy - y - 1, M[3]); } }
      const fy = oy - h, col = kind === 'girasol' ? ['#a86a08', '#e8b020', '#ffe050'] : [['#7a1a4a', '#d0448a', '#f88ac0'], ['#6a3a8a', '#9a6ad0', '#c9a8f0'], ['#a8501a', '#f0902a', '#ffc860']][seed % 3];
      const rr = kind === 'girasol' ? 4 : 2;
      K.ellipseFn(s, 9, fy, rr + 0.5, rr + 0.5, (nx, ny, d) => U(d < 0.3 ? (kind === 'girasol' ? '#4a2a10' : '#ffe14d') : col[ny < -0.2 ? 2 : nx > 0.3 ? 0 : 1]));
    } else if (kind === 'lechuga' || kind === 'col') {
      s = B.sprite(16, 12); ox = 8; oy = 10;
      PFFlora.cluster(s, 8, 6, 6, 4, kind === 'col' ? ['#1a2a3a', '#2a4a4e', '#3e6a62', '#5a8a76', '#80aa8a', '#aacca4'] : ['#1e3a10', '#2e5418', '#467a22', '#64a02e', '#8cc43e', '#c0e070'], seed, { density: 1, leaf: [2, 4] });
    }
    if (!s) { s = B.sprite(4, 4); ox = 2; oy = 3; }
    B.finish(s, { rimK: 0.35, outAmt: -0.55 });
    c = { s, ox, oy }; cache.set(key, c); return c;
  }
  function put(pb, kind, x, y, growth, stress, seed, flip = false) { const P_ = plant(kind, growth, stress, seed); K.blit(pb, P_.s, Math.round(x - P_.ox), Math.round(y - P_.oy), flip); return P_; }
  /** Línea de goteo: manguera negra con emisores y gota húmeda */
  function drip(pb, x0, x1, y, gap = 10) {
    for (let x = x0; x <= x1; x++) { K.put(pb, x, y, U('#141418')); K.put(pb, x, y - 1, U((x % 7) === 0 ? '#4a4a56' : '#26262e')); }
    for (let x = x0 + 4; x < x1; x += gap) { K.put(pb, x, y - 1, U('#3a8ab0')); K.put(pb, x, y + 1, U('#3e2a1a')); K.put(pb, x - 1, y + 1, U('#4c3220')); K.put(pb, x + 1, y + 1, U('#4c3220')); }
  }
  /** Bancal elevado en 3/4: tabla frontal, tierra con hileras, cultivos por fila, goteo y mulch.
      yb = base frontal (suelo). opts: {rows, depth, board, crops:[kind...], growth, stress, mulch, seed, frame} */
  function bed(pb, x0, x1, yb, o = {}) {
    const Wd = K.P32(o.frame || B.R.WOOD), S = K.P32(PFBGround.SOILT);
    const bh = o.board ?? 9, depth = o.depth ?? 16, rows = o.rows ?? 3, sk = 0.35;
    const yt = yb - bh; // borde superior de la tabla frontal
    // tierra superior (se aleja)
    for (let r = 0; r < depth; r++) { const off = Math.round(r * sk), yy = yt - r; for (let x = x0 + off + 1; x < x1 + off - 1; x++) { const rr = r % Math.max(3, Math.round(depth / rows)); let k = 5 - Math.round(r / depth * 2) + (rr === 0 ? -2 : rr === 1 ? 1 : 0) + Math.round((K.cl(x, yy, 2, 4) - 0.5)); if (o.mulch && rr > 1 && hash2(x, yy, 5) < 0.45) { K.put(pb, x, yy, U(hash2(x, yy, 6) < 0.5 ? '#c8a860' : '#a08040')); continue; } K.put(pb, x, yy, S[clamp(k, 1, 8)]); } }
    // marco: tabla trasera y laterales
    for (let x = x0 + Math.round(depth * sk); x < x1 + Math.round(depth * sk); x++) { K.put(pb, x, yt - depth, Wd[6]); K.put(pb, x, yt - depth - 1, Wd[4]); }
    for (let r = 0; r <= depth; r++) { const off = Math.round(r * sk); K.put(pb, x0 + off, yt - r, Wd[6]); K.put(pb, x0 + off + 1, yt - r, Wd[3]); K.put(pb, x1 + off - 1, yt - r, Wd[4]); K.put(pb, x1 + off, yt - r, Wd[2]); }
    // cultivos por hileras (de atrás hacia delante) con goteo al pie
    const crops = o.crops || ['maiz', 'frijol', 'ahuyama'], r = RNG(o.seed || 1), drips = [];
    for (let ri = rows - 1; ri >= 0; ri--) {
      const ry = yt - Math.round((ri + 0.6) * depth / rows), off = Math.round((yt - ry) * sk);
      drip(pb, x0 + off + 3, x1 + off - 4, ry + 1, o.gap || 10); drips.push([x0 + off + 7, x1 + off - 4, ry + 2]);
      const sp = o.spacing || 20;
      for (let x = x0 + off + 8 + (ri % 2) * Math.round(sp / 2); x < x1 + off - 6; x += sp) {
        const kind = crops[(Math.floor((x - x0) / sp) + ri) % crops.length];
        put(pb, kind, x + r.int(-2, 2), ry, (o.growth ?? 1) * (1 - ri * 0.06), o.stress || 0, (o.seed || 1) + x * 3 + ri, r() < 0.5);
      }
    }
    // tabla frontal (delante de los cultivos)
    for (let y = yt; y < yb; y++) for (let x = x0; x < x1; x++) { let k = 5 - Math.round((y - yt) / bh * 2) + ((x - x0) % 31 === 0 ? -2 : 0) + (y === yt ? 2 : 0) + (y === yb - 1 ? -2 : 0); if (((y - yt) === Math.round(bh / 2)) && (x - x0) % 31 > 0) k -= 1; K.put(pb, x, y, Wd[clamp(k, 0, 7)]); }
    for (let x = x0 + 3; x < x1; x += 31) { K.put(pb, x, yt + 2, U('#e8e0d0')); K.put(pb, x, yb - 3, U('#e8e0d0')); }
    B.contact(pb, (x0 + x1) / 2, yb, (x1 - x0) / 2 + 3, 2, -0.28);
    return { yt, depth, drips };
  }
  /** Estaca-sensor de humedad/conductividad con panel solar y LED (el LED vivo lo pinta el nivel) */
  function sensor(pb, x, y, o = {}) {
    const s = B.sprite(16, 34), S = K.P32(B.R.STEEL), b = 32;
    for (let yy = 8; yy < b; yy++) { K.put(s, 7, yy, S[5]); K.put(s, 8, yy, S[2]); }
    PFInfra.box3q(s, 3, 17, 9, 7, 3, { ramp: ['#14202a', '#24384a', '#3a566e', '#567a94', '#7aa0b8', '#a8c4d4'] });
    for (let xx = 5; xx < 10; xx++) K.put(s, xx, 12, U('#0a1a2a'));
    PFInfra.pvPanel(s, 2, 7, 10, 3);
    K.put(s, 11, 12, U(o.led || '#3fe0a0'));
    B.finish(s); K.blit(pb, s, x - 8, y - b);
    B.contact(pb, x, y, 4, 1);
    return { lx: x + 3, ly: y - b + 12 };
  }
  /** Casa-malla: estructura de madera con malla de sombreo negra translúcida y mesas con plantines */
  function shadeHouse(pb, x, yb, w, h, d = 16) {
    const s = B.sprite(w + d + 4, h + d + 6), Wd = K.P32(B.R.WOODG), sk = 0.45, dx = Math.round(d * sk), by = h + d + 2;
    // mesas con bandejas de plantines (al fondo y delante)
    for (const [ty, sc] of [[by - Math.round(d * 0.6), 0.9], [by - 2, 1]]) {
      const ox = Math.round((by - ty) * sk);
      for (let xx = 6 + ox; xx < w - 4 + ox; xx++) { for (let k = 0; k < 3; k++) K.put(s, xx, ty - 16 - k, Wd[k === 2 ? 6 : 4]); }
      for (let xx = 8 + ox; xx < w - 6 + ox; xx += 5) { PFAgro.put(s, xx % 10 < 5 ? 'lechuga' : 'col', xx + 2, ty - 18, 0.6, 0, xx); }
      for (const lx of [8 + ox, w - 8 + ox]) for (let yy = ty - 15; yy < ty; yy++) { K.put(s, lx, yy, Wd[5]); K.put(s, lx + 1, yy, Wd[2]); }
    }
    // malla: velo oscuro con trama fina sobre el volumen (frente + techo + lateral)
    const net = (xx, yy, a) => { const c = K.get(s, xx, yy); const m = ((xx + yy) % 2 === 0) ? 0.62 : 0.5; K.put(s, xx, yy, (c >>> 24) ? K.mixU(c, U('#141c18'), m * a) : (((a * 255) << 24) | 0x18201c) >>> 0); };
    for (let yy = by - h; yy < by; yy++) for (let xx = 0; xx < w; xx++) net(xx, yy, 0.5);
    for (let r = 0; r < d; r++) { const off = Math.round(r * sk); for (let xx = off; xx < w + off; xx++) net(xx, by - h - 1 - r, 0.66); }
    PFK.polyFill(s, [[w, by - h], [w + dx, by - h - d], [w + dx, by - d], [w, by]], (xx, yy) => { const c = K.get(s, xx, yy); return (c >>> 24) ? K.mixU(c, U('#0e1410'), 0.7) : U('#1a221e'); });
    // marcos de madera
    for (const fx of [0, Math.round(w / 3), Math.round(2 * w / 3), w - 2]) for (let yy = by - h; yy < by; yy++) { K.put(s, fx, yy, Wd[6]); K.put(s, fx + 1, yy, Wd[3]); }
    for (let xx = 0; xx < w; xx++) { K.put(s, xx, by - h, Wd[7]); K.put(s, xx, by - h + 1, Wd[4]); K.put(s, xx, by - 1, Wd[2]); }
    for (let r = 0; r < d; r++) { const off = Math.round(r * sk); K.put(s, off, by - h - r, Wd[6]); K.put(s, w - 1 + off, by - h - r, Wd[5]); K.put(s, w + dx - 1, by - r - 1, Wd[3]); }
    for (let xx = dx; xx < w + dx; xx++) K.put(s, xx, by - h - d, Wd[6]);
    // puerta abierta (enmarcada, 84 px) — se ve el interior
    B.finish(s, { rimK: 0.3 }); K.blit(pb, s, x, yb - by);
    B.castR(pb, x + w, x + w + 4, yb - 1, 14, { amt: -0.2, yMin: yb - 16 });
  }
  /** Invernadero de vidrio en 3/4 con bóveda, montantes, plantas dentro y ventana cenital abierta */
  function greenhouse(pb, x, yb, w, h, d = 18, seed = 3) {
    const s = B.sprite(w + d + 4, h + d + 24), G = K.P32(['#0e2a2a', '#164242', '#225c5a', '#3a8078', '#6aaca0', '#a6d8cc', '#e0fff8']), S = K.P32(B.R.STEEL);
    const sk = 0.45, dx = Math.round(d * sk), by = h + d + 20, rv = 12;
    // interior: plantas que se ven por el vidrio
    for (let xx = 8; xx < w - 4; xx += 9) PFAgro.put(s, ['tomate', 'aji', 'frijol', 'tomate'][Math.floor(xx / 9) % 4], xx + 2, by - 4, 0.8, 0, seed + xx);
    // vidrio frontal (tinte verdoso, reflejos diagonales) sobre las plantas
    for (let yy = by - h; yy < by; yy++) for (let xx = 0; xx < w; xx++) {
      const c = K.get(s, xx, yy), diag = ((xx + (by - yy)) % 23) < 2;
      const u = G[clamp(4 - Math.round((yy - by + h) / h * 2) + (diag ? 2 : 0), 0, 6)];
      K.put(s, xx, yy, (c >>> 24) ? K.mixU(c, u, diag ? 0.6 : 0.38) : K.mixU(u, U('#2a4a3e'), 0.4));
    }
    // lateral
    PFK.polyFill(s, [[w, by - h], [w + dx, by - h - d], [w + dx, by - d], [w, by]], (xx, yy) => G[1 + (((xx + yy) % 19) < 2 ? 2 : 0)]);
    // bóveda de vidrio
    for (let r = 0; r <= d + 2; r++) {
      const bump = Math.round(Math.sin(Math.PI * clamp(r / (d + 2), 0, 1)) * rv), off = Math.round(r * sk);
      const yy0 = by - h - 1 - r - bump;
      for (let xx = off; xx < w + off; xx++) { const rib = (xx - off) % 10 === 0; const k = rib ? 6 : r < (d + 2) / 2 ? 4 + (r < 3 ? 1 : 0) : 3; for (let q = 0; q <= 2; q++) K.put(s, xx, yy0 - q, rib ? U('#f4fbff') : G[clamp(k - (q === 2 ? 1 : 0), 0, 6)]); }
    }
    // montantes, zócalo y puerta
    for (let fx = 0; fx < w; fx += 10) for (let yy = by - h; yy < by; yy++) { K.put(s, fx, yy, S[6]); K.put(s, fx + 1, yy, S[3]); }
    for (let xx = 0; xx < w; xx++) { K.put(s, xx, by - h, S[7]); for (let k = 1; k < 6; k++) K.put(s, xx, by - k, S[k === 5 ? 6 : 3]); }
    const dxp = Math.round(w * 0.5) - 6;
    for (let yy = by - Math.min(h, 86); yy < by; yy++) for (let xx = dxp; xx < dxp + 13; xx++) { const c = K.get(s, xx, yy); K.put(s, xx, yy, xx === dxp || xx === dxp + 12 ? S[6] : K.mixU(c >>> 24 ? c : G[2], U('#0a1a14'), 0.4)); }
    B.finish(s, { rimK: 0.5 }); K.blit(pb, s, x, yb - by);
    B.castR(pb, x + w, x + w + 4, yb - 1, 16, { amt: -0.2, yMin: yb - 16 });
  }
  /** Banco de semillas: adobe de dos alturas, puertas de colores (≥ 86 px), soportal, placa y FV en cubierta.
      El balcón de madera del nivel (plataforma) queda delante a la altura que diga o.deckY */
  function seedBank(pb, x, yb, w, h, d = 22, o = {}) {
    const s = B.sprite(w + d + 10, h + d + 30), A = K.P32(B.R.ADOBE), by = h + d + 26, sk = 0.45, dx = Math.round(d * sk);
    const wall = (xx, yy, u, v) => { let k = 6 - Math.round(v * 1.6) + Math.round((K.vn(xx * 0.15, yy * 0.1, 3) - 0.5) * 1.4) + Math.round((K.cl(xx, yy, 2, 4) - 0.5) * 0.8); if (yy % 7 === 0 && K.cl(xx, yy, 3, 5) < 0.3) k -= 1; if (u > 0.95) k -= 2; return A[clamp(k, 1, 9)]; };
    PFInfra.box3q(s, 0, by, w, h, d, { ramp: B.R.ADOBE, front: wall, top: (xx, yy, u, v) => A[clamp(7 - Math.round(v * 2) + ((xx % 6) === 0 ? -1 : 0), 2, 9)], side: (xx, yy) => A[clamp(3 + Math.round((K.cl(xx, yy, 2, 6) - 0.5) * 1.5), 1, 5)] });
    // pretil con canecillos de madera
    for (let xx = -2; xx < w + 2; xx++) { K.put(s, xx, by - h, A[9]); K.put(s, xx, by - h + 1, A[7]); }
    for (let xx = 4; xx < w - 2; xx += 9) for (let k = 0; k < 3; k++) { K.put(s, xx, by - h + 4 + k, U('#4a2a14')); K.put(s, xx + 1, by - h + 4 + k, U('#2e170c')); }
    // FV en la cubierta
    for (let k = 0; k < Math.floor((w - 20) / 26); k++) PFInfra.pvPanel(s, 8 + k * 26 + Math.round(d * 0.2), by - h - Math.round(d * 0.4), 20, 6);
    // ventanas altas con rejas de madera
    for (let k = 0; k < 4; k++) B.win(s, 12 + k * Math.round((w - 24) / 4), by - h + 12, 12, 12, { frame: B.R.WOOD, shutters: B.R.WOOD });
    // puertas de colores (granero de variedades): 4 puertas de 88 px como mínimo cuando hay altura
    const DC = [['#06302e', '#0a4a4a', '#18a294', '#2ac0b0', '#56dcc6', '#a0f0e0'], ['#3a0810', '#6a1424', '#c8384a', '#e0584a', '#ff7a6a', '#ffb0a0'], ['#4a3204', '#7a5a0a', '#d8a428', '#ecc040', '#ffe070', '#fff0b0'], ['#160e3a', '#2a1e6a', '#5a44b8', '#7a64d0', '#a08ef0', '#d0c8ff']];
    const dh = Math.min(o.doorH || 88, h - 34), dw = 18, gap = Math.round((w - 4 * dw) / 5);
    for (let k = 0; k < 4; k++) B.door(s, gap + k * (dw + gap), by, dw, dh, DC[k], { arch: true, frame: B.R.ADOBE, panels: true });
    // placa
    B.plaque(s, Math.round(w / 2), by - h + 30, 'BANCO DE SEMILLAS', { center: true, font: 'tiny', bold: true, bg: '#5a2c1a', border: '#ecbe86', col: '#fdeccc', h: 12 });
    // tinajas y sacos al pie
    for (let k = 0; k < 3; k++) { const jx = 6 + k * 7; K.ellipseFn(s, jx, by - 6, 3.5, 5, (nx, ny) => A[clamp(Math.round(5 - nx * 2 - ny), 1, 9)]); K.put(s, jx, by - 11, A[2]); }
    B.finish(s, { rimK: 0.5 }); K.blit(pb, s, x, yb - by);
    B.castR(pb, x + w, x + w + dx, yb - 1, 22, { amt: -0.24, yMin: yb - 18 });
  }
  /** Compostera de 3 cajones con capas visibles y horca */
  function compost(pb, x, y) {
    const s = B.sprite(62, 30), Wd = K.P32(B.R.WOODG), S = K.P32(PFBGround.SOILT), b = 28;
    for (let k = 0; k < 3; k++) {
      const bx = 2 + k * 19, fill = [0.9, 0.6, 0.3][k];
      for (let yy = b - Math.round(18 * fill); yy < b; yy++) for (let xx = bx + 1; xx < bx + 17; xx++) { const layer = Math.floor((yy - b) / 3); K.put(s, xx, yy, k === 0 && yy < b - 14 ? U(['#3a6a1c', '#5a8a24', '#8a6a2e'][((xx + layer) % 3 + 3) % 3]) : S[clamp(3 + (((layer % 2) + 2) % 2) + (hash2(xx, yy, 3) < 0.1 ? 3 : 0), 0, 9)]); }
      for (let yy = b - 20; yy < b; yy += 5) for (let xx = bx; xx < bx + 18; xx++) { K.put(s, xx, yy, Wd[6]); K.put(s, xx, yy + 1, Wd[4]); K.put(s, xx, yy + 2, Wd[2]); }
      for (const px of [bx, bx + 17]) for (let yy = b - 22; yy < b; yy++) { K.put(s, px, yy, Wd[5]); }
    }
    for (let k = 0; k < 22; k++) K.put(s, 58 - Math.round(k * 0.3), b - 2 - k, U('#8a5a2e'));
    for (let k = 0; k < 4; k++) for (let j = 0; j < 5; j++) K.put(s, 57 + k - 2, b - 1 - j, U('#9aa0a8'));
    B.finish(s); K.blit(pb, s, x, y - b);
    B.contact(pb, x + 30, y, 32, 2);
  }
  /** Colmena de cajones (Langstroth) sobre pata */
  function hive(pb, x, y, seed = 1) {
    const s = B.sprite(22, 34), b = 32, cols = [['#c8a428', '#e8c440', '#f8e070'], ['#d8d0c0', '#f0e8d8', '#fffaf0'], ['#4a8ab0', '#6aaad0', '#a0d0f0']][seed % 3];
    for (const lx of [4, 15]) for (let yy = b - 7; yy < b; yy++) K.put(s, lx, yy, U('#4a2a14'));
    for (let k = 0; k < 3; k++) PFInfra.box3q(s, 2, b - 7 - k * 7, 16, 7, 4, { ramp: ['#3a2a10', '#6a4a1e', cols[0], cols[1], cols[2], '#ffffff'] });
    PFInfra.box3q(s, 1, b - 28, 18, 2, 5, { ramp: B.R.STEEL });
    K.put(s, 9, b - 8, U('#140d06')); K.put(s, 10, b - 8, U('#140d06'));
    B.finish(s); K.blit(pb, s, x - 11, y - b); B.contact(pb, x, y, 10, 2);
  }
  /** Frutal (mango/naranjo/guayabo): tronco con ramas y copa de racimos con frutos */
  function fruitTree(pb, x, y, h, seed, fruit = '#ff9a2a') {
    const r = RNG(seed), T = K.P32(['#1a0e06', '#2e1a0c', '#4a2c16', '#6a4224', '#8a5c34', '#a87a4e']);
    const tw = 4;
    for (let yy = 0; yy < h * 0.42; yy++) for (let k = 0; k < tw; k++) K.put(pb, x - 2 + k + Math.round(Math.sin(yy * 0.08 + seed) * 1.2), y - yy, T[[4, 3, 2, 1][k]]);
    const cy = y - h * 0.62, rx = h * 0.42, ry = h * 0.3;
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.6; K.lineFn(pb, x, y - h * 0.38, x + Math.cos(a) * rx * 0.7, cy + Math.sin(a) * ry * 0.5, () => T[3], 2); }
    for (let i = 0; i < 6; i++) PFFlora.cluster(pb, x + (r() - 0.5) * rx * 1.3, cy + (r() - 0.5) * ry * 0.9, rx * (0.4 + r() * 0.2), ry * (0.45 + r() * 0.2), RAMP.foliageR, seed + i * 9, { density: 0.55, leaf: [3, 6] });
    PFFlora.cluster(pb, x - rx * 0.2, cy - ry * 0.4, rx * 0.5, ry * 0.4, RAMP.foliageR, seed + 99, { density: 0.6, leaf: [3, 6], bias: 0.15 });
    for (let i = 0; i < 12; i++) { const fx = x + (r() - 0.5) * rx * 1.6, fy = cy + (r() - 0.2) * ry; K.ellipseFn(pb, fx, fy, 1.8, 1.8, (nx, ny, d) => U(d < 0.35 && nx < 0 && ny < 0 ? '#fff0c0' : ny > 0.3 ? mixHex(fruit, '#3a1a08', 0.4) : fruit)); }
    B.contact(pb, x + 4, y, rx * 0.9, 2, -0.25);
  }
  /** Cují antiguo: tronco retorcido enorme con raíces, hueco luminoso y ramas horizontales que
      coinciden con las plataformas del nivel (branches:[{x,y,w}]). Copa amplia y aplanada (acacia). */
  function cuji(pb, x, y, h, branches, seed = 9) {
    const r = RNG(seed), T = K.P32(['#120804', '#22120a', '#361e10', '#4e2e18', '#683f22', '#84542e', '#a26e40', '#c08c58', '#dcae7a']);
    const s = B.sprite(260, h + 70), ox = 110, b = h + 64; // sprite local: tronco en (ox, b)
    // tronco retorcido (ensancha en la base) con surcos de corteza en espiral
    for (let yy = 0; yy < h; yy++) {
      const t = yy / h, w = Math.round(lerp(40, 18, Math.pow(t, 0.55))), cx = ox + Math.round(Math.sin(t * 2.6 + seed) * 7);
      for (let k = 0; k < w; k++) {
        const f = k / (w - 1); let ki = f < 0.08 ? 4 : f < 0.22 ? 6 : f < 0.4 ? 5 : f < 0.62 ? 4 : f < 0.85 ? 2 : 1;
        const gro = ((k * 3 + Math.round(yy * 0.6 + Math.sin(yy * 0.05) * 6)) % 9);
        if (gro === 0) ki -= 2; else if (gro === 1) ki += 1;
        if (K.cl(cx + k, yy, 2, seed) < 0.1) ki += 1;
        K.put(s, cx - (w >> 1) + k, b - yy, T[clamp(ki, 0, 8)]);
      }
    }
    // raíces que se abren sobre el suelo
    for (let i = 0; i < 9; i++) { const dir = i < 4 ? -1 : i > 4 ? 1 : 0, L = 16 + r.int(0, 18); for (let k = 0; k < L; k++) { const xx = ox + dir * (10 + k) + (dir === 0 ? r.int(-6, 6) : 0), yy = b - 4 + Math.round(k * 0.2); const th = k < L * 0.5 ? 3 : 2; for (let q = 0; q < th; q++) K.put(s, xx, yy + q, T[q === 0 ? 6 : q === 1 ? 4 : 2]); } }
    // hueco (el brillo violeta de la memoria de KIRU lo pinta el nivel)
    K.ellipseFn(s, ox + 3, b - 44, 6, 9, (nx, ny, d) => U(d > 0.72 ? '#2e1a0c' : d > 0.45 ? '#140a06' : '#0a0408'));
    // ramas hacia las plataformas: gruesas, con lomo iluminado y musgo; nacen bajo la plataforma
    for (const br of branches) {
      const bx0 = br.x - x + ox, bx1 = br.x + br.w - x + ox, by = br.y - y + b;
      const right = bx0 > ox - 4, from = ox + (right ? 6 : -6);
      const xa = right ? from : bx0 - 4, xb = right ? bx1 + 4 : from;
      for (let xx = xa; xx <= xb; xx++) {
        const t = (xx - xa) / Math.max(1, xb - xa), tip = right ? t : 1 - t;
        const th = Math.round(lerp(12, 7, tip));
        const outside = right ? (xx < bx0 ? bx0 - xx : 0) : (xx > bx1 ? xx - bx1 : 0);
        const yy0 = by + Math.round(outside * 0.45) + (Math.abs(xx - (bx0 + bx1) / 2) < (bx1 - bx0) / 2 ? Math.round(Math.sin(t * Math.PI) * 1) : 0);
        for (let k = 0; k < th; k++) { let ki = k === 0 ? 8 : k === 1 ? 6 : k < th * 0.5 ? 4 : k < th - 1 ? 3 : 1; if (((xx + k * 2) % 7) === 0 && k > 1) ki -= 1; K.put(s, xx, yy0 + k, T[clamp(ki, 0, 8)]); }
        if (hash2(xx, 1, seed) < 0.35) K.put(s, xx, yy0, U(hash2(xx, 2, seed) < 0.5 ? '#76921e' : '#94ac2a'));
        if (hash2(xx, 3, seed) < 0.05) for (let q = 0; q < 6 + (xx % 5); q++) K.put(s, xx, yy0 + th + q, U(q % 3 ? '#4a6a16' : '#2e4a14'));
      }
    }
    // copa de acacia amplia y aplanada (masas oscuras detrás, claras delante)
    const top = b - h - 4;
    const DK = ['#081206', '#10200a', '#1a320e', '#284a14', '#38621a', '#4c7a20', '#64922a', '#88ac3a'];
    const LT = ['#0e1a08', '#1a2c0c', '#2c4614', '#42621c', '#5c7e24', '#7c9a30', '#a0b440', '#c8d460'];
    const back_ = [[ox - 70, top + 18, 50, 16], [ox + 80, top + 14, 52, 17], [ox + 10, top + 2, 70, 20]];
    const front_ = [[ox - 44, top + 8, 44, 15], [ox + 30, top - 6, 56, 18], [ox + 104, top + 20, 40, 13], [ox - 6, top + 24, 46, 12], [ox + 66, top + 30, 38, 11], [ox - 84, top + 30, 30, 10]];
    for (const [mx, my, rx, ry] of back_) PFFlora.cluster(s, mx, my, rx, ry, DK, seed + mx, { density: 0.42, leaf: [4, 7], bias: -0.05 });
    for (const [mx, my, rx, ry] of front_) PFFlora.cluster(s, mx, my, rx, ry, LT, seed + mx * 3, { density: 0.48, leaf: [4, 7], bias: 0.06 });
    for (let i = 0; i < 40; i++) { const fx = ox - 100 + r() * 220, fy = top - 10 + r() * 44; if (K.get(s, Math.round(fx), Math.round(fy)) >>> 24) K.put(s, Math.round(fx), Math.round(fy), U(r() < 0.5 ? '#ffe14d' : '#fff6a0')); }
    B.finish(s, { rimK: 0.4, rimCol: '#fff0b0' });
    K.blit(pb, s, x - ox, y - b);
    B.contact(pb, x + 6, y, 52, 3, -0.32);
  }
  /** Pozo con brocal de piedra, bomba solar y salida de tubería ámbar */
  function well(pb, x, y) {
    const s = B.sprite(56, 92), St = K.P32(B.R.STONE), b = 90;
    // brocal cilíndrico de piedra
    for (let yy = b - 20; yy < b; yy++) for (let xx = 4; xx < 32; xx++) { const st = PFBGround.stoneCell(xx, yy - (b - 20), 77, 5, 8); const f = (xx - 4) / 27; let k = st ? 6 - Math.round(f * 3) + (st[2] === 0 ? 1 : 0) + Math.round((hash1(st[0], 3) - 0.5) * 2) : 1; K.put(s, xx, yy, St[clamp(k, 0, 9)]); }
    K.ellipseFn(s, 18, b - 20, 14, 4, (nx, ny, d) => d < 0.55 ? U(d < 0.3 ? '#0a1418' : '#1a2a2e') : St[ny < 0 ? 8 : 5]);
    // pórtico y polea
    const Wd = K.P32(B.R.WOOD);
    for (const px of [6, 29]) for (let yy = b - 56; yy < b - 18; yy++) { K.put(s, px, yy, Wd[6]); K.put(s, px + 1, yy, Wd[3]); }
    for (let xx = 4; xx < 33; xx++) { K.put(s, xx, b - 56, Wd[7]); K.put(s, xx, b - 55, Wd[4]); K.put(s, xx, b - 54, Wd[2]); }
    K.ellipseFn(s, 18, b - 50, 3, 3, (nx, ny, d) => U(d < 0.3 ? '#2a282e' : '#948e91'));
    for (let yy = b - 47; yy < b - 30; yy++) K.put(s, 18, yy, U('#c8a46a'));
    PFInfra.box3q(s, 15, b - 26, 7, 5, 2, { ramp: B.R.WOOD });
    // bomba solar: panel inclinado en mástil + caja de control
    for (let yy = b - 86; yy < b - 4; yy++) { K.put(s, 44, yy, U('#d3ccc5')); K.put(s, 45, yy, U('#716f76')); }
    PFInfra.pvPanel(s, 34, b - 80, 22, 8);
    PFInfra.box3q(s, 38, b - 30, 12, 12, 4, { ramp: ['#14202a', '#24384a', '#3a566e', '#567a94', '#7aa0b8', '#a8c4d4'] });
    K.put(s, 41, b - 38, U('#3fe0a0')); K.put(s, 44, b - 38, U('#ffd84a'));
    B.finish(s, { rimK: 0.45 }); K.blit(pb, s, x - 18, y - b);
    B.contact(pb, x, y, 22, 2);
    return { pipeY: y - 10, panel: [x + 16, y - 80] };
  }
  /** Cisterna de lluvia de ferrocemento con canalón y rebosadero */
  function cistern(pb, x, y, w = 46, h = 30) {
    const s = B.sprite(w + 14, h + 18), C = K.P32(PFTerrain.CONC), b = h + 14;
    const r = Math.round(w / 2), cx = r + 2;
    for (let i = 0; i < w; i++) { const f = i / (w - 1), k = PFInfra.wallFront ? [1, 4, 6, 7, 6, 5, 5, 4, 3, 2, 2, 1][Math.floor(f * 11.99)] : 4; for (let yy = b - h; yy < b; yy++) { let kk = k + ((yy - b) % 8 === 0 ? -1 : 0); if (yy > b - 10 && K.cl(i, yy, 2, 3) < 0.3) kk -= 1; K.put(s, 2 + i, yy, C[clamp(kk, 0, 7)]); } }
    K.ellipseFn(s, cx, b - h, r, 5, (nx, ny, d) => d < 0.7 ? U(d < 0.5 ? '#2a6e5a' : '#3e8a70') : C[ny < 0 ? 7 : 4]);
    for (let xx = cx - 8; xx < cx + 8; xx++) { K.put(s, xx, b - h - 1, U('#5aa08a')); }
    B.plaque(s, cx, b - Math.round(h * 0.6), 'LLUVIA', { center: true, bg: '#0e3a24', border: '#86e36f', col: '#e8ffe0' });
    B.finish(s); K.blit(pb, s, x - cx, y - b); B.contact(pb, x, y, r + 3, 2);
    return { top: y - h - 5 };
  }
  /** Cabra a escala (≈30 px de alto): tira de 4 cuadros (paso ×2, pastando ×2) */
  let GOAT = null;
  function goatStrip() {
    if (GOAT) return GOAT;
    GOAT = PFK.strip(4, 44, 34, (f, i) => {
      const Wh = K.P32(['#3a2a20', '#6a5444', '#a08c78', '#cfc0aa', '#ece2d0', '#fffaf0']), Br = K.P32(['#1a0e08', '#3a2216', '#5e3a24', '#8a5a36', '#b07c4e']);
      const graze = i >= 2, step = i % 2;
      K.ellipseFn(f, 20, 16, 12, 6.5, (nx, ny, d) => Wh[clamp(Math.round(4 - nx * 0.8 - ny * 1.6 - (d > 0.8 ? 1 : 0)), 0, 5)]);
      // manchas pardas
      K.ellipseFn(f, 24, 14, 5, 3.5, (nx, ny) => Br[clamp(Math.round(3 - ny * 1.4), 1, 4)]);
      // patas
      const legs = [[12, step ? 1 : -1], [16, step ? -1 : 1], [25, step ? 1 : -1], [29, step ? -1 : 1]];
      for (const [lx, o] of legs) for (let yy = 21; yy < 32; yy++) { K.put(f, lx + (yy > 27 ? o : 0), yy, Wh[yy > 29 ? 0 : 2]); K.put(f, lx + 1 + (yy > 27 ? o : 0), yy, Wh[1]); }
      // cuello y cabeza
      const hx = graze ? 36 : 35, hy = graze ? 24 : 6;
      K.lineFn(f, 30, 13, hx - 2, hy + 3, () => Wh[3], 3);
      K.ellipseFn(f, hx, hy + 2, 3.8, 3, (nx, ny) => Wh[clamp(Math.round(4 - nx - ny), 1, 5)]);
      K.put(f, hx + 3, hy + 3, Wh[1]); K.put(f, hx + 1, hy + 1, U('#140d06'));
      // cuernos y barba
      for (let k = 0; k < 4; k++) K.put(f, hx - 2 - k, hy - 1 - Math.round(k * 0.6), Br[2]);
      K.put(f, hx + 1, hy + 6, Wh[2]); K.put(f, hx + 1, hy + 7, Wh[1]);
      // oreja y cola
      K.put(f, hx - 3, hy + 1, Br[3]); K.put(f, hx - 4, hy + 2, Br[3]);
      K.put(f, 8, 11, Wh[4]); K.put(f, 7, 10, Wh[3]);
      if (graze && step) { K.put(f, hx + 2, hy + 8, U('#5a8a24')); K.put(f, hx + 3, hy + 7, U('#76a830')); }
      K.selOut(f, -0.6, 'lrbt');
    });
    return GOAT;
  }
  function drawGoat(g, x, y, t, dir, phase = 0) {
    const S = goatStrip(), graze = Math.sin(t * 0.4 + phase) > 0.2;
    const i = graze ? 2 + (Math.floor(t * 2 + phase) % 2) : Math.floor(t * 5 + phase) % 2;
    PFK.drawStrip(g, S, i, Math.round(x - 22), Math.round(y - 33), dir < 0);
  }
  return { plant, put, drip, bed, sensor, shadeHouse, greenhouse, seedBank, compost, hive, fruitTree, cuji, well, cistern, goatStrip, drawGoat, LEAF };
})();
