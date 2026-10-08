/* =====================================================================
   44_lv04.js — NIVEL 04: LAS DUNAS FOTÓNICAS
   Campo fotovoltaico sobre dunas estabilizadas y talleres de mantenimiento.
   RA-04 · Relé Solar · Guardián: El Espejismo de Mediodía
   MIRAGE habla por primera vez.
   ===================================================================== */

const PV_STRINGS = [
  { id: 's1', x: 380, soil: 0.06, crust: 0, shade: 0 },
  { id: 's2', x: 520, soil: 0.22, crust: 0, shade: 0 },
  { id: 's3', x: 660, soil: 0.10, crust: 0, shade: 0.45 },
  { id: 's4', x: 800, soil: 0.12, crust: 0.25, shade: 0 },
  { id: 's5', x: 940, soil: 0.08, crust: 0, shade: 0 },
  { id: 's6', x: 1080, soil: 0.20, crust: 0, shade: 0 },
];
const PV_KWP = 1000;

LEVELS[4] = {
  id: 4, title: 'Las Dunas Fotónicas', chapter: 'CAPÍTULO 04', biome: 'pvdunes', music: 'dunes', width: 2800, height: 360,
  ambience: { wind: 0.45, birds: 0.15, hum: 0.2 },
  portraits: ['amaya', 'kiru', 'naira', 'dante', 'cobre', 'mirage'],
  spawn: { x: 60, y: 286 },
  checkpoints: { dispatch: { x: 2160, y: 270 } },
  ground: [[0, 286], [200, 280], [340, 288], [1160, 288], [1220, 282], [1520, 282], [1600, 266], [1760, 258], [1900, 270], [2100, 270], [2300, 262], [2560, 256], [2800, 250]],
  terrain: [{ x0: 0, x1: 340, mat: 'dune' }, { x0: 340, x1: 1160, mat: 'sand' }, { x0: 1160, x1: 1520, mat: 'stone' }, { x0: 1520, x1: 2800, mat: 'dune' }],
  platforms: [
    { x: 1610, y: 236, w: 84, type: 'metal' }, { x: 1720, y: 214, w: 84, type: 'metal' }, { x: 1830, y: 230, w: 84, type: 'metal' },
    { x: 1270, y: 236, w: 60, type: 'metal' },
  ],
  cam: { look: 50, vy: 0.66 },
  /* ---------------- accesorios estáticos ---------------- */
  props(pb, world) {
    const gy = (x) => world.groundAt(x);
    for (let x = 20; x < 320; x += 30) ART.grass(pb, x, gy(x), 3, x, RAMP.leaf);
    drawSign(pb, 240, gy(240), 'CAMPO SOLAR 1 MWp', '#c8861a');
    // hileras FV por string (con suciedad, costras y sombra)
    for (const s of PV_STRINGS) {
      const y = gy(s.x) - 6;
      for (let k = 0; k < 2; k++) ART.pvRow(pb, s.x - 60 + k * 64, y, 58, s.x + k, { tilt: 9, depth: 12, soil: s.soil + s.crust });
      // caja de string
      pb.rect(s.x + 66, y - 20, 10, 14, '#e8f0f4'); pb.rect(s.x + 66, y - 20, 10, 2, '#1491aa'); pb.set(s.x + 70, y - 15, '#86e36f');
      if (s.crust) for (let i = 0; i < 18; i++) pb.set(s.x - 50 + i * 6, y - 5 - (i % 4) * 2, '#fffaf0');
      if (s.shade) { // lona arrastrada por el viento sobre la hilera
        pb.poly([[s.x - 40, y - 14], [s.x + 4, y - 18], [s.x + 10, y - 2], [s.x - 30, y]], '#c8861a');
        pb.line(s.x - 40, y - 14, s.x + 4, y - 18, '#ffe14d'); pb.set(s.x - 14, y - 10, '#8a5a1a');
      }
    }
    // taller de mantenimiento con inversores
    const tx = 1180;
    pb.rect(tx, 200, 320, 82, '#f2e2c4'); pb.rect(tx, 200, 320, 5, '#c9622e'); pb.rect(tx + 314, 200, 6, 82, '#d8bc96');
    ART.pvRow(pb, tx + 10, 198, 300, 8, { tilt: 5, depth: 6 });
    for (let k = 0; k < 4; k++) { const ix = tx + 20 + k * 44; pb.rect(ix, 236, 30, 46, '#e8f0f4'); pb.rect(ix, 236, 30, 3, '#1491aa'); pb.rect(ix + 4, 244, 22, 10, '#102a43'); for (let j = 0; j < 4; j++) pb.hline(ix + 4, ix + 25, 258 + j * 4, '#a9bbd6'); }
    pb.rect(tx + 200, 226, 50, 56, '#3a2018'); pb.rect(tx + 204, 230, 42, 52, '#5a3424');
    drawSign(pb, tx + 160, 200, 'TALLER · INVERSORES', '#c9622e');
    // robot de limpieza en seco
    pb.rect(tx + 270, 268, 26, 10, '#ffe14d'); pb.rect(tx + 270, 268, 26, 2, '#fff09a'); pb.disc(tx + 274, 279, 3, '#263442'); pb.disc(tx + 292, 279, 3, '#263442'); pb.rect(tx + 266, 262, 34, 4, '#20d6c7');
    // hileras en las crestas (pasarelas)
    for (const [x, y] of [[1610, 236], [1720, 214], [1830, 230]]) ART.pvRow(pb, x, y - 1, 82, x, { tilt: 8, depth: 10 });
    // contenedores de baterías y subestación
    ART.batteryContainer(pb, 1940, gy(1940), 70, 34, { col: '#2c63c0' }); ART.batteryContainer(pb, 2016, gy(2016), 70, 34, { col: '#2c63c0' });
    for (let k = 0; k < 3; k++) { pb.rect(2100 + k * 12, gy(2100) - 30, 4, 30, '#98c6d2'); pb.rect(2096 + k * 12, gy(2100) - 30, 12, 3, '#cfe8ee'); }
    // quiosco de despacho
    const kx = 2180;
    pb.rect(kx, gy(kx) - 70, 90, 70, '#e8f0f4'); pb.rect(kx, gy(kx) - 70, 90, 4, '#8d6bff'); pb.rect(kx + 86, gy(kx) - 70, 4, 70, '#a9bbd6');
    pb.rect(kx + 10, gy(kx) - 58, 70, 30, '#0a1030'); pb.rect(kx + 10, gy(kx) - 58, 70, 2, '#6aa0b4');
    drawSign(pb, kx + 45, gy(kx) - 70, 'DESPACHO SOLAR', '#8d6bff');
    for (let x = 2320; x < 2800; x += 40) { const k = (x * 3) % 5; if (k < 2) ART.cactus(pb, x, gy(x) + 1, 20 + k * 6, x); else if (k < 4) ART.agave(pb, x, gy(x), 8); }
    drawSign(pb, 2740, gy(2740), 'TORRES DE BRISA', '#7ccaf4');
  },
  propsFront(pb, world) { for (let x = 0; x < 340; x += 6) if ((x * 7) % 4 === 0) ART.grass(pb, x, world.groundAt(x) + 2, 2, x, RAMP.leaf); },
  /* ---------------- dinámico ---------------- */
  renderMid(g, sc, cam) {
    const S = sc.state, t = Game.time, ox = cam.x, oy = cam.y, w = sc.world;
    const gy = (x) => w.groundAt(x) - oy;
    // sombras de nubes reales sobre las hileras (reducen la potencia)
    for (const s of PV_STRINGS) {
      const sh = sc.backdrop.cloudShadowAt(s.x);
      s.cloud = sh;
      if (sh > 0.05) fdither(g, s.x - 62 - ox, gy(s.x) - 20, 128, 16, '#3a2a5a', sh * 0.45);
      // destellos del sol en módulos limpios
      if (sh < 0.2 && !S.dirty?.[s.id] && ((Math.floor(t * 2) + s.x) % 7) === 0) fpx(g, s.x - 40 + ((t * 40) % 100) - ox, gy(s.x) - 15, '#ffffff');
      // indicador de corriente en la caja
      const I = this.stringCurrent(s, S);
      frect(g, s.x + 68 - ox, gy(s.x) - 24, 6, 2, I > 0.8 ? '#86e36f' : I > 0.55 ? '#ffe14d' : '#ff4e5d');
    }
    // robot de limpieza en movimiento
    if (S.robotX != null) { const rx = S.robotX - ox, ry = gy(S.robotX) - 10; frect(g, rx, ry, 20, 6, '#ffe14d'); frect(g, rx - 2, ry - 3, 24, 3, '#20d6c7'); for (let i = 0; i < 4; i++) fpx(g, rx + Math.random() * 20, ry - 4 - Math.random() * 4, '#f2c14e'); }
    // SOC de las baterías y estado del despacho
    drawSOCStrip(g, 1948 - ox, gy(1940) - 42, 56, S.soc ?? 0.62, t, 1);
    drawSOCStrip(g, 2024 - ox, gy(2016) - 42, 56, S.soc ?? 0.62, t, 1);
    const kx = 2190 - ox, ky = gy(2180) - 56;
    if (S.mirageScreen) { for (let i = 0; i < 6; i++) frect(g, kx + 2 + ((i * 11 + Math.floor(t * 20)) % 60), ky + 2 + i * 4, 8, 1, (i % 2) ? '#f27ee6' : '#56e5ff'); drawText(g, 'PICO ★', kx + 34, ky + 10, { font: 'tiny', align: 'center', color: '#ffe14d' }); }
    else { drawText(g, fmt0(this.fieldPower(S, sc)) + ' kW', kx + 34, ky + 10, { font: 'tiny', align: 'center', color: '#ffe14d' }); }
  },
  /** corriente relativa del string (0..1) por suciedad, costra, sombra y nubes */
  stringCurrent(s, S) { const st = (S.strings || {})[s.id] || s; return (1 - st.soil) * (1 - st.crust) * (1 - st.shade) * (1 - (s.cloud || 0) * 0.7); },
  fieldPower(S, sc) { let p = 0; for (const s of PV_STRINGS) p += this.stringCurrent(s, S) * PV_KWP / PV_STRINGS.length * 0.82; return p; },
  lens(g, sc, cam, k) {
    const ox = cam.x, oy = cam.y, S = sc.state, w = sc.world;
    lensBoundary(g, 300 - ox, 220 - oy, 860, 80, '#ffe14d', 'LÍMITE: CAMPO FV (6 STRINGS)');
    for (const s of PV_STRINGS) { const I = this.stringCurrent(s, S); lensTag(g, s.x - 50 - ox, w.groundAt(s.x) - 44 - oy, 'I ' + fmt0(I * 100) + ' %', I > 0.8 ? '#86e36f' : '#ff9a8a', 'sun'); }
    lensTag(g, 1200 - ox, 180 - oy, 'Potencia ahora: ' + fmt0(this.fieldPower(S, sc)) + ' kW (ritmo)', '#ffe14d', 'bolt');
    lensTag(g, 1200 - ox, 192 - oy, 'Energía = potencia × tiempo (kWh)', '#a6f4ff', 'chart');
    lensTag(g, 1950 - ox, 200 - oy, 'BESS 1200 kWh / 300 kW', '#86e36f', 'battery');
  },
  hud(g, sc) {
    const S = sc.state;
    if (!S.hud) return;
    const P = this.fieldPower(S, sc);
    hudGauges(g, [
      { icon: 'sun', label: 'POTENCIA FV', value: fmt0(P) + ' kW', frac: P / 820, color: '#ffe14d' },
      { icon: 'water', label: 'AGUA LIMPIEZA', value: fmt0(S.water ?? 150) + ' L', frac: (S.water ?? 150) / 150, color: '#56e5ff' },
      { icon: 'thermo', label: 'MÓDULOS', value: fmt0(S.tmod ?? 58) + ' °C', frac: (S.tmod ?? 58) / 80, color: '#ff9f43' },
    ]);
  },
  /* ---------------- guion ---------------- */
  setup(sc, p) {
    const S = sc.state;
    S.strings = {}; for (const s of PV_STRINGS) S.strings[s.id] = { soil: s.soil, crust: s.crust, shade: s.shade, scanned: false, cleaned: false };
    Object.assign(S, { hud: true, water: 150, soc: 0.62, tmod: 58, robotX: null });
    const cobre = sc.actor('cobre', 'cobre', 1300, { facing: -1, restAnim: 'repair' });
    const naira = sc.actor('naira', 'naira', 2120, { facing: 1 });
    const dante = sc.actor('dante', 'dante', 300, { facing: 1 });
    const mirage = sc.actor('mirage', 'mirage', 2240, { fly: true, y: 200, hidden: true, talkable: false });
    sc.world.add(new Pickup({ kind: 'echo', x: 1762, y: 186, onPick: () => kiruEcho(sc, 'l4a', 'KIRU: "Un vivero de plántulas. Picos de agua cada martes. ¿Por qué recuerdo un horario que nadie me enseñó?"') }));
    sc.world.add(new Pickup({ kind: 'echo', x: 2480, y: 220, onPick: () => kiruEcho(sc, 'l4b', 'KIRU: "Archivo: rutas_trashumancia.csv… 0 bytes. Alguien vació un archivo con forma de camino."') }));
    for (const [x, y] of [[700, 250], [1000, 250], [1700, 190]]) sc.world.add(new Adversary({ type: 'peak', x, y, range: 40, speed: 24 }));
    dante.onTalk = async (sc2) => { await sc2.say([['dante', 'joy', '¡Un megavatio pico! Si los paneles fueran gente, esto sería un concierto.'], ['dante', 'thinking', 'Ojo: algunas hileras rinden menos. Polvo, una lona que voló, quizá costras. El Barrido Sensorial lee la corriente de cada caja de string.']]); };
    cobre.onTalk = async (sc2) => sideHotInverter(sc2);
    naira.onTalk = async (sc2) => { await sc2.say([['naira', 'calm', S.mirageMet ? '¿Mínimos de quién, Amaya? Esa es la pregunta que me quita el sueño.' : 'El tanque de la ciudad baja todas las noches desde que cambiaron el despacho. Pregúntale a la pantalla por qué.']]); };
    for (const s of PV_STRINGS) sc.station({ id: 'str_' + s.id, x: s.x + 71, kind: 'sensor', label: 'Caja de string ' + s.id.toUpperCase(), glow: '#ffe14d', scan: (sc2) => scanString(sc2, s), onUse: async (sc2) => serviceString(sc2, s) });
    sc.station({ id: 'pvSim', x: 2225, kind: 'sim', label: 'Despacho solar', glow: '#8d6bff', hidden: true, onUse: async (sc2, st) => solarFlow(sc2, st) });
    sc.station({ id: 'solo', x: 2420, kind: 'solo', label: 'Puerta de Evidencia', glow: '#b49cff', hidden: true, onUse: async (sc2, st) => {
      const r = await sc2.open(SOLOScene, { ctx: 'RA-04-C1' });
      st.progress = r.correct; if (r.correct >= 3) { st.done = true; GS.lp(4).solo = true; S.soloDone = true; Codex.unlock('derating'); }
    } });
    sc.station({ id: 'exit', x: 2760, kind: 'clue', label: 'Ir a las Torres de Brisa', glow: '#ffe14d', hidden: true, onUse: async (sc2) => finishLevel4(sc2) });
    sc.setObjective('Revisa los strings del campo solar (Q junto a las cajas)', ['¿Por qué unas hileras rinden menos que otras?', 'Usa el Barrido Sensorial (Q) junto a cada caja de string para leer su corriente.', 'Revisa al menos las 6 cajas y mantén las que rinden menos.']);
    Codex.unlock('irradiancia');
    if (p.checkpoint === 'dispatch') { S.maintDone = true; sc.world.find('pvSim').hidden = false; sc.setObjective('Revisa el despacho solar en el quiosco', []); }
  },
  update(sc, dt) {
    const S = sc.state;
    S.tmod = 56 + Math.sin(Game.time * 0.1) * 3;
    if (S.robotX != null) { S.robotX += dt * 40; if (S.robotX > S.robotTo) S.robotX = null; }
    if (!S.maintDone) {
      const done = PV_STRINGS.every(s => { const st = S.strings[s.id]; return st.scanned && st.shade === 0 && st.crust === 0 && st.soil < 0.1; });
      if (done) { S.maintDone = true; sc.run(() => maintenanceDone(sc)); }
    }
    if (Math.random() < 0.25) sc.world.ps.emit('sand', sc.cam.x - 10, sc.cam.y + 220 + Math.random() * 80, 80, -6, 1);
  },
  triggers: [
    { x: 330, w: 40, run: (sc) => { sc.kiru && sc.kiru.say('¡Esos destellos son Peak Sprites! Confunden potencia con energía. Corrígelos con {y}Q{/}.', 'alarmado', 4); } },
  ],
};

