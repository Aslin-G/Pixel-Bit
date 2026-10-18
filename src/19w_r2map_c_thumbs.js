/* =====================================================================
   19w_r2map_c_thumbs.js — MINIATURAS DE CAPÍTULO ilustradas (R2MAP).
   Cada tarjeta (70×41) es una mini-ilustración del bioma del capítulo con
   su objeto clave, como la tira de la referencia: se compone a 3× con los
   kits VISTA/R2PLANT (cielo en bandas, cúmulos, relieve esculpido, mar,
   planta desaladora, seguidores FV, aerogeneradores, bastidores BESS,
   tanques de H₂, bancales, salón del consejo, muro de calima, isla
   flotante) más personajes reales (drawChar) y se reduce por área con
   realce de contraste (R2MAP.down). Se cachea por id.
   API:
     R2MAP.thumb(id) → lienzo 70×41 (o null si falla: LevelThumbs recurre a su dibujo)
     R2MAP_THUMBTEST   escena de prueba (?test=scene&s=R2MAP_THUMBTEST)
   ===================================================================== */
(() => {
  const M = R2MAP, V = VISTA;
  const S = 3, TW = 70, TH = 41, SW = TW * S, SH = TH * S;
  const cache = new Map();
  const ramp = (rp, k = 0) => V.hz(rp, k);
  /* ---------- piezas comunes a 3× ---------- */
  const sky = (stops, hy, sun) => V.sky(SW, SH, { stops, horizonY: hy, sun, bands: 18 });
  const clouds = (pb, list, o = {}) => { for (const [x, y, w, h, seed] of list) { const c = V.cumulus(w, h, seed, Object.assign({ sun: -0.5 }, o)); V.blit(pb, c, x, y); } };
  const range = (pb, yBase, peaks, rp, o = {}) => V.relief(pb, Object.assign({ yBase, nv: 40, dvy: 0.5, H: V.massif(peaks, { seed: o.seed || 3, rough: 0.6, scale: 0.05 }), ramp: rp, seed: o.seed || 3, rim: o.rim || null, haze: o.haze || null, contrast: 1.6 }, o));
  const ground = (pb, yFn, rp, o = {}) => {
    const R = V.P32(rp), n = R.length;
    for (let x = 0; x < SW; x++) { const top = Math.round(yFn(x)); for (let y = Math.max(0, top); y < SH; y++) { const t = clamp((o.t0 ?? 0.75) - (y - top) / (o.depth || 40) + (hash2(x >> 1, y >> 1, 3) - 0.5) * 0.18, 0, 0.999); pb.data[y * SW + x] = R[V.band(t, n, x, y, 0.05, 7)]; } if (o.rim && top >= 0 && top < SH) pb.data[top * SW + x] = U(o.rim); }
  };
  const sea = (pb, y0, y1, o = {}) => V.seaFar(pb, y0, y1, Object.assign({ seed: 7 }, o));
  /** personajes reales a escala reducida (se dibujan sobre el lienzo 3× antes de la reducción) */
  const chars = (c, list) => {
    for (const ch of list) {
      const tmp = makeCanvas(120, 120);
      try { drawChar(tmp.g, ch.id, ch.anim || 'idle', ch.t || 0.3, 60, 112, ch.f || 1, Object.assign({ shadow: false }, ch.o || {})); } catch (e) { continue; }
      const k = ch.k || 0.5;
      c.g.imageSmoothingEnabled = true;
      c.g.drawImage(tmp, 0, 0, 120, 120, Math.round(ch.x - 60 * k), Math.round(ch.y - 112 * k), Math.round(120 * k), Math.round(120 * k));
      c.g.imageSmoothingEnabled = false;
    }
  };
  const fromCanvas = (c) => { const pb = new PixelBuffer(c.width, c.height); pb.img.data.set(c.g.getImageData(0, 0, c.width, c.height).data); return pb; };
  const SKY = ['#1468dc', '#1a78e6', '#2486ee', '#3494f4', '#48a4f6', '#64b4f4', '#88c4f2', '#a8d0f0', '#c4d4ec'];
  const SUNSET = ['#2a2a6a', '#4a3486', '#7a4096', '#b4508e', '#e06a7a', '#f6905e', '#fcb45a', '#fdd47a'];
  const FARM = ['#6a6094', '#7e72a4', '#9284ae', '#a896b4', '#c4a4ae', '#dcb0a0'];
  const ROCKW = ['#3a1434', '#5e1e2a', '#86321e', '#ac4c22', '#cc6c2c', '#e6923e', '#f6b860', '#fdd890'];
  const GRASS = ['#123a30', '#1c5228', '#2e6e22', '#4c8c1e', '#76aa22', '#a4c62a', '#d0de44'];
  const SAND = ['#7a3a32', '#a85a34', '#cc7c3e', '#e49e50', '#f2be6a', '#fad88e', '#fff0c0'];
  const ART = {
    // 0 · ORIGEN: plaza de Aridia con la ciudad de la cúpula, casas encaladas, banderines y Amaya con KIRU
    0(pb, L) {
      V.blit(pb, sky(SKY, 80, { x: 172, y: 18, r: 8, halo: 16 }), 0, 0);
      clouds(pb, [[8, 6, 70, 26, 3], [120, 12, 60, 22, 5]]);
      range(pb, 74, [{ x: 30, v: 20, h: 26, w: 50, d: 20 }, { x: 180, v: 24, h: 30, w: 60, d: 22 }], V.hz(FARM, 0.1), { rim: '#f4c8b0' });
      ground(pb, x => 78 - Math.sin(x * 0.02) * 6, SAND, { rim: '#fff0c0', depth: 60, t0: 0.7 });
      V.domeCity(pb, 112, 76, { s: 0.62, k: 0.05, label: false, seed: 5 });
      // dos filas de casas encaladas y de colores, con tejados, ventanas y buganvillas
      const PALS = ['white', 'ochre', 'rose', 'aqua', 'white', 'terra', 'sand'];
      for (let i = 0; i < 6; i++) V.townHouse(pb, -6 + i * 38, 92 - (i % 2) * 3, 26, 20, 40 + i, { k: 0.04, s: 2, pal: PALS[i % 7], flowers: 0.7 });
      for (let i = 0; i < 5; i++) if (i !== 2) V.townHouse(pb, 8 + i * 44, 108 - (i % 2) * 2, 30, 22, 60 + i, { k: 0, s: 2, pal: PALS[(i + 3) % 7], flowers: 0.8 });
      V.bunting(pb, 0, 64, SW, 70, 6, { k: 0 });
      V.palm(pb, 6, 122, 40, 4, 3, {}); V.palm(pb, 202, 122, 34, -4, 5, {});
      // plaza enlosada con juntas
      for (let x = 0; x < SW; x++) for (let y = 110; y < SH; y++) { const j = (x + (((y - 110) >> 2) & 1) * 4) % 8 === 0 || (y - 110) % 4 === 0; pb.data[y * SW + x] = U(j ? '#b8643a' : smoothBand(['#d07530', '#e49a50', '#f2bc70', '#fad8a0'], 1 - (y - 110) / 16, x, y)); }
      const FL = ['#e94a64', '#f060b8', '#ffd84a'];
      for (let k = 0; k < 14; k++) { const x = 20 + k * 13, y = 110; V.shrub(pb, x, y, 3, k + 7, {}); V.put(pb, x - 1, y - 3, U(FL[k % 3])); V.put(pb, x + 1, y - 2, U(FL[(k + 1) % 3])); }
      L.push({ id: 'amaya', anim: 'idle', x: 88, y: 122, k: 0.6 }, { id: 'kiru', anim: 'idle', x: 128, y: 108, k: 0.6 });
    },
    // 1 · CAPTACIÓN: costa con acantilado, palmeras, olas con espuma y torre de toma sobre el espigón
    1(pb, L) {
      V.blit(pb, sky(SKY, 60, { x: 180, y: 14, r: 8, halo: 16 }), 0, 0);
      clouds(pb, [[20, 4, 60, 22, 7], [130, 10, 70, 24, 9]]);
      range(pb, 58, [{ x: 150, v: 20, h: 22, w: 70, d: 20 }], V.hz(FARM, 0.15), { rim: '#f4c8b0' });
      sea(pb, 58, SH, {});
      for (let x = 0; x < 92; x++) { const top = Math.round(56 + x * 0.32 + Math.sin(x * 0.2) * 3); for (let y = top; y < SH; y++) { const t = 0.85 - (y - top) / 50 - (((x >> 2) + (y >> 3)) % 3 === 0 ? 0.12 : 0) + (x < 6 ? 0.1 : 0); pb.data[y * SW + x] = U(ROCKW[clamp(Math.round(t * 7), 0, 7)]); } for (let k = 0; k < 4; k++) pb.set(x, top - k, GRASS[clamp(3 + k - (hash2(x, k, 2) < 0.3 ? 2 : 0), 0, 6)]); }
      for (let y = 96; y < SH; y++) for (let x = 92; x < SW; x++) { if (((x + y * 2) % 17 === 0) || (y === 98 + Math.round(Math.sin(x * 0.1) * 2))) pb.set(x, y, '#e6f8fc'); }
      V.palm(pb, 22, 70, 40, 6, 3, {}); V.palm(pb, 56, 80, 32, -5, 4, {});
      // espigón y torre de toma
      for (let x = 112; x < 190; x++) { pb.set(x, 86, '#c97c38'); pb.set(x, 87, '#7e4429'); if (x % 8 === 0) pb.vline(x, 88, 96, '#4a2a2a'); }
      V.cylV(pb, 176, 86, 8, 24, ['#4f4d51', '#716f76', '#b5aba8', '#d3ccc5', '#f2efea'], { dome: 0.5, bands: [[6, 3, ['#163e66', '#245f90', '#31b4e2']], [16, 2, ['#163e66', '#245f90', '#31b4e2']]] });
      V.lighthouse(pb, 150, 62, 30, { k: 0.2 });
      L.push({ id: 'amaya', anim: 'observe', x: 40, y: 84, k: 0.46 }, { id: 'kiru', anim: 'idle', x: 72, y: 74, k: 0.46 });
    },
    // 2 · DESALINIZACIÓN: la planta SYNARA (héroe R2PLANT) sobre el agua con espuma
    2(pb) {
      V.blit(pb, sky(SKY, 54, { x: 30, y: 12, r: 7, halo: 14 }), 0, 0);
      clouds(pb, [[100, 4, 80, 24, 11], [0, 14, 60, 20, 12]]);
      range(pb, 52, [{ x: 60, v: 20, h: 22, w: 60, d: 20 }, { x: 170, v: 22, h: 26, w: 50, d: 20 }], V.hz(FARM, 0.12), { rim: '#f4c8b0' });
      sea(pb, 52, SH, {});
      R2PLANT.hero(pb, 206, 104, { s: 0.6, k: 0, from: 'pretrat', workers: true, lights: false });
      for (let x = 0; x < SW; x++) for (let k = 0; k < 3; k++) if (hash2(x >> 1, k, 9) < 0.55) pb.set(x, 108 + k * 5 + (x % 3), k ? '#9ad6f2' : '#ffffff');
    },
    // 3 · SALMUERA: cañón de sal al atardecer con salinas por etapas y pila de sal
    3(pb) {
      V.blit(pb, sky(SUNSET.slice().reverse(), 60, { x: 50, y: 30, r: 9, halo: 18 }), 0, 0);
      range(pb, 70, [{ x: 100, v: 26, h: 20, w: 60, d: 20 }], ['#4a2a5a', '#6a3a6a', '#8a4a6a', '#b0606a', '#d0806a'], { rim: '#ffc890', seed: 4 });
      // paredes del cañón: farallones cálidos con estratos y vetas de sal a ambos lados
      const CAN = ['#2a1238', '#481a40', '#6e2a40', '#96403e', '#bc5e40', '#dc8048', '#f2a85c', '#fcd08a'];
      range(pb, 96, [{ x: -10, v: 10, h: 78, w: 46, d: 16, k: 0.7 }, { x: 222, v: 10, h: 70, w: 44, d: 16, k: 0.7 }], CAN, { rim: '#ffd8a0', seed: 8, nv: 24, dvy: 0.6 });
      if (V.saltVeins) V.saltVeins(pb, { seed: 3, k: 0, col: '#fff2f8', every: 9, y0: 0, y1: 96 });
      if (V.r2baPans) V.r2baPans(pb, { x0: 0, x1: SW, y0: 76, rows: 4, seed: 4, k: 0, sky: '#f8c0a0', skew: 3 });
      V.poly(pb, [[132, 100], [158, 66], [186, 100]], U('#fff6fa')); V.poly(pb, [[158, 66], [186, 100], [162, 100]], U('#d4bcd8'));
      for (let k = 0; k < 12; k++) pb.set(140 + k * 3, 72 + k * 2, '#ffffff');
    },
    // 4 · SOLAR: atardecer con sol grande y seguidores FV en primer plano sobre dunas
    4(pb) {
      V.blit(pb, sky(SUNSET.slice().reverse(), 70, { x: 150, y: 36, r: 14, halo: 26 }), 0, 0);
      clouds(pb, [[10, 8, 60, 20, 21]], { pal: ['#7a4a8a', '#a45a8a', '#d06a80', '#f08a7a', '#f8a878', '#fcc88a', '#ffe0a0', '#fff0c0'] });
      range(pb, 72, [{ x: 40, v: 20, h: 18, w: 80, d: 20 }, { x: 190, v: 20, h: 14, w: 60, d: 20 }], ['#3a2a6a', '#5a3480', '#8a4a96', '#b45a8a', '#d0707a'], { rim: '#ffc890' });
      ground(pb, x => 80 + Math.sin(x * 0.03) * 4, ['#5a2630', '#94462e', '#c66e36', '#e4924a', '#f4b25e', '#fcd07c'], { rim: '#ffe6a8', depth: 50 });
      V.tracker(pb, 6, 118, 96, { rows: 4, ch: 7, cw: 10, tilt: 20 });
      V.tracker(pb, 100, 104, 80, { rows: 3, ch: 6, cw: 9, tilt: 16 });
      V.tracker(pb, 168, 92, 46, { rows: 3, ch: 4, cw: 6, tilt: 10, k: 0.2 });
    },
    // 5 · EÓLICA: tres aerogeneradores blancos en crestas verdes
    5(pb) {
      V.blit(pb, sky(SKY, 78, { x: 30, y: 16, r: 8, halo: 16 }), 0, 0);
      clouds(pb, [[60, 6, 80, 28, 31], [160, 20, 50, 18, 32]]);
      range(pb, 86, [{ x: 50, v: 20, h: 30, w: 70, d: 20 }, { x: 170, v: 22, h: 36, w: 60, d: 22 }], V.hz(FARM, 0.08), { rim: '#f4c8b0' });
      ground(pb, x => 96 - Math.sin(x * 0.025 + 1) * 10, GRASS, { rim: '#efd83f', depth: 40 });
      for (const [tx, h, a] of [[60, 70, 0.2], [128, 58, 1.1], [186, 44, 2.3]]) {
        const gy = Math.round(96 - Math.sin(tx * 0.025 + 1) * 10);
        const T = V.turbineTower(pb, tx, gy, h, { w: 4 });
        const rot = V.rotor(Math.round(h * 0.45), {}); const fr = Math.floor(a * 3) % rot.n;
        const src = V.strip ? null : null;
        // pala congelada: pinta el cuadro del rotor en el búfer
        const c = rot.c; const tmp = c.getContext('2d').getImageData(fr * rot.w, 0, rot.w, rot.h).data;
        for (let y = 0; y < rot.h; y++) for (let x = 0; x < rot.w; x++) { const i = (y * rot.w + x) * 4; if (tmp[i + 3] > 128) pb.set(T.hx - rot.c0 + x, T.hy - rot.c0 + y, ((255 << 24) | (tmp[i + 2] << 16) | (tmp[i + 1] << 8) | tmp[i]) >>> 0); }
      }
      V.palm(pb, 14, 122, 30, 4, 7, {});
      for (let k = 0; k < 40; k++) V.shrub(pb, (k * 37) % SW, 112 + (k * 13) % 10, 2 + (k % 3), k, {});
    },
    // 6 · BATERÍAS: bóveda excavada con bastidores BESS iluminados y tiras de luz
    6(pb) {
      V.rockFill(pb, 0, 0, SW, SH, { seed: 6, ramp: ['#120a22', '#1e1434', '#2e2048', '#422e62', '#5c447e', '#7c5e9a', '#a07ab8'], vein: '#2a8ab0', vein2: '#7cf0ff', veinK: 0.008, sc: 0.035 });
      V.carveArch && V.carveArch(pb, 105, 6, 170, 110, { k: 0.2 });
      for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) { const i = y * SW + x; if (!(pb.data[i] >>> 24)) pb.data[i] = U(smoothBand(['#0a1030', '#12204a', '#1a2e66', '#24407a'], y / SH, x, y)); }
      for (let k = 0; k < 4; k++) { const R = V.bessRack(pb, 14 + k * 48, 104 - k * 3, 38, 54 - k * 4, 10, { accent: k % 2 ? '#b6f05a' : '#2c63c0' }); if (R && R.leds) for (const [lx, ly] of R.leds) { V.ellipse(pb, lx, ly, 2.5, 2.5, (nx, ny, d, x, y) => V.mixU(V.get(pb, x, y), U('#7cff9a'), 0.35 * (1 - d))); V.put(pb, lx, ly, U('#d8ffe0')); } }
      // haz de luz cian desde el arco y tira de neón
      for (let y = 8; y < 104; y++) for (let x = 60 + Math.round(y * 0.3); x < 150 + Math.round(y * 0.3); x++) { const i = y * SW + x; if (i >= 0 && x < SW) pb.data[i] = V.mixU(pb.data[i], U('#7cf0ff'), 0.06 + 0.04 * (1 - y / 104)); }
      V.lightStrip && V.lightStrip(pb, 0, SW, 108, '#b6f05a');
      if (V.reflectFloor) V.reflectFloor(pb, 0, SW, 108, SH, { ramp: ['#0a1430', '#142450', '#1e3a6e', '#2c5290'], lights: [30, 80, 130, 180], col: '#b6f05a' });
    },
    // 7 · HIDRÓGENO: tanques esmeralda con H₂, torre blanca y nave de electrólisis
    7(pb) {
      V.blit(pb, sky(SKY, 80, { x: 190, y: 14, r: 8, halo: 16 }), 0, 0);
      clouds(pb, [[0, 8, 70, 24, 41], [90, 4, 60, 20, 42]]);
      range(pb, 84, [{ x: 100, v: 20, h: 22, w: 90, d: 20 }], V.hz(FARM, 0.12), { rim: '#f4c8b0' });
      ground(pb, () => 100, ['#443930', '#6e625b', '#7b7679', '#ac9b82', '#cebaac', '#f5e5c3'], { depth: 30, rim: '#f5e5c3' });
      V.electroHall(pb, 120, 100, 60, 26, { k: 0 });
      V.whiteTower(pb, 186, 104, 14, 70, 3, { k: 0 });
      V.h2Tank(pb, 22, 114, 14, 62, { label: true }); V.h2Tank(pb, 56, 110, 12, 52, {}); V.h2Tank(pb, 88, 116, 13, 58, { label: true });
      V.h2Tank(pb, 112, 118, 9, 38, { white: true });
    },
    // 8 · AGROECOLOGÍA: bancales con cultivos, invernadero, palmeras y Amaya con KIRU
    8(pb, L) {
      V.blit(pb, sky(SKY, 56, { x: 30, y: 12, r: 7, halo: 14 }), 0, 0);
      clouds(pb, [[100, 4, 70, 22, 51]]);
      range(pb, 52, [{ x: 160, v: 20, h: 22, w: 80, d: 20 }], V.hz(FARM, 0.12), { rim: '#f4c8b0' });
      ground(pb, () => 52, ['#3a2210', '#5a3618', '#7a4a22', '#9a5e2e', '#b8743a'], { depth: 70 });
      if (V.orchard) V.orchard(pb, 0, 130, 56, 70, { seed: 8, rows: 2, r0: 4, r1: 6, gap: 4 });
      if (V.cropRows) V.cropRows(pb, 0, SW, 72, SH, { seed: 8, channelEvery: 3, crop: ['#1c3a1c', '#2e5426', '#3f7e2e', '#5aa034', '#7ac83c', '#a8e04a', '#d8f06a', '#f0f8a0'] });
      V.greenhouse(pb, 130, 64, 70, 28, { k: 0 });
      V.palm(pb, 10, 84, 34, 3, 9, {}); V.palm(pb, 202, 78, 28, -3, 10, {});
      const FL = ['#e94a64', '#f47a90', '#ffd84a', '#ff7a3a', '#f060b8'];
      for (let k = 0; k < 70; k++) { const x = (k * 47) % SW, y = 112 + (k * 7) % 10; V.shrub(pb, x, y, 3 + (k % 2), k + 3, {}); V.put(pb, x - 1 + (k % 3), y - 4, U(FL[k % 5])); V.put(pb, x + 1, y - 3, U(FL[(k + 2) % 5])); }
      L.push({ id: 'amaya', anim: 'idle', x: 92, y: 118, k: 0.56 }, { id: 'kiru', anim: 'idle', x: 128, y: 104, k: 0.56 });
    },
    // 9 · LA MESA: salón del consejo azul real con friso de teselas, columnas doradas y pantalla de datos
    9(pb) {
      V.royalWall(pb, 0, 0, SW, SH, { seed: 9 });
      V.mosaicBand && V.mosaicBand(pb, 0, SW, 8, 10, {});
      for (const x of [12, 186]) V.goldColumn(pb, x, 18, 104, 12, {});
      V.rect(pb, 40, 22, 130, 64, U('#000633')); V.rect(pb, 43, 25, 124, 58, U('#06183a'));
      const BAR = ['#22c1e7', '#ffd23a', '#4ccb70', '#ff6b6b', '#b49cff'];
      for (let k = 0; k < 5; k++) { const h = 14 + k * 7; V.rect(pb, 52 + k * 22, 78 - h, 14, h, U(BAR[k])); V.rect(pb, 52 + k * 22, 78 - h, 14, 2, U(mixHex(BAR[k], '#ffffff', 0.5))); }
      V.rect(pb, 46, 78, 118, 2, U('#8fb4ff'));
      for (let y = 100; y < SH; y++) for (let x = 0; x < SW; x++) pb.data[y * SW + x] = U(smoothBand(['#3a1a14', '#5a2e1e', '#8e542f', '#b87a4a'], 1 - (y - 100) / 30, x, y));
      if (V.bench3q) for (let k = 0; k < 3; k++) V.bench3q(pb, 20 + k * 64, 110 + (k % 2) * 4, 50, {});
      const COL = ['#de3f22', '#20c0ae', '#ffd23a', '#8d6bff', '#4ccb70'];
      for (let i = 0; i < 12; i++) { const px = 10 + i * 17, py = 118 + (i % 2) * 3; V.ellipse(pb, px, py - 12, 4, 4, U('#e0a07a')); V.ellipse(pb, px, py - 15, 4, 2.5, U(['#3a1a10', '#1a0a06', '#6a3a1a'][i % 3])); V.rect(pb, px - 5, py - 8, 10, 10, U(COL[i % 5])); V.rect(pb, px + 2, py - 8, 3, 10, U(shade(COL[i % 5], -0.3))); }
    },
    // 10 · GRAN CALIMA: muro de polvo ocre con ojos que brillan y siluetas en primer plano
    10(pb, L) {
      V.blit(pb, sky(['#3a1408', '#6a2410', '#9a3a16', '#c8602a', '#e08a3a', '#f0b060'], 80, { x: 160, y: 30, r: 10, halo: 20 }), 0, 0);
      // la Gran Calima: un muro de polvo que se alza como una criatura con ojos y boca de brasa
      const DUST = ['#2a0c06', '#4a1a0c', '#6e2a12', '#94401a', '#b85a24', '#d47a32', '#eaa04a', '#f8c46a'];
      V.blit(pb, V.cumulus(190, 100, 12, { pal: DUST, sun: 0.6, tower: true }), 14, 6);
      V.blit(pb, V.cumulus(120, 60, 13, { pal: DUST, sun: 0.6 }), -20, 46); V.blit(pb, V.cumulus(120, 60, 14, { pal: DUST, sun: 0.6 }), 120, 50);
      for (const [ex, ey] of [[88, 46], [124, 46]]) { V.ellipse(pb, ex, ey, 9, 5, (nx, ny, d) => U(d > 0.6 ? '#ff8a2a' : d > 0.25 ? '#ffd23a' : '#fff6c0')); V.rect(pb, ex - 9, ey - 6, 18, 2, U('#2a0c06')); }
      V.poly(pb, [[84, 66], [128, 66], [120, 78], [92, 78]], U('#2a0c06'));
      for (let k = 0; k < 6; k++) V.poly(pb, [[86 + k * 7, 66], [90 + k * 7, 72], [94 + k * 7, 66]], U('#ff8a2a'));
      ground(pb, x => 104 + Math.sin(x * 0.05) * 3, ['#1a0804', '#2a0c04', '#3a1408', '#5a2210'], { depth: 40 });
      V.palm(pb, 18, 110, 34, 4, 11, { k: 0.85 }); V.palm(pb, 196, 112, 28, -4, 12, { k: 0.85 });
      for (let i = 0; i < 80; i++) pb.set((i * 53) % SW, (i * 29) % 100, i % 3 ? '#f0c070' : '#fff0c0');
      L.push({ id: 'amaya', anim: 'idle', x: 66, y: 112, k: 0.44, o: { tint: '#2a0c04' } }, { id: 'kiru', anim: 'idle', x: 150, y: 100, k: 0.44 });
    },
    // 11 · NEXO FINAL: isla flotante con la ciudad de la cúpula y cascada
    11(pb) {
      V.blit(pb, sky(SKY, 123, { x: 180, y: 14, r: 8, halo: 16 }), 0, 0);
      clouds(pb, [[0, 60, 80, 30, 61], [140, 70, 70, 28, 62], [40, 96, 120, 30, 63], [150, 4, 60, 20, 64]]);
      // isla: tapa de pradera y roca colgante en cono
      for (let y = 66; y < 112; y++) { const k = (y - 66) / 46, hw = Math.round(64 * Math.pow(1 - k, 0.9) + (vnoise(y * 0.3, 1, 2) - 0.5) * 6); for (let x = 105 - hw; x <= 105 + hw; x++) { const u = (x - (105 - hw)) / Math.max(1, 2 * hw); pb.set(x, y, ROCKW[clamp(Math.round((0.85 - u * 0.6 - k * 0.4 + (((x >> 2) + y) % 5 === 0 ? -0.1 : 0)) * 7), 0, 7)]); } }
      V.ellipse(pb, 105, 66, 66, 9, (nx, ny, d, x, y) => U(GRASS[clamp(Math.round((0.7 - nx * 0.25 - ny * 0.3 + (hash2(x >> 1, y >> 1, 4) - 0.5) * 0.3) * 6), 0, 6)]));
      V.domeCity(pb, 105, 66, { s: 0.55, k: 0, label: false, seed: 7 });
      V.fall(pb, 128, 72, 123, 5, {}); V.fall(pb, 80, 74, 116, 3, {});
      V.palm(pb, 54, 68, 18, -3, 13, {}); V.palm(pb, 158, 68, 16, 3, 14, {});
    },
  };
  M.thumb = function (id) {
    if (cache.has(id)) return cache.get(id);
    const fn = ART[id]; if (!fn) return null;
    let out = null;
    try {
      const pb = new PixelBuffer(SW, SH), L = [];
      fn(pb, L);
      let src = pb;
      if (L.length) { const c = pb.toCanvas(); chars(c, L); src = fromCanvas(c); }
      out = M.down(src, S, { sharp: 0.55, sat: 0.14, cut: 0.2 }).toCanvas();
    } catch (e) { console.warn('R2MAP.thumb', id, e); out = null; }
    cache.set(id, out);
    return out;
  };
})();
/** Escena de prueba: las 12 miniaturas y la tira de tarjetas */
const R2MAP_THUMBTEST = {
  enter() { this.t = 0; },
  update(dt) { this.t += dt; },
  render(g) {
    frect(g, 0, 0, W, H, '#041533');
    for (let i = 0; i < 12; i++) { const c = R2MAP.thumb(i); const x = 8 + (i % 6) * 104, y = 8 + Math.floor(i / 6) * 60; if (c) g.drawImage(c, x, y); drawText(g, String(i), x, y + 44, { font: 'tiny', color: '#ffffff' }); }
    for (let i = 0; i < 8; i++) UIK.levelCard(g, 6 + i * 79, 140, 74, 57, { id: i, label: LEVEL_CARD_NAME[i], state: i < 2 ? 'done' : i === 2 ? 'current' : 'open', selected: i === 2 });
    for (let i = 0; i < 4; i++) UIK.levelCard(g, 6 + i * 79, 210, 74, 57, { id: i + 8, label: LEVEL_CARD_NAME[i + 8], state: 'open' });
  },
};
