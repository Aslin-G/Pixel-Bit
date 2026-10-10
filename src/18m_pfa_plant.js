/* =====================================================================
   18m_pfa_plant.js — Equipos industriales del plano jugable (kit PF,
   rollout A) a escala de personaje ≈ 74 px: planta de ósmosis inversa,
   salas técnicas, pasarelas y oclusores frontales de interior.
   Todo en 3/4 con cara superior, rampas de material con desplazamiento
   de tono, contorno selectivo (sprite + PFK.selOut), franja especular
   en metales, sombra proyectada (luz arriba-izquierda) y de contacto.
   Coordenadas: (x, yb) = esquina frontal izquierda sobre el suelo
   salvo que se indique "cx" (centro).
   API (PFAPlant):
     vesselH(pb,x0,x1,cy,r,{ramp,cap,dark,port})      recipiente a presión horizontal
     roRack(pb,x,yb,{len,rows,r,isolated,seed}) → {top,perm:[[x,y]..],leds:[{x,y,col}],ends:[xl,xr]}
     cartridge(pb,cx,yb,{r,h}) → {inY,outY,top}         carcasa de filtro de cartucho
     pumpSkid(pb,x,yb,{len,motor}) → {dis:[x,y],led:[x,y]}  bomba multietapa + motor en patín
     erd(pb,x,yb) → {rotor:[x,y],leds}                  intercambiador de presión rotativo
     tankV(pb,cx,yb,r,h,{ramp,band,legs,ladder,rail,plate,glass,manway}) → {top,glass:[x,y,w,h]}
     catwalk(pb,x0,x1,y,floorY,{d,span,rail}) → {deckY}  pasarela de rejilla en 3/4
     landing(pb,x,y,w,floorY,{d})                       descansillo sobre patas
     pipeDeck(pb,x0,x1,yTop,floorY)                     tubo grueso transitable con sillas
     controlRoom(pb,x,yF,w,{ceil}) → {screens:[[x,y,w,h]],lamps:[[x,y]],mimic:[x,y,w,h]}
     cabinets(pb,x,yb,n,{w,h,d,ramp,seed}) → {leds:[{x,y,col}],screens}
     rackCab(pb,x,yb,w,h) → {leds:[{x,y,col}],beacon:[x,y]}
     rollDoor(pb,x,yb,w,h,{open,glow}) → {mouth:[x,y,w,h]}
     dosing(pb,x,yb,{col,label}) → {level:[x,y,w,h]}
     analyzers(pb,x,yb,w) → {screens:[[x,y,w,h]]}
     pallet(pb,x,yb,{n,label})  · extinguisher(pb,x,yb) · eyewash(pb,x,yb)
     sign(pb,x,y,kind)  kind: warn|bolt|ear|helmet|goggles|exit|first
     tray(pb,x0,x1,y)   bandeja de cables con soportes colgantes
     stencil(pb,x,y,text,col)  rótulo pintado en el suelo (3/4 achatado)
   Oclusores frontales registrados en PFStage.FG: 'aColumn', 'aPipes', 'aChain'.
   Sin tramado.
   ===================================================================== */
