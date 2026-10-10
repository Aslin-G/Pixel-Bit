/* =====================================================================
   50_scenes.js — Título, Mapa del Nexo, Ajustes y accesibilidad.
   ===================================================================== */

/* =====================================================================
   PANTALLA DE TÍTULO — panorama de Aridia al atardecer
   ===================================================================== */
const TitleScene = {
  touchControls: false,
  enter() {
    this.t = 0; this.menu = 'main'; this.ps = new Particles(400);
    this.build();
    Audio2.playMusic('title');
    Audio2.setAmbience({ sea: 0.6, wind: 0.4, birds: 0.3 });
    this.hasSave = SaveManager.exists();
  },
  build() {
    // key art cinematográfico (19a_sca_title.js): prerender único cacheado
    this.art = SCATitleArt.build();
  },
  update(dt) {
    this.t += dt; this.ps.update(dt);
    if (this.menu === 'main' && Input.pressed('cancel')) { }
    if (Input.keyPressed('F9')) Game.push(TeacherScene, {});
  },
  render(g) {
    const t = this.t;
    SCATitleArt.render(g, this.art, t, this.ps);
    this.ps.render(g);
    // logotipo
    const ly = 22 + Math.round(Math.sin(t * 1.2) * 2);
    drawTitleText(g, 'ARIDIA NEXUS', W / 2, ly, 4, ['#fff6d8', '#ffe14d', '#ffb862', '#ff7656', '#e050c8'], { align: 'center', font: 'bold', shadow: '#2a1040', depth: 3, outline: '#140d26' });
    drawTitleText(g, 'LA CIUDAD QUE BEBÍA EL MAR', W / 2, ly + 50, 2, ['#e6f8fe', '#8fdfff', '#22c1e7'], { align: 'center', font: 'bold', shadow: '#000633', depth: 1, outline: '#000633' });
    for (let i = 0; i < 5; i++) { const sx = W / 2 - 150 + ((t * 40 + i * 70) % 300); fpx(g, sx, ly + 4 + (i * 7) % 26, '#ffffff'); }
    this.renderMenu(g);
    UIK.pill(g, W / 2, 96, 'Videojuego educativo STEAM · agua · energía · hidrógeno · agroecología', { align: 'center', rim: '#c244a2', fill: '#1d0b3a', color: '#ffd8ec' });
  },
  renderMenu(g) {
    Gui.begin();
    if (this.menu === 'main') {
      const items = [];
      if (this.hasSave) items.push(['cont', 'Continuar', 'play', () => this.continueGame(), 'good']);
      items.push(['new', 'Nueva partida', 'star', () => { if (this.hasSave) this.menu = 'confirmNew'; else this.newGame(); }, this.hasSave ? 'primary' : 'good']);
      items.push(['teach', 'Modo docente', 'chart', () => Game.push(TeacherScene, {}), 'primary']);
      items.push(['sett', 'Ajustes', 'gear', () => Game.push(SettingsScene, {}), 'primary']);
      items.push(['cred', 'Créditos', 'book', () => Game.push(CreditsScene, {}), 'primary']);
      // lista vertical en panel navy a la derecha (deja libres el sol, el mar y a Amaya)
      const w = 150, bh = 20, gap = 4, h = 28 + items.length * (bh + gap) + 2;
      const x = W - w - 8, y = Math.min(168, H - 8 - h);
      UIK.panel(g, x, y, w, h, 'tech');
      UIK.header(g, x, y, w, 'MENÚ', 'tech', 'map');
      let yy = y + 26;
      for (const [id, l, ic, fn, st] of items) { if (Gui.button(g, id, x + 10, yy, w - 20, bh, l, { icon: ic, style: st, align: 'left' })) fn(); yy += bh + gap; }
    } else if (this.menu === 'confirmNew') {
      const w = 260, x = W - w - 14, y = 172;
      UIK.panel(g, x, y, w, 96, 'alert');
      UIK.header(g, x, y, w, 'NUEVA PARTIDA', 'alert', 'warn');
      drawTextBlock(g, 'Ya existe una partida guardada. ¿Empezar de nuevo? Se perderá el progreso local.', x + 10, y + 26, w - 20, { color: '#ffe8e4' });
      if (Gui.button(g, 'yes', x + 10, y + 68, 140, 20, 'Sí, empezar', { icon: 'reset', style: 'danger' })) { SaveManager.wipe(); this.newGame(); }
      if (Gui.button(g, 'no', x + 156, y + 68, 94, 20, 'Volver', { style: 'ghost' })) this.menu = 'main';
    }
    Gui.end();
  },
  newGame() {
    GS.reset();
    Audio2.sfx('unlock');
    Game.transition(() => Game.setScene(IntroScene, {}), '#140d26', 1.5);
  },
  continueGame() {
    if (!GS.load()) { this.newGame(); return; }
    if (GS.s.settings) { Object.assign(Game.settings, GS.s.settings); Audio2.applyVolumes(); }
    Game.transition(() => {
      if (GS.s.scene === 'level' && GS.s.checkpoint && LEVELS[GS.s.level] && !GS.s.completed.includes(GS.s.level)) Game.setScene(GameplayScene, { level: GS.s.level, checkpoint: GS.s.checkpoint });
      else Game.setScene(WorldMapScene, {});
    });
  },
};

/* =====================================================================
   INTRO — texto de apertura antes del Festival
   ===================================================================== */
