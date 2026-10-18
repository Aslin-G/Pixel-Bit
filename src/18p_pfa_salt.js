/* =====================================================================
   18p_pfa_salt.js — Cañones de sal del plano jugable (kit PF, rollout A)
   a escala de personaje ≈ 74 px: agua de canal de salmuera y de humedal
   en 3/4 (estilos de agua 'brineA' y 'wetA', con def. {pf:true, style}),
   descarga de concentrado, compuertas del cruce de canales, laguna de
   contingencia revestida, montones y pilares de sal, chimeneas de roca
   con vetas de sal, manglar con raíces zancudas, salicornia, juncos,
   pasarelas de madera, boyas de salinidad, estación de vigilancia sobre
   pilotes y emisario hacia el difusor.
   API (PFASalt):
     outfall(pb,x,yb) → {mouth:[x,y]}             saltPile(pb,x,yb,w,h,seed)
     saltPillar(pb,x,yTop,yb,w,seed)               hoodoo(pb,x,yb,w,h,ramp,seed) → {top}
     weir(pb,x,yb) → {gates:[[x,y,w,h]×2], led:[x,y]}
     pond(pb,x0,x1,yb) → {surf:[x,y,w,h]}           mangrove(pb,x,yb,h,seed)
     salicornia(pb,x,yb,w,seed) · reeds(pb,x0,x1,gy,seed) · boardwalk(pb,x,y,w,floorY,{post})
     station(pb,x0,x1,yF,floorY) → {radar:[x,y], screens:[[x,y,w,h]], lamps}
     emissary(pb,x0,x1,gy) (tubería del emisario que entra en el terreno)
     drawBuoy(g,x,y,t,col) (boya de salinidad con LED, dinámica)
   Agua: build(world,w)/renderBack/renderFront enganchados a PFWater (style 'brineA'|'wetA').
   Oclusor frontal registrado: 'aSalt' (cristales de sal violetas y salicornia oscura).
   Sin tramado.
   ===================================================================== */
