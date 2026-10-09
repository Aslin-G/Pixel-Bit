/* =====================================================================
   01_pixel.js — Kit de pixel art sobre ImageData (Uint32 ABGR).
   Todas las primitivas escriben píxeles enteros: sin antialiasing.
   ===================================================================== */

class PixelBuffer {
  constructor(w, h) {
    this.w = w | 0; this.h = h | 0;
    this.img = new ImageData(this.w, this.h);
    this.data = new Uint32Array(this.img.data.buffer);
    this.ids = null; // buffer opcional de identificadores de parte
  }
  clear(c = 0) { this.data.fill(c); }
  inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  set(x, y, c) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.data[y * this.w + x] = typeof c === 'string' ? U(c) : c;
  }
  get(x, y) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0; return this.data[y * this.w + x]; }
  alpha(x, y) { return this.get(x, y) >>> 24; }
  rect(x, y, w, h, c) {
    const cu = typeof c === 'string' ? U(c) : c;
    const x0 = Math.max(0, x | 0), y0 = Math.max(0, y | 0), x1 = Math.min(this.w, (x + w) | 0), y1 = Math.min(this.h, (y + h) | 0);
    for (let yy = y0; yy < y1; yy++) { const o = yy * this.w; for (let xx = x0; xx < x1; xx++) this.data[o + xx] = cu; }
  }
  hline(x0, x1, y, c) { if (x1 < x0) [x0, x1] = [x1, x0]; this.rect(x0, y, x1 - x0 + 1, 1, c); }
  vline(x, y0, y1, c) { if (y1 < y0) [y0, y1] = [y1, y0]; this.rect(x, y0, 1, y1 - y0 + 1, c); }
  line(x0, y0, x1, y1, c) {
    const cu = typeof c === 'string' ? U(c) : c;
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (; ;) {
      this.set(x0, y0, cu);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  /** Línea gruesa (pinceles cuadrados) */
  thick(x0, y0, x1, y1, r, c) {
    const n = Math.max(1, Math.ceil(dist(x0, y0, x1, y1)));
    for (let i = 0; i <= n; i++) { const t = i / n; this.disc(lerp(x0, x1, t), lerp(y0, y1, t), r, c); }
  }
  disc(cx, cy, r, c) { this.ellipse(cx, cy, r, r, c); }
  ellipse(cx, cy, rx, ry, c) {
    const cu = typeof c === 'string' ? U(c) : c;
    const x0 = Math.floor(cx - rx), x1 = Math.ceil(cx + rx), y0 = Math.floor(cy - ry), y1 = Math.ceil(cy + ry);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = (x + 0.5 - cx) / (rx + 0.01), dy = (y + 0.5 - cy) / (ry + 0.01);
      if (dx * dx + dy * dy <= 1) this.set(x, y, cu);
    }
  }
  ellipseOutline(cx, cy, rx, ry, c) {
    const cu = typeof c === 'string' ? U(c) : c;
    const x0 = Math.floor(cx - rx - 1), x1 = Math.ceil(cx + rx + 1), y0 = Math.floor(cy - ry - 1), y1 = Math.ceil(cy + ry + 1);
    const inside = (x, y) => { const dx = (x + 0.5 - cx) / (rx + 0.01), dy = (y + 0.5 - cy) / (ry + 0.01); return dx * dx + dy * dy <= 1; };
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (inside(x, y) && (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1))) this.set(x, y, cu);
    }
  }
  /** Relleno de polígono por líneas de barrido */
  poly(pts, c) {
    const cu = typeof c === 'string' ? U(c) : c;
    let minY = Infinity, maxY = -Infinity;
    for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
    minY = Math.max(0, Math.floor(minY)); maxY = Math.min(this.h - 1, Math.ceil(maxY));
    const xs = [];
    for (let y = minY; y <= maxY; y++) {
      xs.length = 0; const sy = y + 0.5;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > sy) !== (yj > sy)) xs.push(xi + (sy - yi) / (yj - yi) * (xj - xi));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const xa = Math.max(0, Math.round(xs[k])), xb = Math.min(this.w - 1, Math.round(xs[k + 1]) - 1);
        for (let x = xa; x <= xb; x++) this.data[y * this.w + x] = cu;
      }
    }
  }
  /** Rectángulo tramado: fracción t del color b sobre a (Bayer 4x4) */
  dither(x, y, w, h, a, b, t) {
    const au = a == null ? null : (typeof a === 'string' ? U(a) : a), bu = typeof b === 'string' ? U(b) : b;
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      if (bayer4(xx, yy) < t) this.set(xx, yy, bu); else if (au != null) this.set(xx, yy, au);
    }
  }
  /** Gradiente vertical por rampa con transiciones tramadas */
  vgrad(x, y, w, h, ramp, t0 = 0, t1 = 1, strength = 1) {
    for (let yy = 0; yy < h; yy++) {
      const t = lerp(t0, t1, h <= 1 ? 0 : yy / (h - 1));
      for (let xx = 0; xx < w; xx++) this.set(x + xx, y + yy, U(rampDither(ramp, t, x + xx, y + yy, strength)));
    }
  }
  /** Copia otro buffer (respeta transparencia) */
  blit(src, dx, dy, flip = false) {
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
      const c = src.data[y * src.w + (flip ? src.w - 1 - x : x)];
      if (c >>> 24) this.set(dx + x, dy + y, c);
    }
  }
  /** Contorno exterior: píxel transparente vecino de opaco → color (o función del vecino) */
  outline(color, diag = false) {
    const w = this.w, h = this.h, d = this.data, out = new Uint32Array(d);
    const fixed = typeof color === 'string' ? U(color) : color;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (d[i] >>> 24) continue;
      let nb = 0;
      if (x > 0 && d[i - 1] >>> 24) nb = d[i - 1];
      else if (x < w - 1 && d[i + 1] >>> 24) nb = d[i + 1];
      else if (y > 0 && d[i - w] >>> 24) nb = d[i - w];
      else if (y < h - 1 && d[i + w] >>> 24) nb = d[i + w];
      else if (diag) {
        if (x > 0 && y > 0 && d[i - w - 1] >>> 24) nb = d[i - w - 1];
        else if (x < w - 1 && y > 0 && d[i - w + 1] >>> 24) nb = d[i - w + 1];
        else if (x > 0 && y < h - 1 && d[i + w - 1] >>> 24) nb = d[i + w - 1];
        else if (x < w - 1 && y < h - 1 && d[i + w + 1] >>> 24) nb = d[i + w + 1];
      }
      if (nb) out[i] = typeof color === 'function' ? color(nb) : fixed;
    }
    d.set(out);
  }
  /** Reemplaza un color por otro */
  swap(fromU, toU) { const d = this.data; for (let i = 0; i < d.length; i++) if (d[i] === fromU) d[i] = toU; }
  toCanvas(c) {
    c = c || makeCanvas(this.w, this.h);
    c.g.putImageData(this.img, 0, 0);
    return c;
  }
}

