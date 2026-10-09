/* =====================================================================
   14_portraits.js — Retratos de diálogo del rediseño (STYLE LOCK §10,
   02_personajes §5, 01_referencia §4.3).

   · Arte en un espacio de 96 unidades (S = tamaño/96). Portraits.get →
     lienzo 96×96 transparente y sin marco (3/4 mirando a la derecha,
     luz clave arriba-delante: la cara iluminada, sombra en la nuca).
   · Portraits.bust(id, expr) → lienzo 48×46 del HUD re-rasterizado a
     S = 0,5 con plantillas de ojo/boca propias (no es una reducción).
   · Motor propio PK: partes SDF en coordenadas del mundo 96, sombreado
     por bandas o por función, sombras proyectadas (flequillo → frente,
     mentón → cuello), líneas internas por material, luz de borde,
     contorno por material (V ≤ 0,15) y limpieza. Sin tramado.
   · La base de cada personaje (cuerpo, pelo, ropa) se pinta una vez por
     escala/variante; las expresiones (ojos, cejas, boca, rubor,
     lágrimas) se sellan sobre una copia → ~1 ms por expresión.
   ===================================================================== */

/* ---------- Motor de pintura de retratos ---------- */
const PK = {
  L: (() => { const l = [0.5, -0.8, 0.45]; const n = Math.hypot(...l); return l.map(v => v / n); })(),
  /** Material de retrato: rampa (oscuro → claro), contorno exterior y línea interior */
  mat(ramp, outline, line) {
    const m = { ramp, outline: outline || outlineOf(ramp[0], 0.14), line: line || ramp[1] };
    m.rampU = ramp.map(c => U(c)); m.outlineU = U(m.outline); m.lineU = U(m.line);
    return m;
  },
};
/** Lienzo de retrato: w×h píxeles, escala S, origen del mundo (ox, oy) */
class PPaint {
  constructor(w, h, S = 1, ox = 0, oy = 0) { this.w = w; this.h = h; this.S = S; this.ox = ox; this.oy = oy; this.parts = []; this.stamps = []; this.posts = []; this.zc = 0; }
  /** px → mundo y mundo → px */
  wx(px) { return (px + 0.5) / this.S + this.ox; }
  wy(py) { return (py + 0.5) / this.S + this.oy; }
  X(x) { return Math.floor((x - this.ox) * this.S); }
  Y(y) { return Math.floor((y - this.oy) * this.S); }
  /**
   * o: mat, z, group, base, bevel, shiny, hiT, dark, flat, shade(x,y,d,P)→idx, tex(x,y,idx,P)→idx|hex,
   * cast {on:[grupos], dx, dy, k}, line (false = sin línea interior), lineU, rim (bool), out (false = sin contorno)
   */
  add(sdf, bbox, o) {
    const p = Object.assign({ sdf, bbox, z: this.zc++, base: 3, bevel: 3, group: 'g' + this.parts.length, dark: 0, hiT: 0.7, rim: true }, o);
    if (Array.isArray(p.mat)) p.mat = PK.mat(p.mat);
    this.parts.push(p); return p;
  }
  ellipse(cx, cy, rx, ry, o, rot = 0) { const m = Math.max(rx, ry) + 1; return this.add(SDF.ellipse(cx, cy, rx, ry, rot), [cx - m, cy - m, cx + m, cy + m], Object.assign({ bevel: Math.min(rx, ry) * 0.55 }, o)); }
  circle(cx, cy, r, o) { return this.add(SDF.circle(cx, cy, r), [cx - r - 1, cy - r - 1, cx + r + 1, cy + r + 1], Object.assign({ bevel: r * 0.55 }, o)); }
  poly(pts, o) { return this.add(SDF.poly(pts), polyBBox(pts), o); }
  capsule(ax, ay, bx, by, ra, rb, o) { const m = Math.max(ra, rb) + 1; return this.add(SDF.capsule(ax, ay, bx, by, ra, rb), [Math.min(ax, bx) - m, Math.min(ay, by) - m, Math.max(ax, bx) + m, Math.max(ay, by) + m], Object.assign({ bevel: Math.max(ra, rb) * 0.55 }, o)); }
  box(cx, cy, hw, hh, r, o, rot = 0) { const m = Math.hypot(hw, hh) + 1; return this.add(SDF.box(cx, cy, hw, hh, r, rot), [cx - m, cy - m, cx + m, cy + m], o); }
  /** Mechón afilado: pts [[x,y]…], radio r0 → r1 (taper = exponente) */
  strand(pts, r0, r1, o = {}) {
    let tot = 0; const acc = [0];
    for (let i = 1; i < pts.length; i++) { tot += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); acc.push(tot); }
    const radii = acc.map(a => lerp(r0, r1, tot ? Math.pow(a / tot, o.taper || 1) : 0));
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    pts.forEach(([x, y], i) => { const r = radii[i] + 1; x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - r); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + r); });
    return this.add(SDF.strand(pts, radii), [x0, y0, x1, y1], Object.assign({ bevel: Math.max(0.9, r0 * 0.6), shiny: true }, o));
  }
  custom(sdf, bbox, o) { return this.add(sdf, bbox, o); }
  /** Sello antes del contorno: fn(pb, ctx) */
  stamp(fn, z = 0) { this.stamps.push({ fn, z }); }
  /** Sello después del contorno (brillos emisivos) */
  post(fn, z = 0) { this.posts.push({ fn, z }); }

  render(opt = {}) {
    const W2 = this.w, H2 = this.h, N = W2 * H2, S = this.S, L = opt.light || PK.L;
    const pb = new PixelBuffer(W2, H2), D = pb.data;
    const zb = new Int16Array(N).fill(-1), ib = new Int8Array(N), cu = new Uint32Array(N);
    const parts = this.parts.slice().sort((a, b) => a.z - b.z);
    parts.forEach((p, pi) => {
      const ramp = p.mat.ramp, n = ramp.length;
      const x0 = Math.max(0, this.X(p.bbox[0]) - 1), y0 = Math.max(0, this.Y(p.bbox[1]) - 1);
      const x1 = Math.min(W2 - 1, this.X(p.bbox[2]) + 1), y1 = Math.min(H2 - 1, this.Y(p.bbox[3]) + 1);
      const f = p.sdf, bev = Math.max(0.6, p.bevel), hiT = p.hiT;
      for (let y = y0; y <= y1; y++) {
        const wy = this.wy(y);
        for (let x = x0; x <= x1; x++) {
          const wx = this.wx(x);
          const d = f(wx, wy);
          if (d > 0) continue;
          let idx = p.base, col = 0;
          if (p.shade) {
            const r = p.shade(wx, wy, d, p);
            if (typeof r === 'string') { col = U(r); } else idx = r;
          } else if (!p.flat) {
            const k = clamp(-d / bev, 0, 1);
            let gx = 0, gy = 0, gl = 1;
            if (k < 1) { gx = f(wx + 0.5, wy) - f(wx - 0.5, wy); gy = f(wx, wy + 0.5) - f(wx, wy - 0.5); gl = Math.sqrt(gx * gx + gy * gy) || 1; }
            const nx = gx / gl * (1 - k), ny = gy / gl * (1 - k), nz = k;
            const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
            let dd = (nx * L[0] + ny * L[1] + nz * L[2]) / nl;
            if (p.tilt) dd += p.tilt;
            if (dd < -0.15) idx -= 2; else if (dd < 0.25) idx -= 1; else if (dd > 0.9 && p.shiny) idx += 2; else if (dd > hiT) idx += 1;
            idx -= p.dark;
          }
          idx = clamp(Math.round(idx), 0, n - 1);
          if (p.tex) { const t = p.tex(wx, wy, idx, p, d); if (typeof t === 'string') col = U(t); else if (t != null) idx = clamp(t, 0, n - 1); }
          const i = y * W2 + x;
          zb[i] = pi; ib[i] = idx; cu[i] = col;
        }
      }
    });
    // sombras proyectadas: el emisor desplazado (dx, dy) oscurece k bandas de los grupos destino que tiene detrás
    parts.forEach((C, ci) => {
      if (!C.cast) return;
      const { on, k = 1 } = C.cast;
      const dx = Math.round((C.cast.dx ?? -1) * S) || Math.sign(C.cast.dx ?? -1), dy = Math.round((C.cast.dy ?? 2) * S) || Math.sign(C.cast.dy ?? 2);
      const x0 = Math.max(0, this.X(C.bbox[0]) + dx - 1), y0 = Math.max(0, this.Y(C.bbox[1]) + dy - 1);
      const x1 = Math.min(W2 - 1, this.X(C.bbox[2]) + dx + 1), y1 = Math.min(H2 - 1, this.Y(C.bbox[3]) + dy + 1);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const i = y * W2 + x, ti = zb[i];
        if (ti < 0 || ti >= ci) continue;
        const T = parts[ti];
        if (!on.includes(T.group)) continue;
        const sx = x - dx, sy = y - dy;
        if (sx < 0 || sy < 0 || sx >= W2 || sy >= H2 || zb[sy * W2 + sx] !== ci) continue;
        ib[i] = Math.max(T.minCast ?? 1, ib[i] - k); cu[i] = 0;
      }
    });
    // color + líneas internas (parte trasera junto a una delantera de otro grupo)
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
      const i = y * W2 + x, pi = zb[i];
      if (pi < 0) continue;
      const P = parts[pi];
      let c = cu[i] || P.mat.rampU[ib[i]];
      if (P.line !== false) {
        for (let k = 0; k < 4; k++) {
          const q = k === 0 ? (x > 0 ? zb[i - 1] : -1) : k === 1 ? (x < W2 - 1 ? zb[i + 1] : -1) : k === 2 ? (y > 0 ? zb[i - W2] : -1) : (y < H2 - 1 ? zb[i + W2] : -1);
          if (q > pi && parts[q].group !== P.group && parts[q].lineOver !== false) { c = P.lineU || P.mat.lineU; break; }
        }
      }
      D[i] = c;
    }
    const ctx = { pt: this, pb, zb, ib, parts, S, X: (x) => this.X(x), Y: (y) => this.Y(y), group: (x, y) => { if (x < 0 || y < 0 || x >= W2 || y >= H2) return null; const p = zb[y * W2 + x]; return p >= 0 ? parts[p].group : null; } };
    this.stamps.sort((a, b) => a.z - b.z).forEach(s => s.fn(pb, ctx));
    pb.cleanup();
    // luz de borde 1 px en la espalda y la coronilla (izquierda / arriba)
    if (opt.rim !== false) {
      const rr = hexToRgb(opt.rimColor || '#9fe8ff'), kk = opt.rimK ?? 0.3, out = new Uint32Array(D);
      for (let y = 1; y < H2; y++) for (let x = 1; x < W2 - 1; x++) {
        const i = y * W2 + x;
        if (!(D[i] >>> 24) || zb[i] < 0) continue;
        const P = parts[zb[i]];
        if (!P.rim) continue;
        const side = !(D[i - 1] >>> 24), top = !(D[i - W2] >>> 24);
        if (!side && !top) continue;
        const c = D[i], r = c & 255, g = (c >>> 8) & 255, b = (c >>> 16) & 255, kq = side && top ? kk * 1.3 : kk;
        out[i] = ((255 << 24) | (Math.round(b + (rr[2] - b) * kq) << 16) | (Math.round(g + (rr[1] - g) * kq) << 8) | Math.round(r + (rr[0] - r) * kq)) >>> 0;
      }
      D.set(out);
    }
    if (opt.outline !== false) {
      const zbo = new Int32Array(N); for (let i = 0; i < N; i++) zbo[i] = zb[i];
      const outParts = parts.map(p => (p.out === false ? { mat: null } : { mat: { outlineU: p.mat.outlineU } }));
      // las partes sin contorno no lo emiten: se marcan como «sello» y usan el contorno del vecino
      const mask = pb.outlineByPart(zbo, outParts, opt.outlineColor || '#14060a');
      if (parts.some(p => p.out === false)) for (let i = 0; i < N; i++) if (mask[i]) { /* nada: conservado */ }
      pb.cleanup(mask);
    }
    this.posts.sort((a, b) => a.z - b.z).forEach(s => s.fn(pb, ctx));
    return { pb, zb, ib, parts, ctx, S, ox: this.ox, oy: this.oy };
  }
}
/** Copia de un PixelBuffer */
function pbClone(src) { const pb = new PixelBuffer(src.w, src.h); pb.data.set(src.data); return pb; }

