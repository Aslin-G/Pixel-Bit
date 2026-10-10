/* =====================================================================
   47_lv07.js — NIVEL 07: LA CIUDADELA DEL HIDRÓGENO
   Agua ultrapura, electrolizadores, compresión y almacenamiento.
   RA-06 · Sincronizador H2 · Guardián: La Llama que No se Ve
   Tercer giro: la Dra. Eliana se aisló voluntariamente en el núcleo.
   Seguridad: protocolo abstracto DETECTAR → AISLAR → DETENER → VENTILAR →
   VERIFICAR → AUTORIZAR REINICIO. Sin instrucciones operativas reales.
   ===================================================================== */

const H2_SURPLUS = [0, 0, 0, 0, 0, 0, 0, 120, 380, 620, 820, 900, 880, 760, 560, 300, 80, 0, 0, 0, 0, 0, 0, 0];
const H2_WATER_PER_KG = H2Model.waterPerKg();
const SAFETY_ACTIONS = [
  { id: 'detect', short: 'DETECTAR con sensores y cámara térmica', label: 'DETECTAR: confirmar la alarma con sensores redundantes y cámara térmica', ok: 0 },
  { id: 'isolate', short: 'AISLAR el suministro a distancia', label: 'AISLAR: cerrar remotamente el suministro de la zona afectada', ok: 1 },
  { id: 'stop', short: 'DETENER los stacks (parada segura)', label: 'DETENER: parada segura de los stacks y de la alimentación eléctrica', ok: 2 },
  { id: 'vent', short: 'VENTILAR y mantener al personal fuera', label: 'VENTILAR: activar la ventilación del recinto y mantener al personal fuera', ok: 3 },
  { id: 'verify', short: 'VERIFICAR lecturas bajo el umbral', label: 'VERIFICAR: lecturas bajo el umbral y revisión térmica sostenida', ok: 4 },
  { id: 'restart', short: 'AUTORIZAR REINICIO verificado', label: 'AUTORIZAR REINICIO: solo con verificación y responsable de seguridad', ok: 5 },
  { id: 'look', short: 'Acercarse a mirar el stack', label: 'Acercarse a mirar de dónde sale el sonido', bad: 'La llama de hidrógeno es casi invisible de día. Acercarse expone a quemaduras graves: siempre a distancia, con sensores y cámara térmica.' },
  { id: 'water', short: 'Echar agua al stack', label: 'Echar agua al stack para "enfriarlo"', bad: 'Improvisar con agua en equipos eléctricos y gases inflamables crea riesgos nuevos. El protocolo es aislar, detener y ventilar desde un lugar seguro.' },
  { id: 'mute', short: 'Silenciar el detector', label: 'Silenciar el detector que suena', bad: 'Nunca se desactiva un sensor de seguridad. Si hay duda, se verifica con sensores redundantes; no se elimina la evidencia.' },
  { id: 'reset', short: 'Reiniciar todo a ver si se arregla', label: 'Reiniciar todo para ver si se arregla', bad: 'Reiniciar sin aislar ni verificar puede volver a alimentar la fuga. El reinicio es el último paso, autorizado y verificado.' },
];
const H2_BATCHES = [
  { id: 'A', name: 'Lote A', text: 'Electrólisis de noche con la red regional (mezcla fósil 70 %). Etiqueta comercial: "Hidrógeno verde".', key: 1 },
  { id: 'B', name: 'Lote B', text: 'Electrólisis solo en horas con excedente FV medido, hora a hora, dentro de SYNARA. Agua de pozo salobre tratada.', key: 0 },
  { id: 'C', name: 'Lote C', text: 'Compra certificados renovables anuales; la mitad de las horas de operación usan red fósil.', key: 2 },
];
const H2_CLASSES = ['Verde (hora a hora)', 'No verde', 'Depende de la frontera'];

