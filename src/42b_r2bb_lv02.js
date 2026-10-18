/* =====================================================================
   42b_r2bb_lv02.js — r2-biomes-b · VESTIDO DEL NIVEL 2 «El Laberinto Osmótico»
   La nave dejaba de leerse como «acero gris y azul marino» (S 0,46): aquí se
   añade, sin tocar la geometría jugable ni la lógica:
     · CÓDIGO DE COLOR de corrientes (PFInfra.PIPES): alimentación TURQUESA
       (r2bbFeed), concentrado GRAFITO-ÍNDIGO con chevrones índigo
       (r2bbConc), permeado cian luminoso (product, ya existente) y
       ELECTRICIDAD AMARILLA (r2bbPower, conductos con chevrones).
     · NATURALEZA DENTRO: jardines verticales en los muros, jardineras de
       terracota en la barandilla de la pasarela con potos que cuelgan,
       potos en las bandejas de cables, macetas en el suelo, helechos y
       musgo en la galería bajo el forjado.
     · ACENTOS CÁLIDOS: suelo de epoxi arena (rampa del nivel), lámparas de
       sodio con conos de luz horneados en la galería, terracota y madera.
     · GALERÍA más rica: conducto eléctrico, bandas de identificación con
       flecha, volantes de válvula, goteos, charcos con reflejo.
   API: R2BB_L2back(pb) · R2BB_L2front(pb) · R2BB_L2gallery(pb, flows)
        R2BB_greenWall(pb,x,y,w,h,seed) · R2BB_vine(pb,x,y,len,seed,o)
        R2BB_trough(pb,x0,x1,y,seed) · R2BB_FLOOR (rampa del suelo)
   ===================================================================== */
PFInfra.PIPES.r2bbFeed = { ramp: ['#04282a', '#08484a', '#0d7270', '#159e96', '#2cc4b6', '#7ae4d4', '#d8fff4'], ink: '#03171a', chev: '#c8fff0', glow: null };
PFInfra.PIPES.r2bbConc = { ramp: ['#05061a', '#0a0d24', '#131736', '#20244a', '#323862', '#4e5484', '#7a80b4'], ink: '#020310', chev: '#a4a8ff', glow: null };
PFInfra.PIPES.r2bbPower = { ramp: ['#2a1a04', '#573a08', '#8a620e', '#c4921a', '#f0bc2c', '#ffd862', '#fff4b8'], ink: '#170e02', chev: '#fff6c0', glow: '#ffcc33' };
/** Suelo de epoxi arena (cálido) para la nave; sustituye a la rampa cian-gris */
const R2BB_FLOOR = ['#1c0e0a', '#2a160e', '#3e2214', '#56301a', '#6e4022', '#88522a', '#a06636', '#b47a42', '#c88e50', '#dca462']; // r3-int-a: epoxi ocre saturado (medios: deja leer los charcos)
const R2BB_LEAF = ['#0a1a0c', '#13301a', '#1f4a22', '#2f6626', '#46842c', '#68a43a', '#94c64c', '#c8e470'];
const R2BB_TERRA = ['#2a1008', '#4a1e10', '#6e3018', '#94461f', '#b85e28', '#d67e3c', '#eca262'];

