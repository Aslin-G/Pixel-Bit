/* =====================================================================
   17n_vista_agro.js — Kit VISTA (rollout B): luz y agroecología.
   Generadores nuevos (solo añaden; 17b–17g no se tocan):
     VISTA.dunes(pb, {y0, y1, rows, hBack, hFront, wMin, wMax, ramp, hazeCol, k0, k1, seed, fillTo}) → {tops:[Int16Array], crests:[[x,y]]}
     VISTA.pond(pb, cx, y, hw, d, {k, seed, ramp, bank}) → {x0, x1, y, d}
     VISTA.reeds(pb, x0, x1, y, {k, seed, h, density})
     VISTA.adobe(pb, x, y, w, h, seed, {k, d, door}) → {top}
     VISTA.shadeHouse(pb, x, y, w, h, {k})
     VISTA.waterTower(pb, x, y, h, {k}) → {top}
     VISTA.cropRows(pb, x0, x1, y0, y1, {k, seed, kinds, channelEvery}) → {channels:[[x0,x1,y]]}
     VISTA.orchard(pb, x0, x1, y0, y1, {k, seed, rows, r0, r1, gap, fruit})
     VISTA.contourTerraces(pb, {cx, yTop, steps, stepH, hwTop, hwBot, bow, k, seed, kinds, falls}) → {steps, falls, yEnd}
     VISTA.windPump(pb, x, y, h, {k}) → {hx, hy};  VISTA.pumpWheel(R, {k}) → tira 6 cuadros
     VISTA.egret(pb, x, y, {k, flip})                     garza blanca posada (4×7)
     VISTA.drawFlock(g, fl, ox, oy, t)                    bandada en V (3 fillRect/ave)
     VISTA.sunBloom(g, sun, t, {a, r, col})               halo aditivo del sol (2 drawImage)
     VISTA.rays(w, h, sx, sy, {n, len, a0, col, seed}) → lienzo de rayos crepusculares en bandas
     VISTA.drawSandWisps(g, crests, ox, oy, t, {col, n}) arena que vuela de las crestas
   Sin tramado: todo en bandas con borde de ruido en clusters.
   ===================================================================== */
