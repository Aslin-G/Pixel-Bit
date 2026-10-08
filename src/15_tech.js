/* =====================================================================
   15_tech.js — Accesorios de infraestructura, festival y agroecología.
   Pixel art estático (PixelBuffer) + piezas animadas (ctx) que explican
   el funcionamiento de cada sistema: OI, baterías, electrolizador, H2,
   cultivos, goteo, festival de la plaza.
   ===================================================================== */

/* ---------- Festival ---------- */
/** Guirnalda de banderines sobre una cuerda que cuelga entre dos puntos */
ART.bunting = function (pb, x0, y0, x1, y1, sag, cols, seed = 1) {
  const n = Math.max(2, Math.round(Math.abs(x1 - x0)));
  const pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag]); }
  for (let i = 0; i < pts.length - 1; i++) pb.set(Math.round(pts[i][0]), Math.round(pts[i][1]), '#5a3826');
  let k = 0;
  for (let i = 4; i < pts.length - 4; i += 9) {
    const [px, py] = pts[i], c = cols[(k + seed) % cols.length]; k++;
    for (let r = 0; r < 7; r++) { const hw = Math.round((7 - r) * 0.5); pb.hline(Math.round(px) - hw, Math.round(px) + hw, Math.round(py) + 1 + r, r < 2 ? shade(c, 0.2) : c); }
    pb.set(Math.round(px) + 1, Math.round(py) + 3, shade(c, -0.25)); pb.set(Math.round(px), Math.round(py) + 6, shade(c, -0.3));
  }
  return pts;
};
/** Puesto del festival con toldo festoneado */
ART.stall = function (pb, x, y, w, opts = {}) {
  const c1 = opts.c1 || '#ff6b6b', c2 = opts.c2 || '#fffaf0', h = opts.h || 40;
  // postes
  pb.rect(x + 2, y - h, 3, h, '#7a5236'); pb.rect(x + w - 5, y - h, 3, h, '#5a3826');
  // mostrador
  pb.rect(x, y - 16, w, 16, '#b07a50'); pb.rect(x, y - 16, w, 2, '#d8a070'); pb.rect(x, y - 3, w, 3, '#6e452e');
  for (let k = 6; k < w - 4; k += 10) pb.vline(x + k, y - 13, y - 4, '#8a5a3c');
  // toldo a rayas con festón
  for (let i = -3; i < w + 3; i++) {
    const stripe = Math.floor((i + 3) / 6) % 2 ? c1 : c2;
    for (let j = 0; j < 9; j++) pb.set(x + i, y - h - 9 + j, j < 2 ? shade(stripe, 0.15) : stripe);
    const sc = ((i + 3) % 6);
    const dip = sc < 1 || sc > 4 ? 1 : 3;
    for (let j = 0; j < dip; j++) pb.set(x + i, y - h + j, shade(stripe, -0.15));
  }
  pb.hline(x - 3, x + w + 2, y - h - 10, shade(c1, -0.35));
  // mercancía
  const r = RNG(opts.seed || x);
  const goods = opts.goods || 'fruit';
  for (let k = 4; k < w - 6; k += 7) {
    const gx = x + k, gy = y - 18;
    if (goods === 'fruit') { const c = r.pick(['#ff9f43', '#ffe14d', '#86e36f', '#ff4e5d', '#f78acb']); pb.disc(gx + 2, gy - 1, 2, c); pb.set(gx + 1, gy - 2, '#fffaf0'); }
    else if (goods === 'juice') { pb.rect(gx, gy - 7, 4, 7, '#cfe8ee'); pb.rect(gx + 1, gy - 5, 2, 5, r.pick(['#ff9f43', '#ff6b6b', '#86e36f', '#ffe14d'])); pb.set(gx + 2, gy - 9, '#ff4e5d'); }
    else if (goods === 'arepas') { pb.ellipse(gx + 2, gy - 1, 3, 1, '#f2d48a'); pb.hline(gx, gx + 4, gy - 2, '#ffe9b0'); pb.set(gx + 2, gy - 1, '#c9862e'); }
    else if (goods === 'crafts') { const c = r.pick(['#8d6bff', '#20d6c7', '#ff6b6b', '#ffe14d']); pb.rect(gx, gy - 6, 5, 6, c); pb.hline(gx, gx + 4, gy - 4, '#fffaf0'); pb.set(gx + 2, gy - 2, shade(c, -0.3)); }
    else if (goods === 'seeds') { pb.rect(gx, gy - 4, 5, 4, '#c9a46a'); pb.hline(gx, gx + 4, gy - 4, r.pick(['#ffe14d', '#ff4e5d', '#2a1a2a', '#fffaf0', '#c97c38'])); }
  }
  if (opts.sign) drawSign(pb, x + w / 2, y - h - 10, opts.sign, opts.signCol || '#8a5a3c');
};
/** Caja/cajón de madera */
ART.crate = function (pb, x, y, w, h, col = '#b07a50') {
  pb.rect(x, y - h, w, h, col); pb.rect(x, y - h, w, 1, shade(col, 0.3)); pb.rect(x + w - 2, y - h, 2, h, shade(col, -0.25));
  pb.line(x + 1, y - h + 1, x + w - 2, y - 2, shade(col, -0.3)); pb.rect(x, y - 1, w, 1, shade(col, -0.45));
};
/** Fuente de la plaza (agua animada aparte) */
ART.fountain = function (pb, x, y, w) {
  pb.rect(x, y - 10, w, 10, '#d9c3a0'); pb.rect(x, y - 10, w, 2, '#f2e2c4'); pb.rect(x, y - 2, w, 2, '#9a7a5a');
  for (let k = 4; k < w; k += 8) pb.vline(x + k, y - 8, y - 3, '#b89a78');
  pb.rect(x + 2, y - 12, w - 4, 2, '#20d6c7'); pb.hline(x + 3, x + w - 4, y - 12, '#a6f4ff');
  const cx = x + w / 2;
  pb.rect(cx - 3, y - 30, 6, 18, '#d9c3a0'); pb.rect(cx - 3, y - 30, 2, 18, '#f2e2c4');
  pb.ellipse(cx, y - 30, 12, 3, '#c8b088'); pb.hline(cx - 11, cx + 11, y - 32, '#f2e2c4'); pb.ellipse(cx, y - 31, 10, 1, '#20d6c7');
  // mosaico en la base
  for (let k = 3; k < w - 3; k += 4) pb.set(x + k, y - 6, ['#20d6c7', '#ff6b6b', '#ffe14d', '#8d6bff'][(k >> 2) % 4]);
};
/** Mural geométrico (patrones tejidos) */
ART.mural = function (pb, x, y, w, h, seed = 3) {
  const cols = ['#20d6c7', '#ff6b6b', '#ffe14d', '#8d6bff', '#ff9f43', '#4ccb70', '#fffaf0'];
  const r = RNG(seed);
  pb.rect(x, y - h, w, h, '#f2e2c4');
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    const cx = (xx % 16) - 8, cy = (yy % 16) - 8;
    const d = Math.abs(cx) + Math.abs(cy);
    const band = Math.floor(yy / 16) + Math.floor(xx / 16);
    if (d === 7 || d === 3) pb.set(x + xx, y - h + yy, cols[(band + seed) % 6]);
    else if (d < 2) pb.set(x + xx, y - h + yy, cols[(band + seed + 2) % 6]);
    else if ((xx + yy) % 8 === 0 && d > 7) pb.set(x + xx, y - h + yy, '#e2cca4');
  }
  pb.rect(x, y - h, w, 1, '#fffaf0'); pb.rect(x, y - 1, w, 1, '#b89a78');
  void r;
};
/** Pérgola con techo fotovoltaico y bancas */
ART.pergolaPV = function (pb, x, y, w, h = 40) {
  for (const px of [x + 2, x + w - 5]) { pb.rect(px, y - h, 3, h, '#e8f0f4'); pb.rect(px + 2, y - h, 1, h, '#a9bbd6'); }
  ART.pvRow(pb, x - 4, y - h, w + 2, x, { tilt: 6, depth: 7 });
  pb.rect(x + 8, y - 9, w - 16, 3, '#b07a50'); pb.rect(x + 10, y - 6, 2, 6, '#6e452e'); pb.rect(x + w - 12, y - 6, 2, 6, '#6e452e');
};

