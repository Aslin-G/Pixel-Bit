/* =====================================================================
   18y_r2terrain_rock.js — Roca esculpida del plano jugable (ronda 2).
   Sustituye la rejilla de bloques redondeados de la cara 'cliff' de
   PFTerrain por masas columnares facetadas, como el acantilado de la
   referencia. Se hornea por tramo en un búfer propio (lazy, 1 vez por
   render) a partir de un CAMPO DE ALTURAS (relieve hacia la cámara):
     · macizos de 50–150 px con su propio saliente, inclinación y
       barranco oscuro entre ellos (muesca en el borde superior);
     · columnas de 8–22 px con biseles izquierdo (luz) y derecho (sombra)
       de anchura variable y juntas que serpentean;
     · roturas de bloque inclinadas e independientes por columna: escalón
       (cara superior iluminada), voladizo (panza oscura) o junta fundida;
     · repisas y voladizos de macizo (terrazas con plantas; sombras de
       saliente granate/violeta arrojadas en diagonal);
     · esquirlas de Voronoi con planos inclinados (facetas pictóricas),
       estratos horizontales que ondulan con x y vetas de humedad;
     · pedregal en la base (cantos semiesféricos).
   Sombreado: normal del campo + luz arriba-izquierda (Lambert), sombra
   arrojada por marcha hacia la luz, oclusión por cavidad (caja 9×9) y
   rampa de 17 tonos interpolada de la rampa del tramo, con desvío hacia
   granate-violeta en sombra. Sin tramado (ruido en clusters de 2 px).
   API (R2TERRAIN_Rock):
     build(s, world) → {bx0,w,h,buf,ms,cols}   · pix(s,x,y,gy,world) → u32
     post(pb, world, s)  plantas en repisas y grietas, raíces colgantes
     ramp17(ramp, hue)   → {lit, sh} (Uint32Array ×17)
     field(o) → buf genérico (otros kits): {x0,x1,h,gyAt,ramp,seed,…}
   Se activa por defecto para toda cara 'cliff' (s.r2 === false → antigua).
   ===================================================================== */
