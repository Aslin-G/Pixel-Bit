/* =====================================================================
   17e_vista_arch.js — Arquitectura del panorama (VISTA), en 3/4 elevado.
   API (todas pintan en un PixelBuffer; k = bruma 0..1 del plano):
     VISTA.box3q(pb, x, y, w, h, d, {front, side, top, k, sideK})   caja con cara frontal,
         lateral derecha (sombra) y techo; y = base frontal; d = fondo (px de pantalla)
     VISTA.house(pb, x, y, w, h, seed, {k, roof:'flat'|'dome'|'terrace'|'solar', d, tint})
     VISTA.tower(pb, x, y, w, h, seed, {k, glass, cap})              torre esbelta
     VISTA.domeCity(pb, cx, y, {k, s, label})  → {top, left, right, base, falls:[x...]}
     VISTA.greenhouse(pb, x, y, w, h, {k})
     VISTA.lighthouse(pb, x, y, h, {k})
   ===================================================================== */
(() => {
  const V = VISTA;
  const STONE = ['#4c3b2c', '#6d5c51', '#8a6a50', '#a6806a', '#bd8f70', '#d2a684', '#e8bf98', '#f2d5bb', '#fbe6c8'];
  const WHITE = ['#5a5466', '#7e7686', '#a39aa4', '#c4bcc0', '#ddd6d4', '#efe9e2', '#faf6ee', '#ffffff'];
  const GLASS = ['#1d3a52', '#2c5670', '#3e6a80', '#4f8a9c', '#5aa0b0', '#6fc8cc', '#85cdd4', '#9be4e6', '#cedee7', '#ffffff'];
  const BLUEW = ['#0e1f3a', '#15305a', '#1e4a7c', '#2e6aa0', '#4a8cc0', '#7ab4e0', '#b4daf4'];
  V.ARCH = { STONE, WHITE, GLASS, BLUEW };
  const ramp = (r, k) => V.P32(V.hz(r, k || 0));
  /** Caja en 3/4: frente (luz), lateral derecho (sombra) y techo (más claro) */
  V.box3q = function (pb, x, y, w, h, d, o = {}) {
    const R = ramp(o.ramp || WHITE, o.k), n = R.length;
    const dx = Math.round(d * 0.55), dy = Math.round(d * 0.5);
    const fi = o.front ?? n - 3, si = o.side ?? Math.max(0, n - 6), ti = o.top ?? n - 1;
    // techo
    V.poly(pb, [[x, y - h], [x + w, y - h], [x + w + dx, y - h - dy], [x + dx, y - h - dy]], (px, py) => R[(py === y - h - dy) ? Math.max(0, ti - 1) : ti - (hash2(px >> 1, py, 7) < 0.12 ? 1 : 0)]);
    // lateral
    V.poly(pb, [[x + w, y], [x + w, y - h], [x + w + dx, y - h - dy], [x + w + dx, y - dy]], (px, py) => R[si - ((py - (y - h)) > h * 0.7 ? 1 : 0)]);
    // frente
    for (let yy = y - h; yy < y; yy++) for (let xx = x; xx < x + w; xx++) {
      let k = fi - (yy > y - 3 ? 1 : 0) - (xx > x + w - 2 ? 1 : 0);
      if (hash2(xx >> 1, yy >> 1, 3) < 0.08) k -= 1;
      V.put(pb, xx, yy, R[clamp(k, 0, n - 1)]);
    }
    // aristas: borde iluminado arriba, sombra de contacto abajo
    for (let xx = x; xx < x + w; xx++) V.put(pb, xx, y - h, R[n - 1]);
    for (let xx = x; xx < x + w + dx; xx++) { const c = V.get(pb, xx, y); if (c >>> 24) V.put(pb, xx, y, V.shU(c, -0.25, 260)); }
    return { dx, dy };
  };
  /** Casa blanca pequeña en 3/4 con ventanas, puerta y techo (cúpula, terraza o FV) */
  V.house = function (pb, x, y, w, h, seed, o = {}) {
    const r = RNG(seed), k = o.k || 0;
    const d = o.d ?? Math.max(3, Math.round(w * 0.45));
    const pal = o.tint ? V.hz(WHITE.map(c => mixHex(c, o.tint, 0.18)), k) : V.hz(WHITE, k);
    const { dx, dy } = V.box3q(pb, x, y, w, h, d, { ramp: pal });
    const WIN = ramp(BLUEW, k);
    // ventanas
    const nw = Math.max(1, Math.floor((w - 2) / 4));
    for (let i = 0; i < nw; i++) {
      const wx = x + 2 + i * 4; if (wx + 2 > x + w - 1) break;
      const wy = y - h + 2;
      if (h >= 6) { V.put(pb, wx, wy, WIN[2]); V.put(pb, wx + 1, wy, WIN[3]); V.put(pb, wx, wy + 1, WIN[1]); V.put(pb, wx + 1, wy + 1, WIN[2]); }
    }
    if (h >= 7 && w >= 6) { const px = x + Math.floor(w / 2) - 1 + (r.chance(0.5) ? 1 : -1); for (let yy = y - 4; yy < y; yy++) { V.put(pb, px, yy, WIN[0]); V.put(pb, px + 1, yy, WIN[1]); } }
    // ventana lateral
    if (dx >= 2 && h >= 5) V.put(pb, x + w + 1, y - h + 2, WIN[1]);
    const roof = o.roof || r.pick(['flat', 'dome', 'terrace', 'solar', 'flat']);
    const ry = y - h - Math.round(dy / 2), rx = x + Math.round(dx / 2);
    if (roof === 'dome') {
      const rr = Math.max(2, Math.round(w * 0.28)), cx = rx + Math.round(w / 2);
      const D = ramp(r.chance(0.5) ? ['#1e4a7c', '#2e6aa0', '#4a8cc0', '#7ab4e0', '#b4daf4', '#e6f4fc'] : WHITE.slice(2), k);
      V.ellipse(pb, cx, ry, rr, rr, (nx, ny) => ny > 0.15 ? 0 : D[clamp(nx < -0.2 ? D.length - 1 : nx < 0.3 ? D.length - 2 : D.length - 4, 0, D.length - 1)]);
    } else if (roof === 'solar') {
      const S = ramp(['#1e2a55', '#344675', '#4f6391', '#8b9cc2', '#d1d6e7'], k);
      V.poly(pb, [[x + 1, y - h - 1], [x + w - 1, y - h - 1], [x + w - 1 + dx - 1, y - h - dy], [x + dx, y - h - dy]], (px, py) => (px - x) % 3 === 0 ? S[3] : S[1 + ((px + py) & 1 ? 0 : 1)]);
    } else if (roof === 'terrace') {
      const G = ramp(RAMP.foliageR.slice(2, 7), k);
      for (let i = 0; i < 3; i++) { const px = x + 1 + r.int(0, Math.max(0, w - 3)) + Math.round(dx * 0.5), py = y - h - 1 - r.int(0, Math.max(0, dy - 1)); V.put(pb, px, py, G[3]); V.put(pb, px + 1, py, G[2]); V.put(pb, px, py - 1, G[4]); }
      // pérgola / toldo
      const A = ramp(r.pick([['#8a2a1a', '#c0482a', '#e8784a'], ['#1a5a6a', '#2a8a9a', '#5ac0c8'], ['#8a6a1a', '#c09a2a', '#e8c84a']]), k);
      for (let xx = x; xx < x + Math.min(w, 5); xx++) V.put(pb, xx, y - h - 1, A[1 + (xx & 1)]);
    } else {
      // parapeto y depósito de agua
      if (r.chance(0.5) && w > 5) { const tx = rx + w - 3; V.put(pb, tx, ry - 1, U(V.hzc('#a39aa4', k))); V.put(pb, tx + 1, ry - 1, U(V.hzc('#ddd6d4', k))); V.put(pb, tx, ry - 2, U(V.hzc('#efe9e2', k))); V.put(pb, tx + 1, ry - 2, U(V.hzc('#ffffff', k))); }
    }
    return { x, y, w, h, top: y - h - dy };
  };
  /** Torre esbelta de cristal con capitel (ciudad de Aridia) */
  V.tower = function (pb, x, y, w, h, seed, o = {}) {
    const k = o.k || 0, r = RNG(seed);
    const G = ramp(o.glass || BLUEW, k), S = ramp(STONE, k);
    const n = G.length;
    for (let yy = y - h; yy < y; yy++) for (let xx = 0; xx < w; xx++) {
      const t = xx / Math.max(1, w - 1);
      let i = t < 0.25 ? n - 2 : t < 0.55 ? n - 3 : t < 0.85 ? n - 5 : n - 6;
      // forjados cada 4 px y montantes
      if ((yy - (y - h)) % 4 === 0) i = Math.max(0, i - 2);
      else if (xx === Math.floor(w / 2) && w > 4) i = Math.max(0, i - 1);
      // reflejo de cielo arriba
      if (yy < y - h + h * 0.3 && xx < w * 0.4) i = Math.min(n - 1, i + 1);
      V.put(pb, x + xx, yy, G[clamp(i, 0, n - 1)]);
    }
    // borde iluminado izquierdo
    for (let yy = y - h; yy < y; yy++) V.put(pb, x, yy, G[n - 1]);
    // capitel de piedra y aguja
    for (let xx = -1; xx <= w; xx++) { V.put(pb, x + xx, y - h - 1, S[xx < w / 2 ? 7 : 5]); V.put(pb, x + xx, y - h, S[xx < w / 2 ? 6 : 4]); }
    const sp = o.cap === 'flat' ? 0 : Math.max(3, Math.round(w * 1.1));
    for (let i = 0; i < sp; i++) {
      const half = Math.max(0, Math.round((w / 2) * (1 - i / sp)) - 1);
      for (let xx = -half; xx <= half; xx++) V.put(pb, x + Math.floor(w / 2) + xx, y - h - 2 - i, S[xx <= 0 ? 7 : 4]);
    }
    if (sp) { V.put(pb, x + Math.floor(w / 2), y - h - 2 - sp, S[8]); V.put(pb, x + Math.floor(w / 2), y - h - 3 - sp, S[8]); }
    // base de piedra
    for (let yy = y - 3; yy < y; yy++) for (let xx = 0; xx < w; xx++) V.put(pb, x + xx, yy, S[xx < w * 0.4 ? 6 : 4]);
    return { x, y, w, h, top: y - h - 3 - sp };
  };
  /** Cilindro vertical de piedra (anillo) con luz arriba-izquierda: fn(nx 0..1) → índice */
  function drum(pb, cx, y, rx, h, R, opts = {}) {
    const n = R.length;
    for (let xx = -rx; xx <= rx; xx++) {
      const nx = xx / (rx + 0.5), c = Math.sqrt(Math.max(0, 1 - nx * nx));
      const lit = clamp(0.62 - nx * 0.45 + c * 0.25, 0, 1);
      const capOff = Math.round(c * (opts.ell ?? rx * 0.18));
      for (let yy = 0; yy < h; yy++) {
        let i = Math.round(lit * (n - 2));
        if (opts.band && opts.band(yy, nx)) i = opts.band(yy, nx);
        V.put(pb, cx + xx, y - yy + capOff, R[clamp(i, 0, n - 1)]);
      }
      // borde superior elíptico iluminado (tapa)
      V.put(pb, cx + xx, y - h + capOff, R[n - 1]);
    }
  }
  /**
   * Ciudad de ARIDIA: anillo de piedra con arcada y ventanas, banda con el nombre,
   * cúpula de cristal con meridianos, armadura exterior, aguja y torres esbeltas.
   * (cx, y) = centro de la base del anillo. s = escala (1 → cúpula ≈ 56 px).
   */
  V.domeCity = function (pb, cx, y, o = {}) {
    const k = o.k || 0, s = o.s || 1, r = RNG(o.seed || 5);
    const S = ramp(STONE, k), G = ramp(GLASS, k), WN = ramp(BLUEW, k);
    const nS = S.length;
    const R1 = Math.round(46 * s), H1 = Math.round(20 * s); // anillo inferior (arcada)
    const R2 = Math.round(38 * s), H2 = Math.round(12 * s); // anillo superior (nombre)
    const RD = Math.round(30 * s), HD = Math.round(27 * s); // cúpula
    const towers = [];
    // torres traseras (detrás del anillo)
    const TG = ['#24405e', '#33587c', '#4a7aa2', '#6c9cc4', '#98c0de', '#c4def0', '#eef8ff'];
    for (const [ox, hh, ww, cap] of [[-50, 40, 8, 'spire'], [-62, 28, 7, 'flat'], [-38, 30, 6, 'flat'], [-72, 20, 6, 'spire'], [46, 46, 8, 'spire'], [60, 30, 7, 'flat'], [36, 26, 6, 'flat'], [72, 22, 6, 'spire']]) {
      const tx = Math.round(cx + ox * s - ww / 2), th = Math.round(hh * s);
      towers.push(V.tower(pb, tx, y - Math.round(12 * s), Math.max(3, Math.round(ww * s)), th, tx, { k: k + 0.05, glass: TG, cap }));
    }
    // armadura exterior (media corona translúcida detrás de la cúpula)
    const yD = y - H1 - H2 - Math.round(2 * s);
    const AR = Math.round(RD * 1.3), arm = U(V.hzc('#e8c890', k)), armM = U(V.hzc('#c9a77e', k)), armD = U(V.hzc('#8a6a50', k));
    // cáscara exterior translúcida (velo cálido) con celosía de meridianos
    for (let yy = -Math.round(AR * 0.92); yy <= 0; yy++) for (let xx = -AR; xx <= AR; xx++) {
      const nx = xx / (AR + 0.5), ny = yy / (AR * 0.92 + 0.5), d = nx * nx + ny * ny;
      if (d > 1) continue;
      const lon = Math.asin(clamp(nx / Math.max(0.01, Math.sqrt(1 - ny * ny)), -1, 1));
      const merid = Math.abs(((lon / Math.PI * 10) % 1 + 1) % 1 - 0.5) < 0.06;
      const par = Math.abs(((Math.asin(-ny) / Math.PI * 9) % 1 + 1) % 1 - 0.5) < 0.05;
      if (d > 0.88) V.blend(pb, cx + xx, yD + yy, nx < 0.2 ? arm : armM, 0.95);
      else if (merid || par) V.blend(pb, cx + xx, yD + yy, nx < 0 ? arm : armD, 0.55);
      else V.blend(pb, cx + xx, yD + yy, U(V.hzc('#f4dcb0', k)), 0.16);
    }
    // cúpula de cristal: hemisferio con meridianos/paralelos y reflejo
    const nG = G.length;
    for (let yy = -HD; yy <= 0; yy++) for (let xx = -RD; xx <= RD; xx++) {
      const nx = xx / (RD + 0.5), ny = yy / (HD + 0.5), d = nx * nx + ny * ny;
      if (d > 1) continue;
      const nz = Math.sqrt(1 - d);
      const I = clamp(-nx * 0.5 - ny * 0.45 + nz * 0.55, 0, 1);
      let i = Math.round(1 + I * (nG - 4));
      // meridianos y paralelos (estructura)
      const lon = Math.asin(clamp(nx / Math.max(0.01, Math.sqrt(1 - ny * ny)), -1, 1));
      const merid = Math.abs(((lon / Math.PI * 8) % 1 + 1) % 1 - 0.5) < 0.09;
      const par = Math.abs(((Math.asin(-ny) / Math.PI * 7) % 1 + 1) % 1 - 0.5) < 0.07;
      if (merid || par) i = Math.min(nG - 2, i + 2);
      if (d > 0.4 && d < 0.6 && nx < -0.12 && ny < -0.25) i = nG - 1; // reflejo en arco
      else if (d > 0.3 && d < 0.4 && nx < -0.2 && ny < -0.3) i = nG - 2;
      if (d > 0.9) i = Math.max(0, i - 2);
      V.put(pb, cx + xx, yD + yy, G[clamp(i, 0, nG - 1)]);
    }
    // aguja
    for (let i = 0; i < Math.round(16 * s); i++) { V.put(pb, cx, yD - HD - i, S[i < 4 ? 5 : 7]); if (i < 5) V.put(pb, cx + 1, yD - HD - i, S[4]); }
    V.ellipse(pb, cx + 0.5, yD - HD - Math.round(9 * s), 2, 2, (nx, ny) => S[nx + ny < 0 ? 8 : 5]);
    // anillo superior con el nombre
    drum(pb, cx, y - H1, R2, H2, S, {
      ell: 3 * s, band: (yy, nx) => (yy === 0 ? 2 : yy === H2 - 1 ? nS - 1 : null),
    });
    // ventanas redondas del anillo superior
    for (let a = -0.85; a <= 0.85; a += 0.24) {
      const px = Math.round(cx + Math.sin(a) * R2 * 0.95); const py = y - H1 - Math.round(H2 * 0.45) + Math.round(Math.cos(a) * 3 * s);
      if (Math.abs(a) < 0.3) continue; // hueco para el nombre
      V.put(pb, px, py, WN[3]); V.put(pb, px, py - 1, WN[5]); V.put(pb, px + 1, py, WN[2]);
    }
    if (o.label !== false && typeof PFK !== 'undefined') {
      const tw = V.measure('ARIDIA', { font: 'tiny', bold: true });
      V.text(pb, 'ARIDIA', cx - Math.round(tw / 2), y - H1 - Math.round(H2 * 0.5) - 2 + Math.round(3 * s), U(V.hzc('#2a1a10', k * 0.5)), { font: 'tiny', bold: true });
    }
    // anillo inferior: arcada con columnas y ventanales azules
    drum(pb, cx, y, R1, H1, S, { ell: 4 * s, band: (yy) => (yy === H1 - 1 ? nS - 1 : yy === H1 - 2 ? nS - 3 : yy < 2 ? 2 : null) });
    const nA = 11;
    for (let i = 0; i < nA; i++) {
      const a = -1.25 + i * 2.5 / (nA - 1), sx = Math.sin(a), cw = Math.cos(a);
      const px = Math.round(cx + sx * R1 * 0.93), aw = Math.max(1, Math.round(4 * s * cw)), py = y + Math.round(cw * 4 * s);
      for (let yy = py - Math.round(H1 * 0.78); yy < py - 3; yy++) for (let xx = 0; xx < aw; xx++) {
        const top = yy < py - Math.round(H1 * 0.78) + 2;
        V.put(pb, px + xx - (aw >> 1), yy, WN[top ? 4 : xx === 0 ? 3 : 1 + ((yy >> 1) & 1)]);
      }
    }
    // cornisa y basamento
    for (let xx = -R1 - 2; xx <= R1 + 2; xx++) { const c = Math.sqrt(Math.max(0, 1 - (xx / (R1 + 2)) ** 2)); const py = y + Math.round(c * 4 * s) + 1; V.put(pb, cx + xx, py, S[2]); V.put(pb, cx + xx, py + 1, S[1]); }
    // vegetación en hombros
    const F = ramp(RAMP.foliageR, k + 0.05);
    for (let i = 0; i < 14; i++) {
      const side = i % 2 ? 1 : -1, px = cx + side * (R1 - 4 + r.int(0, 18)) , py = y + r.int(-2, 6);
      for (let q = 0; q < 6; q++) V.put(pb, px + r.int(-2, 2), py + r.int(-1, 1), F[r.int(2, 6)]);
    }
    const falls = [{ x: cx - Math.round(11 * s), w: Math.round(22 * s) }, { x: cx - Math.round(34 * s), w: 4 }, { x: cx + Math.round(28 * s), w: 4 }];
    return { top: yD - HD - Math.round(16 * s), left: cx - R1, right: cx + R1, base: y + Math.round(5 * s), falls, towers };
  };
  /** Invernadero en 3/4 (bóveda de cristal con nervios) */
  V.greenhouse = function (pb, x, y, w, h, o = {}) {
    const k = o.k || 0, G = ramp(['#3a6a70', '#5a9aa0', '#8ccad0', '#bfe8ec', '#eefcff'], k), F = ramp(RAMP.foliageR, k);
    const d = Math.round(w * 0.3), dx = Math.round(d * 0.55), dy = Math.round(d * 0.5);
    for (let xx = 0; xx < w + dx; xx++) {
      const t = (xx - dx * 0.5) / w;
      const arc = Math.round(Math.sin(clamp(t, 0, 1) * Math.PI) * h * 0.35);
      for (let yy = y - h - arc + (xx > w ? Math.round((xx - w) * dy / Math.max(1, dx)) : 0); yy < y; yy++) {
        const inside = yy > y - h + 2;
        let i = xx % 5 === 0 ? 4 : inside ? (hash2(xx, yy, 3) < 0.3 ? 1 : 2) : 3;
        if (xx >= w) i = Math.max(0, i - 1);
        V.put(pb, x + xx, yy, G[i]);
        if (inside && yy > y - 4 && hash2(xx, yy, 9) < 0.5) V.put(pb, x + xx, yy, F[3 + (xx & 1)]);
      }
    }
  };
  /** Faro blanco con franja roja sobre promontorio */
  V.lighthouse = function (pb, x, y, h, o = {}) {
    const k = o.k || 0, Wt = ramp(WHITE, k), Rd = ramp(['#6a1018', '#a8202a', '#e0483a', '#ff8a6a'], k);
    for (let yy = 0; yy < h; yy++) {
      const ww = Math.round(lerp(5, 3, yy / h));
      for (let xx = 0; xx < ww; xx++) {
        const band = ((yy / 4) | 0) % 3 === 1;
        const P = band ? Rd : Wt; const i = xx === 0 ? P.length - 1 : xx === ww - 1 ? 1 : P.length - 2;
        V.put(pb, x - (ww >> 1) + xx, y - yy, P[i]);
      }
    }
    V.rect(pb, x - 2, y - h - 3, 5, 3, U(V.hzc('#ffe9a0', k))); V.put(pb, x, y - h - 4, U(V.hzc('#3a3a4a', k)));
    return { lx: x, ly: y - h - 2 };
  };
})();