/** Suma de luz (u32 ABGR): luz de sodio aditiva, no barro de mezcla */
function R2BB_addU(u, ar, ag, ab) { const r = Math.min(255, (u & 255) + ar), g = Math.min(255, ((u >>> 8) & 255) + ag), b = Math.min(255, ((u >>> 16) & 255) + ab); return ((u & 0xff000000) | (Math.round(b) << 16) | (Math.round(g) << 8) | Math.round(r)) >>> 0; }
/** Potos colgante: tallo que ondula hacia abajo con hojas acorazonadas alternas (2–3 px) */
function R2BB_vine(pb, x, y, len, seed, o = {}) {
  const K = PFK, r = RNG(seed), L = K.P32(o.ramp || R2BB_LEAF), sway = o.sway ?? 2.2;
  let px = x;
  for (let k = 0; k < len; k++) {
    const yy = y + k; px = x + Math.round(Math.sin(k * 0.17 + seed) * sway + (o.lean || 0) * k);
    K.put(pb, px, yy, L[k % 5 < 2 ? 1 : 2]);
    if (k % 4 === 2 && k > 1) {
      const sd = (k >> 2) % 2 ? 1 : -1, lit = sd < 0;
      const hx = px + sd, c1 = L[lit ? 5 : 3], c2 = L[lit ? 6 : 4], c0 = L[lit ? 3 : 2];
      K.put(pb, hx, yy, c1); K.put(pb, hx + sd, yy, c2); K.put(pb, hx, yy + 1, c0); K.put(pb, hx + sd, yy + 1, c1); K.put(pb, hx + sd * 2, yy + 1, c0);
      if (r() < 0.4) K.put(pb, hx + sd, yy - 1, c2);
    }
  }
  // punta con brote claro
  K.put(pb, px, y + len, L[6]);
}
/** Jardín vertical: marco de acero, fondo de fieltro y masa de follaje en capas con flores y goteo */
function R2BB_greenWall(pb, x, y, w, h, seed) {
  const K = PFK, r = RNG(seed), F = K.P32(PFAPlant.FRAME);
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
    const e = xx === x || xx === x + w - 1 || yy === y || yy === y + h - 1;
    K.put(pb, xx, yy, e ? F[xx === x || yy === y ? 6 : 2] : U(((xx + yy) & 3) ? '#1a2414' : '#22301a'));
  }
  // riego por goteo: tubos horizontales cian con puntos
  for (let yy = y + 10; yy < y + h - 4; yy += 16) for (let xx = x + 1; xx < x + w - 1; xx++) K.put(pb, xx, yy, U(xx % 5 === 0 ? '#9ff4ff' : '#2a8aa0'));
  // follaje: racimos de hojas en capas (oscuro detrás, claro delante), sin tramado
  const n = Math.round(w * h / 26);
  for (let i = 0; i < n; i++) {
    const cx = x + 2 + r() * (w - 4), cy = y + 3 + r() * (h - 6), rr = 2.5 + r() * 4;
    PFFlora.cluster(pb, cx, cy, rr + 1, rr, i % 3 ? R2BB_LEAF : PFFlora.GLOSSY, seed + i * 7, { density: 0.7, leaf: [2, 4] });
  }
  // flores (bromelias rojas, amarillas) y helechos que desbordan por los lados
  for (let i = 0; i < Math.round(w * h / 140); i++) { const fx = Math.round(x + 3 + r() * (w - 6)), fy = Math.round(y + 4 + r() * (h - 8)), c = r.pick(['#ff5a4a', '#ffc83a', '#ff8ab0', '#ffffff']); K.put(pb, fx, fy, U(c)); K.put(pb, fx + 1, fy, U(c)); K.put(pb, fx, fy - 1, U(shade(c, 0.3))); }
  for (const sx of [x - 1, x + w]) for (let k = 0; k < 3; k++) PFFlora.fern(pb, sx, y + 8 + k * Math.round(h / 3), 7 + r.int(0, 4), seed + k + sx);
  // placa y canaleta de recogida
  for (let xx = x - 1; xx <= x + w; xx++) { K.put(pb, xx, y + h, F[6]); K.put(pb, xx, y + h + 1, F[3]); K.put(pb, xx, y + h + 2, F[1]); }
}
/** Jardinera de terracota colgada de una barandilla con plantas y potos que cuelgan */
function R2BB_trough(pb, x0, x1, y, seed) {
  const K = PFK, T = K.P32(R2BB_TERRA), r = RNG(seed);
  for (let x = x0; x <= x1; x++) for (let k = 0; k < 6; k++) K.put(pb, x, y + k, T[k === 0 ? 6 : k === 1 ? 5 : k === 5 ? 1 : (x - x0) % 9 === 0 ? 2 : 3]);
  for (let x = x0 + 2; x < x1 - 1; x += 4 + r.int(0, 3)) PFFlora.bush(pb, x + 2, y, 8 + r.int(0, 5), 6 + r.int(0, 4), r.chance(0.5) ? R2BB_LEAF : PFFlora.GLOSSY, seed + x, { density: 0.6 });
  for (let x = x0 + 3; x < x1 - 2; x += 5 + r.int(0, 4)) R2BB_vine(pb, x, y + 6, 8 + r.int(0, 22), seed + x * 3);
}
/** Detrás del equipo (se llama antes de dibujarlo): jardines verticales en los muros de la nave */
function R2BB_L2back(pb) {
  const G = 290;
  // muro de entrada (sobre el vano) y del almacén de membranas; huecos libres entre zonas
  for (const [x, y, w, h, s] of [[54, 150, 16, 70, 1], [224, 140, 22, 84, 2], [1262, 120, 20, 66, 3], [1654, 132, 26, 86, 4], [2296, 128, 24, 76, 5], [2342, 136, 20, 64, 6]]) R2BB_greenWall(pb, x, y, w, h, 900 + s);
  // franja de suelo junto a los jardines: alcorque con musgo
  for (const [x, w] of [[222, 26], [1652, 30], [2294, 70]]) for (let k = 0; k < w; k++) { PFK.put(pb, x + k, G - 20, U(k % 3 ? '#2f6626' : '#46842c')); PFK.put(pb, x + k, G - 19, U('#1f4a22')); }
}
/** Delante (al final de los accesorios): jardineras, potos en bandejas y barandillas, macetas, conducto eléctrico */
function R2BB_L2front(pb, flow) {
  const G = 290, fb = G - 12, A = PFArch, I = PFInfra;
  // jardineras de terracota en la barandilla de la pasarela de los trenes (cuelgan hacia el nivel bajo)
  for (const [x0, x1] of [[712, 760], [818, 868], [902, 950], [1008, 1056], [1092, 1140], [1198, 1246]]) R2BB_trough(pb, x0, x1, 186, x0);
  // potos que cuelgan de las bandejas de cables (sobre los equipos, sin tapar rótulos)
  for (const x of [34, 96, 196, 330, 520, 610, 1286, 1388, 1700, 1872, 2010, 2150, 2240, 2330, 2440, 2560]) R2BB_vine(pb, x, 111, 10 + ((x * 7) % 26), 700 + x, { sway: 1.6 });
  // macetas en el suelo (terracota) junto a los jardines
  A.planter(pb, 2470, fb + 2, 18, { kind: 'palm', seed: 21, ramp: R2BB_TERRA });
  A.planter(pb, 72, fb + 4, 14, { kind: 'agave', seed: 22, ramp: R2BB_TERRA });
  // r3-int-a: más verde en la nave: potos que caen del canto de la sala de control y de la pasarela de los trenes,
  // jardineras con plantas de hoja grande en los huecos del suelo y helechos al pie de los pilares
  for (let x = 1424; x < 1650; x += 13 + ((x * 3) % 9)) R2BB_vine(pb, x, 222, 8 + ((x * 11) % 22), 7100 + x, { sway: 1.4 });
  for (let x = 694; x < 1260; x += 23 + ((x * 7) % 15)) R2BB_vine(pb, x, 229, 6 + ((x * 13) % 16), 7200 + x, { sway: 1.2 });
  for (const [x, w] of [[1404, 14], [1664, 16], [2268, 14], [2160, 14]]) {
    const yb = fb + 4, T = PFK.P32(R2BB_TERRA);
    A.castShadow(pb, x - 2, yb, w + 6, 6, -0.22);
    for (let yy = 0; yy < 10; yy++) for (let xx = 0; xx < w; xx++) PFK.put(pb, x + xx, yb - yy, T[yy === 9 ? 6 : yy === 8 ? 5 : xx < 2 ? 5 : xx > w - 3 ? 1 : 3]);
    PFFlora.bush(pb, x + (w >> 1), yb - 9, w + 10, 16, PFFlora.GLOSSY, 7300 + x, { density: 0.8 });
    PFFlora.bigLeaf(pb, x + 2, yb - 12, -2.2, 9, 5, R2BB_LEAF, 3); PFFlora.bigLeaf(pb, x + w - 2, yb - 13, -0.9, 9, 5, R2BB_LEAF, 4);
  }
  // conducto eléctrico amarillo desde el CCM hasta las bombas de alta presión (bajo la bandeja, código de color)
  const py = 124;
  I.pipe(pb, [[1448, py], [1418, py], [680, py], [680, 134], [356, 134], [356, 150]], 1, 'r2bbPower', { flange: 40 });
  flow([[1448, py], [1418, py], [680, py], [680, 134], [356, 134], [356, 150]], 'r2bbPower', 0.7);
  I.pipe(pb, [[1652, py], [2178, py], [2178, 140]], 1, 'r2bbPower', { flange: 40 });
  flow([[1652, py], [2178, py], [2178, 140]], 'r2bbPower', 0.6);
}
/** Galería de servicio (lienzo del terreno): sodio, musgo, helechos, conducto eléctrico, bandas de identificación */
function R2BB_L2gallery(pb, flows) {
  const K = PFK, G = 290, I = PFInfra, Y = LV2_GAL, top = G + 16, bot = (LV2_GAL.floor || 384) + 4;
  // conducto eléctrico bajo el forjado con chevrones amarillos
  I.pipe(pb, [[0, top + 4], [2600, top + 4]], 1, 'r2bbPower', { flange: 60 });
  flows.push({ pts: [[0, top + 4], [2600, top + 4]], kind: 'r2bbPower', rate: 0.6 });
  // musgo y helechos que brotan de las juntas del forjado; goteos
  const r = RNG(4242);
  for (let x = 8; x < 2600; x += 6 + r.int(0, 18)) {
    const n = 2 + r.int(0, 5); for (let k = 0; k < n; k++) K.put(pb, x + k, top + (k % 2), U(r.pick(['#1f4a22', '#2f6626', '#46842c'])));
    if (r.chance(0.18)) R2BB_vine(pb, x + 1, top + 1, 4 + r.int(0, 9), 9000 + x, { sway: 0.8 });
    if (r.chance(0.06)) PFFlora.fern(pb, x + 2, top + 10, 6 + r.int(0, 3), 9100 + x, R2BB_LEAF);
  }
  // bandas de identificación con flecha (sentido del flujo) sobre cada colector
  for (let x = 120; x < 2560; x += 260) for (const [yy, col, dir] of [[Y.brine, '#7a80b4', 1], [Y.perm, '#48d4f0', 1], [Y.feed, '#2cc4b6', 1]]) {
    for (let k = 0; k < 14; k++) for (let q = -3; q <= 3; q++) { const u = K.get(pb, x + k, yy + q); if (!(u >>> 24)) continue; K.put(pb, x + k, yy + q, U(k < 2 || k > 11 ? '#f2efea' : col)); }
    for (let q = -2; q <= 2; q++) K.put(pb, x + 6 + Math.abs(q) * -dir + 2, yy + q, U('#10141c'));
    K.put(pb, x + 8, yy, U('#10141c'));
  }
  // volantes de válvula rojos en la alimentación y amarillos en las cajas eléctricas
  for (const x of [420, 980, 1540, 2100]) { K.ellipseFn(pb, x, Y.feed - 7, 4, 4, (nx, ny, d) => d > 0.65 ? U(nx + ny < 0 ? '#ff7a6a' : '#8a1a1a') : d < 0.3 ? U('#c8282a') : 0); for (let k = 0; k < 4; k++) K.put(pb, x, Y.feed - 6 + k, U('#4f4d51')); }
  const by = Y.feed + 6; // r3-int-a: cajas eléctricas amarillas bajo el rack (no sobre la salmuera)
  for (const x of [260, 900, 1700, 2380]) { for (let yy = by; yy < by + 9; yy++) for (let k = 0; k < 8; k++) K.put(pb, x + k, yy, U(k === 0 || yy === by ? '#ffe27a' : k === 7 ? '#8a620e' : '#f0bc2c')); K.put(pb, x + 3, by + 3, U('#10141c')); K.put(pb, x + 4, by + 4, U('#10141c')); K.put(pb, x + 3, by + 5, U('#10141c')); }
  // lámparas de sodio con cono de luz cálido horneado (3 bandas) y reflejo en los tubos
  for (const x of [140, 380, 620, 820, 1060, 1180, 1420, 1580, 1820, 1980, 2220, 2380]) {
    for (let k = -4; k <= 4; k++) { K.put(pb, x + k, top + 1, U('#2a282e')); K.put(pb, x + k, top + 2, U(Math.abs(k) < 3 ? '#fff0b0' : '#ffb850')); }
    for (let yy = top + 3; yy < bot; yy++) {
      const dy = yy - top - 3, half = 4 + dy * 0.7;
      for (let xx = Math.floor(x - half); xx <= x + half; xx++) {
        const u = K.get(pb, xx, yy); if (!(u >>> 24)) continue;
        const e = Math.abs(xx - x) / half, f = (1 - e) * clamp(1 - dy / 90, 0, 1) + (hash2((xx / 3) | 0, (yy / 2) | 0, 71) - 0.5) * 0.12;
        const k = f > 0.55 ? 0.42 : f > 0.3 ? 0.26 : f > 0.12 ? 0.13 : 0; if (k) K.put(pb, xx, yy, R2BB_addU(u, 255 * k, 176 * k, 84 * k));
      }
    }
  }
}

