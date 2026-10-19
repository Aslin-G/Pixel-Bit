/* =====================================================================
   19w_r2map_e_r3sim.js — MAQUINARIA ILUSTRADA DE LOS SIMULADORES (R3MAPUI).
   Ronda 3: los esquemas de los gemelos digitales dejan de ser bandas
   planas y puntos. Kit de piezas iluminadas desde arriba-izquierda
   (STYLE LOCK §6–7) prerenderizadas en PixelBuffer y cacheadas por tamaño,
   más una capa viva barata (partículas 2×2 con halo de 1 px al 50 %,
   chevrones, LED). Sin tramado.
   API:
     R3MAPUI.dot(col)                     sprite 4×4: núcleo 2×2 + halo 1 px al 50 %
     R3MAPUI.roVessel(g, x, y, w, h, st, t) recipiente a presión de OI en corte: carcasa de
         acero con franja especular, sombra de núcleo y luz reflejada, tapas con remaches,
         espaciador de alimentación en malla, hojas de membrana, colector de permeado y tubo
         central cian luminoso con chevrones y halo de 2 px, salida de concentrado grafito con
         partículas magenta, cristales de sal en el lado del concentrado.
         st = {R, Qp, Qf, Qc, P, foul, scale, cip}  → {inlet:{x,y}, conc:{x,y}, perm:{x,y}, membTop, membBot, x0, x1}
     R3MAPUI.litBar(g, x, y, w, h, col)   barra-tubo iluminada (especular, sombra, tinta)
     R3MAPUI.tag(g, x, y, text, col, o)   etiqueta píldora navy con borde del color del sistema y tallo
     R3MAPUI.glassPlate(g, x, y, w, h, a) placa de cristal ahumado con bisel (deja ver la escena)
     R3MAPUI.simCharts(on)                en el simulador: marcos de gráfico con bisel, ejes y marcas,
         líneas de 2 px con halo; tanques, baterías, barras y manómetros iluminados (misma geometría)
     R3MAPUI.glassPanel(orig)             envoltorio de UIK.panel: relleno al 84 % sobre la escena + bisel
   ===================================================================== */
