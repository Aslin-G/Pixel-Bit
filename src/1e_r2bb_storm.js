/* =====================================================================
   1e_r2bb_storm.js — r2-biomes-b · CIELO DE TORMENTA CON EL COLOSO DE
   POLVO (MIRAGE) para el Nivel 10 «La Gran Calima».
   Un único lienzo (ancho W + paralaje 0,02 del nivel) que se dibuja en una
   sola pasada: cielo óxido→ámbar en bandas con el sol detrás del coloso,
   cúmulos de polvo colgando con el vientre encendido, el muro de la
   tormenta (haboob) que sube en diagonal hacia la derecha y el COLOSO de
   polvo (cuernos de polvo, ojos de brasa, fauces, hombros y brazos que se
   apoyan en el muro). Sombreado por bultos (z-buffer por caja de cada
   bulto: coste ∝ área de los bultos), luz de borde desde el sol que tiene
   detrás y haces/sombras crepusculares por oclusión angular desde el sol.
   Sin tramado: bandas con borde en clusters 3×2 (VISTA.band).
     R2BB_stormSky(w, h, o) → { c, sun, eyes, maw, head, cracks, wallTop }
     R2BB_puffRaster(w, h, puffs, ID, Z, NX, NY)   raster de bultos
     R2BB_chain(out, rng, a, b, ra, rb, mat, zo, n, fest)  cadena de bultos
   ===================================================================== */
