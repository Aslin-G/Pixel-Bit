/* =====================================================================
   12_props.js — Primitivas de escenografía pixel art.
   Prerender sobre PixelBuffer (estático) y dibujo dinámico sobre ctx.
   ===================================================================== */

const ART = {};

/* ---------- utilidades de color atmosférico ---------- */
ART.haze = (hex, haze, k) => mixHex(hex, haze, clamp(k, 0, 1));
ART.hazeRamp = (ramp, haze, k) => ramp.map(c => mixHex(c, haze, k));

/* ---------- Cielo ---------- */
/** Cielo en bandas tramadas. ramp de arriba (oscuro) a horizonte (claro). */
ART.sky = function (pb, ramp, horizonY, opts = {}) {
  const h = pb.h, w = pb.w;
  for (let y = 0; y < h; y++) {
    const t = clamp(y / horizonY, 0, 1);
    const tt = Math.pow(t, opts.curve || 1.25);
    for (let x = 0; x < w; x++) pb.data[y * w + x] = U(rampDither(ramp, tt, x, y));
  }
  if (opts.sun) ART.sunDisc(pb, opts.sun.x, opts.sun.y, opts.sun.r, opts.sun.cols, opts.sun.halo);
  if (opts.stars) {
    const r = RNG(opts.seed || 5);
    for (let i = 0; i < opts.stars; i++) {
      const x = r.int(0, w - 1), y = r.int(0, Math.floor(horizonY * 0.85));
      const b = r();
      pb.set(x, y, b > 0.9 ? '#ffffff' : b > 0.6 ? '#c8d0ff' : '#8a8ccb');
      if (b > 0.97) { pb.set(x - 1, y, '#5a6fb0'); pb.set(x + 1, y, '#5a6fb0'); pb.set(x, y - 1, '#5a6fb0'); pb.set(x, y + 1, '#5a6fb0'); }
    }
  }
};
/** Sol con halo de anillos tramados */
ART.sunDisc = function (pb, cx, cy, r, cols = ['#fff6d8', '#ffe878', '#ffd04a'], halo = '#fff0b8') {
  for (let y = Math.floor(cy - r * 3.2); y <= cy + r * 3.2; y++) for (let x = Math.floor(cx - r * 3.2); x <= cx + r * 3.2; x++) {
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
    if (d < r) { pb.set(x, y, d < r * 0.55 ? cols[0] : d < r * 0.85 ? cols[1] : cols[2]); }
    else if (d < r * 3.2) {
      const k = 1 - (d - r) / (r * 2.2);
      if (bayer4(x, y) < k * 0.55) pb.set(x, y, halo);
    }
  }
};
/** Nube pixel: racimo de círculos con base plana, sombreada en 4 tonos */
ART.cloudSprite = function (w, h, seed, pal) {
  const pb = new PixelBuffer(w, h);
  const r = RNG(seed);
  const blobs = [];
  const n = 4 + Math.floor(w / 18);
  for (let i = 0; i < n; i++) {
    const bx = lerp(w * 0.18, w * 0.82, i / (n - 1)) + r.range(-4, 4);
    const rad = (h * 0.32) * (1 - Math.abs(i / (n - 1) - 0.5) * 0.9) + r.range(0, h * 0.18);
    blobs.push([bx, h - rad * 0.9 - 2, rad]);
  }
  for (let i = 0; i < 3; i++) blobs.push([r.range(w * 0.3, w * 0.7), h * 0.45 + r.range(-3, 3), h * r.range(0.28, 0.4)]);
  const base = h - 3;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let inside = false, best = 0;
    for (const [bx, by, br] of blobs) {
      const d = Math.hypot(x + 0.5 - bx, y + 0.5 - by);
      if (d < br) { inside = true; const nyv = (y + 0.5 - by) / br, nxv = (x + 0.5 - bx) / br; best = Math.max(best, -nyv * 0.8 - nxv * 0.35); }
    }
    if (!inside || y > base) continue;
    const bottom = (y - (base - h * 0.28)) / (h * 0.28);
    let idx = best > 0.55 ? 3 : best > 0.05 ? 2 : best > -0.45 ? 1 : 0;
    if (bottom > 0.4) idx = Math.min(idx, 1);
    if (bottom > 0.8) idx = 0;
    // transición tramada entre tonos
    if (idx < 3 && bayer4(x, y) < 0.25 && best > (idx === 2 ? 0.45 : idx === 1 ? -0.05 : -0.55)) idx++;
    pb.set(x, y, pal[idx]);
  }
  return pb;
};