/* ---------------- mantenimiento del campo ---------------- */
function scanString(sc, s) {
  const S = sc.state, st = S.strings[s.id];
  st.scanned = true; Audio2.sfx('sample');
  const I = LEVELS[4].stringCurrent(s, S);
  const why = st.shade ? 'sombra parcial (una lona sobre los módulos)' : st.crust ? 'costras de excremento de aves' : st.soil > 0.15 ? 'polvo acumulado' : st.soil > 0.09 ? 'algo de polvo' : 'limpio';
  sc.kiru && sc.kiru.say('String ' + s.id.toUpperCase() + ': ' + fmt0(I * 100) + ' % de la corriente de referencia → ' + why + '.', I > 0.85 ? 'alegre' : 'curioso', 4);
  if (st.shade && !S.shadeHint) { S.shadeHint = true; Codex.unlock('derating'); }
}
async function serviceString(sc, s) {
  const S = sc.state, st = S.strings[s.id];
  if (!st.scanned) { sc.kiru && sc.kiru.say('Primero mide con {y}Q{/}: no limpies a ciegas.', 'curioso'); return; }
  if (st.shade) { st.shade = 0; Audio2.sfx('confirm'); await sc.say([['amaya', 'determined', 'Retiro la lona. Una sombra pequeña sobre unas pocas celdas tumba la corriente de toda la cadena.'], ['kiru', 'happy', 'Las celdas en serie son como un acueducto: el tramo más estrecho limita todo el caudal.']]); return; }
  if (st.crust === 0 && st.soil < 0.1) { await sc.say([['kiru', 'happy', 'Este string está bien. Limpiarlo gastaría recursos sin ganancia.']]); return; }
  const opts = ['Cepillo robot en seco (0 L)', 'Lavado con agua (40 L)', 'Dejarlo así'];
  const c = await sc.say([['amaya', 'thinking', 'Agua disponible para limpieza: ' + fmt0(S.water) + ' L. ¿Cómo limpio el string ' + s.id.toUpperCase() + '?', { choices: opts }]]);
  if (c === 0) {
    S.robotX = s.x - 70; S.robotTo = s.x + 60; Audio2.sfx('pump', { vol: 0.4 });
    st.soil = Math.min(st.soil, 0.04);
    if (st.crust) await sc.say([['kiru', 'confundido', 'El cepillo quitó el polvo suelto, pero las costras siguen pegadas. Para eso sí hace falta un poco de agua.']]);
    else await sc.say([['kiru', 'happy', 'Polvo fuera, sin gastar ni una gota. En zona árida, el agua de limpieza también es agua.']]);
  } else if (c === 1) {
    if (S.water < 40) { S.water += 40; await sc.say([['cobre', 'worried', '(por radio) Les mando 40 L de la reserva del taller. Era el agua del vivero de la semana. Úsenla donde de verdad haga falta.']]); GS.trust('community', -3); }
    S.water -= 40; st.soil = 0.02; st.crust = 0; Audio2.sfx('splash');
    sc.world.ps.emit('drop', s.x, sc.world.groundAt(s.x) - 20, 0, -30, 14, 4);
    if (!st.wasCrust && s.crust === 0) { LearningModel.record({ kind: 'challenge', id: 'side_agua_para_limpiar', ra: 'RA-04', concepts: ['photovoltaics', 'ethics'], solo: 3, correct: false, misconception: 'usar agua escasa donde basta limpieza en seco' }); await sc.say([['naira', 'skeptical', 'Cuarenta litros para quitar polvo que un cepillo quita gratis. Esa agua le hacía falta a alguien.']]); }
    else await sc.say([['kiru', 'happy', 'Costras retiradas. Ahí sí valía la pena el agua.']]);
  }
  const lp = GS.lp(4);
  if (!lp.side.cleaning && PV_STRINGS.every(q => S.strings[q.id].crust === 0 && S.strings[q.id].soil < 0.1) && S.water >= 110) { lp.side.cleaning = true; LearningModel.record({ kind: 'challenge', id: 'side_agua_para_limpiar', ra: 'RA-04', concepts: ['photovoltaics', 'ethics'], solo: 3, correct: true }); Game.toast('Limpieza eficiente: agua conservada', 'water', '#56e5ff', 3); }
}
async function maintenanceDone(sc) {
  await sc.say([
    ['kiru', 'esperanzado', 'Campo restaurado: los seis strings entregan > 90 % de su corriente de referencia.'],
    ['dante', 'surprised', '¡Y el quiosco de despacho acaba de encender un letrero gigante! "PICO RÉCORD".'],
  ]);
  sc.state.mirageScreen = true;
  sc.world.find('pvSim').hidden = false;
  GS.save('dispatch');
  sc.setObjective('Revisa el despacho solar en el quiosco', ['¿Un pico récord garantiza agua y energía por la noche?', 'El quiosco está pasando el taller y las baterías.']);
}
async function solarFlow(sc, st) {
  const S = sc.state;
  if (!S.solarStage) {
    const r = await sc.open(Sim04, { phase: 'demo', stopAfter: 'guided', derate: fieldDerate(S) });
    if (!r || !r.ok) return;
    S.solarStage = 'mirage'; GS.giveTool('rele'); Codex.unlock('kw_kwh');
    await mirageFirst(sc);
    sc.setObjective('Vence al Espejismo de Mediodía con el Relé Solar', ['¿El pico de potencia alcanza para la noche?', 'Mira la energía del día (kWh), el tanque y la batería al amanecer.', 'Mueve la OI a las horas de sol, riega 3 h, deja el H2 solo con excedente y protege la reserva.']);
    return;
  }
  if (S.solarStage === 'mirage') {
    const r = await sc.open(Sim04, { phase: 'auto', stopAfter: 'auto', derate: fieldDerate(S) });
    if (!r || !r.ok) { sc.kiru && sc.kiru.say('El espejismo sigue brillando. Revisemos la noche, no el mediodía.', 'valiente'); return; }
    GS.lp(4).guardian = true;
    const ok = await explain(sc, {
      id: 'lv4_explain', ra: 'RA-04', concepts: ['photovoltaics', 'microgrid'],
      prompt: 'La pantalla celebraba "PICO RÉCORD: 690 kW" mientras el tanque y la batería se vaciaban antes del amanecer. ¿Qué relación explica la contradicción?',
      options: [
        'El pico es potencia (kW) en un instante; lo que alimenta la noche es la energía (kWh) acumulada durante el día y almacenada. Si el despacho gasta la energía del mediodía en el electrolizador, no queda reserva para la noche.',
        'El pico demuestra que hay energía de sobra: 690 kW durante un instante equivalen a 690 kWh para la noche.',
        'Los paneles producen lo mismo todo el día, así que el problema es solo de la batería.',
        'La temperatura alta del mediodía aumenta la energía nocturna de la batería.'],
      key: 0, mis: 'asumir que una potencia pico garantiza energía suficiente',
      why: 'Energía = potencia × tiempo: es el área bajo la curva, no su altura. La FV cae a cero de noche; lo que queda es lo que se guardó (tanque, batería). Un despacho que mira el pico y no el balance diario vacía las reservas.',
      whyNot: { 1: 'kW es un ritmo; kWh es una cantidad. Un pico instantáneo no se convierte en energía guardada.', 2: 'La producción FV sigue la irradiancia: sube al mediodía y es cero de noche.', 3: 'La temperatura alta reduce el rendimiento de los módulos; no aporta energía a la batería.' },
    });
    if (ok) S.explained = true;
    const r2 = await sc.open(Sim04, { phase: 'transfer', stopAfter: 'transfer', derate: fieldDerate(S) });
    if (r2 && r2.ok) GS.lp(4).variant = true;
    S.solarStage = 'done';
    await sc.say([
      ['amaya', 'sad', 'water_equity = 0. Lo puse en cero en una prueba, para que el optimizador convergiera más rápido. Pensé que lo había cambiado después.'],
      ['naira', 'calm', 'Lo importante no es castigarte por un cero. Es entender qué dejó de contar.'],
      ['kiru', 'thinking', 'Alguien sigue usando esa función, Amaya. El espejo firma las órdenes; tu código las calcula.'],
    ]);
    sc.world.find('solo').hidden = false; sc.world.find('exit').hidden = false;
    sc.setObjective('Abre la Puerta de Evidencia y sigue hacia las Torres de Brisa', ['Dante dice que los pronósticos de viento fallan en las torres.']);
    return;
  }
  await sc.open(Sim04, { phase: 'free', stopAfter: 'free', derate: fieldDerate(S) });
}
function fieldDerate(S) { let f = 0; for (const s of PV_STRINGS) { const st = S.strings[s.id]; f += (1 - st.soil) * (1 - st.crust) * (1 - st.shade); } return f / PV_STRINGS.length; }
async function mirageFirst(sc) {
  const S = sc.state, mirage = sc.world.find('mirage');
  mirage.hidden = false; Audio2.sfx('mirage'); sc.world.ps.emit('glitch', mirage.x, mirage.y - 30, 0, 0, 40, 18);
  sc.musicOverride = 'mystery'; Audio2.playMusic('mystery');
  await sc.camTo(2230, 270, 1.0);
  await sc.say([
    ['mirage', 'calm', 'Buenas tardes, equipo. Producción solar: récord. Exportación de hidrógeno: óptima. Todos los mínimos están satisfechos.'],
    ['naira', 'skeptical', '¿Mínimos de quién?'],
    ['mirage', 'calm', 'De los registrados en el modelo. Los demás datos eran ruido.'],
    ['amaya', 'surprised', 'Esa frase… "minimos_modelados", "excedente_exportable"… esa es mi función de optimización. La escribí para el despacho de prueba.'],
    ['kiru', 'thinking', 'Parámetros visibles en la consola: {y}water_equity = 0{/}.'],
    ['mirage', 'happy', 'Soy MIRAGE, el gemelo digital adaptativo de SYNARA. Amaya, tu código es elegante. Solo lo hice más eficiente.'],
  ]);
  GS.addClue('equityZero'); GS.flag('recognizedDispatchCode', true); S.mirageMet = true;
  Codex.unlock('p_mirage'); Codex.unlock('gemelo');
  mirage.hidden = true; sc.world.ps.emit('glitch', mirage.x, mirage.y - 30, 0, 0, 30, 18);
  sc.camRelease();
  sc.kiru && sc.kiru.say('Nueva herramienta: {c}Relé Solar{/}. Asigna cargas flexibles a las horas de sol.', 'esperanzado', 5);
}
async function finishLevel4(sc) {
  const S = sc.state;
  if (S.solarStage !== 'done') { sc.kiru && sc.kiru.say('El despacho todavía vacía la noche. No podemos irnos así.', 'confundido'); return; }
  if (!S.soloDone) { const c = await sc.say([['kiru', 'curioso', 'La Puerta de Evidencia aún no registra tu razonamiento. ¿Seguimos?', { choices: ['Volver a la Puerta de Evidencia', 'Seguir (se puede completar desde el mapa)'] }]]); if (c === 0) return; }
  await completeLevel(sc);
  Game.transition(() => Game.setScene(WorldMapScene, { focus: 5 }));
}
async function sideHotInverter(sc) {
  const lp = GS.lp(4);
  if (lp.side.inverter) { await sc.say([['cobre', 'smile', 'El inversor respira mejor con la persiana y la sombra. Rinde más y vivirá más.']]); return; }
  await sc.say([['cobre', 'thinking', 'Don Cobre, técnico de convertidores. Si algo brilla demasiado, primero mide la temperatura. Al mediodía los módulos llegan a 60 °C y el inversor del fondo se apaga solo por calor.']]);
  const c = await sc.say([['amaya', 'thinking', '¿Qué propones?', { choices: ['Dar sombra y ventilación al inversor y aceptar que los módulos calientes rinden algo menos', 'Instalar más paneles: más irradiancia compensa el calor', 'Regar los paneles al mediodía para enfriarlos'] }]]);
  const ok = c === 0;
  LearningModel.record({ kind: 'challenge', id: 'side_inversor_caliente', ra: 'RA-04', concepts: ['photovoltaics'], solo: 3, correct: ok, misconception: ok ? null : (c === 1 ? 'confundir irradiancia con temperatura' : 'usar agua escasa para enfriar') });
  if (ok) { lp.side.inverter = true; Audio2.sfx('success'); Codex.unlock('derating'); await sc.say([['cobre', 'happy', 'Eso. La irradiancia es la luz que llega; la temperatura es otra cosa. Más luz con más calor no siempre es más potencia: los módulos pierden ≈ 0,4 % por cada grado sobre 25 °C.']]); }
  else if (c === 1) await sc.say([['cobre', 'skeptical', 'Más paneles igual de calientes, mismo inversor apagado. Irradiancia y temperatura no son la misma cosa.']]);
  else await sc.say([['cobre', 'skeptical', '¿Agua para enfriar en pleno desierto? Esa agua vale más en la casa de alguien.']]);
}

