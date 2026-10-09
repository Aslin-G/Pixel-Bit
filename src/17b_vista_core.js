/* =====================================================================
   17b_vista_core.js — Núcleo del kit de PANORAMA (VISTA).
   Utilidades de píxel u32 rápidas, rampas cacheadas, bruma atmosférica
   por plano, bandas sin tramado y ayudantes aditivos de Backdrop:
     B.vplane(f, yScreen, h, draw, opts)  → capa prerenderizada colocada
         en coordenadas de pantalla para la cámara de referencia (cam.y≈50)
     B.vdyn(f, fn, opts)                  → capa solo dinámica intercalada
   Todo el arte del panorama vive en VISTA.* (17b–17z) y lo componen los
   biomas 1c_bio_*.js. Sin Bayer ni ajedrez (STYLE LOCK §1).
   ===================================================================== */
const VISTA = (() => {
  /** cam.y de referencia para colocar planos (Nivel 1: el suelo queda a y≈216 de pantalla) */
  const CAMY = 50;
  /** Dirección de la luz clave (arriba-izquierda, ligeramente frontal) */
  const LIGHT = (() => { const l = [-0.62, -0.42, 0.66]; const n = Math.hypot(...l); return l.map(v => v / n); })();
  const _r32 = new Map();
  /** Rampa hex → Uint32Array (cache por identidad) */
  function P32(ramp) { let a = _r32.get(ramp); if (!a) { a = new Uint32Array(ramp.map(c => U(c))); _r32.set(ramp, a); } return a; }
  function put(pb, x, y, u) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= pb.w || y >= pb.h) return; pb.data[y * pb.w + x] = u; }
  function get(pb, x, y) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= pb.w || y >= pb.h) return 0; return pb.data[y * pb.w + x]; }
  function pack(r, g, b, a = 255) { return ((a << 24) | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255)) >>> 0; }
  function mixU(a, b, t) {
    const ar = a & 255, ag = (a >>> 8) & 255, ab = (a >>> 16) & 255, br = b & 255, bg = (b >>> 8) & 255, bb = (b >>> 16) & 255;
    return pack(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t, 255);
  }
  /** Mezcla alfa horneada (si el destino está vacío deja el color con su alfa) */
  function blend(pb, x, y, u, a) {
    x |= 0; y |= 0; if (x < 0 || y < 0 || x >= pb.w || y >= pb.h || a <= 0) return;
    const i = y * pb.w + x, d = pb.data[i];
    if (!(d >>> 24)) { pb.data[i] = (((Math.round(Math.min(1, a) * 255)) << 24) | (u & 0xffffff)) >>> 0; return; }
    pb.data[i] = a >= 1 ? ((u | 0xff000000) >>> 0) : mixU(d, u, a);
  }
  function rect(pb, x, y, w, h, u) {
    const x0 = Math.max(0, x | 0), y0 = Math.max(0, y | 0), x1 = Math.min(pb.w, (x + w) | 0), y1 = Math.min(pb.h, (y + h) | 0);
    for (let yy = y0; yy < y1; yy++) { const o = yy * pb.w; for (let xx = x0; xx < x1; xx++) pb.data[o + xx] = u; }
  }
  /** Cambia el tono de un u32 (amt −1..1) con desplazamiento de tono hacia hue (cache) */
  const _sh = new Map();
  function shU(u, amt, hue = null) {
    const k = u + '|' + amt + '|' + hue; let v = _sh.get(k);
    if (v === undefined) { v = U(shadeTo(u32ToHex(u), amt, hue, amt < 0 ? 0.04 : -0.02)); _sh.set(k, v); }
    return v;
  }
  /** Rampa con bruma atmosférica (hazeColor de 17a), cacheada */
  const _hz = new Map();
  function hz(ramp, k, haze = PAL_REF.haze) {
    if (k <= 0) return ramp;
    const key = ramp.join() + '|' + k.toFixed(3) + '|' + haze; let v = _hz.get(key);
    if (!v) { v = ramp.map(c => hazeColor(c, k, haze)); _hz.set(key, v); }
    return v;
  }
  /** Color con bruma (hex) */
  function hzc(hex, k, haze) { return k > 0 ? hazeColor(hex, k, haze) : hex; }
  /** Expande una rampa a n tonos interpolados (para degradados de cielo/agua en bandas) */
  function expand(stops, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1) * (stops.length - 1), a = Math.floor(t), b = Math.min(stops.length - 1, a + 1);
      out.push(mixHex(stops[a], stops[b], t - a));
    }
    return out;
  }
  /** Índice de banda con borde desplazado por clusters 3×2 (sin tramado) */
  function band(t, n, x, y, jit = 0.06, seed = 0) {
    const j = (hash2((x / 3) | 0, (y / 2) | 0, seed) - 0.5) * jit * 2;
    const i = Math.round((t + j) * (n - 1));
    return i < 0 ? 0 : i >= n ? n - 1 : i;
  }
  /** Ruido de crestas (ridged fbm 0..1): crestas afiladas y barrancos */
  function ridged(x, y, oct = 5, seed = 0, gain = 0.5, lac = 2.07) {
    let amp = 0.5, f = 1, sum = 0, norm = 0, w = 1;
    for (let i = 0; i < oct; i++) {
      let n = 1 - Math.abs(vnoise(x * f, y * f, seed + i * 31) * 2 - 1);
      n *= n; n *= (0.4 + 0.6 * w); w = n;
      sum += n * amp; norm += amp; amp *= gain; f *= lac;
    }
    return sum / norm;
  }
  /** Polígono relleno con color u32 o función (x,y)→u32|0 */
  function poly(pb, pts, fn) {
    let minY = Infinity, maxY = -Infinity;
    for (const p of pts) { if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; }
    minY = Math.max(0, Math.floor(minY)); maxY = Math.min(pb.h - 1, Math.ceil(maxY));
    const xs = [];
    for (let y = minY; y <= maxY; y++) {
      xs.length = 0; const sy = y + 0.5;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
        if ((yi > sy) !== (yj > sy)) xs.push(xi + (sy - yi) / (yj - yi) * (xj - xi));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const xa = Math.max(0, Math.round(xs[k])), xb = Math.min(pb.w - 1, Math.round(xs[k + 1]) - 1);
        for (let x = xa; x <= xb; x++) { const u = typeof fn === 'function' ? fn(x, y) : fn; if (u) pb.data[y * pb.w + x] = u; }
      }
    }
  }
  /** Elipse con función de color (nx, ny normalizados, d=nx²+ny²) */
  function ellipse(pb, cx, cy, rx, ry, fn) {
    const x0 = Math.floor(cx - rx), x1 = Math.ceil(cx + rx), y0 = Math.floor(cy - ry), y1 = Math.ceil(cy + ry);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const nx = (x + 0.5 - cx) / (rx + 0.01), ny = (y + 0.5 - cy) / (ry + 0.01), d = nx * nx + ny * ny;
      if (d > 1) continue;
      const u = typeof fn === 'function' ? fn(nx, ny, d, x, y) : fn; if (u) put(pb, x, y, u);
    }
  }
  /** Línea con función de color por paso t */
  function line(pb, x0, y0, x1, y1, fn) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = Math.round(lerp(x0, x1, t)), y = Math.round(lerp(y0, y1, t));
      const u = typeof fn === 'function' ? fn(t, x, y) : fn; if (u) put(pb, x, y, u);
    }
  }
  /** Copia src (PixelBuffer) sobre dst respetando alfa */
  function blit(dst, src, dx, dy, flip = false) {
    dx |= 0; dy |= 0;
    for (let y = 0; y < src.h; y++) {
      const ty = dy + y; if (ty < 0 || ty >= dst.h) continue;
      for (let x = 0; x < src.w; x++) {
        const tx = dx + x; if (tx < 0 || tx >= dst.w) continue;
        const c = src.data[y * src.w + (flip ? src.w - 1 - x : x)], a = c >>> 24; if (!a) continue;
        if (a === 255) dst.data[ty * dst.w + tx] = c; else blend(dst, tx, ty, c, a / 255);
      }
    }
  }
  /** Luz de borde cálida 1 px en los píxeles opacos con vacío hacia (dx,dy) */
  function rim(pb, u, k = 0.55, dx = -1, dy = -1, x0 = 0, y0 = 0, x1 = pb.w, y1 = pb.h) {
    const w = pb.w, d = pb.data, list = [];
    for (let y = Math.max(0, y0); y < Math.min(pb.h, y1); y++) for (let x = Math.max(0, x0); x < Math.min(w, x1); x++) {
      const i = y * w + x; if ((d[i] >>> 24) !== 255) continue;
      const ex = x + dx, ey = y + dy;
      const e1 = dy && (ey < 0 || ey >= pb.h || !(d[ey * w + x] >>> 24));
      const e2 = dx && (ex < 0 || ex >= w || !(d[y * w + ex] >>> 24));
      if (e1 || e2) list.push(i);
    }
    for (const i of list) d[i] = mixU(d[i], u, k);
  }
  /** Tira de animación de n cuadros (w×h) → {c, n, w, h} */
  function strip(n, w, h, fn) {
    const pb = new PixelBuffer(w * n, h);
    for (let i = 0; i < n; i++) { const f = new PixelBuffer(w, h); fn(f, i); blit(pb, f, i * w, 0); }
    return { c: pb.toCanvas(), n, w, h };
  }
  function drawStrip(g, s, i, x, y, flip = false) {
    i = ((i % s.n) + s.n) % s.n;
    if (!flip) { g.drawImage(s.c, i * s.w, 0, s.w, s.h, Math.round(x), Math.round(y), s.w, s.h); return; }
    g.save(); g.translate(Math.round(x) + s.w, Math.round(y)); g.scale(-1, 1); g.drawImage(s.c, i * s.w, 0, s.w, s.h, 0, 0, s.w, s.h); g.restore();
  }
  /** Texto rasterizado a PixelBuffer (usa PFK.text si existe; FONTS.tiny/main) */
  function text(pb, str, x, y, col, opts = {}) {
    if (typeof PFK !== 'undefined') return PFK.text(pb, str, x, y, typeof col === 'string' ? U(col) : col, opts);
    return 0;
  }
  function measure(str, opts = {}) { return typeof PFK !== 'undefined' ? PFK.measure(str, opts) : str.length * 4; }
  /** Halo en anillos (sin tramado), cacheado; se dibuja con 'lighter' */
  const _gl = new Map();
  function glow(r, col, rings = 3, a0 = 0.55) {
    const k = r + '|' + col + '|' + rings + '|' + a0; let c = _gl.get(k); if (c) return c;
    const s = r * 2 + 1, pb = new PixelBuffer(s, s), u = U(col) & 0xffffff;
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const d = Math.hypot(x - r, y - r) / (r + 0.5); if (d > 1) continue;
      const a = a0 * (1 - Math.floor(d * rings) / rings);
      pb.data[y * s + x] = ((Math.round(a * 255) << 24) | u) >>> 0;
    }
    c = pb.toCanvas(); _gl.set(k, c); return c;
  }
  function drawGlow(g, x, y, r, col, alpha = 1) {
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = alpha;
    g.drawImage(glow(r, col), Math.round(x - r), Math.round(y - r));
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  /** Copia oscurecida de una región (sombra de nube que recorre filas FV): {c, x, y, w, h} */
  function shadowCopy(pb, x, y, w, h, amt = -0.32, hue = 235) {
    const out = new PixelBuffer(w, h);
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      const c = get(pb, x + xx, y + yy); if (c >>> 24) out.data[yy * w + xx] = shU(c, amt, hue);
    }
    return { c: out.toCanvas(), x, y, w, h };
  }
  /** Contador de tiempo de prerender por bioma (depuración / informe) */
  const stats = { ms: {}, last: 0 };
  function timed(name, fn) { const t0 = nowMs(); const r = fn(); stats.ms[name] = Math.round(nowMs() - t0); return r; }
  return { CAMY, LIGHT, P32, put, get, pack, mixU, blend, rect, shU, hz, hzc, expand, band, ridged, poly, ellipse, line, blit, rim, strip, drawStrip, text, measure, glow, drawGlow, shadowCopy, stats, timed };
})();

