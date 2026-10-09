/* =====================================================================
   1e_bio_vault.js — BIOMA BÓVEDA (Nivel 06 «La Bóveda de Carga»), interior
   con el kit VISTA. Sustituye a BIOMES.vault de 16_biomes.js.
   Caverna excavada en roca con vetas minerales violetas. Al fondo, la boca
   del túnel deja ver el exterior a pleno sol: el campo FV y los
   aerogeneradores que cargan las baterías (la luz entra en haces). Delante,
   un muro de hormigón con arcos (cada vano deja ver la sala de detrás), la
   sala de bastidores BESS en 3/4 con LED de estado, bandejas de cable con
   flujo de carga/descarga, la sala de control acristalada, climatización
   con vapor, tiras de luz, pilares cercanos y suelo reflectante.
   El nivel publica B.vault = {soc, charging, blackout} desde skyFx: en el
   apagón se apagan LED y tiras y solo quedan las balizas de emergencia.
   Planos: roca (0) · sala lejana con boca al exterior (0,06) · haces ·
   muro de arcos (0,14) · sala BESS (0,26) · pilares y bandejas (0,45)
   ===================================================================== */
var BIOME_LABELS = (typeof BIOME_LABELS !== 'undefined') ? BIOME_LABELS : {};

BIOMES.vault = function (L) {
  const V = VISTA, I = V.INT;
  const B = new Backdrop(L.width, L.height);
  const CY0 = 0;
  const at = (f, y) => Math.round(y - (V.CAMY - CY0) * f * 0.3);
  const T = () => Game.time;
  const st = () => B.vault || { soc: 0.5, charging: 0, blackout: false };
  B.horizon = 0;
  B.weather.wind = 0;
  B.vault = null;
  // roca de la caverna (fondo absoluto, casi sin paralaje)
  B.sky = V.timed('sky', () => {
    const pb = new PixelBuffer(W, H);
    V.rockFill(pb, 0, 0, W, H, { seed: 601, sc: 0.016, tGrad: (v) => -Math.abs(v - 0.45) * 0.4, veinK: 0.005 });
    return pb.toCanvas();
  });
  /* ---------------- sala lejana con la boca del túnel al exterior (0,06) ---------------- */
  const farFx = { veins: [], leds: [] };
  const PORTAL = { cx: 360, top: 36, w: 210, h: 200 };
  B.vplane(0.06, at(0.06, 0), 270, (pb, w, h) => {
    const r = RNG(611);
    // exterior a pleno sol, visto por la boca: cielo, cordillera, campo FV y eólica
    const out = new PixelBuffer(PORTAL.w + 20, PORTAL.h);
    const sky = V.sky(out.w, out.h, { horizonY: 120, stops: ['#2a78e8', '#3a88f0', '#52a0f4', '#78b8f4', '#a0ccf0', '#c8d4ec'], haze: ['#e0d0d0', '#ecd8c8'] });
    V.blit(out, sky, 0, 0);
    V.relief(out, { yBase: 132, nv: 24, dvy: 0.3, seed: 613, hMax: 40, H: V.massif([{ x: 40, v: 10, h: 36, w: 70, d: 16 }, { x: 120, v: 10, h: 30, w: 80, d: 16 }], { seed: 613, rough: 0.5, scale: 0.06, apron: 3 }), ramp: V.RAMPS.mid, contrast: 2, t0: 0.55, haze: { col: '#c8bcd8', k0: 0.2, k: 0.1 }, rim: '#ffe0c0', tex: 0.04 });
    V.dunes(out, { y0: 140, y1: out.h - 10, rows: 3, hBack: 6, hFront: 12, wMin: 40, wMax: 80, k0: 0.2, k1: 0.02, seed: 615 });
    for (let i = 0; i < 4; i++) V.pvArray(out, 8 + i * 2, 150 + i * 12, { tables: 2, cols: 22, rows: 2, cw: 4, ch: 2, gap: 2, skew: 2, k: 0.25 - i * 0.06, shift: 2 });
    const tb = [];
    for (const x of [30, 70, 130, 160]) { const hub = V.turbineTower(out, x, 136, 30, { k: 0.2 }); tb.push({ x: hub.hx, y: hub.hy }); }
    V.blit(pb, out, PORTAL.cx - out.w / 2, PORTAL.top);
    farFx.turb = tb.map(t => ({ x: t.x + PORTAL.cx - out.w / 2, y: t.y + PORTAL.top, rot: V.rotor(11, { k: 0.2 }), sp: 1.6 + t.x * 0.01, ph: t.x }));
    // roca alrededor con la boca recortada en arco
    const rock = new PixelBuffer(w, h);
    const RV = V.rockFill(rock, 0, 0, w, h, { seed: 617, sc: 0.02, ramp: V.hz(I.ROCK, 0.12, '#3a3a7a'), tGrad: (v) => v > 0.8 ? -(v - 0.8) : 0 });
    farFx.veins = RV.veins.filter((_, i) => i % 3 === 0);
    V.carveArch(rock, PORTAL.cx, PORTAL.top, PORTAL.w, PORTAL.h, { k: 0.15, th: 6 });
    V.blit(pb, rock, 0, 0);
    // bastidores lejanos en silueta a lo largo del suelo de la sala del fondo
    for (let x = 6; x < w - 30; x += 34) { if (Math.abs(x + 12 - PORTAL.cx) < PORTAL.w / 2 + 6) continue; const R = V.bessRack(pb, x, h - 22, 24, 40, 8, { k: 0.45 }); farFx.leds.push(...R.leds.filter((_, i) => i % 2 === 0)); }
    V.reflectFloor(pb, 0, w, h - 22, h, { k: 0.4 });
  }, {
    tag: 'far', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T(), S = st();
      for (const tb of farFx.turb) { const x = tb.x + ox; if (x < -20 || x > W + 20) continue; V.drawRotor(g, tb.rot, x, tb.y + oy, t * tb.sp + tb.ph); }
      for (let i = 0; i < farFx.veins.length; i++) { const [x, y] = farFx.veins[i]; const a = Math.sin(t * 0.9 + i * 1.7); if (a > 0.6) V.drawGlow(g, x + ox, y + oy, 2, '#b48aff', (a - 0.6) * 1.4); }
      if (!S.blackout) { g.fillStyle = '#b6f05a'; for (let i = 0; i < farFx.leds.length; i++) { const [x, y] = farFx.leds[i]; if ((Math.floor(t * 2) + i) % 5) g.fillRect(x + ox, y + oy, 1, 1); } }
    },
  });
  // haces de luz que entran por la boca del túnel (aditivos)
  const shaftC = V.timed('shaft', () => V.rays(360, 270, 180, 40, { n: 7, len: 300, a0: 0.2, a1: 1.15, a2: 2.0, seed: 619, col: '#fff0d0' }));
  B.vdyn(0.06, (g, cam) => {
    const S = st(); if (S.blackout) return;
    const x = PORTAL.cx - Math.round(cam.x * 0.06) - 180, y = at(0.06, 0) + Math.round(V.CAMY * 0.018) - Math.round(cam.y * 0.018);
    if (x > W || x + 360 < 0) return;
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.55 + 0.1 * Math.sin(T() * 0.4); g.drawImage(shaftC, x, y); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }, { tag: 'shaft' });
  /* ---------------- muro de hormigón con arcos (0,14) ---------------- */
  const wallFx = { strips: [], lamps: [] };
  B.vplane(0.14, at(0.14, 0), 280, (pb, w, h) => {
    const k = 0.18;
    // muro de hormigón en paneles con juntas y manchas
    const C = V.P32(V.hz(I.CONCI, k, '#2a2a6a')), n = C.length;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const pan = ((x % 48) === 0 || (y % 36) === 0), stain = fbm(x * 0.04, y * 0.02, 3, 621);
      let i = Math.round(2.4 + (stain - 0.5) * 2 + (y > h - 40 ? -1 : 0) + (y < 30 ? -1 : 0));
      if (pan) i = 1; else if ((x % 48) === 1 || (y % 36) === 1) i += 1;
      pb.data[y * w + x] = C[clamp(i, 0, n - 1)];
    }
    // arcos: cada vano deja ver la sala lejana
    for (let cx = 120; cx < w + 60; cx += 200) {
      V.carveArch(pb, cx, 44, 136, 200, { k, th: 7 });
      wallFx.lamps.push([cx, 34]);
    }
    // tiras de luz cian a lo largo del muro, bandeja de cable y rótulos de sector
    wallFx.strips.push(V.lightStrip(pb, 0, w - 1, 24, '#56e5ff'));
    V.cableTray(pb, 0, w - 1, 12, { k, hang: 12 });
    for (let cx = 220, s = 0; cx < w; cx += 200, s++) { const lab = 'SECTOR ' + 'ABCDEFGH'[s % 8]; const tw = V.measure(lab, { font: 'tiny', bold: true }); V.rect(pb, cx - tw / 2 - 3, 60, tw + 6, 10, U('#0a1440')); V.text(pb, lab, cx - Math.round(tw / 2), 62, U('#8fdfff'), { font: 'tiny', bold: true }); }
  }, {
    tag: 'wall', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T(), S = st();
      if (S.blackout) { for (const [x, y] of wallFx.lamps) if ((Math.floor(t * 2) % 2) === 0) V.drawGlow(g, x + ox, y + oy, 5, '#ff4030', 0.7); return; }
      V.drawStrips(g, wallFx.strips, ox, oy, t, { col: '#e8ffff', speed: 70 });
      for (const [x, y] of wallFx.lamps) if (x + ox > -20 && x + ox < W + 20) V.drawGlow(g, x + ox, y + oy, 8, '#a8f0ff', 0.4);
    },
  });
  /* ---------------- sala de bastidores BESS (0,26) ---------------- */
  const hallFx = { leds: [], screens: [], vents: [], flows: [], glass: [], lamps: [] };
  B.vplane(0.26, at(0.26, 60), 236, (pb, w, h) => {
    const r = RNG(631), k = 0.08, base = h - 18;
    hallFx.coneH = base - 44;
    V.reflectFloor(pb, 0, w, base, h, { k, lights: Array.from({ length: Math.ceil(w / 60) }, (_, i) => 30 + i * 60) });
    // bandejas de cable sobre las filas (flujo de carga/descarga)
    for (const yy of [24, 34]) { const T1 = V.cableTray(pb, 0, w - 1, yy, { k, hang: 24, cols: yy === 24 ? ['#c8861a', '#e8a838', '#3a3a4a'] : ['#2c63c0', '#56e5ff', '#3a3a4a'] }); hallFx.flows.push([T1.flow, yy === 24 ? '#ffd27a' : '#a8f4ff']); }
    // lámparas de techo (campanas) sobre los pasillos
    for (let lx = 40; lx < w; lx += 110) { V.rect(pb, lx - 4, 40, 9, 3, U('#3a4060')); V.rect(pb, lx - 3, 43, 7, 1, U('#fff2d0')); for (let yy = 26; yy < 40; yy++) V.put(pb, lx, yy, U('#2a3048')); hallFx.lamps.push([lx, 44]); }
    // filas de bastidores con huecos para la sala de control y la climatización
    let x = 10;
    while (x < w - 40) {
      if (Math.abs(x - 470) < 30) {
        const CR = V.controlRoom(pb, x, base, 120, 70, { k });
        hallFx.screens.push(...CR.screens); hallFx.glass.push(CR.glass);
        x += 140; continue;
      }
      if (r.chance(0.22)) { const HV = V.hvac(pb, x, base, 40, 22, { k }); hallFx.vents.push(HV.vent); x += 54; continue; }
      const n = r.int(3, 5);
      for (let i = 0; i < n && x < w - 30; i++) { const R = V.bessRack(pb, x, base, 26, r.int(78, 92), 10, { k, accent: r.pick(['#2c63c0', '#8d6bff', '#2c63c0', '#b6f05a']) }); hallFx.leds.push(...R.leds); x += 30; }
      x += r.int(12, 22);
    }
  }, {
    tag: 'hall', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T(), S = st();
      const on = !S.blackout;
      if (on) {
        const cone = V.lightCone(8, 70, hallFx.coneH, '#d8e8ff', 0.2);
        g.globalCompositeOperation = 'lighter';
        for (const [x, y] of hallFx.lamps) { const sx = x + ox; if (sx < -40 || sx > W + 40) continue; g.drawImage(cone, Math.round(sx - 35), Math.round(y + oy)); }
        g.globalCompositeOperation = 'source-over';
        for (const [x, y] of hallFx.lamps) { const sx = x + ox; if (sx > -10 && sx < W + 10) V.drawGlow(g, sx, y + oy, 5, '#fff2d0', 0.6); }
        // LED de estado: verde (SOC sano), rojo (bajo), parpadeo de actividad
        const col = S.soc < 0.3 ? '#ff6b6b' : '#b6f05a';
        g.fillStyle = col;
        for (let i = 0; i < hallFx.leds.length; i++) { const [x, y] = hallFx.leds[i], sx = x + ox; if (sx < -2 || sx > W + 2) continue; if (((Math.floor(t * 3) + i * 7) % 11) !== 0) g.fillRect(sx, y + oy, 2, 1); }
        for (const [p, c] of hallFx.flows) V.drawFlow(g, p, ox, oy, t * (S.charging ? 1.6 : 0.8), { col: S.charging ? '#a8f4ff' : c, speed: 22, gap: 11 });
        for (const [x, y, w, h] of hallFx.screens) { const sx = x + ox; if (sx < -12 || sx > W) continue; for (let i = 0; i < 3; i++) { g.fillStyle = i === 1 ? '#ff6b6b' : '#56e5ff'; g.fillRect(sx, y + oy + i + (i > 0 ? i : 0), 2 + ((i * 5 + Math.floor(t * 3)) % (w - 1)), 1); } }
        for (const [x, y, w, h] of hallFx.glass) if (x + ox > -w && x + ox < W) V.drawSoftGlow(g, x + ox + w / 2, y + oy + h / 2, 40, '#3a8ad8', 0.35);
      } else for (let i = 0; i < hallFx.leds.length; i += 9) { const [x, y] = hallFx.leds[i]; if ((Math.floor(t * 2) % 2) === 0) { g.fillStyle = '#ff4e5d'; g.fillRect(x + ox, y + oy, 1, 1); } }
      for (const [x, y] of hallFx.vents) if (x + ox > -10 && x + ox < W + 10) V.drawSteam(g, x + ox, y + oy, t + x, { n: 6, h: 30 });
    },
  });
  /* ---------------- pilares y bandejas cercanos (0,45) ---------------- */
  const nearFx = { strips: [] };
  B.vplane(0.45, at(0.45, 0), 300, (pb, w, h) => {
    const k = 0.02;
    for (let x = 60; x < w; x += 260) {
      V.column(pb, x, 0, h, 18, { k, ramp: I.GRAPH });
      // ménsula y bandeja colgada entre pilares
      V.cableTray(pb, x + 18, Math.min(w - 1, x + 260), 46, { k, hang: 40 });
      nearFx.strips.push(V.lightStrip(pb, x + 18, Math.min(w - 1, x + 258), 6, '#8d6bff'));
      for (let yy = 70; yy < h - 20; yy += 60) { V.rect(pb, x + 4, yy, 10, 6, U('#ffe14d')); V.rect(pb, x + 5, yy + 1, 8, 4, U('#16101e')); V.put(pb, x + 9, yy + 2, U('#ffe14d')); }
    }
  }, {
    tag: 'near', dyn: (g, cam, Ly) => {
      const [ox, oy] = B.vofs(Ly, cam), t = T(), S = st();
      if (!S.blackout) V.drawStrips(g, nearFx.strips, ox, oy, t, { col: '#e8d8ff', speed: 90 });
      V.drawMotes(g, 10, t, 31, { y0: 40, y1: 260, col: '#a8c8ff' });
    },
  });
  B.vistaInfo = { planes: B.layers.length, ms: Object.assign({}, V.stats.ms) };
  return B;
};

BIOME_LABELS.vault = BIOME_LABELS.vault || [];