/* ---------- Perfiles de terreno ---------- */
/** Dibuja cordillera/mesetas: heightFn(x)→y superior. pal: rampa (oscura→clara). */
ART.ridge = function (pb, heightFn, pal, opts = {}) {
  const w = pb.w, h = pb.h;
  const tops = new Float32Array(w);
  for (let x = 0; x < w; x++) tops[x] = heightFn(x);
  for (let x = 0; x < w; x++) {
    const top = Math.round(tops[x]);
    const slope = (tops[Math.min(w - 1, x + 1)] - tops[Math.max(0, x - 1)]) * 0.5;
    for (let y = Math.max(0, top); y < h; y++) {
      const depth = y - top;
      let idx;
      if (opts.mesa) {
        // caras: lado izquierdo iluminado (pendiente negativa = subida hacia la derecha... luz desde izquierda)
        const face = slope < -0.6 ? 2 : slope > 0.6 ? -1 : 0;
        idx = opts.baseIdx + face;
        if (depth < 2) idx = opts.baseIdx + 2;
        // estratos
        if (opts.strata && ((y + Math.floor(fbm1(x * 0.02, 2, 9) * 6)) % opts.strata === 0)) idx -= 1;
        if (opts.strata && ((y + Math.floor(fbm1(x * 0.02, 2, 9) * 6)) % opts.strata === 1) && face >= 0) idx += 1;
      } else {
        idx = opts.baseIdx + (slope < -0.35 ? 1 : slope > 0.35 ? -1 : 0);
        if (depth < 1) idx += 1;
      }
      // degradado vertical hacia la base (bruma)
      if (opts.fadeTo) {
        const k = clamp((y - top) / (opts.fadeLen || 60), 0, 1);
        if (bayer4(x, y) < k * 0.9) idx = Math.min(idx, opts.fadeIdx ?? 0);
      }
      pb.set(x, y, pal[clamp(idx, 0, pal.length - 1)]);
    }
  }
  return tops;
};
/** Dunas: se pintan de atrás hacia delante; cara de barlovento iluminada, cara de
 *  sotavento sombreada con borde curvo, cresta resaltada y rizaduras del viento. */
ART.dunes = function (pb, yBase, amp, pal, seed, opts = {}) {
  const w = pb.w;
  const r = RNG(seed);
  const crests = [];
  let x = -r.range(20, 80);
  while (x < w + 100) { const width = r.range(opts.minW || 80, opts.maxW || 180); crests.push({ x, w: width, hgt: amp * r.range(0.55, 1), back: r.range(0, 8) }); x += width * r.range(0.5, 0.8); }
  crests.sort((a, b) => a.back - b.back || a.hgt - b.hgt);
  const top = new Float32Array(w).fill(1e9);
  const lit = opts.lit ?? 4, sh = opts.shadow ?? 2;
  for (const c of crests) {
    const peak = c.x + c.w * 0.6, base = yBase + c.back;
    for (let xx = Math.max(0, Math.floor(c.x)); xx < Math.min(w, Math.ceil(c.x + c.w)); xx++) {
      let y, windward = xx < peak;
      if (windward) { const t = (xx - c.x) / (peak - c.x); y = base - c.hgt * Math.pow(Math.sin(t * Math.PI / 2), 1.5); }
      else { const t = (xx - peak) / (c.x + c.w - peak); y = base - c.hgt * Math.pow(1 - t, 1.25); }
      const y0 = Math.round(y);
      if (y0 < top[xx]) top[xx] = y0;
      const lt = windward ? 0 : (xx - peak) / (c.x + c.w - peak);
      for (let yy = y0; yy < pb.h; yy++) {
        const d = yy - y0;
        let idx;
        if (windward) {
          idx = lit;
          if (d > c.hgt * 0.55 && bayer4(xx, yy) < 0.35) idx = lit - 1;
          if (opts.ripples && d > 2 && ((yy * 3 + Math.floor(Math.sin(xx * 0.09 + yy * 0.25) * 3)) % 8 === 0)) idx = lit - 1;
        } else {
          // la sombra de sotavento se curva: más ancha arriba, se disuelve hacia la base
          const shadowDepth = c.hgt * (1.1 - lt * 0.6);
          idx = d < shadowDepth ? sh : (bayer4(xx, yy) < 0.5 ? sh : lit - 1);
          if (d < shadowDepth && d > shadowDepth - 3 && bayer4(xx, yy) < 0.5) idx = sh + 1;
        }
        if (d === 0) idx = windward ? lit + 1 : sh + 1;
        pb.set(xx, yy, pal[clamp(idx, 0, pal.length - 1)]);
      }
    }
  }
  for (let xx = 0; xx < w; xx++) if (top[xx] > 1e8) top[xx] = yBase;
  return top;
};
/** Mar con degradado hacia el horizonte */
ART.sea = function (pb, y0, y1, pal, opts = {}) {
  for (let y = y0; y < y1; y++) {
    const t = (y - y0) / Math.max(1, y1 - y0);
    for (let x = 0; x < pb.w; x++) {
      const tt = opts.invert ? 1 - t : t;
      pb.set(x, y, rampDither(pal, tt * 0.9 + 0.05, x, y));
    }
  }
};

