/* =====================================================================
   18v_pfb_city.js — Ciudad bajo la Calima en el plano jugable (kit B, nivel 10).
   Casas de estuco en 3/4 a escala de personajes de ≈74 px (puertas 88 px,
   persianas cerradas por la tormenta, depósitos en azotea), puesto de
   mercado con toldo, guirnaldas rotas, marco de la pantalla pública,
   sacos terreros, punto de agua de emergencia, carpa de ayuda, señales de
   ruta de emergencia, barreras; planta de agua: canal de captación con
   reja, filtros de arena a presión, laguna de salmuera revestida con
   costra salina, montón de sal, caseta del difusor, depósito horizontal de
   H₂ y el núcleo SYNARA (rotonda con cúpula y puerta sellada).
   El polvo se aplica con PFBE.dust / PFBE.drift.
   ===================================================================== */
const PFBC = (() => {
  const K = PFK, B = PFB, I = PFInfra, E = PFBE;
  const P = (r) => K.P32(r);
  const DUST = '#d8a868';
  /** Rampa de 10 tonos a partir de un color base (sombra cálida → luz crema) */
  const rampCache = new Map();
  function rampOf(base) {
    let r = rampCache.get(base); if (r) return r;
    r = [0.86, 0.72, 0.56, 0.4, 0.24, 0.1].map(k => mixHex(base, '#1a0c08', k)).concat([base, mixHex(base, '#fff6e8', 0.28), mixHex(base, '#fff6e8', 0.55), mixHex(base, '#fff6e8', 0.8)]);
    rampCache.set(base, r); return r;
  }
  const stucco = (x0, R_, o = {}) => { const C = P(R_), n = C.length; return (xx, yy, u, v) => { const ly = yy - (o.top || 0); if (o.plinthY != null && yy >= o.plinthY) return C[clamp(3 - ((yy - o.plinthY) === 0 ? -1 : 0) + Math.round((K.cl(xx, yy, 2, 3) - 0.5)), 0, n - 1)]; let k = 6 - Math.round(v * 1.6) + Math.round((K.vn(xx * 0.12, yy * 0.1, 5) - 0.5) * 1.6) + Math.round((K.cl(xx, yy, 2, 6) - 0.5) * 0.8); if (K.vn(xx * 0.05, yy * 0.4, 8) > 0.78) k -= 1; if (u > 0.96) k -= 2; else if (u < 0.02) k += 1; return C[clamp(k, 0, n - 1)]; }; };
  /** Ventana con persianas de lamas cerradas (tormenta) */
  function shutWin(pb, x, y, w, h, R_ = B.R.WOOD, frame) {
    const F = P(frame || B.R.STUCCO), S = P(R_);
    B.rect(pb, x - 2, y - 2, w + 4, h + 4, (xx, yy) => F[yy < y - 1 ? 7 : xx >= x + w ? 3 : 5]);
    B.rect(pb, x, y, w, h, (xx, yy) => { const r = (yy - y) % 3; return S[r === 0 ? 2 : r === 1 ? 6 : 4]; });
    for (let yy = y; yy < y + h; yy++) K.put(pb, x + Math.floor(w / 2), yy, S[1]);
    B.rect(pb, x - 3, y + h + 1, w + 6, 2, (xx, yy) => F[yy === y + h + 1 ? 8 : 3]);
  }
  /** Casa de estuco en 3/4 (1–2 plantas): puerta 88 px, persianas cerradas, cornisa, azotea con depósito
      y calentador solar, contador, maceta y polvo. o: {col, door, floors, seed, tank, balcony} */
  function house(pb, x, yb, w, h, o = {}) {
    const R_ = rampOf(o.col || '#e0a070'), C = P(R_), d = o.d || 16, out = {};
    I.box3q(pb, x, yb, w, h, d, {
      ramp: R_, front: stucco(x, R_, { plinthY: yb - 8 }),
      top: (xx, yy, u, v) => C[clamp(Math.round(6 - v * 2 + (K.cl(xx, yy, 2, 4) - 0.5)), 2, 9)],
      side: (xx, yy, u, v) => C[clamp(Math.round(3 - v * 1.2 + (K.cl(xx, yy, 2, 7) - 0.5) * 0.8), 0, 9)], ink: '#1a0c08',
    });
    // cornisa y pretil
    for (let xx = x - 2; xx < x + w + 2; xx++) { K.put(pb, xx, yb - h, C[9]); K.put(pb, xx, yb - h + 1, C[8]); K.put(pb, xx, yb - h + 2, C[2]); }
    // puerta (≥ 88 px)
    const dc = o.door || ['#06302e', '#0a4a4a', '#18a294', '#2ac0b0', '#56dcc6', '#a0f0e0', '#c8fff4', '#e8fffa'];
    const dx = x + (o.doorX ?? 10);
    B.door(pb, dx, yb, 20, 88, dc, { frame: R_, panels: true, arch: !!o.arch });
    out.door = [dx + 10, yb - 44];
    // ventanas con persianas cerradas
    const wins = [];
    if ((o.floors || 1) > 1 || h > 110) { for (let k = 0; k < Math.floor((w - 16) / 26); k++) wins.push([x + 8 + k * 26, yb - h + 14]); }
    if (w > 50) wins.push([x + w - 26, yb - 62]);
    for (const [wx, wy] of wins) shutWin(pb, wx, wy, 16, 18, o.shutter || B.R.WOOD, R_);
    // balcón con barandilla y macetas
    if (o.balcony && (o.floors || 1) > 1) { const by = yb - h + 38; for (let xx = x + 4; xx < x + w - 4; xx++) { K.put(pb, xx, by, C[8]); K.put(pb, xx, by + 1, C[2]); } for (let xx = x + 5; xx < x + w - 5; xx += 3) for (let yy = by - 10; yy < by; yy++) K.put(pb, xx, yy, U('#2a1e1c')); for (let xx = x + 4; xx < x + w - 4; xx++) K.put(pb, xx, by - 10, U('#3e3230')); for (let k = 0; k < 3; k++) PFFlora.cluster(pb, x + 12 + k * 16, by - 14, 5, 4, ['#1a2c0c', '#2c4614', '#42621c', '#5c7e24', '#7c9a30', '#a0b440'], x + k, { density: 0.8 }); }
    // azotea: depósito de agua y calentador solar
    if (o.tank !== false) { const tx = x + Math.round(w * 0.62); I.cylV(pb, tx, yb - h - 8, 7, 12, { ramp: ['#141414', '#222226', '#34343a', '#4a4a52', '#62626c', '#7e7e8a', '#a0a0ac', '#c8c8d2'], dome: 0.4, stain: false }); }
    if (o.solar) { I.pvPanel(pb, x + 8, yb - h - 6, 16, 5); }
    // contador eléctrico y cables
    B.rect(pb, dx + 26, yb - 50, 7, 9, U('#5a4c48')); B.rect(pb, dx + 27, yb - 49, 5, 3, U('#c8d0d8'));
    for (let yy = yb - h + 3; yy < yb - 50; yy++) K.put(pb, dx + 29, yy, U('#2a1e1c'));
    // maceta y gato de barro / bidón junto a la puerta
    if (o.pot !== false) { const px = dx - 9; I.box3q(pb, px, yb - 1, 8, 7, 3, { ramp: B.R.ADOBE }); PFFlora.agave(pb, px + 4, yb - 8, 6, x); }
    E.dust(pb, x - 2, yb - h - 20, w + Math.round(d * 0.45) + 4, h + 21, DUST, o.soil ?? 0.22, x);
    E.drift(pb, x + w + 4, yb + 1, 18, 5, x);
    B.castR(pb, x + w, x + w + 6, yb - 1, Math.round(h * 0.18), { amt: -0.22, yMin: yb - 18 });
    out.lamp = [x + w - 6, yb - h + 6];
    return out;
  }
  /** Guirnalda de banderines en catenaria; torn = proporción de banderines rotos o arrancados */
  function bunting(pb, x0, y0, x1, y1, sag = 10, cols = ['#ff6b6b', '#20d6c7', '#ffe14d', '#86e36f'], torn = 0.3, seed = 1) {
    const r = RNG(seed);
    for (let x = x0; x <= x1; x++) { const t = (x - x0) / (x1 - x0), y = Math.round(lerp(y0, y1, t) + sag * 4 * t * (1 - t)); K.put(pb, x, y, U('#2a1e1c')); }
    for (let x = x0 + 4, i = 0; x < x1 - 4; x += 9, i++) {
      if (r() < torn * 0.5) continue;
      const t = (x - x0) / (x1 - x0), y = Math.round(lerp(y0, y1, t) + sag * 4 * t * (1 - t)) + 1, c = cols[i % cols.length], rip = r() < torn;
      for (let k = 0; k < (rip ? 4 : 7); k++) for (let j = -Math.max(0, 3 - Math.floor(k / 2)); j <= Math.max(0, 3 - Math.floor(k / 2)); j++) K.put(pb, x + j + (rip ? k >> 1 : 0), y + k, U(j < 0 ? mixHex(c, '#ffffff', 0.25) : c));
    }
  }
  /** Puesto de mercado: postes, toldo a rayas, mostrador (≈38 px), cajas con fruta y lona */
  function stall(pb, x, yb, w = 56, o = {}) {
    const Wd = P(B.R.WOOD), S = B.sprite(w + 16, 100), b = 96;
    for (const px of [2, w + 2]) for (let yy = b - 78; yy < b; yy++) { K.put(S, px, yy, Wd[6]); K.put(S, px + 1, yy, Wd[3]); }
    B.awning(S, 0, b - 82, w + 6, 8, o.cols || ['#c8384a', '#fcefe0']);
    I.box3q(S, 2, b, w, 36, 10, { ramp: B.R.WOOD, front: (xx, yy, u, v) => Wd[((xx) % 8 === 0) ? 2 : clamp(5 - Math.round(v * 2), 1, 7)] });
    // cajas con fruta sobre el mostrador
    const fruit = [['#ff8a2a', '#c85a10'], ['#ffd83a', '#c8a010'], ['#e0402a', '#901a10'], ['#86c83a', '#4a8a1a']];
    for (let k = 0; k < 4; k++) { const cx = 6 + k * Math.round((w - 6) / 4); I.box3q(S, cx, b - 36, 12, 6, 5, { ramp: B.R.WOODG }); for (let j = 0; j < 4; j++) K.ellipseFn(S, cx + 2 + j * 3, b - 43, 1.8, 1.8, (nx, ny, d) => U(ny < -0.2 ? mixHex(fruit[k][0], '#ffffff', 0.3) : d > 0.6 ? fruit[k][1] : fruit[k][0])); }
    // lona medio bajada (cierre por tormenta)
    const Cv = P(B.R.CANVAS);
    for (let yy = b - 74; yy < b - 54; yy++) for (let xx = 4; xx < w + 2; xx++) K.put(S, xx, yy, Cv[clamp(5 - ((xx >> 2) % 2) - Math.round((yy - b + 74) / 10), 1, 7)]);
    if (o.sign) B.plaque(S, Math.round(w / 2) + 3, b - 30, o.sign, { center: true, bg: '#5a2c1a', border: '#ecbe86', col: '#fdeccc', h: 9, screws: false });
    B.finish(S); B.stamp(pb, S, x - 2, yb - b);
    E.dust(pb, x - 2, yb - b, w + 16, b, DUST, 0.18, x);
    B.contact(pb, x + w / 2, yb, w / 2 + 4, 2);
  }
  /** Marco de la pantalla pública (el contenido lo pinta el nivel en [x,y,w,h]) */
  function billboard(pb, x, y, w, h, title) {
    const S = P(E.STLD);
    for (const lx of [x + 10, x + w - 14]) for (let yy = y + h; yy < y + h + 34; yy++) for (let k = 0; k < 5; k++) K.put(pb, lx + k, yy, S[[7, 5, 4, 2, 1][k]]);
    B.rect(pb, x - 5, y - 5, w + 10, h + 10, (xx, yy) => S[(yy < y - 3) ? 7 : (xx > x + w + 2) ? 2 : 3]);
    B.rect(pb, x - 3, y - 3, w + 6, h + 6, U('#0a0614'));
    B.rect(pb, x, y, w, h, U('#1d0b3a'));
    // visera, altavoces y focos
    for (let r = 0; r < 4; r++) for (let xx = x - 7 - r; xx < x + w + 7 + r; xx++) K.put(pb, xx, y - 6 - r, S[r === 3 ? 8 : 5 - r]);
    for (const sx of [x - 14, x + w + 6]) { I.box3q(pb, sx, y + 30, 8, 18, 4, { ramp: E.STLD }); for (let k = 0; k < 4; k++) B.rect(pb, sx + 2, y + 16 + k * 3, 4, 1, U('#141010')); }
    if (title) B.plaque(pb, x + w / 2, y + h + 8, title, { center: true, bg: '#3a1060', border: '#f27ee6', col: '#ffd0e8', h: 9, screws: false });
    E.dust(pb, x - 14, y - 10, w + 28, h + 50, DUST, 0.16, x);
  }
  /** Muro de sacos terreros en hileras al tresbolillo */
  function sandbags(pb, x, yb, w, rows = 3) {
    const Cv = P(['#3a2a18', '#5a4428', '#7a603a', '#9a7c50', '#b89a68', '#d2b886', '#e8d4a8']);
    for (let r = 0; r < rows; r++) { const off = (r % 2) * 5, y = yb - 4 - r * 5; for (let bx = x + off; bx < x + w - 6; bx += 11) K.ellipseFn(pb, bx + 5, y, 6, 3.4, (nx, ny, d) => Cv[clamp(Math.round(4 - nx * 0.8 - ny * 1.8 - (d > 0.8 ? 1.5 : 0)), 0, 6)]); }
    B.contact(pb, x + w / 2, yb, w / 2 + 2, 1.6);
  }
  /** Punto de agua de emergencia: depósito en remolque con grifos y bidones */
  function waterPoint(pb, x, yb) {
    const S = P(E.STLD), out = {};
    I.cylH(pb, x + 4, x + 58, yb - 26, 12, { ramp: ['#1e3a5a', '#2c5682', '#4a7cae', '#7aa8d4', '#b4d4f0', '#e4f2ff', '#ffffff', '#ffffff'], band: ['#0a2a48', '#124a7a', '#1e78b4', '#3aa4e0', '#8ad0f8', '#e0f4ff'], bands: [16, 38] });
    for (let xx = x; xx < x + 64; xx++) { K.put(pb, xx, yb - 12, S[6]); K.put(pb, xx, yb - 11, S[2]); }
    for (const wx of [x + 14, x + 46]) K.ellipseFn(pb, wx, yb - 6, 5, 5, (nx, ny, d) => U(d < 0.25 ? '#988a82' : d < 0.6 ? '#241c1c' : '#3e3230'));
    for (let k = 0; k < 3; k++) { const tx = x + 18 + k * 12; for (let yy = yb - 16; yy < yb - 12; yy++) K.put(pb, tx, yy, U('#c8d0d8')); K.put(pb, tx + 1, yb - 14, U('#5ab4e0')); }
    B.plaque(pb, x + 31, yb - 33, 'PUNTO DE AGUA', { center: true, bg: '#0a2a48', border: '#8ad0f8', col: '#f4fbff', h: 9, screws: false });
    for (let k = 0; k < 4; k++) { const jx = x + 66 + k * 8; I.box3q(pb, jx, yb, 7, 10, 3, { ramp: k % 2 ? ['#3a2804', '#6a4a0a', '#a07a14', '#d8a828', '#f0c840', '#ffe080'] : ['#081830', '#0e2848', '#163c66', '#2c6ca8', '#4a8cc8', '#78b0e2'] }); }
    E.dust(pb, x, yb - 40, 100, 40, DUST, 0.2, x);
    B.contact(pb, x + 40, yb, 46, 2);
    out.taps = [x + 18, yb - 13];
    return out;
  }
  /** Carpa de ayuda a dos aguas en 3/4: frente triangular con puerta abierta, faldón lateral, vientos y cruz verde */
  function tent(pb, x, yb, w = 60, h = 52) {
    const Cv = P(B.R.CANVAS), d = 22, sk = 0.5, dx = Math.round(d * sk), s = B.sprite(w + dx + 16, h + d + 8), b = h + d + 4, cx = Math.round(w / 2) + 6;
    // faldón lateral (plano del tejado que se aleja), más oscuro
    PFK.polyFill(s, [[cx, b - h], [cx + dx, b - h - d], [6 + w + dx, b - d], [6 + w, b]], (xx, yy) => Cv[clamp(3 + (((xx - yy) % 7) === 0 ? -1 : 0) - (yy > b - 6 ? 1 : 0), 0, 7)]);
    // frente triangular
    for (let yy = b - h; yy < b; yy++) { const hw = Math.round((yy - (b - h)) / h * w / 2); for (let xx = cx - hw; xx <= cx + hw; xx++) { const f = (xx - cx + hw) / (2 * hw + 0.01); K.put(s, xx, yy, Cv[clamp(Math.round(6 - f * 1.5 - (yy - b + h) / h * 0.8 + ((xx % 11) === 0 ? -1 : 0)), 0, 7)]); } }
    // puerta abierta (triángulo oscuro con solapa recogida)
    for (let yy = b - 34; yy < b; yy++) { const hw = Math.round((yy - (b - 34)) / 34 * 11); for (let xx = cx - hw; xx <= cx + hw; xx++) K.put(s, xx, yy, U(yy < b - 30 ? '#4a3a2c' : '#22180f')); }
    for (let yy = b - 30; yy < b; yy++) K.put(s, cx + Math.round((yy - (b - 34)) / 34 * 11) + 1, yy, Cv[7]);
    // cumbrera, cruz y vientos
    K.lineFn(s, cx, b - h, cx + dx, b - h - d, () => Cv[7]);
    for (let k = -4; k <= 4; k++) { K.put(s, cx + k, b - h + 20, U('#2ab070')); K.put(s, cx, b - h + 20 + k, U('#2ab070')); }
    K.lineFn(s, cx - Math.round(w / 2) + 4, b - 6, 1, b - 1, () => U('#8a7a66')); K.lineFn(s, 6 + w + dx - 2, b - d + 4, 6 + w + dx + 8, b - 1, () => U('#8a7a66'));
    B.finish(s); B.stamp(pb, s, x - 6, yb - b);
    B.plaque(pb, x + cx - 6, yb - h - 2, 'AYUDA', { center: true, bg: '#0a5a2c', border: '#e8fff0', col: '#ffffff', h: 9, screws: false });
    E.dust(pb, x - 6, yb - b, w + dx + 16, b, DUST, 0.2, x);
    B.contact(pb, x + w / 2 + 4, yb, w / 2 + 8, 2);
  }
  /** Poste con placa verde de ruta de emergencia y flecha */
  function routeSign(pb, x, yb, text = 'RUTA DE EMERGENCIA', dir = 1) {
    const S = P(E.STLD);
    for (let yy = yb - 64; yy < yb; yy++) { K.put(pb, x, yy, S[6]); K.put(pb, x + 1, yy, S[2]); }
    const w = B.plaque(pb, x + 1, yb - 64, text, { center: true, bg: '#0a5a2c', border: '#e8fff0', col: '#ffffff', h: 11, screws: false });
    const ax = x + (dir > 0 ? Math.round(w / 2) + 4 : -Math.round(w / 2) - 6);
    for (let k = 0; k < 5; k++) for (let j = -k; j <= k; j++) K.put(pb, ax + (dir > 0 ? 4 - k : k - 4), yb - 59 + j, U('#e8fff0'));
  }
  /** Barrera de obra a rayas sobre caballetes */
  function barricade(pb, x, yb, w = 36) {
    const S = P(E.STLD);
    for (const lx of [x + 3, x + w - 5]) { K.lineFn(pb, lx - 3, yb, lx, yb - 18, () => S[5]); K.lineFn(pb, lx + 3, yb, lx, yb - 18, () => S[3]); }
    for (let xx = x; xx < x + w; xx++) for (let k = 0; k < 5; k++) K.put(pb, xx, yb - 22 + k, U((((xx + k) >> 2) & 1) ? (k === 0 ? '#ffffff' : '#e0e0e8') : (k === 0 ? '#ff9a5a' : '#e8602a')));
    K.put(pb, x + 2, yb - 24, U('#ffb93b')); K.put(pb, x + w - 3, yb - 24, U('#ffb93b'));
  }

  /* ---------- planta de agua bajo la tormenta ---------- */
  /** Canal de captación abierto tras el pasillo, con reja de barras y rastrillo. Devuelve {x0,x1,y,h} del agua */
  function intake(pb, x0, x1, yb) {
    const C = P(PFBH2.THEMES.day.CONC), S = P(E.STLD), out = {};
    // muro delantero (borde del canal) y muro de fondo
    for (let xx = x0; xx < x1; xx++) { for (let yy = yb - 3; yy <= yb; yy++) K.put(pb, xx, yy, C[yy === yb - 3 ? 9 : 6 - (yy - yb + 3)]); for (let yy = yb - 18; yy < yb - 10; yy++) K.put(pb, xx, yy, C[clamp(3 + ((xx % 24) === 0 ? -1 : 0) - (yy > yb - 13 ? 1 : 0), 0, 9)]); K.put(pb, xx, yb - 19, C[8]); }
    // lámina de agua base (el color vivo lo pinta el nivel)
    for (let xx = x0; xx < x1; xx++) for (let yy = yb - 10; yy < yb - 3; yy++) K.put(pb, xx, yy, U('#14507a'));
    out.water = [x0 + 1, yb - 10, x1 - x0 - 2, 7];
    // reja de barras inclinada y rastrillo con pórtico
    const gx = x1 - 26;
    for (let k = 0; k < 9; k++) K.lineFn(pb, gx + k * 3, yb - 2, gx + k * 3 + 6, yb - 22, () => S[k % 2 ? 6 : 4]);
    for (const px of [gx - 4, gx + 30]) for (let yy = yb - 56; yy < yb - 2; yy++) { K.put(pb, px, yy, S[6]); K.put(pb, px + 1, yy, S[3]); K.put(pb, px + 2, yy, S[1]); }
    for (let xx = gx - 6; xx < gx + 34; xx++) { K.put(pb, xx, yb - 56, S[7]); K.put(pb, xx, yb - 55, S[3]); }
    I.box3q(pb, gx + 6, yb - 46, 16, 9, 5, { ramp: ['#3a2804', '#6a4a0a', '#a07a14', '#d8a828', '#f0c840', '#ffe080'] });
    for (let yy = yb - 46; yy < yb - 20; yy++) K.put(pb, gx + 14, yy, U('#2a1e1c'));
    // barandilla del canal
    B.rail(pb, x0, gx - 8, yb - 19, 22, { ramp: ['#3a2804', '#6a4a0a', '#a07a14', '#e8b830', '#ffe080'], gap: 22 });
    E.dust(pb, x0, yb - 60, x1 - x0, 60, DUST, 0.14, x0);
    return out;
  }
  /** Filtro de arena a presión (vertical) con válvulas y placa; devuelve {led} */
  function sandFilter(pb, cx, yb, r = 14, h = 58) {
    I.box3q(pb, cx - r - 4, yb, 2 * r + 9, 5, 12, { ramp: PFBH2.THEMES.day.CONC });
    const t = I.cylV(pb, cx, yb - 8, r, h, { ramp: ['#2a1e1c', '#4a3630', '#7a6050', '#a68a74', '#ccb49a', '#ead8c0', '#faf0e0', '#ffffff'], band: ['#3a1a08', '#6a3412', '#a0561e', '#c87a40', '#e8a060', '#ffd0a0'], bands: [{ y: 10, h: 3 }, { y: h - 12, h: 3 }], dome: 0.5, stain: true });
    for (const [vx, vy] of [[cx - r - 2, yb - 20], [cx + r + 2, yb - 40]]) I.valve(pb, vx, vy);
    I.pipe(pb, [[cx - r - 6, yb - 14], [cx - r, yb - 14]], 2, 'sea', { flange: 0 });
    I.gauge(pb, cx + 4, yb - 8 - h + 14, 2, -0.6);
    E.dust(pb, cx - r - 4, yb - h - 20, 2 * r + 12, h + 22, DUST, 0.18, cx);
    return { led: [cx - 2, yb - 8 - h + 6], top: t.top };
  }
  /** Laguna de salmuera revestida (geomembrana negra) con costra salina en el anillo de nivel alto.
      Devuelve {x0, x1, far, lip} para la lámina viva */
  function lagoon(pb, x0, x1, yb, depth = 26) {
    const C = P(PFBH2.THEMES.day.CONC), far = yb - depth, out = { x0: x0 + 6, x1: x1 - 6, far: far + 3, lip: yb - 3 };
    // talud lejano (revestimiento) y fondo
    for (let yy = far; yy <= yb; yy++) for (let xx = x0; xx < x1; xx++) {
      const sideL = xx - x0 < 6 - Math.round((yy - far) / depth * 4), sideR = x1 - xx < 6 - Math.round((yy - far) / depth * 4);
      let u;
      if (yy === far || yy === far + 1) u = C[yy === far ? 9 : 6];
      else if (sideL || sideR) u = U('#22222a');
      else if (yy > yb - 3) u = C[yy === yb - 2 ? 9 : 5];
      else { const t = (yy - far) / depth; u = U(t < 0.3 ? (hash2(xx, yy, 3) < 0.4 ? '#f4f0ff' : '#d8d0e8') : mixHex('#14141c', '#22222a', t)); }
      K.put(pb, xx, yy, u);
    }
    // placa y barandilla
    B.rail(pb, x0 + 2, x1 - 2, far - 1, 18, { ramp: ['#2a1e1c', '#5a4c48', '#988a82', '#d2c8be', '#fcf8f0'], gap: 26 });
    E.dust(pb, x0, far - 20, x1 - x0, depth + 22, DUST, 0.12, x0);
    return out;
  }
  /** Montón de sal cristalina */
  function saltPile(pb, x, yb, w = 30, h = 14) {
    for (let yy = Math.round(yb - h); yy <= yb; yy++) for (let xx = Math.round(x - w / 2); xx <= Math.round(x + w / 2); xx++) {
      const nx = (xx - x) / (w / 2), top = yb - h * (1 - Math.abs(nx) * 0.95) * (0.85 + 0.15 * K.vn(xx * 0.3, 0, 4)); if (yy < top) continue;
      const lit = nx < 0 ? 0.9 : 0.55 - nx * 0.3, g = hash2(xx, yy, 5);
      K.put(pb, xx, yy, U(g < 0.08 ? '#ffffff' : lit > 0.7 ? '#f4f0ff' : lit > 0.45 ? '#d8d0ec' : '#a89cc0'));
    }
    B.contact(pb, x, yb + 1, w / 2 + 2, 1.6);
  }
  /** Caseta del difusor con volante y bajante hacia el mar; devuelve {lamp} */
  function diffuserHut(pb, x, yb) {
    const R_ = rampOf('#c8a888');
    I.box3q(pb, x, yb, 30, 30, 12, { ramp: R_, front: stucco(x, R_, { plinthY: yb - 5 }) });
    B.door(pb, x + 5, yb, 10, 22, B.R.WOODG, { frame: R_ });
    I.pipe(pb, [[x + 30, yb - 14], [x + 42, yb - 14], [x + 42, yb]], 2, 'brineB', { flange: 0 });
    I.valve(pb, x + 36, yb - 18, { wheel: ['#3a0e30', '#7a1a66', '#bc3e92', '#f888b8'] });
    E.dust(pb, x, yb - 46, 48, 46, DUST, 0.2, x);
    return { lamp: [x + 20, yb - 22] };
  }
  /** Depósito horizontal (bala) sobre cunas */
  function bullet(pb, x0, x1, yb, r = 13, o = {}) {
    const S = P(E.STLD);
    for (const cx of [x0 + 14, x1 - 14]) I.box3q(pb, cx - 6, yb, 12, r + 2, 6, { ramp: PFBH2.THEMES.day.CONC });
    I.cylH(pb, x0, x1, yb - r - 4, r, { ramp: o.ramp || ['#2a1e1c', '#4a3630', '#7a6050', '#a68a74', '#ccb49a', '#ead8c0', '#faf0e0', '#ffffff'], band: o.band || ['#04261a', '#0a3e2a', '#11603e', '#1a8656', '#28ae6e', '#52d090'], bands: [18, x1 - x0 - 22] });
    if (o.label) B.plaque(pb, Math.round((x0 + x1) / 2), yb - r - 8, o.label, { center: true, bg: '#0a3e2a', border: '#9cecc0', col: '#ffffff', h: 9, screws: false });
    E.dust(pb, x0 - 4, yb - 2 * r - 8, x1 - x0 + 8, 2 * r + 10, DUST, 0.16, x0);
    B.castR(pb, x0, x1, yb - 1, 12, { amt: -0.2, yMin: yb - 16 });
  }
  /** Núcleo SYNARA: rotonda con columnas, cúpula de vidrio y puerta sellada (juntas vivas); devuelve
      {door:[cx,y,w,h], dome:[cx,cy], beacons} */
  function synaraCore(pb, cx, yb, w = 210, h = 124) {
    const R_ = rampOf('#d8c8b0'), C = P(R_), G = P(['#0a1e36', '#12304e', '#1d4a7a', '#3a7ab8', '#7ab8e8', '#c8ecff']), out = { beacons: [] };
    const x = Math.round(cx - w / 2);
    // escalinata
    for (let k = 0; k < 3; k++) I.box3q(pb, x - 18 + k * 6, yb - k * 4, w + 36 - k * 12, 4, 10, { ramp: R_ });
    const by = yb - 12;
    // tambor principal en 3/4 (cilindro ancho) con columnas
    const rx = w / 2, ry = 10;
    for (let yy = by - h; yy <= by; yy++) for (let xx = x; xx <= x + w; xx++) {
      const nx = (xx - cx) / rx; if (Math.abs(nx) > 1) continue;
      const nz = Math.sqrt(1 - nx * nx), lit = 0.35 + Math.max(0, -nx * 0.55 + nz * 0.5) * 0.65;
      const ly = yy - (by - h);
      let k = Math.round(lit * 9) - (ly > h - 12 ? 1 : 0);
      if (ly < 4) k = ly < 2 ? 9 : 2;
      if (ly >= 14 && ly < 18) k -= 2;
      const e = Math.round(ry * (1 - nz)), ph = ((Math.asin(clamp(nx, -1, 1)) * 7 / Math.PI * 2) % 1 + 1) % 1;
      if (ly > 18 && ly < h - 4 && ph < 0.12) k += 1; else if (ly > 18 && ly < h - 4 && ph > 0.12 && ph < 0.2) k -= 2;
      if (ly > 26 && ly < 42 && Math.abs(nx) < 0.92 && ph > 0.3 && ph < 0.9) { K.put(pb, xx, yy + e, G[clamp(2 + Math.round(lit * 3) + (ly < 30 ? 1 : 0), 0, 5)]); continue; }
      K.put(pb, xx, yy + e, C[clamp(k, 0, 9)]);
    }
    // franja cian (SYNARA) y cornisa
    for (let xx = x; xx <= x + w; xx++) { const nx = (xx - cx) / rx, e = Math.round(ry * (1 - Math.sqrt(Math.max(0, 1 - nx * nx)))); K.put(pb, xx, by - h + 16 + e, U('#56e5ff')); K.put(pb, xx, by - h + 17 + e, U('#1491aa')); }
    // cúpula de vidrio con nervios
    const dr = Math.round(w * 0.36), dcy = by - h + 2;
    K.ellipseFn(pb, cx, dcy, dr, dr * 0.62, (nx, ny, d) => { if (ny > 0) return 0; const rib = Math.abs(((Math.atan2(nx, -ny) * 4 / Math.PI) % 1 + 1) % 1 - 0.5) > 0.44; if (rib) return U('#e8f4ff'); const lit = -nx * 0.5 - ny * 0.6; return G[clamp(Math.round(2.5 + lit * 3), 0, 5)]; });
    for (let xx = cx - dr; xx <= cx + dr; xx++) K.put(pb, xx, dcy, U('#fff6e8'));
    out.dome = [cx, dcy - Math.round(dr * 0.4)];
    // linterna y antena con baliza
    B.rect(pb, cx - 4, dcy - Math.round(dr * 0.62) - 8, 8, 8, (xx, yy) => C[yy === dcy - Math.round(dr * 0.62) - 8 ? 9 : 6]);
    for (let yy = dcy - Math.round(dr * 0.62) - 30; yy < dcy - Math.round(dr * 0.62) - 8; yy++) K.put(pb, cx, yy, U('#988a82'));
    out.beacons.push([cx, dcy - Math.round(dr * 0.62) - 31]);
    // puerta sellada (96 px) con marco y juntas
    const dw = 44, dh = 96, dx = cx - dw / 2;
    B.rect(pb, dx - 6, by - dh - 8, dw + 12, dh + 8, (xx, yy) => C[(xx < dx - 3) ? 8 : (xx >= dx + dw + 3) ? 3 : yy < by - dh - 5 ? 9 : 6]);
    B.rect(pb, dx, by - dh, dw, dh, (xx, yy) => { const lx = xx - dx, ly = yy - (by - dh); let k = 3 - Math.round(ly / dh) + (lx < 2 ? 1 : 0) - (lx > dw - 3 ? 1 : 0); if (ly % 12 === 0) k -= 1; return P(E.STLD)[clamp(k + 2, 0, 8)]; });
    for (let yy = by - dh; yy < by; yy++) K.put(pb, cx, yy, U('#140e10'));
    out.door = [cx, by - dh, dw, dh];
    B.plaque(pb, cx, by - h - 2 + 24, 'NÚCLEO SYNARA', { center: true, font: 'main', bold: true, bg: '#06203a', border: '#56e5ff', col: '#f4fbff', h: 13 });
    E.dust(pb, x - 20, by - h - 70, w + 40, h + 84, DUST, 0.12, cx);
    B.castR(pb, x + w - 20, x + w + 10, yb - 1, 22, { amt: -0.22, yMin: yb - 20 });
    return out;
  }
  /** Pantalla de datos sobre patas (contenido vivo en [x,y,w,h]) */
  function screenStand(pb, x, yb, w = 70, h = 44) {
    const S = P(E.STLD), y = yb - 30 - h;
    for (const lx of [x + 8, x + w - 11]) for (let yy = y + h; yy < yb; yy++) { K.put(pb, lx, yy, S[6]); K.put(pb, lx + 1, yy, S[4]); K.put(pb, lx + 2, yy, S[1]); }
    B.rect(pb, x - 3, y - 3, w + 6, h + 6, (xx, yy) => S[yy < y - 1 ? 7 : xx > x + w ? 2 : 4]);
    B.rect(pb, x - 1, y - 1, w + 2, h + 2, U('#0a0614')); B.rect(pb, x, y, w, h, U('#140a24'));
    E.dust(pb, x - 4, y - 4, w + 8, h + 34, DUST, 0.12, x);
    return { scr: [x, y, w, h] };
  }
  return { rampOf, stucco, shutWin, house, bunting, stall, billboard, sandbags, waterPoint, tent, routeSign, barricade, intake, sandFilter, lagoon, saltPile, diffuserHut, bullet, synaraCore, screenStand, DUST };
})();
