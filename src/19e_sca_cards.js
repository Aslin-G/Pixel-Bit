/* =====================================================================
   19e_sca_cards.js — Tarjeta de capítulo, fondo de «nivel completado»
   y fondo nocturno de los créditos (escenas A).
   API:
     SCACards.chapterCard(g, id, title, sub, a, t)   tarjeta navy con bisel:
         miniatura del capítulo enmarcada (LevelThumbs), CAPÍTULO + RA en
         oro, título en negrita, lugar del mapa e icono de herramienta;
         barrido de luz y destellos de esquina. a = opacidad/entrada 0..1
     SCACards.completeBackdrop(g, t)   velo navy + haces dorados lentos
     SCACards.captureBanner(sc)        → lienzo con la franja del panorama
         del nivel (cielo + planos lejanos con la cámara actual)
     SCACards.drawBanner(g, c, x, y, w, h)  franja enmarcada con degradado
     SCACredits.build() / SCACredits.render(g, t)   Aridia de noche: cielo
         estrellado con vía láctea y luna, mar con estela de luna, ciudad
         de la cúpula iluminada con cascadas, torre de SYNARA con baliza,
         planta con luces, Amaya y KIRU sentados en el acantilado.
   ===================================================================== */
const SCACards = (() => {
  const V = VISTA;
  function chapterCard(g, id, title, sub, a, t) {
    if (a <= 0.01) return;
    const M = (typeof LEVEL_META !== 'undefined' && LEVEL_META[id]) || null;
    const place = (typeof MAP_NODES !== 'undefined' && MAP_NODES[id]) ? MAP_NODES[id].name : '';
    const tw = FONTS.bold.measure(title || '') * 2;
    const w = Math.max(300, tw + 118), h = 58, x = Math.round(W / 2 - w / 2), y = Math.round(54 - (1 - a) * 40);
    g.globalAlpha = clamp(a, 0, 1);
    UIK.panel(g, x, y, w, h, 'tech');
    // miniatura del capítulo en un marco con tinta
    const fx = x + 6, fy = y + 6, thumb = LevelThumbs.get(id, true);
    UIK.frame(g, fx, fy, 78, 46, 'hud', { bg: '#0a2450' });
    if (thumb) g.drawImage(thumb, 0, 0, Math.min(70, thumb.width), Math.min(38, thumb.height), fx + 4, fy + 4, Math.min(70, thumb.width), Math.min(38, thumb.height));
    // barrido de luz por la miniatura
    const sw = ((t * 60) % 160) - 40;
    if (sw > 0 && sw < 70) { g.globalAlpha = 0.45 * a; frect(g, fx + 4 + sw, fy + 4, 2, 38, '#ffffff'); frect(g, fx + 3 + sw, fy + 4, 1, 38, '#bff8ff'); g.globalAlpha = clamp(a, 0, 1); }
    // textos
    const tx = x + 92;
    drawText(g, (sub || '') + (M ? '  ·  ' + M.ra : ''), tx, y + 9, { font: 'tiny', color: '#f5dc5a' });
    drawTitleText(g, title || '', tx, y + 18, 2, ['#ffffff', '#e6f8fe', '#a8c8ff'], { font: 'bold', shadow: '#000633', depth: 1, outline: '#000633' });
    frect(g, tx, y + 40, w - 104, 1, '#3a64b0'); frect(g, tx, y + 41, w - 104, 1, '#12305a');
    if (M && TOOLS[M.tool]) { Icons.draw(g, TOOLS[M.tool].icon, tx - 2, y + 42); drawText(g, place + (place ? '  ·  ' : '') + TOOLS[M.tool].name, tx + 14, y + 46, { font: 'tiny', color: '#a8c8ff' }); }
    else if (place) drawText(g, place, tx, y + 46, { font: 'tiny', color: '#a8c8ff' });
    // destellos de esquina que laten
    const k = 0.5 + 0.5 * Math.sin(t * 4);
    g.globalAlpha = clamp(a, 0, 1) * k;
    fpx(g, x + w - 8, y + 3, '#ffffff'); fpx(g, x + w - 9, y + 3, '#7fb8ff'); fpx(g, x + w - 7, y + 3, '#7fb8ff'); fpx(g, x + w - 8, y + 2, '#7fb8ff'); fpx(g, x + w - 8, y + 4, '#7fb8ff');
    fpx(g, x + 3, y + h - 4, '#e8f6ff');
    g.globalAlpha = 1;
  }
  /* ---- fondo de nivel completado ---- */
  let RAYS = null;
  function raysCanvas() {
    if (RAYS) return RAYS;
    const s = 760, pb = new PixelBuffer(s, s), c = s / 2, col = U('#ffd88a') & 0xffffff;
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const dx = x - c, dy = y - c, d = Math.hypot(dx, dy); if (d < 30 || d > c) continue;
      const a = Math.atan2(dy, dx), wv = Math.abs(((a / TAU * 14) % 1 + 1) % 1 - 0.5);
      const j = (hash2(x >> 2, y >> 2, 5) - 0.5) * 0.04;
      if (wv + j > 0.2) continue;
      const fade = 1 - d / c, al = (wv < 0.1 ? 0.16 : 0.08) * fade;
      pb.data[y * s + x] = ((Math.round(al * 255) << 24) | col) >>> 0;
    }
    RAYS = pb.toCanvas(); return RAYS;
  }
  function completeBackdrop(g, t) {
    // velo navy más denso en los bordes (dos bandas sin tramado) y haces dorados lentos detrás del panel
    g.globalAlpha = 0.62; frect(g, 0, 0, W, H, '#020a1e');
    g.globalAlpha = 0.25; frect(g, 0, 0, W, 26, '#020a1e'); frect(g, 0, H - 26, W, 26, '#020a1e'); frect(g, 0, 0, 40, H, '#020a1e'); frect(g, W - 40, 0, 40, H, '#020a1e');
    g.globalAlpha = 1;
    const R = raysCanvas();
    g.save(); g.globalCompositeOperation = 'lighter'; g.translate(W / 2, H / 2 - 20); g.rotate(t * 0.05); g.drawImage(R, -R.width / 2, -R.height / 2); g.restore();
  }
  /** Franja del panorama del nivel (cielo + planos de fondo con la cámara actual) */
  function captureBanner(sc) {
    try {
      const B = sc && sc.backdrop; if (!B) return null;
      const c = makeCanvas(W, H), b = c.getContext('2d'); b.imageSmoothingEnabled = false;
      const cam = { x: sc.cam ? sc.cam.ox : 0, y: sc.cam ? sc.cam.oy : V.CAMY };
      if (B.sky) b.drawImage(B.sky, 0, Math.round(-cam.y * 0.05));
      B.render(b, cam, 'back');
      const hz = clamp(B.horizon || 150, 80, 220);
      return { c, y0: hz - 44 };
    } catch (e) { return null; }
  }
  function drawBanner(g, Bn, x, y, w, h, t) {
    if (!Bn) return;
    const sx = clamp(Math.round(W / 2 - w / 2 + Math.sin(t * 0.15) * 20), 0, W - w), sy = clamp(Bn.y0, 0, H - h);
    frect(g, x - 1, y - 1, w + 2, h + 2, '#000633');
    g.drawImage(Bn.c, sx, sy, w, h, x, y, w, h);
    // degradado navy en bandas para que el título se lea
    g.fillStyle = '#041533';
    for (let i = 0; i < 4; i++) { g.globalAlpha = 0.12 + i * 0.1; g.fillRect(x, y + Math.round(h * 0.25) + i * 3, w, h - Math.round(h * 0.25) - i * 3 - (3 - i) * 3); }
    g.globalAlpha = 1;
    frect(g, x, y, w, 1, '#6d9be8'); frect(g, x, y + h - 1, w, 1, '#3a64b0');
  }
  return { chapterCard, completeBackdrop, captureBanner, drawBanner };
})();

