/* =====================================================================
   18y_r2terrain_urban.js — Muro de plaza y empedrado esculpidos (ronda 2).
   Sustituye el muro de sillares en rejilla y el empedrado gris de la cara
   'plazaWall' (N0, epílogo) por un CAMPO DE ALTURAS horneado por tramo y
   sombreado con la misma luz que la roca (arriba-izquierda, Lambert +
   sombra arrojada + oclusión de cavidad, rampas de 17 tonos con sombra
   granate-violeta). Estructura en coordenadas de mundo (tramos contiguos
   casan sin costura):
     · albardilla saliente que arroja una franja de sombra sobre el muro;
     · crujías de 150–290 px separadas por pilastras salientes (capitel y
       basa; sombra diagonal sobre la crujía vecina), cada crujía con su
       propio aparejo (hiladas de 9–15 px, sillares de 12–56 px con bisel,
       esquinas desportilladas, erosión y manchas) y un motivo:
       arco ciego con panel de azulejo, hornacina con maceta, escalera
       adosada que baja a la acequia, boca de desagüe con reja y verdín,
       friso de mosaico o muro liso;
     · zócalo saliente con chaflán iluminado y musgo;
     · acequia con agua turquesa y bordillos;
     · adoquinado en hiladas que crecen hacia la cámara (adoquines en
       almohadilla, juntas de arena, mezcla de basalto y caliza, banda
       gastada, tapas de registro y charcos que reflejan el cielo).
   API (R2TERRAIN_Urban):
     shade(o) → Uint32Array   sombreado genérico de un campo de alturas
       o = {w,h,bx0,H,A,M,FIX,F,mats:[{lit,sh}],gyA,dark,noise,seed}
     wall(s, world) → búfer del tramo · wallPix(s,x,y,gy,world) → u32
     wallPost(pb, world, s)  macetas en hornacinas, hiedra, matas en juntas
   Se activa por defecto para 'plazaWall' (s.r2 === false → antiguo).
   ===================================================================== */
