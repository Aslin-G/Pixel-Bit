/* =====================================================================
   17j_vista_hall.js — Interiores industriales del panorama (VISTA):
   nave de ósmosis inversa en 3/4 con fachada acristalada que deja ver el
   exterior (píxeles transparentes + velo de cristal y reflejos), cerchas
   con lucernarios, pilares en I, bastidores de tubos de presión,
   pasarelas con barandilla, conductos, rótulos, suelo pulido con
   reflejos y haces de luz volumétricos. Dinámicos: LED, pantallas,
   gancho de grúa. Sin tramado.
   API:
     VISTA.STEELW / VISTA.HALLW                        rampas de acero claro y muro
     VISTA.glazing(pb, x, y, w, h, {k, cols, rows, tint, a, frame, seed}) → {x,y,w,h}
     VISTA.truss(pb, x0, x1, y, h, {k, step, ramp, skylights})        → {lights:[[x,y]]}
     VISTA.ibeam(pb, x, y0, y1, w, {k, ramp, brace})
     VISTA.roRack(pb, x, y, {k, cols, rows, len, r, ramp, caps})       → {x0,y0,x1,y1,leds}
     VISTA.catwalk(pb, x0, x1, y, {k, rail})
     VISTA.duct(pb, x0, x1, y, h, {k})
     VISTA.sign(pb, x, y, text, {k, bg, fg, border, font})            → {w,h}
     VISTA.floorShine(pb, x0, x1, y0, y1, {k, ramp, refl:[x...]})
     VISTA.shafts(pb, list:[[x, y, w, len, slant]], {col, a})          (lienzo de luz aditivo)
     VISTA.drawLeds(g, list, ox, oy, t)      list: [[x, y, col, hz]]
     VISTA.drawScreens(g, list, ox, oy, t)   list: [{x, y, w, h, kind}]
     VISTA.drawHook(g, H, ox, oy, t)         H: {x, y, len}
     r3-int-a: VISTA.r3iaBeamSprite(w0,w1,h,s,col,steps) · VISTA.r3iaShafts(sc, S) · VISTA.r3iaDrawBeams(g, list, t, o)
   ===================================================================== */