const PFAPlant = (() => {
  const K = PFK, put = K.put, get = K.get, P32 = K.P32, A = PFArch, I = PFInfra;
  const STEEL = I.STEEL;
  const FRAME = ['#080c16', '#111827', '#1a2336', '#26324c', '#354564', '#485c80', '#6478a0', '#94a8c8'];
  const FRP = ['#262c3a', '#3e4656', '#5c6474', '#7e8696', '#a2a8b6', '#c2c6d0', '#dcdee4', '#eef0f4', '#ffffff'];
  const CAP = ['#06142c', '#0c2650', '#143a78', '#1e52a2', '#2c6cc6', '#4a8ee2', '#82b6f4'];
  const GREEN = ['#06221a', '#0c3a28', '#145438', '#1e6e4a', '#2a8a5e', '#42a676', '#72c69a', '#b0e8cc'];
  const BLUEP = ['#081432', '#0e2456', '#16367a', '#204ca0', '#3064c2', '#4c84da', '#80aeee', '#c0dafc'];
  const YEL = ['#3a2604', '#6e4c0c', '#a87414', '#d89a1c', '#f0bc2c', '#fcd856', '#fff2a8'];
  const RED = ['#2a0608', '#560c12', '#8a1620', '#bc2430', '#e2404a', '#f87a7a', '#ffc0b8'];
  const NAVY = ['#03060e', '#060c1a', '#0a1428', '#101e3a', '#18304e', '#244466', '#345e84'];
  const WALLW = ['#4a5060', '#6a7080', '#8c92a0', '#aeb2bc', '#c8ccd2', '#dcdee2', '#eceef0', '#f8f8fa'];
  const CONC = PFTerrain.CONC;
  const HDPE = ['#4a4a40', '#6e6c5e', '#96927e', '#bcb69c', '#dad4b8', '#eee8d2', '#fbf8ec'];
  const CARD = ['#3a2410', '#5c3a1a', '#7e5428', '#a07038', '#bc8c4c', '#d4aa6a', '#e8c890'];

  /* ---------- utilidades ---------- */
  /** Perfil de luz de un cilindro iluminado arriba-izquierda (f 0..1 a lo ancho) → índice de rampa de n tonos */
  const prof = (f) => f < 0.07 ? 0.34 : f < 0.17 ? 0.74 : f < 0.28 ? 1 : f < 0.4 ? 0.86 : f < 0.58 ? 0.62 : f < 0.76 ? 0.48 : f < 0.9 ? 0.2 : 0.34;
  const ti = (f, n) => clamp(Math.round(prof(f) * (n - 1)), 0, n - 1);
  const darkR = (R, k, hue = 228) => k ? R.map(u => K.shU(u, -k, hue)) : R;
  function rect(pb, x, y, w, h, u) { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) put(pb, xx, yy, u); }
  function hline(pb, x0, x1, y, u) { for (let x = x0; x <= x1; x++) put(pb, x, y, u); }
  function vline(pb, x, y0, y1, u) { for (let y = y0; y <= y1; y++) put(pb, x, y, u); }
  /** Oscurece lo ya pintado en un rectángulo */
  function shade(pb, x, y, w, h, k = -0.2, hue = 228) { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) { const c = get(pb, xx, yy); if (c >>> 24) put(pb, xx, yy, K.shU(c, k, hue)); } }
  /** Montante en I visto de frente: ala iluminada, alma, ala en sombra (w ≥ 4) */
  function column(pb, x, y0, y1, w = 5, R = FRAME, o = {}) {
    const C = P32(R), n = C.length;
    for (let y = y0; y < y1; y++) for (let i = 0; i < w; i++) {
      const k = i === 0 ? n - 2 : i === 1 ? n - 1 : i === w - 1 ? 1 : i === w - 2 ? 3 : 4;
      put(pb, x + i, y, C[clamp(k - (o.dk || 0), 0, n - 1)]);
    }
    if (o.bolts !== false) for (let y = y0 + 4; y < y1 - 2; y += o.bolt || 14) { put(pb, x + 1, y, C[n - 1]); put(pb, x + w - 2, y, C[0]); }
  }
  /** Viga horizontal con canto superior iluminado */
  function beam(pb, x0, x1, y, h = 4, R = FRAME, o = {}) {
    const C = P32(R), n = C.length;
    for (let yy = 0; yy < h; yy++) for (let x = x0; x <= x1; x++) {
      let k = yy === 0 ? n - 1 : yy === 1 ? n - 3 : yy === h - 1 ? 0 : 3;
      if (o.rivets && yy === Math.floor(h / 2) && (x - x0) % 8 === 3) k = n - 2;
      put(pb, x, y + yy, C[k]);
    }
  }
  /** Brida circular (vista lateral) con pernos */
  function boltRing(pb, cx, cy, r, R = STEEL) { const C = P32(R); K.ellipseFn(pb, cx, cy, r + 0.5, r + 0.5, (nx, ny, d) => d > 0.62 ? C[nx + ny < 0 ? 6 : 2] : 0); for (let a = 0; a < 6; a++) put(pb, Math.round(cx + Math.cos(a * 1.047) * r), Math.round(cy + Math.sin(a * 1.047) * r), C[0]); }

  /* ---------- recipiente a presión horizontal ---------- */
  function vesselH(pb, x0, x1, cy, r, o = {}) {
    const F = darkR(P32(o.ramp || FRP), o.dark || 0), C = darkR(P32(o.cap || CAP), o.dark || 0), n = F.length, nc = C.length;
    const t = 2 * r + 1, L = x1 - x0;
    // perfil de recipiente: canto superior, luz, especular casi blanco, medios, sombra de núcleo marcada y luz reflejada
    const vk = (f, m) => clamp(Math.round((f < 0.08 ? 0.3 : f < 0.18 ? 0.72 : f < 0.3 ? 1 : f < 0.42 ? 0.84 : f < 0.55 ? 0.62 : f < 0.68 ? 0.46 : f < 0.8 ? 0.3 : f < 0.9 ? 0.1 : 0.22) * (m - 1)), 0, m - 1);
    for (let j = 0; j < t; j++) {
      const f = j / (t - 1), k = vk(f, n), kc = vk(f, nc);
      for (let x = x0 + 2; x <= x1 - 2; x++) {
        const e = Math.min(x - x0, x1 - x);
        let u = F[k];
        if (e >= 4 && e <= 6) u = C[clamp(kc - (e === 6 ? 1 : 0), 0, nc - 1)];           // anillo de retención azul
        else if (Math.abs(x - x0 - Math.round(L * 0.33)) <= 1 || Math.abs(x - x0 - Math.round(L * 0.67)) <= 1) u = F[clamp(k - 2, 0, n - 1)]; // abrazaderas
        else if (k >= n - 2 && ((x * 7 + j * 3) % 23 === 0)) u = F[n - 2];
        put(pb, x, cy - r + j, u);
      }
    }
    // tapas abombadas azules
    K.ellipseFn(pb, x0 + 2, cy, Math.max(2, r * 0.62), r + 0.45, (nx, ny) => nx > 0.1 ? 0 : C[clamp(Math.round(nc * 0.62 - ny * 2.2 - nx * 1.2), 1, nc - 1)]);
    K.ellipseFn(pb, x1 - 2, cy, Math.max(2, r * 0.62), r + 0.45, (nx, ny) => nx < -0.1 ? 0 : C[clamp(Math.round(nc * 0.45 - ny * 2 - nx * 0.8), 0, nc - 2)]);
    // puerto de permeado (cian) en la tapa derecha y tomas superiores de alimentación/concentrado
    if (o.port !== false) { put(pb, x1 + 1, cy, U('#48d4f0')); put(pb, x1 + 2, cy, U('#d0f4f8')); put(pb, x1 + 1, cy + 1, U('#106a8a')); put(pb, x1 + 2, cy + 1, U('#1ebde3')); }
    for (const sx of [x0 + 8, x1 - 8]) { put(pb, sx, cy - r - 1, F[n - 3]); put(pb, sx + 1, cy - r - 1, F[3]); }
  }

  /* ---------- bastidor de OI (tren de membranas) ---------- */
  function roRack(pb, x, yb, o = {}) {
    const len = o.len ?? 112, rows = o.rows ?? 4, r = o.r ?? 5, pitch = 2 * r + 3, base = 7;
    const Hh = rows * pitch + base + 5, dx = 6, dy = 5, X0 = 17;
    const SW = X0 + len + dx + 30, SH = Hh + dy + 8, yB = SH - 2;
    const leds = [], perm = [];
    const PR = P32(I.PIPES.product.ramp), PRE = P32(I.PIPES.pre.ramp), BR = P32(I.PIPES.brine.ramp);
    const iso = !!o.isolated;
    A.castShadow(pb, x - 4, yb, len + 26, 10, -0.24);
    const s = A.spr(SW, SH, (q) => {
      const vy = (i, back) => yB - base - r - 2 - i * pitch - (back ? dy : 0);
      const topY = vy(rows - 1, 0) - r - 2;
      // montantes traseros
      for (const ux of [X0 + 4 + dx, X0 + len - 8 + dx]) column(q, ux, topY - dy - 2, yB - base, 4, FRAME, { dk: 2, bolts: false });
      // columna trasera de recipientes (más oscura)
      for (let i = 0; i < rows; i++) vesselH(q, X0 + dx, X0 + dx + len, vy(i, 1), r, { dark: 0.42, port: false });
      // carril superior trasero
      beam(q, X0 - 2 + dx, X0 + len + 6 + dx, topY - dy - 3, 3, FRAME);
      // columna delantera
      for (let i = 0; i < rows; i++) { vesselH(q, X0, X0 + len, vy(i, 0), r, {}); hline(q, X0 + 3, X0 + len - 3, vy(i, 0) + r + 1, P32(FRAME)[0]); }
      // cara superior del bastidor (3/4): parrilla entre carriles
      for (let rr = 0; rr <= dy; rr++) { const yy = topY - rr, off = Math.round(rr * (dx / dy)); for (let xx = X0 - 2 + off; xx <= X0 + len + 6 + off; xx++) put(q, xx, yy, P32(FRAME)[rr === 0 ? 7 : (xx % 6 === 0 ? 2 : rr === dy ? 6 : 4)]); }
      // montantes delanteros en I con abrazaderas sobre cada recipiente
      for (const ux of [X0 + 4, X0 + Math.round(len / 2) - 2, X0 + len - 8]) {
        column(q, ux, topY, yB - base + 1, 5, FRAME, { bolt: pitch });
        for (let i = 0; i < rows; i++) { const cy = vy(i, 0); hline(q, ux - 2, ux + 6, cy - r, P32(FRAME)[6]); hline(q, ux - 2, ux + 6, cy + r, P32(FRAME)[1]); }
      }
      // bancada inferior en 3/4
      I.box3q(q, X0 - 6, yB, len + 26, base, 6, { ramp: FRAME, skew: 0.9 });
      for (let xx = X0; xx < X0 + len + 18; xx += 16) { put(q, xx, yB - 3, P32(FRAME)[7]); put(q, xx + 1, yB - 3, P32(FRAME)[1]); }
      // colector de alimentación (izquierda, acero-azul) con ramales a cada tapa
      const fx = X0 - 10;
      for (let yy = topY + 2; yy <= yB - base; yy++) for (let i = 0; i < 5; i++) put(q, fx + i, yy, PRE[ti(i / 4, PRE.length)]);
      for (let i = 0; i < rows; i++) { const cy = vy(i, 0); for (let xx = fx + 5; xx < X0 + 1; xx++) { put(q, xx, cy - 1, PRE[5]); put(q, xx, cy, PRE[3]); put(q, xx, cy + 1, PRE[1]); } }
      // colector de concentrado (grafito) y de permeado (cian brillante) a la derecha
      const cx = X0 + len + 6, px = X0 + len + 13;
      for (let yy = topY - 2; yy <= yB - base; yy++) {
        for (let i = 0; i < 4; i++) put(q, cx + i, yy, BR[[5, 4, 2, 1][i]]);
        for (let i = 0; i < 4; i++) put(q, px + i, yy, iso ? PRE[[5, 4, 2, 1][i]] : PR[[6, 5, 3, 1][i]]);
      }
      for (let i = 0; i < rows; i++) {
        const cy = vy(i, 0);
        for (let xx = X0 + len + 3; xx < px; xx++) { put(q, xx, cy, iso ? PRE[4] : PR[5]); put(q, xx, cy + 1, iso ? PRE[2] : PR[2]); }
        put(q, cx + 1, cy - 2, BR[6]); put(q, cx + 2, cy - 2, BR[3]);
        boltRing(q, px + 1.5, cy + 0.5, 2, STEEL);
      }
      // válvulas en cabeza de cada colector y manómetro
      for (const vx of [fx + 2, cx + 1, px + 1]) { rect(q, vx - 2, topY - 1, 6, 3, P32(STEEL)[2]); hline(q, vx - 3, vx + 4, topY - 4, P32(RED)[4]); vline(q, vx + 1, topY - 4, topY - 1, P32(STEEL)[1]); }
      K.ellipseFn(q, fx + 2.5, topY + 12, 3.2, 3.2, (nx, ny, d) => d > 0.6 ? P32(STEEL)[1] : (Math.abs(nx + ny * 0.6) < 0.18 && ny < 0.2 ? U('#e2404a') : U('#f4f6f2')));
      // armario local con LED
      I.box3q(q, X0 + Math.round(len / 2) + 6, yB - base - 8, 12, 14, 3, { ramp: STEEL, skew: 0.9 });
      rect(q, X0 + Math.round(len / 2) + 8, yB - base - 19, 7, 4, U('#06122a'));
      leds.push({ x: X0 + Math.round(len / 2) + 9, y: yB - base - 13, col: iso ? '#ff4e5d' : '#3fe0a0', hz: iso ? 2.2 : 1, ph: x * 0.01 }, { x: X0 + Math.round(len / 2) + 12, y: yB - base - 13, col: '#ffd84a', hz: 0.6, ph: 0.3 });
      // placa del tren
      if (o.tag) { const tw = K.measure(o.tag, { font: 'tiny' }) + 6, tx = X0 + 18; rect(q, tx, yB - base - 12, tw, 8, U(iso ? '#8a1620' : '#0c2650')); hline(q, tx, tx + tw - 1, yB - base - 12, U(iso ? '#f87a7a' : '#82b6f4')); K.text(q, o.tag, tx + 3, yB - base - 10, U('#ffffff'), { font: 'tiny' }); }
      // bloqueo: etiquetas rojas y candados en el tren aislado
      if (iso) for (let i = 0; i < rows; i++) { const ty = vy(i, 0) - 2, tx = fx + 1; rect(q, tx - 1, ty + 2, 4, 6, P32(RED)[4]); put(q, tx, ty + 3, U('#ffffff')); put(q, tx + 1, ty + 4, U('#ffffff')); put(q, tx + 1, ty + 1, P32(STEEL)[5]); }
      perm.push(px + 1, topY - 2, yB - base);
    });
    const sx = x - X0, sy = yb - SH + 2;
    A.place(pb, s, sx, sy);
    A.contact(pb, x - 6, x + len + 20, yb, -0.35);
    return { top: sy + 2, perm: [[sx + perm[0], sy + perm[2]], [sx + perm[0], sy + perm[1]]], leds: leds.map(L => Object.assign({}, L, { x: L.x + sx, y: L.y + sy })), ends: [x - 10, x + len + 17], permX: sx + perm[0] };
  }

  /* ---------- filtro de cartucho ---------- */
  function cartridge(pb, cx, yb, o = {}) {
    const r = o.r ?? 8, h = o.h ?? 46, leg = 8;
    A.castShadow(pb, cx - r, yb, 2 * r + 6, 9, -0.22);
    const W_ = 2 * r + 16, H_ = h + leg + r + 12, ox = r + 8, s = A.spr(W_, H_, (q) => {
      const yb2 = H_ - 1, ST = P32(STEEL);
      for (const lx of [ox - r + 2, ox + r - 3]) { vline(q, lx, yb2 - leg, yb2, ST[5]); vline(q, lx + 1, yb2 - leg, yb2, ST[2]); hline(q, lx - 1, lx + 2, yb2, ST[1]); }
      vline(q, ox, yb2 - leg + 2, yb2, ST[3]);
      I.cylV(q, ox, yb2 - leg, r, h, { ramp: FRP, band: CAP, bands: [{ y: h - 9, h: 3 }, { y: 6, h: 2 }], dome: 0.6, ell: 0.3 });
      // pernos de la abrazadera superior
      for (let i = -r + 2; i <= r - 2; i += 3) put(q, ox + i, yb2 - leg - h + 8, U('#d0e4fc'));
      // purga de aire sobre la cúpula
      vline(q, ox, yb2 - leg - h - Math.round(r * 0.6) - 4, yb2 - leg - h - Math.round(r * 0.6), ST[3]); hline(q, ox - 2, ox + 2, yb2 - leg - h - Math.round(r * 0.6) - 4, P32(RED)[4]);
      // tubuladuras: entrada baja a la izquierda, salida alta a la derecha
      for (let i = 0; i < 6; i++) { const yy = yb2 - leg - 8; put(q, ox - r - 1 - i, yy - 1, ST[5]); put(q, ox - r - 1 - i, yy, ST[3]); put(q, ox - r - 1 - i, yy + 1, ST[1]); }
      for (let i = 0; i < 6; i++) { const yy = yb2 - leg - h + 14; put(q, ox + r + 1 + i, yy - 1, ST[5]); put(q, ox + r + 1 + i, yy, ST[3]); put(q, ox + r + 1 + i, yy + 1, ST[1]); }
      // manómetro diferencial
      K.ellipseFn(q, ox + 0.5, yb2 - leg - h + 22.5, 3, 3, (nx, ny, d) => d > 0.55 ? ST[1] : (Math.abs(nx - ny * 0.4) < 0.2 && nx > -0.1 ? U('#e2404a') : U('#f6f8f4')));
      // placa
      rect(q, ox - 3, yb2 - leg - 18, 7, 4, U('#e8f0f8')); hline(q, ox - 3, ox + 3, yb2 - leg - 18, U('#1e52a2'));
    });
    A.place(pb, s, cx - ox, yb - H_ + 1);
    return { inY: yb - leg - 8, outY: yb - leg - h + 14, top: yb - leg - h - r };
  }

  /* ---------- bomba de alta presión multietapa con motor en patín ---------- */
  function pumpSkid(pb, x, yb, o = {}) {
    const len = o.len ?? 64, M = P32(o.motor || GREEN), nm = M.length, mr = o.mr ?? 11, pr = o.pr ?? 8;
    const ml = Math.round(len * 0.46), gw = 7, pl = Math.max(10, len - 4 - ml - gw - 2);
    const SW = len + 8, SH = 2 * mr + 34, yb2 = SH - 1, mcy = yb2 - 6 - mr - 1, mx0 = 3, mx1 = mx0 + ml, gx = mx1 + 1, px0 = gx + gw, px1 = px0 + pl, dxp = px1 - 7;
    A.castShadow(pb, x + 2, yb, len + 4, 14, -0.24);
    I.box3q(pb, x - 4, yb, len + 8, 5, 10, { ramp: CONC, skew: 0.6 });
    const s = A.spr(SW, SH, (q) => {
      const ST = P32(STEEL), F = P32(FRAME), Y = P32(YEL);
      // bancada de perfil en C
      I.box3q(q, 1, yb2, len, 5, 6, { ramp: FRAME, skew: 0.8 });
      // motor: cilindro con aletas de refrigeración
      for (let j = 0; j <= 2 * mr; j++) { const f = j / (2 * mr), k = ti(f, nm); for (let xx = mx0; xx <= mx1; xx++) put(q, xx, mcy - mr + j, ((xx - mx0) % 3 === 2 && xx > mx0 + 5 && xx < mx1 - 2 && j > 1 && j < 2 * mr - 1) ? M[clamp(k - 2, 0, nm - 1)] : M[k]); }
      // cubierta del ventilador con rejilla
      K.ellipseFn(q, mx0 + 1, mcy, 4, mr + 0.4, (nx, ny) => nx > 0.2 ? 0 : (Math.round((ny + 1) * 6) % 2 ? F[2] : F[5]));
      // caja de bornes, cáncamo y patas del motor
      I.box3q(q, mx0 + Math.round(ml * 0.4), mcy - mr, 11, 6, 3, { ramp: o.motor || GREEN, skew: 0.8 });
      put(q, mx0 + Math.round(ml * 0.2), mcy - mr - 2, ST[4]); put(q, mx0 + Math.round(ml * 0.2) + 1, mcy - mr - 2, ST[2]); put(q, mx0 + Math.round(ml * 0.2), mcy - mr - 1, ST[2]);
      for (const lx of [mx0 + 5, mx1 - 7]) rect(q, lx, mcy + mr, 5, yb2 - 5 - mcy - mr, M[1]);
      rect(q, mx0 + 7, mcy + 2, 10, 5, U('#e8f0f8')); hline(q, mx0 + 7, mx0 + 16, mcy + 2, U('#a8a8a8')); hline(q, mx0 + 8, mx0 + 14, mcy + 4, U('#5c6474'));
      // acoplamiento (guarda amarilla con rejilla)
      for (let yy = mcy - 6; yy <= mcy + 6; yy++) for (let xx = gx; xx < gx + gw; xx++) put(q, xx, yy, Y[yy === mcy - 6 ? 6 : yy === mcy + 6 ? 1 : (xx - gx + yy) % 3 === 0 ? 2 : 4]);
      // bomba: carcasa multietapa de acero con anillos de etapa y tirantes
      for (let j = 0; j <= 2 * pr; j++) { const f = j / (2 * pr), k = ti(f, ST.length); for (let xx = px0; xx <= px1; xx++) put(q, xx, mcy - pr + j, ((xx - px0) % 5 === 0) ? ST[clamp(k - 2, 0, 7)] : ST[k]); }
      for (const ty of [mcy - pr + 1, mcy + pr - 1]) hline(q, px0, px1, ty, ST[1]);
      boltRing(q, px1, mcy, pr, STEEL);
      boltRing(q, px0, mcy, pr - 1, STEEL);
      // aspiración (abajo) y descarga (arriba, con válvula de retención, brida y manómetro)
      for (let yy = mcy + pr; yy < yb2 - 5; yy++) for (let i = 0; i < 5; i++) put(q, px0 + 3 + i, yy, P32(I.PIPES.pre.ramp)[ti(i / 4, 7)]);
      for (let yy = 1; yy < mcy - pr; yy++) for (let i = 0; i < 6; i++) put(q, dxp + i, yy, ST[ti(i / 5, 8)]);
      rect(q, dxp - 1, Math.round((mcy - pr) * 0.45), 8, 5, P32(BLUEP)[3]); hline(q, dxp - 1, dxp + 6, Math.round((mcy - pr) * 0.45), P32(BLUEP)[6]);
      for (const fy of [3, mcy - pr - 2]) { hline(q, dxp - 1, dxp + 6, fy, ST[6]); hline(q, dxp - 1, dxp + 6, fy + 1, ST[1]); }
      K.ellipseFn(q, dxp - 4.5, 8.5, 3.6, 3.6, (nx, ny, d) => d > 0.55 ? ST[1] : (Math.abs(nx + ny) < 0.22 && ny < 0.1 ? U('#e2404a') : U('#f6f8f4')));
      hline(q, dxp - 2, dxp, 9, ST[2]);
    });
    A.place(pb, s, x - 2, yb - 5 - SH + 1);
    return { dis: [x - 2 + dxp + 2, yb - 5 - SH + 2], led: [x + mx0 + Math.round(ml * 0.4) + 2, yb - 5 - SH + 1 + mcy - mr - 4] };
  }

  /* ---------- recuperador de energía (intercambiador de presión rotativo) ---------- */
  function erd(pb, x, yb, o = {}) {
    A.castShadow(pb, x, yb, 50, 12, -0.24);
    I.box3q(pb, x - 4, yb, 54, 5, 10, { ramp: CONC, skew: 0.6 });
    const SW = 52, SH = 62, s = A.spr(SW, SH, (q) => {
      const yb2 = SH - 1, F = P32(FRAME), ST = P32(STEEL), BR = P32(I.PIPES.brine.ramp), PRE = P32(I.PIPES.pre.ramp);
      // bastidor
      for (const ux of [2, SW - 7]) column(q, ux, 8, yb2, 5, FRAME, { bolt: 10 });
      beam(q, 0, SW - 1, 6, 3, FRAME); beam(q, 0, SW - 1, yb2 - 4, 4, FRAME);
      // dos recipientes PX horizontales (cerámica en acero) con tapas azules
      vesselH(q, 4, SW - 5, 14, 4, { port: false }); vesselH(q, 4, SW - 5, 46, 4, { port: false });
      // carcasa central con ventana de inspección del rotor (el rotor se anima por cuadro)
      K.ellipseFn(q, 26, 30, 12.5, 12.5, (nx, ny, d) => d > 0.8 ? ST[nx + ny < 0 ? 6 : 1] : d > 0.62 ? ST[nx + ny < 0 ? 5 : 2] : U('#0a1428'));
      for (let a = 0; a < 8; a++) put(q, Math.round(26 + Math.cos(a * 0.785) * 11), Math.round(30 + Math.sin(a * 0.785) * 11), ST[0]);
      // puertos: salmuera AP entra (grafito), salmuera BP sale; agua de mar BP entra, AP sale (acero-azul)
      for (let yy = 0; yy < 8; yy++) for (let i = 0; i < 4; i++) { put(q, 9 + i, yy, BR[[5, 4, 2, 1][i]]); put(q, 39 + i, yy, PRE[[5, 4, 2, 1][i]]); }
      for (let yy = 50; yy < yb2 - 4; yy++) for (let i = 0; i < 4; i++) { put(q, 9 + i, yy, BR[[4, 3, 2, 1][i]]); put(q, 39 + i, yy, PRE[[5, 3, 2, 1][i]]); }
      // flechas pintadas de sentido de flujo
      for (const [ax, col] of [[14, '#e07ecf'], [36, '#9cd0ff']]) { put(q, ax, 2, U(col)); put(q, ax - 1, 1, U(col)); put(q, ax + 1, 1, U(col)); }
      rect(q, 19, 50, 14, 5, U('#e8f0f8')); K.text(q, 'PX', 21, 50, U('#1e52a2'), { font: 'tiny' });
    });
    A.place(pb, s, x, yb - 5 - SH + 1);
    return { rotor: [x + 26, yb - 5 - SH + 1 + 30], leds: [{ x: x + 44, y: yb - 14, col: '#3fe0a0', hz: 1.2 }] };
  }

  /* ---------- tanque vertical con detalles ---------- */
  function tankV(pb, cx, yb, r, h, o = {}) {
    const legs = o.legs ?? 6, ST = P32(STEEL);
    A.castShadow(pb, cx - r, yb, 2 * r + 8, Math.min(18, r + 6), -0.24);
    if (o.pad !== false) I.box3q(pb, cx - r - 4, yb, 2 * r + 8, 4, 8, { ramp: CONC, skew: 0.6 });
    const yb0 = yb - (o.pad !== false ? 4 : 0);
    const SW = 2 * r + 20, SH = h + legs + Math.round(r * 0.7) + 16, ox = r + 6, s = A.spr(SW, SH, (q) => {
      const y2 = SH - 1, yBody = y2 - legs;
      if (legs) for (const lx of [ox - r + 1, ox - 2, ox + r - 4]) { vline(q, lx, yBody - 2, y2, ST[5]); vline(q, lx + 1, yBody - 2, y2, ST[2]); vline(q, lx + 2, yBody - 2, y2, ST[1]); hline(q, lx - 1, lx + 3, y2, ST[0]); }
      const body = I.cylV(q, ox, yBody, r, h, { ramp: o.ramp || FRP, band: o.band || CAP, bands: o.bands || [{ y: Math.round(h * 0.2), h: 3 }, { y: Math.round(h * 0.78), h: 2 }], dome: o.dome ?? 0.45, ell: 0.3 });
      // boca de hombre con pernos
      if (o.manway !== false) { const my = yBody - Math.round(h * 0.3), mx = ox - Math.round(r * 0.25); K.ellipseFn(q, mx + 0.5, my + 0.5, 4.5, 5, (nx, ny, d) => d > 0.55 ? ST[nx + ny < 0 ? 6 : 2] : ST[nx + ny < 0 ? 4 : 3]); for (let a = 0; a < 6; a++) put(q, Math.round(mx + 0.5 + Math.cos(a * 1.05) * 3.6), Math.round(my + 0.5 + Math.sin(a * 1.05) * 4), ST[0]); }
      // mirilla de nivel (vidrio vertical; el agua se pinta por cuadro)
      if (o.glass) { const gx = ox - r + 3, g0 = yBody - h + 8, g1 = yBody - 6; for (let y = g0; y <= g1; y++) { put(q, gx - 1, y, ST[1]); put(q, gx, y, U('#123048')); put(q, gx + 1, y, U('#1a4a66')); put(q, gx + 2, y, ST[1]); } }
      // escalera con jaula
      if (o.ladder) { const lx = ox + r + 1; for (let y = yBody - h - 2; y < y2; y++) { put(q, lx, y, ST[4]); put(q, lx + 4, y, ST[2]); if (y % 3 === 0) hline(q, lx + 1, lx + 3, y, ST[5]); } for (let y = yBody - h + 6; y < yBody - 14; y += 7) { hline(q, lx - 1, lx + 6, y, P32(YEL)[4]); put(q, lx + 6, y + 1, P32(YEL)[2]); } for (let y = yBody - h + 6; y < yBody - 14; y++) put(q, lx + 6, y, P32(YEL)[3]); }
      // barandilla superior
      if (o.rail) { const ty = body.top - 6; for (let xx = ox - r - 1; xx <= ox + r + 1; xx++) { put(q, xx, ty, P32(YEL)[5]); put(q, xx, ty + 3, P32(YEL)[3]); } for (const px of [ox - r - 1, ox, ox + r + 1]) vline(q, px, ty, body.top + 2, P32(YEL)[2]); }
      // placa
      if (o.plate) { const pw = K.measure(o.plate, { font: 'tiny' }) + 4, px = ox - Math.round(pw / 2), py = yBody - Math.round(h * 0.6); rect(q, px, py, pw, 7, U(o.plateBg || '#e8f0f8')); hline(q, px, px + pw - 1, py, U('#ffffff')); K.text(q, o.plate, px + 2, py + 1, U(o.plateCol || '#143a78'), { font: 'tiny' }); }
    });
    const sx = cx - ox, sy = yb0 - SH + 1;
    A.place(pb, s, sx, sy);
    const g0 = sy + SH - 1 - legs - h + 8, g1 = sy + SH - 1 - legs - 6;
    return { top: sy + SH - 1 - legs - h - Math.round(r * 0.45), glass: o.glass ? [sx + ox - r + 3, g0, 2, g1 - g0 + 1] : null, x: sx, y: sy };
  }

  /* ---------- pasarela de rejilla en 3/4 ---------- */
  function catwalk(pb, x0, x1, y, floorY, o = {}) {
    const d = o.d ?? 9, span = o.span ?? 96, ST = P32(STEEL), F = P32(FRAME), Y = P32(YEL), sk = 0.7;
    // columnas de apoyo con tornapuntas
    for (let cx = x0 + 10; cx < x1 - 4; cx += span) {
      A.castShadow(pb, cx, floorY - 2, 6, 6, -0.2);
      column(pb, cx, y + 6, floorY - 2, 5, FRAME, { bolt: 16 });
      rect(pb, cx - 2, floorY - 3, 9, 2, F[2]);
      for (let k = 0; k < 14; k++) { put(pb, cx + 5 + k, y + 7 + k, F[4]); put(pb, cx - 1 - k, y + 7 + k, F[4]); }
    }
    // cara superior de rejilla (parallelogramo hacia arriba-derecha)
    for (let r = 0; r < d; r++) {
      const yy = y - 1 - r, off = Math.round(r * sk);
      for (let x = x0 + off; x < x1 + off; x++) {
        let u = (x % 3 === 0 || r % 2 === 1) ? F[2] : ST[r < 2 ? 6 : 5 - (r > d - 3 ? 1 : 0)];
        if (r === 0) u = ST[7];
        if (r === d - 1) u = F[5];
        put(pb, x, yy, u);
      }
    }
    // canto frontal: chapa con franja de seguridad y perfil en C
    for (let x = x0; x < x1; x++) { put(pb, x, y, ST[6]); put(pb, x, y + 1, ((x >> 2) & 1) ? Y[4] : U('#1c1c24')); put(pb, x, y + 2, ((x >> 2) & 1) ? Y[2] : U('#101016')); put(pb, x, y + 3, F[3]); put(pb, x, y + 4, F[1]); put(pb, x, y + 5, F[0]); }
    // canto lateral derecho
    for (let r = 0; r < d; r++) { const off = Math.round(r * sk); for (let k = 0; k < 5; k++) put(pb, x1 + off, y - r + k, F[2]); }
    // barandilla trasera (≈ 30 px): postes, pasamanos, listón medio y rodapié
    if (o.rail !== false) {
      const yb = y - d, top = yb - (o.railH ?? 30), off = Math.round(d * sk);
      for (let x = x0 + off; x < x1 + off; x++) { put(pb, x, top, Y[6]); put(pb, x, top + 1, Y[3]); put(pb, x, top + 2, Y[1]); put(pb, x, top + 15, Y[4]); put(pb, x, top + 16, Y[2]); for (let k = 0; k < 4; k++) put(pb, x, yb - 4 + k, k === 0 ? Y[5] : Y[3 - (k > 2 ? 1 : 0)]); }
      for (let x = x0 + off; x < x1 + off; x += 24) { vline(pb, x, top, yb, Y[5]); vline(pb, x + 1, top, yb, Y[2]); }
      vline(pb, x1 + off - 1, top, yb, Y[5]);
      // barandillas laterales en los extremos (diagonal de la cara superior)
      for (const ex of [x0, x1 - 1]) for (let r = 0; r <= d; r++) { const xx = ex + Math.round(r * sk); put(pb, xx, top + d - r, Y[5]); put(pb, xx, top + d - r + 15, Y[3]); }
    }
    // sombra bajo la pasarela
    shade(pb, x0, y + 6, x1 - x0, 3, -0.22);
    return { deckY: y };
  }
  /** Descansillo pequeño sobre patas */
  function landing(pb, x, y, w, floorY, o = {}) {
    const F = P32(FRAME);
    for (const lx of [x + 3, x + w - 7]) { column(pb, lx, y + 5, floorY - 2, 4, FRAME, { bolts: false }); rect(pb, lx - 2, floorY - 3, 8, 2, F[2]); }
    for (let k = 0; k < w - 14; k++) put(pb, x + 7 + k, y + 8 + Math.round(k * ((floorY - y - 14) / Math.max(1, w - 14))), F[4]);
    catwalk(pb, x, x + w, y, floorY, { d: o.d ?? 7, span: 9999, railH: o.railH ?? 28, rail: o.rail });
  }
  /** Tubo grueso transitable sobre sillas de hormigón */
  function pipeDeck(pb, x0, x1, yTop, floorY, kind = 'pre') {
    const r = 6, cy = yTop + r, P = P32(I.PIPES[kind].ramp), n = P.length;
    for (let cx = x0 + 8; cx < x1 - 4; cx += 22) { A.castShadow(pb, cx - 3, floorY - 2, 10, 5, -0.2); I.box3q(pb, cx - 4, floorY - 2, 10, floorY - 2 - cy - 2, 4, { ramp: CONC, skew: 0.7 }); }
    for (let j = 0; j <= 2 * r; j++) { const f = j / (2 * r), k = ti(f, n); for (let x = x0; x <= x1; x++) put(pb, x, cy - r + j, P[k]); }
    for (const fx of [x0, x1]) boltRing(pb, fx, cy, r, STEEL);
    for (let fx = x0 + 18; fx < x1 - 6; fx += 18) for (let j = -1; j <= 2 * r + 1; j++) { put(pb, fx, cy - r + j, P[n - 2]); put(pb, fx + 1, cy - r + j, P[1]); }
    hline(pb, x0, x1, cy - r - 1, U(I.PIPES[kind].ink));
  }

  /* ---------- sala de control elevada (corte tipo casa de muñecas) ---------- */
  function controlRoom(pb, x, yF, w, o = {}) {
    const ceil = o.ceil ?? yF - 112, floorY = o.floorY ?? 290, WL = P32(WALLW), F = P32(FRAME), ST = P32(STEEL), N = P32(NAVY);
    const screens = [], lamps = [];
    // columnas de apoyo hasta el suelo de la nave
    for (const cx of [x + 2, x + Math.round(w / 2) - 3, x + w - 8]) { A.castShadow(pb, cx, floorY - 2, 7, 6, -0.2); column(pb, cx, yF + 7, floorY - 2, 6, FRAME, { bolt: 12 }); rect(pb, cx - 2, floorY - 3, 10, 2, F[2]); }
    // muro del fondo: paneles claros con ventanal corrido (vidrio translúcido sobre el panorama)
    for (let yy = ceil + 8; yy < yF - 8; yy++) for (let xx = x; xx < x + w; xx++) {
      const ly = yy - ceil - 8;
      const winTop = 12, winBot = 52, bay = 46, lx = (xx - x - 6 + 4600) % bay;
      const inWin = ly >= winTop && ly < winBot && lx > 2 && lx < bay - 2 && xx > x + 6 && xx < x + w - 6;
      if (inWin) { const k = (ly - winTop) / (winBot - winTop); K.blend(pb, xx, yy, U(k < 0.15 ? '#cfefff' : '#8ad0f0'), 0.22 + (lx < 8 && ly - winTop < 14 - lx ? 0.25 : 0)); continue; }
      let k = 5 - (ly > winBot + 2 ? 1 : 0) - ((xx - x) % 23 === 0 ? 2 : 0) + (ly === winTop - 1 || ly === winBot ? 2 : 0);
      if (lx <= 2 && ly >= winTop - 1 && ly <= winBot) k = lx === 1 ? 2 : 4;
      if (ly < 3) k = 3;
      put(pb, xx, yy, WL[clamp(k, 0, 7)]);
    }
    // franja inferior del muro (zócalo azul) y canaleta de cables
    for (let xx = x; xx < x + w; xx++) { for (let k = 0; k < 4; k++) put(pb, xx, yF - 12 + k, P32(CAP)[k === 0 ? 5 : 2]); put(pb, xx, yF - 9, F[1]); }
    // panel sinóptico (mimic) de la planta: OI paso a paso, en el muro
    const mx = x + Math.round(w * 0.36), my = ceil + 66, mw = Math.round(w * 0.28), mh = 22;
    rect(pb, mx - 2, my - 2, mw + 4, mh + 4, F[1]); rect(pb, mx, my, mw, mh, N[2]);
    hline(pb, mx - 2, mx + mw + 1, my - 2, F[5]);
    const seg = [[0, 0.22, '#11bedd'], [0.22, 0.5, '#7aaad6'], [0.5, 0.78, '#48d4f0'], [0.78, 1, '#9485ac']];
    for (const [a, b, c] of seg) { hline(pb, mx + 2 + Math.round(a * (mw - 4)), mx + 2 + Math.round(b * (mw - 4)), my + 11, U(c)); }
    for (let i = 0; i < 4; i++) rect(pb, mx + 3 + Math.round(i * (mw - 10) / 3), my + 8, 5, 7, U(['#11bedd', '#7aaad6', '#48d4f0', '#c244a2'][i]));
    screens.push([mx + 2, my + 2, mw - 4, 4]);
    // monitores murales a ambos lados del sinóptico
    for (const sx of [x + 14, x + w - 52]) { rect(pb, sx - 1, ceil + 64, 40, 26, F[1]); rect(pb, sx, ceil + 65, 38, 24, U('#06122a')); hline(pb, sx - 1, sx + 38, ceil + 64, F[5]); screens.push([sx + 2, ceil + 67, 34, 20]); }
    // techo: losa con canto, luminarias lineales y cara superior en 3/4 con climatizador
    for (let xx = x - 4; xx < x + w + 4; xx++) for (let k = 0; k < 8; k++) put(pb, xx, ceil + k, k === 0 ? ST[6] : k < 3 ? ST[4] : k === 7 ? ST[0] : ST[2]);
    for (let r = 0; r < 7; r++) { const off = Math.round(r * 0.7); for (let xx = x - 4 + off; xx < x + w + 4 + off; xx++) put(pb, xx, ceil - 1 - r, r === 0 ? ST[7] : ST[5 - (r > 4 ? 1 : 0)]); }
    I.box3q(pb, x + w - 70, ceil - 4, 30, 12, 6, { ramp: STEEL, skew: 0.7 });
    for (let k = 0; k < 4; k++) K.ellipseFn(pb, x + w - 62 + k * 7, ceil - 12, 2.5, 1.5, () => F[1]);
    vline(pb, x + 30, ceil - 40, ceil - 2, ST[2]); hline(pb, x + 26, x + 34, ceil - 34, ST[4]); put(pb, x + 30, ceil - 41, U('#ff4e5d'));
    for (let lx = x + 18; lx < x + w - 10; lx += 56) { rect(pb, lx, ceil + 8, 20, 2, ST[3]); hline(pb, lx + 1, lx + 18, ceil + 10, U('#fff8e0')); lamps.push([lx + 10, ceil + 11]); }
    // muro lateral izquierdo en corte (pilastra)
    for (let yy = ceil; yy < yF; yy++) for (let k = 0; k < 6; k++) put(pb, x - 4 + k, yy, WL[[2, 6, 5, 4, 3, 1][k]]);
    // losa del suelo de la sala: cara superior en 3/4 (vinilo) y canto con franja
    for (let r = 0; r < 8; r++) { const yy = yF - 1 - r, off = Math.round(r * 0.7); for (let xx = x - 4 + off; xx < x + w + 4 + off; xx++) put(pb, xx, yy, r === 0 ? ST[7] : ((xx + r * 3) % 14 === 0 ? P32(FRP)[4] : P32(FRP)[6 - (r > 5 ? 1 : 0)])); }
    for (let xx = x - 4; xx < x + w + 4; xx++) { put(pb, xx, yF, ST[6]); put(pb, xx, yF + 1, ((xx >> 2) & 1) ? P32(YEL)[4] : U('#1c1c24')); put(pb, xx, yF + 2, ((xx >> 2) & 1) ? P32(YEL)[2] : U('#101016')); for (let k = 3; k < 7; k++) put(pb, xx, yF + k, F[k === 3 ? 4 : k === 6 ? 0 : 2]); }
    shade(pb, x - 4, yF + 7, w + 8, 3, -0.25);
    return { screens, lamps, mimic: [mx, my, mw, mh] };
  }

  /* ---------- armarios eléctricos (CCM) ---------- */
  function cabinets(pb, x, yb, n, o = {}) {
    const cw = o.w ?? 22, ch = o.h ?? 58, d = o.d ?? 8, R = o.ramp || ['#20283a', '#323c52', '#46526c', '#5c6a86', '#7686a2', '#98a8c0', '#c0cce0'];
    const C = P32(R), leds = [], scr = [], r = RNG(o.seed || 9);
    A.castShadow(pb, x + 4, yb, n * cw, d + 6, -0.24);
    for (let i = 0; i < n; i++) {
      const cx = x + i * cw;
      I.box3q(pb, cx, yb, cw, ch, d, { ramp: R, skew: 0.6, front: (xx, yy, u, v) => { const lx = xx - cx, ly = yy - (yb - ch); if (lx === 0 || lx === cw - 1) return C[1]; if (ly < 3) return C[5]; if (ly > ch - 5) return C[0]; if ((ly - 3) % 26 === 0) return C[1]; return C[3 + ((lx > 2 && lx < cw - 3 && ly % 26 < 24) ? 0 : -1)]; } });
      // manilla, rejilla, pantalla o pilotos
      vline(pb, cx + cw - 5, yb - ch + 18, yb - ch + 26, U('#d3ccc5')); put(pb, cx + cw - 4, yb - ch + 22, U('#6a6870'));
      for (let yy = yb - 14; yy < yb - 6; yy += 2) hline(pb, cx + 4, cx + cw - 7, yy, C[1]);
      const kind = (o.kinds && o.kinds[i]) || r.pick(['leds', 'screen', 'leds', 'meter']);
      if (kind === 'screen') { rect(pb, cx + 4, yb - ch + 8, 11, 8, U('#06122a')); scr.push([cx + 5, yb - ch + 9, 9, 6]); }
      else if (kind === 'meter') { rect(pb, cx + 4, yb - ch + 8, 9, 9, U('#f0f2ee')); put(pb, cx + 8, yb - ch + 12, U('#e2404a')); put(pb, cx + 9, yb - ch + 11, U('#e2404a')); }
      for (let k = 0; k < 3; k++) { const lx = cx + 4 + k * 4, ly = yb - ch + 34; put(pb, lx, ly, U('#141418')); leds.push({ x: lx, y: ly, col: ['#3fe0a0', '#ffd84a', '#ff4e5d'][k], hz: 0.5 + r() * 1.5, ph: r() * 3 }); }
      // pegatina de riesgo eléctrico
      if (i % 2 === 0) sign(pb, cx + cw - 10, yb - ch + 4, 'bolt');
    }
    return { leds, screens: scr };
  }
  /** Armario de servidores / controlador de despacho (puerta de vidrio con servidores) */
  function rackCab(pb, x, yb, w = 50, h = 86) {
    const N = P32(NAVY), F = P32(FRAME), leds = [], d = 12;
    A.castShadow(pb, x + 4, yb, w, 14, -0.26);
    I.box3q(pb, x, yb, w, h, d, { ramp: ['#03060e', '#0a1428', '#121e38', '#1c2c4c', '#2a4064', '#3e5a86', '#5a7aa8'], skew: 0.6 });
    // puerta de vidrio ahumado con servidores dentro
    for (let yy = yb - h + 6; yy < yb - 6; yy++) for (let xx = x + 4; xx < x + w - 6; xx++) {
      const ly = yy - (yb - h + 6), row = ly % 9;
      let u = row < 7 ? (row === 0 ? F[4] : F[2]) : N[1];
      if (row > 1 && row < 6 && (xx - x) % 4 === 0) u = F[1];
      put(pb, xx, yy, u);
    }
    for (let yy = yb - h + 6; yy < yb - 6; yy++) { put(pb, x + 3, yy, F[5]); put(pb, x + w - 6, yy, F[1]); }
    for (let k = 0; k < 18; k++) put(pb, x + 6 + k, yb - h + 8 + k, U('#5a7aa8')); // reflejo diagonal en el vidrio
    for (let ly = 0; ly < h - 14; ly += 9) for (let k = 0; k < 5; k++) leds.push({ x: x + 8 + k * 6, y: yb - h + 9 + ly, col: ['#3fe0a0', '#56e5ff', '#ffd84a', '#3fe0a0', '#f27ee6'][(ly / 9 + k) % 5], hz: 0.8 + ((ly + k * 7) % 5) * 0.4, ph: k * 0.37 + ly * 0.1 });
    // ventiladores en el techo y bandeja de cables de entrada
    for (const fx of [x + 10, x + 26]) K.ellipseFn(pb, fx + 4, yb - h - 5, 4, 2, (nx, ny, dd) => dd > 0.5 ? F[1] : F[3]);
    return { leds, beacon: [x + w - 10, yb - h - 2] };
  }

  /* ---------- puerta enrollable industrial ---------- */
  function rollDoor(pb, x, yb, w, h, o = {}) {
    const C = P32(CONC), ST = P32(STEEL), Y = P32(YEL), open = o.open ?? 0.62;
    const yTop = yb - h;
    // jambas y dintel de hormigón con franjas de peligro
    for (const jx of [x - 8, x + w]) for (let yy = yTop - 10; yy < yb; yy++) for (let k = 0; k < 8; k++) { let u = C[[6, 5, 5, 4, 4, 3, 2, 1][k]]; if (yy > yb - 30 && k > 1 && k < 6) u = (((yy + k) >> 2) & 1) ? Y[4] : U('#1c1c24'); put(pb, jx + k, yy, u); }
    for (let yy = yTop - 10; yy < yTop; yy++) for (let xx = x - 8; xx < x + w + 8; xx++) put(pb, xx, yy, C[yy === yTop - 10 ? 7 : yy === yTop - 1 ? 1 : 4]);
    // hueco abierto: túnel hacia los canales (oscuro con luz índigo-magenta al fondo)
    const yo = yTop + Math.round(h * open);
    for (let yy = yo; yy < yb; yy++) for (let xx = x; xx < x + w; xx++) {
      const k = (yy - yo) / Math.max(1, yb - yo), cxk = 1 - Math.abs((xx - x) / w - 0.5) * 2;
      let u = PFK.mixU(U('#05040e'), U(o.glow || '#3a2a80'), clamp(cxk * 0.7 - k * 0.15, 0, 1) * 0.8);
      if (yy > yb - 6) u = PFK.mixU(u, U('#c244a2'), 0.25 * cxk);
      put(pb, xx, yy, u);
    }
    // persiana: lamas horizontales
    for (let yy = yTop; yy < yo; yy++) for (let xx = x; xx < x + w; xx++) { const ly = (yy - yTop) % 4; put(pb, xx, yy, ST[ly === 0 ? 6 : ly === 3 ? 1 : (PFK.cl(xx, yy, 3, 7) < 0.1 ? 3 : 4)]); }
    for (let xx = x; xx < x + w; xx++) { put(pb, xx, yo, ST[0]); put(pb, xx, yo - 1, Y[3]); }
    // caja del rodillo
    I.box3q(pb, x - 2, yTop + 1, w + 4, 8, 4, { ramp: STEEL, skew: 0.6 });
    return { mouth: [x, yo, w, yb - yo] };
  }

  /* ---------- dosificación química ---------- */
  function dosing(pb, x, yb, o = {}) {
    const Y = P32(YEL), H = P32(HDPE);
    A.castShadow(pb, x, yb, 34, 10, -0.22);
    // cubeto de retención amarillo
    I.box3q(pb, x - 2, yb, 36, 5, 9, { ramp: YEL, skew: 0.6, front: (xx, yy) => (((xx + yy) >> 2) & 1) ? Y[4] : U('#1c1c24') });
    // depósito de HDPE translúcido con nivel
    const tx = x + 3, tw = 16, th = 26, ty = yb - 5 - th;
    for (let yy = ty; yy < yb - 5; yy++) for (let xx = tx; xx < tx + tw; xx++) { const f = (xx - tx) / (tw - 1); put(pb, xx, yy, H[ti(f, H.length)]); }
    K.ellipseFn(pb, tx + tw / 2, ty, tw / 2, 2.5, (nx, ny) => H[ny < 0 ? 6 : 4]);
    const lvl = [tx + 2, ty + 9, 2, th - 11];
    for (let yy = lvl[1]; yy < lvl[1] + lvl[3]; yy++) { put(pb, lvl[0], yy, U(o.col || '#b49cff')); put(pb, lvl[0] + 1, yy, PFK.shU(U(o.col || '#b49cff'), -0.25)); }
    rect(pb, tx + 5, ty + 8, 8, 6, U('#ffffff')); K.text(pb, o.label || 'AI', tx + 6, ty + 8, U('#143a78'), { font: 'tiny' });
    // bomba dosificadora de membrana
    I.box3q(pb, x + 22, yb - 5, 10, 9, 4, { ramp: BLUEP, skew: 0.7 });
    K.ellipseFn(pb, x + 27, yb - 17, 3.5, 3.5, (nx, ny, d) => d > 0.5 ? U('#2a282e') : U('#d0d4dc'));
    for (let yy = ty - 6; yy < yb - 20; yy++) put(pb, x + 27, yy, U('#e8e8f0'));
    hline(pb, tx + tw / 2, x + 27, ty - 6, U('#e8e8f0'));
    sign(pb, x + 23, yb - 34, 'warn');
    return { level: lvl };
  }

  /* ---------- panel de analizadores en línea ---------- */
  function analyzers(pb, x, yb, w = 60) {
    const WL = P32(WALLW), F = P32(FRAME), scr = [], h = 62;
    A.castShadow(pb, x + 2, yb, w, 8, -0.22);
    for (const lx of [x + 2, x + w - 5]) { vline(pb, lx, yb - h, yb, F[4]); vline(pb, lx + 1, yb - h, yb, F[2]); vline(pb, lx + 2, yb - h, yb, F[1]); }
    for (let yy = yb - h; yy < yb - 16; yy++) for (let xx = x + 5; xx < x + w - 5; xx++) put(pb, xx, yy, WL[yy === yb - h ? 7 : (xx - x) % 19 === 0 ? 3 : 5]);
    for (let i = 0; i < 3; i++) {
      const ax = x + 8 + i * Math.round((w - 16) / 3);
      I.box3q(pb, ax, yb - h + 26, 14, 16, 3, { ramp: ['#141a28', '#22304a', '#34507a', '#4a6ea0', '#7a9cc8', '#b8d0ea'], skew: 0.7 });
      rect(pb, ax + 2, yb - h + 13, 10, 6, U('#04120a')); scr.push([ax + 2, yb - h + 13, 10, 6]);
      // tubos de muestra que bajan a la pileta
      for (let yy = yb - h + 26; yy < yb - 12; yy++) put(pb, ax + 7, yy, U(['#48d4f0', '#7aaad6', '#9485ac'][i]));
    }
    // pileta de desagüe
    I.box3q(pb, x + 6, yb - 6, w - 12, 6, 4, { ramp: STEEL, skew: 0.7 });
    return { screens: scr };
  }

  /* ---------- pequeños objetos ---------- */
  function pallet(pb, x, yb, o = {}) {
    const n = o.n ?? 3, Wd = P32(A.WOOD), C = P32(CARD);
    A.castShadow(pb, x, yb, 40, 10, -0.22);
    I.box3q(pb, x, yb, 40, 3, 9, { ramp: A.WOOD, skew: 0.6, front: (xx) => Wd[(xx - x) % 13 < 3 ? 1 : 4] });
    for (let i = 0; i < n; i++) {
      const by = yb - 3 - i * 9, bx = x + 1 + (i % 2);
      I.box3q(pb, bx, by, 38, 9, 8, { ramp: CARD, skew: 0.6, front: (xx, yy) => (yy - by + 9 === 4 || yy - by + 9 === 5) ? U('#1e52a2') : C[4 - ((xx - bx) % 19 === 0 ? 2 : 0)] });
    }
    if (o.label) K.text(pb, o.label, x + 6, yb - 3 - (n - 1) * 9 - 7, U('#0c2650'), { font: 'tiny' });
  }
  function extinguisher(pb, x, yb) {
    const R = P32(RED);
    rect(pb, x - 1, yb - 46, 12, 10, U('#e2404a')); rect(pb, x, yb - 45, 10, 8, U('#ffffff')); rect(pb, x + 3, yb - 44, 4, 6, U('#e2404a'));
    for (let yy = yb - 18; yy < yb; yy++) for (let i = 0; i < 7; i++) put(pb, x + 2 + i, yy, R[ti(i / 6, R.length)]);
    K.ellipseFn(pb, x + 5.5, yb - 18, 3.5, 1.5, () => R[5]); rect(pb, x + 4, yb - 22, 3, 3, U('#2a282e')); hline(pb, x + 6, x + 9, yb - 22, U('#2a282e'));
  }
  function eyewash(pb, x, yb) {
    const ST = P32(STEEL);
    rect(pb, x - 1, yb - 70, 14, 12, U('#1f8a52')); rect(pb, x + 1, yb - 68, 10, 8, U('#ffffff')); rect(pb, x + 5, yb - 67, 2, 6, U('#1f8a52')); rect(pb, x + 3, yb - 65, 6, 2, U('#1f8a52'));
    vline(pb, x + 6, yb - 40, yb - 1, ST[5]); vline(pb, x + 7, yb - 40, yb - 1, ST[2]);
    K.ellipseFn(pb, x + 6.5, yb - 40, 7, 3, (nx, ny) => ny < 0 ? U('#fcd856') : U('#a87414'));
    hline(pb, x + 2, x + 11, yb - 1, ST[1]);
  }
  /** Señales: warn (triángulo), bolt (riesgo eléctrico), ear/helmet/goggles (obligación), exit, first */
  function sign(pb, x, y, kind = 'warn') {
    if (kind === 'warn' || kind === 'bolt') {
      for (let r = 0; r < 8; r++) for (let k = -r; k <= r; k++) { const xx = x + 4 + Math.round(k * 0.6), edge = r === 7 || Math.abs(k) === r; put(pb, xx, y + r, U(edge ? '#141418' : '#fcd856')); }
      if (kind === 'warn') { vline(pb, x + 4, y + 2, y + 4, U('#141418')); put(pb, x + 4, y + 6, U('#141418')); }
      else { put(pb, x + 5, y + 2, U('#141418')); put(pb, x + 4, y + 3, U('#141418')); put(pb, x + 4, y + 4, U('#141418')); put(pb, x + 5, y + 4, U('#141418')); put(pb, x + 4, y + 5, U('#141418')); }
      return;
    }
    if (kind === 'exit' || kind === 'first') { rect(pb, x, y, 14, 8, U('#1f8a52')); hline(pb, x, x + 13, y, U('#72c69a')); if (kind === 'first') { rect(pb, x + 6, y + 2, 2, 5, U('#ffffff')); rect(pb, x + 4, y + 3, 6, 2, U('#ffffff')); } else { put(pb, x + 3, y + 3, U('#ffffff')); vline(pb, x + 3, y + 4, y + 6, U('#ffffff')); hline(pb, x + 6, x + 11, y + 4, U('#ffffff')); put(pb, x + 10, y + 3, U('#ffffff')); put(pb, x + 10, y + 5, U('#ffffff')); } return; }
    // obligación: disco azul con pictograma blanco
    K.ellipseFn(pb, x + 4.5, y + 4.5, 4.6, 4.6, (nx, ny, d) => d > 0.7 ? U('#e8f0f8') : U('#1e52a2'));
    const wht = U('#ffffff');
    if (kind === 'ear') { put(pb, x + 2, y + 3, wht); put(pb, x + 2, y + 4, wht); put(pb, x + 7, y + 3, wht); put(pb, x + 7, y + 4, wht); hline(pb, x + 3, x + 6, y + 2, wht); }
    else if (kind === 'helmet') { hline(pb, x + 3, x + 6, y + 3, wht); hline(pb, x + 2, x + 7, y + 4, wht); hline(pb, x + 2, x + 7, y + 5, wht); }
    else { hline(pb, x + 2, x + 7, y + 4, wht); put(pb, x + 3, y + 3, wht); put(pb, x + 6, y + 3, wht); }
  }
  /** Cono de señalización naranja con franjas blancas */
  function cone(pb, x, yb) {
    const O = P32(['#5a1a04', '#a8380a', '#e2581a', '#ff8a3a', '#ffc090']);
    for (let r = 0; r < 14; r++) { const hw = 1 + Math.round(r * 0.32); for (let k = -hw; k <= hw; k++) { const f = (k + hw) / (2 * hw + 0.01); let u = O[f < 0.3 ? 3 : f < 0.7 ? 2 : 1]; if (r === 5 || r === 6 || r === 10) u = U(f < 0.5 ? '#ffffff' : '#c8ccd2'); put(pb, x + k, yb - 15 + r, u); } }
    rect(pb, x - 7, yb - 1, 15, 2, O[1]); hline(pb, x - 7, x + 7, yb - 1, O[2]);
  }
  /** Caja de herramientas metálica */
  function toolbox(pb, x, yb, col = '#bc2430') {
    const c = U(col);
    I.box3q(pb, x, yb, 18, 9, 5, { ramp: [PFK.shU(c, -0.5), PFK.shU(c, -0.3), c, PFK.shU(c, 0.15), PFK.shU(c, 0.3)].map(u32ToHex), skew: 0.7 });
    hline(pb, x + 6, x + 11, yb - 13, U('#2a282e')); put(pb, x + 6, yb - 12, U('#2a282e')); put(pb, x + 11, yb - 12, U('#2a282e'));
    hline(pb, x + 1, x + 16, yb - 5, PFK.shU(c, -0.45));
  }
  /** Cubo de plástico */
  function bucket(pb, x, yb, col = '#2c6cc6') {
    const c = U(col);
    for (let r = 0; r < 9; r++) { const hw = 4 - Math.round(r * 0.12); for (let k = -hw; k <= hw; k++) put(pb, x + k, yb - 9 + r, k < -1 ? PFK.shU(c, 0.25) : k > 1 ? PFK.shU(c, -0.3) : c); }
    K.ellipseFn(pb, x, yb - 9, 4.5, 1.5, (nx, ny) => ny < 0 ? PFK.shU(c, 0.3) : PFK.shU(c, -0.5));
    for (let k = -4; k <= 4; k++) put(pb, x + k, yb - 12 + Math.round((k * k) / 8), U('#4f4d51'));
  }
  /** Carro de muestras con botellas y portátil */
  function cart(pb, x, yb) {
    const ST = P32(STEEL);
    for (const wx of [x + 3, x + 21]) K.ellipseFn(pb, wx, yb - 2, 2.2, 2.2, () => U('#1c1c24'));
    for (const lx of [x + 2, x + 22]) { vline(pb, lx, yb - 26, yb - 4, ST[5]); vline(pb, lx + 1, yb - 26, yb - 4, ST[2]); }
    for (const sy of [yb - 6, yb - 18]) { hline(pb, x + 1, x + 24, sy, ST[6]); hline(pb, x + 1, x + 24, sy + 1, ST[2]); }
    for (let k = 0; k < 6; k++) { const bx = x + 4 + k * 3; rect(pb, bx, yb - 13, 2, 7, U(k % 2 ? '#d0f4f8' : '#a8e0f0')); put(pb, bx, yb - 14, U(['#e2404a', '#2c6cc6', '#3fe0a0'][k % 3])); }
    rect(pb, x + 5, yb - 21, 14, 3, U('#26262e')); PFK.polyFill(pb, [[x + 6, yb - 21], [x + 18, yb - 21], [x + 17, yb - 29], [x + 7, yb - 29]], U('#141418')); rect(pb, x + 8, yb - 28, 8, 6, U('#2a6cc4'));
  }
  /** Manguera enrollada en carrete */
  function hoseReel(pb, x, yb, col = '#3a8a3a') {
    const c = U(col);
    K.ellipseFn(pb, x, yb - 10, 9, 9, (nx, ny, d) => d > 0.85 ? U('#4f4d51') : d > 0.2 ? ((Math.round(Math.sqrt(d) * 8) % 2) ? c : PFK.shU(c, -0.3)) : U('#716f76'));
    for (const lx of [x - 6, x + 5]) vline(pb, lx, yb - 4, yb, U('#4f4d51'));
  }
  /** Escalera de tijera de aluminio */
  function stepLadder(pb, x, yb, h = 40) {
    const ST = P32(STEEL);
    PFK.lineFn(pb, x, yb, x + 6, yb - h, () => ST[6], 2); PFK.lineFn(pb, x + 16, yb, x + 9, yb - h, () => ST[3], 2);
    for (let y = yb - 6; y > yb - h + 4; y -= 8) { const t = (yb - y) / h; hline(pb, Math.round(x + t * 6) + 1, Math.round(x + 16 - t * 7) - 1, y, ST[5]); }
    rect(pb, x + 5, yb - h - 2, 6, 3, U('#e2404a'));
  }
  /** Conducto de ventilación circular galvanizado con colgadores y difusores */
  function duct(pb, x0, x1, y, r = 7, o = {}) {
    const G_ = P32(['#3a4250', '#56606e', '#76808e', '#98a2ae', '#b8c0ca', '#d4dae0', '#eef2f6']), n = G_.length;
    for (let j = -r; j <= r; j++) { const k = ti((j + r) / (2 * r), n); for (let x = x0; x <= x1; x++) put(pb, x, y + j, ((x - x0) % 40 === 0) ? G_[Math.max(0, k - 2)] : ((x - x0) % 40 === 1 ? G_[Math.min(n - 1, k + 1)] : G_[k])); }
    for (let x = x0 + 20; x < x1; x += 80) { vline(pb, x, (o.top ?? y - 40), y - r - 1, P32(FRAME)[4]); hline(pb, x - 3, x + 3, y - r - 1, P32(FRAME)[2]); }
    for (let x = x0 + 60; x < x1 - 10; x += o.diff ?? 120) { rect(pb, x - 5, y + r, 11, 3, G_[2]); hline(pb, x - 4, x + 4, y + r + 3, G_[5]); for (let k = -4; k <= 4; k += 2) put(pb, x + k, y + r + 1, G_[0]); }
  }
  /** Rótulo de zona colgado con cadenas (placa navy con texto y franja de color del sistema) */
  function hangSign(pb, x, y, text, col = '#11bedd', o = {}) {
    const tw = K.measure(text, { font: 'tiny' }) + 10, top = o.top ?? y - 26;
    for (const cx of [x + 3, x + tw - 4]) for (let yy = top; yy < y; yy++) put(pb, cx, yy, (yy % 3) ? P32(STEEL)[3] : P32(STEEL)[1]);
    rect(pb, x, y, tw, 11, U('#06132e')); hline(pb, x, x + tw - 1, y, U('#a8c8ff')); hline(pb, x, x + tw - 1, y + 10, U('#020814'));
    rect(pb, x, y + 1, 3, 9, U(col)); vline(pb, x + tw - 1, y + 1, y + 9, U('#3a64b0'));
    K.text(pb, text, x + 6, y + 3, U('#e6f8fe'), { font: 'tiny' });
  }
  /** Bandeja de cables colgada (con cables de colores) */
  function tray(pb, x0, x1, y, hang = 0) {
    const F = P32(FRAME);
    for (let x = x0; x <= x1; x++) { put(pb, x, y, F[6]); put(pb, x, y + 1, F[3]); put(pb, x, y + 2, F[1]); put(pb, x, y - 1, U(['#141418', '#c8562a', '#2a282e', '#1e52a2'][(x >> 3) & 3])); }
    if (hang) for (let x = x0 + 6; x < x1; x += 40) vline(pb, x, y - hang, y, F[4]);
  }
  /** Rótulo pintado en el suelo (aplanado en 3/4: filas alternas) */
  function stencil(pb, x, y, text, col = '#f0c040') {
    const tmp = new PixelBuffer(K.measure(text, { font: 'tiny' }) + 2, 8);
    K.text(tmp, text, 0, 1, U(col), { font: 'tiny' });
    for (let yy = 0; yy < tmp.h; yy += 2) for (let xx = 0; xx < tmp.w; xx++) { const c = tmp.data[yy * tmp.w + xx]; if (c >>> 24) { const d = get(pb, x + xx + (yy >> 2), y + (yy >> 1)); put(pb, x + xx + (yy >> 2), y + (yy >> 1), d >>> 24 ? K.mixU(d, c, 0.7) : c); } }
  }

  /* ---------- oclusores frontales de interior (oscuros y fríos) ---------- */
  const FGC = ['#04060c', '#070b16', '#0c1222', '#121a30', '#1a2440', '#243252', '#33466a'];
  /** Columna en I del primer plano (azul de planta en sombra fría) con borde de luz de los ventanales,
      faja de peligro, armario de manguera contra incendios y conduit (anclada abajo, sobresale por arriba) */
  function fgColumn(o) {
    const w = o.w || 26, h = o.h || 420, pb = new PixelBuffer(w + 30, h), cx = 16;
    const C = P32(['#03070e', '#060d1a', '#0a1628', '#0f203a', '#16304e', '#1e4064', '#2a5480']);
    const RIM = U('#8ab4e8'), RIM2 = U('#3a6aa0');
    for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) {
      // ala izquierda iluminada, alma en sombra, ala derecha
      let k = i < 4 ? 5 - (i === 3 ? 1 : 0) : i < 6 ? 1 : i > w - 5 ? 3 - (i === w - 1 ? 2 : 0) : i > w - 7 ? 1 : 2;
      if (i >= 6 && i <= w - 7 && (y % 46) > 42) k = 3;                       // rigidizadores del alma
      if (i < 4 && PFK.cl(cx + i, y, 3, 5) < 0.08) k -= 1;
      put(pb, cx + i, y, C[clamp(k, 0, 6)]);
    }
    for (let y = 0; y < h; y++) { put(pb, cx, y, (y % 5) ? RIM : RIM2); }
    for (let y = 8; y < h; y += 23) { put(pb, cx + 2, y, U('#5a86c0')); put(pb, cx + w - 3, y, C[4]); }
    // faja de peligro en la base y placa de pilar
    const by = h - 70;
    for (let y = by; y < by + 22; y++) for (let i = 0; i < w; i++) { const on = (((i + y) >> 2) & 1); put(pb, cx + i, y, on ? (i < 4 ? U('#c8901c') : U('#7a5a10')) : C[0]); }
    rect(pb, cx + 6, by - 30, w - 12, 9, U('#0f203a')); hline(pb, cx + 6, cx + w - 7, by - 30, U('#5a86c0'));
    PFK.text(pb, 'B' + ((o.seed || 1) % 9), cx + 8, by - 29, U('#9cc0f0'), { font: 'tiny' });
    // armario de manguera contra incendios (acento rojo en sombra)
    const fy = by - 92;
    rect(pb, cx + w - 2, fy, 14, 24, U('#3a0a10')); rect(pb, cx + w - 1, fy + 1, 12, 22, U('#6a1420')); hline(pb, cx + w - 1, cx + w + 10, fy + 1, U('#a83040'));
    K.ellipseFn(pb, cx + w + 5, fy + 11, 4.5, 4.5, (nx, ny, d) => d > 0.5 ? U('#2a0608') : U('#8a1620'));
    // conduit eléctrico con cajas
    for (let y = 0; y < h; y++) { put(pb, cx - 5, y, C[3]); put(pb, cx - 4, y, C[5]); put(pb, cx - 3, y, C[2]); }
    for (const yy of [120, 260]) { rect(pb, cx - 9, yy, 8, 11, C[3]); hline(pb, cx - 9, cx - 2, yy, C[6]); put(pb, cx - 6, yy + 5, U('#3fe0a0')); }
    // cartela superior con viga que sale del encuadre
    for (let r = 0; r < 20; r++) for (let k = 0; k <= r; k++) put(pb, cx + w + Math.round(k * 0.6), 40 + r, C[r === 19 ? 0 : 2]);
    return pb;
  }
  /** Haz de tubos y bandeja colgando del borde superior */
  function fgPipes(o) {
    const w = o.w || 220, h = o.h || 46, pb = new PixelBuffer(w, h), C = P32(FGC);
    for (const [y, r] of [[6, 4], [17, 3], [26, 2]]) for (let j = -r; j <= r; j++) for (let x = 0; x < w; x++) put(pb, x, y + j, C[clamp(Math.round(prof((j + r) / (2 * r)) * 6), 0, 6)]);
    for (let x = 10; x < w; x += 58) { for (let y = 0; y < h - 4; y++) { put(pb, x, y, C[5]); put(pb, x + 1, y, C[1]); } hline(pb, x - 5, x + 6, h - 6, C[4]); hline(pb, x - 5, x + 6, h - 5, C[1]); }
    // bajante vertical con válvula
    const vx = Math.round(w * 0.62);
    for (let y = 26; y < h; y++) for (let i = 0; i < 6; i++) put(pb, vx + i, y, C[[5, 6, 4, 3, 2, 1][i]]);
    rect(pb, vx - 3, h - 12, 12, 3, C[2]); hline(pb, vx - 6, vx + 11, h - 15, U('#3a1418'));
    return pb;
  }
  /** Cadena y gancho de polipasto colgando (arriba) */
  function fgChain(o) {
    const h = o.h || 120, pb = new PixelBuffer(30, h + 20), C = P32(FGC);
    for (let y = 0; y < h; y++) { const lk = y % 4; put(pb, 14, y, C[lk < 2 ? 5 : 2]); put(pb, 15, y, C[lk < 2 ? 3 : 4]); }
    K.ellipseFn(pb, 15, h + 6, 6, 6, (nx, ny, d) => (d > 0.45 && !(nx > 0.3 && ny < 0.2)) ? C[nx + ny < 0 ? 5 : 2] : 0);
    rect(pb, 10, h - 4, 11, 6, P32(YEL)[1]); hline(pb, 10, 20, h - 4, P32(YEL)[3]);
    return pb;
  }
  /** Barandilla del primer plano (anclada abajo): pasamanos, postes, rodapié y volante de válvula */
  function fgRail(o) {
    const w = o.w || 200, h = o.h || 58, pb = new PixelBuffer(w, h), C = P32(['#03070e', '#060d1a', '#0a1628', '#0f203a', '#16304e', '#1e4064', '#2a5480']);
    const RIM = U('#6a9ad8');
    for (let x = 0; x < w; x++) { put(pb, x, 4, RIM); put(pb, x, 5, C[4]); put(pb, x, 6, C[2]); put(pb, x, 7, C[0]); put(pb, x, 26, C[4]); put(pb, x, 27, C[1]); for (let y = h - 14; y < h; y++) put(pb, x, y, C[y === h - 14 ? 5 : 1 + (((x + y) >> 3) & 1)]); }
    for (let x = 8; x < w; x += 46) for (let y = 4; y < h; y++) { put(pb, x, y, y < 8 ? RIM : C[5]); put(pb, x + 1, y, C[3]); put(pb, x + 2, y, C[1]); }
    // volante de válvula y tubo que sube del borde inferior
    const vx = Math.round(w * 0.7);
    for (let y = 20; y < h; y++) for (let i = 0; i < 9; i++) put(pb, vx + i, y, C[[5, 6, 5, 4, 3, 2, 2, 1, 0][i]]);
    K.ellipseFn(pb, vx + 4.5, 16, 11, 4, (nx, ny, d) => d > 0.62 ? (ny < 0 ? RIM : C[3]) : (Math.abs(nx) < 0.12 || Math.abs(ny) < 0.2 ? C[4] : 0));
    rect(pb, vx - 30, 34, 16, 9, U('#3a0a10')); hline(pb, vx - 30, vx - 15, 34, U('#8a2030'));
    return pb;
  }
  /** Codo de tubería gruesa del primer plano que sale del borde inferior (oscuro y frío) */
  function fgElbow(o) {
    const r = o.r || 12, w = (o.w || 150), h = o.h || 90, pb = new PixelBuffer(w, h), C = P32(['#03070e', '#060d1a', '#0a1628', '#0f203a', '#16304e', '#1e4064', '#2a5480', '#4a7ab8']);
    const cx = r + 4, cy = r + 6;
    for (let x = cx; x < w; x++) for (let j = -r; j <= r; j++) put(pb, x, cy + j, C[clamp(Math.round(prof((j + r) / (2 * r)) * 7), 0, 7)]);
    for (let y = cy; y < h; y++) for (let i = -r; i <= r; i++) put(pb, cx + i, y, C[clamp(Math.round(prof((i + r) / (2 * r)) * 7), 0, 7)]);
    K.ellipseFn(pb, cx, cy, r + 1, r + 1, (nx, ny) => C[clamp(Math.round(4 - nx * 2 - ny * 2.4), 0, 7)]);
    for (const fx of [cx + 40, cx + 92]) for (let j = -r - 2; j <= r + 2; j++) { put(pb, fx, cy + j, C[6]); put(pb, fx + 1, cy + j, C[2]); put(pb, fx + 2, cy + j, C[1]); }
    for (let i = -r - 2; i <= r + 2; i++) { put(pb, cx + i, cy + 40, C[6]); put(pb, cx + i, cy + 41, C[1]); }
    rect(pb, cx + 52, cy - 4, 22, 8, U('#2a0a24')); hline(pb, cx + 52, cx + 73, cy - 4, U('#7a3a6a'));
    return pb;
  }
  if (typeof PFStage !== 'undefined' && PFStage.FG) Object.assign(PFStage.FG, { aColumn: fgColumn, aPipes: fgPipes, aChain: fgChain, aRail: fgRail, aElbow: fgElbow });

  return { vesselH, roRack, cartridge, pumpSkid, erd, tankV, catwalk, landing, pipeDeck, controlRoom, cabinets, rackCab, rollDoor, dosing, analyzers, pallet, extinguisher, eyewash, sign, tray, stencil, cone, toolbox, bucket, cart, hoseReel, stepLadder, duct, hangSign, column, beam, shade, rect, hline, vline, boltRing, prof, ti, FRAME, FRP, CAP, GREEN, BLUEP, YEL, RED, NAVY, WALLW, HDPE, CARD, FGC };
})();
