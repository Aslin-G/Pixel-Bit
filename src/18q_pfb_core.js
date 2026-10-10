/* =====================================================================
   18q_pfb_core.js — Kit PF «B» (niveles 6–10): núcleo compartido.
   · PFB: rampas de materiales cercanos, sprites con contorno selectivo y
     luz de borde, sombras de contacto y proyectadas sobre el suelo,
     puertas/ventanas/placas a escala de personajes de ≈74 px, farolas,
     bancos, barandillas, vallas, depósitos, luces y pantallas dinámicas.
   · Extensiones compatibles hacia atrás (sin tocar 18a–18i ni 30/32):
       PFInfra.PIPES += perm, well, rain, irrig, h2, o2, upw, power, cool
       PFTerrain.render → PFBGround.render si def.pf.kitB
       PFStage.build    → oclusores frontales nuevos (pillar, cables, rail,
                          reeds, beam, dark) además de canopy/clump
       PFWater.*        → agua con style:'pond' (estanque somero 3/4)
       drawLadder       → escaleras con look:'wood'|'steel' en 3/4
   ===================================================================== */
const PFB = (() => {
  const K = PFK;
  const R = {
    SOIL: ['#1c0e07', '#2c170c', '#3f2313', '#55311a', '#6c4124', '#85532e', '#9e683a', '#b98249', '#d29e62', '#e8bd84'],
    STONE: ['#24120b', '#3d2117', '#583222', '#74452d', '#93603b', '#b07a4c', '#c9955f', '#e0b47a', '#f2d29e', '#fde8c4'],
    ADOBE: ['#3e1c10', '#5c2c1a', '#7c4026', '#9a5634', '#b66e42', '#cc8752', '#dea266', '#ecbe86', '#f6d8aa', '#fdeccc'],
    STUCCO: ['#3a2a2a', '#5a4442', '#7c625c', '#9e8478', '#bea592', '#d6c0aa', '#e8d6c0', '#f4e8d6', '#fcf6ea'],
    WOOD: ['#1a0c06', '#2e170c', '#4a2a14', '#6a4220', '#8a5a2e', '#a87440', '#c89458', '#e2b47a'],
    WOODG: ['#141008', '#2a2214', '#443624', '#5e4c34', '#7a6648', '#968262', '#b2a07e', '#d0c09e'],
    METAL: ['#0c0f16', '#171c26', '#252c3a', '#36404f', '#4b5668', '#646f83', '#808ca0', '#a2adbf', '#c8d1de', '#eef3fa'],
    STEEL: PFInfra.STEEL,
    GLASS: PFInfra.GLASS,
    GREEN: ['#0a2a1c', '#114030', '#1a5a42', '#24785a', '#2f9670', '#4cb48a', '#7cd2a8', '#b4ecd0', '#e8fff4'],
    ROYAL: ['#070c2a', '#0e1a4a', '#16286a', '#203a8c', '#2c50ae', '#4470c8', '#6c94dc', '#a0bcec', '#d4e2fa'],
    GOLD: ['#3a2004', '#5e360a', '#86521a', '#ae722a', '#d29a3e', '#ecc05a', '#f8de8a', '#fff4c8'],
    RED: ['#2a0608', '#4e0e12', '#7a1a1c', '#a82a26', '#d04434', '#ec6a4a', '#fc9a72', '#ffcaa8'],
    CANVAS: ['#2a2018', '#4a3a2c', '#6e5a46', '#96806a', '#bca88e', '#dacab0', '#eee2cc', '#fcf6ea'],
    DARKFG: ['#04050c', '#080c18', '#0e1626', '#162236', '#22324a', '#34465e', '#4a5e78'],
  };
  const LIGHT = '#fff1c8';
  /** u32 de una rampa (cacheado) */
  const P = (ramp) => K.P32(ramp);
  function sprite(w, h) { return new PixelBuffer(Math.max(1, Math.ceil(w)), Math.max(1, Math.ceil(h))); }
  /** Termina un sprite: contorno selectivo (abajo/derecha/izquierda) + luz de borde arriba-izquierda */
  function finish(s, o = {}) {
    if (o.rim !== false) K.rim(s, U(o.rimCol || LIGHT), o.rimK ?? 0.45, -1, -1);
    if (o.out !== false) K.selOut(s, o.outAmt ?? -0.62, o.sides || 'lrb', o.outHue ?? null);
    return s;
  }
  function stamp(pb, s, x, y, flip = false) { K.blit(pb, s, Math.round(x), Math.round(y), flip); }
  /** Rect relleno: u32 o fn(x,y) */
  function rect(pb, x, y, w, h, fn) {
    x = Math.round(x); y = Math.round(y);
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) { const u = typeof fn === 'function' ? fn(xx, yy, (xx - x) / Math.max(1, w - 1), (yy - y) / Math.max(1, h - 1)) : fn; if (u) K.put(pb, xx, yy, u); }
  }
  /** Oscurece píxeles opacos en un rect (sombra pintada, sin tramado) */
  function shade(pb, x, y, w, h, amt = -0.25, hue = 235) {
    x = Math.round(x); y = Math.round(y);
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) { const c = K.get(pb, xx, yy); if (c >>> 24) K.put(pb, xx, yy, K.shU(c, amt, hue)); }
  }
  /** Sombra de contacto elíptica bajo un objeto (2 anillos) */
  function contact(pb, cx, y, rx, ry = 2, amt = -0.3) {
    for (let yy = Math.floor(y - ry); yy <= Math.ceil(y + ry); yy++) for (let xx = Math.floor(cx - rx); xx <= Math.ceil(cx + rx); xx++) {
      const nx = (xx - cx) / rx, ny = (yy - y) / (ry + 0.01), d = nx * nx + ny * ny; if (d > 1) continue;
      const c = K.get(pb, xx, yy); if (c >>> 24) K.put(pb, xx, yy, K.shU(c, d < 0.45 ? amt : amt * 0.55, 235));
    }
  }
  /** Sombra proyectada hacia atrás-derecha (luz arriba-izquierda) sobre el suelo ya pintado.
      Paralelogramo: base (x0..x1, y), se aleja len px a la derecha y sube k·len. */
  function castR(pb, x0, x1, y, len, o = {}) {
    const up = o.up ?? 0.42, amt = o.amt ?? -0.26, hue = o.hue ?? 235, yMin = o.yMin ?? -1e9;
    for (let s = 0; s <= len; s++) {
      const yy = Math.round(y - s * up); if (yy < yMin) break;
      const a = s > len * 0.7 ? amt * 0.55 : amt;
      for (let xx = Math.round(x0 + s); xx <= Math.round(x1 + s); xx++) { const c = K.get(pb, xx, yy); if (c >>> 24) K.put(pb, xx, yy, K.shU(c, a, hue)); }
    }
  }
  /* ---------- arquitectura a escala de personaje ---------- */
  /** Puerta con marco, dintel, peldaño y pomo. cols = rampa de la hoja. h ≥ 84 para personajes de 74 px */
  function door(s, x, yb, w, h, cols = R.WOOD, o = {}) {
    const D = P(cols), F = P(o.frame || R.STONE);
    // marco
    rect(s, x - 3, yb - h - 4, w + 6, h + 4, (xx, yy) => F[xx < x - 1 ? 7 : xx >= x + w + 1 ? 2 : yy < yb - h - 2 ? 8 : 5]);
    if (o.arch) for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < w; xx++) { const nx = (xx - w / 2 + 0.5) / (w / 2), ny = yy / 8; if (nx * nx + (1 - ny) * (1 - ny) > 1) K.put(s, x + xx, yb - h + yy, 0); }
    // hoja: tablas o paneles
    rect(s, x, yb - h, w, h, (xx, yy, u, v) => {
      if (o.arch) { const nx = (xx - x - w / 2 + 0.5) / (w / 2), ny = (yy - (yb - h)) / 8; if (ny < 1 && nx * nx + (1 - ny) * (1 - ny) > 1) return F[1]; }
      let k = 4 - Math.round(v * 1.2) + (u < 0.12 ? 1 : 0) - (u > 0.88 ? 1 : 0);
      if (o.panels) { const pu = ((xx - x) % Math.ceil(w / 2)), pv = ((yy - yb + h) % Math.ceil(h / 3)); if (pu === 1 || pv === 1) k += 1; else if (pu === 0 || pv === 0) k -= 1; }
      else if ((xx - x) % 5 === 0) k -= 1;
      if (K.cl(xx, yy, 2, 9) < 0.15) k -= 1;
      return D[clamp(k, 0, D.length - 1)];
    });
    // herrajes y pomo
    if (!o.panels) for (const hy of [yb - h + 10, yb - 14]) for (let xx = x + 1; xx < x + w - 1; xx++) K.put(s, xx, hy, U('#2a2420'));
    const kx = o.knobLeft ? x + 3 : x + w - 4; K.put(s, kx, yb - Math.round(h * 0.46), U('#ffe08a')); K.put(s, kx, yb - Math.round(h * 0.46) + 1, U('#7a5a10'));
    // peldaño
    rect(s, x - 5, yb - 3, w + 10, 3, (xx, yy) => F[yy === yb - 3 ? 8 : yy === yb - 1 ? 2 : 5]);
    if (o.open) rect(s, x + 2, yb - h + 2, w - 4, h - 5, (xx, yy, u, v) => U(mixHex('#2a1a10', '#ffcf7a', clamp(0.75 - v * 0.6, 0, 1) * (o.warm ?? 0.7))));
  }
  /** Ventana con marco, alféizar y vidrio (cielo o interior cálido iluminado) */
  function win(s, x, y, w, h, o = {}) {
    const F = P(o.frame || R.STONE), G = P(o.lit ? ['#5a2a0a', '#8a4a10', '#c8781e', '#f0a83a', '#ffd070', '#fff0b8'] : (o.glass || R.GLASS));
    rect(s, x - 2, y - 2, w + 4, h + 4, (xx, yy) => F[yy < y - 1 ? 7 : xx >= x + w ? 3 : 5]);
    rect(s, x, y, w, h, (xx, yy, u, v) => {
      let k = o.lit ? 4 - Math.round(v * 2) : 2 + Math.round((1 - v) * 1.6 + u * 0.5);
      if (!o.lit && ((xx - x) + (yy - y)) % 9 === 3) k = 5;
      if (o.mull !== false && ((xx - x) === Math.floor(w / 2) || (h > 10 && (yy - y) === Math.floor(h / 2)))) return F[o.lit ? 2 : 6];
      return G[clamp(k, 0, G.length - 1)];
    });
    rect(s, x - 3, y + h + 1, w + 6, 2, (xx, yy) => F[yy === y + h + 1 ? 8 : 3]);
    if (o.shutters) for (const sx of [x - 7, x + w + 3]) rect(s, sx, y - 1, 4, h + 2, (xx, yy) => P(o.shutters)[(yy - y) % 3 === 0 ? 1 : xx === sx ? 4 : 3]);
  }
  /** Placa pintada con texto (letra tiny o main), marco y tornillos. Devuelve el ancho */
  function plaque(s, x, y, text, o = {}) {
    const font = o.font || 'tiny', tw = K.measure(text, { font, bold: !!o.bold });
    const w = tw + (o.pad ?? 8), h = o.h ?? (font === 'tiny' ? 11 : 13);
    const bg = U(o.bg || '#123a1c'), bd = U(o.border || '#7fd060'), dk = U(o.dark || '#06140a');
    const x0 = Math.round(o.center ? x - w / 2 : x);
    rect(s, x0 - 1, y - 1, w + 2, h + 2, dk);
    rect(s, x0, y, w, h, (xx, yy) => (yy === y || xx === x0 || xx === x0 + w - 1 || yy === y + h - 1) ? bd : bg);
    K.text(s, text, x0 + Math.round((w - tw) / 2), y + Math.round((h - (font === 'tiny' ? 5 : 7)) / 2) + 1, U(o.col || '#f4fff0'), { font, bold: !!o.bold, shadow: o.shadow ? U(o.shadow) : 0 });
    if (o.screws !== false && h > 9) for (const sx of [x0 + 2, x0 + w - 3]) K.put(s, sx, y + 2, U('#e8e0d0'));
    return w;
  }
  /** Toldo a rayas en 3/4 (vuelo d hacia delante) */
  function awning(s, x, y, w, d, cols = ['#c8384a', '#fcefe0'], o = {}) {
    const C = cols.map(c => U(c)), sh = (c) => K.shU(c, -0.3, 15);
    for (let r = 0; r < d; r++) for (let xx = x - Math.round(r * 0.25); xx < x + w + Math.round(r * 0.25); xx++) {
      const st = Math.floor((xx - x + 400) / (o.stripe || 6)) % C.length;
      const c = C[st]; K.put(s, xx, y + r, r > d - 2 ? sh(c) : r < 1 ? K.mixU(c, U('#ffffff'), 0.3) : c);
    }
    // faldón festoneado
    for (let xx = x - Math.round(d * 0.25); xx < x + w + Math.round(d * 0.25); xx++) { const st = Math.floor((xx - x + 400) / (o.stripe || 6)) % C.length; const L = 2 + ((xx - x + 400) % (o.stripe || 6) < 3 ? 1 : 0); for (let k = 0; k < L; k++) K.put(s, xx, y + d + k, sh(C[st])); }
  }
  /** Farola alta (≈ 100 px) con brazo; devuelve la posición de la lámpara para el halo dinámico */
  function lampPost(pb, x, y, h = 96, o = {}) {
    const S = P(o.ramp || R.METAL);
    for (let yy = y - h; yy < y; yy++) { K.put(pb, x, yy, S[6]); K.put(pb, x + 1, yy, S[4]); K.put(pb, x + 2, yy, S[2]); }
    rect(pb, x - 2, y - 6, 7, 6, (xx, yy) => S[xx < x ? 7 : xx > x + 2 ? 2 : 5]);
    for (let k = 0; k < 4; k++) rect(pb, x - 1 + (k % 2), y - h + 12 + k * 22, 5 - (k % 2) * 2, 1, S[7]);
    const dir = o.dir ?? 1, ax = x + (dir > 0 ? 3 : -11);
    for (let k = 0; k < 12; k++) { K.put(pb, x + 1 + dir * k, y - h + Math.round(Math.abs(k - 6) * 0.2), S[6]); K.put(pb, x + 1 + dir * k, y - h + 1 + Math.round(Math.abs(k - 6) * 0.2), S[3]); }
    const lx = x + 1 + dir * 11;
    rect(pb, lx - 3, y - h + 1, 7, 3, (xx, yy) => S[yy === y - h + 1 ? 7 : 3]);
    rect(pb, lx - 2, y - h + 4, 5, 2, U(o.col || '#fff2b0'));
    return { x: lx, y: y - h + 5, ax };
  }
  /** Banco en 3/4 (asiento a 19 px del suelo, para personajes de 74 px) */
  function bench(pb, x, y, w = 40, o = {}) {
    const Wd = P(o.ramp || R.WOOD), S = P(R.METAL);
    const s = sprite(w + 8, 34), b = 30;
    for (const lx of [3, w - 3]) { rect(s, lx, b - 19, 3, 19, (xx) => S[xx === lx ? 6 : 3]); rect(s, lx + 3, b - 23, 2, 22, S[2]); }
    // asiento (cara superior 4 px + canto 2 px)
    for (let r = 0; r < 4; r++) for (let xx = 1 + r; xx < w + 1 + r; xx++) K.put(s, xx, b - 20 - r, Wd[(r % 2 ? 5 : 6) - ((xx % 9) === 0 ? 2 : 0)]);
    rect(s, 1, b - 20, w, 2, (xx, yy) => Wd[yy === b - 20 ? 4 : 2]);
    // respaldo
    for (let k = 0; k < 2; k++) rect(s, 5, b - 32 + k * 5, w, 3, (xx, yy) => Wd[yy === b - 32 + k * 5 ? 6 : 4 - ((xx % 9) === 0 ? 1 : 0)]);
    finish(s); stamp(pb, s, x - 1, y - b);
    contact(pb, x + w / 2, y, w / 2 + 2, 2);
  }
  /** Barandilla de tubo (≈30 px) con postes; cols de rampa */
  function rail(pb, x0, x1, y, h = 30, o = {}) {
    const C = P(o.ramp || ['#2a1e04', '#6a4a0a', '#b08018', '#e8b830', '#ffe080']);
    for (let x = x0; x <= x1; x++) { K.put(pb, x, y - h, C[4]); K.put(pb, x, y - h + 1, C[2]); K.put(pb, x, y - Math.round(h * 0.5), C[3]); K.put(pb, x, y - Math.round(h * 0.5) + 1, C[1]); }
    for (let x = x0; x <= x1; x += o.gap || 16) for (let yy = y - h; yy < y; yy++) { K.put(pb, x, yy, C[3]); K.put(pb, x + 1, yy, C[1]); }
  }
  /** Valla de madera de postes y travesaños (≈26 px) */
  function fence(pb, x0, x1, y, o = {}) {
    const Wd = P(o.ramp || R.WOODG), h = o.h || 26;
    for (const fy of [y - h + 6, y - 9]) for (let x = x0; x <= x1; x++) { K.put(pb, x, fy, Wd[6]); K.put(pb, x, fy + 1, Wd[4]); K.put(pb, x, fy + 2, Wd[2]); }
    for (let x = x0; x <= x1; x += o.gap || 22) for (let yy = y - h; yy < y + 1; yy++) { K.put(pb, x, yy, Wd[yy === y - h ? 7 : 5]); K.put(pb, x + 1, yy, Wd[4]); K.put(pb, x + 2, yy, Wd[1]); }
  }
  /** Depósito vertical con patas/plinto, bandas, placa con texto opcional. Devuelve {top, cx, r} */
  function tank(pb, cx, yb, r, h, o = {}) {
    const C = P(PFTerrain.CONC);
    if (o.plinth !== false) PFInfra.box3q(pb, cx - r - 4, yb, 2 * r + 9, 5, 6, { ramp: PFTerrain.CONC });
    castR(pb, cx - r, cx + r, yb - 4, Math.round(h * 0.25), { amt: -0.22, yMin: yb - 18 });
    const res = PFInfra.cylV(pb, cx, yb - 5, r, h, { ramp: o.ramp, band: o.band, bands: o.bands || [{ y: 6, h: 3 }, { y: h - 8, h: 2 }], dome: o.dome ?? 0.4, ladder: o.ladder, stain: o.stain ?? true, ell: o.ell });
    if (o.label) plaque(pb, cx - 1, yb - 5 - Math.round(h * 0.55), o.label, { center: true, bg: o.labelBg || '#06203a', border: o.labelBd || '#8ad8f4', col: '#f4fbff' });
    return { top: res.top, cx, r, yb };
  }
  /** Montón de cantos rodados (Worley) dentro de una elipse apoyada en (x,y) */
  function rocks(pb, x, y, w, h, seed = 1, ramp = RAMP.rockWarmR) {
    const Pr = K.P32(ramp);
    for (let yy = Math.round(y - h); yy <= y; yy++) for (let xx = Math.round(x - w / 2); xx <= Math.round(x + w / 2); xx++) {
      const nx = (xx - x) / (w / 2), ny = (yy - y) / h; if (nx * nx + ny * ny > 1) continue;
      const u = PFTerrain.boulderPix(xx, yy, seed, Math.max(6, w / 3), Math.max(5, h / 1.6), Pr);
      if (u !== -1) K.put(pb, xx, yy, u);
    }
    contact(pb, x, y + 1, w / 2 + 2, 1.5);
  }
  /** Cactus columnar (cardón) con costillas, brazos y espinas */
  function cactus(pb, x, y, h, seed = 1) {
    const s = sprite(36, h + 4), C = K.P32(['#0c2016', '#163424', '#224c32', '#326642', '#468254', '#62a068', '#8cc080', '#c0e0a8']), r = RNG(seed), b = h + 2;
    const col = (cx, y0, y1, rw) => { for (let yy = y0; yy < y1; yy++) for (let k = -rw; k <= rw; k++) { const f = (k + rw) / (2 * rw); let ki = f < 0.15 ? 3 : f < 0.4 ? 6 : f < 0.55 ? 5 : f < 0.8 ? 3 : 1; if ((k + rw) % 3 === 0) ki -= 1; if (yy === y0) ki += 1; K.put(s, cx + k, yy, C[clamp(ki, 0, 7)]); } for (let k = -rw + 1; k < rw; k++) K.put(s, cx + k, y0 - 1, C[Math.abs(k) < rw - 1 ? 7 : 5]); };
    col(18, b - h, b, 4);
    const arms = [[r.int(6, 10), b - Math.round(h * 0.55), b - Math.round(h * 0.85)], [r.int(26, 30), b - Math.round(h * 0.4), b - Math.round(h * 0.7)]];
    for (const [ax, ay, at] of arms) { col(ax, at, ay + 3, 3); for (let xx = Math.min(ax, 18); xx <= Math.max(ax, 18); xx++) for (let k = 0; k < 5; k++) K.put(s, xx, ay + k - 1, C[k === 0 ? 6 : k < 3 ? 4 : 2]); }
    for (let i = 0; i < h; i += 3) K.put(s, 18 + ((i / 3) % 2 ? 3 : -3), b - h + i, U('#f4f0d0'));
    if (r() < 0.6) for (let k = 0; k < 3; k++) K.put(s, 16 + k * 2, b - h - 1, U(['#ff6a9a', '#ffe14d', '#ff6a9a'][k]));
    finish(s, { rimK: 0.5 }); stamp(pb, s, x - 18, y - b);
    contact(pb, x, y, 7, 1.5);
  }
  /* ---------- dinámico: halos, LED, pantallas ---------- */
  /** list: [{x,y,r,col,a,hz,ph,mode:'steady'|'pulse'|'blink'|'flicker', on:(sc)=>bool}] en mundo */
  function glows(g, sc, list) {
    const ox = sc.cam.ox, oy = sc.cam.oy, t = Game.time;
    for (const L of list) {
      const x = L.x - ox, y = L.y - oy, r = L.r || 6;
      if (x < -r || x > W + r || y < -r || y > H + r) continue;
      if (L.on && !L.on(sc)) continue;
      let a = L.a ?? 0.5;
      if (L.mode === 'pulse') a *= 0.65 + 0.35 * Math.sin(t * (L.hz || 1.5) * TAU + (L.ph || 0));
      else if (L.mode === 'blink') { if (Math.sin(t * (L.hz || 1) * TAU + (L.ph || 0)) < 0) continue; }
      else if (L.mode === 'flicker') a *= 0.8 + 0.2 * Math.sin(t * 23 + (L.ph || 0)) * Math.sin(t * 7.3);
      K.drawGlow(g, x, y, r, typeof L.col === 'function' ? L.col(sc) : L.col, a, 'lighter', L.rings || 4);
      if (L.core) { g.fillStyle = L.core; g.fillRect(Math.round(x) - (L.cs || 0), Math.round(y) - (L.cs || 0), 1 + (L.cs || 0) * 2, 1 + (L.cs || 0) * 2); }
    }
  }
  /** Pantallas animadas: [{x,y,w,h,kind:'bars'|'wave'|'grid'|'text', col, col2}] (mundo) */
  function screens(g, sc, list) {
    const ox = sc.cam.ox, oy = sc.cam.oy, t = Game.time;
    for (const S of list) {
      const x = Math.round(S.x - ox), y = Math.round(S.y - oy);
      if (x > W || x + S.w < 0 || y > H || y + S.h < 0) continue;
      if (S.on && !S.on(sc)) continue;
      const col = typeof S.col === 'function' ? S.col(sc) : (S.col || '#56e5ff');
      g.fillStyle = col;
      if (S.kind === 'bars') { const n = Math.max(2, Math.floor(S.w / 3)); for (let i = 0; i < n; i++) { const hh = Math.max(1, Math.round((0.35 + 0.6 * Math.abs(Math.sin(t * 1.3 + i * 1.7 + S.x))) * (S.h - 1))); g.fillRect(x + i * 3, y + S.h - hh, 2, hh); } }
      else if (S.kind === 'wave') { for (let i = 0; i < S.w; i++) g.fillRect(x + i, Math.round(y + S.h / 2 + Math.sin(i * 0.5 + t * 3 + S.x) * (S.h / 2 - 1)), 1, 1); if (S.col2) { g.fillStyle = S.col2; for (let i = 0; i < S.w; i += 2) g.fillRect(x + i, Math.round(y + S.h / 2 + Math.cos(i * 0.3 + t * 2) * (S.h / 3)), 1, 1); } }
      else if (S.kind === 'grid') { for (let i = 0; i < S.w; i += 3) for (let j = 0; j < S.h; j += 3) if (Math.sin(i * 1.3 + j * 2.1 + Math.floor(t * 2)) > 0.3) g.fillRect(x + i, y + j, 2, 2); }
      else { for (let j = 0; j < S.h; j += 2) g.fillRect(x, y + j, Math.max(1, Math.round(S.w * (0.3 + 0.7 * Math.abs(Math.sin(j * 1.7 + Math.floor(t * 1.5) + S.x))))), 1); }
    }
  }
  /** Marcador de pista (estación 'clue') en 3/4: cristal facetado sobre pedestal pequeño */
  function drawClue(g, x, y, st) {
    const t = Game.time, b = Math.round(Math.sin(t * 3) * 1.5), col = st.glow || '#b49cff';
    frect(g, x - 6, y - 3, 13, 3, '#2a1e44'); frect(g, x - 5, y - 4, 11, 1, '#6a5a9a');
    K.drawGlow(g, x, y - 20 + b, 12, col, 0.45);
    g.fillStyle = '#3f2690'; g.beginPath(); g.moveTo(x, y - 30 + b); g.lineTo(x + 5, y - 21 + b); g.lineTo(x, y - 11 + b); g.lineTo(x - 5, y - 21 + b); g.fill();
    frect(g, x - 3, y - 25 + b, 3, 9, '#b49cff'); frect(g, x, y - 25 + b, 2, 7, '#8d6bff'); frect(g, x - 2, y - 26 + b, 1, 3, '#f4f0ff');
    for (let k = 0; k < 6; k++) { const a = t * 2 + k * 1.047; fpx(g, x + Math.cos(a) * 11, y - 20 + b + Math.sin(a) * 4, k % 2 ? col : '#f4f0ff'); }
    if (st.done) frect(g, x - 1, y - 33 + b, 3, 1, '#3fe0a0');
  }
  return { R, P, LIGHT, sprite, finish, stamp, rect, shade, contact, castR, door, win, plaque, awning, lampPost, bench, rail, fence, tank, rocks, cactus, glows, screens, drawClue };
})();

