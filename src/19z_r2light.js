/* =====================================================================
   19z_r2light.js — ILUMINACIÓN DEL PLANO JUGABLE (ronda 2 · r2-light)

   Todo lo pesado se prerenderiza al entrar al nivel (≤ 1,5 s); los datos
   por nivel viven en R2LIGHT_CFG (los ficheros de nivel no se tocan).

   · Gradación por hora del fondo, horneada en las capas estáticas del mundo
     (propsC, terrainC, propsFrontC): multiplicar + sombras con desplazamiento
     de tono + luces cálidas, rampa vertical, luz de borde 1 px en siluetas y
     cornisas del lado del sol (B.sun), sombras arrojadas proyectadas desde
     el sol (largas al atardecer) y oclusión al pie. 0 pasadas extra.
   · Personajes: sombra de contacto en bandas sólidas + sombra arrojada
     proyectada desde su silueta (anima con el paso); gradación y luz de borde
     1 px por dentro del contorno, del lado del sol (caché por cuadro de sprite).
     SpriteCache.env toma el ambiente del nivel (luz de borde del rig).
   · Emisivos: halo aditivo extraído de los píxeles emisivos estáticos
     (permeado cian, H2 verde, salmuera magenta, LED) + halos cacheados en
     los ganchos de los kits (PFInfra.drawFlows/drawLeds, PFB.screens).
   · Interiores: haces de luz en el plano de los ventanales y charcos de luz
     en el suelo (cálidos bajo lámparas) con reflejo en el frente del suelo.
   · Capas estáticas dibujadas por franjas recortadas a su contenido: el
     cielo es la única pasada a pantalla completa del mundo.

   API: R2LIGHT.prepare(sc) · release(sc) · on(sc) · blit(g, sc, key)
        shadows(g, sc) · beginChars(sc) · endChars() · glowLayer(g, sc)
        air(g, sc) · cfg(levelId) · stats
   Desactivar para comparar: ?r2l=0 en la URL o def.r2light === false.
   ===================================================================== */

/* ---------- preajustes por hora del día ---------- */
const R2LIGHT_TOD = {
  day: {
    grade: { shade: '#2a1c5a', shadeK: 0.07, sat: 1.04, vgrad: [0.02, -0.04] },
    rim: { col: '#fbc371', k: 0.42, side: 0.75, terrain: 0.45 },
    cast: { col: '#8a4a5a', a: 0.4, len: 0.6, maxLen: 30, hMax: 34 },
    char: { rim: '#fff0c8', rimK: 0.5, shadowCol: '#2a1838', shadowA: 0.62, cast: 0.42, castA: 0.34 },
    glow: 1,
  },
  dusk: {
    // atardecer: oscuros hacia índigo, medios hacia terracota, luces hacia oro (sin malva: no sube el magenta)
    grade: { map: ['#1a1040', '#38245e', '#6a4060', '#b86a52', '#f6a058', '#ffe2a8'], mapK: 0.14, shade: '#2c1a5c', shadeK: 0.2, lift: '#ffb468', liftK: 0.3, sat: 1.14, warmMag: 0.5, vgrad: [0.03, -0.07] },
    rim: { col: '#ffb070', k: 0.62, side: 1, terrain: 0.6 },
    cast: { col: '#4a2a7a', a: 0.5, len: 1.7, maxLen: 110, hMax: 64, lit: '#ffa860', litK: 0.22 },
    // r3-light: personajes reiluminados al ocaso: borde cálido #ffc070 de 1 px (lado del sol, coronilla y coleta),
    // multiplicar violeta #2a1a50 en el lado contrario (2 escalones) y sombra arrojada larga
    char: { mul: '#ffdcc4', mulK: 0.26, shade: '#3a1d62', shadeK: 0.14, lift: '#ffc090', liftK: 0.2, rim: '#ffc070', rimK: 0.9, rimMix: 0.78, rimOutline: 0.82, rimInner: 0.4, crown: 0.95, top: 0.55, crownH: 0.36,
      side: { col: '#2a1a50', k: 0.17, from: 0.5, soft: 0.1 }, warm: { col: '#ffc070', k: 0.1, to: 0.36 },
      shadowCol: '#1c0c36', shadowA: 0.66, cast: 1.6, castA: 0.58 },
    charEnv: 'none',
    glow: 1.3,
  },
  storm: {
    grade: { mul: '#ffe0c0', mulK: 0.12, shade: '#3a1a14', shadeK: 0.22, lift: '#ffd8a0', liftK: 0.14, sat: 1.06, vgrad: [0.04, -0.08] },
    rim: { col: '#ffa060', k: 0.4, side: 0.8, terrain: 0.4 },
    cast: null,
    char: { lift: '#ffd0a0', liftK: 0.12, rim: '#ffb070', rimK: 0.6, shadowCol: '#2a140c', shadowA: 0.62, cast: 0, castA: 0 },
    glow: 1.6,
  },
  interior: {
    grade: { mul: '#e4ecff', mulK: 0.12, shade: '#121c48', shadeK: 0.22, lift: '#fff4dc', liftK: 0.06, sat: 1.12, vgrad: [0.0, -0.06] },
    rim: { col: '#c8e8ff', k: 0.3, side: 0.6, terrain: 0.3 },
    cast: { col: '#202a5a', a: 0.3, len: 0.22, maxLen: 30 },
    char: { shade: '#121c48', shadeK: 0.12, rim: '#d0f0ff', rimK: 0.5, shadowCol: '#0e1230', shadowA: 0.66, cast: 0.2, castA: 0.3 },
    glow: 1.35,
  },
};

/* ---------- datos por nivel (sobrescriben el preajuste) ---------- */
const R2LIGHT_CFG = {
  // toldos turquesa y banderines rosas de la plaza no son emisivos: solo LED verdes
  0: { tod: 'day', glowKinds: [2] },
  1: { tod: 'day' },
  // r3-int-a: nave de OI a pleno sol de tarde: gradación cálida y saturada, haces legibles y charcos de luz
  2: { tod: 'interior', env: 'tech',
    grade: { mul: '#c4bce8', mulK: 0.3, shade: '#14205a', shadeK: 0.24, lift: '#ffd890', liftK: 0.12, sat: 1.3, vgrad: [0.0, -0.05] },
    rim: { col: '#fbc371', k: 0.45, side: 0.7, terrain: 0.35 },
    char: { shade: '#1a1c50', shadeK: 0.1, lift: '#ffd8a0', liftK: 0.08, rim: '#ffd8a0', rimK: 0.6, shadowCol: '#1a0e30', shadowA: 0.66, cast: 0.25, castA: 0.3 },
    shafts: { layer: 'wall', x0: 18, step: 186, w: 150, y0: 54, y1: 166, from: 0.25, slant: 0.3, wTop: 0.5, wBot: 0.78, col: '#ffd58a', a: 0, soft: 0, pool: { col: '#ffc870', a: 0.44, wk: 1.05 }, moteCol: '#fff0c8' }, // volumen: VISTA.r3iaDrawBeams (42_lv02 renderFront)
    lampPools: { a: 0.4, wk: 4.2, reach: 220 } },
  3: { tod: 'dusk', env: 'dusk' },
  4: { tod: 'day', cast: { col: '#4a2a6a', a: 0.36, len: 0.3, maxLen: 40 } },
  5: { tod: 'day' },
  6: { tod: 'interior', env: 'tech',
    // r3-int-b: el sol de la tarde entra por los ventanales en arco del muro de sillería (capa 'wall', R3INTB_VWIN)
    shafts: { layer: 'wall', x0: 58, step: 176, w: 116, y0: 28, y1: 226, from: 0.32, slant: 0.34, wTop: 0.5, wBot: 0.82, col: '#fbc371', a: 0.1, soft: 1, pool: { col: '#ffd49a', a: 0.6 }, moteCol: '#fff0c8', on: (sc) => !sc.state.blackout },
    lampPools: { a: 0.32, wk: 4.5, reach: 210 }, arcs: { top: 198, col: '#a6e6ff', a: 0.85 },
    grade: { mul: '#fff0e4', mulK: 0.1, shade: '#1e1a4a', shadeK: 0.2, lift: '#ffe0b0', liftK: 0.1, sat: 1.32, vgrad: [0.0, -0.05] },
    rim: { col: '#fbc371', k: 0.4, side: 0.8, terrain: 0.35 },
    char: { shade: '#1e1a4a', shadeK: 0.12, lift: '#ffd8a8', liftK: 0.08, rim: '#ffd08a', rimK: 0.6, shadowCol: '#100c28', shadowA: 0.62, cast: 0.3, castA: 0.3 } },
  7: { tod: 'dusk', env: 'dusk', // r3-int-b: luz de ocaso cálida en las caras al sol (mapa de gradiente activo, más realce)
    grade: { map: ['#120f3a', '#2e2860', '#5a4472', '#b86a5a', '#ffa468', '#ffe2b4'], mapK: 0.2, shade: '#24205e', shadeK: 0.18, lift: '#ffb070', liftK: 0.34, sat: 1.22, warmMag: 0.45, vgrad: [0.03, -0.07] },
    rim: { col: '#ffb070', k: 0.7, side: 1, terrain: 0.65 } },
  8: { tod: 'day' },
  9: { tod: 'interior', env: 'dusk', glowKinds: [],
    shafts: { layer: 'hall', x0: 38, step: 180, w: 104, y0: 50, y1: 218, from: 0.25, slant: 0.42, wTop: 0.55, wBot: 0.82, col: '#ffb468', a: 0, soft: 0, motes: false, pool: { col: '#ffb060', a: 0.62, wk: 1.15, band: 12, refl: 10 } }, // r3-int-a: volumen nítido en LEVELS[9].renderFront (VISTA.r3iaDrawBeams)
    lampPools: { a: 0.36, wk: 5, reach: 210 }, grade: { mul: '#e8d4e4', mulK: 0.2, shade: '#2a1a50', shadeK: 0.24, lift: '#ffc898', liftK: 0.05, sat: 1.18, vgrad: [0.0, -0.06] }, rim: { col: '#ffb880', k: 0.36, side: 0.8, terrain: 0.3 }, char: { mul: '#ffe2d6', mulK: 0.18, shade: '#2a1a50', shadeK: 0.14, lift: '#ffc898', liftK: 0.14, rim: '#ffc890', rimK: 0.7, shadowCol: '#1a0e30', shadowA: 0.55, cast: 0.4, castA: 0.26 } },
  10: { tod: 'storm', env: 'calima' },
  11: { tod: 'dusk', env: 'dusk', glowKinds: [2], grade: { map: ['#1e1034', '#4a2a52', '#8a5060', '#d88a60', '#ffc06a', '#ffecb8'], mapK: 0.14, shade: '#3a1e58', shadeK: 0.16, lift: '#ffc070', liftK: 0.26, sat: 1.12, warmMag: 0.3, vgrad: [0.03, -0.07] }, rim: { col: '#ffc070', k: 0.6, side: 1, terrain: 0.55 }, cast: { col: '#4a2a72', a: 0.46, len: 1.5, maxLen: 100, hMax: 60, lit: '#ffb860', litK: 0.2 } },
};

