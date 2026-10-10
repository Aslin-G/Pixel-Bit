/* =====================================================================
   18t_pfb_h2.js — Ciudadela del hidrógeno en el plano jugable (kit B, nivel 7).
   Hora azul: blancos de acero brumados hacia el azul, luz de borde cálida
   (rosa-naranja) desde la izquierda, emisivos cian (agua ultrapura), verde
   (H₂), azul claro (O₂) y amarillo (electricidad). Escala de personajes de
   ≈74 px: stacks de 60 px de largo con separadores de 80 px, esferas de
   86 px de diámetro, puertas ≥ 86 px, barandillas de 30 px.
   Todo se prerenderiza en props; las partes vivas (burbujas, LED, pantallas,
   aspas, balizas) las anima el nivel con las anclas que devuelven.
   Seguridad: solo arquitectura y un panel de protocolo abstracto.
   ===================================================================== */
const PFBH2 = (() => {
  const K = PFK, B = PFB, I = PFInfra;
  let WH = ['#141a32', '#222c4c', '#34406a', '#4a5888', '#6676a6', '#8696c2', '#a8b6da', '#cad4ee', '#e6ecfa', '#fdfdff'];
  const CY = ['#03243a', '#064866', '#0a7096', '#129cc4', '#26c4e8', '#6ae2f8', '#c4f8ff', '#ffffff'];
  const HG = ['#04261a', '#0a3e2a', '#11603e', '#1a8656', '#28ae6e', '#52d090', '#9cecc0', '#e4fff0'];
  let NAVY = ['#070b1a', '#0e1630', '#18244a', '#243462', '#34487e', '#4c62a0', '#7088c0', '#a0b6e0'];
  let CONC = ['#14182a', '#1e2438', '#2a3148', '#384058', '#48506a', '#5a6380', '#6e7896', '#8690ac', '#a2aac2', '#c2c8da'];
  let STL = ['#141626', '#24283e', '#383e5a', '#525a7a', '#6e769a', '#8e96b8', '#b0b8d6', '#d4daee', '#f2f4fc'];
  const O2B = ['#0c1830', '#18305a', '#2a4c86', '#4270b0', '#6a96d0', '#a0c0ea', '#dceaff'];
  const CU = ['#2a1206', '#5a2a0e', '#8e4a18', '#c27028', '#e89a40', '#ffc878', '#fff0c8'];
  const AMB = ['#3a2604', '#7a5208', '#c08a14', '#e8b830', '#ffd860', '#fff2b0'];
  const RED = ['#2a0608', '#5e0e14', '#a01c22', '#d83a32', '#ff6a50', '#ffb0a0'];
  let RIM = '#ffc8a8';
  const R = { WH, CY, HG, NAVY, CONC, STL, O2B, CU, AMB, RED };
  /* Temas de luz: 'dusk' (hora azul de la ciudadela, por defecto) y 'day' (pleno día con polvo, nivel 10) */
  const THEMES = {
    dusk: { WH, NAVY, CONC, STL, RIM },
    day: {
      WH: ['#2a1e1c', '#4a3630', '#6e5448', '#927462', '#b2967e', '#ccb49a', '#e0ccb2', '#efe0c8', '#f8eedc', '#fffaf0'],
      NAVY: ['#0c0e1c', '#161a30', '#22284a', '#303a64', '#424e80', '#5a689c', '#7a88b8', '#a4b0d4'],
      CONC: ['#2a201c', '#3c2e28', '#504036', '#665246', '#7c6656', '#927a68', '#a8907c', '#bea692', '#d2bea8', '#e6d6c2'],
      STL: ['#241c1c', '#3e3230', '#5a4c48', '#786a64', '#988a82', '#b6aaa0', '#d2c8be', '#ece4da', '#fcf8f0'],
      RIM: '#fff1c8',
    },
  };
  /** Ejecuta fn con las rampas de un tema (las funciones del kit leen las variables del módulo) */
  function withTheme(name, fn) {
    const T = THEMES[name] || THEMES.dusk, prev = { WH, NAVY, CONC, STL, RIM };
    WH = T.WH; NAVY = T.NAVY; CONC = T.CONC; STL = T.STL; RIM = T.RIM;
    R.WH = WH; R.NAVY = NAVY; R.CONC = CONC; R.STL = STL;
    try { return fn(); } finally { WH = prev.WH; NAVY = prev.NAVY; CONC = prev.CONC; STL = prev.STL; RIM = prev.RIM; R.WH = WH; R.NAVY = NAVY; R.CONC = CONC; R.STL = STL; }
  }
  const P = (r) => K.P32(r);
  const fin = (s, o = {}) => B.finish(s, Object.assign({ rimCol: RIM, rimK: 0.5 }, o));
  const rowT = (f) => f < 0.1 ? 1 : f < 0.25 ? 4 : f < 0.4 ? 6 : f < 0.58 ? 5 : f < 0.8 ? 3 : f < 0.92 ? 2 : 1;

  /** Pintor de fachada de paneles: juntas verticales, degradado, franja emisiva opcional */
  function clad(x0, o = {}) {
    const Pp = P(o.ramp || WH), n = Pp.length, pw = o.pw || 12;
    const st = o.stripe, sc = P(o.stripeRamp || CY);
    return (xx, yy, u, v) => {
      if (st != null && yy >= st && yy < st + 3) return sc[yy === st ? 6 : yy === st + 1 ? 4 : 2];
      const jx = ((xx - x0) % pw + pw) % pw;
      let k = Math.round(n * (o.base ?? 0.64) - v * (o.grad ?? 2.4) + (K.vn(xx * 0.05, yy * 0.04, 7) - 0.5) * 0.8);
      if (jx === 0) k -= 2; else if (jx === 1) k += 1;
      if (o.rows && ((yy - (o.rowY0 || 0)) % o.rows) === 0) k -= 1;
      if (u > 0.95) k -= 2; else if (u < 0.03) k += 1;
      return Pp[clamp(k, 0, n - 1)];
    };
  }
  /** Tapa de caja en 3/4: tono claro que se apaga hacia el fondo y juntas opcionales */
  function lid(ramp, o = {}) {
    const Pp = P(ramp), n = Pp.length;
    return (xx, yy, u, v) => { let k = n - 2 - Math.round(v * 2.4) + Math.round((K.cl(xx, yy, 2, 5) - 0.5) * 0.8); if (o.seam && (xx % o.seam) === 0) k -= 1; return Pp[clamp(k, 1, n - 1)]; };
  }
  const flank = (ramp) => { const Pp = P(ramp); return (xx, yy, u, v) => Pp[clamp(Math.round(2 + (K.cl(xx, yy, 2, 7) - 0.5) * 0.8 - v), 0, Pp.length - 1)]; };
  /** Caja en 3/4 con material por defecto (blanco brumado) */
  function box(pb, x, y, w, h, d, o = {}) {
    const ramp = o.ramp || WH;
    return I.box3q(pb, x, y, w, h, d, { ramp, front: o.front || clad(x, o), top: o.top || lid(ramp, o), side: o.side || flank(ramp), ink: o.ink || '#070a16' });
  }
  /** Plinto de hormigón con canto ámbar/negro (zona de equipos) */
  function plinth(pb, x, yb, w, h = 6, d = 16, o = {}) {
    const C = P(CONC);
    return I.box3q(pb, x, yb, w, h, d, {
      ramp: CONC,
      front: (xx, yy, u, v) => (yy - (yb - h) < 2 && o.hatch !== false) ? U((((xx + yy) >> 2) & 1) ? '#e8b830' : '#1c1c26') : C[clamp(Math.round(5 - v * 2 + (K.cl(xx, yy, 2, 11) - 0.5)), 1, 8)],
      top: (xx, yy, u, v) => C[clamp(Math.round(7 - v * 2 + (K.cl(xx, yy, 2, 12) - 0.5) * 0.8), 2, 9)],
      side: (xx, yy) => C[2], ink: '#070a16',
    });
  }
  /** Tubería con soportes hasta el suelo */
  function pipe(pb, pts, r, kind, o = {}) { I.pipe(pb, pts, r, kind, Object.assign({ flange: 26 }, o)); }

  /* ---------- electrolizador PEM ---------- */
  /** Stack PEM sobre plinto con dos separadores (H₂ verde, O₂ azul), barras de cobre y torre de señales.
      x = borde izquierdo del plinto, yb = pie (borde trasero del suelo). Huella 132 px. */
  function stackPEM(pb, x, yb, idx = 0) {
    const out = {};
    plinth(pb, x - 4, yb, 136, 6, 18);
    const base = yb - 14; // apoyo sobre la tapa del plinto
    // patín de acero
    box(pb, x + 4, base + 2, 70, 4, 10, { ramp: STL, pw: 9 });
    // stack de celdas: placas finas entre placas terminales con tirantes
    const sx = x + 8, sw = 62, sh = 40, sd = 14;
    const Wp = P(WH), Np = P(NAVY), Cp = P(CY);
    I.box3q(pb, sx, base - 2, sw, sh, sd, {
      ramp: WH,
      front: (xx, yy, u, v) => {
        const lx = xx - sx;
        if (lx < 6 || lx >= sw - 6) { let k = 5 - Math.round(v * 2.2) + (lx === 0 || lx === sw - 6 ? 1 : 0) - (lx === 5 || lx === sw - 1 ? 2 : 0); const by = yy - (base - 2 - sh); if ((by === 5 || by === sh - 6) && (lx === 2 || lx === sw - 3)) return U('#e0e6f6'); return Np[clamp(k, 0, 7)]; }
        const m = (lx - 6) % 3, c = Math.floor((lx - 6) / 3);
        if (c % 6 === 5) return Cp[m === 0 ? 5 : m === 1 ? 3 : 1];
        let k = m === 0 ? 7 : m === 1 ? 5 : 2;
        k -= Math.round(v * 2.4); if (v < 0.06) k += 1;
        return Wp[clamp(k, 1, 9)];
      },
      top: (xx, yy, u, v) => { const rr = Math.floor(v * 5); if (rr === 1 || rr === 3) return Wp[(xx % 3) ? 8 : 6]; return (xx - sx) % 3 === 0 ? Wp[4] : Wp[6 - Math.round(v)]; },
      side: (xx, yy, u, v) => Np[clamp(2 - Math.round(v), 0, 7)], ink: '#070a16',
    });
    // tuercas de los tirantes
    for (const [tx, ty] of [[sx - 1, base - 2 - sh + 4], [sx - 1, base - 2 - 6], [sx + sw, base - 2 - sh + 4], [sx + sw, base - 2 - 6]]) { K.put(pb, tx, ty, U('#e8ecf8')); K.put(pb, tx, ty + 1, U('#6a7290')); }
    // placa de identificación
    B.plaque(pb, sx + sw / 2, base - 2 - sh + 15, 'STACK ' + (idx + 1), { center: true, bg: '#0a2a1c', border: '#52d090', col: '#e4fff0', h: 9, screws: false });
    out.cells = [sx + 6, base - 2 - sh, sw - 12, sh];
    // barras de cobre en las placas terminales (suben a la bandeja de potencia)
    const Cu = P(CU);
    for (const bx of [sx + 2, sx + sw - 4]) for (let yy = base - 2 - sh - sd - 4; yy < base - 2 - sh + 6; yy++) { K.put(pb, bx, yy, Cu[5]); K.put(pb, bx + 1, yy, Cu[3]); K.put(pb, bx + 2, yy, Cu[1]); }
    out.bus = [[sx + 3, base - 2 - sh - sd - 4], [sx + sw - 3, base - 2 - sh - sd - 4]];
    // separadores gas-líquido
    const hx = x + 92, ox_ = x + 116, hTop = base - 82, oTop = base - 70;
    I.cylV(pb, hx, base, 10, 82, { ramp: STL, band: HG, bands: [{ y: 10, h: 3 }, { y: 62, h: 4 }], dome: 0.5, ladder: true });
    I.cylV(pb, ox_, base, 8, 70, { ramp: STL, band: O2B, bands: [{ y: 10, h: 3 }, { y: 52, h: 3 }], dome: 0.5 });
    // mirillas de nivel (las burbujas las anima el nivel)
    for (const [cx, top, hh] of [[hx - 4, base - 54, 26], [ox_ - 3, base - 46, 22]]) { for (let yy = top - 1; yy <= top + hh; yy++) for (let xx = cx - 2; xx <= cx + 2; xx++) K.put(pb, xx, yy, U((xx === cx - 2 || xx === cx + 2 || yy === top - 1 || yy === top + hh) ? '#d4daee' : yy > top + hh * 0.45 ? '#0e5a7a' : '#0a1a30')); }
    out.sepH = [hx - 5, base - 54, 3, 26]; out.sepO = [ox_ - 4, base - 46, 3, 22];
    // placas H₂ / O₂
    B.plaque(pb, hx, base - 76, 'H₂', { center: true, bg: '#0a3e2a', border: '#9cecc0', col: '#ffffff', h: 9, screws: false });
    B.plaque(pb, ox_, base - 64, 'O₂', { center: true, bg: '#18305a', border: '#a0c0ea', col: '#ffffff', h: 9, screws: false });
    // conexiones stack → separadores
    pipe(pb, [[sx + sw + 4, base - 30], [hx - 10, base - 30]], 2, 'h2', { flange: 0 });
    pipe(pb, [[sx + sw + 4, base - 14], [ox_ - 8, base - 14]], 2, 'o2', { flange: 0 });
    // salidas de gas hacia los colectores (y las fija el nivel)
    out.h2Out = [hx, hTop - 6]; out.o2Out = [ox_, oTop - 4];
    // alimentación de agua ultrapura por abajo a la izquierda
    pipe(pb, [[x - 2, base - 6], [sx, base - 6]], 2, 'upw', { flange: 0 });
    out.upwIn = [x - 2, base - 6];
    // torre de señales sobre la placa terminal izquierda
    const tx = sx + 2, ty = base - 2 - sh - sd - 16;
    for (let yy = ty; yy < base - 2 - sh - sd + 2; yy++) K.put(pb, tx - 6, yy + 10, U('#8e96b8'));
    for (const [k, col] of [[0, '#5e0e14'], [1, '#7a5208'], [2, '#0a3e2a']]) B.rect(pb, tx - 8, ty + 1 + k * 3, 5, 3, U(col));
    B.rect(pb, tx - 8, ty, 5, 1, U('#d4daee'));
    out.led = [tx - 6, ty + 8]; out.ledRed = [tx - 6, ty + 2]; out.ledAmb = [tx - 6, ty + 5];
    // manómetros y válvula de drenaje
    I.gauge(pb, hx + 6, base - 20, 2, -0.5); I.gauge(pb, ox_ + 5, base - 24, 2, -0.9);
    I.valve(pb, sx + 18, base + 1);
    B.castR(pb, x + 4, x + 128, yb - 2, 10, { amt: -0.18, yMin: yb - 20 });
    return out;
  }

  /* ---------- tren de agua ultrapura ---------- */
  /** Bastidor de OI de segundo paso: 2 hileras de tubos de presión horizontales sobre bastidor en 3/4 */
  function roRack(pb, x, yb, w = 104) {
    const S = P(STL), out = {};
    plinth(pb, x - 4, yb, w + 12, 5, 14);
    const base = yb - 11;
    // bastidor trasero (más oscuro) y delantero
    for (const [dx, dy, dark] of [[8, -8, true], [0, 0, false]]) {
      for (const px of [x + dx, x + dx + w - 4]) for (let yy = base - 64 + dy; yy < base + dy; yy++) { K.put(pb, px, yy, S[dark ? 3 : 6]); K.put(pb, px + 1, yy, S[dark ? 2 : 4]); K.put(pb, px + 2, yy, S[dark ? 1 : 2]); }
      for (let k = 0; k < 3; k++) {
        const cy = base - 14 - k * 19 + dy;
        I.cylH(pb, x + dx + 4, x + dx + w - 6, cy, 6, { ramp: dark ? ['#0e1226', '#1c2442', '#2c365c', '#404c78', '#586694', '#7682b0', '#96a2ca', '#b8c2e0'] : ['#1c2442', '#2c365c', '#4c5a86', '#7280b0', '#a2aed4', '#d0d8f0', '#f6f6ff', '#ffffff'], band: CY, bands: [8, w - 22] });
        if (!dark) for (const bx of [x + 16, x + w - 30]) { for (let yy = cy - 7; yy <= cy + 7; yy++) { K.put(pb, bx, yy, S[1]); K.put(pb, bx + 1, yy, S[5]); } }
      }
      for (let xx = x + dx; xx < x + dx + w; xx++) { K.put(pb, xx, base - 64 + dy, S[7]); K.put(pb, xx, base - 63 + dy, S[3]); }
    }
    // colectores verticales de permeado (entrada) y producto (salida)
    pipe(pb, [[x - 3, base - 2], [x - 3, base - 56]], 2, 'perm', { flange: 18 });
    pipe(pb, [[x + w + 4, base - 56], [x + w + 4, base - 4]], 2, 'upw', { flange: 18 });
    for (let k = 0; k < 3; k++) { const cy = base - 14 - k * 19; pipe(pb, [[x - 1, cy], [x + 4, cy]], 1, 'perm', { flange: 0 }); pipe(pb, [[x + w - 6, cy], [x + w + 2, cy]], 1, 'upw', { flange: 0 }); }
    // panel de control con HMI y manómetros
    box(pb, x + 30, base + 1, 22, 20, 6, { ramp: NAVY, pw: 22 });
    B.rect(pb, x + 33, base - 16, 16, 8, U('#03101c'));
    for (let k = 0; k < 3; k++) K.put(pb, x + 34 + k * 3, base - 6, U(['#3fe0a0', '#ffd84a', '#48dcf4'][k]));
    I.gauge(pb, x + 60, base - 8, 3, -0.4); I.gauge(pb, x + 72, base - 8, 3, -1.0);
    out.hmi = [x + 34, base - 15, 14, 6];
    out.permIn = [x - 3, base - 2]; out.out = [x + w + 4, base - 4];
    B.castR(pb, x, x + w + 8, yb - 2, 12, { amt: -0.18, yMin: yb - 18 });
    return out;
  }
  /** Módulos de electrodesionización (EDI): placas apiladas con frente de acero y display de conductividad */
  function ediSkid(pb, x, yb, n = 3) {
    plinth(pb, x - 3, yb, n * 22 + 6, 5, 14);
    const base = yb - 11, out = { screens: [] }, Np = P(NAVY), Wp = P(WH);
    for (let k = 0; k < n; k++) {
      const mx = x + k * 22;
      I.box3q(pb, mx, base, 18, 50, 10, {
        ramp: WH,
        front: (xx, yy, u, v) => { const ly = yy - (base - 50); if (ly < 5 || ly > 44) return Np[clamp(5 - Math.round(v * 2), 0, 7)]; const m = ly % 3; let kk = m === 0 ? 7 : m === 1 ? 5 : 3; if (ly % 12 === 6) return P(CY)[4]; kk -= Math.round(v * 2); if (u < 0.08) kk += 1; if (u > 0.92) kk -= 2; return Wp[clamp(kk, 1, 9)]; },
        top: lid(NAVY), side: flank(NAVY), ink: '#070a16',
      });
      B.rect(pb, mx + 3, base - 47, 12, 6, U('#021018'));
      out.screens.push([mx + 4, base - 46, 10, 4]);
      K.put(pb, mx + 15, base - 3, U('#3fe0a0'));
    }
    pipe(pb, [[x - 2, base - 30], [x + n * 22 + 2, base - 30]], 1, 'upw', { flange: 22 });
    return out;
  }
  /** Tanque de agua ultrapura con analizador de conductividad (pantalla viva) */
  function upwTank(pb, cx, yb, r = 20, h = 96) {
    plinth(pb, cx - r - 6, yb, 2 * r + 13, 6, 14);
    const base = yb - 11;
    B.castR(pb, cx - r, cx + r, yb - 4, 18, { amt: -0.2, yMin: yb - 20 });
    const t = I.cylV(pb, cx, base, r, h, { ramp: ['#1c2442', '#2c365c', '#4c5a86', '#7280b0', '#a2aed4', '#d0d8f0', '#f6f6ff', '#ffffff'], band: CY, bands: [{ y: 12, h: 3 }, { y: h - 30, h: 5 }, { y: h - 12, h: 2 }], dome: 0.42, ladder: true, stain: false });
    B.plaque(pb, cx + 2, base - h + 34, 'AGUA UP', { center: true, bg: '#06203a', border: '#6ae2f8', col: '#f4fbff', h: 10, screws: false });
    // barandilla en la cúpula
    for (let xx = cx - r + 2; xx <= cx + r - 2; xx++) K.put(pb, xx, base - h - 12, U('#d4daee'));
    for (const px of [cx - r + 2, cx - 6, cx + 6, cx + r - 2]) for (let k = 0; k < 8; k++) K.put(pb, px, base - h - 12 + k, U('#8e96b8'));
    // analizador en poste
    const ax = cx - r - 16;
    for (let yy = base - 44; yy < base; yy++) { K.put(pb, ax + 5, yy, U('#8e96b8')); K.put(pb, ax + 6, yy, U('#383e5a')); }
    box(pb, ax, base - 40, 13, 16, 4, { ramp: NAVY, pw: 13 });
    B.rect(pb, ax + 2, base - 53, 9, 6, U('#021018'));
    return { top: t.top, screen: [ax + 3, base - 52, 7, 4], outlet: [cx + r, base - 8], base, cx, r };
  }

  /* ---------- electricidad ---------- */
  /** Rectificador (CA→CC): armarios navy con rejillas, franjas de riesgo eléctrico y LED */
  function rectifier(pb, x, yb, n = 4) {
    plinth(pb, x - 4, yb, n * 26 + 8, 5, 14, { hatch: false });
    const base = yb - 11, Np = P(NAVY), out = { leds: [] };
    for (let k = 0; k < n; k++) {
      const cx = x + k * 26;
      I.box3q(pb, cx, base, 24, 58, 12, {
        ramp: NAVY,
        front: (xx, yy, u, v) => {
          const lx = xx - cx, ly = yy - (base - 58);
          if (lx === 0 || lx === 23) return Np[lx === 0 ? 5 : 1];
          if (ly < 4) return P(AMB)[(((xx + ly) >> 1) & 1) ? 3 : 0];
          if (ly > 34 && ly < 50 && lx > 3 && lx < 20) return Np[(ly % 2) ? 1 : 3];
          if (lx === 12) return Np[1];
          let kk = 4 - Math.round(v * 2) + (K.cl(xx, yy, 2, 19) < 0.15 ? -1 : 0); if (lx === 1) kk += 1;
          return Np[clamp(kk, 0, 7)];
        },
        top: lid(NAVY), side: flank(NAVY), ink: '#03050c',
      });
      // placa de riesgo eléctrico (rayo) y mirilla
      const px = cx + 4, py = base - 46;
      for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < 7; xx++) { const tri = yy >= 7 - Math.abs(xx - 3) * 2 || yy === 7; K.put(pb, px + xx, py + yy, U(tri ? '#ecc030' : (xx + yy) % 9 === 0 ? '#1a1a22' : '#1e2a4a')); }
      K.put(pb, px + 3, py + 3, U('#140e02')); K.put(pb, px + 3, py + 4, U('#140e02')); K.put(pb, px + 2, py + 5, U('#140e02'));
      B.rect(pb, cx + 14, base - 46, 6, 10, U('#03101c'));
      out.leds.push([cx + 15, base - 44, '#3fe0a0'], [cx + 18, base - 44, '#ffd84a']);
    }
    B.plaque(pb, x + n * 13, base - 66, 'RECTIFICADOR CA → CC', { center: true, bg: '#2a1e04', border: '#ffd860', col: '#fff6c0', h: 10, screws: false });
    out.top = [x + n * 13, base - 70];
    B.castR(pb, x, x + n * 26 + 4, yb - 2, 14, { amt: -0.2, yMin: yb - 18 });
    return out;
  }
  /** Transformador de potencia con aletas, aisladores y cerca baja */
  function transformer(pb, x, yb) {
    plinth(pb, x - 4, yb, 66, 5, 16, { hatch: false });
    const base = yb - 12, G = ['#0c1418', '#16242a', '#22363e', '#2e4a54', '#40606a', '#5a7e86', '#82a4aa', '#b0ccd0'], Gp = P(G);
    I.box3q(pb, x + 8, base, 42, 34, 14, { ramp: G, front: (xx, yy, u, v) => Gp[(xx - x) % 3 === 0 ? 1 : clamp(4 - Math.round(v * 2), 1, 7)], top: lid(G), side: flank(G), ink: '#03050c' });
    for (const fx of [x, x + 52]) I.box3q(pb, fx, base, 8, 30, 8, { ramp: G, front: (xx) => Gp[(xx % 2) ? 2 : 4], top: lid(G), side: flank(G) });
    for (const bx of [x + 14, x + 27, x + 40]) for (let k = 0; k < 10; k++) { const c = k % 2 ? '#c8562a' : '#e8805a'; K.put(pb, bx, base - 50 - k, U(c)); K.put(pb, bx + 1, base - 50 - k, U('#8a3a1a')); K.put(pb, bx - 1, base - 50 - k, U(k % 2 ? '#e8805a' : '#ffb088')); }
    B.plaque(pb, x + 29, base - 24, 'TRAFO', { center: true, bg: '#2a1e04', border: '#ffd860', col: '#fff6c0', h: 9, screws: false });
    B.fence(pb, x - 6, x + 64, yb + 1, { h: 22, gap: 14, ramp: ['#141626', '#24283e', '#383e5a', '#525a7a', '#6e769a', '#8e96b8', '#b0b8d6', '#d4daee'] });
    return { top: [x + 27, base - 62] };
  }
  /** Bandeja de cables de potencia colgada (cables amarillos/rojos) — devuelve el recorrido para los chevrones */
  function cableTray(pb, x0, x1, y, o = {}) {
    const S = P(STL);
    for (let x = x0; x <= x1; x++) { K.put(pb, x, y - 3, S[6]); K.put(pb, x, y + 3, S[2]); K.put(pb, x, y + 4, S[1]); for (let k = -2; k <= 2; k++) K.put(pb, x, y + k, U((x % 4 < 2) ? (k < 0 ? '#ecc030' : '#c8384a') : (k < 0 ? '#c49418' : '#7a1a1c'))); }
    for (let x = x0; x <= x1; x += o.hang || 48) for (let yy = (o.hangTo ?? y - 30); yy < y - 3; yy++) K.put(pb, x, yy, S[4]);
    return [[x0, y], [x1, y]];
  }

  /* ---------- nave de electrolizadores ---------- */
  /** Nave abierta: pórticos blancos con franja cian, cercha y faldón con rótulo, lámparas lineales.
      cols: x de los pilares. Devuelve {lamps:[[x,y]], beacons:[[x,y]]} */
  function shed(pb, x0, x1, yb, roofY, cols, title) {
    const S = P(WH), out = { lamps: [], beacons: [] };
    // pilares (perfil en I con alas iluminadas)
    for (const cx of cols) {
      for (let yy = roofY + 14; yy < yb; yy++) {
        const v = (yy - roofY) / (yb - roofY);
        for (let k = 0; k < 9; k++) { let kk = [6, 8, 5, 3, 3, 3, 4, 2, 1][k] - Math.round(v * 1.5); if (yy > yb - 60 && yy < yb - 56) { K.put(pb, cx + k, yy, P(CY)[k < 3 ? 5 : 3]); continue; } K.put(pb, cx + k, yy, S[clamp(kk, 0, 9)]); }
      }
      B.rect(pb, cx - 2, yb - 3, 13, 3, (xx, yy) => S[yy === yb - 3 ? 7 : 3]);
      // cartela y baliza ámbar
      for (let k = 0; k < 6; k++) for (let j = 0; j <= k; j++) K.put(pb, cx + 9 + j, roofY + 14 + k, S[4]);
      B.rect(pb, cx + 2, yb - 86, 5, 4, U('#7a5208')); B.rect(pb, cx + 2, yb - 87, 5, 1, U('#ffd860'));
      out.beacons.push([cx + 4, yb - 85]);
    }
    // cubierta en 3/4 (vuelo hacia el fondo) con lucernarios
    const d = 14, sk = 0.45;
    for (let r = 0; r < d; r++) { const off = Math.round(r * sk); for (let x = x0 + off; x < x1 + off; x++) { const sky = ((x - x0) % 64) > 40 && r > 3 && r < d - 2; K.put(pb, x, roofY - 1 - r, sky ? P(CY)[r % 3 ? 2 : 3] : S[clamp(4 - Math.round(r / d * 2) + ((x % 16) === 0 ? -1 : 0), 1, 9)]); } }
    // cercha: cordones y diagonales
    for (let x = x0; x < x1; x++) { K.put(pb, x, roofY, S[9]); K.put(pb, x, roofY + 1, S[6]); K.put(pb, x, roofY + 2, S[3]); K.put(pb, x, roofY + 13, S[7]); K.put(pb, x, roofY + 14, S[3]); }
    for (let x = x0; x < x1; x += 20) for (let k = 0; k < 11; k++) { K.put(pb, x + k, roofY + 2 + k, S[5]); K.put(pb, x + 20 - k, roofY + 2 + k, S[4]); }
    // faldón con rótulo
    if (title) {
      const mid = Math.round((x0 + x1) / 2), tw = K.measure(title, { font: 'main', bold: true }) + 16;
      B.rect(pb, mid - tw / 2, roofY - 2, tw, 16, (xx, yy) => U(yy === roofY - 2 ? '#d8def2' : yy === roofY + 13 ? '#0a1a30' : '#06203a'));
      B.rect(pb, mid - tw / 2, roofY + 11, tw, 2, U('#26c4e8'));
      K.text(pb, title, Math.round(mid - tw / 2 + 8), roofY + 2, U('#f4fbff'), { font: 'main', bold: true, shadow: U('#020812') });
    }
    // lámparas lineales bajo la cercha
    for (let x = x0 + 30; x < x1 - 20; x += 56) { B.rect(pb, x - 7, roofY + 15, 15, 2, U('#383e5a')); B.rect(pb, x - 6, roofY + 17, 13, 1, U('#fff2d0')); for (let yy = roofY + 14; yy < roofY + 15; yy++) K.put(pb, x, yy, U('#8e96b8')); out.lamps.push([x, roofY + 18]); }
    return out;
  }
  /** Colector suspendido (tubería con colgadores desde la cercha) */
  function header(pb, x0, x1, y, r, kind, hangTo) {
    pipe(pb, [[x0, y], [x1, y]], r, kind, { flange: 32 });
    for (let x = x0 + 12; x < x1; x += 48) for (let yy = hangTo; yy < y - r - 1; yy++) K.put(pb, x, yy, U('#6e769a'));
  }
  /** Rack de tuberías trasero: pórticos y varias líneas [{kind, dy, r}] */
  function pipeRack(pb, x0, x1, y, lines, o = {}) {
    const S = P(STL), span = o.span || 64;
    for (let x = x0; x <= x1; x += span) {
      const gb = o.footY ? o.footY(x) : y + 60;
      for (let yy = y - 4; yy < gb; yy++) { K.put(pb, x, yy, S[5]); K.put(pb, x + 1, yy, S[3]); K.put(pb, x + 2, yy, S[1]); }
      for (let k = -2; k < 6; k++) { K.put(pb, x + k, y - 4, S[6]); K.put(pb, x + k, y - 3, S[2]); }
      for (let k = 0; k < 10; k++) K.put(pb, x + 3 + k, y - 2 + k, S[2]);
    }
    for (let x = x0 - 4; x <= x1 + 6; x++) { K.put(pb, x, y - 4, S[6]); K.put(pb, x, y - 3, S[3]); }
    for (const L of lines) pipe(pb, [[x0 - 4, y + L.dy], [x1 + 6, y + L.dy]], L.r || 2, L.kind, { flange: 40 });
  }

  /* ---------- compresión y almacenamiento ---------- */
  /** Compresor alternativo en patín: motor, acoplamiento, cárter, dos cilindros aleteados y botellas */
  function compressor(pb, x, yb) {
    plinth(pb, x - 4, yb, 70, 5, 14);
    const base = yb - 11, G = ['#0c1418', '#16262c', '#20383e', '#2c4c52', '#3c6268', '#527c80', '#74a0a0', '#a4c8c4'], Gp = P(G), out = {};
    box(pb, x, base, 62, 4, 10, { ramp: STL });
    // motor
    I.cylH(pb, x + 2, x + 24, base - 14, 9, { ramp: G });
    for (let xx = x + 5; xx < x + 22; xx += 2) for (let yy = base - 22; yy <= base - 6; yy++) K.put(pb, xx, yy, Gp[2]);
    box(pb, x + 8, base - 24, 10, 6, 4, { ramp: NAVY, pw: 10 });
    // guarda del acoplamiento
    box(pb, x + 25, base - 4, 9, 18, 6, { ramp: AMB, pw: 9, base: 0.6 });
    // cárter
    box(pb, x + 35, base - 4, 24, 20, 10, { ramp: STL, pw: 8 });
    // cilindros con cabezas aleteadas
    for (const cx of [x + 41, x + 53]) { I.cylV(pb, cx, base - 24, 5, 14, { ramp: STL, dome: false }); for (let k = 0; k < 4; k++) for (let xx = cx - 6; xx <= cx + 6; xx++) K.put(pb, xx, base - 39 + k * 2, U(k % 2 ? '#383e5a' : '#b0b8d6')); }
    // botellas de amortiguación y tuberías de H₂
    I.cylH(pb, x + 34, x + 62, base - 48, 4, { ramp: STL, band: HG, bands: [12] });
    pipe(pb, [[x + 41, base - 42], [x + 41, base - 46]], 1, 'h2', { flange: 0 }); pipe(pb, [[x + 53, base - 42], [x + 53, base - 46]], 1, 'h2', { flange: 0 });
    I.gauge(pb, x + 30, base - 30, 3, -0.3);
    B.plaque(pb, x + 14, base - 38, 'COMPRESOR', { center: true, bg: '#0a2a1c', border: '#52d090', col: '#e4fff0', h: 9, screws: false });
    out.in = [x + 34, base - 48]; out.out = [x + 62, base - 48]; out.led = [x + 12, base - 22];
    B.castR(pb, x, x + 66, yb - 2, 12, { amt: -0.2, yMin: yb - 18 });
    return out;
  }
  const LV = (() => { const l = [-0.62, -0.5, 0.6], m = Math.hypot(...l); return l.map(v => v / m); })();
  /** Esfera de almacenamiento de H₂: sombreado de Lambert brumado, costuras soldadas, banda verde,
      patas con arriostramiento, escalera en diagonal y barandilla superior. Devuelve {cx, cy, top} */
  function sphere(pb, cx, yb, r, o = {}) {
    plinth(pb, cx - r - 8, yb, 2 * r + 17, 6, 16);
    const base = yb - 12, cy = base - (o.lift ?? Math.round(r * 1.25)), Wp = P(WH), Gp = P(HG), warm = U(RIM);
    // patas traseras (más oscuras) primero
    const legs = [-0.95, -0.55, 0, 0.55, 0.95];
    for (const f of [-0.75, -0.25, 0.25, 0.75]) { const lx = Math.round(cx + f * r * 0.9) + 3; for (let yy = cy; yy < base; yy++) { K.put(pb, lx, yy, Wp[2]); K.put(pb, lx + 1, yy, Wp[1]); } }
    for (let yy = Math.round(cy - r); yy <= cy + r; yy++) for (let xx = cx - r; xx <= cx + r; xx++) {
      const nx = (xx - cx) / r, ny = (yy - cy) / r, d2 = nx * nx + ny * ny; if (d2 > 1) continue;
      const nz = Math.sqrt(1 - d2);
      let t = 0.22 + Math.max(0, nx * LV[0] + ny * LV[1] + nz * LV[2]) * 0.7 - ny * 0.1;
      if (d2 > 0.86) t -= 0.12; // oscurecimiento del borde
      if (nx > 0.55 && ny > -0.2) t += 0.08 * (1 - ny); // luz reflejada del suelo
      const lat = Math.asin(clamp(ny, -1, 1)), lon = Math.atan2(nx, nz);
      const seamLat = Math.abs(((lat / (Math.PI / 6)) % 1 + 1) % 1 - 0.5) > 0.47, seamLon = Math.abs(((lon / (Math.PI / 5)) % 1 + 1) % 1 - 0.5) > 0.47;
      if ((seamLat || seamLon) && d2 < 0.92) t -= 0.07;
      t += (K.vn(xx * 0.12, yy * 0.12, 33) - 0.5) * 0.05;
      let u;
      if (Math.abs(ny) < 0.075) u = Gp[clamp(Math.round(1 + t * 6.5), 0, 7)];
      else u = Wp[clamp(Math.round(t * 9.4), 0, 9)];
      if (nx < -0.78 && ny < 0.4) u = K.mixU(u, warm, 0.38);
      if (t > 0.86 && nx < -0.3 && ny < -0.3) u = U('#ffffff');
      K.put(pb, xx, yy, u);
    }
    // contorno
    for (let a = 0; a < TAU; a += 0.01) { const xx = Math.round(cx + Math.cos(a) * (r + 1)), yy = Math.round(cy + Math.sin(a) * (r + 1)); if (Math.cos(a) > -0.6 || Math.sin(a) > 0) K.put(pb, xx, yy, U('#070a16')); }
    // rótulo H₂
    K.text(pb, 'H₂', cx - Math.round(r * 0.5), cy - Math.round(r * 0.48), U('#0a3e2a'), { font: 'main', bold: true });
    K.text(pb, 'H₂', cx - Math.round(r * 0.5) - 1, cy - Math.round(r * 0.48) - 1, U('#52d090'), { font: 'main', bold: true });
    // patas delanteras con zapatas y arriostramiento en X
    const S = P(STL);
    for (const f of legs) {
      const lx = Math.round(cx + f * r * 0.92);
      const y0 = Math.round(cy + Math.sqrt(Math.max(0, 1 - f * f)) * r * 0.25);
      for (let yy = y0; yy < base; yy++) { K.put(pb, lx - 1, yy, S[7]); K.put(pb, lx, yy, S[5]); K.put(pb, lx + 1, yy, S[3]); K.put(pb, lx + 2, yy, S[1]); }
      B.rect(pb, lx - 3, base - 3, 8, 3, (xx, yy) => S[yy === base - 3 ? 6 : 2]);
    }
    for (let i = 0; i < legs.length - 1; i++) { const a = Math.round(cx + legs[i] * r * 0.92) + 1, b = Math.round(cx + legs[i + 1] * r * 0.92); const yA = Math.round(cy + r * 0.62), yB = base - 4; K.lineFn(pb, a, yA, b, yB, () => S[4]); K.lineFn(pb, a, yB, b, yA, () => S[3]); }
    // escalera en diagonal por el frente derecho
    for (let k = 0; k < 34; k++) { const xx = Math.round(cx + r * 0.95 - k * 0.9), yy = Math.round(base - 4 - k * 1.55); if (yy < cy - r * 0.6) break; K.put(pb, xx, yy, S[7]); K.put(pb, xx + 1, yy, S[3]); if (k % 3 === 0) for (let j = 0; j < 5; j++) K.put(pb, xx + j, yy, S[6]); K.put(pb, xx + 4, yy - 7, S[6]); }
    // barandilla en la coronación
    for (let xx = cx - 9; xx <= cx + 9; xx++) K.put(pb, xx, cy - r - 6, S[7]);
    for (const px of [cx - 9, cx - 3, cx + 3, cx + 9]) for (let k = 0; k < 6; k++) K.put(pb, px, cy - r - 6 + k, S[4]);
    B.rect(pb, cx - 2, cy - r - 3, 4, 3, S[5]);
    B.castR(pb, cx - r, cx + r, yb - 2, 20, { amt: -0.2, yMin: yb - 20 });
    return { cx, cy, top: cy - r - 6, r };
  }
  /** Bloque de botellas de O₂ en jaula con placa (subproducto) */
  function o2Rack(pb, x, yb, n = 6) {
    plinth(pb, x - 3, yb, n * 8 + 8, 4, 12, { hatch: false });
    const base = yb - 10, S = P(STL);
    for (let row = 0; row < 2; row++) for (let k = 0; k < n; k++) {
      const cx = x + 4 + k * 8 + row * 4, by = base - row * 4;
      I.cylV(pb, cx, by, 3, 30, { ramp: row ? ['#0c1830', '#18305a', '#2a4c86', '#4270b0', '#6a96d0', '#a0c0ea', '#c8dcf6', '#eef4ff'] : ['#18305a', '#2a4c86', '#4270b0', '#6a96d0', '#a0c0ea', '#c8dcf6', '#eef4ff', '#ffffff'], dome: 0.9, ell: 0.5, stain: false });
      K.put(pb, cx, by - 34, U('#d4daee')); K.put(pb, cx, by - 35, U('#6e769a'));
    }
    for (let xx = x - 1; xx <= x + n * 8 + 4; xx++) for (const yy of [base - 26, base - 10]) { K.put(pb, xx, yy, S[6]); K.put(pb, xx, yy + 1, S[2]); }
    for (const px of [x - 1, x + n * 8 + 4]) for (let yy = base - 36; yy < base; yy++) { K.put(pb, px, yy, S[6]); K.put(pb, px + 1, yy, S[2]); }
    B.plaque(pb, x + n * 4 + 2, base - 22, 'O₂', { center: true, bg: '#18305a', border: '#a0c0ea', col: '#ffffff', h: 9, screws: false });
  }

  /* ---------- seguridad (solo arquitectura y señalética abstracta) ---------- */
  /** Panel del protocolo DETECTAR → … → AUTORIZAR REINICIO (lista vertical numerada con iconos) */
  function protocolBoard(pb, x, yb, w = 118) {
    const steps = ['DETECTAR', 'AISLAR', 'DETENER', 'VENTILAR', 'VERIFICAR', 'AUTORIZAR REINICIO'];
    const h = 76, top = yb - 40 - h, S = P(STL);
    for (const px of [x + 8, x + w - 12]) for (let yy = top + h; yy < yb; yy++) { K.put(pb, px, yy, S[6]); K.put(pb, px + 1, yy, S[4]); K.put(pb, px + 2, yy, S[1]); }
    B.rect(pb, x - 1, top - 1, w + 2, h + 2, U('#020410'));
    B.rect(pb, x, top, w, h, (xx, yy) => U((yy === top || xx === x || xx === x + w - 1 || yy === top + h - 1) ? '#ffd860' : (yy - top) < 12 ? '#2a1e04' : '#0a1030'));
    K.text(pb, 'PROTOCOLO DE SEGURIDAD', x + Math.round((w - K.measure('PROTOCOLO DE SEGURIDAD', { font: 'tiny', bold: true })) / 2), top + 4, U('#fff2b0'), { font: 'tiny', bold: true });
    const icon = (i, ix, iy) => {
      const c = U(['#56e5ff', '#ff9a6a', '#ff6a50', '#a0c0ea', '#3fe0a0', '#ffd860'][i]);
      if (i === 0) { for (let a = -2; a <= 2; a++) { K.put(pb, ix + 1 + a, iy + 1 - Math.abs(a), c); K.put(pb, ix + 1 + a, iy + 4 + Math.abs(a) - 2, c); } K.put(pb, ix + 1, iy + 2, c); }
      else if (i === 1) { for (let k = 0; k < 5; k++) { K.put(pb, ix + k - 1, iy + 2, c); } K.put(pb, ix + 1, iy, c); K.put(pb, ix + 1, iy + 1, c); K.put(pb, ix, iy, c); K.put(pb, ix + 2, iy, c); }
      else if (i === 2) { for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 5; xx++) if (!((xx === 0 || xx === 4) && (yy === 0 || yy === 4))) K.put(pb, ix - 1 + xx, iy + yy, c); }
      else if (i === 3) { for (let k = -2; k <= 2; k++) { K.put(pb, ix + 1 + k, iy + 2, c); K.put(pb, ix + 1, iy + 2 + k, c); } K.put(pb, ix - 1, iy, c); K.put(pb, ix + 3, iy + 4, c); }
      else if (i === 4) { K.put(pb, ix - 1, iy + 2, c); K.put(pb, ix, iy + 3, c); K.put(pb, ix + 1, iy + 4, c); K.put(pb, ix + 2, iy + 3, c); K.put(pb, ix + 3, iy + 2, c); K.put(pb, ix + 4, iy + 1, c); }
      else { for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx <= Math.min(yy, 4 - yy); xx++) K.put(pb, ix + xx, iy + yy, c); }
    };
    steps.forEach((st, i) => {
      const ry = top + 14 + i * 10;
      B.rect(pb, x + 4, ry, w - 8, 9, U(i % 2 ? '#0e1640' : '#121c4c'));
      B.rect(pb, x + 5, ry + 1, 8, 7, U('#1e2a5a'));
      K.text(pb, String(i + 1), x + 8, ry + 2, U('#ffd860'), { font: 'tiny' });
      icon(i, x + 16, ry + 2);
      K.text(pb, st, x + 25, ry + 2, U('#f4f8ff'), { font: 'tiny' });
      if (i < 5) { K.put(pb, x + w - 9, ry + 3, U('#ffd860')); K.put(pb, x + w - 9, ry + 4, U('#ffd860')); K.put(pb, x + w - 10, ry + 5, U('#ffd860')); K.put(pb, x + w - 9, ry + 6, U('#ffd860')); K.put(pb, x + w - 8, ry + 5, U('#ffd860')); }
    });
    B.castR(pb, x + 8, x + w - 10, yb - 1, 6, { amt: -0.16, yMin: yb - 8 });
    return { top, h };
  }
  /** Detector de gas en poste: caja amarilla con rejilla, placa H₂ y LED (vivo) */
  function detector(pb, x, yb, h = 46) {
    const S = P(STL);
    for (let yy = yb - h; yy < yb; yy++) { K.put(pb, x, yy, S[6]); K.put(pb, x + 1, yy, S[3]); }
    B.rect(pb, x - 3, yb - 3, 8, 3, (xx, yy) => S[yy === yb - 3 ? 6 : 2]);
    box(pb, x - 5, yb - h + 12, 12, 12, 4, { ramp: AMB, pw: 12, base: 0.62 });
    for (let k = 0; k < 4; k++) for (let xx = x - 3; xx < x + 5; xx++) K.put(pb, xx, yb - h + 3 + k * 2, U('#3a2604'));
    B.rect(pb, x - 2, yb - h + 14, 6, 4, U('#0a3e2a')); K.text(pb, 'H₂', x - 2, yb - h + 15, U('#9cecc0'), { font: 'tiny' });
    return { led: [x + 5, yb - h + 2] };
  }
  /** Cámara térmica en mástil (la llama del H₂ casi no se ve: se mira con sensores) */
  function thermalCam(pb, x, yb, h = 70) {
    const S = P(STL);
    for (let yy = yb - h; yy < yb; yy++) { K.put(pb, x, yy, S[6]); K.put(pb, x + 1, yy, S[4]); K.put(pb, x + 2, yy, S[1]); }
    B.rect(pb, x - 3, yb - 3, 9, 3, (xx, yy) => S[yy === yb - 3 ? 6 : 2]);
    box(pb, x - 12, yb - h + 2, 16, 8, 5, { ramp: WH, pw: 16 });
    for (let xx = x - 14; xx < x + 6; xx++) K.put(pb, xx, yb - h - 9, U('#d8def2'));
    K.ellipseFn(pb, x - 14, yb - h - 2, 2.2, 2.6, (nx, ny, d) => U(d < 0.4 ? '#b49cff' : '#1a1030'));
    return { lens: [x - 14, yb - h - 2] };
  }
  /** Manga de viento en mástil */
  function windsock(pb, x, yb, h = 72) {
    const S = P(STL);
    for (let yy = yb - h; yy < yb; yy++) { K.put(pb, x, yy, S[6]); K.put(pb, x + 1, yy, S[2]); }
    for (let k = 0; k < 18; k++) { const r = Math.round(4 - k * 0.14), xx = x + 2 + k, yy = yb - h + 3 + Math.round(k * 0.2); for (let j = -r; j <= r; j++) K.put(pb, xx, yy + j, U((Math.floor(k / 4) % 2) ? (j < 0 ? '#ffffff' : '#c8ccdc') : (j < 0 ? '#ff7a3a' : '#c84a1a'))); }
  }
  /** Mástil de venteo alto y esbelto con jaula de escalera, franjas rojas y balizas (vivas) */
  function ventMast(pb, x, yb, h = 160) {
    plinth(pb, x - 10, yb, 24, 5, 10, { hatch: false });
    const base = yb - 9, out = { beacons: [] };
    I.cylV(pb, x, base, 4, h, { ramp: ['#1c2442', '#2c365c', '#4c5a86', '#7280b0', '#a2aed4', '#d0d8f0', '#f6f6ff', '#ffffff'], band: RED, bands: [{ y: h - 4, h: 4 }, { y: h - 14, h: 4 }], dome: false, ladder: false, stain: false });
    const S = P(STL);
    for (let yy = base - h + 30; yy < base - 8; yy++) { K.put(pb, x + 6, yy, S[5]); K.put(pb, x + 9, yy, S[3]); if (yy % 6 === 0) for (let k = 6; k <= 9; k++) K.put(pb, x + k, yy, S[6]); }
    for (const py of [base - 60, base - 110]) for (let xx = x - 9; xx <= x + 11; xx++) { K.put(pb, xx, py, S[7]); K.put(pb, xx, py + 1, S[3]); }
    out.beacons.push([x, base - h - 2], [x, base - 62]);
    return out;
  }
  /** Aerorrefrigerador en 3/4: tapa con ventiladores visibles (aspas vivas), batería de aletas y patas */
  function dryCooler(pb, x, yb, w = 84, n = 3) {
    plinth(pb, x - 4, yb, w + 10, 5, 14, { hatch: false });
    const base = yb - 11, S = P(STL), out = { fans: [] };
    for (const lx of [x + 2, x + w - 5]) for (let yy = base - 12; yy < base; yy++) { K.put(pb, lx, yy, S[6]); K.put(pb, lx + 1, yy, S[3]); K.put(pb, lx + 2, yy, S[1]); }
    const b = I.box3q(pb, x, base - 12, w, 22, 20, {
      ramp: WH,
      front: (xx, yy, u, v) => { const ly = yy - (base - 34); if (ly < 3 || ly > 19) return P(WH)[clamp(6 - Math.round(v * 2), 1, 9)]; return P(['#141a2e', '#20283e', '#2e3852', '#3e4a66', '#52607e'])[(ly % 2) ? 1 : 3 - (((xx - x) % 22) === 0 ? 2 : 0)]; },
      top: lid(WH), side: flank(WH), ink: '#070a16',
    });
    for (let k = 0; k < n; k++) {
      const fx = x + Math.round((k + 0.5) * w / n) + 5, fy = base - 34 - 10;
      K.ellipseFn(pb, fx, fy, 11, 4.6, (nx, ny, d) => U(d > 0.8 ? '#d8def2' : d > 0.66 ? '#383e5a' : ((Math.round(nx * 6) + Math.round(ny * 3)) % 2 ? '#141a2e' : '#1c2442')));
      K.put(pb, fx, fy, U('#8e96b8'));
      out.fans.push([fx, fy, 9, 3.6]);
    }
    B.castR(pb, x, x + w + 6, yb - 2, 10, { amt: -0.2, yMin: yb - 18 });
    return out;
  }

  /* ---------- edificios ---------- */
  /** Caseta de control de acceso con marquesina, puerta de 86 px, ventanal iluminado y rótulo */
  function gatehouse(pb, x, yb, w = 70, h = 104, title = 'CIUDADELA H₂') {
    plinth(pb, x - 6, yb, w + 14, 6, 16, { hatch: false });
    const base = yb - 12, out = {};
    const b = box(pb, x, base, w, h, 16, { pw: 14, stripe: base - h + 22, rows: 26, rowY0: base - h });
    B.door(pb, x + 8, base, 18, 86, ['#0e1630', '#18244a', '#243462', '#34487e', '#4c62a0', '#7088c0', '#a0b6e0', '#c8d6f0'], { frame: WH, panels: true });
    B.win(pb, x + 34, base - 66, 28, 30, { lit: true, frame: WH });
    for (let yy = base - 66; yy < base - 36; yy += 6) for (let xx = x + 34; xx < x + 62; xx++) if (hash2(xx, yy, 3) < 0.2) K.put(pb, xx, yy, U('#ffe8a0'));
    B.rect(pb, x + 36, base - 46, 24, 4, U('#3a2a1a'));
    // marquesina en voladizo
    for (let r = 0; r < 8; r++) for (let xx = x - 10 - Math.round(r * 0.3); xx < x + w + 22; xx++) K.put(pb, xx, base - h - 2 + r, P(WH)[r === 0 ? 9 : r < 3 ? 7 : r === 7 ? 1 : 4]);
    // rótulo sobre la marquesina
    const tw = K.measure(title, { font: 'main', bold: true }) + 12;
    B.rect(pb, x + w / 2 - tw / 2, base - h - 18, tw, 14, (xx, yy) => U(yy === base - h - 18 ? '#a8f4ff' : yy === base - h - 5 ? '#020812' : '#06203a'));
    K.text(pb, title, Math.round(x + w / 2 - tw / 2 + 6), base - h - 15, U('#f4fbff'), { font: 'main', bold: true, shadow: U('#020812') });
    out.lamp = [x + w / 2, base - h + 7]; out.win = [x + 48, base - 50];
    B.castR(pb, x, x + w + 16, yb - 2, 20, { amt: -0.22, yMin: yb - 20 });
    return out;
  }
  /** Tótem con emblema H₂ (círculo, hoja y gota) */
  function totem(pb, x, yb, h = 92) {
    plinth(pb, x - 4, yb, 30, 5, 10, { hatch: false });
    const base = yb - 9;
    box(pb, x, base, 22, h, 8, { pw: 22, stripe: base - h + 8, base: 0.7 });
    const cx = x + 11, cy = base - h + 30;
    K.ellipseFn(pb, cx, cy, 9, 9, (nx, ny, d) => U(d > 0.78 ? '#28ae6e' : d > 0.62 ? '#0a3e2a' : '#06203a'));
    K.text(pb, 'H₂', cx - 5, cy - 3, U('#e4fff0'), { font: 'main', bold: true });
    for (let k = 0; k < 6; k++) { K.put(pb, cx + 5 + Math.round(k * 0.5), cy + 6 - k, U('#52d090')); K.put(pb, cx + 6 + Math.round(k * 0.5), cy + 6 - k, U('#9cecc0')); }
    for (let k = 0; k < 40; k += 4) B.rect(pb, x + 4, base - 42 + k * 0.6, 14, 1, U('#383e5a'));
  }
  /** Barrera de acceso con brazo levantado a rayas */
  function boom(pb, x, yb) {
    box(pb, x, yb, 10, 30, 6, { ramp: AMB, pw: 10, base: 0.62 });
    for (let k = 0; k < 64; k++) { const xx = x + 6 + Math.round(k * 0.34), yy = yb - 28 - k; for (let j = 0; j < 3; j++) K.put(pb, xx + j, yy, U((Math.floor(k / 8) % 2) ? (j === 0 ? '#ffffff' : '#c8ccdc') : (j === 0 ? '#ff6a50' : '#a01c22'))); }
    K.put(pb, x + 4, yb - 26, U('#ff6a50'));
  }
  /** Jardinera de hormigón con agave, gramíneas y flores (vida en la ciudadela) */
  function planter(pb, x, yb, w = 40, seed = 1) {
    plinth(pb, x, yb, w, 12, 10, { hatch: false });
    PFFlora.agave(pb, x + Math.round(w * 0.4), yb - 20, 10 + (seed % 3), seed);
    for (let k = 0; k < 4; k++) PFFlora.tuft(pb, x + 5 + k * Math.round(w / 4), yb - 19, 6, 9 + (k % 2) * 4, seed + k, PFFlora.DRY);
    for (let k = 0; k < 3; k++) { const fx = x + 8 + k * 11, fy = yb - 22 - (k % 2) * 3; K.put(pb, fx, fy, U(['#ff6a9a', '#ffe14d', '#b49cff'][k])); K.put(pb, fx + 1, fy, U('#ffffff')); }
  }
  /** Sala de control elevada en corte (sin vidrio frontal): pantallas murales, consolas a ≈34 px,
      sillas, techo a > 110 px del suelo, pilotes y arriostramiento bajo el forjado.
      Devuelve {screens:[{x,y,w,h,kind}], lamps:[[x,y]], leds:[[x,y,col]]} */
  function controlRoom(pb, x0, x1, floorY, roofY, yb, title) {
    const out = { screens: [], lamps: [], leds: [] }, w = x1 - x0, Wp = P(WH), Np = P(NAVY), S = P(STL);
    const backY = floorY - 16; // pie del muro de fondo
    // pilotes y arriostramiento
    for (const px of [x0 + 6, x0 + Math.round(w * 0.36), x0 + Math.round(w * 0.68), x1 - 12]) { for (let yy = floorY + 10; yy < yb; yy++) for (let k = 0; k < 7; k++) K.put(pb, px + k, yy, S[[7, 6, 5, 4, 3, 2, 1][k] - (yy > yb - 20 ? 1 : 0)]); B.rect(pb, px - 2, yb - 3, 11, 3, (xx, yy) => S[yy === yb - 3 ? 6 : 2]); }
    const pls = [x0 + 6, x0 + Math.round(w * 0.36), x0 + Math.round(w * 0.68), x1 - 12];
    for (let i = 0; i < pls.length - 1; i++) { K.lineFn(pb, pls[i] + 6, floorY + 12, pls[i + 1], yb - 6, () => S[3]); K.lineFn(pb, pls[i] + 6, yb - 6, pls[i + 1], floorY + 12, () => S[2]); }
    // sombra del forjado sobre lo que hay debajo
    // muro de fondo con paneles
    I.box3q(pb, x0, backY, w, backY - roofY, 0, { ramp: NAVY, front: (xx, yy, u, v) => { const jx = (xx - x0) % 30; let k = 3 - Math.round(v * 1.2) + (jx === 0 ? -1 : jx === 1 ? 1 : 0); if (((yy - roofY) % 22) === 0) k -= 1; return Np[clamp(k, 0, 7)]; }, edges: false });
    // pantallas murales (marcos) — el contenido lo anima el nivel
    const sw = Math.round((w - 40) / 3);
    for (let k = 0; k < 3; k++) {
      const sx = x0 + 14 + k * (sw + 6), sy = roofY + 14, sh = 32;
      B.rect(pb, sx - 2, sy - 2, sw + 4, sh + 4, U('#d4daee')); B.rect(pb, sx - 1, sy - 1, sw + 2, sh + 2, U('#383e5a'));
      B.rect(pb, sx, sy, sw, sh, (xx, yy) => U(((yy - sy) % 8) === 0 ? '#06223a' : '#03101e'));
      out.screens.push({ x: sx + 2, y: sy + 2, w: sw - 4, h: sh - 4, kind: ['bars', 'wave', 'text'][k] });
    }
    // diagrama de la planta en la pantalla central (líneas fijas)
    const cx0 = x0 + 14 + (sw + 6), cy0 = roofY + 14;
    for (let xx = cx0 + 3; xx < cx0 + sw - 3; xx++) K.put(pb, xx, cy0 + 26, U('#0a7096'));
    // consolas (encimera ≈ 34 px) con monitores y sillas
    const deskY = floorY - 6;
    for (let k = 0; k < 3; k++) {
      const dx = x0 + 18 + k * Math.round((w - 36) / 3), dw = Math.round((w - 36) / 3) - 12;
      I.box3q(pb, dx, deskY, dw, 30, 8, { ramp: WH, front: clad(dx, { pw: 18, base: 0.56 }), top: lid(STL), side: flank(WH), ink: '#070a16' });
      for (let m = 0; m < 2; m++) { const mx = dx + 6 + m * Math.round(dw / 2); B.rect(pb, mx, deskY - 48, 18, 12, U('#383e5a')); B.rect(pb, mx + 1, deskY - 47, 16, 10, U('#03101e')); B.rect(pb, mx + 8, deskY - 36, 2, 4, U('#6e769a')); out.screens.push({ x: mx + 2, y: deskY - 46, w: 14, h: 8, kind: m ? 'grid' : 'text', small: true }); }
      for (let j = 0; j < 4; j++) out.leds.push([dx + 4 + j * 4, deskY - 24, ['#3fe0a0', '#ffd84a', '#48dcf4', '#3fe0a0'][j]]);
      // silla
      const chx = dx + Math.round(dw / 2) - 6;
      B.rect(pb, chx, deskY - 4, 12, 3, U('#18244a')); B.rect(pb, chx + 1, deskY - 18, 3, 14, U('#243462')); B.rect(pb, chx + 5, deskY - 1, 2, 5, U('#383e5a'));
    }
    // suelo interior (cara superior entre muro y canto): baldosa pulida con reflejos de las pantallas
    for (let yy = backY; yy < floorY; yy++) for (let xx = x0; xx < x1; xx++) { const t = (floorY - yy) / 16; let u = P(CONC)[clamp(Math.round(6 - t * 3 + (((xx >> 4) + (yy >> 2)) & 1 ? -0.6 : 0)), 1, 9)]; const sk = ((xx - x0 - 14) % (sw + 6)); if (sk >= 0 && sk < sw && t > 0.3) u = K.mixU(u, U('#26c4e8'), 0.16 * t); K.put(pb, xx, yy, u); }
    // muros laterales (izquierdo de canto, derecho con su cara en 3/4)
    for (let yy = roofY; yy < floorY; yy++) { for (let k = 0; k < 6; k++) K.put(pb, x0 + k, yy, Wp[[8, 7, 6, 5, 4, 2][k]]); for (let k = 0; k < 6; k++) K.put(pb, x1 - 6 + k, yy, Wp[[6, 5, 4, 3, 2, 1][k]]); }
    PFK.polyFill(pb, [[x1, roofY - 4], [x1 + 8, roofY - 12], [x1 + 8, floorY - 8], [x1, floorY]], (xx, yy) => Wp[clamp(3 - Math.round((yy - roofY) / (floorY - roofY) * 1.5) + ((yy % 14) === 0 ? -1 : 0), 0, 9)]);
    // forjado de cubierta, faldón con rótulo y antena
    for (let r = 0; r < 10; r++) { const off = Math.round(r * 0.8); for (let xx = x0 - 4 + off; xx < x1 + 6 + off; xx++) K.put(pb, xx, roofY - 6 - r, Wp[clamp(6 - Math.round(r / 4), 0, 9)]); }
    for (let xx = x0 - 4; xx < x1 + 6; xx++) for (let k = 0; k < 10; k++) K.put(pb, xx, roofY - 6 + k, k === 0 ? Wp[9] : k === 1 ? Wp[8] : k === 9 ? Wp[1] : k > 6 ? P(AMB)[(((xx + k) >> 2) & 1) ? 3 : 0] : Wp[6]);
    if (title) B.plaque(pb, Math.round((x0 + x1) / 2), roofY - 26, title, { center: true, font: 'main', bold: true, bg: '#2a1e04', border: '#ffd860', col: '#fff6c0', h: 14 });
    for (let yy = roofY - 50; yy < roofY - 16; yy++) K.put(pb, x1 - 20, yy, S[6]);
    out.beacon = [x1 - 20, roofY - 51];
    // lámparas de techo
    for (let xx = x0 + 30; xx < x1 - 20; xx += 50) { B.rect(pb, xx - 8, roofY + 4, 17, 2, U('#fff2d0')); B.rect(pb, xx - 8, roofY + 3, 17, 1, U('#383e5a')); out.lamps.push([xx, roofY + 6]); }
    return out;
  }
  /** Bunker de hormigón con portal al núcleo: túnel en perspectiva, puerta lejana sellada con juntas
      luminosas, chaflanes con franja ámbar, cubierta vegetada (el Oasis está detrás) */
  function coreGate(pb, x, yb, w, h, title) {
    const C = P(CONC), out = { lights: [] }, top = yb - h;
    const ow = Math.round(w * 0.55), oh = Math.min(h - 26, 112), oxL = x + Math.round((w - ow) / 2), oyT = yb - oh;
    // masa del bunker
    I.box3q(pb, x, yb, w, h, 18, {
      ramp: CONC,
      front: (xx, yy, u, v) => { const ly = yy - top; let k = 6 - Math.round(v * 2.6) + Math.round((K.vn(xx * 0.06, yy * 0.06, 77) - 0.5) * 1.6); if (ly % 18 === 0) k -= 2; if (((xx - x + (Math.floor(ly / 18) % 2) * 22) % 44) === 0) k -= 1; if (K.vn(xx * 0.5, yy * 0.03, 78) > 0.78) k -= 1; return C[clamp(k, 0, 9)]; },
      top: (xx, yy, u, v) => P(['#0e1a10', '#16261a', '#203a22', '#2c4e2c', '#3a6434', '#4c7a3e'])[clamp(Math.round(4 - v * 2 + (K.cl(xx, yy, 2, 79) - 0.5) * 2), 0, 5)],
      side: flank(CONC), ink: '#070a16',
    });
    // túnel en perspectiva
    const vx = oxL + ow / 2, vy = oyT + oh * 0.55, dw = Math.round(ow * 0.28), dh = Math.round(oh * 0.42);
    for (let yy = oyT; yy < yb; yy++) for (let xx = oxL; xx < oxL + ow; xx++) {
      const u = (xx - oxL) / ow, v = (yy - oyT) / oh;
      const inDoor = Math.abs(xx - vx) < dw / 2 && yy > vy - dh / 2 && yy < vy + dh / 2;
      let c;
      if (inDoor) { const seam = Math.abs(xx - vx) < 1 || Math.abs(yy - (vy - dh / 2)) < 1 || Math.abs(Math.abs(xx - vx) - dw / 2 + 1) < 1; c = seam ? '#6ae2f8' : ((Math.floor((yy - vy) / 4) % 2) ? '#0a2236' : '#0e2a42'); }
      else {
        const dl = Math.abs(u - 0.5) * 2, dv = v;
        const depth = Math.max(dl, Math.abs(dv - 0.55) * 1.6);
        c = mixHex('#04060e', '#1e2438', clamp(depth, 0, 1));
        const ring = Math.floor(depth * 9);
        if (Math.abs(depth * 9 - ring) < 0.12 && depth > 0.3) c = '#2a3148';
        if (dv > 0.55 && Math.abs(dv - 0.55) * 1.6 >= dl && ((Math.floor(depth * 30)) % 3 === 0)) c = '#22283a';
      }
      K.put(pb, xx, yy, U(c));
    }
    // tiras de luz del túnel (convergen)
    for (const side of [-1, 1]) for (let k = 0; k < 40; k++) { const t = k / 40, xx = Math.round(vx + side * lerp(ow / 2 - 4, dw / 2 + 2, t)), yy = Math.round(lerp(oyT + 6, vy - dh / 2 - 2, t)); K.put(pb, xx, yy, U(t < 0.5 ? '#9cecc0' : '#52d090')); }
    out.door = [vx, vy];
    // marco con chaflán y franja ámbar
    for (let yy = oyT - 6; yy < yb; yy++) for (let k = 0; k < 6; k++) { const hz = (((yy + k) >> 2) & 1) ? '#e8b830' : '#1c1c26'; K.put(pb, oxL - 6 + k, yy, U(k < 4 ? hz : '#070a16')); K.put(pb, oxL + ow + k, yy, U(k > 1 ? hz : '#070a16')); }
    for (let xx = oxL - 6; xx < oxL + ow + 6; xx++) for (let k = 0; k < 6; k++) K.put(pb, xx, oyT - 6 + k, U(k < 4 ? ((((xx + k) >> 2) & 1) ? '#e8b830' : '#1c1c26') : '#070a16'));
    // rótulo y flecha verde
    if (title) { B.plaque(pb, x + w / 2, oyT - 24, title, { center: true, font: 'main', bold: true, bg: '#0a3e2a', border: '#9cecc0', col: '#e4fff0', h: 14 }); }
    // focos laterales
    for (const lx of [oxL - 16, oxL + ow + 12]) { B.rect(pb, lx, oyT + 10, 5, 8, U('#383e5a')); B.rect(pb, lx + 1, oyT + 11, 3, 5, U('#fff2d0')); out.lights.push([lx + 2, oyT + 13]); }
    // cubierta vegetada: matas y lianas que caen
    for (let xx = x + 6; xx < x + w + 10; xx += 9) PFFlora.cluster(pb, xx, top - 18 + (xx % 3), 7, 5, RAMP.foliageR, xx, { density: 0.7, leaf: [3, 5] });
    for (let xx = x + 10; xx < x + w; xx += 23) for (let k = 0; k < 10 + (xx % 13); k++) K.put(pb, xx + Math.round(Math.sin(k * 0.4) * 1.5), top + k, U(k % 3 ? '#3a6434' : '#2c4e2c'));
    PFFlora.palm(pb, x + 30, top - 10, 52, -5, 71); PFFlora.palm(pb, x + w - 26, top - 12, 46, 6, 72);
    B.castR(pb, x + w, x + w + 8, yb - 2, 20, { amt: -0.22, yMin: yb - 20 });
    return out;
  }

  /* ---------- objetos menudos del pasillo (a escala de personaje) ---------- */
  /** Cono de balizamiento (≈12 px) */
  function cone(pb, x, y) {
    const s = B.sprite(12, 14), b = 13;
    for (let yy = 0; yy < 10; yy++) { const hw = 1 + Math.round(yy * 0.42); for (let xx = -hw; xx <= hw; xx++) { const f = (xx + hw) / (2 * hw + 0.01); const band = yy > 3 && yy < 6; PFK.put(s, 6 + xx, b - 11 + yy, U(band ? (f < 0.4 ? '#ffffff' : '#c8ccdc') : (f < 0.35 ? '#ff9a5a' : f < 0.75 ? '#e8602a' : '#a8381a'))); } }
    B.rect(s, 1, b - 2, 11, 2, (xx, yy) => U(yy === b - 2 ? '#e8602a' : '#7a2a10'));
    fin(s); B.stamp(pb, s, x - 6, y - b); B.contact(pb, x, y, 6, 1.4);
  }
  /** Carrete de cable de madera (≈18 px) */
  function reel(pb, x, y) {
    const s = B.sprite(22, 20), b = 19, Wd = P(B.R.WOOD);
    for (const ex of [3, 16]) K.ellipseFn(s, ex, b - 9, 3, 9, (nx, ny, d) => Wd[clamp(Math.round(5 - nx * 1.5 - ny - (d > 0.75 ? 2 : 0)), 0, 7)]);
    for (let yy = b - 14; yy < b - 4; yy++) for (let xx = 4; xx < 16; xx++) PFK.put(s, xx, yy, U((yy % 2) ? '#141418' : (xx % 3 ? '#2a2a34' : '#3a3a46')));
    K.ellipseFn(s, 16, b - 9, 1.5, 2, () => U('#2a1408'));
    fin(s); B.stamp(pb, s, x - 10, y - b); B.contact(pb, x, y, 10, 1.6);
  }
  /** Caja de herramientas roja con asa */
  function toolbox(pb, x, y) {
    const s = B.sprite(18, 14), b = 13;
    I.box3q(s, 2, b, 12, 7, 4, { ramp: RED });
    for (let xx = 5; xx < 11; xx++) PFK.put(s, xx, b - 10, U('#2a282e')); PFK.put(s, 5, b - 9, U('#2a282e')); PFK.put(s, 10, b - 9, U('#2a282e'));
    B.rect(s, 3, b - 5, 10, 1, U('#5e0e14'));
    fin(s); B.stamp(pb, s, x - 8, y - b); B.contact(pb, x, y, 8, 1.4);
  }
  /** Carretilla con dos botellas (verde H₂) encadenadas */
  function trolley(pb, x, y) {
    const s = B.sprite(20, 44), b = 42, S = P(STL);
    for (const cx of [7, 13]) I.cylV(s, cx, b - 4, 3, 30, { ramp: ['#06301e', '#0c4c30', '#147046', '#1e9a5e', '#34c47a', '#7ce8ac', '#bff4d6', '#eafff4'], dome: 0.9, ell: 0.5, stain: false });
    for (let yy = b - 38; yy < b - 2; yy++) { PFK.put(s, 2, yy, S[6]); PFK.put(s, 3, yy, S[3]); }
    for (let xx = 2; xx < 18; xx++) { PFK.put(s, xx, b - 3, S[6]); PFK.put(s, xx, b - 2, S[2]); PFK.put(s, xx, b - 20, U('#c8ccdc')); }
    K.ellipseFn(s, 4, b - 2, 2.4, 2.4, (nx, ny, d) => U(d < 0.3 ? '#8e96b8' : '#141418'));
    fin(s); B.stamp(pb, s, x - 10, y - b); B.contact(pb, x, y, 9, 1.6);
  }
  /** Caballete de señal con texto (≈24 px) */
  function aframe(pb, x, y, text, o = {}) {
    const tw = K.measure(text, { font: 'tiny' }) + 6, s = B.sprite(tw + 6, 28), b = 27;
    for (let yy = 0; yy < 22; yy++) { PFK.put(s, 3 + Math.round(yy * 0.08), b - 22 + yy, U('#383e5a')); PFK.put(s, tw + 2 - Math.round(yy * 0.08), b - 22 + yy, U('#383e5a')); }
    B.rect(s, 2, b - 24, tw + 2, 12, U(o.bd || '#e8b830')); B.rect(s, 3, b - 23, tw, 10, U(o.bg || '#1c1c26'));
    K.text(s, text, 6, b - 20, U(o.col || '#ffd860'), { font: 'tiny' });
    fin(s); B.stamp(pb, s, x - Math.round(tw / 2) - 3, y - b); B.contact(pb, x, y, tw / 2 + 2, 1.4);
  }
  /** Palé con cajas apiladas */
  function pallet(pb, x, y, w = 26, seed = 1) {
    const r = RNG(seed), Wd = B.R.WOOD;
    I.box3q(pb, x, y, w, 3, 8, { ramp: Wd });
    let cx = x + 1;
    while (cx < x + w - 6) { const bw = r.int(8, 12), bh = r.int(7, 12); I.box3q(pb, cx, y - 3, Math.min(bw, x + w - cx - 1), bh, 6, { ramp: ['#2a1a0a', '#4a3214', '#6e4e24', '#94703a', '#b8925a', '#d8b47e', '#f0d4a0'] }); if (r() < 0.5) I.box3q(pb, cx + 2, y - 3 - bh, Math.min(bw, x + w - cx - 1) - 3, r.int(5, 8), 5, { ramp: ['#2a1a0a', '#4a3214', '#6e4e24', '#94703a', '#b8925a', '#d8b47e', '#f0d4a0'] }); cx += bw + 1; }
    B.contact(pb, x + w / 2, y, w / 2 + 3, 1.6);
  }
  /** Rótulo pintado en el suelo (estarcido algo gastado) */
  function stencil(pb, x, y, text, col = '#e8b830', k = 0.55) {
    const tmp = B.sprite(K.measure(text, { font: 'main', bold: true }) + 2, 10);
    K.text(tmp, text, 0, 1, U(col), { font: 'main', bold: true });
    for (let yy = 0; yy < tmp.h; yy++) for (let xx = 0; xx < tmp.w; xx++) { const u = tmp.data[yy * tmp.w + xx]; if (!(u >>> 24) || hash2(xx, yy, 5) < 0.18) continue; const c = K.get(pb, x + xx, y + Math.round(yy * 0.6)); if (c >>> 24) K.put(pb, x + xx, y + Math.round(yy * 0.6), K.mixU(c, u, k)); }
  }
  /** Armario de extintor rojo en poste */
  function extinguisher(pb, x, y) {
    const s = B.sprite(14, 40), b = 39, S = P(STL);
    for (let yy = b - 36; yy < b; yy++) { PFK.put(s, 6, yy, S[6]); PFK.put(s, 7, yy, S[2]); }
    I.box3q(s, 2, b - 14, 10, 16, 3, { ramp: RED });
    B.rect(s, 4, b - 27, 6, 10, U('#ff6a50')); B.rect(s, 5, b - 26, 2, 8, U('#ffb0a0'));
    fin(s); B.stamp(pb, s, x - 7, y - b); B.contact(pb, x, y, 4, 1.2);
  }
  /* ---------- estaciones en 3/4 (cuerpo cacheado + partes vivas) ---------- */
  const stCache = new Map();
  function stBody(key, w, h, paint) { let c = stCache.get(key); if (!c) { const s = B.sprite(w, h); paint(s); fin(s); c = { c: s.toCanvas(), w, h }; stCache.set(key, c); } return c; }
  /** Válvula manual de la línea de agua ultrapura (estación 'valve'): bajante cian con volante rojo */
  function drawValveSt(g, x, y, st) {
    const bd = stBody('valve', 30, 40, (s) => {
      I.box3q(s, 4, 39, 22, 4, 6, { ramp: CONC });
      I.pipe(s, [[15, 4], [15, 30]], 3, 'upw', { flange: 10 });
      I.box3q(s, 10, 30, 11, 8, 4, { ramp: STL });
      for (let yy = 12; yy < 22; yy++) { PFK.put(s, 15, yy, U('#b0b8d6')); }
    });
    g.drawImage(bd.c, x - 15, y - 39);
    const a = st.done ? 1.2 : Game.time * 0 + 0;
    for (let k = 0; k < 4; k++) { const an = a + k * Math.PI / 2; fline(g, x, y - 26, x + Math.cos(an) * 7, y - 26 + Math.sin(an) * 2.6, '#d83a32'); }
    g.fillStyle = '#ff9a8a'; g.fillRect(x - 7, y - 27, 1, 1); g.fillRect(x, y - 27, 1, 1);
    fpx(g, x, y - 26, '#ffd0c0');
    if (!st.done && (Math.floor(Game.time * 2) % 2)) PFK.drawGlow(g, x, y - 26, 6, '#56e5ff', 0.4);
  }
  /** Consola del Sincronizador (estación 'sim'): pupitre inclinado con dos pantallas */
  function drawConsoleSt(g, x, y, st) {
    const bd = stBody('console', 40, 40, (s) => {
      I.box3q(s, 4, 39, 30, 22, 8, { ramp: WH, front: clad(4, { pw: 15, base: 0.58 }), top: lid(STL), side: flank(WH) });
      PFK.polyFill(s, [[4, 17], [34, 17], [37, 5], [8, 5]], (xx, yy) => P(NAVY)[yy < 7 ? 5 : 3]);
      for (const [sx, sy] of [[9, 8], [21, 8]]) for (let yy = sy; yy < sy + 7; yy++) for (let xx = sx; xx < sx + 10; xx++) PFK.put(s, xx + Math.round((15 - yy) * 0.25), yy, U('#03101e'));
      for (let k = 0; k < 5; k++) PFK.put(s, 8 + k * 5, 24, U(['#3fe0a0', '#ffd84a', '#48dcf4', '#ff6a50', '#3fe0a0'][k]));
    });
    g.drawImage(bd.c, x - 20, y - 39);
    const t = Game.time, col = st.glow || '#86e36f';
    g.fillStyle = col;
    for (let i = 0; i < 9; i++) g.fillRect(x - 10 + i + 1, Math.round(y - 29 + Math.sin(i * 0.8 + t * 3) * 2), 1, 1);
    g.fillStyle = '#ffd84a'; for (let i = 0; i < 4; i++) { const hh = 1 + Math.round(Math.abs(Math.sin(t * 1.3 + i)) * 4); g.fillRect(x + 2 + i * 2, y - 26 - hh, 1, hh); }
    if (!st.done && (Math.floor(t * 2) % 2)) PFK.drawGlow(g, x, y - 30, 8, col, 0.35);
  }
  /** Aspas giratorias de los aerorrefrigeradores (proyección elíptica) */
  function drawFans(g, sc, fans, on = true) {
    const ox = sc.cam.ox, oy = sc.cam.oy, t = Game.time * (on ? 9 : 0.4);
    g.fillStyle = '#8e96b8';
    for (const [fx, fy, rx, ry] of fans) {
      const x = fx - ox, y = fy - oy; if (x < -20 || x > W + 20) continue;
      for (let k = 0; k < 3; k++) { const a = t + k * TAU / 3; for (let j = 2; j < rx; j += 1.5) g.fillRect(Math.round(x + Math.cos(a) * j), Math.round(y + Math.sin(a) * j * ry / rx), 1, 1); }
    }
  }
  return { R, THEMES, withTheme, get RIM() { return RIM; }, fin, clad, lid, flank, box, plinth, stackPEM, roRack, ediSkid, upwTank, rectifier, transformer, cableTray, shed, header, pipeRack, compressor, sphere, o2Rack, protocolBoard, detector, thermalCam, windsock, ventMast, dryCooler, gatehouse, totem, boom, planter, controlRoom, coreGate, cone, reel, toolbox, trolley, aframe, pallet, stencil, extinguisher, drawValveSt, drawConsoleSt, drawFans };
})();
