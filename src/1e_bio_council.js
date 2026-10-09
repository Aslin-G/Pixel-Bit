/* =====================================================================
   1e_bio_council.js — BIOMA CONSEJO (Nivel 09 «La Mesa del Nexo»),
   interior con el kit VISTA. Sustituye a BIOMES.council de 16_biomes.js.
   Gran salón del consejo en ARIDIA al atardecer: los ventanales en arco
   enmarcan el panorama completo (mar con reflejo del sol, cordillera,
   la colina de ARIDIA con su cúpula, cascadas y torres encendidas, y los
   tejados de la ciudad). Muro azul real con paneles, columnas doradas,
   friso de mosaico, apliques cálidos, haces de sol que cruzan el salón,
   arcada cercana con faroles, bancos y macetas, y suelo pulido.
   Planos: cielo (0) · nubes · mar y cordillera (0,04) · colina de ARIDIA
   (0,08) · tejados (0,13) · muro con ventanales (0,2) · haces · arcada (0,34)
   ===================================================================== */
var BIOME_LABELS = (typeof BIOME_LABELS !== 'undefined') ? BIOME_LABELS : {};

BIOMES.council = function (L) {
  const V = VISTA, HL = V.HALL;
  const B = new Backdrop(L.width, L.height);
  const CY0 = 0;
  const at = (f, y) => Math.round(y - (V.CAMY - CY0) * f * 0.3);
  const HZ = 156;
  const SUN = { x: 300, y: 128, r: 11, halo: 30 };
  const T = () => Game.time;
  B.horizon = HZ;
  B.sun = SUN;
  // viento: valor por defecto de Backdrop (0,3), como el bioma anterior
  B.sky = V.timed('sky', () => V.sky(W, H, {
    horizonY: HZ, sun: SUN, curve: 1.0, bands: 26,
    stops: ['#1c1e5e', '#282a72', '#3a3484', '#523e90', '#704896', '#925496', '#b45e90', '#d26c86', '#ea8478', '#f8a06c', '#ffc070'],
    haze: ['#ffb070', '#ffc480', '#ffd090', '#ffdca0'],
  }).toCanvas());
  B.vdyn(0, (g) => V.sunBloom(g, SUN, T(), { a: 0.4, r: 76, col: '#ffb070' }), { tag: 'sun' });
  B.cloudDeck({ kind: 'cirrus', n: 6, seed: 91, f: [0.01, 0.03], y: [10, 70], w: [80, 170], speed: [0.8, 1.6], pal: ['#6a5c9c', '#c08cb4', '#f8b8a8', '#ffe8c8'] });
  B.cloudDeck({ n: 6, seed: 93, f: [0.03, 0.06], y: [24, 96], w: [60, 130], bias: 0.7, speed: [1.2, 2.2], sunX: SUN.x, pal: ['#2e2a62', '#423a76', '#5e4888', '#86568e', '#b06890', '#d88290', '#f8a890', '#ffd4a4'] });
  /* ---------------- mar y cordillera (0,04) ---------------- */
  B.vplane(0.04, at(0.04, HZ), 80, (pb) => V.seaFar(pb, 0, pb.h, { seed: 95, stops: ['#f0a888', '#b884a8', '#7a6aa8', '#4a5a9c', '#30488a', '#24407e', '#1e3874', '#1a3270'], horizonCol: '#ffd0a0', caps: true }), {
    tag: 'sea', dyn: (g, cam, Ly) => { const [, oy] = B.vofs(Ly, cam); V.drawSeaFx(g, 0, oy, W, 70, T(), { sunX: SUN.x, density: 0.7 }); },
  });
  B.vplane(0.04, at(0.04, HZ - 56), 57, (pb, w, h) => {
    const r = RNG(951), peaks = [];
    for (let x = 380; x < w + 60;) { const ww = r.int(50, 120); peaks.push({ x: x + ww * 0.5, v: r.int(14, 30), h: r.int(18, 50), w: ww, d: r.int(16, 28) }); x += r.int(36, 90); }
    V.relief(pb, {
      yBase: h - 1, nv: 40, dvy: 0.3, seed: 953, hMax: 50,
      H: V.massif(peaks, { seed: 953, rough: 0.5, scale: 0.05, apron: 5, spurs: 5, spurW: 0.4 }),
      ramp: ['#2a2458', '#3a2e68', '#4e3a78', '#664684', '#80528c', '#a06290', '#c4748e'], contrast: 1.8, t0: 0.45,
      haze: { col: '#b07a9c', k0: 0.06, k: 0.16 }, mist: { col: '#e8a090', h: 12, k: 0.55 }, rim: '#ffc090', rimK: 0.7, tex: 0.04,
    });
  }, { tag: 'far' });
  /* ---------------- colina de ARIDIA encendida (0,08) ---------------- */
  const cityFx = { falls: [], lights: [], glints: [], turb: [] };
  B.vplane(0.08, at(0.08, 48), 180, (pb, w, h) => {
    const k = 0.1, r = RNG(961), cx = 250;
    const info = V.relief(pb, {
      yBase: h - 1, nv: 40, dvy: 0.3, seed: 963, hMax: 110,
      H: V.massif([{ x: cx, v: 22, h: 112, w: 170, d: 30, k: 0.85 }, { x: cx - 120, v: 12, h: 54, w: 100, d: 20 }, { x: cx + 130, v: 14, h: 66, w: 110, d: 22 }, { x: 620, v: 16, h: 80, w: 130, d: 24, k: 0.9 }, { x: 740, v: 10, h: 40, w: 90, d: 18 }],
        { seed: 963, rough: 0.5, scale: 0.045, apron: 6, plateaus: [{ x: cx, w: 70, h: 96 }, { x: 620, w: 34, h: 72 }] }),
      ramp: V.RAMPS.hill, contrast: 2.0, t0: 0.5, facet: 0.3, cav: 0.1,
      haze: { col: '#9a6a9a', k0: 0.12, k: 0.1 }, mist: { col: '#d89090', h: 16, k: 0.4 }, rim: '#ffc08a', rimK: 0.75, tex: 0.06,
      veg: { ramp: V.RAMPS.vegHill, density: 0.1, maxSlope: 1.1, minY: 60, size: 3 },
    });
    V.scatterVeg(pb, (x) => Math.abs(x - cx) < 52 ? null : info.top[x] + 1, 0, w, 9601, { k: k + 0.04, gap: 7, mix: { tree: 4, shrub: 3, palm: 2 }, ramp: V.RAMPS.vegHill });
    for (let i = 0; i < 22; i++) { const x = r.pick([r.int(100, 190), r.int(310, 420), r.int(560, 700)]), y = info.onSurf(x, r.int(3, 14)); if (y == null || y < 60) continue; const hs = V.house(pb, x, y + 1, r.int(6, 10), r.int(4, 7), 9700 + i, { k }); if (r.chance(0.7)) { cityFx.lights.push([x + 2, y - 2, '#ffd890']); V.put(pb, x + 2, y - 2, U('#ffd890')); } }
    const dc = V.domeCity(pb, cx, info.top[cx] + 8, { k: 0.06, s: 0.95 });
    for (const t of dc.towers) for (let yy = t.top + 6; yy < t.y - 4; yy += 4) if (r.chance(0.5)) { V.put(pb, t.x + 1, yy, U('#ffe0a0')); if (r.chance(0.3)) cityFx.lights.push([t.x + 1, yy, '#ffe8b0']); }
    cityFx.glints.push([cx - 12, dc.top + 26], [cx + 8, dc.top + 32]);
    for (const F of dc.falls) { const y0 = dc.base, y1 = h - 6; V.fall(pb, F.x, y0, y1, F.w, { k: 0.04 }); cityFx.falls.push({ x: F.x, y0, y1, w: F.w }); }
    for (const [x, th, R] of [[470, 46, 16], [520, 40, 15], [700, 44, 16]]) { if (x >= w) continue; let bx = x; for (let q = -8; q <= 8; q++) if (info.top[x + q] < info.top[bx]) bx = x + q; const hub = V.turbineTower(pb, bx, info.top[bx] + 2, th, { k: 0.14 }); cityFx.turb.push({ x: hub.hx, y: hub.hy, rot: V.rotor(R, { k: 0.14 }), sp: 1.8 + (bx % 5) * 0.3, ph: bx }); }
  }, {
    tag: 'city', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      V.drawFalls(g, cityFx.falls, ox, oy, t, { speed: 40, alpha: 0.75 });
      for (const tb of cityFx.turb) V.drawRotor(g, tb.rot, tb.x + ox, tb.y + oy, t * tb.sp + tb.ph);
      for (const [x, y] of cityFx.glints) V.drawGlow(g, x + ox, y + oy, 4, '#ffe8c0', 0.35 + 0.3 * Math.sin(t * 1.3 + x));
      V.drawLights(g, cityFx.lights, ox, oy, t, { blink: -0.3 });
    },
  });
  /* ---------------- tejados de la ciudad (0,13) ---------------- */
  const roofFx = { lights: [] };
  B.vplane(0.13, at(0.13, 168), 70, (pb, w, h) => {
    const k = 0.06, r = RNG(971);
    for (let x = 0; x < w;) {
      const ww = r.int(10, 22), hh = r.int(8, 26), y = h - 2 - r.int(0, 8);
      V.house(pb, x, y, ww, hh, 9800 + x, { k, roof: r.pick(['flat', 'dome', 'terrace', 'flat', 'solar']), tint: r.pick([null, '#ffc890', '#ffb0a0']) });
      for (let yy = y - hh + 3; yy < y - 2; yy += 4) for (let xx = x + 2; xx < x + ww - 2; xx += 3) if (r.chance(0.3)) { V.put(pb, xx, yy, U('#ffd890')); if (r.chance(0.15)) roofFx.lights.push([xx, yy, '#ffe8b0']); }
      if (r.chance(0.25)) V.palm(pb, x + ww + 2, h - 2, r.int(18, 26), r.range(-3, 3), 9900 + x, { k });
      x += ww + r.int(1, 6);
    }
    V.rim(pb, U('#ffc090'), 0.5, -1, 0); V.rim(pb, U('#ffd8a8'), 0.4, 0, -1);
  }, { tag: 'roofs', dyn: (g, cam, Ly) => { const [ox, oy] = B.vofs(Ly, cam); V.drawLights(g, roofFx.lights, ox, oy, T(), { blink: -0.5 }); } });
  /* ---------------- muro del salón con ventanales en arco (0,2) ---------------- */
  const hallFx = { sconces: [], wins: [] };
  B.vplane(0.2, at(0.2, 0), 296, (pb, w, h) => {
    const k = 0.04;
    V.royalWall(pb, 0, 0, w, h, { k, seed: 981 });
    // artesonado del techo
    const G = V.P32(V.hz(HL.GOLD, k));
    for (let y = 0; y < 26; y++) for (let x = 0; x < w; x++) { const cx = x % 30, cy = y % 13; const edge = cx < 2 || cy < 2; pb.data[y * w + x] = edge ? G[cx === 0 || cy === 0 ? 6 : 3] : V.P32(V.hz(HL.ROYAL, k))[cy > 9 ? 1 : cx > 26 ? 2 : 3]; }
    V.goldTrim(pb, 0, w, 26, { k });
    for (let cx = 90; cx < w + 60; cx += 180) {
      V.carveArch(pb, cx, 50, 104, 168, { k, th: 6, frame: HL.GOLD });
      // parteluz y travesaño del ventanal (vidriera fina)
      for (let y = 102; y < 218; y++) { V.put(pb, cx, y, G[5]); V.put(pb, cx + 1, y, G[2]); }
      for (let x = cx - 52; x < cx + 52; x++) { V.put(pb, x, 150, G[5]); V.put(pb, x, 151, G[2]); }
      for (let x = cx - 58; x < cx + 58; x++) { V.put(pb, x, 218, G[7]); V.put(pb, x, 219, G[4]); V.put(pb, x, 220, G[2]); }
      hallFx.wins.push(cx);
      // columnas doradas entre ventanales y apliques
      if (cx + 90 < w) { V.goldColumn(pb, cx + 82, 30, 292, 16, { k }); hallFx.sconces.push(V.sconce(pb, cx + 90, 120, { k }), V.sconce(pb, cx + 90, 200, { k })); }
    }
    V.mosaicBand(pb, 0, w, 236, 10, { k, cell: 5 });
    V.goldTrim(pb, 0, w, 284, { k });
  }, {
    tag: 'hall', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      for (const [x, y] of hallFx.sconces) { const sx = x + ox; if (sx < -30 || sx > W + 30) continue; V.drawGlow(g, sx, y + oy, 9, '#ffc870', 0.5 + 0.06 * Math.sin(t * 7 + x)); V.drawSoftGlow(g, sx, y + oy + 6, 34, '#ff9a50', 0.28); }
    },
  });
  // haces de sol poniente que entran por los ventanales y cruzan el salón
  const beam = V.beam(76, 214, 120, { col: '#ffc890', a0: 0.34, w0: 64 });
  B.vdyn(0.2, (g, cam) => {
    const ox = -Math.round(cam.x * 0.2), oy = at(0.2, 0) + Math.round(V.CAMY * 0.06);
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.75 + 0.1 * Math.sin(T() * 0.3);
    for (const cx of hallFx.wins) { const x = cx + ox - 34; if (x > W || x + beam.w < 0) continue; g.drawImage(beam.c, x, oy + 70); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }, { tag: 'beams' });
  /* ---------------- arcada cercana con faroles, bancos y macetas (0,34) ---------------- */
  const nearFx = { lanterns: [] };
  B.vplane(0.34, at(0.34, 0), 296, (pb, w, h) => {
    const k = 0.02, r = RNG(991), G = V.P32(V.hz(HL.GOLD, k));
    V.reflectFloor(pb, 0, w, 274, 296, { k, ramp: ['#0a1030', '#121a46', '#1a2458', '#24306c', '#2e3c80', '#3a4a94'], lights: [], col: '#ffc890' });
    for (let x = 0; x < w; x += 240) {
      // pilastra de mármol claro y arco rebajado que la une con la siguiente
      V.column(pb, x, 34, 276, 22, { k, ramp: ['#3a3456', '#5a5070', '#7a708a', '#9a90a4', '#bab0c0', '#d8d0dc', '#f0ecf0'] });
      for (let xx = x + 22; xx < Math.min(w, x + 240); xx++) { const u = (xx - x - 22) / 218, yy = 34 + Math.round(Math.sin(u * Math.PI) * 18); for (let q = 0; q < 8; q++) V.put(pb, xx, yy - q, G[q === 0 ? 2 : q === 7 ? 7 : q < 3 ? 3 : 5]); for (let q = 0; q < 34 - yy + 8 && q < 40; q++) V.put(pb, xx, yy - 8 - q, V.P32(V.hz(HL.ROYAL, k))[2 + ((xx >> 3) & 1)]); }
      // farol colgante
      const lx = x + 130; for (let yy = 30; yy < 62; yy++) V.put(pb, lx, yy, G[3]);
      V.rect(pb, lx - 3, 62, 7, 9, G[4]); V.rect(pb, lx - 2, 63, 5, 7, U('#ffe8a0')); V.put(pb, lx, 66, U('#fffbe8'));
      nearFx.lanterns.push([lx, 66]);
      // bancos y macetas
      V.bench3q(pb, x + 60, 276, 40, { k }); if (r.chance(0.7)) V.planter(pb, x + 180, 276, { k, seed: x });
    }
  }, {
    tag: 'near', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      for (const [x, y] of nearFx.lanterns) { const sx = x + ox; if (sx < -40 || sx > W + 40) continue; V.drawGlow(g, sx, y + oy, 10, '#ffd070', 0.55); V.drawSoftGlow(g, sx, y + oy + 10, 46, '#ff9a50', 0.25); }
      V.drawMotes(g, 16, t, 41, { y0: 80, y1: 280, col: '#ffe0a0' });
    },
  });
  B.vistaInfo = { planes: B.layers.length, ms: Object.assign({}, V.stats.ms) };
  return B;
};

BIOME_LABELS.council = BIOME_LABELS.council || [];