/* =====================================================================
   Expresiones de retrato (02_personajes §5.3). Cada nombre usado en el
   guion (y los alias de KIRU en español) resuelve a una cara distinta:
   eye: forma del párpado · look: [dx,dy] del iris · brow · mouth · talk:
   boca al hablar · blush (0–2) · tear · sweat · pupil ('small').
   ===================================================================== */
const PEXPR = {
  neutral: { eye: 'open', brow: 'neutral', mouth: 'line', talk: 'talkS' },
  smile: { eye: 'open', brow: 'neutral', mouth: 'smile', talk: 'open', blush: 1 },
  happy: { eye: 'happy', brow: 'up', mouth: 'grinS', talk: 'open', blush: 1 },
  joy: { eye: 'happy', brow: 'raised', mouth: 'grin', talk: 'grinT', blush: 2 },
  surprised: { eye: 'wide', brow: 'raised', mouth: 'o', talk: 'oT', pupil: 'small' },
  worried: { eye: 'worried', brow: 'worried', mouth: 'wavy', talk: 'talkW', sweat: 1 },
  sad: { eye: 'sad', brow: 'sad', mouth: 'frown', talk: 'talkW', look: [-1, 1] },
  crying: { eye: 'sad', brow: 'sad', mouth: 'frownO', talk: 'talkW', tear: 1, look: [-1, 1] },
  angry: { eye: 'angry', brow: 'angry', mouth: 'clench', talk: 'shout' },
  frustrated: { eye: 'angry', brow: 'angry', mouth: 'clench', talk: 'shout', sweat: 1 },
  determined: { eye: 'determined', brow: 'determined', mouth: 'firm', talk: 'talkS' },
  thinking: { eye: 'look', brow: 'skeptical', mouth: 'side', talk: 'talkS', look: [2, -1] },
  focused: { eye: 'look', brow: 'determined', mouth: 'side', talk: 'talkS', look: [2, 0] },
  curious: { eye: 'open', brow: 'raised1', mouth: 'oSmall', talk: 'talkS', look: [1, -1] },
  skeptical: { eye: 'half', brow: 'skeptical', mouth: 'smirk', talk: 'talkS', look: [1, 0] },
  guilty: { eye: 'down', brow: 'sad', mouth: 'flat', talk: 'talkW', look: [-1, 2] },
  calm: { eye: 'soft', brow: 'neutral', mouth: 'smile', talk: 'talkS' },
  relieved: { eye: 'closed', brow: 'up', mouth: 'smile', talk: 'talkS', blush: 1 },
  scared: { eye: 'wide', brow: 'worried', mouth: 'wavyO', talk: 'oT', pupil: 'small', sweat: 1 },
  tired: { eye: 'tired', brow: 'sad', mouth: 'flat', talk: 'talkS', look: [0, 1] },
  proud: { eye: 'soft', brow: 'up', mouth: 'smirk', talk: 'open', blush: 1 },
  embarrassed: { eye: 'down', brow: 'worried', mouth: 'wavy', talk: 'talkW', blush: 2, sweat: 1, look: [-2, 1] },
  alert: { eye: 'wide', brow: 'raised', mouth: 'flat', talk: 'talkS' },
  speak: { eye: 'open', brow: 'neutral', mouth: 'talkS', talk: 'open' },
  warn: { eye: 'determined', brow: 'worried', mouth: 'flat', talk: 'talkS' },
};
/** Alias (KIRU y nombres sueltos del guion) → expresión base */
const PEXPR_ALIAS = {
  curioso: 'curious', alegre: 'happy', alarmado: 'scared', confundido: 'skeptical', culpable: 'guilty', valiente: 'determined',
  agotado: 'tired', esperanzado: 'relieved', frustrate: 'frustrated', anger: 'angry', sadness: 'sad', fear: 'scared', worry: 'worried',
};
function pexpr(name) { return PEXPR[name] || PEXPR[PEXPR_ALIAS[name]] || PEXPR.neutral; }
/** Nombre canónico (para claves de caché) */
function pexprName(name) { return PEXPR[name] ? name : PEXPR_ALIAS[name] && PEXPR[PEXPR_ALIAS[name]] ? PEXPR_ALIAS[name] : 'neutral'; }

