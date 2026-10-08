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
  platforms: [{ x: 1960, y: 212, w: 220, type: 'metal' }, { x: 640, y: 248, w: 60, type: 'metal' }, { x: 1500, y: 244, w: 80, type: 'metal' }],
  ladders: [{ x: 1970, y0: 212, y1: 290 }],
  cam: { look: 50, vy: 0.66 },
  /* ---------------- accesorios estáticos ---------------- */
  props(pb, world) {
    const gy = 290;
    drawSign(pb, 90, gy, 'CIUDADELA H2', '#20d6c7');
    // planta de agua ultrapura: segundo paso de OI + electrodesionización
    ART.roRack(pb, 200, gy, 3, true, { tubeW: 70 });
    for (let k = 0; k < 3; k++) { pb.rect(320 + k * 26, gy - 60, 20, 60, '#e8f0f4'); pb.rect(320 + k * 26, gy - 60, 20, 3, '#56e5ff'); for (let j = 0; j < 8; j++) pb.hline(322 + k * 26, 337 + k * 26, gy - 54 + j * 6, '#a9bbd6'); }
    ART.tank(pb, 410, gy, 30, 64, RAMP.steelW, { band: '#56e5ff', label: true, ladder: true });
    drawSign(pb, 330, gy - 62, 'AGUA ULTRAPURA', '#1491aa');
    ART.pipe(pb, 440, gy - 20, 760, gy - 20, 2, 'water');
    // nave de stacks (tres electrolizadores grandes)
    for (let k = 0; k < 3; k++) ART.electrolyzer(pb, 780 + k * 150, gy, 120, 90);
    drawSign(pb, 1000, gy - 104, 'NAVE DE ELECTROLIZADORES', '#86e36f');
    ART.pipe(pb, 760, gy - 70, 1260, gy - 70, 2, 'h2');
    // compresión y esferas de almacenamiento
    for (let k = 0; k < 2; k++) { pb.rect(1300 + k * 50, gy - 40, 40, 40, '#c8d8e8'); pb.rect(1300 + k * 50, gy - 40, 40, 3, '#ffb93b'); pb.ellipse(1320 + k * 50, gy - 20, 10, 10, '#477a94'); }
    for (let k = 0; k < 3; k++) {
      const cx = 1460 + k * 90, cy = gy - 52, R = 34;
      pb.rect(cx - 30, gy - 30, 4, 30, '#477a94'); pb.rect(cx + 26, gy - 30, 4, 30, '#477a94'); pb.rect(cx - 2, gy - 22, 4, 22, '#345a78');
      for (let yy = -R; yy <= R; yy++) for (let xx = -R; xx <= R; xx++) {
        const d2 = xx * xx + yy * yy; if (d2 > R * R) continue;
        const l = (-(xx) * 0.6 - yy * 0.8) / R + Math.sqrt(Math.max(0, 1 - d2 / (R * R))) * 0.4;
        const c = l > 0.75 ? '#ffffff' : l > 0.35 ? '#eef6fa' : l > 0 ? '#c8d8e8' : l > -0.35 ? '#a9bbd6' : '#8396ba';
        pb.set(cx + xx, cy + yy, (Math.abs(yy - 2) < 2) ? (l > 0 ? '#40d0d4' : '#22a2b2') : c);
      }
      pb.ellipseOutline(cx, cy, R, R, '#5b6f96');
    }
    drawSign(pb, 1550, gy - 92, 'ALMACENAMIENTO H2', '#22a2b2');
    // zona de seguridad con franjas ámbar y sala de control
    for (let x = 760; x < 1260; x++) { pb.set(x, gy + 2, ((x >> 3) & 1) ? '#ffb93b' : '#263442'); }
    const sx = 1960;
    pb.rect(sx, 130, 220, 82, '#101c4c'); pb.rect(sx, 130, 220, 3, '#ffb93b'); pb.rect(sx + 216, 130, 4, 82, '#05081d');
    for (let k = 0; k < 3; k++) { pb.rect(sx + 12 + k * 68, 142, 56, 30, '#05081d'); pb.rect(sx + 12 + k * 68, 142, 56, 2, '#56e5ff'); }
    drawSign(pb, sx + 110, 130, 'CONTROL DE SEGURIDAD', '#ffb93b');
    // pasillo al núcleo (puerta sellada lejana)
    pb.rect(2400, 150, 200, 140, '#0a1236'); pb.rect(2404, 154, 192, 136, '#05081d');
    for (let k = 0; k < 6; k++) pb.rect(2420 + k * 28, 170, 16, 100, '#101c4c');
    drawSign(pb, 2500, 150, 'HACIA EL NÚCLEO · OASIS', '#86e36f');
  },
  /* ---------------- dinámico ---------------- */
  renderMid(g, sc, cam) {
    const S = sc.state, t = Game.time, ox = cam.x, oy = cam.y, gy = 290 - oy;
    // burbujas de H2/O2 en los stacks activos
    for (let k = 0; k < 3; k++) {
      const x = 780 + k * 150 - ox; if (x < -140 || x > W + 20) continue;
      const on = S.stacks > k && !S.leak;
      if (on) { drawGasBubbles(g, x + 10, gy - 8, 56, 40, t + k, 1.2); drawGasBubbles(g, x + 82, gy - 60, 10, 30, t + k * 0.7, 1.0); }
      frect(g, x + 8, gy - 70, 4, 3, on ? '#86e36f' : (S.leak && k === 1 ? ((Math.floor(t * 6) % 2) ? '#ff4e5d' : '#ffb93b') : '#3a3a4a'));
    }
    // flujo de agua ultrapura y de H2
    Charts.flow(g, [[440 - ox, gy - 20], [760 - ox, gy - 20]], 'water', S.waterReady ? 1 : 0.2, 2);
    Charts.flow(g, [[760 - ox, gy - 70], [1260 - ox, gy - 70]], 'h2', S.stacks && !S.leak ? 1 : 0, 2);
    // fuga simulada: llama invisible (solo se ve con la cámara térmica)
    if (S.leak) {
      const lx = 950 - ox, ly = gy - 40;
      if (S.thermal) { for (let i = 0; i < 30; i++) { const a = Math.random() * 0.8 - 0.4, r = Math.random() * 18; fpx(g, lx + Math.sin(a) * r, ly - Math.cos(a) * r, ['#ffe14d', '#ff9f43', '#ff4e5d', '#ffffff'][i % 4]); } }
      else if (Math.random() < 0.3) fpx(g, lx + (Math.random() - 0.5) * 6, ly - Math.random() * 10, '#c6d8ff');
      // luces de alarma ámbar
      if ((Math.floor(t * 3) % 2) === 0) { fdither(g, 760 - ox, 150 - oy, 500, 140, '#ffb93b', 0.08); }
    }
    // escudo cristalino de LIMEN protegiendo al equipo
    if (S.shield > 0) { const sx = S.shieldX - ox, sy = gy - 40; for (let a = 0; a < 40; a++) { const an = a / 40 * Math.PI; fpx(g, sx + Math.cos(an) * 46, sy - Math.sin(an) * 40, (a + Math.floor(t * 10)) % 3 ? '#7ee8f0' : '#ffffff'); } fdither(g, sx - 44, sy - 40, 88, 40, '#c4fbff', 0.12 * S.shield); }
    // pantallas de seguridad
    for (let k = 0; k < 3; k++) { const x = 1972 + k * 68 - ox, y = 142 - oy; for (let i = 0; i < 5; i++) frect(g, x + 4, y + 4 + i * 5, 6 + ((i * 9 + Math.floor(t * 3) + k) % 40), 1, S.leak ? '#ffb93b' : '#56e5ff'); }
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
    sc.station({ id: 'upw', x: 410, kind: 'valve', label: 'Preparar agua ultrapura', glow: '#56e5ff', onUse: async (sc2, st) => prepareWater(sc2, st) });
    sc.station({ id: 'h2Sim', x: 1260, kind: 'sim', label: 'Sincronizador H2', glow: '#86e36f', hidden: true, onUse: async (sc2, st) => h2Flow(sc2, st) });
    sc.station({ id: 'record', x: 2140, y: 212, kind: 'clue', label: 'Grabación de la Dra. Rojas', glow: '#b49cff', hidden: true, onUse: async (sc2, st) => { st.done = true; await elianaRecording(sc2); } });
    sc.station({ id: 'solo', x: 2300, kind: 'solo', label: 'Puerta de Evidencia', glow: '#b49cff', hidden: true, onUse: async (sc2, st) => {
      const r = await sc2.open(SOLOScene, { ctx: 'RA-06-C1' });
      st.progress = r.correct; if (r.correct >= 3) { st.done = true; GS.lp(7).solo = true; S.soloDone = true; Codex.unlock('h2_verde'); }
    } });
    sc.station({ id: 'exit', x: 2500, kind: 'clue', label: 'Ir al Oasis de las Raíces', glow: '#ffe14d', hidden: true, onUse: async (sc2) => finishLevel7(sc2) });
    sc.setObjective('Prepara el agua ultrapura para los electrolizadores', ['¿Puede un electrolizador usar agua de mar o permeado directamente?', 'La planta de agua ultrapura está a la derecha de Naira.']);
    Codex.unlock('electrolisis');
    if (p.checkpoint === 'hall') { S.waterReady = true; sc.world.find('h2Sim').hidden = false; sc.setObjective('Opera el Sincronizador H2', []); }
    if (p.checkpoint === 'safety') { Object.assign(S, { waterReady: true, h2Stage: 'record' }); GS.giveTool('sincro', true); sc.world.find('record').hidden = false; sc.setObjective('Escucha la grabación en el control de seguridad', []); }
  },
  update(sc, dt) {
    const S = sc.state;
    if (S.shield > 0 && !S.leak) S.shield = Math.max(0, S.shield - dt * 0.3);
    if (Math.random() < 0.06) sc.world.ps.emit('vapor', 780 + Math.random() * 420, 230, 0, -12, 1);
  },
  triggers: [
    { x: 500, w: 40, run: (sc) => { sc.kiru && sc.kiru.say('Greenwash Phantoms: pegan la etiqueta "verde" sin mirar la electricidad. Corrígelos con {y}Q{/}.', 'alarmado', 4); } },
  ],
};

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
