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
const R2BB_FLOOR = ['#140f0c', '#221a15', '#33281f', '#463829', '#5a4a37', '#6e5c46', '#857058', '#9c886c', '#b6a084', '#d0bc9e'];
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
  // conducto eléctrico amarillo desde el CCM hasta las bombas de alta presión (bajo la bandeja, código de color)
  const py = 124;
  I.pipe(pb, [[1448, py], [1418, py], [680, py], [680, 134], [356, 134], [356, 150]], 1, 'r2bbPower', { flange: 40 });
  flow([[1448, py], [1418, py], [680, py], [680, 134], [356, 134], [356, 150]], 'r2bbPower', 0.7);
  I.pipe(pb, [[1652, py], [2178, py], [2178, 140]], 1, 'r2bbPower', { flange: 40 });
  flow([[1652, py], [2178, py], [2178, 140]], 'r2bbPower', 0.6);
}
/** Galería de servicio (lienzo del terreno): sodio, musgo, helechos, conducto eléctrico, bandas de identificación */
function R2BB_L2gallery(pb, flows) {
  const K = PFK, G = 290, I = PFInfra, Y = LV2_GAL, top = G + 16, bot = 388;
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
  for (const x of [260, 900, 1700, 2380]) { for (let yy = top + 6; yy < top + 15; yy++) for (let k = 0; k < 8; k++) K.put(pb, x + k, yy, U(k === 0 || yy === top + 6 ? '#ffe27a' : k === 7 ? '#8a620e' : '#f0bc2c')); K.put(pb, x + 3, top + 9, U('#10141c')); K.put(pb, x + 4, top + 10, U('#10141c')); K.put(pb, x + 3, top + 11, U('#10141c')); }
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