const R2BB_SKYR = ['#14060e', '#1e0912', '#2a0d16', '#381218', '#48161a', '#5a1c1a', '#6e241a', '#84301c', '#9a3c1e', '#b04a20', '#c45a24', '#d66c28', '#e4802e', '#ee9636', '#f6ae44', '#fbc458', '#fed876', '#ffeaa0', '#fff6cc'];
/** Cuerpo del coloso: ciruela polvorienta (contraste de tono frente al cielo naranja, como la tarjeta de la referencia) */
const R2BB_BODYR = ['#0c0610', '#130a18', '#1b0e20', '#241228', '#2e172e', '#3a1d34', '#472438', '#562c3c', '#68363e', '#7c4240', '#924e3e', '#aa5e42', '#c47448'];
const R2BB_WALLR = ['#2a0e12', '#381416', '#481a18', '#5a221a', '#6e2c1c', '#84381e', '#9a4620', '#b05624', '#c46a2a', '#d68032'];
const R2BB_CLOUDR = ['#1c0a12', '#260e16', '#32121a', '#40181e', '#502020', '#622822', '#783222', '#8e3e24', '#a84e26', '#c2622a'];
const R2BB_RIMR = ['#a0401e', '#c45a22', '#e07a2a', '#f49a3a', '#ffbe58', '#ffdc86', '#fff2bc'];
/** Relieve a contraluz: cordillera (lejos, más bruma) y montes/cabo (medio, más oscuro) */
const R2BB_FARR = ['#2a0e16', '#36121a', '#46181c', '#58201e', '#6c2a20', '#843622', '#9c4426', '#b4562c', '#cc6c34', '#e2883e'];
const R2BB_MIDR = ['#1c0a10', '#260e14', '#341418', '#441a1a', '#58221c', '#6e2c1e', '#863a22', '#a04a26', '#bc602c', '#d67c36'];
/** Rasteriza bultos esféricos [cx, cy, r, zOff, mat] con z-buffer recorriendo solo la caja de cada bulto */
function R2BB_puffRaster(w, h, puffs, ID, Z, NX, NY) {
  for (let p = 0; p < puffs.length; p++) {
    const P = puffs[p], cx = P[0], cy = P[1], r = P[2], zo = P[3] || 0, r2 = r * r;
    const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(w - 1, Math.ceil(cx + r)), y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(h - 1, Math.ceil(cy + r));
    for (let y = y0; y <= y1; y++) {
      const dy = y + 0.5 - cy, o = y * w;
      for (let x = x0; x <= x1; x++) {
        const dx = x + 0.5 - cx, q = r2 - dx * dx - dy * dy; if (q <= 0) continue;
        const z = Math.sqrt(q) + zo, i = o + x;
        if (z > Z[i]) { Z[i] = z; ID[i] = p; NX[i] = dx / r; NY[i] = dy / r; }
      }
    }
  }
}
/** Cadena de bultos de a → b (radios ra → rb) con jitter; añade bultos de superficie (festón) */
function R2BB_chain(out, r, a, b, ra, rb, mat, zo = 0, n = 0, fest = 0.6) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), k = n || Math.max(2, Math.ceil(L / (Math.min(ra, rb) * 0.7)));
  for (let i = 0; i <= k; i++) {
    const t = i / k, x = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t), rr = lerp(ra, rb, t);
    out.push([x + r.range(-1.5, 1.5), y + r.range(-1.5, 1.5), rr * r.range(0.9, 1.06), zo, mat]);
    if (r.chance(fest)) { const an = r.range(0, TAU), d = rr * r.range(0.62, 0.92); out.push([x + Math.cos(an) * d, y + Math.sin(an) * d, rr * r.range(0.26, 0.46), zo + rr * 0.5, mat]); }
  }
}
function R2BB_stormSky(w, h, o = {}) {
  const V = VISTA, r = RNG(o.seed || 4401), pb = new PixelBuffer(w, h), N = w * h;
  const SUN = o.sun || { x: 352, y: 54, r: 11 };
  const HX = o.hx || 470, HY = o.hy || 60; // cabeza del coloso
  const P = [];
  /* ---- cúmulos de polvo colgando arriba (mat 2), con hueco sobre el sol ---- */
  for (let x = -30; x < w + 40; x += r.int(22, 40)) {
    const gap = Math.abs(x - SUN.x + 10) < 70 ? 1 : 0;
    const cy = gap ? r.range(-34, -20) : r.range(-14, 10) + (x < 140 ? 10 : 0), rr = r.range(22, 40);
    P.push([x, cy, rr, 0, 2]);
    for (let q = 0; q < 4; q++) { const ax = x + r.range(-rr, rr), ay = cy + rr * r.range(0.45, 0.9); if (!gap || r.chance(0.3)) P.push([ax, ay, r.range(5, 12), rr * 0.4, 2]); }
  }
  // islas de polvo a la izquierda (bajo el panel de objetivo) y a la derecha alta
  for (const [cx, cy, ww] of [[120, 98, 120], [232, 128, 70], [640, 50, 90]]) {
    const n = Math.round(ww / 10);
    for (let q = 0; q < n; q++) { const t = q / (n - 1), x = cx - ww / 2 + t * ww, rr = (6 + 9 * Math.sin(t * Math.PI)) * r.range(0.8, 1.2); P.push([x + r.range(-2, 2), cy - rr * 0.4 + r.range(-2, 2), rr, 0, 2]); }
  }
  /* ---- muro de la tormenta (mat 1): sube en diagonal hacia la derecha ---- */
  const wallTop = (x) => lerp(150, 104, clamp(x / w, 0, 1)) + Math.sin(x * 0.037) * 5 + Math.sin(x * 0.011 + 1) * 7;
  for (let x = -20; x < w + 30; x += r.int(9, 15)) {
    const top = wallTop(x), rr = r.range(10, 19);
    P.push([x, top + rr, rr, 0, 1]);
    P.push([x + r.range(-6, 6), top + rr * 2.2 + r.range(0, 6), rr * r.range(1, 1.3), -6, 1]);
    P.push([x + r.range(-6, 6), top + rr * 3.6 + r.range(0, 8), rr * r.range(1.1, 1.5), -12, 1]);
    for (let q = 0; q < 2; q++) P.push([x + r.range(-rr, rr), top + rr * r.range(0.3, 0.8), r.range(4, 8), rr * 0.5, 1]);
  }
  /* ---- coloso (mat 0): mole encorvada de polvo, cabeza hundida entre hombros enormes, brazos hasta el muro ---- */
  const z0 = 30;
  // torso y vientre que se deshacen en el muro
  R2BB_chain(P, r, [HX, HY + 30], [HX - 4, HY + 128], 36, 48, 0, z0, 6, 0.9);
  R2BB_chain(P, r, [HX - 50, HY + 64], [HX + 54, HY + 60], 30, 32, 0, z0 + 4, 5, 0.9);
  R2BB_chain(P, r, [HX - 62, HY + 122], [HX + 64, HY + 118], 26, 28, 0, z0 - 4, 7, 1);
  for (let q = 0; q < 30; q++) { const a = r.range(0, TAU), d = r.range(0.4, 1); P.push([HX + Math.cos(a) * 52 * d, HY + 84 + Math.sin(a) * 46 * d, r.range(6, 14), z0 + 12, 0]); }
  // hombros enormes por encima de la nuca (joroba) y trapecios hacia la cabeza
  P.push([HX - 58, HY + 2, 33, z0 + 8, 0], [HX + 62, HY - 2, 35, z0 + 8, 0], [HX + 4, HY - 6, 26, z0 - 6, 0]);
  R2BB_chain(P, r, [HX - 76, HY + 10], [HX - 30, HY - 4], 18, 20, 0, z0 + 14, 4, 1);
  R2BB_chain(P, r, [HX + 32, HY - 6], [HX + 84, HY + 6], 20, 18, 0, z0 + 14, 4, 1);
  // brazos colgantes: hombro → codo → puño hundido en el muro (como un gorila de polvo)
  R2BB_chain(P, r, [HX - 84, HY + 22], [HX - 118, HY + 78], 24, 20, 0, z0 + 16, 4, 1);
  R2BB_chain(P, r, [HX - 118, HY + 78], [HX - 132, HY + 134], 20, 24, 0, z0 + 20, 4, 1);
  R2BB_chain(P, r, [HX + 90, HY + 18], [HX + 122, HY + 74], 25, 21, 0, z0 + 16, 4, 1);
  R2BB_chain(P, r, [HX + 122, HY + 74], [HX + 138, HY + 130], 21, 25, 0, z0 + 20, 4, 1);
  // nudillos de polvo en los puños
  for (const [fx, fy, s] of [[HX - 132, HY + 140, -1], [HX + 138, HY + 136, 1]]) for (let q = 0; q < 4; q++) P.push([fx + s * (q * 9 - 13), fy + 14 + (q % 2) * 3, r.range(8, 11), z0 + 26, 0]);
  // cabeza ancha y baja: cráneo, arco ciliar macizo (sombra sobre las cuencas), pómulos y mandíbula
  P.push([HX, HY + 6, 22, z0 + 22, 0], [HX - 12, HY - 3, 12, z0 + 30, 0], [HX + 12, HY - 4, 12, z0 + 30, 0], [HX, HY - 6, 11, z0 + 31, 0],
    [HX - 17, HY + 12, 11, z0 + 26, 0], [HX + 17, HY + 11, 11, z0 + 26, 0], [HX - 9, HY + 27, 12, z0 + 24, 0], [HX + 9, HY + 27, 12, z0 + 24, 0], [HX, HY + 31, 12, z0 + 22, 0]);
  // bultos de superficie (coliflor) sobre hombros, joroba y antebrazos
  for (let q = 0; q < 56; q++) { const a = r.range(-Math.PI * 1.05, 0.05), side = q % 3, sx = side === 0 ? HX - 58 : side === 1 ? HX + 62 : HX + 4, sy = side === 2 ? HY - 6 : HY; const rr = side === 2 ? 22 : 30; P.push([sx + Math.cos(a) * rr, sy + Math.sin(a) * rr * 0.92, r.range(4, 9), z0 + 24, 0]); }
  /* ---- raster ---- */
  const ID = new Int16Array(N).fill(-1), Z = new Float32Array(N).fill(-1e9), NX = new Float32Array(N), NY = new Float32Array(N);
  R2BB_puffRaster(w, h, P, ID, Z, NX, NY);
  const MAT = new Int8Array(N).fill(-1); for (let i = 0; i < N; i++) if (ID[i] >= 0) MAT[i] = P[ID[i]][4];
  /* ---- oclusión angular desde el sol: OCC[a] = distancia al primer bulto ---- */
  const NA = 1440, OCC = new Float32Array(NA).fill(1e9);
  for (let a = 0; a < NA; a++) {
    const an = a / NA * TAU, ca = Math.cos(an), sa = Math.sin(an);
    for (let d = SUN.r + 2; d < 900; d += 1) { const x = Math.round(SUN.x + ca * d), y = Math.round(SUN.y + sa * d); if (x < 0 || y < 0 || x >= w || y >= h) break; if (MAT[y * w + x] >= 0) { OCC[a] = d; break; } }
  }
  // variación de los haces: ruido angular suave (huecos entre bultos = haces brillantes)
  const RAY = new Float32Array(NA); for (let a = 0; a < NA; a++) RAY[a] = fbm1(a / NA * 46, 3, 77);
  const sky = V.P32(R2BB_SKYR), body = V.P32(R2BB_BODYR), wall = V.P32(R2BB_WALLR), cloud = V.P32(R2BB_CLOUDR), rimR = V.P32(R2BB_RIMR);
  const HZ = o.hz || 200;
  const BODYMIX = [0, 0.25, 0.5, 0.75].map(k => new Uint32Array(R2BB_BODYR.map((c, j) => U(mixHex(c, R2BB_WALLR[Math.min(j, R2BB_WALLR.length - 1)], k)))));
  const glowAt = (x, y) => { const d = Math.hypot(x - SUN.x, (y - SUN.y) * 1.2); return Math.exp(-d / 46) * 0.5 + Math.exp(-d / 150) * 0.42 + Math.exp(-d / 420) * 0.16; };
  const rayAt = (x, y) => {
    const dx = x - SUN.x, dy = y - SUN.y, d = Math.hypot(dx, dy); if (d < SUN.r) return 0;
    let a = Math.round((Math.atan2(dy, dx) / TAU) * NA); a = ((a % NA) + NA) % NA;
    const occ = OCC[a];
    if (d > occ + 1) return -Math.min(1, (d - occ) / 40) * clamp(1.2 - (d - occ) / 520, 0.25, 1);  // sombra crepuscular
    const v = RAY[a]; return v > 0.55 ? (v - 0.55) * 2.4 * clamp(1 - d / 380, 0, 1) : 0;          // haz brillante
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, m = MAT[i];
    if (m < 0) {
      const wt = wallTop(x) + 26;
      if (y > wt) { // banco de polvo bajo el muro: opaco, más claro hacia abajo (polvo iluminado)
        const t = 0.3 + clamp((y - wt) / 120, 0, 1) * 0.42 + (fbm(x * 0.05, y * 0.12, 2, 5) - 0.5) * 0.14;
        pb.data[i] = wall[V.band(clamp(t, 0, 0.999), wall.length, x, y, 0.04, 17)];
        continue;
      }
      const vy = clamp(y / HZ, 0, 1);
      let t = 0.1 + 0.36 * Math.pow(vy, 0.85) + glowAt(x, y) * 0.66;
      const ry = rayAt(x, y); t += ry > 0 ? ry * 0.09 : ry * 0.12;
      pb.data[i] = sky[V.band(clamp(t, 0, 0.999), sky.length, x, y, 0.012, 11)];
      continue;
    }
    const tex = (fbm(x * 0.09, y * 0.11, 3, 21 + m) - 0.5) * 0.16;
    const nx = NX[i], ny = NY[i], nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    // dirección hacia el sol (en pantalla) y contraluz: los bultos que miran al sol se encienden en el borde
    let sx = SUN.x - x, sy = SUN.y - y; const sd = Math.hypot(sx, sy) || 1; sx /= sd; sy /= sd;
    const back = Math.max(0, nx * sx + ny * sy) * Math.pow(1 - nz, 1.4) * clamp(1.5 - sd / 260, 0.25, 1.2);
    const top = clamp(-ny * 0.7 + nz * 0.5 - nx * 0.12, -1, 1);
    let t, R;
    if (m === 0) {
      // volumen: luz del sol rasante por la izquierda-arriba + rebote cálido del muro de polvo en las panzas
      const bounce = Math.max(0, ny) * nz * clamp((y - HY - 30) / 90, 0, 1) * 0.2;
      t = 0.2 + 0.3 * top + 0.62 * back + bounce + tex + Math.max(0, -nx) * nz * 0.08 * clamp(1.4 - Math.abs(x - SUN.x) / 200, 0, 1);
      // la base del coloso se deshace en el muro: rampa mezclada por bandas de altura (borde en clusters)
      const dk = clamp((y - HY - 92) / 70 + (hash2((x / 3) | 0, (y / 2) | 0, 61) - 0.5) * 0.3, 0, 0.999);
      R = BODYMIX[Math.floor(dk * BODYMIX.length)];
      t += dk * 0.12;
    } else if (m === 1) { t = 0.26 + 0.3 * top + 0.55 * back + 0.06 * rayAt(x, y) + clamp((y - 150) / 160, 0, 0.25) + tex; R = wall; }
    else { t = 0.2 + 0.26 * top + 0.75 * back + glowAt(x, y) * 0.45 + tex; R = cloud; }
    // pliegue: bulto delante → línea interior más oscura
    for (const j of [i + 1, i - w, i - 1]) { if (j < 0 || j >= N) continue; const q = ID[j]; if (q >= 0 && q !== ID[i] && Z[j] > Z[i] + 1.8) { t -= 0.12; break; } }
    pb.data[i] = R[V.band(clamp(t, 0, 0.999), R.length, x, y, 0.04, 13 + m)];
  }
  /* ---- jirones de polvo que el viento arranca del coloso hacia la izquierda (hebras + motas sueltas) ---- */
  const wispU = U('#64303a'), speckU = U('#8a4636');
  for (let y = 0; y < h; y++) {
    let last = -1;
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x, m = MAT[i];
      if (m === 0) { last = x; continue; }
      if (last < 0 || m >= 0) continue;
      const d = last - x; if (d > 84) continue;
      const fall = Math.pow(1 - d / 84, 1.5), st = fbm(x * 0.011, y * 0.28, 2, 91);
      const k = fall * clamp((st - 0.44) * 3.4, 0, 1) + (hash2((x / 3) | 0, (y / 2) | 0, 23) - 0.5) * 0.12;
      if (k > 0.14) pb.data[i] = V.mixU(pb.data[i], wispU, k > 0.62 ? 0.5 : k > 0.36 ? 0.32 : 0.17);
      if (d < 40 && hash2(x, y, 13) < 0.018 * (1 - d / 40)) pb.data[i] = speckU;
    }
  }
  /* ---- luz de borde contra el cielo, del lado del sol (1–3 px, más fuerte cerca del sol) ---- */
  const rimList = [];
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x, m = MAT[i]; if (m < 0) continue;
    let sx = SUN.x - x, sy = SUN.y - y; const sd = Math.hypot(sx, sy) || 1; sx /= sd; sy /= sd;
    let lv = 0;
    for (let k = 1; k <= 3; k++) { const xx = Math.round(x + sx * k), yy = Math.round(y + sy * k); if (xx < 0 || yy < 0 || xx >= w || yy >= h || MAT[yy * w + xx] < 0 || (m === 0 && MAT[yy * w + xx] > 0 && k === 1)) { lv = 4 - k; break; } }
    if (!lv) continue;
    const near = clamp(1.35 - sd / 240, 0.15, 1) * (m === 0 ? 1 : m === 2 ? 0.85 : 0.6);
    const k = Math.round((lv / 3) * near * (rimR.length - 1) + (hash2(x >> 1, y, 5) - 0.5) * 1.2);
    if (k >= 1) rimList.push(i, clamp(k, 0, rimR.length - 1));
  }
  for (let q = 0; q < rimList.length; q += 2) pb.data[rimList[q]] = rimR[rimList[q + 1]];
  /* ---- sol velado detrás del coloso (solo sobre cielo) ---- */
  const SR = SUN.r;
  for (let y = SUN.y - SR - 3; y <= SUN.y + SR + 3; y++) for (let x = SUN.x - SR - 3; x <= SUN.x + SR + 3; x++) {
    if (x < 0 || y < 0 || x >= w || y >= h) continue; const i = y * w + x; if (MAT[i] >= 0) continue;
    const d = Math.hypot(x - SUN.x, y - SUN.y) + (hash2(x >> 1, y >> 1, 3) - 0.5) * 0.8;
    if (d <= SR - 3) pb.data[i] = U('#fffbe6'); else if (d <= SR - 1) pb.data[i] = U('#fff2c0'); else if (d <= SR + 1) pb.data[i] = U('#ffe49a');
  }
  /* ---- cara: cuencas bajo el arco ciliar, ojos de brasa rasgados y fauces como boca de horno ---- */
  const put = (x, y, c) => V.put(pb, x, y, typeof c === 'number' ? c : U(c));
  const shadeAt = (x, y, k) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; const i = y * w + x; pb.data[i] = V.mixU(pb.data[i], U('#08030a'), k); };
  const eyes = [[HX - 10, HY + 4, -1], [HX + 10, HY + 3, 1]];
  for (const [ex, ey, s] of eyes) {
    // cuenca honda: sombra en elipse con borde en clusters
    for (let yy = -4; yy <= 4; yy++) for (let xx = -8; xx <= 8; xx++) { const d = (xx * xx) / 64 + (yy * yy) / 16 + (hash2((ex + xx) >> 1, ey + yy, 9) - 0.5) * 0.25; if (d <= 1) shadeAt(ex + xx, ey + yy, d < 0.5 ? 0.75 : 0.45); }
    // ojo rasgado (extremo interior más bajo: ceño), brasa con núcleo blanco-amarillo
    for (let xx = -4; xx <= 4; xx++) {
      const yy = Math.round(xx * s * -0.32), e = Math.abs(xx);
      put(ex + xx, ey + yy, e === 4 ? '#a83416' : e === 3 ? '#e2561c' : '#ff8a2a');
      if (e <= 2) put(ex + xx, ey + yy - 1, e === 0 ? '#fff6c8' : '#ffc050');
      if (e <= 1) put(ex + xx, ey + yy + 1, '#c8401a');
    }
  }
  // fauces: abertura ancha en media luna, labio superior irregular (jirones de polvo, no dientes de dibujo),
  // interior de horno (borde granate → núcleo ámbar abajo); el resplandor sube por la mandíbula
  const my = HY + 22, maw = [], MW = 13;
  const topE = (xx) => Math.round(-1 + Math.abs(xx) * 0.12 + (hash2(xx + 40, 3, 71) < 0.35 ? 1 : 0) + (Math.abs(xx) % 5 === 2 ? 2 : 0));
  const botE = (xx) => Math.round(5.5 * Math.sqrt(Math.max(0, 1 - (xx * xx) / (MW * MW))) + 0.5);
  for (let xx = -MW; xx <= MW; xx++) {
    const t0 = topE(xx), t1 = Math.max(t0 + 1, botE(xx));
    put(HX + xx, my + t0 - 1, '#0a0306');
    for (let yy = t0; yy <= t1; yy++) {
      const v = (yy - t0) / Math.max(1, t1 - t0), c = Math.abs(xx) / MW;
      const heat = clamp(v * 1.1 - c * 0.55, 0, 1);
      put(HX + xx, my + yy, heat > 0.78 ? '#ffd27a' : heat > 0.55 ? '#ff9a34' : heat > 0.32 ? '#e0581e' : heat > 0.12 ? '#8a2410' : '#3a0a0a');
    }
    put(HX + xx, my + t1 + 1, '#1a0608');
    maw.push([HX + xx, my + Math.round((t0 + t1) / 2)]);
  }
  // reflejo de las fauces en la mandíbula y el pecho (luz de abajo, en bandas)
  for (let yy = 2; yy <= 12; yy++) for (let xx = -16; xx <= 16; xx++) {
    const x = HX + xx, y = my + 6 + yy; if (x < 0 || y >= h || MAT[y * w + x] !== 0) continue;
    const k = (1 - yy / 13) * (1 - Math.abs(xx) / 17); if (k > 0.25) { const i = y * w + x; pb.data[i] = V.mixU(pb.data[i], U('#c25a2a'), k > 0.6 ? 0.42 : k > 0.4 ? 0.28 : 0.16); }
  }
  // grietas de brasa en el pecho (el corazón de la tormenta)
  const cracks = [];
  for (let q = 0; q < 3; q++) { let x = HX + r.range(-12, 12), y = HY + 66 + q * 14; for (let k = 0; k < 14; k++) { const nx2 = x + r.range(-2.2, 2.2), ny2 = y + r.range(0.6, 1.8); put(Math.round(nx2), Math.round(ny2), k % 4 === 0 ? '#ffb040' : '#c8401a'); if (k % 5 === 0) cracks.push([Math.round(nx2), Math.round(ny2)]); x = nx2; y = ny2; } }
  return { c: pb.toCanvas(), sun: SUN, eyes, maw, head: [HX, HY], cracks, wallTop };
}

