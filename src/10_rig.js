/* =====================================================================
   10_rig.js — Rig de personajes por SDF rasterizado a píxel.
   Cada parte es un campo de distancia con bisel → normal → luz en
   bandas discretas de una rampa (sin antialiasing).

   Dos modos de render:
   · v1 (por defecto, lo usan los retratos antiguos): luz LIGHT, líneas
     internas, sellos y contorno darkOf.
   · v2 (personajes del rediseño, STYLE LOCK §10): material por parte
     (rampa a mano + contorno V≤0,15 + línea interior), luz clave desde
     arriba-delante (LIGHT_CHAR), bisel reducido, sombras proyectadas,
     limpieza de islas de banda, luz de borde 1 px por ambiente y
     contorno por material (PixelBuffer.outlineByPart).
   ===================================================================== */

const LIGHT = (() => { const l = [-0.55, -0.7, 0.62]; const n = Math.hypot(...l); return l.map(v => v / n); })();
/** Luz clave de personajes (miran a la derecha; al reflejar el sprite la luz sigue la cara) */
const LIGHT_CHAR = (() => { const l = [0.5, -0.8, 0.45]; const n = Math.hypot(...l); return l.map(v => v / n); })();
/** Color de la luz de borde según ambiente (opts.env o SpriteCache.env) */
const RIM_ENV = { coast: '#9fe8ff', day: '#9fe8ff', dawn: '#ffb38a', dusk: '#ffb38a', calima: '#ffa060', storm: '#ffa060', night: '#5a7ac8', tech: '#7fd8ff', cave: '#7fd8ff', none: null };

/* ---------- Materiales (rampa a mano + contorno + línea interior) ---------- */
function _hsv(hex) {
  const [r, g, b] = hexToRgb(hex).map(v => v / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) { h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
  return [h, mx ? d / mx : 0, mx];
}
function _hsvHex(h, s, v) {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}
/** Contorno de un material: mismo tono que su sombra más oscura, V ≤ vMax, saturación 0,5–0,85 */
function outlineOf(hex, vMax = 0.13) {
  const [h, s, v] = _hsv(hex);
  return _hsvHex(h, s < 0.12 ? s : clamp(s * 1.1, 0.5, 0.85), Math.min(v, vMax));
}
/** Material: { ramp (6–8 tonos), outline (hex), line (línea interior), rim (bool), spec (bool) } */
function Mat(o) {
  const ramp = o.ramp;
  const m = { ramp, outline: o.outline || outlineOf(ramp[0]), line: o.line || ramp[o.lineIdx ?? 0], rim: o.rim !== false, spec: !!o.spec, name: o.name || '' };
  m.outlineU = U(m.outline); m.rampU = ramp.map(c => U(c));
  return m;
}
const _matCache = new Map();
/** Material por defecto de una rampa (cacheado por identidad del array) */
function matOf(ramp) { let m = _matCache.get(ramp); if (!m) { m = Mat({ ramp }); _matCache.set(ramp, m); } return m; }
const asMat = (x) => (!x ? null : Array.isArray(x) ? matOf(x) : x);

/* ---------- SDF básicos ---------- */
const SDF = {
  circle: (cx, cy, r) => (x, y) => { const dx = x - cx, dy = y - cy; return Math.sqrt(dx * dx + dy * dy) - r; },
  ellipse: (cx, cy, rx, ry, rot = 0) => {
    const c = Math.cos(-rot), s = Math.sin(-rot);
    return (x, y) => {
      const dx = x - cx, dy = y - cy;
      const lx = dx * c - dy * s, ly = dx * s + dy * c;
      const ux = lx / rx, uy = ly / ry, k = Math.sqrt(ux * ux + uy * uy);
      return (k - 1) * Math.min(rx, ry);
    };
  },
  capsule: (ax, ay, bx, by, ra, rb = ra) => {
    const vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy || 1e-6;
    return (x, y) => {
      const t = clamp(((x - ax) * vx + (y - ay) * vy) / L2, 0, 1);
      const cx = ax + vx * t, cy = ay + vy * t;
      const dx = x - cx, dy = y - cy;
      return Math.sqrt(dx * dx + dy * dy) - (ra + (rb - ra) * t);
    };
  },
  box: (cx, cy, hw, hh, r = 0, rot = 0) => {
    const c = Math.cos(-rot), s = Math.sin(-rot);
    return (x, y) => {
      const dx = x - cx, dy = y - cy;
      const lx = Math.abs(dx * c - dy * s) - (hw - r), ly = Math.abs(dx * s + dy * c) - (hh - r);
      const mx = lx > 0 ? lx : 0, my = ly > 0 ? ly : 0;
      return Math.sqrt(mx * mx + my * my) + Math.min(Math.max(lx, ly), 0) - r;
    };
  },
  poly: (pts) => { const n = pts.length, P = new Float64Array(n * 2); pts.forEach(([px, py], i) => { P[i * 2] = px; P[i * 2 + 1] = py; }); return (x, y) => {
    let d = Infinity, inside = false;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const ax = P[j * 2], ay = P[j * 2 + 1], bx = P[i * 2], by = P[i * 2 + 1];
      const vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy || 1e-6;
      let t = ((x - ax) * vx + (y - ay) * vy) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const ex = x - ax - vx * t, ey = y - ay - vy * t, dd = ex * ex + ey * ey;
      if (dd < d) d = dd;
      if ((ay > y) !== (by > y) && x < ax + (y - ay) / (by - ay) * vx) inside = !inside;
    }
    d = Math.sqrt(d);
    return inside ? -d : d;
  }; },
  /** Mechón afilado: cadena de cápsulas con radio por vértice (unión en un solo campo) */
  strand: (pts, radii) => {
    const n = pts.length - 1;
    return (x, y) => {
      let d = Infinity;
      for (let i = 0; i < n; i++) {
        const ax = pts[i][0], ay = pts[i][1], vx = pts[i + 1][0] - ax, vy = pts[i + 1][1] - ay, L2 = vx * vx + vy * vy || 1e-6;
        let t = ((x - ax) * vx + (y - ay) * vy) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const ex = x - ax - vx * t, ey = y - ay - vy * t;
        const dd = Math.sqrt(ex * ex + ey * ey) - (radii[i] + (radii[i + 1] - radii[i]) * t);
        if (dd < d) d = dd;
      }
      return d;
    };
  },
  union: (...fs) => (x, y) => { let d = Infinity; for (const f of fs) d = Math.min(d, f(x, y)); return d; },
  smoothUnion: (k, ...fs) => (x, y) => {
    let d = fs[0](x, y);
    for (let i = 1; i < fs.length; i++) { const d2 = fs[i](x, y); const h = clamp(0.5 + 0.5 * (d2 - d) / k, 0, 1); d = lerp(d2, d, h) - k * h * (1 - h); }
    return d;
  },
  sub: (a, b) => (x, y) => Math.max(a(x, y), -b(x, y)),
  inter: (a, b) => (x, y) => Math.max(a(x, y), b(x, y)),
};
function polyBBox(pts, pad = 1) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return [x0 - pad, y0 - pad, x1 + pad, y1 + pad];
}

/** Fachada de PixelBuffer que escala coordenadas (re-rasterizar personajes ×s sin reescalar píxeles) */
function scaledPB(pb, s) {
  const r = (v) => Math.round(v * s);
  return {
    w: pb.w / s, h: pb.h / s, base: pb,
    set: (x, y, c) => pb.set(r(x), r(y), c), get: (x, y) => pb.get(r(x), r(y)), alpha: (x, y) => pb.alpha(r(x), r(y)),
    rect: (x, y, w, h, c) => pb.rect(r(x), r(y), Math.max(1, r(w)), Math.max(1, r(h)), c),
    hline: (x0, x1, y, c) => pb.hline(r(x0), r(x1), r(y), c), vline: (x, y0, y1, c) => pb.vline(r(x), r(y0), r(y1), c),
    line: (x0, y0, x1, y1, c) => pb.line(r(x0), r(y0), r(x1), r(y1), c),
    ellipse: (cx, cy, rx, ry, c) => pb.ellipse(cx * s, cy * s, rx * s, ry * s, c), disc: (cx, cy, rr, c) => pb.disc(cx * s, cy * s, rr * s, c),
    stampMap: (x, y, rows, pal, f) => pb.stampMap(r(x), r(y), rows, pal, f),
  };
}