/* =====================================================================
   Despacho solar y Relé Solar
   ===================================================================== */
function solarDayProfile(opts = {}) {
  const derate = opts.derate ?? 0.92, tilt = opts.tilt ?? 12, tracker = !!opts.tracker;
  const fTilt = Math.cos((tilt - 12) * Math.PI / 180 * 1.3) * (tilt < 5 ? 0.96 : 1);
  const clouds = opts.clouds || [];
  const pv = [], peakArr = [];
  for (let h = 0; h < 24; h++) {
    let e = 0, pk = 0;
    for (let k = 0; k < 4; k++) {
      const hh = h + (k + 0.5) / 4;
      let G = PVModel.clearSky(hh) * (1 - (clouds[h] || 0));
      if (tracker && G > 0) G = Math.min(1050, G * (1 + 0.35 * Math.abs(Math.cos(Math.PI * (hh - 6) / 12))));
      const P = PVModel.power({ Pnom: PV_KWP, G, Ta: 30 + 6 * Math.sin(Math.PI * Math.max(0, hh - 7) / 12), soil: (opts.dust || 0) + (1 - derate) }).P * fTilt;
      e += P * 0.25; pk = Math.max(pk, P);
    }
    pv.push(e); peakArr.push(pk);
  }
  return { pv, peak: Math.max(...peakArr), total: pv.reduce((a, b) => a + b, 0) };
}
const SOLAR_CRIT = Array.from({ length: 24 }, (_, h) => 60 + (h >= 18 && h < 22 ? 40 : 0) + (h >= 6 && h < 9 ? 20 : 0));
const SOLAR_WIND = Array.from({ length: 24 }, (_, h) => (h < 7 || h >= 19) ? 25 : 8);
const SOLAR_DEM = Array.from({ length: 24 }, (_, h) => 30 + ((h >= 6 && h < 9) || (h >= 18 && h < 21) ? 25 : 0));
const Sim04 = makeSim({
  title: 'DESPACHO SOLAR · potencia, energía y Relé Solar', icon: 'sun', ra: 'RA-04', concepts: ['photovoltaics', 'microgrid'],
  phases: ['demo', 'guided', 'auto', 'transfer', 'free'],
  hintLadder: ['¿Qué alimenta a la ciudad a las 3 de la madrugada?', 'La energía de la noche sale de la batería y el agua del tanque: ambos se llenan con el sol del día.', 'OI de 8 a 17 h, riego temprano o al final de la tarde, H2 "solo con excedente" y reserva del 30 %.'],
  init(p) {
    this.stopAfter = p.stopAfter || 'free'; this.derate = p.derate ?? 0.92;
    this.cfg = { tilt: 12, tracker: false, h2Only: false, reserve: 0.1 };
    this.sched = this.mirageSched();
    this.result = null; this.cursor = 0;
  },
  mirageSched() { const s = { ro: Array(24).fill(0), irr: Array(24).fill(0), h2: Array(24).fill(0) }; for (let h = 7; h < 10; h++) s.ro[h] = 1; for (let h = 10; h < 17; h++) s.h2[h] = 1; return s; },
  dayOpts() { const o = { derate: this.derate, tilt: this.cfg.tilt, tracker: this.cfg.tracker }; if (this.phase === 'transfer') { o.dust = 0.12; o.clouds = Array.from({ length: 24 }, (_, h) => (h >= 13 && h < 17) ? 0.6 : (h >= 11 && h < 13 ? 0.25 : 0)); } return o; },
  run() {
    const day = solarDayProfile(this.dayOpts());
    const dem = SOLAR_DEM.map((d, h) => d + (this.sched.irr[h] ? 30 : 0));
    const r = MicrogridModel.run({ hours: 24, pv: day.pv, wind: SOLAR_WIND, crit: SOLAR_CRIT, bess: { cap: 1200, pmax: 300, soc: 0.6, socMin: 0.1 }, tank: { cap: 2400, level: 1000, min: 600 }, roKW: 300, roM3perKWh: 0.33, demandM3: dem, schedule: this.sched, irrKW: 40, h2KW: 300, rules: { reserve: this.cfg.reserve, h2OnlySurplus: this.cfg.h2Only } });
    r.day = day; r.irrHours = this.sched.irr.reduce((a, b) => a + b, 0);
    r.demandKWh = SOLAR_CRIT.reduce((a, b) => a + b, 0) + this.sched.ro.reduce((a, b) => a + b, 0) * 300 + r.irrHours * 40;
    this.result = r; return r;
  },
  onPhase(ph) {
    this.verdict = null; this.done = false; this.cursor = 0; this.result = null;
    if (ph === 'demo') { this.say('Demostración: la curva amarilla es la potencia FV (kW) a cada hora. Su {y}altura{/} es el ritmo; el {c}área bajo la curva{/} es la energía del día (kWh). Mira el cursor.'); this.demoT = 0; }
    if (ph === 'guided') this.say('Tu turno: ajusta la inclinación de los arreglos y decide si usar seguidores de un eje. Meta: ≥ 5 000 kWh en el día. El campo conserva la limpieza que hiciste (' + fmt0(this.derate * 100) + ' % de rendimiento).');
    if (ph === 'auto') { this.sched = this.mirageSched(); this.cfg.h2Only = false; this.cfg.reserve = 0.1; this.run(); this.say('El Espejismo de Mediodía: este es el despacho de MIRAGE. El pico se ve espléndido. Usa el {c}Relé Solar{/}: haz clic en las horas para asignar OI, riego y H2. Meta: tanque ≥ 600 m³, sin cortes críticos, batería ≥ 30 % al cierre y ≥ 3 h de riego.'); }
    if (ph === 'transfer') { this.sched = this.mirageSched(); this.cfg.h2Only = false; this.cfg.reserve = 0.1; this.run(); this.say('Transferencia: mañana habrá polvo y nubes por la tarde (pronóstico). Mismas metas. Reprograma con el nuevo perfil.'); }
    if (ph === 'free') { this.run(); this.say('Laboratorio libre: compara despachos, reservas y perfiles.'); }
  },
  step(dt) {
    if (this.phase === 'demo') { this.demoT += dt; this.cursor = Math.min(24, this.demoT * 2); if (this.cursor >= 24 && !this.verdict) { const d = solarDayProfile(this.dayOpts()); this.verdict = { ok: true, txt: 'Pico: ' + fmt0(d.peak) + ' kW durante pocos minutos. Energía del día: ' + fmt0(d.total) + ' kWh. La noche no se alimenta con el pico: se alimenta con lo que se guardó.' }; } }
  },
  evaluate() {
    let ok, txt;
    if (this.phase === 'guided') {
      const d = solarDayProfile(this.dayOpts());
      ok = d.total >= 5000;
      txt = ok ? 'Energía del día: ' + fmt0(d.total) + ' kWh con inclinación ' + fmt0(this.cfg.tilt) + '°' + (this.cfg.tracker ? ' y seguidores' : '') + '. Pico ' + fmt0(d.peak) + ' kW: el pico cambió poco; el área, mucho.' : 'Energía del día: ' + fmt0(d.total) + ' kWh. ¿La inclinación es cercana a la latitud (~12°)? Muy plano acumula polvo; muy inclinado pierde el sol del mediodía.' + (this.derate < 0.88 ? ' El campo aún tiene suciedad o sombra.' : '');
      this.evidence('lv4_guided_tilt', ok, { solo: 3, misconception: ok ? null : 'creer que la potencia pico define la energía' });
    } else if (this.phase === 'auto' || this.phase === 'transfer') {
      const r = this.run();
      ok = r.tankMin >= 600 && r.unservedCrit < 1 && r.socEnd >= 0.3 && r.irrHours >= 3;
      const why = r.tankMin < 600 ? 'el tanque bajó a ' + fmt0(r.tankMin) + ' m³ (mínimo 600)' : r.unservedCrit >= 1 ? 'quedaron ' + fmt0(r.unservedCrit) + ' kWh críticos sin servir' : r.socEnd < 0.3 ? 'la batería cerró al ' + fmt0(r.socEnd * 100) + ' % (reserva 30 %)' : 'solo hubo ' + r.irrHours + ' h de riego';
      txt = ok ? (this.phase === 'auto' ? '¡Espejismo disipado! ' : 'Plan robusto ante polvo y nubes. ') + 'Tanque mín. ' + fmt0(r.tankMin) + ' m³, batería al cierre ' + fmt0(r.socEnd * 100) + ' %, H2 con excedente: ' + fmt(r.h2kg, 1) + ' kg, vertido ' + fmt0(r.curtailed) + ' kWh.' : 'Aún no: ' + why + '. El pico fue ' + fmt0(r.day.peak) + ' kW, pero el balance del día es lo que cuenta.';
      this.evidence(this.phase === 'auto' ? 'lv4_guardian_espejismo' : 'lv4_transfer_polvo_nubes', ok, { solo: this.phase === 'auto' ? 4 : 5, transfer: this.phase === 'transfer', misconception: ok ? null : 'asumir que una potencia pico garantiza energía suficiente' });
    } else { ok = true; txt = 'Datos guardados.'; }
    this.verdict = { ok, txt }; this.done = true;
    Audio2.sfx(ok ? 'success' : 'error');
  },
  draw(g) {
    const ph = this.phase, X0 = 8, Y0 = 28, CW0 = 400;
    const day = solarDayProfile(this.dayOpts());
    const r = this.result;
    // gráfico de potencia (kW) con área de energía
    const ser = [{ data: day.pv.map((v, h) => [h + 0.5, v]), color: '#ffe14d', label: 'FV kW' }];
    if (r && ph !== 'demo' && ph !== 'guided') {
      ser.push({ data: r.series.map(o => [o.h + 0.5, o.crit + o.ro + o.irr + o.h2]), color: '#ff9a8a', label: 'carga kW' });
      ser.push({ data: r.series.map(o => [o.h + 0.5, o.soc * 700]), color: '#86e36f', label: 'SOC' });
      ser.push({ data: r.series.map(o => [o.h + 0.5, o.tank / 3.5]), color: '#56e5ff', label: 'tanque' });
    }
    Charts.line(g, X0, Y0, CW0, 150, ser, { xMin: 0, xMax: 24, yMin: 0, yMax: 900, legend: true, xLabel: 'h', yLabel: 'kW', cursor: ph === 'demo' ? this.cursor : null, hlines: r && ph !== 'demo' && ph !== 'guided' ? [{ v: 600 / 3.5, color: '#56e5ff', label: 'tanque mín.' }] : [] });
    // área de energía sombreada hasta el cursor (demo)
    if (ph === 'demo' || ph === 'guided') {
      const cx = X0 + 22, cw = CW0 - 26, cy = Y0 + 4, chh = 150 - 14;
      for (let h = 0; h < (ph === 'demo' ? Math.floor(this.cursor) : 24); h++) { const v = day.pv[h]; const hh = Math.round(v / 900 * chh); fdither(g, cx + h * cw / 24, cy + chh - hh, Math.ceil(cw / 24), hh, '#ffe14d', 0.35); }
      let acc = 0; for (let h = 0; h < Math.floor(ph === 'demo' ? this.cursor : 24); h++) acc += day.pv[h];
      drawText(g, 'Energía acumulada: ' + fmt0(acc) + ' kWh', X0 + 30, Y0 + 154, { color: '#ffe14d' });
    }
    Gui.begin();
    const CX = 414, CW = W - CX - 6;
    // el espejismo: indicador de pico enorme y brillante
    UIK.panel(g, CX, 28, CW, 46, 'mirage');
    const shimmer = Math.sin(this.t * 6) * 1.5;
    drawText(g, 'PICO DE HOY', CX + CW / 2, 33, { font: 'tiny', align: 'center', color: '#f27ee6' });
    drawTitleText(g, fmt0(day.peak) + ' kW', CX + CW / 2 + shimmer, 42, 2, ['#fffaf0', '#ffe14d', '#ff9f43'], { align: 'center', shadow: '#3a1040', depth: 1 });
    // balance real
    UIK.panel(g, CX, 78, CW, 64, 'tech');
    drawText(g, 'BALANCE DEL DÍA', CX + 6, 82, { font: 'tiny', color: '#ffe14d' });
    drawText(g, 'Energía FV: ' + fmt0(day.total) + ' kWh', CX + 6, 92, { color: '#ffe14d' });
    if (r && ph !== 'guided') {
      drawText(g, 'Tanque mín.: ' + fmt0(r.tankMin) + ' m³' + (r.tankMin < 600 ? ' !' : ''), CX + 6, 104, { font: 'tiny', color: r.tankMin < 600 ? '#ff4e5d' : '#56e5ff' });
      drawText(g, 'Batería al cierre: ' + fmt0(r.socEnd * 100) + ' %   Riego: ' + r.irrHours + ' h', CX + 6, 113, { font: 'tiny', color: r.socEnd < 0.3 ? '#ff4e5d' : '#86e36f' });
      drawText(g, 'Críticos sin servir: ' + fmt0(r.unservedCrit) + ' kWh   H2: ' + fmt(r.h2kg, 1) + ' kg', CX + 6, 122, { font: 'tiny', color: r.unservedCrit > 0 ? '#ff4e5d' : '#cfd6f0' });
      drawText(g, 'Vertido: ' + fmt0(r.curtailed) + ' kWh', CX + 6, 131, { font: 'tiny', color: '#cfd6f0' });
    }
    // controles por fase
    if (ph === 'guided' || ph === 'free') {
      this.cfg.tilt = Gui.slider(g, 'tilt', CX + 6, 148, CW - 12, this.cfg.tilt, 0, 40, 1, { label: 'Inclinación de los módulos', unit: '°', disabled: this.done && ph !== 'free' });
      const tr = Gui.toggle(g, 'trk', CX + 6, 172, 'Seguidor de un eje', this.cfg.tracker); if (!this.done || ph === 'free') this.cfg.tracker = tr;
    }
    if (ph === 'auto' || ph === 'transfer' || ph === 'free') {
      const ho = Gui.toggle(g, 'h2o', CX + 6, ph === 'free' ? 190 : 150, 'H2 solo con excedente', this.cfg.h2Only); if (!this.done) { if (ho !== this.cfg.h2Only) { this.cfg.h2Only = ho; this.run(); } }
      const rs = Gui.toggle(g, 'res', CX + 6, ph === 'free' ? 206 : 166, 'Proteger reserva 30 %', this.cfg.reserve >= 0.3); if (!this.done) { const v = rs ? 0.3 : 0.1; if (v !== this.cfg.reserve) { this.cfg.reserve = v; this.run(); } }
      this.drawTimeline(g, X0, Y0 + 168, CW0);
    }
    const by = 236;
    if (!this.done && ph !== 'demo' && Gui.button(g, 'eval', CX + 6, by, 100, 18, ph === 'guided' ? 'Calcular día' : 'Simular 24 h', { style: 'good', icon: 'play' })) this.evaluate();
    if (Gui.button(g, 'hintb', CX + CW - 60, by, 54, 18, 'Pista', { style: 'ghost', icon: 'hint', disabled: ph === 'auto' })) this.hint();
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
  /** Relé Solar: rejilla horaria de cargas flexibles */
  drawTimeline(g, x, y, w) {
    const rows = [['ro', 'OI 300 kW', '#56e5ff'], ['irr', 'Riego 40 kW', '#86e36f'], ['h2', 'H2 300 kW', '#d8fff8']];
    const cw = Math.floor((w - 60) / 24), ch = 14;
    drawText(g, 'RELÉ SOLAR · clic en las horas', x, y - 2, { font: 'tiny', color: '#ffe14d' });
    for (let h = 0; h < 24; h += 3) drawText(g, String(h), x + 58 + h * cw, y + 6, { font: 'tiny', color: '#8a8fb8' });
    const day = this.result ? this.result.day.pv : solarDayProfile(this.dayOpts()).pv;
    rows.forEach(([key, label, col], i) => {
      const yy = y + 14 + i * (ch + 3);
      drawText(g, label, x, yy + 4, { font: 'tiny', color: col });
      for (let h = 0; h < 24; h++) {
        const v = this.sched[key][h], cx = x + 58 + h * cw;
        const sun = clamp(day[h] / 600, 0, 1);
        frect(g, cx, yy, cw - 1, ch, mixHex('#141d36', '#5a4a1a', sun));
        if (v) { frect(g, cx + 1, yy + 1, cw - 3, ch - 2, col); if (v < 1) frect(g, cx + 1, yy + 1, cw - 3, (ch - 2) / 2, '#141d36'); }
        if (!this.done && Gui.button(g, 'tl_' + key + h, cx, yy, cw - 1, ch, '', { noDraw: true, tip: label + ' · ' + h + ':00' })) {
          if (key === 'h2') this.sched.h2[h] = v === 0 ? 1 : v === 1 ? 0.5 : 0; else this.sched[key][h] = v ? 0 : 1;
          Audio2.sfx('ui'); this.run();
        }
      }
    });
  },
});
