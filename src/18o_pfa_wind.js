/* =====================================================================
   18o_pfa_wind.js — Acantilados eólicos del plano jugable (kit PF,
   rollout A) a escala de personaje ≈ 74 px: aerogeneradores grandes
   (torre troncocónica con brida, puerta y escalera, cimentación en 3/4,
   transformador de pie; rotor en tira de 12 cuadros con palas de perfil
   ahusado y puntas rojas), mástil meteorológico de celosía, estación de
   cometas de Nimbo, laboratorio con plataforma de observación y LIDAR,
   caseta de control del parque, observatorio de aves y el interior de
   las gargantas (pared del fondo, mar con espuma y farallones).
   Cara de terreno 'strata': estratos de arenisca rosada, crema y lila
   con diaclasas, cornisas con hierba y oscurecimiento frío hacia el pie.
   API (PFAWind):
     turbine(pb,x,gy,{h,n}) → {hub:[x,y], led:[x,y]}  · rotor(R) → tira · drawRotor(g,rot,x,y,ang)
     mast(pb,x,yb,h) → {cups:[[x,y]..], light:[x,y]}
     kiteStation(pb,x,yb) → {screen:[x,y,w,h], sock:[x,y]}
     lab(pb,x,yb,w,{deckY,deckX0,deckX1}) → {lidar:[x,y], screens:[[x,y,w,h]], lamps}
     controlHut(pb,x,yb) → {screen:[x,y,w,h]}
     birdHide(pb,x,yb) → {}
     gorge(pb,x0,x1,yTop,yBot,{seed,stacks:[[x,yTop,w]]}) → {seaY}
     windBush(pb,x,yb,w,h,seed) (aulaga florida inclinada por el viento) · thrift(pb,x,yb,seed) (armeria rosada)
     cliffDress(pb,world,{segs,R,seed,skip,paths}) (r2-biomes-a: degradado de profundidad, cornisas con vegetación
       en cadenas diagonales, gaviotas, senderos en zigzag) · ledgeMat(pb,x,y,w,R,seed) · perchedGull(pb,x,y,seed) · cliffPath(pb,pts,seed)
   Sin tramado.
   ===================================================================== */
