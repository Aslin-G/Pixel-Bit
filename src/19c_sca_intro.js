/* =====================================================================
   19c_sca_intro.js — Viñetas ilustradas del PRÓLOGO (IntroScene).
   Cinco panoramas VISTA compuestos a pantalla completa, uno por cada
   frase de la introducción, con paneo de cámara lento en parallax
   (Backdrop con levelW = W + PAN) y fundido cruzado entre viñetas:
     0 · Aridia en la sequía: la ciudad de la cúpula sobre la meseta seca,
         terrazas agostadas, cauce vacío, pozo seco y tierra agrietada.
     1 · El mar, el sol y el viento: mar turquesa, cabos con
         aerogeneradores, velero, gaviotas, pradera peinada por el viento.
     2 · El Festival del Primer Agua: la torre de SYNARA en la plaza con
         banderines, la desaladora y los flujos de mar/sol/viento que
         convergen en la torre; la primera gota brilla en la cima.
     3 · La máquina: cámara del núcleo SYNARA de noche, pantallas con un
         patrón extraño, balizas de alarma y datos que corren.
     4 · El enemigo: muro de la Calima con los ojos de MIRAGE en el
         horizonte; Amaya y KIRU lo miran desde una cresta al atardecer.
   API:  SCAIntro.get(i) → viñeta (cacheada) · SCAIntro.ready(i)
         SCAIntro.draw(g, v, t, k)   k = progreso del paneo 0..1
   ===================================================================== */
