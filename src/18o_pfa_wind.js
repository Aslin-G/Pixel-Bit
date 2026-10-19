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
    PFK.polyFill(pb, [[x - 6, yb - h], [x + w / 2, yb - h - 18], [x + w + 6, yb - h]], (xx, yy) => U(((xx + yy) % 5 === 0) ? '#8a1a7a' : yy < yb - h - 9 ? '#e34ad8' : '#c02ab8'));
    hline(pb, x - 6, x + w + 6, yb - h, U('#5a0a50'));
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
    const Wh = P32(A.WHITE), w = 56, h = 96;
    A.castShadow(pb, x + 6, yb, w, 14, -0.24);
    I.box3q(pb, x - 4, yb, w + 8, 4, 10, { ramp: PFTerrain.CONC, skew: 0.6 });
    I.box3q(pb, x, yb - 4, w, h - 4, 10, { ramp: A.WHITE, skew: 0.6, front: (xx, yy) => { const ly = yy - (yb - h); if (ly < 3) return Wh[7]; if (ly < 7) return U('#e34ad8'); return Wh[6 - (PFK.cl(xx, yy, 3, 95) < 0.07 ? 1 : 0)]; } });
    rect(pb, x + 6, yb - 72, 32, 20, U('#0a1030')); hline(pb, x + 6, x + 37, yb - 72, U('#6aa0b4'));
    rect(pb, x + 40, yb - 90, 12, 86, U('#3a4256')); rect(pb, x + 41, yb - 89, 10, 30, U('#a8d4f0'));
    for (let k = 0; k < 4; k++) { vline(pb, x + 10 + k * 8, yb - h - 26 + k * 3, yb - h - 1, U('#c8d8e8')); }
    put(pb, x + 10, yb - h - 27, U('#ff3a3a'));
    return { screen: [x + 7, yb - 71, 30, 18] };
  }
  /** Observatorio de aves (escondite de madera con ranura) y cajas nido */
  function birdHide(pb, x, yb) {
    const Wd = P32(A.WOOD);
    A.castShadow(pb, x + 4, yb, 46, 12, -0.24);
    I.box3q(pb, x, yb, 46, 50, 10, { ramp: A.WOOD, skew: 0.6, front: (xx, yy) => Wd[(xx - x) % 5 === 0 ? 2 : 4 - (PFK.cl(xx, yy, 2, 97) < 0.15 ? 1 : 0)] });
    rect(pb, x + 6, yb - 36, 34, 5, U('#140a06'));
    PFK.polyFill(pb, [[x - 4, yb - 50], [x + 54, yb - 50], [x + 58, yb - 60], [x + 2, yb - 60]], (xx, yy) => Wd[(yy % 3) ? 5 : 3]);
    rect(pb, x + 10, yb - 26, 26, 10, U('#e8d8b8')); K.text(pb, 'AVES', x + 13, yb - 25, U('#3a1e10'), { font: 'tiny' });
    for (const [bx, by] of [[x + 60, yb - 36], [x + 72, yb - 28]]) { vline(pb, bx + 3, by + 8, yb, Wd[2]); I.box3q(pb, bx, by + 8, 8, 8, 3, { ramp: A.WOOD }); put(pb, bx + 3, by + 3, U('#140a06')); }
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