/* ---------- Infraestructura de agua ---------- */
/** Bastidor de tubos de presión de OI (vista lateral) */
ART.roRack = function (pb, x, y, rows, n, opts = {}) {
  const tubeW = opts.tubeW || 56, tubeH = 7, gap = 3;
  const h = rows * (tubeH + gap) + 8;
  // bastidor
  pb.rect(x, y - h, 3, h, '#477a94'); pb.rect(x + tubeW + 9, y - h, 3, h, '#345a78');
  pb.rect(x, y - h, tubeW + 12, 2, '#6aa0b4'); pb.rect(x, y - 3, tubeW + 12, 3, '#263442');
  for (let r = 0; r < rows; r++) {
    const ty = y - 6 - (r + 1) * (tubeH + gap);
    for (let j = 0; j < tubeH; j++) {
      const t = j / (tubeH - 1);
      const c = t < 0.2 ? '#ffffff' : t < 0.5 ? '#eef6fa' : t < 0.8 ? '#c8d8e8' : '#8396ba';
      pb.hline(x + 6, x + 5 + tubeW, ty + j, c);
    }
    // tapas azules y bandas
    pb.rect(x + 3, ty - 1, 4, tubeH + 2, '#1f469e'); pb.vline(x + 3, ty, ty + tubeH - 1, '#4a7ad8');
    pb.rect(x + tubeW + 5, ty - 1, 4, tubeH + 2, '#1f469e'); pb.vline(x + tubeW + 8, ty, ty + tubeH - 1, '#102a63');
    for (let k = 14; k < tubeW; k += 14) pb.vline(x + 5 + k, ty, ty + tubeH - 1, '#a9bbd6');
    if (n) pb.set(x + 10, ty + 2, '#56e5ff');
  }
  // colectores: permeado (azul claro) y concentrado (violeta)
  pb.rect(x - 4, y - h + 4, 3, h - 8, '#1491aa'); pb.vline(x - 4, y - h + 4, y - 5, '#a6f4ff');
  pb.rect(x + tubeW + 13, y - h + 4, 3, h - 8, '#8e2a80'); pb.vline(x + tubeW + 13, y - h + 4, y - 5, '#f888b8');
  return { w: tubeW + 16, h };
};
/** Bomba de alta presión con motor y recuperador de energía (ERD) */
ART.hpPump = function (pb, x, y) {
  pb.rect(x, y - 4, 46, 4, '#263442');
  // motor
  pb.rect(x + 2, y - 18, 20, 14, '#1f854c'); pb.rect(x + 2, y - 18, 20, 2, '#4ccb70'); for (let k = 4; k < 20; k += 3) pb.vline(x + 2 + k, y - 15, y - 6, '#165e36');
  pb.rect(x + 22, y - 14, 4, 6, '#98c6d2');
  // bomba
  pb.ellipse(x + 32, y - 11, 7, 7, '#345a78'); pb.ellipse(x + 31, y - 12, 5, 5, '#6aa0b4'); pb.set(x + 29, y - 15, '#cfe8ee');
  pb.rect(x + 38, y - 20, 4, 10, '#477a94');
  // ERD
  pb.rect(x + 30, y - 32, 16, 8, '#c8d8e8'); pb.rect(x + 30, y - 32, 16, 2, '#ffffff'); pb.rect(x + 44, y - 32, 2, 8, '#8396ba');
  pb.rect(x + 33, y - 30, 6, 3, '#102a43'); pb.hline(x + 34, x + 37, y - 29, '#86e36f');
};

