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
  const SANDW = ['#1a3a4a', '#2a5560', '#3f7272', '#5a8e80', '#7ea890', '#a8c0a0'];
  const ROCKW = ['#061224', '#0c2234', '#14344a', '#1f4a5e', '#2f6474', '#4a8288'];
  const KELP = ['#0a2a1e', '#12402a', '#1e5a30', '#2f7a3a', '#4f9a44', '#86c05a'];

  /** Color de agua a profundidad dz (px bajo la superficie) con borde de banda irregular */
  function waterAt(P, dz, x, y, maxD) {
    const t = clamp(1 - dz / maxD, 0, 1);
    const j = (hash2((x / 3) | 0, (y / 2) | 0, 5) - 0.5) * 0.07 + (PFK.vn(x * 0.03, y * 0.05, 6) - 0.5) * 0.08;
    return P[clamp(Math.round((t * t * 0.55 + t * 0.45 + j) * 8), 0, 8)];
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
    // 3. lecho: arena con ondas, rocas
    const SW = PFK.P32(SANDW), RK = PFK.P32(ROCKW);
    for (let x = 0; x < wd; x++) {
      const X = x0 + x, bed = bedAt(X);
      for (let Y = bed; Y < world.h; Y++) {
        const d = Y - bed;
        let k = 4 - Math.round(d * 0.12) + ((Y * 2 + Math.round(Math.sin(X * 0.11) * 2)) % 5 === 0 ? -1 : 0) + (PFK.cl(X, Y, 2, 7) < 0.15 ? -1 : 0);
        if (d === 0) k = 5;
        pb.data[(Y - y0) * wd + x] = SW[clamp(k, 0, 5)];
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
    // 4. estructuras sumergidas: tubería de toma + cabezal con rejilla; succiones de bombas
    const W_ = P.water || {};
    if (W_.intake) {
      const ix = W_.intake.x, iy = W_.intake.y, top = W_.intake.top || wy - 20;
      const S = PFK.P32(['#04263c', '#07507a', '#0a7fae', '#11bedd', '#3adcf1', '#9cf0f8']);
      for (let Y = top; Y < iy - 6; Y++) for (let k = 0; k < 9; k++) { const dz = clamp((Y - wy) / 120, 0, 1); put(ix - 4 + k, Y, PFK.mixU(S[[0, 3, 5, 4, 3, 2, 2, 1, 0][k]], UW[4], Y > wy ? 0.25 + dz * 0.4 : 0)); }
      // cabezal: cilindro horizontal con barras verticales sobre zapata de hormigón
      const hx0 = ix - 16, hx1 = ix + 16;
      for (let Y = iy - 9; Y <= iy + 6; Y++) for (let X = hx0; X <= hx1; X++) {
        const f = (Y - iy + 9) / 15;
        let c = S[clamp([1, 4, 5, 4, 3, 3, 2, 2, 1, 1, 1, 0, 0, 0, 0, 0][Y - iy + 9] ?? 1, 0, 5)];
        if ((X - hx0) % 3 === 1 && Y > iy - 7 && Y < iy + 5) c = U('#062438');
        put(X, Y, PFK.mixU(c, UW[3], 0.35));
      }
      for (let X = hx0 - 4; X <= hx1 + 4; X++) for (let Y = iy + 7; Y < iy + 11; Y++) put(X, Y, PFK.mixU(U(Y === iy + 7 ? '#a89c92' : '#5a5658'), UW[3], 0.45));
    }
    for (const sx of (W_.suction || [])) {
      const sTop = wy - 18, sBot = (W_.suctionY || wy + 40);
      for (let Y = sTop; Y < sBot; Y++) for (let k = 0; k < 7; k++) { const dz = clamp((Y - wy) / 100, 0, 1); put(sx - 3 + k, Y, PFK.mixU(U(['#0e2a48', '#2f86c0', '#5ab4e0', '#2f86c0', '#245f90', '#163e66', '#0e2a48'][k]), UW[5], Y > wy ? 0.3 + dz * 0.4 : 0)); }
      // campana de succión
      for (let Y = sBot; Y < sBot + 4; Y++) for (let k = -2 - (Y - sBot); k < 9 + (Y - sBot); k++) put(sx - 3 + k, Y, PFK.mixU(U(Y === sBot + 3 ? '#062438' : '#245f90'), UW[5], 0.45));
    }
    // 5. tiras animadas y sprites
    const crest = crestStrip(), shaft = shaftSprite(), fishS = fishStrip(0), fishB = fishStrip(1), fishO = fishStrip(2);
    // cardumen
    const fish = [];
    const nF = W_.fish ?? 9;
    for (let i = 0; i < nF; i++) {
      const big = i % 3 === 0, kind = big ? 1 : (i % 5 === 2 ? 2 : 0);
      const xx = (W_.fishX ? W_.fishX[0] : x0) + r() * ((W_.fishX ? W_.fishX[1] : x1) - (W_.fishX ? W_.fishX[0] : x0));
      fish.push({ x: xx, y: wy + 16 + r() * (Math.max(30, bedAt(Math.round(xx)) - wy - 40)), vx: (r() < 0.5 ? -1 : 1) * (5 + r() * 6), kind, ph: r() * 10, home: xx, range: 60 + r() * 120 });
    }
    const contacts = [x0 + 4];
    for (const [a, b] of holes) for (let px = a + 18; px < b - 6; px += 46) contacts.push(px);
    for (const cx of (W_.contacts || [])) contacts.push(cx);
    return { w, x0, x1, y0, wy, c: pb.toCanvas(), crest, shaft, fishS, fishB, fishO, fish, bedAt, holes, maxD, contacts };
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
      g.drawImage(cs.c, fr * 64 + cut0, 0, cut1 - cut0, cs.h, x + cut0, yS, cut1 - cut0, cs.h);
    }
    // espuma de contacto en pilotes y muros (salpicaduras animadas)
    for (const px of Wt.contacts) {
      const x = px - ox; if (x < -10 || x > W + 10) continue;
      const k = (t * 2.5 + px * 0.13) % 1;
      g.fillStyle = '#ffffff';
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI, rr = 3 + k * 6; g.globalAlpha = 1 - k; g.fillRect(Math.round(x + Math.cos(a) * rr * 1.3), Math.round(Wt.wy - oy - 1 - Math.sin(a) * rr * 0.8), 1, 1); }
      g.globalAlpha = 1; g.fillStyle = '#d2ecee'; g.fillRect(x - 5, Wt.wy - oy - 1, 11, 2);
    }
    // rocío ocasional
    if (Math.random() < 0.25) { const X = ox + Math.random() * W; if (X > Wt.x0 + (Wt.w.crestFrom || 0) && X < Wt.x1 - (Wt.w.crestTo || 0)) sc.world.ps.emit('splash', X, Wt.wy - 4, (Math.random() - 0.5) * 20, -40, 2, 3); }
  }
  return { build, renderBack, renderFront, crestStrip, fishStrip, UND, SURF };
})();
