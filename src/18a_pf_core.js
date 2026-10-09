/* =====================================================================
   18a_pf_core.js — Núcleo del kit del PLANO JUGABLE (PF).
   Utilidades de píxel rápidas sobre PixelBuffer (u32), rampas cacheadas,
   textura en clusters (sin Bayer), mezcla alfa horneada, rasterizado de
   glifos a PixelBuffer, tiras de animación y halos en anillos.
   Todo vive bajo PFK para no chocar con otros kits (17b–17z).
   ===================================================================== */
const PFK = (() => {
  const _rampU = new Map();
  /** Rampa hex → Uint32Array (cacheada por identidad del arreglo) */
  function P32(ramp) { let a = _rampU.get(ramp); if (!a) { a = new Uint32Array(ramp.map(c => U(c))); _rampU.set(ramp, a); } return a; }
  function put(pb, x, y, u) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= pb.w || y >= pb.h) return; pb.data[y * pb.w + x] = u; }
  function get(pb, x, y) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= pb.w || y >= pb.h) return 0; return pb.data[y * pb.w + x]; }
  function rgb(u) { return [u & 255, (u >>> 8) & 255, (u >>> 16) & 255]; }
  function pack(r, g, b, a = 255) { return ((a << 24) | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255)) >>> 0; }
  function mixU(a, b, t) {
    const ar = a & 255, ag = (a >>> 8) & 255, ab = (a >>> 16) & 255, br = b & 255, bg = (b >>> 8) & 255, bb = (b >>> 16) & 255;
    return pack(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t, 255);
  }
  /** Mezcla alfa horneada sobre lo que ya hay (si el destino es transparente, deja el color con alfa) */
  function blend(pb, x, y, u, a) {
    x |= 0; y |= 0; if (x < 0 || y < 0 || x >= pb.w || y >= pb.h) return;
    const i = y * pb.w + x, d = pb.data[i];
    if (!(d >>> 24)) { pb.data[i] = (((Math.round(a * 255)) << 24) | (u & 0xffffff)) >>> 0; return; }
    pb.data[i] = mixU(d, u, a);
  }
  /** Rect con mezcla alfa */
  function blendRect(pb, x, y, w, h, u, a) { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) blend(pb, xx, yy, u, a); }
  /** Oscurece/aclara (k<0 oscurece hacia hue) un u32 con cache */
  const _shC = new Map();
  function shU(u, amt, hue = null) {
    const k = u + '|' + amt + '|' + hue; let v = _shC.get(k);
    if (v === undefined) { v = U(shadeTo(u32ToHex(u), amt, hue, amt < 0 ? 0.05 : -0.02)); _shC.set(k, v); }
    return v;
  }
  /** Ruido en clusters de tamaño s (2–4 px) */
  function cl(x, y, s = 2, seed = 0) { return hash2(Math.floor(x / s), Math.floor(y / s), seed); }
  /** Ruido de valor barato */
  function vn(x, y, seed = 0) { return vnoise(x, y, seed); }
  /** Elige índice de rampa con borde de banda desplazado por clusters (sin tramado) */
  function bandIdx(t, n, x, y, jitter = 0.08, seed = 0) {
    const j = (hash2((x / 3) | 0, (y / 2) | 0, seed) - 0.5) * jitter * 2;
    return clamp(Math.round((t + j) * (n - 1)), 0, n - 1);
  }
  /** Copia un PixelBuffer sobre otro respetando alfa (alfa parcial se mezcla) */
  function blit(dst, src, dx, dy, flip = false) {
    dx |= 0; dy |= 0;
    for (let y = 0; y < src.h; y++) {
      const ty = dy + y; if (ty < 0 || ty >= dst.h) continue;
      for (let x = 0; x < src.w; x++) {
        const tx = dx + x; if (tx < 0 || tx >= dst.w) continue;
        const c = src.data[y * src.w + (flip ? src.w - 1 - x : x)];
        const a = c >>> 24; if (!a) continue;
        if (a === 255) dst.data[ty * dst.w + tx] = c; else blend(dst, tx, ty, c, a / 255);
      }
    }
  }
  /** Contorno selectivo: píxeles transparentes junto a opacos → versión oscura del vecino (solo lados dados) */
  function selOut(pb, amt = -0.6, sides = 'lrtb', hue = null) {
    const w = pb.w, h = pb.h, d = pb.data, out = new Uint32Array(d);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (d[i] >>> 24) continue;
      let nb = 0;
      if (sides.includes('l') && x < w - 1 && (d[i + 1] >>> 24) === 255) nb = d[i + 1];
      else if (sides.includes('r') && x > 0 && (d[i - 1] >>> 24) === 255) nb = d[i - 1];
      else if (sides.includes('t') && y < h - 1 && (d[i + w] >>> 24) === 255) nb = d[i + w];
      else if (sides.includes('b') && y > 0 && (d[i - w] >>> 24) === 255) nb = d[i - w];
      if (nb) out[i] = shU(nb, amt, hue);
    }
    d.set(out);
  }
  /** Luz de borde: píxeles opacos con vecino transparente en dirección de la luz → color rim (mezcla k) */
  function rim(pb, u, k = 0.6, dx = -1, dy = -1) {
    const w = pb.w, h = pb.h, d = pb.data, out = new Uint32Array(d);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; const c = d[i]; if ((c >>> 24) !== 255) continue;
      const nx = x + dx, ny = y + dy;
      const empty = (xx, yy) => xx < 0 || yy < 0 || xx >= w || yy >= h || !(d[yy * w + xx] >>> 24);
      if ((dy && empty(x, ny)) || (dx && empty(nx, y))) out[i] = mixU(c, u, k);
    }
    d.set(out);
  }
  /* ---------- glifos a PixelBuffer ---------- */
  /** Rasteriza texto con FONTS.main o FONTS.tiny. bold = trazo de 2 px (dilatación horizontal). Devuelve ancho. */
  function text(pb, str, x, y, col, opts = {}) {
    const font = FONTS[opts.font || 'main'];
    const bold = !!opts.bold, sp = opts.spacing ?? 1;
    const u = typeof col === 'string' ? U(col) : col;
    const shU_ = opts.shadow ? (typeof opts.shadow === 'string' ? U(opts.shadow) : opts.shadow) : 0;
    const isTiny = font === FONTS.tiny;
    let cx = x | 0;
    const startX = cx;
    const glyphs = [];
    for (const ch of String(str)) {
      if (ch === ' ') { cx += (isTiny ? 3 : 3) + sp; continue; }
      const gl = font.glyph(ch); if (!gl) continue;
      const oy = isTiny ? -1 : (gl.up ? 0 : font.top) - 2;
      glyphs.push([gl, cx, oy]);
      cx += gl.w + (bold ? 1 : 0) + sp;
    }
    const paint = (uu, ddx, ddy) => {
      for (const [gl, gx, oy] of glyphs) gl.rows.forEach((row, ry) => {
        for (let k = 0; k < row.length; k++) if (row[k] === '#') {
          put(pb, gx + k + ddx, y + ry + oy + ddy, uu);
          if (bold) put(pb, gx + k + 1 + ddx, y + ry + oy + ddy, uu);
        }
      });
    };
    if (shU_) { paint(shU_, 1, 1); if (opts.shadow2) paint(shU_, 0, 1); }
    paint(u, 0, 0);
    return cx - startX - sp;
  }
  function measure(str, opts = {}) {
    const font = FONTS[opts.font || 'main'], bold = !!opts.bold, sp = opts.spacing ?? 1;
    let w = 0;
    for (const ch of String(str)) { if (ch === ' ') { w += 3 + sp; continue; } const gl = font.glyph(ch); if (!gl) continue; w += gl.w + (bold ? 1 : 0) + sp; }
    return Math.max(0, w - sp);
  }
  /* ---------- tiras de animación ---------- */
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
  /* ---------- halos en anillos (sin tramado) ---------- */
  const _glow = new Map();
  function glow(r, col, rings = 4, a0 = 0.5) {
    const k = r + '|' + col + '|' + rings + '|' + a0; let c = _glow.get(k); if (c) return c;
    const s = r * 2 + 1, pb = new PixelBuffer(s, s), u = U(col) & 0xffffff;
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const d = Math.hypot(x - r, y - r) / (r + 0.5); if (d > 1) continue;
      const ring = Math.floor(d * rings); const a = a0 * (1 - ring / rings);
      pb.data[y * s + x] = ((Math.round(a * 255) << 24) | u) >>> 0;
    }
    c = pb.toCanvas(); _glow.set(k, c); return c;
  }
  /** Dibuja un halo centrado */
  function drawGlow(g, x, y, r, col, alpha = 1, op = 'lighter', rings = 4) {
    const c = glow(r, col, rings);
    g.globalCompositeOperation = op; g.globalAlpha = alpha;
    g.drawImage(c, Math.round(x - r), Math.round(y - r));
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  /** Polígono relleno con color u32 o función (x,y)→u32 */
  function polyFill(pb, pts, fn) {
    let minY = Infinity, maxY = -Infinity;
    for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
    minY = Math.max(0, Math.floor(minY)); maxY = Math.min(pb.h - 1, Math.ceil(maxY));
    const xs = [];
    for (let y = minY; y <= maxY; y++) {
      xs.length = 0; const sy = y + 0.5;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > sy) !== (yj > sy)) xs.push(xi + (sy - yi) / (yj - yi) * (xj - xi));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const xa = Math.max(0, Math.round(xs[k])), xb = Math.min(pb.w - 1, Math.round(xs[k + 1]) - 1);
        for (let x = xa; x <= xb; x++) pb.data[y * pb.w + x] = typeof fn === 'function' ? fn(x, y) : fn;
      }
    }
  }
  /** Disco/elipse con función de color por píxel (nx,ny normalizados −1..1) */
  function ellipseFn(pb, cx, cy, rx, ry, fn) {
    const x0 = Math.floor(cx - rx), x1 = Math.ceil(cx + rx), y0 = Math.floor(cy - ry), y1 = Math.ceil(cy + ry);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const nx = (x + 0.5 - cx) / (rx + 0.01), ny = (y + 0.5 - cy) / (ry + 0.01);
      const d = nx * nx + ny * ny; if (d > 1) continue;
      const u = fn(nx, ny, d, x, y); if (u) put(pb, x, y, u);
    }
  }
  /** Línea de píxeles con función de color por paso t */
  function lineFn(pb, x0, y0, x1, y1, fn, w = 1) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = Math.round(lerp(x0, x1, t)), y = Math.round(lerp(y0, y1, t));
      const u = fn(t, x, y); if (!u) continue;
      put(pb, x, y, u); if (w > 1) put(pb, x + 1, y, u); if (w > 2) put(pb, x, y + 1, u);
    }
  }
  /** Curva cuadrática de puntos */
  function quad(x0, y0, cx, cy, x1, y1, n) {
    const pts = [];
    for (let i = 0; i <= n; i++) { const t = i / n, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t; pts.push([a * x0 + b * cx + c * x1, a * y0 + b * cy + c * y1]); }
    return pts;
  }
  /** Cuenta llamadas para el presupuesto (solo depuración) */
  return { P32, put, get, rgb, pack, mixU, blend, blendRect, shU, cl, vn, bandIdx, blit, selOut, rim, text, measure, strip, drawStrip, glow, drawGlow, polyFill, ellipseFn, lineFn, quad };
})();
