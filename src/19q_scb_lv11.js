/* =====================================================================
   19q_scb_lv11.js — Plano jugable del EPÍLOGO «La Primera Cosecha»
   (Nivel 11) con el kit PF, al atardecer en la plaza de ARIDIA.
   Mismo suelo (y = 292), mismos actores, estación y guion: solo arte.
     0–110     entrada: arco de cosecha con mazorcas, jardineras, farola
     110–480   mercado de la primera cosecha: tres puestos, cajas de
               productos, sacos, cestas, barriles, carretilla, mesa
     480–640   parcela escolar: bancal con cultivos, goteo y sensor
     650–910   pantalla pública de SYNARA 2.0 sobre torres de truss,
               altavoces, tarima baja, focos y pancarta del festival
     910–1000  PANEL PÚBLICO (poste) y bancos
     1000–1160 laboratorio abierto (pabellón-aula) con mesa de muestras
     1160–1300 variante según el final (tablero · pancarta · plantones · mosaico)
     1300–1500 hacia el muelle: barandilla, redes, cajas de pescado, poste
   Faroles y guirnaldas encendidos al atardecer; gradación cálida horneada.
   SCBL11.pf · SCBL11.props(pb, world) · SCBL11.propsFront(pb, world) ·
   SCBL11.renderBack(g, sc, cam) · SCBL11.renderMidFx(g, sc, cam) · SCBL11.labels
   ===================================================================== */
