/* =====================================================================
   18d_pf_water.js — Agua protagonista del plano jugable (kit PF).
   Corte submarino opaco detrás del terreno: degradado de profundidad
   underR en bandas con borde irregular, siluetas de arrecife lejanas,
   lecho de arena con ondas, rocas, praderas marinas, corales (teal,
   violeta, cálidos), algas, toma sumergida con rejilla; haces de luz que
   se mecen, cáusticas, plancton, cardumen con cola animada (4 cuadros),
   turbidez visible (tinte + sedimento) y compuerta de la toma.
   Delante: cresta de ola con rizos de espuma blancos (8 cuadros) y rocío,
   espuma de contacto en pilotes y muros.
   Def. de agua: {x0,x1,y, pf:true, cutaway:true}; lecho: def.pf.bedAt(x);
   ganchos del nivel: def.pf.water = {intake:{x,y}, suction:[x…], plumeX…}
   ===================================================================== */
const PFWater = (() => {
  const UND = ['#041939', '#062448', '#072e51', '#06406a', '#065481', '#0879a4', '#0c97b6', '#08bcd6', '#07dde6', '#7ef0f4'];
  const SURF = ['#00568a', '#0182ae', '#027bbe', '#11bedd', '#27e2e8', '#c0ebf7', '#ffffff'];
  const SANDW = ['#0a2236', '#123446', '#1e4a58', '#2e6468', '#4a8278', '#78a890'];
  const ROCKW = ['#061224', '#0c2234', '#14344a', '#1f4a5e', '#2f6474', '#4a8288'];
  const KELP = ['#0a2a1e', '#12402a', '#1e5a30', '#2f7a3a', '#4f9a44', '#86c05a'];

  /** Color de agua a profundidad dz (px bajo la superficie) con borde de banda irregular */
  function waterAt(P, dz, x, y, maxD) {
    const t = clamp(1 - dz / maxD, 0, 1);
    const j = (hash2((x / 3) | 0, (y / 2) | 0, 5) - 0.5) * 0.07 + (PFK.vn(x * 0.03, y * 0.05, 6) - 0.5) * 0.08;
    // agua luminosa como la referencia: turquesa brillante en la mitad superior, azul medio y navy solo al fondo
    return P[clamp(Math.round((t * 0.35 + Math.sqrt(t) * 0.65 + j) * 8), 0, 8)];
  }


  /* ---------- r3-coast: arrecife, repisas y rejilla de toma detallada ---------- */
  const R3C_ROCK = ['#1c0a1c', '#3a1424', '#5e2426', '#86382a', '#ac5230', '#cc703c', '#e4904e', '#f4b46a', '#fcd290'];
  const R3C_BRAIN = ['#3e0e22', '#7a2238', '#b8404a', '#e4685a', '#fa9a76', '#ffd0a0'];
  const R3C_FAN = ['#2a0c40', '#561c70', '#8a34a4', '#c056cc', '#ea8ee4'];
  const R3C_SPONGE = ['#4a2206', '#8a4a10', '#c87a1a', '#f0aa2e', '#ffd860'];
  const R3C_ANEM = ['#4a1240', '#8a2a7a', '#c850a8', '#f08ad0', '#ffd0f0'];
  const R3C_KELP = ['#0e2a14', '#1a4a1c', '#2e6a22', '#4e8a2a', '#7aae38', '#b4d050'];
  /** mezcla con el agua según profundidad (los cálidos se apagan con la hondura, sin perder el tono) */
  function r3cWet(u, Y, wy, UW, k0 = 0.12) { const d = clamp((Y - wy) / 150, 0, 1); return PFK.mixU(u, UW[clamp(6 - Math.round(d * 4), 1, 7)], k0 + d * 0.26); }
  function r3coastReef(pb, o) {
    const { x0, x1, y0, wy, wd, bedAt, UW, put, r, W_ } = o;
    const RK = PFK.P32(R3C_ROCK);
    const wet = (u, Y, k) => r3cWet(u, Y, wy, UW, k);
    const putW = (X, Y, u, k) => put(X, Y, wet(u, Y, k));
    // pilotes traseros (más finos, más hondos y en otro ritmo: profundidad y menos repetición)
    for (const bx of (W_.backPiles || [])) {
      const bed = bedAt(bx) - 6;
      for (let Y = wy - 20; Y < bed; Y++) for (let k = 0; k < 4; k++) {
        const u = PFK.mixU(U(['#3a3a48', '#6a6a78', '#55556a', '#2e2e3e'][k]), UW[clamp(4 - Math.round((Y - wy) / 40), 1, 5)], Y < wy ? 0.35 : 0.62 + clamp((Y - wy) / 300, 0, 0.2));
        put(bx + k, Y, u);
      }
      for (let Y = wy + 2; Y < wy + 14; Y++) if (hash2(bx, Y, 5) < 0.5) put(bx + (hash2(bx, Y, 6) < 0.5 ? -1 : 4), Y, wet(U('#2e5a2a'), Y, 0.3));
    }
    // repisas de roca: masa que sube desde el lecho y se abre en voladizo, tapa iluminada, sombra bajo el vuelo
    for (const [sx0, sx1, sy, th] of (W_.shelves || [])) {
      const cx = (sx0 + sx1) / 2, hw = (sx1 - sx0) / 2;
      const topAt = (X) => { const e = Math.abs(X - cx) / hw; return Math.round(sy + Math.pow(e, 3) * th * 0.9 + (PFK.vn(X * 0.12, 1, sy) - 0.5) * 4 + (hash2(X >> 2, 3, sy) - 0.5) * 2); };
      for (let X = sx0 - 2; X <= sx1 + 2; X++) {
        const e = Math.abs(X - cx) / hw; if (e > 1.04) continue;
        const top = topAt(X), bed = bedAt(X);
        // tallo central hasta el lecho; extremos solo en voladizo
        const stem = e < 0.55 + PFK.vn(X * 0.05, 2, sy) * 0.15;
        const bot = stem ? bed : Math.round(top + th * (1 - e * 0.55) + (PFK.vn(X * 0.2, 3, sy) - 0.5) * 5);
        for (let Y = top; Y < bot; Y++) {
          const dy = Y - top;
          // estratos y grietas
          const strat = ((Y + Math.round(PFK.vn(X * 0.05, 5, sy) * 6)) % 7 === 0);
          const crack = PFK.vn(X * 0.3, Y * 0.06, sy + 7) > 0.78;
          let t = dy < 2 ? 7.4 - dy * 0.8 : 5.2 - dy * 0.11 - e * 1.2 + (PFK.cl(X, Y, 3, sy) - 0.5) * 1.4;
          if (strat) t -= 1.2;
          if (crack) t -= 2.2;
          if (!stem && bot - Y <= 2) t = 1.2; // borde inferior del voladizo
          putW(X, Y, RK[clamp(Math.round(t), 0, 8)], dy < 2 ? 0.08 : 0.18);
        }
        // sombra proyectada bajo el voladizo (agua más oscura)
        if (!stem) for (let Y = bot; Y < Math.min(bed, bot + 10); Y++) { const i = (Y - y0) * wd + (X - x0); if (i >= 0 && i < pb.data.length) pb.data[i] = PFK.mixU(pb.data[i], UW[1], 0.35 * (1 - (Y - bot) / 10)); }
        // flecos de algas colgando del voladizo
        if (!stem && hash2(X, sy, 9) < 0.35) { const L = 2 + Math.floor(hash2(X, sy, 10) * 7); for (let q = 0; q < L; q++) putW(X, bot + q, U(q < 2 ? '#4e8a2a' : '#2e6a22'), 0.2 + q * 0.03); }
      }
      // vida sobre la repisa (cada ~12 px)
      for (let X = sx0 + 4; X < sx1 - 3; X += 9 + r.int(0, 6)) r3cCluster(pb, put, X, topAt(X), r, wy, UW, 0.6 + r() * 0.5);
    }
    // jardín del lecho: un racimo cada ~30 px (alternando tipos y tamaños)
    for (let X = x0 + 10; X < x1 - 6; X += 22 + r.int(0, 16)) r3cCluster(pb, put, X, bedAt(X) + 1, r, wy, UW, 0.8 + r() * 0.7);
  }
  /** racimo de arrecife: coral cerebro, cuerno de ciervo, abanico, esponjas tubo, anémona o kelp */
  function r3cCluster(pb, put, X, by, r, wy, UW, s) {
    const kind = r.int(0, 6), wet = (u, Y, k = 0.14) => r3cWet(u, Y, wy, UW, k);
    const P = (ramp) => PFK.P32(ramp);
    if (kind === 0 || kind === 6) { // coral cerebro (cúpula con surcos)
      const C = P(R3C_BRAIN), rx = Math.round(3 + s * 3), ry = Math.round(2 + s * 2.2);
      for (let yy = -ry; yy <= 0; yy++) for (let xx = -rx; xx <= rx; xx++) {
        const d = (xx * xx) / (rx * rx) + (yy * yy) / (ry * ry); if (d > 1) continue;
        let t = 2.6 - yy / ry * 1.6 - xx / rx * 0.7; if (d > 0.8) t -= 1.2;
        if (((xx + Math.round(Math.sin(yy * 0.9) * 2)) & 3) === 0) t -= 1; // surcos
        put(X + xx, by + yy - 1, wet(C[clamp(Math.round(t), 0, 5)], by));
      }
    } else if (kind === 1) { // cuerno de ciervo cálido
      const C = P(RAMP.coralWarmR), n = 3 + Math.round(s * 2), h = Math.round(5 + s * 6);
      for (let b = 0; b < n; b++) {
        let bx = X + (b - (n - 1) / 2) * 2.2, yy = by; const ang = -Math.PI / 2 + (b - (n - 1) / 2) * 0.32;
        for (let k = 0; k < h; k++) { bx += Math.cos(ang) * 0.75 + Math.sin(k * 0.7 + b) * 0.25; yy += Math.sin(ang) * 0.95; put(Math.round(bx), Math.round(yy), wet(C[clamp(1 + Math.round(k / h * 3), 0, 3)], by)); if (k === h - 1) put(Math.round(bx), Math.round(yy) - 1, wet(U('#ffe08a'), by)); }
      }
    } else if (kind === 2) { // abanico violeta/magenta (celosía radial)
      const C = P(R3C_FAN), L = Math.round(7 + s * 6);
      for (let a = -5; a <= 5; a++) { const ang = -Math.PI / 2 + a * 0.13; for (let k = 2; k < L - Math.abs(a) * 0.4; k++) put(Math.round(X + Math.cos(ang) * k), Math.round(by - 1 + Math.sin(ang) * k), wet(C[clamp(1 + Math.round(k / L * 3) + (a === 0 ? 1 : 0), 0, 4)], by)); }
      for (let k = 0; k < 3; k++) put(X, by - k, wet(C[0], by));
    } else if (kind === 3) { // esponjas tubo amarillas
      const C = P(R3C_SPONGE), n = 2 + r.int(0, 2);
      for (let i = 0; i < n; i++) { const tx = X + i * 3 - n, h = Math.round(4 + s * 4 + r.int(0, 4)); for (let k = 0; k < h; k++) { put(tx, by - k, wet(C[k === h - 1 ? 0 : 2], by)); put(tx + 1, by - k, wet(C[k === h - 1 ? 1 : (k > h - 3 ? 4 : 3)], by)); } }
    } else if (kind === 4) { // anémona rosa con tentáculos
      const C = P(R3C_ANEM), rx = Math.round(2 + s * 1.5);
      for (let xx = -rx; xx <= rx; xx++) { put(X + xx, by - 1, wet(C[1], by)); put(X + xx, by - 2, wet(C[2], by)); }
      for (let xx = -rx - 1; xx <= rx + 1; xx += 1) { const L = 2 + ((xx + X) & 1) + Math.round(s); for (let k = 0; k < L; k++) put(X + xx + Math.round(Math.sin(k * 0.8 + xx) * 0.6), by - 3 - k, wet(C[clamp(3 + (k === L - 1 ? 1 : 0), 0, 4)], by)); }
    } else { // kelp en mata (3–5 frondas con hojas)
      const C = P(R3C_KELP), n = 3 + r.int(0, 2);
      for (let i = 0; i < n; i++) {
        const h = Math.round(12 + s * 14 + r.int(0, 12)), ph = r() * 6;
        for (let k = 0; k < h; k++) {
          const xx = Math.round(X + (i - n / 2) * 2 + Math.sin(k * 0.13 + ph) * 2.2);
          put(xx, by - k, wet(C[k % 7 === 0 ? 4 : 2], by - k, 0.18)); put(xx + 1, by - k, wet(C[1], by - k, 0.2));
          if (k % 5 === 3 && k > 3) { const sd = (k & 8) ? 1 : -1; put(xx + (sd > 0 ? 2 : -1), by - k, wet(C[3], by - k, 0.18)); put(xx + (sd > 0 ? 3 : -2), by - k - 1, wet(C[4], by - k, 0.2)); }
        }
      }
    }
  }
  /** Cabezal de toma detallado: caperuza de velocidad (hongo) sobre rejilla de barrotes, brida, zapata y vida incrustada */
  function r3coastIntakeHead(pb, ix, iy, x0, y0, wy, UW, bed) {
    const put = (X, Y, u) => PFK.put(pb, X - x0, Y - y0, u);
    const wet = (u, Y, k = 0.22) => r3cWet(u, Y, wy, UW, k);
    const CON = PFK.P32(['#1a1820', '#34303a', '#504a52', '#6e666a', '#90867e', '#b4a898', '#d8cab4']);
    const ST = PFK.P32(['#04263c', '#07507a', '#0a7fae', '#11bedd', '#3adcf1', '#9cf0f8']);
    // escollera de bloques bajo la zapata hasta el lecho (la toma se eleva sobre el fondo: no aspira arena)
    const RKc = PFK.P32(R3C_ROCK);
    for (let X = ix - 34; X <= ix + 34; X++) {
      const e = Math.abs(X - ix) / 34, top = Math.round(iy + 11 + e * e * Math.max(0, bed - iy - 11) * 0.9);
      for (let Y = top; Y <= bed + 2; Y++) {
        const cx = Math.floor((X + 400) / 9), cy = Math.floor((Y + (cx & 1) * 4) / 7), fx = ((X + 400) % 9) / 9, fy = ((Y + (cx & 1) * 4) % 7) / 7;
        let t = 4.6 - fy * 2.4 - fx * 0.8 + (hash2(cx, cy, 5) - 0.5) * 2.2;
        if (fx < 0.12 || fy < 0.14) t = 1;
        put(X, Y, wet(RKc[clamp(Math.round(t), 0, 8)], Y, 0.3));
      }
    }
    // zapata de hormigón (trapecio) con juntas
    for (let X = ix - 26; X <= ix + 26; X++) for (let Y = iy + 6; Y < iy + 12; Y++) {
      const e = Math.abs(X - ix) / 26; if (Y - iy - 6 < e * 3) continue;
      put(X, Y, wet(CON[clamp(Y - iy - 6 < e * 3 + 1 ? 5 : 3 - ((X >> 3) & 1) + (hash2(X, Y, 3) < 0.12 ? -1 : 0), 0, 6)], Y));
    }
    // anillo base y brida con pernos
    for (let X = ix - 19; X <= ix + 19; X++) for (let Y = iy + 3; Y <= iy + 5; Y++) put(X, Y, wet(CON[Y === iy + 3 ? 6 : 4], Y));
    for (let X = ix - 19; X <= ix + 19; X += 5) put(X, iy + 4, wet(U('#2a2830'), iy + 4));
    // rejilla: barrotes verticales con fondo oscuro (succión), reflejo arriba
    for (let Y = iy - 9; Y <= iy + 2; Y++) for (let X = ix - 17; X <= ix + 17; X++) {
      const bar = ((X - ix + 17) % 3) === 0;
      let u = bar ? ST[clamp(4 - Math.round((Y - iy + 9) / 4), 1, 5)] : U('#03101e');
      if (bar && Math.abs(X - ix) > 14) u = ST[1];
      if (!bar && Y < iy - 6) u = U('#062438');
      put(X, Y, wet(u, Y, bar ? 0.2 : 0.1));
    }
    // caperuza (hongo): disco con alero, luz cenital en la cara superior, sombra bajo el alero
    for (let Y = iy - 15; Y <= iy - 10; Y++) {
      const hw = Y < iy - 13 ? 20 - (iy - 13 - Y) * 3 : 23;
      for (let X = ix - hw; X <= ix + hw; X++) {
        let k = Y === iy - 15 ? 6 : Y === iy - 14 ? 5 : Y <= iy - 12 ? 4 : Y === iy - 11 ? 2 : 1;
        if (Math.abs(X - ix) > hw - 2 && Y > iy - 13) k--;
        put(X, Y, wet(CON[clamp(k, 0, 6)], Y, 0.18));
      }
    }
    for (let X = ix - 22; X <= ix + 22; X++) put(X, iy - 9, wet(U('#0a0c18'), iy - 9, 0.15)); // sombra del alero
    // placa amarilla de señalización sobre la caperuza
    for (let X = ix - 3; X <= ix + 3; X++) for (let Y = iy - 21; Y <= iy - 16; Y++) put(X, Y, wet(U(Y === iy - 21 || Y === iy - 16 || Math.abs(X - ix) === 3 ? '#2a2830' : '#f0c020'), Y, 0.15));
    put(ix, iy - 19, wet(U('#2a2830'), iy - 19, 0.15)); put(ix, iy - 18, wet(U('#2a2830'), iy - 18, 0.15));
    // vida incrustada: percebes, algas y esponjas sobre la caperuza y la zapata
    for (let X = ix - 22; X <= ix + 22; X++) {
      const h = hash2(X, iy, 41);
      if (h < 0.18) put(X, iy - 16, wet(U('#4e8a2a'), iy - 16, 0.2));
      if (h > 0.86) { put(X, iy - 16, wet(U('#f0aa2e'), iy - 16, 0.2)); put(X, iy - 17, wet(U('#ffd860'), iy - 17, 0.2)); }
      if (h > 0.4 && h < 0.5) put(X, iy + 6, wet(U('#e4e0d8'), iy + 6, 0.2));
    }
    for (const dx of [-24, 25]) for (let k = 0; k < 9; k++) put(ix + dx + Math.round(Math.sin(k * 0.5) * 1), iy + 6 - k, wet(U(k % 3 ? '#2e6a22' : '#4e8a2a'), iy, 0.2));
  }

  function build(world, w) {
    const def = world.def, P = def.pf || {};
    const bedAt = P.bedAt || (() => world.h);
    const x0 = w.x0, x1 = w.x1, wy = w.y;
    // huecos de muelle: zona donde se ve el mar bajo la cubierta (por encima de la línea de agua)
    const holes = [];
    for (const s of (P.terrain || [])) if (s.face === 'pier') holes.push([Math.max(s.x0, x0), Math.min(s.x1, x1)]);
    const inHole = (x) => holes.some(h => x >= h[0] && x <= h[1]);
    const y0 = wy - 26, hgt = world.h - y0, wd = x1 - x0 + 1;
    const pb = new PixelBuffer(wd, hgt);
    const UW = PFK.P32(UND), SF = PFK.P32(SURF);
    const maxD = Math.max(60, Math.max(...Array.from({ length: 20 }, (_, i) => bedAt(x0 + i * wd / 20))) - wy);
    const r = RNG(77);
    // 1. agua
    for (let x = 0; x < wd; x++) {
      const X = x0 + x, bed = bedAt(X), hole = inHole(X);
      for (let y = 0; y < hgt; y++) {
        const Y = y0 + y;
        if (Y < wy) {
          if (!hole) continue;
          if (Y <= (world.ground[X] ?? 0) + 3) continue; // nunca sobre la cara superior del muelle
          // mar visto bajo la cubierta: superficie que se aleja + sombra de la cubierta
          const k = Y < wy - 20 ? 0 : Y < wy - 14 ? 1 : 2 + ((Y + Math.round(Math.sin(X * 0.2) * 1.2)) % 5 === 0 ? 1 : 0);
          pb.data[y * wd + x] = SF[clamp(k + (hash2(X, Y, 3) < 0.03 ? 3 : 0), 0, 6)];
          continue;
        }
        // columnas de luz moteadas (verticales) y matiz violeta en lo profundo
        const col = PFK.vn(X * 0.045, Y * 0.012, 31), mot = PFK.cl(X, Y, 3, 32);
        let dz = Y - wy - (col - 0.5) * 34 - (mot - 0.5) * 8;
        let u = waterAt(UW, Math.max(0, dz), X, Y, maxD + 10);
        if (col > 0.68 && Y > wy + 10) u = PFK.mixU(u, UW[8], clamp((col - 0.68) * 1.6, 0, 0.35) * (1 - (Y - wy) / (maxD + 40)));
        if (Y > wy + 50 && PFK.vn(X * 0.02, Y * 0.02, 33) > 0.62) u = PFK.mixU(u, U('#2a2470'), 0.28);
        // manchas pictóricas más oscuras (azul medio) y vetas claras inclinadas cerca de la superficie
        const bl = PFK.vn(X * 0.03, Y * 0.05, 34) + (PFK.cl(X, Y, 3, 35) - 0.5) * 0.12;
        if (bl > 0.6 && Y > wy + 6) u = PFK.mixU(u, UW[clamp(Math.round(5 - (Y - wy) / 40), 2, 5)], clamp((bl - 0.6) * 1.8, 0, 0.45));
        const vt = PFK.vn(X * 0.06 + Y * 0.11, Y * 0.02, 36);
        if (vt > 0.74 && Y < wy + 46 && Y > wy + 4) u = PFK.mixU(u, UW[9], clamp((vt - 0.74) * 2.4, 0, 0.32) * (1 - (Y - wy) / 46));
        pb.data[y * wd + x] = u;
      }
    }
    // 2. siluetas lejanas de arrecife (2 tonos más oscuros, poco contraste)
    for (let x = 0; x < wd; x++) {
      const X = x0 + x, bed = bedAt(X);
      const top = bed - 18 - Math.round(PFK.vn(X * 0.02, 0, 9) * 34 + PFK.vn(X * 0.09, 1, 9) * 8);
      for (let Y = Math.max(top, wy + 18); Y < bed; Y++) {
        const i = (Y - y0) * wd + x; const c = pb.data[i];
        pb.data[i] = PFK.mixU(c, UW[2], 0.32 + (Y - top) / 140);
      }
    }
    // 3. lecho: arrecife rocoso (cantos en celdas de Worley con tapa iluminada desde la superficie)
    //    y arena con ondas entre los cantos; los cantos asoman por encima de la línea del lecho
    const SW = PFK.P32(SANDW), RK = PFK.P32(ROCKW);
    // r3-coast: cantos del lecho templados (rojizos apagados por el agua) para el contrapunto cálido/frío
    const BR = PFK.P32(['#0a0c1c', '#161a2e', '#26283e', '#3a3a4c', '#56504e', '#76624e', '#968058', '#b8a070', '#dcc898']);
    const rockAt = (X, Y) => {
      const big = PFK.vn(X * 0.01, Y * 0.01, 79) > 0.55, cw = big ? 26 : 14, ch = big ? 16 : 10, gx = Math.floor(X / cw), gyc = Math.floor(Y / ch);
      let d1 = 9, d2 = 9, sx = 0, sy = 0, rr = 1, id = 0;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
        const cx = gx + i, cy = gyc + j;
        const px = (cx + 0.2 + hash2(cx, cy, 71) * 0.6) * cw, py = (cy + 0.2 + hash2(cx, cy, 72) * 0.6) * ch;
        const rad = (0.4 + hash2(cx, cy, 73) * 0.6) * cw * 0.62;
        const dd = Math.hypot((X - px) / rad, (Y - py) / (rad * 0.72));
        if (dd < d1) { d2 = d1; d1 = dd; sx = px; sy = py; rr = rad; id = cx * 31 + cy; } else if (dd < d2) d2 = dd;
      }
      return { d1, d2, nx: (X - sx) / rr, ny: (Y - sy) / (rr * 0.72), id, sy };
    };
    for (let x = 0; x < wd; x++) {
      const X = x0 + x, bed = bedAt(X);
      for (let Y = bed - 9; Y < world.h; Y++) {
        if (Y < y0) continue;
        const d = Y - bed, R = rockAt(X, Y);
        // los cantos se agrupan en arrecifes (ruido de baja frecuencia); entre ellos, arena con ondas
        const cluster = PFK.vn(X * 0.012, 0.5, 77) + (hash2(R.id, 1, 78) - 0.5) * 0.35 + Math.max(0, d - 26) * 0.012;
        const isRock = R.d1 < 1 && cluster > 0.5 && (d >= 0 || (R.sy > bed - 2 && hash2(R.id, 3, 74) < 0.7));
        let u;
        if (isRock) {
          if (R.d2 - R.d1 < 0.08) u = BR[1];
          else {
            let t = 0.56 - R.ny * 0.42 - R.nx * 0.14 - Math.max(0, d) * 0.0045 + (PFK.cl(X, Y, 2, R.id) - 0.5) * 0.18;
            if (R.d1 > 0.85) t -= 0.16;
            u = BR[clamp(Math.round(t * 8), 1, 7)];
            if (R.ny < -0.62 && R.d1 > 0.6 && d < 50) u = BR[8 - (hash2(X, Y, 75) < 0.5 ? 1 : 0)]; // luz cenital
            if (hash2(X, Y, 76) < 0.012) u = U(['#d86a9a', '#f0c060', '#7ff0dc'][R.id & 3 % 3] || '#7ff0dc'); // motas de vida
          }
        } else if (d >= 0) {
          let k = 4 - Math.round(d * 0.08) + ((Y * 2 + Math.round(Math.sin(X * 0.11) * 2)) % 5 === 0 ? -1 : 0) + (PFK.cl(X, Y, 2, 7) < 0.15 ? -1 : 0);
          if (d === 0) k = 5;
          u = SW[clamp(k, 0, 5)];
        } else continue;
        pb.data[(Y - y0) * wd + x] = u;
      }
    }
    const put = (X, Y, u) => PFK.put(pb, X - x0, Y - y0, u);
    // rocas del fondo
    for (let X = x0 + 8; X < x1 - 8; X += 18 + r.int(0, 40)) {
      const bed = bedAt(X), rw = 6 + r.int(0, 12), rh = 4 + r.int(0, 7);
      PFK.ellipseFn(pb, X - x0, bed - y0 - rh * 0.3, rw, rh, (nx, ny) => RK[clamp(Math.round(3 - nx * 1.2 - ny * 1.6 + (hash2(X + nx * 9, ny * 9, 3) - 0.5)), 0, 5)]);
    }
    // praderas marinas (zona de cría) y algas
    const KP = PFK.P32(KELP);
    for (let X = x0 + 4; X < x1; X += 2 + r.int(0, 3)) {
      const bed = bedAt(X); const dense = PFK.vn(X * 0.02, 0, 21) > 0.5;
      if (!dense && r() < 0.7) continue;
      const h = 4 + r.int(0, dense ? 10 : 5);
      for (let k = 0; k < h; k++) put(X + Math.round(Math.sin(k * 0.4 + X) * 0.8), bed - k, KP[clamp(1 + Math.round(k / h * 4), 0, 5)]);
    }
    // kelp alto
    for (let X = x0 + 30; X < x1; X += 60 + r.int(0, 70)) {
      const bed = bedAt(X), h = 30 + r.int(0, 40);
      for (let k = 0; k < h; k++) { const xx = X + Math.round(Math.sin(k * 0.12 + X) * 2.5); put(xx, bed - k, KP[k % 9 === 0 ? 4 : 2]); put(xx + 1, bed - k, KP[1]); if (k % 5 === 2 && k > 4) { put(xx + 2, bed - k, KP[3]); put(xx - 1, bed - k - 1, KP[3]); } }
    }
    // corales en racimos (teal, violeta, cálidos) — densos cerca del arrecife
    const reefX = (P.water && P.water.reef) || [];
    const coral = (X, kind, s) => {
      const bed = bedAt(X), ramp = kind === 0 ? RAMP.coralTealR : kind === 1 ? RAMP.coralVioR : RAMP.coralWarmR;
      const C = PFK.P32(ramp);
      if (kind === 2) { // ramificado cálido
        for (let b = 0; b < 4; b++) { let bx = X + (b - 1.5) * 2, by = bed; const ang = -Math.PI / 2 + (b - 1.5) * 0.35; for (let k = 0; k < s; k++) { bx += Math.cos(ang) * 0.8 + Math.sin(k * 0.6) * 0.3; by += Math.sin(ang); put(Math.round(bx), Math.round(by), C[clamp(1 + Math.round(k / s * 3), 0, 3)]); } }
        return;
      }
      for (let i = 0; i < 4 + s; i++) {
        const cx = X + (r() - 0.5) * s * 1.6, cy = bed - r() * s * 0.9 - 2, rr = 2 + r() * (s * 0.35);
        PFK.ellipseFn(pb, cx - x0, cy - y0, rr, rr * 0.85, (nx, ny, d) => {
          const lit = -nx * 0.5 - ny * 0.8 + (hash2(Math.round(cx + nx * 5), Math.round(cy + ny * 5), 9) - 0.5) * 0.6;
          return C[clamp(Math.round(1.8 + lit * 1.6 + (d < 0.25 ? 0.5 : 0)), 0, C.length - 1)];
        });
      }
    };
    for (const [ax, bx, n] of reefX) for (let i = 0; i < n; i++) coral(ax + r() * (bx - ax), i % 3, 6 + r.int(0, 8));
    for (let X = x0 + 12; X < x1; X += 26 + r.int(0, 30)) coral(X, r.int(0, 2), 4 + r.int(0, 6));
    // anémonas y estrellas
    for (let X = x0 + 15; X < x1; X += 70 + r.int(0, 50)) { const bed = bedAt(X); put(X, bed - 1, U('#f07a3a')); put(X - 1, bed - 1, U('#ffb86b')); put(X + 1, bed - 1, U('#c84a1a')); put(X, bed - 2, U('#ffb86b')); }
    // 3b. (r3-coast) arrecife rico: repisas de roca cálida a 2–3 profundidades, pilotes traseros,
    //     jardín de coral / kelp / esponjas cada ~30 px (cálidos frente al agua fría)
    const W_ = P.water || {};
    r3coastReef(pb, { x0, x1, y0, wy, wd, bedAt, UW, put, r: RNG(4077), W_, maxD });
    // 4. estructuras sumergidas: tubería de toma + cabezal con rejilla; succiones de bombas
    if (W_.intake) {
      const ix = W_.intake.x, iy = W_.intake.y, top = W_.intake.top || wy - 20;
      const S = PFK.P32(['#04263c', '#07507a', '#0a7fae', '#11bedd', '#3adcf1', '#9cf0f8']);
      for (let Y = top; Y < iy - 6; Y++) for (let k = 0; k < 9; k++) { const dz = clamp((Y - wy) / 120, 0, 1); put(ix - 4 + k, Y, PFK.mixU(S[[0, 3, 5, 4, 3, 2, 2, 1, 0][k]], UW[4], Y > wy ? 0.25 + dz * 0.4 : 0)); }
      r3coastIntakeHead(pb, ix, iy, x0, y0, wy, UW, bedAt(ix));
    }
    for (const sx of (W_.suction || [])) {
      const sTop = wy - 18, sBot = (W_.suctionY || wy + 40);
      for (let Y = sTop; Y < sBot; Y++) for (let k = 0; k < 7; k++) { const dz = clamp((Y - wy) / 100, 0, 1); put(sx - 3 + k, Y, PFK.mixU(U(['#0e2a48', '#2f86c0', '#5ab4e0', '#2f86c0', '#245f90', '#163e66', '#0e2a48'][k]), UW[5], Y > wy ? 0.3 + dz * 0.4 : 0)); }
      // campana de succión
      for (let Y = sBot; Y < sBot + 4; Y++) for (let k = -2 - (Y - sBot); k < 9 + (Y - sBot); k++) put(sx - 3 + k, Y, PFK.mixU(U(Y === sBot + 3 ? '#062438' : '#245f90'), UW[5], 0.45));
    }
    // 5. tiras animadas y sprites
    const crest = crestStrip(), shaft = shaftSprite(), fishS = fishStrip(0), fishB = fishStrip(1), fishO = fishStrip(2), splash = splashStrip();
    // cardumen
    const fish = [];
    const nF = W_.fish ?? 9;
    for (let i = 0; i < nF; i++) {
      const big = i % 3 === 0, kind = big ? 1 : (i % 5 === 2 ? 2 : 0);
      const xx = (W_.fishX ? W_.fishX[0] : x0) + r() * ((W_.fishX ? W_.fishX[1] : x1) - (W_.fishX ? W_.fishX[0] : x0));
      fish.push({ x: xx, y: wy + 16 + r() * (Math.max(30, bedAt(Math.round(xx)) - wy - 40)), vx: (r() < 0.5 ? -1 : 1) * (5 + r() * 6), kind, ph: r() * 10, home: xx, range: 60 + r() * 120 });
    }
    // cardúmenes de peces pequeños (6–9 juntos, misma dirección)
    const nSch = W_.schools ?? 0;
    for (let k = 0; k < nSch; k++) {
      const fx0 = (W_.fishX ? W_.fishX[0] : x0) + (k + 0.5) / nSch * ((W_.fishX ? W_.fishX[1] : x1) - (W_.fishX ? W_.fishX[0] : x0)) + (r() - 0.5) * 60;
      const fy0 = wy + 24 + r() * Math.max(20, bedAt(Math.round(fx0)) - wy - 60), dir = r() < 0.5 ? -1 : 1, sp = 7 + r() * 4, n = 6 + r.int(0, 3);
      for (let i = 0; i < n; i++) fish.push({ x: fx0 + (r() - 0.5) * 34, y: fy0 + (r() - 0.5) * 16, vx: dir * sp, kind: k % 3 === 2 ? 2 : 0, ph: r() * 10, home: fx0, range: 90 + k * 13 });
    }
    const contacts = [x0 + 4];
    for (const [a, b] of holes) for (let px = a + 18, idx = 0; px < b - 6; px += 46, idx++) contacts.push(px + Math.round((hash1(idx, 31) - 0.5) * 8));
    for (const cx of (W_.contacts || [])) contacts.push(cx);
    return { w, x0, x1, y0, wy, c: pb.toCanvas(), crest, shaft, fishS, fishB, fishO, splash, fish, bedAt, holes, maxD, contacts };
  }

  /* ---------- tiras ---------- */
  /** Cresta de ola: 8 cuadros de 64×30, periódica en x (rizos de espuma, rocío y banda turbulenta) */
  function crestStrip() {
    return PFK.strip(8, 64, 30, (pb, i) => {
      const ph = i / 8 * TAU;
      const s1 = (x) => Math.sin(x / 64 * TAU * 2 + ph), s2 = (x) => Math.sin(x / 64 * TAU * 3 - ph * 2);
      const base = (x) => 11 + s1(x) * 1.8 + s2(x) * 1.0;
      const F = PFK.P32(RAMP.foamR);
      for (let x = 0; x < 64; x++) {
        const b = Math.round(base(x));
        // rizo: en los máximos la espuma se eleva y se enrosca hacia delante; la cara del rizo queda en sombra
        const pk = -s1(x) - 0.45;
        const curlH = pk > 0 ? 1 + Math.round(pk * 7) : 0;
        for (let k = 0; k < curlH; k++) PFK.put(pb, x, b - 1 - k, U(k === curlH - 1 ? '#ffffff' : (k > curlH - 3 ? '#e8f8fc' : '#9fd8e8')));
        if (curlH > 3) { PFK.put(pb, (x + 1) % 64, b - curlH, U('#ffffff')); PFK.put(pb, (x + 2) % 64, b - curlH + 1, U('#ffffff')); PFK.put(pb, (x + 3) % 64, b - curlH + 2, U('#d2ecee')); }
        PFK.put(pb, x, b, U('#ffffff'));
        PFK.put(pb, x, b + 1, U(hash2(x, i, 2) < 0.7 ? '#ffffff' : '#d2ecee'));
        PFK.put(pb, x, b + 2, F[hash2(x, i, 3) < 0.5 ? 4 : 3]);
        PFK.put(pb, x, b + 3, F[3]);
        // banda turbulenta: turquesa brillante con vetas blancas y verde-azuladas, que se desvanece
        for (let k = 4; k < 17; k++) {
          const n = PFK.vn(x * 0.22 + i * 0.5, k * 0.45 + i * 0.2, 4), a = clamp(1 - (k - 4) / 13, 0, 1);
          let u = n > 0.7 ? U('#ffffff') : n > 0.6 ? F[4] : n < 0.22 ? F[0] : n < 0.4 ? F[1] : F[2];
          if (k > 10 && n > 0.7) u = F[3];
          PFK.blend(pb, x, b + k, u, (n > 0.6 || n < 0.22) ? Math.min(1, a + 0.2) : a * 0.75);
        }
        // rocío
        if (hash2(x, i, 9) < 0.09) PFK.put(pb, x, b - 2 - curlH - Math.floor(hash2(x, i, 10) * 5), U('#ffffff'));
        if (hash2(x, i, 11) < 0.04) PFK.put(pb, x, b - 4 - curlH - Math.floor(hash2(x, i, 12) * 4), U('#c0ebf7'));
      }
    });
  }
  /** Salpicadura contra pilotes y muros (8 cuadros de 18×24): columna de rocío que sube y cae, espuma en la base */
  function splashStrip() {
    const Hs = [3, 8, 13, 17, 18, 15, 10, 5];
    return PFK.strip(8, 18, 24, (pb, i) => {
      const h = Hs[i], base = 21, r = RNG(300 + i);
      // espuma en la base (turbulenta, ancha)
      for (let x = 1; x < 17; x++) {
        const hh = 2 + Math.round(Math.max(0, 1 - Math.abs(x - 8.5) / 8.5) * (2 + (i < 5 ? i * 0.5 : 2)));
        for (let k = 0; k < hh; k++) PFK.put(pb, x, base - k, U(k === hh - 1 ? '#ffffff' : k > hh - 3 ? '#e8f8fc' : '#9fd8e8'));
        PFK.put(pb, x, base + 1, U('#c0ebf7'));
      }
      // columna de rocío pegada al pilote (lado izquierdo del cuadro = cara del pilote)
      for (let k = 0; k < h; k++) {
        const w0 = Math.max(1, Math.round((1 - k / (h + 1)) * 5));
        for (let q = 0; q < w0; q++) if (r() < 0.8 - k * 0.025) PFK.put(pb, 6 + q - Math.round(k * 0.15), base - 3 - k, U(r() < 0.6 ? '#ffffff' : '#d2ecee'));
      }
      // gotas sueltas que caen alrededor (más al final del ciclo)
      const nd = i < 3 ? 2 : 6;
      for (let k = 0; k < nd; k++) {
        const ang = -Math.PI / 2 + (r() - 0.35) * 1.8, rr = 3 + r() * (4 + i * 1.4);
        const x = Math.round(8 + Math.cos(ang) * rr * 1.1), y = Math.round(base - 4 - Math.max(0, h - 3) * 0.7 + Math.sin(ang) * rr * 0.6 + (i > 4 ? (i - 4) * 2 : 0));
        PFK.put(pb, x, y, U(r() < 0.5 ? '#ffffff' : '#c0ebf7'));
      }
    });
  }
  /** Haz de luz inclinado con alfa decreciente */
  function shaftSprite() {
    const w = 16, h = 120, pb = new PixelBuffer(w + 30, h), u = U('#7ef0f4') & 0xffffff;
    for (let y = 0; y < h; y++) {
      const off = Math.round(y * 0.22), a = 0.5 * (1 - y / h) * (1 - y / h);
      for (let x = 0; x < w; x++) {
        const edge = Math.min(x, w - 1 - x) / 4;
        const aa = a * clamp(edge, 0, 1) * (0.75 + 0.25 * Math.sin(x * 0.9));
        if (aa > 0.02) pb.data[y * pb.w + x + off] = ((Math.round(aa * 255) << 24) | u) >>> 0;
      }
    }
    return pb.toCanvas();
  }
  /** Pez con cola animada (4 cuadros). kind 0 pequeño plateado, 1 grande, 2 anaranjado */
  function fishStrip(kind) {
    const big = kind === 1, w = big ? 26 : 14, h = big ? 15 : 8;
    const body = kind === 2 ? ['#5a1a08', '#c8501a', '#f07a3a', '#ffb070', '#fff0d0'] : RAMP.fishR;
    const fin = kind === 2 ? ['#8a2a0a', '#f0a030', '#ffe080'] : RAMP.fishFinR;
    const B = PFK.P32(body), Fn = PFK.P32(fin), ink = U(kind === 2 ? '#3a0e04' : '#1d3a4a');
    return PFK.strip(4, w, h, (pb, i) => {
      const cx = w * 0.56, cy = h / 2, rx = w * 0.36, ry = h * 0.36;
      // cola
      const tw = [0, 1, 0, -1][i];
      for (let k = 0; k < (big ? 6 : 3); k++) { const tx = Math.round(cx - rx - k), spread = 1 + k * (big ? 0.8 : 0.7); for (let q = -spread; q <= spread; q++) PFK.put(pb, tx, Math.round(cy + q + tw * (k / 3)), Fn[k > 2 ? 2 : 1]); }
      PFK.ellipseFn(pb, cx, cy, rx, ry, (nx, ny, d) => {
        let k = Math.round(2.6 - ny * 1.6 - nx * 0.3);
        if (!big || ny > 0.2) { } else if (((Math.round((nx + 1) * 6) + Math.round((ny + 1) * 4)) % 2) === 0 && ny > -0.6) k -= 1; // escamas
        if (d > 0.82) return ink;
        return B[clamp(k, 0, 4)];
      });
      // aleta dorsal y pectoral
      for (let k = 0; k < (big ? 5 : 2); k++) PFK.put(pb, Math.round(cx - 2 + k), Math.round(cy - ry - 1 - (k < 2 ? 1 : 0)), Fn[2]);
      if (big) for (let k = 0; k < 3; k++) PFK.put(pb, Math.round(cx + k - 1), Math.round(cy + ry), Fn[1]);
      // ojo con brillo
      const ex = Math.round(cx + rx * 0.55), ey = Math.round(cy - 1);
      PFK.put(pb, ex, ey, U('#0a0a14')); if (big) { PFK.put(pb, ex, ey + 1, U('#0a0a14')); PFK.put(pb, ex + 1, ey, U('#0a0a14')); }
      PFK.put(pb, ex, ey - (big ? 0 : 0), big ? U('#ffffff') : U('#0a0a14'));
    });
  }

  /* ---------- por cuadro ---------- */
  function renderBack(g, sc, Wt) {
    const cam = sc.cam, ox = cam.ox, oy = cam.oy, t = Game.time, S = sc.state || {};
    const sx = Wt.x0 - ox, sy = Wt.y0 - oy;
    if (sx > W || sx + Wt.c.width < 0 || sy > H) return;
    const cx0 = Math.max(0, -sx), cw = Math.min(Wt.c.width - cx0, W - Math.max(0, sx));
    if (cw <= 0) return;
    g.drawImage(Wt.c, cx0, 0, cw, Wt.c.height, Math.max(0, sx), sy, cw, Wt.c.height);
    const wyS = Wt.wy - oy;
    const xa = Math.max(0, sx), xb = Math.min(W, sx + Wt.c.width);
    // turbidez: tinte café en bandas + sedimento en suspensión
    const turb = clamp(Wt.w.turbid || 0, 0, 0.75);
    if (turb > 0.01) {
      g.fillStyle = '#8a6a3a';
      for (let b = 0; b < 4; b++) { g.globalAlpha = turb * (0.55 - b * 0.1); g.fillRect(xa, wyS + 2 + b * 22, xb - xa, b === 3 ? H : 22); }
      g.globalAlpha = 1;
    }
    // haces de luz que se mecen
    g.globalCompositeOperation = 'lighter';
    const nS = Math.max(3, Math.round((Wt.x1 - Wt.x0) / 84));
    for (let i = 0; i < nS; i++) {
      const wx = Wt.x0 + 30 + i * ((Wt.x1 - Wt.x0 - 60) / (nS - 1)) + Math.sin(t * 0.25 + i * 1.7) * 8 + (hash1(i, 7) - 0.5) * 40;
      const x = Math.round(wx - ox + Math.sin(t * (1.1 + i * 0.13) + i) * 2);
      if (x < -50 || x > W + 10) continue;
      g.globalAlpha = (0.42 + 0.16 * Math.sin(t * 0.8 + i * 2.1)) * (1 - turb);
      g.drawImage(Wt.shaft, x, wyS + 3);
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    // cáusticas bajo la superficie
    g.fillStyle = '#7ef0f4';
    for (let k = 0; k < 40; k++) {
      const X = Wt.x0 + ((k * 53 + Math.floor(t * 9 + k * 7) % 11) % (Wt.x1 - Wt.x0));
      const x = X - ox; if (x < 0 || x > W) continue;
      if (((k + Math.floor(t * 3)) % 4) !== 0) continue;
      g.globalAlpha = 0.6; g.fillRect(x, wyS + 4 + (k * 7) % 9, 2 + (k % 3), 1);
    }
    g.globalAlpha = 1;
    // plancton / sedimento
    for (let k = 0; k < 46; k++) {
      const X = Wt.x0 + ((hash1(k, 3) * (Wt.x1 - Wt.x0) + t * (2 + hash1(k, 4) * 4)) % (Wt.x1 - Wt.x0));
      const Y = Wt.wy + 8 + hash1(k, 5) * (Wt.maxD - 10) + Math.sin(t * 0.7 + k) * 3;
      const x = Math.round(X - ox), y = Math.round(Y - oy); if (x < 0 || x > W || y > H) continue;
      g.fillStyle = turb > 0.08 && k % 2 ? '#b8905a' : (k % 3 ? '#9ff6f8' : '#d8fff8');
      g.globalAlpha = 0.7; g.fillRect(x, y, 1, 1);
    }
    g.globalAlpha = 1;
    // flujo de aproximación hacia la rejilla de la toma (velocidad ∝ caudal) y compuerta
    const W_ = (sc.def.pf && sc.def.pf.water) || {};
    if (W_.intake) {
      const I = W_.intake, open = !(S.gateClosed);
      const q = (S.q || 100) / 100;
      if (open) for (let k = 0; k < 14; k++) {
        const ph = ((t * 0.35 * q + k / 14) % 1), side = k % 2 ? 1 : -1;
        const X = I.x + side * (46 - ph * 30), Y = I.y - 2 + Math.sin(k * 1.7) * 10 * (1 - ph);
        const x = Math.round(X - ox), y = Math.round(Y - oy);
        g.globalAlpha = 0.25 + ph * 0.5; g.fillStyle = '#c2f2fb'; g.fillRect(x, y, 2, 1);
      }
      g.globalAlpha = 1;
      const ga = clamp(S.gateAnim || 0, 0, 1);
      if (ga > 0) {
        const gx = Math.round(I.x - 18 - ox), gy = Math.round(I.y - 11 - oy), gh = Math.round(ga * 17);
        g.fillStyle = '#c0242a'; g.fillRect(gx, gy, 37, gh);
        g.fillStyle = '#ff6b5a'; g.fillRect(gx, gy, 37, 1);
        g.fillStyle = '#7a1018'; for (let y = 3; y < gh; y += 4) g.fillRect(gx + 1, gy + y, 35, 1);
      }
    }
    // cardumen
    const eco = S.eco ?? 0.2;
    for (const f of Wt.fish) {
      f.x += f.vx * Game.dt;
      if (Math.abs(f.x - f.home) > f.range) { f.vx = -Math.sign(f.x - f.home) * Math.abs(f.vx); f.x = f.home + Math.sign(f.x - f.home) * f.range; }
      // con riesgo ecológico alto, los peces cercanos a la toma son arrastrados hacia la rejilla
      if (W_.intake && !S.gateClosed && eco > 0.45 && Math.abs(f.x - W_.intake.x) < 70) f.x += Math.sign(W_.intake.x - f.x) * 6 * Game.dt;
      const spr = f.kind === 1 ? Wt.fishB : f.kind === 2 ? Wt.fishO : Wt.fishS;
      const x = Math.round(f.x - ox - spr.w / 2), y = Math.round(f.y - oy + Math.sin(t * 1.3 + f.ph) * 1.5 - spr.h / 2);
      if (x < -30 || x > W + 30 || y > H) continue;
      if (f.x < Wt.x0 + 6 || f.x > Wt.x1 - 6) continue;
      PFK.drawStrip(g, spr, Math.floor(t * 6 + f.ph), x, y, f.vx < 0);
    }
  }
  function renderFront(g, sc, Wt) {
    const ox = sc.cam.ox, oy = sc.cam.oy, t = Game.time;
    const yS = Wt.wy - oy - 11;
    if (yS > H || yS < -30) return;
    const cs = Wt.crest, fr = Math.floor(t * 7) % 8;
    const scroll = Math.floor(t * 8) % 64;
    const xs = Math.max(Wt.x0 + (Wt.w.crestFrom || 0), ox - 64), xe = Math.min(Wt.x1 - (Wt.w.crestTo || 0), ox + W + 64);
    for (let X = xs - ((xs - scroll + 6400) % 64); X < xe; X += 64) {
      const x = X - ox, cut0 = Math.max(0, Wt.x0 + (Wt.w.crestFrom || 0) - X), cut1 = Math.min(64, Wt.x1 - (Wt.w.crestTo || 0) - X);
      if (cut1 <= cut0) continue;
      // cada tramo de 64 px con su propio desfase de cuadro: la cresta no se lee como un patrón repetido
      const ft = (fr + Math.floor(hash1(Math.floor((X + 6400) / 64), 17) * 8)) % 8;
      g.drawImage(cs.c, ft * 64 + cut0, 0, cut1 - cut0, cs.h, x + cut0, yS, cut1 - cut0, cs.h);
    }
    // espuma de contacto en pilotes y muros (salpicaduras animadas)
    for (const px of Wt.contacts) {
      const x = px - ox; if (x < -20 || x > W + 20) continue;
      // golpe de ola: salpicadura animada (8 cuadros, ~1,4 s por ciclo, desfase por pilote) + franja de espuma
      const fi = Math.floor(t * 6 + hash1(Math.round(px), 23) * 8) % 8;
      PFK.drawStrip(g, Wt.splash, fi, x - 6, Wt.wy - oy - 22);
      g.fillStyle = '#d2ecee'; g.fillRect(x - 7, Wt.wy - oy, 15, 1);
    }
    // rocío ocasional
    if (Math.random() < 0.25) { const X = ox + Math.random() * W; if (X > Wt.x0 + (Wt.w.crestFrom || 0) && X < Wt.x1 - (Wt.w.crestTo || 0)) sc.world.ps.emit('splash', X, Wt.wy - 4, (Math.random() - 0.5) * 20, -40, 2, 3); }
  }
  return { build, renderBack, renderFront, crestStrip, fishStrip, UND, SURF };
})();