const PFAWind = (() => {
  const K = PFK, put = K.put, get = K.get, P32 = K.P32, A = PFArch, I = PFInfra, PL = PFAPlant;
  const rect = PL.rect, hline = PL.hline, vline = PL.vline;
  const TW = ['#3a4256', '#5a6278', '#7c849a', '#a0a8ba', '#c2c8d6', '#dde2ea', '#eef1f6', '#ffffff'];
  const STRATA = [
    ['#3a1c22', '#5e2e34', '#8a4a4a', '#b06a62', '#cf8c7c', '#e8b0a0', '#f6ccbc'],
    ['#4a3a30', '#76604c', '#a08868', '#c4ac88', '#e0ccaa', '#f6e8cc', '#fff6e4'],
    ['#2a2238', '#443a56', '#62587a', '#84789a', '#a89cba', '#ccc2da', '#e6e0f0'],
    ['#3a1608', '#62280e', '#8c3e18', '#b25a26', '#d07a3a', '#e8a05a', '#f6c486'],
  ];
  const ORDER = [0, 1, 0, 3, 2, 1, 0, 2, 3, 1, 0, 2];

  /* ---------- cara de estratos ---------- */
  function layerAt(y, x, sd) {
    const wav = Math.round((PFK.vn(x * 0.008, 0, sd) - 0.5) * 10 + (PFK.vn(x * 0.03, 1, sd) - 0.5) * 3);
    const yy = y + wav;
    let acc = 0, i = 0;
    while (true) { const thin = hash1(i, sd + 9) < 0.22, th = thin ? 4 + Math.floor(hash1(i, sd) * 3) : 15 + Math.floor(hash1(i, sd) * 20); if (yy < acc + th || i > 80) return { i, top: acc - wav, th, ly: yy - acc, thin }; acc += th; i++; }
  }
  /** Familia de color del estrato: arenisca rosada (mayoría), crema; los finos, lila o herrumbre */
  const famOf = (L, sd) => L.thin ? (hash1(L.i, sd + 3) < 0.5 ? 2 : 3) : (hash1(L.i, sd + 4) < 0.3 ? 1 : 0);
  function strataPix(s, x, y, gy, world) {
    const d = y - gy, sd = 300 + ((s.seed | 0) % 50);
    if (d === 0) return U(s.lip || '#c1cd3d');
    if (d === 1) return U('#617517');
    const L = layerAt(y, x, sd), R = P32(STRATA[famOf(L, sd)]);
    // bloques con bisel: arista superior e izquierda iluminadas, inferior y derecha en sombra, centro redondeado
    const bw = 16 + Math.floor(hash1(L.i, sd + 1) * 22), bx = (x + Math.floor(hash1(L.i, sd + 2) * 40) + 4000) % bw;
    const fx = bx / (bw - 1), fy = L.ly / Math.max(1, L.th - 1);
    let k;
    if (L.thin) k = L.ly === 0 ? 5 : L.ly === L.th - 1 ? 1 : 3;
    else if (L.ly === 0) k = 6; else if (L.ly === 1) k = 5; else if (L.ly >= L.th - 2) k = L.ly === L.th - 1 ? 0 : 1;
    else if (bx === 0) k = 0; else if (bx === 1) k = 5; else if (bx === bw - 1) k = 1; else if (bx === bw - 2) k = 2;
    else k = Math.round(4.6 - fx * 1.6 - fy * 1.8 + Math.sin(fx * Math.PI) * 0.6);
    k += Math.round((PFK.cl(x, y, 2, sd + 3) - 0.5) * 1.4);
    if (hash2(x, y, sd + 4) < 0.025) k -= 2;
    let u = R[clamp(k, 0, 6)];
    // alveolos de erosión eólica en la arenisca crema
    if (famOf(L, sd) === 1 && PFK.vn(x * 0.12, y * 0.2, sd + 5) > 0.76) u = R[clamp(k - 2, 0, 6)];
    // líquenes y manchas de humedad
    if (PFK.vn(x * 0.07, y * 0.05, sd + 6) > 0.8 && hash2(x, y, sd + 7) < 0.5) u = K.mixU(u, U('#9aa83a'), 0.35);
    // oscurecimiento frío hacia el pie (primer plano)
    if (d > 50) u = K.shU(u, -Math.min(0.6, (d - 50) * 0.0062), 240);
    // facetas laterales junto a las gargantas
    if (s.edgeL != null && x - s.edgeL < 14 && x >= s.edgeL) u = K.shU(u, -0.38 + (x - s.edgeL) * 0.02, 240);
    if (s.edgeR != null && s.edgeR - x < 6 && x < s.edgeR) u = K.mixU(u, U('#ffe2c4'), 0.35);
    return u;
  }
  function strataPost(pb, world, s) {
    const r = RNG((s.seed | 0) + 77);
    // flecos de hierba que cuelgan del borde superior
    for (let x = s.x0; x < s.x1; x++) { const gy = world.ground[Math.min(world.w, x)]; if (gy > world.h - 10) continue; const L = 2 + Math.floor(PFK.vn(x * 0.3, 0, 13) * 6) + (hash2(x, 3, 7) < 0.1 ? 4 : 0); for (let q = 2; q < L; q++) put(pb, x, gy + q, U(q === L - 1 ? '#98a838' : q % 2 ? '#3b5320' : '#567020')); }
    // hierba y flores colgando de algunas cornisas
    for (let x = s.x0 + r.int(4, 20); x < s.x1 - 6; x += r.int(12, 30)) {
      const gy = world.ground[Math.min(world.w, x)]; if (gy > world.h) continue;
      const y = gy + r.int(14, 120); if (y > world.h - 4) continue;
      const L = layerAt(y, x, 300 + ((s.seed | 0) % 50)), yy = L.top + 1;
      if (yy < gy + 8) continue;
      const k = r();
      if (k < 0.5) PFFlora.tuft(pb, x, yy, 7 + r.int(0, 6), 5 + r.int(0, 5), x * 3 + yy);
      else if (k < 0.68) thrift(pb, x, yy, x);
      else if (k < 0.8) PFFlora.flowerPatch(pb, x, yy, 8, x + yy);
      else if (k < 0.9) { for (let q = 0; q < 6 + r.int(0, 8); q++) put(pb, x + (q % 2), yy + q, U(q % 3 ? '#3b5320' : '#617517')); }
    }
  }
  PFTerrain.register('strata', { face: strataPix, post: strataPost });
  // vacío (gargantas): ni cara superior ni frontal; se ve lo pintado detrás
  PFTerrain.register('void', { surf: () => 0, face: () => 0, depth: 1, flat: true });

  /* ---------- aerogenerador grande ---------- */
  function turbine(pb, x, gy, o = {}) {
    const h = o.h ?? 160, T = P32(TW), n = T.length, yb = gy - 8, top = yb - h;
    // cimentación: losa octogonal en 3/4 con brida de anclaje
    A.castShadow(pb, x - 18, gy, 52, 12, -0.26);
    I.box3q(pb, x - 22, gy, 44, 6, 12, { ramp: PFTerrain.CONC, skew: 0.6 });
    // torre troncocónica: 18 px en la base → 9 px arriba, luz arriba-izquierda, bridas de tramo
    for (let yy = top; yy < yb; yy++) {
      const t = (yb - yy) / h, hw = Math.round(9 - t * 4.5), w = 2 * hw + 1;
      for (let i = 0; i < w; i++) {
        const f = i / (w - 1);
        let k = f < 0.08 ? 3 : f < 0.2 ? 6 : f < 0.32 ? 7 : f < 0.5 ? 5 : f < 0.7 ? 4 : f < 0.88 ? 2 : 3;
        if ([0.33, 0.62].some(q => Math.abs(t - q) < 0.006)) k = Math.max(0, k - 2);
        put(pb, x - hw + i, yy, T[k]);
      }
    }
    // franja de pintura verde en la base, puerta con escalera y barandilla, placa con número
    for (let yy = yb - 12; yy < yb; yy++) for (let i = -9; i <= 9; i++) { const f = (i + 9) / 18; put(pb, x + i, yy, P32(PL.GREEN)[f < 0.2 ? 5 : f < 0.5 ? 4 : f < 0.8 ? 3 : 2]); }
    rect(pb, x - 4, yb - 34, 8, 22, U('#3a4256')); hline(pb, x - 4, x + 3, yb - 34, U('#eef1f6')); put(pb, x + 2, yb - 22, U('#f0bc2c'));
    for (let k = 0; k < 5; k++) hline(pb, x - 10 - k * 2, x - 4, yb - 12 + k * 3 - 1, P32(PFInfra.STEEL)[4 + (k % 2)]);
    for (let yy = yb - 26; yy < yb; yy++) put(pb, x - 12 - Math.round((yy - (yb - 26)) * 0.4), yy, P32(PL.YEL)[4]);
    if (o.n) { rect(pb, x - 4, yb - 52, 8, 7, U('#1e52a2')); K.text(pb, 'T' + o.n, x - 3, yb - 51, U('#ffffff'), { font: 'tiny' }); }
    // góndola en 3/4 (caja con cara superior) y buje
    I.box3q(pb, x - 8, top + 4, 26, 10, 6, { ramp: TW, skew: 0.7 });
    for (let k = 0; k < 4; k++) put(pb, x + 12, top - 2 - k, T[2]);  // anemómetro de la góndola
    put(pb, x + 14, top - 6, T[6]);
    // transformador de pie junto a la torre
    I.box3q(pb, x + 14, gy - 4, 18, 14, 6, { ramp: ['#14202a', '#24384a', '#3a566e', '#567a94', '#7aa0b8', '#a8c4d4'], skew: 0.6 });
    PL.sign(pb, x + 18, gy - 15, 'bolt');
    return { hub: [x - 10, top + 2], led: [x + 4, top - 4] };
  }
  /** Rotor de 3 palas de perfil ahusado (raíz 5 px → punta 1 px) con puntas rojas; 12 cuadros cubren 120° */
  const _rot = new Map();
  function rotor(R) {
    let s = _rot.get(R); if (s) return s;
    const S = R * 2 + 9, c = R + 4, T = P32(TW);
    s = PFK.strip(12, S, S, (pb, f) => {
      for (let b = 0; b < 3; b++) {
        const a = (f / 12) * (TAU / 3) + b * TAU / 3 - Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a);
        for (let i = 3; i <= R; i += 0.5) {
          const t = i / R, wid = t < 0.22 ? 2.6 : t < 0.5 ? 2.2 - (t - 0.22) * 2.4 : Math.max(0.5, 1.5 - (t - 0.5) * 2);
          for (let q = -wid; q <= wid; q += 0.5) {
            const px = Math.round(c + ca * i - sa * q), py = Math.round(c + sa * i + ca * q);
            let k = q < -wid * 0.3 ? 7 : q < wid * 0.4 ? 5 : 2;
            let u = T[k];
            if (t > 0.88 && Math.floor(t * 40) % 2 === 0) u = U(k > 4 ? '#ff6a5a' : '#c0303a');
            put(pb, px, py, u);
          }
        }
      }
      PFK.ellipseFn(pb, c, c, 4.2, 4.2, (nx, ny, d) => T[clamp(Math.round(6 - nx * 2 - ny * 2 - d * 1.5), 1, 7)]);
    });
    s.c0 = c; _rot.set(R, s); return s;
  }
  function drawRotor(g, rot, x, y, ang) { const k = ((ang % (TAU / 3)) + TAU / 3) % (TAU / 3); PFK.drawStrip(g, rot, Math.floor(k / (TAU / 3) * 12), Math.round(x - rot.c0), Math.round(y - rot.c0)); }

  /* ---------- mástil meteorológico de celosía ---------- */
  function mast(pb, x, yb, h = 150) {
    const St = P32(PFInfra.STEEL), top = yb - h, cups = [];
    A.castShadow(pb, x - 6, yb, 14, 6, -0.2);
    for (let yy = top; yy < yb; yy++) { put(pb, x - 3, yy, St[6]); put(pb, x + 3, yy, St[2]); const ph = (yy - top) % 10; put(pb, x - 3 + Math.round(ph * 0.6), yy, St[4]); }
    for (let yy = top; yy < yb; yy += 10) hline(pb, x - 3, x + 3, yy, St[5]);
    for (const [fy, len] of [[0.08, 12], [0.4, 10], [0.72, 9]]) { const yy = top + Math.round(h * fy); hline(pb, x + 3, x + 3 + len, yy, St[5]); hline(pb, x - 3 - len, x - 3, yy + 4, St[5]); cups.push([x + 3 + len, yy - 2]); put(pb, x - 3 - len, yy + 3, U('#2a2a30')); put(pb, x - 4 - len, yy + 2, U('#e8f0f8')); }
    // vientos (tirantes) hacia el suelo
    for (const dx of [-36, 30]) K.lineFn(pb, x, top + 20, x + dx, yb, () => U('#8e94a2'));
    put(pb, x, top - 1, U('#ff3a3a'));
    return { cups, light: [x, top - 1] };
  }

  /* ---------- estación de cometas del Capitán Nimbo ---------- */
  function kiteStation(pb, x, yb) {
    const Wd = P32(A.WOOD), Wh = P32(A.WHITE), w = 70, h = 92;
    A.castShadow(pb, x + 6, yb, w, 14, -0.24);
    I.box3q(pb, x - 4, yb, w + 8, 4, 10, { ramp: A.WOOD, skew: 0.6 });
    I.box3q(pb, x, yb - 4, w, h - 4, 10, { ramp: A.WHITE, skew: 0.6, front: (xx, yy, u, v) => { const ly = yy - (yb - h); if (ly < 3) return Wh[7]; if (ly > h - 18) return Wd[(xx - x) % 6 === 0 ? 2 : 4]; return Wh[6 - (PFK.cl(xx, yy, 3, 81) < 0.08 ? 1 : 0)]; } });
    // tejado a dos aguas magenta, puerta de 86 px con cristal, ventana con pantalla
    // r3-windstorm: tejado a dos aguas en 3/4 — faldón izquierdo al sol, faldón derecho en sombra que se aleja,
    // caballete iluminado, hastial encalado con óculo, tablas de alero magenta y sombra de alero en la fachada
    { const AR = R3WINDSTORM, ax = x + w / 2, ay = yb - h - 18, dxr = 7, dyr = -12, MG = P32(['#3a0636', '#5a0a50', '#8a1a7a', '#b02aa8', '#c838c0', '#e34ad8', '#f070e0', '#ffa8f4']);
      AR.shadowR(pb, x, yb, w, 10, 26, -0.26);
      PFK.polyFill(pb, [[ax, ay], [ax + dxr, ay + dyr], [x + w + 6 + dxr, yb - h + dyr], [x + w + 6, yb - h]], (xx, yy) => MG[clamp(2 + ((xx - yy) % 4 === 0 ? -1 : 0) + ((yy - ay) % 3 === 0 ? 1 : 0), 0, 7)]);
      PFK.polyFill(pb, [[x - 6, yb - h], [ax, ay], [ax + dxr, ay + dyr], [x - 6 + dxr, yb - h + dyr]], (xx, yy) => MG[clamp(5 + ((xx + yy) % 4 === 0 ? 1 : 0) - ((yy - ay) % 3 === 0 ? 1 : 0), 0, 7)]);
      for (let k = 0; k <= 7; k++) put(pb, Math.round(ax + k), Math.round(ay + k * dyr / dxr), MG[7]);
      PFK.polyFill(pb, [[x - 2, yb - h], [ax, ay + 3], [x + w + 2, yb - h]], (xx, yy) => Wh[clamp(6 - ((yy - ay) > 12 ? 1 : 0) + (PFK.cl(xx, yy, 3, 83) < 0.08 ? -1 : 0), 0, 7)]);
      K.ellipseFn(pb, ax, yb - h - 7, 4, 4, (nx, ny, d) => U(d > 0.7 ? '#5a0a50' : ny < -0.2 ? '#bce6f8' : '#3a84c2'));
      for (let k = 0; k < 40; k++) { const t = k / 39, lx = Math.round(lerp(x - 6, ax, t)), ly = Math.round(lerp(yb - h, ay, t)), rx = Math.round(lerp(x + w + 6, ax, t)); put(pb, lx, ly, MG[6]); put(pb, lx, ly + 1, MG[3]); put(pb, rx, ly, MG[4]); put(pb, rx, ly + 1, MG[1]); }
      hline(pb, x - 6, x + w + 6, yb - h, U('#5a0a50')); AR.darken(pb, x, yb - h + 1, w, 2, -0.32); }
    rect(pb, x + 6, yb - 90, 22, 86, Wd[2]); rect(pb, x + 8, yb - 88, 18, 84, Wd[4]); rect(pb, x + 10, yb - 84, 14, 30, U('#6aa0c8')); put(pb, x + 23, yb - 46, U('#f0bc2c'));
    rect(pb, x + 36, yb - 70, 26, 18, U('#1a2a4a')); hline(pb, x + 36, x + 61, yb - 70, U('#6aa0b4'));
    // cometas colgadas en la fachada y carrete
    for (let k = 0; k < 3; k++) { const kx = x + 38 + k * 9, ky = yb - 46; PFK.polyFill(pb, [[kx, ky], [kx + 4, ky + 6], [kx, ky + 14], [kx - 4, ky + 6]], U(['#e34ad8', '#56e5ff', '#ffe14d'][k])); vline(pb, kx, ky + 14, ky + 22, U('#fffaf0')); }
    K.ellipseFn(pb, x + w - 6, yb - 10, 5, 5, (nx, ny, d) => d > 0.5 ? Wd[1] : U('#fffaf0'));
    // mástil de antena y manga de viento en el tejado
    vline(pb, x + w - 10, yb - h - 46, yb - h - 4, U('#c8d8e8')); vline(pb, x + w - 9, yb - h - 46, yb - h - 4, U('#6c7280'));
    return { screen: [x + 37, yb - 69, 24, 16], sock: [x + w - 8, yb - h - 44] };
  }

  /* ---------- laboratorio con plataforma de observación y LIDAR ---------- */
  function lab(pb, x, yb, w, o = {}) {
    const Wh = P32(A.WHITE), F = P32(PL.FRAME), h = o.h ?? 116, screens = [], lamps = [];
    A.castShadow(pb, x + 8, yb, w, 18, -0.26);
    I.box3q(pb, x - 4, yb, w + 8, 5, 14, { ramp: PFTerrain.CONC, skew: 0.6 });
    I.box3q(pb, x, yb - 5, w, h - 5, 14, { ramp: A.WHITE, skew: 0.6, front: (xx, yy, u, v) => { const ly = yy - (yb - h); if (ly < 3) return Wh[7]; if (ly === 54 || ly === 55) return U(ly === 54 ? '#8ff5c8' : '#3fae88'); return Wh[6 - (PFK.cl(xx, yy, 3, 91) < 0.07 ? 1 : 0) - ((xx - x) % 40 === 0 ? 2 : 0)]; } });
    // r3-windstorm: cornisa con luz cálida, sombra de alero, pretil con suelo de cubierta y lateral en sombra violácea
    { const AR = R3WINDSTORM, C = P32(AR.R.WHITE), dxs = Math.round(14 * 0.6);
      for (let xx = x - 1; xx < x + w + 1; xx++) { put(pb, xx, yb - h, U('#fff6e2')); put(pb, xx, yb - h + 1, C[8]); }
      AR.darken(pb, x, yb - h + 2, w, 2, -0.3); AR.darken(pb, x, yb - h + 4, w, 1, -0.12);
      for (let r = 2; r < 13; r++) { const off = Math.round(r * 0.6), yy = yb - h - 1 - r; for (let xx = x + off + 2; xx < x + w + off - 2; xx++) put(pb, xx, yy, C[clamp(4 - (r === 2 ? 1 : 0) + (hash2(xx >> 1, yy, 9) < 0.18 ? 1 : 0), 0, 9)]); }
      for (let r = 0; r < 14; r++) for (let yy = yb - h - r; yy < yb - 5 - r; yy++) { const xx = x + w + Math.round(r * 0.6); const c = get(pb, xx, yy); if (c >>> 24) put(pb, xx, yy, K.mixU(c, C[2], 0.5)); }
      for (let r = 0; r < 14; r++) { const xx = x + w + Math.round(r * 0.6) + 1, yy = yb - 5 - r; for (let q = 0; q < 26 - r; q++) { const c = get(pb, xx + q, yy); if (c >>> 24) put(pb, xx + q, yy, K.shU(c, -0.28, 235)); } } }
    // ventanas superiores e inferiores; puerta de 88 px
    for (let k = 0; k < Math.floor((w - 20) / 40); k++) { const wx = x + 10 + k * 40; for (const wy of [yb - h + 12, yb - h + 64]) { rect(pb, wx, wy, 28, 20, U('#1a2a4a')); hline(pb, wx, wx + 27, wy, U('#6aa0b4')); for (let q = 0; q < 10; q++) put(pb, wx + 2 + q, wy + 18 - q, U('#3a5a7a')); screens.push([wx + 3, wy + 4, 22, 12]); } }
    const dx = x + w - 30; rect(pb, dx, yb - 93, 22, 88, U('#3a4256')); rect(pb, dx + 2, yb - 91, 18, 86, U('#7c849a')); rect(pb, dx + 4, yb - 86, 14, 28, U('#a8d4f0')); hline(pb, dx, dx + 21, yb - 93, U('#eef1f6'));
    // radomo de radar meteorológico en la cubierta
    PFK.ellipseFn(pb, x + 24, yb - h - 14, 12, 12, (nx, ny, d) => ny > 0.5 ? 0 : Wh[clamp(Math.round(6.5 - nx * 1.6 - ny * 1.6), 2, 7)]);
    I.box3q(pb, x + 14, yb - h - 4, 20, 6, 4, { ramp: A.WHITE });
    // plataforma de observación (tablero en y = deckY) con LIDAR eólico
    let lidar = null;
    if (o.deckY) {
      PL.landing(pb, o.deckX0, o.deckY, o.deckX1 - o.deckX0, yb + 2, { d: 7, railH: 22 });
      const lx = o.deckX1 - 26;
      I.box3q(pb, lx, o.deckY - 4, 16, 12, 8, { ramp: A.WHITE, skew: 0.7 });
      PFK.ellipseFn(pb, lx + 10, o.deckY - 22, 4, 2, (nx, ny) => ny < 0 ? U('#d0f4f8') : U('#48a0c0'));
      lidar = [lx + 10, o.deckY - 23];
      PL.cabinets(pb, o.deckX0 + 14, o.deckY - 4, 1, { w: 14, h: 22, d: 5, kinds: ['screen'] });
    }
    for (let lx = x + 20; lx < x + w - 20; lx += 60) lamps.push([lx, yb - h + 52]);
    return { lidar, screens, lamps };
  }

  /* ---------- caseta de control del parque ---------- */
  function controlHut(pb, x, yb) {
    // r3-windstorm: volumen en 3/4 con cornisa al sol, banda magenta que dobla al lateral, pretil y cubierta con
    // máquina de clima, parasol sobre la pantalla, marquesina en la puerta, sombra arrojada y de contacto
    const AR = R3WINDSTORM, Wr = AR.R.WHITE, C = P32(Wr), n = C.length, w = 56, h = 96, d = 10, sk = 0.6, dxs = Math.round(d * sk);
    AR.shadowR(pb, x - 4, yb, w + 8, d, 30, -0.3);
    I.box3q(pb, x - 4, yb, w + 8, 4, 10, { ramp: PFTerrain.CONC, skew: sk });
    I.box3q(pb, x, yb - 4, w, h - 4, d, { ramp: Wr, skew: sk, ink: '#1a1226',
      front: (xx, yy, u, v) => { const ly = yy - (yb - h); if (ly < 1) return U('#fff6e2'); if (ly < 3) return C[n - 2]; if (ly < 7) return U(ly < 4 ? '#f070e0' : ly < 6 ? '#e34ad8' : '#a0249a'); if (ly < 9) return C[4 + (ly - 7)]; return C[clamp(n - 3 - Math.round(v * 1.4) + Math.round((K.cl(xx, yy, 3, 95) - 0.5) * 0.8), 0, n - 1)]; },
      side: (xx, yy, u, v) => { const ly = yy - (yb - h) + Math.round((xx - x - w) / sk); if (ly >= 3 && ly < 7) return U('#7a1a74'); return C[clamp(3 - Math.round(v) + (v > 0.85 ? 1 : 0) + Math.round((K.cl(xx, yy, 3, 96) - 0.5) * 0.8), 0, n - 1)]; },
      top: (xx, yy, u, v) => C[clamp(n - 2 - Math.round(v), 0, n - 1)] });
    // pretil: suelo de la cubierta hundido
    for (let r = 2; r < d - 1; r++) { const off = Math.round(r * sk), yy = yb - h - 1 - r; for (let xx = x + off + 2; xx < x + w + off - 2; xx++) put(pb, xx, yy, C[clamp(4 - (r === 2 ? 1 : 0) + (hash2(xx, yy, 7) < 0.2 ? 1 : 0), 0, n - 1)]); }
    I.box3q(pb, x + 30, yb - h - 3, 12, 6, 5, { ramp: AR.R.METAL, skew: sk, ink: '#0e1220' });
    for (let k = 0; k < 4; k++) put(pb, x + 33 + k * 2, yb - h - 6, U('#2a3040'));
    // pantalla con marco, parasol y alféizar
    rect(pb, x + 4, yb - 74, 36, 24, C[1]); rect(pb, x + 5, yb - 73, 34, 22, C[n - 1]);
    rect(pb, x + 6, yb - 72, 32, 20, U('#0a1030')); hline(pb, x + 6, x + 37, yb - 72, U('#6aa0b4'));
    I.box3q(pb, x + 2, yb - 76, 40, 2, 5, { ramp: ['#3a0a38', '#6a1464', '#a0249a', '#c838c0', '#e34ad8', '#f490ea'], skew: sk, ink: '#2a0628' });
    AR.darken(pb, x + 4, yb - 74, 36, 2, -0.3);
    hline(pb, x + 3, x + 40, yb - 50, C[n - 1]); AR.darken(pb, x + 4, yb - 49, 36, 1, -0.3);
    // puerta acristalada con marco y marquesina
    rect(pb, x + 39, yb - 92, 14, 88, C[2]);
    rect(pb, x + 40, yb - 90, 12, 86, U('#3a4256')); rect(pb, x + 41, yb - 89, 10, 30, U('#a8d4f0')); for (let q = 0; q < 8; q++) put(pb, x + 43 + q, yb - 66 - q, U('#e4f6ff'));
    put(pb, x + 49, yb - 50, U('#ffe08a'));
    I.box3q(pb, x + 36, yb - 93, 20, 2, 6, { ramp: Wr, skew: sk, ink: '#1a1226' }); AR.darken(pb, x + 39, yb - 92, 14, 2, -0.35);
    // aplique y manchas de lluvia bajo la cornisa
    rect(pb, x + 30, yb - 46, 3, 2, U('#fff2c4')); put(pb, x + 31, yb - 44, U('#5a4c48'));
    for (const sx of [x + 12, x + 27]) for (let q = 0; q < 6; q++) { const c = get(pb, sx, yb - h + 9 + q); if (c >>> 24) put(pb, sx, yb - h + 9 + q, K.shU(c, -0.08, 235)); }
    for (let k = 0; k < 4; k++) { vline(pb, x + 10 + k * 8, yb - h - 26 + k * 3, yb - h - 3, U('#c8d8e8')); put(pb, x + 11 + k * 8, yb - h - 26 + k * 3, U('#6c7280')); }
    put(pb, x + 10, yb - h - 27, U('#ff3a3a'));
    // maceta con agave junto a la puerta
    I.box3q(pb, x + 26, yb - 1, 9, 7, 4, { ramp: AR.R.TERRA, skew: sk }); PFFlora.agave(pb, x + 30, yb - 8, 6, x);
    return { screen: [x + 7, yb - 71, 30, 18], lamp: [x + 31, yb - 45] };
  }
  /** Observatorio de aves (escondite de madera con ranura) y cajas nido */
  function birdHide(pb, x, yb) {
    // r3-windstorm: escondite de tablas en 3/4 con cubierta de tablillas (faldón al sol, alero con sombra), ranura
    // con prismáticos, rótulo, cajas nido y hierba al pie; sombra arrojada y de contacto
    const AR = R3WINDSTORM, Wd = P32(A.WOOD), sk = 0.6;
    AR.shadowR(pb, x, yb, 46, 10, 22, -0.3);
    I.box3q(pb, x, yb, 46, 50, 10, { ramp: A.WOOD, skew: sk, ink: '#140a06',
      front: (xx, yy, u, v) => Wd[clamp((xx - x) % 5 === 0 ? 2 : 5 - Math.round(v * 1.4) - (PFK.cl(xx, yy, 2, 97) < 0.15 ? 1 : 0), 0, 7)],
      side: (xx, yy, u, v) => Wd[clamp(((xx - x) % 4 === 0 ? 1 : 2) - Math.round(v * 0.6), 0, 7)] });
    rect(pb, x + 6, yb - 36, 34, 5, U('#140a06')); hline(pb, x + 5, x + 40, yb - 31, Wd[7]); AR.darken(pb, x + 6, yb - 30, 34, 1, -0.3);
    for (const bx of [x + 14, x + 30]) { put(pb, bx, yb - 34, U('#3a4256')); put(pb, bx + 2, yb - 34, U('#3a4256')); put(pb, bx + 1, yb - 33, U('#7ab8e8')); }
    // cubierta de tablillas: faldón que sube hacia el fondo con hiladas, caballete iluminado y alero oscuro
    const S = P32(['#2a140a', '#44220e', '#5e3214', '#7a4620', '#9a5e2c', '#ba7c40', '#d89c5c', '#f0c084']);
    PFK.polyFill(pb, [[x - 4, yb - 50], [x + 54, yb - 50], [x + 61, yb - 62], [x + 3, yb - 62]], (xx, yy) => { const rr = (yb - 50 - yy); return S[clamp((rr % 3 === 0 ? 3 : 5) + (rr > 9 ? 2 : 0) - (((xx + (rr / 3 | 0) * 2) % 6) === 0 ? 1 : 0), 0, 7)]; });
    hline(pb, x + 3, x + 61, yb - 62, S[7]); hline(pb, x - 4, x + 54, yb - 49, S[0]); AR.darken(pb, x, yb - 48, 46, 2, -0.35);
    PFK.polyFill(pb, [[x + 54, yb - 50], [x + 61, yb - 62], [x + 62, yb - 61], [x + 56, yb - 49]], () => S[1]);
    rect(pb, x + 10, yb - 26, 26, 10, U('#e8d8b8')); hline(pb, x + 10, x + 35, yb - 26, U('#fff6e0')); K.text(pb, 'AVES', x + 13, yb - 25, U('#3a1e10'), { font: 'tiny' }); AR.darken(pb, x + 11, yb - 16, 26, 1, -0.3);
    for (const [bx, by] of [[x + 60, yb - 36], [x + 72, yb - 28]]) { vline(pb, bx + 3, by + 8, yb, Wd[2]); I.box3q(pb, bx, by + 8, 8, 8, 3, { ramp: A.WOOD }); put(pb, bx + 3, by + 3, U('#140a06')); }
    AR.vines(pb, x + 1, x + 12, yb - 47, { seed: x, L: 14, gap: 0.3 });
    for (let xx = x - 2; xx < x + 50; xx += 3) PFFlora.tuft(pb, xx, yb + 1, 5, 4 + (xx % 3), xx);
  }

  /* ---------- interior de la garganta: pared del fondo columnar en penumbra, mar con espuma y farallones ---------- */
  function colRock(x, y, sd, R, lit) {
    // columnas verticales de 10–22 px con juntas horizontales; luz desde la izquierda
    const cw = 10 + Math.floor(hash1(Math.floor((x + 3000) / 16), sd) * 12), cx = (x + 3000) % cw, ci = Math.floor((x + 3000) / cw);
    const jh = 18 + Math.floor(hash1(ci, sd + 1) * 24), jy = (y + Math.floor(hash1(ci, sd + 2) * 40) + 3000) % jh;
    const f = cx / (cw - 1);
    let k = Math.round(lit + 2.2 - f * 2.6 + Math.sin(f * Math.PI) * 0.8);
    if (cx === 0) k = 0; if (jy === 0) k = 0; else if (jy === 1) k += 1;
    k += Math.round((PFK.cl(x, y, 2, sd + 3) - 0.5) * 1.2);
    return R[clamp(k, 0, R.length - 1)];
  }
  function gorge(pb, x0, x1, yTop, yBot, o = {}) {
    const sd = o.seed || 5, seaY = yBot - 26, R = P32(o.ramp || ['#260a12', '#3e1420', '#58202c', '#702e36', '#9a4c4e', '#bc6c64', '#d88c78', '#f0b490', '#fcd8b4']);
    const SEA = P32(['#03203a', '#063656', '#0a5276', '#11789a', '#27a8c0', '#7cd8e0', '#e6fdff']);
    const top = (x) => yTop + Math.round((PFK.vn(x * 0.05, 0, sd) - 0.5) * 8);
    // r2-biomes-a: pared del fondo ESCULPIDA (campo de alturas con espolones verticales irregulares, grietas y
    // lóbulos; luz rasante desde la izquierda) en lugar de la rejilla de columnas con juntas
    const gw = x1 - x0 + 2, gh = yBot - yTop + 12, HF = new Float32Array(gw * gh);
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
      const X = x0 - 1 + i, Y = yTop - 6 + j;
      const rid = 1 - Math.abs(fbm(X * 0.055 + fbm(X * 0.01, Y * 0.01, 2, sd + 9) * 2, Y * 0.012, 3, sd + 11) * 2 - 1);
      HF[j * gw + i] = rid * 10 + fbm(X * 0.02, Y * 0.03, 3, sd + 13) * 10 + (vnoise(X * 0.14, Y * 0.05, sd + 15) - 0.5) * 3.5 + Math.floor(fbm(X * 0.03, Y * 0.02, 2, sd + 17) * 4) * 1.5;
    }
    const hAt = (X, Y) => HF[clamp(Y - yTop + 6, 0, gh - 1) * gw + clamp(X - x0 + 1, 0, gw - 1)];
    const nR = R.length;
    for (let x = x0; x < x1; x++) for (let y = top(x); y < yBot; y++) {
      if (y >= seaY + Math.round(Math.sin(x * 0.07) * 1.5)) {
        const q = y - seaY; let k = q < 2 ? 5 : q < 5 ? 4 : q < 10 ? 3 : q < 18 ? 2 : 1;
        if (q < 4 && hash2(x >> 1, y, sd) < 0.35) k = 6;
        put(pb, x, y, SEA[k]); continue;
      }
      if (y - top(x) < 2) { put(pb, x, y, U(y - top(x) === 0 ? '#748c2a' : '#3a5214')); continue; }
      const dx = (hAt(x + 1, y) - hAt(x - 1, y)) * 0.5, dy = (hAt(x, y + 1) - hAt(x, y - 1)) * 0.5, hh = hAt(x, y);
      const cav = hh - (hAt(x - 3, y) + hAt(x + 3, y) + hAt(x, y - 3) + hAt(x, y + 3)) * 0.25;
      let I = 0.5 - dx * 0.55 - dy * 0.22 + cav * 0.12 + (PFK.cl(x, y, 2, sd + 3) - 0.5) * 0.1;
      if (Math.abs(dx) < 0.08 && hh < 6 && hash2(x, y >> 2, sd + 5) < 0.5) I -= 0.18;   // grietas en los valles
      // la pared izquierda de la garganta mira a la derecha (en sombra); la derecha mira a la luz
      const side = (x - x0) / (x1 - x0); I += (side - 0.5) * 0.18;
      let u = R[clamp(Math.round(I * (nR - 1)), 0, nR - 1)];
      u = K.shU(u, -0.12, 240);
      const mist = clamp((y - yTop) / (seaY - yTop), 0, 1);
      // profundidad: velo aéreo claro arriba que se hunde hacia el azul marino en el fondo de la garganta (bandas, sin tramado)
      const band = mist;                                                                             // (r2-biomes-a) degradado continuo: sin bandas horizontales
      u = K.mixU(u, U('#b8c8de'), 0.2 * (1 - band));
      u = K.mixU(u, U('#1c2a5a'), band * band * 0.55);
      put(pb, x, y, u);
    }
    // repisas en las paredes con matas y aves anidando (cara superior clara, sombra bajo la repisa)
    const r = RNG(sd + 40), G = P32(['#26380e', '#3a5214', '#567020', '#748c2a']);
    for (let i = 0; i < Math.round((x1 - x0) / 34); i++) {
      const lx = x0 + 6 + r.int(0, x1 - x0 - 30), ly = yTop + 18 + r.int(0, Math.max(10, seaY - yTop - 50)), lw = r.int(10, 26);
      const dk = clamp((ly - yTop) / (seaY - yTop), 0, 1);
      // (r2-biomes-a) repisa en cuña: el canto superior al sol es el más largo y la panza se estrecha hacia abajo
      for (let k = 0; k < lw; k++) {
        const e = Math.min(k, lw - 1 - k), dep = clamp(e + 1, 1, 5) + (hash2(lx + k, ly, sd) < 0.3 ? 1 : 0);
        for (let q = 0; q < dep; q++) put(pb, lx + k, ly + q, K.mixU(R[q === 0 ? 7 : q === 1 ? 5 : q === dep - 1 ? 0 : 2], U('#1c2a5a'), dk * (q < 2 ? 0.4 : 0.3)));
        for (let q = dep; q < dep + 3; q++) { const c = get(pb, lx + k + 1, ly + q); if (c >>> 24) put(pb, lx + k + 1, ly + q, K.mixU(c, U('#1c1030'), 0.35 * (1 - (q - dep) / 3))); }
      }
      for (let k = 2; k < lw - 2; k += 3 + r.int(0, 3)) { const hh = 2 + r.int(0, 3); for (let q = 1; q <= hh; q++) put(pb, lx + k + (q > 2 ? 1 : 0), ly - q, G[clamp(3 - q, 0, 3)]); }
      if (r.chance(0.55)) { const bx = lx + r.int(3, lw - 4); put(pb, bx, ly - 1, U('#f4f6fb')); put(pb, bx + 1, ly - 1, U('#f4f6fb')); put(pb, bx, ly - 2, U('#ffffff')); put(pb, bx - 1, ly - 1, U('#a8b4c8')); put(pb, bx + 2, ly - 2, U('#f0b030')); }
    }
    // farallones (columnas bajo las plataformas de roca), más cerca y mejor iluminados
    // farallones esculpidos: columna con perfil irregular por estratos, sombreado cilíndrico (luz izquierda),
    // espolones verticales, base que se ensancha en derrubios con espuma; velo azul hacia el mar
    for (const [sx, sy, sw] of (o.stacks || [])) {
      const H = seaY + 2 - sy, rs = RNG(sd + sx);
      let acc = 0, lh = rs.int(5, 12), lay = 0;
      for (let q = 0; q < H; q++) {
        if (++acc > lh) { acc = 0; lh = rs.int(5, 12); lay++; }
        const y = sy + q, t = q / H, hard = lay % 2;
        const hw = sw / 2 * (0.92 + t * 0.22 + (fbm1(q * 0.08, 2, sd + sx) - 0.5) * 0.24) * (hard ? 1.03 : 0.97);
        const cx = sx + sw / 2 - Math.round(q * 0.03) + (fbm1(q * 0.04, 2, sd + sx + 3) - 0.5) * 2;
        for (let xx = Math.floor(cx - hw); xx <= Math.ceil(cx + hw); xx++) {
          const nx = (xx + 0.5 - cx) / hw; if (Math.abs(nx) > 1) continue;
          const nz = Math.sqrt(1 - nx * nx), col = 1 - Math.abs(fbm(xx * 0.18, q * 0.02, 2, sd + 21) * 2 - 1);
          let I = 0.34 - nx * 0.46 + nz * 0.3 + col * 0.18 - (hard ? 0 : 0.08) + (acc === 0 && hard && nx < 0.3 ? 0.2 : 0) + (acc === 1 && !hard ? -0.12 : 0) + (PFK.cl(xx, y, 2, sd + 23) - 0.5) * 0.14;
          let u = R[clamp(Math.round(I * (nR - 1)), 0, nR - 1)];
          if (Math.abs(nx) > 0.9) u = R[clamp(Math.round(I * (nR - 1)) - 2, 0, nR - 1)];
          put(pb, xx, y, K.mixU(u, U('#c4d4e2'), clamp(t, 0, 1) * 0.35));
        }
      }
      for (let i = -6; i < sw + 6; i++) { if (hash2(i, 3, sd) < 0.6) put(pb, sx + i, seaY + 1, U('#ffffff')); if (hash2(i, 4, sd) < 0.4) put(pb, sx + i, seaY, U('#e6fdff')); }
    }
    return { seaY };
  }

  /* ---------- flora de acantilado ---------- */
  function windBush(pb, x, yb, w = 22, h = 14, seed = 1) {
    const r = RNG(seed), G = P32(['#16240a', '#26380e', '#3a5214', '#567020', '#748c2a', '#98a838']);
    for (let i = 0; i < Math.round(w * 0.9); i++) { const cx = x - w / 2 + r() * w * 0.9 + 3, cy = yb - r() * h * 0.8 - 2, rr = 2 + r() * 2.5; PFK.ellipseFn(pb, cx + (yb - cy) * 0.25, cy, rr * 1.2, rr, (nx, ny) => G[clamp(Math.round(3.5 - nx * 1.4 - ny * 1.6), 0, 5)]); }
    for (let i = 0; i < Math.round(w / 2.5); i++) put(pb, Math.round(x - w / 2 + r() * w + 3), Math.round(yb - r() * h), U(r() < 0.7 ? '#ffd84a' : '#fff2a8'));
  }
  function thrift(pb, x, yb, seed = 1) {
    const r = RNG(seed);
    PFK.ellipseFn(pb, x, yb - 2, 5, 2.5, (nx, ny) => U(ny < 0 ? '#617517' : '#3b5320'));
    for (let k = 0; k < 5; k++) { const fx = x - 4 + k * 2 + r.int(0, 1), fy = yb - 5 - r.int(0, 4); vline(pb, fx, fy, yb - 3, U('#617517')); put(pb, fx, fy - 1, U('#f478b8')); put(pb, fx + 1, fy - 1, U('#e94a94')); put(pb, fx, fy - 2, U('#ffb0d8')); }
  }

  /* ---------- (r2-biomes-a) vestido de la cara del acantilado: rompe el muro uniforme ---------- */
  const R2BA_SHV = U('#2e1430'), R2BA_SEA = U('#2a5a8a');
  const R2BA_GRN = ['#0e2410', '#173a16', '#22521c', '#2f6a22', '#43842a', '#62a032', '#8cbc44', '#bcd868'];
  const R2BA_VINE = ['#10260e', '#1c3c14', '#2c5a1c', '#468024', '#6ea436'];
  /** Cornisa con cojín de vegetación: labio de roca al sol, sombra granate debajo, flores, lianas colgantes y manchas de humedad */
  function ledgeMat(pb, x, y, w, R, seed = 1) {
    const r = RNG(seed), LR = P32(R), V_ = P32(R2BA_VINE);
    // sombra arrojada por la cornisa sobre la pared (en diagonal hacia abajo-derecha)
    for (let i = -2; i < w + 4; i++) { const sh = 3 + Math.round(Math.sin(clamp(i / w, 0, 1) * Math.PI) * 6); for (let k = 1; k <= sh; k++) { const xx = x + i + Math.round(k * 0.6), yy = y + 2 + k, c = get(pb, xx, yy); if (c >>> 24) put(pb, xx, yy, K.mixU(c, R2BA_SHV, 0.55 * (1 - k / (sh + 2)))); } }
    // labio de roca (borde ondulado)
    const lip = []; for (let i = 0; i < w; i++) lip.push(Math.round(Math.sin(i * 0.4 + seed) * 0.7 + (i < 3 || i > w - 4 ? 1 : 0)));
    for (let i = 0; i < w; i++) { const yy = y + lip[i]; put(pb, x + i, yy, LR[8]); put(pb, x + i, yy + 1, LR[6]); put(pb, x + i, yy + 2, LR[4]); put(pb, x + i, yy + 3, LR[2]); }
    // manchas de humedad / musgo que bajan desde la cornisa
    for (let k = 0; k < Math.max(1, Math.round(w / 18)); k++) { const mx = x + r.int(2, w - 3), L = r.int(14, 36); for (let q = 4; q < L; q++) for (let dx = 0; dx < 2; dx++) { const xx = mx + dx + Math.round(Math.sin(q * 0.3) * 0.8), c = get(pb, xx, y + q); if (c >>> 24) put(pb, xx, y + q, K.mixU(c, U('#24401a'), 0.32 * (1 - q / L))); } }
    // lianas colgantes con hojas alternas
    for (let k = 0; k < Math.round(w / 6); k++) {
      const vx = x + r.int(1, w - 2), L = r.int(5, 20);
      for (let q = 2; q < L; q++) { const xx = vx + Math.round(Math.sin(q * 0.35 + k) * 1.2); put(pb, xx, y + q, V_[q % 3 === 0 ? 1 : 2]); if (q % 3 === 1) put(pb, xx + (q % 2 ? 1 : -1), y + q, V_[3 + (q % 2)]); }
      put(pb, vx, y + L, V_[4]);
    }
    // cojín de vegetación sobre la cornisa
    for (let i = 0; i < w; i += 7) PFFlora.cluster(pb, x + i + 3, y - 3, 5 + r.int(0, 2), 4.5 + (i % 14 === 0 ? 1.5 : 0), R2BA_GRN, seed + i * 3, { density: 0.6, leaf: [2, 4] });
    if (w > 30 && r() < 0.5) windBush(pb, x + r.int(6, w - 10), y - 1, 14 + r.int(0, 6), 9 + r.int(0, 4), seed + 9);
    for (let k = 0; k < Math.round(w / 4); k++) { const fx = x + r.int(1, w - 2), fy = y - r.int(2, 6), col = r.pick(['#ffd84a', '#fff2a8', '#ff9a3a', '#ffffff', '#ffd84a']); put(pb, fx, fy, U(col)); if (r() < 0.4) put(pb, fx + 1, fy, U(col)); }
    return { y, w };
  }
  /** Gaviota posada (3×3) y chorreón blanco debajo */
  function perchedGull(pb, x, y, seed = 1) {
    put(pb, x, y - 2, U('#ffffff')); put(pb, x + 1, y - 2, U('#ffffff')); put(pb, x + 2, y - 3, U('#ffffff')); put(pb, x + 3, y - 3, U('#f0bc2c'));
    put(pb, x, y - 1, U('#8e9aae')); put(pb, x + 1, y - 1, U('#5e6a80')); put(pb, x + 2, y - 2, U('#e8ecf2')); put(pb, x + 1, y, U('#f0bc2c'));
    for (let q = 4; q < 4 + (seed % 9) + 6; q++) { const c = get(pb, x + 1, y + q); if (c >>> 24) put(pb, x + 1, y + q, K.mixU(c, U('#f4f0e6'), 0.5 * (1 - (q - 4) / 15))); }
  }
  /** Sendero tallado en la pared que baja en zigzag: huella de arena al sol, corte de pared en sombra encima, canto oscuro y sombra debajo, postes de madera con cuerda */
  function cliffPath(pb, pts, seed = 1) {
    const TR = P32(['#5a3a24', '#8a5a3a', '#b88456', '#d8b07a', '#ecd09c', '#f8e6bc']), Wd = P32(['#2a1608', '#4a2a12', '#6e421e', '#94602e', '#b88044', '#d4a060']);
    const tread = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [xa, ya] = pts[i], [xb, yb] = pts[i + 1], n = Math.abs(xb - xa), dir = Math.sign(xb - xa) || 1;
      for (let q = 0; q <= n; q++) { const x = xa + q * dir, y = Math.round(lerp(ya, yb, q / n)); tread.push([x, y]); }
    }
    for (const [x, y] of tread) {
      for (let k = 1; k <= 6; k++) { const c = get(pb, x, y - k); if (c >>> 24) put(pb, x, y - k, K.mixU(c, R2BA_SHV, 0.42 * (1 - k / 7))); }   // corte de la pared
      put(pb, x, y, TR[5]); put(pb, x, y + 1, TR[4]); put(pb, x, y + 2, TR[3]); put(pb, x, y + 3, TR[1]); put(pb, x, y + 4, TR[0]);
      if (hash2(x, y, seed) < 0.12) put(pb, x, y + 1, TR[2]);
      for (let k = 5; k < 9; k++) { const c = get(pb, x, y + k); if (c >>> 24) put(pb, x, y + k, K.mixU(c, R2BA_SHV, 0.45 * (1 - (k - 5) / 4))); }
    }
    // peldaños donde la pendiente es fuerte
    for (let i = 4; i < tread.length; i += 4) { const [x, y] = tread[i], [, yp] = tread[i - 4]; if (Math.abs(y - yp) >= 2) { put(pb, x, y, TR[2]); put(pb, x, y + 1, TR[1]); } }
    // barandilla: postes y cuerda del lado del vacío
    let prev = null;
    for (let i = 0; i < tread.length; i += 10) {
      const [x, y] = tread[i]; for (let k = 1; k < 8; k++) { put(pb, x, y - k + 2, Wd[k < 3 ? 2 : 4]); put(pb, x + 1, y - k + 2, Wd[1]); } put(pb, x, y - 6, Wd[5]);
      if (prev) { const [px, py] = prev; for (let xx = Math.min(px, x); xx <= Math.max(px, x); xx++) { const t = (xx - px) / ((x - px) || 1); put(pb, xx, Math.round(lerp(py - 4, y - 4, t) + Math.sin(t * Math.PI) * 1.5), U('#d8c08a')); } }
      prev = [x, y];
    }
    return tread;
  }
  /** Vestido completo: degradado de profundidad (pie granate-violeta y reflejo frío del mar), cornisas con vegetación en
      cadenas diagonales, gaviotas, senderos y matas en las grietas. o: {segs:[[x0,x1]], R, seed, paths:[[[x,dy]..]], skip:[[x0,x1]]} */
  function cliffDress(pb, world, o) {
    const G = (x) => world.ground[clamp(Math.round(x), 0, world.w)], r = RNG(o.seed || 5), R = o.R;
    for (const [x0, x1] of o.segs) for (let x = Math.max(0, x0); x < Math.min(pb.w, x1); x++) {
      const g = G(x);
      for (let y = g + 30; y < pb.h; y++) { const i = y * pb.w + x, c = pb.data[i]; if (!(c >>> 24)) continue; const t = clamp((y - g - 30) / 130, 0, 1); let u = K.mixU(c, R2BA_SHV, t * t * 0.42 + t * 0.2); if (y > g + 100) u = K.mixU(u, R2BA_SEA, clamp((y - g - 100) / 80, 0, 1) * 0.14); pb.data[i] = u; }
    }
    const skip = (x) => (o.skip || []).some(([a, b]) => x > a && x < b);
    for (const [x0, x1] of o.segs) {
      for (let x = x0 + r.int(20, 50); x < x1 - 40; x += r.int(60, 110)) {
        if (skip(x)) continue;
        let cx = x, cy = G(x) + r.int(22, 58), n = r.int(2, 4);
        for (let k = 0; k < n; k++) {
          const w = r.int(18, 44); if (cx < x0 + 8 || cx + w > x1 - 8) break;
          ledgeMat(pb, cx, cy, w, R, 700 + cx);
          if (r() < 0.35) perchedGull(pb, cx + r.int(4, w - 6), cy - 1, cx);
          if (r() < 0.4) PFFlora.tuft(pb, cx + w + r.int(4, 14), cy + r.int(8, 20), 7, 6, cx + 5);
          cx -= r.int(24, 44); cy += r.int(20, 32);                                                   // la cadena baja hacia la izquierda (diagonal de la referencia)
        }
      }
    }
    // matas y agaves en las grietas de la parte baja (vida también en la sombra)
    for (const [x0, x1] of o.segs) for (let x = x0 + r.int(10, 30); x < x1 - 20; x += r.int(26, 48)) { if (skip(x)) continue; const y = G(x) + r.int(70, 140); if (r() < 0.5) PFFlora.agave(pb, x, y, 6 + r.int(0, 4), x, ['#0c2020', '#123230', '#1c4a40', '#2a6450', '#3e7e60', '#5a9a74']); else PFFlora.tuft(pb, x, y, 8, 7, x + 1); }
    for (const P of o.paths || []) { const x0 = P[0][0]; cliffPath(pb, P.map(([x, dy]) => [x, G(x0) + dy]), x0); }
  }
  return { turbine, rotor, drawRotor, mast, kiteStation, lab, controlHut, birdHide, gorge, windBush, thrift, layerAt, STRATA, TW, ledgeMat, perchedGull, cliffPath, cliffDress };
})();

