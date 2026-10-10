/* =====================================================================
   19b_sca_kit.js — Kit compartido de las escenas A (título, intro,
   dron, tarjetas). Prefijo SCA para no chocar con otros kits.
   API:
     SCAKit.heroPlant(pb, x, yw, {k, wp})  planta desaladora SYNARA de plano
         medio en 3/4 (plataforma de bloques de hormigón con cubierta,
         nave de CAPTACIÓN con bóveda azul, PRETRATAMIENTO con tambor y
         recipientes blancos, bomba, bastidor de MEMBRANAS, depósito de
         AGUA POTABLE, tubería de permeado cian, emisario de SALMUERA
         grafito con codo). yw = línea de agua al pie de la plataforma.
         → {anchors:{captacion,pretrat,membranas,potable,salmuera},
            perm:[pts], feed:[pts], brine:{x,y}, intake:{x,y}, leds:[[x,y,c]],
            glows:[[x,y,r]], x0, x1, deckY}
     SCAKit.foam(g, list, t)               espuma animada al pie de muros
   ===================================================================== */
const SCAKit = (() => {
  const V = VISTA;
  const ramp = (r, k) => V.P32(V.hz(r, k || 0));
  const CONC = ['#2a2a36', '#443d3a', '#6e625b', '#8a8078', '#ac9b82', '#c4b3a0', '#d8c8b4', '#ece0cc', '#f8f0e0'];
  const DECK = ['#5e5248', '#8a7a68', '#ac9a82', '#c8b498', '#dccab0', '#ecdcc2'];
  const STEEL = ['#262a36', '#3a3d48', '#5a5961', '#716f76', '#948e91', '#b5aba8', '#d3ccc5', '#e8e4de', '#f6f4f0'];
  const WHITE = ['#4a4c5c', '#6c6c7c', '#9a98a4', '#c0bcc2', '#dcd8da', '#eeeae6', '#faf8f2', '#ffffff'];
  const BAND = ['#0e2a48', '#163e66', '#245f90', '#31b4e2', '#7fd8f6'];
  const MEMB = ['#0a1c34', '#173a5a', '#2a5a80', '#4a86ae', '#7ab0cc', '#b6d8e8', '#e8f6fa'];
  const PERM = ['#0c2e4a', '#1a6a8c', '#22c1e7', '#71dfef', '#abfafd', '#ffffff'];
  const FEED = ['#0e2a48', '#1a4a78', '#2a72aa', '#4a9ad0', '#8cc8ec'];
  const BRP = ['#06081a', '#141a32', '#262c48', '#3a405d', '#555a78', '#7a7e9e'];
  const GLASS = ['#0e1f3a', '#15305a', '#1e4a7c', '#2e6aa0', '#4a8cc0', '#7ab4e0', '#b4daf4', '#e8f6ff'];
  const RED = ['#3a1008', '#6a1a10', '#a8301e', '#d8502e', '#f08050', '#ffb080'];

  /** Bloque de hormigón 3/4: frente con juntas, manchas y banda húmeda; cubierta con losas; lateral derecho */
  function platform(pb, x, yw, w, h, d, k, o = {}) {
    const C = ramp(CONC, k), D = ramp(DECK, k), n = C.length;
    const dx = Math.round(d * 0.7), bw = o.bw || 22;
    // cubierta (paralelogramo hacia arriba-derecha)
    for (let j = 0; j < d; j++) {
      const yy = yw - h - j, sx = x + Math.round(j * dx / d);
      for (let xx = 0; xx < w; xx++) {
        const px = sx + xx;
        let i = 3 + (j < 2 ? 1 : 0) - (j > d - 3 ? 1 : 0);
        if (((px - Math.round(j * dx / d)) % 12) === 0) i -= 1;            // juntas de losa
        if (j === Math.round(d / 2)) i -= hash2(px >> 2, 1, 5) < 0.5 ? 1 : 0;
        if (hash2(px >> 1, yy >> 1, 7) < 0.08) i -= 1;
        V.put(pb, px, yy, D[clamp(i, 0, D.length - 1)]);
      }
    }
    // lateral derecho en sombra
    for (let xx = 0; xx <= dx; xx++) for (let yy = 0; yy < h; yy++) {
      const py = yw - yy - Math.round(xx * d / dx);
      V.put(pb, x + w + xx, py, C[clamp(2 + (yy > h - 3 ? 1 : 0) - (hash2(xx, yy, 3) < 0.1 ? 1 : 0), 0, n - 1)]);
    }
    for (let j = 0; j < d; j++) V.put(pb, x + w + Math.round(j * dx / d), yw - h - j, C[5]);
    // frente
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      const px = x + xx, py = yw - h + yy, v = yy / (h - 1);
      let i = 6 - Math.round(v * 2.2);
      const bx = Math.floor((xx + (yy > h / 2 ? bw / 2 : 0)) / bw);
      if (((xx + (yy > h / 2 ? bw / 2 : 0)) % bw) === 0) i = 2;           // junta vertical
      if (yy === Math.round(h / 2)) i = 3;                                   // junta horizontal
      i += Math.round((hash2(bx, yy > h / 2 ? 1 : 0, 9) - 0.5) * 1.6);
      if (yy === 0) i = n - 1;                                               // labio iluminado
      if (yy === 1) i = n - 3;
      if (PFK.vn(px * 0.4, yy * 0.08, 11) > 0.72 && yy > 1) i -= 1;          // chorreones
      if (yy >= h - 3) i = yy === h - 1 ? 1 : 2;                             // banda húmeda
      let u = C[clamp(i, 0, n - 1)];
      if (yy >= h - 4 && yy < h - 1 && hash2(px >> 1, yy, 13) < 0.45) u = U(V.hzc('#3e5a4a', k)); // algas
      if (hash2(px, py, 15) < 0.02) u = C[clamp(i + 2, 0, n - 1)];
      V.put(pb, px, py, u);
    }
    return { deckFront: yw - h, deckBack: yw - h - d + 1, dx };
  }
  /** Bastidor: postes + travesaño (acero oscuro con luz de borde) */
  function frame(pb, x0, x1, yb, hh, k) {
    const S = ramp(STEEL, k);
    for (const x of [x0, x1]) for (let y = yb - hh; y <= yb; y++) { V.put(pb, x, y, S[2]); V.put(pb, x + 1, y, S[5]); }
    for (let x = x0; x <= x1 + 1; x++) { V.put(pb, x, yb - hh, S[6]); V.put(pb, x, yb - hh + 1, S[2]); }
  }
  /** Válvula de volante (rojo) sobre una tubería */
  function valve(pb, x, y, k) {
    const R = ramp(RED, k);
    for (let q = -2; q <= 2; q++) { V.put(pb, x + q, y - 3, R[q < 0 ? 4 : 3]); }
    V.put(pb, x, y - 2, R[1]); V.put(pb, x, y - 1, R[2]);
  }

  function heroPlant(pb, x, yw, o = {}) {
    const k = o.k || 0, WP = o.wp || 270, PH = 15, PD = 12;
    const P = platform(pb, x, yw, WP, PH, PD, k);
    const yb = P.deckFront - 5;            // apoyo de los equipos (mitad de la cubierta)
    const A = {}, leds = [], glows = [];
    const S = ramp(STEEL, k), G = ramp(GLASS, k), Wt = ramp(WHITE, k);
    // ---- 1. CAPTACIÓN: nave de acero con bóveda de cristal azul y rejillas
    const cx0 = x + 6, cw = 42, ch = 18;
    V.box3q(pb, cx0, yb, cw, ch, 10, { ramp: STEEL, k });
    for (let xx = 0; xx < cw + 6; xx++) {
      const t = xx / (cw + 6), vh = Math.round(Math.sin(t * Math.PI) * 7);
      for (let yy = 0; yy <= vh + 3; yy++) {
        let i = clamp(2 + Math.round((yy / (vh + 3)) * 5), 0, G.length - 1);
        if (xx % 7 === 0) i = 1; if (yy === vh + 3) i = G.length - 1;
        V.put(pb, cx0 + xx, yb - ch - yy, G[i]);
      }
    }
    for (let i = 0; i < 5; i++) for (let yy = yb - ch + 4; yy < yb - 3; yy++) V.put(pb, cx0 + 4 + i * 8, yy, S[(yy & 1) ? 1 : 2]);
    for (let xx = cx0 + 2; xx < cx0 + cw - 2; xx++) V.put(pb, xx, yb - ch + 3, S[7]);
    A.captacion = { x: cx0 + cw / 2, y: yb - ch - 10 };
    leds.push([cx0 + 6, yb - 6, '#17f3f7'], [cx0 + cw - 6, yb - 6, '#3fe0a0']);
    // toma: tubería azul que baja al mar por delante de la plataforma
    V.pipe(pb, [[cx0 + 10, yb - 4], [cx0 + 10, yb + 2], [cx0 - 4, yb + 2], [cx0 - 4, yw + 30]], 2, FEED, { k, flange: 9 });
    // ---- tubería de alimentación (agua de mar) a pretratamiento
    const feed = [[cx0 + cw + 2, yb - 8], [cx0 + cw + 16, yb - 8]];
    V.pipe(pb, feed, 2, FEED, { k, flange: 6 });
    // ---- 2. PRETRATAMIENTO: tambor horizontal + 3 recipientes blancos altos con bandas
    const px0 = cx0 + cw + 14;
    frame(pb, px0 - 2, px0 + 28, yb, 16, k);
    V.cylH(pb, px0, yb - 9, 28, 6, STEEL, { k, caps: BAND });
    for (let q = 0; q < 3; q++) valve(pb, px0 + 6 + q * 8, yb - 15, k);
    for (let i = 0; i < 3; i++) {
      const vx = px0 + 37 + i * 12;
      V.cylV(pb, vx, yb, 6, 30, WHITE, { k, dome: 0.75, bands: [[6, 2, BAND], [22, 2, BAND]] });
      for (let yy = yb - 26; yy < yb - 4; yy += 4) V.put(pb, vx - 3, yy, Wt[7]);
      V.pipe(pb, [[vx, yb - 36], [vx, yb - 40], [vx + 12, yb - 40]], 1, STEEL, { k });
    }
    A.pretrat = { x: px0 + 37, y: yb - 46 };
    // ---- bomba de alta presión (roja) con manómetro
    const bx0 = px0 + 76;
    V.box3q(pb, bx0, yb, 12, 8, 5, { ramp: RED, k });
    V.ellipse(pb, bx0 + 6, yb - 11, 2.5, 2.5, (nx, ny) => U(nx * nx + ny * ny < 0.4 ? '#f4f0e6' : '#3a3d48'));
    V.pipe(pb, [[px0 + 62, yb - 6], [bx0, yb - 6]], 2, FEED, { k });
    // ---- 3. MEMBRANAS: bastidor con 2 columnas × 3 tubos de presión horizontales
    const mx0 = bx0 + 16, mw = 54;
    frame(pb, mx0, mx0 + mw, yb, 26, k);
    frame(pb, mx0 + 6, mx0 + mw + 6, yb - 4, 24, k + 0.06);
    for (let r = 0; r < 3; r++) {
      V.cylH(pb, mx0 + 8, yb - 24 + r * 7 - 2, mw - 4, 3, MEMB, { k: k + 0.06, caps: BAND });
      V.cylH(pb, mx0 + 2, yb - 21 + r * 7, mw - 4, 3, MEMB, { k, caps: BAND });
    }
    for (let r = 0; r < 3; r++) for (let q = 0; q < 4; q++) V.put(pb, mx0 + 9 + q * 12, yb - 22 + r * 7, U('#e8f6fa'));
    A.membranas = { x: mx0 + mw / 2, y: yb - 32 };
    leds.push([mx0 + 3, yb - 4, '#17f3f7'], [mx0 + mw - 2, yb - 4, '#f5dc5a']);
    // ---- 4. AGUA POTABLE: bloque blanco + depósito con banda cian
    const ax0 = mx0 + mw + 14;
    V.box3q(pb, ax0, yb, 20, 13, 8, { ramp: WHITE, k });
    for (let i = 0; i < 3; i++) { V.put(pb, ax0 + 4 + i * 5, yb - 9, G[4]); V.put(pb, ax0 + 4 + i * 5, yb - 8, G[3]); }
    const tx = ax0 + 31;
    V.cylV(pb, tx, yb, 9, 22, WHITE, { k, dome: 0.45, bands: [[8, 4, PERM]] });
    A.potable = { x: ax0 + 18, y: yb - 30 };
    // ---- tubería de permeado (cian luminosa): membranas → depósito → sube hacia la ciudad
    const perm = [[mx0 + mw + 4, yb - 16], [ax0 + 2, yb - 16], [ax0 + 2, yb - 22], [tx - 2, yb - 22], [tx - 2, yb - 26]];
    V.pipe(pb, perm, 2, PERM, { k: k * 0.5 });
    const perm2 = [[tx + 9, yb - 12], [tx + 18, yb - 12], [tx + 18, yb - 40], [tx + 30, yb - 40]];
    V.pipe(pb, perm2, 2, PERM, { k: k * 0.5 });
    for (const [px, py] of [[ax0 + 2, yb - 19], [tx + 18, yb - 26]]) glows.push([px, py, 5]);
    // ---- 5. SALMUERA: tubería grafito del bastidor al borde y codo hacia el mar
    const sx = mx0 + mw + 8, sy = yb - 4;
    const brine = [[mx0 + mw, sy], [sx + 6, sy], [sx + 6, yw - PH - 1], [sx + 6, yw + 30]];
    V.pipe(pb, brine, 3, BRP, { k, flange: 8 });
    A.salmuera = { x: sx + 6, y: yw - 2 };
    // barandilla amarilla y farolas
    const YL = U(V.hzc('#f0c040', k)), YD = U(V.hzc('#a07818', k));
    for (let xx = x + 2; xx < x + WP - 2; xx++) { if (xx % 5 === 0) { V.put(pb, xx, P.deckFront - 1, YD); V.put(pb, xx, P.deckFront - 2, YL); } V.put(pb, xx, P.deckFront - 3, YL); }
    for (const lx of [x + 70, x + 160, x + 250]) { for (let yy = P.deckFront - 14; yy < P.deckFront; yy++) V.put(pb, lx, yy, S[3]); V.put(pb, lx + 1, P.deckFront - 14, S[6]); glows.push([lx + 1, P.deckFront - 14, 3]); }
    return { anchors: A, perm, perm2, feed, brine: A.salmuera, intake: { x: cx0 - 4, y: yw }, leds, glows, x0: x, x1: x + WP + P.dx, deckY: P.deckFront };
  }
  /** Espuma que lame el pie de un muro: list [{x0, x1, y}] (≤ 2 fillRect por tramo de 8 px) */
  function foam(g, list, t) {
    for (const F of list) for (let x = F.x0; x < F.x1; x += 8) {
      const ph = Math.sin(t * 2.2 + x * 0.21), up = Math.round((ph + 1) * 1.5);
      g.fillStyle = '#ffffff'; g.fillRect(x, F.y - up, 6 + Math.round(ph * 2), 1);
      g.fillStyle = '#bde3ed'; g.fillRect(x + 2, F.y - up + 1, 7, 1);
      if (ph > 0.75) { g.fillStyle = '#ffffff'; g.fillRect(x + 3, F.y - up - 3, 1, 2); g.fillRect(x + 5, F.y - up - 2, 1, 1); }
    }
  }
  /** Mar cercano en bandas de profundidad con rizos de espuma que se ensanchan hacia el espectador */
  function nearSea(pb, o = {}) {
    const w = pb.w, h = pb.h, k = o.k || 0;
    const R = V.P32(V.expand(V.hz(o.stops || ['#0a6fb8', '#0189d4', '#0692d5', '#11a8dc', '#11bedd', '#27cee1', '#3adcf1'], k), 14));
    const FO = V.P32(V.hz(RAMP.foamR, k)), seed = o.seed || 51;
    for (let y = 0; y < h; y++) {
      const t = y / Math.max(1, h - 1);
      for (let x = 0; x < w; x++) {
        const n = (vnoise(x * 0.03, y * 0.09, seed) - 0.5) * 0.18 + (V.ridged(x * 0.02, y * 0.06, 3, seed + 2) - 0.5) * 0.12;
        let u = R[V.band(clamp((o.t0 ?? 0.18) + t * (o.t1 ?? 0.78) + n, 0, 0.999), R.length, x, y, 0.05, seed + 4)];
        const per = 6 + t * 10, ph = Math.sin(x * (0.06 - t * 0.03) + y * 0.9) * 2;
        if (((y + ph) % per) < 1 && vnoise(x * 0.05, y * 0.3, seed + 6) > (o.foam ?? 0.58)) u = FO[t > 0.5 ? 4 : 3];
        if (hash2(x, y, seed + 8) < 0.004) u = FO[5];
        pb.data[y * w + x] = u;
      }
    }
  }
  /** Destellos que derivan sobre el mar cercano (≤ n fillRect) */
  function drawSeaGlints(g, n, t, x0, y0, w, h, ox = 0) {
    g.fillStyle = '#e6f8fc';
    for (let i = 0; i < n; i++) {
      const y = y0 + Math.round(hash1(i, 3) * h), len = 3 + Math.round((y - y0) / 10) + (i % 3);
      const x = Math.round((hash1(i, 5) * (w + 30) + t * (4 + (y - y0) * 0.12)) % (w + 30)) - 15 + x0 + ox;
      const a = 0.5 + 0.5 * Math.sin(t * 2 + i);
      if (a < 0.4) continue;
      g.globalAlpha = a * 0.8; g.fillRect(x, y, len, 1);
    }
    g.globalAlpha = 1;
  }
  /** Tierra agrietada en perspectiva: placas (Worley) que encogen hacia el horizonte, grietas oscuras, labios iluminados */
  function crackedEarth(pb, x0, x1, y0, y1, o = {}) {
    const k = o.k || 0, R = V.P32(V.hz(o.ramp || ['#3a1c0c', '#5e3016', '#86502a', '#a86a38', '#c88a4a', '#e0a860', '#f0c47c', '#fadc9e'], k)), n = R.length, seed = o.seed || 7;
    const topY = o.top || (() => y0);
    for (let x = x0; x < x1; x++) for (let y = Math.max(y0, Math.round(topY(x))); y < y1; y++) {
      const v = (y - y0) / Math.max(1, y1 - y0), sc = 5 + v * v * 26;           // tamaño de placa por profundidad
      const X = x / sc, Y = (y - y0) / (sc * 0.45);
      const gx = Math.floor(X), gy = Math.floor(Y);
      let d1 = 9, d2 = 9, id = 0, cx = 0, cy = 0;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
        const px = gx + i + hash2(gx + i, gy + j, seed) * 0.9, py = gy + j + hash2(gx + i, gy + j, seed + 1) * 0.9;
        const d = Math.hypot(X - px, Y - py);
        if (d < d1) { d2 = d1; d1 = d; id = (gx + i) * 73 + (gy + j); cx = px; cy = py; } else if (d < d2) d2 = d;
      }
      const edge = d2 - d1, cw = 0.07 + v * 0.05;
      let i;
      if (edge < cw) i = 0;                                                        // grieta
      else if (edge < cw * 1.8 && (Y - cy) > 0) i = 1;                             // sombra bajo el labio
      else {
        const lip = edge < cw * 2.6 && (Y - cy) < 0;                               // labio superior iluminado
        i = Math.round(3.6 + v * 1.2 + (hash2(id, 5, seed) - 0.5) * 1.6 - (X - cx) * 0.5 + (lip ? 1.6 : 0) + (PFK.cl(x, y, 2, seed) - 0.5) * 0.8 - (1 - v) * 0.8);
      }
      V.put(pb, x, y, R[clamp(i, 0, n - 1)]);
    }
  }
  /** Árbol seco de ramas desnudas (silueta cálida con borde iluminado a la izquierda) */
  function deadTree(pb, x, y, h, seed, o = {}) {
    const r = RNG(seed), C = V.P32(V.hz(o.ramp || ['#1e0e08', '#3a1e10', '#5a3418', '#7e5028', '#a8743c'], o.k || 0));
    const branch = (bx, by, ang, len, wd, depth) => {
      let px = bx, py = by;
      for (let i = 0; i < len; i++) {
        px += Math.cos(ang); py += Math.sin(ang); ang += (r() - 0.5) * 0.25;
        const ww = Math.max(1, Math.round(wd * (1 - i / len)));
        for (let q = 0; q < ww; q++) V.put(pb, Math.round(px) + q, Math.round(py), C[q === 0 ? 3 : q === ww - 1 ? 1 : 2]);
        if (depth > 0 && i > len * 0.35 && r() < 0.12) branch(px, py, ang + (r() < 0.5 ? -1 : 1) * (0.5 + r() * 0.5), len * 0.55, ww * 0.7, depth - 1);
      }
      if (depth > 0) { branch(px, py, ang - 0.5, len * 0.5, wd * 0.5, depth - 1); branch(px, py, ang + 0.5, len * 0.45, wd * 0.5, depth - 1); }
    };
    branch(x, y, -Math.PI / 2 + (r() - 0.5) * 0.2, h * 0.5, o.w || 4, 3);
  }
  /** Pozo de piedra seco con armazón de madera, polea y cubo */
  function well(pb, x, y, o = {}) {
    const k = o.k || 0, S = V.P32(V.hz(['#3a2418', '#5c3a26', '#86583a', '#a8744a', '#c8945e', '#e2b67a', '#f2d09a'], k)), Wd = V.P32(V.hz(PFSigns.WOOD, k));
    const rx = o.r || 14;
    // brocal: cilindro de piedras
    for (let yy = 0; yy < 12; yy++) for (let xx = -rx; xx <= rx; xx++) {
      const t = (xx + rx) / (2 * rx), row = Math.floor(yy / 4), bx = Math.floor((xx + rx + row * 3) / 6);
      let i = t < 0.3 ? 5 : t < 0.7 ? 4 : 2;
      if (((xx + rx + row * 3) % 6) === 0 || yy % 4 === 0) i = 1;
      i += Math.round((hash2(bx, row, 3) - 0.5) * 1.4);
      const e = Math.round(Math.sqrt(Math.max(0, 1 - (xx / (rx + 0.5)) ** 2)) * 3);
      V.put(pb, x + xx, y - 12 + yy + e, S[clamp(i, 0, 6)]);
    }
    V.ellipse(pb, x + 0.5, y - 12.5, rx + 0.5, 3.5, (nx, ny, d) => d > 0.55 ? S[ny < 0 ? 6 : 4] : U('#140804'));
    // armazón y polea
    for (const sx of [-rx + 2, rx - 3]) for (let yy = 0; yy < 30; yy++) { V.put(pb, x + sx, y - 12 - yy, Wd[6]); V.put(pb, x + sx + 1, y - 12 - yy, Wd[3]); }
    for (let xx = -rx + 1; xx <= rx - 1; xx++) { V.put(pb, x + xx, y - 42, Wd[7]); V.put(pb, x + xx, y - 41, Wd[3]); }
    V.ellipse(pb, x + 0.5, y - 39.5, 2.5, 2.5, (nx, ny) => Wd[nx + ny < 0 ? 7 : 2]);
    for (let yy = -37; yy < -24; yy++) V.put(pb, x, y + yy, U('#c8b090'));
    // cubo de metal vacío
    for (let yy = 0; yy < 6; yy++) for (let xx = -3; xx <= 3; xx++) V.put(pb, x + xx, y - 24 + yy, V.P32(STEEL)[xx < -1 ? 6 : xx < 2 ? 4 : 2]);
    V.put(pb, x - 3, y - 25, V.P32(STEEL)[7]); V.put(pb, x + 3, y - 25, V.P32(STEEL)[3]);
  }
  /** Acantilado columnar del kit PF con un mundo ficticio: gy(x) → y del borde (o null = sin terreno).
      Devuelve {face, top} (lienzos w×h) para dibujar en un plano dinámico. */
  function pfCliff(w, h, gy, o = {}) {
    const ground = new Int16Array(w);
    let x0 = -1, x1 = w;
    for (let x = 0; x < w; x++) { const y = gy(x); ground[x] = y == null ? 999 : Math.round(y); if (y != null && x0 < 0) x0 = x; if (y == null && x0 >= 0 && x1 === w) x1 = x; }
    const seg = { x0: Math.max(0, x0), x1, surf: o.surf || 'path', face: 'cliff', depth: o.depth || 14, ledges: o.ledges ?? true };
    const world = { def: { pf: { terrain: [seg] } }, w, h, ground, water: [], platforms: [] };
    const face = PFTerrain.render(world);
    const topPb = new PixelBuffer(w, h);
    PFTerrain.surface(topPb, world);
    return { face, top: topPb.toCanvas() };
  }
  return { heroPlant, foam, pfCliff, nearSea, drawSeaGlints, crackedEarth, deadTree, well, platform, frame, valve, CONC, DECK, STEEL, WHITE, BAND, MEMB, PERM, FEED, BRP, GLASS, RED };
})();
