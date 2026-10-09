/* =====================================================================
   17d_vista_relief.js — Relieve del panorama (VISTA): cordilleras y
   colinas esculpidas con un trazador de alturas en columnas (voxel-space
   oblicuo, de delante hacia atrás). Normales → luz arriba-izquierda,
   cavidades oscuras, crestas claras, borde cálido en la silueta, bruma
   por profundidad y niebla en la base. Vegetación en clusters.
   API:
     VISTA.massif(peaks[{x,v,h,w,d,k}], {seed, rough, scale, base, sharp}) → H(u,v)
     VISTA.relief(pb, {yBase, nv, dvy, H, ramp, x0, x1, seed, kv, haze:{col,k},
                       mist:{col,h,k}, veg:{ramp,density,maxSlope,minY}, rim, tex}) → info
       info = { top: Int16Array (silueta por columna), surf(x) → y de la superficie cercana,
                hAt(x,v), yAt(x,v) }
   ===================================================================== */
(() => {
  const V = VISTA;
  /** Campo de alturas: conos (máximo) erosionados con ruido de crestas alargado en profundidad */
  V.massif = function (peaks, o = {}) {
    const seed = o.seed || 1, rough = o.rough ?? 0.55, sc = o.scale ?? 0.035, base = o.base || 0, sharp = o.sharp ?? 1.25;
    const spurs = o.spurs ?? 9, fineK = o.fine ?? 1;
    return (u, v) => {
      let hm = base, bp = null, bq = 0;
      for (let i = 0; i < peaks.length; i++) {
        const p = peaks[i], a = (u - p.x) / p.w, b = (v - p.v) / p.d;
        const q = 1 - Math.sqrt(a * a + b * b);
        if (q > 0) { const hh = p.h * Math.pow(q, p.k || sharp); if (hh > hm) { hm = hh; bp = p; bq = q; } }
      }
      if (hm <= 0) return 0;
      // espolones radiales desde la cima del pico dominante (crestas que bajan por la ladera)
      let rn;
      const iso = V.ridged(u * sc + 11.3, v * sc * 0.8 + 3.1, 4, seed + 4);
      if (bp) {
        const warp = (fbm(u * 0.021, v * 0.04, 2, seed + 2) - 0.5) * 2.6;
        const ang = Math.atan2((v - bp.v) * (bp.w / bp.d), u - bp.x);
        const rad = 1 - bq;
        const sp = V.ridged(ang * spurs / TAU * 4 + warp + (bp.x * 0.013), rad * 2.4 + warp * 0.3, 4, seed);
        const sw = o.spurW ?? 0.6;
        rn = sp * sw + iso * (1 - sw);
      } else rn = iso;
      const fine = vnoise(u * sc * 3, v * sc * 2.4 + 7.7, seed + 9);
      const front = o.apron ? smooth(clamp(v / o.apron, 0, 1)) : 1;
      let hh = Math.max(0, front * (hm * (1 - rough * 0.42 + rough * 0.5 * rn) + (fine - 0.5) * fineK * rough * Math.min(8, hm * 0.1)));
      // mesetas (para asentar ciudades): techo de altura con borde suave
      if (o.plateaus) for (const p of o.plateaus) { const a = Math.abs(u - p.x) / p.w; if (a < 1 && hh > p.h) { const e = smooth(clamp((1 - a) * 3, 0, 1)); hh = lerp(hh, p.h + (fine - 0.5) * 1.5, e); } }
      return hh;
    };
  };
  /** Trazador de relieve en columnas */
  V.relief = function (pb, o) {
    const w = pb.w, x0 = Math.max(0, o.x0 ?? 0), x1 = Math.min(w, o.x1 ?? w);
    const nv = o.nv || 40, dvy = o.dvy ?? 0.45, yBase = o.yBase ?? pb.h - 1, H = o.H, kv = o.kv ?? 0.9;
    const seed = o.seed || 1, tex = o.tex ?? 0.05;
    const gw = x1 - x0 + 2;
    const G = new Float32Array(gw * (nv + 2));
    for (let v = -1; v <= nv; v++) for (let x = x0 - 1; x <= x1; x++) G[(v + 1) * gw + (x - x0 + 1)] = H(x, v);
    const hAt = (x, v) => G[(clamp(v, -1, nv) + 1) * gw + (clamp(x, x0 - 1, x1) - x0 + 1)];
    // rampas por profundidad (bruma) — 4 cubos
    const nB = 4, ramps = [];
    for (let b = 0; b < nB; b++) ramps.push(V.P32(o.haze ? V.hz(o.ramp, (o.haze.k0 || 0) + (o.haze.k || 0) * b / (nB - 1), o.haze.col) : o.ramp));
    const n = o.ramp.length;
    const L = o.light || V.LIGHT;
    const top = new Int16Array(w).fill(32767), surf = new Int16Array(w).fill(32767);
    const veg = [];
    const tAt = (x, v) => {
      const h = hAt(x, v);
      const dx = (hAt(x + 1, v) - hAt(x - 1, v)) * 0.5, dv = (hAt(x, v + 1) - hAt(x, v - 1)) * 0.5 * kv;
      const inv = 1 / Math.hypot(dx, dv, 1);
      const I = (dx * -L[0] + dv * -L[1] * 0.9 + L[2]) * inv;
      // cavidad: comparación con la media local
      const avg = (hAt(x - 3, v) + hAt(x + 3, v) + hAt(x, v - 2) + hAt(x, v + 2)) * 0.25;
      const cav = clamp((h - avg) * 0.06, -0.25, 0.25);
      const hgt = o.hMax ? clamp(h / o.hMax, 0, 1) * (o.hgtK ?? 0.12) : 0;
      return [clamp((o.t0 ?? 0.5) + (I - 0.62) * (o.contrast ?? 1.55) + cav + hgt, 0, 0.999), dx, dv];
    };
    for (let x = x0; x < x1; x++) {
      let yt = Math.min(pb.h, Math.round(yBase) + 1);
      for (let v = 0; v < nv; v++) {
        const h = hAt(x, v);
        if (h <= 0 && v > 0) continue;
        const sy = Math.round(yBase - v * dvy - h);
        if (sy >= yt) continue;
        const [t, dx, dv] = tAt(x, v);
        const R = ramps[Math.min(nB - 1, Math.floor(v / nv * nB))];
        const y0 = Math.max(0, sy);
        for (let y = y0; y < yt; y++) {
          // textura en clusters ±1 paso (sin tramado)
          const j = (hash2((x / 2) | 0, (y / 2) | 0, seed + 3) - 0.5) * tex * 2;
          const k = V.band(clamp(t + j - (y - sy) * 0.012, 0, 0.999), n, x, y, 0.05, seed);
          if (y < pb.h) pb.data[y * w + x] = R[k];
        }
        if (v === 0 || surf[x] === 32767) surf[x] = sy;
        // candidatos de vegetación: pendiente suave y de cara al espectador
        if (o.veg && Math.abs(dx) < (o.veg.maxSlope ?? 0.9) && dv > -0.2 && sy > (o.veg.minY ?? 0) && hash2(x, v, seed + 11) < (o.veg.density ?? 0.05)) veg.push([x, sy, t, v]);
        yt = y0;
      }
      top[x] = yt;
    }
    // borde cálido del lado del sol en la silueta y en crestas iluminadas
    if (o.rim) {
      const RU = U(o.rim);
      for (let x = x0 + 1; x < x1 - 1; x++) {
        const y = top[x]; if (y >= pb.h || y < 0) continue;
        // de cara a la izquierda (la silueta sube hacia la derecha) o cima plana
        if (top[x + 1] <= y || top[x - 1] > y) { const i = y * w + x; pb.data[i] = V.mixU(pb.data[i], RU, o.rimK ?? 0.6); }
      }
    }
    // niebla de base
    if (o.mist) {
      const MU = U(o.mist.col), mh = o.mist.h || 12, mk = o.mist.k ?? 0.5;
      for (let y = Math.max(0, Math.round(yBase - mh)); y <= Math.min(pb.h - 1, yBase); y++) {
        const k = mk * Math.pow(1 - (yBase - y) / mh, 1.4);
        for (let x = x0; x < x1; x++) { const i = y * w + x; if (pb.data[i] >>> 24) pb.data[i] = V.mixU(pb.data[i], MU, k); }
      }
    }
    // vegetación en clusters (2–5 px) con punto de luz arriba-izquierda
    if (o.veg && veg.length) {
      const VR = V.P32(o.veg.ramp || V.hz(RAMP.foliageR, 0.3)), nv_ = VR.length;
      const big = o.veg.size ?? 2.2;
      for (const [x, y, t] of veg) {
        const s = 1 + (hash2(x, y, 5) * big | 0), cy = y - Math.round(s * 0.4);
        for (let yy = -s; yy <= s; yy++) for (let xx = -s - 1; xx <= s + 1; xx++) {
          const d = (xx * xx) / ((s + 1) * (s + 1)) + (yy * yy) / (s * s + 0.5);
          if (d > 1 || (d > 0.6 && hash2(x + xx, cy + yy, 7) < 0.35)) continue;
          const px = x + xx, py = cy + yy + 1;
          if (px < 0 || px >= w || py < 0 || py >= pb.h) continue;
          const sh = clamp(0.55 - xx / (s + 1) * 0.3 - yy / (s + 0.5) * 0.4 + (t - 0.5) * 0.3 + (hash2(px, py, 9) - 0.5) * 0.2, 0, 0.999);
          pb.data[py * w + px] = VR[Math.floor(sh * nv_)];
        }
      }
    }
    const yAt = (x, v) => Math.round(yBase - v * dvy - hAt(x, v));
    /** y visible de la superficie a profundidad v (null si la tapa algo más cercano) */
    const visY = (x, v) => { const y = yAt(x, v); for (let q = 0; q < v; q++) if (yAt(x, q) <= y + 1) return null; return y; };
    /** primer punto visible buscando desde la profundidad v hacia el espectador */
    const onSurf = (x, v) => { for (let q = v; q >= 0; q--) { const y = visY(x, q); if (y != null && hAt(x, q) > 0.5) return y; } return null; };
    return { top, surf, hAt, yAt, visY, onSurf };
  };
  /** Silueta de cresta 1-D suave (para colinas cercanas simples): y(x) */
  V.ridgeLine = function (x, base, amp, sc, seed) { return base - amp * fbm1(x * sc, 4, seed); };
})();