/* =====================================================================
   r3-windstorm (ronda 3) — Arquitectura en 3/4 a ESCALA DE TERRAZA
   (puertas de 14–22 px, como las de las torres de los aerogeneradores):
   los volúmenes se asientan en bancales detrás del paso, así que leen
   como «un poco más atrás» y dejan ver al personaje delante.
   Luz arriba-izquierda: fachada al sol, lateral derecho en sombra
   violácea, cubierta vista en 3/4, cornisa con luz cálida de 1 px,
   sombra de alero de 2 px, sombra de contacto y sombra arrojada al suelo
   hacia la derecha. Sin tramado.
   API (R3WINDSTORM):
     R  rampas (WHITE, OCHRE, TERRA, SLATE, GLASS, WARM, METAL, GREENP, BLUEP, WOOD, LEAF, BOUG, STONE, GRAV, YEL)
     terrace(pb,x0,x1,yb,hw,{dep,seed,wall,ends}) → {top(x)}  bancal con muro de piedra seca y prado encima
     win(pb,x,y,w,h,{lit,shut,box,frame,mull}) · door(pb,x,yb,w,h,{col,canopy,lit})
     flat(pb,x,yb,w,h,d,{ramp,garden,floors,band,seed,parapet,pv,litFloor}) → {roof:[x,y,w,d], door}
     gable(pb,x,yb,w,h,d,{ramp,roof,rise,seed,shut,lit}) → {ridge:[x,y], top}  casa a dos aguas, teja árabe, hastial
     hangar(pb,x,yb,w,h,d,{seed,label}) → {door:[x,y,w,h], lamp:[x,y]}  nave con bóveda de chapa y portón abierto
     transformer(pb,x,yb,{w,h,d}) → {bush:[[x,y]..]} · substation(pb,x,yb,w,{seed,h}) → {inX,inY,leds,lamps,bus}
     cable(pb,pts,{clamp,tray,step}) cable amarillo de evacuación con abrazaderas
     blade(pb,x,yb,L) pala de repuesto en cunas · crane(pb,x,yb,{boom,ang,hook}) grúa de orugas con pluma de celosía
     vines(pb,x0,x1,y,{seed,L,boug,gap}) cascada de hiedra/buganvilla · nest(pb,x,y,seed) nido de gaviota
     shadowR(pb,x,yb,w,d,len,amt) sombra arrojada + contacto · darken(pb,x,y,w,h,amt)
   ===================================================================== */
