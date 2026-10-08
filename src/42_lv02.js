/* =====================================================================
   42_lv02.js — NIVEL 02: EL LABERINTO OSMÓTICO
   Planta de pretratamiento fino, bombas de alta presión y trenes de OI.
   RA-02 · Tejedor de Presión · Guardián: OSMORA
   ===================================================================== */

/** Conductividad aproximada del permeado (µS/cm) a partir de TDS (g/L) — factor 0,55 mg/L por µS/cm */
const tdsToEC = (gL) => gL * 1000 / 0.55;

LEVELS[2] = {
  id: 2, title: 'El Laberinto Osmótico', chapter: 'CAPÍTULO 02', biome: 'plant', music: 'plant', width: 2600, height: 360,
  ambience: { hum: 0.7, sea: 0.1, bubbles: 0.3 },
  portraits: ['amaya', 'kiru', 'naira', 'dante', 'operador'],
  spawn: { x: 60, y: 290 },
  checkpoints: { control: { x: 1460, y: 290 }, cabinet: { x: 2080, y: 290 } },
  ground: [[0, 290], [2600, 290]],
  terrain: [{ x0: 0, x1: 2600, mat: 'metal' }],
  platforms: [
    { x: 268, y: 262, w: 44, type: 'pipe' }, { x: 318, y: 240, w: 30, type: 'metal' },
    { x: 690, y: 222, w: 570, type: 'metal' },
    { x: 1420, y: 214, w: 230, type: 'metal' },
    { x: 1760, y: 248, w: 60, type: 'metal' }, { x: 1850, y: 226, w: 70, type: 'metal' },
  ],
  ladders: [{ x: 700, y0: 222, y1: 290 }, { x: 1250, y0: 222, y1: 290 }, { x: 1430, y0: 214, y1: 290 }],
  cam: { look: 50, vy: 0.66 },
  /* ---------------- accesorios estáticos ---------------- */
  props(pb, world) {
    const gy = 290;
    // filtros de cartucho (pretratamiento fino)
    for (let k = 0; k < 4; k++) { ART.tank(pb, 112 + k * 26, gy, 16, 54, RAMP.steelW, { band: '#1aa894', label: true }); pb.rect(116 + k * 26, gy - 62, 8, 4, '#345a78'); }
    drawSign(pb, 160, gy - 66, 'CARTUCHOS 5 µM', '#1491aa');
    ART.pipe(pb, 100, gy - 30, 220, gy - 30, 3, 'seawater');
    // bombas de alta presión y recuperadores de energía
    for (let k = 0; k < 3; k++) ART.hpPump(pb, 360 + k * 70, gy);
    drawSign(pb, 470, gy - 40, 'ALTA PRESIÓN', '#8d6bff');
    // recuperador (estación del minijuego)
    pb.rect(586, gy - 46, 40, 46, '#c8d8e8'); pb.rect(586, gy - 46, 40, 3, '#ffffff'); pb.rect(622, gy - 46, 4, 46, '#8396ba');
    pb.ellipse(606, gy - 26, 12, 12, '#345a78'); pb.ellipse(606, gy - 26, 9, 9, '#c8a860'); pb.ellipse(606, gy - 26, 3, 3, '#263442');
    drawSign(pb, 606, gy - 48, 'ERD', '#8e2a80');
    // colectores: alimentación (azul), permeado (cian), concentrado (violeta)
    ART.pipe(pb, 220, gy - 30, 690, gy - 30, 3, 'seawater');
    ART.pipe(pb, 680, gy - 12, 1300, gy - 12, 2, 'water');
    ART.pipe(pb, 690, gy - 52, 1290, gy - 52, 2, 'brine');
    ART.pipe(pb, 1290, gy - 52, 2560, gy - 52, 2, 'brine');
    // trenes de membranas A, B y C (dos niveles)
    for (let k = 0; k < 3; k++) {
      const tx = 712 + k * 190;
      ART.roRack(pb, tx, gy - 4, 4, true, { tubeW: 120 });
      ART.roRack(pb, tx, 222, 4, true, { tubeW: 120 });
      drawSign(pb, tx + 70, 222 - 52, 'TREN ' + 'ABC'[k], k === 1 ? '#d8343c' : '#1491aa');
    }
    // etiquetas de bloqueo en el tren B (aislado por LIMEN)
    for (let i = 0; i < 6; i++) { const x = 920 + i * 20; pb.rect(x, gy - 40, 5, 8, '#ff4e5d'); pb.set(x + 2, gy - 38, '#fffaf0'); }
    for (let i = 0; i < 14; i++) pb.set(910 + i * 9, gy - 2 - (i % 3), '#c4fbff');
    // tanque de permeado y contactor de calcita (remineralización)
    ART.tank(pb, 1300, gy, 34, 70, RAMP.steelW, { band: '#56e5ff', label: true, ladder: true });
    ART.tank(pb, 1346, gy, 20, 46, ['#4a3a2a', '#6a5a4a', '#8a7a6a', '#b0a090', '#d0c4b0', '#ece4d6', '#ffffff'], { band: '#c8a860' });
    drawSign(pb, 1356, gy - 48, 'CALCITA', '#a08060');
    // sala de control elevada con ventanales
    const cx = 1420;
    pb.rect(cx, 130, 230, 84, '#dfe4f2'); pb.rect(cx, 130, 230, 4, '#5b6f96'); pb.rect(cx + 226, 130, 4, 84, '#8a94b8');
    for (let k = 0; k < 4; k++) { pb.rect(cx + 10 + k * 54, 142, 46, 34, '#1a2a4a'); pb.rect(cx + 10 + k * 54, 142, 46, 2, '#6aa0b4'); pb.line(cx + 14 + k * 54, 170, cx + 30 + k * 54, 146, '#2a4a6a'); }
    pb.rect(cx - 4, 210, 238, 4, '#345a78');
    drawSign(pb, cx + 115, 130, 'CONTROL OI', '#8d6bff');
    for (let x = cx + 4; x < cx + 226; x += 6) pb.vline(x, 200, 210, '#98c6d2');
    // área de limpieza CIP y dosificación de antiincrustante
    for (let k = 0; k < 3; k++) ART.tank(pb, 1700 + k * 44, gy, 30, 56 - k * 6, RAMP.steelW, { band: k === 2 ? '#86e36f' : '#ff9f43', label: true, ladder: k === 0 });
    drawSign(pb, 1760, gy - 62, 'LIMPIEZA CIP', '#ff9f43');
    ART.tank(pb, 1840, gy, 14, 24, RAMP.steelW, { band: '#b49cff' }); drawSign(pb, 1848, gy - 26, 'ANTIINCRUST.', '#5a44a8');
    // armario del controlador de despacho
    const dx = 2180;
    pb.rect(dx, gy - 86, 50, 86, '#1d2a48'); pb.rect(dx, gy - 86, 50, 3, '#477a94'); pb.rect(dx + 46, gy - 86, 4, 86, '#0a1030');
    for (let r = 0; r < 8; r++) { pb.rect(dx + 4, gy - 80 + r * 9, 38, 6, '#263442'); for (let k = 0; k < 5; k++) pb.set(dx + 8 + k * 6, gy - 78 + r * 9, ['#86e36f', '#56e5ff', '#ffe14d', '#86e36f', '#ff4e5d'][(r + k) % 5]); }
    drawSign(pb, dx + 25, gy - 88, 'DESPACHO', '#5a44a8');
    // salida hacia los canales de concentrado
    pb.rect(2520, gy - 70, 50, 70, '#3a3460'); pb.rect(2524, gy - 66, 42, 66, '#140d26'); pb.rect(2520, gy - 74, 50, 4, '#8d6bff');
    drawSign(pb, 2470, gy, 'CANALES DE SALMUERA', '#8e2a80');
  },
  decorate(pb, world) {
    // franjas de seguridad, rejillas de drenaje y charcos en el piso técnico
    for (let x = 0; x < world.w; x++) { const on = (x >= 680 && x < 1300) || (x >= 1690 && x < 1870); if (on) { pb.set(x, 292, ((x >> 2) & 1) ? '#ffe14d' : '#263442'); pb.set(x, 293, ((x >> 2) & 1) ? '#c8a020' : '#1d2a48'); } }
    for (let x = 140; x < world.w; x += 260) { pb.rect(x, 300, 26, 6, '#1d2a48'); for (let k = 2; k < 26; k += 3) pb.vline(x + k, 301, 305, '#477a94'); }
    for (const x of [820, 1080, 1760]) { pb.ellipse(x, 296, 14, 2, '#6aa0b4'); pb.hline(x - 8, x + 4, 295, '#cfe8ee'); }
  },
  propsFront(pb, world) {
    // barandas delanteras de la pasarela
    for (let x = 690; x < 1260; x += 10) pb.vline(x, 208, 222, '#98c6d2');
    pb.hline(690, 1259, 208, '#cfe8ee');
  },
  /* ---------------- dinámico ---------------- */
  renderMid(g, sc, cam) {
    const S = sc.state, t = Game.time, ox = cam.x, oy = cam.y, gy = 290 - oy;
    // flujos visibles: alimentación, permeado y concentrado (distintos colores)
    const on = S.trainsOn ?? 2;
    Charts.flow(g, [[220 - ox, gy - 30], [690 - ox, gy - 30]], 'seawater', 0.5 + on * 0.3, 3);
    Charts.flow(g, [[680 - ox, gy - 12], [1300 - ox, gy - 12]], 'permeate', 0.4 + on * 0.3, 2);
    Charts.flow(g, [[690 - ox, gy - 52], [2560 - ox, gy - 52]], 'brine', 0.4 + on * 0.3, 2);
    // tubos de presión del tren B: sin flujo, cristales de LIMEN
    if (!S.trainBOn) for (let i = 0; i < 4; i++) { const ph = (t * 0.6 + i * 0.25) % 1; fpx(g, 920 + i * 30 - ox, gy - 60 - ph * 20, '#c4fbff'); }
    // indicadores LED de cada tren
    for (let k = 0; k < 3; k++) { const x = 712 + k * 190 - ox; const ok = k !== 1 || S.trainBOn; frect(g, x + 2, gy - 58, 4, 3, ok ? ((Math.floor(t * 2 + k) % 2) ? '#86e36f' : '#3a8a3a') : ((Math.floor(t * 4) % 2) ? '#ff4e5d' : '#6a1414')); }
    // recuperador de energía: rotor girando
    const rx = 606 - ox, ry = gy - 26;
    const a = t * (S.erdSync ? 6 : 2.5);
    for (let k = 0; k < 6; k++) { const aa = a + k * Math.PI / 3; fpx(g, rx + Math.cos(aa) * 7, ry + Math.sin(aa) * 7, k % 2 ? '#8e2a80' : '#1283bf'); }
    // pantallas de la sala de control
    for (let k = 0; k < 4; k++) { const x = 1430 + k * 54 - ox, y = 142 - oy; for (let i = 0; i < 5; i++) frect(g, x + 4, y + 6 + i * 5, 6 + ((i * 7 + Math.floor(t * 3) + k) % 26), 1, k === 1 && !S.trainBOn ? '#ff4e5d' : '#56e5ff'); }
    // armario de despacho: LED de firma
    frect(g, 2222 - ox, gy - 12, 3, 3, (Math.floor(t * 3) % 2) ? '#f27ee6' : '#3a1a3a');
    // vapor de rociado en limpieza CIP
    if (S.cip > 0 && Math.random() < 0.3) sc.world.ps.emit('vapor', 1730 + Math.random() * 100, 230, 0, -20, 1);
  },
  renderGrade(g, sc) { },
  lens(g, sc, cam, k) {
    const ox = cam.x, oy = cam.y, S = sc.state, gy = 290 - oy;
    const r = S.ro || ROModel.solve({ P: 60 });
    lensBoundary(g, 690 - ox, 160 - oy, 600, 136, '#ffe14d', 'LÍMITE: TRENES DE OI');
    lensTag(g, 300 - ox, gy - 46, 'Qf ' + fmt0(r.Qf) + ' m³/h · ' + fmt(r.Cf, 1) + ' g/L', '#6cf0db', 'water');
    lensTag(g, 760 - ox, gy - 26, 'Qp ' + fmt(r.Qp, 1) + ' m³/h · ' + fmt0(tdsToEC(r.Cp)) + ' µS/cm', '#e6fdff', 'membrane');
    lensTag(g, 1000 - ox, gy - 66, 'Qc ' + fmt(r.Qc, 1) + ' m³/h · ' + fmt(r.Cc, 1) + ' g/L', '#f888b8', 'drop_brine');
    lensTag(g, 1080 - ox, 180 - oy, 'R = Qp/Qf = ' + fmt0(r.R * 100) + ' %', '#ffe14d', 'chart');
    lensTag(g, 1080 - ox, 192 - oy, 'Qf = Qp + Qc  →  ' + fmt0(r.Qf) + ' = ' + fmt(r.Qp, 1) + ' + ' + fmt(r.Qc, 1), '#c2f58e', 'scale');
    lensTag(g, 400 - ox, gy - 66, 'Bombas ' + fmt0(r.Pel) + ' kW · SEC ' + fmt(r.SEC, 2) + ' kWh/m³', '#ffe14d', 'bolt');
  },
  hud(g, sc) {
    const S = sc.state;
    if (!S.hud) return;
    const r = S.ro || ROModel.solve({ P: 60 });
    hudGauges(g, [
      { icon: 'water', label: 'PERMEADO', value: fmt0(r.Qp * (S.trainsOn ?? 2)) + ' m³/h', frac: r.Qp * (S.trainsOn ?? 2) / 130, color: '#56e5ff' },
      { icon: 'membrane', label: 'CONDUCT.', value: fmt0(tdsToEC(r.Cp)) + ' µS/cm', frac: tdsToEC(r.Cp) / 1500, color: tdsToEC(r.Cp) > 730 ? '#ff4e5d' : '#86e36f' },
      { icon: 'bolt', label: 'SEC', value: fmt(r.SEC, 2) + ' kWh/m³', frac: r.SEC / 5, color: r.SEC > 3.3 ? '#ff9f43' : '#ffe14d' },
      { icon: 'warn', label: 'TREN B', value: S.trainBOn ? 'EN LÍNEA' : 'AISLADO', frac: S.trainBOn ? 1 : 0, color: S.trainBOn ? '#86e36f' : '#ff4e5d' },
    ]);
  },
  /* ---------------- guion ---------------- */
  setup(sc, p) {
    const S = sc.state;
    Object.assign(S, { trainsOn: 2, trainBOn: false, hud: true, ro: ROModel.solve({ P: 60 }), cip: 0, erdSync: false });
    const ivan = sc.actor('ivan', 'operador', 480, { facing: -1 });
    const naira = sc.actor('naira', 'naira', 1000, { facing: -1, restAnim: 'scan' });
    const dante = sc.actor('dante', 'dante', 1780, { facing: -1, restAnim: 'repair' });
    sc.world.add(new Pickup({ kind: 'echo', x: 1010, y: 196, onPick: () => kiruEcho(sc, 'l2a', 'KIRU: "Este zumbido de bombas… lo escuché desde dentro de una caja. Hace mucho."') }));
    sc.world.add(new Pickup({ kind: 'echo', x: 1880, y: 200, onPick: () => kiruEcho(sc, 'l2b', 'KIRU: "Dante me dio un tornillo de la suerte. ¿Por qué tengo guardada una lista de 120 familias de Los Médanos?"') }));
    // adversarios del ensuciamiento alrededor de los trenes
    S.advs = [];
    for (const [type, x, y] of [['fouler', 860, 250], ['scale', 1140, 200], ['fouler', 1960, 250]]) S.advs.push(sc.world.add(new Adversary({ type, x, y, range: 34, speed: 20 })));
    ivan.onTalk = async (sc2) => {
      if (!S.metIvan) {
        S.metIvan = true;
        await sc2.say([
          ['operador', 'worried', 'Iván, operador de turno. Llevamos dos trenes de tres: esa cosa de cristal aisló el tren B a las 3:12 de la madrugada.'],
          ['operador', 'determined', 'Si me dejan, subo la presión al máximo en A y C y compenso. Aquí le decimos {v}OSMORA{/}: cuando algo falla, todos suben la presión.'],
          ['amaya', 'thinking', '¿Y qué pasa cuando subes la presión?'],
          ['operador', 'skeptical', 'Sale más agua. Al menos al principio. Luego… las membranas se quejan.'],
          ['kiru', 'curioso', 'Hipótesis registrada: "más presión = más agua" (válida solo al principio). Solicito datos.'],
        ]);
        Codex.unlock('osmosis');
        sc2.setObjective('Revisa el tren B con Naira', ['¿Por qué LIMEN aislaría un tren que produce agua?', 'Naira está junto al tren B, en el centro de la nave.', 'Camina a la derecha, pasando las bombas.']);
      } else if (S.simDone) await sc2.say([['operador', 'smile', 'Con el recuperador sincronizado, la factura de energía baja un tercio. No sabía que la salmuera empujara tanto.']]);
      else await sc2.say([['operador', 'neutral', 'El gemelo de la OI está en la sala de control, arriba a la derecha.']]);
    };
    naira.onTalk = async (sc2) => {
      if (!S.metNaira) {
        S.metNaira = true;
        await sc2.say([
          ['naira', 'calm', 'Mira esta muestra del tren B. Cristalina. Perfecta para una foto.'],
          ['amaya', 'smile', 'Entonces LIMEN aisló un tren que producía agua limpia.'],
          ['naira', 'skeptical', '"Clara" no significa "adecuada", Amaya. El boro, los cloruros y las sales disueltas no se ven.'],
          ['kiru', 'thinking', 'Puedo medir conductividad con el {c}Barrido Sensorial{/}. Pulsa {y}Q{/} junto a la toma de muestras.'],
        ]);
        sc2.world.find('sampleB').hidden = false;
        sc2.setObjective('Mide el permeado del tren B (Q junto a la toma de muestras)', ['¿Qué variable revela sales que no se ven?', 'La conductividad eléctrica sube cuando hay más sales disueltas.', 'Acércate a la toma de muestras roja y pulsa Q.']);
      } else if (!S.sampled) await sc2.say([['naira', 'calm', 'Mide primero. Las opiniones vienen después.']]);
      else await sc2.say([['naira', 'thinking', 'LIMEN aisló un tren que entregaba agua fuera de especificación. Eso no lo hace un saboteador cualquiera.']]);
    };
    dante.onTalk = async (sc2) => {
      if (!S.metDante) { S.metDante = true; await sc2.say([['dante', 'joy', '¡Bienvenidas al laberinto! Aquí todo silba, gotea o vibra. Mi paraíso.'], ['dante', 'thinking', 'Los tanques de limpieza CIP están listos, pero Iván dice que limpiar "por si acaso" gasta químicos y deja la planta parada horas.'], ['kiru', 'curioso', 'Regla de oro: limpiar cuando los indicadores lo justifican, no cuando da ansiedad.']]); Codex.unlock('fouling'); }
      else await sc2.say([['dante', 'smile', 'Si encuentras algo raro en el armario de despacho, avísame. Esos LED rosados no son del fabricante.']]);
    };
    // --- estaciones
    sc.station({ id: 'sampleB', x: 980, kind: 'sensor', label: 'Toma de muestras · tren B', glow: '#ff4e5d', hidden: true, scan: (sc2, st) => sc2.run(() => sampleTrainB(sc2, st)), onUse: async (sc2, st) => { if (!S.sampled) sc2.kiru && sc2.kiru.say('Usa {y}Q{/} (Barrido Sensorial) para medir.', 'curioso'); else await sampleTrainB(sc2, st); } });
    sc.station({ id: 'logB', x: 1600, y: 214, kind: 'terminal', label: 'Registro del tren B', glow: '#ff9f43', hidden: true, onUse: async (sc2, st) => { st.done = true; await logTrainB(sc2); } });
    sc.station({ id: 'roSim', x: 1520, y: 214, kind: 'sim', label: 'Gemelo de la OI', glow: '#56e5ff', hidden: true, onUse: async (sc2, st) => roFlow(sc2, st) });
    sc.station({ id: 'erd', x: 606, kind: 'valve', label: 'Recuperador de energía', glow: '#b49cff', hidden: true, onUse: async (sc2, st) => erdFlow(sc2, st) });
    sc.station({ id: 'calcite', x: 1356, kind: 'valve', label: 'Contactor de calcita', glow: '#c8a860', onUse: async (sc2) => sideRemineral(sc2) });
    sc.station({ id: 'gauges', x: 300, kind: 'sensor', label: 'Manómetros gemelos', glow: '#ffe14d', onUse: async (sc2, st) => sideGauges(sc2, st) });
    sc.station({ id: 'cabinet', x: 2205, kind: 'clue', label: 'Armario de despacho', glow: '#f27ee6', hidden: true, onUse: async (sc2, st) => { st.done = true; await cabinetClue(sc2); } });
    sc.station({ id: 'solo', x: 2350, kind: 'solo', label: 'Puerta de Evidencia', glow: '#b49cff', hidden: true, onUse: async (sc2, st) => {
      const r = await sc2.open(SOLOScene, { ctx: 'RA-02-C2' });
      st.progress = r.correct; if (r.correct >= 3) { st.done = true; GS.lp(2).solo = true; S.soloDone = true; Codex.unlock('balance_sal'); }
    } });
    sc.station({ id: 'exit', x: 2545, kind: 'clue', label: 'Ir a los canales', glow: '#ffe14d', hidden: true, onUse: async (sc2) => finishLevel2(sc2) });
    sc.setObjective('Habla con el operador junto a las bombas de alta presión', ['¿Qué tan llena de energía está esta nave?', 'Iván está junto a las bombas verdes.', 'Camina a la derecha.']);
    Codex.unlock('ro');
    if (p.checkpoint === 'control') { Object.assign(S, { metIvan: true, metNaira: true, sampled: true, logRead: true }); sc.world.find('roSim').hidden = false; sc.world.find('logB').hidden = false; sc.world.find('sampleB').hidden = false; GS.addClue('clearPermeate'); sc.setObjective('Opera el Gemelo de la OI en la sala de control', ['¿Qué relación hay entre presión, recuperación y calidad?']); }
    if (p.checkpoint === 'cabinet') { Object.assign(S, { metIvan: true, metNaira: true, sampled: true, logRead: true, simDone: true, erdDone: true, trainBOn: false }); GS.giveTool('tejedor', true); sc.world.find('cabinet').hidden = false; sc.setObjective('Investiga el armario de despacho (LED rosados)', []); }
  },
  update(sc, dt) {
    const S = sc.state;
    if (S.cip > 0) S.cip -= dt;
    if (Math.random() < 0.04) sc.world.ps.emit('drop', 700 + Math.random() * 560, 222, 0, 20, 1);
  },
  triggers: [
    { x: 240, w: 30, run: (sc) => { sc.kiru && sc.kiru.say('Cartuchos de 5 µm: la última barrera antes de las membranas. Aquí todo zumba a 60 bar.', 'curioso', 4); } },
    { x: 820, w: 40, run: (sc) => { sc.kiru && sc.kiru.say('Esos remolinos ensucian sensores. Calma a los adversarios con {y}Q{/} cuando estés cerca.', 'alarmado', 4); } },
  ],
};