const R2LIGHT = (() => {
  const st = { on: false, cfg: null, sd: 1, env0: null, envSet: false, layers: {}, glowC: null, glowSpans: null, ms: 0 };
  const stats = { prepMs: 0, glowPx: 0 };
  /* ---------- utilidades de color (u32 ABGR) ---------- */
  const rgb = (hex) => { const c = hexToRgb(hex); return [c[0], c[1], c[2]]; };
  const cl8 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v | 0);
  function deep(a, b) { const o = Object.assign({}, a); for (const k in b) o[k] = (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k]) ? Object.assign({}, a[k], b[k]) : b[k]; return o; }
  function cfg(id) {
    const c = R2LIGHT_CFG[id] || { tod: 'day' };
    return deep(R2LIGHT_TOD[c.tod] || R2LIGHT_TOD.day, c);
  }
  function enabled(sc) {
    if (typeof location !== 'undefined' && /[?&]r2l=0/.test(location.search)) return false;
    return !!(sc && sc.def && sc.def.r2light !== false);
  }
  /** Gradación compilada: función (r,g,b,yk)→[r,g,b] sobre arrays reutilizables */
  function compileGrade(G) {
    if (!G) return null;
    const mul = G.mul ? rgb(G.mul).map(v => v / 255) : null, mk = G.mulK || 0;
    const sh = G.shade ? rgb(G.shade) : null, sk = G.shadeK || 0;
    const li = G.lift ? rgb(G.lift) : null, lk = G.liftK || 0;
    const sat = G.sat || 1, wm = G.warmMag || 0, coral = [236, 120, 92];
    // mapa de degradado por luminancia (oscuros → violeta, medios → malva, luces → melocotón/oro)
    let lut = null; const qk = G.mapK || 0;
    if (G.map && qk) {
      const stops = G.map.map(rgb), n = stops.length - 1; lut = new Float32Array(256 * 3);
      for (let i = 0; i < 256; i++) { const t = i / 255 * n, j = Math.min(n - 1, Math.floor(t)), f = t - j; for (let c = 0; c < 3; c++) lut[i * 3 + c] = stops[j][c] + (stops[j + 1][c] - stops[j][c]) * f; }
    }
    const out = [0, 0, 0];
    return function (r, g, b, yk) {
      if (mul && mk) { r *= 1 - mk + mk * mul[0]; g *= 1 - mk + mk * mul[1]; b *= 1 - mk + mk * mul[2]; }
      if (lut) { const q = cl8(0.299 * r + 0.587 * g + 0.114 * b) * 3; r += (lut[q] - r) * qk; g += (lut[q + 1] - g) * qk; b += (lut[q + 2] - b) * qk; }
      const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (sh && sk && L < 0.5) { const w = (0.5 - L) * 2 * sk; r += (sh[0] - r) * w; g += (sh[1] - g) * w; b += (sh[2] - b) * w; }
      if (li && lk && L > 0.55) { const w = (L - 0.55) / 0.45 * lk; r += (li[0] - r) * w; g += (li[1] - g) * w; b += (li[2] - b) * w; }
      if (sat !== 1) { const m = (r + g + b) / 3; r = m + (r - m) * sat; g = m + (g - m) * sat; b = m + (b - m) * sat; }
      // malvas y rosas apagados → coral bajo la luz cálida (los emisivos de salmuera, claros y saturados, se conservan)
      if (wm && b > g + 12 && r > g + 12) {
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b), s = mx > 0 ? (mx - mn) / mx : 0;
        if (!(mx >= 200 && s >= 0.5)) { const k = wm * Math.min(1, (Math.min(r, b) - g) / 60); r += (Math.max(r, coral[0] * mx / 255) - r) * k; g += (coral[1] * mx / 255 - g) * k * 0.5; b += (coral[2] * mx / 255 - b) * k; }
      }
      if (yk) { const f = 1 + yk; r *= f; g *= f; b *= f; }
      out[0] = r; out[1] = g; out[2] = b; return out;
    };
  }
  /* ---------- reiluminación de una capa estática del mundo ---------- */
  function relight(c, world, C, role, sd) {
    const w = c.width, h = c.height, g = c.getContext('2d');
    const img = g.getImageData(0, 0, w, h), D = new Uint32Array(img.data.buffer), A = new Uint8Array(w * h);
    for (let i = 0; i < D.length; i++) A[i] = D[i] >>> 24 ? 1 : 0;
    const grade = compileGrade(C.grade), vg = (C.grade && C.grade.vgrad) || [0, 0];
    const R = C.rim, rc = R ? rgb(R.col) : null;
    const rimK = R ? (role === 'terrain' ? R.terrain ?? R.k * 0.6 : R.k) : 0, sideK = R ? (R.side ?? 0.75) : 0;
    const lx = -sd; // vecino del lado del sol (el sol está en −sd respecto a la sombra)
    // 1) máscara de luz de borde: 1 = borde superior, 2 = borde lateral, 3 = ambos; el contorno oscuro
    //    se conserva y la luz cae en el píxel siguiente hacia dentro
    const RM = rimK ? new Uint8Array(w * h) : null;
    if (RM) for (let y = 1; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (!A[i]) continue;
      // solo bordes de volúmenes macizos (≥ 3 px hacia dentro): las frondas finas no se encienden
      const top = !A[i - w] && y + 2 < h && A[i + w] && A[i + 2 * w];
      const xn = x + lx, xi = x - 2 * lx, side = role !== 'terrain' && xn >= 0 && xn < w && xi >= 0 && xi < w && !A[i + lx] && A[i - lx] && A[i - 2 * lx];
      if (!top && !side) continue;
      const u = D[i], L = (0.299 * (u & 255) + 0.587 * ((u >>> 8) & 255) + 0.114 * ((u >>> 16) & 255)) / 255;
      const m = (top ? 1 : 0) | (side ? 2 : 0);
      if (L > 0.16) RM[i] |= m;
      else { if (top && y + 1 < h && A[i + w]) RM[i + w] |= 1; if (side && A[i - lx]) RM[i - lx] |= 2; }
    }
    // 2) gradación + luz de borde
    for (let y = 0; y < h; y++) {
      const yk = vg[0] + (vg[1] - vg[0]) * (y / h);
      for (let x = 0; x < w; x++) {
        const i = y * w + x; if (!A[i]) continue;
        const u = D[i];
        let r = u & 255, gg = (u >>> 8) & 255, b = (u >>> 16) & 255;
        if (grade) { const o = grade(r, gg, b, yk); r = o[0]; gg = o[1]; b = o[2]; }
        if (RM && RM[i]) {
          const m = RM[i], L = (0.299 * r + 0.587 * gg + 0.114 * b) / 255;
          if (L < 0.93) { const k = rimK * (m & 1 ? 1 : sideK) * (m === 3 ? 1.15 : 1); r += (rc[0] - r) * k; gg += (rc[1] - gg) * k; b += (rc[2] - b) * k; }
        }
        D[i] = ((u & 0xff000000) | (cl8(b) << 16) | (cl8(gg) << 8) | cl8(r)) >>> 0;
      }
    }
    return { img, D, A, g, w, h };
  }
  /** Sombras arrojadas: proyección de los píxeles de los accesorios por encima de la banda del suelo
      sobre la banda (sol de B.sun); oscurece props y terreno en la banda con color de sombra. */
  function castShadows(P, T, world, C, sd, band) {
    const K = C.cast; if (!K || !P) return;
    const w = P.w, h = P.h, gy = world.ground, M = new Float32Array(w);
    const len = K.len, maxL = K.maxLen || 120, hMax = K.hMax || 48, minRun = K.minRun || 9, RUN = new Uint16Array(h + 4);
    for (let x = 0; x < w; x++) {
      const gY = gy[Math.min(x, gy.length - 1)] | 0, top = gY - band;
      // solo la parte baja de volúmenes macizos (bases, troncos, zancos, cajas; tramos verticales ≥ minRun):
      // la hierba y las flores no ensucian la banda del suelo y quedan huecos de luz legibles
      const y0 = Math.max(0, top - hMax);
      let run = 0;
      for (let y = top - 1; y >= y0; y--) { if (y < h && P.A[y * w + x]) run++; else { if (run) for (let k = 1; k <= run; k++) RUN[y + k] = run; run = 0; } }
      if (run) for (let k = 0; k < run; k++) RUN[y0 + k] = run;
      for (let y = y0; y < top; y++) {
        if (!P.A[y * w + x] || RUN[y] < minRun) continue;
        const hh = gY - band * 0.5 - y; if (hh <= 0) continue;
        const d = Math.min(maxL, hh * len), xp = Math.round(x + sd * d);
        if (xp < 0 || xp >= w) continue;
        const v = hh < 22 ? 1 : hh < 60 ? 0.72 : 0.5;
        // sombra con cuerpo: la proyección de un píxel cubre 2 columnas
        if (v > M[xp]) M[xp] = v;
        const x2 = xp + sd; if (x2 >= 0 && x2 < w && v > M[x2]) M[x2] = v;
      }
    }
    // apertura/cierre de 1 px para quitar huecos de una columna (bandas sólidas)
    const M2 = new Float32Array(w);
    for (let x = 1; x < w - 1; x++) M2[x] = Math.max(M[x], Math.min(M[x - 1], M[x + 1]));
    const sc = rgb(K.col).map(v => v / 255), a = K.a, lit = K.lit ? rgb(K.lit) : null, litK = K.litK || 0;
    const apply = (L) => {
      if (!L) return;
      for (let x = 0; x < w; x++) {
        const m = M2[x]; if (!m && !lit) continue;
        const gY = gy[Math.min(x, gy.length - 1)] | 0;
        for (let y = Math.max(0, gY - band); y <= Math.min(h - 1, gY); y++) {
          const i = y * w + x; if (!L.A[i]) continue;
          const u = L.D[i];
          const r = (u & 255), g = (u >>> 8) & 255, b = (u >>> 16) & 255;
          if (m) {
            const k = a * m * (y === gY - band ? 0.7 : 1);
            L.D[i] = ((u & 0xff000000) | (cl8(b * (1 - k + k * sc[2])) << 16) | (cl8(g * (1 - k + k * sc[1])) << 8) | cl8(r * (1 - k + k * sc[0]))) >>> 0;
          } else {
            // suelo al sol: luz rasante cálida (screen) donde no cae sombra
            const k = litK * (y <= gY - band + 2 ? 0.6 : 1);
            L.D[i] = ((u & 0xff000000) | (cl8(b + (255 - b) * k * lit[2] / 255) << 16) | (cl8(g + (255 - g) * k * lit[1] / 255) << 8) | cl8(r + (255 - r) * k * lit[0] / 255)) >>> 0;
          }
        }
      }
    };
    apply(P); apply(T);
  }
  /** Charcos de luz en el suelo: [{x, w, col, a}] — banda superior del suelo + reflejo en el frente */
  function pools(P, T, world, list, band) {
    if (!list || !list.length) return;
    const gy = world.ground;
    for (const Q of list) {
      const c = rgb(Q.col || '#ffd890'), a = Q.a ?? 0.35, hw = (Q.w || 60) / 2;
      for (const L of [P, T]) {
        if (!L) continue;
        const w = L.w, h = L.h;
        for (let x = Math.max(0, Math.round(Q.x - hw)); x < Math.min(w, Math.round(Q.x + hw)); x++) {
          const d = Math.abs(x - Q.x) / hw, k = a * (d < 0.45 ? 1 : d < 0.75 ? 0.62 : 0.32);
          const gY = gy[Math.min(x, gy.length - 1)] | 0;
          const y0 = Math.max(0, gY - band), y1 = Math.min(h - 1, gY + (Q.refl ?? 10));
          for (let y = y0; y <= y1; y++) {
            const i = y * w + x; if (!L.A[i]) continue;
            const kk = y <= gY ? k : k * 0.45 * (1 - (y - gY) / ((Q.refl ?? 10) + 1)) * (((y - gY) & 1) ? 0.7 : 1);
            const u = L.D[i];
            const r = u & 255, g = (u >>> 8) & 255, b = (u >>> 16) & 255;
            // luz aditiva teñida (screen): no quema los claros
            L.D[i] = ((u & 0xff000000) | (cl8(b + (255 - b) * kk * c[2] / 255) << 16) | (cl8(g + (255 - g) * kk * c[1] / 255) << 8) | cl8(r + (255 - r) * kk * c[0] / 255)) >>> 0;
          }
        }
      }
    }
  }
  /* ---------- franjas recortadas al contenido (≤ 2 pasadas a pantalla completa) ---------- */
  const SW = 64;
  /** Franjas de sw px de ancho; en cada una, tramos verticales de filas con contenido (se unen huecos ≤ gap) */
  function spans(A, w, h, sw = SW, gapMax = 24) {
    const out = []; out.sw = sw;
    for (let x0 = 0; x0 < w; x0 += sw) {
      const x1 = Math.min(w, x0 + sw), rows = new Uint8Array(h);
      for (let y = 0; y < h; y++) { const o = y * w; for (let x = x0; x < x1; x++) if (A[o + x]) { rows[y] = 1; break; } }
      const list = [];
      let y = 0;
      while (y < h) {
        while (y < h && !rows[y]) y++;
        if (y >= h) break;
        let ya = y, gap = 0, yb = y;
        while (y < h) { if (rows[y]) { yb = y; gap = 0; } else if (++gap > gapMax) break; y++; }
        list.push([ya, yb + 1]);
      }
      out.push(list);
    }
    return out;
  }
  function blitSpans(g, c, S, ox, oy, op) {
    ox = Math.round(ox); oy = Math.round(oy);
    const sw = S.sw || SW, i0 = Math.max(0, Math.floor(ox / sw)), i1 = Math.min(S.length - 1, Math.floor((ox + W - 1) / sw));
    for (let i = i0; i <= i1; i++) {
      const sx0 = Math.max(ox, i * sw), sx1 = Math.min(ox + W, i * sw + sw, c.width);
      if (sx1 <= sx0) continue;
      for (const [ya, yb] of S[i]) {
        const y0 = Math.max(ya, oy), y1 = Math.min(yb, oy + H);
        if (y1 <= y0) continue;
        g.drawImage(c, sx0, y0, sx1 - sx0, y1 - y0, sx0 - ox, y0 - oy, sx1 - sx0, y1 - y0);
      }
    }
  }
  /* ---------- halo de emisivos estáticos (extraído de los píxeles) ---------- */
  function emissiveOf(r, g, b) {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx < 200) return 0;
    const s = (mx - mn) / mx; if (s < 0.5) return 0;
    let hu; const d = mx - mn;
    if (mx === r) hu = ((g - b) / d) % 6; else if (mx === g) hu = (b - r) / d + 2; else hu = (r - g) / d + 4;
    hu *= 60; if (hu < 0) hu += 360;
    if (hu >= 172 && hu <= 205) return 1;           // permeado / agua de producto cian
    if (hu >= 128 && hu <= 165 && g > 200) return 2; // H2 verde / LED verde
    if (hu >= 292 && hu <= 336) return 3;            // salmuera magenta
    return 0;
  }
  function buildGlow(layers, w, h, k, kinds) {
    const ok = [false, true, true, true]; if (kinds) { ok[1] = ok[2] = ok[3] = false; for (const q of kinds) ok[q] = true; }
    const acc = new Float32Array(w * h * 3), R = 4;
    const ker = []; for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const d = Math.hypot(dx, dy); if (d <= R + 0.3) ker.push([dx, dy, d < 1.6 ? 0.30 : d < 2.8 ? 0.17 : 0.08]); }
    let n = 0;
    for (const L of layers) {
      if (!L) continue;
      const D = L.D;
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const i = y * w + x, u = D[i]; if (!(u >>> 24)) continue;
        const r = u & 255, g = (u >>> 8) & 255, b = (u >>> 16) & 255;
        const e = emissiveOf(r, g, b); if (!e || !ok[e]) continue;
        n++;
        for (const [dx, dy, kk] of ker) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const j = (yy * w + xx) * 3; acc[j] += r * kk; acc[j + 1] += g * kk; acc[j + 2] += b * kk; }
      }
    }
    stats.glowPx = n;
    if (!n) return null;
    const c = makeCanvas(w, h), img = c.g.createImageData(w, h), O = new Uint32Array(img.data.buffer), Am = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const j = i * 3, m = Math.max(acc[j], acc[j + 1], acc[j + 2]); if (m < 18) continue;
      // intensidad en 3 bandas sólidas (sin tramado)
      const lv = m > 150 ? 0.62 : m > 70 ? 0.42 : 0.24, s = lv * k * 255 / m;
      O[i] = ((255 << 24) | (cl8(acc[j + 2] * s) << 16) | (cl8(acc[j + 1] * s) << 8) | cl8(acc[j] * s)) >>> 0;
      Am[i] = 1;
    }
    c.g.putImageData(img, 0, 0);
    return { c, S: spans(Am, w, h) };
  }
  /* ---------- personajes: sombra de contacto, sombra arrojada y luz del lado del sol ----------
     drawChar se llama tal cual (cuadro, parpadeo y fase son del rig); durante esa llamada se intercepta
     el drawImage del sprite y se sustituye por su versión reiluminada (caché por lienzo de sprite y
     orientación), precedida de las sombras en el suelo de apoyo. */
  let CC = null;                 // personaje en curso
  const CHR = { contact: new Map(), rd: null };
  /** Lectura de píxeles por un lienzo de trabajo con willReadFrequently (sin avisos de lectura repetida) */
  function readPixels(img) {
    const w = img.width, h = img.height;
    if (!CHR.rd || CHR.rd.width < w || CHR.rd.height < h) {
      const c = document.createElement('canvas'); c.width = Math.max(w, 160); c.height = Math.max(h, 200);
      c.g = c.getContext('2d', { willReadFrequently: true }); CHR.rd = c;
    }
    const g = CHR.rd.g; g.clearRect(0, 0, w, h); g.drawImage(img, 0, 0);
    return g.getImageData(0, 0, w, h);
  }
  /** Versión del sprite en orientación de pantalla, con gradación del nivel y luz de borde 1 px del sol */
  function litSprite(img, facing) {
    let rec = st.sprites.get(img); if (!rec) { rec = {}; st.sprites.set(img, rec); }
    const key = facing < 0 ? 'l' : 'r'; if (rec[key]) return rec[key];
    const w = img.width, h = img.height, C = st.cfg.char || {};
    const sg = readPixels(img), S = new Uint32Array(sg.data.buffer);
    const c = makeCanvas(w, h), out = c.g.createImageData(w, h), D = new Uint32Array(out.data.buffer);
    if (facing < 0) { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) D[y * w + x] = S[y * w + (w - 1 - x)]; } else D.set(S);
    const grade = st.charGrade, rc = C.rim ? rgb(C.rim) : null, rk = C.rimK || 0, sx = -st.sd;
    const src = new Uint32Array(D), A = (i) => src[i] >>> 24 > 8, Lu = (u) => (0.299 * (u & 255) + 0.587 * ((u >>> 8) & 255) + 0.114 * ((u >>> 16) & 255)) / 255;
    // r3-light: modelado de dos lados (atardecer): el lado del sol se calienta y el lado contrario recibe
    // un multiplicar violeta en 2 escalones planos; el terminador sigue la silueta (extremos de fila ±2)
    const SDc = C.side, WMc = C.warm, rimMix = C.rimMix ?? 0.6;
    let XL = null, XR = null, yTop = h, crownY = -1;
    if (SDc || C.crown) {
      XL = new Int16Array(h).fill(-1); XR = new Int16Array(h).fill(-1);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (A(y * w + x)) { if (XL[y] < 0) XL[y] = x; XR[y] = x; if (y < yTop) yTop = y; }
      const fyS = CHARS[CC.charId].oy ?? 78;
      crownY = yTop + Math.round((Math.min(h, fyS) - yTop) * (C.crownH ?? 0.34));
    }
    const sideCol = SDc ? rgb(SDc.col).map(v => v / 255) : null, warmCol = WMc ? rgb(WMc.col) : null;
    const sideOf = (x, y) => {
      let l = 9999, r = -1;
      for (let k = Math.max(0, y - 2); k <= Math.min(h - 1, y + 2); k++) if (XL[k] >= 0) { if (XL[k] < l) l = XL[k]; if (XR[k] > r) r = XR[k]; }
      const wd = r - l + 1; if (wd < 5) return -1;
      return (sx > 0 ? r - x : x - l) / wd;   // 0 = borde del lado del sol · 1 = borde contrario
    };
    // ¿el vecino hacia (dx,dy) es exterior? (transparente, o contorno oscuro con exterior detrás)
    const outside = (x, y, dx, dy) => {
      const x1 = x + dx, y1 = y + dy; if (x1 < 0 || y1 < 0 || x1 >= w || y1 >= h) return true;
      const j = y1 * w + x1; if (!A(j)) return true;
      if (Lu(src[j]) > 0.22) return false;
      const x2 = x1 + dx, y2 = y1 + dy; return x2 < 0 || y2 < 0 || x2 >= w || y2 >= h || !A(y2 * w + x2);
    };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, u = src[i]; if (!A(i)) continue;
      let r = u & 255, g = (u >>> 8) & 255, b = (u >>> 16) & 255;
      const L0 = Lu(u), emis = emissiveOf(r, g, b) || L0 > 0.92;
      if (grade && L0 > 0.1) { const o = grade(r, g, b, 0); r = o[0]; g = o[1]; b = o[2]; }
      if ((SDc || WMc) && !emis) {
        const v = sideOf(x, y);
        if (v >= 0) {
          if (SDc && v >= (SDc.from ?? 0.5) - (SDc.soft ?? 0.1)) {
            const k = (SDc.k ?? 0.15) * (v >= (SDc.from ?? 0.5) ? 1 : 0.5);
            r *= 1 - k + k * sideCol[0]; g *= 1 - k + k * sideCol[1]; b *= 1 - k + k * sideCol[2];
          } else if (WMc && v < (WMc.to ?? 0.34) && L0 > 0.12) {
            const k = WMc.k ?? 0.1;   // luz cálida (pantalla) en el lado del sol
            r += (255 - r) * k * warmCol[0] / 255; g += (255 - g) * k * warmCol[1] / 255; b += (255 - b) * k * warmCol[2] / 255;
          }
        }
      }
      // r3-light: contorno oscuro del lado del sol (y de la coronilla) → línea de luz cálida de 1 px (selout)
      if (C.rimOutline && rc && L0 <= 0.22) {
        const ex = (dx, dy) => { const x1 = x + dx, y1 = y + dy; return x1 < 0 || y1 < 0 || x1 >= w || y1 >= h || !A(y1 * w + x1); };
        const sOut = ex(sx, 0), tOut = ex(0, -1);
        const k = sOut ? C.rimOutline : tOut ? C.rimOutline * (y <= crownY ? (C.crown ?? 0.5) : (C.top ?? 0.5)) : 0;
        if (k > 0) { r += (rc[0] * 0.92 - r) * k; g += (rc[1] * 0.86 - g) * k; b += (rc[2] * 0.8 - b) * k; }
      }
      if (rc && rk && L0 > 0.22 && L0 < 0.95 && !(emis && L0 > 0.6)) {
        const side = outside(x, y, sx, 0), top = outside(x, y, 0, -1);
        if (side || top) {
          // borde del sol: sube hacia el color de la luz conservando algo del tono del material
          // (r3-light: la coronilla y la coleta llevan el borde casi completo; C.top regula el resto de bordes altos)
          const topK = y <= crownY ? (C.crown ?? 0.5) : (C.top ?? 0.5);
          // con selout el contorno ya lleva la luz: el píxel interior solo se aclara un poco (C.rimInner)
          const inner = C.rimOutline && !((side && (x + sx < 0 || x + sx >= w || !A(y * w + x + sx))) || (top && (y < 1 || !A(i - w)))) ? (C.rimInner ?? 1) : 1;
          const k = rk * inner * (side && top ? 1 : side ? 0.85 : topK);
          const m = Math.max(r, g, b, 1), lift = Math.min(1.5, 235 / m);
          r += (Math.min(255, rc[0] * rimMix + r * lift * (1 - rimMix)) - r) * k; g += (Math.min(255, rc[1] * rimMix + g * lift * (1 - rimMix)) - g) * k; b += (Math.min(255, rc[2] * rimMix + b * lift * (1 - rimMix)) - b) * k;
        }
      }
      D[i] = ((u & 0xff000000) | (cl8(b) << 16) | (cl8(g) << 8) | cl8(r)) >>> 0;
    }
    c.g.putImageData(out, 0, 0);
    // sombra arrojada (proyección de la silueta sobre la banda del suelo, en orientación de pantalla)
    const fx = facing < 0 ? w - 1 - (CHARS[CC.charId].ox ?? 30) : (CHARS[CC.charId].ox ?? 30), fy = CHARS[CC.charId].oy ?? 78;
    rec[key] = { c, cast: castOf(src, w, h, fx, fy), fx, fy };
    return rec[key];
  }
  /** Lienzo de sombra arrojada: cada píxel a altura hh sobre los pies se desplaza dir·hh·len en x
      y sube hh·sq dentro de la banda del suelo; 2 bandas sólidas (cerca / lejos) */
  function castOf(src, w, h, fx, fy) {
    const C = st.cfg.char || {}, len = C.cast || 0, A = C.castA || 0;
    if (!len || !A) return null;
    const dir = st.sd, sq = st.cfg.charSq ?? 0.15, th = 3;
    let maxH = 0;
    for (let y = 0; y < Math.min(h, fy); y++) for (let x = 0; x < w; x++) if (src[y * w + x] >>> 24 > 8) { maxH = Math.max(maxH, fy - y); break; }
    if (!maxH) return null;
    const ext = Math.ceil(maxH * len) + 2, cw = w + ext + 2, chh = Math.ceil(maxH * sq) + th + 3;
    const x0 = dir > 0 ? 0 : -ext;       // columna de lienzo 0 ↔ columna de sprite x0
    const M = new Uint8Array(cw * chh);
    for (let y = 0; y < Math.min(h, fy); y++) for (let x = 0; x < w; x++) {
      if (!(src[y * w + x] >>> 24 > 8)) continue;
      const hh = fy - y, xa = x + dir * hh * len, xb = x + dir * (hh + 1) * len;
      const ya = chh - 1 - Math.round(hh * sq);
      const lo = Math.round(Math.min(xa, xb)), hi = Math.round(Math.max(xa, xb));
      const band = hh < maxH * 0.42 ? 2 : 1;
      for (let X = lo; X <= hi; X++) { const cx = X - x0; if (cx < 0 || cx >= cw) continue; for (let k = 0; k < th; k++) { const cy = ya - k; if (cy < 0) continue; const j = cy * cw + cx; if (M[j] < band) M[j] = band; } }
    }
    const c = makeCanvas(cw, chh), img = c.g.createImageData(cw, chh), O = new Uint32Array(img.data.buffer), col = rgb(C.shadowCol || '#2a1838');
    const near = ((Math.round(A * 255) << 24) | (col[2] << 16) | (col[1] << 8) | col[0]) >>> 0, far = ((Math.round(A * 0.62 * 255) << 24) | (col[2] << 16) | (col[1] << 8) | col[0]) >>> 0;
    for (let i = 0; i < M.length; i++) if (M[i]) O[i] = M[i] === 2 ? near : far;
    c.g.putImageData(img, 0, 0);
    return { c, x0, h: chh, ext };
  }
  /** Sombra de contacto en 2 bandas sólidas (elipse aplastada) */
  function contactOf(rx) {
    const C = st.cfg.char || {}, k = rx + '|' + (C.shadowCol || '') + '|' + (C.shadowA || 0.5);
    let c = CHR.contact.get(k); if (c) return c;
    const w = rx * 2 + 3, hh = 5; c = makeCanvas(w, hh);
    const col = rgb(C.shadowCol || '#2a1838'), a = C.shadowA ?? 0.5;
    for (let y = 0; y < hh; y++) {
      const yy = (y - 2) / 2.4, hw = Math.round((rx + 1.2) * Math.sqrt(Math.max(0, 1 - yy * yy)));
      if (hw <= 0) continue;
      c.g.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${(a * 0.6).toFixed(3)})`; c.g.fillRect(rx + 1 - hw, y, hw * 2 + 1, 1);
      const ih = Math.round(hw * 0.62);
      if (ih > 0 && y >= 1 && y <= 3) { c.g.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${(a * 0.7).toFixed(3)})`; c.g.fillRect(rx + 1 - ih, y, ih * 2 + 1, 1); }
    }
    c.rx = rx; CHR.contact.set(k, c); return c;
  }
  /** Altura de apoyo (mundo) bajo un personaje y tramo continuo para su sombra */
  function supportOf(e) {
    const W_ = e.world; if (!W_) return null;
    const x = e.x, yb = W_.supportAt(x, e.y - 1, e.y + 900, false);
    if (!(yb < W_.h + 40)) return null;
    const wa = W_.waterAt(x, yb - 2); if (wa && wa.y < yb - 3) return null;   // en el agua: sin sombra en el fondo
    let plat = null;
    if (yb < W_.groundAt(x) - 1) for (const p of W_.platforms) { const py = p.y + (p.dy || 0); if (x >= p.x && x <= p.x + p.w && Math.abs(py - yb) < 1.5) { plat = p; break; } }
    return { y: yb, plat };
  }
  function drawShadows(g, img, L, sx0, sy0) {
    const e = CC.e, S = CC.sup; if (!S) return;
    const cam = GameplayScene.cam, gyS = Math.round(S.y - cam.oy), air = Math.max(0, gyS - CC.dy - (CC.lift || 0));
    const W_ = e.world, C = st.cfg.char || {};
    // tramo de suelo continuo: |Δy| ≤ 6 respecto al apoyo; la sombra se corta en bordes de acantilado
    const okAt = (wx) => {
      if (S.plat) return wx >= S.plat.x && wx <= S.plat.x + S.plat.w;
      if (wx < 0 || wx > W_.w) return false;
      return Math.abs(W_.groundAt(wx) - S.y) <= 6;
    };
    const fade = Math.max(0, 1 - air / 70) * (CC.alpha ?? 1);
    if (fade <= 0) return;
    // contacto
    const rx = Math.max(4, Math.round(((img.anchors && img.anchors.shadowR) || CHARS[CC.charId].shadowR || 9) * (1 - Math.min(0.5, air / 80)) * (CC.contactK || 1)));
    // r3-chars: banda de contacto sólida en el tono del suelo (R3CHARS_contactBand, 10_rig.js); si no, la elipse
    if (!(typeof R3CHARS_contactBand === 'function' && R3CHARS_contactBand(g, img, CHARS[CC.charId], CC.dx, gyS, CC.facing, air, (sx) => okAt(Math.round(sx + cam.ox))))) { g.globalAlpha = fade; const sh = contactOf(rx); g.drawImage(sh, CC.dx - rx - 1, gyS - 3); }
    g.globalAlpha = fade;
    // arrojada (por tramos de 16 px que siguen la pendiente del suelo; se corta en huecos y bordes)
    const K = L.cast;
    if (K && !CC.noCast) {
      const dir = st.sd, shift = Math.round(dir * air * (C.cast || 0));
      const cxF = CC.dx - (L.fx - K.x0) + shift, fC = L.fx - K.x0, cw = K.c.width, n = Math.ceil(cw / 16);
      for (let q = 0; q < n; q++) {
        const i = dir > 0 ? q : n - 1 - q, a = i * 16, ww = Math.min(16, cw - a), mid = a + ww / 2;
        const beyond = dir > 0 ? mid > fC : mid < fC, sxp = cxF + a, wxm = Math.round(sxp + mid - a + cam.ox);
        if (!okAt(wxm)) { if (beyond) break; continue; }
        if (sxp + ww < 0 || sxp > W) continue;
        const dy = S.plat ? 0 : Math.round(W_.groundAt(wxm) - S.y);
        g.drawImage(K.c, a, 0, ww, K.h, sxp, gyS - K.h + 1 + dy, ww, K.h);
      }
    }
    g.globalAlpha = 1;
  }
  function charDraw(img, x, y) {
    const di = CC ? CC.di : CanvasRenderingContext2D.prototype.drawImage;
    if (!CC || CC.done || arguments.length !== 3 || !img || !img.anchors) return di.apply(this, arguments);
    CC.done = true;
    const L = litSprite(img, CC.facing);
    const def = CHARS[CC.charId], ox = def.ox ?? 30, oy = def.oy ?? 78;
    const sx0 = CC.facing < 0 ? CC.dx + ox + 1 - img.width : CC.dx - ox, sy0 = CC.dy - oy;
    this.save(); this.setTransform(CC.T);
    try { drawShadows(this, img, L, sx0, sy0); CC.di.call(this, L.c, sx0, sy0); } finally { this.restore(); }
  }
  /** drawChar con la luz del nivel. info: {lift (px que el dibujo flota sobre el ancla), contactK, noCast} */
  function drawCharLit(g, e, charId, anim, time, x, y, facing, opts, info) {
    if (!st.on || !e || e.world !== GameplayScene.world || !CHARS[charId]) { drawChar(g, charId, anim, time, x, y, facing, opts); return false; }
    const own = Object.prototype.hasOwnProperty.call(g, 'drawImage');
    CC = { e, charId, facing: facing < 0 ? -1 : 1, dx: Math.round(x), dy: Math.round(y), T: g.getTransform(), di: g.drawImage, done: false, sup: supportOf(e), lift: info && info.lift, contactK: info && info.contactK, noCast: info && info.noCast, alpha: info && info.alpha };
    g.drawImage = charDraw;
    try { drawChar(g, charId, anim, time, x, y, facing, Object.assign({}, opts, { shadow: false })); }
    finally { if (own) g.drawImage = CC.di; else delete g.drawImage; CC = null; }
    return true;
  }
  /* ---------- interiores: haces de los ventanales, charcos de luz y reflejo en el suelo ----------
     Los ventanales viven en un plano del fondo (B.layers[tag], paralaje f); el haz es rígido con su
     ventanal (no se despega al mover la cámara) y baja hasta el suelo del plano jugable, donde deja
     un charco de luz y un reflejo en el frente del suelo. Lámparas: charco bajo cada halo cálido de
     los kits (PFB.glows / PFDyn.glows) con la lista del cuadro anterior (sin coste de recogida). */
  const IL = { shaft: new Map(), pool: new Map(), lamps: [], lampsNext: [] };
  /** Haz inclinado: arriba w0, abajo w1, alto h, desplazamiento horizontal total s; 4 niveles de alfa */
  function shaftSprite(w0, w1, h, s, col) {
    const k = [w0, w1, h, s, col].join('|'); let c = IL.shaft.get(k); if (c) return c;
    const cw = Math.ceil(Math.max(w0, w1) + Math.abs(s)) + 2, x0 = s < 0 ? -s : 0, [r, g, b] = hexToRgb(col);
    c = makeCanvas(cw, h); const img = c.g.createImageData(cw, h), D = new Uint32Array(img.data.buffer);
    for (let y = 0; y < h; y++) {
      const v = y / Math.max(1, h - 1), bw = w0 + (w1 - w0) * v, cx = x0 + s * v + (Math.max(w0, w1) - bw) / 2;
      // entra desde el vano (2 bandas de fundido arriba) y se apaga al bajar
      const fall = v < 0.04 ? 0.3 : v < 0.09 ? 0.62 : v < 0.25 ? 1 : v < 0.55 ? 0.8 : v < 0.8 ? 0.62 : 0.48;
      for (let x = 0; x < cw; x++) {
        const d = (x - cx) / bw; if (d < 0 || d > 1) continue;
        const e = Math.min(d, 1 - d) * 2, lv = e < 0.1 ? 0.18 : e < 0.24 ? 0.42 : e < 0.5 ? 0.72 : 1;
        // listón más claro en el centro de cada haz (vidriera): rayos legibles sin tramado
        const core = Math.abs(d - 0.5) < 0.08 ? 1.25 : 1;
        D[y * cw + x] = ((Math.round(Math.min(1, lv * fall * core) * 255) << 24) | (b << 16) | (g << 8) | r) >>> 0;
      }
    }
    c.g.putImageData(img, 0, 0); c.x0 = x0; IL.shaft.set(k, c); return c;
  }
  /** Charco de luz en la cara superior del suelo (band px) + reflejo en el frente (refl px), 3 bandas */
  function poolSprite(w, band, refl, col) {
    const k = [w, band, refl, col].join('|'); let c = IL.pool.get(k); if (c) return c;
    const h = band + refl + 1, [r, g, b] = hexToRgb(col); c = makeCanvas(w, h);
    const img = c.g.createImageData(w, h), D = new Uint32Array(img.data.buffer);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const u = (x - w / 2) / (w / 2);
      let a;
      if (y <= band) { const v = (band - y) / Math.max(1, band), d = Math.hypot(u, v * 0.9); a = d < 0.5 ? 1 : d < 0.78 ? 0.62 : d < 1 ? 0.3 : 0; }
      else { const q = (y - band) / refl, d = Math.abs(u); a = d < 0.42 ? 0.55 * (1 - q) : d < 0.7 ? 0.28 * (1 - q) : 0; if ((y - band) & 1) a *= 0.6; }
      if (a > 0) D[y * w + x] = ((Math.round(a * 255) << 24) | (b << 16) | (g << 8) | r) >>> 0;
    }
    c.g.putImageData(img, 0, 0); c.band = band; IL.pool.set(k, c); return c;
  }
  function shaftList(sc) {
    const S = st.cfg.shafts; if (!S) return null;
    if (S.on && !S.on(sc)) return null;
    const B = sc.backdrop; let L = null;
    for (const l of (B && B.layers) || []) if (l.tag === S.layer) { L = l; break; }
    if (!L) return null;
    const [ox, oy] = B.vofs(L, sc.cam), out = [];
    const cam = sc.cam, W_ = sc.world;
    // fuente de luz tras los vanos (p. ej. la boca del túnel en un plano lejano): solo los vanos que la
    // dejan ver emiten haz, con intensidad proporcional a la parte del vano que ocupa
    let src = null;
    if (S.src) for (const l of B.layers) if (l.tag === S.src.layer) { const so = B.vofs(l, sc.cam)[0]; src = [S.src.x0 + so, S.src.x1 + so]; break; }
    for (let x = S.x0; x < (L.c ? L.c.width : W_.w) + S.step; x += S.step) {
      const sx = x + ox; if (sx > W + 140 || sx + S.w < -140) continue;
      let k = 1;
      if (src) { const ov = Math.min(sx + S.w, src[1]) - Math.max(sx, src[0]); k = Math.min(1, Math.max(0, ov / S.w) * (S.src.gain ?? 1.4)); if (k < 0.08) continue; }
      const top = Math.round(S.y0 + (S.y1 - S.y0) * (S.from ?? 0.35) + oy);
      const w0 = Math.round(S.w * (S.wTop ?? 0.62)), w1 = Math.round(S.w * (S.wBot ?? 0.92));
      // suelo bajo el centro del pie del haz (se itera una vez: el suelo de interiores es casi plano)
      const sl = S.slant * st.sd;
      let bx = sx + S.w / 2 + sl * 140;
      let fy = Math.round(W_.groundAt(clamp(Math.round(bx + cam.ox), 0, W_.w)) - cam.oy);
      const h = Math.max(20, (fy - top + 3) & ~3), s = Math.round(sl * h);
      bx = sx + (S.w - w0) / 2 + s + w1 / 2 - (Math.max(w0, w1) - w1) / 2;
      fy = Math.round(W_.groundAt(clamp(Math.round(bx + cam.ox), 0, W_.w)) - cam.oy);
      out.push({ sx: Math.round(sx + (S.w - Math.max(w0, w1)) / 2), top, w0, w1, h, s, bx: Math.round(bx), fy, k });
    }
    return out;
  }
  /** Volumen del haz: luz suave (aclara y calienta sin lavar el color) + núcleo aditivo tenue */
  function drawShafts(g, S, list, t) {
    const pk = 0.9 + 0.1 * Math.sin(t * 0.37);
    for (const q of list) {
      const c = shaftSprite(q.w0, q.w1, q.h, q.s, S.col);
      g.globalCompositeOperation = 'soft-light'; g.globalAlpha = Math.min(1, (S.soft ?? 0.9) * pk * q.k); g.drawImage(c, q.sx - c.x0, q.top);
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, (S.a ?? 0.16) * pk * q.k); g.drawImage(c, q.sx - c.x0, q.top);
    }
  }
  /** Antes de los personajes: charcos de luz de ventanales y lámparas sobre el suelo */
  function floorLights(g, sc) {
    if (!st.on) return;
    const S = st.cfg.shafts, t = Game.time;
    g.globalCompositeOperation = 'lighter';
    const list = S ? shaftList(sc) : null;
    if (list) {
      const P = S.pool || {}, col = P.col || S.col;
      const a0 = Math.min(1, (P.a ?? 0.5) * (0.92 + 0.08 * Math.sin(t * 0.5)));
      for (const q of list) { const pw = Math.round(q.w1 * (P.wk ?? 1.25)), c = poolSprite(pw, P.band ?? 10, P.refl ?? 8, col); g.globalAlpha = a0 * q.k; g.drawImage(c, q.bx - (pw >> 1), q.fy - c.band); }
      // el volumen del haz va detrás de los personajes (no vela caras ni bocadillos); las motas, delante
      if (S.behind !== false) drawShafts(g, S, list, t);
      g.globalCompositeOperation = 'lighter';
    }
    if (st.cfg.lampPools) {
      const W_ = sc.world, LP = st.cfg.lampPools;
      g.globalAlpha = LP.a ?? 0.4;
      for (const [x, gy, col, r] of IL.lamps) { const pw = Math.round(r * (LP.wk ?? 5)), c = poolSprite(pw, LP.band ?? 8, LP.refl ?? 5, col); g.drawImage(c, Math.round(x - sc.cam.ox) - (pw >> 1), Math.round(gy - sc.cam.oy) - c.band); }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  /** Delante de los personajes: haces volumétricos de los ventanales y halo de los arcos eléctricos */
  function airLights(g, sc) {
    IL.lamps = IL.lampsNext; IL.lampsNext = [];
    if (!st.on) return;
    const S = st.cfg.shafts, t = Game.time;
    g.globalCompositeOperation = 'lighter';
    const list = S ? shaftList(sc) : null;
    if (list) {
      if (S.behind === false) drawShafts(g, S, list, t);
      g.globalCompositeOperation = 'lighter';
      // motas de polvo en suspensión dentro de los haces (1 px, deriva lenta)
      if (S.motes !== false) {
        g.fillStyle = S.moteCol || '#fff8e8';
        for (let i = 0; i < list.length; i++) {
          const q = list[i];
          for (let k = 0; k < 7; k++) {
            const ph = (t * (0.05 + k * 0.011) + k * 0.137 + i * 0.31) % 1, v = ph, bw = q.w0 + (q.w1 - q.w0) * v;
            const x = q.sx + q.s * v + (Math.max(q.w0, q.w1) - bw) / 2 + bw * ((k * 0.383 + i * 0.17 + Math.sin(t * 0.7 + k) * 0.05) % 1);
            g.globalAlpha = 0.5 * Math.sin(ph * Math.PI) * q.k;
            g.fillRect(Math.round(x), Math.round(q.top + q.h * v), 1, 1);
          }
        }
      }
    }
    // arcos eléctricos: halo vertical parpadeante + charco cian en su base (world.hazards con potencia)
    const A = st.cfg.arcs;
    if (A) {
      const W_ = sc.world, cam = sc.cam;
      for (const hz of W_.hazards) {
        if (!hz.on || !hz.power) continue;
        const sx = Math.round(hz.x - cam.ox); if (sx < -30 || sx > W + 30) continue;
        const top = Math.round(A.top - cam.oy), bot = Math.round(W_.groundAt(hz.x + (hz.w >> 1)) - cam.oy), fl = 0.6 + 0.4 * Math.abs(Math.sin(t * 31 + hz.x));
        const p = R2LIGHT_GLOW.profile(A.col, true);
        g.globalAlpha = Math.min(1, (A.a ?? 0.9) * fl);
        g.drawImage(p, 0, 0, p.width, 1, sx + (hz.w >> 1) - p.R, top, p.width, bot - top);
        g.drawImage(p, 0, 0, p.width, 1, sx + (hz.w >> 1) - p.R - 4, top + 6, p.width + 8, bot - top - 6);
        const pw = 54, c = poolSprite(pw, 9, 6, A.col); g.globalAlpha = Math.min(1, 0.8 * fl); g.drawImage(c, sx + (hz.w >> 1) - (pw >> 1), bot - c.band);
        // destello en los dos electrodos (halo en anillos cacheado) y luz reflejada en los armarios vecinos
        const sp = PFK.glow(10, '#e8fbff', 4, 0.6), wide = PFK.glow(26, A.col, 4, 0.35);
        g.globalAlpha = Math.min(1, 0.9 * fl);
        g.drawImage(sp, sx + 5 - 10, top + 2 - 10); g.drawImage(sp, sx + hz.w - 6 - 10, bot - 3 - 10);
        g.globalAlpha = Math.min(1, 0.55 * fl); g.drawImage(wide, sx + (hz.w >> 1) - 26, Math.round((top + bot) / 2) - 26);
      }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  /** Registro de halos cálidos de lámparas (lo llaman los ganchos de PFB.glows / PFDyn.glows) */
  function lampAt(sc, x, y, col, r) {
    if (!st.on || !st.cfg.lampPools || sc !== GameplayScene || r < 7) return;
    const gy = sc.world.groundAt(clamp(Math.round(x), 0, sc.world.w)), d = gy - y;
    if (d < 12 || d > (st.cfg.lampPools.reach ?? 150)) return;
    const sx = x - sc.cam.ox; if (sx < -80 || sx > W + 80) return;
    if (IL.lampsNext.length < 24) IL.lampsNext.push([x, gy, col, r]);
  }
  /* ---------- planos del fondo por franjas (≤ 2 pasadas a pantalla completa) ----------
     Durante B.render se interceptan los blits de lienzos ≥ 600×300 (planos de paralaje y capas
     aditivas de haces): si su contenido opaco cubre < 80 % del lienzo, se dibujan por franjas
     recortadas a ese contenido (mismo resultado de píxel, mismo modo y alfa). El cielo y los muros
     macizos siguen siendo un único blit. */
  const BK = new WeakMap();
  function backSpans(img) {
    let r = BK.get(img); if (r !== undefined) return r;
    const w = img.width, h = img.height, c = document.createElement('canvas'); c.width = w; c.height = h;
    const gg = c.getContext('2d', { willReadFrequently: true }); gg.drawImage(img, 0, 0);
    const d = gg.getImageData(0, 0, w, h).data, A = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) if (d[i * 4 + 3] > 0) A[i] = 1;
    // franjas de 64 px; si el contenido no baja del 80 %, se prueba con franjas más finas (32, 16 px y
    // huecos ≤ 4 filas): las capas aditivas de haces inclinados quedan por debajo del 80 % a 16–32 px
    r = null;
    for (const [sw, gp] of [[64, 24], [32, 4], [16, 4]]) {
      const S = spans(A, w, h, sw, gp); let area = 0;
      for (let i = 0; i < S.length; i++) for (const [a, b] of S[i]) area += (b - a) * Math.min(sw, w - i * sw);
      if (area / (w * h) < 0.8) { r = S; break; }
    }
    BK.set(img, r); return r;
  }
  let BKdi = null;
  function backDraw(img, x, y) {
    if (arguments.length === 3 && img && img.width >= 600 && img.height >= 300 && img.getContext) {
      const S = backSpans(img);
      if (S) { const di = this.drawImage; this.drawImage = BKdi; try { blitSpans(this, img, S, -x, -y); } finally { this.drawImage = di; } return; }
    }
    return BKdi.apply(this, arguments);
  }
  function backdrop(g, sc, camI, which) {
    const B = sc.backdrop; if (!B) return;
    if (!st.on) { B.render(g, camI, which); return; }
    const own = Object.prototype.hasOwnProperty.call(g, 'drawImage'), prev = BKdi;
    BKdi = g.drawImage; g.drawImage = backDraw;
    try { B.render(g, camI, which); } finally { if (own) g.drawImage = BKdi; else delete g.drawImage; BKdi = prev; }
  }
  /* ---------- preparación del nivel ---------- */
  function prepare(sc) {
    st.on = false; st.layers = {}; st.glow = null; st.sprites = new WeakMap(); st.casts = new WeakMap();
    if (!enabled(sc)) return;
    const t0 = nowMs(), C = cfg(sc.levelId), B = sc.backdrop, world = sc.world;
    st.cfg = C; st.on = true;
    // dirección de la sombra: opuesta al sol del fondo (en pantalla); sol cenital → sombras cortas a la derecha
    const sun = (B && B.sun) || null;
    st.sd = C.sd ?? (sun ? (sun.x > W / 2 + 30 ? -1 : 1) : 1);
    st.band = C.band ?? 12;
    st.charGrade = compileGrade(C.char);
    CHR.contact.clear();
    // ambiente de la luz de borde del rig
    // r3-light: C.charEnv sustituye al ambiente del rig (p. ej. 'none' al ocaso: sin contraluz fijo en la espalda; la luz
    // de borde la pone litSprite del lado del sol)
    if (typeof SpriteCache !== 'undefined') { st.env0 = SpriteCache.env; const ev = C.charEnv || C.env; if (ev) { SpriteCache.env = ev; st.envSet = true; } else st.envSet = false; }
    // capas estáticas: reiluminar y recortar
    const L = {};
    for (const [key, role] of [['propsC', 'props'], ['terrainC', 'terrain'], ['propsFrontC', 'front']]) {
      const c = sc[key]; if (!c) continue;
      L[key] = relight(c, world, C, role, st.sd); L[key].w = c.width; L[key].h = c.height;
    }
    castShadows(L.propsC, L.terrainC, world, C, st.sd, st.band);
    pools(L.propsC, L.terrainC, world, C.pools, st.band);
    for (const key in L) { const X = L[key]; X.g.putImageData(X.img, 0, 0); st.layers[key] = { c: sc[key], S: spans(X.A, X.w, X.h) }; }
    // halo de emisivos estáticos
    const ref = L.propsC || L.terrainC;
    if (ref && C.glow && !(C.glowKinds && !C.glowKinds.length)) st.glow = buildGlow([L.propsC, L.propsFrontC], ref.w, ref.h, Math.min(1, 0.55 * C.glow), C.glowKinds);
    stats.prepMs = Math.round(nowMs() - t0);
  }
  function release(sc) {
    if (st.envSet && typeof SpriteCache !== 'undefined') SpriteCache.env = st.env0;
    st.envSet = false; st.on = false; st.layers = {}; st.glow = null;
  }
  const on = (sc) => st.on && sc === GameplayScene;
  /** Capa estática del mundo por franjas recortadas (sustituye al blit de 640×360) */
  function blit(g, sc, key) {
    const c = sc[key]; if (!c) return;
    const Lr = st.on && st.layers[key];
    if (!Lr || Lr.c !== c) { g.drawImage(c, sc.cam.ox, sc.cam.oy, W, H, 0, 0, W, H); return; }
    blitSpans(g, c, Lr.S, sc.cam.ox, sc.cam.oy);
  }
  function glowLayer(g, sc) {
    if (!st.on || !st.glow) return;
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.88 + 0.12 * Math.sin(Game.time * 1.7);
    blitSpans(g, st.glow.c, st.glow.S, sc.cam.ox, sc.cam.oy);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  return { cfg, prepare, release, on, blit, glowLayer, drawChar: drawCharLit, floorLights, airLights, lampAt, backdrop, stats, _st: st, _il: IL, _compileGrade: compileGrade, _spans: spans, _blitSpans: blitSpans };
})();
/** Envoltorio global para 30_world.js: personaje con sombras y luz del nivel (cae a drawChar sin r2-light) */
function R2LIGHT_drawChar(g, e, charId, anim, time, x, y, facing, opts, info) {
  return R2LIGHT.drawChar(g, e, charId, anim, time, x, y, facing, opts || {}, info);
}

/* =====================================================================
   R2LIGHT_GLOW — halos aditivos cacheados para emisivos dinámicos.
   Se engancha de forma genérica a los kits que los niveles ya usan, sin
   tocar sus ficheros: tras dibujar, añade el halo de su emisivo.
   · PFInfra.drawFlows / PFDyn.flowsImg: halo a lo largo de cada tramo
     visible por tipo de fluido (permeado/UPW cian, salmuera magenta,
     H2 verde, energía amarillo; agua de mar y pretratada tenue).
     1 drawImage por tramo (perfil de 1 px estirado → bandas sólidas).
   · PFInfra.drawLeds: halo de 4 px en cada LED encendido.
   · PFB.screens: resplandor rectangular de la pantalla (caché w×h×color).
   · R2PLANT.drawOutfall: halo de la pluma de salmuera (tira desenfocada
     en 3 bandas, mismo cuadro que la pluma).
   Solo actúa en el plano jugable con r2-light activo (R2LIGHT.on).
   ===================================================================== */
const R2LIGHT_GLOW = (() => {
  const KIND = {
    product: ['#48d4f0', 1], perm: ['#48d4f0', 1], upw: ['#7ff0ff', 1], water: ['#48d4f0', 0.8],
    brine: ['#ff5ad8', 0.75], h2: ['#3fe0a0', 1], power: ['#ffd84a', 0.9], elec: ['#ffd84a', 0.9],
    sea: ['#11bedd', 0.3], cool: ['#56e5ff', 0.5], irrig: ['#6cf0db', 0.45],
  };
  const prof = new Map(), led = new Map(), scr = new Map();
  const live = (sc) => typeof R2LIGHT !== 'undefined' && sc && R2LIGHT.on(sc) && R2LIGHT._st.cfg && R2LIGHT._st.cfg.glow;
  const gk = () => R2LIGHT._st.cfg.glow || 1;
  /** Perfil transversal del halo de una tubería: 1×(2R+1) (o (2R+1)×1), 4 bandas sólidas */
  function profile(col, vert) {
    const k = col + (vert ? 'v' : 'h'); let c = prof.get(k); if (c) return c;
    const R = 7, n = 2 * R + 1, [r, g, b] = hexToRgb(col);
    c = vert ? makeCanvas(n, 1) : makeCanvas(1, n);
    for (let i = 0; i < n; i++) {
      const d = Math.abs(i - R), a = d <= 1 ? 0.1 : d <= 3 ? 0.15 : d <= 5 ? 0.2 : d <= 6 ? 0.1 : 0.05;
      c.g.fillStyle = `rgba(${r},${g},${b},${a})`;
      if (vert) c.g.fillRect(i, 0, 1, 1); else c.g.fillRect(0, i, 1, 1);
    }
    c.R = R; prof.set(k, c); return c;
  }
  function runs(g, sc, list) {
    if (!live(sc) || !list || !list.length) return;
    const ox = sc.cam.ox, oy = sc.cam.oy, t = Game.time, K0 = gk();
    g.globalCompositeOperation = 'lighter';
    for (const run of list) {
      const K = KIND[run.kind]; if (!K) continue;
      const rate = typeof run.rate === 'function' ? run.rate(sc) : (run.rate ?? 1);
      if (rate <= 0) continue;
      const a = K[1] * K0 * (0.55 + 0.45 * Math.min(1, rate)) * (0.8 + 0.2 * Math.sin(t * 2.4 + (run.pts[0][0] || 0) * 0.013));
      g.globalAlpha = Math.min(1, a);
      for (let i = 0; i < run.pts.length - 1; i++) {
        const [x0, y0] = run.pts[i], [x1, y1] = run.pts[i + 1];
        const xa = Math.min(x0, x1) - ox, xb = Math.max(x0, x1) - ox, ya = Math.min(y0, y1) - oy, yb = Math.max(y0, y1) - oy;
        if (xb < -10 || xa > W + 10 || yb < -10 || ya > H + 10) continue;
        if (y0 === y1) { const p = profile(K[0], false), A = Math.max(-8, Math.round(xa)), B = Math.min(W + 8, Math.round(xb) + 1); if (B > A) g.drawImage(p, 0, 0, 1, p.height, A, Math.round(ya) - p.R, B - A, p.height); }
        else if (x0 === x1) { const p = profile(K[0], true), A = Math.max(-8, Math.round(ya)), B = Math.min(H + 8, Math.round(yb) + 1); if (B > A) g.drawImage(p, 0, 0, p.width, 1, Math.round(xa) - p.R, A, p.width, B - A); }
      }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  function leds(g, sc, list) {
    if (!live(sc) || !list || !list.length) return;
    const ox = sc.cam.ox, oy = sc.cam.oy, t = Game.time, k = Math.min(1, 0.7 * gk());
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = k;
    for (const L of list) {
      const x = L.x - ox, y = L.y - oy; if (x < -6 || x > W + 6 || y < -6 || y > H + 6) continue;
      if (Math.sin((t * (L.hz || 1.5) + (L.ph || 0)) * TAU) <= -0.2) continue;
      let c = led.get(L.col); if (!c) { c = PFK.glow(4, L.col, 3, 0.55); led.set(L.col, c); }
      g.drawImage(c, Math.round(x) - 4, Math.round(y) - 4);
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  /** Resplandor de pantalla: dentro 0,12 · borde 1–2 px 0,24 · 3–4 px 0,12 · 5–6 px 0,05 */
  function screenGlow(w, h, col) {
    const k = w + 'x' + h + col; let c = scr.get(k); if (c) return c;
    const P = 6, cw = w + 2 * P, ch = h + 2 * P, [r, g, b] = hexToRgb(col);
    c = makeCanvas(cw, ch); const img = c.g.createImageData(cw, ch), D = img.data;
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const dx = Math.max(P - x, x - (P + w - 1), 0), dy = Math.max(P - y, y - (P + h - 1), 0), d = Math.max(dx, dy) + Math.min(dx, dy) * 0.5;
      const a = d === 0 ? 0.12 : d <= 2 ? 0.24 : d <= 4 ? 0.12 : d <= 6 ? 0.05 : 0;
      const i = (y * cw + x) * 4; D[i] = r; D[i + 1] = g; D[i + 2] = b; D[i + 3] = Math.round(a * 255);
    }
    c.g.putImageData(img, 0, 0); c.P = P; scr.set(k, c); return c;
  }
  function screens(g, sc, list) {
    if (!live(sc) || !list || !list.length) return;
    const ox = sc.cam.ox, oy = sc.cam.oy, k = Math.min(1, 0.75 * gk());
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = k;
    for (const S of list) {
      const x = Math.round(S.x - ox), y = Math.round(S.y - oy);
      if (x > W + 6 || x + S.w < -6 || y > H + 6 || y + S.h < -6) continue;
      if (S.on && !S.on(sc)) continue;
      const col = typeof S.col === 'function' ? S.col(sc) : (S.col || '#56e5ff');
      const c = screenGlow(S.w, S.h, col);
      g.drawImage(c, x - c.P, y - c.P);
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  /** Tira de pluma desenfocada (radio 3) en 3 bandas sólidas, magenta */
  function plumeGlow(strip) {
    if (strip._r2g !== undefined) return strip._r2g;
    const w = strip.c.width, h = strip.c.height, R = 3, n = strip.n, fw = strip.w;
    const rd = document.createElement('canvas'); rd.width = w; rd.height = h;
    const rg = rd.getContext('2d', { willReadFrequently: true }); rg.drawImage(strip.c, 0, 0);
    const src = rg.getImageData(0, 0, w, h).data, A = new Float32Array(w * h), tmp = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) A[i] = src[i * 4 + 3] / 255;
    // desenfoque de caja separable dentro de cada cuadro (no se mezclan cuadros vecinos)
    for (let f = 0; f < n; f++) for (let y = 0; y < h; y++) for (let x = 0; x < fw; x++) {
      let s = 0; for (let k = -R; k <= R; k++) { const xx = x + k; if (xx >= 0 && xx < fw) s += A[y * w + f * fw + xx]; }
      tmp[y * w + f * fw + x] = s / (2 * R + 1);
    }
    const out = makeCanvas(w, h), img = out.g.createImageData(w, h), D = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let s = 0; for (let k = -R; k <= R; k++) { const yy = y + k; if (yy >= 0 && yy < h) s += tmp[yy * w + x]; }
      const v = s / (2 * R + 1), a = v > 0.45 ? 0.3 : v > 0.2 ? 0.2 : v > 0.06 ? 0.1 : 0;
      if (a) { const i = (y * w + x) * 4; D[i] = 255; D[i + 1] = 90; D[i + 2] = 216; D[i + 3] = Math.round(a * 255); }
    }
    out.g.putImageData(img, 0, 0);
    return (strip._r2g = { c: out, n, w: fw, h: strip.h });
  }
  function outfall(g, O, ox, oy, t, o) {
    if (!O || !O.strip || (o && o.plume === false) || !live(GameplayScene)) return;
    const sx = O.x - ox; if (sx > W + 160 || sx + O.c.width < -160) return;
    const G = plumeGlow(O.strip); if (!G) return;
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, (o && o.a != null ? o.a : 1) * 0.8 * gk());
    PFK.drawStrip(g, G, Math.floor(t * 6.6), Math.round(O.mouth.x - ox - (O.dir < 0 ? G.w : 0)), Math.round(O.mouth.y - oy - 1), O.dir < 0);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  /* ---------- instalación de los ganchos (una vez, al cargar) ---------- */
  function wrap(obj, name, after) {
    if (!obj || typeof obj[name] !== 'function' || obj[name]._r2g) return;
    const f = obj[name], w = function () { const r = f.apply(this, arguments); try { after.apply(this, arguments); } catch (e) { /* el halo nunca rompe el cuadro */ } return r; };
    w._r2g = true; obj[name] = w;
  }
  if (typeof PFInfra !== 'undefined') { wrap(PFInfra, 'drawFlows', (g, sc, rs) => runs(g, sc, rs)); wrap(PFInfra, 'drawLeds', (g, sc, l) => leds(g, sc, l)); }
  if (typeof PFDyn !== 'undefined') wrap(PFDyn, 'flowsImg', (g, sc, rs) => runs(g, sc, rs));
  if (typeof PFB !== 'undefined') wrap(PFB, 'screens', (g, sc, l) => screens(g, sc, l));
  if (typeof R2PLANT !== 'undefined') wrap(R2PLANT, 'drawOutfall', (g, O, ox, oy, t, o) => outfall(g, O, ox, oy, t, o));
  // lámparas: charco de luz en el suelo bajo cada halo grande (lo dibuja R2LIGHT.floorLights)
  if (typeof PFB !== 'undefined') wrap(PFB, 'glows', (g, sc, list) => {
    if (!live(sc) || !list) return;
    for (const L of list) { if (L.mode === 'blink' || (L.on && !L.on(sc))) continue; R2LIGHT.lampAt(sc, L.x, L.y, typeof L.col === 'function' ? L.col(sc) : L.col, L.r || 6); }
  });
  if (typeof PFDyn !== 'undefined') {
    wrap(PFDyn, 'glows', (g, cam, list, col = '#ffd890', r = 8) => { const sc = GameplayScene; if (!live(sc) || !list) return; for (const p of list) R2LIGHT.lampAt(sc, p[0], p[1], p[2] || col, p[3] || r); });
    wrap(PFDyn, 'wallLamps', (g, sc) => { if (!live(sc) || !sc.world.pfLamps) return; for (const [x, y] of sc.world.pfLamps) R2LIGHT.lampAt(sc, x, y, '#ffd890', 9); });
  }
  return { runs, leds, screens, outfall, profile, KIND };
})();