const SCAIntro = (() => {
  const V = VISTA, PAN = 56;
  const T = () => Game.time;
  const cache = new Map();
  function get(i) {
    if (cache.has(i)) return cache.get(i);
    const t0 = nowMs();
    const v = [v0, v1, v2, v3, v4][i]();
    v.ms = Math.round(nowMs() - t0);
    cache.set(i, v);
    return v;
  }
  function ready(i) { return cache.has(i); }
  function newB() { const B = new Backdrop(W + PAN, H); B.weather.wind = 0.3; return B; }
  /** Dibuja la viñeta con la cámara del paneo */
  function draw(g, v, t, k) {
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const cam = { x: Math.round(PAN * (v.rev ? 1 - e : e)), y: V.CAMY };
    g.drawImage(v.B.sky, -Math.round(cam.x * 0.02), 0);
    if (v.pre) v.pre(g, cam, t);
    v.B.render(g, cam, 'back');
    if (v.post) v.post(g, cam, t);
  }
  /** Rotores sobre un plano */
  function rotors(B, L, cam, list) {
    const [ox, oy] = B.vofs(L, cam), t = T();
    for (const tb of list) {
      const x = tb.x + ox, y = tb.y + oy; if (x < -30 || x > W + 30) continue;
      if (!tb.rot) tb.rot = V.rotor(tb.R, { k: tb.k });
      V.drawRotor(g_(), tb.rot, x, y, t * tb.sp + tb.ph);
    }
  }
  let _g = null; const g_ = () => _g;
  /** Envuelve un dinámico para que reciba g a través de rotors() */
  const dyn = (fn) => (g, cam, L) => { _g = g; fn(g, cam, L); };

  /* =================================================================
     0 · ARIDIA EN LA SEQUÍA (mediodía blanco, calima de calor)
     ================================================================= */
  function v0() {
    const B = newB(), HZ = 168, SUN = { x: 176, y: 38, r: 12, halo: 30 };
    const sky = V.sky(W + 20, H, { horizonY: HZ, sun: SUN, stops: ['#2a6ad0', '#3478d6', '#4a8ad8', '#64a0dc', '#84b2dc', '#a6c2d8', '#c4cad0', '#dcd0c0', '#ead6b8', '#f0dcb4'], haze: ['#f0dcb4', '#ecd4ac', '#e8cca4', '#e4c49c'] });
    V.sunDisc(sky, SUN.x, SUN.y, 12, 30, 'noon');
    V.rays(sky, SUN.x, SUN.y, { n: 6, len: 280, a: 0.08, spread: 1.5, ang: Math.PI * 0.45, seed: 3, yMax: HZ + 20 });
    B.sky = sky.toCanvas();
    B.cloudDeck({ kind: 'cirrus', n: 4, seed: 61, f: [0.01, 0.03], y: [10, 60], w: [90, 170], speed: [1, 2] });
    const DRY = ['#2a1a10', '#4a3018', '#6a4a22', '#8a6430', '#a8803e', '#c49c50', '#dcb868'];
    // mesas lejanas violáceas
    B.vplane(0.06, HZ - 40, 44, (pb, w, h) => V.mesas(pb, { seed: 7, k: 0.35, yBase: h - 1, hMin: 10, hMax: 30 }));
    // meseta de Aridia con la cúpula (sin cascadas: las fuentes están secas)
    const glints = [];
    B.vplane(0.16, 30, 150, (pb, w, h) => {
      const CX = 420, k = 0.12;
      const info = V.relief(pb, {
        yBase: h - 1, nv: 40, dvy: 0.3, seed: 81, hMax: 100,
        H: V.massif([{ x: CX, v: 20, h: 86, w: 180, d: 30, k: 0.85 }, { x: CX - 120, v: 12, h: 46, w: 110, d: 20 }, { x: CX + 130, v: 12, h: 52, w: 110, d: 20 }, { x: 140, v: 10, h: 30, w: 120, d: 18 }, { x: 650, v: 10, h: 36, w: 90, d: 18 }],
          { seed: 81, rough: 0.5, scale: 0.045, apron: 6, plateaus: [{ x: CX, w: 86, h: 76 }] }),
        ramp: ['#4a2a2a', '#6a3a30', '#8a5038', '#a86840', '#c48250', '#d89c60', '#e8b474', '#f4cc90', '#fae2b0'], contrast: 2.0, t0: 0.56, facet: 0.3, cav: 0.1,
        haze: { col: '#e0c8b0', k0: 0.06, k: 0.12 }, mist: { col: '#ecd8bc', h: 18, k: 0.45 }, rim: '#fff0c8', tex: 0.06,
        veg: { ramp: DRY, density: 0.05, maxSlope: 0.9, minY: 80, size: 2 },
      });
      const r = RNG(83);
      for (let i = 0; i < 26; i++) { const x = r.pick([r.int(300, 370), r.int(470, 560)]), y = info.onSurf(x, r.int(3, 14)); if (y != null && y > 70) V.house(pb, x, y + 1, r.int(6, 10), r.int(4, 7), 830 + i, { k, roof: r.pick(['flat', 'dome', 'terrace']) }); }
      const dc = V.domeCity(pb, CX, info.top[CX] + 8, { k: 0.06, s: 0.8 });
      glints.push([CX - 9, dc.top + 18]);
      // terrazas agostadas (sin canal)
      V.carveTerraces(pb, info, { x0: 190, x1: 300, yTop: 96, yBot: h - 8, stepH: [7, 10], wallK: 0.45, k, seed: 85, channel: false, crop: DRY, kinds: ['rows', 'rows', 'vine'] });
    }, { dyn: (g, cam, L) => { const [ox, oy] = B.vofs(L, cam); for (const [x, y] of glints) V.drawGlow(g, x + ox, y + oy, 3, '#fff8e0', 0.3 + 0.3 * Math.sin(T() * 1.4)); } });
    // llanura seca: embalse vacío con marcas de antiguos niveles, cauce seco, tubería rota y campos agostados
    B.vplane(0.4, 164, 110, (pb, w, h) => {
      const R = V.P32(V.expand(['#b47a44', '#c88c50', '#d8a060', '#e4b472', '#ecc488'], 12));
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const t = y / h, n = (vnoise(x * 0.02, y * 0.05, 91) - 0.5) * 0.3 + (V.ridged(x * 0.03, y * 0.08, 3, 93) - 0.5) * 0.15;
        pb.data[y * w + x] = R[V.band(clamp(0.85 - t * 0.55 + n, 0, 0.999), R.length, x, y, 0.06, 95)];
      }
      // cauce seco serpenteante (baja de la ciudad)
      const BED = V.P32(['#8a5a34', '#b4865a', '#d8b48a', '#ecd4ac', '#f8e8c8']);
      for (let y = 0; y < h; y++) {
        const t = y / h, cx = 380 + Math.sin(y * 0.07 + 1) * 40 * (0.4 + t) + t * 60, hw = 3 + t * 16;
        for (let x = Math.round(cx - hw - 2); x <= Math.round(cx + hw + 2); x++) {
          const d = Math.abs(x - cx) / hw;
          let i = d > 1 ? 0 : d > 0.85 ? 1 : 3 + (hash2(x >> 1, y, 5) < 0.3 ? 1 : 0);
          if (d <= 1 && ((x * 3 + y * 7) % 23 === 0)) i = 1;
          V.put(pb, x, y, BED[i]);
        }
      }
      // embalse vacío: cuenco elíptico con anillos de nivel, fondo agrietado y un charco turbio
      const ex = 150, ey = 46, erx = 110, ery = 26;
      const RING = V.P32(['#6a4224', '#8a5a34', '#a8784a', '#c8986a', '#e0b888']);
      for (let y = ey - ery; y <= ey + ery; y++) for (let x = ex - erx; x <= ex + erx; x++) {
        const nx = (x - ex) / erx, ny = (y - ey) / ery, d = nx * nx + ny * ny; if (d > 1) continue;
        let u;
        if (d > 0.9) u = RING[ny < 0 ? 1 : 4];
        else if (Math.abs((d * 6) % 1 - 0.5) < 0.06) u = RING[ny < 0 ? 0 : 3];                       // marcas de nivel
        else u = RING[clamp(Math.round(2 + ny * 1.5 + (PFK.cl(x, y, 3, 7) - 0.5) * 1.2), 0, 4)];
        if (d < 0.6 && hash2(x >> 2, y >> 1, 9) < 0.08) u = RING[0];                                  // grietas del fondo
        pb.data[y * w + x] = u;
      }
      for (let y = ey + 6; y < ey + 12; y++) for (let x = ex - 20 + (y - ey - 6) * 2; x < ex + 22 - (y - ey - 6) * 2; x++) V.put(pb, x, y, U(y === ey + 6 ? '#a8a070' : '#7a7448'));
      // tubería de abastecimiento rota sobre soportes
      for (let x = 250; x < 560; x++) { if (x > 400 && x < 412) continue; const y = 20 + Math.round((x - 250) * 0.04); V.put(pb, x, y, U('#d3ccc5')); V.put(pb, x, y + 1, U('#948e91')); V.put(pb, x, y + 2, U('#5a5961')); if (x % 24 === 0) for (let q = 3; q < 9; q++) V.put(pb, x, y + q, U('#6e625b')); }
      // campos agostados en hileras a la derecha
      for (let row = 0; row < 7; row++) for (let x = 470 + row * 4; x < w; x += 3) { const y = 52 + row * 6; V.put(pb, x, y, U(row % 2 ? '#8a6430' : '#a8803e')); if (hash2(x, row, 3) < 0.4) V.put(pb, x, y - 1, U('#c49c50')); }
      const r = RNG(97);
      for (let i = 0; i < 36; i++) { const x = r.int(0, w), y = r.int(6, h - 4); PFFlora.tuft(pb, x, y, 3 + (y / h) * 6, 2 + (y / h) * 5, 970 + i, PFFlora.DRY); }
      for (const [x, y, hh] of [[300, 40, 16], [610, 30, 14], [30, 80, 20]]) V.cardon(pb, x, y, hh, x, { k: 0.05 });
    });
    // primer plano: tierra agrietada, pozo seco, depósito vacío con aguja en rojo y árbol muerto
    const drip = { x: 0, y: 0 };
    B.vplane(1, 226, 134, (pb, w, h) => {
      SCAKit.crackedEarth(pb, 0, w, 0, h, { seed: 5, top: (x) => 12 + Math.sin(x * 0.02) * 4 + (vnoise(x * 0.05, 0, 3) - 0.5) * 6 });
      SCAKit.well(pb, 120, 58, { r: 15 });
      SCAKit.deadTree(pb, 610, 66, 120, 7, { w: 5 });
      const tx = 486, ty = 34;
      for (const sx of [-10, 9]) for (let yy = 0; yy < 24; yy++) { V.put(pb, tx + sx, ty + yy, U('#4a4c5c')); V.put(pb, tx + sx + 1, ty + yy, U('#9a98a4')); }
      V.cylV(pb, tx, ty, 13, 30, SCAKit.STEEL, { bands: [[4, 2, SCAKit.BAND], [24, 2, SCAKit.BAND]] });
      for (let yy = ty - 26; yy < ty - 4; yy++) { V.put(pb, tx + 15, yy, U('#06081a')); V.put(pb, tx + 16, yy, U(yy > ty - 8 ? '#e83b41' : '#3a405d')); }
      V.pipe(pb, [[tx - 4, ty + 2], [tx - 4, ty + 6], [tx - 12, ty + 6]], 1, SCAKit.STEEL, {});
      drip.x = tx - 12; drip.y = ty + 7 + 226;
      // cubo y bidones vacíos junto al pozo
      for (const [bx, by] of [[150, 60], [160, 62]]) { for (let yy = 0; yy < 9; yy++) for (let xx = 0; xx < 7; xx++) V.put(pb, bx + xx, by - yy, V.P32(['#1a4a78', '#2a72aa', '#4a9ad0', '#8cc8ec'])[xx < 2 ? 3 : xx < 5 ? 2 : 0]); V.put(pb, bx + 2, by - 10, U('#e8e4de')); V.put(pb, bx + 3, by - 10, U('#e8e4de')); }
      PFFlora.scatter(pb, (x) => 14 + Math.sin(x * 0.02) * 4, 0, w, 99, { mix: { dry: 6, agave: 1 }, gap: 24 });
      for (let i = 0; i < 6; i++) { const x = 30 + i * 110 + (i * 37) % 30; PFFlora.tuft(pb, x, 70 + (i % 2) * 14, 12, 10, 300 + i, PFFlora.DRY); }
    }, {
      dyn: (g, cam, L) => {
        const [ox] = B.vofs(L, cam), t = T();
        // la última gota que cae del grifo del depósito (cada 2,4 s)
        const u = (t % 2.4) / 2.4;
        if (u < 0.7) { g.fillStyle = '#7fd8f6'; g.fillRect(drip.x + ox, drip.y + Math.round(u < 0.4 ? 0 : (u - 0.4) * 60), 1, 2); }
      },
    });
    const vult = { s: null };
    return {
      B, rev: false,
      post(g, cam, t) {
        V.drawHeat(g, 0, 160, W, 60, t, { a: 0.3, n: 46 });
        V.drawMotes(g, 18, t, 21, { y0: 150, y1: 300, col: '#ffe0b0' });
        if (!vult.s) vult.s = SCATitleArtEagle();
        for (let i = 0; i < 2; i++) { const a = t * 0.25 + i * 3; V.drawStrip(g, vult.s, (t % 3) < 1 ? Math.floor(t * 6) % 4 : 1, 300 + Math.cos(a) * 60 - 15 - cam.x * 0.3, 80 + Math.sin(a) * 14 + i * 10 - 7, Math.sin(a) > 0); }
      },
    };
  }
  /* =================================================================
     1 · EL MAR, EL SOL Y EL VIENTO (día luminoso, viento fuerte)
     ================================================================= */
  function v1() {
    const B = newB(), HZ = 156, SUN = { x: 470, y: 34, r: 12, halo: 28 };
    B.weather.wind = 1.2;
    const sky = V.sky(W + 20, H, { horizonY: HZ, sun: SUN });
    V.rays(sky, SUN.x, SUN.y, { n: 7, len: 300, a: 0.07, spread: 1.6, ang: Math.PI * 0.55, seed: 11, yMax: HZ + 6 });
    B.sky = sky.toCanvas();
    B.cloudDeck({ kind: 'cirrus', n: 5, seed: 71, f: [0.01, 0.03], y: [8, 50], w: [80, 170], speed: [3, 5] });
    B.cloudDeck({ n: 7, seed: 73, f: [0.03, 0.08], y: [-4, 70], w: [60, 140], bias: 0.6, speed: [5, 8], sunX: SUN.x });
    // mar lejano con parque eólico marino
    const offT = [];
    B.vplane(0.08, HZ, 120, (pb) => {
      V.seaFar(pb, 0, pb.h, { seed: 13 });
      for (let row = 0; row < 3; row++) for (let i = 0; i < 9; i++) {
        const x = 300 + i * (26 + row * 6) + row * 11, y = 4 + row * 4, th = 14 + row * 5;
        if (x > pb.w - 4) continue;
        const hub = V.turbineTower(pb, x, y, th, { k: 0.4 - row * 0.1, w: 1 });
        offT.push({ x: hub.hx, y: hub.hy, R: 5 + row * 2, k: 0.4 - row * 0.1, sp: 3 + (i % 3) * 0.5, ph: i });
      }
    }, { dyn: dyn((g, cam, L) => { const [ox, oy] = B.vofs(L, cam); V.drawSeaFx(g, ox, HZ, W + 40, 70, T(), { sunX: SUN.x + ox, density: 1 }); rotors(B, L, cam, offT); }) });
    // cabo cálido con aerogeneradores en la cresta
    const capeT = [];
    B.vplane(0.22, 50, 128, (pb, w, h) => {
      const info = V.relief(pb, {
        yBase: h - 1, nv: 36, dvy: 0.32, seed: 21, hMax: 90, x0: 0, x1: 300,
        H: V.massif([{ x: 70, v: 16, h: 70, w: 150, d: 26, k: 0.9 }, { x: 170, v: 12, h: 50, w: 110, d: 20 }, { x: 250, v: 8, h: 26, w: 70, d: 14 }], { seed: 21, rough: 0.5, scale: 0.045, apron: 5 }),
        ramp: V.RAMPS.hill, contrast: 2.1, t0: 0.55, facet: 0.32, cav: 0.1, haze: { col: '#b0a8d0', k0: 0.04, k: 0.1 }, mist: { col: '#c6e0f0', h: 10, k: 0.4 }, rim: '#fcd8ae', tex: 0.06,
        veg: { ramp: V.RAMPS.vegHill, density: 0.12, maxSlope: 1.1, minY: 30, size: 3 },
      });
      for (const [x, th, R] of [[44, 44, 16], [92, 48, 18], [150, 40, 15], [196, 36, 13]]) {
        let bx = x; for (let q = -8; q <= 8; q++) if (info.top[x + q] < info.top[bx]) bx = x + q;
        const hub = V.turbineTower(pb, bx, info.top[bx] + 2, th, { k: 0.08 });
        capeT.push({ x: hub.hx, y: hub.hy, R, k: 0.08, sp: 4 + (x % 5) * 0.4, ph: x });
      }
      const FO = V.P32(RAMP.foamR);
      for (let x = 0; x < 300; x++) if (info.top[x] < h - 1) { V.put(pb, x, h - 1, FO[4]); if (hash2(x, 1, 3) < 0.5) V.put(pb, x, h - 2, FO[3]); }
    }, { dyn: dyn((g, cam, L) => rotors(B, L, cam, capeT)) });
    // mar cercano
    B.vplane(0.45, 176, H - 176, (pb) => SCAKit.nearSea(pb, { seed: 31, t0: 0.12, t1: 0.86 }), {
      dyn: (g, cam, L) => {
        const [ox] = B.vofs(L, cam), t = T();
        SCAKit.drawSeaGlints(g, 40, t, 0, 180, W + 40, 130, ox);
        // velero que cruza escorado por el viento
        const bx = ((t * 9) % (W + 120)) - 60 + ox * 0.2, by = 214 + Math.sin(t * 1.4) * 1.5;
        g.fillStyle = '#3a2418'; g.fillRect(Math.round(bx) - 8, Math.round(by), 18, 2); g.fillStyle = '#7a4a2a'; g.fillRect(Math.round(bx) - 7, Math.round(by) + 2, 15, 1);
        g.fillStyle = '#f6f4f0'; for (let q = 0; q < 16; q++) g.fillRect(Math.round(bx) + 1 + Math.round(q * 0.15), Math.round(by) - 16 + q, Math.max(1, Math.round(q * 0.55)), 1);
        g.fillStyle = '#e83b41'; for (let q = 0; q < 9; q++) g.fillRect(Math.round(bx) - 1 - Math.round(q * 0.5), Math.round(by) - 10 + q, 1, 1);
        g.fillStyle = '#ffffff'; g.fillRect(Math.round(bx) + 10, Math.round(by) + 1, 6, 1);
      },
    });
    // primer plano: cabo columnar (kit PF) a la derecha con pradera peinada por el viento; rocas con rompiente a la izquierda
    const socks = [], surf = [];
    const topF = (x) => x < 372 ? null : 286 - (x - 372) * 0.3 + Math.sin(x * 0.05) * 3 + (vnoise(x * 0.04, 0, 7) - 0.5) * 6;
    const CL = SCAKit.pfCliff(W + PAN + 2, H, topF, { surf: 'grass', depth: 12 });
    B.vdyn(1, (g, cam) => { g.drawImage(CL.top, -Math.round(cam.x), 0); g.drawImage(CL.face, -Math.round(cam.x), 0); });
    B.vplane(1, 0, H, (pb, w, h) => {
      V.windGrass(pb, 372, w, (x) => topF(x) + 1, { seed: 35, density: 0.95, lean: 2.4, h: 10 });
      for (let i = 0; i < 6; i++) { const x = 386 + i * 48 + (i * 29) % 20; V.flowerBush(pb, x, Math.round(topF(x)) + 3, 4 + (i % 3), 40 + i); }
      PFFlora.scatter(pb, (x) => topF(x) + 2, 380, w, 37, { mix: { tuft: 5, lupine: 2, flowers: 2 }, gap: 11 });
      V.metMast(pb, 560, Math.round(topF(560)) - 2, 62, {});
      socks.push({ x: 562, y: Math.round(topF(560)) - 63 });
      const RK = V.P32(RAMP.rockR);
      for (const [x, y, rw, rh] of [[40, 290, 22, 12], [92, 296, 14, 8], [210, 292, 18, 9], [300, 284, 26, 14], [150, 300, 10, 6]]) {
        V.ellipse(pb, x, y, rw, rh, (nx, ny) => ny > 0.5 ? 0 : RK[clamp(Math.round(3.4 - nx * 1.6 - ny * 2.6 + (PFK.cl(x + nx * rw, y + ny * rh, 2, 3) - 0.5) * 1.2), 0, 6)]);
        for (let q = -rw + 2; q < rw - 2; q++) if (hash2(q, y, 5) < 0.5) V.put(pb, x + q, y - Math.round(rh * Math.sqrt(Math.max(0, 1 - (q / rw) ** 2))), U('#fbc371'));
        surf.push({ x0: x - rw - 2, x1: x + rw + 2, y: y + Math.round(rh * 0.5) });
      }
    }, { dyn: (g, cam, L) => { const [ox] = B.vofs(L, cam); V.drawSocks(g, socks, ox, 0, T(), 1.4); V.drawSurf(g, surf, ox, 0, T()); } });
    const fauna = [{ kind: 'gull', x: 300, y: 120, r: 320, sp: 14 }, { kind: 'gull', x: 340, y: 110, r: 300, sp: 13 }, { kind: 'gull', x: 200, y: 140, r: 260, sp: 12 }, { kind: 'gull', x: 500, y: 96, r: 280, sp: 15 }];
    return {
      B, rev: true,
      post(g, cam, t) {
        V.drawBloom(g, SUN.x - cam.x * 0.02, SUN.y, 34, '#fff4d0', 0.24, t);
        V.drawFauna(g, fauna, -cam.x * 0.3, 0, t);
        V.drawWind(g, 26, t, 7, { y0: 40, y1: 300, speed: 170, len: 30, a: 0.5 });
      },
    };
  }
  /* =================================================================
     2 · EL FESTIVAL DEL PRIMER AGUA (tarde dorada)
     ================================================================= */
  function v2() {
    const B = newB(), HZ = 150, SUN = { x: 560, y: 70, r: 12, halo: 30 };
    const sky = V.sky(W + 20, H, { horizonY: HZ, sun: SUN, stops: ['#1c5ac8', '#2a6ad4', '#3e80dc', '#5a96e0', '#7aa8dc', '#9cb4d4', '#c0b8c4', '#dcb8a8', '#f0c090', '#f8cc88'], haze: ['#f8cc88', '#f4c080', '#f0b478', '#eaa870'] });
    V.sunDisc(sky, SUN.x, SUN.y, 12, 30, 'dusk');
    V.rays(sky, SUN.x, SUN.y, { n: 6, len: 320, a: 0.08, spread: 1.4, ang: Math.PI * 0.8, seed: 23, col: '#ffe8c0', yMax: HZ + 10 });
    B.sky = sky.toCanvas();
    B.cloudDeck({ n: 6, seed: 81, f: [0.03, 0.07], y: [0, 60], w: [70, 140], bias: 0.6, speed: [2, 3], sunX: SUN.x });
    B.vplane(0.08, HZ, 120, (pb) => V.seaFar(pb, 0, pb.h, { seed: 41, ramp: ['#0a5aa8', '#1478c0', '#2a92cc', '#4aa8d4', '#7cc0d8', '#d8c8a8'] }), { dyn: (g, cam, L) => { const [ox] = B.vofs(L, cam); V.drawSeaFx(g, ox, HZ, W + 40, 60, T(), { sunX: SUN.x + ox, density: 1 }); } });
    // cerros con FV y aerogeneradores (sol y viento)
    const hillT = [], pvGl = [];
    B.vplane(0.18, 70, 100, (pb, w, h) => {
      const info = V.relief(pb, {
        yBase: h - 1, nv: 40, dvy: 0.35, seed: 51, hMax: 70, x0: 0,
        H: V.massif([{ x: 80, v: 16, h: 56, w: 140, d: 26 }, { x: 190, v: 12, h: 40, w: 90, d: 20 }, { x: 600, v: 14, h: 50, w: 120, d: 24 }, { x: 680, v: 12, h: 34, w: 80, d: 18 }], { seed: 51, rough: 0.5, scale: 0.045, apron: 6, plateaus: [{ x: 120, w: 60, h: 40 }] }),
        ramp: V.RAMPS.hill, contrast: 2.0, t0: 0.56, facet: 0.3, haze: { col: '#d8b8b0', k0: 0.06, k: 0.1 }, mist: { col: '#e8c8b8', h: 14, k: 0.4 }, rim: '#ffe0b0', tex: 0.06,
        veg: { ramp: V.RAMPS.vegHill, density: 0.1, maxSlope: 1, minY: 30, size: 2 },
      });
      const pv = V.pvArray(pb, 86, info.yAt(120, 10) - 1, { tables: 3, cols: 10, rows: 2, cw: 5, ch: 3, gap: 3, skew: 3, k: 0.08, shift: 2 });
      for (let q = 0; q < 4; q++) pvGl.push({ x: pv.x0 + 2, y: pv.y0 + 2 + q * 2, len: pv.x1 - pv.x0 - 4, sp: 0.3, ph: q * 0.25, a: 0.8 });
      for (const [x, th, R] of [[30, 34, 13], [200, 30, 12], [600, 36, 14], [660, 30, 12]]) {
        let bx = x; for (let q = -8; q <= 8; q++) if (info.top[x + q] < info.top[bx]) bx = x + q;
        const hub = V.turbineTower(pb, bx, info.top[bx] + 2, th, { k: 0.1 });
        hillT.push({ x: hub.hx, y: hub.hy, R, k: 0.1, sp: 2.4 + (x % 5) * 0.3, ph: x });
      }
    }, { dyn: dyn((g, cam, L) => { rotors(B, L, cam, hillT); const [ox, oy] = B.vofs(L, cam); V.drawGlints(g, pvGl, ox, oy, T()); }) });
    // la desaladora en la costa
    let plant = null;
    B.vplane(0.32, 168, H - 168, (pb) => {
      SCAKit.nearSea(pb, { seed: 43, t0: 0.14, t1: 0.8 });
      plant = SCAKit.heroPlant(pb, 20, 76, { wp: 246 });
    }, {
      dyn: (g, cam, L) => {
        const [ox, oy] = B.vofs(L, cam), t = T();
        for (const P of [plant.perm, plant.perm2]) V.drawFlow(g, P, ox, oy, t, { col: '#ffffff', speed: 16, gap: 6 });
        for (const [x, y, r] of plant.glows) V.drawGlow(g, x + ox, y + oy, r, '#48b6ec', 0.4);
        SCAKit.foam(g, [{ x0: 16 + ox, x1: 290 + ox, y: 76 + oy + 1 }], t);
      },
    });
    // plaza de Aridia con la torre de SYNARA, casas de colores y banderines
    let tower = null; const flags = [], flowsPts = [];
    B.vplane(0.55, 40, H - 40, (pb, w, h) => {
      // ladera urbana
      const gy = (x) => 200 - Math.max(0, x - 280) * 0.05 + Math.sin(x * 0.03) * 3;
      for (let x = 260; x < w; x++) for (let y = Math.round(gy(x)); y < h; y++) {
        const t = (y - gy(x)) / 50; V.put(pb, x, y, V.P32(RAMP.sandR)[clamp(Math.round(4 - t * 3 + (hash2(x >> 1, y >> 1, 3) - 0.5) * 1.4), 0, 5)]);
      }
      for (let x = 254; x < 266; x++) for (let y = Math.round(gy(266)); y < h; y++) V.put(pb, x, y, V.P32(RAMP.rockR)[clamp(1 + (x - 254) >> 1, 0, 6)]);
      V.hillTown(pb, {
        x0: 270, x1: w, seed: 61, k: 0,
        rows: [
          { y: (x) => gy(x) - 34, w: [14, 22], h: [12, 20], gap: [2, 6], hole: 0.05, veg: 0.6, scale: 1, skip: (x, ww) => x + ww > 420 && x < 500, flowers: true },
          { y: (x) => gy(x) - 6, w: [18, 28], h: [16, 26], gap: [4, 10], hole: 0.08, veg: 0.5, scale: 1.2, skip: (x, ww) => x + ww > 410 && x < 510, flowers: true },
        ],
      });
      tower = V.synaraTower(pb, 460, Math.round(gy(460)) - 2, 150, {});
      V.bunting(pb, 270, 120, 452, 70, 14, { cols: ['#e83b41', '#f5dc5a', '#11bedd', '#3fe0a0', '#8d6bff'], big: true });
      V.bunting(pb, 470, 70, w, 112, 12, { cols: ['#f5dc5a', '#e83b41', '#3fe0a0', '#11bedd'], big: true });
      for (const fx of [300, 360, 560, 620]) { const fy = Math.round(gy(fx)) - 50; for (let q = 0; q < 26; q++) V.put(pb, fx, fy + q, U(q < 2 ? '#f6f4f0' : '#8a7a6a')); flags.push({ x: fx, y: fy + 40, col: ['#e83b41', '#11bedd', '#f5dc5a', '#3fe0a0'][flags.length % 4] }); }
    }, {
      dyn: (g, cam, L) => {
        const [ox, oy] = B.vofs(L, cam), t = T();
        V.drawFlags(g, flags, ox, oy, t);
        for (const [x, y, r] of tower.glows) V.drawGlow(g, x + ox, y + oy, r, '#56e5ff', 0.4 + 0.2 * Math.sin(t * 2 + y));
        // la primera gota: brilla, crece y cae en ciclo lento
        const [tx, ty] = tower.tip, u = (t % 6) / 6, gx = tx + ox, gy = ty + oy - 10;
        const s = u < 0.75 ? 1 + u * 3 : 4;
        V.drawGlow(g, gx, gy, Math.round(8 + s * 2), '#7ff0ff', 0.5);
        g.fillStyle = '#e6fdff'; g.fillRect(gx - Math.round(s / 2), gy - Math.round(s), Math.max(1, Math.round(s)), Math.round(s * 1.6) + 1);
        g.fillStyle = '#22c1e7'; g.fillRect(gx - Math.round(s / 2) + Math.max(1, Math.round(s)) - 1, gy - Math.round(s) + 1, 1, Math.round(s * 1.6));
        g.fillStyle = '#ffffff'; g.fillRect(gx - Math.round(s / 2), gy - Math.round(s), 1, 1);
      },
    });
    // flujos que convergen en la torre: agua (cian) desde la planta, sol (amarillo) desde la FV, viento (blanco) desde los cerros, H₂ (verde)
    const flows = [
      { col: '#7ff0ff', pts: [[90, 220], [200, 196], [330, 170], [420, 150], [460, 120]] },
      { col: '#ffe14d', pts: [[110, 150], [220, 128], [340, 112], [440, 100], [458, 90]] },
      { col: '#f4f8ff', pts: [[30, 110], [150, 92], [300, 84], [430, 76], [456, 66]] },
      { col: '#4cd48e', pts: [[640, 200], [580, 170], [520, 140], [470, 118]] },
    ];
    return {
      B, rev: false,
      post(g, cam, t) {
        const ox = -Math.round(cam.x * 0.55);
        for (const F of flows) {
          for (let s = 0; s + 1 < F.pts.length; s++) {
            const [x0, y0] = F.pts[s], [x1, y1] = F.pts[s + 1], n = Math.round(Math.hypot(x1 - x0, y1 - y0) / 4);
            for (let k = 0; k < n; k++) {
              const ph = (k / n + s * 0.3 - t * 0.6) % 1;
              if (((ph + 1) % 1) > 0.22) continue;
              g.globalAlpha = 0.85; g.fillStyle = F.col; g.fillRect(Math.round(lerp(x0, x1, k / n)) + ox, Math.round(lerp(y0, y1, k / n)), 2, 1);
            }
          }
        }
        g.globalAlpha = 1;
        V.drawMotes(g, 24, t, 29, { y0: 60, y1: 300, col: '#ffe8a0' });
        // confeti
        for (let i = 0; i < 26; i++) {
          const x = Math.round((hash1(i, 41) * W + Math.sin(t + i) * 10 + t * 6) % W), y = Math.round((hash1(i, 43) * 200 + t * (12 + (i % 5) * 3)) % 240) + 40;
          g.fillStyle = ['#e83b41', '#f5dc5a', '#11bedd', '#3fe0a0', '#f060b8'][i % 5]; g.fillRect(x, y, (Math.floor(t * 6 + i) % 2) + 1, 1);
        }
        V.drawBloom(g, SUN.x - cam.x * 0.02, SUN.y, 30, '#ffe0b0', 0.22, t);
      },
    };
  }
  /* =================================================================
     3 · LA MÁQUINA (núcleo de SYNARA de noche, alarma silenciosa)
     ================================================================= */
  function v3() {
    const B = newB();
    const sky = new PixelBuffer(W + 20, H);
    const R = V.P32(V.expand(['#020818', '#041230', '#071c44', '#0a2654', '#0c2c60'], 12));
    for (let y = 0; y < H; y++) for (let x = 0; x < sky.w; x++) sky.data[y * sky.w + x] = R[V.band(y / H * 0.9, R.length, x, y, 0.04, 3)];
    B.sky = sky.toCanvas();
    // pared del fondo: paneles con nervios y ventanal nocturno con estrellas y la ciudad iluminada
    const winLights = [];
    B.vplane(0.15, 0, H, (pb, w, h) => {
      const P = V.P32(['#06122a', '#0a1a3a', '#0e244a', '#14305c', '#1c3e70', '#2a5288']);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (y >= 232) { pb.data[y * w + x] = P[(y - 232) % 9 === 0 ? 2 : ((x + (y - 232) * 2) % 40 === 0 ? 2 : 1)]; continue; }
        let i = 2 + ((x % 48) < 2 ? -1 : 0) + ((y % 40) === 0 ? 1 : 0) + (y > h - 30 ? -1 : 0);
        if ((x % 48) === 2) i = 4;
        pb.data[y * w + x] = P[clamp(i + (hash2(x >> 2, y >> 2, 3) < 0.05 ? 1 : 0), 0, 5)];
      }
      // ventanal en arco
      const wx0 = 200, wx1 = 480, wy0 = 30, wy1 = 150;
      for (let y = wy0; y < wy1; y++) for (let x = wx0; x < wx1; x++) {
        const nx = (x - (wx0 + wx1) / 2) / ((wx1 - wx0) / 2), ny = (y - wy1) / (wy1 - wy0);
        if (nx * nx + ny * ny > 1.02 && y < wy1 - 40) continue;
        let u = U(mixHex('#061a3e', '#123a6a', (y - wy0) / (wy1 - wy0)));
        if (hash2(x, y, 9) < 0.006) u = U('#e8f0ff');
        if (((x - wx0) % 35) < 2 || ((y - wy0) % 30) === 0) u = U('#2a4a78');
        pb.data[y * w + x] = u;
      }
      // horizonte de la ciudad tras el cristal
      const r = RNG(5);
      for (let x = wx0 + 2; x < wx1 - 2;) {
        const bw = r.int(6, 16), bh = r.int(8, 30);
        for (let yy = wy1 - bh; yy < wy1; yy++) for (let xx = x; xx < Math.min(wx1 - 2, x + bw); xx++) pb.data[yy * w + xx] = U('#0a1430');
        for (let q = 0; q < bh / 5; q++) winLights.push([x + 1 + r.int(0, bw - 2), wy1 - bh + 2 + r.int(0, bh - 4)]);
        x += bw + r.int(0, 4);
      }
    }, { dyn: (g, cam, L) => { const [ox, oy] = B.vofs(L, cam), t = T(); g.fillStyle = '#ffd88a'; for (let i = 0; i < winLights.length; i++) if ((i * 7 + Math.floor(t * 0.5)) % 9) { const [x, y] = winLights[i]; g.fillRect(x + ox, y + oy, 1, 1); } } });
    // el núcleo de SYNARA (tambor con cúpula de vidrio y franja cian) y bastidores de datos
    let core = null; const racks = [];
    B.vplane(0.4, 30, 260, (pb, w, h) => {
      core = PFBC.synaraCore(pb, 330, 230, 200, 120);
      for (const [x, s] of [[40, 1], [110, 2], [520, 3], [590, 4]]) { const R2 = V.bessRack(pb, x, 230, 46, 110, 12, { k: 0.1, accent: '#56e5ff' }); racks.push(...R2.leds); }
    }, {
      dyn: (g, cam, L) => {
        const [ox, oy] = B.vofs(L, cam), t = T();
        // leds de bastidores: la mayoría cian, algunos ámbar que parpadean fuera de ritmo
        for (let i = 0; i < racks.length; i++) { const [x, y] = racks[i]; const on = Math.floor(t * (1.5 + (i % 5) * 0.3) + i) % 3; if (!on) continue; g.fillStyle = i % 9 === 4 ? '#ffb040' : '#56e5ff'; g.fillRect(x + ox, y + oy, 1, 1); }
        if (core) { const [dx, dy] = core.dome; V.drawGlow(g, dx + ox, dy + oy, 22, '#56e5ff', 0.25 + 0.12 * Math.sin(t * 1.7)); for (const [bx, by] of core.beacons) V.drawGlow(g, bx + ox, by + oy, 4, '#ff3a3a', Math.floor(t * 2) % 2 ? 0.9 : 0.25); }
      },
    });
    // consolas en primer plano con pantallas que muestran un patrón (mosaico) que nadie entiende
    const screens = [];
    B.vplane(1, 250, 110, (pb, w, h) => {
      V.reflectFloor(pb, 0, w, 60, h, { ramp: ['#020818', '#06122a', '#0a1a3a', '#10264c'], col: '#56e5ff' });
      for (const [x, cw] of [[30, 150], [250, 170], [490, 150]]) {
        V.box3q(pb, x, 70, cw, 22, 14, { ramp: ['#0a1020', '#141c34', '#202c4c', '#2e3e66', '#44588a', '#6a82b4'] });
        for (let i = 0; i < Math.floor(cw / 44); i++) { const sx = x + 8 + i * 44, sy = 10; V.rect(pb, sx - 1, sy - 1, 38, 28, U('#000633')); V.rect(pb, sx, sy, 36, 26, U('#04162e')); for (let q = 0; q < 6; q++) V.put(pb, sx + 18, sy + 26 + q, U('#2e3e66')); screens.push([sx, sy + 250, 36, 26, screens.length]); }
      }
      for (let x = 0; x < w; x += 3) V.put(pb, x, 92, U('#56e5ff'));
    }, {
      dyn: (g, cam, L) => {
        const [ox] = B.vofs(L, cam), t = T();
        for (const [sx, sy, sw, sh, i] of screens) {
          const x = sx + ox;
          if (x > W || x + sw < 0) continue;
          if (i % 3 === 1) { // patrón de mosaico que se reordena solo
            for (let q = 0; q < 24; q++) { const cx = q % 6, cy = (q / 6) | 0, v = hash2(cx, cy, Math.floor(t * 1.2) + i); g.fillStyle = v < 0.3 ? '#56e5ff' : v < 0.55 ? '#b49cff' : v < 0.7 ? '#f5dc5a' : '#0a2450'; g.fillRect(x + 2 + cx * 5 + 2, sy + 2 + cy * 6, 4, 5); }
          } else if (i % 3 === 0) { // curva de caudal con una anomalía
            g.fillStyle = '#3fe0a0';
            for (let q = 0; q < sw - 4; q++) { const yy = Math.round(sh / 2 + Math.sin(q * 0.3 + t * 2) * 5 + (q > 20 && q < 26 ? -8 : 0)); g.fillRect(x + 2 + q, sy + yy, 1, 1); }
            g.fillStyle = '#ff5a5a'; g.fillRect(x + 22, sy + 3, 5, 3);
          } else { // texto que corre
            g.fillStyle = '#56e5ff'; for (let q = 0; q < 6; q++) g.fillRect(x + 3, sy + 3 + q * 4, 6 + Math.round(hash1(q + Math.floor(t * 3), i) * 26), 1);
          }
          g.globalAlpha = 0.18; g.fillStyle = '#56e5ff'; g.fillRect(x, sy + ((Math.floor(t * 20) + i * 7) % sh), sw, 1); g.globalAlpha = 1;
        }
      },
    });
    return {
      B, rev: true,
      post(g, cam, t) {
        // barrido de alarma silencioso (rojo) + destello de interferencia ocasional
        const a = 0.08 + 0.06 * Math.sin(t * 3);
        g.globalAlpha = a; g.fillStyle = '#ff2a3a'; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
        if ((t % 4.2) < 0.12) { g.globalAlpha = 0.5; g.fillStyle = '#b49cff'; for (let i = 0; i < 6; i++) g.fillRect(0, Math.round(hash1(i, Math.floor(t * 30)) * H), W, 1); g.globalAlpha = 1; }
        V.drawMotes(g, 14, t, 31, { y0: 40, y1: 260, col: '#9fe6ff' });
      },
    };
  }
  /* =================================================================
     4 · EL ENEMIGO (atardecer; muro de la Calima con los ojos de MIRAGE)
     ================================================================= */
  function v4() {
    const B = newB(), HZ = 196, SUN = { x: 120, y: 150, r: 13, halo: 34 };
    const sky = V.sky(W + 20, H, { horizonY: HZ, sun: SUN, stops: ['#1a1440', '#2a1a54', '#44206a', '#6a2a74', '#923a72', '#b84e6a', '#d86a5e', '#ec8a56', '#f6a456', '#fcc068'], haze: ['#fcc068', '#f8b060', '#f4a058', '#ee9050'] });
    V.sunDisc(sky, SUN.x, SUN.y, 13, 34, 'dusk');
    V.stars(sky, { n: 40, y1: 60, seed: 3 });
    B.sky = sky.toCanvas();
    // muro de la Calima en el horizonte
    const wall = V.stormWall(W + 40, 150, { seed: 9, pal: V.DUST.pal, tint: '#a85a3a', rim: '#ffb070', rim2: '#e08850' });
    B.vplane(0.04, HZ - 140, 150, (pb) => V.blit(pb, wall, 0, 0));
    const veil = V.dustVeil(W + 40, 90, { seed: 4, a0: 0.1, a1: 0.5 });
    // mesas lejanas en contraluz
    B.vplane(0.1, HZ - 30, 34, (pb, w, h) => V.mesas(pb, { seed: 17, ramp: ['#2a1430', '#3a1a3a', '#4e2240', '#64304a', '#7a3e52', '#96505a', '#b4685e', '#d8885e'], yBase: h - 1, hMin: 8, hMax: 24 }));
    // ciudad de Aridia con ventanas encendidas y la torre de SYNARA con baliza roja
    let lights = [], beacon = null;
    B.vplane(0.22, HZ - 60, 150, (pb, w, h) => {
      const k = 0.2, gy = (x) => 80 - Math.max(0, 1 - Math.abs(x - 420) / 160) * 18;
      const GR = V.P32(['#2a1430', '#3a1a3a', '#4a2240', '#5e2c46', '#7a3a4c']);
      for (let x = 0; x < w; x++) for (let y = Math.round(gy(x)); y < h; y++) { const d = y - gy(x); V.put(pb, x, y, d < 1 ? U('#c86a5a') : GR[clamp(Math.round(1 + (d / 70) * 3 + (PFK.cl(x, y, 3, 5) - 0.5) * 1.2), 0, 4)]); }
      const r = RNG(19);
      for (let x = 300; x < 560;) {
        const bw = r.int(6, 12), bh = r.int(6, 22) + Math.round(Math.max(0, 1 - Math.abs(x - 420) / 120) * 16);
        const yb = Math.round(gy(x + bw / 2));
        for (let yy = yb - bh; yy < yb; yy++) for (let xx = x; xx < x + bw; xx++) V.put(pb, xx, yy, U(xx === x ? '#7a3a52' : '#4a2242'));
        for (let q = 0; q < bh / 4; q++) lights.push([x + 1 + r.int(0, bw - 3), yb - bh + 2 + r.int(0, bh - 4)]);
        x += bw + r.int(0, 3);
      }
      const T2 = V.synaraTower(pb, 420, Math.round(gy(420)) - 18, 64, { k: 0.45 });
      beacon = T2.beacon;
    }, { dyn: (g, cam, L) => { const [ox, oy] = B.vofs(L, cam), t = T(); g.fillStyle = '#ffd070'; for (let i = 0; i < lights.length; i++) if ((i + Math.floor(t * 0.4)) % 7) g.fillRect(lights[i][0] + ox, lights[i][1] + oy, 1, 1); V.drawGlow(g, beacon[0] + ox, beacon[1] + oy, 5, '#ff3a3a', Math.floor(t * 1.5) % 2 ? 0.9 : 0.3); } });
    // cresta del primer plano (roca oscura con luz de borde del ocaso) y matas al viento
    const gyF = (x) => 286 - Math.max(0, 1 - Math.abs(x - 200) / 220) * 24 + Math.sin(x * 0.04) * 3 + (x > 420 ? (x - 420) * 0.25 : 0);
    B.vplane(1, 230, 130, (pb, w, h) => {
      const R2 = V.P32(['#0e0614', '#1a0c22', '#2a1430', '#3e1c3c', '#5a2a48', '#80404e', '#b0605a', '#e08a5e']);
      for (let x = 0; x < w; x++) {
        const top = Math.round(gyF(x)) - 230;
        for (let y = Math.max(0, top); y < h; y++) {
          const d = y - top;
          let i = d === 0 ? 7 : d === 1 ? 6 : d < 4 ? 4 : 2 + (PFK.vn(x * 0.08, y * 0.06, 5) > 0.6 ? 1 : 0) - (d > 60 ? 1 : 0);
          if (hash2(x >> 1, y >> 1, 7) < 0.06) i -= 1;
          pb.data[y * w + x] = R2[clamp(i, 0, 7)];
        }
      }
      V.windGrass(pb, 0, w, (x) => gyF(x) - 230, { seed: 45, density: 0.7, lean: 2.4, h: 8, ramp: ['#1a0c22', '#3e1c3c', '#6a3448', '#a85a52', '#e0905e'] });
      SCAKit.deadTree(pb, 590, Math.round(gyF(590)) - 228, 90, 13, { w: 4, ramp: ['#0e0614', '#1a0c22', '#2a1430', '#4a2238', '#c0704e'] });
    });
    return {
      B, rev: false,
      post(g, cam, t) {
        const ox = -Math.round(cam.x);
        // ojos de MIRAGE en el muro (dos brasas que se encienden despacio) y velo de polvo que avanza
        const ex = 470 - Math.round(cam.x * 0.04), ey = HZ - 92, on = 0.5 + 0.5 * Math.sin(t * 0.9);
        V.drawGlow(g, ex, ey, 9, '#ff7a3a', 0.25 + on * 0.35); V.drawGlow(g, ex + 30, ey + 2, 9, '#ff7a3a', 0.25 + on * 0.35);
        g.fillStyle = '#ffe0a0'; g.fillRect(ex - 2, ey, 4, 1); g.fillRect(ex + 28, ey + 2, 4, 1);
        V.drawVeil(g, veil, HZ - 50, t * 14, 0.5);
        V.drawBloom(g, SUN.x - cam.x * 0.02, SUN.y, 34, '#ffc080', 0.22, t);
        // Amaya y KIRU miran el horizonte desde la cresta
        drawChar(g, 'amaya', 'observe', t, 236 + ox, Math.round(gyF(236)) + 1, 1, { shadow: false });
        drawChar(g, 'kiru', 'idle', t, 196 + ox, Math.round(gyF(196)) - 30, 1, { shadow: false, expr: 'alarmado' });
        // luz de contorno del ocaso en el lado del sol (franja translúcida)
        V.drawMotes(g, 20, t, 41, { y0: 120, y1: 320, col: '#ffb070' });
        V.drawWind(g, 14, t, 9, { y0: 150, y1: 330, speed: 120, len: 22, a: 0.3 });
      },
    };
  }
  return { get, ready, draw, PAN, N: 5 };
})();
/** Tira del águila grande (reutiliza la del título) */
function SCATitleArtEagle() { return SCATitleArt.eagle(); }