/* ---------- Vegetación ---------- */
ART.palm = function (pb, x, y, hgt, lean, seed, pal = RAMP.leaf) {
  const r = RNG(seed);
  // tronco segmentado
  let px = x, py = y;
  const segs = Math.floor(hgt / 3);
  for (let i = 0; i < segs; i++) {
    const t = i / segs;
    const nx = x + Math.sin(t * 1.4) * lean, ny = y - i * 3;
    pb.rect(Math.round(nx) - 2, Math.round(ny) - 3, 4, 3, '#8a5a3c');
    pb.set(Math.round(nx) - 2, Math.round(ny) - 3, '#5a3826'); pb.set(Math.round(nx) + 1, Math.round(ny) - 1, '#5a3826');
    pb.hline(Math.round(nx) - 2, Math.round(nx) + 1, Math.round(ny) - 1, '#6e452e');
    pb.set(Math.round(nx) - 1, Math.round(ny) - 3, '#b07a50');
    px = nx; py = ny - 3;
  }
  // hojas (frondas)
  const fronds = 7;
  for (let f = 0; f < fronds; f++) {
    const a = -Math.PI + (f / (fronds - 1)) * Math.PI + r.range(-0.15, 0.15);
    const len = hgt * r.range(0.45, 0.62);
    let fx = px, fy = py;
    for (let s = 0; s < len; s++) {
      const t = s / len;
      fx = px + Math.cos(a) * s; fy = py + Math.sin(a) * s * 0.55 + t * t * len * 0.45;
      const wdt = Math.round((1 - t) * 3) + 1;
      for (let k = -wdt; k <= wdt; k++) {
        const c = k < 0 ? pal[5] : k === 0 ? pal[6] : pal[3];
        pb.set(Math.round(fx), Math.round(fy) + k, c);
      }
      if (s % 2 === 0) pb.set(Math.round(fx), Math.round(fy) + wdt + 1, pal[2]);
    }
  }
  pb.disc(px, py + 1, 2, '#5a3826'); pb.set(Math.round(px) - 1, Math.round(py), '#c8861a'); pb.set(Math.round(px) + 1, Math.round(py) + 1, '#9a5e12');
};
/** Cactus columnar (cardón) */
ART.cactus = function (pb, x, y, hgt, seed, pal = RAMP.leaf) {
  const r = RNG(seed);
  const col = (cx, cy0, cy1, w) => {
    for (let yy = Math.round(cy1); yy <= cy0; yy++) {
      for (let k = -w; k <= w; k++) {
        const t = k / w;
        let idx = t < -0.4 ? 5 : t < 0.2 ? 4 : t < 0.7 ? 3 : 2;
        if (Math.abs(k) === w) idx = 1;
        if ((k + 64) % 2 === 0 && Math.abs(k) < w && idx > 2) idx -= 0;
        pb.set(Math.round(cx + k), yy, pal[idx]);
      }
      if ((yy % 4) === 0) for (let k = -w + 1; k < w; k += 2) pb.set(Math.round(cx + k), yy, '#fff6d8');
    }
    for (let k = -w + 1; k < w; k++) pb.set(Math.round(cx + k), Math.round(cy1) - 1, pal[k < 0 ? 5 : 4]);
  };
  const w = Math.max(2, Math.round(hgt / 14));
  col(x, y, y - hgt, w);
  const arms = r.int(1, 3);
  for (let i = 0; i < arms; i++) {
    const side = i % 2 ? 1 : -1;
    const ay = y - hgt * r.range(0.3, 0.6);
    const ax = x + side * (w + 3);
    const ah = hgt * r.range(0.25, 0.45);
    for (let k = 0; k <= 3; k++) pb.rect(Math.round(x + side * (w + k)), Math.round(ay - 1), 1, w * 2 - 1, pal[3]);
    col(ax, ay + w, ay - ah, Math.max(1, w - 1));
  }
  if (r.chance(0.6)) { pb.set(Math.round(x), Math.round(y - hgt - 2), '#f78acb'); pb.set(Math.round(x) + 1, Math.round(y - hgt - 2), '#ffd8ec'); }
};
/** Nopal / tuna */
ART.nopal = function (pb, x, y, size, seed, pal = RAMP.leaf) {
  const r = RNG(seed);
  const pads = [[0, 0, size, size * 1.3]];
  for (let i = 0; i < 3 + r.int(0, 2); i++) { const p = r.pick(pads); pads.push([p[0] + r.range(-size, size), p[1] - p[3] * r.range(0.7, 1.1), size * r.range(0.6, 0.9), size * r.range(0.8, 1.2)]); }
  for (const [px, py, rw, rh] of pads) {
    const cx = x + px, cy = y + py - rh;
    for (let yy = -rh; yy <= rh; yy++) for (let xx = -rw; xx <= rw; xx++) {
      const d = (xx * xx) / (rw * rw) + (yy * yy) / (rh * rh);
      if (d > 1) continue;
      let idx = xx < -rw * 0.3 && yy < 0 ? 5 : d > 0.75 ? 2 : 4;
      if (d > 0.92) idx = 1;
      pb.set(Math.round(cx + xx), Math.round(cy + yy), pal[idx]);
    }
    pb.set(Math.round(cx), Math.round(cy - rh * 0.3), '#fff6d8'); pb.set(Math.round(cx - rw * 0.4), Math.round(cy + rh * 0.2), '#fff6d8');
    if (r.chance(0.5)) { pb.disc(cx + rw * 0.2, cy - rh, 1.4, '#e05aa0'); pb.set(Math.round(cx + rw * 0.2) - 1, Math.round(cy - rh) - 1, '#ffc4dc'); }
  }
};
/** Agave */
ART.agave = function (pb, x, y, size, pal = ['#0f3b3a', '#1c5a50', '#2c7a66', '#4a9e7e', '#7cc4a0', '#b8e6c4']) {
  const leaves = 9;
  for (let i = 0; i < leaves; i++) {
    const a = -Math.PI * (0.08 + 0.84 * i / (leaves - 1));
    const len = size * (0.7 + 0.3 * Math.sin(i * 1.7));
    for (let s = 0; s < len; s++) {
      const t = s / len;
      const lx = x + Math.cos(a) * s, ly = y + Math.sin(a) * s;
      const wdt = Math.round((1 - t) * 2.2);
      for (let k = -wdt; k <= wdt; k++) pb.set(Math.round(lx + k * Math.sin(a) * 0.6), Math.round(ly), pal[k < 0 ? 4 : k === 0 ? 5 : 2]);
    }
    pb.set(Math.round(x + Math.cos(a) * len), Math.round(y + Math.sin(a) * len), '#c97c38');
  }
};
/** Arbusto xerófito */
ART.shrub = function (pb, x, y, r0, seed, pal = RAMP.moss) {
  const r = RNG(seed);
  const n = 5 + r.int(0, 4);
  for (let i = 0; i < n; i++) {
    const bx = x + r.range(-r0, r0), by = y - r.range(1, r0 * 0.9), br = r0 * r.range(0.4, 0.7);
    for (let yy = -br; yy <= br; yy++) for (let xx = -br; xx <= br; xx++) {
      const d = Math.hypot(xx, yy) / br;
      if (d > 1 || by + yy > y) continue;
      const lit = (-xx - yy) / br;
      let idx = lit > 0.5 ? 4 : lit > -0.2 ? 3 : 2;
      if (hash2(Math.round(bx + xx), Math.round(by + yy), seed) < 0.18) idx -= 1;
      if (d > 0.9) idx = 1;
      pb.set(Math.round(bx + xx), Math.round(by + yy), pal[clamp(idx, 0, pal.length - 1)]);
    }
  }
  if (r.chance(0.5)) for (let i = 0; i < 3; i++) pb.set(Math.round(x + r.range(-r0, r0)), Math.round(y - r.range(2, r0)), r.pick(['#ffe14d', '#f78acb', '#fffaf0']));
};
/** Mata de hierba / pasto */
ART.grass = function (pb, x, y, n, seed, pal = RAMP.leaf) {
  const r = RNG(seed);
  for (let i = 0; i < n; i++) {
    const gx = x + r.range(-n, n), h = r.int(2, 6), lean = r.range(-1.2, 1.2);
    for (let k = 0; k < h; k++) pb.set(Math.round(gx + lean * k / h), y - k, pal[k === h - 1 ? 6 : k > h / 2 ? 5 : 3]);
  }
};
/** Árbol frondoso (moringa / trupillo) */
ART.tree = function (pb, x, y, hgt, seed, pal = RAMP.leaf, trunk = ['#3a2218', '#5a3826', '#7a5236', '#9a6e4a']) {
  const r = RNG(seed);
  for (let i = 0; i < hgt * 0.45; i++) { const xx = x + Math.sin(i * 0.12) * 1.5; pb.rect(Math.round(xx) - 2, y - i, 4, 1, trunk[1]); pb.set(Math.round(xx) - 1, y - i, trunk[2]); pb.set(Math.round(xx) + 1, y - i, trunk[0]); }
  const cy = y - hgt * 0.6;
  const blobs = 7 + r.int(0, 4);
  for (let i = 0; i < blobs; i++) {
    const bx = x + r.range(-hgt * 0.38, hgt * 0.38), by = cy + r.range(-hgt * 0.22, hgt * 0.15), br = hgt * r.range(0.15, 0.25);
    for (let yy = -br; yy <= br; yy++) for (let xx = -br; xx <= br; xx++) {
      const d = Math.hypot(xx, yy) / br; if (d > 1) continue;
      const lit = (-xx * 0.6 - yy) / br;
      let idx = lit > 0.55 ? 6 : lit > 0.15 ? 5 : lit > -0.3 ? 4 : 3;
      if (hash2(Math.round(bx + xx) >> 1, Math.round(by + yy) >> 1, seed) < 0.2) idx--;
      if (d > 0.93) idx = 2;
      pb.set(Math.round(bx + xx), Math.round(by + yy), pal[clamp(idx, 0, pal.length - 1)]);
    }
  }
};

