/* =====================================================================
   17f_vista_tech.js — Tecnología del panorama (VISTA) en 3/4 elevado:
   aerogeneradores (torre estática + rotor en tira de 12 cuadros), filas
   FV inclinadas al sol con rejilla y reflejo de cielo, planta de H₂
   (torre blanca + tanques esmeralda), cadena desaladora SYNARA en su
   plataforma (CAPTACIÓN → PRETRATAMIENTO → MEMBRANAS → AGUA POTABLE,
   SALMUERA), tuberías y tubería de permeado luminosa.
   API:
     VISTA.cylV(pb, cx, y, rx, h, ramp, {k, dome, bands:[[y,h,ramp?]], ell})
     VISTA.cylH(pb, x, cy, len, r, ramp, {k, caps})
     VISTA.pipe(pb, pts, r, ramp, {k})                      polilínea ortogonal
     VISTA.turbineTower(pb, x, y, h, {k, w}) → {hx, hy}
     VISTA.rotor(R, {k}) → tira 12 cuadros;  VISTA.drawRotor(g, rot, x, y, ang)
     VISTA.pvArray(pb, x, y, {tables, cols, rows, cw, ch, gap, skew, k, step}) → {x0,y0,x1,y1}
     VISTA.h2Plant(pb, x, y, {k, s}) → {label:{x,y}, glows:[[x,y,r]]}
     VISTA.desalChain(pb, x, y, {k, s}) → {anchors{captacion,pretrat,membranas,potable,salmuera}, perm:[pts], outfall:{x,y}}
     VISTA.drawFlow(g, pts, ox, oy, t, {col, speed, gap})   chevrones que avanzan por la tubería
   ===================================================================== */