/* ---------------- r2-biomes-b · oclusor frontal: tendido eléctrico en contraluz (sin viga recta) ----------------
   Catenarias colgando entre postes fuera de cuadro, con el canto superior encendido por el sol de la tormenta,
   y jirones de lona enganchados (estáticos). Sustituye a 'cables' (que trae una viga de techo) en el exterior del N10. */
PFStage.FG.r2bbWires = function (o) {
  const w = o.w || 300, h = o.h || 46, pb = new PixelBuffer(w, h), r = RNG(o.seed || 5);
  const dk = U('#0e0606'), md = U('#24120c'), rim = U(o.rim || '#e08a44');
  const n = o.n || 3, curves = [];
  for (let i = 0; i < n; i++) {
    const y0 = 1 + i * 3 + r.int(0, 2), y1 = 2 + i * 4 + r.int(0, 3), sag = h * (0.42 + 0.12 * i + r.range(0, 0.08)), th = i === 0 ? 2 : 1;
    const yAt = (x) => { const t = x / (w - 1); return Math.round(lerp(y0, y1, t) + sag * 4 * t * (1 - t)); };
    curves.push(yAt);
    let py = yAt(0);
    for (let x = 0; x < w; x++) {
      const y = yAt(x), yA = Math.min(py, y), yB = Math.max(py, y);
      for (let yy = yA; yy <= yB + th - 1; yy++) PFK.put(pb, x, yy, yy === yB + th - 1 ? dk : md);
      if (yA - 1 >= 0) PFK.put(pb, x, yA - 1, rim);
      py = y;
    }
  }
  // jirones de lona enganchados en el cable principal (colgando hacia la izquierda: viento de la tormenta)
  for (const f of [0.3, 0.72]) {
    const fx = Math.round(w * f), y = curves[0](fx);
    for (let k = 0; k < 10; k++) { const len = k < 3 ? 3 : k < 6 ? 2 : 1; for (let q = 0; q < len; q++) PFK.put(pb, fx - k, y + 2 + Math.round(k * 0.3) + q, q === 0 ? U(k < 2 ? '#ffb070' : '#b0502a') : U('#4a1c12')); }
  }
  return pb;
};
