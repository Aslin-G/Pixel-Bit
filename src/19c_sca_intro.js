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

  /** Figura diminuta del plano medio (≈11 px): cabeza, túnica de color, piernas y, si jug, cántaro en la cabeza */
  function tinyFolk(pb, x, yb, col, jug) {
    const C = U(col), Cd = V.shU(C, -0.3, 260), SK = U('#8a5a3a'), SKl = U('#b47a50'), SH = U('#a8783e');
    for (let q = -2; q <= 3; q++) V.put(pb, x + q, yb, SH);
    V.put(pb, x, yb - 1, U('#3a2418')); V.put(pb, x + 2, yb - 1, U('#3a2418')); V.put(pb, x, yb - 2, U('#3a2418')); V.put(pb, x + 2, yb - 2, U('#3a2418'));
    for (let y = yb - 7; y < yb - 2; y++) for (let xx = x - (y > yb - 4 ? 1 : 0); xx <= x + 2; xx++) V.put(pb, xx, y, xx === x + 2 || y === yb - 3 ? Cd : C);
    V.put(pb, x, yb - 8, SKl); V.put(pb, x + 1, yb - 8, SK); V.put(pb, x, yb - 9, SKl); V.put(pb, x + 1, yb - 9, SK); V.put(pb, x + 2, yb - 9, U('#2a1810'));
    if (jug) { for (const [dx, dy, c] of [[0, -10, '#c86a3a'], [1, -10, '#a8502c'], [-1, -11, '#e08a50'], [0, -11, '#c86a3a'], [1, -11, '#c86a3a'], [2, -11, '#a8502c'], [0, -12, '#e08a50'], [1, -12, '#c86a3a']]) V.put(pb, x + dx, yb + dy, U(c)); }
    else { for (let y = yb - 6; y < yb - 2; y++) V.put(pb, x + 3, y, U('#2a72aa')); V.put(pb, x + 3, yb - 7, U('#8cc8ec')); }
  }
  /** Carro de bidones con burro (plano medio) */
  function donkeyCart(pb, x, yb) {
    const D = V.P32(['#3a2a24', '#5a463a', '#7a6454', '#9a8470']), W2 = V.P32(['#3a2418', '#5a3a22', '#7a5434', '#9a6e46']);
    for (let q = -6; q <= 26; q++) V.put(pb, x + q, yb + 1, U('#a8783e'));
    // burro: cuerpo, cabeza, orejas, patas
    for (let y = yb - 7; y < yb - 3; y++) for (let xx = x + 16; xx < x + 24; xx++) V.put(pb, xx, y, D[y === yb - 7 ? 3 : xx > x + 21 ? 1 : 2]);
    for (let y = yb - 10; y < yb - 6; y++) for (let xx = x + 24; xx < x + 27; xx++) V.put(pb, xx, y, D[y === yb - 10 ? 3 : 2]);
    V.put(pb, x + 24, yb - 11, D[1]); V.put(pb, x + 25, yb - 12, D[1]); V.put(pb, x + 26, yb - 8, D[0]);
    for (const lx of [x + 17, x + 19, x + 21, x + 23]) for (let y = yb - 3; y <= yb; y++) V.put(pb, lx, y, D[0]);
    // varas y caja del carro con dos bidones azules
    for (let xx = x + 8; xx < x + 17; xx++) V.put(pb, xx, yb - 5, W2[1]);
    for (let y = yb - 6; y < yb - 1; y++) for (let xx = x - 4; xx < x + 9; xx++) V.put(pb, xx, y, W2[y === yb - 6 ? 3 : xx === x - 4 ? 2 : 1]);
    for (const bx of [x - 2, x + 3]) for (let y = yb - 11; y < yb - 6; y++) for (let xx = bx; xx < bx + 4; xx++) V.put(pb, xx, y, U(y === yb - 11 ? '#8cc8ec' : xx === bx ? '#4a9ad0' : '#2a72aa'));
    // rueda
    for (const [dx, dy] of [[0, -3], [1, -3], [-1, -2], [2, -2], [-1, -1], [2, -1], [0, 0], [1, 0]]) V.put(pb, x + 2 + dx, yb + dy, W2[0]);
    V.put(pb, x + 2, yb - 2, W2[3]);
  }
  /** Barca de pesca fondeada en 3/4: casco con borda, cubierta clara, cabina blanca, mástil y reflejo */
  function fishBoat(pb, cx, yw) {
    const HL = V.P32(['#1a2a4a', '#24406a', '#2e5a8a', '#e8e4de', '#c83a3a']), DK = V.P32(['#7a5434', '#9a6e46', '#c08a5a']);
    const L = 40;
    for (let x = -L / 2; x <= L / 2; x++) {
      const bow = x > L / 2 - 8 ? (x - (L / 2 - 8)) * 0.5 : 0, stern = x < -L / 2 + 3 ? 1 : 0;
      const yTop = yw - 8 + Math.round(bow * 0.6) - stern, yBot = yw - Math.round(bow);
      for (let y = yTop; y <= yBot; y++) V.put(pb, cx + x, y, y === yTop ? HL[3] : y === yTop + 1 ? HL[4] : y > yBot - 2 ? HL[0] : x < -L / 4 ? HL[2] : HL[1]);
      // cubierta vista desde arriba (3/4)
      if (x > -L / 2 + 1 && x < L / 2 - 4) for (let y = yTop - 3; y < yTop; y++) V.put(pb, cx + x, y, DK[y === yTop - 3 ? 2 : 1]);
    }
    for (let y = yw - 20; y < yw - 11; y++) for (let x = -10; x < 2; x++) V.put(pb, cx + x, y, U(y === yw - 20 ? '#ffffff' : x === 1 ? '#a8b0c0' : '#e8ecf2'));
    for (let x = -8; x < 0; x += 3) { V.put(pb, cx + x, yw - 17, U('#2a4a78')); V.put(pb, cx + x + 1, yw - 17, U('#56a8e0')); }
    for (let y = yw - 34; y < yw - 11; y++) V.put(pb, cx + 6, y, U('#5a3a22'));
    for (let x = 6; x < 18; x++) V.put(pb, cx + x, yw - 34 + Math.round((x - 6) * 1.6), U('#3a3a4a'));
    // reflejo roto y estela de espuma alrededor del casco
    for (let x = -L / 2; x <= L / 2; x += 1) { if (hash2(x, yw, 3) < 0.55) V.blend(pb, cx + x, yw + 2 + ((x >> 2) & 1), U('#1a3a6a'), 0.45); if ((x & 3) === 0) V.put(pb, cx + x, yw + 1, U('#e8f6ff')); }
  }
  /** Boya cónica con banda y linterna */
  function buoy(pb, x, yw, col) {
    const C = U(col), Cd = V.shU(C, -0.3, 260);
    for (let y = yw - 7; y <= yw; y++) { const hw = Math.round((y - (yw - 7)) * 0.45) + 1; for (let xx = x - hw; xx <= x + hw; xx++) V.put(pb, xx, y, y === yw - 3 ? U('#f4f0e8') : xx > x ? Cd : C); }
    for (let y = yw - 9; y < yw - 7; y++) V.put(pb, x, y, U('#3a3a4a'));
    for (let xx = x - 4; xx <= x + 4; xx++) if (Math.abs(xx - x) !== 3) V.put(pb, xx, yw + 1, U('#e8f6ff'));
  }
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
      // caravana del agua: aguadoras con cántaros vacíos y un carro de bidones tirado por un burro, hacia la ciudad
      donkeyCart(pb, 336, 64);
      for (const [x, y, c, jug] of [[284, 62, '#c84a3a', 1], [296, 64, '#2a72aa', 0], [308, 63, '#e8b040', 1], [320, 65, '#6a4a8a', 1], [272, 61, '#3a8a5a', 0]]) tinyFolk(pb, x, y, c, jug);
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
    const buoys = [];
    const nearL = B.vplane(0.45, 176, H - 176, (pb) => {
      SCAKit.nearSea(pb, { seed: 31, t0: 0.12, t1: 0.86 });
      // barca de pesca fondeada (casco en 3/4 con cubierta, cabina y reflejo) y boyas de señalización
      fishBoat(pb, 150, 64);
      for (const [x, y, c] of [[300, 50, '#e83b41'], [236, 92, '#ffd23a'], [420, 70, '#e83b41']]) { buoy(pb, x, y, c); buoys.push([x, y - 9, c]); }
    }, {
      dyn: (g, cam, L) => {
        const [ox, oy] = B.vofs(L, cam), t = T();
        SCAKit.drawSeaGlints(g, 40, t, 0, 180, W + 40, 130, ox);
        // destellos de las boyas (cada una con su ritmo)
        for (let i = 0; i < buoys.length; i++) { const [x, y, c] = buoys[i]; if (Math.floor(t * 1.2 + i * 0.7) % 2) { V.drawGlow(g, x + ox, y + oy, 3, c, 0.7); g.fillStyle = '#fff6d8'; g.fillRect(x + ox, y + oy, 1, 1); } }
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
      // (FIXUI SU-10) la ladera ya no termina en un corte vertical: baja en playa hasta el agua, con
      // arena mojada bajo la línea de agua y espuma; y detrás de la primera fila hay una terraza con muro
      // de contención (cara de piedra en bandas) sobre la que se apoyan las casas de atrás.
      const WL = Math.round(gy(262)) + 3, SAND = V.P32(RAMP.sandR), WET = U('#a8865a'), FOAM = [U('#e6fdff'), U('#c6fff2')];
      const beachTop = (x) => (x >= 292 ? gy(x) : gy(x) + (292 - x) * 0.62);
      // orilla en diagonal: bajo la línea de agua el mar ocupa el triángulo inferior izquierdo (más cerca, más mar)
      const shoreX = (y) => 238 + (y - WL) * 1.15;
      for (let x = 236; x < w; x++) {
        const top = Math.round(beachTop(x));
        for (let y = top; y < h; y++) {
          const sx = y > WL ? shoreX(y) : -1;
          if (x < sx) continue;
          const t = (y - top) / 50;
          let c = SAND[clamp(Math.round(4 - t * 3 + (hash2(x >> 1, y >> 1, 3) - 0.5) * 1.4), 0, 5)];
          if (sx >= 0 && x < sx + 2) c = hash2(x, y >> 1, 7) > 0.3 ? FOAM[(x + y) & 1] : FOAM[1];
          else if (sx >= 0 && x < sx + 5) c = WET;
          else if (y >= WL - 1 && y <= WL && x < 296) c = hash2(x >> 1, y, 7) > 0.35 ? FOAM[0] : WET;
          V.put(pb, x, y, c);
        }
        if (top < WL - 1 && x < 296) V.put(pb, x, top, U('#fde8a8'));
      }
      const STONE = ['#6a4a3a', '#8a6a52', '#b08a68', '#d2ae86', '#ead2aa'].map(U), MORTAR = U('#4a3028');
      for (let x = 272; x < w; x++) {
        const g0 = Math.round(gy(x)), yT = g0 - 37;
        for (let y = yT; y < g0; y++) {
          const by = y - yT;
          let c;
          if (by === 0) c = STONE[4];
          else if (by < 3) c = SAND[4 + (hash2(x >> 1, y, 5) > 0.7 ? 1 : 0)];
          else if (x < 276) c = STONE[x - 272 < 2 ? 1 : 0];
          else {
            const row = Math.floor((by - 3) / 4), bx = (x + (row % 2) * 3) % 7;
            c = (by - 3) % 4 === 3 || bx === 0 ? MORTAR : STONE[clamp(1 + Math.floor(hash2(Math.floor((x + (row % 2) * 3) / 7), row, 9) * 3) - (by > 26 ? 1 : 0), 0, 4)];
          }
          V.put(pb, x, y, c);
        }
        // escalera que sube a la terraza
        if (x >= 318 && x < 334) for (let k = 0; k < 9; k++) { const sx = 318 + k * 2, sy = g0 - 4 - k * 4; if (x >= sx && x < sx + 6) for (let y = sy; y < sy + 4 && y < g0; y++) V.put(pb, x, y, y === sy ? STONE[4] : STONE[2]); }
      }
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
  /** Bastidor de servidores en 3/4: techo claro, lateral en violeta, frente con unidades, rejillas y LED */
  function serverRack(pb, x, yb, w, h, d, k) {
    const RR = V.hz(['#05081a', '#0a1028', '#101a3a', '#18264e', '#223464', '#2e467e', '#40609c', '#6a8cc4'], k, '#0a1430');
    V.box3q(pb, x, yb, w, h, d, { ramp: RR, front: 2, side: 1, top: 6 });
    const P = V.P32(RR), leds = [], A = U(V.hzc('#56e5ff', k, '#0a1430'));
    for (let xx = x; xx < x + w; xx++) { V.put(pb, xx, yb - h + 1, A); V.put(pb, xx, yb - h + 2, P[4]); }
    const uh = Math.max(5, Math.round(h / 12));
    for (let yy = yb - h + 5; yy + uh <= yb - 4; yy += uh) {
      for (let xx = x + 2; xx < x + w - 2; xx++) { V.put(pb, xx, yy, P[4]); V.put(pb, xx, yy + uh - 1, P[0]); }
      for (let xx = x + 4; xx < x + w - 10; xx += 2) for (let q = 2; q < uh - 2; q++) V.put(pb, xx, yy + q, P[1]);
      V.put(pb, x + 2, yy + 1, P[5]);
      leds.push([x + w - 6, yy + 2], [x + w - 4, yy + 2]);
    }
    // reflejo diagonal en la puerta de cristal del bastidor
    for (let yy = yb - h + 4; yy < yb - 3; yy++) for (let xx = x + 2; xx < x + w - 2; xx++) { const q = ((xx - x) + (yy - yb + h)) % 70; if (q >= 24 && q < 27) { const c = V.get(pb, xx, yy); V.put(pb, xx, yy, V.mixU(c, P[6], q === 25 ? 0.4 : 0.22)); } }
    // marco: montantes claros a la izquierda (luz clave) y sombra a la derecha
    for (let yy = yb - h + 3; yy < yb - 1; yy++) { V.put(pb, x, yy, P[5]); V.put(pb, x + 1, yy, P[3]); V.put(pb, x + w - 1, yy, P[0]); }
    return { leds };
  }
  /** Reilumina de noche los píxeles poco saturados de una zona (estuco a día → rampa fría con matiz) */
  function relightNight(pb, x0, y0, x1, y1) {
    const NR = V.P32(['#0a0c24', '#11183a', '#18244e', '#203062', '#283e76', '#324e8a', '#40629e', '#5478b0', '#6e94c4', '#8eb2d8', '#b8d4ea', '#e2f2fa']);
    let lo = 1, hi = 0; const sel = [];
    for (let y = Math.max(0, y0); y < Math.min(pb.h, y1); y++) for (let x = Math.max(0, x0); x < Math.min(pb.w, x1); x++) {
      const c = pb.data[y * pb.w + x]; if ((c >>> 24) < 200) continue;
      const r = c & 255, gg = (c >>> 8) & 255, b = (c >>> 16) & 255, mx = Math.max(r, gg, b), mn = Math.min(r, gg, b);
      if (mx === 0 || (mx - mn) / mx > 0.38) continue;
      const l = (0.3 * r + 0.59 * gg + 0.11 * b) / 255; sel.push(y * pb.w + x, l); if (l < lo) lo = l; if (l > hi) hi = l;
    }
    const rg = Math.max(0.05, hi - lo), CY = U('#2a8aa0');
    for (let i = 0; i < sel.length; i += 2) {
      const at = sel[i], y = (at / pb.w) | 0;
      let k = Math.round(Math.pow((sel[i + 1] - lo) / rg, 1.25) * (NR.length - 1));
      // hiladas del tambor y luz de rebote cian del charco del suelo en la base
      if (y > 100 && y < 214 && (y % 12) === 4) k -= 1;
      let u = NR[clamp(k, 0, NR.length - 1)];
      if (y > 196) u = V.mixU(u, CY, y > 214 ? 0.34 : 0.2);
      pb.data[at] = u;
    }
  }
  /** Reflejo en el suelo pulido: copia invertida y tenue de lo que hay justo encima de y0 (alfa en 3 bandas) */
  function reflect(pb, y0, len) {
    for (let x = 0; x < pb.w; x++) {
      // base del objeto de esa columna (último píxel opaco por encima de y0)
      let base = -1; for (let y = Math.min(pb.h - 1, y0); y > y0 - 40; y--) if ((pb.data[y * pb.w + x] >>> 24) > 200) { base = y; break; }
      if (base < 0) continue;
      for (let d = 1; d <= len; d++) {
        const sy = base - d + 1, dy = base + d; if (dy >= pb.h || sy < 0) break;
        const c = pb.data[sy * pb.w + x]; if ((c >>> 24) < 200 || (pb.data[dy * pb.w + x] >>> 24)) continue;
        const a = d < len * 0.35 ? 0.34 : d < len * 0.7 ? 0.2 : 0.1;
        pb.data[dy * pb.w + x] = ((Math.round(a * 255) << 24) | (V.mixU(c, U('#2a8aa0'), 0.35) & 0xffffff)) >>> 0;
      }
    }
  }
  const TECH_OPTS = [{ shadow: false, env: 'night' }, { shadow: false, env: 'night', beam: false }];
  function v3() {
    const B = newB();
    // técnicos: sus cuadros se generan aquí (en la composición de la viñeta) y no en pleno paneo
    for (const [a, o] of [['program', TECH_OPTS[0]], ['scan', TECH_OPTS[1]]]) for (let f = 0; f < 6; f++) SpriteCache.get('operador', a, f, o);
    const sky = new PixelBuffer(W + 20, H);
    const R = V.P32(V.expand(['#020818', '#041230', '#071c44', '#0a2654', '#0c2c60'], 12));
    for (let y = 0; y < H; y++) for (let x = 0; x < sky.w; x++) sky.data[y * sky.w + x] = R[V.band(y / H * 0.9, R.length, x, y, 0.04, 3)];
    B.sky = sky.toCanvas();
    // pared del fondo: paneles con nervios y ventanal nocturno con estrellas y la ciudad iluminada
    const winLights = [], trays = [], strips = [], cone = V.lightCone(30, 70, 120, '#9fe6ff', 0.18);
    // suelo pulido en perspectiva (fuga en el núcleo): bandas de tono que se enfrían hacia el espectador,
    // juntas que convergen, charco de luz cian bajo el tambor (bandas planas, sin tramado)
    const FL = V.P32(['#05091c', '#080f28', '#0b1634', '#0f1e42', '#132650', '#18305e', '#1e3a6c', '#26487c']);
    const FG = V.P32(['#103a5e', '#145070', '#1a6a86', '#2a8aa0']);
    const VX = 340, VY = 170;
    const floorPx = (x, y) => {
      const v = (y - 232) / 128;
      let i = 7 - Math.min(6, Math.floor(Math.pow(v, 0.7) * 7.2));
      const dz = (y - VY), u = (x - VX) / dz * 64;
      const seamX = Math.abs(u - Math.round(u / 22) * 22) < 22 / dz * 1.2 + 0.2;
      const zr = 1200 / dz, seamY = Math.abs(zr - Math.round(zr / 2.2) * 2.2) < 0.08 * zr / 6 + 0.02;
      // charco de luz cian bajo el núcleo (elipse en 3 bandas)
      const ex = (x - 340) / 190, ey = (y - 236) / 22, e = ex * ex + ey * ey;
      if (e < 1) { const b = e < 0.25 ? 3 : e < 0.55 ? 2 : e < 0.8 ? 1 : 0; return seamX || seamY ? FG[Math.max(0, b - 1)] : FG[b]; }
      if (seamX || seamY) i = Math.max(0, i - 2);
      return FL[i];
    };
    B.vplane(0.15, 0, H, (pb, w, h) => {
      const P = V.P32(['#06122a', '#0a1a3a', '#0e244a', '#14305c', '#1c3e70', '#2a5288']);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (y >= 232) { pb.data[y * w + x] = floorPx(x, y); continue; }
        let i = 2 + ((x % 48) < 2 ? -1 : 0) + ((y % 40) === 0 ? 1 : 0) + (y > h - 30 ? -1 : 0);
        if ((x % 48) === 2) i = 4;
        // lavado de luz de las lámparas del techo sobre la pared (2 bandas planas por lámpara)
        for (const lx of [60, 160, 540, 640]) { if (y < 36 || y > 200) break; const hw = 20 + (y - 36) * 0.35, d = (x - lx) / hw; if (d > 1 || d < -1) continue; const lv = (1 - d * d) * (1 - (y - 36) / 164); i += lv > 0.5 ? 2 : lv > 0.22 ? 1 : 0; break; }
        // remaches en los nervios y rozaduras en grupos de 2×2 (textura dispersa, sin trama)
        if ((y % 40) === 2 && (x % 12) === 6) i += 2;
        else if (hash2(x >> 1, y >> 1, 5) < 0.06) i -= 1;
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
      // bandejas de cables y tiras de luz en el techo
      for (const [y, x0, x1] of [[10, 0, w], [20, 20, w - 20]]) { const T2 = V.cableTray(pb, x0, x1, y, { k: 0.2, hang: 10 }); trays.push(T2.flow); }
      for (const lx of [40, 140, 520, 620]) strips.push(V.lightStrip(pb, lx, lx + 40, 34, '#9fe6ff'));
    }, { dyn: (g, cam, L) => { const [ox, oy] = B.vofs(L, cam), t = T(); g.fillStyle = '#ffd88a'; for (let i = 0; i < winLights.length; i++) if ((i * 7 + Math.floor(t * 0.5)) % 9) { const [x, y] = winLights[i]; g.fillRect(x + ox, y + oy, 1, 1); } V.drawStrips(g, strips, ox, oy, t, { col: '#e6fdff', speed: 40 }); for (const F of trays) V.drawFlow(g, F, ox, oy, t, { col: '#56e5ff', speed: 30, gap: 11 }); g.globalCompositeOperation = 'lighter'; for (const [x0] of strips) { g.globalAlpha = 0.5; g.drawImage(cone, x0 + ox - 10, 35 + oy); } g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; } });
    // el núcleo de SYNARA (tambor con cúpula de vidrio y franja cian) y bastidores de datos
    let core = null; const racks = [], dataTrays = [], holo = [];
    const domeCone = V.lightCone(70, 250, 210, '#8fdcff', 0.2), moonCone = V.lightCone(150, 260, 190, '#9fb8ff', 0.1);
    const midL = B.vplane(0.4, 30, 260, (pb, w, h) => {
      core = PFBC.synaraCore(pb, 330, 230, 200, 120);
      relightNight(pb, 200, 0, 462, 232);
      // dos hileras de bastidores en 3/4: la de atrás más pequeña y apagada, la de delante con más luz
      for (const x of [22, 72, 122, 172, 498, 548, 598, 648]) racks.push(...serverRack(pb, x, 208, 34, 128, 10, 0.34).leds);
      for (const x of [0, 50, 100, 150, 474, 524, 574, 624]) { const R2 = serverRack(pb, x, 236, 44, 116, 14, 0); racks.push(...R2.leds); }
      // bandejas de datos desde las hileras hasta el tambor (con flujo animado)
      for (const [x0, x1, y] of [[0, 214, 104], [450, w, 104], [0, 236, 96], [430, w, 96]]) { const T2 = V.cableTray(pb, x0, x1, y, { k: 0.15, hang: 14, cols: ['#2c63c0', '#56e5ff', '#3a3a4a', '#6a4ab0'] }); dataTrays.push(T2.flow); }
      // pedestal del holograma entre el núcleo y la hilera derecha
      V.box3q(pb, 446, 240, 22, 8, 8, { ramp: ['#0a1020', '#141c34', '#202c4c', '#2e3e66', '#44588a', '#6a82b4'] });
      for (let xx = 447; xx < 467; xx++) V.put(pb, xx, 233, U('#56e5ff'));
      holo.push([457, 228]);
      reflect(pb, 252, 24);
    }, {
      dyn: (g, cam, L) => {
        const [ox, oy] = B.vofs(L, cam), t = T();
        // leds de bastidores: la mayoría cian, algunos ámbar que parpadean fuera de ritmo
        for (let i = 0; i < racks.length; i++) { const [x, y] = racks[i]; const on = Math.floor(t * (1.5 + (i % 5) * 0.3) + i) % 3; if (!on) continue; g.fillStyle = i % 9 === 4 ? '#ffb040' : i % 4 === 1 ? '#3fe0a0' : '#56e5ff'; g.fillRect(x + ox, y + oy, 1, 1); }
        for (const F of dataTrays) V.drawFlow(g, F, ox, oy, t, { col: '#9fe6ff', speed: 46, gap: 14 });
        if (core) { const [dx, dy] = core.dome; V.drawGlow(g, dx + ox, dy + oy, 22, '#56e5ff', 0.25 + 0.12 * Math.sin(t * 1.7)); for (const [bx, by] of core.beacons) V.drawGlow(g, bx + ox, by + oy, 4, '#ff3a3a', Math.floor(t * 2) % 2 ? 0.9 : 0.25); }
        // conos de luz en bandas: desde la cúpula hasta el suelo y la luna por el ventanal
        g.globalCompositeOperation = 'lighter';
        if (core) { g.globalAlpha = 0.75 + 0.15 * Math.sin(t * 1.7); g.drawImage(domeCone, core.dome[0] + ox - 125, core.dome[1] + oy + 6); }
        g.globalAlpha = 0.8; g.drawImage(moonCone, 210 + ox, 48 + oy);
        g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
        // holograma: mosaico que se reordena solo, en un prisma translúcido sobre el pedestal
        for (const [hx, hy] of holo) {
          const x0 = hx + ox - 14, y0 = hy + oy - 44;
          g.globalAlpha = 0.16; g.fillStyle = '#56e5ff'; g.fillRect(x0 + 4, y0 + 36, 20, 8); g.fillRect(x0, y0, 28, 36);
          g.globalAlpha = 0.55;
          for (let q = 0; q < 16; q++) { const cx = q % 4, cy = (q / 4) | 0, v = hash2(cx, cy, Math.floor(t * 0.9) + 7); g.fillStyle = v < 0.35 ? '#56e5ff' : v < 0.6 ? '#b49cff' : v < 0.72 ? '#f5dc5a' : '#123a6a'; g.fillRect(x0 + 3 + cx * 6, y0 + 4 + cy * 7, 5, 6); }
          g.globalAlpha = 0.3; g.fillStyle = '#c4fbff'; g.fillRect(x0, y0 + ((Math.floor(t * 18)) % 36), 28, 1);
          g.globalAlpha = 1; g.fillStyle = '#9fe6ff'; g.fillRect(x0, y0, 28, 1); g.fillRect(x0, y0 + 35, 28, 1);
        }
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
        // técnicos de guardia: uno teclea ante el holograma y otro escanea un bastidor (iluminados de noche)
        const [mx, my] = B.vofs(midL, cam);
        drawChar(g, 'operador', 'program', t, 432 + mx, 240 + my, 1, TECH_OPTS[0]);
        drawChar(g, 'operador', 'scan', t + 0.4, 214 + mx, 240 + my, -1, TECH_OPTS[1]);
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
  /** Roca en contraluz del ocaso: forma de domo irregular, cara del sol (izquierda) cálida, sombra violeta */
  function duskRock(pb, cx, yb, r, k, rh) {
    const R = V.P32(['#0e0614', '#1a0c22', '#2a1430', '#3e1c3c', '#5a2a48', '#80404e', '#b0605a', '#e08a5e']);
    const ry = rh || Math.max(2, Math.round(r * 0.72));
    for (let y = yb - ry; y <= yb; y++) for (let x = cx - r; x <= cx + r; x++) {
      const nx = (x - cx) / r, ny = (y - yb) / ry, wob = (hash1((x >> 2) + cx, 11) - 0.5) * 0.18;
      if (nx * nx + ny * ny > 1 + wob) continue;
      const lit = -nx * 0.75 - ny * 0.35 + (PFK.vn(x * 0.2, y * 0.2, 9) - 0.5) * 0.3;
      let i = k >= 1 ? 1 + Math.round(clamp(lit, -0.4, 1) * 2.4) : 2 + Math.round(clamp(lit, -0.4, 1) * 2.6);
      if (nx * nx + ny * ny > 0.8 + wob && nx < -0.25 && ny < 0.2) i = k >= 1 ? 6 : 7; // borde encendido
      if (y >= yb - 1) i = 0;
      V.put(pb, x, y, R[clamp(i, 0, 7)]);
    }
  }
  function v4() {
    const B = newB(), HZ = 196, SUN = { x: 120, y: 150, r: 13, halo: 34 };
    const sky = V.sky(W + 20, H, { horizonY: HZ, sun: SUN, stops: ['#1a1440', '#2a1a54', '#44206a', '#6a2a74', '#923a72', '#b84e6a', '#d86a5e', '#ec8a56', '#f6a456', '#fcc068'], haze: ['#fcc068', '#f8b060', '#f4a058', '#ee9050'] });
    V.sunDisc(sky, SUN.x, SUN.y, 13, 34, 'dusk');
    V.stars(sky, { n: 40, y1: 60, seed: 3 });
    B.sky = sky.toCanvas();
    // muro de la Calima en el horizonte
    const wall = V.stormWall(W + 40, 200, { seed: 9, pal: V.DUST.pal, tint: '#a85a3a', rim: '#ffb070', rim2: '#e08850', wMin: 190, wMax: 320, hK0: 0.6, hK1: 0.8 });
    B.vplane(0.04, HZ - 186, 200, (pb) => { V.blit(pb, wall, 0, 0); for (let i = 0; i < pb.data.length; i++) { const c = pb.data[i]; if (c >>> 24) pb.data[i] = (V.mixU(c, U('#7a3442'), 0.28 + 0.2 * ((i / pb.w | 0) / pb.h)) & 0xffffff | (c & 0xff000000)) >>> 0; } });
    const wall2 = V.stormWall(W + 40, 110, { seed: 21, pal: V.DUST.pal, tint: '#8a4a3a', rim: '#f09060', rim2: '#c06848', wMin: 120, wMax: 200 });
    B.vplane(0.07, HZ - 96, 110, (pb) => { V.blit(pb, wall2, 0, 0); for (let i = 0; i < pb.data.length; i++) { const c = pb.data[i]; if (c >>> 24) pb.data[i] = (V.mixU(c, U('#5a2a3a'), 0.35) & 0xffffff | (c & 0xff000000)) >>> 0; } });
    const veil = V.dustVeil(W + 40, 90, { seed: 4, a0: 0.1, a1: 0.5 });
    // mesas lejanas en contraluz
    B.vplane(0.1, HZ - 30, 34, (pb, w, h) => V.mesas(pb, { seed: 17, ramp: ['#2a1430', '#3a1a3a', '#4e2240', '#64304a', '#7a3e52', '#96505a', '#b4685e', '#d8885e'], yBase: h - 1, hMin: 8, hMax: 24 }));
    // ciudad de Aridia con ventanas encendidas y la torre de SYNARA con baliza roja
    let lights = [], beacon = null;
    B.vplane(0.22, HZ - 60, H - HZ + 60, (pb, w, h) => {
      const k = 0.2, gy = (x) => 80 - Math.max(0, 1 - Math.abs(x - 420) / 160) * 18;
      const GR = V.P32(['#2a1430', '#3a1a3a', '#4a2240', '#5e2c46', '#7a3a4c']);
      for (let x = 0; x < w; x++) for (let y = Math.round(gy(x)); y < h; y++) { const d = y - gy(x); V.put(pb, x, y, d < 1 ? U('#c86a5a') : GR[clamp(Math.round(1 + (d / 70) * 3 + (PFK.cl(x, y, 3, 5) - 0.5) * 1.2), 0, 4)]); }
      // camino de tierra que sale del primer plano hacia la ciudad (banda clara con borde iluminado)
      const RD = V.P32(['#5e2c46', '#7a3a4c', '#96505a', '#b4685e']);
      for (let y = 84; y < h; y++) {
        const v = (y - 84) / (h - 84), cx = lerp(392, 150, Math.pow(v, 0.8)), hw = 1 + v * 26;
        for (let x = Math.round(cx - hw); x <= cx + hw; x++) { const e = Math.abs(x - cx) / hw; V.put(pb, x, y, RD[e > 0.86 ? 0 : x < cx - hw * 0.5 ? 3 : e < 0.3 && ((y >> 2) % 3 === 0) ? 1 : 2]); }
      }
      // rocas dispersas con luz rasante del ocaso (cara del sol cálida, sombra violeta)
      const rr = RNG(23);
      for (let q = 0; q < 16; q++) { const x = rr.int(10, w - 10), y = rr.int(96, h - 6); if (Math.abs(x - lerp(392, 150, Math.pow((y - 84) / (h - 84), 0.8))) < 34) continue; duskRock(pb, x, y, 2 + Math.round((y - 90) / 22) + rr.int(0, 2), 0.6); }
      // postes del tendido junto al camino, con cables combados (siluetas recortadas contra el llano)
      const poles = [[410, 92, 10], [392, 102, 16], [368, 116, 24], [336, 136, 34], [292, 166, 48]];
      for (let i = 0; i < poles.length; i++) {
        const [px, yb, ph] = poles[i];
        for (let y = yb - ph; y < yb; y++) { V.put(pb, px, y, U('#140818')); if (ph > 20) V.put(pb, px + 1, y, U('#140818')); V.put(pb, px - 1, y, U('#c06a54')); }
        const aw = Math.max(2, Math.round(ph / 6));
        for (let x = px - aw; x <= px + aw + 1; x++) V.put(pb, x, yb - ph + 2, U('#140818'));
        if (i) { const [qx, qyb, qh] = poles[i - 1]; for (const side of [-1, 1]) { const x0 = qx + side * Math.max(2, Math.round(qh / 6)), y0 = qyb - qh + 2, x1 = px + side * aw, y1 = yb - ph + 2; for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) { const t = (x - x0) / (x1 - x0 || 1); V.put(pb, x, Math.round(lerp(y0, y1, t) + Math.sin(t * Math.PI) * (2 + ph / 12)), U('#2a1430')); } } }
      }
      // cerca de alambre a la derecha del camino (postes cada 12 px y dos hilos)
      for (let x = 430; x < w; x += 12) { const y0 = 100 + Math.round((x - 430) * 0.08); for (let y = y0 - 7; y < y0; y++) V.put(pb, x, y, U('#1a0c22')); V.put(pb, x - 1, y0 - 7, U('#c06a54')); }
      for (let x = 430; x < w; x++) { const y0 = 100 + Math.round((x - 430) * 0.08); V.put(pb, x, y0 - 5, U('#3a1a3a')); V.put(pb, x, y0 - 2, U('#3a1a3a')); }
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
      // rocas de encuadre en los bordes (grandes, en contraluz con borde encendido del lado del sol)
      duskRock(pb, 12, 112, 40, 1, 82); duskRock(pb, 58, 104, 18, 1, 34); duskRock(pb, 650, 112, 46, 1, 74); duskRock(pb, 604, 108, 20, 1, 30);
      // cerca rota sobre la cresta: postes inclinados y un hilo caído
      for (let i = 0; i < 9; i++) {
        const x = 300 + i * 18, yb = Math.round(gyF(x)) - 230, lean = ((i * 37) % 5) - 2, ph = i === 4 ? 6 : 15 - (i % 3);
        for (let y = 0; y < ph; y++) { const xx = x + Math.round(lean * y / ph); V.put(pb, xx, yb - y, U('#140818')); V.put(pb, xx + 1, yb - y, U('#2a1430')); V.put(pb, xx - 1, yb - y, y > 2 ? U('#b0605a') : U('#140818')); }
      }
      for (let x = 300; x < 444; x++) { const t = (x - 300) / 144, y = Math.round(gyF(x)) - 230 - 10 + Math.round(Math.sin(t * Math.PI * 2) * 2 + (t > 0.45 && t < 0.62 ? 7 : 0)); V.put(pb, x, y, U('#3e1c3c')); }
    });
    return {
      B, rev: false,
      post(g, cam, t) {
        const ox = -Math.round(cam.x);
        // ojos de MIRAGE en el muro (dos brasas que se encienden despacio) y velo de polvo que avanza
        const ex = 452 - Math.round(cam.x * 0.04), ey = HZ - 74, on = 0.5 + 0.5 * Math.sin(t * 0.9);
        V.drawGlow(g, ex, ey, 12, '#ff7a3a', 0.25 + on * 0.4); V.drawGlow(g, ex + 40, ey + 2, 12, '#ff7a3a', 0.25 + on * 0.4);
        g.fillStyle = '#ffe0a0'; g.fillRect(ex - 3, ey, 6, 1); g.fillRect(ex - 2, ey + 1, 4, 1); g.fillRect(ex + 37, ey + 2, 6, 1); g.fillRect(ex + 38, ey + 3, 4, 1);
        // relámpagos secos dentro del muro (cada ~3,7 s)
        const lu = t % 3.7;
        if (lu < 0.16) { const lx = 200 + Math.round(hash1(Math.floor(t / 3.7), 3) * 360) - Math.round(cam.x * 0.04); let y = HZ - 150, x = lx; g.fillStyle = '#fff0d0'; for (let q = 0; q < 14; q++) { const nx = x + Math.round((hash1(q, Math.floor(t / 3.7)) - 0.5) * 8); g.fillRect(Math.min(x, nx), y, Math.abs(nx - x) + 1, 1); g.fillRect(nx, y, 1, 5); x = nx; y += 5; } V.drawGlow(g, lx, HZ - 120, 30, '#ffb070', 0.35); }
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
