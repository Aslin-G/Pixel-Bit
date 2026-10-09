/* =====================================================================
   17g_vista_life.js — Naturaleza y vida del panorama (VISTA):
   árboles de copa redonda, palmeras, matorrales, huertos, terrazas
   agrícolas en 3/4 (muro de roca + cara superior con hileras de cultivo
   y canal turquesa), cascadas (base estática + tira de agua que corre),
   fauna lejana (gaviotas, drones, águila) y motas de polen/sal.
   API:
     VISTA.tree(pb, x, y, r, seed, {k, ramp, trunk})
     VISTA.palm(pb, x, y, h, lean, seed, {k})
     VISTA.shrub(pb, x, y, r, seed, {k, ramp})
     VISTA.scatterVeg(pb, surfFn, x0, x1, seed, {k, gap, mix})
     VISTA.terraces(pb, {x0, x1, yBase, steps, wallH, topD, shrink, k, seed, kinds, channel, falls}) → {steps, falls}
     VISTA.fall(pb, x, y0, y1, w, {k})                      cascada estática
     VISTA.fallTex(w, h) → lienzo de vetas;  VISTA.drawFalls(g, falls, ox, oy, t)
     VISTA.drawFauna(g, list, ox, oy, t)   list: [{kind:'gull'|'drone'|'eagle', x, y, r, sp}]
     VISTA.drawMotes(g, n, t, seed, {y0, y1, col})
   ===================================================================== */
