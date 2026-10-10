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
    for (let x = x0; x < x1; x++) for (let y = top(x); y < yBot; y++) {
      if (y >= seaY + Math.round(Math.sin(x * 0.07) * 1.5)) {
        const q = y - seaY; let k = q < 2 ? 5 : q < 5 ? 4 : q < 10 ? 3 : q < 18 ? 2 : 1;
        if (q < 4 && hash2(x >> 1, y, sd) < 0.35) k = 6;
        put(pb, x, y, SEA[k]); continue;
      }
      if (y - top(x) < 2) { put(pb, x, y, U(y - top(x) === 0 ? '#748c2a' : '#3a5214')); continue; }
      let u = K.shU(colRock(x, y, sd, R, 1.2), -0.2, 240);
      const mist = clamp((y - yTop) / (seaY - yTop), 0, 1);
      u = K.mixU(u, U('#b8c8de'), 0.18 + mist * mist * 0.5);
      put(pb, x, y, u);
    }
    // farallones (columnas bajo las plataformas de roca), más cerca y mejor iluminados
    for (const [sx, sy, sw] of (o.stacks || [])) for (let y = sy; y < seaY + 2; y++) for (let i = 0; i < sw; i++) {
      const xx = sx + i - Math.round((y - sy) * 0.03);
      let u = colRock(sx * 3 + i, y, sd + 7, R, 3);
      if (i === 0 || i === sw - 1) u = R[i === 0 ? 3 : 0];
      put(pb, xx, y, K.mixU(u, U('#c4d4e2'), clamp((y - sy) / (seaY - sy), 0, 1) * 0.4));
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

  return { turbine, rotor, drawRotor, mast, kiteStation, lab, controlHut, birdHide, gorge, windBush, thrift, layerAt, STRATA, TW };
})();
