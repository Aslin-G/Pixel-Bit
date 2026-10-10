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
  platforms: [{ x: 1380, y: 222, w: 240, type: 'metal', baked: true, look: 'slab', strip: '#56e5ff' }, { x: 960, y: 250, w: 30, type: 'metal', baked: true, look: 'grate', railing: false }, { x: 1230, y: 250, w: 30, type: 'metal', baked: true, look: 'grate', railing: false }],
  ladders: [{ x: 1390, y0: 222, y1: 296, look: 'steel' }, { x: 2405, y0: 250, y1: 296, look: 'steel' }],
  hazards: ARCS.map(a => ({ x: a.x, y: 256, w: a.w, h: 40, on: false, power: 150 })),
  cam: { look: 50, vy: 0.66 },
  /* ---------------- plano jugable con kit PF (B) ----------------
     Interior de la bóveda: rellanos de rejilla en la escalera de acceso → chapa sobre galería de
     cables y refrigeración bajo los bastidores → rejilla y zanja bajo la sala de convertidores →
     baldosa pulida bajo la sala de control → chapa y galería del segundo banco → epoxi y zanja de
     potencia ante la barra principal → rellano del ascensor. Geometría intacta. */
  pf: {
    kitB: true,
    terrain: [
      { x0: 0, x1: 290, surf: 'grate', face: 'gallery', depth: 16, stripe: true, pipes: [[13, 3, 'cool'], [23, 2, 'power'], [32, 3, 'cool']], bay: 48 },
      { x0: 290, x1: 880, surf: 'metal', face: 'gallery', depth: 16, pipes: [[13, 3, 'power'], [22, 2, 'cool'], [31, 3, 'cool']], bay: 80, refl: [{ x: 392, w: 3, col: '#b6f05a', k: 0.2 }, { x: 472, w: 3, col: '#b6f05a', k: 0.2 }, { x: 552, w: 3, col: '#b6f05a', k: 0.2 }, { x: 632, w: 3, col: '#b6f05a', k: 0.2 }, { x: 712, w: 3, col: '#b6f05a', k: 0.2 }, { x: 792, w: 3, col: '#b6f05a', k: 0.2 }] },
      { x0: 880, x1: 1310, surf: 'grate', face: 'trench', depth: 16, tw: 90, pipes: [[6, 2, 'power'], [13, 3, 'cool'], [20, 2, 'power']] },
      { x0: 1310, x1: 1760, surf: 'tile', face: 'concrete', depth: 16, checker: true, ramp: ['#0e1220', '#161c2e', '#20283e', '#2c3650', '#3a4664', '#4c5a7a', '#627294', '#7e8eae', '#a0aeca'], refl: [{ x: 1452, w: 26, col: '#48dcf4', k: 0.22 }, { x: 1548, w: 26, col: '#48dcf4', k: 0.22 }, { x: 1680, w: 10, col: '#e05aa0', k: 0.25 }] },
      { x0: 1760, x1: 2140, surf: 'metal', face: 'gallery', depth: 16, pipes: [[13, 3, 'power'], [22, 2, 'cool'], [31, 3, 'cool']], bay: 80, refl: [{ x: 1832, w: 3, col: '#b6f05a', k: 0.2 }, { x: 1912, w: 3, col: '#b6f05a', k: 0.2 }, { x: 1992, w: 3, col: '#b6f05a', k: 0.2 }, { x: 2072, w: 3, col: '#b6f05a', k: 0.2 }] },
      { x0: 2140, x1: 2405, surf: 'epoxy', face: 'trench', depth: 16, tw: 88, ramp: ['#0c1220', '#121a2c', '#182438', '#202e46', '#2a3a56', '#344866', '#405678', '#50688a', '#647c9e', '#8096b6'], pipes: [[6, 2, 'power'], [13, 3, 'power'], [20, 2, 'cool']], refl: [{ x: 2210, w: 50, col: '#ff6b6b', k: 0.14 }] },
      { x0: 2405, x1: 2600, surf: 'metal', face: 'metal', depth: 16, pipe: 'cool', bay: 48 },
    ],
    fg: [
      { kind: 'pillar', x: -6, w: 20, h: 360, ramp: ['#020308', '#05070e', '#0a0e1c', '#121a2e', '#1c2842', '#2a3a58', '#48dcf4'], lit: true },
      { kind: 'beam', x: 320, y: 0, w: 380, h: 14, bolts: true },
      { kind: 'cables', x: 760, y: 10, w: 300, h: 40, seed: 61, n: 4 },
      { kind: 'rail', x: 1080, w: 240, h: 40 },
      { kind: 'beam', x: 1560, y: 0, w: 360, h: 14, bolts: true },
      { kind: 'cables', x: 2080, y: 10, w: 300, h: 40, seed: 63, n: 3 },
      { kind: 'rail', x: 2520, w: 240, h: 40 },
      { kind: 'beam', x: 2940, y: 0, w: 360, h: 14, bolts: true },
      { kind: 'pillar', x: 3340, w: 26, h: 360, ramp: ['#020308', '#05070e', '#0a0e1c', '#121a2e', '#1c2842', '#2a3a58', '#48dcf4'], lit: true },
    ],
  },
  /** Etiquetas científicas en el mundo */
  labels: [
    { x: 560, y: 150, title: 'BANCO BESS · 4 MWh', sub: (sc) => sc.state.blackout ? 'Sin energía' : 'SOC ' + fmt0((sc.state.soc ?? 0.28) * 100) + ' % = ' + fmt0((sc.state.soc ?? 0.28) * 4000) + ' kWh', kind: 'tech', ax: 560, ay: 162 },
    { x: 1094, y: 172, title: 'CONVERTIDORES', sub: 'Batería (CC) y red (CA)', kind: 'tech', ax: 1094, ay: 186 },
    { x: 1500, y: 66, title: 'RESERVA MÍNIMA', sub: (sc) => fmt0((sc.state.reserve ?? 0.1) * 100) + ' % para cargas críticas', kind: 'solar', ax: 1500, ay: 74 },
    { x: 1960, y: 150, title: 'EFICIENCIA ≈ 90 %', sub: 'Entran 100 kWh, salen ≈ 90', kind: 'tech', ax: 1960, ay: 162 },
    { x: 2210, y: 122, title: 'CARGAS CRÍTICAS', sub: 'Agua potable · clínica · comunicaciones', kind: 'alert', ax: 2210, ay: 130 },
  ],
  /* ---------------- accesorios estáticos (prerender) ---------------- */
  props(pb, world) {
    const t0 = nowMs();
    const gy = (x) => world.groundAt(x);
    const segs = PFBGround.surface(pb, world);
    const back = (x) => PFBGround.backEdge(PFBGround.segAt(segs, x), Math.round(x), gy(x));
    const V = PFBV, E = PFBE, H2 = PFBH2, B = PFB, I = PFInfra, D = LV6;
    for (const k of Object.keys(D)) if (Array.isArray(D[k])) D[k].length = 0;
    const yb = (x) => back(x) + 2;
    const off = (sc) => !sc.state.blackout;
    /* ===== techo: carril de luminarias y bandeja de cables a lo largo de la bóveda ===== */
    for (const [x0, x1] of [[300, 1366], [1636, 2400]]) for (const L of V.lampRail(pb, x0, x1, 112, 80)) { D.glows.push({ x: L[0], y: L[1], r: 10, col: '#e8fbff', a: 0.26, mode: 'steady', on: off }); D.cones.push([L[0], L[1], 14, 58, gy(L[0]) - L[1] - 10]); }
    H2.cableTray(pb, 330, 2140, 150, { hang: 64, hangTo: 113 });
    D.flows.push({ pts: [[330, 150], [2140, 150]], kind: 'power', rate: (sc) => (sc.state.blackout || sc.state.charging > 0) ? 0 : 0.8 }, { pts: [[2140, 150], [330, 150]], kind: 'power', rate: (sc) => (!sc.state.blackout && sc.state.charging > 0) ? 0.8 : 0 });
    /* ===== 1. ACCESO (0–290): portal con puerta blindada, barandillas de los rellanos ===== */
    const po = V.portal(pb, 2, yb(60), 132, 156, 'BÓVEDA DE CARGA');
    D.glows.push({ x: po.lamp[0], y: po.lamp[1], r: 9, col: '#ffb93b', a: 0.5, mode: 'pulse', hz: 0.5 });
    const RAIL = ['#1a1e2e', '#3a4258', '#6e769a', '#b0b8d6', '#e8ecf8'];
    for (const [x0, x1] of [[150, 210], [220, 280]]) B.rail(pb, x0, x1, yb(x0) - 1, 30, { ramp: RAIL, gap: 20 });
    for (const [xa, xb] of [[140, 150], [210, 220], [280, 290]]) { const ya = yb(xa) - 1, yb2 = yb(xb) - 1; PFK.lineFn(pb, xa, ya - 30, xb, yb2 - 30, () => U('#b0b8d6')); PFK.lineFn(pb, xa, ya - 15, xb, yb2 - 15, () => U('#6e769a')); }
    H2.extinguisher(pb, 270, yb(270) - 1);
    /* ===== 2. PRIMER BANCO (340–880): bastidores BESS a escala de personaje ===== */
    for (const x of VAULT_RACKS.slice(0, 6)) { const R = E.bessRack(pb, x, yb(x), 64, 100, 14, { cablesTo: 154, label: 'RACK ' + String(VAULT_RACKS.indexOf(x) + 1).padStart(2, '0') }); D.racks.push(Object.assign({ x }, R)); D.screens.push({ x: R.screen[0], y: R.screen[1], w: R.screen[2], h: R.screen[3], kind: 'bars', col: (sc) => (sc.state.soc ?? 0.28) < 0.3 ? '#ff6b6b' : '#b6f05a', on: off }); }
    const hv1 = V.hvacUnit(pb, 834, yb(834), 40, 30); D.fans.push(hv1.fan);
    D.flows.push({ pts: [[882, yb(834) - 8], [882, yb(834) - 70]], kind: 'cool', rate: (sc) => sc.state.blackout ? 0 : 0.6 });
    /* ===== 3. SALA DE CONVERTIDORES (880–1310): PCS, barra de cobre, electrodos de los arcos ===== */
    for (const x of [908, 1030, 1120, 1212]) { const inv = E.inverter(pb, x, yb(x), 50, 72, 14, { ramp: ['#141a2a', '#202838', '#2e384c', '#3e4a62', '#52607a', '#6a7894', '#8a98b2', '#b0bcd0', '#d8e0ec', '#f0f4fa'] }); D.screens.push({ x: inv.screen[0], y: inv.screen[1], w: inv.screen[2], h: inv.screen[3], kind: 'wave', col: '#8d6bff', col2: '#56e5ff', on: off }); D.leds.push({ x: inv.led[0], y: inv.led[1], col: '#3fe0a0', hz: 1.1, ph: x }); }
    E.busbar(pb, 900, 1300, 186, { gap: 50, hangTo: 153 });
    for (const a of ARCS) E.arcGap(pb, a.x, a.w, 198, gy(a.x));
    D.flows.push({ pts: [[900, 189], [1300, 189]], kind: 'power', rate: (sc) => sc.state.blackout ? 0 : (sc.state.elyOn ? 1.4 : 0.6) });
    /* ===== 4. SALA DE CONTROL elevada (1380–1620) y archivo ===== */
    for (let k = 0; k < 5; k++) H2.box(pb, 1414 + k * 36, yb(1500), 30, 46, 8, { ramp: H2.R.NAVY, pw: 15 });
    for (let k = 0; k < 5; k++) for (let j = 0; j < 3; j++) D.leds.push({ x: 1418 + k * 36 + j * 4, y: yb(1500) - 40, col: ['#3fe0a0', '#48dcf4', '#ffd84a'][j], hz: 0.5 + j * 0.3, ph: k + j });
    const cr = H2.controlRoom(pb, 1380, 1620, 222, 108, yb(1500), 'CONTROL MICRORRED');
    cr.screens.forEach((s, i) => D.screens.push(Object.assign({ col: (sc) => i === 2 ? '#ff6b6b' : (s.small ? '#86e36f' : '#56e5ff'), col2: '#ffd84a', on: off }, s)));
    for (const [x, y] of cr.lamps) { D.glows.push({ x, y: y + 1, r: 10, col: '#fff2d0', a: 0.26, mode: 'steady', on: off }); D.cones.push([x, y, 12, 44, 222 - y]); }
    for (const [x, y, col] of cr.leds) D.leds.push({ x, y, col, hz: 0.9, ph: x * 0.07 });
    D.glows.push({ x: cr.beacon[0], y: cr.beacon[1], r: 4, col: '#ff6a50', a: 0.8, mode: 'blink', hz: 0.6, core: '#ffb0a0' });
    B.shade(pb, 1380, 234, 246, 10, -0.22); B.shade(pb, 1380, 244, 246, 8, -0.12);
    const ar = V.archive(pb, 1653, yb(1680));
    for (const [x, y, col] of ar.leds) D.leds.push({ x, y, col, hz: 0.4, ph: x });
    D.glows.push({ x: ar.lock[0], y: ar.lock[1], r: 8, col: '#e05aa0', a: 0.3, mode: 'pulse', hz: 0.6 });
    /* ===== 5. SEGUNDO BANCO (1760–2140) ===== */
    for (const x of VAULT_RACKS.slice(6)) { const R = E.bessRack(pb, x, yb(x), 64, 100, 14, { cablesTo: 154, label: 'RACK ' + String(VAULT_RACKS.indexOf(x) + 1).padStart(2, '0') }); D.racks.push(Object.assign({ x }, R)); D.screens.push({ x: R.screen[0], y: R.screen[1], w: R.screen[2], h: R.screen[3], kind: 'bars', col: (sc) => (sc.state.soc ?? 0.28) < 0.3 ? '#ff6b6b' : '#b6f05a', on: off }); }
    const hv2 = V.hvacUnit(pb, 1764, yb(1764) - 0, 30, 26); D.fans.push(hv2.fan);
    /* ===== 6. BARRA PRINCIPAL (2140–2405): celdas de interruptores ===== */
    const sw = E.switchgear(pb, 2150, yb(2210), 5, 24, 112, 16, { label: 'BARRA PRINCIPAL' });
    D.breakers.push(...sw.breakers);
    for (let k = 0; k < 6; k++) D.glows.push({ x: 2160 + k * 22, y: sw.top - 2, r: 3, col: '#ff4e5d', a: 0.85, mode: 'blink', hz: 0.5, ph: k, on: (sc) => !!sc.state.blackout, core: '#ffb0a0' });
    H2.aframe(pb, 2300 - 26, yb(2274) + 6, 'ARRANQUE EN NEGRO', { bd: '#ff6a50', col: '#ffd0c0' });
    /* ===== 7. ASCENSOR (2405–2600) ===== */
    const el = V.elevator(pb, 2420, yb(2460), 84, 132, 'ASCENSOR · CIUDADELA H2');
    D.lift.push(el.ind);
    D.glows.push({ x: el.call[0], y: el.call[1], r: 4, col: '#48dcf4', a: 0.7, mode: 'blink', hz: 0.8, on: off });
    const hv3 = V.hvacUnit(pb, 2526, yb(2540), 40, 30); D.fans.push(hv3.fan);
    // balizas de emergencia (las únicas que quedan en el apagón)
    for (const x of [140, 870, 1310, 1760, 2140, 2404]) D.glows.push({ x, y: 120, r: 5, col: '#ff4e5d', a: 0.75, mode: 'blink', hz: 0.7, ph: x, on: (sc) => !!sc.state.blackout, core: '#ffb0a0' });
    { const all = LV6.flows.splice(0); for (const r of all) LV6.flows.push(...PFB.chunkFlow(r)); }
    LEVELS[6]._propsMs = Math.round(nowMs() - t0);
  },
  /* ---------------- dinámico ---------------- */
  /* ---------------- panorama: publica el estado de la microrred para el fondo ---------------- */
  skyFx(g, sc) {
    const S = sc.state;
    sc.backdrop.vault = { soc: S.blackout ? 0 : (S.soc ?? 0.28), charging: S.charging || 0, blackout: !!S.blackout };
  },
  renderMid(g, sc, cam) {
    const S = sc.state, t = Game.time, w = sc.world, ox = cam.x, oy = cam.y, D = LV6;
    const gy = (x) => w.groundAt(x) - oy;
    const soc = S.blackout ? 0 : (S.soc ?? 0.28);
    // conos de luz de las luminarias (apagados en el apagón)
    if (!S.blackout) { g.globalCompositeOperation = 'lighter'; for (const [x, y, w0, w1, h] of D.cones) { if (x + w1 < ox || x - w1 > ox + W) continue; g.drawImage(VISTA.lightCone(w0, w1, h, '#dcf4ff', 0.12), Math.round(x - w1 / 2 - ox), Math.round(y - oy)); } g.globalCompositeOperation = 'source-over'; }
    // LED de módulos y barra de SOC en cada bastidor
    for (const R of D.racks) {
      const sx = R.x - ox; if (sx < -80 || sx > W + 10) continue;
      R.leds.forEach(([lx, ly], r) => { const on = (6 - r) / 7 < soc; frect(g, lx - ox, ly - oy, 8, 3, on ? (soc < 0.3 ? '#ff6b6b' : '#b6f05a') : '#1a1a2a'); if (on && !S.blackout && ((Math.floor(t * 3) + r + R.x) % 9 === 0)) fpx(g, lx - ox + 46, ly - oy + 1, '#56e5ff'); });
      if (!S.blackout) drawSOCStrip(g, R.soc[0] - ox, R.soc[1] - oy, R.soc[2], soc, t, S.charging || 0);
    }
    // flujos: bandeja (carga/descarga), barra de cobre (hacia el electrolizador o cargas críticas), refrigeración
    PFInfra.drawFlows(g, sc, D.flows);
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
    // interruptores de la barra principal (arranque en negro por pasos)
    const bs = S.bsSteps || 0;
    D.breakers.forEach(([bx, by], k) => { const x = bx - ox; if (x < -10 || x > W + 10) return; const c = k < bs ? '#b6f05a' : (S.blackout ? '#3a1a20' : '#ff6b6b'); frect(g, x, by - oy, 8, 10, c); if (k < bs) PFK.drawGlow(g, x + 4, by - oy + 5, 7, c, 0.4); });
    // ascensor: indicador de planta
    for (const [ix, iy, iw] of D.lift) { const x = ix - ox; if (x < -30 || x > W + 10) continue; g.fillStyle = S.blackout ? '#5a1a20' : '#48dcf4'; const up = Math.floor(t * 2) % 2; for (let k = 0; k < 3; k++) g.fillRect(Math.round(x + iw / 2 - k), Math.round(iy - oy + 1 + k + up), 1 + k * 2, 1); drawText(g, '-2', x + 2, iy - oy, { font: 'tiny', color: S.blackout ? '#ff6b6b' : '#c4f8ff' }); }
    PFBV.drawFanFront(g, sc, D.fans, !S.blackout);
    PFInfra.drawLeds(g, sc, S.blackout ? [] : D.leds);
    PFB.screens(g, sc, D.screens);
    PFB.glows(g, sc, D.glows);
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
    sc.station({ id: 'gridSim', x: 1450, y: 222, kind: 'sim', label: 'Gemelo de la microrred', glow: '#56e5ff', draw: PFBH2.drawConsoleSt, onUse: async (sc2, st) => gridFlow(sc2, st) });
    sc.station({ id: 'archive', x: 1680, kind: 'clue', label: 'Archivo de limpieza de datos', glow: '#e05aa0', hidden: true, draw: PFB.drawClue, onUse: async (sc2, st) => { st.done = true; await archiveReveal(sc2); } });
    sc.station({ id: 'busbar', x: 2210, kind: 'terminal', label: 'Barra principal', glow: '#ff6b6b', hidden: true, onUse: async (sc2, st) => busbarFlow(sc2, st) });
    sc.station({ id: 'solo', x: 2320, kind: 'solo', label: 'Puerta de Evidencia', glow: '#b49cff', hidden: true, onUse: async (sc2, st) => {
      const r = await sc2.open(SOLOScene, { ctx: 'RA-05-C1' });
      st.progress = r.correct; if (r.correct >= 3) { st.done = true; GS.lp(6).solo = true; S.soloDone = true; Codex.unlock('reserva'); }
    } });
    sc.station({ id: 'exit', x: 2460, y: 250, kind: 'clue', label: 'Subir a la Ciudadela H2', glow: '#ffe14d', hidden: true, draw: PFB.drawClue, onUse: async (sc2) => finishLevel6(sc2) });
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

/* ---------------- datos del plano jugable (los rellena props al entrar) ---------------- */
const LV6 = { racks: [], screens: [], glows: [], cones: [], flows: [], leds: [], breakers: [], fans: [], lift: [] };

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
