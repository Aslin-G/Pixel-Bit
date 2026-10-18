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
     outcrop(pb,cx,yb,w,h,seed) (arenisca en lomos con estratos) · desertCluster(pb,x,y,sc,seed) · tireTracks(pb,pts,seed)
     inverter(...,{style:'central'|'string'|'tall', tint:'white'|'grey'|'sand', brand, wear})  (r2-biomes-a)
   Cara 'sandcut' (r2-biomes-a): campo de crestas de duna en perspectiva común a todos los tramos; la zanja CC
   solo se ve en catas (s.trenchWin = [[x0,x1]…]).
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
        // r3-desert: reflejo del cielo en el vidrio (azul claro arriba, cian en la franja media) y de un cúmulo
        if (o.sky !== false) {
          const sv = clamp((v - 0.35) / 0.65, 0, 1), cloudR = Math.abs(u - (0.3 + hash1(o.seed || 1, 77) * 0.4)) < 0.16 && v > 0.55 && v < 0.85;
          if (sv > 0) c = K.mixU(c, U(sv > 0.7 ? '#8ccaf6' : '#4aa0ea'), 0.18 + sv * 0.3);
          else if (v > 0.16 && v < 0.32) c = K.mixU(c, U('#22c8e0'), 0.34);
          if (cloudR) c = K.mixU(c, U('#e8f4ff'), 0.32);
        }
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
  /** o.style: 'central' (dos puertas con rejillas de lamas y ventilador en el techo), 'string' (caja compacta con
      disipador de aletas), 'tall' (armario gris azulado con ventilador frontal y cuadro de CA); o.tint cambia el
      color del cuerpo; o.wear 0..1 (polvo en la base). Todas comparten la API anterior. */
  const INVB = {
    white: ['#5a5466', '#7e7686', '#a39aa4', '#c4bcc0', '#ddd6d4', '#efe9e2', '#faf6ee', '#ffffff'],
    grey: ['#262c3a', '#3a4458', '#55627a', '#73829a', '#94a2b8', '#b6c2d2', '#d4dce6', '#eef2f6'],
    sand: ['#4a3a2a', '#6e5a44', '#94806a', '#b4a288', '#d0c0a4', '#e4d8c0', '#f2ead8', '#fcf8ee'],
  };
  function inverter(pb, x, yb, o = {}) {
    const st = o.style || 'string', w = o.w ?? (st === 'central' ? 30 : st === 'tall' ? 24 : 26), h = o.h ?? (st === 'tall' ? 46 : 40), d = 7, hot = !!o.hot;
    A.castShadow(pb, x + 3, yb, w, 9, -0.24);
    const W_ = INVB[o.tint || (st === 'tall' ? 'grey' : 'white')], Wd = P32(W_), wear = o.wear ?? 0.4;
    I.box3q(pb, x, yb, w, h, d, { ramp: W_, skew: 0.6, front: (xx, yy, u, v) => {
      const lx = xx - x, ly = yy - (yb - h);
      if (ly < 2) return Wd[7]; if (lx < 1 || lx > w - 2) return Wd[3]; if (ly > h - 4) return Wd[2];
      if (st === 'central' && Math.abs(lx - w / 2) < 1) return Wd[2];                               // junta entre puertas
      let k = 5 - (PFK.cl(xx, yy, 3, 9) < 0.08 ? 1 : 0) - (lx > w - 6 ? 1 : 0);                      // sombra suave hacia el canto derecho
      if (ly > h - 10 && PFK.cl(xx, yy, 2, 19) < wear * (ly - h + 10) / 10) k -= 1;                   // polvo de arena en la base
      return Wd[k];
    }, side: (xx, yy) => Wd[(yy % 2) ? 1 : 3] });
    for (let yy = yb - h + 3; yy < yb - 2; yy += 2) { put(pb, x + w + 1, yy - 1, Wd[4]); put(pb, x + w + 3, yy - 2, Wd[4]); }   // aletas del lateral
    rect(pb, x + 2, yb - h + 3, w - 4, 3, U(hot ? '#e2581a' : (o.brand || '#2c6cc6')));
    if (st === 'central') {
      // dos puertas con rejillas de lamas, manetas y ventilador en el techo
      for (const dx0 of [3, Math.round(w / 2) + 2]) { for (let k = 0; k < 6; k++) hline(pb, x + dx0, x + dx0 + Math.round(w / 2) - 6, yb - 17 + k * 2, Wd[2]); for (let k = 0; k < 6; k++) hline(pb, x + dx0, x + dx0 + Math.round(w / 2) - 6, yb - 16 + k * 2, Wd[6]); }
      vline(pb, x + Math.round(w / 2) - 3, yb - 26, yb - 20, Wd[1]); vline(pb, x + Math.round(w / 2) + 2, yb - 26, yb - 20, Wd[1]);
      I.box3q(pb, x + 6, yb - h - 1, 12, 3, 4, { ramp: PFInfra.STEEL, skew: 0.6 });
      rect(pb, x + 4, yb - h + 9, 11, 7, U('#06122a')); hline(pb, x + 4, x + 14, yb - h + 9, U('#3a4a6a'));
    } else if (st === 'tall') {
      // ventilador frontal circular con rejilla, cuadro de CA con interruptores
      K.ellipseFn(pb, x + w / 2, yb - 10, 6, 6, (nx, ny, dd) => dd > 0.82 ? Wd[1] : ((Math.round((nx + 1) * 6) + Math.round((ny + 1) * 6)) % 3 === 0 ? Wd[0] : Wd[2]));
      put(pb, Math.round(x + w / 2), yb - 10, Wd[6]);
      rect(pb, x + 3, yb - h + 9, w - 6, 9, Wd[3]); for (let k = 0; k < 4; k++) { rect(pb, x + 5 + k * 4, yb - h + 11, 2, 5, Wd[7]); put(pb, x + 5 + k * 4, yb - h + 13, U(k === 2 ? '#e2404a' : '#2a2a30')); }
      rect(pb, x + 4, yb - h + 25, 9, 5, U('#06122a'));
    } else {
      rect(pb, x + 4, yb - h + 9, 12, 7, U('#06122a')); hline(pb, x + 4, x + 15, yb - h + 9, U('#3a4a6a'));
      for (let k = 0; k < 4; k++) hline(pb, x + 4, x + 14, yb - 14 + k * 2, Wd[2]);
    }
    // seccionador CC (mando rotativo rojo/amarillo)
    if (st !== 'tall') K.ellipseFn(pb, x + w - 6, yb - 12, 3.5, 3.5, (nx, ny, dd) => dd > 0.5 ? U('#f0bc2c') : (Math.abs(nx) < 0.3 ? U('#e2404a') : U('#bc2430')));
    // prensaestopas con cables CC por abajo
    for (const [cx, col] of [[x + 6, '#a8202a'], [x + 9, '#141418'], [x + 12, '#a8202a'], [x + 15, '#141418']]) for (let yy = yb; yy < yb + 4; yy++) put(pb, cx, yy - 1, U(col));
    if (o.label) K.text(pb, o.label, x + 4, yb - h + 18, U('#2c3444'), { font: 'tiny' });
    if (st === 'tall') PL.sign(pb, x + w - 11, yb - h + 24, 'bolt'); else PL.sign(pb, x + 3, yb - 24, 'bolt');
    const sy = st === 'tall' ? yb - h + 26 : yb - h + 10;
    return { screen: [x + 5, sy, st === 'tall' ? 7 : 10, st === 'tall' ? 3 : 5], led: [x + (st === 'central' ? 20 : 18), yb - h + 11], vent: [x + w + 2, yb - h] };
  }

  /* ---------- taller de mantenimiento en corte (muros de estuco, cubierta con FV) ---------- */
  function workshop(pb, x0, x1, yF, o = {}) {
    const roof = o.roof ?? yF - 118, Wl = P32(STUC), R = P32(ROOFT), w = x1 - x0, lamps = [];
    // muro del fondo: estuco cálido con zócalo, ventanas altas (vidrio translúcido), desconchones y manchas de humedad
    for (let yy = roof + 8; yy < yF; yy++) for (let xx = x0; xx < x1; xx++) {
      const ly = yy - roof - 8, lx = (xx - x0 + 2000) % 64;
      const inWin = ly >= 10 && ly < 34 && lx > 10 && lx < 54;
      if (inWin) { const k = (ly - 10) / 24; K.blend(pb, xx, yy, U(k < 0.2 ? '#fff4d8' : '#a8d4f0'), 0.26 + ((lx - 10) < 10 && ly - 10 < 12 - (lx - 10) ? 0.2 : 0)); if (lx === 32) put(pb, xx, yy, Wl[3]); continue; }
      let k = 5 + Math.round((PFK.cl(xx, yy, 3, 51) - 0.5) * 1.4) - (ly > yF - roof - 30 ? 1 : 0);
      const pat = PFK.vn(xx * 0.06, yy * 0.08, 53);                                                  // parches de estuco más claro/oscuro
      if (pat > 0.68) k += 1; else if (pat < 0.26) k -= 1;
      if ((ly === 9 || ly === 34) && lx > 9 && lx < 55) k = ly === 9 ? 2 : 7;
      if ((lx === 10 || lx === 54) && ly >= 10 && ly < 34) k = 3;
      if (ly > yF - roof - 24) k = (ly === yF - roof - 24) ? 7 : 3 + ((xx >> 3) & 1 ? 0 : -1);
      if (ly < 6) k -= ly < 3 ? 2 : 1;                                                               // sombra de la losa sobre el muro
      put(pb, xx, yy, Wl[clamp(k, 0, 8)]);
    }
    // desconchones con ladrillo a la vista
    const rr = RNG(57);
    for (let k = 0; k < Math.round(w / 70); k++) { const bx = x0 + rr.int(8, w - 30), by = roof + 8 + rr.int(38, 62), bw = rr.int(10, 18), bh = rr.int(5, 8); for (let yy = by; yy < by + bh; yy++) for (let xx = bx; xx < bx + bw; xx++) { const nx = (xx - bx) / bw - 0.5, ny = (yy - by) / bh - 0.5; if (nx * nx + ny * ny > 0.25 + hash2(xx, yy, 58) * 0.06) continue; const j = ((yy - by) % 3 === 0) || ((xx + ((yy - by) / 3 | 0) * 3) % 7 === 0); put(pb, xx, yy, j ? Wl[3] : U('#b4643a')); } }
    // cubierta: losa con canto, cara superior en 3/4 con módulos FV, luminarias colgantes
    for (let xx = x0 - 6; xx < x1 + 6; xx++) for (let k = 0; k < 9; k++) put(pb, xx, roof + k, k === 0 ? R[6] : k < 3 ? R[4] : k === 8 ? R[0] : R[2]);
    for (let xx = x0 - 6; xx < x1 + 6; xx += 7) { put(pb, xx, roof + 4, R[1]); put(pb, xx, roof + 5, R[1]); }        // juntas de la losa
    for (let r = 0; r < 8; r++) { const off = Math.round(r * 0.8); for (let xx = x0 - 6 + off; xx < x1 + 6 + off; xx++) put(pb, xx, roof - 1 - r, r === 0 ? R[6] : R[5 - (r > 5 ? 1 : 0)]); }
    for (let xx = x0 + 6; xx < x1 - 40; xx += 66) pvTable(pb, xx, roof - 4, 56, { low: 3, ph: 16, sk: 6, piles: 2, seed: xx });
    for (let lx = x0 + 30; lx < x1 - 10; lx += 70) {
      vline(pb, lx, roof + 9, roof + 18, U('#2a282e')); rect(pb, lx - 6, roof + 18, 13, 3, U('#4f4d51')); hline(pb, lx - 5, lx + 5, roof + 21, U('#fff6d8')); lamps.push([lx, roof + 23]);
      // cono de luz cálida horneado sobre el muro (más claro cerca de la luminaria)
      for (let yy = roof + 22; yy < yF - 2; yy++) { const t = (yy - roof - 22) / (yF - roof - 24), hwc = 5 + t * 20; for (let xx = Math.round(lx - hwc); xx <= Math.round(lx + hwc); xx++) { const c = get(pb, xx, yy); if (c >>> 24) put(pb, xx, yy, K.mixU(c, U('#fff0c8'), 0.16 * (1 - t) + 0.04)); } }
    }
    // bandeja portacables bajo las ventanas: cables CC (rojo/negro) y CA (gris) que bajan a los armarios
    const ty = yF - 58;
    for (let xx = x0 + 4; xx < x1 - 46; xx++) { put(pb, xx, ty, P32(PFInfra.STEEL)[5]); put(pb, xx, ty + 1, P32(PFInfra.STEEL)[3]); put(pb, xx, ty + 2, P32(PFInfra.STEEL)[1]); put(pb, xx, ty - 1, U((xx % 7) < 3 ? '#a8202a' : '#1c1c24')); if (xx % 5 === 0) put(pb, xx, ty - 2, U('#6a6e78')); if ((xx - x0) % 22 === 0) { put(pb, xx, ty + 3, P32(PFInfra.STEEL)[2]); put(pb, xx, ty + 4, P32(PFInfra.STEEL)[2]); } }
    // esquema unifilar y carteles de seguridad en el muro
    const px = x0 + 150, py = roof + 46;
    rect(pb, px, py, 30, 16, U('#f4f0e6')); hline(pb, px, px + 29, py, U('#c8861a')); rect(pb, px + 2, py + 5, 6, 5, U('#2c6cc6')); hline(pb, px + 8, px + 12, py + 7, U('#2a2a30')); rect(pb, px + 12, py + 4, 7, 7, U('#2a2a30')); put(pb, px + 14, py + 6, U('#f4f0e6')); put(pb, px + 16, py + 8, U('#f4f0e6')); hline(pb, px + 19, px + 24, py + 7, U('#2a2a30')); vline(pb, px + 25, py + 4, py + 11, U('#e2581a'));
    hline(pb, px + 2, px + 26, py + 13, U('#8e94a2'));
    PL.sign(pb, x0 + 118, roof + 48, 'warn'); PL.sign(pb, x0 + 236, roof + 48, 'bolt');
    // extractor de aire en el muro (rejilla circular)
    K.ellipseFn(pb, x0 + 262, roof + 22, 7, 7, (nx, ny, dd) => dd > 0.85 ? Wl[1] : ((Math.round((ny + 1) * 7)) % 2 ? Wl[2] : Wl[4]));
    // pilastras extremas en corte
    for (const px2 of [x0 - 6, x1]) for (let yy = roof; yy < yF; yy++) for (let k = 0; k < 6; k++) put(pb, px2 + k, yy, Wl[[2, 7, 6, 5, 4, 1][k]]);
    // puerta lateral (vano ≥ 90 px) en el muro derecho
    if (o.doorX) { const dx = o.doorX; for (let yy = yF - 94; yy < yF; yy++) for (let xx = dx; xx < dx + 34; xx++) put(pb, xx, yy, (yy === yF - 94 || xx === dx || xx === dx + 33) ? Wl[1] : K.mixU(U('#3a2418'), U('#7a4a30'), ((xx - dx) % 6 === 0 ? 0.2 : 0.45) + ((yy - yF + 94) < 30 && (xx - dx) < 20 - (yy - yF + 94) * 0.5 ? 0.15 : 0))); hline(pb, dx + 26, dx + 29, yF - 48, U('#f0bc2c')); for (const hy of [yF - 80, yF - 20]) rect(pb, dx + 1, hy, 3, 4, U('#8e94a2')); }
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
  /** Ladera de duna esculpida (r2-biomes-a): campo de crestas en perspectiva (el espaciado crece hacia el primer
      plano), barlovento iluminado que sube hasta una cresta brillante y sotavento en sombra cálida granate (violeta
      solo en las hondonadas profundas); las crestas serpentean y se bifurcan con ruido suave, rizos de viento en
      parches. La zanja de cables CC (s.trench = [x0, x1]) solo se ve en catas de excavación (s.trenchWin) con
      tablestacas; entre catas la duna la cubre. */
  const VIOD = ['#2a1c46', '#3e2a5e', '#583e78', '#74568e'];
  const LEE = ['#3c1630', '#5c2430', '#7a3238', '#98483a', '#b2603e', '#c67a46'];
  function duneU(x, v, sd) { return v + PFK.vn(x * 0.0062, v * 0.18, sd) * 2.4 + PFK.vn(x * 0.019, v * 0.34, sd + 7) * 0.6 + Math.sin(x * 0.013 + v * 1.1 + sd) * 0.3; }
  function trenchWinAt(s, x) {
    if (!s.trench || x < s.trench[0] || x >= s.trench[1]) return null;
    const W_ = s.trenchWin; if (!W_) return [s.trench[0], s.trench[1]];
    for (const w of W_) if (x >= w[0] && x < w[1]) return w;
    return null;
  }
  function sandCut(s, x, y, gy, world) {
    const d = y - gy, S = P32(SAND), sd = 170 + ((s.seed | 0) % 40), sdF = 177;                       // sdF: campo común a todos los tramos (sin costuras)
    if (d === 0) return S[9];
    if (d === 1) return S[8];
    // cata de la zanja de cables CC: borde de excavación irregular, tablestacas, cinta de aviso, tubo corrugado con ventanas que muestran los cables
    const tw = trenchWinAt(s, x);
    if (tw) {
      const L = tw[1] - tw[0], tx = (x - tw[0]) / L, sh = Math.sqrt(Math.max(0, Math.sin(Math.PI * tx)));
      const top = 22 + Math.round((PFK.vn(x * 0.09, 1, sd) - 0.5) * 5 + (1 - sh) * 14), bot = 28 + Math.round(sh * 36 + (PFK.vn(x * 0.07, 2, sd) - 0.5) * 4);
      if (d >= top && d < bot) {
        const q = d - 22, e = d - top;
        if (e < 2) return e ? S[3] : S[2];                                                          // canto de la cata en sombra
        if (bot - d <= 2) return bot - d === 1 ? S[7] : S[5];                                         // labio delantero al sol
        if (q === 9) return ((x >> 2) & 1) ? U('#f0bc2c') : U('#1c1c24');                            // cinta de aviso
        if (q >= 16 && q < 25) {                                                                     // tubo corrugado con ventanas a los cables
          const r = q - 16, win = (x % 46) > 14 && (x % 46) < 36;
          if (r === 0) return U('#5a2a10'); if (r === 8) return U('#2a1004');
          if (win && r > 1 && r < 7) { const c = (x >> 1) % 6; return U(r < 4 ? (c < 3 ? '#c8402a' : '#e86a4a') : (c < 3 ? '#1c1c24' : '#4a4a54')); }
          return U(((x + r) % 3 === 0) ? '#b4561a' : r < 3 ? '#f08a3a' : r < 6 ? '#d06a24' : '#9a4614');
        }
        // pared del corte: estratos de arena (relleno claro sobre el tubo, cama oscura debajo), sombra hacia los lados
        const lay = (q + Math.round(PFK.vn(x * 0.05, q * 0.3, sd + 11) * 2)) % 5 === 0 ? -1 : 0;
        const side = Math.min(tx, 1 - tx) < 0.12 ? -1 : 0;
        return S[clamp((q < 9 ? 4 : q < 16 ? 6 : 3) + lay + side + (PFK.cl(x, y, 2, sd + 9) < 0.15 ? -1 : 0), 2, 8)];
      }
      if (d < top && d >= top - Math.round(sh * 5)) return S[clamp(8 - (top - d), 6, 9)];            // arena removida (caballón) junto a la cata
    }
    // campo de crestas: v crece con la profundidad (perspectiva) y u = v + deriva lateral
    const v = Math.log(1 + d / 18) * 2.45, u = duneU(x, v, sdF), du = (duneU(x + 3, v, sdF) - duneU(x - 3, v, sdF)) / 6;
    const ridge = Math.floor(u), f = u - ridge, px1 = 2.45 / (18 + d);                               // px1 ≈ cuánto avanza u en 1 px
    const deep = Math.max(0, d - 70) / 100, amp = clamp((PFK.vn(x * 0.0055, v * 0.22, sdF + 21) - 0.28) * 2.2, 0, 1);   // altura de la cresta: aparece y se desvanece
    const a = (0.2 + 0.09 * Math.sin(x * 0.023 + ridge * 2.3) + 0.05 * PFK.vn(x * 0.05, ridge, sdF + 3) + deep * 0.1) * (0.25 + 0.75 * amp);
    if (f < a && amp > 0.12) {                                                                       // sotavento en sombra
      const q = f / a;
      if (q < px1 / a * 1.2) return P32(LEE)[amp > 0.5 ? 0 : 1];                                       // filo bajo la cresta
      let k = 1.3 + q * 2.6 - du * 22 - deep * 1.6 + (PFK.cl(x, y, 3, sd + 5) - 0.5) * 0.6;
      if (k < 0.6 && deep > 0.3) return P32(VIOD)[clamp(Math.round(k + 2.2), 0, 3)];
      return P32(LEE)[clamp(Math.round(k), 0, 5)];
    }
    const q = (f - a) / (1 - a);
    if (amp > 0.12 && f > 1 - px1 * 1.1) return S[amp > 0.5 ? 9 : 8];                               // cresta al sol
    if (amp > 0.4 && f > 1 - px1 * 2.3) return S[8];
    let lam = 0.36 + 0.5 * Math.pow(q, 1.25) + du * 5;
    lam = 0.56 + (lam - 0.56) * (0.3 + 0.7 * amp) - deep * 0.18;
    // rizos de viento en parches, paralelos a la cresta
    const rp = (u * 6.5 + PFK.vn(x * 0.04, v, sdF + 2) * 0.8) % 1;
    if (PFK.vn(x * 0.02, v * 0.6, sdF + 4) > 0.56 && q > 0.12 && q < 0.85) { if (rp < 0.16) lam -= 0.11; else if (rp < 0.3) lam += 0.04; }
    lam += (PFK.cl(x, y, 2, sd + 6) - 0.5) * 0.1 + (hash2(x, y, sd + 12) - 0.5) * 0.05;
    // piedras semienterradas
    const hh = hash2(x >> 2, y >> 2, sd + 4);
    if (hh < 0.006 && d > 14) { const u2 = PFTerrain.boulderPix(x, y, sd + 5, 7, 5, P32(RAMP.rockWarmR)); if (u2 !== -1) return u2; }
    if (hash2(x, y, sd + 8) < 0.012) return S[clamp(Math.round(1 + lam * 8.4) - 2, 1, 9)];          // granos oscuros
    return S[clamp(Math.round(0.9 + lam * 7.8), 3, 9)];
  }
  /** Afloramiento de arenisca esculpido en 3/4 (r2-biomes-a): techo plano al sol, estratos con labio claro y
      socavón oscuro, cara izquierda iluminada, derecha en sombra granate, grietas verticales, pie enterrado por
      la arena con rampa de barlovento, sombra arrojada a la derecha y matas en las repisas. */
  const OSH = U('#3a1430');
  function outcrop(pb, cx, yb, w, h, seed = 1) {
    const r = RNG(seed), RW = P32(RAMP.rockWarmR), S = P32(SAND), hw = w / 2, L0 = r.int(4, 6), tops = new Array(w).fill(0);
    // silueta de 2–3 lomos redondeados con escalones de erosión (sin cajas)
    const lumps = [], nl = w > 56 ? 3 : 2;
    for (let i = 0; i < nl; i++) lumps.push({ c: w * (0.22 + 0.56 * i / Math.max(1, nl - 1)) + r.range(-4, 4), hw: w * r.range(0.24, 0.36), h: h * (i === 1 || nl === 2 && i === 0 ? 1 : r.range(0.55, 0.8)) });
    for (let i = 0; i < w; i++) {
      let t = 0;
      for (const L of lumps) { const q = (i - L.c) / L.hw; if (Math.abs(q) < 1) t = Math.max(t, L.h * Math.pow(1 - q * q, 0.45)); }
      t -= Math.floor(PFK.vn(i * 0.11, 3, seed) * 2.4) * 2;
      tops[i] = Math.max(0, Math.round(t));
    }
    // sombra arrojada sobre la arena: elipse baja hacia la derecha (sin tramado)
    for (let yy = Math.round(yb - h * 0.2); yy < yb + 4; yy++) for (let xx = Math.round(cx - hw * 0.3); xx < Math.round(cx + hw * 1.5); xx++) {
      const nx = (xx - (cx + hw * 0.45)) / (hw * 1.05), ny = (yy - (yb + 1)) / Math.max(3, h * 0.24);
      if (nx * nx + ny * ny > 1) continue; const c = get(pb, xx, yy); if (c >>> 24) put(pb, xx, yy, K.mixU(c, OSH, 0.34));
    }
    // grietas: pocas, quebradas, que bajan desde el techo una parte de la altura
    const cracks = [];
    for (let k = 0; k < Math.max(1, Math.round(w / 30)); k++) { const i0 = Math.round(r.range(0.15, 0.85) * w), len = r.range(0.35, 0.8); const pts = []; let xi = i0; for (let q = 0; q < h; q++) { if (r() < 0.3) xi += r() < 0.5 ? -1 : 1; pts.push(xi); } cracks.push({ pts, len }); }
    for (let i = 0; i < w; i++) {
      const x = Math.round(cx - hw + i), th = tops[i], top = yb - th, nx = (i - hw) / hw;
      if (th <= 0) continue;
      const slope = (tops[Math.min(w - 1, i + 2)] - tops[Math.max(0, i - 2)]) / 4;              // pendiente del perfil: cara que mira a la izquierda (sube) se ilumina
      for (let y = top; y < yb; y++) {
        const dy = y - top, ly = yb - y, wv = Math.round((PFK.vn(x * 0.07, ly * 0.05, seed) - 0.5) * 4), lay = (ly + wv + 400) % L0, li = Math.floor((ly + wv + 400) / L0);
        let k;
        if (dy === 0) k = 8;
        else if (dy < 3 && Math.abs(slope) < 0.6) k = dy === 1 ? 7 : 6;                              // techo plano al sol
        else {
          k = 5 + (slope > 0.25 ? 1 : 0) - (slope < -0.25 ? 1 : 0) - (nx > 0.35 ? 1 : 0);
          if (lay === L0 - 1) k += 1; else if (lay === 0) k -= 2;                                    // labio y socavón de cada estrato
          if ((li + seed) % 3 === 0) k -= 1;
          k += Math.round((PFK.cl(x, y, 3, seed) - 0.5) * 1.2);
          k -= Math.round(Math.max(0, dy - th * 0.75) / Math.max(4, th) * 3);                        // pie en penumbra
        }
        for (const C of cracks) { const ci = C.pts[Math.min(C.pts.length - 1, dy)]; if (dy > 1 && dy < th * C.len) { if (i === ci) k = 1; else if (i === ci - 1) k = Math.max(k, 6); } }
        let c = RW[clamp(k, 1, 8)];
        if ((nx > 0.25 || slope < -0.25) && dy > 1) c = K.mixU(c, OSH, clamp((nx - 0.2) * 0.8 + (slope < -0.25 ? 0.12 : 0), 0, 0.45));
        put(pb, x, y, c);
      }
    }
    // pie enterrado: arena que sube por el barlovento (izquierda) y labio bajo
    for (let i = -6; i < w + 6; i++) {
      const x = Math.round(cx - hw + i), nx = (i - hw) / hw, sb = Math.round(2 + Math.max(0, -nx) * h * 0.3 + PFK.vn(x * 0.1, 2, seed) * 3);
      for (let k = 0; k < sb; k++) { const y = yb + 1 - k; if (!(get(pb, x, y) >>> 24)) continue; put(pb, x, y, k === sb - 1 ? S[8] : S[clamp(7 - Math.round(k * 0.5) + (nx > 0.3 ? -2 : 0), 3, 8)]); }
    }
    // matas en las repisas y al pie
    const li0 = Math.round(lumps[0].c); PFFlora.tuft(pb, Math.round(cx - hw + li0), yb - tops[clamp(li0, 0, w - 1)] + 1, 7, 6, seed, PFFlora.DRY);
    if (w > 40) dryBush(pb, Math.round(cx + hw * 0.8), yb + 2, 16, 10, seed + 2);
    return { top: (x) => yb - (tops[clamp(Math.round(x - (cx - hw)), 0, w - 1)] || 0) };
  }
  /** Grupo de vegetación del desierto (2–4 piezas ordenadas por profundidad) */
  function desertCluster(pb, x, y, sc, seed) {
    const r = RNG(seed), k = r();
    stones(pb, x - Math.round(8 * sc), y + 1, Math.round(10 * sc), seed + 1);
    if (k < 0.3) { cactus(pb, x + Math.round(4 * sc), y - 1, Math.round((20 + r.int(0, 16)) * sc), seed); dryBush(pb, x - Math.round(10 * sc), y + 2, Math.round(16 * sc), Math.round(9 * sc), seed + 3); }
    else if (k < 0.55) { opuntia(pb, x, y, 0.55 + r() * 0.35 * sc, seed); PFFlora.tuft(pb, x + Math.round(12 * sc), y + 2, Math.round(8 * sc), Math.round(6 * sc), seed + 4, PFFlora.DRY); }
    else if (k < 0.75) { PFFlora.agave(pb, x, y, Math.max(6, 9 * sc), seed); dryBush(pb, x + Math.round(12 * sc), y + 2, Math.round(14 * sc), Math.round(8 * sc), seed + 5); }
    else { dryBush(pb, x, y, Math.round((16 + r.int(0, 10)) * sc), Math.round((9 + r.int(0, 6)) * sc), seed); PFFlora.tuft(pb, x - Math.round(12 * sc), y + 2, Math.round(8 * sc), Math.round(6 * sc), seed + 6, PFFlora.DRY); }
  }
  /** Rodadas de un vehículo de mantenimiento que bajan en diagonal por la ladera (rompen las bandas) */
  function tireTracks(pb, pts, seed = 1) {
    const S = P32(SAND);
    for (let i = 0; i < pts.length - 1; i++) {
      const [xa, ya] = pts[i], [xb, yb2] = pts[i + 1], n = Math.max(Math.abs(xb - xa), Math.abs(yb2 - ya));
      for (let q = 0; q <= n; q++) {
        const t = q / n, x = Math.round(lerp(xa, xb, t)), y = Math.round(lerp(ya, yb2, t)), gap = Math.round(5 + (y - pts[0][1]) * 0.05);
        for (const o of [0, gap]) for (const dd of [0, 1]) { const c = get(pb, x + o + dd, y); if (!(c >>> 24)) continue; put(pb, x + o + dd, y, (q + o) % 3 === 0 ? S[3] : K.shU(c, -0.16, 22)); }
        if (hash2(x, y, seed) < 0.08) put(pb, x + 2, y - 1, S[8]);
      }
    }
  }
  /** Retoque de la ladera: afloramientos de arenisca, grupos de vegetación cada ~30 px, hitos de la zanja y rodadas */
  function decorateDunes(pb, world, segs, seed = 1) {
    const r = RNG(seed), G = (x) => world.ground[clamp(Math.round(x), 0, world.w)];
    const avoid = (world.def.pf && world.def.pf.faceAvoid) || [];
    const free = (x, y) => !avoid.some(a => x > a[0] && x < a[1] && y > a[2] && y < a[3]);
    for (const s of segs) {
      if (s.face !== 'sandcut' && s.face !== 'dune') continue;
      // rodadas en diagonal (de la pista hacia abajo-izquierda)
      if (s.x1 - s.x0 > 500) { const x = s.x0 + Math.round((s.x1 - s.x0) * 0.62), g = G(x); tireTracks(pb, [[x, g + 4], [x - 40, g + 40], [x - 70, g + 74], [x - 130, g + 120], [x - 170, g + 170]], seed + s.x0); }
      // afloramientos de arenisca
      for (let x = s.x0 + r.int(60, 140); x < s.x1 - 50; x += r.int(190, 300)) {
        const g = G(x), w = r.int(44, 90), h = r.int(22, 40), yb = g + r.int(88, 132);
        if (!free(x, yb - h)) continue;
        if (s.trench && x > s.trench[0] - 40 && x < s.trench[1] + 40 && yb - h < g + 64) continue;
        outcrop(pb, x, yb, w, h, 900 + x);
      }
      // grupos de vegetación (escala con la profundidad: más grandes hacia el primer plano)
      for (let x = s.x0 + r.int(6, 20); x < s.x1 - 10; x += r.int(22, 38)) {
        const g = G(x), inT = s.trench && x >= s.trench[0] && x < s.trench[1], y = g + (inT ? r.int(68, 150) : r.int(10, 150));
        if (!free(x, y)) continue;
        const sc = 0.75 + (y - g) / 150 * 0.75, k = r();
        if (k < 0.55) desertCluster(pb, x, y, sc, x * 7 + 3);
        else if (k < 0.75) dryBush(pb, x, y, Math.round((12 + r.int(0, 10)) * sc), Math.round((7 + r.int(0, 6)) * sc), x);
        else if (k < 0.85) stones(pb, x, y, Math.round((8 + r.int(0, 10)) * sc), x);
        else if (k < 0.9) { for (let i = 0; i < 9; i++) { put(pb, x + i * 3, y - (i % 2), U('#8e5a2a')); put(pb, x + i * 3 + 1, y - 2 + (i % 2), U('#8e5a2a')); } }
        else PFFlora.tuft(pb, x, y, Math.round(8 * sc), Math.round(6 * sc), x, PFFlora.DRY);
      }
      // hitos de señalización de la zanja (entre catas)
      if (s.trench) for (let x = s.trench[0] + 30; x < s.trench[1] - 10; x += 58) {
        if (s.trenchWin && trenchWinAt(s, x) !== null) continue;
        const y = G(x) + 20; for (let k = 0; k < 7; k++) { put(pb, x, y - k, k < 3 ? U('#f0bc2c') : U('#e8e4dc')); put(pb, x + 1, y - k, k < 3 ? U('#a87a10') : U('#9a968e')); }
        put(pb, x, y - 7, U('#e2404a')); put(pb, x + 1, y - 7, U('#a8202a')); put(pb, x + 2, y, U('#8a5a2a'));
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
  /* =====================================================================
     r3-desert · DIORAMA DE LA LADERA (bandas inferiores del N4)
     Cara 'r3tier': bajo la línea de paso, cuatro alturas en 3/4 elevado:
       U  talud de arena iluminado con rizos de viento (d < e1) — o muro del zócalo (zona r3.wall)
       E  muro de contención (gaviones · hormigón con mechinales · arenisca) con labio cálido
       T  bancal inferior visto desde arriba (e1+GH ≤ d < e2): suelo de cultivo, grava o arena
       C  corte frontal del bancal (d ≥ e2): suelo, caliche, arenas estratificadas, AO hacia abajo
     Zonas por x en def.pf.r3zones = [{x0, x1, edge, top, e1?}] (prep → world._r3 por columna).
     Primitivas: tabaiba · cardon · grassWind · cropRow · agriPV · invSkid · robotRail · canal ·
     cableTray · trenchPit · trenchSection · pipeSection · roots · r3Shadow (sombra arrojada abajo-derecha).
     ===================================================================== */
  const R3TAB = ['#1a2a0e', '#2a4214', '#3e5c1a', '#567a20', '#729828', '#94b42e', '#bcd040', '#e2e474'];
  const R3LET = ['#0e2a0e', '#164414', '#22601a', '#347e22', '#4e9c2a', '#74ba38', '#a2d65a', '#d0ee8a'];
  const R3ALOE = ['#142a2c', '#20403e', '#305a54', '#46766a', '#62927e', '#86ae96', '#b2ccb2'];
  const R3SOIL = ['#22100a', '#381c0e', '#502a14', '#6a3c1c', '#845026', '#9e6632', '#b47e44', '#ca9a5c'];
  const R3WAT = ['#05303e', '#084c5e', '#0b6c80', '#0f8ea2', '#16b0c0', '#38cfd8', '#86eaee', '#d4fcfc'];
  const R3CALI = ['#7c6a4c', '#a69472', '#cab896', '#e6d8b4', '#f6ecd0'];
  const R3GH = 7, R3SHC = U('#46203e');
  const R3CONW = ['#2a1a12', '#4a3020', '#6e4a32', '#8e6446', '#ae825c', '#c8a074', '#e0bc90', '#f4dab0'];   // hormigón cálido (árido local)
  const R3EDGE = { gabion: 1, concrete: 2, rock: 3 }, R3TOP = { soil: 1, gravel: 2, sand: 3 };
  function r3E1(x) { return 17 + Math.round((PFK.vn(x * 0.013, 0.3, 501) - 0.5) * 10 + Math.sin(x * 0.0045) * 3); }
  function r3E2(x, gy, hd) { return Math.round((hd - gy) * 0.64 + (PFK.vn(x * 0.008, 0.7, 503) - 0.5) * 10 + Math.sin(x * 0.0033 + 1) * 3); }
  /** Precálculo por columna (world._r3): e1, e2, borde y suelo del bancal según def.pf.r3zones */
  function r3Prep(s, world) {
    if (world._r3) return;
    const wd = world.w + 1, Z = (world.def.pf && world.def.pf.r3zones) || [], T = { e1: new Int16Array(wd), e2: new Int16Array(wd), fan: new Int16Array(wd), edge: new Uint8Array(wd), top: new Uint8Array(wd), wall: new Uint8Array(wd) };
    for (let x = 0; x < wd; x++) {
      const z = Z.find(q => x >= q.x0 && x < q.x1) || {}, gy = world.ground[Math.min(x, world.w)];
      T.e1[x] = z.e1 ? z.e1(x) : r3E1(x); T.e2[x] = Math.max(T.e1[x] + R3GH + 8, r3E2(x, gy, world.h));
      T.edge[x] = R3EDGE[z.edge || 'gabion']; T.top[x] = R3TOP[z.top || 'soil']; T.wall[x] = z.wall ? 1 : 0;
    }
    // abanicos de arena que rebosan el muro (rompen la horizontal): z.fans = [[cx, ancho, fondo]…]
    for (const z of Z) for (const [cx, fw, fd] of (z.fans || [])) for (let x = Math.max(0, cx - fw / 2 | 0); x < Math.min(wd, cx + fw / 2); x++) {
      const q = (x - cx) / (fw / 2); T.fan[x] = Math.max(T.fan[x], Math.round(fd * Math.pow(Math.max(0, 1 - q * q), 0.7) + (PFK.vn(x * 0.15, 4, 597) - 0.5) * 2));
    }
    world._r3 = T;
  }
  /** Alturas del diorama en x (coordenadas de mundo): {gy, e1, top, e2} */
  function r3At(world, x) { const T = world._r3, i = clamp(Math.round(x), 0, world.w), gy = world.ground[i], f = T.fan[i]; return { gy, e1: gy + T.e1[i], fan: f, top: gy + T.e1[i] + Math.max(R3GH, f + 3), e2: gy + T.e2[i] }; }
  function r3SlopePix(x, y, d, e1) {
    const S = P32(SAND), t = d / e1;
    let lam = 0.84 - t * 0.2 + (PFK.vn(x * 0.05, y * 0.09, 511) - 0.5) * 0.16;
    const rp = (d + x * 0.32 + PFK.vn(x * 0.03, d * 0.2, 513) * 3) % 5;                                  // rizos de viento en diagonal
    if (PFK.vn(x * 0.025, 3, 519) > 0.35) { if (rp < 0.9) lam -= 0.1; else if (rp < 1.8) lam += 0.04; }
    lam += (PFK.cl(x, y, 2, 515) - 0.5) * 0.08;
    if (hash2(x, y, 517) < 0.015) lam -= 0.22;
    if (d > e1 - 3) lam -= (d - e1 + 3) * 0.04;
    return S[clamp(Math.round(lam * 9), 3, 9)];
  }
  function r3EdgePix(kind, x, yy) {
    const RW = P32(RAMP.rockWarmR);
    if (kind === 1) {                                                                                    // gaviones: piedras en malla
      const bw = 12, bx = ((x % bw) + bw) % bw;
      if (yy === 0) return U(bx === 0 ? '#9aa0ae' : (x & 1) ? '#f4dcae' : '#fbc371');
      if (yy === R3GH - 1) return U('#2a140a');
      if (bx === 0) return U('#5c6270');
      const r = yy < 3 ? 0 : 1, off = r * 2, cx = Math.floor((x + off) / 4), lx = (x + off) & 3, ly = r ? yy - 3 : yy - 1, lh = r ? 2 : 1;
      let k = 3 + Math.floor(hash2(cx, r, 541) * 3);
      if (lx === 0 || ly === 0) k += 1; if (lx === 3 || ly === lh) k -= 2;
      if (yy === R3GH - 2) k -= 1;
      return RW[clamp(k, 1, 8)];
    }
    if (kind === 2) {                                                                                    // muro de hormigón con mechinales
      const C = P32(PFTerrain.CONC), m = ((x % 28) + 28) % 28;
      if (yy === 0) return C[7]; if (yy === R3GH - 1) return U('#2a1c14');
      if (m >= 12 && m < 15 && yy >= 2 && yy < 4) return U(m === 12 ? '#3a2a20' : '#140c08');
      if (m === 13 && yy >= 4) return C[2];
      let k = 4 + Math.round((PFK.cl(x, yy, 2, 543) - 0.5) * 1.4) - (yy === 1 ? 0 : 0) + (yy === 1 ? 1 : 0);
      if (((x + 400) % 56) === 0) k = 2;
      return C[clamp(k, 1, 7)];
    }
    // arenisca en lajas con labio iluminado
    if (yy === 0) return RW[8]; if (yy === 1) return RW[7]; if (yy === R3GH - 1) return RW[0];
    const lay = (yy + Math.round(PFK.vn(x * 0.08, 1, 545) * 2)) % 3;
    return RW[clamp(5 - (lay === 0 ? 2 : 0) + Math.round((PFK.cl(x, yy, 3, 547) - 0.5) * 1.4) - (yy > 4 ? 1 : 0), 1, 7)];
  }
  function r3TopPix(kind, x, y, q, span) {
    const v = q / Math.max(1, span), ao = q < 2 ? (q === 0 ? -2 : -1) : 0;
    if (kind === 1) {                                                                                    // suelo de cultivo
      const SO = P32(R3SOIL);
      let k = 5 + Math.round((PFK.cl(x, y, 2, 521) - 0.5) * 1.6 + (PFK.vn(x * 0.04, y * 0.1, 523) - 0.5) * 1.2) + (v > 0.75 ? 1 : 0) + ao;
      if (hash2(x, y, 525) < 0.03) k += 2;
      return SO[clamp(k, 1, 7)];
    }
    if (kind === 2) {                                                                                    // grava compactada con rodadas
      const G_ = P32(GRAV);
      let k = 5 + Math.round((PFK.cl(x, y, 2, 527) - 0.5) * 1.8) + ao;
      if (Math.abs(v - 0.55) < 0.05 || Math.abs(v - 0.8) < 0.04) k -= 1;
      const hh = hash2(x, y, 529); if (hh < 0.06) k -= 2; else if (hh > 0.95) k += 2;
      return G_[clamp(k, 1, 8)];
    }
    const S = P32(SAND);                                                                                 // arena con rizos
    let k = 6 + Math.round((PFK.cl(x, y, 2, 531) - 0.5) * 1.4 + (PFK.vn(x * 0.05, y * 0.12, 533) - 0.5) * 1.4) + ao;
    if (((y * 1.0 + x * 0.25 + PFK.vn(x * 0.04, 0, 535) * 3) % 6) < 0.9) k -= 1;
    return S[clamp(k, 2, 9)];
  }
  function r3CutPix(x, y, c, tot) {
    const S = P32(SAND), SO = P32(R3SOIL), CA = P32(R3CALI), w1 = (PFK.vn(x * 0.05, 1, 551) - 0.5) * 4;
    const ao = Math.round(c / Math.max(20, tot) * 2.2), lt = c < 2 ? 1 : 0;
    if (c < 4 + w1 * 0.5) return SO[clamp(3 + lt + Math.round((PFK.cl(x, y, 2, 553) - 0.5) * 1.4), 1, 6)];
    if (c < 9 + w1) { const nod = hash2(x >> 1, y >> 1, 555) < 0.12; return CA[clamp(3 - (nod ? 1 : 0) + Math.round((PFK.cl(x, y, 2, 557) - 0.5) * 1.2), 0, 4)]; }
    const zz = c + w1 * 1.5 + PFK.vn(x * 0.02, c * 0.1, 559) * 3, L = Math.floor(zz / 7) % 3, edge = (zz % 7) < 1;
    let col;
    if (L === 0) col = S[clamp(5 - ao + Math.round((PFK.cl(x, y, 2, 561) - 0.5) * 1.2) - (edge ? 2 : 0), 1, 8)];
    else if (L === 1) col = S[clamp(4 - ao + Math.round((PFK.cl(x, y, 2, 563) - 0.5) * 1.2) - (edge ? 2 : 0), 1, 8)];
    else col = SO[clamp(5 - ao + Math.round((PFK.cl(x, y, 2, 565) - 0.5) * 1.2) - (edge ? 2 : 0), 0, 7)];
    if (hash2(x >> 1, y >> 1, 567) < 0.025) col = SO[1];                                                // guijarros oscuros
    return col;
  }
  function r3Face(s, x, y, gy, world) {
    const d = y - gy, S = P32(SAND), T = world._r3, i = clamp(x, 0, world.w);
    const e1 = T.e1[i], top = e1 + R3GH, e2 = T.e2[i];
    if (d < e1) { if (T.wall[i] && s.r3wall) return s.r3wall(s, x, y, d, e1, world); if (d === 0) return S[9]; if (d === 1) return S[8]; return r3SlopePix(x, y, d, e1); }
    const fan = T.fan[i];
    if (fan > 0 && d < e1 + fan) { const S2 = d - e1, edge = e1 + fan - 1 - d; if (edge === 0) return S[4]; if (edge === 1) return S[6]; const c = r3SlopePix(x, y, d, e1 + fan + 4); return S2 < 2 && edge > 3 ? c : c; }
    if (d < top) return r3EdgePix(T.edge[i], x, d - e1);
    if (d < e2) return r3TopPix(T.top[i], x, y, d - top, e2 - top);
    if (d === e2) return U((x & 3) ? '#fde3a8' : '#f7c679');
    if (d === e2 + 1) return U('#e29441');
    return r3CutPix(x, y, d - e2 - 2, world.h - gy - e2 - 2);
  }
  /** Sombra arrojada sobre el suelo hacia abajo-derecha (elipse sin tramado, tono granate-violeta) */
  function r3Shadow(pb, x, yb, rx, ry, k = 0.36) {
    for (let yy = Math.round(yb - ry * 0.5); yy <= Math.round(yb + ry); yy++) for (let xx = Math.round(x - rx * 0.3); xx <= Math.round(x + rx * 1.7); xx++) {
      const nx = (xx - (x + rx * 0.7)) / (rx * 1.05), ny = (yy - (yb + ry * 0.25)) / ry; if (nx * nx + ny * ny > 1) continue;
      const c = get(pb, xx, yy); if (c >>> 24) put(pb, xx, yy, K.mixU(c, R3SHC, k * (1 - Math.max(0, nx) * 0.35)));
    }
  }
  /** Tabaiba dulce: domo pálido verde-gris de rosetas sobre tallos plateados */
  function tabaiba(pb, x, yb, s = 1, seed = 1) {
    const w = Math.round(20 * s), h = Math.round(13 * s), r = RNG(seed);
    r3Shadow(pb, x + 1, yb, w * 0.45, 3 + 2 * s);
    for (let i = 0; i < 5; i++) { const ex = x + (r() - 0.5) * w * 0.7, ey = yb - h * (0.3 + r() * 0.3); K.lineFn(pb, x + (r() - 0.5) * 4, yb, ex, ey, (t) => U(t < 0.5 ? '#5e584e' : '#9a9488')); }
    PFFlora.bush(pb, x, yb - 1, w, h, R3TAB, seed, { leaf: [2, 4], density: 0.6, lobes: s > 1.1 ? 3 : 2 });
    for (let i = 0; i < Math.round(3 * s); i++) put(pb, Math.round(x + (r() - 0.5) * w * 0.6), Math.round(yb - h * (0.55 + r() * 0.35)), U(i % 2 ? '#e8e070' : '#f6f2b0'));
  }
  /** Cardón canario: candelabro de columnas costilladas de varias alturas con base común */
  function cardon(pb, x, yb, h = 30, seed = 1) {
    const C = P32(CACT), r = RNG(seed), n = 5 + r.int(0, 4), cols = [], hw = h * 0.42;
    for (let i = 0; i < n; i++) { const t = i / (n - 1), cx = Math.round(x + (t - 0.5) * hw * 2 + r.int(-1, 1)), ch = Math.round(h * (0.5 + Math.sin(t * Math.PI) * 0.5) * (0.8 + r() * 0.3)); cols.push({ cx, ch, z: Math.abs(t - 0.5) + r() * 0.1 }); }
    r3Shadow(pb, x + 3, yb, hw + 2, 4 + h * 0.06);
    for (let xx = Math.round(x - hw); xx <= Math.round(x + hw); xx++) for (let k = 0; k < 4; k++) put(pb, xx, yb - 1 - k, C[k === 3 ? 3 : 2]);
    cols.sort((a, b) => b.z - a.z);
    for (const c of cols) {
      for (let y = yb - c.ch; y < yb - 2; y++) for (let i = 0; i < 5; i++) { let k = [6, 5, 4, 2, 1][i]; if ((i === 1 || i === 3) && ((y + c.cx) % 4 === 0)) k = i === 1 ? 7 : 3; if (y > yb - 6) k -= 1; put(pb, c.cx + i - 2, y, C[clamp(k, 0, 7)]); }
      put(pb, c.cx - 1, yb - c.ch - 1, C[6]); put(pb, c.cx, yb - c.ch - 1, C[5]); put(pb, c.cx + 1, yb - c.ch - 1, C[3]);
      if (hash1(c.cx, seed) < 0.45) { put(pb, c.cx, yb - c.ch - 2, U('#e2404a')); put(pb, c.cx + 1, yb - c.ch - 2, U('#9a1830')); }
    }
  }
  /** Mata de gramínea doblada por el viento (hacia el este) */
  function grassWind(pb, x, yb, w = 10, h = 9, seed = 1, ramp = PFFlora.DRY) { PFFlora.tuft(pb, x, yb, w, h, seed, ramp, { wind: 1.4 }); }
  /** Hilera de cultivo con caballón, gotero cian y plantas (lechuga, aloe, tomate, lavanda) */
  function cropRow(pb, x0, x1, yb, kind = 'lettuce', seed = 1, skip = null) {
    const SO = P32(R3SOIL), r = RNG(seed), sk = skip || (() => false);
    for (let x = x0; x < x1; x++) { if (sk(x)) continue; put(pb, x, yb - 1, SO[6]); put(pb, x, yb, SO[4]); put(pb, x, yb + 1, SO[2]); }
    const sp = kind === 'aloe' ? 9 : kind === 'tomato' ? 8 : 6;
    for (let x = x0 + 3; x < x1 - 2; x += sp + r.int(-1, 1)) {
      if (sk(x - 3) || sk(x + 3)) continue;
      if (kind === 'lettuce') { const L = P32(R3LET); K.ellipseFn(pb, x, yb - 3, 3.2, 2.4, (nx, ny, d) => L[clamp(Math.round(5 - nx * 1.4 - ny * 1.8 - (d > 0.75 ? 1.5 : 0) + (d < 0.3 ? -1 : 0)), 1, 7)]); put(pb, x - 1, yb - 4, L[7]); }
      else if (kind === 'aloe') { PFFlora.agave(pb, x, yb - 1, 6, seed + x, R3ALOE); if (r() < 0.3) { for (let k = 0; k < 7; k++) put(pb, x + 1, yb - 6 - k, U(k < 3 ? '#5a6a3a' : k % 2 ? '#f08a2a' : '#ffb84a')); } }
      else if (kind === 'tomato') { const L = P32(R3LET); for (let k = 0; k < 10; k++) put(pb, x + 2, yb - 2 - k, U('#8a6a3a')); K.ellipseFn(pb, x, yb - 6, 3.4, 4.2, (nx, ny, d) => L[clamp(Math.round(3.6 - nx * 1.4 - ny * 1.2 - (d > 0.8 ? 1 : 0)), 0, 6)]); for (let k = 0; k < 3; k++) if (r() < 0.7) put(pb, x + r.int(-2, 2), yb - 3 - r.int(0, 6), U(k % 2 ? '#e2302a' : '#ff6a4a')); }
      else { PFFlora.tuft(pb, x, yb - 1, 5, 6, seed + x, R3ALOE); for (let k = 0; k < 3; k++) put(pb, x - 2 + k * 2, yb - 6 - (k % 2), U(k % 2 ? '#9a6ad8' : '#c9a8f0')); }
    }
    for (let x = x0; x < x1; x++) { if (sk(x)) continue; put(pb, x, yb + 2, U('#1e7a8a')); if (((x - x0) % 6) === 3) put(pb, x, yb + 2, U('#7ae8f0')); }
  }
  /** Mesa agrivoltaica elevada: módulos altos sobre los cultivos (deja pasar luz y maquinaria) */
  function agriPV(pb, x, yb, w = 56, seed = 1) { return pvTable(pb, x, yb, w, { low: 24, ph: 14, sk: 10, piles: 3, seed }); }
  /** Skid de inversor + transformador de MT sobre losa, con marquesina en 3/4 (plano de cubierta, sombra bajo el alero) */
  function invSkid(pb, x, yb, o = {}) {
    const w = o.w || 66, Y = P32(PL.YEL), TG = ['#1c2632', '#2e3c4c', '#46586c', '#62768a', '#8698aa', '#aebccc', '#d4dee8'], Tg = P32(TG);
    r3Shadow(pb, x + w * 0.55, yb + 1, w * 0.55, 7, 0.4);
    I.box3q(pb, x - 4, yb, w + 8, 4, 9, { ramp: PFTerrain.CONC, skew: 0.7 });
    for (let xx = x - 1; xx < x + w + 1; xx++) { put(pb, xx, yb - 5, Y[5]); put(pb, xx, yb - 4, Y[3]); if ((xx - x) % 8 === 0) { put(pb, xx, yb - 6, Y[2]); } }
    const inv = inverter(pb, x + 1, yb - 6, { style: 'central', w: 24, h: 24, label: o.label || null, wear: 0.25, brand: o.brand || '#1a9a6a' });
    I.box3q(pb, x + 30, yb - 6, 20, 18, 7, { ramp: TG, skew: 0.7, front: (xx, yy, u, v) => Tg[((xx - x) % 3 === 0) ? 1 : clamp(4 - Math.round(v * 2), 2, 5)] });
    for (let k = 0; k < 3; k++) { const bx = x + 34 + k * 5; for (let q = 0; q < 6; q++) put(pb, bx, yb - 25 - 7 - q, U(q % 2 ? '#c8562a' : '#e8805a')); }
    I.box3q(pb, x + 52, yb - 6, 12, 16, 6, { ramp: A.WHITE, skew: 0.7 }); rect(pb, x + 54, yb - 18, 4, 3, U('#06122a'));
    PL.sign(pb, x + 54, yb - 14, 'bolt');
    // marquesina: plano de cubierta visible (gris claro con borde cálido) sobre 4 postes, banda de sombra bajo el alero
    const ry = yb - 46, rd = 9, sk = 0.7, Al = P32(['#0a2026', '#10343e', '#164a58', '#1e6272', '#2a7e8e', '#3e9aa8', '#62b6c0', '#9ad4d8']);
    for (const px of [x - 2, x + w - 1]) { for (let yy = ry + 2; yy < yb - 5; yy++) { put(pb, px, yy, Al[5]); put(pb, px + 1, yy, Al[2]); } }
    for (let r = 0; r < rd; r++) { const off = Math.round(r * sk); for (let xx = x - 5 + off; xx < x + w + 4 + off; xx++) put(pb, xx, ry - r, r === rd - 1 ? U('#fbc371') : (xx - x - off) % 9 === 0 ? Al[3] : Al[5 + (r < 3 ? 1 : 0)]); }
    for (let xx = x - 5; xx < x + w + 4; xx++) { put(pb, xx, ry + 1, U('#fbc371')); put(pb, xx, ry + 2, Al[2]); }
    for (let k = 0; k < 3; k++) for (let xx = x - 1; xx < x + w; xx++) { const c = get(pb, xx, ry + 3 + k); if (c >>> 24) put(pb, xx, ry + 3 + k, K.mixU(c, U('#2a1c4a'), 0.42 - k * 0.1)); }
    for (let r = 0; r < rd; r++) put(pb, x + w + 4 + Math.round(r * sk), ry - r, Al[1]);
    return { fan: [x + 12, yb - 31], led: [x + 21, yb - 25], scr: [x + 5, yb - 20, 10, 5], inPt: [x - 2, yb - 10], outPt: [x + 64, yb - 14], hv: [x + 39, yb - 39] };
  }
  /** Carril del robot de limpieza (dos raíles sobre traviesas) con estación de carga al final */
  function robotRail(pb, x0, x1, yb) {
    const Al = P32(ALU), Wd = P32(WOODF);
    for (let x = x0; x < x1; x++) { if ((x - x0) % 5 === 0) for (let k = -1; k <= 4; k++) put(pb, x + Math.round(k * 0.4), yb - k, Wd[2]); }
    for (let x = x0; x < x1; x++) { put(pb, x, yb, Al[6]); put(pb, x, yb + 1, Al[2]); put(pb, x + 2, yb - 4, Al[5]); put(pb, x + 2, yb - 3, Al[1]); }
    I.box3q(pb, x1 - 2, yb + 1, 12, 14, 6, { ramp: A.WHITE, skew: 0.7 }); rect(pb, x1, yb - 10, 6, 3, U('#06122a'));
    return { y: yb, x0, x1, dock: [x1 + 3, yb - 8] };
  }
  /** Canal de riego revestido en 3/4: labio trasero iluminado, lámina turquesa, cara delantera */
  function canal(pb, x0, x1, yy0) {
    const C = P32(PFTerrain.CONC), Wt = P32(R3WAT), Y = typeof yy0 === 'function' ? yy0 : () => yy0, y = Math.round(Y(x0));
    for (let x = x0; x < x1; x++) {
      const y = Math.round(Y(x));
      put(pb, x, y - 5, C[6]); put(pb, x, y - 4, C[3]);
      for (let k = 0; k < 4; k++) { let c = Wt[[3, 4, 5, 6][k] + (PFK.cl(x, y + k, 3, 571) < 0.25 ? -1 : 0)]; if (((x * 3 + k * 7) % 23) === 0) c = Wt[7]; put(pb, x, y - 3 + k, c); }
      put(pb, x, y + 1, C[7]); put(pb, x, y + 2, C[5]); put(pb, x, y + 3, C[2]); put(pb, x, y + 4, U('#2a1c14'));
    }
    return { x0, x1, y: y - 1 };
  }
  /** Bandeja portacables de escalera (galvanizada) a lo largo de una polilínea, con mazo de cables */
  function cableTray(pb, pts, o = {}) {
    const St = P32(PFInfra.STEEL), out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [xa, ya] = pts[i], [xb, yb2] = pts[i + 1], n = Math.max(1, Math.round(Math.max(Math.abs(xb - xa), Math.abs(yb2 - ya))));
      for (let q = 0; q <= n; q++) {
        const t = q / n, x = Math.round(lerp(xa, xb, t)), y = Math.round(lerp(ya, yb2, t));
        put(pb, x, y - 2, St[6]); put(pb, x, y + 1, St[2]); put(pb, x, y - 1, U(o.cab || ((x >> 1) % 3 ? '#1c1c24' : '#a8202a'))); put(pb, x, y, U('#2a2a30'));
        if (q % 4 === 0) { put(pb, x, y - 1, St[4]); put(pb, x, y + 2, St[1]); }
        out.push([x, y - 1]);
      }
    }
    return out;
  }
  /** Cata de la zanja CC vista desde arriba: hoyo con tablestacas, cama de arena, tubos y cinta de aviso */
  function trenchPit(pb, x0, x1, y, dpt = 12) {
    const S = P32(SAND), Wd = P32(WOODF), pits = [];
    for (let x = x0; x < x1; x++) {
      const t = (x - x0) / (x1 - x0), sh = Math.sqrt(Math.sin(Math.PI * t)), a = y - Math.round(sh * 3), b = y + Math.round(dpt * (0.55 + sh * 0.45));
      for (let yy = a - 3; yy < a; yy++) put(pb, x, yy, S[clamp(8 - (a - yy), 6, 9)]);                    // caballón de arena removida
      for (let yy = a; yy < b; yy++) {
        const q = yy - a, L = b - a;
        let c = q < 3 ? Wd[(x % 4) ? 3 : 1] : q > L - 4 ? S[clamp(5 + (q - L + 4), 4, 8)] : S[clamp(3 + Math.round((PFK.cl(x, yy, 2, 573) - 0.5) * 1.4), 2, 5)];
        if (q === 3) c = U('#140c08');
        put(pb, x, yy, c);
      }
      const cy = b - 5;                                                                                   // tubos corrugados con cables
      for (let k = 0; k < 2; k++) { put(pb, x, cy - k * 3, U(((x + k) % 3) ? '#f08a3a' : '#9a4614')); put(pb, x, cy - k * 3 + 1, U('#7a3410')); }
      put(pb, x, b, S[8]); put(pb, x, b + 1, S[6]);
      pits.push([x, cy - 1]);
    }
    for (const px of [x0 - 3, x1 + 2]) for (let k = 0; k < 9; k++) { put(pb, px, y - 2 - k, U(k > 6 ? '#e2404a' : '#e8e4dc')); put(pb, px + 1, y - 2 - k, U('#8e8a84')); }
    for (let x = x0 - 3; x < x1 + 3; x++) put(pb, x, y - 9 + Math.round(Math.sin((x - x0) / (x1 - x0 + 6) * Math.PI) * 2), U(((x >> 2) & 1) ? '#f0bc2c' : '#1c1c24'));
    return pits;
  }
  /** Zanja CC en sección (en el corte del bancal): losa de aviso, cinta, cama de arena y tubos con cables */
  function trenchSection(pb, cx, ytop, w = 26, h = 20) {
    const S = P32(SAND), x0 = Math.round(cx - w / 2), cores = [];
    for (let yy = ytop; yy < ytop + h; yy++) for (let x = x0; x < x0 + w; x++) {
      const e = x === x0 || x === x0 + w - 1 || yy === ytop + h - 1;
      put(pb, x, yy, e ? U('#3a2010') : S[clamp(7 - Math.round((yy - ytop) / h * 2) + (PFK.cl(x, yy, 2, 577) < 0.2 ? -1 : 0), 4, 8)]);
    }
    for (let x = x0 - 2; x < x0 + w + 2; x++) { put(pb, x, ytop - 2, P32(PFTerrain.CONC)[6]); put(pb, x, ytop - 1, P32(PFTerrain.CONC)[3]); put(pb, x, ytop + 3, U(((x >> 1) & 1) ? '#f0bc2c' : '#e2404a')); }
    const n = Math.max(2, Math.round(w / 8));
    for (let i = 0; i < n; i++) {
      const px = x0 + Math.round((i + 0.5) * w / n), py = ytop + h - 6;
      K.ellipseFn(pb, px, py, 3.2, 3.2, (nx, ny, dd) => dd > 0.75 ? U(nx + ny < 0 ? '#f8a050' : '#7a3410') : dd > 0.5 ? U('#2a1408') : U(i % 2 ? '#c87a3a' : '#e8a050'));
      put(pb, px - 1, py, U(i % 2 ? '#1c1c24' : '#a8202a')); put(pb, px + 1, py, U(i % 2 ? '#a8202a' : '#1c1c24'));
      cores.push([px, py]);
    }
    return cores;
  }
  /** Tubería en sección (anillo de pared y fluido) — riego cian por defecto */
  function pipeSection(pb, cx, cy, r = 4, fl = R3WAT) {
    const Fw = P32(fl);
    K.ellipseFn(pb, cx, cy, r + 1.2, r + 1.2, (nx, ny, dd) => dd > 0.82 ? U(nx + ny < 0 ? '#c8ccd2' : '#3a3e48') : dd > 0.7 ? U('#14181e') : Fw[clamp(Math.round(5 - ny * 2 - nx), 2, 7)]);
    put(pb, Math.round(cx - r * 0.4), Math.round(cy - r * 0.4), Fw[7]);
  }
  /** Zócalo del taller: altura del muro (más alto en el centro, se funde con el talud en los flancos) */
  function r3VaultE1(x, x0, x1) { const m = Math.min(x - x0, x1 - 1 - x), k = smooth(clamp(m / 40, 0, 1)); return Math.round(lerp(r3E1(x), 52, k)); }
  /** Muro del zócalo: viga de cimentación de hormigón y mampostería de basalto (piedras irregulares con techo
      iluminado y llagas claras); arena apilada en diagonal en los flancos */
  const R3BAS = ['#120c26', '#1c1636', '#282048', '#362c5a', '#463a6c', '#5a4c80', '#706094', '#8c7cac', '#b0a0c8'];
  function r3Stone(x, y, cw, ch, seed) {
    // celdas con centro desplazado: piedra más cercana y distancia al borde (llaga)
    const gx = Math.floor(x / cw), gy = Math.floor(y / ch);
    let best = 1e9, second = 1e9, id = 0, bx = 0, by = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const cx = gx + i, cy = gy + j, ox = (cx + (cy & 1) * 0.5 + hash2(cx, cy, seed) * 0.7 + 0.15) * cw, oy = (cy + hash2(cx, cy, seed + 1) * 0.6 + 0.2) * ch;
      const dx = (x - ox) / cw, dy = (y - oy) / ch, d = dx * dx + dy * dy * 1.3;
      if (d < best) { second = best; best = d; id = cx * 977 + cy * 131; bx = dx; by = dy; } else if (d < second) second = d;
    }
    return { id, edge: Math.sqrt(second) - Math.sqrt(best), bx, by };
  }
  function r3VaultWall(s, x, y, d, e1, world, x0, x1) {
    const S = P32(SAND), Bz = P32(R3BAS), C = P32(R3CONW), m = Math.min(x - x0, x1 - 1 - x);
    const dd = 5 + Math.round(m * 1.25 + (PFK.vn(x * 0.1, 2, 581) - 0.5) * 3);
    if (m < 44 && d >= dd) { if (d === dd) return S[9]; if (d === dd + 1) return S[8]; return r3SlopePix(x, y, d, e1); }
    if (d === 0) return U('#fde3a8');
    if (d < 5) return d === 4 ? U('#2a1c14') : C[[7, 6, 5][d - 1]];
    if (d === 5) return U('#3a2a24');
    const st = r3Stone(x, d, 11, 8, 583);
    if (st.edge < 0.09) return U(st.edge < 0.04 ? '#8a7a68' : '#b8a68e');                             // llaga de mortero claro
    let k = 4 + Math.floor(hash1(st.id, 585) * 2.4) + Math.round((-st.bx - st.by * 1.2) * 2.2) + Math.round((PFK.cl(x, y, 2, 587) - 0.5) * 1.1);
    if (st.edge < 0.16 && (st.bx + st.by) > 0) k -= 1;                                                  // canto en sombra abajo-derecha
    if (st.edge < 0.16 && (st.bx + st.by) < -0.2) k += 1;                                               // canto iluminado arriba-izquierda
    k -= Math.round(Math.max(0, d - e1 + 12) / 7);
    const c = Bz[clamp(k, 0, 8)];
    return hash1(st.id, 589) < 0.22 ? K.mixU(c, U('#a04a2a'), 0.42) : c;                               // alguna piedra rojiza (toba)
  }
  /** Aljibe / balsa en 3/4: brocal de piedra iluminado, lámina turquesa, cara delantera */
  function basin(pb, x, y, w, h) {
    const RW = P32(RAMP.rockWarmR), Wt = P32(R3WAT);
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      const bx = xx - x, by = yy - y, rim = by < 2 || bx < 2 || bx > w - 3 || by > h - 5;
      if (rim) { const front = by > h - 5; put(pb, xx, yy, front ? RW[by === h - 5 ? 8 : by === h - 1 ? 1 : 4 + ((xx >> 2) & 1)] : RW[by === 0 ? 8 : bx < 2 ? 7 : 5]); continue; }
      let c = Wt[clamp(5 - Math.round((by - 2) / (h - 6) * 2) + (PFK.cl(xx, yy, 3, 591) < 0.2 ? -1 : 0), 1, 7)];
      if (by === 2) c = Wt[1]; if (((xx * 3 + yy * 5) % 29) === 0) c = Wt[7];
      put(pb, xx, yy, c);
    }
    return { water: [x + 3, y + 3, w - 6, h - 8] };
  }
  /** Zoco de La Geria: media luna de piedra volcánica seca que abriga una higuera/parra sobre picón negro */
  function zoco(pb, x, yb, s = 1, seed = 1) {
    const r = RNG(seed), rx = 12 * s, ry = 5 * s, BS = P32(['#120c22', '#20183a', '#302650', '#423666', '#5a4a7a', '#7a6488', '#a88a8c', '#d8b49a']);
    K.ellipseFn(pb, x, yb - ry * 0.4, rx * 1.05, ry * 1.1, (nx, ny, d, xx, yy) => P32(['#140e1c', '#20182a', '#2c2238', '#3a2e46'])[clamp(Math.round(2 - ny + (PFK.cl(xx, yy, 2, seed) - 0.5) * 1.5), 0, 3)]);
    // muro en media luna detrás (a barlovento): piedras de basalto con techo cálido
    for (let a = Math.PI * 1.0; a < Math.PI * 2.0; a += 0.17 / s) {
      const cx = x + Math.cos(a) * rx, cy = yb - ry * 0.45 + Math.sin(a) * ry, st = 2.3 + r() * 1.2;
      for (let lay = 0; lay < 3; lay++) K.ellipseFn(pb, cx + (r() - 0.5), cy - lay * 2.3 * s, st, st * 0.75, (nx, ny) => BS[clamp(Math.round(3.2 - nx * 1.2 - ny * 1.8 + lay * 0.9), 0, 7)]);
    }
    // higuera o parra en el centro (hojas anchas verde intenso) con tronco
    for (let k = 0; k < Math.round(5 * s); k++) { put(pb, Math.round(x + k * 0.3), yb - Math.round(ry * 0.4) - k, U('#5a3a22')); put(pb, Math.round(x + 1 + k * 0.3), yb - Math.round(ry * 0.4) - k, U('#3a2414')); }
    PFFlora.cluster(pb, x + 1, yb - ry - 5 * s, 8 * s, 6 * s, R3LET, seed, { leaf: [3, 5], density: 0.7 });
    r3Shadow(pb, x + 3, yb, rx * 0.8, 3, 0.3);
  }
  /** Pared de piedra seca (linde de bancales) a lo largo de una polilínea: piedras volcánicas con techo iluminado */
  function dryWall(pb, pts, seed = 1) {
    const r = RNG(seed), BS = P32(['#120c22', '#20183a', '#302650', '#423666', '#5a4a7a', '#7a6488', '#a88a8c', '#d8b49a']);
    for (let i = 0; i < pts.length - 1; i++) {
      const [xa, ya] = pts[i], [xb, yb2] = pts[i + 1], n = Math.max(1, Math.round(Math.hypot(xb - xa, yb2 - ya) / 3));
      for (let q = 0; q <= n; q++) {
        const t = q / n, cx = lerp(xa, xb, t), cy = lerp(ya, yb2, t);
        for (let lay = 0; lay < 2; lay++) { const st = 2 + r() * 1.3; K.ellipseFn(pb, cx + (r() - 0.5) * 1.5, cy - lay * 2.6, st, st * 0.72, (nx, ny) => BS[clamp(Math.round(3 - nx * 1.2 - ny * 1.8 + lay * 1.2), 0, 7)]); }
        if (q % 2 === 0) { const c = get(pb, Math.round(cx + 3), Math.round(cy + 2)); if (c >>> 24) put(pb, Math.round(cx + 3), Math.round(cy + 2), K.mixU(c, R3SHC, 0.4)); }
      }
    }
  }
  /** Cuadrícula de paja (fijación de dunas) en perspectiva con plantones en algunas celdas */
  function strawGrid(pb, x0, x1, y0, y1, seed = 1) {
    const r = RNG(seed), ST = P32(['#5a3a10', '#8a6420', '#b88a34', '#dcb456', '#f4d888', '#fff0c0']);
    for (let y = y0; y < y1; y++) {
      const v = (y - y0) / Math.max(1, y1 - y0), cell = Math.round(11 + v * 7), rowH = Math.round(5 + v * 3);
      const ry = Math.floor((y - y0) / rowH), lyy = (y - y0) % rowH;
      for (let x = x0; x < x1; x++) {
        const lx = ((x - x0 + ry * 4) % cell + cell) % cell;
        if (hash2(x >> 2, ry, seed) < 0.08) continue;
        if (lyy === 0) put(pb, x, y, ST[(x + ry) % 3 ? 4 : 5]); else if (lyy === 1) put(pb, x, y, ST[2]);
        else if (lyy === 2) { const c = get(pb, x, y); if (c >>> 24) put(pb, x, y, K.mixU(c, R3SHC, 0.22)); }
        if (lx === 0 && lyy > 0) put(pb, x, y, ST[3]); else if (lx === 1 && lyy > 0) put(pb, x, y, ST[1]);
      }
    }
    // plantones (tabaiba joven / balancón) en celdas
    for (let k = 0; k < Math.round((x1 - x0) / 7); k++) { const x = r.int(x0 + 3, x1 - 3), y = r.int(y0 + 4, y1 - 2); if (r() < 0.6) PFFlora.tuft(pb, x, y, 5, 5 + r.int(0, 3), seed + k, R3TAB); else PFFlora.cluster(pb, x, y - 2, 3, 2.4, R3TAB, seed + k, { leaf: [2, 3], density: 0.8, core: false }); }
  }
  /** Bobina de cable (carrete de madera) en 3/4 */
  function cableDrum(pb, x, yb, r0 = 9, col = '#1c1c24') {
    const Wd = P32(PFArch.WOOD);
    r3Shadow(pb, x + 3, yb, r0, 3);
    K.ellipseFn(pb, x + 3, yb - r0, r0 * 0.45, r0, (nx, ny, d) => Wd[clamp(Math.round(4 - nx * 1.5 - ny * 1.2 - (d > 0.8 ? 1 : 0)), 0, 7)]);
    for (let yy = yb - r0 * 2 + 3; yy < yb - 2; yy++) for (let xx = x - 2; xx < x + 4; xx++) put(pb, xx, yy, ((yy + xx) % 3) ? U(col) : U('#4a4a54'));
    K.ellipseFn(pb, x - 3, yb - r0, r0 * 0.45, r0, (nx, ny, d) => d > 0.82 ? Wd[2] : d < 0.2 ? Wd[1] : Wd[clamp(Math.round(6 - nx - ny * 1.4 - d * 2), 2, 7)]);
    put(pb, x - 3, yb - r0, Wd[0]);
  }
  /** Palé de módulos FV de repuesto (azul con reflejo) */
  function modulePallet(pb, x, yb, n = 5) {
    r3Shadow(pb, x + 12, yb, 14, 3);
    I.box3q(pb, x, yb, 26, 3, 6, { ramp: PFArch.WOOD, skew: 0.7 });
    for (let k = 0; k < n; k++) I.box3q(pb, x + 1, yb - 3 - k * 2, 24, 2, 6, { ramp: ['#0c1838', '#1b3366', '#335a98', '#6e98d0', '#d2d6dc', '#ffffff'], skew: 0.7 });
  }
  /** Umbráculo del vivero: postes, malla de sombreo verde en 3/4 (plano visible) y bandejas de plantones */
  function shadeHouse(pb, x, yb, w = 90, h = 30) {
    const St = P32(PFInfra.STEEL), NET = P32(['#0e2a1c', '#164030', '#1e5640', '#2a6e50', '#3a8a62']), d = 12, sk = 0.7;
    r3Shadow(pb, x + w * 0.5, yb + 1, w * 0.55, 6, 0.24);
    for (let k = 0; k < 3; k++) { const ty = yb - 2 - k * 7; for (let xx = x + 4 + k * 3; xx < x + w - 4 + k * 3; xx++) { put(pb, xx, ty, U('#3a2a1a')); if ((xx % 4) && (xx + k) % 7) PFFlora.tuft(pb, xx, ty - 1, 2, 3, xx + k, R3LET); } }
    for (const px of [x, x + w - 2, x + Math.round(d * sk), x + w - 2 + Math.round(d * sk)]) for (let yy = yb - h; yy < yb - (px > x + w - 3 ? 0 : 0); yy++) { put(pb, px, yy, St[5]); put(pb, px + 1, yy, St[2]); }
    for (let r = 0; r < d; r++) { const off = Math.round(r * sk); for (let xx = x + off; xx < x + w + off; xx++) { const c = get(pb, xx, yb - h - r); const net = NET[clamp(2 + ((xx + r) % 3 === 0 ? 1 : 0) + (r === d - 1 ? 2 : 0), 0, 4)]; put(pb, xx, yb - h - r, c >>> 24 ? K.mixU(c, net, 0.82) : net); } }
    for (let xx = x; xx < x + w; xx++) { put(pb, xx, yb - h + 1, U('#fbc371')); for (let k = 0; k < 4; k++) { const c = get(pb, xx, yb - h + 2 + k); if (c >>> 24) put(pb, xx, yb - h + 2 + k, K.mixU(c, U('#0e2a1c'), 0.35 - k * 0.07)); } }
  }
  /** Hubara canaria (avutarda pequeña): parda arena con collar blanco y negro */
  function hubara(pb, x, yb, f = 1) {
    const B = ['#2a1a0c', '#5a3c1e', '#8a6232', '#b48a4a', '#d8b878', '#f4e4c0'];
    const px = (dx, dy, k) => put(pb, x + dx * f, yb + dy, U(typeof k === 'string' ? k : B[k]));
    for (let dx = -4; dx <= 3; dx++) for (let dy = -6; dy <= -2; dy++) { const e = (dx / 4.5) ** 2 + ((dy + 4) / 2.6) ** 2; if (e <= 1) px(dx, dy, dy < -4 ? 4 : dx > 1 ? 2 : 3); }
    for (let dy = -10; dy <= -6; dy++) { px(2, dy, dy < -8 ? 4 : '#f4f0e8'); px(3, dy, dy === -7 ? '#1a1410' : dy < -8 ? 3 : '#e8e4dc'); }
    px(3, -11, 4); px(4, -11, 3); px(5, -11, '#3a2a1a'); px(4, -12, '#1a1410');
    for (const dx of [-1, 1]) { px(dx, -1, 1); px(dx, 0, 1); }
    px(-5, -4, 1); px(-5, -3, 2);
  }
  /** Patio de subestación en 3/4: grava vallada, pórticos de celosía, transformador de potencia, interruptores y barras */
  function substation(pb, x, yb, w = 150) {
    const St = P32(PFInfra.STEEL), Tp = P32(['#14202a', '#24384a', '#3a566e', '#567a94', '#7aa0b8', '#a8c4d4', '#d0e2ec']), out = { ins: [], hv: [] };
    r3Shadow(pb, x + w * 0.5, yb + 1, w * 0.5, 6, 0.28);
    // pórticos de celosía (dos torres + travesaño), con cadenas de aisladores
    const portal = (px, h) => {
      for (const tx of [px, px + 34]) { for (let y = yb - h; y < yb; y++) { put(pb, tx, y, St[6]); put(pb, tx + 3, y, St[2]); if (((y - yb) & 3) === 0) { put(pb, tx + 1, y, St[4]); put(pb, tx + 2, y, St[3]); } else if (((y - yb) & 3) === 2) { put(pb, tx + 2, y, St[4]); } } }
      for (let xx = px; xx < px + 38; xx++) { put(pb, xx, yb - h, St[7]); put(pb, xx, yb - h + 1, St[3]); put(pb, xx, yb - h + 3, St[2]); if (((xx - px) & 3) === 1) put(pb, xx, yb - h + 2, St[4]); }
      for (const ix of [px + 8, px + 18, px + 28]) { for (let k = 0; k < 6; k++) put(pb, ix, yb - h + 4 + k, U(k % 2 ? '#c8562a' : '#e8805a')); out.ins.push([ix, yb - h + 10]); }
    };
    portal(x + 4, 52); portal(x + w - 44, 52);
    // barras entre pórticos (catenaria)
    for (const ix of [8, 18, 28]) for (let xx = x + 4 + ix; xx < x + w - 44 + ix; xx++) { const t = (xx - x - 4 - ix) / (w - 48); put(pb, xx, Math.round(yb - 42 + Math.sin(t * Math.PI) * 5), U('#2a2a30')); }
    // transformador de potencia con radiadores y pasatapas
    const tx = x + Math.round(w * 0.36);
    I.box3q(pb, tx - 4, yb, 50, 5, 10, { ramp: PFTerrain.CONC, skew: 0.6 });
    I.box3q(pb, tx + 4, yb - 5, 30, 26, 9, { ramp: ['#14202a', '#24384a', '#3a566e', '#567a94', '#7aa0b8', '#a8c4d4', '#d0e2ec'], skew: 0.6, front: (xx, yy, u, v) => Tp[((xx - tx) % 4 === 0) ? 1 : 3 - Math.round(v)] });
    for (let k = 0; k < 4; k++) for (let yy = yb - 28; yy < yb - 7; yy++) { put(pb, tx - 2 + k * 2, yy, Tp[k % 2 ? 2 : 5]); put(pb, tx + 36 + k * 2, yy, Tp[k % 2 ? 2 : 4]); }
    for (const bx of [tx + 9, tx + 17, tx + 25]) { for (let k = 0; k < 9; k++) { put(pb, bx, yb - 32 - 6 - k, U(k % 2 ? '#c8562a' : '#e8805a')); put(pb, bx + 1, yb - 32 - 6 - k, U('#8a3a1a')); } out.hv.push([bx, yb - 48]); }
    PFInfra.cylH(pb, tx + 6, tx + 30, yb - 35, 3, { ramp: PFInfra.STEEL });
    // interruptores (tres polos en columnas) y seccionadores
    for (let k = 0; k < 3; k++) { const bx = x + w - 40 + k * 10; for (let yy = yb - 30; yy < yb; yy++) { put(pb, bx, yy, St[5]); put(pb, bx + 1, yy, St[2]); } I.cylV(pb, bx + 1, yb - 30, 3, 10, { ramp: ['#3a3e48', '#5a6070', '#8a92a2', '#b8c0cc', '#e0e6ee'] }); }
    // valla perimetral de malla con cartel de peligro
    for (let xx = x - 4; xx < x + w + 4; xx++) { put(pb, xx, yb - 14, St[5]); if (((xx - x) % 3) === 0) for (let yy = yb - 13; yy < yb; yy++) if ((yy + xx) % 3 === 0) put(pb, xx, yy, St[3]); }
    for (let xx = x - 4; xx < x + w + 4; xx += 14) for (let yy = yb - 16; yy < yb + 1; yy++) { put(pb, xx, yy, St[6]); put(pb, xx + 1, yy, St[2]); }
    rect(pb, x + 10, yb - 11, 9, 7, U('#fcd856')); PL.sign(pb, x + 11, yb - 11, 'bolt');
    return out;
  }
  /** Hangar de mantenimiento en 3/4: fachada con portón abierto e interior iluminado, faldón de cubierta visible
      (chapa grecada clara con borde cálido), banda de sombra bajo el alero, lateral en sombra y sombra arrojada abajo-derecha */
  function hangar(pb, x, yb, w = 96, h = 40, o = {}) {
    const Wl = P32(['#3a2a2a', '#5a4040', '#7a5a52', '#9a7666', '#b8927a', '#d2ae92', '#e8caa8', '#f6e2c4']), Rf = P32(['#0e2a3a', '#16405a', '#1e5a7a', '#2a7898', '#4a98b4', '#7ab8cc', '#b8dce6']), d = 18, sk = 0.75, dx = Math.round(d * sk);
    // sombra arrojada hacia abajo-derecha (en el suelo, delante del lateral)
    for (let yy = yb - 2; yy < yb + 7; yy++) for (let xx = x + w - 6; xx < x + w + dx + 22 - (yy - yb) * 1.2; xx++) { const c = get(pb, xx, yy); if (c >>> 24) put(pb, xx, yy, K.mixU(c, R3SHC, 0.4)); }
    // lateral derecho en sombra (violeta cálido)
    PFK.polyFill(pb, [[x + w, yb - h], [x + w + dx, yb - h - d], [x + w + dx, yb - d], [x + w, yb]], (xx, yy) => K.mixU(Wl[2 + ((xx >> 2) & 1)], U('#4a2a6a'), 0.35));
    // fachada: muro de bloque claro con portón abierto (interior cálido) y ventana alta
    for (let yy = yb - h; yy < yb; yy++) for (let xx = x; xx < x + w; xx++) {
      const lx = xx - x, ly = yy - (yb - h);
      let k = 5 + Math.round((PFK.cl(xx, yy, 2, 601) - 0.5) * 1.2) - (lx > w - 4 ? 1 : 0); if (ly % 6 === 5) k -= 1; if (ly < 4) k -= 2 - (ly >> 1);
      put(pb, xx, yy, Wl[clamp(k, 0, 7)]);
    }
    const dx0 = x + Math.round(w * 0.18), dw = Math.round(w * 0.52), dh = Math.round(h * 0.78);
    for (let yy = yb - dh; yy < yb; yy++) for (let xx = dx0; xx < dx0 + dw; xx++) {
      const lx = (xx - dx0) / dw, ly = (yy - yb + dh) / dh;
      let c = K.mixU(U('#2a1c24'), U('#e8b878'), clamp(0.7 - Math.hypot(lx - 0.5, ly - 0.15) * 1.1, 0.05, 0.7));
      if (ly > 0.82) c = K.mixU(U('#5a4434'), U('#f0d0a0'), clamp(0.55 - Math.abs(lx - 0.5), 0.1, 0.55));
      put(pb, xx, yy, c);
    }
    for (let xx = dx0 - 1; xx <= dx0 + dw; xx++) { put(pb, xx, yb - dh - 1, Wl[1]); put(pb, xx, yb - dh - 2, P32(PL.YEL)[4]); }
    for (let k = 0; k < 4; k++) rect(pb, dx0 + 3 + k * 9, yb - dh + 2, 7, 1, U('#c8c0b0'));                                    // persiana recogida
    // interior: vehículo utilitario y estanterías con robots de recambio
    I.box3q(pb, dx0 + 6, yb - 2, 22, 9, 6, { ramp: PL.YEL, skew: 0.7 }); I.box3q(pb, dx0 + 20, yb - 2, 10, 14, 5, { ramp: PL.YEL, skew: 0.7 });
    for (const wx of [dx0 + 10, dx0 + 25]) K.ellipseFn(pb, wx, yb - 2, 3, 3, (nx, ny, dd) => dd > 0.45 ? U('#14141a') : U('#6c7280'));
    for (let s2 = 0; s2 < 3; s2++) { rect(pb, dx0 + dw - 16, yb - 8 - s2 * 8, 13, 1, U('#6c7280')); rect(pb, dx0 + dw - 15, yb - 11 - s2 * 8, 5, 3, U('#f0bc2c')); rect(pb, dx0 + dw - 9, yb - 11 - s2 * 8, 5, 3, U('#1aa894')); }
    rect(pb, x + w - 18, yb - h + 8, 12, 7, U('#8ab8d8')); rect(pb, x + w - 18, yb - h + 8, 12, 1, U('#d8ecf8')); rect(pb, x + w - 18, yb - h + 15, 12, 1, Wl[1]);
    // faldón de cubierta en 3/4 (chapa grecada) con borde cálido y canalón
    for (let r = 0; r < d; r++) { const off = Math.round(r * sk); for (let xx = x - 3 + off; xx < x + w + 3 + off; xx++) { const rib = ((xx - x - off) % 5) === 0; put(pb, xx, yb - h - 1 - r, r === d - 1 ? U('#fbc371') : rib ? Rf[3] : Rf[r < 4 ? 6 : 5]); } }
    for (let xx = x - 3; xx < x + w + 3; xx++) { put(pb, xx, yb - h, U('#fbc371')); put(pb, xx, yb - h + 1, Rf[1]); }
    for (let r = 0; r < d; r++) put(pb, x + w + 3 + Math.round(r * sk), yb - h - 1 - r, Rf[0]);
    // banda de sombra bajo el alero (3 px) sobre la fachada
    for (let k = 0; k < 3; k++) for (let xx = x; xx < x + w; xx++) { const c = get(pb, xx, yb - h + 2 + k); if (c >>> 24) put(pb, xx, yb - h + 2 + k, K.mixU(c, U('#2a1c4a'), 0.45 - k * 0.12)); }
    // rótulo y lámpara
    if (o.label) { const tw = K.measure(o.label, { font: 'tiny' }); rect(pb, x + 4, yb - h + 6, tw + 4, 8, U('#0a1a34')); K.text(pb, o.label, x + 6, yb - h + 7, U('#ffe14d'), { font: 'tiny' }); }
    return { lamp: [dx0 + Math.round(dw / 2), yb - dh + 3], door: [dx0, yb - dh, dw, dh], roof: [x, yb - h - d, w + dx, d] };
  }
  /** Raíces que bajan por el corte */
  function roots(pb, x, y0, len, seed = 1, col = '#5a3418') {
    const r = RNG(seed);
    const grow = (xx, yy, a, L, wdt) => { for (let k = 0; k < L; k++) { xx += Math.cos(a) * 0.6; yy += 1; a += (r() - 0.5) * 0.5; put(pb, Math.round(xx), Math.round(yy), U(col)); if (wdt > 1) put(pb, Math.round(xx) + 1, Math.round(yy), U('#3a1e0c')); if (L > 8 && r() < 0.08) grow(xx, yy, a + (r() < 0.5 ? -0.8 : 0.8), Math.round(L * 0.4), 1); } };
    grow(x, y0, Math.PI / 2 + (r() - 0.5) * 0.6, len, 2);
  }

  PFTerrain.register('track', { surf: trackSurf, depth: 16, flat: false });
  PFTerrain.register('sandcut', { face: sandCut, prep: PFTerrain.EXT.prep.dune });
  PFTerrain.register('r3tier', { face: r3Face, prep: r3Prep });

  return { pvTable, tracker, inverter, workshop, kiosk, transformerBig, meteo, sandFence, cactus, opuntia, dryBush, stones, fence, robot, waterTank, decorateDunes, powerLine, windPump, outcrop, desertCluster, tireTracks, CELL, ALU, STUC, CACT, DRYB, GRAV,
    // r3-desert: diorama de la ladera
    r3At, r3Shadow, r3VaultE1, r3VaultWall, tabaiba, cardon, grassWind, cropRow, agriPV, invSkid, robotRail, canal, cableTray, trenchPit, trenchSection, pipeSection, roots, basin, zoco, dryWall, strawGrid, hubara, substation, hangar, cableDrum, modulePallet, shadeHouse, R3TAB, R3LET, R3ALOE, R3SOIL, R3WAT, R3GH, R3CONW };
})();