const R3WINDSTORM = (() => {
  const K = PFK, put = K.put, get = K.get, P32 = K.P32, I = PFInfra;
  const R = {
    WHITE: ['#2a2238', '#433a56', '#5e5574', '#7b7290', '#9b92ac', '#bcb2c6', '#d8ccd4', '#eadcd8', '#f6eae0', '#fff8ee'],
    OCHRE: ['#2e1a14', '#4c2a1c', '#6e3e24', '#8e5630', '#ae703e', '#c88c52', '#dca86a', '#ecc488', '#f8deaa', '#fff2d2'],
    TERRA: ['#2e0e08', '#4e180c', '#742612', '#9a3618', '#bc4a22', '#d6642e', '#ea8444', '#f6a662', '#ffca8e'],
    SLATE: ['#141a26', '#1e2636', '#2a3448', '#38445c', '#4a5872', '#5e6e8a', '#7a8aa4', '#9eacc2', '#c6d0e0'],
    GLASS: ['#0e1c36', '#142c54', '#1c4478', '#28629e', '#3a84c2', '#58a6dc', '#86c8ee', '#bce6f8', '#ecfaff'],
    WARM: ['#3a1a0a', '#6a3412', '#a05a1c', '#d08a2c', '#f0b44a', '#fcd682', '#fff2c4'],
    METAL: ['#161c28', '#222a3a', '#30394c', '#424d62', '#58647a', '#727e94', '#909cb0', '#b4bece', '#d6dee8', '#f2f6fa'],
    GREENP: ['#08241a', '#0e3626', '#164a34', '#1f6044', '#2a7a56', '#3c966a', '#5ab484', '#86d2a4', '#bcecd0'],
    BLUEP: ['#0a1a36', '#10284e', '#183a6c', '#22508e', '#3068b0', '#4a86cc', '#70a8e2', '#a6ccf2'],
    WOOD: ['#1e0e06', '#3a1e10', '#5a3420', '#7a4e30', '#9a6a44', '#c08e60', '#e2b88a', '#f4d8b0'],
    LEAF: ['#0c2410', '#143818', '#1e4e1e', '#2c6624', '#3e7e2a', '#58982e', '#7cb23a', '#a6cc50', '#d0e478'],
    BOUG: ['#4a0a2a', '#7a1440', '#b02058', '#dc3a78', '#f46a9e', '#ffa0c4'],
    STONE: ['#24120b', '#3d2117', '#583222', '#74452d', '#93603b', '#b07a4c', '#c9955f', '#e0b47a', '#f2d29e', '#fde8c4'],
    GRAV: ['#2a2420', '#423a32', '#5e5448', '#7a6e60', '#968a7a', '#b2a694', '#ccc2ae', '#e4dcc8'],
    YEL: ['#3a2604', '#6e4c0c', '#a87414', '#d89a1c', '#f0bc2c', '#fcd856', '#fff2a8'],
  };
  const SK = 0.5;
  const sh = (u, a) => K.shU(u, a, 235);
  function rect(pb, x, y, w, h, fn) { x = Math.round(x); y = Math.round(y); for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) { const u = typeof fn === 'function' ? fn(xx, yy, (xx - x) / Math.max(1, w - 1), (yy - y) / Math.max(1, h - 1)) : fn; if (u) put(pb, xx, yy, u); } }
  function darken(pb, x, y, w, h, a) { for (let yy = Math.round(y); yy < y + h; yy++) for (let xx = Math.round(x); xx < x + w; xx++) { const c = get(pb, xx, yy); if (c >>> 24) put(pb, xx, yy, sh(c, a)); } }
  /** Sombra arrojada al suelo (antes de pintar el volumen): parte del lateral y se alarga hacia la derecha; contacto */
  function shadowR(pb, x, yb, w, d, len, amt = -0.3) {
    const dx = Math.round(d * SK);
    for (let r = 0; r <= d + 2; r++) { const yy = yb - r, x0 = x + w + Math.round(r * SK) - 2, L = Math.round(len * (1 - r / (d + 6))); for (let xx = x0; xx < x0 + L; xx++) { const c = get(pb, xx, yy); if (c >>> 24) put(pb, xx, yy, sh(c, xx > x0 + L - 3 ? amt * 0.5 : amt)); } }
    for (let xx = x - 1; xx < x + w + dx + 2; xx++) { const c = get(pb, xx, yb); if (c >>> 24) put(pb, xx, yb, sh(c, -0.42)); const c2 = get(pb, xx, yb + 1); if (c2 >>> 24) put(pb, xx, yb + 1, sh(c2, -0.18)); }
  }
  /* ---------- bancal: muro de piedra seca + prado ---------- */
  function terrace(pb, x0, x1, yb, hw, o = {}) {
    const S = P32(o.wall || R.STONE), G = P32(R.LEAF), dep = o.dep ?? 9, sd = o.seed || 7, r = RNG(sd);
    const ybF = typeof yb === 'function' ? yb : () => yb, hwF = typeof hw === 'function' ? hw : () => hw;
    const topY = (x) => ybF(x) - hwF(x) + Math.round((K.vn(x * 0.05, 3, sd) - 0.5) * 2);
    const endK = (x) => { const e = o.ends ?? 14, a = clamp((x - x0) / e, 0, 1), b = clamp((x1 - x) / e, 0, 1); return Math.min(a, b); };
    const tyAt = (x) => Math.round(ybF(x) - (ybF(x) - topY(x)) * (0.35 + 0.65 * Math.sqrt(endK(x))));
    for (let x = x0; x < x1; x++) {
      const ek = endK(x), ty = tyAt(x), yb = ybF(x);
      // prado encima (filas que se alejan) con borde trasero irregular
      const dd = Math.max(2, Math.round(dep * (0.5 + 0.5 * ek) + (K.vn(x * 0.11, 9, sd) - 0.5) * 3));
      for (let q = 1; q <= dd; q++) { const k = q === dd ? 6 : q === 1 ? 5 : 4 + ((hash2(x >> 1, q >> 1, sd) < 0.3) ? 1 : 0); put(pb, x, ty - q, G[clamp(k + (q > dd * 0.6 ? 1 : 0), 0, 8)]); }
      if (hash2(x, 2, sd) < 0.18) put(pb, x, ty - dd - 1, G[7]);
      // muro: hiladas de mampuestos redondeados al tresbolillo
      for (let y = ty; y < yb; y++) {
        const ly = y - ty, row = Math.floor(ly / 4), off = (row % 2) * 3 + ((hash2(row, 1, sd) * 4) | 0), sw = 5 + ((hash2(row, ((x + off) / 6) | 0, sd) * 3) | 0);
        const bx = (x + off) % sw, by = ly % 4;
        let k = 5 - (by === 3 ? 3 : by === 0 ? -1 : 0) - (bx === sw - 1 ? 2 : bx === 0 ? -1 : 0) - Math.round(ly / Math.max(1, yb - ty) * 1.2);
        if (ly === 0) k = 8;
        if (hash2(x >> 1, y >> 1, sd + 3) < 0.06) k -= 1;
        put(pb, x, y, S[clamp(k, 0, 9)]);
      }
    }
    // hierba que asoma por la cornisa del muro y flores
    for (let x = x0 + 2; x < x1 - 2; x += 2 + r.int(0, 3)) { const ty = tyAt(x); const L = r.int(1, 4); for (let q = 0; q < L; q++) put(pb, x, ty + q, G[q === L - 1 ? 6 : 3]); if (r() < 0.12) put(pb, x, ty - 1, U(['#f46a9e', '#ffe14d', '#ffffff', '#b06ae0'][r.int(0, 3)])); }
    return { top: tyAt };
  }
  /* ---------- ventanas y puertas ---------- */
  function win(pb, x, y, w, h, o = {}) {
    const G = P32(o.lit ? R.WARM : R.GLASS), F = P32(o.frame || R.WHITE), nF = F.length;
    darken(pb, x - 1, y - 2, w + 2, 1, -0.3);
    rect(pb, x - 1, y - 1, w + 2, h + 2, (xx, yy) => yy === y - 1 || xx === x - 1 ? F[2] : F[1]);
    rect(pb, x, y, w, h, (xx, yy, u, v) => {
      const mx = o.mull !== false && w >= 7 && xx - x === (w >> 1), tr = h >= 10 && yy - y === Math.round(h * 0.38);
      if (mx || tr) return F[nF - 3];
      if (o.lit) return G[clamp(Math.round(5 - v * 2.4 + (u > 0.2 && u < 0.8 && v > 0.55 ? -1 : 0)), 1, 6)];
      let k = Math.round(6.6 - v * 3.6 - u * 0.8);
      const gl = (xx - x) - (h - (yy - y)) * 0.6;
      if (gl > w * 0.18 && gl < w * 0.18 + 2) k += 2;
      return G[clamp(k, 0, 8)];
    });
    if (o.lit) for (let xx = x; xx < x + w; xx++) put(pb, xx, y + h - 1, G[2]);
    for (let xx = x - 2; xx < x + w + 2; xx++) put(pb, xx, y + h + 1, F[nF - 1]);
    for (let xx = x - 1; xx < x + w + 2; xx++) { const c = get(pb, xx, y + h + 2); if (c >>> 24) put(pb, xx, y + h + 2, sh(c, -0.3)); }
    if (o.shut) { const S = P32(o.shut); for (const sx of [x - 4, x + w + 1]) rect(pb, sx, y - 1, 3, h + 2, (xx, yy) => S[(yy - y) % 2 === 0 ? 2 : xx === sx ? 5 : 4]); }
    if (o.box) { rect(pb, x - 1, y + h + 2, w + 2, 3, (xx, yy) => P32(R.TERRA)[yy === y + h + 2 ? 6 : 3]); for (let xx = x - 1; xx < x + w + 1; xx++) if (hash2(xx, y, 5) < 0.75) { put(pb, xx, y + h + 1, P32(R.LEAF)[4 + (xx % 2)]); if (hash2(xx, y, 6) < 0.4) put(pb, xx, y + h, U(o.box === true ? '#ec3a5a' : o.box)); } }
  }
  function door(pb, x, yb, w, h, o = {}) {
    const D = P32(o.col || R.GREENP), n = D.length;
    darken(pb, x - 1, yb - h - 1, w + 2, h + 1, -0.35);
    rect(pb, x, yb - h, w, h, (xx, yy, u, v) => {
      if (o.lit) return P32(R.WARM)[clamp(Math.round(5 - v * 3), 1, 6)];
      let k = n - 3 - Math.round(v * 1.5) - (u > 0.85 ? 2 : 0) + (u < 0.12 ? 1 : 0);
      if ((xx - x) % 4 === 3) k -= 1;
      return D[clamp(k, 0, n - 1)];
    });
    put(pb, x + w - 3, yb - (h >> 1), U('#ffe08a'));
    if (o.canopy !== false) { I.box3q(pb, x - 3, yb - h - 1, w + 6, 2, 4, { ramp: o.canopyRamp || R.WHITE, skew: SK, ink: '#1a1226' }); darken(pb, x - 2, yb - h, w + 5, 2, -0.35); }
    rect(pb, x - 2, yb - 1, w + 4, 2, (xx, yy) => P32(R.GRAV)[yy === yb - 1 ? 6 : 3]);
  }
  /** Cascada de hiedra con buganvilla que cuelga de un pretil (sombra en el muro) */
  function vines(pb, x0, x1, y, o = {}) {
    const L = P32(R.LEAF), B = P32(R.BOUG), r = RNG(o.seed || 3);
    for (let x = x0; x < x1; x++) {
      if (r() < (o.gap ?? 0.35)) continue;
      const len = r.int(2, o.L || 10);
      let xx = x;
      for (let k = 0; k < len; k++) {
        if (r() < 0.25) xx += r() < 0.5 ? -1 : 1;
        const c = get(pb, xx + 1, y + k + 1); if (c >>> 24) put(pb, xx + 1, y + k + 1, sh(c, -0.22));
        put(pb, xx, y + k, L[clamp(5 - (k > len - 3 ? 2 : 0) + (r() < 0.3 ? 1 : 0) - (k % 3 === 2 ? 1 : 0), 1, 8)]);
        if (o.boug && r() < 0.28) put(pb, xx + (r() < 0.5 ? 1 : 0), y + k, B[r.int(2, 5)]);
      }
    }
  }
  /* ---------- volúmenes ---------- */
  /** Edificio de cubierta plana: fachada al sol, lateral en sombra, pretil, cornisa, ventanas por planta, cubierta ajardinada */
  function flat(pb, x, yb, w, h, d, o = {}) {
    const ramp = o.ramp || R.WHITE, C = P32(ramp), n = C.length, dx = Math.round(d * SK), sd = o.seed || 11, out = { lamps: [] };
    shadowR(pb, x, yb, w, d, Math.round(h * 0.42), -0.3);
    I.box3q(pb, x, yb, w, h, d, {
      skew: SK, ramp, ink: '#1a1226',
      front: (xx, yy, u, v) => { let k = n - 3 + (v < 0.06 ? 1 : 0) - Math.round(v * 1.3) + Math.round((K.cl(xx, yy, 3, sd) - 0.5) * 0.9); if (o.band && Math.abs(yy - (yb - o.band)) < 1) k = n - 2; if (o.panels && (xx - x) % o.panels === 0) k -= 1; if (yy >= yb - 4) k = 3; return C[clamp(k, 0, n - 1)]; },
      side: (xx, yy, u, v) => C[clamp(3 - Math.round(v) + (v > 0.8 ? 1 : 0) + Math.round((K.cl(xx, yy, 3, sd + 1) - 0.5) * 0.8), 0, n - 1)],
      top: (xx, yy, u, v) => C[clamp(Math.round(n - 2 - v * 1.2), 0, n - 1)],
    });
    const yt = yb - h;
    // cornisa: canto superior al sol, sombra de 2 px bajo el vuelo
    for (let xx = x - 1; xx < x + w + 1; xx++) { put(pb, xx, yt, U(o.lip || '#fff6e2')); put(pb, xx, yt + 1, C[n - 2]); if (xx >= x && xx < x + w) { put(pb, xx, yt + 2, sh(get(pb, xx, yt + 2), -0.32)); put(pb, xx, yt + 3, sh(get(pb, xx, yt + 3), -0.14)); } }
    put(pb, x - 1, yt + 1, C[3]);
    // cubierta: pretil de 2 px y suelo interior (o jardín)
    if (o.parapet !== false) {
      const pt = 2;
      for (let r = pt; r < d - 1; r++) { const off = Math.round(r * SK), yy = yt - 1 - r; for (let xx = x + off + pt; xx < x + w + off - pt; xx++) put(pb, xx, yy, C[clamp(n - 4 - (r === pt ? 1 : 0) - (xx - x - off < pt + 2 ? 1 : 0), 0, n - 1)]); }
      if (o.garden) garden(pb, x, yt, w, d, sd, o);
      for (let xx = x + dx; xx < x + w + dx; xx++) put(pb, xx, yt - d, C[n - 1]);
    }
    for (let r = 0; r < d; r++) put(pb, x + w + Math.round(r * SK), yt - r, C[n - 4]);
    // ventanas por planta (la planta baja deja sitio a la puerta)
    const floors = o.floors || 1, fh = Math.floor((h - 4) / floors), ww = o.winW || 8;
    for (let f = 0; f < floors; f++) {
      const wy = yb - 4 - (f + 1) * fh + 5, wh = Math.min(fh - 9, o.winH || 10);
      for (let wx = x + (f === 0 ? (o.doorW || 10) + 10 : 6); wx + ww < x + w - 4; wx += ww + (o.winGap || 6)) win(pb, wx, wy, ww, wh, { lit: o.litFloor === f || (o.litAll && hash2(wx, f, sd) < 0.5), shut: o.shut, box: o.box && f > 0 ? o.box : false, frame: ramp });
      // ventana lateral estrecha (sigue el plano del lateral)
      if (dx > 3) for (let q = 0; q < Math.max(1, dx - 4); q++) for (let rr = 0; rr < wh; rr++) put(pb, x + w + 2 + q, wy + rr - Math.round((q + 2) / SK) + 2, P32(R.GLASS)[rr < 2 ? 4 : 2]);
    }
    out.door = [x + 5, yb - 4];
    door(pb, x + 5, yb - 2, o.doorW || 10, Math.min(fh + 1, o.doorH || 20), { col: o.doorCol || R.GREENP, lit: o.doorLit, canopyRamp: ramp });
    for (let xx = x; xx < x + w; xx++) put(pb, xx, yb - 4, C[n - 4]);
    out.roof = [x, yt, w, d];
    return out;
  }
  /** Cubierta ajardinada: césped, lavanda, arbustos, un olivo, pérgola FV opcional y jardinera con cascada */
  function garden(pb, x, yt, w, d, sd, o = {}) {
    const L = P32(R.LEAF), SO = P32(['#2a1a10', '#3e2818', '#56381e', '#6e4a28']);
    for (let rr = 2; rr < d - 1; rr++) { const off = Math.round(rr * SK), yy = yt - 1 - rr; for (let xx = x + off + 2; xx < x + w + off - 2; xx++) { const k = 3 + Math.round((K.vn(xx * 0.3, yy * 0.4, sd) - 0.4) * 3) + (rr > d - 4 ? 1 : 0); put(pb, xx, yy, k < 2 ? SO[2] : L[clamp(k, 1, 7)]); } }
    for (let rr = 3; rr < d - 2; rr += 2) { const off = Math.round(rr * SK), yy = yt - 1 - rr; for (let xx = x + off + 4; xx < x + off + Math.round(w * 0.45); xx += 2) { put(pb, xx, yy, U(rr % 4 === 1 ? '#9a6ad8' : '#b48ae8')); put(pb, xx, yy - 1, U('#6a4aa8')); } }
    const tx = x + Math.round(w * 0.7) + Math.round(d * SK * 0.6), ty = yt - Math.round(d * 0.6);
    for (let k = 0; k < 3; k++) PFFlora.cluster(pb, x + 10 + k * Math.round(w / 4) + Math.round(d * SK * 0.8), yt - d + 2 + (k % 2), 4 + (k % 2), 3, ['#0e2a12', '#1a4218', '#2a5c1e', '#3e7826', '#5a9430', '#80b040', '#aacc5a'], sd + k, { density: 0.9 });
    if (o.pv) { const px = x + 6 + Math.round(d * SK), py = yt - d + 1; for (const qx of [px, px + 15]) for (let q = 0; q < 10; q++) put(pb, qx, py - q, U('#7a5430')); for (let q = 0; q < 17; q++) { put(pb, px - 1 + q, py - 11, U('#1c4478')); put(pb, px - 1 + q, py - 12, U(q % 4 === 0 ? '#86c8ee' : '#28629e')); put(pb, px + q, py - 13, U('#3a84c2')); put(pb, px - 1 + q, py - 10, U('#5a3a20')); } }
    if (o.tree !== false) { for (let q = 0; q < 9; q++) put(pb, tx, ty - q, U(q < 3 ? '#4a3018' : '#5e3e20')); put(pb, tx + 1, ty - 6, U('#4a3018')); PFFlora.cluster(pb, tx, ty - 13, 8, 6, ['#16300e', '#24461a', '#365e24', '#4a762c', '#62903a', '#86ac52', '#b0c878'], sd + 9, { density: 0.95 }); }
    for (let xx = x + 1; xx < x + w - 1; xx++) { put(pb, xx, yt - 1, L[5 + (xx % 3 === 0 ? 1 : 0)]); if (hash2(xx, 1, sd) < 0.5) put(pb, xx, yt - 2, L[6 + (xx % 2)]); if (hash2(xx, 2, sd) < 0.12) put(pb, xx, yt - 2, P32(R.BOUG)[4]); }
    if (o.vines !== false) vines(pb, x + 2, x + w - 2, yt + 2, { seed: sd + 7, L: o.vineL || 12, boug: true, gap: 0.45 });
  }
  /** Casa a dos aguas con cumbrera paralela a la fachada: faldón de teja al sol, alero, hastial lateral en sombra */
  function gable(pb, x, yb, w, h, d, o = {}) {
    const ramp = o.ramp || R.WHITE, C = P32(ramp), n = C.length, T = P32(o.roof || R.TERRA), nT = T.length, dx = Math.round(d * SK), sd = o.seed || 13;
    const dr = d / 2, rise = Math.round(o.rise ?? dr * 1.15), yt = yb - h, oh = 2;
    shadowR(pb, x, yb, w, d, Math.round((h + rise) * 0.4), -0.3);
    I.box3q(pb, x, yb, w, h, d, { skew: SK, ramp, ink: '#1a1226',
      front: (xx, yy, u, v) => { let k = n - 3 - Math.round(v * 1.2) + Math.round((K.cl(xx, yy, 3, sd) - 0.5) * 0.9); if (yy >= yb - 3) k = 3; return C[clamp(k, 0, n - 1)]; },
      side: (xx, yy, u, v) => C[clamp(3 - Math.round(v) + Math.round((K.cl(xx, yy, 3, sd + 2) - 0.5) * 0.8), 0, n - 1)] });
    // hastial lateral (triángulo en sombra)
    const ax = x + w + Math.round(dr * SK), ay = yt - Math.round(dr) - rise;
    K.polyFill(pb, [[x + w, yt + 1], [ax, ay], [x + w + dx, yt - d + 1], [x + w + dx, yt - d + 2]], (xx, yy) => C[clamp(2 + Math.round((K.cl(xx, yy, 3, sd + 3) - 0.5)), 0, n - 1)]);
    // faldón delantero: hiladas de teja y canales
    const y0 = yt + 1, y1 = ay;
    for (let yy = y1; yy <= y0; yy++) {
      const t = (y0 - yy) / Math.max(1, y0 - y1), off = Math.round(t * dr * SK);
      for (let xx = x - oh + off; xx < x + w + oh + off; xx++) {
        const row = Math.floor((y0 - yy) / 3), rl = (y0 - yy) % 3, col = (xx - off - x + 40 + (row % 2) * 2) % 4;
        let k = nT - 3 + Math.round(t * 0.6) + (rl === 2 ? 1 : rl === 0 ? -2 : 0) + (col === 0 ? -1 : col === 1 ? 1 : 0);
        if (yy === y1) k = nT - 1;
        if (xx >= x + w + off) k -= 2;
        put(pb, xx, yy, T[clamp(k, 0, nT - 1)]);
      }
    }
    for (let xx = x - oh; xx < x + w + oh; xx++) put(pb, xx, y0 + 1, T[1]);
    darken(pb, x, y0 + 2, w, 2, -0.34);
    for (let xx = x - oh + Math.round(dr * SK); xx < x + w + oh + Math.round(dr * SK); xx++) { put(pb, xx, y1, T[nT - 1]); put(pb, xx, y1 - 1, T[nT - 4]); }
    if (o.chimney !== false) { const cx = x + Math.round(w * 0.72) + Math.round(dr * SK * 0.5); I.box3q(pb, cx, y1 + 3, 4, 7, 2, { ramp, skew: SK }); put(pb, cx + 1, y1 - 5, C[n - 1]); }
    const ww = o.winW || 6, dw = o.doorW || 7, dX = o.doorX ?? 4;
    door(pb, x + dX, yb - 1, dw, Math.min(h - 6, o.doorH || 15), { col: o.doorCol || R.BLUEP, canopy: false });
    for (let wx = x + dX + dw + 4; wx + ww < x + w - 2; wx += ww + 6) win(pb, wx, yt + 5, ww, Math.min(h - 13, 8), { frame: ramp, shut: o.shut || R.BLUEP, box: o.box ?? (hash2(wx, 1, sd) < 0.6), lit: o.lit && hash2(wx, 2, sd) < 0.5, mull: false });
    return { ridge: [x + Math.round(dr * SK), y1], top: y1 };
  }
  /** Nave de mantenimiento: bóveda de chapa en 3/4, portón abierto con interior cálido y pala en cunas */
  function hangar(pb, x, yb, w, h, d, o = {}) {
    const M = P32(R.METAL), n = M.length, out = {};
    shadowR(pb, x, yb, w, d, Math.round(h * 0.5), -0.32);
    I.box3q(pb, x, yb, w, h, d, { skew: SK, ramp: R.METAL, ink: '#0e1220',
      front: (xx, yy, u, v) => M[clamp(n - 3 - Math.round(v * 1.6) + ((xx - x) % 3 === 0 ? -1 : (xx - x) % 3 === 1 ? 1 : 0), 0, n - 1)],
      side: (xx, yy, u, v) => M[clamp(3 - Math.round(v) + ((xx - x) % 3 === 0 ? -1 : 0), 0, n - 1)],
      top: () => M[5] });
    const rv = Math.round(o.vault ?? Math.min(12, w * 0.2)), yt = yb - h;
    for (let r = 0; r < d; r++) {
      const off = Math.round(r * SK), yy0 = yt - r;
      for (let xx = x + off; xx < x + w + off; xx++) {
        const u = (xx - x - off) / (w - 1), hgt = Math.round(Math.sqrt(Math.max(0, 1 - Math.pow(u * 2 - 1, 2))) * rv);
        for (let q = 0; q <= hgt; q++) { const lam = clamp(0.62 - (u - 0.5) * 1.1 + (r / d) * 0.1, 0, 1); let k = Math.round(3 + lam * 5) + ((r % 3 === 0) ? -1 : 0); if (q === hgt && r === d - 1) k = n - 1; put(pb, xx, yy0 - q, M[clamp(k, 0, n - 1)]); }
      }
    }
    for (let xx = x; xx < x + w; xx++) { const u = (xx - x) / (w - 1), hgt = Math.round(Math.sqrt(Math.max(0, 1 - Math.pow(u * 2 - 1, 2))) * rv); for (let q = 0; q <= hgt; q++) put(pb, xx, yt - q, M[clamp(n - 3 - (q === hgt ? -2 : 0) + ((xx - x) % 3 === 0 ? -1 : 0), 0, n - 1)]); put(pb, xx, yt - hgt - 1, U('#fff6e2')); }
    for (let xx = x; xx < x + w; xx++) put(pb, xx, yt + 2, ((xx >> 2) % 2) ? U('#f0bc2c') : U('#1a1a22'));
    const gw = Math.round(w * 0.62), gh = Math.round(h * 0.78), gx = x + Math.round((w - gw) / 2);
    rect(pb, gx, yb - gh, gw, gh, (xx, yy, u, v) => U(mixHex('#2a1a12', '#e8a050', clamp(v * 0.75 + 0.05 - Math.abs(u - 0.5) * 0.35, 0, 0.85))));
    for (let xx = gx; xx < gx + gw; xx++) { put(pb, xx, yb - gh, M[1]); put(pb, xx, yb - gh + 1, M[6]); put(pb, xx, yb - gh + 2, M[3]); }
    for (let yy = yb - gh; yy < yb; yy++) { put(pb, gx - 1, yy, M[n - 2]); put(pb, gx + gw, yy, M[1]); }
    for (let xx = gx + 2; xx < gx + gw - 2; xx++) { const u = (xx - gx) / gw, th = Math.max(1, Math.round(3 - u * 2.4)); for (let q = 0; q < th; q++) put(pb, xx, yb - 9 - q, U(q === 0 ? '#fffaf0' : '#c8ccd8')); }
    for (const cx of [gx + 5, gx + gw - 9]) rect(pb, cx, yb - 8, 3, 7, U('#4a3a2a'));
    for (let xx = gx + 1; xx < gx + gw - 1; xx++) put(pb, xx, yb - gh + 5, U('#f0bc2c'));
    for (let q = 0; q < 6; q++) put(pb, gx + Math.round(gw * 0.6), yb - gh + 6 + q, U('#3a3a44'));
    out.door = [gx, yb - gh, gw, gh]; out.lamp = [gx + (gw >> 1), yb - gh + 4];
    door(pb, x + w - 8, yb - 1, 5, Math.min(14, h - 6), { col: R.SLATE, canopy: false });
    if (o.label && typeof PFB !== 'undefined') PFB.plaque(pb, x + (w >> 1), yt - rv + 2, o.label, { center: true, bg: '#1e3a6a', border: '#fcd856', col: '#fff8e0', h: 9, screws: false });
    return out;
  }
  /* ---------- energía ---------- */
  function insulator(pb, x, yb, hgt) { for (let q = 0; q < hgt; q++) { const ring = q % 2 === 0; put(pb, x, yb - q, U(ring ? '#a0583a' : '#6a3420')); if (ring) { put(pb, x - 1, yb - q, U('#c87a52')); put(pb, x + 1, yb - q, U('#5a2a18')); } } put(pb, x, yb - hgt, U('#d8dce4')); }
  const TRG = ['#10201e', '#1c3230', '#2a4a46', '#3c6460', '#548078', '#74a096', '#9cc0b4', '#cce4da'];
  function transformer(pb, x, yb, o = {}) {
    const w = o.w || 20, h = o.h || 14, d = o.d || 8, dx = Math.round(d * SK), Gu = P32(TRG);
    shadowR(pb, x, yb, w, d, 8, -0.3);
    I.box3q(pb, x, yb, w, h, d, { skew: SK, ramp: TRG, ink: '#0a1210',
      front: (xx, yy, u, v) => { const f = (xx - x) % 3; return Gu[clamp(5 - Math.round(v * 1.4) + (f === 0 ? 1 : f === 2 ? -1 : 0), 0, 7)]; },
      side: (xx, yy, u, v) => Gu[clamp(2 - Math.round(v) + ((xx % 2) ? 0 : -1), 0, 7)] });
    for (let xx = x + 3 + dx; xx < x + w - 2 + dx; xx++) for (let q = 0; q < 4; q++) put(pb, xx, yb - h - d + 1 - q, Gu[[3, 6, 5, 2][q]]);
    const bush = [];
    for (let k = 0; k < 3; k++) { const bx = x + 4 + k * Math.round((w - 6) / 2) + Math.round(dx * 0.5), by = yb - h - Math.round(d * 0.5); insulator(pb, bx, by, 7); bush.push([bx, by - 7]); }
    for (let q = 0; q < 4; q++) for (let j = -q; j <= q; j++) put(pb, x + 6 + j, yb - 9 + q, U(q === 3 ? '#1a1a1a' : '#fcd856'));
    put(pb, x + 6, yb - 7, U('#1a1a1a'));
    return { bush };
  }
  /** Subestación vallada: losa de grava, dos transformadores, pórtico de barras con aisladores y caseta */
  function substation(pb, x, yb, w, o = {}) {
    const Gv = P32(R.GRAV), out = { leds: [], lamps: [], bus: [] }, d = 10, sd = o.seed || 19;
    for (let r = 0; r < d; r++) { const off = Math.round(r * SK); for (let xx = x - 2 + off; xx < x + w + off; xx++) put(pb, xx, yb - r, Gv[clamp(4 + (hash2(xx, r, sd) < 0.25 ? 1 : 0) - (hash2(xx >> 1, r, sd + 1) < 0.15 ? 2 : 0) + (r === d - 1 ? 2 : 0), 0, 7)]); }
    for (let xx = x - 2; xx < x + w; xx++) put(pb, xx, yb + 1, Gv[1]);
    const px0 = x + 9, px1 = x + w - 3, ph = o.h || 34, ytop = yb - 6 - ph;
    for (const px of [px0, px1]) for (let yy = ytop; yy < yb - 5; yy++) { put(pb, px, yy, U('#8a94a6')); put(pb, px + 3, yy, U('#4a5468')); if ((yy - ytop) % 4 === 0) { put(pb, px + 1, yy, U('#b8c2d0')); put(pb, px + 2, yy, U('#6a7488')); } else if ((yy - ytop) % 4 === 2) put(pb, px + 1 + ((yy >> 2) % 2), yy, U('#7a8498')); }
    for (let xx = px0; xx <= px1 + 3; xx++) { put(pb, xx, ytop, U('#c8d0dc')); put(pb, xx, ytop + 1, U('#5a6478')); if ((xx - px0) % 4 === 0) put(pb, xx, ytop + 2, U('#7a8498')); }
    for (let k = 0; k < 3; k++) { const ix = px0 + 7 + k * Math.round((px1 - px0 - 8) / 2); for (let q = 0; q < 5; q++) put(pb, ix, ytop + 2 + q, U(q % 2 ? '#6a3420' : '#a0583a')); out.bus.push([ix, ytop + 7]); }
    const t1 = transformer(pb, x + 2, yb - 3, { w: 20, h: 13, d: 8 });
    const t2 = transformer(pb, x + w - 24, yb - 3, { w: 18, h: 12, d: 8 });
    const cat = (a, b, sag) => { for (let s = 0; s <= 1; s += 0.02) put(pb, Math.round(lerp(a[0], b[0], s)), Math.round(lerp(a[1], b[1], s) + Math.sin(s * Math.PI) * sag), U('#2a2a34')); };
    for (let k = 0; k < 3; k++) { cat(out.bus[k], t1.bush[k], 2); cat(out.bus[k], t2.bush[Math.min(2, k)], 2); }
    const kx = x + Math.round(w * 0.42);
    I.box3q(pb, kx, yb - 2, 12, 12, 6, { ramp: R.WHITE, skew: SK, ink: '#1a1226' });
    door(pb, kx + 2, yb - 3, 5, 9, { col: R.SLATE, canopy: false });
    rect(pb, kx + 8, yb - 12, 3, 3, U('#c8d0dc'));
    out.leds.push({ x: kx + 9, y: yb - 7, col: '#8ff5c8', hz: 1.2 }, { x: kx + 10, y: yb - 7, col: '#ffd23a', hz: 0.7, ph: 0.3 });
    out.lamps.push([kx + 6, yb - 15]);
    for (let xx = x - 3; xx < x + w + 2; xx++) { if ((xx - x) % 7 === 0) for (let q = 0; q < 12; q++) put(pb, xx, yb + 1 - q, U(q === 11 ? '#e8ecf2' : '#7a8496')); else { for (const q of [4, 8]) { const c = get(pb, xx, yb + 1 - q); put(pb, xx, yb + 1 - q, c >>> 24 ? K.mixU(c, U('#aab4c4'), 0.6) : U('#aab4c4')); } if (xx % 2) put(pb, xx, yb - 10, U('#8a94a6')); } }
    out.inY = yb - 3; out.inX = x;
    return out;
  }
  /** Cable amarillo de evacuación por tramos con abrazaderas; o.tray = bandeja de rejilla */
  function cable(pb, pts, o = {}) {
    const Y = P32(R.YEL);
    for (let i = 0; i + 1 < pts.length; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.max(1, Math.abs(x1 - x0), Math.abs(y1 - y0)), vert = Math.abs(x1 - x0) < Math.abs(y1 - y0);
      for (let s = 0; s <= n; s++) {
        const xx = Math.round(lerp(x0, x1, s / n)), yy = Math.round(lerp(y0, y1, s / n));
        if (o.tray) { if (vert) { put(pb, xx - 2, yy, U('#4a5468')); put(pb, xx + 2, yy, U('#2a3040')); } else { put(pb, xx, yy + 2, U('#4a5468')); put(pb, xx, yy - 2, U('#8a94a6')); } }
        if (vert) { put(pb, xx - 1, yy, Y[5]); put(pb, xx, yy, Y[4]); put(pb, xx + 1, yy, Y[2]); }
        else { put(pb, xx, yy - 1, Y[6]); put(pb, xx, yy, Y[4]); put(pb, xx, yy + 1, Y[2]); }
        if (o.clamp !== false && s % (o.step || 10) === 5) { if (vert) { put(pb, xx - 2, yy, U('#c8d0dc')); put(pb, xx + 2, yy, U('#5a6478')); } else { put(pb, xx, yy - 2, U('#c8d0dc')); put(pb, xx, yy + 2, U('#5a6478')); } }
      }
    }
  }
  /** Pala de repuesto sobre cunas (perfil ahusado, raíz con brida, punta roja) */
  function blade(pb, x, yb, L = 70) {
    const T = P32(PFAWind.TW);
    shadowR(pb, x, yb, L, 3, 6, -0.25);
    for (let xx = 0; xx < L; xx++) { const u = xx / L, th = Math.max(1, Math.round(u < 0.08 ? 6 : 6 - (u - 0.08) * 5.5)); for (let q = 0; q < th; q++) put(pb, x + xx, yb - 7 - q, T[clamp(q === th - 1 ? 7 : q === 0 ? 2 : 5 - (q > th * 0.6 ? 1 : 0), 0, 7)]); if (u > 0.93) put(pb, x + xx, yb - 7, U('#e83b41')); }
    for (let q = 0; q < 7; q++) put(pb, x, yb - 6 - q, T[1]);
    for (const cx of [x + 6, x + Math.round(L * 0.62)]) { rect(pb, cx, yb - 6, 5, 6, U('#5a3a22')); for (let q = 0; q < 5; q++) put(pb, cx + q, yb - 6, U('#9a6a44')); put(pb, cx + 4, yb - 3, U('#2a1a10')); }
  }
  /** Grúa sobre orugas con pluma de celosía (ángulo en radianes desde la horizontal) */
  function crane(pb, x, yb, o = {}) {
    const Y = P32(R.YEL), boom = o.boom || 80, ang = o.ang ?? 1.1;
    shadowR(pb, x, yb, 30, 8, 14, -0.3);
    for (let xx = x; xx < x + 30; xx++) for (let q = 0; q < 5; q++) put(pb, xx, yb - q, U(q === 4 ? '#5a5a66' : (xx + q) % 3 === 0 ? '#1a1a22' : '#2e2e3a'));
    I.box3q(pb, x + 4, yb - 5, 20, 10, 6, { ramp: R.YEL, skew: SK, ink: '#2a1a04' });
    rect(pb, x + 16, yb - 14, 6, 6, U('#86c8ee')); put(pb, x + 16, yb - 14, U('#ecfaff'));
    const bx = x + 12, by = yb - 12, ex = bx + Math.round(Math.cos(ang) * boom), ey = by - Math.round(Math.sin(ang) * boom);
    for (let s = 0; s <= boom; s++) { const u = s / boom, xx = Math.round(lerp(bx, ex, u)), yy = Math.round(lerp(by, ey, u)); put(pb, xx, yy, Y[5]); put(pb, xx + 2, yy + 1, Y[3]); if (s % 4 === 0) { put(pb, xx + 1, yy, Y[4]); put(pb, xx + 1, yy + 1, Y[2]); } }
    const hk = o.hook || 30;
    for (let yy = ey; yy < ey + hk; yy++) put(pb, ex + 1, yy, U('#2a2a34'));
    rect(pb, ex, ey + hk, 3, 3, U('#f0bc2c'));
    for (let s = 0; s < 18; s++) put(pb, bx - 4 + Math.round(s * 0.2), by - 2 - s, U('#2a2a34'));
    return { tip: [ex, ey] };
  }
  /** Nido de gaviota en repisa: ramitas y huevos o un pollo */
  function nest(pb, x, y, seed = 1) {
    const r = RNG(seed);
    for (let q = -4; q <= 4; q++) { put(pb, x + q, y, U(q % 2 ? '#7a5a30' : '#a07a44')); if (Math.abs(q) < 4) put(pb, x + q, y - 1, U(r() < 0.5 ? '#c8a060' : '#8a6a3a')); }
    if (r() < 0.5) { put(pb, x - 1, y - 2, U('#e8e0c8')); put(pb, x + 1, y - 2, U('#d8d0b0')); put(pb, x + 1, y - 3, U('#8a8070')); }
    else { for (let q = -1; q <= 1; q++) put(pb, x + q, y - 2, U('#cfcfd8')); put(pb, x, y - 3, U('#e8e8f0')); put(pb, x + 1, y - 3, U('#ffb020')); }
  }
  return { R, rect, darken, shadowR, terrace, win, door, vines, flat, garden, gable, hangar, insulator, transformer, substation, cable, blade, crane, nest };
})();

