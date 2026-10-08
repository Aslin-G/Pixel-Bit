/* =====================================================================
   10_rig.js — Rig de personajes por SDF rasterizado a píxel.
   Cada parte es un campo de distancia con bisel → normal → luz en
   bandas discretas de una rampa (sin antialiasing). Luego:
   líneas internas entre partes solapadas, sellos de detalle (ojos,
   costuras), contorno selectivo y caché por fotograma.
   ===================================================================== */

const LIGHT = (() => { const l = [-0.55, -0.7, 0.62]; const n = Math.hypot(...l); return l.map(v => v / n); })();

/* ---------- SDF básicos ---------- */
const SDF = {
  circle: (cx, cy, r) => (x, y) => Math.hypot(x - cx, y - cy) - r,
  ellipse: (cx, cy, rx, ry, rot = 0) => {
    const c = Math.cos(-rot), s = Math.sin(-rot);
    return (x, y) => {
      const dx = x - cx, dy = y - cy;
      const lx = dx * c - dy * s, ly = dx * s + dy * c;
      const k = Math.hypot(lx / rx, ly / ry);
      return (k - 1) * Math.min(rx, ry);
    };
  },
  capsule: (ax, ay, bx, by, ra, rb = ra) => {
    const vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy || 1e-6;
    return (x, y) => {
      const t = clamp(((x - ax) * vx + (y - ay) * vy) / L2, 0, 1);
      const cx = ax + vx * t, cy = ay + vy * t;
      return Math.hypot(x - cx, y - cy) - lerp(ra, rb, t);
    };
  },
  box: (cx, cy, hw, hh, r = 0, rot = 0) => {
    const c = Math.cos(-rot), s = Math.sin(-rot);
    return (x, y) => {
      const dx = x - cx, dy = y - cy;
      const lx = Math.abs(dx * c - dy * s) - (hw - r), ly = Math.abs(dx * s + dy * c) - (hh - r);
      return Math.hypot(Math.max(lx, 0), Math.max(ly, 0)) + Math.min(Math.max(lx, ly), 0) - r;
    };
  },
  poly: (pts) => (x, y) => {
    let d = Infinity, inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [ax, ay] = pts[j], [bx, by] = pts[i];
      const vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy || 1e-6;
      const t = clamp(((x - ax) * vx + (y - ay) * vy) / L2, 0, 1);
      d = Math.min(d, Math.hypot(x - ax - vx * t, y - ay - vy * t));
      if ((ay > y) !== (by > y) && x < ax + (y - ay) / (by - ay) * vx) inside = !inside;
    }
    return inside ? -d : d;
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

/* ---------- Constructor de figuras ---------- */
class Rig {
  constructor(w, h) { this.w = w; this.h = h; this.parts = []; this.stamps = []; this.anchors = {}; this.zc = 0; }
  /** opts: ramp, base(índice), bevel, z, group, shiny, flatten, lineIdx, noLine, light(+/-índice) */
  add(sdf, bbox, opts) { this.parts.push(Object.assign({ sdf, bbox, z: this.zc++, bevel: 3, base: 3, group: 'g' + this.parts.length, shiny: false, flatten: 1, dark: 0 }, opts)); return this; }
  ellipse(cx, cy, rx, ry, opts, rot = 0) { const m = Math.max(rx, ry) + 1; return this.add(SDF.ellipse(cx, cy, rx, ry, rot), [cx - m, cy - m, cx + m, cy + m], Object.assign({ bevel: Math.min(rx, ry) }, opts)); }
  circle(cx, cy, r, opts) { return this.add(SDF.circle(cx, cy, r), [cx - r - 1, cy - r - 1, cx + r + 1, cy + r + 1], Object.assign({ bevel: r }, opts)); }
  capsule(ax, ay, bx, by, ra, rb, opts) {
    const m = Math.max(ra, rb) + 1;
    return this.add(SDF.capsule(ax, ay, bx, by, ra, rb), [Math.min(ax, bx) - m, Math.min(ay, by) - m, Math.max(ax, bx) + m, Math.max(ay, by) + m], Object.assign({ bevel: Math.max(ra, rb) }, opts));
  }
  box(cx, cy, hw, hh, r, opts, rot = 0) { const m = Math.hypot(hw, hh) + 1; return this.add(SDF.box(cx, cy, hw, hh, r, rot), [cx - m, cy - m, cx + m, cy + m], opts); }
  poly(pts, opts) { return this.add(SDF.poly(pts), polyBBox(pts), opts); }
  custom(sdf, bbox, opts) { return this.add(sdf, bbox, opts); }
  /** Sello: función(pb, anchors) ejecutada tras sombrear (detalles a mano) */
  stamp(fn, z = 1e9) { this.stamps.push({ fn, z }); return this; }

  render(opt = {}) {
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
          // normal: borde → lateral, interior → frontal
          let nx = gx / gl * (1 - k), ny = gy / gl * (1 - k), nz = k * p.flatten + (1 - p.flatten) * 0.9;
          const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
          let dd = nx * L[0] + ny * L[1] + nz * L[2];
          if (p.tilt) dd += p.tilt;
          if (dd < -0.2) idx -= 2; else if (dd < 0.36) idx -= 1; else if (dd > 0.94 && p.shiny) idx += 2; else if (dd > 0.74) idx += 1;
          if (p.ao) { const ao = p.ao(sx, sy); idx -= ao; }
          idx -= p.dark;
          col = ramp[clamp(idx, 1, n - 1)];
          if (p.texture) col = p.texture(x, y, idx, ramp, col) || col;
        }
        pb.data[y * W2 + x] = U(col);
        zb[y * W2 + x] = pi;
        if (ib) ib[y * W2 + x] = p.flat ? p.base : clamp(idx, 1, n - 1);
      }
    });
    // sombras proyectadas: parte con cast:{on:[grupos], dx, dy} oscurece en 1 tono a las partes destino
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
    // líneas internas: el píxel de una parte trasera junto a una delantera de otro grupo se oscurece
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
    // sellos de detalle
    this.stamps.sort((a, b) => a.z - b.z).forEach(s => s.fn(pb, this.anchors));
    // contorno selectivo
    if (opt.outline !== false) {
      const oc = opt.outlineColor;
      pb.outline(oc ? oc : (nb) => darkOf(nb, -0.62));
    }
    return pb;
  }
}

