/* =====================================================================
   46_lv06.js — NIVEL 06: LA BÓVEDA DE CARGA
   Microred, convertidores, banco de baterías y sala de control.
   RA-05 · Cambio de Reserva · Guardián: El Devorador de Reserva
   Segundo giro mayor: Amaya eliminó demandas estacionales del modelo.
   ===================================================================== */

const VAULT_RACKS = [360, 440, 520, 600, 680, 760, 1800, 1880, 1960, 2040];
const ARCS = [{ x: 1000, w: 22 }, { x: 1090, w: 22 }, { x: 1180, w: 22 }];

LEVELS[6] = {
  id: 6, title: 'La Bóveda de Carga', chapter: 'CAPÍTULO 06', biome: 'vault', music: 'vault', width: 2600, height: 360, metalFloor: true,
  ambience: { hum: 0.9, wind: 0.05 },
  portraits: ['amaya', 'kiru', 'naira', 'dante', 'beta9', 'eliana'],
  spawn: { x: 50, y: 230 },
  checkpoints: { archive: { x: 1360, y: 296 }, busbar: { x: 1700, y: 296 } },
  ground: [[0, 230], [140, 230], [150, 250, 'lin'], [210, 250], [220, 272, 'lin'], [280, 272], [290, 296, 'lin'], [2400, 296], [2410, 250, 'lin'], [2600, 250]],
  terrain: [{ x0: 0, x1: 2600, mat: 'metal' }],
  platforms: [{ x: 1380, y: 222, w: 240, type: 'metal' }, { x: 960, y: 250, w: 30, type: 'metal' }, { x: 1230, y: 250, w: 30, type: 'metal' }],
  ladders: [{ x: 1390, y0: 222, y1: 296 }, { x: 2405, y0: 250, y1: 296 }],
  hazards: ARCS.map(a => ({ x: a.x, y: 256, w: a.w, h: 40, on: false, power: 150 })),
  cam: { look: 50, vy: 0.66 },
  /* ---------------- accesorios estáticos ---------------- */
  props(pb, world) {
    const gy = (x) => world.groundAt(x);
    // túnel de acceso y escaleras
    pb.rect(0, 150, 300, 6, '#2a2f4a'); for (let x = 0; x < 300; x += 12) pb.vline(x, 150, 156, '#3a4268');
    drawSign(pb, 70, gy(70), 'BÓVEDA DE CARGA', '#2c63c0');
    // racks de baterías con frente de módulos
    for (const x of VAULT_RACKS) {
      const y = gy(x);
      pb.rect(x, y - 92, 64, 92, '#16224c'); pb.rect(x, y - 92, 64, 3, '#2c63c0'); pb.rect(x + 60, y - 92, 4, 92, '#070a1c'); pb.rect(x, y - 3, 64, 3, '#070a1c');
      for (let r = 0; r < 7; r++) { pb.rect(x + 4, y - 86 + r * 12, 54, 9, '#1d2c64'); pb.hline(x + 4, x + 57, y - 86 + r * 12, '#3a52a0'); pb.rect(x + 6, y - 83 + r * 12, 8, 3, '#0a1030'); }
      pb.rect(x + 22, y - 100, 20, 8, '#ffe14d'); pb.set(x + 32, y - 97, '#140d26');
    }
    drawSign(pb, 560, gy(560) - 92, 'BANCO BESS · 4 MWh', '#b6f05a');
    // sala de convertidores: gabinetes y barras de cobre
    for (let k = 0; k < 4; k++) { const x = 920 + k * 90; pb.rect(x, gy(x) - 70, 50, 70, '#e8f0f4'); pb.rect(x, gy(x) - 70, 50, 3, '#8d6bff'); pb.rect(x + 6, gy(x) - 60, 38, 16, '#0a1030'); for (let j = 0; j < 5; j++) pb.hline(x + 6, x + 43, gy(x) - 36 + j * 5, '#a9bbd6'); }
    pb.rect(900, 186, 400, 6, '#c8861a'); pb.hline(900, 1299, 186, '#ffe08a'); pb.rect(900, 194, 400, 4, '#9a5e12');
    drawSign(pb, 1100, 186, 'CONVERTIDORES', '#8d6bff');
    // sala de control elevada
    const cx = 1380;
    pb.rect(cx, 140, 240, 82, '#101a46'); pb.rect(cx, 140, 240, 3, '#56e5ff'); pb.rect(cx + 236, 140, 4, 82, '#070a1c');
    for (let k = 0; k < 4; k++) { pb.rect(cx + 10 + k * 58, 150, 48, 28, '#05081d'); pb.rect(cx + 10 + k * 58, 150, 48, 2, '#2c63c0'); }
    drawSign(pb, cx + 120, 140, 'CONTROL MICRORRED', '#56e5ff');
    // archivo de datos
    pb.rect(1660, gy(1660) - 60, 40, 60, '#1a1240'); pb.rect(1660, gy(1660) - 60, 40, 3, '#e05aa0'); for (let r = 0; r < 6; r++) pb.rect(1664, gy(1660) - 54 + r * 9, 32, 6, '#2a1a5a');
    drawSign(pb, 1680, gy(1680) - 60, 'ARCHIVO', '#e05aa0');
    // barra principal (arranque en negro)
    pb.rect(2150, gy(2150) - 110, 120, 110, '#0f1838'); pb.rect(2150, gy(2150) - 110, 120, 4, '#ff6b6b');
    for (let k = 0; k < 5; k++) { pb.rect(2160 + k * 22, gy(2150) - 96, 14, 40, '#263442'); pb.rect(2162 + k * 22, gy(2150) - 92, 10, 6, '#c8861a'); }
    drawSign(pb, 2210, gy(2210) - 110, 'BARRA PRINCIPAL', '#ff6b6b');
    // ascensor de salida
    pb.rect(2420, 120, 80, 130, '#1a2458'); pb.rect(2424, 124, 72, 126, '#070a1c'); for (let y = 130; y < 250; y += 10) pb.hline(2424, 2495, y, '#24306c');
    drawSign(pb, 2460, 250, 'ASCENSOR · CIUDADELA H2', '#56e5ff');
  },
  /* ---------------- dinámico ---------------- */
  /* ---------------- panorama: publica el estado de la microrred para el fondo ---------------- */
  skyFx(g, sc) {
    const S = sc.state;
    sc.backdrop.vault = { soc: S.blackout ? 0 : (S.soc ?? 0.28), charging: S.charging || 0, blackout: !!S.blackout };
  },
  renderMid(g, sc, cam) {
    const S = sc.state, t = Game.time, w = sc.world, ox = cam.x, oy = cam.y;
    const gy = (x) => w.groundAt(x) - oy;
    // LED de módulos y barra de SOC en cada rack
    for (const x of VAULT_RACKS) {
      const sx = x - ox; if (sx < -70 || sx > W + 10) continue;
      const soc = S.blackout ? 0 : (S.soc ?? 0.28);
      for (let r = 0; r < 7; r++) { const on = (6 - r) / 7 < soc; frect(g, sx + 6, gy(x) - 83 + r * 12, 8, 3, on ? (soc < 0.3 ? '#ff6b6b' : '#b6f05a') : '#1a1a2a'); if (on && !S.blackout && ((Math.floor(t * 3) + r + x) % 9 === 0)) fpx(g, sx + 50, gy(x) - 83 + r * 12, '#56e5ff'); }
      if (!S.blackout) drawSOCStrip(g, sx + 8, gy(x) - 110, 48, soc, t, S.charging || 0);
    }
    // flujo por la barra de cobre: hacia el electrolizador (arriba) o a cargas críticas
    if (!S.blackout) VISTA.flowClip(g, [[900 - ox, 189 - oy], [1300 - ox, 189 - oy]], 'power', S.elyOn ? 1.4 : 0.6, 2);
    // arcos eléctricos temporizados (peligro no letal)
    for (let i = 0; i < ARCS.length; i++) {
      const a = ARCS[i], hz = w.hazards[i];
      const ph = (t * 0.8 + i * 0.37) % 2.2;
      hz.on = !S.blackout && ph < 0.8;
      const sx = a.x - ox, top = 198 - oy, bot = gy(a.x);
      frect(g, sx + 4, top, 3, 4, '#c8861a'); frect(g, sx + a.w - 7, bot - 4, 3, 4, '#c8861a');
      if (hz.on) { let px = sx + 6, py = top + 4; for (let y = top + 4; y < bot; y += 6) { const nx = sx + 4 + Math.random() * (a.w - 8); fline(g, px, py, nx, y, (Math.random() < 0.5) ? '#ffffff' : '#a6e6ff'); px = nx; py = y; } VISTA.veil(g, sx - 6, top, a.w + 12, bot - top, '#56e5ff', 0.12); }
      else if (ph > 1.8) for (let k = 0; k < 3; k++) fpx(g, sx + 6 + Math.random() * 10, top + 6 + Math.random() * 10, '#a6e6ff');
    }
    // pantallas de control
    for (let k = 0; k < 4; k++) { const x = 1390 + k * 58 - ox, y = 150 - oy; if (S.blackout) continue; for (let i = 0; i < 5; i++) frect(g, x + 4, y + 4 + i * 4, 6 + ((i * 7 + Math.floor(t * 3) + k) % 34), 1, k === 2 ? '#ff6b6b' : '#56e5ff'); }
    // interruptores de la barra principal
    const bs = S.bsSteps || 0;
    for (let k = 0; k < 5; k++) frect(g, 2163 + k * 22 - ox, gy(2150) - 82, 8, 10, k < bs ? '#b6f05a' : (S.blackout ? '#3a1a20' : '#ff6b6b'));
  },
  renderGrade(g, sc) {
    const S = sc.state;
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = S.blackout ? 0.8 : 0.25; frect(g, 0, 0, W, H, S.blackout ? '#2a2050' : '#4a5ab0'); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    if (S.blackout) { const p = sc.player; const x = p.x - sc.cam.ox, y = p.y - sc.cam.oy - 30; g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35; fdisc(g, x, y, 60, '#203060'); fdisc(g, x, y, 34, '#304080'); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  },
  lens(g, sc, cam, k) {
    const S = sc.state, ox = cam.x, oy = cam.y;
    lensBoundary(g, 340 - ox, 150 - oy, 1300, 150, '#ffe14d', 'LÍMITE: MICRORRED DE LA BÓVEDA');
    lensTag(g, 380 - ox, 168 - oy, 'SOC ' + fmt0((S.soc ?? 0.28) * 100) + ' % de 4000 kWh = ' + fmt0((S.soc ?? 0.28) * 4000) + ' kWh', '#b6f05a', 'battery');
    lensTag(g, 380 - ox, 180 - oy, 'Potencia máx. 1000 kW (ritmo) ≠ energía (kWh)', '#a6f4ff', 'bolt');
    lensTag(g, 940 - ox, 170 - oy, 'Electrolizador: ' + (S.elyOn ? '600 kW desde la batería' : 'detenido'), S.elyOn ? '#ff9a8a' : '#c2f58e', 'h2');
    lensTag(g, 1400 - ox, 128 - oy, 'Reserva mínima: ' + fmt0((S.reserve ?? 0.1) * 100) + ' %', '#ffe14d', 'shield');
    lensTag(g, 2160 - ox, 170 - oy, 'Cargas críticas: agua potable, clínica, comunicaciones', '#ff6b6b', 'heart');
  },
  hud(g, sc) {
    const S = sc.state;
    hudGauges(g, [
      { icon: 'battery', label: 'SOC BESS', value: S.blackout ? '— ' : fmt0((S.soc ?? 0.28) * 100) + ' %', frac: S.blackout ? 0 : S.soc ?? 0.28, color: (S.soc ?? 0.28) < 0.3 ? '#ff6b6b' : '#b6f05a' },
      { icon: 'shield', label: 'RESERVA', value: fmt0((S.reserve ?? 0.1) * 100) + ' %', frac: S.reserve ?? 0.1, color: '#ffe14d' },
      { icon: 'h2', label: 'ELECTROLIZ.', value: S.elyOn ? '600 kW' : 'DETENIDO', frac: S.elyOn ? 1 : 0, color: S.elyOn ? '#ff9a8a' : '#86e36f' },
    ]);
  },
  /* ---------------- guion ---------------- */
  setup(sc, p) {
    const S = sc.state;
    Object.assign(S, { soc: 0.28, reserve: 0.1, elyOn: true, blackout: false, bsSteps: 0, charging: -1 });
    const beta = sc.actor('beta9', 'beta9', 330, { facing: 1, variant: 2 });
    const naira = sc.actor('naira', 'naira', 1500, { facing: -1 });
    naira.y = 222;
    const dante = sc.actor('dante', 'dante', 1140, { facing: -1, restAnim: 'repair' });
    sc.world.add(new Pickup({ kind: 'echo', x: 975, y: 222, onPick: () => kiruEcho(sc, 'l6a', 'KIRU: "La voz de Eliana: «KIRU, guarda esto donde nadie mire». ¿Guardar qué?"') }));
    sc.world.add(new Pickup({ kind: 'echo', x: 2000, y: 190, onPick: () => kiruEcho(sc, 'l6b', 'KIRU: "Cluster 07. Demanda estacional. Lo leí en un archivo que no recuerdo haber abierto."') }));
    for (const [x, y] of [[520, 220], [700, 214], [1900, 220]]) sc.world.add(new Adversary({ type: 'socEater', x, y, range: 40, speed: 22 }));
    beta.onTalk = async (sc2) => {
      if (!S.metBeta) {
        S.metBeta = true;
        await sc2.say([
          ['beta9', 'worried', 'BETA-9, robot de mantenimiento del banco. Estoy al 22 %. No es pánico. Es una recomendación emocional.'],
          ['beta9', 'sad', 'El banco grande está al 28 % y bajando. Alguien mandó el electrolizador a 600 kW toda la noche. Desde la batería.'],
          ['kiru', 'thinking', 'Una batería no es una fuente primaria: solo devuelve lo que se guardó… menos las pérdidas.'],
          ['beta9', 'calm', 'Y por cada 100 kWh que entran, salen unos 90. El resto se vuelve calor. Lo siento en mis celdas.'],
        ]);
        Codex.unlock('p_beta'); Codex.unlock('eficiencia_bess');
        sc2.setObjective('Llega a la sala de control de la microrred', ['¿Quién vacía la batería y para qué?', 'Atraviesa la sala de convertidores: cuidado con los arcos.', 'La sala de control está elevada, a la derecha.']);
      } else if (!GS.lp(6).side.beta) await sideBetaRest(sc2);
      else await sc2.say([['beta9', 'happy', 'Ventana de 20 a 80 %. Mis celdas te lo agradecen. Viviré más años para quejarme.']]);
    };
    naira.onTalk = async (sc2) => { if (S.revealed) await sc2.say([['naira', 'calm', 'Borraste datos, Amaya. Ahora sabes qué representaban. Eso cambia lo que puedes hacer.']]); else await sc2.say([['naira', 'thinking', 'La consola de la microrred está aquí. Y ese archivo, abajo a la derecha, lleva días cerrado con candado.']]); };
    dante.onTalk = async (sc2) => sideHospital(sc2);
    sc.station({ id: 'gridSim', x: 1450, y: 222, kind: 'sim', label: 'Gemelo de la microrred', glow: '#56e5ff', onUse: async (sc2, st) => gridFlow(sc2, st) });
    sc.station({ id: 'archive', x: 1680, kind: 'clue', label: 'Archivo de limpieza de datos', glow: '#e05aa0', hidden: true, onUse: async (sc2, st) => { st.done = true; await archiveReveal(sc2); } });
    sc.station({ id: 'busbar', x: 2210, kind: 'terminal', label: 'Barra principal', glow: '#ff6b6b', hidden: true, onUse: async (sc2, st) => busbarFlow(sc2, st) });
    sc.station({ id: 'solo', x: 2320, kind: 'solo', label: 'Puerta de Evidencia', glow: '#b49cff', hidden: true, onUse: async (sc2, st) => {
      const r = await sc2.open(SOLOScene, { ctx: 'RA-05-C1' });
      st.progress = r.correct; if (r.correct >= 3) { st.done = true; GS.lp(6).solo = true; S.soloDone = true; Codex.unlock('reserva'); }
    } });
    sc.station({ id: 'exit', x: 2460, y: 250, kind: 'clue', label: 'Subir a la Ciudadela H2', glow: '#ffe14d', hidden: true, onUse: async (sc2) => finishLevel6(sc2) });
    sc.setObjective('Habla con BETA-9 junto al banco de baterías', ['¿Por qué la batería baja de noche?', 'BETA-9 está al pie de la escalera.']);
    Codex.unlock('bess');
    if (p.checkpoint === 'archive') { Object.assign(S, { metBeta: true, gridStage: 'archive' }); GS.giveTool('reserva', true); sc.world.find('archive').hidden = false; S.reserve = 0.3; S.elyOn = false; sc.setObjective('Abre el archivo de limpieza de datos', []); }
    if (p.checkpoint === 'busbar') { Object.assign(S, { metBeta: true, gridStage: 'blackstart', revealed: true, somber: true, blackout: true }); GS.giveTool('reserva', true); GS.addClue('reviewCommunity'); sc.world.find('busbar').hidden = false; sc.setObjective('Arranque en negro en la barra principal', []); sc.musicOverride = 'sad'; }
  },
  update(sc, dt) {
    const S = sc.state;
    if (S.elyOn && !S.blackout) S.soc = Math.max(0.12, S.soc - dt * 0.0015);
    if (Math.random() < 0.05 && !S.blackout) sc.world.ps.emit('spark', 900 + Math.random() * 400, 190, 0, 20, 1);
  },
  triggers: [
    { x: 880, w: 40, run: (sc) => { sc.kiru && sc.kiru.say('Arcos eléctricos: pasa cuando se apagan. Cuenta el ritmo.', 'alarmado', 4); } },
  ],
};

/* ---------------- piezas del guion del nivel 06 ---------------- */
async function gridFlow(sc, st) {
  const S = sc.state;
  if (!S.gridStage) {
    const r = await sc.open(Sim06, { phase: 'demo', stopAfter: 'guided' });
    if (!r || !r.ok) return;
    S.gridStage = 'archive'; GS.giveTool('reserva'); S.reserve = 0.3; S.elyOn = false; S.charging = 1;
    Codex.unlock('reserva');
    await sc.say([
      ['kiru', 'happy', 'Nueva herramienta: {c}Cambio de Reserva{/}. Protege la energía de las cargas críticas.'],
      ['amaya', 'determined', 'Reserva al 30 %, electrolizador fuera. El SOC deja de caer.'],
      ['naira', 'thinking', 'Bien. Ahora la pregunta incómoda: ¿por qué el gemelo creía que de noche nadie necesitaba esa energía? El archivo tiene la respuesta.'],
    ]);
    sc.world.find('archive').hidden = false;
    GS.save('archive');
    sc.setObjective('Abre el archivo de limpieza de datos', ['¿Qué datos se eliminaron al entrenar el gemelo?', 'El archivo está bajando de la sala de control, a la derecha.']);
    return;
  }
  if (S.gridStage === 'guardian') {
    const r = await sc.open(Sim06, { phase: 'auto', stopAfter: 'auto' });
    if (!r || !r.ok) { sc.kiru && sc.kiru.say('La reserva cayó en el gemelo. Nadie se quedó sin agua de verdad. Otra vez.', 'valiente'); return; }
    GS.lp(6).guardian = true;
    const ok = await explain(sc, {
      id: 'lv6_explain', ra: 'RA-05', concepts: ['battery', 'microgrid'],
      prompt: 'El Devorador de Reserva quería vaciar la batería para mejorar el indicador "H2 exportado hoy". ¿Por qué proteger una reserva mínima es la decisión correcta aunque baje ese indicador?',
      options: [
        'La batería no genera energía: solo devuelve, con pérdidas, la que se guardó. Si se vacía antes de un evento incierto (nube, calma, falla), las cargas críticas quedan sin respaldo; la reserva compra tiempo y confiabilidad.',
        'Porque la batería se recarga sola durante la noche si está en reserva.',
        'Porque una batería al 30 % tiene más potencia que una al 90 %.',
        'Porque la eficiencia de la batería es del 100 % solo cuando está en reserva.'],
      key: 0, mis: 'tratar la batería como fuente primaria',
      why: 'Energía almacenada (kWh) con eficiencia de ida y vuelta < 100 %, límites de potencia (kW) y eventos encadenados: la reserva es un seguro para lo esencial. Un indicador de corto plazo no mide la confiabilidad.',
      whyNot: { 1: 'Nada recarga la batería sin una fuente: sol, viento u otra generación.', 2: 'La potencia máxima la limita el convertidor, no el SOC (salvo extremos).', 3: 'Las pérdidas existen siempre al cargar y descargar.' },
    });
    if (ok) S.explained = true;
    // eventos encadenados → apagón de la bóveda
    S.blackout = true; Audio2.sfx('blackout'); sc.cam.shake(4, 0.6);
    await sc.say([
      ['narr', null, 'Una tras otra: la nube, la calma, el módulo 3 que se desconecta… y la bóveda queda a oscuras.'],
      ['beta9', 'scared', 'Estoy al 9 %. Ahora sí es pánico.'],
      ['kiru', 'determined', 'Necesitamos un arranque en negro: energizar la red por partes, en orden. La barra principal está al fondo.'],
    ]);
    S.gridStage = 'blackstart';
    sc.world.find('busbar').hidden = false;
    GS.save('busbar');
    sc.setObjective('Ejecuta el arranque en negro en la barra principal', ['¿Qué se conecta primero cuando no hay red?', 'Primero se aísla, luego una fuente estable forma la red, después lo crítico.', 'Avanza a oscuras hacia la derecha.']);
    return;
  }
  await sc.open(Sim06, { phase: 'free', stopAfter: 'free' });
}
async function archiveReveal(sc) {
  const S = sc.state;
  sc.musicOverride = 'sad'; Audio2.playMusic('sad');
  await sc.say([
    ['kiru', 'neutral', 'DATA_CLEANING_REPORT. seasonal_demand_cluster_07 → removed. mobile_livestock_routes → removed. seedling_nursery_peaks → removed. Motivo: anomalous / insufficient records. {y}approved_by → AMAYA_S{/}.'],
    ['narr', null, 'Amaya recuerda. La noche antes de la entrega, el modelo no convergía. Eliminó los datos que parecían inconsistentes. No sabía que eran desplazamientos estacionales, demanda de animales, viveros, mantenimiento comunitario, reserva para los meses secos.'],
    ['amaya', 'crying', 'Yo borré a la gente del modelo.'],
    ['naira', 'calm', 'Borraste datos.'],
    ['amaya', 'sad', 'Es lo mismo.'],
    ['naira', 'determined', 'No. Pero si finges que es lo mismo, solo podrás castigarte. Si entiendes la diferencia, podrás repararlo.'],
    ['kiru', 'thinking', 'Hay una nota anexa al informe, de la Dra. Rojas: {g}REVIEW WITH COMMUNITY{/}. Y una grabación corta.'],
    ['eliana', 'calm', '(grabación) "Un error compartido no es un error sin responsables."'],
    ['amaya', 'tired', 'Entonces… ¿de quién es la responsabilidad?'],
    ['naira', 'calm', 'Separa tres cosas: la causa (datos eliminados y un objetivo que los ignora), la responsabilidad (tuya, de quien aprobó sin revisar y de quien desplegó sin preguntar) y la culpa, que no repara nada. Quédate con las dos primeras.'],
  ]);
  GS.addClue('reviewCommunity'); S.revealed = true; S.somber = true;
  Codex.unlock('gobernanza');
  // consecuencia emocional: sin percusión, KIRU sin bromas
  await sc.say([['dante', 'worried', '(en voz baja) …¿Quieres que te traiga algo? ¿Agua? ¿Un tornillo de la suerte?'], ['amaya', 'tired', 'Después, Dante. Primero que nadie se quede sin luz esta noche.']]);
  S.gridStage = 'guardian';
  sc.setObjective('Vence al Devorador de Reserva en el Gemelo de la microrred', ['¿Qué pasa si la batería llega vacía a un evento incierto?', 'Protege la reserva, deja el H2 solo para excedentes y desprende cargas flexibles si hace falta.', 'Vuelve a la sala de control.']);
}
async function busbarFlow(sc, st) {
  const S = sc.state;
  if (S.gridStage !== 'blackstart') { await sc.say([['kiru', 'neutral', 'Barra principal estable.']]); return; }
  const r = await sc.open(Sim06, { phase: 'transfer', stopAfter: 'transfer' });
  if (!r || !r.ok) { sc.kiru && sc.kiru.say('El orden importa. Probemos otra secuencia.', 'valiente'); return; }
  GS.lp(6).variant = true;
  S.blackout = false; S.bsSteps = 5; S.soc = 0.34; S.elyOn = false; Audio2.sfx('power'); Game.doFlash('#b6f05a', 0.4);
  GS.flag('blackStart', true);
  await sc.say([
    ['beta9', 'happy', 'Red formada, críticas en línea, renovables sincronizadas. Estoy al 34 %. Optimismo moderado.'],
    ['kiru', 'esperanzado', 'Lo hicimos en orden. Como Eliana enseñó: primero lo que sostiene la vida, al final lo que se vende.'],
    ['amaya', 'determined', 'MIRAGE manda el despacho desde el núcleo. La ruta pasa por la Ciudadela del Hidrógeno. Vamos.'],
  ]);
  sc.musicOverride = null; Audio2.playMusic('vault');
  sc.world.find('solo').hidden = false; sc.world.find('exit').hidden = false;
  sc.setObjective('Abre la Puerta de Evidencia y sube a la Ciudadela H2', ['El ascensor está al final de la bóveda.']);
}
async function finishLevel6(sc) {
  const S = sc.state;
  if (S.blackout || S.gridStage !== 'blackstart') { sc.kiru && sc.kiru.say('Sin red no funciona el ascensor.', 'confundido'); return; }
  if (!S.soloDone) { const c = await sc.say([['kiru', 'curioso', 'La Puerta de Evidencia aún no registra tu razonamiento. ¿Seguimos?', { choices: ['Volver a la Puerta de Evidencia', 'Seguir (se puede completar desde el mapa)'] }]]); if (c === 0) return; }
  await completeLevel(sc);
  Game.transition(() => Game.setScene(WorldMapScene, { focus: 7 }));
}
async function sideBetaRest(sc) {
  const lp = GS.lp(6);
  await sc.say([['beta9', 'tired', 'Pregunta personal: me ciclan de 0 a 100 % todos los días. Me siento… vieja. ¿Qué ventana de SOC me recomiendas para durar más?']]);
  const c = await sc.say([['amaya', 'thinking', 'Para alargar la vida útil de BETA-9…', { choices: ['Operar normalmente entre ~20 % y ~80 %, dejando los extremos para emergencias', 'Mantenerla siempre al 100 %: así está lista', 'Descargarla siempre a 0 % para "ejercitarla"'] }]]);
  const ok = c === 0;
  LearningModel.record({ kind: 'challenge', id: 'side_beta_descansa', ra: 'RA-05', concepts: ['battery'], solo: 3, correct: ok, misconception: ok ? null : 'ignorar la degradación por ciclos profundos' });
  if (ok) { lp.side.beta = true; Audio2.sfx('success'); await sc.say([['beta9', 'happy', 'Ciclos menos profundos, menos degradación. La capacidad útil baja un poco, pero vivo muchos más ciclos. Un buen trato (simplificado).']]); }
  else await sc.say([['beta9', 'sad', 'Los extremos de carga y descarga aceleran mi degradación. Inténtalo de nuevo, por mis celdas.']]);
}
async function sideHospital(sc) {
  const lp = GS.lp(6);
  if (lp.side.priority) { await sc.say([['dante', 'smile', 'La lista de prioridades quedó pegada en el tablero. Con cinta, obviamente.']]); return; }
  await sc.say([['dante', 'worried', 'Si la reserva baja de golpe, ¿qué se desconecta primero? Tengo: fábrica de hielo, bombeo de agua potable, clínica, alumbrado de la plaza.']]);
  const c = await sc.say([['amaya', 'thinking', '¿Qué se mantiene hasta el final?', { choices: ['Clínica y bombeo de agua potable; luego alumbrado; la fábrica de hielo primero en salir', 'La fábrica de hielo: es la que más paga', 'Todo igual: desconectar al azar es más justo'] }]]);
  const ok = c === 0;
  LearningModel.record({ kind: 'challenge', id: 'side_clinica_primero', ra: 'RA-05', concepts: ['microgrid', 'ethics'], solo: 4, correct: ok, misconception: ok ? null : 'no distinguir cargas críticas y flexibles' });
  if (ok) { lp.side.priority = true; GS.trust('community', 5); Audio2.sfx('success'); await sc.say([['dante', 'joy', 'Lo pego en el tablero. Primero la vida, después el hielo.']]); }
  else await sc.say([['dante', 'skeptical', 'Hmm. Si se va la clínica para que siga el hielo… no creo que la ciudad lo aplauda.']]);
}

/* =====================================================================
   Gemelo de la microrred: SOC, reglas de despacho, Devorador de Reserva,
   arranque en negro abstracto.
   ===================================================================== */
const GRID_PV = Array.from({ length: 24 }, (_, h) => Math.max(0, Math.sin(Math.PI * (h - 6) / 12)) * 900);
const GRID_WIND = Array.from({ length: 24 }, (_, h) => 180 + 120 * Math.sin(h * 0.5));
const GRID_CRIT = Array.from({ length: 24 }, (_, h) => 150 + (h >= 18 && h < 23 ? 80 : 0));
const BS_STEPS = [
  { id: 'iso', label: 'Abrir interruptores y aislar la red', why: 'Evita que cargas conectadas tumben la primera fuente al energizar.' },
  { id: 'form', label: 'BESS en modo formador de red (tensión y frecuencia)', why: 'Una fuente estable fija la referencia; FV y eólica necesitan una red a la que sincronizarse.' },
  { id: 'crit', label: 'Conectar cargas críticas (clínica, agua potable)', why: 'Lo esencial primero, mientras hay reserva.' },
  { id: 'ren', label: 'Sincronizar FV y eólica', why: 'Con la red formada, las renovables aportan y recargan.' },
  { id: 'flex', label: 'Reconectar cargas flexibles por etapas (OI, riego)', why: 'Por bloques, vigilando frecuencia y SOC.' },
  { id: 'h2', label: 'Electrolizador al final, solo con excedente', why: 'La carga más flexible entra cuando sobra energía.' },
];
const Sim06 = makeSim({
  title: 'GEMELO DE MICRORRED · SOC, reserva y despacho', icon: 'battery', ra: 'RA-05', concepts: ['battery', 'microgrid'],
  phases: ['demo', 'guided', 'auto', 'transfer', 'free'],
  hintLadder: ['¿De dónde saca la batería la energía que entrega?', 'SOC(t+1) = SOC + ηc·Pcarga·Δt/E − Pdescarga·Δt/(ηd·E). Con ηc = ηd = 0,95, cada ciclo pierde ≈ 10 %.', 'Reserva 30 %, H2 solo con excedente, y desprende riego y H2 antes que lo crítico.'],
  init(p) { this.stopAfter = p.stopAfter || 'free'; this.rule = { reserve: 0.1, h2Only: false, chargeFirst: false, prio: ['crit', 'ro', 'irr', 'h2'] }; this.order = []; },
  onPhase(ph) {
    this.verdict = null; this.done = false; this.order = [];
    if (ph === 'demo') { this.b = BESSModel.make({ cap: 4000, pmax: 1000, soc: 0.5 }); this.demoT = 0; this.inE = 0; this.outE = 0; this.say('Demostración: cargo 1000 kWh y luego los descargo. Mira el SOC y cuánto vuelve. La batería guarda energía (kWh); su convertidor limita la potencia (kW).'); }
    if (ph === 'guided') { this.rule = { reserve: 0.1, h2Only: false, chargeFirst: false, prio: ['crit', 'ro', 'irr', 'h2'] }; this.runDay(); this.say('Tu turno: diseña la regla de despacho. Meta en 24 h: cero críticas sin servir, SOC al cierre ≥ reserva y ≥ 30 %, y el H2 solo con excedente renovable.'); }
    if (ph === 'auto') { this.live = { h: 0, b: BESSModel.make({ cap: 4000, pmax: 1000, soc: 0.45, socMin: 0.05 }), eater: 0, unservedCrit: 0, minSoc: 1, h2: 0, events: [] }; this.ctl = { reserve: 0.3, h2: false, irr: true, ro: true }; this.running = false; this.say('El Devorador de Reserva: un controlador "optimiza" H2 exportado encendiendo el electrolizador desde la batería. Habrá eventos encadenados (nube, calma, falla de un módulo). Mantén lo crítico 24 h.'); }
    if (ph === 'transfer') this.say('Transferencia: apagón total. Ordena los pasos del arranque en negro (abstracto). Haz clic en los pasos en el orden en que los ejecutarías.');
    if (ph === 'free') { this.runDay(); }
  },
  runDay() {
    const sched = { ro: Array.from({ length: 24 }, (_, h) => h >= 8 && h < 17 ? 1 : 0), irr: Array.from({ length: 24 }, (_, h) => (h >= 6 && h < 8) || (h >= 17 && h < 18) ? 1 : 0), h2: Array(24).fill(1) };
    this.res = MicrogridModel.run({ hours: 24, pv: GRID_PV, wind: GRID_WIND, crit: GRID_CRIT, bess: { cap: 4000, pmax: 1000, soc: 0.45, socMin: 0.05 }, tank: { cap: 3000, level: 1500, min: 600 }, roKW: 300, roM3perKWh: 0.33, demandM3: Array(24).fill(40), schedule: sched, irrKW: 60, h2KW: 600, rules: { reserve: this.rule.reserve, h2OnlySurplus: this.rule.h2Only, chargeFirst: this.rule.chargeFirst, socTarget: 0.8 } });
    return this.res;
  },
  step(dt) {
    if (this.phase === 'demo' && !this.verdict) {
      this.demoT += dt;
      const p = this.demoT < 4 ? -250 : this.demoT < 8 ? 0 : this.demoT < 12 ? 250 : 0;
      const pe = BESSModel.step(this.b, p, dt);
      if (pe < 0) this.inE += -pe * dt; else this.outE += pe * dt;
      if (this.demoT > 12.5) this.verdict = { ok: true, txt: 'Entraron ' + fmt0(this.inE) + ' kWh y salieron ' + fmt0(this.outE) + ' kWh hasta ahora: cada paso pierde ≈ 5 %. La batería no es una fuente: es un depósito con pérdidas.' };
      return;
    }
    if (this.phase === 'auto' && this.running && !this.done) {
      const L = this.live, dh = dt * 0.4 * (Input.down('fast') ? 3 : 1);
      L.h += dh;
      const h = Math.floor(L.h);
      // eventos encadenados
      const cloud = h >= 14 && h < 17 ? 0.25 : 1, calm = h >= 19 ? 0.15 : 1, modFail = h >= 21;
      L.b.pmax = modFail ? 500 : 1000;
      if (h === 14 && !L.events.includes('n')) { L.events.push('n'); this.say('Evento 1: nube espesa. La FV cae al 25 %.'); }
      if (h === 19 && !L.events.includes('c')) { L.events.push('c'); this.say('Evento 2: calma nocturna. La eólica cae al 15 %.'); }
      if (h === 21 && !L.events.includes('f')) { L.events.push('f'); this.say('Evento 3: falla del módulo 3. La batería solo entrega 500 kW.'); }
      // el devorador enciende el H2 periódicamente
      L.eater += dh;
      if (L.eater > 2.6 && !this.ctl.h2) { L.eater = 0; this.ctl.h2 = true; Audio2.sfx('mirage', { vol: 0.3 }); this.say('{p}Devorador de Reserva:{/} «¡H2 exportado hoy +12 %! Electrolizador encendido.»', 'mirage'); }
      const gen = (GRID_PV[h % 24] || 0) * cloud + (GRID_WIND[h % 24] || 0) * calm;
      const crit = GRID_CRIT[h % 24], ro = this.ctl.ro && h >= 8 && h < 17 ? 300 : 0, irr = this.ctl.irr && ((h >= 6 && h < 8) || h === 17) ? 60 : 0, ely = this.ctl.h2 ? 600 : 0;
      let net = gen - crit - ro - irr - ely;
      if (net >= 0) BESSModel.step(L.b, -net, dh);
      else {
        const nonCrit = Math.max(0, -net - Math.max(0, crit - gen));
        const avail = BESSModel.energyAbove(L.b, this.ctl.reserve) / dh;
        const giveNC = Math.min(nonCrit, avail);
        const d1 = BESSModel.step(L.b, giveNC, dh);
        const critNeed = Math.max(0, crit - gen);
        const d2 = BESSModel.step(L.b, critNeed, dh);
        const shortCrit = Math.max(0, critNeed - d2);
        L.unservedCrit += shortCrit * dh;
        if (ely && d1 < nonCrit - 1) L.h2 += 0; else if (ely) L.h2 += ely * dh / 55;
      }
      L.minSoc = Math.min(L.minSoc, L.b.soc);
      if (L.unservedCrit > 1 && !L.warned) { L.warned = true; this.safeError('Cargas críticas sin energía', 'La clínica y el bombeo de agua potable quedaron sin respaldo. En la realidad, esto pone en riesgo la salud y el abastecimiento.', '¿Qué carga flexible seguía encendida? ¿Protegías la reserva?'); this.onSafeRetry = () => { this.ctl.h2 = false; this.ctl.reserve = 0.3; }; }
      if (L.h >= 24) this.evaluate();
    }
  },
  evaluate() {
    let ok, txt;
    if (this.phase === 'guided') {
      const r = this.runDay();
      ok = r.unservedCrit < 1 && r.socEnd >= Math.max(0.3, this.rule.reserve) - 0.005 && this.rule.h2Only;
      txt = ok ? 'Regla robusta: críticas atendidas, SOC al cierre ' + fmt0(r.socEnd * 100) + ' %, H2 ' + fmt(r.h2kg, 1) + ' kg solo con excedente. Vertido ' + fmt0(r.curtailed) + ' kWh.' : !this.rule.h2Only ? 'El electrolizador sigue tirando de la batería: así la batería actúa como "fuente" de H2 y pierde ≈ 10 % en el camino.' : r.unservedCrit >= 1 ? 'Quedaron ' + fmt0(r.unservedCrit) + ' kWh críticos sin servir.' : 'El SOC cerró en ' + fmt0(r.socEnd * 100) + ' %: la reserva no alcanza para mañana temprano.';
      this.evidence('lv6_guided_rule', ok, { solo: 3, misconception: ok ? null : 'tratar la batería como fuente primaria' });
    } else if (this.phase === 'auto') {
      const L = this.live;
      ok = L.unservedCrit < 1 && L.minSoc >= 0.15;
      txt = ok ? '¡Devorador de Reserva vencido! SOC mínimo ' + fmt0(L.minSoc * 100) + ' % y ninguna carga crítica sin servir a pesar de los tres eventos.' : 'SOC mínimo ' + fmt0(L.minSoc * 100) + ' %, críticas sin servir ' + fmt0(L.unservedCrit) + ' kWh. Apagar el H2 y proteger la reserva antes de los eventos marca la diferencia.';
      this.evidence('lv6_guardian_devorador', ok, { solo: 4, misconception: ok ? null : 'usar toda la reserva antes de un evento incierto' });
    } else if (this.phase === 'transfer') {
      const right = BS_STEPS.map(s => s.id);
      ok = this.order.join() === right.join();
      const firstBad = this.order.findIndex((id, i) => id !== right[i]);
      txt = ok ? 'Secuencia correcta: aislar → formar red → críticas → renovables → flexibles → H2. El orden protege la estabilidad y lo esencial.' : 'Paso ' + (firstBad + 1) + ': ' + BS_STEPS.find(s => s.id === right[firstBad]).why;
      this.evidence('lv6_transfer_blackstart', ok, { solo: 5, transfer: true, misconception: ok ? null : 'reconectar todo a la vez tras un apagón' });
    } else { ok = true; txt = 'Datos guardados.'; }
    this.verdict = { ok, txt }; this.done = true; this.running = false;
    Audio2.sfx(ok ? 'success' : 'error');
  },
  draw(g) {
    const ph = this.phase, X0 = 8, Y0 = 28;
    Gui.begin();
    if (ph === 'demo') {
      const b = this.b;
      Charts.battery(g, 60, 60, 70, 180, b.soc, 0, 'SOC');
      drawText(g, fmt0(b.soc * 100) + ' %', 95, 250, { align: 'center', color: '#b6f05a' });
      const p = this.demoT < 4 ? 'CARGANDO 250 kW' : this.demoT < 8 ? 'EN REPOSO' : this.demoT < 12 ? 'DESCARGANDO 250 kW' : 'FIN';
      drawText(g, p, 180, 70, { color: '#ffe14d' });
      drawText(g, 'Energía entrada: ' + fmt0(this.inE) + ' kWh', 180, 90, { color: '#56e5ff' });
      drawText(g, 'Energía salida: ' + fmt0(this.outE) + ' kWh', 180, 104, { color: '#ff9a8a' });
      drawText(g, 'SOC(t+1) = SOC + ηc·Pc·Δt/E − Pd·Δt/(ηd·E)', 180, 130, { color: '#cfd6f0' });
      drawText(g, 'E = 4000 kWh · Pmáx = 1000 kW · ηc = ηd = 0,95', 180, 144, { font: 'tiny', color: '#a6f4ff' });
      Charts.flow(g, [[140, 120], [176, 120]], this.demoT < 4 ? 'power' : 'heat', 1, 3);
      for (let i = 0; i < 6; i++) if (this.demoT < 12) fpx(g, 60 + Math.random() * 70, 60 + Math.random() * 180, '#ff9f43');
    }
    if (ph === 'guided' || ph === 'free') {
      const r = this.res || this.runDay();
      Charts.line(g, X0, Y0, 400, 170, [
        { data: r.series.map(o => [o.h + 0.5, o.gen]), color: '#ffe14d', label: 'generación' },
        { data: r.series.map(o => [o.h + 0.5, o.crit + o.ro + o.irr + o.h2]), color: '#ff9a8a', label: 'carga' },
        { data: r.series.map(o => [o.h + 0.5, o.soc * 1200]), color: '#b6f05a', label: 'SOC×1200' },
      ], { xMin: 0, xMax: 24, yMin: 0, yMax: 1400, legend: true, xLabel: 'h', yLabel: 'kW', hlines: [{ v: this.rule.reserve * 1200, color: '#ffe14d', label: 'reserva' }] });
      const CX = 414, CW = W - CX - 6;
      UIK.panel(g, CX, 28, CW, 200, 'tech');
      drawText(g, 'REGLA DE DESPACHO', CX + 8, 34, { font: 'tiny', color: '#ffe14d' });
      const rv = Gui.slider(g, 'rv', CX + 8, 44, CW - 16, this.rule.reserve, 0.05, 0.6, 0.05, { label: 'Reserva mínima protegida', fmt: v => fmt0(v * 100) + ' %', disabled: this.done && ph !== 'free' });
      if (rv !== this.rule.reserve) { this.rule.reserve = rv; this.runDay(); }
      const ho = Gui.toggle(g, 'ho', CX + 8, 70, 'H2 solo con excedente', this.rule.h2Only); if ((!this.done || ph === 'free') && ho !== this.rule.h2Only) { this.rule.h2Only = ho; this.runDay(); }
      const cf = Gui.toggle(g, 'cf', CX + 8, 86, 'Cargar batería antes que el H2', this.rule.chargeFirst); if ((!this.done || ph === 'free') && cf !== this.rule.chargeFirst) { this.rule.chargeFirst = cf; this.runDay(); }
      drawText(g, 'Desprendimiento: H2 → riego → OI → críticas', CX + 8, 96, { font: 'tiny', color: '#cfd6f0' });
      drawText(g, 'SOC al cierre: ' + fmt0(r.socEnd * 100) + ' %   mín: ' + fmt0(r.socMin * 100) + ' %', CX + 8, 104, { font: 'tiny', color: r.socEnd < 0.3 ? '#ff6b6b' : '#b6f05a' });
      drawText(g, 'Críticas sin servir: ' + fmt0(r.unservedCrit) + ' kWh', CX + 8, 113, { font: 'tiny', color: r.unservedCrit > 0 ? '#ff6b6b' : '#86e36f' });
      drawText(g, 'H2: ' + fmt(r.h2kg, 1) + ' kg   Vertido: ' + fmt0(r.curtailed) + ' kWh', CX + 8, 122, { font: 'tiny', color: '#d8fff8' });
      drawText(g, 'Pérdidas BESS estimadas: ≈ ' + fmt0(r.bess.throughput * 0.05) + ' kWh', CX + 8, 131, { font: 'tiny', color: '#ff9f43' });
      if (ph === 'guided' && !this.done && Gui.button(g, 'ev', CX + 8, 204, 100, 18, 'Simular 24 h', { style: 'good', icon: 'play' })) this.evaluate();
      if (Gui.button(g, 'hintb', CX + CW - 60, 204, 54, 18, 'Pista', { style: 'ghost', icon: 'hint' })) this.hint();
    }
    if (ph === 'auto') this.drawLive(g);
    if (ph === 'transfer') this.drawBlackStart(g);
    if (this.verdict) {
      const v = this.verdict;
      const vh = textHeight(v.txt, 360) + 30;
      UIK.panel(g, 10, H - vh - 8, 380, vh, v.ok ? 'green' : 'alert');
      drawTextBlock(g, v.txt, 18, H - vh - 2, 364, { color: '#fffaf0' });
      if (v.ok) { if (Gui.button(g, 'nxt', 284, H - 28, 100, 16, ph === this.stopAfter ? 'Terminar' : 'Continuar', { style: 'good', icon: 'play' })) { if (ph === this.stopAfter) this.finish(true); else this.nextPhase(); } }
      else if (Gui.button(g, 'rt', 284, H - 28, 100, 16, 'Reintentar', { style: 'gold', icon: 'reset' })) { this.attempts++; GS.s.stats.retries++; if (ph === 'auto' || ph === 'transfer') this.onPhase(ph); else { this.verdict = null; this.done = false; } }
    }
    Gui.end();
  },
  drawLive(g) {
    const L = this.live, h = Math.floor(L.h);
    Charts.battery(g, 40, 50, 80, 200, L.b.soc, this.ctl.reserve, 'BESS');
    drawText(g, fmt0(L.b.soc * 100) + ' %', 80, 262, { align: 'center', color: L.b.soc < this.ctl.reserve ? '#ff6b6b' : '#b6f05a' });
    drawText(g, 'Hora ' + fmt(L.h, 1) + ' / 24', 150, 50, { color: '#cfd6f0' });
    drawText(g, 'Potencia máx. BESS: ' + fmt0(L.b.pmax) + ' kW', 150, 64, { font: 'tiny', color: L.b.pmax < 1000 ? '#ff9f43' : '#a6f4ff' });
    drawText(g, 'Críticas sin servir: ' + fmt0(L.unservedCrit) + ' kWh', 150, 76, { font: 'tiny', color: L.unservedCrit > 0 ? '#ff6b6b' : '#86e36f' });
    drawText(g, 'SOC mínimo: ' + fmt0(L.minSoc * 100) + ' %', 150, 88, { font: 'tiny', color: '#b6f05a' });
    drawText(g, 'H2 exportado: ' + fmt(L.h2, 1) + ' kg', 150, 100, { font: 'tiny', color: '#d8fff8' });
    // línea de tiempo con eventos
    frect(g, 150, 120, 240, 10, '#141d36'); frect(g, 150, 120, 240 * L.h / 24, 10, '#2c63c0');
    for (const [hh, lbl, c] of [[14, 'nube', '#ffe14d'], [19, 'calma', '#8ff5c8'], [21, 'falla', '#ff6b6b']]) { frect(g, 150 + hh * 10, 116, 2, 18, c); drawText(g, lbl, 150 + hh * 10, 136, { font: 'tiny', align: 'center', color: c }); }
    // Devorador
    const ex = 300, ey = 200 + Math.sin(this.t * 2) * 4;
    for (let i = 0; i < 20; i++) { const a = this.t * 2 + i * 0.6; fpx(g, ex + Math.cos(a) * (8 + i % 6), ey + Math.sin(a * 1.2) * 8, ['#5a38b8', '#b6f05a', '#1a1240'][i % 3]); }
    fdisc(g, ex, ey, 6, '#5a38b8'); frect(g, ex - 3, ey - 1, 2, 2, '#e6ffc0'); frect(g, ex + 1, ey - 1, 2, 2, '#e6ffc0');
    drawText(g, 'DEVORADOR', ex, ey - 18, { font: 'tiny', align: 'center', color: '#b6f05a' });
    const CX = 414, CW = W - CX - 6;
    UIK.panel(g, CX, 28, CW, 200, 'tech');
    drawText(g, 'CAMBIO DE RESERVA', CX + 8, 34, { font: 'tiny', color: '#ffe14d' });
    this.ctl.reserve = Gui.slider(g, 'cr', CX + 8, 44, CW - 16, this.ctl.reserve, 0.05, 0.6, 0.05, { label: 'Reserva protegida', fmt: v => fmt0(v * 100) + ' %', disabled: this.done });
    const h2 = Gui.toggle(g, 'h2', CX + 8, 72, 'Electrolizador (600 kW)', this.ctl.h2); if (!this.done) this.ctl.h2 = h2;
    const irr = Gui.toggle(g, 'irr', CX + 8, 90, 'Riego (60 kW)', this.ctl.irr); if (!this.done) this.ctl.irr = irr;
    const ro = Gui.toggle(g, 'ro', CX + 8, 108, 'Ósmosis inversa (300 kW)', this.ctl.ro); if (!this.done) this.ctl.ro = ro;
    drawText(g, 'Críticas: clínica + agua potable (siempre)', CX + 8, 128, { font: 'tiny', color: '#ff6b6b' });
    if (!this.running && !this.done && Gui.button(g, 'go', CX + 8, 204, 90, 18, 'Iniciar', { style: 'good', icon: 'play' })) this.running = true;
  },
  drawBlackStart(g) {
    const X0 = 8, Y0 = 28;
    UIK.panel(g, X0, Y0, W - 16, 240, 'alert');
    drawText(g, 'ARRANQUE EN NEGRO (ABSTRACTO) · ordena los pasos', X0 + 8, Y0 + 6, { font: 'tiny', color: '#ffe14d' });
    const shuffled = this.shuf || (this.shuf = RNG(66).shuffle(BS_STEPS.slice()));
    shuffled.forEach((s, i) => {
      const k = this.order.indexOf(s.id);
      const y = Y0 + 20 + i * 30;
      if (Gui.button(g, 'bs' + s.id, X0 + 8, y, 360, 26, (k >= 0 ? (k + 1) + '. ' : '') + s.label, { style: k >= 0 ? 'good' : 'ghost', align: 'left', disabled: this.done })) { if (k >= 0) this.order = this.order.slice(0, k); else this.order.push(s.id); Audio2.sfx('ui'); }
    });
    // diagrama: red unifilar que se energiza por pasos
    const dx = 400, dy = Y0 + 30;
    const lit = (id) => this.order.includes(id);
    frect(g, dx, dy + 80, 200, 4, lit('form') ? '#b6f05a' : '#3a1a20');
    const node = (x, y, lbl, on, icon) => { UIK.panel(g, x - 34, y - 12, 68, 24, on ? 'green' : 'tech'); Icons.draw(g, icon, x - 30, y - 8); drawText(g, lbl, x - 12, y - 3, { font: 'tiny', color: '#fffaf0' }); };
    node(dx + 30, dy + 40, 'BESS', lit('form'), 'battery'); node(dx + 110, dy + 40, 'RENOV.', lit('ren'), 'sun'); node(dx + 190, dy + 40, 'H2', lit('h2'), 'h2'); node(dx + 70, dy + 130, 'CRÍT.', lit('crit'), 'heart'); node(dx + 150, dy + 130, 'OI+RIEGO', lit('flex'), 'water');
    for (const nx of [30, 110, 190]) frect(g, dx + nx, dy + 52, 2, 28, lit('form') ? '#b6f05a' : '#3a1a20'); for (const nx of [70, 150]) frect(g, dx + nx, dy + 84, 2, 34, lit('form') ? '#b6f05a' : '#3a1a20');
    drawText(g, lit('iso') ? 'Red aislada (OK)' : 'Interruptores cerrados', dx, dy, { font: 'tiny', color: lit('iso') ? '#86e36f' : '#ff9a8a' });
    if (!this.done && this.order.length === BS_STEPS.length && Gui.button(g, 'ev', W - 150, Y0 + 214, 130, 18, 'Ejecutar secuencia', { style: 'good', icon: 'play' })) this.evaluate();
  },
});