/* =====================================================================
   r4-l5 (ronda 4) — DIORAMA DEL ACANTILADO bajo el paso del Nivel 5.
   Sustituye el muro continuo por un corte esculpido en 3/4, como los
   acantilados de la referencia:
     · muro del fondo en macizos columnares (facetas a la luz / en sombra,
       muescas, repisas y voladizos, cuevas y cuevas marinas al pie);
     · cabos y contrafuertes escalonados (capas z1–z3) que bajan en diagonal
       hacia la izquierda: cabezas de columna al sol en 3/4, caras
       frontales de bloques biselados y sombra arrojada granate sobre lo
       que queda detrás (marcha hacia la luz en el campo de alturas);
     · calas con el mar al pie: espuma pegada a la roca, turquesa →
       azul con rizos, reflejo roto del acantilado, sombra de los cabos;
       farallones, playa de cantos, embarcadero y caseta de amarre.
   Luz arriba-izquierda (Lambert), oclusión por cavidad, rampa de 17 tonos
   con desvío a granate en sombra. Sin tramado (ruido en clusters).
   Cara registrada en PFTerrain: face:'r4l5cliff' con s.r4 = {coves:[[x0,x1,
   wy,kind]], paths, conduit, jetty, birds}. kind: 'beach'|'cave'|'stack'|
   'landing'|'jetty'|'birds'.
   API (R4L5_CLIFF): face(s,x,y,gy,world) · post(pb,world,s) · info[seed]
     → {x,y,frames,spray,birds} (espuma animada y rocío para el nivel) ·
     tabaiba(pb,x,y,s,seed) · cardon(pb,x,y,h,seed) · hanger(pb,x,y,L,seed,flor)
     · trail(pb,pts,seed) · boat(pb,x,y,w,seed,o) · fgFrame(o) (oclusor f 1,3)
   ===================================================================== */
