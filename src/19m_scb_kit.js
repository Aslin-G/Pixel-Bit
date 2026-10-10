/* =====================================================================
   19m_scb_kit.js — Kit compartido de las ESCENAS B (finales, poscréditos,
   epílogo). Todo bajo SCBK para no chocar con otros kits.
   Sin tramado Bayer/ajedrez: bandas con borde de ruido y alfa horneada.
     SCBK.grade(pb, {sat, tint, tintK, bright, lift, liftCol})  gradación de color por plano
     SCBK.ledge(pb, x0, x1, top(x), yBot, {seed, ramp, grass, lip, cols}) → Int16Array top
         cornisa rocosa columnar en 3/4 (luz arriba-izquierda, estratos, fisuras, labio de pradera)
     SCBK.folk(pb, x, y, seed, {s, k, cols, pose})          vecino diminuto del plano medio
     SCBK.stars(pb, w, h, seed, {n, y1})                     estrellas horneadas (1–2 px, cruz las brillantes)
     SCBK.nightSky(w, h, {stops, horizonY, moon:{x,y,r}})   cielo nocturno en bandas con resplandor lunar
     SCBK.moon(pb, cx, cy, r)                                luna con mares y terminador
     SCBK.drawFireflies(g, n, t, seed, {x0,x1,y0,y1,col})   luciérnagas con halo 1 px (≤ 2n fillRect)
     SCBK.drawTwinkle(g, list, t)                           centelleo de estrellas brillantes
     SCBK.mosaicTiles(pb, x, y, w, h, seed, cols)           teselas de datos (mosaico comunitario)
   ===================================================================== */
