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
    // etapas de evaporación con color saturado (Dunaliella/halobacterias): turquesa → verde → ámbar → rosa → carmín → costra
    const SAL = [['#04566e', '#0a8aa0', '#14c4c8', '#7af4e8'], ['#0a5a48', '#14946c', '#2cd08a', '#a0f4b8'], ['#7a4a10', '#c07a14', '#f0aa2a', '#ffe08a'], ['#7a1052', '#c0287a', '#f04a9e', '#ffb0d8'], ['#6a0a3a', '#b01a5a', '#e83a7a', '#ff9ab8'], ['#b0a0b4', '#d8c8dc', '#f0e6f0', '#ffffff']];
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
          else if (yy === bw) u = C[0];                                            // sombra del dique del fondo
          else if (yy === ph - 2) u = C[1];
          else {
            const tt = (yy - bw) / Math.max(1, ph - bw);
            u = C[tt < 0.45 ? 2 : 1];
            const rip = (yy + Math.floor(hash1((xx + x) >> 3, row + 9) * 3)) % 4 === 0 && hash2((xx + x) >> 2, yy, 6) < 0.55;
            if (rip) u = C[tt < 0.45 ? 3 : 2];                                         // ondas: trazos claros cortos
            if (((xx + yy * 3) % 37) < 2 && yy < ph * 0.5) u = V.mixU(u, sky, 0.5);  // reflejo del cielo
          }
          V.put(pb, px, py, u);
        }
        // talud del dique delantero (sombra violeta) y costra
        for (let xx = 0; xx < pw; xx++) for (let q = 0; q < dy; q++) V.put(pb, x + xx, y + ph + q, BER[q === 0 ? 3 : 1]);
        // cristales de sal sobre el dique delantero (grumos blancos de 1–2 px)
        for (let xx = 2; xx < pw - 2; xx += 3 + Math.floor(hash1(x + xx, 17) * 6)) { V.put(pb, x + xx, y + ph - 1, BER[nB - 1]); if (hash1(x + xx, 18) < 0.4) V.put(pb, x + xx + 1, y + ph - 1, BER[nB - 1]); }
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
    // farallón en 3/4 con el mismo lenguaje que las paredes: meseta clara, labio cálido, repisas y bloques
    const res = V.mesas3q(pb, { list: [[x, w, h]], yBase: y, seed, k: o.k || 0, ramp: o.ramp || V.RAMPS.canyonDusk, warm: o.warm || '#fbc371', talus: 12 });
    return { top: res.top, x0: x - 12 };
  };
  /**
   * Paredes del cañón en 3/4 (sustituyen a las losas planas de V.mesas en el Nivel 03): mesetas a contraluz
   * con cara superior visible (plano claro de 3–7 px y matas), labio con filo cálido #fbc371 de 1 px, frente
   * de bloques (juntas verticales desplazadas por bloque, arista iluminada del lado del sol), estratos en
   * repisas con cara superior clara y sombra de desplome, un estrato salino rosado por meseta, cárcavas,
   * talud de derrubios en grumos y contorno sel-out con la propia rampa. Sin tramado.
   */
  V.mesas3q = function (pb, o = {}) {
    const r = RNG(o.seed || 5), k = o.k || 0, R = ramp(o.ramp || V.RAMPS.canyonDusk, k), n = R.length, yB = o.yBase ?? pb.h - 1;
    const WARM = U(V.hzc(o.warm || '#fbc371', k)), SALTC = U(V.hzc(o.saltCol || '#ffd8ec', k)), seed = o.seed || 5;
    const top = new Int16Array(pb.w).fill(yB), id = new Int16Array(pb.w).fill(-1), M = [];
    const fixed = o.list || null;
    for (let x = -40, li = 0; fixed ? li < fixed.length : x < pb.w + 40;) {
      let w, h, talus;
      if (fixed) { [x, w, h] = fixed[li++]; talus = o.talus || r.int(8, 14); }
      else {
        w = r.int(50, 170); h = r.int(o.hMin || 14, o.hMax || 40); talus = r.int(10, 22);
        if (r.chance(0.22)) { x += r.int(20, 60); continue; }
      }
      // estratos (alturas acumuladas) con perfil escalonado: cada estrato inferior asoma 0–4 px por lado
      const sOf = new Int16Array(h + 12), sPos = new Int16Array(h + 12), sLen = new Int16Array(h + 12), cum = [], eL = [], eR = [];
      let accL = 0, accR = 0;
      for (let acc = 0, si = 0; acc < h + 12; si++) {
        const L = Math.max(5, Math.round(r.int(8, 15) * Math.min(1, 0.45 + h / 120)));
        if (si > 0) { accL += r.chance(0.3) ? 0 : r.int(1, 4); accR += r.chance(0.3) ? 0 : r.int(1, 4); }
        cum.push(acc); eL.push(accL); eR.push(accR);
        for (let q = 0; q < L && acc + q < h + 12; q++) { sOf[acc + q] = si; sPos[acc + q] = q; sLen[acc + q] = L; }
        acc += L;
      }
      const salt = r.int(1, Math.max(1, cum.length - 2)), yT = yB - h;
      const m = { x0: x, x1: x + w, h, yT, tf: clamp(Math.round(h * 0.06) + 2, 3, 7), sOf, sPos, sLen, salt };
      M.push(m);
      const ns = cum.filter(c => c < h).length, sprL = eL[ns - 1], sprR = eR[ns - 1];
      for (let xx = x - sprL - talus; xx < x + w + sprR + talus; xx++) {
        if (xx < 0 || xx >= pb.w) continue;
        let ty = -1, tal = false;
        for (let si = 0; si < ns; si++) if (xx >= x - eL[si] && xx < x + w + eR[si]) { ty = yT + cum[si]; break; }
        if (ty < 0) {
          tal = true;
          const e0 = xx < x ? x - sprL : x + w + sprR, edge = xx < x ? (xx - (e0 - talus)) / talus : 1 - (xx - e0) / talus;
          ty = yB - Math.round(Math.max(4, h - cum[ns - 1]) * Math.pow(clamp(edge, 0, 1), 1.3) * 0.9 + (fbm1(xx * 0.08, 2, seed) - 0.5) * 3);
        } else ty += Math.round((fbm1(xx * 0.05, 2, seed) - 0.5) * 2);
        if (ty < top[xx]) { top[xx] = ty; id[xx] = tal ? -2 - (M.length - 1) : M.length - 1; }
      }
      x += w + sprL + sprR + r.int(8, 50);
    }
    for (let x = 0; x < pb.w; x++) {
      const t0 = top[x]; if (t0 >= yB) continue;
      const mi = id[x], talus = mi < -1, m = M[talus ? -2 - mi : mi];
      if (!m) continue;
      const u = clamp((x - m.x0) / Math.max(1, m.x1 - m.x0), 0, 1), cap = !talus && t0 <= m.yT + 2;
      const shade = talus ? (x > m.x1 ? -2 : -1) : (u > 0.85 ? -1 : 0) + (u < 0.04 ? 1 : 0);
      const butt = Math.round((PFK.vn(x * 0.07, 0, seed + 11) - 0.5) * 2.4);   // contrafuertes: luz y sombra amplias
      const gul = !talus && PFK.vn(x * 0.21, 0, seed + 3) > 0.72, gulLen = Math.round(m.h * (0.35 + PFK.vn(x * 0.05, 2, seed + 4) * 0.5));
      const gulEdge = !talus && !gul && PFK.vn((x + 1) * 0.21, 0, seed + 3) > 0.72;
      const tl = top[Math.max(0, x - 1)], tr = top[Math.min(pb.w - 1, x + 1)];
      const shrub = !talus && hash2(x >> 2, 3, seed + 8) < 0.12, tf = cap ? m.tf : 2;
      for (let y = t0; y <= yB; y++) {
        const d = y - t0;
        let i, c;
        if (!talus && d < tf) {
          // cara superior (meseta o repisa del escalón): fondo en penumbra, plano claro, labio con luz cálida
          i = d === 0 ? n - 3 : d === tf - 1 ? n - 1 : n - 2;
          if (shrub && d === tf - 2 && cap) i = n - 5;
          c = R[clamp(i, 0, n - 1)];
          if (d === tf - 1) c = V.mixU(R[n - 1], WARM, cap ? 0.55 : 0.4);
        } else if (talus) {
          // talud de derrubios en grumos de 3×3 con cara alta clara
          const gx = Math.floor(x / 3), gyy = Math.floor(y / 3), hv = hash2(gx, gyy, seed + 6);
          i = 4 + shade - Math.floor(d / 7) + (hv < 0.3 ? -1 : hv > 0.8 ? 1 : 0) + ((y % 3) === 0 && hv > 0.5 ? 1 : 0);
          c = R[clamp(i, 0, n - 1)];
          if (d === 0) c = V.mixU(R[clamp(5 + shade, 0, n - 1)], WARM, 0.35);
        } else {
          // bloques por estrato: juntas verticales que solo cruzan su estrato, con escalón de ±1 px por bloque
          const dm = y - m.yT, d0 = clamp(dm, 0, m.h + 11), s0 = m.sOf[d0];
          const jw = 14 + Math.floor(hash1(s0, seed + 21) * 22), jo = Math.floor(hash1(s0, seed + 22) * 31), cx = Math.floor((x + jo) / jw), lx = x + jo - cx * jw;
          const joint = hash2(cx, s0, seed + 23) < 0.4, step = Math.floor(hash2(cx, s0, seed + 24) * 3) - 1, tone = Math.floor(hash2(cx, s0, seed + 25) * 3) - 1;
          const dd = clamp(d0 + step, 0, m.h + 11), si = m.sOf[dd], sp = m.sPos[dd], sl = m.sLen[dd];
          const base = [5, 4, 5, 3, 4, 5, 4, 3][si % 8] + tone;
          i = base + shade + butt - Math.floor((dm / Math.max(1, m.h)) * 2.2);
          if (sp === 0 && si > 0) i += 2; else if (sp === sl - 1) i -= 2;   // repisa: cara de arriba clara, desplome en sombra
          if (d === tf) i -= 1;                                              // sombra bajo el labio
          if (joint && lx === 0 && sp > 0) i -= 2; else if (joint && lx === 1 && sp > 0) i += 1;  // junta de bloque y arista
          if (gul && d >= tf && dm < gulLen) i -= 2; else if (gulEdge && d >= tf && dm < gulLen) i += 1;
          c = R[clamp(i, 0, n - 1)];
          if (si === m.salt && sp > 0 && sp < sl - 1) c = V.mixU(c, SALTC, 0.32);           // estrato salino
          if (sp === 0 && hash2(x >> 1, si, seed + 7) < 0.18) c = V.mixU(c, WARM, 0.35);     // brillo cálido en la repisa
        }
        // contorno sel-out: el borde de la silueta se oscurece con la propia rampa (no negro)
        if (d > 0 && ((tl > y && x > 0) || (tr > y && x < pb.w - 1))) c = R[clamp((talus ? 3 : 4) + shade - 1, 1, n - 1)];
        if (d === 0 && !talus) c = V.mixU(R[n - 2], WARM, cap ? 0.7 : 0.45);
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

  /* =================================================================
     R2 (r2-biomes-a) — CAÑÓN ESCULPIDO EN 3/4
     Sustituye las pilas de bloques lavanda por relieve sombreado:
       VISTA.RAMPS.canyonR2 / canyonVegR2 / saltPanR2
       VISTA.r2baMesaH(list, {seed, gully, soft}) → H(u,v) para VISTA.relief
           list: [{x, v, w, d, h, step, p, wall0, tal}] mesetas estratificadas
           (techo plano, paredes en escalones con repisa iluminada, cárcavas, talud)
       VISTA.r2baHoodoo(pb, x, yb, h, r, seed, {k, ramp, veg}) → {top:[x,y]}
           chimenea con sombrero de roca dura, estrangulamientos por estrato,
           sombreado cilíndrico (luz arriba-izquierda), sombra arrojada a la derecha
       VISTA.r2baPans(pb, {x0, x1, y0, rows, seed, k, surf}) → {glints, ponds}
           salinas irregulares en terrazas (turquesa → verde → ámbar → coral → costra)
       VISTA.r2baTufts(pb, surf, x0, x1, seed, {k, gap, ramp})   matas oscuras cada ~gap px
     Las rampas evitan el magenta (tono 295–345°) salvo en emisivos de salmuera.
     ================================================================= */
  V.RAMPS.canyonR2 = ['#120c30', '#1c1242', '#2a1852', '#3c2062', '#4e2a6c', '#5a3476', '#8a5262', '#a8605e', '#c87a62', '#e29c6c', '#f6c080', '#ffe2a6'];
  V.RAMPS.canyonVegR2 = ['#0a1424', '#102a36', '#18403e', '#225842', '#357046', '#4f8a4a', '#74a452', '#a0bc5e'];
  V.RAMPS.saltPanR2 = [
    ['#063a5a', '#0a6c8a', '#12a2b4', '#38d2d2', '#a6f4ec'],   // agua de mar: turquesa
    ['#0a4a44', '#127a5e', '#22aa72', '#5ad48c', '#b4f2c0'],   // concentración media: verde
    ['#3e4a12', '#6a7a1a', '#9aa82a', '#cad04a', '#f0f0a0'],   // algas: oliva
    ['#6a3a0c', '#a8620e', '#e09422', '#f8c04a', '#fff0b0'],   // salmuera densa: ámbar
    ['#6a1e22', '#a8382e', '#da5a40', '#f4886a', '#ffd0b8'],   // halobacterias: coral (no magenta)
    ['#6e3a4a', '#b0606e', '#dc8c96', '#f6c4c4', '#ffffff'],   // cristalizador: salmuera rosada bajo la costra (islas blancas)
  ];
  /** Mesetas estratificadas: huella de superelipse deformada, techo plano, paredes escalonadas, talud */
  V.r2baMesaH = function (list, o = {}) {
    const seed = o.seed || 1, gully = o.gully ?? 0.14;
    return (u, v) => {
      let best = 0;
      for (let i = 0; i < list.length; i++) {
        const m = list[i], dxu = u - m.x;
        if (Math.abs(dxu) > m.w * 1.45) continue;
        const gw = (V.ridged(u * 0.11 + i * 7.3, v * 0.04, 3, seed + i) - 0.45) * gully;
        const wn = (fbm(u * 0.022, v * 0.07 + i * 3.1, 2, seed + 3 + i) - 0.5) * 0.34;
        const a = Math.abs(dxu / m.w), b = Math.abs((v - m.v) / m.d), p = m.p || 3.2;
        const r = Math.pow(Math.pow(a, p) + Math.pow(b, p), 1 / p) + wn + gw;
        const w0 = m.wall0 ?? 0.74, tal = m.tal ?? 0.3, t0 = m.t0 ?? 0.2;
        let hh = 0;
        if (r < w0) hh = m.h + (fbm(u * 0.07, v * 0.18, 2, seed + 9 + i) - 0.5) * 3.2;
        else if (r < 1) {
          const e = (1 - r) / (1 - w0), hw = m.h * (t0 + (1 - t0) * Math.pow(e, 0.65));
          const st = m.step || 9, off = (fbm(u * 0.035, i * 1.7, 2, seed + 21) - 0.5) * st * 0.9;
          const q = (hw + off) / st, fl = Math.floor(q), s = q - fl;
          hh = Math.min(m.h, (fl + Math.pow(s, 5)) * st - off);
        } else if (r < 1 + tal) {
          const e = 1 - (r - 1) / tal;
          hh = m.h * t0 * Math.pow(e, 1.5) + (vnoise(u * 0.3, v * 0.5, seed + 31 + i) - 0.5) * 2.2 * e;
        }
        if (hh > best) best = hh;
      }
      return best;
    };
  };
  /**
   * VISTA.r2baRelief(pb, o): igual que VISTA.relief y además
     o.strata {L:[min,max], seed, hard, soft, lip, under, warp, salt:{every, col, k}}  estratos por ALTURA
       (bandas que envuelven cárcavas y espolones: canto superior claro, base socavada)
     o.flatK   aclara las caras casi horizontales (techos y repisas iluminados desde arriba)
     o.shadeHue color hacia el que se tiñen las caras en sombra (violeta) con o.shadeK
   * Devuelve la misma info que VISTA.relief.
   */
  V.r2baRelief = function (pb, o) {
    const w = pb.w, x0 = Math.max(0, o.x0 ?? 0), x1 = Math.min(w, o.x1 ?? w);
    const nv = o.nv || 40, dvy = o.dvy ?? 0.45, yBase = o.yBase ?? pb.h - 1, H = o.H, kv = o.kv ?? 0.9;
    const seed = o.seed || 1, tex = o.tex ?? 0.05;
    const gw = x1 - x0 + 2;
    const G = new Float32Array(gw * (nv + 2));
    for (let v = -1; v <= nv; v++) for (let x = x0 - 1; x <= x1; x++) G[(v + 1) * gw + (x - x0 + 1)] = H(x, v);
    const hAt = (x, v) => G[(clamp(v, -1, nv) + 1) * gw + (clamp(x, x0 - 1, x1) - x0 + 1)];
    const nB = 4, ramps = [];
    for (let b = 0; b < nB; b++) ramps.push(V.P32(o.haze ? V.hz(o.ramp, (o.haze.k0 || 0) + (o.haze.k || 0) * b / (nB - 1), o.haze.col) : o.ramp));
    const n = o.ramp.length, L = o.light || V.LIGHT;
    // tabla de estratos por altura
    const S = o.strata, sT = [];
    if (S) {
      const rS = RNG(S.seed || seed + 77), Lr = S.L || [6, 11];
      for (let h0 = 0, li = 0; h0 < 400; li++) { const th = rS.int(Lr[0], Lr[1]), hard = rS.chance(0.5); for (let q = 0; q < th; q++) sT.push([li, q, th, hard]); h0 += th; }
    }
    const SALT = S && S.salt ? U(S.salt.col || '#ffe0e8') : 0;
    const strataDt = (hy, x) => {
      const wq = S.warp ? Math.round((fbm1(x * 0.02, 2, seed + 5) - 0.5) * S.warp) : 0;
      const e = sT[clamp(Math.round(hy) + wq + 20, 0, sT.length - 1)];
      let dt = e[3] ? (S.hard ?? 0.05) : -(S.soft ?? 0.05);
      if (e[1] === e[2] - 1) dt += (S.lip ?? 0.14); else if (e[1] === 0) dt -= (S.under ?? 0.12);
      return [dt, e[0], e[1], e[2]];
    };
    const top = new Int16Array(w).fill(32767), surf = new Int16Array(w).fill(32767), veg = [];
    const tAt = (x, v) => {
      const h = hAt(x, v);
      let dx = (hAt(x + 1, v) - hAt(x - 1, v)) * 0.5, dv = (hAt(x, v + 1) - hAt(x, v - 1)) * 0.5 * kv;
      if (o.facet) { const q = o.facet, jx = (hash2((x / 3) | 0, v >> 1, seed + 5) - 0.5) * q * 0.6; dx = Math.round((dx + jx) / q) * q; dv = Math.round(dv / q) * q; }
      const inv = 1 / Math.hypot(dx, dv, 1);
      const I = (dx * -L[0] + dv * -L[1] * 0.9 + L[2]) * inv;
      const avg = (hAt(x - 3, v) + hAt(x + 3, v) + hAt(x, v - 2) + hAt(x, v + 2)) * 0.25;
      const cav = clamp((h - avg) * (o.cav ?? 0.06), -0.3, 0.3);
      const hgt = o.hMax ? clamp(h / o.hMax, 0, 1) * (o.hgtK ?? 0.12) : 0;
      const flat = o.flatK ? o.flatK * clamp(1 - Math.hypot(dx, dv) * 1.6, 0, 1) : 0;
      return [clamp((o.t0 ?? 0.5) + (I - 0.62) * (o.contrast ?? 1.55) + cav + hgt + flat, 0, 0.999), dx, dv, h];
    };
    const SH = o.shadeHue ? U(o.shadeHue) : 0, shK = o.shadeK ?? 0.3;
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
          const j = (hash2((x / 2) | 0, (y / 2) | 0, seed + 3) - 0.5) * tex * 2;
          let tt = t + j - (y - sy) * (o.spanDark ?? 0.012), sl = null;
          if (S && h > 2) { sl = strataDt(h - (y - sy), x); tt += sl[0]; }
          const k = V.band(clamp(tt, 0, 0.999), n, x, y, 0.05, seed);
          let c = R[k];
          if (SH && k < n * 0.45) c = V.mixU(c, SH, shK * (1 - k / (n * 0.45)));
          if (sl && SALT && sl[1] % (S.salt.every || 5) === 2 && sl[2] > 0 && sl[2] < sl[3] - 1) c = V.mixU(c, SALT, S.salt.k ?? 0.3);
          if (y < pb.h) pb.data[y * w + x] = c;
        }
        if (v === 0 || surf[x] === 32767) surf[x] = sy;
        if (o.veg && Math.abs(dx) < (o.veg.maxSlope ?? 0.9) && dv > -0.2 && sy > (o.veg.minY ?? 0) && hash2(x, v, seed + 11) < (o.veg.density ?? 0.05)) veg.push([x, sy, t, v]);
        yt = y0;
      }
      top[x] = yt;
    }
    if (o.rim) {
      const RU = U(o.rim);
      for (let x = x0 + 1; x < x1 - 1; x++) { const y = top[x]; if (y >= pb.h || y < 0) continue; if (top[x + 1] <= y || top[x - 1] > y) { const i = y * w + x; pb.data[i] = V.mixU(pb.data[i], RU, o.rimK ?? 0.6); } }
    }
    if (o.mist) {
      const MU = U(o.mist.col), mh = o.mist.h || 12, mk = o.mist.k ?? 0.5;
      for (let y = Math.max(0, Math.round(yBase - mh)); y <= Math.min(pb.h - 1, yBase); y++) { const k = mk * Math.pow(1 - (yBase - y) / mh, 1.4); for (let x = x0; x < x1; x++) { const i = y * w + x; if (pb.data[i] >>> 24) pb.data[i] = V.mixU(pb.data[i], MU, k); } }
    }
    if (o.veg && veg.length) {
      const VR = V.P32(o.veg.ramp || V.hz(RAMP.foliageR, 0.3)), nv_ = VR.length, big = o.veg.size ?? 2.2;
      for (const [x, y, t] of veg) {
        const s = 1 + (hash2(x, y, 5) * big | 0), cy = y - Math.round(s * 0.4);
        for (let yy = -s; yy <= s; yy++) for (let xx = -s - 1; xx <= s + 1; xx++) {
          const d = (xx * xx) / ((s + 1) * (s + 1)) + (yy * yy) / (s * s + 0.5);
          if (d > 1 || (d > 0.6 && hash2(x + xx, cy + yy, 7) < 0.35)) continue;
          const px = x + xx, py = cy + yy + 1; if (px < 0 || px >= w || py < 0 || py >= pb.h) continue;
          const sh = clamp(0.55 - xx / (s + 1) * 0.3 - yy / (s + 0.5) * 0.4 + (t - 0.5) * 0.3 + (hash2(px, py, 9) - 0.5) * 0.2, 0, 0.999);
          pb.data[py * w + px] = VR[Math.floor(sh * nv_)];
        }
      }
    }
    const yAt = (x, v) => Math.round(yBase - v * dvy - hAt(x, v));
    const visY = (x, v) => { const y = yAt(x, v); for (let q = 0; q < v; q++) if (yAt(x, q) <= y + 1) return null; return y; };
    const onSurf = (x, v) => { for (let q = v; q >= 0; q--) { const y = visY(x, q); if (y != null && hAt(x, q) > 0.5) return y; } return null; };
    return { top, surf, hAt, yAt, visY, onSurf };
  };
  /** Chimenea de hadas (hoodoo) esculpida en 3/4 */
  V.r2baHoodoo = function (pb, x, yb, h, r0, seed, o = {}) {
    const R = ramp(o.ramp || V.RAMPS.canyonR2, o.k), n = R.length, rr = RNG(seed);
    const capH = Math.max(3, Math.round(h * rr.range(0.1, 0.15))), capR = r0 * rr.range(1.25, 1.6);
    const lean = rr.range(-0.06, 0.06), ph = rr.range(0, 6);
    const prof = new Float32Array(h + 1), hard = new Uint8Array(h + 1);
    let acc = 0, layer = 0, lh = rr.int(3, 6);
    for (let q = 0; q <= h; q++) {
      if (++acc > lh) { acc = 0; layer++; lh = rr.int(3, 7); }
      hard[q] = layer % 2;
      const t = q / h;
      let rad;
      if (q >= h - capH) { const c = (q - (h - capH)) / capH; rad = capR * (1 - Math.pow(c, 2.4) * 0.55); }
      else {
        rad = r0 * (1.55 - t * 0.75) * (1 + (fbm1(q * 0.09 + ph, 3, seed) - 0.5) * 0.5);
        if (q > h - capH - 4) rad *= 0.72 + 0.07 * (h - capH - q);
        rad *= hard[q] ? 1.035 : 0.965;
      }
      prof[q] = Math.max(1, rad);
    }
    const WARM = U(V.hzc('#ffd8a0', o.k || 0)), SHV = U(V.hzc('#2a1852', o.k || 0));
    // sombra arrojada sobre el suelo (derecha, banda sólida en el tono más oscuro)
    const sl = Math.round(h * 0.5);
    for (let q = 0; q < sl; q++) for (let yy = 0; yy < 2; yy++) { const px = Math.round(x + r0 + q), py = yb - yy + Math.round(q * 0.08); const c = V.get(pb, px, py); if (c >>> 24) V.put(pb, px, py, V.mixU(c, R[1], 0.5 * (1 - q / sl))); }
    let topY = yb - h;
    for (let q = 0; q <= h; q++) {
      const rad = prof[q], y = yb - q, cx = x + lean * q + Math.sin(q * 0.08 + ph) * 0.8;
      const dr = (prof[Math.min(h, q + 1)] - prof[Math.max(0, q - 1)]) * 0.5;
      const isCapTop = q >= h - 1;
      const aL = 1 + (fbm1(q * 0.11, 2, seed + 4) - 0.5) * 0.45, aR = 1 + (fbm1(q * 0.11, 2, seed + 8) - 0.5) * 0.45;
      for (let xx = Math.floor(cx - rad * aL); xx <= Math.ceil(cx + rad * aR); xx++) {
        const nx = (xx + 0.5 - cx) / (rad * (xx + 0.5 < cx ? aL : aR)); if (Math.abs(nx) > 1) continue;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx)), ny = clamp(dr * 1.4, -0.9, 0.9);
        const inv = 1 / Math.hypot(nx, ny, nz);
        let I = (nx * -0.62 + ny * -0.48 + nz * 0.62) * inv;
        if (q >= h - capH && q < h - capH + 2) I -= 0.25;                     // sombra bajo el borde del sombrero
        if (!hard[q]) I -= 0.06;
        let t = clamp(0.3 + I * 0.66 - (1 - q / h) * 0.12 + (hash2(Math.round(xx) >> 1, y >> 1, seed + 2) - 0.5) * 0.1 - (q >= h - capH ? 0.08 : 0), 0, 0.999);
        let c = R[V.band(t, n, xx, y, 0.05, seed)];
        if (t < 0.42) c = V.mixU(c, SHV, 0.35 * (1 - t / 0.42));
        if (Math.abs(nx) > 0.9) c = R[clamp(Math.floor(t * (n - 1)) - 2, 0, n - 1)];  // sel-out con la propia rampa
        if (isCapTop) c = V.mixU(R[n - 2], WARM, 0.5);
        else if (hard[q] && !hard[Math.min(h, q + 1)] && nx < 0.3) c = V.mixU(c, WARM, 0.32);  // canto de estrato al sol
        V.put(pb, Math.round(xx), y, c);
      }
    }
    // cara superior del sombrero (elipse 3/4 iluminada)
    const tcx = x + lean * h, tr = prof[h - 1] * 0.9;
    for (let yy = -1; yy <= 1; yy++) for (let xx = Math.floor(-tr); xx <= tr; xx++) { const e = (xx * xx) / (tr * tr) + yy * yy; if (e > 1) continue; V.put(pb, Math.round(tcx + xx), yb - h - 1 + yy, V.mixU(R[n - 1], WARM, xx < 0 ? 0.6 : 0.25)); }
    topY = yb - h - 2;
    // talud de derrubios al pie (grumos)
    for (let q = 0; q < r0 * 2 + 6; q++) { const px = Math.round(x - r0 - 3 + q), hh = Math.round((1 - Math.abs(q - r0 - 3) / (r0 + 3)) * 3); for (let yy = 0; yy < hh; yy++) V.put(pb, px, yb - yy, R[clamp(4 + (q < r0 + 3 ? 2 : 0) - yy + (hash2(px, yy, seed) < 0.3 ? -1 : 0), 0, n - 1)]); }
    if (o.veg) V.r2baTufts(pb, (xx) => yb, x - r0 - 6, x + r0 + 8, seed + 5, { k: o.k, gap: 6 });
    return { top: [Math.round(tcx), topY] };
  };
  /** Matas oscuras de matorral salino (2–4 px) con punta iluminada */
  V.r2baTufts = function (pb, surf, x0, x1, seed, o = {}) {
    const R = ramp(o.ramp || V.RAMPS.canyonVegR2, o.k), n = R.length, r = RNG(seed), gap = o.gap || 10;
    for (let x = x0 + r.int(0, gap); x < x1; x += Math.max(2, Math.round(gap * r.range(0.5, 1.5)))) {
      const y = surf(x); if (y == null || y < 0 || y >= pb.h) continue;
      const s = r.int(1, o.big || 3);
      for (let yy = -s; yy <= 0; yy++) for (let xx = -s - 1; xx <= s + 1; xx++) {
        const d = (xx * xx) / ((s + 1.2) * (s + 1.2)) + (yy * yy) / ((s + 0.4) * (s + 0.4)); if (d > 1 || (d > 0.55 && hash2(x + xx, y + yy, seed) < 0.4)) continue;
        const t = clamp(0.5 - xx / (s + 1) * 0.3 + yy / (s + 0.5) * 0.35 + (hash2(x + xx, y + yy, seed + 1) - 0.5) * 0.25, 0, 0.999);
        V.put(pb, x + xx, y + yy, R[Math.floor(t * (n - 1))]);
      }
      if (r.chance(0.25)) { V.put(pb, x, y - s - 1, R[n - 1]); V.put(pb, x - 1, y - s, R[n - 2]); }
    }
  };
  /**
   * Salinas en mosaico (vista 3/4 rasante): filas de balsas cada vez más altas hacia el espectador,
   * separadas por diques de 1 px con cara superior clara y sombra debajo; el grupo es un paralelogramo
   * de bordes irregulares. El color de cada balsa sigue la concentración (izquierda → derecha:
   * turquesa → verde → oliva → ámbar → coral → costra blanca), con ondas, reflejo del cielo y
   * cristalización blanca en el borde. o: {x0, x1, y0, rows, seed, k, sky, skew}
   */
  V.r2baPans = function (pb, o) {
    const r = RNG(o.seed || 5), k = o.k || 0, ponds = [], glints = [];
    const BER = ramp(['#3a2c4e', '#5e4c70', '#8a7896', '#b8a6bc', '#dccede', '#f6eef4'], k), nB = BER.length;
    const WALL = ramp(['#2a1838', '#3e2446', '#583450', '#784a58', '#9a6662', '#bc8670'], k);
    const sky = U(V.hzc(o.sky || '#f8c8a0', k)), CRU = U(V.hzc('#fff6fa', k));
    const STG = V.RAMPS.saltPanR2.map(s => ramp(s, k)), nS = STG.length;
    const rows = o.rows || 4, skew = o.skew ?? 2;
    let y = o.y0;
    // terrazas que siguen curvas de nivel (borde ondulado), muro de contención sombreado bajo cada fila,
    // balsas de anchura variable con degradado y reflejo; la costra blanca cristaliza en islas, no en bloques
    for (let row = 0; row < rows; row++) {
      const ph = 3 + row + (row > 2 ? 1 : 0), sh = row * skew, wallH = 2 + (row >> 1);
      const xs = o.x0 - sh + r.int(-10, 10), xe = o.x1 - sh + r.int(-10, 10);
      const f1 = r.range(0.008, 0.016), f2 = r.range(0.03, 0.05), p1 = r.range(0, 6), p2 = r.range(0, 6);
      const yo = (x) => Math.round(Math.sin(x * f1 + p1) * 1.6 + Math.sin(x * f2 + p2) * 0.7);
      // cortes entre balsas
      const cuts = []; for (let x = xs; x < xe;) { const pw = Math.round(r.int(9, 22) * (1 + row * 0.2)); cuts.push(x); x += pw; } cuts.push(xe);
      for (let c = 0; c < cuts.length - 1; c++) {
        const a = cuts[c], b = Math.min(xe, cuts[c + 1]);
        const u0 = clamp((a - xs) / Math.max(1, xe - xs) + r.range(-0.2, 0.2), 0, 0.999);
        const si = Math.min(nS - 1, Math.floor(u0 * nS)), C = STG[si], crust = si >= nS - 2;
        const dry = !crust && r.chance(0.08);
        for (let x = a; x < b; x++) {
          const yt = y + yo(x), end = Math.min(x - xs, xe - 1 - x), cut = end < 3 ? 3 - end : 0;
          // dique trasero (canto claro)
          V.put(pb, x, yt + cut, BER[nB - 2 - (hash2(x >> 2, row, 3) < 0.2 ? 1 : 0)]);
          for (let yy = 1 + cut; yy <= ph; yy++) {
            let col;
            if (x === a) col = yy === 1 ? BER[nB - 2] : BER[nB - 3];                          // dique entre balsas
            else if (x === a + 1) col = C[0];                                                  // sombra del dique
            else if (yy === 1) col = C[0];
            else if (dry) col = BER[(hash2(x, yy, 5) < 0.3 ? 3 : 2)];
            else {
              const tt = yy / ph;
              col = C[tt < 0.45 ? 1 : 2];
              if (((x * 3 + yy * 7 + row * 5) % 31) < 2) col = V.mixU(col, sky, 0.6);         // reflejo del cielo
              else if (yy >= ph - 1 && hash2(x >> 1, row, 6 + si) < 0.5) col = C[3];
              if (crust) { const n0 = vnoise(x * 0.35, (y + yy) * 0.6, 40 + si); if (n0 > 0.52) col = n0 > 0.68 ? CRU : C[4]; }
              else if (hash2(x, yy + row * 13, 11) < 0.05) col = C[4];
            }
            V.put(pb, x, yt + yy, col);
          }
          // muro de contención delantero: canto iluminado + cara en sombra con mampuestos
          V.put(pb, x, yt + ph + 1, BER[nB - 3]);
          for (let q = 0; q < wallH; q++) V.put(pb, x, yt + ph + 2 + q, WALL[clamp(2 - q + (hash2((x + q * 3) >> 2, row * 5 + q, 9) < 0.3 ? 1 : 0), 0, 5)]);
          V.put(pb, x, yt + ph + 2 + wallH, WALL[0]);
        }
        ponds.push({ x: a, y, w: b - a, h: ph, si });
        if (!crust && !dry && b - a > 8) glints.push({ x: a + 2, y: y + 2 + (ph >> 1), len: b - a - 4, ph: r.range(0, 1.6), sp: 0.12, col: '#fff0e0', w: 2 });
      }
      y += ph + 1 + wallH;
    }
    return { ponds, glints, y1: y };
  };
})();
