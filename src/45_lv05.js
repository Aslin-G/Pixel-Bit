/* =====================================================================
   45_lv05.js — NIVEL 05: LAS TORRES DE BRISA
   Corredor eólico, acantilados y estaciones meteorológicas.
   RA-04 · Vela de Brisa · Guardián: Ráfaga Umbral
   Pista: OUTLIER_CLEAN (los pronósticos borraron los extremos).
   ===================================================================== */

const WIND_TURBINES = [760, 900, 1040, 1180];

LEVELS[5] = {
  id: 5, title: 'Las Torres de Brisa', chapter: 'CAPÍTULO 05', biome: 'windcliffs', music: 'wind', width: 3000, height: 360,
  ambience: { wind: 0.9, sea: 0.4, birds: 0.5 },
  portraits: ['amaya', 'kiru', 'dante', 'nimbo', 'naira'],
  spawn: { x: 60, y: 280 },
  checkpoints: { station: { x: 1640, y: 262 }, edge: { x: 2240, y: 250 } },
  ground: [[0, 280], [300, 276], [420, 270], [428, 430, 'lin'], [620, 430], [628, 262, 'lin'], [1300, 252], [1308, 430, 'lin'], [1560, 430], [1568, 262, 'lin'], [1900, 262], [2100, 254], [2400, 248], [2700, 252], [3000, 246]],
  terrain: [{ x0: 0, x1: 3000, mat: 'grassland' }],
  platforms: [{ x: 500, y: 226, w: 40, type: 'rock' }, { x: 1420, y: 210, w: 44, type: 'rock' }, { x: 1720, y: 200, w: 120, type: 'metal' }],
  ladders: [{ x: 1730, y0: 200, y1: 262 }],
  wind: [
    { x: 432, y: 120, w: 186, h: 320, fx: 40, fy: -170 },
    { x: 1312, y: 120, w: 246, h: 320, fx: 70, fy: -150 },
  ],
  cam: { look: 60, vy: 0.66 },
  decorate(pb, world) {
    // bordes de acantilado gris perla con estratos
    for (const [x0, x1] of [[420, 428], [620, 628], [1300, 1308], [1560, 1568]]) for (let x = x0 - 6; x < x1 + 6; x++) for (let y = 250; y < 360; y++) if (pb.alpha(x, y) && ((y + x) % 7 === 0)) pb.set(x, y, '#94a6b4');
  },
  /* ---------------- accesorios estáticos ---------------- */
  props(pb, world) {
    const gy = (x) => world.groundAt(x);
    for (let x = 10; x < 420; x += 13) ART.grass(pb, x, gy(x), 3 + (x % 3), x, RAMP.mangrove);
    // estación meteorológica de Nimbo con cometas en tierra
    pb.rect(220, gy(220) - 40, 50, 40, '#f6fcf6'); pb.rect(220, gy(220) - 40, 50, 3, '#e34ad8'); pb.rect(230, gy(220) - 30, 12, 10, '#1a2a4a');
    pb.vline(262, gy(220) - 70, gy(220) - 40, '#c8d8e8'); for (const [dx, c] of [[-6, '#e34ad8'], [6, '#56e5ff']]) { pb.disc(262 + dx, gy(220) - 70, 2, c); }
    drawSign(pb, 150, gy(150), 'ESTACIÓN NIMBO', '#e34ad8');
    // meseta con aerogeneradores (bases)
    for (const x of WIND_TURBINES) { pb.rect(x - 7, gy(x) - 4, 14, 4, '#94a6b4'); pb.rect(x - 5, gy(x) - 6, 10, 2, '#b8c6d0'); }
    drawSign(pb, 700, gy(700), 'PARQUE EÓLICO NORTE', '#1e4aa8');
    // estación meteorológica 2 (laboratorio de Dante)
    const sx = 1700;
    pb.rect(sx, 200, 170, 62, '#f6fcf6'); pb.rect(sx, 200, 170, 4, '#8ff5c8'); pb.rect(sx + 166, 200, 4, 62, '#b8c6d0');
    for (let k = 0; k < 4; k++) { pb.rect(sx + 10 + k * 40, 212, 28, 18, '#1a2a4a'); pb.rect(sx + 10 + k * 40, 212, 28, 2, '#6aa0b4'); }
    pb.vline(sx + 150, 120, 200, '#c8d8e8'); pb.rect(sx + 140, 130, 20, 3, '#e8f0f4'); pb.ellipse(sx + 150, 120, 6, 3, '#f6fcf6');
    drawSign(pb, sx + 85, 200, 'METEOROLOGÍA', '#1e4aa8');
    // borde de acantilado: mástil aguas arriba y control del parque
    pb.rect(2340, gy(2340) - 46, 40, 46, '#e8f0f4'); pb.rect(2340, gy(2340) - 46, 40, 3, '#e34ad8'); pb.rect(2346, gy(2340) - 38, 28, 14, '#0a1030');
    drawSign(pb, 2360, gy(2360) - 46, 'CONTROL PARQUE', '#e34ad8');
    for (let x = 2450; x < 3000; x += 30) ART.grass(pb, x, gy(x), 3, x, RAMP.mangrove);
    drawSign(pb, 2940, gy(2940), 'BÓVEDA DE CARGA', '#2c63c0');
  },
  propsFront(pb, world) { for (let x = 0; x < 3000; x += 5) if ((x * 7) % 5 < 2 && world.groundAt(x) < 300) ART.grass(pb, x, world.groundAt(x) + 2, 2, x, RAMP.mangrove); },
  /* ---------------- dinámico ---------------- */
  renderBack(g, sc, cam) {
    const S = sc.state, t = Game.time;
    // abismos: bruma en bandas translúcidas (sin tramado) sobre el mar del panorama, rociones y espuma al fondo
    const MIST = ['#f2f6fa', '#dce6ee', '#c4d4e2', '#a8c0d6', '#8cacca'];
    for (const [x0, x1] of [[420, 628], [1300, 1568]]) {
      const sx = x0 - cam.x, sw = x1 - x0;
      if (sx > W || sx + sw < 0) continue;
      for (let i = 0; i < 5; i++) { g.globalAlpha = 0.55 - i * 0.09; frect(g, sx, 250 + i * 14 - cam.y, sw, 14, MIST[i]); }
      g.globalAlpha = 0.22; for (let i = 0; i < 6; i++) frect(g, sx + ((t * 10 + i * 40) % sw), 276 - cam.y + i * 6, 40, 3, '#ffffff');
      g.globalAlpha = 1;
      for (let x = 0; x < sw; x += 3) fpx(g, sx + x, H - 12 - cam.y + Math.round(Math.sin(x * 0.2 + t * 2)), '#e4f6fc');
    }
    // cometas del Capitán Nimbo (sprites VISTA) atadas a la estación
    const kites = [0, 1, 2].map(i => ({ x: 240 + i * 26, y: 120 + i * 18, col: ['#e34ad8', '#56e5ff', '#ffe14d'][i], sp: 0.8, ph: i, tail: 10 }));
    for (let i = 0; i < 3; i++) { const K = kites[i]; fline(g, K.x - cam.x + Math.sin(t * 0.8 + i) * 10, K.y - cam.y + 5 + Math.sin(t * 1.1 + i * 2) * 5, 262 - cam.x, 210 - cam.y, '#fffaf0'); }
    VISTA.drawKites(g, kites, -cam.x, -cam.y, t);
  },
  renderMid(g, sc, cam) {
    const S = sc.state, t = Game.time, w = sc.world;
    S.ang = S.ang || 0;
    const v = S.wind ?? 11;
    const rot = S.parkStopped ? 0 : clamp(WindModel.power(v) / 500, 0, 1) * 3.5 + (v > 3 ? 0.6 : 0);
    S.ang += rot * Game.dt;
    for (const x of WIND_TURBINES) {
      const sx = x - cam.x; if (sx < -80 || sx > W + 80) continue;
      ART.turbine(g, sx, w.groundAt(x) - cam.y - 4, 110, S.ang + x * 0.01, { col: '#ffffff', shade: '#c8d8e8', tips: true, stopped: S.parkStopped });
    }
    // estelas visibles: líneas de viento ralentizadas detrás de cada turbina
    if (sc.lensT > 0 || S.showWake) for (const x of WIND_TURBINES) for (let k = 0; k < 6; k++) { const ph = (t * 0.8 + k / 6) % 1; const xx = x + 20 + ph * 120 - cam.x, yy = w.groundAt(x) - 114 - cam.y + Math.sin(ph * 6 + k) * (4 + ph * 14); fpx(g, xx, yy, '#ffffff'); }
    // anemómetros desplegados: cazoletas girando
    for (const id of ['anemo1', 'anemo2', 'anemo3']) { const st = w.find(id); if (!st || !st.done) continue; const ax = st.x - cam.x, ay = w.groundAt(st.x) - cam.y; frect(g, ax, ay - 40, 1, 40, '#c8d8e8'); const a = t * (2 + v * 0.3); for (let k = 0; k < 3; k++) { const aa = a + k * TAU / 3; fdisc(g, ax + Math.cos(aa) * 5, ay - 42 + Math.sin(aa) * 2, 1.5, '#e34ad8'); } frect(g, ax - 3, ay - 34, 7, 2, '#56e5ff'); }
    // pantalla de control del parque
    const cx = 2346 - cam.x, cy = w.groundAt(2340) - 38 - cam.y;
    drawText(g, fmt(v, 1) + ' m/s', cx + 14, cy + 4, { font: 'tiny', align: 'center', color: v >= 25 ? '#ff4e5d' : '#8ff5c8' });
  },
  lens(g, sc, cam, k) {
    const S = sc.state, ox = cam.x, oy = cam.y, w = sc.world;
    lensBoundary(g, 700 - ox, 120 - oy, 560, 140, '#ffe14d', 'LÍMITE: PARQUE EÓLICO NORTE');
    const v = S.wind ?? 11;
    const farm = WindModel.farm(v, WIND_TURBINES.map((x, i) => ({ x: (x - 760) / 30, y: 0 })));
    farm.turbines.forEach((tb, i) => lensTag(g, WIND_TURBINES[i] - 30 - ox, w.groundAt(WIND_TURBINES[i]) - 150 - oy, 'v ' + fmt(tb.v, 1) + ' · ' + fmt0(S.parkStopped ? 0 : tb.P) + ' kW', i ? '#ff9a8a' : '#8ff5c8', 'wind'));
    lensTag(g, 760 - ox, 250 - oy, 'Estela: turbinas alineadas a ~5 D pierden viento', '#cdeefa', 'turbine');
    lensTag(g, 440 - ox, 140 - oy, 'Corriente ascendente: planea (mantén SALTAR)', '#8ff5c8', 'wind');
  },
  hud(g, sc) {
    const S = sc.state;
    if (!S.hud) return;
    const v = S.wind ?? 11, P = S.parkStopped ? 0 : WindModel.power(v) * 4;
    hudGauges(g, [
      { icon: 'wind', label: 'VIENTO', value: fmt(v, 1) + ' m/s', frac: v / 30, color: v >= 25 ? '#ff4e5d' : '#8ff5c8' },
      { icon: 'turbine', label: 'PARQUE', value: fmt0(P) + ' kW', frac: P / 2000, color: '#ffffff' },
      { icon: 'sensor', label: 'ANEMÓMETROS', value: (S.anemo || 0) + ' / 3', frac: (S.anemo || 0) / 3, color: '#e34ad8' },
    ]);
  },
  /* ---------------- guion ---------------- */
  setup(sc, p) {
    const S = sc.state;
    Object.assign(S, { hud: true, wind: 11, anemo: 0, parkStopped: false });
    const nimbo = sc.actor('nimbo', 'nimbo', 300, { facing: -1 });
    const dante = sc.actor('dante', 'dante', 1790, { facing: -1, y: 200 });
    const naira = sc.actor('naira', 'naira', 2300, { facing: -1 });
    dante.y = 262;
    sc.world.add(new Pickup({ kind: 'echo', x: 525, y: 190, onPick: () => kiruEcho(sc, 'l5a', 'KIRU: "Planear sobre el vacío… una niña me lanzó una vez desde un techo para probar mis orejas solares."') }));
    sc.world.add(new Pickup({ kind: 'echo', x: 1440, y: 170, onPick: () => kiruEcho(sc, 'l5b', 'KIRU: "Bloque de memoria sin índice: 7,3 MB. Etiqueta: NO_BORRAR. ¿Quién me pidió no borrarlo?"') }));
    for (const [x, y] of [[860, 180], [1100, 170], [2500, 200]]) sc.world.add(new Adversary({ type: 'gust', x, y, range: 50, speed: 30 }));
    nimbo.onTalk = async (sc2) => {
      if (!S.metNimbo) {
        S.metNimbo = true;
        await sc2.say([
          ['nimbo', 'happy', '¡Bienvenidas a las Torres de Brisa! Aquí el viento tiene opiniones fuertes.'],
          ['nimbo', 'thinking', 'Los pronósticos de SYNARA dicen "viento estable, máximo 18 m/s". Mis cometas dicen otra cosa: ayer una ráfaga me arrancó dos.'],
          ['amaya', 'determined', 'Entonces midamos. ¿Dónde pongo anemómetros?'],
          ['nimbo', 'smile', 'Uno aquí, uno en la meseta de las turbinas y uno en el borde del acantilado, aguas arriba: ese ve venir las ráfagas antes que nadie.'],
        ]);
        sc2.world.find('anemo1').hidden = false; sc2.world.find('anemo2').hidden = false; sc2.world.find('anemo3').hidden = false;
        sc2.setObjective('Despliega el primer anemómetro junto a la estación de Nimbo', ['¿Por qué medir en varios puntos?', 'El mástil está a la izquierda de Nimbo.']);
        Codex.unlock('p_nimbo');
      } else if (!GS.lp(5).side.kites) await sideKites(sc2);
      else await sc2.say([['nimbo', 'happy', '¡Vuela bajo y lee el viento! Las cometas nunca mienten; a veces exageran.']]);
    };
    dante.onTalk = async (sc2) => { if (!S.simStage) await sc2.say([['dante', 'joy', 'Llegaste planeando. Eso fue lo más genial que he visto esta semana. El gemelo eólico está en la consola del laboratorio.']]); else await sc2.say([['dante', 'worried', 'OUTLIER_CLEAN… 312 ráfagas borradas. Si el modelo nunca vio una ráfaga, nunca la va a esperar.']]); };
    naira.onTalk = async (sc2) => sideBirds(sc2);
    const mast = (id, x, n) => sc.station({ id, x, kind: 'sensor', label: 'Desplegar anemómetro ' + n, glow: '#e34ad8', hidden: true, draw: (g, sx, sy, st) => { if (st.done) return; frect(g, sx - 1, sy - 30, 2, 30, '#94a6b4'); frect(g, sx - 6, sy - 4, 12, 4, '#56687a'); if (Math.floor(Game.time * 2) % 2) fpx(g, sx, sy - 32, '#e34ad8'); }, onUse: async (sc2, st) => deployAnemo(sc2, st, n) });
    mast('anemo1', 200, 1); mast('anemo2', 1250, 2); mast('anemo3', 2290, 3);
    sc.station({ id: 'windSim', x: 1790, y: 200, kind: 'sim', label: 'Gemelo eólico', glow: '#8ff5c8', hidden: true, onUse: async (sc2, st) => windFlow(sc2, st) });
    sc.station({ id: 'park', x: 2360, kind: 'terminal', label: 'Control del parque', glow: '#ff4e5d', hidden: true, onUse: async (sc2, st) => parkFlow(sc2, st) });
    sc.station({ id: 'solo', x: 2600, kind: 'solo', label: 'Puerta de Evidencia', glow: '#b49cff', hidden: true, onUse: async (sc2, st) => {
      const r = await sc2.open(SOLOScene, { ctx: 'RA-04-C2' });
      st.progress = r.correct; if (r.correct >= 3) { st.done = true; GS.lp(5).solo = true; S.soloDone = true; Codex.unlock('estela'); }
    } });
    sc.station({ id: 'exit', x: 2950, kind: 'clue', label: 'Ir a la Bóveda de Carga', glow: '#ffe14d', hidden: true, onUse: async (sc2) => finishLevel5(sc2) });
    sc.setObjective('Habla con el Capitán Nimbo en su estación', ['¿Qué dicen los pronósticos y qué dicen las cometas?', 'Nimbo está junto a las cometas, a la derecha.']);
    Codex.unlock('curva_potencia');
    if (p.checkpoint === 'station') { Object.assign(S, { metNimbo: true, anemo: 2 }); GS.giveTool('vela', true); for (const id of ['anemo1', 'anemo2']) { const st = sc.world.find(id); st.hidden = false; st.done = true; } sc.world.find('anemo3').hidden = false; sc.world.find('windSim').hidden = false; sc.setObjective('Usa el Gemelo eólico del laboratorio', []); }
    if (p.checkpoint === 'edge') { Object.assign(S, { metNimbo: true, anemo: 2, simStage: 'edge' }); GS.giveTool('vela', true); GS.addClue('outlierClean'); for (const id of ['anemo1', 'anemo2']) { const st = sc.world.find(id); st.hidden = false; st.done = true; } sc.world.find('anemo3').hidden = false; sc.world.find('park').hidden = false; sc.setObjective('Despliega el anemómetro del acantilado y toma el control del parque', []); }
  },
  update(sc, dt) {
    const S = sc.state;
    // viento ambiente con rachas visibles
    S.wind = 11 + Math.sin(Game.time * 0.3) * 2.5 + Math.max(0, Math.sin(Game.time * 1.7)) * 2 + (S.gustBoost || 0);
    sc.backdrop.weather.wind = 1 + S.wind / 10;
    ambientParticles(sc.world.ps, 'windline', sc.cam, 0.6 + S.wind / 20, 1);
    for (const z of sc.world.wind) z.on = GS.hasTool('vela');
  },
  triggers: [
    { x: 400, w: 20, run: (sc) => { if (!GS.hasTool('vela')) sc.kiru && sc.kiru.say('Un abismo con corriente ascendente. Sin la Vela de Brisa no lo cruzamos. Nimbo la tiene.', 'confundido', 4); }, repeat: true },
    { x: 640, w: 40, run: (sc) => { sc.kiru && sc.kiru.say('Esos remolinos grises son Gust Loops: extrapolan el viento sin límites. Corrígelos con {y}Q{/}.', 'alarmado', 4); } },
  ],
};

