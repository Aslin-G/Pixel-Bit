/* =====================================================================
   1d_bio_canyon.js — BIOMA CAÑONES DE SAL (Nivel 03) con el kit VISTA.
   Anochecer azul profundo → violeta → coral; roca esculpida en 3/4.
   Ronda 2 (r2-biomes-a): las pilas de bloques lavanda y las bandas de
   salinas a todo lo ancho se sustituyen por RELIEVE SOMBREADO:
     cielo + sol bajo + estrellas (0) · cirros y cúmulos coral (0,01–0,07)
     · borde lejano del cañón en mesetas (0,05) · mar del ocaso (0,08)
     · paredes del cañón estratificadas con repisas iluminadas, cárcavas,
       talud y matas, mástil y aerogeneradores en el borde (0,14)
     · salinas en terrazas irregulares sobre la vega, naves, montones de
       sal y emisario con difusor y pluma (0,22)
     · campo de chimeneas de hadas con sombrero y farallones (0,34)
     · vega salina con lagunas, flamencos y matorral cada ~30 px (0,5)
   Magenta solo en emisivos de salmuera (pluma, boyas); el resto coral.
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
  // r2-biomes-a: cada plano pasa por la guarda de tono (malvas/rosas → violeta o granate; magenta < 3 %)
  const P = (f, ys, h, draw, opts) => B.vplane(f, ys - Math.round(V.CAMY * f * 0.3), h, (pb, w, hh) => { const res = draw(pb, w, hh); V.r2baHueGuard(pb, { hi: 359, redH: 4 }); return res; }, opts);
  const labels = [];
  const ROCK = V.RAMPS.canyonR2, VEG = V.RAMPS.canyonVegR2;
  const turbines = (list) => (g, cam, Ly) => {
    const [ox, oy] = B.vofs(Ly, cam), t = T();
    for (const tb of list) { const x = tb.x + ox; if (x < -30 || x > W + 30) continue; if (!tb.rot) tb.rot = V.rotor(tb.R, { k: tb.k }); V.drawRotor(g, tb.rot, x, tb.y + oy, t * tb.sp + tb.ph); }
  };
  /* ---------------- cielo del ocaso (sin magenta: violeta → coral → melocotón) ---------------- */
  B.sky = V.timed('sky', () => {
    const pb = V.sky(W, H, {
      horizonY: HZ, sun: SUN, curve: 0.95,
      stops: ['#0a1046', '#121a5a', '#1c226c', '#2a287c', '#3a2e88', '#4e3690', '#624098', '#74489a', '#b4646c', '#d0707a', '#e4846e', '#f6a272'],
      haze: ['#f0a07c', '#f8b480', '#fcc888', '#ffdca0'],
    });
    V.sunDisc(pb, SUN.x, SUN.y, SUN.r, SUN.halo, 'dusk');
    V.rays(pb, SUN.x, SUN.y, { n: 9, len: 320, col: '#ffd8b0', a: 0.08, spread: 2.8, ang: -Math.PI / 2, w: 0.05, seed: 14, yMax: HZ });
    V.r2baHueGuard(pb, { hi: 359, redH: 4 });
    return pb.toCanvas();
  });
  B.vdyn(0, (g) => { const t = T(); V.drawStars(g, 46, t, 31, { y1: 96, a: 0.85 }); V.drawBloom(g, SUN.x, SUN.y, 64, '#ff9a70', 0.24, t); }, { tag: 'stars+bloom' });
  const CIR = ['#6a4c94', '#8a6a9e', '#e09a8a', '#ffd8bc'];
  const DUSK = ['#2e2462', '#46307a', '#5e3e8c', '#7a5292', '#b46a6a', '#d87a7c', '#f0987e', '#fcb88a', '#ffd6a0', '#fff0c8'];
  B.cloudDeck({ kind: 'cirrus', n: 8, seed: 91, f: [0.01, 0.03], y: [16, 96], w: [90, 190], speed: [1, 2], pal: CIR });
  B.cloudDeck({ n: 9, seed: 93, f: [0.03, 0.07], y: [4, 84], w: [56, 140], bias: 0.6, speed: [1.5, 3], sunX: SUN.x, pal: DUSK });
  const skyFauna = [{ kind: 'eagle', x: 360, y: 46, r: 120 }, { kind: 'gull', x: 200, y: 70, r: 260, sp: 7 }, { kind: 'gull', x: 214, y: 76, r: 250, sp: 6 }, { kind: 'gull', x: 760, y: 58, r: 300, sp: -8 }, { kind: 'drone', x: 980, y: 64, r: 30 }];
  B.vdyn(0.06, (g, cam) => V.drawFauna(g, skyFauna, -Math.round(cam.x * 0.06), 0, T()), { tag: 'skyFauna' });
  /* ---------------- borde lejano del cañón en mesetas (0,05) ---------------- */
  P(0.05, 96, 74, (pb, w, h) => {
    const r = RNG(97), list = [];
    for (let x = -30; x < w + 60;) { const ww = r.int(36, 90); list.push({ x: x + ww / 2, v: r.int(10, 30), w: ww / 2, d: r.int(8, 14), h: r.int(16, 46), step: r.int(6, 9), p: 3.6 }); x += ww + r.int(-10, 40); }
    V.r2baRelief(pb, {
      yBase: h - 1, nv: 40, dvy: 0.3, seed: 97, hMax: 46, H: V.r2baMesaH(list, { seed: 97, gully: 0.1 }),
      ramp: ROCK, contrast: 1.8, t0: 0.5, facet: 0.3, flatK: 0.12, strata: { L: [4, 8], hard: 0.04, soft: 0.04, lip: 0.1, under: 0.08, warp: 3 }, haze: { col: '#9a7ab4', k0: 0.42, k: 0.16 }, mist: { col: '#d8a0a8', h: 16, k: 0.55 }, rim: '#ffc8a0', tex: 0.03,
    });
  }, { tag: 'far' });
  /* ---------------- mar del ocaso (0,08) ---------------- */
  P(0.08, HZ, 70, (pb) => V.seaFar(pb, 0, pb.h, { seed: 99, stops: ['#f8b49a', '#c87a8e', '#7c5a9e', '#5a4a98', '#3a4290', '#2e3c88', '#2a3a80', '#26367a'], horizonCol: '#ffd0b0' }), {
    tag: 'sea', dyn: (g, cam, Ly) => { const [, oy] = B.vofs(Ly, cam); V.drawSeaFx(g, 0, oy, W, 60, T(), { sunX: SUN.x, density: 0.6 }); },
  });
  B.cloudDeck({ n: 4, seed: 95, f: [0.08, 0.1], y: [76, 120], w: [90, 150], speed: [1, 2], sunX: SUN.x, tall: true, haze: 0.1, hazeCol: '#c8949a', pal: DUSK });
  /* ---------------- paredes del cañón estratificadas (0,14) ---------------- */
  const wallT = [];
  P(0.14, 46, 168, (pb, w, h) => {
    const r = RNG(103), list = [];
    // mesetas que suben hacia la derecha de cada tramo (diagonal abajo-izquierda → arriba-derecha)
    for (let x = -40, i = 0; x < w + 80; i++) {
      const ww = r.int(70, 150), ph = (x % 520) / 520;
      list.push({ x: x + ww / 2, v: r.int(14, 34), w: ww / 2, d: r.int(12, 22), h: Math.round(54 + ph * 56 + r.int(-10, 14)), step: r.int(8, 12), p: 3 + r.range(0, 1.2), wall0: r.range(0.62, 0.78) });
      if (r.chance(0.5)) list.push({ x: x + ww * r.range(0.1, 0.9), v: r.int(2, 8), w: r.int(14, 30), d: 8, h: r.int(18, 34), step: r.int(6, 9), p: 2.6 });
      x += ww + r.int(-20, 30);
    }
    const info = V.r2baRelief(pb, {
      yBase: h - 1, nv: 48, dvy: 0.32, seed: 103, hMax: 120, H: V.r2baMesaH(list, { seed: 103, gully: 0.16 }),
      ramp: ROCK, contrast: 2.3, t0: 0.46, facet: 0.34, cav: 0.08, hgtK: 0.1, spanDark: 0.007, flatK: 0.2,
      strata: { L: [5, 11], hard: 0.05, soft: 0.06, lip: 0.16, under: 0.13, warp: 4, salt: { every: 5, col: '#ffe4dc', k: 0.28 } }, shadeHue: '#2a1a64', shadeK: 0.35,
      haze: { col: '#8e78b0', k0: 0.18, k: 0.12 }, mist: { col: '#d89aa4', h: 30, k: 0.6 }, rim: '#ffd0a0', rimK: 0.7, tex: 0.04,
      veg: { ramp: V.hz(VEG, 0.2, '#8e78b0'), density: 0.06, maxSlope: 0.25, minY: 30, size: 1.6 },
    });
    // mástil y aerogeneradores pequeños en el borde de las mesetas más altas
    for (const x of [130, 560, 830]) {
      if (x >= w - 20) continue;
      let bx = x; for (let q = -24; q <= 24; q++) if (info.top[x + q] < info.top[bx]) bx = x + q;
      const y = info.top[bx] + 2; if (y > h - 60) continue;
      const hub = V.turbineTower(pb, bx, y, 24, { k: 0.3, w: 2 });
      wallT.push({ x: hub.hx, y: hub.hy, R: 9, k: 0.3, sp: 1.8 + (x % 7) * 0.2, ph: x });
    }
  }, { tag: 'walls', dyn: turbines(wallT) });
  /* ---------------- salinas en terrazas sobre la vega (0,22) ---------------- */
  const panFx = { glints: [], buoys: [], outfall: null, fauna: [] };
  const PAN_YS = 150;
  P(0.22, PAN_YS, 84, (pb, w, h) => {
    const k = 0.07, r = RNG(111);
    // vega: lomas bajas de roca y tierra con matas (relieve)
    const list = [];
    for (let x = 0; x < w + 60; x += r.int(90, 160)) if (hash1(x, 3) < 0.6) list.push({ x, v: r.int(1, 6), w: r.int(16, 34), d: r.int(3, 5), h: r.int(5, 14), step: 4, p: 2.2, tal: 0.5 });
    const MH = V.r2baMesaH(list, { seed: 113 });
    const info = V.r2baRelief(pb, {
      yBase: h - 1, nv: 30, dvy: (h - 12) / 30, seed: 113, flatK: 0.06, strata: { L: [3, 6], hard: 0.04, soft: 0.04, lip: 0.1, under: 0.08 }, hMax: 14, H: (u, v) => 1 + 1.6 * fbm(u * 0.03, v * 0.2, 2, 5) + MH(u, v),
      ramp: ROCK, contrast: 1.5, t0: 0.4, facet: 0.3, spanDark: 0.02, haze: { col: '#9a7ab0', k0: 0.1, k: 0.06 }, rim: '#ffd0a0', tex: 0.05,
    });
    // salinas en grupos con huecos de vega entre medias (no bandas a todo lo ancho)
    for (const [a, b, s0] of [[40, 230, 117], [560, 720, 118], [930, 1070, 119]]) {
      if (a >= w) continue;
      const S = V.r2baPans(pb, { x0: a, x1: Math.min(w, b), y0: 12, rows: 4, seed: s0, k, sky: '#f8c0a0', skew: 3 });
      panFx.glints.push(...S.glints);
    }
    // montones de sal cosechada, cinta transportadora y naves blancas de la salinera
    const CR = V.P32(V.hz(['#6e5a7e', '#9a86a4', '#c4b2c6', '#e2d6e2', '#f8f2f6', '#ffffff'], k));
    for (const x of [318, 800]) {
      for (let q = 0; q < 4; q++) { const cx = x + q * 11, cy = 34 + q * 2, rr = 6 + (q % 2) * 2; V.poly(pb, [[cx - rr - 2, cy], [cx, cy - rr], [cx + rr, cy]], (px, py) => CR[px < cx - 1 ? 5 : px < cx + 2 ? 3 : 1 + ((py + px) % 5 === 0 ? 1 : 0)]); }
      V.line(pb, x - 14, 44, x + 44, 20, () => U('#3a3448')); V.line(pb, x - 14, 43, x + 44, 19, () => U('#8a8aa0'));
      for (let q = 0; q < 6; q++) V.put(pb, x - 14 + q * 10, 46 - q * 4, U('#2a2438'));
      // naves de la salinera: muros encalados con sombra lateral, tejado a dos aguas de teja y puerta
      const ROOF = V.P32(V.hz(['#4a1e1e', '#7a2e24', '#a8462e', '#d06a3e', '#f0985a'], k));
      for (const [bx, by, bw, bh] of [[x + 46, 30, 22, 8], [x + 71, 33, 14, 6]]) {
        V.box3q(pb, bx, by, bw, bh, 5, { ramp: V.ARCH.WHITE, k });
        for (let q = 0; q <= 4; q++) for (let xx = bx - 1 + q; xx <= bx + bw + 1 - q; xx++) V.put(pb, xx + 2, by - bh - 1 - q, ROOF[q === 4 ? 4 : xx < bx + bw / 2 ? 3 - (q & 1) : 1 + (q & 1)]);
        for (let yy = by - 4; yy < by; yy++) { V.put(pb, bx + 3, yy, U('#3a2a3a')); V.put(pb, bx + 4, yy, U('#3a2a3a')); }
        V.put(pb, bx + bw - 5, by - bh + 3, U('#ffd890')); V.put(pb, bx + bw - 4, by - bh + 3, U('#ffd890'));
      }
    }
    V.r2baTufts(pb, (x) => info.top[x] < h - 2 ? info.top[x] + 1 : null, 0, w, 119, { k, gap: 12, big: 3 });
    // emisario: tubería grafito hacia el mar con difusor y boyas de vigilancia
    const ex = 300;
    V.pipe(pb, [[ex, 44], [ex, 12], [ex + 60, 12], [ex + 60, 4]], 1, ['#080e26', '#212846', '#3a405d', '#555a78', '#787a9b'], { k: 0 });
    panFx.outfall = { x: ex + 60, y: 2 };
    panFx.buoys.push([ex + 70, 0, '#f5dc5a'], [ex + 100, 1, '#e83b41'], [ex + 40, -1, '#f5dc5a'], [ex + 600, 0, '#e83b41'], [ex + 640, 1, '#f5dc5a']);
    panFx.fauna.push({ kind: 'drone', x: 420, y: -10, r: 26 }, { kind: 'gull', x: 640, y: -16, r: 200, sp: 6 });
    labels.push({ x: 196, y: PAN_YS - 8, f: 0.22, title: 'SALINAS', sub: 'Evaporación por etapas', kind: 'brine', ax: 180, ay: PAN_YS + 20, camX: [0, 1100] });
    // r3-desert: la etiqueta EMISARIO del fondo se retira (el emisario, el difusor y la zona de mezcla se ven en el plano jugable)
  }, {
    tag: 'pans', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      V.drawGlints(g, panFx.glints, ox, oy, t);
      V.drawBuoys(g, panFx.buoys, ox, oy, t);
      V.drawFauna(g, panFx.fauna, ox, oy, t);
      if (panFx.outfall) { const x = panFx.outfall.x + ox; if (x > -30 && x < W + 30) V.drawPlume(g, x, panFx.outfall.y + oy, t, { n: 16, len: 26 }); }
    },
  });
  /* ---------------- campo de chimeneas de hadas y farallones (0,34) ---------------- */
  const hoodFx = { glints: [] };
  P(0.34, 80, 150, (pb, w, h) => {
    const k = 0.03, r = RNG(121), base = h - 1;
    // farallones en relieve (mesetas estrechas con talud) que dan masa al plano
    const list = [];
    for (let x = 60; x < w; x += r.int(220, 340)) list.push({ x, v: r.int(6, 12), w: r.int(22, 40), d: r.int(6, 10), h: r.int(70, 112), step: r.int(7, 10), p: 2.8, wall0: 0.6, tal: 0.5, t0: 0.16 });
    const info = V.r2baRelief(pb, {
      yBase: base, nv: 22, dvy: 0.3, seed: 123, hMax: 112, H: V.r2baMesaH(list, { seed: 123, gully: 0.18 }),
      ramp: ROCK, contrast: 2.4, t0: 0.46, facet: 0.34, cav: 0.08, flatK: 0.2,
      strata: { L: [5, 10], hard: 0.06, soft: 0.06, lip: 0.18, under: 0.14, warp: 3, salt: { every: 6, col: '#ffe4dc', k: 0.3 } }, shadeHue: '#2a1a64', shadeK: 0.35, haze: { col: '#9a7ab0', k0: 0.04, k: 0.04 }, rim: '#ffd8a8', rimK: 0.75, tex: 0.05,
      veg: { ramp: VEG, density: 0.08, maxSlope: 0.3, minY: 20, size: 1.8 },
    });
    // chimeneas de hadas en grupos de 2–4 delante de los farallones
    for (let x = 20; x < w; x += r.int(70, 150)) {
      const n = r.int(1, 3);
      for (let q = 0; q < n; q++) {
        const hx = x + q * r.int(10, 18), hh = r.int(30, 84) - q * 10, rr = r.int(4, 8);
        const top = V.r2baHoodoo(pb, hx, base - r.int(0, 3), hh, rr, 1210 + hx, { k, veg: true });
        if (r.chance(0.5)) { const c = V.crystals(pb, top.top[0], top.top[1] + 1, 1, hx, { k }); hoodFx.glints.push(...c.glints.map(([gx, gy]) => [gx, gy, 3])); }
      }
    }
    V.r2baTufts(pb, (x) => base - 1, 0, w, 125, { k, gap: 9, big: 3 });
    for (let x = 10; x < w; x += r.int(40, 90)) { const c = V.crystals(pb, x, base - 1, r.int(1, 2), 1250 + x, { k }); hoodFx.glints.push(...c.glints.map(([gx, gy]) => [gx, gy, 3])); }
    void info;
  }, {
    tag: 'hoodoos', dyn: (g, cam, Ly) => { const [ox, oy] = B.vofs(Ly, cam); V.drawPulse(g, hoodFx.glints, ox, oy, T(), '#9ff6f8', 0.4, 0.3, 2.2); },
  });
  /* ---------------- vega salina con lagunas y flamencos (0,5) ---------------- */
  const flatFx = { fl: [], glints: [] };
  P(0.5, 210, 64, (pb, w, h) => {
    const k = 0, r = RNG(131);
    // suelo en relieve bajo (lomas de roca y tierra), costra salina en las hondonadas
    const list = [];
    for (let x = 0; x < w + 60; x += r.int(90, 170)) list.push({ x, v: r.int(2, 8), w: r.int(26, 50), d: 6, h: r.int(6, 16), step: 4, p: 2.2, tal: 0.6 });
    const info = V.r2baRelief(pb, {
      yBase: h - 1, nv: 26, dvy: 0.5, seed: 133, flatK: 0.1, strata: { L: [3, 6], hard: 0.04, soft: 0.04, lip: 0.1, under: 0.1 }, hMax: 20, H: (u, v) => 4 + 2.5 * fbm(u * 0.03, v * 0.15, 2, 9) + V.r2baMesaH(list, { seed: 133 })(u, v),
      ramp: ROCK, contrast: 1.6, t0: 0.44, facet: 0.3, rim: '#ffd8a8', tex: 0.06,
    });
    const CR = V.P32(['#6e5a7e', '#9a86a4', '#c4b2c6', '#e2d6e2', '#f6eef4']);
    const LG = V.P32(['#1c2a6a', '#2a4a9a', '#4a7ac0', '#9ac8e8', '#fff0e0']);
    for (let x0 = 60; x0 < w; x0 += r.int(240, 380)) {
      const lw = r.int(60, 120), cy = r.int(10, 18);
      // costra blanca alrededor y laguna somera azul con reflejo del ocaso (bordes elípticos, no rectángulo)
      V.ellipse(pb, x0 + lw / 2, cy, lw / 2 + 6, 6, (nx, ny, d, px, py) => d > 0.8 && hash2(px >> 1, py, 7) < 0.5 ? 0 : CR[clamp(Math.round(3 - ny * 1.5 + (hash2(px, py, 3) - 0.5)), 0, 4)]);
      V.ellipse(pb, x0 + lw / 2, cy, lw / 2, 4, (nx, ny, d, px) => LG[ny < -0.6 ? 0 : d > 0.75 ? 1 : ((px + cy) % 17 < 2) ? 4 : ny < 0 ? 2 : 3]);
      for (let i = 0; i < 5; i++) flatFx.fl.push({ x: x0 + 10 + i * r.int(10, 18), y: cy - 6 + r.int(-1, 2) });
      flatFx.glints.push({ x: x0 + 6, y: cy, len: lw - 12, ph: r.range(0, 1.6), sp: 0.1, col: '#ffe0c8', w: 2 });
    }
    V.r2baTufts(pb, (x) => info.top[x] < h - 1 ? info.top[x] + 1 : null, 0, w, 135, { gap: 14, big: 4 });
    for (let x = 10; x < w; x += r.int(30, 60)) V.crystals(pb, x, r.int(30, 44), r.int(1, 2), 13100 + x, { k });
  }, {
    tag: 'flat', dyn: (g, cam, Ly) => { const [ox, oy] = B.vofs(Ly, cam), t = T(); V.drawGlints(g, flatFx.glints, ox, oy, t); V.drawFlamingos(g, flatFx.fl, ox, oy, t); V.drawMotes(g, 14, t, 37, { y0: 120, y1: 270, col: '#ffe0d0' }); },
  });
  for (const Lb of labels) Lb.when = (sc) => !V.labelClash(Lb, sc);
  BIOME_LABELS.canyon = labels;
  B.vistaInfo = { planes: B.layers.length, ms: Object.assign({}, V.stats.ms) };
  return B;
};

BIOME_LABELS.canyon = BIOME_LABELS.canyon || [];
