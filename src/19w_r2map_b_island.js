/* =====================================================================
   19w_r2map_b_island.js — MAPA DEL NEXO como diorama en 3/4 (R2MAP).
   La isla de Aridia vista desde el sur y en alto, como el panorama de la
   referencia: acantilados costeros con cara frontal iluminada, estratos,
   cárcavas y pie violeta; terrazas escalonadas; cresta de aerogeneradores
   al nordeste; Mesa del Nexo (farallón de techo plano); ciudad de la
   cúpula de ARIDIA en su colina con cascada; planta SYNARA en la costa
   con su emisario; campo FV en las dunas; salinas en el sur; oasis con
   laguna, bancales y palmeras; ciudadela H2 en la costa este; mar en
   bandas con espuma, rompientes y reflejo de los acantilados.
   Trazador propio en columnas (de delante hacia atrás) sobre una rejilla
   de alturas, con normales (luz arriba-izquierda, ligeramente frontal),
   sombras arrojadas por marcha de rayos y bandas sin tramado.
   API:
     R2MAP.buildIsland() → {c, clouds, rotors:[{x,y,rot,ph}], falls:[...],
         glints:[...], leds:[[x,y,col]], fauna:[...], ground(nodeId)→[x,y]}
         (coordenadas del lienzo de FIXUI_MAP_PAD + W + FIXUI_MAP_PAD × H;
          los nodos MAP_NODES están en (n.x + PAD, n.y) del lienzo)
     R2MAP.drawIslandLive(g, I, ox, oy, t)  rotores, cascadas, LED, fauna
   ===================================================================== */