/* ---------- Cinemática: extremidad de dos segmentos ---------- */
function limb(x, y, a1, l1, a2, l2) {
  // ángulo 0 = hacia abajo; positivo = hacia delante (derecha)
  const kx = x + Math.sin(a1) * l1, ky = y + Math.cos(a1) * l1;
  const ex = kx + Math.sin(a1 + a2) * l2, ey = ky + Math.cos(a1 + a2) * l2;
  return { kx, ky, ex, ey };
}

/* ---------- Ojos y bocas (sellos pixel a pixel) ---------- */
const FACE = {
  /** ojo pequeño de sprite: (x,y) esquina superior izquierda, w 2-3, h 3-4 */
  eye(pb, x, y, expr, o) {
    const ink = o.ink || '#1a0f20', iris = o.iris || '#3a2233', hi = '#ffffff', lash = o.lash || ink;
    x = Math.round(x); y = Math.round(y);
    const w = o.w || 2, h = o.h || 4;
    switch (expr) {
      case 'blink': pb.hline(x, x + w - 1, y + h - 2, lash); break;
      case 'happy': pb.set(x, y + 2, lash); pb.hline(x + 1, x + w - 2 + 1, y + 1, lash); pb.set(x + w, y + 2, lash); break;
      case 'closed': pb.hline(x, x + w, y + h - 1, lash); pb.set(x - 1, y + h - 2, lash); break;
      case 'surprised':
        pb.rect(x, y - 1, w, h + 1, ink); pb.set(x, y, hi); pb.set(x + w - 1, y + h - 1, iris); break;
      case 'half':
        pb.hline(x - 1, x + w, y + 1, lash); pb.rect(x, y + 2, w, h - 2, ink); pb.set(x + w - 1, y + 2, iris); break;
      case 'angry':
        pb.rect(x, y + 1, w, h - 1, ink); pb.set(x, y + 1, hi); pb.set(x + w - 1, y + h - 1, iris); break;
      case 'sad':
        pb.rect(x, y + 1, w, h - 1, ink); pb.set(x, y + 1, hi); pb.set(x + w - 1, y + h - 1, iris); pb.set(x - 1, y + h, o.tear ? '#a6f4ff' : ink); break;
      default:
        pb.rect(x, y, w, h, ink); pb.set(x, y, hi); if (h > 3) pb.set(x + w - 1, y + h - 1, iris); if (w > 2) pb.set(x + 1, y + h - 1, iris);
    }
  },
  brow(pb, x, y, expr, col, w = 3, flip = false) {
    x = Math.round(x); y = Math.round(y);
    // flip=false: ceja del ojo cercano (interior a la derecha)
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

/* expresiones: {eyes, brows, mouth} */
const EXPR = {
  neutral: { eyes: 'open', brows: 'neutral', mouth: 'line' },
  happy: { eyes: 'happy', brows: 'neutral', mouth: 'smile' },
  joy: { eyes: 'happy', brows: 'surprised', mouth: 'grin' },
  smile: { eyes: 'open', brows: 'neutral', mouth: 'smile' },
  surprised: { eyes: 'surprised', brows: 'surprised', mouth: 'o' },
  worried: { eyes: 'open', brows: 'worried', mouth: 'wavy' },
  sad: { eyes: 'sad', brows: 'sad', mouth: 'frown' },
  angry: { eyes: 'angry', brows: 'angry', mouth: 'frown' },
  determined: { eyes: 'angry', brows: 'determined', mouth: 'flat' },
  thinking: { eyes: 'half', brows: 'skeptical', mouth: 'flat' },
  skeptical: { eyes: 'half', brows: 'skeptical', mouth: 'smirk' },
  guilty: { eyes: 'sad', brows: 'guilty', mouth: 'flat' },
  calm: { eyes: 'half', brows: 'neutral', mouth: 'smile' },
  scared: { eyes: 'surprised', brows: 'worried', mouth: 'wavy' },
  tired: { eyes: 'half', brows: 'sad', mouth: 'flat' },
};

/* =====================================================================
   Animación procedimental: genera pose a partir de (anim, fase t∈[0,1))
   ===================================================================== */
const ANIMS = {
  idle: { frames: 8, fps: 6, loop: true },
  walk: { frames: 8, fps: 11, loop: true },
  run: { frames: 8, fps: 15, loop: true },
  jump: { frames: 2, fps: 8, loop: true },
  fall: { frames: 2, fps: 8, loop: true },
  land: { frames: 3, fps: 14, loop: false },
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
};

function poseFor(anim, t, ch) {
  const S = Math.sin, C = Math.cos, P = TAU * t;
  const p = {
    bob: 0, lean: 0, headTilt: 0, headDX: 0, headDY: 0,
    hipF: 0, kneeF: 0, hipB: 0, kneeB: 0, footF: 0, footB: 0,
    shF: 0.1, elF: 0.25, shB: -0.1, elB: 0.25, handF: 'open', handB: 'open',
    expr: null, mouth: null, blink: false, hairSwing: 0, squash: 0, item: null, beam: 0,
    crouch: 0, eyeDY: 0,
  };
  const energetic = ch.energetic ?? 1;
  switch (anim) {
    case 'idle': {
      p.bob = Math.round((S(P) * 0.5 + 0.5) * 1);
      p.shF = 0.12 + S(P) * 0.03; p.shB = -0.12 - S(P) * 0.03;
      p.elF = 0.3; p.elB = 0.3;
      p.headTilt = S(P) * 0.02; p.hairSwing = S(P) * 0.6;
      p.hipF = 0.08; p.hipB = -0.06; p.kneeF = -0.02; p.kneeB = 0.02;
      p.blink = (t > 0.8 && t < 0.92);
      break;
    }
    case 'walk': case 'wade': {
      const sw = anim === 'wade' ? 0.35 : 0.5;
      p.hipF = S(P) * sw; p.hipB = -S(P) * sw;
      p.kneeF = -Math.max(0, -C(P)) * 0.8 - 0.05; p.kneeB = -Math.max(0, C(P)) * 0.8 - 0.05;
      p.footF = S(P) * 0.2; p.footB = -S(P) * 0.2;
      p.shF = -S(P) * 0.45; p.shB = S(P) * 0.45; p.elF = 0.35; p.elB = 0.35;
      p.bob = Math.round(Math.abs(C(P)) * 1.5); p.lean = 0.04 * energetic; p.hairSwing = -1 + S(P * 2) * 0.6;
      break;
    }
    case 'run': {
      p.hipF = S(P) * 0.85; p.hipB = -S(P) * 0.85;
      p.kneeF = -Math.max(0, -C(P)) * 1.6 - 0.15; p.kneeB = -Math.max(0, C(P)) * 1.6 - 0.15;
      p.footF = S(P) * 0.35; p.footB = -S(P) * 0.35;
      p.shF = -S(P) * 0.9; p.shB = S(P) * 0.9; p.elF = 1.4; p.elB = 1.4;
      p.bob = Math.round(Math.abs(C(P)) * 2.5) - 1; p.lean = 0.14 * energetic; p.hairSwing = -2.5 + S(P * 2);
      p.handF = 'fist'; p.handB = 'fist';
      break;
    }
    case 'jump': {
      p.hipF = 0.7; p.kneeF = -1.2; p.hipB = -0.25; p.kneeB = -0.5;
      p.shF = 2.5 + S(P) * 0.1; p.elF = 0.3; p.shB = -0.7; p.elB = 0.6; p.hairSwing = 2.5; p.lean = 0.05; p.expr = ch.jumpExpr || null;
      break;
    }
    case 'fall': {
      p.hipF = 0.3; p.kneeF = -0.5; p.hipB = -0.4; p.kneeB = -0.3;
      p.shF = 1.9 + S(P) * 0.2; p.elF = 0.4; p.shB = 2.4 - S(P) * 0.2; p.elB = 0.4; p.hairSwing = -3; p.lean = -0.03;
      break;
    }
    case 'land': {
      const k = 1 - t;
      p.crouch = Math.round(4 * k); p.hipF = 0.5 * k; p.kneeF = -1.0 * k; p.hipB = 0.3 * k; p.kneeB = -0.9 * k;
      p.shF = 0.5 * k; p.shB = 0.3 * k; p.elF = 0.5; p.elB = 0.5; p.hairSwing = 2 * k; p.lean = 0.12 * k;
      break;
    }
    case 'scan': {
      p.shF = 1.45 + S(P) * 0.05; p.elF = 0.15; p.item = 'scanner'; p.beam = 1;
      p.shB = 0.3; p.elB = 1.2; p.headTilt = 0.04 + S(P) * 0.02; p.bob = Math.round(S(P) * 0.5 + 0.5);
      p.hipF = 0.15; p.hipB = -0.1; p.expr = 'thinking';
      break;
    }
    case 'sample': {
      const k = S(Math.min(1, t * 1.6) * Math.PI / 2);
      p.crouch = Math.round(9 * k); p.lean = 0.35 * k; p.hipF = 1.1 * k; p.kneeF = -1.9 * k; p.hipB = 0.2 * k; p.kneeB = -1.5 * k;
      p.shF = 0.6 * k + 0.1; p.elF = 0.2; p.shB = 0.2; p.elB = 0.8; p.item = 'vial'; p.headTilt = 0.15 * k;
      break;
    }
    case 'repair': {
      p.shF = 1.0 + S(P) * 0.5; p.elF = 0.9 + S(P) * 0.4; p.item = 'wrench'; p.shB = 0.6; p.elB = 1.1;
      p.lean = 0.1; p.bob = Math.round(Math.abs(S(P))); p.expr = 'determined'; p.hipF = 0.25; p.kneeF = -0.2;
      break;
    }
    case 'program': {
      p.shF = 0.7 + S(P * 2) * 0.06; p.elF = 1.4; p.shB = 0.6; p.elB = 1.6 + S(P * 2 + 1) * 0.06; p.item = 'tablet';
      p.headTilt = 0.12; p.expr = 'thinking';
      break;
    }
    case 'talk': {
      p.shF = 0.15 + Math.max(0, S(P)) * 0.9; p.elF = 0.6 + Math.max(0, S(P)) * 0.6; p.shB = -0.12; p.elB = 0.3;
      p.mouth = (Math.floor(t * 6) % 2) ? 'talk' : null; p.headTilt = S(P) * 0.03; p.bob = Math.round(S(P) * 0.5 + 0.5);
      break;
    }
    case 'celebrate': {
      const up = Math.max(0, S(P));
      p.bob = -Math.round(up * 6); p.shF = 2.9; p.elF = 0.2 + S(P * 2) * 0.2; p.shB = 2.5 + S(P) * 0.3; p.elB = 0.3;
      p.hipF = 0.4 * up; p.kneeF = -0.8 * up; p.hipB = -0.2 * up; p.kneeB = -0.6 * up; p.expr = 'joy'; p.hairSwing = 2 * up; p.handF = 'fist';
      break;
    }
    case 'frustrate': {
      p.shF = 2.7; p.elF = 2.3 + S(P * 2) * 0.1; p.shB = 2.5; p.elB = 2.3; p.expr = 'angry'; p.headTilt = -0.06 + S(P * 2) * 0.05;
      p.bob = Math.round(Math.abs(S(P * 2))); p.hipF = Math.abs(S(P)) * 0.4; p.kneeF = -Math.abs(S(P)) * 0.6;
      break;
    }
    case 'tool': {
      p.shF = 1.5; p.elF = 0; p.item = ch.tool || 'scanner'; p.beam = 0.5 + 0.5 * S(P); p.shB = 0.3; p.elB = 0.9; p.lean = 0.05;
      p.hipF = 0.25; p.hipB = -0.15; p.expr = 'determined';
      break;
    }
    case 'hit': {
      p.lean = -0.25 * (1 - t); p.shF = 1.2; p.shB = 1.6; p.elF = 0.8; p.elB = 0.8; p.expr = 'surprised'; p.hairSwing = 3; p.hipF = 0.2; p.kneeF = -0.3; p.squash = 1;
      break;
    }
    case 'help': {
      p.shF = 1.35 * Math.min(1, t * 2); p.elF = 0.05; p.lean = 0.12; p.shB = 0.1; p.elB = 0.4; p.expr = 'smile'; p.hipF = 0.3; p.kneeF = -0.15;
      break;
    }
    case 'climb': {
      p.shF = 2.6 + S(P) * 0.4; p.shB = 2.6 - S(P) * 0.4; p.elF = 0.6; p.elB = 0.6;
      p.hipF = 0.6 + S(P) * 0.4; p.kneeF = -1.2; p.hipB = 0.6 - S(P) * 0.4; p.kneeB = -1.2; p.handF = 'fist'; p.handB = 'fist'; p.back = true;
      break;
    }
    case 'sit': {
      p.crouch = 13; p.hipF = 1.5; p.kneeF = -1.55; p.hipB = 1.4; p.kneeB = -1.5; p.shF = 0.3; p.elF = 1.0; p.shB = 0.2; p.elB = 1.0; p.bob = Math.round(S(P) * 0.5 + 0.5); p.blink = t > 0.75;
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
      break;
    }
  }
  return p;
}

/* =====================================================================
   Constructor humanoide genérico 3/4 mirando a la derecha.
   Lienzo 64x80, pies en y≈78, centro x=30.
   ===================================================================== */
function buildHumanoid(R, D, pose, opts = {}) {
  const cx = 30 + (D.dx || 0);
  const crouch = pose.crouch || 0;
  const lean = pose.lean || 0;
  const scale = D.scale || 1;
  const legL1 = D.thigh * scale, legL2 = D.shin * scale;
  const hipY = 78 - D.footH - legL1 - legL2 + crouch + pose.bob;
  const footY = 78 - D.footH;
  // pelvis
  const pelvis = { x: cx, y: hipY };
  const waistY = hipY - D.pelvisH;
  const chestY = waistY - D.chestH * 0.5;
  const shoulderY = waistY - D.chestH + 2;
  const neckX = cx + Math.sin(lean) * (D.chestH + 4);
  const neckY = shoulderY - 1;
  const headCX = neckX + 1 + (pose.headDX || 0) + Math.sin(lean) * 2, headCY = neckY - D.headRY + 1 + (pose.headDY || 0);
  R.anchors = { cx, hipY, waistY, chestY, shoulderY, neckX, neckY, head: { x: headCX, y: headCY, rx: D.headRX, ry: D.headRY, tilt: pose.headTilt }, lean, pose };
  const M = D.mat;
  // ---- piernas: IK simplificada con ángulos de pose
  const hipFX = cx + 2, hipBX = cx - 2;
  const lf = limb(hipFX, hipY + 1, pose.hipF, legL1, pose.kneeF, legL2);
  const lb = limb(hipBX, hipY + 1, pose.hipB, legL1, pose.kneeB, legL2);
  // si el pie quedaría bajo el suelo, levanta ligeramente
  const clampFoot = (L) => { if (L.ey > footY) L.ey = footY; return L; };
  clampFoot(lf); clampFoot(lb);
  R.anchors.legF = lf; R.anchors.legB = lb;
  const legMat = M.legs, legW = D.legW;
  // pierna trasera
  R.capsule(hipBX, hipY + 1, lb.kx, lb.ky, legW, legW * 0.9, { ramp: legMat, base: 3, z: 10, group: 'legB', dark: 1 });
  R.capsule(lb.kx, lb.ky, lb.ex, lb.ey, legW * 0.9, legW * 0.75, { ramp: D.shinMat || legMat, base: 3, z: 11, group: 'legB', dark: 1 });
  footPart(R, lb.ex, lb.ey, pose.footB, D, 12, 'legB', 1);
  // pierna delantera
  R.capsule(hipFX, hipY + 1, lf.kx, lf.ky, legW, legW * 0.9, { ramp: legMat, base: 3, z: 40, group: 'legF' });
  R.capsule(lf.kx, lf.ky, lf.ex, lf.ey, legW * 0.9, legW * 0.75, { ramp: D.shinMat || legMat, base: 3, z: 41, group: 'legF' });
  footPart(R, lf.ex, lf.ey, pose.footF, D, 42, 'legF', 0);
  // ---- torso
  const tw = D.torsoW, th = D.chestH;
  const lx = Math.sin(lean) * th;
  const torsoPts = [
    [cx - tw * 0.55 + lx * 0.95, shoulderY - 1], [cx + tw * 0.62 + lx, shoulderY],
    [cx + tw * 0.58 + lx * 0.4, waistY], [cx + tw * 0.62, hipY + 2],
    [cx - tw * 0.6, hipY + 2], [cx - tw * 0.5 + lx * 0.4, waistY],
  ];
  if (D.torso) D.torso(R, { cx, hipY, waistY, shoulderY, tw, lx, pose, M, torsoPts });
  else R.poly(torsoPts, { ramp: M.top, base: 3, z: 30, group: 'torso', bevel: 4 });
  // cuello
  R.capsule(neckX - 1, neckY + 3, headCX - 1, headCY + D.headRY - 3, 2.6, 2.6, { ramp: M.skin, base: 2, z: 29, group: 'neck', bevel: 2 });
  // ---- brazos
  const shFX = cx + tw * 0.38 + lx, shBX = cx - tw * 0.38 + lx * 0.9;
  const armL1 = D.upperArm, armL2 = D.foreArm;
  const af = limb(shFX, shoulderY + 2, pose.shF, armL1, pose.elF, armL2);
  const ab = limb(shBX, shoulderY + 2, pose.shB, armL1, pose.elB, armL2);
  R.anchors.armF = af; R.anchors.armB = ab;
  const sleeve = M.sleeve || M.top;
  R.capsule(shBX, shoulderY + 2, ab.kx, ab.ky, D.armW, D.armW * 0.9, { ramp: sleeve, base: 3, z: 5, group: 'armB', dark: 1 });
  R.capsule(ab.kx, ab.ky, ab.ex, ab.ey, D.armW * 0.9, D.armW * 0.75, { ramp: D.foreMat || sleeve, base: 3, z: 6, group: 'armB', dark: 1 });
  handPart(R, ab, pose.handB, D, 7, 'armB', 1);
  R.capsule(shFX, shoulderY + 2, af.kx, af.ky, D.armW, D.armW * 0.9, { ramp: sleeve, base: 3, z: 80, group: 'armF' });
  R.capsule(af.kx, af.ky, af.ex, af.ey, D.armW * 0.9, D.armW * 0.75, { ramp: D.foreMat || sleeve, base: 3, z: 81, group: 'armF' });
  handPart(R, af, pose.handF, D, 82, 'armF', 0);
  // ---- cabeza
  const hx = headCX, hy = headCY;
  const tilt = pose.headTilt || 0;
  R.ellipse(hx, hy, D.headRX, D.headRY, { ramp: M.skin, base: 4, z: 50, group: 'head', bevel: D.headRX * 0.8 }, tilt);
  // mandíbula / mejilla hacia delante
  R.ellipse(hx + D.headRX * 0.35, hy + D.headRY * 0.45, D.headRX * 0.62, D.headRY * 0.5, { ramp: M.skin, base: 4, z: 51, group: 'head', bevel: 4 }, tilt);
  // oreja
  R.ellipse(hx - D.headRX * 0.42, hy + 1.5, 1.8, 2.4, { ramp: M.skin, base: 3, z: 52, group: 'ear', bevel: 1.5 });
  // pelo y accesorios específicos
  if (D.hair) D.hair(R, { hx, hy, rx: D.headRX, ry: D.headRY, pose, M, tilt });
  if (D.extra) D.extra(R, { cx, hipY, waistY, shoulderY, tw, lx, pose, M, af, ab, hx, hy, lf, lb });
  // ---- cara (sellos)
  R.stamp((pb) => {
    const exprName = pose.blink ? null : (pose.expr || opts.expr || 'neutral');
    const E = EXPR[exprName] || EXPR.neutral;
    const eyeY = Math.round(hy + D.eyeY);
    const e1x = Math.round(hx + D.eye1X), e2x = Math.round(hx + D.eye2X);
    const eo = { ink: D.eyeInk || '#1a0f20', iris: D.iris || '#5a3354', lash: D.lash || '#140a18', w: 2, h: D.eyeH || 4 };
    const eyeExpr = pose.blink ? 'blink' : E.eyes;
    FACE.eye(pb, e1x, eyeY, eyeExpr, eo);
    FACE.eye(pb, e2x, eyeY, eyeExpr, Object.assign({}, eo, { w: D.eye2W || 2 }));
    const bc = D.browCol || M.hair[1];
    if (!D.noBrows) { FACE.brow(pb, e1x - 1, eyeY - 2, E.brows, bc, 3, false); FACE.brow(pb, e2x, eyeY - 2, E.brows, bc, 2, true); }
    const mk = pose.mouth || E.mouth;
    FACE.mouth(pb, Math.round(hx + D.mouthX), Math.round(hy + D.mouthY), mk, { ink: D.mouthInk || '#4a1a20' });
    if (D.blush && (exprName === 'happy' || exprName === 'joy' || exprName === 'smile')) { pb.set(e1x - 1, eyeY + D.eyeH + 1, D.blush); pb.set(e1x, eyeY + D.eyeH + 1, D.blush); }
    if (D.freckles) { pb.set(e1x - 2, eyeY + 4, M.skin[3]); pb.set(e1x + 2, eyeY + 5, M.skin[3]); pb.set(e2x + 1, eyeY + 4, M.skin[3]); }
    if (D.nose !== false) pb.set(Math.round(hx + D.headRX * 0.86), Math.round(hy + D.eyeY + 3), M.skin[2]);
    if (D.faceStamp) D.faceStamp(pb, { hx, hy, eyeY, e1x, e2x, pose, exprName });
  }, 100);
  // ---- objeto en mano
  if (pose.item) itemPart(R, af, pose, D);
}

function footPart(R, x, y, ang, D, z, group, dark) {
  const fl = D.footL, fh = D.footH + 1;
  const a = ang || 0;
  const pts = [[x - 2.5, y - 2], [x + 1, y - 2.5], [x + fl * Math.cos(a), y - 1 + fl * Math.sin(a) * 0.5], [x + fl * Math.cos(a) + 0.5, y + fh - 1], [x - 3, y + fh]];
  R.poly(pts, { ramp: D.mat.shoes, base: 3, z, group, bevel: 1.5, dark });
  if (D.sole) R.stamp((pb) => { for (let k = 0; k < 2; k++) { const yy = Math.round(y + fh - 1) - k; let n = 0; for (let xx = Math.round(x - 4); xx <= Math.round(x + fl + 1); xx++) if (pb.alpha(xx, yy) && !pb.alpha(xx, yy + 1)) { pb.set(xx, yy, D.sole); n++; } if (n) break; } }, 90 + z * 0.01);
}
function handPart(R, A, kind, D, z, group, dark) {
  const r = D.handR || 2.2;
  const dx = A.ex - A.kx, dy = A.ey - A.ky, l = Math.hypot(dx, dy) || 1;
  const hx = A.ex + dx / l * 1.2, hy = A.ey + dy / l * 1.2;
  const mat = D.mat.gloves || D.mat.skin;
  if (kind === 'point') {
    R.circle(hx, hy, r * 0.9, { ramp: mat, base: 4, z, group, bevel: r, dark });
    R.capsule(hx, hy, hx + dx / l * 4, hy + dy / l * 4, 0.9, 0.7, { ramp: mat, base: 4, z: z + 0.1, group, dark });
  } else R.circle(hx, hy, kind === 'fist' ? r : r * 1.05, { ramp: mat, base: 4, z, group, bevel: r, dark });
  A.hx = hx; A.hy = hy;
}
function itemPart(R, A, pose, D) {
  const hx = A.hx, hy = A.hy;
  const dx = A.ex - A.kx, dy = A.ey - A.ky, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
  switch (pose.item) {
    case 'scanner': {
      const tx = hx + ux * 4, ty = hy + uy * 4;
      R.capsule(hx - ux, hy - uy, tx, ty, 1.8, 2.2, { ramp: RAMP.metal, base: 4, z: 85, group: 'item', bevel: 1.5 });
      R.circle(tx + ux * 1.2, ty + uy * 1.2, 1.6, { ramp: RAMP.cyan, base: 5, z: 86, group: 'item', flat: true });
      R.anchors.beam = { x: tx + ux * 2, y: ty + uy * 2, ux, uy, on: pose.beam };
      break;
    }
    case 'vial': R.capsule(hx, hy - 1, hx + 1, hy + 4, 1.2, 1.2, { ramp: RAMP.cyan, base: 5, z: 85, group: 'item', bevel: 1 }); break;
    case 'wrench': {
      const tx = hx + ux * 7 - uy * 2, ty = hy + uy * 7 + ux * 2;
      R.capsule(hx, hy, tx, ty, 1, 1, { ramp: RAMP.metal, base: 5, z: 85, group: 'item', bevel: 1, shiny: true });
      R.circle(tx, ty, 2.2, { ramp: RAMP.metal, base: 5, z: 85, group: 'item', bevel: 1 });
      break;
    }
    case 'tablet': R.box(hx + 2, hy - 1, 4, 3, 1, { ramp: RAMP.navy, base: 3, z: 85, group: 'item', bevel: 1 }); R.stamp(pb => { pb.rect(Math.round(hx), Math.round(hy - 3), 5, 3, '#56e5ff'); pb.set(Math.round(hx + 1), Math.round(hy - 3), '#e6fdff'); }, 120); break;
    case 'seeds': R.circle(hx + 1, hy + 1, 2.5, { ramp: RAMP.soil, base: 5, z: 85, group: 'item', bevel: 2 }); break;
    case 'anemometer': {
      R.capsule(hx, hy, hx + ux * 2, hy - 9, 0.7, 0.7, { ramp: RAMP.metal, base: 5, z: 85, group: 'item' });
      R.stamp(pb => { const t = (pose.phase || 0) * TAU * 2; const cx = Math.round(hx + ux * 2), cy = Math.round(hy - 9); for (let k = 0; k < 3; k++) { const a = t + k * 2.094; pb.line(cx, cy, cx + Math.cos(a) * 4, cy + Math.sin(a) * 1.5, '#cfe8ee'); pb.set(Math.round(cx + Math.cos(a) * 4), Math.round(cy + Math.sin(a) * 1.5), '#ff6b6b'); } }, 121);
      break;
    }
    case 'clipboard': R.box(hx + 2, hy, 3.5, 4.5, 0.5, { ramp: RAMP.sand, base: 6, z: 85, group: 'item', bevel: 1 }); R.stamp(pb => { for (let i = 0; i < 3; i++) pb.hline(Math.round(hx), Math.round(hx + 4), Math.round(hy - 2 + i * 2), '#7e4429'); }, 121); break;
    case 'kite': break;
  }
}

/* ---------- caché de sprites ---------- */
const SpriteCache = {
  map: new Map(),
  get(charId, anim, frame, opts = {}) {
    const k = charId + '|' + anim + '|' + frame + '|' + (opts.expr || '') + '|' + (opts.mouth || '') + '|' + (opts.variant || '');
    let c = this.map.get(k);
    if (!c) {
      const def = CHARS[charId];
      const A = ANIMS[anim] || ANIMS.idle;
      const t = (frame % A.frames) / A.frames;
      const pb = def.render(anim, t, opts);
      c = pb.toCanvas();
      c.anchors = pb.anchors;
      this.map.set(k, c);
      if (this.map.size > 2600) { const first = this.map.keys().next().value; this.map.delete(first); }
    }
    return c;
  },
};

/* Personajes registrados (se definen en 11_chars.js) */
const CHARS = {};

/** Dibuja personaje: (x,y) = pies en el mundo (coordenadas de pantalla) */
function drawChar(g, charId, anim, time, x, y, facing = 1, opts = {}) {
  const def = CHARS[charId];
  if (!def) return;
  const A = ANIMS[anim] || ANIMS.idle;
  let frame = Math.floor(time * A.fps * (opts.speed || 1));
  frame = A.loop ? frame % A.frames : Math.min(frame, A.frames - 1);
  const c = SpriteCache.get(charId, anim, frame, opts);
  const ox = def.ox ?? 30, oy = def.oy ?? 78;
  g.save();
  const dx = Math.round(x), dy = Math.round(y);
  if (opts.shadow !== false && def.shadow !== false) fshadow(g, dx, dy, def.shadowR || 9, 2, '#140d26', 0.5);
  if (facing < 0) { g.translate(dx, 0); g.scale(-1, 1); g.drawImage(c, -(c.width - ox), dy - oy); }
  else g.drawImage(c, dx - ox, dy - oy);
  g.restore();
  // rayo de escáner (dinámico)
  if (c.anchors && c.anchors.beam && opts.beam !== false) {
    const b = c.anchors.beam;
    const bx = facing < 0 ? dx + (ox - b.x) : dx - ox + b.x, by = dy - oy + b.y;
    drawScanBeam(g, bx, by, facing, opts.beamLen || 46);
  }
}
function drawScanBeam(g, x, y, facing, len) {
  const t = Game.time;
  for (let i = 0; i < len; i++) {
    const spread = i * 0.28;
    const xx = Math.round(x + facing * i);
    const lvl = 0.55 * (1 - i / len);
    fdither(g, xx, Math.round(y - spread), 1, Math.max(1, Math.round(spread * 2)), '#56e5ff', lvl);
    if ((i + Math.floor(t * 40)) % 7 === 0) fpx(g, xx, Math.round(y + Math.sin(i * 0.7 + t * 6) * spread), '#e6fdff');
  }
}