/* ---------- Constructor de figuras ---------- */
class Rig {
  /** o.v2 → pipeline de materiales del rediseño */
  constructor(w, h, o = {}) { this.w = w; this.h = h; this.parts = []; this.stamps = []; this.anchors = {}; this.zc = 0; this.v2 = !!o.v2; this.S = 1; this.bk = this.v2 ? 0.55 : 1; }
  /** opts: mat|ramp, base(índice), bevel, z, group, shiny, flatten, dark, flat, tilt, ao, texture, lineIdx, lineCol, noLine, noLineOver, cast, rim */
  add(sdf, bbox, opts) {
    const p = Object.assign({ sdf, bbox, z: this.zc++, bevel: 3, base: 3, group: 'g' + this.parts.length, shiny: false, flatten: 1, dark: 0 }, opts);
    if (Array.isArray(p.mat)) p.mat = matOf(p.mat);
    if (p.mat && !p.ramp) p.ramp = p.mat.ramp;
    if (!p.mat && p.ramp) p.mat = matOf(p.ramp);
    if (this.S !== 1) {
      const s = this.S, f = p.sdf;
      p.sdf = (x, y) => f(x / s, y / s) * s;
      p.bbox = p.bbox.map(v => v * s); p.bevel *= s;
      if (p.cast) p.cast = Object.assign({}, p.cast, { dx: Math.round((p.cast.dx || 0) * s), dy: Math.round((p.cast.dy ?? 2) * s) });
    }
    this.parts.push(p); return this;
  }
  ellipse(cx, cy, rx, ry, opts, rot = 0) { const m = Math.max(rx, ry) + 1; return this.add(SDF.ellipse(cx, cy, rx, ry, rot), [cx - m, cy - m, cx + m, cy + m], Object.assign({ bevel: Math.min(rx, ry) * this.bk }, opts)); }
  circle(cx, cy, r, opts) { return this.add(SDF.circle(cx, cy, r), [cx - r - 1, cy - r - 1, cx + r + 1, cy + r + 1], Object.assign({ bevel: r * this.bk }, opts)); }
  capsule(ax, ay, bx, by, ra, rb, opts) {
    const m = Math.max(ra, rb) + 1;
    return this.add(SDF.capsule(ax, ay, bx, by, ra, rb), [Math.min(ax, bx) - m, Math.min(ay, by) - m, Math.max(ax, bx) + m, Math.max(ay, by) + m], Object.assign({ bevel: Math.max(ra, rb) * this.bk }, opts));
  }
  box(cx, cy, hw, hh, r, opts, rot = 0) { const m = Math.hypot(hw, hh) + 1; return this.add(SDF.box(cx, cy, hw, hh, r, rot), [cx - m, cy - m, cx + m, cy + m], opts); }
  poly(pts, opts) { return this.add(SDF.poly(pts), polyBBox(pts), opts); }
  custom(sdf, bbox, opts) { return this.add(sdf, bbox, opts); }
  /**
   * Mechón afilado (pelo, colas, aletas): pts = [[x,y],…]; radio r0 en la raíz → r1 en la punta
   * (r1 ≈ 0,35 da punta de 1 px). Un solo grupo/parte: sin costuras internas.
   */
  strand(pts, r0, r1, opts = {}) {
    let tot = 0; const acc = [0];
    for (let i = 1; i < pts.length; i++) { tot += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); acc.push(tot); }
    const radii = acc.map(a => lerp(r0, r1, tot ? Math.pow(a / tot, opts.taper || 1) : 0));
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    pts.forEach(([x, y], i) => { const r = radii[i] + 1; x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - r); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + r); });
    return this.add(SDF.strand(pts, radii), [x0, y0, x1, y1], Object.assign({ bevel: Math.max(0.8, r0 * 0.7), shiny: true }, opts));
  }
  /** Re-rasteriza todo ×s (SDF, cajas, bisel y sellos con fachada escalada) */
  scaled(s) { this.S = s; return this; }
  /** Sello: función(pb, anchors) ejecutada tras sombrear (detalles a mano) */
  stamp(fn, z = 1e9, post = false) { const s = this.S; this.stamps.push({ fn: s !== 1 ? (pb, a) => fn(scaledPB(pb, s), a) : fn, z, post }); return this; }
  /** Sello posterior al contorno (chispas, brillos emisivos sin contorno) */
  glow(fn, z = 1e9) { return this.stamp(fn, z, true); }

  render(opt = {}) {
    if (opt.v2 ?? this.v2) return this.renderV2(opt);
    const W2 = this.w, H2 = this.h;
    const pb = new PixelBuffer(W2, H2);
    const zb = new Int32Array(W2 * H2).fill(-1);
    const parts = this.parts.slice().sort((a, b) => a.z - b.z);
    const casters = parts.some(p => p.cast);
    const ib = casters ? new Int8Array(W2 * H2) : null;
    const L = opt.light || LIGHT;
    parts.forEach((p, pi) => {
      const ramp = p.ramp;
      const n = ramp.length;
      const x0 = Math.max(0, Math.floor(p.bbox[0])), y0 = Math.max(0, Math.floor(p.bbox[1]));
      const x1 = Math.min(W2 - 1, Math.ceil(p.bbox[2])), y1 = Math.min(H2 - 1, Math.ceil(p.bbox[3]));
      const f = p.sdf, bev = Math.max(0.6, p.bevel);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const sx = x + 0.5, sy = y + 0.5;
        const d = f(sx, sy);
        if (d > 0) continue;
        let col, idx = p.base;
        if (p.flat) col = ramp[clamp(p.base, 0, n - 1)];
        else {
          const gx = f(sx + 0.5, sy) - f(sx - 0.5, sy), gy = f(sx, sy + 0.5) - f(sx, sy - 0.5);
          const gl = Math.hypot(gx, gy) || 1;
          const k = clamp(-d / bev, 0, 1);
          let nx = gx / gl * (1 - k), ny = gy / gl * (1 - k), nz = k * p.flatten + (1 - p.flatten) * 0.9;
          const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
          let dd = nx * L[0] + ny * L[1] + nz * L[2];
          if (p.tilt) dd += p.tilt;
          if (dd < -0.2) idx -= 2; else if (dd < 0.36) idx -= 1; else if (dd > 0.94 && p.shiny) idx += 2; else if (dd > 0.74) idx += 1;
          if (p.ao) { const ao = p.ao(sx, sy); idx -= ao; }
          idx -= p.dark;
          col = ramp[clamp(idx, 1, n - 1)];
          if (p.texture) col = p.texture(x, y, idx, ramp, col, d) || col;
        }
        pb.data[y * W2 + x] = U(col);
        zb[y * W2 + x] = pi;
        if (ib) ib[y * W2 + x] = p.flat ? p.base : clamp(idx, 1, n - 1);
      }
    });
    if (casters) {
      const out0 = new Uint32Array(pb.data);
      parts.forEach((C, ci) => {
        if (!C.cast) return;
        const { on, dx = 0, dy = 2, k = 1 } = C.cast;
        for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
          const i = y * W2 + x, ti = zb[i];
          if (ti < 0 || ti >= ci) continue;
          const T = parts[ti];
          if (!on.includes(T.group) || T.flat) continue;
          const sx = x - dx, sy = y - dy;
          if (sx < 0 || sy < 0 || sx >= W2 || sy >= H2) continue;
          if (zb[sy * W2 + sx] !== ci) continue;
          out0[i] = U(T.ramp[clamp(ib[i] - k, 1, T.ramp.length - 1)]);
        }
      });
      pb.data.set(out0);
    }
    const out = new Uint32Array(pb.data);
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
      const i = y * W2 + x, pi = zb[i];
      if (pi < 0) continue;
      const P = parts[pi];
      if (P.noLine) continue;
      const nb = [x > 0 ? zb[i - 1] : -1, x < W2 - 1 ? zb[i + 1] : -1, y > 0 ? zb[i - W2] : -1, y < H2 - 1 ? zb[i + W2] : -1];
      for (const q of nb) {
        if (q > pi && parts[q].group !== P.group && !parts[q].noLineOver) {
          out[i] = U(P.lineCol || P.ramp[P.lineIdx ?? 0]);
          break;
        }
      }
    }
    pb.data.set(out);
    this.zbuf = zb; this.zparts = parts;
    this.stamps.sort((a, b) => a.z - b.z).forEach(s => s.fn(pb, this.anchors));
    if (opt.outline !== false) {
      const oc = opt.outlineColor;
      pb.outline(oc ? oc : (nb) => darkOf(nb, -0.62));
    }
    return pb;
  }

  /** Pipeline v2 (STYLE LOCK §6–§7, §10). opt: light, env, rim(k), outline(false), outlineColor (fallback de sellos) */
  renderV2(opt = {}) {
    const W2 = this.w, H2 = this.h, N = W2 * H2;
    const pb = new PixelBuffer(W2, H2), D = pb.data;
    const zb = new Int32Array(N).fill(-1), ib = new Int8Array(N);
    const parts = this.parts.slice().sort((a, b) => a.z - b.z);
    const L = opt.light || LIGHT_CHAR;
    // 1. sombreado direccional en 4–5 bandas (umbrales del rediseño, bisel corto → sin "almohada")
    parts.forEach((p, pi) => {
      const ramp = p.ramp, n = ramp.length, RU = p.mat.rampU || ramp.map(c => U(c));
      const x0 = Math.max(0, Math.floor(p.bbox[0])), y0 = Math.max(0, Math.floor(p.bbox[1]));
      const x1 = Math.min(W2 - 1, Math.ceil(p.bbox[2])), y1 = Math.min(H2 - 1, Math.ceil(p.bbox[3]));
      const f = p.sdf, bev = Math.max(0.6, p.bevel), hiT = p.hiT ?? 0.7;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const sx = x + 0.5, sy = y + 0.5;
        const d = f(sx, sy);
        if (d > 0) continue;
        let idx = p.base, col;
        if (!p.flat) {
          // en el interior (−d ≥ bisel) la normal es frontal: no hace falta el gradiente (4 evaluaciones menos)
          const k = clamp(-d / bev, 0, 1);
          let gx = 0, gy = 0, gl = 1;
          if (k < 1) { gx = f(sx + 0.5, sy) - f(sx - 0.5, sy); gy = f(sx, sy + 0.5) - f(sx, sy - 0.5); gl = Math.sqrt(gx * gx + gy * gy) || 1; }
          let nx = gx / gl * (1 - k), ny = gy / gl * (1 - k), nz = k * p.flatten + (1 - p.flatten) * 0.9;
          const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
          let dd = (nx * L[0] + ny * L[1] + nz * L[2]) / nl;
          if (p.tilt) dd += p.tilt;
          if (dd < -0.15) idx -= 2; else if (dd < 0.25) idx -= 1; else if (dd > 0.9 && p.shiny) idx += 2; else if (dd > hiT) idx += 1;
          if (p.ao) idx -= p.ao(sx, sy);
          idx -= p.dark;
        }
        idx = clamp(idx, p.flat ? 0 : 1, n - 1);
        col = RU[idx];
        if (p.texture) { const t = p.texture(x, y, idx, ramp, ramp[idx], d); if (t) col = typeof t === 'string' ? U(t) : t; }
        const i = y * W2 + x;
        D[i] = col; zb[i] = pi; ib[i] = idx;
      }
    });
    // 2. islas de banda de 1 px → banda mayoritaria de la misma parte
    for (let y = 1; y < H2 - 1; y++) for (let x = 1; x < W2 - 1; x++) {
      const i = y * W2 + x, pi = zb[i];
      if (pi < 0) continue;
      const P = parts[pi];
      if (P.flat || P.texture) continue;
      const a1 = i - 1, a2 = i + 1, a3 = i - W2, a4 = i + W2;
      if (zb[a1] !== pi || zb[a2] !== pi || zb[a3] !== pi || zb[a4] !== pi) continue;
      const b = ib[i], v1 = ib[a1], v2 = ib[a2], v3 = ib[a3], v4 = ib[a4];
      if (v1 === b || v2 === b || v3 === b || v4 === b) continue;
      // mayoría ≥ 3 de 4
      const best = (v1 === v2 && (v1 === v3 || v1 === v4)) ? v1 : (v3 === v4 && (v3 === v1 || v3 === v2)) ? v3 : -1;
      if (best >= 0) { ib[i] = best; D[i] = P.mat.rampU[best]; }
    }
    // 3. sombras proyectadas (flequillo→frente, mentón→cuello, mochila→chaqueta…)
    parts.forEach((C, ci) => {
      if (!C.cast) return;
      const { on, dx = -1, dy = 2, k = 1 } = C.cast;
      const x0 = Math.max(0, Math.floor(C.bbox[0]) + dx), y0 = Math.max(0, Math.floor(C.bbox[1]) + dy);
      const x1 = Math.min(W2 - 1, Math.ceil(C.bbox[2]) + dx), y1 = Math.min(H2 - 1, Math.ceil(C.bbox[3]) + dy);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const i = y * W2 + x, ti = zb[i];
        if (ti < 0 || ti >= ci) continue;
        const T = parts[ti];
        if (T.flat || !on.includes(T.group)) continue;
        const sx = x - dx, sy = y - dy;
        if (sx < 0 || sy < 0 || sx >= W2 || sy >= H2 || zb[sy * W2 + sx] !== ci) continue;
        const ni = clamp(ib[i] - k, 1, T.ramp.length - 1);
        D[i] = T.mat.rampU[ni];
      }
    });
    // 4. líneas internas: parte trasera junto a una delantera de otro grupo → línea del material
    const out = new Uint32Array(D);
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
      const i = y * W2 + x, pi = zb[i];
      if (pi < 0) continue;
      const P = parts[pi];
      if (P.noLine) continue;
      for (let k = 0; k < 4; k++) {
        const q = k === 0 ? (x > 0 ? zb[i - 1] : -1) : k === 1 ? (x < W2 - 1 ? zb[i + 1] : -1) : k === 2 ? (y > 0 ? zb[i - W2] : -1) : (y < H2 - 1 ? zb[i + W2] : -1);
        if (q > pi && parts[q].group !== P.group && !parts[q].noLineOver) {
          out[i] = U(P.lineCol || (P.lineIdx != null ? P.ramp[P.lineIdx] : P.mat.line));
          break;
        }
      }
    }
    D.set(out);
    this.zbuf = zb; this.zparts = parts; this.ibuf = ib;
    // 5. sellos (ojos, bocas, hebillas, costuras, calcomanías)
    this.stamps.sort((a, b) => a.z - b.z).forEach(s => { if (!s.post) s.fn(pb, this.anchors); });
    // 6. limpieza previa al contorno (motas sueltas, agujeros de 1 px)
    pb.cleanup();
    // 7. luz de borde 1 px en espalda y coronilla
    const env = opt.env || 'coast', rimHex = opt.rimColor || RIM_ENV[env];
    if (rimHex && opt.rim !== 0) {
      pb.rimPass(rimHex, opt.rim ?? 0.38, (i) => {
        const p = zb[i]; if (p < 0) return false;
        const P = parts[p];
        return P.rim !== false && P.mat.rim !== false && ib[i] <= P.base + (P.rimHi ?? 0);
      });
    }
    // 8. contorno por material (+ limpieza de escalera)
    if (opt.outline !== false) {
      const mask = opt.outlineAll ? pb.outlineByPart(zb, [], opt.outlineAll) : pb.outlineByPart(zb, parts, opt.outlineColor || ((nb) => darkOf(nb, -0.85)));
      pb.cleanup(mask);
    }
    // 9. sellos emisivos posteriores (sin contorno)
    this.stamps.forEach(s => { if (s.post) s.fn(pb, this.anchors); });
    return pb;
  }
}

/* ---------- Cinemática: extremidad de dos segmentos ---------- */
function limb(x, y, a1, l1, a2, l2) {
  // ángulo 0 = hacia abajo; positivo = hacia delante (derecha)
  const kx = x + Math.sin(a1) * l1, ky = y + Math.cos(a1) * l1;
  const ex = kx + Math.sin(a1 + a2) * l2, ey = ky + Math.cos(a1 + a2) * l2;
  return { kx, ky, ex, ey, a1, a2 };
}