(() => {
  const M = R2MAP, V = VISTA;
  const P32 = (rp) => V.P32(rp);
  // rampas de tapa (oscuro → claro) con sombras desplazadas hacia granate/violeta
  const TOP = {
    sand: ['#4a2236', '#7a3a32', '#a85a34', '#cc7c3e', '#e49e50', '#f2be6a', '#fad88e', '#fff0c0'],
    dune: ['#5a2630', '#94462e', '#c66e36', '#e4924a', '#f4b25e', '#fcd07c', '#ffe6a8'],
    rock: ['#3a1434', '#5e1e2a', '#86321e', '#ac4c22', '#cc6c2c', '#e6923e', '#f6b860', '#fdd890'],
    grass: ['#123a30', '#1c5228', '#2e6e22', '#4c8c1e', '#76aa22', '#a4c62a', '#d0de44', '#f0ee7a'],
    crop: ['#0e3a2c', '#185a24', '#26801e', '#46a020', '#78c228', '#aedc3a', '#e2f06a'],
    salt: ['#7a4a5a', '#a87a86', '#d0aeb0', '#ead6d0', '#f6ece6', '#fdf8f4', '#ffffff'],
    city: ['#5a2e36', '#86503e', '#b07a50', '#d0a066', '#e8c286', '#f6dcaa', '#fff0d0'],
  };
  // caras de acantilado: granate-violeta al pie → ocre → crema en el labio
  const FACE = {
    rock: ['#22102c', '#3a1636', '#58202e', '#7a2c20', '#9c4220', '#be6026', '#da8234', '#eea64e', '#f8c870'],
    salt: ['#2e1c46', '#4a2e5e', '#6a4a7a', '#8e6e96', '#b296b4', '#d4bcd0', '#efe0ec'],
    city: ['#2a1430', '#4a2034', '#6e3436', '#94503c', '#ba7046', '#d8945a', '#f0bc7c'],
  };
  const SEA = ['#0a3a80', '#0a4a96', '#0858aa', '#0668ba', '#0478c8', '#0688d4', '#0a9ade', '#10b0e4', '#1ec4e8', '#40d6ee', '#84e8f4', '#d2f6f8', '#ffffff'];
  const smooth01 = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  const gauss = (dx, dy) => Math.exp(-(dx * dx + dy * dy));

  M.buildIsland = function () {
    const PAD = FIXUI_MAP_PAD, MW = W + 2 * PAD, MH = H, WR = MH + 40, SHIFT = 16;
    const r = RNG(2026);
    /* ---------------- campo de alturas (mundo: x = X − PAD, yw) ---------------- */
    const landD = (x, yw) => {
      const y = yw - SHIFT;
      const dx = (x - 310) / 236, dy = (y - 198) / (y > 198 ? 112 : 150);
      let d = Math.sqrt(dx * dx * 0.9 + dy * dy) - 0.82 + (fbm(x * 0.012, y * 0.012, 4, 2) - 0.5) * (y > 220 ? 0.3 : 0.5);
      if (y < 60) d += (60 - y) * 0.01;
      d -= Math.exp(-(((x - 520) / 60) ** 2 + ((y - 120) / 40) ** 2)) * 0.3;
      d -= Math.exp(-(((x - 236) / 64) ** 2 + ((y - 286) / 20) ** 2)) * 0.06;   // península de las salinas
      return d;
    };
    const ridge = V.massif([
      { x: 404, v: 132, h: 26, w: 46, d: 26 }, { x: 452, v: 120, h: 38, w: 54, d: 30 },
      { x: 504, v: 126, h: 34, w: 50, d: 30 }, { x: 548, v: 146, h: 22, w: 40, d: 26 },
    ], { seed: 41, rough: 0.6, scale: 0.05, sharp: 1.15, spurs: 7 });
    const N = MW * WR;
    const Hh = new Float32Array(N), LD = new Float32Array(N), BI = new Uint8Array(N);
    const BIO = ['sand', 'dune', 'rock', 'grass', 'crop', 'salt', 'city'];
    const bix = (s) => BIO.indexOf(s);
    const TERR = new Uint8Array(N); // 1 = terraza agrícola (bancal)
    for (let yw = 0; yw < WR; yw++) for (let X = 0; X < MW; X++) {
      const x = X - PAD, i = yw * MW + X, d = landD(x, yw);
      LD[i] = d;
      if (d >= 0) { Hh[i] = 0; continue; }
      const inl = -d;
      // acantilado costero (más bajo en las calas de la toma y de la planta)
      const cove = Math.max(gauss((x - 102) / 30, (yw - 214) / 26), gauss((x - 146) / 34, (yw - 262) / 22) * 0.9, gauss((x - 520) / 26, (yw - 222) / 20) * 0.6);
      const cliff = (11 + 9 * fbm(x * 0.025, yw * 0.025, 3, 41)) * (1 - 0.75 * cove);
      let h = 1 + cliff * smooth01(0.0015, 0.008, inl);
      // colina de la ciudad en terrazas de 4 px
      const city = gauss((x - 204) / 40, (yw - 180) / 28);
      if (city > 0.08) h += Math.floor(city * 18 / 4) * 4;
      // altiplano central suave y cresta de aerogeneradores
      h += 8 * gauss((x - 312) / 64, (yw - 182) / 36);
      const rg = ridge(x, yw);
      h += rg;
      // cárcavas y lomas suaves del altiplano (relieve fino con luz y sombra)
      h += (V.ridged(x * 0.035, yw * 0.05, 3, 13) - 0.45) * 5 * smooth01(0.02, 0.08, inl) * (1 - city);
      // Mesa del Nexo: farallón de techo plano
      const rm = Math.hypot((x - 256) / 30, (yw - 124) / 15) + (fbm(x * 0.08, yw * 0.08, 2, 7) - 0.5) * 0.25;
      if (rm < 1) h += 24 * clamp((1 - rm) * 5, 0, 1);
      // ciudadela H2: meseta costera
      h += 5 * gauss((x - 498) / 44, (yw - 214) / 28);
      // dunas FV: ondas suaves
      const dun = gauss((x - 352) / 64, (yw - 240) / 30);
      h += dun * (2 + 2 * Math.sin(x * 0.16 + yw * 0.35 + fbm(x * 0.05, yw * 0.05, 2, 3) * 4));
      // oasis: cuenca con laguna; salinas: llano bajo
      const oas = gauss((x - 374) / 48, (yw - 290) / 20);
      const sal = gauss((x - 228) / 56, (yw - 298) / 18);
      h = lerp(h, 3, clamp(oas * 1.5, 0, 0.85));
      h = lerp(h, 3, clamp(sal * 1.6, 0, 0.9));
      Hh[i] = Math.max(1, h);
      // bioma (fronteras orgánicas)
      const n = fbm(x * 0.05, yw * 0.05, 3, 5) - 0.5;
      let b = 'sand';
      if (rg > 6 + n * 6) b = (rg < 18 && hash2(x >> 3, yw >> 3, 2) < 0.6) || n > 0.12 ? 'grass' : 'rock';
      else if (rm < 1.05) b = 'rock';
      if (city > 0.3 + n * 0.3) b = 'city';
      if (dun > 0.42 + n * 0.3) b = 'dune';
      if (sal > 0.42 + n * 0.25) b = 'salt';
      if (oas > 0.2 + n * 0.3 || gauss((x - 430) / 30, (yw - 284) / 18) > 0.4 + n) b = 'crop';
      else if (oas > 0.08 + n * 0.2 || gauss((x - 140) / 40, (yw - 220) / 30) > 0.5 + n * 0.5) b = 'grass';
      BI[i] = bix(b);
      if ((b === 'crop' && oas < 0.75) || (b === 'city' && city < 0.55)) TERR[i] = 1;
    }
    // bancales del oasis: alturas cuantizadas en escalones de 3 px
    for (let i = 0; i < N; i++) if (TERR[i] && BI[i] === bix('crop')) Hh[i] = Math.max(2, Math.round(Hh[i] / 3) * 3);
    const hAt = (x, yw) => { const X = clamp(Math.round(x) + PAD, 0, MW - 1), Y = clamp(Math.round(yw), 0, WR - 1); return Hh[Y * MW + X]; };
    const isLand = (x, yw) => { const X = Math.round(x) + PAD, Y = Math.round(yw); return X >= 0 && X < MW && Y >= 0 && Y < WR && LD[Y * MW + X] < 0; };
    /* ---------------- laguna del oasis y ríos ---------------- */
    const WATER = new Uint8Array(N);
    for (let yw = 0; yw < WR; yw++) for (let X = 0; X < MW; X++) {
      const x = X - PAD, i = yw * MW + X; if (LD[i] >= 0) continue;
      const q = Math.hypot((x - 372) / 22, (yw - 290) / 7) + (fbm(x * 0.1, yw * 0.1, 2, 9) - 0.5) * 0.5;
      if (q < 1) { WATER[i] = 1; Hh[i] = 3; }
    }
    // canal del oasis al mar (cae por el acantilado sur como cascada) y arroyo de la ciudad hacia el oeste
    const rivers = [
      [[372, 294], [380, 302], [390, 310], [396, 320], [398, 336]],
      [[188, 186], [170, 192], [150, 198], [130, 206], [110, 214], [90, 222]],
    ];
    for (const R of rivers) for (let s = 0; s < R.length - 1; s++) {
      const [ax, ay] = R[s], [bx, by] = R[s + 1], L = Math.ceil(Math.hypot(bx - ax, by - ay));
      for (let k = 0; k <= L; k++) {
        const x = Math.round(lerp(ax, bx, k / L) + (fbm(k * 0.2, s, 2, 4) - 0.5) * 2), yw = Math.round(lerp(ay, by, k / L));
        for (let dx = -1; dx <= 2; dx++) { const X = x + dx + PAD; if (X < 0 || X >= MW || yw >= WR) continue; const i = yw * MW + X; if (LD[i] < 0) WATER[i] = 2; }
      }
    }
    /* ---------------- sombras arrojadas (marcha hacia la luz) ---------------- */
    const SHD = new Uint8Array(N);
    for (let yw = 1; yw < WR; yw++) for (let X = 1; X < MW; X++) {
      const i = yw * MW + X; if (LD[i] >= 0) continue;
      const h0 = Hh[i];
      for (let k = 1; k < 26; k++) {
        const XX = X - k, YY = yw - Math.round(k * 0.45); if (XX < 0 || YY < 0) break;
        if (Hh[YY * MW + XX] > h0 + k * 0.85) { SHD[i] = 1; break; }
      }
    }
    /* ---------------- trazado en columnas ---------------- */
    const pb = new PixelBuffer(MW, MH);
    const ZW = new Int16Array(MW * MH).fill(-1), KIND = new Uint8Array(MW * MH);
    const TOPU = BIO.map(b => P32(TOP[b]));
    const SHU = BIO.map(b => P32(TOP[b].map(c => shadeTo(mixHex(c, '#3a2a6a', 0.35), -0.12, 260))));
    const FACEU = { rock: P32(FACE.rock), salt: P32(FACE.salt), city: P32(FACE.city) };
    const L = V.LIGHT;
    const WAT = P32(['#0a4a7a', '#0a7ab0', '#14a8d4', '#2cd0e6', '#7ae8f2', '#d8fbff']);
    for (let X = 0; X < MW; X++) {
      let yt = MH;
      for (let yw = WR - 1; yw >= 0; yw--) {
        const i = yw * MW + X; if (LD[i] >= 0) continue;
        const h = Hh[i], sy = Math.round(yw - h);
        if (sy >= yt) continue;
        const x = X - PAD;
        const hl = Hh[yw * MW + Math.max(0, X - 1)], hr = Hh[yw * MW + Math.min(MW - 1, X + 1)];
        const hu = Hh[Math.max(0, yw - 1) * MW + X], hd = Hh[Math.min(WR - 1, yw + 1) * MW + X];
        const dx = (hr - hl) * 0.5, dy = (hd - hu) * 0.5;
        const inv = 1 / Math.hypot(dx, dy, 1);
        const I = (dx * -L[0] + -dy * -L[1] * 0.9 + L[2]) * inv;
        const bi = BI[i], bname = BIO[bi];
        // la cara no baja del nivel del mar (yw): el primer escalón de la costa termina en el agua
        const yb = Math.min(yt, yw + 1), span = yb - sy;
        // tapa
        const R = SHD[i] ? SHU[bi] : TOPU[bi], n = R.length;
        const cav = clamp((h - (hl + hr + hu + hd) * 0.25) * 0.08, -0.25, 0.25);
        let t = 0.52 + (I - 0.62) * 1.7 + cav + (hash2((X / 2) | 0, (yw / 2) | 0, 5) - 0.5) * 0.14;
        if (bname === 'dune') t += Math.sin(x * 0.5 + yw * 1.3 + fbm(x * 0.06, yw * 0.06, 2, 1) * 6) > 0.85 ? -0.12 : 0;
        if (bname === 'crop' && TERR[i]) t += ((yw + (x >> 3)) % 3 === 0) ? -0.16 : 0.04;   // hileras de cultivo
        let u = R[V.band(clamp(t, 0, 0.999), n, X, yw, 0.05, 3)];
        if (WATER[i]) u = WAT[clamp(Math.round(2 + (I - 0.6) * 4 + (hash2(X >> 1, yw, 3) < 0.08 ? 2 : 0)), 0, 5)];
        if (sy >= 0 && sy < MH) { pb.data[sy * MW + X] = u; ZW[sy * MW + X] = yw; KIND[sy * MW + X] = 1; }
        // cara (si el escalón es alto) o continuación de la ladera
        if (span > 1) {
          const ff = bname === 'city' || TERR[i] ? FACEU.city : FACEU.rock, nf = ff.length;
          // orientación horizontal de la cara: hacia el terreno bajo (delante); luz desde la izquierda y de frente
          const gx = dx, gy = dy; const gl = Math.hypot(gx, gy) || 1;
          const If = (gx / gl) * -L[0] * 1.1 + Math.max(0, -gy / gl) * 0.42 + 0.08;
          const water = WATER[i] === 2 && span > 3;
          for (let y = sy + 1; y < yb; y++) {
            if (y < 0 || y >= MH) continue;
            const k = y - sy, fr = k / span;
            let tf = 0.5 + If * 0.6 - Math.pow(fr, 1.6) * 0.38 + (k === 1 ? 0.2 : 0);
            if (span > 3) {
              if ((y + ((X * 3) >> 3) + (hash2(X >> 2, 0, 9) * 3 | 0)) % 4 === 0) tf -= 0.12;       // estratos
              if (hash2(X >> 1, (y / 5) | 0, 11) < 0.12) tf -= 0.16;                                   // cárcavas
              if (hash2(X, y >> 1, 12) > 0.93) tf += 0.12;                                             // aristas
            }
            if (SHD[i]) tf -= 0.14;
            let fu = ff[V.band(clamp(tf, 0, 0.999), nf, X, y, 0.06, 7)];
            if (span <= 2) fu = R[clamp(Math.round((t - 0.12) * (n - 1)), 0, n - 1)];
            if (water) fu = WAT[clamp(Math.round(3 + (hash2(X, (y + X * 5) >> 2, 3) - 0.5) * 3 + (k < 2 ? 2 : 0)), 0, 5)];
            pb.data[y * MW + X] = fu; ZW[y * MW + X] = yw; KIND[y * MW + X] = span > 2 ? 2 : 1;
          }
        }
        yt = sy;
      }
    }
    // borde cálido en el labio de los acantilados (luz de silueta)
    const RIM = U('#fff0c0');
    for (let y = 1; y < MH - 1; y++) for (let X = 1; X < MW - 1; X++) {
      const i = y * MW + X;
      if (KIND[i] === 1 && KIND[i + MW] === 2 && KIND[i - MW] !== 0 && hash2(X, y, 21) < 0.7) pb.data[i] = V.mixU(pb.data[i], RIM, 0.4);
    }
    /* ---------------- mar: bandas por distancia a la costa ---------------- */
    const DS = new Int16Array(MW * MH).fill(9999), q = new Int32Array(MW * MH); let qh = 0, qt = 0;
    for (let i = 0; i < MW * MH; i++) if (KIND[i]) { DS[i] = 0; q[qt++] = i; }
    while (qh < qt) {
      const i = q[qh++], x = i % MW, y = (i / MW) | 0, d = DS[i] + 1;
      if (x > 0 && DS[i - 1] > d) { DS[i - 1] = d; q[qt++] = i - 1; }
      if (x < MW - 1 && DS[i + 1] > d) { DS[i + 1] = d; q[qt++] = i + 1; }
      if (y > 0 && DS[i - MW] > d) { DS[i - MW] = d; q[qt++] = i - MW; }
      if (y < MH - 1 && DS[i + MW] > d) { DS[i + MW] = d; q[qt++] = i + MW; }
    }
    const SU = P32(SEA), nS = SEA.length;
    for (let y = 0; y < MH; y++) for (let X = 0; X < MW; X++) {
      const i = y * MW + X; if (KIND[i]) continue;
      const d = DS[i] + (fbm(X * 0.04, y * 0.04, 3, 17) - 0.5) * 10;
      // profundo → turquesa en la orilla; más claro hacia el sur (luz frontal) y en los bajíos
      // bajío turquesa estrecho (fondo de arena) → azul → azul profundo; algo más claro hacia el sur
      let t = d < 7 ? 0.8 - d * 0.012 : d < 20 ? 0.68 - (d - 7) * 0.014 : 0.5 - Math.pow(clamp((d - 20) / 90, 0, 1), 0.8) * 0.42;
      t += (y / MH) * 0.05;
      if (d < 9 && fbm(X * 0.15, y * 0.2, 2, 23) > 0.62) t += 0.06;                       // manchas de arena en el bajío
      // crestas de ola paralelas a la costa y trazos de oleaje en mar abierto
      const wv = (d + fbm(X * 0.08, y * 0.12, 2, 5) * 6) % 10;
      if (d > 5 && d < 40 && wv < 1.1 && hash2(X >> 2, y, 6) < 0.7) t += 0.09;
      else if (d >= 24) {
        // oleaje de mar abierto: trazos claros cortos con su seno oscuro debajo, y textura en clusters
        const row = Math.floor(y / 4), ph = Math.sin(X * 0.23 + row * 2.1 + fbm(X * 0.02, row * 0.3, 2, 8) * 9);
        if (y % 4 === 0 && ph > 0.7) t += 0.1; else if (y % 4 === 1 && ph > 0.7) t -= 0.05;
        t += (vnoise(X * 0.22, y * 0.45, 29) - 0.5) * 0.1;
      }
      // reflejo y sombra de los acantilados en el agua de delante
      const above = (y > 2 && KIND[(y - 2) * MW + X] === 2) || (y > 4 && KIND[(y - 4) * MW + X] === 2);
      if (above && d < 6) t -= 0.12;
      let u = SU[V.band(clamp(t, 0, 0.999), nS - 2, X, y, d < 20 ? 0.04 : 0.015, 9)];
      if (DS[i] <= 1 && hash2(X, y, 31) < 0.85) u = SU[nS - 1 - (hash2(X >> 1, y, 2) < 0.4 ? 1 : 0)];       // espuma al pie
      else if (DS[i] <= 3 && hash2(X >> 1, y, 33) < 0.45) u = SU[nS - 3];
      pb.data[i] = u;
    }
    /* ---------------- utilidades de colocación ---------------- */
    const surfY = (x, yw) => Math.round(yw - hAt(x, yw));
    /** ¿se ve la tapa en (x, yw)? (no la tapa algo más cercano) */
    const vis = (x, yw) => { const X = Math.round(x) + PAD, y = surfY(x, yw); if (X < 0 || X >= MW || y < 0 || y >= MH) return false; const z = ZW[y * MW + X]; return Math.abs(z - Math.round(yw)) <= 1; };
    /** punto del mundo bajo un píxel del lienzo (cx = x de nodo, cy = y del lienzo) */
    const worldAt = (x, cy) => { const X = Math.round(x) + PAD, y = Math.round(cy); if (X < 0 || X >= MW || y < 0 || y >= MH) return null; const z = ZW[y * MW + X]; return z < 0 ? null : z; };
    const groundY = (x, cy) => { const z = worldAt(x, cy); return z == null ? cy : surfY(x, z); };
    const items = [];
    const add = (x, cy, fn, z = 0) => items.push({ x, y: cy, z, fn });
    const P = (x) => Math.round(x) + PAD;
    const nodeXY = MAP_NODES.map(n => [n.x, n.y]);
    const nearNode = (x, y, rr = 14) => nodeXY.some(([nx, ny]) => Math.abs(nx - x) < rr && Math.abs(ny - y) < rr + 4);
    /* ---------------- caminos de tierra sobre el relieve ---------------- */
    const ROAD = U('#f4d8a0'), ROADD = U('#9a5a3a');
    for (const [a, b] of MAP_LINKS) {
      const A = MAP_NODES[a], B = MAP_NODES[b];
      const wa = worldAt(A.x, A.y + 2), wb = worldAt(B.x, B.y + 2); if (wa == null || wb == null) continue;
      const len = Math.ceil(Math.hypot(B.x - A.x, wb - wa));
      for (let k = 0; k <= len; k++) {
        const s = k / len, x = lerp(A.x, B.x, s) + Math.sin(s * Math.PI * 2 + a) * 4, yw = lerp(wa, wb, s) + Math.sin(s * Math.PI + b) * 3;
        if (!isLand(x, yw) || !vis(x, yw)) continue;
        const X = P(x), y = surfY(x, yw); if (KIND[y * MW + X] !== 1) continue;
        const i = y * MW + X; if (WATER[Math.round(yw) * MW + X]) continue;
        pb.data[i] = ROAD; if (y + 1 < MH && KIND[i + MW] === 1) pb.data[i + MW] = ROADD;
      }
    }
    /* ---------------- vegetación en clusters por todo el relieve ---------------- */
    const FOLR = ['#0e2a2c', '#163e2a', '#245a26', '#3c7a22', '#62a024', '#94c42c', '#cadc4a'];
    const SHRUBR = ['#2a1e2e', '#3e3426', '#5a5a22', '#7a7a26', '#a09a34', '#c8bc52'];
    for (let k = 0; k < 4200; k++) {
      const x = r.int(-60, 700), cy = r.int(20, MH - 20);
      const z = worldAt(x, cy); if (z == null) continue;
      const i = z * MW + P(x); if (LD[i] >= -0.012 || WATER[i]) continue;
      if (KIND[cy * MW + P(x)] !== 1) continue;
      const bn = BIO[BI[i]];
      const dens = { sand: 0.34, dune: 0.05, rock: 0.2, grass: 0.95, crop: 0.3, salt: 0.0, city: 0.2 }[bn];
      if (r() > dens || nearNode(x, cy, 9)) continue;
      const big = bn === 'grass' ? r.chance(0.45) : r.chance(0.2);
      const pal = bn === 'sand' || bn === 'rock' ? (r.chance(0.6) ? SHRUBR : FOLR) : FOLR;
      add(x, cy, (X, Y) => V.shrub(pb, X, Y + 1, big ? 2 : 1, X * 7 + Y, { ramp: pal }), 0);
    }
    /* ---------------- parcelas de cultivo en el altiplano (mosaico de huertas) ---------------- */
    const FIELD = [['#1c5a24', '#2e7e22', '#4ca022', '#7cc42a', '#b4e03a'], ['#8a5a1e', '#c08a26', '#e8b83a', '#f8d860', '#fff0a0'], ['#5a2a1e', '#8a4a2a', '#b06a3a', '#d0905a', '#f0b878'],
      ['#185a3a', '#2a7a3a', '#4ca848', '#80d060', '#b8f080'], ['#3a5a12', '#5a8a16', '#8ab820', '#bcd83a', '#e8f070'], ['#1c5a24', '#2e7e22', '#4ca022', '#7cc42a', '#b4e03a']];
    const parcels = [[150, 196, 40, 18], [232, 196, 36, 16], [268, 150, 28, 12], [454, 222, 34, 14], [120, 214, 26, 12], [300, 238, 22, 10], [180, 226, 30, 12], [420, 236, 30, 12]];
    for (const [px0, py0, pw, ph] of parcels) {
      const cols = Math.max(2, Math.round(pw / 11));
      for (let cy = py0; cy < py0 + ph; cy++) for (let x = px0; x < px0 + pw; x++) {
        const xs = x + Math.round((cy - py0) * 0.6); const X = P(xs);
        if (X < 0 || X >= MW || cy < 0 || cy >= MH) continue;
        const i = cy * MW + X; if (KIND[i] !== 1) continue;
        const z = ZW[i]; if (z < 0 || WATER[z * MW + X]) continue;
        const bn = BIO[BI[z * MW + X]]; if (bn === 'salt' || bn === 'rock' || bn === 'dune' || bn === 'city') continue;
        if (nearNode(xs, cy, 12)) continue;
        const ci = Math.floor((x - px0) / (pw / cols)), F = FIELD[(ci * 3 + px0 + py0) % FIELD.length];
        const edge = (x - px0) % Math.round(pw / cols) === 0 || cy === py0;
        // tono según la luz del terreno debajo (la parcela sigue el relieve) y surcos alternos
        const o = pb.data[i], lum = ((o & 255) * 0.3 + ((o >>> 8) & 255) * 0.59 + ((o >>> 16) & 255) * 0.11) / 255;
        const ti = clamp(Math.round(lum * 4.6 - 0.1) - ((cy + ci) % 2), 1, 4);
        pb.data[i] = edge ? U(hash2(x, cy, 3) < 0.5 ? '#5a2e2a' : '#86c23a') : U(F[ti]);
      }
    }
    /* ---------------- rocas y peñascos en 3/4 sobre la arena ---------------- */
    const BOUL = ['#3a1434', '#6a2626', '#9a4422', '#c86c2c', '#eaa04a', '#fbd086'];
    for (let k = 0; k < 90; k++) {
      const x = r.int(60, 580), cy = r.int(60, 320), z = worldAt(x, cy);
      if (z == null || KIND[cy * MW + P(x)] !== 1) continue;
      const bn = BIO[BI[z * MW + P(x)]]; if (bn !== 'sand' && bn !== 'rock' && bn !== 'grass') continue;
      if (nearNode(x, cy, 12) || Math.hypot(x - 196, cy - 150) < 40) continue;
      const rw = r.int(2, 5), rh = r.int(2, 4), sd = k;
      add(x, cy, (X, Y) => {
        V.ellipse(pb, X, Y - rh * 0.5, rw, rh, (nx, ny, d, px, py) => U(BOUL[clamp(Math.round(3.4 - nx * 1.6 - ny * 2 + (hash2(px, py, sd) - 0.5)), 0, 5)]));
        pb.hline(X - rw + 1, X + rw, Y + 1, '#4a1e34');
      }, 0);
    }
    /* ---------------- árboles de copa redonda cerca de la ciudad y en las praderas ---------------- */
    for (let k = 0; k < 140; k++) {
      const x = r.int(70, 560), cy = r.int(80, 320), z = worldAt(x, cy);
      if (z == null || KIND[cy * MW + P(x)] !== 1) continue;
      const bn = BIO[BI[z * MW + P(x)]]; if (bn !== 'grass' && bn !== 'city' && !(bn === 'sand' && r.chance(0.25))) continue;
      if (nearNode(x, cy, 11) || WATER[z * MW + P(x)]) continue;
      const rr2 = r.int(2, 3), sd = k * 17;
      add(x, cy, (X, Y) => V.tree(pb, X, Y, rr2, sd, {}), 1);
    }
    /* ---------------- ARIDIA: ciudad de la cúpula en la colina ---------------- */
    const CITY = { x: 196, y: 150 };
    const HOUSEW = [['#fff8ec', '#f0dcc0', '#c8a888', '#8a6a5a'], ['#fbe6b0', '#ecc27a', '#c08a4a', '#7a4a2a'], ['#ffd8c8', '#f2a890', '#c06a5a', '#7a3a3a'], ['#d8f6ff', '#a8dcec', '#6aa8c0', '#3a6a84']];
    const ROOFC = ['#d8343c', '#c8642c', '#20b8c0', '#e8a030', '#8a5adc'];
    const house = (X, Y, w, h, seed) => {
      const rr = RNG(seed), C = rr.pick(HOUSEW), roof = rr.pick(ROOFC);
      for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) pb.set(X + xx, Y - yy, xx === w - 1 ? C[2] : yy === h - 1 ? C[0] : C[1]);
      for (let yy = 0; yy < h; yy++) pb.set(X + w, Y - yy - 1, C[3]);                 // lateral en sombra
      if (rr.chance(0.55)) { pb.hline(X - 1, X + w, Y - h, roof); pb.hline(X, X + w, Y - h - 1, shade(roof, 0.25)); }
      else { pb.hline(X, X + w, Y - h, C[0]); if (rr.chance(0.4)) pb.set(X + 1, Y - h - 1, '#86e36f'); }
      if (w > 3 && h > 2) { pb.set(X + 1, Y - 1, '#3a2a40'); if (rr.chance(0.6)) pb.set(X + w - 2, Y - h + 1, rr.chance(0.5) ? '#5ac8e8' : '#3a5a8a'); }
      pb.hline(X + 1, X + w + 1, Y + 1, '#5a2e36');
    };
    for (let k = 0; k < 120; k++) {
      const a = r() * TAU, rad = Math.sqrt(r()) * 44;
      const x = CITY.x + 6 + Math.cos(a) * rad * 1.2, cy = CITY.y + 10 + Math.sin(a) * rad * 0.62;
      if (Math.hypot(x - CITY.x, (cy - CITY.y + 4) * 1.6) < 22 || nearNode(x, cy, 11)) continue;
      const z = worldAt(x, cy); if (z == null || KIND[Math.round(cy) * MW + P(x)] !== 1) continue;
      const bn = BIO[BI[z * MW + P(x)]]; if (bn !== 'city' && bn !== 'sand' && bn !== 'grass') continue;
      const w = r.int(3, 6), h = r.int(3, 5), seed = k * 13 + 5;
      add(x, cy, (X, Y) => house(X, Y, w, h, seed), 1);
    }
    add(CITY.x, CITY.y, (X, Y) => {
      const dc = V.domeCity(pb, X, Y, { k: 0, s: 0.44, label: false, seed: 5 });
      M._city = dc;
    }, 2);
    // torre SYNARA en el altiplano (Núcleo, nodo 10)
    add(342, 176, (X, Y) => { const T = V.synaraTower(pb, X, Y, 34, { k: 0 }); M._tower = T; }, 2);
    /* ---------------- Mesa del Nexo: anfiteatro y sala del consejo en el farallón ---------------- */
    add(236, 106, (X, Y) => {
      V.box3q(pb, X - 9, Y, 18, 5, 5, { ramp: ['#5a3a4a', '#8a6070', '#c09aa0', '#e8d0c8', '#fff4ea'], front: 3, side: 1, top: 4 });
      for (let k = 0; k < 5; k++) { pb.vline(X - 8 + k * 4, Y - 4, Y - 1, '#fff4ea'); pb.vline(X - 7 + k * 4, Y - 4, Y - 1, '#a88a8a'); }
      pb.hline(X - 10, X + 9, Y - 6, '#2a5ac8'); pb.hline(X - 9, X + 8, Y - 7, '#5a8af0'); pb.set(X, Y - 8, '#ffd23a');
    }, 2);
    /* ---------------- cresta de aerogeneradores (rotores animados) ---------------- */
    const rotors = [];
    const tpos = [[392, 104], [414, 92], [436, 82], [460, 76], [486, 80], [510, 84], [532, 98], [552, 112]];
    for (const [tx, ty] of tpos) {
      const gy = groundY(tx, ty); const h = 19 + (tx % 3) * 2;
      add(tx, gy, (X, Y) => { const T = V.turbineTower(pb, X, Y, h, { k: 0.02, w: 2 }); rotors.push({ x: T.hx - PAD, y: T.hy, rot: V.rotor(9, { k: 0.02 }), ph: tx * 0.37 }); pb.hline(X - 2, X + 2, Y + 1, '#5a2e36'); }, 3);
    }
    /* ---------------- campo FV en las dunas ---------------- */
    for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) {
      const x = 318 + col * 26 + row * 3, cy = 200 + row * 9;
      if (nearNode(x + 8, cy, 12)) continue;
      add(x, groundY(x + 8, cy), (X, Y) => V.pvArray(pb, X, Y, { tables: 1, cols: 4, rows: 2, cw: 4, ch: 2, gap: 2, skew: 2 }), 1);
    }
    /* ---------------- bóveda de carga: contenedores BESS en el altiplano ---------------- */
    for (let k = 0; k < 4; k++) add(270 + k * 11, groundY(275 + k * 11, 128 + (k % 2) * 4) , (X, Y) => {
      V.box3q(pb, X, Y, 9, 5, 4, { ramp: ['#16264e', '#24407a', '#3a64b0', '#6c9ce8', '#c8e0ff'], front: 2, side: 1, top: 4 });
      pb.hline(X + 1, X + 7, Y - 3, '#b6f05a'); pb.set(X + 8, Y - 2, '#7cff9a');
    }, 1);
    /* ---------------- ciudadela H2: tanques verdes y torre blanca ---------------- */
    add(512, groundY(512, 186), (X, Y) => {
      V.h2Tank(pb, X - 8, Y, 4, 14, { k: 0 }); V.h2Tank(pb, X + 2, Y + 1, 4, 18, { k: 0 }); V.h2Tank(pb, X + 12, Y, 3, 12, { k: 0 });
    }, 2);
    add(480, groundY(480, 182), (X, Y) => V.cylV(pb, X, Y, 3, 22, ['#4b5b4a', '#727c63', '#8b878b', '#c0bfb1', '#ebeee4'], { dome: 0.6, bands: [[6, 2], [15, 2]] }), 2);
    /* ---------------- salinas: espejos de evaporación por etapas ---------------- */
    const PANS = [['#0a8aa0', '#14c4c8', '#7af4e8'], ['#0a8aa0', '#20d0d0', '#a0f4f0'], ['#14946c', '#2cd08a', '#a0f4b8'], ['#c8904a', '#f0c070', '#ffe8b0'], ['#b07aa8', '#e8b0d8', '#ffe0f0'], ['#d8d0e0', '#f4eef6', '#ffffff']];
    // estanques irregulares (elipses deformadas) con costra blanca arriba y murete en sombra abajo
    for (let k = 0; k < 40; k++) {
      const x = r.int(176, 296), cy = r.int(256, 290);
      if (nearNode(x, cy, 13)) continue;
      const z = worldAt(x, cy); if (z == null || KIND[cy * MW + P(x)] !== 1 || WATER[z * MW + P(x)]) continue; { const bn = BIO[BI[z * MW + P(x)]]; if (bn !== 'salt' && bn !== 'sand') continue; }
      const st = PANS[k % PANS.length], rx = r.int(4, 8), ry = r.range(1.6, 2.6), sd = k;
      add(x, cy, (X, Y) => {
        V.ellipse(pb, X, Y - ry, rx + 1, ry + 1, (nx, ny) => U(ny < -0.3 ? '#fffaf6' : '#b08a92'));
        V.ellipse(pb, X, Y - ry, rx, ry, (nx, ny, d, px, py) => U(ny < -0.45 ? st[0] : (hash2(px >> 1, py, sd) < 0.12 ? '#ffffff' : d < 0.35 ? st[2] : st[1])));
      }, 0);
    }
    // pila de sal blanca
    add(276, groundY(276, 290), (X, Y) => { V.poly(pb, [[X - 6, Y], [X, Y - 8], [X + 6, Y]], U('#fff6fa')); V.poly(pb, [[X, Y - 8], [X + 6, Y], [X + 1, Y]], U('#d4bcd8')); }, 1);
    /* ---------------- oasis: palmeras, laguna con garzas, invernadero ---------------- */
    for (let k = 0; k < 26; k++) {
      const a = r() * TAU, x = 372 + Math.cos(a) * r.range(22, 46), cy = 270 + Math.sin(a) * r.range(8, 16);
      if (nearNode(x, cy, 10)) continue;
      const z = worldAt(x, cy); if (z == null || WATER[z * MW + P(x)] || KIND[Math.round(cy) * MW + P(x)] !== 1) continue;
      const hh = r.int(7, 11), lean = r.range(-2, 2), sd = k * 7;
      add(x, cy, (X, Y) => V.palm(pb, X, Y, hh, lean, sd, {}), 2);
    }
    add(410, groundY(410, 258), (X, Y) => V.greenhouse ? V.greenhouse(pb, X, Y, 18, 8, { k: 0 }) : null, 1);
    /* ---------------- planta SYNARA en la costa (miniatura del héroe R2PLANT reducida 3:1) ---------------- */
    let plant = null;
    try {
      const f = 2.5, wB = Math.round(150 * f), hB = Math.round(76 * f);
      const big = new PixelBuffer(wB, hB);
      const info = R2PLANT.hero(big, wB - 8, hB - 12, { s: 0.72, k: 0, from: 'pretrat', workers: false, lights: false });
      const sm = M.downF(big, f, { sharp: 0.45, sat: 0.15 });
      // recorte a la caja de la planta (en px reducidos)
      const bx0 = Math.max(0, Math.floor(info.x0 / f) - 1), bx1 = Math.min(sm.w, Math.ceil(info.x1 / f) + 1), by0 = Math.max(0, Math.floor(info.y0 / f) - 2), by1 = sm.h;
      const cut = new PixelBuffer(bx1 - bx0, by1 - by0);
      for (let y = 0; y < cut.h; y++) for (let x = 0; x < cut.w; x++) cut.data[y * cut.w + x] = sm.data[(y + by0) * sm.w + x + bx0];
      plant = { pb: cut, mouth: info && info.mouth ? [info.mouth.x / f - bx0, info.mouth.y / f - by0] : null };
    } catch (e) { plant = null; }
    // pie derecho de la planta en la orilla sur-oeste, bajo el nodo 02
    if (plant) add(196, 294, (X, Y) => { V.blit(pb, plant.pb, X - plant.pb.w, Y - plant.pb.h); M._plantAt = [X - plant.pb.w - PAD, Y - plant.pb.h]; }, 4);
    // muelle de captación con torre de toma y faro en la punta oeste
    // punta oeste: primer píxel de tierra de la fila (el muelle sale de la costa hacia el mar)
    const westCoast = (cy) => { for (let X = 0; X < MW; X++) if (KIND[cy * MW + X]) return X - PAD; return 80; };
    const pierX = westCoast(206) + 2, lhX = westCoast(170) + 3;
    add(pierX, 206, (X, Y) => {
      for (let k = 0; k < 26; k++) { pb.set(X - k, Y, '#c97c38'); pb.set(X - k, Y + 1, '#7e4429'); if (k % 4 === 0) pb.vline(X - k, Y + 2, Y + 4, '#4a2a2a'); }
      V.cylV(pb, X - 28, Y + 1, 3, 9, ['#4f4d51', '#716f76', '#b5aba8', '#d3ccc5', '#f2efea'], { dome: 0.5, bands: [[3, 2, ['#163e66', '#245f90', '#31b4e2']]] });
    }, 2);
    add(lhX, 172, (X, Y) => V.lighthouse(pb, X, Y, 16, { k: 0 }), 3);
    /* ---------------- orden de pintor ---------------- */
    items.sort((a, b) => a.y - b.y || a.z - b.z);
    for (const it of items) it.fn(P(it.x), Math.round(it.y));
    /* ---------------- cascadas (estáticas + vetas animadas) ---------------- */
    const falls = [];
    for (let X = 0; X < MW; X++) for (let y = 1; y < MH; y++) {
      const i = y * MW + X;
      if (KIND[i] !== 2) continue;
      const z = ZW[i]; if (z < 0 || WATER[z * MW + X] !== 2) continue;
      // inicio de tramo de cascada en esta columna
      if (KIND[i - MW] === 2 && WATER[ZW[i - MW] * MW + X] === 2) continue;
      let y1 = y; while (y1 + 1 < MH && KIND[(y1 + 1) * MW + X] === 2 && WATER[ZW[(y1 + 1) * MW + X] * MW + X] === 2) y1++;
      if (y1 - y >= 4) falls.push({ x: X - PAD, y0: y, y1: y1 + 1, w: 1 });
    }
    // agrupa columnas contiguas
    falls.sort((a, b) => a.x - b.x);
    const F2 = [];
    for (const f of falls) { const l = F2[F2.length - 1]; if (l && f.x === l.x + l.w && Math.abs(f.y0 - l.y0) < 4) { l.w++; l.y1 = Math.max(l.y1, f.y1); } else F2.push(Object.assign({}, f)); }
    for (const f of F2) for (let y = f.y1; y < Math.min(MH, f.y1 + 3); y++) for (let x = f.x - 1; x <= f.x + f.w; x++) { const X = P(x); if (X >= 0 && X < MW && !KIND[y * MW + X]) pb.data[y * MW + X] = U(hash2(x, y, 4) < 0.6 ? '#ffffff' : '#c6f4f8'); }
    /* ---------------- sombras de nube (cúmulos en dos bandas de alfa plano) ---------------- */
    const clouds = [];
    for (let ci = 0; ci < 3; ci++) {
      const cw = 110 + ci * 24, chh = 40, cb = new PixelBuffer(cw, chh), rr = RNG(500 + ci);
      const blobs = []; for (let k = 0; k < 5; k++) blobs.push([rr.int(20, cw - 20), rr.int(14, chh - 12), rr.int(14, 24), rr.int(7, 11)]);
      const inside = (x, y, grow) => blobs.some(([bx, by, ax, ay]) => ((x - bx) / (ax + grow)) ** 2 + ((y - by) / (ay + grow)) ** 2 <= 1);
      const outer = ((36 << 24) | (0x6a << 16) | (0x1a << 8) | 0x2a) >>> 0, inner = ((58 << 24) | (0x6a << 16) | (0x1a << 8) | 0x2a) >>> 0;
      for (let y = 0; y < chh; y++) for (let x = 0; x < cw; x++) { if (inside(x, y, -4)) cb.data[y * cw + x] = inner; else if (inside(x, y, 0)) cb.data[y * cw + x] = outer; }
      clouds.push(cb.toCanvas());
    }
    // nubes blancas de cúmulo pequeñas que flotan sobre el mapa
    const puffs = [];
    for (let ci = 0; ci < 3; ci++) { try { puffs.push(V.cumulus(70 + ci * 16, 30, 70 + ci, { sun: -0.6 }).toCanvas()); } catch (e) { /* sin nubes */ } }
    /* ---------------- fauna, LED y destellos ---------------- */
    const fauna = [
      { kind: 'gull', x: 120, y: 70, r: 160, sp: 7 }, { kind: 'gull', x: 560, y: 250, r: 120, sp: -6 },
      { kind: 'gull', x: 40, y: 260, r: 120, sp: 5 }, { kind: 'eagle', x: 330, y: 50, r: 200, sp: 4 },
      { kind: 'drone', x: 300, y: 120, r: 80, sp: 9 }, { kind: 'drone', x: 470, y: 160, r: 60, sp: -8 },
    ];
    const leds = [];
    if (M._tower && M._tower.beacon) leds.push([M._tower.beacon[0] - PAD, M._tower.beacon[1], '#56e5ff']);
    const ground = (id) => { const n = MAP_NODES[id]; return [n.x, groundY(n.x, n.y + 6)]; };
    return { c: pb.toCanvas(), clouds, puffs, rotors, falls: F2, fauna, leds, ground, plantMouth: plant && plant.mouth };
  };
  /** Nodos del mapa: insignias-isla flotantes con sombra en el suelo, número y anillo de selección */
  M.drawMapNodes = function (g, sc, ox, oy, t) {
    const I = sc.isl;
    for (const n of MAP_NODES) {
      const un = GS.s.unlocked.includes(n.id), done = GS.s.completed.includes(n.id), sel = sc.sel === n.id;
      const acc = LEVEL_CARD_ACCENT[n.id] || '#56e5ff';
      const nx = n.x + ox, ny = n.y + oy, bob = Math.round(Math.sin(t * 1.6 + n.id * 1.3) * 1.2);
      // sombra de contacto en el suelo bajo la isla flotante (elipse violeta de alfa plano)
      const gr = I.ground(n.id);
      g.globalAlpha = 0.35; g.fillStyle = '#2a0a3a'; g.beginPath(); g.ellipse(gr[0] + ox, gr[1] + oy + 4, 10, 3, 0, 0, TAU); g.fill(); g.globalAlpha = 1;
      const st = done ? 'done' : un ? 'open' : 'locked';
      const b = M.badge(n.id, st, n.icon, acc);
      g.drawImage(b, nx - 20, ny - 22 + bob);
      if (sel) { for (let a = 0; a < 20; a++) { const an = a / 20 * TAU + t * 2; const rr = 17 + Math.sin(t * 6); fpx(g, nx + Math.cos(an) * rr, ny + 5 + bob + Math.sin(an) * rr * 0.42, a % 2 ? '#fff2a0' : '#ffd23a'); } }
      UIK.pill(g, nx, ny + 15 + bob, String(n.id).padStart(2, '0'), { align: 'center', rim: un ? acc : '#3a4a6a', fill: '#031128', color: '#e8fcff' });
    }
  };
  /** Capa viva del mapa (≈ 30 drawImage + ≈ 60 fillRect por cuadro) */
  M.drawIslandLive = function (g, I, ox, oy, t) {
    for (const R of I.rotors) V.drawRotor(g, R.rot, R.x + ox, R.y + oy, t * 2.6 + R.ph);
    if (I.falls.length) V.drawFalls(g, I.falls, ox, oy, t, { alpha: 0.8 });
    if (V.drawLights && I.leds.length) for (const [x, y, col] of I.leds) { if (Math.sin(t * 4 + x) > 0) { g.drawImage(M.glow(col, 5, 0.6), x + ox - 5, y + oy - 5); fpx(g, x + ox, y + oy, '#ffffff'); } }
    V.drawFauna(g, I.fauna, ox, oy, t);
    // cúmulos blancos que derivan por encima del mapa
    for (let i = 0; i < I.puffs.length; i++) { const c = I.puffs[i]; const x = ((t * (3 + i) + i * 300) % (W + 260)) - 150, y = [2, 18, 8][i % 3]; g.drawImage(c, Math.round(x), y); }
  };
})();
