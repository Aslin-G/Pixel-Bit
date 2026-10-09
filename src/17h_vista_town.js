/* =====================================================================
   17h_vista_town.js — Ciudad en colina del panorama (VISTA), en 3/4.
   Casas encaladas/ocres con ventanas en arco, contraventanas, balcones,
   buganvillas y techos variados (cúpula, teja, terraza con pérgola, FV,
   depósito, campanario); filas de casas escalonadas con muros de
   contención, escaleras y jardines; cipreses; banderines; la torre de
   SYNARA (obelisco blanco con franjas turquesa y punta cian); cometas,
   banderas y fuegos artificiales dinámicos. Sin tramado.
   API:
     VISTA.WALLS                                     rampas de fachada
     VISTA.townHouse(pb, x, y, w, h, seed, {k, pal, roof, d, s, lit, flowers}) → {x,y,w,h,dx,dy,top,wins,roof:[x,y]}
     VISTA.cypress(pb, x, y, h, seed, {k})
     VISTA.bunting(pb, x0, y0, x1, y1, sag, {k, cols, step})
     VISTA.hillTown(pb, {x0, x1, seed, k, rows:[{y(x), w:[a,b], h:[a,b], gap:[a,b], wall:{h, kind}, veg, roofs, pals, skip(x,w)}], lit, bunting}) → {houses, wins, tops}
     VISTA.synaraTower(pb, x, y, h, {k}) → {top, tip:[x,y], glows:[[x,y,r]], beacon:[x,y]}
     VISTA.litWindows(pb, wins, {k, col, halo})       ventanas encendidas (tarde/noche), horneado
     VISTA.drawKites(g, list, ox, oy, t)             list: [{x, y, col, sp, ph, tail}]
     VISTA.drawFlags(g, list, ox, oy, t)             list: [{x, y, col}] (mástil ya horneado)
     VISTA.drawFireworks(g, list, ox, oy, t)         list: [{x, y, col, ph, per, r}]
   ===================================================================== */
