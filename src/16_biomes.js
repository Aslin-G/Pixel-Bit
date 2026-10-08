/* =====================================================================
   16_biomes.js — Biomas adicionales: plaza de Aridia (festival).
   Cada bioma: 5–8 capas parallax con detalle propio y piezas animadas.
   ===================================================================== */

RAMP.skyFest = ['#1c3a94', '#2656bc', '#3576d6', '#4f98ea', '#76bcf2', '#a6dcf2', '#e4ecd8', '#ffd8a4', '#ffb884'];

BIOMES.plaza = function (L) {
  const B = new Backdrop(L.width, L.height);
  const horizon = 196;
  B.horizon = horizon;
  B.sky = makeSkyCanvas(RAMP.skyFest, horizon, { sun: { x: 540, y: 96, r: 12, halo: '#fff0c8' }, curve: 1.1 });
  B.addClouds(8, ['#c89ab8', '#f0c8c8', '#fff0e0', '#ffffff'], 77, 16, 110);
  // 1. mesetas lejanas y franja de mar turquesa
  B.layer(0.05, 110, horizon - 92, (pb, w) => {
    const hz = ART.hazeRamp(RAMP.mesa, '#c8d8f0', 0.55);
    ART.ridge(pb, (x) => 70 - Math.max(0, Math.sin(x * 0.006 + 1) * 34) - fbm1(x * 0.02, 3, 4) * 12, hz, { mesa: true, baseIdx: 4, strata: 6 });
    for (let x = 0; x < pb.w; x++) { if (x < 180) { pb.vline(x, 86, 92, '#7cd0e0'); pb.set(x, 86, '#c6fff2'); } }
  }, { dyn: (g, cam, Ly) => {
    const ox = cam.x * 0.05;
    for (let i = 0; i < 6; i++) { const tx = 260 + i * 46 - ox; if (tx < -20 || tx > W + 20) continue; ART.turbine(g, tx, Ly.y - cam.y * Ly.fy + 70 - (i % 3) * 3, 22, Game.time * (L.windSpin ? L.windSpin() : 1.3) + i * 0.7, { col: '#f0f4fa', shade: '#c0cce0' }); }
  } });
  // 2. ciudad lejana: cúpulas, torres de viento y antenas (bruma cálida)
  B.layer(0.14, 90, horizon - 62, (pb, w) => {
    const r = RNG(31);
    for (let x = -10; x < w; x += r.int(18, 34)) {
      const hw = r.int(16, 30), hh = r.int(18, 44);
      ART.house(pb, x, 88, hw, hh, x * 3 + 1, { pal: HOUSE_COLS[r.int(0, 6)].map(c => mixHex(c, '#f0d8c8', 0.55)), roof: r.pick(['dome', 'tower', 'flat', 'arch']) });
    }
    pb.rect(0, 86, w, 4, mixHex('#d9c3a0', '#f0d8c8', 0.5));
  });
  // 3. ciudad media con banderines, palmas y cometas
  B.layer(0.3, 120, horizon - 70, (pb, w) => {
    const r = RNG(57);
    let x = -6;
    const tops = [];
    while (x < w) {
      const hw = r.int(26, 46), hh = r.int(30, 62);
      if (r.chance(0.18)) { ART.palm(pb, x + 10, 116, r.int(34, 48), r.range(-5, 5), x, ART.hazeRamp(RAMP.leaf, '#f0d8c8', 0.25)); x += 22; continue; }
      ART.house(pb, x, 116, hw, hh, x * 7 + 3, { pal: HOUSE_COLS[r.int(0, 6)].map(c => mixHex(c, '#f0d8c8', 0.22)), awning: r.chance(0.5) });
      tops.push([x + hw / 2, 116 - hh]);
      x += hw + r.int(2, 10);
    }
    for (let i = 0; i < tops.length - 1; i++) if (r.chance(0.7)) ART.bunting(pb, tops[i][0], tops[i][1] + 2, tops[i + 1][0], tops[i + 1][1] + 2, 8, ['#ff6b6b', '#ffe14d', '#20d6c7', '#8d6bff', '#ff9f43'], i);
    pb.rect(0, 116, w, 4, '#d9c3a0'); pb.hline(0, w - 1, 116, '#f2e2c4');
  }, { dyn: (g, cam, Ly) => {
    const t = Game.time;
    // cometas del Capitán Nimbo sobre la ciudad
    for (let i = 0; i < 3; i++) {
      const kx = 120 + i * 210 - (cam.x * 0.3) % 640 + Math.sin(t * 0.7 + i) * 10, ky = 40 + i * 14 + Math.sin(t * 1.1 + i * 2) * 6;
      const cx = ((kx % 700) + 700) % 700 - 30;
      const col = ['#ff6b6b', '#ffe14d', '#8d6bff'][i];
      for (let k = 0; k < 5; k++) { frect(g, cx - k, ky + k, 1 + k * 2, 1, col); frect(g, cx - (4 - k), ky + 5 + k, 1 + (4 - k) * 2, 1, shade(col, -0.2)); }
      for (let k = 0; k < 14; k++) fpx(g, cx + Math.sin(k * 0.6 + t * 3) * 2, ky + 10 + k * 2, k % 3 ? '#fffaf0' : col);
    }
  } });
  // 4. muros con mural y jardineras (cercano, más saturado)
  B.layer(0.55, 70, H - 70 - 66, (pb, w) => {
    const r = RNG(91);
    for (let x = 0; x < w; x += r.int(150, 260)) {
      const mw = r.int(60, 110);
      ART.mural(pb, x, 66, mw, r.int(26, 38), x);
      for (let k = 0; k < mw; k += 12) ART.shrub(pb, x + k + 4, 66, r.int(3, 5), x + k, RAMP.moss);
      if (r.chance(0.6)) ART.tree(pb, x + mw + 18, 66, r.int(34, 46), x, RAMP.leaf);
    }
  }, { fy: 0.25 });
  return B;
};

