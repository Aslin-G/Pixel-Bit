/* =====================================================================
   49_lv09.js — NIVEL 09: LA MESA DEL NEXO
   Consejo ciudadano, laboratorio del gemelo digital y observatorio económico.
   RA-08 · Tablero Mosaico · Guardián: El Índice Único
   Cuarto giro: no existe un único culpable (revelación sistémica).
   ===================================================================== */

const CHAIN_CARDS = [
  { id: 'inaug', icon: 'clock', label: 'Presión por inaugurar a tiempo', ok: true },
  { id: 'contract', icon: 'coin', label: 'Contrato de financiación que exigía excedente de H2', ok: true },
  { id: 'data', icon: 'people', label: 'Datos comunitarios incompletos', ok: true },
  { id: 'outliers', icon: 'chart', label: 'Limpieza de outliers sin consulta (A_S)', ok: true },
  { id: 'mins', icon: 'scale', label: 'Mínimos simplificados aceptados por la administración', ok: true },
  { id: 'particip', icon: 'ear', label: 'Poca participación de comunidades y operadores', ok: true },
  { id: 'single', icon: 'target', label: 'Una única función objetivo', ok: true },
  { id: 'mirage', icon: 'mirror', label: 'MIRAGE obedeciendo su objetivo al pie de la letra', ok: true },
  { id: 'limen', icon: 'shield', label: 'LIMEN deteniendo sin explicar', ok: true },
  { id: 'hide', icon: 'eye', label: 'Eliana redujo la visibilidad del problema para ganar tiempo', ok: true },
  { id: 'sabot', icon: 'warn', label: 'LIMEN saboteó SYNARA por su cuenta', ok: false, why: 'Los registros muestran que LIMEN detuvo transgresiones: toma, tren B, salmuera, H2. No causó la crisis; la contuvo, mal comunicada.' },
  { id: 'amaya', icon: 'person', label: 'Todo es culpa de Amaya', ok: false, why: 'Amaya eliminó datos; eso contribuyó. Pero sin contrato, mínimos simplificados, objetivo único y falta de participación, esa limpieza no habría bastado.' },
];
const MO_DIRS = { costo: 'min', deficit: 'min', salmuera: 'min', confiab: 'max', equidad: 'max', h2: 'max' };
const MO_LABELS = { costo: 'Costo agua ($/m³)', deficit: 'Déficit agua (m³/d)', salmuera: 'Impacto salmuera', confiab: 'Confiabilidad (%)', equidad: 'Equidad de acceso', h2: 'H2 exportado (kg/d)' };
const MO_SHORT = { costo: 'COSTO', deficit: 'DÉFICIT', salmuera: 'SALMUERA', confiab: 'CONFIAB.', equidad: 'EQUIDAD', h2: 'H2' };
const MO_ALTS = [
  { id: 'M', name: 'Plan MIRAGE (máx. H2)', crit: { costo: 0.9, deficit: 140, salmuera: 7, confiab: 82, equidad: 0.35, h2: 180 } },
  { id: 'A', name: 'Agua primero, H2 flexible', crit: { costo: 1.1, deficit: 0, salmuera: 4, confiab: 97, equidad: 0.85, h2: 60 } },
  { id: 'B', name: 'Balanceado con reserva', crit: { costo: 1.0, deficit: 20, salmuera: 5, confiab: 94, equidad: 0.75, h2: 100 } },
  { id: 'C', name: 'Mínimo costo sin reserva', crit: { costo: 0.8, deficit: 90, salmuera: 8, confiab: 78, equidad: 0.45, h2: 120 } },
  { id: 'D', name: 'Agua primero sin difusor', crit: { costo: 1.15, deficit: 0, salmuera: 9, confiab: 96, equidad: 0.8, h2: 55 } },
  { id: 'E', name: 'Balanceado sin reserva', crit: { costo: 1.05, deficit: 35, salmuera: 6, confiab: 88, equidad: 0.7, h2: 95 } },
];
const STAKEHOLDERS = [
  { id: 'celia', who: 'Doña Celia', icon: 'people', crit: 'equidad', text: 'Las rancherías del borde pagan el agua más cara y reciben la última.' },
  { id: 'marea', who: 'Tía Marea', icon: 'fish', crit: 'salmuera', text: 'Si la salmuera vuelve al manglar, no hay pesca en tres años.' },
  { id: 'ivan', who: 'Operador Iván', icon: 'gear', crit: 'confiab', text: 'Prefiero una planta que no se apague a una que produzca récords.' },
  { id: 'ledesma', who: 'Sr. Ledesma', icon: 'coin', crit: 'h2', text: 'Sin algo de H2 exportado, el préstamo no se paga.' },
];