const PFASalt = (() => {
  const K = PFK, put = K.put, get = K.get, P32 = K.P32, A = PFArch, I = PFInfra, PL = PFAPlant;
  const rect = PL.rect, hline = PL.hline, vline = PL.vline;
  const SALT = ['#2e2140', '#4a3660', '#6a5280', '#8c74a0', '#ae96ba', '#cab4cc', '#e2d0dc', '#f2e4ea', '#fdf6f6'];
  const BRW = ['#0b0c2a', '#141a5a', '#1e2878', '#2c3290', '#3e3aa8', '#5868be', '#8a5ab8', '#d368bf', '#e5c8f6'];
  const WET = ['#06222a', '#0a3a42', '#0f4a5a', '#146a6a', '#1c8a7a', '#20b8a0', '#5cd8b4', '#9cf0d0'];
  const MANG = ['#0a160c', '#142a14', '#1e3e1a', '#2c5622', '#3e702a', '#548c34', '#74a842', '#9cc458'];
  const BARK = ['#1a0e08', '#2e1a0e', '#462a16', '#5e3c20', '#7a5230', '#987046'];
  const PILLAR_ROCK = ['#1e0a1e', '#341230', '#461a3a', '#6e2c40', '#8c3e52', '#ae5a5c', '#cc7a68', '#e8a07a', '#f8c894'];

  /* ---------- agua en 3/4: canal de salmuera y humedal ---------- */
  function build(world, w) {
    const wet = w.style === 'wetA', P = P32(wet ? WET : BRW), x0 = w.x0, x1 = w.x1, wy = w.y, wd = x1 - x0 + 1;
    const BANK = wet ? P32(['#16200e', '#24341a', '#364a22', '#4e6630', '#6e8a44', '#a8c070']) : P32(['#2a1e3a', '#46345a', '#6a5280', '#ae96ba', '#e2d0dc', '#fdf6f6']);
    const top = 12, hg = Math.max(4, Math.round(Math.max(...Array.from({ length: 12 }, (_, i) => world.ground[Math.round(x0 + i * wd / 12)] || wy + 10))) - wy + 2);
    const pb = new PixelBuffer(wd, top + hg);
    for (let x = 0; x < wd; x++) {
      const X = x0 + x, gy = world.ground[X] ?? wy + 10, edge = Math.min(x, wd - 1 - x);
      // superficie en 3/4 (lámina que se aleja): reflejo del cielo del atardecer en bandas
      for (let y = 0; y < top; y++) {
        if (edge < (top - y) * 0.5) continue;
        const v = y / top; let k = Math.round(4 + v * 2 + (PFK.vn(X * 0.05, y * 0.4, 7) - 0.5) * 2);
        if ((y + Math.round(Math.sin(X * 0.09) * 1.5)) % 4 === 0) k += 1;
        let u = P[clamp(k, 1, 7)];
        if (w.style !== 'wetA' && PFK.vn(X * 0.02, 3, 9) > 0.62 && y > 6) u = K.mixU(u, U('#f8a0c0'), 0.35);   // reflejo rosado del cielo
        if (hash2(X, y, 11) < 0.02) u = P[8];
        pb.data[y * wd + x] = u;
      }
      // columna de agua en corte hasta el lecho: degradado y cristales de sal en el fondo
      for (let y = top; y < top + hg; y++) {
        const Y = wy + (y - top); if (Y > gy + 1) break;
        const dz = (Y - wy) / Math.max(1, gy - wy);
        let u = P[clamp(Math.round(5 - dz * 4 + (PFK.cl(X, Y, 2, 13) - 0.5)), 0, 7)];
        if (Y >= gy - 1) u = w.style === 'wetA' ? U('#2a3a1a') : U(hash2(X, Y, 15) < 0.4 ? '#f2e4ea' : '#cab4cc');
        // orillas en talud dentro del corte (el lecho sube hacia los extremos: cubeta, no caja)
        const bw = 4 + (Y - wy) * 1.4 + PFK.vn(X * 0.3, Y * 0.3, 47) * 3;
        if (edge < bw) { const lit = x > wd / 2, f = edge / bw; u = BANK[clamp(Math.round((lit ? 3.4 : 1.6) + f * 1.2 - (Y - wy) * 0.08 + (hash2(X >> 1, Y, 49) < 0.25 ? 1 : 0)), 0, 5)]; if (edge >= bw - 1) u = BANK[lit ? 5 : 4]; }
        pb.data[y * wd + x] = u;
      }
    }
    // orillas (r2-biomes-a): costra de sal irregular en el borde trasero y bancos redondeados en los extremos
    // (la lámina deja de leerse como un rectángulo de bordes duros); en el humedal, limo verde y juncos bajos
    const CR = wet ? P32(['#2a3a1a', '#3e5a24', '#5a7a2e', '#86a04a', '#c8d890']) : P32(['#6a5280', '#ae96ba', '#e2d0dc', '#f2e4ea', '#fdf6f6']);
    for (let x = 0; x < wd; x++) {
      const X = x0 + x, edge = Math.min(x, wd - 1 - x);
      const bh = 1 + Math.round(PFK.vn(X * 0.18, 1, 31) * 2);
      for (let y = 0; y < bh; y++) if (edge >= (top - y) * 0.5 - 1) pb.data[y * wd + x] = CR[clamp(3 - y + (hash2(X, y, 33) < 0.3 ? 1 : 0), 0, 4)];
      // banco en los extremos: rampa de costra que entra en la lámina
      const bank = Math.round(7 + PFK.vn(X * 0.2, 2, 35) * 5);
      if (edge < bank) for (let y = 0; y < top; y++) {
        const lim = (top - y) * 0.5; if (edge < lim - 1) continue;
        if (edge - lim < bank * 0.6 * (1 - y / top) + 1) pb.data[y * wd + x] = CR[clamp(Math.round(1 + (edge - lim) * 0.4 + (y < 3 ? 1 : 0) + (hash2(X, y, 37) < 0.25 ? 1 : 0)), 0, 4)];
      }
    }
    for (let i = 0; i < Math.round(wd / 14); i++) { const x = Math.floor(hash1(i, x0 + 39) * wd), y = 2 + Math.floor(hash1(i, x0 + 41) * (top - 4)), X = x0 + x; if (Math.min(x, wd - 1 - x) < (top - y) * 0.5 + 2) continue; if (wet) { for (let k = 0; k < 4; k++) if (y - k >= 0) pb.data[(y - k) * wd + x] = U(k > 2 ? '#c8a050' : '#3e7a3a'); } else { pb.data[y * wd + x] = CR[4]; if (x + 1 < wd) pb.data[y * wd + x + 1] = CR[3]; if (y > 0) pb.data[(y - 1) * wd + x] = CR[4]; } void X; }
    // velo frontal prehorneado (lo que vadea): extremos redondeados y borde superior roto, no un rectángulo
    const ov = new PixelBuffer(wd, 11), cA = U(wet ? '#146a6a' : '#3a2a80'), cB = U(wet ? '#0a3a42' : '#18206a'), cL = U(wet ? '#9cf0d0' : '#e5c8f6');
    for (let y = 0; y < 11; y++) for (let x = 0; x < wd; x++) {
      const edge = Math.min(x, wd - 1 - x), ins = Math.round(6 * (1 - Math.sqrt(Math.max(0, 1 - Math.pow((y + 1) / 11, 2)))) + PFK.vn((x0 + x) * 0.3, y, 43) * 3);
      if (edge < ins) continue;
      if (y === 0) { if (hash2(x0 + x, 0, 45) < 0.82) ov.data[x] = cL; continue; }
      const a = y >= 6 ? 0.55 : 0.42 - (edge < ins + 3 ? 0.18 : 0);
      ov.data[y * wd + x] = (((Math.round(a * 255)) << 24) | ((y >= 6 ? cB : cA) & 0xffffff)) >>> 0;
    }
    return { brineA: true, w, x0, x1, wy, top, c: pb.toCanvas(), ov: ov.toCanvas() };
  }
  function renderBack(g, sc, Wt) {
    const ox = sc.cam.ox, oy = sc.cam.oy, sx = Wt.x0 - ox;
    if (sx > W || Wt.x1 - ox < 0) return;
    g.drawImage(Wt.c, sx, Wt.wy - Wt.top - oy);
  }
  function renderFront(g, sc, Wt) {
    const ox = sc.cam.ox, oy = sc.cam.oy, t = Game.time, w = Wt.w, xa = Math.max(0, Wt.x0 - ox), xb = Math.min(W, Wt.x1 - ox), y = Wt.wy - oy;
    if (xb <= xa) return;
    const wet = w.style === 'wetA';
    // lámina translúcida sobre lo que vadea (pies de los personajes) y línea de superficie brillante (prehorneadas)
    if (Wt.ov) g.drawImage(Wt.ov, Wt.x0 - ox, y);
    else { g.globalAlpha = 0.42; g.fillStyle = wet ? '#146a6a' : '#3a2a80'; g.fillRect(xa, y + 1, xb - xa, 9); g.globalAlpha = 1; }
    // rizos que avanzan y brillos de cristal
    g.fillStyle = '#ffffff';
    for (let x = xa + ((Math.floor(t * 12)) % 9); x < xb; x += 9) g.fillRect(x, y - 1 + ((x >> 3) & 1), 3, 1);
    g.fillStyle = wet ? '#c4fff0' : '#f888b8';
    for (let i = 0; i < 6; i++) { const x = xa + ((i * 53 + Math.floor(t * 7) * 11) % Math.max(1, xb - xa)); g.fillRect(x, y + 3 + (i % 3) * 2, 1, 1); }
  }
  if (typeof PFWater !== 'undefined') {
    const bB = PFWater.build, bBack = PFWater.renderBack, bFront = PFWater.renderFront;
    PFWater.build = (world, w) => (w.style === 'brineA' || w.style === 'wetA') ? build(world, w) : bB(world, w);
    PFWater.renderBack = (g, sc, Wt) => (Wt && Wt.brineA) ? renderBack(g, sc, Wt) : bBack(g, sc, Wt);
    PFWater.renderFront = (g, sc, Wt) => (Wt && Wt.brineA) ? renderFront(g, sc, Wt) : bFront(g, sc, Wt);
  }

  /* ---------- descarga del concentrado (muro de cabecera con clapeta) ---------- */
  function outfall(pb, x, yb) {
    const C = P32(PFTerrain.CONC);
    A.castShadow(pb, x, yb, 34, 10, -0.26);
    I.box3q(pb, x, yb, 30, 34, 10, { ramp: PFTerrain.CONC, skew: 0.6, front: (xx, yy, u, v) => { const ly = yy - (yb - 34); if (ly < 2) return C[7]; if (ly > 26) return K.mixU(C[3], U('#cab4cc'), 0.4); return C[5 - ((xx - x) % 9 === 0 ? 2 : 0) - (PFK.cl(xx, yy, 2, 21) < 0.1 ? 1 : 0)]; } });
    // boca con clapeta abierta y costra de sal
    K.ellipseFn(pb, x + 14, yb - 18, 7, 7, (nx, ny, d) => d > 0.7 ? C[1] : U('#0b0c2a'));
    PFK.polyFill(pb, [[x + 8, yb - 25], [x + 21, yb - 25], [x + 23, yb - 30], [x + 10, yb - 30]], P32(PFInfra.STEEL)[4]);
    for (let k = 0; k < 24; k++) put(pb, x + 3 + k, yb - 2 - (k % 3), U(k % 2 ? '#f2e4ea' : '#fdf6f6'));
    return { mouth: [x + 14, yb - 14] };
  }
  /** Montón de sal cosechada (cono con cristales) */
  function saltPile(pb, x, yb, w = 30, h = 14, seed = 1) {
    const S = P32(SALT);
    A.castShadow(pb, x - w / 2, yb, w, 6, -0.22);
    for (let yy = 0; yy < h; yy++) { const hw = Math.round((w / 2) * Math.sqrt(1 - yy / h)); for (let k = -hw; k <= hw; k++) { const f = (k + hw) / (2 * hw + 0.01); let kk = f < 0.3 ? 8 : f < 0.55 ? 7 : f < 0.8 ? 6 : 4; if (hash2(x + k, yy, seed) < 0.06) kk = 8; if (yy === 0) kk -= 2; put(pb, x + k, yb - yy, S[clamp(kk, 0, 8)]); } }
    put(pb, x, yb - h, S[8]);
  }
  /** Pilar de sal esculpido (r2-biomes-a): columna de halita en capas de crecimiento con silueta orgánica
   *  (cintura, repisas que vuelan 1–2 px, talud ensanchado), sombreado cilíndrico con luz arriba-izquierda,
   *  facetas cúbicas en grumos 3×3, labio de cada capa al sol y base socavada en sombra lila, goterones
   *  de sal bajo el labio, manchas de salmuera en la base y cara superior en 3/4 (donde apoya la plataforma). */
  function saltPillar(pb, x, yTop, yb, w = 28, seed = 1) {
    const S = P32(SALT), n = S.length, r = RNG(seed), H = Math.max(4, yb - yTop);
    const SHV = U('#3a2a6a'), WARM = U('#ffe6d0'), STN = U('#b88aa0'), PR = P32(PILLAR_ROCK);
    A.castShadow(pb, x, yb, w + 10, 9, -0.26);
    // capas de crecimiento (5–9 px) con saliente propio
    const lay = []; for (let q = 0; q <= H;) { const th = 4 + r.int(0, 8); lay.push([q, th, r.range(-1.5, 2.2), r.range(-1.6, 1.6), r.chance(0.6)]); q += th; }
    const cx0 = x + w / 2;
    for (const [q0, th, bulge, sh, lip] of lay) for (let k = 0; k < th; k++) {
      const q = q0 + k; if (q > H) break;
      const t = q / H, y = yTop + q, lt = k / Math.max(1, th - 1);
      let hw = w / 2 * (0.94 - 0.12 * Math.sin(t * Math.PI * 0.9)) + (t > 0.8 ? (t - 0.8) * w * 0.55 : 0);
      hw += bulge * (1 - lt * 0.8) - (lt > 0.8 ? 1 : 0) + (fbm1(q * 0.21, 2, seed) - 0.5) * 1.8;
      const cx = cx0 + sh + (fbm1(q * 0.06, 2, seed + 3) - 0.5) * 2.4;
      const xl = Math.round(cx - hw), xr = Math.round(cx + hw);
      for (let px = xl; px <= xr; px++) {
        const nx = (px + 0.5 - cx) / Math.max(1, hw), nz = Math.sqrt(Math.max(0, 1 - nx * nx));
        let I = 0.46 - nx * 0.56 + nz * 0.12;
        if (lip && k === 0) I += 0.24; else if (lip && k === 1) I += 0.08;   // labio de la capa al sol
        if (lip && lt > 0.8 && th > 5) I -= 0.18;                            // base socavada
        const fc = hash2(Math.floor((px - x + (y >> 2)) / 3), Math.floor(y / 3), seed + 7);
        I += (fc - 0.5) * 0.22 + (PFK.vn(px * 0.15, y * 0.1, seed) - 0.5) * 0.25;                                               // facetas cúbicas
        if ((px - x) % 3 === 2 && fc > 0.6) I -= 0.08;
        I -= (1 - t) * 0.02 + (t > 0.85 ? (t - 0.85) * 0.8 : 0);              // oclusión al pie
        // costra de sal arriba (con chorreones que bajan por el lado al sol); debajo, roca del cañón estratificada
        const capH = 5 + Math.round(fbm1(px * 0.4, 2, seed + 5) * 4) + (hash2(px, 1, seed + 6) < 0.3 ? Math.round(hash2(px, 2, seed + 6) * H * 0.45) : 0) + (q > H * 0.75 ? 99 : 0);
        const salt = q < capH || (t > 0.9 && hash2(px >> 1, y, seed + 8) < 0.35);
        const RR = salt ? S : PR, nn = RR.length;
        if (!salt) I -= 0.1;
        let kk = clamp(Math.round(I * (nn - 1)), 1, nn - 1);
        let u = RR[kk];
        if (kk < nn * 0.45) u = K.mixU(u, SHV, 0.3 * (1 - kk / (nn * 0.45)));
        if (px === xl) u = RR[Math.min(nn - 1, kk + 1)];                       // canto iluminado
        else if (px === xr) u = RR[Math.max(1, kk - 2)];
        if (salt && q === capH - 1 && q < H * 0.7) u = S[3];                  // borde de la costra en sombra
        if (t > 0.86 && hash2(px, y, seed + 9) < 0.18) u = K.mixU(u, STN, 0.5); // manchas de salmuera seca
        put(pb, px, y, u);
      }
      // goterones de sal bajo el labio (lado al sol)
      if (k === 0 && q > 4) for (let gx = xl + 1; gx < cx; gx += 3 + ((gx * 7) % 3)) if (hash2(gx, q, seed + 11) < 0.45) { const dl = 1 + Math.floor(hash2(gx, q, seed + 12) * 3); for (let d = 1; d <= dl; d++) put(pb, gx, y + d, S[d === dl ? 6 : 8]); }
    }
    // cara superior en 3/4 con canto y destellos (aquí apoya la plataforma)
    const tw = w / 2 + 1, tcx = cx0 + lay[0][3] + 1;
    for (let yy = -3; yy <= 0; yy++) for (let xx = Math.floor(-tw); xx <= tw; xx++) {
      const e = (xx * xx) / (tw * tw) + ((yy + 1.5) * (yy + 1.5)) / 2.6; if (e > 1) continue;
      put(pb, Math.round(tcx + xx), yTop + yy, S[e > 0.75 ? (xx < 0 ? 7 : 5) : yy === 0 ? 6 : xx < -tw * 0.3 ? 8 : 7]);
    }
    for (let i = 0; i < 3; i++) { const gx = Math.round(tcx - tw * 0.6 + r() * tw), gy = yTop - 2 + r.int(0, 1); put(pb, gx, gy, U('#ffffff')); }
    put(pb, Math.round(tcx - tw * 0.5), yTop - 2, WARM);
    // cristales cúbicos caídos al pie
    for (let i = 0; i < 5; i++) { const cx = Math.round(x - 4 + r() * (w + 10)), cy = yb - r.int(0, 1), s = 1 + r.int(0, 1); for (let a = 0; a <= s; a++) for (let b = 0; b <= s; b++) put(pb, cx + a, cy - b, S[b === s ? 8 : a === 0 ? 7 : 4]); }
  }
  /** Chimenea de roca esculpida (r2-biomes-a): perfil por capas duras/blandas (las duras vuelan, las blandas
   *  se socavan), sombreado cilíndrico con luz arriba-izquierda, lado en sombra violeta, canto de estrato al sol,
   *  vetas de sal discontinuas, inclinación leve, sombrero que vuela con sombra debajo y cara superior en 3/4 */
  function hoodoo(pb, x, yb, w, h, ramp, seed = 1) {
    const R = P32(ramp), n = R.length, S = P32(SALT), r = RNG(seed), SHV = U('#2a1a5a'), WARM = U('#ffd8a8');
    A.castShadow(pb, x, yb, w + 8, 12, -0.26);
    const prof = new Float32Array(h + 1), hard = new Uint8Array(h + 1), capH = Math.max(5, Math.round(h * 0.07));
    let acc = 0, layer = 0, lh = r.int(6, 14);
    for (let q = 0; q <= h; q++) {
      if (++acc > lh) { acc = 0; layer++; lh = r.int(5, 16); }
      hard[q] = layer % 2;
      const t = q / h;
      let rad = w / 2 * (1.3 - t * 0.5) * (1 + (fbm1(q * 0.045 + seed, 3, seed) - 0.5) * 0.5);
      rad *= hard[q] ? 1.025 : 0.975;
      if (q >= h - capH) rad = w / 2 * 1.32 * (1 - Math.pow((q - (h - capH)) / capH, 2.5) * 0.4);
      else if (q > h - capH - 5) rad *= 0.8;
      prof[q] = Math.max(2, rad);
    }
    const lean = r.range(-0.05, 0.05), ph = r.range(0, 6);
    for (let q = 0; q <= h; q++) {
      const rad = prof[q], y = yb - q, cx = x + w / 2 + lean * q + Math.sin(q * 0.06 + ph);
      const dr = (prof[Math.min(h, q + 1)] - prof[Math.max(0, q - 1)]) * 0.5;
      for (let xx = Math.floor(cx - rad); xx <= Math.ceil(cx + rad); xx++) {
        const nx = (xx + 0.5 - cx) / rad; if (Math.abs(nx) > 1) continue;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx)), ny = clamp(dr * 1.3, -0.9, 0.9);
        let I = (nx * -0.6 + ny * -0.5 + nz * 0.64) / Math.hypot(nx, ny, nz);
        if (!hard[q]) I -= 0.04;
        if (q >= h - capH - 2 && q < h - capH + 1) I -= 0.3;                    // sombra bajo el sombrero
        let tt = clamp(0.3 + I * 0.66 - (1 - q / h) * 0.1 + (PFK.cl(xx, y, 2, seed) - 0.5) * 0.12, 0, 0.999);
        let u = R[clamp(Math.floor(tt * n), 0, n - 1)];
        if (tt < 0.4) u = K.mixU(u, SHV, 0.32 * (1 - tt / 0.4));
        if (Math.abs(nx) > 0.92) u = R[clamp(Math.floor(tt * n) - 2, 0, n - 1)];
        else if (hard[q] && !hard[Math.min(h, q + 1)] && nx < 0.2 && (layer = hash2(q, 3, seed)) < 0.6) u = K.mixU(u, WARM, 0.28);   // canto del estrato al sol
        const vein = (q + Math.round(Math.sin(xx * 0.3 + seed) * 1.5)) % 17 === 0 && hash2(xx >> 2, q >> 4, seed + 2) < 0.55;
        if (vein && q < h - capH - 3) u = K.mixU(u, S[nx < 0.3 ? 8 : 5], 0.6);
        put(pb, Math.round(xx), y, u);
      }
    }
    // cara superior del sombrero (elipse en 3/4) con matas
    const tcx = x + w / 2 + lean * h, tr = prof[h - 1] * 0.95, ty = yb - h;
    for (let yy = -2; yy <= 1; yy++) for (let xx = Math.floor(-tr); xx <= tr; xx++) { const e = (xx * xx) / (tr * tr) + ((yy + 0.5) * (yy + 0.5)) / 3; if (e > 1) continue; put(pb, Math.round(tcx + xx), ty - 1 + yy, K.mixU(R[n - 1], WARM, xx < 0 ? 0.5 : 0.15)); }
    PFFlora.tuft(pb, Math.round(tcx - tr * 0.4), ty - 1, 7, 5, seed, PFFlora.DRY);
    // derrubios al pie
    for (let q = 0; q < w + 8; q++) { const px = x - 4 + q, hh = Math.round((1 - Math.abs(q - w / 2 - 4) / (w / 2 + 4)) * 3); for (let yy = 0; yy < hh; yy++) put(pb, px, yb - yy, R[clamp(3 + (q < w / 2 + 4 ? 2 : 0) - yy + (hash2(px, yy, seed) < 0.3 ? -1 : 0), 0, n - 1)]); }
    return { top: ty - 3 };
  }
  /** Peña esculpida (r2-biomes-a): superelipse con techo iluminado arriba-izquierda, lado en sombra violeta,
   *  grieta, cantos de estrato, motas de sal o liquen y sombra de contacto hacia la derecha */
  function boulder(pb, x, yb, w, h, ramp, seed = 1, o = {}) {
    const R = P32(ramp || PILLAR_ROCK), n = R.length, r = RNG(seed), SHV = U('#2a1a5a');
    A.castShadow(pb, x - w / 2, yb + 1, w + 6, 4, -0.24);
    const cx = x + r.range(-1, 1), p = 2.4 + r() * 1.4, crack = r.int(-w / 4, w / 4) | 0;
    for (let yy = -h; yy <= 0; yy++) for (let xx = -Math.ceil(w / 2); xx <= Math.ceil(w / 2); xx++) {
      const nx = xx / (w / 2), ny = (yy + h * 0.45) / (h * 0.55 + 0.01);
      const wob = (PFK.vn((x + xx) * 0.3, yy * 0.3, seed) - 0.5) * 0.35;
      const d = Math.pow(Math.abs(nx), p) + Math.pow(Math.abs(Math.min(ny, 0.9)), p) + wob; if (d > 1 || (yy === 0 && Math.abs(nx) > 0.9)) continue;
      const nz = Math.sqrt(Math.max(0, 1 - Math.min(1, d)));
      let I = 0.42 - nx * 0.38 - ny * 0.34 + nz * 0.22 + (PFK.cl(x + xx, yy, 2, seed + 1) - 0.5) * 0.14;
      if (Math.abs(xx - crack - Math.round(yy * 0.3)) < 1 && yy > -h * 0.8) I -= 0.3;
      if (d > 0.82) I -= 0.12;
      let k = clamp(Math.round(I * (n - 1)), 0, n - 1), u = R[k];
      if (k < n * 0.4) u = K.mixU(u, SHV, 0.32 * (1 - k / (n * 0.4)));
      if (o.speck && ny < -0.3 && hash2(x + xx, yy, seed + 3) < 0.12) u = U(o.speck);
      put(pb, Math.round(cx + xx), yb + yy, u);
    }
  }
  /** Racimo de cristales cúbicos de halita (2–4 cubos en 3/4 con cara superior blanca y destello) */
  function halite(pb, x, yb, s = 2, seed = 1) {
    const S = P32(SALT), r = RNG(seed);
    for (let i = 0; i < 2 + r.int(0, 2); i++) {
      const c = s + r.int(0, 2), cx = x + r.int(-5, 5), cy = yb - r.int(0, 2);
      for (let a = 0; a <= c; a++) for (let b = 0; b <= c; b++) put(pb, cx + a, cy - b, S[b === c ? 8 : a === c ? 4 : a === 0 ? 7 : 6]);
      for (let a = 1; a <= Math.ceil(c / 2); a++) for (let b = 0; b <= c; b++) put(pb, cx + c + a, cy - b - a, S[b === c ? 7 : 3]);
      put(pb, cx + 1, cy - c, U('#ffffff'));
    }
  }
  /** Matorral salino (sosa/suaeda): domo verde azulado con puntas rojizas y tallos claros */
  function saltScrub(pb, x, yb, w = 14, seed = 1) {
    const r = RNG(seed), G = ['#0c1a1c', '#163026', '#22462e', '#3a6236', '#5a8040', '#86a452'];
    PFFlora.cluster(pb, x, yb - w * 0.32, w * 0.5, w * 0.34, G, seed, {});
    for (let i = 0; i < Math.round(w / 3); i++) { const px = Math.round(x + (r() - 0.5) * w * 0.9), py = Math.round(yb - w * 0.32 - r() * w * 0.3); put(pb, px, py, U(i % 2 ? '#e2405a' : '#c8605a')); }
    for (let k = -Math.round(w / 2); k <= Math.round(w / 2); k++) if (hash2(x + k, yb, seed) < 0.5) put(pb, x + k, yb, U('#1a1420'));
  }
  /** Compuertas del cruce de canales: estructura de hormigón con dos tajaderas y pasarela */
  function weir(pb, x, yb) {
    const C = P32(PFTerrain.CONC), St = P32(PFInfra.STEEL), Y = P32(PL.YEL);
    A.castShadow(pb, x, yb, 70, 12, -0.26);
    I.box3q(pb, x, yb, 66, 40, 12, { ramp: PFTerrain.CONC, skew: 0.6 });
    const gates = [];
    for (const gx of [x + 8, x + 38]) { rect(pb, gx - 1, yb - 36, 22, 32, C[1]); rect(pb, gx, yb - 35, 20, 30, U('#0b0c2a')); gates.push([gx, yb - 35, 20, 30]); for (const px of [gx - 2, gx + 20]) for (let yy = yb - 66; yy < yb - 4; yy++) { put(pb, px, yy, St[5]); put(pb, px + 1, yy, St[2]); } K.ellipseFn(pb, gx + 10, yb - 68, 6, 2, (nx, ny, d) => d > 0.5 ? U('#e2404a') : 0); vline(pb, gx + 10, yb - 68, yb - 58, St[3]); }
    // pasarela superior con barandilla amarilla
    for (let xx = x - 4; xx < x + 72; xx++) { put(pb, xx, yb - 56, St[6]); put(pb, xx, yb - 55, St[3]); put(pb, xx, yb - 74, Y[5]); put(pb, xx, yb - 65, Y[3]); }
    for (let xx = x - 4; xx < x + 72; xx += 12) vline(pb, xx, yb - 74, yb - 56, Y[4]);
    I.box3q(pb, x + 66, yb - 4, 10, 16, 4, { ramp: PFInfra.STEEL });
    return { gates, led: [x + 70, yb - 16] };
  }
  /** Laguna de contingencia excavada en 3/4 (r2-biomes-a): dique de tierra con canto iluminado y costra
   *  de sal, talud interior revestido de HDPE con soldaduras diagonales, extremos redondeados (no es un
   *  rectángulo), rampa de servicio, rebosadero y balizas. Devuelve surf [x,y,w,h] y rows[r] = [xl, xr]
   *  (fila r contada desde abajo, y = surf.y + surf.h - 1 - r) para la lámina dinámica. */
  function pond(pb, x0, x1, yb) {
    const S = P32(SALT), d = 14, sk = 0.7, wd = x1 - x0;
    const LIN = P32(['#10122a', '#181a3a', '#22244c', '#2e305e', '#3c3e72', '#545890']);
    const BER = P32(['#2a1a2a', '#46303c', '#644650', '#86605e', '#a87e6c', '#c89e80', '#e6c09a']);
    A.castShadow(pb, x0 - 6, yb + 2, wd + 14, 7, -0.22);
    const R = 9;                                                         // radio de los extremos redondeados
    const ins = (r, R0) => { const v = Math.abs((r - d / 2) / (d / 2 + 2)); return Math.round(R0 * (1 - Math.sqrt(Math.max(0, 1 - Math.pow(v, 2.2))))); };
    const rows = [];
    for (let r = -3; r <= d + 3; r++) {
      const yy = yb - r, off = Math.round(r * sk), ii = ins(clamp(r, -2, d + 2), R + 3) - 3;
      const xa = x0 + off + ii + Math.round((PFK.vn(r * 0.4, 1, 5) - 0.5) * 2), xb = x1 + off - ii + Math.round((PFK.vn(r * 0.4, 2, 6) - 0.5) * 2);
      for (let x = xa - 3; x <= xb + 3; x++) {
        const e = Math.min(x - (xa - 3), xb + 3 - x);
        const inner = r >= 0 && r <= d && x > xa + 1 && x < xb - 1;
        let u;
        if (inner) {
          const back = r / d, nearRim = Math.min(r, d - r, x - xa, xb - x);
          let k = nearRim <= 1 ? 4 : nearRim <= 3 ? 3 : back > 0.55 ? 3 : 2;   // talud trasero visible y fondo oscuro
          if (((x - x0) + r * 3) % 23 === 0 && nearRim > 1) k += 1;                // soldaduras del HDPE
          if (back > 0.75 && hash2(x, r, 13) < 0.08) k = 5;                        // reflejo del cielo en el plástico
          u = LIN[clamp(k, 0, 5)];
        } else {
          // dique de tierra: canto superior iluminado (detrás), cara frontal en sombra (delante), costra de sal
          const front = r < 0, kk = front ? 2 + (r === -1 ? 1 : 0) : r > d ? (r === d + 1 ? 6 : 4) : e < 2 ? 5 : 4;
          u = BER[clamp(kk + (hash2(x >> 1, r, 17) < 0.2 ? -1 : 0), 0, 6)];
          if (!front && hash2(x, r, 19) < 0.22) u = S[hash2(x, r, 21) < 0.5 ? 8 : 6];
          if (e === 0 && r > 0 && r < d) u = BER[1];
        }
        put(pb, x, yy, u);
      }
    }
    // filas de lámina (desde abajo) que siguen el contorno redondeado
    const sy = yb - d + 2, sh = d - 3;
    for (let r = 0; r < sh; r++) { const rr = r + 2, ii = ins(rr, R + 3) - 3 + 2, xa = x0 + Math.round(rr * sk) + ii, xb = x1 + Math.round(rr * sk) - ii; rows[r] = [xa, xb]; }
    rows.length = sh;
    // rampa de servicio (izquierda) y rebosadero de hormigón (derecha)
    for (let k = 0; k < 10; k++) for (let q = 0; q < 4; q++) put(pb, x0 + 6 + k + q, yb - 2 - Math.round(k * 0.9), BER[k === 9 ? 6 : q === 0 ? 5 : 3]);
    I.box3q(pb, x1 - 2, yb - 1, 10, 6, 4, { ramp: PFTerrain.CONC });
    // balizas de nivel (postes con tope rojo) y regla graduada
    for (let k = 0; k < 4; k++) { const px = x0 + 14 + k * Math.round((wd - 28) / 3); vline(pb, px, yb - 26, yb - 2, U('#c8d8e0')); vline(pb, px + 1, yb - 26, yb - 2, U('#6a7a88')); put(pb, px, yb - 27, U('#ff6a5a')); put(pb, px + 1, yb - 27, U('#c83a3a')); }
    const gx = x0 + Math.round(wd * 0.62) + 8; for (let q = 0; q < d; q++) put(pb, gx + Math.round(q * sk), yb - q, q % 3 ? U('#f0f0f0') : U('#e2404a'));
    return { surf: [x0 + 2, sy, wd - 4, sh], rows };
  }
  /** Manglar con raíces zancudas y copa de racimos */
  function mangrove(pb, x, yb, h = 56, seed = 1) {
    const B = P32(BARK), r = RNG(seed);
    for (let i = 0; i < 7; i++) { const rx = x - 14 + i * 5 + r.int(-1, 1), ry = yb - h * 0.35; for (let k = 0; k <= 20; k++) { const t = k / 20, px = Math.round(lerp(rx, x + (i - 3) * 1.5, t)), py = Math.round(lerp(yb, ry, t) - Math.sin(t * Math.PI) * 4); put(pb, px, py, B[1 + (i % 3)]); } }
    for (let yy = yb - h * 0.35; yy > yb - h * 0.8; yy--) { put(pb, x - 1, Math.round(yy), B[4]); put(pb, x, Math.round(yy), B[3]); put(pb, x + 1, Math.round(yy), B[1]); }
    for (let i = 0; i < 6; i++) { const cx = x + (r() - 0.5) * h * 0.7, cy = yb - h * (0.7 + r() * 0.25), rx = h * (0.16 + r() * 0.1); PFFlora.cluster(pb, cx, cy, rx, rx * 0.7, MANG, seed + i * 7); }
  }
  /** Salicornia: tallos articulados rojos y verdes de las marismas */
  function salicornia(pb, x, yb, w = 16, seed = 1) {
    const r = RNG(seed);
    for (let i = 0; i < Math.round(w / 2); i++) { const sx = x - w / 2 + r() * w, hh = 4 + r.int(0, 7); for (let k = 0; k < hh; k++) put(pb, Math.round(sx + (k % 3 === 0 ? 1 : 0)), yb - k, U(k > hh - 3 ? '#e2405a' : k % 2 ? '#8a2a4a' : '#5a7a2a')); }
  }
  function reeds(pb, x0, x1, gy, seed = 1) {
    const r = RNG(seed);
    for (let x = x0; x < x1; x += 2 + r.int(0, 2)) { const y = Math.round(gy(x)), hh = 8 + r.int(0, 12), lean = r() - 0.5; for (let k = 0; k < hh; k++) put(pb, Math.round(x + lean * k * 0.3), y - k, U(k > hh - 3 ? '#c8a050' : k % 3 ? '#3e7a3a' : '#5a9a4a')); if (r() < 0.3) { put(pb, Math.round(x + lean * hh * 0.3), y - hh, U('#6a3a1a')); put(pb, Math.round(x + lean * hh * 0.3), y - hh - 1, U('#8a5a2a')); } }
  }
  /** Pasarela de madera sobre pilotes (para plataformas type 'wood') */
  function boardwalk(pb, x, y, w, floorY, o = {}) {
    const Wd = P32(A.WOOD), d = 6;
    for (let k = 4; k < w - 2; k += 18) { for (let yy = y + 3; yy < floorY; yy++) { put(pb, x + k, yy, Wd[4]); put(pb, x + k + 1, yy, Wd[2]); put(pb, x + k + 2, yy, Wd[1]); } }
    for (let r = 0; r < d; r++) { const yy = y - 1 - r, off = Math.round(r * 0.6); for (let xx = x + off; xx < x + w + off; xx++) put(pb, xx, yy, Wd[(xx - x) % 7 === 0 ? 3 : r === 0 ? 7 : 5]); }
    for (let xx = x; xx < x + w; xx++) { put(pb, xx, y, Wd[6]); put(pb, xx, y + 1, Wd[3]); put(pb, xx, y + 2, Wd[1]); }
    // barandilla trasera de cuerda y postes
    const top = y - d - 16;
    for (let xx = x + 4; xx < x + w + 4; xx += 12) for (let yy = top; yy < y - d; yy++) { put(pb, xx, yy, Wd[5]); put(pb, xx + 1, yy, Wd[2]); }
    for (let xx = x + 4; xx < x + w + 4; xx++) put(pb, xx, top + 2 + Math.round(Math.sin((xx - x) / 12 * Math.PI) * 1.5), U('#d8c8a0'));
  }
  /** Estación de vigilancia costera sobre pilotes (suelo en yF), con radar, FV y ventanal */
  function station(pb, x0, x1, yF, floorY) {
    const Wh = P32(A.WHITE), F = P32(PL.FRAME), w = x1 - x0, ceil = yF - 112, screens = [], lamps = [];
    for (const px of [x0 + 4, x0 + Math.round(w / 2) - 2, x1 - 8]) { A.castShadow(pb, px, floorY, 8, 6, -0.2); for (let yy = yF + 6; yy < floorY; yy++) { put(pb, px, yy, U('#7aa0b8')); put(pb, px + 1, yy, U('#567a94')); put(pb, px + 2, yy, U('#24384a')); } K.lineFn(pb, px + 2, yF + 10, px + 16, yF + 40, () => F[3]); }
    // muro del fondo con ventanal translúcido sobre la bahía
    // paneles de composite con juntas, sombra bajo el alero, canto iluminado a la izquierda, faceta lateral en sombra
    for (let yy = ceil + 8; yy < yF; yy++) for (let xx = x0; xx < x1; xx++) {
      const ly = yy - ceil - 8, lx = (xx - x0 + 2000) % 40;
      if (ly >= 8 && ly < 40 && lx > 3 && lx < 37 && xx > x0 + 4 && xx < x1 - 4) {
        // ventanal: marco, reflejo del ocaso arriba, bahía abajo y un destello diagonal
        if (ly === 8 || lx === 4 || lx === 36) { put(pb, xx, yy, F[4]); continue; }
        const gl = ((lx + ly) % 23) < 2;
        K.blend(pb, xx, yy, U(gl ? '#ffffff' : ly < 16 ? '#ffc0d8' : ly < 26 ? '#c8a8e8' : '#8ab0f0'), gl ? 0.5 : 0.3);
        continue;
      }
      let k = 6;
      if (ly < 6) k = 3 + (ly >> 1);                         // sombra del alero (degradado en bandas)
      else if (ly === 40) k = 7;                             // vierteaguas del ventanal
      else if (ly === 41) k = 3;
      else if (ly > 40 && (ly - 41) % 16 === 0) k = 4;       // junta horizontal de paneles
      else if (ly > 80) k = 4;
      if (lx === 0) k = 3; else if (lx === 1) k = Math.min(7, k + 1);    // junta vertical y canto
      if (xx === x0 || xx === x0 + 1) k = 7;                 // canto al sol
      else if (xx >= x1 - 3) k = Math.min(k, 3);             // esquina en sombra
      if (ly > 44 && ly < 80 && lx > 6 && lx < 34 && hash2(xx, ly >> 3, 77) < 0.04) k = 5;   // churretes suaves
      put(pb, xx, yy, Wh[k]);
    }
    for (let yy = ceil + 6; yy < yF - 1; yy++) for (let q = 0; q < 5; q++) put(pb, x1 + q, yy - Math.round(q * 0.7), Wh[q === 0 ? 1 : 2 + (yy - ceil < 14 ? -1 : 0)]);
    for (const [vx, vy] of [[x1 - 16, yF - 30]]) for (let q = 0; q < 4; q++) PL.hline(pb, vx, vx + 8, vy + q * 2, F[2]);   // rejilla de ventilación
    for (let xx = x0; xx < x1; xx++) for (let k = 0; k < 4; k++) put(pb, xx, yF - 14 + k, U(k === 0 ? '#5ae0ff' : '#1491aa'));
    // techo con FV y mástil de radar
    for (let xx = x0 - 4; xx < x1 + 4; xx++) for (let k = 0; k < 8; k++) put(pb, xx, ceil + k, k === 0 ? Wh[7] : k < 3 ? Wh[5] : k === 7 ? Wh[0] : Wh[3]);
    for (let r = 0; r < 6; r++) { const off = Math.round(r * 0.7); for (let xx = x0 - 4 + off; xx < x1 + 4 + off; xx++) put(pb, xx, ceil - 1 - r, Wh[r === 0 ? 7 : 5]); }
    PFASolar.pvTable(pb, x0 + 8, ceil - 3, 60, { low: 2, ph: 12, sk: 6, piles: 2, seed: 4 });
    const mx = x1 - 20; for (let yy = ceil - 60; yy < ceil; yy++) { put(pb, mx, yy, Wh[6]); put(pb, mx + 1, yy, Wh[2]); }
    hline(pb, mx - 7, mx + 8, ceil - 54, Wh[5]); hline(pb, mx - 5, mx + 6, ceil - 44, Wh[5]);
    // monitores y consola en el muro; suelo de vinilo en 3/4 con canto
    for (const sx of [x0 + 10, x0 + 60]) { rect(pb, sx, yF - 54, 30, 18, U('#06122a')); hline(pb, sx, sx + 29, yF - 54, F[5]); screens.push([sx + 2, yF - 52, 26, 14]); }
    for (let r = 0; r < 7; r++) { const yy = yF - 1 - r, off = Math.round(r * 0.7); for (let xx = x0 - 4 + off; xx < x1 + 4 + off; xx++) put(pb, xx, yy, r === 0 ? Wh[7] : Wh[5 - (r > 4 ? 1 : 0)]); }
    for (let xx = x0 - 4; xx < x1 + 4; xx++) { put(pb, xx, yF, Wh[6]); for (let k = 1; k < 6; k++) put(pb, xx, yF + k, k === 1 ? U('#1491aa') : F[k === 5 ? 0 : 3]); }
    for (let lx = x0 + 20; lx < x1 - 10; lx += 50) { rect(pb, lx, ceil + 8, 14, 2, Wh[2]); lamps.push([lx + 7, ceil + 11]); }
    return { radar: [mx, ceil - 62], screens, lamps };
  }
  /** Emisario: tubería grafito que baja hacia el mar y entra en el terreno (rumbo al difusor) */
  function emissary(pb, x0, x1, gy) {
    const BR = P32(I.PIPES.brine.ramp), r = 5;
    for (let x = x0; x < x1; x++) { const y = Math.round(gy(x)) - 8; for (let j = -r; j <= r; j++) put(pb, x, y + j, BR[PL.ti((j + r) / (2 * r), BR.length)]); if ((x - x0) % 30 === 0) for (let j = -r - 2; j <= r + 2; j++) { put(pb, x, y + j, BR[5]); put(pb, x + 1, y + j, BR[1]); } }
    for (let x = x0 + 14; x < x1; x += 40) { const y = Math.round(gy(x)); PFInfra.box3q(pb, x - 4, y, 9, 3, 4, { ramp: PFTerrain.CONC }); }
  }
  /** Boya de salinidad (dinámica): casco amarillo, panel FV, antena y LED */
  function drawBuoy(g, x, y, t, col = '#3fe0a0') {
    const bob = Math.round(Math.sin(t * 1.6 + x * 0.1) * 1.5), yy = y + bob;
    frect(g, x - 4, yy - 3, 9, 4, '#f0bc2c'); frect(g, x - 4, yy - 3, 9, 1, '#fff2a8'); frect(g, x - 3, yy + 1, 7, 1, '#a87414');
    frect(g, x - 1, yy - 10, 2, 7, '#c8d8e0'); frect(g, x - 3, yy - 7, 6, 2, '#25447e');
    if (Math.floor(t * 2 + x) % 2) { fpx(g, x, yy - 11, col); PFK.drawGlow(g, x, yy - 11, 4, col, 0.5); }
  }

  /* =====================================================================
     r3-desert · DIORAMA SALINO DEL N3 (bandas inferiores)
     r3sDiorama(pb, world, zones) pinta sobre la cara ya horneada, bajo el talud (d ≥ e1):
       E  borde (dique de costra / repisa de roca) con labio cálido
       T  terraza vista desde arriba (gy + e1 + GH … e2): salinas por etapas · repisa del cañón con
          charcas de salmuera · marisma de salicornia y manglar · bahía en corte con emisario
       C  corte frontal (d ≥ e2): estratos con cuevas de cristales de sal luminosos, rezumes de salmuera
     zones = [{x0, x1, kind:'pans'|'ledge'|'dikes'|'marsh'|'bay'|'caves', …}]
     Devuelve anclas dinámicas {cry:[[x,y,col]], seeps:[[x,y,w]], pans:[{x0,x1,y0,y1}], birds:[[x,y,f]],
       plume:{x,y,x1,yb}, fish:[{x0,x1,y}], lamps:[[x,y,col,r]], spill:[[x,y,h]], grass:[[x,y,h]]}.
     Paleta sin rosas/malvas (la guarda de tono del nivel los vira): coral, melocotón, lavanda azulada,
     turquesa, verde y blanco de sal. Sin tramado.
     ===================================================================== */
  const R3S_ROCK = ['#1e0a1e', '#341230', '#461a3a', '#6e2c40', '#8e4248', '#ae5a5c', '#cc7a68', '#e8a07a', '#f8c894'];
  const R3S_W = {
    sea: ['#0c2a5a', '#14468a', '#1e6aa8', '#2a92c4', '#4ab8d8', '#8adcea', '#d8f6fa'],
    tq: ['#0a3a4a', '#106070', '#18888e', '#2aaea6', '#56cab8', '#9ae4d0', '#e0fbf2'],
    lav: ['#24286a', '#343a8a', '#4a52a8', '#6670c2', '#8a94d8', '#b8c0ec', '#e8ecfc'],
    cor: ['#5a1a1a', '#8a2e2a', '#b44a3a', '#d66a4a', '#ec8c62', '#f8b48a', '#fde0c8'],
  };
  const R3S_CRY = ['#1a1450', '#2e2a8a', '#4c4ac0', '#7a7ae0', '#aab0f4', '#dce4ff', '#ffffff'];
  const R3S_CYA = ['#06304a', '#0e5a7a', '#1a8eae', '#3ac2d8', '#7ee8f0', '#c4fbff', '#ffffff'];
  const R3S_CAVE = ['#07040e', '#0c0618', '#140a24', '#1e1032', '#2a1840', '#382050'];
  const R3S_MUD = ['#160c1c', '#24142a', '#361e38', '#4c2c44', '#663c4e', '#82525a', '#9c6a66', '#b4846e'];
  const R3S_GH = 6, R3S_SH = U('#2a1040');
  function r3sGeom(world) {
    if (world._r3s) return world._r3s;
    const wd = world.w + 1, gs = new Float32Array(wd), e1 = new Int16Array(wd), e2 = new Int16Array(wd);
    for (let x = 0; x < wd; x++) { let a = 0, n = 0; for (let k = -28; k <= 28; k += 4) { const xx = clamp(x + k, 0, world.w); a += world.ground[xx]; n++; } gs[x] = a / n; }
    for (let x = 0; x < wd; x++) {
      const gy = world.ground[x], v = PFK.vn(x * 0.011, 0.4, 611);
      e1[x] = Math.max(gy + 12, Math.round(gs[x] + 17 + (v - 0.5) * 6));
      e2[x] = Math.round(e1[x] + R3S_GH + (world.h - e1[x]) * 0.5 + (PFK.vn(x * 0.007, 0.9, 613) - 0.5) * 8);
    }
    return (world._r3s = { e1, e2 });
  }
  function r3sAt(world, x) { const G = r3sGeom(world), i = clamp(Math.round(x), 0, world.w); return { gy: world.ground[i], e1: G.e1[i], top: G.e1[i] + R3S_GH, e2: G.e2[i] }; }
  /** Sombra arrojada abajo-derecha (elipse violeta) */
  function r3sShadow(pb, x, yb, rx, ry, k = 0.4) {
    for (let yy = Math.round(yb - ry * 0.4); yy <= Math.round(yb + ry); yy++) for (let xx = Math.round(x - rx * 0.3); xx <= Math.round(x + rx * 1.7); xx++) {
      const nx = (xx - (x + rx * 0.7)) / (rx * 1.05), ny = (yy - (yb + ry * 0.25)) / ry; if (nx * nx + ny * ny > 1) continue;
      const c = get(pb, xx, yy); if (c >>> 24) put(pb, xx, yy, K.mixU(c, R3S_SH, k * (1 - Math.max(0, nx) * 0.35)));
    }
  }
  /** Racimo de cristales de sal: prismas con faceta iluminada (izq.), canto blanco, cara en sombra; halo horneado suave */
  function r3sCrystals(pb, x, yb, h, seed = 1, ramp = R3S_CRY, glow = true) {
    const C = P32(ramp), r = RNG(seed), n = 3 + r.int(0, 3), out = [];
    if (glow) for (let yy = yb - h - 6; yy < yb + 3; yy++) for (let xx = x - h; xx < x + h; xx++) { const d = Math.hypot((xx - x) / h, (yy - yb + h * 0.5) / (h * 0.8)); if (d > 1) continue; const c = get(pb, xx, yy); if (c >>> 24) put(pb, xx, yy, K.mixU(c, C[4], (1 - d) * 0.32)); }
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n - 0.5, cx = Math.round(x + t * h * 0.9 + r.int(-1, 1)), ch = Math.round(h * (0.45 + (1 - Math.abs(t) * 1.6) * 0.5 + r() * 0.15)), cw = 2 + r.int(0, 2), lean = t * 0.5;
      for (let k = 0; k < ch; k++) for (let q = 0; q < cw; q++) {
        const tip = k > ch - cw; if (tip && Math.abs(q - (cw - 1) / 2) > (ch - k) * 0.6) continue;
        const xx = Math.round(cx + q + lean * k), yy = yb - k;
        put(pb, xx, yy, C[clamp(q === 0 ? 5 : q === cw - 1 ? 2 : 4 - (k % 5 === 0 ? 1 : 0) + (tip ? 2 : 0), 0, 6)]);
      }
      out.push([Math.round(cx + lean * ch), yb - ch]);
    }
    return out;
  }
  /** Salina (estanque de evaporación) vista desde arriba en 3/4: dique de costra, lámina por etapa y reflejo del cielo */
  function r3sPan(pb, x0, x1, y0, y1, stage, seed = 1) {
    const Wt = P32(stage === 0 ? R3S_W.sea : stage === 1 ? R3S_W.tq : stage === 2 ? R3S_W.lav : R3S_W.cor), Sl = P32(SALT), r = RNG(seed);
    const sk = 0.35, h = y1 - y0;
    for (let y = y0; y < y1; y++) {
      const off = Math.round((y1 - y) * sk), a = x0 + off, b = x1 + off, v = (y - y0) / h;
      for (let x = a; x < b; x++) {
        const ex = Math.min(x - a, b - 1 - x), ey = Math.min(y - y0, y1 - 1 - y);
        let c;
        if (ey === 0 && y === y0) c = Sl[8]; else if (ey === 0) c = Sl[2];
        else if (ex <= 1) c = Sl[ex === 0 ? (x === a ? 7 : 3) : 5];
        else if (y === y0 + 1) c = Sl[6];
        else if (stage === 4) { const cr = PFK.cl(x, y, 3, 621 + seed); c = Sl[clamp(6 + Math.round((cr - 0.5) * 2) + (hash2(x >> 1, y, 623) < 0.08 ? -2 : 0), 3, 8)]; }
        else {
          let k = 2 + Math.round(v * 2.4 + (PFK.cl(x, y, 3, 625 + seed) - 0.5) * 0.9);
          if (y === y0 + 2) k = 1;                                                                               // sombra del dique trasero
          const rf = ((x - a) * 0.5 + y * 1.3 + seed * 7) % 23; if (rf < 1.2 && v > 0.25) k += 2;              // reflejo del cielo en franjas
          if (stage === 3 && hash2(x >> 1, y >> 1, 627 + seed) < 0.06) { c = Sl[7]; put(pb, x, y, c); continue; } // balsas de cristales flotando
          c = Wt[clamp(k, 0, 6)];
        }
        put(pb, x, y, c);
      }
    }
    // costra en el borde de la lámina (la sal precipita en la orilla)
    if (stage >= 2) for (let y = y0 + 2; y < y1 - 1; y++) { const off = Math.round((y1 - y) * sk); put(pb, x0 + off + 2, y, Sl[7]); if (r() < 0.5) put(pb, x0 + off + 3, y, Sl[6]); }
    return { x0, x1, y0, y1, sk };
  }
  /** Casa de bombas en 3/4: muro encalado, lateral violeta, tejado de teja con plano visible y labio cálido */
  function r3sPumpHouse(pb, x, yb, w = 30, h = 20, o = {}) {
    const Wl = P32(A.WHITE), RF = P32(['#3a1410', '#5e2218', '#8a3422', '#b44a2e', '#d86a3e', '#f08e58', '#fbc371']), d = 9, sk = 0.7, dx = Math.round(d * sk);
    r3sShadow(pb, x + w * 0.6, yb + 1, w * 0.6, 6, 0.42);
    I.box3q(pb, x, yb, w, h, d, { ramp: A.WHITE, skew: sk,
      side: (xx, yy, u, v) => K.mixU(Wl[clamp(4 - Math.round(v * 1.5), 1, 6)], U('#4a2a6a'), 0.45),
      front: (xx, yy, u, v) => { const lx = xx - x, ly = yy - (yb - h); if (lx === 0) return U('#fbc371'); if (ly < 3) return K.mixU(Wl[5], U('#24183e'), 0.42 - ly * 0.1); if (ly > h - 3) return Wl[3]; return Wl[clamp(6 - (PFK.cl(xx, yy, 3, 631) < 0.08 ? 1 : 0) - (lx > w - 3 ? 1 : 0), 0, 7)]; } });
    // tejado a un agua con plano visible (teja) y alero
    const ry = yb - h;
    for (let r = 0; r < d + 3; r++) { const off = Math.round(r * sk) - 2; for (let xx = x - 2 + off; xx < x + w + 2 + off; xx++) put(pb, xx, ry - r, r === d + 2 ? RF[6] : ((xx - off) % 4 === 0) ? RF[2] : RF[r < 2 ? 3 : 4 + ((r >> 1) & 1)]); }
    for (let xx = x - 2; xx < x + w + 2; xx++) { put(pb, xx, ry + 1, RF[1]); put(pb, xx - 2, ry, RF[6]); }
    for (let r = 0; r < d + 3; r++) put(pb, x - 2 + Math.round(r * sk) - 2, ry - r, RF[6]);
    // puerta, ventanuco con luz, tubería de salida y placa
    for (let yy = yb - 12; yy < yb; yy++) for (let xx = x + 4; xx < x + 11; xx++) put(pb, xx, yy, (xx === x + 4 || yy === yb - 12) ? Wl[1] : U(((xx - x) % 3) ? '#4a2a1a' : '#6e4226'));
    for (let yy = yb - h + 5; yy < yb - h + 9; yy++) for (let xx = x + w - 10; xx < x + w - 4; xx++) put(pb, xx, yy, U(yy === yb - h + 5 ? '#ffe8a0' : '#f0b860'));
    if (o.label) K.text(pb, o.label, x + 13, yb - 11, U('#2a1c3a'), { font: 'tiny' });
    return { lamp: [x + w - 7, yb - h + 7], door: [x + 7, yb - 6] };
  }
  /** Compuerta (tajadera) entre salinas: marco de hormigón, tablero de acero medio alzado, volante y chorro */
  function r3sSluice(pb, x, yb, w = 10) {
    const C = P32(PFTerrain.CONC), St = P32(I.STEEL);
    for (const px of [x, x + w]) { for (let yy = yb - 16; yy < yb + 2; yy++) { put(pb, px, yy, C[6]); put(pb, px + 1, yy, C[3]); } }
    for (let xx = x; xx <= x + w + 1; xx++) { put(pb, xx, yb - 17, C[7]); put(pb, xx, yb - 16, C[4]); }
    for (let yy = yb - 14; yy < yb - 6; yy++) for (let xx = x + 2; xx < x + w; xx++) put(pb, xx, yy, St[(xx === x + 2) ? 6 : (yy % 3 === 0) ? 2 : 4]);
    K.ellipseFn(pb, x + w / 2 + 1, yb - 20, 3, 2, (nx, ny, dd) => dd > 0.6 ? U('#c8562a') : 0);
    for (let yy = yb - 22; yy < yb - 17; yy++) put(pb, x + Math.round(w / 2) + 1, yy, St[3]);
    return [x + 2, yb - 6, w - 2];
  }
  /** Cueva de sal en el corte: boca irregular, interior oscuro con fondo de luz violeta, cristales luminosos y charca de salmuera */
  function r3sCave(pb, cx, cy, rw, rh, seed = 1) {
    const r = RNG(seed), CV = P32(R3S_CAVE), out = { cry: [], seep: null };
    const rad = (a) => 1 + (PFK.vn(Math.cos(a) * 2 + seed, Math.sin(a) * 2, 641) - 0.5) * 0.5;
    for (let yy = Math.round(cy - rh * 1.4); yy <= Math.round(cy + rh * 0.9); yy++) for (let xx = Math.round(cx - rw * 1.4); xx <= Math.round(cx + rw * 1.4); xx++) {
      const nx = (xx - cx) / rw, ny = (yy - cy) / rh, a = Math.atan2(ny, nx), d = Math.hypot(nx, ny) / rad(a);
      if (ny > 0.7) continue;                                                                                    // suelo plano de la cueva
      if (d > 1.08) continue;
      if (d > 1) { const c = get(pb, xx, yy); put(pb, xx, yy, ny < 0 ? K.mixU(c, U('#fde0c8'), 0.45) : K.mixU(c, U('#140818'), 0.5)); continue; }  // labio: arriba claro, abajo oscuro
      const depth = 1 - d, glow = Math.max(0, 1 - Math.hypot(nx * 0.8, (ny - 0.5) * 1.4));
      put(pb, xx, yy, K.mixU(CV[clamp(Math.round(1 + depth * 3 - (ny < -0.3 ? 1 : 0)), 0, 5)], U('#6a5ad8'), glow * 0.45));
    }
    // estalactitas de sal en el techo
    for (let i = 0; i < Math.round(rw / 3); i++) { const sx = Math.round(cx - rw * 0.8 + r() * rw * 1.6), top = Math.round(cy - rh * 0.95 * Math.sqrt(Math.max(0, 1 - ((sx - cx) / rw) ** 2))), L = 2 + r.int(0, 5); for (let k = 0; k < L; k++) put(pb, sx, top + k, U(k === L - 1 ? '#ffffff' : '#c8d0f4')); }
    // charca de salmuera luminosa en el suelo
    const py = Math.round(cy + rh * 0.62), pw = Math.round(rw * 1.1);
    for (let xx = Math.round(cx - pw / 2); xx < Math.round(cx + pw / 2); xx++) { const e = Math.min(xx - (cx - pw / 2), cx + pw / 2 - xx); put(pb, xx, py, U(e < 2 ? '#b8c0ec' : '#7ee8f0')); put(pb, xx, py + 1, U(e < 2 ? '#4a52a8' : '#3ac2d8')); if (e > 2 && (xx % 5 === 0)) put(pb, xx, py, U('#ffffff')); }
    out.seep = [Math.round(cx - pw / 2), py, pw];
    // cristales en el suelo y las paredes
    const n = 2 + r.int(0, 2);
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n - 0.5, x = Math.round(cx + t * rw * 1.4), h = Math.round(rh * (0.5 + r() * 0.5)); const ramp = i % 3 === 1 ? R3S_CYA : R3S_CRY; out.cry.push(...r3sCrystals(pb, x, py - 1, h, seed * 7 + i, ramp).map(p => [p[0], p[1], ramp === R3S_CYA ? '#7ee8f0' : '#aab0f4'])); }
    return out;
  }
  /** Banda de pasto salado / salicornia densa a lo largo de una línea (un grupo cada ~gap px) */
  function r3sMarsh(pb, x0, x1, yf, gap = 9, seed = 1) {
    const r = RNG(seed);
    for (let x = x0 + r.int(0, gap); x < x1; x += Math.round(gap * (0.6 + r() * 0.8))) {
      const y = Math.round(yf(x)), k = r();
      if (k < 0.5) salicornia(pb, x, y, 10 + r.int(0, 8), x * 3 + seed);
      else if (k < 0.8) PFFlora.tuft(pb, x, y, 7, 6 + r.int(0, 4), x + seed, PFFlora.DRY, { wind: 1 });
      else PFFlora.cluster(pb, x, y - 3, 4, 3, ['#1a2a10', '#2e4a1a', '#4a6a22', '#6a8a2e', '#94b040', '#c4d670'], x + seed, { leaf: [2, 3], density: 0.8 });
    }
  }
  /** Diorama completo (ver cabecera de la sección) */
  function r3sDiorama(pb, world, zones) {
    const G = r3sGeom(world), Rk = P32(R3S_ROCK), Sl = P32(SALT), M = P32(R3S_MUD), FA = { cry: [], seeps: [], pans: [], birds: [], fish: [], lamps: [], spill: [], plume: null, glints: [] };
    const zoneAt = (x) => zones.find(z => x >= z.x0 && x < z.x1) || zones[zones.length - 1];
    const H_ = world.h;
    /* --- 1. borde, terraza y corte por columnas --- */
    for (let x = 0; x <= world.w && x < pb.w; x++) {
      const z = zoneAt(x), e1 = G.e1[x], top = e1 + R3S_GH, e2 = G.e2[x];
      for (let y = e1; y < H_ && y < pb.h; y++) {
        let c;
        if (z.kind === 'bay' && y >= z.wl) {                                                                      // bahía en corte: agua con degradado y fondo arenoso
          const sb = z.bed + Math.round((PFK.vn(x * 0.02, 0, 651) - 0.5) * 10 + Math.sin(x * 0.03) * 2);
          const hd = z.x0 + 40 + Math.round((y - z.wl) * 0.9 + (PFK.vn(y * 0.1, 2, 657) - 0.5) * 8);              // cabo rocoso que entra en el agua
          if (x < hd) { put(pb, x, y, Rk[clamp(5 - Math.round((y - z.wl) / 14) + Math.round((PFK.cl(x, y, 3, 659) - 0.5) * 1.6) + (x === hd - 1 ? -2 : 0) + (hash2(x >> 1, y >> 1, 661) < 0.05 ? 2 : 0), 0, 8)]); continue; }
          if (y === z.wl) c = U(((x + Math.floor(x / 7)) % 9) < 2 ? '#ffffff' : '#9ae4f0');
          else if (y < sb) {
            const v = (y - z.wl) / Math.max(1, sb - z.wl), Wt = P32(R3S_W.sea);
            let k = 5.4 - v * 4.6 + (PFK.cl(x, y, 4, 653) - 0.5) * 0.6;
            const sh = ((x + (y - z.wl) * 0.55) % 90 + 90) % 90; if (sh < 14) k += 0.9 * (1 - v) * Math.sin(sh / 14 * Math.PI);   // haces de luz oblicuos
            c = Wt[clamp(Math.round(k), 0, 6)]; if (v < 0.3 && ((x * 0.4 + y * 1.7 + Math.sin(x * 0.05) * 3) % 19) < 1) c = Wt[6];
          }
          else { const v = y - sb; c = v < 1 ? U('#e8c890') : P32(['#3a2418', '#5a3a26', '#7a5636', '#9a7448', '#b8925c', '#d0aa70'])[clamp(5 - Math.round(v / 3) + Math.round((PFK.cl(x, y, 2, 655) - 0.5) * 1.4), 0, 5)]; }
          put(pb, x, y, c); continue;
        }
        if (y < top) {                                                                                             // borde: dique de costra o repisa de roca
          const yy = y - e1;
          if (z.kind === 'pans' || z.kind === 'dikes') c = yy === 0 ? Sl[8] : yy === 1 ? Sl[7] : yy === R3S_GH - 1 ? U('#2a1838') : Sl[clamp(5 - (yy > 3 ? 1 : 0) + Math.round((PFK.cl(x, y, 2, 657) - 0.5) * 1.2), 2, 7)];
          else if (z.kind === 'marsh') c = yy === 0 ? U('#c4d670') : yy === R3S_GH - 1 ? M[0] : M[clamp(5 - yy + (x % 7 === 0 ? -1 : 0), 1, 7)];
          else c = yy === 0 ? U('#ffd8b0') : yy === 1 ? Rk[8] : yy === R3S_GH - 1 ? Rk[0] : Rk[clamp(6 - yy + Math.round((PFK.cl(x, y, 3, 659) - 0.5) * 1.4), 1, 7)];
        } else if (y < e2) {                                                                                       // terraza vista desde arriba
          const q = y - top, span = e2 - top, v = q / Math.max(1, span), ao = q < 2 ? (q === 0 ? -2 : -1) : 0;
          if (z.kind === 'pans' || z.kind === 'dikes') c = Sl[clamp(5 + Math.round((PFK.cl(x, y, 3, 661) - 0.5) * 1.6 + (PFK.vn(x * 0.05, y * 0.1, 663) - 0.5) * 1.2) + ao + (v > 0.8 ? 1 : 0), 2, 8)];
          else if (z.kind === 'marsh') { const MG = P32(['#16200e', '#24341a', '#364a22', '#4e6630', '#6e8a44', '#8eaa52', '#b4c86a']); c = MG[clamp(3 + Math.round((PFK.cl(x, y, 2, 665) - 0.5) * 2 + (PFK.vn(x * 0.06, y * 0.12, 667) - 0.5) * 1.6) + ao + (v > 0.8 ? 1 : 0), 0, 6)]; }
          else c = Rk[clamp(5 + Math.round((PFK.cl(x, y, 3, 669) - 0.5) * 1.6 + (PFK.vn(x * 0.04, y * 0.08, 671) - 0.5) * 1.6) + ao + (v > 0.75 ? 1 : 0) - (hash2(x, y, 673) < 0.03 ? 2 : 0), 1, 8)];
        } else {                                                                                                   // corte frontal
          const c0 = y - e2;
          if (c0 === 0) c = U((x & 3) ? '#ffe0c0' : '#f8c894');
          else if (c0 === 1) c = U('#e8a07a');
          else {
            const w1 = (PFK.vn(x * 0.04, 1, 675) - 0.5) * 5, zz = c0 + w1 + PFK.vn(x * 0.02, c0 * 0.1, 677) * 3, L = Math.floor(zz / 6) % 4, edge = (zz % 6) < 1, ao = Math.round(c0 / Math.max(20, H_ - e2) * 2.4);
            if (z.kind === 'marsh') c = M[clamp(5 - ao + Math.round((PFK.cl(x, y, 2, 679) - 0.5) * 1.4) - (edge ? 2 : 0), 0, 7)];
            else if (L === 2 && z.kind !== 'ledge' && z.kind !== 'caves') c = Sl[clamp(6 - ao + Math.round((PFK.cl(x, y, 2, 681) - 0.5) * 1.2) - (edge ? 2 : 0), 1, 8)];   // estrato de sal
            else c = Rk[clamp(6 - ao - (L === 1 ? 1 : 0) + Math.round((PFK.cl(x, y, 2, 683) - 0.5) * 1.4) - (edge ? 2 : 0), 0, 8)];
            if (hash2(x >> 1, y >> 1, 685) < 0.02) c = Sl[8];
          }
        }
        put(pb, x, y, c);
      }
    }
    const at = (x) => r3sAt(world, x), qy = (x, q) => { const A2 = at(x); return Math.round(A2.top + (A2.e2 - A2.top) * q); };
    const items = [], add = (y, fn) => items.push({ y, fn });
    /* --- 2. contenido por zona --- */
    for (const z of zones) {
      const rr = RNG(z.seed || (z.x0 + 7));
      if (z.kind === 'pans' || z.kind === 'dikes') {
        // filas de salinas por etapas (concentración creciente hacia el fondo y hacia el oeste)
        const rows = z.kind === 'pans' ? [[0.1, 0.42], [0.52, 0.9]] : [[0.12, 0.5], [0.58, 0.92]];
        let st0 = z.stage0 ?? 0;
        for (const [qa, qb] of rows) {
          for (let x = z.x0 + 6; x < z.x1 - 20;) {
            const pw = rr.int(z.pw ? z.pw[0] : 42, z.pw ? z.pw[1] : 74), xe = Math.min(z.x1 - 8, x + pw);
            if (z.skip && z.skip.some(([a, b]) => x < b && xe > a)) { x = xe + 6; continue; }
            const px0 = x, y0 = qy(x + pw / 2, qa), y1 = qy(x + pw / 2, qb), stage = (st0 + Math.floor((x - z.x0) / 70)) % 5;
            add(y0, () => { const P_ = r3sPan(pb, px0, xe, y0, y1, stage, px0); FA.pans.push(P_); });
            if (rr() < 0.45) add(y1 + 1, () => FA.spill.push(r3sSluice(pb, xe - 2, y1 - 1, 8)));
            x = xe + rr.int(5, 9);
          }
          st0 += 2;
        }
        for (const [x, q, lab] of (z.houses || [])) { const yb = qy(x + 15, q); add(yb, () => { const h = r3sPumpHouse(pb, x, yb, 30, 18, { label: lab }); FA.lamps.push([h.lamp[0], h.lamp[1], '#ffd890', 9]); }); }
        // montones de sal cosechada y salicornia en los diques
        for (let x = z.x0 + rr.int(10, 30); x < z.x1 - 10; x += rr.int(60, 110)) { const y = qy(x, 0.47); add(y, () => saltPile(pb, x, y + 2, 16 + rr.int(0, 8), 7 + rr.int(0, 4), x)); }
        add(9998, () => r3sMarsh(pb, z.x0, z.x1, (x) => at(x).top + 2, 11, z.x0));
        add(9999, () => r3sMarsh(pb, z.x0, z.x1, (x) => at(x).e2 - 2, 10, z.x0 + 3));
      } else if (z.kind === 'ledge' || z.kind === 'caves') {
        // repisa del cañón: charcas de salmuera, cristales, peñas, salicornia; tubería grafito por la repisa
        // gours (represas de travertino salino) escalonados con salmuera luminosa: 2 filas a lo largo de la repisa
        for (const qg of [0.3, 0.68]) for (let x = z.x0 + rr.int(10, 40); x < z.x1 - 40; x += rr.int(70, 120)) {
          const gx = x, gw = 26 + rr.int(0, 18), y = qy(gx, qg);
          add(y, () => {
            for (let st = 0; st < 3; st++) { const sx = gx + st * Math.round(gw * 0.3), sw = gw - st * 6, sy = y + st * 3;
              for (let xx = sx; xx < sx + sw; xx++) { const e = Math.min(xx - sx, sx + sw - 1 - xx), arc = Math.round(Math.sqrt(Math.max(0, 1 - ((xx - sx - sw / 2) / (sw / 2)) ** 2)) * 2);
                put(pb, xx, sy - arc - 1, Sl[8]); put(pb, xx, sy - arc, U(e < 2 ? '#b8c0ec' : (xx % 7 === 0 ? '#ffffff' : '#7ee8f0'))); put(pb, xx, sy - arc + 1, U(e < 2 ? '#6670c2' : '#3ac2d8')); put(pb, xx, sy + 2, Sl[6]); put(pb, xx, sy + 3, Sl[3]); }
              FA.seeps.push([sx + 2, sy - 1, sw - 4]); }
          });
        }
        for (let x = z.x0 + rr.int(4, 14); x < z.x1 - 8; x += rr.int(14, 24)) {
          const q = 0.06 + rr() * 0.9, y = qy(x, q), k = rr(), px = x;
          if (k < 0.3) add(y, () => FA.cry.push(...r3sCrystals(pb, px, y, 6 + rr.int(0, 7), px, rr() < 0.3 ? R3S_CYA : R3S_CRY).map(p => [p[0], p[1], '#aab0f4'])));
          else if (k < 0.5) add(y, () => boulder(pb, px, y, 9 + rr.int(0, 9), 5 + rr.int(0, 4), R3S_ROCK, px, { speck: '#f2e4ea' }));
          else if (k < 0.72) add(y, () => { salicornia(pb, px, y, 14, px); PFFlora.tuft(pb, px + 6, y, 7, 7, px, PFFlora.DRY, { wind: 1 }); });
          else if (k < 0.86) add(y, () => saltScrub(pb, px, y, 10 + rr.int(0, 6), px));
          else add(y, () => halite(pb, px, y, 1 + rr.int(0, 1), px));
        }
        if (z.pipe) add(z.pipeQ ? qy(z.x0, z.pipeQ) : 1, () => { const pts = z.pipe.map(([px, q]) => [px, qy(px, q)]); I.pipe(pb, pts, 3, 'brine', { flange: 24, supports: 34, supportTo: (x) => qy(x, z.pipe[0][1]) + 6 }); FA.brinePipe = pts; });
        // cuevas de cristales en el corte frontal
        for (const [cx, rw, rh] of (z.caves || [])) { const A2 = at(cx), cy = Math.round(A2.e2 + (H_ - A2.e2) * 0.45); const cv = r3sCave(pb, cx, cy, rw, rh, cx); FA.cry.push(...cv.cry); FA.seeps.push(cv.seep); }
      } else if (z.kind === 'marsh') {
        // canal mareal serpenteante, manglar, salicornia y garzas
        const mq = (x) => 0.5 + (PFK.vn(x * 0.012, 3, 691) - 0.5) * 0.7 + Math.sin(x * 0.021) * 0.08;
        add(1, () => { const Wt = P32(R3S_W.tq), Mu = P32(R3S_MUD); for (let x = z.x0; x < z.x1; x++) { const yc = qy(x, mq(x)), hw = 2 + Math.round(PFK.vn(x * 0.05, 1, 693) * 3); for (let k = -hw - 2; k <= hw + 1; k++) put(pb, x, yc + k, k < -hw ? Mu[6 + (k === -hw - 2 ? 1 : 0)] : k > hw ? Mu[3] : k === -hw ? U('#e0fbf2') : k === hw ? Wt[1] : Wt[clamp(3 + (k < 0 ? 1 : 0) + (((x + k * 3) % 17) < 1 ? 2 : 0), 0, 6)]); } FA.glints.push({ x0: z.x0, x1: z.x1, y: (x) => qy(x, mq(x)) }); });
        for (let x = z.x0 + 8; x < z.x1 - 8; x += rr.int(22, 36)) { const mx = x, y = qy(x, rr() < 0.5 ? 0.12 + rr() * 0.2 : 0.78 + rr() * 0.18); add(y, () => mangrove(pb, mx, y, 30 + rr.int(0, 16), mx)); }
        add(9999, () => { r3sMarsh(pb, z.x0, z.x1, (x) => at(x).top + 3, 7, z.x0); r3sMarsh(pb, z.x0, z.x1, (x) => qy(x, 0.95), 8, z.x0 + 1); });
        for (const [x, q, f] of (z.birds || [])) FA.birds.push([x, qy(x, q), f]);
      } else if (z.kind === 'bay') {
        // fondo marino: pradera de fanerógamas, rocas, emisario apoyado en el fondo y difusor con boquillas
        const sb = (x) => z.bed + Math.round((PFK.vn(x * 0.02, 0, 651) - 0.5) * 10 + Math.sin(x * 0.03) * 2);
        for (let x = z.x0 + 4; x < z.x1 - 4; x += 3 + ((x * 7) % 4)) { if (z.diff && x > z.diff[0] - 30 && x < z.diff[0] + 70) continue; const y = sb(x), hh = 5 + ((x * 13) % 9); for (let k = 0; k < hh; k++) put(pb, x + Math.round(Math.sin(k * 0.4 + x) * 0.6), y - k, U(k > hh - 3 ? '#9ac458' : k % 2 ? '#3e7a3a' : '#2a5a2e')); }
        for (let x = z.x0 + 20; x < z.x1; x += 60 + ((x * 3) % 40)) boulder(pb, x, sb(x) + 1, 14, 7, R3S_ROCK, x);
        if (z.pipeX) {
          // emisario: baja por el acantilado en corte y corre por el fondo hasta el difusor
          const px = z.pipeX, dx = z.diff[0], BR = P32(I.PIPES.brine.ramp), rP = 3;
          const pts = [[px, at(px).e1 - 2], [px, z.wl + 6], [px + 18, sb(px + 18) - 4], [dx, sb(dx) - 4]];
          I.pipe(pb, pts, rP, 'brine', { flange: 20 });
          FA.brinePipe2 = pts;
          // difusor: tramo con 4 elevadores y boquillas inclinadas
          const dy = sb(dx) - 4;
          for (let k = 0; k < 4; k++) { const rx = dx + 8 + k * 14; for (let q = 0; q < 8; q++) { put(pb, rx, dy - 3 - q, BR[4]); put(pb, rx + 1, dy - 3 - q, BR[2]); } put(pb, rx + 1, dy - 11, BR[6]); put(pb, rx + 2, dy - 12, BR[6]); put(pb, rx + 2, dy - 11, BR[3]); }
          for (let xx = dx; xx < dx + 58; xx++) for (let j = -rP; j <= rP; j++) put(pb, xx, dy + j, BR[clamp(Math.round((j + rP) / (2 * rP) * 6), 0, 6)]);
          for (let xx = dx + 2; xx < dx + 58; xx += 12) PFInfra.box3q(pb, xx, dy + rP + 3, 6, 3, 3, { ramp: PFTerrain.CONC });
          K.text(pb, 'DIFUSOR', dx + 4, dy + 8, U('#e8ecfc'), { font: 'tiny' });
          FA.plume = { x: dx + 8, y: dy - 12, n: 4, step: 14, bed: (x) => sb(x) - 1, x1: Math.min(z.x1, dx + 170) };
          // límite de la zona de mezcla (trazos discontinuos) y rótulo
          const zx0 = dx - 6, zx1 = Math.min(z.x1 - 4, dx + 150), zy0 = dy - 30;
          for (let xx = zx0; xx < zx1; xx++) if ((xx >> 2) % 2 === 0) put(pb, xx, zy0, U('#e8ecfc'));
          for (const xx of [zx0, zx1]) for (let yy = zy0; yy < sb(xx) - 1; yy++) if ((yy >> 2) % 2 === 0) put(pb, xx, yy, U('#e8ecfc'));
          K.text(pb, 'ZONA DE MEZCLA', zx0 + 34, zy0 + 2, U('#e8ecfc'), { font: 'tiny' });
        }
        for (const f of (z.fish || [])) FA.fish.push(f);
        // roca de la costa sobre la línea de agua: cueva con cristales
        for (const [cx, rw, rh] of (z.caves || [])) { const cy = Math.round((at(cx).top + z.wl) / 2 + 2); const cv = r3sCave(pb, cx, cy, rw, rh, cx); FA.cry.push(...cv.cry); FA.seeps.push(cv.seep); }
      }
    }
    items.sort((a, b) => a.y - b.y);
    for (const it of items) it.fn();
    return FA;
  }

  /* ---------- oclusor frontal: cristales de sal violetas y salicornia oscura ---------- */
  function fgSalt(o) {
    const w = o.w || 140, h = o.h || 70, pb = new PixelBuffer(w, h), r = RNG(o.seed || 1);
    const C = P32(['#05040e', '#0b0820', '#140e34', '#20184a', '#2e2262', '#463482', '#6a50aa']);
    for (let i = 0; i < Math.round(w / 9); i++) {
      const cx = r() * w, hh = 10 + r() * (h - 18), cw = 3 + r.int(0, 4), lean = (r() - 0.5) * 0.5;
      for (let k = 0; k < hh; k++) for (let q = 0; q < cw; q++) { const xx = Math.round(cx + q + lean * k), yy = h - 1 - k; const tip = k > hh - cw; if (tip && q > (hh - k)) continue; put(pb, xx, yy, C[q === 0 ? 5 : q === cw - 1 ? 1 : 3 - (k % 9 === 0 ? 1 : 0)]); }
    }
    for (let i = 0; i < Math.round(w / 3); i++) { const sx = r() * w, hh = 6 + r.int(0, 12); for (let k = 0; k < hh; k++) put(pb, Math.round(sx), h - 1 - k, U(k > hh - 3 ? '#3a0a1e' : '#0e1a0e')); }
    K.rim(pb, U('#c87aa8'), 0.4, -1, -1);
    return pb;
  }
  if (typeof PFStage !== 'undefined' && PFStage.FG) PFStage.FG.aSalt = fgSalt;

  return { build, renderBack, renderFront, outfall, boulder, halite, saltScrub, saltPile, saltPillar, hoodoo, weir, pond, mangrove, salicornia, reeds, boardwalk, station, emissary, drawBuoy, SALT, BRW, WET, MANG,
    // r3-desert: diorama salino del N3
    r3sDiorama, r3sAt, r3sCrystals, r3sPan, r3sPumpHouse, r3sSluice, r3sCave, r3sMarsh, r3sShadow, R3S_CRY, R3S_CYA, R3S_W };
})();