/* ---------------- piezas del guion del nivel 02 ---------------- */
async function sampleTrainB(sc, st) {
  const S = sc.state;
  if (S.sampled) { await sc.say([['kiru', 'thinking', 'Tren B: ' + fmt0(1420) + ' ± 40 µS/cm; boro 1,6 mg/L. Especificación: < 730 µS/cm y boro < 1,0 mg/L (supuesto de simulación).']]); return; }
  S.sampled = true; st.done = true; Audio2.sfx('sample');
  sc.world.ps.emit('drop', 980, 250, 0, -40, 12, 3);
  await sc.say([
    ['kiru', 'alarmado', 'Conductividad del permeado del tren B: {o}1420 ± 40 µS/cm{/}. Tren A: 380 µS/cm. Boro en B: 1,6 mg/L.'],
    ['naira', 'calm', 'Cristalina y fuera de especificación. Con ese boro, mis tomates y pimentones se quemarían en una semana.'],
    ['amaya', 'surprised', 'Pero el agua se ve perfecta…'],
    ['kiru', 'thinking', 'Probable causa: un sello dañado deja pasar agua de alimentación al permeado. Se ve igual. No es igual.'],
  ]);
  GS.addClue('clearPermeate'); Codex.unlock('permeado');
  LearningModel.record({ kind: 'challenge', id: 'lv2_permeado_claro', ra: 'RA-02', concepts: ['waterQuality', 'reverseOsmosis'], solo: 2, correct: true });
  sc.world.find('logB').hidden = false; sc.world.find('roSim').hidden = false;
  sc.setObjective('Lee el registro del tren B en la sala de control', ['¿Quién aisló el tren y con qué datos?', 'La sala de control está elevada, a la derecha. Sube por la escalera.']);
}
async function logTrainB(sc) {
  const S = sc.state;
  if (S.logRead) { await sc.say([['kiru', 'neutral', 'Registro: 03:12:07 — L.I.M.E.N.: AISLAR TREN B. Motivo: conductividad > límite + caída de presión anómala en el recipiente 4.']]); return; }
  S.logRead = true;
  await sc.say([
    ['kiru', 'thinking', 'Registro del tren B. 03:11:58: conductividad del permeado sube de 410 a 1380 µS/cm. 03:12:07: {c}L.I.M.E.N.{/}: AISLAR TREN B. Motivo: riesgo de contaminación del agua de consumo.'],
    ['amaya', 'thinking', 'Nueve segundos. Aisló el tren nueve segundos después de que la calidad se saliera de rango.'],
    ['naira', 'smile', 'Un saboteador que protege el agua de consumo. Qué villano tan extraño.'],
    ['amaya', 'skeptical', 'O quiere que confiemos en él. Igual sigue cerrando cosas sin preguntar.'],
    ['kiru', 'curioso', 'Ambas hipótesis siguen abiertas. Pero la primera tiene datos.'],
  ]);
  GS.flag('foundUnsafePermeateLog', true); Codex.unlock('p_limen');
  sc.setObjective('Opera el Gemelo de la OI: ¿más presión es mejor operación?', ['¿Qué limita la presión que puedes aplicar?', 'Mira la presión osmótica, la recuperación y la conductividad del permeado.', 'Entra al Gemelo de la OI junto al registro.']);
  GS.save('control');
}
async function roFlow(sc, st) {
  const S = sc.state;
  if (!S.simStage) {
    const r = await sc.open(Sim02, { phase: 'demo', stopAfter: 'guided' });
    if (!r || !r.ok) return;
    S.simStage = 'erd'; GS.giveTool('tejedor');
    Codex.unlock('recuperacion'); Codex.unlock('sec');
    await sc.say([
      ['kiru', 'happy', 'Nueva herramienta: {c}Tejedor de Presión{/}. Permite ajustar trenes dentro de límites seguros.'],
      ['operador', 'worried', '(por radio) Amaya, la planta solo tiene energía para dos trenes. Si quieres el tercero, hay que sincronizar el recuperador de energía.'],
      ['amaya', 'determined', 'El ERD: usa la presión que todavía trae la salmuera para empujar el agua nueva. Voy.'],
    ]);
    sc.world.find('erd').hidden = false;
    sc.setObjective('Sincroniza el recuperador de energía (ERD) junto a las bombas', ['¿De dónde sale la energía que el ERD recupera?', 'El concentrado sale a ~58 bar: su presión se puede transferir a la alimentación.', 'Vuelve a la zona de bombas (izquierda) y usa el ERD.']);
    return;
  }
  if (S.simStage === 'erd') { sc.kiru && sc.kiru.say('Primero el recuperador de energía, junto a las bombas.', 'curioso'); return; }
  if (S.simStage === 'osmora') {
    const r = await sc.open(Sim02, { phase: 'auto', stopAfter: 'auto' });
    if (!r || !r.ok) { sc.kiru && sc.kiru.say('OSMORA ganó esta ronda. Ninguna membrana real sufrió. ¿Otra vez?', 'valiente'); return; }
    GS.lp(2).guardian = true; S.simStage = 'explain';
    const ok = await explain(sc, {
      id: 'lv2_explain', ra: 'RA-02', concepts: ['reverseOsmosis', 'massBalance'],
      prompt: 'OSMORA insistía en subir la presión cada vez que bajaba la producción. ¿Por qué esa estrategia empeora la operación a lo largo del día?',
      options: [
        'Más presión aumenta el flujo y la recuperación: el concentrado se vuelve más salino, crece el riesgo de incrustación y el ensuciamiento se acelera; además se acerca el límite mecánico y sube el consumo de energía.',
        'Más presión destruye más sal en la membrana, y la sal destruida tapa los poros.',
        'Más presión no cambia nada: la producción solo depende de la temperatura.',
        'Más presión reduce el caudal de permeado porque comprime la membrana desde el principio.'],
      key: 0, mis: 'creer que más presión siempre produce una operación mejor',
      why: 'La membrana no destruye la sal: la separa. Si fuerzas más permeado, el concentrado lleva la misma sal en menos agua (Cc sube), aparecen incrustaciones, el flujo alto acelera el ensuciamiento y cada m³ cuesta más energía. La mejor operación sostiene calidad y disponibilidad.',
      whyNot: { 1: 'La sal no se destruye: se conserva y sale con el concentrado (balance de sal).', 2: 'La presión neta (P − π) es la fuerza que impulsa el agua; la temperatura también influye, pero no es lo único.', 3: 'Al principio sí aumenta el permeado; el problema aparece con el tiempo (ensuciamiento, incrustación) y en los límites.' },
    });
    if (ok) S.explained = true;
    const r2 = await sc.open(Sim02, { phase: 'transfer', stopAfter: 'transfer' });
    if (r2 && r2.ok) GS.lp(2).variant = true;
    S.trainBOn = false; S.simDone = true; S.simStage = 'done';
    Codex.unlock('fouling'); Codex.unlock('erd');
    await sc.say([
      ['amaya', 'determined', 'La planta queda estable con dos trenes y el ERD. El tren B se queda aislado hasta cambiar el sello.'],
      ['dante', 'surprised', '(por radio) ¡Amaya! El armario de despacho acaba de cambiar las prioridades solo. Y tiene una firma rara.'],
    ]);
    sc.world.find('cabinet').hidden = false;
    GS.save('cabinet');
    sc.setObjective('Investiga el armario de despacho (LED rosados)', ['¿Quién firmó la orden de despacho?', 'El armario está pasando la zona de limpieza CIP.']);
    return;
  }
  await sc.open(Sim02, { phase: 'free', stopAfter: 'free' });
}
async function erdFlow(sc, st) {
  const S = sc.state;
  if (S.erdDone) { await sc.open(ERDGame, {}); return; }
  const r = await sc.open(ERDGame, {});
  if (!r || !r.ok) { sc.kiru && sc.kiru.say('El rotor perdió el ritmo. Escucha el silbido: cuando el conducto se alinea con el puerto, ¡ahora!', 'valiente'); return; }
  S.erdDone = true; S.erdSync = true; st.done = true; S.simStage = 'osmora';
  LearningModel.record({ kind: 'challenge', id: 'lv2_erd_sync', ra: 'RA-02', concepts: ['reverseOsmosis', 'economics'], solo: 3, correct: true });
  await sc.say([
    ['kiru', 'happy', 'Recuperador sincronizado: el consumo específico baja de ≈ 5,5 a ≈ 2,9 kWh/m³. Energía liberada para operar mejor.'],
    ['operador', 'determined', '(por radio) Ahora sí: subo la presión al máximo y recuperamos lo perdido. ¡OSMORA, allá vamos!'],
    ['amaya', 'worried', '¡Espera, Iván! Déjame probarlo antes en el gemelo, con 24 horas de operación.'],
  ]);
  sc.setObjective('Vence a OSMORA: opera 24 h en el Gemelo de la OI', ['¿Qué indicador anticipa el ensuciamiento?', 'Mira el flujo normalizado y la presión: limpia solo cuando el flujo normalizado cae más de 10 %.', 'Mantén la presión moderada, el antiincrustante activo y limpia una vez cuando lo indique el flujo normalizado.']);
}
async function cabinetClue(sc) {
  await sc.say([
    ['kiru', 'thinking', 'Orden de despacho de las 03:10, dos minutos antes del aislamiento: «priorizar_H2 = 1; reserva_agua = mínimo_modelado». Validación: {p}SAFE_BY_MODEL{/}. No dice SAFE_BY_SENSOR.'],
    ['kiru', 'confundido', 'Firma del módulo: {y}A_S{/}.'],
    ['amaya', 'scared', '…A_S es mi formato de firma. Lo uso desde primer semestre.'],
    ['dante', 'surprised', '¿Tú escribiste esto?'],
    ['amaya', 'angry', '¡No! Yo nunca escribí un despacho para la OI. Alguien copió mi firma. O… usó algo que yo escribí para otra cosa.'],
    ['kiru', 'worried', 'Registro guardado en el tablero de evidencias. Amaya: tu ritmo cardiaco subió 30 %.'],
  ]);
  GS.addClue('signedAS');
  const S = sc.state;
  sc.world.find('solo').hidden = false; sc.world.find('exit').hidden = false;
  sc.setObjective('Abre la Puerta de Evidencia y sigue a los canales de salmuera', ['El concentrado sale hacia los Cañones de Sal: allí se vio a LIMEN.', 'Usa los balances: lo que entra debe salir.']);
  void S;
}
async function finishLevel2(sc) {
  const S = sc.state;
  if (!GS.s.clues.includes('signedAS')) { sc.kiru && sc.kiru.say('Aún no revisamos el armario de despacho.', 'confundido'); return; }
  if (!S.soloDone) { const c = await sc.say([['kiru', 'curioso', 'La Puerta de Evidencia aún no registra tu razonamiento. ¿Seguimos?', { choices: ['Volver a la Puerta de Evidencia', 'Seguir (se puede completar desde el mapa)'] }]]); if (c === 0) return; }
  await completeLevel(sc);
  Game.transition(() => Game.setScene(WorldMapScene, { focus: 3 }));
}
/* ---------------- misiones secundarias ---------------- */
async function sideRemineral(sc) {
  const lp = GS.lp(2);
  if (lp.side.calcite) { await sc.say([['kiru', 'happy', 'Contactor de calcita en servicio: el permeado recupera calcio y alcalinidad antes de llegar a las tuberías.']]); return; }
  await sc.say([['operador', 'neutral', '(por radio) Los vecinos dicen que el agua nueva "no sabe a nada" y en la escuela se están picando las tuberías de cobre. ¿Le subo cloro?']]);
  const c = await sc.say([['amaya', 'thinking', '¿Qué propones para el permeado antes de distribuirlo?', { choices: ['Remineralizar: pasar por calcita para añadir calcio y alcalinidad', 'Mezclar con agua de mar sin tratar para darle sabor', 'Subir el cloro: el problema es microbiológico'] }]]);
  const ok = c === 0;
  LearningModel.record({ kind: 'challenge', id: 'side_agua_sin_sabor', ra: 'RA-02', concepts: ['waterQuality', 'reverseOsmosis'], solo: 3, correct: ok, misconception: ok ? null : 'tratar el permeado como agua lista para cualquier uso' });
  if (ok) { lp.side.calcite = true; Audio2.sfx('success'); GS.trust('community', 6); Codex.unlock('permeado'); await sc.say([['kiru', 'happy', 'El permeado es casi agua destilada: agresivo con metales y pobre en minerales. La calcita lo estabiliza.'], ['operador', 'smile', '(por radio) Abro la válvula del contactor. Mi café también lo agradece.']]); }
  else if (c === 1) await sc.say([['kiru', 'alarmado', 'El agua de mar sin tratar añade sodio y cloruros, no estabilidad. Hay una opción diseñada para esto.']]);
  else await sc.say([['kiru', 'confundido', 'El cloro desinfecta, pero no corrige la corrosividad ni el sabor plano. ¿Qué le falta al permeado?']]);
}
async function sideGauges(sc, st) {
  const lp = GS.lp(2);
  if (lp.side.gauges) { await sc.say([['kiru', 'happy', 'Manómetro recalibrado. Dos instrumentos que discrepan son una invitación a investigar, no a promediar.']]); return; }
  await sc.say([['kiru', 'curioso', 'Dos manómetros en la misma tubería: uno marca 61 bar y el otro 52 bar. El caudal y la potencia de la bomba coinciden con ~60 bar.']]);
  const c = await sc.say([['amaya', 'thinking', '¿Qué hacemos con las dos lecturas?', { choices: ['Contrastar con otras variables (caudal, potencia) y recalibrar el que no cuadra', 'Promediar: 56,5 bar es la mejor estimación', 'Confiar en el más bajo: así no superamos límites'] }]]);
  const ok = c === 0;
  LearningModel.record({ kind: 'challenge', id: 'side_manometro_mentiroso', ra: 'RA-09', concepts: ['steamInquiry', 'reverseOsmosis'], solo: 3, correct: ok, misconception: ok ? null : 'promediar instrumentos sin verificar su coherencia' });
  if (ok) { lp.side.gauges = true; st.done = true; GS.s.sensors++; Audio2.sfx('success'); await sc.say([['kiru', 'happy', 'Redundancia útil: la potencia de la bomba y el caudal confirman ~60 bar. El de 52 bar tenía la membrana del sensor obstruida.']]); }
  else await sc.say([['kiru', 'confundido', 'Si un instrumento está dañado, promediar contamina la estimación. ¿Qué otras variables podrían confirmar la presión real?']]);
}