/* =====================================================================
   Ojos de retrato (96): abertura procedimental (curvas de párpado por
   columna u, u = 0 en el rabillo exterior) + iris de plantilla colocado
   en pantalla (la mirada base va a la derecha, hacia donde mira el
   personaje). Tokens: K pestaña · k pestaña suave · W blanco en sombra
   · w blanco · R aro del iris · D iris oscuro · P pupila · M iris medio
   · L iris claro · l iris muy claro · h brillo · s piel en sombra.
   ===================================================================== */
const PEYE = {
  near: { W: 10, T: [-4, -5, -6, -6, -6, -6, -6, -6, -5, -4], B: [3, 4, 4, 5, 5, 5, 5, 4, 4, 3], ix: 0.5, iy: -5,
    iris: ['.RRRRR.', 'RDDDDDR', 'RDPPPDR', 'RDPPPDR', 'RDPPPDR', 'RMPPPMR', 'RMMMMMR', 'RLMMMLR', 'RLLLLLR', '.RlllR.'],
    irisS: ['.RRR.', 'RDDDR', 'RDPDR', 'RMPMR', 'RMMMR', 'RLLLR', '.RlR.'] },
  far: { W: 7, T: [-4, -5, -6, -6, -6, -5, -4], B: [3, 4, 5, 5, 5, 4, 3], ix: 0.5, iy: -5,
    iris: ['.RRR.', 'RDDDR', 'RDPPR', 'RDPPR', 'RDPPR', 'RMPMR', 'RMMMR', 'RLMLR', 'RLLLR', '.RlR.'],
    irisS: ['.RR.', 'RDDR', 'RDPR', 'RMMR', 'RLLR', '.Rl.'] },
};
/**
 * Ojo 96. side 'near' (rabillo exterior a la izquierda) | 'far' (exterior a la derecha);
 * kind = forma del párpado; look = [dx, dy] en pantalla; pal = tokens → color.
 */
function drawPEye(pb, cx, cy, side, kind, look, pal, opt = {}) {
  const G = PEYE[side], Wd = G.W;
  const flip = side === 'far';
  const half = Wd >> 1;
  const SX = (u) => flip ? cx + (Wd - 1 - half) - u : cx - half + u;
  const put = (u, r, t) => { const c = pal[t]; if (c != null) pb.set(SX(u), cy + r, c); };
  // formas cerradas: ^ (feliz), ‿ (cerrado / alivio), parpadeo
  if (kind === 'happy' || kind === 'closed' || kind === 'blink') {
    for (let u = 0; u < Wd; u++) {
      const s = Math.sin(Math.PI * (u + 0.5) / Wd);
      if (kind === 'happy') { const r = Math.round(0.6 - s * 3.2); put(u, r, 'K'); if (u > 0 && u < Wd - 1) put(u, r + 1, 'K'); }
      else { const r = Math.round(0.8 + s * (kind === 'blink' ? 1.1 : 2.2)); put(u, r, 'K'); if (u > 0 && u < Wd - 1) put(u, r - 1, u < Wd - 2 ? 'K' : 'k'); }
    }
    if (kind === 'happy') { put(-1, 1, 'K'); put(-2, 2, 'k'); for (let u = 2; u < Wd - 2; u++) put(u, 3, 's'); }
    else { put(-1, 0, 'K'); put(-2, -1, 'K'); put(-1, 1, 'k'); for (let u = 2; u < Wd - 2; u++) put(u, Math.round(2.4 + Math.sin(Math.PI * (u + 0.5) / Wd) * 2.2), 's'); }
    return;
  }
  // abertura: T[u] = fila de la pestaña (abre en T+1), B[u] = última fila abierta
  const T = G.T.slice(), Bt = G.B.slice(), top = Math.min(...G.T);
  const lid = (fn) => { for (let u = 0; u < Wd; u++) T[u] = Math.max(T[u], Math.round(fn(u / (Wd - 1)))); };
  switch (kind) {
    case 'half': lid(() => top + 3.6); break;
    case 'look': lid((t) => top + 1.5 + t * 0.8); break;
    case 'soft': lid((t) => top + 4.2 + Math.sin(Math.PI * t) * 0.6); for (let u = 1; u < Wd - 1; u++) Bt[u] -= 1; break;
    case 'tired': lid(() => top + 5.4); break;
    case 'down': lid((t) => top + 4.4 + t * 0.6); break;
    case 'angry': lid((t) => top + 1 + t * 5); break;
    case 'determined': lid((t) => top + 1.8 + t * 2.6); break;
    case 'sad': lid((t) => top + 4.8 - t * 4); break;
    case 'worried': lid((t) => top + 3 - t * 2.6); break;
    case 'wide': for (let u = 0; u < Wd; u++) T[u] -= 1; for (let u = 1; u < Wd - 1; u++) Bt[u] += 1; break;
    default: break;
  }
  const open = new Set(), shaded = new Set();
  const key = (x, y) => y * 4096 + x;
  for (let u = 0; u < Wd; u++) for (let r = T[u] + 1; r <= Bt[u]; r++) {
    put(u, r, r === T[u] + 1 ? 'W' : 'w'); open.add(key(SX(u), cy + r)); if (r === T[u] + 1) shaded.add(key(SX(u), cy + r));
  }
  // iris (mirada base a la derecha; pupila pequeña en sorpresa/miedo)
  const IT = opt.pupil === 'small' ? G.irisS : G.iris;
  const iw = IT[0].length, ih = IT.length;
  const lx = look ? look[0] : 0, ly = look ? look[1] : 0;
  const ix0 = Math.round(cx + G.ix - iw / 2 + lx), iy0 = cy + G.iy + Math.round(ly) + (opt.pupil === 'small' ? 2 : 0);
  for (let j = 0; j < ih; j++) for (let i = 0; i < iw; i++) {
    const ch = IT[j][i]; if (ch === '.') continue;
    const x = ix0 + i, y = iy0 + j, k = key(x, y);
    if (!open.has(k)) continue;
    pb.set(x, y, pal[shaded.has(k) ? (ch === 'L' || ch === 'l' ? 'M' : 'R') : ch]);
  }
  // brillos: 2×2 arriba-izquierda + 1 px abajo-derecha (solo dentro de la abertura)
  const hi = (x, y) => { if (open.has(key(x, y))) pb.set(x, y, pal.h); };
  let firstOpen = Infinity; for (let u = 0; u < Wd; u++) firstOpen = Math.min(firstOpen, T[u] + 1);
  const hx = ix0 + 1, hy = Math.max(iy0 + 2, cy + firstOpen + 1);
  hi(hx, hy); hi(hx + 1, hy); hi(hx, hy + 1); hi(hx + 1, hy + 1);
  hi(ix0 + iw - 2, iy0 + ih - 3);
  // pestaña superior 2 px (1 px en el lagrimal) con remate hacia arriba en el rabillo
  for (let u = 0; u < Wd; u++) { put(u, T[u], 'K'); if (u < Wd - 1) put(u, T[u] - 1, u >= Wd - 3 ? 'k' : 'K'); }
  put(-1, T[0] - 1, 'K'); put(-1, T[0], 'K'); put(-2, T[0] - 2, 'K'); put(-2, T[0] - 1, 'k'); put(-1, T[0] + 1, 'k');
  // párpado inferior suave (pestaña corta en el rabillo + línea de piel)
  for (let u = 1; u < Wd - 2; u++) put(u, Bt[u] + 1, u < 3 ? 'k' : 's');
  if (kind === 'tired') for (let u = 1; u < Wd - 2; u++) put(u, Bt[u] + 3, 's');
}
/* ---------- Ojos del busto (48): plantillas a mano por forma; fila 0 = cy − 2 ---------- */
const PEYE_MINI = {
  near: {
    open: ['KKKKKK', '.whDDK', '.wDPD.', '.wMMD.', '..ML..'],
    look: ['KKKKKK', '.wwhDK', '.wwDD.', '.wwML.', '......'],
    half: ['......', 'KKKKKK', '.wDPD.', '.wMMD.', '..ML..'],
    soft: ['......', '......', 'KKKKK.', '.sMMs.', '......'],
    tired: ['......', '......', 'KKKKKK', '.wMMD.', '.ssss.'],
    down: ['......', 'KKKKKK', '.wDDD.', '.wMLM.', '..ss..'],
    angry: ['KK....', '.KKK..', '.whKKK', '.wDPD.', '..ML..'],
    determined: ['......', 'KKKK..', '.whKKK', '.wDPD.', '..ML..'],
    sad: ['....KK', '..KK..', 'KKhDD.', '.wDPD.', '..ML..'],
    worried: ['....KK', '.KKKK.', 'KwhDD.', '.wDPD.', '..ML..'],
    wide: ['.KKKK.', 'Kwwhw.', '.wDDw.', '.wDDw.', '..ww..'],
    happy: ['......', '..KK..', '.K..K.', 'K....K', '......'],
    closed: ['......', '......', 'K....K', '.KKKK.', '......'],
    blink: ['......', '......', '......', 'KKKKKK', '..ss..'],
  },
  far: {
    open: ['KKKKK', 'whDD.', 'wDPD.', '.MMD.', '.ML..'],
    look: ['KKKKK', 'wwhD.', 'wwDD.', 'wwML.', '.....'],
    half: ['.....', 'KKKKK', 'wDPD.', '.MMD.', '.ML..'],
    soft: ['.....', '.....', 'KKKK.', 'sMMs.', '.....'],
    tired: ['.....', '.....', 'KKKKK', 'wMMD.', 'ssss.'],
    down: ['.....', 'KKKKK', 'wDDD.', 'wMLM.', '.ss..'],
    angry: ['...KK', '.KKK.', 'KKhD.', 'wDPD.', '.ML..'],
    determined: ['.....', '.KKKK', 'KKhD.', 'wDPD.', '.ML..'],
    sad: ['KK...', '..KK.', '.hDKK', 'wDPD.', '.ML..'],
    worried: ['KK...', '.KKKK', 'whDDK', 'wDPD.', '.ML..'],
    wide: ['.KKK.', 'wwhwK', 'wDDw.', 'wDDw.', '.ww..'],
    happy: ['.....', '.KK..', 'K..K.', '.....', '.....'],
    closed: ['.....', '.....', 'K..K.', '.KK..', '.....'],
    blink: ['.....', '.....', '.....', 'KKKK.', '.ss..'],
  },
};
function drawPEyeMini(pb, cx, cy, side, kind, look, pal) {
  const set = PEYE_MINI[side];
  let T = set[kind] || set.open;
  // mirada lateral en el busto: plantilla 'look' si mira a un lado con el ojo abierto
  if (kind === 'open' && look && Math.abs(look[0]) >= 2) T = set.look;
  const w = T[0].length;
  const x0 = side === 'near' ? cx - 3 : cx - 2;
  pb.stampMap(x0, cy - 2, T, pal);
}