/* ---------- rampas del panorama por plano (medidas en la referencia a 640×360) ---------- */
VISTA.RAMPS = {
  far: ['#5f5a82', '#6f6a94', '#7d7aa6', '#8c88b4', '#9d92b9', '#b0a0be', '#c4aec2', '#d6bcc4'],
  mid: ['#4a4a78', '#5a5888', '#6e6896', '#87739e', '#a07c98', '#b98a98', '#cf9c9a', '#e2b2a2', '#efc8b2', '#f6dcc8'],
  hill: ['#3e3448', '#58405a', '#695266', '#87545a', '#9f6358', '#b46e5c', '#c07b5f', '#d08c68', '#de9c76', '#e9b48e', '#f2cfae'],
  low: ['#4a2a28', '#64352e', '#805142', '#9a5c3c', '#bd764a', '#d4884e', '#e19d61', '#eeb26c', '#f6c17c', '#fbd992'],
  vegMid: ['#4d5a52', '#5d6e56', '#74845e', '#8e9a6a', '#a8b07a'],
  vegHill: ['#2c3a2c', '#3f5434', '#5a6e3c', '#7a8e44', '#9cad54', '#bfc76a'],
  vegLow: ['#1c3534', '#2e4a2c', '#4d6e4a', '#6a8a3e', '#99b874', '#bfcf6a', '#dfd88c'],
};

/* ---------- ayudantes aditivos de Backdrop (solo panorama) ---------- */
/** Capa prerenderizada situada en coordenadas de PANTALLA para cam.y = VISTA.CAMY. */
Backdrop.prototype.vplane = function (f, yScreen, h, draw, opts = {}) {
  const fy = opts.fy ?? f * 0.3;
  const y = Math.round(yScreen + VISTA.CAMY * fy);
  const L = this.layer(f, h, y, (pb, w, hh) => VISTA.timed('plane' + this.layers.length, () => draw(pb, w, hh)), Object.assign({}, opts, { fy }));
  L.ys = yScreen; L.tag = opts.tag || '';
  return L;
};
/** Capa solo dinámica (nubes, rotores…) intercalada en el orden de planos */
Backdrop.prototype.vdyn = function (f, fn, opts = {}) { const L = this.dynLayer(f, fn, opts); L.tag = opts.tag || ''; return L; };
/** Desplazamiento de pantalla de un plano: [sx0, sy0] para dibujar en su espacio */
Backdrop.prototype.vofs = function (L, cam) { return [-Math.round(cam.x * L.f), L.y - Math.round(cam.y * L.fy)]; };
