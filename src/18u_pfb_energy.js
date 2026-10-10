/* =====================================================================
   18u_pfb_energy.js — Energía en el plano jugable (kit B, niveles 6 y 10).
   Contenedores de baterías (BESS) en 3/4 con chapa grecada, puertas con
   barras de cierre, climatizador y ranura de SOC; bastidores de módulos
   con BMS; inversores con disipador; armarios; mesas FV a escala de
   personaje con polvo (soiling); aerogenerador cercano con rotor vivo;
   tendidos con catenaria.
   Paletas: s.ramp para el cuerpo (por defecto blanco cálido); o.dust
   (color) y o.soil (0..1) para el polvo de la Calima.
   ===================================================================== */
const PFBE = (() => {
  const K = PFK, B = PFB, I = PFInfra;
  const P = (r) => K.P32(r);
  const WHD = ['#2a1e1c', '#4a3630', '#6e5448', '#927462', '#b2967e', '#ccb49a', '#e0ccb2', '#efe0c8', '#f8eedc', '#fffaf0'];
  const NAVY = ['#0c0e1c', '#161a30', '#22284a', '#303a64', '#424e80', '#5a689c', '#7a88b8', '#a4b0d4'];
  const BLUEC = ['#081830', '#0e2848', '#163c66', '#205286', '#2c6ca8', '#4a8cc8', '#78b0e2', '#b0d4f4'];
  const STLD = ['#241c1c', '#3e3230', '#5a4c48', '#786a64', '#988a82', '#b6aaa0', '#d2c8be', '#ece4da', '#fcf8f0'];
  const PV = ['#060c22', '#0c1838', '#142a56', '#1e3e78', '#2c5698', '#4a78b8', '#7aa4d8', '#b4d0f0'];
  /** Mezcla polvo en los píxeles opacos de un rect: más en las caras que miran arriba (pixel de encima vacío) */
  function dust(pb, x0, y0, w, h, col = '#d8a868', k = 0.4, seed = 3) {
    const D = U(col);
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      const c = K.get(pb, x, y); if (!(c >>> 24)) continue;
      const up = K.get(pb, x, y - 1), top = !(up >>> 24);
      let a = k * (0.35 + 0.65 * K.vn(x * 0.08, y * 0.12, seed)) * (0.5 + 0.5 * (y - y0) / Math.max(1, h));
      if (top) a = Math.max(a, k * 1.2);
      K.put(pb, x, y, K.mixU(c, D, clamp(a, 0, 0.85)));
    }
  }
  /** Montículo de arena a sotavento (ondulado), apoyado en (x, yb) */
  function drift(pb, x, yb, w, h, seed = 1, ramp = PFTerrain.SANDF) {
    const S = P(ramp), n = S.length;
    for (let yy = Math.round(yb - h); yy <= yb; yy++) for (let xx = Math.round(x - w / 2); xx <= Math.round(x + w / 2); xx++) {
      const nx = (xx - x) / (w / 2), top = yb - h * (1 - nx * nx) * (0.85 + 0.15 * K.vn(xx * 0.2, 0, seed)); if (yy < top) continue;
      let k = n - 2 - Math.round((yy - top) / Math.max(2, h) * 3) + (nx < -0.2 ? 1 : nx > 0.4 ? -1 : 0);
      if (((xx * 0.6 + yy * 2.2) % 7) < 1) k -= 1;
      K.put(pb, xx, yy, S[clamp(k, 1, n - 1)]);
    }
  }

  /* ---------- BESS ---------- */
  /** Contenedor de baterías en 3/4: chapa grecada, climatizador, puertas laterales con barras, placa y
      ranura de SOC (la barra viva la pinta el nivel). Devuelve {soc:[x,y,w], leds:[[x,y,col]], top, hvac:[x,y]} */
  function container(pb, x, yb, w = 60, h = 44, d = 16, o = {}) {
    const C = P(o.ramp || WHD), n = C.length, A = P(o.accent || BLUEC), out = { leds: [] };
    I.box3q(pb, x - 3, yb, w + 6, 3, d + 2, { ramp: o.plinth || PFTerrain.CONC });
    const by = yb - 3;
    const b = I.box3q(pb, x, by, w, h, d, {
      ramp: o.ramp || WHD,
      front: (xx, yy, u, v) => { const lx = xx - x, ly = yy - (by - h); if (ly < 3 || ly > h - 4) return C[clamp(ly < 3 ? n - 3 : 2, 0, n - 1)]; if (o.band && ly >= 6 && ly < 9) return A[ly === 6 ? 6 : 4]; const r = lx % 4; let k = (r === 0 ? n - 3 : r === 1 ? n - 4 : r === 2 ? n - 5 : n - 6) - Math.round(v * 1.6); if (K.vn(xx * 0.3, yy * 0.04, 9) > 0.8) k -= 1; return C[clamp(k, 0, n - 1)]; },
      top: (xx, yy, u, v) => { let k = n - 2 - Math.round(v * 2) - ((xx - x) % 10 === 0 ? 1 : 0); return C[clamp(k, 1, n - 1)]; },
      side: (xx, yy, u, v) => { const sx = xx - x - w; let k = 3 - Math.round(v * 1.2); if (sx === 2 || sx === Math.round(d * 0.45) - 2) k = 1; if ((yy % 9) === 0) k += 1; return C[clamp(k, 0, n - 1)]; },
      ink: '#140e10',
    });
    // esquineros (castings) y marco
    for (const [cx, cy] of [[x, by - h], [x + w - 3, by - h], [x, by - 3], [x + w - 3, by - 3]]) B.rect(pb, cx, cy, 3, 3, C[1]);
    // climatizador en el frente
    const hx = x + 4, hy = by - h + 10;
    I.box3q(pb, hx, hy + 20, 16, 20, 4, { ramp: STLD });
    K.ellipseFn(pb, hx + 8, hy + 8, 5.5, 5.5, (nx, ny, dd) => U(dd > 0.75 ? '#d2c8be' : ((Math.round(nx * 5) + Math.round(ny * 5)) & 1) ? '#241c1c' : '#3e3230'));
    for (let k = 0; k < 3; k++) B.rect(pb, hx + 2, hy + 15 + k * 2, 12, 1, U('#5a4c48'));
    out.hvac = [hx + 8, hy + 8];
    // placa, pegatina de riesgo eléctrico y ranura de SOC
    const px = x + Math.round(w * 0.42);
    B.plaque(pb, px + 14, by - h + 9, o.label || 'BESS', { center: true, bg: '#0e2848', border: '#78b0e2', col: '#f4fbff', h: 9, screws: false });
    for (let yy = 0; yy < 7; yy++) for (let xx = 0; xx < 7; xx++) { const tri = yy >= 6 - Math.abs(xx - 3) * 2 || yy === 6; if (tri) K.put(pb, px + 30 + xx, by - h + 22 + yy, U(tri ? '#ecc030' : 0)); }
    K.put(pb, px + 33, by - h + 25, U('#140e02')); K.put(pb, px + 33, by - h + 26, U('#140e02'));
    B.rect(pb, px, by - h + 20, 30, 6, U('#05031a'));
    out.soc = [px + 1, by - h + 21, 28];
    for (let k = 0; k < 3; k++) out.leds.push([px + 2 + k * 4, by - h + 30, ['#3fe0a0', '#48dcf4', '#ffd84a'][k]]);
    // puertas en la cara lateral: barras de cierre
    const dx = Math.round(d * 0.45);
    for (const f of [0.3, 0.7]) { const sx = x + w + Math.round(dx * f); for (let yy = by - h - Math.round(d * f) + 4; yy < by - Math.round(d * f) - 2; yy++) K.put(pb, sx, yy, C[n - 2]); }
    if (o.dust) dust(pb, x - 3, by - h - d - 1, w + dx + 6, h + d + 4, o.dust, o.soil ?? 0.35, x);
    B.castR(pb, x, x + w + dx, yb - 1, Math.round(h * 0.3), { amt: -0.22, yMin: yb - 18 });
    out.top = by - h;
    return out;
  }
  /** Bastidor de baterías de interior: módulos con LED y BMS en la cabecera. Devuelve {leds, screen} */
  function rack(pb, x, yb, w = 28, h = 70, d = 10, o = {}) {
    const N = P(o.ramp || NAVY), out = { leds: [] };
    I.box3q(pb, x, yb, w, h, d, {
      ramp: o.ramp || NAVY,
      front: (xx, yy, u, v) => { const lx = xx - x, ly = yy - (yb - h); if (lx < 2 || lx > w - 3 || ly < 10) return N[lx < 2 ? 5 : lx > w - 3 ? 1 : 3]; const m = (ly - 10) % 9; if (m === 0) return N[1]; if (m === 1) return N[6]; return N[clamp(4 - Math.round(v) + (lx % 6 === 0 ? -1 : 0), 0, 7)]; },
      top: (xx, yy, u, v) => N[clamp(6 - Math.round(v * 2), 0, 7)], side: (xx, yy) => N[1], ink: '#03050c',
    });
    B.rect(pb, x + 3, yb - h + 2, w - 6, 6, U('#021018'));
    out.screen = [x + 4, yb - h + 3, w - 8, 4];
    for (let ly = 14; ly < h - 2; ly += 9) out.leds.push([x + w - 5, yb - h + ly + 2, '#3fe0a0']);
    return out;
  }
  /** Inversor / PCS: caja con disipador de aletas, pantalla y rayo */
  function inverter(pb, x, yb, w = 30, h = 46, d = 12, o = {}) {
    const C = P(o.ramp || WHD), n = C.length, out = {};
    I.box3q(pb, x, yb, w, h, d, {
      ramp: o.ramp || WHD,
      front: (xx, yy, u, v) => { const lx = xx - x, ly = yy - (yb - h); if (ly > h * 0.55 && lx > 3 && lx < w - 4) return C[(lx % 2) ? 2 : 5]; return C[clamp(n - 3 - Math.round(v * 2) + (lx === 0 ? 1 : 0), 0, n - 1)]; },
      top: (xx, yy, u, v) => C[clamp(n - 2 - Math.round(v * 2), 0, n - 1)], side: (xx, yy) => C[3], ink: '#140e10',
    });
    B.rect(pb, x + 4, yb - h + 5, 12, 8, U('#021018'));
    out.screen = [x + 5, yb - h + 6, 10, 6];
    for (let yy = 0; yy < 7; yy++) for (let xx = 0; xx < 5; xx++) if (Math.abs(xx - 2 + (yy - 3) * 0.6) < 1.2) K.put(pb, x + w - 9 + xx, yb - h + 6 + yy, U('#ecc030'));
    out.led = [x + w - 5, yb - h + 15];
    return out;
  }
  /* ---------- solar y eólica ---------- */
  /** Mesa FV a escala de personaje: plano inclinado con celdas, marco, patas y polvo (soil 0..1) */
  function pvTable(pb, x, yb, w = 70, o = {}) {
    const D = o.depth || 20, sk = 0.7, Pp = P(PV), soil = o.soil || 0, dustC = U(o.dustCol || '#d8a868');
    const front = yb - (o.lift || 16);
    const S = P(STLD);
    // patas: delanteras bajas, traseras altas
    for (let lx = x + 6; lx < x + w; lx += 30) { for (let yy = front; yy < yb; yy++) { K.put(pb, lx, yy, S[6]); K.put(pb, lx + 1, yy, S[3]); } const bx = lx + Math.round(D * sk * 0.8); for (let yy = front - D + 2; yy < yb - 4; yy++) { K.put(pb, bx, yy, S[4]); K.put(pb, bx + 1, yy, S[2]); } K.lineFn(pb, lx + 1, yb - 2, bx, front - D + 6, () => S[3]); }
    // plano de paneles
    for (let r = 0; r < D; r++) for (let k = 0; k < w; k++) {
      const xx = x + k + Math.round(r * sk), yy = front - r;
      const frame = k === 0 || k === w - 1 || r === 0 || r === D - 1, grid = (k % 6 === 0) || (r % 5 === 0), panel = (k % 24 === 0);
      let u;
      if (frame || panel) u = S[frame && r === 0 ? 7 : 5];
      else if (grid) u = U('#a8b4d0');
      else { const t = (k / w) * 0.4 + (r / D) * 0.6 + ((k + r * 3) % 11 === 0 ? 0.25 : 0); u = Pp[clamp(Math.round(1 + t * 5), 0, 7)]; }
      if (soil > 0 && !frame) { const q = soil * (0.55 + 0.45 * K.vn(xx * 0.1, yy * 0.2, 7)) * (r < D * 0.3 ? 1.15 : 0.85); u = K.mixU(u, dustC, clamp(q, 0, 0.82)); }
      K.put(pb, xx, yy, u);
    }
    for (let k = 0; k < w; k++) { K.put(pb, x + k, front + 1, S[1]); K.put(pb, x + k, front + 2, S[2]); }
    B.contact(pb, x + w / 2 + 6, yb, w / 2 + 6, 2, -0.24);
  }
  /** Torre de aerogenerador cercano (rotor vivo con drawRotor). Devuelve {hub:[x,y], r} */
  function turbineTower(pb, x, yb, h = 150, o = {}) {
    const C = P(o.ramp || WHD), n = C.length;
    I.box3q(pb, x - 10, yb, 22, 5, 10, { ramp: PFTerrain.CONC });
    for (let yy = yb - 5 - h; yy < yb - 5; yy++) {
      const t = (yb - 5 - yy) / h, hw = Math.round(lerp(5, 2.5, t));
      for (let k = -hw; k <= hw; k++) { const f = (k + hw) / (2 * hw); K.put(pb, x + k, yy, C[clamp([3, 6, 8, 7, 6, 5, 4, 3, 2][Math.floor(f * 8.99)] - (yy > yb - 30 ? 1 : 0), 0, n - 1)]); }
      if ((yb - yy) % 40 === 0) for (let k = -hw; k <= hw; k++) K.put(pb, x + k, yy, C[2]);
    }
    const hy = yb - 5 - h;
    // góndola
    B.rect(pb, x - 4, hy - 5, 18, 8, (xx, yy) => C[clamp(yy === hy - 5 ? n - 1 : yy > hy + 1 ? 3 : n - 3 - ((xx - x) > 10 ? 1 : 0), 0, n - 1)]);
    K.ellipseFn(pb, x - 5, hy - 1, 3, 3.5, (nx, ny) => C[clamp(Math.round(6 - nx * 2 - ny * 2), 0, n - 1)]);
    return { hub: [x - 6, hy - 1], r: o.r || 40 };
  }
  /** Rotor de tres palas (vivo) visto casi de frente: ang en radianes; stopped → palas en bandera
      (finas y quietas). o.squash comprime el eje x (perspectiva 3/4) */
  function drawRotor(g, x, y, r, ang, o = {}) {
    const cols = o.cols || ['#fffaf0', '#e0d4c4', '#a89888', '#6e5e52'], q = o.squash ?? 0.8;
    for (let k = 0; k < 3; k++) {
      const a = ang + k * TAU / 3, ca = Math.cos(a), sa = Math.sin(a), nx = -sa, ny = ca;
      for (let j = 4; j < r; j++) {
        const t = j / r, wdt = o.stopped ? 1 : t < 0.25 ? 3 : t < 0.7 ? 2 : 1;
        const px = x + ca * j * q, py = y + sa * j;
        for (let w = 0; w < wdt; w++) { g.fillStyle = cols[w === 0 ? 0 : w === 1 ? 1 : 2]; g.fillRect(Math.round(px + nx * w * q), Math.round(py + ny * w), 1, 1); }
        if (!o.stopped && t > 0.15) { g.fillStyle = cols[3]; g.fillRect(Math.round(px + nx * wdt * q), Math.round(py + ny * wdt), 1, 1); }
      }
    }
    g.fillStyle = cols[2]; g.fillRect(Math.round(x) - 2, Math.round(y) - 2, 5, 5);
    g.fillStyle = cols[0]; g.fillRect(Math.round(x) - 1, Math.round(y) - 2, 2, 2);
  }
  /** Tendido: poste de madera y catenaria hasta (x1,y1) */
  function line(pb, x0, y0, x1, y1, sag = 10, col = '#2a1e1c') {
    const c = U(col);
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) { const t = (x - x0) / (x1 - x0), y = Math.round(lerp(y0, y1, t) + sag * 4 * t * (1 - t)); K.put(pb, x, y, c); }
  }
  function pole(pb, x, yb, h = 80) {
    const Wd = P(B.R.WOODG);
    for (let yy = yb - h; yy < yb; yy++) { K.put(pb, x, yy, Wd[6]); K.put(pb, x + 1, yy, Wd[4]); K.put(pb, x + 2, yy, Wd[2]); }
    for (let k = -8; k <= 10; k++) { K.put(pb, x + k, yb - h + 6, Wd[6]); K.put(pb, x + k, yb - h + 7, Wd[3]); }
    for (const k of [-7, 1, 9]) { K.put(pb, x + k, yb - h + 4, U('#d8e0e8')); K.put(pb, x + k, yb - h + 5, U('#8a96a8')); }
    return { tops: [[x - 7, yb - h + 4], [x + 1, yb - h + 4], [x + 9, yb - h + 4]] };
  }
  return { dust, drift, container, rack, inverter, pvTable, turbineTower, drawRotor, line, pole, WHD, NAVY, BLUEC, STLD, PV };
})();