/* ---------- Bocas (plantillas por escala; x = columna central) ---------- */
const PMOUTH = {
  P: {
    line: ['.KKKK', 'K....'], smile: ['K....K', '.KKKK.', '..ll..'], grinS: ['KKKKKK', 'KmttmK', '.KKKK.'], grin: ['KKKKKKK', 'KwwwwwK', 'KmmttmK', '.KKKKK.'],
    o: ['.KKK.', 'KmmmK', 'KmttK', '.KKK.'], oSmall: ['.KK.', 'KmmK', '.KK.'], frown: ['.KKKK.', 'K....K'], frownO: ['.KKKK.', 'KmmmmK', 'K....K'],
    wavy: ['.K..K.', 'K.KK.K'], wavyO: ['.KKKK.', 'KmKKmK', '.K..K.'], smirk: ['.....K', '.KKKK.', 'K.....'], flat: ['KKKKK'], firm: ['KKKKK', '.lll.'],
    clench: ['KKKKKK', 'KwwwwK', 'KKKKKK'], side: ['...KK', '.KK..'], talkS: ['.KKK.', 'KmtmK', '.KKK.'], talkW: ['.KKKK.', 'KmmttK', 'K.KK.K'],
    open: ['KKKKKK', 'KmmmmK', 'KmttmK', '.KKKK.'], grinT: ['KKKKKKK', 'KwwwwwK', 'KmmtttK', 'KmttttK', '.KKKKK.'], oT: ['.KKK.', 'KmmmK', 'KmmmK', 'KmttK', '.KKK.'],
    shout: ['KKKKKK', 'KwwwwK', 'KmttmK', 'KwwwwK', '.KKKK.'],
  },
  B: {
    line: ['KK'], smile: ['K..K', '.KK.'], grinS: ['KKK', '.t.'], grin: ['KKKK', 'wtt.'], o: ['.K.', 'KmK', '.K.'], oSmall: ['KK'], frown: ['.KK.', 'K..K'],
    frownO: ['.KK.', 'KmmK'], wavy: ['K.K', '.K.'], wavyO: ['KmK', '.K.'], smirk: ['..K', 'KK.'], flat: ['KKK'], firm: ['KKK'], clench: ['KKK', 'www'], side: ['.KK'],
    talkS: ['KK', 'mt'], talkW: ['KKK', 'mtm'], open: ['KKK', 'mtm', '.K.'], grinT: ['KKKK', 'wttm', '.KK.'], oT: ['KK', 'mt', 'KK'], shout: ['KKK', 'mtm', 'www'],
  },
};
function drawPMouth(pb, cx, cy, scale, kind, pal) {
  const T = PMOUTH[scale][kind] || PMOUTH[scale].line;
  const w = T[0].length;
  pb.stampMap(cx - Math.floor(w / 2), cy, T, pal);
}
/* ---------- Cejas: puntos [u (0 = exterior → 1 = interior), dy] por forma ---------- */
const PBROW = {
  neutral: [[0, 1], [0.3, 0], [0.65, 0], [1, 0.6]], up: [[0, 0], [0.3, -1], [0.65, -1], [1, -0.5]], raised: [[0, -1], [0.3, -2.6], [0.7, -2.6], [1, -1.6]],
  raised1: [[0, 0], [0.3, -1.6], [0.7, -1.6], [1, -0.6]], angry: [[0, -1.6], [0.35, -0.6], [0.7, 1], [1, 2.4]], determined: [[0, -0.6], [0.4, 0], [0.75, 0.8], [1, 1.6]],
  worried: [[0, 1.4], [0.35, 0.6], [0.7, -0.8], [1, -2.2]], sad: [[0, 1.8], [0.35, 1.2], [0.7, -0.2], [1, -1.4]],
  skeptical: [[0, 0.4], [0.3, 0], [0.7, 0], [1, 0.4]], skepticalHi: [[0, -0.6], [0.3, -2.4], [0.7, -2.4], [1, -1.2]],
};
/** Ceja: x0 = extremo exterior, x1 = interior; grosor 2 px hacia el interior (1 px en la cola) */
function drawPBrow(pb, x0, x1, y, kind, col, thick, canPaint) {
  const pts = PBROW[kind] || PBROW.neutral;
  const n = Math.abs(x1 - x0), dir = Math.sign(x1 - x0) || 1;
  for (let s = 0; s <= n; s++) {
    const t = s / Math.max(1, n);
    let k = 0; while (k < pts.length - 2 && t > pts[k + 1][0]) k++;
    const a = pts[k], b = pts[k + 1], tt = clamp((t - a[0]) / ((b[0] - a[0]) || 1), 0, 1);
    const yy = Math.round(y + lerp(a[1], b[1], tt)), xx = x0 + s * dir;
    if (canPaint(xx, yy)) pb.set(xx, yy, col);
    if (thick > 1 && t > 0.25 && canPaint(xx, yy + 1)) pb.set(xx, yy + 1, col);
  }
}