/* ---------- Arquitectura bioclimática de Aridia ---------- */
const HOUSE_COLS = [
  ['#7a2a3a', '#b04450', '#e06a70', '#f6a0a0', '#ffd0c8'],
  ['#0e5a5e', '#178a86', '#28b8aa', '#6ae0cc', '#c0f8ea'],
  ['#8a5e14', '#c08a20', '#eab02a', '#ffd86a', '#fff0b0'],
  ['#3a2a7a', '#5a44a8', '#8070d0', '#b0a4ec', '#e0dafc'],
  ['#8a3e1e', '#c06030', '#e8884a', '#f8b880', '#ffe2c4'],
  ['#2a5a2a', '#3e8040', '#5aa85a', '#90d080', '#c8f0b0'],
  ['#e8dcc0', '#f2e8d0', '#faf4e4', '#fffcf4', '#ffffff'],
];
ART.house = function (pb, x, y, w, h, seed, opts = {}) {
  const r = RNG(seed);
  const pal = opts.pal || r.pick(HOUSE_COLS);
  const night = !!opts.night;
  // muro con luz desde la izquierda
  pb.rect(x, y - h, w, h, pal[2]);
  pb.rect(x + w - Math.max(3, w * 0.18 | 0), y - h, Math.max(3, w * 0.18 | 0), h, pal[1]);
  pb.rect(x, y - h, 2, h, pal[3]);
  for (let yy = y - h; yy < y; yy++) for (let xx = x; xx < x + w; xx++) if (hash2(xx, yy, seed) < 0.06) pb.set(xx, yy, pal[1]);
  // zócalo
  pb.rect(x, y - 3, w, 3, pal[0]);
  // techo: cúpula, terraza o torre de viento
  const roof = opts.roof || r.pick(['dome', 'flat', 'tower', 'flat', 'arch']);
  if (roof === 'dome') {
    const rx = w * 0.3, ry = rx * 0.8, cx = x + w * 0.5;
    for (let yy = -ry; yy <= 0; yy++) for (let xx = -rx; xx <= rx; xx++) if ((xx * xx) / (rx * rx) + (yy * yy) / (ry * ry) <= 1) pb.set(Math.round(cx + xx), Math.round(y - h + yy), xx < -rx * 0.2 ? '#fffaf0' : xx < rx * 0.4 ? '#e6e0f4' : '#b8b0d8');
    pb.set(Math.round(cx), Math.round(y - h - ry - 1), '#ffe14d');
  } else if (roof === 'tower') {
    const tw = Math.max(6, w * 0.22 | 0), tx = x + (r.chance(0.5) ? 2 : w - tw - 2), th = h * 0.55;
    pb.rect(tx, y - h - th, tw, th, pal[2]); pb.rect(tx + tw - 2, y - h - th, 2, th, pal[1]);
    for (let k = 0; k < 2; k++) pb.rect(tx + 2, y - h - th + 3 + k * 5, tw - 4, 3, '#2a1a2a');
    pb.rect(tx - 1, y - h - th - 2, tw + 2, 2, pal[3]);
  } else if (roof === 'arch') {
    pb.rect(x - 1, y - h - 2, w + 2, 2, pal[3]);
    for (let k = 0; k < 3; k++) pb.set(x + 3 + k * Math.floor(w / 3), y - h - 3, '#86e36f');
  } else {
    pb.rect(x - 1, y - h - 2, w + 2, 2, pal[3]); pb.hline(x - 1, x + w, y - h, pal[0]);
    if (opts.solarRoof || r.chance(0.5)) { for (let k = 2; k < w - 4; k += 6) { pb.rect(x + k, y - h - 6, 5, 3, '#1f469e'); pb.set(x + k + 1, y - h - 6, '#8cc4ff'); pb.vline(x + k + 2, y - h - 3, y - h - 2, '#98c6d2'); } }
    if (r.chance(0.5)) { pb.rect(x + w - 8, y - h - 5, 3, 3, '#c9622e'); pb.set(x + w - 7, y - h - 7, '#4ccb70'); pb.set(x + w - 8, y - h - 6, '#86e36f'); }
  }
  // ventanas con celosía y puerta en arco
  const winCol = night ? '#ffd86a' : '#1a2a4a', winHi = night ? '#fff6c0' : '#4a7aa8';
  const nw = Math.max(1, Math.floor((w - 8) / 12));
  for (let i = 0; i < nw; i++) {
    const wx = x + 5 + i * 12, wy = y - h + 6;
    if (wy + 10 > y - 12) break;
    pb.rect(wx, wy, 6, 8, winCol); pb.rect(wx, wy, 6, 2, winHi);
    pb.vline(wx + 3, wy, wy + 7, pal[0]); pb.hline(wx, wx + 5, wy + 4, pal[0]);
    pb.rect(wx - 1, wy + 8, 8, 1, pal[3]);
    if (r.chance(0.4)) { pb.rect(wx - 1, wy + 9, 8, 2, '#c9622e'); pb.set(wx, wy + 8, '#4ccb70'); pb.set(wx + 3, wy + 7, '#f78acb'); pb.set(wx + 5, wy + 8, '#86e36f'); }
  }
  const dx = x + Math.floor(w * 0.35), dw = 8;
  pb.rect(dx, y - 13, dw, 13, night ? '#5a3a1a' : '#3a2018'); pb.rect(dx + 1, y - 15, dw - 2, 2, night ? '#5a3a1a' : '#3a2018');
  pb.rect(dx + 1, y - 12, 2, 11, night ? '#7a5228' : '#5a3424'); pb.set(dx + dw - 2, y - 7, '#ffe14d');
  if (opts.awning || r.chance(0.35)) {
    const ac = r.pick(['#ff6b6b', '#20d6c7', '#ffe14d', '#8d6bff']);
    for (let k = 0; k < w; k++) { pb.set(x + k, y - 17, k % 4 < 2 ? ac : '#fffaf0'); pb.set(x + k, y - 16, k % 4 < 2 ? shade(ac, -0.2) : '#e8e0d0'); }
  }
};

