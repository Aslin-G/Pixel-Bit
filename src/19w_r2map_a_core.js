/* =====================================================================
   19w_r2map_a_core.js — Núcleo del rollout R2MAP (mapa del mundo,
   miniaturas de capítulo y aspecto de los simuladores).
   API:
     R2MAP.down(pb, f, {sat, sharp, cut}) → PixelBuffer reducido f:1 por
         promedio de área con cobertura alfa (≥ cut opaco), realce de
         saturación y de contraste local (mantiene el grano del pixel art)
     R2MAP.mini(w, h, f, draw(pb)) → PixelBuffer w×h: dibuja a f× con los
         kits VISTA/PF y reduce (miniaturas ricas en detalle)
     R2MAP.badge(id, state) → lienzo de la insignia-isla flotante del nodo
         (isla de roca con tapa de bioma, icono emisivo, anillo de neón)
     R2MAP.BIOME_TOP[id]   rampa de la tapa de cada isla-nodo
   Sin tramado: todo en bandas o promedios.
   ===================================================================== */
const R2MAP = (() => {
  const M = {};
  /** Reducción por área: media de los píxeles opacos de cada celda f×f */
  M.down = function (pb, f, o = {}) {
    const w = Math.floor(pb.w / f), h = Math.floor(pb.h / f), out = new PixelBuffer(w, h);
    const sat = o.sat ?? 0.12, sharp = o.sharp ?? 0.35, cut = o.cut ?? 0.45, d = pb.data, n = f * f;
    const R = new Float32Array(w * h), G = new Float32Array(w * h), B = new Float32Array(w * h), A = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, c = 0;
      for (let yy = 0; yy < f; yy++) {
        const row = (y * f + yy) * pb.w + x * f;
        for (let xx = 0; xx < f; xx++) {
          const u = d[row + xx]; if ((u >>> 24) < 128) continue;
          r += u & 255; g += (u >>> 8) & 255; b += (u >>> 16) & 255; c++;
        }
      }
      const i = y * w + x;
      A[i] = c / n;
      if (c) { R[i] = r / c; G[i] = g / c; B[i] = b / c; }
    }
    // realce de contraste local (unsharp 3×3 sobre luminancia) y de saturación
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (A[i] < cut) continue;
      let r = R[i], g = G[i], b = B[i];
      if (sharp > 0) {
        let sr = 0, sg = 0, sb = 0, c = 0;
        for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) {
          const X = x + xx, Y = y + yy; if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
          const j = Y * w + X; if (A[j] < cut) continue;
          sr += R[j]; sg += G[j]; sb += B[j]; c++;
        }
        if (c) { r += (r - sr / c) * sharp; g += (g - sg / c) * sharp; b += (b - sb / c) * sharp; }
      }
      if (sat) { const l = (r + g + b) / 3; r += (r - l) * sat; g += (g - l) * sat; b += (b - l) * sat; }
      out.data[i] = ((255 << 24) | (clamp(Math.round(b), 0, 255) << 16) | (clamp(Math.round(g), 0, 255) << 8) | clamp(Math.round(r), 0, 255)) >>> 0;
    }
    return out;
  };
  /** Reducción por un factor no entero (f ≥ 1): remuestreo por área con pesos fraccionarios */
  M.downF = function (pb, f, o = {}) {
    if (Math.abs(f - Math.round(f)) < 1e-6) return M.down(pb, Math.round(f), o);
    const w = Math.floor(pb.w / f), h = Math.floor(pb.h / f), out = new PixelBuffer(w, h), d = pb.data, cut = o.cut ?? 0.45;
    const tmp = new PixelBuffer(w, h); const A = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const x0 = x * f, x1 = x0 + f, y0 = y * f, y1 = y0 + f;
      let r = 0, g = 0, b = 0, wt = 0, tot = 0;
      for (let yy = Math.floor(y0); yy < Math.ceil(y1); yy++) for (let xx = Math.floor(x0); xx < Math.ceil(x1); xx++) {
        const wx = Math.min(xx + 1, x1) - Math.max(xx, x0), wy = Math.min(yy + 1, y1) - Math.max(yy, y0), ww = wx * wy;
        if (ww <= 0 || xx >= pb.w || yy >= pb.h) continue;
        tot += ww; const u = d[yy * pb.w + xx]; if ((u >>> 24) < 128) continue;
        r += (u & 255) * ww; g += ((u >>> 8) & 255) * ww; b += ((u >>> 16) & 255) * ww; wt += ww;
      }
      const i = y * w + x; A[i] = tot ? wt / tot : 0;
      if (wt) tmp.data[i] = ((255 << 24) | (Math.round(b / wt) << 16) | (Math.round(g / wt) << 8) | Math.round(r / wt)) >>> 0;
    }
    // reutiliza el realce de M.down sobre la imagen ya reducida (f = 1) respetando la cobertura
    for (let i = 0; i < w * h; i++) if (A[i] < cut) tmp.data[i] = 0;
    return M.down(tmp, 1, o);
  };
  /** Ilustración a f× reducida a w×h */
  M.mini = function (w, h, f, draw, o = {}) {
    const pb = new PixelBuffer(w * f, h * f);
    draw(pb);
    return M.down(pb, f, o);
  };

  /* ---------- insignias-isla flotantes de los nodos del mapa ---------- */
  // tapa de cada isla según el bioma del capítulo (de oscuro a claro)
  M.BIOME_TOP = {
    0: ['#5e3a18', '#9a6a2a', '#d09a48', '#f2c470', '#fde3a8'],      // plaza: losas ocres
    1: ['#2f5a1a', '#4f8a22', '#86b52e', '#bfd52c', '#efd83f'],      // costa: pradera
    2: ['#2a4a5e', '#4a7a92', '#86b8cc', '#c4e4ee', '#f2fbff'],      // planta: hormigón claro
    3: ['#7a3a6a', '#b0679a', '#e2a6cc', '#f8d6ea', '#fff4fa'],      // salinas
    4: ['#7a4410', '#b8702a', '#e8a048', '#fbcf78', '#fff0b8'],      // dunas
    5: ['#2f5a1a', '#4f8a22', '#86b52e', '#bfd52c', '#efd83f'],      // crestas de pradera
    6: ['#24304e', '#3a4e7a', '#5a7ab0', '#8cb0e0', '#cfe4ff'],      // bóveda
    7: ['#1e5a3e', '#2f9e62', '#4cd48e', '#80ecc2', '#d8fff0'],      // ciudadela H2
    8: ['#1f5a1c', '#3b8a22', '#6cc236', '#a8e04e', '#e6f58a'],      // oasis
    9: ['#5a2a1a', '#8e4a2a', '#c8743a', '#eba45c', '#fbd08a'],      // mesa
    10: ['#2c2458', '#4a3c8a', '#7a64c8', '#b49cff', '#e6dcff'],     // núcleo
  };
  const ROCK = ['#24102e', '#3e1636', '#5e2028', '#7e2f1c', '#a54a22', '#c8692c', '#e2903e', '#f4b45c'];
  const _badges = new Map();
  /** Isla flotante 30×20 con tapa de bioma, roca que se estrecha con estratos y luz de borde */
  M.islandSprite = function (id, dim) {
    const key = id + '|' + (dim ? 1 : 0);
    let c = _badges.get('isl|' + key); if (c) return c;
    const w = 30, h = 22, pb = new PixelBuffer(w, h), r = RNG(id * 131 + 9);
    const top = M.BIOME_TOP[id] || M.BIOME_TOP[0];
    const cx = 15, ty = 6;
    // cuerpo de roca: cono irregular hacia abajo
    for (let y = ty; y < h; y++) {
      const k = (y - ty) / (h - ty);
      const hw = Math.round(13.5 * Math.pow(1 - k, 0.85) + (vnoise(y * 0.7, id, 3) - 0.5) * 2.5);
      for (let x = cx - hw; x <= cx + hw; x++) {
        const u = (x - (cx - hw)) / Math.max(1, 2 * hw);
        let t = 0.82 - u * 0.62 - k * 0.45 + (hash2(x >> 1, y, id) - 0.5) * 0.12;
        if ((y + (x >> 2)) % 4 === 0) t -= 0.1;                  // estratos
        if (x === cx - hw) t += 0.12;                            // borde iluminado
        pb.set(x, y, ROCK[clamp(Math.round(t * (ROCK.length - 1)), 0, ROCK.length - 1)]);
      }
    }
    // tapa elíptica del bioma con borde frontal iluminado
    for (let y = ty - 4; y <= ty + 2; y++) for (let x = 1; x < w - 1; x++) {
      const nx = (x - cx + 0.5) / 14, ny = (y - ty + 1) / 4;
      if (nx * nx + ny * ny > 1) continue;
      let t = 0.62 - nx * 0.28 - ny * 0.2 + (hash2(x >> 1, y >> 1, id + 7) - 0.5) * 0.3;
      if (y >= ty + 1) t = 0.95;                                 // labio frontal
      pb.set(x, y, top[clamp(Math.round(t * (top.length - 1)), 0, top.length - 1)]);
    }
    // matas y cristales en la tapa
    for (let k = 0; k < 4; k++) { const x = r.int(4, w - 5), y = ty - 2 + r.int(-1, 1); pb.set(x, y, top[0]); pb.set(x, y - 1, top[1]); pb.set(x + 1, y - 1, top[2]); }
    // goteo de roca colgante
    pb.set(cx - 1, h - 1, ROCK[2]); pb.set(cx + 2, h - 2, ROCK[1]);
    pb.outline(n => darkOf(n, -0.62));
    if (dim) for (let i = 0; i < pb.data.length; i++) { const u = pb.data[i]; if (u >>> 24) pb.data[i] = U(hazeColor(u32ToHex(u), 0.55, '#3a4a6a')); }
    c = pb.toCanvas(); _badges.set('isl|' + key, c);
    return c;
  };
  /** Halo emisivo en anillos de alfa plano (sin tramado), cacheado por color y radio */
  M.glow = function (col, r, a = 0.5) {
    const key = 'glow|' + col + '|' + r + '|' + a;
    let c = _badges.get(key); if (c) return c;
    const s = r * 2 + 1; c = makeCanvas(s, s); const g = c.g;
    for (let k = 0; k < 4; k++) {
      const rr = r * (1 - k * 0.22);
      g.globalAlpha = a * (0.16 + k * 0.1); g.fillStyle = col;
      g.beginPath(); g.ellipse(r + 0.5, r + 0.5, rr, rr, 0, 0, TAU); g.fill();
    }
    g.globalAlpha = 1; _badges.set(key, c);
    return c;
  };
  /** Insignia completa (isla + anillo + icono) para un estado: 'locked'|'open'|'done' */
  M.badge = function (id, state, icon, ring) {
    const key = 'badge|' + id + '|' + state + '|' + icon + '|' + ring;
    let c = _badges.get(key); if (c) return c;
    const w = 40, h = 44; c = makeCanvas(w, h); const g = c.g;
    const lock = state === 'locked';
    // anillo de neón elíptico bajo la isla (halo translúcido + aro de 1 px pixelado)
    const ex = 20, ey = 34;
    if (!lock) { g.globalAlpha = 0.28; g.fillStyle = ring; g.beginPath(); g.ellipse(ex, ey, 17, 6, 0, 0, TAU); g.fill(); g.globalAlpha = 1; }
    for (let a = 0; a < 56; a++) { const an = a / 56 * TAU; fpx(g, ex + Math.cos(an) * 15.5, ey + Math.sin(an) * 4.6, lock ? '#3a4a6a' : a % 7 === 0 ? '#ffffff' : ring); }
    g.drawImage(M.islandSprite(id, lock), 5, 18);
    // icono emisivo sobre la isla con halo
    if (!lock) g.drawImage(M.glow(ring, 11, 0.55), 20 - 11, 13 - 11);
    const ic = Icons.hasBig(icon) ? Icons.big(icon) : Icons.get(icon, 2);
    if (lock) g.globalAlpha = 0.55;
    g.drawImage(ic, Math.round(20 - ic.width / 2), Math.round(13 - ic.height / 2));
    g.globalAlpha = 1;
    if (state === 'done') { const sx = 31, sy = 5; fpx(g, sx, sy - 2, '#fff2a0'); frect(g, sx - 1, sy - 1, 3, 3, '#ffd23a'); fpx(g, sx - 2, sy, '#ffd23a'); fpx(g, sx + 2, sy, '#ffd23a'); fpx(g, sx, sy + 2, '#c8861a'); fpx(g, sx, sy, '#ffffff'); }
    if (lock) { frect(g, 25, 14, 9, 8, '#000633'); frect(g, 26, 15, 7, 6, '#c8861a'); frect(g, 26, 15, 7, 2, '#f0b040'); fpx(g, 29, 17, '#000633'); frect(g, 27, 11, 1, 4, '#9ab4be'); frect(g, 31, 11, 1, 4, '#9ab4be'); frect(g, 28, 10, 3, 1, '#9ab4be'); }
    _badges.set(key, c);
    return c;
  };
  return M;
})();