/** Oscurecimiento hacia el contorno: dado un color u32 retorna versión muy oscura con tono violeta */
const _darkCache = new Map();
function darkOf(u, amt = -0.75) {
  const k = u + '|' + amt;
  let v = _darkCache.get(k);
  if (v === undefined) { v = U(shade(u32ToHex(u), amt)); _darkCache.set(k, v); }
  return v;
}

/** Crea un sprite desde mapa de caracteres con paleta {char:hex} */
function spriteFromMap(rows, pal, scale = 1) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const pb = new PixelBuffer(w * scale, h * scale);
  for (let y = 0; y < h; y++) for (let x = 0; x < rows[y].length; x++) {
    const ch = rows[y][x];
    const col = pal[ch];
    if (col) pb.rect(x * scale, y * scale, scale, scale, col);
  }
  return pb;
}

/** Dibuja rectángulo en contexto con coordenadas enteras */
function frect(g, x, y, w, h, col) { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function fpx(g, x, y, col) { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), 1, 1); }
/** Línea de píxeles en contexto (Bresenham) */
function fline(g, x0, y0, x1, y1, col) {
  g.fillStyle = col;
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, guard = 0;
  for (; ;) {
    g.fillRect(x0, y0, 1, 1);
    if ((x0 === x1 && y0 === y1) || ++guard > 4000) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
/** Círculo relleno pixelado en contexto */
function fdisc(g, cx, cy, r, col) {
  g.fillStyle = col;
  const ri = Math.ceil(r);
  for (let y = -ri; y <= ri; y++) {
    const hw = Math.floor(Math.sqrt(Math.max(0, r * r - (y + 0.5) * (y + 0.5)) ) + 0.5);
    if (hw > 0) g.fillRect(Math.round(cx) - hw, Math.round(cy) + y, hw * 2, 1);
  }
}
/** Rectángulo tramado en contexto (patrón cacheado) */
const _patCache = new Map();
function ditherPattern(g, col, level) {
  const lv = clamp(Math.round(level * 16), 0, 16);
  const k = col + '|' + lv;
  let p = _patCache.get(k);
  if (!p) {
    const c = makeCanvas(4, 4);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (BAYER4[y * 4 + x] < lv / 16) { c.g.fillStyle = col; c.g.fillRect(x, y, 1, 1); }
    p = g.createPattern(c, 'repeat');
    _patCache.set(k, p);
  }
  return p;
}
function fdither(g, x, y, w, h, col, level) {
  if (level <= 0) return;
  if (level >= 1) { frect(g, x, y, w, h, col); return; }
  g.fillStyle = ditherPattern(g, col, level);
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
/** Elipse tramada (sombras discretizadas) */
function fshadow(g, cx, cy, rx, ry, col = 'rgba(20,13,38,1)', level = 0.5) {
  g.fillStyle = ditherPattern(g, col, level);
  for (let y = -ry; y <= ry; y++) {
    const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.01))));
    if (hw > 0) g.fillRect(Math.round(cx - hw), Math.round(cy + y), hw * 2, 1);
  }
}

