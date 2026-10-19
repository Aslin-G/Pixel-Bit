/* =====================================================================
   19w_r2map_d_sims.js — ASPECTO DE LOS SIMULADORES (R2MAP).
   El gemelo digital se abre en una sala de control con un ventanal
   panorámico que deja ver la maquinaria real del capítulo dibujada en
   pixel art con los kits VISTA/R2PLANT (planta de captación, bastidores
   de membranas, emisario y salinas, campo FV, aerogeneradores, bastidores
   BESS, electrolizadores y tanques de H₂, bancales, plaza del consejo,
   calima sobre la ciudad), con marco de acero, reflejos del cristal,
   consola con LED y rejilla técnica tenue en el muro. KIRU flota entero
   junto a su globo. Los paneles del simulador ganan pozo interior (sombra
   interior 1 px), rejilla de 8 px muy tenue, remaches y franja de
   cabecera, sin tocar su contenido ni su geometría.
   API:
     R2MAP.simKey(sim) → id de capítulo del simulador (0–10) o null
     R2MAP.simBackdrop(key) → {c, live:{rotors, leds, glints}} (cacheado)
     R2MAP.drawSimLive(g, B, t)     rotores, LED y destellos (≤ 40 fillRect + ≤ 8 drawImage)
     R2MAP.simPanels(on)            activa la textura de paneles durante sim.draw
     R2MAP.drawGuide(g, x, y, t, who) KIRU (o el guía) entero, flotando junto al globo
   ===================================================================== */