/* =====================================================================
   Utilidades de color u32 para sellos de expresión
   ===================================================================== */
function pkMixU(a, b, t) {
  const ar = a & 255, ag = (a >>> 8) & 255, ab = (a >>> 16) & 255, br = b & 255, bg = (b >>> 8) & 255, bb = (b >>> 16) & 255;
  return ((255 << 24) | (Math.round(ab + (bb - ab) * t) << 16) | (Math.round(ag + (bg - ag) * t) << 8) | Math.round(ar + (br - ar) * t)) >>> 0;
}

/* =====================================================================
   Humanos. Encuadre medido sobre el retrato del HUD de la referencia
   (ventana 48×46 ×2): cabeza a la derecha del centro (HX, HY) = (60, 42),
   cara redonda de ~46 de ancho, mentón suave en (64, 75), ojo cercano
   (53, 50), lejano (76, 49,5), boca (64, 64), oreja (36, 53).
   Sombreado de cara por medialunas (luz arriba-derecha): base piel[4],
   sombra piel[3] a la izquierda/abajo, borde piel[2], brillos piel[5].
   ===================================================================== */
function phHead(def) {
  const HX = 60 + (def.dx || 0), HY = 42 + (def.dy || 0);
  const g = def.head || {};
  const rx = g.rx ?? 26.5, ry = g.ry ?? 28.5, cy = g.cy ?? 0, chinY = g.chinY ?? 33, chinX = g.chinX ?? 4, jw = g.jawW ?? 0, jd = g.jawDrop ?? 0, ch = g.cheek ?? 0;
  const jaw = [[-22 - jw, 8], [-16.5 - jw, 20 + jd * 0.6], [-8.5 - jw * 0.6, chinY - 5 + jd * 0.8], [-1 - jw * 0.3, chinY - 1.2 + jd], [chinX, chinY + jd], [chinX + 5.5, chinY - 2.2 + jd], [18.5 + ch * 0.5, 24 + jd * 0.6], [25.5 + ch, 13], [27.5 + ch * 0.6, 2], [26, -6], [-22, -6]].map(([x, y]) => [HX + x, HY + y]);
  const cran = SDF.ellipse(HX, HY + cy, rx, ry);
  const face = SDF.smoothUnion(g.soft ?? 4, cran, SDF.poly(jaw));
  const F = def.face || {};
  const ey = F.eyeY ?? 8;
  return {
    HX, HY, face, cran, rx, ry,
    eyeN: [HX + (F.eyeNX ?? -7), HY + ey], eyeF: [HX + (F.eyeFX ?? 16), HY + ey - 0.5],
    nose: [HX + (F.noseX ?? 7), HY + (F.noseY ?? 15)], mouth: [HX + (F.mouthX ?? 4), HY + (F.mouthY ?? 22)],
    ear: [HX + (F.earX ?? -24), HY + (F.earY ?? 11)],
  };
}
/** Sombreado de cara por medialunas + brillos */
function phFaceShade(A, def) {
  const F = A.face, sh = def.shadeK ?? 1;
  return (x, y) => {
    let i = 4;
    if (F(x - 5.5 * sh, y + 2.2 * sh) > -0.3) i = 3;
    if (F(x - 2, y + 0.8) > 0) i = 2;
    if (i === 4) {
      const fx = (x - (A.HX + 7)) / 11, fy = (y - (A.HY - 4)) / 6;
      const cx = (x - (A.HX + 21)) / 3.4, cy = (y - (A.HY + 15)) / 5;
      const nx = (x - (A.nose[0] - 1)) / 1.5, ny = (y - (A.nose[1] - 5)) / 4.5;
      if (fx * fx + fy * fy < 1 || cx * cx + cy * cy < 1 || nx * nx + ny * ny < 1) i = 5;
    }
    return i;
  };
}
/** Cabeza, cuello y oreja (las capas de pelo/ropa las pone la definición) */
function phAddHead(P, A, def, M) {
  const nk = def.neck || {}, nw = nk.w ?? 7.5, sm = P.S < 1;
  // cuello delgado (el mentón proyecta su sombra)
  P.poly([[A.HX - nw, A.HY + 18], [A.HX + nw + 1, A.HY + 23], [A.HX + nw + 1.5, A.HY + 44], [A.HX - nw - 1, A.HY + 44]], { mat: M.skin, z: 22, group: 'neck', base: 3, bevel: 3, shade: (x) => (x < A.HX - nw + 3 ? 2 : 3), rim: false });
  // cara (línea interior junto al pelo más oscura en el busto)
  P.custom(A.face, [A.HX - A.rx - 2, A.HY - A.ry - 3, A.HX + A.rx + 3, A.HY + 40], { mat: M.skin, z: 30, group: 'face', shade: phFaceShade(A, def), cast: { on: ['neck'], dx: 0, dy: def.chinCast ?? 4, k: 1 }, rim: false, lineU: sm ? M.skin.outlineU : undefined });
  // oreja
  const [ex, ey] = A.ear;
  P.ellipse(ex, ey, 5, 7.6, { mat: M.skin, z: 33, group: 'ear', bevel: 2.5, shade: (x, y) => { const dx = x - ex, dy = y - ey; return dx > 1.4 && dy < 2.5 ? 4 : (dx < -2.6 ? 2 : 3); }, rim: false }, 0.15);
  P.stamp((pb, c) => {
    const X = c.X, Y = c.Y, s = M.skin.rampU;
    if (c.S >= 1) {
      // pliegue interior de la oreja (curva en C) + lóbulo
      for (const [dx, dy, k] of [[0, -4, 1], [-1, -3, 1], [-1, -2, 1], [-1, -1, 2], [-1, 0, 2], [-1, 1, 2], [0, 2, 2], [1, 2, 1], [1, -2, 2], [1, -1, 2], [1, 0, 3], [2, 4, 3], [0, -5, 5], [1, -5, 5]]) { const x = X(ex + dx), y = Y(ey + dy); if (c.group(x, y) === 'ear') pb.set(x, y, s[k]); }
    } else { const x = X(ex), y = Y(ey); if (c.group(x, y) === 'ear') { pb.set(x, y, s[2]); pb.set(x, y + 1, s[2]); } }
  }, 1);
}