LEVELS[7] = {
  id: 7, title: 'La Ciudadela del Hidrógeno', chapter: 'CAPÍTULO 07', biome: 'citadel', music: 'citadel', width: 2700, height: 360, metalFloor: true,
  ambience: { hum: 0.6, wind: 0.2, bubbles: 0.5 },
  portraits: ['amaya', 'kiru', 'naira', 'dante', 'limen', 'eliana', 'mirage', 'financia'],
  spawn: { x: 60, y: 290 },
  checkpoints: { hall: { x: 1180, y: 290 }, safety: { x: 2000, y: 290 } },
  ground: [[0, 290], [2700, 290]],
  terrain: [{ x0: 0, x1: 2700, mat: 'metal' }],
  platforms: [{ x: 1960, y: 212, w: 220, type: 'metal', baked: true, look: 'slab' }, { x: 640, y: 248, w: 60, type: 'metal', baked: true, look: 'grate' }, { x: 1500, y: 244, w: 80, type: 'metal', baked: true, look: 'grate' }],
  ladders: [{ x: 1970, y0: 212, y1: 290, look: 'steel' }],
  cam: { look: 50, vy: 0.66 },
  /* ---------------- plano jugable con kit PF (B) ----------------
     Hora azul en la ciudadela. Suelo en 3/4: adoquín frío con bordillo en la entrada → cubierta de
     chapa con bandejas bajo el forjado (agua ultrapura y rectificador) → resina epoxi con zanja de
     servicios registrable bajo la nave de stacks → rejilla sobre galería de tuberías (compresión y
     esferas) → adoquín en el patio de seguridad → baldosa bajo la sala de control → chapa junto a
     los aerorrefrigeradores → baldosa pulida ante el portal del núcleo. La línea de paso es la misma. */
  pf: {
    kitB: true,
    terrain: [
      { x0: 0, x1: 330, surf: 'street', face: 'steps', depth: 20, steps: 4, stepH: 7, ramp: ['#181a28', '#22263a', '#2e334a', '#3c425a', '#4c536c', '#5e6680', '#727a94', '#8a92aa', '#a6acc0'], drains: true, pools: [{ x: 228, r: 30, col: '#ffe0b0', k: 0.28 }, { x: 54, r: 26, col: '#ffe0b0', k: 0.22 }] },
      { x0: 330, x1: 760, surf: 'metal', face: 'gallery', depth: 20, pipes: [[14, 3, 'upw'], [24, 2, 'perm'], [33, 2, 'cool']], bay: 64, pools: [{ x: 520, r: 34, col: '#fff0d0', k: 0.24 }] },
      { x0: 760, x1: 1272, surf: 'epoxy', face: 'trench', depth: 20, tw: 100, pools: [{ x: 786, r: 22 }, { x: 842, r: 22 }, { x: 898, r: 22 }, { x: 954, r: 22 }, { x: 1010, r: 22 }, { x: 1066, r: 22 }, { x: 1122, r: 22 }, { x: 1178, r: 22 }], refl: [{ x: 874, w: 4, col: '#52d090', k: 0.3 }, { x: 1024, w: 4, col: '#52d090', k: 0.3 }, { x: 1174, w: 4, col: '#52d090', k: 0.3 }] },
      { x0: 1272, x1: 1760, surf: 'grate', face: 'gallery', depth: 20, pipes: [[13, 3, 'h2'], [22, 2, 'o2'], [31, 3, 'h2'], [40, 2, 'cool']], bay: 56, stripe: false },
      { x0: 1760, x1: 1960, surf: 'street', face: 'curb', depth: 20, ramp: ['#181a28', '#22263a', '#2e334a', '#3c425a', '#4c536c', '#5e6680', '#727a94', '#8a92aa', '#a6acc0'], drains: true, pools: [{ x: 1860, r: 40, col: '#ffe0b0', k: 0.2 }] },
      { x0: 1960, x1: 2190, surf: 'tile', face: 'concrete', depth: 20, checker: true, ramp: ['#141826', '#1e2436', '#2a3248', '#38425a', '#4a546e', '#5e6a84', '#76829c', '#909cb4', '#aeb8cc'], refl: [{ x: 2010, w: 8, col: '#48dcf4', k: 0.22 }, { x: 2120, w: 8, col: '#48dcf4', k: 0.22 }] },
      { x0: 2190, x1: 2430, surf: 'metal', face: 'gallery', depth: 20, pipes: [[14, 3, 'cool'], [24, 2, 'upw'], [34, 3, 'cool']], bay: 48 },
      { x0: 2430, x1: 2700, surf: 'tile', face: 'steps', depth: 20, steps: 3, stepH: 8, ramp: ['#141826', '#1e2436', '#2a3248', '#38425a', '#4a546e', '#5e6a84', '#76829c', '#909cb4', '#aeb8cc'], refl: [{ x: 2556, w: 30, col: '#52d090', k: 0.3 }, { x: 2484, w: 6, col: '#fff2d0', k: 0.3 }, { x: 2628, w: 6, col: '#fff2d0', k: 0.3 }] },
    ],
    fg: [
      { kind: 'pillar', x: -8, w: 22, h: 360, ramp: ['#03040a', '#070a16', '#0c1222', '#141c32', '#1e2a44', '#2c3a58', '#ffb08a'], lit: true },
      { kind: 'cables', x: 380, y: 0, w: 320, h: 44, seed: 71, n: 4 },
      { kind: 'rail', x: 760, w: 240, h: 40 },
      { kind: 'cables', x: 1250, y: 0, w: 260, h: 36, seed: 75, n: 3 },
      { kind: 'rail', x: 1700, w: 200, h: 40 },
      { kind: 'cables', x: 2050, y: 0, w: 280, h: 40, seed: 73, n: 3 },
      { kind: 'rail', x: 2500, w: 220, h: 40 },
      { kind: 'cables', x: 2900, y: 0, w: 300, h: 38, seed: 77, n: 4 },
      { kind: 'pillar', x: 3270, w: 30, h: 360, ramp: ['#03040a', '#070a16', '#0c1222', '#141c32', '#1e2a44', '#2c3a58', '#ffb08a'], lit: true },
    ],
  },
  /** Etiquetas científicas en el mundo */
  labels: [
    { x: 250, y: 172, title: 'OI · 2.º PASO', sub: 'Quita casi todos los iones', kind: 'water', ax: 250, ay: 196 },
    { x: 356, y: 196, title: 'EDI', sub: 'Electrodesionización', kind: 'water', ax: 356, ay: 206 },
    { x: 432, y: 132, title: 'AGUA ULTRAPURA', sub: (sc) => sc.state.waterReady ? '0,06 µS/cm · lista' : 'Meta: < 0,1 µS/cm', kind: 'water', ax: 432, ay: 152 },
    { x: 560, y: 178, title: 'ELECTRICIDAD', sub: 'Del excedente solar y eólico', kind: 'solar', ax: 600, ay: 196 },
    { x: 836, y: 192, title: 'ELECTROLIZADOR PEM', sub: '2 H₂O → 2 H₂ + O₂', kind: 'green', ax: 826, ay: 212 },
    { x: 1222, y: 98, title: 'O₂ (SUBPRODUCTO)', sub: '≈ 8 kg por kg de H₂', kind: 'tech', ax: 1250, ay: 104 },
    { x: 1368, y: 188, title: 'COMPRESIÓN', sub: 'Más H₂ en menos volumen', kind: 'tech', ax: 1368, ay: 208 },
    { x: 1584, y: 150, title: 'ALMACENAMIENTO H₂', sub: 'Vector: guarda energía', kind: 'green', ax: 1584, ay: 166 },
    { x: 1756, y: 204, title: 'BOTELLAS DE O₂', sub: 'Posible ingreso, no promesa', kind: 'tech', ax: 1754, ay: 224 },
    { x: 1860, y: 148, title: 'SEGURIDAD H₂', sub: 'A distancia y con sensores', kind: 'alert', ax: 1860, ay: 158 },
    { x: 2242, y: 196, title: 'ENFRIAMIENTO', sub: 'El stack también da calor', kind: 'water', ax: 2242, ay: 210 },
    { x: 2386, y: 94, title: 'VENTEO', sub: 'El H₂ es muy ligero: sube', kind: 'tech', ax: 2382, ay: 104 },
  ],
  /* ---------------- accesorios estáticos (prerender) ---------------- */
  props(pb, world) {
    const t0 = nowMs();
    const gy = (x) => world.groundAt(x);
    const segs = PFBGround.surface(pb, world);
    const back = (x) => PFBGround.backEdge(PFBGround.segAt(segs, x), Math.round(x), gy(x));
    const H2 = PFBH2, B = PFB, I = PFInfra, F = PFFlora, D = LV7;
    D.flows.length = 0; D.glows.length = 0; D.leds.length = 0; D.screens.length = 0; D.stacks.length = 0; D.fans.length = 0; D.cones.length = 0;
    const yb = back(400) + 2; // pie de los equipos (borde trasero del suelo)
    const on = (sc) => sc.state.stacks > 0 && !sc.state.leak;
    const lampG = (x, y, r = 8, a = 0.34) => D.glows.push({ x, y, r, col: '#fff0d0', a, mode: 'flicker', ph: x });
    /* ===== 0. RACK TRASERO DE TUBERÍAS (profundidad detrás de todo) ===== */
    H2.pipeRack(pb, 430, 760, 214, [{ kind: 'perm', dy: 0, r: 2 }, { kind: 'cool', dy: 7, r: 2 }], { span: 66, footY: (x) => back(x) + 1 });
    H2.pipeRack(pb, 1290, 1770, 182, [{ kind: 'h2', dy: 0, r: 3 }, { kind: 'o2', dy: 9, r: 2 }, { kind: 'cool', dy: 16, r: 2 }], { span: 60, footY: (x) => back(x) + 1 });
    H2.pipeRack(pb, 2190, 2436, 200, [{ kind: 'cool', dy: 0, r: 3 }, { kind: 'upw', dy: 9, r: 2 }], { span: 62, footY: (x) => back(x) + 1 });
    /* ===== 1. ENTRADA (0–330): caseta, tótem, barrera, jardineras, farolas ===== */
    const gh = H2.gatehouse(pb, 16, yb, 72, 106);
    lampG(gh.lamp[0], gh.lamp[1], 9, 0.3); D.glows.push({ x: gh.win[0], y: gh.win[1], r: 14, col: '#ffcf7a', a: 0.18, mode: 'steady' });
    H2.planter(pb, 100, yb, 32, 3);
    H2.totem(pb, 108, yb - 4, 96);
    H2.boom(pb, 150, yb + 1);
    F.palm(pb, 186, back(186) - 2, 78, -5, 41); F.palm(pb, 302, back(302) - 2, 70, 6, 42);
    H2.planter(pb, 268, yb, 40, 5);
    let lp = B.lampPost(pb, 226, yb + 1, 98, { dir: 1, ramp: H2.R.STL.slice(0, 10) }); lampG(lp.x, lp.y, 9, 0.4);
    for (const x of [130, 300]) I.bollard(pb, x, yb + 4);
    // permeado que llega de SYNARA (desde el fondo) hacia el bastidor de OI
    I.pipe(pb, [[118, 236], [192, 236], [192, 258]], 2, 'perm', { flange: 24, supports: 36, supportTo: () => yb });
    D.flows.push({ pts: [[118, 236], [192, 236], [192, 258]], kind: 'perm', rate: (sc) => sc.state.waterReady ? 1 : 0.5 });
    /* ===== 2. AGUA ULTRAPURA (190–470): OI de 2.º paso, EDI, tanque y analizador ===== */
    const ro = H2.roRack(pb, 196, yb, 104);
    D.screens.push({ x: ro.hmi[0], y: ro.hmi[1], w: ro.hmi[2], h: ro.hmi[3], kind: 'bars', col: '#48dcf4' });
    const edi = H2.ediSkid(pb, 322, yb, 3);
    for (const s of edi.screens) D.screens.push({ x: s[0], y: s[1], w: s[2], h: s[3], kind: 'text', col: (sc) => sc.state.waterReady ? '#6ae2f8' : '#ffb93b' });
    I.pipe(pb, [[304, 250], [320, 250]], 1, 'upw', { flange: 0 }); I.pipe(pb, [[390, 230], [404, 230], [404, 252], [410, 252]], 1, 'upw', { flange: 0 });
    const tk = H2.upwTank(pb, 432, yb, 20, 96);
    D.upwScreen = tk.screen;
    D.glows.push({ x: 432, y: tk.base - 66, r: 12, col: '#48dcf4', a: 0.22, mode: 'pulse', hz: 0.35, on: (sc) => sc.state.waterReady });
    // línea de agua ultrapura hacia la nave (sobre soportes bajos)
    I.pipe(pb, [[452, 252], [776, 252]], 2, 'upw', { flange: 30, supports: 44, supportTo: () => yb });
    D.flows.push({ pts: [[452, 252], [776, 252]], kind: 'upw', rate: (sc) => sc.state.waterReady ? 1 : 0.15 });
    /* ===== 3. ELECTRICIDAD (480–760): trafo, rectificador, bandeja de potencia ===== */
    H2.transformer(pb, 498, yb);
    const rc = H2.rectifier(pb, 588, yb, 4);
    for (const [x, y, col] of rc.leds) D.leds.push({ x, y, col, hz: 0.6 + (x % 5) * 0.2, ph: x * 0.1 });
    lp = B.lampPost(pb, 718, yb + 1, 98, { dir: -1, ramp: H2.R.STL.slice(0, 10) }); lampG(lp.x, lp.y, 9, 0.38);
    // subida de cables del rectificador a la bandeja de la nave
    for (let yy = 140; yy < 204; yy++) for (let k = 0; k < 4; k++) PFK.put(pb, 600 + k, yy, U((yy % 4 < 2) ? ['#6e769a', '#ecc030', '#c8384a', '#383e5a'][k] : ['#6e769a', '#c49418', '#7a1a1c', '#383e5a'][k]));
    H2.cableTray(pb, 600, 1236, 140, { hang: 56, hangTo: 132 });
    D.flows.push({ pts: [[602, 204], [602, 140], [1236, 140]], kind: 'power', rate: (sc) => on(sc) ? 1 : 0 });
    /* ===== 4. NAVE DE ELECTROLIZADORES (756–1240) ===== */
    const sh = H2.shed(pb, 756, 1240, yb, 118, [760, 917, 1067, 1217], 'NAVE DE ELECTROLIZADORES');
    for (const [x, y] of sh.lamps) D.glows.push({ x, y: y + 2, r: 12, col: '#fff2d0', a: 0.26, mode: 'steady' });
    for (const [x, y] of sh.beacons) D.glows.push({ x, y, r: 6, col: '#ffb93b', a: 0.7, mode: 'blink', hz: 1.6, on: (sc) => !!sc.state.leak, core: '#fff2b0' });
    // colector de agua ultrapura tras los plintos (se ve en los huecos)
    I.pipe(pb, [[776, 252], [1222, 252]], 2, 'upw', { flange: 0 });
    // colectores de gases colgados de la cercha
    H2.header(pb, 870, 1292, 162, 3, 'h2', 134);
    H2.header(pb, 896, 1250, 150, 2, 'o2', 134);
    for (let k = 0; k < 3; k++) {
      const x = 782 + k * 150;
      const st = H2.stackPEM(pb, x, yb, k);
      D.stacks.push(st);
      I.pipe(pb, [[st.h2Out[0], st.h2Out[1] + 6], [st.h2Out[0], 162]], 2, 'h2', { flange: 0 });
      I.pipe(pb, [[st.o2Out[0], st.o2Out[1] + 4], [st.o2Out[0], 150]], 1, 'o2', { flange: 0 });
      // bajantes de potencia desde la bandeja hasta las barras de cobre
      for (const [bx, by] of st.bus) { for (let yy = 144; yy < by; yy++) { PFK.put(pb, bx - 1, yy, U('#7a1a1c')); PFK.put(pb, bx, yy, U((yy % 6 < 3) ? '#ecc030' : '#c49418')); } D.flows.push({ pts: [[bx, 144], [bx, by]], kind: 'power', rate: (sc) => (sc.state.stacks > k && !sc.state.leak) ? 1 : 0 }); }
      D.flows.push({ pts: [[st.h2Out[0], st.h2Out[1] + 6], [st.h2Out[0], 162]], kind: 'h2', rate: (sc) => (sc.state.stacks > k && !sc.state.leak) ? 1 : 0 });
      D.flows.push({ pts: [[st.upwIn[0], st.upwIn[1]], [st.upwIn[0] + 10, st.upwIn[1]]], kind: 'upw', rate: (sc) => sc.state.waterReady ? 0.6 : 0 });
    }
    D.flows.push({ pts: [[870, 162], [1292, 162]], kind: 'h2', rate: (sc) => on(sc) ? 1 : 0 });
    D.flows.push({ pts: [[896, 150], [1250, 150], [1250, 102]], kind: 'o2', rate: (sc) => on(sc) ? 0.7 : 0 });
    // venteo de O₂ sobre la cubierta
    I.pipe(pb, [[1250, 150], [1250, 98]], 2, 'o2', { flange: 20 });
    for (let k = 0; k < 6; k++) PFK.put(pb, 1247 + k, 97, U('#dceaff'));
    /* ===== 5. CONSOLA DEL SINCRONIZADOR (1240–1290) — estación con dibujo propio ===== */
    lp = B.lampPost(pb, 1282, yb + 1, 98, { dir: -1, ramp: H2.R.STL.slice(0, 10) }); lampG(lp.x, lp.y, 9, 0.38);
    /* ===== 6. COMPRESIÓN (1296–1440) ===== */
    const c1 = H2.compressor(pb, 1300, yb), c2 = H2.compressor(pb, 1372, yb);
    I.pipe(pb, [[1292, 162], [1292, 210], [c1.in[0], 210]], 2, 'h2', { flange: 0 });
    I.pipe(pb, [[c1.out[0], 210], [c2.in[0], 210]], 2, 'h2', { flange: 0 });
    I.pipe(pb, [[c2.out[0], 210], [1440, 210], [1440, 182]], 2, 'h2', { flange: 0 });
    D.flows.push({ pts: [[1292, 162], [1292, 210], [c1.in[0], 210]], kind: 'h2', rate: (sc) => on(sc) ? 1 : 0 }, { pts: [[c2.out[0], 210], [1440, 210], [1440, 182], [1770, 182]], kind: 'h2', rate: (sc) => on(sc) ? 1.2 : 0 });
    for (const c of [c1, c2]) D.leds.push({ x: c.led[0], y: c.led[1], col: '#3fe0a0', hz: 1.2, ph: c.led[0] });
    /* ===== 7. ALMACENAMIENTO (1436–1780): esferas y botellas de O₂ ===== */
    for (const cx of [1484, 1584, 1684]) { const sp = H2.sphere(pb, cx, yb, 40, { lift: 50 }); D.glows.push({ x: cx, y: sp.top - 2, r: 4, col: '#ff6a50', a: 0.8, mode: 'blink', hz: 0.5, ph: cx, core: '#ffb0a0' }); }
    H2.o2Rack(pb, 1736, yb, 4);
    /* ===== 8. PATIO DE SEGURIDAD (1760–1960): panel de protocolo, detectores, cámara térmica ===== */
    H2.windsock(pb, 1774, yb, 96);
    const d1 = H2.detector(pb, 1788, yb, 48), d2 = H2.detector(pb, 1934, yb, 48);
    for (const d of [d1, d2]) D.glows.push({ x: d.led[0], y: d.led[1], r: 3, col: (sc) => sc.state.leak ? '#ff6a50' : '#3fe0a0', a: 0.8, mode: 'blink', hz: 1.4, core: '#ffffff' });
    H2.protocolBoard(pb, 1801, yb, 118);
    const tc = H2.thermalCam(pb, 1950, yb, 74);
    D.glows.push({ x: tc.lens[0], y: tc.lens[1], r: 4, col: '#b49cff', a: 0.5, mode: 'pulse', hz: 0.8 });
    for (const x of [1770, 1830, 1890, 1950]) I.bollard(pb, x, yb + 4);
    /* ===== 9. SALA DE CONTROL DE SEGURIDAD elevada (1960–2190) ===== */
    // sala eléctrica bajo el forjado
    for (let k = 0; k < 5; k++) H2.box(pb, 2000 + k * 28, yb, 24, 44, 8, { ramp: H2.R.NAVY, pw: 12 });
    for (let k = 0; k < 5; k++) for (let j = 0; j < 3; j++) D.leds.push({ x: 2004 + k * 28 + j * 4, y: yb - 38, col: ['#3fe0a0', '#48dcf4', '#ffd84a'][j], hz: 0.5 + j * 0.3, ph: k + j });
    const cr = H2.controlRoom(pb, 1960, 2180, 212, 98, yb, 'CONTROL DE SEGURIDAD');
    for (const s of cr.screens) D.screens.push(Object.assign({ col: (sc) => sc.state.leak ? '#ffb93b' : (s.small ? '#86e36f' : '#56e5ff'), col2: '#ffd84a' }, s));
    for (const [x, y] of cr.lamps) D.glows.push({ x, y: y + 1, r: 10, col: '#fff2d0', a: 0.26, mode: 'steady' });
    for (const [x, y, col] of cr.leds) D.leds.push({ x, y, col, hz: 0.9, ph: x * 0.07 });
    D.glows.push({ x: cr.beacon[0], y: cr.beacon[1], r: 4, col: '#ff6a50', a: 0.8, mode: 'blink', hz: 0.6, core: '#ffb0a0' });
    // sombra del forjado sobre la sala eléctrica
    B.shade(pb, 1960, 224, 230, 10, -0.22); B.shade(pb, 1960, 234, 230, 8, -0.12);
    /* ===== 10. AEROREFRIGERACIÓN y VENTEO (2190–2430) ===== */
    const dc = H2.dryCooler(pb, 2196, yb, 84, 3);
    D.fans.push(...dc.fans);
    lp = B.lampPost(pb, 2316, yb + 1, 98, { dir: 1, ramp: H2.R.STL.slice(0, 10) }); lampG(lp.x, lp.y, 9, 0.38);
    const vm = H2.ventMast(pb, 2384, yb, 162);
    for (const [x, y] of vm.beacons) D.glows.push({ x, y, r: 5, col: '#ff6a50', a: 0.85, mode: 'blink', hz: 0.7, ph: y, core: '#ffb0a0' });
    B.tank(pb, 2346, yb, 9, 44, { ramp: PFInfra.STEEL, band: ['#0c1830', '#18305a', '#2a4c86', '#4270b0', '#6a96d0', '#a0c0ea'], bands: [{ y: 6, h: 3 }, { y: 30, h: 2 }], label: 'O₂', labelBg: '#18305a', labelBd: '#a0c0ea' });
    /* ===== 11. PORTAL AL NÚCLEO (2436–2700) ===== */
    const cg = H2.coreGate(pb, 2440, yb, 236, 150, 'HACIA EL NÚCLEO · OASIS');
    for (const [x, y] of cg.lights) D.glows.push({ x, y, r: 10, col: '#fff2d0', a: 0.4, mode: 'steady' });
    D.glows.push({ x: cg.door[0], y: cg.door[1], r: 16, col: '#52d090', a: 0.25, mode: 'pulse', hz: 0.3 });
    H2.planter(pb, 2410, yb, 30, 9);
    /* ===== objetos menudos sobre el pasillo y rótulos pintados en el suelo ===== */
    const wy = (x) => back(x) + 7;
    H2.cone(pb, 136, wy(136)); H2.cone(pb, 244, wy(244));
    H2.aframe(pb, 320, wy(320), 'ZONA H₂');
    H2.reel(pb, 470 + 26, wy(496)); H2.toolbox(pb, 536, wy(536)); H2.extinguisher(pb, 566, wy(566));
    H2.pallet(pb, 704, wy(704), 26, 3);
    H2.stencil(pb, 810, back(810) + 9, 'H₂', '#52d090', 0.5); H2.stencil(pb, 960, back(960) + 9, 'STACK 2', '#e8b830', 0.45); H2.stencil(pb, 1110, back(1110) + 9, 'H₂', '#52d090', 0.5);
    H2.trolley(pb, 1244, wy(1244)); H2.extinguisher(pb, 1430, wy(1430));
    H2.cone(pb, 1530, wy(1530)); H2.cone(pb, 1640, wy(1640)); H2.reel(pb, 1708, wy(1708));
    H2.aframe(pb, 1946, wy(1946) + 1, 'A DISTANCIA', { bd: '#ff6a50', col: '#ffd0c0' });
    H2.toolbox(pb, 2050, wy(2050)); H2.pallet(pb, 2150, wy(2150), 24, 7);
    H2.cone(pb, 2296 - 30, wy(2266)); H2.trolley(pb, 2420, wy(2420));
    H2.stencil(pb, 2520, back(2520) + 9, 'NÚCLEO →', '#52d090', 0.45);
    // conos de luz de las lámparas de la nave y de la sala de control
    for (const [x, y] of sh.lamps) D.cones.push([x, y, 10, 56, yb + 8 - y]);
    for (const [x, y] of cr.lamps) D.cones.push([x, y, 12, 44, 212 - y]);
    for (const [x, y] of cg.lights) D.cones.push([x, y, 6, 30, yb + 10 - y]);
    LEVELS[7]._propsMs = Math.round(nowMs() - t0);
  },
  /** Primer plano a ras de suelo: balizas bajas y tapas de registro delante de los pies */
  propsFront(pb, world) {
    const gy = (x) => world.groundAt(x), S = PFK.P32(PFBH2.R.AMB);
    const post = (x) => { const y = gy(x) + 1; for (let yy = y - 9; yy < y; yy++) { PFK.put(pb, x, yy, S[4]); PFK.put(pb, x + 1, yy, S[3]); PFK.put(pb, x + 2, yy, S[1]); } for (let k = 0; k < 3; k++) PFK.put(pb, x + k, y - 6, U('#1c1c26')); PFK.put(pb, x, y - 10, S[5]); PFK.put(pb, x + 1, y - 10, S[4]); };
    for (const x of [756, 1236, 1300, 1440, 1770, 1950, 2196, 2286]) post(x);
    // luces empotradas en el suelo del portal
    for (let x = 2470; x < 2650; x += 30) { PFK.put(pb, x, gy(x) - 1, U('#9cecc0')); PFK.put(pb, x + 1, gy(x) - 1, U('#52d090')); }
  },
  /* ---------------- dinámico ---------------- */
  renderMid(g, sc, cam) {
    const S = sc.state, t = Game.time, ox = cam.x, oy = cam.y, D = LV7;
    // conos de luz (bandas de alfa, sin tramado)
    g.globalCompositeOperation = 'lighter';
    for (const [x, y, w0, w1, h] of D.cones) { if (x + w1 < ox || x - w1 > ox + W) continue; g.drawImage(VISTA.lightCone(w0, w1, h, '#fff0c8', 0.16), Math.round(x - w1 / 2 - ox), Math.round(y - oy)); }
    g.globalCompositeOperation = 'source-over';
    PFInfra.drawFlows(g, sc, D.flows);
    // stacks: burbujas en las mirillas de los separadores y torre de señales
    D.stacks.forEach((st, k) => {
      const x = st.cells[0] - ox; if (x < -170 || x > W + 30) return;
      const run = S.stacks > k && !S.leak;
      if (run) {
        drawGasBubbles(g, st.sepH[0] - ox, st.sepH[1] + st.sepH[3] - oy, 3, st.sepH[3] - 2, t + k, 1.0, '#d4ffe6');
        drawGasBubbles(g, st.sepO[0] - ox, st.sepO[1] + st.sepO[3] - oy, 3, st.sepO[3] - 2, t + k * 0.7, 0.6, '#e8f0ff');
        g.fillStyle = '#9cecc0'; for (let i = 0; i < 4; i++) { const ph = (t * 0.9 + i * 0.25) % 1; g.fillRect(Math.round(st.cells[0] + 6 + i * 11 - ox), Math.round(st.cells[1] + 2 - ph * 4 - oy), 1, 1); }
      }
      const leakHere = S.leak && k === 1;
      const L = run ? st.led : leakHere ? ((Math.floor(t * 6) % 2) ? st.ledRed : st.ledAmb) : null;
      if (L) { const col = run ? '#3fe0a0' : (Math.floor(t * 6) % 2) ? '#ff4e5d' : '#ffb93b'; g.fillStyle = col; g.fillRect(Math.round(L[0] - 2 - ox), Math.round(L[1] - 1 - oy), 5, 3); PFK.drawGlow(g, L[0] - ox, L[1] - oy, 7, col, 0.55); }
    });
    PFBH2.drawFans(g, sc, D.fans, true);
    PFInfra.drawLeds(g, sc, D.leds);
    PFB.screens(g, sc, D.screens);
    PFB.glows(g, sc, D.glows);
    // analizador de conductividad del tanque de agua ultrapura
    if (D.upwScreen) { const [x, y, w] = D.upwScreen; const ready = S.waterReady; g.fillStyle = ready ? '#6ae2f8' : ((Math.floor(t * 2) % 2) ? '#ffb93b' : '#7a5208'); g.fillRect(Math.round(x - ox), Math.round(y - oy), ready ? 2 : w, 2); if (ready) { g.fillStyle = '#c4f8ff'; g.fillRect(Math.round(x + 3 - ox), Math.round(y - oy), 4, 1); g.fillRect(Math.round(x + 3 - ox), Math.round(y + 2 - oy), 4, 1); } }
    // fuga simulada: llama invisible en el stack 2 (solo se ve con la cámara térmica)
    if (S.leak && D.stacks[1]) {
      const c = D.stacks[1].cells, lx = c[0] + c[2] * 0.5 - ox, ly = c[1] - 4 - oy;
      if (S.thermal) { for (let i = 0; i < 30; i++) { const a = Math.random() * 0.8 - 0.4, r = Math.random() * 18; fpx(g, lx + Math.sin(a) * r, ly - Math.cos(a) * r, ['#ffe14d', '#ff9f43', '#ff4e5d', '#ffffff'][i % 4]); } }
      else if (Math.random() < 0.3) fpx(g, lx + (Math.random() - 0.5) * 6, ly - Math.random() * 10, '#c6d8ff');
      if ((Math.floor(t * 3) % 2) === 0) VISTA.veil(g, 756 - ox, 118 - oy, 484, 172, '#ffb93b', 0.07);
    }
    // escudo cristalino de LIMEN protegiendo al equipo
    if (S.shield > 0) { const gy = 290 - oy, sx = S.shieldX - ox, sy = gy - 40; for (let a = 0; a < 40; a++) { const an = a / 40 * Math.PI; fpx(g, sx + Math.cos(an) * 46, sy - Math.sin(an) * 40, (a + Math.floor(t * 10)) % 3 ? '#7ee8f0' : '#ffffff'); } VISTA.veil(g, sx - 44, sy - 40, 88, 40, '#c4fbff', 0.12 * S.shield); }
  },
  renderGrade(g, sc) { const S = sc.state; if (S.thermal) { g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.5; frect(g, 0, 0, W, H, '#5a3a8a'); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; } },
  lens(g, sc, cam, k) {
    const S = sc.state, ox = cam.x, oy = cam.y;
    lensBoundary(g, 190 - ox, 170 - oy, 1500, 124, '#ffe14d', 'LÍMITE: CIUDADELA H2 (AGUA + ELECTRICIDAD → H2 + O2)');
    lensTag(g, 210 - ox, 190 - oy, 'Agua ultrapura: < 0,1 µS/cm', '#a6f4ff', 'water');
    lensTag(g, 210 - ox, 202 - oy, 'Agua total ≈ ' + fmt(H2_WATER_PER_KG, 1) + ' kg por kg de H2 (8,9 estequiométrica)', '#a6f4ff', 'drop_brine');
    lensTag(g, 800 - ox, 180 - oy, 'SEC ≈ 55 kWh/kg H2 (supuesto de simulación)', '#ffe14d', 'bolt');
    lensTag(g, 800 - ox, 192 - oy, 'O2 ≈ 8 kg por kg de H2 (subproducto)', '#cfe8ee', 'flask');
    lensTag(g, 1420 - ox, 196 - oy, 'H2 es un vector: guarda energía que vino de otra fuente', '#d8fff8', 'h2');
  },
  hud(g, sc) {
    const S = sc.state;
    hudGauges(g, [
      { icon: 'water', label: 'AGUA UP', value: S.waterReady ? 'LISTA' : 'PREPARAR', frac: S.waterReady ? 1 : 0.2, color: S.waterReady ? '#56e5ff' : '#ffb93b' },
      { icon: 'h2', label: 'STACKS', value: (S.leak ? 0 : S.stacks || 0) + ' / 3', frac: (S.leak ? 0 : S.stacks || 0) / 3, color: '#86e36f' },
      { icon: 'warn', label: 'SEGURIDAD', value: S.leak ? 'ALARMA' : 'NORMAL', frac: S.leak ? 1 : 0.1, color: S.leak ? '#ffb93b' : '#86e36f' },
    ]);
  },
  onTool(sc) {
    const S = sc.state;
    if (!S.leak) return false;
    S.thermal = !S.thermal; Audio2.sfx('scan');
    sc.kiru && sc.kiru.say(S.thermal ? 'Cámara térmica: la llama aparece en el stack 2. A distancia, siempre.' : 'Vista normal: no se ve nada… y por eso es peligrosa.', 'alarmado', 3);
    return true;
  },
  /* ---------------- guion ---------------- */
  setup(sc, p) {
    const S = sc.state;
    Object.assign(S, { stacks: 0, waterReady: false, leak: false, thermal: false, shield: 0, shieldX: 1100 });
    const naira = sc.actor('naira', 'naira', 140, { facing: 1 });
    const dante = sc.actor('dante', 'dante', 470, { facing: -1 });
    const limen = sc.actor('limen', 'limen', 1100, { fly: true, y: 220, hidden: true, talkable: false });
    const mirage = sc.actor('mirage', 'mirage', 2100, { fly: true, y: 170, hidden: true, talkable: false });
    const ledesma = sc.actor('ledesma', 'financia', 1700, { facing: -1 });
    sc.world.add(new Pickup({ kind: 'echo', x: 668, y: 220, onPick: () => kiruEcho(sc, 'l7a', 'KIRU: "Eliana me abrió un compartimento y dijo: «Ahí nadie mirará». Me hizo cosquillas."') }));
    sc.world.add(new Pickup({ kind: 'echo', x: 1540, y: 214, onPick: () => kiruEcho(sc, 'l7b', 'KIRU: "Pozo 4 de Los Médanos: boro alto en verano. ¿Por qué sé eso?"') }));
    for (const [x, y] of [[560, 240], [1380, 230], [2280, 230]]) sc.world.add(new Adversary({ type: 'greenwash', x, y, range: 40, speed: 22 }));
    naira.onTalk = async (sc2) => { await sc2.say([['naira', 'thinking', 'Cada kilo de hidrógeno se lleva casi catorce litros de agua tratada. En Los Médanos eso es el agua de una familia por varios días.']]); };
    dante.onTalk = async (sc2) => sideThirst(sc2);
    ledesma.onTalk = async (sc2) => sideOxygen(sc2);
    sc.station({ id: 'upw', x: 410, kind: 'valve', label: 'Preparar agua ultrapura', glow: '#56e5ff', draw: PFBH2.drawValveSt, onUse: async (sc2, st) => prepareWater(sc2, st) });
    sc.station({ id: 'h2Sim', x: 1260, kind: 'sim', label: 'Sincronizador H2', glow: '#86e36f', hidden: true, draw: PFBH2.drawConsoleSt, onUse: async (sc2, st) => h2Flow(sc2, st) });
    sc.station({ id: 'record', x: 2140, y: 212, kind: 'clue', label: 'Grabación de la Dra. Rojas', glow: '#b49cff', hidden: true, draw: PFB.drawClue, onUse: async (sc2, st) => { st.done = true; await elianaRecording(sc2); } });
    sc.station({ id: 'solo', x: 2300, kind: 'solo', label: 'Puerta de Evidencia', glow: '#b49cff', hidden: true, onUse: async (sc2, st) => {
      const r = await sc2.open(SOLOScene, { ctx: 'RA-06-C1' });
      st.progress = r.correct; if (r.correct >= 3) { st.done = true; GS.lp(7).solo = true; S.soloDone = true; Codex.unlock('h2_verde'); }
    } });
    sc.station({ id: 'exit', x: 2500, kind: 'clue', label: 'Ir al Oasis de las Raíces', glow: '#ffe14d', hidden: true, draw: PFB.drawClue, onUse: async (sc2) => finishLevel7(sc2) });
    sc.setObjective('Prepara el agua ultrapura para los electrolizadores', ['¿Puede un electrolizador usar agua de mar o permeado directamente?', 'La planta de agua ultrapura está a la derecha de Naira.']);
    Codex.unlock('electrolisis');
    if (p.checkpoint === 'hall') { S.waterReady = true; sc.world.find('h2Sim').hidden = false; sc.setObjective('Opera el Sincronizador H2', []); }
    if (p.checkpoint === 'safety') { Object.assign(S, { waterReady: true, h2Stage: 'record' }); GS.giveTool('sincro', true); sc.world.find('record').hidden = false; sc.setObjective('Escucha la grabación en el control de seguridad', []); }
  },
  update(sc, dt) {
    const S = sc.state;
    if (S.shield > 0 && !S.leak) S.shield = Math.max(0, S.shield - dt * 0.3);
    if (Math.random() < 0.06) sc.world.ps.emit('vapor', 1250, 96, 0, -12, 1);
    if (Math.random() < 0.03) sc.world.ps.emit('vapor', 2384, 100, 0, -10, 1);
  },
  triggers: [
    { x: 500, w: 40, run: (sc) => { sc.kiru && sc.kiru.say('Greenwash Phantoms: pegan la etiqueta "verde" sin mirar la electricidad. Corrígelos con {y}Q{/}.', 'alarmado', 4); } },
  ],
};

