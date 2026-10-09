/* =====================================================================
   1d_bio_windcliffs.js — BIOMA TORRES DE BRISA (Nivel 05) con el kit
   VISTA: costa de acantilados ventosa en cian, blanco, azul y verde.
   Planos: cielo+sol (0) · cirros/cúmulos rápidos (0,01–0,07) · mar con
   parque eólico marino en filas que se alejan (0,08) · cabos lejanos con
   faro y aerogeneradores (0,1) · acantilados medios con el parque eólico
   del altiplano, mástil meteorológico y rompientes (0,18) · borde del
   altiplano con matas floridas, mangas de viento y cometas (0,3) ·
   pradera peinada por el viento (0,45). Líneas de viento y gaviotas.
   Contrato: B.horizon, B.sun, B.seaY(cam), B.weather.wind (lo sube el
   nivel con la velocidad del viento: nubes, rotores y mangas se aceleran).
   ===================================================================== */
var BIOME_LABELS = (typeof BIOME_LABELS !== 'undefined') ? BIOME_LABELS : {};

BIOMES.windcliffs = function (L) {
  const V = VISTA;
  const B = new Backdrop(L.width, L.height);
  const HZ = 150;
  const SUN = { x: 112, y: 40, r: 11, halo: 26 };
  B.horizon = HZ; B.sun = SUN; B.seaY = () => HZ;
  B.weather.wind = 0.9;
  const T = () => Game.time;
  const WND = () => 0.6 + (B.weather.wind || 0) * 0.6;
  const P = (f, ys, h, draw, opts) => B.vplane(f, ys - Math.round(V.CAMY * f * 0.3), h, draw, opts);
  const turbines = (list) => (g, cam, Ly) => {
    const [ox, oy] = B.vofs(Ly, cam), t = T(), sp = WND();
    for (const tb of list) { const x = tb.x + ox; if (x < -30 || x > W + 30) continue; if (!tb.rot) tb.rot = V.rotor(tb.R, { k: tb.k }); V.drawRotor(g, tb.rot, x, tb.y + oy, t * tb.sp * sp + tb.ph); }
  };
  const labels = [];
  /* ---------------- cielo de brisa ---------------- */
  B.sky = V.timed('sky', () => {
    const pb = V.sky(W, H, {
      horizonY: HZ, sun: SUN, curve: 1.2,
      stops: ['#1048b8', '#1a58c8', '#2468d6', '#3478e2', '#4a8cec', '#62a0f2', '#80b6f4', '#a2caf4', '#c4daf2', '#dce6f2'],
      haze: ['#d4e0f0', '#dce6f0', '#e4ecf0', '#eef2f2'],
    });
    V.rays(pb, SUN.x, SUN.y, { n: 6, len: 240, col: '#f4fbff', a: 0.07, spread: 1.6, ang: Math.PI / 2 - 0.35, w: 0.04, seed: 12, yMax: HZ });
    return pb.toCanvas();
  });
  B.vdyn(0, (g) => V.drawBloom(g, SUN.x, SUN.y, 40, '#f0f8ff', 0.2, T()), { tag: 'bloom' });
  B.cloudDeck({ kind: 'cirrus', n: 8, seed: 81, f: [0.01, 0.03], y: [6, 56], w: [90, 190], speed: [3, 5] });
  B.cloudDeck({ n: 9, seed: 83, f: [0.03, 0.07], y: [-6, 58], w: [50, 130], bias: 0.6, speed: [5, 9], sunX: SUN.x });
  B.vdyn(0.02, (g) => V.drawWind(g, 14, T(), 3, { y0: 20, y1: 140, speed: 150 * WND(), len: 30, a: 0.35 }), { tag: 'windHigh' });
  /* ---------------- mar con parque eólico marino (0,08) ---------------- */
  const seaT = [];
  P(0.08, HZ, H - HZ + 10, (pb, w, h) => {
    V.seaFar(pb, 0, h, { seed: 13, stops: ['#a9c8ea', '#5aaae6', '#2690de', '#0a7fd0', '#0679c6', '#0573b8', '#066aa8', '#06609a'] });
    // filas de aerogeneradores marinos (más pequeños cuanto más lejos)
    for (const [yy, th, R, gap, k] of [[4, 9, 4, 22, 0.5], [9, 14, 5, 30, 0.42], [17, 21, 7, 40, 0.32], [28, 30, 10, 54, 0.22]]) {
      for (let x = 300 + (yy * 7) % 20; x < w - 20; x += gap) {
        const y = yy + 1;
        V.rect(pb, x - 1, y, 3, 1, U(V.hzc('#e8c040', k)));
        const hub = V.turbineTower(pb, x, y, th, { k, w: th > 20 ? 2 : 1 });
        seaT.push({ x: hub.hx, y: hub.hy, R, k, sp: 2.4 + (x % 7) * 0.15, ph: x * 0.3 });
      }
    }
  }, {
    tag: 'sea', dyn: (g, cam, Ly) => {
      const [, oy] = B.vofs(Ly, cam);
      V.drawSeaFx(g, 0, oy, W, 120, T(), { sunX: SUN.x, density: 1 });
      turbines(seaT)(g, cam, Ly);
    },
  });
  B.cloudDeck({ n: 4, seed: 85, f: [0.08, 0.1], y: [62, 100], w: [80, 130], speed: [4, 6], sunX: SUN.x, tall: true, haze: 0.05 });
  /* ---------------- cabos lejanos con faro (0,1) ---------------- */
  const capeT = [], capeFx = { beam: null };
  P(0.1, 120, 56, (pb, w, h) => {
    const k = 0.3, base = h - 4;
    const C = V.headlands(pb, { seed: 87, k, base, yTop: [16, 30], w: [70, 170], gap: [30, 110], x0: 150, x1: w });
    let n = 0;
    for (const [a, b, yT] of C.spans) { const x = Math.round((a + b) / 2); if (n++ % 2 === 0) { const hub = V.turbineTower(pb, x, C.top[x] + 1, 16, { k: 0.38, w: 1 }); capeT.push({ x: hub.hx, y: hub.hy, R: 6, k: 0.38, sp: 2.2, ph: x }); } else if (x + 14 < b) for (let q = 0; q < 3; q++) V.house(pb, x + q * 7 - 7, C.top[x + q * 7 - 7] + 1, 5, 4, 8700 + x + q, { k }); }
    const sp0 = C.spans[0]; if (sp0) { const lx = sp0[0] + 18; const lh = V.lighthouse(pb, lx, C.top[lx] + 1, 14, { k }); capeFx.beam = [lh.lx, lh.ly]; }
  }, {
    tag: 'capes', dyn: (g, cam, Ly) => {
      turbines(capeT)(g, cam, Ly);
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      if (capeFx.beam && Math.floor(t * 1.2) % 3 === 0) V.drawGlow(g, capeFx.beam[0] + ox, capeFx.beam[1] + oy, 5, '#fff2a0', 0.8);
    },
  });
  /* ---------------- cabos medios con el parque del altiplano (0,18) ---------------- */
  const midT = [], midFx = { surf: [], fauna: [] };
  P(0.18, 146, 86, (pb, w, h) => {
    const k = 0.14, r = RNG(91), base = h - 6;
    const C = V.headlands(pb, { seed: 93, k, base, yTop: [14, 30], w: [150, 290], gap: [70, 160], x0: 60, x1: w });
    for (const [a, b] of C.spans) {
      for (let x = a + 30; x < b - 24; x += r.int(34, 50)) {
        const y = C.top[x]; if (y > base - 16) continue;
        const th = r.int(36, 52), hub = V.turbineTower(pb, x, y + 1, th, { k: 0.2 });
        midT.push({ x: hub.hx, y: hub.hy, R: Math.round(th * 0.36), k: 0.2, sp: 2 + (x % 5) * 0.2, ph: x * 0.2 });
      }
      const mx = Math.round(a + (b - a) * 0.7); if (C.top[mx] < base - 20) V.metMast(pb, mx, C.top[mx] + 1, 40, { k });
      V.windGrass(pb, a, b, (x) => C.top[x] + 1, { k, seed: 95 + a, density: 0.5, h: 3 });
      for (let x = a + 6; x < b - 6; x += r.int(16, 36)) V.flowerBush(pb, x, C.top[x] + 2, r.int(2, 3), 9500 + x, { k });
      midFx.surf.push({ x0: a, x1: b, y: base + 1 });
    }
    midFx.fauna.push({ kind: 'gull', x: 200, y: 20, r: 300, sp: 9 }, { kind: 'gull', x: 220, y: 28, r: 280, sp: 8 }, { kind: 'gull', x: 900, y: 14, r: 320, sp: -10 }, { kind: 'eagle', x: 600, y: 4, r: 140 });
  }, {
    tag: 'mid', dyn: (g, cam, Ly) => {
      turbines(midT)(g, cam, Ly);
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      V.drawSurf(g, midFx.surf, ox, oy, t);
      V.drawFauna(g, midFx.fauna, ox, oy, t);
    },
  });
  /* ---------------- borde del altiplano: matas, mangas, cometas (0,3) ---------------- */
  const edgeT = [], edgeFx = { socks: [], kites: [] };
  P(0.3, 196, 92, (pb, w, h) => {
    const k = 0.06, r = RNG(101);
    const topF = (x) => 24 + 9 * Math.sin(x * 0.005 + 2.2) + 7 * fbm1(x * 0.025, 3, 13);
    const G = V.P32(V.hz(V.RAMPS.meadow, k)), RK = V.P32(V.hz(V.RAMPS.cliff, k)), tops = new Int16Array(w);
    for (let x = 0; x < w; x++) {
      const ty = Math.round(topF(x)); tops[x] = ty;
      for (let y = ty; y < h; y++) { const d = y - ty; V.put(pb, x, y, G[clamp(d < 1 ? 7 : d < 3 ? 6 : 5 - ((hash2(x >> 1, y >> 1, 21) < 0.35) ? 1 : 0) - (d > 24 ? 1 : 0), 0, 7)]); }
      // labio rocoso del borde del altiplano
      if (hash2(x >> 3, 2, 5) < 0.3) { V.put(pb, x, ty + 1, RK[6]); V.put(pb, x, ty + 2, RK[4]); }
    }
    for (let x = 160; x < w; x += r.int(300, 460)) { const y = tops[x]; const th = r.int(66, 80), hub = V.turbineTower(pb, x, y + 1, th, { k: 0.08 }); edgeT.push({ x: hub.hx, y: hub.hy, R: Math.round(th * 0.38), k: 0.08, sp: 2.2, ph: x }); }
    V.windGrass(pb, 0, w, (x) => tops[x] + 1, { k, seed: 105, density: 0.75, h: 5, lean: 1.6 });
    for (let x = 10; x < w; x += r.int(14, 34)) V.flowerBush(pb, x, tops[x] + 3 + r.int(0, 8), r.int(3, 5), 10500 + x, { k });
    for (let x = 60; x < w; x += r.int(160, 260)) { const y = tops[x] + 2; for (let q = 0; q < 14; q++) V.put(pb, x, y - q, U(q > 11 ? '#e83b41' : '#e8e4de')); edgeFx.socks.push({ x, y: y - 13 }); }
    for (let x = 0; x < w; x++) if (hash2(x >> 4, 1, 7) < 0.35) { const y = tops[x] + 6; if ((x & 7) === 0) for (let q = 1; q < 6; q++) V.put(pb, x, y - q + 1, U('#8a5a34')); V.put(pb, x, y - 3, U('#b07a50')); }
    const KC = ['#e34ad8', '#56e5ff', '#ffe14d', '#3fe0a0'];
    for (let x = 200, i = 0; x < w; x += r.int(300, 460), i++) edgeFx.kites.push({ x, y: -70 - r.int(0, 40), col: KC[i % 4], sp: 1.2, ph: i * 1.7, tail: 12, line: [r.int(-20, 0), 46] });
    labels.push({ x: 380, y: 160, f: 0.3, title: 'EÓLICA MARINA', sub: 'Parque en el mar', kind: 'water', ax: 360, ay: 176, camX: [0, 700] });
  }, {
    tag: 'edge', dyn: (g, cam, Ly) => {
      turbines(edgeT)(g, cam, Ly);
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      V.drawSocks(g, edgeFx.socks, ox, oy, t, B.weather.wind || 1);
      V.drawKites(g, edgeFx.kites, ox, oy, t);
    },
  });
  /* ---------------- pradera peinada por el viento (0,45) ---------------- */
  P(0.45, 232, 64, (pb, w, h) => {
    const k = 0, r = RNG(111);
    const topF = (x) => 16 + 8 * Math.sin(x * 0.004 + 0.4) + 7 * fbm1(x * 0.03, 3, 17);
    const G = V.P32(V.RAMPS.meadow), RK = V.P32(V.RAMPS.cliff);
    const tops = new Int16Array(w);
    for (let x = 0; x < w; x++) {
      const ty = Math.round(topF(x)); tops[x] = ty;
      for (let y = ty; y < h; y++) { const d = y - ty; V.put(pb, x, y, G[clamp(d < 1 ? 7 : d < 3 ? 6 : 4 - ((hash2(x >> 1, y >> 1, 19) < 0.35) ? 1 : 0) - (d > 30 ? 1 : 0), 0, 7)]); }
    }
    for (let x = 10; x < w; x += r.int(30, 80)) { const y = tops[x] + r.int(6, 20); V.ellipse(pb, x, y, r.int(4, 8), r.int(2, 4), (nx, ny) => RK[clamp(Math.round(6 - nx * 2 - ny * 3), 0, 8)]); }
    V.windGrass(pb, 0, w, (x) => tops[x], { k, seed: 113, density: 0.9, h: 7, lean: 2 });
    for (let x = 6; x < w; x += r.int(10, 26)) V.flowerBush(pb, x, tops[x] + r.int(2, 10), r.int(2, 4), 11300 + x, { k });
  }, { tag: 'meadow', dyn: (g) => { const t = T(); V.drawWind(g, 10, t, 7, { y0: 150, y1: 270, speed: 200 * WND(), len: 22, a: 0.4 }); V.drawMotes(g, 10, t, 23, { y0: 120, y1: 260, col: '#ffe0f4' }); } });
  for (const Lb of labels) Lb.when = (sc) => !V.labelClash(Lb, sc);
  BIOME_LABELS.windcliffs = labels;
  B.vistaInfo = { planes: B.layers.length, ms: Object.assign({}, V.stats.ms) };
  return B;
};

BIOME_LABELS.windcliffs = BIOME_LABELS.windcliffs || [];