/* ---------- extensiones compatibles de los kits PF ---------- */
(function () {
  // tuberías: nuevos fluidos (código de color STYLE LOCK §12)
  Object.assign(PFInfra.PIPES, {
    perm: { ramp: ['#0c2e4a', '#106a8a', '#1ebde3', '#48d4f0', '#6de1f1', '#d0f4f8', '#ffffff'], ink: '#071c30', chev: '#ffffff', glow: '#48d4f0' },
    upw: { ramp: ['#0a3a5a', '#0e7aa8', '#22c8f0', '#5ae0ff', '#a0f0ff', '#e0fcff', '#ffffff'], ink: '#06203a', chev: '#ffffff', glow: '#5ae0ff' },
    well: { ramp: ['#2a1a08', '#5a3a12', '#8a5a1e', '#b07a2e', '#cc9a4a', '#e6c07a', '#f8e2b0'], ink: '#1a0e04', chev: '#ffe2a0', glow: null },
    rain: { ramp: ['#0e2a1a', '#1a4a2c', '#2a6e3e', '#3e9254', '#62b46e', '#9cd896', '#d8f4cc'], ink: '#08180e', chev: '#e0ffd0', glow: null },
    irrig: { ramp: ['#062a2a', '#0a4e4a', '#12786a', '#1ca08a', '#3cc4a6', '#8ae6cc', '#d8fff0'], ink: '#041a1a', chev: '#d8fff0', glow: '#3cc4a6' },
    h2: { ramp: ['#062a1a', '#0e4a2e', '#167044', '#22985e', '#3cc47e', '#86e8b4', '#eafff4'], ink: '#03160c', chev: '#ffffff', glow: '#3cc47e' },
    o2: { ramp: ['#14243a', '#2a4466', '#4a6c96', '#7096c0', '#9cbede', '#cce0f2', '#ffffff'], ink: '#0a1424', chev: '#ffffff', glow: null },
    power: { ramp: ['#2a1e04', '#5a4208', '#8e6a10', '#c49418', '#ecc030', '#ffe070', '#fff6c0'], ink: '#140e02', chev: '#fff6a0', glow: '#ecc030' },
    cool: { ramp: ['#0a1a3a', '#12306a', '#1c4c9a', '#2c6cc8', '#4a90e8', '#8ab8f8', '#d8e8ff'], ink: '#060e24', chev: '#e0f0ff', glow: '#4a90e8' },
    brineB: { ramp: ['#05081a', '#0b0e20', '#12162f', '#2a2c44', '#584f56', '#9485ac', '#b8a8d0'], ink: '#030512', chev: '#e07ecf', glow: null },
  });
  // terreno: despacho al renderizador del kit B
  const baseRender = PFTerrain.render;
  PFTerrain.render = function (world) {
    if (world.def.pf && world.def.pf.kitB && typeof PFBGround !== 'undefined') return PFBGround.render(world);
    return baseRender(world);
  };
  // oclusores frontales nuevos
  const baseBuild = PFStage.build;
  PFStage.build = function (sc) {
    const P = sc.def.pf || {}, all = P.fg || [];
    const mine = (typeof PFBFront !== 'undefined') ? all.filter(o => PFBFront.kinds[o.kind]) : [];
    if (!mine.length) return baseBuild(sc);
    P.fg = all.filter(o => !mine.includes(o));
    let st;
    try { st = baseBuild(sc); } finally { P.fg = all; }
    const t0 = nowMs();
    for (const o of mine) {
      const pb = PFBFront.kinds[o.kind](o);
      st.fg.push({ c: pb.toCanvas(), x: o.x, y: o.y ?? 0, f: o.f || 1.3, w: pb.w, h: pb.h, top: !!o.top || o.kind === 'cables' || o.kind === 'beam', sway: o.sway ?? (o.kind === 'reeds' || o.kind === 'dark' ? 1 : 0), ph: (o.seed || 1) * 0.7 });
    }
    st.ms += Math.round(nowMs() - t0);
    return st;
  };
  // agua somera de estanque (style:'pond')
  if (typeof PFWater !== 'undefined') {
    const bB = PFWater.build, bBack = PFWater.renderBack, bFront = PFWater.renderFront;
    PFWater.build = (world, w) => (w.style === 'pond' && typeof PFBPond !== 'undefined') ? PFBPond.build(world, w) : bB(world, w);
    PFWater.renderBack = (g, sc, Wt) => (Wt && Wt.pond) ? PFBPond.renderBack(g, sc, Wt) : bBack(g, sc, Wt);
    PFWater.renderFront = (g, sc, Wt) => (Wt && Wt.pond) ? PFBPond.renderFront(g, sc, Wt) : bFront(g, sc, Wt);
  }
  // escaleras en 3/4 (look:'wood'|'steel'); el resto sigue con el dibujo base
  if (typeof drawLadder === 'function') {
    const baseLadder = drawLadder;
    const cache = new Map();
    // eslint-disable-next-line no-global-assign
    drawLadder = function (g, l, ox, oy) {
      if (!l.look) return baseLadder(g, l, ox, oy);
      const key = l.look + '|' + (l.y1 - l.y0);
      let c = cache.get(key);
      if (!c) {
        const h = Math.round(l.y1 - l.y0) + 4, s = PFB.sprite(18, h), Wd = PFB.P(l.look === 'steel' ? PFB.R.METAL : PFB.R.WOOD);
        for (let y = 0; y < h; y++) { for (const [x, k] of [[1, 6], [2, 4], [3, 2], [14, 5], [15, 3], [16, 1]]) PFK.put(s, x, y, Wd[clamp(k + (l.look === 'steel' ? 2 : 0), 0, Wd.length - 1)]); }
        for (let y = 4; y < h - 2; y += 7) { for (let x = 4; x < 14; x++) { PFK.put(s, x, y, Wd[l.look === 'steel' ? 8 : 6]); PFK.put(s, x, y + 1, Wd[l.look === 'steel' ? 4 : 3]); } PFK.put(s, 4, y + 2, Wd[1]); }
        PFB.finish(s, { rimK: 0.3 });
        c = s.toCanvas(); cache.set(key, c);
      }
      const x = Math.round(l.x - ox), y0 = Math.round(l.y0 - oy);
      if (x < -20 || x > W + 20) return;
      g.drawImage(c, x - 9, y0 - 2);
    };
  }
})();