/* ---------- Infraestructura ---------- */
/** Fila de paneles fotovoltaicos en perspectiva */
ART.pvRow = function (pb, x, y, w, seed, opts = {}) {
  const tilt = opts.tilt ?? 8, depth = opts.depth ?? 10;
  const pal = RAMP.pv;
  const soil = opts.soil || 0;
  // estructura
  for (let k = 4; k < w; k += 18) { pb.vline(x + k, y - 2, y + 6, '#6aa0b4'); pb.vline(x + k + 1, y, y + 6, '#345a78'); }
  // superficie inclinada (paralelogramo)
  for (let j = 0; j < depth; j++) {
    const yy = y - j;
    const off = Math.round(j * tilt / depth);
    for (let i = 0; i < w; i++) {
      const xx = x + i + off;
      const cell = (i % 6 === 0) || (j % 4 === 0);
      let c = cell ? pal[1] : pal[3 + ((j > depth * 0.55) ? 1 : 0)];
      // reflejo diagonal del cielo
      if (!cell && ((i + j * 2 + (seed % 7)) % 23) < 3) c = pal[6];
      if (!cell && soil > 0 && hash2(xx, yy, seed) < soil * 0.6) c = '#c9a46a';
      pb.set(xx, yy, c);
    }
  }
  pb.hline(x + tilt, x + w + tilt - 1, y - depth, '#d6efff');
  pb.hline(x, x + w - 1, y + 1, '#0a1440');
};
/** Tanque cilíndrico con bandas y escalerilla */
ART.tank = function (pb, x, y, w, h, pal = RAMP.steelW, opts = {}) {
  for (let i = 0; i < w; i++) {
    const t = i / (w - 1);
    const idx = t < 0.15 ? 4 : t < 0.45 ? 5 : t < 0.75 ? 3 : t < 0.92 ? 2 : 1;
    pb.vline(x + i, y - h, y - 1, pal[idx]);
  }
  // tapa elíptica
  for (let i = 0; i < w; i++) { const t = (i - w / 2) / (w / 2); const dy = Math.round(Math.sqrt(Math.max(0, 1 - t * t)) * Math.max(2, w * 0.12)); pb.vline(x + i, y - h - dy, y - h, i < w * 0.4 ? pal[6] : pal[4]); }
  for (let k = 1; k < 4; k++) pb.hline(x, x + w - 1, y - Math.round(h * k / 4), pal[1]);
  if (opts.band) { pb.rect(x, y - Math.round(h * 0.55), w, 4, opts.band); pb.hline(x, x + w - 1, y - Math.round(h * 0.55), shade(opts.band, 0.3)); }
  if (opts.ladder) for (let yy = y - h; yy < y; yy += 3) { pb.hline(x + w - 5, x + w - 2, yy, '#263442'); pb.vline(x + w - 5, y - h, y, '#263442'); pb.vline(x + w - 2, y - h, y, '#263442'); }
  if (opts.label) { pb.rect(x + 3, y - h + 6, Math.min(w - 6, 14), 5, '#102a43'); pb.hline(x + 4, x + 4 + Math.min(w - 8, 10), y - h + 8, opts.labelCol || '#56e5ff'); }
};
/** Tubería horizontal/vertical con brillo y bridas */
ART.pipe = function (pb, x0, y0, x1, y1, r, kind = 'water') {
  const K = PIPE_PAL[kind] || PIPE_PAL.water;
  const horiz = Math.abs(x1 - x0) >= Math.abs(y1 - y0);
  if (horiz) {
    const xa = Math.min(x0, x1), xb = Math.max(x0, x1);
    for (let k = -r; k <= r; k++) { const t = (k + r) / (2 * r); pb.hline(xa, xb, y0 + k, K[t < 0.25 ? 4 : t < 0.5 ? 3 : t < 0.8 ? 2 : 1]); }
    for (let xx = xa + 8; xx < xb; xx += 22) { pb.rect(xx, y0 - r - 1, 2, 2 * r + 3, K[1]); pb.vline(xx, y0 - r - 1, y0 + r + 1, K[4]); }
  } else {
    const ya = Math.min(y0, y1), yb = Math.max(y0, y1);
    for (let k = -r; k <= r; k++) { const t = (k + r) / (2 * r); pb.vline(x0 + k, ya, yb, K[t < 0.25 ? 4 : t < 0.5 ? 3 : t < 0.8 ? 2 : 1]); }
    for (let yy = ya + 8; yy < yb; yy += 22) { pb.rect(x0 - r - 1, yy, 2 * r + 3, 2, K[1]); pb.hline(x0 - r - 1, x0 + r + 1, yy, K[4]); }
  }
};
const PIPE_PAL = {
  water: ['#0a2a40', '#106884', '#1491aa', '#22bdd0', '#a6f4ff'],
  seawater: ['#0a1f4a', '#0f3a74', '#1063a6', '#1283bf', '#6cf0db'],
  brine: ['#3c1046', '#621a66', '#8e2a80', '#bc3e92', '#f888b8'],
  power: ['#3a2208', '#6a3e0e', '#c8861a', '#eab02a', '#fff09a'],
  h2: ['#0b2b40', '#16768c', '#22a2b2', '#40d0d4', '#d8fff8'],
  steel: ['#1d2a48', '#345a78', '#477a94', '#6aa0b4', '#cfe8ee'],
  irrigation: ['#0f3b20', '#1f6a3a', '#33a552', '#4ccb70', '#c2f58e'],
};