/* ---------------- piezas del guion del nivel 05 ---------------- */
async function deployAnemo(sc, st, n) {
  const S = sc.state;
  if (st.done) return;
  st.done = true; S.anemo++; Audio2.sfx('confirm'); GS.s.sensors++;
  LearningModel.note('sample');
  if (n === 1) {
    await sc.say([
      ['kiru', 'happy', 'Anemómetro 1 en línea: ' + fmt(S.wind, 1) + ' m/s, rachas de hasta ' + fmt(S.wind + 4, 1) + '. El promedio esconde las rachas.'],
      ['nimbo', 'joy', '¡Toma! Te presto mi {c}Vela de Brisa{/}. Mantén SALTAR en el aire para planear y deja que la corriente te suba.'],
    ]);
    GS.giveTool('vela');
    Game.toast('Herramienta: {c}Vela de Brisa{/} (mantén Saltar en el aire)', 'wind', '#8ff5c8', 4);
    sc.setObjective('Cruza el acantilado planeando y despliega el anemómetro de la meseta', ['¿Hacia dónde empuja la corriente?', 'Salta al borde y mantén SALTAR: la corriente ascendente te eleva.', 'Despliega el mástil junto a la última turbina.']);
  } else if (n === 2) {
    await sc.say([['kiru', 'curioso', 'Anemómetro 2: detrás de la primera turbina el viento baja un 25 %. Estelas. Mira con la Lente (N).']]);
    sc.world.find('windSim').hidden = false;
    sc.setObjective('Cruza el segundo acantilado y ve al laboratorio meteorológico', ['Dante espera en el laboratorio.', 'Esta corriente empuja hacia la derecha: aprovéchala.']);
  } else {
    await sc.say([['kiru', 'alarmado', 'Anemómetro 3 (aguas arriba): {o}rachas de 24 m/s y subiendo{/}. Este mástil ve las ráfagas unos minutos antes que las turbinas.']]);
    if (S.simStage === 'edge') sc.world.find('park').hidden = false;
  }
}
async function windFlow(sc, st) {
  const S = sc.state;
  if (!S.simStage) {
    const r = await sc.open(Sim05, { phase: 'demo', stopAfter: 'guided' });
    if (!r || !r.ok) return;
    S.simStage = 'log';
    await sc.say([
      ['dante', 'thinking', 'Espera. Revisé con qué datos se entrenó el pronóstico de SYNARA. Hay una etiqueta en el preprocesamiento…'],
      ['kiru', 'thinking', 'Registro: {y}OUTLIER_CLEAN{/} — 312 eventos con viento > 22 m/s eliminados como "ruido de sensor". Versión de entrega 0.9.'],
      ['dante', 'surprised', '¡Esas no eran fallas de sensor! Las cometas de Nimbo las vieron. Eran ráfagas reales.'],
      ['amaya', 'sad', '…Yo aprobé esa limpieza.'],
      ['narr', null, 'Recuerdo: madrugada, laboratorio vacío, la entrega a las 8:00. El modelo no convergía. "Valores extremos: ¿eliminar? S/N." Amaya pulsó S.'],
      ['amaya', 'sad', 'Quería entregar a tiempo. Pensé que eran errores. Nunca fui a preguntarle a nadie que viviera aquí.'],
      ['dante', 'worried', 'Ey. Lo importante es que ahora sí lo sabemos.'],
      ['kiru', 'worried', 'Si el modelo nunca vio una ráfaga, nunca la va a esperar. Y viene una. El anemómetro del acantilado podría avisarnos.'],
    ]);
    GS.addClue('outlierClean'); GS.flag('foundOutlierDeletion', true);
    Game.toast('Tablero de evidencias: pistas reinterpretadas', 'eye', '#7ee8f0', 4);
    S.simStage = 'edge';
    sc.world.find('park').hidden = false;
    GS.save('edge');
    sc.setObjective('Despliega el anemómetro del acantilado y toma el control del parque', ['¿Qué ve un mástil aguas arriba que la turbina todavía no?', 'El borde del acantilado está a la derecha del laboratorio.', 'Despliega el mástil 3 y usa el Control del parque.']);
    return;
  }
  await sc.open(Sim05, { phase: 'free', stopAfter: 'free' });
}
async function parkFlow(sc, st) {
  const S = sc.state;
  if (S.simStage === 'edge') {
    if (!sc.world.find('anemo3').done) { await sc.say([['kiru', 'curioso', 'Sin el anemómetro del acantilado no veremos venir la ráfaga. Despliégalo primero: está a tu izquierda.']]); return; }
    S.gustBoost = 6;
    const r = await sc.open(Sim05, { phase: 'auto', stopAfter: 'auto', lead: 3 });
    S.gustBoost = 0;
    if (!r || !r.ok) { sc.kiru && sc.kiru.say('Las turbinas aguantaron en el gemelo, pero no deberíamos tentar a la suerte. Reintentemos.', 'valiente'); return; }
    GS.lp(5).guardian = true; S.simStage = 'explain';
    const ok = await explain(sc, {
      id: 'lv5_explain', ra: 'RA-04', concepts: ['wind', 'microgrid'],
      prompt: 'MIRAGE calculaba que a 28 m/s el parque produciría (28/12)³ ≈ 12,7 veces la potencia nominal. ¿Por qué esa extrapolación es incorrecta y por qué detuviste las turbinas?',
      options: [
        'La relación cúbica solo vale entre el arranque y la velocidad nominal; luego la potencia se limita a la nominal y sobre el cut-out (25 m/s) la turbina debe detenerse por seguridad, así que más viento puede exigir menos producción.',
        'Porque a 28 m/s la turbina produce exactamente 12,7 veces más, pero se calienta demasiado.',
        'Porque el viento fuerte siempre es peligroso, incluso a 8 m/s.',
        'Porque las turbinas solo funcionan de noche.'],
      key: 0, mis: 'extrapolar v³ más allá de la potencia nominal',
      why: 'La curva de potencia tiene tramos: arranque (~3 m/s), crecimiento ~v³, potencia nominal (12 m/s) y parada (25 m/s). Las ráfagas sobre el límite cargan la estructura: detener protege la máquina y la red. Un pronóstico sin extremos no prepara para esa parada.',
      whyNot: { 1: 'Ninguna turbina supera su potencia nominal: el control la limita.', 2: 'A 8 m/s la turbina opera con normalidad; el límite de seguridad está en el cut-out.', 3: 'Las turbinas funcionan cuando hay viento suficiente, de día o de noche.' },
    });
    if (ok) S.explained = true;
    const r2 = await sc.open(Sim05, { phase: 'transfer', stopAfter: 'transfer' });
    if (r2 && r2.ok) GS.lp(5).variant = true;
    S.simStage = 'done';
    await sc.say([
      ['naira', 'calm', 'Amaya. Borrar las ráfagas fue un error. Pero hoy las mediste, las esperaste y detuviste las turbinas a tiempo. Eso también es tuyo.'],
      ['amaya', 'tired', 'Hay más, Naira. Si limpié el viento… ¿qué más limpié?'],
      ['kiru', 'worried', 'La Bóveda de Carga guarda los registros de despacho y limpieza de datos. Si hay respuestas, están allí.'],
    ]);
    sc.world.find('solo').hidden = false; sc.world.find('exit').hidden = false;
    sc.setObjective('Abre la Puerta de Evidencia y ve a la Bóveda de Carga', ['La salida está al final del acantilado.']);
    return;
  }
  if (S.simStage === 'done' || S.simStage === 'explain') { await sc.open(Sim05, { phase: 'free', stopAfter: 'free' }); return; }
  await sc.say([['kiru', 'curioso', 'El control del parque está bloqueado hasta que el laboratorio valide el pronóstico.']]);
}
async function finishLevel5(sc) {
  const S = sc.state;
  if (S.simStage !== 'done') { sc.kiru && sc.kiru.say('Primero, la ráfaga.', 'confundido'); return; }
  if (!S.soloDone) { const c = await sc.say([['kiru', 'curioso', 'La Puerta de Evidencia aún no registra tu razonamiento. ¿Seguimos?', { choices: ['Volver a la Puerta de Evidencia', 'Seguir (se puede completar desde el mapa)'] }]]); if (c === 0) return; }
  await completeLevel(sc);
  Game.transition(() => Game.setScene(WorldMapScene, { focus: 6 }));
}
async function sideKites(sc) {
  const lp = GS.lp(5);
  await sc.say([['nimbo', 'thinking', 'Prueba de cometas: a 10 m de altura mido 7 m/s; a 80 m, 10 m/s. ¿Por qué creen que los rotores modernos están tan altos?']]);
  const c = await sc.say([['amaya', 'thinking', 'Si la potencia crece ~v³ bajo la nominal, pasar de 7 a 10 m/s…', { choices: ['…casi triplica la potencia disponible: por eso conviene subir el buje', '…aumenta la potencia un 43 %, igual que la velocidad', '…no cambia nada: la altura solo importa para los pájaros'] }]]);
  const ok = c === 0;
  LearningModel.record({ kind: 'challenge', id: 'side_cometas_nimbo', ra: 'RA-04', concepts: ['wind', 'steamInquiry'], solo: 3, correct: ok, misconception: ok ? null : 'creer que la potencia eólica es proporcional a la velocidad' });
  if (ok) { lp.side.kites = true; Audio2.sfx('success'); await sc.say([['nimbo', 'joy', '(10/7)³ ≈ 2,9. ¡Exacto! El viento cerca del suelo se frena con el terreno: arriba sopla más y más parejo.'], ['kiru', 'happy', 'Dentro de la curva, claro. Sobre la nominal ya no crece.']]); }
  else await sc.say([['nimbo', 'skeptical', 'La potencia del viento depende del cubo de la velocidad. Haz la cuenta: (10/7)³.']]);
}
async function sideBirds(sc) {
  const lp = GS.lp(5);
  if (lp.side.birds) { await sc.say([['naira', 'smile', 'Los flamencos ya pasaron. La turbina 4 volvió a girar.']]); return; }
  await sc.say([['naira', 'thinking', 'Al amanecer pasa por aquí el corredor de los flamencos hacia las salinas. La turbina 4 está justo en su ruta.']]);
  const c = await sc.say([['amaya', 'thinking', '¿Qué hacemos con la turbina 4?', { choices: ['Pararla durante la hora de paso y medir el efecto en la producción', 'Nada: la energía es prioritaria', 'Desmontar todo el parque'] }]]);
  const ok = c === 0;
  LearningModel.record({ kind: 'challenge', id: 'side_corredor_flamencos', ra: 'RA-04', concepts: ['wind', 'ethics'], solo: 4, correct: ok, misconception: ok ? null : 'ignorar impactos ecológicos de la generación' });
  if (ok) { lp.side.birds = true; GS.trust('community', 6); Audio2.sfx('success'); await sc.say([['kiru', 'esperanzado', 'Parada selectiva: −2 % de energía diaria, riesgo para aves mucho menor. Un buen intercambio, y medible.']]); }
  else await sc.say([['naira', 'skeptical', 'Hay opciones entre "nada" y "todo". ¿Cuánto cuesta parar una turbina una hora?']]);
}