const SCBK = (() => {
  const V = VISTA;
  const P = (r, k) => V.P32(k ? V.hz(r, k) : r);
  /** Gradación por plano: saturación, tinte y brillo (horneado, sin coste por cuadro) */
  function grade(pb, o = {}) {
    const sat = o.sat ?? 1, tk = o.tintK || 0, br = o.bright ?? 1, lift = o.lift || 0;
    const T = o.tint ? U(o.tint) : 0, tr = T & 255, tg = (T >>> 8) & 255, tb = (T >>> 16) & 255;
    const Lc = o.liftCol ? U(o.liftCol) : 0, lr = Lc & 255, lg = (Lc >>> 8) & 255, lb = (Lc >>> 16) & 255;
    const d = pb.data;
    for (let i = 0; i < d.length; i++) {
      const c = d[i], a = c >>> 24; if (!a) continue;
      let r = c & 255, g = (c >>> 8) & 255, b = (c >>> 16) & 255;
      const l = r * 0.3 + g * 0.59 + b * 0.11;
      r = l + (r - l) * sat; g = l + (g - l) * sat; b = l + (b - l) * sat;
      if (tk) { const m = tk * (0.6 + 0.4 * (l / 255)); r += (tr * l / 160 - r) * m; g += (tg * l / 160 - g) * m; b += (tb * l / 160 - b) * m; }
      r *= br; g *= br; b *= br;
      if (lift) { r += (lr - r) * lift; g += (lg - g) * lift; b += (lb - b) * lift; }
      d[i] = ((a << 24) | (clamp(b, 0, 255) << 16) | (clamp(g, 0, 255) << 8) | clamp(r, 0, 255)) >>> 0;
    }
  }
  /**
   * Cornisa rocosa columnar en 3/4 (como el acantilado de la referencia): labio de
   * pradera iluminado, caras de columnas con arista clara a la izquierda, fisuras
   * oscuras, estratos y oclusión hacia la base. top(x) = y del borde superior.
   */
  function ledge(pb, x0, x1, topFn, yBot, o = {}) {
    const R = P(o.ramp || RAMP.rockWarmR, o.k), n = R.length, seed = o.seed || 3;
    const G = P(o.grass || RAMP.grassR, o.k), nG = G.length;
    const top = new Int16Array(pb.w).fill(32767);
    const colW = o.colW || 13;
    for (let x = Math.max(0, x0); x < Math.min(pb.w, x1); x++) {
      const yt = Math.round(topFn(x)); top[x] = yt;
      // columna: índice y posición dentro de la columna (anchos variables)
      const cx = x + Math.round(vnoise(x * 0.02, 0, seed) * 9);
      const ci = Math.floor(cx / colW), u = (cx % colW) / colW;
      const jag = Math.round(hash1(ci, seed) * 6);
      for (let y = yt; y < Math.min(pb.h, yBot); y++) {
        const d = y - yt;
        let c;
        if (d < (o.lip ?? 4)) {
          // labio de pradera (lima iluminada arriba, verde en sombra debajo)
          const gi = clamp(nG - 1 - d - (hash2(x >> 1, y, seed) < 0.3 ? 1 : 0) - (x > x1 - 30 ? 1 : 0), 1, nG - 1);
          c = G[gi];
        } else {
          // cara de columna: arista iluminada, cuerpo, sombra lateral; oscurece con la profundidad
          const deep = clamp((d - 4) / Math.max(10, (yBot - yt)), 0, 1);
          let k = u < 0.12 ? n - 2 : u < 0.45 ? n - 3 : u < 0.8 ? n - 4 : n - 6;
          k -= Math.round(deep * 3.2);
          if (d < 7) k += 1; // borde soleado bajo el labio
          // fisura entre columnas y grietas horizontales (estratos)
          if (u > 0.92 || ((d + jag) % 17 === 0 && hash2(ci, (d + jag) / 17 | 0, seed) < 0.7)) k = 1;
          else if ((d + jag) % 17 === 1) k += 1;
          // textura en clusters
          const nz = hash2(x >> 1, y >> 1, seed + 7);
          if (nz < 0.12) k -= 1; else if (nz > 0.9) k += 1;
          c = R[clamp(k, 0, n - 1)];
        }
        pb.data[y * pb.w + x] = c;
      }
    }
    // sombra de contacto del labio (1 px granate) y matas colgantes
    const r = RNG(seed + 11);
    for (let x = Math.max(0, x0); x < Math.min(pb.w, x1); x++) {
      const y = top[x] + (o.lip ?? 4); if (y < pb.h) V.put(pb, x, y, R[1]);
      if (r() < 0.12) { const L = r.int(2, 6); for (let q = 0; q < L; q++) V.put(pb, x + (q > 2 ? 1 : 0), y + q, G[clamp(3 - (q >> 1), 0, nG - 1)]); }
    }
    return top;
  }
  /** Vecino diminuto del plano medio (cabeza 2 px, cuerpo 3–4 px, piernas) */
  const SKINS = ['#f2c8a0', '#d89a6a', '#b4744a', '#8a5434', '#6a3e26'];
  const CLOTH = ['#e83b41', '#11bedd', '#f5dc5a', '#3fe0a0', '#8d6bff', '#ff9f43', '#ffffff', '#f060b8', '#2186eb'];
  function folk(pb, x, y, seed, o = {}) {
    const r = RNG(seed), k = o.k || 0, s = o.s || 1;
    const sk = U(V.hzc(SKINS[r.int(0, 4)], k)), cl = o.cols ? o.cols[r.int(0, o.cols.length - 1)] : CLOTH[r.int(0, CLOTH.length - 1)];
    const C = U(V.hzc(cl, k)), Cs = U(V.hzc(shadeTo(cl, -0.3, 250), k)), Lg = U(V.hzc(r.chance(0.5) ? '#3a3050' : '#5a4430', k)), Hr = U(V.hzc(['#1a0a08', '#3a1a10', '#6a3a1a', '#c8c0b0'][r.int(0, 3)], k));
    const h = s > 1 ? 9 : 7, child = r.chance(0.18) && !o.adult;
    const hh = child ? h - 2 : h;
    // piernas
    V.put(pb, x, y - 1, Lg); V.put(pb, x + 1, y - 1, Lg); if (hh > 6) { V.put(pb, x, y - 2, Lg); V.put(pb, x + 1, y - 2, Lg); }
    // cuerpo
    const by = y - (hh > 6 ? 3 : 2), bh = hh > 7 ? 4 : 3;
    for (let q = 0; q < bh; q++) { V.put(pb, x - (q < bh - 1 && s > 1 ? 1 : 0), by - q, Cs); V.put(pb, x, by - q, C); V.put(pb, x + 1, by - q, q === bh - 1 ? C : Cs); }
    // brazo en alto (celebración) o al costado
    if (o.pose === 'cheer' && r.chance(0.6)) { V.put(pb, x - 1, by - bh, sk); V.put(pb, x - 1, by - bh - 1, sk); }
    // cabeza
    const hy = by - bh; V.put(pb, x, hy, sk); V.put(pb, x + 1, hy, V.shU(sk, -0.2, 20)); V.put(pb, x, hy - 1, Hr); V.put(pb, x + 1, hy - 1, Hr);
    return hy - 1;
  }
  /** Estrellas horneadas */
  function stars(pb, w, h, seed, o = {}) {
    const r = RNG(seed), n = o.n || 120, y1 = o.y1 ?? h, out = [];
    const C = [U('#8a94c8'), U('#b8c0e8'), U('#e6ecff'), U('#ffffff'), U('#ffe8c0')];
    for (let i = 0; i < n; i++) {
      const x = r.int(0, w - 1), y = Math.floor(Math.pow(r(), 1.4) * y1), b = r();
      const c = b > 0.93 ? C[3] : b > 0.75 ? C[2] : b > 0.45 ? C[1] : C[0];
      V.put(pb, x, y, c);
      if (b > 0.93) { V.blend(pb, x - 1, y, C[1], 0.6); V.blend(pb, x + 1, y, C[1], 0.6); V.blend(pb, x, y - 1, C[1], 0.6); V.blend(pb, x, y + 1, C[1], 0.6); out.push([x, y, r.range(0, 6)]); }
      else if (b > 0.88) { V.put(pb, x, y, C[4]); out.push([x, y, r.range(0, 6)]); }
    }
    return out;
  }
  /** Cielo nocturno en bandas con resplandor lunar suave y banda de luz sobre el horizonte */
  function nightSky(w, h, o = {}) {
    const pb = new PixelBuffer(w, h), hy = o.horizonY ?? h;
    const stops = o.stops || ['#03061a', '#060b26', '#0a1232', '#0e1a40', '#14244e', '#1c2e5c', '#283a6a', '#364678', '#4a5284', '#62608c'];
    const nb = 20, R = V.P32(V.expand(stops, nb)), M = o.moon;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let t = Math.pow(clamp(y / hy, 0, 1), 1.6);
      if (M) { const d = Math.hypot(x - M.x, (y - M.y) * 1.15); const b = Math.max(0, 1 - d / (M.r * 9)); t += b * b * 0.42; }
      pb.data[y * w + x] = R[V.band(clamp(t, 0, 1), nb, x, y, 0.05, 11)];
    }
    return pb;
  }
  /** Luna creciente-gibosa: disco crema con mares y terminador en violeta */
  function moon(pb, cx, cy, r) {
    const C = V.P32(['#3a3a6a', '#6a6a98', '#a8a8c8', '#d8d4e0', '#f4f0e0', '#fffcf0']);
    for (let y = -r - 1; y <= r + 1; y++) for (let x = -r - 1; x <= r + 1; x++) {
      const d = Math.hypot(x, y) / r; if (d > 1) continue;
      const lit = (x + r * 0.35) / r; // terminador a la derecha
      let k = d > 0.86 ? 4 : 5;
      if (lit > 0.95) k = lit > 1.1 ? 1 : 2;
      const mare = vnoise((cx + x) * 0.35, (cy + y) * 0.35, 77);
      if (mare > 0.62 && k > 2) k -= 1;
      if (d > 0.93 && x < 0) k = 5;
      V.put(pb, cx + x, cy + y, C[k]);
    }
  }
  /** Luciérnagas: punto 1 px + halo 1 px al 40 %, parpadeo lento */
  function drawFireflies(g, n, t, seed, o = {}) {
    const x0 = o.x0 ?? 0, x1 = o.x1 ?? W, y0 = o.y0 ?? 0, y1 = o.y1 ?? H, col = o.col || '#e8ff8a', halo = o.halo || '#9aff5a';
    for (let i = 0; i < n; i++) {
      const hx = hash1(i, seed), hy = hash1(i, seed + 1), ph = hash1(i, seed + 2) * 6.28;
      const x = x0 + hx * (x1 - x0) + Math.sin(t * 0.6 + ph) * 10, y = y0 + hy * (y1 - y0) + Math.sin(t * 0.9 + ph * 1.7) * 6;
      const a = 0.5 + 0.5 * Math.sin(t * 2.2 + ph); if (a < 0.15) continue;
      g.globalAlpha = a * 0.4; g.fillStyle = halo; g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
      g.globalAlpha = a; g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
    g.globalAlpha = 1;
  }
  /** Centelleo: cruz breve sobre las estrellas brillantes */
  function drawTwinkle(g, list, t) {
    g.fillStyle = '#ffffff';
    for (const [x, y, ph] of list) {
      const a = Math.sin(t * 1.7 + ph); if (a < 0.55) continue;
      g.globalAlpha = (a - 0.55) * 1.8; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3);
    }
    g.globalAlpha = 1;
  }
  /** Teselas de datos (mosaico comunitario): celdas 2–3 px con brillo arriba-izquierda */
  function mosaicTiles(pb, x, y, w, h, seed, cols) {
    const C = cols.map(c => [U(shadeTo(c, -0.3, 250)), U(c), U(shadeTo(c, 0.35))]);
    for (let yy = 0; yy < h; yy += 3) for (let xx = 0; xx < w; xx += 3) {
      const c = C[Math.floor(hash2(xx + x, yy + y, seed) * C.length)];
      V.put(pb, x + xx, y + yy, c[2]); V.put(pb, x + xx + 1, y + yy, c[1]); V.put(pb, x + xx, y + yy + 1, c[1]); V.put(pb, x + xx + 1, y + yy + 1, c[0]);
    }
  }
  return { grade, ledge, folk, stars, nightSky, moon, drawFireflies, drawTwinkle, mosaicTiles, SKINS, CLOTH };
})();