/* ---------- Planta de ósmosis inversa (interior luminoso) ---------- */
BIOMES.plant = function (L) {
  const B = new Backdrop(L.width, L.height);
  B.horizon = 150;
  B.sky = makeSkyCanvas(RAMP.skyDay, 150, { sun: { x: 120, y: 40, r: 10, halo: '#fff3d4' }, curve: 1.2 });
  B.addClouds(5, CLOUD_PALS.day, 12, 10, 70, 0.04, 0.1);
  // 1. vista exterior: mar y costa a través de los ventanales
  B.layer(0.08, 120, 100, (pb, w) => {
    ART.sea(pb, 50, 120, ['#1063a6', '#1283bf', '#16a6cf', '#1fc0d0', '#20d6c7', '#4ae4cf'], {});
    for (let x = 0; x < w; x++) pb.set(x, 50, '#a6e0f4');
    const hz = ART.hazeRamp(RAMP.mesa, '#a6c8ec', 0.5);
    ART.ridge(pb, (x) => 50 - Math.max(0, Math.sin(x * 0.01) * 20) - fbm1(x * 0.03, 3, 7) * 6, hz, { mesa: true, baseIdx: 4, strata: 5 });
  }, { dyn: (g, cam, Ly) => drawSeaSparkles(g, 0, Ly.y + 52 - cam.y * Ly.fy, W, 60, Game.time, 0.6) });
  // 2. muro interior blanco salino con ventanales recortados, columnas y cerchas
  B.layer(0.3, H, 0, (pb, w) => {
    const wall = ['#8a94b8', '#a9b2d0', '#c8cee4', '#dfe4f2', '#eef1fa', '#fbfcff'];
    for (let y = 0; y < H; y++) for (let x = 0; x < w; x++) {
      const t = y / H;
      let c = rampDither(wall, 0.85 - t * 0.55 + (fbm(x * 0.02, y * 0.02, 2, 3) - 0.5) * 0.08, x, y);
      if (y % 24 === 0) c = wall[2];
      if ((x % 48) === 0 && y > 20) c = wall[2];
      pb.set(x, y, c);
    }
    for (let x = 24; x < w; x += 168) {
      // ventanal con parteluces (transparente para ver el mar)
      const wx = x, wy = 46, ww = 120, wh = 96;
      for (let yy = wy; yy < wy + wh; yy++) for (let xx = wx; xx < wx + ww; xx++) pb.set(xx, yy, 0);
      pb.rect(wx - 3, wy - 3, ww + 6, 3, '#5b6f96'); pb.rect(wx - 3, wy + wh, ww + 6, 5, '#5b6f96'); pb.hline(wx - 3, wx + ww + 2, wy + wh, '#cbdaea');
      pb.rect(wx - 3, wy, 3, wh, '#5b6f96'); pb.rect(wx + ww, wy, 3, wh, '#477a94');
      for (let k = 1; k < 4; k++) pb.rect(wx + k * 30 - 1, wy, 2, wh, '#6a7fa8');
      pb.rect(wx, wy + 40, ww, 2, '#6a7fa8');
      // columna estructural
      const cx = x + 140;
      pb.rect(cx, 0, 12, H, '#c8cee4'); pb.rect(cx, 0, 3, H, '#fbfcff'); pb.rect(cx + 9, 0, 3, H, '#8a94b8');
      for (let yy = 30; yy < H; yy += 40) { pb.set(cx + 3, yy, '#5b6f96'); pb.set(cx + 8, yy, '#5b6f96'); }
    }
    // cerchas del techo con luminarias
    pb.rect(0, 0, w, 14, '#5b6f96'); pb.hline(0, w - 1, 14, '#3a4a6e');
    for (let x = 0; x < w; x += 32) { pb.line(x, 14, x + 16, 2, '#7a8ab0'); pb.line(x + 16, 2, x + 32, 14, '#7a8ab0'); }
    for (let x = 60; x < w; x += 120) { pb.rect(x, 15, 22, 4, '#263442'); pb.rect(x + 2, 18, 18, 2, '#fff6d8'); }
    // franja técnica violeta y rótulos
    pb.rect(0, 164, w, 6, '#8d6bff'); pb.hline(0, w - 1, 164, '#b49cff'); pb.hline(0, w - 1, 169, '#5a44a8');
    for (let x = 90; x < w; x += 336) { pb.rect(x, 172, 44, 10, '#1d2a48'); pb.hline(x + 4, x + 30, 177, '#56e5ff'); }
  }, { fy: 0, dyn: (g, cam, Ly) => {
    // haces de luz de los ventanales sobre el muro y el suelo (tramados)
    const ox = cam.x * 0.3;
    for (let x = 24; x < Ly.w; x += 168) {
      const sx = x - ox;
      if (sx < -200 || sx > W + 40) continue;
      for (let k = 0; k < 4; k++) {
        const bx = sx + k * 30 + 6;
        for (let y = 146; y < 300; y += 2) { const off = (y - 146) * 0.55; fdither(g, Math.round(bx + off), y, 18, 2, '#fff6d8', 0.1); }
      }
    }
  } });
  // 3. bastidores lejanos de equipos (silueta violácea)
  B.layer(0.55, 120, H - 120 - 70, (pb, w) => {
    const pal = ['#3a3460', '#4e4878', '#6a6494', '#8a86b0'];
    for (let x = 10; x < w; x += 140) {
      for (let r = 0; r < 4; r++) { pb.rect(x, 40 + r * 14, 90, 8, pal[2]); pb.hline(x, x + 89, 40 + r * 14, pal[3]); pb.rect(x - 3, 39 + r * 14, 4, 10, pal[1]); pb.rect(x + 89, 39 + r * 14, 4, 10, pal[1]); }
      pb.rect(x - 6, 30, 3, 90, pal[0]); pb.rect(x + 96, 30, 3, 90, pal[0]);
      pb.rect(x + 104, 70, 24, 50, pal[1]); pb.ellipse(x + 116, 70, 12, 4, pal[2]);
      for (let yy = 26; yy < 120; yy += 3) pb.set(x + 132, yy, pal[0]);
    }
    for (let x = 0; x < w; x++) pb.set(x, 28, '#4e4878');
  }, { fy: 0.2 });
  return B;
};

