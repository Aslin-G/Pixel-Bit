/* =====================================================================
   17l_vista_cliffs.js — Acantilados marinos y viento del panorama (VISTA):
   paredes verticales con estratos y fisuras (cara iluminada / en sombra),
   remate de pradera con labio que sobresale, derrubios y espuma al pie;
   hierba peinada por el viento, matas floridas rosas, mástil
   meteorológico; dinámicos: líneas de viento, rompientes con rocío,
   mangas de viento. Sin tramado.
   API:
     VISTA.RAMPS.cliff / cliffWarm / meadow
     VISTA.seaCliff(pb, {x0, x1, top(x), base, seed, k, ramp, strata, grass}) → {top: Int16Array}
     VISTA.windGrass(pb, x0, x1, yFn, {k, seed, density, lean, h})
     VISTA.flowerBush(pb, x, y, r, seed, {k, ramp})
     VISTA.metMast(pb, x, y, h, {k}) → {cups:[[x,y]]}
     VISTA.drawWind(g, n, t, seed, {y0, y1, speed, len, a})
     VISTA.drawSurf(g, list, ox, oy, t)      list: [{x0, x1, y}] rompiente al pie del acantilado
     VISTA.drawSocks(g, list, ox, oy, t, wind)  list: [{x, y}] manga de viento (mástil horneado)
   ===================================================================== */