(() => {
  const M = R2MAP, V = VISTA;
  const cache = new Map();
  M.simKey = function (sim) {
    const names = ['NexusSim', 'Sim01', 'Sim02', 'Sim03', 'Sim04', 'Sim05', 'Sim06', 'Sim07', 'Sim08', 'Sim09', 'Sim10'];
    for (let i = 0; i < names.length; i++) { let o = null; try { o = eval(names[i]); } catch (e) { o = null; } if (o && o === sim) return i; }
    return null;
  };
  const WIN_Y0 = 196, WIN_Y1 = 320, BW = 640, BH = WIN_Y1 - WIN_Y0;
  const SKY_DAY = ['#2a5ab8', '#3470c8', '#4686d4', '#5c9ade', '#78aee4', '#96c0e8', '#b4cce8'];
  const SKY_DUSK = ['#1a1a4a', '#2a2a6a', '#4a3486', '#7a4096', '#b4508e', '#e06a7a', '#f6905e', '#fcb45a'];
  const FARM = ['#4a4a7a', '#5a5a8a', '#6e6a98', '#8478a4', '#9a86aa', '#b494a8'];
  const GRASS = ['#123a30', '#1c5228', '#2e6e22', '#4c8c1e', '#76aa22', '#a4c62a', '#d0de44'];
  const SAND = ['#7a3a32', '#a85a34', '#cc7c3e', '#e49e50', '#f2be6a', '#fad88e'];
  const CONC = ['#443930', '#6e625b', '#7b7679', '#ac9b82', '#cebaac', '#f5e5c3'];
  function bandSky(pb, stops, sun, hh) {
    const R = V.P32(V.expand(stops, 16)), BH2 = hh || pb.h || BH;
    for (let y = 0; y < Math.min(pb.h, BH2); y++) for (let x = 0; x < BW; x++) {
      let t = y / (BH2 * 0.7);
      if (sun) { const d = Math.hypot((x - sun[0]) * 0.7, y - sun[1]); t += Math.max(0, 1 - d / 90) ** 2 * 0.35; }
      pb.data[y * BW + x] = R[V.band(clamp(t, 0, 0.999), 16, x, y, 0.04, 3)];
    }
    if (sun) V.sun(pb, sun[0], sun[1], sun[2] || 9, (sun[2] || 9) * 2);
  }
  const range = (pb, yBase, peaks, rp, o = {}) => V.relief(pb, Object.assign({ yBase, nv: 40, dvy: 0.5, H: V.massif(peaks, { seed: o.seed || 3, rough: 0.6, scale: 0.04 }), ramp: rp, seed: o.seed || 3, rim: o.rim || '#f4c8b0', contrast: 1.5 }, o));
  const ground = (pb, yFn, rp, o = {}) => {
    const R = V.P32(rp), n = R.length;
    for (let x = 0; x < BW; x++) { const top = Math.round(yFn(x)); for (let y = Math.max(0, top); y < pb.h; y++) { const t = clamp((o.t0 ?? 0.78) - (y - top) / (o.depth || 50) + (hash2(x >> 1, y >> 1, 3) - 0.5) * 0.16, 0, 0.999); pb.data[y * BW + x] = R[V.band(t, n, x, y, 0.05, 7)]; } if (o.rim && top >= 0 && top < BH) pb.data[top * BW + x] = U(o.rim); }
  };
  /* ---------- maquinaria por capítulo (en el búfer del ventanal, 640×124) ---------- */
  const SCENES = {
    0(pb, L) { // vista general del Nexo: ciudad de la cúpula, torre SYNARA, FV y turbinas
      bandSky(pb, SKY_DAY, [80, 22, 8]);
      range(pb, 72, [{ x: 120, v: 20, h: 30, w: 120, d: 20 }, { x: 460, v: 22, h: 36, w: 140, d: 22 }], FARM);
      ground(pb, x => 86 - Math.sin(x * 0.01) * 6, SAND, { rim: '#fff0c0' });
      V.domeCity(pb, 320, 92, { s: 0.7, k: 0.05, label: true, seed: 5 });
      V.synaraTower(pb, 480, 96, 70, {});
      V.pvArray(pb, 40, 112, { tables: 3, cols: 10, rows: 2, cw: 6, ch: 3 });
      for (const [x, h] of [[560, 50], [600, 44], [620, 38]]) { const T = V.turbineTower(pb, x, 92, h, { w: 3 }); L.rotors.push({ x: T.hx, y: T.hy, rot: V.rotor(Math.round(h * 0.4), {}), ph: x }); }
    },
    1(pb) { // captación: mar, espigón con torre de toma y pretratamiento
      bandSky(pb, SKY_DAY, [560, 20, 8]);
      range(pb, 60, [{ x: 520, v: 20, h: 26, w: 140, d: 20 }], FARM);
      V.seaFar(pb, 60, BH, { seed: 3 });
      R2PLANT.hero(pb, 430, 104, { s: 0.8, k: 0, from: 'intake', workers: true, lights: true });
    },
    2(pb) { // ósmosis inversa: la planta con sus bastidores de membranas en primer plano
      bandSky(pb, SKY_DAY, [80, 18, 8]);
      range(pb, 58, [{ x: 140, v: 20, h: 24, w: 160, d: 20 }, { x: 520, v: 22, h: 30, w: 120, d: 20 }], FARM);
      V.seaFar(pb, 58, BH, { seed: 5 });
      R2PLANT.hero(pb, 470, 110, { s: 1.0, k: 0, from: 'pretrat', workers: true, lights: true });
    },
    3(pb, L) { // salmuera: bahía al atardecer, emisario con boyas, salinas por etapas
      bandSky(pb, SKY_DUSK.slice().reverse(), [520, 40, 10]);
      range(pb, 56, [{ x: 80, v: 20, h: 40, w: 90, d: 20 }, { x: 330, v: 22, h: 30, w: 120, d: 20 }], ['#3a1a3a', '#5a2440', '#843a3e', '#b05a3e', '#d47e46', '#f0a85a'], { rim: '#ffd8a0' });
      if (V.bay) V.bay(pb, 56, BH, { glowX: 520 }); else V.seaFar(pb, 56, BH, {});
      if (V.r2baPans) V.r2baPans(pb, { x0: 0, x1: 330, y0: 52, rows: 4, seed: 4, k: 0, sky: '#f8c0a0', skew: 3 });
      V.pipe(pb, [[300, 96], [470, 96], [470, 104]], 3, ['#080e26', '#212846', '#3a405d', '#555a78', '#787a9b'], {});
      for (let k = 0; k < 6; k++) L.leds.push([360 + k * 40, 92 + (k % 2) * 6, '#ff5ad8']);
    },
    4(pb) { // fotovoltaica: campo de seguidores en las dunas, inversores y línea de alta tensión
      bandSky(pb, SKY_DUSK.slice().reverse(), [470, 34, 12]);
      range(pb, 60, [{ x: 160, v: 20, h: 22, w: 160, d: 20 }, { x: 520, v: 22, h: 18, w: 120, d: 20 }], ['#3a2a6a', '#5a3480', '#8a4a96', '#b45a8a', '#d0707a'], { rim: '#ffc890' });
      ground(pb, x => 50 + Math.sin(x * 0.02) * 4, ['#5a2630', '#94462e', '#c66e36', '#e4924a', '#f4b25e', '#fcd07c'], { rim: '#ffe6a8' });
      V.pvField(pb, { x0: 0, x1: 640, y0: 54, y1: 84, rows: 5, k: 0.1, seed: 4 });
      for (let k = 0; k < 5; k++) V.tracker(pb, 8 + k * 128, 100 + (k % 2) * 4, 104, { rows: 3, ch: 6, cw: 9, tilt: 14 });
      for (let k = 0; k < 3; k++) V.inverter(pb, 116 + k * 128, 108, { s: 0.8 });
      V.pylon(pb, 610, 74, 44, {});
    },
    5(pb, L) { // eólica: crestas verdes con cinco aerogeneradores (rotores animados)
      bandSky(pb, SKY_DAY, [90, 22, 8]);
      range(pb, 70, [{ x: 200, v: 20, h: 36, w: 160, d: 20 }, { x: 520, v: 22, h: 44, w: 140, d: 22 }], FARM);
      ground(pb, x => 92 - Math.sin(x * 0.012 + 1) * 14, GRASS, { rim: '#efd83f', depth: 40 });
      for (const [x, h] of [[70, 74], [200, 62], [330, 80], [450, 66], [575, 72]]) {
        const gy = Math.round(92 - Math.sin(x * 0.012 + 1) * 14);
        const T = V.turbineTower(pb, x, gy, h, { w: 4 }); L.rotors.push({ x: T.hx, y: T.hy, rot: V.rotor(Math.round(h * 0.42), {}), ph: x * 0.1 });
      }
      if (V.metMast) V.metMast(pb, 262, 88, 34, {});
    },
    6(pb, L) { // baterías: contenedores BESS en fila, transformador y subestación
      bandSky(pb, SKY_DUSK.slice().reverse(), [100, 30, 9]);
      range(pb, 60, [{ x: 320, v: 20, h: 26, w: 220, d: 20 }], ['#1e1a4a', '#2e2a5e', '#463a76', '#64508e', '#8a6aa4']);
      ground(pb, () => 66, CONC, { rim: '#f5e5c3', depth: 50 });
      for (let k = 0; k < 6; k++) { const R = V.bessRack(pb, 10 + k * 104, 102 - (k % 2) * 3, 88, 44, 16, { accent: k % 2 ? '#b6f05a' : '#2c63c0' }); if (R && R.leds) for (const l of R.leds.slice(0, 3)) L.leds.push([l[0], l[1], '#7cff9a']); }
      V.pylon(pb, 616, 70, 44, {});
    },
    7(pb, L) { // hidrógeno: nave de electrolizadores, tanques esmeralda, torre blanca y venteo
      bandSky(pb, SKY_DAY, [560, 18, 8]);
      range(pb, 64, [{ x: 300, v: 20, h: 26, w: 220, d: 20 }], FARM);
      ground(pb, () => 84, CONC, { rim: '#f5e5c3', depth: 40 });
      const E = V.electroHall(pb, 230, 104, 170, 40, { k: 0 });
      V.whiteTower(pb, 430, 108, 20, 96, 3, { k: 0 });
      for (let k = 0; k < 5; k++) V.h2Tank(pb, 30 + k * 40, 116, 15, 64 + (k % 2) * 10, { label: k % 2 === 0 });
      for (let k = 0; k < 3; k++) V.h2Tank(pb, 490 + k * 50, 114, 18, 56, { white: k === 1 });
      if (V.ventStack) V.ventStack(pb, 412, 104, 70, {});
      if (E && E.cells) for (const c of E.cells.slice(0, 6)) L.leds.push([c[0], c[1], '#4cd48e']);
    },
    8(pb) { // agroecología: bancales en curva, cultivos, invernadero, molino y palmeras
      bandSky(pb, SKY_DAY, [80, 18, 8]);
      range(pb, 52, [{ x: 400, v: 20, h: 26, w: 200, d: 20 }], FARM);
      ground(pb, () => 54, ['#3a2210', '#5a3618', '#7a4a22', '#9a5e2e', '#b8743a'], { depth: 70 });
      if (V.orchard) V.orchard(pb, 0, 640, 58, 74, { seed: 8, rows: 2, r0: 4, r1: 6, gap: 6 });
      if (V.cropRows) V.cropRows(pb, 0, 640, 78, BH, { seed: 8, channelEvery: 3 });
      V.greenhouse(pb, 380, 72, 110, 34, { k: 0 });
      if (V.windPump) V.windPump(pb, 540, 88, 46, {});
      for (const x of [30, 300, 610]) V.palm(pb, x, 92, 40, 4, x, {});
    },
    9(pb) { // la Mesa: plaza de Aridia con edificios cívicos y la torre SYNARA
      bandSky(pb, SKY_DUSK.slice().reverse(), [560, 34, 10]);
      range(pb, 60, [{ x: 200, v: 20, h: 30, w: 200, d: 20 }], ['#2a2a5a', '#3e3a74', '#5a4a8a', '#7a5a9a', '#a06aa0']);
      ground(pb, x => 84, ['#5a2e36', '#86503e', '#b07a50', '#d0a066', '#e8c286', '#f6dcaa'], { rim: '#fff0d0', depth: 40 });
      V.domeCity(pb, 330, 86, { s: 0.6, k: 0.02, label: true, seed: 6 });
      for (let k = 0; k < 6; k++) V.townHouse(pb, 20 + k * 36, 112 - (k % 2) * 4, 28, 26, 70 + k, { k: 0, s: 1 });
      for (let k = 0; k < 4; k++) V.townHouse(pb, 470 + k * 42, 112 - (k % 2) * 4, 32, 28, 90 + k, { k: 0, s: 1 });
      V.synaraTower(pb, 230, 98, 64, {});
    },
    10(pb) { // la Gran Calima avanza sobre la ciudad y sus sistemas
      bandSky(pb, ['#3a1408', '#6a2410', '#9a3a16', '#c8602a', '#e08a3a', '#f0b060'], [520, 40, 10]);
      const DUST = ['#2a0c06', '#4a1a0c', '#6e2a12', '#94401a', '#b85a24', '#d47a32', '#eaa04a', '#f8c46a'];
      V.blit(pb, V.cumulus(360, 110, 12, { pal: DUST, sun: 0.6, tower: true }), 280, -10);
      ground(pb, () => 86, ['#1a0804', '#2a0c04', '#3a1408', '#5a2210', '#7a3416'], { depth: 40 });
      V.domeCity(pb, 180, 90, { s: 0.6, k: 0.3, label: false, seed: 5 });
      for (const [x, h] of [[420, 50], [470, 44]]) V.turbineTower(pb, x, 90, h, { w: 3, k: 0.4 });
      V.pvArray(pb, 520, 112, { tables: 2, cols: 8, rows: 2, cw: 5, ch: 3, k: 0.3 });
      for (let i = 0; i < 160; i++) V.put(pb, (i * 53) % BW, (i * 29) % BH, U(i % 3 ? '#f0c070' : '#fff0c0'));
    },
  };
  /* ---------- r3-mapui: ventanal a toda altura (la planta se ve detrás de los paneles, atenuada) ---------- */
  const FH = WIN_Y1;           // 0…320: el ventanal ocupa toda la pantalla sobre la consola
  const WARM = ['#3a1a2e', '#5a2430', '#843a2e', '#a24a1f', '#c8662a', '#e08a3a', '#f4b05a', '#fbc371'];
  const FULL = {
    2(pb, L) { // OI: la planta protagonista de cerca sobre el mar, cordillera ocre y costa con palmeras
      bandSky(pb, ['#1a3a90', '#2a5ab8', '#3470c8', '#4686d4', '#5c9ade', '#78aee4', '#a4c4e8', '#d4dcec'], [92, 46, 11], 190);
      const cl = [[30, 22, 150, 40, 3], [250, 8, 120, 34, 7], [430, 34, 170, 46, 11], [150, 82, 90, 24, 5]];
      for (const [x, y, w, h, sd] of cl) V.blit(pb, V.cumulus(w, h, sd, {}), x, y);
      range(pb, 150, [{ x: 120, v: 20, h: 40, w: 150, d: 22 }, { x: 330, v: 22, h: 30, w: 120, d: 20 }, { x: 560, v: 20, h: 46, w: 160, d: 24 }], FARM, { seed: 9 });
      range(pb, 168, [{ x: 60, v: 20, h: 34, w: 120, d: 20 }, { x: 250, v: 22, h: 26, w: 110, d: 20 }, { x: 470, v: 20, h: 30, w: 140, d: 22 }], WARM, { seed: 4, rim: '#ffe0a0' });
      V.seaFar(pb, 170, FH, { seed: 5 });
      const I = R2PLANT.hero(pb, 636, 292, { s: 1.32, k: 0, from: 'pretrat', workers: true, lights: true });
      L.hero = I;
      // costa izquierda: roca cálida esculpida, pradera y palmeras (naturaleza en primer plano)
      if (V.seaCliff) V.seaCliff(pb, { x0: 0, x1: 160, top: (x) => 236 + Math.round(Math.sin(x * 0.05) * 5 + x * 0.12 + Math.max(0, x - 118) * 2.4), base: FH, seed: 6, ramp: V.RAMPS.cliffR2, grass: V.RAMPS.meadowR2 });
      for (const [x, h, sd] of [[28, 46, 3], [70, 38, 8], [116, 30, 5]]) V.palm(pb, x, 238 + Math.round(x * 0.12), h, x % 2 ? 3 : -3, sd, {});
      if (V.agave) V.agave(pb, 100, 262, 9, 4, {});
      if (V.flowerBush) for (const [x, y] of [[50, 252], [134, 266]]) V.flowerBush(pb, x, y, 6, x, {});
    },
  };
  function fullBackdrop(pb, key, live) {
    const win = new PixelBuffer(BW, FH);
    FULL[key](win, live);
    const GL = U('#9ad6f2'), NV = U('#06122e');
    for (let y = 0; y < FH; y++) for (let x = 0; x < BW; x++) {
      const i = y * BW + x; let u = win.data[i]; if (!(u >>> 24)) u = U('#2a5ab8');
      const diag = ((x + y * 0.8) % 200);
      if (diag < 20) u = V.mixU(u, GL, diag < 7 ? 0.12 : 0.06);
      // atenuación: más fuerte arriba (detrás de los paneles), más suave abajo, donde la planta se ve entre paneles
      u = V.mixU(u, NV, 0.34 - Math.min(1, y / FH) * 0.12);
      pb.data[i] = u;
    }
  }
  /** Sala de control con ventanal panorámico (640×360), cacheada por capítulo */
  M.simBackdrop = function (key) {
    if (cache.has(key)) return cache.get(key);
    const live = { rotors: [], leds: [], glints: [] };
    const pb = new PixelBuffer(W, H);
    const isFull = !!FULL[key];
    if (isFull) { try { fullBackdrop(pb, key, live); } catch (e) { console.warn('R3 fullBackdrop', key, e); } }
    // muro técnico: dos bandas navy con paneles, juntas y rejilla de 16 px tenue
    if (!isFull) {
    const WALL = V.P32(['#020a1c', '#041027', '#061632', '#081c3c', '#0a2246', '#0d2850', '#11305c']);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      // planchas de 80×48 con degradado propio, vetas de cepillado horizontales en clusters y juntas
      const px = x % 80, py = y % 48;
      let t = 0.58 - y / H * 0.28 + (hash2(x / 80 | 0, y / 48 | 0, 5) - 0.5) * 0.1 - py / 48 * 0.12 + px / 80 * 0.04;
      const streak = hash2((x + (hash2(0, y, 8) * 40 | 0)) >> 3, y, 6);
      if (streak < 0.18) t -= 0.08; else if (streak > 0.86) t += 0.07;
      if (px === 0 || py === 0) t -= 0.3; else if (px === 1 || py === 1) t += 0.14;
      if ((x % 16 === 8 || y % 16 === 8) && t > 0.25) t += 0.08;
      pb.data[y * W + x] = WALL[clamp(Math.round(t * 6), 0, 6)];
    }
    // haces de cables verticales y rejillas de ventilación entre planchas
    for (let k = 0; k < 9; k++) { const cx = 40 + k * 72 + (k % 2) * 9; for (let y = 0; y < WIN_Y0 - 7; y++) { pb.set(cx, y, '#0a1a34'); pb.set(cx + 1, y, ['#1e3a6a', '#2a1a4a', '#0e3a3a'][k % 3]); pb.set(cx + 2, y, '#050c1e'); if (y % 24 === 12) { pb.set(cx - 1, y, '#3a5a8a'); pb.set(cx + 3, y, '#3a5a8a'); } } }
    for (let k = 0; k < 8; k++) { const vx = 12 + k * 80, vy = 20 + (k % 3) * 48; for (let j = 0; j < 4; j++) { V.rect(pb, vx, vy + j * 3, 14, 1, U('#020818')); V.rect(pb, vx, vy + j * 3 + 1, 14, 1, U('#16305a')); } }
    // remaches de los paneles del muro
    for (let y = 6; y < H; y += 48) for (let x = 6; x < W; x += 80) { pb.set(x, y, '#2a4a7a'); pb.set(x + 68, y, '#2a4a7a'); }
    // ventanal: escena del capítulo
    const band = new PixelBuffer(BW, BH);
    try { (SCENES[key] || SCENES[0])(band, live); } catch (e) { console.warn('R2MAP.simBackdrop', key, e); bandSky(band, SKY_DAY, null); }
    // bruma de cristal: un poco de azul frío arriba y reflejos diagonales
    const GL = U('#9ad6f2');
    for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
      const i = y * BW + x; let u = band.data[i]; if (!(u >>> 24)) u = U('#2a5ab8');
      const diag = ((x + y * 0.8) % 160);
      if (diag < 18) u = V.mixU(u, GL, diag < 6 ? 0.16 : 0.08);
      u = V.mixU(u, U('#0a1a3a'), 0.12 + (1 - y / BH) * 0.1);
      pb.data[(y + WIN_Y0) * W + x] = u;
    }
    }
    // marco de acero del ventanal: travesaño superior, montantes y alféizar
    const STEEL = ['#0a1226', '#1a2a46', '#2e4468', '#4a6a94', '#86a8d0', '#cfe4ff'];
    const bar = (x, y, w, h, vert) => { for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { const k = vert ? xx / Math.max(1, w - 1) : yy / Math.max(1, h - 1); pb.set(x + xx, y + yy, STEEL[clamp(Math.round(vert ? 4.6 - k * 4 : 4.6 - k * 4.2), 0, 5)]); } };
    if (!isFull) {
      bar(0, WIN_Y0 - 6, W, 6, false);
      for (let x = 0; x <= W; x += 160) bar(Math.min(W - 5, Math.max(0, x - 2)), WIN_Y0, 5, BH, true);
      for (let x = 0; x < W; x++) { pb.set(x, WIN_Y0 - 7, '#000633'); pb.set(x, WIN_Y0 - 1, '#cfe4ff'); }
    } else {
      // ventanal a toda altura: montantes finos (detrás de los paneles casi no se ven)
      for (const x of [0, 636]) bar(Math.min(W - 4, Math.max(0, x - 2)), 0, 4, WIN_Y1, true);
    }
    // consola bajo el ventanal: tablero inclinado con pantallas, botones y LED
    const cons = [];
    const DESK = ['#06102a', '#0a1a3e', '#10264e', '#1a3664', '#2a4c82', '#5a86c0'];
    const DU = V.P32(DESK);
    for (let y = WIN_Y1; y < H; y++) for (let x = 0; x < W; x++) {
      const k = (y - WIN_Y1) / (H - WIN_Y1), front = y >= H - 12;
      let t = y === WIN_Y1 ? 5 : y === WIN_Y1 + 1 ? 4 : front ? 1.2 - (y - (H - 12)) / 12 : 3.2 - k * 2.2;
      const st = hash2((x + (hash2(1, y, 4) * 30 | 0)) >> 2, y, 13);              // vetas de cepillado en clusters
      if (st < 0.2) t -= 0.6; else if (st > 0.85) t += 0.5;
      if (front && (x % 12 === 0)) t -= 1;                                         // rejilla del frontal
      if (y === H - 12) t = 4;
      pb.data[y * W + x] = DU[clamp(Math.round(t), 0, 5)];
    }
    // botonera: filas de pulsadores de colores y deslizadores entre las pantallas
    const BTN = ['#3fe0a0', '#ffd23a', '#ff6b6b', '#22dbe7', '#8d6bff'];
    for (let x = 6; x < W - 6; x += 7) { const by = WIN_Y1 + 22 + ((x / 7 | 0) % 2) * 4; if ((x % 46) < 26) continue; V.rect(pb, x, by, 3, 2, U('#000633')); V.rect(pb, x, by, 2, 1, U(BTN[(x / 7 | 0) % 5])); }
    for (let x = 30; x < W; x += 92) { V.rect(pb, x, H - 20, 18, 1, U('#000633')); V.rect(pb, x + 4 + (x % 9), H - 22, 3, 4, U('#86a8d0')); }
    for (let x = 12; x < W - 20; x += 46) {
      const sx = x + (x % 3), sy = WIN_Y1 + 8;
      V.rect(pb, sx, sy, 22, 10, U('#000633')); V.rect(pb, sx + 1, sy + 1, 20, 8, U(['#063a4a', '#0a2a5a', '#2a1a4a'][(x / 46 | 0) % 3]));
      for (let k = 0; k < 4; k++) V.rect(pb, sx + 3 + k * 4, sy + 7 - ((x + k * 3) % 5), 2, (x + k * 3) % 5 + 1, U(['#22dbe7', '#3fe0a0', '#ffd23a', '#ff6b6b'][k]));
      cons.push([sx + 26, sy + 2, ['#3fe0a0', '#ffd23a', '#22dbe7'][(x / 46 | 0) % 3]]);
    }
    // los LED y rotores de la escena vienen en coordenadas del ventanal: pásalos a pantalla
    for (const l of live.leds) l[1] += WIN_Y0;
    for (const r of live.rotors) r.y += WIN_Y0;
    live.leds.push(...cons);
    const out = { c: pb.toCanvas(), live, key };
    cache.set(key, out);
    return out;
  };
  /** Capa viva: rotores de los aerogeneradores, LED que laten y un destello que recorre el cristal */
  M.drawSimLive = function (g, B, t) {
    if (!B || !B.live) return;
    for (const R of B.live.rotors) V.drawRotor(g, R.rot, R.x, R.y, t * 2.4 + R.ph);
    for (let i = 0; i < B.live.leds.length; i++) { const [x, y, col] = B.live.leds[i]; if (Math.sin(t * 3 + i * 1.7) > -0.2) { g.drawImage(M.glow(col, 3, 0.7), x - 3, y - 3); fpx(g, x, y, '#ffffff'); } }
    const gx = ((t * 40) % 900) - 130;
    g.globalAlpha = 0.1; g.fillStyle = '#cfe4ff';
    for (let k = 0; k < 4; k++) g.fillRect(Math.round(gx + k * 3), WIN_Y0, 2, BH);
    g.globalAlpha = 1;
  };
  /* ---------- textura de paneles durante el dibujo del simulador ---------- */
  const _tex = new Map();
  let _orig = null;
  let _icon = null;
  function panelTex(w, h, style) {
    const key = w + '|' + h + '|' + style + '|' + (_icon || '');
    let c = _tex.get(key); if (c) return c;
    c = makeCanvas(w, h); const g = c.g;
    const fx = 3, fy = 3, fw = w - 6, fh = h - 6;
    // pozo interior: sombra de 1 px arriba e izquierda y luz de 1 px abajo
    g.globalAlpha = 0.55; g.fillStyle = '#000633'; g.fillRect(fx + 2, fy, fw - 4, 1); g.fillRect(fx, fy + 2, 1, fh - 4);
    g.globalAlpha = 0.18; g.fillStyle = '#6d9be8'; g.fillRect(fx + 2, fy + fh - 1, fw - 4, 1);
    // rejilla técnica de 8 px en la banda inferior (muy tenue: no compite con el texto)
    g.globalAlpha = 0.14; g.fillStyle = '#3a64b0';
    const y0 = fy + Math.round(fh * 0.42);
    for (let x = fx + 8; x < fx + fw - 2; x += 8) g.fillRect(x, y0, 1, fy + fh - 2 - y0);
    for (let y = y0 + 6; y < fy + fh - 2; y += 8) g.fillRect(fx + 2, y, fw - 4, 1);
    // franja de cabecera con un brillo suave
    g.globalAlpha = 0.12; g.fillStyle = '#a8c8ff'; g.fillRect(fx + 3, fy + 1, fw - 6, 2);
    g.globalAlpha = 1;
    // remaches en las cuatro esquinas del pozo
    for (const [x, y] of [[fx + 3, fy + 3], [fx + fw - 5, fy + 3], [fx + 3, fy + fh - 5], [fx + fw - 5, fy + fh - 5]]) { g.fillStyle = '#000633'; g.fillRect(x, y, 2, 2); g.fillStyle = '#5a86c0'; g.fillRect(x, y, 1, 1); }
    // marca de agua del sistema (icono grande del simulador) en la esquina inferior derecha de los paneles amplios
    if (_icon && w >= 120 && h >= 64 && Icons.hasBig(_icon)) { g.globalAlpha = 0.1; g.drawImage(Icons.big(_icon), fx + fw - 30, fy + fh - 30); g.globalAlpha = 1; }
    _tex.set(key, c);
    return c;
  }
  M.simPanels = function (on, icon) {
    _icon = icon || null;
    if (on && !_orig) {
      _orig = UIK.panel;
      // r3-mapui: relleno de cristal al 84 % con bisel; gráficos, tanques y baterías iluminados
      const glass = typeof R3MAPUI !== 'undefined' ? R3MAPUI.glassPanel(_orig) : null;
      if (typeof R3MAPUI !== 'undefined') R3MAPUI.simCharts(true);
      UIK.panel = function (g, x, y, w, h, style = 'tech', accent = null, o = {}) {
        if (glass) glass(g, x, y, w, h, style, accent, o); else _orig.call(UIK, g, x, y, w, h, style, accent, o);
        if (w >= 64 && h >= 40 && !(o && o.alpha != null && o.alpha < 1)) g.drawImage(panelTex(Math.round(w), Math.round(h), style), Math.round(x), Math.round(y));
      };
    } else if (!on && _orig) { UIK.panel = _orig; _orig = null; if (typeof R3MAPUI !== 'undefined') R3MAPUI.simCharts(false); }
  };
  /** Guía entero (KIRU flotando con su estela) junto al globo de diálogo */
  M.drawGuide = function (g, x, y, t, who) {
    if (who && who !== 'kiru') return false;
    try { drawChar(g, 'kiru', 'idle', t, x, y + Math.round(Math.sin(t * 2.6) * 2), 1, { shadow: false, expr: 'esperanzado' }); } catch (e) { return false; }
    return true;
  };
})();
