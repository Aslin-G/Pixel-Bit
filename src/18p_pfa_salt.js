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

  /* ---------- agua en 3/4: canal de salmuera y humedal ---------- */
  function build(world, w) {
    const P = P32(w.style === 'wetA' ? WET : BRW), x0 = w.x0, x1 = w.x1, wy = w.y, wd = x1 - x0 + 1;
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
        pb.data[y * wd + x] = u;
      }
    }
    return { brineA: true, w, x0, x1, wy, top, c: pb.toCanvas() };
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
    // lámina translúcida sobre lo que vadea (pies de los personajes) y línea de superficie brillante
    g.globalAlpha = 0.42; g.fillStyle = wet ? '#146a6a' : '#3a2a80'; g.fillRect(xa, y + 1, xb - xa, 9);
    g.globalAlpha = 0.3; g.fillStyle = wet ? '#0a3a42' : '#18206a'; g.fillRect(xa, y + 5, xb - xa, 5);
    g.globalAlpha = 1; g.fillStyle = wet ? '#9cf0d0' : '#e5c8f6'; g.fillRect(xa, y, xb - xa, 1);
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
  /** Pilar de bloques cristalinos de sal (bajo las plataformas de sal) */
  function saltPillar(pb, x, yTop, yb, w = 28, seed = 1) {
    const S = P32(SALT), r = RNG(seed);
    let y = yTop;
    while (y < yb) {
      const bh = 6 + r.int(0, 6), off = r.int(-2, 2);
      for (let yy = y; yy < Math.min(yb, y + bh); yy++) for (let i = 0; i < w; i++) {
        const xx = x + i + off, ly = yy - y, f = i / (w - 1);
        let k = ly === 0 ? 8 : ly === bh - 1 ? 2 : f < 0.15 ? 7 : f < 0.5 ? 6 : f < 0.85 ? 5 : 3;
        if (hash2(xx >> 1, yy >> 1, seed) < 0.05) k = 8;
        put(pb, xx, yy, S[k]);
      }
      y += bh;
    }
  }
  /** Chimenea de roca con vetas de sal y cara superior */
  function hoodoo(pb, x, yb, w, h, ramp, seed = 1) {
    const R = P32(ramp), n = R.length, S = P32(SALT);
    A.castShadow(pb, x, yb, w + 6, 12, -0.26);
    for (let yy = 0; yy < h; yy++) {
      const t = yy / h, hw = Math.round(w / 2 * (0.82 + 0.18 * Math.sin(t * 7 + seed) + (t > 0.85 ? 0.15 : 0)));
      const cx = x + w / 2 + Math.round(Math.sin(t * 3 + seed) * 2);
      for (let k = -hw; k <= hw; k++) {
        const f = (k + hw) / (2 * hw + 0.01);
        let kk = Math.round((f < 0.12 ? 0.55 : f < 0.3 ? 0.85 : f < 0.55 ? 0.66 : f < 0.8 ? 0.45 : 0.25) * (n - 1) + (PFK.cl(cx + k, yb - yy, 2, seed) - 0.5) * 1.4);
        let u = R[clamp(kk, 0, n - 1)];
        const vein = (yy + Math.round(Math.sin(k * 0.3 + seed) * 2)) % 13;
        if (vein === 0) u = S[f < 0.6 ? 8 : 6]; else if (vein === 1) u = R[clamp(kk - 2, 0, n - 1)];
        put(pb, Math.round(cx + k), yb - yy, u);
      }
    }
    // capitel con cara superior iluminada y matas
    const tw = w + 6, tx = x - 3, ty = yb - h;
    for (let r = 0; r < 5; r++) for (let k = 0; k < tw; k++) put(pb, tx + k + Math.round(r * 0.6), ty - r, R[r === 4 ? n - 1 : n - 2 - (k % 7 === 0 ? 1 : 0)]);
    PFFlora.tuft(pb, tx + 4, ty - 3, 7, 5, seed, PFFlora.DRY);
    return { top: ty - 5 };
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
  /** Laguna de contingencia revestida (lámina de HDPE con borde) en 3/4 */
  function pond(pb, x0, x1, yb) {
    const S = P32(SALT), d = 14;
    A.castShadow(pb, x0, yb, x1 - x0, 6, -0.2);
    for (let r = 0; r <= d; r++) { const yy = yb - r, off = Math.round(r * 0.7); for (let x = x0 + off; x < x1 + off; x++) { let u; if (r === 0 || r === d) u = U('#1c1c24'); else if (r === 1 || r === d - 1) u = U('#3a3a44'); else u = U(r < 4 ? '#2a2440' : '#3a2a60'); put(pb, x, yy, u); } }
    for (let x = x0; x < x1; x++) { put(pb, x, yb + 1, S[6]); if (hash2(x, 5, 3) < 0.3) put(pb, x, yb + 2, S[8]); }
    for (let k = 0; k < 4; k++) { const px = x0 + 10 + k * Math.round((x1 - x0 - 20) / 3); vline(pb, px, yb - 26, yb, U('#c8d8e0')); put(pb, px, yb - 27, U('#ff6a5a')); }
    return { surf: [x0 + 2, yb - d + 2, x1 - x0 - 4, d - 3] };
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
    for (let yy = ceil + 8; yy < yF; yy++) for (let xx = x0; xx < x1; xx++) {
      const ly = yy - ceil - 8, lx = (xx - x0 + 2000) % 40;
      if (ly >= 8 && ly < 40 && lx > 3 && lx < 37 && xx > x0 + 4 && xx < x1 - 4) { K.blend(pb, xx, yy, U(ly < 14 ? '#ffd0e0' : '#9ab8f0'), 0.24); continue; }
      put(pb, xx, yy, Wh[ly > 80 ? 4 : 6 - ((xx - x0) % 40 === 0 ? 2 : 0)]);
    }
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

  return { build, renderBack, renderFront, outfall, saltPile, saltPillar, hoodoo, weir, pond, mangrove, salicornia, reeds, boardwalk, station, emissary, drawBuoy, SALT, BRW, WET, MANG };
})();
