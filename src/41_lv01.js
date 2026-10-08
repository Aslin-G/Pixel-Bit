/* =====================================================================
   41_lv01.js — NIVEL 01: LA BOCA DEL MAR
   Costa de captación, arrecifes someros y galerías de toma.
   RA-01 · Barrido Sensorial · Guardián: El Filtro Ciego
   ===================================================================== */

LEVELS[1] = {
  id: 1, title: 'La Boca del Mar', chapter: 'CAPÍTULO 01', biome: 'coast', music: 'coast', width: 2600, height: 360,
  ambience: { sea: 0.8, wind: 0.35, birds: 0.6 },
  portraits: ['amaya', 'kiru', 'dante', 'marea', 'limen'],
  spawn: { x: 70, y: 282 },
  checkpoints: { intake: { x: 1100, y: 296 }, filters: { x: 1600, y: 282 } },
  ground: [[0, 282], [180, 278], [300, 284], [470, 286], [720, 290], [800, 268, 'lin'], [880, 262], [960, 270], [1040, 288], [1110, 296], [1150, 304], [1560, 304], [1610, 282], [1840, 282], [1960, 276], [2100, 258], [2300, 248], [2600, 242]],
  terrain: [{ x0: 0, x1: 760, mat: 'beach' }, { x0: 760, x1: 1040, mat: 'rock' }, { x0: 1040, x1: 1600, mat: 'beach' }, { x0: 1600, x1: 1960, mat: 'stone' }, { x0: 1960, x1: 2600, mat: 'rock' }],
  water: [{ x0: 1112, x1: 1580, y: 293, tint: '#20d6c7', deep: '#1063a6' }],
  platforms: [
    { x: 1150, y: 268, w: 380, type: 'wood', post: 40 },
    { x: 820, y: 236, w: 46, type: 'rock' }, { x: 900, y: 222, w: 52, type: 'rock' },
    { x: 1640, y: 206, w: 150, type: 'metal' },
    { x: 2050, y: 226, w: 60, type: 'rock' },
  ],
  ladders: [{ x: 1650, y0: 206, y1: 282 }],
  hazards: [],
  cam: { look: 50, vy: 0.66 },
  /* ---------------- accesorios estáticos ---------------- */
  props(pb, world) {
    const gy = (x) => world.groundAt(x);
    // dunas de entrada con barrón (pasto de duna)
    for (let x = 10; x < 420; x += 9) ART.grass(pb, x, gy(x), 3 + (x % 4), x);
    for (let x = 30; x < 420; x += 70) ART.shrub(pb, x, gy(x) + 1, 5, x, RAMP.moss);
    drawSign(pb, 160, gy(160), 'TOMA COSTERA', '#1491aa');
    ART.palm(pb, 250, gy(250), 46, -6, 3); ART.palm(pb, 395, gy(395), 52, 5, 4);
    // cabaña de Tía Marea (palafito)
    const hx = 470, hb = gy(500);
    for (const px of [hx + 2, hx + 40, hx + 78]) { pb.rect(px, hb - 24, 4, 24, '#5a3826'); pb.rect(px, hb - 24, 1, 24, '#8a5a3c'); }
    pb.rect(hx - 6, hb - 28, 96, 5, '#8a5a3c'); pb.hline(hx - 6, hx + 89, hb - 28, '#c8925e');
    pb.rect(hx, hb - 62, 84, 34, '#1aa894'); pb.rect(hx + 70, hb - 62, 14, 34, '#138078'); pb.rect(hx, hb - 62, 2, 34, '#7ff0dc');
    for (let y = hb - 60; y < hb - 28; y += 4) pb.hline(hx, hx + 83, y, '#16947f');
    pb.rect(hx + 12, hb - 52, 14, 12, '#2a1a2a'); pb.rect(hx + 12, hb - 52, 14, 3, '#5a6fb0'); pb.vline(hx + 19, hb - 52, hb - 41, '#1aa894');
    pb.rect(hx + 50, hb - 54, 14, 26, '#3a2018'); pb.set(hx + 61, hb - 41, '#ffe14d');
    // techo de palma
    for (let k = 0; k < 16; k++) pb.line(hx - 10 + k * 7, hb - 62, hx + 42, hb - 84, k % 2 ? '#d4a84a' : '#a87e34');
    pb.poly([[hx - 12, hb - 60], [hx + 42, hb - 86], [hx + 98, hb - 60]], '#c89a3e');
    for (let y = hb - 84; y < hb - 60; y += 3) for (let x = hx - 10; x < hx + 96; x += 3) if (pb.alpha(x, y) && ((x + y) % 5 === 0)) pb.set(x, y, '#8a6420');
    pb.hline(hx - 12, hx + 97, hb - 60, '#7a5420');
    // redes, boya y antena con panel
    for (let k = 0; k < 18; k++) pb.line(hx + 90 + k, hb - 30, hx + 96 + k, hb - 2, k % 3 ? '#cfe8ee' : '#98c6d2');
    pb.rect(hx + 88, hb - 34, 30, 2, '#5a3826');
    pb.disc(hx + 110, hb - 18, 3, '#ff6b6b'); pb.set(hx + 109, hb - 19, '#ffc6b4');
    pb.vline(hx + 80, hb - 100, hb - 62, '#98c6d2'); pb.rect(hx + 72, hb - 74, 12, 6, '#1f469e'); pb.set(hx + 74, hb - 74, '#8cc4ff'); pb.set(hx + 80, hb - 101, '#ff4e5d');
    // botes de colores sobre la arena
    const boat = (x, c1, c2) => { const y = gy(x); for (let i = 0; i < 40; i++) { const t = i / 39; const d = Math.round(Math.sin(t * Math.PI) * 7); pb.vline(x + i, y - 9, y - 9 + d, i < 4 || i > 35 ? c2 : c1); pb.set(x + i, y - 9, '#fff6d8'); } pb.hline(x + 2, x + 37, y - 5, c2); pb.rect(x + 18, y - 22, 1, 13, '#5a3826'); };
    boat(610, '#ff7656', '#a6303a'); boat(668, '#ffd84a', '#c8861a');
    // rocas con charcas de marea
    for (let x = 790; x < 1040; x += 34) { const y = gy(x); pb.ellipse(x, y - 3, 9, 5, '#b8564b'); pb.ellipse(x - 2, y - 5, 6, 3, '#d77558'); pb.set(x - 4, y - 7, '#f7c08e'); }
    for (const x of [840, 930, 1000]) { const y = gy(x); pb.rect(x - 9, y, 18, 3, '#16a6cf'); pb.hline(x - 8, x + 8, y, '#a6f4ff'); pb.set(x - 2, y + 1, '#ff8ab8'); pb.set(x + 3, y + 2, '#ffe14d'); }
    // plataforma del dron
    const dpx = 1080, dpy = gy(dpx);
    pb.rect(dpx - 16, dpy - 4, 32, 4, '#345a78'); pb.rect(dpx - 16, dpy - 4, 32, 1, '#98c6d2');
    pb.hline(dpx - 6, dpx + 6, dpy - 3, '#ffe14d'); pb.vline(dpx - 4, dpy - 3, dpy - 2, '#ffe14d'); pb.vline(dpx + 4, dpy - 3, dpy - 2, '#ffe14d');
    // casa de bombas
    const bx = 1180, by = 268;
    pb.rect(bx, by - 46, 92, 46, '#e8f0f4'); pb.rect(bx + 78, by - 46, 14, 46, '#a9bbd6'); pb.rect(bx, by - 46, 2, 46, '#ffffff');
    pb.rect(bx, by - 30, 92, 5, '#20d6c7'); pb.hline(bx, bx + 91, by - 30, '#7ff0dc');
    pb.rect(bx - 3, by - 50, 98, 4, '#5b6f96'); pb.hline(bx - 3, bx + 94, by - 50, '#cbdaea');
    pb.rect(bx + 10, by - 44, 18, 10, '#1a2a4a'); pb.rect(bx + 10, by - 44, 18, 2, '#4a7aa8');
    for (let k = 0; k < 4; k++) pb.rect(bx + 40 + k * 8, by - 44, 5, 10, '#1a2a4a');
    pb.rect(bx + 46, by - 22, 14, 22, '#27405e'); pb.set(bx + 57, by - 11, '#ffe14d');
    for (let k = 0; k < 3; k++) { pb.rect(bx + 6 + k * 20, by - 64, 16, 4, '#1f469e'); pb.set(bx + 7 + k * 20, by - 64, '#8cc4ff'); pb.vline(bx + 14 + k * 20, by - 60, by - 51, '#98c6d2'); }
    // tubería de agua de mar: torre → casa de bombas → pretratamiento
    ART.pipe(pb, 1290, 262, 1428, 262, 3, 'seawater');
    ART.pipe(pb, 1180, 276, 1180, 290, 3, 'seawater');
    ART.pipe(pb, 1272, 276, 1640, 276, 3, 'seawater');
    // torre de toma
    const tx = 1430;
    pb.rect(tx, 210, 50, 94, '#c8d8e8'); pb.rect(tx + 38, 210, 12, 94, '#8396ba'); pb.rect(tx, 210, 2, 94, '#ffffff');
    for (let y = 214; y < 300; y += 10) pb.hline(tx, tx + 49, y, '#a9bbd6');
    pb.rect(tx - 4, 204, 58, 6, '#5b6f96'); pb.hline(tx - 4, tx + 53, 204, '#e6f0f7');
    pb.rect(tx + 8, 240, 30, 26, '#1d2a48');
    for (let x = tx + 9; x < tx + 38; x += 3) pb.vline(x, 241, 265, '#6aa0b4'); for (let y = 243; y < 266; y += 4) pb.hline(tx + 9, tx + 37, y, '#477a94');
    pb.rect(tx + 14, 222, 18, 12, '#ffb93b'); pb.rect(tx + 15, 223, 16, 10, '#ffe14d'); pb.rect(tx + 21, 225, 4, 6, '#140d26');
    pb.vline(tx + 52, 120, 204, '#98c6d2'); pb.rect(tx + 47, 118, 12, 4, '#ff4e5d');
    // edificio de pretratamiento
    const fx = 1630;
    pb.rect(fx, 206, 220, 76, '#dfe8f0'); pb.rect(fx + 200, 206, 20, 76, '#a9bbd6'); pb.rect(fx, 206, 2, 76, '#ffffff');
    pb.rect(fx, 246, 220, 4, '#20d6c7');
    for (let k = 0; k < 4; k++) ART.tank(pb, fx + 30 + k * 40, 280, 28, 46, RAMP.steelW, { band: '#1aa894', label: true, labelCol: '#56e5ff' });
    pb.rect(fx + 8, 214, 14, 10, '#1a2a4a'); pb.rect(fx + 8, 214, 14, 2, '#4a7aa8');
    drawSign(pb, fx + 110, 206, 'PRETRATAMIENTO', '#1491aa');
    ART.pipe(pb, fx + 220, 270, 2010, 270, 3, 'water');
    // camino de acantilado
    for (let x = 1980; x < 2600; x += 40) { const k = (x * 7) % 5; if (k < 2) ART.cactus(pb, x, gy(x) + 1, 22 + k * 6, x); else if (k < 3) ART.agave(pb, x, gy(x), 9); else ART.shrub(pb, x, gy(x) + 1, 6, x); }
    drawSign(pb, 2520, gy(2520), 'PLANTA OI', '#8d6bff');
  },
  propsFront(pb, world) {
    for (let x = 0; x < 760; x += 7) if ((x * 13) % 5 < 2) ART.grass(pb, x, world.groundAt(x) + 2, 2, x + 5, RAMP.leaf);
    for (let x = 1980; x < 2600; x += 11) if ((x * 7) % 4 === 0) ART.grass(pb, x, world.groundAt(x) + 2, 2, x, RAMP.moss);
  },
  /* ---------------- dinámico ---------------- */
  renderBack(g, sc, cam) {
    const S = sc.state, t = Game.time;
    // pluma de turbidez en el mar lejano (avanza desde el horizonte)
    if (S.plume > 0) {
      const hz = sc.backdrop.horizon;
      const front = hz + 4 + S.plume * 120;
      for (let y = hz + 2; y < Math.min(front, H); y += 1) {
        const k = 1 - (y - hz) / (front - hz + 1);
        fdither(g, 0, y, W, 1, '#a07a3a', clamp(0.15 + k * 0.55 * S.plume, 0, 0.8));
      }
    }
    // gaviotas
    for (let i = 0; i < 5; i++) { const bx = ((t * (18 + i * 4) + i * 160) % (W + 80)) - 40, by = 70 + i * 13 + Math.sin(t + i) * 6; ART.bird(g, Math.round(bx), Math.round(by), t + i); }
  },
  renderMid(g, sc, cam) {
    const S = sc.state, t = Game.time, ox = cam.x, oy = cam.y;
    // olas de orilla
    for (let k = 0; k < 3; k++) {
      const ph = ((t * 0.35 + k / 3) % 1);
      const x0 = 1080 + ph * 40 - ox, y = 294 - oy;
      g.globalAlpha = 1 - ph;
      frect(g, Math.round(x0), y, 60 - ph * 30, 1, '#ffffff');
      frect(g, Math.round(x0 + 10), y + 1, 40 - ph * 20, 1, '#c6fff2');
      g.globalAlpha = 1;
    }
    // luz de advertencia de la torre y compuerta
    const tx = 1430 - ox;
    fdisc(g, tx + 53, 117 - oy, 2, (Math.floor(t * 2) % 2) ? (S.gateClosed ? '#ff4e5d' : '#86e36f') : '#3a1a20');
    const gateH = Math.round((S.gateAnim || 0) * 24);
    if (gateH > 0) { frect(g, tx + 8, 241 - oy, 30, gateH, '#ff6b6b'); for (let y = 0; y < gateH; y += 3) frect(g, tx + 8, 241 + y - oy, 30, 1, '#a82c40'); }
    // dron en su plataforma
    if (!S.droneOut) drawDrone(g, 1080 - ox, 286 - oy, t, false);
    // peces saltando cerca del arrecife (salud ecológica)
    const eco = 1 - (S.eco || 0.2);
    if (eco > 0.4) { const ph = (t * 0.5) % 3; if (ph < 0.6) { const fx = 1340 + Math.sin(Math.floor(t * 0.5 / 3) * 7) * 80 - ox; const fy = 292 - Math.sin(ph / 0.6 * Math.PI) * 14 - oy; frect(g, Math.round(fx), Math.round(fy), 4, 2, '#ff9f43'); fpx(g, Math.round(fx) + 4, Math.round(fy), '#ffc06a'); } }
    // manómetro del filtro sobre el techo
    const gx = 1700 - ox, gy2 = 196 - oy;
    fdisc(g, gx, gy2, 7, '#1d2a48'); fdisc(g, gx, gy2, 6, '#f4fdff');
    const dp = clamp((S.dp || 0.3) / 1.6, 0, 1); const a = Math.PI * (0.8 + dp * 1.4);
    fline(g, gx, gy2, gx + Math.cos(a) * 5, gy2 + Math.sin(a) * 5, dp > 0.7 ? '#ff4e5d' : '#140d26');
  },
  renderGrade(g, sc) {
    const S = sc.state;
    if (S.storm > 0) { g.globalCompositeOperation = 'multiply'; g.globalAlpha = S.storm * 0.55; frect(g, 0, 0, W, H, '#c09070'); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  },
  lens(g, sc, cam, k) {
    const ox = cam.x, oy = cam.y, S = sc.state;
    lensBoundary(g, 1150 - ox, 196 - oy, 720, 100, '#ffe14d', 'LÍMITE: CAPTACIÓN + PRETRATAMIENTO');
    Charts.flow(g, [[1452 - ox, 296 - oy], [1452 - ox, 262 - oy], [1300 - ox, 262 - oy]], 'seawater', S.gateClosed ? 0 : 1, 3);
    Charts.flow(g, [[1272 - ox, 276 - oy], [1630 - ox, 276 - oy]], 'seawater', S.gateClosed ? 0 : 1, 3);
    Charts.flow(g, [[1850 - ox, 270 - oy], [2000 - ox, 270 - oy]], 'water', 1, 3);
    Charts.flow(g, [[1225 - ox, 150 - oy], [1225 - ox, 214 - oy]], 'power', 1, 2);
    lensTag(g, 1440 - ox, 190 - oy, 'Qtoma ' + fmt0(S.q || 100) + ' m³/h', '#6cf0db', 'water');
    lensTag(g, 1300 - ox, 240 - oy, 'Turbidez ' + fmt(S.turb || 2.5, 1) + ' NTU', '#ffb93b', 'filter');
    lensTag(g, 1660 - ox, 176 - oy, 'ΔP filtro ' + fmt(S.dp || 0.3, 2) + ' bar', '#ff9a8a', 'chart');
    lensTag(g, 1880 - ox, 254 - oy, '→ OI (agua pretratada)', '#a6f4ff', 'membrane');
    lensTag(g, 1180 - ox, 140 - oy, 'Bombas ~' + fmt0((S.q || 100) * 0.25) + ' kW', '#ffe14d', 'bolt');
    lensTag(g, 1380 - ox, 306 - oy, 'v aprox. ' + fmt((S.q || 100) / 3600 / 1.6, 3) + ' m/s', '#86e36f', 'fish');
  },
  hud(g, sc) {
    const S = sc.state;
    if (!S.hud) return;
    hudGauges(g, [
      { icon: 'filter', label: 'TURBIDEZ', value: fmt(S.turb || 2.5, 1) + ' NTU', frac: (S.turb || 2.5) / 40, color: (S.turb || 0) > 10 ? '#ff9f43' : '#56e5ff' },
      { icon: 'chart', label: 'ΔP FILTRO', value: fmt(S.dp || 0.3, 2) + ' bar', frac: (S.dp || 0.3) / 1.6, color: (S.dp || 0) > 1 ? '#ff4e5d' : '#86e36f' },
      { icon: 'tank', label: 'RESERVA', value: fmt0((S.tank ?? 0.7) * 100) + ' %', frac: S.tank ?? 0.7, color: '#56e5ff' },
      { icon: 'fish', label: 'RIESGO ECO', value: S.eco > 0.5 ? 'ALTO' : S.eco > 0.25 ? 'MEDIO' : 'BAJO', frac: S.eco || 0.2, color: S.eco > 0.5 ? '#ff4e5d' : '#86e36f' },
    ]);
  },
  /* ---------------- guion ---------------- */
  setup(sc, p) {
    const S = sc.state;
    Object.assign(S, { turb: 2.5, dp: 0.35, tank: 0.7, eco: 0.2, q: 100, plume: 0, storm: 0, hud: false, gateClosed: false, gateAnim: 0 });
    sc.musicOverride = null;
    const w = sc.world;
    const marea = sc.actor('marea', 'marea', 548, { facing: -1, restAnim: 'idle' });
    const dante = sc.actor('dante', 'dante', 1040, { facing: -1 });
    const pesc = sc.actor('pesc', 'crowd2', 700, { facing: -1, wander: 30 });
    const limen = sc.actor('limen', 'limen', 1456, { fly: true, y: 200, hidden: true, talkable: false });
    limen.render = function (g, cam) { if (this.hidden) return; Actor.prototype.render.call(this, g, cam); };
    // KIRU: compañero
    // pickups: ecos de memoria de KIRU (coleccionables narrativos)
    w.add(new Pickup({ kind: 'echo', x: 905, y: 196, onPick: () => kiruEcho(sc, 'l1a', 'KIRU: "¿Por qué conozco el camino a la galería vieja si nunca vinimos?"') }));
    w.add(new Pickup({ kind: 'echo', x: 2080, y: 200, onPick: () => kiruEcho(sc, 'l1b', 'KIRU: "Ranchería Los Médanos... ese nombre suena como una canción que no recuerdo."') }));
    // adversarios conceptuales (aparecen con la tormenta)
    S.foulers = [];
    // --- Tía Marea
    marea.onTalk = async (sc2) => {
      if (!S.metMarea) {
        S.metMarea = true;
        await sc2.say([
          ['marea', 'smile', 'Amaya, mija. Vienes por la toma, ¿cierto? El mar no entrega la misma agua dos veces.'],
          ['amaya', 'smile', 'Los sensores dicen que la turbidez está en 2 NTU. Agua de manual.'],
          ['marea', 'skeptical', 'Los sensores dicen. Las gaviotas dicen otra cosa: se fueron a pescar lejos, y allá afuera el agua cambió de color esta mañana.'],
          ['kiru', 'thinking', 'Dato cualitativo registrado: "gaviotas lejos" + "color raro". Precisión: abuela de nivel experta.'],
          ['marea', 'neutral', 'Y el sensor de la toma lleva tres días bajo la arena. Lo puso alguien con prisa.'],
        ]);
        const c = await sc2.say([['amaya', 'thinking', '¿Consultamos a Tía Marea antes de reabrir la toma o confiamos en la telemetría?', { choices: ['Pedirle que nos acompañe con su pronóstico (tarda un poco)', 'Confiar en la telemetría y avanzar rápido'] }]]);
        GS.decide('consultMarea', c === 0);
        if (c === 0) { GS.trust('community', 8); await sc2.say([['marea', 'happy', 'Así me gusta. Cuando sople del noroeste y el agua se ponga color café con leche, desconfía de cualquier número bonito.'], ['kiru', 'happy', 'Pronóstico local integrado. Banda de incertidumbre: más estrecha.']]); }
        else await sc2.say([['marea', 'calm', 'Como quieras. El mar no lee la telemetría.']]);
        sc2.setObjective('Reúnete con Dante junto a la plataforma del dron', ['¿Hacia dónde está la toma?', 'Dante espera junto a la plataforma amarilla, cerca del muelle.', 'Camina hacia la derecha por las rocas.']);
        if (!GS.lp(1).side.sensor) S.sensorQuest = true;
      } else if (S.sensorQuest && !GS.lp(1).side.sensor) {
        await sc2.say([['marea', 'neutral', 'El sensor enterrado está entre los botes y las rocas. Si lo mueves, piensa qué agua quieres medir: la que rompe en la orilla o la que entra a la toma.']]);
      } else await sc2.say([['marea', 'smile', 'Ve con cuidado, mija. Y escucha también lo que no aparece en las pantallas.']]);
    };
    // --- Pescador: misión "La rejilla que cantaba"
    pesc.onTalk = async (sc2) => sideScreens(sc2);
    // --- sensor enterrado (misión de medición)
    sc.station({ id: 'sensorBuried', x: 735, kind: 'sensor', label: 'Sensor enterrado', glow: '#ffb93b', onUse: (sc2, st) => sideSensor(sc2, st) });
    // --- Dante
    dante.onTalk = async (sc2) => {
      if (!S.droneDone) await meetDante(sc2);
      else await sc2.say([['dante', 'smile', 'El dron ya está cargando. La cabina de control está en la casa de bombas.']]);
    };
    // --- plataforma del dron
    sc.station({ id: 'drone', x: 1080, kind: 'terminal', label: 'Dron de muestreo', glow: '#ff9f43', hidden: true, hY: 10,
      draw: () => { }, onUse: async (sc2, st) => { if (!S.metDante) return; await droneMission(sc2); st.done = true; } });
    // --- cabina de control (gemelo de la toma)
    sc.station({ id: 'intakeSim', x: 1236, y: 268, kind: 'sim', label: 'Gemelo de la toma', glow: '#56e5ff', hidden: true, onUse: async (sc2, st) => intakeFlow(sc2, st) });
    // --- Puerta de Evidencia (SOLO)
    sc.station({ id: 'solo', x: 1915, kind: 'solo', label: 'Puerta de Evidencia', glow: '#b49cff', progress: 0, hidden: true, onUse: async (sc2, st) => {
      const r = await sc2.open(SOLOScene, { ctx: 'RA-01-C3' });
      st.progress = r.correct; if (r.correct >= 3) { st.done = true; GS.lp(1).solo = true; S.soloDone = true; Codex.unlock('incertidumbre_med'); }
      if (S.soloDone && S.restDone) sc2.setObjective('Sigue el camino hacia la Planta OI', ['La salida está a la derecha, sobre el acantilado.']);
    } });
    // --- salida
    sc.station({ id: 'exit', x: 2540, kind: 'clue', label: 'Ir a la Planta OI', glow: '#ffe14d', hidden: true, onUse: async (sc2) => finishLevel1(sc2) });
    sc.setObjective('Sigue la costa hacia la toma de SYNARA', ['¿Qué ves en el horizonte del mar?', 'Habla con la gente de la costa: Tía Marea conoce estas aguas.', 'Camina a la derecha. Puedes hablar con Tía Marea en su cabaña.']);
    Codex.unlock('agua_mar');
    if (p.checkpoint === 'intake') { S.metDante = true; S.droneDone = true; S.hud = true; dante.x = 1200; sc.world.find('intakeSim').hidden = false; GS.giveTool('barrido', true); sc.setObjective('Configura la captación en el Gemelo de la toma', ['¿Qué cambia primero: caudal, turbidez o ΔP?']); }
    if (p.checkpoint === 'filters') { S.metDante = true; S.droneDone = true; S.hud = true; S.limenEvent = true; S.gateClosed = true; S.gateAnim = 1; dante.x = 1560; GS.giveTool('barrido', true); const st = sc.world.find('intakeSim'); st.hidden = false; S.simStage = 'auto'; sc.setObjective('Reabre la toma con seguridad en el Gemelo (El Filtro Ciego)', []); }
  },
  update(sc, dt) {
    const S = sc.state;
    S.gateAnim = approach(S.gateAnim || 0, S.gateClosed ? 1 : 0, dt * 1.5);
    if (S.storm > 0) { ambientParticles(sc.world.ps, 'dust', sc.cam, 0.8 * S.storm, 1.5); sc.backdrop.weather.wind = 1 + S.storm; }
    for (const w of sc.world.water) w.turbid = clamp((S.turb - 3) / 40, 0, 0.7);
  },
  triggers: [
    { x: 300, w: 40, run: (sc) => { sc.kiru && sc.kiru.say('Huele a algas... y a una lista de pendientes. ¿Ves ese tono café allá lejos?', 'curioso'); sc.state.plume = 0.08; Codex.unlock('turbidez'); } },
    { x: 960, w: 40, run: (sc) => { if (!sc.state.metDante) sc.dante && 0; } },
  ],
};

/* ---------------- piezas del guion ---------------- */
function kiruEcho(sc, id, text) {
  if (!GS.s.echoes.includes(id)) GS.s.echoes.push(id);
  sc.kiru && sc.kiru.say(text.replace(/^KIRU: /, ''), 'confundido', 5);
  Game.toast('Eco de memoria de KIRU (' + GS.s.echoes.length + ')', 'kiru', '#b49cff');
}
async function meetDante(sc) {
  const S = sc.state;
  S.metDante = true;
  await sc.say([
    ['dante', 'joy', '¡Llegaron! Traje el dron de muestreo. Le cambié las hélices: ahora suena como una licuadora optimista.'],
    ['amaya', 'determined', 'Necesitamos la toma operando hoy. Si la planta no recibe agua, todo SYNARA se queda sin primer agua.'],
    ['dante', 'skeptical', 'Si el manual dice "no debería ocurrir", ocurrirá un martes a las tres. Hoy es martes.'],
    ['kiru', 'curioso', 'Son las 2:41. Tenemos diecinueve minutos de optimismo.'],
    ['amaya', 'thinking', 'Primero medimos. Si el agua de entrada cambia, todo lo demás cambia.'],
  ]);
  sc.world.find('drone').hidden = false;
  sc.setObjective('Toma muestras del mar con el dron de muestreo', ['¿Qué variables describen el agua que entra a la toma?', 'Turbidez, salinidad (TDS) y temperatura, con su incertidumbre.', 'Interactúa con la plataforma del dron.']);
}
async function droneMission(sc) {
  const S = sc.state;
  S.droneOut = true;
  const r = await sc.open(DroneScene, { marea: GS.s.decisions.consultMarea });
  S.droneOut = false;
  if (!r) return;
  S.droneDone = true; S.chosenPoint = r.choice; S.hud = true;
  GS.giveTool('barrido');
  Codex.unlock('captacion'); Codex.unlock('incertidumbre_med');
  await sc.say([
    ['kiru', 'thinking', 'Análisis: la turbidez sube mar adentro hacia el noroeste. La telemetría de la toma no lo ve porque su sensor está... ¿bajo la arena?'],
    ['dante', 'surprised', 'Entonces el agua que medimos no es la que entra.'],
    ['amaya', 'determined', 'Pregunta de investigación: ¿qué cambia primero cuando llega un pulso de turbidez: el caudal, la turbidez o la presión diferencial del filtro?'],
    ['kiru', 'happy', 'Nueva herramienta: {c}Barrido Sensorial{/}. Pulsa {y}Q{/} cerca de sensores para muestrear con incertidumbre.'],
  ]);
  sc.world.find('intakeSim').hidden = false;
  GS.save('intake');
  sc.setObjective('Configura la captación en el Gemelo de la toma (casa de bombas)', ['¿Qué variable limita el sistema hoy?', 'Mira la turbidez de entrada y la capacidad del filtro.', 'Entra a la cabina de control junto al muelle.']);
}
async function intakeFlow(sc, st) {
  const S = sc.state;
  if (!S.simStage) {
    const r = await sc.open(Sim01, { phase: 'demo', stopAfter: 'guided', point: S.chosenPoint, marea: GS.s.decisions.consultMarea });
    if (!r || !r.ok) return;
    S.simStage = 'storm';
    Codex.unlock('pretratamiento');
    await limenEvent(sc);
    return;
  }
  if (S.simStage === 'auto' || S.simStage === 'storm') {
    const r = await sc.open(Sim01, { phase: 'auto', stopAfter: 'auto', point: S.chosenPoint, marea: GS.s.decisions.consultMarea });
    if (!r || !r.ok) { sc.kiru && sc.kiru.say('Podemos reintentarlo. Ningún filtro fue dañado en esta simulación.', 'valiente'); return; }
    S.simStage = 'explain'; S.gateClosed = false; S.storm = 0.3; S.turb = 6; GS.lp(1).guardian = true;
    GS.flag('protectedIntake', true);
    const ok = await explain(sc, {
      id: 'lv1_explain', ra: 'RA-01', concepts: ['pretreatment', 'waterQuality'],
      prompt: 'Durante el pulso redujiste el caudal de toma y usaste la reserva del tanque. ¿Qué relación causal explica por qué eso protege la producción de agua en las próximas horas?',
      options: [
        'Con menos caudal entra menos carga de sólidos; el filtro acumula menos pérdida de carga y no colapsa, así la planta puede seguir operando cuando el pulso pase.',
        'Con menos caudal la turbidez del mar disminuye, porque la toma deja de removerla.',
        'Reducir el caudal aumenta la presión del filtro y eso limpia el medio filtrante.',
        'El tanque produce agua nueva mientras la toma está cerrada.'],
      key: 0, mis: 'creer que captar más siempre produce más',
      why: 'La carga de sólidos que llega al filtro es turbidez × caudal. Menos caudal durante el pulso mantiene el ΔP bajo el límite, evita el colapso y conserva la disponibilidad; la reserva del tanque cubre la demanda temporalmente.',
      whyNot: { 1: 'La turbidez del mar no depende de tu toma: llega con el pulso. Lo que controlas es cuánta carga entra.', 2: 'Más caudal (no menos) eleva el ΔP; la limpieza requiere lavado a contracorriente.', 3: 'El tanque almacena; no produce agua.' },
    });
    if (ok) S.explained = true;
    const r2 = await sc.open(Sim01, { phase: 'transfer', stopAfter: 'transfer', point: S.chosenPoint });
    if (r2 && r2.ok) GS.lp(1).variant = true;
    await restScene(sc);
    return;
  }
  await sc.open(Sim01, { phase: 'free', stopAfter: 'free', point: S.chosenPoint });
}
async function limenEvent(sc) {
  const S = sc.state, limen = sc.world.find('limen'), dante = sc.world.find('dante');
  sc.musicOverride = 'mystery'; Audio2.playMusic('mystery');
  await sc.camTo(1380, 290, 1.2);
  // llega la tormenta: el pulso avanza
  const t0 = sc.time;
  await sc.until(() => { const k = clamp((sc.time - t0) / 3, 0, 1); S.plume = lerp(0.08, 1, k); S.storm = k * 0.8; S.turb = lerp(2.5, 8, k); sc.backdrop.weather.wind = 1 + k * 2; return k >= 1; });
  Audio2.sfx('gust');
  // LIMEN aparece y cierra la compuerta
  limen.hidden = false; Audio2.sfx('limen'); sc.world.ps.emit('crystal', limen.x, limen.y - 50, 0, 0, 40, 20);
  Game.doFlash('#c4fbff', 0.6);
  await sc.wait(0.6);
  limen.expr = 'speak';
  await sc.say([['limen', 'alert', 'MARGEN EXCEDIDO EN T+14. CIERRE DE CAPTACIÓN.'], ['limen', 'alert', 'NO REINICIEN.']]);
  S.gateClosed = true; Audio2.sfx('valve'); sc.cam.shake(3, 0.5);
  await sc.wait(0.8);
  limen.hidden = true; sc.world.ps.emit('crystal', limen.x, limen.y - 50, 0, 0, 30, 20); Audio2.sfx('limen', { vol: 0.5 });
  GS.flag('sawLimen', true);
  await sc.wait(1.0);
  // la alarma visible llega después
  S.turb = 24; S.dp = 0.9;
  Audio2.sfx('alarm');
  await sc.say([
    ['amaya', 'angry', '¡Nos cerró la toma! Otra vez. Primero el apagón en la plaza, ahora esto. Está saboteando SYNARA.'],
    ['dante', 'worried', 'Amaya... la alarma de turbidez sonó después. Mucho después.'],
    ['kiru', 'thinking', 'Registro interno: orden de cierre de LIMEN a las 14:46:02. Alarma visible de turbidez a las 14:46:16. {y}Catorce segundos antes.{/}'],
    ['amaya', 'skeptical', 'Entonces sabía lo que iba a pasar. Eso es peor. Significa que lo planeó.'],
    ['kiru', 'worried', 'O que vio algo que nosotros no medimos.'],
  ]);
  GS.addClue('earlyClose');
  sc.camRelease();
  // adversarios: Foulers alrededor del pretratamiento
  for (const [x, y] of [[1700, 240], [1780, 230], [1560, 250]]) S.foulers.push(sc.world.add(new Adversary({ type: 'fouler', x, y, range: 40, speed: 22 })));
  S.simStage = 'auto';
  GS.save('filters');
  sc.setObjective('Reabre la toma con seguridad en el Gemelo (El Filtro Ciego)', ['¿Qué cambió primero: caudal, turbidez o presión diferencial?', 'El sensor que anticipa la saturación es el ΔP del filtro.', 'Reduce el caudal y usa la reserva mientras el filtro se recupera.']);
  sc.kiru && sc.kiru.say('Esos Foulers oscurecen sensores. Corrígelos con {y}Q{/} cuando estés cerca.', 'alarmado', 5);
}
async function restScene(sc) {
  const S = sc.state;
  S.storm = 0; S.plume = 0.3; S.turb = 3.2; S.dp = 0.45;
  sc.musicOverride = null; Audio2.playMusic('coast');
  await sc.say([
    ['dante', 'tired', 'Bueno. El filtro sobrevivió. Yo casi no.'],
    ['amaya', 'thinking', 'Salvamos la toma... pero la ciudad ya dice en la radio que LIMEN nos robó el agua.'],
    ['kiru', 'worried', 'La radio no sabe lo de los catorce segundos.'],
    ['amaya', 'skeptical', 'Puede haber muchas explicaciones. Quizá tiene acceso a sensores que nosotros no.'],
    ['dante', 'smile', 'O quizá estaba protegiendo la toma. Un saboteador raro: uno que llega justo antes del desastre.'],
    ['amaya', 'determined', 'Necesito ver los registros de la planta de ósmosis. Si LIMEN aisló algo allí, quiero saber por qué.'],
  ]);
  S.restDone = true;
  Codex.unlock('p_limen'); Codex.unlock('p_dante'); Codex.unlock('p_marea');
  sc.world.find('solo').hidden = false;
  sc.world.find('exit').hidden = false;
  sc.setObjective('Abre la Puerta de Evidencia y luego sigue hacia la Planta OI', ['La Puerta de Evidencia está junto al edificio de pretratamiento.', 'Cada tarea SOLO usa los datos del contexto: revisa unidades.']);
}
async function finishLevel1(sc) {
  const S = sc.state;
  if (!S.restDone) { sc.kiru && sc.kiru.say('Todavía no reabrimos la toma con seguridad.', 'confundido'); return; }
  if (!S.soloDone) { const c = await sc.say([['kiru', 'curioso', 'La Puerta de Evidencia aún no registra tu razonamiento. ¿Seguimos de todas formas?', { choices: ['Volver a la Puerta de Evidencia', 'Seguir (se puede completar después desde el mapa)'] }]]); if (c === 0) return; }
  await completeLevel(sc);
  Game.transition(() => Game.setScene(WorldMapScene, { focus: 2 }));
}
/* ---------------- misiones secundarias ---------------- */
async function sideSensor(sc, st) {
  const lp = GS.lp(1);
  if (lp.side.sensor) { await sc.say([['kiru', 'happy', 'El sensor reubicado transmite: ' + fmt(sc.state.turb, 1) + ' ± 0,5 NTU.']]); return; }
  await sc.say([['amaya', 'surprised', 'Aquí está el sensor de turbidez... medio enterrado en la zona donde rompen las olas.'], ['kiru', 'thinking', 'Lee 2 NTU con incertidumbre de ± 6 NTU. Es como pesar harina con una balanza para camiones.']]);
  const c = await sc.say([['amaya', 'thinking', '¿Dónde lo reubicamos para que represente el agua que entra a la toma?', { choices: ['En la zona de rompiente, donde se ve más espuma', 'Junto a la boca de la toma, a su misma profundidad', 'Detrás de las rocas, donde el agua está más quieta y clara'] }]]);
  const ok = c === 1;
  LearningModel.record({ kind: 'challenge', id: 'side_sensor_bajo_arena', ra: 'RA-01', concepts: ['waterQuality', 'steamInquiry'], solo: 3, correct: ok, misconception: ok ? null : 'medir donde es cómodo en lugar de donde es representativo' });
  if (ok) { lp.side.sensor = true; Audio2.sfx('success'); GS.s.sensors++; st.done = true; st.label = 'Sensor reubicado'; await sc.say([['kiru', 'happy', 'Incertidumbre reducida a ± 0,5 NTU. Medir donde importa vale más que medir mucho.'], ['amaya', 'smile', 'Tía Marea tenía razón. Medir no elimina la necesidad de interpretar.']]); Codex.unlock('incertidumbre_med'); }
  else await sc.say([['kiru', 'confundido', 'Ese punto mide otra agua: la rompiente resuspende arena y las rocas protegen de la corriente. Queremos el agua que realmente entra a la toma. Probemos otra vez.']]);
}
async function sideScreens(sc) {
  const lp = GS.lp(1);
  if (lp.side.screens) { await sc.say([['crowd2', 'smile', 'Desde que bajaron la velocidad, las larvas ya no se quedan pegadas a la rejilla.', { who: 'narr' }]].map(l => ['narr', null, 'Pescador Rubén: "Desde que bajaron la velocidad en la rejilla, las larvas ya no se quedan pegadas."'])); return; }
  await sc.say([['narr', null, 'Pescador Rubén: "Esa rejilla de la toma canta de noche, como un zumbido. Y cuando chupa fuerte, las larvas de pargo se quedan pegadas. Ustedes hablan de agua; nosotros hablamos de la pesca del año que viene."']]);
  const c = await sc.say([['amaya', 'thinking', '¿Qué propones para la rejilla?', { choices: ['Rejillas finas y menor velocidad de aproximación (algo menos de caudal máximo)', 'Mantener el caudal máximo: el agua es la prioridad', 'Apagar la toma de noche sin analizar datos'] }]]);
  const ok = c === 0;
  LearningModel.record({ kind: 'challenge', id: 'side_rejilla_que_cantaba', ra: 'RA-01', concepts: ['pretreatment', 'ethics'], solo: 4, correct: ok, misconception: ok ? null : 'ignorar el impacto ecológico de la captación' });
  if (ok) { lp.side.screens = true; GS.trust('community', 10); GS.decide('fineScreens', true); Audio2.sfx('success'); await sc.say([['narr', null, 'Pescador Rubén: "Con eso podemos vivir. Gracias por preguntar antes de decidir."'], ['kiru', 'esperanzado', 'Confianza comunitaria +10. Velocidad de aproximación objetivo: menor a 0,15 m/s.']]); }
  else if (c === 1) { GS.trust('community', -5); await sc.say([['narr', null, 'Pescador Rubén: "El agua es para la gente. La gente también come pescado."'], ['kiru', 'culpable', 'Tal vez podamos proteger ambas cosas. La velocidad de aproximación es una variable de diseño.']]); }
  else await sc.say([['kiru', 'confundido', 'Apagar sin datos puede dejar sin agua a la planta cuando más se necesita. ¿Y si probamos el diseño de la rejilla?']]);
}

/* =====================================================================
   Dron de muestreo (instrumentación y datos)
   ===================================================================== */
function drawDrone(g, x, y, t, flying) {
  x = Math.round(x); y = Math.round(y);
  const bob = flying ? Math.round(Math.sin(t * 6) * 1) : 0;
  frect(g, x - 6, y - 5 + bob, 12, 4, '#ff9f43'); frect(g, x - 6, y - 5 + bob, 12, 1, '#ffc06a'); frect(g, x - 4, y - 1 + bob, 8, 2, '#263442');
  fpx(g, x, y + 1 + bob, '#56e5ff');
  const sp = flying ? ((Math.floor(t * 30) % 2) ? 5 : 3) : 4;
  for (const s of [-1, 1]) { frect(g, x + s * 7 - (s < 0 ? 1 : 0), y - 7 + bob, 1, 3, '#6aa0b4'); frect(g, x + s * 7 - sp, y - 8 + bob, sp * 2, 1, flying ? '#cfe8ee' : '#98c6d2'); }
}
const DRONE_POINTS = [
  { id: 'A', x: 96, y: 196, name: 'Desembocadura del arroyo', depth: 3, tds: 33.2, turb: 26, T: 29.5, eco: 0.35, cost: 0.1, note: 'Pluma de sedimentos del arroyo.' },
  { id: 'B', x: 236, y: 178, name: 'Pradera marina', depth: 5, tds: 35.0, turb: 9, T: 28.6, eco: 0.8, cost: 0.2, note: 'Pradera de pastos marinos: zona de cría.' },
  { id: 'C', x: 334, y: 118, name: 'Toma actual (muelle)', depth: 8, tds: 35.4, turb: 6, T: 27.4, eco: 0.4, cost: 0.0, note: 'Boca de la toma existente.' },
  { id: 'D', x: 450, y: 136, name: 'Borde del arrecife', depth: 6, tds: 35.6, turb: 1.5, T: 27.8, eco: 0.95, cost: 0.4, note: 'Arrecife somero: larvas de peces y corales.' },
  { id: 'E', x: 540, y: 58, name: 'Fondo mar adentro', depth: 14, tds: 35.8, turb: 1.2, T: 25.6, eco: 0.15, cost: 0.6, note: 'Agua profunda, fría y estable; tubería más larga.' },
];
const DroneScene = {
  overlay: false, touchControls: true,
  enter(p) {
    this.onDone = p.onDone; this.t = 0; this.x = 330; this.y = 270; this.vx = 0; this.vy = 0; this.bat = 1; this.samples = {}; this.sampling = null;
    this.phase = 'fly'; this.demoDone = false; this.msg = null; this.choice = null; this.rng = RNG(77);
    this.map = this.buildMap(); this.ps = new Particles(400);
    this.say('Demostración: vuela hasta la boya {y}C{/} (la toma actual) y mantente encima con {y}E{/} para muestrear. Yo explico la primera lectura.');
    Audio2.sfx('power');
  },
  say(t) { this.msg = { text: t, t: 0 }; Audio2.sfx('voice', { voice: 'kiru' }); },
  buildMap() {
    const pb = new PixelBuffer(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const depth = clamp(1 - y / 300 + fbm(x * 0.01, y * 0.01, 3, 4) * 0.25, 0, 1);
      let c = rampDither(['#20d6c7', '#16a6cf', '#1283bf', '#1063a6', '#0f4888', '#0d3168'], depth, x, y);
      pb.data[y * W + x] = U(c);
    }
    // arrecife y pradera
    for (let i = 0; i < 260; i++) { const x = 400 + Math.cos(i * 1.7) * 60 * Math.sqrt((i % 37) / 37), y = 150 + Math.sin(i * 2.3) * 24 * Math.sqrt((i % 23) / 23); pb.disc(x, y, 2.2, ['#ff8ab8', '#ffb93b', '#c2f58e', '#e05aa0'][i % 4]); }
    for (let i = 0; i < 200; i++) { const x = 190 + (i * 37 % 110), y = 168 + (i * 13 % 40); pb.vline(x, y, y + 4, i % 2 ? '#33a552' : '#1f854c'); }
    // playa y muelle
    for (let y = 286; y < H; y++) for (let x = 0; x < W; x++) pb.set(x, y, rampDither(RAMP.sand, 0.55 + (y - 286) / 140, x, y));
    for (let x = 0; x < W; x++) { pb.set(x, 285 + Math.round(Math.sin(x * 0.08) * 1.5), '#fff6d8'); pb.set(x, 284 + Math.round(Math.sin(x * 0.08) * 1.5), '#c6fff2'); }
    pb.rect(328, 120, 12, 166, '#8a5a3c'); pb.rect(328, 120, 12, 2, '#c8925e'); for (let y = 122; y < 286; y += 6) pb.hline(328, 339, y, '#6e452e');
    pb.rect(312, 280, 44, 10, '#e8f0f4'); pb.rect(312, 280, 44, 2, '#20d6c7');
    // arroyo seco y pluma de sedimentos
    for (let i = 0; i < 40; i++) pb.rect(20 + i * 2, 286 + i * 0.4, 6, 3, '#c97c38');
    return pb.toCanvas();
  },
  reading(P) {
    // la lectura incluye incertidumbre y el pulso que avanza desde el noroeste
    const pulse = clamp(this.t / 90, 0, 1) * (P.x < 260 ? 1 : 0.4);
    const u = this.samples._upg ? 0.5 : 1;
    return { tds: P.tds + (this.rng() - 0.5) * 0.3, tdsU: 0.2 * u, turb: P.turb * (1 + pulse * 0.6) + (this.rng() - 0.5) * 1, turbU: Math.max(0.5, P.turb * 0.15) * u, T: P.T + (this.rng() - 0.5) * 0.2, TU: 0.2 };
  },
  update(dt) {
    this.t += dt; if (this.msg) this.msg.t += dt; this.ps.update(dt);
    if (this.phase === 'fly') {
      const ax = (Input.down('right') ? 1 : 0) - (Input.down('left') ? 1 : 0), ay = (Input.down('down') ? 1 : 0) - (Input.down('up') ? 1 : 0);
      this.vx = approach(this.vx, ax * 90, 260 * dt); this.vy = approach(this.vy, ay * 90, 260 * dt);
      this.x = clamp(this.x + this.vx * dt, 10, W - 10); this.y = clamp(this.y + this.vy * dt, 16, H - 30);
      this.bat = Math.max(0, this.bat - dt * (0.006 + (Math.abs(this.vx) + Math.abs(this.vy)) * 0.00005));
      if (Math.random() < 0.3) this.ps.emit('splash', this.x + (Math.random() - 0.5) * 10, this.y + 12, 0, -20, 1);
      const near = DRONE_POINTS.find(P => dist(P.x, P.y, this.x, this.y) < 14);
      if (near && (Input.down('interact') || Input.down('jump') || (Input.pointer.down && dist(Input.pointer.x, Input.pointer.y, near.x, near.y) < 20))) {
        if (!this.sampling || this.sampling.P !== near) this.sampling = { P: near, k: 0 };
        this.sampling.k += dt / 1.4;
        if (this.sampling.k >= 1 && !this.samples[near.id]) {
          this.samples[near.id] = this.reading(near); Audio2.sfx('sample'); this.ps.emit('drop', near.x, near.y, 0, -60, 10, 3);
          LearningModel.note('sample');
          if (!this.demoDone && near.id === 'C') {
            this.demoDone = true;
            const r = this.samples.C;
            this.say('Lectura C: turbidez ' + fmt(r.turb, 1) + ' ± ' + fmt(r.turbU, 1) + ' NTU, TDS ' + fmt(r.tds, 1) + ' g/L, ' + fmt(r.T, 1) + ' °C. Observa el {y}±{/}: dos puntos solo son distintos si la diferencia supera la incertidumbre. Ahora tú: muestrea al menos 3 puntos más.');
          } else if (Object.keys(this.samples).filter(k => k !== '_upg').length >= 4 && this.demoDone) this.say('Datos suficientes. Cuando quieras, pulsa {y}Decidir{/} para elegir el mejor punto de captación.');
        }
      } else if (!near) this.sampling = null;
      if (this.bat <= 0.02) { this.bat = 0.02; this.say('Batería del dron baja: la energía también limita las mediciones. Decide con los datos que tienes.'); }
    }
  },
  render(g) {
    g.drawImage(this.map, 0, 0);
    // pluma del arroyo que crece con el tiempo (pulso)
    const k = clamp(this.t / 90, 0, 1);
    for (let i = 0; i < 6; i++) fshadow(g, 70 + i * 22 + k * 40, 250 - i * 18 - k * 30, 34 + i * 6 + k * 20, 16 + i * 3, '#a07a3a', 0.35 + 0.1 * k);
    // oleaje
    drawWaveBands(g, 0, 10, W, 260, Game.time, 'rgba(255,255,255,0.18)', 9);
    drawSeaSparkles(g, 0, 0, W, 280, Game.time, 0.8);
    // boyas
    for (const P of DRONE_POINTS) {
      const s = this.samples[P.id];
      fdisc(g, P.x, P.y + 2, 6, 'rgba(10,20,40,0.4)');
      fdisc(g, P.x, P.y, 5, s ? '#86e36f' : '#ff6b6b'); fdisc(g, P.x - 1, P.y - 1, 2, '#ffffff');
      frect(g, P.x - 1, P.y - 12, 2, 7, '#fffaf0'); frect(g, P.x, P.y - 12, 5, 3, s ? '#86e36f' : '#ffe14d');
      drawText(g, P.id, P.x + 8, P.y - 6, { color: '#fffaf0', shadow: '#0a1f4a' });
      if (s) drawText(g, fmt(s.turb, 1) + '±' + fmt(s.turbU, 1) + ' NTU', P.x + 8, P.y + 4, { font: 'tiny', color: '#fff6d8', shadow: '#0a1f4a' });
    }
    this.ps.render(g);
    // sombra y dron
    fshadow(g, this.x, this.y + 14, 7, 2, '#05031a', 0.5);
    drawDrone(g, this.x, this.y, Game.time, true);
    if (this.sampling) { const kk = clamp(this.sampling.k, 0, 1); UIK.bar(g, this.x - 14, this.y + 6, 28, 4, kk, '#56e5ff'); for (let i = 0; i < 10; i++) fpx(g, this.x, this.y + 4 + i * 1.2, '#a6f4ff'); }
    // panel
    UIK.panel(g, W - 214, 6, 208, 168, 'glass');
    drawText(g, 'DRON DE MUESTREO', W - 206, 11, { color: '#ffe14d', font: 'tiny' });
    UIK.bar(g, W - 206, 20, 120, 6, this.bat, this.bat < 0.25 ? '#ff4e5d' : '#86e36f', '#0a0c22', 10);
    drawText(g, 'BATERÍA ' + fmt0(this.bat * 100) + '%', W - 80, 20, { font: 'tiny', color: '#cfd6f0' });
    const T = { head: ['PUNTO', 'NTU', 'TDS G/L', 'T °C'], rows: [] };
    for (const P of DRONE_POINTS) { const s = this.samples[P.id]; T.rows.push([P.id + ' ' + P.depth + 'M', s ? fmt(s.turb, 1) + '±' + fmt(s.turbU, 0) : '—', s ? fmt(s.tds, 1) : '—', s ? fmt(s.T, 1) : '—']); }
    T.widths = [0.28, 0.28, 0.24, 0.2];
    // tabla en estilo oscuro
    let yy = 32;
    T.head.forEach((h, i) => drawText(g, h, W - 206 + [0, 54, 108, 152][i], yy, { font: 'tiny', color: '#ffe14d' }));
    yy += 9;
    T.rows.forEach((r, ri) => { r.forEach((v, i) => drawText(g, v, W - 206 + [0, 54, 108, 152][i], yy, { font: 'tiny', color: '#fffaf0' })); yy += 9; });
    const P = DRONE_POINTS.find(PP => dist(PP.x, PP.y, this.x, this.y) < 30);
    if (P) drawTextBlock(g, '{c}' + P.id + ':{/} ' + P.name + '. ' + P.note, W - 206, yy + 4, 196, { color: '#cfd6f0' });
    Gui.begin();
    const n = Object.keys(this.samples).length;
    if (this.phase === 'fly' && n >= 4 && this.demoDone) { if (Gui.button(g, 'decide', W - 160, 150, 150, 18, 'Decidir punto de toma', { style: 'gold', icon: 'target' })) { this.phase = 'decide'; } }
    if (this.phase === 'decide') this.renderDecide(g);
    if (this.phase === 'result') this.renderResult(g);
    Gui.end();
    if (this.msg && this.phase === 'fly') {
      const lines = wrapText(this.msg.text, 380);
      const hh = lines.length * 11 + 10;
      UIK.panel(g, 6, H - hh - 6, 400, hh, 'glass'); Icons.draw(g, 'kiru', 10, H - hh - 2);
      let rem = Math.floor(this.msg.t * 60);
      lines.forEach((l, i) => { if (rem > 0) drawText(g, l, 28, H - hh - 1 + i * 11, { color: '#fffaf0', max: rem }); rem -= stripMarkup(l).length + 1; });
    }
    drawText(g, 'Flechas/WASD: volar · E: muestrear (mantener)', 8, 8, { font: 'tiny', color: '#fffaf0', shadow: '#0a1f4a' });
  },
  renderDecide(g) {
    fdither(g, 0, 0, W, H, '#05030f', 0.6);
    UIK.panel(g, 60, 40, W - 120, H - 80, 'tech');
    UIK.header(g, 60, 40, W - 120, 'DECIDIR PUNTO DE CAPTACIÓN', 'tech', 'target');
    drawTextBlock(g, 'Elige el punto donde convendría captar (o reubicar la toma) considerando calidad del agua, riesgo ecológico y costo. Tus mediciones incluyen incertidumbre.', 72, 64, W - 144, { color: '#fffaf0' });
    let y = 98;
    DRONE_POINTS.forEach((P, i) => {
      const s = this.samples[P.id];
      const label = P.id + ' · ' + P.name + ' (' + P.depth + ' m) — ' + (s ? 'turb. ' + fmt(s.turb, 1) + '±' + fmt(s.turbU, 1) + ' NTU, ' + fmt(s.T, 1) + ' °C' : 'sin muestra');
      const r = Gui.choice(g, 'dp' + P.id, 72, y, W - 144, label, P.id, { state: this.choice === i ? 'selected' : null });
      if (r.clicked) this.choice = i;
      y += r.h + 2;
    });
    if (Gui.button(g, 'conf', W / 2 - 60, H - 64, 120, 20, 'Confirmar', { style: 'good', disabled: this.choice == null })) {
      const P = DRONE_POINTS[this.choice];
      const ok = P.id === 'E' || (P.id === 'C' && this.samples.E == null);
      const acceptable = P.id === 'C';
      LearningModel.record({ kind: 'challenge', id: 'lv1_drone_point', ra: 'RA-01', concepts: ['waterQuality', 'pretreatment', 'steamInquiry'], solo: 4, correct: P.id === 'E', misconception: P.id === 'D' ? 'agua clara = sin impacto ecológico' : P.id === 'A' ? 'ignorar fuentes de sedimentos' : P.id === 'B' ? 'ignorar zonas de cría' : null });
      GS.lp(1).feedback = true;
      this.res = { P, ok: P.id === 'E', acceptable };
      this.phase = 'result'; Audio2.sfx(P.id === 'E' ? 'success' : acceptable ? 'confirm' : 'error');
    }
  },
  renderResult(g) {
    const r = this.res;
    fdither(g, 0, 0, W, H, '#05030f', 0.6);
    UIK.panel(g, 80, 70, W - 160, 200, r.ok ? 'green' : r.acceptable ? 'tech' : 'alert');
    const txt = {
      E: '{g}Punto E: agua profunda, fría y de baja turbidez, lejos del arrecife y la pradera.{/} Su desventaja es real: tubería más larga y más costo de bombeo. Es la opción más robusta para la calidad y el ecosistema; el costo debe discutirse, no ocultarse.',
      C: '{y}Punto C: la toma actual.{/} Es la más barata, pero su turbidez sube con los pulsos del noroeste. Puede funcionar con rejillas finas, menor velocidad y pretratamiento adaptativo. Compárala con E: ¿qué ganas y qué pagas?',
      D: '{o}Punto D: el agua es clara, pero está junto al arrecife:{/} captar allí arrastraría larvas y alteraría la zona de cría. Agua clara no significa ausencia de impacto.',
      A: '{o}Punto A: desembocadura del arroyo.{/} La pluma de sedimentos y la salinidad variable harían colapsar el pretratamiento en cada lluvia.',
      B: '{o}Punto B: pradera marina.{/} Es zona de cría; además el sedimento fino se resuspende con el oleaje.',
    }[r.P.id];
    drawTextBlock(g, txt, 92, 84, W - 184, { color: '#fffaf0' });
    if (Gui.button(g, 'fin', W / 2 - 60, 240, 120, 20, 'Continuar', { style: 'good' })) { Game.pop(); this.onDone && this.onDone({ choice: r.P.id, ok: r.ok }); }
  },
};
DroneScene.overlay = true;

/* =====================================================================
   Gemelo de la toma — simulador de captación y pretratamiento
   ===================================================================== */
const Sim01 = makeSim({
  title: 'GEMELO DE LA TOMA · captación y pretratamiento', icon: 'filter', ra: 'RA-01', concepts: ['pretreatment', 'waterQuality'],
  phases: ['demo', 'guided', 'auto', 'transfer', 'free'],
  hintLadder: ['¿Qué cambió primero: el caudal, la turbidez o la presión diferencial del filtro?', 'El ΔP del filtro anticipa la saturación: sube antes de que la turbidez de salida se dispare.', 'Reduce el caudal de toma, sube la coagulación, lava el filtro a tiempo y cubre la demanda con la reserva.'],
  init(p) {
    this.cfg = { q: 100, depth: p.point === 'E' ? 14 : 8, screens: !!GS.s.decisions.fineScreens, coag: 0.4, storage: true };
    this.stopAfter = p.stopAfter || 'free';
    this.marea = !!p.marea;
    this.reset();
  },
  reset() {
    this.h = 0; this.dp = 0.35; this.tank = 0.7; this.series = []; this.produced = 0; this.treatableH = 0; this.ecoAcc = 0; this.errors = 0; this.backwashT = 0; this.running = false; this.done = false; this.verdict = null;
    this.scn = this.scenario(this.phase);
  },
  scenario(ph) {
    if (ph === 'auto' || ph === 'free') return { hours: 12, base: 3, pulseAt: 3.5, pulseW: 4, pulseAmp: 45, demand: 70, T: 27, sdiAdd: 0, live: true };
    if (ph === 'transfer') return { hours: 24, base: 4, pulseAt: 6, pulseW: 12, pulseAmp: 14, demand: 70, T: 31, sdiAdd: 2.5, live: false, algae: true };
    return { hours: 6, base: 3, pulseAt: 99, pulseW: 1, pulseAmp: 0, demand: 70, T: 27, sdiAdd: 0, live: true };
  },
  turbAt(h) { const s = this.scn; const k = Math.exp(-Math.pow((h - s.pulseAt) / (s.pulseW / 2), 2)); return s.base + s.pulseAmp * k; },
  onPhase(ph) {
    this.reset();
    if (ph === 'demo') { this.say('Demostración: observa qué ocurre si capto {y}140 m³/h{/} desde 8 m sin rejillas. Mira el ΔP del filtro y el riesgo ecológico.'); this.cfg.q = 140; this.cfg.screens = false; this.running = true; }
    if (ph === 'guided') { this.cfg.q = 100; this.say('Tu turno (día normal, 6 h): consigue turbidez de salida < 1 NTU, riesgo ecológico bajo (< 0,4) y al menos 85 m³/h hacia la planta. Pulsa {y}Probar 6 h{/}.'); }
    if (ph === 'auto') this.say(this.marea ? 'El Filtro Ciego: llega el pulso de turbidez. Tía Marea estima que llegará en 3–4 h. Opera en vivo; no habrá pistas automáticas.' : 'El Filtro Ciego: llega el pulso de turbidez (llegada incierta: 2–5 h). Opera en vivo; no habrá pistas automáticas.');
    if (ph === 'transfer') this.say('Transferencia: temporada de floración algal (31 °C, materia orgánica, pulso largo). Diseña el protocolo ANTES de correr 24 h: no podrás ajustar durante la simulación.');
    if (ph === 'free') this.say('Laboratorio libre: experimenta con cualquier combinación.');
  },
  step(dt) {
    if (!this.running || this.done) return;
    const dh = dt * (this.phase === 'demo' ? 0.6 : this.phase === 'guided' ? 1.2 : this.phase === 'transfer' ? 2.4 : 0.55) * (Input.down('fast') ? 3 : 1);
    const s = this.scn;
    const turbIn = this.turbAt(this.h);
    const backwash = this.backwashT > 0;
    if (backwash) this.backwashT -= dh;
    const r = IntakeModel.step({ Qtoma: backwash ? this.cfg.q * 0.6 : this.cfg.q, depth: this.cfg.depth, screens: this.cfg.screens, coag: this.cfg.coag, turbIn, filterDP: this.dp, cap: 130, dt: dh, backwash });
    if (s.algae) r.turbOut += (this.cfg.depth < 6 ? 1.2 : 0.3) * (1 - this.cfg.coag * 0.6);
    this.dp = r.filterDP;
    // auto-lavado programado en transferencia (protocolo)
    if (this.phase === 'transfer' && this.cfg.autoBW && this.dp > 0.9 && this.backwashT <= 0) this.backwashT = 0.6;
    const toRO = r.treatable || this.cfg.storage === false ? Math.min(r.Qtoma, 120) : 0;
    const tankIn = r.treatable ? toRO : 0;
    this.tank = clamp(this.tank + (tankIn - s.demand) * dh / 900, 0, 1);
    this.produced += tankIn * dh;
    if (r.treatable) this.treatableH += dh;
    this.ecoAcc += r.ecoRisk * dh;
    this.last = r;
    this.h += dh;
    if (this.series.length === 0 || this.h - this.series[this.series.length - 1].h > 0.1) this.series.push({ h: this.h, tin: turbIn, tout: r.turbOut, dp: this.dp, tank: this.tank, eco: r.ecoRisk });
    // errores seguros
    if (r.overload > 0.05 && this.phase !== 'demo') { this.errors++; this.safeError('Sobrecarga', 'El caudal supera la capacidad de diseño del pretratamiento: el agua sale turbia hacia las membranas y el filtro se satura.', '¿Qué variable puedes reducir sin cerrar por completo la planta?'); this.onSafeRetry = () => { this.cfg.q = Math.min(this.cfg.q, 125); }; }
    else if (this.dp > 1.45 && this.phase !== 'demo') { this.errors++; this.safeError('Filtro colapsado', 'La presión diferencial superó 1,45 bar: el medio filtrante se compacta y deja pasar sólidos.', '¿Cuál fue el primer indicador que subió? ¿Qué acción lo reduce?'); this.onSafeRetry = () => { this.dp = 1.1; this.backwashT = 0.6; }; }
    else if (this.tank <= 0.02 && this.phase !== 'demo') { this.errors++; this.safeError('Reserva agotada', 'El tanque se vació: los hogares se quedarían sin agua mientras la toma se recupera.', '¿Cuándo convenía usar la reserva y cuándo recuperarla?'); this.onSafeRetry = () => { this.tank = 0.15; }; }
    // partículas visuales
    if (Math.random() < turbIn / 40) this.ps.emit('dust', 30 + Math.random() * 80, 120 + Math.random() * 60, 20, 0, 1);
    if (this.h >= s.hours) this.evaluate();
  },
  evaluate() {
    this.running = false; this.done = true;
    const s = this.scn;
    const frac = this.treatableH / s.hours, eco = this.ecoAcc / s.hours;
    let ok, txt;
    if (this.phase === 'demo') { ok = true; txt = 'Con 140 m³/h sin rejillas, el ΔP sube rápido y el riesgo ecológico es alto: captar más no significa producir mejor.'; }
    else if (this.phase === 'guided') {
      const q = this.last ? this.last.Qtoma : 0;
      ok = this.last && this.last.turbOut < 1 && eco < 0.4 && q >= 85;
      txt = ok ? 'Configuración estable: calidad dentro de diseño, bajo riesgo ecológico y producción suficiente.' : (eco >= 0.4 ? 'El riesgo ecológico sigue alto: revisa rejillas, profundidad y velocidad de aproximación.' : q < 85 ? 'La planta recibe muy poca agua: el caudal es insuficiente para la demanda.' : 'La turbidez de salida supera 1 NTU: revisa coagulación y profundidad de captación.');
      this.evidence('lv1_guided_intake', ok, { solo: 3 });
    } else if (this.phase === 'auto') {
      ok = frac >= 0.8 && this.tank > 0.15 && eco < 0.5 && this.errors === 0;
      txt = ok ? '¡El Filtro Ciego vencido! Mantuviste agua tratable el ' + fmt0(frac * 100) + ' % del tiempo sin colapsar el filtro.' : 'Agua tratable el ' + fmt0(frac * 100) + ' % del tiempo, errores seguros: ' + this.errors + '. Objetivo: ≥ 80 %, reserva > 15 % y sin errores.';
      this.evidence('lv1_guardian_filtro_ciego', ok, { solo: 4 });
    } else if (this.phase === 'transfer') {
      ok = frac >= 0.75 && eco < 0.45 && this.errors === 0;
      txt = ok ? 'Tu protocolo funciona en otra estación: captación profunda, coagulación alta y lavado programado ante algas.' : 'El protocolo no resistió la floración algal. ¿Captas cerca de la superficie, donde están las algas? ¿Programaste lavados?';
      this.evidence('lv1_transfer_protocol', ok, { solo: 5, transfer: true });
    } else { ok = true; txt = 'Laboratorio libre: los datos quedan en tu cuaderno.'; }
    this.verdict = { ok, txt };
    Audio2.sfx(ok ? 'success' : 'error');
  },
  draw(g) {
    const c = this.cfg, r = this.last || IntakeModel.step({ Qtoma: c.q, depth: c.depth, screens: c.screens, coag: c.coag, turbIn: this.turbAt(this.h), filterDP: this.dp, cap: 130, dt: 0 });
    const turbIn = this.turbAt(this.h);
    // --- esquema pixel (izquierda)
    const X0 = 8, Y0 = 30, WW = 372, HH = 262;
    Charts.frame(g, X0, Y0, WW, HH, '#0a1838');
    // mar en corte
    for (let y = Y0 + 30; y < Y0 + HH - 30; y++) { const k = (y - Y0 - 30) / (HH - 60); frect(g, X0 + 1, y, 150, 1, rampDither(['#20d6c7', '#16a6cf', '#1283bf', '#1063a6', '#0d3168'], k, X0, y)); }
    fdither(g, X0 + 1, Y0 + 30, 150, HH - 60, '#a07a3a', clamp(turbIn / 60, 0, 0.7));
    if (this.scn.algae) for (let i = 0; i < 40; i++) fpx(g, X0 + 4 + (i * 37) % 146, Y0 + 32 + (i * 7) % 18, '#86e36f');
    for (let x = X0 + 1; x < X0 + 151; x++) fpx(g, x, Y0 + 30 + Math.round(Math.sin(x * 0.2 + Game.time * 3)), '#c6fff2');
    frect(g, X0 + 1, Y0 + HH - 30, 150, 29, '#c97c38'); fdither(g, X0 + 1, Y0 + HH - 30, 150, 29, '#e49c44', 0.5);
    drawText(g, 'MAR', X0 + 6, Y0 + 34, { font: 'tiny', color: '#e6fdff' });
    // cabezal de toma a la profundidad elegida
    const hy = Y0 + 30 + (c.depth / 15) * (HH - 70);
    frect(g, X0 + 120, Y0 + 26, 6, hy - Y0 - 26, '#6aa0b4');
    frect(g, X0 + 112, hy - 6, 22, 12, '#345a78'); for (let k = 0; k < 6; k++) frect(g, X0 + 114 + k * 3, hy - 5, 1, 10, c.screens ? '#cfe8ee' : '#477a94');
    drawText(g, fmt0(c.depth) + ' m', X0 + 96, hy - 3, { font: 'tiny', color: '#fffaf0' });
    // peces cerca (riesgo ecológico)
    for (let i = 0; i < 6; i++) {
      const pull = r.ecoRisk;
      const fx = X0 + 30 + ((Game.time * 12 + i * 23) % 80) + pull * 30 * Math.sin(Game.time + i), fy = hy - 20 + i * 7;
      frect(g, Math.round(fx), Math.round(fy), 4, 2, pull > 0.5 && i < 3 ? '#ff4e5d' : '#ffb93b'); fpx(g, Math.round(fx) - 1, Math.round(fy), '#ffe0a0');
    }
    // tubería → cribado → coagulación → filtro → tanque → OI
    const pY = Y0 + 34;
    Charts.flow(g, [[X0 + 123, Y0 + 26], [X0 + 123, pY - 10], [X0 + 170, pY - 10]], 'seawater', c.q / 100, 3);
    // coagulación
    frect(g, X0 + 172, pY - 22, 50, 40, '#1d2a48'); frect(g, X0 + 174, pY - 14, 46, 30, '#1283bf'); fdither(g, X0 + 174, pY - 14, 46, 30, '#a07a3a', clamp(turbIn / 50, 0, 0.6));
    for (let i = 0; i < 12; i++) { const fx = X0 + 176 + (i * 13 + Game.time * 8) % 42, fy = pY - 10 + (i * 7) % 24; fdisc(g, fx, fy, 1 + c.coag * 1.5, '#c8a860'); }
    drawText(g, 'COAGULACIÓN', X0 + 197, pY - 30, { font: 'tiny', color: '#cfd6f0', align: 'center' });
    Charts.flow(g, [[X0 + 222, pY], [X0 + 240, pY]], 'seawater', c.q / 100, 3);
    // filtro con capas que se ensucian
    const fx0 = X0 + 242, fy0 = pY - 26, fw = 44, fh = 120;
    frect(g, fx0, fy0, fw, fh, '#477a94'); frect(g, fx0 + 3, fy0 + 3, fw - 6, fh - 6, '#0a1838');
    frect(g, fx0 + 3, fy0 + 40, fw - 6, 26, '#2a2a3a'); frect(g, fx0 + 3, fy0 + 66, fw - 6, 40, '#e4c088');
    for (let i = 0; i < 40; i++) fpx(g, fx0 + 4 + (i * 7) % (fw - 8), fy0 + 67 + (i * 11) % 38, '#c49860');
    const dirt = clamp((this.dp - 0.3) / 1.2, 0, 1);
    fdither(g, fx0 + 3, fy0 + 40, fw - 6, Math.round(26 + 40 * dirt), '#5a3a1a', 0.3 + dirt * 0.5);
    if (this.backwashT > 0) for (let i = 0; i < 8; i++) fpx(g, fx0 + 6 + Math.random() * (fw - 12), fy0 + 10 + Math.random() * 30, '#c6fff2');
    drawText(g, 'FILTRO', fx0 + fw / 2, fy0 - 8, { font: 'tiny', color: '#cfd6f0', align: 'center' });
    Charts.gauge(g, fx0 + fw / 2, fy0 + fh + 22, 13, clamp(this.dp / 1.6, 0, 1), '#56e5ff', 'ΔP', fmt(this.dp, 2));
    Charts.flow(g, [[fx0 + fw, fy0 + fh - 10], [X0 + 310, fy0 + fh - 10]], r.treatable ? 'permeate' : 'brine', r.treatable ? 1 : 0.3, 3);
    // tanque de reserva
    Charts.tank(g, X0 + 312, Y0 + 70, 34, 120, this.tank, RAMP.sea, 'RESERVA', { reserve: 0.15 });
    drawText(g, fmt0(this.tank * 100) + '%', X0 + 329, Y0 + 60, { font: 'tiny', color: '#fffaf0', align: 'center' });
    drawText(g, '→ OI', X0 + 330, Y0 + HH - 18, { font: 'tiny', color: '#a6f4ff', align: 'center' });
    drawText(g, 'SALIDA ' + fmt(r.turbOut, 2) + ' NTU', X0 + 300, Y0 + 40, { font: 'tiny', color: r.turbOut < 1 ? '#86e36f' : r.turbOut < 2 ? '#ffe14d' : '#ff4e5d', align: 'right' });
    if (r.overload > 0.05) drawText(g, '¡SOBRECARGA!', X0 + 200, Y0 + HH - 14, { color: '#ff4e5d', align: 'center' });
    // --- controles (derecha)
    const CX = 388, CW = W - CX - 8;
    UIK.panel(g, CX, 30, CW, 168, 'tech');
    Gui.begin();
    const locked = this.phase === 'demo' || (this.phase === 'transfer' && this.running);
    const yy = 36;
    c.q = Gui.slider(g, 'q', CX + 8, yy, CW - 16, c.q, 40, 160, 5, { label: 'Caudal de toma', unit: 'm³/h', disabled: locked, marks: [{ v: 130, col: '#ff4e5d' }], tip: 'Capacidad de diseño del pretratamiento: 130 m³/h' });
    c.depth = Gui.slider(g, 'd', CX + 8, yy + 24, CW - 16, c.depth, 2, 14, 1, { label: 'Profundidad de la toma', unit: 'm', disabled: locked || this.phase === 'auto' });
    c.coag = Gui.slider(g, 'c', CX + 8, yy + 48, CW - 16, c.coag, 0, 1, 0.1, { label: 'Coagulación (abstracta)', fmt: v => v < 0.34 ? 'baja' : v < 0.67 ? 'media' : 'alta', disabled: locked, color: '#c8a860' });
    const sc = Gui.toggle(g, 'scr', CX + 8, yy + 74, 'Rejillas finas', c.screens); if (!locked) c.screens = sc;
    if (this.phase === 'transfer') { const ab = Gui.toggle(g, 'abw', CX + 120, yy + 74, 'Lavado automático', !!c.autoBW); if (!locked) c.autoBW = ab; }
    else if (Gui.button(g, 'bw', CX + 120, yy + 72, CW - 128, 16, this.backwashT > 0 ? 'Lavando…' : 'Lavar filtro', { icon: 'reset', style: 'ghost', disabled: locked || this.backwashT > 0 || !this.running })) { this.backwashT = 0.6; Audio2.sfx('valve'); }
    // indicadores
    const ix = CX + 8, iy = yy + 96;
    drawText(g, 'Velocidad de aproximación: ' + fmt(r.approachV, 3) + ' m/s', ix, iy, { font: 'tiny', color: r.approachV > 0.15 ? '#ff9f43' : '#86e36f' });
    drawText(g, 'Riesgo ecológico: ' + fmt(r.ecoRisk, 2) + '   SDI: ' + fmt(r.sdi, 1), ix, iy + 9, { font: 'tiny', color: r.ecoRisk > 0.4 ? '#ff9f43' : '#86e36f' });
    drawText(g, 'Hora ' + fmt(this.h, 1) + ' / ' + this.scn.hours + ' h   Agua a planta: ' + fmt0(this.produced) + ' m³', ix, iy + 18, { font: 'tiny', color: '#cfd6f0' });
    drawText(g, 'Tratable: ' + (r.treatable ? 'SÍ' : 'NO') + '   Turbidez entrada: ' + fmt(turbIn, 1) + ' NTU', ix, iy + 27, { font: 'tiny', color: r.treatable ? '#86e36f' : '#ff4e5d' });
    // botones de control de corrida
    const by = 176;
    if (this.phase === 'guided' && !this.running && !this.done) { if (Gui.button(g, 'run', CX + 8, by, 110, 18, 'Probar 6 h', { style: 'good', icon: 'play' })) { this.reset(); this.running = true; } }
    if ((this.phase === 'auto' || this.phase === 'free') && !this.running && !this.done) { if (Gui.button(g, 'run', CX + 8, by, 110, 18, 'Iniciar', { style: 'good', icon: 'play' })) { this.running = true; } }
    if (this.phase === 'transfer' && !this.running && !this.done) { if (Gui.button(g, 'run', CX + 8, by, 130, 18, 'Correr 24 h', { style: 'good', icon: 'play' })) { this.running = true; } }
    if (this.running && this.phase !== 'transfer' && Gui.button(g, 'pause', CX + 8, by, 80, 18, this.paused ? 'Seguir' : 'Pausa', { style: 'ghost', icon: this.paused ? 'play' : 'pause' })) this.paused = !this.paused;
    if (Gui.button(g, 'hintb', CX + CW - 64, by, 56, 18, 'Pista', { style: 'ghost', icon: 'hint', disabled: this.phase === 'auto' })) this.hint();
    // gráfico temporal
    const S = this.series;
    const band = this.phase === 'auto' ? { x0: this.marea ? 3 : 2, x1: this.marea ? 4 : 5, color: '#ffb93b', level: 0.18 } : null;
    Charts.line(g, CX, 202, CW, 92, [
      { data: S.map(s => [s.h, s.tin]), color: '#c8a860', label: 'entrada' },
      { data: S.map(s => [s.h, s.tout * 10]), color: '#56e5ff', label: 'salida×10' },
      { data: S.map(s => [s.h, s.dp * 20]), color: '#ff6b6b', label: 'ΔP×20' },
    ].map(sr => sr.data.length ? sr : Object.assign(sr, { data: [[0, 0]] })), { xMin: 0, xMax: this.scn.hours, yMin: 0, yMax: 60, legend: true, xLabel: 'h', yLabel: 'NTU', bands: band ? [band] : [], hlines: [{ v: 24, color: '#ff4e5d', label: 'ΔP límite' }], cursor: this.h });
    // veredicto
    if (this.verdict) {
      const v = this.verdict;
      const vh = textHeight(v.txt, 340) + 34;
      UIK.panel(g, 20, H - vh - 10, 360, vh, v.ok ? 'green' : 'alert');
      drawTextBlock(g, v.txt, 28, H - vh - 4, 344, { color: '#fffaf0' });
      if (v.ok) { if (Gui.button(g, 'nxt', 270, H - 30, 100, 16, this.phase === this.stopAfter ? 'Terminar' : 'Continuar', { style: 'good', icon: 'play' })) { if (this.phase === this.stopAfter) this.finish(true); else this.nextPhase(); } }
      else if (Gui.button(g, 'rt', 270, H - 30, 100, 16, 'Reintentar', { style: 'gold', icon: 'reset' })) { this.attempts++; GS.s.stats.retries++; this.onPhase(this.phase); }
    }
    if (this.phase === 'demo' && !this.done && this.h > 4) this.evaluate();
    Gui.end();
    if (!this.verdict && !this.msg) { }
  },
});