(() => {
  const V = VISTA;
  const ramp = (r, k) => V.P32(V.hz(r, k || 0));
  const WALLS = {
    white: ['#5a5466', '#7e7686', '#a39aa4', '#c4bcc0', '#ddd6d4', '#efe9e2', '#faf6ee', '#ffffff'],
    ochre: ['#4a2c1c', '#6e4428', '#946034', '#b67e44', '#d09c5a', '#e4b874', '#f2d296', '#fae6be'],
    terra: ['#3c1a14', '#5e2a1e', '#86402a', '#a85a38', '#c8764a', '#e09464', '#f0b484', '#f8d0a8'],
    sand: ['#4c3a2c', '#6e5640', '#927456', '#b4946e', '#ceb08a', '#e2caa4', '#f0e0c0', '#faf0dc'],
    rose: ['#4a2a36', '#6e3e4c', '#965a66', '#ba7a82', '#d49aa0', '#e8bcbc', '#f4d8d4', '#fcece6'],
    aqua: ['#1e3a42', '#2e5660', '#447a82', '#5e9ca2', '#80bcbe', '#a6d6d4', '#c8eae4', '#e8f8f2'],
  };
  V.WALLS = WALLS;
  const BLUEW = ['#0e1f3a', '#15305a', '#1e4a7c', '#2e6aa0', '#4a8cc0', '#7ab4e0', '#b4daf4'];
  const SHUT = [['#0e2a4a', '#1e4a7c', '#3a78b0'], ['#0e3a3a', '#1a6a6a', '#30a0a0'], ['#1e3a14', '#3a6a24', '#5a9a34'], ['#4a1a10', '#8a3020', '#c05030']];
  const TILE = ['#3a140c', '#5e2214', '#86341c', '#a84a26', '#c86434', '#e08448', '#f0a464'];
  const DOMEB = ['#0e1f3a', '#15305a', '#1e4a7c', '#2e6aa0', '#4a8cc0', '#7ab4e0', '#b4daf4', '#e6f4fc'];
  const DOMEW = ['#7e7686', '#a39aa4', '#c4bcc0', '#ddd6d4', '#efe9e2', '#faf6ee', '#ffffff'];
  const WOOD = ['#2a140a', '#4a2814', '#6e4020', '#94603a', '#b8845a'];
  const AWN = [['#7a1a1a', '#c03030', '#f06a5a'], ['#0a4a5a', '#108a9a', '#30c0c8'], ['#7a5a0a', '#c09a20', '#f0d04a'], ['#4a1a6a', '#7a3aa0', '#a868d0']];
  const PVR = ['#16214a', '#1e2a55', '#2a3a6c', '#3f5590', '#6a7aa4', '#8b9cc2', '#b7c7e7'];
  const GOLD = U('#f0c040');
  /** Ventana en arco (2–3 px de ancho) con reflejo arriba-izquierda y alféizar claro */
  function win(pb, x, y, ww, wh, WIN, sill, arch) {
    for (let yy = 0; yy < wh; yy++) for (let xx = 0; xx < ww; xx++) {
      if (arch && yy === 0 && ww >= 3 && (xx === 0 || xx === ww - 1)) continue;
      let i = yy === wh - 1 ? 0 : (xx === 0 && yy <= 1) ? 4 : (yy < wh * 0.45) ? 2 : 1;
      if (ww >= 3 && xx === 1 && yy > 0 && yy < wh - 1) i = Math.max(0, i - 1); // montante
      V.put(pb, x + xx, y + yy, WIN[i]);
    }
    for (let xx = -1; xx <= ww; xx++) V.put(pb, x + xx, y + wh, sill);
  }
  /** Casa de la ciudad en 3/4 (más detalle que VISTA.house: arcos, balcones, techos variados) */
  V.townHouse = function (pb, x, y, w, h, seed, o = {}) {
    const r = RNG(seed), k = o.k || 0;
    const palName = o.pal || r.pick(['white', 'white', 'white', 'ochre', 'sand', 'white', 'terra', 'rose', 'aqua']);
    const pal = V.hz(WALLS[palName] || WALLS.white, k), R = V.P32(pal), n = R.length;
    const d = o.d ?? Math.max(3, Math.round(w * 0.42));
    const { dx, dy } = V.box3q(pb, x, y, w, h, d, { ramp: pal, front: n - 3, side: 2, top: n - 1 });
    const WIN = ramp(BLUEW, k), sill = R[n - 1], shadow = R[Math.max(0, n - 5)];
    // canto iluminado izquierdo y zócalo con manchas de humedad
    for (let yy = y - h + 1; yy < y; yy++) V.put(pb, x, yy, R[n - 2]);
    for (let xx = x + 1; xx < x + w; xx++) if (hash2(xx >> 1, y, seed) < 0.5) V.put(pb, xx, y - 2, R[n - 4]);
    // cornisa: sombra 1 px bajo el borde del techo
    for (let xx = x + 1; xx < x + w; xx++) V.put(pb, xx, y - h + 1, shadow);
    const big = (o.s ?? (w >= 15 ? 2 : 1)) >= 2;
    const ww = big ? 3 : (w >= 8 ? 2 : 1), wh = big ? 5 : (h >= 8 ? 3 : 2), fh = big ? 8 : 5, sp = big ? 6 : 4;
    const floors = Math.max(1, Math.floor((h - 3) / fh));
    const nC = Math.max(1, Math.floor((w - 2) / sp));
    const x0 = x + Math.round((w - (nC * sp - (sp - ww))) / 2);
    const shut = r.chance(big ? 0.6 : 0.2) ? ramp(r.pick(SHUT), k) : null;
    const wins = [];
    const doorC = big ? Math.floor(nC / 2) : -1;
    for (let f = 0; f < floors; f++) {
      const wy = y - h + 3 + f * fh;
      if (wy + wh > y - 1) break;
      const ground = f === floors - 1 && floors > 1;
      for (let c = 0; c < nC; c++) {
        const wx = x0 + c * sp;
        if (wx + ww > x + w - 1) break;
        if (ground && c === doorC) {
          // puerta en arco de madera o azul
          const D = r.chance(0.5) ? ramp(WOOD, k) : WIN;
          for (let yy = wy - 1; yy < y; yy++) for (let xx = 0; xx < ww; xx++) { if (yy === wy - 1 && (xx === 0 || xx === ww - 1)) continue; V.put(pb, wx + xx, yy, D[yy < wy + 1 ? 3 : xx === 0 ? 2 : 1]); }
          continue;
        }
        if (r.chance(0.08)) continue;
        win(pb, wx, wy, ww, wh, WIN, sill, big);
        if (shut && big) for (let yy = 0; yy < wh; yy++) { V.put(pb, wx - 1, wy + yy, shut[(yy & 1) ? 1 : 2]); V.put(pb, wx + ww, wy + yy, shut[(yy & 1) ? 0 : 1]); }
        wins.push([wx, wy, ww, wh]);
      }
      // balcón de hierro en la planta alta (casas grandes)
      if (big && f === 0 && floors >= 2 && r.chance(0.55)) {
        const by = wy + wh + 1, IR = U(V.hzc('#2a2030', k)), IL = U(V.hzc('#5a5070', k));
        for (let xx = x + 1; xx < x + w - 1; xx++) { V.put(pb, xx, by - 2, IL); if ((xx & 1) === 0) V.put(pb, xx, by - 1, IR); V.put(pb, xx, by, R[n - 1]); V.put(pb, xx, by + 1, shadow); }
      }
    }
    // toldo rayado sobre la planta baja
    if (o.awning ?? (big && r.chance(0.35))) {
      const A = ramp(r.pick(AWN), k), ay = y - Math.min(h - 2, fh + 1);
      for (let xx = x - 1; xx < x + w + 1; xx++) { const st = ((xx - x) >> 1) & 1; V.put(pb, xx, ay, A[st ? 2 : 1]); V.put(pb, xx, ay + 1, A[st ? 1 : 0]); if ((xx - x) % 3 === 0) V.put(pb, xx, ay + 2, A[0]); }
    }
    // buganvilla que cuelga de una esquina
    if (r.chance(o.flowers ?? 0.35)) {
      const BG = ramp(RAMP.bougainR, k), LF = ramp(['#1e3a14', '#2e5a1c', '#4a7a24'], k);
      const side = r.chance(0.5) ? 0 : 1, fx = side ? x + w - 2 : x + 1, len = r.int(3, Math.max(4, Math.round(h * 0.7)));
      for (let i = 0; i < len * 4; i++) {
        const yy = y - h + 1 + Math.floor(Math.pow(r(), 1.6) * len), xx = fx + (side ? -1 : 1) * Math.floor(r() * Math.max(2, (len - (yy - (y - h))) * 0.6));
        V.put(pb, xx, yy, r.chance(0.3) ? LF[r.int(0, 2)] : BG[r.int(0, 2)]);
      }
    }
    // techo
    const roof = o.roof || r.pick(['flat', 'dome', 'tiles', 'terrace', 'solar', 'tiles', 'terrace', 'tank']);
    const rcx = Math.round(x + w / 2 + dx / 2), rcy = Math.round(y - h - dy / 2);
    let top = y - h - dy;
    if (roof === 'dome') {
      const rr = Math.max(2, Math.round(w * 0.3)), D = ramp(r.chance(0.6) ? DOMEB : DOMEW, k), nD = D.length;
      if (rr >= 4) for (let xx = -rr + 1; xx < rr; xx++) for (let q = 0; q < 2; q++) V.put(pb, rcx + xx, rcy - q, R[xx < 0 ? n - 2 : n - 4]);
      const by = rcy - (rr >= 4 ? 2 : 0);
      V.ellipse(pb, rcx + 0.5, by + 0.5, rr + 0.5, rr * 0.92 + 0.5, (nx, ny) => {
        if (ny > 0.05) return 0;
        let t = 0.62 - nx * 0.42 - ny * 0.3;
        if (rr >= 5 && Math.abs(((nx * 2.2 + 3) % 1) - 0.5) < 0.12) t -= 0.18; // nervios
        return D[clamp(Math.round(t * (nD - 1)), 0, nD - 1)];
      });
      for (let q = 1; q <= 2 + (rr >> 2); q++) V.put(pb, rcx, by - Math.round(rr * 0.92) - q, q === 1 ? D[2] : GOLD);
      top = by - Math.round(rr * 0.92) - 3;
    } else if (roof === 'tiles') {
      const T = ramp(TILE, k), nT = T.length, rh = Math.max(2, Math.round(dy * 0.6 + w * 0.08));
      const ry = y - h - Math.round(dy / 2) - rh, rx0 = x + Math.round(dx / 2);
      V.poly(pb, [[x - 1, y - h + 1], [x + w + 1, y - h + 1], [rx0 + w, ry], [rx0, ry]], (px, py) => {
        const row = (py - ry) >> 1, joint = ((px + row * 2) % 4) === 0;
        let i = (py - ry) % 2 === 0 ? nT - 2 : nT - 4;
        if (joint) i -= 1; if (py >= y - h) i = 1;
        if (hash2(px, py, seed) < 0.06) i -= 1;
        return T[clamp(i, 0, nT - 1)];
      });
      V.poly(pb, [[x + w + 1, y - h + 1], [x + w + dx, y - h - dy + 1], [rx0 + w, ry]], (px, py) => T[((py & 1) ? 1 : 2)]);
      for (let xx = rx0; xx <= rx0 + w; xx++) V.put(pb, xx, ry, T[nT - 1]);
      for (let xx = x; xx < x + w; xx++) V.put(pb, xx, y - h + 2, shadow);
      top = ry;
    } else if (roof === 'terrace') {
      // parapeto, pérgola con parra, macetas y toldo
      const Wd = ramp(WOOD, k), G = ramp(RAMP.foliageR.slice(2, 8), k);
      const px0 = x + 1 + Math.round(dx * 0.3), px1 = px0 + Math.max(4, Math.round(w * 0.55)), py = rcy + 1;
      if (w >= 9) {
        for (const pxx of [px0, px1]) for (let q = 0; q < 4; q++) V.put(pb, pxx, py - q, Wd[2]);
        for (let xx = px0 - 1; xx <= px1 + 1; xx++) { V.put(pb, xx, py - 4, Wd[3]); if (hash2(xx, py, seed) < 0.75) V.put(pb, xx, py - 5, G[r.int(1, 5)]); }
        top = Math.min(top, py - 6);
      }
      for (let i = 0; i < 3; i++) { const qx = x + 2 + r.int(0, Math.max(0, w - 4)) + Math.round(dx * 0.6), qy = y - h - r.int(1, Math.max(1, dy - 1)); V.put(pb, qx, qy, U(V.hzc('#a8603a', k))); V.put(pb, qx, qy - 1, G[3]); V.put(pb, qx + 1, qy - 1, G[2]); V.put(pb, qx, qy - 2, G[5]); }
      if (r.chance(0.5)) { const A = ramp(r.pick(AWN), k); for (let xx = x + w - 5; xx < x + w; xx++) { V.put(pb, xx, y - h - 3, A[2]); V.put(pb, xx, y - h - 2, A[1]); V.put(pb, xx + 1, y - h - 1, A[0]); } top = Math.min(top, y - h - 3); }
    } else if (roof === 'solar') {
      const S = ramp(PVR, k), FR = U(V.hzc('#d7dbe8', k));
      const rows = Math.max(1, Math.floor(dy / 2));
      for (let j = 0; j < rows; j++) {
        const yy = y - h - 1 - j * 2, xo = x + 1 + Math.round(j * dx / Math.max(1, rows));
        for (let xx = xo; xx < xo + w - 2; xx++) { V.put(pb, xx, yy - 1, (xx - xo) % 4 === 0 ? S[4] : S[2 + ((xx + j) % 3 === 0 ? 1 : 0)]); V.put(pb, xx, yy, (xx - xo) % 4 === 0 ? FR : S[1]); V.put(pb, xx, yy - 2, S[5]); }
      }
      top = y - h - dy - 2;
    } else if (roof === 'tank') {
      V.cylV(pb, x + w - 3 + Math.round(dx / 2), rcy, 2, 4, WALLS.white, { k, ell: 1 });
      const S = ramp(PVR, k);
      for (let xx = x + 2; xx < x + 2 + Math.min(6, w - 5); xx++) { V.put(pb, xx + 1, rcy - 1, S[3]); V.put(pb, xx, rcy, S[2]); }
      top = rcy - 6;
    } else if (roof === 'belfry') {
      const bw = Math.max(4, Math.round(w * 0.38)), bh = Math.max(5, Math.round(bw * 1.3)), bx = rcx - (bw >> 1);
      V.box3q(pb, bx, rcy + 1, bw, bh, 3, { ramp: pal, front: n - 3, side: 2, top: n - 1 });
      for (let yy = rcy - bh + 3; yy < rcy - 1; yy++) V.put(pb, bx + (bw >> 1), yy, WIN[0]);
      const D = ramp(DOMEB, k);
      V.ellipse(pb, bx + bw / 2 + 0.5, rcy - bh + 0.5, bw / 2 + 0.5, bw / 2, (nx, ny) => ny > 0 ? 0 : D[clamp(Math.round((0.6 - nx * 0.4 - ny * 0.3) * 7), 0, 7)]);
      V.put(pb, bx + (bw >> 1), rcy - bh - Math.round(bw / 2) - 1, GOLD);
      top = rcy - bh - Math.round(bw / 2) - 2;
    } else {
      // azotea plana: parapeto, antena o macetas
      if (r.chance(0.4)) { const ax = x + 2 + Math.round(dx / 2); for (let q = 0; q < 4; q++) V.put(pb, ax, rcy - q, U(V.hzc('#5a5466', k))); V.put(pb, ax - 1, rcy - 3, U(V.hzc('#8a8296', k))); V.put(pb, ax + 1, rcy - 3, U(V.hzc('#8a8296', k))); top = rcy - 4; }
    }
    // sombra de contacto (granate/violeta) a la derecha de la base
    for (let xx = x + w + dx; xx < x + w + dx + 2; xx++) for (let yy = y - dy; yy <= y; yy++) { const c = V.get(pb, xx, yy); if (c >>> 24 && yy > y - dy + 1) V.put(pb, xx, yy, V.shU(c, -0.2, 265)); }
    if (o.lit) V.litWindows(pb, wins, { k, ...o.lit });
    return { x, y, w, h, dx, dy, top, wins, roof: [rcx, top] };
  };
  /** Ventanas encendidas al atardecer: cristal cálido y halo horneado en la fachada */
  V.litWindows = function (pb, wins, o = {}) {
    const k = o.k || 0, Wm = V.P32(V.hz(o.ramp || ['#a0401a', '#e08a3a', '#ffc860', '#fff0b0'], k * 0.6)), HC = U(o.halo || '#ffb050');
    for (const [x, y, w, h] of wins) {
      if (hash2(x, y, 13) < (o.off ?? 0.25)) continue;
      for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) V.put(pb, x + xx, y + yy, Wm[yy === 0 ? 3 : yy < h / 2 ? 2 : 1]);
      for (let yy = -1; yy <= h; yy++) for (let xx = -1; xx <= w; xx++) {
        if (yy >= 0 && yy < h && xx >= 0 && xx < w) continue;
        const c = V.get(pb, x + xx, y + yy); if (c >>> 24) V.put(pb, x + xx, y + yy, V.mixU(c, HC, 0.35));
      }
    }
  };
  /** Ciprés: huso verde oscuro con luz a la izquierda */
  V.cypress = function (pb, x, y, h, seed, o = {}) {
    const R = ramp(o.ramp || ['#0e1a10', '#16281a', '#1e3a22', '#2c5028', '#3e6a30', '#5a8a3c'], o.k), n = R.length;
    const wmax = Math.max(2, Math.round(h * 0.16));
    for (let yy = 0; yy < h; yy++) {
      const t = yy / h, hw = Math.max(0.6, wmax * Math.sin(Math.min(1, (1 - t) * 1.25) * Math.PI * 0.62) * (t < 0.12 ? t / 0.12 + 0.2 : 1));
      for (let xx = -Math.ceil(hw); xx <= Math.ceil(hw); xx++) {
        if (Math.abs(xx) > hw + 0.3) continue;
        const nx = xx / (hw + 0.5);
        let i = Math.round((0.55 - nx * 0.4 + (hash2(x + xx, (y - yy) >> 1, seed) - 0.5) * 0.4) * (n - 1));
        if (Math.abs(xx) >= Math.floor(hw) && nx > 0) i -= 1;
        V.put(pb, x + xx, y - yy, R[clamp(i, 0, n - 1)]);
      }
    }
  };
  /** Guirnalda de banderines horneada (cordel combado + triángulos de colores) */
  V.bunting = function (pb, x0, y0, x1, y1, sag, o = {}) {
    const k = o.k || 0, cols = (o.cols || ['#e83b41', '#f5dc5a', '#11bedd', '#8d6bff', '#ff9f43', '#3fe0a0']).map(c => U(V.hzc(c, k))), str = U(V.hzc('#4a3a3a', k));
    const n = Math.max(2, Math.round(Math.abs(x1 - x0)));
    const step = o.step || 4;
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = Math.round(lerp(x0, x1, t)), y = Math.round(lerp(y0, y1, t) + Math.sin(t * Math.PI) * sag);
      V.put(pb, x, y, str);
      if (i % step === 1 && i < n - 1) {
        const c = cols[((i / step) | 0) % cols.length];
        V.put(pb, x, y + 1, c); V.put(pb, x + 1, y + 1, c); V.put(pb, x, y + 2, V.shU(c, -0.2, 260));
        if (o.big) { V.put(pb, x - 1, y + 1, c); V.put(pb, x, y + 3, V.shU(c, -0.3, 260)); }
      }
    }
  };
  /** Vegetación de jardín entre casas (árbol, palmera, ciprés o arbusto) */
  function gardenVeg(pb, x, y, r, k, scale) {
    const kind = r.pick(['tree', 'tree', 'cypress', 'palm', 'shrub', 'cypress']);
    if (kind === 'tree') V.tree(pb, x, y, Math.round(r.range(3, 5.5) * scale), r.int(1, 1e6), { k });
    else if (kind === 'cypress') V.cypress(pb, x, y, Math.round(r.range(10, 18) * scale), r.int(1, 1e6), { k });
    else if (kind === 'palm') V.palm(pb, x, y, Math.round(r.range(14, 22) * scale), r.range(-3, 3), r.int(1, 1e6), { k });
    else V.shrub(pb, x, y, Math.round(r.range(2, 4) * scale), r.int(1, 1e6), { k });
  }
  /**
   * Filas de casas escalonadas en la ladera (de atrás hacia delante). Cada fila:
   * y(x) = línea de base; casas con solapes aleatorios (orden por profundidad),
   * huecos con jardín, muro de contención con cornisa iluminada y escaleras.
   */
  V.hillTown = function (pb, o) {
    const r = RNG(o.seed || 1), k = o.k || 0, out = { houses: [], wins: [], tops: [] };
    const STN = ramp(o.wallRamp || ['#4a2a22', '#6e4232', '#906048', '#b07e5e', '#c8987a', '#dcb494', '#ecd0b0'], k), nS = STN.length;
    for (let ri = 0; ri < o.rows.length; ri++) {
      const row = o.rows[ri], items = [], sc = row.scale || 1;
      // jardín de fondo (detrás de las casas)
      for (let x = o.x0 + r.int(0, 10); x < o.x1; x += r.int(row.vegGap?.[0] ?? 10, row.vegGap?.[1] ?? 26)) {
        if (row.skip && row.skip(x, 1)) continue;
        if (r.chance(row.veg ?? 0.5)) gardenVeg(pb, x, row.y(x) - r.int(1, 3), r, k, sc);
      }
      for (let x = o.x0 + r.int(0, 6); x < o.x1;) {
        const w = r.int(row.w[0], row.w[1]), h = r.int(row.h[0], row.h[1]);
        if (row.skip && row.skip(x, w)) { x += Math.max(4, w >> 1); continue; }
        if (r.chance(row.hole ?? 0.1)) { x += Math.round(w * 0.8); continue; }
        items.push({ x, y: Math.round(row.y(x + w / 2)) + r.int(-1, 2), w, h, seed: (o.seed || 1) * 7919 + ri * 1009 + x });
        x += w + r.int(row.gap[0], row.gap[1]);
      }
      items.sort((a, b) => a.y - b.y);
      for (const it of items) {
        const roofs = row.roofs, roof = roofs ? r.pick(roofs) : null;
        const hs = V.townHouse(pb, it.x, it.y, it.w, it.h, it.seed, { k, roof, pal: row.pals ? r.pick(row.pals) : null, flowers: row.flowers, s: row.s, lit: o.lit });
        out.houses.push(hs); out.wins.push(...hs.wins); out.tops.push([it.x + (it.w >> 1), hs.top, ri]);
      }
      // muro de contención delante de la fila (cornisa iluminada, hiladas, sombra)
      if (row.wall) {
        const wh = row.wall.h || 4;
        for (let x = o.x0; x < o.x1; x++) {
          if (row.skip && row.skip(x, 1)) continue;
          const y0 = Math.round(row.y(x));
          for (let q = 0; q < wh; q++) {
            const course = (q % 3 === 2), joint = ((x + (((q / 3) | 0) & 1) * 3) % 6) === 0;
            let i = q === 0 ? nS - 1 : course ? 2 : joint ? 3 : 4 + (hash2(x >> 1, q, 5) < 0.3 ? 1 : 0);
            if (q === wh - 1) i = 1;
            V.put(pb, x, y0 + 1 + q, STN[i]);
          }
        }
        // escaleras blancas que bajan por el muro
        for (let x = o.x0 + r.int(20, 60); x < o.x1; x += r.int(70, 160)) {
          if (row.skip && row.skip(x, 6)) continue;
          const y0 = Math.round(row.y(x)), Wt = ramp(WALLS.white, k);
          for (let q = 0; q < wh + 1; q++) { V.put(pb, x + q, y0 + q, Wt[7]); V.put(pb, x + q + 1, y0 + q, Wt[5]); V.put(pb, x + q + 2, y0 + q, Wt[3]); V.put(pb, x + q, y0 + q + 1, Wt[1]); }
        }
      }
      // guirnaldas entre tejados de la fila
      if (o.bunting && row.bunting !== false) {
        const tops = out.tops.filter(t => t[2] === ri).sort((a, b) => a[0] - b[0]);
        for (let i = 0; i + 1 < tops.length; i++) {
          const a = tops[i], b = tops[i + 1];
          if (b[0] - a[0] < 12 || b[0] - a[0] > 60 || !r.chance(o.bunting)) continue;
          V.bunting(pb, a[0], a[1] + 3, b[0], b[1] + 3, Math.min(6, (b[0] - a[0]) * 0.12), { k, step: sc > 1.3 ? 5 : 4, big: sc > 1.3 });
        }
      }
    }
    return out;
  };
  /**
   * Mosaico de huertas en perspectiva (llano lejano): parcelas de cultivo en
   * hileras, barbecho, setos y caminos; las parcelas crecen hacia el espectador.
   * o: {k, seed, gold (0..1 cosecha dorada), irrig (canales turquesa)}
   */
  V.fields = function (pb, x0, x1, y0, y1, o = {}) {
    const r = RNG(o.seed || 3), k = o.k || 0;
    const CROPS = [['#2e5426', '#3f6e2e', '#5a8a34', '#7aa83c'], ['#46601c', '#62801e', '#84a228', '#a8c034'], ['#5a431c', '#86502d', '#a8683a', '#cb824a'], ['#8a6a1c', '#b08a24', '#d4ac34', '#ecc84a'], ['#3a5818', '#56761c', '#78962a', '#9cb434']];
    const HED = ramp(['#16260e', '#243c12', '#3a5818'], k), PATH = ramp(['#b4946e', '#ceb08a', '#e2caa4'], k), CH = ramp(['#0a8ab0', '#11bedd', '#3adcf1'], k);
    let y = y0;
    while (y < y1) {
      const t = (y - y0) / Math.max(1, y1 - y0), bh = Math.max(2, Math.round(2 + t * 7));
      for (let x = x0 - r.int(0, 30); x < x1;) {
        const bw = r.int(18, 60) + Math.round(t * 30);
        let ci = r.int(0, CROPS.length - 1); if (o.gold && r.chance(o.gold)) ci = 3;
        const C = ramp(CROPS[ci], k);
        for (let yy = y; yy < Math.min(y1, y + bh); yy++) for (let xx = Math.max(x0, x); xx < Math.min(x1, x + bw); xx++) {
          const row = ((xx + (yy - y) * 2) % 3) === 0;
          V.put(pb, xx, yy, C[yy === y ? 3 : row ? 0 : 1 + (hash2(xx >> 1, yy, 5) < 0.4 ? 1 : 0)]);
        }
        // seto o camino en el borde derecho de la parcela
        const edge = r.chance(0.5) ? HED : PATH;
        for (let yy = y; yy < Math.min(y1, y + bh); yy++) V.put(pb, x + bw, yy, edge[1]);
        x += bw + 1;
      }
      // linde inferior: seto con copas, a veces canal de riego
      const irr = o.irrig && r.chance(0.35);
      for (let xx = x0; xx < x1; xx++) { V.put(pb, xx, y + bh, irr ? CH[1 + ((xx >> 2) & 1)] : HED[hash2(xx >> 1, y, 7) < 0.5 ? 0 : 1]); if (!irr && hash2(xx, y, 9) < 0.12) V.put(pb, xx, y + bh - 1, HED[2]); }
      y += bh + 1;
    }
  };
  /**
   * Edificio cívico: 'arcade' (mercado con soportales en arco y teja), 'church'
   * (nave con campanario y cúpula azul), 'school' (pabellón con cubierta FV).
   */
  V.civic = function (pb, x, y, w, h, seed, o = {}) {
    const k = o.k || 0, kind = o.kind || 'arcade';
    const hs = V.townHouse(pb, x, y, w, h, seed, { k, pal: o.pal || 'white', roof: kind === 'school' ? 'solar' : kind === 'church' ? 'dome' : 'tiles', s: 2, flowers: 0.6, awning: false, lit: o.lit });
    const R = V.P32(V.hz(WALLS[o.pal || 'white'], k)), n = R.length, D = ramp(BLUEW, k);
    if (kind === 'arcade' || kind === 'school') {
      // soportales: arcos oscuros con columnas iluminadas en la planta baja
      const ah = Math.min(h - 4, 8), aw = 4;
      for (let ax = x + 2; ax + aw < x + w - 1; ax += aw + 2) {
        for (let yy = y - ah; yy < y; yy++) for (let xx = 0; xx < aw; xx++) { if (yy === y - ah && (xx === 0 || xx === aw - 1)) continue; V.put(pb, ax + xx, yy, D[yy < y - ah + 2 ? 2 : xx === 0 ? 1 : 0]); }
        V.put(pb, ax - 1, y - ah, R[n - 1]);
      }
      for (let xx = x; xx < x + w; xx++) V.put(pb, xx, y - ah - 1, R[n - 1]);
    }
    if (kind === 'church') {
      const tw = Math.max(6, Math.round(w * 0.22)), th = Math.round(h * 1.1), tx = x + w - tw - 1;
      V.townHouse(pb, tx, y - h + 2, tw, th, seed + 7, { k, pal: o.pal || 'white', roof: 'belfry', s: 1, flowers: 0 });
    }
    return hs;
  };
  /**
   * Barrio orgánico sobre un relieve (info de VISTA.relief): casas y árboles en la
   * superficie visible, agrupados en vecindarios por ruido; las laderas muy
   * empinadas quedan como peñas desnudas. Cada casa asienta sobre un rellano de roca.
   * o: {x0, x1, n, v:[a,b], w:[a,b], h:[a,b], seed, k, minY, maxY, steep, cluster, trees, roofs, pals, lit, s, skip(x)}
   */
  V.slopeTown = function (pb, info, o) {
    const r = RNG(o.seed || 1), k = o.k || 0, out = { houses: [], wins: [], tops: [] };
    const items = [];
    const RK = ramp(o.ledge || V.RAMPS.hill, k), nR = RK.length;
    for (let i = 0; i < (o.n || 100); i++) {
      const x = r.int(o.x0, o.x1 - 1);
      if (o.skip && o.skip(x)) continue;
      const cl = vnoise(x * (o.clusterF ?? 0.018), 3.3, (o.seed || 1) + 5);
      if (cl < (o.cluster ?? 0.35)) continue;
      const v = r.int(o.v?.[0] ?? 2, o.v?.[1] ?? 20);
      const y = info.onSurf(x, v); if (y == null || y < (o.minY ?? 0) || y > (o.maxY ?? pb.h - 4)) continue;
      const sl = Math.abs((info.top[Math.min(pb.w - 1, x + 4)] ?? y) - (info.top[Math.max(0, x - 4)] ?? y));
      if (sl > (o.steep ?? 9)) continue;
      const tree = r.chance(o.trees ?? 0.3);
      items.push({ x, y, tree, w: r.int(o.w[0], o.w[1]), h: r.int(o.h[0], o.h[1]), seed: (o.seed || 1) * 131 + i * 17 });
    }
    items.sort((a, b) => a.y - b.y);
    for (const it of items) {
      if (it.tree) { gardenVeg(pb, it.x, it.y + 1, r, k, o.vegScale || 1); continue; }
      const x = it.x - (it.w >> 1);
      // rellano de roca: losa iluminada y cara en sombra bajo la casa
      for (let xx = x - 1; xx < x + it.w + Math.round(it.w * 0.3); xx++) { V.put(pb, xx, it.y + 1, RK[nR - 2]); V.put(pb, xx, it.y + 2, RK[Math.max(0, nR - 6)]); V.put(pb, xx, it.y + 3, RK[2]); }
      const hs = V.townHouse(pb, x, it.y + 1, it.w, it.h, it.seed, { k, roof: o.roofs ? r.pick(o.roofs) : null, pal: o.pals ? r.pick(o.pals) : null, s: o.s, flowers: o.flowers, lit: o.lit });
      out.houses.push(hs); out.wins.push(...hs.wins); out.tops.push([it.x, hs.top, 0]);
    }
    return out;
  };
  /**
   * Torre de SYNARA (hito): obelisco blanco en 3/4 con franjas turquesa, aristas
   * iluminadas, coronación de cristal cian y punta luminosa (como el núcleo del Nivel 0).
   */
  V.synaraTower = function (pb, x, y, h, o = {}) {
    const k = o.k || 0, Wt = ramp(WALLS.white, k), n = Wt.length;
    const TQ = ramp(['#0a4a5a', '#108a9a', '#20c0c8', '#5ae8e8', '#c4fbff'], k), CY = ramp(['#1a6a8a', '#22c1e7', '#71dfef', '#c4fbff', '#ffffff'], k * 0.5);
    const w0 = Math.max(6, Math.round(h * 0.17)), w1 = Math.max(3, Math.round(w0 * 0.45)), sd = Math.max(2, Math.round(w0 * 0.35));
    const glows = [];
    // podio de dos escalones
    V.box3q(pb, x - Math.round(w0 * 0.9), y, Math.round(w0 * 1.8) + 1, Math.max(3, Math.round(h * 0.05)), Math.round(sd * 1.6), { ramp: WALLS.white, k, front: 5, side: 2, top: 7 });
    const yb = y - Math.max(3, Math.round(h * 0.05));
    for (let yy = 0; yy < h; yy++) {
      const t = yy / h, hw = lerp(w0 / 2, w1 / 2, t), sw = Math.max(1, Math.round(lerp(sd, sd * 0.5, t)));
      const py = yb - yy, xl = Math.round(x - hw), xr = Math.round(x + hw);
      const band = (Math.floor(yy / Math.max(4, h * 0.09)) % 2 === 1) && t > 0.1 && t < 0.86;
      for (let xx = xl; xx <= xr; xx++) {
        const u = (xx - xl) / Math.max(1, xr - xl);
        let c;
        if (band && u > 0.18 && u < 0.86) c = TQ[clamp(Math.round(3 - u * 2 + (yy % 3 === 0 ? 1 : 0)), 0, 4)];
        else c = Wt[xx === xl ? n - 1 : u < 0.3 ? n - 2 : u < 0.8 ? n - 3 : n - 4];
        V.put(pb, xx, py, c);
      }
      for (let q = 1; q <= sw; q++) V.put(pb, xr + q, py - Math.round(q * 0.5), band ? TQ[0] : Wt[2]);
    }
    // nervio luminoso central (núcleo de datos)
    for (let yy = Math.round(h * 0.12); yy < Math.round(h * 0.86); yy += 1) if ((yy % 5) !== 0) V.put(pb, x, yb - yy, CY[2]);
    // coronación: anillo y cristal cian
    const ty = yb - h, cr = Math.max(3, Math.round(w0 * 0.55));
    V.ellipse(pb, x + 0.5, ty + 0.5, cr + 0.5, Math.max(1.5, cr * 0.35), (nx, ny) => Wt[ny < 0 ? n - 1 : 3]);
    const ch = Math.round(h * 0.16);
    for (let yy = 0; yy < ch; yy++) {
      const hw = Math.max(0, Math.round((cr - 1) * (1 - yy / ch)));
      for (let xx = -hw; xx <= hw; xx++) V.put(pb, x + xx, ty - 1 - yy, CY[xx < 0 ? 3 : xx === 0 ? 4 : 1 + (yy & 1)]);
    }
    for (let q = 0; q < 4; q++) V.put(pb, x, ty - ch - 1 - q, q < 2 ? Wt[5] : CY[4]);
    glows.push([x, ty - Math.round(ch * 0.4), Math.max(5, cr + 3)], [x, yb - Math.round(h * 0.5), 3], [x, yb - Math.round(h * 0.3), 3]);
    // alas solares en el podio
    const S = ramp(PVR, k);
    for (const sdn of [-1, 1]) for (let i = 0; i < Math.round(w0 * 0.9); i++) { const px = x + sdn * (Math.round(w0 * 0.5) + 2 + i), py = yb - 2 - Math.round(i * 0.25); V.put(pb, px, py, S[2 + (i % 3 === 0 ? 2 : 0)]); V.put(pb, px, py + 1, S[1]); }
    return { top: ty - ch - 5, tip: [x, ty - ch - 4], glows, beacon: [x, ty - ch - 4], x0: x - w0, x1: x + w0 + sd };
  };
  /* ---------------- dinámicos ---------------- */
  const _kite = new Map();
  function kiteSpr(col) {
    let c = _kite.get(col); if (c) return c;
    const pb = new PixelBuffer(9, 11), A = U(col), Bc = U(shadeTo(col, -0.3, 260)), L = U(shadeTo(col, 0.35)), F = U('#3a2a2a');
    for (let y = 0; y < 11; y++) { const hw = y < 5 ? y : 10 - y; for (let x = -hw; x <= hw; x++) V.put(pb, 4 + x, y, x < 0 ? (y < 5 ? L : A) : (y < 5 ? A : Bc)); }
    for (let y = 1; y < 10; y++) V.put(pb, 4, y, F);
    for (let x = 1; x < 8; x++) V.put(pb, x, 5, F);
    c = pb.toCanvas(); _kite.set(col, c); return c;
  }
  /** Cometas del festival: rombo + cola de lazos que se mece (≈14 fillRect cada una) */
  V.drawKites = function (g, list, ox, oy, t) {
    for (const K of list) {
      const x = Math.round(K.x + ox + Math.sin(t * (K.sp || 0.6) + (K.ph || 0)) * 10), y = Math.round(K.y + oy + Math.sin(t * 1.1 + (K.ph || 0) * 2) * 5);
      if (x < -20 || x > W + 20) continue;
      g.drawImage(kiteSpr(K.col), x - 4, y - 5);
      const n = K.tail || 10;
      for (let i = 1; i <= n; i++) {
        const tx = x + Math.sin(t * 3 + i * 0.7 + (K.ph || 0)) * (1 + i * 0.25) - i * 0.4, ty = y + 5 + i * 2;
        g.fillStyle = i % 3 === 0 ? (K.bow || '#fff6d0') : '#f4ecd8'; g.fillRect(Math.round(tx), Math.round(ty), i % 3 === 0 ? 2 : 1, 1);
      }
      // hilo hacia la ciudad
      if (K.line) { g.fillStyle = 'rgba(250,246,238,0.5)'; for (let i = 1; i < 10; i++) g.fillRect(Math.round(x + i * K.line[0] / 10), Math.round(y + 5 + i * K.line[1] / 10), 1, 1); }
    }
  };
  let _flags = null;
  function flagStrips() {
    if (_flags) return _flags;
    _flags = {};
    for (const col of ['#e83b41', '#11bedd', '#f5dc5a', '#3fe0a0', '#8d6bff']) {
      const A = U(col), D = U(shadeTo(col, -0.3, 260)), L = U(shadeTo(col, 0.3));
      _flags[col] = V.strip(3, 8, 6, (pb, f) => {
        for (let x = 0; x < 7; x++) {
          const off = Math.round(Math.sin(x * 0.9 - f * 2.1) * 1);
          for (let y = 0; y < 4; y++) V.put(pb, x, y + 1 + off, ((x + f) % 3 === 0) ? D : y === 0 ? L : A);
        }
      });
    }
    return _flags;
  }
  /** Banderas que ondean en mástiles horneados */
  V.drawFlags = function (g, list, ox, oy, t) {
    const F = flagStrips();
    for (const f of list) { const x = f.x + ox, y = f.y + oy; if (x < -10 || x > W + 10) continue; V.drawStrip(g, F[f.col] || F['#e83b41'], Math.floor(t * 8 + f.x) % 3, x + 1, y); }
  };
  /** Fuegos artificiales (atardecer de fiesta): estela, estallido radial que cae y se apaga */
  V.drawFireworks = function (g, list, ox, oy, t) {
    g.globalCompositeOperation = 'lighter';
    for (const F of list) {
      const per = F.per || 5, u = ((t + (F.ph || 0)) % per) / per;
      const x = F.x + ox, y = F.y + oy;
      if (x < -40 || x > W + 40) continue;
      if (u < 0.18) { const k = u / 0.18; g.globalAlpha = 0.8; g.fillStyle = '#fff0c0'; g.fillRect(Math.round(x), Math.round(y + (1 - k) * 60), 1, 2); continue; }
      const k = (u - 0.18) / 0.82; if (k > 0.85) continue;
      const rr = (F.r || 16) * Math.sqrt(k), n = 14;
      g.globalAlpha = 1 - k / 0.85;
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU + (F.ph || 0), px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr + k * k * 10;
        g.fillStyle = i % 2 ? F.col : '#ffffff'; g.fillRect(Math.round(px), Math.round(py), 1, 1);
        if (k < 0.4) { g.fillStyle = F.col; g.fillRect(Math.round(x + Math.cos(a) * rr * 0.6), Math.round(y + Math.sin(a) * rr * 0.6 + k * k * 6), 1, 1); }
      }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  };
})();