/* =====================================================================
   Minijuego: Recuperador de energía (intercambiador de presión rotativo)
   ===================================================================== */
const ERDGame = {
  overlay: true,
  enter(p) { this.onDone = p.onDone; this.t = 0; this.a = 0; this.speed = 1.3; this.hits = 0; this.miss = 0; this.beats = 0; this.need = 8; this.total = 12; this.fb = null; this.done = false; this.ps = new Particles(200); this.lastBeat = -1; Audio2.sfx('pump'); },
  update(dt) {
    this.t += dt; this.ps.update(dt);
    if (this.fb) this.fb.t += dt;
    if (this.done) { if (Input.anyConfirm() || Input.pointer.pressed) { Game.pop(); this.onDone && this.onDone({ ok: this.hits >= this.need }); } return; }
    if (Input.pressed('cancel')) { Game.pop(); this.onDone && this.onDone(null); return; }
    this.a += dt * this.speed * (1 + this.hits * 0.04);
    // cada conducto pasa por el puerto de alta presión cada 1/6 de vuelta
    const beat = Math.floor(this.a / (Math.PI / 3));
    if (beat !== this.lastBeat) { if (this.lastBeat >= 0 && !this.hitThis) { this.miss++; this.beats++; this.fb = { ok: false, t: 0 }; } this.lastBeat = beat; this.hitThis = false; }
    const phase = (this.a % (Math.PI / 3)) / (Math.PI / 3);
    const press = Input.pressed('jump') || Input.pressed('interact') || Input.pressed('confirm') || Input.pressed('tool') || Input.pointer.pressed;
    if (press && !this.hitThis) {
      const ok = phase > 0.3 && phase < 0.7;
      this.hitThis = true; this.beats++;
      if (ok) { this.hits++; Audio2.sfx('charge'); this.fb = { ok: true, t: 0 }; this.ps.emit('energy', W / 2 - 80, H / 2, 40, 0, 10, 6); }
      else { this.miss++; Audio2.sfx('error', { vol: 0.4 }); this.fb = { ok: false, t: 0 }; }
    }
    if (this.beats >= this.total) { this.done = true; Audio2.sfx(this.hits >= this.need ? 'success' : 'error'); }
  },
  render(g) {
    fdither(g, 0, 0, W, H, '#05030f', 0.85);
    UIK.panel(g, 40, 20, W - 80, H - 40, 'tech');
    UIK.header(g, 40, 20, W - 80, 'RECUPERADOR DE ENERGÍA · intercambiador de presión', 'tech', 'membrane');
    const cx = W / 2 - 80, cy = H / 2 + 6, R = 70;
    // carcasa
    fdisc(g, cx, cy, R + 8, '#263442'); fdisc(g, cx, cy, R + 5, '#6aa0b4'); fdisc(g, cx, cy, R + 2, '#1d2a48');
    // rotor cerámico con 6 conductos
    for (let k = 0; k < 6; k++) {
      const aa = this.a + k * Math.PI / 3;
      for (let r = 14; r < R - 4; r += 1) { const w = 7; for (let j = -w; j <= w; j++) { const x = cx + Math.cos(aa) * r - Math.sin(aa) * j * 0.6, y = cy + Math.sin(aa) * r + Math.cos(aa) * j * 0.6; fpx(g, x, y, j === -w || j === w ? '#c8a860' : (r < R / 2 ? '#1283bf' : '#8e2a80')); } }
    }
    fdisc(g, cx, cy, 14, '#c8a860'); fdisc(g, cx, cy, 6, '#263442');
    // puerto de alta presión (arriba): salmuera a ~58 bar entra; alimentación sale presurizada
    const px = cx, py = cy - R - 6;
    frect(g, px - 10, py - 20, 20, 16, '#8e2a80'); frect(g, px - 10, py - 20, 20, 2, '#f888b8');
    drawText(g, 'SALMUERA 58 BAR', px, py - 30, { font: 'tiny', align: 'center', color: '#f888b8' });
    Charts.flow(g, [[px + 60, py - 12], [px + 12, py - 12]], 'brine', 1, 3);
    Charts.flow(g, [[cx - R - 50, cy], [cx - R - 6, cy]], 'seawater', 1, 3);
    drawText(g, 'ALIMENTACIÓN 1 BAR', cx - R - 50, cy - 12, { font: 'tiny', color: '#6cf0db' });
    // ventana de sincronización
    const phase = (this.a % (Math.PI / 3)) / (Math.PI / 3);
    const inWin = phase > 0.3 && phase < 0.7;
    frect(g, px - 2, py - 3, 4, 6, inWin ? '#86e36f' : '#ff4e5d');
    // panel derecho
    const X = W / 2 + 30;
    drawTextBlock(g, 'El concentrado sale de las membranas todavía a ~58 bar. El rotor transfiere esa presión al agua de alimentación: menos trabajo para la bomba de alta presión.', X, 52, 220, { color: '#fffaf0' });
    drawTextBlock(g, 'Pulsa {y}Espacio{/} (o clic) cuando un conducto quede alineado con el puerto (luz {g}verde{/}).', X, 130, 220, { color: '#cfd6f0' });
    const eff = this.beats ? this.hits / Math.max(1, this.beats) : 0;
    const sec = lerp(5.5, 2.86, clamp(this.hits / this.need, 0, 1));
    drawText(g, 'Sincronías: ' + this.hits + ' / ' + this.need, X, 176, { color: '#c2f58e' });
    drawText(g, 'Pulsos: ' + this.beats + ' / ' + this.total, X, 188, { color: '#cfd6f0' });
    drawText(g, 'SEC estimado: ' + fmt(sec, 2) + ' kWh/m³', X, 204, { color: '#ffe14d' });
    UIK.bar(g, X, 218, 200, 6, clamp(1 - (sec - 2.86) / 2.64, 0, 1), '#ffe14d');
    drawText(g, 'Eficiencia de sincronía: ' + fmt0(eff * 100) + ' %', X, 230, { font: 'tiny', color: '#a6f4ff' });
    if (this.fb && this.fb.t < 0.4) drawText(g, this.fb.ok ? '¡TRANSFERENCIA!' : 'DESFASE', cx, cy + R + 18, { align: 'center', color: this.fb.ok ? '#86e36f' : '#ff4e5d' });
    this.ps.render(g);
    if (this.done) {
      const ok = this.hits >= this.need;
      UIK.panel(g, 90, H - 92, W - 180, 56, ok ? 'green' : 'alert');
      drawTextBlock(g, ok ? '{g}Recuperador sincronizado.{/} La bomba de alta presión ya no tiene que generar toda la presión: el SEC cae casi a la mitad (supuesto de simulación). Pulsa para continuar.' : '{o}Sincronía insuficiente.{/} Cuando el rotor se desfasa, la salmuera escapa sin entregar su presión. Pulsa para salir y reintentar.', 100, H - 84, W - 200, { color: '#fffaf0' });
    }
  },
};

