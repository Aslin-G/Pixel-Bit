/* =====================================================================
   18b_pf_flora.js — Flora de plano cercano (kit PF).
   Hoja estampada como primitiva (3–6 px, 4 tonos, luz arriba-izquierda),
   racimos de hojas, palmeras de 9–12 frondas con foliolos, arbustos,
   matas de pasto con puntas amarillas, lupinos, hibiscos, helechos,
   agaves y oclusores oscuros y fríos para el plano frontal (f≈1,3).
   Verdes oliva-lima cálidos (foliageR/grassR/palmR). Sin tramado.
   ===================================================================== */
const PFFlora = (() => {
  const LX = -0.6, LY = -0.8; // dirección hacia la luz (arriba-izquierda)
  const AGAVE = ['#14281f', '#24453a', '#3a6650', '#5e8a62', '#8fb07a', '#c4d69a'];
  const GLOSSY = ['#0c1c10', '#18331a', '#2a4f22', '#3f6a26', '#5f8a2c', '#8fb03a', '#c4d45a'];
  const DRY = ['#3a2a10', '#5e4318', '#8a6526', '#b48a3a', '#d8b25a', '#f0d68a'];

  /** Hoja: base (x,y), ángulo a, largo L, ancho Wd, rampa P (u32), índice base k */
  function leaf(pb, x, y, a, L, Wd, P, k, opts = {}) {
    const ca = Math.cos(a), sa = Math.sin(a), n = P.length;
    const lit = (-sa * LX + ca * LY) > 0 ? 1 : -1; // lado +q iluminado
    const r = Math.ceil(L + Wd);
    for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) {
      const s = xx * ca + yy * sa, q = -xx * sa + yy * ca;
      if (s < 0 || s > L) continue;
      const hw = Wd * 0.5 * Math.pow(Math.sin(Math.PI * clamp(s / L, 0, 1)), 0.75) + 0.35;
      if (Math.abs(q) > hw) continue;
      let ki = k;
      if (q * lit > 0.3) ki += 1; else if (q * lit < -hw + 0.8) ki -= 1;
      if (s > L * 0.72 && q * lit >= 0) ki += opts.tipUp ?? 1;
      if (opts.rib && Math.abs(q) < 0.5 && s > 1 && s < L - 1) ki = k - 1;
      PFK.put(pb, x + xx, y + yy, P[clamp(ki, 0, n - 1)]);
    }
  }
  /** Racimo de hojas en domo elíptico. P = rampa hex. */
  function cluster(pb, cx, cy, rx, ry, ramp, seed, opts = {}) {
    const P = PFK.P32(ramp), n = P.length, r = RNG(seed);
    const dens = opts.density ?? 0.42, Lmin = opts.leaf ? opts.leaf[0] : 3, Lmax = opts.leaf ? opts.leaf[1] : 6;
    // núcleo oscuro
    if (opts.core !== false) PFK.ellipseFn(pb, cx, cy + ry * 0.12, rx * 0.8, ry * 0.72, (nx, ny, d, x, y) => {
      if (d > 0.7 && PFK.cl(x, y, 2, seed) < 0.5) return 0;
      const t = 0.32 + (-nx * 0.3 - ny * 0.4) * 0.5 + (PFK.cl(x, y, 2, seed + 1) - 0.5) * 0.2;
      return P[clamp(Math.round(t * (n - 1) * 0.6), 0, n - 1)];
    });
    const leaves = [];
    const N = Math.round(rx * ry * dens);
    for (let i = 0; i < N; i++) {
      const ang = r() * TAU, rad = Math.pow(r(), 0.55);
      const dx = Math.cos(ang) * rad, dy = Math.sin(ang) * rad;
      const t = 0.5 + (dx * LX + dy * LY) * 0.55 + (r() - 0.5) * 0.3 + (opts.bias || 0);
      const a = Math.atan2(dy * ry, dx * rx) + (r() - 0.5) * 1.1 + (opts.droop || 0) * (dx > 0 ? 1 : -1);
      leaves.push({ x: cx + dx * rx, y: cy + dy * ry, a, t, z: t + dy * 0.3 });
    }
    leaves.sort((p, q) => p.z - q.z);
    for (const lf of leaves) {
      const k = clamp(Math.round(1 + lf.t * (n - 3)), 1, n - 2);
      leaf(pb, Math.round(lf.x - Math.cos(lf.a) * 1.5), Math.round(lf.y - Math.sin(lf.a) * 1.5), lf.a, Lmin + r() * (Lmax - Lmin), 2 + r() * 1.4, P, k, { tipUp: lf.t > 0.6 ? 1 : 0 });
    }
  }
  /** Arbusto de varios lóbulos apoyado en (x,y) */
  function bush(pb, x, y, w, h, ramp, seed, opts = {}) {
    const r = RNG(seed), lobes = opts.lobes ?? Math.max(2, Math.round(w / 9));
    const L = [];
    for (let i = 0; i < lobes; i++) {
      const t = lobes === 1 ? 0.5 : i / (lobes - 1);
      const lx = x - w / 2 + w * (0.18 + t * 0.64) + (r() - 0.5) * 4;
      const lh = h * (0.55 + Math.sin(t * Math.PI) * 0.45) * (0.85 + r() * 0.3);
      L.push([lx, y - lh * 0.5, w / lobes * 0.75 + 3, lh * 0.55]);
    }
    L.sort((a, b) => a[1] - b[1]);
    for (const [lx, ly, rx, ry] of L) cluster(pb, lx, ly, rx, ry, ramp, seed + Math.round(lx), opts);
    // sombra de contacto (banda sólida del tono más oscuro)
    const P = PFK.P32(ramp);
    for (let xx = Math.round(x - w * 0.42); xx < x + w * 0.42; xx++) if (PFK.cl(xx, y, 2, seed) > 0.25) PFK.put(pb, xx, y, P[0]);
  }
  /** Mata de pasto: hojas finas que se abren, base oscura → punta amarilla */
  function tuft(pb, x, y, w, h, seed, ramp = RAMP.grassR, opts = {}) {
    const P = PFK.P32(ramp), n = P.length, r = RNG(seed);
    const N = opts.n ?? Math.round(w * 1.3 + 2);
    const blades = [];
    for (let i = 0; i < N; i++) {
      const bx = x + (r() - 0.5) * w, side = (bx - x) / (w * 0.5 + 0.01);
      const bh = h * (0.45 + r() * 0.55) * (1 - Math.abs(side) * 0.3);
      const lean = side * h * 0.45 + (r() - 0.5) * 3 + (opts.wind || 0) * bh * 0.3;
      blades.push({ bx, bh, lean, k: r() });
    }
    blades.sort((a, b) => a.k - b.k);
    for (const b of blades) {
      const steps = Math.max(2, Math.round(b.bh));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps, xx = Math.round(b.bx + b.lean * t * t), yy = Math.round(y - b.bh * t);
        const lit = b.lean < 0 ? 1 : 0;
        const ki = clamp(Math.round(t * (n - 2)) + lit + (b.k > 0.7 ? 1 : 0), 0, n - 1);
        PFK.put(pb, xx, yy, P[ki]);
        if (t < 0.3 && b.k > 0.5) PFK.put(pb, xx + 1, yy, P[Math.max(0, ki - 1)]);
      }
    }
  }
  /** Palmera: tronco anillado + 9–12 frondas con foliolos que cuelgan */
  const PALM_G = ['#0c1606', '#1a2a0a', '#2e4a14', '#4a6a16', '#6f8c1e', '#9cb42c', '#c8d23e', '#ece066'];
  function palm(pb, x, y, h, lean, seed, opts = {}) {
    const r = RNG(seed), T = PFK.P32(opts.trunk || RAMP.palmTrunkR), F = PFK.P32(opts.ramp || PALM_G), nF = F.length;
    const tx = x + lean, ty = y - h, cxp = x + lean * 0.15, cyp = y - h * 0.55;
    const pts = PFK.quad(x, y, cxp, cyp, tx, ty, Math.ceil(h));
    // tronco: anillos sutiles (fila oscura + fila clara encima)
    pts.forEach(([px, py], i) => {
      const t = i / (pts.length - 1), w = Math.round(lerp(opts.baseW || 5, 3, t));
      const ph = (Math.round(py) + seed) % 4;
      for (let k = 0; k < w; k++) {
        let ki = k === 0 ? 4 : k === w - 1 ? 1 : k === 1 ? 3 : 2;
        if (ph === 0) ki = Math.max(0, ki - 1); else if (ph === 1 && k < w - 1) ki = Math.min(5, ki + 1);
        PFK.put(pb, Math.round(px - w / 2 + k), Math.round(py), T[ki]);
      }
    });
    // frondas (vector con gravedad: suben, se arquean y cuelgan)
    const nfr = opts.fronds ?? (10 + Math.floor(r() * 3));
    const fronds = [];
    for (let i = 0; i < nfr; i++) {
      const u = i / (nfr - 1);
      const ang = lerp(-Math.PI * 1.02, Math.PI * 0.02, u) + (r() - 0.5) * 0.22;
      const upness = -Math.sin(ang);
      fronds.push({ ang, len: h * (0.36 + r() * 0.16 + upness * 0.12) * (opts.frondK || 1), back: r() < 0.4, grav: 0.07 + r() * 0.05 });
    }
    fronds.sort((a, b) => (b.back ? 1 : 0) - (a.back ? 1 : 0) || Math.abs(Math.cos(b.ang)) - Math.abs(Math.cos(a.ang)));
    const drawFrond = (f) => {
      let dx = Math.cos(f.ang), dy = Math.sin(f.ang) - 0.25, px = tx, py = ty;
      const steps = Math.round(f.len), bk = f.back ? -1 : 0;
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        dy += f.grav * (0.3 + t * 1.6); const m = Math.hypot(dx, dy); dx /= m; dy /= m;
        px += dx; py += dy;
        PFK.put(pb, Math.round(px), Math.round(py), F[clamp(4 + bk + (t > 0.6 ? 1 : 0), 0, nF - 1)]);
        if (s > 1 && s % 2 === 0) {
          const ll = Math.max(2, Math.round((1 - t * 0.55) * (opts.leaflet || Math.max(5, h * 0.11))));
          for (const side of [-1, 1]) {
            // perpendicular + caída
            let lx = -dy * side * 0.75 + dx * 0.45, ly = dx * side * 0.75 + dy * 0.45 + 0.85;
            const mm = Math.hypot(lx, ly); lx /= mm; ly /= mm;
            const upper = (-dy * side) < 0; // foliolo del lado de arriba: más corto y más claro
            const len = upper ? Math.round(ll * 0.65) : ll;
            for (let k = 1; k <= len; k++) {
              const xx = Math.round(px + lx * k), yy = Math.round(py + ly * k + k * k * 0.03);
              let ki = (upper ? 5 : 3) + bk + (k === len && upper && !f.back ? 1 : 0) - (k > len * 0.7 && !upper ? 1 : 0);
              if (t > 0.75 && upper && !f.back) ki++;
              PFK.put(pb, xx, yy, F[clamp(ki, 0, nF - 1)]);
            }
          }
        }
      }
    };
    for (const f of fronds) if (f.back) drawFrond(f);
    // cocos bajo la copa
    for (const [ox, oy, c] of [[-2, 3, '#4a200a'], [2, 3, '#6a3410'], [0, 4, '#2e1206'], [-1, 2, '#9a541c']]) PFK.ellipseFn(pb, tx + ox, ty + oy, 1.8, 1.8, (nx, ny) => U(nx + ny < -0.6 ? '#d08a3a' : c));
    for (const f of fronds) if (!f.back) drawFrond(f);
  }
  /** Lupino: espiga de flores violeta sobre hojas palmeadas */
  function lupine(pb, x, y, h, seed, opts = {}) {
    const r = RNG(seed), Lp = PFK.P32(opts.ramp || RAMP.lupineR), G = PFK.P32(opts.leaf || RAMP.foliageR);
    // hojas palmeadas
    for (let j = 0; j < 3; j++) {
      const bx = x + (j - 1) * 3, by = y - 1 - j % 2;
      for (let k = 0; k < 6; k++) { const a = -Math.PI * (0.1 + k * 0.16) + (r() - 0.5) * 0.2; leaf(pb, bx, by, a, 3 + r() * 2, 1.6, G, 3); }
    }
    // tallo
    for (let k = 0; k < h; k++) PFK.put(pb, x + Math.round(Math.sin(k * 0.15 + seed) * 0.6), y - 2 - k, G[2]);
    // flores
    const fl0 = Math.round(h * 0.35);
    for (let k = fl0; k < h + 2; k++) {
      const t = (k - fl0) / (h + 2 - fl0);
      const hw = Math.max(0, Math.round((1 - t) * 2.2 + (k % 2 ? 0.4 : 0)));
      const yy = y - 2 - k, xc = x + Math.round(Math.sin(k * 0.15 + seed) * 0.6);
      for (let dx = -hw; dx <= hw; dx++) {
        let ki = 2 + (dx < 0 ? 1 : 0) + (t > 0.55 ? 1 : 0) - (Math.abs(dx) === hw && hw > 0 ? 1 : 0);
        if (PFK.cl(xc + dx, yy, 1, seed) > 0.85) ki++;
        PFK.put(pb, xc + dx, yy, Lp[clamp(ki, 0, Lp.length - 1)]);
      }
    }
  }
  /** Flor de hibisco (5 pétalos) */
  function hibiscus(pb, x, y, rr = 4, seed = 1, ramp = RAMP.flowerR) {
    const P = PFK.P32(ramp), C = PFK.P32(RAMP.flowerCtrR), r = RNG(seed), a0 = r() * TAU;
    for (let i = 0; i < 5; i++) {
      const a = a0 + i * TAU / 5, px = x + Math.cos(a) * rr * 0.55, py = y + Math.sin(a) * rr * 0.5;
      PFK.ellipseFn(pb, px, py, rr * 0.62, rr * 0.55, (nx, ny, d) => {
        const lit = (nx * LX + ny * LY) > 0.1;
        return P[d > 0.75 ? (lit ? 2 : 0) : lit ? 3 : 1 + (d < 0.3 ? 1 : 0)];
      });
    }
    PFK.put(pb, x, y, C[1]); PFK.put(pb, x - 1, y, C[0]); PFK.put(pb, x, y - 1, U('#fff2c0'));
  }
  /** Mata de hibisco con hojas brillantes y 2–4 flores */
  function hibiscusBush(pb, x, y, w, h, seed) {
    bush(pb, x, y, w, h, GLOSSY, seed, { density: 0.5 });
    const r = RNG(seed + 9), n = 2 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) hibiscus(pb, Math.round(x + (r() - 0.5) * w * 0.7), Math.round(y - h * (0.35 + r() * 0.5)), 3.5 + r() * 1.5, seed + i);
  }
  /** Helecho de frondas arqueadas */
  function fern(pb, x, y, h, seed, ramp = RAMP.foliageR) {
    const r = RNG(seed), P = PFK.P32(ramp);
    const nf = 5 + Math.floor(r() * 3);
    for (let i = 0; i < nf; i++) {
      const side = i % 2 ? 1 : -1, ang = -Math.PI / 2 + side * (0.25 + r() * 0.9);
      let a = ang, px = x, py = y; const L = h * (0.6 + r() * 0.4);
      for (let s = 0; s < L; s++) {
        px += Math.cos(a); py += Math.sin(a); a += 0.045 * side;
        const t = s / L, lit = side < 0;
        PFK.put(pb, Math.round(px), Math.round(py), P[clamp(3 + (lit ? 1 : 0), 0, P.length - 1)]);
        if (s % 2 === 1 && t > 0.1) {
          const ll = Math.max(1, Math.round((1 - t) * 4));
          for (const sd of [-1, 1]) for (let k = 1; k <= ll; k++) {
            const la = a + sd * 1.25;
            PFK.put(pb, Math.round(px + Math.cos(la) * k), Math.round(py + Math.sin(la) * k), P[clamp(2 + (sd < 0 ? 2 : 0) + (t > 0.7 ? 1 : 0), 0, P.length - 1)]);
          }
        }
      }
    }
  }
  /** Agave/suculenta en roseta */
  function agave(pb, x, y, s, seed, ramp = AGAVE) {
    const r = RNG(seed), P = PFK.P32(ramp), n = 9 + Math.floor(r() * 4);
    const L = [];
    for (let i = 0; i < n; i++) { const t = i / (n - 1); L.push({ a: lerp(-Math.PI * 0.95, -Math.PI * 0.05, t) + (r() - 0.5) * 0.15, len: s * (0.6 + Math.sin(t * Math.PI) * 0.5) * (0.85 + r() * 0.3), z: Math.abs(t - 0.5) }); }
    L.sort((a, b) => b.z - a.z);
    for (const l of L) {
      const ca = Math.cos(l.a), sa = Math.sin(l.a), lit = ca < 0.2;
      for (let k = 0; k < l.len; k++) {
        const t = k / l.len, w = Math.max(0, Math.round((1 - t) * s * 0.18));
        for (let q = -w; q <= w; q++) {
          const xx = Math.round(x + ca * k - sa * q), yy = Math.round(y + sa * k + ca * q);
          let ki = 2 + (lit ? 1 : 0) + (q * (lit ? -1 : 1) > 0 ? 1 : 0) + (t > 0.7 ? 1 : 0);
          PFK.put(pb, xx, yy, P[clamp(ki, 0, P.length - 1)]);
        }
      }
      PFK.put(pb, Math.round(x + ca * l.len), Math.round(y + sa * l.len), U('#5a2a14'));
    }
  }
  /** Flores pequeñas sobre pasto (amarillas, blancas, rosadas) */
  function flowerPatch(pb, x, y, w, seed, cols = ['#f6d24a', '#fff2c0', '#f47a90', '#e94a64']) {
    const r = RNG(seed);
    tuft(pb, x, y, w, 4 + r() * 3, seed, RAMP.grassR);
    const n = Math.round(w * 0.5);
    for (let i = 0; i < n; i++) {
      const fx = Math.round(x + (r() - 0.5) * w), fy = Math.round(y - 2 - r() * 5), c = U(cols[Math.floor(r() * cols.length)]);
      PFK.put(pb, fx, fy, c); if (r() < 0.5) PFK.put(pb, fx + 1, fy, c); if (r() < 0.3) PFK.put(pb, fx, fy - 1, U('#fffbe0'));
    }
  }
  /** Árbol de copa ancha (acacia/moringa) para el plano medio cercano */
  function tree(pb, x, y, h, seed, opts = {}) {
    const r = RNG(seed), T = PFK.P32(opts.trunk || ['#1e0f08', '#3a2010', '#5c3618', '#80522a', '#a8743e']), ramp = opts.ramp || RAMP.foliageR;
    const cw = h * (opts.wide || 0.9);
    // tronco con ramas
    const tops = [];
    for (let b = 0; b < 3; b++) {
      const ex = x + (b - 1) * cw * 0.28 + (r() - 0.5) * 6, ey = y - h * (0.62 + r() * 0.12);
      PFK.lineFn(pb, x, y, ex, ey, (t) => T[t < 0.5 ? 2 : 3], 2);
      tops.push([ex, ey]);
    }
    for (let k = 0; k < h * 0.5; k++) { PFK.put(pb, x - 1, y - k, T[3]); PFK.put(pb, x, y - k, T[2]); PFK.put(pb, x + 1, y - k, T[1]); }
    const lobes = [[0, -0.86, 0.5, 0.26], [-0.3, -0.72, 0.36, 0.22], [0.32, -0.74, 0.36, 0.22], [-0.12, -0.95, 0.3, 0.17], [0.16, -0.62, 0.3, 0.18]];
    lobes.sort((a, b) => a[1] - b[1]);
    for (const [ox, oy, sx, sy] of lobes) cluster(pb, x + ox * cw, y + oy * h, sx * cw, sy * h, ramp, seed + Math.round(ox * 100), { density: 0.45 });
  }

  /* ---------- plano frontal (oclusores oscuros y fríos) ---------- */
  /** Hoja grande con nervio y borde iluminado */
  function bigLeaf(pb, x, y, a, L, Wd, ramp, k = 2) {
    const P = PFK.P32(ramp);
    leaf(pb, x, y, a, L, Wd, P, k, { rib: true, tipUp: 0 });
  }
  /** Mata frontal: hojas anchas fgLeaf + espigas lavanda fgVio. side: -1 izquierda, 1 derecha */
  function fgClump(w, h, seed, opts = {}) {
    const pb = new PixelBuffer(w, h), r = RNG(seed);
    const leafR = opts.leaf || ['#05060f', '#0a1626', '#0e243a', '#194560', '#2f6f7a', '#4f8f88'];
    const vio = opts.vio || RAMP.fgVioR;
    // espigas lavanda (detrás)
    const nsp = opts.spikes ?? 4;
    for (let i = 0; i < nsp; i++) lupine(pb, Math.round(w * (0.15 + r() * 0.7)), h - Math.round(r() * 8), Math.round(h * (0.45 + r() * 0.4)), seed + i * 7, { ramp: vio, leaf: leafR });
    // hojas anchas
    const nl = opts.leaves ?? 9;
    for (let i = 0; i < nl; i++) {
      const bx = w * (0.1 + r() * 0.8), a = -Math.PI / 2 + (r() - 0.5) * 2.2;
      const L = h * (0.35 + r() * 0.35), Wd = L * (0.38 + r() * 0.15);
      bigLeaf(pb, Math.round(bx), h + 2, a, L, Wd, leafR, 2 + (i % 2));
    }
    // macizo inferior
    for (let x = 0; x < w; x++) { const hh = 5 + Math.round(PFK.vn(x * 0.15, 0, seed) * 8); for (let y = h - hh; y < h; y++) if (!(PFK.get(pb, x, y) >>> 24)) PFK.put(pb, x, y, U(leafR[y > h - 3 ? 0 : 1])); }
    return pb;
  }
  /** Rama que cuelga desde arriba con racimos lima iluminados y lianas */
  function canopy(w, h, seed, opts = {}) {
    const pb = new PixelBuffer(w, h), r = RNG(seed);
    const T = PFK.P32(['#0e0805', '#24140a', '#3e2412', '#5e3a1e']);
    // rama principal
    const pts = PFK.quad(opts.side < 0 ? 0 : w, 2, w * 0.5, h * 0.35, opts.side < 0 ? w : 0, 6, w);
    pts.forEach(([px, py], i) => { PFK.put(pb, Math.round(px), Math.round(py), T[2]); PFK.put(pb, Math.round(px), Math.round(py) + 1, T[1]); PFK.put(pb, Math.round(px), Math.round(py) - 1, T[3]); });
    // racimos
    const n = opts.n ?? Math.round(w / 16);
    for (let i = 0; i < n; i++) {
      const [px, py] = pts[Math.floor(r() * pts.length)];
      const dark = r() < 0.35;
      cluster(pb, px + (r() - 0.5) * 10, py + 6 + r() * h * 0.35, 9 + r() * 8, 6 + r() * 5, dark ? ['#05060f', '#0e243a', '#194560', '#2f6f7a', '#4f8f88', '#7ab09a'] : RAMP.foliageR, seed + i * 13, { density: 0.5, leaf: [4, 7], bias: dark ? -0.1 : 0.05 });
    }
    // lianas
    for (let i = 0; i < (opts.vines ?? 3); i++) {
      const [px, py] = pts[Math.floor(r() * pts.length)];
      const L = h * (0.4 + r() * 0.5);
      for (let k = 0; k < L; k++) { const xx = Math.round(px + Math.sin(k * 0.12 + i) * 1.5); PFK.put(pb, xx, Math.round(py + k), U(k % 7 < 2 ? '#3b5320' : '#232a0c')); if (k % 6 === 3) leaf(pb, xx, Math.round(py + k), Math.PI * (r() < 0.5 ? 0.2 : 0.8), 3, 2, PFK.P32(RAMP.foliageR), 4); }
    }
    return pb;
  }
  /** Siembra vegetación variada a lo largo de una línea de suelo gy(x) */
  function scatter(pb, gy, x0, x1, seed, opts = {}) {
    const r = RNG(seed), mix = opts.mix || { tuft: 5, bush: 2, flowers: 1, agave: 1, fern: 1 };
    const keys = Object.keys(mix), tot = keys.reduce((s, k) => s + mix[k], 0);
    let x = x0 + r() * (opts.gap || 10);
    while (x < x1) {
      let p = r() * tot, kind = keys[0];
      for (const k of keys) { p -= mix[k]; if (p <= 0) { kind = k; break; } }
      const y = Math.round(gy(x)) + (opts.dy || 0), s = opts.scale || 1;
      if (kind === 'tuft') tuft(pb, Math.round(x), y, 6 + r() * 6 * s, 5 + r() * 7 * s, Math.round(x * 7 + seed));
      else if (kind === 'bush') bush(pb, Math.round(x), y, 12 + r() * 12 * s, 8 + r() * 9 * s, RAMP.foliageR, Math.round(x * 3 + seed));
      else if (kind === 'flowers') flowerPatch(pb, Math.round(x), y, 8 + r() * 8, Math.round(x + seed));
      else if (kind === 'agave') agave(pb, Math.round(x), y, 6 + r() * 5 * s, Math.round(x + seed));
      else if (kind === 'fern') fern(pb, Math.round(x), y, 8 + r() * 6 * s, Math.round(x + seed));
      else if (kind === 'hibiscus') hibiscusBush(pb, Math.round(x), y, 12 + r() * 6, 10 + r() * 6, Math.round(x + seed));
      else if (kind === 'lupine') { for (let k = 0; k < 3; k++) lupine(pb, Math.round(x + k * 3 - 3), y, 10 + r() * 8, Math.round(x + k + seed)); }
      else if (kind === 'dry') tuft(pb, Math.round(x), y, 6 + r() * 6, 4 + r() * 5, Math.round(x + seed), DRY);
      x += (opts.gap || 10) * (0.5 + r());
    }
  }
  return { leaf, cluster, bush, tuft, palm, lupine, hibiscus, hibiscusBush, fern, agave, flowerPatch, tree, bigLeaf, fgClump, canopy, scatter, GLOSSY, AGAVE, DRY };
})();