/* =====================================================================
   Gemelo eólico: curva de potencia, estelas, ráfagas y pronóstico
   ===================================================================== */
function gustSeries() {
  // 120 min: viento creciente con dos ráfagas sobre el cut-out (supuesto de simulación)
  const s = [];
  for (let m = 0; m <= 120; m++) {
    let v = 11 + m * 0.07 + Math.sin(m * 0.4) * 1.2 + Math.sin(m * 1.3) * 0.8;
    v += 13 * Math.exp(-Math.pow((m - 72) / 5, 2)) + 9 * Math.exp(-Math.pow((m - 98) / 3, 2));
    s.push(v);
  }
  return s;
}
const Sim05 = makeSim({
  title: 'GEMELO EÓLICO · curva de potencia, estelas y ráfagas', icon: 'wind', ra: 'RA-04', concepts: ['wind', 'microgrid'],
  phases: ['demo', 'guided', 'auto', 'transfer', 'free'],
  hintLadder: ['¿Qué le pasa al viento detrás de una turbina?', 'La estela pierde velocidad y se recupera con la distancia; una fila lateral distinta no recibe estela.', 'Coloca turbinas en filas distintas o separadas ≥ 12 diámetros en la misma fila.'],
  init(p) {
    this.stopAfter = p.stopAfter || 'free'; this.lead = p.lead ?? 3;
    this.layout = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 8, y: 0 }, { x: 12, y: 0 }];
    this.selT = 0; this.v = 9; this.reserve = 0.3; this.h2n = 120;
  },
  onPhase(ph) {
    this.verdict = null; this.done = false;
    if (ph === 'demo') { this.v = 0; this.say('Demostración: subo el viento de 0 a 30 m/s. La curva real (blanca) arranca a 3 m/s, crece hasta la nominal a 12 m/s, se aplana y {o}se corta a 25 m/s{/}. La línea rosa es la extrapolación v³ que usa MIRAGE.'); }
    if (ph === 'guided') { this.v = 9; this.say('Tu turno: el viento llega desde la izquierda a 9 m/s. Reubica las 4 turbinas (clic en una turbina y luego en una celda) para que las pérdidas por estela sean ≤ 6 %. La parcela solo tiene 3 filas.'); }
    if (ph === 'auto') { this.series = gustSeries(); this.m = 0; this.running = false; this.stopped = false; this.energy = 0; this.maxEnergy = 0; this.damage = 0; this.badRestart = 0; this.log = []; this.say('Ráfaga Umbral: el pronóstico de MIRAGE (sin extremos) dice "máximo 19 m/s". El anemómetro del acantilado mide el viento ' + this.lead + ' minutos antes de que llegue. La parada automática fue desactivada para "maximizar producción". Decide tú.'); }
    if (ph === 'transfer') { this.say('Transferencia: despacho nocturno con pronóstico incierto. Elige la reserva protegida de la batería y cuánta electrólisis programar. Se probarán tres noches posibles: calma, viento moderado y ráfagas con paradas.'); }
    if (ph === 'free') { this.v = 10; this.say('Laboratorio libre.'); }
  },
  farm() { return WindModel.farm(this.v, this.layout); },
  step(dt) {
    if (this.phase === 'demo') { this.v = Math.min(30, this.v + dt * 3.5); if (this.v >= 30 && !this.verdict) this.verdict = { ok: true, txt: 'A 28 m/s la extrapolación v³ promete 12,7 × la nominal; la turbina real produce {o}cero{/}: se detiene para protegerse. Más viento no siempre es más energía.' }; return; }
    if (this.phase === 'auto' && this.running && !this.done) {
      const dm = dt * 2 * (Input.down('fast') ? 2 : 1);
      this.m += dm;
      const v = this.series[Math.min(120, Math.floor(this.m))];
      const P = this.stopped ? 0 : WindModel.power(v) * 4 * (v >= 25 ? 0 : 1);
      this.energy += P * dm / 60; this.maxEnergy += (v < 25 ? WindModel.power(v) * 4 : 0) * dm / 60;
      if (!this.stopped && v >= 25) { this.damage++; this.safeError('Sobrevelocidad en ráfaga', 'Las turbinas siguieron girando con ' + fmt(v, 1) + ' m/s, sobre el límite de 25 m/s. En la realidad, las cargas en palas y torre pueden causar daños graves y una salida de la red.', '¿Qué mostraba el anemómetro del acantilado unos minutos antes?'); this.onSafeRetry = () => { this.stopped = true; }; }
      if (this.m >= 120) this.evaluate();
    }
  },
  toggleStop() {
    const v = this.series[Math.min(120, Math.floor(this.m))];
    if (this.stopped) { if (v > 20) { this.badRestart++; this.say('{o}Rearranque prematuro:{/} con ' + fmt(v, 1) + ' m/s (> 20 m/s) la turbina volvería a cortarse. Espera a que baje el viento (histéresis).'); return; } this.stopped = false; Audio2.sfx('power'); this.log.push({ m: this.m, a: 'arranque' }); }
    else { this.stopped = true; Audio2.sfx('valve'); this.log.push({ m: this.m, a: 'parada' }); }
  },
  nightRun(sc, reserve, h2kW) {
    // 12 h de noche: crítica 80 kW, batería 1400 kWh desde 90 %
    const scen = { calma: Array(12).fill(1.5), moderado: Array(12).fill(8.5), rafagas: Array.from({ length: 12 }, (_, i) => i % 3 === 1 ? 26 : 14) }[sc];
    let soc = 0.9, unserved = 0, h2 = 0; const CAP = 1400;
    for (let h = 0; h < 12; h++) {
      const gen = WindModel.power(scen[h]) * 2;
      let load = 70, flex = h2kW;
      const avail = (soc - reserve) * CAP * 0.95;
      const need = load + flex - gen;
      if (need > 0) {
        const fromFlex = Math.min(flex, Math.max(0, need - Math.max(0, avail)));
        flex -= fromFlex;
        const need2 = load + flex - gen;
        const dis = Math.min(need2, Math.max(0, (soc - 0.1) * CAP * 0.95), 300);
        soc -= dis / (CAP * 0.95);
        if (need2 - dis > 0.5) unserved += need2 - dis;
      } else soc = Math.min(0.95, soc + Math.min(-need, 300) * 0.95 / CAP);
      h2 += flex / 55;
    }
    return { soc, unserved, h2 };
  },
  evaluate() {
    let ok, txt;
    if (this.phase === 'guided') {
      const f = this.farm(), ideal = WindModel.power(this.v) * 4, loss = 1 - f.total / ideal;
      ok = loss <= 0.06;
      txt = ok ? 'Pérdidas por estela: ' + fmt(loss * 100, 1) + ' %. Producción ' + fmt0(f.total) + ' kW de ' + fmt0(ideal) + ' posibles.' : 'Pérdidas por estela: ' + fmt(loss * 100, 1) + ' %. Las turbinas en la misma fila, a pocos diámetros, reciben viento lento y turbulento.';
      this.evidence('lv5_guided_wake', ok, { solo: 3, misconception: ok ? null : 'ignorar estelas' });
    } else if (this.phase === 'auto') {
      const frac = this.maxEnergy > 0 ? this.energy / this.maxEnergy : 0;
      ok = this.damage === 0 && frac >= 0.7;
      txt = ok ? '¡Ráfaga Umbral superada! Sin sobrevelocidad, energía ' + fmt0(this.energy) + ' kWh (' + fmt0(frac * 100) + ' % de lo posible con seguridad). Rearranques prematuros evitados: ' + this.badRestart + '.' : this.damage ? 'Hubo ' + this.damage + ' episodios de sobrevelocidad. Detén el parque cuando el mástil aguas arriba vea ráfagas sobre 25 m/s.' : 'Seguro, pero solo entregaste el ' + fmt0(frac * 100) + ' % de la energía posible: rearranca cuando el viento baje de 20 m/s.';
      this.evidence('lv5_guardian_rafaga_umbral', ok, { solo: 4, misconception: ok ? null : (this.damage ? 'creer que más viento siempre es mejor' : 'detener sin criterio de rearranque') });
    } else if (this.phase === 'transfer') {
      const res = ['calma', 'moderado', 'rafagas'].map(s => this.nightRun(s, this.reserve, this.h2n));
      ok = res.every(r => r.unserved < 1 && r.soc >= 0.1);
      this.trRes = res;
      txt = ok ? 'Plan robusto: en las tres noches se atienden las cargas críticas. H2 producido: ' + res.map(r => fmt(r.h2, 1)).join(' / ') + ' kg. Planificar para la banda, no para el promedio.' : 'En la noche de ' + ['calma', 'viento moderado', 'ráfagas'][res.findIndex(r => r.unserved >= 1 || r.soc < 0.1)] + ' faltó energía crítica. ¿La reserva protege lo esencial si el pronóstico falla?';
      this.evidence('lv5_transfer_pronostico', ok, { solo: 5, transfer: true, misconception: ok ? null : 'planificar con el pronóstico medio sin margen' });
    } else { ok = true; txt = 'Datos guardados.'; }
    this.verdict = { ok, txt }; this.done = true; this.running = false;
    Audio2.sfx(ok ? 'success' : 'error');
  },
  draw(g) {
    const ph = this.phase, X0 = 8, Y0 = 28;
    Gui.begin();
    if (ph === 'demo' || ph === 'free') this.drawCurve(g, X0, Y0, 400, 200);
    if (ph === 'guided' || ph === 'free') this.drawLayout(g, ph === 'free' ? 414 : X0, ph === 'free' ? 28 : Y0, ph === 'free' ? W - 420 : 400, ph === 'free' ? 140 : 200);
    if (ph === 'auto') this.drawGust(g, X0, Y0);
    if (ph === 'transfer') this.drawNight(g, X0, Y0);
    if (ph === 'demo' || ph === 'guided') {
      const CX = 414, CW = W - CX - 6;
      UIK.panel(g, CX, 28, CW, 200, 'tech');
      const v = this.v, P = WindModel.power(v), naive = WindModel.naiveCubic(v, 12);
      drawText(g, 'Viento: ' + fmt(v, 1) + ' m/s', CX + 8, 36, { color: '#8ff5c8' });
      drawText(g, 'Potencia real: ' + fmt0(P) + ' kW', CX + 8, 50, { color: '#ffffff' });
      drawText(g, 'Extrapolación v³: ' + fmt0(naive) + ' kW', CX + 8, 64, { color: '#f78acb' });
      drawText(g, 'Arranque 3 · nominal 12 · corte 25 m/s', CX + 8, 80, { font: 'tiny', color: '#cfd6f0' });
      if (ph === 'guided') {
        const f = this.farm(), ideal = WindModel.power(this.v) * 4;
        drawText(g, 'Parque: ' + fmt0(f.total) + ' / ' + fmt0(ideal) + ' kW', CX + 8, 100, { color: '#ffe14d' });
        drawText(g, 'Pérdida por estela: ' + fmt(100 * (1 - f.total / ideal), 1) + ' %', CX + 8, 114, { color: (1 - f.total / ideal) > 0.06 ? '#ff9a8a' : '#86e36f' });
        f.turbines.forEach((tb, i) => drawText(g, 'T' + (i + 1) + ': v ' + fmt(tb.v, 1) + ' m/s → ' + fmt0(tb.P) + ' kW', CX + 8, 132 + i * 10, { font: 'tiny', color: '#cfd6f0' }));
        if (!this.done && Gui.button(g, 'ev', CX + 8, 204, 100, 18, 'Evaluar', { style: 'good', icon: 'check' })) this.evaluate();
      }
      if (Gui.button(g, 'hintb', CX + CW - 60, 204, 54, 18, 'Pista', { style: 'ghost', icon: 'hint' })) this.hint();
    }
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
  drawCurve(g, x, y, w, h) {
    const real = [], naive = [];
    for (let v = 0; v <= 30; v += 0.5) { real.push([v, WindModel.power(v)]); naive.push([v, Math.min(1400, WindModel.naiveCubic(v, 12))]); }
    Charts.line(g, x, y, w, h, [{ data: real, color: '#ffffff', label: 'curva real' }, { data: naive, color: '#f78acb', label: 'v³ ingenua' }], { xMin: 0, xMax: 30, yMin: 0, yMax: 1400, legend: true, xLabel: 'm/s', yLabel: 'kW', cursor: this.v, hlines: [{ v: 500, color: '#8ff5c8', label: 'nominal' }] });
    // turbina dibujada que gira según el viento
    const tx = x + w - 50, ty = y + h - 10;
    ART.turbine(g, tx, ty, 60, this.t * WindModel.power(this.v) / 120, { col: '#ffffff', shade: '#c8d8e8', stopped: this.v >= 25 });
  },
  drawLayout(g, x, y, w, h) {
    frect(g, x, y, w, h, '#0e2a3a'); frect(g, x + 1, y + 1, w - 2, h - 2, '#13405a');
    const cols = 15, rows = 3, cw = Math.floor((w - 40) / cols), rh = Math.floor((h - 30) / rows);
    drawText(g, 'VIENTO →  ' + fmt0(this.v) + ' m/s (1 celda = 1 diámetro de rotor)', x + 6, y + 4, { font: 'tiny', color: '#8ff5c8' });
    const f = this.farm();
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const cx = x + 30 + c * cw, cy = y + 18 + r * rh;
      frect(g, cx, cy, cw - 1, rh - 1, ((r + c) % 2) ? '#18506a' : '#1a5a74');
      if (!this.done && Gui.button(g, 'cell' + r + '_' + c, cx, cy, cw - 1, rh - 1, '', { noDraw: true })) { if (!this.layout.some(t => t.x === c && t.y === r * 1.5)) { this.layout[this.selT] = { x: c, y: r * 1.5 }; Audio2.sfx('ui'); } }
    }
    // estelas
    f.turbines.forEach((tb) => { const cx = x + 30 + tb.x * cw + cw / 2, cy = y + 18 + (tb.y / 1.5) * rh + rh / 2; for (let k = 1; k < 10; k++) fdither(g, cx + k * cw * 0.9, cy - 2 - k * 0.4, cw, 4 + k * 0.8, '#ff9a8a', clamp(0.35 - k * 0.03, 0, 0.4)); });
    this.layout.forEach((t, i) => {
      const cx = x + 30 + t.x * cw + cw / 2, cy = y + 18 + (t.y / 1.5) * rh + rh / 2;
      const tb = f.turbines.find(q => q.x === t.x && q.y === t.y);
      fdisc(g, cx, cy, 6, this.selT === i ? '#ffe14d' : '#ffffff'); fdisc(g, cx, cy, 3, '#1e4aa8');
      drawText(g, 'T' + (i + 1), cx, cy - 14, { font: 'tiny', align: 'center', color: '#fffaf0' });
      if (tb) drawText(g, fmt0(tb.P), cx, cy + 8, { font: 'tiny', align: 'center', color: tb.deficit > 0.05 ? '#ff9a8a' : '#c2f58e' });
      if (!this.done && Gui.button(g, 'tsel' + i, cx - 7, cy - 7, 14, 14, '', { noDraw: true, tip: 'Seleccionar T' + (i + 1) })) { this.selT = i; Audio2.sfx('uiMove'); }
    });
  },
  drawGust(g, x, y) {
    const S = this.series, m = this.m;
    const meas = S.map((v, i) => [i, v]);
    const fc = S.map((v, i) => [i, Math.min(19, 11 + i * 0.07 + Math.sin(i * 0.4) * 0.6)]);
    const ahead = S.slice(0, Math.min(121, Math.floor(m) + this.lead + 1)).map((v, i) => [i, v]);
    const seen = S.slice(0, Math.floor(m) + 1).map((v, i) => [i, v]);
    Charts.line(g, x, y, 400, 200, [
      { data: fc, color: '#f78acb', label: 'pronóstico MIRAGE' },
      { data: ahead.length ? ahead : [[0, 0]], color: '#56e5ff', label: 'mástil acantilado' },
      { data: seen.length ? seen : [[0, 0]], color: '#ffffff', label: 'en las turbinas' },
    ], { xMin: 0, xMax: 120, yMin: 0, yMax: 30, legend: true, xLabel: 'min', yLabel: 'm/s', cursor: m, hlines: [{ v: 25, color: '#ff4e5d', label: 'corte 25' }, { v: 20, color: '#ffb93b', label: 'rearranque 20' }] });
    const CX = 414, CW = W - CX - 6;
    UIK.panel(g, CX, 28, CW, 200, 'tech');
    const v = S[Math.min(120, Math.floor(m))], vA = S[Math.min(120, Math.floor(m) + this.lead)];
    drawText(g, 'Minuto ' + fmt0(m) + ' / 120', CX + 8, 34, { font: 'tiny', color: '#cfd6f0' });
    drawText(g, 'Viento en turbinas: ' + fmt(v, 1) + ' m/s', CX + 8, 46, { color: v >= 25 ? '#ff4e5d' : '#ffffff' });
    drawText(g, 'Mástil aguas arriba: ' + fmt(vA, 1) + ' m/s', CX + 8, 60, { color: vA >= 25 ? '#ff4e5d' : '#56e5ff' });
    drawText(g, 'Pronóstico MIRAGE: ≤ 19 m/s', CX + 8, 74, { font: 'tiny', color: '#f78acb' });
    drawText(g, 'Parque: ' + (this.stopped ? 'DETENIDO (bandera)' : 'GENERANDO ' + fmt0(v >= 25 ? 0 : WindModel.power(v) * 4) + ' kW'), CX + 8, 90, { color: this.stopped ? '#ffb93b' : '#86e36f' });
    drawText(g, 'Energía entregada: ' + fmt0(this.energy) + ' kWh', CX + 8, 106, { font: 'tiny', color: '#ffe14d' });
    // turbina animada
    ART.turbine(g, CX + CW - 40, 160, 50, this.t * (this.stopped ? 0 : 6), { col: '#ffffff', shade: '#c8d8e8', stopped: this.stopped });
    if (!this.running && !this.done && Gui.button(g, 'start', CX + 8, 204, 90, 18, 'Iniciar', { style: 'good', icon: 'play' })) this.running = true;
    if (this.running && Gui.button(g, 'stop', CX + 8, 204, 130, 18, this.stopped ? 'Arrancar parque' : 'Parar parque', { style: this.stopped ? 'good' : 'danger', icon: this.stopped ? 'play' : 'pause' })) this.toggleStop();
  },
  drawNight(g, x, y) {
    const CW = W - 20;
    UIK.panel(g, x, y, CW, 228, 'tech');
    drawText(g, 'DESPACHO NOCTURNO BAJO INCERTIDUMBRE (12 h · críticas 70 kW · batería 1400 kWh al 90 %)', x + 8, y + 6, { font: 'tiny', color: '#ffe14d' });
    if (!this.done) {
      this.reserve = Gui.slider(g, 'res', x + 8, y + 18, 300, this.reserve, 0.1, 0.9, 0.05, { label: 'Reserva protegida de la batería', fmt: v => fmt0(v * 100) + ' %' });
      this.h2n = Gui.slider(g, 'h2n', x + 8, y + 44, 300, this.h2n, 0, 250, 10, { label: 'Electrólisis programada', unit: 'kW', color: '#d8fff8' });
    } else { drawText(g, 'Reserva ' + fmt0(this.reserve * 100) + ' % · H2 ' + fmt0(this.h2n) + ' kW', x + 8, y + 24, { color: '#cfd6f0' }); }
    ['calma', 'moderado', 'rafagas'].forEach((s, i) => {
      const r = this.nightRun(s, this.reserve, this.h2n);
      const bx = x + 8 + i * 204, by = y + 76;
      UIK.panel(g, bx, by, 196, 110, 'glass');
      drawText(g, ['NOCHE EN CALMA (1,5 m/s)', 'VIENTO MODERADO (8,5 m/s)', 'RÁFAGAS CON PARADAS'][i], bx + 6, by + 5, { font: 'tiny', color: '#8ff5c8' });
      Charts.battery(g, bx + 10, by + 22, 30, 70, r.soc, this.reserve, 'SOC');
      drawText(g, 'SOC final: ' + fmt0(r.soc * 100) + ' %', bx + 50, by + 26, { font: 'tiny', color: '#fffaf0' });
      drawText(g, 'Críticas sin servir: ' + fmt0(r.unserved) + ' kWh', bx + 50, by + 38, { font: 'tiny', color: r.unserved > 0.5 ? '#ff4e5d' : '#86e36f' });
      drawText(g, 'H2: ' + fmt(r.h2, 1) + ' kg', bx + 50, by + 50, { font: 'tiny', color: '#d8fff8' });
    });
    if (!this.done && Gui.button(g, 'ev', x + CW - 140, y + 200, 130, 18, 'Probar tres noches', { style: 'good', icon: 'check' })) this.evaluate();
  },
});