/* ---------- Ojos y bocas v1 (los usan sprites antiguos y NPC sin plantilla) ---------- */
const FACE = {
  eye(pb, x, y, expr, o) {
    const ink = o.ink || '#1a0f20', iris = o.iris || '#3a2233', hi = '#ffffff', lash = o.lash || ink;
    x = Math.round(x); y = Math.round(y);
    const w = o.w || 2, h = o.h || 4;
    switch (expr) {
      case 'blink': pb.hline(x, x + w - 1, y + h - 2, lash); break;
      case 'happy': pb.set(x, y + 2, lash); pb.hline(x + 1, x + w - 2 + 1, y + 1, lash); pb.set(x + w, y + 2, lash); break;
      case 'closed': pb.hline(x, x + w, y + h - 1, lash); pb.set(x - 1, y + h - 2, lash); break;
      case 'surprised': pb.rect(x, y - 1, w, h + 1, ink); pb.set(x, y, hi); pb.set(x + w - 1, y + h - 1, iris); break;
      case 'half': pb.hline(x - 1, x + w, y + 1, lash); pb.rect(x, y + 2, w, h - 2, ink); pb.set(x + w - 1, y + 2, iris); break;
      case 'angry': pb.rect(x, y + 1, w, h - 1, ink); pb.set(x, y + 1, hi); pb.set(x + w - 1, y + h - 1, iris); break;
      case 'sad': pb.rect(x, y + 1, w, h - 1, ink); pb.set(x, y + 1, hi); pb.set(x + w - 1, y + h - 1, iris); pb.set(x - 1, y + h, o.tear ? '#a6f4ff' : ink); break;
      default: pb.rect(x, y, w, h, ink); pb.set(x, y, hi); if (h > 3) pb.set(x + w - 1, y + h - 1, iris); if (w > 2) pb.set(x + 1, y + h - 1, iris);
    }
  },
  brow(pb, x, y, expr, col, w = 3, flip = false) {
    x = Math.round(x); y = Math.round(y);
    const inner = flip ? x : x + w - 1, outer = flip ? x + w - 1 : x;
    switch (expr) {
      case 'angry': case 'determined': pb.line(outer, y - 1, inner, y + 1, col); break;
      case 'worried': case 'sad': case 'guilty': pb.line(outer, y + 1, inner, y - 1, col); break;
      case 'surprised': pb.hline(x, x + w - 1, y - 2, col); break;
      case 'skeptical': pb.hline(x, x + w - 1, flip ? y - 1 : y, col); break;
      default: pb.hline(x, x + w - 1, y - 1, col); if (w > 2) pb.set(outer, y, col);
    }
  },
  mouth(pb, x, y, kind, o) {
    const ink = o.ink || '#3a1418', tongue = '#e2606a', teeth = '#fffaf0';
    x = Math.round(x); y = Math.round(y);
    switch (kind) {
      case 'smile': pb.set(x - 1, y - 1, ink); pb.hline(x, x + 2, y, ink); pb.set(x + 3, y - 1, ink); break;
      case 'grin': pb.hline(x - 1, x + 3, y, ink); pb.hline(x, x + 2, y + 1, ink); pb.set(x + 1, y + 1, tongue); pb.hline(x, x + 2, y, teeth); break;
      case 'open': pb.rect(x, y - 1, 3, 3, ink); pb.set(x + 1, y + 1, tongue); break;
      case 'talk': pb.rect(x, y, 3, 2, ink); pb.set(x + 1, y + 1, tongue); break;
      case 'o': pb.rect(x + 1, y - 1, 2, 3, ink); break;
      case 'frown': pb.set(x - 1, y + 1, ink); pb.hline(x, x + 2, y, ink); pb.set(x + 3, y + 1, ink); break;
      case 'flat': pb.hline(x, x + 2, y, ink); break;
      case 'wavy': pb.set(x - 1, y, ink); pb.set(x, y - 1, ink); pb.set(x + 1, y, ink); pb.set(x + 2, y - 1, ink); pb.set(x + 3, y, ink); break;
      case 'smirk': pb.hline(x, x + 2, y, ink); pb.set(x + 3, y - 1, ink); break;
      default: pb.hline(x, x + 1, y, ink);
    }
  },
};

/* expresiones: {eyes, brows, mouth} (v1) + plantillas v2 (eye2, brow2, mouth2, blush, tear) */
const EXPR = {
  neutral: { eyes: 'open', brows: 'neutral', mouth: 'line' },
  happy: { eyes: 'happy', brows: 'neutral', mouth: 'smile', blush: 1 },
  joy: { eyes: 'happy', brows: 'surprised', mouth: 'grin', blush: 1 },
  smile: { eyes: 'open', brows: 'neutral', mouth: 'smile', blush: 1 },
  surprised: { eyes: 'surprised', brows: 'surprised', mouth: 'o' },
  worried: { eyes: 'open', brows: 'worried', mouth: 'wavy', eye2: 'worried' },
  sad: { eyes: 'sad', brows: 'sad', mouth: 'frown' },
  angry: { eyes: 'angry', brows: 'angry', mouth: 'frown', mouth2: 'clench' },
  determined: { eyes: 'angry', brows: 'determined', mouth: 'flat', eye2: 'determined', mouth2: 'firm' },
  thinking: { eyes: 'half', brows: 'skeptical', mouth: 'flat', eye2: 'look', mouth2: 'side' },
  skeptical: { eyes: 'half', brows: 'skeptical', mouth: 'smirk' },
  guilty: { eyes: 'sad', brows: 'guilty', mouth: 'flat', eye2: 'down' },
  calm: { eyes: 'half', brows: 'neutral', mouth: 'smile', eye2: 'soft' },
  scared: { eyes: 'surprised', brows: 'worried', mouth: 'wavy', eye2: 'scared' },
  tired: { eyes: 'half', brows: 'sad', mouth: 'flat', eye2: 'tired' },
  // añadidos del rediseño (alias de retrato y sprite)
  crying: { eyes: 'sad', brows: 'sad', mouth: 'frown', tear: 1 },
  proud: { eyes: 'half', brows: 'neutral', mouth: 'smile', eye2: 'soft', blush: 1 },
  embarrassed: { eyes: 'open', brows: 'worried', mouth: 'wavy', eye2: 'down', blush: 2 },
  curious: { eyes: 'open', brows: 'skeptical', mouth: 'o', eye2: 'open', brow2: 'raised' },
  focused: { eyes: 'half', brows: 'skeptical', mouth: 'flat', eye2: 'look', mouth2: 'side' },
  relieved: { eyes: 'closed', brows: 'neutral', mouth: 'smile', eye2: 'soft', blush: 1 },
  frustrated: { eyes: 'angry', brows: 'angry', mouth: 'frown', mouth2: 'clench' },
  alert: { eyes: 'surprised', brows: 'surprised', mouth: 'flat', eye2: 'wide' },
};

/* =====================================================================
   FACE2 — plantillas de cara del rediseño (sprite 88×104, cabeza ~23 px).
   Ojo cercano 3×5 tipo anime (pestaña con remate, brillo 1 px, iris que
   aclara hacia abajo); ojo lejano 2×4 comprimido junto al perfil.
   Tokens: K pestaña · h brillo · w blanco · D/M/L iris oscuro/medio/claro
   · s piel en sombra · S piel base · t lágrima · b rubor.
   Las filas empiezan en y + oy (y = fila superior del iris).
   ===================================================================== */
const EYE2 = {
  open: { oy: -2, rows: ['....K', 'KKKKK', 'whDD.', 'wDDD.', 'wMMD.', '.MLM.'] },
  look: { oy: -2, rows: ['....K', 'KKKKK', 'wwhD.', 'wwDD.', 'wwMD.', '..ML.'] },
  half: { oy: -1, rows: ['.....', 'KKKKK', 'wDDD.', 'wMMD.', '.ML..'] },
  soft: { oy: 0, rows: ['KKKK.', 'sDD..', '.ML..'] },
  tired: { oy: 0, rows: ['.....', 'KKKK.', 'sMM..', '.ss..'] },
  happy: { oy: 0, rows: ['.KK..', 'K..K.', '.....'] },
  closed: { oy: 1, rows: ['K..K.', '.KK..'] },
  blink: { oy: 2, rows: ['KKKK.', '.ss..'] },
  surprised: { oy: -2, rows: ['.KKK.', 'KwhwK', 'wwDw.', 'wwDw.', '.ww..'] },
  wide: { oy: -2, rows: ['.KKK.', 'KwhD.', 'wwDD.', 'wwMM.', '.ww..'] },
  scared: { oy: -2, rows: ['.KKK.', 'Kwww.', 'wwDw.', 'wwww.', '.ss..'] },
  angry: { oy: -2, rows: ['KK...', '.KKK.', 'whKKK', 'wDDD.', 'wMMD.', '.ML..'] },
  determined: { oy: -1, rows: ['KKKKK', 'KKKK.', 'whDD.', 'wMMD.', '.ML..'] },
  sad: { oy: -2, rows: ['..KKK', '.K...', 'KhDD.', 'wDDD.', 'wMMD.', '.ML..'] },
  worried: { oy: -2, rows: ['..KKK', 'KK...', 'whDD.', 'wDDD.', 'wMMD.', '.ML..'] },
  down: { oy: 0, rows: ['KKKKK', 'wDDD.', 'wMLM.', '.ss..'] },
};
const EYE2_FAR = {
  open: ['KK', 'DK', 'D.', 'M.'], look: ['KK', '.D', '.D', '.M'], half: ['..', 'KK', 'D.', 'M.'], soft: ['..', 'KK', 's.'],
  tired: ['..', 'KK', 's.'], happy: ['..', 'K.', '.K'], closed: ['..', '..', 'K.', '.K'], blink: ['..', '..', '..', 'KK'],
  surprised: ['.K', 'Kw', 'D.', 'w.'], wide: ['.K', 'KD', 'D.', 'M.'], scared: ['.K', 'Kw', 'D.', 'w.'], angry: ['..', 'KK', 'D.', 'M.'],
  determined: ['KK', 'KK', 'D.', 'M.'], sad: ['K.', '.K', 'D.', 'M.'], worried: ['K.', '.K', 'D.', 'M.'], down: ['..', 'KK', 'M.'],
};
/** v1 → plantilla v2 */
const EYE_V1_TO_V2 = { open: 'open', happy: 'happy', closed: 'closed', blink: 'blink', surprised: 'surprised', half: 'half', angry: 'angry', sad: 'sad' };
const MOUTH2 = {
  line: ['KK'], smile: ['K..', '.KK'], grin: ['KKKK', 'Kwwt', '.KK.'], open: ['KKK', 'Ktt', '.K.'], talk: ['KK', 'Kt'],
  o: ['.K.', 'K.K', '.K.'], frown: ['.KK', 'K..'], flat: ['KKK'], wavy: ['K.K.', '.K.K'], smirk: ['..K', 'KK.'],
  clench: ['KKKK', 'Kww.'], firm: ['KKK'], side: ['.KK'],
};
const FACE2 = {
  /** pb, o = {x, y, flip}, plantilla, tokens de color */
  eyeNear(pb, x, y, kind, pal) { const T = EYE2[kind] || EYE2.open; pb.stampMap(x, y + T.oy, T.rows, pal); },
  eyeFar(pb, x, y, kind, pal) { const T = EYE2_FAR[kind] || EYE2_FAR.open; pb.stampMap(x, y - 1, T, pal); },
  brow(pb, x, y, kind, col) {
    // ceja cercana sobre el flequillo solo en estados intensos (x = inicio, y = fila de la pestaña)
    const c = U(col);
    const P = {
      angry: [[0, -3], [1, -3], [2, -2], [3, -2], [4, -1]], determined: [[0, -3], [1, -3], [2, -3], [3, -2]],
      sad: [[0, -2], [1, -2], [2, -3], [3, -4]], worried: [[0, -2], [1, -3], [2, -3], [3, -4]], guilty: [[0, -2], [1, -2], [2, -3], [3, -3]],
      surprised: [[-1, -3], [0, -4], [1, -4], [2, -4], [3, -3]], skeptical: [[0, -4], [1, -4], [2, -4], [3, -4]], raised: [[0, -3], [1, -4], [2, -4], [3, -4]],
    }[kind];
    if (P) for (const [dx, dy] of P) pb.set(x + dx, y + dy, c);
  },
  mouth(pb, x, y, kind, pal) { const T = MOUTH2[kind] || MOUTH2.line; pb.stampMap(x, y, T, pal); },
  /**
   * Cara completa. A = {hx, hy}; D.face = {eyeX, eyeY, eye2X, mouthX, mouthY, noseX, noseY, iris:[D,M,L],
   * lash, white, mouthInk, blush, browCol, lashFar}; skin = rampa de piel; exprName; pose.
   */
  draw(pb, A, exprName, D, pose, skin) {
    const F = D.face || {};
    const E = EXPR[exprName] || EXPR.neutral;
    const ex = Math.round(A.hx + (F.eyeX ?? 2)), ey = Math.round(A.hy + (F.eyeY ?? 0));
    const fx = Math.round(A.hx + (F.eye2X ?? 8)), mx = Math.round(A.hx + (F.mouthX ?? 6)), my = Math.round(A.hy + (F.mouthY ?? 7));
    const iris = F.iris || ['#1e0901', '#4a1c0c', '#8a4420'];
    const pal = { K: F.lash || '#1a0604', h: '#ffffff', w: F.white || '#fff4ea', D: iris[0], M: iris[1], L: iris[2], s: skin[3], S: skin[4], t: '#a6f4ff' };
    const palFar = Object.assign({}, pal, { K: F.lashFar || pal.K });
    let k = pose.blink ? 'blink' : (E.eye2 || EYE_V1_TO_V2[E.eyes] || 'open');
    let kf = pose.blink ? 'blink' : k;
    // ojo lejano primero (queda parcialmente tapado por el perfil)
    if (!F.noFar) FACE2.eyeFar(pb, fx, ey, kf, palFar);
    FACE2.eyeNear(pb, ex, ey, k, pal);
    if (E.tear || pose.tear) { pb.set(ex - 1, ey + 4, pal.t); pb.set(ex - 1, ey + 5, pal.t); pb.set(ex, ey + 6, '#e6fdff'); }
    // cejas visibles solo cuando la emoción las levanta o frunce
    const bk = E.brow2 || E.brows;
    if (['angry', 'determined', 'sad', 'worried', 'guilty', 'surprised', 'skeptical', 'raised'].includes(bk)) FACE2.brow(pb, ex, ey - 1, bk, F.browCol || '#2a0a04');
    // nariz: sombra de 1 px bajo la punta + brillo
    if (F.nose !== false) { const nx = Math.round(A.hx + (F.noseX ?? 10)), ny = Math.round(A.hy + (F.noseY ?? 4)); pb.set(nx - 1, ny + 1, skin[2]); }
    // boca
    const mk = pose.mouth || E.mouth2 || E.mouth;
    FACE2.mouth(pb, mx, my, mk, { K: F.mouthInk || '#5a160c', w: '#fff4ea', t: '#d0505a' });
    // rubor (2 px) bajo el ojo
    if ((E.blush || F.blushAlways) && F.blush !== null) { const bc = F.blush || '#ff8a6a'; pb.set(ex + 1, ey + 5, bc); pb.set(ex + 2, ey + 5, bc); if (E.blush > 1) pb.set(ex, ey + 5, bc); }
  },
};