const R2TERRAIN_Urban = (() => {
  const K = PFK, NONE = -999;
  const LV = R2TERRAIN_Rock.LV;
  const LXY = Math.hypot(LV[0], LV[1]), SDX = LV[0] / LXY, SDY = LV[1] / LXY, SLOPE = LV[2] / LXY;
  const ASHLAR = ['#24140e', '#3e2418', '#5e3826', '#82513a', '#a46c4c', '#c08a62', '#d8a87c', '#ecc89c', '#f8e2bc'];
  const KERB = ['#3a2a2a', '#5e4c48', '#8a786c', '#b2a08c', '#d2c2aa', '#e8dac2', '#faf0dc'];
  const COBW = ['#1a1218', '#2c1e24', '#42302e', '#5a4238', '#745646', '#8e6c56', '#a88468', '#c09e7e', '#d8ba98', '#ecd4b4'];
  const PILW = ['#3a2418', '#5e3e2c', '#86604a', '#ab8466', '#c9a482', '#e0c29e', '#f2dcbc', '#fcf0da'];
  const SANDJ = ['#3a2410', '#5a3a1c', '#7a5430', '#9a7046', '#b88c5c', '#d2a874', '#e8c48e'];
  const ACEQ = ['#06304a', '#0a5a78', '#0f8aa6', '#1ab8cc', '#5edcea', '#b8f4fa', '#ffffff'];
  const AZUL = ['#0e2a5a', '#1e4a8c', '#3a72b8', '#7aa8dc', '#e8f0fa', '#ffffff'];
  const MOS = ['#a24a2a', '#c8643a', '#f6ead0', '#e8d6b0', '#127a70', '#1aa894', '#2e5a9a', '#3e7ac0', '#f0c040'];
  const MOSS = ['#2e3a14', '#46561c', '#62742a', '#84983a'];
  const IRON = ['#0c0a10', '#1c1a22', '#34323c', '#545260'];
  const SKY = ['#5aa8d8', '#8cc8ec', '#c4e6f8', '#ffffff'];

  /* ---------------- sombreado genérico ---------------- */
  function shade(o) {
    const { w, h, H, A, M, FIX, F, mats, gyA } = o;
    const N = w * h, buf = new Uint32Array(N);
    const SW = w + 1, S = new Float64Array(SW * (h + 1)), C = new Uint32Array(SW * (h + 1));
    for (let y = 0; y < h; y++) {
      let rs = 0, rc = 0;
      for (let x = 0; x < w; x++) { const v = H[y * w + x]; if (v > NONE) { rs += v; rc++; } S[(y + 1) * SW + x + 1] = S[y * SW + x + 1] + rs; C[(y + 1) * SW + x + 1] = C[y * SW + x + 1] + rc; }
    }
    const L0 = LV[0], L1 = LV[1], L2 = LV[2], sd = (o.seed | 0) & 0xffff, nA = o.noise ?? 0.04;
    const dk = o.dark || [70, 160, 0.3], DH = U(o.darkHue || '#2a0c2e'), HL = U('#fff4dc');
    for (let y = 0; y < h; y++) {
      const ya = Math.max(0, y - 4), yb = Math.min(h, y + 5);
      for (let x = 0; x < w; x++) {
        const i = y * w + x, h0 = H[i]; if (h0 <= NONE) continue;
        const hl = x > 0 && H[i - 1] > NONE ? H[i - 1] : h0, hr = x < w - 1 && H[i + 1] > NONE ? H[i + 1] : h0;
        const hu = y > 0 && H[i - w] > NONE ? H[i - w] : h0, hd = y < h - 1 && H[i + w] > NONE ? H[i + w] : h0;
        const nx = clamp((hl - hr) * 0.5, -2.6, 2.6), ny = clamp((hu - hd) * 0.5, -2.6, 2.6);
        let lam = (nx * L0 + ny * L1 + L2) / Math.sqrt(nx * nx + ny * ny + 1); if (lam < 0) lam = 0;
        let sh = 0;
        for (let k = 2; k <= 22; k += 2) {
          const sx = x + Math.round(SDX * k), sy = y + Math.round(SDY * k); if (sx < 0 || sy < 0) break;
          const hs = H[sy * w + sx]; if (hs <= NONE) continue;
          const ex = hs - h0 - SLOPE * k; if (ex > 0) { sh = Math.max(sh, Math.min(1, ex / 1.6)); if (sh >= 1) break; }
        }
        const xa = Math.max(0, x - 4), xb = Math.min(w, x + 5);
        const cnt = C[yb * SW + xb] - C[ya * SW + xb] - C[yb * SW + xa] + C[ya * SW + xa];
        const mean = cnt ? (S[yb * SW + xb] - S[ya * SW + xb] - S[yb * SW + xa] + S[ya * SW + xa]) / cnt : h0;
        const ao = Math.min(0.2, Math.max(0, mean - h0) * 0.03);
        const d = y - gyA[x], fl = F ? F[i] : 0, depthK = clamp((d - dk[0]) / dk[1], 0, dk[2]);
        const fx = FIX ? FIX[i] : 0;
        if (fx) {
          // color fijo (agua, azulejo, hierro, musgo): solo sombra, oclusión y brillo de canto
          const kd = fl === 3 ? clamp(sh * 0.22 + ao, 0, 0.3) : clamp(sh * 0.5 + ao * 2 + depthK * 0.8 + (0.4 - lam) * 0.5, 0, 0.72);
          buf[i] = kd > 0.02 ? K.mixU(fx, DH, kd) : (lam > 0.62 ? K.mixU(fx, HL, Math.min(0.4, (lam - 0.62) * 0.8)) : fx);
          continue;
        }
        let t = A[i] * (0.22 + 0.78 * lam * (1 - 0.7 * sh)) - ao - depthK;
        t += (hash2((o.bx0 + x) >> 1, y >> 1, sd + 31) - 0.5) * nA;
        if (fl === 2) t = Math.min(t, 0.16);
        const R = mats[M[i]] || mats[0], N1 = R.lit.length - 1;
        const k = clamp(Math.round(t * N1), 1, N1);
        const cool = clamp(sh * 0.9 + (fl === 2 ? 0.8 : 0) + depthK * 1.2, 0, 1);
        let u = cool > 0.05 ? K.mixU(R.lit[k], R.sh[k], cool) : R.lit[k];
        if (fl === 1 && k > N1 - 5) u = K.mixU(u, HL, 0.45);
        buf[i] = u;
      }
    }
    return buf;
  }

  /* ---------------- trazado del muro (coordenadas de mundo) ---------------- */
  const _lay = new Map();
  function layout(seed, wallH) {
    const key = seed + '|' + wallH; let L = _lay.get(key); if (L) return L;
    const bays = [], top = 6, plinth = wallH - 7;
    let x = -240, i = 0;
    while (x < 6000) {
      const bw = 150 + Math.floor(hash1(i, seed + 1) * 140), pw = 12 + Math.floor(hash1(i, seed + 2) * 7);
      const kr = hash1(i, seed + 3);
      const kind = kr < 0.22 ? 1 : kr < 0.36 ? 2 : kr < 0.5 ? 3 : kr < 0.64 ? 4 : kr < 0.8 ? 5 : 0;
      const b = { i, x0: x, pw, x1: x + bw, kind, sd: (seed * 131 + i * 977) & 0xffff, courses: [] };
      // aparejo propio: hiladas de alturas variables, sillares de anchos variables
      let d = top, c = 0;
      while (d < plinth) {
        let ch = 9 + Math.floor(hash2(i, c, seed + 4) * 7); if (plinth - (d + ch) < 7) ch = plinth - d;
        const edges = []; let ex = b.x0 + pw - Math.floor(hash2(i, c, seed + 5) * 24), j = 0;
        while (ex < b.x1 + 4) { edges.push(ex); const lw = hash2(c, j, b.sd + 6); ex += lw < 0.12 ? 44 + Math.floor(lw * 100) : 12 + Math.floor(hash2(j, c, b.sd + 7) * 30); j++; }
        edges.push(1e9);
        b.courses.push({ d0: d, d1: d + ch, edges });
        d += ch; c++;
      }
      const inner = b.x1 - b.x0 - pw;
      b.cx = b.x0 + pw + inner * (0.35 + hash1(i, seed + 8) * 0.3);
      b.ar = Math.min(21, Math.max(11, Math.floor(inner / 2) - 14)) - (kind === 2 ? 5 : 0);
      b.sx = b.x0 + pw + 10 + Math.floor(hash1(i, seed + 9) * Math.max(1, inner - 90)); // escalera
      b.dirR = hash1(i, seed + 10) < 0.5;
      b.mc = Math.floor(hash1(i, seed + 11) * 2);                                       // hilada del friso
      bays.push(b); x += bw; i++;
    }
    L = { bays, top, plinth }; _lay.set(key, L); return L;
  }

  /** Hiladas del adoquinado (z desde el bordillo) con juntas de anchura variable, en coordenadas de mundo */
  const _cob = new Map();
  function cobRows(seed) {
    let R = _cob.get(seed); if (R) return R; R = [];
    let z0 = 3;
    for (let ri = 0; ri < 40; ri++) {
      const h = Math.min(15, 5 + Math.floor(ri * 0.9) + (hash1(ri, seed + 59) < 0.3 ? 1 : 0)), e = [];
      let x = Math.floor(hash1(ri, seed + 61) * 20), j = 0;
      while (x < 12000) { e.push(x); x += Math.max(5, Math.round(h * (1.1 + hash2(j, ri, seed + 62) * 1.1))); j++; }
      e.push(1e9); R.push({ z0, h, e }); z0 += h;
    }
    _cob.set(seed, R); return R;
  }
  /** Campo de alturas del muro + acequia + adoquinado para el tramo s */
  function wall(s, world) {
    const seed = (s.wallSeed ?? 7) | 0, wallH = s.wallH ?? 56, gut = s.gutter === false ? 0 : 8;
    const LY = layout(seed, wallH), plinth = LY.plinth;
    const bx0 = Math.floor(s.x0) - 24, bx1 = Math.ceil(s.x1) + 24, w = bx1 - bx0, h = world.h;
    const N = w * h, H = new Float32Array(N).fill(NONE), A = new Float32Array(N), M = new Uint8Array(N), FIX = new Uint32Array(N), F = new Uint8Array(N);
    const gyA = new Int16Array(w);
    for (let i = 0; i < w; i++) gyA[i] = Math.round(world.ground[clamp(bx0 + i, 0, world.w)]);
    const AQ = ACEQ.map(U), AZ = AZUL.map(U), MO = MOS.map(U), MS = MOSS.map(U), IR = IRON.map(U), SK = SKY.map(U);
    let bi = 0;
    for (let xi = 0; xi < w; xi++) {
      const x = bx0 + xi, gy = gyA[xi];
      while (bi < LY.bays.length - 1 && x >= LY.bays[bi + 1].x0) bi++;
      while (bi > 0 && x < LY.bays[bi].x0) bi--;
      const b = LY.bays[bi], nb = LY.bays[bi + 1] || b;
      const inPil = x < b.x0 + b.pw, pl = x - b.x0, pr = b.x0 + b.pw - 1 - x;
      // capitel y basa de pilastra algo más anchos (x en ±2 px)
      const nearPil = inPil || (x >= nb.x0 - 2) || (x < b.x0 + b.pw + 2);
      for (let y = Math.max(0, gy); y < h; y++) {
        const d = y - gy, i = y * w + xi;
        let hg = 0, alb = 1, m = 0, fix = 0, fl = 0;
        if (d <= 5) {
          // albardilla: canto superior iluminado, frente liso con juntas cada 28 px, saliente
          m = 1; hg = 6 - (d === 5 ? 1.5 : 0) - (d === 0 ? 0.5 : 0);
          if (d === 0) { fl = 1; alb = 1.25; } else if (d === 1) alb = 1.12;
          const j = (x + 4000) % 28; if (j === 0 && d > 1) hg -= 2.5;
          alb += (hash1(Math.floor((x + 4000) / 28), seed + 41) - 0.5) * 0.08;
        } else if (d < wallH) {
          if (inPil || (nearPil && (d < 10 || d >= plinth))) {
            // pilastra: fuste saliente con sillares altos, capitel (d<10) y basa (zócalo)
            const cap = d < 10, base = d >= plinth; m = cap || base ? 1 : 4;
            hg = 7 + (cap ? 2.5 : 0) + (base ? 2 : 0);
            const e = inPil ? Math.min(pl, pr) : 0;
            if (!inPil) hg = cap ? 8.5 : 8;
            else if (e < 2) hg -= (2 - e) * (2 - e) * 0.9;
            if (cap && d === 9) hg -= 1.5;
            if (cap && d === 6) { fl = 1; alb = 1.15; }
            if (!cap && !base && ((d - 10) % 15 === 0)) hg -= 2;               // juntas de los sillares del fuste
            alb += (K.vn(x * 0.3, y * 0.2, seed + 42) - 0.5) * 0.08 + (hash1(b.i, seed + 43) - 0.5) * 0.06;
          } else if (d >= plinth) {
            // zócalo: chaflán iluminado arriba, sillares largos, musgo y humedad abajo
            m = 0; const q = d - plinth;
            hg = 2.6 - (q === 0 ? 1.4 : q === 1 ? 0.6 : 0);
            const jj = (x + 4000 + b.i * 13) % 46; if (jj === 0 && q > 1) hg -= 2.2;
            alb = 0.94 + (hash1(Math.floor((x + 4000 + b.i * 13) / 46), seed + 44) - 0.5) * 0.1;
            if (q >= 3 && K.vn(x * 0.11, y * 0.3, seed + 45) > 0.58) fix = MS[clamp(Math.floor(K.vn(x * 0.4, y * 0.4, seed + 46) * 4), 0, 3)];
          } else {
            // sillería de la crujía
            let ci = 0; const cs = b.courses; while (ci < cs.length - 1 && d >= cs[ci + 1].d0) ci++;
            const c = cs[ci], E = c.edges; let ei = 0; while (E[ei + 1] <= x) ei++;
            const dl = x - E[ei], dr = E[ei + 1] - 1 - x, dt = d - c.d0, db = c.d1 - 1 - d;
            const bid = ei * 31 + ci * 7 + b.i * 977, hb = hash1(bid, seed + 50);
            if (dl === 0 || dt === 0) { hg = -2.6; alb = 0.82; if (dt === 0 && hash2(x, ci, seed + 51) < 0.25) hg = -1.6; }
            else {
              const pro = hb * 1.7, R = 2 + (hb > 0.7 ? 1 : 0);
              const ex = Math.min(dl - 1, dr), ey = Math.min(dt - 1, db);
              const e = (ex < R && ey < R) ? R - Math.hypot(R - ex, R - ey) : Math.min(ex, ey);
              hg = pro - (e < R ? (R - e) * (R - e) / R * 1.3 : 0);
              alb = 1 + (hb - 0.5) * 0.2 + (K.vn(x * 0.07, y * 0.09, seed + 52) - 0.5) * 0.12;
              // esquina desportillada y sillar erosionado (picado)
              if (hb < 0.22 && dl < 5 && dt < 4 + (hb * 20 | 0) % 3) hg -= 1.8;
              if (hb > 0.82) { hg += (K.vn(x * 0.45, y * 0.45, bid) - 0.5) * 1.4; alb -= 0.05; }
              // velo de humedad bajo la albardilla y manchas de cal
              if (d < 14 && K.vn(x * 0.08, 1, seed + 53) > 0.55) alb -= 0.07;
            }
            // friso de mosaico (crujía tipo 5)
            if (b.kind === 5 && ci === b.mc && dt > 0 && dl >= 0) {
              const tx = Math.floor((x + 4000) / 4), ty = Math.floor((d - c.d0) / 4), lx = (x + 4000) % 4, ly = (d - c.d0) % 4;
              if (lx === 0 || ly === 0) { hg = -0.8; alb = 0.9; fix = 0; }
              else { const dmd = (Math.abs(((tx + ty) % 6) - 3) + ty) % 4; fix = MO[[0, 2, 4, 6][dmd] + ((lx + ly) % 3 === 0 ? 1 : 0)]; hg = 0.6; }
            }
            // arco ciego con panel de azulejo (1) u hornacina (2)
            if (b.kind === 1 || b.kind === 2) {
              const ar = b.ar, ys = 10 + ar + (b.kind === 2 ? 10 : 0), ax = x - b.cx, ay = d - ys;
              const rr = Math.hypot(ax, Math.min(0, ay)), bot = b.kind === 2 ? ys + 16 : plinth;
              if (d < bot && Math.abs(ax) < ar + 4 && (ay > -ar - 4)) {
                if (rr >= ar && rr < ar + 4 && (ay <= 0 || Math.abs(ax) >= ar)) {
                  // dovelas / jambas de caliza
                  m = 1; hg = 2.2 - (rr >= ar + 3 ? 0.8 : 0); fix = 0;
                  if (ay <= 0) { const seg = Math.floor((Math.atan2(ay, ax) + Math.PI) / (Math.PI / 9)); if (Math.abs((Math.atan2(ay, ax) + Math.PI) / (Math.PI / 9) - seg - 0.5) > 0.42) hg -= 1.8; }
                  else if ((d - ys) % 9 === 8) hg -= 1.6;
                  alb = 1.02 + (hash1(Math.floor(rr) + Math.floor(ay / 9), seed + 54) - 0.5) * 0.06;
                } else if (rr < ar && Math.abs(ax) < ar) {
                  if (b.kind === 2) { hg = -12 + Math.max(0, d - (bot - 3)) * 3; alb = 0.62; m = 0; fix = 0; if (d >= bot - 3) { hg = -1; alb = 0.95; m = 1; } }
                  else {
                    hg = -5; alb = 0.88; fix = 0;
                    const py0 = ys - 6, py1 = bot - 4;
                    if (d >= py0 && d < py1 && Math.abs(ax) < ar - 3) {
                      const px = ax + ar - 3, lx = px % 5, lyy = (d - py0) % 5, tx = Math.floor(px / 5), ty = Math.floor((d - py0) / 5);
                      if (lx === 4 || lyy === 4) { fix = U('#c8c0b4'); hg = -5.6; }
                      else { const ccx = lx - 1.5, ccy = lyy - 1.5, star = Math.abs(ccx) + Math.abs(ccy) < 1.6; fix = (tx + ty) % 2 ? (star ? AZ[2] : AZ[4]) : (star ? AZ[4] : AZ[1]); hg = -4.6; }
                    }
                  }
                }
              }
            }
            // escalera adosada que baja hacia la acequia (crujía tipo 3)
            if (b.kind === 3) {
              const sw = 9, sh = 7, ns = Math.floor((wallH - 6) / sh), dx = b.dirR ? x - b.sx : b.sx + ns * sw - 1 - x;
              if (dx >= 0 && dx < ns * sw + 6) {
                const st = Math.min(ns - 1, Math.floor(dx / sw)), dtop = 6 + st * sh;
                if (d >= dtop) {
                  const q = d - dtop; m = q < 2 ? 1 : 4; fix = 0;
                  hg = 6 + (q < 3 ? -(3 - q) * 1.1 : 0); if (q === 0) { fl = 1; alb = 1.18; } else alb = 0.98 - (q > 3 ? 0.04 : 0);
                  const ex = b.dirR ? dx - st * sw : dx - st * sw; if (dx >= ns * sw) { hg = 4.5; alb = 0.9; } // zanca
                  if (q > 3 && ex === (b.dirR ? sw - 1 : 0)) hg -= 0.6;
                  alb += (hash2(st, b.i, seed + 55) - 0.5) * 0.08;
                }
              }
            }
            // boca de desagüe a ras de zócalo con reja y verdín (crujía tipo 4)
            if (b.kind === 4) {
              const ax = x - b.cx, rr0 = 9, yc = plinth - 2, ay = d - yc, rr = Math.hypot(ax, Math.min(0, ay) * 1.1);
              if (rr < rr0 + 3 && d < plinth) {
                if (rr >= rr0) { m = 1; hg = 2; alb = 1.02; fix = 0; if (ay <= 0) { const sg = Math.floor((Math.atan2(ay, ax) + Math.PI) / (Math.PI / 6)); if (((Math.atan2(ay, ax) + Math.PI) / (Math.PI / 6)) - sg < 0.14) hg = 0.4; } }
                else { hg = -14; alb = 0.4; fix = (ax + 40) % 3 === 0 ? IR[2 + (ax < 0 ? 1 : 0)] : 0; if (fix) hg = -3; fl = fix ? 0 : 2; }
              }
              if (Math.abs(x - b.cx) < 5 && d >= plinth && K.vn(x * 0.5, y * 0.1, seed + 56) > 0.3) fix = MS[2 + (hash2(x, y, 57) < 0.3 ? 1 : 0)];
            }
          }
        } else {
          const e = d - wallH;
          if (e < 2) { hg = -1.5; alb = 0.7; m = 0; }
          else if (gut && e < 2 + gut) {
            const q = e - 2;
            if (q === 0) { m = 1; hg = 1.2; fl = 1; alb = 1.1; }
            else if (q === gut - 1) { m = 1; hg = -0.6; alb = 0.8; }
            else {
              hg = -1.2; fl = 3; const ripple = Math.sin(x * 0.21 + q * 1.7) + (K.vn(x * 0.05, q, 71) - 0.5) * 2;
              let k = 3 + (q > gut - 3 ? -1 : 0) + (ripple > 1.1 ? 2 : ripple < -0.9 ? -1 : 0); if (q === 1) k = 1; if (hash2(x, q, 72) < 0.03) k = 6;
              fix = AQ[clamp(k, 1, 6)];
            }
          } else {
            // adoquinado: hiladas que crecen hacia la cámara, adoquines almohadillados, juntas de arena
            const z = e - 2 - gut;
            if (z < 3) { m = 1; hg = 2 - z * 0.6; if (z === 0) { fl = 1; alb = 1.12; } else alb = 0.9; }
            else {
              const CR = cobRows(seed); let ri = 0; while (ri < CR.length - 1 && z >= CR[ri + 1].z0) ri++;
              const row = CR[ri], rh = row.h, zz = z - row.z0, E = row.e, xx = x + 4000;
              let lo = 0, hi = E.length - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (E[mid] <= xx) lo = mid; else hi = mid; }
              const sw = E[lo + 1] - E[lo], lx = xx - E[lo], id = lo * 131 + ri * 17, hs = hash1(id, seed + 63);
              const sh2 = rh - (hs * 3 | 0) % 3, oy = ((hs * 7 | 0) % 3) - 1, pe = 2.1 + hs * 1.6;
              const exn = (lx + 0.5 - sw / 2) / (sw / 2 - 0.7), eyn = (zz - oy * 0.5 + 0.5 - rh / 2) / (sh2 / 2 - 0.4);
              const q = Math.pow(Math.abs(exn), pe) + Math.pow(Math.abs(eyn), pe);
              const tilt = z * 0.55;                                               // plano del suelo inclinado hacia la luz
              const wear = Math.max(0, 1 - Math.abs(z - 30) / 16) * (0.5 + K.vn(x * 0.02, 0, 79) * 0.6);
              if (q >= 1) { m = 3; hg = tilt - 1.8; alb = 0.8 + K.vn(x * 0.2, y * 0.3, seed + 70) * 0.15; if (K.vn(x * 0.3, y * 0.5, seed + 64) > 0.72 && z > 10) { fix = MS[1 + (hash2(x, y, 65) < 0.4 ? 1 : 0)]; } }
              else {
                m = 2; hg = tilt + 0.4 + hs * 1.2 + 2.1 * Math.pow(1 - q, 0.6) * (1 - wear * 0.5) + (hash1(id, seed + 71) - 0.5) * 0.18 * (lx - sw / 2) + (hash1(id, seed + 72) - 0.5) * 0.2 * (zz - rh / 2);
                alb = 1 + (hs < 0.16 ? -0.26 : hs > 0.84 ? 0.16 : (hs - 0.5) * 0.14) + wear * 0.12 + (K.vn(x * 0.2, y * 0.2, id) - 0.5) * 0.08;
              }
              // tapa de registro (hierro) y charco con reflejo de cielo
              const mh = (x + 4000) % 420, mx = mh - 210, my = z - 32;
              if (Math.abs(mx) < 13 && Math.abs(my) < 7 && (mx * mx) / 169 + (my * my) / 49 < 1) {
                const rq = (mx * mx) / 169 + (my * my) / 49; m = 2; fix = rq > 0.72 ? IR[1] : ((mx + my * 2 + 400) % 4 < 2 ? IR[3] : IR[2]); hg = tilt + 0.8;
              }
              const pz = (x + 4000 + 150) % 560, pxm = pz - 280, pym = z - 18 - (hash1(Math.floor((x + 4150) / 560), seed + 66) * 20 | 0);
              const pw = 22 + (hash1(Math.floor((x + 4150) / 560), seed + 67) * 18 | 0);
              if (Math.abs(pxm) < pw && Math.abs(pym) < 5) {
                const pq = (pxm * pxm) / (pw * pw) + (pym * pym) / 25 + (K.vn(x * 0.15, y * 0.3, seed + 68) - 0.5) * 0.5;
                if (pq < 1) { hg = tilt - 2; fix = SK[clamp(Math.floor(1 + (1 - pq) * 1.6 + (K.vn(x * 0.4, 0, 69) > 0.7 ? 1 : 0)), 0, 3)]; if (pym < -3) fix = SK[0]; }
              }
            }
          }
        }
        H[i] = hg; A[i] = alb; M[i] = m; FIX[i] = fix; F[i] = fl;
      }
    }
    const R = R2TERRAIN_Rock.ramp17;
    const mats = [R(s.wallRamp || ASHLAR, '#2a0c2e'), R(KERB, '#2a1438'), R(COBW, '#1e0c2a'), R(SANDJ, '#2a0c2e'), R(PILW, '#2a0c2e')];
    const buf = shade({ w, h, bx0, H, A, M, FIX, F, mats, gyA, seed, dark: [wallH + 16, 100, 0.38], noise: 0.04 });
    return { bx0, w, h, buf, LY, wallH, gut };
  }
  function wallPix(s, x, y, gy, world) {
    let R = s._r2u; if (!R) R = s._r2u = wall(s, world);
    const xi = x - R.bx0; if (xi < 0 || xi >= R.w || y < 0 || y >= R.h) return 0;
    return R.buf[y * R.w + xi];
  }

  /* ---------------- vegetación y objetos del muro ---------------- */
  function wallPost(pb, world, s) {
    const R = s._r2u; if (!R) return;
    const r = RNG((s.seed | 0) * 17 + 3), gyAt = (x) => Math.round(world.ground[clamp(Math.round(x), 0, world.w)]);
    const inSeg = (x) => x >= s.x0 + 4 && x < s.x1 - 4;
    const LF = ['#0e1c0a', '#1a3414', '#2a4f1e', '#3f6a26', '#5f8a2c', '#86ac3a'].map(U), BR = RAMP.bougainR.concat(['#ff8ad0']).map(U);
    const ivy = (x0, yb, hh, sd) => {
      const q = RNG(sd);
      for (let n = 0; n < hh * 5; n++) {
        const fy = Math.pow(q(), 0.8), yy = Math.round(yb - fy * hh), xx = Math.round(x0 + (q() - 0.5) * (6 + (1 - fy) * 14) + Math.sin(yy * 0.3 + sd) * 2);
        const c = LF[clamp(Math.round(1 + q() * 3 + (xx < x0 ? 1 : 0) - fy), 0, 5)]; K.put(pb, xx, yy, c); if (q() < 0.5) K.put(pb, xx + 1, yy, c);
      }
    };
    for (const b of R.LY.bays) {
      const cx = Math.round(b.cx); if (!inSeg(cx)) continue;
      const gy = gyAt(cx);
      if (b.kind === 2) {
        // maceta de terracota con geranios en la hornacina
        const ys = 10 + b.ar + 10, yb = gy + ys + 13;
        PFArch.pots(pb, cx - 3, yb, 1, cx);
        const FL = ['#ff2a5a', '#ff5aa8', '#ffd84a'].map(U);
        for (let k = 0; k < 14; k++) { const xx = cx - 6 + r.int(0, 12), yy = yb - 8 - r.int(0, 6); K.put(pb, xx, yy, LF[2 + r.int(0, 2)]); if (r() < 0.4) K.put(pb, xx, yy - 1, FL[r.int(0, 2)]); }
      }
      if (b.kind === 1 && r() < 0.7) {
        // buganvilla que asoma por encima del arco
        const x0 = cx - b.ar + r.int(-6, 6), wv = 16 + r.int(0, 14), L = 10 + r.int(0, 16);
        for (let i = 0; i < wv * L * 0.5; i++) {
          const fx = r(), fy = Math.pow(r(), 1.5), xx = Math.round(x0 + fx * wv), yy = Math.round(gy + 4 + fy * L * (1 - Math.abs(fx - 0.5)));
          K.put(pb, xx, yy, r() < 0.45 ? BR[clamp(Math.round(1.5 - fy + (r() - 0.5) * 1.5), 0, 3)] : LF[clamp(Math.round(4 - fy * 2.5), 1, 5)]);
        }
      }
      // hiedra que trepa desde el zócalo junto a pilastras
      if (r() < 0.45 && inSeg(b.x0 + b.pw + 3)) ivy(b.x0 + b.pw + 3 + r.int(0, 8), gyAt(b.x0) + R.wallH - 2, 14 + r.int(0, 22), b.sd);
    }
    // matas en las juntas del adoquinado y al pie del muro
    for (let x = s.x0 + 6 + r.int(0, 20); x < s.x1 - 6; x += 18 + r.int(0, 40)) {
      const gy = gyAt(x), y = gy + R.wallH + R.gut + 6 + r.int(4, 60); if (y > world.h - 4) continue;
      if (r() < 0.6) PFFlora.tuft(pb, x, y, 4 + r() * 4, 3 + r() * 4, x + y, RAMP.grassR);
      else if (r() < 0.5) PFFlora.flowerPatch(pb, x, y, 5, x * 3 + y);
    }
  }
  return { shade, wall, wallPix, wallPost, layout, ASHLAR, KERB, COBW };
})();