(() => {
  const V = VISTA;
  const ramp = (r, k) => V.P32(V.hz(r, k || 0));
  const STEEL = ['#3a3d48', '#5a5961', '#716f76', '#948e91', '#b5aba8', '#d3ccc5', '#e8e4de', '#f6f4f0'];
  const CONC = ['#2a3444', '#443930', '#6e625b', '#7b7679', '#ac9b82', '#cebaac', '#e2d2c0', '#f5e5c3'];
  V.TECH = { STEEL, CONC };
  /** Cilindro vertical: especular al 25–35 %, sombra de núcleo al 80–90 %, luz reflejada */
  V.cylV = function (pb, cx, y, rx, h, rp, o = {}) {
    const R = ramp(rp, o.k), n = R.length, ell = o.ell ?? Math.max(1, Math.round(rx * 0.4));
    const shadeAt = (t) => t < 0.08 ? n - 3 : t < 0.22 ? n - 2 : t < 0.36 ? n - 1 : t < 0.55 ? n - 3 : t < 0.72 ? n - 4 : t < 0.9 ? Math.max(0, n - 6) : Math.max(0, n - 5);
    for (let xx = -rx; xx <= rx; xx++) {
      const t = (xx + rx) / (2 * rx + 0.001), c = Math.sqrt(Math.max(0, 1 - (xx / (rx + 0.5)) ** 2));
      const off = Math.round(c * ell);
      for (let yy = 0; yy < h; yy++) {
        let i = shadeAt(t);
        if (o.bands) for (const b of o.bands) if (yy >= b[0] && yy < b[0] + b[1]) { const BR = b[2] ? ramp(b[2], o.k) : null; i = BR ? -1 : Math.max(0, i - 2); if (BR) V.put(pb, cx + xx, y - yy + off, BR[clamp(Math.round((1 - t) * (BR.length - 1)), 0, BR.length - 1)]); }
        if (i >= 0) V.put(pb, cx + xx, y - yy + off, R[i]);
      }
      // sombra de contacto
      V.put(pb, cx + xx, y + off + 1, R[0]);
    }
    // tapa: elipse clara o cúpula
    const top = y - h;
    if (o.dome) {
      const dh = Math.round(rx * (o.dome === true ? 0.8 : o.dome));
      V.ellipse(pb, cx + 0.5, top + 0.5, rx + 0.5, dh + 0.5, (nx, ny) => ny > 0 ? 0 : R[clamp(Math.round((0.75 - nx * 0.5 - ny * 0.2) * (n - 1)), 1, n - 1)]);
    } else V.ellipse(pb, cx + 0.5, top + 0.5, rx + 0.5, ell + 0.5, (nx, ny) => R[ny < -0.2 ? n - 1 : n - 2]);
    return { top: top - (o.dome ? Math.round(rx * 0.8) : ell) };
  };
  /** Cilindro horizontal (recipiente a presión): línea casi blanca al 25–35 % desde arriba */
  V.cylH = function (pb, x, cy, len, r, rp, o = {}) {
    const R = ramp(rp, o.k), n = R.length, CAP = o.caps ? ramp(o.caps, o.k) : null;
    for (let yy = -r; yy <= r; yy++) {
      const t = (yy + r) / (2 * r + 0.001);
      const i = t < 0.12 ? 1 : t < 0.3 ? n - 1 : t < 0.5 ? n - 2 : t < 0.75 ? n - 4 : t < 0.9 ? 2 : 0;
      for (let xx = 0; xx < len; xx++) V.put(pb, x + xx, cy + yy, R[clamp(i - (xx === len - 1 ? 1 : 0), 0, n - 1)]);
      if (CAP) { const ci = clamp(CAP.length - 1 - Math.round(t * (CAP.length - 1)), 0, CAP.length - 1); V.put(pb, x - 1, cy + yy, CAP[ci]); V.put(pb, x + len, cy + yy, CAP[Math.max(0, ci - 1)]); if (len > 6) V.put(pb, x, cy + yy, CAP[ci]); }
    }
  };
  /** Tubería por puntos (segmentos horizontales/verticales), sombreado por orientación */
  V.pipe = function (pb, pts, r, rp, o = {}) {
    const R = ramp(rp, o.k), n = R.length;
    for (let s = 0; s + 1 < pts.length; s++) {
      const [x0, y0] = pts[s], [x1, y1] = pts[s + 1];
      const horiz = Math.abs(y1 - y0) < Math.abs(x1 - x0);
      const len = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let i = 0; i <= len; i++) {
        const t = i / Math.max(1, len), px = Math.round(lerp(x0, x1, t)), py = Math.round(lerp(y0, y1, t));
        for (let q = -r; q <= r; q++) {
          const u = (q + r) / (2 * r + 0.001);
          const idx = u < 0.2 ? (horiz ? n - 1 : n - 1) : u < 0.5 ? n - 2 : u < 0.8 ? Math.max(1, n - 4) : 0;
          if (horiz) V.put(pb, px, py + q, R[idx]); else V.put(pb, px + q, py, R[idx]);
        }
        if (o.flange && i % o.flange === 0 && i > 0 && i < len) for (let q = -r - 1; q <= r + 1; q++) { if (horiz) V.put(pb, px, py + q, R[n - 2]); else V.put(pb, px + q, py, R[n - 2]); }
      }
    }
  };
  /* ---------------- aerogeneradores ---------------- */
  const TURB = ['#68708c', '#8890aa', '#a8b0c6', '#cdd3e2', '#eef1f8', '#ffffff'];
  V.turbineTower = function (pb, x, y, h, o = {}) {
    const R = ramp(TURB, o.k), n = R.length, w0 = o.w || (h > 40 ? 3 : 2);
    for (let yy = 0; yy < h; yy++) {
      const w = yy > h * 0.55 ? Math.max(1, w0 - 1) : w0;
      for (let xx = 0; xx < w; xx++) V.put(pb, x - (w >> 1) + xx, y - yy, R[w === 1 ? n - 2 : xx === 0 ? n - 1 : xx === w - 1 ? 1 : n - 3]);
    }
    // góndola
    const ty = y - h;
    for (let xx = -1; xx <= 3; xx++) { V.put(pb, x + xx, ty - 1, R[xx < 1 ? n - 1 : n - 2]); V.put(pb, x + xx, ty, R[xx < 1 ? n - 3 : 2]); }
    V.put(pb, x - 2, ty - 1, R[n - 2]); V.put(pb, x - 2, ty, R[2]);
    return { hx: x - 2, hy: ty };
  };
  const _rot = new Map();
  /** Rotor de 3 palas en tira de 12 cuadros (120°/12) */
  V.rotor = function (Rl, o = {}) {
    const key = Rl + '|' + (o.k || 0); let s = _rot.get(key); if (s) return s;
    const R = ramp(TURB, o.k), n = R.length, S = Rl * 2 + 5, c = Rl + 2;
    s = V.strip(12, S, S, (pb, f) => {
      for (let b = 0; b < 3; b++) {
        const a = (f / 12) * (TAU / 3) + b * TAU / 3 - Math.PI / 2;
        const ca = Math.cos(a), sa = Math.sin(a);
        for (let i = 1; i <= Rl; i += 0.5) {
          const px = Math.round(c + ca * i), py = Math.round(c + sa * i);
          V.put(pb, px, py, R[i < Rl * 0.3 ? n - 2 : n - 1]);
          // borde de sombra (lado de salida) en la raíz de la pala
          if (i < Rl * 0.55) V.put(pb, Math.round(c + ca * i - sa), Math.round(c + sa * i + ca), R[2]);
        }
      }
      V.rect(pb, c - 1, c - 1, 2, 2, R[n - 3]); V.put(pb, c - 1, c - 1, R[n - 1]);
    });
    s.c0 = c; _rot.set(key, s); return s;
  };
  V.drawRotor = function (g, rot, x, y, ang) {
    const k = ((ang % (TAU / 3)) + TAU / 3) % (TAU / 3);
    V.drawStrip(g, rot, Math.floor(k / (TAU / 3) * 12), x - rot.c0, y - rot.c0);
  };
  /* ---------------- fotovoltaica ---------------- */
  const PV = ['#16214a', '#1e2a55', '#2a3a6c', '#344675', '#3f5590', '#4f6391', '#6a7aa4', '#8b9cc2', '#b7c7e7'];
  V.pvArray = function (pb, x, y, o = {}) {
    const k = o.k || 0, P = ramp(PV, k), n = P.length;
    const FR = U(V.hzc(o.frame || '#d7dbe8', k)), GR = U(V.hzc('#9fb0d6', k)), LEG = U(V.hzc('#2a2c3c', k)), SH = U(V.hzc('#3a2a2a', k));
    const tables = o.tables || 3, cols = o.cols || 8, rows = o.rows || 2, cw = o.cw || 5, ch = o.ch || 3, gap = o.gap ?? 4, skew = o.skew ?? 3;
    const tw = cols * (cw + 1) + 1, th = rows * (ch + 1) + 1;
    const step = o.step ?? (th + gap);
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (let ti = tables - 1; ti >= 0; ti--) {
      const yb = y - ti * step, xo = x + ti * (o.shift ?? 2);
      // sombra arrojada sobre el suelo y patas
      for (let xx = 0; xx < tw; xx++) { const c = V.get(pb, xo + xx + 2, yb + 2); if (c >>> 24) V.put(pb, xo + xx + 2, yb + 2, V.shU(c, -0.3, 260)); }
      for (let xx = 2; xx < tw; xx += Math.max(6, (cw + 1) * 2)) { V.put(pb, xo + xx, yb + 1, LEG); V.put(pb, xo + xx, yb + 2, LEG); }
      for (let yy = 0; yy < th; yy++) {
        const sk = Math.round(skew * yy / th);
        for (let xx = 0; xx < tw; xx++) {
          const px = xo + xx + sk, py = yb - yy;
          const gx = xx % (cw + 1) === 0, gy = yy % (ch + 1) === 0;
          let u;
          if (yy === th - 1) u = FR; else if (yy === 0) u = P[0];
          else if (gx || gy) u = GR;
          else {
            // reflejo de cielo: abajo-izquierda oscuro → arriba-derecha claro, con brillo diagonal
            const t = clamp(0.15 + (xx / tw) * 0.45 + (yy / th) * 0.35 + (((xx + yy * 2 + ti * 5) % 23) < 3 ? 0.25 : 0), 0, 0.999);
            u = P[V.band(t, n - 1, px, py, 0.04, 31)];
          }
          V.put(pb, px, py, u);
        }
      }
      bx0 = Math.min(bx0, xo); bx1 = Math.max(bx1, xo + tw + skew); by0 = Math.min(by0, yb - th); by1 = Math.max(by1, yb + 2);
    }
    return { x0: bx0, y0: by0, x1: bx1, y1: by1 };
  };
  /* ---------------- hidrógeno verde ---------------- */
  const H2G = ['#0a3a24', '#125c38', '#1f7a4c', '#2f9e62', '#3fbf7a', '#4cd48e', '#80ecc2', '#c7ecd1'];
  const H2W = ['#4b5b4a', '#727c63', '#8b878b', '#a8a8a0', '#c0bfb1', '#d8dad0', '#ebeee4', '#ffffff'];
  V.h2Plant = function (pb, x, y, o = {}) {
    const k = o.k || 0, s = o.s || 1, G = ramp(H2G, k), Wt = H2W;
    const glows = [];
    // losa
    V.box3q(pb, x - 4, y + 2, Math.round(96 * s), 3, 6, { ramp: CONC, k });
    // nave de electrolizadores
    V.box3q(pb, x, y, Math.round(22 * s), Math.round(12 * s), 8, { ramp: Wt, k });
    for (let i = 0; i < 4; i++) { const px = x + 2 + i * 5; for (let yy = y - Math.round(9 * s); yy < y - 3; yy++) V.put(pb, px, yy, G[(yy & 1) ? 4 : 5]); glows.push([px, y - 6, 3]); }
    // torre blanca alta con tuberías esmeralda en arco
    const tx = x + Math.round(32 * s), th = Math.round(46 * s), trx = Math.round(6 * s);
    V.cylV(pb, tx, y, trx, th, Wt, { k, dome: 0.6, bands: [[Math.round(th * 0.2), 2], [Math.round(th * 0.62), 2], [Math.round(th * 0.86), 2]] });
    V.pipe(pb, [[tx - trx - 3, y], [tx - trx - 3, y - th + 2], [tx - 2, y - th - 4]], 1, H2G, { k });
    V.pipe(pb, [[tx + trx + 3, y], [tx + trx + 3, y - th + 2], [tx + 2, y - th - 4]], 1, H2G, { k });
    for (const yy of [y - Math.round(th * 0.35), y - Math.round(th * 0.7)]) glows.push([tx - trx - 3, yy, 3], [tx + trx + 3, yy, 3]);
    // tanques esmeralda con cúpula blanca
    for (let i = 0; i < 4; i++) {
      const cx = x + Math.round((48 + i * 12) * s), rx = Math.round(4.5 * s), hh = Math.round((15 + (i % 2) * 2) * s);
      V.cylV(pb, cx, y, rx, hh, H2G, { k, dome: 0.85, bands: [[hh - 3, 3, Wt]] });
      for (let yy = y - hh + 5; yy < y - 2; yy += 3) { V.put(pb, cx - 1, yy, G[7]); V.put(pb, cx, yy, G[6]); }
      glows.push([cx, y - Math.round(hh * 0.5), 5]);
    }
    // colector bajo
    V.pipe(pb, [[x + Math.round(22 * s), y - 3], [x + Math.round(92 * s), y - 3]], 1, H2G, { k });
    return { label: { x: tx + 2, y: y - th - 10 }, glows, x0: x - 4, x1: x + Math.round(96 * s) };
  };
  /* ---------------- desaladora SYNARA (vista lejana) ---------------- */
  const PERM = ['#0c2e4a', '#217b9c', '#22c1e7', '#71dfef', '#abfafd'];
  const BRP = ['#080e26', '#12162f', '#2a2c44', '#3a405d', '#584f56', '#787a9b'];
  const MEMB = ['#092647', '#31506f', '#427ca5', '#7aa6c4', '#b6d4e4', '#e8f2f6'];
  V.desalChain = function (pb, x, y, o = {}) {
    const k = o.k || 0, s = o.s || 1;
    const S = (v) => Math.round(v * s);
    const BL = ramp(V.ARCH.BLUEW, k);
    const A = {};
    // plataforma de hormigón sobre el mar
    const PW = S(230), PH = S(8);
    V.box3q(pb, x, y, PW, PH, S(14), { ramp: CONC, k, front: 5, side: 2, top: 6 });
    const C = ramp(CONC, k), stain = U(V.hzc('#4b586e', k));
    for (let xx = 0; xx < PW; xx++) { if (xx % S(16) === 0) for (let yy = y - PH + 1; yy < y; yy++) V.put(pb, x + xx, yy, C[2]); for (let yy = y - 2; yy < y; yy++) V.put(pb, x + xx, yy, stain); }
    const top = y - PH - S(2); // apoyo de los equipos sobre el techo de la plataforma
    // 1. CAPTACIÓN: nave con cubierta de cristal azul abovedada
    const cx0 = x + S(8), cw = S(38), chh = S(12);
    V.box3q(pb, cx0, top, cw, chh, S(8), { ramp: STEEL, k });
    for (let xx = 0; xx < cw + S(4); xx++) {
      const t = xx / (cw + S(4)), vh = Math.round(Math.sin(t * Math.PI) * S(5));
      for (let yy = 0; yy <= vh + 2; yy++) V.put(pb, cx0 + xx, top - chh - yy, BL[clamp(2 + Math.round((yy / (vh + 2)) * 4) - (xx % 6 === 0 ? 1 : 0), 0, BL.length - 1)]);
    }
    for (let i = 0; i < 5; i++) for (let yy = top - chh + 3; yy < top - 3; yy++) V.put(pb, cx0 + 4 + i * S(7), yy, BL[1 + (yy & 1)]);
    A.captacion = { x: cx0 + cw / 2, y: top - chh - S(7) };
    // tubería de agua de mar a pretratamiento
    V.pipe(pb, [[cx0 + cw, top - 4], [cx0 + cw + S(14), top - 4]], 1, STEEL, { k });
    // 2. PRETRATAMIENTO: tambor horizontal + 3 tanques blancos
    const px0 = cx0 + cw + S(10);
    V.cylH(pb, px0, top - S(5), S(16), S(4), STEEL, { k, caps: ['#163e66', '#245f90', '#31b4e2'] });
    for (let i = 0; i < 3; i++) V.cylV(pb, px0 + S(24) + i * S(10), top, S(4), S(18), STEEL, { k, dome: 0.7, bands: [[S(12), 2, ['#163e66', '#245f90', '#31b4e2']]] });
    A.pretrat = { x: px0 + S(26), y: top - S(26) };
    // bombeo de alta presión (pequeño) y 3. MEMBRANAS: bastidor con 3 tubos de presión
    const mx0 = px0 + S(58);
    V.box3q(pb, mx0 - S(8), top, S(7), S(6), S(4), { ramp: ['#3a1a10', '#6a2a1a', '#a8402a', '#d8603a', '#f0905a'], k });
    const FR = U(V.hzc('#4f4d51', k));
    for (let yy = top - S(17); yy < top; yy++) { V.put(pb, mx0, yy, FR); V.put(pb, mx0 + S(40), yy, FR); }
    for (let i = 0; i < 3; i++) V.cylH(pb, mx0 + 2, top - S(4) - i * S(5), S(36), S(2), MEMB, { k, caps: ['#163e66', '#245f90', '#31b4e2'] });
    for (let xx = mx0; xx <= mx0 + S(40); xx++) V.put(pb, xx, top - S(17), FR);
    A.membranas = { x: mx0 + S(20), y: top - S(20) };
    // 4. AGUA POTABLE: bloque de postratamiento + depósito con banda cian
    const ax0 = mx0 + S(50);
    V.box3q(pb, ax0, top, S(16), S(10), S(7), { ramp: V.ARCH.WHITE, k });
    for (let i = 0; i < 3; i++) V.put(pb, ax0 + 3 + i * 4, top - S(6), BL[3]);
    V.cylV(pb, ax0 + S(26), top, S(6), S(14), V.ARCH.WHITE, { k, dome: 0.5, bands: [[S(5), 3, PERM]] });
    A.potable = { x: ax0 + S(14), y: top - S(22) };
    // tubería de permeado luminosa (sale del depósito y sube por la ladera)
    const perm = [[ax0 + S(33), top - S(6)], [ax0 + S(46), top - S(6)], [ax0 + S(46), top - S(20) - (o.climb || 0)]];
    if (o.permTo) perm.push(...o.permTo);
    V.pipe(pb, perm, 1, PERM, { k: k * 0.5 });
    // 5. SALMUERA: tubería grafito que baja al mar (emisario)
    const sx0 = mx0 + S(42);
    V.pipe(pb, [[sx0, top - S(3)], [sx0 + S(4), top - S(3)], [sx0 + S(4), y + S(6)]], 1, BRP, { k: k * 0.5 });
    A.salmuera = { x: sx0 + S(4), y: y + S(6) };
    // barandilla amarilla y farolas
    const YL = U(V.hzc('#f0c040', k));
    for (let xx = x + 2; xx < x + PW - 2; xx++) if (xx % 4 === 0) V.put(pb, xx, y - PH - 1, YL);
    return { anchors: A, perm, outfall: A.salmuera, x0: x, x1: x + PW, top };
  };
  /** Chevrones que avanzan por una polilínea (≤ ~2 fillRect por segmento visible) */
  V.drawFlow = function (g, pts, ox, oy, t, o = {}) {
    const sp = o.speed ?? 14, gap = o.gap ?? 7;
    g.fillStyle = o.col || '#e8feff';
    let acc = 0;
    for (let s = 0; s + 1 < pts.length; s++) {
      const [x0, y0] = pts[s], [x1, y1] = pts[s + 1];
      const len = Math.hypot(x1 - x0, y1 - y0);
      let d = (gap - ((t * sp - acc) % gap + gap) % gap);
      for (; d < len; d += gap) { const u = d / len; g.fillRect(Math.round(lerp(x0, x1, u) + ox), Math.round(lerp(y0, y1, u) + oy), 1, 1); }
      acc += len;
    }
  };
})();