/* =====================================================================
   Animación procedimental: genera pose a partir de (anim, fase t∈[0,1))
   STYLE LOCK §13: idle 6 · walk 8 · run 8 · jump 3 · fall 2 · land 2 ·
   interacción 4–6 · emociones 2–4. Pelo con movimiento secundario
   (pose.hair = {base, amp, P, lag}) y mochila con 1 px de retraso.
   ===================================================================== */
const ANIMS = {
  idle: { frames: 6, fps: 5, loop: true },
  walk: { frames: 8, fps: 10, loop: true },
  run: { frames: 8, fps: 13, loop: true },
  jump: { frames: 3, fps: 10, loop: false },
  fall: { frames: 2, fps: 8, loop: true },
  land: { frames: 2, fps: 14, loop: false },
  scan: { frames: 6, fps: 8, loop: true },
  sample: { frames: 6, fps: 8, loop: false },
  repair: { frames: 6, fps: 10, loop: true },
  program: { frames: 6, fps: 10, loop: true },
  talk: { frames: 6, fps: 7, loop: true },
  celebrate: { frames: 8, fps: 10, loop: true },
  frustrate: { frames: 6, fps: 8, loop: true },
  tool: { frames: 4, fps: 10, loop: true },
  hit: { frames: 3, fps: 10, loop: false },
  help: { frames: 4, fps: 6, loop: false },
  climb: { frames: 4, fps: 8, loop: true },
  sit: { frames: 4, fps: 3, loop: true },
  point: { frames: 4, fps: 6, loop: true },
  think: { frames: 6, fps: 4, loop: true },
  sad: { frames: 6, fps: 4, loop: true },
  wade: { frames: 8, fps: 8, loop: true },
  // emociones e interacción del rediseño
  observe: { frames: 6, fps: 5, loop: true },
  surprise: { frames: 2, fps: 8, loop: false },
  worry: { frames: 4, fps: 4, loop: true },
  fear: { frames: 4, fps: 10, loop: true },
  determined: { frames: 4, fps: 6, loop: true },
  victory: { frames: 4, fps: 6, loop: true },
};
/** Alias de animación (nombres del prompt §13) */
const ANIM_ALIAS = { interact: 'help', analyze: 'scan', operate: 'program', anger: 'frustrate', sadness: 'sad', celebration: 'celebrate', worried: 'worry', scared: 'fear' };
for (const [a, b] of Object.entries(ANIM_ALIAS)) if (!ANIMS[a]) ANIMS[a] = ANIMS[b];

function poseFor(anim, t, ch) {
  anim = ANIM_ALIAS[anim] || anim;
  const S = Math.sin, C = Math.cos, P = TAU * t;
  const p = {
    bob: 0, lean: 0, headTilt: 0, headDX: 0, headDY: 0,
    hipF: 0, kneeF: 0, hipB: 0, kneeB: 0, footF: 0, footB: 0,
    shF: 0.1, elF: 0.25, shB: -0.1, elB: 0.25, handF: 'open', handB: 'open',
    expr: null, mouth: null, blink: false, hairSwing: 0, squash: 0, item: null, beam: 0,
    crouch: 0, eyeDY: 0, phase: t, anim,
    hair: { base: 0, amp: 0.08, P, lag: 0.45 }, pack: 0,
  };
  const energetic = ch.energetic ?? 1;
  const kick = (phi) => Math.pow(Math.max(0, C(phi - (1.5 * Math.PI + 0.6))), 1.4);
  switch (anim) {
    case 'idle': {
      const br = S(P) * 0.5 + 0.5;
      p.bob = Math.round(br);
      p.shF = 0.1 + S(P) * 0.04; p.shB = -0.14 - S(P) * 0.03;
      p.elF = 0.32; p.elB = 0.3;
      p.headTilt = S(P) * 0.02;
      p.hipF = 0.1; p.hipB = -0.07; p.kneeF = -0.04; p.kneeB = 0.02;
      p.blink = (t > 0.66 && t < 0.84);
      p.hair = { base: 0.05, amp: 0.07, P, lag: 0.5 }; p.pack = Math.round(br);
      break;
    }
    case 'walk': case 'wade': {
      const sw = anim === 'wade' ? 0.38 : 0.55;
      p.hipF = S(P) * sw; p.hipB = -S(P) * sw;
      p.kneeF = -Math.max(0, C(P)) * 0.75 - 0.08; p.kneeB = -Math.max(0, -C(P)) * 0.75 - 0.08;
      p.footF = S(P) * 0.15; p.footB = -S(P) * 0.15;
      p.shF = -S(P) * 0.55; p.shB = S(P) * 0.55; p.elF = 0.4; p.elB = 0.4;
      p.bob = Math.round(-Math.abs(S(P)) * 1.5 + 1); p.lean = 0.06 * energetic;
      p.hair = { base: -0.25, amp: 0.22, P: P * 2, lag: 0.5 }; p.pack = Math.round(Math.abs(C(P)));
      break;
    }
    case 'run': {
      const pf = P, pb2 = P + Math.PI;
      p.hipF = S(pf) * 1.0; p.hipB = S(pb2) * 1.0;
      p.kneeF = -0.18 - 2.0 * kick(pf); p.kneeB = -0.18 - 2.0 * kick(pb2);
      p.footF = 0.1 + 0.4 * kick(pf); p.footB = 0.1 + 0.4 * kick(pb2);
      p.shF = -S(P) * 1.1 + 0.15; p.shB = S(P) * 1.1 + 0.1; p.elF = 1.6; p.elB = 1.5;
      p.bob = Math.round(C(2 * P) * 1.5 - 0.5); p.lean = 0.28 * Math.min(1.1, energetic);
      p.headTilt = -0.06; p.headDX = 0.5;
      p.hair = { base: -0.6, amp: 0.2, P: P * 2, lag: 0.55 }; p.pack = Math.round(-C(2 * P - 0.9));
      p.handF = 'fist'; p.handB = 'fist';
      break;
    }
    case 'jump': {
      // 0 despegue estirado · 1 subida · 2 recogida en el ápice
      const f = Math.min(2, Math.floor(t * 3 + 1e-6));
      if (f === 0) { p.hipF = 0.35; p.kneeF = -0.5; p.hipB = -0.45; p.kneeB = -0.2; p.footB = 0.6; p.shF = 1.85; p.elF = 0.55; p.shB = -0.9; p.elB = 0.4; p.lean = 0.12; p.bob = -1; }
      else if (f === 1) { p.hipF = 0.8; p.kneeF = -1.3; p.hipB = -0.3; p.kneeB = -0.9; p.shF = 1.95; p.elF = 0.5; p.shB = -0.8; p.elB = 0.6; p.lean = 0.08; }
      else { p.hipF = 1.0; p.kneeF = -1.7; p.hipB = 0.2; p.kneeB = -1.5; p.shF = 1.5; p.elF = 1.0; p.shB = 0.5; p.elB = 1.2; p.lean = 0.1; p.crouch = -1; }
      p.hair = { base: 0.55 - f * 0.15, amp: 0.05, P, lag: 0.4 }; p.pack = -1; p.handF = 'fist';
      p.expr = ch.jumpExpr || null;
      break;
    }
    case 'fall': {
      p.hipF = 0.35; p.kneeF = -0.55; p.hipB = -0.45; p.kneeB = -0.35;
      p.shF = 1.45 + S(P) * 0.15; p.elF = 0.7; p.shB = 2.6 - S(P) * 0.2; p.elB = 0.4; p.lean = -0.03;
      p.hair = { base: -0.15, amp: 0.25, P: P + 1, lag: 0.4 }; p.pack = 1;
      break;
    }
    case 'land': {
      const k = 1 - t;
      p.crouch = Math.round(5 * k); p.hipF = 0.55 * k; p.kneeF = -1.1 * k; p.hipB = 0.35 * k; p.kneeB = -1.0 * k;
      p.shF = 0.6 * k; p.shB = 0.35 * k; p.elF = 0.6; p.elB = 0.6; p.lean = 0.14 * k;
      p.hair = { base: 0.35 * k, amp: 0.05, P, lag: 0.4 }; p.pack = Math.round(2 * k);
      break;
    }
    case 'scan': {
      p.shF = 1.45 + S(P) * 0.05; p.elF = 0.15; p.item = 'scanner'; p.beam = 1;
      p.shB = 0.3; p.elB = 1.2; p.headTilt = 0.04 + S(P) * 0.02; p.bob = Math.round(S(P) * 0.5 + 0.5);
      p.hipF = 0.15; p.hipB = -0.1; p.expr = 'focused'; p.hair.amp = 0.06;
      break;
    }
    case 'sample': {
      const k = S(Math.min(1, t * 1.6) * Math.PI / 2);
      p.crouch = Math.round(12 * k); p.lean = 0.35 * k; p.hipF = 1.1 * k; p.kneeF = -1.9 * k; p.hipB = 0.2 * k; p.kneeB = -1.5 * k;
      p.shF = 0.6 * k + 0.1; p.elF = 0.2; p.shB = 0.2; p.elB = 0.8; p.item = 'vial'; p.headTilt = 0.15 * k;
      p.hair.base = 0.2 * k;
      break;
    }
    case 'repair': {
      p.shF = 1.0 + S(P) * 0.5; p.elF = 0.9 + S(P) * 0.4; p.item = 'wrench'; p.shB = 0.6; p.elB = 1.1;
      p.lean = 0.12; p.bob = Math.round(Math.abs(S(P))); p.expr = 'determined'; p.hipF = 0.25; p.kneeF = -0.2;
      p.hair = { base: -0.05, amp: 0.12, P: P * 2, lag: 0.5 };
      break;
    }
    case 'program': {
      p.shF = 0.7 + S(P * 2) * 0.06; p.elF = 1.4; p.shB = 0.6; p.elB = 1.6 + S(P * 2 + 1) * 0.06; p.item = 'tablet';
      p.headTilt = 0.12; p.expr = 'focused';
      break;
    }
    case 'talk': {
      p.shF = 0.15 + Math.max(0, S(P)) * 0.9; p.elF = 0.6 + Math.max(0, S(P)) * 0.6; p.shB = -0.12; p.elB = 0.3;
      p.mouth = (Math.floor(t * 6) % 2) ? 'talk' : null; p.headTilt = S(P) * 0.03; p.bob = Math.round(S(P) * 0.5 + 0.5);
      p.hair.amp = 0.08;
      break;
    }
    case 'celebrate': {
      const up = Math.max(0, S(P));
      p.bob = -Math.round(up * 7); p.shF = 1.9 + S(P * 2) * 0.15; p.elF = 0.7; p.shB = 3.1 + S(P) * 0.1; p.elB = -0.05; p.armStretchB = 1.25; p.shLiftB = 3.5; p.backHandZ = 56.5;
      p.hipF = 0.45 * up; p.kneeF = -0.9 * up; p.hipB = -0.25 * up; p.kneeB = -0.8 * up; p.expr = 'joy'; p.handF = 'fist'; p.handB = 'fist';
      p.hair = { base: 0.5 * up - 0.1, amp: 0.15, P, lag: 0.5 }; p.pack = Math.round(up * 2);
      break;
    }
    case 'frustrate': {
      p.shF = 2.7; p.elF = 2.3 + S(P * 2) * 0.1; p.shB = 2.5; p.elB = 2.3; p.expr = 'frustrated'; p.headTilt = -0.06 + S(P * 2) * 0.05;
      p.bob = Math.round(Math.abs(S(P * 2))); p.hipF = Math.abs(S(P)) * 0.4; p.kneeF = -Math.abs(S(P)) * 0.6;
      p.hair = { base: 0, amp: 0.15, P: P * 2, lag: 0.4 };
      break;
    }
    case 'tool': {
      p.shF = 1.5; p.elF = 0; p.item = ch.tool || 'scanner'; p.beam = 0.5 + 0.5 * S(P); p.shB = 0.3; p.elB = 0.9; p.lean = 0.05;
      p.hipF = 0.25; p.hipB = -0.15; p.expr = 'determined';
      break;
    }
    case 'hit': {
      p.lean = -0.28 * (1 - t); p.shF = 1.2; p.shB = 1.6; p.elF = 0.8; p.elB = 0.8; p.expr = 'surprised'; p.hipF = 0.2; p.kneeF = -0.3; p.squash = 1;
      p.hair = { base: 0.6, amp: 0.2, P: P * 3, lag: 0.4 }; p.pack = -1;
      break;
    }
    case 'help': {
      p.shF = 1.35 * Math.min(1, t * 2); p.elF = 0.05; p.lean = 0.12; p.shB = 0.1; p.elB = 0.4; p.expr = 'smile'; p.hipF = 0.3; p.kneeF = -0.15;
      break;
    }
    case 'climb': {
      p.shF = 2.2 + S(P) * 0.35; p.shB = 2.7 - S(P) * 0.35; p.elF = 0.9; p.elB = 0.5;
      p.hipF = 0.6 + S(P) * 0.4; p.kneeF = -1.2; p.hipB = 0.6 - S(P) * 0.4; p.kneeB = -1.2; p.handF = 'fist'; p.handB = 'fist'; p.back = true;
      p.hair = { base: 0.2, amp: 0.1, P, lag: 0.4 };
      break;
    }
    case 'sit': {
      p.crouch = 16; p.hipF = 1.5; p.kneeF = -1.55; p.hipB = 1.4; p.kneeB = -1.5; p.shF = 0.3; p.elF = 1.0; p.shB = 0.2; p.elB = 1.0; p.bob = Math.round(S(P) * 0.5 + 0.5); p.blink = t > 0.75;
      break;
    }
    case 'point': {
      p.shF = 1.6; p.elF = 0.05; p.handF = 'point'; p.shB = -0.05; p.elB = 0.3; p.headTilt = 0.02; p.hipF = 0.15; p.hipB = -0.1;
      break;
    }
    case 'think': {
      p.shF = 0.5; p.elF = 2.6; p.handF = 'fist'; p.shB = 0.3; p.elB = 1.5; p.expr = 'thinking'; p.headTilt = -0.08 + S(P) * 0.02;
      break;
    }
    case 'sad': {
      p.shF = 0.05; p.elF = 0.1; p.shB = -0.05; p.elB = 0.1; p.expr = 'sad'; p.headTilt = 0.18; p.headDY = 1; p.lean = 0.05; p.bob = Math.round(S(P) * 0.5 + 0.5);
      p.hair = { base: 0.15, amp: 0.04, P, lag: 0.5 };
      break;
    }
    case 'observe': {
      // mano haciendo visera, inclinada hacia delante, oteando el horizonte
      p.shB = 2.2; p.elB = 0.72 + S(P) * 0.04; p.handB = 'visor'; p.backHandFront = true; p.shF = -0.3; p.elF = 1.9; p.handF = 'fist';
      p.lean = 0.1; p.headTilt = -0.05 + S(P) * 0.02; p.hipF = 0.25; p.kneeF = -0.1; p.hipB = -0.15;
      p.expr = 'curious'; p.bob = Math.round(S(P) * 0.5 + 0.5); p.hair = { base: -0.1, amp: 0.1, P, lag: 0.5 };
      break;
    }
    case 'surprise': {
      const k = t < 0.5 ? 0.6 : 1;
      p.lean = -0.16 * k; p.shF = 1.3 * k; p.elF = 1.5 * k; p.shB = 1.0 * k; p.elB = 1.6 * k; p.handF = 'open'; p.handB = 'open';
      p.hipF = 0.15; p.hipB = -0.25; p.bob = -Math.round(2 * k); p.expr = 'surprised';
      p.hair = { base: 0.6 * k, amp: 0.05, P, lag: 0.4 }; p.pack = -1;
      break;
    }
    case 'worry': {
      // mano al pecho, peso que va de un pie a otro
      const w = S(P);
      p.shF = 0.85; p.elF = 2.35; p.handF = 'open'; p.shB = -0.05 + w * 0.05; p.elB = 0.35;
      p.lean = 0.02 + w * 0.03; p.hipF = 0.12 + w * 0.06; p.hipB = -0.1 + w * 0.06; p.headTilt = 0.1 + w * 0.03; p.headDY = 1;
      p.expr = 'worried'; p.hair = { base: 0.1, amp: 0.06, P, lag: 0.5 };
      break;
    }
    case 'fear': {
      // encogida, antebrazos delante de la cara, temblor
      const tr = (Math.floor(t * 4) % 2) ? 1 : 0;
      p.crouch = 4; p.lean = -0.08; p.shF = 1.9; p.elF = 2.1; p.shB = 1.6; p.elB = 2.2; p.handF = 'fist'; p.handB = 'fist';
      p.hipF = 0.35; p.kneeF = -0.6; p.hipB = -0.1; p.kneeB = -0.5; p.headDY = 2; p.headDX = -1 + tr;
      p.expr = 'scared'; p.hair = { base: 0.2, amp: 0.1, P: P * 2, lag: 0.3 };
      break;
    }
    case 'determined': {
      // guardia: puño cercano cargado a la cadera, postura abierta
      const b = S(P);
      p.shF = -0.55; p.elF = 2.1; p.handF = 'fist'; p.shB = 0.9; p.elB = 1.5; p.handB = 'fist';
      p.hipF = 0.38; p.kneeF = -0.25; p.hipB = -0.32; p.kneeB = -0.1; p.lean = 0.1; p.bob = Math.round(b * 0.5 + 0.5);
      p.expr = 'determined'; p.hair = { base: -0.15, amp: 0.12, P, lag: 0.5 };
      break;
    }
    case 'victory': {
      // brazo en alto sostenido (distinto de celebrate), otro en la cadera
      const b = S(P);
      p.shB = 3.08 + b * 0.04; p.elB = -0.05; p.handB = 'fist'; p.armStretchB = 1.25; p.shLiftB = 3.5; p.backHandZ = 56.5; p.shF = -0.35; p.elF = 2.0; p.handF = 'fist'; p.headTilt = -0.06;
      p.hipF = 0.18; p.hipB = -0.18; p.bob = -Math.round(Math.max(0, b) * 1.5); p.lean = -0.04;
      p.expr = 'joy'; p.hair = { base: 0.15, amp: 0.18, P, lag: 0.5 };
      break;
    }
  }
  return p;
}

