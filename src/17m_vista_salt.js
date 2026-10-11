/* =====================================================================
   17m_vista_salt.js — Cañones de sal del panorama (VISTA), al anochecer:
   paredes azul-violeta con vetas de sal, salinas de evaporación en
   terrazas (color por salinidad: turquesa → verde → rosa/magenta →
   costra blanca), cristales translúcidos, chimeneas de roca, emisario
   con boyas de vigilancia; dinámicos: estrellas, flamencos lejanos,
   boyas que parpadean, pluma de salmuera, brillos de cristal.
   API:
     VISTA.RAMPS.canyonDusk / saltCrust
     VISTA.saltVeins(pb, {seed, k, col, every, y0, y1})        vetas sobre los píxeles de roca
     VISTA.saltPans(pb, {x0, x1, y0, rows, seed, k, sky}) → {ponds:[{x,y,w,h,col}], glints}
     VISTA.crystals(pb, x, y, s, seed, {k}) → {glints:[[x,y]]}
     VISTA.hoodoo(pb, x, y, h, w, seed, {k, ramp})
     VISTA.butte(pb, x, y, w, h, seed, {k, ramp, warm}) → {top, x0}   farallón de techo plano
     VISTA.saltCrust(pb, x0, x1, y0, y1, {k, ramp, seed, sparse})      costra lisa con grietas
     VISTA.drawStars(g, n, t, seed, {y1, a})
     VISTA.drawFlamingos(g, list, ox, oy, t)    list: [{x, y, s}]
     VISTA.drawBuoys(g, list, ox, oy, t)        list: [[x, y, col]]
     VISTA.drawPlume(g, x, y, t, {n, len, col})  pluma que se hunde y diluye
   ===================================================================== */
