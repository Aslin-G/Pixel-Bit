/* =====================================================================
   18c_pf_terrain.js — Terreno del plano jugable en 3/4 (kit PF).
   · surface(pb, world): caras superiores visibles (camino, arena, losa,
     cubierta de muelle, roca) dibujadas DETRÁS de la línea de paso, con
     borde posterior irregular, desgaste de sendero y luz de labio.
   · render(world): caras frontales bajo la línea de paso → lienzo del
     terreno. Acantilado de bloques columnares con 3 facetas, grietas,
     sombras de cornisa, labios iluminados y plantas en repisas; playa
     que avanza hacia la cámara y termina en rocas oscuras; campo de
     cantos rodados; muros de muelle de hormigón con manchas; muelle con
     pilotes y HUECO transparente para el corte submarino.
   · Plataformas estáticas horneadas en 3/4 (repisa de roca, pasarela).
   Opt-in: el nivel define def.pf = { terrain:[{x0,x1,surf,face,depth}] }.
   ===================================================================== */
const PFTerrain = (() => {
  const LIP = '#fde3a8';
  const CONC = ['#2a2420', '#443930', '#6e625b', '#7b7679', '#ac9b82', '#cebaac', '#e6d6c0', '#f5e5c3'];
  const STAIN = '#4b586e';
  const SANDF = ['#3a2008', '#67430f', '#96592b', '#b8793a', '#c58440', '#d89a4e', '#edaf5f', '#fccf85', '#f9da99', '#fde9bd'];
  const PAVE = ['#3a2418', '#5c3a26', '#86583a', '#a8744a', '#c8945e', '#e2b67a', '#f2d09a', '#fbe6c0'];
  const DECK = ['#262a33', '#3c3f4a', '#5f6066', '#86837f', '#a9a299', '#c9c0b2', '#e2d8c6', '#f4ecdc'];

  const UWU = () => PFK.P32(RAMP.underR);
  function segAt(segs, x) { for (const s of segs) if (x >= s.x0 && x < s.x1) return s; return segs[segs.length - 1]; }
  function depthOf(s) { return s.depth ?? ({ path: 14, sand: 12, deck: 18, paving: 16, rock: 12, grass: 12 }[s.surf] || 12); }

  /* ---------- acantilado columnar ---------- */
  function buildCols(x0, x1, seed) {
    const r = RNG(seed), cols = [];
    let x = x0 - r.int(4, 14);
    while (x < x1 + 30) {
      const w = r.int(14, 34);
      const blocks = []; let y = 136 + r.int(0, 30);
      while (y < 720) { const bh = r.int(20, 60); blocks.push({ y, h: bh, tilt: (r() - 0.5) * 0.45, cap: r.int(4, 10), pro: r() < 0.45, alb: (r() - 0.5) * 0.14 }); y += bh; }
      cols.push({ x0: x, x1: x + w, seed: r.int(1, 1e6), blocks, p: r() });
      x += w;
    }
    return cols;
  }
  function colEdge(c, y) { return c.x0 + Math.round((PFK.vn(y * 0.045, c.seed * 0.001, 3) - 0.5) * 7 + (PFK.cl(c.x0, y, 3, c.seed) - 0.5) * 1.5); }
  const LV = (() => { const l = [-0.55, -0.7, 0.46], m = Math.hypot(...l); return l.map(v => v / m); })();
  /** Acantilado de bloques columnares redondeados con luz de Lambert (arriba-izquierda) */
  function cliffPix(s, x, y, gy, P) {
    const cols = s._cols;
    let ci = s._ci; while (ci > 0 && cols[ci].x0 > x + 5) ci--; while (ci < cols.length - 1 && cols[ci + 1].x0 <= x - 5) ci++;
    if (ci < cols.length - 1 && x >= colEdge(cols[ci + 1], y)) ci++; else if (ci > 0 && x < colEdge(cols[ci], y)) ci--;
    s._ci = ci;
    const c = cols[ci], prev = cols[Math.max(0, ci - 1)];
    const left = colEdge(c, y), right = ci < cols.length - 1 ? colEdge(cols[ci + 1], y) : c.x1;
    const w = Math.max(6, right - left), dl = x - left, dr = right - 1 - x;
    const off = (bl) => Math.round(bl.tilt * (x - left - w / 2) + (PFK.cl(x, bl.y, 2, c.seed) - 0.5) * 2);
    let bi = 0; const B = c.blocks;
    while (bi < B.length - 1 && y >= B[bi + 1].y + off(B[bi + 1])) bi++;
    const bl = B[bi], rawTop = bl.y + off(bl), bTop = Math.max(rawTop, gy + 1), bBot = (B[bi + 1] ? B[bi + 1].y + off(B[bi + 1]) : 999);
    const dt = y - bTop, db = bBot - 1 - y, d = y - gy;
    // grietas entre columnas y juntas entre bloques
    const gap = 1 + (c.p < 0.35 ? 1 : 0);
    if (dl <= gap - 1 || (dl === gap && PFK.cl(x, y, 2, c.seed) < 0.5)) return P[d < 4 ? 3 : 0];
    if (dr <= 0 && PFK.cl(x, y, 2, c.seed + 1) < 0.6) return P[1];
    if (rawTop > gy + 2 && dt <= 0) return P[0];
    if (rawTop > gy + 2 && dt === 1 && PFK.cl(x, y, 2, c.seed + 3) < 0.55) return P[1];
    // normal de caja redondeada: tapa ancha si el bloque sobresale
    const rcx = Math.min(5, w * 0.3), rTop = bl.pro ? bl.cap + 2 : Math.max(3, bl.cap - 2), rBot = 4;
    let nx = 0, ny = 0;
    if (dl < rcx) nx = -(1 - dl / rcx); else if (dr < rcx + 1) nx = 1 - dr / (rcx + 1);
    if (dt < rTop) ny = -(1 - dt / rTop) * 0.95; else if (db < rBot) ny = (1 - db / rBot) * 0.9;
    const nz = Math.sqrt(Math.max(0.02, 1 - nx * nx - ny * ny));
    let lam = (nx * LV[0] + ny * LV[1] + nz * LV[2]);
    let t = 0.2 + Math.max(-0.2, lam) * 0.78 + bl.alb + (c.p - 0.5) * 0.16;
    if (c.p < 0.3) t -= 0.1;                         // columnas que se retraen: más oscuras
    if (dl <= gap + 2) t -= (gap + 3 - dl) * 0.05;   // oclusión junto a la grieta
    // sombra proyectada por la columna izquierda saliente y por la cornisa superior (bloques que se retraen)
    if (prev.p > c.p + 0.2 && dl < 3 + Math.round((prev.p - c.p) * 8)) t -= 0.22;
    if (!bl.pro && dt < 4 && bi > 0 && rawTop > gy + 3) t -= 0.25 - dt * 0.05;
    // textura pictórica: manchas en clusters, vetas verticales, motas
    t += (PFK.vn(x * 0.13, y * 0.05, c.seed & 255) - 0.5) * 0.26 + (PFK.cl(x, y, 2, c.seed + 9) - 0.5) * 0.12;
    if (PFK.vn(x * 0.7, y * 0.04, c.seed & 127) > 0.85 && dt > rTop) t -= 0.18;
    const h = hash2(x, y, c.seed); if (h < 0.025) t += 0.12; else if (h > 0.975) t -= 0.2;
    // primer plano más oscuro hacia abajo
    t -= clamp((d - 70) / 160, 0, 0.32);
    return P[clamp(Math.round(t * 8.4), 0, 8)];
  }

  /* ---------- cantos rodados (Worley) ---------- */
  function boulderPix(x, y, seed, cw, ch, P, opts = {}) {
    const gx = Math.floor(x / cw), gyc = Math.floor(y / ch);
    let d1 = 9, d2 = 9, sx = 0, sy = 0, rr = 1, id = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const cx = gx + i, cy = gyc + j;
      const px = (cx + 0.2 + hash2(cx, cy, seed) * 0.6) * cw, py = (cy + 0.2 + hash2(cx, cy, seed + 1) * 0.6) * ch;
      const r = (0.62 + hash2(cx, cy, seed + 2) * 0.4) * cw * 0.62;
      const dd = Math.hypot((x - px) / r, (y - py) / (r * 0.78));
      if (dd < d1) { d2 = d1; d1 = dd; sx = px; sy = py; rr = r; id = cx * 31 + cy; } else if (dd < d2) d2 = dd;
    }
    if (d1 > 1.02) return -1; // hueco
    if (opts.keep && !opts.keep(id, sy)) return -1;
    if (d2 - d1 < 0.09) return P[0];
    const nx = (x - sx) / rr, ny = (y - sy) / (rr * 0.78);
    let t = 0.52 - nx * 0.32 - ny * 0.42 + (PFK.cl(x, y, 2, seed + id) - 0.5) * 0.22 + (hash2(id, 3, seed) - 0.5) * 0.16;
    if (d1 > 0.86) t -= 0.18;
    if (ny < -0.55 && nx < 0.3 && d1 > 0.7) t += 0.2; // borde iluminado
    let k = Math.round(t * (P.length - 1));
    if (hash2(x, y, seed + 4) < 0.04) k++;
    return P[clamp(k, 1, P.length - 1)];
  }

  /* ---------- caras frontales ---------- */
  function facePix(s, x, y, gy, world) {
    const d = y - gy;
    const RW = PFK.P32(RAMP.rockWarmR);
    const sea = s._sea && x >= s._sea.x0 && x <= s._sea.x1 ? s._sea.y : null;
    switch (s.face) {
      case 'cliff': return cliffPix(s, x, y, gy, RW);
      case 'rocks': {
        if (d <= 1) return U(d === 0 ? LIP : '#e29441');
        const u = boulderPix(x, y, s.seed || 77, 20, 15, RW, sea != null ? { keep: (id, cy) => cy < sea + 4 || hash2(id, 5, s.seed || 77) < clamp(1 - (cy - sea) / 46, 0.12, 1) } : {});
        if (sea != null && y >= sea - 1) { // rocas sumergidas: tinte azul por profundidad, huecos de agua
          if (u === -1) return 0;
          return PFK.mixU(u, UWU()[clamp(6 - Math.round((y - sea) / 22), 1, 6)], clamp(0.42 + (y - sea) / 110, 0.42, 0.8));
        }
        if (u === -1) return RW[d > 60 ? 0 : 1];
        return d > 90 ? PFK.shU(u, -0.25, 15) : u;
      }
      case 'beach': {
        const S = PFK.P32(SANDF);
        if (d === 0) return S[9];
        if (sea != null) { // orilla: arena húmeda que entra al agua
          if (y >= sea + 3 + Math.round((PFK.vn(x * 0.08, 0, 3) - 0.5) * 4)) return 0;
          const kk = 6 - Math.round(d * 0.5) + (PFK.cl(x, y, 2, 3) < 0.2 ? -1 : 0);
          return S[clamp(kk, 2, 8)];
        }
        const rockZone = clamp((d - 34) / 40, 0, 1);
        if (rockZone > 0 && PFK.cl(x, y, 3, 41) < rockZone * 1.2) {
          const u = boulderPix(x, y + 7, (s.seed || 5) + 3, 17, 12, RW);
          if (u !== -1) return d > 80 ? PFK.shU(u, -0.3, 15) : u;
          if (rockZone > 0.6) return RW[d > 70 ? 0 : 1];
        }
        let t = 0.82 - d * 0.009 + (PFK.vn(x * 0.06, y * 0.2, 9) - 0.5) * 0.18 + (PFK.cl(x, y, 2, 3) - 0.5) * 0.08;
        const rip = (y * 0.9 + Math.sin(x * 0.055) * 3 + PFK.vn(x * 0.02, 0, 4) * 6) % 6;
        if (rip < 1) t -= 0.1; else if (rip < 2) t += 0.04;
        let k = Math.round(t * 9);
        const hh = hash2(x, y, 11);
        if (hh < 0.004) return U(hh < 0.002 ? '#fff6e8' : '#f4a0b0');
        if (hh > 0.993) k -= 3;
        return S[clamp(k, 1, 9)];
      }
      case 'quay': case 'pier': {
        const C = PFK.P32(CONC);
        const wl = s.waterY ?? 9999;
        if (s.face === 'pier' && d >= 10 && s._hole && x >= s._hole[0] && x <= s._hole[1]) return 0;
        const row = Math.floor((y - gy - 2) / 9), off = (row % 2) * 9;
        if (d === 0) return C[7];
        if (d === 1) return C[6];
        const jx = (x + off + 400) % 19, jy = (y - gy - 2) % 9;
        let k = 4 + Math.round((PFK.vn(x * 0.11, y * 0.11, 5) - 0.5) * 2.4 + (PFK.cl(x, y, 2, row) - 0.5) * 0.8);
        if (jx === 0 || jy === 8) k = 1; else if (jy === 0) k = 6; else if (jx === 1) k = 5; else if (jx === 18) k = 2;
        if (y > wl - 4) { // manchas de agua y algas bajo la línea de agua
          let st = PFK.mixU(C[clamp(k, 0, 7)], U(STAIN), clamp((y - wl + 4) / 14, 0.25, 0.75));
          if (y > wl && hash2(x, y, 3) < 0.05) st = U('#2f5a3a');
          if (y > wl + 2) st = PFK.mixU(st, UWU()[clamp(7 - Math.round((y - wl) / 18), 1, 7)], clamp(0.3 + (y - wl) / 110, 0.3, 0.8));
          return st;
        }
        if (d > 60) k -= 1; if (d > 110) k -= 1;
        if (PFK.vn(x * 0.5, y * 0.03, 9) > 0.8 && jy > 1) k -= 1; // chorreones
        return C[clamp(k, 1, 7)];
      }
      default: return RW[3];
    }
  }

  /* ---------- caras superiores (detrás de la línea de paso) ---------- */
  function surfPix(s, x, y, gy, D, back) {
    const dz = gy - y; // 1..D, 1 = frente
    const t = dz / D; // 0 frente → 1 fondo
    switch (s.surf) {
      case 'path': case 'rock': {
        const S = PFK.P32(SANDF), RW = PFK.P32(RAMP.rockWarmR);
        if (dz === 1) return S[9];
        if (y - back < 2) return RW[3 + (hash2(x, y, 2) < 0.5 ? 1 : 0)];
        let tt = 0.86 - t * 0.28 + (PFK.vn(x * 0.09, y * 0.3, 21) - 0.5) * 0.26 + (PFK.cl(x, y, 2, 22) - 0.5) * 0.1;
        // sendero gastado (más claro) en la franja media
        if (t > 0.25 && t < 0.62) tt += 0.06;
        const hh = hash2(x, y, 23);
        if (hh < 0.025) return RW[4 + (hh < 0.012 ? 2 : 0)]; // piedrecitas
        if (s.surf === 'rock' && PFK.vn(x * 0.07, y * 0.25, 24) > 0.62) return RW[clamp(Math.round(4 + (1 - t) * 3), 0, 8)];
        return S[clamp(Math.round(tt * 9), 2, 9)];
      }
      case 'sand': {
        const S = PFK.P32(SANDF);
        if (dz === 1) return S[9];
        if (s.shore && y - back < 3) return U(y - back < 1 ? '#c58440' : '#a86e36'); // arena húmeda
        let tt = 0.9 - t * 0.22 + (PFK.vn(x * 0.05, y * 0.3, 31) - 0.5) * 0.16;
        const rip = (y * 1.6 + Math.sin(x * 0.045 + y * 0.1) * 4) % 5;
        if (rip < 1) tt -= 0.1;
        const hh = hash2(x, y, 33);
        if (hh < 0.004) return U('#fff6e8');
        return S[clamp(Math.round(tt * 9), 3, 9)];
      }
      case 'deck': {
        const Dk = PFK.P32(DECK);
        if (dz === 1) return Dk[7];
        if (dz === 2) return U('#e8c040'); // franja de seguridad
        if (dz === 3) return U((Math.floor(x / 4) % 2) ? '#e8c040' : '#2a2a30');
        if (y - back < 1) return Dk[3];
        const jx = (x + 600) % 24;
        let k = 5 + Math.round((PFK.vn(x * 0.08, y * 0.4, 41) - 0.5) * 1.6 - t * 0.8);
        if (jx === 0) k = 3; else if (jx === 1) k = 6;
        if ((gy - y) % 7 === 0 && dz > 4) k -= 1;
        if (hash2(x, y, 42) < 0.01) k -= 2;
        if (PFK.vn(x * 0.03, y * 0.2, 43) > 0.78) k -= 1; // manchas de sal/agua
        return Dk[clamp(k, 1, 7)];
      }
      case 'paving': {
        const Pv = PFK.P32(PAVE);
        if (dz === 1) return Pv[7];
        // losas en filas que se acortan hacia el fondo
        const rows = [0, 4, 8, 11, 14, 16, 18, 20];
        let ri = 0; while (ri < rows.length - 1 && dz - 1 >= rows[ri + 1]) ri++;
        const rh = (rows[ri + 1] ?? rows[ri] + 2) - rows[ri];
        const sw = Math.max(8, 22 - ri * 2), jx = (x + ri * 7 + 300) % sw;
        let k = 5 + Math.round((hash2(Math.floor((x + ri * 7) / sw), ri, 51) - 0.5) * 2 - t);
        if (dz - 1 === rows[ri] && ri > 0) k = 2; else if (jx === 0) k = 3; else if (dz - 1 === rows[ri] + 1) k += 1;
        if (hash2(x, y, 52) < 0.02) k -= 1;
        if (y - back < 1) k = 2;
        return Pv[clamp(k, 1, 7)];
      }
      case 'grass': {
        const G = PFK.P32(RAMP.grassR);
        return G[clamp(Math.round((0.8 - t * 0.4 + (PFK.cl(x, y, 2, 61) - 0.5) * 0.4) * 6), 1, 6)];
      }
    }
    return 0;
  }

  function prep(world) {
    const def = world.def, P = def.pf || {};
    const segs = (P.terrain || []).map((s, i) => Object.assign({ seed: 101 + i * 37 }, s));
    for (const s of segs) {
      if (s.face === 'cliff') { s._cols = buildCols(s.x0 - 30, s.x1 + 30, s.seed); s._ci = 0; }
      const w = (world.water || []).find(w => w.cutaway && w.x0 < s.x1 && w.x1 > s.x0);
      if (w) { s._sea = { x0: w.x0, x1: w.x1, y: w.y }; s.waterY = w.y; if (s.face === 'pier') s._hole = [Math.max(s.x0, w.x0), Math.min(s.x1, w.x1)]; }
    }
    return segs;
  }
  /** Profundidad de la cara superior con borde posterior irregular */
  function backEdge(s, x, gy) { const D = depthOf(s); return gy - D - Math.round((PFK.vn(x * 0.07, 0, s.seed) - 0.5) * (s.surf === 'deck' || s.surf === 'paving' ? 0 : 5)); }

  /** Caras superiores → pb (normalmente el lienzo de accesorios, antes de los accesorios) */
  function surface(pb, world) {
    const segs = prep(world), wd = world.w;
    for (let x = 0; x < wd; x++) {
      const s = segAt(segs, x), gy = world.ground[x], back = backEdge(s, x, gy), D = gy - back;
      for (let y = Math.max(0, back); y < gy; y++) { const u = surfPix(s, x, y, gy, D, back); if (u) pb.data[y * pb.w + x] = u; }
    }
    // sombra de contacto en escalones (AO al pie de cada contrahuella)
    for (let x = 1; x < wd - 1; x++) {
      const g0 = world.ground[x - 1], g1 = world.ground[x];
      if (g0 < g1 - 4) for (let k = 0; k < 5; k++) for (let y = g1 - 10; y < g1; y++) { const xx = x + k; const c = PFK.get(pb, xx, y); if (c >>> 24) PFK.put(pb, xx, y, PFK.shU(c, -0.22 + k * 0.04, 20)); }
      if (g1 < g0 - 4) for (let k = 0; k < 4; k++) for (let y = g0 - 8; y < g0; y++) { const xx = x - 1 - k; const c = PFK.get(pb, xx, y); if (c >>> 24) PFK.put(pb, xx, y, PFK.shU(c, -0.18 + k * 0.04, 20)); }
    }
    return segs;
  }

  /** Lienzo del terreno (caras frontales + plataformas horneadas) */
  function render(world) {
    const def = world.def, wd = world.w, hd = world.h;
    const pb = new PixelBuffer(wd, hd);
    const segs = prep(world);
    for (let x = 0; x < wd; x++) {
      const s = segAt(segs, x), gy = world.ground[x];
      const nearB = segs.some(o => o !== s && (Math.abs(x - o.x0) < 10 || Math.abs(x - o.x1) < 10));
      for (let y = Math.max(0, gy); y < hd; y++) {
        let ss = s;
        // frontera orgánica entre materiales: borde vertical ondulado (sin mezcla de ruido)
        if (nearB && s.face !== 'pier') {
          const o = segAt(segs, clamp(x + Math.round((PFK.vn(y * 0.07, 0.5, 13) - 0.5) * 16), 0, wd - 1));
          if (o.face !== 'pier') ss = o;
        }
        const u = facePix(ss, x, y, gy, world);
        if (u) pb.data[y * wd + x] = u;
      }
    }
    // labio: borde superior iluminado + sombra de contacto en caídas
    for (let x = 0; x < wd; x++) {
      const gy = world.ground[x], s = segAt(segs, x);
      if (s.face === 'cliff' || s.face === 'rocks') { PFK.put(pb, x, gy, U(LIP)); if (hash2(x, 1, 3) < 0.5) PFK.put(pb, x, gy + 1, U('#f7c679')); }
      const gl = world.ground[Math.max(0, x - 1)];
      if (gl < gy - 3) for (let y = gl; y < gy + 30; y++) { const c = PFK.get(pb, x - 1, y); if (c >>> 24) PFK.put(pb, x - 1, y, PFK.shU(c, -0.3, 15)); }
    }
    // esquina del acantilado frente al agua: faceta lateral en sombra + borde iluminado
    for (const s of segs) if (s.face === 'cliff') for (const xe of [s.x0, s.x1]) {
      if (xe <= 0 || xe >= wd) continue;
      for (let y = 0; y < hd; y++) for (let x = xe - 16; x < xe + 16; x++) {
        const c = PFK.get(pb, x, y); if (!(c >>> 24)) continue;
        if (!(PFK.get(pb, x + 1, y) >>> 24) && y > world.ground[clamp(x, 0, wd)] + 2) { for (let k = 0; k < 4; k++) { const cc = PFK.get(pb, x - k, y); if (cc >>> 24) PFK.put(pb, x - k, y, PFK.shU(cc, k === 0 ? -0.45 : -0.3 + k * 0.06, 15)); } }
        else if (!(PFK.get(pb, x - 1, y) >>> 24) && y > world.ground[clamp(x, 0, wd)] + 2) PFK.put(pb, x, y, PFK.mixU(c, U('#f7c679'), 0.5));
      }
    }
    // pilotes del muelle (delante del corte submarino)
    for (const s of segs) if (s.face === 'pier' && s._hole) piles(pb, world, s);
    // plantas en repisas del acantilado
    for (const s of segs) if (s.face === 'cliff' && s.ledgePlants !== false) ledgePlants(pb, world, s);
    // plataformas estáticas
    for (const p of world.platforms) if (p.baked) platform(pb, p);
    if (def.pf && def.pf.decorateFace) def.pf.decorateFace(pb, world);
    return pb.toCanvas();
  }

  /** Pilotes de hormigón con manchas, percebes y tinte submarino */
  function piles(pb, world, s) {
    const C = PFK.P32(CONC), wl = s.waterY, h = world.h;
    const [h0, h1] = s._hole;
    const bed = (x) => (world.def.pf && world.def.pf.bedAt) ? world.def.pf.bedAt(x) : h;
    const UW = PFK.P32(RAMP.underR);
    for (let px = h0 + 18; px < h1 - 6; px += 46) {
      const gy = world.ground[px], big = Math.round((px - h0 - 18) / 46) % 2 === 0, pw = big ? 13 : 7;
      // viga transversal bajo la cubierta
      for (let y = gy + 10; y < gy + 14; y++) for (let x = px - 23; x < px + 23; x++) if (x > h0 && x < h1 && !(PFK.get(pb, x, y) >>> 24)) PFK.put(pb, x, y, y === gy + 10 ? U('#1e1a1c') : U('#2c2830'));
      const yb = bed(px);
      for (let y = gy + 10; y < yb; y++) for (let k = 0; k < pw; k++) {
        const x = px - (pw >> 1) + k, f = k / (pw - 1);
        let ki = f < 0.08 ? 2 : f < 0.22 ? 6 : f < 0.45 ? 5 : f < 0.75 ? 4 : f < 0.9 ? 3 : 2;
        if (!big) ki = Math.max(1, ki - 1);
        if (y < gy + 16) ki = Math.max(1, ki - 2); // sombra bajo cubierta
        if (hash2(x, y, 7) < 0.06) ki--;
        let u = C[clamp(ki, 0, 7)];
        if (y > wl - 3 && y < wl + 3) u = PFK.mixU(u, U(STAIN), 0.6);
        if (y >= wl) { // bajo el agua: tinte azul creciente + percebes
          const dd = clamp((y - wl) / 110, 0, 1);
          u = PFK.mixU(u, UW[clamp(6 - Math.round(dd * 5), 0, 7)], (big ? 0.4 : 0.55) + dd * 0.35);
          if (hash2(x, y, 9) < 0.07) u = PFK.mixU(u, U('#2f6a4a'), 0.5);
        }
        PFK.put(pb, x, y, u);
      }
    }
  }
  /** Plantas que crecen en las juntas del acantilado */
  function ledgePlants(pb, world, s) {
    const r = RNG(s.seed + 5);
    for (const c of s._cols) {
      if (c.x0 < s.x0 || c.x1 > s.x1) continue;
      for (const b of c.blocks) {
        const gy = world.ground[clamp(Math.round((c.x0 + c.x1) / 2), 0, world.w)];
        if (b.y < gy + 18 || b.y > gy + 150) continue;
        const k = r();
        const x = Math.round(c.x0 + 2 + r() * (c.x1 - c.x0 - 4)), y = b.y;
        if (k < 0.16) PFFlora.tuft(pb, x, y, 6 + r() * 5, 5 + r() * 6, x * 3 + y);
        else if (k < 0.22) PFFlora.flowerPatch(pb, x, y, 7, x + y);
        else if (k < 0.26) PFFlora.fern(pb, x, y, 7, x + y * 3);
        else if (k < 0.28) PFFlora.agave(pb, x, y, 5, x + y);
      }
    }
  }

  /* ---------- plataformas horneadas ---------- */
  function platform(pb, p) {
    const x = Math.round(p.x), y = Math.round(p.y), w = p.w;
    const RW = PFK.P32(RAMP.rockWarmR);
    if (p.type === 'rock') {
      // cara superior (5 px) con pasto + losa rocosa de 9–11 px con base redondeada
      for (let xx = x - 2; xx < x + w + 2; xx++) {
        const u = (xx - x) / w, edge = Math.min(xx - x + 2, x + w + 2 - xx);
        const top = 5, depth = 8 + Math.round(Math.sin(clamp(u, 0, 1) * Math.PI) * 5 + PFK.vn(xx * 0.3, 0, 3) * 3) - (edge < 3 ? 3 - edge : 0);
        for (let yy = y - top; yy < y; yy++) { const t = (y - yy) / top; PFK.put(pb, xx, yy, U(SANDF[clamp(Math.round(9 - t * 3 + (hash2(xx, yy, 5) - 0.5) * 2), 4, 9)])); }
        PFK.put(pb, xx, y - top - 1, RW[4]);
        for (let yy = y; yy < y + depth; yy++) {
          const v = (yy - y) / depth;
          let k = yy === y ? 8 : yy === y + 1 ? 7 : Math.round(6 - v * 4 + (PFK.cl(xx, yy, 2, 6) - 0.5) * 2 - (edge < 4 ? 1 : 0));
          if (xx - x > w - 5) k -= 2; else if (xx - x < 2) k += 1;
          PFK.put(pb, xx, yy, RW[clamp(k, 1, 8)]);
        }
        PFK.put(pb, xx, y + depth, RW[0]);
        if (hash2(xx, 1, 8) < 0.12) { const L = 2 + Math.floor(hash2(xx, 2, 8) * 6); for (let k = 0; k < L; k++) PFK.put(pb, xx, y + depth + k, U(k < L - 1 ? '#3b5320' : '#617517')); } // raíces colgantes
      }
      PFFlora.tuft(pb, x + 6, y - 3, 7, 6, x); PFFlora.tuft(pb, x + w - 8, y - 2, 6, 5, x + 9);
      return;
    }
    if (p.type === 'metal') {
      const S = PFK.P32(RAMP.steelRefR);
      // rejilla (cara superior 4 px), viga frontal 4 px con borde de seguridad, barandilla amarilla posterior
      for (let xx = x; xx < x + w; xx++) {
        for (let yy = y - 4; yy < y; yy++) PFK.put(pb, xx, yy, ((xx % 3 === 0) || ((y - yy) % 2 === 0)) ? S[2] : S[5]);
        PFK.put(pb, xx, y - 1, S[7]);
        PFK.put(pb, xx, y, S[6]); PFK.put(pb, xx, y + 1, S[4]); PFK.put(pb, xx, y + 2, (Math.floor(xx / 4) % 2) ? U('#f0c040') : U('#202028')); PFK.put(pb, xx, y + 3, S[1]);
      }
      railing(pb, x, x + w - 1, y - 5, 9);
      return;
    }
  }
  /** Barandilla amarilla: postes cada 8 px y dos pasamanos */
  function railing(pb, x0, x1, yBase, h = 9, cols = ['#7a5a10', '#c89020', '#f0c040', '#ffe58a']) {
    const C = cols.map(c => U(c));
    for (let x = x0; x <= x1; x++) { PFK.put(pb, x, yBase - h, C[3]); PFK.put(pb, x, yBase - h + 1, C[1]); PFK.put(pb, x, yBase - Math.round(h / 2), C[2]); }
    for (let x = x0; x <= x1; x += 8) for (let y = yBase - h; y <= yBase; y++) { PFK.put(pb, x, y, C[2]); PFK.put(pb, x + 1, y, C[0]); }
  }

  /* ---------- galería de prueba ---------- */
  function gallery(pb) {
    const fake = { w: 640, h: 360, ground: new Float32Array(641), platforms: [{ x: 420, y: 150, w: 50, type: 'rock', baked: true }, { x: 500, y: 140, w: 120, type: 'metal', baked: true }], water: [], def: { pf: { terrain: [{ x0: 0, x1: 200, surf: 'path', face: 'cliff' }, { x0: 200, x1: 330, surf: 'sand', face: 'beach' }, { x0: 330, x1: 460, surf: 'rock', face: 'rocks' }, { x0: 460, x1: 640, surf: 'paving', face: 'quay' }] } } };
    for (let x = 0; x <= 640; x++) fake.ground[x] = x < 200 ? 200 : x < 330 ? 230 : x < 460 ? 215 : 222;
    pb.rect(0, 0, 640, 360, '#6fa4e8');
    surface(pb, fake);
    const c = render(fake); const g = makeCanvas(640, 360).g; g.drawImage(pb.toCanvas(), 0, 0); g.drawImage(c, 0, 0);
    const id = g.getImageData(0, 0, 640, 360); pb.data.set(new Uint32Array(id.data.buffer));
  }
  return { render, surface, platform, railing, gallery, segAt, depthOf, backEdge, boulderPix, CONC, SANDF, PAVE, DECK };
})();
