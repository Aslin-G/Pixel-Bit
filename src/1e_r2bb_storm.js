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
const R2BB_BODYR = ['#12060c', '#1a0910', '#230c14', '#2e1018', '#3a141c', '#46181e', '#541e20', '#642622', '#763024', '#8a3c26'];
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
  const SUN = o.sun || { x: 404, y: 70, r: 10 };
  const HX = o.hx || 470, HY = o.hy || 50; // cabeza del coloso
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
  /* ---- coloso (mat 0) ---- */
  const z0 = 30;
  // torso, joroba y caderas que se deshacen en el muro
  R2BB_chain(P, r, [HX, HY + 34], [HX - 2, HY + 112], 30, 40, 0, z0, 6, 0.9);
  R2BB_chain(P, r, [HX - 44, HY + 60], [HX + 50, HY + 58], 28, 30, 0, z0 + 4, 5, 0.9);
  R2BB_chain(P, r, [HX - 50, HY + 118], [HX + 52, HY + 116], 24, 26, 0, z0 - 4, 7, 1);
  for (let q = 0; q < 26; q++) { const a = r.range(0, TAU), d = r.range(0.4, 1); P.push([HX + Math.cos(a) * 46 * d, HY + 82 + Math.sin(a) * 44 * d, r.range(6, 13), z0 + 12, 0]); }
  // hombros
  P.push([HX - 52, HY + 44, 27, z0 + 10, 0], [HX + 56, HY + 42, 29, z0 + 10, 0]);
  R2BB_chain(P, r, [HX - 66, HY + 36], [HX - 30, HY + 30], 14, 16, 0, z0 + 18, 3, 1);
  R2BB_chain(P, r, [HX + 34, HY + 28], [HX + 72, HY + 34], 16, 14, 0, z0 + 18, 3, 1);
  // brazos: hombro → codo → puño hundido en el muro
  R2BB_chain(P, r, [HX - 70, HY + 56], [HX - 104, HY + 96], 22, 18, 0, z0 + 16, 4, 1);
  R2BB_chain(P, r, [HX - 104, HY + 96], [HX - 118, HY + 132], 18, 21, 0, z0 + 20, 4, 1);
  R2BB_chain(P, r, [HX + 76, HY + 54], [HX + 108, HY + 92], 23, 19, 0, z0 + 16, 4, 1);
  R2BB_chain(P, r, [HX + 108, HY + 92], [HX + 124, HY + 128], 19, 22, 0, z0 + 20, 4, 1);
  // garras de polvo (dedos) en los puños
  for (const [fx, fy, s] of [[HX - 118, HY + 136, -1], [HX + 124, HY + 132, 1]]) for (let q = 0; q < 4; q++) R2BB_chain(P, r, [fx + s * (q * 7 - 10), fy + 6], [fx + s * (q * 8 - 12), fy + 22], 6, 4, 0, z0 + 26, 3, 0.2);
  // cabeza: cráneo, cejas, mandíbula y cuernos de polvo
  P.push([HX, HY, 21, z0 + 26, 0], [HX - 10, HY - 9, 12, z0 + 30, 0], [HX + 10, HY - 10, 12, z0 + 30, 0], [HX, HY + 14, 15, z0 + 24, 0], [HX - 14, HY + 9, 10, z0 + 28, 0], [HX + 14, HY + 8, 10, z0 + 28, 0]);
  R2BB_chain(P, r, [HX - 14, HY - 14], [HX - 30, HY - 36], 8, 3, 0, z0 + 22, 6, 0.3);
  R2BB_chain(P, r, [HX - 30, HY - 36], [HX - 26, HY - 50], 3, 1.6, 0, z0 + 22, 4, 0);
  R2BB_chain(P, r, [HX + 14, HY - 15], [HX + 32, HY - 38], 8, 3, 0, z0 + 22, 6, 0.3);
  R2BB_chain(P, r, [HX + 32, HY - 38], [HX + 29, HY - 53], 3, 1.6, 0, z0 + 22, 4, 0);
  // bultos de superficie sobre hombros y espalda (coliflor)
  for (let q = 0; q < 40; q++) { const a = r.range(-Math.PI, 0), sx = q % 2 ? HX - 52 : HX + 56, sy = HY + 44; P.push([sx + Math.cos(a) * 24, sy + Math.sin(a) * 22, r.range(4, 9), z0 + 24, 0]); }
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
  const BODYMIX = [0, 0.25, 0.5, 0.75].map(k => new Uint32Array(R2BB_BODYR.map((c, j) => U(mixHex(c, R2BB_WALLR[j], k)))));
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
      t = 0.2 + 0.34 * top + 0.5 * back + tex;
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
  /* ---- cara: cuencas, ojos de brasa y fauces ---- */
  const eyes = [[HX - 9, HY + 1, -1], [HX + 9, HY, 1]];
  const put = (x, y, c) => V.put(pb, x, y, U(c));
  for (const [ex, ey, s] of eyes) {
    // cuenca honda bajo la ceja (sombra granate) y ojo rasgado de brasa con núcleo claro
    for (let yy = -3; yy <= 3; yy++) for (let xx = -6; xx <= 6; xx++) if (Math.abs(xx) + Math.abs(yy) * 1.7 <= 6.6) put(ex + xx, ey + yy, yy < -1 ? '#0a0306' : yy < 1 ? '#10050a' : '#1c0a10');
    for (let xx = -4; xx <= 4; xx++) { const yy = Math.round(-xx * s * 0.3); put(ex + xx, ey + yy, Math.abs(xx) === 4 ? '#c8401a' : '#ff7a24'); if (Math.abs(xx) <= 3) put(ex + xx, ey + yy - 1, Math.abs(xx) <= 1 ? '#fff4b0' : '#ffb03a'); }
  }
  const my = HY + 15, maw = [];
  for (let xx = -11; xx <= 11; xx++) {
    const yy = Math.round(Math.abs(xx) * 0.24 - (Math.abs(xx) > 9 ? 1 : 0));
    put(HX + xx, my + yy - 2, '#0a0306'); put(HX + xx, my + yy - 1, '#2a0808'); put(HX + xx, my + yy, '#7a1a0c'); put(HX + xx, my + yy + 1, '#3a0a08'); put(HX + xx, my + yy + 2, '#0a0306');
    if (Math.abs(xx) < 10) {
      if (xx % 3 === 0) { put(HX + xx, my + yy - 1, '#ffd070'); put(HX + xx, my + yy, '#ff8a30'); }          // colmillo superior
      else if ((xx + 12) % 3 === 1) { put(HX + xx, my + yy + 1, '#ffb050'); put(HX + xx, my + yy, '#e05a22'); } // colmillo inferior
      else put(HX + xx, my + yy, '#ff6a20');
    }
    maw.push([HX + xx, my + yy]);
  }
  // grietas de brasa en el pecho (el corazón de la tormenta)
  const cracks = [];
  for (let q = 0; q < 3; q++) { let x = HX + r.range(-10, 10), y = HY + 60 + q * 14; for (let k = 0; k < 14; k++) { const nx2 = x + r.range(-2.2, 2.2), ny2 = y + r.range(0.6, 1.8); put(Math.round(nx2), Math.round(ny2), k % 4 === 0 ? '#ffb040' : '#c8401a'); if (k % 5 === 0) cracks.push([Math.round(nx2), Math.round(ny2)]); x = nx2; y = ny2; } }
  return { c: pb.toCanvas(), sun: SUN, eyes, maw, head: [HX, HY], cracks, wallTop };
}
