/* =====================================================================
   17k_vista_desert.js — Desierto fotovoltaico del panorama (VISTA):
   campos de dunas esculpidas (barlovento iluminado, sotavento violeta,
   rizos), mesetas estratificadas, campo FV en perspectiva por bandas,
   seguidores FV en 3/4, inversores, torres de alta tensión con cables,
   cardones, agaves y cercas de arena; espejismo (lago de cielo
   invertido) y arena que vuela. Sin tramado.
   API:
     VISTA.RAMPS.dune / duneFar / mesa
     VISTA.duneH({seed, amp, period, skew, crest, x0}) → H(u, v)    para VISTA.relief
     VISTA.mesas(pb, {yBase, seed, k, ramp, n, hMin, hMax})          mesetas con estratos
     VISTA.pvField(pb, {x0, x1, y0, y1, rows, k, gap, seed, skip(x,y)}) → {rows:[{x0,x1,y0,y1}]}
     VISTA.tracker(pb, x, y, w, {k, tilt, rows}) → {x0,y0,x1,y1}     mesa FV grande en 3/4
     VISTA.inverter(pb, x, y, {k, s}) → {led:[x,y]}
     VISTA.pylon(pb, x, y, h, {k}) → {arms:[[x,y]...]};  VISTA.wires(pb, a, b, sag, {k})
     VISTA.cardon(pb, x, y, h, seed, {k});  VISTA.agave(pb, x, y, r, seed, {k});  VISTA.sandFence(pb, x0, x1, y, {k})
     VISTA.mirage(pb, yLine, h, {col, a})                           banda de espejismo horneada
     VISTA.drawSand(g, n, t, seed, {y0, y1, wind})                  arena que vuela (≤ n fillRect)
     VISTA.drawCloudShadows(g, S, clouds, cam, f, ox, oy, {k})       copia oscurecida bajo cada nube
   ===================================================================== */