const IntroScene = {
  enter() { this.t = 0; this.i = 0; Audio2.playMusic('mystery'); this.lines = [
    'En la península de {y}Aridia{/}, el agua vale más que cualquier metal.',
    'El mar es turquesa, el sol no da tregua y el viento conoce todos los caminos.',
    'Hoy, la ciudad celebra el {c}Festival del Primer Agua{/}: SYNARA, el sistema que convierte mar, sol y viento en agua, alimentos e hidrógeno, entregará su primera gota.',
    'Pero la máquina no está rota de la manera que todos creen.',
    'Y el enemigo que parece robar el agua quizá sea el único que intenta impedir una catástrofe.'] },
  update(dt) {
    this.t += dt;
    if (Input.anyConfirm() || Input.pressed('jump')) {
      const shown = this.t * 45 >= stripMarkup(this.lines[this.i]).length;
      if (!shown) this.t = 99; else { this.i++; this.t = 0; Audio2.sfx('soft'); }
      if (this.i >= this.lines.length) this.go();
    }
    if (Input.pressed('skip') || Input.pressed('cancel')) this.go();
  },
  go() { if (this.gone) return; this.gone = true; Game.transition(() => Game.setScene(GameplayScene, { level: 0 })); },
  render(g) {
    // viñeta ilustrada de cada frase (19c_sca_intro.js) con paneo lento y fundido cruzado
    const i = Math.min(this.i, this.lines.length - 1), dt = Game.dt || 1 / 60;
    if (this.artI !== i) {
      if (this.artI != null && SCAIntro.ready(this.artI)) {
        if (!this.snap) this.snap = makeCanvas(W, H);
        this.snap.g.imageSmoothingEnabled = false;
        SCAIntro.draw(this.snap.g, SCAIntro.get(this.artI), Game.time, Math.min(1, (this.artT || 0) / 12));
        this.fadeT = 0;
      }
      this.artI = i; this.artT = 0;
    }
    this.artT += dt; this.fadeT = (this.fadeT ?? 1) + dt;
    SCAIntro.draw(g, SCAIntro.get(i), Game.time, Math.min(1, this.artT / 12));
    if (this.snap && this.fadeT < 0.9) { g.globalAlpha = clamp(1 - this.fadeT / 0.9, 0, 1); g.drawImage(this.snap, 0, 0); g.globalAlpha = 1; }
    // la viñeta siguiente se prepara mientras se lee la actual (una por cuadro como máximo)
    if (this.artT > 0.5 && i + 1 < this.lines.length && !SCAIntro.ready(i + 1)) SCAIntro.get(i + 1);
    // franja de cine arriba y panel de texto navy con bisel abajo
    g.globalAlpha = 0.55; frect(g, 0, 0, W, 14, '#000633'); g.globalAlpha = 1; frect(g, 0, 14, W, 1, '#12305a');
    drawText(g, 'PRÓLOGO', 10, 4, { font: 'tiny', color: '#f5dc5a' });
    for (let k = 0; k < this.lines.length; k++) { const x = 52 + k * 9; frect(g, x, 5, 5, 5, '#000633'); frect(g, x + 1, 6, 3, 3, k < i ? '#6d9be8' : k === i ? '#f5dc5a' : '#12305a'); }
    UIK.pill(g, W - 8, 2, 'ENTER / clic: continuar · X: saltar', { align: 'right', rim: '#3a64b0', fill: '#041533', color: '#a8c8ff' });
    const ln = this.lines[i];
    const px = 34, pw = W - 68, ph = 62, py = H - ph - 10;
    UIK.panel(g, px, py, pw, ph, 'tech');
    drawTextBlock(g, ln, px + 18, py + 13, pw - 36, { color: '#e2ebfc', align: 'center', max: Math.floor(this.t * 45), shadow: '#000633' });
    if (this.t * 45 >= stripMarkup(ln).length && Math.floor(Game.time * 2.5) % 2) { const ax = px + pw - 16, ay = py + ph - 13; frect(g, ax, ay, 7, 1, '#f5dc5a'); frect(g, ax + 1, ay + 1, 5, 1, '#f5dc5a'); frect(g, ax + 2, ay + 2, 3, 1, '#f5dc5a'); frect(g, ax + 3, ay + 3, 1, 1, '#f5dc5a'); }
  },
};

/* =====================================================================
   MAPA DEL NEXO — selección de capítulos
   ===================================================================== */
const MAP_NODES = [
  { id: 0, x: 214, y: 168, icon: 'map', name: 'Plaza de Aridia' },
  { id: 1, x: 120, y: 196, icon: 'water', name: 'Costa de captación' },
  { id: 2, x: 150, y: 250, icon: 'membrane', name: 'Planta OI' },
  { id: 3, x: 232, y: 292, icon: 'salt', name: 'Cañones de Sal' },
  { id: 4, x: 352, y: 218, icon: 'sun', name: 'Dunas Fotónicas' },
  { id: 5, x: 420, y: 112, icon: 'wind', name: 'Torres de Brisa' },
  { id: 6, x: 296, y: 140, icon: 'battery', name: 'Bóveda de Carga' },
  { id: 7, x: 500, y: 196, icon: 'h2', name: 'Ciudadela H2' },
  { id: 8, x: 372, y: 280, icon: 'leaf', name: 'Oasis de las Raíces' },
  { id: 9, x: 258, y: 96, icon: 'scale', name: 'Mesa del Nexo' },
  { id: 10, x: 330, y: 182, icon: 'mosaic', name: 'Núcleo SYNARA' },
];
const MAP_BIOMES = [
  [214, 168, RAMP.sand, 0.62, 0.5], [120, 200, RAMP.sand, 0.58, 0.5],
  [232, 296, RAMP.salt, 0.55, 0.6], [170, 300, RAMP.salt, 0.6, 0.6],
  [378, 282, RAMP.leaf, 0.45, 0.7], [420, 300, RAMP.leaf, 0.5, 0.6],
  [430, 108, RAMP.mesa, 0.5, 0.9], [520, 120, RAMP.mesa, 0.45, 0.9],
  [352, 214, RAMP.dune, 0.55, 0.8], [300, 140, RAMP.dune, 0.6, 0.8], [500, 210, RAMP.dune, 0.5, 0.8], [270, 240, RAMP.dune, 0.6, 0.7],
];
// el mapa se dibuja desplazado hacia arriba para dejar sitio a la tira de capítulos
const MAP_OY = -36, MAP_STRIP_Y = 292;
const MAP_LINKS = [[0, 1], [1, 2], [2, 3], [0, 6], [6, 4], [4, 7], [6, 5], [4, 8], [3, 8], [0, 9], [9, 5], [6, 10], [10, 4], [10, 8], [10, 7]];
/* ---------- Mapa del Nexo en 3/4 (FIXUI SU-04) ----------
   Isla en terrazas: el relieve se eleva hacia el interior y las mesetas del norte, cada escalón muestra su
   cara frontal de roca en rampa con desplazamiento de tono (luz arriba, violeta abajo), sombra de contacto al
   pie de cada terraza, costa con espuma, caminos que siguen el relieve y mini-dioramas por capítulo (ciudad de
   la cúpula, toma costera, planta con tanques, salinas, campo FV, bóveda de baterías, ciudadela H2, oasis en
   bancales, Mesa del Nexo, torre SYNARA) con palmeras y matorral. Coordenadas de mundo = coordenadas de nodo;
   el lienzo tiene FIXUI_MAP_PAD px de mar a cada lado para poder desplazar el mapa lejos del panel. */