/* =====================================================================
   Constructor humanoide v2: 3/4 casi de perfil mirando a la derecha.
   Lienzo 88×104, pies en y = 100 (oy), cuerpo centrado en x = 40 (ox).
   D = {dimensiones, mat:{skin,hair,top,sleeve,legs,shin,shoes,gloves}, face,
        torso(R,o), hair(R,o), extra(R,o), legwear(R,o), accessories:[…]}
   ===================================================================== */
const HUM_W = 88, HUM_H = 104, HUM_OX = 40, HUM_OY = 100;
function buildHumanoid(R, D, pose, opts = {}) {
  const G = HUM_OY, cx = HUM_OX + (D.dx || 0);
  const sc = D.scale || 1;
  const crouch = (pose.crouch || 0) * sc;
  const lean = (pose.lean || 0) + (D.stoop || 0);
  const thigh = D.thigh * sc, shin = D.shin * sc, footH = D.footH;
  const hipY = G - footH - thigh - shin + crouch + pose.bob;
  const footY = G - footH;
  const waistY = hipY - D.pelvisH * sc;
  const chestH = D.chestH * sc;
  const shoulderY = waistY - chestH + 2;
  const lx = Math.sin(lean) * chestH;
  const neckX = cx + Math.sin(lean) * (chestH + 3) + (D.neckDX || 0);
  const neckY = shoulderY - 1;
  const hrx = D.headRX, hry = D.headRY;
  const hx = neckX + (D.headDX ?? 1.5) + (pose.headDX || 0) + Math.sin(lean) * 2;
  const hy = neckY - hry + 2 + (pose.headDY || 0) + (D.headDY || 0);
  const M = D.mat;
  const skin = asMat(M.skin);
  R.anchors = { cx, hipY, waistY, chestY: waistY - chestH * 0.5, shoulderY, neckX, neckY, head: { x: hx, y: hy, rx: hrx, ry: hry, tilt: pose.headTilt }, lean, pose, footY };
  // ---- piernas
  const hipFX = cx + 1.5 * sc, hipBX = cx - 1.5 * sc;
  const lf = limb(hipFX, hipY + 1, pose.hipF, thigh, pose.kneeF, shin);
  const lb = limb(hipBX, hipY + 1, pose.hipB, thigh, pose.kneeB, shin);
  const clampFoot = (Lg) => { if (Lg.ey > footY) Lg.ey = footY; return Lg; };
  clampFoot(lf); clampFoot(lb);
  R.anchors.legF = lf; R.anchors.legB = lb;
  const legW = D.legW * (D.wideLeg || 1);
  const legM = asMat(M.legs), shinM = asMat(M.shin || M.legs);
  const leg = (Lg, hipX, z, grp, dark) => {
    R.capsule(hipX, hipY + 1, Lg.kx, Lg.ky, legW, legW * 0.9, { mat: legM, base: 3, z, group: grp, dark, bevel: legW * 0.6 });
    R.capsule(Lg.kx, Lg.ky, Lg.ex, Lg.ey, legW * 0.88, legW * 0.72, { mat: shinM, base: 3, z: z + 0.5, group: grp, dark, bevel: legW * 0.6 });
    bootPart(R, Lg, pose, D, z + 1, grp, dark, footY);
  };
  leg(lb, hipBX, 10, 'legB', 1);
  leg(lf, hipFX, 40, 'legF', 0);
  if (D.legwear) D.legwear(R, { cx, hipY, waistY, lf, lb, hipFX, hipBX, pose, M, legW, sc });
  // ---- torso
  const tw = D.torsoW * (D.wide || 1);
  const torsoPts = [
    [cx - tw * 0.48 + lx * 0.95, shoulderY - 1], [cx + tw * 0.42 + lx, shoulderY - 0.5],
    [cx + tw * 0.5 + lx * 0.55 + (D.belly ? 2.5 : 0), waistY - chestH * 0.45], [cx + tw * 0.42 + lx * 0.15 + (D.belly ? 2 : 0), waistY],
    [cx + tw * 0.45, hipY + 2], [cx - tw * 0.5, hipY + 2], [cx - tw * 0.48 + lx * 0.4, waistY - chestH * 0.4],
  ];
  const o = { cx, hipY, waistY, shoulderY, tw, lx, pose, M, torsoPts, lf, lb, chestH, sc, neckX, neckY, D };
  if (D.torso) D.torso(R, o);
  else R.poly(torsoPts, { mat: asMat(M.top), base: 3, z: 30, group: 'torso', bevel: 3 });
  // cuello (el mentón proyecta sombra)
  R.capsule(neckX - 0.5, neckY + 3, hx - 1, hy + hry - 4, D.neckR || 2.8, D.neckR || 2.8, { mat: skin, base: 3, z: 29, group: 'neck', bevel: 1.5 });
  // ---- brazos
  const shFX = cx + tw * 0.12 + lx, shBX = cx - tw * 0.16 + lx * 0.95;
  const armL1 = D.upperArm * sc, armL2 = D.foreArm * sc, aw = D.armW * (D.wideArm || 1);
  // estiramiento y encogimiento de hombro para poses de brazo en alto (la mano supera la cabeza)
  const kF = pose.armStretchF || 1, kB = pose.armStretchB || 1;
  const syF = shoulderY + 2.5 - (pose.shLiftF || 0), syB = shoulderY + 2.5 - (pose.shLiftB || 0);
  const af = limb(shFX, syF, pose.shF, armL1 * kF, pose.elF, armL2 * kF);
  const ab = limb(shBX, syB, pose.shB, armL1 * kB, pose.elB, armL2 * kB);
  af.sx = shFX; af.sy = syF; ab.sx = shBX; ab.sy = syB;
  R.anchors.armF = af; R.anchors.armB = ab;
  const sleeveM = asMat(M.sleeve || M.top), foreM = asMat(D.foreMat || M.sleeve || M.top);
  const arm = (A, z, grp, dark, hand) => {
    const upM = D.shortSleeve ? skin : sleeveM;
    R.capsule(A.sx, A.sy, A.kx, A.ky, aw, aw * 0.9, { mat: upM, base: 3, z, group: grp, dark, bevel: aw * 0.6 });
    R.capsule(A.kx, A.ky, A.ex, A.ey, aw * 0.88, aw * 0.72, { mat: foreM, base: 3, z: z + 0.4, group: grp, dark, bevel: aw * 0.6 });
    if (D.shortSleeve) {
      // manga corta remangada: tubo de tela hasta medio brazo + puño claro de 2 px
      const k = D.shortSleeve, mx = lerp(A.sx, A.kx, k), my = lerp(A.sy, A.ky, k);
      R.capsule(A.sx, A.sy, mx, my, aw + 0.9, aw + 0.7, { mat: sleeveM, base: 3, z: z + 0.6, group: grp, dark, bevel: aw * 0.6 });
      const cx2 = lerp(A.sx, A.kx, k + 0.06), cy2 = lerp(A.sy, A.ky, k + 0.06);
      R.capsule(lerp(A.sx, A.kx, k - 0.12), lerp(A.sy, A.ky, k - 0.12), cx2, cy2, aw + 1.0, aw + 0.9, { mat: sleeveM, base: 4, z: z + 0.7, group: grp + 'cuff', dark, bevel: 0.8, lineIdx: 1 });
    }
    handPart(R, A, hand, D, z + 1, grp, dark);
  };
  arm(ab, 5, 'armB', 1, pose.handB);
  // la mano lejana puede pasar delante de la cara (visera de 'observe')
  if (pose.backHandFront || pose.backHandZ) for (let k = R.parts.length - 1; k >= 0 && R.parts[k].group === 'armB'; k--) if (R.parts[k].z >= 6) { R.parts[k].z = pose.backHandZ || 81.5; R.parts[k].dark = 0; }
  // ---- cabeza
  const tilt = pose.headTilt || 0;
  const headM = skin;
  R.ellipse(hx, hy, hrx, hry, { mat: headM, base: 4, z: 50, group: 'head', bevel: hrx * 0.45, cast: { on: ['neck', 'torso', 'top'], dx: -1, dy: 2 } }, tilt);
  // mejilla y mandíbula hacia delante-abajo (perfil 3/4)
  const jaw = D.jaw || 'round';
  const jr = jaw === 'square' ? [0.62, 0.5, 0.35] : jaw === 'long' ? [0.55, 0.6, 0.3] : [0.6, 0.48, 0.3];
  R.ellipse(hx + hrx * jr[2], hy + hry * 0.42, hrx * jr[0], hry * jr[1], { mat: headM, base: 4, z: 51, group: 'head', bevel: 2.5, hiT: 0.8 }, tilt + 0.15);
  // nariz (pequeño saliente del perfil)
  const nose = D.noseSize ?? 1;
  if (nose > 0) R.capsule(hx + hrx - 1.2, hy + 1.5, hx + hrx + 0.2 + nose * 0.4, hy + 3.2 + nose * 0.3, 0.7 + nose * 0.15, 0.55, { mat: headM, base: 4, z: 51.5, group: 'head', bevel: 0.6 });
  // oreja
  R.ellipse(hx - hrx * 0.22, hy + 2, 2.1, 3, { mat: headM, base: 3, z: D.earZ ?? 52, group: 'ear', bevel: 1.2 });
  R.stamp((pb) => { const ex = Math.round(hx - hrx * 0.22), ey = Math.round(hy + 2); pb.set(ex, ey, headM.ramp[2]); pb.set(ex, ey + 1, headM.ramp[2]); pb.set(ex - 1, ey - 1, headM.ramp[3]); }, 60);
  // ---- pelo y accesorios de cabeza
  const ho = { hx, hy, rx: hrx, ry: hry, pose, M, tilt, D };
  if (D.hair) D.hair(R, ho);
  // ---- accesorios registrados (mochila, gafas, bolso, casco…)
  const A = Object.assign({}, o, { af, ab, hx, hy, hrx, hry, ho, footY });
  if (D.accessories) for (const acc of D.accessories) if (ACCESSORY[acc.kind]) ACCESSORY[acc.kind](R, A, pose, acc);
  if (D.extra) D.extra(R, Object.assign({ hx, hy }, A));
  // ---- brazo delantero (encima del torso y del pelo largo)
  arm(af, 80, 'armF', 0, pose.handF);
  // ---- cara (plantillas v2)
  R.stamp((pb) => {
    const exprName = pose.expr || opts.expr || D.defaultExpr || 'neutral';
    FACE2.draw(pb, { hx, hy }, EXPR[exprName] ? exprName : 'neutral', D, pose, skin.ramp);
    if (D.freckles) { const c = skin.ramp[3]; pb.set(Math.round(hx + 3), Math.round(hy + 5), c); pb.set(Math.round(hx + 5), Math.round(hy + 6), c); pb.set(Math.round(hx + 7), Math.round(hy + 5), c); }
    if (D.faceStamp) D.faceStamp(pb, { hx, hy, eyeY: Math.round(hy + ((D.face && D.face.eyeY) ?? 0)), e1x: Math.round(hx + ((D.face && D.face.eyeX) ?? 2)), e2x: Math.round(hx + ((D.face && D.face.eye2X) ?? 8)), pose, exprName });
  }, 100);
  // ---- objeto en mano
  if (pose.item) itemPart(R, af, pose, D);
}