/* ---------- Energía ---------- */
/** Contenedor de baterías (BESS) con rejillas y franja de estado */
ART.batteryContainer = function (pb, x, y, w, h, opts = {}) {
  const col = opts.col || '#2c63c0';
  pb.rect(x, y - h, w, h, col); pb.rect(x, y - h, w, 2, shade(col, 0.35)); pb.rect(x + w - 4, y - h, 4, h, shade(col, -0.3));
  for (let k = 3; k < w - 4; k += 4) pb.vline(x + k, y - h + 3, y - 2, shade(col, -0.12));
  pb.rect(x, y - 2, w, 2, shade(col, -0.5));
  // rejillas de ventilación
  for (let k = 0; k < Math.floor((w - 12) / 16); k++) { const vx = x + 6 + k * 16; pb.rect(vx, y - h + 6, 10, 8, '#102a43'); for (let j = 0; j < 4; j++) pb.hline(vx, vx + 9, y - h + 7 + j * 2, shade(col, -0.2)); }
  // etiqueta de seguridad
  pb.rect(x + w - 16, y - h + 18, 9, 8, '#ffe14d'); pb.set(x + w - 12, y - h + 20, '#140d26'); pb.vline(x + w - 12, y - h + 21, y - h + 23, '#140d26');
  // puerta
  pb.rect(x + 4, y - h + 18, 12, h - 20, shade(col, -0.18)); pb.vline(x + 10, y - h + 18, y - 3, shade(col, -0.4)); pb.set(x + 13, y - h / 2, '#cfe8ee');
};
/** Electrolizador: pila de celdas con placas terminales, tirantes y separadores de gas */
ART.electrolyzer = function (pb, x, y, w, h) {
  const sw = Math.round(w * 0.55);
  // bancada
  pb.rect(x, y - 4, w, 4, '#263442'); pb.hline(x, x + w - 1, y - 4, '#477a94');
  // pila de celdas
  const sy = y - 4, sh = Math.round(h * 0.5);
  pb.rect(x + 2, sy - sh, 5, sh, '#345a78'); pb.rect(x + sw - 3, sy - sh, 5, sh, '#345a78');
  for (let k = 7; k < sw - 3; k++) {
    const c = k % 3 === 0 ? '#1d2a48' : k % 3 === 1 ? '#56e5ff' : '#c8d8e8';
    pb.vline(x + k, sy - sh + 3, sy - 3, c);
  }
  pb.hline(x + 2, x + sw + 1, sy - sh + 2, '#98c6d2'); pb.hline(x + 2, x + sw + 1, sy - 2, '#98c6d2');
  pb.hline(x + 2, x + sw + 1, sy - sh, '#cfe8ee');
  // separadores: H2 (cian) y O2 (blanco-azulado)
  const gx = x + sw + 6;
  const tank = (tx, hh, band) => { ART.tank(pb, tx, sy, 12, hh, RAMP.steelW, { band }); };
  tank(gx, Math.round(h * 0.85), '#22a2b2');
  tank(gx + 16, Math.round(h * 0.7), '#a9bbd6');
  pb.rect(gx + 2, sy - Math.round(h * 0.85) + 8, 8, 5, '#102a43'); pb.hline(gx + 3, gx + 8, sy - Math.round(h * 0.85) + 10, '#d8fff8');
  // tuberías superiores
  pb.rect(x + 8, sy - sh - 6, gx - x - 2, 2, '#40d0d4'); pb.rect(gx + 5, sy - Math.round(h * 0.85) - 4, 2, 4, '#40d0d4');
  pb.rect(x + 12, sy - sh - 10, gx - x + 12, 2, '#cfe8ee');
  // gabinete de potencia (rectificador)
  pb.rect(x + 4, sy - sh - 24, 18, 14, '#eab02a'); pb.rect(x + 4, sy - sh - 24, 18, 2, '#ffe14d'); pb.rect(x + 7, sy - sh - 20, 12, 4, '#140d26'); pb.hline(x + 8, x + 16, sy - sh - 18, '#fff09a');
};
/** Tanque horizontal de hidrógeno (cápsula) */
ART.h2tank = function (pb, x, y, len, r) {
  for (let j = -r; j <= r; j++) {
    const t = (j + r) / (2 * r);
    const c = t < 0.15 ? '#ffffff' : t < 0.45 ? '#eef6fa' : t < 0.75 ? '#c8d8e8' : t < 0.92 ? '#a9bbd6' : '#8396ba';
    const cap = Math.round(Math.sqrt(Math.max(0, 1 - (j / r) ** 2)) * r * 0.7);
    pb.hline(x - cap, x + len + cap, y - r + j + r, c);
  }
  pb.rect(x + len * 0.3, y, 8, 2 * r + 1, '#22a2b2'); pb.vline(x + len * 0.3, y, y + 2 * r, '#40d0d4');
  pb.rect(x + len * 0.55, y + r - 3, 14, 6, '#102a43');
  const tx = Math.round(x + len * 0.55 + 2), ty = y + r - 2;
  // "H2" diminuto
  for (const [dx, dy] of [[0, 0], [0, 1], [0, 2], [0, 3], [2, 0], [2, 1], [2, 2], [2, 3], [1, 2], [4, 0], [5, 0], [6, 1], [5, 2], [4, 3], [5, 3], [6, 3]]) pb.set(tx + dx, ty + dy, '#d8fff8');
  // patas
  pb.rect(x + 4, y + 2 * r, 3, 6, '#345a78'); pb.rect(x + len - 6, y + 2 * r, 3, 6, '#345a78');
  // válvula de alivio (abstracta)
  pb.rect(x + len - 2, y - 4, 2, 5, '#ff6b6b');
};
/** Poste de línea eléctrica con aisladores */
ART.pole = function (pb, x, y, h = 60) {
  pb.rect(x - 1, y - h, 3, h, '#7a5236'); pb.vline(x - 1, y - h, y, '#9a6e4a');
  pb.rect(x - 9, y - h + 4, 19, 2, '#5a3826');
  for (const k of [-8, 0, 8]) { pb.rect(x + k, y - h + 1, 2, 3, '#cfe8ee'); }
};
ART.cable = function (pb, x0, y0, x1, y1, sag, col = '#263442') {
  const n = Math.max(2, Math.abs(x1 - x0));
  for (let i = 0; i <= n; i++) { const t = i / n; pb.set(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag), col); }
};

