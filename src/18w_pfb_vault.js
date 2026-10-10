/* =====================================================================
   18w_pfb_vault.js — Bóveda de carga en el plano jugable (kit B, nivel 6).
   Interior excavado: portal de acceso con puerta blindada abierta,
   archivo de datos precintado, ascensor con cabina de 96 px, unidades de
   climatización con ventilador, carril de luminarias de techo con conos de
   luz y barandillas a 30 px. Paleta interior fría (azul marino y acero)
   con emisivos cian, verde (carga) y rojo (reserva baja / apagón).
   ===================================================================== */
const PFBV = (() => {
  const K = PFK, B = PFB, I = PFInfra, H2 = PFBH2;
  const P = (r) => K.P32(r);
  const ST = ['#141626', '#24283e', '#383e5a', '#525a7a', '#6e769a', '#8e96b8', '#b0b8d6', '#d4daee', '#f2f4fc'];
  const CON = ['#14182a', '#1e2438', '#2a3148', '#384058', '#48506a', '#5a6380', '#6e7896', '#8690ac', '#a2aac2', '#c2c8da'];
  const MAG = ['#1a0820', '#2e0e38', '#4a1658', '#6a2078', '#8e2c96', '#b44ab0', '#e05aa0', '#f8a8d8'];
  /** Muro de hormigón con portal y puerta blindada abierta hacia el túnel de acceso */
  function portal(pb, x, yb, w, h, title) {
    const C = P(CON), out = {};
    const ow = Math.round(w * 0.5), oh = Math.min(h - 20, 96), ox = x + Math.round((w - ow) / 2), oy = yb - oh;
    I.box3q(pb, x, yb, w, h, 10, { ramp: CON, front: (xx, yy, u, v) => { let k = 5 - Math.round(v * 2.2) + Math.round((K.vn(xx * 0.07, yy * 0.07, 41) - 0.5) * 1.4); if ((yy - (yb - h)) % 20 === 0) k -= 2; if (((xx - x) % 40) === 0) k -= 1; return C[clamp(k, 0, 9)]; }, top: (xx, yy, u, v) => C[clamp(6 - Math.round(v * 2), 0, 9)], side: (xx, yy) => C[2], ink: '#070a16' });
    for (let yy = oy; yy < yb; yy++) for (let xx = ox; xx < ox + ow; xx++) { const d = Math.max(Math.abs(xx - ox - ow / 2) / (ow / 2), (yb - yy) / oh * 0.8); K.put(pb, xx, yy, U(mixHex('#03050c', '#1e2438', clamp(d, 0, 1)))); }
    // escalones que suben hacia el túnel
    for (let k = 0; k < 5; k++) B.rect(pb, ox + 8 + k * 3, yb - 4 - k * 4, ow - 16 - k * 6, 2, U(k % 2 ? '#2a3148' : '#384058'));
    // hoja blindada abierta (de canto) y marco con franja
    I.box3q(pb, ox + ow + 2, yb, 8, oh, 12, { ramp: ST });
    for (let yy = oy - 6; yy < yb; yy++) for (let k = 0; k < 5; k++) { const hz = (((yy + k) >> 2) & 1) ? '#e8b830' : '#1c1c26'; K.put(pb, ox - 5 + k, yy, U(k < 4 ? hz : '#070a16')); }
    for (let xx = ox - 5; xx < ox + ow + 2; xx++) for (let k = 0; k < 5; k++) K.put(pb, xx, oy - 6 + k, U(k < 4 ? ((((xx + k) >> 2) & 1) ? '#e8b830' : '#1c1c26') : '#070a16'));
    if (title) B.plaque(pb, x + w / 2, oy - 22, title, { center: true, font: 'main', bold: true, bg: '#0e2848', border: '#78b0e2', col: '#f4fbff', h: 13 });
    out.lamp = [ox + ow / 2, oy - 8];
    return out;
  }
  /** Archivo de datos: dos armarios altos con cajones, precinto magenta y candado. Devuelve {lock, leds} */
  function archive(pb, x, yb, title = 'ARCHIVO') {
    const M = P(MAG), out = { leds: [] };
    I.box3q(pb, x - 3, yb, 62, 4, 14, { ramp: CON });
    for (let k = 0; k < 2; k++) {
      const cx = x + k * 28;
      I.box3q(pb, cx, yb - 4, 26, 78, 12, { ramp: MAG, front: (xx, yy, u, v) => { const ly = yy - (yb - 82), lx = xx - cx; if (lx < 2 || lx > 23) return M[lx < 2 ? 5 : 1]; const r = ly % 11; if (r === 0) return M[0]; if (r === 1) return M[6]; if (r === 5 && lx > 8 && lx < 18) return M[7]; if (r > 2 && r < 5 && lx > 3 && lx < 8) return U('#f4f0ff'); return M[clamp(3 - Math.round(v), 0, 7)]; }, top: (xx, yy, u, v) => M[clamp(5 - Math.round(v * 2), 0, 7)], side: (xx, yy) => M[1], ink: '#0a0410' });
      out.leds.push([cx + 21, yb - 78, '#e05aa0']);
    }
    // precinto en diagonal y candado
    for (let k = 0; k < 54; k++) { const xx = x + 2 + k, yy = yb - 20 - Math.round(k * 0.9); for (let j = 0; j < 3; j++) K.put(pb, xx, yy + j, U(((k >> 2) & 1) ? '#ffe14d' : '#2a1a10')); }
    K.ellipseFn(pb, x + 27, yb - 44, 4, 4.5, (nx, ny, d) => U(d < 0.3 ? '#2a1a10' : ny < -0.2 ? '#fff0a0' : '#c8a428'));
    for (let k = 0; k < 4; k++) { K.put(pb, x + 25, yb - 50 + k, U('#d8d0c0')); K.put(pb, x + 29, yb - 50 + k, U('#d8d0c0')); } K.put(pb, x + 26, yb - 51, U('#d8d0c0')); K.put(pb, x + 27, yb - 51, U('#d8d0c0')); K.put(pb, x + 28, yb - 51, U('#d8d0c0'));
    out.lock = [x + 27, yb - 44];
    B.plaque(pb, x + 27, yb - 96, title, { center: true, bg: '#2e0e38', border: '#f8a8d8', col: '#ffe8f4', h: 10, screws: false });
    B.castR(pb, x, x + 62, yb - 1, 12, { amt: -0.2, yMin: yb - 18 });
    return out;
  }
  /** Ascensor: pórtico de acero, cabina con puertas de 96 px, indicador de planta y botonera */
  function elevator(pb, x, yb, w = 80, h = 132, title) {
    const S = P(ST), out = {};
    // hueco y estructura
    I.box3q(pb, x, yb, w, h, 14, { ramp: ST, front: (xx, yy, u, v) => { const lx = xx - x; if (lx < 6 || lx > w - 7) return S[lx < 2 ? 7 : lx < 6 ? 5 : lx > w - 3 ? 1 : 3]; return S[clamp(1 + ((yy - (yb - h)) % 14 === 0 ? 1 : 0), 0, 8)]; }, top: (xx, yy, u, v) => S[clamp(6 - Math.round(v * 2), 0, 8)], side: (xx, yy) => S[2], ink: '#070a16' });
    const dw = w - 24, dh = 96, dx = x + 12;
    B.rect(pb, dx - 3, yb - dh - 4, dw + 6, dh + 4, (xx, yy) => S[xx < dx - 1 ? 7 : xx > dx + dw ? 2 : yy < yb - dh - 2 ? 8 : 4]);
    B.rect(pb, dx, yb - dh, dw, dh, (xx, yy) => { const lx = xx - dx; if (lx === Math.floor(dw / 2)) return S[0]; let k = 5 - Math.round((yy - yb + dh) / dh * 1.5) + (lx === 0 || lx === Math.floor(dw / 2) + 1 ? 1 : 0); if (((xx + yy) % 23) < 2) k += 1; return S[clamp(k, 0, 8)]; });
    B.rect(pb, dx + Math.floor(dw / 2) - 12, yb - dh - 14, 24, 8, U('#03101e'));
    out.ind = [dx + Math.floor(dw / 2) - 10, yb - dh - 13, 20, 6];
    B.rect(pb, x + w - 10, yb - 52, 5, 12, U('#383e5a')); K.put(pb, x + w - 8, yb - 49, U('#48dcf4')); K.put(pb, x + w - 8, yb - 44, U('#3a4a5a'));
    out.call = [x + w - 8, yb - 49];
    if (title) B.plaque(pb, x + w / 2, yb - h - 4, title, { center: true, bg: '#06203a', border: '#56e5ff', col: '#f4fbff', h: 10, screws: false });
    return out;
  }
  /** Climatizador de bastidores: caja con ventilador frontal (aspas vivas), rejilla y tubos de refrigerante */
  function hvacUnit(pb, x, yb, w = 40, h = 30) {
    const S = P(ST), out = {};
    I.box3q(pb, x, yb, w, h, 12, { ramp: ST, front: (xx, yy, u, v) => { const ly = yy - (yb - h); if (ly > h - 9 && (xx % 2)) return S[2]; return S[clamp(5 - Math.round(v * 2), 0, 8)]; }, top: (xx, yy, u, v) => S[clamp(7 - Math.round(v * 2), 0, 8)], side: (xx, yy) => S[2], ink: '#070a16' });
    const fx = x + Math.round(w / 2), fy = yb - Math.round(h * 0.55);
    K.ellipseFn(pb, fx, fy, 9, 9, (nx, ny, d) => U(d > 0.8 ? '#d4daee' : d > 0.66 ? '#383e5a' : '#0e1424'));
    out.fan = [fx, fy, 7, 7];
    I.pipe(pb, [[x + w + 2, yb - 8], [x + w + 8, yb - 8], [x + w + 8, yb - h - 40]], 1, 'cool', { flange: 0 });
    return out;
  }
  /** Carril de luminarias colgado del techo (lámparas lineales); devuelve las posiciones de las lámparas */
  function lampRail(pb, x0, x1, y, step = 80) {
    const S = P(ST), out = [];
    for (let x = x0; x <= x1; x++) { K.put(pb, x, y, S[5]); K.put(pb, x, y + 1, S[2]); }
    for (let x = x0 + step / 2; x < x1; x += step) { for (let yy = y + 2; yy < y + 6; yy++) K.put(pb, x, yy, S[4]); B.rect(pb, x - 9, y + 6, 19, 3, U('#2a3046')); B.rect(pb, x - 8, y + 9, 17, 1, U('#e8fbff')); out.push([x, y + 10]); }
    return out;
  }
  /** Aspas de ventilador frontal (vista de frente) */
  function drawFanFront(g, sc, fans, on = true) {
    const ox = sc.cam.ox, oy = sc.cam.oy, t = Game.time * (on ? 8 : 0);
    g.fillStyle = '#8e96b8';
    for (const [fx, fy, rx, ry] of fans) { const x = fx - ox, y = fy - oy; if (x < -20 || x > W + 20) continue; for (let k = 0; k < 4; k++) { const a = t + k * TAU / 4; for (let j = 2; j < rx; j++) g.fillRect(Math.round(x + Math.cos(a) * j), Math.round(y + Math.sin(a) * j * ry / rx), 1, 1); } }
  }
  return { portal, archive, elevator, hvacUnit, lampRail, drawFanFront, ST, CON, MAG };
})();