/* ---------- Kit de pelo ---------- */
const PHAIR = {
  /** Textura de mechones radiales desde un remolino + anillo de brillo («angel ring») */
  tex(M, o = {}) {
    const wx = o.whorl, step = o.step ?? 0.18, n = M.hair.ramp.length;
    const ringC = o.ringC, rr = o.ringR || [20, 16], a0 = o.ring0 ?? -2.6, a1 = o.ring1 ?? -0.5;
    return (x, y, idx) => {
      const ang = Math.atan2(y - wx[1], x - wx[0]);
      const f = ((ang / step) % 1 + 1) % 1;
      const gap = f < 0.15;
      if (ringC) {
        const dx = (x - ringC[0]) / rr[0], dy = (y - ringC[1]) / rr[1], dr = Math.sqrt(dx * dx + dy * dy), ra = Math.atan2(dy, dx);
        if (ra > a0 && ra < a1) {
          if (Math.abs(dr - 1) < (o.ringW ?? 0.07) && !gap && idx >= (o.ringMin ?? 2)) return Math.min(n - 1, idx + 2);
          if (Math.abs(dr - 1) < (o.ringW ?? 0.07) * 2.2 && f > 0.45 && f < 0.8 && idx >= 2) return Math.min(n - 1, idx + 1);
        }
      }
      if (gap && idx > 1) return idx - 1;
      if (f > 0.5 && f < 0.62 && idx >= 3 && idx < n - 2 && o.streak !== false) return idx + 1;
      return idx;
    };
  },
  /** Mechones: lista [[x,y]… , r0] en coordenadas absolutas; cast = sombra sobre la cara */
  clumps(P, M, list, o = {}) {
    list.forEach((b, i) => {
      const r0 = b[b.length - 1], pts = b.slice(0, -1);
      P.strand(pts, r0, o.tip ?? 0.4, { mat: M.hair, z: (o.z ?? 40) + i * 0.01, group: (o.group || 'bang') + i, base: o.base ?? 3, taper: o.taper ?? 1.5, bevel: Math.max(1.2, r0 * (o.bev ?? 0.7)), tex: o.tex, hiT: o.hiT ?? 0.62,
        cast: o.cast === false ? undefined : { on: o.castOn || ['face', 'ear', 'neck'], dx: -1, dy: o.castDy ?? 3, k: 1 } });
    });
  },
};
const PH_BANG_GROUPS = ['hair', 'bang0', 'bang1', 'bang2', 'bang3', 'bang4', 'bang5', 'bang6', 'bang7', 'bang8', 'bang9', 'side0', 'side1', 'side2', 'side3', 'face'];

/* =====================================================================
   Definiciones de personaje (perezosas: las rampas del rediseño se cargan
   en 17a_kit_palette.js, después de este archivo)
   ===================================================================== */
const PDEFS = {};
const _pdefCache = new Map();
function pdef(id) {
  let d = _pdefCache.get(id);
  if (!d) { const f = PDEFS[id] || PDEFS.amaya; d = f(); _pdefCache.set(id, d); }
  return d;
}

