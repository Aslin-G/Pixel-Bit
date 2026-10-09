/* =====================================================================
   1d_bio_canyon.js — BIOMA CAÑONES DE SAL (Nivel 03) con el kit VISTA.
   Anochecer en azul profundo, violeta y magenta controlado.
   Planos: cielo+sol bajo+estrellas (0) · cirros y cúmulos rosados
   (0,01–0,07) · borde lejano del cañón (0,05) · mar del ocaso con
   reflejo (0,08) · paredes medias azul-violeta con vetas de sal (0,14) ·
   salinas de evaporación en terrazas (turquesa → verde → rosa → costra),
   montones de sal, emisario con difusor, pluma y boyas (0,22) · chimeneas
   de roca con cristales (0,34) · costra salina con laguna y flamencos (0,5).
   Contrato: B.horizon, B.sun, B.seaY(cam).
   ===================================================================== */
var BIOME_LABELS = (typeof BIOME_LABELS !== 'undefined') ? BIOME_LABELS : {};

BIOMES.canyon = function (L) {
  const V = VISTA;
  const B = new Backdrop(L.width, L.height);
  const HZ = 166;
  const SUN = { x: 470, y: 148, r: 14, halo: 36 };
  B.horizon = HZ; B.sun = SUN; B.seaY = () => HZ;
  B.weather.wind = 0.5;
  const T = () => Game.time;
  const P = (f, ys, h, draw, opts) => B.vplane(f, ys - Math.round(V.CAMY * f * 0.3), h, draw, opts);
  const labels = [];
  const CANYON = V.RAMPS.canyonDusk;
  /* ---------------- cielo del ocaso ---------------- */
  B.sky = V.timed('sky', () => {
    const pb = V.sky(W, H, {
      horizonY: HZ, sun: SUN, curve: 0.95,
      stops: ['#0e1450', '#161c62', '#222474', '#342a84', '#4a3090', '#683a98', '#8c4a9c', '#b05c9e', '#d4709a', '#ee8c94'],
      haze: ['#f4a08c', '#f8b48c', '#fcc890', '#ffdca0'],
    });
    V.sunDisc(pb, SUN.x, SUN.y, SUN.r, SUN.halo, 'dusk');
    V.rays(pb, SUN.x, SUN.y, { n: 9, len: 320, col: '#ffd8b0', a: 0.08, spread: 2.8, ang: -Math.PI / 2, w: 0.05, seed: 14, yMax: HZ });
    return pb.toCanvas();
  });
  B.vdyn(0, (g) => { const t = T(); V.drawStars(g, 46, t, 31, { y1: 96, a: 0.85 }); V.drawBloom(g, SUN.x, SUN.y, 64, '#ff9a70', 0.24, t); }, { tag: 'stars+bloom' });
  B.cloudDeck({ kind: 'cirrus', n: 7, seed: 91, f: [0.01, 0.03], y: [20, 100], w: [90, 180], speed: [1, 2], pal: ['#8a5aa0', '#c07ab0', '#f0a0b8', '#ffd8c8'] });
  const DUSK = ['#3a2a6a', '#5a3a80', '#8a4a90', '#b8609a', '#e08098', '#f8a898', '#ffc8a8', '#ffe0b0'];
  B.cloudDeck({ n: 7, seed: 93, f: [0.03, 0.07], y: [10, 90], w: [60, 130], bias: 0.6, speed: [1.5, 3], sunX: SUN.x, pal: DUSK });
  /* ---------------- borde lejano del cañón (0,05) ---------------- */
  P(0.05, 108, 62, (pb, w, h) => {
    V.mesas(pb, { yBase: h - 1, seed: 97, k: 0.3, hMin: 14, hMax: 44, ramp: V.hz(CANYON, 0.25, '#c87aa8') });
    V.rim(pb, U('#ffb8a0'), 0.55, 1, -1);
  }, { tag: 'far' });
  /* ---------------- mar del ocaso (0,08) ---------------- */
  P(0.08, HZ, 70, (pb) => V.seaFar(pb, 0, pb.h, { seed: 99, stops: ['#f8b0a0', '#c87aa8', '#8a5aa0', '#5a4a98', '#3a4290', '#2e3c88', '#2a3a80', '#26367a'], horizonCol: '#ffd0b0' }), {
    tag: 'sea', dyn: (g, cam, Ly) => { const [, oy] = B.vofs(Ly, cam); V.drawSeaFx(g, 0, oy, W, 60, T(), { sunX: SUN.x, density: 0.6 }); },
  });
  B.cloudDeck({ n: 4, seed: 95, f: [0.08, 0.1], y: [70, 118], w: [90, 140], speed: [1, 2], sunX: SUN.x, tall: true, haze: 0.08, hazeCol: '#c88ab0', pal: DUSK });
  /* ---------------- paredes medias azul-violeta con vetas (0,14) ---------------- */
  P(0.14, 70, 150, (pb, w, h) => {
    V.mesas(pb, { yBase: h - 1, seed: 103, k: 0.1, hMin: 46, hMax: 120, ramp: CANYON });
    V.rim(pb, U('#ffb8a0'), 0.7, 1, -1);
    V.saltVeins(pb, { seed: 105, every: 9, col: '#ffe0f0' });
    // niebla rosada en el pie de las paredes
    for (let y = h - 26; y < h; y++) { const kk = 0.55 * Math.pow((y - (h - 26)) / 26, 1.4); for (let x = 0; x < w; x++) { const i = y * w + x; if (pb.data[i] >>> 24) pb.data[i] = V.mixU(pb.data[i], U('#d890b0'), kk); } }
  }, { tag: 'walls' });
  /* ---------------- salinas de evaporación y emisario (0,22) ---------------- */
  const panFx = { glints: [], buoys: [], outfall: null };
  const PAN_YS = 170;
  P(0.22, PAN_YS, 76, (pb, w, h) => {
    const k = 0.06, r = RNG(111);
    // costa: franja de playa de sal y espuma bajo el mar
    const CR = V.P32(V.hz(V.RAMPS.saltCrust, k));
    // lámina de mar somero (reflejo del ocaso) con espuma en la orilla
    const SEA = V.P32(['#6a4a9a', '#8a5aa8', '#b070b0', '#e098b8', '#ffd0c8']);
    for (let x = 0; x < w; x++) { for (let y = 0; y < 8; y++) V.put(pb, x, y, SEA[y < 2 ? 1 : ((x + y * 7) % 29 < 3) ? 4 : 2 + ((y >> 1) & 1)]); V.put(pb, x, 8, U('#ffffff')); V.put(pb, x, 9, CR[4]); }
    V.saltCrust(pb, 0, w, 10, h, { k, seed: 112, sparse: 80, ramp: ['#7a5a8a', '#a07aa8', '#c49cc4', '#e0c0dc', '#f2dcec', '#fff0f8'] });
    const S = V.saltPans(pb, { x0: 0, x1: w, y0: 12, rows: 3, seed: 113, k, sky: '#f8b8b0', skip: (x) => (x % 520) > 470 });
    panFx.glints.push(...S.glints);
    // montones de sal cosechada (conos blancos con sombra violeta) y cinta transportadora
    for (let x = 486; x < w; x += 520) {
      for (let q = 0; q < 3; q++) { const cx = x + q * 12, cy = 30 + q * 3, rr = 6 + q; V.poly(pb, [[cx - rr, cy], [cx, cy - rr], [cx + rr, cy]], (px) => CR[px < cx ? 5 : 2]); }
      V.line(pb, x - 10, 40, x + 30, 18, () => U('#3a3448')); V.line(pb, x - 10, 39, x + 30, 17, () => U('#8a8aa0'));
      V.box3q(pb, x + 30, 22, 16, 9, 6, { ramp: V.ARCH.WHITE, k });
    }
    // emisario: tubería grafito hacia el mar con difusor y boyas de vigilancia
    const ex = 300;
    V.pipe(pb, [[ex, 40], [ex, 12], [ex + 60, 12], [ex + 60, 4]], 1, ['#080e26', '#212846', '#3a405d', '#555a78', '#787a9b'], { k: 0 });
    for (let y = 9; y < 15; y++) V.blend(pb, ex - 2, y, U('#c244a2'), 0.35);
    panFx.outfall = { x: ex + 60, y: 2 };
    panFx.buoys.push([ex + 70, 0, '#f5dc5a'], [ex + 100, 1, '#e83b41'], [ex + 40, -1, '#f5dc5a'], [ex + 600, 0, '#e83b41'], [ex + 640, 1, '#f5dc5a']);
    labels.push({ x: 196, y: PAN_YS - 8, f: 0.22, title: 'SALINAS', sub: 'Evaporación por etapas', kind: 'brine', ax: 180, ay: PAN_YS + 20, camX: [0, 1100] });
    labels.push({ x: ex + 66, y: PAN_YS - 30, f: 0.22, title: 'EMISARIO', sub: 'Difusor y vigilancia', kind: 'brine', ax: ex + 60, ay: PAN_YS - 2, camX: [0, 1100] });
  }, {
    tag: 'pans', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      V.drawGlints(g, panFx.glints, ox, oy, t);
      V.drawBuoys(g, panFx.buoys, ox, oy, t);
      if (panFx.outfall) { const x = panFx.outfall.x + ox; if (x > -30 && x < W + 30) V.drawPlume(g, x, panFx.outfall.y + oy, t, { n: 16, len: 26 }); }
    },
  });
  /* ---------------- chimeneas de roca y cristales (0,34) ---------------- */
  const hoodFx = { glints: [] };
  P(0.34, 100, 170, (pb, w, h) => {
    const k = 0.03, r = RNG(121), base = h - 1;
    for (let x = 40; x < w; x += r.int(90, 200)) {
      const big = r.chance(0.45);
      if (big) {
        // farallón de techo plano con la cara del sol encendida
        V.butte(pb, x, base, r.int(36, 70), r.int(96, 150), 123 + x, { k });
        x += 60;
      } else { V.hoodoo(pb, x, base, r.int(40, 96), r.int(10, 20), x, { k }); if (r.chance(0.5)) V.hoodoo(pb, x + r.int(12, 20), base, r.int(24, 50), r.int(7, 12), x + 7, { k }); }
      const c = V.crystals(pb, x + r.int(-10, 10), base - 1, r.int(1, 3), x, { k });
      hoodFx.glints.push(...c.glints.map(([gx, gy]) => [gx, gy, 3]));
    }
    V.saltVeins(pb, { seed: 125, every: 7, col: '#ffe8f4' });
  }, {
    tag: 'hoodoos', dyn: (g, cam, Ly) => { const [ox, oy] = B.vofs(Ly, cam); V.drawPulse(g, hoodFx.glints, ox, oy, T(), '#9ff6f8', 0.4, 0.3, 2.2); },
  });
  /* ---------------- costra salina con laguna y flamencos (0,5) ---------------- */
  const flatFx = { fl: [] };
  P(0.5, 236, 60, (pb, w, h) => {
    const k = 0, r = RNG(131);
    V.saltCrust(pb, 0, w, 0, h, { k, seed: 133, sparse: 50, ramp: ['#7a4a7a', '#a0689a', '#c48cb8', '#e0b0d0', '#f2d0e4', '#ffe8f4'] });
    // laguna somera rosa con reflejo del cielo
    const LG = V.P32(['#8a2a6a', '#c04a90', '#e878b4', '#ffc4e0']);
    for (let x0 = 80; x0 < w; x0 += r.int(260, 420)) { const lw = r.int(90, 170); for (let y = 8; y < 20; y++) for (let x = x0; x < x0 + lw; x++) { const e = Math.abs(x - x0 - lw / 2) / (lw / 2); if (e > 1 - (y - 8) * 0.02 - (hash2(x >> 2, y, 9) * 0.08)) continue; V.put(pb, x, y, LG[y === 8 ? 3 : ((x + y * 5) % 23 < 3) ? 3 : 1 + ((y >> 2) & 1)]); } for (let i = 0; i < 5; i++) flatFx.fl.push({ x: x0 + 14 + i * r.int(12, 22), y: 4 + r.int(0, 6) }); }
    for (let x = 10; x < w; x += r.int(30, 70)) V.crystals(pb, x, r.int(24, 40), r.int(1, 2), 13100 + x, { k });
  }, {
    tag: 'flat', dyn: (g, cam, Ly) => { const [ox, oy] = B.vofs(Ly, cam), t = T(); V.drawFlamingos(g, flatFx.fl, ox, oy, t); V.drawMotes(g, 14, t, 37, { y0: 120, y1: 270, col: '#ffe0f0' }); },
  });
  for (const Lb of labels) Lb.when = (sc) => !V.labelClash(Lb, sc);
  BIOME_LABELS.canyon = labels;
  B.vistaInfo = { planes: B.layers.length, ms: Object.assign({}, V.stats.ms) };
  return B;
};

BIOME_LABELS.canyon = BIOME_LABELS.canyon || [];