(() => {
  const V = VISTA;
  const ramp = (r, k, hz) => V.P32(V.hz(r, k || 0, hz));
  const DUNE = ['#4a3a6a', '#66487a', '#84587a', '#a2686e', '#c07e60', '#d6965c', '#e6b064', '#f2c674', '#f8da92', '#fdecbe'];
  const ADOBE = ['#4a2214', '#6a3420', '#8a4a2c', '#a8623a', '#c27a48', '#d6935a', '#e6ae72', '#f2c890', '#fae0b4'];
  const WATER = ['#0a3e52', '#0c5a6c', '#127a8a', '#1c98a6', '#36b6bc', '#64ccc8', '#9ee2d8', '#d6f6ec'];
  const REED = ['#22300e', '#344812', '#4c6418', '#688020', '#88a02a', '#acbc3e', '#d0d460'];
  const ORCH = ['#0e2010', '#1a3414', '#284c1a', '#3a661e', '#548424', '#72a02e', '#96bc3c', '#bcd454'];
  const WOOD = ['#2a1408', '#4a2a14', '#6a4220', '#8a5a2e', '#a87440', '#c89458'];
  V.AGRO = { DUNE, ADOBE, WATER, REED, ORCH, WOOD };

  /* ---------------- dunas ---------------- */
  /** Filas de dunas (barlovento largo e iluminado, cara de avalancha corta en sombra violeta, rizos) */
  V.dunes = function (pb, o) {
    const r = RNG(o.seed || 1), w = pb.w, n = o.rows || 3;
    const tops = [], crests = [];
    for (let ri = 0; ri < n; ri++) {
      const u = n === 1 ? 1 : ri / (n - 1);
      const yb = Math.round(lerp(o.y0, o.y1, u));
      const k = lerp(o.k0 ?? 0.4, o.k1 ?? 0.08, u);
      const R = ramp(o.ramp || DUNE, k, o.hazeCol), nR = R.length;
      const hMax = lerp(o.hBack ?? 16, o.hFront ?? 30, u);
      const prof = new Float32Array(w + 2);
      for (let x = -80; x < w + 60;) {
        const ww = r.int(o.wMin ?? 50, o.wMax ?? 130) * lerp(0.75, 1.2, u), hh = hMax * r.range(0.4, 1), cx = x + ww * 0.72;
        for (let xx = Math.floor(x); xx < x + ww; xx++) {
          if (xx < -1 || xx > w) continue;
          const h = xx <= cx ? hh * Math.pow(smooth(clamp((xx - x) / (ww * 0.72), 0, 1)), 1.2) : hh * Math.pow(Math.max(0, 1 - (xx - cx) / (ww * 0.28)), 1.7);
          if (h > prof[xx + 1]) prof[xx + 1] = h;
        }
        if (cx > 0 && cx < w) crests.push([Math.round(cx), Math.round(yb - hh), ri]);
        x += ww * r.range(0.42, 0.8);
      }
      for (let x = 0; x < w + 2; x++) prof[x] += 2 + fbm1((x - 1) * 0.018, 2, (o.seed || 1) + ri * 7) * 4;
      const top = new Int16Array(w);
      const yEnd = ri === n - 1 ? (o.fillTo ?? pb.h) : Math.min(pb.h, yb + 10);
      for (let x = 0; x < w; x++) {
        const p = prof[x + 1], s = (prof[x + 2] - prof[x]) * 0.5;
        const yt = Math.round(yb - p); top[x] = yt;
        const crest = prof[x + 1] >= prof[x] && prof[x + 1] >= prof[x + 2] && s > -0.4 && p > 6;
        for (let y = Math.max(0, yt); y < yEnd; y++) {
          const d = y - yt;
          const sl = clamp(s * 0.42, -0.34, 0.3) * Math.exp(-d / 9);
          let t = 0.58 + sl - d * 0.006;
          if (s > 0.05 && ((y + Math.round(Math.sin(x * 0.07 + ri) * 2.2 + x * 0.12)) % 5 === 0)) t -= 0.07; // rizos
          if (d === 0) t += s > 0 ? 0.16 : 0.05;
          if (crest && d < 2) t = 0.97;
          pb.data[y * w + x] = R[V.band(clamp(t, 0, 0.999), nR, x, y, 0.035, (o.seed || 1) + ri)];
        }
      }
      tops.push(top);
    }
    return { tops, crests };
  };

  /* ---------------- laguna y carrizal ---------------- */
  V.pond = function (pb, cx, y, hw, d, o = {}) {
    const k = o.k || 0, R = ramp(o.ramp || WATER, k), n = R.length, seed = o.seed || 3;
    const BANK = ramp(['#3a2a14', '#5a4020', '#7a5a2c', '#a07a40', '#c89c5a', '#e8c47c'], k);
    const REF = ramp(REED, k + 0.15);
    for (let x = Math.floor(cx - hw); x <= cx + hw; x++) {
      const q = 1 - ((x - cx) / hw) ** 2; if (q <= 0) continue;
      const y0 = y + Math.round((vnoise(x * 0.07, 1, seed) - 0.5) * 3);
      const y1 = y + Math.round(d * Math.sqrt(q) * (0.8 + 0.4 * vnoise(x * 0.05, 3, seed)));
      if (y1 <= y0 + 1) continue;
      for (let yy = y0; yy < y1; yy++) {
        const v = (yy - y0) / Math.max(1, y1 - y0);
        let t = 0.8 - v * 0.55;
        const wv = vnoise(x * 0.11, yy * 0.9, seed + 4);
        if (wv > 0.74) t += 0.14; else if (wv < 0.2) t -= 0.08;
        let u = R[V.band(clamp(t, 0, 0.999), n, x, yy, 0.04, seed)];
        if (yy < y0 + 2 && o.bank !== false) u = REF[1 + ((x >> 2) & 1)]; // reflejo de la orilla lejana
        V.put(pb, x, yy, u);
      }
      V.put(pb, x, y0 - 1, BANK[1]); V.put(pb, x, y1, BANK[4 + (hash2(x, 1, seed) < 0.4 ? 1 : 0)]); V.put(pb, x, y1 + 1, BANK[2]);
    }
    return { x0: cx - hw, x1: cx + hw, y, d };
  };
  V.reeds = function (pb, x0, x1, y, o = {}) {
    const k = o.k || 0, R = ramp(REED, k), r = RNG(o.seed || 5), hM = o.h || 9, den = o.density ?? 0.55;
    const CAT = ramp(['#3a1a0a', '#6a3a1a', '#8a5226'], k);
    for (let x = Math.round(x0); x < x1; x++) {
      if (vnoise(x * 0.09, 2, o.seed || 5) > den + 0.25 || !r.chance(0.6)) continue;
      const h = r.int(Math.round(hM * 0.4), hM), lean = r.range(-0.25, 0.3);
      for (let i = 0; i < h; i++) { const px = Math.round(x + lean * i), t = i / h; V.put(pb, px, y - i, R[clamp(Math.round(1 + t * 4 + (x & 1)), 0, R.length - 1)]); }
      if (r.chance(0.18)) { const px = Math.round(x + lean * h); V.put(pb, px, y - h, CAT[2]); V.put(pb, px, y - h + 1, CAT[1]); V.put(pb, px, y - h + 2, CAT[0]); }
    }
  };
  /* ---------------- arquitectura rural ---------------- */
  const DOORS = [['#0a4a4a', '#18a294', '#56dcc6'], ['#6a1424', '#c8384a', '#ff7a6a'], ['#7a5a0a', '#d8a428', '#ffe070'], ['#2a1e6a', '#5a44b8', '#a08ef0']];
  V.adobe = function (pb, x, y, w, h, seed, o = {}) {
    const k = o.k || 0, r = RNG(seed), d = o.d ?? Math.max(3, Math.round(w * 0.42));
    const { dy } = V.box3q(pb, x, y, w, h, d, { ramp: ADOBE, k, front: 6, side: 3, top: 7 });
    const D = ramp(ADOBE, k), WN = ramp(V.ARCH.BLUEW, k);
    // vigas que asoman bajo la cornisa
    for (let xx = x + 1; xx < x + w - 1; xx += 3) { V.put(pb, xx, y - h + 1, D[1]); V.put(pb, xx, y - h + 2, D[3]); }
    // puerta de color y ventana
    const DC = ramp(o.door || r.pick(DOORS), k);
    if (h >= 5) {
      const px = x + Math.max(1, Math.round(w * 0.35)), dh = Math.min(h - 2, 5);
      for (let yy = y - dh; yy < y; yy++) { V.put(pb, px, yy, DC[2]); V.put(pb, px + 1, yy, DC[1]); if (w > 9) V.put(pb, px + 2, yy, DC[0]); }
      if (w > 7) { const wx = x + w - 4; V.put(pb, wx, y - h + 3, WN[2]); V.put(pb, wx + 1, y - h + 3, WN[3]); V.put(pb, wx, y - h + 4, WN[1]); V.put(pb, wx + 1, y - h + 4, WN[2]); }
    }
    // macetas y parra en la azotea
    const G = ramp(ORCH, k);
    if (r.chance(0.6)) for (let i = 0; i < 3; i++) { const px = x + 1 + r.int(0, Math.max(0, w - 2)), py = y - h - 1 - r.int(0, Math.max(0, dy - 1)); V.put(pb, px, py, G[5]); V.put(pb, px + 1, py, G[4]); V.put(pb, px, py - 1, G[6]); }
    return { top: y - h - dy };
  };
  V.shadeHouse = function (pb, x, y, w, h, o = {}) {
    const k = o.k || 0, MESH = U(V.hzc('#163026', k)), LINE = U(V.hzc('#4a6a52', k)), P = ramp(WOOD, k), G = ramp(ORCH, k);
    const d = Math.round(w * 0.22), dx = Math.round(d * 0.55), dy = Math.round(d * 0.5);
    // plantas en mesas dentro
    for (let xx = x + 2; xx < x + w - 1; xx += 2) { const py = y - 2 - (xx & 2 ? 1 : 0); V.put(pb, xx, py, G[4 + (xx % 3 === 0 ? 2 : 0)]); V.put(pb, xx, py + 1, G[2]); }
    for (let xx = x + 1; xx < x + w; xx++) V.put(pb, xx, y - 1, P[1]);
    // malla de sombreo (frente y techo) translúcida con retícula
    for (let yy = y - h; yy < y - 1; yy++) for (let xx = x; xx < x + w; xx++) V.blend(pb, xx, yy, ((xx - x) % 4 === 0 || (yy - y) % 4 === 0) ? LINE : MESH, yy < y - h + 2 ? 0.85 : 0.5);
    V.poly(pb, [[x, y - h], [x + w, y - h], [x + w + dx, y - h - dy], [x + dx, y - h - dy]], (px, py) => V.mixU(V.get(pb, px, py) || MESH, (px % 4 === 0) ? LINE : MESH, 0.75));
    // postes
    for (const px of [x, x + Math.round(w / 2), x + w - 1]) for (let yy = y - h; yy < y; yy++) V.put(pb, px, yy, P[px === x ? 4 : 2]);
  };
  V.waterTower = function (pb, x, y, h, o = {}) {
    const k = o.k || 0, S = ramp(V.TECH.STEEL, k), hl = Math.round(h * 0.58), rx = Math.max(3, Math.round(h * 0.16));
    for (let i = 0; i < hl; i++) { const sp = Math.round(rx * (0.6 + 0.5 * (i / hl))); V.put(pb, x - sp, y - i, S[2]); V.put(pb, x + sp, y - i, S[1]); if (i % 5 === 2) for (let q = -sp; q <= sp; q++) if ((q + i) % 2 === 0) V.put(pb, x + q, y - i, S[3]); }
    const t = V.cylV(pb, x, y - hl, rx, h - hl, V.ARCH.WHITE, { k, dome: 0.45, bands: [[2, 2, ['#0c2e4a', '#217b9c', '#22c1e7', '#71dfef', '#abfafd']]] });
    return { top: t.top, x, y: y - hl };
  };
  /* ---------------- cultivos ---------------- */
  const CROPK = {
    lettuce: (pb, x, y, s, G, F) => { V.put(pb, x, y - 1, G[5]); V.put(pb, x + 1, y - 1, G[6]); V.put(pb, x, y, G[3]); V.put(pb, x + 1, y, G[4]); if (s > 1.6) { V.put(pb, x - 1, y, G[2]); V.put(pb, x + 1, y - 2, G[6]); } },
    tomato: (pb, x, y, s, G, F) => { V.put(pb, x, y - 2, G[4]); V.put(pb, x, y - 1, G[3]); V.put(pb, x + 1, y - 1, F.red); V.put(pb, x, y, G[2]); if (s > 1.6) V.put(pb, x - 1, y - 2, F.red2); },
    maize: (pb, x, y, s, G, F) => { const hh = Math.round(2 + s * 1.5); for (let i = 0; i < hh; i++) V.put(pb, x, y - i, G[2 + Math.min(4, i)]); V.put(pb, x + 1, y - hh + 1, G[6]); V.put(pb, x, y - hh, F.gold); },
    flowers: (pb, x, y, s, G, F) => { V.put(pb, x, y, G[3]); V.put(pb, x, y - 1, F.pal[(x >> 1) & 3]); V.put(pb, x + 1, y - 1, F.pal[((x >> 1) + 1) & 3]); },
    squash: (pb, x, y, s, G, F) => { V.put(pb, x, y, G[3]); V.put(pb, x + 1, y, G[4]); V.put(pb, x - 1, y, G[2]); if ((x & 3) === 0) V.put(pb, x, y - 1, F.orange); else V.put(pb, x, y - 1, G[5]); },
  };
  V.cropRows = function (pb, x0, x1, y0, y1, o = {}) {
    const k = o.k || 0, r = RNG(o.seed || 7), G = ramp(o.crop || ORCH, k);
    const SOIL = ramp(['#3a2210', '#5a3618', '#7a4a22', '#9a5e2e', '#b8743a'], k), CH = ramp(['#065481', '#0a8ab0', '#11bedd', '#3adcf1', '#bde9f2'], k);
    const F = { red: U(V.hzc('#e8402a', k)), red2: U(V.hzc('#ff7a5a', k)), gold: U(V.hzc('#f0d050', k)), orange: U(V.hzc('#f08a2a', k)),
      pal: [U(V.hzc('#f060b8', k)), U(V.hzc('#ffd84a', k)), U(V.hzc('#fff4f0', k)), U(V.hzc('#ff7a5a', k))] };
    const kinds = o.kinds || ['lettuce', 'tomato', 'maize', 'flowers', 'squash'];
    const channels = [];
    // suelo labrado con borde superior irregular y murete delantero
    const sd = o.seed || 7, topAt = (x) => y0 + Math.round((vnoise(x * 0.035, 7, sd) - 0.5) * 6 + (vnoise(x * 0.2, 9, sd) - 0.5) * 1.5);
    const LIP = ramp(V.AGRO.ADOBE, k);
    for (let x = Math.round(x0); x < x1; x++) {
      for (let y = topAt(x); y < y1; y++) V.put(pb, x, y, SOIL[1 + ((y & 1) ? 0 : 1) + (hash2(x >> 1, y, 3) < 0.2 ? 1 : 0)]);
      V.put(pb, x, y1, LIP[6 + (hash2(x >> 2, 1, sd) < 0.3 ? 1 : 0)]); V.put(pb, x, y1 + 1, LIP[3 + ((x >> 3) & 1)]); V.put(pb, x, y1 + 2, LIP[1]);
    }
    let y = y0 + 1, ri = 0;
    while (y < y1) {
      const v = (y - y0) / Math.max(1, y1 - y0), s = lerp(1, 2.4, v), sp = Math.round(lerp(2, 4, v));
      const kind = kinds[ri % kinds.length];
      if (o.channelEvery && ri % o.channelEvery === o.channelEvery - 1) {
        for (let x = Math.round(x0) + 1; x < x1 - 1; x++) if (y > topAt(x)) { V.put(pb, x, y, CH[(x + ri) % 11 === 0 ? 4 : 2]); V.put(pb, x, y + 1, CH[1]); }
        channels.push([Math.round(x0) + 1, Math.round(x1) - 1, y]);
        y += 3; ri++; continue;
      }
      const per = kind === 'maize' ? 2 : 3;
      for (let x = Math.round(x0) + 1 + (ri & 1); x < x1 - 1; x += per) if (y > topAt(x) + 1) CROPK[kind](pb, x, y, s, G, F);
      y += sp + 1; ri++;
    }
    return { channels };
  };
  V.orchard = function (pb, x0, x1, y0, y1, o = {}) {
    const k = o.k || 0, r = RNG(o.seed || 9), rows = o.rows || 4, SH = U(V.hzc('#2a2014', k));
    const FR = [U(V.hzc('#ff8a2a', k)), U(V.hzc('#ffd040', k)), U(V.hzc('#e8402a', k))];
    for (let ri = 0; ri < rows; ri++) {
      const v = rows === 1 ? 1 : ri / (rows - 1), y = Math.round(lerp(y0, y1, v)), rr = Math.round(lerp(o.r0 ?? 2, o.r1 ?? 4, v));
      const gap = Math.round(rr * 2 + (o.gap ?? 3));
      for (let x = x0 + (ri & 1) * Math.round(gap / 2); x < x1; x += gap + r.int(-1, 1)) {
        for (let q = -rr; q <= rr; q++) V.blend(pb, x + q + 1, y + 1, SH, 0.45);
        V.tree(pb, x, y, rr, (o.seed || 9) * 31 + x + ri * 7, { k, ramp: o.ramp || ORCH });
        if (o.fruit !== false) for (let i = 0; i < rr; i++) { const fx = x + r.int(-rr, rr), fy = y - Math.round(rr * 0.7) - rr - r.int(-rr + 1, rr - 1); if (V.get(pb, fx, fy) >>> 24) V.put(pb, fx, fy, FR[(fx + fy) % 3 === 0 ? 2 : r.int(0, 1)]); }
      }
    }
  };
  /* ---------------- terrazas en curvas de nivel ---------------- */
  const TWALL = ['#3e1a14', '#5e2a1e', '#82494a', '#a0583a', '#c0703e', '#e1956c', '#f0b07a', '#f8c888'];
  const TSOIL = ['#4a3418', '#5a431c', '#7a5a2a', '#86502d', '#a8683a', '#cb824a'];
  const TCROP = ['#1c3a1c', '#2e5426', '#3f6e2e', '#5a8a34', '#7aa83c', '#99c04a', '#bfd85a', '#e0e87a'];
  const TCHAN = ['#065481', '#0a8ab0', '#11bedd', '#3adcf1', '#bde9f2'];
  /**
   * Terrazas que abrazan un cerro en 3/4: cada escalón es un arco ∪ (el centro, más cercano,
   * queda más bajo), más ancho cuanto más abajo, con muro de piedra, cara de cultivo,
   * canal turquesa y cascadas entre escalones. o = {cx, yTop, steps, stepH:[a,b], hwTop, hwBot,
   * bow, wallK, k, seed, kinds[], falls:[{x,w,from}], wobble} → {steps, falls, yEnd}
   */
  V.contourTerraces = function (pb, o) {
    const r = RNG(o.seed || 1), k = o.k || 0;
    const Wl = ramp(o.wall || TWALL, k), So = ramp(TSOIL, k), Cr = ramp(o.crop || TCROP, k), Ch = ramp(TCHAN, k);
    const nW = Wl.length, nC = Cr.length, n = o.steps || 6, kinds = o.kinds || ['rows', 'vine', 'rows', 'orchard'];
    const FLW = [U(V.hzc('#f060b8', k)), U(V.hzc('#ffd84a', k)), U(V.hzc('#fff4f0', k)), U(V.hzc('#ff7a5a', k))];
    const steps = [];
    let y = o.yTop;
    for (let i = 0; i < n; i++) {
      const sh = r.int(o.stepH?.[0] ?? 9, o.stepH?.[1] ?? 12), wh = Math.max(3, Math.round(sh * (o.wallK ?? 0.42)));
      const v = n === 1 ? 1 : i / (n - 1);
      steps.push({ i, y, sh, wh, td: sh - wh, hw: lerp(o.hwTop, o.hwBot, v) * r.range(0.93, 1.07), c: o.cx + r.range(-1, 1) * (o.wobble ?? 5), bow: (o.bow ?? 8) * (0.55 + 0.45 * v), kind: kinds[i % kinds.length], seed: r.int(1, 9999) });
      y += sh;
    }
    const geo = (s, x) => {
      const u = (x - s.c) / s.hw; if (Math.abs(u) > 1 - (hash2(x >> 1, s.i, 31) * 0.05)) return null;
      const e = Math.sqrt(Math.max(0, 1 - u * u));
      const yf = Math.round(s.y + s.bow * (1 - u * u));
      return { u, e, yf, td: Math.max(1, Math.round(s.td * (0.45 + 0.55 * e))), wh: Math.max(1, Math.round(s.wh * (0.3 + 0.7 * e))) };
    };
    for (const s of steps) {
      const x0 = Math.floor(s.c - s.hw), x1 = Math.ceil(s.c + s.hw), bw = r.int(5, 8);
      for (let x = x0; x <= x1; x++) {
        const G = geo(s, x); if (!G) continue;
        // cara de cultivo
        for (let yy = G.yf; yy < G.yf + G.td; yy++) V.put(pb, x, yy, So[1 + ((yy - G.yf) & 1) + (hash2(x, yy, 5) < 0.25 ? 1 : 0)]);
        // muro de piedra (bloques, borde superior claro, AO al pie); lado izquierdo más iluminado
        const yw = G.yf + G.td;
        for (let yy = yw; yy < yw + G.wh; yy++) {
          const v = (yy - yw) / Math.max(1, G.wh);
          const blk = hash2(Math.floor(x / bw), s.i * 17 + ((yy - yw) >> 2), 11);
          let i = Math.round(nW * 0.68 - v * 2 + (blk - 0.5) * 2 - G.u * 1.4);
          if (x % bw === 0 && yy > yw) i = 2 + (blk < 0.5 ? 0 : 1);
          if (yy === yw) i = nW - 1 - (G.u > 0.5 ? 1 : 0);
          if (yy === yw + G.wh - 1) i = 1;
          V.put(pb, x, yy, Wl[clamp(i, 0, nW - 1)]);
        }
        V.put(pb, x, yw + G.wh, V.shU(V.get(pb, x, yw + G.wh) || Wl[1], -0.25, 260));
        // canal turquesa en el borde de la cara (escalones alternos)
        if (s.i % 2 === 1 && G.e > 0.25) V.put(pb, x, yw - 1, Ch[(x + s.i) % 9 === 0 ? 4 : 2]);
        // plantas colgantes del borde
        if (hash2(x, s.i, 21) < 0.12) { const len = 1 + (hash2(x, s.i, 22) * 3 | 0); for (let q = 0; q < len; q++) V.put(pb, x, yw + 1 + q, Cr[Math.max(0, 3 - q)]); }
      }
      // hileras de cultivo que siguen el arco
      const per = s.kind === 'vine' ? 2 : 3;
      for (let x = x0 + 1; x < x1; x++) {
        const G = geo(s, x); if (!G || G.td < 2) continue;
        const rowsN = Math.max(1, Math.floor(G.td / 2));
        for (let ri = 0; ri < rowsN; ri++) {
          if ((x + ri * 2) % per) continue;
          const ry = G.yf + ri * 2 + 1, hb = hash2(x, ry, 13 + s.i);
          const base = clamp(Math.round(nC * 0.34 + (ri / Math.max(1, rowsN - 1)) * 1.5 + (hb - 0.5) * 2 - G.u * 0.8), 1, nC - 3);
          if (s.kind === 'flowers' && hb < 0.4) { V.put(pb, x, ry - 1, FLW[(x + ri) & 3]); V.put(pb, x + 1, ry - 1, FLW[(x + ri + 1) & 3]); V.put(pb, x, ry, Cr[base]); continue; }
          if (s.kind === 'vine') { V.put(pb, x, ry - 2, Cr[base + 2]); V.put(pb, x, ry - 1, Cr[base + 1]); V.put(pb, x, ry, Cr[base]); continue; }
          V.put(pb, x, ry - 1, Cr[base + 2]); V.put(pb, x + 1, ry - 1, Cr[base + 1]); V.put(pb, x, ry, Cr[base + 1]); V.put(pb, x + 1, ry, Cr[base - 1]);
        }
        if (hash2(x, G.yf, 23) < 0.5) V.put(pb, x, G.yf + G.td - 1, Cr[clamp(Math.round(nC * 0.55 + (hash2(x, 1, 24) - 0.5) * 3), 1, nC - 1)]);
      }
      if (s.kind === 'orchard') for (let x = x0 + 4; x < x1 - 3; x += r.int(5, 8)) { const G = geo(s, x); if (G && G.td > 2) V.tree(pb, x, G.yf + G.td - 1, r.int(2, 3), s.seed + x, { k, ramp: o.crop || TCROP }); }
    }
    // cascadas entre escalones
    const falls = [];
    for (const f of (o.falls || [])) {
      const w = f.w || 4;
      for (let si = f.from ?? 0; si < Math.min(steps.length, (f.to ?? 99) + 1); si++) {
        const s = steps[si], G = geo(s, f.x + w / 2); if (!G || Math.abs(G.u) > 0.85) continue;
        const y0 = G.yf + G.td - 1, y1 = y0 + G.wh + 1;
        V.fall(pb, Math.round(f.x), y0, y1, w, { k });
        falls.push({ x: Math.round(f.x), y0, y1, w });
        for (let x = f.x - 2; x < f.x + w + 2; x++) { V.put(pb, x, y1, Ch[3]); V.put(pb, x, y1 + 1, Ch[2]); }
      }
    }
    return { steps, falls, yEnd: y };
  };
  /* ---------------- molino de bombeo ---------------- */
  V.windPump = function (pb, x, y, h, o = {}) {
    const k = o.k || 0, S = ramp(V.TECH.STEEL, k);
    for (let i = 0; i < h; i++) {
      const sp = Math.round(lerp(4, 1, i / h));
      V.put(pb, x - sp, y - i, S[3]); V.put(pb, x + sp, y - i, S[1]);
      if (i % 6 === 3 && sp > 1) for (let q = -sp + 1; q < sp; q++) V.put(pb, x + q, y - i + (q & 1), S[2]);
    }
    // cola (veleta) a la derecha
    const hy = y - h - 1;
    for (let q = 1; q < 9; q++) V.put(pb, x + q, hy, S[4]);
    V.rect(pb, x + 7, hy - 3, 3, 4, S[6]); V.put(pb, x + 7, hy - 3, S[7]);
    return { hx: x, hy };
  };
  const _wheel = new Map();
  V.pumpWheel = function (R, o = {}) {
    const key = R + '|' + (o.k || 0); let s = _wheel.get(key); if (s) return s;
    const C = ramp(V.TECH.STEEL, o.k), S = R * 2 + 3, c = R + 1;
    s = V.strip(6, S, S, (pb, f) => {
      for (let b = 0; b < 12; b++) {
        const a = b / 12 * TAU + f / 6 * (TAU / 12);
        for (let i = 2; i <= R; i++) V.put(pb, Math.round(c + Math.cos(a) * i), Math.round(c + Math.sin(a) * i), C[i > R - 2 ? 7 : (b & 1) ? 5 : 6]);
      }
      for (let a = 0; a < TAU; a += 0.2) V.put(pb, Math.round(c + Math.cos(a) * R), Math.round(c + Math.sin(a) * R), C[3]);
      V.put(pb, c, c, C[1]);
    });
    s.c0 = c; _wheel.set(key, s); return s;
  };
  /** Garza blanca posada (lejana) */
  V.egret = function (pb, x, y, o = {}) {
    const k = o.k || 0, Wt = ramp(['#8a90a8', '#c8ccd8', '#f4f6fb', '#ffffff'], k), BK = U(V.hzc('#e8b030', k)), LG = U(V.hzc('#3a3028', k));
    const f = o.flip ? -1 : 1;
    V.put(pb, x, y, LG); V.put(pb, x, y - 1, LG); V.put(pb, x + f, y - 1, LG);
    for (let yy = 2; yy < 5; yy++) { V.put(pb, x, y - yy, Wt[2]); V.put(pb, x - f, y - yy, Wt[1]); }
    V.put(pb, x + f, y - 4, Wt[3]); V.put(pb, x + f, y - 5, Wt[2]); V.put(pb, x + f, y - 6, Wt[3]); V.put(pb, x + 2 * f, y - 6, BK);
  };
  /* ---------------- dinámico: bandadas, sol, rayos, arena ---------------- */
  V.drawFlock = function (g, fl, ox, oy, t) {
    const span = fl.span || 900, n = fl.n || 7, dir = (fl.sp || 10) < 0 ? -1 : 1;
    const hx = fl.x + (((t * (fl.sp || 10) + (fl.ph || 0)) % span) + span) % span - span / 2, hy = fl.y + Math.sin(t * 0.3 + fl.x) * 4;
    g.fillStyle = fl.col || '#f8f8ff';
    for (let j = 0; j < n; j++) {
      const m = j - (n - 1) / 2, x = Math.round(hx + ox - Math.abs(m) * 5 * dir), y = Math.round(hy + oy + Math.abs(m) * 2.5 + Math.sin(t * 1.3 + j) * 0.8);
      if (x < -4 || x > W + 4) continue;
      const up = (Math.floor(t * 5 + j * 0.7) % 2) === 0;
      g.fillRect(x - 2, y - (up ? 1 : 0), 2, 1); g.fillRect(x + 1, y - (up ? 1 : 0), 2, 1); g.fillRect(x, y, 1, 1);
    }
  };
  /** Halo aditivo del sol: corona amplia en anillos + núcleo; pulsa muy despacio */
  V.sunBloom = function (g, sun, t, o = {}) {
    const R1 = o.r || Math.round(sun.halo * 2.6), a = (o.a ?? 0.3) * (1 + 0.05 * Math.sin(t * 0.6));
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = a; g.drawImage(V.glow(R1, o.col || '#ffe8b0', 7, 0.34), Math.round(sun.x - R1), Math.round(sun.y - R1));
    const R2 = Math.round(sun.r * 2.2);
    g.globalAlpha = a * 1.4; g.drawImage(V.glow(R2, '#fff8dc', 4, 0.45), Math.round(sun.x - R2), Math.round(sun.y - R2));
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  };
  /** Rayos crepusculares en 3 niveles de alfa, abiertos en abanico desde (sx, sy) */
  V.rays = function (w, h, sx, sy, o = {}) {
    const r = RNG(o.seed || 17), n = o.n || 9, len = o.len || h * 1.2, a0 = o.a0 ?? 0.16;
    const pb = new PixelBuffer(w, h), u = U(o.col || '#fff0c8') & 0xffffff;
    const rays = [];
    for (let i = 0; i < n; i++) rays.push([lerp(o.a1 ?? 0.35, o.a2 ?? 2.8, (i + r.range(0.2, 0.8)) / n), r.range(0.025, 0.06), r.range(0.5, 1)]);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = x - sx, dy = y - sy, d = Math.hypot(dx, dy); if (d < 6 || dy < -4) continue;
      const ang = Math.atan2(dy, dx);
      let I = 0;
      for (const [ra, rw, rs] of rays) { const q = 1 - Math.abs(ang - ra) / rw; if (q > I / rs) I = Math.max(I, q * rs); }
      if (I <= 0) continue;
      const fade = clamp(1 - d / len, 0, 1);
      const lv = Math.floor(I * fade * 3.2); if (lv <= 0) continue;
      pb.data[y * w + x] = ((Math.round(a0 * Math.min(3, lv) / 3 * 255) << 24) | u) >>> 0;
    }
    return pb.toCanvas();
  };
  V.drawSandWisps = function (g, crests, ox, oy, t, o = {}) {
    const n = o.n || 4, wind = o.wind ?? 1;
    g.fillStyle = o.col || '#fde6b4';
    for (let ci = 0; ci < crests.length; ci++) {
      const [cx, cy] = crests[ci], sx = cx + ox; if (sx < -30 || sx > W + 10) continue;
      for (let i = 0; i < n; i++) {
        const u = ((t * 0.5 * wind + i / n + ci * 0.37) % 1);
        g.globalAlpha = (1 - u) * (o.a ?? 0.6);
        g.fillRect(Math.round(sx + u * 22 * wind), Math.round(cy + oy - u * 3 + Math.sin(u * 9 + ci) * 1.2), u < 0.3 ? 2 : 1, 1);
      }
    }
    g.globalAlpha = 1;
  };
})();