const FIXUI_MAP_PAD = 100, FIXUI_MAP_OX_L = -68, FIXUI_MAP_OX_R = 88;
function FIXUI_buildMap() {
  const PAD = FIXUI_MAP_PAD, MW = W + 2 * PAD, MH = H;
  const pb = new PixelBuffer(MW, MH);
  const cx = 310, cy = 196;
  const landF = (x, y) => {
    const dx = (x - cx) / 230, dy = (y - cy) / 150;
    let d = Math.sqrt(dx * dx * 0.9 + dy * dy) - 0.82 + (fbm(x * 0.012, y * 0.012, 4, 2) - 0.5) * 0.55;
    if (y < 60) d += (60 - y) * 0.01;
    d -= Math.exp(-(((x - 520) / 60) ** 2 + ((y - 120) / 40) ** 2)) * 0.3;
    return d;
  };
  const N = MW * MH, D = new Float32Array(N), E = new Uint8Array(N), BR = new Int8Array(N), BT = new Float32Array(N), ZB = new Int16Array(N).fill(-1);
  const RAMPS = [RAMP.sand, RAMP.salt, RAMP.leaf, RAMP.mesa, RAMP.dune];
  const rampIdx = (rp) => Math.max(0, RAMPS.indexOf(rp));
  // caras de roca por bioma: [borde iluminado, medio, sombra, pie violeta]
  const FACE = [
    ['#f6c35c', '#c97c38', '#8d4a2d', '#4a2240'],
    ['#fbb0da', '#c46a9a', '#86346c', '#4a1f48'],
    ['#b8864a', '#7e5a34', '#4f3a2a', '#2a1a30'],
    ['#eb9a6c', '#b8564b', '#6d2f44', '#2e1838'],
    ['#fbdc86', '#d4853c', '#8d4a2d', '#4a2240'],
  ];
  const SH = new Map();
  const sh = (c, k) => { const kk = c + k; let v = SH.get(kk); if (v === undefined) { v = U(shade(c, k)); SH.set(kk, v); } return v; };
  for (let y = 0; y < MH; y++) for (let X = 0; X < MW; X++) {
    const x = X - PAD, i = y * MW + X, d = landF(x, y);
    D[i] = d;
    if (d >= 0) continue;
    const inland = clamp(-d / 0.42, 0, 1);
    const mesa = Math.exp(-(((x - 470) / 86) ** 2 + ((y - 106) / 44) ** 2));
    const hill = Math.exp(-(((x - 300) / 74) ** 2 + ((y - 138) / 42) ** 2));
    const e = 6 + inland * 9 + mesa * (12 + fbm(x * 0.06, y * 0.06, 3, 31) * 12) + hill * 4 + (fbm(x * 0.03, y * 0.03, 2, 77) - 0.5) * 4;
    // playa baja al pie del acantilado costero; tierra adentro, terrazas de 3 px
    E[i] = d > -0.02 ? 2 : Math.max(6, Math.round(e / 3) * 3);
    // biomas con fronteras orgánicas (Voronoi deformado por ruido); centros algo más al sur por la elevación
    const n = fbm(x * 0.03, y * 0.03, 3, 5);
    const wx = x + (fbm(x * 0.018, y * 0.018, 3, 21) - 0.5) * 70, wy = y + (fbm(x * 0.018 + 9, y * 0.018, 3, 22) - 0.5) * 70;
    let b1 = null, d1 = 1e9, d2 = 1e9;
    for (const A of MAP_BIOMES) { const dd = Math.hypot(wx - A[0], (wy - A[1] - 7) * 1.1); if (dd < d1) { d2 = d1; d1 = dd; b1 = A; } else if (dd < d2) d2 = dd; }
    let t = b1[3] + (n - 0.5) * b1[4];
    if (d2 - d1 < 3) t -= 0.1;
    BR[i] = rampIdx(b1[2]); BT[i] = t;
  }
  // mar: bandas por distancia a la costa, espuma y rizos
  for (let y = 0; y < MH; y++) for (let X = 0; X < MW; X++) {
    const x = X - PAD, i = y * MW + X, d = D[i];
    if (d < 0) continue;
    let c = smoothBand(['#20d6c7', '#16a6cf', '#1283bf', '#1063a6', '#0f4888', '#0d3168'], clamp(d * 3, 0, 1), x, y);
    if (d < 0.02) c = '#c6fff2';
    else if (d < 0.05 && ((x + y + Math.floor(fbm(x * 0.1, y * 0.1, 2, 9) * 6)) % 5 === 0)) c = '#6cf0db';
    else if (hash2(x >> 2, y, 5) < 0.05 + clamp(0.3 - d, 0, 0.3) * 0.12) c = shade(c, 0.12); // rizos dispersos de 4 px
    else if (hash2(x >> 1, y >> 1, 6) < 0.025) c = shade(c, -0.1);
    pb.data[i] = U(c);
  }
  // tierra en orden de pintor (de la fila lejana a la cercana): cima + cara frontal de cada escalón
  for (let X = 0; X < MW; X++) for (let y = 0; y < MH; y++) {
    const i = y * MW + X;
    if (D[i] >= 0) continue;
    const x = X - PAD, e = E[i], ys = y - e;
    const ri = BR[i];
    const c = D[i] > -0.02 ? '#fff6d8' : smoothBand(RAMPS[ri], BT[i], x, y);
    const eUp = y > 0 && D[i - MW] < 0 ? E[i - MW] : 0;
    const eN = (y + 1 < MH && D[i + MW] < 0) ? E[i + MW] : 0;
    let cu = U(c);
    // textura de superficie dispersa (no ordenada): rizos y guijarros en arena, matas en el verde, cristales en la sal
    const hz = hash2(x, y, 13);
    if (ri === 0 || ri === 4) { if (hz < 0.05) cu = sh(c, -0.12); else if (hz > 0.975) cu = sh(c, 0.1); else if (ri === 4 && Math.sin(x * 0.35 + y * 0.9 + fbm(x * 0.05, y * 0.05, 2, 8) * 6) > 0.94) cu = sh(c, -0.1); }
    else if (ri === 2) { if (hz < 0.08) cu = sh(c, 0.16); else if (hz > 0.95) cu = sh(c, -0.14); }
    else if (ri === 1) { if (hz < 0.05) cu = U('#fff2f8'); else if (hz > 0.97) cu = sh(c, -0.12); }
    else if (ri === 3) { if (hz < 0.06) cu = sh(c, -0.14); else if (hz > 0.975) cu = sh(c, 0.12); }
    if (eUp > e) cu = sh(c, -0.18);          // sombra de contacto al pie de la terraza de atrás
    else if (e > eN) cu = sh(c, 0.14);       // borde frontal iluminado
    if (ys >= 0) { pb.data[ys * MW + X] = cu; ZB[ys * MW + X] = y; }
    if (e > eN) {
      const F = FACE[ri], hgt = e - eN;
      for (let k = 1; k <= hgt; k++) {
        const yy = ys + k; if (yy < 0 || yy >= MH) continue;
        let col = k === 1 ? F[0] : k <= 1 + hgt * 0.45 ? F[1] : k < hgt ? F[2] : F[3];
        if (hgt > 4 && k > 1 && k < hgt && ((yy + (X >> 3)) % 4) === 0) col = F[2];
        pb.data[yy * MW + X] = U(col); ZB[yy * MW + X] = y;
      }
    }
  }
  const Ew = (x, y) => { const X = Math.round(x) + PAD, yy = Math.round(y); return (X >= 0 && X < MW && yy >= 0 && yy < MH && D[yy * MW + X] < 0) ? E[yy * MW + X] : 0; };
  // punto de mundo → píxel del lienzo (sobre el relieve) y prueba de oclusión
  const P = (x, y) => {
    const e = Ew(x, y), X = Math.round(x) + PAD, Y = Math.round(y) - e;
    return { X, Y, vis: X >= 0 && X < MW && Y >= 0 && Y < MH && ZB[Y * MW + X] <= Math.round(y) + 1 };
  };
  const land = (x, y) => { const X = Math.round(x) + PAD, yy = Math.round(y); return X >= 0 && X < MW && yy >= 0 && yy < MH && D[yy * MW + X] < -0.03; };
  // posición de mundo de cada nodo: el punto de la superficie que se ve en (n.x, n.y)
  const NW = MAP_NODES.map(n => { let yw = n.y; for (let k = 0; k < 5; k++) yw = n.y + Ew(n.x, yw); return { x: n.x, y: yw }; });
  // caminos sobre el relieve (2 px: tierra + borde en sombra), solo donde se ven
  for (const [a, b] of MAP_LINKS) {
    const A = NW[a], B = NW[b], len = Math.ceil(dist(A.x, A.y, B.x, B.y));
    for (let k = 0; k <= len; k++) {
      const x = lerp(A.x, B.x, k / len), y = lerp(A.y, B.y, k / len);
      if (!land(x, y)) continue;
      const q = P(x, y); if (!q.vis) continue;
      pb.set(q.X, q.Y, '#d4853c'); pb.set(q.X, q.Y + 1, '#8d4a2d');
    }
  }
  const nearNode = (x, y, rr = 13) => NW.some(n => Math.abs(n.x - x) < rr && Math.abs(n.y - y) < rr);
  const items = [];
  const add = (x, y, fn) => items.push({ x, y, fn });
  const r = RNG(77);
  // ciudad de la cúpula (Plaza de Aridia): casas en 3/4 con tejado, pared y lateral en sombra
  const WALL = ['#fff6d8', '#f8d677', '#ff9a8a', '#a6f4ff', '#c2f58e', '#f7c08e'], ROOF = ['#d8343c', '#c97c38', '#20d6c7', '#8d6bff', '#e05a3c'];
  for (let k = 0; k < 70; k++) {
    const x = 190 + r.int(-36, 36), y = 152 + r.int(-24, 30);
    if (!land(x, y) || nearNode(x, y, 10) || Math.hypot(x - 198, y - 150) < 13) continue;
    const wc = r.pick(WALL), rc = r.pick(ROOF), win = r.chance(0.5);
    add(x, y, (X, Y) => {
      pb.rect(X, Y - 5, 5, 2, rc); pb.hline(X, X + 4, Y - 5, shade(rc, 0.3));
      pb.rect(X, Y - 3, 5, 3, wc); pb.vline(X + 4, Y - 3, Y - 1, shade(wc, -0.32)); pb.set(X + 2, Y - 1, '#3a1a10');
      if (win) pb.set(X + 1, Y - 2, '#ffe14d');
      pb.hline(X + 1, X + 5, Y, shade('#c97c38', -0.3));
    });
  }
  add(198, 150, (X, Y) => {
    // cúpula de vidrio de la Ciudadela de Aridia con torres
    pb.rect(X - 11, Y - 2, 23, 3, '#fff6d8'); pb.hline(X - 11, X + 11, Y - 2, '#ffffff'); pb.hline(X - 11, X + 11, Y, '#c8b088');
    for (let dy = -10; dy <= -3; dy++) { const hw = Math.round(Math.sqrt(Math.max(0, 64 - (dy + 2) ** 2)) * 1.1); for (let dx = -hw; dx <= hw; dx++) { const u = (dx + hw) / Math.max(1, 2 * hw); pb.set(X + dx, Y + dy, u < 0.3 && dy < -6 ? '#e6fdff' : u < 0.62 ? '#8cf4ec' : u < 0.85 ? '#40d0d4' : '#16768c'); } }
    pb.set(X - 3, Y - 9, '#ffffff'); pb.set(X - 4, Y - 8, '#ffffff');
    for (const tx of [-14, 14]) { pb.vline(X + tx, Y - 14, Y - 1, '#fffaf0'); pb.vline(X + tx + 1, Y - 13, Y - 1, '#a8c8e8'); pb.set(X + tx, Y - 15, '#56e5ff'); }
  });
  // toma costera: muelle hacia el mar con torre de captación
  add(104, 200, (X, Y) => {
    for (let k = 0; k < 22; k++) { pb.set(X - k, Y - 1, '#c97c38'); pb.set(X - k, Y, '#7e4429'); if (k % 4 === 0) pb.vline(X - k, Y + 1, Y + 3, '#5a2e22'); }
    pb.rect(X - 26, Y - 7, 5, 8, '#e6f0f7'); pb.vline(X - 22, Y - 7, Y, '#8aa0b8'); pb.hline(X - 26, X - 22, Y - 7, '#ffffff'); pb.set(X - 24, Y - 9, '#56e5ff');
  });
  // planta de ósmosis: tanques cilíndricos, nave y tubería de permeado
  add(150, 252, (X, Y) => {
    pb.rect(X - 14, Y - 8, 12, 6, '#d8e4ee'); pb.hline(X - 14, X - 3, Y - 8, '#ffffff'); pb.rect(X - 14, Y - 9, 12, 1, '#56e5ff'); pb.vline(X - 3, Y - 8, Y - 3, '#8aa0b8');
    for (let k = 0; k < 4; k++) { const tx = X + k * 6; pb.rect(tx - 2, Y - 7, 5, 6, '#c8d8e4'); pb.vline(tx - 2, Y - 7, Y - 2, '#ffffff'); pb.vline(tx + 2, Y - 7, Y - 2, '#7a90a8'); pb.ellipse(tx, Y - 7, 2.5, 1.2, '#e6f0f7'); pb.set(tx - 1, Y - 8, '#ffffff'); }
    pb.hline(X - 14, X + 22, Y - 1, '#22dbe7');
  });
  // salinas: espejos rosados con costra blanca
  for (let k = 0; k < 7; k++) { const x = 196 + k * 11, y = 288 + (k % 2) * 5; if (land(x, y)) add(x, y, (X, Y) => { pb.rect(X, Y - 3, 9, 4, '#f78acb'); pb.rect(X + 1, Y - 3, 7, 2, '#ffd8ec'); pb.hline(X, X + 8, Y - 4, '#fff2f8'); pb.hline(X, X + 8, Y + 1, '#86346c'); pb.set(X + 2, Y - 2, '#ffffff'); }); }
  // campo FV: filas de módulos inclinados con patas
  for (let k = 0; k < 8; k++) for (let j = 0; j < 3; j++) { const x = 326 + k * 9, y = 202 + j * 8 + (k % 2); if (land(x, y) && !nearNode(x, y, 9)) add(x, y, (X, Y) => { pb.rect(X, Y - 4, 7, 3, '#1f469e'); pb.hline(X, X + 6, Y - 4, '#8cc4ff'); pb.set(X + 3, Y - 3, '#2c63c0'); pb.set(X + 1, Y - 1, '#3a4a6a'); pb.set(X + 5, Y - 1, '#3a4a6a'); pb.hline(X + 1, X + 7, Y, '#8d4a2d'); }); }
  // bóveda de carga: contenedores de baterías con cara superior
  for (let k = 0; k < 3; k++) add(284 + k * 9, 150 + (k % 2) * 3, (X, Y) => { pb.rect(X, Y - 5, 8, 2, '#6cb4ff'); pb.rect(X, Y - 3, 8, 3, '#2c63c0'); pb.vline(X + 7, Y - 3, Y - 1, '#16306a'); pb.hline(X + 1, X + 6, Y - 2, '#b6f05a'); pb.hline(X + 1, X + 8, Y, '#6d2f44'); });
  // ciudadela H2: esferas con patas y una nave de electrólisis
  add(488, 202, (X, Y) => { pb.rect(X - 12, Y - 6, 9, 5, '#e6f0f7'); pb.rect(X - 12, Y - 7, 9, 1, '#40d0d4'); pb.vline(X - 4, Y - 6, Y - 2, '#8aa0b8'); });
  for (let k = 0; k < 3; k++) add(494 + k * 9, 196 + (k % 2) * 6, (X, Y) => { pb.set(X - 2, Y - 1, '#5a6a8a'); pb.set(X + 2, Y - 1, '#5a6a8a'); pb.disc(X, Y - 5, 4, '#40d0d4'); pb.disc(X - 1, Y - 6, 3, '#8cf4ec'); pb.set(X - 2, Y - 7, '#d8fff8'); pb.set(X - 1, Y - 8, '#ffffff'); pb.hline(X - 2, X + 3, Y, '#8d4a2d'); });
  // oasis en bancales: parcelas con surcos
  for (let k = 0; k < 10; k++) { const x = 348 + (k % 5) * 12, y = 270 + Math.floor(k / 5) * 11; if (land(x, y) && !nearNode(x, y, 10)) add(x, y, (X, Y) => { pb.rect(X, Y - 7, 10, 8, k % 3 ? '#33a552' : '#86e36f'); for (let q = 1; q < 8; q += 3) pb.hline(X, X + 9, Y - 7 + q, '#1f854c'); pb.hline(X, X + 9, Y - 7, '#c2f58e'); pb.hline(X, X + 9, Y + 1, '#4f3a2a'); }); }
  // Mesa del Nexo: anillo de piedra en la meseta
  add(258, 104, (X, Y) => { pb.ellipse(X, Y - 2, 9, 3.5, '#b8564b'); pb.ellipse(X, Y - 3, 8, 2.8, '#eb9a6c'); pb.ellipse(X, Y - 3, 5, 1.6, '#6d2f44'); });
  // torre del núcleo SYNARA
  add(332, 190, (X, Y) => { pb.rect(X - 1, Y - 16, 3, 15, '#e6f0f7'); pb.vline(X + 1, Y - 16, Y - 2, '#8aa0b8'); pb.rect(X - 3, Y - 18, 7, 2, '#56e5ff'); pb.set(X, Y - 19, '#ffffff'); pb.hline(X - 3, X + 3, Y - 1, '#8d4a2d'); });
  // palmeras y matorral en costas y oasis
  for (let k = 0; k < 140; k++) {
    const x = r.int(70, 560), y = r.int(80, 320);
    const X = x + PAD; if (X < 0 || X >= MW) continue;
    const d = D[y * MW + X];
    if (!(d < -0.03 && d > -0.3) || nearNode(x, y, 14)) continue;
    const ri = BR[y * MW + X];
    if (ri === 3 || ri === 1) continue; // sin palmeras en mesetas ni salinas
    if (Math.hypot(x - 190, y - 152) < 40 || (x > 320 && x < 410 && y > 196 && y < 228)) continue;
    const palm = ri === 0 || ri === 4 ? r.chance(0.7) : r.chance(0.35);
    add(x, y, palm ? (X2, Y2) => {
      pb.hline(X2 + 1, X2 + 3, Y2 + 1, shade('#8d4a2d', -0.2));
      pb.vline(X2, Y2 - 5, Y2, '#8a5a3c'); pb.set(X2 + 1, Y2 - 3, '#5a3826');
      for (const [dx, dy, c] of [[-3, -6, '#1f854c'], [-2, -7, '#33a552'], [-1, -7, '#4ccb70'], [1, -7, '#4ccb70'], [2, -7, '#33a552'], [3, -6, '#1f854c'], [0, -8, '#86e36f'], [-1, -6, '#156647'], [1, -6, '#156647'], [0, -6, '#33a552'], [-4, -5, '#156647'], [4, -5, '#156647']]) pb.set(X2 + dx, Y2 + dy, c);
    } : (X2, Y2) => {
      pb.hline(X2 - 1, X2 + 2, Y2 + 1, '#4f3a2a');
      pb.rect(X2 - 1, Y2 - 2, 3, 3, '#156647'); pb.set(X2, Y2 - 3, '#33a552'); pb.set(X2 - 1, Y2 - 2, '#33a552'); pb.set(X2, Y2 - 2, '#86e36f');
    });
  }
  // dioramas en orden de profundidad, solo si su base se ve
  items.sort((a, b) => a.y - b.y);
  for (const it of items) { const q = P(it.x, it.y); if (q.vis) it.fn(q.X, q.Y); }
  // rosa de los vientos
  const rx = 590 + PAD, ry = 300;
  pb.ellipseOutline(rx, ry, 14, 14, '#fff6d8'); pb.poly([[rx, ry - 20], [rx + 4, ry], [rx, ry + 20], [rx - 4, ry]], '#fff6d8'); pb.poly([[rx - 20, ry], [rx, ry - 4], [rx + 20, ry], [rx, ry + 4]], '#ffd84a');
  pb.poly([[rx, ry - 20], [rx + 4, ry], [rx - 4, ry]], '#ff6b6b');
  // sombras de nube: cúmulos en dos bandas de alfa plano, violeta
  const clouds = [];
  for (let ci = 0; ci < 3; ci++) {
    const cw = 120 + ci * 20, chh = 44, cb = new PixelBuffer(cw, chh), rr = RNG(500 + ci);
    const blobs = []; for (let k = 0; k < 5; k++) blobs.push([rr.int(20, cw - 20), rr.int(16, chh - 14), rr.int(14, 24), rr.int(8, 12)]);
    const inside = (x, y, grow) => blobs.some(([bx, by, ax, ay]) => ((x - bx) / (ax + grow)) ** 2 + ((y - by) / (ay + grow)) ** 2 <= 1);
    const outer = ((40 << 24) | (0x52 << 16) | (0x1a << 8) | 0x24) >>> 0, inner = ((66 << 24) | (0x52 << 16) | (0x1a << 8) | 0x24) >>> 0;
    for (let y = 0; y < chh; y++) for (let x = 0; x < cw; x++) { if (inside(x, y, -4)) cb.data[y * cw + x] = inner; else if (inside(x, y, 0)) cb.data[y * cw + x] = outer; }
    clouds.push(cb.toCanvas());
  }
  return { c: pb.toCanvas(), clouds };
}
const WorldMapScene = {
  touchControls: false,
  enter(p) {
    this.t = 0; this.sel = p.focus ?? GS.s.unlocked[GS.s.unlocked.length - 1] ?? 0;
    if (!GS.s.unlocked.includes(this.sel)) this.sel = 0;
    this.build(); this.ps = new Particles(200);
    Audio2.playMusic('title'); Audio2.setAmbience({ sea: 0.4, wind: 0.3, birds: 0.2 });
    GS.s.scene = 'map';
  },
  build() {
    if (BG_CACHE.has('worldmap3')) { const C = BG_CACHE.get('worldmap3'); this.mapC = C.c; this.cloudC = C.clouds; return; }
    const C = FIXUI_buildMap();
    this.mapC = C.c; this.cloudC = C.clouds;
    BG_CACHE.set('worldmap3', C);
  },
  update(dt) {
    this.t += dt; this.ps.update(dt);
    const avail = MAP_NODES.filter(n => GS.s.unlocked.includes(n.id) && LEVELS[n.id]);
    const cur = MAP_NODES[this.sel];
    let dir = null;
    if (Input.pressed('uiLeft')) dir = [-1, 0]; if (Input.pressed('uiRight')) dir = [1, 0]; if (Input.pressed('uiUp')) dir = [0, -1]; if (Input.pressed('uiDown')) dir = [0, 1];
    if (dir) {
      let best = null, bd = 1e9;
      for (const n of avail) { if (n === cur) continue; const dx = n.x - cur.x, dy = n.y - cur.y; const along = dx * dir[0] + dy * dir[1]; if (along <= 0) continue; const d = along + Math.abs(dx * dir[1] + dy * dir[0]) * 1.5; if (d < bd) { bd = d; best = n; } }
      if (best) { this.sel = best.id; Audio2.sfx('uiMove'); }
    }
    if (Input.pressed('next')) { const i = avail.findIndex(n => n.id === this.sel); this.sel = avail[(i + 1) % avail.length].id; Audio2.sfx('uiMove'); }
    // el mapa se desplaza lejos del panel de información para que ningún nodo quede tapado
    const tox = MAP_NODES[this.sel].x > W / 2 ? FIXUI_MAP_OX_R : FIXUI_MAP_OX_L;
    this.ox = this.ox == null ? tox : approach(this.ox, tox, Math.max(2, Math.abs(tox - this.ox) * 6) * dt);
    const ox = Math.round(this.ox);
    if (Input.pointer.pressed && Input.pointer.y < MAP_STRIP_Y) for (const n of avail) if (dist(Input.pointer.x, Input.pointer.y, n.x + ox, n.y + MAP_OY) < 12) { if (this.sel === n.id) this.enterLevel(); else { this.sel = n.id; Audio2.sfx('uiMove'); } Input.consumePointer(); }
    if (Input.pressed('confirm') && !Gui.focus) this.enterLevel();
    if (Input.pressed('codex')) Game.push(CodexScene, {});
    if (Input.pressed('data')) Game.push(EvidenceScene, {});
    if (Input.pressed('pause')) Game.push(MapMenuScene, {});
    if (Input.keyPressed('F9')) Game.push(TeacherScene, {});
    if (Math.random() < 0.1) this.ps.emit('spark', MAP_NODES[this.sel].x + ox + (Math.random() - 0.5) * 16, MAP_NODES[this.sel].y + MAP_OY + (Math.random() - 0.5) * 16, 0, -10, 1);
  },
  enterLevel() {
    const id = this.sel;
    if (!LEVELS[id]) { Game.toast('Capítulo en construcción', 'lock', '#8a8fb8'); return; }
    if (!GS.s.unlocked.includes(id)) { Game.toast('Capítulo bloqueado', 'lock', '#8a8fb8'); Audio2.sfx('error'); return; }
    Audio2.sfx('confirm');
    Game.transition(() => Game.setScene(GameplayScene, { level: id }));
  },
  render(g) {
    const t = this.t, OY = MAP_OY;
    if (this.ox == null) this.ox = MAP_NODES[this.sel].x > W / 2 ? FIXUI_MAP_OX_R : FIXUI_MAP_OX_L;
    const ox = Math.round(this.ox);
    g.drawImage(this.mapC, ox - FIXUI_MAP_PAD, OY);
    drawSeaSparkles(g, 0, 0, W, MAP_STRIP_Y, t, 0.5, ['#c6fff2', '#ffffff']);
    // sombras de nube: siluetas de cúmulo en dos bandas planas, teñidas hacia el violeta (sin discos sucios)
    for (let i = 0; i < 3; i++) { const cl = this.cloudC[i % this.cloudC.length]; const x = ((t * (5 + i * 2) + i * 230) % (W + 260)) - 180, y = 30 + i * 78; g.drawImage(cl, Math.round(x), Math.round(y)); }
    // enlaces SYNARA animados
    MAP_LINKS.forEach(([a, b], i) => {
      const A = MAP_NODES[a], B = MAP_NODES[b];
      const on = GS.s.unlocked.includes(a) && GS.s.unlocked.includes(b);
      const n = Math.ceil(dist(A.x, A.y, B.x, B.y) / 3);
      for (let k = 0; k < n; k++) { const ph = (k / n + t * 0.4 + i * 0.13) % 1; const x = lerp(A.x, B.x, k / n) + ox, y = lerp(A.y, B.y, k / n) + OY; if (on && ph < 0.08) fpx(g, x, y - 1, i % 2 ? '#56e5ff' : '#ffe14d'); }
    });
    for (let i = 0; i < 5; i++) ART.turbine(g, 400 + i * 14 + ox, 86 + (i % 2) * 8 + OY, 10, t * 2 + i, { col: '#fffaf0', shade: '#cfe8ee' });
    // nodos: islas-nodo con anillo del color del capítulo
    for (const n of MAP_NODES) {
      const un = GS.s.unlocked.includes(n.id), done = GS.s.completed.includes(n.id), sel = this.sel === n.id;
      const nx = n.x + ox, ny = n.y + OY, acc = LEVEL_CARD_ACCENT[n.id] || '#56e5ff';
      g.globalAlpha = un ? 0.4 : 0.18; fdisc(g, nx, ny + 3, 12, acc); g.globalAlpha = 1;
      fdisc(g, nx, ny, 10, '#000633'); fdisc(g, nx, ny, 9, done ? '#ffd23a' : un ? acc : '#3a4a6a'); fdisc(g, nx, ny, 7, done ? '#553a08' : un ? '#06183a' : '#0a1222');
      if (un) Icons.draw(g, n.icon, nx - 7, ny - 7); else { g.globalAlpha = 0.5; Icons.draw(g, n.icon, nx - 7, ny - 7); g.globalAlpha = 1; Icons.draw(g, 'lock', nx + 1, ny - 1); }
      if (sel) { for (let a = 0; a < 16; a++) { const an = a / 16 * TAU + t * 2; fpx(g, nx + Math.cos(an) * (14 + Math.sin(t * 6)), ny + Math.sin(an) * (14 + Math.sin(t * 6)), a % 2 ? '#fff2a0' : '#ffd23a'); } }
      UIK.pill(g, nx, ny + 11, String(n.id).padStart(2, '0'), { align: 'center', rim: un ? acc : '#3a4a6a', fill: '#031128', color: '#e8fcff' });
    }
    this.ps.render(g);
    Gui.begin();
    // título del mapa (arriba a la izquierda) y atajos con icono (arriba a la derecha)
    UIK.panel(g, 6, 6, 150, 22, 'hud', null, { chamfer: 2, key: false });
    UIK.badge(g, 'map', 3, 3, 22, 'hud');
    drawText(g, 'MAPA DEL NEXO', 30, 13, { font: 'bold', color: '#edfcfe' });
    const items = [['Atlas del Nexo', 'book', () => Game.push(CodexScene, {})], ['Tablero de Evidencias', 'eye', () => Game.push(EvidenceScene, {})], ['Mi aprendizaje', 'chart', () => Game.push(AnalyticsScene, {})], ['Sala de práctica', 'flask', () => Game.push(PracticeScene, {})], ['Menú', 'gear', () => Game.push(MapMenuScene, {})]];
    items.forEach(([l, ic, fn], i) => { if (Gui.pbutton(g, 'mb' + i, W - 6 - (items.length - i) * 25, 6, 23, 22, '', { icon: ic, style: 'primary', tip: l })) fn(); });
    // panel de información del capítulo
    const n = MAP_NODES[this.sel], M = LEVEL_META[n.id];
    const pw = 184, px = n.x > W / 2 ? 8 : W - pw - 8, py = 38, ph = 248;
    const un = GS.s.unlocked.includes(n.id), done = GS.s.completed.includes(n.id);
    UIK.panel(g, px, py, pw, ph, 'tech');
    UIK.badge(g, n.icon, px - 3, py - 3, 22, 'tech');
    drawText(g, M.chapter, px + 26, py + 5, { font: 'tiny', color: '#ffd23a' });
    drawText(g, fitText(M.title, pw - 34, 'bold'), px + 26, py + 12, { font: 'bold', color: '#e6f8fe' });
    frect(g, px + 22, py + 22, pw - 28, 1, '#12305a'); frect(g, px + 22, py + 23, pw - 28, 1, '#0b2a58');
    const thumb = LevelThumbs.get(n.id);
    frect(g, px + 8, py + 28, 72, 43, '#000633'); if (thumb) g.drawImage(thumb, px + 9, py + 29); else frect(g, px + 9, py + 29, 70, 41, '#0a2450');
    if (!un) { g.globalAlpha = 0.6; frect(g, px + 9, py + 29, 70, 41, '#000633'); g.globalAlpha = 1; Icons.draw(g, 'lock', px + 37, py + 43); }
    drawTextBlock(g, n.name, px + 86, py + 30, pw - 94, { color: '#8fdfff' });
    UIK.pill(g, px + 86, py + 56, done ? 'COMPLETADO' : un ? (LEVELS[n.id] ? 'DISPONIBLE' : 'EN CONSTRUCCIÓN') : 'BLOQUEADO', { rim: done ? '#ffd23a' : un ? '#3fe0a0' : '#3a5a8a', fill: done ? '#1a1404' : un ? '#073d2e' : '#061a38', color: done ? '#fff2c0' : un ? '#c2f5de' : '#93a6c8', icon: done ? 'star' : un ? 'check' : 'lock' });
    if (done) drawText(g, fitText(M.badge, pw - 20, 'tiny'), px + 10, py + 76, { font: 'tiny', color: '#ffd23a' });
    let yy = py + 86;
    yy += drawTextBlock(g, '{y}' + M.ra + '{/} ' + RA[M.ra], px + 10, yy, pw - 20, { color: UI_INK.body, font: 'main' }) + 6;
    const cs = RA_CONCEPTS[M.ra] || [];
    yy = Math.min(yy, py + ph - 70);
    for (const c of cs.slice(0, 3)) { drawText(g, fitText(MASTERY_LABELS[c], pw - 76, 'tiny'), px + 10, yy, { font: 'tiny', color: '#b8c8e8' }); UIK.bar(g, px + pw - 60, yy - 1, 50, 6, (GS.s.mastery ? GS.s.mastery[c] : 0) / 100, '#3fe0a0'); yy += 10; }
    if (Gui.button(g, 'enter', px + 10, py + ph - 30, pw - 20, 22, done ? 'Volver a jugar' : 'Entrar al capítulo', { style: un && LEVELS[n.id] ? 'good' : 'ghost', icon: 'play', disabled: !un || !LEVELS[n.id] })) this.enterLevel();
    // tira inferior de tarjetas de capítulo (como en la referencia)
    frect(g, 0, MAP_STRIP_Y, W, H - MAP_STRIP_Y, '#00152c'); frect(g, 0, MAP_STRIP_Y, W, 1, '#101220'); frect(g, 0, MAP_STRIP_Y + 1, W, 1, '#1e5a8a'); frect(g, 0, MAP_STRIP_Y + 2, W, 1, '#0a2444');
    const ids = MAP_NODES.map(m => m.id).sort((a, b) => a - b);
    const vis = 8, first = clamp(ids.indexOf(this.sel) - 3, 0, Math.max(0, ids.length - vis));
    if (first > 0) { frect(g, 1, MAP_STRIP_Y + 30, 3, 7, '#8fdfff'); fpx(g, 0, MAP_STRIP_Y + 33, '#8fdfff'); }
    if (first + vis < ids.length) { frect(g, W - 4, MAP_STRIP_Y + 30, 3, 7, '#8fdfff'); fpx(g, W - 1, MAP_STRIP_Y + 33, '#8fdfff'); }
    const cur = GS.s.unlocked.filter(i => LEVELS[i] && !GS.s.completed.includes(i)).sort((a, b) => a - b)[0];
    for (let k = 0; k < vis && first + k < ids.length; k++) {
      const id = ids[first + k], cx = 6 + k * 79, cy = MAP_STRIP_Y + 5;
      const st = GS.s.completed.includes(id) ? 'done' : !GS.s.unlocked.includes(id) ? 'locked' : id === cur ? 'current' : 'open';
      UIK.levelCard(g, cx, cy, 74, 57, { id, label: LEVEL_CARD_NAME[id], state: st, selected: this.sel === id });
      if (Gui.pbutton(g, 'card' + id, cx, cy, 74, 57, '', { noDraw: true, tip: LEVEL_META[id].chapter + ' · ' + LEVEL_META[id].title })) { if (this.sel === id) this.enterLevel(); else { this.sel = id; Audio2.sfx('uiMove'); } }
    }
    Gui.end();
    Gui.renderTooltip(g);
  },
};
const MapMenuScene = {
  overlay: true,
  enter() { },
  update() { if (Input.pressed('cancel')) Game.pop(); },
  render(g) {
    UIK.scrim(g, 0.6);
    const x = W / 2 - 100, w = 200;
    UIK.panel(g, x, 70, w, 152, 'tech');
    UIK.header(g, x, 70, w, 'MENÚ', 'tech', 'gear');
    Gui.begin();
    let y = 96;
    const B = (id, l, ic, fn) => { if (Gui.button(g, id, x + 16, y, w - 32, 20, l, { icon: ic, align: 'left' })) fn(); y += 24; };
    B('back', 'Volver al mapa', 'map', () => Game.pop());
    B('save', 'Guardar partida', 'save', () => { GS.save(); });
    B('sett', 'Ajustes y accesibilidad', 'gear', () => Game.push(SettingsScene, {}));
    B('teach', 'Modo docente', 'chart', () => Game.push(TeacherScene, {}));
    B('title', 'Guardar y salir al título', 'play', () => { GS.save(); Game.pop(); Game.transition(() => Game.setScene(TitleScene)); });
    Gui.end();
  },
};