/* ---------- Manglar (raíces zancudas y copa densa) ---------- */
ART.mangrove = function (pb, x, y, h, seed, pal = RAMP.mangrove) {
  const r = RNG(seed);
  // raíces en arco
  for (let k = -3; k <= 3; k++) {
    const rx = x + k * 5, top = y - h * 0.35;
    for (let i = 0; i <= 12; i++) { const t = i / 12; const xx = lerp(x, rx + k * 2, t), yy = lerp(top, y, t) - Math.sin(t * Math.PI) * 4; pb.set(Math.round(xx), Math.round(yy), t < 0.5 ? '#6a4a3a' : '#4a3226'); }
  }
  // tronco
  pb.rect(x - 1, y - h * 0.75, 3, h * 0.42, '#5a3a2a'); pb.vline(x - 1, y - h * 0.75, y - h * 0.34, '#7a5a42');
  // copa en racimos
  for (let i = 0; i < 9; i++) {
    const cx = x + r.range(-h * 0.45, h * 0.45), cy = y - h * 0.75 - r.range(0, h * 0.3), rr = r.range(h * 0.16, h * 0.26);
    pb.ellipse(cx, cy, rr, rr * 0.75, pal[2]);
    pb.ellipse(cx - rr * 0.25, cy - rr * 0.25, rr * 0.6, rr * 0.45, pal[4]);
    pb.ellipse(cx - rr * 0.35, cy - rr * 0.35, rr * 0.3, rr * 0.22, pal[6]);
  }
  for (let i = 0; i < 12; i++) pb.set(x + r.int(-h / 2, h / 2), y - h * 0.6 + r.int(-4, 4), pal[1]);
};

