/* =====================================================================
   17s_r2plant_hero.js — PLANTA DESALADORA PROTAGONISTA (R2PLANT).
   Diorama masivo en 3/4 elevado de la cadena SYNARA, como la referencia:
   espigón de CAPTACIÓN sobre pilotes con bóveda de vidrio azul →
   PRETRATAMIENTO (tambor de tamices, 3 recipientes blancos con bandas
   azules y balsa de floculación con agua) → bomba de alta presión →
   bastidor de MEMBRANAS (2 bancos × 3 tubos de presión, pasarela con
   barandilla) → bloque elevado de AGUA POTABLE (depósito con banda cian)
   y REMINERALIZACIÓN (silos de calcita) → emisario de SALMUERA grafito con
   codos y boca abierta junto al agua. Muros de bloques de hormigón con
   juntas, chorreones y banda húmeda; cubierta de losas con arena; sombras
   de contacto y arrojadas; barandillas amarillas, farolas, operarios,
   válvulas, manómetros y LED. Tuberías gruesas con bridas y soportes en el
   color de su corriente (agua de mar turquesa · pretratada acero-azul ·
   permeado cian luminoso · salmuera grafito-índigo · energía amarilla).
   Todo se dibuja sin cizalla en un búfer local y al final se cizalla por
   columnas (pendiente A): el espigón queda arriba-izquierda (lejos) y la
   boca de salmuera abajo-derecha (cerca), la diagonal del diorama.
   API:
     R2PLANT.hero(pb, x, yw, {s, k, slope, from, workers, lights, w})
         x, yw = pie frontal DERECHO de la planta en la línea de agua.
         s escala (1 ≈ 330 px de ancho; 0,55–1,2), k bruma, from:
         'intake'|'pretrat' (omite el espigón de toma).
         → info {x0,y0,x1,y1, anchors:{captacion,pretrat,membranas,potable,remin,salmuera,bombeo},
                 perm:[[pts]], sea:[[pts]], pre:[[pts]], power:[[pts]], mouth:{x,y,r},
                 intake:{x,y}, leds:[[x,y,col]], lamps:[[x,y,r]], foam:[[x,y]], glints:[[x,y,w]],
                 halo:{c,x,y}, waterAt(x)}
     R2PLANT.drawFx(g, info, ox, oy, t, {plume, foam, chev})  efectos vivos (≤ ~180 fillRect,
         ≈ 12 drawImage): halo pulsante del permeado, chevrones blancos a 20 px/s,
         chevrones amarillos de energía, LED, farolas, espuma al pie y pluma de la boca.
     R2PLANT.plumeStrip({mode:'under'|'surface', w, h, n, seed, bed, s}) → tira de n cuadros
         de la pluma de salmuera densa y saturada que cae, se hunde y se diluye
         (prerender; 1 drawImage por cuadro).
     R2PLANT.drawPlume(g, strip, x, y, t, a)        dibuja la tira en la boca (x,y)
     R2PLANT.drawChevrons(g, pts, ox, oy, t, {col, speed, gap, glow}) chevrones por polilínea
     R2PLANT.powerHalo(pts, r) → {c,x,y}            halo amarillo cacheado de una línea eléctrica
   ===================================================================== */
