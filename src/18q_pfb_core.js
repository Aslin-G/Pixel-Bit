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
  /** Sombra que respeta el material: sobre superficies cálidas (arena, arenisca, adobe) un tono
      frío lejano haría girar el matiz por rojo/magenta y ganar croma (#ea5c39 sobre arena).
      Ahí se oscurece por multiplicación con un tinte pardo-violáceo (menos croma, matiz estable);
      en superficies frías se mantiene el desplazamiento de matiz hacia hue. Cacheado. */
  const _shS = new Map();
  function shS(u, amt, hue = 235) {
    const key = u + '|' + amt + '|' + hue; let v = _shS.get(key); if (v !== undefined) return v;
    const r = u & 255, g = (u >>> 8) & 255, b = (u >>> 16) & 255, a = u >>> 24;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx ? (mx - mn) / mx : 0;
    let h = 0; if (mx !== mn) { h = mx === r ? ((g - b) / (mx - mn)) % 6 : mx === g ? (b - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4; h = (h * 60 + 360) % 360; }
    const warm = (h < 80 || h > 330) && sat > 0.12, far = hue !== null && Math.abs(((hue - h + 540) % 360) - 180) > 90;
    if (amt < 0 && warm && far) {
      const k = -amt, f = (c, m) => clamp(Math.round(c * (1 - k * m)), 0, 255);
      v = ((a << 24) | (f(b, 1.0) << 16) | (f(g, 1.1) << 8) | f(r, 0.9)) >>> 0;
    } else v = K.shU(u, amt, hue);
    _shS.set(key, v); return v;
  }
  /** Oscurece píxeles opacos en un rect (sombra pintada, sin tramado) */
  function shade(pb, x, y, w, h, amt = -0.25, hue = 235) {
    x = Math.round(x); y = Math.round(y);
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) { const c = K.get(pb, xx, yy); if (c >>> 24) K.put(pb, xx, yy, shS(c, amt, hue)); }
  }
  /** Sombra de contacto elíptica bajo un objeto (2 anillos) */
  function contact(pb, cx, y, rx, ry = 2, amt = -0.3) {
    for (let yy = Math.floor(y - ry); yy <= Math.ceil(y + ry); yy++) for (let xx = Math.floor(cx - rx); xx <= Math.ceil(cx + rx); xx++) {
      const nx = (xx - cx) / rx, ny = (yy - y) / (ry + 0.01), d = nx * nx + ny * ny; if (d > 1) continue;
      const c = K.get(pb, xx, yy); if (c >>> 24) K.put(pb, xx, yy, shS(c, d < 0.45 ? amt : amt * 0.55, 235));
    }
  }
  /** Sombra proyectada hacia atrás-derecha (luz arriba-izquierda) sobre el suelo ya pintado.
      Paralelogramo: base (x0..x1, y), se aleja len px a la derecha y sube k·len. */
  function castR(pb, x0, x1, y, len, o = {}) {
    const up = o.up ?? 0.42, amt = o.amt ?? -0.26, hue = o.hue ?? 235, yMin = o.yMin ?? -1e9;
    for (let s = 0; s <= len; s++) {
      const yy = Math.round(y - s * up); if (yy < yMin) break;
      const a = s > len * 0.7 ? amt * 0.55 : amt;
      for (let xx = Math.round(x0 + s); xx <= Math.round(x1 + s); xx++) { const c = K.get(pb, xx, yy); if (c >>> 24) K.put(pb, xx, yy, shS(c, a, hue)); }
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
  /** Parte un recorrido de flujo largo en tramos de step px (múltiplo de 12 para que los chevrones
      no salten) para que PFInfra.drawFlows pueda descartar los que quedan fuera de pantalla */
  function chunkFlow(run, step = 192) {
    const out = [];
    for (let i = 0; i < run.pts.length - 1; i++) {
      const [x0, y0] = run.pts[i], [x1, y1] = run.pts[i + 1], L = Math.abs(x1 - x0) + Math.abs(y1 - y0), sx = Math.sign(x1 - x0), sy = Math.sign(y1 - y0);
      for (let a = 0; a < L; a += step) { const b = Math.min(L, a + step); out.push(Object.assign({}, run, { pts: [[x0 + sx * a, y0 + sy * a], [x0 + sx * b, y0 + sy * b]] })); }
    }
    return out;
  }
  return { R, P, LIGHT, sprite, finish, chunkFlow, stamp, rect, shS, shade, contact, castR, door, win, plaque, awning, lampPost, bench, rail, fence, tank, rocks, cactus, glows, screens, drawClue };
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

/* =====================================================================
   FIXLB_ADV — adversarios conceptuales de los niveles 6–10 como criaturas
   legibles (antes: disco de 5 px con píxeles orbitando). Tiras animadas
   precalculadas (6–8 cuadros, 30–36 px de ancho, 26–44 de alto) con rampas
   desplazadas de tono, luz de borde arriba-izquierda y contorno selectivo;
   en juego: 1 halo aditivo + 1 drawImage por adversario. Lo instala
   Adversary.prototype.render en 46_lv06.js (la clase se define en 30_world.js).
   ===================================================================== */
const FIXLB_ADV = (() => {
  const K = PFK, cache = new Map();
  const R = {
    dust: ['#2a0e06', '#4a1c0c', '#6a2a14', '#8e4220', '#a85024', '#c8742e', '#e2a052', '#f4c27a', '#ffe0b0'],
    gust: ['#1e2840', '#2a3656', '#3a4a6e', '#5a6e94', '#8396ba', '#a8bcd8', '#cbdaea', '#eef4fb'],
    soc: ['#0c0824', '#1a1240', '#2c1e6a', '#40289a', '#5a38b8', '#7a5ad0', '#a08ae6', '#cfc2f6'],
    lime: ['#3a5a10', '#6a9a20', '#b6f05a', '#e6ffc0'],
    ghost: ['#10262a', '#1a3a3a', '#28544c', '#3c7262', '#56907a', '#78ae96', '#a6ceb8', '#dcf0e4'],
    leaf: ['#1e5a12', '#3a9a1c', '#6cd030', '#a2ec4a', '#d2fa8a', '#f2ffd0'],
    salt: ['#2a0a2e', '#4a1250', '#621a66', '#8e2a7e', '#bc3e92', '#e06aac', '#f888b8', '#ffc4dc', '#fff0f6'],
    gold: ['#2a1806', '#4a2e0a', '#6a420e', '#9a6414', '#c8861a', '#e0a830', '#ffd84a', '#fff0a0', '#fffbe6'],
    ribbon: ['#4e0e12', '#7a1a1c', '#a82a26', '#d04434', '#ec6a4a'],
  };
  const P = (k) => K.P32(R[k]);
  const put = (pb, x, y, u) => K.put(pb, Math.round(x), Math.round(y), u);
  const eye = (pb, x, y, white = '#ffffff', pupil = '#140d26') => { for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) put(pb, x + dx, y + dy, U(pupil)); put(pb, x, y, U(white)); };
  const B = {
    /** Remolino de polvo: embudo en espiral con bandas ocres, nube en la boca, guijarros y brasas por ojos */
    dust: { n: 8, w: 32, h: 44, glow: '#ff8a3a', hue: 18, draw(pb, i) {
      const C = P('dust'), n = C.length, ph = i / 8 * TAU;
      for (let y = 4; y < 42; y++) {
        const t = (y - 4) / 37, r = lerp(12.5, 2.2, Math.pow(t, 0.85)), cx = 16 + Math.sin(ph + t * 3.4) * (0.8 + t * 2.4);
        for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
          const nx = (x + 0.5 - cx) / r; if (Math.abs(nx) > 1) continue;
          if (Math.abs(nx) > 0.8 && hash2(x, y, i + 3) < 0.45) continue;
          const band = ((Math.floor(y * 0.5 + Math.asin(clamp(nx, -1, 1)) * 2.4 - i * 0.75) % 3) + 3) % 3;
          const k = Math.round(3.2 - nx * 2.2 - t * 1.2 + (band === 0 ? -1.4 : band === 2 ? 1 : 0));
          put(pb, x, y, C[clamp(k, 0, n - 2)]);
        }
      }
      // nube de polvo en la boca del embudo
      for (let k = 0; k < 4; k++) { const bx = 16 + (k - 1.5) * 6 + Math.sin(ph + k) * 1.2, by = 5 + (k % 2); K.ellipseFn(pb, bx, by, 5, 3.6, (nx, ny) => C[clamp(Math.round(5 - nx * 1.4 - ny * 2.2), 0, n - 1)]); }
      // guijarros que giran (solo los de delante)
      for (let k = 0; k < 5; k++) { const a = ph + k * 1.26, yy = 10 + k * 6, rr = lerp(13, 4, (yy - 4) / 37) + 1.5, xx = 16 + Math.cos(a) * rr; if (Math.sin(a) < -0.2) continue; put(pb, xx, yy, U('#4a1c0c')); put(pb, xx, yy - 1, U('#c8742e')); }
      // brasas de MIRAGE por ojos
      for (const ex of [11, 19]) { put(pb, ex, 13, U('#fff0b8')); put(pb, ex + 1, 13, U('#ffd890')); put(pb, ex, 14, U('#ff8a3a')); put(pb, ex + 1, 14, U('#c84a1a')); }
    } },
    /** Bucle de ráfaga: espiral de viento con cara y estelas que se alargan */
    gust: { n: 6, w: 36, h: 30, glow: '#cbdaea', hue: 225, rim: '#f4f8ff', draw(pb, i) {
      const C = P('gust'), n = C.length, ph = i / 6 * TAU, cx = 14, cy = 15;
      for (let y = 0; y < 30; y++) for (let x = 0; x < 30; x++) {
        const dx = x + 0.5 - cx, dy = (y + 0.5 - cy) * 1.2, r = Math.hypot(dx, dy); if (r < 2.5 || r > 12.5) continue;
        const th = (Math.atan2(dy, dx) + ph + TAU * 2) % TAU, u = r - 2.4 - th / TAU * 5.6, m = ((u % 5.6) + 5.6) % 5.6;
        if (m >= 2.8) continue;
        put(pb, x, y, C[clamp(Math.round(4 - dx / 10 * 1.6 - dy / 10 * 1.6 + (m < 1 ? 1 : m > 2 ? -1 : 0)), 0, n - 1)]);
      }
      K.ellipseFn(pb, cx, cy, 4.2, 3.6, (nx, ny) => C[clamp(Math.round(6 - nx - ny * 1.5), 0, n - 1)]);
      eye(pb, cx - 3, cy - 1); eye(pb, cx + 1, cy - 1);
      // estelas de viento a sotavento
      for (const [yy, L0] of [[9, 6], [15, 9], [21, 5]]) { const L = L0 + Math.round((Math.sin(ph + yy) + 1) * 2); for (let k = 0; k < L; k++) put(pb, 26 + k, yy + (k > L * 0.6 ? 1 : 0), C[k < L * 0.5 ? 6 : 4]); }
    } },
    /** Ácaro de batería: celda con patas que se bebe su propia barra de SOC */
    socEater: { n: 6, w: 34, h: 26, glow: '#b6f05a', hue: 250, draw(pb, i) {
      const C = P('soc'), L = P('lime'), n = C.length;
      const x0 = 7, x1 = 28, y0 = 6, y1 = 18;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        if ((x === x0 || x === x1) && (y === y0 || y === y1)) continue;
        const u = (x - x0) / (x1 - x0), v = (y - y0) / (y1 - y0);
        put(pb, x, y, C[clamp(Math.round(5.6 - u * 2 - v * 3 + (y === y0 ? 1.4 : 0)), 0, n - 1)]);
      }
      // borne y barra de SOC que se vacía cuadro a cuadro
      for (let y = 10; y <= 14; y++) { put(pb, x1 + 1, y, U('#d8d0f0')); put(pb, x1 + 2, y, U(y === 10 ? '#ffffff' : '#9a90c0')); }
      const lvl = Math.round(lerp(13, 3, i / 5));
      for (let y = 10; y <= 14; y++) for (let x = 11; x <= 25; x++) put(pb, x, y, (x - 11) < lvl ? L[y === 10 ? 3 : y === 14 ? 1 : 2] : U(y === 10 ? '#2c1e6a' : '#140a2a'));
      for (const [px, py] of [[18, 7], [17, 8], [18, 8], [19, 8]]) put(pb, px, py, U('#e6ffc0'));
      // mandíbulas que se abren y cierran
      const op = i % 3;
      for (let k = 0; k < 4; k++) { put(pb, x0 - 1 - k, 12 - op - Math.floor(k / 2), L[k < 2 ? 2 : 3]); put(pb, x0 - 1 - k, 15 + op + Math.floor(k / 2), L[k < 2 ? 1 : 2]); }
      eye(pb, x0 + 1, 7, '#e6ffc0', '#0c0824');
      // antenas y patas alternas
      K.lineFn(pb, 9, y0 - 1, 5 + (i % 2), 1, () => C[6]); K.lineFn(pb, 12, y0 - 1, 11 - (i % 2), 0, () => C[5]);
      for (let k = 0; k < 3; k++) { const lx = 11 + k * 7, s = ((i + k) % 2) ? 1 : -1; K.lineFn(pb, lx, y1 + 1, lx + s * 2, y1 + 5, () => C[2]); put(pb, lx + s * 2, y1 + 6, C[1]); }
    } },
    /** Fantasma del lavado verde: sábana verde con jirones y una máscara de hoja sobre la cara */
    greenwash: { n: 6, w: 30, h: 36, glow: '#86e36f', hue: 150, draw(pb, i) {
      const C = P('ghost'), Lf = P('leaf'), n = C.length, ph = i / 6 * TAU;
      for (let y = 2; y < 34; y++) for (let x = 2; x < 28; x++) {
        const dx = x + 0.5 - 15, inside = y < 13 ? Math.hypot(dx, (y + 0.5 - 13) * 1.05) <= 11 : Math.abs(dx) <= 11 - Math.max(0, y - 22) * 0.25;
        const bot = 31 + Math.round(Math.sin(x * 0.95 + ph) * 2); if (!inside || y > bot) continue;
        put(pb, x, y, C[clamp(Math.round(5.4 - dx / 11 * 1.8 - (y - 2) / 32 * 2.6 + (Math.sin(x * 0.7 + y * 0.2) > 0.6 ? 0.8 : 0)), 0, n - 1)]);
      }
      // bracitos
      for (const s of [-1, 1]) { const ax = 15 + s * 11, ay = 20 + Math.round(Math.sin(ph + (s > 0 ? 1 : 0)) * 1.5); for (let k = 0; k < 4; k++) put(pb, ax + s * k, ay - Math.floor(k / 2), C[k === 3 ? 6 : 4]); }
      // máscara de hoja inclinada con ojos huecos
      for (let y = 6; y < 19; y++) for (let x = 5; x < 26; x++) {
        const u = x + 0.5 - 15.5, v = y + 0.5 - 12.5, a = 0.32, ru = u * Math.cos(a) + v * Math.sin(a), rv = -u * Math.sin(a) + v * Math.cos(a);
        const half = 4.6 * Math.sqrt(Math.max(0, 1 - (ru / 9.5) * (ru / 9.5))); if (Math.abs(rv) > half) continue;
        put(pb, x, y, Math.abs(rv) < 0.6 ? Lf[1] : Lf[clamp(Math.round(3.4 - rv / 4 - ru / 12), 0, Lf.length - 1)]);
      }
      for (const ex of [11, 18]) { eye(pb, ex, 12, '#04120a', '#04120a'); put(pb, ex + 1, 12, U('#e6ffc0')); }
      put(pb, 25, 7, Lf[0]); put(pb, 26, 6, Lf[0]);
    } },
    /** Espejismo de sal: racimo de cristales rosados que reverbera como el aire caliente */
    saltMirage: { n: 6, w: 30, h: 36, glow: '#f888b8', hue: 300, draw(pb, i) {
      const C = P('salt'), n = C.length, ph = i / 6 * TAU;
      const tmp = new PixelBuffer(30, 36);
      for (const [cx, hh, hw] of [[8, 13, 3], [21, 15, 3], [15, 23, 4], [11, 9, 2], [24, 9, 2]]) {
        const yb = 32;
        for (let y = yb - hh; y <= yb; y++) for (let x = cx - hw; x <= cx + hw; x++) {
          const tip = (yb - hh) + Math.abs(x - cx) * 1.2; if (y < tip) continue;
          put(tmp, x, y, C[clamp(x === cx ? 7 : x < cx ? 6 - Math.round((y - tip) / hh * 2) : 4 - Math.round((y - tip) / hh * 2), 0, n - 1)]);
        }
      }
      for (let x = 4; x < 27; x++) { put(tmp, x, 33, C[x < 15 ? 7 : 6]); put(tmp, x, 34, C[3]); }
      // reverberación: las filas altas ondulan como el aire caliente
      for (let y = 0; y < 36; y++) { const s = y < 26 ? Math.round(Math.sin(y * 0.5 + ph) * 1.2) : 0; for (let x = 0; x < 30; x++) { const c = tmp.data[y * 30 + x]; if (c >>> 24) put(pb, x + s, y, c); } }
      eye(pb, 13, 18, '#ffffff', '#2a0a2e'); eye(pb, 16, 18, '#ffffff', '#2a0a2e');
      put(pb, 15, 21 + (i % 2), U('#2a0a2e'));
    } },
    /** MonoScore: medalla dorada con «100» que lo resume todo, cintas al viento y mirada satisfecha */
    monoscore: { n: 6, w: 32, h: 38, glow: '#ffd84a', hue: 30, draw(pb, i) {
      const G = P('gold'), Rb = P('ribbon'), n = G.length, ph = i / 6 * TAU;
      for (const s of [-1, 1]) { const sway = Math.sin(ph + (s > 0 ? 1.2 : 0)) * 1.5; for (let y = 21; y < 35; y++) { const xx = 16 + s * (3 + (y - 21) * 0.32) + sway * (y - 21) / 14; for (let k = 0; k < 4; k++) { if (y > 32 && k > 0 && k < 3) continue; put(pb, xx + k - 2, y, Rb[clamp(k === 0 ? 4 : k === 3 ? 1 : 3 - ((y >> 2) % 2), 0, 4)]); } } }
      for (let y = 0; y < 28; y++) for (let x = 2; x < 30; x++) {
        const dx = x + 0.5 - 16, dy = y + 0.5 - 13.5, r = Math.hypot(dx, dy), R0 = 11.5 + Math.cos(Math.atan2(dy, dx) * 14) * 0.8; if (r > R0) continue;
        let k = Math.round(5.2 - dx / 12 * 1.6 - dy / 12 * 2);
        if (r > R0 - 1.6) k += 1; else if (r > 8 && r < 9.2) k -= 2;
        if (((x + y) - i * 6 + 60) % 36 < 3 && r < 8) k += 2; // destello que barre la cara
        put(pb, x, y, G[clamp(k, 0, n - 1)]);
      }
      K.text(pb, '100', 16 - Math.round(K.measure('100', { font: 'tiny' }) / 2), 13, U('#4a2e0a'), { font: 'tiny', shadow: U('#fff0a0') });
      for (const ex of [11, 19]) { put(pb, ex, 8, U('#2a1806')); put(pb, ex + 1, 8, U('#2a1806')); put(pb, ex + 2, 9, U('#2a1806')); }
      for (const s of [-1, 1]) { const lx = 16 + s * 5, st = (i + (s > 0 ? 3 : 0)) % 6 < 3 ? 0 : 1; put(pb, lx, 25, G[2]); put(pb, lx, 26, G[2]); put(pb, lx + s * st, 27, G[1]); put(pb, lx + s * (st + 1), 27, G[1]); }
    } },
  };
  function strip(type) {
    let s = cache.get(type); if (s) return s;
    const D = B[type];
    s = K.strip(D.n, D.w, D.h, (f, i) => { D.draw(f, i); K.rim(f, U(D.rim || '#fff1c8'), 0.4, -1, -1); K.selOut(f, -0.62, 'lrtb', D.hue); });
    cache.set(type, s); return s;
  }
  /** Dibuja el adversario e (Adversary) centrado en (x, y) de pantalla; k = 1 activo → 0 calmado */
  function draw(g, e, x, y, k) {
    const s = strip(e.type), D = B[e.type];
    const vx = Math.cos(e.t * e.speed / e.range + e.phase), flip = e.type === 'socEater' ? vx > 0 : e.type === 'gust' ? vx < 0 : false;
    const fi = Math.floor(e.t * (e.type === 'dust' ? 12 : 8)), yy = y - (1 - k) * 10;
    K.drawGlow(g, x, yy, Math.round(D.w * 0.55), D.glow, 0.22 * k);
    if (k < 1) g.globalAlpha = Math.max(0, k);
    K.drawStrip(g, s, fi, Math.round(x - D.w / 2), Math.round(yy - D.h / 2), flip);
    if (k < 1) g.globalAlpha = 1;
  }
  return { has: (type) => !!B[type], draw, strip, B };
})();