/* ---------- Cañones de sal (rosa salino, naranja, azul petróleo) ---------- */
RAMP.skySalt = ['#2a2a6e', '#3e3a8a', '#5e4aa0', '#8a5aa8', '#c06aa6', '#ee86a2', '#ffa894', '#ffc890', '#ffe6b0'];
BIOMES.canyon = function (L) {
  const B = new Backdrop(L.width, L.height);
  const horizon = 176;
  B.horizon = horizon;
  B.sky = makeSkyCanvas(RAMP.skySalt, horizon, { sun: { x: 500, y: 120, r: 16, cols: ['#fff6d8', '#ffe08a', '#ffb862'], halo: '#ffd8b0' }, curve: 1.1 });
  B.addClouds(7, CLOUD_PALS.dusk, 33, 20, 110);
  // 1. mar azul petróleo y salinas lejanas
  B.layer(0.05, 60, horizon - 6, (pb, w) => {
    ART.sea(pb, 0, 60, ['#0f3a4a', '#0f4a5a', '#16606e', '#1f7a80', '#3a9a94', '#7ac0b0'], { invert: true });
    for (let x = 0; x < w; x++) pb.set(x, 0, '#ffd8c0');
    for (let k = 0; k < 14; k++) { const x = k * 70 + 20; pb.rect(x, 4 + (k % 3) * 2, 40, 3, '#ffd8ec'); pb.hline(x, x + 39, 4 + (k % 3) * 2, '#ffffff'); }
  }, { dyn: (g, cam, Ly) => drawSunGlitter(g, 500 - cam.x * 0.02, Ly.y + 2 - cam.y * Ly.fy, Ly.y + 50 - cam.y * Ly.fy, Game.time, '#ffe6b0') });
  // 2. mesetas estratificadas con arcos (contraluz violáceo)
  B.layer(0.12, 120, horizon - 96, (pb, w) => {
    const hz = ART.hazeRamp(RAMP.mesa, '#c88ab0', 0.45);
    ART.ridge(pb, (x) => 60 - Math.max(0, Math.sin(x * 0.008 + 2) * 40) - (Math.floor(x / 90) % 3 === 0 ? 24 : 0) - fbm1(x * 0.02, 3, 8) * 10, hz, { mesa: true, baseIdx: 4, strata: 7 });
    for (let x = 100; x < w; x += 260) { for (let yy = 70; yy < 110; yy++) for (let xx = -14; xx <= 14; xx++) if ((xx * xx) / 196 + ((yy - 110) * (yy - 110)) / 1600 < 1) pb.set(x + xx, yy, 0); }
  });
  // 3. paredes del cañón cercanas con vetas de sal
  B.layer(0.3, 160, horizon - 110, (pb, w) => {
    ART.ridge(pb, (x) => 40 + Math.abs(Math.sin(x * 0.006)) * 50 + fbm1(x * 0.03, 3, 12) * 20, RAMP.mesa, { mesa: true, baseIdx: 5, strata: 9 });
    for (let y = 0; y < pb.h; y++) for (let x = 0; x < w; x++) if (pb.alpha(x, y) && ((y + Math.floor(fbm1(x * 0.01, 2, 4) * 10)) % 13 === 0) && hash2(x >> 2, y, 7) < 0.6) pb.set(x, y, '#ffe8f0');
    // costras de sal al pie
    for (let x = 0; x < w; x++) { const n = fbm1(x * 0.05, 2, 9); for (let k = 0; k < 4 + n * 6; k++) pb.set(x, pb.h - 1 - k, k < 2 ? '#ffffff' : '#ffd8ec'); }
  }, { fy: 0.2 });
  // 4. salinas rosadas cercanas con estanques (ventana al mar a la derecha)
  B.layer(0.55, 110, H - 110 - 60, (pb, w) => {
    const sp = ART.hazeRamp(RAMP.salt, '#7a5aa8', 0.28);
    for (let y = 30; y < 110; y++) for (let x = 0; x < w; x++) pb.set(x, y, rampDither(sp, 0.62 - (y - 30) / 260 + (fbm(x * 0.04, y * 0.08, 2, 3) - 0.5) * 0.2, x, y));
    for (let x = 20; x < w; x += 90) { pb.rect(x, 38, 60, 8, '#f78acb'); pb.rect(x + 1, 39, 58, 6, '#fbb0da'); pb.hline(x, x + 59, 38, '#ffffff'); for (let k = 0; k < 8; k++) pb.set(x + 6 + k * 7, 41 + (k % 3), '#ffffff'); }
    for (let x = 0; x < w; x++) pb.set(x, 30, '#ffffff');
  }, { fy: 0.25, dyn: (g, cam, Ly) => {
    const t = Game.time;
    for (let i = 0; i < 7; i++) { const fx = ((i * 97 + 40) - cam.x * 0.55) % (W + 100); ART.flamingo(g, fx < -40 ? fx + W + 100 : fx, Ly.y - cam.y * Ly.fy + 64 + (i % 3) * 10, t + i, i % 2 ? 1 : -1); }
  } });
  return B;
};

