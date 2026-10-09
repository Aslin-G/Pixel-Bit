/* =====================================================================
   1d_bio_pvdunes.js — BIOMA DUNAS FOTÓNICAS (Nivel 04) con el kit VISTA.
   Mediodía de calor: sol blanco con gran resplandor, cielo profundo.
   Planos: cielo+sol (0) · cirros (0,01–0,03) · cúmulos que proyectan
   sombra (0,12–0,22) · mesetas violetas con aerogeneradores lejanos
   (0,05) · dunas lejanas con espejismo y ARIDIA a lo lejos (0,08) ·
   llanura con el gran campo FV en perspectiva y torres de alta tensión
   (0,16) · dunas medias con seguidores FV, inversores y línea eléctrica
   (0,28) · cresta de duna cercana con cardones, agaves y cercas (0,42).
   Contrato: B.horizon, B.sun, B.cloudShadowAt(worldX) (lo lee el nivel
   para bajar la corriente de cada string: ahora usa las nubes VISTA).
   ===================================================================== */
var BIOME_LABELS = (typeof BIOME_LABELS !== 'undefined') ? BIOME_LABELS : {};

BIOMES.pvdunes = function (L) {
  const V = VISTA;
  const B = new Backdrop(L.width, L.height);
  const HZ = 170;
  const SUN = { x: 330, y: 28, r: 13, halo: 34 };
  B.horizon = HZ; B.sun = SUN;
  B.weather.wind = 0.45;
  const T = () => Game.time;
  const P = (f, ys, h, draw, opts) => B.vplane(f, ys - Math.round(V.CAMY * f * 0.3), h, draw, opts);
  const labels = [];
  /* ---------------- cielo de mediodía ---------------- */
  B.sky = V.timed('sky', () => {
    const pb = V.sky(W, H, {
      horizonY: HZ, sun: SUN, curve: 1.15,
      stops: ['#0a4cc4', '#1258d0', '#1a66dc', '#2676e6', '#3888ee', '#4e9cf2', '#6eb2f4', '#94c6f2', '#bcd6ee', '#dcdce6'],
      haze: ['#e8d8d0', '#f0d8c4', '#f4dcbc', '#f8e4c4'],
    });
    V.sunDisc(pb, SUN.x, SUN.y, SUN.r, SUN.halo, 'noon');
    V.rays(pb, SUN.x, SUN.y, { n: 9, len: 300, col: '#fffae8', a: 0.08, spread: 2.4, ang: Math.PI / 2, w: 0.035, seed: 8, yMax: HZ });
    return pb.toCanvas();
  });
  B.vdyn(0, (g) => { V.drawBloom(g, SUN.x, SUN.y, 60, '#fff6d0', 0.22, T()); V.drawGlow(g, SUN.x, SUN.y, 26, '#ffffff', 0.25); }, { tag: 'bloom' });
  B.cloudDeck({ kind: 'cirrus', n: 7, seed: 61, f: [0.01, 0.03], y: [8, 60], w: [80, 170], speed: [1, 2] });
  // cúmulos de buen tiempo que proyectan sombra sobre el campo (f ≥ 0,12)
  const shadeDeck = B.cloudDeck({ n: 6, seed: 67, f: [0.12, 0.22], y: [24, 92], w: [64, 132], bias: 0.7, speed: [3, 6], sunX: SUN.x });
  /** Sombra de nube en x de mundo (0..1): mismo criterio que Backdrop.cloudShadowAt, con las nubes VISTA */
  B.cloudShadowAt = function (worldX) {
    let s = 0; const cx0 = Game.cam ? Game.cam.x : 0;
    for (const c of shadeDeck.clouds) {
      if (c.f < 0.12) continue;
      const cx = c.x - c.w * 0.5 + cx0 * (1 - c.f), d = Math.abs(worldX - cx);
      if (d < c.w * 0.45) s = Math.max(s, 1 - d / (c.w * 0.45));
    }
    return clamp(s, 0, 1);
  };
  const shadowsOn = (g, cam, Ly, S) => { const [ox, oy] = B.vofs(Ly, cam); V.drawCloudShadows(g, S, shadeDeck.clouds, cam, Ly.f, ox, oy); };
  /* ---------------- mesetas violetas (0,05) ---------------- */
  const farT = [];
  P(0.05, 116, 58, (pb, w, h) => {
    const m = V.mesas(pb, { yBase: h - 1, seed: 71, k: 0.32, hMin: 12, hMax: 40 });
    V.mirage(pb, h - 6, 6, { col: '#e0ecf8', a: 0.5 });
    for (const x of [560, 600, 640, 700]) { if (x >= w) continue; const y = m.top[x]; if (y >= h - 4) continue; const hub = V.turbineTower(pb, x, y, 14, { k: 0.45, w: 1 }); farT.push({ x: hub.hx, y: hub.hy, R: 6, k: 0.45, sp: 2.6, ph: x }); }
  }, { tag: 'far', dyn: (g, cam, Ly) => drawTurbines(g, cam, Ly, farT) });
  /* ---------------- dunas lejanas con espejismo y ARIDIA a lo lejos (0,08) ---------------- */
  P(0.08, 146, 46, (pb, w, h) => {
    const info = V.relief(pb, {
      yBase: h - 1, nv: 30, dvy: 0.25, seed: 73, hMax: 26,
      H: V.duneH({ seed: 73, amp: 20, period: 140, skew: 1.6 }),
      ramp: V.RAMPS.duneFar, contrast: 2.2, t0: 0.55, haze: { col: '#d8c4d0', k0: 0.12, k: 0.1 }, rim: '#fff0d0', tex: 0.03,
    });
    // ARIDIA y la torre de SYNARA, diminutas al oeste (hito de la isla)
    V.domeCity(pb, 90, info.top[90] + 3, { k: 0.4, s: 0.26, label: false });
    V.synaraTower(pb, 46, info.top[46] + 2, 24, { k: 0.4 });
    V.mirage(pb, h - 12, 10, { col: '#d6e8f8', a: 0.6 });
  }, { tag: 'farDunes' });
  /* ---------------- llanura con el gran campo FV (0,16) ---------------- */
  const fieldFx = { S: null, glints: [], leds: [] };
  P(0.16, 158, 82, (pb, w, h) => {
    const k = 0.1, r = RNG(79);
    // dunas al fondo de la llanura
    V.relief(pb, {
      yBase: 30, nv: 24, dvy: 0.25, seed: 81, hMax: 30,
      H: V.duneH({ seed: 81, amp: 22, period: 110, skew: 2 }),
      ramp: V.RAMPS.dune, contrast: 2.2, t0: 0.55, haze: { col: '#d0b8c8', k0: 0.1, k: 0.08 }, rim: '#fff0c8', tex: 0.04,
    });
    // llanura de arena compacta con rodadas
    const SD = V.P32(V.hz(V.RAMPS.dune, k));
    for (let y = 30; y < h; y++) for (let x = 0; x < w; x++) { const t = (y - 30) / (h - 30); V.put(pb, x, y, SD[V.band(clamp(0.72 - t * 0.12 + (vnoise(x * 0.03, y * 0.2, 83) - 0.5) * 0.12, 0, 0.999), SD.length, x, y, 0.05, 85)]); }
    const F = V.pvField(pb, { x0: 0, x1: w, y0: 38, y1: h - 4, rows: 7, k, grow: 6, gap: 6, skip: (x, y) => ((x + (y * 37) % 90) % 300) > 210 || (x % 340) > 318 });
    let bx0 = 1e9, by0 = 1e9, bx1 = 0, by1 = 0; for (const R of F.rows) { bx0 = Math.min(bx0, R.x0); by0 = Math.min(by0, R.y0); bx1 = Math.max(bx1, R.x1); by1 = Math.max(by1, R.y1); }
    fieldFx.S = V.shadowMix(pb, 0, 22, w, h - 22, { a: 0.36, featherTop: 14 });
    for (const R of F.rows) fieldFx.glints.push({ x: 0, y: R.y0 + 1, len: w, ph: hash1(R.y0, 3) * 1.6, sp: 0.05, w: 3 });
    // torres de alta tensión y casetas de inversores en los pasillos
    let prev = null;
    for (let x = 320; x < w; x += 340) {
      const pyl = V.pylon(pb, x, 34, 30, { k: k + 0.05 });
      if (prev) for (let q = 0; q < pyl.arms.length; q++) V.wires(pb, prev.arms[q], pyl.arms[q], 4, { k });
      prev = pyl;
      const inv = V.inverter(pb, x - 12, h - 8, { k, s: 0.6 }); fieldFx.leds.push([inv.led[0], inv.led[1], '#3fe0a0', 1]);
    }
  }, {
    tag: 'field', dyn: (g, cam, Ly) => {
      shadowsOn(g, cam, Ly, fieldFx.S);
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      V.drawGlints(g, fieldFx.glints, ox, oy, t);
      V.drawLeds(g, fieldFx.leds, ox, oy, t);
      V.drawHeat(g, 0, oy + 6, W, 26, t, { n: 30, a: 0.3 });
    },
  });
  /* ---------------- dunas medias con seguidores FV (0,28) ---------------- */
  const midFx = { S: null, glints: [], leds: [], fauna: [], pipe: [] };
  P(0.28, 176, 112, (pb, w, h) => {
    const k = 0.05, r = RNG(91);
    const info = V.relief(pb, {
      yBase: h - 1, nv: 30, dvy: 0.3, seed: 93, hMax: 56,
      H: V.duneH({ seed: 93, amp: 44, period: 210, skew: 2.4, crest: 0.68 }),
      ramp: V.RAMPS.dune, contrast: 2.4, t0: 0.56, facet: 0.2, haze: { col: '#c8a8c0', k0: 0.03, k: 0.05 }, rim: '#fff4d0', tex: 0.05,
      veg: { ramp: ['#3a3a14', '#5a5a1e', '#7a7a2a', '#9a9a3a'], density: 0.012, maxSlope: 0.5, minY: 40, size: 1.5 },
    });
    // rizos de viento en las laderas iluminadas
    const SD = V.P32(V.RAMPS.dune);
    for (let x = 0; x < w; x++) for (let y = info.top[x] + 3; y < h; y += 3) { const c = V.get(pb, x, y + ((x >> 3) & 1)); if (c >>> 24 && hash2(x >> 2, y, 5) < 0.5) V.put(pb, x, y + ((x >> 3) & 1), V.shU(c, 0.08)); }
    // filas de seguidores en las vaguadas
    let rx0 = 1e9, ry0 = 1e9, rx1 = 0, ry1 = 0;
    for (let x = 30; x < w - 60;) {
      const y = info.onSurf(x + 20, 4); if (y == null || y < 30) { x += 30; continue; }
      const n = r.int(3, 5);
      for (let q = 0; q < n; q++) { const R = V.tracker(pb, x + q * 38, y - 2 - q, 34, { k, rows: 3, ch: 4, cw: 5 }); rx0 = Math.min(rx0, R.x0); ry0 = Math.min(ry0, R.y0); rx1 = Math.max(rx1, R.x1); ry1 = Math.max(ry1, R.y1 + 4); midFx.glints.push({ x: R.x0 + 2, y: R.y0 + 2, len: R.x1 - R.x0 - 8, dy: 6, ph: q * 0.3 + x * 0.01, sp: 0.2 }); }
      const inv = V.inverter(pb, x + n * 38 + 4, y + 2, { k, s: 0.8 }); midFx.leds.push([inv.led[0], inv.led[1], '#3fe0a0', 1.2]);
      x += n * 38 + r.int(60, 130);
    }
    midFx.S = V.shadowMix(pb, 0, 30, w, h - 30, { a: 0.32, featherTop: 18 });
    // acueducto de agua desalada sobre pilotes (cian luminoso) que cruza las dunas hacia la ciudad
    const PERM = ['#0c2e4a', '#217b9c', '#22c1e7', '#71dfef', '#abfafd'], pipeY = (x) => Math.min(h - 6, (info.top[x] ?? h) - 6);
    const pts = []; for (let x = 0; x <= w; x += 24) pts.push([x, Math.round(Math.min(...[0, 8, 16, 24].map(q => pipeY(Math.min(w - 1, x + q)))) - 2)]);
    const ST = V.P32(V.hz(V.TECH.STEEL, k));
    for (let i = 0; i + 1 < pts.length; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      for (let x = x0; x < x1; x++) { const y = Math.round(lerp(y0, y1, (x - x0) / (x1 - x0))); V.put(pb, x, y - 1, U('#abfafd')); V.put(pb, x, y, U('#22c1e7')); V.put(pb, x, y + 1, U('#217b9c')); V.blend(pb, x, y - 2, U('#48b6ec'), 0.5); V.blend(pb, x, y + 2, U('#48b6ec'), 0.4); }
      for (let q = y0 + 2; q < Math.min(h, (info.top[x0] ?? h) + 3); q++) V.put(pb, x0, q, ST[(q & 1) ? 3 : 5]);
      midFx.pipe.push([x0, y0]);
    }
    midFx.pipe.push(pts[pts.length - 1]);
    // línea de alta tensión que cruza las dunas
    let prev = null;
    for (let x = 140; x < w; x += 260) { const y = info.onSurf(x, 10); if (y == null) continue; const pyl = V.pylon(pb, x, y + 1, 52, { k }); if (prev) for (let q = 0; q < pyl.arms.length; q++) V.wires(pb, prev.arms[q], pyl.arms[q], 7, { k }); prev = pyl; }
    midFx.fauna.push({ kind: 'eagle', x: 400, y: 10, r: 120 }, { kind: 'drone', x: 900, y: 30, r: 40 }, { kind: 'drone', x: 1500, y: 24, r: 30 });
    labels.push({ x: 520, y: 176 + 20, f: 0.28, title: 'FOTOVOLTAICA', sub: 'Seguidores solares', kind: 'water', ax: 520, ay: 176 + 44, camX: [0, 900] });
  }, {
    tag: 'mid', dyn: (g, cam, Ly) => {
      if (midFx.S) shadowsOn(g, cam, Ly, midFx.S);
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      V.drawGlints(g, midFx.glints, ox, oy, t);
      V.drawLeds(g, midFx.leds, ox, oy, t);
      V.drawFlow(g, midFx.pipe, ox, oy, t, { col: '#ffffff', speed: 18, gap: 10 });
      V.drawFauna(g, midFx.fauna, ox, oy, t);
    },
  });
  /* ---------------- cresta de duna cercana (0,42) ---------------- */
  P(0.42, 214, 80, (pb, w, h) => {
    const k = 0.0, r = RNG(101);
    const info = V.relief(pb, {
      yBase: h - 1, nv: 22, dvy: 0.3, seed: 103, hMax: 44,
      H: V.duneH({ seed: 103, amp: 40, period: 260, skew: 2.6, crest: 0.7, base: 6 }),
      ramp: V.RAMPS.dune, contrast: 2.5, t0: 0.57, facet: 0.18, rim: '#fff8dc', tex: 0.06,
    });
    for (let x = 0; x < w; x++) for (let y = info.top[x] + 2; y < h; y += 3) { const c = V.get(pb, x, y + ((x >> 3) & 1)); if (c >>> 24 && hash2(x >> 2, y, 7) < 0.55) V.put(pb, x, y + ((x >> 3) & 1), V.shU(c, 0.1)); }
    for (let x = 10; x < w; x += r.int(20, 60)) {
      const y = info.top[x]; if (y >= h - 4) continue;
      const q = r();
      if (q < 0.3) V.cardon(pb, x, y + 2, r.int(16, 30), 10300 + x, { k });
      else if (q < 0.55) V.agave(pb, x, y + 2, r.int(4, 7), x, { k });
      else if (q < 0.7) V.sandFence(pb, x, x + r.int(16, 30), y + 3, { k });
      else for (let i = 0; i < 6; i++) V.put(pb, x + r.int(-3, 3), y + 1 - r.int(0, 3), U(r.pick(['#a8a040', '#c8b850', '#8a7a30'])));
    }
  }, {
    tag: 'near', dyn: (g, cam, Ly) => {
      const t = T();
      V.drawHeat(g, 0, 196, W, 50, t, { n: 36, a: 0.28 });
      V.drawSand(g, 22, t, 5, { y0: 230, y1: 290, wind: 0.6 + (B.weather.wind || 0) });
      V.drawMotes(g, 10, t, 9, { y0: 120, y1: 260, col: '#fff2c8' });
    },
  });
  function drawTurbines(g, cam, Ly, list) {
    const [ox, oy] = B.vofs(Ly, cam), t = T();
    for (const tb of list) { const x = tb.x + ox; if (x < -20 || x > W + 20) continue; if (!tb.rot) tb.rot = V.rotor(tb.R, { k: tb.k }); V.drawRotor(g, tb.rot, x, tb.y + oy, t * tb.sp + tb.ph); }
  }
  for (const Lb of labels) Lb.when = (sc) => !V.labelClash(Lb, sc);
  BIOME_LABELS.pvdunes = labels;
  B.vistaInfo = { planes: B.layers.length, ms: Object.assign({}, V.stats.ms) };
  return B;
};

BIOME_LABELS.pvdunes = BIOME_LABELS.pvdunes || [];