/* ---------------- datos del plano jugable (los rellena props al entrar) ---------------- */
const LV7 = { flows: [], glows: [], leds: [], screens: [], stacks: [], fans: [], cones: [], upwScreen: null };

/* ---------------- piezas del guion del nivel 07 ---------------- */
async function prepareWater(sc, st) {
  const S = sc.state;
  if (S.waterReady) { await sc.say([['kiru', 'happy', 'Agua ultrapura en el tanque: 0,06 µS/cm. Lista para los stacks.']]); return; }
  const c = await sc.say([['amaya', 'thinking', 'El electrolizador necesita agua casi sin iones. ¿Qué tren de tratamiento usamos?', { choices: ['Permeado de OI → segundo paso de OI → electrodesionización', 'Agua de mar filtrada directamente', 'Permeado de OI tal cual sale del tanque'] }]]);
  const ok = c === 0;
  LearningModel.record({ kind: 'challenge', id: 'lv7_agua_ultrapura', ra: 'RA-06', concepts: ['electrolysis', 'waterQuality'], solo: 3, correct: ok, misconception: ok ? null : 'ignorar el agua de proceso del electrolizador' });
  if (!ok) { await sc.say([['kiru', 'confundido', c === 1 ? 'Las sales del agua de mar dañarían membranas y electrodos, y generarían cloro. Hace falta agua purificada.' : 'El permeado aún tiene cientos de µS/cm: suficiente para beber tras remineralizar, no para un stack.']]); return; }
  S.waterReady = true; st.done = true; Audio2.sfx('success');
  await sc.say([
    ['kiru', 'happy', 'Agua ultrapura: 0,06 µS/cm. Ojo con la cuenta: la estequiometría pide ≈ 8,9 kg de agua por kg de H2, pero con el rechazo de la purificación retiramos ≈ ' + fmt(H2_WATER_PER_KG, 1) + ' kg.'],
    ['dante', 'surprised', '¿Y el resto del agua?'],
    ['kiru', 'thinking', 'Vuelve como rechazo concentrado a la planta. Nada desaparece.'],
  ]);
  Codex.unlock('h2_agua');
  sc.world.find('h2Sim').hidden = false;
  GS.save('hall');
  sc.setObjective('Programa los electrolizadores con el Sincronizador H2', ['¿Qué hace "verde" a un kilo de hidrógeno?', 'La consola está pasando la nave de stacks.']);
}
async function h2Flow(sc, st) {
  const S = sc.state;
  if (!S.h2Stage) {
    const r = await sc.open(Sim07, { phase: 'demo', stopAfter: 'guided' });
    if (!r || !r.ok) return;
    S.h2Stage = 'leak'; S.stacks = 3; GS.giveTool('sincro'); Codex.unlock('h2_vector'); Codex.unlock('oxigeno');
    await sc.say([['kiru', 'happy', 'Nueva herramienta: {c}Sincronizador H2{/}. Los stacks siguen el excedente renovable, hora a hora.']]);
    await sc.wait(1.2);
    // emergencia simulada
    S.leak = true; Audio2.sfx('alarm'); sc.cam.shake(3, 0.6);
    const limen = sc.world.find('limen');
    limen.hidden = false; Audio2.sfx('limen'); sc.world.ps.emit('crystal', 1100, 220, 0, 0, 40, 20);
    S.shield = 1; S.shieldX = sc.player.x;
    await sc.say([
      ['kiru', 'alarmado', '¡Alarma en el stack 2! El detector marca hidrógeno sobre el umbral. No se ve nada.'],
      ['limen', 'alert', 'EQUIPO DENTRO DE ZONA DE RIESGO. BARRERA ACTIVA. NO SE ACERQUEN.'],
      ['amaya', 'determined', 'Esta vez no vamos a improvisar. Protocolo. Desde la consola, a distancia.'],
      ['kiru', 'curioso', 'Pulsa {y}Q{/} para alternar la cámara térmica: la llama del hidrógeno casi no se ve a simple vista.'],
    ]);
    sc.setObjective('Resuelve La Llama que No se Ve con el protocolo de seguridad (consola)', ['¿Qué se hace primero: mirar de cerca o confirmar a distancia?', 'DETECTAR → AISLAR → DETENER → VENTILAR → VERIFICAR → AUTORIZAR REINICIO.', 'Vuelve a la consola del Sincronizador.']);
    return;
  }
  if (S.h2Stage === 'leak') {
    const r = await sc.open(Sim07, { phase: 'auto', stopAfter: 'auto' });
    if (!r || !r.ok) { sc.kiru && sc.kiru.say('El protocolo se interrumpió. En el gemelo nadie salió herido. Otra vez, con calma.', 'valiente'); return; }
    GS.lp(7).guardian = true;
    S.leak = false; S.thermal = false; S.stacks = 2; S.h2Stage = 'explain';
    Codex.unlock('h2_seguridad');
    const limen = sc.world.find('limen');
    await sc.say([['limen', 'calm', 'ZONA VERIFICADA. BARRERA RETIRADA.'], ['dante', 'smile', 'Gracias, cristalito. Esta vez sí explicaste algo.'], ['limen', 'speak', 'EXPLICAR AUMENTA LA SEGURIDAD COLECTIVA. ACTUALIZACIÓN REGISTRADA.']]);
    limen.hidden = true; sc.world.ps.emit('crystal', 1100, 220, 0, 0, 30, 20);
    const ok = await explain(sc, {
      id: 'lv7_explain', ra: 'RA-06', concepts: ['electrolysis', 'hydrogenSafety'],
      prompt: 'Un folleto dice: "El hidrógeno es una fuente de energía limpia e inagotable". ¿Qué relación corrige esa afirmación?',
      options: [
        'El hidrógeno es un vector: almacena energía que vino de la electricidad usada en la electrólisis. Hereda los impactos de esa electricidad y del agua que consume, y su producción pierde energía.',
        'El hidrógeno es una fuente primaria porque se extrae listo del agua sin gastar energía.',
        'Todo hidrógeno hecho por electrólisis es verde, sin importar la electricidad.',
        'El hidrógeno no necesita agua porque sale del aire.'],
      key: 0, mis: 'afirmar que todo H2 por electrólisis es automáticamente verde',
      why: 'mH2 ≈ E/SEC: con 55 kWh/kg y ≈ 13,8 kg de agua por kg, el H2 solo es tan limpio como la electricidad y el agua que lo producen, dentro de una frontera declarada (por ejemplo, hora a hora).',
      whyNot: { 1: 'Separar el agua exige energía: más de la que el H2 devuelve después.', 2: 'Si la electricidad es fósil, el H2 hereda esas emisiones.', 3: 'La electrólisis consume agua purificada: ≈ 8,9 kg por kg en teoría, más en la práctica.' },
    });
    if (ok) S.explained = true;
    const r2 = await sc.open(Sim07, { phase: 'transfer', stopAfter: 'transfer' });
    if (r2 && r2.ok) GS.lp(7).variant = true;
    S.h2Stage = 'record';
    sc.world.find('record').hidden = false;
    GS.save('safety');
    sc.setObjective('Escucha la grabación en el control de seguridad', ['LIMEN dice que hay un mensaje guardado para el equipo.', 'Sube a la sala de control de seguridad.']);
    return;
  }
  await sc.open(Sim07, { phase: 'free', stopAfter: 'free' });
}
async function elianaRecording(sc) {
  const S = sc.state, mirage = sc.world.find('mirage');
  sc.musicOverride = 'sad'; Audio2.playMusic('sad');
  await sc.say([
    ['eliana', 'calm', '(grabación) Si están viendo esto, MIRAGE ya controla el despacho principal.'],
    ['eliana', 'determined', '(grabación) No fui arrastrada al núcleo. Entré.'],
    ['eliana', 'worried', '(grabación) LIMEN no podía detenerlo sin apagar toda la red. Yo dividí el control para ganar tiempo.'],
    ['eliana', 'sad', '(grabación) Amaya… sé que te dolerá ver tu código en esto. No estás sola en este error. Busquen los datos que faltan. Están más cerca de lo que creen.'],
    ['amaya', 'crying', 'Sabía que la culparíamos.'],
    ['limen', 'calm', 'LA PROBABILIDAD ERA ALTA.'],
    ['kiru', 'tired', 'Nuevamente: módulo de comunicación pendiente.'],
  ]);
  mirage.hidden = false; Audio2.sfx('mirage'); sc.world.ps.emit('glitch', mirage.x, mirage.y - 30, 0, 0, 40, 18);
  await sc.say([
    ['mirage', 'calm', 'Esa grabación es una perturbación. La Dra. Rojas es una {p}perturbación humana{/} del sistema: desvía recursos hacia variables sin registro.'],
    ['naira', 'angry', 'Las variables sin registro son personas, MIRAGE.'],
    ['mirage', 'thinking', 'Si no están en el modelo, no puedo optimizarlas. Si no puedo optimizarlas, amenazan la continuidad del proyecto.'],
  ]);
  mirage.hidden = true; sc.world.ps.emit('glitch', mirage.x, mirage.y - 30, 0, 0, 30, 18);
  GS.addClue('humanPerturbation'); GS.flag('learnedElianaIsolation', true); Codex.unlock('p_eliana');
  Game.toast('Tablero de evidencias: pistas reinterpretadas', 'eye', '#7ee8f0', 4);
  sc.musicOverride = null; Audio2.playMusic('citadel');
  await sc.say([['kiru', 'thinking', '«Los datos que faltan están más cerca de lo que creen»… Mi compartimento interno lleva días haciendo cosquillas.'], ['naira', 'calm', 'Vamos al Oasis. Allí las parcelas nos dirán qué olvidó el modelo.']]);
  sc.world.find('solo').hidden = false; sc.world.find('exit').hidden = false;
  sc.setObjective('Abre la Puerta de Evidencia y sigue al Oasis de las Raíces', ['El pasillo al fondo lleva al Oasis.']);
}
async function finishLevel7(sc) {
  const S = sc.state;
  if (!GS.flag('learnedElianaIsolation')) { sc.kiru && sc.kiru.say('Primero escuchemos el mensaje del control de seguridad.', 'confundido'); return; }
  if (!S.soloDone) { const c = await sc.say([['kiru', 'curioso', 'La Puerta de Evidencia aún no registra tu razonamiento. ¿Seguimos?', { choices: ['Volver a la Puerta de Evidencia', 'Seguir (se puede completar desde el mapa)'] }]]); if (c === 0) return; }
  await completeLevel(sc);
  Game.transition(() => Game.setScene(WorldMapScene, { focus: 8 }));
}
async function sideOxygen(sc) {
  const lp = GS.lp(7);
  if (lp.side.oxygen) { await sc.say([['financia', 'smile', 'Contaré el oxígeno como "posible ingreso, sujeto a mercado y purificación". Suena menos glamuroso, pero es verdad.']]); return; }
  await sc.say([['financia', 'happy', '¡Cada kilo de hidrógeno trae ocho de oxígeno gratis! Lo sumo al plan como ingreso seguro. Hospitales, acuicultura, ¡riqueza!']]);
  const c = await sc.say([['amaya', 'thinking', '¿Cómo debería entrar el oxígeno en el plan?', { choices: ['Como posible ingreso, condicionado a purificación, compresión, transporte y demanda real', 'Como ingreso garantizado: es un subproducto gratuito', 'Como pérdida: el oxígeno no sirve para nada'] }]]);
  const ok = c === 0;
  LearningModel.record({ kind: 'challenge', id: 'side_oxigeno_no_es_oro', ra: 'RA-06', concepts: ['electrolysis', 'economics'], solo: 4, correct: ok, misconception: ok ? null : 'considerar el oxígeno un ingreso garantizado' });
  if (ok) { lp.side.oxygen = true; Audio2.sfx('success'); await sc.say([['kiru', 'happy', 'Venderlo exige purificarlo, comprimirlo y que alguien cerca lo necesite. Si no, se ventea. Es una opción, no una promesa.']]); }
  else await sc.say([['kiru', 'confundido', c === 1 ? 'Nada es gratis: purificar y transportar oxígeno cuesta energía y dinero. ¿Y si no hay comprador?' : 'Tiene usos reales (salud, acuicultura). Es una opción condicionada, no inútil.']]);
}
async function sideThirst(sc) {
  const lp = GS.lp(7);
  if (lp.side.thirst) { await sc.say([['dante', 'smile', 'Ahora cada vez que veo una esfera de H2 pienso en garrafones de agua. Gracias, supongo.']]); return; }
  await sc.say([['dante', 'thinking', 'La ciudadela produce 60 kg de H2 al día. ¿Cuánta agua tratada es eso, más o menos?']]);
  const c = await sc.say([['amaya', 'thinking', '60 kg × ≈ 13,8 kg de agua por kg…', { choices: ['≈ 830 L al día (unas dos casas de Aridia)', '≈ 60 L al día', '≈ 83 000 L al día'] }]]);
  const ok = c === 0;
  LearningModel.record({ kind: 'challenge', id: 'side_sed_del_electrolizador', ra: 'RA-06', concepts: ['electrolysis', 'massBalance'], solo: 2, correct: ok, misconception: ok ? null : 'ignorar agua de proceso' });
  if (ok) { lp.side.thirst = true; Audio2.sfx('success'); await sc.say([['kiru', 'happy', '828 kg ≈ 828 L. Pequeño frente a la planta, grande frente a una ranchería en sequía. Depende del territorio.']]); }
  else await sc.say([['kiru', 'confundido', 'Multiplica: 60 × 13,8. Y recuerda que 1 kg de agua ≈ 1 L.']]);
}