const SCACredits = (() => {
  const V = VISTA;
  let A = null;
  /** Tinte nocturno sobre los píxeles opacos de un plano */
  function night(pb, col, k) { const N = U(col); for (let i = 0; i < pb.data.length; i++) { const c = pb.data[i]; if (c >>> 24) pb.data[i] = (V.mixU(c, N, k) & 0xffffff | (c & 0xff000000)) >>> 0; } }
  function build() {
    if (A) return A;
    const t0 = nowMs();
    const B = new Backdrop(W, H), HZ = 214;
    // cielo nocturno: degradado navy → violeta, estrellas, vía láctea y luna con halo
    const sky = new PixelBuffer(W, H);
    const R = V.P32(V.expand(['#040820', '#071034', '#0c1a4a', '#16245a', '#26306a', '#3a3a74', '#5a4a7e', '#7a5a84'], 18));
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) sky.data[y * W + x] = R[V.band(Math.pow(clamp(y / HZ, 0, 1), 1.4) * 0.999, R.length, x, y, 0.04, 3)];
    for (let y = 0; y < HZ - 20; y++) for (let x = 0; x < W; x++) {
      const d = Math.abs((y - 30) - (x - 120) * 0.32) / 34, n = vnoise(x * 0.04, y * 0.06, 7);
      if (d < 1 && n > 0.45) { const i = y * W + x; sky.data[i] = V.mixU(sky.data[i], U(n > 0.7 ? '#a8a0d8' : '#6a6aa8'), (1 - d) * (n - 0.45) * 0.9); }
    }
    V.stars(sky, { n: 160, y1: HZ - 30, seed: 11 });
    V.sunDisc(sky, 470, 52, 9, 26, { disc: '#f4f0e0', core: '#ffffff', edge: '#d8d4c8', rings: [[1.5, '#c8c8e0', 0.6], [4, '#8a90c8', 0.4], [8, '#5a64a8', 0.26], [0, '#3a4888', 0.14]] });
    B.sky = sky.toCanvas();
    B.cloudDeck({ kind: 'cirrus', n: 4, seed: 91, f: [0.01, 0.03], y: [20, 90], w: [90, 170], speed: [1, 2], pal: ['#232a58', '#2a3060', '#3a4074', '#5a5a8a'] });
    // mar nocturno con estela de luna
    const mt = [];
    B.vplane(0, HZ, H - HZ, (pb, w, h) => {
      const S = V.P32(V.expand(['#0a1640', '#0c1c4c', '#0e2458', '#123064', '#163a70'], 10));
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let u = S[V.band(clamp(y / h + (vnoise(x * 0.03, y * 0.1, 5) - 0.5) * 0.2, 0, 0.999), S.length, x, y, 0.05, 7)];
        if (((y + Math.round(Math.sin(x * 0.07 + y) * 2)) % (5 + (y >> 4))) === 0 && hash2(x >> 2, y, 9) < 0.4) u = U('#2a4a88');
        pb.data[y * w + x] = u;
      }
    }, { dyn: (g) => { const t = Game.time; g.fillStyle = '#e8ecff'; for (let i = 0; i < 40; i++) { const y = HZ + 2 + Math.round(hash1(i, 3) * 90), hw = 2 + (y - HZ) * 0.18; const x = Math.round(470 + (hash1(i, 5) - 0.5) * hw * 2 + Math.sin(t * 1.5 + i) * 2); if ((Math.floor(t * 4) + i) % 3 === 0) continue; g.globalAlpha = 0.5 + 0.4 * Math.sin(t * 2 + i); g.fillRect(x, y, 2 + (i % 3), 1); } g.globalAlpha = 1; } });
    // cordillera en contraluz con aerogeneradores y luces rojas de balizamiento
    const beacons = [];
    B.vplane(0, HZ - 60, 61, (pb, w, h) => {
      const info = V.relief(pb, {
        yBase: h - 1, nv: 40, dvy: 0.3, seed: 31, hMax: 60,
        H: V.massif([{ x: 80, v: 20, h: 40, w: 140, d: 26 }, { x: 230, v: 24, h: 52, w: 140, d: 28 }, { x: 330, v: 16, h: 34, w: 100, d: 20 }, { x: 600, v: 18, h: 44, w: 120, d: 24 }], { seed: 31, rough: 0.5, scale: 0.05, apron: 5 }),
        ramp: ['#0a0c28', '#10143a', '#161c48', '#1e2656', '#283264', '#343e72', '#424c80'], contrast: 1.6, t0: 0.4, haze: { col: '#2a3266', k0: 0, k: 0.2 }, rim: '#6a70b8', tex: 0.04,
      });
      for (const x of [150, 214, 270, 590]) { const y = info.top[x] + 1; V.turbineTower(pb, x, y, 24, { k: 0.6, w: 2 }); beacons.push([x, y - 24 + HZ - 60]); }
    }, { dyn: (g) => { const t = Game.time; for (const [x, y] of beacons) if (Math.floor(t * 1.2 + x) % 2) { g.fillStyle = '#ff3a3a'; g.fillRect(x, y, 1, 1); V.drawGlow(g, x, y, 3, '#ff3a3a', 0.4); } } });
    // ciudad de ARIDIA de noche: cúpula iluminada, ventanas cálidas y cascadas que reflejan la luna
    const lights = [], falls = [], domeGl = [];
    B.vplane(0, 60, 160, (pb, w, h) => {
      const CX = 520;
      const info = V.relief(pb, {
        yBase: h - 1, nv: 40, dvy: 0.3, seed: 41, hMax: 100, x0: 380,
        H: V.massif([{ x: CX, v: 20, h: 82, w: 170, d: 30, k: 0.85 }, { x: CX + 100, v: 14, h: 50, w: 100, d: 20 }, { x: 420, v: 10, h: 30, w: 80, d: 18 }], { seed: 41, rough: 0.5, scale: 0.045, apron: 6, plateaus: [{ x: CX, w: 80, h: 72 }] }),
        ramp: ['#120c26', '#1a1234', '#241a42', '#30224e', '#3e2c5a', '#4e3866', '#604672'], contrast: 1.8, t0: 0.45, haze: { col: '#2a2a5a', k0: 0, k: 0.1 }, rim: '#8a7ab8', tex: 0.05,
      });
      const dc = V.domeCity(pb, CX, info.top[CX] + 8, { k: 0.5, s: 0.8 });
      domeGl.push([CX, dc.top + 14 + 60]);
      for (const F of dc.falls) { V.fall(pb, F.x, dc.base, h - 6, F.w, { k: 0.55 }); falls.push({ x: F.x, y0: dc.base + 60, y1: h - 6 + 60, w: F.w }); }
      night(pb, '#141640', 0.5);
      const r = RNG(43);
      for (let i = 0; i < 90; i++) { const x = r.int(400, 640), y = info.onSurf(x, r.int(2, 16)); if (y != null && y > 40) lights.push([x, y + 60 - r.int(1, 4)]); }
    }, { dyn: (g) => { const t = Game.time; g.fillStyle = '#ffd070'; for (let i = 0; i < lights.length; i++) if ((i + Math.floor(t * 0.3)) % 9) g.fillRect(lights[i][0], lights[i][1], 1, 1); for (const [x, y] of domeGl) V.drawGlow(g, x, y, 22, '#56e5ff', 0.22 + 0.06 * Math.sin(t)); V.drawFalls(g, falls, 0, 0, t, { speed: 30, alpha: 0.35 }); } });
    // costa con la planta SYNARA iluminada
    let plant = null;
    const PY = 196;
    B.vplane(0, PY, 80, (pb) => { plant = SCAKit.heroPlant(pb, 214, 52, { k: 0, wp: 200 }); night(pb, '#0e1238', 0.62); }, {
      dyn: (g) => { const t = Game.time; for (const P of [plant.perm, plant.perm2]) V.drawFlow(g, P.map(([x, y]) => [x, y + PY]), 0, 0, t, { col: '#9ff6f8', speed: 14, gap: 6 }); for (const [x, y, r] of plant.glows) V.drawGlow(g, x, y + PY, r + 2, '#48b6ec', 0.5); for (const [x, y, c] of plant.leds) if (Math.floor(t * 1.6 + x) % 2) { g.fillStyle = c; g.fillRect(x, y + PY, 1, 1); } },
    });
    // acantilado en primer plano a la izquierda con Amaya y KIRU sentados
    const gy = (x) => x < 190 ? 286 + Math.sin(x * 0.05) * 2 + (x > 150 ? (x - 150) * 0.3 : 0) : null;
    const CL = SCAKit.pfCliff(W, H, gy, { surf: 'grass', depth: 12 });
    // tinte nocturno sobre el acantilado (más oscuro y frío)
    const tint = (c) => { const b = c.getContext('2d'); b.globalCompositeOperation = 'source-atop'; b.globalAlpha = 0.62; b.fillStyle = '#0a1240'; b.fillRect(0, 0, c.width, c.height); b.globalAlpha = 0.18; b.fillStyle = '#6a70c8'; b.fillRect(0, 0, c.width, 300); return c; };
    tint(CL.face); tint(CL.top);
    A = { B, CL, ms: 0, HZ };
    A.ms = Math.round(nowMs() - t0);
    return A;
  }
  function render(g, t) {
    const A = build(), B = A.B;
    g.drawImage(B.sky, 0, 0);
    B.render(g, { x: 0, y: V.CAMY }, 'back');
    g.drawImage(A.CL.top, 0, 0); g.drawImage(A.CL.face, 0, 0);
    drawChar(g, 'amaya', 'sit', t, 112, 287, 1, { shadow: false });
    drawChar(g, 'kiru', 'idle', t, 74, 270, 1, { shadow: false, expr: 'esperanzado' });
    // luciérnagas sobre el acantilado
    for (let i = 0; i < 16; i++) { const x = Math.round(40 + hash1(i, 7) * 200 + Math.sin(t * 0.6 + i) * 8), y = Math.round(220 + hash1(i, 9) * 90 + Math.cos(t * 0.8 + i) * 6); if ((Math.floor(t * 2) + i) % 4 === 0) continue; V.drawGlow(g, x, y, 2, '#d8ff70', 0.5); }
  }
  return { build, render };
})();
