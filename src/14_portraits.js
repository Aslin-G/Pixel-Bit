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
    if (kind === 'happy') { put(-1, 1, 'K'); if (!opt.male) put(-2, 2, 'k'); for (let u = 2; u < Wd - 2; u++) put(u, 3, 's'); }
    else { put(-1, 0, 'K'); if (!opt.male) put(-2, -1, 'K'); put(-1, 1, 'k'); for (let u = 2; u < Wd - 2; u++) put(u, Math.round(2.4 + Math.sin(Math.PI * (u + 0.5) / Wd) * 2.2), 's'); }
    return;
  }
  // abertura: T[u] = fila de la pestaña (abre en T+1), B[u] = última fila abierta
  const T = G.T.slice().map(v => v + (opt.lidDrop || 0)), Bt = G.B.slice().map(v => v - (opt.lidUp || 0)), top = Math.min(...G.T) + (opt.lidDrop || 0);
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
  if (opt.male) {
    for (let u = 0; u < Wd; u++) { put(u, T[u], 'K'); if (u > 0 && u < Wd - 2) put(u, T[u] - 1, u > 1 && u < Wd - 3 ? 'K' : 'k'); }
    put(-1, T[0], 'k'); put(-1, T[0] + 1, 'k');
  } else {
    for (let u = 0; u < Wd; u++) { put(u, T[u], 'K'); if (u < Wd - 1) put(u, T[u] - 1, u >= Wd - 3 ? 'k' : 'K'); }
    put(-1, T[0] - 1, 'K'); put(-1, T[0], 'K'); put(-2, T[0] - 2, 'K'); put(-2, T[0] - 1, 'k'); put(-1, T[0] + 1, 'k');
  }
  // párpado inferior suave (pestaña corta en el rabillo + línea de piel)
  for (let u = 1; u < Wd - 2; u++) put(u, Bt[u] + 1, u < 3 ? 'k' : 's');
  if (kind === 'tired') for (let u = 1; u < Wd - 2; u++) put(u, Bt[u] + 3, 's');
}
/* ---------- Ojos del busto (48): plantillas a mano por forma; fila 0 = cy − 2 ---------- */
const PEYE_MINI = {
  near: {
    open: ['KKKKKK', '.whDDK', '.wDDD.', '.wDPD.', '.wMMD.', '..LL..'],
    look: ['KKKKKK', '.wwhDK', '.wwDD.', '.wwDD.', '.wwML.', '......'],
    half: ['......', 'KKKKKK', '.whDD.', '.wDPD.', '.wMMD.', '..LL..'],
    soft: ['......', '......', 'KKKKK.', '.wMMD.', '..ss..', '......'],
    tired: ['......', '......', '......', 'KKKKKK', '.wMMD.', '.ssss.'],
    down: ['......', '......', 'KKKKKK', '.wDDD.', '.wMLM.', '..ss..'],
    angry: ['K.....', '.KK...', '.wKKK.', '.whKKK', '.wDPD.', '..ML..'],
    determined: ['......', 'KKK...', '.wKKKK', '.whDD.', '.wDPD.', '..ML..'],
    sad: ['....KK', '...K..', '.KKhD.', '.wDDD.', '.wMPD.', '..ML..'],
    worried: ['....KK', '.KKKK.', 'KwhDD.', '.wDDD.', '.wMMD.', '..LL..'],
    wide: ['.KKKK.', 'Kwwww.', '.whDw.', '.wDDw.', '.wwww.', '..ww..'],
    happy: ['......', '......', '..KK..', '.K..K.', 'K....K', '......'],
    closed: ['......', '......', '......', 'K....K', '.KKKK.', '......'],
    blink: ['......', '......', '......', '......', 'KKKKKK', '..ss..'],
  },
  far: {
    open: ['KKKKK', 'whDDK', 'wDDD.', 'wDPD.', 'wMMD.', '.LL..'],
    look: ['KKKKK', 'wwhDK', 'wwDD.', 'wwDD.', 'wwML.', '.....'],
    half: ['.....', 'KKKKK', 'whDD.', 'wDPD.', 'wMMD.', '.LL..'],
    soft: ['.....', '.....', 'KKKK.', 'wMMD.', '.ss..', '.....'],
    tired: ['.....', '.....', '.....', 'KKKKK', 'wMMD.', 'ssss.'],
    down: ['.....', '.....', 'KKKKK', 'wDDD.', 'wMLM.', '.ss..'],
    angry: ['....K', '...KK', '.KKK.', 'KKhD.', 'wDPD.', '.ML..'],
    determined: ['.....', '..KKK', 'KKKK.', 'whDD.', 'wDPD.', '.ML..'],
    sad: ['KK...', '..K..', '.hKKK', 'wDDD.', 'wMPD.', '.ML..'],
    worried: ['KK...', '.KKKK', 'whDDK', 'wDDD.', 'wMMD.', '.LL..'],
    wide: ['.KKK.', 'wwwwK', 'whDw.', 'wDDw.', 'wwww.', '.ww..'],
    happy: ['.....', '.....', '.KK..', 'K..K.', '.....', '.....'],
    closed: ['.....', '.....', '.....', 'K..K.', '.KK..', '.....'],
    blink: ['.....', '.....', '.....', '.....', 'KKKK.', '.ss..'],
  },
};
function drawPEyeMini(pb, cx, cy, side, kind, look, pal, opt = {}) {
  const set = PEYE_MINI[side];
  let T = set[kind] || set.open;
  // mirada lateral en el busto: plantilla 'look' si mira a un lado con el ojo abierto
  if (kind === 'open' && look && Math.abs(look[0]) >= 2) T = set.look;
  const w = T[0].length;
  T = T.slice();
  if (opt.lidDrop && (kind === 'open' || kind === 'look' || kind === 'wide')) { const lash = T[0]; T = ['.'.repeat(w), lash.replace(/[^K]/g, 'K')].concat(T.slice(2)); }
  if (opt.male && /^K/.test(T[0]) && side === 'near') T[0] = '.' + T[0].slice(1);
  if (opt.male && /K$/.test(T[0]) && side === 'far') T[0] = T[0].slice(0, -1) + '.';
  const x0 = side === 'near' ? cx - 3 : cx - 2;
  pb.stampMap(x0, cy - 3, T, pal);
}