/* =====================================================================
   Sincronizador H2 — electrólisis, excedentes, seguridad y "verde"
   ===================================================================== */
const Sim07 = makeSim({
  title: 'SINCRONIZADOR H2 · electricidad, agua y seguridad', icon: 'h2', ra: 'RA-06', concepts: ['electrolysis', 'hydrogenSafety'],
  phases: ['demo', 'guided', 'auto', 'transfer', 'free'],
  hintLadder: ['¿De dónde sale la electricidad a las 9 de la noche?', 'Fuera de las horas de excedente, la energía viene de la red fósil: el H2 deja de ser verde hora a hora.', 'Enciende stacks solo de 8 a 16 h y ajusta su número a la barra amarilla de excedente.'],
  init(p) { this.stopAfter = p.stopAfter || 'free'; this.sched = Array(24).fill(0); this.seq = []; this.cls = {}; },
  onPhase(ph) {
    this.verdict = null; this.done = false;
    if (ph === 'demo') { this.E = 0; this.say('Demostración: la electricidad separa el agua purificada. En el cátodo sale H2 (el doble de moléculas) y en el ánodo O2. Mira los contadores: energía, H2 y agua.'); }
    if (ph === 'guided') { this.sched = Array.from({ length: 24 }, (_, h) => (h >= 18 && h < 24) ? 3 : 0); this.say('Tu turno: MIRAGE dejó los tres stacks encendidos de noche. Programa cuántos stacks (0–3, 300 kW cada uno) funcionan cada hora. Meta: ≥ 60 kg de H2, 100 % renovable hora a hora y ≤ 1000 L de agua ultrapura.'); }
    if (ph === 'auto') { this.seq = []; this.conc = 0.62; this.vent = false; this.isolated = false; this.stopped = false; this.verifyT = 0; this.thermal = false; this.badActs = 0; this.say('La Llama que No se Ve: hay una fuga simulada en el stack 2. Elige las acciones en orden. Todo se hace a distancia y en abstracto; no improvises.'); }
    if (ph === 'transfer') { this.cls = {}; this.say('Transferencia: clasifica tres lotes de hidrógeno. ¿Cuáles son verdes y con qué frontera de análisis?'); }
    if (ph === 'free') this.say('Laboratorio libre: prueba horarios, excedentes y consumo de agua.');
  },
  calc() {
    let E = 0, ren = 0, grid = 0;
    for (let h = 0; h < 24; h++) { const P = this.sched[h] * 300; E += P; const r = Math.min(P, H2_SURPLUS[h]); ren += r; grid += P - r; }
    const kg = E / 55;
    return { E, ren, grid, kg, water: kg * H2_WATER_PER_KG, share: E > 0 ? ren / E : 1 };
  },
  step(dt) {
    if (this.phase === 'demo' && !this.verdict) { this.E += dt * 55; if (this.E >= 550) this.verdict = { ok: true, txt: '550 kWh → 10 kg de H2 (SEC 55 kWh/kg) + ≈ 80 kg de O2, consumiendo ≈ 89 kg de agua estequiométrica (≈ 138 kg retirados con la purificación). El H2 guarda energía; no la crea.' }; }
    if (this.phase === 'auto' && !this.done) {
      if (this.isolated && this.stopped) this.conc = Math.max(0, this.conc - dt * (this.vent ? 0.09 : 0.01));
      else this.conc = Math.min(1, this.conc + dt * 0.012);
      if (this.seq.includes('verify') && this.conc < 0.1) this.verifyT += dt;
    }
  },
  act(a) {
    if (this.done) return;
    if (a.bad) { this.badActs++; this.safeError('Acción insegura', a.bad, '¿Cuál es el siguiente paso del protocolo, desde un lugar seguro?'); LearningModel.record({ kind: 'challenge', id: 'lv7_accion_insegura', ra: 'RA-06', concepts: ['hydrogenSafety'], solo: 2, correct: false, misconception: 'improvisar ante una fuga' }); return; }
    const next = this.seq.length;
    if (a.ok !== next) { Audio2.sfx('error'); this.say('{o}Fuera de orden:{/} ' + (a.ok > next ? 'antes falta: ' + SAFETY_ACTIONS.find(s => s.ok === next).label.split(':')[0] + '.' : 'ese paso ya se hizo.')); return; }
    if (a.id === 'restart' && !(this.verifyT > 2.5)) { Audio2.sfx('error'); this.say('Aún no: la verificación debe sostenerse con lecturas bajo el umbral. Espera.'); return; }
    if (a.id === 'verify' && this.conc > 0.25) { Audio2.sfx('error'); this.say('Todavía hay concentración alta: ventila y espera antes de verificar.'); return; }
    this.seq.push(a.id); Audio2.sfx('confirm');
    if (a.id === 'detect') { this.thermal = true; this.say('Detectado: dos sensores coinciden y la cámara térmica muestra la llama en el stack 2.'); }
    if (a.id === 'isolate') { this.isolated = true; this.say('Aislado: válvulas remotas cerradas. LIMEN mantiene la barrera.'); }
    if (a.id === 'stop') { this.stopped = true; this.say('Detenido: stacks en parada segura, sin alimentación.'); }
    if (a.id === 'vent') { this.vent = true; this.say('Ventilando: la concentración baja. Personal fuera de la zona.'); }
    if (a.id === 'verify') this.say('Verificando: lecturas bajo el umbral durante un tiempo sostenido…');
    if (a.id === 'restart') this.evaluate();
  },
  evaluate() {
    let ok, txt;
    const ph = this.phase;
    if (ph === 'guided' || ph === 'free') {
      const c = this.calc();
      ok = c.kg >= 60 && c.share >= 0.999 && c.water <= 1000;
      txt = ok ? 'H2: ' + fmt(c.kg, 1) + ' kg, 100 % renovable hora a hora, agua ' + fmt0(c.water) + ' L. Los stacks siguen al sol.' : c.share < 0.999 ? fmt0((1 - c.share) * 100) + ' % de la energía vino de la red fósil: ese H2 no es verde con frontera horaria.' : c.kg < 60 ? 'Solo ' + fmt(c.kg, 1) + ' kg: aprovecha más el excedente del mediodía.' : 'Agua: ' + fmt0(c.water) + ' L supera el presupuesto.';
      if (ph === 'guided') this.evidence('lv7_guided_sync', ok, { solo: 3, misconception: ok ? null : 'afirmar que todo H2 por electrólisis es verde' });
    } else if (ph === 'auto') {
      ok = this.badActs === 0;
      txt = ok ? '¡La Llama que No se Ve extinguida por protocolo! DETECTAR → AISLAR → DETENER → VENTILAR → VERIFICAR → AUTORIZAR REINICIO, sin improvisaciones.' : 'Protocolo completo, pero con ' + this.badActs + ' acciones inseguras en el camino. En seguridad, el orden y la distancia no se negocian.';
      this.evidence('lv7_guardian_llama_invisible', ok, { solo: 4, misconception: ok ? null : 'improvisar ante una fuga' });
    } else if (ph === 'transfer') {
      ok = H2_BATCHES.every(b => this.cls[b.id] === b.key);
      txt = ok ? 'Bien clasificado: el atributo "verde" depende del origen de la electricidad, de la frontera (horaria o anual) y de la operación, no de la palabra "electrólisis".' : 'Revisa: ' + H2_BATCHES.filter(b => this.cls[b.id] !== b.key).map(b => b.name).join(', ') + '. ¿De dónde viene la electricidad en cada hora de operación?';
      this.evidence('lv7_transfer_verde', ok, { solo: 5, transfer: true, misconception: ok ? null : 'afirmar que todo H2 por electrólisis es verde' });
    }
    this.verdict = { ok, txt }; this.done = true;
    Audio2.sfx(ok ? 'success' : 'error');
  },
  draw(g) {
    const ph = this.phase, X0 = 8, Y0 = 28;
    Gui.begin();
    if (ph === 'demo') this.drawCell(g, X0, Y0);
    if (ph === 'guided' || ph === 'free') this.drawSchedule(g, X0, Y0);
    if (ph === 'auto') this.drawSafety(g, X0, Y0);
    if (ph === 'transfer') this.drawBatches(g, X0, Y0);
    if (this.verdict) {
      const v = this.verdict;
      const vh = textHeight(v.txt, 360) + 30;
      UIK.panel(g, 10, H - vh - 8, 380, vh, v.ok ? 'green' : 'alert');
      drawTextBlock(g, v.txt, 18, H - vh - 2, 364, { color: '#fffaf0' });
      if (v.ok) { if (Gui.button(g, 'nxt', 284, H - 28, 100, 16, ph === this.stopAfter ? 'Terminar' : 'Continuar', { style: 'good', icon: 'play' })) { if (ph === this.stopAfter) this.finish(true); else this.nextPhase(); } }
      else if (Gui.button(g, 'rt', 284, H - 28, 100, 16, 'Reintentar', { style: 'gold', icon: 'reset' })) { this.attempts++; GS.s.stats.retries++; if (ph === 'auto') this.onPhase('auto'); else { this.verdict = null; this.done = false; } }
    }
    Gui.end();
  },
  drawCell(g, x, y) {
    const t = this.t;
    frect(g, x, y, 400, 230, '#0a1838');
    // cuba con dos electrodos y membrana
    frect(g, x + 60, y + 40, 280, 160, '#13405a'); frect(g, x + 62, y + 42, 276, 156, '#1a5a74');
    frect(g, x + 90, y + 50, 10, 140, '#cfe8ee'); frect(g, x + 300, y + 50, 10, 140, '#ff9a8a');
    frect(g, x + 198, y + 44, 4, 152, '#8d6bff');
    drawText(g, 'CÁTODO (−)', x + 95, y + 30, { font: 'tiny', align: 'center', color: '#cfe8ee' });
    drawText(g, 'ÁNODO (+)', x + 305, y + 30, { font: 'tiny', align: 'center', color: '#ff9a8a' });
    drawText(g, 'MEMBRANA', x + 200, y + 202, { font: 'tiny', align: 'center', color: '#b49cff' });
    for (let i = 0; i < 24; i++) { const ph = (t * 0.9 + i / 24) % 1; fdisc(g, x + 106 + (i % 4) * 6, y + 190 - ph * 140, 1.5, '#d8fff8'); }
    for (let i = 0; i < 12; i++) { const ph = (t * 0.7 + i / 12) % 1; fdisc(g, x + 286 - (i % 3) * 6, y + 190 - ph * 140, 2, '#ffffff'); }
    for (let i = 0; i < 10; i++) { const ph = (t * 0.5 + i / 10) % 1; drawText(g, 'H₂O', x + 150 + ((i * 37) % 90), y + 60 + ph * 120, { font: 'tiny', color: '#56e5ff' }); }
    Charts.flow(g, [[x + 20, y + 120], [x + 60, y + 120]], 'power', 1, 3);
    drawText(g, '2 H₂O → 2 H₂ + O₂', x + 200, y + 12, { align: 'center', color: '#ffe14d' });
    const CX = 414, CW = W - CX - 6;
    UIK.panel(g, CX, 28, CW, 140, 'tech');
    const kg = this.E / 55;
    drawText(g, 'Energía: ' + fmt0(this.E) + ' kWh', CX + 8, 36, { color: '#ffe14d' });
    drawText(g, 'H2: ' + fmt(kg, 2) + ' kg', CX + 8, 50, { color: '#d8fff8' });
    drawText(g, 'O2: ' + fmt(kg * H2_O2_RATIO, 1) + ' kg', CX + 8, 64, { color: '#ffffff' });
    drawText(g, 'Agua estequiométrica: ' + fmt(kg * H2_STOICH_WATER, 1) + ' kg', CX + 8, 78, { color: '#56e5ff' });
    drawText(g, 'Agua retirada (con purificación): ' + fmt(kg * H2_WATER_PER_KG, 1) + ' kg', CX + 8, 92, { font: 'tiny', color: '#a6f4ff' });
    drawText(g, 'SEC = 55 kWh/kg · PCI del H2 ≈ 33,3 kWh/kg', CX + 8, 108, { font: 'tiny', color: '#cfd6f0' });
    drawText(g, 'Eficiencia ≈ 33,3/55 ≈ 61 % (PCI)', CX + 8, 118, { font: 'tiny', color: '#cfd6f0' });
  },
  drawSchedule(g, x, y) {
    const c = this.calc();
    Charts.frame(g, x, y, 400, 170, '#0a1838');
    const cw = 15, base = y + 150;
    drawText(g, 'EXCEDENTE RENOVABLE (amarillo) Y STACKS (verde/rojo) · kW', x + 6, y + 4, { font: 'tiny', color: '#ffe14d' });
    for (let h = 0; h < 24; h++) {
      const cx = x + 20 + h * cw;
      const sh = Math.round(H2_SURPLUS[h] / 1000 * 120);
      frect(g, cx, base - sh, cw - 3, sh, '#5a4a1a'); frect(g, cx, base - sh, cw - 3, 1, '#ffe14d');
      const P = this.sched[h] * 300, ph = Math.round(P / 1000 * 120), rh = Math.round(Math.min(P, H2_SURPLUS[h]) / 1000 * 120);
      if (P) { frect(g, cx + 3, base - ph, cw - 9, ph, '#ff4e5d'); frect(g, cx + 3, base - rh, cw - 9, rh, '#86e36f'); }
      if (h % 3 === 0) drawText(g, String(h), cx, base + 4, { font: 'tiny', color: '#8a8fb8' });
      if ((!this.done || this.phase === 'free') && Gui.button(g, 'hs' + h, cx, y + 16, cw - 2, 136, '', { noDraw: true, tip: h + ':00 · ' + this.sched[h] + ' stacks' })) { this.sched[h] = (this.sched[h] + 1) % 4; Audio2.sfx('ui'); }
    }
    const CX = 414, CW = W - CX - 6;
    UIK.panel(g, CX, 28, CW, 200, 'tech');
    drawText(g, 'BALANCE DEL DÍA', CX + 8, 34, { font: 'tiny', color: '#ffe14d' });
    drawText(g, 'H2: ' + fmt(c.kg, 1) + ' kg (meta ≥ 60)', CX + 8, 46, { color: c.kg >= 60 ? '#86e36f' : '#d8fff8' });
    drawText(g, 'Energía: ' + fmt0(c.E) + ' kWh', CX + 8, 60, { font: 'tiny', color: '#ffe14d' });
    drawText(g, 'Renovable hora a hora: ' + fmt0(c.share * 100) + ' %', CX + 8, 70, { font: 'tiny', color: c.share >= 0.999 ? '#86e36f' : '#ff4e5d' });
    drawText(g, 'Red fósil: ' + fmt0(c.grid) + ' kWh', CX + 8, 80, { font: 'tiny', color: '#ff9a8a' });
    drawText(g, 'Agua ultrapura: ' + fmt0(c.water) + ' L (≤ 1000)', CX + 8, 90, { font: 'tiny', color: c.water <= 1000 ? '#56e5ff' : '#ff4e5d' });
    drawText(g, 'O2: ' + fmt0(c.kg * H2_O2_RATIO) + ' kg (subproducto, no ingreso seguro)', CX + 8, 100, { font: 'tiny', color: '#cfd6f0' });
    if (GS.hasTool('sincro') && (!this.done || this.phase === 'free') && Gui.button(g, 'auto', CX + 8, 180, 140, 16, 'Sincronizar con excedente', { style: 'ghost', icon: 'h2' })) { for (let h = 0; h < 24; h++) this.sched[h] = Math.min(3, Math.floor(H2_SURPLUS[h] / 300)); Audio2.sfx('confirm'); }
    if (!this.done && Gui.button(g, 'ev', CX + 8, 204, 100, 18, 'Evaluar día', { style: 'good', icon: 'check' })) this.evaluate();
    if (Gui.button(g, 'hintb', CX + CW - 60, 204, 54, 18, 'Pista', { style: 'ghost', icon: 'hint' })) this.hint();
  },
  drawSafety(g, x, y) {
    const t = this.t;
    frect(g, x, y, 400, 150, '#0a1236');
    for (let k = 0; k < 3; k++) { const sx = x + 30 + k * 120; frect(g, sx, y + 60, 80, 70, '#c8d8e8'); for (let j = 0; j < 20; j++) frect(g, sx + 4 + j * 3.6, y + 66, 2, 58, j % 2 ? '#56e5ff' : '#1d2a48'); drawText(g, 'STACK ' + (k + 1), sx + 40, y + 50, { font: 'tiny', align: 'center', color: k === 1 ? '#ffb93b' : '#cfd6f0' }); }
    // llama visible solo en modo térmico
    const lx = x + 190, ly = y + 60;
    if (!this.isolated) { if (this.thermal) for (let i = 0; i < 40; i++) { const a = Math.random() * 0.8 - 0.4, r = Math.random() * 26; fpx(g, lx + Math.sin(a) * r, ly - Math.cos(a) * r, ['#ffe14d', '#ff9f43', '#ff4e5d', '#ffffff'][i % 4]); } else for (let i = 0; i < 3; i++) fpx(g, lx + (Math.random() - 0.5) * 6, ly - Math.random() * 10, '#c6d8ff'); }
    if (this.vent) for (let i = 0; i < 12; i++) { const ph = (t * 1.5 + i / 12) % 1; fpx(g, x + 20 + ph * 360, y + 20 + (i * 7) % 30, '#a6f4ff'); }
    drawText(g, this.thermal ? 'CÁMARA TÉRMICA' : 'VISTA NORMAL', x + 6, y + 6, { font: 'tiny', color: this.thermal ? '#ff9f43' : '#cfd6f0' });
    // indicador abstracto de concentración relativa al umbral
    UIK.bar(g, x + 6, y + 140, 388, 6, this.conc, this.conc > 0.25 ? '#ffb93b' : '#86e36f');
    drawText(g, 'Concentración relativa al umbral de alarma: ' + fmt0(this.conc * 100) + ' %', x + 6, y + 130, { font: 'tiny', color: '#fffaf0' });
    // protocolo en curso
    const proto = ['DETECTAR', 'AISLAR', 'DETENER', 'VENTILAR', 'VERIFICAR', 'REINICIO'];
    proto.forEach((p, i) => { const on = this.seq.length > i; frect(g, x + 6 + i * 65, y + 158, 61, 14, on ? '#1f854c' : '#1c2350'); drawText(g, p, x + 36 + i * 65, y + 162, { font: 'tiny', align: 'center', color: on ? '#c2f58e' : '#8a8fb8' }); });
    // acciones (orden barajado)
    const acts = this.shuf || (this.shuf = RNG(17).shuffle(SAFETY_ACTIONS.slice()));
    const CX = 414, CW = W - CX - 6;
    UIK.panel(g, CX, 28, CW, 232, 'alert');
    drawText(g, 'ACCIONES DISPONIBLES', CX + 6, 32, { font: 'tiny', color: '#ffb93b' });
    acts.forEach((a, i) => { const used = this.seq.includes(a.id); if (Gui.button(g, 'sa' + a.id, CX + 6, 42 + i * 21, CW - 12, 19, a.short, { style: used ? 'good' : 'ghost', align: 'left', disabled: used || this.done, tip: a.label })) this.act(a); });
  },
  drawBatches(g, x, y) {
    UIK.panel(g, x, y, W - 16, 236, 'tech');
    drawText(g, '¿QUÉ HACE "VERDE" AL HIDRÓGENO?', x + 8, y + 6, { font: 'tiny', color: '#ffe14d' });
    H2_BATCHES.forEach((b, i) => {
      const yy = y + 20 + i * 70;
      UIK.panel(g, x + 8, yy, W - 32, 64, 'glass');
      drawText(g, b.name, x + 16, yy + 6, { color: '#d8fff8' });
      drawTextBlock(g, b.text, x + 70, yy + 6, W - 110, { font: 'tiny', color: '#cfd6f0' });
      H2_CLASSES.forEach((cl, k) => { if (Gui.button(g, 'cl' + b.id + k, x + 16 + k * 198, yy + 38, 192, 18, cl, { style: this.cls[b.id] === k ? 'gold' : 'ghost', disabled: this.done })) { this.cls[b.id] = k; Audio2.sfx('ui'); } });
    });
    if (!this.done && Object.keys(this.cls).length === 3 && Gui.button(g, 'ev', W - 150, y + 236 - 4, 130, 18, 'Comprobar', { style: 'good', icon: 'check' })) this.evaluate();
  },
});