(() => {
  const V = VISTA;
  const ramp = (r, k) => V.P32(V.hz(r, k || 0));
  V.RAMPS.cliff = ['#2a2c44', '#3e4060', '#585a7a', '#767896', '#9496ae', '#b2b2c4', '#cccbd6', '#e4e2e8', '#f6f4f4'];
  V.RAMPS.cliffWarm = ['#3a2430', '#5a3840', '#7e5048', '#a06c54', '#bc8a64', '#d4a87a', '#e6c498', '#f4dcb8', '#fcf0d8'];
  V.RAMPS.meadow = ['#0e2a1a', '#164028', '#1e5a32', '#2e7a3a', '#4a9a40', '#6ab84a', '#94d05a', '#c4e47a'];
  /** Pared de acantilado vista desde el mar: estratos, fisuras, caras de luz/sombra, pradera arriba */
  V.seaCliff = function (pb, o) {
    const k = o.k || 0, seed = o.seed || 1, R = ramp(o.ramp || V.RAMPS.cliff, k), n = R.length;
    const W2 = o.warm ? ramp(V.RAMPS.cliffWarm, k) : null;
    const G = ramp(o.grass || V.RAMPS.meadow, k), nG = G.length;
    const top = new Int16Array(pb.w).fill(32767);
    const base = o.base ?? pb.h - 1, sH = o.strata || 5;
    for (let x = Math.max(0, o.x0 ?? 0); x < Math.min(pb.w, o.x1 ?? pb.w); x++) {
      const ty = Math.round(o.top(x)); if (ty >= base) continue;
      top[x] = ty;
      // facetas verticales (prismas de roca): orientación por ruido en columnas de 3–9 px
      const fx = vnoise(x * 0.11, 0.5, seed), fr = vnoise((x + 1) * 0.11, 0.5, seed), lit = fr < fx;
      const crack = hash2(x, 0, seed + 3) < 0.07;
      for (let y = ty; y <= base; y++) {
        const d = y - ty, depth = (y - ty) / Math.max(1, base - ty);
        const band = Math.floor((y + vnoise(x * 0.05, y * 0.02, seed + 5) * 6) / sH);
        const warm = W2 && (band % 4 === 1);
        const P = warm ? W2 : R;
        let t = (lit ? 0.68 : 0.42) + (band % 3 === 0 ? 0.06 : band % 3 === 1 ? -0.04 : 0) - depth * 0.22;
        if (d < 2) t += 0.2;
        if (crack && d > 4) t -= 0.22;
        if (((y + band) % sH) === 0) t -= 0.08; // junta de estrato
        t += (hash2(x >> 1, y >> 1, seed + 7) - 0.5) * 0.08;
        V.put(pb, x, y, P[V.band(clamp(t, 0, 0.999), n, x, y, 0.04, seed)]);
      }
      // pradera con labio que sobresale y matas
      const gh = 2 + ((hash2(x >> 2, 1, seed) * 3) | 0);
      for (let q = 0; q < gh; q++) V.put(pb, x, ty - q, G[clamp(q === gh - 1 ? nG - 1 : q === 0 ? 2 : nG - 3, 0, nG - 1)]);
      if (hash2(x, 2, seed) < 0.3) V.put(pb, x, ty + 1, G[1]);
      top[x] = ty - gh;
    }
    // luz de borde cálida en la arista superior
    for (let x = 1; x < pb.w - 1; x++) { const y = top[x]; if (y < 0 || y >= pb.h || top[x] === 32767) continue; if (top[x - 1] > y || top[x + 1] >= y) V.put(pb, x, y, G[nG - 1]); }
    // derrubios y espuma al pie
    if (o.foot !== false) for (let x = 0; x < pb.w; x++) {
      if (top[x] === 32767) continue;
      if (hash2(x >> 1, 3, seed) < 0.5) { V.put(pb, x, base, R[2]); V.put(pb, x, base - 1, R[3 + (x & 1)]); }
      V.put(pb, x, base + 1, U(hash2(x >> 2, 4, seed) < 0.6 ? '#ffffff' : '#d2ecee'));
      if (hash2(x >> 1, 5, seed) < 0.5) V.put(pb, x, base + 2, U('#9ad6f2'));
    }
    return { top };
  };
  /**
   * Cabos aislados sobre el mar: promontorios con remate redondeado, cara frontal con
   * estratos de grosor variable (crema/ocre), extremo izquierdo iluminado y derecho en
   * sombra, fisuras anchas, pradera arriba y espuma al pie. Devuelve los tramos y la cima.
   * o: {seed, k, base, yTop:[a,b], w:[a,b], gap:[a,b], x0, x1, end}
   */
  V.headlands = function (pb, o) {
    const r = RNG(o.seed || 7), k = o.k || 0, base = o.base ?? pb.h - 4, spans = [];
    const R = ramp(o.ramp || V.RAMPS.cliff, k), RW = ramp(V.RAMPS.cliffWarm, k), n = R.length, G = ramp(o.grass || V.RAMPS.meadow, k), nG = G.length;
    const top = new Int16Array(pb.w).fill(32767);
    for (let x = (o.x0 ?? 0) + r.int(0, 40); x < (o.x1 ?? pb.w);) {
      const w = r.int(o.w[0], o.w[1]), yT0 = r.int(o.yTop[0], o.yTop[1]), sl = r.range(-0.05, 0.05), e = Math.max(8, Math.round(w * (o.end ?? 0.22)));
      spans.push([x, x + w, yT0]);
      for (let xx = x; xx < x + w; xx++) {
        if (xx < 0 || xx >= pb.w) continue;
        const yT = Math.round(yT0 + (xx - x - w / 2) * sl), u = Math.min(xx - x, x + w - 1 - xx) / e, drop = u < 1 ? (1 - smooth(u)) * (base - yT) * 0.85 : 0;
        const ty = Math.round(yT + drop + (fbm1(xx * 0.07, 2, o.seed || 7) - 0.5) * 4);
        if (ty >= base - 1) continue;
        top[xx] = ty;
        const left = xx - x < e, right = x + w - 1 - xx < e;
        const facet = vnoise(xx * 0.06, 0.3, (o.seed || 7) + 3), facetR = vnoise((xx + 2) * 0.06, 0.3, (o.seed || 7) + 3);
        const lit = left ? 0.78 : right ? 0.3 : (facetR < facet ? 0.62 : 0.48);
        for (let y = ty; y <= base; y++) {
          const d = y - ty, depth = d / Math.max(1, base - ty);
          const sv = (y - yT) + vnoise(xx * 0.03, y * 0.05, (o.seed || 7) + 9) * 5, layer = Math.floor(sv / (3 + (Math.floor(sv / 7) % 3) * 2));
          const P = (layer % 5 === 1 || layer % 5 === 3) ? RW : R;
          let t = lit + (layer % 2 ? 0.05 : -0.03) - depth * 0.24 + (d < 2 ? 0.18 : 0) + (hash2(xx >> 1, y >> 1, 5) - 0.5) * 0.07;
          if (d > 3 && hash2(xx >> 2, 0, (o.seed || 7) + 11) < 0.06) t -= 0.2;
          V.put(pb, xx, y, P[V.band(clamp(t, 0, 0.999), n, xx, y, 0.04, 13)]);
        }
        // remate de pradera visto desde arriba (cara superior en 3/4): banda iluminada de 4–7 px
        const gh = 4 + ((hash2(xx >> 2, 1, 3) * 4) | 0);
        for (let q = 0; q < gh; q++) V.put(pb, xx, ty - q, G[q === gh - 1 ? nG - 1 : q === 0 ? 1 : q === 1 ? 3 : (q > gh - 3 ? nG - 2 : nG - 3 - (hash2(xx >> 1, ty - q, 5) < 0.3 ? 1 : 0))]);
        top[xx] = ty - gh;
        if (hash2(xx >> 1, 3, 7) < 0.5) { V.put(pb, xx, base, R[2]); V.put(pb, xx, base - 1, R[3]); }
        V.put(pb, xx, base + 1, U(hash2(xx >> 2, 4, 9) < 0.6 ? '#ffffff' : '#d2ecee'));
      }
      x += w + r.int(o.gap[0], o.gap[1]);
    }
    return { top, spans };
  };
  /** Hierba peinada por el viento: briznas inclinadas con punta clara (horneada) */
  V.windGrass = function (pb, x0, x1, yFn, o = {}) {
    const k = o.k || 0, G = ramp(o.ramp || V.RAMPS.meadow, k), nG = G.length, r = RNG(o.seed || 3), lean = o.lean ?? 1.2;
    for (let x = x0; x < x1; x++) {
      if (r() > (o.density ?? 0.5)) continue;
      const y = Math.round(yFn(x)); if (y == null || isNaN(y)) continue;
      const h = r.int(2, o.h || 5);
      for (let q = 0; q < h; q++) V.put(pb, Math.round(x + q * lean * (q / h)), y - q, G[clamp(Math.round(2 + q / h * (nG - 3)), 0, nG - 1)]);
    }
  };
  /** Mata florida rosa (buganvilla/brezo) con hojas */
  V.flowerBush = function (pb, x, y, rr, seed, o = {}) {
    V.shrub(pb, x, y, rr, seed, { k: o.k, ramp: V.RAMPS.vegHill });
    const F = ramp(o.ramp || ['#7a1a5a', '#c02a8a', '#f060b8', '#ffa8d8'], o.k), r = RNG(seed);
    for (let i = 0; i < rr * 5; i++) { const px = x + r.int(-rr, rr), py = y - r.int(0, Math.round(rr * 1.3)); V.put(pb, px, py, F[r.int(0, 3)]); }
  };
  /** Mástil meteorológico de celosía con anemómetros y veleta */
  V.metMast = function (pb, x, y, h, o = {}) {
    const k = o.k || 0, R = ramp(['#3a3a4a', '#6a6a80', '#a0a0b4', '#e0e0ea'], k), RD = U(V.hzc('#e83b41', k));
    for (let q = 0; q < h; q++) { V.put(pb, x, y - q, R[3]); V.put(pb, x + 2, y - q, R[1]); if (q % 3 === 0) V.put(pb, x + 1, y - q, R[2]); if (((q / 12) | 0) % 2 === 0 && q > h - 12) { V.put(pb, x, y - q, RD); V.put(pb, x + 2, y - q, RD); } }
    const cups = [];
    for (const f of [0.55, 0.8, 1]) { const yy = y - Math.round(h * f); for (let q = -4; q <= 6; q++) V.put(pb, x + q, yy, R[2]); cups.push([x - 4, yy - 1], [x + 6, yy - 1]); }
    return { cups };
  };
  /* ---------------- dinámicos ---------------- */
  /** Líneas de viento: trazos claros que cruzan rápido (≤ n fillRect) */
  V.drawWind = function (g, n, t, seed, o = {}) {
    const y0 = o.y0 ?? 30, y1 = o.y1 ?? 220, sp = o.speed ?? 120, L = o.len ?? 26;
    for (let i = 0; i < n; i++) {
      const hy = hash1(i, seed), hx = hash1(i, seed + 1), per = (W + 200) / (sp * (0.7 + hash1(i, seed + 2) * 0.6));
      const u = ((t / per + hx) % 1), x = u * (W + 200) - 100, y = Math.round(y0 + hy * (y1 - y0) + Math.sin(t * 2 + i) * 3);
      const len = Math.round(L * (0.5 + hash1(i, seed + 4)));
      g.globalAlpha = (o.a ?? 0.45) * Math.sin(u * Math.PI); g.fillStyle = '#ffffff';
      g.fillRect(Math.round(x), y, len, 1);
      if (i % 3 === 0) g.fillRect(Math.round(x + len - 4), y - 1, 4, 1); // remolino en la punta
    }
    g.globalAlpha = 1;
  };
  /** Rompiente al pie del acantilado: franja de espuma que sube y baja + rociones */
  V.drawSurf = function (g, list, ox, oy, t) {
    for (const S of list) {
      const a = Math.max(S.x0 + ox, -4), b = Math.min(S.x1 + ox, W + 4); if (b <= a) continue;
      const y = S.y + oy;
      for (let x = Math.floor(a / 6) * 6; x < b; x += 6) {
        const ph = Math.sin(t * 1.6 + x * 0.07 + S.x0 * 0.01), hgt = ph > 0.3 ? Math.round((ph - 0.3) * 6) : 0;
        g.fillStyle = '#ffffff'; g.fillRect(x, y - hgt, 5, 1 + (hgt > 2 ? 1 : 0));
        if (hgt > 3) { g.fillStyle = '#e4f6fc'; g.fillRect(x + 1, y - hgt - 3 - ((t * 8 + x) % 3 | 0), 2, 1); }
        g.fillStyle = '#9ad6f2'; g.fillRect(x + ((t * 6 + x) % 6 | 0), y + 2, 3, 1);
      }
    }
  };
  let _sock = null;
  /** Manga de viento naranja y blanca: se infla más con más viento (3 cuadros) */
  V.drawSocks = function (g, list, ox, oy, t, wind = 1) {
    if (!_sock) _sock = V.strip(3, 10, 6, (pb, f) => {
      const O = U('#ff7a2a'), Wt = U('#ffffff'), D = U('#c04a10');
      for (let x = 0; x < 9; x++) { const hw = Math.max(1, Math.round(2.4 - x * 0.18)), off = Math.round(Math.sin(x * 0.9 - f * 2) * (x / 9) * 1.2); for (let q = -hw; q <= hw; q++) V.put(pb, x, 3 + q + off, q === hw ? D : ((x >> 1) & 1 ? Wt : O)); }
    });
    for (const S of list) { const x = S.x + ox, y = S.y + oy; if (x < -12 || x > W + 12) continue; V.drawStrip(g, _sock, Math.floor(t * (6 + wind * 6) + S.x) % 3, x + 1, y - 3); }
  };
})();