(() => {
  const V = VISTA;
  const ramp = (r, k) => V.P32(V.hz(r, k || 0));
  V.RAMPS.canyonDusk = ['#140f36', '#1e164a', '#2c1e60', '#3e2a74', '#563a86', '#704c96', '#8e62a4', '#ac7eb2', '#cc9cbc', '#ecc0c4'];
  V.RAMPS.saltCrust = ['#8a6a8a', '#b090b0', '#d0b4cc', '#e8d4e4', '#f6eaf2', '#ffffff'];
  /** Vetas de sal: líneas claras casi horizontales que siguen los estratos (solo sobre roca) */
  V.saltVeins = function (pb, o = {}) {
    const col = U(o.col || '#ffe8f4'), seed = o.seed || 3, ev = o.every || 11, y0 = o.y0 ?? 0, y1 = o.y1 ?? pb.h;
    for (let y = y0; y < y1; y++) for (let x = 0; x < pb.w; x++) {
      const i = y * pb.w + x, c = pb.data[i]; if ((c >>> 24) !== 255) continue;
      const off = Math.floor(fbm1(x * 0.012, 2, seed) * 9);
      if (((y + off) % ev) !== 0) continue;
      const hh = hash2(x >> 2, y, seed + 1);
      if (hh < 0.55) pb.data[i] = V.mixU(c, col, hh < 0.25 ? 0.75 : 0.45);
    }
  };
  /** Salinas en terrazas: filas de balsas en 3/4 con diques de sal; color según salinidad */
  V.saltPans = function (pb, o) {
    const r = RNG(o.seed || 5), k = o.k || 0, ponds = [], glints = [];
    const SAL = [['#0a6a7a', '#12a0a8', '#3ad0c8', '#a6f0e4'], ['#1a6a5a', '#2a9a7a', '#5ac898', '#b4ecc4'], ['#6a6a3a', '#9a9a4a', '#c8c06a', '#ece6a8'], ['#8a2a6a', '#c04a90', '#e878b4', '#ffc4e0'], ['#a03a6a', '#d0609a', '#f490c4', '#ffd4ec'], ['#b0a0b4', '#d8c8dc', '#f0e6f0', '#ffffff']];
    const BER = ramp(V.RAMPS.saltCrust, k), nB = BER.length, sky = U(o.sky || '#f8c0b0');
    let y = o.y0;
    for (let row = 0; row < (o.rows || 4); row++) {
      const t = row / Math.max(1, (o.rows || 4) - 1), ph = Math.round(10 + t * 12), dy = Math.round(2 + t * 2), bw = 2 + Math.round(t);
      let si = row % 2 ? 1 : 0;
      for (let x = o.x0 - r.int(0, 30); x < o.x1;) {
        const pw = r.int(40, 90) + Math.round(t * 40);
        if (o.skip && o.skip(x, y)) { x += pw; continue; }
        si = Math.min(SAL.length - 1, si + (r.chance(0.6) ? 1 : 0)); if (si === SAL.length - 1 && r.chance(0.5)) si = r.int(0, 2);
        const C = ramp(SAL[si], k);
        // dique superior (cara de arriba de la balsa en 3/4) y lámina de agua
        for (let yy = 0; yy < ph; yy++) for (let xx = 0; xx < pw; xx++) {
          const px = x + xx + Math.round((ph - yy) * 0.4), py = y + yy;
          let u;
          if (yy < bw || xx < bw || xx >= pw - bw) u = BER[nB - 1 - (yy < bw ? (yy === bw - 1 ? 1 : 0) : (xx >= pw - bw ? 2 : 1))];
          else if (yy === ph - 1) u = BER[2];
          else if (yy === bw) u = C[0];
          else {
            const tt = (yy / ph) * 0.6 + (hash2(px >> 2, py, 5) < 0.12 ? 0.2 : 0);
            u = C[clamp(Math.round(2 - tt * 2), 0, 3)];
            if (((xx + yy * 3) % 37) < 2 && yy < ph * 0.5) u = V.mixU(u, sky, 0.55); // reflejo del cielo
          }
          V.put(pb, px, py, u);
        }
        // talud del dique delantero (sombra violeta) y costra
        for (let xx = 0; xx < pw; xx++) for (let q = 0; q < dy; q++) V.put(pb, x + xx, y + ph + q, BER[q === 0 ? 3 : 1]);
        ponds.push({ x, y, w: pw, h: ph, si });
        if (si < 5) glints.push({ x: x + 2, y: y + 1 + (ph >> 2), len: pw - 6, ph: r.range(0, 1.6), sp: 0.12, col: '#ffe8f0', w: 2 });
        x += pw + r.int(3, 7);
      }
      y += ph + dy;
    }
    return { ponds, glints, y1: y };
  };
  /** Costra salina lisa en bandas con grietas cortas irregulares (sin cuadrícula) */
  V.saltCrust = function (pb, x0, x1, y0, y1, o = {}) {
    const CR = ramp(o.ramp || V.RAMPS.saltCrust, o.k), n = CR.length, seed = o.seed || 7;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const t = (y - y0) / Math.max(1, y1 - y0); V.put(pb, x, y, CR[V.band(clamp(0.82 - t * 0.35 + (vnoise(x * 0.04, y * 0.15, seed) - 0.5) * 0.18, 0, 0.999), n, x, y, 0.06, seed)]); }
    const r = RNG(seed), nC = Math.round((x1 - x0) * (y1 - y0) / (o.sparse || 60));
    for (let i = 0; i < nC; i++) { let x = r.int(x0, x1 - 1), y = r.int(y0, y1 - 1); const len = r.int(3, 8), dx = r.pick([-1, 1]); for (let q = 0; q < len; q++) { V.put(pb, x, y, CR[1]); V.put(pb, x, y + 1, CR[n - 1]); x += dx; if (r.chance(0.4)) y += r.pick([-1, 1]) * (r.chance(0.5) ? 1 : 0); } }
  };
  /** Racimo de cristales de sal translúcidos (prismas con cara clara y arista cian) */
  V.crystals = function (pb, x, y, s, seed, o = {}) {
    const r = RNG(seed), k = o.k || 0, C = ramp(['#4a6aa0', '#7aa8d8', '#a8d8f0', '#d8f6ff', '#ffffff'], k), glints = [];
    for (let i = 0; i < 3 + s; i++) {
      const h = r.int(3, 4 + s * 2), w = r.int(1, 2), cx = x + r.int(-s - 1, s + 1), lean = r.range(-0.4, 0.4);
      for (let q = 0; q < h; q++) for (let xx = -w; xx <= w; xx++) { const px = Math.round(cx + xx + lean * q), py = y - q; V.put(pb, px, py, C[q === h - 1 ? 4 : xx < 0 ? 3 : xx === 0 ? 2 : 1]); }
      glints.push([Math.round(cx + lean * h), y - h]);
    }
    return { glints };
  };
  /** Chimenea de roca (hoodoo): fuste con estratos y sombrero más duro */
  V.hoodoo = function (pb, x, y, h, w, seed, o = {}) {
    const R = ramp(o.ramp || V.RAMPS.canyonDusk, o.k), n = R.length;
    for (let q = 0; q < h; q++) {
      const t = q / h, hw = Math.max(1, Math.round(w * (0.55 + 0.25 * Math.sin(t * 7 + seed) + (t > 0.86 ? 0.4 : 0)) / 2));
      for (let xx = -hw; xx <= hw; xx++) {
        const u = (xx + hw) / (2 * hw + 0.01);
        let i = Math.round((0.75 - u * 0.5) * (n - 1)) - (((y - q) % 5) === 0 ? 1 : 0);
        if (t > 0.86) i = Math.min(n - 1, i + 1);
        V.put(pb, x + xx, y - q, R[clamp(i - (u > 0.8 ? 1 : 0), 0, n - 1)]);
      }
    }
  };
  /**
   * Farallón (butte) de techo plano: caras verticales con estratos, cara del lado del
   * sol (derecha) encendida en rosa cálido, cara de sombra azul, talud de derrubios.
   */
  V.butte = function (pb, x, y, w, h, seed, o = {}) {
    const k = o.k || 0, R = ramp(o.ramp || V.RAMPS.canyonDusk, k), n = R.length, WARM = U(V.hzc(o.warm || '#ffb0a0', k));
    const top = new Int16Array(w + 24).fill(32767), x0 = x - 12;
    for (let xx = -12; xx < w + 12; xx++) {
      const edge = xx < 0 ? (xx + 12) / 12 : xx >= w ? 1 - (xx - w) / 12 : 1;
      const cap = Math.round((fbm1((x + xx) * 0.09, 2, seed) - 0.5) * 4);
      const th = edge < 1 ? Math.round(h * 0.28 * Math.pow(edge, 1.5)) : h + cap;
      const ty = y - th; top[xx + 12] = ty;
      const u = clamp(xx / Math.max(1, w), 0, 1), lit = xx >= w - 3 ? 0.9 : xx < 2 ? 0.25 : 0.4 + u * 0.3;
      for (let yy = ty; yy <= y; yy++) {
        const d = yy - ty, sv = yy + Math.round(vnoise((x + xx) * 0.05, 0.4, seed) * 5), layer = Math.floor(sv / 6);
        let t = (edge < 1 ? 0.45 : lit) + (layer % 2 ? 0.05 : -0.03) - (d / Math.max(1, h)) * 0.25 + (d < 2 ? 0.25 : 0) + (hash2((x + xx) >> 1, yy >> 1, seed) - 0.5) * 0.08;
        if (edge >= 1 && hash2((x + xx) >> 2, 0, seed + 5) < 0.08 && d > 4) t -= 0.2;
        let c = R[V.band(clamp(t, 0, 0.999), n, x + xx, yy, 0.04, seed)];
        if (xx >= w - 3 && edge >= 1) c = V.mixU(c, WARM, 0.45);
        V.put(pb, x + xx, yy, c);
      }
      if (edge >= 1) V.put(pb, x + xx, ty, V.mixU(R[n - 1], WARM, 0.5));
    }
    return { top, x0 };
  };
  /**
   * Paredes del cañón en 3/4 (sustituyen a las losas planas de V.mesas en el Nivel 03): mesetas con cara superior
   * visible (plano claro de 3–6 px), filo de luz cálida #fbc371 de 1 px, estratos en bandas con desplome y sombra
   * bajo cada repisa (rampa con desplazamiento de tono), cárcavas verticales con arista iluminada, lado de sombra,
   * talud de derrubios y contorno sel-out. Sin tramado: todo en bandas.
   */
  V.mesas3q = function (pb, o = {}) {
    const r = RNG(o.seed || 5), k = o.k || 0, R = ramp(o.ramp || V.RAMPS.canyonDusk, k), n = R.length, yB = o.yBase ?? pb.h - 1;
    const WARM = U(V.hzc(o.warm || '#fbc371', k)), seed = o.seed || 5;
    const top = new Int16Array(pb.w).fill(yB), id = new Int16Array(pb.w).fill(-1), M = [];
    for (let x = -40; x < pb.w + 40;) {
      const w = r.int(50, 170), h = r.int(o.hMin || 14, o.hMax || 40), talus = r.int(10, 22);
      if (r.chance(0.22)) { x += r.int(20, 60); continue; }
      const m = { x0: x, x1: x + w, h, tf: clamp(Math.round(h * 0.05) + 2, 3, 6), lh: r.int(5, 8), ph: r.range(0, 9) };
      M.push(m);
      for (let xx = x - talus; xx < x + w + talus; xx++) {
        if (xx < 0 || xx >= pb.w) continue;
        const edge = xx < x ? (xx - (x - talus)) / talus : xx >= x + w ? 1 - (xx - (x + w)) / talus : 1;
        const hh = Math.round(h * (edge < 1 ? Math.pow(edge, 1.5) * 0.7 : 1) + (fbm1(xx * 0.08, 2, seed) - 0.5) * 3);
        if (yB - hh < top[xx]) { top[xx] = yB - hh; id[xx] = edge < 1 ? -2 - (M.length - 1) : M.length - 1; }
      }
      x += w + r.int(8, 50);
    }
    for (let x = 0; x < pb.w; x++) {
      const t0 = top[x]; if (t0 >= yB) continue;
      const mi = id[x], talus = mi < -1, m = M[talus ? -2 - mi : mi];
      if (!m) continue;
      const u = clamp((x - m.x0) / Math.max(1, m.x1 - m.x0), 0, 1);
      const shade = talus ? (x > m.x1 ? -2 : -1) : (u > 0.78 ? -1 : 0) + (u < 0.06 ? 1 : 0);
      const gul = !talus && PFK.vn(x * 0.21, 0, seed + 3) > 0.7, gulLen = Math.round(m.h * (0.35 + PFK.vn(x * 0.05, 2, seed + 4) * 0.5));
      const gulEdge = !talus && !gul && PFK.vn((x + 1) * 0.21, 0, seed + 3) > 0.7;
      const tl = top[Math.max(0, x - 1)], tr = top[Math.min(pb.w - 1, x + 1)];
      for (let y = t0; y <= yB; y++) {
        const d = y - t0;
        let i;
        if (!talus && d < m.tf) i = d === 0 ? n - 1 : (d < m.tf - 1 ? n - 2 : n - 3);       // cara superior al sol
        else {
          const sv = y + Math.round(PFK.vn(x * 0.03, 0, seed + 1) * 4 + m.ph), L = Math.floor(sv / m.lh), ly = sv - L * m.lh;
          const base = [5, 4, 6, 4, 5, 3, 4, 6][((L % 8) + 8) % 8];
          i = base + (ly === 0 ? 1 : ly === m.lh - 1 ? -1 : 0) + shade - Math.floor((d / Math.max(1, m.h)) * 2.2);
          if (talus) i = 3 + shade - Math.floor((y - t0) / 6);
          if (gul && d >= m.tf && d < gulLen) i -= 2;
          else if (gulEdge && d >= m.tf && d < gulLen) i += 1;
        }
        let c = R[clamp(i, 0, n - 1)];
        // contorno sel-out: el borde de la silueta se oscurece con la propia rampa (no negro)
        if (d > 0 && ((tl > y && x > 0) || (tr > y && x < pb.w - 1))) c = R[clamp(i - 2, 1, n - 1)];
        if (d === 0 && !talus) c = V.mixU(R[n - 1], WARM, 0.6);
        else if (d === 0) c = V.mixU(R[clamp(5 + shade, 0, n - 1)], WARM, 0.35);
        V.put(pb, x, y, c);
      }
    }
    return { top };
  };
  /* ---------------- dinámicos ---------------- */
  V.drawStars = function (g, n, t, seed, o = {}) {
    for (let i = 0; i < n; i++) {
      const x = Math.round(hash1(i, seed) * W), y = Math.round(Math.pow(hash1(i, seed + 1), 1.6) * (o.y1 ?? 90));
      const tw = (Math.sin(t * (1 + hash1(i, seed + 2) * 2) + i) + 1) * 0.5;
      g.globalAlpha = (o.a ?? 0.8) * (0.3 + tw * 0.7) * (1 - y / (o.y1 ?? 90) * 0.6); g.fillStyle = i % 5 ? '#e8e4ff' : '#fff0d0';
      g.fillRect(x, y, 1, 1); if (tw > 0.92 && i % 4 === 0) { g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); }
    }
    g.globalAlpha = 1;
  };
  let _fl = null;
  V.drawFlamingos = function (g, list, ox, oy, t) {
    if (!_fl) _fl = V.strip(2, 7, 9, (pb, f) => {
      const P = U('#f478b0'), D = U('#c04a88'), L = U('#ffd0e4'), B = U('#3a2030');
      V.put(pb, 3, 0, P); V.put(pb, 4, 0, B); V.put(pb, 3, 1, P); V.put(pb, 2, 2, P); V.put(pb, 2, 3, P);
      for (let x = 1; x < 6; x++) { V.put(pb, x, 4, x < 3 ? L : P); V.put(pb, x, 5, D); }
      V.put(pb, 3, 6, D); V.put(pb, 3, 7, D); V.put(pb, f ? 4 : 2, 8, D); V.put(pb, 3, 8, D);
    });
    for (const F of list) { const x = F.x + ox + Math.sin(t * 0.2 + F.x) * 3, y = F.y + oy; if (x < -8 || x > W + 8) continue; V.drawStrip(g, _fl, Math.floor(t * 0.7 + F.x) % 2, x, y, (F.x & 1) === 1); }
  };
  V.drawBuoys = function (g, list, ox, oy, t) {
    for (const [x, y, col] of list) {
      const sx = x + ox, sy = y + oy + Math.round(Math.sin(t * 1.6 + x) * 1); if (sx < -6 || sx > W + 6) continue;
      g.fillStyle = col || '#f5dc5a'; g.fillRect(sx - 1, sy - 2, 3, 3); g.fillStyle = '#2a1a3a'; g.fillRect(sx, sy - 4, 1, 2);
      if (Math.floor(t * 1.5 + x * 0.1) % 2) V.drawGlow(g, sx, sy - 5, 4, '#ff6a7a', 0.8);
    }
  };
  V.drawPlume = function (g, x, y, t, o = {}) {
    const n = o.n || 14, len = o.len || 22;
    for (let i = 0; i < n; i++) {
      const u = ((t * 0.22 + i / n) % 1), px = x + 1 + u * len + Math.sin(i * 2.1 + t) * 1.5, py = y + 1 + u * u * 6;
      g.globalAlpha = 0.8 * (1 - u); g.fillStyle = i % 3 ? '#e07ecf' : '#c244a2'; g.fillRect(Math.round(px), Math.round(py), 1 + (u < 0.4 ? 1 : 0), 1);
    }
    g.globalAlpha = 1;
  };
})();