/* ---------- AMAYA (canon de la referencia) ---------- */
PDEFS.amaya = () => {
  const R = RAMP, C = RAMP_CH;
  const M = {
    skin: PK.mat(R.skinAm, '#602316', R.skinAm[2]), hair: PK.mat(['#1c0503', '#33100a', '#4e1c10', '#6e2c18', '#8e4022', '#b05a30', '#d07c46', '#eaa064'], '#1a0405', '#33100a'),
    jacket: PK.mat(R.jacketAm, '#4b0706', R.jacketAm[2]), top: PK.mat(R.topAm, '#2a1a20', R.topAm[2]),
    pack: PK.mat(R.packSteel, '#171d35', R.packSteel[1]), flap: PK.mat(C.flapAm, '#1e0a04', C.flapAm[1]), leather: PK.mat(R.leatherAm, '#1e0a04', R.leatherAm[1]),
    strap: PK.mat(C.strapNavy, '#070813', C.strapNavy[0]), frame: PK.mat(R.gogFrame, '#0e0a14', R.gogFrame[1]), lens: PK.mat(R.gogLens, '#06202e', R.gogLens[1]),
    tie: PK.mat(C.tieAm, '#2a1404', C.tieAm[1]),
  };
  return {
    M, iris: { R: '#0e0201', D: '#1e0704', P: '#080100', M: '#45180a', L: '#7a3a1a', l: '#b06a36' },
    lash: '#1a0604', lashSoft: '#4a1a10', brow: '#2e0a05', mouthInk: '#5a160c', mouthIn: '#8a2a20', tongue: '#e0706a', blush: '#ff7a6a', blushAlways: 0.5,
    build(P, A) {
      // mochila tras el hombro cercano (cuerpo de acero + solapa de cuero con hebilla y LED)
      P.box(10, 92, 14, 14, 3, { mat: M.pack, z: 4, group: 'pack', base: 3, bevel: 5 }, -0.1);
      P.poly([[-3, 82], [5, 75], [24, 74], [28, 82], [20, 88], [-2, 89]], { mat: M.flap, z: 5, group: 'flap', base: 4, bevel: 3 });
      P.stamp((pb, c) => {
        const X = c.X, Y = c.Y;
        if (c.S >= 1) { pb.rect(X(12), Y(85), 3, 5, '#e6b422'); pb.set(X(12), Y(85), '#fff08a'); pb.rect(X(5), Y(93), 3, 3, '#56e5ff'); pb.set(X(5), Y(93), '#e6fdff'); pb.hline(X(0), X(20), Y(80), C.flapAm[5]); }
        else { pb.set(X(12), Y(86), '#e6b422'); pb.set(X(5), Y(93), '#56e5ff'); }
      }, 2);
      // coleta alta voluminosa: masa redonda + mechones curvos con puntas abajo-izquierda
      const sm = P.S < 1;
      const ptx = PHAIR.tex(M, { whorl: [30, 17], step: sm ? 0.32 : 0.2, streak: !sm, ringC: [18, 26], ringR: [13, 14], ring0: -2.9, ring1: -1.2, ringW: 0.07 });
      P.ellipse(18, 28, 15, 19, { mat: M.hair, z: 8, group: 'ponyM', base: 3, bevel: 8, shiny: true, tex: ptx }, 0.3);
      PHAIR.clumps(P, M, [
        [[30, 15], [20, 7], [9, 9], [3, 18], [1, 30], 8],
        [[30, 17], [17, 17], [8, 29], [4, 43], 8.5],
        [[30, 19], [20, 28], [13, 42], [10, 56], 8.5],
        [[31, 21], [25, 35], [21, 49], [21, 63], 7.5],
        [[32, 22], [30, 38], [31, 51], [34, 62], 5],
      ], { z: 9, group: 'pony', base: 3, tex: ptx, cast: false, taper: 1.6, bev: 0.8, hiT: 0.55 });
      // chaqueta roja de manga corta abierta sobre top blanco
      P.poly([[-3, 98], [1, 91], [11, 85], [27, 81], [44, 78], [54, 78], [72, 78], [84, 80], [93, 85], [99, 91], [99, 98]], { mat: M.jacket, z: 10, group: 'jacket', base: 4, bevel: 7, tex: (x, y, i) => (Math.abs(x - 22 - (y - 84) * 0.15) < 0.6 && y > 85 ? Math.max(1, i - 1) : i) });
      P.poly([[49, 98], [51, 87], [56, 81], [67, 81], [72, 87], [73, 98]], { mat: M.top, z: 11, group: 'top', base: 4, bevel: 3 });
      P.poly([[41, 98], [44, 87], [51, 80], [56, 81], [51, 89], [48, 98]], { mat: M.jacket, z: 12, group: 'lapelL', base: 4, bevel: 2 });
      P.poly([[74, 98], [72, 89], [67, 81], [72, 80], [78, 87], [80, 98]], { mat: M.jacket, z: 12, group: 'lapelR', base: 5, bevel: 2 });
      // cuello de la chaqueta levantado (detrás del cuello)
      P.poly([[43, 84], [46, 72], [53, 70], [55, 80]], { mat: M.jacket, z: 20, group: 'collarL', base: 3, bevel: 2 });
      P.poly([[68, 80], [70, 70], [77, 72], [79, 83]], { mat: M.jacket, z: 20, group: 'collarR', base: 5, bevel: 2 });
      // tirante de la mochila (cuero) sobre el hombro cercano
      P.poly([[24, 84], [32, 80], [45, 99], [36, 99]], { mat: M.leather, z: 13, group: 'strap', base: 4, bevel: 2 });
      P.stamp((pb, c) => {
        const X = c.X, Y = c.Y;
        if (c.S >= 1) {
          pb.rect(X(36), Y(89), 5, 5, '#e6b422'); pb.rect(X(37), Y(90), 3, 3, '#7a5a10'); pb.set(X(36), Y(89), '#fff08a');
          for (let y = 84; y < 98; y += 3) pb.set(X(33 + (y - 84) * 0.62), Y(y), M.leather.ramp[2]);
          pb.stampMap(X(81), Y(86), ['..a..', '.aba.', 'abcba', 'abbba', '.aaa.'], { a: '#0e5a5e', b: '#1aa894', c: '#d0fff2' });
        } else {
          pb.rect(X(36), Y(90), 2, 2, '#e6b422');
          pb.stampMap(X(81), Y(87), ['.a.', 'aba'], { a: '#0e5a5e', b: '#7ff0dc' });
        }
      }, 3);
    },
    hair(P, A) {
      const sm = P.S < 1;
      // casquete peinado hacia atrás (los mechones convergen en el lazo de la coleta)
      const tx = PHAIR.tex(M, { whorl: [30, 17], step: sm ? 0.3 : 0.16, ringC: [57, 31], ringR: [24, 17], ring0: -2.75, ring1: -0.45, ringW: 0.06, streak: !sm });
      const mass = SDF.ellipse(58, 38, 30, 30), win = SDF.ellipse(64, 57, 25.5, 24.5);
      // borde frontal en dientes (puntas cortas del flequillo sobre la línea del pelo)
      const teeth = (x, y) => { const k = (x - 46) / 6.2; const ph = k - Math.floor(k); const tip = 35 + Math.abs(ph - 0.5) * -7 + (x > 70 ? (x - 70) * 0.35 : 0); return y - tip; };
      const capS = SDF.sub(mass, SDF.inter(win, (x, y) => (x > 44 && x < 86 ? -teeth(x, y) : -1)));
      P.custom(capS, [26, 5, 92, 70], { mat: M.hair, z: 32, group: 'hair', base: 3, bevel: 8, shiny: true, hiT: 0.6, tex: tx, cast: { on: ['face', 'ear', 'neck'], dx: -1, dy: 3, k: 1 } });
      // lazo amarillo de la coleta
      P.ellipse(31, 17, 2.6, 6, { mat: M.tie, z: 34, group: 'tie', base: 4, bevel: 1.5, shiny: true }, 0.7);
      // mechones que cruzan la frente (barrido hacia la izquierda) + mechones laterales largos
      const btx = PHAIR.tex(M, { whorl: [66, 8], step: sm ? 0.32 : 0.22, ringC: [57, 31], ringR: [24, 17], ring0: -2.75, ring1: -0.45, ringW: 0.06, ringMin: 3, streak: !sm });
      PHAIR.clumps(P, M, sm ? [
        [[60, 24], [54, 33], [47, 41], 5],
        [[72, 24], [74, 32], [73, 39], 4.4],
      ] : [
        [[60, 22], [55, 31], [47, 41], 5],
        [[56, 24], [51, 31], [45, 36], 3.6],
        [[66, 24], [65, 32], [61, 39], 4],
        [[73, 24], [75, 31], [74, 38], 4.4],
      ], { z: 40, group: 'bang', base: 3, tex: btx });
      PHAIR.clumps(P, M, [
        [[80, 25], [86, 35], [88, 47], [89, 58], [86, 68], 4.8],
        [[84, 28], [91, 40], [94, 52], [93, 62], 3.4],
      ], { z: 41, group: 'side', base: 3, tex: btx, taper: 1.2, castDy: 2 });
      // mechón de la sien cercana (detrás de la oreja) y nuca
      PHAIR.clumps(P, M, [
        [[43, 30], [38, 42], [36, 54], [38, 63], 4.2],
        [[36, 36], [31, 48], [30, 60], 4.6],
      ], { z: 31.5, group: 'nape', base: 3, tex: tx, taper: 1.2, cast: false });
    },
    acc(P, A) {
      // gafas de aviador sobre la frente: correa navy, montura gris gruesa, lentes cian con brillo
      const gcast = { on: PH_BANG_GROUPS, dx: -1, dy: 2, k: 1 };
      P.strand([[45, 21], [38, 23.5], [33, 25]], 2.4, 2.2, { mat: M.strap, z: 33, group: 'gstrap', base: 3, bevel: 1.2, shiny: false });
      P.strand([[64, 18], [71, 18.5]], 2.4, 2.4, { mat: M.frame, z: 60.5, group: 'gbridge', base: 3, bevel: 1, shiny: false });
      P.ellipse(54, 19.5, 10.5, 8, { mat: M.frame, z: 61, group: 'gframe1', base: 4, bevel: 2.6, shiny: true, cast: gcast });
      P.ellipse(80.5, 20.5, 7.6, 7.2, { mat: M.frame, z: 61.5, group: 'gframe2', base: 3, bevel: 2.2, shiny: true, cast: gcast });
      const lensShade = (cx, cy, rx, ry) => (x, y) => { const u = (x - cx) / rx, v = (y - cy) / ry; return u + v > 0.8 ? 3 : u + v > 0.15 ? 4 : (u < -0.2 && v < -0.15 ? 6 : 5); };
      P.ellipse(54.5, 19.5, 7.4, 5.4, { mat: M.lens, z: 62, group: 'lens1', shade: lensShade(54.5, 19.5, 7.4, 5.4), line: false, rim: false });
      P.ellipse(81, 20.5, 4.8, 4.8, { mat: M.lens, z: 62.5, group: 'lens2', shade: lensShade(81, 20.5, 4.8, 4.8), line: false, rim: false });
      P.post((pb, c) => {
        const X = c.X, Y = c.Y;
        if (c.S >= 1) { pb.rect(X(50), Y(16), 3, 2, '#e6fdff'); pb.set(X(53), Y(17), '#e6fdff'); pb.set(X(50), Y(18), '#e6fdff'); pb.rect(X(79), Y(18), 2, 2, '#e6fdff'); pb.set(X(58), Y(23), '#7fd8f6'); }
        else { pb.set(X(51), Y(17), '#e6fdff'); pb.set(X(79), Y(19), '#e6fdff'); }
      });
    },
  };
};