const SCBL11 = (() => {
  const A = () => PFArch, C = () => PFCivic, F = () => PFFlora;
  const DUSK = { sat: 1.04, tint: '#ffb070', tintK: 0.1, bright: 0.96 };
  const K = { lamps: [], spots: [], lights: null, lanterns: [] };
  const pf = {
    terrain: [
      { x0: 0, x1: 480, surf: 'plaza', face: 'plazaWall', depth: 22, wallH: 58 },
      { x0: 480, x1: 640, surf: 'meadow', face: 'plazaWall', depth: 18, wallH: 58, path: false },
      { x0: 640, x1: 1500, surf: 'plaza', face: 'plazaWall', depth: 22, wallH: 58 },
    ],
    fg: [
      { kind: 'garland', x: -30, y: -6, w: 330, h: 40, seed: 3, top: true },
      { kind: 'clump', x: -20, w: 130, h: 80, seed: 5, spikes: 3, leaves: 12 },
      { kind: 'bougain', x: 560, w: 120, h: 72, seed: 9 },
      { kind: 'garland', x: 900, y: -8, w: 300, h: 44, seed: 7, top: true },
      { kind: 'bougain', x: 1320, w: 130, h: 76, seed: 11 },
      { kind: 'clump', x: 1820, w: 130, h: 84, seed: 13, spikes: 4, leaves: 10 },
    ],
    fauna: { gulls: [{ x: 400, y: 70, n: 3 }, { x: 1200, y: 60, n: 4 }], drones: [{ x: 900, y: 110, r: 30 }] },
    decorateFace(pb) { SCBK.grade(pb, DUSK); },
  };
  const labels = [
    { x: 562, y: 210, title: 'PARCELA ESCOLAR', sub: 'Goteo + sensor de humedad', kind: 'green', ax: 562, ay: 248 },
    { x: 960, y: 196, title: 'PANEL PÚBLICO', sub: (sc) => ((1.2 + 0.2 * Math.sin(Game.time * 0.7)).toFixed(1)) + ' NTU en vivo', kind: 'water', ax: 930, ay: 214 },
  ];
  function props(pb, world) {
    const gy = (x) => world.groundAt(x);
    const segs = PFTerrain.surface(pb, world);
    const back = (x) => PFTerrain.backEdge(PFTerrain.segAt(segs, x), Math.round(x), gy(x));
    const Ar = A(), Cv = C(), Fl = F(), r = RNG(1101), E = GS.s.ending || 'pacto';
    K.lamps = []; K.spots = []; K.lanterns = [];
    // pavimento: tapas de registro, hojas y granos de maíz barridos
    for (const x of [60, 300, 700, 1040, 1260, 1420]) Ar.manhole(pb, x, gy(x) - 12);
    for (let x = 0; x < 1500; x += 3) if (hash2(x, 7, 51) < 0.05) PFK.put(pb, x, gy(x) - 3 - Math.floor(hash2(x, 8, 51) * 16), U(['#ffe14d', '#e8a030', '#c86a2a', '#86c040', '#ffffff'][Math.floor(hash2(x, 9, 51) * 5)]));
    /* ===== 1. ENTRADA: ARCO DE COSECHA ===== */
    harvestArch(pb, 14, gy(14) - 6, 92);
    Ar.planter(pb, 0, gy(0) - 14, 12, { kind: 'flowers', seed: 2 });
    K.lamps.push(Ar.lamp(pb, 112, gy(112) - 8, { h: 106, arms: 2 }));
    /* ===== 2. MERCADO DE LA PRIMERA COSECHA (puestos en las mismas posiciones) ===== */
    const cols = ['#ff6b6b', '#20d6c7', '#ffb93b'], goods = ['fruit', 'crafts', 'fruit'], signs = ['FRUTAS', 'SEMILLAS', 'HORTALIZAS'];
    for (let k = 0; k < 3; k++) {
      const x = 120 + k * 120;
      Ar.stall(pb, x + 6, gy(x) - 8, 64, { c1: cols[k], goods: goods[k], sign: signs[k], seed: 3 + k * 2 });
      produceCrates(pb, x + 74, gy(x + 74) - 6, 2 + (k % 2), 40 + k);
    }
    Ar.sack(pb, 228, gy(228) - 4, { col: '#d8c08a' }); Ar.sack(pb, 238, gy(238) - 6, { col: '#c8b07a' });
    Ar.barrel(pb, 350, gy(350) - 6, { r: 6, h: 18 });
    K.lamps.push(Ar.lamp(pb, 470, gy(470) - 8, { h: 104, basket: true }));
    /* ===== 3. PARCELA ESCOLAR ===== */
    const bed = Cv.raisedBed(pb, 496, 626, gy(496) - 4, { kinds: ['maiz', 'frijol', 'ahuyama', 'tomate', 'aji', 'sorgo', 'frijol', 'maiz', 'ahuyama', 'tomate', 'aji', 'maiz'] });
    K.bed = bed;
    sensor(pb, 630, gy(630) - 4);
    Fl.scatter(pb, (x) => back(x) + 3, 482, 640, 51, { gap: 9, mix: { tuft: 4, flowers: 2, fern: 1 } });
    PFSigns.post(pb, 482, gy(482) - 2, [{ text: 'PARCELA ESCOLAR' }], 31, { font: 'tiny' });
    /* ===== 4. PANTALLA PÚBLICA DE SYNARA 2.0 (el contenido se pinta por cuadro) ===== */
    screenRig(pb, 722, 174, 166, 86, gy(800));
    /* ===== 5. PANEL PÚBLICO Y BANCOS ===== */
    PFSigns.post(pb, 902, gy(902) - 2, [{ text: 'PANEL PÚBLICO' }, { text: 'DATOS ABIERTOS', dir: 1 }], 41, { font: 'tiny' });
    Ar.bench(pb, 950, gy(950) - 8, 34);
    K.lamps.push(Ar.lamp(pb, 994, gy(994) - 8, { h: 108, arms: 2 }));
    /* ===== 6. LABORATORIO ABIERTO ===== */
    const pav = Cv.pavilion(pb, 1004, gy(1004) - 6, 148);
    K.pav = pav;
    sampleTable(pb, 1046, gy(1046) - 10);
    PFSigns.post(pb, 1150, gy(1150) - 2, [{ text: 'LABORATORIO ABIERTO' }], 43, { font: 'tiny' });
    /* ===== 7. VARIANTE SEGÚN EL FINAL ===== */
    endingCorner(pb, 1176, gy(1176) - 4, E);
    /* ===== 8. HACIA EL MUELLE ===== */
    K.lamps.push(Ar.lamp(pb, 1310, gy(1310) - 8, { h: 104, arms: 1 }));
    fishCrates(pb, 1360, gy(1360) - 6);
    nets(pb, 1430, gy(1430) - 6);
    Ar.planter(pb, 1330, gy(1330) - 10, 22, { kind: 'palm', seed: 61, h: 16 });
    railing(pb, 1446, 1500, gy(1446) - 6);
    PFSigns.post(pb, 1466, gy(1466) - 2, [{ text: 'MUELLE · MAR' }, { text: 'PLAZA', dir: -1 }], 47, { font: 'tiny' });
    // guirnaldas de banderines entre farolas y puestos (sobre la plaza)
    Ar.bunting(pb, 20, 170, 700, 176, 14, { cols: ['#ff6b6b', '#ffe14d', '#20d6c7', '#86e36f', '#f78acb'] });
    Ar.bunting(pb, 900, 168, 1400, 172, 14, { cols: ['#ffe14d', '#20d6c7', '#ff9f43', '#86e36f'] });
    SCBK.grade(pb, DUSK);
  }
  function propsFront(pb, world) {
    const gy = (x) => world.groundAt(x), Fl = F();
    for (let x = 486; x < 636; x += 13) Fl.tuft(pb, x, gy(x) + 2, 6, 6, x + 1);
    for (const x of [6, 104, 476, 646, 996, 1304]) PFArch.pots(pb, x, gy(x) + 4, 1, x);
    // mazorcas y calabazas en el bordillo del mercado
    for (const x of [150, 266, 392]) pumpkins(pb, x, gy(x) + 4, x);
    SCBK.grade(pb, DUSK);
  }
  /* ---------- dinámico ---------- */
  function renderBack(g, sc, cam) {
    const t = Game.time, ox = cam.x, oy = cam.y;
    if (!K.lights) { K.lights = []; for (const [x0, x1, ya, yb] of [[112, 470, 178, 160], [994, 1310, 160, 176]]) { const pts = []; for (let i = 0; i <= x1 - x0; i++) { const tt = i / (x1 - x0); pts.push([x0 + i, lerp(ya, yb, tt) + Math.sin(tt * Math.PI) * 16]); } K.lights.push(pts); } }
    for (const pts of K.lights) {
      if (pts[0][0] - ox > W + 40 || pts[pts.length - 1][0] - ox < -40) continue;
      g.fillStyle = '#3a2a22';
      for (let i = 0; i < pts.length; i += 2) g.fillRect(pts[i][0] - ox, Math.round(pts[i][1] - oy), 1, 1);
      SCBK.drawBulbs(g, pts.map(p => [p[0] - ox, p[1] - oy]), t);
    }
  }
  function renderMidFx(g, sc, cam) {
    const t = Game.time, ox = cam.x, oy = cam.y;
    // faroles encendidos (halo cálido suave, sin tramado)
    for (const L of K.lamps) for (const [hx, hy] of L.heads) {
      const x = hx - ox, y = hy - oy; if (x < -40 || x > W + 40) continue;
      VISTA.drawSoftGlow(g, x, y, 26, '#ffb860', 0.24 + 0.03 * Math.sin(t * 6 + hx), 5);
      g.fillStyle = '#fff2c0'; g.fillRect(x - 1, y - 1, 3, 3);
    }
    // farolillos de papel del arco y del mercado
    for (const [lx, ly, col] of K.lanterns) { const x = lx - ox, y = ly - oy; if (x < -20 || x > W + 20) continue; VISTA.drawSoftGlow(g, x, y, 9, col, 0.3 + 0.08 * Math.sin(t * 3 + lx), 3); }
    // focos de la pantalla
    for (const [fx, fy, col] of K.spots) { const x = fx - ox, y = fy - oy; if (x < -20 || x > W + 20) continue; if (Math.sin(t * 2 + fx * 0.1) > -0.4) PFK.drawGlow(g, x, y + 2, 6, col, 0.55); }
    // goteo de la parcela escolar
    if (K.bed && typeof drawDrips === 'function') drawDrips(g, 496 + 5 - ox, 626 - ox, K.bed.dripY - oy, t, true, 10);
    // LED del sensor de humedad
    if (K.sensor) { const on = Math.floor(t * 1.5) % 2; g.fillStyle = on ? '#3fe0a0' : '#0e4a34'; g.fillRect(K.sensor[0] - ox, K.sensor[1] - oy, 2, 2); }
  }
  /* ---------- piezas ---------- */
  function harvestArch(pb, x, yb, w) {
    const Wd = PFK.P32(PFArch.WOOD), h = 120;
    // postes de madera y dintel con guirnalda de mazorcas, ajíes y flores
    for (const px of [x, x + w - 6]) { for (let y = yb - h; y < yb; y++) for (let k = 0; k < 6; k++) PFK.put(pb, px + k, y, Wd[k === 0 ? 1 : k === 1 ? 5 : k < 4 ? 4 : 2]); for (let k = -1; k < 7; k++) { PFK.put(pb, px + k, yb - 1, Wd[1]); PFK.put(pb, px + k, yb - 2, Wd[3]); } }
    for (let xx = x - 6; xx < x + w + 6; xx++) for (let k = 0; k < 7; k++) PFK.put(pb, xx, yb - h - 7 + k, Wd[k === 0 ? 5 : k === 6 ? 1 : k === 1 ? 4 : 3]);
    PFK.text(pb, 'PRIMERA COSECHA', x + Math.round(w / 2) - Math.round(PFK.measure('PRIMERA COSECHA', { font: 'tiny' }) / 2), yb - h - 5, '#fff2c0', { font: 'tiny' });
    const r = RNG(77), COB = ['#ffe14d', '#f0b020', '#c86a10'], CHI = ['#e8402e', '#a01e1a'], LF = PFK.P32(RAMP.foliageR);
    for (let xx = x - 4; xx < x + w + 4; xx += 5) {
      const sag = Math.round(Math.sin((xx - x) / w * Math.PI) * 9), yy = yb - h + 1 + sag;
      F().leaf(pb, xx, yy, Math.PI / 2 + (r() - 0.5), 6, 3, LF, 3);
      const kind = r.int(0, 2);
      if (kind === 0) for (let q = 0; q < 6; q++) { PFK.put(pb, xx, yy + 2 + q, U(COB[q === 0 ? 0 : q < 4 ? 1 : 2])); PFK.put(pb, xx + 1, yy + 2 + q, U(COB[q < 3 ? 0 : 1])); }
      else if (kind === 1) for (let q = 0; q < 4; q++) PFK.put(pb, xx + (q > 2 ? 1 : 0), yy + 2 + q, U(CHI[q < 2 ? 0 : 1]));
      else PFArch.blob(pb, xx, yy + 3, 2, ['#f478b8', '#ffd84a', '#ffffff'][r.int(0, 2)]);
    }
    // farolillos de papel colgando del dintel
    for (const [lx, col] of [[x + 20, '#ff9f43'], [x + w / 2, '#ffe14d'], [x + w - 20, '#ff6b6b']]) {
      for (let q = 0; q < 8; q++) PFK.put(pb, Math.round(lx), yb - h + q, U('#2a1a12'));
      PFK.ellipseFn(pb, lx, yb - h + 14, 4, 5, (nx, ny) => U(shadeTo(col, ny < -0.4 ? 0.3 : nx > 0.4 ? -0.25 : 0)));
      PFK.put(pb, Math.round(lx), yb - h + 20, U('#2a1a12'));
      K.lanterns.push([Math.round(lx), yb - h + 14, col]);
    }
    // calabazas y cestas al pie de los postes
    pumpkins(pb, x + 8, yb, 3); pumpkins(pb, x + w - 14, yb, 5);
  }
  function pumpkins(pb, x, yb, seed) {
    const r = RNG(seed);
    for (let i = 0; i < 3; i++) {
      const cx = x + i * 6 + r.int(0, 2), rr = 3 + r.int(0, 2), col = r.pick(['#f08a20', '#e8a030', '#d86a18', '#9ab040']);
      PFK.ellipseFn(pb, cx, yb - rr, rr + 1, rr, (nx, ny, d) => { const c = U(col); if (Math.abs(nx) < 0.12 || Math.abs(Math.abs(nx) - 0.55) < 0.1) return PFK.shU(c, -0.25, 20); return ny < -0.35 && nx < 0.2 ? PFK.shU(c, 0.25) : nx > 0.5 || ny > 0.5 ? PFK.shU(c, -0.3, 15) : c; });
      PFK.put(pb, cx, yb - 2 * rr - 1, U('#3a5a1a')); PFK.put(pb, cx + 1, yb - 2 * rr - 2, U('#5a7a2a'));
    }
  }
  function produceCrates(pb, x, yb, n, seed) {
    const r = RNG(seed), CR = ['#ff8a2a', '#e8402e', '#ffe060', '#8ad040', '#f478b8', '#c86a2a'];
    for (let i = 0; i < n; i++) {
      const cx = x + i * 2, cy = yb - i * 12;
      PFArch.crate(pb, cx, cy, 20, 11, 7);
      for (let q = 0; q < 9; q++) PFArch.blob(pb, cx + 3 + (q % 5) * 3 + (q > 4 ? 1 : 0), cy - 12 - (q > 4 ? 2 : 0), 1.6, CR[(r.int(0, 5) + seed) % CR.length]);
    }
  }
  function sensor(pb, x, yb) {
    const S = PFK.P32(PFInfra.STEEL);
    for (let y = yb - 26; y < yb; y++) { PFK.put(pb, x, y, S[5]); PFK.put(pb, x + 1, y, S[2]); }
    PFInfra.box3q(pb, x - 4, yb - 26, 10, 7, 3, { ramp: PFInfra.STEEL });
    for (let k = 0; k < 8; k++) PFK.put(pb, x - 3 + k, yb - 34 + Math.round(k * 0.3), U('#16214a'));
    K.sensor = [x - 2, yb - 31];
  }
  function screenRig(pb, sx, sy, sw, sh, ground) {
    const Cv = C();
    // tarima baja de madera (decorativa, a ras del suelo: no cambia la colisión)
    PFInfra.box3q(pb, sx - 30, ground - 2, sw + 60, 3, 10, { ramp: PFArch.WOOD });
    // torres de truss y viga superior
    Cv.truss(pb, sx - 18, sy - 22, ground - 4, 8);
    Cv.truss(pb, sx + sw + 10, sy - 22, ground - 4, 8);
    Cv.truss(pb, sx - 18, sx + sw + 18, sy - 28, 7, true);
    // pancarta del festival colgada de la viga
    const bw = 120, bx = sx + Math.round((sw - bw) / 2), by = sy - 20;
    for (let yy = 0; yy < 12; yy++) for (let xx = 0; xx < bw; xx++) PFK.put(pb, bx + xx, by + yy, U(yy === 0 ? '#ffe8a0' : yy === 11 ? '#8a3a10' : (xx >> 3) % 2 ? '#e8702a' : '#f08a30'));
    PFK.text(pb, 'FIESTA DE LA COSECHA', bx + Math.round(bw / 2 - PFK.measure('FIESTA DE LA COSECHA', { font: 'tiny' }) / 2), by + 3, '#fff6e0', { font: 'tiny' });
    // marco del panel LED + pies
    for (const lx of [sx + 12, sx + sw - 14]) for (let yy = sy + sh + 3; yy < ground - 4; yy++) { PFK.put(pb, lx, yy, PFK.P32(PFInfra.STEEL)[4]); PFK.put(pb, lx + 1, yy, PFK.P32(PFInfra.STEEL)[1]); }
    Cv.screenFrame(pb, sx, sy, sw, sh);
    // altavoces y focos
    Cv.speaker(pb, sx - 34, ground - 4, 16, 28); Cv.speaker(pb, sx + sw + 20, ground - 4, 16, 28);
    for (let k = 0; k < 4; k++) { const fx = sx + 10 + k * 48; PFInfra.box3q(pb, fx, sy - 26, 6, 4, 3, { ramp: ['#08080c', '#14141c', '#26262e', '#3a3a46', '#56566a'] }); K.spots.push([fx + 3, sy - 22, ['#ffe14d', '#20d6c7', '#f78acb', '#ff9f43'][k]]); }
    // macetas con flores a los pies de las torres
    PFArch.pots(pb, sx - 26, ground - 6, 2, 71); PFArch.pots(pb, sx + sw + 4, ground - 6, 2, 73);
  }
  function sampleTable(pb, x, yb) {
    const Wd = PFK.P32(PFArch.WOOD);
    PFInfra.box3q(pb, x, yb, 56, 3, 10, { ramp: PFArch.WOOD });
    for (const lx of [x + 2, x + 52]) for (let q = 0; q < 10; q++) { PFK.put(pb, lx, yb + q - 9, Wd[2]); }
    // tubos de ensayo, microscopio, frascos con muestras de agua, anemómetro de latas
    for (let i = 0; i < 6; i++) { const tx = x + 6 + i * 4; for (let q = 0; q < 7; q++) PFK.put(pb, tx, yb - 4 - q, U(q < 3 ? ['#20d6c7', '#86e36f', '#ffe14d', '#c244a2', '#56e5ff', '#ff9f43'][i] : '#d8eef4')); }
    const mx = x + 36; for (let q = 0; q < 10; q++) PFK.put(pb, mx, yb - 4 - q, U('#3a3a46')); PFInfra.box3q(pb, mx - 3, yb - 3, 8, 2, 3, { ramp: PFInfra.STEEL }); PFK.put(pb, mx + 1, yb - 14, U('#56566a')); PFK.put(pb, mx + 2, yb - 13, U('#8a8a9a'));
    const ax = x + 48; for (let q = 0; q < 16; q++) PFK.put(pb, ax, yb - 4 - q, U('#9aa4b8')); for (const [dx, dy] of [[-4, 0], [4, 0], [0, -2]]) PFArch.blob(pb, ax + dx, yb - 20 + dy, 1.6, '#d8dce6');
  }
  function endingCorner(pb, x, yb, E) {
    const Wd = PFK.P32(PFArch.WOOD);
    if (E === 'pacto') {
      // tablero de decisiones pendientes con notas de colores
      for (const px of [x + 8, x + 84]) for (let y = yb - 70; y < yb; y++) for (let k = 0; k < 4; k++) PFK.put(pb, px + k, y, Wd[k === 1 ? 5 : 3]);
      PFInfra.box3q(pb, x, yb - 16, 96, 54, 4, { ramp: PFArch.WOOD });
      const NC = ['#ffe14d', '#ff9a8a', '#a6f4ff', '#c2f58e'];
      for (let i = 0; i < 12; i++) { const nx = x + 6 + (i % 6) * 15, ny = yb - 64 + Math.floor(i / 6) * 22 + (i % 2) * 2; for (let yy = 0; yy < 12; yy++) for (let xx = 0; xx < 11; xx++) PFK.put(pb, nx + xx, ny + yy, U(yy === 0 ? shadeTo(NC[i % 4], 0.3) : yy === 11 || xx === 10 ? shadeTo(NC[i % 4], -0.25) : NC[i % 4])); for (let q = 0; q < 3; q++) PFK.put(pb, nx + 2, ny + 3 + q * 3, U('#3a2a40')), PFK.put(pb, nx + 3 + q, ny + 3 + q * 3, U('#3a2a40')); PFK.put(pb, nx + 5, ny + 1, U('#e83b41')); }
      PFSigns.post(pb, x + 100, yb + 2, [{ text: 'DECISIONES PENDIENTES' }], 51, { font: 'tiny' });
    } else if (E === 'tecnica') {
      // pancarta de la comunidad sobre dos postes: «¿QUIÉN DECIDE?»
      for (const px of [x + 4, x + 100]) for (let y = yb - 74; y < yb; y++) for (let k = 0; k < 4; k++) PFK.put(pb, px + k, y, Wd[k === 1 ? 5 : 3]);
      for (let yy = 0; yy < 26; yy++) for (let xx = 0; xx < 92; xx++) PFK.put(pb, x + 8 + xx, yb - 72 + yy + Math.round(Math.sin(xx * 0.08) * 1), U(yy < 2 ? '#ff6b6b' : yy > 23 ? '#d8c8b8' : '#fff4e4'));
      PFK.text(pb, '¿QUIÉN DECIDE?', x + 54 - Math.round(PFK.measure('¿QUIÉN DECIDE?', {}) / 2), yb - 64, '#c8283a', {});
      for (let i = 0; i < 6; i++) PFArch.blob(pb, x + 14 + i * 14, yb - 4, 2, ['#20d6c7', '#ffe14d', '#ff6b6b'][i % 3]);
    } else if (E === 'deuda') {
      // vivero de manglar: cajas con plantones y cartel del plan de reparación
      for (let k = 0; k < 4; k++) {
        const cx = x + k * 26;
        PFArch.crate(pb, cx, yb, 22, 10, 7);
        for (let q = 0; q < 4; q++) { const px = cx + 3 + q * 5, ph = 8 + ((q + k) % 3) * 3; for (let s = 0; s < ph; s++) PFK.put(pb, px, yb - 10 - s, U(s < 3 ? '#6a4a2a' : '#3a7a3a')); F().leaf(pb, px, yb - 10 - ph, -Math.PI / 2 - 0.6, 5, 3, PFK.P32(RAMP.foliageR), 4); F().leaf(pb, px, yb - 10 - ph, -Math.PI / 2 + 0.6, 5, 3, PFK.P32(RAMP.foliageR), 3); }
      }
      PFSigns.post(pb, x + 108, yb + 2, [{ text: 'RESTAURAR EL MANGLAR' }], 53, { font: 'tiny' });
    } else {
      // muro MOSAICO VIVO: teselas de datos comunitarios en cerámica
      PFInfra.box3q(pb, x, yb, 104, 58, 6, { ramp: PFArch.CREAM || ['#4a3a2a', '#7a6a52', '#a8967a', '#cfc0a2', '#ece0c6', '#fff6e4'] });
      const cols = ['#20d6c7', '#ffe14d', '#4ccb70', '#ff6b6b', '#ffffff', '#c8861a', '#8d6bff', '#f78acb'];
      for (let yy = 0; yy < 48; yy += 4) for (let xx = 0; xx < 96; xx += 4) { const c = cols[Math.floor(hash2(xx, yy, 5) * cols.length)]; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) PFK.put(pb, x + 4 + xx + a, yb - 54 + yy + b, U(a === 0 && b === 0 ? shadeTo(c, 0.3) : a === 2 || b === 2 ? shadeTo(c, -0.25) : c)); }
      PFSigns.post(pb, x + 110, yb + 2, [{ text: 'MOSAICO VIVO' }], 55, { font: 'tiny' });
    }
  }
  function fishCrates(pb, x, yb) {
    for (let k = 0; k < 3; k++) {
      const cx = x + k * 22 - (k === 2 ? 11 : 0), cy = yb - (k === 2 ? 12 : 0);
      PFArch.crate(pb, cx, cy, 20, 10, 6, { label: '#1283bf' });
      for (let q = 0; q < 4; q++) { const fx = cx + 3 + q * 4, fy = cy - 12; for (let s = 0; s < 4; s++) PFK.put(pb, fx + s, fy + (s === 3 ? 0 : 1), U(s === 0 ? '#d2dbb7' : '#8ca18b')); PFK.put(pb, fx + 4, fy, U('#497c8a')); }
    }
  }
  function nets(pb, x, yb) {
    // red de pesca tendida en un caballete
    const Wd = PFK.P32(PFArch.WOOD);
    for (const px of [x, x + 28]) for (let y = yb - 34; y < yb; y++) { PFK.put(pb, px, y, Wd[4]); PFK.put(pb, px + 1, y, Wd[2]); }
    for (let xx = 0; xx < 28; xx++) for (let yy = 0; yy < 26; yy++) { const sag = Math.round(Math.sin(xx / 28 * Math.PI) * 4); if ((xx + yy) % 4 === 0 || (xx - yy + 40) % 4 === 0) PFK.put(pb, x + 1 + xx, yb - 32 + yy + sag, U('#5a7a6a')); }
    for (let k = 0; k < 4; k++) PFArch.blob(pb, x + 4 + k * 7, yb - 30 + (k % 2) * 3, 1.6, '#ff9f43');
  }
  function railing(pb, x0, x1, yb) {
    const S = PFK.P32(['#2a3040', '#4a5268', '#6a7690', '#9aa6c0', '#cfd8ec']);
    for (let x = x0; x < x1; x++) { PFK.put(pb, x, yb - 22, S[4]); PFK.put(pb, x, yb - 21, S[2]); PFK.put(pb, x, yb - 11, S[3]); if ((x - x0) % 12 === 0) for (let y = yb - 22; y < yb; y++) { PFK.put(pb, x, y, S[3]); PFK.put(pb, x + 1, y, S[1]); } }
  }
  return { pf, labels, props, propsFront, renderBack, renderMidFx, K };
})();