(() => {
  const V = VISTA;
  const ramp = (r, k) => V.P32(V.hz(r, k || 0));
  const FOL = ['#111908', '#1f2e10', '#2f4418', '#46601c', '#617517', '#7f9222', '#9caf2e', '#c1cd3d', '#e0dc5a'];
  const PALM = ['#1c2006', '#34380c', '#4f5214', '#6d7020', '#8c8a30', '#a9a23e', '#ccc94a', '#eddc8a'];
  const TRUNK = ['#2a1a0a', '#4a3018', '#6b5020', '#8a6a34', '#a8844a'];
  V.LIFE = { FOL, PALM, TRUNK };
  /** Copa redonda de 3–5 lóbulos con hojas en clusters, luz arriba-izquierda */
  V.tree = function (pb, x, y, r, seed, o = {}) {
    const R = ramp(o.ramp || FOL, o.k), n = R.length, rr = RNG(seed);
    const T = ramp(TRUNK, o.k);
    const th = Math.max(1, Math.round(r * 0.7));
    for (let yy = 0; yy < th; yy++) { V.put(pb, x, y - yy, T[2]); if (r > 4) V.put(pb, x + 1, y - yy, T[1]); }
    const cy = y - th - r * 0.7;
    const lobes = [[0, 0, r]];
    const nl = 2 + rr.int(1, 3);
    for (let i = 0; i < nl; i++) { const a = rr.range(-Math.PI, 0), d = r * rr.range(0.35, 0.6); lobes.push([Math.cos(a) * d, Math.sin(a) * d * 0.7 + r * 0.15, r * rr.range(0.5, 0.75)]); }
    const x0 = Math.floor(x - r * 1.6), x1 = Math.ceil(x + r * 1.6), y0 = Math.floor(cy - r * 1.6), y1 = Math.ceil(cy + r * 1.2);
    for (let py = y0; py <= y1; py++) for (let px = x0; px <= x1; px++) {
      let best = -1, bz = 0, bn = null;
      for (const [lx, ly, lr] of lobes) {
        const dx = px + 0.5 - (x + lx), dy = py + 0.5 - (cy + ly), q = lr * lr - dx * dx - dy * dy;
        if (q > 0) { const z = Math.sqrt(q); if (z > bz) { bz = z; best = 1; bn = [dx / lr, dy / lr, z / lr]; } }
      }
      if (best < 0) continue;
      // contorno con mordiscos de hoja
      if (bn[2] < 0.35 && hash2(px, py, seed) < 0.35) continue;
      const I = -bn[0] * 0.55 - bn[1] * 0.6 + bn[2] * 0.5;
      const chip = (hash2(px >> 1, py >> 1, seed + 1) - 0.5) * 0.35;
      const t = clamp(0.45 + I * 0.6 + chip, 0, 0.999);
      V.put(pb, px, py, R[Math.min(n - 1, Math.floor(t * (n - 1)) + 0)]);
    }
  };
  /** Palmera: tronco curvo anillado + 8–10 frondas que cuelgan con foliolos */
  V.palm = function (pb, x, y, h, lean, seed, o = {}) {
    const R = ramp(PALM, o.k), T = ramp(TRUNK, o.k), rr = RNG(seed), n = R.length;
    let tx = x, ty = y;
    for (let i = 0; i < h; i++) {
      const t = i / h; tx = x + lean * t * t; ty = y - i;
      V.put(pb, Math.round(tx), ty, T[(i % 3 === 0) ? 1 : 3]);
      if (h > 26) V.put(pb, Math.round(tx) + 1, ty, T[(i % 3 === 0) ? 0 : 2]);
    }
    const cx = Math.round(tx), cy = ty;
    const nf = o.fronds || (h > 26 ? 10 : 8), L0 = Math.max(5, h * 0.42);
    for (let f = 0; f < nf; f++) {
      const a = (f / nf) * Math.PI * 1.15 - Math.PI * 0.075 + rr.range(-0.12, 0.12); // 0..π (izq→der por arriba)
      const L = L0 * rr.range(0.8, 1.15), droop = rr.range(0.55, 0.95);
      const dx = -Math.cos(a), dy = -Math.sin(a);
      for (let i = 1; i <= L; i++) {
        const u = i / L;
        const px = Math.round(cx + dx * i), py = Math.round(cy + dy * i * (1 - u * 0.5) + droop * u * u * L * 0.9);
        const lit = dx < 0.2 && dy < -0.2 ? 2 : 0;
        V.put(pb, px, py, R[clamp(4 + lit - (u > 0.8 ? 1 : 0), 0, n - 1)]);
        if (i > 2 && i % 2 === 0) { V.put(pb, px, py + 1, R[clamp(2 + (lit >> 1), 0, n - 1)]); if (u < 0.85) V.put(pb, px + (dx > 0 ? 1 : -1), py + 2, R[1]); }
      }
    }
    V.put(pb, cx, cy, R[6]); V.put(pb, cx - 1, cy, R[5]); V.put(pb, cx, cy + 1, T[0]);
    if (rr.chance(0.6)) { V.put(pb, cx + 1, cy + 1, U(V.hzc('#e8a030', o.k || 0))); V.put(pb, cx - 1, cy + 1, U(V.hzc('#c07020', o.k || 0))); }
  };
  /** Matorral de 2–3 lóbulos (borde mordido) */
  V.shrub = function (pb, x, y, r, seed, o = {}) {
    const R = ramp(o.ramp || FOL, o.k), n = R.length;
    V.ellipse(pb, x + 0.5, y - r * 0.6, r + 0.5, r * 0.75 + 0.5, (nx, ny, d, px, py) => {
      if (d > 0.7 && hash2(px, py, seed) < 0.4) return 0;
      const t = clamp(0.5 - nx * 0.3 - ny * 0.45 + (hash2(px >> 1, py, seed) - 0.5) * 0.3, 0, 0.999);
      return R[Math.floor(t * (n - 1))];
    });
  };
  /** Esparce vegetación sobre una superficie surf(x) → y */
  V.scatterVeg = function (pb, surf, x0, x1, seed, o = {}) {
    const r = RNG(seed), k = o.k || 0, gap = o.gap || 9;
    const mix = o.mix || { tree: 2, shrub: 4, palm: 1 };
    const keys = Object.keys(mix), tot = keys.reduce((a, b) => a + mix[b], 0);
    for (let x = x0 + r.int(0, gap); x < x1; x += Math.max(3, Math.round(gap * r.range(0.5, 1.5)))) {
      const y = surf(x); if (y == null || y >= pb.h || y < 0) continue;
      let q = r() * tot, kind = keys[0];
      for (const kk of keys) { q -= mix[kk]; if (q <= 0) { kind = kk; break; } }
      const s = o.scale || 1;
      if (kind === 'tree') V.tree(pb, x, y + 1, Math.round(r.range(3, 6) * s), seed + x, { k, ramp: o.ramp });
      else if (kind === 'palm') V.palm(pb, x, y + 1, Math.round(r.range(14, 24) * s), r.range(-4, 4), seed + x, { k });
      else if (kind === 'shrub') V.shrub(pb, x, y + 1, Math.round(r.range(2, 4) * s), seed + x, { k, ramp: o.ramp });
      else if (kind === 'flower') { const F = ramp(r.chance(0.5) ? RAMP.bougainR : RAMP.flowerR, k); for (let i = 0; i < 5; i++) V.put(pb, x + r.int(-2, 2), y - r.int(0, 2), F[r.int(1, F.length - 1)]); }
    }
  };
  /* ---------------- terrazas agrícolas en 3/4 ---------------- */
  const WALL = ['#3e1a14', '#5e2a1e', '#82494a', '#a0583a', '#c0703e', '#e1956c', '#f0b07a', '#f8c888'];
  const SOIL = ['#4a3418', '#5a431c', '#7a5a2a', '#86502d', '#a8683a', '#cb824a'];
  const CROP = ['#1c3a1c', '#2e5426', '#3f6e2e', '#5a8a34', '#7aa83c', '#99c04a', '#bfd85a', '#e0e87a'];
  const CHAN = ['#065481', '#0a8ab0', '#11bedd', '#3adcf1', '#bde9f2'];
  V.terraces = function (pb, o) {
    const r = RNG(o.seed || 1), k = o.k || 0;
    const Wl = ramp(o.wall || WALL, k), So = ramp(SOIL, k), Cr = ramp(CROP, k), Ch = ramp(CHAN, k);
    const nW = Wl.length;
    const steps = [];
    let foot = o.yBase, L = o.x0, Rr = o.x1;
    for (let i = 0; i < (o.steps || 4); i++) {
      const wh = r.int(o.wallH?.[0] ?? 6, o.wallH?.[1] ?? 10), td = r.int(o.topD?.[0] ?? 4, o.topD?.[1] ?? 6);
      const wallTop = foot - wh;
      steps.push({ i, x0: Math.round(L), x1: Math.round(Rr), foot, wallTop, topY: wallTop - td, td, kind: (o.kinds && o.kinds[i]) || r.pick(['rows', 'rows', 'orchard', 'vine']) });
      foot = wallTop - td;
      const sh = o.shrink || [8, 14];
      L += r.int(sh[0], sh[1]) * (o.leftK ?? 1); Rr -= r.int(sh[0], sh[1]) * (o.rightK ?? 1);
      if (Rr - L < 16) break;
    }
    // de arriba abajo: los escalones bajos (más cercanos) tapan a los de atrás
    for (let si = steps.length - 1; si >= 0; si--) {
      const s = steps[si];
      const jag = (x) => Math.round((vnoise(x * 0.3, si, 5) - 0.5) * 2);
      // cara superior (cultivo)
      for (let y = s.topY; y < s.wallTop; y++) for (let x = s.x0 + 1; x < s.x1 - 1; x++) {
        const v = (y - s.topY) / s.td;
        let u;
        if (s.kind === 'rows') {
          const row = (y - s.topY) % 2;
          u = row ? So[2 + (hash2(x, y, 3) < 0.3 ? 1 : 0)] : Cr[clamp(3 + Math.round((1 - v) * 3) + (hash2(x >> 1, y, 9) < 0.25 ? -1 : 0) + ((x >> 3) % 2), 0, 7)];
        } else if (s.kind === 'vine') u = (x % 3 === 0) ? So[3] : Cr[clamp(2 + Math.round((1 - v) * 3) + (hash2(x, y, 4) < 0.3 ? 1 : 0), 0, 7)];
        else u = So[1 + (hash2(x, y, 5) < 0.4 ? 1 : 0)];
        V.put(pb, x, y, u);
      }
      if (s.kind === 'orchard') for (let x = s.x0 + 3; x < s.x1 - 3; x += r.int(5, 7)) V.tree(pb, x, s.wallTop - 1 - r.int(0, Math.max(0, s.td - 3)), r.int(2, 3), x * 7 + si, { k, ramp: CROP });
      // muro de roca: bloques con grietas, borde superior claro, AO al pie
      const bw = r.int(5, 8);
      for (let y = s.wallTop; y < s.foot; y++) for (let x = s.x0; x < s.x1; x++) {
        const v = (y - s.wallTop) / Math.max(1, s.foot - s.wallTop);
        const bx = Math.floor((x + (Math.floor((y - s.wallTop) / 4) % 2) * 3) / bw), by = Math.floor((y - s.wallTop) / 4);
        const crackV = (x + (by % 2) * 3) % bw === 0, crackH = (y - s.wallTop) % 4 === 3;
        const blk = hash2(bx, by + si * 17, 11);
        let i = Math.round(5 - v * 2.2 + (blk - 0.5) * 2);
        if (crackV || crackH) i = 1 + (blk < 0.5 ? 0 : 1);
        if (x === s.x0) i = Math.min(i, 3);
        if (x >= s.x1 - 2) i = Math.max(0, i - 2);
        if (y === s.wallTop) i = nW - 1;
        if (y >= s.foot - 1) i = 0;
        V.put(pb, x, y, Wl[clamp(i, 0, nW - 1)]);
      }
      // canal turquesa en el borde frontal de la cara superior
      if (o.channel !== false && si > 0 && r.chance(0.7)) for (let x = s.x0 + 2; x < s.x1 - 2; x++) { V.put(pb, x, s.wallTop - 1, Ch[(x + si) % 7 === 0 ? 4 : 2]); V.put(pb, x, s.wallTop - 2, Ch[3]); }
      // plantas colgando del borde y matas en el pie
      for (let x = s.x0 + 1; x < s.x1 - 1; x++) if (hash2(x, si, 21) < 0.12) { const len = 1 + (hash2(x, si, 22) * 3 | 0); for (let q = 0; q < len; q++) V.put(pb, x, s.wallTop + 1 + q, Cr[3 - Math.min(2, q)]); }
    }
    // cascadas que bajan por los muros desde los canales
    const falls = [];
    for (const f of (o.falls || [])) {
      const s0 = steps[Math.min(steps.length - 1, f.from)]; if (!s0) continue;
      const fx = Math.round(f.x), w = f.w || 4;
      for (let si = Math.min(steps.length - 1, f.from); si >= 0; si--) {
        const s = steps[si]; if (fx < s.x0 || fx + w > s.x1) continue;
        const y0 = s.wallTop - 1, y1 = s.foot + (si > 0 ? 0 : (f.extra || 0));
        V.fall(pb, fx, y0, y1, w, { k });
        falls.push({ x: fx, y0, y1, w });
        // charca/espuma en la cara inferior
        if (si > 0) { const sb = steps[si - 1]; for (let x = fx - 2; x < fx + w + 2; x++) { V.put(pb, x, sb.wallTop - 2, Ch[4]); V.put(pb, x, sb.wallTop - 1, Ch[3]); } }
      }
    }
    return { steps, falls };
  };
  /**
   * Terrazas talladas en una ladera ya pintada (info de VISTA.relief): cada escalón existe
   * solo donde la colina sube por encima de su cota, así siguen el contorno del cerro.
   * o = {x0, x1, yTop, yBot, stepH:[a,b], wallK (0..1 fracción de muro), k, seed, kinds[], falls:[{x,w,from}], channel}
   * → {steps:[{y,wallTop,topY,spans:[[a,b]]}], falls}
   */
  V.carveTerraces = function (pb, info, o) {
    const r = RNG(o.seed || 1), k = o.k || 0;
    const Wl = ramp(o.wall || WALL, k), So = ramp(SOIL, k), Cr = ramp(o.crop || CROP, k), Ch = ramp(CHAN, k);
    const nW = Wl.length, nC = Cr.length;
    const steps = [];
    for (let y = o.yTop; y < o.yBot;) {
      const sh = r.int(o.stepH?.[0] ?? 10, o.stepH?.[1] ?? 14), wh = Math.max(4, Math.round(sh * (o.wallK ?? 0.55)));
      steps.push({ topY: y, wallTop: y + sh - wh, foot: y + sh, kind: (o.kinds && o.kinds[steps.length % o.kinds.length]) || r.pick(['rows', 'rows', 'vine', 'orchard']) });
      y += sh;
    }
    const ok = (x, y) => info.top[x] != null && info.top[x] < y; // hay ladera por encima de y en x
    for (let si = 0; si < steps.length; si++) {
      const s = steps[si];
      s.spans = [];
      let a = -1;
      for (let x = o.x0; x <= o.x1; x++) {
        const inside = x < o.x1 && ok(x, s.topY + 1);
        if (inside && a < 0) a = x; else if (!inside && a >= 0) { if (x - a > 8) s.spans.push([a, x - 1]); a = -1; }
      }
      for (const [xa, xb] of s.spans) {
        // cara superior con hileras (se ven en 3/4)
        for (let y = s.topY; y < s.wallTop; y++) for (let x = xa; x <= xb; x++) {
          const v = (y - s.topY) / Math.max(1, s.wallTop - s.topY);
          let u;
          if (s.kind === 'rows') { const row = (y - s.topY) % 2; u = row ? So[2 + (hash2(x, y, 3) < 0.3 ? 1 : 0)] : Cr[clamp(Math.round(nC * 0.45 + (1 - v) * 2.5 + (hash2(x >> 1, y, 9) < 0.3 ? -1 : 0) + (((x + si * 5) >> 4) % 2)), 0, nC - 1)]; }
          else if (s.kind === 'vine') u = (x % 3 === 0) ? So[3] : Cr[clamp(Math.round(nC * 0.35 + (1 - v) * 3 + (hash2(x, y, 4) < 0.3 ? 1 : 0)), 0, nC - 1)];
          else if (s.kind === 'flowers') { const h_ = hash2(x, y, 6); u = h_ < 0.18 ? U(V.hzc(h_ < 0.09 ? '#f060b8' : '#ffd84a', k)) : Cr[clamp(Math.round(nC * 0.4 + (1 - v) * 2), 0, nC - 1)]; }
          else u = So[1 + (hash2(x, y, 5) < 0.4 ? 1 : 0)];
          if (x === xa || x === xb) u = V.shU(u, -0.2, 20);
          V.put(pb, x, y, u);
        }
        if (s.kind === 'orchard') for (let x = xa + 3; x < xb - 2; x += r.int(5, 7)) V.tree(pb, x, s.wallTop - 1, r.int(2, 3), x * 7 + si, { k, ramp: o.crop || CROP });
        // muro de roca
        const bw = r.int(5, 8);
        for (let y = s.wallTop; y < s.foot; y++) for (let x = xa; x <= xb; x++) {
          const v = (y - s.wallTop) / Math.max(1, s.foot - s.wallTop);
          const by = Math.floor((y - s.wallTop) / 3), bx = Math.floor((x + (by % 2) * 3) / bw);
          const crackV = (x + (by % 2) * 3) % bw === 0, crackH = (y - s.wallTop) % 3 === 2;
          const blk = hash2(bx, by + si * 17, 11);
          let i = Math.round(nW * 0.62 - v * 2.4 + (blk - 0.5) * 2);
          if (crackV || crackH) i = 1 + (blk < 0.5 ? 0 : 1);
          if (x <= xa + 1) i = Math.min(i, 3);
          if (x >= xb - 1) i = Math.max(0, i - 2);
          if (y === s.wallTop) i = nW - 1;
          if (y >= s.foot - 1) i = 0;
          V.put(pb, x, y, Wl[clamp(i, 0, nW - 1)]);
        }
        // canal turquesa al borde y plantas colgantes
        if (o.channel !== false && (si % 2 === 1)) for (let x = xa + 2; x < xb - 1; x++) { V.put(pb, x, s.wallTop - 1, Ch[(x + si) % 9 === 0 ? 4 : 2]); }
        for (let x = xa + 1; x < xb; x++) if (hash2(x, si, 21) < 0.14) { const len = 1 + (hash2(x, si, 22) * 3 | 0); for (let q = 0; q < len; q++) V.put(pb, x, s.wallTop + 1 + q, Cr[Math.max(0, 3 - q)]); }
      }
    }
    // cascadas: bajan por los muros de los escalones que cruzan
    const falls = [];
    for (const f of (o.falls || [])) {
      const fx = Math.round(f.x), w = f.w || 4;
      for (let si = f.from ?? 0; si < steps.length; si++) {
        const s = steps[si];
        if (!s.spans.some(([a, b]) => fx >= a && fx + w <= b)) continue;
        const y0 = s.wallTop - 1, y1 = s.foot;
        V.fall(pb, fx, y0, y1, w, { k });
        falls.push({ x: fx, y0, y1, w });
        for (let x = fx - 2; x < fx + w + 2; x++) { V.put(pb, x, y1, Ch[3]); V.put(pb, x, y1 + 1, Ch[2]); }
      }
    }
    return { steps, falls };
  };
  const FALL = ['#4a7a94', '#73a8c4', '#9cc9df', '#bedfed', '#e5f2f3', '#ffffff'];
  /** Cascada estática: vetas verticales, borde de luz, espuma y niebla en la base */
  V.fall = function (pb, x, y0, y1, w, o = {}) {
    const R = ramp(FALL, o.k), n = R.length;
    for (let y = y0; y < y1; y++) for (let xx = 0; xx < w; xx++) {
      const streak = hash2(x + xx, (y + (x + xx) * 7) >> 2, 3);
      let i = xx === 0 ? n - 2 : xx === w - 1 ? 1 : streak < 0.35 ? 2 : streak < 0.75 ? 3 : 4;
      if (y < y0 + 2) i = n - 1;
      V.put(pb, x + xx, y, R[i]);
    }
    // espuma y niebla
    for (let xx = -2; xx < w + 2; xx++) for (let q = 0; q < 3; q++) if (hash2(x + xx, q, 9) < 0.75 - q * 0.2) V.blend(pb, x + xx, y1 - 1 - q + (q === 0 ? 0 : 0), R[n - 1 - (q > 1 ? 1 : 0)], 0.9 - q * 0.25);
    for (let xx = -3; xx < w + 3; xx++) V.blend(pb, x + xx, y1 - 4, R[n - 2], 0.25);
  };
  let _fallTex = null;
  /** Lienzo de vetas que caen (se recorre con desplazamiento: 1 drawImage por tramo) */
  V.fallTex = function () {
    if (_fallTex) return _fallTex;
    const w = 8, h = 64, pb = new PixelBuffer(w, h * 2);
    for (let x = 0; x < w; x++) {
      let y = Math.floor(hash1(x, 4) * h);
      while (y < h * 2 + 20) {
        const len = 3 + Math.floor(hash2(x, y, 5) * 7), a = 0.45 + hash2(x, y, 6) * 0.5;
        for (let q = 0; q < len; q++) { const yy = (y + q) % (h * 2); V.blend(pb, x, yy, U(q < 2 ? '#ffffff' : '#d8eef6'), a); }
        y += len + 2 + Math.floor(hash2(x, y, 7) * 8);
      }
    }
    _fallTex = { c: pb.toCanvas(), w, h };
    return _fallTex;
  };
  /** Agua que corre en las cascadas (y espuma que bulle en la base) */
  V.drawFalls = function (g, falls, ox, oy, t, o = {}) {
    const T = V.fallTex(), sp = o.speed ?? 42;
    const off = Math.floor((t * sp) % T.h);
    for (const f of falls) {
      const sx = f.x + ox, sy = f.y0 + oy, hh = f.y1 - f.y0;
      if (sx > W || sx + f.w < 0 || sy > H || sy + hh < 0) continue;
      g.globalAlpha = o.alpha ?? 0.85;
      for (let x = 0; x < f.w; x += T.w) {
        const cw = Math.min(T.w, f.w - x);
        for (let y = 0; y < hh; y += T.h) {
          const seg = Math.min(T.h, hh - y);
          g.drawImage(T.c, 0, T.h - ((off + x * 13) % T.h), cw, seg, sx + x, sy + y, cw, seg);
        }
      }
      g.globalAlpha = 1;
      // espuma de base (2 fillRect)
      const b = Math.floor(t * 6 + f.x) % 3;
      g.fillStyle = '#ffffff'; g.fillRect(sx - 1 + b, sy + hh - 2, Math.max(1, f.w - 1), 1);
      g.fillStyle = 'rgba(230,246,250,0.55)'; g.fillRect(sx - 2, sy + hh - 4 - b, f.w + 4, 1);
    }
  };
  /* ---------------- fauna lejana ---------------- */
  let FA = null;
  function faunaStrips() {
    if (FA) return FA;
    const gull = V.strip(2, 7, 4, (pb, i) => {
      const Wt = U('#f4f6fb'), G = U('#8a96b0');
      if (i === 0) { V.put(pb, 1, 1, G); V.put(pb, 2, 2, Wt); V.put(pb, 3, 2, Wt); V.put(pb, 4, 2, Wt); V.put(pb, 5, 1, G); V.put(pb, 0, 0, G); V.put(pb, 6, 0, G); }
      else { V.put(pb, 0, 3, G); V.put(pb, 1, 2, Wt); V.put(pb, 2, 2, Wt); V.put(pb, 3, 2, Wt); V.put(pb, 4, 2, Wt); V.put(pb, 5, 2, Wt); V.put(pb, 6, 3, G); }
    });
    const drone = V.strip(2, 13, 7, (pb, i) => {
      const S = V.P32(['#141820', '#3a4050', '#8f8f95', '#d3ccc5', '#f2efea']);
      for (const sd of [-1, 1]) { for (let q = 1; q <= 4; q++) V.put(pb, 6 + sd * q, 3, S[1]); const L = i ? 2 : 1; for (let q = -L; q <= L; q++) V.put(pb, 6 + sd * 5 + q, 2, U(Math.abs(q) === L ? '#9ab0c4' : '#e8f0f8')); }
      for (let x = 4; x <= 8; x++) { V.put(pb, x, 3, S[4]); V.put(pb, x, 4, x < 6 ? U('#ff9f43') : S[3]); }
      V.put(pb, 6, 5, S[0]); V.put(pb, 6, 6, U('#17f3f7'));
    });
    const eagle = V.strip(4, 17, 9, (pb, i) => {
      const B = V.P32(['#2a1a10', '#4a3018', '#6a4a26', '#8c6a3c', '#b08a50']);
      const lift = [-3, -1, 2, -1][i];
      for (const sd of [-1, 1]) for (let q = 1; q <= 8; q++) { const y = 4 + Math.round(lift * q / 8) + (q > 6 ? 1 : 0); V.put(pb, 8 + sd * q, y, B[q > 6 ? 0 : q > 3 ? 2 : 3]); if (q < 6) V.put(pb, 8 + sd * q, y + 1, B[1]); }
      V.put(pb, 8, 4, B[3]); V.put(pb, 8, 5, B[2]); V.put(pb, 8, 6, B[1]); V.put(pb, 8, 3, U('#f4f0e6')); V.put(pb, 9, 3, U('#f0b030'));
    });
    FA = { gull, drone, eagle }; return FA;
  }
  V.drawFauna = function (g, list, ox, oy, t) {
    const F = faunaStrips();
    for (const a of list) {
      if (a.kind === 'gull') {
        const x = a.x + ((t * (a.sp || 6) + a.x * 3) % (a.r || 200)) - (a.r || 200) / 2, y = a.y + Math.sin(t * 0.8 + a.x) * 3;
        V.drawStrip(g, F.gull, Math.floor(t * 5 + a.x) % 2, x + ox, y + oy, (a.sp || 6) < 0);
      } else if (a.kind === 'drone') {
        const x = a.x + Math.sin(t * 0.25 + a.x * 0.1) * (a.r || 16), y = a.y + Math.sin(t * 1.1 + a.x) * 1.5;
        V.drawStrip(g, F.drone, Math.floor(t * 24) % 2, x + ox - 6, y + oy - 3);
        if (Math.floor(t * 2 + a.x) % 2) { g.fillStyle = '#3fe0a0'; g.fillRect(Math.round(x + ox + 2), Math.round(y + oy), 1, 1); }
      } else if (a.kind === 'eagle') {
        const u = (t * 0.03 + a.x * 0.001) % 1, x = a.x + Math.sin(u * TAU) * (a.r || 80), y = a.y + Math.sin(u * TAU * 2) * 8;
        const flap = (t % 5) < 1 ? Math.floor(t * 6) % 4 : 1;
        V.drawStrip(g, F.eagle, flap, x + ox - 8, y + oy - 4, Math.cos(u * TAU) < 0);
      }
    }
  };
  /** Motas de polen/sal que derivan (≤ n fillRect) */
  V.drawMotes = function (g, n, t, seed, o = {}) {
    const y0 = o.y0 ?? 20, y1 = o.y1 ?? 200;
    for (let i = 0; i < n; i++) {
      const hx = hash1(i, seed), hy = hash1(i, seed + 1), ph = hash1(i, seed + 2) * TAU;
      const x = ((hx * (W + 40) + t * (5 + hy * 6)) % (W + 40)) - 20, y = y0 + hy * (y1 - y0) + Math.sin(t * 0.7 + ph) * 6;
      const a = (Math.sin(t * 1.3 + ph) + 1) * 0.5;
      if (a < 0.3) continue;
      g.fillStyle = i % 3 ? (o.col || '#fff6d0') : '#ffffff';
      g.globalAlpha = 0.35 + a * 0.5; g.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
    g.globalAlpha = 1;
  };
})();