/* =====================================================================
   Pases del rediseño de personajes (STYLE LOCK §10): contorno por
   material, sellos por mapa de caracteres, luz de borde y limpieza.
   Todo es aditivo: no altera el comportamiento de los métodos previos.
   ===================================================================== */
/**
 * Sello desde mapa de caracteres. rows: array de strings; pal: {char: hex|u32|null}.
 * Los caracteres sin entrada en la paleta son transparentes. flip refleja en X.
 */
PixelBuffer.prototype.stampMap = function (x, y, rows, pal, flip = false) {
  x = Math.round(x); y = Math.round(y);
  for (let j = 0; j < rows.length; j++) {
    const row = rows[j], n = row.length;
    for (let i = 0; i < n; i++) {
      let c = pal[row[i]];
      if (c == null) continue;
      if (typeof c === 'string') c = U(c);
      this.set(flip ? x + n - 1 - i : x + i, y + j, c);
    }
  }
  return this;
};
/**
 * Contorno exterior por parte: un píxel transparente con vecino opaco (4-vecindad) toma el
 * color de contorno (mat.outlineU) de la parte vecina más al frente (zb = índice de parte, −1 = sello).
 * fallback(nbU32) | hex se usa para vecinos sin parte. Devuelve la máscara de contorno.
 */
PixelBuffer.prototype.outlineByPart = function (zb, parts, fallback) {
  const w = this.w, h = this.h, d = this.data, out = new Uint32Array(d);
  const mask = new Uint8Array(w * h);
  const fb = typeof fallback === 'string' ? U(fallback) : fallback;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (d[i] >>> 24) continue;
    let best = -1, nbc = 0;
    for (let k = 0; k < 4; k++) {
      const j = k === 0 ? (y < h - 1 ? i + w : -1) : k === 1 ? (x > 0 ? i - 1 : -1) : k === 2 ? (x < w - 1 ? i + 1 : -1) : (y > 0 ? i - w : -1);
      if (j < 0 || !(d[j] >>> 24)) continue;
      if (zb[j] > best) best = zb[j];
      if (!nbc) nbc = d[j];
    }
    if (!nbc) continue;
    const P = best >= 0 ? parts[best] : null;
    out[i] = P && P.mat && P.mat.outlineU ? P.mat.outlineU : (typeof fb === 'function' ? fb(nbc) : (fb != null ? fb : darkOf(nbc, -0.8)));
    mask[i] = 1;
  }
  d.set(out);
  return mask;
};
/**
 * Luz de borde de 1 px: píxeles opacos cuyo vecino trasero (dirX) o superior es transparente
 * se mezclan k hacia rimHex. sel(i, lado, arriba) filtra (p. ej. por material o banda).
 */
PixelBuffer.prototype.rimPass = function (rimHex, k = 0.4, sel = null, dirX = -1) {
  const w = this.w, h = this.h, d = this.data, out = new Uint32Array(d);
  const rr = hexToRgb(rimHex);
  for (let y = 1; y < h; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    if (!(d[i] >>> 24)) continue;
    const side = !(d[i + dirX] >>> 24), top = !(d[i - w] >>> 24);
    if (!side && !top) continue;
    if (sel && !sel(i, side, top)) continue;
    const c = d[i], r = c & 255, g = (c >>> 8) & 255, b = (c >>> 16) & 255;
    const kk = Math.min(1, side && top ? k * 1.3 : k);
    out[i] = ((255 << 24) | (Math.round(b + (rr[2] - b) * kk) << 16) | (Math.round(g + (rr[1] - g) * kk) << 8) | Math.round(r + (rr[0] - r) * kk)) >>> 0;
  }
  d.set(out);
  return this;
};
/**
 * Limpieza (STYLE LOCK §10). Sin máscara (antes del contorno): quita motas opacas aisladas
 * (0 vecinos opacos en 4-vecindad) y rellena agujeros de 1 px rodeados por 4 lados.
 * Con máscara de contorno (después): quita espuelas de contorno (3+ vecinos transparentes y sin
 * relleno en 4-vecindad) y esquinas redundantes en L de la escalera ("pixel-perfect").
 */
PixelBuffer.prototype.cleanup = function (mask = null) {
  const w = this.w, h = this.h, d = this.data;
  const op = (i) => (d[i] >>> 24) !== 0;
  if (!mask) {
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x, n = op(i - 1) + op(i + 1) + op(i - w) + op(i + w);
      if (op(i) && n === 0) d[i] = 0;
      else if (!op(i) && n === 4) d[i] = d[i - 1];
    }
    return this;
  }
  const body = (i) => op(i) && !mask[i];
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    if (!mask[i]) continue;
    const L = i - 1, R = i + 1, T = i - w, B = i + w;
    if (body(L) || body(R) || body(T) || body(B)) continue;
    const tr = !op(L) + !op(R) + !op(T) + !op(B);
    const mh = mask[L] ? L : mask[R] ? R : -1, mv = mask[T] ? T : mask[B] ? B : -1;
    if (tr >= 3 || (mh >= 0 && mv >= 0 && body(mv + (mh - i)))) { d[i] = 0; mask[i] = 0; }
  }
  return this;
};
