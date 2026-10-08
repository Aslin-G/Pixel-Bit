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