/** Bota: caña + empeine + suela; el pie sigue la espinilla al levantarse y queda plano al apoyar */
function bootPart(R, Lg, pose, D, z, group, dark, footY) {
  const sc = D.scale || 1, fl = D.footL * sc, fh = D.footH;
  const shinA = Lg.a1 + Lg.a2;
  const grounded = Lg.ey >= footY - 1.5;
  const extra = group === 'legF' ? pose.footF : pose.footB;
  const rot = grounded ? clamp(shinA * 0.15, -0.15, 0.15) : shinA * 0.7 + (extra || 0);
  const c = Math.cos(-rot), s = Math.sin(-rot);
  const P = ([x, y]) => [Lg.ex + x * c - y * s, Lg.ey + x * s + y * c];
  const M = asMat(D.mat.shoes);
  const tall = D.bootTall ?? 3;
  const pts = [[-2.6, -tall], [1.6, -tall], [2.4, -1.2], [fl - 1.2, -0.4], [fl, fh - 1.2], [fl - 0.6, fh], [-3, fh]].map(P);
  R.poly(pts, { mat: M, base: 3, z, group, dark, bevel: 1.4 });
  // suela oscura + brillo de puntera + cordones + pliegue de calcetín
  const sole = D.sole || null;
  R.stamp((pb) => {
    const [ax, ay] = P([-3, fh - 1]), [bx, by] = P([fl - 0.6, fh - 1]);
    if (sole) pb.line(ax, ay, bx, by, sole);
    const [tx, ty] = P([fl - 1.6, 0.4]); pb.set(Math.round(tx), Math.round(ty), M.ramp[Math.min(M.ramp.length - 1, 5)]);
    if (D.laces) { for (let k = 0; k < 2; k++) { const [lx2, ly2] = P([0.6 + k * 1.6, -1.6 + k * 0.6]); pb.set(Math.round(lx2), Math.round(ly2), D.laces); } }
  }, 90 + z * 0.01);
  if (D.sock) {
    // pliegue de calcetín crema sobre la caña
    const [s0x, s0y] = P([-2.4, -tall - 0.4]), [s1x, s1y] = P([1.6, -tall - 0.4]);
    R.capsule(s0x, s0y, s1x, s1y, 1.05, 1.05, { mat: D.sock, base: 3, z: z + 0.2, group: group + 'sock', dark, bevel: 0.8 });
  }
}
/** Mano 3×3 + pulgar; guantes (D.mat.gloves) y sin dedos (D.fingerless) */
function handPart(R, A, kind, D, z, group, dark) {
  const sc = D.scale || 1, r = (D.handR || 2.2) * sc;
  const dx = A.ex - A.kx, dy = A.ey - A.ky, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
  const hx = A.ex + ux * (r * 0.55), hy = A.ey + uy * (r * 0.55);
  const glove = asMat(D.mat.gloves || D.mat.skin), skin = asMat(D.mat.skin);
  const rot = Math.atan2(uy, ux);
  if (kind === 'visor') {
    // palma horizontal sobre la frente, dedos hacia delante (visera)
    R.capsule(hx - 2.5, hy + 0.8, hx + 1.2, hy + 0.2, r * 0.72, r * 0.62, { mat: glove, base: 4, z, group, bevel: 0.8, dark, cast: { on: ['bangs', 'head', 'hair', 'lock'], dx: -1, dy: 2 } });
    R.capsule(hx + 1.2, hy + 0.2, hx + r + 4.2, hy - 0.2, r * 0.62, r * 0.45, { mat: D.fingerless ? skin : glove, base: 4, z: z + 0.02, group, bevel: 0.7, dark, cast: { on: ['bangs', 'head', 'hair', 'lock'], dx: -1, dy: 2 } });
  } else if (kind === 'point') {
    R.box(hx, hy, r * 0.75, r * 0.7, r * 0.45, { mat: glove, base: 4, z, group, bevel: 0.9, dark }, rot);
    R.capsule(hx, hy, hx + ux * (r + 2.6), hy + uy * (r + 2.6), 0.75, 0.6, { mat: skin, base: 4, z: z + 0.1, group, dark, bevel: 0.6 });
  } else if (kind === 'flat') {
    R.capsule(hx - ux, hy - uy, hx + ux * (r + 1.2), hy + uy * (r + 1.2), r * 0.62, r * 0.5, { mat: glove, base: 4, z, group, bevel: 0.8, dark });
  } else {
    const k = kind === 'fist' ? 0.8 : 0.72;
    R.box(hx, hy, r * k, r * k * 0.95, r * 0.5, { mat: glove, base: 4, z, group, bevel: 0.9, dark }, rot);
    // pulgar
    R.capsule(hx - uy * r * 0.5, hy + ux * r * 0.5, hx - uy * r * 0.7 + ux * r * 0.6, hy + ux * r * 0.7 + uy * r * 0.6, 0.75, 0.6, { mat: D.fingerless ? glove : glove, base: 4, z: z + 0.05, group, dark, bevel: 0.5 });
    if (D.fingerless && kind !== 'fist') R.stamp(pb => { pb.set(Math.round(hx + ux * r * 0.9), Math.round(hy + uy * r * 0.9), skin.ramp[4 - dark]); }, 89);
    if (D.fingerless && kind === 'fist') R.stamp(pb => { const fx = Math.round(hx + ux * r * 0.8 - uy * 0.6), fy = Math.round(hy + uy * r * 0.8 + ux * 0.6); pb.set(fx, fy, skin.ramp[4 - dark]); pb.set(Math.round(fx - uy), Math.round(fy + ux), skin.ramp[3 - dark]); }, 89);
  }
  if (D.wristBand) R.capsule(A.ex - ux * 1.2, A.ey - uy * 1.2, A.ex, A.ey, (D.armW || 2.6) * 0.82, (D.armW || 2.6) * 0.8, { mat: glove, base: 3, z: z - 0.05, group, dark, bevel: 0.7 });
  A.hx = hx; A.hy = hy;
}
function itemPart(R, A, pose, D) {
  const hx = A.hx, hy = A.hy;
  const dx = A.ex - A.kx, dy = A.ey - A.ky, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
  switch (pose.item) {
    case 'scanner': {
      const tx = hx + ux * 5, ty = hy + uy * 5;
      R.capsule(hx - ux, hy - uy, tx, ty, 2.2, 2.7, { mat: RAMP.metal, base: 4, z: 85, group: 'item', bevel: 1.5 });
      R.circle(tx + ux * 1.5, ty + uy * 1.5, 2, { mat: RAMP.cyan, base: 5, z: 86, group: 'item', flat: true });
      R.stamp(pb => { pb.set(Math.round(tx + ux * 1.5), Math.round(ty + uy * 1.5 - 1), '#e6fdff'); }, 121);
      R.anchors.beam = { x: tx + ux * 2.6, y: ty + uy * 2.6, ux, uy, on: pose.beam };
      break;
    }
    case 'vial': R.capsule(hx, hy - 1, hx + 1, hy + 5, 1.5, 1.5, { mat: RAMP.cyan, base: 5, z: 85, group: 'item', bevel: 1 }); R.stamp(pb => pb.set(Math.round(hx), Math.round(hy), '#e6fdff'), 121); break;
    case 'wrench': {
      const tx = hx + ux * 9 - uy * 2.5, ty = hy + uy * 9 + ux * 2.5;
      R.capsule(hx, hy, tx, ty, 1.2, 1.2, { mat: RAMP.metal, base: 5, z: 85, group: 'item', bevel: 1, shiny: true });
      R.circle(tx, ty, 2.7, { mat: RAMP.metal, base: 5, z: 85, group: 'item', bevel: 1 });
      R.stamp(pb => pb.set(Math.round(tx + ux), Math.round(ty + uy), '#141d36'), 121);
      break;
    }
    case 'tablet': R.box(hx + 2.5, hy - 1, 5, 3.8, 1, { mat: RAMP.navy, base: 3, z: 85, group: 'item', bevel: 1 }); R.stamp(pb => { pb.rect(Math.round(hx - 1), Math.round(hy - 3.5), 7, 4, '#56e5ff'); pb.hline(Math.round(hx), Math.round(hx + 4), Math.round(hy - 2), '#a6f4ff'); pb.set(Math.round(hx), Math.round(hy - 3.5), '#e6fdff'); }, 120); break;
    case 'seeds': R.circle(hx + 1, hy + 1, 3.2, { mat: RAMP.soil, base: 5, z: 85, group: 'item', bevel: 2 }); R.stamp(pb => { pb.set(Math.round(hx), Math.round(hy - 1), '#86e36f'); pb.set(Math.round(hx + 2), Math.round(hy), '#ffe14d'); }, 121); break;
    case 'anemometer': {
      R.capsule(hx, hy, hx + ux * 2, hy - 12, 0.8, 0.8, { mat: RAMP.metal, base: 5, z: 85, group: 'item' });
      R.stamp(pb => { const t = (pose.phase || 0) * TAU * 2; const cx = Math.round(hx + ux * 2), cy = Math.round(hy - 12); for (let k = 0; k < 3; k++) { const a = t + k * 2.094; pb.line(cx, cy, cx + Math.cos(a) * 5, cy + Math.sin(a) * 2, '#cfe8ee'); pb.set(Math.round(cx + Math.cos(a) * 5), Math.round(cy + Math.sin(a) * 2), '#ff6b6b'); } }, 121);
      break;
    }
    case 'clipboard': R.box(hx + 2.5, hy, 4.5, 5.8, 0.5, { mat: RAMP.sand, base: 6, z: 85, group: 'item', bevel: 1 }); R.stamp(pb => { for (let i = 0; i < 3; i++) pb.hline(Math.round(hx), Math.round(hx + 5), Math.round(hy - 3 + i * 2.5), '#7e4429'); pb.rect(Math.round(hx + 1), Math.round(hy - 6), 3, 1, '#c8861a'); }, 121); break;
    case 'kite': break;
  }
}

