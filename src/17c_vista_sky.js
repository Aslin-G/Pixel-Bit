/* =====================================================================
   17c_vista_sky.js — Cielo, sol, cúmulos volumétricos, cirros y mares
   lejanos del panorama (VISTA). Sin tramado: bandas con borde de ruido.
   API:
     VISTA.sky(w, h, {stops, horizonY, haze, sun:{x,y,r,halo}, curve})  → PixelBuffer
     VISTA.sun(pb, cx, cy, r, haloR)
     VISTA.cumulus(w, h, seed, {pal, sun:-1..1, tower, flat, warm})      → PixelBuffer
     VISTA.cirrus(w, h, seed, {pal})                                      → PixelBuffer
     B.cloudDeck({n, seed, f:[a,b], y:[a,b], w:[a,b], kind, speed:[a,b], sunX, pal, haze, tall}) → deck
     VISTA.seaFar(pb, y0, y1, {ramp, caps, seed, shoreTint})              (estático, con filas de borreguitos)
     VISTA.drawSeaFx(g, x0, y0, w, h, t, {sunX, density})                (destellos y reflejo del sol)
   ===================================================================== */
(() => {
  const V = VISTA;
  /* ---------------- cielo ---------------- */
  V.sky = function (w, h, o = {}) {
    const pb = new PixelBuffer(w, h);
    const hy = o.horizonY ?? 140;
    const stops = o.stops || ['#1270e2', '#1a7ce8', '#2488ee', '#3493f4', '#3e9df8', '#52aaf8', '#73b9f4', '#97c6f2', '#b3cdef', '#c4cdea'];
    const haze = o.haze || ['#c8c8e4', '#cdbfd4', '#d2c2cc', '#d8c8cc'];
    const nb = o.bands || 22;
    const R = V.P32(V.expand(stops, nb)), HZ = V.P32(V.expand(haze, 6));
    const sun = o.sun, curve = o.curve ?? 1.25;
    for (let y = 0; y < h; y++) {
      const ty = Math.pow(clamp(y / hy, 0, 1), curve);
      for (let x = 0; x < w; x++) {
        let t = ty;
        if (sun) {
          const d = Math.hypot((x - sun.x) * 0.8, y - sun.y);
          const b = Math.max(0, 1 - d / (sun.halo * 4.2));
          t += b * b * 0.34;
          // lado del sol algo más claro
          t += (1 - Math.min(1, Math.abs(x - sun.x) / (w * 0.9))) * 0.04;
        }
        let u = R[V.band(clamp(t, 0, 1), nb, x, y, 0.045, 3)];
        // bruma de horizonte lavanda (12 px sobre el horizonte y todo lo de debajo)
        const dh = y - (hy - 14);
        if (dh > 0) {
          const k = clamp(dh / 18, 0, 1);
          u = V.mixU(u, HZ[V.band(k, 6, x, y, 0.08, 5)], 0.25 + 0.6 * k);
        }
        pb.data[y * w + x] = u;
      }
    }
    if (sun) V.sun(pb, sun.x, sun.y, sun.r, sun.halo);
    return pb;
  };
  /** Sol focal: disco crema con anillos suaves cálido → lavanda (sin halo tramado) */
  V.sun = function (pb, cx, cy, r = 11, haloR = 24) {
    const ring = [
      [r + 1.6, U('#f6dca2'), 0.95], [r + 3.2, U('#ecc7a6'), 0.62], [r + 5.6, U('#d6b5ae'), 0.44],
      [r + 8.6, U('#bcaabd'), 0.32], [r + 11.8, U('#a3a0cc'), 0.22], [haloR, U('#8a9edc'), 0.14],
    ];
    const x0 = Math.floor(cx - haloR - 2), x1 = Math.ceil(cx + haloR + 2), y0 = Math.floor(cy - haloR - 2), y1 = Math.ceil(cy + haloR + 2);
    const DISC = U('#fdfacd'), CORE = U('#fffde8'), EDGE = U('#f8eab6');
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (x < 0 || y < 0 || x >= pb.w || y >= pb.h) continue;
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const i = y * pb.w + x;
      if (d <= r) {
        const k = Math.hypot(x + 0.5 - (cx - r * 0.3), y + 0.5 - (cy - r * 0.3)) / r;
        pb.data[i] = d > r - 1 ? EDGE : k < 0.55 ? CORE : DISC;
        continue;
      }
      // borde de anillo desplazado por clusters → contorno orgánico, sin ajedrez
      const j = (hash2((x / 2) | 0, (y / 2) | 0, 77) - 0.5) * 1.6;
      for (const [rr, u, a] of ring) if (d + j <= rr) { pb.data[i] = V.mixU(pb.data[i], u, a); break; }
    }
  };
  /* ---------------- cúmulos ---------------- */
  /**
   * Cúmulo volumétrico: unión de esferas con normales, 7 tonos (cloudR), base plana
   * con vientre pervinca, crestas festoneadas, borde cálido del lado del sol.
   * o.sun: −1 (sol a la izquierda) .. 1 (a la derecha); o.tower: 0..1 (desarrollo vertical)
   */
  V.cumulus = function (w, h, seed, o = {}) {
    const r = RNG(seed * 7919 + 13);
    const pb = new PixelBuffer(w, h);
    const pal = V.P32(o.pal || ['#7d93cf', '#9db2ea', '#b6c4f0', '#cbd3f0', '#dfe5f7', '#f2f2f6', '#ffffff', '#fdf3cf']);
    const n = pal.length;
    const base = h - 2;
    const puffs = [];
    const tower = o.tower ?? r.range(0.3, 0.9);
    // fila de base
    const nb = Math.max(3, Math.round(w / r.range(13, 18)));
    for (let i = 0; i < nb; i++) {
      const t = i / (nb - 1);
      const rr = h * r.range(0.16, 0.26) * (1 - Math.abs(t - 0.5) * 0.6);
      puffs.push([lerp(w * 0.1, w * 0.9, t) + r.range(-3, 3), base - rr * r.range(0.45, 0.8), rr]);
    }
    // cuerpo y torre
    const px = w * r.range(0.36, 0.62);
    const nm = Math.round(w / 9) + 3;
    for (let i = 0; i < nm; i++) {
      const dx = (r() + r() - 1) * w * 0.42;
      const k = 1 - Math.min(1, Math.abs(dx) / (w * 0.5));
      const rr = h * (0.12 + 0.24 * k * r.range(0.7, 1.15));
      const top = base - rr - (h - rr * 2 - 3) * Math.pow(k, 1.3) * tower * r.range(0.65, 1);
      puffs.push([px + dx, Math.min(base - rr * 0.7, top + rr), rr]);
    }
    // festón: bultos pequeños en el perfil superior
    const ext = new Float32Array(w).fill(h);
    for (const [cx, cy, rr] of puffs) for (let x = Math.floor(cx - rr); x <= cx + rr; x++) if (x >= 0 && x < w) { const yy = cy - Math.sqrt(Math.max(0, rr * rr - (x - cx) * (x - cx))); if (yy < ext[x]) ext[x] = yy; }
    for (let x = 3; x < w - 3; x += r.int(4, 7)) if (ext[x] < base - 4) puffs.push([x + r.range(-1, 1), ext[x] + r.range(1.5, 3), r.range(2.2, 4.2)]);
    // raster
    const L = [(o.sun ?? 0.35) * 0.55, -0.78, 0.42]; const ln = Math.hypot(...L); L[0] /= ln; L[1] /= ln; L[2] /= ln;
    const Z = new Float32Array(w * h), ID = new Int16Array(w * h).fill(-1), T = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let best = -1, bz = 0;
      for (let p = 0; p < puffs.length; p++) {
        const [cx, cy, rr] = puffs[p], dx = x + 0.5 - cx, dy = y + 0.5 - cy, q = rr * rr - dx * dx - dy * dy;
        if (q > 0) { const z = Math.sqrt(q) + rr * 0.15 * (cy < base - h * 0.3 ? 1 : 0); if (z > bz) { bz = z; best = p; } }
      }
      if (best < 0 || y > base) continue;
      const [cx, cy, rr] = puffs[best];
      const nx = (x + 0.5 - cx) / rr, ny = (y + 0.5 - cy) / rr, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      const I = nx * L[0] + ny * L[1] + nz * L[2];
      const hf = clamp((base - y) / (h * 0.9), 0, 1);
      let t = -0.08 + 0.8 * (I * 0.5 + 0.5) + 0.34 * Math.pow(hf, 0.8);
      if (base - y < 5) t -= (5 - (base - y)) * 0.06; // vientre
      const i = y * w + x; Z[i] = bz; ID[i] = best; T[i] = t;
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (ID[i] < 0) continue;
      let t = T[i];
      // pliegue: un lóbulo delante de otro → línea interior 1 px más oscura (festoneado interno)
      const ir = x < w - 1 ? i + 1 : -1, iu = y > 0 ? i - w : -1, il = x > 0 ? i - 1 : -1;
      for (const j of [ir, iu, il]) if (j >= 0 && ID[j] >= 0 && ID[j] !== ID[i] && Z[j] > Z[i] + 1.6 && T[j] > t - 0.05) { t -= 0.13; break; }
      let k = V.band(clamp(t, 0, 0.999), n - 1, x, y, 0.035, seed);
      // borde contra el cielo: lado de sombra un paso abajo, lado del sol borde cálido
      const edgeL = x === 0 || ID[i - 1] < 0, edgeR = x === w - 1 || ID[i + 1] < 0, edgeU = y === 0 || ID[i - w] < 0;
      const sunSide = (o.sun ?? 0.35) >= 0 ? edgeR : edgeL;
      if ((edgeU || sunSide) && k >= n - 3 && (o.warm ?? true)) k = n - 1;
      else if ((edgeL || edgeR) && !sunSide) k = Math.max(0, k - 1);
      pb.data[i] = pal[k];
    }
    return pb;
  };
  /** Cirros: trazos horizontales finos con extremos afilados y ganchos */
  V.cirrus = function (w, h, seed, o = {}) {
    const r = RNG(seed * 31 + 7), pb = new PixelBuffer(w, h);
    const pal = V.P32(o.pal || ['#a9bcef', '#c6d5f4', '#e4ebf8', '#f6f8fc']);
    const nS = r.int(4, 8);
    for (let s = 0; s < nS; s++) {
      const len = r.range(w * 0.25, w * 0.85), x0 = r.range(0, w - len), y0 = r.range(2, h - 3), slope = r.range(-0.08, 0.02);
      const th = r.chance(0.4) ? 2 : 1;
      for (let x = 0; x < len; x++) {
        const t = x / len, taper = Math.sin(t * Math.PI);
        if (taper < 0.12) continue;
        const yy = Math.round(y0 + x * slope + Math.sin(x * 0.11 + s) * 0.8);
        const k = clamp(Math.round(taper * 3 - (hash2(x >> 2, s, seed) < 0.25 ? 1 : 0)), 0, 3);
        V.blend(pb, x0 + x, yy, pal[k], 0.55 + taper * 0.4);
        if (th > 1 && taper > 0.4) V.blend(pb, x0 + x, yy + 1, pal[Math.max(0, k - 1)], 0.4 + taper * 0.3);
      }
      // gancho al final
      if (r.chance(0.5)) for (let k = 0; k < 4; k++) V.blend(pb, Math.round(x0 + len * 0.86 + k), Math.round(y0 + len * 0.86 * slope - k * 0.7 - 1), pal[2], 0.6);
    }
    return pb;
  };
  /**
   * Cubierta de nubes que deriva, intercalada como capa dinámica (algunas quedan
   * detrás de las montañas si la cubierta se crea antes que ellas).
   */
  Backdrop.prototype.cloudDeck = function (o = {}) {
    const r = RNG(o.seed || 1);
    const deck = { clouds: [], B: this };
    const n = o.n || 6, F = o.f || [0.04, 0.08], Y = o.y || [10, 80], Wd = o.w || [50, 120], S = o.speed || [2, 4];
    for (let i = 0; i < n; i++) {
      const f = lerp(F[0], F[1], r()), w = Math.round(lerp(Wd[0], Wd[1], Math.pow(r(), o.bias ?? 1)));
      const span = W + (this.levelW - W) * f + w + 160;
      const x = ((i + r.range(0.1, 0.9)) / n) * span;
      const y = Math.round(lerp(Y[0], Y[1], r()));
      let pb;
      if (o.kind === 'cirrus') pb = V.cirrus(w, Math.round(w * r.range(0.1, 0.18)) + 4, (o.seed || 1) * 100 + i, o);
      else {
        const sunSide = clamp(((o.sunX ?? 410) - (x - w / 2)) / 260, -1, 1);
        const h = Math.round(w * r.range(o.tall ? 0.5 : 0.36, o.tall ? 0.72 : 0.52));
        pb = V.cumulus(w, h, (o.seed || 1) * 100 + i, { sun: sunSide, tower: o.tall ? r.range(0.6, 1) : r.range(0.15, 0.7), pal: o.pal });
      }
      if (o.haze) for (let k = 0; k < pb.data.length; k++) { const c = pb.data[k]; if (c >>> 24) pb.data[k] = (V.mixU(c, U(o.hazeCol || '#c9c4e2'), o.haze) & 0xffffff | (c & 0xff000000)) >>> 0; }
      deck.clouds.push({ c: pb.toCanvas(), x, y, f, w: pb.w, h: pb.h, span, speed: lerp(S[0], S[1], r()) });
    }
    deck.clouds.sort((a, b) => a.f - b.f);
    const self = this;
    deck.L = this.vdyn(F[0], (g, cam) => {
      const wind = 0.6 + (self.weather.wind || 0) * 0.8;
      for (const c of deck.clouds) {
        c.x += c.speed * Game.dt * wind;
        if (c.x > c.span) c.x -= c.span + c.w;
        const sx = Math.round(c.x - cam.x * c.f - c.w), sy = Math.round(c.y - (cam.y - V.CAMY) * c.f * 0.3);
        if (sx > W || sx + c.w < 0) continue;
        g.drawImage(c.c, sx, sy);
      }
    }, { tag: 'clouds' });
    return deck;
  };
  /* ---------------- mar lejano ---------------- */
  /** Mar lejano estático: degradado en bandas + filas de borreguitos que se alargan hacia el espectador */
  V.seaFar = function (pb, y0, y1, o = {}) {
    const stops = o.stops || ['#a9c8ea', '#5aaae6', '#2690de', '#0a7fd0', '#0679c6', '#0583c9', '#0890cf', '#0b9cd2'];
    const nb = 16, R = V.P32(V.expand(stops, nb));
    const CAP = V.P32(['#4fb3ea', '#9ad6f2', '#d8f1fb', '#ffffff']);
    const r = RNG(o.seed || 5);
    for (let y = y0; y < y1; y++) {
      const t = Math.pow((y - y0) / Math.max(1, y1 - y0), 0.55);
      for (let x = 0; x < pb.w; x++) {
        let u = R[V.band(t, nb, x, y, 0.04, 9)];
        // rizos horizontales finos (ondulación) sin tramado: segmentos 1 px algo más claros/oscuros
        const wv = vnoise(x * 0.09, y * 0.9, 21);
        if (y > y0 + 1 && wv > 0.74) u = V.shU(u, 0.08);
        else if (y > y0 + 1 && wv < 0.2) u = V.shU(u, -0.06, 220);
        pb.data[y * pb.w + x] = u;
      }
    }
    // línea de horizonte nítida
    for (let x = 0; x < pb.w; x++) pb.data[y0 * pb.w + x] = U(o.horizonCol || '#c6d4ee');
    // borreguitos (filas): más densos y largos cuanto más cerca
    if (o.caps !== false) {
      const n = Math.round(pb.w * (y1 - y0) / 140);
      for (let i = 0; i < n; i++) {
        const t = Math.pow(r(), 0.7), y = Math.round(y0 + 3 + t * (y1 - y0 - 4));
        const len = Math.max(1, Math.round(1 + t * 5 + r() * 2));
        const x = r.int(0, pb.w - len);
        for (let k = 0; k < len; k++) V.put(pb, x + k, y, CAP[k === 0 || k === len - 1 ? 1 : (t > 0.5 ? 3 : 2)]);
        if (t > 0.45) for (let k = 1; k < len - 1; k++) V.put(pb, x + k, y + 1, CAP[0]);
      }
    }
  };
  /** Destellos animados del mar + columna de reflejo del sol (≤ ~60 fillRect) */
  V.drawSeaFx = function (g, x0, y0, w, h, t, o = {}) {
    const n = Math.round(w * h / 1100 * (o.density ?? 1));
    for (let i = 0; i < n; i++) {
      const hx = hash1(i, 3), hy = hash1(i, 7), ph = hash1(i, 11) * TAU;
      const life = (Math.sin(t * (1.2 + hash1(i, 13) * 1.6) + ph) + 1) / 2;
      if (life < 0.62) continue;
      const yy = Math.round(y0 + 2 + Math.pow(hy, 0.8) * (h - 2));
      const len = Math.max(1, Math.round((1 + (yy - y0) / h * 4) * (life - 0.55) * 2.4));
      const xx = Math.round(x0 + ((hx * w + t * 3 * (0.3 + hy)) % w));
      g.fillStyle = life > 0.9 ? '#ffffff' : '#bfe8fa';
      g.fillRect(xx, yy, len, 1);
    }
    if (o.sunX != null) {
      for (let y = y0 + 1; y < y0 + h; y += 2) {
        const k = (y - y0) / h, spread = 3 + k * 26;
        const v = Math.sin(t * 2.2 + y * 1.37);
        if (v < 0.1) continue;
        const xx = Math.round(o.sunX + Math.sin(y * 2.9 + t * 0.7) * spread);
        g.fillStyle = v > 0.75 ? '#fffbe6' : '#f6e7b8';
        g.fillRect(xx, y, Math.round(1 + v * (2 + k * 4)), 1);
      }
    }
  };
})();
