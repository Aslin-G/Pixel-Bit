/* =====================================================================
   1e_bio_vault.js — BIOMA BÓVEDA (Nivel 06 «La Bóveda de Carga»), interior
   con el kit VISTA. Sustituye a BIOMES.vault de 16_biomes.js.
   r3-int-b: la bóveda está excavada en la ladera que mira al valle. Un
   muro de sillería cálida con ventanales en arco (hiedra, jardineras con
   geranios y helechos en los alféizares, carpintería de acero) deja ver
   el exterior a pleno sol en varios planos: cielo de tarde dorada con
   cúmulos (0), cordillera ocre con sombras violeta (0,12), lomas verdes
   con bancales, casas blancas y aerogeneradores (0,3) y el pueblo de
   azoteas verdes con palmeras y gaviotas (0,4). Delante del muro, una
   galería trasera de maquinaria (contenedores BESS, transformadores,
   bastidores, climatización con ventiladores, jardineras interiores,
   pasarela y haz de tuberías con código de color) a 0,7 con bruma
   azul-lavanda. La luz del sol entra por los ventanales (haces de
   R2LIGHT_CFG[6].shafts en la capa 'wall').
   El nivel publica B.vault = {soc, charging, blackout} desde skyFx: en el
   apagón se apagan LED, tiras y lámparas; quedan las balizas rojas.
   Planos: cielo (0) · nubes · cordillera (0,12) · lomas (0,3) · pueblo
   (0,4) · muro de ventanales (0,55) · galería de maquinaria (0,7)
   ===================================================================== */
var BIOME_LABELS = (typeof BIOME_LABELS !== 'undefined') ? BIOME_LABELS : {};

/** Geometría de los ventanales del muro (capa 'wall', f = 0,55): la usa R2LIGHT_CFG[6].shafts */
const R3INTB_VWIN = { x0: 58, step: 176, w: 116, top: 28, bot: 226 };