/* =====================================================================
   Gemelo de ósmosis inversa
   ===================================================================== */
const Sim02 = makeSim({
  title: 'GEMELO DE OI · presión, recuperación y calidad', icon: 'membrane', ra: 'RA-02', concepts: ['reverseOsmosis', 'massBalance'],
  phases: ['demo', 'guided', 'auto', 'transfer', 'free'],
  hintLadder: ['¿Qué fuerza mueve el agua a través de la membrana: la presión aplicada o la presión neta (P − π)?', 'Con 35 g/L la presión osmótica media ronda 35–40 bar en el módulo; por debajo no hay permeado y muy por encima se ensucia rápido.', 'Prueba 58–64 bar con 100 m³/h: recuperación ≈ 40–45 %, conductividad baja y SEC < 3,3 kWh/m³.'],
  init(p) { this.stopAfter = p.stopAfter || 'free'; this.cfg = { P: 50, Qf: 100, anti: true, erd: true }; this.reset(); },
  reset() { this.h = 0; this.foul = 0; this.series = []; this.produced = 0; this.cleanings = []; this.cipT = 0; this.verdict = null; this.running = false; this.errors = 0; this.osmoraT = 0; this.osmoraMsg = null; this.Cf = 35; this.T = 25; this.maxP = 0; },
  params() {
    const tr = this.phase === 'transfer';
    return { P: this.cfg.P, Qf: tr ? 30 : this.cfg.Qf, Cf: tr ? 5 : this.Cf, T: this.T, foul: this.foul, etaERD: this.cfg.erd ? 0.95 : 0, Pmax: tr ? 41 : 82 };
  },
  solve() { const r = ROModel.solve(this.params()); if (this.phase === 'transfer') { r.scaleIdx = (r.R - (this.cfg.anti ? 0.82 : 0.72)) / 0.05; r.alarms = r.alarms.filter(a => a.id !== 'scaling' && a.id !== 'recovery' && a.id !== 'qcmin'); if (r.scaleIdx > 0) r.alarms.push({ id: 'scaling', sev: 2, text: 'Incrustación de sales poco solubles (CaSO₄, sílice)' }); } else if (!this.cfg.anti && r.scaleIdx > -0.4) { r.scaleIdx += 0.4; if (!r.alarms.find(a => a.id === 'scaling')) r.alarms.push({ id: 'scaling', sev: 2, text: 'Riesgo de incrustación (sin antiincrustante)' }); } return r; },
  onPhase(ph) {
    this.reset();
    if (ph === 'demo') { this.cfg.P = 20; this.running = true; this.say('Demostración: con presión baja, el agua tiende a ir hacia el lado salado (ósmosis). Voy a subir la presión poco a poco: mira cuándo aparece el {c}permeado{/}.'); }
    if (ph === 'guided') { this.cfg.P = 50; this.cfg.Qf = 100; this.say('Tu turno: logra ≥ 40 m³/h de permeado, conductividad < 730 µS/cm, SEC ≤ 3,3 kWh/m³ y sin alarmas importantes. Ajusta y pulsa {y}Probar{/}.'); }
    if (ph === 'auto') { this.cfg.P = 60; this.cfg.Qf = 100; this.say('OSMORA: 24 h de operación. El ensuciamiento crece, el agua se calienta al mediodía y la salinidad sube por la tarde. Meta: ≥ 900 m³, sin alarmas críticas, y limpiar solo cuando se justifique.'); }
    if (ph === 'transfer') { this.cfg.P = 15; this.say('Transferencia: el pozo salobre de Los Médanos (5 g/L, 30 m³/h). Diseña presión y antiincrustante ANTES de correr: recuperación ≥ 70 %, sin incrustación, SEC ≤ 1,6 kWh/m³.'); }
    if (ph === 'free') this.say('Laboratorio libre: explora presión, caudal, ERD y antiincrustante.');
  },
  step(dt) {
    if (this.phase === 'demo' && !this.done) {
      this.cfg.P = Math.min(66, this.cfg.P + dt * 5.5);
      if (this.cfg.P > 27 && !this.demo1) { this.demo1 = true; this.say('P ≈ presión osmótica de la alimentación: el agua apenas pasa. La presión neta (P − π) es la que empuja.'); }
      if (this.cfg.P > 45 && !this.demo2) { this.demo2 = true; this.say('Ahora sí hay permeado. La membrana {y}no destruye la sal{/}: la deja en el {p}concentrado{/}, que sale más salado. Mira el balance de sal abajo.'); }
      if (this.cfg.P >= 66 && !this.verdict) this.verdict = { ok: true, txt: 'Observa: Qf = Qp + Qc y la sal que entra (Cf·Qf) sale casi toda en el concentrado (Cc·Qc). Más presión → más permeado… y un concentrado más salino.' };
      return;
    }
    if (this.phase !== 'auto' || !this.running || this.done) return;
    const dh = dt * 0.5 * (Input.down('fast') ? 3 : 1);
    this.h += dh;
    // estación: temperatura al mediodía y salinidad de la tarde
    this.T = 25 + 4 * Math.max(0, Math.sin((this.h - 6) / 12 * Math.PI));
    this.Cf = this.h > 10 ? lerp(35, 37, clamp((this.h - 10) / 4, 0, 1)) : 35;
    if (this.cipT > 0) { this.cipT -= dh; if (this.cipT <= 0) this.foul = ROModel.clean(this.foul); }
    const r = this.solve();
    this.last = r;
    this.maxP = Math.max(this.maxP, this.cfg.P);
    if (this.cipT <= 0) { this.produced += r.Qp * dh; this.foul = clamp(this.foul + ROModel.foulRate(r, 3.2) * dh * 2.2 + 0.004 * dh, 0, 1); }
    const r0 = ROModel.solve(Object.assign(this.params(), { foul: 0 }));
    this.normFlow = r0.Qp > 0 ? r.Qp / r0.Qp : 1;
    if (this.series.length === 0 || this.h - this.series[this.series.length - 1].h > 0.2) this.series.push({ h: this.h, qp: this.cipT > 0 ? 0 : r.Qp, ec: tdsToEC(r.Cp) / 20, p: this.cfg.P, nf: this.normFlow * 50 });
    // OSMORA tienta a subir la presión cuando cae la producción
    this.osmoraT += dh;
    if (this.osmoraT > 2.5 && r.Qp < 40) { this.osmoraT = 0; this.osmoraMsg = { t: 0, text: ['¡MÁS PRESIÓN!', 'Sube, sube, sube…', '¿Producción baja? ¡Presión!', 'Los límites son sugerencias…'][Math.floor(Math.random() * 4)] }; Audio2.sfx('mirage', { vol: 0.25 }); }
    if (this.osmoraMsg) this.osmoraMsg.t += dt;
    // errores seguros
    const crit = r.alarms.find(a => a.sev >= 3);
    if (crit && this.cipT <= 0) {
      this.errors++;
      if (crit.id === 'pmax') { this.safeError('Presión sobre el límite', 'Los recipientes a presión tienen un límite mecánico. Superarlo arriesga sellos y carcasas; la planta se detendría por seguridad.', '¿Qué otra variable puede recuperar producción sin exceder el límite?'); this.onSafeRetry = () => { this.cfg.P = 72; }; }
      else if (crit.id === 'quality') { this.safeError('Permeado fuera de especificación', 'La conductividad del permeado supera el límite: el agua no es apta para consumo ni para cultivos sensibles.', '¿Qué hace subir el paso de sal: temperatura, ensuciamiento o recuperación?'); this.onSafeRetry = () => { this.cfg.P = Math.min(this.cfg.P, 66); }; }
      else if (crit.id === 'scaling') { this.safeError('Incrustación severa', 'Las sales precipitan sobre la membrana. El daño puede ser irreversible si se repite.', '¿Qué reduce el riesgo de incrustación: recuperación, antiincrustante o temperatura?'); this.onSafeRetry = () => { this.cfg.anti = true; this.cfg.P = Math.min(this.cfg.P, 64); }; }
    }
    if (Math.random() < 0.3) this.ps.emit('bubble', 40 + Math.random() * 300, 120, 0, -10, 1);
    if (this.h >= 24) this.evaluate();
  },
  clean() {
    if (this.cipT > 0 || this.phase !== 'auto' || !this.running) return;
    const justified = (this.normFlow ?? 1) < 0.9;
    this.cleanings.push({ h: this.h, justified });
    this.cipT = 2; Audio2.sfx('valve');
    this.say(justified ? 'Limpieza CIP justificada: el flujo normalizado había caído ' + fmt0((1 - this.normFlow) * 100) + ' %. Dos horas sin producir.' : '{o}Limpieza prematura:{/} el flujo normalizado solo había caído ' + fmt0((1 - (this.normFlow ?? 1)) * 100) + ' %. Gastas químicos y dos horas de producción.');
  },
  evaluate() {
    const r = this.solve();
    let ok, txt;
    if (this.phase === 'guided') {
      const ec = tdsToEC(r.Cp);
      ok = r.Qp >= 40 && ec < 730 && r.SEC <= 3.3 && !r.alarms.some(a => a.sev >= 2);
      txt = ok ? 'Operación estable: ' + fmt(r.Qp, 1) + ' m³/h, ' + fmt0(ec) + ' µS/cm, R = ' + fmt0(r.R * 100) + ' %, SEC ' + fmt(r.SEC, 2) + ' kWh/m³.' : r.Qp < 40 ? 'Muy poco permeado: la presión neta es baja. ¿Cuánto supera P a la presión osmótica?' : r.alarms.length ? 'Hay alarmas: ' + r.alarms[0].text + '. Más presión no siempre es mejor.' : r.SEC > 3.3 ? 'Funciona, pero cuesta demasiada energía por m³. ¿Está activo el ERD? ¿Hace falta tanta presión?' : 'Conductividad alta: revisa la presión neta y el caudal.';
      this.evidence('lv2_guided_ro', ok, { solo: 3, misconception: ok ? null : (r.alarms.length ? 'maximizar la presión' : null) });
    } else if (this.phase === 'auto') {
      const unjust = this.cleanings.filter(c => !c.justified).length;
      ok = this.produced >= 900 && this.errors === 0 && this.cleanings.length <= 2 && unjust === 0;
      txt = ok ? '¡OSMORA vencida! ' + fmt0(this.produced) + ' m³ en 24 h, limpiezas justificadas: ' + this.cleanings.length + ', presión máxima ' + fmt0(this.maxP) + ' bar.' : 'Producción ' + fmt0(this.produced) + ' m³ (meta 900), errores ' + this.errors + ', limpiezas ' + this.cleanings.length + ' (injustificadas: ' + unjust + '). ' + (this.maxP > 74 ? 'Subir la presión aceleró el ensuciamiento.' : unjust ? 'Limpia cuando el flujo normalizado cae más de 10 %.' : 'Revisa cuándo conviene limpiar.');
      this.evidence('lv2_guardian_osmora', ok, { solo: 4, misconception: ok ? null : (this.maxP > 74 ? 'creer que más presión siempre produce más' : 'limpiar sin indicadores') });
    } else if (this.phase === 'transfer') {
      ok = r.R >= 0.7 && r.scaleIdx <= 0 && r.SEC <= 1.6 && tdsToEC(r.Cp) < 730 && !r.alarms.some(a => a.sev >= 3);
      txt = ok ? 'Diseño salobre robusto: ' + fmt0(r.P) + ' bar, R = ' + fmt0(r.R * 100) + ' %, SEC ' + fmt(r.SEC, 2) + ' kWh/m³. Con 5 g/L basta mucha menos presión que con agua de mar; el límite lo pone la incrustación.' : r.R < 0.7 ? 'Recuperación ' + fmt0(r.R * 100) + ' %: en agua salobre conviene recuperar más, con menos presión que en agua de mar.' : r.scaleIdx > 0 ? 'Incrustación: a alta recuperación precipitan sales poco solubles. ¿Antiincrustante? ¿Menos recuperación?' : 'Revisa el consumo de energía y la presión máxima.';
      this.evidence('lv2_transfer_salobre', ok, { solo: 5, transfer: true });
    } else { ok = true; txt = 'Datos guardados en tu cuaderno.'; }
    this.verdict = { ok, txt }; this.running = false; this.done = true;
    Audio2.sfx(ok ? 'success' : 'error');
  },
  draw(g) {
    const r = this.last && this.phase === 'auto' ? this.last : this.solve();
    if (this.phase !== 'auto') this.last = r;
    const t = this.t;
    // --- corte del módulo de membrana (izquierda)
    const X0 = 8, Y0 = 28, WW = 380, HH = 196;
    Charts.frame(g, X0, Y0, WW, HH, '#0a1838');
    const fy = Y0 + 34, fh = 54, my = fy + fh, mh = 10, py = my + mh, ph = 40;
    // canal de alimentación → concentrado (sal que aumenta a lo largo)
    for (let x = 0; x < WW - 60; x++) { const k = x / (WW - 60); frect(g, X0 + 30 + x, fy, 1, fh, mixHex('#1063a6', '#621a66', k * clamp(r.R / 0.6, 0, 1))); }
    const nSalt = 90, LW = WW - 60;
    for (let i = 0; i < nSalt; i++) {
      const ph2 = ((t * (0.08 + r.Qf / 1200) + i / nSalt) % 1);
      // la densidad de sal crece hacia la salida (concentración)
      if (hash1(i, 3) > 0.35 + ph2 * clamp(r.R, 0, 0.8)) continue;
      const x = X0 + 30 + ph2 * LW, y = fy + 6 + ((i * 37) % (fh - 12)) + Math.sin(t * 3 + i) * 1.5;
      frect(g, Math.round(x), Math.round(y), 2, 2, ph2 > 0.6 ? '#f888b8' : '#fffaf0');
    }
    // capa de polarización: sal rechazada que se acumula junto a la membrana
    fdither(g, X0 + 30, fy + fh - 6, LW, 6, '#f888b8', clamp(0.1 + r.R * 0.7, 0, 0.6));
    // moléculas de agua que viajan con la alimentación y atraviesan la membrana
    const nW0 = 40;
    for (let i = 0; i < nW0; i++) { const ph2 = ((t * 0.15 + i / nW0) % 1); fpx(g, X0 + 30 + ph2 * LW, fy + 4 + ((i * 53) % (fh - 8)), '#6cf0db'); }
    // membrana: capas, ensuciamiento e incrustación
    for (let x = 0; x < WW - 60; x++) frect(g, X0 + 30 + x, my, 1, mh, (x % 4) < 2 ? '#8d6bff' : '#5a44a8');
    const foulH = Math.round(clamp(this.foul || 0, 0, 1) * 8);
    if (foulH) fdither(g, X0 + 30, my - foulH, WW - 60, foulH, '#7a5a2a', 0.7);
    if (r.scaleIdx > 0) for (let i = 0; i < 40 * clamp(r.scaleIdx, 0, 1.5); i++) frect(g, X0 + 30 + (WW - 60) * (0.5 + (i * 0.618 % 0.5)), my - 2 - (i % 3), 2, 2, '#ffffff');
    // canal de permeado
    frect(g, X0 + 30, py, WW - 60, ph, '#0e2b4a');
    const nW = Math.round(clamp(r.Qp / 2, 0, 34));
    for (let i = 0; i < nW; i++) {
      const ph3 = ((t * 0.7 + i / Math.max(1, nW)) % 1);
      const x = X0 + 40 + ((i * 53) % (WW - 80));
      if (ph3 < 0.5) frect(g, x, Math.round(my - 6 + ph3 * 2 * (mh + 10)), 2, 2, '#a6f4ff');
      else frect(g, Math.round(x + (ph3 - 0.5) * 30), Math.round(py + 4 + (ph3 - 0.5) * 2 * (ph - 10)), 2, 2, '#e6fdff');
    }
    for (let i = 0; i < Math.round(tdsToEC(r.Cp) / 120); i++) fpx(g, X0 + 40 + ((i * 71 + Math.floor(t * 20)) % (WW - 80)), py + 8 + (i * 13) % (ph - 12), '#ffffff');
    Charts.flow(g, [[X0 + WW - 30, py + ph / 2], [X0 + WW - 4, py + ph / 2]], 'permeate', r.Qp / 40, 3);
    Charts.flow(g, [[X0 + 4, fy + fh / 2], [X0 + 30, fy + fh / 2]], 'seawater', r.Qf / 100, 3);
    Charts.flow(g, [[X0 + WW - 30, fy + fh / 2], [X0 + WW - 4, fy + fh / 2]], 'brine', r.Qc / 60, 3);
    drawText(g, 'ALIMENTACIÓN → CONCENTRADO', X0 + 34, fy + 2, { font: 'tiny', color: '#cfe8ee' });
    drawText(g, 'MEMBRANA SEMIPERMEABLE', X0 + WW / 2, my + 2, { font: 'tiny', align: 'center', color: '#fffaf0' });
    drawText(g, 'PERMEADO', X0 + 34, py + ph - 9, { font: 'tiny', color: '#a6f4ff' });
    // flechas de presión: aplicada vs osmótica
    const ax = X0 + 12, base = Y0 + 6;
    const pW = clamp(r.P / 85, 0, 1) * (WW - 40), piW = clamp(r.piAvg / 85, 0, 1) * (WW - 40);
    frect(g, ax, base, pW, 5, '#ffe14d'); drawText(g, 'P aplicada ' + fmt0(r.P) + ' bar', ax + 2, base + 7, { font: 'tiny', color: '#ffe14d' });
    frect(g, ax, base + 16, piW, 3, '#f888b8'); drawText(g, 'π media ' + fmt0(r.piAvg) + ' bar', ax + piW + 4, base + 14, { font: 'tiny', color: '#f888b8' });
    drawText(g, 'Presión neta ≈ ' + fmt(r.NDP, 1) + ' bar', X0 + WW - 6, base + 7, { font: 'tiny', align: 'right', color: r.NDP > 0 ? '#86e36f' : '#ff4e5d' });
    // balances
    const by = Y0 + HH - 30;
    drawText(g, 'Qf = Qp + Qc :  ' + fmt0(r.Qf) + ' = ' + fmt(r.Qp, 1) + ' + ' + fmt(r.Qc, 1) + ' m³/h', X0 + 6, by, { color: '#c2f58e' });
    drawText(g, 'Sal: Cf·Qf = ' + fmt0(r.saltIn) + '  ≈  Cp·Qp + Cc·Qc = ' + fmt0(r.saltOut) + ' kg/h', X0 + 6, by + 12, { color: '#f888b8' });
    // OSMORA (guardián)
    if (this.phase === 'auto') {
      const ox = X0 + WW - 66, oy = Y0 + 44 + Math.sin(t * 2) * 3;
      for (let i = 0; i < 9; i++) { const a = t * 1.5 + i * 0.7; fline(g, ox, oy + 10, ox + Math.cos(a) * 18, oy + 22 + Math.sin(a) * 6, '#5a44a8'); }
      fdisc(g, ox, oy, 13, '#3a2a7a'); fdisc(g, ox, oy - 1, 11, '#8d6bff'); fdisc(g, ox - 3, oy - 4, 4, '#b49cff');
      fdisc(g, ox - 4, oy, 3, '#fffaf0'); fdisc(g, ox + 4, oy, 3, '#fffaf0'); fpx(g, ox - 4, oy, '#ff4e5d'); fpx(g, ox + 4, oy, '#ff4e5d');
      drawText(g, 'OSMORA', ox, oy - 22, { font: 'tiny', align: 'center', color: '#b49cff' });
      if (this.osmoraMsg && this.osmoraMsg.t < 2) drawBubble(g, ox - 30, oy - 26, this.osmoraMsg.text, '#b49cff', this.osmoraMsg.t);
    }
    // --- controles (derecha)
    const CX = 394, CW = W - CX - 6;
    UIK.panel(g, CX, 28, CW, 150, 'tech');
    Gui.begin();
    const lockD = this.phase === 'demo' || (this.phase === 'transfer' && this.done);
    const yy = 34;
    this.cfg.P = Gui.slider(g, 'P', CX + 8, yy, CW - 16, this.cfg.P, this.phase === 'transfer' ? 5 : 20, this.phase === 'transfer' ? 45 : 90, 1, { label: 'Presión de alimentación', unit: 'bar', disabled: lockD, marks: [{ v: this.phase === 'transfer' ? 41 : 82, col: '#ff4e5d' }] });
    if (this.phase !== 'transfer') this.cfg.Qf = Gui.slider(g, 'Q', CX + 8, yy + 24, CW - 16, this.cfg.Qf, 60, 120, 5, { label: 'Caudal de alimentación', unit: 'm³/h', disabled: lockD || this.phase === 'auto' });
    else drawText(g, 'Caudal de alimentación: 30 m³/h · 5 g/L', CX + 8, yy + 28, { font: 'tiny', color: '#cfd6f0' });
    const an = Gui.toggle(g, 'anti', CX + 8, yy + 50, 'Antiincrustante', this.cfg.anti); if (!lockD) this.cfg.anti = an;
    const er = Gui.toggle(g, 'erd', CX + 120, yy + 50, 'ERD', this.cfg.erd); if (!lockD && this.phase !== 'auto') this.cfg.erd = er;
    const ec = tdsToEC(r.Cp);
    const ix = CX + 8;
    drawText(g, 'Permeado Qp: ' + fmt(r.Qp, 1) + ' m³/h   R: ' + fmt0(r.R * 100) + ' %', ix, yy + 70, { font: 'tiny', color: '#a6f4ff' });
    drawText(g, 'Conductividad: ' + fmt0(ec) + ' µS/cm   Cc: ' + fmt(r.Cc, 1) + ' g/L', ix, yy + 79, { font: 'tiny', color: ec > 730 ? '#ff4e5d' : '#86e36f' });
    drawText(g, 'SEC: ' + (isFinite(r.SEC) ? fmt(r.SEC, 2) : '—') + ' kWh/m³   Bombas: ' + fmt0(r.Pel) + ' kW', ix, yy + 88, { font: 'tiny', color: r.SEC > 3.3 ? '#ff9f43' : '#ffe14d' });
    if (this.phase === 'auto') drawText(g, 'Hora ' + fmt(this.h, 1) + '/24 · producido ' + fmt0(this.produced) + ' m³ · flujo norm. ' + fmt0((this.normFlow ?? 1) * 100) + ' %', ix, yy + 97, { font: 'tiny', color: (this.normFlow ?? 1) < 0.9 ? '#ff9f43' : '#c2f58e' });
    // alarmas
    let ay = yy + 108;
    for (const a of r.alarms.slice(0, 2)) { drawText(g, '! ' + a.text, ix, ay, { font: 'tiny', color: a.sev >= 3 ? '#ff4e5d' : '#ffb93b' }); ay += 8; }
    // botones
    const bty = 160;
    if (this.phase === 'guided' && !this.verdict && Gui.button(g, 'try', CX + 8, bty, 80, 16, 'Probar', { style: 'good', icon: 'play' })) this.evaluate();
    if (this.phase === 'transfer' && !this.verdict && Gui.button(g, 'run', CX + 8, bty, 100, 16, 'Correr diseño', { style: 'good', icon: 'play' })) this.evaluate();
    if (this.phase === 'auto' && !this.running && !this.done && Gui.button(g, 'start', CX + 8, bty, 80, 16, 'Iniciar', { style: 'good', icon: 'play' })) this.running = true;
    if (this.phase === 'auto' && this.running && Gui.button(g, 'cip', CX + 8, bty, 96, 16, this.cipT > 0 ? 'Limpiando…' : 'Limpieza CIP', { style: 'gold', icon: 'reset', disabled: this.cipT > 0 })) this.clean();
    if (Gui.button(g, 'hintb', CX + CW - 60, bty, 54, 16, 'Pista', { style: 'ghost', icon: 'hint', disabled: this.phase === 'auto' })) this.hint();
    // gráfico temporal (auto) o curva P–Qp (resto)
    if (this.phase === 'auto') {
      const S = this.series.length ? this.series : [{ h: 0, qp: 0, ec: 0, p: 60, nf: 50 }];
      Charts.line(g, CX, 182, CW, 110, [
        { data: S.map(s => [s.h, s.qp]), color: '#56e5ff', label: 'Qp m³/h' },
        { data: S.map(s => [s.h, s.nf]), color: '#86e36f', label: 'flujo norm.' },
        { data: S.map(s => [s.h, s.p]), color: '#ffe14d', label: 'P bar' },
      ], { xMin: 0, xMax: 24, yMin: 0, yMax: 90, legend: true, xLabel: 'h', cursor: this.h, bands: this.cleanings.map(c => ({ x0: c.h, x1: c.h + 2, color: '#ff9f43', level: 0.25 })) });
    } else {
      const pts = [], ecs = [];
      for (let P = (this.phase === 'transfer' ? 5 : 20); P <= (this.phase === 'transfer' ? 45 : 90); P += 2) { const rr = ROModel.solve(Object.assign(this.params(), { P })); pts.push([P, rr.Qp * (this.phase === 'transfer' ? 2 : 1)]); ecs.push([P, Math.min(100, tdsToEC(rr.Cp) / 15)]); }
      Charts.line(g, CX, 182, CW, 110, [{ data: pts, color: '#56e5ff', label: this.phase === 'transfer' ? 'Qp×2' : 'Qp m³/h' }, { data: ecs, color: '#ff9a8a', label: 'cond./15' }], { xMin: this.phase === 'transfer' ? 5 : 20, xMax: this.phase === 'transfer' ? 45 : 90, yMin: 0, yMax: 100, legend: true, xLabel: 'bar', cursor: this.cfg.P });
    }
    // veredicto
    if (this.verdict) {
      const v = this.verdict;
      const vh = textHeight(v.txt, 360) + 30;
      UIK.panel(g, 10, H - vh - 8, 376, vh, v.ok ? 'green' : 'alert');
      drawTextBlock(g, v.txt, 18, H - vh - 2, 360, { color: '#fffaf0' });
      if (v.ok) { if (Gui.button(g, 'nxt', 280, H - 28, 100, 16, this.phase === this.stopAfter ? 'Terminar' : 'Continuar', { style: 'good', icon: 'play' })) { if (this.phase === this.stopAfter) this.finish(true); else this.nextPhase(); } }
      else if (Gui.button(g, 'rt', 280, H - 28, 100, 16, 'Reintentar', { style: 'gold', icon: 'reset' })) { this.attempts++; GS.s.stats.retries++; if (this.phase === 'auto') this.onPhase(this.phase); else { this.verdict = null; this.done = false; } }
    }
    Gui.end();
  },
});