/* =====================================================================
   Registro de accesorios: ACCESSORY[kind](R, A, pose, cfg)
   A = anclas del cuerpo (cx, hipY, waistY, shoulderY, tw, lx, af, ab, hx, hy…)
   ===================================================================== */
const ACCESSORY = {
  /** Mochila grande (cfg: body, flap, strap, buckle, led, bottle) */
  backpack(R, A, pose, cfg) {
    const body = asMat(cfg.body), flap = asMat(cfg.flap || cfg.strap), strap = asMat(cfg.strap || cfg.flap);
    const lag = pose.pack || 0;
    const w = cfg.w || 6.2, h = cfg.h || 8.6;
    const px = A.cx - A.tw * 0.5 - w * 0.62 + A.lx * 0.7, py = A.shoulderY + h * 0.92 + lag;
    const rot = (A.lean || pose.lean || 0) * 0.6;
    R.box(px, py, w, h, 2.4, { mat: body, base: 3, z: 20, group: 'pack', bevel: 2.2, cast: { on: ['torso', 'top'], dx: 1, dy: 1 } }, rot);
    // bolsillo lateral para botella
    R.box(px - w * 0.55, py + h * 0.45, 2.2, 3.2, 1, { mat: body, base: 2, z: 20.5, group: 'packPocket', bevel: 1 }, rot);
    // solapa de cuero
    R.box(px + 0.6 - Math.sin(rot) * h * 0.6, py - h * 0.62, w + 0.8, 3.6, 1.6, { mat: flap, base: 3, z: 21, group: 'flap', bevel: 1.4, shiny: true, cast: { on: ['pack'], dx: -1, dy: 2 } }, rot);
    // correas sobre el pecho
    const sx = A.cx - A.tw * 0.1 + A.lx, sy = A.shoulderY - 0.5;
    R.capsule(sx, sy, A.cx + A.tw * 0.32 + A.lx * 0.45, A.waistY - A.chestH * 0.25, 1.1, 1.0, { mat: strap, base: 3, z: 35, group: 'strap', bevel: 0.8 });
    R.capsule(px + w * 0.4, py - h * 0.75, sx - 0.5, sy + 1, 1.2, 1.1, { mat: strap, base: 3, z: 34, group: 'strap', bevel: 0.8 });
    R.stamp(pb => {
      const c = Math.cos(rot), s = Math.sin(rot);
      const T = (dx, dy) => [Math.round(px + dx * c - dy * s), Math.round(py + dx * s + dy * c)];
      // hebilla amarilla de la solapa
      let [bx, by] = T(w * 0.55, -h * 0.4); pb.set(bx, by, cfg.buckle || '#e6b422'); pb.set(bx, by + 1, '#ffd84a'); pb.set(bx + 1, by, '#8a5e14');
      // LED cian + reflejo
      [bx, by] = T(-w * 0.15, h * 0.05); pb.rect(bx, by, 2, 2, cfg.led || '#56e5ff'); pb.set(bx, by, '#e6fdff');
      // costura vertical y parche
      for (let k = -2; k <= 4; k += 2) { const [qx, qy] = T(w * 0.75, k); pb.set(qx, qy, body.ramp[2]); }
      [bx, by] = T(-w * 0.5, h * 0.55); pb.set(bx, by, '#9ab4be');
      // hebilla de la correa del pecho
      pb.set(Math.round(A.cx + A.tw * 0.2 + A.lx * 0.6), Math.round(A.shoulderY + A.chestH * 0.38), '#ffd84a');
    }, 94);
  },
  /** Gafas de aviador sobre la frente (cfg: frame, lens, strap) */
  goggles(R, A, pose, cfg) {
    const { hx, hy, hrx, hry } = A;
    const frame = asMat(cfg.frame), strap = asMat(cfg.strap || cfg.frame);
    const tilt = (pose.headTilt || 0);
    // correa alrededor de la cabeza por encima del flequillo
    R.capsule(hx - hrx * 0.95, hy - hry * 0.22, hx + hrx * 0.3, hy - hry * 0.7, 1.15, 1.1, { mat: strap, base: 3, z: 60, group: 'gstrap', bevel: 0.8, rim: true });
    // lente lejana (parcialmente oculta) y cercana
    const lx = hx + hrx * 0.42, ly = hy - hry * 0.78 + tilt * 4;
    R.ellipse(lx + 4.2, ly + 0.2, 2.2, 2.4, { mat: frame, base: 3, z: 61, group: 'gog2', bevel: 1, dark: 1 });
    R.ellipse(lx, ly, 3.4, 3.0, { mat: frame, base: 4, z: 62, group: 'gog', bevel: 1.3, shiny: true });
    R.stamp(pb => {
      const L = cfg.lens || RAMP.gogLens;
      const x = Math.round(lx), y = Math.round(ly);
      pb.stampMap(x - 2, y - 2, ['.ab.', 'abbc', 'bbcc', '.cd.'], { a: L[6], b: L[4], c: L[3], d: L[2] });
      pb.set(x - 1, y - 2, '#ffffff');
      pb.set(Math.round(lx + 4), y, L[3]); pb.set(Math.round(lx + 4), y - 1, L[5]);
    }, 96);
  },
  /** Bolso bandolera (cfg: mat, strap) */
  satchel(R, A, pose, cfg) {
    const m = asMat(cfg.mat), st = asMat(cfg.strap || cfg.mat);
    const sx = A.cx - A.tw * 0.3 + A.lx, sy = A.shoulderY;
    const bx = A.cx + A.tw * 0.42, by = A.hipY + 1 + (pose.pack || 0);
    R.capsule(sx, sy, bx - 1, by - 3, 0.95, 0.95, { mat: st, base: 4, z: 36, group: 'sstrap', bevel: 0.7 });
    R.box(bx, by, 3.8, 3.6, 1.3, { mat: m, base: 3, z: 37, group: 'satchel', bevel: 1.5 });
    R.stamp(pb => { pb.hline(Math.round(bx - 3), Math.round(bx + 3), Math.round(by - 1), m.ramp[1]); if (cfg.badge) pb.set(Math.round(bx), Math.round(by + 1), cfg.badge); }, 95);
  },
  /** Casco de obra (cfg: mat, badge) */
  hardhat(R, A, pose, cfg) {
    const { hx, hy, hrx, hry } = A;
    const m = asMat(cfg.mat);
    R.custom(SDF.sub(SDF.ellipse(hx - 0.6, hy - hry * 0.42, hrx * 1.05, hry * 0.78), SDF.box(hx, hy + hry * 0.45, hrx * 2, hry * 0.62, 0)), [hx - hrx - 3, hy - hry - 4, hx + hrx + 3, hy], { mat: m, base: 3, z: 70, group: 'hat', bevel: 3.5, shiny: true, cast: { on: ['head', 'hair', 'ear'], dx: -1, dy: 2 } });
    R.box(hx + 2, hy - hry * 0.18, hrx * 1.22, 1.3, 0.6, { mat: m, base: 3, z: 71, group: 'brim', bevel: 0.9, cast: { on: ['head', 'hair', 'ear'], dx: -1, dy: 2 } });
    R.stamp(pb => { const x = Math.round(hx - 1), y = Math.round(hy - hry * 0.95); pb.vline(x, y, y + 8, m.ramp[5]); if (cfg.badge !== false) { pb.rect(Math.round(hx + 3), Math.round(hy - hry * 0.72), 3, 3, cfg.badge || '#2a4caa'); pb.set(Math.round(hx + 4), Math.round(hy - hry * 0.72 + 1), '#ffffff'); } }, 98);
  },
  /** Gafas de ver (cfg: col) */
  glasses(R, A, pose, cfg) {
    const col = cfg.col || '#3a2a20', D = A.D, F = D.face || {};
    R.stamp(pb => {
      const ex = Math.round(A.hx + (F.eyeX ?? 2)), ey = Math.round(A.hy + (F.eyeY ?? 0));
      const fx = Math.round(A.hx + (F.eye2X ?? 8));
      if (cfg.round) { pb.hline(ex - 1, ex + 2, ey - 2, col); pb.hline(ex - 1, ex + 2, ey + 4, col); pb.vline(ex - 2, ey - 1, ey + 3, col); pb.vline(ex + 3, ey - 1, ey + 3, col); }
      else { pb.hline(ex - 2, ex + 3, ey - 2, col); pb.hline(ex - 2, ex + 3, ey + 3, col); pb.vline(ex - 2, ey - 2, ey + 3, col); pb.vline(ex + 3, ey - 2, ey + 3, col); }
      pb.hline(ex + 4, fx - 1, ey - 1, col); pb.vline(fx, ey - 2, ey + 2, col);
      pb.line(ex - 2, ey - 1, Math.round(A.hx - A.hrx * 0.2), ey - 1, col);
      pb.set(ex + 2, ey - 1, '#e6fdff');
    }, 101);
  },
  /** Gorra (cfg: mat) */
  cap(R, A, pose, cfg) {
    const { hx, hy, hrx, hry } = A, m = asMat(cfg.mat);
    R.custom(SDF.sub(SDF.ellipse(hx - 0.5, hy - hry * 0.35, hrx * 1.0, hry * 0.68), SDF.box(hx, hy + hry * 0.45, hrx * 2, hry * 0.6, 0)), [hx - hrx - 3, hy - hry - 3, hx + hrx + 3, hy], { mat: m, base: 3, z: 70, group: 'hat', bevel: 3, cast: { on: ['head', 'hair', 'ear'], dx: -1, dy: 2 } });
    R.box(hx + hrx * 0.75, hy - hry * 0.18, hrx * 0.55, 1.1, 0.5, { mat: m, base: 2, z: 71, group: 'brim', bevel: 0.8, cast: { on: ['head', 'hair'], dx: -1, dy: 2 } });
    R.stamp(pb => pb.set(Math.round(hx - 1), Math.round(hy - hry * 0.98), m.ramp[5]), 98);
  },
  /** Sombrero de pescador (cfg: mat) */
  bucket(R, A, pose, cfg) {
    const { hx, hy, hrx, hry } = A, m = asMat(cfg.mat);
    R.ellipse(hx - 0.5, hy - hry * 0.72, hrx * 0.85, hry * 0.5, { mat: m, base: 3, z: 70, group: 'hatC', bevel: 2.5 });
    R.ellipse(hx + 0.5, hy - hry * 0.38, hrx * 1.25, 2.4, { mat: m, base: 2, z: 71, group: 'hatB', bevel: 1.2, cast: { on: ['head', 'hair', 'ear'], dx: -1, dy: 2 } });
  },
  /** Gorro de aviador con gafas de cobre */
  aviator(R, A, pose, cfg) {
    const { hx, hy, hrx, hry } = A;
    R.custom(SDF.sub(SDF.ellipse(hx - 0.5, hy - hry * 0.28, hrx * 1.08, hry * 0.9), SDF.ellipse(hx + hrx * 0.62, hy + hry * 0.45, hrx * 0.78, hry * 0.78)), [hx - hrx - 3, hy - hry - 3, hx + hrx + 3, hy + hry], { mat: asMat(cfg.mat || MAT.leather), base: 3, z: 70, group: 'av', bevel: 2.5 });
    R.ellipse(hx + 3.5, hy - hry * 0.8, 2.8, 2.3, { mat: RAMP.copper, base: 5, z: 72, group: 'g1', bevel: 1, shiny: true });
    R.ellipse(hx - 2.5, hy - hry * 0.92, 2.6, 2.2, { mat: RAMP.copper, base: 4, z: 72, group: 'g2', bevel: 1, shiny: true });
  },
  /** Pañuelo de cabeza (cfg: mat) */
  headscarf(R, A, pose, cfg) {
    const { hx, hy, hrx, hry } = A, m = asMat(cfg.mat);
    R.custom(SDF.sub(SDF.ellipse(hx - 1.2, hy - hry * 0.2, hrx * 1.08, hry * 0.98), SDF.ellipse(hx + hrx * 0.6, hy + hry * 0.4, hrx * 0.74, hry * 0.74)), [hx - hrx - 3, hy - hry - 3, hx + hrx + 3, hy + hry + 2], { mat: m, base: 3, z: 70, group: 'scarf', bevel: 2.5, cast: { on: ['head'], dx: -1, dy: 2 } });
    R.strand([[hx - hrx * 0.9, hy + hry * 0.3], [hx - hrx * 1.2, hy + hry * 0.9], [hx - hrx * 1.0, hy + hry * 1.3]], 2.2, 0.6, { mat: m, base: 3, z: 3, group: 'scarfT' });
    R.stamp(pb => { for (let k = 0; k < 4; k++) pb.set(Math.round(hx - 4 + k * 2.5), Math.round(hy - hry * 0.75 + (k % 2)), cfg.dot || '#ffe14d'); }, 98);
  },
  /** Bastón (prop de persona mayor) */
  cane(R, A, pose, cfg) {
    const af = A.af; if (af.hx == null) return;
    R.capsule(af.hx + 0.5, af.hy - 1, af.hx + 2.5, A.footY + 2.5, 0.9, 0.9, { mat: cfg.mat || MAT.leather, base: 4, z: 79, group: 'cane', bevel: 0.6 });
  },
  /** Cesta en el brazo */
  basket(R, A, pose, cfg) {
    const ab = A.ab; if (ab.hx == null) return;
    R.box(ab.hx - 1, ab.hy + 3.5, 4.6, 3.4, 1.5, { mat: cfg.mat || MAT.straw, base: 3, z: 8, group: 'basket', bevel: 1.2, texture: (x, y, idx, ramp) => ((x + y) % 3 === 0 ? ramp[clamp(idx - 1, 1, ramp.length - 1)] : null) });
    R.stamp(pb => { pb.set(Math.round(ab.hx - 3), Math.round(ab.hy + 0.5), '#ff6b6b'); pb.set(Math.round(ab.hx - 1), Math.round(ab.hy + 0.5), '#86e36f'); pb.set(Math.round(ab.hx + 1), Math.round(ab.hy + 1), '#ffe14d'); }, 99);
  },
  /** Caja de herramientas colgando de la mano trasera */
  toolbox(R, A, pose, cfg) {
    const ab = A.ab; if (ab.hx == null) return;
    R.box(ab.hx, ab.hy + 4.5, 4.6, 3, 0.8, { mat: cfg.mat || MAT.safety, base: 3, z: 8, group: 'tbox', bevel: 1 });
    R.stamp(pb => { pb.hline(Math.round(ab.hx - 4), Math.round(ab.hx + 4), Math.round(ab.hy + 3), '#3a1408'); pb.set(Math.round(ab.hx), Math.round(ab.hy + 5), '#cfe8ee'); }, 99);
  },
  /** Regadera en la mano trasera */
  wateringCan(R, A, pose, cfg) {
    const ab = A.ab; if (ab.hx == null) return;
    R.box(ab.hx, ab.hy + 4, 3.6, 3.2, 1.4, { mat: cfg.mat || RAMP.steelW, base: 3, z: 8, group: 'wcan', bevel: 1.2 });
    R.capsule(ab.hx + 3, ab.hy + 3, ab.hx + 7, ab.hy, 0.8, 0.7, { mat: cfg.mat || RAMP.steelW, base: 3, z: 8.1, group: 'wcan', bevel: 0.6 });
  },
  /** Azada al hombro */
  hoe(R, A, pose, cfg) {
    const af = A.af; if (af.hx == null) return;
    R.capsule(af.hx - 9, af.hy + 6, af.hx + 6, af.hy - 14, 0.8, 0.8, { mat: MAT.leather, base: 4, z: 79, group: 'hoe', bevel: 0.6 });
    R.box(af.hx + 7, af.hy - 14, 1.2, 2.8, 0.4, { mat: RAMP.metal, base: 5, z: 79.1, group: 'hoeB', bevel: 0.6 }, 0.6);
  },
  /** Red de pesca al hombro */
  net(R, A, pose, cfg) {
    const ab = A.ab; if (ab.hx == null) return;
    R.ellipse(ab.hx - 3, ab.hy + 2, 4.2, 5.6, { mat: cfg.mat || RAMP.sand, base: 3, z: 4, group: 'net', bevel: 1.5, texture: (x, y, idx, ramp) => (((x + y) & 1) && ((x - y) % 3 === 0) ? ramp[clamp(idx - 2, 1, ramp.length - 1)] : null) });
  },
  /** Caja de cosecha en brazos */
  crate(R, A, pose, cfg) {
    R.box(A.cx + A.tw * 0.55 + A.lx * 0.4, A.waistY - 1, 5, 4, 0.6, { mat: cfg.mat || RAMP.woodR || MAT.leather, base: 3, z: 79, group: 'crate', bevel: 1 });
    R.stamp(pb => { const x = Math.round(A.cx + A.tw * 0.55 + A.lx * 0.4), y = Math.round(A.waistY - 4); pb.set(x - 2, y, '#ff6b6b'); pb.set(x, y - 1, '#86e36f'); pb.set(x + 2, y, '#ff9f43'); }, 99);
  },
};