BIOMES.vault = function (L) {
  const V = VISTA, I = V.INT;
  const B = new Backdrop(L.width, L.height);
  const T = () => Game.time;
  const st = () => B.vault || { soc: 0.5, charging: 0, blackout: false };
  /** plano cuya parte superior queda en ys de pantalla con cam.y = 0 (cámara de la bóveda) */
  const P = (f, ys, h, draw, opts) => B.vplane(f, ys - Math.round(V.CAMY * f * 0.3), h, draw, opts);
  const HZ = 168;
  const SUN = { x: 150, y: 46, r: 11, halo: 26 };
  B.horizon = HZ; B.sun = SUN;
  B.weather.wind = 0.2;
  B.vault = null;
  const LEAF = ['#0c1a0a', '#16300f', '#244a16', '#356420', '#4c7e26', '#6c9a2c', '#92b83a', '#bcd450'];
  /* ---------------- cielo de tarde dorada (0) ---------------- */
  B.sky = V.timed('sky', () => {
    const pb = V.sky(W, H, {
      horizonY: HZ, sun: SUN, curve: 1.15,
      stops: ['#1262d4', '#1a70de', '#2480e8', '#3290ee', '#44a0f2', '#5eb0f2', '#84bfee', '#a8cae8', '#cad0e0', '#e6d2cc'],
      haze: ['#f2d0b8', '#f8d4ac', '#fcdaa8', '#ffe2b4'],
    });
    V.rays(pb, SUN.x, SUN.y, { n: 6, len: 240, col: '#fff2d0', a: 0.08, spread: 1.6, ang: Math.PI / 2 + 0.3, w: 0.04, seed: 6, yMax: HZ });
    return pb.toCanvas();
  });
  B.vdyn(0, (g) => V.drawBloom(g, SUN.x, SUN.y, 40, '#fff0c0', 0.22, T()), { tag: 'bloom' });
  B.cloudDeck({ kind: 'cirrus', n: 5, seed: 603, f: [0.01, 0.03], y: [12, 60], w: [70, 150], speed: [1, 2] });
  B.cloudDeck({ n: 8, seed: 605, f: [0.03, 0.08], y: [24, 104], w: [50, 124], bias: 0.6, speed: [2, 3.5], sunX: SUN.x });
  /* ---------------- cordillera ocre con sombras violeta (0,12) ---------------- */
  P(0.12, HZ - 64, 66, (pb, w, h) => {
    const r = RNG(607), peaks = [];
    for (let x = 30; x < w + 60;) { const ww = r.int(60, 130); peaks.push({ x: x + ww * 0.5, v: r.int(14, 28), h: r.int(26, 60), w: ww, d: r.int(16, 26) }); x += r.int(46, 104); }
    V.relief(pb, {
      yBase: h - 1, nv: 36, dvy: 0.3, seed: 609, hMax: 62,
      H: V.massif(peaks, { seed: 609, rough: 0.55, scale: 0.05, apron: 4, spurs: 7, spurW: 0.4 }),
      ramp: ['#4e3c6c', '#6a5288', '#8e7daa', '#a0707a', '#b4603a', '#a24a1f', '#c86a30', '#de8c44', '#eeac5a', '#fbc371', '#ffe0a8'], contrast: 2.1, t0: 0.5, facet: 0.3,
      haze: { col: '#c8b4cc', k0: 0.08, k: 0.14 }, mist: { col: '#e8ccc4', h: 12, k: 0.45 }, rim: '#ffe4b8', rimK: 0.7, tex: 0.05,
    });
  }, { tag: 'ridge' });
  /* ---------------- lomas verdes: bancales, casas blancas y eólica (0,3) ---------------- */
  const hillFx = { turb: [], fauna: [] };
  P(0.3, 112, 100, (pb, w, h) => {
    const r = RNG(621), k = 0.1, peaks = [];
    for (let x = 60; x < w + 80;) { const ww = r.int(120, 220); peaks.push({ x, v: r.int(10, 16), h: r.int(40, 76), w: ww, d: r.int(18, 24), k: r.range(0.8, 1.1) }); x += r.int(110, 200); }
    const info = V.relief(pb, {
      yBase: h - 1, nv: 34, dvy: 0.3, seed: 623, hMax: 80,
      H: V.massif(peaks, { seed: 623, rough: 0.45, scale: 0.05, apron: 4, spurs: 6, spurW: 0.4 }),
      ramp: V.RAMPS.hill, contrast: 2.0, t0: 0.55, facet: 0.3, cav: 0.1,
      haze: { col: '#b8acd0', k0: 0.04, k: 0.08 }, mist: { col: '#d8c8d4', h: 14, k: 0.3 }, rim: '#fcd8ae', tex: 0.06,
      veg: { ramp: V.RAMPS.vegHill, density: 0.24, maxSlope: 1.2, minY: 14, size: 3 },
    });
    // bancales de cultivo en los flancos
    for (let x0 = 120; x0 < w - 160; x0 += r.int(300, 420)) V.carveTerraces(pb, info, { x0, x1: x0 + r.int(100, 150), yTop: 36, yBot: h - 8, stepH: [7, 10], wallK: 0.4, k, seed: 625 + x0, kinds: ['rows', 'vine', 'orchard', 'rows'], falls: [] });
    V.scatterVeg(pb, (x) => info.top[x] + 1, 0, w, 627, { k, gap: 8, mix: { tree: 3, shrub: 3, palm: 2 }, ramp: V.RAMPS.vegHill });
    for (let i = 0; i < Math.round(w / 22); i++) {
      const x = r.int(10, w - 10), y = info.onSurf(x, r.int(4, 16)); if (y == null || y < 24 || y > h - 6) continue;
      V.house(pb, x, y + 1, r.int(6, 10), r.int(4, 7), 6290 + i, { k: k + 0.02 });
    }
    // aerogeneradores en las crestas
    for (let x = 70; x < w - 20; x += r.int(130, 230)) {
      let bx = x; for (let q = -14; q <= 14; q++) if (info.top[x + q] < info.top[bx]) bx = x + q;
      const hub = V.turbineTower(pb, bx, info.top[bx] + 2, r.int(34, 44), { k: 0.14 });
      hillFx.turb.push({ x: hub.hx, y: hub.hy, R: r.int(13, 16), k: 0.14, sp: 1.8 + (bx % 5) * 0.25, ph: bx * 0.37 });
    }
    for (let x = 90; x < w; x += r.int(160, 260)) hillFx.fauna.push({ kind: 'gull', x, y: r.int(-30, 6), r: r.int(120, 220), sp: r.pick([6, 8, -7]) });
    hillFx.fauna.push({ kind: 'eagle', x: 300, y: -40, r: 90 }, { kind: 'eagle', x: 860, y: -52, r: 110 });
  }, {
    tag: 'hill', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      for (const tb of hillFx.turb) { const x = tb.x + ox; if (x < -24 || x > W + 24) continue; if (!tb.rot) tb.rot = V.rotor(tb.R, { k: tb.k }); V.drawRotor(g, tb.rot, x, tb.y + oy, t * tb.sp + tb.ph); }
      V.drawFauna(g, hillFx.fauna, ox, oy, t);
    },
  });
  /* ---------------- pueblo de azoteas verdes con palmeras (0,4) ---------------- */
  const townFx = { flags: [], fauna: [] };
  P(0.4, 150, 80, (pb, w, h) => {
    const r = RNG(631), k = 0.04, yB = h - 4;
    const GR = V.P32(V.hz(['#2a3a0c', '#3b5312', '#597611', '#7b981a', '#9cb42c'], k));
    for (let x = 0; x < w; x++) for (let y = yB; y < h; y++) V.put(pb, x, y, GR[1 + (hash2(x >> 1, y >> 1, 9) < 0.4 ? 1 : 0)]);
    const town = V.hillTown(pb, {
      x0: -8, x1: w + 8, seed: 633, k,
      rows: [
        { y: (x) => yB - 12 + Math.round(Math.sin(x * 0.013) * 4), w: [14, 22], h: [10, 15], gap: [-3, 10], hole: 0.2, veg: 0.8, vegGap: [8, 20], roofs: ['terrace', 'flat', 'dome', 'solar', 'terrace', 'tiles'], scale: 1.1, flowers: 0.5 },
        { y: (x) => yB, w: [18, 28], h: [12, 18], gap: [2, 18], hole: 0.3, veg: 0.9, vegGap: [8, 18], roofs: ['terrace', 'flat', 'terrace', 'solar', 'tiles'], scale: 1.3, s: 2, flowers: 0.6 },
      ],
    });
    // azoteas verdes (sedum y huerto) sobre la mitad de las casas
    const SED = V.P32(V.hz(['#2e4a14', '#46661c', '#62841e', '#86a42a', '#a8c038'], k)), FLW = [U('#ff5a8a'), U('#ffd84a'), U('#ff9a3a'), U('#e8f0ff')];
    for (const hs of town.houses) {
      if (hash2(hs.x, 3, 637) > 0.55) continue;
      const y0 = hs.top, x0 = hs.x + 1, x1 = hs.x + hs.w + Math.round((hs.dx || 0) * 0.6) - 1;
      for (let x = x0; x < x1; x++) for (let q = 0; q < 3; q++) { const y = y0 - q + (q === 2 && hash2(x, y0, 5) < 0.5 ? 1 : 0); V.put(pb, x, y, SED[clamp(4 - q - (hash2(x, q, 638) < 0.35 ? 1 : 0), 0, 4)]); }
      for (let x = x0 + 1; x < x1 - 1; x += 3) if (hash2(x, y0, 639) < 0.5) V.put(pb, x, y0 - 2, FLW[(x >> 1) & 3]);
    }
    for (const [x, y] of town.tops) if (hash2(x, y, 7) < 0.07) { const PL = U(V.hzc('#e8e4de', k)); for (let q = 0; q < 9; q++) V.put(pb, x, y - q, PL); townFx.flags.push({ x, y: y - 9, col: ['#e83b41', '#11bedd', '#f5dc5a', '#3fe0a0', '#8d6bff'][(x >> 3) % 5] }); }
    // palmeras y buganvillas delante del pueblo (asoman por la parte baja de los ventanales)
    for (let x = r.int(0, 30); x < w; x += r.int(30, 64)) V.palm(pb, x, h - 1, r.int(26, 40), r.range(-6, 6), 6400 + x, { k: 0 });
    const BG = V.P32(RAMP.bougainR);
    for (let x = 0; x < w; x += r.int(8, 16)) { V.shrub(pb, x, h - 1, r.int(3, 5), 6500 + x, { k: 0, ramp: V.RAMPS.vegLow }); for (let q = 0; q < 5; q++) V.put(pb, x + r.int(-3, 3), h - 1 - r.int(1, 6), r.chance(0.7) ? BG[r.int(0, BG.length - 1)] : U('#ffd84a')); }
    for (let x = 60; x < w; x += r.int(140, 240)) townFx.fauna.push({ kind: 'gull', x, y: r.int(-24, 8), r: r.int(80, 160), sp: r.pick([7, -8, 9]) });
  }, {
    tag: 'town', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T();
      V.drawFlags(g, townFx.flags, ox, oy, t);
      V.drawFauna(g, townFx.fauna, ox, oy, t);
    },
  });
  /* ---------------- muro de sillería con ventanales en arco (0,55) ---------------- */
  const wallFx = { strips: [], lamps: [], bugs: [], sills: [] };
  const WN = R3INTB_VWIN;
  P(0.55, 0, 300, (pb, w, h) => {
    const r = RNG(641);
    // sillería: piedra arenisca cálida (sombra violeta arriba, bajo el techo)
    const ST = V.P32(['#24182a', '#342236', '#4a2e3c', '#663e44', '#82524c', '#9c6a56', '#b48262', '#c89a72', '#dab486', '#eacc9e', '#f6e0b8']);
    const nS = ST.length;
    for (let y = 0; y < h; y++) {
      const course = Math.floor(y / 10), cy = y % 10, off = (course & 1) ? 13 : 0;
      for (let x = 0; x < w; x++) {
        const bl = Math.floor((x + off) / 26), cx = (x + off) % 26;
        let t = 0.6 + (hash2(bl, course, 611) - 0.5) * 0.18 + (hash2(x >> 1, y >> 1, 613) - 0.5) * 0.12;
        t -= y < 70 ? (70 - y) / 70 * 0.34 : 0;
        if (y > WN.bot) t -= 0.1 + (y - WN.bot) / 200;
        if (cy === 0 || cx === 0) t = 0.2 + (y < 70 ? -0.06 : 0);
        else if (cy === 1 || cx === 1) t += 0.1;
        else if (cy === 9 || cx === 25) t -= 0.08;
        pb.data[y * w + x] = ST[clamp(Math.floor(t * nS), 0, nS - 1)];
      }
    }
    const pierC = (i) => WN.x0 + WN.w + (WN.step - WN.w) / 2 + i * WN.step;
    // pilastras entre ventanales (luz por la izquierda) con capitel en la línea de imposta
    const spring = WN.top + WN.w / 2;
    for (let i = -1; WN.x0 + i * WN.step < w; i++) {
      const pc = Math.round(pierC(i)), pw = 22;
      for (let y = 18; y < h; y++) for (let q = 0; q < pw; q++) {
        const x = pc - pw / 2 + q; if (x < 0 || x >= w) continue;
        const cy = y % 14;
        let t = 0.66 + (hash2(x >> 1, y >> 1, 615) - 0.5) * 0.1 - (y < 70 ? (70 - y) / 70 * 0.3 : 0) - (y > WN.bot ? 0.12 : 0);
        if (q < 2) t += 0.18; else if (q > pw - 4) t -= 0.22; else if (q > pw - 7) t -= 0.1;
        if (cy === 0) t = 0.24;
        pb.data[y * w + x] = ST[clamp(Math.floor(t * nS), 0, nS - 1)];
      }
      for (let q = -4; q < pw + 4; q++) { const x = pc - pw / 2 + q; for (let k = 0; k < 6; k++) V.put(pb, x, spring - 6 + k, ST[[9, 10, 7, 5, 3, 2][k] - (q > pw ? 2 : 0)]); }
      // basa
      for (let q = -3; q < pw + 3; q++) { const x = pc - pw / 2 + q; for (let k = 0; k < 5; k++) V.put(pb, x, WN.bot + 34 + k, ST[[8, 6, 5, 4, 2][k] - (q > pw ? 1 : 0)]); }
    }
    // techo: bóveda en sombra, viga de acero, bandeja de cables y tira de luz
    const GR = V.P32(I.GRAPH);
    for (let y = 0; y < 14; y++) for (let x = 0; x < w; x++) pb.data[y * w + x] = V.mixU(pb.data[y * w + x], U('#141030'), 0.55 - y * 0.025);
    for (let x = 0; x < w; x++) { const rv = (x % 18) === 4; V.put(pb, x, 14, GR[7]); V.put(pb, x, 15, GR[5]); for (let y = 16; y < 21; y++) V.put(pb, x, y, GR[rv && y === 18 ? 6 : (y < 18 ? 3 : 2)]); V.put(pb, x, 21, GR[1]); }
    V.cableTray(pb, 0, w - 1, 6, { hang: 6, cols: ['#c8861a', '#2c63c0', '#3a3a4a', '#8d2a3a'] });
    wallFx.strips.push(V.lightStrip(pb, 0, w - 1, 23, '#ffd890'));
    // lámparas colgantes cálidas sobre las pilastras
    for (let i = 0; WN.x0 + i * WN.step < w + WN.step; i++) {
      const pc = Math.round(pierC(i) - WN.step / 2 + WN.step / 2);
      if (pc < 0 || pc >= w) continue;
      for (let y = 22; y < 34; y++) V.put(pb, pc, y, GR[2]);
      for (let q = -4; q <= 4; q++) { V.put(pb, pc + q, 34, GR[5]); V.put(pb, pc + q, 35, GR[3]); }
      for (let q = -3; q <= 3; q++) V.put(pb, pc + q, 36, U('#ffe8b0'));
      wallFx.lamps.push([pc, 37]);
    }
    // ventanales
    const FR = ['#3a2a3a', '#5a3e48', '#7c5654', '#9c6e5e', '#bc8a6c', '#d6a87e', '#ecc698', '#fae0b4'];
    const SASH = [U('#1c1828'), U('#3a3248'), U('#6c5e7a'), U('#a89ab4')];
    for (let i = 0; WN.x0 + i * WN.step < w; i++) {
      const x0 = WN.x0 + i * WN.step, cx = x0 + WN.w / 2, hw = WN.w / 2;
      V.carveArch(pb, cx, WN.top, WN.w, WN.bot - WN.top, { frame: FR, th: 7 });
      // derrames (grosor del muro): el derecho recibe el sol, el izquierdo en sombra; intradós en sombra
      const sp = WN.top + hw;
      for (let y = WN.top + 2; y < WN.bot; y++) for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) {
        if (V.get(pb, x, y) >>> 24) continue;
        const dx = x + 0.5 - cx;
        let dIn;
        if (y < sp) dIn = hw - Math.hypot(dx, sp - y - 0.5); else dIn = hw - Math.abs(dx);
        if (dIn > 6) continue;
        let u;
        if (y < sp - hw * 0.35) u = ST[dIn < 2 ? 3 : 2];
        else if (dx > 0) u = ST[dIn < 1.5 ? 10 : dIn < 3.5 ? 9 : 8];
        else u = ST[dIn < 1.5 ? 4 : 3];
        pb.data[y * w + x] = u;
      }
      // carpintería de acero: montantes, travesaños, junquillo del arco
      const ix0 = Math.round(cx - hw + 6), ix1 = Math.round(cx + hw - 6);
      const inside = (x, y) => { const dx = x + 0.5 - cx; return y < sp ? Math.hypot(dx, sp - y - 0.5) < hw - 6 : (x >= ix0 && x < ix1); };
      for (const mx of [cx - 28, cx, cx + 28]) for (let y = WN.top + 6; y < WN.bot - 1; y++) { const xx = Math.round(mx); if (!inside(xx, y)) continue; V.put(pb, xx - 1, y, SASH[1]); V.put(pb, xx, y, SASH[0]); V.put(pb, xx + 1, y, SASH[2]); }
      for (const ty of [sp, Math.round(sp + (WN.bot - sp) * 0.48)]) for (let x = ix0; x < ix1; x++) { if (!inside(x, ty)) continue; V.put(pb, x, ty - 1, SASH[2]); V.put(pb, x, ty, SASH[0]); V.put(pb, x, ty + 1, SASH[1]); }
      for (let a = 0; a <= 180; a += 0.6) { const rr = hw - 6.5, x = Math.round(cx + Math.cos(a * Math.PI / 180) * rr - 0.5), y = Math.round(sp - Math.sin(a * Math.PI / 180) * rr - 0.5); V.put(pb, x, y, SASH[1]); V.put(pb, x, y + 1, SASH[0]); }
      // vidrio: velo tenue y reflejos diagonales en algunos paños (alfa horneado, sin tramado)
      for (let y = WN.top + 7; y < WN.bot - 1; y++) for (let x = ix0; x < ix1; x++) {
        if (!inside(x, y) || (V.get(pb, x, y) >>> 24)) continue;
        const g = ((x - y * 0.6 + i * 37) % 53 + 53) % 53;
        if (g < 2) V.blend(pb, x, y, U('#ffffff'), 0.22); else if (g < 5) V.blend(pb, x, y, U('#e8f4ff'), 0.1);
        else if (y < sp) V.blend(pb, x, y, U('#d8ecff'), 0.05);
      }
      // alféizar saliente con sombra
      for (let x = Math.round(cx - hw - 8); x < Math.round(cx + hw + 8); x++) {
        V.put(pb, x, WN.bot - 1, ST[10]); V.put(pb, x, WN.bot, ST[9]); V.put(pb, x, WN.bot + 1, ST[7]); V.put(pb, x, WN.bot + 2, ST[6]); V.put(pb, x, WN.bot + 3, ST[3]);
        for (let k = 4; k < 8; k++) { const c = V.get(pb, x, WN.bot + k); if (c >>> 24) V.put(pb, x, WN.bot + k, V.shU(c, -0.3 + k * 0.04, 260)); }
      }
      // jardinera de terracota en el alféizar, con geranios, helechos y hiedra que cuelga
      const TC = V.P32(['#3a160e', '#5c2414', '#80341c', '#a44a26', '#c46634', '#da8448', '#eca266']);
      const jx0 = Math.round(cx - 34 + (i % 2) * 6), jx1 = jx0 + 56, jy = WN.bot - 1;
      for (let x = jx0; x < jx1; x++) for (let y = jy - 8; y < jy; y++) { const q = (x - jx0) / (jx1 - jx0); V.put(pb, x, y, TC[y === jy - 8 ? 6 : y === jy - 7 ? 5 : q < 0.12 ? 4 : q > 0.85 ? 1 : (y > jy - 3 ? 2 : 3)]); }
      for (let x = jx0 + 2; x < jx1 - 2; x += r.int(5, 8)) V.shrub(pb, x, jy - 7, r.int(3, 5), 6600 + x, { ramp: LEAF });
      const FL = [U('#ff3a5a'), U('#ff6aa8'), U('#ffd84a'), U('#ff8a3a'), U('#ffffff')];
      for (let n = 0; n < 22; n++) { const x = r.int(jx0 + 2, jx1 - 3), y = jy - 9 - r.int(0, 6); if (V.get(pb, x, y) >>> 24) { V.put(pb, x, y, FL[(i + n) % 5 === 4 ? 4 : (i + (n >> 2)) % 4]); if (r.chance(0.4)) V.put(pb, x + 1, y, FL[(i + (n >> 2)) % 4]); } }
      R3INTB_ivy(pb, jx0 + 4 + r.int(0, 10), jy - 2, r.int(16, 30), 6700 + i, LEAF, 1);
      if (r.chance(0.6)) R3INTB_ivy(pb, jx1 - 6 - r.int(0, 10), jy - 2, r.int(10, 22), 6750 + i, LEAF, 1);
      wallFx.bugs.push([cx - 10 + r.int(0, 20), jy - 16, i]);
      wallFx.sills.push([cx, jy - 8]);
      // hiedra que cuelga sobre la clave del arco y trepa por la pilastra
      if (i % 3 !== 1) R3INTB_ivy(pb, Math.round(cx - hw - 6 + r.int(0, 8)), WN.top - 2, r.int(26, 60), 6800 + i, LEAF, 1);
      if (i % 2 === 0) R3INTB_ivy(pb, Math.round(cx + hw + 10 + r.int(0, 6)), 300, r.int(80, 150), 6900 + i, LEAF, -1);
    }
    // zócalo: tira de luz ámbar, conducto y rótulos de sector bajo los alféizares (lejos de la franja del HUD)
    wallFx.strips.push(V.lightStrip(pb, 0, w - 1, WN.bot + 26, '#56e5ff'));
    V.pipe(pb, [[0, WN.bot + 44], [w - 1, WN.bot + 44]], 2, ['#3a1a0a', '#7a3a10', '#c8661a', '#f09030', '#ffc070'], { flange: 44 });
    for (let i = 0, s = 0; WN.x0 + i * WN.step < w; i++) {
      if (i % 2) continue;
      const pc = Math.round(pierC(i)), lab = 'SECTOR ' + 'ABCDEFGH'[(s++) % 8], tw = V.measure(lab, { font: 'tiny', bold: true });
      V.rect(pb, pc - tw / 2 - 3, WN.bot + 10, tw + 6, 10, U('#0a1440')); V.rect(pb, pc - tw / 2 - 3, WN.bot + 10, tw + 6, 1, U('#56e5ff'));
      V.text(pb, lab, pc - Math.round(tw / 2), WN.bot + 12, U('#8fdfff'), { font: 'tiny', bold: true });
    }
  }, {
    tag: 'wall', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T(), S = st();
      if (S.blackout) { for (const [x, y] of wallFx.lamps) if ((Math.floor(t * 2) % 2) === 0 && x + ox > -10 && x + ox < W + 10) V.drawGlow(g, x + ox, y + oy, 5, '#ff4030', 0.7); }
      else {
        V.drawStrips(g, wallFx.strips, ox, oy, t, { col: '#fff8e0', speed: 70 });
        for (let i = 0; i < wallFx.lamps.length; i++) { const [x, y] = wallFx.lamps[i]; if (x + ox < -30 || x + ox > W + 30) continue; const fl = 0.9 + 0.1 * Math.sin(t * 13 + i * 2.1) * (i % 3 === 1 ? 1 : 0.2); V.drawGlow(g, x + ox, y + oy, 16, '#ffb860', 0.34 * fl); V.drawGlow(g, x + ox, y + oy, 5, '#fff2d0', 0.7 * fl); }
      }
      // mariposas e insectos sobre las jardineras (1–2 px)
      for (const [x, y, i] of wallFx.bugs) {
        const sx = x + ox; if (sx < -20 || sx > W + 20) continue;
        const u = t * 0.7 + i * 1.7, bx = sx + Math.sin(u) * 12 + Math.sin(u * 2.3) * 4, by = y + oy + Math.sin(u * 1.6) * 5 - Math.abs(Math.sin(u * 0.5)) * 6;
        const fl = Math.floor(t * 9 + i) % 2;
        g.fillStyle = ['#ffd84a', '#ff8ad0', '#ffffff', '#ffa040'][i % 4];
        g.fillRect(Math.round(bx), Math.round(by), fl ? 2 : 1, 1); if (fl) g.fillRect(Math.round(bx), Math.round(by) - 1, 1, 1);
      }
    },
  });
  /* ---------------- galería trasera de maquinaria (0,7) ---------------- */
  const galFx = { fans: [], leds: [], steam: [], lamps: [], flows: [], beacons: [], screens: [] };
  P(0.7, 96, 204, (pb, w, h) => {
    const r = RNG(651), k = 0.24, HZC = '#8a88c8', base = 176;
    const hzR = (R, kk = k) => V.hz(R, kk, HZC);
    const G = V.P32(hzR(I.GRAPH)), C = V.P32(hzR(I.CONCI));
    const CONT = hzR(['#10162a', '#18203a', '#222c4c', '#2e3a5e', '#3c4a72', '#4e5e88', '#64769e', '#8094b6', '#a4b4cc', '#d0dae6']);
    const WARM = hzR(['#2a1a10', '#4a2a14', '#7a4418', '#b0661c', '#e08e24', '#f8b840', '#ffd878'], 0.12);
    // haz de tuberías con código de color al fondo (cian agua de refrigeración, violeta salmuera, naranja potencia)
    const PIPES = [[base - 70, 2, ['#06202e', '#0a4a66', '#1a86a8', '#48c4e0', '#a8f0ff']], [base - 62, 2, ['#1c0e2e', '#3a1a5a', '#6a3a9a', '#9a6ad0', '#d0b0ff']], [base - 55, 1, ['#2a1206', '#6a3010', '#c0601a', '#f09030', '#ffd090']]];
    for (const [y, rr, rp] of PIPES) { V.pipe(pb, [[0, y], [w - 1, y]], rr, hzR(rp, 0.12), { flange: 36 }); }
    for (let x = 10; x < w; x += 72) for (let y = base - 76; y < base; y++) { V.put(pb, x, y, G[4]); V.put(pb, x + 1, y, G[2]); }
    galFx.flows.push([[[0, base - 70], [w - 1, base - 70]], '#c8f8ff'], [[[w - 1, base - 55], [0, base - 55]], '#ffe0a0']);
    // cubierta de la galería: chapa estriada con canto amarillo
    for (let y = base; y < h; y++) for (let x = 0; x < w; x++) {
      const v = y - base;
      let u = v < 2 ? (((x >> 2) + (v ? 1 : 0)) % 2 ? U('#e8b830') : U('#1a1a22')) : C[clamp(4 - (v > 8 ? 1 : 0) - (v > 18 ? 1 : 0) + (((x + v * 2) % 9) === 0 ? 1 : 0), 0, 7)];
      if (v === 2) u = G[6];
      pb.data[y * w + x] = u;
    }
    // pasarela superior por tramos (rejilla con barandilla amarilla y pies)
    const YL = V.P32(hzR(['#5a3a0a', '#9a6a10', '#d8a020', '#f8d040'], 0.1));
    for (let x0 = r.int(20, 120); x0 < w - 120; x0 += r.int(380, 560)) {
      const x1 = x0 + r.int(180, 280), cy = base - 112;
      for (let x = x0; x < x1; x++) {
        for (let q = 0; q < 4; q++) V.put(pb, x, cy + q, G[q === 0 ? 6 : q === 3 ? 1 : ((x + q) % 3 ? 3 : 2)]);
        V.put(pb, x, cy - 10, YL[3]); V.put(pb, x, cy - 9, YL[1]); V.put(pb, x, cy - 5, YL[2]);
        if ((x - x0) % 24 === 0) for (let y = cy - 10; y < cy; y++) V.put(pb, x, y, YL[y === cy - 10 ? 3 : 1]);
      }
      for (const px of [x0 + 6, x1 - 8]) for (let y = cy + 4; y < base; y++) { V.put(pb, px, y, G[4]); V.put(pb, px + 1, y, G[2]); V.put(pb, px + 2, y, G[1]); }
      galFx.lamps.push([x0 + Math.round((x1 - x0) / 2), cy + 5, 'warm']);
    }
    // módulos sobre la cubierta
    const seq = ['container', 'racks', 'plants', 'xfmr', 'hvac', 'container', 'cart', 'racks', 'plants', 'xfmr', 'hvac', 'container', 'plants', 'racks'];
    let x = r.int(4, 30), si = 0;
    while (x < w - 30) {
      const kind = seq[si++ % seq.length];
      if (kind === 'container') {
        const cw = r.int(86, 112), ch = r.int(50, 62);
        V.box3q(pb, x, base, cw, ch, 14, { ramp: CONT, front: 5, side: 3, top: 8 });
        // puertas con nervios, rejillas, etiqueta y tira de estado
        for (let xx = x + 2; xx < x + cw - 1; xx++) { if ((xx - x) % 4 === 0) for (let y = base - ch + 4; y < base - 2; y++) V.put(pb, xx, y, V.P32(CONT)[4]); }
        for (let d = 1; d < 3; d++) { const dx = x + Math.round(cw * d / 3); for (let y = base - ch + 2; y < base - 1; y++) { V.put(pb, dx, y, V.P32(CONT)[1]); V.put(pb, dx + 1, y, V.P32(CONT)[7]); } }
        for (let y = base - ch + 8; y < base - ch + 18; y += 2) for (let xx = x + 6; xx < x + 20; xx++) V.put(pb, xx, y, V.P32(CONT)[2]);
        V.rect(pb, x + cw - 18, base - ch + 8, 9, 8, U(V.hzc('#f0c020', 0.1))); V.put(pb, x + cw - 14, base - ch + 10, U('#1a1a22')); V.put(pb, x + cw - 14, base - ch + 12, U('#1a1a22'));
        const lab = 'BESS ' + String(r.int(10, 48)); V.text(pb, lab, x + 24, base - ch + 9, U(V.hzc('#d8e4f4', 0.1)), { font: 'tiny', bold: true });
        for (let q = 0; q < Math.floor((cw - 8) / 6); q++) galFx.leds.push([x + 4 + q * 6, base - 8, q]);
        galFx.beacons.push([x + cw - 4, base - ch - 3]);
        x += cw + r.int(22, 54);
      } else if (kind === 'racks') {
        const n = r.int(3, 4);
        for (let i = 0; i < n; i++) { const R = V.bessRack(pb, x, base, 22, r.int(66, 88), 9, { k, accent: r.pick(['#2c63c0', '#8d6bff', '#3fe0a0']) }); for (const l of R.leds) if (hash2(l[0], l[1], 3) < 0.6) galFx.leds.push([l[0], l[1], i + 7]); x += 25; }
        x += r.int(20, 50);
      } else if (kind === 'xfmr') {
        const tw = r.int(40, 50), th = r.int(34, 40);
        V.box3q(pb, x, base, tw, th, 12, { ramp: hzR(V.TECH.STEEL), front: 6, side: 4, top: 8 });
        const SR = V.P32(hzR(V.TECH.STEEL));
        for (const side of [x - 6, x + tw]) for (let q = 0; q < 6; q++) for (let y = base - th + 6; y < base - 2; y++) V.put(pb, side + q, y, SR[q % 2 ? 2 : 5]);
        for (let b = 0; b < 3; b++) { const bx = x + 8 + b * Math.round((tw - 16) / 2); for (let y = base - th - 12; y < base - th; y++) { V.put(pb, bx, y, U(V.hzc(y % 3 ? '#e8e0d0' : '#a07850', 0.12))); V.put(pb, bx + 1, y, U(V.hzc(y % 3 ? '#b0a090' : '#6a4a30', 0.12))); } }
        V.rect(pb, x + 4, base - th + 8, 10, 9, U(V.hzc('#ffd030', 0.08))); for (let q = 0; q < 4; q++) V.put(pb, x + 8, base - th + 10 + q, U('#1a1a1a'));
        galFx.screens.push([x + tw - 14, base - th + 10, 8, 4]);
        x += tw + 14 + r.int(16, 40);
      } else if (kind === 'hvac') {
        const hv = V.hvac(pb, x, base, 46, 26, { k });
        galFx.fans.push([x + Math.round(46 * 0.28), base - 13, 5], [x + Math.round(46 * 0.72), base - 13, 5]);
        galFx.steam.push(hv.vent);
        x += 58 + r.int(16, 40);
      } else if (kind === 'plants') {
        // jardinera interior: macetones con palmito, helechos y monstera bajo luz cálida
        const n = r.int(2, 3);
        for (let i = 0; i < n; i++) {
          const px = x + 10 + i * 22, ph = r.int(9, 13);
          for (let y = base - ph; y < base; y++) for (let q = -7; q <= 7; q++) { const e = Math.abs(q) > 6 - Math.floor((y - (base - ph)) / 5); if (e) continue; V.put(pb, px + q, y, U(V.hzc(['#5a2a18', '#8a4424', '#b4623a', '#d48450'][q < -4 ? 3 : q > 3 ? 0 : y === base - ph ? 3 : 2], 0.1))); }
          if (i === 1 || r.chance(0.4)) V.palm(pb, px, base - ph, r.int(22, 34), r.range(-3, 3), 6660 + px, { k: 0.06 });
          for (let q = 0; q < 3; q++) V.shrub(pb, px - 5 + q * 5, base - ph, r.int(4, 6), 6680 + px + q, { ramp: hzR(LEAF, 0.06) });
        }
        galFx.lamps.push([x + 22, base - 46, 'warm']);
        x += n * 22 + 20 + r.int(14, 40);
      } else {
        // carro de mantenimiento con bobina de cable y caja de herramientas
        V.box3q(pb, x, base - 6, 34, 10, 8, { ramp: hzR(['#3a1a0a', '#6a2e10', '#a84a16', '#d8701e', '#f09a3a', '#ffc070']), front: 3, side: 2, top: 5 });
        for (const wx of [x + 4, x + 28]) V.ellipse(pb, wx + 0.5, base - 2.5, 3, 3, (nx, ny, d) => d > 0.4 ? G[1] : G[4]);
        V.ellipse(pb, x + 12.5, base - 22, 7, 7, (nx, ny, d) => d < 0.15 ? G[1] : U(V.hzc(d > 0.7 ? '#1a3a6a' : ((Math.atan2(ny, nx) * 4) | 0) % 2 ? '#2c63c0' : '#56a0e8', 0.12)));
        V.box3q(pb, x + 22, base - 16, 10, 6, 4, { ramp: hzR(['#3a0a0a', '#7a1a1a', '#c02a2a', '#ff5a4a']), front: 2, side: 1, top: 3 });
        for (let y = base - 30; y < base - 16; y++) V.put(pb, x + 33, y, G[5]);
        x += 44 + r.int(20, 50);
      }
    }
    // lámparas de trabajo cálidas sobre trípode entre módulos
    for (let lx = 140; lx < w; lx += r.int(260, 380)) {
      const hy = base - 44;
      for (const dx of [-6, 6, 0]) V.line(pb, lx, hy + 6, lx + dx, base, U(V.hzc(dx ? '#4a4a56' : '#26262e', 0.1)));
      for (let q = -4; q <= 4; q++) for (let yy = -3; yy <= 3; yy++) V.put(pb, lx + q, hy + yy, U(Math.abs(q) === 4 || Math.abs(yy) === 3 ? '#3a1a08' : q > 1 ? '#fff4c8' : '#e08a2a'));
      galFx.lamps.push([lx + 3, hy, 'work']);
    }
    // borde cálido de la luz de los ventanales (desde la izquierda) sobre las siluetas
    V.rim(pb, U('#ffc880'), 0.35, -1, 0, 0, 0, w, base);
  }, {
    tag: 'gal', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T(), S = st();
      const on = !S.blackout;
      // ventiladores: aspas que giran (2 radios, 4 posiciones)
      for (let i = 0; i < galFx.fans.length; i++) {
        const [x, y, rr] = galFx.fans[i], sx = x + ox; if (sx < -8 || sx > W + 8) continue;
        const a = (on ? t * 9 : t * 0.4) + i;
        g.fillStyle = '#c8d0e8';
        for (let b = 0; b < 3; b++) { const an = a + b * 2.094; for (let q = 1; q < rr; q++) g.fillRect(Math.round(sx + Math.cos(an) * q), Math.round(y + oy + Math.sin(an) * q), 1, 1); }
      }
      if (on) {
        for (const [p, c] of galFx.flows) V.drawFlowC(g, p, ox, oy, t, { col: c, speed: 16, gap: 12 });
        for (let i = 0; i < galFx.leds.length; i++) { const [x, y, q] = galFx.leds[i], sx = x + ox; if (sx < -2 || sx > W + 2) continue; if ((Math.floor(t * 2.5) + q * 3 + i) % 7 === 0) continue; g.fillStyle = q % 5 === 4 ? '#ffd84a' : S.soc < 0.3 && q % 3 === 0 ? '#ff6b6b' : '#7af0b0'; g.fillRect(sx, y + oy, 2, 1); }
        for (const [x, y, w2] of galFx.screens) { const sx = x + ox; if (sx < -10 || sx > W) continue; g.fillStyle = '#56e5ff'; g.fillRect(sx, y + oy + 1, 1 + ((Math.floor(t * 4) + x) % w2), 1); g.fillStyle = '#b6f05a'; g.fillRect(sx, y + oy + 3, 1 + ((Math.floor(t * 3) + x * 3) % w2), 1); }
        for (const [x, y, kind] of galFx.lamps) { const sx = x + ox; if (sx < -30 || sx > W + 30) continue; const fl = kind === 'work' ? 0.88 + 0.12 * Math.sin(t * 17 + x) : 1; V.drawGlow(g, sx, y + oy, kind === 'work' ? 22 : 14, '#ffa850', 0.36 * fl); V.drawGlow(g, sx, y + oy, 5, '#ffe8b0', 0.75 * fl); }
      }
      for (let i = 0; i < galFx.beacons.length; i++) { const [x, y] = galFx.beacons[i], sx = x + ox; if (sx < -6 || sx > W + 6) continue; const blink = (Math.floor(t * (on ? 1.2 : 2) + i * 0.37) % 2) === 0; if (blink) { const c = on ? '#3fe0a0' : '#ff4e5d'; g.fillStyle = c; g.fillRect(sx, y + oy, 2, 2); V.drawGlow(g, sx + 1, y + oy + 1, 4, c, 0.5); } }
      for (const [x, y] of galFx.steam) if (x + ox > -10 && x + ox < W + 10) V.drawSteam(g, x + ox, y + oy, t + x, { n: 6, h: 26, col: '#d8e0f8' });
      V.drawMotes(g, 14, t, 31, { y0: 40, y1: 270, col: '#ffe8c0' });
    },
  });
  B.vistaInfo = { planes: B.layers.length, ms: Object.assign({}, V.stats.ms) };
  return B;
};