/* =====================================================================
   AJUSTES Y ACCESIBILIDAD
   ===================================================================== */
const SettingsScene = {
  overlay: true,
  enter() { this.tab = 'general'; this.rebind = null; },
  update() {
    if (this.rebind) {
      const k = Input.typedKeys[0];
      if (k) { if (k !== 'Escape') { Input.bindings[this.rebind] = [k].concat((Input.bindings[this.rebind] || []).filter(c => c !== k).slice(0, 1)); Audio2.sfx('confirm'); } this.rebind = null; Game.saveSettings(); }
      return;
    }
    if (Input.pressed('cancel')) { Game.saveSettings(); Game.pop(); }
  },
  render(g) {
    const S = Game.settings;
    UIK.scrim(g, 0.72);
    UIK.panel(g, 30, 14, W - 60, H - 28, 'tech');
    UIK.header(g, 30, 14, W - 60, 'AJUSTES Y ACCESIBILIDAD', 'tech', 'gear');
    Gui.begin();
    ['general', 'accesibilidad', 'controles'].forEach((t, i) => { if (Gui.button(g, 'tab' + t, 40 + i * 120, 36, 112, 16, t.toUpperCase(), { style: 'tab', selected: this.tab === t })) this.tab = t; });
    let y = 60;
    const x = 44, w = 260;
    if (this.tab === 'general') {
      S.music = Gui.slider(g, 'mus', x, y, w, S.music, 0, 1, 0.05, { label: 'Música', fmt: v => fmt0(v * 100) + ' %' }); y += 26;
      S.sfx = Gui.slider(g, 'sfx', x, y, w, S.sfx, 0, 1, 0.05, { label: 'Efectos', fmt: v => fmt0(v * 100) + ' %' }); y += 26;
      S.ambience = Gui.slider(g, 'amb', x, y, w, S.ambience, 0, 1, 0.05, { label: 'Ambiente (mar, viento…)', fmt: v => fmt0(v * 100) + ' %' }); y += 26;
      S.dialogSpeed = Gui.slider(g, 'dsp', x, y, w, S.dialogSpeed, 0.5, 3, 0.25, { label: 'Velocidad de diálogo', fmt: v => '×' + fmt(v, 2) }); y += 28;
      S.autoAdvance = Gui.toggle(g, 'auto', x, y, 'Avance automático de diálogos', S.autoAdvance); y += 18;
      S.showFps = Gui.toggle(g, 'fps', x, y, 'Mostrar FPS', S.showFps); y += 18;
      Audio2.applyVolumes();
      UIK.panel(g, 326, 58, 270, 66, 'sheet', null, { chamfer: 2, key: false });
      drawTextBlock(g, 'El audio solo se activa después de tu primera interacción. Todo el progreso se guarda localmente (localStorage) y nunca se envía a ningún servidor.', 334, 64, 256, { color: UI_INK.body });
    } else if (this.tab === 'accesibilidad') {
      S.textScale = Gui.toggle(g, 'txt', x, y, 'Texto de diálogo amplio', S.textScale > 1) ? 2 : 1; y += 18;
      S.reduceFlash = Gui.toggle(g, 'rf', x, y, 'Reducir destellos', S.reduceFlash); y += 18;
      S.reduceShake = Gui.toggle(g, 'rs', x, y, 'Reducir sacudidas de cámara', S.reduceShake); y += 18;
      S.highContrast = Gui.toggle(g, 'hc', x, y, 'Alto contraste en gráficos', S.highContrast); y += 18;
      S.cbPalette = Gui.toggle(g, 'cb', x, y, 'Paleta para daltonismo (patrones en flujos)', S.cbPalette); y += 18;
      S.noTimeLimit = Gui.toggle(g, 'nt', x, y, 'Modo sin tiempo (retos sin límite)', S.noTimeLimit); y += 18;
      S.subtitles = Gui.toggle(g, 'sub', x, y, 'Subtítulos y anuncios para lector de pantalla', S.subtitles); y += 22;
      drawText(g, 'Controles táctiles:', x, y + 2, { color: UI_INK.dim });
      ['auto', 'on', 'off'].forEach((m, i) => { if (Gui.button(g, 'tc' + m, x + 120 + i * 50, y, 46, 14, m === 'auto' ? 'AUTO' : m === 'on' ? 'SÍ' : 'NO', { style: S.touch === m ? 'gold' : 'ghost' })) { S.touch = m; Input.touchMode = m === 'on' || (m === 'auto' && Input.lastDevice === 'touch'); } }); y += 20;
      S.touchScale = Gui.slider(g, 'tsc', x, y, w, S.touchScale || 1, 0.8, 1.6, 0.1, { label: 'Tamaño de botones táctiles', fmt: v => '×' + fmt(v, 1) }); y += 26;
      UIK.panel(g, 326, 58, 270, 78, 'sheet', null, { chamfer: 2, key: false });
      drawTextBlock(g, 'Todos los indicadores usan iconos y texto además de color. La pausa (ESC) está disponible en cualquier reto no crítico. El tutorial de cada capítulo puede repetirse desde el mapa.', 334, 64, 256, { color: UI_INK.body });
    } else {
      const acts = Object.keys(ACTION_LABELS);
      acts.forEach((a, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const bx = x + col * 280, by = y + row * 18;
        drawText(g, ACTION_LABELS[a], bx, by + 3, { color: UI_INK.body });
        const lbl = this.rebind === a ? 'Pulsa una tecla…' : (Input.bindings[a] || []).map(keyName).join(' / ');
        if (Gui.button(g, 'rb' + a, bx + 130, by, 130, 15, lbl, { style: this.rebind === a ? 'gold' : 'ghost' })) this.rebind = a;
      });
      if (Gui.button(g, 'rbreset', x, H - 64, 180, 16, 'Restaurar teclas por defecto', { style: 'danger', icon: 'reset' })) { Input.bindings = deepClone(DEFAULT_BINDINGS); Game.saveSettings(); }
      drawText(g, 'Gamepad: A saltar · X interactuar · B herramienta · Y lente · START pausa', x, H - 40, { font: 'tiny', color: UI_INK.dim });
    }
    if (Gui.button(g, 'close', W - 140, H - 40, 100, 18, 'Guardar', { style: 'good', icon: 'save' })) { Game.saveSettings(); Game.pop(); }
    Gui.end();
  },
};