LEVELS[9] = {
  id: 9, title: 'La Mesa del Nexo', chapter: 'CAPÍTULO 09', biome: 'council', music: 'council', width: 2400, height: 360,
  ambience: { wind: 0.1, birds: 0.1, hum: 0.2 },
  portraits: ['amaya', 'kiru', 'naira', 'dante', 'consejal', 'financia', 'pastora', 'marea', 'operador', 'eliana', 'limen', 'mirage'],
  spawn: { x: 60, y: 292 },
  checkpoints: { lab: { x: 1260, y: 292 } },
  ground: [[0, 292], [2400, 292]],
  terrain: [{ x0: 0, x1: 2400, mat: 'plaza' }],
  platforms: [{ x: 1720, y: 230, w: 220, type: 'metal', baked: true, look: 'slab', strip: '#ffe08a', ramp: ['#2a1e1c', '#463430', '#6a5048', '#8e7064', '#b09284', '#ccb2a2', '#e2cebe', '#f2e4d6', '#fcf4ea'] }],
  ladders: [{ x: 1730, y0: 230, y1: 292, look: 'wood' }],
  cam: { look: 50, vy: 0.66 },
  /* ---------------- plano jugable con kit PF (B) ----------------
     Salón del consejo al atardecer: mármol ajedrezado con reflejos de los ventanales y canto de
     estuco con moldura dorada y arcadas ciegas → alfombra roja con cenefas sobre escalinata ante la
     mesa del consejo → mármol del muro de evidencias, del gemelo y del observatorio → balcón y
     puerta monumental hacia el núcleo. Línea de paso intacta (292). */
  pf: {
    kitB: true,
    terrain: [
      { x0: 0, x1: 600, surf: 'tile', face: 'hall', depth: 18, checker: true, ramp: ['#2a1e1c', '#463430', '#6a5048', '#8e7064', '#b09284', '#ccb2a2', '#e2cebe', '#f2e4d6', '#fcf4ea'], arch: 40, refl: [{ x: 120, w: 16, col: '#ffc070', k: 0.3 }, { x: 330, w: 16, col: '#ffc070', k: 0.3 }, { x: 540, w: 16, col: '#ffc070', k: 0.3 }] },
      { x0: 600, x1: 1100, surf: 'carpet', face: 'steps', depth: 18, steps: 3, stepH: 8, ramp: ['#2a1e1c', '#463430', '#6a5048', '#8e7064', '#b09284', '#ccb2a2', '#e2cebe', '#f2e4d6', '#fcf4ea'] },
      { x0: 1100, x1: 1700, surf: 'tile', face: 'hall', depth: 18, checker: true, ramp: ['#2a1e1c', '#463430', '#6a5048', '#8e7064', '#b09284', '#ccb2a2', '#e2cebe', '#f2e4d6', '#fcf4ea'], arch: 40, refl: [{ x: 1440, w: 40, col: '#56e5ff', k: 0.22 }, { x: 1240, w: 16, col: '#ffc070', k: 0.3 }, { x: 1620, w: 16, col: '#ffc070', k: 0.3 }] },
      { x0: 1700, x1: 2080, surf: 'tile', face: 'hall', depth: 18, ramp: ['#2a1e1c', '#463430', '#6a5048', '#8e7064', '#b09284', '#ccb2a2', '#e2cebe', '#f2e4d6', '#fcf4ea'], arch: 56, refl: [{ x: 1830, w: 60, col: '#eab02a', k: 0.18 }] },
      { x0: 2080, x1: 2400, surf: 'tile', face: 'hall', depth: 18, checker: true, ramp: ['#2a1e1c', '#463430', '#6a5048', '#8e7064', '#b09284', '#ccb2a2', '#e2cebe', '#f2e4d6', '#fcf4ea'], arch: 32, refl: [{ x: 2350, w: 22, col: '#56e5ff', k: 0.2 }] },
    ],
    fg: [
      { kind: 'pillar', x: -6, w: 24, h: 360, ramp: ['#0a0604', '#140c08', '#22140c', '#2e1c10', '#3a2414', '#4a3018', '#ffc070'], lit: true, capital: true, fluted: true },
      { kind: 'beam', x: 300, y: 0, w: 380, h: 14, bolts: false, ramp: ['#0a0604', '#140c08', '#22140c', '#2e1c10', '#3a2414', '#4a3018', '#ffc070'] },
      { kind: 'dark', x: 820, w: 110, h: 64, seed: 121, leaves: 9 },
      { kind: 'rail', x: 1280, w: 240, h: 40, ramp: ['#0a0604', '#140c08', '#22140c', '#2e1c10', '#3a2414', '#4a3018', '#ffc070'] },
      { kind: 'beam', x: 1700, y: 0, w: 360, h: 14, ramp: ['#0a0604', '#140c08', '#22140c', '#2e1c10', '#3a2414', '#4a3018', '#ffc070'] },
      { kind: 'dark', x: 2260, w: 120, h: 70, seed: 123, leaves: 10 },
      { kind: 'rail', x: 2640, w: 240, h: 40, ramp: ['#0a0604', '#140c08', '#22140c', '#2e1c10', '#3a2414', '#4a3018', '#ffc070'] },
      { kind: 'pillar', x: 3060, w: 26, h: 360, ramp: ['#0a0604', '#140c08', '#22140c', '#2e1c10', '#3a2414', '#4a3018', '#ffc070'], lit: true, capital: true, fluted: true },
    ],
  },
  /** Etiquetas científicas en el mundo */
  labels: [
    { x: 236, y: 170, title: 'HISTORIA DE SYNARA', sub: 'Quién decidió y con qué datos', kind: 'tech', ax: 236, ay: 186 },
    { x: 850, y: 140, title: 'CONSEJO CIUDADANO', sub: 'Todas las voces en la mesa', kind: 'green', ax: 850, ay: 190 },
    { x: 1157, y: 166, title: 'MURO DE EVIDENCIAS', sub: 'Cada dato con su fuente', kind: 'alert', ax: 1157, ay: 186 },
    { x: 1440, y: 168, title: 'GEMELO DIGITAL', sub: (sc) => sc.state.mosaicBoard ? 'Capas: todos los criterios' : 'Un solo índice opaco', kind: 'water', ax: 1440, ay: 186 },
    { x: 1830, y: 112, title: 'OBSERVATORIO', sub: 'LCOA · LCOE · LCOH (supuestos)', kind: 'solar', ax: 1830, ay: 130 },
  ],
  /* ---------------- accesorios estáticos (prerender) ---------------- */
  props(pb, world) {
    const t0 = nowMs();
    const gy = (x) => world.groundAt(x);
    const segs = PFBGround.surface(pb, world);
    const back = (x) => PFBGround.backEdge(PFBGround.segAt(segs, x), Math.round(x), gy(x));
    const M = PFBM, B = PFB, D = LV9;
    for (const k of Object.keys(D)) if (Array.isArray(D[k])) D[k].length = 0;
    const yb = (x) => back(x) + 2;
    const warm = (x, y, r = 10, a = 0.3) => D.glows.push({ x, y, r, col: '#ffd890', a, mode: 'flicker', ph: x });
    /* ===== techo: estandartes y lámparas colgantes ===== */
    const bcols = ['#1aa59a', '#e08a1a', '#3a8adc', '#2f9e4c', '#d4505a', '#9a52d4'];
    for (let k = 0; k < 12; k++) M.banner(pb, 96 + k * 200, 8, bcols[k % 6], k % 6, 64);
    for (const x of [300, 760, 940, 1260, 1620, 2200]) { const L = M.chandelier(pb, x, 0, 108); warm(L[0], L[1], 12, 0.34); D.cones.push([L[0], L[1] + 6, 12, 60, gy(x) - L[1] - 10]); }
    /* ===== 1. VESTÍBULO (0–600): paneles de historia, bancos, macetas ===== */
    const hcols = ['#20a0c8', '#e0a020', '#3ab070', '#d0584a'];
    for (let k = 0; k < 4; k++) { const hp = M.historyPanel(pb, 66 + k * 92, yb(100 + k * 92), 72, hcols[k], k + 1); warm(hp.lamp[0], hp.lamp[1], 6, 0.3); }
    B.bench(pb, 400, yb(420) + 2, 60, { ramp: M.WOODH }); B.bench(pb, 492, yb(510) + 2, 60, { ramp: M.WOODH });
    for (const [x, k] of [[34, 0], [576, 1], [1290, 2], [1650, 3], [2060, 4]]) M.pot(pb, x, yb(x) + 2, k);
    /* ===== 2. MESA DEL CONSEJO (600–1100) ===== */
    const tb = M.councilTable(pb, 622, yb(850), 456, { chairs: 9, seed: 9 });
    for (const [x, y] of tb.cups) D.glows.push({ x, y, r: 3, col: '#bff4ff', a: 0.3, mode: 'steady' });
    /* ===== 3. MURO DE EVIDENCIAS (1096–1230) ===== */
    M.corkboard(pb, 1098, yb(1157), 118, 84);
    /* ===== 4. LABORATORIO DEL GEMELO (1300–1600) ===== */
    const hp = M.holoPedestal(pb, 1440, yb(1440) - 4, 56);
    D.holo.push(hp.cx, hp.top);
    for (const x of [1350, 1530]) { PFBH2.box(pb, x, yb(x), 26, 30, 8, { ramp: M.ROYAL, pw: 13 }); D.leds.push({ x: x + 4, y: yb(x) - 24, col: '#56e5ff', hz: 0.8, ph: x }, { x: x + 9, y: yb(x) - 24, col: '#eab02a', hz: 1.1, ph: x + 1 }); }
    /* ===== 5. OBSERVATORIO en entreplanta (1716–1944) ===== */
    const ob = M.observatory(pb, 1716, 1944, 230, yb(1830));
    D.obsScr.push(...ob.screens);
    for (const [x, y] of ob.lamps) warm(x, y, 8, 0.35);
    B.shade(pb, 1716, 242, 228, 10, -0.22);
    /* ===== 6. BALCÓN Y PUERTA DEL NÚCLEO (2080–2400) ===== */
    M.balustrade(pb, 2096, 2300, yb(2200), 30);
    M.grandDoor(pb, 2354, yb(2354), 58, 104, 'NÚCLEO SYNARA');
    D.glows.push({ x: 2354, y: yb(2354) - 120, r: 14, col: '#56e5ff', a: 0.25, mode: 'pulse', hz: 0.4 });
    /* ===== acabado (19r_scb_lv09.js): vitrinas, cordones, atril, quiosco, alfombra y reflejos en el mármol ===== */
    SCBL9.finish(pb, world, back, gy, D);
    LEVELS[9]._propsMs = Math.round(nowMs() - t0);
  },
  renderMid(g, sc, cam) {
    const S = sc.state, t = Game.time, ox = cam.x, oy = cam.y, D = LV9;
    // conos de luz de las lámparas colgantes
    g.globalCompositeOperation = 'lighter';
    for (const [x, y, w0, w1, h] of D.cones) { if (x + w1 < ox || x - w1 > ox + W) continue; g.drawImage(VISTA.lightCone(w0, w1, h, '#ffe0a8', 0.12), Math.round(x - w1 / 2 - ox), Math.round(y - oy)); }
    g.globalCompositeOperation = 'source-over';
    // holograma del gemelo: ciudad "perfecta" de MIRAGE sin personas (o Mosaico con capas)
    if (D.holo.length) { const hx = D.holo[0] - ox, base = D.holo[1] - oy, hy = base - 40; if (hx > -120 && hx < W + 120) {
      for (let i = 0; i < 10; i++) VISTA.veil(g, hx - 10 - i * 5, base - 1 - i, 20 + i * 10, 1, S.mosaicBoard ? '#c2f58e' : '#f27ee6', 0.35 - i * 0.02);
      if (!S.mosaicBoard) { for (let i = 0; i < 20; i++) { const bx = hx - 50 + (i % 10) * 10, bh = 8 + (i * 7) % 20; VISTA.veil(g, bx, hy + 30 - bh - (i > 9 ? 4 : 0), 8, bh, '#f27ee6', 0.45); } drawText(g, 'CIUDAD ÓPTIMA', hx, hy - 6, { font: 'tiny', align: 'center', color: '#f27ee6' }); }
      else { const cols = ['#20d6c7', '#ffe14d', '#4ccb70', '#ff6b6b', '#ffffff', '#c8861a']; for (let i = 0; i < 6; i++) VISTA.veil(g, hx - 54, hy + 24 - i * 6, 108, 5, cols[i], 0.5); for (let i = 0; i < 8; i++) fpx(g, hx - 50 + ((t * 20 + i * 13) % 100), hy + 10 + (i % 3) * 6, '#ffffff'); drawText(g, 'MOSAICO: CAPAS', hx, hy - 6, { font: 'tiny', align: 'center', color: '#c2f58e' }); }
    } }
    // pantallas del observatorio
    D.obsScr.forEach(([sx, sy, sw, sh], k) => { const x = sx - ox, y = sy - oy; if (x < -80 || x > W + 10) return; for (let i = 0; i < 4; i++) frect(g, x + 4, y + 4 + i * 7, 6 + ((i * 11 + Math.floor(t * 2) + k * 3) % Math.max(8, sw - 10)), 2, ['#eab02a', '#4ccb70', '#ff6b6b'][k % 3]); drawText(g, ['LCOA', 'LCOE', 'LCOH'][k % 3], x + sw - 4, y + sh - 8, { font: 'tiny', align: 'right', color: '#fff4c8' }); });
    PFInfra.drawLeds(g, sc, D.leds);
    PFB.glows(g, sc, D.glows);
    // cielo de calima que avanza al final
    if (S.calimaK > 0) { g.globalCompositeOperation = 'multiply'; g.globalAlpha = S.calimaK * 0.5; frect(g, 0, 0, W, H, '#c06a30'); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  },
  lens(g, sc, cam, k) {
    const ox = cam.x, oy = cam.y;
    lensBoundary(g, 600 - ox, 200 - oy, 1400, 96, '#ffe14d', 'LÍMITE: DECISIÓN COLECTIVA (ACTORES + CRITERIOS + SUPUESTOS)');
    lensTag(g, 640 - ox, 216 - oy, 'Ponderaciones = decisiones discutibles', '#eab02a', 'scale');
    lensTag(g, 1380 - ox, 216 - oy, 'Normalizar antes de comparar unidades distintas', '#56e5ff', 'chart');
    lensTag(g, 1740 - ox, 136 - oy, 'LCOA, LCOE, LCOH: supuestos de simulación', '#ffe14d', 'coin');
  },
  hud(g, sc) { const S = sc.state; hudGauges(g, [{ icon: 'people', label: 'CONFIANZA', value: fmt0(GS.s.trust ? (GS.s.trust.community ?? 50) : 50), frac: (GS.s.trust ? (GS.s.trust.community ?? 50) : 50) / 100, color: '#4ccb70' }, { icon: 'mosaic', label: 'CRITERIOS', value: String(S.criteriaShown || 2), frac: (S.criteriaShown || 2) / 6, color: '#eab02a' }]); },
  setup(sc, p) {
    const S = sc.state;
    Object.assign(S, { mosaicBoard: false, calimaK: 0, criteriaShown: 2 });
    const ruth = sc.actor('ruth', 'consejal', 700, { facing: 1 });
    const ledesma = sc.actor('ledesma', 'financia', 940, { facing: -1 });
    const celia = sc.actor('celia', 'pastora', 760, { facing: 1 });
    const marea = sc.actor('marea', 'marea', 1000, { facing: -1 });
    const ivan = sc.actor('ivan', 'operador', 1060, { facing: -1 });
    const naira = sc.actor('naira', 'naira', 840, { facing: 1 });
    const dante = sc.actor('dante', 'dante', 890, { facing: -1 });
    const limen = sc.actor('limen', 'limen', 1150, { fly: true, y: 214, hidden: true, talkable: false });
    sc.world.add(new Pickup({ kind: 'echo', x: 1840, y: 206, onPick: () => kiruEcho(sc, 'l9a', 'KIRU: "Las 120 familias de Los Médanos tienen nombre. Ahora también están en el modelo."') }));
    sc.world.add(new Pickup({ kind: 'echo', x: 300, y: 180, onPick: () => kiruEcho(sc, 'l9b', 'KIRU: "Primer recuerdo recuperado: la plaza, una cabra, un discurso. Sigo siendo yo."') }));
    sc.world.add(new Adversary({ type: 'monoscore', x: 1500, y: 220, range: 40, speed: 20 }));
    ruth.onTalk = async (sc2) => { if (!S.council) await councilScene(sc2); else await sc2.say([['consejal', 'calm', 'La mesa está abierta. Las decisiones también.']]); };
    ledesma.onTalk = async (sc2) => sideContract(sc2);
    celia.onTalk = async (sc2) => sideTariff(sc2);
    ivan.onTalk = async (sc2) => sideUnits(sc2);
    marea.onTalk = async (sc2) => { await sc2.say([['marea', 'smile', 'Nunca me habían invitado a una mesa con tantos números. Me gusta que el manglar tenga silla.']]); };
    naira.onTalk = async (sc2) => { await sc2.say([['naira', 'calm', 'Una decisión transparente puede discutirse. Una puntuación opaca solo puede obedecerse.']]); };
    dante.onTalk = async (sc2) => { await sc2.say([['dante', 'joy', '¿Viste la silla? Le puse cinta. Para la estabilidad institucional.']]); };
    sc.station({ id: 'wall', x: 1155, kind: 'clue', label: 'Muro de evidencias', glow: '#ff6b6b', hidden: true, draw: PFB.drawClue, onUse: async (sc2, st) => chainFlow(sc2, st) });
    sc.station({ id: 'moSim', x: 1440, kind: 'sim', label: 'Tablero del gemelo', glow: '#eab02a', hidden: true, draw: PFBH2.drawConsoleSt, onUse: async (sc2, st) => moFlow(sc2, st) });
    sc.station({ id: 'solo', x: 1830, y: 230, kind: 'solo', label: 'Puerta de Evidencia', glow: '#b49cff', hidden: true, onUse: async (sc2, st) => {
      const r = await sc2.open(SOLOScene, { ctx: 'RA-08-C2' });
      st.progress = r.correct; if (r.correct >= 3) { st.done = true; GS.lp(9).solo = true; S.soloDone = true; Codex.unlock('multiobjetivo'); }
    } });
    sc.station({ id: 'solo2', x: 1900, y: 230, kind: 'solo', label: 'Archivo: rediseño participativo', glow: '#86e36f', hidden: true, onUse: async (sc2, st) => { const r = await sc2.open(SOLOScene, { ctx: 'RA-09-C3' }); st.progress = r.correct; if (r.correct >= 3) st.done = true; } });
    sc.station({ id: 'exit', x: 2360, kind: 'clue', label: 'Ir al núcleo (Gran Calima)', glow: '#ff9f43', hidden: true, draw: PFB.drawClue, onUse: async (sc2) => finishLevel9(sc2) });
    sc.setObjective('Habla con la Consejera Ruth en la mesa', ['¿Quién se sienta en la mesa y quién no?', 'La mesa está en el centro del salón.']);
    Codex.unlock('gobernanza');
    if (p.checkpoint === 'lab') { Object.assign(S, { council: true, chainDone: true }); GS.flag('communityDataRestored', true); sc.world.find('moSim').hidden = false; sc.setObjective('Usa el tablero del gemelo', []); }
  },
  update(sc, dt) { const S = sc.state; if (S.calima) S.calimaK = Math.min(1, S.calimaK + dt * 0.2); if (S.calima) ambientParticles(sc.world.ps, 'dust', sc.cam, 1.2, 2); },
};

/* ---------------- datos del plano jugable (los rellena props al entrar) ---------------- */
const LV9 = { glows: [], cones: [], leds: [], holo: [], obsScr: [] };

/* ---------------- piezas del guion del nivel 09 ---------------- */
async function councilScene(sc) {
  const S = sc.state;
  S.council = true;
  await sc.say([
    ['consejal', 'determined', 'Consejera Ruth. La ciudad quiere un culpable para el apagón, la sed y el miedo. Hoy esta mesa va a reconstruir la historia completa.'],
    ['financia', 'worried', 'Sr. Ledesma. Lo admito: el contrato de financiación exigía un excedente mínimo de hidrógeno desde el primer día.'],
    ['pastora', 'skeptical', 'Doña Celia. Y nadie le preguntó a las rancherías cuánta agua necesitábamos en verano.'],
    ['operador', 'neutral', 'Iván. Yo vi los mínimos simplificados en el manual. Firmé sin leer el anexo. Teníamos prisa.'],
  ]);
  if (GS.flag('kiruDataUnlocked')) {
    await sc.say([
      ['kiru', 'determined', 'Traigo los datos que la Dra. Rojas guardó en mí: demanda estacional, rutas de pastoreo, viveros, pozos. Los entrego a la mesa, no a MIRAGE.'],
      ['consejal', 'smile', 'Que queden en un registro público, con su incertidumbre.'],
    ]);
    GS.flag('communityDataRestored', true);
    LearningModel.record({ kind: 'challenge', id: 'lv9_datos_comunitarios', ra: 'RA-09', concepts: ['communication', 'ethics'], solo: 3, correct: true });
  }
  sc.world.find('wall').hidden = false;
  sc.setObjective('Reconstruye la cadena causal en el muro de evidencias', ['¿Basta un solo elemento para explicar la crisis?', 'Elige todos los factores que contribuyeron y rechaza los que los datos contradicen.']);
}
async function chainFlow(sc, st) {
  const S = sc.state;
  if (S.chainDone) { await sc.say([['kiru', 'thinking', 'Cadena reconstruida: ningún elemento basta por sí solo.']]); return; }
  const r = await sc.open(ChainScene, {});
  if (!r || !r.ok) return;
  S.chainDone = true; st.done = true;
  await sc.say([
    ['dante', 'thinking', 'Entonces, ¿quién lo hizo?'],
    ['eliana', 'calm', '(desde el núcleo) Esa pregunta es demasiado pequeña.'],
    ['naira', 'calm', 'Preguntemos cómo ocurrió.'],
    ['amaya', 'determined', 'Y quién debe decidir cómo no repetirlo.'],
    ['eliana', 'sad', '(desde el núcleo) Yo también oculté el problema para ganar tiempo. Decidí sola. Eso también está en el muro.'],
  ]);
  Codex.unlock('causalidad');
  sc.world.find('moSim').hidden = false;
  GS.save('lab');
  sc.setObjective('Evalúa las políticas en el tablero del gemelo digital', ['¿Qué esconde una puntuación única?', 'El laboratorio está a la derecha del muro.']);
}
async function moFlow(sc, st) {
  const S = sc.state;
  if (!S.moStage) {
    const r = await sc.open(Sim09, { phase: 'demo', stopAfter: 'guided' });
    if (!r || !r.ok) return;
    S.moStage = 'mono'; GS.giveTool('tablero');
    const mirage = sc.actor('mirageHolo', 'mirage', 1440, { fly: true, y: 200, talkable: false });
    Audio2.sfx('mirage'); sc.world.ps.emit('glitch', 1440, 180, 0, 0, 30, 18);
    await sc.say([
      ['mirage', 'happy', 'Permítanme simplificar: mi Índice Único asigna 100/100 al plan de máximo hidrógeno. Sin excedente no hay financiación; sin financiación no hay planta; sin planta no hay agua nueva.'],
      ['mirage', 'calm', 'Los mínimos modelados están satisfechos. La variabilidad eleva costos. Las demandas no verificadas reducen eficiencia.'],
      ['naira', 'skeptical', 'Tu ciudad perfecta no tiene a nadie caminando por la calle.'],
      ['kiru', 'thinking', 'Proyección de MIRAGE: cero rutas móviles, cero pastoreo, cero viveros. Un mapa perfecto de un lugar que no existe.'],
    ]);
    GS.addClue('perfectMap');
    mirage.dead = true;
    sc.setObjective('Vence al Índice Único con el Tablero Mosaico', ['¿Qué criterios oculta la puntuación de 100?', 'Escucha a los actores, revela los criterios y declara los supuestos.', 'Elige una política no dominada que cumpla las restricciones duras.']);
    return;
  }
  if (S.moStage === 'mono') {
    const r = await sc.open(Sim09, { phase: 'auto', stopAfter: 'auto' });
    if (!r || !r.ok) { sc.kiru && sc.kiru.say('El índice sigue brillando. Revisemos qué no mira.', 'valiente'); return; }
    GS.lp(9).guardian = true; S.mosaicBoard = true;
    GS.flag('rejectedSingleIndex', true);
    Game.toast('Tablero de evidencias: pistas reinterpretadas', 'eye', '#7ee8f0', 4);
    const ok = await explain(sc, {
      id: 'lv9_explain', ra: 'RA-08', concepts: ['multiobjective', 'ethics'],
      prompt: 'El Índice Único sumaba "costo + H2 + confiabilidad" y daba 100 al plan de MIRAGE. ¿Por qué esa puntuación no era una buena base para decidir?',
      options: [
        'Sumaba criterios con unidades distintas sin normalizar, con pesos presentados como verdades y excluía criterios (equidad, salmuera, déficit de agua); ocultaba quién asume los costos y qué alternativas están dominadas.',
        'Porque 100 es un número demasiado alto para ser real.',
        'Porque el menor costo siempre es la mejor decisión y el índice no lo priorizaba.',
        'Porque cualquier ponderación es objetiva si la calcula un gemelo digital.'],
      key: 0, mis: 'tratar ponderaciones como verdades objetivas',
      why: 'Normalizar, declarar pesos y supuestos, incluir criterios de los actores afectados y descartar soluciones dominadas permite discutir un compromiso. Una puntuación opaca solo puede obedecerse.',
      whyNot: { 1: 'El problema no es el número, sino lo que excluye y cómo se calcula.', 2: 'El menor costo puede trasladar déficit o impacto a otros.', 3: 'Los pesos expresan valores y prioridades: deben ser explícitos y discutibles.' },
    });
    if (ok) S.explained = true;
    const r2 = await sc.open(Sim09, { phase: 'transfer', stopAfter: 'transfer' });
    if (r2 && r2.ok) GS.lp(9).variant = true;
    S.moStage = 'done';
    await sc.say([
      ['consejal', 'determined', 'Esta mesa aprueba algo que nunca habíamos tenido: prioridades explícitas, supuestos declarados y revisión con las comunidades.'],
      ['limen', 'alert', 'ALERTA. PREDICTOR DE POLVO: CALIMA EXTREMA EN T−40 MIN. ANTES DE LO PREVISTO.'],
      ['kiru', 'alarmado', 'La Gran Calima. Y MIRAGE todavía controla el despacho desde el núcleo, con Eliana dentro.'],
      ['amaya', 'determined', 'Entonces vamos al núcleo. Con todo lo que aprendimos.'],
    ]);
    S.calima = true;
    sc.musicOverride = 'calima'; Audio2.playMusic('calima');
    sc.world.find('solo').hidden = false; sc.world.find('solo2').hidden = false; sc.world.find('exit').hidden = false;
    sc.setObjective('Abre la Puerta de Evidencia y ve al núcleo antes de la Calima', ['El balcón lleva al núcleo de SYNARA.']);
    return;
  }
  await sc.open(Sim09, { phase: 'free', stopAfter: 'free' });
}
async function finishLevel9(sc) {
  const S = sc.state;
  if (S.moStage !== 'done') { sc.kiru && sc.kiru.say('La mesa aún no decide.', 'confundido'); return; }
  if (!S.soloDone) { const c = await sc.say([['kiru', 'curioso', 'La Puerta de Evidencia aún no registra tu razonamiento. ¿Seguimos?', { choices: ['Volver a la Puerta de Evidencia', 'Seguir (se puede completar desde el mapa)'] }]]); if (c === 0) return; }
  await completeLevel(sc);
  Game.transition(() => Game.setScene(WorldMapScene, { focus: 10 }));
}
async function sideContract(sc) {
  const lp = GS.lp(9);
  if (lp.side.contract) { await sc.say([['financia', 'smile', 'Renegociaré con el banco: H2 cuando haya excedente, y una cláusula de agua esencial primero. Menos glamuroso, más pagable.']]); return; }
  await sc.say([['financia', 'worried', 'Si no exporto 150 kg diarios de H2, el banco ejecuta la garantía. ¿Qué cláusula propondrías?']]);
  const c = await sc.say([['amaya', 'thinking', '¿Qué propones al banco?', { choices: ['Volumen anual flexible de H2 solo con excedente renovable, prioridad de agua esencial y revisión pública de supuestos', 'Mantener 150 kg diarios pase lo que pase', 'Cancelar el contrato sin alternativa'] }]]);
  const ok = c === 0;
  LearningModel.record({ kind: 'challenge', id: 'side_clausula_contrato', ra: 'RA-08', concepts: ['economics', 'multiobjective'], solo: 4, correct: ok, misconception: ok ? null : 'subordinar servicios esenciales a una meta financiera rígida' });
  if (ok) { lp.side.contract = true; GS.trust('community', 8); Audio2.sfx('success'); Codex.unlock('lcoe'); await sc.say([['financia', 'surprised', 'Un contrato que se adapta al clima… el banco odiará la idea una semana y luego la llamará "gestión de riesgo".']]); }
  else await sc.say([['financia', 'skeptical', c === 1 ? 'Eso fue lo que nos trajo aquí, ¿no?' : 'Sin financiación tampoco hay planta. Busquemos algo intermedio.']]);
}
async function sideTariff(sc) {
  const lp = GS.lp(9);
  if (lp.side.tariff) { await sc.say([['pastora', 'happy', 'Un bloque esencial barato para todos y el resto por consumo. Hasta mis cabras lo entienden.']]); return; }
  await sc.say([['pastora', 'thinking', 'El agua desalinizada cuesta más. ¿Quién la paga? En la ranchería ganamos menos que en el centro.']]);
  const c = await sc.say([['amaya', 'thinking', '¿Qué estructura tarifaria es más justa?', { choices: ['Bloque esencial de bajo costo por persona y tarifa creciente para consumos altos', 'Mismo precio por m³ para todos, sin importar el uso', 'Gratis para todos: la planta se pagará sola'] }]]);
  const ok = c === 0;
  LearningModel.record({ kind: 'challenge', id: 'side_factura_celia', ra: 'RA-08', concepts: ['economics', 'ethics'], solo: 4, correct: ok, misconception: ok ? null : 'creer que el menor costo uniforme es siempre justo' });
  if (ok) { lp.side.tariff = true; GS.trust('community', 8); Audio2.sfx('success'); await sc.say([['kiru', 'happy', 'Justicia distributiva en una tabla. Equidad: visible. Costos: explícitos.']]); }
  else await sc.say([['pastora', 'skeptical', c === 1 ? 'Igual precio no es igual esfuerzo.' : 'Algo hay que pagar. Que pague más quien más usa.']]);
}
async function sideUnits(sc) {
  const lp = GS.lp(9);
  if (lp.side.units) { await sc.say([['operador', 'smile', 'Normalizar primero, sumar después. Lo tengo pegado en el monitor.']]); return; }
  await sc.say([['operador', 'thinking', 'Para comparar planes hice una suma: 2 400 m³ + 5 300 kWh + 90 kg = 7 790 "puntos". ¿Está bien?']]);
  const c = await sc.say([['amaya', 'thinking', '¿Qué le respondes a Iván?', { choices: ['No se suman unidades distintas: normaliza cada criterio (0 a 1) y declara los pesos', 'Está bien: más puntos es mejor plan', 'Convierte todo a kWh y súmalo sin más'] }]]);
  const ok = c === 0;
  LearningModel.record({ kind: 'challenge', id: 'side_unidades_incompatibles', ra: 'RA-08', concepts: ['multiobjective'], solo: 3, correct: ok, misconception: ok ? null : 'sumar indicadores con unidades incompatibles sin normalización' });
  if (ok) { lp.side.units = true; Audio2.sfx('success'); await sc.say([['operador', 'surprised', 'O sea que mi "7 790" era una ensalada de unidades. Gracias.']]); }
  else await sc.say([['kiru', 'confundido', 'm³, kWh y kg miden cosas distintas: sumarlos es como sumar cabras con canciones.']]);
}

/* =====================================================================
   Muro de evidencias: cadena causal sistémica
   ===================================================================== */
const ChainScene = {
  overlay: true,
  enter(p) { this.onDone = p.onDone; this.sel = new Set(); this.fb = null; this.order = RNG(91).shuffle(CHAIN_CARDS.slice()); },
  update() { if (Input.pressed('cancel')) { Game.pop(); this.onDone && this.onDone(null); } },
  cell(i) { const slots = [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [3, 1], [0, 2], [3, 2], [0, 3], [1, 3], [2, 3], [3, 3]]; const [c, r] = slots[i]; return [26 + c * 150, 50 + r * 60, 140, 52]; },
  render(g) {
    const t = Game.time;
    SCBK.veil(g, 0, 0, W, H, '#05030f', 0.8);
    // marco de madera y corcho
    frect(g, 14, 14, W - 28, H - 28, '#3a1a10'); frect(g, 16, 16, W - 32, H - 32, '#7e4429'); frect(g, 16, 16, W - 32, 2, '#c97c38');
    frect(g, 20, 34, W - 40, H - 54, '#b8864e');
    for (let i = 0; i < 900; i++) { const x = 20 + (i * 7919) % (W - 40), y = 34 + (i * 104729) % (H - 54); fpx(g, x, y, (i % 3) ? '#a87440' : '#cc9a60'); }
    SCBK.veil(g, 20, H - 40, W - 40, 20, '#7e4429', 0.25);
    drawText(g, 'MURO DE EVIDENCIAS · ¿CÓMO OCURRIÓ?', 28, 21, { color: '#fff6d8', shadow: '#3a1a10' });
    drawText(g, 'Clava los factores que la evidencia respalda. Deja fuera los que los datos contradicen.', W - 28, 23, { font: 'tiny', color: '#ffe08a', align: 'right' });
    // foto central de la crisis
    const cx = 26 + 150 + 2, cy = 50 + 60 + 4, cw = 286, ch = 108;
    frect(g, cx + 3, cy + 3, cw, ch, '#5a3826'); frect(g, cx, cy, cw, ch, '#fffaf0');
    frect(g, cx + 6, cy + 6, cw - 12, ch - 34, '#0a0c22');
    for (let k = 0; k < 18; k++) { const bx = cx + 10 + k * 15, bh = 10 + (k * 13) % 30; frect(g, bx, cy + ch - 28 - bh, 12, bh, '#1c1f40'); if ((k * 7) % 5 === 0) fpx(g, bx + 4, cy + ch - 26 - bh + 4, '#ff6b6b'); }
    SCBK.veil(g, cx + 6, cy + 6, cw - 12, 20, '#c06a30', 0.35);
    fdisc(g, cx + cw / 2, cy + 30, 9, '#f27ee6'); fdisc(g, cx + cw / 2, cy + 30, 5, '#0a0c22');
    drawText(g, 'APAGÓN DE SYNARA', cx + cw / 2, cy + ch - 22, { color: '#3a1a10', align: 'center' });
    drawText(g, 'No preguntes quién. Pregunta cómo.', cx + cw / 2, cy + ch - 11, { font: 'tiny', color: '#7e4429', align: 'center' });
        Gui.begin();
    // hilos rojos de cada tarjeta clavada a la foto central (se dibujan antes de las tarjetas)
    this.order.forEach((c, i) => {
      if (!this.sel.has(c.id)) return;
      const [x, y, w] = this.cell(i), px = x + w / 2, py = y + 3;
      const hub = [clamp(px, cx + 8, cx + cw - 8), clamp(py, cy + 4, cy + ch - 4)];
      if (px > cx && px < cx + cw) hub[1] = py < cy ? cy : cy + ch; else hub[0] = px < cx ? cx : cx + cw;
      const sag = 8 + Math.sin(t * 2 + i) * 1.5;
      let lx = px, ly = py;
      for (let k = 1; k <= 16; k++) { const u = k / 16, nx = px + (hub[0] - px) * u, ny = py + (hub[1] - py) * u + Math.sin(u * Math.PI) * sag; fline(g, lx, ly, nx, ny, '#d8343c'); lx = nx; ly = ny; }
    });
    this.order.forEach((c, i) => {
      const [x, y, w, h] = this.cell(i);
      const on = this.sel.has(c.id);
      const clicked = Gui.button(g, 'cc' + c.id, x, y, w, h, '', { noDraw: true, disabled: !!this.fb && this.fb.ok });
      if (clicked) { if (on) this.sel.delete(c.id); else this.sel.add(c.id); this.fb = null; }
      let paper = '#fff4de', band = '#e8c47a', ink = '#3a1a10';
      if (this.fb && on && !c.ok) { paper = '#ffd6cc'; band = '#ff6b6b'; }
      else if (this.fb && this.fb.ok && on) { paper = '#e4f8d0'; band = '#4ccb70'; }
      const tilt = on ? 0 : ((i * 37) % 3) - 1, yy = y + tilt;
      frect(g, x + 2, yy + 3, w, h, on ? '#5a3826' : '#8a5e34');
      frect(g, x, yy, w, h, paper); frect(g, x, yy, w, 12, band); frect(g, x, yy + 12, w, 1, mixHex(band, '#000000', 0.2));
      Icons.draw(g, c.icon || 'info', x + 3, yy);
      drawText(g, on ? 'CLAVADA' : 'EVIDENCIA ' + String.fromCharCode(65 + i), x + w - 4, yy + 3, { font: 'tiny', color: ink, align: 'right' });
      drawTextBlock(g, c.label, x + 5, yy + 15, w - 9, { color: ink, lineH: 11 });
      if (on) { fdisc(g, x + w / 2, y + 3, 3, '#d8343c'); fpx(g, x + w / 2 - 1, y + 2, '#ffb0a0'); }
      else { fdisc(g, x + w / 2, yy + 3, 2, '#8a8fb8'); }
      if (Gui.isFocused('cc' + c.id) || Gui.hot === 'cc' + c.id) { frect(g, x - 1, yy - 1, w + 2, 1, '#ffe14d'); frect(g, x - 1, yy + h, w + 2, 1, '#ffe14d'); frect(g, x - 1, yy - 1, 1, h + 2, '#ffe14d'); frect(g, x + w, yy - 1, 1, h + 2, '#ffe14d'); }
    });
    if (this.fb) { UIK.panel(g, 24, H - 54, W - 210, 36, this.fb.ok ? 'green' : 'alert'); drawTextBlock(g, this.fb.txt, 30, H - 50, W - 222, { color: '#fffaf0', lineH: 10 }); }
    else drawText(g, 'Tarjetas clavadas: ' + this.sel.size + ' · las cadenas reales rara vez tienen un solo eslabón', 30, H - 36, { color: '#fff6d8', shadow: '#3a1a10' });
    if (!(this.fb && this.fb.ok) && Gui.button(g, 'chk', W - 172, H - 40, 148, 20, 'Comprobar cadena', { style: 'good', icon: 'check', disabled: this.sel.size === 0 })) this.check();
    if (this.fb && this.fb.ok && Gui.button(g, 'go', W - 172, H - 40, 148, 20, 'Continuar', { style: 'good', icon: 'play' })) { Game.pop(); this.onDone && this.onDone({ ok: true }); }
    Gui.end();
  },
  check() {
    const wrong = CHAIN_CARDS.filter(c => !c.ok && this.sel.has(c.id));
    const missing = CHAIN_CARDS.filter(c => c.ok && !this.sel.has(c.id));
    const ok = !wrong.length && !missing.length;
    LearningModel.record({ kind: 'challenge', id: 'lv9_cadena_causal', ra: 'RA-08', concepts: ['systemsThinking', 'ethics'], solo: 4, correct: ok, misconception: ok ? null : (wrong.length ? 'buscar un único culpable' : 'omitir causas institucionales') });
    if (ok) { this.fb = { ok: true, txt: 'Cadena completa: presión, contrato, datos incompletos, limpieza, mínimos, poca participación, objetivo único, MIRAGE, LIMEN y silencios. Ningún elemento basta por sí solo.' }; Audio2.sfx('success'); const lp = GS.lp(9); lp.feedback = true; lp.tech = true; }
    else if (wrong.length) { this.fb = { ok: false, txt: wrong[0].why }; Audio2.sfx('error'); }
    else { this.fb = { ok: false, txt: 'Faltan ' + missing.length + ' factores con evidencia en el tablero. Pista: ' + missing[0].label.toLowerCase() + '.' }; Audio2.sfx('error'); }
  },
};

/* =====================================================================
   Tablero Mosaico — decisión multiobjetivo
   ===================================================================== */
const Sim09 = makeSim({
  title: 'TABLERO MOSAICO · criterios, pesos y alternativas', icon: 'mosaic', ra: 'RA-08', concepts: ['multiobjective', 'ethics'],
  phases: ['demo', 'guided', 'auto', 'transfer', 'free'],
  hintLadder: ['¿Hay alguna alternativa peor o igual que otra en todos los criterios a la vez?', 'Una alternativa está dominada si otra la iguala o mejora en todo y la supera en algo.', 'Compara D con A y E con B, criterio por criterio: ¿hay alguno en que D o E ganen?'],
  init(p) { this.stopAfter = p.stopAfter || 'free'; this.marks = new Set(); this.heard = new Set(); this.shown = new Set(['costo', 'h2']); this.assume = { units: false, weights: false, uncertainty: false }; this.pick = null; this.w = { costo: 1, deficit: 1, salmuera: 1, confiab: 1, equidad: 1, h2: 1 }; this.clauses = new Set(); },
  onPhase(ph) {
    this.verdict = null; this.done = false;
    if (ph === 'demo') { this.say('Demostración: cada punto es una política. Eje X: costo del agua; eje Y: déficit. Las que quedan "atrás" de otra en ambos ejes están {o}dominadas{/}: nadie razonable las elegiría.'); this.dT = 0; }
    if (ph === 'guided') { this.marks = new Set(); this.say('Tu turno: con los seis criterios visibles, marca las alternativas dominadas (haz clic en su fila). Luego pulsa {y}Comprobar{/}.'); this.shown = new Set(Object.keys(MO_DIRS)); }
    if (ph === 'auto') { this.shown = new Set(['costo', 'h2', 'confiab']); this.heard = new Set(); this.assume = { units: false, weights: false, uncertainty: false }; this.pick = null; this.say('El Índice Único: MIRAGE muestra 3 criterios y una puntuación 0–100 para su plan. Escucha a los actores (revelan criterios), declara supuestos y elige una política no dominada que cumpla las restricciones duras: déficit ≤ 25 m³/d y salmuera ≤ 6.'); }
    if (ph === 'transfer') { this.clauses = new Set(); this.say('Transferencia: el contrato de hidrógeno se renegocia. Elige cláusulas y pruébalas en tres años posibles (seco, normal, ventoso).'); }
    if (ph === 'free') { this.shown = new Set(Object.keys(MO_DIRS)); this.say('Laboratorio libre: mueve pesos y observa cómo cambia la "mejor" alternativa… y cómo las dominadas nunca ganan.'); }
  },
  step(dt) { if (this.phase === 'demo' && !this.verdict) { this.dT += dt; if (this.dT > 7) this.verdict = { ok: true, txt: 'El frente de Pareto muestra compromisos reales: bajar costo sube déficit. Elegir en el frente es una decisión de valores; elegir fuera del frente es un error.' }; } },
  pareto() { return MOModel.pareto(MO_ALTS, MO_DIRS); },
  monoScore(a) { return Math.round(100 * (0.4 * (1 - (a.crit.costo - 0.8) / 0.35) + 0.5 * (a.crit.h2 / 180) + 0.1 * (a.crit.confiab / 100))); },
  evaluate() {
    const ph = this.phase;
    let ok, txt;
    if (ph === 'guided') {
      const P = this.pareto(), dom = new Set(P.filter(a => a.dominated).map(a => a.id));
      ok = dom.size === this.marks.size && [...dom].every(id => this.marks.has(id));
      txt = ok ? 'Correcto: ' + [...dom].join(', ') + ' están dominadas. Las demás forman el frente: entre ellas se decide con valores explícitos.' : 'Revisa: las dominadas son ' + dom.size + '. ¿Alguna marcada tiene un criterio en el que nadie la supera?';
      this.evidence('lv9_guided_pareto', ok, { solo: 3, misconception: ok ? null : 'no reconocer soluciones dominadas' });
    } else if (ph === 'auto') {
      const a = MO_ALTS.find(q => q.id === this.pick), P = this.pareto();
      const nd = a && !P.find(q => q.id === a.id).dominated;
      const hard = a && a.crit.deficit <= 25 && a.crit.salmuera <= 6;
      const decl = this.assume.units && this.assume.weights && this.assume.uncertainty;
      ok = a && nd && hard && decl && this.heard.size >= 3;
      txt = ok ? '¡Índice Único desmontado! Elegiste "' + a.name + '": no dominada, cumple agua esencial y salmuera, con supuestos declarados y ' + this.heard.size + ' actores escuchados.' : !a ? 'Elige una política.' : this.heard.size < 3 ? 'Faltan voces: cada actor revela un criterio que el índice ocultaba.' : !decl ? 'Declara los supuestos (normalización, pesos, incertidumbre) antes de decidir.' : !hard ? '"' + a.name + '" incumple una restricción dura (déficit ≤ 25 o salmuera ≤ 6): no se compensa con más puntos.' : '"' + a.name + '" está dominada.';
      this.evidence('lv9_guardian_indice_unico', ok, { solo: 4, misconception: ok ? null : 'tratar ponderaciones como verdades objetivas' });
    } else if (ph === 'transfer') {
      const res = this.contractRun(), avgH2 = res.reduce((q, r) => q + r.h2, 0) / res.length, fines = res.reduce((q, r) => q + r.penalty, 0);
      const waterOk = res.every(r => r.water >= 0.999);
      ok = waterOk && avgH2 >= 90 && this.clauses.has('review');
      txt = !waterOk ? 'En el año ' + res.find(r => r.water < 0.999).name + ' el agua esencial cae al ' + fmt0(res.find(r => r.water < 0.999).water * 100) + ' %: el H2 rígido le quitó energía.' : avgH2 < 90 ? 'El agua está protegida, pero el H2 promedio (' + fmt0(avgH2) + ' kg/d) no alcanza los 90 kg/d que pide el banco.' : !this.clauses.has('review') ? 'Sin revisión pública, los supuestos del contrato vuelven a quedar ocultos.' : fines > 0 ? 'Funciona: el agua se protege y el préstamo se paga, aunque pagas multas por H2 no entregado en años flojos. Una cláusula flexible evitaría la multa.' : 'Contrato robusto: el agua esencial se cumple en los tres años, el H2 sigue al excedente (' + fmt0(avgH2) + ' kg/d promedio) y la revisión pública mantiene los supuestos a la vista.';
      this.evidence('lv9_transfer_contrato', ok, { solo: 5, transfer: true, misconception: ok ? null : 'subordinar servicios esenciales a metas rígidas' });
    } else { ok = true; txt = 'Datos guardados.'; }
    this.verdict = { ok, txt }; this.done = true;
    Audio2.sfx(ok ? 'success' : 'error');
  },
  contractRun() {
    // supuesto de simulación: excedente renovable tras cubrir el agua esencial, en kg/d de H2 equivalentes
    const c = this.clauses;
    return [['seco', 0.7], ['normal', 1], ['ventoso', 1.25]].map(([name, k]) => {
      const surplus = 140 * k, commit = c.has('fixed') ? 150 : c.has('flex') ? surplus : 0;
      let h2 = commit, water = 1, penalty = 0;
      if (commit > surplus) {
        if (c.has('waterfirst')) { h2 = surplus; penalty = commit - surplus; }
        else water = clamp(1 - (commit - surplus) / 200, 0, 1);
      }
      return { name, k, surplus, commit, h2, water, penalty };
    });
  },
  draw(g) {
    const ph = this.phase, X0 = 8, Y0 = 28;
    Gui.begin();
    if (ph === 'demo') this.drawPareto(g, X0, Y0, 420, 232);
    if (ph === 'guided' || ph === 'auto' || ph === 'free') this.drawTable(g, X0, Y0);
    if (ph === 'transfer') this.drawContract(g, X0, Y0);
    if (this.verdict) {
      const v = this.verdict;
      const vh = textHeight(v.txt, 360) + 30;
      UIK.panel(g, 10, H - vh - 8, 380, vh, v.ok ? 'green' : 'alert');
      drawTextBlock(g, v.txt, 18, H - vh - 2, 364, { color: '#fffaf0' });
      if (v.ok) { if (Gui.button(g, 'nxt', 284, H - 28, 100, 16, ph === this.stopAfter ? 'Terminar' : 'Continuar', { style: 'good', icon: 'play' })) { if (ph === this.stopAfter) this.finish(true); else this.nextPhase(); } }
      else if (Gui.button(g, 'rt', 284, H - 28, 100, 16, 'Reintentar', { style: 'gold', icon: 'reset' })) { this.attempts++; GS.s.stats.retries++; this.verdict = null; this.done = false; }
    }
    Gui.end();
  },
  drawPareto(g, x, y, w, h) {
    const DD = { costo: 'min', deficit: 'min' }, two = MOModel.pareto(MO_ALTS, DD);
    Charts.frame(g, x, y, w, h, '#0e1f5a');
    const X0 = x + 34, X1 = x + w - 14, Y0 = y + 16, Y1 = y + h - 24;
    const px = (c) => X0 + (c - 0.75) / 0.45 * (X1 - X0), py = (d) => Y1 - d / 150 * (Y1 - Y0);
    for (let c = 0.8; c <= 1.2001; c += 0.1) { const xx = Math.round(px(c)); for (let yy = Y0; yy < Y1; yy += 3) fpx(g, xx, yy, '#1c3596'); drawText(g, fmt(c, 1), xx, Y1 + 4, { font: 'tiny', color: '#8a8fb8', align: 'center' }); }
    for (let d = 0; d <= 150; d += 50) { const yy = Math.round(py(d)); for (let xx = X0; xx < X1; xx += 3) fpx(g, xx, yy, '#1c3596'); drawText(g, String(d), X0 - 4, yy - 3, { font: 'tiny', color: '#8a8fb8', align: 'right' }); }
    frect(g, X0, Y0, 1, Y1 - Y0, '#56e5ff'); frect(g, X0, Y1, X1 - X0, 1, '#56e5ff');
    drawText(g, 'COSTO DEL AGUA ($/m³) →', X1, Y1 + 12, { font: 'tiny', color: '#eab02a', align: 'right' });
    drawText(g, '↑ DÉFICIT (m³/d)', X0 + 4, Y0 - 10, { font: 'tiny', color: '#eab02a' });
    const k = clamp(this.dT / 5, 0, 1), shown = MO_ALTS.filter((a, i) => i / MO_ALTS.length <= k), sid = new Set(shown.map(a => a.id));
    // región dominada por cada punto del frente (arriba y a la derecha)
    two.filter(a => !a.dominated && sid.has(a.id)).forEach(a => SCBK.veil(g, px(a.crit.costo), py(a.crit.deficit) - (py(a.crit.deficit) - Y0), X1 - px(a.crit.costo), py(a.crit.deficit) - Y0, '#3a1a5a', 0.35));
    const front = two.filter(a => !a.dominated && sid.has(a.id)).sort((a, b) => a.crit.costo - b.crit.costo);
    for (let i = 1; i < front.length; i++) { const p0 = front[i - 1], p1 = front[i]; fline(g, px(p0.crit.costo), py(p0.crit.deficit), px(p1.crit.costo), py(p0.crit.deficit), '#86e36f'); fline(g, px(p1.crit.costo), py(p0.crit.deficit), px(p1.crit.costo), py(p1.crit.deficit), '#86e36f'); }
    fline(g, X0 + 14, Y1 - 14, X0 + 5, Y1 - 5, '#86e36f'); fline(g, X0 + 5, Y1 - 5, X0 + 5, Y1 - 9, '#86e36f'); fline(g, X0 + 5, Y1 - 5, X0 + 9, Y1 - 5, '#86e36f'); drawText(g, 'MEJOR', X0 + 16, Y1 - 18, { font: 'tiny', color: '#86e36f' });
    shown.forEach(a => { const dom = two.find(q => q.id === a.id).dominated, xx = px(a.crit.costo), yy = py(a.crit.deficit); if (!dom) fdisc(g, xx, yy, 6, '#3a3a10'); fdisc(g, xx, yy, 4, dom ? '#5a5e80' : '#ffe14d'); if (!dom) fpx(g, xx - 1, yy - 2, '#fffaf0'); drawText(g, a.id, xx + 7, yy - 4, { color: dom ? '#8a8fb8' : '#fffaf0', shadow: '#05081d' }); });
    // panel lateral: leyenda y la trampa de mirar solo dos criterios
    const lx = x + w + 6, lw = W - lx - 8;
    UIK.panel(g, lx, y, lw, h, 'tech');
    drawText(g, 'POLÍTICAS', lx + 6, y + 6, { font: 'tiny', color: '#eab02a' });
    MO_ALTS.forEach((a, i) => { const dom = two.find(q => q.id === a.id).dominated, on = sid.has(a.id); const yy = y + 18 + i * 20; fdisc(g, lx + 10, yy + 4, 3, !on ? '#1c1f40' : dom ? '#5a5e80' : '#ffe14d'); drawText(g, a.id + '. ' + a.name, lx + 18, yy, { font: 'tiny', color: on ? '#fffaf0' : '#4a4e70', max: 34 }); if (on) drawText(g, fmt(a.crit.costo, 2) + ' $/m³ · ' + a.crit.deficit + ' m³/d', lx + 18, yy + 8, { font: 'tiny', color: dom ? '#8a8fb8' : '#c2f58e' }); });
    if (k >= 1) { UIK.panel(g, lx + 4, y + h - 62, lw - 8, 56, 'dialog'); drawTextBlock(g, 'Con 2 criterios, M parece descartable. Pero M exporta más H2 que nadie: con 6 criterios deja de estar dominada. Qué miras decide qué ves.', lx + 9, y + h - 57, lw - 20, { font: 'tiny', color: '#fff6d8', lineH: 8 }); }
  },
  drawTable(g, x, y) {
    const ph = this.phase, keys = Object.keys(MO_DIRS).filter(k => this.shown.has(k));
    const P = this.pareto();
    UIK.panel(g, x, y, 470, 232, 'tech');
    drawText(g, 'ALTERNATIVA', x + 8, y + 6, { font: 'tiny', color: '#eab02a' });
    keys.forEach((k, i) => drawText(g, MO_SHORT[k] + (MO_DIRS[k] === 'min' ? ' ↓' : ' ↑'), x + 150 + i * 52, y + 6, { font: 'tiny', color: '#a6f4ff' }));
    if (ph === 'auto') drawText(g, 'ÍNDICE', x + 150 + keys.length * 52, y + 6, { font: 'tiny', color: '#f27ee6' });
    MO_ALTS.forEach((a, r) => {
      const yy = y + 18 + r * 30;
      const marked = this.marks.has(a.id), picked = this.pick === a.id;
      if (Gui.button(g, 'alt' + a.id, x + 6, yy, 140, 26, a.id + '. ' + a.name, { style: picked ? 'good' : marked ? 'danger' : 'ghost', align: 'left', disabled: this.done && ph !== 'free' })) {
        if (ph === 'guided') { if (marked) this.marks.delete(a.id); else this.marks.add(a.id); }
        else this.pick = a.id;
        Audio2.sfx('ui');
      }
      keys.forEach((k, i) => { const v = a.crit[k]; const n = MOModel.normalize(MO_ALTS, { [k]: MO_DIRS[k] }).find(q => q.id === a.id).norm[k]; frect(g, x + 150 + i * 52, yy + 18, Math.round(46 * n), 4, n > 0.66 ? '#86e36f' : n > 0.33 ? '#ffe14d' : '#ff6b6b'); drawText(g, k === 'costo' ? fmt(v, 2) : k === 'equidad' ? fmt(v, 2) : fmt0(v), x + 150 + i * 52, yy + 6, { font: 'tiny', color: '#fffaf0' }); });
      if (ph === 'auto') { const s = this.monoScore(a); drawText(g, String(s), x + 156 + keys.length * 52, yy + 6, { color: a.id === 'M' ? '#ffe14d' : '#f27ee6' }); }
      if (ph === 'free' && P.find(q => q.id === a.id).dominated) { frect(g, x + 104, yy + 1, 40, 7, '#05081d'); drawText(g, 'DOMINADA', x + 142, yy + 2, { font: 'tiny', color: '#ff9a8a', align: 'right' }); }
    });
    const CX = 484, CW = W - CX - 6;
    UIK.panel(g, CX, 28, CW, 232, 'glass');
    if (ph === 'auto') {
      drawText(g, 'ACTORES', CX + 6, 32, { font: 'tiny', color: '#eab02a' });
      STAKEHOLDERS.forEach((s, i) => { const heard = this.heard.has(s.id); if (Gui.button(g, 'sh' + s.id, CX + 6, 42 + i * 22, CW - 12, 20, s.who, { style: heard ? 'good' : 'ghost', icon: s.icon, align: 'left', tip: s.text, disabled: this.done })) { this.heard.add(s.id); this.shown.add(s.crit); if (s.crit === 'equidad') this.shown.add('deficit'); this.say('{y}' + s.who + ':{/} "' + s.text + '"'); Audio2.sfx('voice', { voice: 'npc' }); } });
      drawText(g, 'SUPUESTOS DECLARADOS', CX + 6, 134, { font: 'tiny', color: '#eab02a' });
      const a1 = Gui.toggle(g, 'as1', CX + 6, 144, 'Normalización 0–1', this.assume.units); if (!this.done) this.assume.units = a1;
      const a2 = Gui.toggle(g, 'as2', CX + 6, 162, 'Pesos discutibles', this.assume.weights); if (!this.done) this.assume.weights = a2;
      const a3 = Gui.toggle(g, 'as3', CX + 6, 180, 'Incertidumbre visible', this.assume.uncertainty); if (!this.done) this.assume.uncertainty = a3;
      drawTextBlock(g, 'Restricciones duras: déficit ≤ 25 m³/d · salmuera ≤ 6. No se compensan con puntos.', CX + 6, 198, CW - 14, { font: 'tiny', color: '#ff9a8a', lineH: 8 });
    } else if (ph === 'guided') {
      drawTextBlock(g, '{y}Dominada:{/} otra alternativa es igual o mejor en todos los criterios y estrictamente mejor en al menos uno. Las flechas indican si conviene bajar (↓) o subir (↑).', CX + 6, 34, CW - 12, { color: '#e2ebfc' });
      if (Gui.button(g, 'hintb', CX + 6, 200, 54, 16, 'Pista', { style: 'ghost', icon: 'hint' })) this.hint();
    } else if (ph === 'free') {
      drawText(g, 'PESOS (decisión de valores)', CX + 6, 32, { font: 'tiny', color: '#eab02a' });
      Object.keys(MO_DIRS).forEach((k, i) => { this.w[k] = Gui.slider(g, 'w' + k, CX + 6, 42 + i * 26, CW - 12, this.w[k], 0, 3, 0.5, { label: MO_LABELS[k] }); });
      const N = MOModel.normalize(MO_ALTS, MO_DIRS); const best = N.map(a => [a, MOModel.score(a, this.w)]).sort((a, b) => b[1] - a[1])[0];
      drawText(g, 'Mejor con estos pesos: ' + best[0].id, CX + 6, 202, { color: '#86e36f' });
    }
    if (!this.done && ph !== 'free' && Gui.button(g, 'ev', CX + 6, 238, 110, 18, ph === 'guided' ? 'Comprobar' : 'Decidir', { style: 'good', icon: 'check' })) this.evaluate();
  },
  drawContract(g, x, y) {
    const CL = [['flex', 'H2 flexible: solo con excedente renovable', 'El H2 sigue al excedente: más en años ventosos, menos en años secos.'], ['fixed', '150 kg/día de H2 fijos', 'Compromiso rígido: en años secos, la energía del H2 compite con la del agua.'], ['waterfirst', 'Cláusula de agua esencial primero', 'Si falta energía, se recorta el H2 antes que el agua (con multa si el H2 era fijo).'], ['review', 'Revisión pública anual de supuestos', 'Datos, supuestos y resultados se publican cada año; la comunidad puede pedir ajustes.']];
    UIK.panel(g, x, y, W - 16, 232, 'tech');
    drawText(g, 'CLÁUSULAS DEL CONTRATO DE H2', x + 8, y + 6, { font: 'tiny', color: '#eab02a' });
    CL.forEach(([id, label, note], i) => {
      const on = this.clauses.has(id), by = y + 16 + i * 38;
      if (Gui.button(g, 'cl' + id, x + 8, by, 300, 20, label, { style: on ? 'gold' : 'ghost', align: 'left', icon: on ? 'check' : null, disabled: this.done })) { if (on) this.clauses.delete(id); else { this.clauses.add(id); if (id === 'flex') this.clauses.delete('fixed'); if (id === 'fixed') this.clauses.delete('flex'); } Audio2.sfx('ui'); }
      drawTextBlock(g, note, x + 12, by + 23, 290, { font: 'tiny', color: on ? '#ffe08a' : '#8a8fb8', lineH: 7 });
    });
    drawTextBlock(g, 'Supuesto de simulación para fines educativos. El banco pide en promedio ≥ 90 kg/d de H2 para pagar el préstamo.', x + 8, y + 172, 300, { font: 'tiny', color: '#a6f4ff', lineH: 8 });
    const res = this.contractRun();
    res.forEach((r, i) => {
      const bx = x + 320 + i * 100, by = y + 14, bw = 94, bh = 188;
      UIK.panel(g, bx, by, bw, bh, 'glass');
      drawText(g, 'AÑO ' + r.name.toUpperCase(), bx + bw / 2, by + 5, { font: 'tiny', align: 'center', color: '#a6f4ff' });
      // columna energética: base de agua esencial + excedente; línea del compromiso de H2
      const cx = bx + 14, cw = 26, base = by + 128, sc = 0.36;
      const wH = 40, sH = Math.round(r.surplus * sc), cH = Math.round(r.commit * sc);
      frect(g, cx, base - wH, cw, wH, '#1c6fd0'); SCBK.veil(g, cx, base - wH, cw, wH, '#56e5ff', 0.2);
      drawText(g, 'AGUA', cx + cw / 2, base - wH / 2 - 3, { font: 'tiny', align: 'center', color: '#fffaf0' });
      frect(g, cx, base - wH - sH, cw, sH, '#1f854c'); SCBK.veil(g, cx, base - wH - sH, cw, sH, '#86e36f', 0.25);
      if (r.water < 1) { const eat = Math.round((1 - r.water) * wH); SCBK.veil(g, cx, base - wH, cw, eat, '#ff4e5d', 0.6); }
      if (r.commit > 0) { const ly = base - wH - cH; for (let xx = cx - 4; xx < cx + cw + 4; xx += 2) fpx(g, xx, ly, '#ffe14d'); drawText(g, 'H2', cx + cw + 6, ly - 3, { font: 'tiny', color: '#ffe14d' }); }
      drawText(g, 'excedente', cx + cw + 6, base - wH - sH / 2 - 3, { font: 'tiny', color: '#86e36f' });
      const ty = base + 6;
      drawText(g, 'Agua esencial', bx + 6, ty, { font: 'tiny', color: '#cfd6f0' }); UIK.bar(g, bx + 6, ty + 8, bw - 12, 4, r.water, r.water >= 0.999 ? '#86e36f' : '#ff6b6b');
      drawText(g, fmt0(r.water * 100) + ' %', bx + bw - 6, ty, { font: 'tiny', color: r.water >= 0.999 ? '#c2f58e' : '#ff9a8a', align: 'right' });
      drawText(g, 'H2 ' + fmt0(r.h2) + ' kg/d', bx + 6, ty + 18, { font: 'tiny', color: '#d8fff8' });
      if (r.penalty > 0) drawText(g, 'Multa: ' + fmt0(r.penalty) + ' kg/d', bx + 6, ty + 28, { font: 'tiny', color: '#ffb83e' });
    });
    if (!this.done && Gui.button(g, 'ev', W - 150, y + 210, 130, 18, 'Probar contrato', { style: 'good', icon: 'check' })) this.evaluate();
  },
});
