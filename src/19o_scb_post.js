/* =====================================================================
   19o_scb_post.js — Escena POSCRÉDITOS: el vivero de noche.
   Cielo nocturno en bandas con estrellas y luna con resplandor, cirros
   plateados, cordillera y colinas en hora azul con las luces de ARIDIA y
   la baliza de la torre de SYNARA, bancales del vivero, invernadero en 3/4
   con luz cálida interior (estantes, plantones, lámparas colgantes), puerta
   abierta que derrama luz sobre el suelo, faroles con halo suave, bandejas
   de plantones, sensor con la alarma de la «variable desconocida»,
   Amaya y KIRU con tinte nocturno y luz de borde cálida, luciérnagas.
   SCBPost.make() → {draw(g, t, o)}   o = {amayaExpr}
   Sin tramado: bandas, alfa horneada y halos en anillos.
   ===================================================================== */
const SCBPost = (() => {
  const V = VISTA;
  const GY = 270; // línea de paso del suelo (pies de Amaya y KIRU)
  const NIGHT = { sat: 0.7, tint: '#5a6ab8', tintK: 0.5, bright: 0.5, lift: 0.06, liftCol: '#0e1440' };
  /** Sprite con tinte nocturno (cache por lienzo de cuadro) */
  const _nightC = new Map();
  function nightSprite(c) {
    let o = _nightC.get(c); if (o) return o;
    const w = c.width, h = c.height, cv = makeCanvas(w, h);
    cv.g.drawImage(c, 0, 0);
    const id = cv.g.getImageData(0, 0, w, h), d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const l = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
      // mezcla hacia azul noche conservando el brillo de los rasgos claros (borde cálido del rig)
      const k = l > 200 ? 0.12 : 0.34;
      d[i] = d[i] + (l * 0.42 - d[i]) * k; d[i + 1] = d[i + 1] + (l * 0.5 - d[i + 1]) * k; d[i + 2] = d[i + 2] + (Math.min(255, l * 0.95 + 30) - d[i + 2]) * k;
    }
    cv.g.putImageData(id, 0, 0);
    o = cv; o.anchors = c.anchors; _nightC.set(c, o);
    if (_nightC.size > 64) _nightC.delete(_nightC.keys().next().value);
    return o;
  }
  /** drawChar con tinte nocturno y luz de borde cálida (env 'dusk' del rig) */
  function drawNight(g, id, anim, time, x, y, facing, opts = {}) {
    const def = CHARS[id]; if (!def) return;
    const A = ANIMS[anim] || ANIMS.idle;
    let frame = Math.floor(time * A.fps); frame = A.loop ? frame % A.frames : Math.min(frame, A.frames - 1);
    const o2 = Object.assign({ env: 'dusk' }, opts);
    const c = nightSprite(SpriteCache.get(id, anim, frame, o2));
    const ox = def.ox ?? 30, oy = def.oy ?? 78, dx = Math.round(x), dy = Math.round(y);
    const sh = charShadow((c.anchors && c.anchors.shadowR) || def.shadowR || 9);
    g.drawImage(sh, dx - (sh.width >> 1), dy - 2);
    if (facing < 0) { g.save(); g.translate(dx, 0); g.scale(-1, 1); g.drawImage(c, -ox - 1, dy - oy); g.restore(); }
    else g.drawImage(c, dx - ox, dy - oy);
  }
  function make() {
    const B = new Backdrop(W, H), T = () => Game.time;
    const fx = { stars: [], city: [], beacon: null, lamps: [], win: [], leds: [] };
    const P = (ys, h, draw, opts) => B.vplane(0, ys, h, (pb, w, hh) => { draw(pb, w, hh); SCBK.grade(pb, NIGHT); }, opts);
    /* ---------- cielo nocturno, estrellas y luna ---------- */
    const MOON = { x: 512, y: 58, r: 12 };
    const sky = SCBK.nightSky(W, 250, { horizonY: 236, moon: MOON });
    fx.stars = SCBK.stars(sky, W, 250, 17, { n: 200, y1: 220 });
    // vía láctea tenue: banda diagonal de motas
    { const r = RNG(23); for (let i = 0; i < 380; i++) { const u = r(), x = Math.round(u * W), y = Math.round(150 - u * 120 + (r() - 0.5) * 34 * (1 - Math.abs(u - 0.5))); V.blend(sky, x, y, U(r() < 0.3 ? '#c8c0ff' : '#8a90d8'), 0.18 + r() * 0.25); } }
    SCBK.moon(sky, MOON.x, MOON.y, MOON.r);
    const skyC = sky.toCanvas();
    B.vdyn(0, (g) => { g.drawImage(skyC, 0, 0); SCBK.drawTwinkle(g, fx.stars, T()); V.drawBloom(g, MOON.x, MOON.y, 44, '#c8d0ff', 0.16, T()); }, { tag: 'sky' });
    B.cloudDeck({ kind: 'cirrus', n: 5, seed: 61, f: [0.01, 0.03], y: [30, 110], w: [90, 170], speed: [0.6, 1.2], pal: ['#2a3470', '#46529a', '#7a86c8', '#c8d0f4'] });
    /* ---------- cordillera lejana con ARIDIA iluminada ---------- */
    P(176, 66, (pb, w, h) => {
      const r = RNG(57), peaks = [];
      for (let x = -20; x < w + 60;) { const ww = r.int(60, 130); peaks.push({ x: x + ww * 0.5, v: r.int(14, 30), h: r.int(18, 46), w: ww, d: r.int(16, 28) }); x += r.int(40, 90); }
      V.relief(pb, { yBase: h - 1, nv: 40, dvy: 0.3, seed: 61, hMax: 46, H: V.massif(peaks, { seed: 61, rough: 0.5, scale: 0.05, apron: 5 }), ramp: V.RAMPS.far, contrast: 1.8, t0: 0.55, haze: { col: '#6a70b0', k0: 0, k: 0.2 }, mist: { col: '#5a6098', h: 10, k: 0.4 }, rim: '#c8d4ff', tex: 0.04 });
    }, { tag: 'far' });
    // ciudad lejana (cúpula y torre) sobre la colina de la izquierda
    P(150, 96, (pb, w, h) => {
      const info = V.relief(pb, { yBase: h - 1, nv: 30, dvy: 0.3, seed: 71, hMax: 60, x0: 0, x1: 300, H: V.massif([{ x: 130, v: 14, h: 52, w: 160, d: 24 }, { x: 250, v: 10, h: 30, w: 110, d: 18 }], { seed: 71, rough: 0.4, scale: 0.05, apron: 4, plateaus: [{ x: 130, w: 60, h: 46 }] }), ramp: V.RAMPS.hill, contrast: 2, t0: 0.5, haze: { col: '#5a6098', k0: 0, k: 0.12 }, rim: '#b8c4ff', tex: 0.05, veg: { ramp: V.RAMPS.vegHill, density: 0.08, maxSlope: 1, minY: 50, size: 2 } });
      const dc = V.domeCity(pb, 132, info.top[132] + 6, { k: 0.1, s: 0.42 });
      const tw = V.synaraTower(pb, 196, info.top[196] + 3, 40, { k: 0.1 });
      fx.beacon = [tw.beacon[0], 150 + tw.beacon[1]];
      fx.towerGlow = tw.glows.map(([x, y, rr]) => [x, 150 + y, rr]);
      const r = RNG(73);
      for (let i = 0; i < 70; i++) { const x = r.int(10, 296), y = info.onSurf(x, r.int(2, 14)); if (y == null) continue; if (r.chance(0.5)) V.house(pb, x, y + 1, r.int(4, 7), r.int(3, 5), 5100 + i, { k: 0.12 }); else fx.city.push([x, 150 + y - 1, r.range(0, 6)]); }
      fx.domeY = 150 + dc.top + 16;
    }, { tag: 'city' });
    /* ---------- colinas del vivero (bancales en hora azul) ---------- */
    P(200, 70, (pb, w, h) => {
      const info = V.relief(pb, { yBase: h - 1, nv: 30, dvy: 0.32, seed: 81, hMax: 44, x0: 0, H: V.massif([{ x: 60, v: 10, h: 22, w: 200, d: 18 }, { x: 330, v: 12, h: 30, w: 200, d: 20 }, { x: 560, v: 14, h: 42, w: 240, d: 24 }], { seed: 81, rough: 0.45, scale: 0.05, apron: 4 }), ramp: V.RAMPS.low, contrast: 1.8, t0: 0.5, haze: { col: '#4a5090', k0: 0, k: 0.06 }, rim: '#c0caff', tex: 0.06, veg: { ramp: V.RAMPS.vegLow, density: 0.18, maxSlope: 1.2, minY: 4, size: 3 } });
      const TA = V.carveTerraces(pb, info, { x0: 470, x1: 640, yTop: 14, yBot: 60, stepH: [6, 8], wallK: 0.4, k: 0.04, seed: 85, kinds: ['rows', 'orchard', 'rows', 'vine'], falls: [] });
      void TA;
      const r = RNG(83);
      for (let x = 8; x < w; x += r.int(14, 30)) { const y = info.onSurf(x, r.int(2, 10)); if (y != null) V.cypress(pb, x, y + 1, r.int(8, 14), 600 + x, { k: 0.04 }); }
      // depósito de agua del vivero sobre su torre
      V.waterTower(pb, 548, (info.onSurf(548, 6) ?? info.top[548]) + 1, 30, { k: 0.04 });
      // casita del vivero con ventana encendida
      const hs = V.townHouse(pb, 600, (info.onSurf(600, 6) ?? info.top[600]) + 1, 22, 14, 77, { k: 0.02, roof: 'tiles', pal: 'white' });
      fx.win.push(...hs.wins.slice(0, 2).map(([x, y, ww, hh]) => [x, 200 + y, ww, hh]));
    }, { tag: 'hills' });
    /* ---------- suelo (PFTerrain en hora azul), invernadero, faroles ---------- */
    // suelo del vivero: cara superior de tierra con hierba (3/4) y bancales elevados de madera delante
    const surf = new PixelBuffer(W, H);
    soil(surf);
    const terrC = null;
    const art = new PixelBuffer(W, H);
    greenhouse(art, 318, GY - 6, fx);
    // bandejas de plantones delante del invernadero y bancos de madera
    trays(art, 292, GY - 2, 6, 11); trays(art, 486, GY - 3, 4, 13);
    bench(art, 540, GY - 4, 60, fx);
    // faroles (el de Amaya y el del camino)
    for (const [x, h] of [[179, 74], [606, 62]]) fx.lamps.push(lampPost(art, x, GY - 2, h));
    // sensor del vivero (la alarma de la variable desconocida)
    { const S = V.P32(['#1a1c34', '#2e3254', '#4a5078', '#6a72a0', '#9aa4d0']); for (let q = 0; q < 44; q++) { V.put(art, 456, GY - 2 - q, S[2]); V.put(art, 457, GY - 2 - q, S[1]); } for (let yy = 0; yy < 6; yy++) for (let xx = 0; xx < 8; xx++) V.put(art, 453 + xx, GY - 50 + yy, S[yy === 0 ? 4 : xx === 7 ? 0 : 2]); V.put(art, 455, GY - 48, U('#56e5ff')); fx.sensor = [457, GY - 52]; }
    // regadera, saco de sustrato, macetas
    pots(art, 252, GY - 1); pots(art, 520, GY - 1);
    const flora = new PixelBuffer(W, H);
    PFFlora.scatter(flora, () => GY - 3, 4, 290, 31, { mix: { tuft: 4, fern: 2, lupine: 1, flowers: 1 }, gap: 10 });
    PFFlora.scatter(flora, () => GY - 3, 560, 636, 37, { mix: { tuft: 4, fern: 2, agave: 1 }, gap: 10 });
    PFFlora.palm(flora, 36, GY - 4, 120, 14, 91, { ramp: ['#060a14', '#0c1626', '#142438', '#1e3448', '#2a4658', '#3a5a6a', '#527280', '#6e8c98'], trunk: ['#06070e', '#10121e', '#1c2030', '#2a3044', '#3a4258', '#4e5870'] });
    const clumpL = PFFlora.fgClump(120, 60, 13, { spikes: 4 }), clumpR = PFFlora.fgClump(110, 56, 19, { spikes: 3 });
    V.blit(flora, clumpL, -10, H - 60); V.blit(flora, clumpR, W - 100, H - 56);
    SCBK.grade(art, { sat: 0.85, tint: '#6a78c8', tintK: 0.32, bright: 0.72 });
    SCBK.grade(flora, NIGHT);
    // la luz del invernadero queda sin gradar (cálida): se hornea después
    greenhouseLight(art, 318, GY - 6);
    spill(surf, 318, GY - 6);
    const surfC = surf.toCanvas(), artC = art.toCanvas(), floraC = flora.toCanvas();
    fx.wires = [SCBK.catenary(181, GY - 74, 318, GY - 62, 10), SCBK.catenary(486, GY - 70, 606, GY - 62, 9)];
    return {
      draw(g, t, o = {}) {
        B.render(g, { x: 0, y: V.CAMY });
        // luces de la ciudad y baliza de SYNARA
        for (const [x, y, ph] of fx.city) { const a = 0.6 + 0.4 * Math.sin(t * 0.7 + ph); g.globalAlpha = a; g.fillStyle = ph > 4.5 ? '#ff9f43' : '#ffd86a'; g.fillRect(x, y, 1, 1); }
        g.globalAlpha = 1;
        V.drawPulse(g, fx.towerGlow, 0, 0, t, '#5ae8f0', 0.35, 0.2, 1.4);
        if (Math.floor(t * 1.5) % 2) V.drawGlow(g, fx.beacon[0], fx.beacon[1], 3, '#ff6a5a', 0.9);
        for (const [x, y, ww, hh] of fx.win) { g.fillStyle = '#ffc860'; g.fillRect(x, y, ww, hh); }
        g.drawImage(surfC, 0, 0); g.drawImage(artC, 0, 0);
        // guirnalda de bombillas cálidas del farol al invernadero y del invernadero al farol del camino
        g.fillStyle = '#141428'; for (const pts of fx.wires) for (let i = 0; i < pts.length; i += 2) g.fillRect(pts[i][0], pts[i][1], 1, 1);
        for (const pts of fx.wires) SCBK.drawBulbs(g, pts, t, ['#ffd070', '#ffb050', '#fff0b0'], 10);
        // lámparas colgantes del invernadero (parpadeo cálido muy leve)
        for (const [x, y] of fx.ghLamps) V.drawSoftGlow(g, x, y, 14, '#ffb050', 0.18 + 0.03 * Math.sin(t * 5 + x), 5);
        // sensor: alarma amarilla que parpadea
        const on = Math.floor(t * 3) % 2;
        g.fillStyle = on ? '#ffe14d' : '#6a5a10'; g.fillRect(fx.sensor[0] - 1, fx.sensor[1] - 1, 3, 3);
        if (on) V.drawSoftGlow(g, fx.sensor[0], fx.sensor[1], 12, '#ffe14d', 0.35, 4);
        // Amaya y KIRU (tinte nocturno + luz de borde cálida del farol)
        drawNight(g, 'amaya', 'idle', t, 220, GY, 1, { expr: o.amayaExpr || 'surprised' });
        drawNight(g, 'kiru', 'idle', t, 260, GY, -1, {});
        // taza de té con vapor (en la mano de Amaya)
        g.fillStyle = '#e8dcc0'; g.fillRect(225, 238, 7, 6); g.fillRect(232, 239, 2, 3); g.fillStyle = '#a89a80'; g.fillRect(225, 243, 7, 1); g.fillStyle = '#fff6e0'; g.fillRect(225, 238, 7, 1);
        g.fillStyle = '#cfd6f0';
        for (let i = 0; i < 3; i++) { g.globalAlpha = 0.7 - i * 0.2; g.fillRect(228 + Math.round(Math.sin(t * 3 + i) * 1.5), 234 - i * 3 - Math.floor((t * 4) % 3), 1, 2); }
        g.globalAlpha = 1;
        g.drawImage(floraC, 0, 0);
        // halos de los faroles por delante (iluminan la espalda de Amaya y el suelo)
        for (const L of fx.lamps) { V.drawSoftGlow(g, L.x, L.y, 44, '#ffc870', 0.34 + 0.03 * Math.sin(t * 7 + L.x), 7); V.drawSoftGlow(g, L.x, L.y, 12, '#fff0c0', 0.4, 3); g.fillStyle = '#fff4c8'; g.fillRect(L.x - 1, L.y - 1, 3, 2); }
        SCBK.drawFireflies(g, 22, t, 5, { x0: 60, x1: 600, y0: 150, y1: 285 });
      },
    };
    /* ---------- piezas ---------- */
    function greenhouse(pb, x, yb, fx) {
      // nave de cristal en 3/4: frente (x..x+FW), costado que se aleja a la derecha, bóveda de cañón
      const FW = 140, FH = 58, D = 46, dx = Math.round(D * 0.62), dy = Math.round(D * 0.36), AR = 22;
      const FR = V.P32(['#10182e', '#1e2a48', '#34446a', '#56689a', '#8a9cd0', '#c8d4f4']);
      const KN = V.P32(['#3a2a1a', '#5a3e22', '#7a5a30']);
      fx.gh = { x, yb, FW, FH, D, dx, dy, AR };
      // zócalo de bloques
      for (let xx = 0; xx < FW; xx++) for (let yy = 0; yy < 6; yy++) V.put(pb, x + xx, yb - yy, KN[yy === 5 ? 2 : (xx + (yy > 2 ? 4 : 0)) % 9 === 0 ? 0 : 1]);
      for (let xx = 0; xx < dx; xx++) for (let yy = 0; yy < 6; yy++) V.put(pb, x + FW + xx, yb - yy - Math.round(xx * dy / dx), KN[0]);
      fx.ghLamps = [];
    }
    function greenhouseLight(pb, x, yb) {
      const G = fx.gh, FW = G.FW, FH = G.FH, dx = G.dx, dy = G.dy, AR = G.AR;
      const top = yb - 6 - FH;
      // interior cálido: degradado en bandas desde las lámparas (arriba) hacia el suelo
      const IN = V.P32(['#3a1c10', '#5a2c14', '#86441a', '#b4622a', '#d88a3c', '#f0b456', '#fcd47c', '#fff0b0']);
      const GL = V.P32(['#14304a', '#1e4a66', '#2e6a86', '#4a90a8', '#8acadc', '#d4f4fc']);
      const PL = V.P32(['#0a140a', '#14260e', '#1e3a14', '#2e5418', '#46701e']);
      const lamps = [[x + 26, top - 4], [x + 70, top - 10], [x + 114, top - 4]];
      fx.ghLamps = lamps;
      const arcY = (xx) => Math.round(Math.sin(clamp(xx / FW, 0, 1) * Math.PI) * AR);
      // pared frontal + gablete curvo
      for (let xx = 0; xx < FW; xx++) {
        const yTop = top - arcY(xx);
        for (let y = yTop; y < yb - 6; y++) {
          // luz interior: más intensa cerca de cada lámpara colgante
          let li = 0; for (const [lx, ly] of lamps) li = Math.max(li, 1 - Math.hypot((x + xx - lx) * 0.8, y - ly) / 64);
          let k = clamp(Math.round(1 + li * 6.2 + (hash2(xx >> 1, y >> 1, 7) - 0.5) * 0.8), 0, 7);
          let c = IN[k];
          // estantes con bandejas y plantones (siluetas a contraluz)
          const sy = yb - 6 - y;
          if (sy === 12 || sy === 28) c = IN[Math.max(0, k - 4)];
          else if ((sy > 12 && sy < 20 && hash2(xx, 3, 11) < 0.55 && sy < 13 + (hash2(xx >> 1, 5, 13) * 7 | 0)) || (sy > 28 && sy < 36 && hash2(xx, 9, 17) < 0.5 && sy < 29 + (hash2(xx >> 1, 7, 19) * 7 | 0))) c = PL[1 + ((xx + sy) % 3)];
          else if (sy < 12 && hash2(xx >> 1, sy >> 1, 23) < 0.18) c = PL[2];
          // plantas grandes colgantes cerca del techo
          if (y < top + 10 && y > yTop + 3 && hash2(xx >> 2, (y - yTop) >> 2, 29) < 0.2) c = PL[3];
          // cristal: tinte frío leve, reflejo de luna en diagonal
          const refl = ((xx + (y - top) * 0.6) % 37) < 3;
          c = V.mixU(c, GL[refl ? 5 : 2], refl ? 0.5 : 0.16);
          V.put(pb, x + xx, y, c);
        }
      }
      // costado (se aleja a la derecha, más oscuro y más frío)
      for (let xx = 0; xx < dx; xx++) {
        const off = Math.round(xx * dy / dx);
        for (let y = top - off; y < yb - 6 - off; y++) {
          const li = clamp(1 - Math.abs(y - (top + 18 - off)) / 50, 0, 1);
          let c = IN[clamp(Math.round(li * 3.6), 0, 7)];
          c = V.mixU(c, GL[1], 0.42);
          V.put(pb, x + FW + xx, y, c);
        }
      }
      // bóveda (techo de cristal en 3/4): franjas entre la curva frontal y la trasera
      for (let xx = 0; xx < FW + dx; xx++) {
        const yF = xx < FW ? top - arcY(xx) : null;
        const xb = xx - dx, yB = xb >= 0 && xb < FW ? top - arcY(xb) - dy : (xb < 0 ? top - dy - Math.round((xx / dx) * 0) : null);
        const y0 = yB != null ? yB : top - dy, y1 = yF != null ? yF : top - Math.round((xx - FW) * dy / dx);
        for (let y = Math.min(y0, y1); y < Math.max(y0, y1); y++) {
          const u = (y - y0) / Math.max(1, (y1 - y0));
          let c = V.mixU(IN[clamp(Math.round(2 + u * 3), 0, 7)], GL[3], 0.45);
          if (((xx + Math.round(u * 6)) % 12) === 0) c = GL[5]; // nervios de la bóveda
          V.put(pb, x + xx, y, c);
        }
      }
      // estructura: montantes, travesaños, nervios y caballete
      const FRu = V.P32(['#0e1424', '#1e2840', '#3a4a70', '#6a7aa8', '#b0bce4']);
      for (let xx = 0; xx < FW; xx += 14) { const yt = top - arcY(xx); for (let y = yt; y < yb - 6; y++) { V.put(pb, x + xx, y, FRu[2]); V.put(pb, x + xx + 1, y, FRu[1]); } }
      for (const sy of [12, 28, 44]) for (let xx = 0; xx < FW; xx++) V.put(pb, x + xx, yb - 6 - sy, FRu[2]);
      for (let xx = 0; xx < FW; xx++) { V.put(pb, x + xx, top - arcY(xx), FRu[4]); V.put(pb, x + xx, top - arcY(xx) + 1, FRu[2]); }
      for (let xx = 0; xx < dx; xx++) { const off = Math.round(xx * dy / dx); V.put(pb, x + FW + xx, top - off, FRu[3]); V.put(pb, x + FW + xx, yb - 6 - off, FRu[1]); }
      for (let xx = 0; xx < FW; xx++) { const yb2 = top - arcY(xx) - dy; V.put(pb, x + xx + dx, yb2, FRu[3]); }
      for (let q = 0; q <= dx; q++) { V.put(pb, x + q, top - Math.round(q * dy / dx), FRu[3]); V.put(pb, x + FW / 2 + q, top - AR - Math.round(q * dy / dx), FRu[4]); }
      for (let y = top - dy; y < yb - 6 - dy; y++) V.put(pb, x + FW + dx, y, FRu[1]);
      // puerta abierta (luz plena) en el frente
      const DX = x + 58, DW = 22, DH = 40;
      for (let yy = 0; yy < DH; yy++) for (let xx = 0; xx < DW; xx++) V.put(pb, DX + xx, yb - 6 - yy, IN[yy > DH - 4 ? 5 : 7 - (xx < 3 ? 1 : 0)]);
      for (let yy = 0; yy < DH; yy++) { V.put(pb, DX - 1, yb - 6 - yy, FRu[3]); V.put(pb, DX + DW, yb - 6 - yy, FRu[1]); }
      for (let xx = -1; xx <= DW; xx++) V.put(pb, DX + xx, yb - 6 - DH, FRu[3]);
      // hoja de la puerta abierta hacia fuera (cristal oscuro)
      for (let yy = 0; yy < DH; yy++) for (let xx = 0; xx < 7; xx++) V.put(pb, DX - 8 + xx, yb - 6 - yy + Math.round(xx * 0.3), V.mixU(GL[1], IN[3], 0.25));
      // lámparas colgantes (cable + pantalla)
      for (const [lx, ly] of lamps) { for (let y = top - AR; y < ly; y++) V.put(pb, lx, y, FRu[0]); V.put(pb, lx - 2, ly, IN[2]); V.put(pb, lx - 1, ly, IN[2]); V.put(pb, lx, ly, IN[2]); V.put(pb, lx + 1, ly, IN[2]); V.put(pb, lx + 2, ly, IN[2]); V.put(pb, lx - 1, ly + 1, IN[7]); V.put(pb, lx, ly + 1, IN[7]); V.put(pb, lx + 1, ly + 1, IN[7]); }
      // rótulo de madera VIVERO sobre la puerta
      const tx = DX - 6, ty = yb - 6 - DH - 10;
      for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < 34; xx++) V.put(pb, tx + xx, ty + yy, U(yy === 0 ? '#8e6a48' : yy === 7 ? '#2a1a12' : '#4e3424'));
      V.text(pb, 'VIVERO', tx + 4, ty + 2, '#ffd890', { font: 'tiny' });
    }
    function soil(pb) {
      const S = V.P32(['#06081a', '#0a0e24', '#10162e', '#161e3a', '#1e2848', '#283456', '#344264']);
      const G = V.P32(['#06120e', '#0a1c14', '#10281a', '#183622', '#22462a', '#2e5834']);
      for (let y = GY - 10; y < H; y++) for (let x = 0; x < W; x++) {
        const d = y - GY;
        let k = d < 0 ? 4 - Math.round((-d) / 4) : clamp(3 - Math.round(d / 30), 0, 4);
        const n = vnoise(x * 0.08, y * 0.16, 41);
        if (n > 0.66) k += 1; else if (n < 0.28) k -= 1;
        let c = S[clamp(k, 0, 6)];
        // hierba en el borde trasero y en manchas
        if ((d < -4 && hash2(x >> 1, y, 5) < 0.55) || (vnoise(x * 0.05, y * 0.09, 47) > 0.7 && hash2(x, y >> 1, 9) < 0.45)) c = G[clamp(k, 0, 5)];
        pb.data[y * pb.w + x] = c;
      }
      // borde iluminado por la luna en el labio trasero
      for (let x = 0; x < W; x++) if (hash2(x >> 1, 2, 7) < 0.6) V.put(pb, x, GY - 10, U('#3a4a7a'));
      // senda de losas hacia la puerta del invernadero
      const SL = V.P32(['#1a2038', '#2a3250', '#3e4868', '#56628a']);
      for (let i = 0; i < 7; i++) { const cx = 300 + i * 14 + (i & 1) * 3, cy = GY + 4 + i * 9; V.ellipse(pb, cx, cy, 6 + i * 0.6, 2 + i * 0.3, (nx, ny) => SL[ny < -0.3 ? 3 : nx > 0.4 ? 1 : 2]); }
      // bancales elevados de madera en primer plano (se alejan en 3/4)
      const WD = V.P32(['#05040a', '#100c14', '#1e1620', '#2e2230', '#40303e']), PL = V.P32(['#06140c', '#0c2414', '#14361c', '#1e4a24', '#2c602e', '#3e7a3a']);
      for (const [bx, by, bw] of [[-10, 302, 150], [470, 300, 190], [140, 336, 340]]) {
        for (let xx = 0; xx < bw; xx++) for (let yy = 0; yy < 10; yy++) V.put(pb, bx + xx, by + yy, WD[yy < 2 ? 4 : yy === 9 ? 0 : (xx % 24 === 0 ? 1 : 2 + ((yy >> 1) & 1))]);
        for (let xx = 0; xx < bw; xx++) for (let yy = 1; yy < 7; yy++) V.put(pb, bx + xx, by - yy, S[2 - (yy > 4 ? 1 : 0)]);
        for (let xx = 2; xx < bw - 2; xx += 4) { const h = 3 + (hash2(bx + xx, by, 3) * 5 | 0); for (let q = 0; q < h; q++) V.put(pb, bx + xx, by - 2 - q, PL[1 + Math.min(4, q)]); V.put(pb, bx + xx - 1, by - 1 - h, PL[3]); V.put(pb, bx + xx + 1, by - 1 - h, PL[5]); V.put(pb, bx + xx + 1, by - h, PL[4]); }
      }
    }
    function spill(pb, x, yb) {
      // luz de la puerta derramada sobre el suelo: trapecio en bandas de alfa (sin tramado)
      const DX = x + 58, DW = 22, C = U('#ffc870');
      for (let yy = 0; yy < 14; yy++) {
        const y = yb + 1 + yy, spread = yy * 1.6, a = 0.42 * (1 - yy / 14);
        const lv = Math.round(a * 8) / 8;
        for (let xx = Math.round(DX - spread); xx < Math.round(DX + DW + spread * 1.4); xx++) V.blend(pb, xx, y, C, lv);
      }
    }
    function trays(pb, x, yb, n, w) {
      const WD = V.P32(['#1a1008', '#3a2414', '#5a3a20', '#7a5430']), PL = V.P32(['#0e2a10', '#1e4a18', '#3a7a22', '#6ab03a', '#a8e05a']);
      for (let i = 0; i < n; i++) {
        const bx = x + i * (w + 2);
        for (let xx = 0; xx < w; xx++) { V.put(pb, bx + xx, yb, WD[1]); V.put(pb, bx + xx, yb - 1, WD[3]); V.put(pb, bx + xx, yb - 2, WD[2]); }
        for (let xx = 1; xx < w - 1; xx += 2) { const h = 2 + (hash2(bx + xx, 1, 3) * 3 | 0); for (let q = 0; q < h; q++) V.put(pb, bx + xx, yb - 3 - q, PL[1 + Math.min(3, q)]); V.put(pb, bx + xx - 1, yb - 3 - h + 1, PL[3]); V.put(pb, bx + xx + 1, yb - 3 - h + 1, PL[4]); }
      }
    }
    function bench(pb, x, yb, w, fx) {
      const WD = V.P32(['#1a1008', '#3a2414', '#5a3a20', '#7a5430', '#9a7448']);
      for (let xx = 0; xx < w; xx++) { V.put(pb, x + xx, yb - 12, WD[4]); V.put(pb, x + xx, yb - 11, WD[3]); V.put(pb, x + xx, yb - 10, WD[1]); }
      for (const lx of [2, w - 4]) for (let q = 0; q < 10; q++) { V.put(pb, x + lx, yb - q, WD[2]); V.put(pb, x + lx + 1, yb - q, WD[0]); }
      trays(pb, x + 1, yb - 13, 4, 13);
    }
    function lampPost(pb, x, yb, h) {
      const S = V.P32(['#0e1020', '#1e2238', '#363c5a', '#5a6288', '#8a94c0']);
      for (let q = 0; q < h; q++) { V.put(pb, x, yb - q, S[q < 3 ? 1 : 3]); V.put(pb, x + 1, yb - q, S[1]); }
      for (let xx = -2; xx <= 3; xx++) V.put(pb, x + xx, yb - h, S[4]);
      for (let yy = 1; yy <= 4; yy++) for (let xx = -1; xx <= 2; xx++) V.put(pb, x + xx, yb - h + yy, U(yy === 4 ? '#c88a3a' : xx === -1 ? '#ffe8a0' : '#ffd070'));
      for (let xx = -2; xx <= 3; xx++) V.put(pb, x + xx, yb - h + 5, S[2]);
      return { x: x + 1, y: yb - h + 3 };
    }
    function pots(pb, x, yb) {
      const TC = V.P32(['#3a1408', '#6a2a12', '#9a4420', '#c86a34']), PL = V.P32(['#0e2a10', '#1e4a18', '#3a7a22', '#6ab03a']);
      for (let i = 0; i < 3; i++) { const px = x + i * 9; for (let yy = 0; yy < 6; yy++) for (let xx = (yy > 3 ? 1 : 0); xx < 7 - (yy > 3 ? 1 : 0); xx++) V.put(pb, px + xx, yb - yy, TC[yy === 5 ? 3 : xx < 2 ? 2 : 1]); for (let q = 0; q < 6; q++) PFFlora.leaf(pb, px + 3, yb - 6, -Math.PI / 2 + (q - 2.5) * 0.4, 4 + (q & 1) * 2, 2, PL, 2); }
    }
  }
  return { make, drawNight, nightSprite };
})();
