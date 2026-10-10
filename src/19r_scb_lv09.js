/* =====================================================================
   19r_scb_lv09.js — Acabado del plano jugable del Nivel 9 (salón del
   consejo) al estándar del kit PF: reflejos horneados de los accesorios
   en el mármol pulido (3/4), alfombra de pasillo con cenefa dorada en el
   vestíbulo, postes de latón con cordón de terciopelo, vitrinas con
   objetos de la historia de SYNARA (cartucho de membrana, primer sensor,
   libro de actas, maqueta de la cúpula), atril y quiosco de consulta.
   Solo arte: la línea de paso (292), plataformas y escaleras no cambian.
   SCBL9.finish(pb, world, back, gy, D)  → llamado al final de LEVELS[9].props
   ===================================================================== */
const SCBL9 = (() => {
  const K = PFK;
  const BRASS = ['#3a2408', '#6a4610', '#a8761c', '#d8a838', '#f4d470', '#fff4c8'];
  const VELV = ['#3a0610', '#6a0c1c', '#9a1828', '#c8303a', '#e85a5a'];
  const GLASS = ['#1a3048', '#2a5070', '#4a7a9a', '#8ab8d0', '#d8f0fa'];
  const P = (r) => K.P32(r);
  /** Reflejos de los accesorios sobre el suelo pulido (eje en la base de apoyo yb = back + 2) */
  function reflect(pb, x0, x1, back, gy, o = {}) {
    const a0 = o.a ?? 0.26, tint = U(o.tint || '#2a2050');
    for (let x = Math.max(0, x0); x < Math.min(pb.w, x1); x++) {
      const b = back(x), yb = b + 2, g = gy(x), depth = g - yb;
      if (depth < 3) continue;
      for (let k = 1; k < depth; k++) {
        const sy = yb - k - 1, dy = yb + k - 1; if (sy < 0 || dy >= g) continue;
        const src = pb.data[sy * pb.w + x]; if (!(src >>> 24)) continue;
        const di = dy * pb.w + x, dst = pb.data[di]; if (!(dst >>> 24)) continue;
        // reflejo algo más oscuro y frío, con ondulación mínima de las vetas
        const a = a0 * (1 - k / depth) * (hash2(x >> 2, dy, 17) < 0.12 ? 0.6 : 1);
        pb.data[di] = K.mixU(dst, K.mixU(src, tint, 0.3), a);
      }
    }
  }
  /** Alfombra de pasillo sobre el mármol (banda en 3/4 con cenefa dorada y flecos) */
  function runner(pb, x0, x1, back, gy) {
    const V_ = P(VELV), G = P(BRASS);
    for (let x = x0; x < x1; x++) {
      const b = back(x), g = gy(x), y0 = b + 5, y1 = g - 4;
      for (let y = y0; y < y1; y++) {
        const edge = y === y0 || y === y1 - 1, gold = y === y0 + 1 || y === y1 - 2;
        let c = edge ? V_[0] : gold ? G[(x % 6 < 3) ? 3 : 4] : V_[2 + (((x >> 3) + (y >> 1)) % 5 === 0 ? 1 : 0) - (y > y1 - 4 ? 1 : 0)];
        if (!edge && !gold && (x % 16 === 0)) c = V_[1];
        pb.data[y * pb.w + x] = c;
      }
      if (x % 3 === 0 && (x === x0 || x === x1 - 1 || x < x0 + 1)) for (let y = y0; y < y1; y++) K.put(pb, x, y, G[2]);
    }
    for (const ex of [x0, x1 - 1]) for (let y = back(ex) + 5; y < gy(ex) - 4; y += 2) { K.put(pb, ex, y, G[4]); K.put(pb, ex + (ex === x0 ? -1 : 1), y, G[2]); }
  }
  /** Postes de latón con cordón de terciopelo que cuelga entre ellos */
  function stanchions(pb, x0, x1, yb, step = 30) {
    const G = P(BRASS), V_ = P(VELV), h = 26;
    const posts = []; for (let x = x0; x <= x1; x += step) posts.push(x);
    for (let i = 0; i + 1 < posts.length; i++) {
      const a = posts[i], b = posts[i + 1];
      for (let x = a + 2; x < b; x++) { const t = (x - a) / (b - a), y = yb - h + 4 + Math.round(Math.sin(t * Math.PI) * 6); K.put(pb, x, y, V_[3]); K.put(pb, x, y + 1, V_[1]); if (t > 0.2 && t < 0.8 && x % 5 === 0) K.put(pb, x, y - 1, V_[4]); }
    }
    for (const x of posts) {
      // base en disco, fuste con franja especular, remate esférico
      K.ellipseFn(pb, x + 1, yb - 1, 4, 1.6, (nx, ny) => G[ny < -0.2 ? 4 : nx > 0.4 ? 1 : 2]);
      for (let y = yb - h; y < yb - 1; y++) { K.put(pb, x, y, G[4]); K.put(pb, x + 1, y, G[3]); K.put(pb, x + 2, y, G[1]); }
      K.ellipseFn(pb, x + 1, yb - h - 1, 2.2, 2.2, (nx, ny) => G[nx < -0.2 && ny < -0.2 ? 5 : nx > 0.3 ? 2 : 4]);
    }
  }
  /** Vitrina de cristal sobre peana de madera con un objeto de la historia */
  function vitrine(pb, x, yb, w, kind, label) {
    const Wd = P(PFBM.WOODH), Gl = P(GLASS), G = P(BRASS), h = 30, ph = 30, d = 8, dx = 5, dy = 4;
    // peana (frente, costado, tapa)
    PFInfra.box3q(pb, x, yb, w, ph, d, { ramp: PFBM.WOODH });
    for (let xx = x + 2; xx < x + w - 2; xx++) { K.put(pb, xx, yb - ph + 3, G[3]); K.put(pb, xx, yb - 3, G[2]); }
    const top = yb - ph - dy;
    // objeto dentro (antes del cristal)
    const cx = x + Math.round(w / 2) + 2, cy = top - 4;
    if (kind === 'membrane') { for (let yy = 0; yy < 20; yy++) for (let xx = -4; xx <= 4; xx++) K.put(pb, cx + xx, cy - yy, U(xx === -4 ? '#e8f2f6' : xx > 2 ? '#31506f' : yy % 4 === 0 ? '#7aa6c4' : '#b6d4e4')); for (let xx = -5; xx <= 5; xx++) { K.put(pb, cx + xx, cy - 20, U('#427ca5')); K.put(pb, cx + xx, cy, U('#092647')); } }
    else if (kind === 'sensor') { for (let yy = 0; yy < 14; yy++) { K.put(pb, cx, cy - yy, U('#9aa4b8')); K.put(pb, cx + 1, cy - yy, U('#5a6278')); } PFInfra.box3q(pb, cx - 4, cy - 14, 10, 7, 3, { ramp: PFInfra.STEEL }); K.put(pb, cx - 2, cy - 18, U('#56e5ff')); K.put(pb, cx + 2, cy - 18, U('#ff6b6b')); }
    else if (kind === 'book') { for (let yy = 0; yy < 6; yy++) for (let xx = -8; xx <= 8; xx++) K.put(pb, cx + xx, cy - yy - Math.round(Math.abs(xx) * 0.15), U(yy === 5 ? '#fff4de' : xx === 0 ? '#8a5e14' : yy > 2 ? '#f2e4d6' : '#7a1a1a')); for (let k = 0; k < 4; k++) K.put(pb, cx - 6 + k * 3, cy - 4, U('#5a3826')); }
    else { K.ellipseFn(pb, cx, cy - 7, 8, 7, (nx, ny) => U(ny > 0.2 ? '#cfc0a2' : nx < -0.2 && ny < -0.2 ? '#e8f8ff' : '#7ab8d8')); for (let xx = -9; xx <= 9; xx++) K.put(pb, cx + xx, cy - 1, U('#a8967a')); }
    // caja de cristal: frente translúcido, aristas, reflejo diagonal
    for (let yy = top - h; yy < top; yy++) for (let xx = x + 1; xx < x + w - 1; xx++) { const c = K.get(pb, xx, yy); K.put(pb, xx, yy, c >>> 24 ? K.mixU(c, Gl[3], 0.18) : (Gl[1] & 0x00ffffff | 0x44000000) >>> 0); }
    for (let yy = top - h; yy < top; yy++) { K.put(pb, x + 1, yy, Gl[4]); K.put(pb, x + w - 2, yy, Gl[2]); }
    for (let xx = x + 1; xx < x + w - 1; xx++) { K.put(pb, xx, top - h, Gl[4]); K.put(pb, xx + dx, top - h - dy, Gl[3]); }
    for (let q = 0; q <= dx; q++) { K.put(pb, x + w - 2 + q, top - h - Math.round(q * dy / dx), Gl[3]); K.put(pb, x + 1 + q, top - h - Math.round(q * dy / dx), Gl[4]); }
    for (let yy = top - h - dy; yy < top - dy; yy++) K.put(pb, x + w - 2 + dx, yy, Gl[2]);
    for (let k = 0; k < Math.min(w, h) - 6; k++) { K.put(pb, x + 5 + k, top - 4 - k, Gl[4]); if (k % 3) K.put(pb, x + 8 + k, top - 4 - k, Gl[3]); }
    // placa con el rótulo
    const lw = Math.min(w - 6, PFK.measure(label, { font: 'tiny' }) + 6), lx = x + Math.round((w - lw) / 2);
    for (let yy = 0; yy < 9; yy++) for (let xx = 0; xx < lw; xx++) K.put(pb, lx + xx, yb - ph + 8 + yy, G[yy === 0 ? 5 : yy === 8 ? 1 : 3]);
    K.text(pb, label, lx + 3, yb - ph + 10, U('#3a2408'), { font: 'tiny' });
    PFB.contact(pb, x + w / 2, yb, w / 2 + 4, 2);
    return { glint: [x + w - 6, top - h + 3] };
  }
  /** Atril de madera con micrófono y hoja de actas */
  function lectern(pb, x, yb) {
    const Wd = P(PFBM.WOODH);
    PFInfra.box3q(pb, x, yb, 22, 34, 8, { ramp: PFBM.WOODH });
    for (let xx = 0; xx < 26; xx++) for (let q = 0; q < 3; q++) K.put(pb, x - 2 + xx, yb - 36 - q + Math.round(xx * 0.12), Wd[q === 0 ? 7 : q === 1 ? 5 : 3]);
    for (let xx = 4; xx < 16; xx++) for (let q = 0; q < 2; q++) K.put(pb, x + xx, yb - 40 - q + Math.round(xx * 0.12), U(q ? '#fff4de' : '#e8dcc8'));
    for (let q = 0; q < 10; q++) K.put(pb, x + 18 + Math.round(q * 0.3), yb - 38 - q, U('#2a2a34'));
    K.put(pb, x + 21, yb - 49, U('#56566a')); K.put(pb, x + 22, yb - 49, U('#8a8a9a'));
    K.text(pb, 'ACTAS', x + 3, yb - 26, U('#ffe08a'), { font: 'tiny' });
  }
  /** Quiosco de consulta pública (pantalla vertical con pie) */
  function kiosk(pb, x, yb) {
    PFInfra.box3q(pb, x + 4, yb, 10, 30, 6, { ramp: PFBM.ROYAL });
    PFInfra.box3q(pb, x, yb - 30, 18, 34, 6, { ramp: PFBM.ROYAL });
    for (let yy = 0; yy < 26; yy++) for (let xx = 0; xx < 12; xx++) K.put(pb, x + 3 + xx, yb - 60 + yy, U(yy < 5 ? '#1c3596' : yy % 6 === 1 && xx > 1 && xx < 10 ? '#8aa4e8' : '#0a1440'));
    K.text(pb, '?', x + 7, yb - 59, U('#ffe08a'), { font: 'tiny' });
    return { scr: [x + 3, yb - 53, 12, 18] };
  }
  function finish(pb, world, back, gy, D) {
    // postes y cordones ante la historia y alrededor del gemelo
    stanchions(pb, 62, 418, back(240) + 2, 32);
    stanchions(pb, 1384, 1500, back(1440) + 2, 29);
    // vitrinas con objetos de la historia de SYNARA
    const v1 = vitrine(pb, 1222, back(1244) + 2, 44, 'membrane', 'MEMBRANA');
    const v2 = vitrine(pb, 1564, back(1586) + 2, 40, 'sensor', 'SENSOR');
    const v3 = vitrine(pb, 1960, back(1980) + 2, 40, 'book', 'ACTAS');
    const v4 = vitrine(pb, 2036, back(2056) + 2, 40, 'dome', 'CÚPULA');
    for (const v of [v1, v2, v3, v4]) D.glows.push({ x: v.glint[0], y: v.glint[1], r: 3, col: '#e8f8ff', a: 0.35, mode: 'pulse', hz: 0.3 });
    // atril de actas junto a la mesa y quiosco de consulta junto al muro de evidencias
    lectern(pb, 584, back(594) + 2);
    const kq = kiosk(pb, 1264, back(1270) + 2);
    D.leds.push({ x: kq.scr[0] + 2, y: kq.scr[1] + 2, col: '#56e5ff', hz: 0.6, ph: 3 });
    // reflejos de todo lo anterior en el mármol (no en la alfombra de la escalinata)
    reflect(pb, 0, 600, back, gy, { a: 0.24 });
    reflect(pb, 1100, 2400, back, gy, { a: 0.26 });
    // alfombra del vestíbulo hacia la escalinata de la mesa (sin reflejo: es tela)
    runner(pb, 40, 600, back, gy);
  }
  return { finish, reflect, runner, stanchions, vitrine, lectern, kiosk };
})();
