/* =====================================================================
   1e_bio_citadel.js — BIOMA CIUDADELA (Nivel 07 «La Ciudadela del
   Hidrógeno») con el kit VISTA. Sustituye a BIOMES.citadel de 16_biomes.js.
   Hora azul: el sol acaba de ponerse tras la bahía; primeras estrellas,
   nubes rosadas, ARIDIA encendida en el cabo lejano, aerogeneradores con
   balizas, campo FV y la ciudadela blanca: torres con franja cian, naves
   de electrolizadores con celdas esmeralda, tanques de H₂ verdes con
   cúpula blanca, esferas de almacenamiento, chimeneas de venteo con
   balizas (encuadre de seguridad abstracto: solo arquitectura) y la línea
   de agua ultrapura en cian.
   Planos: cielo+estrellas+resplandor (0) · cirros · cúmulos · cordillera
   (0,05) · bahía con ARIDIA (0,08) · llanura con eólica y FV (0,16) ·
   ciudadela (0,28) · naves y tanques cercanos (0,45)
   Cámara del nivel: cam.y = 0 (suelo jugable en y ≈ 290).
   ===================================================================== */
var BIOME_LABELS = (typeof BIOME_LABELS !== 'undefined') ? BIOME_LABELS : {};

BIOMES.citadel = function (L) {
  // hora azul: todas las rampas del kit se brumean hacia el azul del anochecer durante la construcción
  const prevHaze = PAL_REF.haze, prevK = Object.assign({}, VISTA.H2K), KB = VISTA.H2K_BASE;
  PAL_REF.haze = '#2c3a74';
  VISTA.H2K.WHT = VISTA.duskRamp(KB.WHT); VISTA.H2K.CYAN = VISTA.duskRamp(KB.CYAN, '#b4c0e8', 0.04); VISTA.H2K.H2G = VISTA.duskRamp(KB.H2G, '#c8d6ee', 0.02);
  try { return buildCitadel(L); } finally { PAL_REF.haze = prevHaze; Object.assign(VISTA.H2K, prevK); }
};
function buildCitadel(L) {
  const V = VISTA, K = V.H2K;
  const DK = { CONC: V.duskRamp(V.TECH.CONC), STEEL: V.duskRamp(V.TECH.STEEL) };
  const B = new Backdrop(L.width, L.height);
  const CY0 = 0;
  const at = (f, y) => Math.round(y - (V.CAMY - CY0) * f * 0.3);
  const lyOf = (f, ys) => at(f, ys) + Math.round(V.CAMY * f * 0.3);
  const HZ = 170;
  const SUN = { x: 128, y: HZ + 3, r: 10, halo: 34 };
  const labels = [];
  const T = () => Game.time;
  B.horizon = HZ;
  B.sun = SUN;
  // viento: valor por defecto de Backdrop (0,3), como el bioma anterior
  B.sky = V.timed('sky', () => {
    const pb = V.sky(W, H, {
      horizonY: HZ, sun: SUN, curve: 1.05, bands: 26,
      stops: ['#0a1440', '#10204e', '#18305e', '#22406e', '#30527e', '#46628c', '#66709a', '#8e7ca4', '#b88aa8', '#e09ea4', '#f8b89a'],
      haze: ['#f0b4a0', '#f8c49a', '#ffd4a0', '#ffe0b0'],
    });
    V.stars(pb, { n: 150, y1: 96, seed: 71 });
    return pb.toCanvas();
  });
  // resplandor del sol poniente
  B.vdyn(0, (g) => { V.sunBloom(g, SUN, T(), { a: 0.42, r: 80, col: '#ffb07a' }); }, { tag: 'sun' });
  /* ---------------- nubes rosadas ---------------- */
  B.cloudDeck({ kind: 'cirrus', n: 7, seed: 71, f: [0.01, 0.03], y: [10, 70], w: [80, 170], speed: [0.8, 1.6], pal: ['#6a5c9c', '#b48cb4', '#f0b4b0', '#ffe4cc'] });
  B.cloudDeck({ n: 6, seed: 73, f: [0.03, 0.06], y: [20, 86], w: [60, 130], bias: 0.7, speed: [1.2, 2.4], sunX: SUN.x, pal: ['#26285a', '#38386c', '#544a80', '#7c5890', '#a86a94', '#d48496', '#f4a898', '#ffd2ac'] });
  /* ---------------- cordillera violeta con borde de ocaso (0,05) ---------------- */
  B.vplane(0.05, at(0.05, HZ - 52), 54, (pb, w, h) => {
    const r = RNG(751), peaks = [];
    for (let x = 160; x < w + 60;) { const ww = r.int(50, 120); peaks.push({ x: x + ww * 0.5, v: r.int(14, 30), h: r.int(16, 46), w: ww, d: r.int(16, 28) }); x += r.int(36, 90); }
    V.relief(pb, {
      yBase: h - 1, nv: 40, dvy: 0.3, seed: 753, hMax: 46,
      H: V.massif(peaks, { seed: 753, rough: 0.5, scale: 0.05, apron: 5, spurs: 5, spurW: 0.4 }),
      ramp: ['#1e1c46', '#28265a', '#34306a', '#443a78', '#564684', '#6c548e', '#8a6496', '#b07898'], contrast: 1.8, t0: 0.42,
      haze: { col: '#8a7aa8', k0: 0.05, k: 0.18 }, mist: { col: '#c890a8', h: 12, k: 0.55 }, rim: '#ffb890', rimK: 0.75, tex: 0.04,
    });
  }, { tag: 'far' });
  /* ---------------- bahía al anochecer con ARIDIA en el cabo (0,08) ---------------- */
  const bayFx = { lights: [], glints: [] };
  B.vplane(0.08, at(0.08, HZ - 46), 84, (pb, w, h) => {
    const y0 = 46;
    V.bay(pb, y0, h, { stops: ['#e8b0b0', '#a888b4', '#6a6aa4', '#3e4c88', '#283670', '#1c285c'], glowX: SUN.x + 4, glowCol: '#ffc090' });
    // cabo de ARIDIA a la derecha (silueta con la ciudad encendida)
    const cx = 470;
    const info = V.relief(pb, {
      x0: 330, x1: Math.min(w, 640), yBase: y0 + 3, nv: 24, dvy: 0.25, seed: 761, hMax: 40,
      H: V.massif([{ x: cx, v: 10, h: 34, w: 110, d: 18, k: 0.8 }, { x: cx + 90, v: 8, h: 18, w: 80, d: 16 }, { x: cx - 90, v: 8, h: 14, w: 70, d: 14 }], { seed: 761, rough: 0.4, scale: 0.06, apron: 3, plateaus: [{ x: cx, w: 30, h: 32 }] }),
      ramp: ['#141432', '#1c1c42', '#262652', '#323262', '#40406e', '#56507a', '#7a6688'], contrast: 1.6, t0: 0.4, rim: '#ff9e88', rimK: 0.6, tex: 0.04,
    });
    const dc = V.domeCity(pb, cx, info.top[cx] + 6, { k: 0.5, s: 0.42, label: false });
    // ventanas encendidas de la ciudad y del pueblo costero
    const r = RNG(763);
    for (let i = 0; i < 70; i++) { const x = r.int(cx - 60, cx + 60), y = info.top[x] != null ? info.top[x] + r.int(1, 10) : 0; if (y > 0 && y < y0 + 2 && (V.get(pb, x, y) >>> 24)) { const c = r.chance(0.7) ? '#ffd890' : '#a8f4ff'; V.put(pb, x, y, U(c)); if (r.chance(0.3)) bayFx.lights.push([x, y, c]); } }
    bayFx.glints.push([cx - 4, dc.top + 12]);
    // faro de SYNARA en el extremo del cabo
    const lh = V.lighthouse(pb, cx + 140, info.top[cx + 140] + 1, 12, { k: 0.3 });
    bayFx.beam = [lh.lx, lh.ly];
  }, {
    tag: 'bay', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      V.drawSeaFx(g, 0, oy + 47, W, 36, t, { density: 0.5, sunX: SUN.x + 4 });
      V.drawLights(g, bayFx.lights, ox, oy, t, { blink: 0.2 });
      for (const [x, y] of bayFx.glints) V.drawGlow(g, x + ox, y + oy, 5, '#a8f8ff', 0.4 + 0.2 * Math.sin(t * 1.2));
      if (bayFx.beam) { const [x, y] = bayFx.beam, a = (Math.sin(t * 1.6) + 1) / 2; V.drawGlow(g, x + ox, y + oy, 3 + Math.round(a * 3), '#fff0b0', 0.4 + a * 0.5); }
    },
  });
  /* ---------------- llanura con eólica, FV y pueblo (0,16) ---------------- */
  const plainFx = { turb: [], beacons: [], lights: [] };
  B.vplane(0.16, at(0.16, 120), 92, (pb, w, h) => {
    const r = RNG(771), k = 0.3;
    const info = V.relief(pb, {
      yBase: h - 1, nv: 30, dvy: 0.5, seed: 773, hMax: 40,
      H: V.massif([{ x: 60, v: 14, h: 34, w: 150, d: 20 }, { x: 330, v: 14, h: 26, w: 170, d: 20 }, { x: 640, v: 14, h: 38, w: 160, d: 20 }, { x: 920, v: 14, h: 28, w: 150, d: 20 }, { x: 1300, v: 14, h: 34, w: 170, d: 20 }],
        { seed: 773, rough: 0.4, scale: 0.05, apron: 4, base: 4 }),
      ramp: ['#141c38', '#1a2644', '#223250', '#2c3e5a', '#3a4c66', '#4c5a70', '#6a6a7c', '#8a7a88'], contrast: 1.6, t0: 0.48,
      haze: { col: '#7a78a8', k0: 0.06, k: 0.12 }, mist: { col: '#9c88b0', h: 14, k: 0.5 }, rim: '#e8a090', rimK: 0.5, tex: 0.05,
      veg: { ramp: ['#141e1c', '#1c2a24', '#24382c', '#2e4634'], density: 0.05, maxSlope: 0.9, minY: 20 },
    });
    // aerogeneradores en las lomas con baliza roja
    for (let x = 30; x < w - 10; x += r.int(54, 90)) {
      let bx = x; for (let q = -12; q <= 12; q++) if (info.top[x + q] < info.top[bx]) bx = x + q;
      const y = info.top[bx] + 2; if (y > h - 20) continue;
      const th = r.int(30, 40), hub = V.turbineTower(pb, bx, y, th, { k: 0.45 });
      plainFx.turb.push({ x: hub.hx, y: hub.hy, R: 13, k: 0.45, sp: 1.5 + (bx % 5) * 0.2, ph: bx, rot: V.rotor(13, { k: 0.45 }) });
      plainFx.beacons.push([hub.hx + 2, hub.hy - 1, '#ff5040']);
    }
    // campo FV oscuro que refleja el ocaso
    for (const x0 of [180, 520, 1000]) if (x0 < w - 70) V.pvArray(pb, x0, h - 10, { tables: 3, cols: 12, rows: 2, cw: 4, ch: 2, gap: 2, skew: 2, k: 0.45, shift: 3 });
    // pueblo con luces
    for (const [x0, x1] of [[380, 470], [760, 880], [1150, 1260]]) if (x0 < w) { const S = V.skyline(pb, x0, Math.min(w, x1), h - 6, { k: 0.2, seed: x0, hMin: 4, hMax: 12, lit: 0.45 }); plainFx.lights.push(...S.lights); }
  }, {
    tag: 'plain', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      drawTurbines(g, cam, Ly, plainFx.turb);
      for (let i = 0; i < plainFx.beacons.length; i++) { const [x, y] = plainFx.beacons[i]; if ((Math.floor(t * 1.2 + i * 0.37) % 2) === 0) { g.fillStyle = '#ff5040'; g.fillRect(x + ox, y + oy, 1, 1); V.drawGlow(g, x + ox, y + oy, 3, '#ff4030', 0.5); } }
      V.drawLights(g, plainFx.lights, ox, oy, t, { blink: 0 });
    },
  });
  /* ---------------- la ciudadela (0,28) ---------------- */
  const citFx = { glows: [], flowsC: [], flowsG: [], beacons: [], lights: [], cells: [], lamps: [], halos: [], rings: [] };
  const CIT_YS = 66;
  B.vplane(0.28, at(0.28, CIT_YS), 172, (pb, w, h) => {
    const r = RNG(781), k = 0.26, base = h - 30;
    // terraplén y plataforma blanca escalonada (frente de hormigón con franja cian)
    const info = V.relief(pb, {
      yBase: h - 1, nv: 20, dvy: 0.5, seed: 783, hMax: 40,
      H: V.massif([{ x: 200, v: 8, h: 34, w: 260, d: 16, k: 0.5 }, { x: 700, v: 8, h: 30, w: 280, d: 16, k: 0.5 }, { x: 1120, v: 8, h: 34, w: 260, d: 16, k: 0.5 }], { seed: 783, rough: 0.3, scale: 0.05, apron: 3, base: 10 }),
      ramp: ['#18203a', '#202a46', '#2a3654', '#364462', '#465270', '#58607a', '#707088'], contrast: 1.4, t0: 0.5, rim: '#e8a890', rimK: 0.4, tex: 0.05,
      veg: { ramp: ['#142018', '#1c2c20', '#24382a', '#2e4632', '#3a5638'], density: 0.08, maxSlope: 1.2, minY: 0, size: 2.5 },
    });
    for (const [x0, x1] of [[60, 470], [520, 900], [950, 1300]]) {
      if (x0 >= w) continue;
      V.box3q(pb, x0, base + 6, Math.min(w, x1) - x0, 8, 12, { ramp: K.WHT, k, front: 4, side: 2, top: 6 });
      for (let x = x0; x < Math.min(w, x1); x++) V.put(pb, x, base + 1, U(V.hzc('#22c1e7', k)));
    }
    // racks de tuberías al fondo de la plataforma (H₂ verde, agua ultrapura cian, gris de servicio)
    for (const [x0, x1] of [[70, 460], [530, 890], [960, 1290]]) if (x0 < w) V.pipeRack(pb, x0, Math.min(w - 4, x1), base - 30, [K.H2G, K.CYAN, DK.STEEL], { k: k + 0.04, span: 16, steel: DK.STEEL });
    // farolas cálidas
    for (let x = 70; x < w; x += 34) { const lp = V.lamp(pb, x, base - 1, 10, { k }); citFx.lamps.push([lp.x, lp.y]); }
    // torres blancas con franja cian
    for (const [x, tw, th] of [[96, 10, 92], [118, 8, 70], [404, 12, 108], [430, 8, 74], [560, 9, 84], [880, 11, 98], [990, 8, 70], [1250, 12, 110], [1274, 8, 76]]) {
      if (x >= w - 4) continue;
      const tw2 = V.whiteTower(pb, x, base - 2, tw, th, x, { k, lit: 0.55 });
      citFx.lights.push(...tw2.lights.map(([a, b]) => [a, b, '#fff0c0'])); citFx.beacons.push(tw2.beacon);
    }
    // naves de electrolizadores
    for (const [x, ww, hh] of [[150, 90, 34], [600, 110, 38], [1020, 100, 36]]) {
      if (x >= w - 20) continue;
      const E = V.electroHall(pb, x, base - 2, ww, hh, { k });
      for (const c of E.cells) citFx.cells.push(c);
      citFx.halos.push([x + ww / 2, base - 20]);
      citFx.glows.push([x + ww / 2, base - 2 - Math.round(hh * 0.5), 10, '#46e090']);
    }
    // esferas y tanques de H₂
    for (const [x, rr] of [[270, 16], [310, 13], [760, 15], [1180, 16]]) if (x < w - 20) V.sphereTank(pb, x, base - 2 - rr - 4, rr, { k });
    for (const [x, rx, hh] of [[350, 6, 40], [372, 6, 46], [500, 7, 52], [522, 6, 44], [820, 7, 50], [842, 6, 42], [940, 7, 48], [1330, 7, 50]]) {
      if (x >= w - 8) continue;
      const tk = V.h2Tank(pb, x, base - 2, rx, hh, { k, label: rx >= 7, white: (x % 3) === 0 });
      citFx.glows.push([tk.glow[0], tk.glow[1], tk.glow[2], '#3ad884']); citFx.rings.push(tk.ring);
    }
    // chimeneas de venteo en zona señalizada (solo arquitectura)
    for (const x of [240, 680, 1110]) if (x < w) { const v = V.ventStack(pb, x, base - 2, 64, { k }); citFx.beacons.push([v.lx, v.ly]); }
    // pasarelas y tuberías: verde H₂, cian agua ultrapura
    V.catwalk(pb, 130, 420, base - 44, { k }); V.catwalk(pb, 580, 900, base - 50, { k }); V.catwalk(pb, 1000, 1290, base - 46, { k });
    const H2P = [[240, base - 12], [520, base - 12]], H2P2 = [[700, base - 14], [950, base - 14]], UPW = [[60, base - 20], [150, base - 20]], UPW2 = [[480, base - 22], [600, base - 22]];
    for (const p of [H2P, H2P2]) { V.pipe(pb, p, 1, K.H2G, { k, flange: 16 }); citFx.flowsG.push(p); }
    for (const p of [UPW, UPW2]) { V.pipe(pb, p, 1, K.CYAN, { k, flange: 16 }); citFx.flowsC.push(p); }
    // bosquete de palmeras y matorral en el talud
    V.scatterVeg(pb, (x) => info.top[x] > base + 8 ? info.top[x] + 1 : null, 0, w, 7801, { k: 0.2, gap: 10, mix: { tree: 2, shrub: 3, palm: 2 }, ramp: ['#0e1a14', '#16261c', '#1e3424', '#28422c', '#345234', '#44663e'] });
    V.rim(pb, U('#ffb890'), 0.55, -1, 0); V.rim(pb, U('#ffc8a0'), 0.4, 0, -1);
    const tk0 = 500;
    labels.push({ x: tk0 + 10, y: lyOf(0.28, CIT_YS) + base - 76, f: 0.28, title: 'H₂ VERDE', sub: 'Almacenamiento', kind: 'green', ax: tk0, ay: lyOf(0.28, CIT_YS) + base - 56 });
  }, {
    tag: 'cit', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      for (const [x, y] of citFx.halos) if (x + ox > -90 && x + ox < W + 90) V.drawSoftGlow(g, x + ox, y + oy, 70, '#2ec878', 0.5 + 0.1 * Math.sin(t * 0.9 + x));
      for (const [x, y, rr, c] of citFx.glows) V.drawGlow(g, x + ox, y + oy, rr, c, 0.4 + 0.16 * Math.sin(t * 1.8 + x));
      for (const [x, y, rr] of citFx.rings) V.drawGlow(g, x + ox, y + oy, rr + 3, '#5ee69a', 0.35 + 0.15 * Math.sin(t * 2.4 + x));
      for (const [x, y] of citFx.lamps) if (x + ox > -10 && x + ox < W + 10) V.drawGlow(g, x + ox, y + oy + 2, 6, '#ffd890', 0.45);
      for (const p of citFx.flowsG) V.drawFlowC(g, p, ox, oy, t, { col: '#c8ffe0', speed: 14, gap: 8 });
      for (const p of citFx.flowsC) V.drawFlowC(g, p, ox, oy, t, { col: '#e8feff', speed: 18, gap: 7 });
      for (let i = 0; i < citFx.beacons.length; i++) { const [x, y] = citFx.beacons[i]; if (x + ox < -4 || x + ox > W + 4) continue; const on = (Math.floor(t * 1.1 + i * 0.29) % 2) === 0; if (on) { g.fillStyle = '#ff5848'; g.fillRect(x + ox, y + oy, 1, 1); V.drawGlow(g, x + ox, y + oy, 3, '#ff4030', 0.55); } }
      for (const [x, y] of citFx.cells) if (x + ox > -6 && x + ox < W + 6) V.drawBubbles(g, x + ox - 2, y + oy + 4, 4, 8, t + x, { n: 2, col: '#d8fff0' });
      V.drawLights(g, citFx.lights, ox, oy, t, { blink: -0.2 });
    },
  });
  /* ---------------- naves y tanques cercanos (0,45) ---------------- */
  const nearFx = { glows: [], cells: [], flows: [], beacons: [], rings: [], halos: [] };
  const NEAR_YS = 118;
  B.vplane(0.45, at(0.45, NEAR_YS), 176, (pb, w, h) => {
    const r = RNG(791), k = 0.14, base = h - 4;
    // losa de hormigón y muro con franja cian
    V.box3q(pb, 0, base, w, 10, 14, { ramp: DK.CONC, k, front: 4, side: 2, top: 6 });
    for (let x = 0; x < w; x++) { V.put(pb, x, base - 7, U('#22c1e7')); V.put(pb, x, base - 6, U('#1090b4')); }
    // banda continua de edificios bajos con ventanas encendidas (siempre hay arquitectura)
    for (let x = 0; x < w; x += 70) {
      const bw = 70, bh = 24 + ((x / 70) % 3) * 4;
      V.box3q(pb, x, base - 10, bw - 2, bh, 10, { ramp: K.WHT, k: k + 0.06, front: 4, side: 2, top: 6 });
      for (let yy = base - 10 - bh + 4; yy < base - 14; yy += 5) for (let xx = x + 3; xx < x + bw - 6; xx += 4) if (hash2(xx, yy, 5) < 0.45) { V.put(pb, xx, yy, U(hash2(xx, yy, 6) < 0.7 ? '#ffe0a0' : '#a8f4ff')); V.put(pb, xx + 1, yy, U('#e8c080')); }
    }
    const seq = ['hall', 'tanks', 'upw', 'sphere', 'tower', 'tanks', 'hall', 'sphere', 'upw', 'tower'];
    let x = 24, si = 0;
    while (x < w - 40) {
      const kind = seq[si++ % seq.length];
      if (kind === 'hall') {
        const ww = r.int(120, 160), hh = r.int(46, 58);
        const E = V.electroHall(pb, x, base - 10, ww, hh, { k, d: 22 });
        nearFx.cells.push(...E.cells); nearFx.glows.push([x + ww / 2, base - 10 - Math.round(hh * 0.5), 18, '#46e090']); nearFx.halos.push([x + ww / 2, base - 10 - Math.round(hh * 0.5)]);
        x += ww + r.int(26, 44);
      } else if (kind === 'tanks') {
        const n = r.int(2, 3);
        for (let i = 0; i < n; i++) { const rx = r.int(8, 10), hh = r.int(50, 66); const tk = V.h2Tank(pb, x + rx, base - 10, rx, hh, { k, label: true, white: i === 1 }); nearFx.glows.push([tk.glow[0], tk.glow[1], tk.glow[2] + 4, '#3ad884']); nearFx.rings.push(tk.ring); x += rx * 2 + r.int(5, 9); }
        x += r.int(24, 40);
      } else if (kind === 'sphere') {
        const rr = r.int(18, 24); V.sphereTank(pb, x + rr, base - 10 - rr - 6, rr, { k });
        x += rr * 2 + r.int(24, 40);
      } else if (kind === 'tower') {
        const tw = r.int(14, 18), th = r.int(96, 130);
        const T2 = V.whiteTower(pb, x, base - 10, tw, th, x, { k, lit: 0.6 }); nearFx.beacons.push(T2.beacon);
        x += tw + r.int(24, 40);
      } else {
        // planta de agua ultrapura: columnas de intercambio y filtros en cian
        for (let i = 0; i < 3; i++) V.cylV(pb, x + 8 + i * 16, base - 10, 6, r.int(36, 46), K.WHT, { k, dome: 0.6, bands: [[8, 3, K.CYAN], [24, 3, K.CYAN]] });
        const p = [[x, base - 22], [x + 56, base - 22]]; V.pipe(pb, p, 1, K.CYAN, { k, flange: 12 }); nearFx.flows.push(p);
        nearFx.glows.push([x + 24, base - 32, 12, '#22c1e7']);
        x += 60 + r.int(26, 40);
      }
    }
    V.rim(pb, U('#ffb890'), 0.5, -1, 0); V.rim(pb, U('#ffd0b0'), 0.35, 0, -1);
    // tubería colectora de H₂ a lo largo de la losa
    const P = [[0, base - 14], [w - 1, base - 14]]; V.pipe(pb, P, 2, K.H2G, { k, flange: 24 }); nearFx.flowsG = [P];
  }, {
    tag: 'near', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      for (const [x, y] of nearFx.halos) if (x + ox > -100 && x + ox < W + 100) V.drawSoftGlow(g, x + ox, y + oy, 84, '#2ec878', 0.42 + 0.08 * Math.sin(t * 0.8 + x));
      for (const [x, y, rr, c] of nearFx.glows) if (x + ox > -40 && x + ox < W + 40) V.drawGlow(g, x + ox, y + oy, rr, c, 0.38 + 0.14 * Math.sin(t * 1.5 + x));
      for (const [x, y, rr] of nearFx.rings) if (x + ox > -20 && x + ox < W + 20) V.drawGlow(g, x + ox, y + oy, rr + 4, '#5ee69a', 0.4 + 0.15 * Math.sin(t * 2.2 + x));
      for (const [x, y] of nearFx.cells) if (x + ox > -6 && x + ox < W + 6) V.drawBubbles(g, x + ox - 2, y + oy + 6, 4, 12, t + x, { n: 3, col: '#e0fff2' });
      for (const p of nearFx.flows) V.drawFlowC(g, p, ox, oy, t, { col: '#e8feff', speed: 18, gap: 7 });
      for (const p of nearFx.flowsG || []) V.drawFlowC(g, p, ox, oy, t, { col: '#d8ffe8', speed: 14, gap: 10 });
      for (let i = 0; i < nearFx.beacons.length; i++) { const [x, y] = nearFx.beacons[i]; if ((Math.floor(t * 1.1 + i * 0.41) % 2) === 0 && x + ox > -4 && x + ox < W + 4) { g.fillStyle = '#ff5848'; g.fillRect(x + ox, y + oy, 1, 1); V.drawGlow(g, x + ox, y + oy, 4, '#ff4030', 0.55); } }
      V.drawMotes(g, 12, t, 23, { y0: 120, y1: 280, col: '#c8f8ff' });
    },
  });
  function drawTurbines(g, cam, Ly, list) {
    const [ox, oy] = B.vofs(Ly, cam), t = T();
    for (const tb of list) {
      const x = tb.x + ox, y = tb.y + oy;
      if (x < -30 || x > W + 30) continue;
      if (!tb.rot) tb.rot = V.rotor(tb.R, { k: tb.k });
      V.drawRotor(g, tb.rot, x, y, t * tb.sp + tb.ph);
    }
  }
  for (const Lb of labels) Lb.when = (sc) => !V.labelClash(Lb, sc);
  BIOME_LABELS.citadel = labels;
  B.vistaInfo = { planes: B.layers.length, ms: Object.assign({}, V.stats.ms) };
  return B;
}

BIOME_LABELS.citadel = BIOME_LABELS.citadel || [];