/* ---------- SYNARA ---------- */
/** Núcleo de SYNARA: torre blanca con cristal turquesa, anillos y antena */
ART.synaraCore = function (pb, x, y, h, opts = {}) {
  const w = opts.w || 64;
  const sealed = !!opts.sealed;
  // base escalonada
  pb.rect(x - 8, y - 10, w + 16, 10, '#d9c3a0'); pb.rect(x - 8, y - 10, w + 16, 2, '#f2e2c4');
  pb.rect(x - 4, y - 18, w + 8, 8, '#e8dcc0'); pb.rect(x - 4, y - 18, w + 8, 1, '#fffaf0');
  // fuste con bandas de vidrio
  for (let yy = y - h; yy < y - 18; yy++) {
    const t = (yy - (y - h)) / (h - 18);
    const inset = Math.round(Math.max(0, (1 - t)) * 10);
    for (let xx = x + inset; xx < x + w - inset; xx++) {
      const u = (xx - x - inset) / Math.max(1, w - 2 * inset);
      let c = u < 0.1 ? '#ffffff' : u < 0.55 ? '#f4f0e6' : u < 0.85 ? '#d8d0c0' : '#b8ac98';
      const band = (Math.floor((yy - (y - h)) / 14)) % 2 === 1 && u > 0.18 && u < 0.82;
      if (band) c = u < 0.4 ? '#7ff0dc' : u < 0.7 ? '#20d6c7' : '#138078';
      if (band && ((xx + yy) % 9 === 0)) c = '#c4fbff';
      pb.set(xx, yy, c);
    }
  }
  // puerta del núcleo
  const dx = x + w / 2 - 9;
  pb.rect(dx, y - 40, 18, 22, sealed ? '#3a1a2a' : '#0e5a5e'); pb.rect(dx, y - 40, 18, 2, '#fffaf0');
  if (sealed) for (let k = 0; k < 18; k += 3) pb.line(dx + k, y - 38, dx + k + 3, y - 19, '#ff4e5d');
  else { pb.rect(dx + 3, y - 36, 12, 14, '#20d6c7'); pb.vline(dx + 9, y - 36, y - 22, '#0e5a5e'); }
  // corona cristalina
  const cx = x + w / 2, cy = y - h - 4;
  pb.poly([[cx - 12, cy + 4], [cx, cy - 22], [cx + 12, cy + 4]], '#20d6c7');
  pb.poly([[cx - 12, cy + 4], [cx, cy - 22], [cx - 2, cy + 4]], '#7ff0dc');
  pb.line(cx, cy - 22, cx, cy + 3, '#c4fbff');
  pb.rect(cx - 16, cy + 4, 32, 3, '#e8dcc0'); pb.hline(cx - 16, cx + 15, cy + 4, '#fffaf0');
  pb.vline(cx, cy - 36, cy - 22, '#98c6d2'); pb.set(cx, cy - 37, '#ff4e5d');
};
/** Pantalla pública de la plaza */
ART.bigScreen = function (pb, x, y, w, h) {
  pb.rect(x + w / 2 - 2, y - 30, 4, 30, '#263442');
  pb.rect(x, y - 30 - h, w, h, '#1d2a48'); pb.rect(x + 2, y - 28 - h, w - 4, h - 4, '#0a1030');
  pb.rect(x, y - 30 - h, w, 1, '#6aa0b4');
};