const R2PLANT = (() => {
  const V = VISTA;
  const PAL = {
    conc: ['#24223a', '#363248', '#4a4456', '#605862', '#786e6e', '#90847c', '#a89a8a', '#bdb09c', '#cfc3ac', '#dfd4bc', '#ece4ce', '#f8f2e2'],
    deck: ['#4e3c30', '#6c5642', '#8a7056', '#a4886a', '#ba9e7c', '#ccb28e', '#dcc4a0', '#e8d4b4', '#f2e2c8', '#faeedc'],
    steel: ['#1a1e2e', '#282c3c', '#3a3e50', '#505364', '#686a7a', '#828290', '#9e9ca6', '#bab6bc', '#d2cecf', '#e8e4e0', '#f8f6f2'],
    white: ['#363c50', '#4e566c', '#6e7690', '#929ab0', '#b4bacb', '#cfd3de', '#e2e5ec', '#eff1f4', '#f9fafb', '#ffffff'],
    band: ['#071c38', '#0c305a', '#144a84', '#1e68ae', '#2a8ed4', '#4cb4ec', '#96dcfa'],
    memb: ['#0a1630', '#102848', '#183e6a', '#22588e', '#3074ae', '#4a92c8', '#6eb0dc', '#9cd0ec', '#cceaf8', '#f2fbff'],
    perm: ['#06304e', '#0a5a84', '#0e8ab8', '#16acd8', '#1ebde3', '#44d2f0', '#6de1f1', '#a8f2fa', '#d0f4f8', '#ffffff'],
    sea: ['#032038', '#05446c', '#08689c', '#0c8cc0', '#14acd8', '#36c6e8', '#72dcf2', '#b8f0fa', '#e8fcff'],
    pre: ['#121e34', '#1e3656', '#30527c', '#4a72a2', '#6a94c2', '#92b6dc', '#bcd6ee', '#e2f0fa', '#ffffff'],
    brine: ['#03051a', '#080b20', '#0e1229', '#161b36', '#202644', '#2c3052', '#3e3e60', '#544e6e', '#6e6484', '#8c7ea2', '#ac9ec4'],
    rail: ['#3e2a06', '#6e4e0c', '#a47614', '#d49e22', '#f2c23a', '#ffdc66', '#fff0b0'],
    glass: ['#081a34', '#0e2c56', '#15427c', '#1e5ca2', '#2a7cc4', '#3e9ade', '#62baee', '#94d6f8', '#c8ecff', '#f0fbff'],
    red: ['#2a0808', '#501210', '#80201a', '#b23624', '#d8522e', '#f07c48', '#ffaa72', '#ffd0a8'],
    lime: ['#4a4236', '#665c4a', '#857a62', '#a49880', '#c0b69c', '#d8d0b8', '#ebe6d2', '#f8f6ea'],
    green: ['#0c2618', '#143a26', '#1e5234', '#2c6e46', '#40905a', '#5cb074', '#86d098', '#bcecc4'],
    navy: ['#0a1022', '#121c36', '#1c2c4e', '#284068', '#365684', '#4a70a0'],
    algae: ['#1a2e22', '#24402a', '#2e5232', '#3e6a3a'],
    cable: ['#14121c', '#2a2630', '#46404a'],
  };
  const LT = [-0.6, -0.8];   // dirección hacia la luz (arriba-izquierda) en pantalla
  const ix = (P, b) => (b <= 0 ? 0 : b >= 1 ? P.length - 1 : Math.round(b * (P.length - 1)));
  /** Brillo de una sección cilíndrica: f = 0 en el borde iluminado → 1 en el borde en sombra */
  function prof(f) {
    return f < 0.07 ? 0.5 : f < 0.15 ? 0.76 : f < 0.23 ? 0.9 : f < 0.31 ? 1.0 : f < 0.4 ? 0.86 : f < 0.52 ? 0.72 : f < 0.65 ? 0.58 : f < 0.78 ? 0.43 : f < 0.88 ? 0.27 : f < 0.95 ? 0.36 : 0.22;
  }

  /* =================================================================
     Planta protagonista
     ================================================================= */
  function hero(pb, x, yw, o = {}) {
    const s = o.s || 1, k = o.k || 0, A = o.slope ?? 0.085;
    const L = (v) => Math.round(v * s), S = (v) => Math.max(1, Math.round(v * s));
    const fromIntake = (o.from || 'intake') === 'intake';
    const workers = o.workers ?? (s >= 0.6), lights = o.lights ?? true, fine = s >= 0.7;
    const ZX = 0.5, ZY = 0.62;
    const TW = L(o.w || 336), TH = L(184), WL = TH - L(12);
    const T = new PixelBuffer(TW, TH), D = T.data;
    const deck = new Uint8Array(TW * TH);       // máscara de cubierta (recibe sombras)
    const R = (name) => V.P32(V.hz(PAL[name], k));
    const C = {}; for (const n in PAL) if (Array.isArray(PAL[n])) C[n] = R(n);
    const INK = U(V.hzc('#14122a', k * 0.6));
    const put = (px, py, u) => { px |= 0; py |= 0; if (px >= 0 && py >= 0 && px < TW && py < TH) D[py * TW + px] = u; };
    const get = (px, py) => (px >= 0 && py >= 0 && px < TW && py < TH) ? D[py * TW + px] : 0;
    const darken = (px, py, amt) => { const c = get(px, py); if (c >>> 24) put(px, py, V.shU(c, amt, 235)); };
    /** Proyección local (sin cizalla): X a lo largo del frente, Z profundidad, Y altura sobre el agua */
    const P = (X, Z, Y) => [Math.round(X + Z * ZX), Math.round(WL - Y - Z * ZY)];
    const ell = (cx, cy, rx, ry, fn) => {
      for (let py = Math.floor(cy - ry); py <= Math.ceil(cy + ry); py++) for (let px = Math.floor(cx - rx); px <= Math.ceil(cx + rx); px++) {
        const nx = (px + 0.5 - cx) / (rx + 0.01), ny = (py + 0.5 - cy) / (ry + 0.01), d = nx * nx + ny * ny;
        if (d > 1) continue; const u = fn(nx, ny, d, px, py); if (u) put(px, py, u);
      }
    };
    /* ---------- primitivas ---------- */
    /** Prisma 3/4: frente (pantalla), tapa que se aleja arriba-derecha, lateral derecho. paint(face,u,v,px,py,a,b) */
    function box(X, Z, Y, w, d, h, paint, op = {}) {
      const [fx, fy] = P(X, Z, Y + h);
      const sw = Math.round(d * ZX), rt = Math.round(d * ZY);
      if (!op.noSide) for (let j = 0; j < sw; j++) {
        const dy = Math.round(((j + 0.5) / ZX) * ZY);
        for (let yy = 0; yy < h; yy++) { const px = fx + w + j, py = fy - dy + yy; const c = paint('s', j / Math.max(1, sw - 1), yy / Math.max(1, h - 1), px, py, j, yy); if (c) put(px, py, c); }
      }
      if (!op.noTop) for (let r = 0; r < rt; r++) {
        const sh = Math.round(((r + 0.5) / ZY) * ZX), py = fy - 1 - r;
        for (let xx = 0; xx < w; xx++) { const px = fx + xx + sh; const c = paint('t', xx / Math.max(1, w - 1), r / Math.max(1, rt - 1), px, py, xx, r); if (c) { put(px, py, c); if (op.deck && px >= 0 && py >= 0 && px < TW && py < TH) deck[py * TW + px] = 1; } }
      }
      if (!op.noFront) for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { const px = fx + xx, py = fy + yy; const c = paint('f', xx / Math.max(1, w - 1), yy / Math.max(1, h - 1), px, py, xx, yy); if (c) put(px, py, c); }
      return { fx, fy, w, h, sw, rt };
    }
    /** Pintor por caras con una rampa: brillo frente/tapa/lado + textura en clusters */
    const flat = (Pn, bf = 0.62, bt = 0.84, bs = 0.36, tex = 0.06, seed = 3) => (face, u, v, px, py) => {
      let b = face === 'f' ? bf - v * 0.1 : face === 't' ? bt - v * 0.06 : bs - v * 0.06;
      if (face === 'f' && v === 0) b = Math.min(1, bt + 0.08);
      if (face === 'f' && u >= 0.985) b -= 0.12;
      return Pn[ix(Pn, b + (hash2(px >> 1, py >> 1, seed) - 0.5) * tex)];
    };
    /** Muro de bloques de hormigón grandes: juntas, bisel iluminado, chorreones, poros, banda húmeda con algas */
    const concrete = (H, op = {}) => {
      const bw = op.bw || L(22), bh = op.bh || Math.max(4, L(13)), wet = op.wet ?? L(5), seed = op.seed || 3, CN = C.conc, AL = C.algae;
      return (face, u, v, px, py, xx, yy) => {
        if (face === 't') return op.top ? op.top(face, u, v, px, py, xx, yy) : 0;
        if (face === 's') {
          let b = 0.34 - v * 0.05 + (hash2(px >> 1, py >> 1, seed) - 0.5) * 0.06;
          if (yy % bh === 0) b = 0.48; if (xx === 0) b = 0.5;
          if (yy >= H - wet) b -= 0.1;
          return CN[ix(CN, b)];
        }
        const course = Math.floor(yy / bh), off = (course & 1) ? (bw >> 1) : 0;
        const bx = Math.floor((xx + off) / bw), ju = (xx + off) % bw, jv = yy % bh;
        let b = 0.64 - (yy / H) * 0.16 + (hash2(bx, course, seed) - 0.5) * 0.14;
        if (jv === 0) b = 0.84; else if (jv === 1) b += 0.05;
        if (jv === bh - 1) b = 0.3;
        if (ju === 0) b = 0.32; else if (ju === 1) b += 0.09; else if (ju === bw - 1) b -= 0.05;
        const st = vnoise(px * 0.42, 0.5, seed + 7);
        if (st > 0.66 && jv > 1 && jv < bh - 1) b -= 0.05 + (st - 0.66) * 0.4;
        const hh = hash2(px, py, seed + 11);
        if (hh < 0.03) b -= 0.15; else if (hh > 0.985) b += 0.1;
        if (yy === 0) b = 1; else if (yy === 1) b = Math.max(b, 0.82);
        if (xx === 0 && op.lEdge) b = Math.max(b, 0.86);
        if (yy >= H - wet) {
          const q = yy - (H - wet);
          b = Math.min(b, 0.36) - q * 0.035;
          if (q >= 1 && hash2(px >> 1, yy >> 1, seed + 13) < 0.55) return AL[clamp(3 - (q >> 1), 0, 3)];
        }
        const u0 = CN[ix(CN, b)];
        // luz reflejada del agua (cian) en la mitad baja del muro
        return (op.refl !== false && yy > H * 0.45 && H > 8) ? V.mixU(u0, CYR, clamp(0.06 + (yy / H - 0.45) * 0.42, 0, 0.3)) : u0;
      };
    };
    const CYR = U(V.hzc('#46c4e2', k));
    /** Cubierta de losas con arena: juntas, labio iluminado, manchas */
    const deckPaint = (op = {}) => (face, u, v, px, py, xx, r) => {
      if (face !== 't') return 0;
      const DK = C.deck;
      let b = 0.58 + v * 0.1 + (hash2(px >> 1, py, 5) - 0.5) * 0.08;
      if (((xx + (r >> 2) * 3) % L(16)) === 0) b -= 0.1;
      if (r % Math.max(3, L(5)) === 0) b -= 0.06;
      if (r === 0) b = 0.94; else if (r === 1) b = 0.8;
      const n = vnoise(px * 0.07, py * 0.14, op.seed || 9);
      if (n > 0.66) b -= 0.1; else if (n < 0.22) b += 0.06;
      if (hash2(px, py, 21) < 0.02) b -= 0.18;
      return DK[ix(DK, b)];
    };
    /** Cilindro vertical: franja especular, sombra de núcleo, luz reflejada, bandas curvas, domo o tapa */
    function cylV(X, Z, Y, r, h, Pn, op = {}) {
      const [cx, cy] = P(X, Z, Y), ry = Math.max(1, Math.round(r * 0.42)), w = 2 * r + 1;
      const BD = op.band || C.band, top = cy - h;
      for (let i = 0; i < w; i++) {
        const f = i / (w - 1), e = Math.round(ry * Math.sqrt(Math.max(0, 1 - ((i - r) / (r + 0.5)) ** 2))), b0 = prof(f);
        for (let yy = top + e; yy <= cy + e; yy++) {
          const hb = cy + e - yy;
          let b = b0, P2 = Pn;
          if (op.bands) for (const bd of op.bands) if (hb >= bd[0] && hb < bd[0] + bd[1]) { P2 = bd[2] || BD; if (hb === bd[0] + bd[1] - 1) b = Math.min(1, b + 0.12); if (hb === bd[0]) b -= 0.1; }
          if (op.seams && hb > 2 && hb % op.seams === 0 && P2 === Pn) b -= 0.1;
          if (op.stain && hb < h * 0.3 && hash2((cx + i) >> 1, yy >> 1, 4) < 0.25 && b > 0.4) b -= 0.12;
          if (hb <= 0) b = Math.min(b, 0.25);
          put(cx - r + i, yy, P2[ix(P2, b)]);
        }
        put(cx - r + i, cy + e + 1, INK);
      }
      if (op.dome) {
        const dh = Math.max(1, Math.round(r * op.dome));
        ell(cx + 0.5, top + 0.5, r + 0.5, dh + ry * 0.4, (nx, ny) => ny > 0.35 ? 0 : Pn[ix(Pn, clamp(0.72 - nx * 0.42 - ny * 0.3, 0.2, 1))]);
        ell(cx + 0.5, top + 0.5, r + 0.5, ry + 0.5, (nx, ny) => ny < 0 ? 0 : Pn[ix(Pn, clamp(0.64 - nx * 0.36, 0.2, 0.95))]);
        // costura del domo
        for (let i = 0; i < w; i++) { const e = Math.round(ry * Math.sqrt(Math.max(0, 1 - ((i - r) / (r + 0.5)) ** 2))); const c = get(cx - r + i, top + e); if (c >>> 24) put(cx - r + i, top + e, V.shU(c, -0.18, 230)); }
        return { cx, top: top - dh, base: cy };
      }
      ell(cx + 0.5, top + 0.5, r + 0.5, ry + 0.5, (nx, ny, d) => Pn[ix(Pn, d > 0.6 && ny > 0 ? 0.6 : ny < -0.25 ? 0.97 : 0.84 - nx * 0.1)]);
      return { cx, top: top - ry, base: cy };
    }
    /** Tubo de presión horizontal a lo largo de X (membranas, tambores): bandas, costuras, tapa izquierda */
    function tubeX(X0, X1, Z, Yc, r, Pn, op = {}) {
      const [sx0, sy] = P(X0, Z, Yc), sx1 = sx0 + (X1 - X0), t = 2 * r + 1, BD = op.band || C.band;
      for (let j = 0; j < t; j++) {
        const b0 = prof(j / (t - 1));
        for (let px = sx0; px <= sx1; px++) {
          const q = px - sx0; let P2 = Pn, b = b0;
          if (op.bands) for (const bx of op.bands) if (q >= bx && q < bx + (op.bandW || 2)) { P2 = BD; }
          if (op.seams && q % op.seams === 0) b -= 0.1;
          if (px === sx1) b -= 0.15;
          put(px, sy - r + j, P2[ix(P2, b)]);
        }
      }
      for (let px = sx0; px <= sx1; px++) put(px, sy + r + 1, INK);
      ell(sx0 + 0.5, sy + 0.5, Math.max(1, r * 0.45), r + 0.5, (nx, ny, d) => (op.capRamp || BD)[ix(op.capRamp || BD, d > 0.55 ? 0.35 - ny * 0.2 : 0.78 - ny * 0.3 - nx * 0.1)]);
      if (op.capR) ell(sx1 + 0.5, sy + 0.5, Math.max(1, r * 0.4), r + 0.5, (nx, ny) => nx < 0 ? 0 : BD[ix(BD, 0.42 - ny * 0.2)]);
      return { sx0, sx1, sy };
    }
    /** Tubería gruesa por polilínea 3D (tramos según X, Y o Z): sombreado por normal, codos, bridas, soportes */
    function pipe3(pts3, r, Pn, op = {}) {
      const pts = pts3.map(([X, Z, Y]) => P(X, Z, Y));
      const ink = op.ink ?? Pn[0];
      for (let i = 0; i + 1 < pts.length; i++) seg(pts[i], pts[i + 1], r, Pn, ink, op, pts3[i], pts3[i + 1]);
      for (let i = 1; i + 1 < pts.length; i++) {
        const [cx, cy] = pts[i];
        ell(cx + 0.5, cy + 0.5, r + 1.6, r + 1.6, (nx, ny, d) => d > 0.8 ? ink : Pn[ix(Pn, clamp(0.62 + (-nx * 0.6 - ny * 0.8) * 0.42, 0.15, 1))]);
        if (op.elbowRing !== false && r >= 2) ell(cx + 0.5, cy + 0.5, r + 1.6, r + 1.6, (nx, ny, d) => (d > 0.58 && d < 0.74 && (-nx * 0.6 - ny * 0.8) > 0.1) ? Pn[ix(Pn, 0.98)] : 0);
      }
      return pts;
    }
    function seg(a, b, r, Pn, ink, op, A3, B3) {
      const [ax, ay] = a, [bx, by] = b, dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
      let nx = -uy, ny = ux; if (nx * LT[0] + ny * LT[1] < 0) { nx = -nx; ny = -ny; }
      const x0 = Math.floor(Math.min(ax, bx) - r - 3), x1 = Math.ceil(Math.max(ax, bx) + r + 3), y0 = Math.floor(Math.min(ay, by) - r - 3), y1 = Math.ceil(Math.max(ay, by) + r + 3);
      const fl = op.flange || 0, fw = r >= 3 ? 2 : 1;
      for (let py = y0; py <= y1; py++) for (let px = x0; px <= x1; px++) {
        const qx = px - ax, qy = py - ay, tt = qx * ux + qy * uy, dd = qx * nx + qy * ny;
        if (tt < -0.5 || tt > len + 0.5) continue;
        const ad = Math.abs(dd);
        const inFl = fl && tt > 3 && tt < len - 3 && ((tt + fl * 0.5) % fl) < fw;
        const rr = inFl ? r + 1 : r;
        if (ad <= rr + 0.5) {
          let bb = prof(clamp((r - dd) / (2 * r), 0, 1));
          if (inFl) bb = ((tt + fl * 0.5) % fl) < 1 ? Math.min(1, bb + 0.18) : bb - 0.24;
          if (op.core && ad <= 0.6) bb = Math.max(bb, op.core);
          put(px, py, Pn[ix(Pn, bb)]);
        } else if (ad <= rr + 1.5) put(px, py, ink);
      }
      // soportes bajo tramos según X
      if (op.supports && A3 && B3 && A3[2] === B3[2] && A3[1] === B3[1] && A3[0] !== B3[0]) {
        const Xa = Math.min(A3[0], B3[0]), Xb = Math.max(A3[0], B3[0]);
        for (let X = Xa + op.supports * 0.5; X < Xb - 3; X += op.supports) {
          const [px, pt] = P(X, A3[1], A3[2] - r - 1), [, pbm] = P(X, A3[1], op.supportY ?? 0);
          for (let yy = pt; yy <= pbm; yy++) { put(px, yy, C.steel[7]); put(px + 1, yy, C.steel[4]); put(px + 2, yy, C.steel[2]); }
          for (let q = -2; q <= 4; q++) { put(px + q, pbm + 1, C.steel[1]); put(px + q, pt, C.steel[q < 1 ? 8 : 5]); }
          for (let q = -1; q <= 3; q++) put(px + q, pbm + 2, INK);
        }
      }
    }
    /** Barandilla amarilla a lo largo de X (postes cada 6) */
    function railX(X0, X1, Z, Y, h = L(6), op = {}) {
      const RL = C.rail, step = op.step || Math.max(3, L(6));
      for (let X = X0; X <= X1; X++) {
        const [px, py] = P(X, Z, Y + h);
        put(px, py, RL[(X % 7 === 0) ? 6 : 5]); put(px, py + 1, RL[2]);
        if (h > 4) put(px, py + Math.round(h / 2), RL[4]);
        if ((X - X0) % step === 0) for (let q = 1; q < h; q++) { put(px, py + q, RL[q < 2 ? 5 : 3]); put(px + 1, py + q, RL[1]); }
      }
    }
    /** Barandilla según Z (diagonal) */
    function railZ(X, Z0, Z1, Y, h = L(6)) {
      const RL = C.rail;
      for (let Z = Z0; Z <= Z1; Z += 0.5) {
        const [px, py] = P(X, Z, Y + h);
        put(px, py, RL[5]); put(px, py + 1, RL[2]); if (h > 4) put(px, py + Math.round(h / 2), RL[3]);
        if (Math.round(Z * 2) % 10 === 0) for (let q = 1; q < h; q++) { put(px, py + q, RL[3]); put(px + 1, py + q, RL[1]); }
      }
    }
    /** Pasarela de rejilla (losa fina con patrón) */
    function grate(X, Z, Y, w, d) {
      const SP = C.steel;
      box(X, Z, Y, w, d, Math.max(1, L(2)), (face, u, v, px, py, a, bb) => face === 't' ? SP[((a % 3 === 0) || (bb % 2 === 0)) ? 3 : 6] : face === 'f' ? SP[v < 0.5 ? 7 : 3] : SP[2]);
    }
    /** Escalera de mano vertical */
    function ladder(X, Z, Y0, Y1) {
      const SP = C.steel;
      for (let Y = Y0; Y <= Y1; Y++) { const [px, py] = P(X, Z, Y); put(px, py, SP[7]); put(px + L(3), py, SP[4]); if (Y % 3 === 0) { put(px + 1, py, SP[6]); put(px + 2, py, SP[5]); } }
    }
    function valve(X, Z, Y) {
      const [px, py] = P(X, Z, Y), RD = C.red;
      for (let q = 1; q <= S(3); q++) { put(px, py - q, C.steel[7]); put(px + 1, py - q, C.steel[4]); }
      const wy = py - S(3) - 1;
      for (let q = -S(2); q <= S(2); q++) { put(px + q, wy, RD[q < 0 ? 6 : 4]); put(px + q, wy + 1, RD[2]); }
    }
    function gauge(X, Z, Y) {
      const [px, py] = P(X, Z, Y);
      ell(px + 0.5, py + 0.5, S(2) + 0.5, S(2) + 0.5, (nx, ny, d) => d > 0.6 ? (nx + ny < 0 ? C.steel[9] : C.steel[3]) : U(ny < -0.2 ? '#ffffff' : '#e6eef2'));
      put(px + 1, py, U('#c0242a'));
    }
    const leds = [], lamps = [], glints = [];
    function led(X, Z, Y, col) { const [px, py] = P(X, Z, Y); put(px, py, U(col)); leds.push([px, py, col]); }
    function lamp(X, Z, Y, h) {
      const SP = C.steel, [px, py] = P(X, Z, Y);
      for (let q = 0; q < h; q++) { put(px, py - q, SP[8]); if (s >= 0.8) put(px + 1, py - q, SP[4]); }
      const hy = py - h;
      for (let q = -1; q <= S(3); q++) put(px + q, hy, SP[q < 1 ? 9 : 5]);
      for (let q = 1; q <= S(3); q++) put(px + q, hy + 1, U('#fff4c0'));
      put(px + S(3), hy + 1, U('#ffe08a'));
      lamps.push([px + Math.max(1, S(2)), hy + 2, S(5)]);
    }
    /** Operario (8–10 px): casco, cara, chaleco con franja reflectante, pantalón, botas */
    function worker(X, Z, Y, seed, op = {}) {
      if (!workers) return;
      const [px, py] = P(X, Z, Y), r = RNG(seed);
      const helm = U(V.hzc(r.pick(['#f6c832', '#f8f6ee', '#f6c832', '#ff8a2a']), k)), helmD = V.shU(helm, -0.35, 30);
      const vest = U(V.hzc(r.pick(['#f06a20', '#f06a20', '#1ebd9a', '#d8e030']), k)), vestD = V.shU(vest, -0.35, 330);
      const skin = U(V.hzc(r.pick(['#e8a878', '#c47a4a', '#8a5030', '#f0c098']), k)), skinD = V.shU(skin, -0.3, 10);
      const pant = U(V.hzc(r.pick(['#24305a', '#2e3a48', '#3a3a50']), k)), boot = U('#2a1a12'), refl = U('#f4f2e4');
      const f = op.dir || (r() < 0.5 ? 1 : -1), big = s >= 0.85;
      const X0 = px - 2, Y0 = py - (big ? 10 : 8);
      const pix = (dx, dy, u) => put(X0 + (f > 0 ? dx : 4 - dx), Y0 + dy, u);
      // casco
      pix(1, 0, helm); pix(2, 0, helm); pix(3, 0, helmD); pix(0, 1, helm); pix(1, 1, helm); pix(2, 1, helm); pix(3, 1, helmD); pix(4, 1, helmD);
      // cara
      pix(1, 2, skin); pix(2, 2, skin); pix(3, 2, skinD); if (big) { pix(1, 3, skin); pix(2, 3, skinD); pix(3, 3, skinD); }
      const t0 = big ? 4 : 3;
      for (let yy = 0; yy < 3; yy++) for (let xx = 0; xx < 5; xx++) { if ((xx === 0 || xx === 4) && yy === 2) continue; pix(xx, t0 + yy, yy === 1 ? refl : xx >= 3 ? vestD : vest); }
      if (op.tablet) { pix(4, t0 + 1, U('#7ff0ff')); pix(4, t0, U('#2a3a50')); }
      const l0 = t0 + 3;
      pix(1, l0, pant); pix(3, l0, pant); if (big) { pix(1, l0 + 1, pant); pix(3, l0 + 1, pant); }
      pix(1, l0 + (big ? 2 : 1), boot); pix(3, l0 + (big ? 2 : 1), boot); pix(0, l0 + (big ? 2 : 1), boot);
    }
    /** Balsa abierta de hormigón con agua (floculación / remineralización): borde, paredes internas, lámina de agua */
    function basin(X, Z, Y, w, d, depthW, waterRamp) {
      const rim = Math.max(1, L(2));
      // borde del vaso (sobre la cubierta)
      box(X, Z, Y, w, d, Math.max(1, L(3)), concrete(Math.max(1, L(3)), { wet: 0, bh: 99, top: flat(C.conc, 0.6, 0.86, 0.4, 0.05, 31) }));
      const [fx, fy] = P(X, Z, Y + Math.max(1, L(3)));
      const rt = Math.round(d * ZY), WR = waterRamp || C.sea;
      for (let r = rim; r < rt - rim; r++) {
        const sh = Math.round(((r + 0.5) / ZY) * ZX), py = fy - 1 - r;
        for (let xx = rim; xx < w - rim; xx++) {
          const px = fx + xx + sh;
          // pared interior del fondo (iluminada) y pared izquierda (sombra); lámina de agua
          const backWall = r >= rt - rim - depthW, leftWall = xx < rim + Math.round(depthW * 0.6);
          let u;
          if (backWall) u = C.conc[ix(C.conc, 0.7 - (rt - rim - r) * 0.02)];
          else if (leftWall) u = C.conc[ix(C.conc, 0.3)];
          else {
            let b = 0.5 + (r / rt) * 0.25 + (hash2(px >> 1, py, 41) - 0.5) * 0.08;
            if (r < rim + 2) b -= 0.18;                                          // sombra del borde frontal
            const wave = Math.sin(px * 0.55 + py * 1.7) + Math.sin(px * 0.21 - py * 0.9);
            if (wave > 1.55) b += 0.28; else if (wave < -1.6) b -= 0.12;
            u = WR[ix(WR, b)];
            if (wave > 1.7 && hash2(px, py, 43) < 0.5) glints.push([px, py, 2]);
          }
          put(px, py, u);
        }
      }
    }
    /** Sombra arrojada sobre la cubierta: paralelogramo a la derecha-atrás del objeto + oclusión de contacto */
    function shadow(X0, X1, Z0, Z1, Y, hgt) {
      const ext = hgt * 0.55, extZ = hgt * 0.22;
      const poly = [P(X0 + 1, Z0, Y), P(X1 + ext, Z0, Y), P(X1 + ext, Z1 + extZ, Y), P(X0 + 1, Z1 + extZ, Y)];
      let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9; for (const [a, b] of poly) { mnx = Math.min(mnx, a); mxx = Math.max(mxx, a); mny = Math.min(mny, b); mxy = Math.max(mxy, b); }
      for (let py = Math.floor(mny); py <= Math.ceil(mxy); py++) for (let px = Math.floor(mnx); px <= Math.ceil(mxx); px++) {
        if (px < 0 || py < 0 || px >= TW || py >= TH || !deck[py * TW + px]) continue;
        let inside = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside; }
        if (inside) { darken(px, py, -0.2); deck[py * TW + px] = 2; }
      }
      for (let X = X0 - 1; X <= X1 + 1; X++) { const [px, py] = P(X, Z0, Y); darken(px, py, -0.22); darken(px, py - 1, -0.12); }
    }
    const anchors = {};
    const perm3 = [], sea3 = [], pre3 = [], pow3 = [];
    const pm = (pts, r) => { const p = pipe3(pts, r, C.perm, { flange: L(14), core: 0.95, ink: C.perm[1] }); perm3.push({ pts, r }); return p; };

    /* ================= 1. ESTRUCTURAS DE HORMIGÓN (atrás → delante) ================= */
    const FH = L(30), DX0 = fromIntake ? L(64) : L(6), DX1 = L(262), DZ = L(46), DY = FH;
    const JX0 = L(0), JX1 = L(86), JZ = L(16), JY = L(17), JT = L(6);
    const BX0 = L(222), BX1 = L(326), BZ = L(24), BD = L(30), BH = FH + L(14), BY = BH;
    const SX0 = DX0 - L(8), SX1 = DX0 + L(46);
    // 1a. espigón de captación sobre pilotes (atrás-izquierda)
    if (fromIntake) {
      for (let X = JX0; X < JX1; X++) for (let Y = 0; Y < JY - JT; Y++) { const [px, py] = P(X, JZ, Y); put(px, py, C.navy[ix(C.navy, 0.12 + (Y / JY) * 0.3)]); }
      for (let X = JX0 + L(4); X < JX1 - 2; X += L(15)) box(X, JZ + L(2), 0, S(5), L(6), JY - JT, concrete(JY - JT, { bw: 99, bh: 99, wet: L(4), seed: X, lEdge: true }));
      box(JX0, JZ, JY - JT, JX1 - JX0, L(30), JT, concrete(JT, { bw: L(18), bh: 99, wet: 0, seed: 5, lEdge: true, top: deckPaint({ seed: 4 }) }), { deck: true });
    }
    // 1b. balsa principal: muro masivo de bloques con cubierta de losas
    box(DX0, 0, 0, DX1 - DX0, DZ, FH, concrete(FH, { seed: 3, lEdge: true, top: deckPaint({ seed: 9 }) }), { deck: true });
    // 1c. bloque elevado de AGUA POTABLE: parte baja en el agua (a la derecha) + parte alta sobre la cubierta
    box(DX1, BZ, 0, BX1 - DX1, BD, FH, concrete(FH, { seed: 17 }), { noTop: true });
    box(BX0, BZ, FH, BX1 - BX0, BD, BH - FH, concrete(BH - FH, { seed: 19, wet: 0, bh: L(14), top: deckPaint({ seed: 8 }) }), { deck: true });
    // 1d. escalón inferior izquierdo (delante) con escalera y jardinera
    box(SX0, -L(9), 0, SX1 - SX0, L(9), L(12), concrete(L(12), { seed: 23, lEdge: true, bh: L(12), top: deckPaint({ seed: 12 }) }), { deck: true });
    for (let q = 0; q < 4; q++) box(SX1 - L(12) + q * L(3), -L(2), L(12) + q * L(4), L(10) - q * L(2), L(2), L(4), flat(C.conc, 0.6, 0.9, 0.4, 0.05, 61 + q));
    // defensas de caucho negras sobre el muro frontal
    for (const X of [L(112), L(176), L(236)]) {
      const [fx, fy] = P(X, -1, L(20)), fw = S(4), fh = L(13);
      for (let yy = 0; yy < fh; yy++) for (let xx = 0; xx < fw; xx++) { const e = (yy === 0 || yy === fh - 1) && (xx === 0 || xx === fw - 1); if (!e) put(fx + xx, fy + yy, C.navy[ix(C.navy, xx === 1 ? 0.55 : xx === 0 ? 0.35 : 0.12)]); }
      for (let xx = -1; xx <= fw; xx++) put(fx + xx, fy - 1, C.steel[xx < 1 ? 9 : 4]);
    }
    /* ================= 2. CAPTACIÓN (espigón) ================= */
    const HX = L(6), HZ = L(22), HW = L(58), HH = L(18), HD = L(16), HY = JY;
    if (fromIntake) {
      shadow(HX, HX + HW, HZ, HZ + HD, HY, HH);
      box(HX, HZ, HY, HW, HD, HH, (face, u, v, px, py, a, b) => {
        const SP = C.steel, G = C.glass;
        if (face === 's') return SP[ix(SP, 0.3 - v * 0.06 + ((a % 3) === 0 ? -0.06 : 0))];
        if (face === 't') return SP[ix(SP, 0.5)];
        if (a % L(14) < 2) return SP[a % L(14) === 0 ? 9 : 3];
        if (b > L(2) && b < L(10)) { const gb = 0.38 + (1 - (b - L(2)) / L(8)) * 0.34 + ((a + b) % 9 === 0 ? 0.3 : 0); return G[ix(G, gb)]; }
        if (b >= HH - L(6)) return SP[ix(SP, (b % 2) ? 0.36 : 0.64)];
        if (b === 0) return SP[10];
        return SP[ix(SP, 0.74 - v * 0.14 + (hash2(px >> 1, py >> 1, 2) - 0.5) * 0.05)];
      });
      // bóveda de cañón de vidrio azul (eje según X): media sección visible, costillas, franja especular y testero
      const RV = HD / 2, vh = L(8), G = C.glass, Zc = HZ + RV;
      for (let th = Math.PI; th >= 0; th -= 0.04) {
        const Z = Zc - RV * Math.cos(th), Y = HY + HH + vh * Math.sin(th);
        const lit = -Math.cos(th) * 0.35 + Math.sin(th) * 0.55;               // normal (−Z hacia el espectador, +Y arriba)
        for (let xx = -1; xx <= HW; xx++) {
          const [px, py] = P(HX + xx, Z, Y), rib = (xx % L(8)) === 0;
          let b = 0.34 + lit * 0.5;
          if (Math.abs(th - 1.95) < 0.12) b = 1;
          put(px, py, rib ? C.steel[th > 1.2 && th < 2.2 ? 10 : 8] : G[ix(G, b)]);
        }
        const [ex, ey] = P(HX + HW, Z, Y); for (let yy = ey; yy <= P(HX + HW, Z, HY + HH)[1]; yy++) put(ex + 1, yy, G[ix(G, 0.22)]);
      }
      // rejillas, puerta, LED
      const [gx, gy] = P(HX + L(40), HZ, HY + L(2));
      for (let yy = 0; yy < L(7); yy++) for (let xx = 0; xx < L(10); xx++) put(gx + xx, gy - yy, xx % 2 ? C.steel[2] : C.steel[7]);
      led(HX + L(4), HZ, HY + L(13), '#17f3f7'); led(HX + HW - L(4), HZ, HY + L(13), '#3fe0a0');
      anchors.captacion = P(HX + HW * 0.45, HZ + RV, HY + HH + vh + L(8));
      // tubería de toma que baja del espigón al mar (turquesa)
      sea3.push(pipe3([[L(16), JZ - 1, HY + L(2)], [L(16), JZ - 1, -L(6)]], S(3), C.sea, { flange: L(10) }));
      anchors.intake = P(L(16), JZ - 1, 0);
      railX(JX0 + 1, JX1 - L(16), JZ, JY, L(5));
      lamp(L(78), JZ + L(2), JY, L(16));
    }
    /* ================= 3. balsa de floculación (vaso abierto con agua) ================= */
    const QX = fromIntake ? L(68) : L(10), QW = L(52), QZ = L(2), QD = L(28);
    basin(QX, QZ, DY, QW, QD, Math.max(2, L(4)));
    /* ================= 4. sombras arrojadas de los equipos sobre la cubierta ================= */
    const TX = fromIntake ? L(102) : L(62), VX = TX + L(12), MX0 = L(170), MX1 = L(248), MZf = L(8), MZb = L(20), MH = L(30), PX = L(150);
    shadow(TX, TX + L(42), L(30), L(38), DY, L(18));
    for (let i = 0; i < 3; i++) shadow(VX + i * L(15) - L(7), VX + i * L(15) + L(7), L(16), L(24), DY, L(40));
    shadow(MX0, MX1, MZf, MZb + L(4), DY, MH);
    shadow(PX - L(2), PX + L(14), L(2), L(8), DY, L(9));
    shadow(L(232), L(262), L(42), L(50), BY, L(16));
    shadow(L(272), L(306), L(28), L(42), BY, L(26));
    /* ================= 5. AGUA POTABLE + REMINERALIZACIÓN (bloque elevado, atrás) ================= */
    for (const [cx, z] of [[L(238), L(44)], [L(252), L(46)]]) {
      cylV(cx, z, BY, S(5), L(16), C.lime, { bands: [[L(11), S(2), C.perm]], seams: L(5) });
      const [tx, ty] = P(cx, z, BY + L(16));
      for (let q = 0; q <= S(4); q++) for (let xx = -S(5) + q; xx <= S(5) - q; xx++) put(tx + xx, ty - q - 1, C.lime[ix(C.lime, 0.86 - ((xx + S(5)) / (2 * S(5))) * 0.36 - q * 0.02)]);
      put(tx, ty - S(4) - 2, C.steel[8]);
    }
    anchors.remin = P(L(245), L(46), BY + L(28));
    cylV(L(290), L(36), BY, S(14), L(24), C.white, { dome: 0.28, bands: [[L(9), S(5), C.perm]], seams: L(6), stain: true });
    for (let q = 0; q < 3; q++) { const [px, py] = P(L(281) + q * L(5), L(36) - S(14) * 0.42, BY + L(19)); put(px, py, C.perm[8]); }
    ladder(L(301), L(30), BY, BY + L(22));
    anchors.potable = P(L(290), L(36), BY + L(24) + L(16));
    pm([[L(276), L(42), BY + L(6)], [L(258), L(42), BY + L(6)]], S(2));
    /* ================= 6. PRETRATAMIENTO ================= */
    // alimentación de agua de mar desde la toma (por detrás de la balsa, con soportes)
    if (fromIntake) sea3.push(pipe3([[HX + HW, L(34), HY + L(8)], [TX - L(6), L(34), HY + L(8)], [TX - L(6), L(34), DY + L(12)], [TX, L(34), DY + L(12)]], S(3), C.sea, { flange: L(12), supports: L(16), supportY: JY }));
    // tambor de tamices horizontal sobre cunas
    for (const q of [L(5), L(32)]) box(TX + q, L(31), DY, S(4), L(6), L(6), flat(C.steel, 0.5, 0.75, 0.3, 0.04, 7));
    tubeX(TX, TX + L(42), L(34), DY + L(12), S(6), C.steel, { bands: [L(6), L(21), L(36)], bandW: S(2), capR: true });
    for (let q = 0; q < 3; q++) valve(TX + L(10) + q * L(11), L(34), DY + L(19));
    // colector superior de los recipientes (detrás)
    pre3.push(pipe3([[VX - L(8), L(28), DY + L(48)], [VX + L(40), L(28), DY + L(48)]], S(2), C.steel, { flange: L(10) }));
    // tres recipientes blancos altos con bandas azules
    for (let i = 0; i < 3; i++) {
      const cx = VX + i * L(15);
      pipe3([[cx, L(24), DY + L(40)], [cx, L(28), DY + L(48)]], S(1), C.steel, {});
      cylV(cx, L(20), DY, S(7), L(40), C.white, { dome: 0.62, bands: [[L(6), S(3)], [L(29), S(2)]], seams: L(9), stain: true });
      for (let yy = L(11); yy < L(27); yy += L(4)) { const [px, py] = P(cx - S(3), L(20), DY + yy); put(px, py, C.white[9]); }
      if (fine) gauge(cx + S(3), L(20) - S(7) * 0.42, DY + L(17));
    }
    anchors.pretrat = P(VX + L(15), L(20), DY + L(40) + L(14));
    /* ================= 7. MEMBRANAS ================= */
    const post = (X, Z) => { for (let Y = DY; Y <= DY + MH; Y++) { const [px, py] = P(X, Z, Y); put(px, py, C.steel[9]); put(px + 1, py, C.steel[5]); put(px + 2, py, C.steel[2]); } };
    const beam = (Z, Y) => { for (let X = MX0; X <= MX1 + 2; X++) { const [px, py] = P(X, Z, Y); put(px, py, C.steel[9]); put(px, py + 1, C.steel[4]); put(px, py + 2, C.steel[1]); } };
    post(MX0, MZb); post(MX1, MZb); beam(MZb, DY + MH);
    for (const yc of [L(9), L(17), L(25)]) tubeX(MX0 + L(4), MX1 - L(3), MZb, DY + yc, S(3), C.memb, { bands: [L(3), L(34), L(66)], bandW: S(2), capR: true });
    for (let Z = MZf; Z <= MZb; Z += 0.25) { const t = (Z - MZf) / (MZb - MZf); const [px, py] = P(MX1, Z, DY + MH * (1 - t)); put(px + 1, py, C.steel[5]); const [qx, qy] = P(MX1, Z, DY + MH * t); put(qx + 1, qy, C.steel[3]); }
    // banco frontal: dos tubos gruesos de presión con tapas y bandas
    for (const yc of [L(7), L(18)]) tubeX(MX0 + L(3), MX1 - L(5), MZf, DY + yc, S(4), C.memb, { bands: [L(2), L(24), L(48), L(68)], bandW: S(2), capR: true });
    // cabezales: alimentación (izquierda, acero-azul) y permeado (derecha, cian)
    pre3.push(pipe3([[MX0 + L(1), MZf - L(1), DY + L(3)], [MX0 + L(1), MZf - L(1), DY + L(22)]], S(2), C.pre, { elbowRing: false }));
    for (const yc of [L(7), L(18)]) { const [px, py] = P(MX0 + L(1), MZf - L(1), DY + yc); for (let q = 0; q < S(3); q++) put(px + 2 + q, py, C.pre[6]); }
    post(MX0, MZf); post(MX1, MZf); beam(MZf, DY + MH);
    for (let Z = MZf; Z <= MZb; Z += 0.5) { const [px, py] = P(MX0, Z, DY + MH); put(px, py, C.steel[9]); const [qx, qy] = P(MX1, Z, DY + MH); put(qx, qy, C.steel[8]); }
    grate(MX0, MZf, DY + MH, MX1 - MX0, MZb - MZf);
    railX(MX0, MX1, MZb, DY + MH + L(2), L(5)); railZ(MX1, MZf, MZb, DY + MH + L(2), L(5)); railX(MX0, MX1, MZf, DY + MH + L(2), L(5));
    ladder(MX1 + L(3), MZf - L(2), DY, DY + MH);
    if (fine) worker(MX0 + L(34), MZf + L(5), DY + MH + L(2), 11, { tablet: true, dir: 1 });
    anchors.membranas = P((MX0 + MX1) / 2, MZb, DY + MH + L(16));
    led(MX0 + L(5), MZf, DY + L(1), '#17f3f7'); led(MX1 - L(7), MZf, DY + L(1), '#f5dc5a'); led(MX1 - L(4), MZf, DY + L(1), '#3fe0a0');
    /* ================= 8. PERMEADO (cian luminoso, delante) ================= */
    // cabezal de permeado → corre por delante → sube junto al bloque → entra al depósito
    pm([[MX1 - L(4), MZf - L(2), DY + L(13)], [L(256), MZf - L(2), DY + L(13)], [L(256), MZf - L(2), BY + L(15)], [L(300), MZf - L(2), BY + L(15)], [L(300), MZf - L(2), BY + L(11)]], S(3));
    // depósito → sale hacia la ciudad (sube por el borde derecho)
    pm([[L(304), L(36), BY + L(10)], [L(320), L(36), BY + L(10)], [L(320), L(36), BY + L(42)], [L(336), L(36), BY + L(42)]], S(3));
    /* ================= 9. BOMBA DE ALTA PRESIÓN + armario eléctrico ================= */
    box(PX - L(3), L(2), DY, L(20), L(7), S(2), flat(C.conc, 0.55, 0.82, 0.35, 0.04, 9));
    tubeX(PX, PX + L(9), L(5), DY + L(6), S(4), C.red, { band: C.red, capRamp: C.red });
    box(PX + L(9), L(3), DY + S(2), L(8), L(6), L(8), flat(C.navy, 0.62, 0.86, 0.36, 0.04, 11));
    for (let q = 0; q < L(6); q += 2) { const [px, py] = P(PX + L(10) + q, L(3), DY + L(7)); put(px, py, C.navy[1]); }
    anchors.bombeo = P(PX + L(6), L(5), DY + L(18));
    led(PX + L(11), L(3), DY + L(6), '#3fe0a0');
    pre3.push(pipe3([[VX + L(36), L(12), DY + L(5)], [PX, L(12), DY + L(5)], [PX, L(5), DY + L(5)]], S(2), C.pre, { flange: L(10), supports: L(14), supportY: DY }));
    pre3.push(pipe3([[PX + L(9), L(5), DY + L(6)], [PX + L(14), L(5), DY + L(6)], [PX + L(14), MZf - L(1), DY + L(6)], [MX0 + L(1), MZf - L(1), DY + L(6)]], S(2), C.pre, { flange: L(8) }));
    const EX = fromIntake ? L(126) : L(122);
    box(EX, L(1), DY, L(9), L(4), L(12), flat(C.navy, 0.62, 0.86, 0.36, 0.05, 13));
    for (let q = 0; q < 3; q++) led(EX + L(2) + q * L(2), L(1), DY + L(9), ['#ffd84a', '#3fe0a0', '#ff5a4a'][q]);
    pow3.push([[EX + L(9), L(1), DY + L(10)], [PX + L(13), L(1), DY + L(10)], [PX + L(13), L(3), DY + L(10)]]);
    for (const pl of pow3) pipe3(pl, 1, C.cable, { elbowRing: false, ink: C.cable[0] });
    /* ================= 10. SALMUERA (grafito-índigo, emisario con boca) ================= */
    const BRX = L(274), BRZ = -L(4);
    pipe3([[MX1 - L(2), MZf + 1, DY + L(3)], [BRX, MZf + 1, DY + L(3)], [BRX, BRZ, DY + L(3)], [BRX, BRZ, L(7)], [L(300), BRZ, L(7)]], S(4), C.brine, { flange: L(11), ink: C.brine[0] });
    const [mx, my] = P(L(300), BRZ, L(7)), mr = S(4) + 1;
    ell(mx + 0.5, my + 0.5, Math.max(1.5, mr * 0.55), mr + 1, (nx, ny, d) => d > 0.5 ? C.brine[ix(C.brine, 0.78 - ny * 0.3)] : U(V.hzc('#2a0a3a', k)));
    ell(mx + 1.5, my + 0.5, Math.max(1, mr * 0.3), mr * 0.6, () => U(V.hzc('#e040c0', k)));
    anchors.salmuera = P(L(300), BRZ, L(12));
    for (const Y of [L(14), L(24)]) { const [px, py] = P(BRX, BRZ, Y); for (let q = -S(5); q <= S(5); q++) put(px + q, py, C.steel[q < 0 ? 9 : 3]); }
    /* ================= 11. barandillas, farolas, operarios, jardinera ================= */
    railX(DX0 + L(2), DX1 - L(4), 0, DY, L(6));
    railX(BX0 + L(44), BX1 - L(4), BZ, BY, L(5));
    railX(QX, QX + QW, QZ - 1, DY + L(3), L(5));
    grate(QX + L(18), QZ, DY + L(4), L(8), QD);
    for (const X of [L(140), L(212)]) lamp(X, L(1), DY, L(18));
    lamp(BX1 - L(6), BZ + L(2), BY, L(15));
    if (fine) { worker(L(138), L(3), DY, 3, { dir: 1 }); worker(QX + L(22), QZ + L(10), DY + L(5), 5, { dir: -1 }); worker(L(266), BZ + L(5), BY, 21, { dir: -1 }); if (fromIntake) worker(L(68), JZ + L(4), JY, 7, { dir: -1 }); }
    const [ppx, ppy] = P(SX0 + L(20), -L(5), L(12));
    for (let xx = -L(5); xx <= L(5); xx++) for (let yy = 0; yy < L(3); yy++) put(ppx + xx, ppy - yy, C.conc[ix(C.conc, yy === L(3) - 1 ? 0.92 : 0.56 - xx * 0.02)]);
    V.palm(T, ppx, ppy - L(3), L(22), -L(2), 77, { k });
    V.shrub(T, ppx - L(9), ppy, S(3), 78, { k }); V.shrub(T, ppx + L(10), ppy + 1, S(3), 79, { k });
    { const [vx, vy] = P(BX1 - L(2), BZ + L(26), BY); V.shrub(T, vx, vy + 1, S(4), 81, { k }); }
    /* ================= 12. espuma y rocío horneados al pie ================= */
    const FO = V.P32(V.hz(RAMP.foamR, k * 0.5));
    const foamPts = [];
    for (let X = (fromIntake ? JX0 : SX0) - L(2); X < BX1 + L(14); X++) {
      const Z = (fromIntake && X < SX0) ? JZ + L(2) : X > DX1 + L(4) ? BZ : (X >= SX0 && X < SX1) ? -L(9) : 0;
      const [px, py] = P(X, Z, 0);
      const crest = Math.max(1, Math.round((Math.sin(X * 0.31) + Math.sin(X * 0.11 + 1.7) * 1.2 + 1.6) * 1.3 * Math.max(0.6, s)));
      for (let q = 0; q <= crest; q++) put(px, py - q, FO[q === crest ? 5 : q >= crest - 1 ? 4 : 3]);
      if (hash2(X, 3, 9) < 0.2) { put(px, py - crest - 2, FO[5]); if (hash2(X, 4, 9) < 0.5) put(px + 1, py - crest - 3, FO[4]); }
      for (let q = 1; q <= 3; q++) put(px, py + q, FO[q === 1 ? 5 : q === 2 ? 3 : 2]);
      if (X % Math.max(4, L(8)) === 0) foamPts.push([px, py]);
    }
    const mxy = [mx, my];
    /* ================= cizalla por columnas y composición ================= */
    const lift = Math.round(A * (TW - 1));
    const dyAt = (px) => -Math.round(A * (TW - 1 - px));
    const ox0 = Math.round(x - TW + L(30)), oy0 = Math.round(yw - WL);
    const tf = (px, py) => [ox0 + px, oy0 + py + dyAt(px)];
    for (let px = 0; px < TW; px++) {
      const dy = dyAt(px), X = ox0 + px; if (X < 0 || X >= pb.w) continue;
      for (let py = 0; py < TH; py++) { const c = D[py * TW + px]; if (!(c >>> 24)) continue; const Y = oy0 + py + dy; if (Y < 0 || Y >= pb.h) continue; pb.data[Y * pb.w + X] = c; }
    }
    const tp = (pts) => pts.map(([a, b]) => tf(a, b));
    const info = {
      x0: ox0, x1: ox0 + TW, y0: oy0 - lift, y1: oy0 + TH,
      anchors: {}, perm: perm3.map(p => tp(p.pts.map(([X, Z, Y]) => P(X, Z, Y)))), permR: perm3.map(p => p.r),
      sea: sea3.map(tp), pre: pre3.map(tp), power: pow3.map(pl => tp(pl.map(([X, Z, Y]) => P(X, Z, Y)))),
      mouth: (() => { const [a, b] = tf(mx, my); return { x: a + 1, y: b, r: mr }; })(),
      leds: leds.map(([a, b, c]) => [...tf(a, b), c]), lamps: lamps.map(([a, b, r]) => [...tf(a, b), r]),
      foam: foamPts.map(([a, b]) => tf(a, b)), glints: glints.filter((_, i) => i % 3 === 0).slice(0, 40).map(([a, b, w]) => [...tf(a, b), w]),
      waterAt: (X) => { const px = clamp(Math.round(X - ox0), 0, TW - 1); return oy0 + WL + dyAt(px); },
      s, k, TW, TH,
    };
    for (const n in anchors) { const [a, b] = tf(anchors[n][0], anchors[n][1]); info.anchors[n] = { x: a, y: b }; }
    info.halo = permHalo(info.perm, info.permR);
    info.haloSea = info.sea.length ? permHalo(info.sea, info.sea.map(() => S(3)), '#11bedd', '#c8f6ff') : null;
    return info;
  }

  /** Halo cian del permeado (anillos sin tramado) horneado en un lienzo que cubre las tuberías */
  function permHalo(polys, radii, col = '#48b6ec', core = '#bff8ff') {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of polys) for (const [a, b] of p) { x0 = Math.min(x0, a); y0 = Math.min(y0, b); x1 = Math.max(x1, a); y1 = Math.max(y1, b); }
    if (x0 > x1) return null;
    const pad = 8; x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
    const w = x1 - x0 + 1, h = y1 - y0 + 1, pb = new PixelBuffer(w, h), cu = U(col) & 0xffffff, ku = U(core) & 0xffffff;
    for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
      let best = 1e9, br = 2;
      for (let pi = 0; pi < polys.length; pi++) {
        const p = polys[pi], r = radii[pi] || 2;
        for (let i = 0; i + 1 < p.length; i++) {
          const ax = p[i][0] - x0, ay = p[i][1] - y0, bx = p[i + 1][0] - x0, by = p[i + 1][1] - y0;
          const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1, t = clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1);
          const d = Math.hypot(px - (ax + dx * t), py - (ay + dy * t)) - r;
          if (d < best) { best = d; br = r; }
        }
      }
      let a = 0, u = cu;
      if (best <= -br + 0.6) { a = 0.42; u = ku; } else if (best <= 0.5) a = 0.12;
      else if (best <= 1.6) a = 0.46; else if (best <= 3.2) a = 0.26; else if (best <= 5) a = 0.12;
      if (a) pb.data[py * w + px] = ((Math.round(a * 255) << 24) | u) >>> 0;
    }
    return { c: pb.toCanvas(), x: x0, y: y0 };
  }
  /** Halo amarillo de una línea eléctrica (cacheado por geometría) */
  const _ph = new Map();
  function powerHalo(pts, r = 1) {
    const key = JSON.stringify(pts) + r; let v = _ph.get(key);
    if (!v) { v = permHalo([pts], [r], '#ffd84a', '#fff4b0'); _ph.set(key, v); }
    return v;
  }
  /** Chevrones que avanzan por una polilínea (≈3 fillRect por chevrón visible) */
  function drawChevrons(g, pts, ox, oy, t, o = {}) {
    const sp = o.speed ?? 20, gap = o.gap ?? 10, col = o.col || '#ffffff';
    g.fillStyle = col;
    let acc = 0;
    for (let i = 0; i + 1 < pts.length; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], len = Math.hypot(x1 - x0, y1 - y0) || 1;
      const ux = (x1 - x0) / len, uy = (y1 - y0) / len, horiz = Math.abs(ux) >= Math.abs(uy);
      const sx = Math.sign(ux) || 1, sy = Math.sign(uy) || 1;
      let d = (((acc - t * sp) % gap) + gap) % gap;
      for (; d < len - 1; d += gap) {
        const cx = Math.round(x0 + ux * d + ox), cy = Math.round(y0 + uy * d + oy);
        if (cx < -4 || cx > W + 4 || cy < -4 || cy > H + 4) continue;
        if (horiz) { g.fillRect(cx - sx, cy - 1, 1, 1); g.fillRect(cx, cy, 1, 1); g.fillRect(cx - sx, cy + 1, 1, 1); if (o.bold) { g.fillRect(cx - 2 * sx, cy - 1, 1, 1); g.fillRect(cx - sx, cy, 1, 1); g.fillRect(cx - 2 * sx, cy + 1, 1, 1); } }
        else { g.fillRect(cx - 1, cy - sy, 1, 1); g.fillRect(cx, cy, 1, 1); g.fillRect(cx + 1, cy - sy, 1, 1); if (o.bold) { g.fillRect(cx - 1, cy - 2 * sy, 1, 1); g.fillRect(cx, cy - sy, 1, 1); g.fillRect(cx + 1, cy - 2 * sy, 1, 1); } }
      }
      acc += len;
    }
  }

  /* =================================================================
     Pluma de salmuera: tira prerenderizada (cae, se hunde, se diluye)
     ================================================================= */
  const _strips = new Map();
  function plumeStrip(o = {}) {
    const mode = o.mode || 'under', n = o.n || 16, s = o.s || 1;
    const w = o.w || Math.round((mode === 'under' ? 130 : 64) * s), h = o.h || Math.round((mode === 'under' ? 64 : 26) * s);
    const bo = o.bedOff || null;
    const key = [mode, n, w, h, o.seed || 1, o.bed || 0, s, o.k || 0, bo ? bo.join(',') : ''].join('|'); let st = _strips.get(key); if (st) return st;
    const r = RNG(o.seed || 7), M = o.count || Math.round((mode === 'under' ? 340 : 150) * Math.max(0.5, s));
    const bed = o.bed ?? (h - 3), surf = o.surf ?? Math.round(4 * s);
    const hz = (c) => U(V.hzc(c, o.k || 0));
    // chorro saturado → magenta → violeta → azul (dilución)
    const COLS = [hz('#fff2fc'), hz('#ffb0ec'), hz('#ff5ad8'), hz('#f22ec4'), hz('#d42ab0'), hz('#b0309e'), hz('#8a3490'), hz('#6a3c9c'), hz('#5248aa'), hz('#4a5cb6')];
    const parts = [];
    for (let i = 0; i < M; i++) parts.push({ b: r(), vx: (0.35 + r() * 0.9) * 30 * s, vy0: (r() - 0.3) * 14 * s, sp: r(), ph: r() * TAU, sz: r(), dr: (r() - 0.5) * 2 });
    const P_ = 2.4; // periodo del bucle (s)
    const g = 70 * s, tBed = (p) => Math.sqrt(2 * Math.max(4, bed - p.sp * 7 * s) / g);
    if (mode === 'cloud') {
      /* Pluma densa en racimos (sin tramado): chorro casi blanco en la boca → nube magenta saturada
         que cae curvándose aguas abajo → capa violeta pegada al lecho que se aleja y se diluye hacia
         el azul. Ruido de valor animado en bucle sin costura (fundido entre dos fases). */
      const sd = (o.seed || 7) * 13, Pn = Math.max(24, bed), drift = o.drift ?? 0.55;
      const NZ = (x, y, ph) => vnoise(x * 0.17, (y - ph * Pn) * 0.17, sd) * (1 - ph) + vnoise(x * 0.17, (y - (ph - 1) * Pn) * 0.17, sd) * ph;
      const NZ2 = (x, y, ph) => vnoise((x - ph * 40) * 0.12, y * 0.3, sd + 5) * (1 - ph) + vnoise((x - (ph - 1) * 40) * 0.12, y * 0.3, sd + 5) * ph;
      // chorro horizontal que se curva al caer (x ∝ √y) + arrastre aguas abajo
      const xc = (y) => { const u = y / bed; return Math.round(s * (3 + 16 * Math.sqrt(u)) + Math.pow(u, 1.6) * bed * drift * 0.6); };
      st = V.strip(n, w, h, (pb, f) => {
        const ph = f / n;
        // 1) columna que cae
        for (let y = 0; y <= bed; y++) {
          const u = y / bed, c = xc(y), hw = (3.2 + Math.sqrt(u) * 9 + u * 9 + Math.sin(y * 0.21 + ph * TAU) * 1.4) * s;
          for (let x = Math.floor(c - hw); x <= Math.ceil(c + hw); x++) {
            if (x < 0 || x >= w) continue;
            const d = 1 - Math.abs(x - c) / (hw + 0.5), v = NZ(x, y, ph) * 0.58 + d * 0.78 - u * 0.1;
            if (y < 3 * s && d > 0.25) { V.blend(pb, x, y, COLS[y < 1.5 * s ? 0 : 1], 0.95); continue; }
            if (v > 1.0) V.blend(pb, x, y, COLS[u < 0.4 ? 1 : 2], 0.95);
            else if (v > 0.82) V.blend(pb, x, y, COLS[2], 0.93);
            else if (v > 0.64) V.blend(pb, x, y, COLS[u < 0.5 ? 3 : 4], 0.88);
            else if (v > 0.5) V.blend(pb, x, y, COLS[5], 0.72 - u * 0.15);
            else if (v > 0.38) V.blend(pb, x, y, COLS[6], 0.42 - u * 0.1);
            else if (v > 0.3 && d > 0.05) V.blend(pb, x, y, COLS[7], 0.22);
          }
        }
        // 2) capa de fondo (más densa que el agua): se arrastra y se diluye magenta → violeta → azul
        const x0b = xc(bed) - Math.round(10 * s);
        for (let x = Math.max(0, x0b); x < w; x++) {
          const u = (x - x0b) / Math.max(1, w - x0b), bx = bed + (bo ? (bo[clamp(x, 0, bo.length - 1)] || 0) : 0);
          const thick = (13 - u * 9 + (vnoise(x * 0.09, ph * 3, sd + 9) - 0.5) * 5) * s;
          for (let y = Math.round(bx - thick); y <= bx + 2; y++) {
            if (y < 0 || y >= h) continue;
            const q = (bx + 2 - y) / (thick + 2), v = NZ2(x, y, ph) * 0.7 + (1 - q) * 0.55 - u * 0.42;
            const ci = u < 0.25 ? 3 : u < 0.45 ? 4 : u < 0.62 ? 6 : u < 0.8 ? 7 : 8;
            if (v > 0.62) V.blend(pb, x, y, COLS[Math.max(2, ci - 1)], 0.9 - u * 0.45);
            else if (v > 0.46) V.blend(pb, x, y, COLS[ci], 0.75 - u * 0.4);
            else if (v > 0.34) V.blend(pb, x, y, COLS[Math.min(9, ci + 1)], 0.42 - u * 0.25);
          }
        }
        // 3) grumos sueltos que se desprenden (racimos de 2×2)
        for (let i = 0; i < 26; i++) {
          const b = hash1(i, sd), a = ((ph + b) % 1), side = hash1(i, sd + 1);
          const y = Math.round(a * bed), x = Math.round(xc(y) + (side - 0.5) * (6 + a * 26) * s + a * 6 * s);
          const cc = COLS[a < 0.3 ? 1 : a < 0.6 ? 3 : 5], al = 0.9 - a * 0.5;
          for (let yy = 0; yy < 2; yy++) for (let xx = 0; xx < 2; xx++) V.blend(pb, x + xx, y + yy, cc, al);
        }
      });
      st.mode = mode; _strips.set(key, st); return st;
    }
    st = V.strip(n, w, h, (pb, f) => {
      const tt = (f / n) * P_;
      if (mode === 'under') {
        // capa densa que se pega al fondo y se aleja diluyéndose
        for (let x = 0; x < w; x++) {
          const u = x / w, top = Math.round(bed - (2 + u * 7) * s - Math.sin(x * 0.18 + f * 0.39) * 1.3), thick = Math.round((3 + u * 8) * s);
          for (let y = Math.max(0, top); y < Math.min(h, top + thick); y++) V.blend(pb, x, y, COLS[u < 0.3 ? 4 : u < 0.6 ? 6 : 8], (0.42 - u * 0.3) * (1 - (y - top) / (thick + 2) * 0.5));
        }
        // cono del chorro que cae desde la boca hasta el lecho
        for (let y = 0; y < bed; y++) {
          const u = y / bed, x0 = Math.round(u * u * 16 * s), x1 = Math.round(6 * s + u * 26 * s + Math.sin(y * 0.3 + f * 0.8) * 1.5);
          for (let x = x0; x <= x1; x++) V.blend(pb, x, y, COLS[u < 0.25 ? 3 : u < 0.6 ? 4 : 5], 0.5 - u * 0.28);
        }
      } else {
        for (let x = 0; x < w; x++) {
          const u = x / w, half = Math.round((1.5 + u * 6) * s), cy = surf + Math.round(u * 5 * s);
          for (let y = cy - half; y <= cy + half; y++) V.blend(pb, x, y, COLS[u < 0.4 ? 3 : u < 0.75 ? 5 : 7], (0.55 - u * 0.42) * (1 - Math.abs(y - cy) / (half + 1)));
        }
      }
      for (const p of parts) {
        const age = ((tt - p.b * P_) % P_ + P_) % P_, a = age / P_;
        let x, y;
        if (mode === 'under') {
          const tb = tBed(p);
          if (age < tb) { y = p.vy0 * age * 0.3 + 0.5 * g * age * age; x = p.vx * age * (1 - age / (tb * 2.4)) + Math.sin(p.ph + age * 4) * (0.6 + a * 2) * s; }
          else { const q = age - tb; y = bed - p.sp * 7 * s + Math.sin(p.ph + q * 2) * 1.2 - q * 2 * s; x = p.vx * tb * 0.6 + (10 + p.sp * 18) * s * q + p.dr * q * 6 * s; }
          y = Math.max(0, Math.min(h - 1, y));
        } else {
          x = p.vx * age * (1 - a * 0.4); y = surf + (p.vy0 * 0.2 + 3) * age * 0.6 + Math.sin(p.ph + age * 3) * (0.5 + a * 3) * s + (p.sp - 0.5) * a * 9 * s;
        }
        const ci = clamp(Math.floor(a * 9 + p.sp * 0.8) + (p.sz < 0.14 && a < 0.3 ? -2 : 0), 0, COLS.length - 1);
        const alpha = clamp(1.15 - a * 0.95, 0.15, 1);
        const sz = a < 0.25 ? (p.sz > 0.4 ? 3 : 2) : a < 0.55 ? (p.sz > 0.35 ? 2 : 1) : (p.sz > 0.7 ? 2 : 1);
        const sw = Math.max(1, Math.round(sz * Math.min(1.2, s))), sh = Math.max(1, Math.round((a > 0.5 ? sz - 1 : sz) * Math.min(1.2, s)) || 1);
        for (let yy = 0; yy < sh; yy++) for (let xx = 0; xx < sw + (a > 0.5 ? 1 : 0); xx++) V.blend(pb, Math.round(x) + xx, Math.round(y) + yy, COLS[ci], alpha);
      }
    });
    st.mode = mode; _strips.set(key, st); return st;
  }
  function drawPlume(g, st, x, y, t, a = 1, fps = 6.6) {
    if (!st) return;
    if (a < 1) g.globalAlpha = a;
    V.drawStrip(g, st, Math.floor(t * fps), Math.round(x), Math.round(y) - (st.mode === 'surface' ? Math.round(st.h * 0.25) : 0));
    g.globalAlpha = 1;
  }

  /* =================================================================
     Efectos vivos de la planta (por cuadro)
     ================================================================= */
  function drawFx(g, I, ox, oy, t, o = {}) {
    if (!I) return;
    // halo pulsante del permeado (1 drawImage, modo 'lighter')
    g.globalCompositeOperation = 'lighter';
    if (I.halo) { g.globalAlpha = 0.66 + 0.3 * Math.sin(t * 2.4); g.drawImage(I.halo.c, I.halo.x + ox, I.halo.y + oy); }
    if (I.haloSea) { g.globalAlpha = 0.32 + 0.1 * Math.sin(t * 1.7 + 1); g.drawImage(I.haloSea.c, I.haloSea.x + ox, I.haloSea.y + oy); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    // chevrones: permeado blanco 20 px/s, agua de mar y pretratada más tenues, energía amarilla
    if (o.chev !== false) {
      for (const p of I.perm) drawChevrons(g, p, ox, oy, t, { col: '#ffffff', speed: 20, gap: Math.max(7, Math.round(11 * I.s)), bold: I.s >= 0.8 });
      for (const p of I.sea) drawChevrons(g, p, ox, oy, t, { col: '#c8f6ff', speed: 14, gap: 12 });
      for (const p of I.pre) drawChevrons(g, p, ox, oy, t, { col: '#e8f4ff', speed: 12, gap: 13 });
      g.globalAlpha = 0.9; for (const p of I.power) drawChevrons(g, p, ox, oy, t, { col: '#ffe14d', speed: 26, gap: 7 }); g.globalAlpha = 1;
    }
    // LED a 1–2 Hz y farolas
    for (const [x, y, c] of I.leds) if (Math.floor(t * 1.6 + x * 0.13) % 2) { g.fillStyle = c; g.fillRect(x + ox, y + oy, 1, 1); }
    if (o.lamps !== false) for (const [x, y, r] of I.lamps) V.drawGlow(g, x + ox, y + oy, r, '#fff0b0', 0.32 + 0.06 * Math.sin(t * 3 + x));
    // destellos en la lámina de agua de las balsas
    g.fillStyle = '#e8fcff';
    for (let i = 0; i < I.glints.length; i++) { const [x, y, w] = I.glints[i]; if (Math.sin(t * 2.2 + i * 1.7) > 0.55) g.fillRect(x + ox, y + oy, w, 1); }
    // espuma que lame el pie de los muros
    if (o.foam !== false) for (let i = 0; i < I.foam.length; i++) {
      const [x, y] = I.foam[i], ph = Math.sin(t * 2.2 + x * 0.21), up = Math.round((ph + 1) * 1.2);
      g.fillStyle = '#ffffff'; g.fillRect(x + ox, y + oy - up, 5 + Math.round(ph * 2), 1);
      g.fillStyle = '#bde3ed'; g.fillRect(x + ox + 2, y + oy - up + 1, 6, 1);
      if (ph > 0.8) { g.fillStyle = '#ffffff'; g.fillRect(x + ox + 3, y + oy - up - 3, 1, 2); }
    }
    // pluma en la boca del emisario
    if (o.plume) drawPlume(g, o.plume, I.mouth.x + ox, I.mouth.y + oy, t, o.plumeA ?? 1);
  }

  /* =================================================================
     Emisario de salmuera para cortes submarinos del plano jugable (mundo)
     ================================================================= */
  /** Tubería grafito-índigo gruesa con bridas, abrazaderas y bloques de anclaje de hormigón,
      boca abierta con brillo magenta y pluma densa que cae, se pega al lecho y se diluye.
      pts: polilínea ortogonal [[x,y],…] en mundo; el último punto es la boca (mira en la
      dirección del último tramo). o: {r=4, bed (y del lecho bajo la boca), w (largo de la pluma),
      k, seed, anchors:[x…] bloques bajo tramos horizontales, bedAt(x)} → {c,x,y,mouth,strip,dir} */
  function outfall(pts, o = {}) {
    const r = o.r ?? 4, pad = r + 14;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const [a, b] of pts) { x0 = Math.min(x0, a); y0 = Math.min(y0, b); x1 = Math.max(x1, a); y1 = Math.max(y1, b); }
    const bedMax = o.bedAt ? Math.max(...(o.anchors || []).map((a) => o.bedAt(a)), y1 + r + 4) : y1 + r + 10;
    x0 -= pad; y0 -= pad; x1 += pad; y1 = Math.max(y1 + pad, bedMax + 2);
    const w = x1 - x0 + 1, h = y1 - y0 + 1, pb = new PixelBuffer(w, h);
    const L = pts.map(([a, b]) => [a - x0, b - y0]);
    const CN = V.P32(V.hz(PAL.conc, o.k || 0)), BR = V.P32(V.hz(PAL.brine, o.k || 0)), ST = V.P32(V.hz(PAL.steel, o.k || 0));
    // bloques de anclaje (hormigón con algas) bajo los tramos horizontales, apoyados en el lecho
    for (const ax of (o.anchors || [])) {
      const lx = ax - x0, seg = L.findIndex((p, i) => i + 1 < L.length && p[1] === L[i + 1][1] && Math.min(p[0], L[i + 1][0]) <= lx && Math.max(p[0], L[i + 1][0]) >= lx);
      if (seg < 0) continue;
      const py = L[seg][1], top = py + r - 1, bot = (o.bedAt ? o.bedAt(ax) : py + r + 10) - y0 + 1, bw = 2 * r + 4;
      for (let yy = top; yy <= bot; yy++) for (let xx = 0; xx < bw; xx++) {
        const u = xx / (bw - 1), edge = xx === 0 || xx === bw - 1 || yy === bot;
        let b = 0.62 - u * 0.34 - ((yy - top) / Math.max(1, bot - top)) * 0.12;
        if (xx === 1) b += 0.16; if (edge) b = 0.12;
        if (yy > bot - 3 && hash2(xx, yy, ax) < 0.5) { V.put(pb, lx - (bw >> 1) + xx, yy, U(['#2e5232', '#3e6a3a', '#24402a'][(xx + yy) % 3])); continue; }
        V.put(pb, lx - (bw >> 1) + xx, yy, CN[ix(CN, b)]);
      }
    }
    PFInfra.pipe(pb, L, r, 'brine', { flange: o.flange ?? 18 });
    // abrazaderas de acero sobre los tramos
    for (let i = 0; i + 1 < L.length; i++) {
      const [a0, b0] = L[i], [a1, b1] = L[i + 1], len = Math.abs(a1 - a0) + Math.abs(b1 - b0);
      for (let q = 9; q < len - 6; q += 18) {
        const px = a0 + Math.sign(a1 - a0) * q, py = b0 + Math.sign(b1 - b0) * q;
        if (b0 === b1) for (let j = -r - 1; j <= r + 1; j++) { V.put(pb, px + 4, py + j, ST[j < 0 ? 8 : 3]); }
        else for (let j = -r - 1; j <= r + 1; j++) V.put(pb, px + j, py + 4, ST[j < 0 ? 8 : 3]);
      }
    }
    // boca abierta: anillo de brida, interior oscuro y destello magenta
    const [mx, my] = L[L.length - 1], [px_, py_] = L[L.length - 2];
    const dir = Math.sign(mx - px_) || 0, dv = Math.sign(my - py_) || 0;
    if (dir) {
      for (let j = -r - 2; j <= r + 2; j++) { V.put(pb, mx, my + j, BR[Math.abs(j) > r + 1 ? 0 : j < 0 ? 9 : 5]); V.put(pb, mx + dir, my + j, BR[Math.abs(j) > r + 1 ? 0 : j < 0 ? 7 : 3]); }
      for (let j = -r + 1; j <= r - 1; j++) { V.put(pb, mx + 2 * dir, my + j, BR[Math.abs(j) === r - 1 ? 2 : 0]); }
      for (let j = -r + 2; j <= r - 2; j++) V.put(pb, mx + 2 * dir, my + j, U(Math.abs(j) < 2 ? '#ff5ad8' : '#8a2c84'));
    } else {
      for (let j = -r - 2; j <= r + 2; j++) { V.put(pb, mx + j, my, BR[Math.abs(j) > r + 1 ? 0 : j < 0 ? 9 : 5]); V.put(pb, mx + j, my + dv, BR[Math.abs(j) > r + 1 ? 0 : 3]); }
      for (let j = -r + 2; j <= r - 2; j++) V.put(pb, mx + j, my + 2 * dv, U(Math.abs(j) < 2 ? '#ff5ad8' : '#8a2c84'));
    }
    const mouth = { x: x0 + mx + 2 * dir, y: y0 + my + 2 * dv };
    // tinte de profundidad: lo sumergido se funde hacia el azul del agua (sin tramado)
    if (o.water) {
      const wc = U(o.water.col || '#0c5c94');
      for (let py = 0; py < h; py++) {
        const dep = y0 + py - o.water.wy; if (dep <= 0) continue;
        const a = Math.min(o.water.max ?? 0.42, 0.1 + dep / 160);
        for (let px = 0; px < w; px++) { const c = pb.data[py * w + px]; if (c >>> 24) pb.data[py * w + px] = (V.mixU ? V.mixU(c, wc, a) : c); }
      }
    }
    const bed = Math.round((o.bed ?? (mouth.y + 60)) - mouth.y);
    const pw = o.w || 150, bedOff = o.bedAt ? Array.from({ length: pw }, (_, i) => Math.round(o.bedAt(mouth.x + (dir || 1) * i) - mouth.y - bed)) : null;
    const strip = plumeStrip({ mode: o.mode || 'cloud', w: pw, h: bed + 10 + (bedOff ? Math.max(0, ...bedOff) : 0), bed, bedOff, s: o.s || 1.15, seed: o.seed || 21, k: o.k || 0, count: o.count, drift: o.drift });
    return { c: pb.toCanvas(), x: x0, y: y0, mouth, strip, dir: dir || 1, glow: PFK.glow(7, '#ff5ad8', 4) };
  }
  /** Dibuja el emisario y su pluma animada (2–3 drawImage). o.pipe=false solo pluma; o.plume=false solo tubería */
  function drawOutfall(g, O, ox, oy, t, o = {}) {
    if (!O) return;
    const sx = O.x - ox, sy = O.y - oy;
    if (sx > W + 160 || sx + O.c.width < -160) return;
    if (o.plume !== false) {
      const a = o.a ?? 1;
      if (a < 1) g.globalAlpha = a;
      V.drawStrip(g, O.strip, Math.floor(t * 6.6), Math.round(O.mouth.x - ox - (O.dir < 0 ? O.strip.w : 0)), Math.round(O.mouth.y - oy - 1), O.dir < 0);
      g.globalAlpha = 1;
    }
    if (o.pipe === false) return;
    g.drawImage(O.c, Math.round(sx), Math.round(sy));
    // resplandor magenta pulsante en la boca
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5 + 0.2 * Math.sin(t * 3.1);
    g.drawImage(O.glow, Math.round(O.mouth.x - ox - 7 + O.dir * 2), Math.round(O.mouth.y - oy - 7));
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }

  return { hero, drawFx, plumeStrip, drawPlume, drawChevrons, permHalo, powerHalo, outfall, drawOutfall, PAL, prof };
})();