(() => {
  const V = VISTA;
  const ramp = (r, k) => V.P32(V.hz(r, k || 0));
  V.RAMPS.dune = ['#3e2244', '#5e3050', '#844052', '#a8504c', '#c8684a', '#de8850', '#eca85e', '#f6c472', '#fcdc96', '#fff0c4'];
  V.RAMPS.duneFar = ['#6a5280', '#86608a', '#a2708c', '#bc8a8e', '#d4a494', '#e4bc9e', '#f0d2ac', '#f8e2c0'];
  V.RAMPS.mesa = ['#3a2a52', '#4e3866', '#66487a', '#7e5a8a', '#987096', '#b088a2', '#c8a0ae', '#dcbab8'];
  /** Campo de alturas de dunas: crestas asimétricas (sotavento empinado) con fase y amplitud ruidosas */
  V.duneH = function (o = {}) {
    const seed = o.seed || 1, A = o.amp || 30, Pd = o.period || 120, sk = o.skew ?? 2.2, c = o.crest ?? 0.72;
    return (u, v) => {
      let h = 0;
      for (let s = 0; s < 2; s++) {
        const p = Pd * (s ? 0.43 : 1), a = A * (s ? 0.32 : 1);
        const ph = (fbm(u * 0.004 + s * 7, v * 0.05, 2, seed + s) - 0.5) * p * 1.6;
        let q = ((u + v * sk * (s ? -0.6 : 1) + ph) / p) % 1; if (q < 0) q += 1;
        const tri = q < c ? q / c : (1 - q) / (1 - c);
        const amp = a * (0.55 + 0.75 * vnoise(u * 0.006 + s * 3, v * 0.08, seed + 9 + s));
        h += Math.pow(tri, 1.6) * amp;
      }
      const front = o.apron ? smooth(clamp(v / o.apron, 0, 1)) : 1;
      return h * front + (o.base || 0);
    };
  };
  /** Mesetas lejanas: techo plano, escarpe con estratos horizontales y taludes */
  V.mesas = function (pb, o = {}) {
    const r = RNG(o.seed || 5), k = o.k || 0, R = ramp(o.ramp || V.RAMPS.mesa, k), n = R.length, yB = o.yBase ?? pb.h - 1;
    const top = new Int16Array(pb.w).fill(yB);
    for (let x = -40; x < pb.w + 40;) {
      const w = r.int(40, 160), h = r.int(o.hMin || 14, o.hMax || 40), talus = r.int(8, 20);
      if (r.chance(0.25)) { x += r.int(20, 70); continue; }
      for (let xx = x - talus; xx < x + w + talus; xx++) {
        if (xx < 0 || xx >= pb.w) continue;
        const edge = xx < x ? (xx - (x - talus)) / talus : xx >= x + w ? 1 - (xx - (x + w)) / talus : 1;
        const hh = Math.round(h * (edge < 1 ? Math.pow(edge, 1.6) * 0.75 : 1) + (fbm1(xx * 0.08, 2, o.seed || 5) - 0.5) * 3);
        top[xx] = Math.min(top[xx], yB - hh);
      }
      x += w + r.int(10, 60);
    }
    for (let x = 0; x < pb.w; x++) {
      const t0 = top[x]; if (t0 >= yB) continue;
      const dl = top[Math.max(0, x - 1)] - t0, dr = top[Math.min(pb.w - 1, x + 1)] - t0;
      for (let y = t0; y <= yB; y++) {
        const d = y - t0;
        let i = d < 1 ? n - 1 : d < 3 ? n - 2 : (((y + (hash2(x >> 3, 0, 3) * 3 | 0)) % 7) < 2 ? 2 : 4) - (dr < -1 ? 1 : 0) + (dl > 1 ? 1 : 0);
        if (d > 3 && hash2(x >> 1, y >> 1, 11) < 0.12) i -= 1;
        V.put(pb, x, y, R[clamp(i, 0, n - 1)]);
      }
    }
    return { top };
  };
  /* ---------------- fotovoltaica ---------------- */
  const PV = ['#101a3e', '#16214a', '#1e2a55', '#2a3a6c', '#3f5590', '#56709e', '#7a92c0', '#a6bce2', '#d8e6fa'];
  /** Campo FV en perspectiva: filas que crecen hacia el espectador, con sombra violeta y rejilla */
  V.pvField = function (pb, o) {
    const k = o.k || 0, P = ramp(PV, k), n = P.length, FR = U(V.hzc('#e8ecf4', k)), GR = U(V.hzc('#8ea2cc', k)), SH = U(V.hzc('#4a2a50', k)), LEG = U(V.hzc('#3a3448', k));
    const rows = [], nR = o.rows || 8;
    let y = o.y0;
    for (let i = 0; i < nR && y < o.y1; i++) {
      const t = i / Math.max(1, nR - 1), ph = Math.max(2, Math.round(2 + t * (o.grow ?? 6))), cell = Math.max(2, Math.round(2 + t * 3));
      const x0 = o.x0, x1 = o.x1, sk = Math.max(1, Math.round(ph * 0.5));
      let seg0 = x0;
      for (let x = x0; x < x1; x++) {
        if (o.skip && o.skip(x, y)) { seg0 = x + 1; continue; }
        if ((x - seg0) % Math.round(60 + t * 50) === Math.round(58 + t * 48)) continue; // pasillo entre mesas
        for (let yy = 0; yy < ph; yy++) {
          const px = x + Math.round(sk * yy / ph), py = y - yy;
          let u;
          if (yy === ph - 1) u = FR;
          else if (((x - x0) % (cell + 1)) === 0 && t > 0.3) u = GR;
          else { const tt = clamp(0.2 + (yy / ph) * 0.5 + ((x * 0.37 + i * 13) % 29 < 3 ? 0.25 : 0) + (x - x0) / (x1 - x0) * 0.1, 0, 0.999); u = P[V.band(tt, n - 1, px, py, 0.05, 61)]; }
          V.put(pb, px, py, u);
        }
        V.put(pb, x + 1, y + 1, SH); if (t > 0.4) V.put(pb, x + 1, y + 2, SH);
        if (t > 0.5 && (x - x0) % 9 === 0) V.put(pb, x, y + 1, LEG);
      }
      rows.push({ x0, x1: x1 + sk, y0: y - ph, y1: y + 2 });
      y += ph + Math.max(2, Math.round(2 + t * (o.gap ?? 5)));
    }
    return { rows };
  };
  /** Mesa FV grande en 3/4 (seguidor): marco claro, celdas con reflejo de cielo, brazo y poste */
  V.tracker = function (pb, x, y, w, o = {}) {
    const k = o.k || 0, P = ramp(PV, k), n = P.length, FR = U(V.hzc('#f0f2f8', k)), FD = U(V.hzc('#9aa4c0', k)), GR = U(V.hzc('#7e92c0', k));
    const ST = ramp(['#2a2c3c', '#4a4c5e', '#7a7e92', '#b0b4c4', '#e0e4ee'], k);
    const rows = o.rows || 3, ch = o.ch || 4, h = rows * (ch + 1) + 1, sk = o.tilt ?? Math.round(h * 0.6), cw = o.cw || 6;
    // poste y brazo
    for (let q = 0; q < Math.round(h * 0.9); q++) { V.put(pb, x + (w >> 1), y + q - Math.round(h * 0.3), ST[q < 2 ? 4 : 2]); V.put(pb, x + (w >> 1) + 1, y + q - Math.round(h * 0.3), ST[1]); }
    for (let yy = 0; yy < h; yy++) {
      const off = Math.round(sk * (1 - yy / h));
      for (let xx = 0; xx < w; xx++) {
        const px = x + xx + off, py = y - yy;
        let u;
        if (yy === 0) u = FD; else if (yy === h - 1 || xx === 0) u = FR; else if (xx === w - 1) u = FD;
        else if (yy % (ch + 1) === 0 || xx % (cw + 1) === 0) u = GR;
        else { const t = clamp(0.15 + (xx / w) * 0.35 + (yy / h) * 0.45 + (((xx + yy * 3) % 31) < 3 ? 0.3 : 0), 0, 0.999); u = P[V.band(t, n - 1, px, py, 0.04, 71)]; }
        V.put(pb, px, py, u);
      }
    }
    // sombra arrojada (violeta) sobre la arena
    for (let xx = 0; xx < w + 4; xx++) for (let q = 1; q < 4; q++) { const c = V.get(pb, x + xx + 3, y + q + Math.round(h * 0.4)); if (c >>> 24) V.put(pb, x + xx + 3, y + q + Math.round(h * 0.4), V.shU(c, -0.3, 275)); }
    return { x0: x, y0: y - h, x1: x + w + sk, y1: y + 1 };
  };
  /** Caseta de inversores: caja blanca con franja cian, rejillas y LED */
  V.inverter = function (pb, x, y, o = {}) {
    const k = o.k || 0, s = o.s || 1, w = Math.round(22 * s), h = Math.round(12 * s);
    V.box3q(pb, x, y, w, h, Math.round(8 * s), { ramp: V.ARCH.WHITE, k });
    const C = U(V.hzc('#20b4c8', k)), G = U(V.hzc('#5a6478', k));
    for (let xx = x; xx < x + w; xx++) { V.put(pb, xx, y - h + 1, C); V.put(pb, xx, y - h + 2, C); }
    for (let q = 0; q < 3; q++) for (let yy = y - h + 5; yy < y - 2; yy += 2) V.put(pb, x + 3 + q * 5, yy, G);
    return { led: [x + w - 4, y - h + 4] };
  };
  /** Torre de alta tensión (celosía) con crucetas; devuelve los puntos de amarre */
  V.pylon = function (pb, x, y, h, o = {}) {
    const k = o.k || 0, R = ramp(['#3a3a4a', '#5a5a6e', '#8a8aa0', '#c0c0d0', '#e8e8f0'], k);
    const wb = Math.max(4, Math.round(h * 0.22)), arms = [];
    for (let yy = 0; yy < h; yy++) {
      const t = yy / h, hw = Math.max(1, Math.round(wb * (1 - t) * 0.5 + 1));
      V.put(pb, x - hw, y - yy, R[3]); V.put(pb, x + hw, y - yy, R[1]);
      if (yy % 4 === 0) for (let q = -hw; q <= hw; q++) V.put(pb, x + q, y - yy, R[2]);
      if (yy % 4 === 2 && hw > 1) { V.put(pb, x - hw + 1, y - yy, R[2]); V.put(pb, x + hw - 1, y - yy, R[2]); }
    }
    for (const [t, aw] of [[0.62, 0.42], [0.82, 0.32]]) {
      const yy = y - Math.round(h * t), a = Math.round(h * aw);
      for (let q = -a; q <= a; q++) { V.put(pb, x + q, yy, R[q < 0 ? 4 : 2]); if (Math.abs(q) > a - 3) V.put(pb, x + q, yy + 1, R[1]); }
      arms.push([x - a, yy + 1], [x + a, yy + 1]);
    }
    V.put(pb, x, y - h - 1, R[4]);
    return { arms };
  };
  /** Cable combado entre dos puntos */
  V.wires = function (pb, a, b, sag, o = {}) {
    const u = U(V.hzc(o.col || '#2a2a3a', o.k || 0)), n = Math.max(2, Math.abs(b[0] - a[0]));
    for (let i = 0; i <= n; i++) { const t = i / n; V.put(pb, Math.round(lerp(a[0], b[0], t)), Math.round(lerp(a[1], b[1], t) + Math.sin(t * Math.PI) * sag), u); }
  };
  /** Cardón (cactus columnar) con brazos, costillas iluminadas a la izquierda */
  V.cardon = function (pb, x, y, h, seed, o = {}) {
    const r = RNG(seed), R = ramp(['#16260e', '#243c12', '#3a5818', '#56761c', '#78962a', '#a8c040'], o.k), n = R.length;
    const col = (cx, y0, y1, w) => { for (let yy = y1; yy <= y0; yy++) for (let q = 0; q < w; q++) V.put(pb, cx + q, yy, R[q === 0 ? n - 1 : q === w - 1 ? 1 : (q === 1 ? n - 2 : 3) - ((yy & 3) === 0 ? 1 : 0)]); V.put(pb, cx + (w >> 1), y1 - 1, R[n - 2]); };
    const w = Math.max(2, Math.round(h * 0.16));
    col(x, y, y - h, w);
    for (let i = 0; i < r.int(1, 3); i++) {
      const side = r.chance(0.5) ? -1 : 1, ay = y - Math.round(h * r.range(0.3, 0.6)), ah = Math.round(h * r.range(0.3, 0.5)), ax = x + (side < 0 ? -w - 1 : w + 1);
      for (let q = 0; q < w + 1; q++) V.put(pb, side < 0 ? ax + q : x + w + q - 1, ay, R[2]);
      col(ax, ay, ay - ah, Math.max(2, w - 1));
    }
  };
  /** Agave: roseta de hojas en abanico */
  V.agave = function (pb, x, y, rr, seed, o = {}) {
    const R = ramp(['#1e3a2a', '#2e5a3e', '#4a7a54', '#6a9a6a', '#9ac08a', '#c8e0a0'], o.k), n = R.length;
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (0.12 + 0.76 * i / 8), len = rr * (0.7 + 0.3 * Math.sin(i * 1.7 + seed));
      for (let q = 0; q < len; q++) { const px = Math.round(x + Math.cos(a) * q * (a < Math.PI / 2 ? 1 : 1)), py = Math.round(y - Math.sin(a) * q); V.put(pb, px, py, R[clamp(Math.round((a < Math.PI / 2 ? 2 : 4) + (q / len) * 1.5), 0, n - 1)]); }
    }
  };
  /** Cerca de arena (empalizada de listones) */
  V.sandFence = function (pb, x0, x1, y, o = {}) {
    const R = ramp(['#3a2414', '#5a3820', '#8a5a34', '#b07a50'], o.k);
    for (let x = x0; x < x1; x++) { V.put(pb, x, y - 5, R[2]); if ((x - x0) % 3 === 0) for (let q = 0; q < 7; q++) V.put(pb, x, y - q, R[q > 5 ? 3 : 1 + (q & 1)]); }
  };
  /** Espejismo: banda clara que refleja el cielo, con rizos horizontales (horneado) */
  V.mirage = function (pb, y0, h, o = {}) {
    const col = U(o.col || '#bfe0f4'), a = o.a ?? 0.55;
    for (let y = y0; y < y0 + h; y++) for (let x = 0; x < pb.w; x++) {
      const t = (y - y0) / h, wv = vnoise(x * 0.05, y * 0.7, 51);
      const aa = a * Math.sin(t * Math.PI) * (wv > 0.45 ? 1 : 0.55);
      const i = y * pb.w + x; if (pb.data[i] >>> 24) pb.data[i] = V.mixU(pb.data[i], col, aa);
    }
  };
  /** Arena que vuela con el viento (≤ n fillRect) */
  V.drawSand = function (g, n, t, seed, o = {}) {
    const y0 = o.y0 ?? 200, y1 = o.y1 ?? 300, wnd = o.wind ?? 1;
    g.fillStyle = o.col || '#f8d8a0';
    for (let i = 0; i < n; i++) {
      const hy = hash1(i, seed), hx = hash1(i, seed + 3), sp = 40 + hash1(i, seed + 5) * 60;
      const x = ((hx * (W + 60) + t * sp * wnd) % (W + 60)) - 30, y = y0 + hy * (y1 - y0) + Math.sin(t * 3 + i) * 2;
      g.globalAlpha = 0.25 + hash1(i, seed + 7) * 0.4; g.fillRect(Math.round(x), Math.round(y), 2 + (i % 3), 1);
    }
    g.globalAlpha = 1;
  };
  /** Copia en sombra para nubes: mezcla hacia un violeta frío y alfa que se desvanece arriba y abajo */
  V.shadowMix = function (pb, x, y, w, h, o = {}) {
    const out = new PixelBuffer(w, h), col = U(o.col || '#4a3c7a'), a = o.a ?? 0.38, ft = o.featherTop ?? 12, fb = o.featherBot ?? 6;
    for (let yy = 0; yy < h; yy++) {
      const fa = Math.min(1, (yy + 1) / ft, (h - yy) / fb), al = Math.round(255 * (fa >= 1 ? 1 : fa > 0.5 ? 0.66 : 0.33));
      for (let xx = 0; xx < w; xx++) { const c = V.get(pb, x + xx, y + yy); if (c >>> 24) out.data[yy * w + xx] = ((al << 24) | (V.mixU(c, col, a) & 0xffffff)) >>> 0; }
    }
    return { c: out.toCanvas(), x, y, w, h };
  };
  /**
   * Sombras de nube sobre un plano: S = shadowCopy del plano; cada nube proyecta en vertical
   * (mismo criterio que Backdrop.cloudShadowAt): tramo central oscuro y bordes al 50 %.
   */
  V.drawCloudShadows = function (g, S, clouds, cam, f, ox, oy, o = {}) {
    for (const c of clouds) {
      if (c.f < (o.minF ?? 0.12)) continue;
      const cx = Math.round(c.x - cam.x * c.f - c.w * 0.5), hw = Math.round(c.w * 0.45);
      // pantalla → coordenadas del lienzo S
      const a0 = cx - hw - ox - S.x, a1 = cx + hw - ox - S.x, e = Math.round(hw * 0.3);
      const seg = (u0, u1, al) => { u0 = Math.max(0, u0); u1 = Math.min(S.w, u1); if (u1 <= u0) return; g.globalAlpha = al; g.drawImage(S.c, u0, 0, u1 - u0, S.h, S.x + ox + u0, S.y + oy, u1 - u0, S.h); };
      seg(a0 + e, a1 - e, o.a ?? 0.9); seg(a0, a0 + e, 0.45); seg(a1 - e, a1, 0.45);
    }
    g.globalAlpha = 1;
  };
})();