const R4L5_CLIFF = (() => {
  const K = PFK, put = K.put, get = K.get, P32 = K.P32;
  const NONE = -999, ZH = 30;
  const LV = (() => { const v = [-0.42, -0.84, 0.36], m = Math.hypot(v[0], v[1], v[2]); return v.map(a => a / m); })();
  const LXY = Math.hypot(LV[0], LV[1]), SDX = LV[0] / LXY, SDY = LV[1] / LXY, SLOPE = LV[2] / LXY;
  /** Mar de las calas: navy profundo → azul → turquesa → cian → espuma */
  const WAT = ['#04234a', '#05467e', '#0a5f9e', '#0a74bc', '#0692d5', '#0aa6dc', '#11bedd', '#3adcf1', '#7cdfec', '#c8f4fa', '#ffffff'];
  const SANDR = ['#5a3418', '#86502d', '#b07440', '#cf9658', '#e8b878', '#f6d49a', '#fde9bd'];
  const info = {};
  const _r17 = new Map();
  function ramp17(ramp) {
    let o = _r17.get(ramp); if (o) return o;
    const P = P32(ramp), n = P.length, N = 17, lit = new Uint32Array(N), sh = new Uint32Array(N), V = U('#3a0a12');
    for (let i = 0; i < N; i++) {
      const a = i / (N - 1) * (n - 1), i0 = Math.floor(a), i1 = Math.min(n - 1, i0 + 1);
      lit[i] = K.mixU(P[i0], P[i1], a - i0);
      sh[i] = K.mixU(lit[i], V, 0.2 + 0.28 * (1 - i / (N - 1)));
    }
    o = { lit, sh }; _r17.set(ramp, o); return o;
  }
  /** Columnas de un macizo: ancho, perfil, biseles y roturas de bloque inclinadas */
  function mkCols(r, xa, xb, cMin, cMax, o = {}) {
    const C = [];
    for (let x = xa; x < xb;) {
      let cw = r.int(cMin, cMax); if (xb - (x + cw) < cMin) cw = xb - x;
      const br = []; let d = r.int(o.b0 ?? 8, o.b1 ?? 24), acc = 0;
      while (d < 190) { acc += r() < 0.22 ? -(1 + r() * 2.2) : 0.3 + r() * 1.9; br.push({ d, tilt: (r() - 0.5) * 0.55, off: acc, bt: r.int(2, 5), joint: r() < 0.8, jw: r() < 0.4 ? 2 : 1, rc: r.int(2, 5) }); d += r.int(o.s0 ?? 11, o.s1 ?? 28); }
      C.push({ x0: x, x1: x + cw, pro: (r() - 0.5) * 3.6, bl: r.int(2, 4), brw: r.int(1, 3), sd: r.int(1, 1e6), br, fused: r() < 0.26, off0: (r() - 0.5) * 2, hang: r() < 0.22, top: 0, hh: 0, tilt: 0 });
      x += cw;
    }
    return C;
  }

  /* ---------- composición: calas, cabos escalonados, contrafuertes, farallones, macizos del muro ---------- */
  function layout(s, gyAt) {
    const r = RNG((s.seed | 0) * 7919 + 131), o = s.r4 || {};
    const x0 = s.x0, x1 = s.x1, eL = s.edgeL ?? null, eR = s.edgeR ?? null;
    const lo = eL != null ? eL + 6 : x0, hi = eR != null ? eR - 6 : x1;
    const coves = (o.coves || []).map(([a, b, wy, kind]) => ({ x0: a, x1: b, wy: wy ?? 356, kind: kind || null })).sort((p, q) => p.x0 - q.x0);
    const footBase = o.foot ?? 394;
    // pie del muro: alto en el fondo de las calas (más lejos), bajo detrás de los cabos (≈ mar de las gargantas)
    const Wy = new Int16Array(x1 - x0 + 9);
    for (let x = x0 - 4; x <= x1 + 4; x++) {
      let f = footBase;
      for (const c of coves) { const e = Math.min(x - c.x0, c.x1 - x); if (e > -16) f = Math.min(f, Math.round(lerp(footBase, c.wy, clamp((e + 16) / 26, 0, 1)))); }
      Wy[x - x0 + 4] = f + Math.round((vnoise(x * 0.09, 0.5, s.seed | 0) - 0.5) * 4);
    }
    const tiers = [];
    const tier = (xa, xb, top, z, foot, o2 = {}) => {
      xa = Math.max(xa, lo); xb = Math.min(xb, hi); if (xb - xa < 10) return null;
      top = Math.min(top, foot - 18);
      const T = { id: tiers.length, x0: xa, x1: xb, yT: top, z, foot, tL: o2.tL ?? 0.08 + r() * 0.16, tR: o2.tR ?? 0.05 + r() * 0.12, ridge: xa + (xb - xa) * (0.25 + r() * 0.5), kL: 0.03 + r() * 0.07, kR: 0.06 + r() * 0.1, alb: 0.16 + z * 0.04 + (r() - 0.5) * 0.08, pro: 0, cave: null, stack: !!o2.stack, sd: r.int(1, 1e6) };
      T.cols = mkCols(r, xa, xb, o2.cMin ?? 8, o2.cMax ?? 20, { b0: 5, b1: 14, s0: 9, s1: 22 });
      // cabezas en 3/4: plano superior hondo (el cabo se adelanta), hombros redondeados en los extremos
      for (const c of T.cols) { const e = Math.min(c.x0 - xa, xb - c.x1); c.top = top + r.int(-2, 2) + (e < 5 ? r.int(2, 6) : 0); c.hh = o2.stack ? 5 + r.int(0, 2) : 7 + Math.min(z, 3) * 2 + r.int(0, 3) - (e < 5 ? 2 : 0); c.tilt = (r() - 0.5) * 0.12; }
      if (!o2.stack && r() < 0.45 && xb - xa > 36) T.cave = { cx: xa + (xb - xa) * (0.3 + r() * 0.4), cy: top + 18 + r.int(0, 20), rx: r.int(6, 12), ry: r.int(5, 10), dep: 9 + r() * 6 };
      tiers.push(T); return T;
    };
    // tramos de tierra entre calas → cabos escalonados y contrafuertes
    const land = []; let a = lo;
    for (const c of coves) { if (c.x0 - a > 14) land.push([a, c.x0]); a = Math.max(a, c.x1); }
    if (hi - a > 14) land.push([a, hi]);
    for (const [la, lb] of land) {
      let x = la + r.int(0, 6);
      while (x < lb - 12) {
        let gw = Math.min(lb - x, r.int(o.wMin ?? 52, o.wMax ?? 180)); if (lb - (x + gw) < 30) gw = lb - x;
        const xa = x, xb = x + gw, g0 = gyAt((xa + xb) >> 1), cw = r.pick([[7, 13], [10, 20], [14, 26], [18, 32]]);
        if (gw < 58 && r() < 0.65) tier(xa + 1, xb - 1, g0 + r.int(5, 14), 1, footBase + r.int(4, 10), { cMin: 8, cMax: 15 });
        else {
          const n = gw > 100 ? r.int(2, 3) : r.int(1, 2), down = r() < 0.72 ? -1 : 1;
          let ta = xa + r.int(0, 6), tb = xb - r.int(0, 6), top = g0 + r.pick([r.int(12, 24), r.int(22, 40), r.int(36, 58)]);
          for (let k = 0; k < n; k++) {
            tier(ta, tb, top, k + 1, footBase + 4 + k * 3 + r.int(0, 4), { cMin: cw[0], cMax: cw[1] });
            const w2 = Math.round((tb - ta) * (0.44 + r() * 0.26));
            if (down < 0) { ta -= r.int(2, 14); tb = ta + w2; } else { tb += r.int(2, 14); ta = tb - w2; }
            top += r.int(16, 30);
          }
        }
        x = xb + r.int(6, 26);
      }
    }
    // farallones en las calas
    for (const c of coves) if (c.kind === 'stack') { const cx = Math.round((c.x0 + c.x1) / 2 + (r() - 0.5) * (c.x1 - c.x0) * 0.3), ww = r.int(12, 22); tier(cx - (ww >> 1), cx + (ww >> 1), c.wy - r.int(16, 30), 3, c.wy + r.int(24, 34), { stack: true, cMin: 5, cMax: 9, tL: 0.1, tR: 0.08 }); }
    tiers.sort((p, q) => p.z - q.z || p.x0 - q.x0);
    // macizos del muro (todas las columnas en una sola lista: sin huecos entre macizos)
    const ms = [], wcols = [];
    for (let x = x0 - 4 - r.int(0, 20); x < x1 + 4;) {
      const mw = r.int(50, 150), m = { i: ms.length, x0: x, x1: x + mw, ridge: x + mw * (0.25 + r() * 0.5), kL: 0.04 + r() * 0.1, kR: 0.1 + r() * 0.22, alb: -0.12 + (r() - 0.5) * 0.12, pro: r() * 5, gw: r.int(2, 5), band: null, cave: null, c0: wcols.length };
      if (r() < 0.5) m.band = { d: r.int(14, 44), kind: r() < 0.55 ? 1 : -1, amt: r.int(4, 8), xa: x + r.int(0, mw >> 2), xb: x + mw - r.int(0, mw >> 2) };
      if (r() < 0.3) m.cave = { cx: x + mw * (0.25 + r() * 0.5), cy: gyAt(x + (mw >> 1)) + r.int(22, 54), rx: r.int(5, 9), ry: r.int(4, 7), dep: 9 + r() * 5 };
      for (const c of mkCols(r, x, x + mw, 12, 28)) { c.m = m; wcols.push(c); }
      m.c1 = wcols.length; ms.push(m); x += mw;
    }
    // cuevas marinas al pie del muro en las calas
    for (const c of coves) if (c.kind === 'cave' || (c.kind === 'birds' && r() < 0.6)) {
      const cx = c.x0 + (c.x1 - c.x0) * (0.3 + r() * 0.4), m = ms.find(mm => cx >= mm.x0 && cx < mm.x1);
      if (m) m.cave = { cx, cy: c.wy + 2, rx: r.int(11, 17), ry: r.int(20, 28), dep: 16, sea: true };
    }
    return { coves, tiers, ms, wcols, Wy, footBase, lo, hi };
  }

  /* ---------- horneado del tramo ---------- */
  function build(s, world) {
    const t0 = nowMs();
    const G = world.ground, HH = world.h;
    const gyAt = (x) => G[clamp(Math.round(x), 0, world.w)];
    const L_ = layout(s, gyAt);
    const bx0 = s.x0 - 4, w = s.x1 - s.x0 + 8;
    let gmin = 1e9; for (let x = bx0; x < bx0 + w; x++) gmin = Math.min(gmin, gyAt(x));
    const by0 = gmin, h = HH - by0, N = w * h;
    const H = new Float32Array(N).fill(NONE), A = new Float32Array(N), F = new Uint8Array(N), Zb = new Int8Array(N).fill(-1), FD = new Uint8Array(N);
    const sd = ((s.seed | 0) * 131 + 29) & 0xffff;
    const gyA = new Int16Array(w); for (let i = 0; i < w; i++) gyA[i] = gyAt(bx0 + i);
    const WyAt = (x) => L_.Wy[clamp(x - s.x0 + 4, 0, L_.Wy.length - 1)];
    const clip = (x, d) => (s.edgeR != null && x >= s.edgeR - Math.round(Math.min(d * 0.2, 3 + vnoise(d * 0.06, 1, sd) * 7))) || (s.edgeL != null && x < s.edgeL + Math.round(Math.min(d * 0.16, 2 + vnoise(d * 0.06, 2, sd) * 6)));
    function paint(M, isWall) {
      const C = M.cols, nC = C.length, E = new Int32Array(nC + 1);
      let yA = by0, yB = by0 + h;
      if (!isWall) { yA = Math.max(by0, Math.min(...C.map(c => c.top)) - 2); yB = Math.min(by0 + h, M.foot + 4); }
      for (let y = yA; y < yB; y++) {
        for (let j = 0; j < nC; j++) E[j] = C[j].x0 + Math.round((vnoise(y * 0.06, (C[j].sd & 1023) * 0.37, 3) - 0.5) * 4.4);
        E[nC] = C[nC - 1].x1;
        if (!isWall) {
          const dy = Math.max(0, y - M.yT);
          E[0] = C[0].x0 + Math.round((vnoise(y * 0.08, M.sd & 1023, 4) - 0.5) * 3 - dy * M.tL);
          E[nC] = C[nC - 1].x1 + Math.round((vnoise(y * 0.08, (M.sd & 1023) + 5.5, 4) - 0.5) * 3 + dy * M.tR);
        }
        for (let j = 1; j <= nC; j++) if (E[j] < E[j - 1] + 3) E[j] = E[j - 1] + 3;
        const row = (y - by0) * w;
        for (let j = 0; j < nC; j++) {
          const c = C[j], Lx = E[j], Rx = E[j + 1], m = isWall ? c.m : M;
          const xs = Math.max(Lx, bx0), xe = Math.min(Rx, bx0 + w);
          for (let x = xs; x < xe; x++) {
            const xi = x - bx0, gy = gyA[xi];
            let top, foot;
            if (isWall) { top = gy; foot = WyAt(x); }
            else { top = Math.max(gy + 3, c.top + Math.round(c.tilt * (x - (c.x0 + c.x1) * 0.5))); foot = M.foot + Math.round((vnoise(x * 0.12, M.sd & 1023, 6) - 0.5) * 4); }
            const d = y - top; if (d < 0 || y >= foot) continue;
            if (clip(x, y - gy)) continue;
            const dl = x - Lx, dr = Rx - 1 - x, u = clamp(dl / Math.max(3, Rx - Lx - 1), 0, 1);
            let hg = M.z * ZH + c.pro + (isWall ? m.pro : 0), alb = 1 + (hash1(c.sd, 5) - 0.5) * 0.1 + m.alb, fl = 0;
            { const rx = x - m.ridge; hg -= rx < 0 ? -rx * m.kL : rx * m.kR; }
            if (!isWall && d < c.hh) { fl = d === c.hh - 1 ? 6 : d === 0 ? 7 : 2; hg += 0.6; alb = d / Math.max(1, c.hh - 1); }
            else {
              const dd = isWall ? d : d - c.hh, cap = isWall ? 4 : 2;
              // columna cilíndrica: el flanco izquierdo mira a la luz, el derecho se hunde en sombra
              { const cw = Math.max(4, Rx - Lx); hg -= 0.7 * cw * (u - 0.35) * (u - 0.35); }
              if (dd < cap) { const q = cap - dd; hg -= q * q * (isWall ? 0.5 : 0.6); if (isWall && d === 0) fl = 4; }
              if (isWall && j === m.c0 && dl < m.gw) { hg -= 9 - dl * 1.8; fl = 1; }
              else {
                const cm = (Lx + Rx) * 0.5, B = c.br;
                let bi = -1, btop = 0, bbot = 1e9;
                for (let k = 0; k < B.length; k++) { const bd = B[k].d + Math.round(B[k].tilt * (x - cm) + (vnoise(x * 0.21, k * 3.1, sd + 40) - 0.5) * 4); if (bd <= dd) { bi = k; btop = bd; } else { bbot = bd; break; } }
                const b = bi >= 0 ? B[bi] : null, nb = B[bi + 1];
                hg += b ? b.off : c.off0;
                const dt = dd - btop, db = bbot - 1 - dd;
                const wob = (vnoise(y * 0.23, x * 0.05, sd + 41) - 0.5) * 3, el = dl + Math.round(wob), er = dr - Math.round(wob * 0.7);
                const nc = C[j + 1], fusedL = c.fused && j > 0 && !(isWall && j === m.c0), fusedR = nc && nc.fused && !(isWall && nc.m !== m);
                const exL = fusedL ? 99 : el, exR = fusedR ? 99 : er + 1;
                const eyT = b && b.joint ? dt - b.jw + 1 : dt + 99, eyB = nb && nb.joint ? db + 1 : db + 99;
                const ex = Math.min(exL, exR), ey = Math.min(eyT, eyB), rc = b ? b.rc : 3;
                const e = (ex < rc && ey < rc) ? rc - Math.hypot(rc - ex, rc - ey) : Math.min(ex, ey);
                if (e <= (isWall ? 1.1 : 0.9)) { hg -= 5.5; fl = 1; }
                else {
                  const bh = Math.max(6, bbot - btop);
                  const Rt = Math.min(bh * (0.2 + (b ? b.bt : 3) * 0.06), 13) * (1.25 - u * 0.6) + 1.5, Rb = 1.8, Rl = c.bl + 1, Rr = c.brw + 1;
                  const tp = ey <= ex, Rad = tp ? (eyT <= eyB ? Rt : Rb) : (exL <= exR ? Rl : Rr);
                  if (e < Rad) { const q = Rad - e; hg -= q * q / Rad * (tp && eyT <= eyB ? 1.15 : tp ? 1.6 : (exL <= exR ? 1.4 : 1.25)); }
                }
              }
              hg += (vnoise(x * 0.16, y * 0.11, sd + 7) - 0.5) * 2.2;
              alb += (hash1(Math.floor((d + (vnoise(x * 0.012, 3.3, sd) - 0.5) * 22) / 21), sd + 5) - 0.5) * 0.1;
              if (isWall && m.band && x >= m.band.xa && x < m.band.xb) {
                const T = m.band, td = T.d + Math.round((vnoise(x * 0.06, m.i + 0.5, 11) - 0.5) * 5);
                if (T.kind > 0) { if (d >= td + 4) hg += T.amt; else if (d >= td) hg += T.amt * (d - td + 1) / 5; }
                else { if (d < td - 1) hg += T.amt; else if (d < td + 1) hg += T.amt * (td + 1 - d) / 3; }
              }
              const cv = m.cave;
              if (cv) {
                const ex2 = (x - cv.cx) / cv.rx, ey2 = (y - cv.cy) / cv.ry, nz = (vnoise(x * 0.2, y * 0.2, sd + 50) - 0.5) * 0.5;
                const rr = cv.sea ? (y >= cv.cy - 2 ? ex2 * ex2 + nz : ex2 * ex2 + ey2 * ey2 + nz) : ex2 * ex2 + ey2 * ey2 + nz;
                if (rr < 1) { hg -= cv.dep * Math.sqrt(1 - rr); alb -= 0.08; if (rr < 0.72) fl = 3; }
              }
              if (foot - y < 4 && fl !== 3) { alb -= 0.1; if (fl === 0) fl = 5; }
            }
            const i = row + xi; H[i] = hg; A[i] = alb; F[i] = fl; Zb[i] = M.z; FD[i] = Math.min(255, foot - y);
          }
        }
      }
    }
    paint({ z: 0, cols: L_.wcols }, true);
    // playa de cantos al fondo de las calas 'beach' (capa 0, plana)
    for (const c of L_.coves) if (c.kind === 'beach') for (let x = c.x0 + 4; x < c.x1 - 4; x++) {
      const f = WyAt(x), bh = Math.round(7 + Math.sin(clamp((x - c.x0) / (c.x1 - c.x0), 0, 1) * Math.PI) * 6 + (vnoise(x * 0.1, 3, sd) - 0.5) * 3);
      for (let y = f; y < f + bh && y < by0 + h; y++) { const i = (y - by0) * w + (x - bx0); H[i] = 0.5; A[i] = 1; F[i] = 9; Zb[i] = 0; FD[i] = f + bh - y; }
    }
    for (const T of L_.tiers) paint(T, false);
    // mar: desde el último sólido de cada columna hasta abajo
    for (let xi = 0; xi < w; xi++) {
      const x = xi + bx0, gy = gyA[xi];
      for (let y = by0 + h - 1; y > gy + 8; y--) { const i = (y - by0) * w + xi; if (Zb[i] !== -1) break; if (clip(x, y - gy)) break; Zb[i] = -2; H[i] = -0.6; F[i] = 8; }
    }
    // cavidad (imagen integral de H sobre los sólidos)
    const SW = w + 1, S = new Float64Array(SW * (h + 1)), Cn = new Uint32Array(SW * (h + 1));
    for (let y = 0; y < h; y++) { let rs = 0, rc = 0; for (let x = 0; x < w; x++) { const v = H[y * w + x]; if (v > NONE) { rs += v; rc++; } S[(y + 1) * SW + x + 1] = S[y * SW + x + 1] + rs; Cn[(y + 1) * SW + x + 1] = Cn[y * SW + x + 1] + rc; } }
    // distancias del agua a la roca (vertical desde el sólido de arriba; horizontal ×1,6)
    const dist = new Uint16Array(N).fill(999), vd = new Uint16Array(N).fill(999);
    for (let x = 0; x < w; x++) { let last = -999; for (let y = 0; y < h; y++) { const i = y * w + x; if (Zb[i] >= 0) last = y; else if (Zb[i] === -2) { vd[i] = Math.min(999, y - last); dist[i] = vd[i]; } } }
    for (let y = 0; y < h; y++) {
      let last = -9999; for (let x = 0; x < w; x++) { const i = y * w + x; if (Zb[i] >= 0) last = x; else if (Zb[i] === -2) dist[i] = Math.min(dist[i], Math.round((x - last) * 1.6)); }
      last = 99999; for (let x = w - 1; x >= 0; x--) { const i = y * w + x; if (Zb[i] >= 0) last = x; else if (Zb[i] === -2) dist[i] = Math.min(dist[i], Math.round((last - x) * 1.6)); }
    }
    const RR = ramp17(s.ramp || RAMP.rockWarmR), W32 = P32(WAT), SA = P32(SANDR), buf = new Uint32Array(N);
    const LIP = U('#fde3a8'), WET = U('#2a1c18'), SEAB = U('#2a6a9a'), GUANO = U('#3a2a1c');
    for (let y = 0; y < h; y++) {
      const ya = Math.max(0, y - 4), yb = Math.min(h, y + 5);
      for (let x = 0; x < w; x++) {
        const i = y * w + x, z = Zb[i]; if (z === -1) continue;
        const h0 = H[i];
        let sh = 0;
        for (let k = 2; k <= 44; k += 2) {
          const sx = x + Math.round(SDX * k), sy = y + Math.round(SDY * k); if (sx < 0 || sy < 0 || sx >= w) break;
          const hs = H[sy * w + sx]; if (hs <= NONE || (z === -2 && Zb[sy * w + sx] < 1)) continue;
          const ex = hs - h0 - SLOPE * k; if (ex > 0) { sh = Math.max(sh, Math.min(1, ex / 1.6)); if (sh >= 1) break; }
        }
        if (z === -2) {
          // agua: espuma pegada a la roca, turquesa somero → azul; rizos; sombra de los cabos; reflejo roto del acantilado
          const dd = dist[i], X = x + bx0;
          let k = dd <= 1 ? 10 : dd <= 2 ? 9 : dd <= 4 ? 8 : dd <= 7 ? 7 : dd <= 11 ? 6 : dd <= 17 ? 5 : dd <= 26 ? 4 : dd <= 38 ? 3 : 2;
          if (dd <= 3 && vnoise(X * 0.45, y * 0.6, sd + 60) < 0.4) k = 8;
          const rp = vnoise(X * 0.11, y * 0.9, sd + 61);
          if (dd > 3 && rp > 0.68) k += 1; else if (dd > 6 && rp < 0.2) k -= 1;
          k -= Math.round(sh * 2.4);
          let u = W32[clamp(k, 0, 10)];
          const q = vd[i];
          if (q > 1 && q < 12 && ((y + (X >> 3)) % 3) !== 0) { const sy = y - 2 * q + 1; if (sy >= 0) { const src = buf[sy * w + x]; if (src && Zb[sy * w + x] >= 0) u = K.mixU(u, src, 0.34 * (1 - q / 12)); } }
          buf[i] = u; continue;
        }
        const hl = x > 0 && Zb[i - 1] === z ? H[i - 1] : h0, hr = x < w - 1 && Zb[i + 1] === z ? H[i + 1] : h0;
        const hu = y > 0 && Zb[i - w] === z ? H[i - w] : h0, hd = y < h - 1 && Zb[i + w] === z ? H[i + w] : h0;
        const nx = clamp((hl - hr) * 0.5, -2.6, 2.6), ny = clamp((hu - hd) * 0.5, -2.6, 2.6);
        let lam = (nx * LV[0] + ny * LV[1] + LV[2]) / Math.sqrt(nx * nx + ny * ny + 1); if (lam < 0) lam = 0;
        const xa = Math.max(0, x - 4), xb = Math.min(w, x + 5);
        const cnt = Cn[yb * SW + xb] - Cn[ya * SW + xb] - Cn[yb * SW + xa] + Cn[ya * SW + xa];
        const mean = cnt ? (S[yb * SW + xb] - S[ya * SW + xb] - S[yb * SW + xa] + S[ya * SW + xa]) / cnt : h0;
        const ao = Math.min(0.22, Math.max(0, mean - h0) * 0.03);
        const fl = F[i], d = y + by0 - gyA[x];
        if (fl === 9) { // playa: cantos y arena húmeda hacia el agua
          let kk = 4 - (FD[i] < 3 ? 2 : 0) + Math.round((K.cl(x, y, 2, sd + 80) - 0.5) * 2) - Math.round(sh * 2);
          if (hash2(x >> 1, y >> 1, sd + 81) < 0.18) kk += 2;
          buf[i] = SA[clamp(kk, 0, 6)]; continue;
        }
        let t;
        if (fl === 2 || fl === 6 || fl === 7) t = (fl === 6 ? 1 : fl === 7 ? 0.52 : 0.72 + A[i] * 0.2 + (K.cl(x, y, 2, sd + 9) - 0.5) * 0.12) * (1 - 0.6 * sh) - ao * 0.5;
        else t = Math.min(1, A[i] * (0.22 + 1.5 * lam * (1 - 0.82 * sh))) - ao - clamp((d - 70) / 240, 0, 0.1);
        t += (hash2((x + bx0) >> 1, y >> 1, sd + 31) - 0.5) * 0.045;
        if (fl === 1) t = Math.min(t, 0.2); else if (fl === 3) t = Math.min(t, 0.07 + lam * 0.08);
        const k = clamp(Math.round(t * 16), 1, 16);
        const cool = clamp(sh * 0.95 + (lam < 0.3 ? (0.3 - lam) * 1.8 : 0) + (fl === 1 ? 0.5 : fl === 3 ? 0.9 : 0), 0, 1);
        let u = cool > 0.04 ? K.mixU(RR.lit[k], RR.sh[k], cool) : RR.lit[k];
        if (z === 0 && fl !== 4) u = K.mixU(u, RR.sh[Math.max(1, k - 2)], 0.35);
        if (fl === 4 && k > 10) u = K.mixU(u, LIP, 0.6);
        else if (fl === 6 && sh < 0.5) u = K.mixU(u, LIP, 0.5);
        else if (fl === 5) u = K.mixU(u, (FD[i] & 1) ? WET : GUANO, 0.5);
        if (FD[i] < 20 && fl !== 6 && fl !== 7 && fl !== 2) u = K.mixU(u, SEAB, 0.16 * (1 - FD[i] / 20) * (0.4 + cool));
        buf[i] = u;
      }
    }
    // espuma animada: 4 cuadros de lamida que avanza y retrocede (solo filas con agua)
    let wy0 = h, wy1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (Zb[y * w + x] === -2) { if (y < wy0) wy0 = y; wy1 = y; break; }
    const frames = [], spray = [], FO = [U('#ffffff'), U('#e6fbff'), U('#bff2fa')];
    if (wy1 >= wy0) {
      const fh = wy1 - wy0 + 1;
      for (let f = 0; f < 4; f++) {
        const pb = new PixelBuffer(w, fh);
        for (let y = wy0; y <= wy1; y++) for (let x = 0; x < w; x++) {
          const i = y * w + x; if (Zb[i] !== -2) continue;
          const dd = dist[i]; if (dd > 9) continue;
          const X = x + bx0, ph = X * 0.13 + vnoise(X * 0.04, y * 0.08, sd + 70) * 5 + f * Math.PI / 2;
          const reach = 1.2 + (Math.sin(ph) * 0.5 + 0.5) * 5;
          let c = 0;
          if (dd <= reach && dd > reach - 1.6) c = FO[dd < 3 ? 0 : 1];
          else if (dd < reach - 1.6 && vnoise(X * 0.5, y * 0.7 + f * 1.7, sd + 71) < 0.32) c = FO[2];
          if (c) pb.data[(y - wy0) * w + x] = (c & 0xffffff | ((dd < 3 ? 235 : 170) << 24)) >>> 0;
        }
        frames.push(pb.toCanvas());
      }
      for (const T of L_.tiers) { const fx = Math.round((T.x0 + T.x1) / 2); if (T.foot < by0 + h - 2) spray.push([fx, T.foot - 1, T.z]); if (T.x1 - T.x0 > 40) spray.push([T.x0 + 4, T.foot - 2, T.z]); }
    }
    info[s.seed | 0] = { x: bx0, y: by0 + wy0, frames, spray, birds: (s.r4 && s.r4.birds) || null, coves: L_.coves };
    const R = { bx0, by0, w, h, buf, Zb, F, FD, L: L_, gyA, sd, ms: 0 };
    R.ms = Math.round(nowMs() - t0);
    return R;
  }
  function face(s, x, y, gy, world) {
    let R = s._r4; if (!R) R = s._r4 = build(s, world);
    const xi = x - R.bx0, yi = y - R.by0; if (xi < 0 || xi >= R.w || yi < 0 || yi >= R.h) return 0;
    return R.buf[yi * R.w + xi];
  }

  /* ---------- flora de acantilado canaria ---------- */
  const TAB_ST = ['#2e2620', '#4a3e32', '#6e5e4a', '#94826a'], TAB_LF = ['#1e3a10', '#2e5a14', '#4a7e1c', '#6ea02a', '#9cc23c', '#c8e070'];
  /** Tabaiba dulce: cojín de tallos grises ramificados con rosetas verde lima en las puntas */
  function tabaiba(pb, x, y, s, seed) {
    const r = RNG(seed), ST = P32(TAB_ST), LF = P32(TAB_LF), tips = [];
    const grow = (px, py, a, len, dep) => {
      for (let k = 0; k < len; k++) { px += Math.cos(a); py += Math.sin(a); put(pb, Math.round(px), Math.round(py), ST[clamp(1 + (dep > 1 ? 0 : 1) + (Math.cos(a) < 0 ? 1 : 0), 0, 3)]); }
      if (dep > 0) { grow(px, py, a - 0.42 - r() * 0.3, len * 0.72, dep - 1); grow(px, py, a + 0.42 + r() * 0.3, len * 0.72, dep - 1); } else tips.push([px, py]);
    };
    const n = s > 11 ? 3 : 2;
    for (let i = 0; i < n; i++) grow(x + (i - (n - 1) / 2) * 2, y, -Math.PI / 2 + (i - (n - 1) / 2) * 0.55, s * 0.3, 2);
    tips.sort((p, q) => p[1] - q[1]);
    for (const [tx, ty] of tips) {
      for (let q = 0; q < 8; q++) { const a = q / 8 * TAU, rr = 1.5 + (q % 2) * 0.9; put(pb, Math.round(tx + Math.cos(a) * rr), Math.round(ty + Math.sin(a) * rr * 0.7), LF[clamp(3 + (Math.cos(a) < 0 ? 1 : -1) + (Math.sin(a) < 0 ? 1 : 0), 0, 5)]); }
      put(pb, Math.round(tx), Math.round(ty), LF[5]); put(pb, Math.round(tx) - 1, Math.round(ty), LF[4]);
    }
  }
  /** Cardón: candelabro de columnas verdes acanaladas con frutos rojos */
  function cardon(pb, x, y, hgt, seed) {
    const r = RNG(seed), C = P32(['#10220c', '#1a3612', '#2a5218', '#3e7024', '#5a9034', '#86b44e']), n = 3 + r.int(0, 2);
    for (let i = 0; i < n; i++) {
      const off = (i - (n - 1) / 2), cx = x + Math.round(off * 3.4), hh = Math.max(4, Math.round(hgt * (0.62 + r() * 0.38) * (1 - Math.abs(off) / n * 0.7)));
      for (let k = 0; k < hh; k++) { const yy = y - k, bend = k < 3 ? Math.round(-off * (3 - k) * 0.4) : 0; for (let q = 0; q < 3; q++) put(pb, cx + q + bend, yy, C[clamp((q === 0 ? 4 : q === 1 ? 3 : 1) + (k > hh - 2 ? 1 : 0), 0, 5)]); }
      put(pb, cx + 1, y - hh, C[5]); if (r() < 0.5) put(pb, cx + 1, y - hh - 1, U('#d8402a'));
    }
    for (let q = -n * 2; q <= n * 2; q++) put(pb, x + 1 + q, y + 1, C[0]);
  }
  /** Planta colgante (verode / corazoncillo) que cae de una repisa, con flores */
  function hanger(pb, x, y, L, seed, bloom) {
    const r = RNG(seed), V = P32(['#10260e', '#1c3c14', '#2c5a1c', '#468024', '#6ea436', '#9cc84a']);
    let xx = x;
    for (let k = 0; k < L; k++) {
      if (r() < 0.25) xx += r() < 0.5 ? -1 : 1;
      put(pb, xx, y + k, V[k % 3 === 0 ? 1 : 2]);
      if (k % 2 === 1) put(pb, xx + (k % 4 === 1 ? 1 : -1), y + k, V[3 + (k % 4 === 1 ? 1 : 0)]);
      if (bloom && r() < 0.2) put(pb, xx + (r() < 0.5 ? -1 : 1), y + k, U(bloom));
    }
    put(pb, xx, y + L, V[5]);
  }
  /** Mata baja de flores amarillas (verode) o rosadas */
  function bloomBush(pb, x, y, wd, seed, col) {
    PFFlora.cluster(pb, x, y - 3, wd * 0.5, 3.5, ['#0e2410', '#173a16', '#22521c', '#2f6a22', '#43842a', '#62a032', '#8cbc44'], seed, { density: 0.7, leaf: [2, 3] });
    const r = RNG(seed + 3); for (let k = 0; k < Math.round(wd * 0.6); k++) { const fx = Math.round(x + (r() - 0.5) * wd), fy = Math.round(y - 3 - r() * 4); put(pb, fx, fy, U(col)); if (r() < 0.4) put(pb, fx, fy - 1, U('#fff6c8')); }
  }
  const BLOOMS = ['#ffd84a', '#ffd84a', '#f47ab8', '#ffffff', '#ff9a3a', '#c89ae8'];
  /** Vegetación de una repisa o cabeza de cabo (cadena variada cada ~7 px) */
  function vegRun(pb, x0, x1, yAt, seed, ok, o = {}) {
    const r = RNG(seed);
    for (let x = x0 + r.int(1, 4); x < x1 - 2; x += o.gap ?? (5 + r.int(0, 6))) {
      const y = yAt(x); if (y == null || !ok(x, y)) continue;
      const k = r();
      if (k < 0.24) PFFlora.tuft(pb, x, y, 6 + r() * 5, 5 + r() * 5, x * 3 + y, RAMP.grassR, { wind: 0.6 });
      else if (k < 0.4) tabaiba(pb, x, y, 9 + r.int(0, 6), x + y * 7);
      else if (k < 0.52) PFFlora.agave(pb, x, y, 4 + r.int(0, 3), x + y, ['#0c2020', '#123230', '#1c4a40', '#2a6450', '#3e7e60', '#5a9a74', '#86bc94']);
      else if (k < 0.62) bloomBush(pb, x, y, 7 + r.int(0, 5), x * 5 + y, r.pick(BLOOMS));
      else if (k < 0.7 && !o.small) cardon(pb, x, y, 7 + r.int(0, 6), x + y * 3);
      else if (k < 0.82) PFFlora.flowerPatch(pb, x, y, 7, x + y);
      else PFAWind.thrift(pb, x, y + 1, x + y);
    }
  }

  /* ---------- sendas, escaleras, conducciones, embarcadero, barcas ---------- */
  const TRR = ['#3a1e14', '#6a3e28', '#9a6a44', '#c69a68', '#e4c290', '#f8e2b8'], WDR = ['#2a1608', '#4a2a12', '#6e421e', '#94602e', '#b88044', '#d4a060'];
  /** Sendero tallado: huella al sol, corte en sombra encima, canto y sombra debajo; peldaños con contrahuella donde baja
      fuerte; barandilla de postes y cuerda del lado del vacío. pts: [[x,y]..] */
  function trail(pb, pts, seed, o = {}) {
    const TR = P32(TRR), Wd = P32(WDR), SHD = U('#2e0e14'), tread = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [xa, ya] = pts[i], [xb, yb] = pts[i + 1], n = Math.max(1, Math.abs(xb - xa)), dir = Math.sign(xb - xa) || 1, steep = Math.abs(yb - ya) / n > 0.42;
      const sw = steep ? 4 : 1;
      for (let q = 0; q <= n; q++) { const x = xa + q * dir, qq = steep ? Math.min(n, Math.floor(q / sw) * sw) : q; tread.push([x, Math.round(lerp(ya, yb, qq / n))]); }
    }
    let py = null;
    for (const [x, y] of tread) {
      for (let k = 1; k <= 5; k++) { const c = get(pb, x, y - k); if (c >>> 24) put(pb, x, y - k, K.mixU(c, SHD, 0.42 * (1 - k / 6))); }
      if (py != null && y > py + 1) for (let yy = py + 1; yy < y; yy++) { put(pb, x, yy, TR[yy === y - 1 ? 2 : 1]); }
      put(pb, x, y, TR[5]); put(pb, x, y + 1, TR[4]); put(pb, x, y + 2, TR[2]); put(pb, x, y + 3, TR[0]);
      for (let k = 4; k < 7; k++) { const c = get(pb, x, y + k); if (c >>> 24) put(pb, x, y + k, K.mixU(c, SHD, 0.45 * (1 - (k - 4) / 3))); }
      py = y;
    }
    if (o.rail === false) return tread;
    let prev = null;
    for (let i = 0; i < tread.length; i += 9) {
      const [x, y] = tread[i];
      for (let k = 1; k < 7; k++) { put(pb, x, y - k + 1, Wd[k < 3 ? 2 : 4]); put(pb, x + 1, y - k + 1, Wd[1]); } put(pb, x, y - 6, Wd[5]);
      if (prev) { const [qx, qy] = prev; for (let xx = Math.min(qx, x); xx <= Math.max(qx, x); xx++) { const t = (xx - qx) / ((x - qx) || 1); put(pb, xx, Math.round(lerp(qy - 4, y - 4, t) + Math.sin(t * Math.PI) * 1.4), U('#e0c890')); } }
      prev = [x, y];
    }
    return tread;
  }
  /** Bandeja de cables en la pared: sombra arrojada, bandeja de acero, cable amarillo y ménsulas */
  function conduit(pb, pts) {
    const SHD = U('#2e0e14');
    for (let i = 0; i + 1 < pts.length; i++) {
      const [xa, ya] = pts[i], [xb, yb] = pts[i + 1], n = Math.max(1, Math.abs(xb - xa), Math.abs(yb - ya));
      for (let q = 0; q <= n; q++) { const x = Math.round(lerp(xa, xb, q / n)), y = Math.round(lerp(ya, yb, q / n)); for (let k = 1; k <= 3; k++) { const c = get(pb, x + k, y + k + 1); if (c >>> 24) put(pb, x + k, y + k + 1, K.mixU(c, SHD, 0.5 - k * 0.12)); } }
    }
    R3WINDSTORM.cable(pb, pts, { tray: true, step: 12 });
  }
  /** Barca de pesca: casco blanco con franja, cabina, regala; línea de flotación con espuma */
  function boat(pb, x, y, w, seed, o = {}) {
    const r = RNG(seed), stripe = o.stripe || r.pick(['#2a6ad0', '#c83a2a', '#18a088', '#f0bc2c']);
    for (let i = 0; i < w; i++) {
      const u = i / (w - 1), lift = Math.round(Math.max(0, (u - 0.72) / 0.28) * 3 + Math.max(0, (0.1 - u) / 0.1) * 1.5);
      for (let k = 0; k < 6 - lift; k++) { const yy = y - 6 + lift + k; put(pb, x + i, yy, U(k === 0 ? '#ffffff' : k === 1 ? stripe : k === 2 ? '#f4f2ea' : k >= 4 ? '#8a94a6' : '#d8dce4')); }
      put(pb, x + i, y - 7 + lift, U(i % 5 === 0 ? '#6a4a2a' : '#94602e'));
    }
    const cx = x + Math.round(w * 0.32), cw = Math.max(5, Math.round(w * 0.3));
    for (let i = 0; i < cw; i++) for (let k = 0; k < 5; k++) put(pb, cx + i, y - 12 + k, U(k === 0 ? stripe : (k === 2 && i > 0 && i < cw - 1) ? '#5ab8e8' : i === cw - 1 ? '#c8c4ba' : '#f4f0e6'));
    if (o.mast) for (let k = 0; k < 10; k++) put(pb, cx + 1, y - 13 - k, U('#5a4a3a'));
    for (let i = -1; i <= w; i++) if (hash2(x + i, y, seed) < 0.7) put(pb, x + i, y, U('#e6fbff'));
  }
  /** Embarcadero de madera sobre pilotes con reflejo, noray, escalerilla y farol */
  function jetty(pb, x0, x1, y, seed) {
    const Wd = P32(R3WINDSTORM.R.WOOD), SHD = U('#0a2a4a');
    for (let x = x0 + 2; x < x1; x += 9) for (let k = 0; k < 16; k++) { put(pb, x, y + k, Wd[k < 2 ? 4 : 2]); put(pb, x + 1, y + k, Wd[1]); if (k > 3 && (k & 1)) { const c = get(pb, x + 2, y + k); if (c >>> 24) put(pb, x + 2, y + k, K.mixU(c, SHD, 0.4)); } }
    for (let x = x0; x < x1; x++) { put(pb, x, y - 3, Wd[7]); put(pb, x, y - 2, Wd[(x - x0) % 6 === 0 ? 3 : 6]); put(pb, x, y - 1, Wd[4]); put(pb, x, y, Wd[2]); put(pb, x, y + 1, Wd[0]); for (let k = 2; k < 5; k++) { const c = get(pb, x, y + k); if (c >>> 24) put(pb, x, y + k, K.mixU(c, SHD, 0.45 - k * 0.08)); } }
    for (const bx of [x0 + 6, x1 - 8]) { put(pb, bx, y - 5, U('#3a3a44')); put(pb, bx, y - 4, U('#2a2a32')); put(pb, bx + 1, y - 5, U('#6a6a76')); }
    for (let k = 0; k < 9; k++) { put(pb, x1 - 2, y - 14 + k, U('#2a2a32')); } put(pb, x1 - 3, y - 15, U('#fff2c4')); put(pb, x1 - 2, y - 15, U('#ffe08a')); put(pb, x1 - 1, y - 15, U('#fff2c4'));
  }

  /* ---------- decoración del tramo (sobre el lienzo del terreno) ---------- */
  function post(pb, world, s) {
    const R = s._r4; if (!R) return;
    const { bx0, by0, w, h, Zb, F, L: L_, gyA, sd } = R, o = s.r4 || {};
    const r = RNG(sd * 3 + 17), gy = (x) => gyA[clamp(x - bx0, 0, w - 1)];
    const Zat = (x, y) => { const xi = x - bx0, yi = y - by0; return xi < 0 || xi >= w || yi < 0 || yi >= h ? -9 : Zb[yi * w + xi]; };
    const Fat = (x, y) => { const xi = x - bx0, yi = y - by0; return xi < 0 || xi >= w || yi < 0 || yi >= h ? 0 : F[yi * w + xi]; };
    const inSeg = (x) => x > (s.edgeL ?? s.x0) + 4 && x < (s.edgeR ?? s.x1) - 4;
    // 1) canto del paso: flecos de hierba, raíces colgantes y flores (en matas)
    const GR = P32(RAMP.grassR), FL = [U('#f47a90'), U('#ffd84a'), U('#fff2c0'), U('#e94a64')];
    for (let x = s.x0 + 2; x < s.x1 - 2; x++) {
      if (!inSeg(x)) continue;
      const v = K.vn(x * 0.09, 0.5, sd + 61); if (v < 0.48) continue;
      const g0 = gy(x), Lg = 1 + Math.floor((v - 0.48) * 10 * hash2(x, 7, 3)) + (hash2(x, 8, 3) < 0.12 ? 3 : 0);
      for (let q = 0; q < Lg; q++) put(pb, x + (q > 2 && hash2(x, 9, 3) < 0.5 ? 1 : 0), g0 + 1 + q, GR[clamp(GR.length - 2 - q, 1, GR.length - 1)]);
      if (hash2(x, 10, 3) < 0.04) { const c = FL[Math.floor(hash2(x, 11, 3) * 4)]; put(pb, x, g0 + 1 + Lg, c); put(pb, x + 1, g0 + 1 + Lg, c); }
    }
    for (const c of L_.wcols) { if (!c.hang) continue; const x = c.x0 + 2 + r.int(0, Math.max(1, c.x1 - c.x0 - 4)); if (!inSeg(x) || Zat(x, gy(x) + 6) !== 0) continue; R2TERRAIN_Rock.hangRoot(pb, x, gy(x) + 3, 5 + r.int(0, 12), c.sd); }
    // 2) muro: repisas con vegetación, raíces bajo los voladizos, matas en las muescas, nidos en las cuevas
    for (const m of L_.ms) {
      const T = m.band;
      if (T) {
        const tdAt = (x) => gy(x) + T.d + Math.round((K.vn(x * 0.06, m.i + 0.5, 11) - 0.5) * 5);
        if (T.kind > 0) vegRun(pb, Math.max(T.xa, s.x0), Math.min(T.xb, s.x1), (x) => tdAt(x) + 1, m.i * 31 + sd, (x, y) => inSeg(x) && Zat(x, y + 2) === 0 && Zat(x, y - 6) === 0, { small: true });
        else for (let x = T.xa + 2 + r.int(0, 6); x < T.xb - 2; x += 5 + r.int(0, 10)) { const y = tdAt(x) + 1; if (inSeg(x) && Zat(x, y) === 0 && Zat(x, y + 8) === 0 && r() < 0.7) hanger(pb, x, y, 4 + r.int(0, 12), x * 13 + y, r() < 0.3 ? r.pick(BLOOMS) : null); }
      }
      const c0 = L_.wcols[m.c0];
      if (c0 && r() < 0.75) { const x = c0.x0 + 1, y = gy(x) + 10 + r.int(0, 50); if (inSeg(x) && Zat(x, y) === 0 && Zat(x, y - 5) === 0) { if (r() < 0.5) PFFlora.fern(pb, x, y, 7 + r.int(0, 5), x + y * 3); else PFFlora.tuft(pb, x, y, 6 + r() * 4, 5 + r() * 4, x + y); } }
      const cv = m.cave;
      if (cv && !cv.sea) { const x = Math.round(cv.cx), y = Math.round(cv.cy + cv.ry * 0.55); if (inSeg(x) && Zat(x, y) === 0) { R3WINDSTORM.nest(pb, x, y, x + y); if (r() < 0.5) PFAWind.perchedGull(pb, x + 3, y - 1, x); } }
    }
    // 3) cabos: vegetación en las cabezas al sol (cadenas), plantas colgantes del canto, nidos y gaviotas
    const birds = o.birds;
    for (const T of L_.tiers) {
      const ok = (x, y) => inSeg(x) && Zat(x, y) === T.z && Zat(x, y - 6) <= T.z && Zat(x - 3, y - 4) <= T.z;
      const headAt = (x, f) => { for (const c of T.cols) if (x >= c.x0 && x < c.x1) return Math.max(gy(x) + 3, c.top + Math.round(c.tilt * (x - (c.x0 + c.x1) * 0.5))) + Math.round((c.hh - 1) * f); return null; };
      const headY = (x) => headAt(x, 1) - 1;
      if (!T.stack) {
        vegRun(pb, T.x0, T.x1, (x) => headAt(x, 0.15), T.sd, ok, { gap: 6 + r.int(0, 5) });
        for (let x = T.x0 + r.int(3, 12); x < T.x1 - 3; x += 9 + r.int(0, 14)) { const y = headAt(x, 0.85); if (y != null && ok(x, y)) { if (r() < 0.6) PFFlora.tuft(pb, x, y, 4 + r() * 3, 3 + r() * 2, x + y, RAMP.grassR); else PFFlora.flowerPatch(pb, x, y, 5, x * 3 + y); } }
      }
      else { const x = Math.round((T.x0 + T.x1) / 2), y = headY(x); if (y != null) { R3WINDSTORM.nest(pb, x, y, x); PFAWind.perchedGull(pb, x - 4, y - 1, x + 1); } }
      for (const c of T.cols) {
        if (!c.hang || T.stack) continue;
        const x = c.x0 + 1 + r.int(0, Math.max(1, c.x1 - c.x0 - 3)), y = headY(x); if (y == null || !ok(x, y + 2)) continue;
        hanger(pb, x, y + 2, 5 + r.int(0, 14), x * 7 + y, r() < 0.45 ? r.pick(BLOOMS) : null);
      }
      const nb = birds && T.x1 > birds[0] && T.x0 < birds[1] ? 3 : (r() < 0.25 ? 1 : 0);
      for (let k = 0; k < nb; k++) { const x = T.x0 + 3 + r.int(0, Math.max(1, T.x1 - T.x0 - 6)), y = headY(x); if (y != null && ok(x, y)) { if (r() < 0.55) R3WINDSTORM.nest(pb, x, y + 1, x * 3); else PFAWind.perchedGull(pb, x, y, x); } }
      if (T.cave) { const x = Math.round(T.cave.cx), y = Math.round(T.cave.cy + T.cave.ry * 0.5); if (Zat(x, y) === T.z) R3WINDSTORM.nest(pb, x, y, x + 5); }
    }
    // 3b) cantos rodados al pie de cabos y calas, medio hundidos, con collar de espuma
    const RR = ramp17(s.ramp || RAMP.rockWarmR), FOAM = U('#e6fbff'), WH = U('#ffffff');
    const boulder = (cx, cy, rx, ry, seed) => {
      K.ellipseFn(pb, cx, cy, rx, ry, (nx, ny, dd, xx, yy) => { if (ny > 0.55) return 0; const tt = 0.62 - nx * 0.3 - ny * 0.5 + (K.cl(xx, yy, 2, seed) - 0.5) * 0.14 - (dd > 0.8 ? 0.12 : 0); const kk = clamp(Math.round(tt * 16), 2, 15); return tt < 0.42 ? K.mixU(RR.lit[kk], RR.sh[kk], 0.6) : RR.lit[kk]; });
      for (let q = -rx - 1; q <= rx + 1; q++) if (hash2(cx + q, cy, seed) < 0.75) put(pb, cx + q, Math.round(cy + ry * 0.55) + (Math.abs(q) > rx * 0.7 ? -1 : 0), Math.abs(q) < rx * 0.5 ? WH : FOAM);
    };
    for (const T of L_.tiers) {
      const n = T.stack ? 1 : 2 + r.int(0, 2);
      for (let k = 0; k < n; k++) { const bx = T.x0 - 4 + r.int(0, T.x1 - T.x0 + 8), by = T.foot + r.int(-1, 3); if (inSeg(bx) && Zat(bx, by + 3) === -2) boulder(bx, by, 2 + r.int(0, 4), 2 + r.int(0, 2), bx); }
    }
    for (const c of L_.coves) for (let k = 0; k < 2 + r.int(0, 2); k++) { const bx = c.x0 + 4 + r.int(0, c.x1 - c.x0 - 8), by = c.wy + 2 + r.int(0, 5); if (Zat(bx, by + 2) === -2) boulder(bx, by, 2 + r.int(0, 3), 2 + r.int(0, 1), bx + 1); }
    // 4) colonia de aves: nidos en grietas del muro con chorreones de guano y gaviotas posadas
    if (birds) for (let x = birds[0] + r.int(0, 8); x < birds[1]; x += 7 + r.int(0, 9)) {
      const y = gy(x) + 14 + r.int(0, 60); if (!inSeg(x) || Zat(x, y) < 0 || Zat(x, y - 4) !== Zat(x, y)) continue;
      R3WINDSTORM.nest(pb, x, y, x + y);
      for (let q = 2; q < 8 + r.int(0, 10); q++) { const c = get(pb, x, y + q); if (c >>> 24) put(pb, x, y + q, K.mixU(c, U('#f4f0e6'), 0.55 * (1 - q / 18))); }
      if (r() < 0.45) PFAWind.perchedGull(pb, x + 4, y - 1, x);
    }
    // 5) calas: playa con barca varada, embarcadero con barcas, caseta de amarre del cable
    for (const c of L_.coves) {
      const cx = Math.round((c.x0 + c.x1) / 2);
      if (c.kind === 'beach') {
        for (let k = 0; k < 10; k++) { const x = c.x0 + 6 + r.int(0, c.x1 - c.x0 - 12), y = c.wy + 3 + r.int(0, 6); if (Fat(x, y) === 9) { put(pb, x, y, U('#e8d8c0')); put(pb, x + 1, y, U('#a89478')); } }
        boat(pb, cx - 14, c.wy + 9, 22, cx, { stripe: '#c83a2a' });
        for (let k = 0; k < 3; k++) PFFlora.tuft(pb, c.x0 + 8 + k * 9, c.wy + 2, 5, 4, cx + k);
      }
      if (c.kind === 'jetty') {
        const jy = c.wy + 10; jetty(pb, c.x0 + 10, c.x1 - 18, jy, cx);
        boat(pb, c.x0 + 22, jy + 14, 30, cx + 1, { mast: true });
        boat(pb, c.x1 - 52, jy + 22, 24, cx + 2, { stripe: '#18a088' });
      }
      if (c.kind === 'landing') {
        const hx = cx - 10, hy = c.wy + 2;
        PFInfra.box3q(pb, hx, hy, 20, 12, 5, { ramp: PFTerrain.CONC, skew: 0.5 });
        for (let yy = hy - 9; yy < hy; yy++) for (let xx = hx + 3; xx < hx + 9; xx++) put(pb, xx, yy, U(yy === hy - 9 ? '#2a3448' : '#3a4a62'));
        PFK.polyFill(pb, [[hx + 14, hy - 10], [hx + 17, hy - 5], [hx + 11, hy - 5]], U('#f0bc2c')); put(pb, hx + 14, hy - 8, U('#1a1418')); put(pb, hx + 14, hy - 6, U('#1a1418'));
        put(pb, hx + 18, hy - 13, U('#3fe0a0'));
        c._hut = [hx, hy];
      }
    }
    // 6) conducciones: de cada aerogenerador baja una bandeja hasta el tendido horizontal bajo el canto,
    //    que converge hacia la subestación; un montante baja a la caseta de amarre de la cala
    const CD = o.conduit;
    if (CD) {
      const td = CD.d ?? 5, ty = (x) => gy(x) + td;
      const xs = CD.from.slice().sort((a, b) => a - b);
      for (const x of xs) { PFInfra.box3q(pb, x - 5, ty(x) + 9, 10, 7, 2, { ramp: R3WINDSTORM.R.METAL, skew: 0.5 }); PFK.polyFill(pb, [[x, ty(x) + 3], [x + 2, ty(x) + 7], [x - 2, ty(x) + 7]], U('#f0bc2c')); put(pb, x, ty(x) + 5, U('#1a1418')); }
      const run = []; for (let x = xs[0]; x <= xs[xs.length - 1]; x += 6) run.push([x, ty(x)]); run.push([xs[xs.length - 1], ty(xs[xs.length - 1])]);
      conduit(pb, run);
      const hut = L_.coves.find(c => c._hut);
      if (hut) { const [hx, hy] = hut._hut, mx = CD.to; conduit(pb, [[mx, ty(mx)], [mx, Math.round((ty(mx) + hy) / 2)], [hx + 16, Math.round((ty(mx) + hy) / 2) + 6], [hx + 16, hy - 12]]); }
    }
    // 7) sendas y escaleras talladas (coordenadas: [x, dy] relativas al canto en x)
    for (const P of (o.paths || [])) trail(pb, P.map(([x, dy]) => [x, gy(x) + dy]), P[0][0] + sd);
  }

  /* ---------- oclusor del plano frontal (f 1,3): rocas basálticas frías y matas oscuras en contraluz ---------- */
  function fgFrame(o) {
    const w = o.w || 160, h = o.h || 80, pb = new PixelBuffer(w, h), r = RNG(o.seed || 1);
    const RK = P32(['#05060f', '#0a0e1e', '#10182e', '#18243e', '#22324e', '#2e4060', '#3e5272']);
    const GK = P32(['#03080a', '#06121a', '#0c1e26', '#132c32', '#1c3c3e', '#284e4a', '#386656']);
    // rocas: un peñasco alto a un lado (la masa que encuadra) y cantos más bajos que se apagan hacia el otro;
    // cara superior apenas iluminada (luz fría), facetas en clusters y borde cálido 1 px arriba-izquierda
    const side = o.side ?? ((o.seed || 1) % 4 < 2 ? -1 : 1), nR = o.rocks ?? (1 + Math.round(w / 70)), tops = [];
    const rock = (cx, rw, rh, i) => {
      const cy = h - rh * 0.5;
      K.ellipseFn(pb, cx, cy, rw, rh, (nx, ny, d) => { if (ny < 0.5 && d > 0.74 + vnoise(Math.round(Math.atan2(ny, nx) * 3) * 0.9, i, o.seed || 1) * 0.26) return 0; if (ny > 0.7) return RK[1]; const fx = Math.round(nx * 2.2) / 2.2, fy = Math.round(ny * 2.2) / 2.2; const t = 3.1 - fx * 1.5 - fy * 2.1 - (d > 0.86 ? 1.1 : 0) + (K.cl(Math.round(cx + nx * rw), Math.round(cy + ny * rh), 2, i) - 0.5) * 1.1; return RK[clamp(Math.round(t), 0, 6)]; });
      tops.push([cx, Math.round(cy - rh * 0.9), rw]);
    };
    rock(w * (side < 0 ? 0.28 : 0.72), w * 0.24, h * 0.56, 0);
    for (let i = 1; i < nR; i++) { const u = i / nR; rock(w * (side < 0 ? 0.28 + u * 0.6 : 0.72 - u * 0.6) + (r() - 0.5) * 10, 10 + r() * 14, h * (0.42 - u * 0.24) * (0.8 + r() * 0.3), i); }
    // matas: agaves y tabaibas oscuras sobre los peñascos, gramíneas y una vara florida violeta
    const nA = o.agaves ?? 2, AGK = ['#02060a', '#06121a', '#0c1e26', '#132c32', '#1c3c3e', '#284e4a', '#386656'];
    for (let i = 0; i < nA; i++) { const T = tops[i % tops.length]; PFFlora.agave(pb, Math.round(T[0] + (r() - 0.5) * T[2] * 0.6), T[1] + 3, 8 + r.int(0, 7), (o.seed || 1) * 7 + i, AGK); }
    for (const T of tops) for (let k = 0; k < 5; k++) { const bx = T[0] + (r() - 0.5) * T[2] * 1.2, a = -Math.PI / 2 + (r() - 0.5) * 1.4, L = 6 + r() * 10; K.lineFn(pb, bx, T[1] + 4, bx + Math.cos(a) * L * 0.6, T[1] + 4 + Math.sin(a) * L, (t) => GK[clamp(Math.round(2 + t * 4), 0, 6)]); }
    for (let i = 0; i < Math.round(w / 12); i++) { const bx = r() * w, a = -Math.PI / 2 + (r() - 0.5) * 1.6, L = h * (0.25 + r() * 0.45); K.lineFn(pb, bx, h, bx + Math.cos(a) * L * 0.5, h + Math.sin(a) * L, (t) => GK[clamp(Math.round(1 + t * 4), 0, 6)]); }
    if (o.spike !== false) for (let i = 0; i < (o.spikes ?? 1); i++) PFFlora.lupine(pb, Math.round(w * (0.2 + r() * 0.6)), h - r.int(4, 12), Math.round(h * (0.5 + r() * 0.3)), (o.seed || 1) + i * 5, { ramp: RAMP.fgVioR, leaf: ['#05060f', '#0a1626', '#0e243a', '#194560', '#2f6f7a', '#4f8f88', '#7ab09a'], wide: 1 });
    K.rim(pb, U('#c88a5a'), 0.32, -1, -1);
    for (let x = 0; x < w; x++) { const hh = 5 + Math.round(K.vn(x * 0.12, 0, o.seed || 1) * 7); for (let y = h - hh; y < h; y++) if (!(get(pb, x, y) >>> 24)) put(pb, x, y, RK[y > h - 3 ? 0 : 1]); }
    return pb;
  }
  if (typeof PFTerrain !== 'undefined') PFTerrain.register('r4l5cliff', { face, post });
  if (typeof PFStage !== 'undefined' && PFStage.FG) PFStage.FG.r4l5Frame = fgFrame;
  return { face, post, build, layout, info, tabaiba, cardon, hanger, vegRun, trail, conduit, boat, jetty, fgFrame, WAT };
})();
