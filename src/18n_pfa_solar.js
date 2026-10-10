/* =====================================================================
   18n_pfa_solar.js — Campo solar y desierto del plano jugable (kit PF,
   rollout A) a escala de personaje ≈ 74 px: mesas FV fijas y seguidores
   en 3/4 (cara de vidrio con reflejo del cielo, marcos de aluminio,
   hincas, suciedad y costras), inversores, taller en corte, kiosco de
   despacho, transformador de subestación, estación meteorológica con
   piranómetro, cercas de arena, cactus, matas secas y piedras.
   Suelo: registra la superficie 'track' (pista de mantenimiento de
   gravilla compactada con rodadas) y la cara 'sandcut' (ladera de duna
   con zanja de cables CC en corte e hincas a la vista).
   API (PFASolar):
     pvTable(pb,x,yb,w,{low,ph,sk,soil,crust,seed,piles}) → {quad:[[x,y]×4], glint:[x,y,w]}
     tracker(pb,x,yb,w,{ang,h,seed}) → {hub:[x,y]}
     inverter(pb,x,yb,{w,h,hot,label}) → {screen:[x,y,w,h], led:[x,y], vent:[x,y]}
     workshop(pb,x0,x1,yF,{roof,doorX}) → {roofY, lamps:[[x,y]]}
     kiosk(pb,x,yb,w,h) → {screen:[x,y,w,h]}
     transformerBig(pb,x,yb) → {glows:[[x,y]]}
     meteo(pb,x,yb) → {cups:[x,y], screen:[x,y,w,h]}
     sandFence(pb,x0,x1,gy,{seed,bury}) · cactus(pb,x,yb,h,seed) · opuntia(pb,x,yb,s,seed)
     dryBush(pb,x,yb,w,h,seed) · stones(pb,x,yb,w,seed) · fence(pb,x0,x1,gy) (malla perimetral)
     robot(pb,x,yb) (robot de limpieza aparcado) · waterTank(pb,x,yb)
   Oclusores frontales registrados en PFStage.FG: 'aDesert' (matas secas, chumberas y agaves oscuros).
   Sin tramado.
   ===================================================================== */