/* ---------- Dunas fotónicas (amarillo intenso, turquesa, púrpura de sombra) ---------- */
RAMP.skySolar = ['#1a3a8f', '#2152b5', '#2b6fd2', '#3d8fe6', '#5aaeee', '#86cbf2', '#b8e4f0', '#f0f4d8', '#fff0b0'];
BIOMES.pvdunes = function (L) {
  const B = new Backdrop(L.width, L.height);
  const horizon = 178;
  B.horizon = horizon;
  B.sky = makeSkyCanvas(RAMP.skySolar, horizon, { sun: { x: 330, y: 34, r: 14, halo: '#fff6c8' }, curve: 1.15 });
  B.addClouds(6, CLOUD_PALS.day, 54, 14, 90, 0.12, 0.25);
  // 1. mesetas lejanas en púrpura de sombra
  B.layer(0.05, 80, horizon - 60, (pb, w) => {
    const hz = ART.hazeRamp(['#2e1838', '#4a2a5a', '#6a3a7a', '#8a5a9a', '#a87ab0', '#c8a0c8', '#e8c8dc'], '#c8d8f0', 0.35);
    ART.ridge(pb, (x) => 50 - Math.max(0, Math.sin(x * 0.007 + 1) * 30) - (Math.floor(x / 120) % 2 ? 10 : 0) - fbm1(x * 0.02, 3, 4) * 8, hz, { mesa: true, baseIdx: 4, strata: 5 });
  });
  // 2. dunas medias con hileras FV en perspectiva y franjas de vegetación
  B.layer(0.2, 120, horizon - 40, (pb, w) => {
    const top = ART.dunes(pb, 56, 22, ART.hazeRamp(RAMP.dune, '#f0e8d0', 0.25), 3, { minW: 100, maxW: 240, lit: 5, shadow: 2, ripples: true });
    for (let row = 0; row < 3; row++) for (let x = 10 + row * 17; x < w - 60; x += 74) { const y = Math.round(top[Math.min(w - 1, x + 20)]) + 10 + row * 12; ART.pvRow(pb, x, y, 50, x + row, { tilt: 4, depth: 4 }); }
    for (let x = 0; x < w; x += 9) { const y = Math.round(top[x]) + 2; if (hash2(x, 3, 1) < 0.4) pb.set(x, y, '#4ccb70'); }
  }, { dyn: (g, cam, Ly) => {
    // sombras de nubes barriendo el campo
    const t = Game.time;
    for (let i = 0; i < 3; i++) { const cx = ((t * 14 + i * 260) % (W + 300)) - 150, cy = Ly.y - cam.y * Ly.fy + 70 + i * 10; fshadow(g, cx, cy, 70, 12, '#3a2a5a', 0.35); }
    // espejismo de calor (líneas tramadas que ondulan)
    for (let y = 0; y < 6; y++) { const yy = Ly.y - cam.y * Ly.fy + 40 + y * 3; fdither(g, Math.round(Math.sin(t * 2 + y) * 6), yy, W, 1, '#fff6d8', 0.12); }
  } });
  // 3. dunas cercanas con cardones y cercas de arena
  B.layer(0.5, 110, H - 110 - 56, (pb, w) => {
    const top = ART.dunes(pb, 80, 30, RAMP.dune, 17, { minW: 140, maxW: 300, lit: 5, shadow: 3, ripples: true });
    for (let x = 20; x < w; x += 37) { const y = Math.round(top[Math.min(w - 1, x)]) + 2; const k = hash2(x, 1, 2); if (k < 0.25) ART.cactus(pb, x, y, 16 + Math.floor(k * 30), x); else if (k < 0.45) ART.agave(pb, x, y, 7); else if (k < 0.6) { for (let i = 0; i < 18; i += 3) pb.vline(x + i, y - 8, y, '#8a5a3c'); pb.hline(x, x + 15, y - 6, '#b07a50'); } }
  }, { fy: 0.25 });
  return B;
};