/** Hiedra: tallo que cuelga (dir 1, desde y0 hacia abajo) o trepa (dir −1, desde y0 hacia arriba) con hojas de 2 px */
function R3INTB_ivy(pb, x0, y0, len, seed, ramp, dir = 1) {
  const V = VISTA, q = RNG(seed), LF = V.P32(ramp), n = LF.length;
  let x = x0;
  for (let i = 0; i < len; i++) {
    const y = y0 + i * dir;
    x += Math.round(Math.sin(i * 0.21 + seed) * 0.6);
    const stem = U('#2a2a0c');
    V.put(pb, x, y, stem);
    const spread = 2 + Math.round((dir > 0 ? (1 - i / len) : (i / len < 0.85 ? 1 : 0.4)) * 4);
    for (let k = 0; k < 2; k++) {
      if (q() > 0.75) continue;
      const lx = x + Math.round((q() - 0.5) * spread * 2), ly = y + Math.round((q() - 0.5) * 2);
      const lit = lx < x ? 2 : 0, t = clamp(2 + lit + Math.round(q() * 2) - (i > len * 0.8 ? 1 : 0), 0, n - 1);
      V.put(pb, lx, ly, LF[t]); V.put(pb, lx + 1, ly, LF[Math.max(0, t - 1)]); V.put(pb, lx, ly - 1, LF[Math.min(n - 1, t + 1)]);
    }
  }
}

BIOME_LABELS.vault = BIOME_LABELS.vault || [];