/** Colocación de la planta protagonista en el plano costero (0,5) del Nivel 1 (1c_bio_coast.js):
    pie frontal derecho en x de plano, escala y pendiente del diorama. */
const R2PLANT_L1 = { x: 730, s: 0.95, slope: 0.03 };

/* Banco de pruebas: ?test=scene&s=R2PLANT_TEST&p={"s":1,"z":1} */
const R2PLANT_TEST = {
  enter(p) {
    this.p = p || {}; this.t = 0;
    const t0 = nowMs();
    const pb = new PixelBuffer(W, H);
    pb.rect(0, 0, W, 200, '#5aa8ee'); pb.rect(0, 200, W, 160, '#0f98c8');
    for (let y = 200; y < H; y++) for (let x = 0; x < W; x++) if (((y * 7 + x) % 23) === 0) pb.set(x, y, '#46d2ec');
    this.I = R2PLANT.hero(pb, this.p.x || 560, this.p.y || 300, { s: this.p.s || 1, k: this.p.k || 0, from: this.p.from });
    this.ms = Math.round(nowMs() - t0);
    this.c = pb.toCanvas();
    this.plume = R2PLANT.plumeStrip({ mode: this.p.mode || 'under', s: this.p.s || 1 });
    window.__r2 = { ms: this.ms, info: { x0: this.I.x0, x1: this.I.x1, y0: this.I.y0, anchors: this.I.anchors, mouth: this.I.mouth } };
  },
  update(dt) { this.t += dt; },
  render(g) {
    g.drawImage(this.c, 0, 0);
    R2PLANT.drawFx(g, this.I, 0, 0, Game.time, { plume: this.plume });
    if (this.p.anch) for (const n in this.I.anchors) { const a = this.I.anchors[n]; g.fillStyle = '#ff00ff'; g.fillRect(a.x - 1, a.y - 1, 3, 3); drawText(g, n, a.x + 3, a.y - 3, { font: 'tiny', color: '#ffffff' }); }
    drawText(g, this.ms + ' ms', 4, 4, { font: 'tiny', color: '#ffffff' });
  },
};
