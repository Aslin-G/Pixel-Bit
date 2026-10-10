/* =====================================================================
   18x_pfb_hall.js — Salón del consejo en el plano jugable (kit B, nivel 9).
   Atardecer dorado por los ventanales: luz de borde cálida desde la
   izquierda, sombras azul real. Estandartes de tela con pliegues y borlas,
   paneles de historia en 3/4, macetas de cerámica, gran mesa del consejo
   (encimera a 36 px, frente de mosaico, sillas altas detrás, micrófonos,
   jarras de agua), muro de evidencias con hilos rojos, pedestal
   holográfico, entreplanta del observatorio con pantallas, balaustrada y
   puerta monumental hacia el núcleo, lámparas colgantes.
   ===================================================================== */
const PFBM = (() => {
  const K = PFK, B = PFB, I = PFInfra;
  const P = (r) => K.P32(r);
  const GOLD = ['#3a2408', '#5a3a0e', '#8a5e14', '#b07a1c', '#c8861a', '#e0a83a', '#f0c860', '#ffe08a', '#fff4c8'];
  const ROYAL = ['#060c2e', '#0a1440', '#0e1f5a', '#14287a', '#1c3596', '#2a46b0', '#3a5ac4', '#5a7ad4', '#8aa4e8'];
  const WOODH = ['#200e06', '#3a1c0c', '#5a3016', '#7a4620', '#9a5e2c', '#ba7c3e', '#d49c58', '#ecc080'];
  const MARB = ['#2a1e1c', '#463430', '#6a5048', '#8e7064', '#b09284', '#ccb2a2', '#e2cebe', '#f2e4d6', '#fcf4ea'];
  const MOS = ['#20d6c7', '#ffe14d', '#4ccb70', '#ff6b6b', '#ffffff', '#c8861a'];
  const RIM = '#ffd8a0';
  const fin = (s, o = {}) => B.finish(s, Object.assign({ rimCol: RIM, rimK: 0.5 }, o));
  /** Estandarte de tela colgante con pliegues, ribete dorado, cola en punta, borlas e icono */
  function banner(pb, x, y, col, k, h = 64) {
    const s = B.sprite(36, h + 10), w = 28, C = P([mixHex(col, '#000000', 0.6), mixHex(col, '#000000', 0.4), mixHex(col, '#000000', 0.2), col, mixHex(col, '#ffffff', 0.18), mixHex(col, '#ffffff', 0.4)]), G = P(GOLD);
    for (let xx = 0; xx < 34; xx++) { K.put(s, xx, 1, G[7]); K.put(s, xx, 2, G[4]); K.put(s, xx, 3, G[2]); }
    K.ellipseFn(s, 1, 2, 1.6, 1.6, () => G[6]); K.ellipseFn(s, 33, 2, 1.6, 1.6, () => G[5]);
    for (let yy = 0; yy < h; yy++) {
      const cut = yy > h - 12 ? (yy - (h - 12)) * 1.25 : 0;
      for (let xx = 0; xx < w; xx++) {
        if (yy > h - 12 && Math.abs(xx - 13.5) < cut) continue;
        const fold = Math.sin((xx + 1) * 0.55 + yy * 0.02) * 0.9 + Math.sin(xx * 1.4) * 0.25;
        let kk = Math.round(3 + fold - (xx > 24 ? 1 : 0) + (xx < 2 ? 1 : 0) - yy / h * 0.6);
        const edge = xx < 2 || xx > w - 3 || (yy > h - 12 && Math.abs(xx - 13.5) < cut + 1.5);
        K.put(s, 3 + xx, 4 + yy, edge ? G[(xx < 2) ? 6 : 4] : C[clamp(kk, 0, 5)]);
      }
      if (yy === 4 || yy === h - 16) for (let xx = 3; xx < w - 3; xx++) K.put(s, 3 + xx, 4 + yy, G[6]);
    }
    // icono (agua, sol, viento, hoja, ecosistema, personas)
    const cx = 17, cy = 4 + Math.round(h * 0.4), c = U('#fffaf0');
    if (k === 0) { K.ellipseFn(s, cx, cy + 3, 5.5, 5.5, () => c); for (let j = 0; j < 7; j++) for (let i = -Math.floor(j / 2); i <= Math.floor(j / 2); i++) K.put(s, cx + i, cy - 7 + j, c); K.put(s, cx - 2, cy + 2, U('#bff4ff')); }
    else if (k === 1) { K.ellipseFn(s, cx, cy, 5, 5, () => c); for (let a = 0; a < 8; a++) { const an = a * Math.PI / 4; for (let r = 7; r < 10; r++) K.put(s, Math.round(cx + Math.cos(an) * r), Math.round(cy + Math.sin(an) * r), c); } }
    else if (k === 2) { for (let j = 0; j < 3; j++) { for (let i = -8; i < 5 - j * 3; i++) K.put(s, cx + i, cy - 6 + j * 6, c); K.put(s, cx + 5 - j * 3, cy - 7 + j * 6, c); } }
    else if (k === 3) { K.ellipseFn(s, cx, cy, 4.5, 8.5, () => c); for (let j = -8; j < 11; j++) K.put(s, cx, cy + j, C[1]); }
    else if (k === 4) { K.ellipseFn(s, cx - 1, cy + 2, 8, 4, () => c); for (let j = 0; j < 9; j++) for (let i = 0; i <= Math.min(j, 8 - j) / 2; i++) K.put(s, cx + 7 + i, cy - 2 + j, c); }
    else { K.ellipseFn(s, cx - 5, cy - 4, 2.6, 2.6, () => c); K.ellipseFn(s, cx + 5, cy - 4, 2.6, 2.6, () => c); B.rect(s, cx - 9, cy, 8, 9, c); B.rect(s, cx + 1, cy, 8, 9, c); }
    // borlas
    for (const tx of [5, 16, 28]) { for (let k2 = 0; k2 < 5; k2++) K.put(s, tx, 4 + h - 12 + Math.round((tx === 16 ? 12 : 4)) + k2, G[k2 < 2 ? 6 : 3]); }
    fin(s, { sides: 'lrb' }); B.stamp(pb, s, x - 3, y - 4);
  }
  /** Panel expositivo de historia en 3/4 sobre patas: franja de color, icono y líneas de texto */
  function historyPanel(pb, x, yb, w, col, seed = 1) {
    const s = B.sprite(w + 12, 96), b = 92, h = 58, Wd = P(WOODH), G = P(GOLD), r = RNG(seed);
    for (const lx of [8, w - 6]) for (let yy = b - 34; yy < b; yy++) { K.put(s, lx, yy, Wd[5]); K.put(s, lx + 1, yy, Wd[3]); K.put(s, lx + 2, yy, Wd[1]); }
    I.box3q(s, 2, b - 30, w, h, 6, { ramp: WOODH, front: (xx, yy, u, v) => { const lx = xx - 2, ly = yy - (b - 30 - h); if (lx < 2 || lx > w - 3 || ly < 2 || ly > h - 3) return G[(lx < 2 || ly < 2) ? 6 : 3]; if (ly < 12) return U(ly === 11 ? mixHex(col, '#000000', 0.3) : col); return U(ly > h - 6 ? '#e8dcc8' : '#fff4de'); }, top: (xx, yy, u, v) => G[clamp(6 - Math.round(v * 2), 0, 8)], side: (xx, yy) => Wd[2] });
    const top = b - 30 - h;
    K.ellipseFn(s, 16, top + 30, 9, 9, (nx, ny, d) => U(d > 0.7 ? mixHex(col, '#000000', 0.25) : mixHex(col, '#ffffff', 0.45 - ny * 0.2)));
    for (let j = 0; j < 5; j++) for (let xx = 30; xx < w - 6 - (j % 2) * 8 - r.int(0, 6); xx++) K.put(s, xx, top + 18 + j * 7, U(j === 0 ? '#5a3826' : '#c8a46a'));
    K.text(s, String(2010 + seed * 5), 6, top + 4, U('#ffffff'), { font: 'tiny' });
    // flexo dorado encima
    for (let k = 0; k < 6; k++) K.put(s, Math.round(w / 2) + k, top - 4 + Math.round(k * 0.4), G[5]);
    B.rect(s, Math.round(w / 2) + 4, top - 3, 6, 2, U('#fff4c8'));
    fin(s); B.stamp(pb, s, x - 2, yb - b);
    B.contact(pb, x + w / 2, yb, w / 2 + 4, 2);
    return { lamp: [x + Math.round(w / 2) + 5, yb - b + top - 1] };
  }
  /** Maceta de cerámica pintada (≈28 px) con agave o nopal */
  function pot(pb, x, yb, k = 0) {
    const s = B.sprite(34, 32), b = 30, base = ['#c06a30', '#d4843e', '#a85024'][k % 3], C = P([mixHex(base, '#000000', 0.55), mixHex(base, '#000000', 0.35), mixHex(base, '#000000', 0.15), base, mixHex(base, '#ffffff', 0.2), mixHex(base, '#ffffff', 0.45)]);
    for (let yy = 0; yy < 24; yy++) { const t = yy / 23, hw = Math.round(lerp(12, 9, t) + Math.sin(t * Math.PI) * 1.5); for (let xx = -hw; xx <= hw; xx++) { const f = (xx + hw) / (2 * hw); let kk = Math.round(4 - f * 3 + (f < 0.12 ? -1 : 0)); if (yy === 8 || yy === 9) kk = f < 0.5 ? 5 : 2; K.put(s, 17 + xx, b - 24 + yy, (yy > 12 && yy < 16 && ((xx + 30) % 6) < 2) ? U(MOS[(Math.floor((xx + 30) / 6) + k) % 6]) : C[clamp(kk, 0, 5)]); } }
    for (let xx = 4; xx < 31; xx++) { K.put(s, xx, b - 25, C[5]); K.put(s, xx, b - 24, C[3]); }
    fin(s); B.stamp(pb, s, x - 17, yb - b);
    if (k % 2) PFFlora.agave(pb, x, yb - 25, 13, x); else PFAgro.put(pb, 'nopal', x, yb - 24, 0.7, 0, x);
    B.contact(pb, x, yb, 13, 2);
  }
  /** Silla alta del consejo (respaldo tallado con medallón de color) */
  function chair(pb, x, yb, col, h = 76) {
    const s = B.sprite(28, h + 4), b = h + 2, Wd = P(WOODH), R = P(['#2a0a0a', '#4a1414', '#6e2020', '#8a3a2a', '#a8503a', '#c06a50']), G = P(GOLD);
    for (let yy = b - h; yy < b; yy++) for (let xx = 2; xx < 24; xx++) { const ly = yy - (b - h), lx = xx - 2; let u; if (lx < 3 || lx > 18 || ly < 4) u = Wd[(lx < 2) ? 6 : (lx > 19) ? 1 : ly < 2 ? 7 : 4]; else if (ly < h - 36) u = R[clamp(4 - Math.round(ly / h * 3) + ((lx + ly) % 7 === 0 ? 1 : 0), 0, 5)]; else u = Wd[3]; K.put(s, xx, yy, u); }
    for (let xx = 0; xx < 26; xx++) { K.put(s, xx, b - h, G[7]); K.put(s, xx, b - h + 1, G[4]); }
    K.ellipseFn(s, 13, b - h + 16, 4, 4, (nx, ny, d) => U(d > 0.6 ? '#e0a83a' : col));
    B.rect(s, 10, b - h - 4, 6, 4, G[6]);
    fin(s); B.stamp(pb, s, x - 13, yb - b);
  }
  /** Gran mesa del consejo en 3/4: encimera a 36 px, frente de mosaico, papeles, micrófonos y jarras de agua */
  function councilTable(pb, x, yb, w, o = {}) {
    const h = o.h ?? 36, d = 18, Wd = P(WOODH), G = P(GOLD), out = { mics: [], cups: [] };
    // sillas detrás (respaldos sobresalen por encima de la mesa)
    for (let k = 0; k < (o.chairs || 9); k++) chair(pb, x + 30 + k * Math.round((w - 60) / ((o.chairs || 9) - 1)), yb - 10, MOS[k % 6], 74);
    I.box3q(pb, x, yb, w, h, d, {
      ramp: WOODH,
      front: (xx, yy, u, v) => { const lx = xx - x, ly = yy - (yb - h); if (ly < 3) return G[ly === 0 ? 7 : ly === 1 ? 5 : 2]; if (lx < 4 || lx > w - 5) return Wd[lx < 2 ? 6 : 2]; if (ly > h - 4) return Wd[1]; const cx = Math.floor(lx / 6), cy = Math.floor((ly - 3) / 5); if ((lx % 6 === 0) || ((ly - 3) % 5 === 0)) return U('#0a1440'); const c = MOS[(cx * 7 + cy * 3) % 6]; return U(v > 0.8 ? mixHex(c, '#000000', 0.25) : c); },
      top: (xx, yy, u, v) => { let k = 5 - Math.round(v * 2) + (((xx - x) % 23) === 0 ? -1 : 0) + Math.round((K.vn(xx * 0.1, yy * 0.5, 5) - 0.5) * 0.8); return Wd[clamp(k, 1, 7)]; },
      side: (xx, yy) => Wd[2], ink: '#140a06',
    });
    const ty = yb - h - 1, dx = Math.round(d * 0.45);
    // papeles, micrófonos, jarras y vasos, placas con nombre
    const r = RNG(o.seed || 9);
    for (let k = 0; k < (o.chairs || 9); k++) {
      const px = x + 22 + k * Math.round((w - 60) / ((o.chairs || 9) - 1)), py = ty - 6;
      for (let yy = 0; yy < 4; yy++) for (let xx = 0; xx < 9; xx++) K.put(pb, px + xx + Math.round(yy * 0.45), py + 4 - yy, U(yy === 3 ? '#fff4de' : '#f0e4cc'));
      for (let j = 0; j < 3; j++) K.put(pb, px + 2 + j * 2, py + 2, U('#8a7a66'));
      if (k % 2 === 0) { const mx = px + 13; for (let yy = 0; yy < 8; yy++) K.put(pb, mx + Math.round(yy * 0.3), py + 2 - yy, U('#2a2a30')); K.put(pb, mx + 2, py - 7, U('#5a5a64')); K.put(pb, mx + 3, py - 7, U('#5a5a64')); out.mics.push([mx + 3, py - 8]); }
      else { const cx = px + 13; for (let yy = 0; yy < 7; yy++) for (let xx = -1; xx <= 1; xx++) K.put(pb, cx + xx, py + 2 - yy, U(yy > 4 ? '#c8ecff' : xx < 0 ? '#e8f8ff' : '#7ab8e8')); K.put(pb, cx, py - 5, U('#ffffff')); out.cups.push([cx, py - 2]); }
      B.rect(pb, px + 1, ty - 1, 10, 3, U('#2a1a10')); K.put(pb, px + 3, ty, U('#ffe08a')); K.put(pb, px + 6, ty, U('#ffe08a'));
    }
    B.castR(pb, x, x + w + dx, yb - 1, 8, { amt: -0.2, yMin: yb - 12 });
    return out;
  }
  /** Muro de evidencias: corcho en bastidor de madera con fotos, notas, mapa e hilos rojos */
  function corkboard(pb, x, yb, w = 118, h = 84) {
    const s = B.sprite(w + 14, h + 40), b = h + 36, Wd = P(WOODH), r = RNG(77);
    for (const lx of [10, w - 6]) for (let yy = b - 36; yy < b; yy++) { K.put(s, lx, yy, Wd[5]); K.put(s, lx + 1, yy, Wd[3]); K.put(s, lx + 2, yy, Wd[1]); }
    const top = b - 32 - h;
    I.box3q(s, 2, b - 32, w, h, 5, { ramp: WOODH, front: (xx, yy, u, v) => { const lx = xx - 2, ly = yy - top; if (lx < 4 || lx > w - 5 || ly < 4 || ly > h - 5) return Wd[(lx < 2 || ly < 2) ? 6 : lx > w - 3 || ly > h - 3 ? 1 : 4]; const g = hash2(xx, yy, 5); return U(g < 0.2 ? '#a87440' : g > 0.85 ? '#d8a868' : '#c08a52'); }, top: (xx, yy, u, v) => Wd[6], side: (xx, yy) => Wd[2] });
    // fotos, notas y mapa
    const items = [];
    for (let k = 0; k < 9; k++) { const ix = 10 + (k % 4) * Math.round((w - 20) / 4) + r.int(-3, 3), iy = top + 10 + Math.floor(k / 4) * 24 + r.int(-2, 3), iw = r.int(14, 20), ih = r.int(10, 14); items.push([ix + iw / 2, iy + 1]); B.rect(s, ix, iy, iw, ih, U(k % 3 === 2 ? '#fff6a0' : '#fffaf0')); if (k % 3 !== 2) B.rect(s, ix + 1, iy + 1, iw - 2, ih - 4, U(mixHex(MOS[k % 6], '#3a2a5a', 0.35))); else for (let j = 0; j < 3; j++) B.rect(s, ix + 2, iy + 3 + j * 3, iw - 5 - j * 2, 1, U('#8a7a66')); K.put(s, Math.round(ix + iw / 2), iy, U('#ff4e5d')); }
    for (let i = 0; i < items.length - 1; i += 1 + (i % 2)) { const [ax, ay] = items[i], [bx, by] = items[i + 1 + (i % 3 === 0 ? 2 : 0)] || items[i + 1]; K.lineFn(s, ax, ay, bx, by, () => U('#d82a2a')); }
    fin(s); B.stamp(pb, s, x - 2, yb - b);
    B.contact(pb, x + w / 2, yb, w / 2 + 4, 2);
  }
  /** Pedestal holográfico: zócalo octogonal en 3/4 con anillo emisor y rejilla; devuelve {cx, top} (base del haz) */
  function holoPedestal(pb, cx, yb, rx = 56) {
    const R = P(ROYAL), G = P(GOLD), h = 18, ry = 9, out = {};
    // cuerpo (cilindro ancho) y tapa elíptica
    for (let yy = yb - h; yy <= yb; yy++) for (let xx = cx - rx; xx <= cx + rx; xx++) { const nx = (xx - cx) / rx; if (Math.abs(nx) > 1) continue; const nz = Math.sqrt(1 - nx * nx), e = Math.round(ry * nz), lit = 0.3 + Math.max(0, -nx * 0.5 + nz * 0.5) * 0.7, ly = yy - (yb - h); let k = Math.round(lit * 6) - (ly > h - 3 ? 2 : 0); if (ly === 3 || ly === 4) k = 7; if (ly > 8 && ly < 14 && ((xx - cx + 200) % 8) < 4) k -= 2; K.put(pb, xx, yy + e, R[clamp(k, 0, 8)]); }
    K.ellipseFn(pb, cx, yb - h, rx + 0.5, ry + 0.5, (nx, ny, d) => d > 0.86 ? G[ny < 0 ? 7 : 4] : d > 0.7 ? U('#56e5ff') : d < 0.3 ? U(((Math.round(nx * 8) + Math.round(ny * 4)) & 1) ? '#bff4ff' : '#56e5ff') : R[clamp(Math.round(3 - ny * 2), 0, 8)]);
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, ex = Math.round(cx + Math.cos(a) * rx * 0.55), ey = Math.round(yb - h + Math.sin(a) * ry * 0.55); K.put(pb, ex, ey, U('#ffffff')); K.put(pb, ex + 1, ey, U('#bff4ff')); }
    B.plaque(pb, cx, yb - 8, 'GEMELO DIGITAL', { center: true, bg: '#06203a', border: '#56e5ff', col: '#f4fbff', h: 9, screws: false });
    B.contact(pb, cx, yb + ry, rx + 4, 2.5, -0.3);
    out.cx = cx; out.top = yb - h;
    return out;
  }
  /** Entreplanta del observatorio: columnas doradas bajo el forjado, muro de pantallas enmarcadas y pupitre.
      Devuelve {screens:[[x,y,w,h]], lamps} */
  function observatory(pb, x0, x1, floorY, yb) {
    const R = P(ROYAL), G = P(GOLD), out = { screens: [], lamps: [] }, w = x1 - x0;
    // columnas bajo la entreplanta
    for (const px of [x0 + 10, x0 + Math.round(w / 2) - 4, x1 - 18]) { for (let yy = floorY + 12; yy < yb; yy++) for (let k = 0; k < 9; k++) K.put(pb, px + k, yy, G[[7, 6, 5, 5, 4, 3, 3, 2, 1][k] - ((k % 3 === 1 && yy % 2) ? 1 : 0)]); B.rect(pb, px - 2, yb - 4, 13, 4, (xx, yy) => G[yy === yb - 4 ? 7 : 3]); B.rect(pb, px - 2, floorY + 10, 13, 3, G[6]); }
    // muro trasero de la entreplanta (azul real con moldura)
    I.box3q(pb, x0, floorY - 14, w, 84, 0, { ramp: ROYAL, front: (xx, yy, u, v) => { const ly = yy - (floorY - 98); let k = 3 - Math.round(v) + (((xx - x0) % 38) === 0 ? -1 : 0); if (ly < 3) return G[6]; return R[clamp(k, 0, 8)]; }, edges: false });
    for (let k = 0; k < 3; k++) {
      const sx = x0 + 14 + k * Math.round((w - 28) / 3), sw = Math.round((w - 28) / 3) - 10, sy = floorY - 82, sh = 40;
      B.rect(pb, sx - 3, sy - 3, sw + 6, sh + 6, (xx, yy) => G[yy < sy - 1 ? 7 : xx > sx + sw + 1 ? 2 : 5]); B.rect(pb, sx, sy, sw, sh, U('#05081d'));
      out.screens.push([sx + 2, sy + 2, sw - 4, sh - 4]);
    }
    // pupitre de lectura con lámpara
    I.box3q(pb, x0 + 70, floorY - 12, 40, 26, 8, { ramp: WOODH });
    B.rect(pb, x0 + 98, floorY - 52, 2, 16, G[4]); B.rect(pb, x0 + 94, floorY - 54, 9, 3, G[7]);
    out.lamps.push([x0 + 98, floorY - 50]);
    // suelo interior de la entreplanta (parquet) entre muro y canto
    for (let yy = floorY - 14; yy < floorY; yy++) for (let xx = x0; xx < x1; xx++) { const t = (floorY - yy) / 14; K.put(pb, xx, yy, P(WOODH)[clamp(Math.round(5 - t * 2 + ((((xx + yy * 3) >> 3) & 1) ? -0.6 : 0)), 1, 7)]); }
    return out;
  }
  /** Balaustrada de piedra con pasamanos dorado */
  function balustrade(pb, x0, x1, yb, h = 30) {
    const M = P(MARB), G = P(GOLD);
    for (let x = x0; x < x1; x++) { for (let k = 0; k < 4; k++) K.put(pb, x, yb - h + k, k === 0 ? G[7] : k === 1 ? G[5] : M[6 - k]); for (let k = 0; k < 4; k++) K.put(pb, x, yb - 4 + k, M[k === 0 ? 7 : 4 - k]); }
    for (let x = x0 + 3; x < x1 - 3; x += 8) for (let yy = yb - h + 4; yy < yb - 4; yy++) { const t = (yy - (yb - h + 4)) / (h - 8), hw = Math.round(1.5 + Math.sin(t * Math.PI) * 1.6); for (let k = -hw; k <= hw; k++) K.put(pb, x + k, yy, M[clamp(6 - (k + hw) - (k > 0 ? 1 : 0), 0, 8)]); }
    B.castR(pb, x0, x1, yb - 1, 6, { amt: -0.16, yMin: yb - 8 });
  }
  /** Puerta monumental de doble hoja (≥ 100 px) con marco dorado y tímpano */
  function grandDoor(pb, cx, yb, w = 56, h = 104, title) {
    const G = P(GOLD), Wd = P(WOODH), x = Math.round(cx - w / 2);
    B.rect(pb, x - 10, yb - h - 18, w + 20, h + 18, (xx, yy) => G[(xx < x - 7) ? 7 : (xx >= x + w + 7) ? 2 : (yy < yb - h - 15) ? 8 : 4]);
    K.ellipseFn(pb, cx, yb - h - 2, w / 2 + 4, 16, (nx, ny) => ny > 0 ? 0 : G[clamp(Math.round(5 - nx * 2 - ny), 0, 8)]);
    K.ellipseFn(pb, cx, yb - h - 2, w / 2 - 2, 12, (nx, ny) => ny > 0 ? 0 : U(((Math.round(nx * 6) + 7) % 2) ? '#56e5ff' : '#1c3596'));
    B.rect(pb, x, yb - h, w, h, (xx, yy) => { const lx = xx - x, ly = yy - (yb - h), half = lx >= w / 2; const px = half ? lx - w / 2 : lx; if (px < 2 || px > w / 2 - 3) return Wd[px < 2 ? 6 : 1]; if ((ly % 26) < 2) return Wd[2]; if ((px === 5 || px === w / 2 - 6) && (ly % 26) > 4) return Wd[6]; return Wd[clamp(4 - Math.round(ly / h) + (((px + ly) % 9) === 0 ? -1 : 0), 0, 7)]; });
    for (const hx of [cx - 4, cx + 3]) { B.rect(pb, hx, yb - Math.round(h * 0.5), 2, 6, G[7]); }
    if (title) B.plaque(pb, cx, yb - h - 34, title, { center: true, font: 'main', bold: true, bg: '#0e1f5a', border: '#ffe08a', col: '#fff4c8', h: 13 });
  }
  /** Lámpara colgante dorada (cadena desde arriba); devuelve la posición de la luz */
  function chandelier(pb, x, yTop, y) {
    const G = P(GOLD);
    for (let yy = yTop; yy < y; yy++) K.put(pb, x, yy, G[(yy % 3) ? 4 : 6]);
    K.ellipseFn(pb, x, y + 4, 9, 4, (nx, ny) => G[clamp(Math.round(5 - ny * 2 - nx), 0, 8)]);
    for (const dx of [-8, -3, 3, 8]) { K.put(pb, x + dx, y + 1, U('#fff4c8')); K.put(pb, x + dx, y, U('#ffe08a')); }
    K.ellipseFn(pb, x, y + 8, 3, 2, () => G[3]);
    return [x, y + 2];
  }
  return { banner, historyPanel, pot, chair, councilTable, corkboard, holoPedestal, observatory, balustrade, grandDoor, chandelier, GOLD, ROYAL, WOODH, MARB, MOS };
})();
