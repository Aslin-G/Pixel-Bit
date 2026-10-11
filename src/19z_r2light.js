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
    grade: { shade: '#2a1c5a', shadeK: 0.07, vgrad: [0.02, -0.04] },
    rim: { col: '#fbc371', k: 0.42, side: 0.75, terrain: 0.45 },
    cast: { col: '#8a4a5a', a: 0.4, len: 0.6, maxLen: 30, hMax: 34 },
    char: { rim: '#fff0c8', rimK: 0.55, shadowCol: '#2a1838', shadowA: 0.5, cast: 0.5, castA: 0.26 },
    glow: 1,
  },
  dusk: {
    grade: { map: ['#1c0f3a', '#4a2462', '#8e4a78', '#d27a78', '#ffb27a', '#ffe0b0'], mapK: 0.42, shade: '#3a1d62', shadeK: 0.2, sat: 1.12, vgrad: [0.04, -0.10] },
    rim: { col: '#ffb070', k: 0.62, side: 1, terrain: 0.6 },
    cast: { col: '#4a2a7a', a: 0.5, len: 1.7, maxLen: 110, hMax: 64, lit: '#ffa860', litK: 0.22 },
    char: { mul: '#ffdccc', mulK: 0.3, shade: '#3a1d62', shadeK: 0.22, lift: '#ffc090', liftK: 0.22, rim: '#ffc27a', rimK: 0.85, shadowCol: '#2a1040', shadowA: 0.55, cast: 1.6, castA: 0.32 },
    glow: 1.3,
  },
  storm: {
    grade: { shade: '#3a1a14', shadeK: 0.22, lift: '#ffd8a0', liftK: 0.14, vgrad: [0.04, -0.08] },
    rim: { col: '#ffa060', k: 0.4, side: 0.8, terrain: 0.4 },
    cast: null,
    char: { lift: '#ffd0a0', liftK: 0.12, rim: '#ffb070', rimK: 0.6, shadowCol: '#2a140c', shadowA: 0.5, cast: 0, castA: 0 },
    glow: 1.6,
  },
  interior: {
    grade: { mul: '#e4ecff', mulK: 0.14, shade: '#121c48', shadeK: 0.3, lift: '#fff4dc', liftK: 0.06, vgrad: [0.0, -0.06] },
    rim: { col: '#c8e8ff', k: 0.3, side: 0.6, terrain: 0.3 },
    cast: { col: '#202a5a', a: 0.3, len: 0.22, maxLen: 30 },
    char: { shade: '#121c48', shadeK: 0.12, rim: '#d0f0ff', rimK: 0.5, shadowCol: '#0e1230', shadowA: 0.55, cast: 0.18, castA: 0.24 },
    glow: 1.35,
  },
};

/* ---------- datos por nivel (sobrescriben el preajuste) ---------- */
const R2LIGHT_CFG = {
  0: { tod: 'day' },
  1: { tod: 'day' },
  2: { tod: 'interior', env: 'tech' },
  3: { tod: 'dusk', env: 'dusk' },
  4: { tod: 'day', cast: { col: '#4a2a6a', a: 0.36, len: 0.3, maxLen: 40 } },
  5: { tod: 'day' },
  6: { tod: 'interior', env: 'tech' },
  7: { tod: 'dusk', env: 'dusk', grade: { map: ['#140f3a', '#36285e', '#6e4a82', '#c27488', '#ffae86', '#ffe2c0'], mapK: 0.38, shade: '#2a1e5e', shadeK: 0.2, sat: 1.08, vgrad: [0.04, -0.10] } },
  8: { tod: 'day' },
  9: { tod: 'interior', env: 'dusk', grade: { mul: '#ffe0d4', mulK: 0.2, shade: '#2a1a50', shadeK: 0.3, lift: '#ffc898', liftK: 0.16, vgrad: [0.0, -0.06] }, rim: { col: '#ffb880', k: 0.36, side: 0.8, terrain: 0.3 }, char: { mul: '#ffe2d6', mulK: 0.18, shade: '#2a1a50', shadeK: 0.14, lift: '#ffc898', liftK: 0.14, rim: '#ffc890', rimK: 0.7, shadowCol: '#1a0e30', shadowA: 0.55, cast: 0.4, castA: 0.26 } },
  10: { tod: 'storm', env: 'calima' },
  11: { tod: 'dusk', env: 'dusk', grade: { map: ['#1e1034', '#4e2a5a', '#9a5a6a', '#e09068', '#ffc470', '#ffecb8'], mapK: 0.36, shade: '#3a1e58', shadeK: 0.18, sat: 1.08, vgrad: [0.04, -0.08] }, rim: { col: '#ffc070', k: 0.6, side: 1, terrain: 0.55 }, cast: { col: '#4a2a72', a: 0.46, len: 1.5, maxLen: 100, hMax: 60, lit: '#ffb860', litK: 0.2 } },
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
    const sat = G.sat || 1;
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
  function spans(A, w, h) {
    const out = [];
    for (let x0 = 0; x0 < w; x0 += SW) {
      const x1 = Math.min(w, x0 + SW), rows = new Uint8Array(h);
      for (let y = 0; y < h; y++) { const o = y * w; for (let x = x0; x < x1; x++) if (A[o + x]) { rows[y] = 1; break; } }
      const list = [];
      let y = 0;
      while (y < h) {
        while (y < h && !rows[y]) y++;
        if (y >= h) break;
        let ya = y, gap = 0, yb = y;
        while (y < h) { if (rows[y]) { yb = y; gap = 0; } else if (++gap > 24) break; y++; }
        list.push([ya, yb + 1]);
      }
      out.push(list);
    }
    return out;
  }
  function blitSpans(g, c, S, ox, oy, op) {
    ox = Math.round(ox); oy = Math.round(oy);
    const i0 = Math.max(0, Math.floor(ox / SW)), i1 = Math.min(S.length - 1, Math.floor((ox + W - 1) / SW));
    for (let i = i0; i <= i1; i++) {
      const sx0 = Math.max(ox, i * SW), sx1 = Math.min(ox + W, i * SW + SW, c.width);
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
  function buildGlow(layers, w, h, k) {
    const acc = new Float32Array(w * h * 3), R = 4;
    const ker = []; for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const d = Math.hypot(dx, dy); if (d <= R + 0.3) ker.push([dx, dy, d < 1.6 ? 0.30 : d < 2.8 ? 0.17 : 0.08]); }
    let n = 0;
    for (const L of layers) {
      if (!L) continue;
      const D = L.D;
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const i = y * w + x, u = D[i]; if (!(u >>> 24)) continue;
        const r = u & 255, g = (u >>> 8) & 255, b = (u >>> 16) & 255;
        const e = emissiveOf(r, g, b); if (!e) continue;
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
    // ambiente de la luz de borde del rig
    if (typeof SpriteCache !== 'undefined') { st.env0 = SpriteCache.env; if (C.env) { SpriteCache.env = C.env; st.envSet = true; } else st.envSet = false; }
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
    if (ref && C.glow) st.glow = buildGlow([L.propsC, L.propsFrontC], ref.w, ref.h, Math.min(1, 0.55 * C.glow));
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
  return { cfg, prepare, release, on, blit, glowLayer, stats, _st: st, _compileGrade: compileGrade, _spans: spans, _blitSpans: blitSpans };
})();