const PFASolar = (() => {
  const K = PFK, put = K.put, get = K.get, P32 = K.P32, A = PFArch, I = PFInfra, PL = PFAPlant;
  const CELL = ['#070e26', '#0c1838', '#13244e', '#1b3366', '#25447e', '#335a98', '#4a76b4', '#6e98d0', '#a2c2ec'];
  const ALU = ['#2e323c', '#4c5260', '#6c7280', '#8e94a2', '#b2b6c0', '#d2d6dc', '#eceef2', '#ffffff'];
  const SAND = PFTerrain.SANDF;
  const STUC = ['#3e2416', '#5e3a26', '#80543a', '#a0704e', '#bc8c64', '#d4a87e', '#e6c49c', '#f4dcbc', '#fcefd8'];
  const ROOFT = ['#2a1810', '#4a2a1a', '#6e3e24', '#924e2c', '#b4643a', '#d08050', '#e8a070'];
  const CACT = ['#0c2416', '#163a22', '#22522e', '#2e6a3a', '#3e844a', '#58a05e', '#80bc78', '#b0d89c'];
  const DRYB = ['#2a1a0a', '#4a3012', '#6a4a1c', '#8c6628', '#b08638', '#d0a64e', '#ead070'];
  const WOODF = ['#2a1608', '#4a2a12', '#6e421e', '#94602e', '#b88044', '#d4a060', '#ecc488'];
  const rect = PL.rect, hline = PL.hline, vline = PL.vline;

  /* ---------- mesa FV fija en 3/4 (cara de vidrio hacia la cámara) ---------- */
  function pvTable(pb, x, yb, w, o = {}) {
    const low = o.low ?? 14, ph = o.ph ?? 40, sk = o.sk ?? 12, y0 = yb - low, r = RNG(o.seed || 1);
    const C = P32(CELL), Al = P32(ALU), S = P32(SAND), F = P32(PL.FRAME);
    // sombra del panel sobre la arena (sol alto): banda bajo la mesa y algo detrás
    A.castShadow(pb, x + 2, yb, w + sk - 2, 9, -0.3, 0.9);
    // hincas traseras (más altas) y delanteras, con montículo de arena
    const piles = o.piles ?? Math.max(2, Math.round(w / 30) + 1);
    for (let i = 0; i < piles; i++) {
      const px = Math.round(x + 4 + i * (w - 8) / (piles - 1));
      for (let y = y0 - ph + 6; y < yb - 6; y++) { put(pb, px + sk - 2, y, F[4]); put(pb, px + sk - 1, y, F[2]); }   // trasera
      for (let y = y0; y < yb; y++) { put(pb, px, y, F[5]); put(pb, px + 1, y, F[3]); put(pb, px + 2, y, F[1]); }  // delantera
      for (let k = -3; k <= 4; k++) put(pb, px + k, yb - (Math.abs(k) < 2 ? 1 : 0), S[6 + (k < 0 ? 1 : 0)]);
      // tornapunta diagonal
      K.lineFn(pb, px + 2, y0 + 2, px + sk - 2, y0 - ph + 10, () => F[3]);
    }
    // correas bajo el panel (visibles en el hueco)
    for (let xx = x + 2; xx < x + w + sk - 2; xx++) put(pb, xx, y0 - Math.round(ph * 0.45) + 2, F[1]);
    // cara de vidrio: paralelogramo; módulos de 2 filas (apaisados), celdas, reflejo del cielo y destello
    const cols = Math.max(2, Math.round(w / 15)), mw = w / cols;
    for (let yy = y0 - ph; yy <= y0; yy++) {
      const v = (y0 - yy) / ph, off = Math.round(v * sk);
      for (let xx = x + off; xx < x + w + off; xx++) {
        const u = (xx - x - off) / w, mx = (xx - x - off) % mw, row = v < 0.5 ? 0 : 1, rv = (v * 2) % 1;
        // marco de aluminio entre módulos y en los bordes
        if (yy === y0 || yy === y0 - 1) { put(pb, xx, yy, Al[yy === y0 ? 3 : 6]); continue; }
        if (yy === y0 - ph) { put(pb, xx, yy, Al[7]); continue; }
        if (mx < 1 || Math.abs(v - 0.5) < 0.5 / ph) { put(pb, xx, yy, Al[5]); continue; }
        // celdas: rejilla fina (bus bars) y reflejo vertical del cielo
        let k = 3 + Math.round((1 - v) * 1.2) + (v > 0.82 ? 2 : 0);
        const cellX = Math.floor(mx / 3.2), cellY = Math.floor(rv * 4);
        if ((Math.floor(mx) % 4) === 0 || Math.abs(rv * 4 - Math.round(rv * 4)) < 0.12) k -= 2;
        // destello diagonal del sol
        const gd = (u * 1.2 + v * 0.9 + (o.seed || 1) * 0.13) % 1.4;
        if (gd > 0.62 && gd < 0.68) k += 3; else if (gd > 0.58 && gd < 0.72) k += 1;
        let c = C[clamp(k, 0, 8)];
        // suciedad: polvo de arena en clusters, más en el borde inferior
        const soil = o.soil || 0;
        if (soil > 0) { const d = PFK.cl(xx, yy, 3, 41 + (o.seed || 0)) * (1.2 - v * 0.8); if (d < soil * 1.6) c = K.mixU(c, U('#c89a5c'), clamp(soil * 1.6 - d + 0.25, 0, 0.72)); }
        // costra (excrementos/sal): manchas blancas
        if (o.crust && hash2(xx >> 1, yy >> 1, 71 + cellX + cellY) < o.crust * 0.09) c = U('#f4f0e6');
        put(pb, xx, yy, c);
      }
    }
    // canto lateral derecho del marco (grosor) y sombra de contacto inferior
    for (let yy = y0 - ph; yy <= y0; yy++) { const v = (y0 - yy) / ph; put(pb, x + w + Math.round(v * sk), yy, Al[1]); put(pb, x + w + 1 + Math.round(v * sk), yy, Al[0]); }
    // caja de conexiones y cable bajo el panel
    rect(pb, x + Math.round(w * 0.45), y0 + 2, 5, 3, U('#1c1c24'));
    for (let yy = y0 + 5; yy < yb - 1; yy++) put(pb, x + Math.round(w * 0.45) + 2, yy, U(yy % 4 ? '#141418' : '#a8202a'));
    return { quad: [[x, y0], [x + w, y0], [x + w + sk, y0 - ph], [x + sk, y0 - ph]], glint: [x, y0 - ph, w] };
  }

  /* ---------- seguidor de un eje: tubo de torsión, motor y franja de módulos inclinada ---------- */
  function tracker(pb, x, yb, w, o = {}) {
    const h = o.h ?? 32, ang = o.ang ?? 0.25, d = 16, F = P32(PL.FRAME), Al = P32(ALU), C = P32(CELL);
    const ty = yb - h;
    A.castShadow(pb, x + 4, yb, w, 10, -0.28);
    for (let px = x + 6; px < x + w; px += 26) { for (let y = ty; y < yb; y++) { put(pb, px, y, F[5]); put(pb, px + 1, y, F[3]); put(pb, px + 2, y, F[1]); } put(pb, px - 1, yb, U('#c58440')); put(pb, px + 3, yb, U('#c58440')); }
    // motor de giro en el centro
    const mx = x + Math.round(w / 2);
    I.box3q(pb, mx - 6, ty + 10, 12, 9, 4, { ramp: ['#141a28', '#22304a', '#34507a', '#4a6ea0', '#7a9cc8'] });
    // franja de módulos: la inclinación ang desplaza el borde superior (vista en 3/4)
    const lift = Math.round(d * (0.55 + ang * 0.5)), drop = Math.round(d * (0.45 - ang * 0.5));
    for (let r = -drop; r <= lift; r++) {
      const v = (r + drop) / (lift + drop), off = Math.round(v * 9), yy = ty - r;
      for (let xx = x + off; xx < x + w + off; xx++) {
        const lx = (xx - x - off) % 15;
        let k = r === lift ? 8 : r === -drop ? 2 : lx < 1 ? 6 : 3 + Math.round(v * 2);
        const gd = ((xx - x) / w * 1.3 + v * 0.8 + (o.seed || 1) * 0.21) % 1.5;
        if (gd > 0.7 && gd < 0.76) k += 3;
        put(pb, xx, yy, r === lift ? Al[6] : r === -drop ? Al[2] : C[clamp(k, 0, 8)]);
      }
    }
    // tubo de torsión asomando por los extremos
    for (let k = 0; k < 3; k++) { put(pb, x - 2 + k, ty, Al[4]); put(pb, x - 2 + k, ty + 1, Al[1]); }
    return { hub: [mx, ty + 4] };
  }

  /* ---------- inversor de string / central ---------- */
  function inverter(pb, x, yb, o = {}) {
    const w = o.w ?? 26, h = o.h ?? 40, d = 7, hot = !!o.hot;
    A.castShadow(pb, x + 3, yb, w, 9, -0.24);
    const W_ = ['#5a5466', '#7e7686', '#a39aa4', '#c4bcc0', '#ddd6d4', '#efe9e2', '#faf6ee', '#ffffff'], Wd = P32(W_);
    I.box3q(pb, x, yb, w, h, d, { ramp: W_, skew: 0.6, front: (xx, yy, u, v) => { const lx = xx - x, ly = yy - (yb - h); if (ly < 2) return Wd[7]; if (lx < 1 || lx > w - 2) return Wd[3]; if (ly > h - 4) return Wd[2]; return Wd[5 - (PFK.cl(xx, yy, 3, 9) < 0.08 ? 1 : 0)]; }, side: (xx, yy) => Wd[(yy % 2) ? 1 : 3] });
    // aletas del disipador en el lateral (relieve) y franja de marca
    for (let yy = yb - h + 3; yy < yb - 2; yy += 2) { put(pb, x + w + 1, yy - 1, Wd[4]); put(pb, x + w + 3, yy - 2, Wd[4]); }
    rect(pb, x + 2, yb - h + 3, w - 4, 3, U(hot ? '#e2581a' : '#2c6cc6'));
    // pantalla y LED
    rect(pb, x + 4, yb - h + 9, 12, 7, U('#06122a')); hline(pb, x + 4, x + 15, yb - h + 9, U('#3a4a6a'));
    // seccionador CC (mando rotativo rojo/amarillo)
    K.ellipseFn(pb, x + w - 6, yb - 12, 3.5, 3.5, (nx, ny, dd) => dd > 0.5 ? U('#f0bc2c') : (Math.abs(nx) < 0.3 ? U('#e2404a') : U('#bc2430')));
    // rejillas de ventilación y prensaestopas con cables CC
    for (let k = 0; k < 4; k++) hline(pb, x + 4, x + 14, yb - 14 + k * 2, Wd[2]);
    for (const [cx, col] of [[x + 6, '#a8202a'], [x + 9, '#141418'], [x + 12, '#a8202a'], [x + 15, '#141418']]) for (let yy = yb; yy < yb + 4; yy++) put(pb, cx, yy - 1, U(col));
    if (o.label) K.text(pb, o.label, x + 4, yb - h + 18, U('#2c3444'), { font: 'tiny' });
    PL.sign(pb, x + 3, yb - 24, 'bolt');
    return { screen: [x + 5, yb - h + 10, 10, 5], led: [x + 18, yb - h + 11], vent: [x + w + 2, yb - h] };
  }

  /* ---------- taller de mantenimiento en corte (muros de estuco, cubierta con FV) ---------- */
  function workshop(pb, x0, x1, yF, o = {}) {
    const roof = o.roof ?? yF - 118, Wl = P32(STUC), R = P32(ROOFT), w = x1 - x0, lamps = [];
    // muro del fondo: estuco cálido con zócalo, ventanas altas (vidrio translúcido) y estantes
    for (let yy = roof + 8; yy < yF; yy++) for (let xx = x0; xx < x1; xx++) {
      const ly = yy - roof - 8, lx = (xx - x0 + 2000) % 64;
      const inWin = ly >= 10 && ly < 34 && lx > 10 && lx < 54;
      if (inWin) { const k = (ly - 10) / 24; K.blend(pb, xx, yy, U(k < 0.2 ? '#fff4d8' : '#a8d4f0'), 0.26 + ((lx - 10) < 10 && ly - 10 < 12 - (lx - 10) ? 0.2 : 0)); continue; }
      let k = 5 + Math.round((PFK.cl(xx, yy, 3, 51) - 0.5) * 1.4) - (ly > yF - roof - 30 ? 1 : 0);
      if ((ly === 9 || ly === 34) && lx > 9 && lx < 55) k = ly === 9 ? 2 : 7;
      if ((lx === 10 || lx === 54) && ly >= 10 && ly < 34) k = 3;
      if (ly > yF - roof - 24) k = (ly === yF - roof - 24) ? 7 : 3 + ((xx >> 3) & 1 ? 0 : -1);
      put(pb, xx, yy, Wl[clamp(k, 0, 8)]);
    }
    // cubierta: losa con canto, cara superior en 3/4 con módulos FV, luminarias colgantes
    for (let xx = x0 - 6; xx < x1 + 6; xx++) for (let k = 0; k < 9; k++) put(pb, xx, roof + k, k === 0 ? R[6] : k < 3 ? R[4] : k === 8 ? R[0] : R[2]);
    for (let r = 0; r < 8; r++) { const off = Math.round(r * 0.8); for (let xx = x0 - 6 + off; xx < x1 + 6 + off; xx++) put(pb, xx, roof - 1 - r, r === 0 ? R[6] : R[5 - (r > 5 ? 1 : 0)]); }
    for (let xx = x0 + 6; xx < x1 - 40; xx += 66) pvTable(pb, xx, roof - 4, 56, { low: 3, ph: 16, sk: 6, piles: 2, seed: xx });
    for (let lx = x0 + 30; lx < x1 - 10; lx += 70) { vline(pb, lx, roof + 9, roof + 18, U('#2a282e')); rect(pb, lx - 6, roof + 18, 13, 3, U('#4f4d51')); hline(pb, lx - 5, lx + 5, roof + 21, U('#fff6d8')); lamps.push([lx, roof + 23]); }
    // pilastras extremas en corte
    for (const px of [x0 - 6, x1]) for (let yy = roof; yy < yF; yy++) for (let k = 0; k < 6; k++) put(pb, px + k, yy, Wl[[2, 7, 6, 5, 4, 1][k]]);
    // puerta lateral (vano ≥ 90 px) en el muro derecho
    if (o.doorX) { const dx = o.doorX; for (let yy = yF - 94; yy < yF; yy++) for (let xx = dx; xx < dx + 34; xx++) put(pb, xx, yy, (yy === yF - 94 || xx === dx || xx === dx + 33) ? Wl[1] : K.mixU(U('#3a2418'), U('#7a4a30'), ((xx - dx) % 6 === 0 ? 0.2 : 0.45))); hline(pb, dx + 26, dx + 29, yF - 48, U('#f0bc2c')); }
    return { roofY: roof, lamps };
  }

  /* ---------- kiosco de despacho solar ---------- */
  function kiosk(pb, x, yb, w = 92, h = 96) {
    const Wl = P32(A.WHITE), F = P32(PL.FRAME);
    A.castShadow(pb, x + 6, yb, w, 16, -0.26);
    I.box3q(pb, x - 4, yb, w + 8, 5, 12, { ramp: PFTerrain.CONC, skew: 0.6 });
    I.box3q(pb, x, yb - 5, w, h - 5, 12, { ramp: A.WHITE, skew: 0.6, front: (xx, yy, u, v) => { const lx = xx - x, ly = yy - (yb - h); if (ly < 3) return Wl[7]; if (ly > h - 12) return Wl[3 + ((xx >> 2) & 1)]; if (lx < 2 || lx > w - 3) return Wl[4]; return Wl[6 - (PFK.cl(xx, yy, 3, 61) < 0.07 ? 1 : 0)]; } });
    // franja violeta de marca, pantalla grande y puerta de vidrio
    rect(pb, x, yb - h + 3, w, 4, U('#8d6bff')); hline(pb, x, x + w - 1, yb - h + 3, U('#c4b0ff'));
    const sx = x + 8, sy = yb - h + 14, sw = w - 34, sh = 34;
    rect(pb, sx - 2, sy - 2, sw + 4, sh + 4, F[1]); rect(pb, sx, sy, sw, sh, U('#060c22')); hline(pb, sx - 2, sx + sw + 1, sy - 2, F[6]);
    const dx = x + w - 22;
    for (let yy = yb - 5 - 86; yy < yb - 5; yy++) for (let xx = dx; xx < dx + 18; xx++) put(pb, xx, yy, (xx === dx || xx === dx + 17 || yy === yb - 91) ? F[3] : K.mixU(U('#1c3a5a'), U('#6aa0c8'), (xx - dx) / 18 * 0.4 + ((yy - (yb - 91)) < 20 - (xx - dx) ? 0.3 : 0)));
    // toldo de lamas, módulos FV en cubierta y equipo de clima
    for (let xx = x - 6; xx < x + w - 24; xx++) for (let k = 0; k < 5; k++) put(pb, xx + Math.round(k * 0.6), yb - h - 1 + k, ((xx >> 2) & 1) ? U('#c8562a') : U('#f0e0c8'));
    pvTable(pb, x + 6, yb - h - 12, 44, { low: 2, ph: 12, sk: 6, piles: 2, seed: 7 });
    I.box3q(pb, x + w - 26, yb - h - 12, 18, 10, 6, { ramp: PFInfra.STEEL, skew: 0.6 });
    return { screen: [sx, sy, sw, sh] };
  }

  /* ---------- transformador de subestación con radiadores, pasatapas y valla ---------- */
  function transformerBig(pb, x, yb) {
    const T = ['#14202a', '#24384a', '#3a566e', '#567a94', '#7aa0b8', '#a8c4d4', '#d0e2ec'], Tp = P32(T), glows = [];
    A.castShadow(pb, x + 4, yb, 54, 14, -0.26);
    I.box3q(pb, x - 4, yb, 62, 6, 14, { ramp: PFTerrain.CONC, skew: 0.6 });
    I.box3q(pb, x + 8, yb - 6, 34, 36, 10, { ramp: T, skew: 0.6, front: (xx, yy, u, v) => Tp[(xx - x - 8) % 4 === 0 ? 1 : 3 - Math.round(v)] });
    // radiadores laterales
    for (let k = 0; k < 4; k++) for (let yy = yb - 38; yy < yb - 8; yy++) { put(pb, x + 1 + k * 2, yy, Tp[k % 2 ? 2 : 4]); put(pb, x + 44 + k * 2, yy, Tp[k % 2 ? 2 : 4]); }
    // pasatapas de alta (aisladores marrones) y conservador
    for (const bx of [x + 14, x + 24, x + 34]) { for (let k = 0; k < 12; k++) { put(pb, bx, yb - 46 - 6 - k, U(k % 2 ? '#c8562a' : '#e8805a')); put(pb, bx + 1, yb - 46 - 6 - k, U('#8a3a1a')); } glows.push([bx, yb - 64]); }
    PFInfra.cylH(pb, x + 10, x + 40, yb - 50, 3, { ramp: PFInfra.STEEL });
    // valla de seguridad con cartel
    for (let xx = x - 8; xx < x + 64; xx++) { put(pb, xx, yb - 30, U('#8e94a2')); if ((xx - x) % 3 === 0) for (let yy = yb - 30; yy < yb; yy++) if ((yy + xx) % 3 === 0) put(pb, xx, yy, U('#6c7280')); }
    for (let xx = x - 8; xx < x + 64; xx += 12) { vline(pb, xx, yb - 32, yb, U('#b2b6c0')); vline(pb, xx + 1, yb - 32, yb, U('#4c5260')); }
    rect(pb, x + 20, yb - 22, 14, 9, U('#fcd856')); PL.sign(pb, x + 23, yb - 22, 'bolt');
    return { glows };
  }

  /* ---------- estación meteorológica: piranómetro, anemómetro de cazoletas y garita ---------- */
  function meteo(pb, x, yb) {
    const St = P32(PFInfra.STEEL);
    A.castShadow(pb, x - 2, yb, 12, 6, -0.2);
    for (let y = yb - 92; y < yb; y++) { put(pb, x, y, St[6]); put(pb, x + 1, y, St[3]); put(pb, x + 2, y, St[1]); }
    // brazo con piranómetro (cúpula de vidrio sobre disco blanco)
    hline(pb, x - 14, x + 2, yb - 70, St[5]); hline(pb, x - 14, x + 2, yb - 69, St[2]);
    rect(pb, x - 18, yb - 73, 9, 2, U('#f4f6f8')); K.ellipseFn(pb, x - 13.5, yb - 74, 2.6, 2.2, (nx, ny) => ny > 0.3 ? 0 : U(nx + ny < -0.4 ? '#ffffff' : '#bfe6f6'));
    // anemómetro (eje + cazoletas; se animan por cuadro) y veleta
    vline(pb, x + 1, yb - 104, yb - 92, St[4]);
    hline(pb, x + 1, x + 14, yb - 84, St[5]); PFK.polyFill(pb, [[x + 12, yb - 88], [x + 17, yb - 84], [x + 12, yb - 80]], St[6]);
    // garita de temperatura (persianas blancas) y registrador con panel FV
    I.box3q(pb, x + 4, yb - 40, 12, 14, 4, { ramp: A.WHITE, front: (xx, yy) => P32(A.WHITE)[yy % 2 ? 4 : 6] });
    I.box3q(pb, x - 12, yb - 22, 12, 14, 4, { ramp: PFInfra.STEEL }); rect(pb, x - 10, yb - 33, 8, 4, U('#06122a'));
    pvTable(pb, x - 16, yb - 46, 14, { low: 2, ph: 7, sk: 3, piles: 2, seed: 3 });
    return { cups: [x + 1, yb - 105], screen: [x - 10, yb - 33, 8, 4] };
  }

  /* ---------- cerca de arena (listones de madera, medio enterrada) ---------- */
  function sandFence(pb, x0, x1, gy, o = {}) {
    const Wd = P32(WOODF), S = P32(SAND), r = RNG(o.seed || 5), bury = o.bury ?? 0.3;
    for (let x = x0; x < x1; x += 3) {
      const y = Math.round(gy(x)), h = 16 + r.int(-2, 3), lean = (r() - 0.5) * 2;
      const by = Math.round(h * bury * (0.5 + PFK.vn(x * 0.05, 0, o.seed || 5)));
      for (let k = 0; k < h - by; k++) { const xx = x + Math.round(lean * k / h); put(pb, xx, y - by - k, Wd[k > h - by - 3 ? 5 : (x % 6 ? 3 : 4)]); put(pb, xx + 1, y - by - k, Wd[1]); }
      for (let k = -2; k <= 3; k++) put(pb, x + k, y - by + (Math.abs(k) > 1 ? 1 : 0), S[7 + (k < 0 ? 1 : 0)]);
    }
    // alambres
    for (let x = x0; x < x1; x++) { const y = Math.round(gy(x)); put(pb, x, y - 11, Wd[0]); put(pb, x, y - 5, Wd[0]); }
    for (let x = x0 + 4; x < x1; x += 34) { const y = Math.round(gy(x)); for (let k = 0; k < 22; k++) { put(pb, x, y - k, Wd[4]); put(pb, x + 1, y - k, Wd[2]); put(pb, x + 2, y - k, Wd[1]); } }
  }

  /* ---------- flora del desierto ---------- */
  function cactus(pb, x, yb, h = 34, seed = 1) {
    const C = P32(CACT), r = RNG(seed);
    const col = (cx, y0, y1, rr) => { for (let y = y0; y < y1; y++) for (let i = -rr; i <= rr; i++) { const f = (i + rr) / (2 * rr); let k = f < 0.2 ? 6 : f < 0.4 ? 5 : f < 0.65 ? 4 : f < 0.85 ? 2 : 1; if ((i + rr) % 2 === 1 && y % 3 === 0) k += 1; put(pb, cx + i, y, C[clamp(k, 0, 7)]); } K.ellipseFn(pb, cx, y0, rr + 0.4, rr * 0.7, (nx, ny) => C[clamp(Math.round(5 - nx * 1.5 - ny), 1, 7)]); };
    A.castShadow(pb, x - 3, yb, 8, 6, -0.25);
    col(x, yb - h, yb, 3);
    const arms = r.int(1, 2);
    for (let a = 0; a < arms; a++) {
      const side = a === 0 ? -1 : 1, ay = yb - Math.round(h * (0.35 + r() * 0.25)), ah = Math.round(h * (0.3 + r() * 0.2)), ax = x + side * 7;
      for (let k = 0; k < 6; k++) { put(pb, x + side * (3 + k), ay, C[3]); put(pb, x + side * (3 + k), ay + 1, C[2]); put(pb, x + side * (3 + k), ay - 1, C[5]); }
      col(ax, ay - ah, ay + 1, 2);
    }
    for (let k = 0; k < 4; k++) put(pb, x - 1 + k, yb - h - 2, U(['#f478b8', '#ffe14d', '#f478b8', '#fff2c0'][k]));
  }
  function opuntia(pb, x, yb, s = 1, seed = 1) {
    const C = P32(CACT), r = RNG(seed);
    const pad = (cx, cy, rx, ry) => { K.ellipseFn(pb, cx, cy, rx, ry, (nx, ny, d) => C[clamp(Math.round(4.6 - nx * 1.8 - ny * 1.2 - (d > 0.8 ? 1.5 : 0)), 0, 7)]); for (let k = 0; k < 4; k++) put(pb, Math.round(cx + (r() - 0.5) * rx * 1.4), Math.round(cy + (r() - 0.5) * ry * 1.4), U('#e8e0b0')); };
    pad(x, yb - 7 * s, 6 * s, 7 * s); pad(x - 7 * s, yb - 15 * s, 5 * s, 6 * s); pad(x + 6 * s, yb - 17 * s, 5 * s, 6 * s); pad(x + 1, yb - 24 * s, 4 * s, 5 * s);
    for (const [fx, fy] of [[x - 7 * s, yb - 21 * s], [x + 7 * s, yb - 23 * s], [x + 1, yb - 29 * s]]) { put(pb, Math.round(fx), Math.round(fy), U('#e2404a')); put(pb, Math.round(fx) + 1, Math.round(fy), U('#c02a8a')); }
  }
  function dryBush(pb, x, yb, w = 20, h = 12, seed = 1) {
    const D = P32(DRYB), r = RNG(seed);
    for (let i = 0; i < Math.round(w * 1.2); i++) {
      const a = -Math.PI / 2 + (r() - 0.5) * 2.4, L = h * (0.5 + r() * 0.6), bx = x + (r() - 0.5) * w * 0.4;
      K.lineFn(pb, bx, yb, bx + Math.cos(a) * L * (w / h) * 0.5, yb + Math.sin(a) * L, (t) => D[clamp(Math.round(1 + t * 4 + (r() < 0.2 ? 1 : 0)), 0, 6)]);
    }
    for (let k = -Math.round(w / 2); k <= Math.round(w / 2); k++) if (hash2(x + k, yb, seed) < 0.4) put(pb, x + k, yb, D[1]);
  }
  function stones(pb, x, yb, w = 16, seed = 1) {
    const r = RNG(seed), RW = P32(RAMP.rockWarmR);
    for (let i = 0; i < Math.max(2, Math.round(w / 6)); i++) {
      const cx = x + r() * w, rx = 2 + r() * 3, ry = 1.5 + r() * 2;
      K.ellipseFn(pb, cx, yb - ry + 1, rx, ry, (nx, ny) => ny > 0.6 ? 0 : RW[clamp(Math.round(5 - nx * 2 - ny * 2.2), 1, 8)]);
      for (let k = -Math.round(rx); k <= Math.round(rx); k++) { const c = get(pb, Math.round(cx) + k + 1, yb + 1); if (c >>> 24) put(pb, Math.round(cx) + k + 1, yb + 1, K.shU(c, -0.25, 20)); }
    }
  }
  /** Malla perimetral del campo con postes y alambre de espino */
  function fence(pb, x0, x1, gy) {
    const St = P32(PFInfra.STEEL);
    for (let x = x0; x < x1; x++) { const y = Math.round(gy(x)); put(pb, x, y - 34, St[5]); put(pb, x, y - 33, St[2]); for (let yy = y - 33; yy < y - 1; yy++) if ((x + yy) % 4 === 0 || (x - yy + 400) % 4 === 0) put(pb, x, yy, St[3]); if (x % 5 === 0) put(pb, x, y - 37, St[4]); }
    for (let x = x0; x < x1; x += 30) { const y = Math.round(gy(x)); for (let yy = y - 38; yy < y; yy++) { put(pb, x, yy, St[6]); put(pb, x + 1, yy, St[2]); } }
  }
  /** Robot de limpieza en seco aparcado (cepillo cilíndrico) */
  function robot(pb, x, yb) {
    const Y = P32(PL.YEL);
    I.box3q(pb, x, yb - 4, 30, 9, 8, { ramp: PL.YEL, skew: 0.7 });
    PFInfra.cylH(pb, x - 2, x + 32, yb - 15, 3, { ramp: ['#0a4e4a', '#127a70', '#1aa894', '#4ccdb8', '#9cecdc', '#d8fff4', '#ffffff'] });
    for (const wx of [x + 5, x + 24]) K.ellipseFn(pb, wx, yb - 3, 3.5, 3.5, (nx, ny, d) => d > 0.4 ? U('#1c1c24') : U('#6c7280'));
    rect(pb, x + 11, yb - 10, 8, 3, U('#06122a')); put(pb, x + 13, yb - 9, U('#3fe0a0'));
    void Y;
  }
  /** Depósito de agua de limpieza (1000 L) en jaula */
  function waterTank(pb, x, yb) {
    const H = P32(PL.HDPE), St = P32(PFInfra.STEEL);
    A.castShadow(pb, x, yb, 30, 8, -0.22);
    for (let yy = yb - 30; yy < yb - 2; yy++) for (let xx = x; xx < x + 26; xx++) put(pb, xx, yy, H[PL.ti((xx - x) / 25, H.length)]);
    for (let yy = yb - 30; yy < yb; yy += 6) hline(pb, x - 1, x + 26, yy, St[3]);
    for (let xx = x - 1; xx <= x + 26; xx += 6) vline(pb, xx, yb - 30, yb, St[3]);
    rect(pb, x + 4, yb - 18, 2, 14, U('#48d4f0'));
    rect(pb, x - 2, yb - 2, 30, 2, P32(A.WOOD)[3]);
  }

  /* ---------- oclusor frontal del desierto ---------- */
  function fgDesert(o) {
    const w = o.w || 150, h = o.h || 80, pb = new PixelBuffer(w, h), r = RNG(o.seed || 1);
    const DK = P32(['#06050a', '#0e0a12', '#18121c', '#241a26', '#33242e', '#46343a', '#5e4a46']);
    const GK = P32(['#03080a', '#071214', '#0c1c1e', '#122828', '#1a3634', '#244640', '#33584c']);
    // chumbera oscura
    const pad = (cx, cy, rx, ry) => K.ellipseFn(pb, cx, cy, rx, ry, (nx, ny, d) => GK[clamp(Math.round(3.4 - nx * 1.6 - ny * 1.4 - (d > 0.85 ? 1.6 : 0)), 0, 6)]);
    const px = Math.round(w * (o.side > 0 ? 0.7 : 0.3));
    pad(px, h - 12, 13, 14); pad(px - 14, h - 30, 10, 12); pad(px + 12, h - 34, 10, 12); pad(px - 2, h - 50, 8, 10);
    for (let k = 0; k < 18; k++) put(pb, px + r.int(-20, 20), h - r.int(8, 56), GK[6]);
    // matas secas alrededor
    for (let i = 0; i < Math.round(w / 3); i++) {
      const bx = r() * w, a = -Math.PI / 2 + (r() - 0.5) * 2.2, L = h * (0.25 + r() * 0.4);
      K.lineFn(pb, bx, h, bx + Math.cos(a) * L * 0.6, h + Math.sin(a) * L, (t) => DK[clamp(Math.round(1 + t * 4), 0, 6)]);
    }
    // borde de luz cálida del sol en las palas
    K.rim(pb, U('#c88a4a'), 0.35, -1, -1);
    for (let x = 0; x < w; x++) { const hh = 4 + Math.round(PFK.vn(x * 0.1, 0, o.seed || 1) * 6); for (let y = h - hh; y < h; y++) if (!(get(pb, x, y) >>> 24)) put(pb, x, y, DK[1]); }
    return pb;
  }
  if (typeof PFStage !== 'undefined' && PFStage.FG) PFStage.FG.aDesert = fgDesert;

  /* ---------- suelo: pista de gravilla compactada y ladera de duna con zanja de cables ---------- */
  const GRAV = ['#3a2410', '#5c3a1c', '#7e5430', '#9a6c42', '#b28458', '#c89c6e', '#dab486', '#e8c89e', '#f4dcb8'];
  function trackSurf(s, x, y, gy, D, back, t, dz) {
    const G_ = P32(GRAV), S = P32(SAND);
    if (dz === 1) return S[9];
    if (y - back < 1) return S[6];
    // rodadas paralelas (dos franjas compactadas más oscuras)
    const rut = Math.abs(t - 0.32) < 0.07 || Math.abs(t - 0.7) < 0.07;
    let k = 6 - Math.round(t * 1.5) + (rut ? -1 : 0) + Math.round((PFK.cl(x, y, 2, 141) - 0.5) * 2);
    if (rut && ((x + Math.round(t * 30)) % 5 === 0)) k -= 1;                                        // dibujo de neumático
    const hh = hash2(x, y, 142);
    if (hh < 0.05) return G_[clamp(k - 2, 1, 8)]; if (hh > 0.96) return G_[8];                      // gravilla
    // arena suelta acumulada en los bordes
    if (t > 0.86 || t < 0.08) return S[clamp(7 + Math.round((PFK.cl(x, y, 3, 143) - 0.5) * 2), 4, 9)];
    return G_[clamp(k, 2, 8)];
  }
  /** Ladera de duna esculpida (luz arriba-izquierda, sombras cálidas, violeta solo en las hondonadas)
      con la zanja de cables CC en corte (s.trench = [x0, x1]); el pie se oscurece hacia el primer plano */
  const VIOD = ['#2a1c46', '#3e2a5e', '#583e78', '#74568e'];
  function sandCut(s, x, y, gy, world) {
    const d = y - gy, S = P32(SAND), sd = 170 + ((s.seed | 0) % 40);
    if (d === 0) return S[9];
    if (d === 1) return S[8];
    // zanja de cables CC: relleno claro, cinta de aviso, tubo corrugado con ventanas que muestran los cables, cama de arena fina
    if (s.trench && x >= s.trench[0] && x < s.trench[1]) {
      const top = 26 + Math.round((PFK.vn(x * 0.05, 1, sd) - 0.5) * 3), bot = 58;
      if (d >= top && d < bot) {
        const q = d - top, wall = Math.min(x - s.trench[0], s.trench[1] - x);
        if (wall < 3 || q === 0) return S[3];
        if (q === bot - top - 1) return S[2];
        if (q === 9) return ((x >> 2) & 1) ? U('#f0bc2c') : U('#1c1c24');
        if (q >= 16 && q < 25) {
          const r = q - 16, win = (x % 120) > 70 && (x % 120) < 104;
          if (r === 0) return U('#5a2a10'); if (r === 8) return U('#2a1004');
          if (win && r > 1 && r < 7) { const c = (x >> 1) % 6; return U(r < 4 ? (c < 3 ? '#c8402a' : '#e86a4a') : (c < 3 ? '#1c1c24' : '#4a4a54')); }
          return U(((x + r) % 3 === 0) ? '#b4561a' : r < 3 ? '#f08a3a' : r < 6 ? '#d06a24' : '#9a4614');
        }
        return S[clamp(8 - Math.round(q / 14) + (PFK.cl(x, y, 2, sd + 9) < 0.18 ? -1 : 0), 4, 9)];
      }
    }
    const hgt = (xx, yy) => PFK.vn(xx * 0.012, yy * 0.024, sd) * 22 + PFK.vn(xx * 0.045, yy * 0.07, sd + 1) * 5;
    const hx = hgt(x + 1, y) - hgt(x - 1, y), hy = hgt(x, y + 1) - hgt(x, y - 1);
    let lam = 0.7 - hx * 0.16 - hy * 0.12 - d * 0.0036 - Math.max(0, d - 70) * 0.0042;
    const rip = (y * 0.85 + Math.sin(x * 0.035 + y * 0.02) * 5 + hgt(x, y) * 0.5) % 7;
    if (rip < 1) lam -= 0.11; else if (rip < 2) lam += 0.05;
    lam += (PFK.cl(x, y, 2, sd + 3) - 0.5) * 0.05;
    // piedras semienterradas
    const hh = hash2(x >> 2, y >> 2, sd + 4);
    if (hh < 0.01 && d > 12) { const u = PFTerrain.boulderPix(x, y, sd + 5, 7, 5, P32(RAMP.rockWarmR)); if (u !== -1) return u; }
    if (lam < 0.16) return P32(VIOD)[clamp(Math.round((lam + 0.3) * 7), 0, 3)];
    return S[clamp(Math.round(1 + lam * 9), 1, 9)];
  }
  /** Retoque de la ladera: matas secas, chumberas pequeñas y huellas de lagartija */
  function decorateDunes(pb, world, segs, seed = 1) {
    const r = RNG(seed);
    for (const s of segs) {
      if (s.face !== 'sandcut' && s.face !== 'dune') continue;
      // afloramientos rocosos grandes medio enterrados
      for (let x = s.x0 + r.int(40, 120); x < s.x1 - 40; x += r.int(160, 300)) {
        const gy = world.ground[Math.min(world.w, x)], y = gy + r.int(70, 118), w = r.int(30, 56), h = r.int(12, 22);
        for (let yy = y - h; yy < y + 4; yy++) for (let xx = x - w / 2; xx < x + w / 2; xx++) { const nx = (xx - x) / (w / 2), ny = (yy - y) / h; if (nx * nx + ny * ny > 1 + PFK.vn(xx * 0.2, yy * 0.2, 7) * 0.4) continue; const u = PFTerrain.boulderPix(Math.round(xx), yy, 900 + x, 9, 6, P32(RAMP.rockWarmR), { dark: (yy - y + h) / h }); if (u !== -1) put(pb, Math.round(xx), yy, K.shU(u, -0.12 - Math.max(0, yy - gy - 60) * 0.004, 18)); }
        dryBush(pb, x - w / 2 + 4, y - h + 6, 18, 12, x); PFFlora.tuft(pb, x + w / 2 - 6, y - 2, 9, 7, x + 3, PFFlora.DRY);
      }
      for (let x = s.x0 + r.int(6, 20); x < s.x1 - 10; x += r.int(16, 34)) {
        const gy = world.ground[Math.min(world.w, x)], inT = s.trench && x >= s.trench[0] && x < s.trench[1], y = gy + (inT ? r.int(64, 124) : r.int(12, 124));
        const k = r(), sc = 0.8 + (y - gy) / 120 * 0.7;
        if (k < 0.38) dryBush(pb, x, y, Math.round((14 + r.int(0, 14)) * sc), Math.round((8 + r.int(0, 8)) * sc), x);
        else if (k < 0.52) stones(pb, x, y, Math.round((10 + r.int(0, 12)) * sc), x);
        else if (k < 0.62) opuntia(pb, x, y, (0.6 + r() * 0.4) * sc, x);
        else if (k < 0.67) cactus(pb, x, y, Math.round((18 + r.int(0, 14)) * sc), x);
        else if (k < 0.74) { for (let i = 0; i < 9; i++) { put(pb, x + i * 3, y - (i % 2), U('#8e5a2a')); put(pb, x + i * 3 + 1, y - 2 + (i % 2), U('#8e5a2a')); } }
        else PFFlora.tuft(pb, x, y, Math.round(8 * sc), Math.round(6 * sc), x, PFFlora.DRY);
      }
    }
  }
  /** Tendido eléctrico al fondo: postes de madera con crucetas, aisladores y cables con catenaria */
  function powerLine(pb, xs, gyBack, h = 112) {
    const Wd = P32(WOODF), tops = [];
    for (const x of xs) {
      const yb = Math.round(gyBack(x)), yt = yb - h;
      for (let y = yt; y < yb; y++) { put(pb, x, y, Wd[4]); put(pb, x + 1, y, Wd[2]); put(pb, x + 2, y, Wd[1]); }
      for (let k = -12; k <= 14; k++) { put(pb, x + k, yt + 6, Wd[5]); put(pb, x + k, yt + 7, Wd[1]); }
      for (const ix of [x - 11, x + 1, x + 13]) { put(pb, ix, yt + 4, U('#e8f0f8')); put(pb, ix, yt + 5, U('#7ab8e8')); }
      tops.push([x, yt + 4]);
    }
    for (let i = 0; i < tops.length - 1; i++) for (const off of [-11, 1, 13]) {
      const [xa, ya] = tops[i], [xb, yb2] = tops[i + 1];
      for (let x = xa + off; x <= xb + off; x++) { const t = (x - xa - off) / (xb - xa); put(pb, x, Math.round(lerp(ya, yb2, t) + Math.sin(t * Math.PI) * 12), U('#2a2a30')); }
    }
  }
  /** Molino multipala de bombeo (aeromotor) sobre torre de celosía; el rotor se anima por cuadro */
  function windPump(pb, x, yb, h = 120) {
    const St = P32(PFInfra.STEEL), yt = yb - h;
    for (let y = yt; y < yb; y++) { const t = (y - yt) / h, sp = Math.round(3 + t * 14); put(pb, x - sp, y, St[5]); put(pb, x + sp, y, St[2]); if ((y - yt) % 14 === 0) for (let k = -sp; k <= sp; k++) put(pb, x + k, y, St[3]); if ((y - yt) % 14 < 14) { const k = Math.round(((y - yt) % 14) / 14 * 2 * sp) - sp; put(pb, x + k, y, St[4]); } }
    I.box3q(pb, x - 4, yt + 2, 9, 5, 3, { ramp: PFInfra.STEEL });
    PFK.polyFill(pb, [[x + 4, yt - 2], [x + 22, yt - 8], [x + 22, yt + 4], [x + 4, yt + 1]], St[6]);
    // depósito al pie
    PFInfra.cylV(pb, x + 26, yb - 1, 10, 18, { ramp: ['#3a2a1a', '#5a4430', '#7a5e44', '#9a7a5a', '#b89874', '#d4b690', '#ecd4b0', '#f8ead0'] });
    return { hub: [x - 1, yt] };
  }
  PFTerrain.register('track', { surf: trackSurf, depth: 16, flat: false });
  PFTerrain.register('sandcut', { face: sandCut, prep: PFTerrain.EXT.prep.dune });

  return { pvTable, tracker, inverter, workshop, kiosk, transformerBig, meteo, sandFence, cactus, opuntia, dryBush, stones, fence, robot, waterTank, decorateDunes, powerLine, windPump, CELL, ALU, STUC, CACT, DRYB, GRAV };
})();
