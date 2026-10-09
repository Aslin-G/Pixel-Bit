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
    const k = 'title_bg';
    if (BG_CACHE.has(k)) { Object.assign(this, BG_CACHE.get(k)); return; }
    const horizon = 196;
    const sky = makeSkyCanvas(RAMP.skyDusk, horizon, { sun: { x: 412, y: 168, r: 22, cols: ['#fff6d8', '#ffe08a', '#ffb862'], halo: '#ffd28d' }, curve: 1.05, stars: 40, seed: 3 });
    // capa lejana: promontorio y mesetas en contraluz violeta
    const far = new PixelBuffer(W, H);
    const farPal = ['#3a2a6a', '#4e3480', '#6a3e8e', '#8a4a96', '#b05a96', '#d06e94', '#e88a92'];
    ART.ridge(far, (x) => 176 - Math.max(0, 1 - Math.abs(x - 90) / 120) * 40 - fbm1(x * 0.04, 3, 3) * 10 + (x > 240 ? 26 : 0) - (x > 520 ? Math.max(0, (x - 520) * 0.3) : 0), farPal, { mesa: true, baseIdx: 3, strata: 6 });
    // mar con reflejo del sol
    const sea = new PixelBuffer(W, H - horizon);
    ART.sea(sea, 0, sea.h, ['#2a2a6e', '#3a3a88', '#5a4a9a', '#8a5aa0', '#c06a9a', '#e88a92'], { invert: true });
    // ciudad y SYNARA (capa media)
    const mid = new PixelBuffer(W, H);
    const landY = 236;
    ART.ridge(mid, (x) => landY - 10 - Math.sin(x * 0.012) * 8 - fbm1(x * 0.02, 3, 8) * 8 - Math.max(0, 1 - Math.abs(x - 470) / 140) * 26, ['#2a1838', '#3e2048', '#5a2c52', '#7a3a58', '#a24a5a', '#c8645e'], { baseIdx: 3 });
    const r = RNG(5);
    for (let i = 0; i < 26; i++) {
      const x = 330 + i * 11 + r.int(-3, 3), w = r.int(8, 16), h = r.int(10, 30) + Math.max(0, 30 - Math.abs(x - 470) * 0.3);
      const base = landY - 6 - Math.max(0, 1 - Math.abs(x - 470) / 140) * 24;
      ART.house(mid, x, Math.round(base), w, Math.round(h), i * 13, { pal: HOUSE_COLS[i % 7].map(c => mixHex(c, '#7a3a78', 0.45)), night: true });
    }
    // torre SYNARA
    const tx = 470, tb = landY - 34;
    for (let y = tb - 92; y < tb; y++) { const w = 3 + Math.round((y - (tb - 92)) / 30); mid.rect(tx - w, y, w * 2, 1, '#d8d0ec'); mid.rect(tx + w - 2, y, 2, 1, '#9a8ab8'); }
    mid.ellipse(tx, tb - 70, 14, 4, '#56e5ff'); mid.ellipse(tx, tb - 70, 11, 2.5, '#0e2b4a'); mid.ellipse(tx, tb - 92, 5, 5, '#e6fdff');
    // planta desalinizadora junto a la costa
    for (let i = 0; i < 4; i++) ART.tank(mid, 560 + i * 16, landY - 4, 12, 18 - i % 2 * 4, ART.hazeRamp(RAMP.steelW, '#c06a9a', 0.35));
    // campo FV en las dunas (izquierda)
    for (let k = 0; k < 5; k++) ART.pvRow(mid, 180 + k * 8, landY - 2 - k * 3, 60, k, { tilt: 5, depth: 4 });
    // salinas rosadas en primer plano medio
    const fg = new PixelBuffer(W, H);
    for (let y = 262; y < H; y++) for (let x = 0; x < W; x++) {
      const t = (y - 262) / 98;
      const n = fbm(x * 0.03, y * 0.06, 3, 7);
      let c = rampDither(['#8a3e78', '#b44d88', '#dc6aa4', '#f78acb', '#fbb0da', '#ffd8ec'], 0.35 + t * 0.4 + (n - 0.5) * 0.5, x, y);
      if (n > 0.63 && ((x + y) & 1)) c = '#ffffff';
      fg.set(x, y, c);
    }
    // espejo de agua de las salinas
    for (let y = 270; y < 300; y++) for (let x = 230; x < 600; x++) { const d = ((x - 415) / 185) ** 2 + ((y - 285) / 15) ** 2; if (d < 1) fg.set(x, y, rampDither(['#e88a92', '#ffb862', '#ffe08a', '#fff6d8'], 1 - d, x, y)); }
    // promontorio rocoso (izquierda) con flora
    const rock = new PixelBuffer(W, H);
    ART.ridge(rock, (x) => x < 250 ? 248 + Math.pow(Math.max(0, x - 120) / 130, 2) * 120 - fbm1(x * 0.05, 3, 11) * 10 : 400, ['#140a20', '#24122e', '#3a1a3a', '#5a2440', '#8a3446', '#b8504a'], { mesa: true, baseIdx: 2, strata: 5 });
    // borde iluminado por el sol
    for (let x = 0; x < 250; x++) for (let y = 0; y < H; y++) { if (rock.alpha(x, y)) { rock.set(x, y, '#ffb862'); if (rock.alpha(x, y + 1)) rock.set(x, y + 1, '#e86a5a'); break; } }
    ART.cactus(rock, 30, 252, 34, 7, ['#140a20', '#2a1a2a', '#3e2438', '#5a3048', '#7a4058', '#a05a68', '#c87a78']);
    ART.agave(rock, 190, 262, 10, ['#140a20', '#2a1a2a', '#3e2438', '#5a3048', '#8a5068', '#ffb862']);
    ART.nopal(rock, 222, 270, 4, 9, ['#140a20', '#2a1a2a', '#3e2438', '#5a3048', '#8a5068', '#c87a78', '#ffb862']);
    const o = { sky, far: far.toCanvas(), sea: sea.toCanvas(), mid: mid.toCanvas(), fg: fg.toCanvas(), rock: rock.toCanvas(), horizon };
    o.clouds = [];
    for (let i = 0; i < 7; i++) { const w = 60 + i * 13 % 50, h = Math.round(w * 0.36); o.clouds.push({ c: ART.cloudSprite(w, h, 90 + i, CLOUD_PALS.dusk).toCanvas(), x: (i * 113) % W, y: 30 + (i * 37) % 90, s: 2 + i % 3, w }); }
    BG_CACHE.set(k, o);
    Object.assign(this, o);
  },
  update(dt) {
    this.t += dt; this.ps.update(dt);
    if (Math.random() < 0.15) this.ps.emit('salt', Math.random() * W, 270 + Math.random() * 80, 6, -4, 1);
    if (Math.random() < 0.05) this.ps.emit('firefly', 300 + Math.random() * 300, 160 + Math.random() * 60, 0, 0, 1);
    if (this.menu === 'main' && Input.pressed('cancel')) { }
    if (Input.keyPressed('F9')) Game.push(TeacherScene, {});
  },
  render(g) {
    const t = this.t;
    g.drawImage(this.sky, 0, 0);
    for (const c of this.clouds) { c.x = (c.x + c.s * Game.dt) % (W + c.w); g.drawImage(c.c, Math.round(c.x - c.w), c.y); }
    g.drawImage(this.far, 0, 0);
    g.drawImage(this.sea, 0, this.horizon);
    drawSunGlitter(g, 412, this.horizon + 1, this.horizon + 50, t, '#ffe08a');
    drawSeaSparkles(g, 0, this.horizon + 2, W, 50, t, 0.8, ['#ffd28d', '#ffb862', '#fff6d8']);
    // aerogeneradores en la cresta
    for (let i = 0; i < 6; i++) ART.turbine(g, 250 + i * 22 + (i % 2) * 6, 214 - i * 2, 22 + (i % 3) * 3, t * 1.4 + i * 0.7, { col: '#e6d8f0', shade: '#9a8ab8', dark: '#5a4a7a' });
    g.drawImage(this.mid, 0, 0);
    // pulsos de la red SYNARA (líneas de energía y agua)
    const lines = [[[210, 232], [330, 226], [470, 196]], [[470, 196], [580, 224]], [[470, 196], [380, 236], [300, 250]]];
    lines.forEach((L, i) => { for (let s = 0; s < L.length - 1; s++) { const [x0, y0] = L[s], [x1, y1] = L[s + 1]; const n = 26; for (let k = 0; k < n; k++) { const ph = (k / n + t * 0.25 + i * 0.2) % 1; if (ph < 0.12) fpx(g, lerp(x0, x1, k / n), lerp(y0, y1, k / n), i === 0 ? '#ffe14d' : '#56e5ff'); } } });
    // faro de la torre
    const beam = (Math.sin(t * 2) + 1) / 2;
    fdisc(g, 470, 192 - 70 + 34 - 36, 3 + beam * 2, '#c4fbff');
    g.drawImage(this.fg, 0, 0);
    // flamencos en la salina
    for (let i = 0; i < 4; i++) ART.flamingo(g, 300 + i * 34 + Math.sin(t * 0.2 + i) * 4, 300 + (i % 2) * 8, t + i, i % 2 ? -1 : 1);
    // reflejo del sol en la salina
    for (let y = 276; y < 296; y += 2) frect(g, 404 + Math.round(Math.sin(t * 2 + y) * 3), y, 16, 1, (y + Math.floor(t * 8)) % 4 < 2 ? '#fff6d8' : '#ffe08a');
    g.drawImage(this.rock, 0, 0);
    // Amaya y KIRU sobre el promontorio, en contraluz
    drawChar(g, 'amaya', 'idle', t, 132, 268, 1, { shadow: false });
    drawChar(g, 'kiru', 'idle', t, 104, 271, 1, { shadow: false, expr: 'esperanzado' });
    // aves
    for (let i = 0; i < 6; i++) ART.bird(g, Math.round((t * (10 + i * 3) + i * 120) % (W + 40) - 20), 70 + i * 9 + Math.round(Math.sin(t + i) * 4), t + i, '#3a1a3a', '#3a1a3a');
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
      const w = 158, bh = 20, gap = 4, h = 28 + items.length * (bh + gap) + 2;
      const x = W - w - 14, y = 128;
      UIK.panel(g, x, y, w, h, 'tech');
      UIK.header(g, x, y, w, 'MENÚ', 'tech', 'map');
      let yy = y + 26;
      for (const [id, l, ic, fn, st] of items) { if (Gui.button(g, id, x + 10, yy, w - 20, bh, l, { icon: ic, style: st, align: 'left' })) fn(); yy += bh + gap; }
    } else if (this.menu === 'confirmNew') {
      const w = 260, x = W - w - 14, y = 140;
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
    frect(g, 0, 0, W, H, '#0a0718');
    for (let i = 0; i < 80; i++) fpx(g, hash1(i, 1) * W, hash1(i, 2) * H * 0.7, (Game.frame + i * 7) % 60 < 4 ? '#ffffff' : '#5a6fb0');
    const ln = this.lines[Math.min(this.i, this.lines.length - 1)];
    drawTextBlock(g, ln, 80, 150, W - 160, { color: '#fffaf0', align: 'center', max: Math.floor(this.t * 45), shadow: '#140d26' });
    UIK.pill(g, W / 2, H - 22, 'ENTER / clic: continuar · X: saltar', { align: 'center', rim: '#3a5a8a', fill: '#041533', color: '#93a6c8' });
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
    if (BG_CACHE.has('worldmap')) { this.mapC = BG_CACHE.get('worldmap'); return; }
    const pb = new PixelBuffer(W, H);
    const cx = 310, cy = 196;
    const landF = (x, y) => {
      const dx = (x - cx) / 230, dy = (y - cy) / 150;
      let d = Math.sqrt(dx * dx * 0.9 + dy * dy) - 0.82 + (fbm(x * 0.012, y * 0.012, 4, 2) - 0.5) * 0.55;
      if (y < 60) d += (60 - y) * 0.01;
      d -= Math.exp(-(((x - 520) / 60) ** 2 + ((y - 120) / 40) ** 2)) * 0.3;
      return d;
    };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = landF(x, y);
      let c;
      if (d > 0) {
        const t = clamp(d * 3, 0, 1);
        c = smoothBand(['#20d6c7', '#16a6cf', '#1283bf', '#1063a6', '#0f4888', '#0d3168'], t, x, y);
        if (d < 0.025) c = '#c6fff2';
        else if (d < 0.05 && ((x + y + Math.floor(fbm(x * 0.1, y * 0.1, 2, 9) * 6)) % 5 === 0)) c = '#6cf0db';
      } else {
        // biomas con fronteras orgánicas (Voronoi deformado por ruido)
        const n = fbm(x * 0.03, y * 0.03, 3, 5);
        const wx = x + (fbm(x * 0.018, y * 0.018, 3, 21) - 0.5) * 70, wy = y + (fbm(x * 0.018 + 9, y * 0.018, 3, 22) - 0.5) * 70;
        let b1 = null, d1 = 1e9, d2 = 1e9;
        for (const A of MAP_BIOMES) { const dd = Math.hypot(wx - A[0], (wy - A[1]) * 1.1); if (dd < d1) { d2 = d1; d1 = dd; b1 = A; } else if (dd < d2) d2 = dd; }
        let ramp = b1[2], t = b1[3] + (n - 0.5) * b1[4];
        if (d2 - d1 < 3) t -= 0.1; // frontera de bioma: banda sólida más oscura
        c = smoothBand(ramp, t, x, y);
        if (d > -0.02) c = '#fff6d8';
        // relieve sombreado
        const dd = landF(x + 1, y + 1) - d;
        if (dd > 0.004) c = shade(c, -0.18);
      }
      pb.data[y * W + x] = U(c);
    }
    // ciudad: casitas de colores
    const r = RNG(77);
    for (let i = 0; i < 60; i++) { const x = 190 + r.int(-34, 34), y = 150 + r.int(-24, 30); if (landF(x, y) < -0.04) { const col = r.pick(['#ff7656', '#20d6c7', '#ffe14d', '#8d6bff', '#fffaf0', '#86e36f']); pb.rect(x, y, 4, 3, col); pb.hline(x, x + 3, y, shade(col, 0.3)); pb.set(x + 3, y + 2, shade(col, -0.4)); } }
    // campos FV (rejillas azules)
    for (let k = 0; k < 8; k++) for (let j = 0; j < 3; j++) { const x = 330 + k * 9, y = 200 + j * 8 + (k % 2); pb.rect(x, y, 7, 4, '#1f469e'); pb.hline(x, x + 6, y, '#8cc4ff'); }
    // oasis: parcelas
    for (let k = 0; k < 10; k++) { const x = 350 + (k % 5) * 12, y = 268 + Math.floor(k / 5) * 12; pb.rect(x, y, 10, 9, k % 3 ? '#33a552' : '#86e36f'); for (let q = 0; q < 9; q += 3) pb.hline(x, x + 9, y + q, '#1f854c'); }
    // planta y tanques
    for (let k = 0; k < 5; k++) { pb.disc(140 + k * 7, 246, 3, '#e6f0f7'); pb.set(139 + k * 7, 245, '#ffffff'); }
    // ciudadela H2: esferas
    for (let k = 0; k < 3; k++) { pb.disc(492 + k * 9, 190 + (k % 2) * 6, 4, '#8cf4ec'); pb.set(490 + k * 9, 188 + (k % 2) * 6, '#ffffff'); }
    // salinas: espejos
    for (let k = 0; k < 6; k++) pb.rect(200 + k * 12, 286 + (k % 2) * 5, 9, 4, '#ffd8ec');
    // caminos
    MAP_LINKS.forEach(([a, b]) => { const A = MAP_NODES[a], B = MAP_NODES[b]; pb.line(A.x, A.y + 1, B.x, B.y + 1, '#c97c38'); });
    // rosa de los vientos
    const rx = 590, ry = 300;
    pb.ellipseOutline(rx, ry, 14, 14, '#fff6d8'); pb.poly([[rx, ry - 20], [rx + 4, ry], [rx, ry + 20], [rx - 4, ry]], '#fff6d8'); pb.poly([[rx - 20, ry], [rx, ry - 4], [rx + 20, ry], [rx, ry + 4]], '#ffd84a');
    pb.poly([[rx, ry - 20], [rx + 4, ry], [rx - 4, ry]], '#ff6b6b');
    this.mapC = pb.toCanvas();
    BG_CACHE.set('worldmap', this.mapC);
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
    if (Input.pointer.pressed && Input.pointer.y < MAP_STRIP_Y) for (const n of avail) if (dist(Input.pointer.x, Input.pointer.y, n.x, n.y + MAP_OY) < 12) { if (this.sel === n.id) this.enterLevel(); else { this.sel = n.id; Audio2.sfx('uiMove'); } Input.consumePointer(); }
    if (Input.pressed('confirm') && !Gui.focus) this.enterLevel();
    if (Input.pressed('codex')) Game.push(CodexScene, {});
    if (Input.pressed('data')) Game.push(EvidenceScene, {});
    if (Input.pressed('pause')) Game.push(MapMenuScene, {});
    if (Input.keyPressed('F9')) Game.push(TeacherScene, {});
    if (Math.random() < 0.1) this.ps.emit('spark', MAP_NODES[this.sel].x + (Math.random() - 0.5) * 16, MAP_NODES[this.sel].y + MAP_OY + (Math.random() - 0.5) * 16, 0, -10, 1);
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
    g.drawImage(this.mapC, 0, OY);
    drawSeaSparkles(g, 0, 0, W, MAP_STRIP_Y, t, 0.5, ['#c6fff2', '#ffffff']);
    // sombras de nubes cruzando el mapa (elipses translúcidas sólidas)
    g.globalAlpha = 0.16; for (let i = 0; i < 4; i++) { const x = ((t * (6 + i * 2) + i * 190) % (W + 160)) - 80, y = 40 + i * 64; fdisc(g, x, y, 34 + i * 5, '#0a1a3a'); } g.globalAlpha = 1;
    // enlaces SYNARA animados
    MAP_LINKS.forEach(([a, b], i) => {
      const A = MAP_NODES[a], B = MAP_NODES[b];
      const on = GS.s.unlocked.includes(a) && GS.s.unlocked.includes(b);
      const n = Math.ceil(dist(A.x, A.y, B.x, B.y) / 3);
      for (let k = 0; k < n; k++) { const ph = (k / n + t * 0.4 + i * 0.13) % 1; const x = lerp(A.x, B.x, k / n), y = lerp(A.y, B.y, k / n) + OY; if (on && ph < 0.08) fpx(g, x, y - 1, i % 2 ? '#56e5ff' : '#ffe14d'); }
    });
    for (let i = 0; i < 5; i++) ART.turbine(g, 400 + i * 14, 92 + (i % 2) * 8 + OY, 10, t * 2 + i, { col: '#fffaf0', shade: '#cfe8ee' });
    // nodos: islas-nodo con anillo del color del capítulo
    for (const n of MAP_NODES) {
      const un = GS.s.unlocked.includes(n.id), done = GS.s.completed.includes(n.id), sel = this.sel === n.id;
      const nx = n.x, ny = n.y + OY, acc = LEVEL_CARD_ACCENT[n.id] || '#56e5ff';
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
    const px = n.x > W / 2 ? 10 : W - 230, pw = 220, py = 38, ph = 248;
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
    for (const c of cs.slice(0, 3)) { drawText(g, fitText(MASTERY_LABELS[c], 120, 'tiny'), px + 10, yy, { font: 'tiny', color: '#b8c8e8' }); UIK.bar(g, px + 134, yy - 1, 76, 6, (GS.s.mastery ? GS.s.mastery[c] : 0) / 100, '#3fe0a0'); yy += 10; }
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