/* ---------- Elementos dinámicos (ctx) ---------- */
/** Aerogenerador: torre + góndola + 3 aspas rotando. size≈altura de torre */
ART.turbine = function (g, x, y, size, angle, opts = {}) {
  const s = size;
  const col = opts.col || '#f4fdff', sh = opts.shade || '#98c6d2', dark = opts.dark || '#477a94';
  const tw = Math.max(1, Math.round(s / 30));
  // torre cónica
  for (let i = 0; i < s; i++) {
    const t = i / s;
    const hw = Math.max(0.5, tw * (1.4 - t * 0.6));
    const yy = Math.round(y - i);
    frect(g, Math.round(x - hw), yy, Math.max(1, Math.round(hw)), 1, col);
    frect(g, Math.round(x), yy, Math.max(1, Math.round(hw)), 1, sh);
  }
  const hx = Math.round(x), hy = Math.round(y - s);
  // góndola
  const nw = Math.max(2, Math.round(s / 12)), nh = Math.max(1, Math.round(s / 28));
  frect(g, hx - nw * 0.3, hy - nh, nw, nh * 2, col); frect(g, hx - nw * 0.3, hy, nw, nh, sh);
  // aspas
  const L = s * 0.48;
  for (let k = 0; k < 3; k++) {
    const a = angle + k * TAU / 3;
    const ex = hx + Math.cos(a) * L, ey = hy + Math.sin(a) * L;
    fline(g, hx, hy, ex, ey, col);
    if (s > 50) { fline(g, hx + Math.cos(a + 0.06) * 3, hy + Math.sin(a + 0.06) * 3, hx + Math.cos(a + 0.03) * L * 0.6, hy + Math.sin(a + 0.03) * L * 0.6, sh); }
    if (opts.tips) fpx(g, ex, ey, '#ff4e5d');
  }
  frect(g, hx - 1, hy - 1, 2, 2, dark);
  if (opts.stopped) { frect(g, hx - 1, hy - 5, 2, 2, (Game.frame >> 4) & 1 ? '#ff4e5d' : '#6a1414'); }
};
/** Gaviota / ave pequeña animada */
ART.bird = function (g, x, y, t, col = '#fffaf0', dark = '#3a4a6e') {
  const f = Math.floor(t * 8) % 4;
  const wing = [-2, -1, 0, -1][f];
  fpx(g, x, y, col); fpx(g, x + 1, y, col);
  fpx(g, x - 1, y + wing, dark); fpx(g, x - 2, y + wing * 2 + (wing ? 1 : 0), dark);
  fpx(g, x + 2, y + wing, dark); fpx(g, x + 3, y + wing * 2 + (wing ? 1 : 0), dark);
};
/** Flamenco (sprite procedural, animación de cuello) */
ART.flamingo = function (g, x, y, t, flip = 1) {
  const c1 = '#ff8ab8', c2 = '#f05a9a', c3 = '#ffc4dc', leg = '#e0607e';
  const bob = Math.round(Math.sin(t * 2) * 1);
  g.save(); g.translate(Math.round(x), Math.round(y)); g.scale(flip, 1);
  frect(g, 0, -12, 1, 12, leg); frect(g, 2, -12, 1, 7, leg); frect(g, 3, -6, 1, 1, leg); frect(g, 2, -5, 1, 1, leg);
  frect(g, -3, -17, 8, 5, c1); frect(g, -2, -18, 6, 1, c3); frect(g, -3, -13, 8, 1, c2); frect(g, -5, -16, 2, 2, c2);
  const nx = 4, ny = -18 + bob;
  frect(g, nx, ny - 8, 1, 9, c1); frect(g, nx + 1, ny - 9, 2, 2, c1); frect(g, nx + 3, ny - 8, 2, 1, '#fffaf0'); frect(g, nx + 4, ny - 7, 1, 2, '#140d26');
  g.restore();
};