/* suelo de epoxi arena: la rampa del tramo se cambia al cargar (la geometría no cambia) */
if (LEVELS[2] && LEVELS[2].pf && LEVELS[2].pf.terrain[0]) LEVELS[2].pf.terrain[0].ramp = R2BB_FLOOR;

/* =====================================================================
   r3-int-a · GALERÍA DE COLECTORES DEL NIVEL 2 (banda inferior)
   Muro alicatado turquesa y enlucido cálido bajo las lámparas de sodio,
   suelo de hormigón mojado con canaleta, y un objeto cada ≈ 30 px:
   bombas de refuerzo, estaciones de válvulas con manómetro, cajas de
   conexión con LED, caudalímetros con pantalla, charcos con goteo,
   bidones, cajas, cubos con fregona, conos, escalas de pates, grifos de
   muestra, carros, devanadoras, luz de emergencia, musgo y helechos.
   Anclas de animación en R3INTA_L2GAL (las dibuja R3INTA_L2galleryAnim
   desde LEVELS[2].renderFront: van bajo la línea de paso, nunca tapan
   personajes).
   API: R3INTA_L2galleryBack(pb, Y, FY) · R3INTA_L2galleryFront(pb, Y, FY)
        R3INTA_L2galleryAnim(g, sc, cam)
   ===================================================================== */