/* ---------- Agroecología ---------- */
/** Planta de cultivo en distintos estadios (0..1) y estrés (0..1) */
ART.crop = function (pb, x, y, kind, stage = 1, seed = 1, stress = 0) {
  const r = RNG(seed);
  const L = stress > 0.6 ? ['#3a3010', '#6a5a1a', '#9a8a2a', '#c8b84a', '#e8d878'] : stress > 0.3 ? ['#1e3a14', '#3e6a1e', '#6a9a2a', '#9ac040', '#cce070'] : ['#0b2a18', '#14532e', '#1f854c', '#33a552', '#86e36f'];
  const s = clamp(stage, 0.15, 1);
  const leafBlade = (x0, y0, dir, len, droop) => {
    for (let i = 0; i < len; i++) {
      const t = i / len, xx = x0 + dir * i, yy = y0 - Math.round(Math.sin(t * 2.4) * 3) + Math.round(t * t * droop);
      pb.set(xx, yy, t < 0.15 ? L[2] : L[3]); pb.set(xx, yy + 1, L[1]); if (t > 0.2 && t < 0.7) pb.set(xx, yy - 1, L[4]);
    }
  };
  if (kind === 'maiz' || kind === 'sorgo') {
    const hgt = Math.round((kind === 'maiz' ? 46 : 38) * s);
    for (let yy = 0; yy < hgt; yy++) { pb.set(x, y - yy, L[2]); pb.set(x + 1, y - yy, L[1]); if (yy % 9 === 4) { pb.set(x, y - yy, L[0]); pb.set(x + 1, y - yy, L[0]); } }
    for (let k = 5, n = 0; k < hgt - 6; k += 6, n++) leafBlade(x + (n % 2 ? 2 : -1), y - k, n % 2 ? 1 : -1, 9 + r.int(0, 4), 5);
    if (s > 0.7) {
      if (kind === 'maiz') {
        const cy = y - Math.round(hgt * 0.5);
        pb.rect(x + 2, cy, 4, 9, '#f2d48a'); for (let k = 0; k < 9; k += 2) pb.hline(x + 2, x + 5, cy + k, '#e8b84a'); pb.vline(x + 2, cy - 1, cy + 9, L[3]); pb.set(x + 4, cy - 1, '#c9862e'); pb.set(x + 5, cy - 2, '#a86a1e');
        for (let i = -3; i <= 3; i++) { pb.set(x + i, y - hgt - 1 - Math.abs(i % 2), '#e8c070'); pb.set(x + i, y - hgt - 2 - (i === 0 ? 2 : 0), '#f6dc90'); }
      } else { for (let i = 0; i < 9; i++) pb.disc(x + ((i % 3) - 1) * 2, y - hgt - 2 - Math.floor(i / 3) * 2, 1, i % 2 ? '#a8402a' : '#d8642e'); }
    }
  } else if (kind === 'frijol') {
    const hgt = Math.round(30 * s);
    pb.vline(x + 3, y - hgt - 4, y, '#b07a50'); pb.vline(x + 4, y - hgt - 4, y, '#7a5236');
    for (let k = 0; k < hgt; k++) { const ox = Math.round(Math.sin(k * 0.45) * 3); pb.set(x + 3 + ox, y - k, L[2]); if (k % 5 === 2) { const d = ox >= 0 ? 1 : -1; pb.disc(x + 3 + ox + d * 3, y - k, 2, L[3]); pb.set(x + 3 + ox + d * 3, y - k - 1, L[4]); pb.set(x + 3 + ox + d * 4, y - k + 1, L[1]); } }
    if (s > 0.7) for (let k = 0; k < 4; k++) { pb.vline(x + 6, y - 6 - k * 7, y - 1 - k * 7, '#7a8a2a'); pb.vline(x + 7, y - 5 - k * 7, y - 2 - k * 7, '#9aaa3a'); pb.set(x, y - 10 - k * 7, '#f78acb'); pb.set(x + 1, y - 10 - k * 7, '#ffc4dc'); }
  } else if (kind === 'ahuyama') {
    const n = Math.round(4 * s) + 2;
    for (let i = 0; i < n; i++) { const lx = x + (i - n / 2) * 7, ly = y - 4 - (i % 2) * 3; pb.ellipse(lx, ly, 5, 4, L[2]); pb.ellipse(lx - 1, ly - 1, 3, 2, L[3]); pb.set(lx - 2, ly - 2, L[4]); pb.line(lx, ly + 3, lx, ly - 2, L[1]); }
    pb.hline(x - n * 4, x + n * 4, y - 1, L[1]);
    if (s > 0.55) { pb.ellipse(x + 3, y - 4, 6, 4, '#ff9f43'); pb.ellipse(x + 2, y - 5, 4, 2, '#ffc06a'); for (const dx of [-3, 0, 3]) pb.vline(x + 3 + dx, y - 7, y - 1, '#d8742a'); pb.set(x + 3, y - 9, '#5a8a2a'); pb.disc(x - 8, y - 9, 2, '#ffe14d'); }
  } else if (kind === 'tomate' || kind === 'aji') {
    const tom = kind === 'tomate', hgt = Math.round((tom ? 30 : 18) * s);
    if (tom) { pb.vline(x + 5, y - hgt - 4, y, '#c89a6a'); pb.vline(x + 6, y - hgt - 4, y, '#8a5a3c'); }
    for (let k = 0; k < hgt; k += 2) { const w = Math.round((tom ? 5 : 4) * Math.sin((k / hgt) * Math.PI) + 2); for (let i = -w; i <= w; i++) { const c = hash2(x + i, y - k, seed) < 0.25 ? L[4] : (i < 0 ? L[3] : L[2]); pb.set(x + i, y - k, c); pb.set(x + i, y - k - 1, i % 2 ? L[1] : L[2]); } }
    pb.vline(x, y - hgt, y, L[1]);
    if (s > 0.6) for (let k = 0; k < (tom ? 6 : 7); k++) { const fx = x + r.int(-4, 4), fy = y - r.int(4, Math.max(5, hgt - 2)); if (tom) { pb.disc(fx, fy, 2, '#e8343c'); pb.set(fx - 1, fy - 1, '#ff9a8a'); pb.set(fx, fy - 2, L[2]); } else { const c = r.chance(0.5) ? '#ff4e5d' : '#ffb93b'; pb.vline(fx, fy, fy + 3, c); pb.set(fx + 1, fy + 1, shade(c, -0.2)); pb.set(fx, fy - 1, L[2]); } }
  } else if (kind === 'nopal') ART.nopal(pb, x, y, Math.max(3, Math.round(4 * s)), seed);
  else ART.shrub(pb, x, y, Math.max(3, Math.round(7 * s)), seed);
};
/** Cinta de goteo con emisores sobre el suelo */
ART.dripLine = function (pb, x0, x1, y, spacing = 10) {
  pb.hline(x0, x1, y, '#1a1a24'); pb.hline(x0, x1, y - 1, '#2a2a3a');
  for (let x = x0 + 3; x < x1; x += spacing) { pb.set(x, y - 1, '#4a4a5a'); pb.set(x, y + 1, '#3a6a8a'); }
};
/** Casa-malla (sombra) con estructura liviana */
ART.shadeHouse = function (pb, x, y, w, h) {
  for (let k = 0; k <= w; k += 20) pb.vline(x + k, y - h, y, '#cfe8ee');
  pb.hline(x, x + w, y - h, '#e8f0f4');
  for (let yy = y - h + 1; yy < y; yy++) for (let xx = x; xx < x + w; xx++) if (((xx + yy) & 3) === 0 && pb.alpha(xx, yy) === 0) pb.set(xx, yy, '#8ab0a0');
  for (let k = 0; k < w; k++) pb.set(x + k, y - h - Math.round(Math.sin(k / w * Math.PI) * 6), '#e8f0f4');
};
/** Pozo/estanque de evaporación con costras de sal */
ART.evapPond = function (pb, x, y, w, h = 8) {
  pb.rect(x - 2, y - 2, w + 4, h + 4, '#c9a46a'); pb.rect(x, y, w, h, '#b8b0e0');
  for (let i = 0; i < w; i += 3) for (let j = 0; j < h; j += 2) if (hash2(x + i, y + j, 5) < 0.35) pb.set(x + i, y + j, '#ffffff');
  pb.hline(x, x + w - 1, y, '#e0dafc');
};
/** Montículo de sal cristalina */
ART.saltPile = function (pb, x, y, w, h) {
  for (let i = 0; i < w; i++) {
    const t = i / (w - 1), hh = Math.round(Math.sin(t * Math.PI) * h);
    for (let j = 0; j < hh; j++) { const c = t < 0.45 ? (j > hh - 3 ? '#ffffff' : '#f4f0ff') : (j > hh - 2 ? '#e0dafc' : '#c4bce8'); pb.set(x + i, y - j, c); }
  }
  for (let k = 0; k < w; k += 5) pb.set(x + k, y - Math.round(Math.sin(k / w * Math.PI) * h) + 1, '#ffffff');
};