/* ---------- Construcción de la base y de cada expresión ---------- */
const PSCALE = {
  P: { w: 96, h: 96, S: 1, ox: 0, oy: 0 },
  B: { w: 48, h: 46, S: 0.5, ox: 0, oy: 2 },
};
function buildPortraitBase(id, scale) {
  const def = pdef(id), sc = PSCALE[scale];
  const P = new PPaint(sc.w, sc.h, sc.S, sc.ox, sc.oy);
  const A = phHead(def);
  def.build && def.build(P, A);
  phAddHead(P, A, def, def.M);
  def.hair && def.hair(P, A);
  def.acc && def.acc(P, A);
  const r = P.render({ rimK: def.rimK ?? 0.26, rimColor: def.rimColor });
  r.A = A; r.def = def;
  return r;
}
/** Sella la expresión sobre una copia de la base humana */
function stampHumanFace(base, scale, E, talk, blink) {
  const pb = pbClone(base.pb), def = base.def, A = base.A, c = base.ctx, S = base.S;
  const X = (x) => Math.floor((x - base.ox) * S), Y = (y) => Math.floor((y - base.oy) * S);
  const sk = def.M.skin.rampU;
  const pal = {
    K: def.lash, k: def.lashSoft || def.lash, W: def.white2 || '#e8c4b4', w: def.white || '#fff4ea', R: def.iris.R, D: def.iris.D, P: def.iris.P, M: def.iris.M, L: def.iris.L, l: def.iris.l,
    h: '#ffffff', s: sk[2],
  };
  const sm = scale === 'B';
  const ek = blink ? (E.eye === 'happy' ? 'happy' : 'blink') : E.eye;
  const enx = X(A.eyeN[0]), eny = Y(A.eyeN[1]), efx = X(A.eyeF[0]), efy = Y(A.eyeF[1]);
  const isFace = (x, y) => c.group(x, y) === 'face';
  // rubor (antes de los ojos): óvalo suave mezclado hacia el color de rubor, sin tramado
  const bl = Math.max(E.blush || 0, def.blushAlways || 0);
  if (bl) {
    const bcU = U(def.blush || '#ff8a6a');
    const cheek = (cx, cy, rx, ry, k) => {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2;
        if (d > 1 || !isFace(x, y)) continue;
        const i = y * pb.w + x; pb.data[i] = pkMixU(pb.data[i], bcU, (d < 0.4 ? 0.6 : 0.34) * k);
      }
    };
    const k = Math.min(1.3, bl > 1 ? 1.3 : bl);
    if (sm) { cheek(enx - 0.5, eny + 4, 2.4, 1.2, k); cheek(efx + 1.5, efy + 4, 1.3, 1.1, k * 0.8); }
    else { cheek(enx - 1, eny + 8.5, 5 * (bl > 1 ? 1.15 : 1), 2.6, k); cheek(efx + 2.5, efy + 8, 2.8, 2.2, k * 0.85); if (bl > 1) for (const dx of [-3, 0, 3]) { const x = enx - 2 + dx, y = eny + 8; if (isFace(x, y)) pb.set(x, y + (dx === 0 ? 0 : 1), pkMixU(pb.get(x, y), bcU, 0.9)); } }
  }
  // ojos
  if (sm) { drawPEyeMini(pb, efx, efy, 'far', ek, E.look, pal); drawPEyeMini(pb, enx, eny, 'near', ek, E.look, pal); }
  else { drawPEye(pb, efx, efy, 'far', ek, E.look, pal, { pupil: E.pupil }); drawPEye(pb, enx, eny, 'near', ek, E.look, pal, { pupil: E.pupil }); }
  // cejas (sobre la cara; el flequillo las tapa en parte)
  const bc = def.brow || def.M.hair.ramp[1];
  const canB = (x, y) => isFace(x, y) || (def.browOverHair && /^(bang|side)/.test(c.group(x, y) || ''));
  const bk = E.brow, bkF = bk === 'skeptical' ? 'skepticalHi' : bk;
  if (sm) {
    drawPBrow(pb, enx - 3, enx + 2, eny - 4 + Math.round((def.browDY || 0) * 0.5), bk, bc, 1, canB);
    drawPBrow(pb, efx + 2, efx - 1, efy - 4 + Math.round((def.browDY || 0) * 0.5), bkF, bc, 1, canB);
  } else {
    drawPBrow(pb, enx - 6, enx + 4, eny - 10 + (def.browDY || 0), bk, bc, 2, canB);
    drawPBrow(pb, efx + 4, efx - 3, efy - 10 + (def.browDY || 0), bkF, bc, 2, canB);
  }
  // nariz: sombra de 1–2 px abajo-izquierda de la punta + brillo
  const nx = X(A.nose[0]), ny = Y(A.nose[1]);
  if (sm) pb.set(nx, ny, sk[2]);
  else { pb.set(nx, ny, sk[2]); pb.set(nx - 1, ny, sk[3]); pb.set(nx + 1, ny - 1, sk[3]); pb.set(nx + 1, ny - 3, sk[6]); }
  // boca
  const mk = talk ? (E.talk || 'talkS') : E.mouth;
  const mpal = { K: def.mouthInk, m: def.mouthIn, t: def.tongue, w: '#fff4ea', l: sk[5], s: sk[3] };
  drawPMouth(pb, X(A.mouth[0]), Y(A.mouth[1]), scale, mk, mpal);
  // lágrimas y sudor
  if (E.tear && !blink) {
    if (sm) { pb.set(enx - 3, eny + 2, '#a6f4ff'); pb.set(enx - 3, eny + 3, '#56e5ff'); }
    else { for (let k = 0; k < 7; k++) pb.set(enx - 5 + (k > 4 ? 1 : 0), eny + 5 + k, k === 6 ? '#e6fdff' : '#7fd8f6'); pb.set(enx - 5, eny + 5, '#e6fdff'); }
  }
  if (E.sweat) {
    const sx = X(A.HX + 24), sy = Y(A.HY - 2);
    if (sm) { pb.set(sx, sy, '#a6f4ff'); pb.set(sx, sy + 1, '#56e5ff'); }
    else pb.stampMap(sx - 1, sy - 2, ['.o.', '.a.', 'oab', 'abb', '.o.'], { o: '#1a4a6a', a: '#e6fdff', b: '#7fd8f6' });
  }
  if (def.faceExtra) def.faceExtra(pb, { X, Y, A, S, sm, E, talk, blink, isFace, c, def, enx, eny, efx, efy });
  return pb;
}

const Portraits = {
  cache: new Map(),
  bases: new Map(),
  base(id, scale, variant = '') {
    const k = id + '|' + scale + '|' + variant;
    let b = this.bases.get(k);
    if (!b) {
      const def = pdef(id);
      b = def.custom ? def.custom(scale, PSCALE[scale], variant) : buildPortraitBase(id, scale);
      this.bases.set(k, b);
    }
    return b;
  },
  _make(id, expr, talk, blink, scale) {
    const id2 = PDEFS[id] ? id : 'amaya';
    const def = pdef(id2);
    const E = pexpr(expr);
    if (def.face) return def.face(this, scale, pexprName(expr), E, talk, blink, id2);
    return stampHumanFace(this.base(id2, scale), scale, E, talk, blink);
  },
  /** Retrato de diálogo 96×96 (transparente, sin marco) */
  get(id, expr = 'neutral', talk = 0, blink = false) {
    const k = id + '|' + expr + '|' + (talk ? 1 : 0) + '|' + (blink ? 1 : 0);
    let c = this.cache.get(k);
    if (c) return c;
    c = this._make(id, expr, talk ? 1 : 0, !!blink, 'P').toCanvas();
    this.cache.set(k, c);
    if (this.cache.size > 400) this.cache.delete(this.cache.keys().next().value);
    return c;
  },
  /** Busto del HUD 48×46 (re-rasterizado a escala 0,5 con plantillas propias) */
  bust(id, expr = 'smile', talk = 0, blink = false) {
    const k = 'B|' + id + '|' + expr + '|' + (talk ? 1 : 0) + '|' + (blink ? 1 : 0);
    let c = this.cache.get(k);
    if (c) return c;
    c = this._make(id, expr, talk ? 1 : 0, !!blink, 'B').toCanvas();
    this.cache.set(k, c);
    if (this.cache.size > 400) this.cache.delete(this.cache.keys().next().value);
    return c;
  },
  /** alias del análisis (02_personajes §5.5) */
  mini(id, expr) { return this.bust(id, expr); },
  /** precalienta retratos frecuentes (llamar en carga de nivel) */
  warm(ids, exprs = ['neutral', 'smile']) { for (const id of ids) for (const e of exprs) { this.get(id, e, 0); this.get(id, e, 1); } },
};