/* ---------- Sombra de contacto (bandas sólidas, sin tramado) ---------- */
const _shadowCache = new Map();
function charShadow(rx) {
  rx = Math.max(4, Math.round(rx));
  let c = _shadowCache.get(rx);
  if (c) return c;
  c = makeCanvas(rx * 2 + 2, 4);
  const g = c.g;
  for (let y = 0; y < 4; y++) {
    const ry = 1.6, yy = y - 1.5;
    const hw = Math.round((rx + 1) * Math.sqrt(Math.max(0, 1 - (yy * yy) / (ry * ry + 0.6))));
    if (hw <= 0) continue;
    g.fillStyle = 'rgba(26,12,40,0.30)'; g.fillRect(rx + 1 - hw, y, hw * 2, 1);
    const ih = Math.round(hw * 0.68);
    if (ih > 0 && y > 0 && y < 3) { g.fillStyle = 'rgba(26,12,40,0.32)'; g.fillRect(rx + 1 - ih, y, ih * 2, 1); }
  }
  _shadowCache.set(rx, c);
  return c;
}

/* ---------- caché de sprites ---------- */
const SpriteCache = {
  map: new Map(),
  cap: 1600,
  env: null,            // ambiente por defecto para la luz de borde (p. ej. 'coast', 'night', 'calima')
  queue: [],
  _lastPump: -1,
  _warmed: new Set(),
  key(charId, anim, frame, opts) {
    return charId + '|' + anim + '|' + frame + '|' + (opts.expr || '') + '|' + (opts.mouth || '') + '|' + (opts.variant ?? '') + '|' + (opts.item || '') + '|' + (opts.env || this.env || '');
  },
  get(charId, anim, frame, opts = {}) {
    const k = this.key(charId, anim, frame, opts);
    let c = this.map.get(k);
    if (!c) {
      const def = CHARS[charId];
      const A = ANIMS[anim] || ANIMS.idle;
      const t = (frame % A.frames) / A.frames;
      const o2 = (opts.env || !this.env) ? opts : Object.assign({}, opts, { env: this.env });
      const pb = def.render(anim, t, o2);
      c = pb.toCanvas();
      c.anchors = pb.anchors;
      this.map.set(k, c);
      if (this.map.size > this.cap) { const first = this.map.keys().next().value; this.map.delete(first); }
    } else if (this.map.size > this.cap * 0.75) { this.map.delete(k); this.map.set(k, c); }
    return c;
  },
  /** Encola todos los cuadros de (id × anims × exprs) para generarlos poco a poco con pump() */
  warm(id, anims = ['idle', 'walk', 'run', 'jump', 'fall', 'land'], exprs = [null], extra = {}) {
    if (!CHARS[id]) return;
    for (const a of anims) {
      const A = ANIMS[a]; if (!A) continue;
      for (const e of exprs) for (let f = 0; f < A.frames; f++) this.queue.push([id, a, f, Object.assign({}, extra, e ? { expr: e } : {})]);
    }
  },
  /** Genera cuadros encolados hasta agotar budgetMs. Devuelve cuántos quedan. */
  pump(budgetMs = 3) {
    const t0 = nowMs();
    while (this.queue.length && nowMs() - t0 < budgetMs) {
      const [id, a, f, o] = this.queue.shift();
      if (!this.map.has(this.key(id, a, f, o))) this.get(id, a, f, o);
    }
    return this.queue.length;
  },
};

/* Personajes registrados (se definen en 11_chars.js) */
const CHARS = {};

/** Dibuja personaje: (x,y) = pies en el mundo (coordenadas de pantalla) */
function drawChar(g, charId, anim, time, x, y, facing = 1, opts = {}) {
  const def = CHARS[charId];
  if (!def) return;
  // calentamiento automático del set de movimiento la primera vez que aparece un personaje
  if (!SpriteCache._warmed.has(charId)) { SpriteCache._warmed.add(charId); SpriteCache.warm(charId, def.warmAnims || ['idle', 'walk', 'run', 'jump', 'fall', 'land']); }
  if (typeof Game !== 'undefined' && Game.frame !== SpriteCache._lastPump) { SpriteCache._lastPump = Game.frame; if (SpriteCache.queue.length) SpriteCache.pump(2); }
  const A = ANIMS[anim] || ANIMS.idle;
  let frame = Math.floor(time * A.fps * (opts.speed || 1));
  frame = A.loop ? frame % A.frames : Math.min(frame, A.frames - 1);
  const c = SpriteCache.get(charId, anim, frame, opts);
  const ox = def.ox ?? 30, oy = def.oy ?? 78;
  const dx = Math.round(x), dy = Math.round(y);
  if (opts.shadow !== false && def.shadow !== false) {
    const rx = (c.anchors && c.anchors.shadowR) || def.shadowR || 9;
    const sh = charShadow(rx);
    g.drawImage(sh, dx - (sh.width >> 1), dy - 2);
  }
  if (facing < 0) { g.save(); g.translate(dx, 0); g.scale(-1, 1); g.drawImage(c, -ox - 1, dy - oy); g.restore(); }
  else g.drawImage(c, dx - ox, dy - oy);
  // rayo de escáner (dinámico)
  if (c.anchors && c.anchors.beam && opts.beam !== false) {
    const b = c.anchors.beam;
    const bx = facing < 0 ? dx + ox + 1 - b.x : dx - ox + b.x, by = dy - oy + b.y;
    drawScanBeam(g, bx, by, facing, opts.beamLen || 46);
  }
}
/** Haz del escáner: cono en bandas sólidas translúcidas + chispas (sin tramado) */
function drawScanBeam(g, x, y, facing, len) {
  const t = Game.time;
  g.save();
  for (let i = 0; i < len; i += 2) {
    const spread = i * 0.28;
    const xx = Math.round(x + facing * i) - (facing < 0 ? 1 : 0);
    g.globalAlpha = 0.42 * (1 - i / len);
    g.fillStyle = '#56e5ff'; g.fillRect(xx, Math.round(y - spread), 2, Math.max(1, Math.round(spread * 2)));
    g.globalAlpha = 0.5 * (1 - i / len);
    g.fillStyle = '#c4fbff'; g.fillRect(xx, Math.round(y), 2, 1);
  }
  g.globalAlpha = 1;
  for (let i = 0; i < len; i += 7) {
    const k = (i + Math.floor(t * 40)) % 14;
    if (k < 2) fpx(g, Math.round(x + facing * i), Math.round(y + Math.sin(i * 0.7 + t * 6) * i * 0.28), '#e6fdff');
  }
  g.restore();
}