/* ---------- Piezas animadas (ctx) ---------- */
/** Guirnalda de luces: pts del cable, encendidas o no */
function drawStringLights(g, pts, t, on = true, cols = ['#ffe14d', '#ff9f43', '#7ff0dc', '#ff8ab8']) {
  for (let i = 6, k = 0; i < pts.length - 4; i += 12, k++) {
    const [x, y] = pts[i];
    const c = cols[k % cols.length];
    if (!on) { fpx(g, x, y + 1, '#3a3050'); continue; }
    const tw = 0.7 + 0.3 * Math.sin(t * 3 + k * 1.7);
    fdither(g, x - 3, y - 2, 7, 7, c, 0.22 * tw);
    frect(g, x - 1, y + 1, 2, 2, c); fpx(g, x - 1, y + 1, '#fffaf0');
  }
}
/** Molino de papel de los niños */
function drawPaperWindmill(g, x, y, a, col = '#ff6b6b') {
  frect(g, x, y, 1, 14, '#b07a50');
  const cols = [col, '#ffe14d', '#20d6c7', '#8d6bff'];
  for (let k = 0; k < 4; k++) {
    const aa = a + k * Math.PI / 2;
    for (let r = 1; r < 5; r++) { fpx(g, x + Math.cos(aa) * r, y + Math.sin(aa) * r, cols[k]); fpx(g, x + Math.cos(aa + 0.5) * r * 0.7, y + Math.sin(aa + 0.5) * r * 0.7, cols[k]); }
  }
  fpx(g, x, y, '#fffaf0');
}
/** Burbujas de gas que suben del electrolizador; rate 0..1 */
function drawGasBubbles(g, x, y, w, h, t, rate, col = '#d8fff8') {
  const n = Math.round(rate * 10);
  for (let i = 0; i < n; i++) {
    const ph = ((t * (0.8 + (i % 3) * 0.3) + i * 0.37) % 1);
    const bx = x + ((i * 37) % w), by = y - ph * h;
    fpx(g, bx + Math.round(Math.sin(ph * 9 + i) * 1), by, col);
  }
}
/** Barra de estado de carga sobre un contenedor */
function drawSOCStrip(g, x, y, w, soc, t, charging = 0) {
  frect(g, x - 1, y - 1, w + 2, 6, '#05031a'); frect(g, x, y, w, 4, '#102a43');
  const col = soc < 0.2 ? '#ff4e5d' : soc < 0.4 ? '#ffb93b' : '#86e36f';
  const n = Math.round(soc * 10);
  for (let i = 0; i < 10; i++) frect(g, x + 1 + i * (w - 2) / 10, y + 1, Math.max(1, (w - 2) / 10 - 1), 2, i < n ? col : '#1c2350');
  if (charging) { const k = Math.floor(t * 6) % 10; frect(g, x + 1 + k * (w - 2) / 10, y + 1, Math.max(1, (w - 2) / 10 - 1), 2, charging > 0 ? '#fff09a' : '#ff9a8a'); }
}
/** Goteo: gotas cayendo de emisores */
function drawDrips(g, x0, x1, y, t, on, spacing = 10) {
  if (!on) return;
  for (let x = x0 + 3, i = 0; x < x1; x += spacing, i++) {
    const ph = (t * 1.2 + i * 0.31) % 1;
    if (ph < 0.6) fpx(g, x, y + 1 + Math.floor(ph * 4), '#6cf0db');
    else { fpx(g, x - 1, y + 4, '#2a5a7a'); fpx(g, x + 1, y + 4, '#2a5a7a'); }
  }
}