const R3INTA_L2GAL = { pumps: [], gauges: [], drips: [], leds: [], puddles: [], meters: [], exits: [], steam: [] };
const R3INTA_L2LAMPS = [140, 380, 620, 820, 1060, 1180, 1420, 1580, 1820, 1980, 2220, 2380];
/** Muro del fondo de la galería y suelo (antes de los colectores) */
function R3INTA_L2galleryBack(pb, Y, FY) {
  const K = PFK, G = 290, top = G + 16;
  const TE = K.P32(R3INTA_TEAL), PL = K.P32(R3INTA_PLASTER), CO = K.P32(R3INTA_CONC);
  const tileY = Y.feed + 5;
  for (let x = 0; x < 2600; x++) {
    let near = 0; for (const lx of R3INTA_L2LAMPS) { const d = Math.abs(x - lx); if (d < 64) near = Math.max(near, 1 - d / 64); }
    const pier = ((x + 60 + 3000) % 160) < 16;
    if (!pier) for (let y = top; y < FY; y++) {
      const d = y - top;
      let u;
      if (y < tileY) {
        let i = 2 + Math.round(near * 3.4) - (d < 2 ? 1 : 0);
        if ((x + (d >> 3) * 7) % 48 === 0) i -= 1;
        u = PL[clamp(i, 0, PL.length - 1)];
      } else {
        const ty = y - tileY, tx = x + (((ty / 5) | 0) % 2) * 4;
        const grout = ty % 5 === 0 || tx % 8 === 0;
        const i = grout ? 2 : 4 + Math.round(near * 2.2) + ((tx % 8 === 1 || ty % 5 === 1) ? 1 : 0);
        u = TE[clamp(i, 0, TE.length - 1)];
      }
      K.put(pb, x, y, u);
    }
    // zócalo oscuro y suelo de hormigón mojado (cara superior en 3/4, canaleta con agua, frente)
    if (!pier) { K.put(pb, x, FY - 2, TE[1]); K.put(pb, x, FY - 1, TE[0]); }
    for (let y = FY; y < 400; y++) {
      const q = y - FY;
      let u;
      if (q === 0) u = CO[7];
      else if (q < 5) u = CO[clamp(5 + Math.round(near * 2) - (q > 3 ? 1 : 0) - (hash2(x >> 1, y, 61) < 0.12 ? 1 : 0), 0, 8)];
      else if (q < 8) u = (x % 3 === 0 || q === 5) ? CO[0] : ((x + q) % 7 === 0 ? U('#48d4f0') : U('#0e2a3a'));
      else if (q === 8) u = CO[6];
      else u = CO[clamp(3 - ((q - 9) >> 3) + ((x >> 4) % 5 === 0 ? -1 : 0), 0, 8)];
      K.put(pb, x, y, u);
    }
    // charco de luz de las lámparas en el suelo (horneado, 3 bandas)
    if (near > 0.2) for (let q = 1; q < 5; q++) { const u = K.get(pb, x, FY + q); if (!(u >>> 24)) continue; const k = near > 0.7 ? 0.4 : near > 0.45 ? 0.26 : 0.14; K.put(pb, x, FY + q, R2BB_addU(u, 255 * k, 170 * k, 80 * k)); }
  }
}
/** Objetos de la galería (después de los colectores y del vestido r2-biomes-b) */
function R3INTA_L2galleryFront(pb, Y, FY) {
  const K = PFK, P = PFAPlant, I = PFInfra, A = PFArch, r = RNG(7300), N = R3INTA_L2GAL;
  for (const k in N) N[k].length = 0;
  const G = 290, top = G + 16;
  const pierAt = (x) => ((x + 60 + 3000) % 160) < 18 || ((x + 60 + 3000) % 160) > 156;
  const steelV = (x, y0, y1, ramp) => { const R = K.P32(ramp || I.STEEL), n = R.length; for (let y = y0; y <= y1; y++) { K.put(pb, x - 1, y, R[n - 2]); K.put(pb, x, y, R[n >> 1]); K.put(pb, x + 1, y, R[1]); } };
  const plinth = (x, w) => I.box3q(pb, x, FY, w, 3, 3, { ramp: R3INTA_CONC.slice(1), skew: 0.6 });
  const KINDS = {
    pump(x) { // bomba de refuerzo en bancada (eje animado)
      const M = K.P32(r.chance(0.5) ? P.GREEN : P.BLUEP), ST = K.P32(I.STEEL), Yl = K.P32(P.YEL);
      A.castShadow(pb, x, FY, 32, 5, -0.25); plinth(x, 32);
      for (let j = 0; j <= 10; j++) { const k = P.ti(j / 10, M.length); for (let xx = x + 2; xx <= x + 14; xx++) K.put(pb, xx, FY - 14 + j, ((xx - x) % 3 === 0 && j > 1 && j < 9) ? M[clamp(k - 2, 0, M.length - 1)] : M[k]); }
      for (let j = 0; j <= 8; j++) for (let xx = x + 15; xx <= x + 18; xx++) K.put(pb, xx, FY - 13 + j, Yl[j === 0 ? 6 : j === 8 ? 1 : (xx + j) % 3 === 0 ? 2 : 4]);
      for (let j = 0; j <= 8; j++) { const k = P.ti(j / 8, ST.length); for (let xx = x + 19; xx <= x + 27; xx++) K.put(pb, xx, FY - 13 + j, (xx - x) % 4 === 0 ? ST[clamp(k - 2, 0, 7)] : ST[k]); }
      steelV(x + 25, Y.feed + 3, FY - 14, I.PIPES.r2bbFeed.ramp);
      I.gauge(pb, x + 30, FY - 20, 2, -0.4);
      N.pumps.push([x + 16, FY - 9]); N.gauges.push([x + 30, FY - 20, 2]);
      N.leds.push({ x: x + 6, y: FY - 16, col: '#3fe0a0', hz: 1.2, ph: x * 0.01 });
      return 36;
    },
    valve(x) { // estación de válvula con volante y manómetro
      steelV(x, Y.feed + 3, FY - 4, I.PIPES.r2bbFeed.ramp);
      plinth(x - 5, 11);
      I.valve(pb, x, FY - 8, { wheel: r.chance(0.5) ? ['#5a0e10', '#a8242a', '#e04a3a', '#ff8a6a'] : ['#3a2604', '#a87414', '#f0bc2c', '#fff2a8'] });
      I.gauge(pb, x + 6, Y.feed + 10, 3, -0.6); N.gauges.push([x + 6, Y.feed + 10, 3]);
      return 16;
    },
    jbox(x) { // caja de conexión azul en el muro con pilotos
      const yb = Y.feed + 18;
      for (let y = top + 6; y < yb - 11; y++) K.put(pb, x + 6, y, U('#f0bc2c'));
      I.box3q(pb, x, yb, 14, 11, 3, { ramp: R3INTA_COBALT, skew: 0.6 });
      for (let q = 0; q < 3; q++) N.leds.push({ x: x + 3 + q * 3, y: yb - 7, col: ['#3fe0a0', '#ffd84a', '#ff5a4a'][q], hz: 0.6 + q * 0.5, ph: x * 0.03 + q });
      P.sign(pb, x + 3, yb - 4, 'bolt');
      return 18;
    },
    puddle(x) { // charco con goteo desde el colector de permeado
      const rx = 7 + r.int(0, 6);
      K.ellipseFn(pb, x, FY + 2, rx, 1.6, (nx, ny) => ny < -0.1 ? U('#a8e8f4') : U('#3a9ab8'));
      K.put(pb, x - 2, FY + 1, U('#ffffff'));
      N.puddles.push([x, FY + 2, rx]); N.drips.push([x + 1, Y.perm + 4, FY + 1]);
      return rx + 8;
    },
    crates(x) {
      A.castShadow(pb, x, FY, 26, 5, -0.24);
      A.crate(pb, x, FY, 14, 11, 5); A.crate(pb, x + 13, FY, 11, 8, 4); if (r.chance(0.5)) A.crate(pb, x + 2, FY - 11, 10, 7, 4);
      return 30;
    },
    drums(x) {
      I.barrel(pb, x + 4, FY, ['#3a2604', '#6e4c0c', '#a87414', '#d89a1c', '#f0bc2c', '#fcd856']);
      I.barrel(pb, x + 14, FY, ['#0e2a48', '#163e66', '#245f90', '#2f86c0', '#5ab4e0', '#a8e0f8']);
      return 24;
    },
    bucket(x) {
      P.bucket(pb, x + 4, FY, r.pick(['#2c6cc6', '#ff9f43', '#3fe0a0']));
      for (let k = 0; k < 18; k++) K.put(pb, x + 8 + (k >> 2), FY - 4 - k, U('#a87414'));
      for (let k = 0; k < 5; k++) K.put(pb, x + 7 + k, FY - 1, U('#e8e0c8'));
      return 18;
    },
    meter(x) { // caudalímetro en el colector de permeado con pantalla LCD
      I.box3q(pb, x, Y.perm + 4, 12, 9, 3, { ramp: R3INTA_COBALT, skew: 0.6 });
      P.rect(pb, x + 2, Y.perm - 3, 8, 4, U('#062a2a')); N.meters.push([x + 2, Y.perm - 3]);
      P.cone(pb, x + 6, FY);
      return 18;
    },
    ladder(x) { // escala de pates a la trampilla del forjado
      const Yl = K.P32(P.YEL);
      for (let y = top; y < FY; y++) { K.put(pb, x, y, Yl[4]); K.put(pb, x + 7, y, Yl[2]); if ((y - top) % 5 === 0) for (let k = 1; k < 7; k++) K.put(pb, x + k, y, Yl[5]); }
      for (let k = -2; k < 10; k++) { K.put(pb, x + k, top, U('#141418')); K.put(pb, x + k, top + 1, U('#f0bc2c')); }
      return 14;
    },
    tap(x) { // grifo de muestra en la salmuera con goteo a un cubo
      steelV(x, Y.brine + 3, Y.brine + 12, I.STEEL); K.put(pb, x + 1, Y.brine + 12, U('#e04a3a')); K.put(pb, x + 2, Y.brine + 12, U('#e04a3a'));
      P.bucket(pb, x + 1, FY, '#c244a2'); N.drips.push([x, Y.brine + 13, FY - 7]);
      return 14;
    },
    fern(x) {
      PFFlora.fern(pb, x, FY - 1, 10 + r.int(0, 6), 7400 + x, R2BB_LEAF);
      for (let k = 0; k < 14; k++) K.put(pb, x - 6 + k, FY - 1 - (k % 3 === 0 ? 1 : 0), U(r.pick(['#1f4a22', '#2f6626', '#46842c', '#68a43a'])));
      return 14;
    },
    cart(x) { P.cart(pb, x, FY); P.toolbox(pb, x + 6, FY - 13, r.pick(['#bc2430', '#2c6cc6'])); return 30; },
    reel(x) { P.hoseReel(pb, x + 9, FY, r.pick(['#3a8a3a', '#c8562a'])); return 22; },
    exit(x) { // luz de emergencia verde y extintor
      const y = Y.feed + 9;
      P.rect(pb, x, y, 12, 6, U('#0c3a20')); P.rect(pb, x + 1, y + 1, 10, 4, U('#3fe0a0')); K.put(pb, x + 3, y + 2, U('#ffffff')); K.put(pb, x + 4, y + 3, U('#ffffff'));
      N.exits.push([x + 6, y + 3]);
      P.extinguisher(pb, x + 3, FY);
      return 16;
    },
  };
  const seq = ['pump', 'puddle', 'jbox', 'crates', 'valve', 'fern', 'meter', 'drums', 'puddle', 'ladder', 'bucket', 'exit', 'pump', 'tap', 'fern', 'cart', 'valve', 'puddle', 'reel', 'jbox', 'drums', 'fern'];
  let x = 26, i = 0;
  while (x < 2570) {
    if (pierAt(x)) { // musgo al pie del pilar
      for (let k = 0; k < 18; k++) K.put(pb, x - 2 + k, FY - 1 - (k % 4 === 1 ? 1 : 0), U(r.pick(['#1f4a22', '#2f6626', '#46842c'])));
      x += 20; continue;
    }
    const kind = seq[i++ % seq.length];
    x += KINDS[kind](x) + r.int(4, 10);
  }
  // musgo en el colector de salmuera (condensación) y anclas de vapor en las juntas de la alimentación
  for (let x2 = 30; x2 < 2580; x2 += 40 + r.int(0, 50)) for (let k = 0; k < 5 + r.int(0, 6); k++) K.put(pb, x2 + k, Y.brine + 3 + (k & 1), U(r.pick(['#2f6626', '#46842c', '#68a43a'])));
  for (const x2 of [300, 980, 1700, 2300]) N.steam.push([x2, Y.feed - 3]);
}
/** Animación de la galería: ejes de bomba, agujas, goteos, ondas en charcos, LED, caudalímetros, luz de emergencia, vapor, sodio */
function R3INTA_L2galleryAnim(g, sc, cam) {
  const N = R3INTA_L2GAL, t = Game.time, ox = cam.x, oy = cam.y;
  const vis = (x) => x - ox > -20 && x - ox < W + 20;
  for (const [x, y] of N.pumps) { if (!vis(x)) continue; const ph = Math.floor(t * 24 + x) % 4; for (let k = 0; k < 2; k++) fpx(g, Math.round(x - ox) + ((ph + k * 2) % 4) - 1, Math.round(y - oy) - 3 + k * 6, '#fff2a8'); fpx(g, Math.round(x - ox) + (ph % 3) - 1, Math.round(y - oy), '#ffffff'); }
  for (const [x, y, rr] of N.gauges) { if (!vis(x)) continue; const a = -0.9 + 0.5 * Math.sin(t * 1.7 + x) + 0.08 * Math.sin(t * 23 + x); fpx(g, Math.round(x - ox + Math.cos(a) * (rr - 1)), Math.round(y - oy + Math.sin(a) * (rr - 1)), '#c0242a'); }
  g.fillStyle = '#bff4ff';
  for (const [x, y0, y1] of N.drips) { if (!vis(x)) continue; const ph = (t * 0.9 + x * 0.013) % 1, yy = y0 + ph * ph * (y1 - y0); g.fillRect(Math.round(x - ox), Math.round(yy - oy), 1, 2); }
  for (const [x, y, rx] of N.puddles) { if (!vis(x)) continue; const ph = (t * 0.9 + (x + 1) * 0.013) % 1, k = Math.round(1 + ph * (rx - 2)); g.globalAlpha = 1 - ph; g.fillStyle = '#e8fcff'; g.fillRect(Math.round(x - ox - k), Math.round(y - oy), 1, 1); g.fillRect(Math.round(x - ox + k), Math.round(y - oy), 1, 1); g.globalAlpha = 1; }
  PFInfra.drawLeds(g, sc, N.leds);
  g.fillStyle = '#5affd0';
  for (const [x, y] of N.meters) { if (!vis(x)) continue; const v = Math.floor(t * 3 + x) % 10; for (let k = 0; k < 3; k++) g.fillRect(Math.round(x - ox) + 1 + k * 2, Math.round(y - oy) + 1 + ((v + k) % 2), 1, 2 - ((v + k) % 2)); }
  for (const [x, y] of N.exits) { if (!vis(x)) continue; if ((Math.floor(t * 1.5 + x) % 3) !== 0) PFK.drawGlow(g, x - ox, y - oy, 6, '#3fe0a0', 0.5); }
  g.fillStyle = '#e8f4ff';
  for (const [x, y] of N.steam) { if (!vis(x)) continue; for (let k = 0; k < 4; k++) { const ph = (t * 0.6 + k / 4) % 1; g.globalAlpha = 0.5 * (1 - ph); g.fillRect(Math.round(x - ox + Math.sin(ph * 6 + k) * 2 + ph * 6), Math.round(y - oy - ph * 10), 2, 1); } }
  g.globalAlpha = 1;
  // parpadeo leve de las lámparas de sodio (halo)
  for (const x of R3INTA_L2LAMPS) { if (!vis(x)) continue; PFK.drawGlow(g, x - ox, 309 - oy, 8, '#ffc060', 0.22 + 0.05 * Math.sin(t * 7 + x)); }
}