/** Hierba seca (calima, arenisca) para flecos y matas */
const R2TERRAIN_DRYGRASS = ['#3a2a10', '#5a4418', '#7e6424', '#a08436', '#c0a44c', '#d8c06a', '#ecd88e'];
const R2TERRAIN_Rock = (() => {
  const K = PFK;
  const LV = (() => { const v = [-0.45, -0.8, 0.4], m = Math.hypot(v[0], v[1], v[2]); return v.map(a => a / m); })();
  const LXY = Math.hypot(LV[0], LV[1]), SDX = LV[0] / LXY, SDY = LV[1] / LXY, SLOPE = LV[2] / LXY;
  const NONE = -999;
  const _r17 = new Map();
  /** Realce de croma (u32 ABGR): aleja cada canal de la luminancia */
  function sat(u, k) {
    const r = u & 255, g = (u >>> 8) & 255, b = (u >>> 16) & 255, l = 0.3 * r + 0.55 * g + 0.15 * b;
    const f = (c) => clamp(Math.round(l + (c - l) * k), 0, 255);
    return ((u >>> 24) << 24 | f(b) << 16 | f(g) << 8 | f(r)) >>> 0;
  }
  /** Rampa de 17 tonos interpolada + versión en sombra (desvío a granate-violeta) */
  function ramp17(ramp, hue = '#2a0c2e') {
    const key = ramp; let o = _r17.get(key); if (o && o.hue === hue) return o;
    const P = K.P32(ramp), n = P.length, N = 17, lit = new Uint32Array(N), sh = new Uint32Array(N), V = U(hue);
    for (let i = 0; i < N; i++) {
      const a = i / (N - 1) * (n - 1), i0 = Math.floor(a), i1 = Math.min(n - 1, i0 + 1);
      lit[i] = sat(K.mixU(P[i0], P[i1], a - i0), 1.16);
      sh[i] = K.mixU(lit[i], V, 0.1 + 0.26 * (1 - i / (N - 1)));
    }
    o = { lit, sh, N, hue }; _r17.set(key, o); return o;
  }

  /* ---------- estructura: macizos, columnas, roturas ---------- */
  function structure(bx0, bx1, h, seed, o) {
    const r = RNG(seed), ms = [], cols = [];
    const mMin = o.mMin || 64, mMax = o.mMax || 170, cMin = o.cMin || 14, cMax = o.cMax || 34;
    for (let x = bx0 - r.int(0, 40); x < bx1 + 10;) {
      const mw = r.int(mMin, mMax), i = ms.length;
      const m = { i, x0: x, x1: x + mw, pro: r() * 7, lean: (r() - 0.5) * 0.14, sd: r.int(1, 1e6), gw: r.int(2, 5), notch: r.int(4, 11), tier: null, tier2: null,
        // forma de macizo: arista vertical (plano izquierdo a la luz, derecho en sombra), cuerpo que se adelanta
        // o retrocede con la profundidad y tono propio (macizos distintos a 640 px)
        ridge: x + mw * (0.3 + r() * 0.45), rk: 0.12 + r() * 0.22, rkR: 0.2 + r() * 0.3, bul: (r() - 0.35) * 0.06, malb: (r() - 0.5) * 0.14, cave: null };
      // contrafuertes (macizos muy salientes que arrojan sombra granate sobre el vecino) y huecos/cuevas
      if (o.buttress !== false && r() < 0.38) { m.pro = 11 + r() * 9; m.malb += 0.05; }
      if (o.caves !== false && r() < 0.32) m.cave = { cx: x + mw * (0.25 + r() * 0.5), d: r.int(34, 130), rx: r.int(7, 16), ry: r.int(6, 13), dep: 9 + r() * 8 };
      if (o.tiers !== false) {
        const k = r();
        const mk = (dMin, dMax, kind) => ({ d: r.int(dMin, dMax), kind, amt: r.int(4, 9), x0: x + r.int(0, Math.round(mw * 0.22)), x1: x + mw - r.int(0, Math.round(mw * 0.22)) });
        if (k < 0.42) m.tier = mk(26, 74, 1);           // repisa (escalón saliente con cara superior iluminada)
        else if (k < 0.6) m.tier = mk(12, 30, -1);      // voladizo superior (panza en sombra)
        else if (k < 0.75) { m.tier = mk(12, 26, -1); m.tier2 = mk(46, 86, 1); }
        if (r() < 0.3 && !m.tier2) m.tier2 = mk(80, 120, r() < 0.5 ? 1 : -1);
      }
      m.c0 = cols.length;
      for (let cx = x; cx < x + mw;) {
        let cw = r.int(cMin, cMax); if (x + mw - (cx + cw) < cMin) cw = x + mw - cx;
        // bloques escalonados: cada bloque inferior sobresale un poco más (vista en 3/4 desde arriba: se ven sus
        // cabezas iluminadas); algunos retroceden (voladizo con sombra arrojada)
        const br = []; let d = r.int(10, 34), acc = 0;
        while (d < h + 40) { acc += r() < 0.18 ? -(1.5 + r() * 2) : 0.4 + r() * 2.2; br.push({ d, tilt: (r() - 0.5) * 0.5, off: acc, bt: r.int(2, 5), bb: r.int(1, 3), joint: r() < 0.74, iL: r.int(0, 2), iR: r.int(0, 2), rc: r.int(2, 6), jw: r() < 0.45 ? 2 : 1 }); d += r.int(20, 54); }
        cols.push({ i: cols.length, x0: cx, x1: cx + cw, m, pro: (r() - 0.5) * 4.2, bl: r.int(2, 6), brw: r.int(1, 3), sd: r.int(1, 1e6), cap: r.int(2, 9), fused: r() < 0.38, br, off0: (r() - 0.5) * 3, hang: r() < 0.16 });
        cx += cw;
      }
      m.c1 = cols.length;
      ms.push(m); x += mw;
    }
    return { ms, cols };
  }

  /**
   * Campo genérico → búfer u32. o: {x0,x1,h,gyAt(x),ramp,seed,lip,lip2,hue,tiers,scree,edgeL,edgeR,chip,strata,
   *   alb(x,y,d) opcional, cap: false (sin canto superior)}
   */
  function field(o) {
    const RR = ramp17(o.ramp || RAMP.rockWarmR, o.hue || '#2a0c2e');
    const seed = o.seed | 0, sd = (seed * 13 + 7) & 0xffff;
    const bx0 = Math.floor(o.x0) - 24, bx1 = Math.ceil(o.x1) + 24, w = bx1 - bx0, h = o.h;
    const gyA = new Int16Array(w);
    for (let i = 0; i < w; i++) gyA[i] = Math.round(o.gyAt(bx0 + i));
    const { ms, cols } = structure(bx0, bx1, h, seed * 7919 + 17, o);
    const N = w * h, H = new Float32Array(N).fill(NONE), A = new Float32Array(N), F = new Uint8Array(N);
    const eM = new Int32Array(ms.length), eC = new Int32Array(cols.length);
    const gyAt = (x) => gyA[clamp(x - bx0, 0, w - 1)];
    const screeD = o.scree === false ? 1e9 : (o.screeD ?? 120);
    const chipW = o.chip === false ? 0 : 13, chipH = 15;
    for (let y = 0; y < h; y++) {
      // bordes de macizo y de columna en esta fila (serpentean con y, se inclinan con la profundidad)
      for (let i = 0; i < ms.length; i++) {
        const m = ms[i], dE = Math.max(0, y - gyAt(m.x0));
        eM[i] = m.x0 + Math.round((K.vn(y * 0.045, i * 7.3, 5) - 0.5) * 7 + m.lean * dE);
      }
      for (let j = 0; j < cols.length; j++) {
        const c = cols[j];
        if (j === c.m.c0) { eC[j] = eM[c.m.i]; continue; }
        const dE = Math.max(0, y - gyAt(c.x0));
        eC[j] = c.x0 + Math.round((K.vn(y * 0.07, (c.sd & 1023) * 0.37, 3) - 0.5) * 4.4 + c.m.lean * dE + (hash2(j, y >> 2, 9) < 0.12 ? 1 : 0));
      }
      for (let j = 1; j < cols.length; j++) if (eC[j] < eC[j - 1] + 3) eC[j] = eC[j - 1] + 3;
      let mi = 0, ci = 0;
      const row = y * w;
      for (let xi = 0; xi < w; xi++) {
        const x = bx0 + xi, d = y - gyA[xi];
        if (d < (o.heads ? -4 : 0)) continue;
        while (ci < cols.length - 1 && x >= eC[ci + 1]) ci++;
        const c = cols[ci], m = c.m; mi = m.i;
        if (d < 0) {
          // cabezas de columna que asoman sobre el borde cercano (silueta del canto irregular, cara superior al sol)
          if ((o.edgeR != null && x >= o.edgeR - 5) || (o.edgeL != null && x < o.edgeL + 5) || hash1(c.i, sd + 90) > 0.42) continue;
          const lft = eC[ci], rgt = ci + 1 < cols.length ? eC[ci + 1] : c.x1, hw = (rgt - lft) / 2, u = (x + 0.5 - lft - hw) / Math.max(2, hw - 1);
          const HH = 1 + Math.floor(hash1(c.i, sd + 91) * 3.4);
          if (Math.abs(u) >= 1 || -d > HH * Math.sqrt(1 - u * u)) continue;
          const ii = y * w + xi; H[ii] = m.pro + c.pro - (c.cap - d) * 1.9; A[ii] = 1.1; F[ii] = 3;
          continue;
        }
        // silueta en extremos que dan a un vacío (garganta): la cara se retrae en diagonal bajo el borde
        if (o.edgeR != null && x >= o.edgeR - Math.round(Math.min(d * 0.22, 3 + K.vn(y * 0.06, 1, sd) * 7 + (hash1(y >> 3, sd) < 0.3 ? 2 : 0)))) continue;
        if (o.edgeL != null && x < o.edgeL + Math.round(Math.min(d * 0.18, 2 + K.vn(y * 0.06, 2, sd) * 6))) continue;
        const left = eC[ci], right = ci + 1 < cols.length ? eC[ci + 1] : c.x1;
        const dl = x - left, dr = right - 1 - x;
        const mL = ci === m.c0, mR = ci + 1 === m.c1;
        let hg = m.pro + c.pro, alb = 1 + (hash1(ci, sd + 77) - 0.5) * 0.09 + (m.pro / 7 - 0.5) * 0.14 + m.malb, fl = 0;
        { const rx = x - m.ridge - m.lean * Math.max(0, d), q = rx < 0 ? -rx * m.rk : rx * m.rkR; hg -= 14 * Math.tanh(q / 14); hg += m.bul * Math.min(d, 160); }
        // canto superior (cara superior vista en 3/4) con muesca en los barrancos
        const notch = mL && dl < m.gw + 3 ? m.notch - Math.max(0, dl - m.gw) * 2 : 0;
        const cap = o.cap === false ? 0 : Math.max(c.cap, notch);
        // bloque de la columna (roturas inclinadas e independientes por columna)
        const cm = (left + right) * 0.5, B = c.br;
        let bi = -1, top = cap, bot = 1e9;
        if (d >= cap) for (let k = 0; k < B.length; k++) { const bd = B[k].d + Math.round(B[k].tilt * (x - cm) + (K.vn(x * 0.21, k * 3.1, sd + 40) - 0.5) * 4.5); if (bd <= d) { bi = k; top = bd; } else { bot = bd; break; } }
        const b = bi >= 0 ? B[bi] : null, nb = B[bi + 1];
        const wob = (K.vn(y * 0.23, x * 0.05, sd + 41) - 0.5) * 3, iL = b ? b.iL : 0, iR = b ? b.iR : 0, el = dl - iL + Math.round(wob), er = dr - iR - Math.round(wob * 0.7);
        if (mL && dl < m.gw) { hg -= 10 - dl * 1.6; fl = 2; if (d < cap) hg -= (cap - d) * 1.9; }
        else if (d < cap) {
          // canto superior: cabezas de columna vistas desde arriba, separadas por muescas
          if (el <= 0 && !(c.fused && !mL)) { hg -= 4; fl = 1; } else { const ql = 3 - el; if (ql > 0) hg -= ql * ql / 3 * 1.2; if (er < 2) hg -= (2 - er) * 1.2; }
          hg -= (cap - d) * 1.9; if (!fl) fl = 3;
        } else {
          hg += b ? b.off : c.off0;
          const dt = d - top, db = bot - 1 - d;
          const u = clamp((x - left) / Math.max(4, right - left), 0, 1), bh = Math.max(6, bot - top);
          alb += (b ? (hash1(bi * 31 + ci, sd + 42) - 0.5) * 0.16 : 0) - (dt / bh) * 0.1;
          // bloque como rectángulo de esquinas redondeadas (distancias con borde serpenteante):
          // fuera de las esquinas → grieta en V; dentro, perfil por lado: cabeza ancha iluminada arriba,
          // bisel de luz a la izquierda, bisel de sombra a la derecha y panza oscura abajo
          const fusedL = c.fused && !mL && !(b && b.iL);
          const nc = cols[ci + 1], fusedR = nc && nc.fused && !mR && !(b && b.iR);
          const exL = fusedL ? 99 : el, exR = fusedR ? 99 : er + 1;
          const eyT = b && b.joint ? dt - b.jw + 1 : dt + 99, eyB = nb && nb.joint ? db + 1 : db + 99;
          const ex = Math.min(exL, exR), ey = Math.min(eyT, eyB), rc = b ? b.rc : 3;
          const e = (ex < rc && ey < rc) ? rc - Math.hypot(rc - ex, rc - ey) : Math.min(ex, ey);
          if (e <= 0.35) { hg -= 5.5 + Math.min(2, -e) * 0.6; fl = fl || 1; }
          else {
            const Rt = Math.min(bh * (0.22 + (b ? b.bt : 3) * 0.06), 22) * (1.25 - u * 0.65) + 1.5, Rb = (nb ? nb.bb : 2) + 0.8;
            const Rl = c.bl + (mL ? 2 : 0) + 1, Rr = c.brw + (mR ? 3 : 0) + 1;
            const top_ = ey <= ex, R = top_ ? (eyT <= eyB ? Rt : Rb) : (exL <= exR ? Rl : Rr);
            if (e < R) { const q = R - e; hg -= q * q / R * (top_ && eyT <= eyB ? 1.15 : (top_ ? 1.6 : (exL <= exR ? 1.5 : 1.25))); }
          }
          // esquirlas: planos inclinados en celdas de Voronoi (facetas)
          if (chipW) {
            const gx = Math.floor(x / chipW), gc = Math.floor(y / chipH);
            let d1 = 1e9, d2 = 1e9, id = 0, sx = 0, sy = 0;
            for (let jj = -1; jj <= 1; jj++) for (let ii = -1; ii <= 1; ii++) {
              const cx = gx + ii, cy = gc + jj, px = (cx + hash2(cx, cy, sd)) * chipW, py = (cy + hash2(cx, cy, sd + 1)) * chipH;
              const ex = x - px, ey = (y - py) * 0.8, dd = ex * ex + ey * ey;
              if (dd < d1) { d2 = d1; d1 = dd; id = cx * 7919 + cy; sx = px; sy = py; } else if (dd < d2) d2 = dd;
            }
            hg += (hash1(id, sd + 2) - 0.5) * 0.26 * (x - sx) + (hash1(id, sd + 3) - 0.5) * 0.2 * (y - sy);
            if (Math.sqrt(d2) - Math.sqrt(d1) < 0.75 && hash1(id, sd + 4) < 0.22) hg -= 1;
          }
        }
        // repisas y voladizos del macizo
        for (const T of [m.tier, m.tier2]) {
          if (!T || x < T.x0 || x >= T.x1) continue;
          const td = T.d + Math.round((K.vn(x * 0.06, mi + 0.5, 11) - 0.5) * 5);
          if (T.kind > 0) { if (d >= td + 4) hg += T.amt; else if (d >= td) { hg += T.amt * (d - td + 1) / 5; if (!fl) fl = 5; } }
          else { if (d < td - 1) hg += T.amt; else if (d < td + 1) hg += T.amt * (td + 1 - d) / 3; }
        }
        // cueva / hueco: cuenco que se hunde con borde irregular (sombra arrojada y oclusión profundas)
        if (m.cave) {
          const C = m.cave, ex = (x - C.cx) / C.rx, ey = (d - C.d) / C.ry, rr = ex * ex + ey * ey + (K.vn(x * 0.2, y * 0.2, sd + 50) - 0.5) * 0.5;
          if (rr < 1) { hg -= C.dep * Math.sqrt(1 - rr); alb -= 0.08; if (rr < 0.55) fl = fl || 6; }
        }
        // estratos (albedo y juntas de estratificación que se interrumpen)
        if (o.strata !== false) {
          const sv = d + (K.vn(x * 0.012, 3.3, sd) - 0.5) * 22 + (K.vn(x * 0.05, 4.1, sd) - 0.5) * 5;
          const band = Math.floor(sv / 23), bf = sv - band * 23;
          alb += (hash1(band, sd + 5) - 0.5) * 0.1;
          if (bf < 1 && d > cap + 2 && K.vn(x * 0.045, band, sd + 6) > 0.68) hg -= 1.1;
        }
        // vetas de humedad bajo las juntas (oscuras y verticales)
        if (hash1(x, sd + 8) < 0.07 && K.vn(x * 0.3, y * 0.04, sd + 9) > 0.55) alb -= 0.08;
        // pedregal al pie: cantos semiesféricos más salientes
        if (d > screeD - 30) {
          const cw = 13, ch = 9, gx = Math.floor(x / cw), gc = Math.floor(y / ch);
          let best = -1, bh = 0;
          for (let jj = -1; jj <= 1; jj++) for (let ii = -1; ii <= 1; ii++) {
            const cx = gx + ii, cy = gc + jj, px = (cx + 0.2 + hash2(cx, cy, sd + 20) * 0.6) * cw, py = (cy + 0.2 + hash2(cx, cy, sd + 21) * 0.6) * ch;
            const pd = py - gyAt(Math.round(px)); if (hash2(cx, cy, sd + 22) > clamp((pd - screeD) / 28, 0, 0.92)) continue;
            const rr = (0.55 + hash2(cx, cy, sd + 23) * 0.45) * cw * 0.62, ex = (x - px) / rr, ey = (y - py) / (rr * 0.8), q = 1 - ex * ex - ey * ey;
            if (q > 0 && q > best) { best = q; bh = m.pro + 5 + Math.sqrt(q) * rr * 0.9; }
          }
          if (best > 0) { hg = bh; alb = 0.92 + (alb - 1) * 0.5; fl = 4; }
        }
        if (o.alb) alb += o.alb(x, y, d);
        const i = row + xi; H[i] = hg; A[i] = alb; F[i] = fl;
      }
    }
    // cavidad: media 9×9 de H (imagen integral sobre píxeles válidos)
    const SW = w + 1, S = new Float64Array(SW * (h + 1)), C = new Uint32Array(SW * (h + 1));
    for (let y = 0; y < h; y++) {
      let rs = 0, rc = 0;
      for (let x = 0; x < w; x++) { const v = H[y * w + x]; if (v > NONE) { rs += v; rc++; } S[(y + 1) * SW + x + 1] = S[y * SW + x + 1] + rs; C[(y + 1) * SW + x + 1] = C[y * SW + x + 1] + rc; }
    }
    const buf = new Uint32Array(N), lip = U(o.lip || '#fde3a8'), DBG = o.debug ? { lam: new Float32Array(N), sh: new Float32Array(N), ao: new Float32Array(N), t: new Float32Array(N) } : null;
    const L0 = LV[0], L1 = LV[1], L2 = LV[2];
    for (let y = 0; y < h; y++) {
      const ya = Math.max(0, y - 4), yb = Math.min(h, y + 5);
      for (let x = 0; x < w; x++) {
        const i = y * w + x, h0 = H[i]; if (h0 <= NONE) continue;
        const hl = x > 0 && H[i - 1] > NONE ? H[i - 1] : h0, hr = x < w - 1 && H[i + 1] > NONE ? H[i + 1] : h0;
        const hu = y > 0 && H[i - w] > NONE ? H[i - w] : h0, hd = y < h - 1 && H[i + w] > NONE ? H[i + w] : h0;
        const nx = clamp((hl - hr) * 0.5, -2.6, 2.6), ny = clamp((hu - hd) * 0.5, -2.6, 2.6);
        let lam = (nx * L0 + ny * L1 + L2) / Math.sqrt(nx * nx + ny * ny + 1); if (lam < 0) lam = 0;
        // sombra arrojada (marcha hacia la luz)
        let sh = 0;
        for (let k = 2; k <= 24; k += 3) {
          const sx = x + Math.round(SDX * k), sy = y + Math.round(SDY * k); if (sx < 0 || sy < 0) break;
          const hs = H[sy * w + sx]; if (hs <= NONE) continue;
          const ex = hs - h0 - SLOPE * k; if (ex > 0) { sh = Math.max(sh, Math.min(1, ex / 1.6)); if (sh >= 1) break; }
        }
        const xa = Math.max(0, x - 4), xb = Math.min(w, x + 5);
        const cnt = C[yb * SW + xb] - C[ya * SW + xb] - C[yb * SW + xa] + C[ya * SW + xa];
        const mean = cnt ? (S[yb * SW + xb] - S[ya * SW + xb] - S[yb * SW + xa] + S[ya * SW + xa]) / cnt : h0;
        const ao = Math.min(0.2, Math.max(0, mean - h0) * 0.028);
        const d = y - gyA[x], fl = F[i];
        let t = A[i] * (0.2 + 0.8 * lam * (1 - 0.72 * sh)) - ao - clamp((d - 60) / 170, 0, 0.34);
        t += (hash2((bx0 + x) >> 1, y >> 1, sd + 31) - 0.5) * 0.042;
        if (fl === 1 || fl === 2) t = Math.min(t, fl === 2 ? 0.13 + (d < 8 ? 0.2 : 0) : 0.24);
        else if (fl === 6) t = Math.min(t, 0.1 + lam * 0.12);
        const k = clamp(Math.round(t * 16), 1, fl === 3 ? 16 : 14);
        const cool = clamp(sh * 0.9 + (fl === 2 ? 0.8 : fl === 1 ? 0.5 : fl === 6 ? 0.9 : 0) + clamp((d - 90) / 120, 0, 0.5), 0, 1);
        let u = cool > 0.05 ? K.mixU(RR.lit[k], RR.sh[k], cool) : RR.lit[k];
        if (fl === 3 && d <= 1 && k > 11) u = K.mixU(u, lip, 0.6);
        buf[i] = u;
        if (DBG) { DBG.lam[i] = lam; DBG.sh[i] = sh; DBG.ao[i] = ao; DBG.t[i] = t; }
      }
    }
    return { bx0, w, h, buf, ms, cols, gyA, H, F, DBG };
  }


  /* ---------- r3-coast: cara de CANTOS esculpidos (opcional por tramo: s.r3b = true) ----------
     Sobre el búfer columnar se superponen masas redondeadas en hileras irregulares (más grandes arriba):
     cada canto con normal elipsoidal facetada (luz arriba-izquierda), canto superior cálido de 1 px,
     panza en sombra violácea, oclusión bajo el canto de encima y grietas granate (#602212/#3e0c03)
     entre cantos. Los huecos entre masas quedan como recovecos oscuros. */
  const R3B_CREV = [U('#3e0c03'), U('#4e1608'), U('#602212')];
  function r3bLayout(bx0, w, h, gyAt, seed, o = {}) {
    const r = RNG(seed), B = [];
    let d = 0;
    for (let row = 0; d < h + 30; row++) {
      const big = row === 0 ? 1.25 : row === 1 ? 1.1 : 0.95;
      let rowH = 0;
      for (let x = bx0 - r.int(4, 22); x < bx0 + w + 24;) {
        const rx = Math.round((o.rMin || 9) + r() * ((o.rMax || 20) - (o.rMin || 9))) * big, ry = rx * (0.85 + r() * 0.75);
        const cx = x + rx, top = d + (row === 0 ? 1 + r.int(0, 4) : r.int(-4, 6));
        B.push({ cx, cy: gyAt(Math.round(cx)) + top + ry, rx, ry, row, id: B.length, tone: (r() - 0.5) * 0.16, fq: 0.34 + r() * 0.2, fs: r.int(1, 1e5), plant: r() < 0.42, p: 2.6 + r() * 1.4, crk: r() < 0.5 ? cx + (r() - 0.5) * rx : null });
        rowH = Math.max(rowH, ry * 2);
        x += rx * (1.55 + r() * 0.4);
      }
      d += rowH * (0.62 + r() * 0.12);
    }
    // índice por columnas de 32 px
    const bins = new Map();
    for (const b of B) for (let k = Math.floor((b.cx - b.rx) / 32); k <= Math.floor((b.cx + b.rx) / 32); k++) { if (!bins.has(k)) bins.set(k, []); bins.get(k).push(b); }
    return { B, bins };
  }
  /** canto más cercano en (x, y): {b, d1, d2} con métrica elíptica */
  function r3bNear(L, x, y) {
    const list = L.bins.get(Math.floor(x / 32)); let d1 = 9, d2 = 9, b1 = null;
    if (list) for (const b of list) { const nx = Math.abs(x - b.cx) / b.rx, ny = Math.abs(y - b.cy) / b.ry, d = Math.pow(Math.pow(nx, b.p) + Math.pow(ny, b.p), 2 / b.p); if (d < d1) { d2 = d1; d1 = d; b1 = b; } else if (d < d2) d2 = d; }
    return { b: b1, d1, d2 };
  }
  /** color del canto en (x, y) o null si cae en un hueco */
  function r3bShade(L, RR, x, y, sd) {
    const q = r3bNear(L, x, y), b = q.b; if (!b || q.d1 >= 1) return { u: null, q };
    const ax = (x - b.cx) / b.rx, ay = (y - b.cy) / b.ry;
    // normal de superelipse (bloque redondeado) con facetas pictóricas: cuantizada y desplazada por canto
    let gx = Math.sign(ax) * Math.pow(Math.abs(ax), b.p - 1), gy = Math.sign(ay) * Math.pow(Math.abs(ay), b.p - 1);
    const gl = Math.hypot(gx, gy, 0.55 * (1 - q.d1) + 0.08); gx /= gl; gy /= gl;
    const fq = b.fq, jx = (hash2((x + b.fs) >> 2, (y + b.fs) >> 3, sd) - 0.5) * fq;
    let nx = Math.round((gx + jx) / fq) * fq, ny = Math.round(gy / fq) * fq;
    const nz = Math.sqrt(Math.max(0, 1 - Math.min(1, nx * nx + ny * ny)));
    const lam = clamp(-nx * 0.55 - ny * 0.75 + nz * 0.5, 0, 1.2);
    let t = 0.16 + 0.7 * lam + b.tone + (hash2(x >> 1, y >> 1, sd + 7) - 0.5) * 0.05;
    let cool = clamp((0.36 - lam) * 1.6 + (ay > 0.6 ? 0.3 : 0), 0, 0.85);
    // grieta vertical que parte algunos bloques
    if (b.crk != null && Math.abs(x - (b.crk + Math.round(Math.sin(y * 0.3 + b.fs) * 1.2))) < 1 && ay > -0.7 && ay < 0.85) return { u: R3B_CREV[1], q };
    // oclusión bajo el canto de arriba (el píxel 3 px más arriba pertenece a otro canto más alto)
    const up = r3bNear(L, x, y - 3);
    if (up.b && up.b !== b && up.d1 < 1 && up.b.cy < b.cy) { t -= 0.26; cool = Math.min(1, cool + 0.3); }
    // canto superior cálido de 1 px (el píxel de arriba ya no es de este canto)
    const a1 = r3bNear(L, x, y - 1);
    const rim = (a1.b !== b || a1.d1 >= 1) && ay < -0.2 && ax < 0.7;
    let u;
    if (q.d2 - q.d1 < 0.2 && q.d2 < 1.6) u = R3B_CREV[(hash2(x >> 1, y >> 1, sd + 3) * 3) | 0];
    else if (rim) u = U('#fdd89a');
    else if (ny < -0.55 && lam > 0.75) u = K.mixU(RR.lit[15], U('#f8c890'), 0.45);   // cabeza al sol, melocotón
    else {
      const k = clamp(Math.round(t * 16), 1, 15);
      u = cool > 0.05 ? K.mixU(RR.lit[k], RR.sh[k], cool) : RR.lit[k];
    }
    return { u, q };
  }
  function r3bApply(R, s, world) {
    const { bx0, w, h, buf, gyA } = R;
    const RR = ramp17(s.ramp || RAMP.rockWarmR, s.shadeHue || '#2a0c2e');
    const gyAt = (x) => gyA[clamp(x - bx0, 0, w - 1)], sd = ((s.seed | 0) * 131 + 29) & 0xffff;
    const L = r3bLayout(bx0, w, h, gyAt, (s.seed | 0) * 977 + 41, s.r3bOpt || {});
    for (let y = 0; y < h; y++) for (let xi = 0; xi < w; xi++) {
      const i = y * w + xi; if (!(buf[i] >>> 24)) continue;
      const x = bx0 + xi, d = y - gyA[xi]; if (d < 0) continue;
      const S = r3bShade(L, RR, x, y, sd);
      if (S.u != null) buf[i] = S.u;
      else buf[i] = K.mixU(buf[i], R3B_CREV[d % 7 === 0 ? 0 : 1], 0.62); // recoveco entre masas
    }
    R.r3b = L; R.r3bRR = RR; R.r3bSd = sd;
    return R;
  }
  /** plantas en las cabezas de algunos cantos y masas que desbordan el borde libre (voladizo) */
  function r3bPost(pb, world, s, R) {
    const L = R.r3b; if (!L) return;
    const opaque = (x, y) => (K.get(pb, x, y) >>> 24) === 255;
    const gyAt = (x) => world.ground[clamp(Math.round(x), 0, world.w)];
    for (const b of L.B) {
      if (!b.plant || b.row === 0 || b.cx < s.x0 + 4 || b.cx > s.x1 - 4) continue;
      const x = Math.round(b.cx - b.rx * 0.25), y = Math.round(b.cy - b.ry) + 1;
      if (y > world.h - 8 || y < gyAt(x) + 6 || !opaque(x, y + 2)) continue;
      const k = hash2(b.id, 3, R.r3bSd);
      if (k < 0.34) PFFlora.tuft(pb, x, y, 6 + k * 10, 5 + k * 8, x * 3 + y, s.tuftRamp || RAMP.grassR);
      else if (k < 0.5) PFFlora.flowerPatch(pb, x, y, 7, x + y);
      else if (k < 0.62) { for (let q = 0; q < 2; q++) PFFlora.lupine(pb, x + q * 3, y, 7 + q * 4, x + q); }
      else if (k < 0.74) PFFlora.fern(pb, x, y, 8, x + y * 3);
      else if (k < 0.82) PFFlora.agave(pb, x, y, 4, x + y);
      else hangRoot(pb, x + 2, Math.round(b.cy + b.ry * 0.6), 4 + ((k * 40) | 0) % 9, x * 13 + y);
    }
    // voladizo: los cantos del borde libre derecho desbordan la arista recta (solo bajo el canto superior)
    if (s.r3bSpill) {
      const [xa, xb] = s.r3bSpill;
      for (let x = xa; x < xb; x++) for (let y = gyAt(s.x1 - 1) + 4; y < world.h; y++) {
        if (opaque(x, y)) continue;
        const S = r3bShade(L, R.r3bRR, x, y, R.r3bSd);
        if (S.u != null && S.q.b.cx < s.x1 + 4) K.put(pb, x, y, S.u);
      }
    }
  }

  /** Búfer del tramo 'cliff' (perezoso) */
  function build(s, world) {
    const segs = (world.def.pf && world.def.pf.terrain) || [];
    const nb = (xe, left) => segs.find(o => o.x0 !== s.x0 && (left ? o.x1 === xe : o.x0 === xe));
    const voidL = s.edgeL != null ? s.edgeL : (nb(s.x0, true) && nb(s.x0, true).face === 'void' ? s.x0 : null);
    const voidR = s.edgeR != null ? s.edgeR : (nb(s.x1, false) && nb(s.x1, false).face === 'void' ? s.x1 : null);
    const R = field({
      x0: s.x0, x1: s.x1, h: world.h, gyAt: (x) => world.ground[clamp(Math.round(x), 0, world.w)],
      ramp: s.ramp || RAMP.rockWarmR, seed: (s.seed | 0) + 3, lip: s.lip, hue: s.shadeHue, heads: s.heads !== false,
      tiers: s.tiers, scree: s.scree, screeD: s.screeD, edgeL: voidL, edgeR: voidR,
    });
    return s.r3b ? r3bApply(R, s, world) : R;
  }
  function pix(s, x, y, gy, world) {
    let R = s._r2; if (!R) R = s._r2 = build(s, world);
    const xi = x - R.bx0; if (xi < 0 || xi >= R.w || y < 0 || y >= R.h) return 0;
    return R.buf[y * R.w + xi];
  }

  /* ---------- vegetación de grietas, repisas y voladizos ---------- */
  const ROOT = ['#2a1a0e', '#4a3018', '#3b5320', '#617517', '#91a229'];
  function hangRoot(pb, x, y, L, seed) {
    const r = RNG(seed), C = ROOT.map(c => U(c));
    let xx = x;
    for (let k = 0; k < L; k++) {
      if (r() < 0.2) xx += r() < 0.5 ? -1 : 1;
      K.put(pb, xx, y + k, C[k < 2 ? 1 : (k % 3 === 0 ? 2 : 3)]);
      if (r() < 0.16) K.put(pb, xx + (r() < 0.5 ? -1 : 1), y + k, C[4]);
    }
    K.put(pb, xx, y + L, C[0]);
  }
  function post(pb, world, s) {
    const R = s._r2; if (!R) return;
    const r = RNG((s.seed | 0) * 31 + 5), sparse = s.ledgePlants === false, H = world.h;
    const gyAt = (x) => world.ground[clamp(Math.round(x), 0, world.w)];
    const inSeg = (x) => x >= s.x0 + 3 && x < s.x1 - 3;
    const opaque = (x, y) => (K.get(pb, x, y) >>> 24) === 255;
    for (const m of R.ms) for (const T of [m.tier, m.tier2]) {
      if (!T) continue;
      const tdAt = (x) => T.d + Math.round((K.vn(x * 0.06, m.i + 0.5, 11) - 0.5) * 5);
      if (T.kind > 0) {
        // repisa: mata, helecho, flores y agave sobre la cara superior iluminada
        const cs = []; for (let n = 1 + r.int(0, Math.max(1, Math.round((T.x1 - T.x0) / 50))); n > 0; n--) cs.push([T.x0 + r() * (T.x1 - T.x0), 8 + r() * 16]);
        for (let x = T.x0 + 3 + r.int(0, 4); x < T.x1 - 3; x += (sparse ? 7 : 4) + r.int(0, sparse ? 8 : 5)) {
          if (!inSeg(x) || !cs.some(([cx, cr]) => Math.abs(x - cx) < cr)) continue;
          const y = gyAt(x) + tdAt(x) + 2; if (y > H - 8 || !opaque(x, y + 2)) continue;
          const k = r();
          if (sparse) { if (k < 0.55) PFFlora.tuft(pb, x, y, 6 + r() * 5, 4 + r() * 5, x * 3 + y, s.tuftRamp || RAMP.grassR); else if (k < 0.75) PFFlora.flowerPatch(pb, x, y, 6, x + y); continue; }
          if (k < 0.3) PFFlora.tuft(pb, x, y, 7 + r() * 6, 6 + r() * 6, x * 3 + y);
          else if (k < 0.46) PFFlora.bush(pb, x, y, 10 + r() * 9, 7 + r() * 6, RAMP.foliageR, x + y);
          else if (k < 0.56) PFFlora.hibiscusBush(pb, x, y, 11 + r() * 5, 9 + r() * 4, x * 7 + y);
          else if (k < 0.66) { for (let q = 0; q < 3; q++) PFFlora.lupine(pb, x + q * 3, y, 8 + r() * 7, x + q); }
          else if (k < 0.8) PFFlora.flowerPatch(pb, x, y, 9, x + y);
          else if (k < 0.9) PFFlora.fern(pb, x, y, 9, x + y * 3);
          else PFFlora.agave(pb, x, y, 5, x + y);
        }
      } else {
        // voladizo: raíces y lianas que cuelgan de la panza
        for (let x = T.x0 + 2 + r.int(0, 6); x < T.x1 - 2; x += 5 + r.int(0, 12)) {
          if (!inSeg(x) || r() < (sparse ? 0.55 : 0.3)) continue;
          const y = gyAt(x) + tdAt(x) + 1; if (y > H - 10) continue;
          hangRoot(pb, x, y, 4 + r.int(0, sparse ? 7 : 14), x * 13 + y);
        }
      }
    }
    // flecos de hierba que asoman por el canto (en matas, no continuos) y alguna flor
    if (s.fringe !== false) {
      const G = (s.fringeRamp || RAMP.grassR).map(c => U(c)), FL = ['#f47a90', '#ffd84a', '#fff2c0', '#e94a64'].map(c => U(c));
      for (let x = s.x0 + 2; x < s.x1 - 2; x++) {
        const v = K.vn(x * 0.09, 0.5, (s.seed | 0) + 61); if (v < (sparse ? 0.62 : 0.5)) continue;
        const gy = Math.round(gyAt(x)), L = 1 + Math.floor((v - 0.5) * 9 * hash2(x, 7, 3)) + (hash2(x, 8, 3) < 0.12 ? 3 : 0);
        for (let q = 0; q < L; q++) K.put(pb, x + (q > 2 && hash2(x, 9, 3) < 0.5 ? 1 : 0), gy + 1 + q, G[clamp(G.length - 2 - q, 1, G.length - 1)]);
        if (!sparse && hash2(x, 10, 3) < 0.035) { const c = FL[Math.floor(hash2(x, 11, 3) * 4)]; K.put(pb, x, gy + 1 + L, c); K.put(pb, x + 1, gy + 1 + L, c); }
      }
    }
    // raíces y matas que cuelgan del canto superior y salen de los barrancos
    for (const c of R.cols) {
      const cx = Math.round((c.x0 + c.x1) / 2); if (!inSeg(cx)) continue;
      const gy = gyAt(cx);
      if (c.hang) hangRoot(pb, c.x0 + 2 + r.int(0, Math.max(1, c.x1 - c.x0 - 4)), gy + c.cap + 1, 5 + r.int(0, 12), c.sd);
      if (c.i === c.m.c0 && r() < (sparse ? 0.35 : 0.7)) {
        const y = gy + c.m.notch + 2 + r.int(0, 30); if (y > H - 10 || y > gy + 110) continue;
        const k = r(), x = c.x0 + 1;
        if (sparse) PFFlora.tuft(pb, x, y, 6 + r() * 4, 4 + r() * 4, x + y, s.tuftRamp || RAMP.grassR);
        else if (k < 0.45) PFFlora.fern(pb, x, y, 8 + r() * 5, x + y * 3);
        else if (k < 0.75) PFFlora.tuft(pb, x, y, 7 + r() * 5, 6 + r() * 5, x + y);
        else PFFlora.flowerPatch(pb, x, y, 7, x * 5 + y);
      }
      // matas en algunas juntas salientes (escalones)
      for (const b of c.br) {
        if (b.off < 1.2 || r() > (sparse ? 0.03 : 0.07)) continue;
        const x = Math.round(c.x0 + 2 + r() * Math.max(1, c.x1 - c.x0 - 4)), y = gy + b.d + 1;
        if (y > H - 8 || y > gy + 140 || !opaque(x, y + 1)) continue;
        PFFlora.tuft(pb, x, y, 6 + r() * 4, 4 + r() * 5, x * 3 + y, s.tuftRamp || RAMP.grassR);
      }
    }
    if (R.r3b) r3bPost(pb, world, s, R);
  }
  return { build, pix, post, field, ramp17, structure, hangRoot, LV, r3bApply, r3bLayout };
})();
