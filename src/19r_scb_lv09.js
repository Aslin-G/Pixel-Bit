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

/* =====================================================================
   r3-int-a · NIVEL 9: patio de agua, mosaico, naturaleza y vida del salón
   · Banda inferior (bajo la línea de paso): suelo de zellige en 3/4 cuyas
     filas crecen hacia el espectador, acequia de agua turquesa con
     nenúfares y surtidores, bancos y jardineras con cítricos, agaves y
     buganvillas en el primer término (siempre por debajo de los pies).
   · Plantas del plano jugable: naranjos y palmeras en maceta, buganvilla
     que cae por la balaustrada.
   · Vida: estandartes que se mecen (tiras de 3 px desplazadas), dos
     ventiladores de techo, destellos y ondas de la acequia, surtidores.
   API: R3INTA_L9ground(pb, world, segs) · R3INTA_L9plants(pb, world, back, gy)
        R3INTA_L9banners() · R3INTA_L9mid(g, sc, cam) · R3INTA_L9front(g, sc, cam)
        R3INTA_citrus(pb, x, yb, s, seed) · R3INTA_bougain(pb, x, y, len, seed, o)
   ===================================================================== */
const R3INTA_L9 = { spouts: [], pads: [], banners: [], fans: [], rillY: 318 };
const R3INTA_ZEL = ['#f4e6c8', '#1aa59a', '#c8582c', '#1c3596', '#e0a83a', '#2f9e4c'];
const R3INTA_BOUG = ['#4a0a3a', '#7a1458', '#b0207a', '#d83a98', '#f070b8', '#ffb0dc'];
/** Naranjo en maceta de terracota: copa de hojas brillantes con naranjas y azahar */
function R3INTA_citrus(pb, x, yb, s = 1, seed = 1) {
  const K = PFK, r = RNG(seed), T = K.P32(R3INTA_TERRA), ph = Math.round(12 * s), pw = Math.round(11 * s);
  for (let yy = 0; yy < ph; yy++) { const hw = Math.round(pw - yy * 0.18); for (let xx = -hw; xx <= hw; xx++) { const f = (xx + hw) / (2 * hw); K.put(pb, x + xx, yb - yy, T[yy === ph - 1 ? 6 : yy === ph - 2 ? 4 : f < 0.15 ? 5 : f > 0.8 ? 1 : (yy === 3 ? 2 : 3)]); } }
  const top = yb - ph;
  for (let yy = 0; yy < Math.round(8 * s); yy++) { K.put(pb, x, top - yy, U('#5a3416')); K.put(pb, x + 1, top - yy, U('#3a200c')); }
  const cy = top - Math.round(16 * s), rr = Math.round(11 * s);
  PFFlora.cluster(pb, x, cy, rr + 2, rr, PFFlora.GLOSSY, seed, { density: 0.75, leaf: [3, 5] });
  for (let i = 0; i < Math.round(9 * s); i++) { const a = r() * TAU, d = r() * rr * 0.85, fx = Math.round(x + Math.cos(a) * d), fy = Math.round(cy + Math.sin(a) * d * 0.8); K.put(pb, fx, fy, U('#ff9a1c')); K.put(pb, fx + 1, fy, U('#e06a10')); K.put(pb, fx, fy - 1, U('#ffd060')); }
  for (let i = 0; i < Math.round(5 * s); i++) K.put(pb, Math.round(x + (r() - 0.5) * rr * 1.6), Math.round(cy + (r() - 0.6) * rr), U('#fffaf0'));
}
/** Buganvilla que cae: tallo leñoso con racimos magenta y hojas (len px hacia abajo) */
function R3INTA_bougain(pb, x, y, len, seed = 1, o = {}) {
  const K = PFK, r = RNG(seed), B = K.P32(o.ramp || R3INTA_BOUG), L = K.P32(R3INTA_LEAF);
  let px = x;
  for (let k = 0; k < len; k++) {
    px = x + Math.round(Math.sin(k * 0.21 + seed) * (o.sway ?? 2) + (o.lean || 0) * k);
    K.put(pb, px, y + k, L[2]);
    if (k % 3 === 0) {
      const n = 3 + r.int(0, 3);
      for (let q = 0; q < n; q++) { const fx = px + r.int(-3, 3), fy = y + k + r.int(-1, 2), c = r.int(1, 5); K.put(pb, fx, fy, B[c]); if (c > 2) K.put(pb, fx + 1, fy, B[c - 1]); }
      if (r.chance(0.6)) { K.put(pb, px + (k % 2 ? 2 : -2), y + k + 1, L[4]); K.put(pb, px + (k % 2 ? 3 : -3), y + k + 1, L[5]); }
    }
  }
  for (let q = 0; q < 5; q++) K.put(pb, px + r.int(-2, 2), y + len + r.int(0, 2), B[r.int(2, 5)]);
}
/** Banda inferior del salón: zellige en 3/4, acequia y primer término de patio (decorateFace) */
function R3INTA_L9ground(pb, world, segs) {
  const K = PFK, gy = (x) => world.groundAt(x), RY = R3INTA_L9.rillY, H_ = 360, w = pb.w;
  const Z = R3INTA_ZEL.map(c => [U(shade(c, -0.45)), U(shade(c, -0.22)), U(c), U(shade(c, 0.22))]);
  const GROUT = U('#3a2418'), ST = K.P32(PFBM.MARB);
  const isSteps = (x) => x >= 600 && x < 1100;
  R3INTA_L9.spouts.length = 0; R3INTA_L9.pads.length = 0;
  // filas del zellige (alto creciente hacia el espectador)
  const rows = []; { let y = 0, h = 4; while (y < 80) { rows.push([y, h]); y += h; h = Math.min(12, h + 1); } }
  const tile = (x, y, y0, i0) => {
    const dy = y - y0; let ri = 0; while (ri + 1 < rows.length && rows[ri + 1][0] <= dy) ri++;
    const [ry, rh] = rows[ri], tw = Math.round(rh * 1.8), off = (ri % 2) * (tw >> 1), col = Math.floor((x + off + 9000) / tw), tx = (x + off + 9000) % tw, ty = dy - ry;
    if (tx === 0 || ty === 0) return GROUT;
    const motif = (col + ri * 2 + i0) % 6, base = [0, 1, 0, 2, 0, 3][motif], Zb = Z[base];
    const cx = tw / 2, cy = rh / 2, d = Math.abs(tx - cx) / cx + Math.abs(ty - cy) / cy;
    let u = d < 0.55 ? Z[(base + 4) % 6 === 0 ? 4 : base === 0 ? 1 : 4][2] : Zb[2];
    if (d < 0.25) u = Z[0][3];
    if (ty === 1 || tx === 1) u = d < 0.55 ? u : Zb[3];
    else if (ty === rh - 1 || tx === tw - 1) u = Zb[1];
    // a la sombra hacia el espectador (más frío y oscuro)
    if (dy > 26) u = K.mixU(u, U('#1a1440'), Math.min(0.42, (dy - 26) * 0.012));
    return u;
  };
  for (let x = 0; x < w; x++) {
    const g = gy(x), y0 = isSteps(x) ? g + 25 : g + 7;
    // franja de zellige entre el labio dorado y la acequia
    for (let y = y0; y < RY - 2; y++) K.put(pb, x, y, tile(x, y, y0, 1));
    // acequia: labio de mármol, agua turquesa en 3 tonos con brillo, labio inferior en sombra
    K.put(pb, x, RY - 2, ST[8]); K.put(pb, x, RY - 1, ST[5]);
    for (let q = 0; q < 6; q++) K.put(pb, x, RY + q, U(q === 0 ? '#9af0e4' : q < 2 ? '#3ad0c0' : q < 4 ? '#1aa59a' : '#0d6e6a'));
    if ((x * 7) % 23 === 0) K.put(pb, x, RY + 1, U('#e8fffa'));
    K.put(pb, x, RY + 6, ST[2]); K.put(pb, x, RY + 7, ST[6]); K.put(pb, x, RY + 8, ST[4]);
    // suelo de zellige del primer término (filas grandes)
    for (let y = RY + 9; y < H_; y++) K.put(pb, x, y, tile(x, y, RY + 9, 0));
  }
  // nenúfares y surtidores en la acequia
  const r = RNG(9090);
  for (let x = 40; x < w - 20; x += 50 + r.int(0, 50)) {
    K.ellipseFn(pb, x, RY + 3, 4, 1.4, (nx, ny) => U(ny < 0 ? '#86e36f' : '#2f9e4c')); K.put(pb, x + 2, RY + 3, U('#1aa59a'));
    if (r.chance(0.6)) { K.put(pb, x - 1, RY + 1, U('#ffb0dc')); K.put(pb, x, RY + 1, U('#ff70b8')); K.put(pb, x, RY, U('#fff0f8')); }
    R3INTA_L9.pads.push([x, RY + 3]);
  }
  for (let x = 140; x < w - 40; x += 300) {
    // surtidor: boquilla de bronce en el labio y cuenco
    for (let q = 0; q < 4; q++) { K.put(pb, x, RY - 3 - q, U(q === 3 ? '#ffe08a' : '#a8761c')); K.put(pb, x + 1, RY - 3 - q, U('#6a4610')); }
    R3INTA_L9.spouts.push([x, RY - 7]);
  }
  // primer término del patio: jardineras con naranjos/agaves/buganvilla y bancos (bajo los pies: tope ≤ suelo + 6)
  for (let x = 70, i = 0; x < w - 40; x += 120 + r.int(0, 40), i++) {
    const yb = 352;
    if (i % 3 === 1) { PFB.bench(pb, x - 22, yb, 46, { ramp: PFBM.WOODH }); continue; }
    PFInfra.box3q(pb, x - 18, yb, 36, 13, 7, { ramp: R3INTA_TERRA, skew: 0.6 });
    for (let xx = x - 16; xx < x + 16; xx += 4) PFK.put(pb, xx, yb - 7, U(R3INTA_ZEL[(xx >> 2) % 6]));
    if (i % 3 === 0) { PFFlora.cluster(pb, x, yb - 22, 15, 9, PFFlora.GLOSSY, 9300 + x, { density: 0.75, leaf: [3, 5] }); for (let q = 0; q < 8; q++) { const fx = x + r.int(-12, 12), fy = yb - 22 + r.int(-6, 5); PFK.put(pb, fx, fy, U('#ff9a1c')); PFK.put(pb, fx, fy - 1, U('#ffd060')); } }
    else { PFFlora.agave(pb, x - 6, yb - 13, 9, 9400 + x); PFFlora.agave(pb, x + 8, yb - 13, 7, 9500 + x); }
    for (let q = 0; q < 3; q++) R3INTA_bougain(pb, x - 14 + q * 13, yb - 14, 8 + r.int(0, 8), 9600 + x + q, { sway: 1.2 });
  }
}
/** Plantas del plano jugable: naranjos y palmeras en maceta y buganvilla en la balaustrada (props) */
function R3INTA_L9plants(pb, world, back, gy) {
  const yb = (x) => back(x) + 2;
  for (const [x, s] of [[22, 0.9], [590, 0.8], [1090, 0.85], [1295, 0.75], [1690, 0.8], [2072, 0.85], [2318, 0.8]]) R3INTA_citrus(pb, x, yb(x) + 1, s, 8800 + x);
  for (const x of [470, 1960]) { PFFlora.palm(pb, x, yb(x) - 14, 46, 3, 8900 + x); const T = PFK.P32(R3INTA_TERRA); for (let yy = 0; yy < 14; yy++) for (let xx = -8; xx <= 8; xx++) PFK.put(pb, x + xx, yb(x) - yy, T[yy === 13 ? 6 : xx < -5 ? 5 : xx > 5 ? 1 : 3]); }
  for (let x = 2100; x < 2296; x += 14) R3INTA_bougain(pb, x, yb(x) - 30, 14 + ((x * 7) % 12), 8700 + x, { sway: 1.6 });
}
/** Estandartes como sprites sueltos (se dibujan con vaivén por tiras en R3INTA_L9mid) */
function R3INTA_L9banners() {
  const L = R3INTA_L9.banners; L.length = 0;
  const bcols = ['#1aa59a', '#e08a1a', '#3a8adc', '#2f9e4c', '#d4505a', '#9a52d4'];
  for (let k = 0; k < 12; k++) { const tmp = new PixelBuffer(40, 82); PFBM.banner(tmp, 3, 4, bcols[k % 6], k % 6, 64); L.push({ c: tmp.toCanvas(), x: 96 + k * 200 - 3, y: 4, ph: k * 1.7 }); }
  R3INTA_L9.fans = [[413, 0], [1013, 0], [1813, 0]];
}
/** Detrás de los personajes: estandartes que se mecen y ventiladores de techo girando */
function R3INTA_L9mid(g, sc, cam) {
  const t = Game.time, ox = cam.x, oy = cam.y;
  for (const b of R3INTA_L9.banners) {
    const sx = Math.round(b.x - ox), sy = Math.round(b.y - oy); if (sx > W + 8 || sx + 40 < -8) continue;
    for (let y = 0; y < 82; y += 3) { const k = Math.pow(y / 82, 1.15), dx = Math.round((Math.sin(t * 1.3 + b.ph - y * 0.045) * 3 + Math.sin(t * 3.1 + b.ph * 2 - y * 0.12) * 0.9) * k); g.drawImage(b.c, 0, y, 40, Math.min(3, 82 - y), sx + dx, sy + y, 40, Math.min(3, 82 - y)); }
  }
  for (const [x] of R3INTA_L9.fans) {
    const sx = Math.round(x - ox), sy = -oy; if (sx < -30 || sx > W + 30) continue;
    g.fillStyle = '#5a3a0e'; g.fillRect(sx, sy, 1, 22); g.fillStyle = '#e0a83a'; g.fillRect(sx + 1, sy, 1, 22);
    for (let i = 0; i < 4; i++) {
      const a = t * 4.2 + i * Math.PI / 2, c = Math.cos(a), s = Math.sin(a), L = 21;
      g.fillStyle = s > 0 ? '#5a3016' : '#ba7c3e';
      for (let k = 4; k <= L; k += 2) g.fillRect(Math.round(sx + c * k), Math.round(sy + 25 + s * k * 0.18), 2, 1 + (k > 7 && k < 18 ? 1 : 0));
    }
    g.fillStyle = '#b07a1c'; g.fillRect(sx - 3, sy + 21, 8, 5); g.fillStyle = '#ffe08a'; g.fillRect(sx - 2, sy + 21, 5, 1); g.fillStyle = '#fff4c8'; g.fillRect(sx - 1, sy + 26, 3, 1);
  }
}
/** Delante (bajo la línea de paso): destellos que corren por la acequia, ondas en los nenúfares y surtidores */
function R3INTA_L9front(g, sc, cam) {
  const t = Game.time, ox = cam.x, oy = cam.y, RY = R3INTA_L9.rillY - oy;
  g.fillStyle = '#e8fffa';
  for (let i = 0; i < 26; i++) { const x = ((i * 97 + t * 18) % (W + 40)) - 20, y = RY + 1 + (i % 3); g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 3 + i); g.fillRect(Math.round(x), Math.round(y), 2 + (i % 2), 1); }
  g.globalAlpha = 1;
  for (const [x, y] of R3INTA_L9.spouts) {
    const sx = x - ox; if (sx < -20 || sx > W + 20) continue;
    for (let k = 0; k < 7; k++) { const ph = (t * 1.6 + k / 7) % 1, px = sx + 1 + ph * 9, py = y - oy - Math.sin(ph * Math.PI) * 6 + ph * 8; g.fillStyle = k % 2 ? '#bff8f0' : '#ffffff'; g.fillRect(Math.round(px), Math.round(py), 1, 2); }
    const rp = (t * 1.6) % 1; g.globalAlpha = 1 - rp; g.fillStyle = '#e8fffa'; g.fillRect(Math.round(sx + 10 - rp * 4), RY + 1, Math.round(2 + rp * 8), 1); g.globalAlpha = 1;
  }
}