const R3MAPUI = (() => {
  const M = {};
  const V = VISTA;
  const cache = new Map();
  const memo = (k, make) => { let c = cache.get(k); if (!c) { c = make(); cache.set(k, c); if (cache.size > 220) cache.delete(cache.keys().next().value); } return c; };
  const P = (a) => V.P32(a);
  /* ---------- rampas ---------- */
  const STEEL = ['#0c1124', '#1a2238', '#2a3450', '#3e4a68', '#56647f', '#72809a', '#94a2b8', '#b8c6d6', '#dbe6ef', '#f4f9ff'];
  const BLUE = ['#071a4a', '#0e2a6a', '#1a4290', '#2a62bc', '#4686dc', '#7ab0f0', '#b4d8ff'];
  const GRAPH = ['#06061a', '#0e0e2a', '#1a1a40', '#2a2a58', '#3e3e74', '#5a5a92', '#8282b4'];
  const SEAP = ['#062a4a', '#0a4a72', '#127aa8', '#1aa6cf', '#4ccbe4', '#8ae8f2', '#c8fbff'];
  const PERM = ['#0a3a5a', '#1a6a9a', '#2a96cc', '#48b6ec', '#86dcff', '#c8f4ff', '#ffffff'];
  M.RAMPS = { STEEL, BLUE, GRAPH, SEAP, PERM };
  /** sprite de partícula: núcleo 2×2 y halo de 1 px al 50 % del mismo color */
  M.dot = function (col) {
    return memo('dot|' + col, () => {
      const c = makeCanvas(4, 4), g = c.g;
      g.globalAlpha = 0.5; g.fillStyle = col; g.fillRect(1, 0, 2, 4); g.fillRect(0, 1, 4, 2);
      g.globalAlpha = 1; g.fillRect(1, 1, 2, 2);
      g.fillStyle = mixHex(col, '#ffffff', 0.55); g.fillRect(1, 1, 1, 1);
      return c;
    });
  };
  /** cubo de sal 2×2 con faceta (iones de sal estilizados) y halo */
  M.saltDot = function (col) {
    return memo('salt|' + col, () => {
      const c = makeCanvas(4, 4), g = c.g;
      g.globalAlpha = 0.45; g.fillStyle = col; g.fillRect(1, 0, 2, 4); g.fillRect(0, 1, 4, 2);
      g.globalAlpha = 1; g.fillStyle = col; g.fillRect(1, 1, 2, 2);
      g.fillStyle = '#ffffff'; g.fillRect(1, 1, 1, 1); g.fillStyle = shade(col, -0.35); g.fillRect(2, 2, 1, 1);
      return c;
    });
  };
  /** cristal de incrustación (racimo de 3–5 px) */
  function crystalSprite(seed) {
    return memo('cry|' + seed, () => {
      const pb = new PixelBuffer(7, 6), C = ['#5a4a8a', '#a89ad8', '#e8e0ff', '#ffffff'];
      const n = 2 + (seed % 3);
      for (let k = 0; k < n; k++) {
        const x = 1 + ((seed * 7 + k * 3) % 4), h = 2 + ((seed + k) % 4);
        for (let y = 0; y < h; y++) { pb.set(x, 5 - y, C[y === h - 1 ? 3 : y === 0 ? 0 : 1]); pb.set(x + 1, 5 - y, C[y === h - 1 ? 2 : 0]); }
      }
      return pb.toCanvas();
    });
  }
  /** intensidad de cilindro horizontal iluminado desde arriba: t=0 arriba … 1 abajo → índice 0..n-1 */
  function cylRow(t, n, hh = 0) {
    // contorno · luz de borde · medio claro · especular casi blanca de 1–2 px (≈ 29 %) · medio · sombra de núcleo (75–88 %) · luz reflejada · contorno
    const sp = hh > 12 ? 1.6 / hh : 0.06;
    if (Math.abs(t - 0.29) < sp) return n - 1;
    const k = t < 0.04 ? 0.08 : t < 0.1 ? 0.8 : t < 0.2 ? 0.72 : t < 0.36 ? 0.8 : t < 0.5 ? 0.62 : t < 0.64 ? 0.5 : t < 0.74 ? 0.38 : t < 0.86 ? 0.2 : t < 0.94 ? 0.4 : 0.06;
    return clamp(Math.round(k * (n - 2)), 0, n - 2);
  }
  M.cylRow = cylRow;
  /** Barra-tubo iluminada (para indicadores de presión) */
  M.litBar = function (g, x, y, w, h, col) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.max(3, Math.round(h));
    if (w < 3) return;
    const c = memo('bar|' + w + '|' + h + '|' + col, () => {
      const cc = makeCanvas(w + 2, h + 2), b = cc.g;
      b.fillStyle = '#000633'; b.fillRect(1, 0, w, h + 2); b.fillRect(0, 1, w + 2, h);
      const R = [shade(col, -0.55), shade(col, -0.3), col, mixHex(col, '#ffffff', 0.35), mixHex(col, '#ffffff', 0.8)];
      for (let j = 0; j < h; j++) { const t = (j + 0.5) / h; b.fillStyle = R[t < 0.2 ? 3 : t < 0.42 ? 4 : t < 0.7 ? 2 : t < 0.86 ? 1 : 0]; b.fillRect(1, 1 + j, w, 1); }
      b.fillStyle = shade(col, -0.45); b.fillRect(w, 1, 1, h);
      b.fillStyle = mixHex(col, '#ffffff', 0.5); b.fillRect(1, 1, 1, h - 1);
      for (let xx = 8; xx < w - 2; xx += 8) { b.fillStyle = shade(col, -0.2); b.fillRect(1 + xx, 1 + Math.ceil(h * 0.5), 1, Math.max(1, Math.floor(h * 0.4))); }
      return cc;
    });
    g.drawImage(c, x - 1, y - 1);
  };
  /** Etiqueta píldora con tallo (estilo de las etiquetas del mundo de la referencia) */
  M.tag = function (g, x, y, text, col, o = {}) {
    const f = o.font || 'tiny';
    const tw = FONTS[f].measure(stripMarkup(text)), w = tw + 8, h = f === 'tiny' ? 11 : 14;
    x = Math.round(o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x); y = Math.round(y);
    if (o.stem) { const [sx, sy] = o.stem; const mx = clamp(Math.round(sx), x + 2, x + w - 3); const y0 = sy < y ? Math.round(sy) : y + h, y1 = sy < y ? y : Math.round(sy); frect(g, mx, y0, 1, y1 - y0, col); frect(g, mx + 1, y0, 1, y1 - y0, '#000633'); frect(g, mx - 1, Math.round(sy) - 1, 3, 3, col); fpx(g, mx, Math.round(sy), '#ffffff'); }
    frect(g, x + 1, y, w - 2, h, '#000633'); frect(g, x, y + 1, w, h - 2, '#000633');
    frect(g, x + 1, y + 1, w - 2, h - 2, col);
    frect(g, x + 2, y + 2, w - 4, h - 4, '#041533'); frect(g, x + 2, y + 2, w - 4, 1, mixHex('#041533', col, 0.35));
    drawText(g, text, x + 4, y + (f === 'tiny' ? 3 : 3), { font: f, color: o.color || mixHex(col, '#ffffff', 0.62) });
    return { x, y, w, h };
  };
  /** Placa de cristal ahumado con bisel de 1 px: la escena de fondo se ve atenuada */
  M.glassPlate = function (g, x, y, w, h, a = 0.62, tint = '#041533') {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    const c = memo('plate|' + w + '|' + h + '|' + a + '|' + tint, () => {
      const cc = makeCanvas(w, h), b = cc.g;
      b.globalAlpha = a; b.fillStyle = tint; b.fillRect(2, 2, w - 4, h - 4);
      b.globalAlpha = a * 0.5; b.fillStyle = '#000633'; b.fillRect(2, Math.round(h * 0.55), w - 4, h - 2 - Math.round(h * 0.55));
      // reflejo diagonal del cristal (dos tiras planas)
      b.globalAlpha = 0.07; b.fillStyle = '#cfe4ff';
      for (let j = 2; j < h - 2; j++) { const xx = Math.round(w * 0.62 - j * 0.6); b.fillRect(Math.max(2, xx), j, 10, 1); b.fillRect(Math.max(2, xx + 16), j, 3, 1); }
      b.globalAlpha = 1;
      // marco: tinta, bisel claro arriba/izquierda, sombra abajo/derecha
      b.fillStyle = '#000633'; b.fillRect(1, 0, w - 2, 1); b.fillRect(1, h - 1, w - 2, 1); b.fillRect(0, 1, 1, h - 2); b.fillRect(w - 1, 1, 1, h - 2);
      b.fillStyle = '#7bacfb'; b.fillRect(1, 1, w - 2, 1); b.fillRect(1, 1, 1, h - 2);
      b.fillStyle = '#2a4c82'; b.fillRect(1, h - 2, w - 2, 1); b.fillRect(w - 2, 1, 1, h - 2);
      b.fillStyle = '#d2efff'; b.fillRect(2, 1, 6, 1); b.fillRect(1, 2, 1, 4);
      for (const [rx, ry] of [[4, 4], [w - 6, 4], [4, h - 6], [w - 6, h - 6]]) { b.fillStyle = '#000633'; b.fillRect(rx, ry, 2, 2); b.fillStyle = '#86a8d0'; b.fillRect(rx, ry, 1, 1); }
      return cc;
    });
    g.drawImage(c, x, y);
  };

  /* =================== RECIPIENTE A PRESIÓN DE OI EN CORTE =================== */
  // geometría local del recipiente (sin tubos): tapas, bridas, ventana de corte y capas
  function geo(w, h) {
    const cap = Math.max(10, Math.round(h * 0.2)), s = 5, ct = 10, mem = 5, pc = 4;
    const F = Math.floor((h - 2 * s - ct) / 2) - mem - pc;
    const bx0 = cap, bx1 = w - cap, cx0 = bx0 + 30, cx1 = bx1 - 30, cy = Math.floor(h / 2);
    const fT = s, mT = s + F, pT = mT + mem, tT = pT + pc, tB = tT + ct, pB = tB, mB = pB + pc, fB = mB + mem;
    return { cap, s, ct, mem, pc, F, bx0, bx1, cx0, cx1, cy, fT, mT, pT, tT, tB, pB, mB, fB };
  }
  M.roGeo = geo;
  /** base estática (cacheada por tamaño y nivel de recuperación: el concentrado se oscurece hacia la salida) */
  function vesselBase(w, h, rq) {
    return memo('ro|' + w + '|' + h + '|' + rq, () => {
      const pb = new PixelBuffer(w, h), G = geo(w, h), d = pb.data;
      const S = P(STEEL), Bl = P(BLUE), nS = S.length;
      const kR = rq / 8;
      // ---- carcasa intacta (cilindro horizontal) entre las tapas
      for (let y = 0; y < h; y++) {
        const t = (y + 0.5) / h, i = cylRow(t, nS, h);
        for (let x = G.bx0; x < G.bx1; x++) {
          let u = S[i];
          // anillos azules de la carcasa (dos por tramo intacto) y cordones de soldadura
          const lx = x - G.bx0, rx = G.bx1 - 1 - x;
          const ring = (lx >= 10 && lx < 15) || (rx >= 10 && rx < 15) || (x >= G.cx0 - 8 && x < G.cx0 - 5) || (x > G.cx1 + 4 && x <= G.cx1 + 7);
          if (ring) u = Bl[clamp(Math.round(i / (nS - 1) * (Bl.length - 1)), 0, Bl.length - 1)];
          if (lx === 22 || rx === 22) u = S[Math.max(0, i - 2)];
          if (lx === 23 || rx === 23) u = S[Math.min(nS - 1, i + 1)];
          // vetas de laminado en clusters (sin ruido de píxel suelto)
          if (!ring && hash2((x / 6) | 0, y, 31) < 0.08 && i > 1 && i < nS - 1) u = S[i - 1];
          d[y * w + x] = u;
        }
      }
      // ---- bridas atornilladas en la unión tapa-cuerpo
      for (const fx of [G.bx0, G.bx1 - 4]) for (let y = 1; y < h - 1; y++) {
        const t = (y + 0.5) / h, i = cylRow(t, nS, h);
        for (let k = 0; k < 4; k++) d[y * w + fx + k] = S[clamp(i + (k === 0 ? 1 : k === 3 ? -2 : -1), 0, nS - 1)];
        if (y % 7 === 3 && y > 3 && y < h - 4) { d[y * w + fx + 1] = S[nS - 1]; d[y * w + fx + 2] = S[Math.max(0, i - 1)]; d[(y + 1) * w + fx + 1] = S[Math.max(0, i - 2)]; d[(y + 1) * w + fx + 2] = S[0]; }
      }
      // ---- tapas abombadas con anillo de remaches (luz arriba-izquierda)
      // tapa: casquete visto de lado; normal (nx·0,7, ny, nz) iluminada desde arriba-izquierda, con especular,
      // sombra de núcleo abajo-derecha y luz reflejada en el borde inferior
      const LX = -0.48, LY = -0.62, LZ = 0.62;
      const capFn = (left) => (nx, ny) => {
        const ax = nx * 0.7, nz = Math.sqrt(Math.max(0, 1 - ax * ax - ny * ny));
        const l = ax * LX + ny * LY + nz * LZ;
        if (l > 0.9) return S[nS - 1];
        let k = 0.12 + Math.max(0, l) * 0.78;
        if (ny > 0.7 && ny < 0.86) k += 0.14;                      // luz reflejada
        if (!left) k -= 0.06;
        return S[clamp(Math.round(k * (nS - 2)), 0, nS - 2)];
      };
      V.ellipse(pb, G.cap + 0.5, h / 2, G.cap, h / 2 - 0.5, (nx, ny) => nx > 0.02 ? 0 : capFn(true)(nx, ny));
      V.ellipse(pb, w - G.cap - 0.5, h / 2, G.cap, h / 2 - 0.5, (nx, ny) => nx < -0.02 ? 0 : capFn(false)(nx, ny));
      for (const [cx, sg] of [[G.cap, -1], [w - G.cap, 1]]) for (let a = 0; a < 14; a++) {
        const an = -Math.PI / 2 + a / 13 * Math.PI, px = Math.round(cx + sg * Math.cos(an) * (G.cap - 4)), py = Math.round(h / 2 + Math.sin(an) * (h / 2 - 5));
        V.put(pb, px, py, S[nS - 1]); V.put(pb, px + 1, py + 1, S[1]);
      }
      // contorno de tinta
      const ink = U('#000633');
      const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && (d[y * w + x] >>> 24) === 255;
      const edge = [];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (solid(x, y) && (!solid(x - 1, y) || !solid(x + 1, y) || !solid(x, y - 1) || !solid(x, y + 1))) edge.push(y * w + x);
      for (const i of edge) d[i] = ink;
      // luz de borde cálida del sol (arriba-izquierda) en la arista superior de la carcasa y de la tapa izquierda
      const warm = U('#fbc371');
      for (let x = 2; x < w - G.cap; x++) for (let y = 1; y < 6; y++) { const i = y * w + x; if (d[i] !== ink && (d[(y - 1) * w + x] === ink)) { d[i] = V.mixU(d[i], warm, x < G.cap ? 0.7 : 0.5); break; } }
      // ---- ventana de corte: el elemento en espiral en sección longitudinal
      const feedA = V.P32(V.expand(['#1aa6cf', '#1690c4', '#1e6eae', '#2a5296', '#343c7c', '#3a2e66'], 24));
      const MEM = P(['#2a1a6a', '#3a2a8a', '#5a44a8', '#7a5ae0', '#8d6bff', '#b49cff', '#dcd0ff']);
      const PC = P(['#0a2a4a', '#123e66', '#1a5a8a', '#2a7ab0', '#3a96cc']);
      const TUBE = P(['#06223e', '#0c3456', '#164a72', '#24648e']);
      for (let y = 1; y < h - 1; y++) for (let x = G.cx0; x < G.cx1; x++) {
        const lx = (x - G.cx0) / (G.cx1 - G.cx0);
        let u;
        // capas de arriba abajo, simétricas respecto del tubo central
        if (y < G.fT) { // pared de la carcasa cortada: cara de corte clara
          u = y === G.fT - 1 ? S[1] : y === 1 ? S[nS - 2] : S[clamp(nS - 3 - y, 2, nS - 1)];
        } else if (y >= G.fB + G.F) {
          const yy = h - 1 - y; u = yy === G.s - 1 ? S[2] : S[clamp(nS - 4 - yy, 2, nS - 1)];
        } else if ((y >= G.fT && y < G.mT) || (y >= G.fB && y < G.fB + G.F)) { // canal de alimentación con espaciador en malla
          const top = y < G.mT, yy = top ? y - G.fT : y - G.fB;
          const k = clamp(Math.pow(lx, 0.85) * kR * 1.1, 0, 1);
          let ti = Math.round(k * (feedA.length - 1));
          // la luz entra por arriba: el canal superior se ilumina hacia la membrana, el inferior recibe luz reflejada
          const depth = top ? yy / G.F : 1 - yy / G.F;
          let col = feedA[ti];
          const dd = Math.abs(y - G.cy) / (h / 2);
          let shadeK = top ? (yy < 4 ? -0.36 + yy * 0.06 : 0.07 * (1 - depth)) : (yy > G.F - 3 ? -0.26 : yy === G.F - 4 ? 0.12 : 0.02);
          shadeK -= Math.max(0, dd - 0.5) * 0.5;                       // el interior se curva y se oscurece hacia la carcasa
          if (shadeK) col = shadeK > 0 ? V.mixU(col, U('#bff8ff'), shadeK) : V.mixU(col, U('#020818'), -shadeK);
          // malla del espaciador: diagonales cada 8 px en ambos sentidos (filamentos de 1 px con sombra)
          const m1 = (x + yy) % 9, m2 = (x - yy + 900) % 9;
          if (m1 === 0 || m2 === 0) col = V.mixU(col, U('#9ae8f6'), 0.28 - k * 0.12);
          else if (m1 === 1 || m2 === 1) col = V.mixU(col, U('#03142e'), 0.25);
          if (m1 === 0 && m2 === 0) col = V.mixU(col, U('#e6fdff'), 0.35);
          u = col;
        } else if ((y >= G.mT && y < G.pT) || (y >= G.mB && y < G.fB)) { // hoja de membrana
          const top = y < G.pT, yy = top ? y - G.mT : G.fB - 1 - y;
          let mi = yy === 0 ? 6 : yy === 1 ? 5 : yy === G.mem - 1 ? 1 : (x % 3 === 0 ? 3 : 4);
          if (!top) mi = yy === 0 ? 5 : yy === G.mem - 1 ? 1 : (x % 3 === 1 ? 3 : 4);
          if (x % 46 === 23) mi = Math.max(0, mi - 2); // línea de encolado de la hoja
          u = MEM[mi];
        } else if ((y >= G.pT && y < G.tT) || (y >= G.pB && y < G.mB)) { // colector de permeado (tricot)
          const yy = y < G.tT ? y - G.pT : y - G.pB;
          u = PC[((x >> 1) + yy) % 2 ? 3 : 2]; if (yy === 0 && y < G.tT) u = PC[4]; if (yy === G.pc - 1 && y >= G.pB) u = PC[1];
        } else { // tubo central perforado (el permeado luminoso va encima, en la capa viva)
          const yy = y - G.tT;
          u = yy === 0 || yy === G.ct - 1 ? TUBE[0] : yy === 1 ? TUBE[3] : TUBE[1];
          if ((yy === 1 || yy === G.ct - 2) && x % 7 === 3) u = U('#020818'); // perforaciones
        }
        d[y * w + x] = u;
      }
      // sombra del borde de corte izquierdo sobre el interior (luz desde la izquierda) y cara de corte clara a la derecha
      for (let y = 1; y < h - 1; y++) {
        for (let k = 0; k < 3; k++) { const i = y * w + G.cx0 + k; d[i] = V.mixU(d[i], U('#020818'), 0.45 - k * 0.14); }
        d[y * w + G.cx0 - 1] = S[nS - 2]; d[y * w + G.cx0 - 2] = ink;
        d[y * w + G.cx1] = S[3]; d[y * w + G.cx1 + 1] = ink;
      }
      // tapón del tubo central en el lado de alimentación
      for (let y = G.tT; y < G.tB; y++) { d[y * w + G.cx0 + 3] = S[6]; d[y * w + G.cx0 + 4] = S[3]; }
      return pb.toCanvas();
    });
  }
  /** Tubo iluminado horizontal o vertical (canvas cacheado) */
  function pipeH(len, r, ramp) {
    return memo('ph|' + len + '|' + r + '|' + ramp.join(), () => {
      const c = makeCanvas(len, 2 * r + 1), b = c.g, n = ramp.length;
      for (let j = 0; j <= 2 * r; j++) { const t = (j + 0.5) / (2 * r + 1); b.fillStyle = ramp[cylRow(t, n)]; b.fillRect(0, j, len, 1); }
      for (let x = 10; x < len - 3; x += 22) { b.fillStyle = ramp[n - 2]; b.fillRect(x, 0, 1, 2 * r + 1); b.fillStyle = ramp[1]; b.fillRect(x + 1, 0, 1, 2 * r + 1); }
      return c;
    });
  }
  function pipeV(len, r, ramp) {
    return memo('pv|' + len + '|' + r + '|' + ramp.join(), () => {
      const c = makeCanvas(2 * r + 1, len), b = c.g, n = ramp.length;
      for (let j = 0; j <= 2 * r; j++) { const t = (j + 0.5) / (2 * r + 1); const k = t < 0.2 ? 0.7 : t < 0.4 ? 1 : t < 0.65 ? 0.55 : t < 0.88 ? 0.25 : 0.06; b.fillStyle = ramp[clamp(Math.round(k * (n - 1)), 0, n - 1)]; b.fillRect(j, 0, 1, len); }
      return c;
    });
  }
  M.pipeH = (g, x, y, len, r, ramp) => { if (len > 0) g.drawImage(pipeH(Math.round(len), r, ramp), Math.round(x), Math.round(y - r)); };
  M.pipeV = (g, x, y, len, r, ramp) => { if (len > 0) g.drawImage(pipeV(Math.round(len), r, ramp), Math.round(x - r), Math.round(y)); };
  /** Manómetro de esfera (bisel de acero, escala, zona roja, aguja) */
  M.dial = function (g, cx, cy, r, frac, o = {}) {
    const c = memo('dial|' + r + '|' + (o.red ?? 0.85), () => {
      const s = 2 * r + 3, cc = makeCanvas(s, s), pb = new PixelBuffer(s, s), S = P(STEEL);
      V.ellipse(pb, r + 1.5, r + 1.5, r + 1, r + 1, (nx, ny) => S[clamp(Math.round((0.55 - ny * 0.35 - nx * 0.15) * 9), 1, 9)]);
      V.ellipse(pb, r + 1.5, r + 1.5, r - 1, r - 1, (nx, ny) => U(ny < -0.3 ? '#f4f9ff' : '#dbe6ef'));
      for (let a = 0; a <= 20; a++) { const tt = a / 20, an = Math.PI * (0.75 + tt * 1.5); const px = Math.round(r + 1.5 + Math.cos(an) * (r - 2)), py = Math.round(r + 1.5 + Math.sin(an) * (r - 2)); V.put(pb, px, py, U(tt > (o.red ?? 0.85) ? '#e0283c' : a % 5 === 0 ? '#0c1124' : '#72809a')); }
      cc.g.drawImage(pb.toCanvas(), 0, 0);
      return cc;
    });
    g.drawImage(c, Math.round(cx - r - 1), Math.round(cy - r - 1));
    const an = Math.PI * (0.75 + clamp(frac, 0, 1) * 1.5);
    fline(g, cx, cy, cx + Math.cos(an) * (r - 2), cy + Math.sin(an) * (r - 2), '#c8102e');
    fpx(g, cx, cy, '#0c1124');
  };
  /**
   * Recipiente a presión de OI en corte, con tubos de entrada y salida.
   * (x, y, w, h) es la caja total; el cuerpo ocupa (x+16 … x+w-16).
   */
  M.roVessel = function (g, x, y, w, h, st = {}, t = 0) {
    x = Math.round(x); y = Math.round(y);
    const PAD = 16, vw = w - 2 * PAD, vx = x + PAD, G = geo(vw, h);
    const R = clamp(st.R || 0, 0, 0.95), rq = clamp(Math.round(clamp(R / 0.6, 0, 1) * 8), 0, 8);
    const on = clamp((st.Qp || 0) / 40, 0, 1.2), cip = !!st.cip;
    const cy = y + G.cy, X0 = vx + G.cx0 + 5, X1 = vx + G.cx1 - 2, LW = X1 - X0;
    // ---- sombra de contacto y patines (bajo el recipiente)
    g.globalAlpha = 0.6; frect(g, vx + 10, y + h + 8, vw - 20, 2, '#020818'); g.globalAlpha = 1;
    // bancada de acero pintada (viga en I) y dos cunas que abrazan el recipiente
    frect(g, vx + 14, y + h + 3, vw - 28, 5, '#000633'); frect(g, vx + 15, y + h + 4, vw - 30, 1, '#ffe58a'); frect(g, vx + 15, y + h + 5, vw - 30, 1, '#e0b440'); frect(g, vx + 15, y + h + 6, vw - 30, 1, '#9a6a12');
    for (let xx = vx + 22; xx < vx + vw - 22; xx += 14) frect(g, xx, y + h + 5, 6, 2, '#1a1404');
    for (const sx of [vx + G.bx0 + 34, vx + G.bx1 - 50]) {
      frect(g, sx - 1, y + h - 9, 18, 13, '#000633'); frect(g, sx, y + h - 8, 16, 11, '#3e4a68'); frect(g, sx, y + h - 8, 16, 2, '#94a2b8'); frect(g, sx, y + h - 6, 2, 9, '#72809a'); frect(g, sx + 14, y + h - 6, 2, 9, '#1a2238');
      frect(g, sx + 3, y + h - 3, 3, 3, '#0c1124'); frect(g, sx + 10, y + h - 3, 3, 3, '#0c1124'); fpx(g, sx + 4, y + h - 2, '#b8c6d6'); fpx(g, sx + 11, y + h - 2, '#b8c6d6');
    }
    // ---- tubos (detrás del cuerpo): alimentación turquesa, concentrado grafito, permeado cian
    const yIn = cy - 1, yConc = y + G.fT + Math.round(G.F * 0.45), yPerm = cy;
    M.pipeH(g, x, yIn, PAD + 6, 4, SEAP);
    M.pipeH(g, vx + vw - 6, yConc, PAD + 6, 5, GRAPH);
    // halo de 2 px del permeado (dos escalones de alfa planos) y tubo cian luminoso
    const pl = PAD + 8, px0 = vx + vw - 8;
    if (on > 0.02) { g.globalAlpha = 0.25 * Math.min(1, on); frect(g, px0, yPerm - 6, pl, 13, '#48b6ec'); g.globalAlpha = 0.5 * Math.min(1, on); frect(g, px0, yPerm - 5, pl, 11, '#48b6ec'); g.globalAlpha = 1; }
    M.pipeH(g, px0, yPerm, pl, 3, on > 0.02 ? PERM : ['#0a1a36', '#123e66', '#1a5a8a', '#2a7ab0', '#3a96cc', '#5ab0d8', '#86c8e8']);
    // bridas de los tubos
    for (const [fx, fy, r] of [[x + 3, yIn, 5], [x + w - 4, yConc, 6], [x + w - 4, yPerm, 4], [vx + vw + 3, yConc, 6]]) { frect(g, fx, fy - r, 2, 2 * r + 1, '#000633'); frect(g, fx, fy - r + 1, 1, 2 * r - 1, '#b8c6d6'); }
    // ---- cuerpo (base estática)
    g.drawImage(vesselBase(vw, h, rq), vx, y);
    // ---- capa de polarización (sal rechazada junto a la membrana, crece con la recuperación)
    const polA = clamp(0.08 + R * 0.75, 0, 0.6);
    g.fillStyle = '#f888b8';
    for (let s = 0; s < 4; s++) { const x0 = X0 + Math.round(LW * s / 4), ww = Math.round(LW / 4); g.globalAlpha = polA * (0.35 + s * 0.22); g.fillRect(x0, y + G.mT - 3, ww, 3); g.fillRect(x0, y + G.fB, ww, 3); }
    g.globalAlpha = 1;
    // ---- ensuciamiento (biopelícula marrón sobre la membrana, lado alimentación)
    const fh = Math.round(clamp(st.foul || 0, 0, 1) * 6);
    if (fh > 0) for (let xx = X0; xx < X1; xx += 3) { const hh = Math.max(1, fh - ((xx * 7) % 3)); frect(g, xx, y + G.mT - hh, 3, hh, (xx % 2) ? '#7a5a2a' : '#5a3e1a'); frect(g, xx, y + G.fB, 3, hh, (xx % 2) ? '#6a4a22' : '#5a3e1a'); }
    // ---- incrustación: racimos de cristales en el lado del concentrado (solo con riesgo real)
    const sc = st.scale ?? -1;
    if (sc > -0.35) {
      const nC = Math.round(clamp((sc + 0.35) / 1.35, 0, 1) * 26);
      for (let i = 0; i < nC; i++) {
        const xx = X0 + LW * (0.55 + 0.45 * ((i * 0.618) % 1)), top = i % 2 === 0;
        const cs = crystalSprite(i % 6);
        g.drawImage(cs, Math.round(xx), top ? y + G.mT - 6 - fh : y + G.fB + fh, cs.width, cs.height);
      }
    }
    // ---- iones de sal que viajan con la alimentación (más densos hacia la salida)
    const nSalt = 84, fq = 0.08 + (st.Qf || 100) / 1200;
    for (let i = 0; i < nSalt; i++) {
      const ph = ((t * fq + i / nSalt) % 1);
      if (hash1(i, 3) > 0.38 + ph * clamp(R * 1.2, 0, 0.8)) continue;
      const top = i % 2 === 0, ch0 = top ? y + G.fT + 3 : y + G.fB + 3;
      const near = ph > 0.55 && hash1(i, 9) < 0.5 + R; // la sal rechazada se acerca a la membrana al avanzar
      const yy = near ? (top ? y + G.mT - 5 - (i % 3) : y + G.fB + 2 + (i % 3)) : ch0 + ((i * 37) % (G.F - 8)) + Math.sin(t * 3 + i) * 1.2;
      g.drawImage(M.saltDot(ph > 0.6 ? '#f888b8' : '#fffaf0'), Math.round(X0 + ph * (LW - 4)) - 1, Math.round(yy) - 1);
    }
    // ---- moléculas de agua: viajan con la alimentación y cruzan la membrana hacia el tubo central
    const nW = cip ? 0 : Math.round(clamp((st.Qp || 0) / 1.2, 0, 40));
    for (let i = 0; i < nW; i++) {
      const ph = ((t * 0.45 + hash1(i, 21)) % 1), top = i % 2 === 0;
      const xx = X0 + 10 + Math.round(((i * 0.381966) % 1) * (LW - 24));
      const ya = top ? y + G.mT - 9 : y + G.fB + 7, yb = top ? y + G.tT + 1 : y + G.tB - 3;
      const yy = Math.round(lerp(ya, yb, ph)), inM = top ? (yy >= y + G.mT - 1 && yy < y + G.pT + 1) : (yy >= y + G.mB - 1 && yy < y + G.fB + 1);
      g.drawImage(M.dot(inM ? '#ffffff' : ph < 0.35 ? '#6cf0db' : '#a6f4ff'), xx - 1, yy - 1);
    }
    // ---- permeado luminoso en el tubo central: núcleo blanco, halo de 2 px y chevrones que avanzan
    if (on > 0.02) {
      const ty = y + G.tT + 2, th = G.ct - 4, gx1 = vx + G.cx1;
      g.globalAlpha = 0.25 * Math.min(1, on); frect(g, X0, ty - 4, gx1 - X0, th + 8, '#48b6ec');
      g.globalAlpha = 0.5 * Math.min(1, on); frect(g, X0, ty - 2, gx1 - X0, th + 4, '#48b6ec');
      g.globalAlpha = 0.6 + 0.4 * Math.min(1, on); frect(g, X0, ty, gx1 - X0, th, '#48b6ec'); frect(g, X0, ty + 1, gx1 - X0, 1, '#c8f4ff'); g.globalAlpha = 1;
      const step = 18, off = (t * 22 * (0.5 + Math.min(1, on))) % step;
      for (let cx = X0 + off; cx < gx1 - 3; cx += step) { const q = Math.round(cx), c0 = ty + Math.floor(th / 2); fpx(g, q, c0 - 2, '#ffffff'); fpx(g, q + 1, c0 - 1, '#ffffff'); frect(g, q + 2, c0, 1, 1, '#ffffff'); fpx(g, q + 1, c0 + 1, '#ffffff'); fpx(g, q, c0 + 2, '#ffffff'); }
    }
    if (on > 0.02) { const off = (t * 26) % 9; for (let cx = px0 + 4 + off; cx < x + w - 4; cx += 9) { const q = Math.round(cx); fpx(g, q, yPerm - 1, '#ffffff'); fpx(g, q + 1, yPerm, '#ffffff'); fpx(g, q, yPerm + 1, '#ffffff'); } }
    // ---- concentrado grafito: partículas magenta que salen por el tubo
    const nB = Math.round(clamp((st.Qc || 0) / 8, 1, 9));
    for (let i = 0; i < Math.min(nB, 4); i++) { const ph = ((t * 0.7 + i / Math.min(nB, 4)) % 1); g.drawImage(M.dot(i % 2 ? '#f888b8' : '#ff5ad8'), Math.round(vx + vw + ph * (PAD - 4)) - 1, yConc - 1 + (i % 2)); }
    // ---- alimentación a presión: chevrones turquesa en el tubo de entrada y manómetro
    { const off = (t * 26) % 8; for (let cx = x + off; cx < vx + 2; cx += 8) { const q = Math.round(cx); fpx(g, q, yIn - 1, '#c6fff2'); fpx(g, q + 1, yIn, '#c6fff2'); fpx(g, q, yIn + 1, '#c6fff2'); } }
    // espuma de limpieza (CIP)
    if (cip) for (let i = 0; i < 40; i++) { const ph = (t * 0.4 + i / 40) % 1; g.drawImage(M.dot('#fffaf0'), Math.round(X0 + ph * LW), Math.round(y + (i % 2 ? G.fT + 4 : G.fB + 4) + ((i * 13) % (G.F - 8)))); }
    return { x0: X0, x1: X1, cy, inlet: { x: x + 4, y: yIn }, conc: { x: x + w - 2, y: yConc }, perm: { x: x + w - 2, y: yPerm }, membTop: y + G.mT, membBot: y + G.fB, feedTop: y + G.fT, tubeY: y + G.tT, vx, vw, G };
  };

  /* =================== MODO SIMULADOR: paneles de cristal y gráficos ilustrados =================== */
  const GLASS = 0.84;
  /** Panel del simulador: marco de la casa con el relleno al 84 % (la escena se intuye) y bisel de 1 px */
  M.glassPanel = function (orig) {
    return function (g, x, y, w, h, style = 'tech', accent = null, o = {}) {
      x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
      if (w < 24 || h < 16 || (o && o.alpha != null && o.alpha < 1)) return orig.call(UIK, g, x, y, w, h, style, accent, o);
      const s = panelStyle(style);
      const k = 'gp|' + style + '|' + w + '|' + h + '|' + (accent || '') + '|' + (o.chamfer ?? '') + '|' + (o.key ?? '') + '|' + (o.spark ?? '') + '|' + (o.cbr ?? '');
      const c = memo(k, () => {
        const cc = makeCanvas(w, h), b = cc.g; b.imageSmoothingEnabled = false;
        UIK.drawFrame(b, 0, 0, w, h, s, accent, o);
        // relleno translúcido: se resta alfa al interior (no al marco)
        b.globalCompositeOperation = 'destination-out'; b.globalAlpha = 1 - GLASS; b.fillStyle = '#000'; b.fillRect(4, 4, w - 8, h - 8);
        b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1;
        // bisel interior de 1 px (luz arriba-izquierda, sombra abajo-derecha)
        b.globalAlpha = 0.55; b.fillStyle = s.hi; b.fillRect(4, 3, w - 8, 1); b.fillRect(3, 4, 1, h - 8);
        b.globalAlpha = 0.6; b.fillStyle = s.ink; b.fillRect(4, h - 4, w - 8, 1); b.fillRect(w - 4, 4, 1, h - 8);
        b.globalAlpha = 1;
        return cc;
      });
      g.drawImage(c, x, y);
    };
  };
  const _orig = {};
  let _on = false;
  // tanque iluminado: cilindro vertical de vidrio con líquido y menisco
  function tankLit(g, x, y, w, h, frac, ramp = RAMP.sea, label = null, o = {}) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    const shell = memo('tk|' + w + '|' + h, () => {
      const cc = makeCanvas(w, h + 4), b = cc.g, S = STEEL;
      b.fillStyle = '#000633'; b.fillRect(1, 2, w - 2, h); b.fillRect(0, 3, w, h - 2);
      for (let xx = 1; xx < w - 1; xx++) { const t = xx / (w - 1); const k = t < 0.12 ? 5 : t < 0.26 ? 8 : t < 0.5 ? 6 : t < 0.78 ? 4 : t < 0.9 ? 2 : 3; b.fillStyle = S[k]; b.fillRect(xx, 3, 1, 2); b.fillRect(xx, h - 1, 1, 2); }
      // cuerpo de vidrio oscuro
      for (let xx = 2; xx < w - 2; xx++) { const t = xx / (w - 1); b.fillStyle = t < 0.25 ? '#123050' : t < 0.6 ? '#0a2440' : '#061830'; b.fillRect(xx, 5, 1, h - 6); }
      // tapa abombada
      b.fillStyle = '#000633'; b.fillRect(3, 0, w - 6, 3); b.fillStyle = S[7]; b.fillRect(4, 1, w - 8, 1); b.fillStyle = S[5]; b.fillRect(4, 2, w - 8, 1);
      return cc;
    });
    g.drawImage(shell, x, y - 2);
    const lh = Math.round((h - 7) * clamp(frac, 0, 1)), top = y + h - 2 - lh, rn = ramp.length - 1;
    for (let xx = 2; xx < w - 2 && lh > 0; xx++) {
      const tt = xx / (w - 1), k = tt < 0.2 ? 0.85 : tt < 0.45 ? 0.7 : tt < 0.75 ? 0.5 : 0.3;
      g.fillStyle = ramp[clamp(Math.round(k * rn), 0, rn)]; g.fillRect(x + xx, top, 1, lh);
    }
    if (lh > 1) { g.fillStyle = ramp[rn]; for (let xx = x + 2; xx < x + w - 2; xx += 2) g.fillRect(xx, top + Math.round(Math.sin(Game.time * 3 + xx * 0.5) * 0.7), 2, 1); }
    // reflejo vertical del vidrio (1–2 px casi blanco al 25 % del ancho) y luz reflejada a la derecha
    g.globalAlpha = 0.5; frect(g, x + Math.max(2, Math.round(w * 0.22)), y + 4, 1, h - 7, '#f4f9ff'); g.globalAlpha = 0.22; frect(g, x + Math.max(3, Math.round(w * 0.22)) + 1, y + 4, 2, h - 7, '#f4f9ff'); g.globalAlpha = 0.3; frect(g, x + w - 4, y + 4, 1, h - 7, '#8fdfff'); g.globalAlpha = 1;
    if (o.reserve != null) { const ry = y + h - 2 - Math.round((h - 4) * o.reserve); for (let xx = x + 1; xx < x + w - 1; xx += 2) fpx(g, xx, ry, '#ff4e5d'); }
    for (let i = 1; i < 4; i++) frect(g, x + w - 5, y + Math.round(h * i / 4), 3, 1, '#b8c6d6');
    if (label) drawText(g, label, x + w / 2, y + h + 2, { font: 'tiny', color: '#b8c8e8', align: 'center' });
  }
  // batería: armario BESS con módulos iluminados, LED y terminales
  function batteryLit(g, x, y, w, h, soc, reserve = 0, label = null) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    const shell = memo('bt|' + w + '|' + h, () => {
      const cc = makeCanvas(w + 2, h + 5), b = cc.g, S = STEEL;
      b.fillStyle = '#000633'; b.fillRect(Math.round(w / 2) - 5, 0, 12, 4); b.fillStyle = '#d0a040'; b.fillRect(Math.round(w / 2) - 4, 1, 4, 2); b.fillStyle = '#56647f'; b.fillRect(Math.round(w / 2) + 2, 1, 4, 2);
      b.fillStyle = '#000633'; b.fillRect(0, 3, w + 1, h + 1);
      for (let xx = 1; xx < w; xx++) { const t = xx / w; b.fillStyle = S[t < 0.1 ? 6 : t < 0.25 ? 8 : t < 0.7 ? 5 : t < 0.9 ? 3 : 4]; b.fillRect(xx, 4, 1, h - 1); }
      b.fillStyle = '#020e26'; b.fillRect(3, 6, w - 5, h - 5);
      return cc;
    });
    g.drawImage(shell, x - 1, y - 4);
    const n = 10, mh = Math.floor((h - 6) / n);
    for (let i = 0; i < n; i++) {
      const lv = (i + 0.5) / n, my = y + h - 2 - (i + 1) * mh, onn = soc >= lv;
      const col = !onn ? '#0e2850' : soc < 0.2 ? '#ff4e5d' : soc < 0.4 ? '#ffb83e' : '#86e36f';
      frect(g, x + 3, my + 1, w - 6, mh - 1, col);
      if (onn) { frect(g, x + 3, my + 1, w - 6, 1, mixHex(col, '#ffffff', 0.45)); frect(g, x + w - 4, my + 1, 1, mh - 1, shade(col, -0.3)); fpx(g, x + 4, my + Math.max(1, mh - 2), '#ffffff'); }
    }
    if (reserve > 0) { const ry = y + h - 2 - Math.round((h - 4) * reserve); frect(g, x - 2, ry, w + 4, 1, '#ff4e5d'); }
    if (label) drawText(g, label, x + w / 2, y + h + 2, { font: 'tiny', color: '#b8c8e8', align: 'center' });
  }
  // barras: prismas con cara frontal iluminada, cara lateral en sombra y tapa clara (en 3/4)
  function barsLit(g, x, y, w, h, items, o = {}) {
    Charts.frame(g, x, y, w, h, o.bg);
    const max = o.max ?? Math.max(...items.map(i => i.v)) * 1.15;
    const n = items.length, bw = Math.floor((w - 8) / n);
    items.forEach((it, i) => {
      const bh = Math.round((h - 16) * clamp(it.v / max, 0, 1));
      const bx = x + 4 + i * bw, by = y + h - 10 - bh, ww = Math.max(2, bw - 3);
      if (bh > 0) {
        frect(g, bx + 1, by, ww, bh, it.color);
        frect(g, bx + 1, by, Math.max(1, Math.round(ww * 0.3)), bh, mixHex(it.color, '#ffffff', 0.22));
        frect(g, bx + 1 + ww - Math.max(1, Math.round(ww * 0.28)), by, Math.max(1, Math.round(ww * 0.28)), bh, shade(it.color, -0.32));
        frect(g, bx + 1, by, ww, 1, mixHex(it.color, '#ffffff', 0.6));
        if (bh > 3) frect(g, bx + 2, by + 1, 1, bh - 2, mixHex(it.color, '#ffffff', 0.7));
        frect(g, bx + 1, y + h - 10, ww, 1, '#000633');
      }
      if (it.label) drawText(g, it.label, bx + bw / 2 - 1, y + h - 8, { font: 'tiny', color: '#b8c8e8', align: 'center' });
      if (o.values) drawText(g, o.fmt ? o.fmt(it.v) : fmt(it.v, 0), bx + bw / 2 - 1, by - 7, { font: 'tiny', color: it.color, align: 'center' });
    });
    if (o.limit != null) { const ly = y + h - 10 - Math.round((h - 16) * o.limit / max); for (let xx = x + 2; xx < x + w - 2; xx += 2) fpx(g, xx, ly, '#ff4e5d'); }
  }
  // marco de gráfico: pozo de cristal al 82 % con bisel, remaches y rótulo de esquina
  function frameLit(g, x, y, w, h, bg = '#020e26') {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    if (w < 8 || h < 8) return _orig.frame.call(Charts, g, x, y, w, h, bg);
    if (bg === '#0a0f26' || bg === '#1a1838') bg = '#020e26';
    const c = memo('cf|' + w + '|' + h + '|' + bg, () => {
      const cc = makeCanvas(w, h), b = cc.g;
      b.fillStyle = '#000633'; b.fillRect(1, 0, w - 2, h); b.fillRect(0, 1, w, h - 2);
      b.fillStyle = '#3a64b0'; b.fillRect(1, 1, w - 2, 1); b.fillRect(1, 1, 1, h - 2);
      b.fillStyle = '#163a6a'; b.fillRect(1, h - 2, w - 2, 1); b.fillRect(w - 2, 1, 1, h - 2);
      b.clearRect(2, 2, w - 4, h - 4);
      b.globalAlpha = 0.82; b.fillStyle = bg; b.fillRect(2, 2, w - 4, h - 4);
      b.globalAlpha = 0.5; b.fillStyle = '#00081c'; b.fillRect(2, 2, w - 4, 1); b.fillRect(2, 2, 1, h - 4);
      b.globalAlpha = 1;
      for (const [rx, ry] of [[3, 3], [w - 5, 3], [3, h - 5], [w - 5, h - 5]]) { b.fillStyle = '#2a4c82'; b.fillRect(rx, ry, 2, 2); b.fillStyle = '#86a8d0'; b.fillRect(rx, ry, 1, 1); }
      return cc;
    });
    g.drawImage(c, x, y);
  }
  // gráfico de líneas: ejes con marcas de 2 px y series de 2 px con halo del color del sistema
  function lineLit(g, x, y, w, h, series, o = {}) {
    const r = _orig.line.call(Charts, g, x, y, w, h, series, o);
    if (!r) return r;
    const { X, Y, cx, cy, cw, ch } = r;
    frect(g, cx - 1, cy, 1, ch, '#5a86c0'); frect(g, cx - 1, cy + ch, cw + 1, 1, '#5a86c0');
    const ny = o.yTicks ?? 4, nx = o.xTicks ?? 6;
    for (let i = 0; i <= ny; i++) frect(g, cx - 3, Math.round(cy + ch - 1 - i * (ch - 1) / ny), 2, 1, '#a8c8ff');
    for (let i = 0; i <= nx; i++) frect(g, Math.round(cx + i * (cw - 1) / nx), cy + ch + 1, 1, 2, '#a8c8ff');
    // series reforzadas: halo de 1 px al 30 % arriba, sombra de 1 px abajo y la línea encima
    // (la polilínea reforzada se cachea como lienzo por serie: 1 drawImage en vez de 3 pasadas de fline)
    series.forEach((s) => {
      if (s.dashed || s.step) return;
      const Pp = s.data.map((d, i) => Array.isArray(d) ? d : [i, d]);
      if (Pp.length < 2 || Pp.length > 400) return;
      const pix = []; for (const p of Pp) pix.push(X(p[0]) - x, Y(p[1]) - y);
      const key = 'ln|' + w + '|' + h + '|' + s.color + '|' + pix.join(',');
      const c = memo(key, () => {
        const cc = makeCanvas(w, h), b = cc.g, dk = shade(s.color, -0.45);
        b.globalAlpha = 0.3; for (let i = 0; i + 3 < pix.length; i += 2) fline(b, pix[i], pix[i + 1] - 1, pix[i + 2], pix[i + 3] - 1, s.color);
        b.globalAlpha = 1; for (let i = 0; i + 3 < pix.length; i += 2) fline(b, pix[i], pix[i + 1] + 1, pix[i + 2], pix[i + 3] + 1, dk);
        for (let i = 0; i + 3 < pix.length; i += 2) fline(b, pix[i], pix[i + 1], pix[i + 2], pix[i + 3], s.color);
        return cc;
      });
      g.drawImage(c, x, y);
    });
    if (o.cursor != null) { const xx = X(o.cursor); frect(g, xx - 1, cy, 1, ch, 'rgba(232,246,255,0.35)'); frect(g, xx, cy, 1, ch, '#e8f6ff'); frect(g, xx - 1, cy - 1, 3, 2, '#ffffff'); }
    return r;
  }
  // manómetro con bisel de acero y esfera clara
  function gaugeLit(g, cx, cy, r, frac, col = '#56e5ff', label = null, valueText = null) {
    const ring = memo('gz|' + r, () => {
      const s = 2 * r + 7, cc = makeCanvas(s, s), pb = new PixelBuffer(s, s), S = P(STEEL), o = r + 3.5;
      V.ellipse(pb, o, o, r + 3, r + 3, (nx, ny) => S[clamp(Math.round((0.5 - ny * 0.4 - nx * 0.2) * 9), 1, 9)]);
      V.ellipse(pb, o, o, r + 1, r + 1, () => U('#000633'));
      V.ellipse(pb, o, o, r, r, (nx, ny) => U(ny < -0.4 ? '#0e2a54' : '#071a3a'));
      cc.g.drawImage(pb.toCanvas(), 0, 0);
      return cc;
    });
    g.drawImage(ring, Math.round(cx - r - 3), Math.round(cy - r - 3));
    _orig.gauge.call(Charts, g, cx, cy, r, frac, col, label, valueText);
  }
  M.simCharts = function (on) {
    if (on && !_on) {
      _on = true;
      _orig.frame = Charts.frame; _orig.line = Charts.line; _orig.bars = Charts.bars; _orig.tank = Charts.tank; _orig.battery = Charts.battery; _orig.gauge = Charts.gauge;
      Charts.frame = frameLit; Charts.line = lineLit; Charts.bars = barsLit; Charts.tank = tankLit; Charts.battery = batteryLit; Charts.gauge = gaugeLit;
    } else if (!on && _on) {
      _on = false;
      Charts.frame = _orig.frame; Charts.line = _orig.line; Charts.bars = _orig.bars; Charts.tank = _orig.tank; Charts.battery = _orig.battery; Charts.gauge = _orig.gauge;
    }
  };

  /* =================== PIEZAS ILUSTRADAS PARA LOS DEMÁS GEMELOS =================== */
  /** Barra-prisma iluminada (cara frontal con luz a la izquierda, lateral en sombra, tapa clara) */
  M.prism = function (g, x, y, w, h, col) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    if (w < 1 || h < 1) return;
    frect(g, x, y, w, h, col);
    if (w >= 3) { frect(g, x, y, Math.max(1, Math.round(w * 0.3)), h, mixHex(col, '#ffffff', 0.22)); frect(g, x + w - Math.max(1, Math.round(w * 0.28)), y, Math.max(1, Math.round(w * 0.28)), h, shade(col, -0.32)); }
    frect(g, x, y, w, 1, mixHex(col, '#ffffff', 0.6));
    if (h > 3 && w >= 4) frect(g, x + 1, y + 1, 1, h - 2, mixHex(col, '#ffffff', 0.72));
  };
  /** Textura granular cacheada (lechos filtrantes, suelos): granos con luz desde arriba */
  M.granular = function (w, h, ramp, seed = 1) {
    return memo('gr|' + w + '|' + h + '|' + ramp.join() + '|' + seed, () => {
      const pb = new PixelBuffer(w, h), R = P(ramp), n = R.length;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const v = hash2(x >> 1, y, seed), t = clamp(0.62 - y / h * 0.3 + (v - 0.5) * 0.5 + (vnoise(x * 0.2, y * 0.3, seed) - 0.5) * 0.3, 0, 0.999);
        pb.data[y * w + x] = R[Math.floor(t * n)];
      }
      for (let i = 0; i < w * h / 14; i++) { const x = Math.floor(hash2(i, 1, seed + 3) * (w - 2)), y = Math.floor(hash2(i, 2, seed + 3) * (h - 2)); pb.data[y * w + x] = R[n - 1]; pb.data[(y + 1) * w + x + 1] = R[0]; }
      return pb.toCanvas();
    });
  };
  /** Recipiente vertical de acero alrededor de (x,y,w,h): paredes iluminadas con franja especular vertical
   *  al 25–35 %, casquetes arriba y abajo, bandas azules y remaches; o.win deja una mirilla oscura */
  M.vesselShell = function (g, x, y, w, h, o = {}) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    const c = memo('vs|' + w + '|' + h + '|' + (o.win || 0), () => {
      const dh = Math.max(4, Math.round(w * 0.22)), cc = new PixelBuffer(w + 2, h + 2 * dh + 2), S = P(STEEL), nS = S.length, Bl = P(BLUE);
      const colK = (xx) => { const t = (xx + 0.5) / w; if (Math.abs(t - 0.29) < 1.2 / w) return nS - 1; return clamp(Math.round((t < 0.06 ? 0.3 : t < 0.2 ? 0.72 : t < 0.38 ? 0.8 : t < 0.55 ? 0.6 : t < 0.72 ? 0.42 : t < 0.88 ? 0.22 : 0.36) * (nS - 2)), 0, nS - 2); };
      for (let xx = 0; xx < w; xx++) {
        const i = colK(xx);
        for (let yy = 0; yy < h; yy++) {
          const band = (yy > 6 && yy < 10) || (yy > h - 11 && yy < h - 7);
          cc.data[(yy + dh + 1) * cc.w + xx + 1] = band ? Bl[clamp(Math.round(i / (nS - 1) * 6), 0, 6)] : S[i];
        }
        const e = Math.sqrt(Math.max(0, 1 - ((xx + 0.5) / w * 2 - 1) ** 2)), up = Math.round(e * dh);
        for (let k = 0; k < up; k++) cc.data[(dh + 1 - k) * cc.w + xx + 1] = S[clamp(i + (k > up - 2 ? 1 : 0), 0, nS - 1)];
        for (let k = 0; k < up; k++) cc.data[(h + dh + 1 + k) * cc.w + xx + 1] = S[clamp(i - 2 - (k > up - 2 ? 1 : 0), 0, nS - 1)];
      }
      const d = cc.data, ink = U('#000633'), sol = (X, Y) => X >= 0 && Y >= 0 && X < cc.w && Y < cc.h && (d[Y * cc.w + X] >>> 24) === 255, ed = [];
      for (let Y = 0; Y < cc.h; Y++) for (let X = 0; X < cc.w; X++) if (sol(X, Y) && (!sol(X - 1, Y) || !sol(X + 1, Y) || !sol(X, Y - 1) || !sol(X, Y + 1))) ed.push(Y * cc.w + X);
      for (const i of ed) d[i] = ink;
      for (let xx = 3; xx < w - 2; xx += 5) { V.put(cc, xx + 1, dh + 9, S[nS - 1]); V.put(cc, xx + 1, h + dh - 8, S[nS - 2]); }
      if (o.win) for (let yy = 12; yy < h - 12; yy++) for (let xx = 3; xx < w - 3; xx++) d[(yy + dh + 1) * cc.w + xx + 1] = (xx === 3 || yy === 12) ? U('#000633') : (xx === w - 4 || yy === h - 13) ? S[5] : U('#06122a');
      return { c: cc.toCanvas(), dh };
    });
    g.drawImage(c.c, x - 1, y - c.dh - 1);
    return { x0: x + 4, y0: y + 13, x1: x + w - 4, y1: y + h - 13 };
  };
  /** Balsa de hormigón en 3/4 (borde superior claro, cara frontal con juntas, sombra de contacto) */
  M.basin = function (g, x, y, w, h) {
    x = Math.round(x); y = Math.round(y);
    const c = memo('bs|' + w + '|' + h, () => {
      const pb = new PixelBuffer(w, h + 3), C = P(['#2a3444', '#443930', '#6e625b', '#7b7679', '#ac9b82', '#cebaac', '#e2d2c0', '#f5e5c3']);
      for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
        let k = yy < 2 ? 7 : yy < 4 ? 6 : (xx < 3 ? 5 : xx >= w - 3 ? 3 : yy > h - 3 ? 2 : 4);
        if (yy >= 4 && (xx % 16 === 0 || yy % 9 === 0)) k = Math.max(1, k - 2);
        if (yy >= 4 && hash2(xx >> 1, yy >> 1, 4) < 0.08) k = Math.max(1, k - 1);
        pb.data[yy * w + xx] = C[k];
      }
      for (let xx = 2; xx < w - 2; xx++) { pb.data[h * w + xx] = U('#020818'); pb.data[(h + 1) * w + xx] = U('#020818'); }
      return pb.toCanvas();
    });
    g.drawImage(c, x, y);
  };
  /** Tablero del Nexo: isla de Aridia vista desde arriba, atenuada, bajo una rejilla de plano */
  M.boardMap = function (w, h, seed = 3) {
    return memo('bm|' + w + '|' + h + '|' + seed, () => {
      const pb = new PixelBuffer(w, h), d = pb.data;
      const SEA = P(['#041a3a', '#062448', '#082e56', '#0a3864', '#0e4472']);
      const LAND = P(['#2a1a24', '#3a2228', '#4e2c28', '#62382a', '#764630', '#8a5638', '#9c6844']);
      const GRN = P(['#0e2a1e', '#123624', '#18442a', '#205230', '#2a6236']);
      const E = (x, y) => { const nx = (x - w * 0.55) / (w * 0.5), ny = (y - h * 0.52) / (h * 0.56); return 1 - Math.sqrt(nx * nx + ny * ny) + (vnoise(x * 0.025, y * 0.025, seed) - 0.5) * 0.5 + (vnoise(x * 0.08, y * 0.08, seed + 1) - 0.5) * 0.12; };
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const e = E(x, y);
        let u;
        if (e < 0.02) { const t = clamp(0.6 + e * 2 + (hash2(x >> 2, y, seed) - 0.5) * 0.12, 0, 0.999); u = SEA[Math.floor(t * SEA.length)]; if (e > -0.03 && hash2(x >> 1, y, 7) < 0.5) u = U('#2a6a8a'); }
        else {
          const lit = clamp(0.5 + (E(x - 2, y - 2) - e) * -6 + (vnoise(x * 0.09, y * 0.09, seed + 2) - 0.5) * 0.4, 0, 0.999);
          const green = vnoise(x * 0.04, y * 0.04, seed + 9) > 0.62 && e < 0.4;
          u = green ? GRN[Math.floor(lit * GRN.length)] : LAND[Math.floor(clamp(lit * 0.8 + e * 0.3, 0, 0.999) * LAND.length)];
          if (e < 0.05) u = U('#a08a6a');
        }
        d[y * w + x] = u;
      }
      for (let k = 0; k < 3; k++) { let yy = h * (0.3 + k * 0.22); for (let x = 0; x < w; x++) { yy += Math.sin(x * 0.03 + k) * 0.35; const i = Math.round(yy) * w + x; if (i >= 0 && i < d.length && hash2(x, k, 3) < 0.85 && E(x, yy) > 0.05) d[i] = V.mixU(d[i], U('#c8a878'), 0.5); } }
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (x % 16 === 8 || y % 16 === 8) d[i] = V.mixU(d[i], U('#3a6ab0'), 0.28);
        if ((x % 64 === 8 && Math.abs((y % 64) - 8) < 3) || (y % 64 === 8 && Math.abs((x % 64) - 8) < 3)) d[i] = V.mixU(d[i], U('#8fdfff'), 0.5);
      }
      return pb.toCanvas();
    });
  };
  /** Ficha de nodo iluminada (bisel claro arriba-izquierda, sombra abajo-derecha, sombra arrojada, zócalo del icono) */
  M.nodeTile = function (g, x, y, w, h, pal) {
    const c = memo('nt|' + w + '|' + h + '|' + pal.join(), () => {
      const cc = makeCanvas(w + 2, h + 2), b = cc.g;
      b.globalAlpha = 0.6; b.fillStyle = '#000208'; b.fillRect(2, 2, w, h); b.globalAlpha = 1;
      b.fillStyle = '#05030f'; b.fillRect(0, 0, w, h);
      b.fillStyle = pal[0]; b.fillRect(1, 1, w - 2, h - 2);
      for (let j = 2; j < h - 2; j++) { b.fillStyle = mixHex(pal[1], pal[0], j / h * 0.6); b.fillRect(2, j, w - 4, 1); }
      b.fillStyle = pal[2]; b.fillRect(1, 1, w - 2, 1); b.fillRect(1, 1, 1, h - 3);
      b.fillStyle = mixHex(pal[2], '#ffffff', 0.5); b.fillRect(2, 1, 5, 1);
      b.fillStyle = shade(pal[0], -0.4); b.fillRect(1, h - 2, w - 2, 1); b.fillRect(w - 2, 2, 1, h - 3);
      b.fillStyle = '#05030f'; b.fillRect(2, 4, 14, 16); b.fillStyle = shade(pal[1], -0.25); b.fillRect(3, 5, 12, 14); b.fillStyle = mixHex(pal[1], pal[2], 0.3); b.fillRect(3, 5, 12, 1);
      return cc;
    });
    g.drawImage(c, Math.round(x), Math.round(y));
  };
  /** Ladera eólica vista desde arriba con la rejilla de celdas horneada encima */
  M.windField = function (w, h, gx, gy, cols, rows, cw, rh) {
    return memo('wf|' + w + '|' + h + '|' + gx + '|' + gy + '|' + cols + '|' + rows + '|' + cw + '|' + rh, () => {
      const pb = new PixelBuffer(w, h), d = pb.data;
      const G = P(['#0a2016', '#10341e', '#174a24', '#22622a', '#34782c', '#4e9030', '#6eaa36', '#94c444']);
      const Rk = P(['#3a2430', '#5a3840', '#7e5048', '#a06c54', '#bc8a64', '#d4a87a']);
      const hgt = (x, y) => vnoise(x * 0.018, y * 0.03, 41) * 0.8 + vnoise(x * 0.06, y * 0.08, 42) * 0.2 + Math.sin(y / h * Math.PI) * 0.35;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const s0 = hgt(x, y), sl = (hgt(x - 1, y - 1) - s0) * 18;
        const t = clamp(0.45 + s0 * 0.35 - sl, 0, 0.999);
        let u = G[V.band(t, G.length, x, y, 0.05, 3)];
        if (vnoise(x * 0.07, y * 0.07, 44) > 0.74) u = Rk[V.band(t, Rk.length, x, y, 0.05, 4)];
        if (hash2(x >> 1, y >> 1, 45) < 0.03) u = G[Math.min(G.length - 1, Math.floor(t * G.length) + 2)];
        d[y * w + x] = u;
      }
      for (let x = 0; x < w; x++) { const yy = Math.round(h - 8 + Math.sin(x * 0.04) * 3); for (let k = 0; k < 3; k++) if (yy + k < h) d[(yy + k) * w + x] = U(k === 0 ? '#f2d8a8' : k === 1 ? '#d4b48a' : '#9a7a5a'); }
      for (let i = 0; i < w * h / 160; i++) { const x = Math.floor(hash2(i, 5, 46) * w), y = Math.floor(hash2(i, 6, 46) * h); V.ellipse(pb, x + 0.5, y + 0.5, 2.5, 2, (nx, ny) => G[nx + ny < -0.5 ? 6 : nx + ny < 0.3 ? 3 : 1]); }
      for (let r = 0; r <= rows; r++) for (let x = gx; x < gx + cols * cw; x++) { const yy = gy + r * rh - (r ? 1 : 0); if (yy >= 0 && yy < h) d[yy * w + x] = V.mixU(d[yy * w + x], U('#e8f6ff'), 0.28); }
      for (let c = 0; c <= cols; c++) for (let y = gy; y < gy + rows * rh; y++) { const xx = gx + c * cw - (c ? 1 : 0); if (xx >= 0 && xx < w) d[y * w + xx] = V.mixU(d[y * w + xx], U('#e8f6ff'), 0.28); }
      for (let x = 0; x < w; x++) { d[x] = U('#000633'); d[(h - 1) * w + x] = U('#000633'); d[w + x] = V.mixU(d[w + x], U('#ffffff'), 0.3); }
      for (let y = 0; y < h; y++) { d[y * w] = U('#000633'); d[y * w + w - 1] = U('#000633'); }
      return pb.toCanvas();
    });
  };
  /** Aerogenerador visto desde arriba: zapata de grava, sombra, góndola y rotor perpendicular al viento */
  M.turbineTop = function (g, cx, cy, t, sel, P0 = 1) {
    cx = Math.round(cx); cy = Math.round(cy);
    frect(g, cx - 5, cy - 5, 11, 11, '#9a7a5a'); frect(g, cx - 4, cy - 4, 9, 9, '#d4b48a'); frect(g, cx - 4, cy - 4, 9, 1, '#f2d8a8');
    g.globalAlpha = 0.45; frect(g, cx + 3, cy - 6, 2, 15, '#020818'); frect(g, cx - 1, cy + 2, 8, 3, '#020818'); g.globalAlpha = 1;
    frect(g, cx - 3, cy - 2, 8, 5, '#000633'); frect(g, cx - 2, cy - 1, 6, 3, '#f4f9ff'); frect(g, cx - 2, cy + 1, 6, 1, '#b8c6d6');
    const L = 8 + Math.round(Math.abs(Math.sin(t * 6 * clamp(P0, 0.1, 1))));
    frect(g, cx - 5, cy - L, 2, 2 * L + 1, '#000633'); frect(g, cx - 4, cy - L + 1, 1, 2 * L - 1, '#ffffff'); fpx(g, cx - 4, cy, '#ffd23a');
    if (sel) for (let a = 0; a < 24; a++) { const an = a / 24 * TAU; fpx(g, cx + Math.cos(an) * 10, cy + Math.sin(an) * 10, a % 2 ? '#ffe14d' : '#fff6c0'); }
  };
  /** Perfil de suelo ilustrado: horizonte orgánico, arcilla con agregados, piedras y raíces */
  M.soil = function (w, h) {
    return memo('soil|' + w + '|' + h, () => {
      const pb = new PixelBuffer(w, h), d = pb.data;
      const A = P(['#2a160c', '#3a2012', '#4e2c18', '#62381e', '#7a4a28', '#925c32']), B = P(['#4a2a18', '#62381e', '#7a4e2e', '#946238', '#ae7a46', '#c89458']);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const deep = y > h * 0.55, R = deep ? B : A, t = clamp(0.5 + (hash2(x >> 1, y >> 1, deep ? 3 : 4) - 0.5) * 0.5 + (vnoise(x * 0.15, y * 0.2, 5) - 0.5) * 0.5 - (deep ? 0 : 0.1), 0, 0.999);
        d[y * w + x] = R[Math.floor(t * R.length)];
      }
      for (let i = 0; i < 8; i++) { const x = 6 + Math.floor(hash2(i, 1, 7) * (w - 12)), y = Math.floor(h * 0.6 + hash2(i, 2, 7) * h * 0.35); V.ellipse(pb, x, y, 2.5, 1.8, (nx, ny) => U(nx + ny < -0.4 ? '#d8c0a0' : nx + ny < 0.3 ? '#a08a72' : '#5a4a3a')); }
      for (let k = 0; k < 5; k++) { let x = 12 + k * (w - 24) / 4, y = 1; for (let s = 0; s < h * 0.7; s++) { x += (hash2(k, s, 9) - 0.5) * 1.6; y += 1; V.put(pb, Math.round(x), y, U(s % 4 ? '#e8d0a0' : '#c8a878')); if (hash2(k, s, 10) < 0.06) for (let q = 1; q < 6; q++) V.put(pb, Math.round(x + q * (k % 2 ? 1 : -1)), y + (q >> 1), U('#d8c090')); } }
      return pb.toCanvas();
    });
  };
  /** Planta de cultivo (fríjol) con hojas iluminadas */
  M.crop = function (g, x, y, stress = 0) {
    const c = memo('crop|' + (stress > 0.5 ? 1 : 0), () => {
      const pb = new PixelBuffer(13, 15), Gr = stress > 0.5 ? ['#3a3a12', '#6a6a1e', '#9a922a', '#c8b84a'] : ['#0e3a1a', '#1e6a2a', '#3e9a32', '#8cd44a'];
      for (let yy = 4; yy < 15; yy++) V.put(pb, 6, yy, U('#2e6a22'));
      const leaf = (cx, cy, rx, ry) => V.ellipse(pb, cx, cy, rx, ry, (nx, ny) => U(Gr[nx + ny < -0.5 ? 3 : nx + ny < 0.2 ? 2 : nx + ny < 0.8 ? 1 : 0]));
      leaf(3.5, 6, 3.4, 2.4); leaf(9.5, 5, 3.4, 2.4); leaf(6.5, 2.5, 2.6, 2.4); leaf(3.5, 10.5, 2.8, 2); leaf(9.5, 10, 2.8, 2);
      return pb.toCanvas();
    });
    g.drawImage(c, Math.round(x) - 6, Math.round(y) - 14);
  };
  return M;
})();