(() => {
  const V = VISTA;
  const ramp = (r, k) => V.P32(V.hz(r, k || 0));
  const STEELW = ['#3a4458', '#4f5a72', '#6a7690', '#8a96ae', '#aab4c8', '#c8d0e0', '#e2e8f2', '#f6f8fc'];
  const HALLW = ['#5a6688', '#74809e', '#8e9ab6', '#a9b2cc', '#c4cce0', '#dce2ee', '#eef1f8', '#ffffff'];
  const YEL = ['#5a3a0a', '#9a6a10', '#d8a020', '#f8d040', '#fff0a0'];
  V.STEELW = STEELW; V.HALLW = HALLW;
  /** Fachada de vidrio: hueco transparente (se ve el exterior) con velo, montantes y reflejos */
  V.glazing = function (pb, x, y, w, h, o = {}) {
    const k = o.k || 0, F = ramp(o.frame || STEELW, k), nF = F.length, tint = U(o.tint || '#bfe6f6'), a = o.a ?? 0.14;
    const cols = o.cols || 4, rows = o.rows || 3, r = RNG(o.seed || 3);
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      if (xx < 0 || yy < 0 || xx >= pb.w || yy >= pb.h) continue;
      // velo de cristal más denso abajo; franjas diagonales de reflejo
      const t = (yy - y) / h, diag = ((xx - x) + (yy - y) * 0.9) % 70;
      let aa = a * (0.7 + t * 0.6);
      if (diag < 6) aa += 0.16; else if (diag < 9) aa += 0.07;
      pb.data[yy * pb.w + xx] = ((Math.round(clamp(aa, 0, 1) * 255) << 24) | (tint & 0xffffff)) >>> 0;
    }
    // montantes y travesaños con canto iluminado
    for (let c = 0; c <= cols; c++) { const mx = Math.round(x + c * w / cols); for (let yy = y; yy < y + h; yy++) { V.put(pb, mx - 1, yy, F[nF - 1]); V.put(pb, mx, yy, F[nF - 3]); V.put(pb, mx + 1, yy, F[2]); } }
    for (let q = 0; q <= rows; q++) { const my = Math.round(y + q * h / rows); for (let xx = x; xx < x + w; xx++) { V.put(pb, xx, my - 1, F[nF - 2]); V.put(pb, xx, my, F[3]); } }
    // marco grueso
    for (let xx = x - 3; xx < x + w + 3; xx++) { V.put(pb, xx, y - 3, F[nF - 1]); V.put(pb, xx, y - 2, F[nF - 3]); V.put(pb, xx, y - 1, F[1]); V.put(pb, xx, y + h, F[nF - 1]); V.put(pb, xx, y + h + 1, F[nF - 2]); V.put(pb, xx, y + h + 2, F[2]); V.put(pb, xx, y + h + 3, F[0]); }
    for (let yy = y - 3; yy < y + h + 3; yy++) { V.put(pb, x - 3, yy, F[nF - 1]); V.put(pb, x - 2, yy, F[nF - 3]); V.put(pb, x + w + 1, yy, F[2]); V.put(pb, x + w + 2, yy, F[1]); }
    return { x, y, w, h };
  };
  /** Cercha Warren con cordones iluminados arriba y diagonales; lucernarios transparentes entre nudos */
  V.truss = function (pb, x0, x1, y, h, o = {}) {
    const k = o.k || 0, R = ramp(o.ramp || STEELW, k), n = R.length, st = o.step || 24, lights = [];
    for (let x = x0; x < x1; x++) { V.put(pb, x, y, R[n - 1]); V.put(pb, x, y + 1, R[n - 3]); V.put(pb, x, y + 2, R[1]); V.put(pb, x, y + h, R[n - 2]); V.put(pb, x, y + h + 1, R[2]); V.put(pb, x, y + h + 2, R[0]); }
    for (let x = x0; x < x1; x += st) {
      V.line(pb, x, y + 2, x + st / 2, y + h, (t, px, py) => R[n - 3]);
      V.line(pb, x + 1, y + 2, x + st / 2 + 1, y + h, (t, px, py) => R[1]);
      V.line(pb, x + st / 2, y + h, x + st, y + 2, (t, px, py) => R[n - 2]);
      V.line(pb, x + st / 2 + 1, y + h, x + st + 1, y + 2, (t, px, py) => R[2]);
      for (let yy = y; yy <= y + h; yy++) V.put(pb, x, yy, R[n - 4]);
      if (o.lamps && ((x - x0) / st) % (o.lamps) === 0) lights.push([x + (st >> 1), y + h + 3]);
    }
    return { lights };
  };
  /** Pilar en I visto de frente (alas iluminadas, alma en sombra, placa base y cartelas) */
  V.ibeam = function (pb, x, y0, y1, w, o = {}) {
    const k = o.k || 0, R = ramp(o.ramp || STEELW, k), n = R.length;
    for (let yy = y0; yy < y1; yy++) for (let xx = 0; xx < w; xx++) {
      const fl = xx < 2 || xx >= w - 2;
      let i = fl ? (xx === 0 ? n - 1 : xx === 1 ? n - 2 : xx === w - 1 ? 1 : 2) : (xx < w * 0.45 ? n - 4 : n - 5);
      if (!fl && (yy - y0) % 40 < 2) i = n - 2;
      V.put(pb, x + xx, yy, R[clamp(i, 0, n - 1)]);
    }
    for (let xx = -2; xx < w + 2; xx++) for (let q = 0; q < 3; q++) V.put(pb, x + xx, y1 - 1 - q, R[q === 2 ? n - 1 : 2]);
    for (let yy = y0 + 20; yy < y1 - 10; yy += 40) { V.put(pb, x + 1, yy, R[0]); V.put(pb, x + w - 2, yy, R[0]); }
    if (o.brace) { const bx = o.brace; V.line(pb, x + w, y0 + 10, x + w + bx, y0 + 10 + Math.abs(bx), () => R[n - 3]); V.line(pb, x + w, y0 + 11, x + w + bx, y0 + 11 + Math.abs(bx), () => R[1]); }
  };
  /** Bastidor de tubos de presión (OI) en 3/4: filas de tubos con tapas azules, colectores y LED */
  V.roRack = function (pb, x, y, o = {}) {
    const k = o.k || 0, cols = o.cols || 2, rows = o.rows || 4, len = o.len || 70, r = o.r || 3, gap = o.gap ?? 2;
    const ST = ramp(STEELW, k), nS = ST.length, leds = [];
    const tubes = o.ramp || ['#2a3a5a', '#4a6a90', '#7aa0c4', '#b6d4e4', '#e8f2f6', '#ffffff'];
    const caps = o.caps || ['#0e2a4a', '#1e4a7c', '#3a78b0', '#6ab4e8'];
    const pitch = r * 2 + gap, hh = rows * pitch + 4;
    for (let c = 0; c < cols; c++) {
      const bx = x + c * Math.round(r * 1.6), by = y - c * Math.round(r * 1.2);
      // bastidor trasero (sombra) y postes
      for (let yy = by - hh; yy <= by; yy++) { V.put(pb, bx - 2, yy, ST[nS - 2]); V.put(pb, bx - 1, yy, ST[2]); V.put(pb, bx + len + 1, yy, ST[nS - 3]); V.put(pb, bx + len + 2, yy, ST[1]); }
      for (let q = 0; q < rows; q++) {
        const cy = by - 3 - r - q * pitch;
        V.cylH(pb, bx, cy, len, r, tubes, { k, caps });
        // abrazaderas
        for (const fx of [Math.round(len * 0.25), Math.round(len * 0.75)]) for (let yy = -r; yy <= r; yy++) V.put(pb, bx + fx, cy + yy, ST[yy < 0 ? nS - 1 : 2]);
      }
      // travesaños del bastidor
      for (let xx = bx - 2; xx <= bx + len + 2; xx++) { V.put(pb, xx, by, ST[nS - 1]); V.put(pb, xx, by + 1, ST[1]); V.put(pb, xx, by - hh, ST[nS - 2]); }
      leds.push([bx + len - 3, by - hh + 2]);
    }
    // colectores verticales: alimentación azul a la izquierda, permeado cian a la derecha
    V.pipe(pb, [[x - 5, y + 2], [x - 5, y - hh - 6]], 1, ['#0e2a4a', '#1e4a7c', '#3a78b0', '#6ab4e8', '#bfe6ff'], { k });
    V.pipe(pb, [[x + len + 6, y + 2], [x + len + 6, y - hh - 4]], 1, ['#0c2e4a', '#217b9c', '#22c1e7', '#71dfef', '#abfafd'], { k: k * 0.5 });
    return { x0: x - 6, y0: y - hh - 8, x1: x + len + 8 + cols * r * 2, y1: y + 2, leds, permX: x + len + 6, permY0: y - hh - 4, permY1: y + 2 };
  };
  /** Pasarela de rejilla con barandilla de tubo y rodapié */
  V.catwalk = function (pb, x0, x1, y, o = {}) {
    const k = o.k || 0, R = ramp(STEELW, k), n = R.length, Y = ramp(o.rail || YEL, k);
    for (let x = x0; x < x1; x++) {
      V.put(pb, x, y, R[n - 1]); V.put(pb, x, y + 1, (x & 1) ? R[2] : R[4]); V.put(pb, x, y + 2, R[1]);
      V.put(pb, x, y - 8, Y[3]); V.put(pb, x, y - 7, Y[1]); V.put(pb, x, y - 4, Y[2]);
      if ((x - x0) % 12 === 0) for (let q = 1; q < 8; q++) V.put(pb, x, y - q, Y[q < 2 ? 3 : 2]);
      V.put(pb, x, y - 1, Y[0]);
    }
  };
  /** Conducto de climatización con nervios */
  V.duct = function (pb, x0, x1, y, h, o = {}) {
    const k = o.k || 0, R = ramp(o.ramp || ['#5a6478', '#7a8498', '#9aa4b6', '#bcc4d2', '#dce2ea', '#f0f4f8'], k), n = R.length;
    for (let x = x0; x < x1; x++) for (let yy = 0; yy < h; yy++) {
      const t = yy / h; let i = t < 0.15 ? n - 1 : t < 0.4 ? n - 2 : t < 0.75 ? n - 3 : t < 0.9 ? 2 : 1;
      if ((x - x0) % 16 === 0) i = Math.max(0, i - 2); else if ((x - x0) % 16 === 1) i = Math.min(n - 1, i + 1);
      V.put(pb, x, y + yy, R[i]);
    }
  };
  /** Rótulo de pared (placa con borde y texto nítido) */
  V.sign = function (pb, x, y, text, o = {}) {
    const k = o.k || 0, font = o.font || 'tiny';
    const tw = V.measure(text, { font, bold: o.bold ?? true }), w = tw + 8, h = o.h || (font === 'tiny' ? 11 : 13);
    const bg = U(V.hzc(o.bg || '#0a2957', k)), bd = U(V.hzc(o.border || '#6d9be8', k)), hl = U(V.hzc('#a8c8ff', k));
    V.rect(pb, x, y, w, h, bg);
    for (let xx = x; xx < x + w; xx++) { V.put(pb, xx, y, hl); V.put(pb, xx, y + h - 1, bd); }
    for (let yy = y; yy < y + h; yy++) { V.put(pb, x, yy, hl); V.put(pb, x + w - 1, yy, bd); }
    V.text(pb, text, x + 4, y + Math.round((h - 7) / 2), U(V.hzc(o.fg || '#e6f8fe', k * 0.5)), { font, bold: o.bold ?? true });
    return { w, h };
  };
  /** Suelo pulido: bandas que aclaran hacia el fondo y reflejos verticales de las luces */
  V.floorShine = function (pb, x0, x1, y0, y1, o = {}) {
    const k = o.k || 0, R = ramp(o.ramp || ['#2a3450', '#3a4666', '#4e5c80', '#66749a', '#8290b4', '#a2b0cc', '#c8d2e4'], k), n = R.length;
    const refl = o.refl || [];
    for (let y = y0; y < y1; y++) {
      const t = (y - y0) / Math.max(1, y1 - y0);
      for (let x = x0; x < x1; x++) {
        let i = V.band(clamp(0.75 - t * 0.6, 0, 0.999), n, x, y, 0.05, 41);
        for (const rx of refl) { const d = Math.abs(x - rx); if (d < 3 + t * 6) { i = Math.min(n - 1, i + (d < 1.5 + t * 2 ? 2 : 1)); break; } }
        if ((y - y0) % 6 === 0) i = Math.max(0, i - 1); // juntas de losas
        if ((x + ((y - y0) / 6 | 0) * 9) % 40 === 0) i = Math.max(0, i - 1);
        V.put(pb, x, y, R[i]);
      }
    }
  };
  /** Haces volumétricos: cuñas inclinadas de luz con alfa bajo (en un lienzo propio, se pinta normal) */
  V.shafts = function (pb, list, o = {}) {
    const col = U(o.col || '#fff4d8') & 0xffffff, a = o.a ?? 0.12;
    for (const [x, y, w, len, sl] of list) {
      for (let yy = 0; yy < len; yy++) {
        const t = yy / len, ww = w * (1 + t * 0.7), xs = x + sl * yy;
        for (let xx = 0; xx < ww; xx++) {
          const u = xx / ww, edge = u < 0.18 || u > 0.82;
          const j = (hash2(((xs + xx) / 3) | 0, (y + yy) >> 1, 77) - 0.5) * 0.25;
          const aa = a * (1 - t * 0.85) * (edge ? 0.5 : 1) * (1 + j);
          const px = Math.round(xs + xx), py = y + yy; if (px < 0 || px >= pb.w || py < 0 || py >= pb.h) continue;
          const i = py * pb.w + px, d = pb.data[i], da = (d >>> 24) / 255;
          const na = clamp(da + aa * (1 - da), 0, 1);
          pb.data[i] = ((Math.round(na * 255) << 24) | col) >>> 0;
        }
      }
    }
  };
  /* ---------------- r3-int-a: haces de ventanal nítidos y charcos de luz (interiores N2/N9) ----------------
     Trapecio inclinado con 3 escalones de alfa planos (borde · cuerpo · núcleo) y 2 escalones verticales
     (entrada por el vano, apagado al pie): bordes sólidos, sin tramado. La geometría replica la de
     R2LIGHT (shafts del nivel: capa del ventanal, from, wTop/wBot, slant) para que el pie del haz caiga
     sobre el charco de luz que R2LIGHT pinta en el suelo. Sprites cacheados: 2 drawImage por haz. */
  const _r3b = new Map();
  V.r3iaBeamSprite = function (w0, w1, h, s, col, steps) {
    const A = steps || [0.38, 0.68, 1], key = [w0, w1, h, s, col, A.join(',')].join('|');
    let c = _r3b.get(key); if (c) return c;
    const cw = Math.ceil(Math.max(w0, w1) + Math.abs(s)) + 2, x0 = s < 0 ? -s : 0, [r, g, b] = hexToRgb(col);
    c = makeCanvas(cw, h); const img = c.g.createImageData(cw, h), D = new Uint32Array(img.data.buffer);
    for (let y = 0; y < h; y++) {
      const v = y / Math.max(1, h - 1), bw = w0 + (w1 - w0) * v, cx = x0 + s * v + (Math.max(w0, w1) - bw) / 2;
      const fall = v < 0.05 ? 0.55 : v < 0.72 ? 1 : 0.72;
      for (let x = 0; x < cw; x++) {
        const d = (x + 0.5 - cx) / bw; if (d < 0 || d >= 1) continue;
        const e = Math.min(d, 1 - d) * 2, lv = e < 0.3 ? A[0] : e < 0.68 ? A[1] : A[2];
        D[y * cw + x] = ((Math.round(lv * fall * 255) << 24) | (b << 16) | (g << 8) | r) >>> 0;
      }
    }
    c.g.putImageData(img, 0, 0); c.x0 = x0; _r3b.set(key, c); return c;
  };
  /** Geometría de los haces de un nivel (S = R2LIGHT_CFG[id].shafts) en pantalla: [{x, top, w0, w1, h, s, bx, fy}] */
  V.r3iaShafts = function (sc, S) {
    const B = sc.backdrop; let L = null;
    for (const l of (B && B.layers) || []) if (l.tag === S.layer) { L = l; break; }
    if (!L) return [];
    const [ox, oy] = B.vofs(L, sc.cam), cam = sc.cam, W_ = sc.world, out = [];
    const sd = (typeof R2LIGHT !== 'undefined' && R2LIGHT._st && R2LIGHT._st.sd) || 1;
    for (let x = S.x0; x < (L.c ? L.c.width : W_.w) + S.step; x += S.step) {
      const sx = x + ox; if (sx > W + 140 || sx + S.w < -140) continue;
      const top = Math.round(S.y0 + (S.y1 - S.y0) * (S.from ?? 0.35) + oy);
      const w0 = Math.round(S.w * (S.wTop ?? 0.62)), w1 = Math.round(S.w * (S.wBot ?? 0.92)), sl = S.slant * sd;
      let bx = sx + S.w / 2 + sl * 140;
      let fy = Math.round(W_.groundAt(clamp(Math.round(bx + cam.ox), 0, W_.w)) - cam.oy);
      const h = Math.max(20, (fy - top + 3) & ~3), s = Math.round(sl * h);
      bx = sx + (S.w - w0) / 2 + s + w1 / 2 - (Math.max(w0, w1) - w1) / 2;
      fy = Math.round(W_.groundAt(clamp(Math.round(bx + cam.ox), 0, W_.w)) - cam.oy);
      out.push({ x: Math.round(sx + (S.w - Math.max(w0, w1)) / 2), top, w0, w1, h, s, bx: Math.round(bx), fy });
    }
    return out;
  };
  /** Haces nítidos: aclarado (luminosity) + luz suave cálida (soft-light) + núcleo aditivo + motas; o = {col, a, soft, lum, steps, cut, motes, moteCol} */
  V.r3iaDrawBeams = function (g, list, t, o = {}) {
    const col = o.col || '#ffd58a', pk = 0.92 + 0.08 * Math.sin(t * 0.37);
    for (const q of list) {
      const hh = o.cut ? Math.max(8, Math.min(q.h, o.cut - q.top)) : q.h;
      const c = V.r3iaBeamSprite(q.w0, q.w1, q.h, q.s, col, o.steps);
      // aclarado que conserva tono y saturación (luminosity) y después el tinte cálido aditivo
      if (o.lum) { g.globalCompositeOperation = 'luminosity'; g.globalAlpha = Math.min(1, o.lum * pk); g.drawImage(c, 0, 0, c.width, hh, q.x - c.x0, q.top, c.width, hh); }
      if (o.soft) { g.globalCompositeOperation = 'soft-light'; g.globalAlpha = Math.min(1, o.soft * pk); g.drawImage(c, 0, 0, c.width, hh, q.x - c.x0, q.top, c.width, hh); }
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, (o.a ?? 0.2) * pk); g.drawImage(c, 0, 0, c.width, hh, q.x - c.x0, q.top, c.width, hh);
    }
    // motas de polvo que derivan dentro de cada haz (2×1 px, 2 brillos)
    if (o.motes) {
      g.globalCompositeOperation = 'lighter'; g.fillStyle = o.moteCol || '#fff0c8';
      for (let i = 0; i < list.length; i++) {
        const q = list[i];
        for (let k = 0; k < o.motes; k++) {
          const ph = (t * (0.035 + (k % 5) * 0.009) + k * 0.271 + i * 0.37) % 1, v = 0.08 + ph * 0.8, bw = q.w0 + (q.w1 - q.w0) * v;
          const u = (k * 0.618 + i * 0.13 + Math.sin(t * 0.5 + k * 1.7) * 0.06) % 1;
          g.globalAlpha = (k % 3 ? 0.35 : 0.7) * Math.sin(ph * Math.PI);
          g.fillRect(Math.round(q.x + q.s * v + (Math.max(q.w0, q.w1) - bw) / 2 + bw * (0.12 + u * 0.76)), Math.round(q.top + q.h * v), k % 4 ? 1 : 2, 1);
        }
      }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  };
  /* ---------------- dinámicos ---------------- */
  V.drawLeds = function (g, list, ox, oy, t) {
    for (const [x, y, col, hz, ph] of list) {
      const sx = x + ox; if (sx < -2 || sx > W + 2) continue;
      if (hz && Math.floor(t * hz + (ph || x * 0.13)) % 2) continue;
      g.fillStyle = col || '#3fe0a0'; g.fillRect(sx, y + oy, 2, 1);
    }
  };
  /** Pantallas murales: barras de caudal que respiran o curva de presión (≤ 8 fillRect cada una) */
  V.drawScreens = function (g, list, ox, oy, t) {
    for (const S of list) {
      const x = S.x + ox, y = S.y + oy; if (x > W || x + S.w < 0) continue;
      if (S.kind === 'curve') {
        g.fillStyle = '#56e5ff';
        for (let i = 0; i < S.w - 4; i += 2) { const v = Math.sin(i * 0.25 + t * 1.6) * 0.3 + Math.sin(i * 0.07 - t * 0.5) * 0.4; g.fillRect(x + 2 + i, Math.round(y + S.h / 2 + v * (S.h * 0.35)), 2, 1); }
      } else {
        const cols = ['#3fe0a0', '#56e5ff', '#f5dc5a', '#c244a2'];
        for (let i = 0; i < 4; i++) { const v = 0.45 + 0.35 * Math.sin(t * (0.7 + i * 0.3) + i * 2); g.fillStyle = cols[i]; g.fillRect(x + 3, y + 3 + i * Math.floor((S.h - 4) / 4), Math.round((S.w - 6) * v), 2); }
      }
    }
  };
  /** Gancho de grúa puente que se mece */
  V.drawHook = function (g, Hk, ox, oy, t) {
    const x = Hk.x + ox, y = Hk.y + oy; if (x < -10 || x > W + 10) return;
    const sw = Math.sin(t * 0.7) * 2, ex = Math.round(x + sw), ey = y + Hk.len;
    g.fillStyle = '#3a4458'; for (let i = 0; i < Hk.len; i += 1) g.fillRect(Math.round(x + sw * i / Hk.len), y + i, 1, 1);
    g.fillStyle = '#f8d040'; g.fillRect(ex - 2, ey, 5, 3); g.fillStyle = '#9a6a10'; g.fillRect(ex - 2, ey + 2, 5, 1);
    g.fillStyle = '#8a96ae'; g.fillRect(ex, ey + 3, 1, 3); g.fillRect(ex + 1, ey + 5, 2, 1); g.fillRect(ex + 2, ey + 4, 1, 1);
  };
})();