/* ---------- Bocas (plantillas por escala; x = columna central) ---------- */
const PMOUTH = {
  P: {
    line: ['.KKKK', 'K....'], smile: ['K.....K', '.KKKKK.', '..lll..'], grinS: ['KKKKKK', 'KmttmK', '.KKKK.'], grin: ['KKKKKKK', 'KwwwwwK', 'KmmttmK', '.KKKKK.'],
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
    lash: '#1a0604', lashSoft: '#4a1a10', brow: '#2e0a05', mouthInk: '#5a160c', mouthIn: '#8a2a20', tongue: '#e0706a', blush: '#ff7a6a', blushAlways: 0.5, rimColor: '#ffc89a', rimK: 0.16,
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
        [[30, 15], [20, 6], [9, 8], [2, 17], [0, 30], 8],
        [[30, 17], [17, 18], [8, 30], [2, 42], 8.5],
        [[30, 19], [21, 29], [14, 42], [7, 52], 8.5],
        [[31, 21], [26, 34], [22, 46], [15, 57], 7],
        [[32, 22], [31, 36], [30, 48], [26, 58], 5],
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
    K: def.lash, k: def.lashSoft || def.lash, W: def.white2 || '#d6cede', w: def.white || '#fff4ea', R: def.iris.R, D: def.iris.D, P: def.iris.P, M: def.iris.M, L: def.iris.L, l: def.iris.l,
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
  const eo = Object.assign({ pupil: E.pupil }, def.eyeOpt || {});
  if (sm) { drawPEyeMini(pb, efx, efy, 'far', ek, E.look, pal, eo); drawPEyeMini(pb, enx, eny, 'near', ek, E.look, pal, eo); }
  else { drawPEye(pb, efx, efy, 'far', ek, E.look, pal, eo); drawPEye(pb, enx, eny, 'near', ek, E.look, pal, eo); }
  // cejas (sobre la cara; el flequillo las tapa en parte)
  const bc = def.brow || def.M.hair.ramp[1];
  const canB = (x, y) => isFace(x, y) || (def.browOverHair && /^(bang|side)/.test(c.group(x, y) || ''));
  const bk = E.brow, bkF = bk === 'skeptical' ? 'skepticalHi' : bk;
  if (sm) {
    drawPBrow(pb, enx - 3, enx + 2, eny - 4 + Math.round((def.browDY || 0) * 0.5), bk, bc, 1, canB);
    drawPBrow(pb, efx + 2, efx - 1, efy - 4 + Math.round((def.browDY || 0) * 0.5), bkF, bc, 1, canB);
  } else {
    drawPBrow(pb, enx - 6, enx + 4, eny - 10 + (def.browDY || 0), bk, bc, def.browThick || 2, canB);
    drawPBrow(pb, efx + 4, efx - 3, efy - 10 + (def.browDY || 0), bkF, bc, def.browThick || 2, canB);
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
    if (def.faceFn) return def.faceFn(this, scale, pexprName(expr), E, talk, blink, id2);
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

/* =====================================================================
   Elenco humano: fábrica de definiciones (ropa × peinado × sombrero ×
   rasgos). Mismo encuadre, luz, contorno y plantillas que Amaya; colores
   y prendas iguales a los de cada sprite (11_chars.js).
   ===================================================================== */
/** Iris de 3 tonos del sprite [oscuro, medio, claro] → tokens del retrato */
function phIris(c3) {
  const [d, m, l] = c3;
  return { R: shade(d, -0.35), D: d, P: shade(d, -0.5), M: m, L: l, l: shade(l, 0.22) };
}
/** Material con contorno oscuro del mismo tono (V ≤ 0,14) */
function phMat(ramp, vMax = 0.14) { return PK.mat(ramp, outlineOf(ramp[0], vMax), ramp[1]); }
/** Tejido: textura de trama diagonal (chaleco de Naira) */
const phWoven = (x, y, i) => ((Math.floor(x) + Math.floor(y)) % 4 === 0 ? Math.max(1, i - 1) : ((Math.floor(x) - Math.floor(y) + 400) % 4 === 0 && i > 2 ? i + 1 : i));
const PH_TORSO = {
  adult: [[-3, 98], [1, 91], [11, 85], [27, 81], [44, 78], [54, 78], [72, 78], [84, 80], [93, 85], [99, 91], [99, 98]],
  broad: [[-3, 98], [-2, 88], [8, 82], [26, 78], [44, 76], [54, 76], [74, 76], [87, 78], [96, 84], [100, 90], [100, 98]],
  child: [[6, 98], [9, 92], [17, 87], [31, 84], [46, 82], [56, 82], [70, 82], [80, 84], [88, 89], [92, 98]],
};
/** Ropa (P, A, M, cfg): todas dibujan torso + escote; z 10–20 */
const PH_OUTFIT = {
  tee(P, A, M, cfg) {
    P.poly(PH_TORSO[cfg.torso || 'adult'], { mat: M.top, z: 10, group: 'torso', base: 4, bevel: 7 });
    P.ellipse(A.HX + 1, A.HY + 37, 11, 4.5, { mat: M.top, z: 21, group: 'collar', base: 3, bevel: 2 });
  },
  vest(P, A, M, cfg) {
    P.poly(PH_TORSO.adult, { mat: M.top, z: 10, group: 'torso', base: 4, bevel: 7 });
    // cuello de la camisa en V
    P.poly([[50, 84], [53, 74], [60, 80]], { mat: M.top, z: 21, group: 'colL', base: 5, bevel: 1.5 });
    P.poly([[63, 80], [70, 73], [72, 84]], { mat: M.top, z: 21, group: 'colR', base: 4, bevel: 1.5 });
    // chaleco tejido (paneles a ambos lados)
    P.poly([[-3, 98], [1, 91], [11, 85], [27, 81], [42, 79], [48, 88], [46, 98]], { mat: M.vest, z: 12, group: 'vestL', base: 4, bevel: 4, tex: phWoven });
    P.poly([[76, 98], [74, 88], [78, 79], [86, 81], [94, 86], [99, 92], [99, 98]], { mat: M.vest, z: 12, group: 'vestR', base: 4, bevel: 4, tex: phWoven });
    // bandolera de cuero (del hombro lejano a la cadera cercana)
    if (M.strap) P.poly([[78, 79], [84, 81], [40, 99], [32, 99]], { mat: M.strap, z: 13, group: 'strap', base: 4, bevel: 2 });
  },
  overalls(P, A, M, cfg) {
    P.poly(PH_TORSO.broad, { mat: M.top, z: 10, group: 'torso', base: 4, bevel: 7 });
    P.poly([[38, 99], [40, 88], [80, 88], [82, 99]], { mat: M.over, z: 12, group: 'bib', base: 4, bevel: 4 });
    P.poly([[24, 80], [31, 78], [44, 90], [38, 92]], { mat: M.over, z: 13, group: 'suspL', base: 3, bevel: 2 });
    P.poly([[76, 90], [86, 78], [92, 80], [82, 92]], { mat: M.over, z: 13, group: 'suspR', base: 5, bevel: 2 });
    // pañuelo rojo al cuello
    P.ellipse(A.HX + 1, A.HY + 36, 14, 5.5, { mat: M.scarf, z: 23, group: 'scarf', base: 4, bevel: 3, cast: { on: ['torso'], dx: -1, dy: 2, k: 1 } });
    P.poly([[A.HX - 2, A.HY + 38], [A.HX + 10, A.HY + 38], [A.HX + 3, A.HY + 50]], { mat: M.scarf, z: 23.5, group: 'scarf2', base: 3, bevel: 2 });
    P.stamp((pb, c) => {
      const X = c.X, Y = c.Y, sm = c.S < 1;
      for (const [x, y] of [[40, 89], [80, 89]]) { if (sm) pb.set(X(x), Y(y), '#ffe14d'); else { pb.rect(X(x) - 1, Y(y) - 1, 3, 3, '#e0b41e'); pb.set(X(x) - 1, Y(y) - 1, '#fff08a'); } }
      if (!sm) { pb.rect(X(56), Y(92), 8, 4, M.over.ramp[5]); pb.hline(X(56), X(63), Y(92), M.over.ramp[6]); }
    }, 3);
  },
  labcoat(P, A, M, cfg) {
    P.poly(PH_TORSO.adult, { mat: M.coat, z: 10, group: 'coat', base: 4, bevel: 7 });
    P.poly([[48, 99], [50, 84], [55, 79], [68, 79], [72, 84], [74, 99]], { mat: M.top, z: 11, group: 'top', base: 4, bevel: 3 });
    // cuello alto del jersey violeta
    P.ellipse(A.HX + 1, A.HY + 35, 10.5, 5, { mat: M.top, z: 23, group: 'turtle', base: 4, bevel: 2.5, cast: { on: ['top'], dx: 0, dy: 2, k: 1 } });
    P.poly([[40, 99], [43, 86], [50, 79], [55, 80], [50, 90], [47, 99]], { mat: M.coat, z: 12, group: 'lapL', base: 4, bevel: 2 });
    P.poly([[75, 99], [73, 90], [68, 80], [73, 79], [79, 87], [81, 99]], { mat: M.coat, z: 12, group: 'lapR', base: 5, bevel: 2 });
    P.stamp((pb, c) => {
      const X = c.X, Y = c.Y, sm = c.S < 1;
      // cordón cian + credencial + bolígrafos en el bolsillo
      pb.line(X(57), Y(80), X(62), Y(92), '#56e5ff'); pb.line(X(67), Y(80), X(63), Y(92), '#56e5ff');
      if (sm) { pb.rect(X(61), Y(93), 2, 2, '#f4fdff'); }
      else { pb.rect(X(59), Y(92), 8, 7, '#f4fdff'); pb.hline(X(60), X(65), Y(94), '#2c63c0'); pb.rect(X(60), Y(96), 3, 2, '#ffe14d'); pb.vline(X(25), Y(86), Y(93), '#ffe14d'); pb.vline(X(28), Y(85), Y(93), '#ff6b6b'); pb.hline(X(21), X(32), Y(93), M.coat.ramp[2]); }
    }, 3);
  },
  raincoat(P, A, M, cfg) {
    P.poly(PH_TORSO.adult, { mat: M.coat, z: 10, group: 'coat', base: 4, bevel: 7 });
    P.poly([[49, 99], [51, 85], [56, 79], [67, 79], [71, 85], [72, 99]], { mat: M.top, z: 11, group: 'top', base: 4, bevel: 3 });
    // cuello de pico del impermeable levantado
    P.poly([[42, 86], [45, 72], [53, 70], [56, 80], [50, 90]], { mat: M.coat, z: 20, group: 'colL', base: 3, bevel: 2 });
    P.poly([[67, 80], [70, 70], [78, 72], [80, 85], [73, 90]], { mat: M.coat, z: 20, group: 'colR', base: 5, bevel: 2 });
    P.stamp((pb, c) => { const X = c.X, Y = c.Y; if (c.S < 1) return; for (const y of [88, 95]) { pb.rect(X(45), Y(y), 3, 2, M.coat.ramp[1]); pb.set(X(45), Y(y), M.coat.ramp[5]); } pb.hline(X(10), X(30), Y(92), M.coat.ramp[2]); }, 3);
  },
  apron(P, A, M, cfg) {
    P.poly(PH_TORSO.broad, { mat: M.top, z: 10, group: 'torso', base: 4, bevel: 7 });
    P.ellipse(A.HX + 1, A.HY + 36, 12, 4.5, { mat: M.top, z: 21, group: 'collar', base: 3, bevel: 2 });
    P.poly([[36, 99], [39, 86], [81, 86], [84, 99]], { mat: M.apron, z: 12, group: 'apron', base: 4, bevel: 4 });
    P.capsule(42, 87, 50, 74, 1.6, 1.6, { mat: M.apron, z: 13, group: 'astrapL', base: 3, bevel: 1 });
    P.capsule(78, 87, 72, 74, 1.6, 1.6, { mat: M.apron, z: 13, group: 'astrapR', base: 4, bevel: 1 });
    P.stamp((pb, c) => { const X = c.X, Y = c.Y; if (c.S < 1) return; pb.rect(X(52), Y(91), 16, 1, M.apron.ramp[2]); pb.rect(X(52), Y(90), 16, 1, M.apron.ramp[5]); pb.set(X(60), Y(95), '#ffe14d'); }, 3);
  },
  poncho(P, A, M, cfg) {
    P.poly(PH_TORSO.adult.map(([x, y]) => [x, y + 1]), { mat: M.poncho, z: 10, group: 'poncho', base: 4, bevel: 7,
      });
    P.ellipse(A.HX + 1, A.HY + 37, 12, 5, { mat: M.top, z: 21, group: 'collar', base: 4, bevel: 2 });
    P.stamp((pb, c) => {
      const X = c.X, Y = c.Y, zbP = c.parts.findIndex(p => p.group === 'poncho');
      for (const [yy, col, col2] of [[86, cfg.stripe || '#ffe14d', '#b88a18'], [93, cfg.stripe2 || '#f4a050', '#a0502a']]) {
        const y = Y(yy);
        for (let x = 0; x < pb.w; x++) { const i = y * pb.w + x; if (c.zb[i] === zbP) { pb.set(x, y, col); if (c.S >= 1 && c.zb[i + pb.w] === zbP) pb.set(x, y + 1, col2); } }
      }
      if (c.S >= 1) for (let x = X(4); x < X(96); x += 6) { const y = Y(89) + ((x >> 1) & 1); if (c.zb[y * pb.w + x] === zbP) pb.set(x, y, M.poncho.ramp[2]); }
    }, 3);
  },
  jacket(P, A, M, cfg) {
    P.poly(PH_TORSO.adult, { mat: M.jacket, z: 10, group: 'jacket', base: 4, bevel: 7 });
    P.poly([[48, 99], [50, 85], [55, 79], [68, 79], [72, 85], [74, 99]], { mat: M.top, z: 11, group: 'top', base: 4, bevel: 3 });
    P.poly([[40, 99], [43, 86], [50, 79], [56, 80], [51, 90], [48, 99]], { mat: M.jacket, z: 12, group: 'lapL', base: 3, bevel: 2 });
    P.poly([[74, 99], [72, 90], [67, 80], [73, 79], [79, 87], [81, 99]], { mat: M.jacket, z: 12, group: 'lapR', base: 5, bevel: 2 });
    if (cfg.tie) {
      P.poly([[58.5, 80], [64.5, 80], [62.5, 84], [64, 99], [59, 99], [60.5, 84]], { mat: M.tie, z: 13, group: 'tie', base: 4, bevel: 1.5 });
      P.poly([[54, 79], [61.5, 82], [58, 86]], { mat: M.top, z: 14, group: 'shirtL', base: 5, bevel: 1 });
      P.poly([[62, 82], [69, 78], [66, 86]], { mat: M.top, z: 14, group: 'shirtR', base: 4, bevel: 1 });
    }
    if (cfg.brooch) P.stamp((pb, c) => { const X = c.X, Y = c.Y; if (c.S < 1) { pb.set(X(80), Y(88), cfg.brooch); return; } pb.stampMap(X(78), Y(86), ['.a.', 'aba', '.a.'], { a: cfg.brooch, b: '#fff6c0' }); }, 3);
  },
  hivis(P, A, M, cfg) {
    P.poly(PH_TORSO.adult, { mat: M.top, z: 10, group: 'torso', base: 4, bevel: 7 });
    P.ellipse(A.HX + 1, A.HY + 37, 11, 4.5, { mat: M.top, z: 21, group: 'collar', base: 3, bevel: 2 });
    P.poly([[-3, 98], [1, 91], [11, 85], [27, 81], [44, 79], [52, 99]], { mat: M.vest, z: 12, group: 'vestL', base: 4, bevel: 4 });
    P.poly([[70, 99], [77, 80], [86, 81], [94, 86], [99, 92], [99, 98]], { mat: M.vest, z: 12, group: 'vestR', base: 4, bevel: 4 });
    P.stamp((pb, c) => {
      const X = c.X, Y = c.Y;
      for (const yy of [88, 94]) { const y = Y(yy); for (let x = 0; x < pb.w; x++) { const g = c.group(x, y); if (g === 'vestL' || g === 'vestR') { pb.set(x, y, '#eef4f8'); if (c.S >= 1) pb.set(x, y + 1, '#a8b8c4'); } } }
      if (c.S >= 1) { pb.rect(X(82), Y(84), 4, 6, '#20262e'); pb.set(X(83), Y(84), '#86e36f'); }
    }, 3);
  },
  aviator(P, A, M, cfg) {
    P.poly(PH_TORSO.adult, { mat: M.top, z: 10, group: 'torso', base: 4, bevel: 7 });
    P.poly([[-3, 98], [1, 91], [11, 85], [27, 81], [42, 79], [48, 99]], { mat: M.vest, z: 12, group: 'vestL', base: 4, bevel: 4 });
    P.poly([[74, 99], [78, 80], [86, 81], [94, 86], [99, 92], [99, 98]], { mat: M.vest, z: 12, group: 'vestR', base: 4, bevel: 4 });
    // bufanda de aviador crema
    P.ellipse(A.HX + 1, A.HY + 36, 15, 6, { mat: M.scarf, z: 23, group: 'scarf', base: 4, bevel: 3, cast: { on: ['torso'], dx: -1, dy: 2, k: 1 } });
    P.poly([[A.HX + 4, A.HY + 38], [A.HX + 15, A.HY + 39], [A.HX + 12, A.HY + 56], [A.HX + 6, A.HY + 55]], { mat: M.scarf, z: 23.5, group: 'scarf2', base: 3, bevel: 2 });
  },
};
/** Peinados (P, A, M, cfg) */
const PH_HAIR = {
  /** Casquete genérico con borde en dientes, anillo de brillo y mechones radiales */
  cap(P, A, M, cfg, o = {}) {
    const sm = P.S < 1;
    const tx = PHAIR.tex(M, { whorl: o.whorl || [52, 10], step: sm ? 0.32 : (o.step ?? 0.18), ringC: o.ringC || [57, 31], ringR: o.ringR || [24, 17], ring0: -2.75, ring1: -0.45, ringW: 0.06, streak: !sm, ringMin: o.ringMin });
    const mass = SDF.ellipse(o.mx ?? 58, o.my ?? 38, o.mrx ?? 30, o.mry ?? 30), win = SDF.ellipse(o.wx ?? 64, o.wy ?? 57, o.wrx ?? 25.5, o.wry ?? 24.5);
    const tip = o.teeth ?? 34, amp = o.amp ?? 6, per = o.per ?? 6.2;
    const teeth = (x, y) => { const k = (x - 46) / per, ph = k - Math.floor(k); return y - (tip - Math.abs(ph - 0.5) * amp + (x > 70 ? (x - 70) * (o.slope ?? 0.35) : 0)); };
    const cut = o.noTeeth ? win : SDF.inter(win, (x, y) => (x > 44 && x < 86 ? -teeth(x, y) : -1));
    let sdf = SDF.sub(mass, cut);
    if (o.extra) sdf = SDF.union(sdf, o.extra);
    P.custom(sdf, [20, 2, 96, 74], { mat: M.hair, z: o.z ?? 32, group: 'hair', base: o.base ?? 3, bevel: 8, shiny: true, hiT: 0.6, tex: tx, cast: { on: ['face', 'ear', 'neck'], dx: -1, dy: 3, k: 1 } });
    return tx;
  },
  /** Corto con raya al lado y flequillo barrido (Iván, Sr. Ledesma) */
  short(P, A, M, cfg) {
    const tx = PH_HAIR.cap(P, A, M, cfg, { mrx: 29, mry: 28, my: 38, teeth: 33, amp: 3, wrx: 25.5, wry: 24 });
    PHAIR.clumps(P, M, [
      [[50, 20], [60, 24], [72, 30], [79, 37], 6],
      [[46, 22], [50, 30], [49, 37], 4],
      [[58, 20], [68, 25], [76, 33], 4.5],
    ], { z: 40, group: 'bang', base: 3, tex: tx });
    PHAIR.clumps(P, M, [[[82, 30], [86, 40], [86, 50], 3.2], [[38, 36], [35, 48], [37, 58], 4]], { z: 31.5, group: 'side', base: 3, tex: tx, cast: false });
  },
  /** Corto de punta (Dante, bajo el casco) */
  spiky(P, A, M, cfg) {
    const tx = PH_HAIR.cap(P, A, M, cfg, { mrx: 29, mry: 28.5, my: 38, teeth: 35, amp: 7, per: 5.2, wrx: 25.5, wry: 24 });
    PHAIR.clumps(P, M, [
      [[54, 26], [57, 33], [56, 41], 4.2], [[62, 25], [67, 32], [70, 39], 4.4], [[71, 26], [77, 32], [81, 38], 3.6],
    ], { z: 40, group: 'bang', base: 3, tex: tx, taper: 1.2 });
    // patillas y mechones de la nuca en punta
    PHAIR.clumps(P, M, [
      [[36, 30], [28, 34], [22, 40], 5], [[35, 40], [27, 46], [22, 54], 4.6], [[38, 50], [32, 58], [29, 64], 4], [[40, 34], [38, 46], [39, 56], 3.4],
    ], { z: 31.5, group: 'side', base: 3, tex: tx, cast: false, taper: 1.1 });
  },
  /** Recogido en moño (Dra. Eliana con lápiz; Consejera Ruth) */
  bun(P, A, M, cfg) {
    const sm = P.S < 1;
    const tx = PH_HAIR.cap(P, A, M, cfg, { whorl: [34, 18], mrx: 29.5, mry: 29, teeth: 32, amp: 2.5, wrx: 25.5, wry: 24.5, step: 0.15 });
    const btx = PHAIR.tex(M, { whorl: [34, 18], step: sm ? 0.5 : 0.4, ringC: [33, 17], ringR: [8, 8], ring0: -2.6, ring1: -0.8, ringW: 0.1, streak: !sm });
    P.circle(cfg.bunX ?? 33, cfg.bunY ?? 17, cfg.bunR ?? 11.5, { mat: M.hair, z: 7, group: 'bun', base: 3, bevel: 6, shiny: true, tex: btx });
    // flequillo barrido hacia la derecha + mechón suelto en la sien
    PHAIR.clumps(P, M, [
      [[52, 18], [62, 24], [74, 31], [81, 39], 6.5],
      [[47, 22], [45, 31], [42, 40], 4],
    ], { z: 40, group: 'bang', base: 3, tex: tx });
    PHAIR.clumps(P, M, [[[83, 30], [87, 42], [86, 54], 3]], { z: 41, group: 'side', base: 3, tex: tx, castDy: 2 });
    if (cfg.pencil) {
      P.capsule(16, 2, 40, 26, 1.8, 1.8, { mat: M.pencil, z: 6, group: 'pencil', base: 4, bevel: 1 });
      P.stamp((pb, c) => { const X = c.X, Y = c.Y; pb.set(X(16), Y(2), '#ff6b6b'); pb.set(X(17), Y(3), '#ff6b6b'); if (c.S >= 1) { pb.set(X(18), Y(4), '#d8d0c8'); } }, 4);
    }
  },
  /** Calvo con mechones laterales (Don Cobre) */
  bald(P, A, M, cfg) {
    const sm = P.S < 1;
    const tx = PHAIR.tex(M, { whorl: [40, 30], step: sm ? 0.6 : 0.35, streak: false });
    PHAIR.clumps(P, M, [
      [[42, 32], [36, 38], [33, 48], [36, 58], 6], [[40, 30], [32, 32], [30, 40], 4.5], [[44, 54], [40, 60], [42, 64], 3.5],
    ], { z: 31.5, group: 'side', base: 4, tex: tx, cast: false, taper: 1 });
    PHAIR.clumps(P, M, [[[84, 34], [88, 42], [86, 50], 3.2]], { z: 41, group: 'sideF', base: 4, tex: tx, castDy: 2 });
  },
  /** Trenza gruesa sobre el hombro (Naira) */
  braidFront(P, A, M, cfg) {
    const tx = PH_HAIR.cap(P, A, M, cfg, { whorl: [60, 6], noTeeth: true, mrx: 29.5, mry: 29.5, wrx: 25, wry: 23.5, wy: 56 });
    // raya al medio: dos mechones gruesos que bajan a los lados de la frente
    PHAIR.clumps(P, M, [
      [[58, 24], [50, 30], [44, 40], [42, 50], 5.5], [[66, 24], [76, 30], [83, 40], [85, 52], 5],
    ], { z: 40, group: 'bang', base: 3, tex: tx, taper: 1.3 });
    const links = []; for (let i = 0; i < 9; i++) links.push([40 - i * 0.9 + Math.sin(i * 1.3) * 0.6, 60 + i * 4.6, 6 - i * 0.22]);
    links.forEach(([x, y, r], i) => P.ellipse(x + (i % 2 ? 1.3 : -1.3), y, r, r * 0.8, { mat: M.hair, z: 50 + i * 0.01, group: 'braid' + (i % 2), base: 3, bevel: r * 0.7, shiny: true, tex: tx }, i % 2 ? 0.5 : -0.5));
    const [tx2, ty2] = links[links.length - 1];
    P.ellipse(tx2, ty2 + 4.5, 3.4, 2.4, { mat: M.tie, z: 51, group: 'btie', base: 4, bevel: 1.5, shiny: true });
    P.strand([[tx2, ty2 + 6], [tx2 - 1, ty2 + 11]], 3, 0.6, { mat: M.hair, z: 50.5, group: 'btail', base: 3 });
  },
  /** Trenza a la espalda bajo el sombrero (Tía Marea) */
  braidBack(P, A, M, cfg) {
    const tx = PH_HAIR.cap(P, A, M, cfg, { whorl: [40, 30], noTeeth: true, mrx: 29.5, mry: 29.5, wrx: 25, wry: 23.5, wy: 56 });
    PHAIR.clumps(P, M, [[[60, 26], [52, 32], [46, 42], 5], [[68, 26], [78, 32], [84, 44], 4.6]], { z: 40, group: 'bang', base: 3, tex: tx });
    const links = []; for (let i = 0; i < 8; i++) links.push([30 - i * 1.4, 54 + i * 5.2, 5.4 - i * 0.2]);
    links.forEach(([x, y, r], i) => P.ellipse(x + (i % 2 ? 1.2 : -1.2), y, r, r * 0.8, { mat: M.hair, z: 15 + i * 0.01, group: 'braid' + (i % 2), base: 3, bevel: r * 0.7, shiny: true, tex: tx }, i % 2 ? 0.5 : -0.5));
    const [tx2, ty2] = links[links.length - 1];
    P.ellipse(tx2, ty2 + 4, 3, 2.2, { mat: M.tie, z: 16, group: 'btie', base: 4, bevel: 1.2 });
  },
  /** Melena larga con raya al lado (Doña Celia) */
  long(P, A, M, cfg) {
    const tx = PH_HAIR.cap(P, A, M, cfg, { whorl: [50, 8], mrx: 30.5, mry: 30, teeth: 33, amp: 3, wrx: 25.5, wry: 24.5 });
    PHAIR.clumps(P, M, [[[52, 19], [62, 24], [74, 31], [82, 40], 6.5], [[48, 22], [44, 32], [42, 42], 4.2]], { z: 40, group: 'bang', base: 3, tex: tx });
    // melena tras los hombros y mechón largo delante del hombro lejano
    PHAIR.clumps(P, M, [
      [[38, 40], [32, 58], [28, 76], [26, 96], 8.5], [[44, 52], [40, 68], [38, 84], [37, 98], 6.5], [[34, 30], [26, 46], [22, 64], [19, 84], 6],
    ], { z: 9, group: 'back', base: 3, tex: tx, cast: false, taper: 0.9 });
    PHAIR.clumps(P, M, [[[80, 30], [87, 44], [89, 62], [87, 82], 4.6]], { z: 45, group: 'side', base: 3, tex: tx, taper: 1, castDy: 2 });
  },
  /** Rizos con dos pompones (Alma, niña) */
  curly(P, A, M, cfg) {
    const coil = (x, y, i) => {
      const c = 5, row = Math.floor(y / c), ox = (row & 1) ? c / 2 : 0;
      const ccx = Math.floor((x + ox) / c) * c + c / 2 - ox, ccy = row * c + c / 2;
      const dx = x - ccx, dy = y - ccy, d = Math.hypot(dx, dy);
      if (d > c * 0.36 && d < c * 0.62 && dx + dy > 0.5) return Math.max(1, i - 1);
      if (d < c * 0.3 && dx + dy < -0.4 && i >= 3) return Math.min(M.hair.ramp.length - 1, i + 1);
      return i;
    };
    const sm = P.S < 1, hk = cfg.hk || 1, T = ([x, y, r]) => [60 + (x - 60) * hk, 42 + (y - 42) * hk + (cfg.hdy || 0), r * hk];
    const list = [[58, 22, 15], [44, 26, 13], [72, 24, 12], [36, 38, 12], [82, 34, 9], [50, 14, 11], [66, 13, 10], [38, 52, 9]].map(T);
    list.forEach(([x, y, r], i) => P.circle(x, y, r, { mat: M.hair, z: 32 + i * 0.01, group: 'curl' + (i % 3), base: 3, bevel: r * 0.6, shiny: true, tex: sm ? null : coil, cast: { on: ['face', 'ear', 'neck'], dx: -1, dy: 3, k: 1 } }));
    // pompones (coletas rizadas) a los lados
    const [pax, pay, par] = T([18, 30, 11]), [pbx, pby, pbr] = T([22, 50, 9]);
    P.circle(pax, pay, par, { mat: M.hair, z: 8, group: 'puffA', base: 3, bevel: 7, shiny: true, tex: sm ? null : coil });
    P.circle(pbx, pby, pbr, { mat: M.hair, z: 8.1, group: 'puffB', base: 3, bevel: 6, shiny: true, tex: sm ? null : coil });
    // flequillo de rizos pequeños
    [[50, 34, 4.5], [58, 33, 4.8], [66, 33, 4.5], [74, 35, 4]].map(T).forEach(([x, y, r], i) => P.circle(x, y, r, { mat: M.hair, z: 40 + i * 0.01, group: 'bang' + i, base: 3, bevel: r * 0.7, shiny: true, cast: { on: ['face'], dx: -1, dy: 2, k: 1 } }));
    const [tx0, ty0] = T([30, 36, 1]);
    P.ellipse(tx0, ty0, 3, 4, { mat: M.tie, z: 33, group: 'tie', base: 4, bevel: 1.5 });
  },
};
/** Sombreros y gorros (P, A, M, cfg) */
const PH_HAT = {
  straw(P, A, M, cfg) {
    const st = (x, y, i) => { const fx = Math.floor(x), fy = Math.floor(y); return (fy % 2 === 0 && (fx + (fy >> 1)) % 3 === 0) ? Math.max(1, i - 1) : ((fx * 2 + fy) % 7 === 0 ? Math.min(6, i + 1) : i); };
    const on = ['face', 'ear', 'hair', 'bang0', 'bang1', 'neck', 'braid0', 'braid1'];
    P.ellipse(57, 13, 21, 12.5, { mat: M.straw, z: 70, group: 'crown', base: 3, bevel: 6, tex: st });
    P.ellipse(58, 25, 47, 8.5, { mat: M.straw, z: 71, group: 'brim', base: 4, bevel: 4, tex: st, cast: { on, dx: -1, dy: 6, k: 1 } }, -0.05);
    P.box(57, 20.5, 20.5, 2.6, 1.2, { mat: M.band, z: 72, group: 'band', base: 4, bevel: 1.5 });
    P.stamp((pb, c) => {
      const X = c.X, Y = c.Y;
      if (c.S < 1) { pb.set(X(71), Y(19), '#ffe14d'); pb.set(X(72), Y(19), '#ff8e34'); pb.set(X(74), Y(20), '#4ccb70'); return; }
      const fx = X(71), fy = Y(18);
      pb.stampMap(fx - 3, fy - 3, ['..a.a..', '.aabaa.', 'aabcbaa', '.abbba.', 'aabcbaa', '.aabaa.', '..a.a..'], { a: '#ffe14d', b: '#fff08a', c: '#ff8e34' });
      pb.set(fx, fy, '#c8501a'); pb.set(fx - 1, fy - 1, '#ffbc6c');
      pb.stampMap(fx + 4, fy - 1, ['.gg..', 'gGGgg', '.ggg.'], { g: '#2e8a4e', G: '#86e36f' });
    }, 6);
  },
  hardhat(P, A, M, cfg) {
    const on = ['face', 'ear', 'hair', 'bang0', 'bang1', 'bang2', 'side0', 'side1', 'side2', 'side3'];
    const dome = SDF.sub(SDF.ellipse(57, 25, 30.5, 22), SDF.box(57, 44, 60, 14, 0));
    P.custom(dome, [24, 0, 92, 32], { mat: M.hat, z: 70, group: 'hat', base: 4, bevel: 9, shiny: true });
    P.add(SDF.box(62, 31.5, 33, 3, 1.5, -0.04), [26, 26, 100, 37], { mat: M.hat, z: 71, group: 'brim', base: 3, bevel: 2, cast: { on, dx: -1, dy: 5, k: 1 } });
    P.capsule(57, 4, 57, 29, 2.2, 2.4, { mat: M.hat, z: 70.5, group: 'ridge', base: 5, bevel: 1.5, shiny: true });
    P.stamp((pb, c) => {
      const X = c.X, Y = c.Y;
      if (c.S < 1) { pb.rect(X(70), Y(18), 3, 2, '#2a4caa'); pb.set(X(71), Y(18), '#9ac0ff'); return; }
      pb.rect(X(67), Y(15), 9, 7, '#13235a'); pb.rect(X(68), Y(16), 7, 5, '#2a4caa'); pb.rect(X(70), Y(17), 3, 3, '#6a90e4'); pb.set(X(71), Y(18), '#ffffff');
    }, 6);
  },
  bucket(P, A, M, cfg) {
    const on = ['face', 'ear', 'hair', 'bang0', 'bang1', 'neck'];
    P.ellipse(57, 17, 23.5, 14, { mat: M.hat, z: 70, group: 'crown', base: 4, bevel: 7 });
    P.custom(SDF.sub(SDF.ellipse(58, 29, 37, 9.5, -0.04), SDF.ellipse(57, 22, 23, 6)), [18, 16, 98, 42], { mat: M.hat, z: 71, group: 'brim', base: 3, bevel: 4, cast: { on, dx: -1, dy: 5, k: 1 } });
    P.box(57, 26, 23.5, 2.4, 1, { mat: M.band, z: 70.5, group: 'band', base: 3, bevel: 1 }, -0.03);
    P.stamp((pb, c) => { const X = c.X, Y = c.Y; if (c.S < 1) return; for (let k = 0; k < 4; k++) pb.set(X(40 + k * 9), Y(30 + (k & 1)), M.hat.ramp[2]); pb.stampMap(X(74), Y(22), ['.a.', 'aba', '.a.'], { a: '#ffe14d', b: '#fff6c0' }); }, 6);
  },
  aviator(P, A, M, cfg) {
    // gorro de cuero que envuelve el cráneo + orejera + gafas de cobre en la frente
    const cap = SDF.sub(SDF.ellipse(58, 36, 30.5, 30), SDF.ellipse(66, 57, 25, 23.5));
    P.custom(cap, [20, 2, 96, 72], { mat: M.hat, z: 70, group: 'hat', base: 4, bevel: 8, shiny: true, cast: { on: ['face', 'ear', 'neck', 'hair'], dx: -1, dy: 3, k: 1 } });
    P.ellipse(37, 54, 8, 11.5, { mat: M.hat, z: 71, group: 'flap', base: 3, bevel: 4 }, 0.15);
    P.capsule(40, 64, 56, 74, 1.8, 1.8, { mat: M.hat, z: 72, group: 'chin', base: 2, bevel: 1 });
    P.strand([[30, 30], [44, 23], [56, 21]], 2.4, 2.4, { mat: M.strap, z: 73, group: 'gstrap', base: 3, bevel: 1, shiny: false });
    P.ellipse(60, 22, 8, 7, { mat: M.frame, z: 74, group: 'g1', base: 4, bevel: 2.5, shiny: true, cast: { on: ['hat', 'face'], dx: -1, dy: 2, k: 1 } });
    P.ellipse(78, 23, 6, 6, { mat: M.frame, z: 74.5, group: 'g2', base: 3, bevel: 2, shiny: true });
    const ls = (cx, cy, rx, ry) => (x, y) => { const u = (x - cx) / rx, v = (y - cy) / ry; return u + v > 0.7 ? 2 : u + v > 0 ? 3 : 5; };
    P.ellipse(60.5, 22, 5.2, 4.6, { mat: M.lens, z: 75, group: 'l1', shade: ls(60.5, 22, 5.2, 4.6), line: false, rim: false });
    P.ellipse(78.5, 23, 3.6, 3.8, { mat: M.lens, z: 75.5, group: 'l2', shade: ls(78.5, 23, 3.6, 3.8), line: false, rim: false });
    P.post((pb, c) => { const X = c.X, Y = c.Y; pb.set(X(58), Y(20), '#fff4dc'); if (c.S >= 1) { pb.set(X(59), Y(20), '#fff4dc'); pb.set(X(58), Y(21), '#fff4dc'); pb.set(X(77), Y(21), '#fff4dc'); } });
    P.stamp((pb, c) => { const X = c.X, Y = c.Y; if (c.S < 1) return; for (let y = 40; y < 60; y += 4) pb.set(X(34), Y(y), M.hat.ramp[2]); for (const [x, y] of [[40, 30], [46, 26], [52, 24]]) pb.set(X(x), Y(y), M.hat.ramp[5]); }, 6);
  },
  cap(P, A, M, cfg) {
    const dome = SDF.sub(SDF.ellipse(57, 28, 29.5, 19), SDF.box(57, 45, 60, 14, 0));
    P.custom(dome, [24, 6, 90, 33], { mat: M.hat, z: 70, group: 'hat', base: 4, bevel: 8, shiny: true });
    P.add(SDF.ellipse(82, 31, 17, 4, 0.08), [62, 24, 100, 38], { mat: M.hat, z: 71, group: 'visor', base: 3, bevel: 2, cast: { on: ['face', 'ear', 'hair', 'bang0', 'bang1', 'bang2'], dx: -1, dy: 5, k: 1 } });
    P.stamp((pb, c) => { const X = c.X, Y = c.Y; pb.set(X(56), Y(9), M.hat.ramp[6] || M.hat.ramp[5]); if (c.S < 1) return; pb.line(X(56), Y(10), X(48), Y(30), M.hat.ramp[2]); pb.line(X(58), Y(10), X(70), Y(29), M.hat.ramp[2]); pb.rect(X(64), Y(19), 6, 4, '#ffe14d'); pb.rect(X(65), Y(20), 4, 2, '#e8873e'); }, 6);
  },
};
/** Rasgos faciales por expresión: pecas, arrugas, bigote, gafas, pendientes */
function phFaceExtras(pb, o, cfg) {
  const { X, Y, A, sm, isFace, enx, eny, efx, efy, def } = o;
  const sk = def.M.skin.rampU;
  const onFace = (x, y, c) => { if (isFace(x, y)) pb.set(x, y, c); };
  if (cfg.freckles) {
    const pts = sm ? [[-3, 4], [-1, 5], [9, 4]] : [[-6, 8], [-3, 10], [-1, 8], [1, 10], [-4, 12], [14, 8], [16, 10], [18, 8], [7, 9]];
    for (const [dx, dy] of pts) onFace(enx + dx, eny + dy, sk[3]);
  }
  if (cfg.wrinkles && !sm) {
    // patas de gallo, surcos nasogenianos y ojeras suaves
    for (const [dx, dy] of [[-8, -1], [-9, 0], [-8, 2], [-9, 3]]) onFace(enx + dx, eny + dy, sk[3]);
    for (const [dx, dy] of [[6, 1], [7, 2]]) onFace(efx + dx, efy + dy, sk[3]);
    const mx = X(A.mouth[0]), my = Y(A.mouth[1]);
    for (let k = 0; k < 6; k++) onFace(mx - 7 + (k >> 1), my - 5 + k, sk[3]);
    for (let k = 0; k < 4; k++) onFace(mx + 7, my - 3 + k, sk[3]);
    for (let k = -3; k <= 2; k++) onFace(enx + k, eny + 7, sk[3]);
  } else if (cfg.wrinkles) onFace(enx - 4, eny, sk[3]);
  if (cfg.mustache) {
    const mx = X(A.mouth[0]), my = Y(A.mouth[1]), c1 = cfg.mustache, c2 = shade(cfg.mustache, -0.25), c3 = shade(cfg.mustache, 0.15);
    if (sm) { pb.hline(mx - 3, mx + 2, my - 1, c1); pb.set(mx - 3, my, c2); pb.set(mx + 2, my, c2); }
    else pb.stampMap(mx - 8, my - 5, ['....ddddd.....', '..dcccccccd...', '.dccccccccccd.', 'dccbbbbbbbccd.', 'dcb......bccd.', '.d........bd..'], { b: c2, c: c1, d: c2, e: c3 });
    if (!sm) for (const [dx, dy] of [[-3, -4], [0, -4], [3, -4]]) pb.set(mx + dx, my + dy, c3);
  }
  if (cfg.beard) {
    // barba de pocos días: tono sólido mezclado sobre mandíbula y mentón (sin tramado)
    const bU = U(cfg.beard), jaw = A.face, S2 = o.S;
    for (let y = 0; y < pb.h; y++) for (let x = 0; x < pb.w; x++) {
      if (!isFace(x, y)) continue;
      const wx = (x + 0.5) / S2 + 0, wy = (y + 0.5) / S2 + (sm ? 2 : 0);
      if (wy < A.mouth[1] - 3 || jaw(wx, wy) < -5.5 - (wy > A.mouth[1] + 4 ? 3 : 0)) continue;
      if (Math.abs(wx - A.mouth[0]) < 5 && Math.abs(wy - A.mouth[1] - 0.5) < 2.5) continue;
      const i = y * pb.w + x; pb.data[i] = pkMixU(pb.data[i], bU, 0.32);
    }
  }
  if (cfg.glasses) {
    const g = cfg.glasses, hi = cfg.glassHi || shade(g, 0.45);
    if (sm) {
      for (const [cx, cy, w] of [[enx, eny, 4], [efx, efy, 3]]) { pb.hline(cx - w + 1, cx + w - 1, cy - 3, g); pb.hline(cx - w + 1, cx + w - 1, cy + 3, g); pb.vline(cx - w, cy - 2, cy + 2, g); pb.vline(cx + w, cy - 2, cy + 2, g); }
      pb.hline(enx + 5, efx - 4, eny - 1, g);
    } else if (cfg.roundGlasses) {
      for (const [cx, cy, r] of [[enx, eny, 8], [efx + 0.5, efy, 6.5]]) {
        for (let a = 0; a < 64; a++) { const an = a / 64 * TAU; const x = Math.round(cx + Math.cos(an) * r), y = Math.round(cy + 0.5 + Math.sin(an) * (r + 0.5)); pb.set(x, y, a > 36 && a < 52 ? hi : g); }
        pb.set(Math.round(cx + r * 0.5), Math.round(cy - r * 0.5), '#ffffff');
      }
      pb.hline(enx + 8, Math.round(efx - 6), eny - 2, g); pb.line(enx - 8, eny - 1, enx - 18, eny - 3, g);
    } else {
      for (const [cx, cy, w] of [[enx, eny, 8], [efx, efy, 6]]) {
        pb.hline(cx - w + 1, cx + w - 1, cy - 6, g); pb.hline(cx - w + 1, cx + w - 1, cy + 6, g); pb.vline(cx - w, cy - 5, cy + 5, g); pb.vline(cx + w, cy - 5, cy + 5, g);
        pb.hline(cx - w + 2, cx - w + 4, cy - 5, hi); pb.set(cx + w - 2, cy - 4, '#ffffff');
      }
      pb.hline(enx + 9, efx - 7, eny - 3, g); pb.line(enx - 8, eny - 3, enx - 18, eny - 5, g);
    }
  }
  if (cfg.earring) {
    const ex = X(A.ear[0]), ey = Y(A.ear[1] + 7);
    if (sm) pb.set(ex, ey, cfg.earring);
    else if (cfg.earringLeaf) pb.stampMap(ex - 1, ey, ['.a', 'ab', 'bc', '.c'], { a: '#86e36f', b: '#4ccb70', c: '#1f854c' });
    else { pb.rect(ex - 1, ey, 2, 2, cfg.earring); pb.set(ex - 1, ey, '#fff6c0'); }
  }
}
/** Fábrica: cfg → definición de retrato humano */
function phMake(cfg) {
  return () => {
    const mats = cfg.mats();
    const M = {};
    for (const [k, v] of Object.entries(mats)) M[k] = Array.isArray(v) ? phMat(v) : v;
    if (!M.skin.outlineU) M.skin = phMat(M.skin.ramp);
    const spr = CHARS[cfg.sprite] && CHARS[cfg.sprite].D ? CHARS[cfg.sprite].D.face : null;
    const iris = phIris(cfg.iris || (spr && spr.iris) || ['#1a0a06', '#3a2010', '#6a4422']);
    const sk = M.skin.ramp;
    return {
      M, iris, head: cfg.head, face: cfg.face, neck: cfg.neck, dx: cfg.dx, dy: cfg.dy, shadeK: cfg.shadeK,
      lash: cfg.lash || shade(sk[0], -0.3), lashSoft: cfg.lashSoft || sk[1], brow: cfg.brow || M.hair.ramp[1], browDY: cfg.browDY, browOverHair: cfg.browOverHair,
      mouthInk: cfg.mouthInk || shade(sk[1], -0.15), mouthIn: cfg.mouthIn || '#6a1e1a', tongue: '#d8606a', blush: cfg.blush || mixHex(sk[4], '#ff5a6a', cfg.male ? 0.3 : 0.55), blushAlways: cfg.blushAlways || 0,
      rimColor: cfg.rimColor || '#ffc89a', rimK: cfg.rimK ?? 0.16, white: cfg.white,
      eyeOpt: { male: !!cfg.male, lidDrop: (cfg.male ? 1 : 0) + (cfg.elder ? 1 : 0) }, browThick: cfg.male ? 3 : 2,
      build(P, A) { if (cfg.back) cfg.back(P, A, M, cfg); (PH_OUTFIT[cfg.outfit] || PH_OUTFIT.tee)(P, A, M, cfg); },
      hair(P, A) { if (cfg.hair) (PH_HAIR[cfg.hair])(P, A, M, cfg); },
      acc(P, A) { if (cfg.hat) PH_HAT[cfg.hat](P, A, M, cfg); if (cfg.acc) cfg.acc(P, A, M, cfg); },
      faceExtra(pb, o) { phFaceExtras(pb, o, cfg); },
    };
  };
}

/* ---------- Naira Valdés — agroecóloga ---------- */
PDEFS.naira = phMake({
  sprite: 'naira', outfit: 'vest', hair: 'braidFront', hat: 'straw', earring: '#4ccb70', earringLeaf: true, iris: ['#2a1a30', '#4a3060', '#7a5a9a'],
  mats: () => ({ skin: PK.mat(RAMP.skinN, '#1a0a08', RAMP.skinN[2]), hair: PK.mat(RAMP.hairN.concat(['#7472b0']), '#06050e', RAMP.hairN[1]), top: MAT.nairaShirt, vest: PK.mat(MAT.nairaVest, '#240a06'), strap: MAT.leather, straw: PK.mat(MAT.straw, '#2a1606'), band: MAT.nairaVest, tie: RAMP.yellow }),
  lash: '#0a0608', brow: '#15132a', mouthInk: '#3a140e', blush: '#c0604a', head: { chinY: 33.5 },
});
/* ---------- Dante Vela — mantenimiento eólico ---------- */
PDEFS.dante = phMake({
  sprite: 'dante', male: true, outfit: 'overalls', hair: 'spiky', hat: 'hardhat', freckles: true, iris: ['#0e2a16', '#2a6a3a', '#6aa86a'],
  mats: () => ({ skin: PK.mat(RAMP.skinD, '#3a160e', RAMP.skinD[2]), hair: PK.mat(RAMP.hairD, '#1c0604', RAMP.hairD[1]), top: MAT.tshirtW, over: PK.mat(MAT.danteOver, '#060a1c'), scarf: MAT.bandana, hat: PK.mat(MAT.hardhat, '#2a1a04') }),
  lash: '#1a0806', brow: '#6e2614', browDY: -1, head: { jawW: 2.5, cheek: 1.2, chinY: 33.5, chinX: 5 }, neck: { w: 9.5 }, browOverHair: true,
});
/* ---------- Dra. Eliana Rojas — mentora ---------- */
PDEFS.eliana = phMake({
  sprite: 'eliana', outfit: 'labcoat', hair: 'bun', pencil: true, glasses: '#8a5e14', glassHi: '#ffd84a', roundGlasses: true, wrinkles: true, iris: ['#1a0e06', '#4a3020', '#8a6a4a'],
  mats: () => ({ skin: PK.mat(RAMP.skinE, '#1e100a', RAMP.skinE[2]), hair: PK.mat(RAMP.hairE.concat(['#ffffff']), '#1a1c30', RAMP.hairE[1]), top: MAT.violetTop,
    coat: PK.mat(['#2e3c5a', '#56688e', '#8aa0c4', '#bccce4', '#e2ecf8', '#f6faff', '#ffffff'], '#141c30', '#56688e'), pencil: RAMP.yellow }),
  lash: '#1a0e0a', brow: '#5c5e80', head: { jawDrop: 1.5, rx: 26, chinY: 34 }, face: { mouthY: 23 },
});
/* ---------- Tía Marea — pescadora mayor ---------- */
PDEFS.marea = phMake({
  sprite: 'marea', elder: true, outfit: 'raincoat', hair: 'braidBack', hat: 'bucket', wrinkles: true,
  mats: () => ({ skin: PK.mat(RAMP.skinM, '#1e0e0a', RAMP.skinM[2]), hair: PK.mat(RAMP.hairE.concat(['#ffffff']), '#1a1c30', RAMP.hairE[1]), top: MAT.danteOver, coat: PK.mat(RAMP_CH.rain, '#2a1e04'), hat: PK.mat(MAT.kiruBody, '#04201e'), band: RAMP_CH.teal, tie: RAMP.coral }),
  lash: '#140806', brow: '#8284a6', head: { jawDrop: 1 }, blushAlways: 0.3,
});
/* ---------- Don Cobre — artesano ---------- */
PDEFS.cobre = phMake({
  sprite: 'cobre', male: true, elder: true, outfit: 'apron', hair: 'bald', mustache: '#d8dae8', glasses: '#c8861a', glassHi: '#ffd84a', wrinkles: true,
  mats: () => ({ skin: PK.mat(RAMP.skinE, '#1e100a', RAMP.skinE[2]), hair: PK.mat(['#2a2c40', '#5c5e80', '#8284a6', '#b0b2cc', '#d8dae8', '#f2f2fa', '#ffffff'], '#1a1c30', '#5c5e80'), top: MAT.tshirtW, apron: RAMP.copper }),
  lash: '#1a0e0a', brow: '#d8dae8', browDY: -1, head: { jawW: 3, cheek: 2, chinY: 33, rx: 27.5 }, neck: { w: 10 },
  acc(P) { /* brillo de la calva */ P.stamp((pb, c) => { const X = c.X, Y = c.Y; for (const [x, y] of c.S < 1 ? [[64, 20]] : [[62, 19], [63, 19], [64, 19], [61, 20], [62, 20], [66, 21]]) if (c.group(X(x), Y(y)) === 'face') pb.set(X(x), Y(y), RAMP.skinE[6]); }, 5); },
});
/* ---------- Alma Semilla — niña ---------- */
PDEFS.alma = phMake({
  sprite: 'alma', outfit: 'tee', torso: 'child', hair: 'curly', blushAlways: 0.8, iris: ['#0e2a16', '#2a6a3a', '#7ab86a'],
  mats: () => ({ skin: PK.mat(RAMP.skinA, '#1e0c0a', RAMP.skinA[2]), hair: PK.mat(RAMP.hairA, '#08040a', RAMP.hairA[1]), top: MAT.nairaShirt, tie: RAMP.coral }),
  lash: '#140606', brow: '#321c3a', dy: 7, hdy: 7, hk: 0.9, head: { rx: 23.5, ry: 24.5, chinY: 26, chinX: 3, soft: 6 }, face: { eyeY: 7, eyeNX: -6, eyeFX: 15, mouthY: 18.5, noseY: 12.5, noseX: 6.5, mouthX: 3.5, earX: -21.5, earY: 9 }, neck: { w: 5.5 }, blush: '#ff8a7a',
  acc(P) {
    P.stamp((pb, c) => {
      const X = c.X, Y = c.Y;
      for (const [x, y, col] of [[45, 18, '#f78acb'], [60, 14, '#ffe14d'], [73, 19, '#56e5ff'], [38, 31, '#86e36f']]) {
        if (c.S < 1) { pb.set(X(x), Y(y), col); continue; }
        pb.stampMap(X(x) - 2, Y(y) - 2, ['.a.', 'aba', '.a.'], { a: col, b: '#fff6dc' });
      }
    }, 6);
  },
});
/* ---------- Capitán Nimbo — piloto de dirigible ---------- */
PDEFS.nimbo = phMake({
  sprite: 'nimbo', male: true, elder: true, outfit: 'aviator', hair: null, hat: 'aviator', mustache: '#b8bad2', wrinkles: true,
  mats: () => ({ skin: PK.mat(RAMP.skinD, '#3a160e', RAMP.skinD[2]), hair: PK.mat(RAMP.hairE, '#1a1c30', RAMP.hairE[1]), top: NPC_CLOTH[5], vest: RAMP.coral, scarf: RAMP_CH.cream,
    hat: PK.mat(MAT.leather, '#1a0a06'), strap: MAT.leather, frame: RAMP.copper, lens: PK.mat(['#06202e', '#0c3e5c', '#16608a', '#1f86b8', '#2aa9e3', '#7fd8f6', '#e6fdff'], '#06202e') }),
  lash: '#1a0806', brow: '#a8aac6', browDY: -1, head: { jawW: 1, jawDrop: 1.5 },
});
/* ---------- Consejera Ruth ---------- */
PDEFS.consejal = phMake({
  sprite: 'consejal', outfit: 'jacket', hair: 'bun', bunX: 31, bunY: 20, bunR: 11, glasses: '#8a5e14', glassHi: '#ffd84a', roundGlasses: true, earring: '#ffd84a', brooch: '#ffd84a',
  mats: () => ({ skin: PK.mat(RAMP.skinN, '#1a0a08', RAMP.skinN[2]), hair: PK.mat(RAMP.hairN.concat(['#7472b0']), '#06050e', RAMP.hairN[1]), top: NPC_CLOTH[0], jacket: RAMP_CH.plum }),
  lash: '#0a0608', brow: '#15132a', mouthIn: '#5a1418', blush: '#c0604a',
});
/* ---------- Operador Iván ---------- */
PDEFS.operador = phMake({
  sprite: 'operador', male: true, outfit: 'hivis', hair: 'short', hat: 'cap',
  mats: () => ({ skin: PK.mat(RAMP.skinM, '#1e0e0a', RAMP.skinM[2]), hair: PK.mat(RAMP_CH.blackHair.concat(['#7a7a94']), '#04040a', RAMP_CH.blackHair[1]), top: NPC_CLOTH[6], vest: RAMP_CH.hivisO, hat: NPC_CLOTH[1].concat(['#b0e4f4']) }),
  lash: '#0c0606', brow: '#101018', head: { jawW: 1.5, cheek: 0.6 }, neck: { w: 8.5 }, beard: '#3a2a26',
  acc(P) { P.ellipse(34, 52, 3, 4, { mat: RAMP_CH.charcoal, z: 34, group: 'earpiece', base: 3, bevel: 1.2 }); P.capsule(35, 56, 46, 64, 0.9, 0.9, { mat: RAMP_CH.charcoal, z: 34.5, group: 'mic', base: 4, bevel: 0.5 }); },
});
/* ---------- Doña Celia — pastora ---------- */
PDEFS.pastora = phMake({
  sprite: 'pastora', elder: true, outfit: 'poncho', hair: 'long', wrinkles: true, stripe: '#ffe14d', stripe2: '#f4a050', blushAlways: 0.35,
  mats: () => ({ skin: PK.mat(RAMP.skinA, '#1e0c0a', RAMP.skinA[2]), hair: PK.mat(RAMP.hairE.concat(['#ffffff']), '#1a1c30', RAMP.hairE[1]), top: NPC_CLOTH[7], poncho: RAMP_CH.terracotta }),
  lash: '#140606', brow: '#8284a6', head: { jawDrop: 0.5 },
});
/* ---------- Sr. Ledesma — financiero ---------- */
PDEFS.financia = phMake({
  sprite: 'financia', male: true, outfit: 'jacket', tie: true, hair: 'short', glasses: '#263442', glassHi: '#7a8aa0',
  mats: () => ({ skin: PK.mat(RAMP.skinE, '#1e100a', RAMP.skinE[2]), hair: PK.mat(RAMP.hairN.concat(['#7472b0']), '#06050e', RAMP.hairN[1]), top: MAT.tshirtW, jacket: RAMP_CH.charcoal, tie: NPC_CLOTH[5] }),
  lash: '#0e0806', brow: '#211e40', head: { jawDrop: 2.5, rx: 25.5, chinY: 34.5 }, face: { mouthY: 23.5 },
});
