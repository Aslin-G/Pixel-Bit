/* =====================================================================
   19d_sca_drone.js — Arte del minijuego del DRON (Nivel 1, DroneScene).
   Vista cenital ligeramente oblicua de la costa de captación, en el
   estilo del rediseño (sin tramado): mar en bandas de profundidad con
   isóbatas, cáusticas y rizos de arena, pradera marina (B), arrecife con
   corales (D), agua profunda (E), arroyo seco con abanico de sedimentos
   (A), muelle de la toma con plataforma (C), caseta de bombeo, playa,
   palmeras y cabo rocoso; pluma de turbidez como nube translúcida en
   bandas; boyas con anillos de oleaje; dron cuadricóptero con sombra.
   Todas las posiciones (boyas, muelle, playa, arroyo) son las del
   minijuego original: solo cambia el arte.
   API: SCADrone.map() → lienzo W×H (cacheado)
        SCADrone.drawSea(g, t)            oleaje, destellos y espuma de orilla
        SCADrone.drawPlume(g, k, t)       pluma del arroyo (k = 0..1)
        SCADrone.drawBuoy(g, P, sampled, t)
        SCADrone.drawDrone(g, x, y, t, sampling)
   ===================================================================== */
const SCADrone = (() => {
  const V = VISTA;
  const SHORE = (x) => 285 + Math.round(Math.sin(x * 0.08) * 1.5);
  /** Profundidad aproximada (m) del fondo en (x, y) */
  function depth(x, y) {
    let d = 0.6 + (SHORE(x) - y) * 0.052 + (x - 320) * 0.0035;
    d -= 3.2 * Math.exp(-((x - 430) ** 2) / 3600 - ((y - 150) ** 2) / 900);       // arrecife somero
    d -= 1.4 * Math.exp(-((x - 240) ** 2) / 4000 - ((y - 186) ** 2) / 700);       // pradera
    d += 2.5 * Math.exp(-((x - 560) ** 2) / 9000 - ((y - 50) ** 2) / 2600);       // fosa mar adentro
    d -= 1.8 * Math.exp(-((x - 70) ** 2) / 1800 - ((y - 262) ** 2) / 500);        // abanico del arroyo
    return d + (vnoise(x * 0.02, y * 0.02, 7) - 0.5) * 1.4;
  }
  let MAP = null;
  function map() {
    if (MAP) return MAP;
    const pb = new PixelBuffer(W, H);
    const WATER = V.P32(['#7cdfec', '#3adcf1', '#22c8e4', '#11bedd', '#0ca8d8', '#0692d5', '#057ec7', '#0a6fb8', '#085c9e', '#05467e', '#063a6a', '#072e51']);
    const nW = WATER.length;
    const SAND = V.P32(['#96592b', '#b8793a', '#c58440', '#d89a4e', '#edaf5f', '#fccf85', '#f9da99', '#fde9bd']);
    // ---- agua por profundidad (bandas con borde de ruido) + isóbatas cada 2 m
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (y >= SHORE(x)) continue;
      const d = depth(x, y), t = clamp(d / 15, 0, 0.999);
      let i = V.band(t, nW, x, y, 0.035, 11);
      let u = WATER[i];
      const dn = depth(x + 1, y), dm = depth(x, y + 1);
      if (Math.floor(d / 2) !== Math.floor(dn / 2) || Math.floor(d / 2) !== Math.floor(dm / 2)) u = V.mixU(u, U('#c2f2fb'), d < 6 ? 0.28 : 0.18);
      // cáusticas y rizos de arena en lo somero
      if (d < 5) {
        const c = V.ridged(x * 0.06, y * 0.09, 3, 13);
        if (c > 0.78) u = V.mixU(u, U('#e6f8fc'), (c - 0.78) * 1.6 * (1 - d / 5));
        if (d < 3 && ((y + Math.round(Math.sin(x * 0.12) * 2)) % 5) === 0) u = V.mixU(u, U('#bde3ed'), 0.25);
      }
      // manchas oscuras de fondo rocoso
      if (vnoise(x * 0.035, y * 0.035, 17) > 0.72 && d > 3) u = V.mixU(u, U('#042040'), 0.22);
      pb.data[y * W + x] = u;
    }
    // ---- pradera marina (B): manchas verde-azuladas con hojas que se inclinan con la corriente
    const GR = V.P32(['#0a4a4a', '#0f6a5a', '#1a8a6a', '#3fb07a', '#7ad08a']);
    for (let y = 150; y < 222; y++) for (let x = 160; x < 320; x++) {
      const nx = (x - 240) / 76, ny = (y - 186) / 26, e = nx * nx + ny * ny + (vnoise(x * 0.06, y * 0.08, 19) - 0.5) * 0.7;
      if (e > 1) continue;
      const i = y * W + x;
      pb.data[i] = V.mixU(pb.data[i], GR[(vnoise(x * 0.15, y * 0.15, 21) > 0.5) ? 2 : 1], 0.7);
      if (hash2(x, y, 23) < 0.09) { V.put(pb, x, y, GR[3]); V.put(pb, x + 1, y - 1, GR[4]); V.put(pb, x + 1, y - 2, GR[3]); }
    }
    // ---- arrecife (D): corales en racimos (teal, violeta, cálidos) vistos a través del agua, borde de rompiente claro
    const CR = [V.P32(RAMP.coralTealR), V.P32(RAMP.coralVioR), V.P32(RAMP.coralWarmR), V.P32(['#6a1450', '#c02a8a', '#f060b8', '#ffa8d8'])];
    // base del arrecife: roca clara somera con manchas oscuras (bajo los corales)
    for (let y = 116; y < 186; y++) for (let x = 340; x < 504; x++) {
      const nx = (x - 420) / 80, ny = (y - 150) / 31, e = nx * nx + ny * ny + (vnoise(x * 0.07, y * 0.09, 29) - 0.5) * 0.6;
      if (e > 1) continue;
      const i = y * W + x, rk = vnoise(x * 0.12, y * 0.14, 27);
      pb.data[i] = V.mixU(pb.data[i], U(rk > 0.6 ? '#1d6a74' : rk > 0.35 ? '#2a9a9a' : '#4ab8b0'), 0.55 * (1 - e * 0.5));
    }
    const r = RNG(31);
    for (let n = 0; n < 320; n++) {
      const a = r() * TAU, rr = Math.sqrt(r());
      const cx = 420 + Math.cos(a) * 70 * rr, cy = 150 + Math.sin(a) * 26 * rr, s = 1.4 + r() * 2.6, C = CR[n % 4];
      V.ellipse(pb, cx, cy, s, s * 0.8, (nx, ny, d) => {
        const k = clamp(Math.round(1.6 - nx * 0.9 - ny * 1.2 + (d < 0.3 ? 0.6 : 0)), 0, C.length - 1);
        return V.mixU(C[k], U('#11bedd'), 0.22);
      });
    }
    for (let x = 340; x < 500; x++) { const y = Math.round(150 + Math.sqrt(Math.max(0, 1 - ((x - 420) / 80) ** 2)) * 31); if (hash2(x, 1, 33) < 0.6) V.put(pb, x, y, U('#bde3ed')); }
    // peces (sombras) y rocas sueltas
    for (let i = 0; i < 14; i++) { const x = 380 + r.int(0, 100), y = 128 + r.int(0, 44); V.put(pb, x, y, U('#063a6a')); V.put(pb, x + 1, y, U('#063a6a')); }
    for (let i = 0; i < 22; i++) {
      const x = r.int(10, 620), y = r.int(150, 278); if (Math.abs(x - 334) < 14 || depth(x, y) > 6) continue;
      const rw = r.int(2, 5);
      V.ellipse(pb, x, y, rw, rw * 0.7, (nx, ny) => V.mixU(U(['#1d4a58', '#2e6468', '#4a8278', '#78a890'][clamp(Math.round(2 - nx - ny * 1.4), 0, 3)]), U('#11bedd'), 0.2));
    }
    // ---- cabo rocoso con vegetación en la esquina superior izquierda (visto desde arriba)
    const RK = V.P32(RAMP.rockR), VG = V.P32(V.RAMPS.vegHill);
    for (let y = 0; y < 150; y++) {
      const edge = Math.round(64 - y * 0.35 + Math.sin(y * 0.15) * 5 + (vnoise(y * 0.08, 0, 37) - 0.5) * 10);
      for (let x = 0; x < edge; x++) {
        const de = edge - x;
        let u;
        if (de < 5) u = RK[clamp(6 - de + (hash2(x, y, 3) < 0.3 ? -1 : 0), 0, 6)];       // acantilado iluminado
        else if (de < 8) u = RK[1];
        else u = VG[clamp(Math.round(3 + (vnoise(x * 0.1, y * 0.1, 39) - 0.5) * 4 + (PFK.cl(x, y, 2, 41) - 0.5)), 0, 6)];
        pb.data[y * W + x] = u;
      }
      // espuma al pie
      for (let q = 0; q < 2; q++) { const x = edge + q; if (hash2(x, y, 43) < 0.7) V.put(pb, x, y, U(q ? '#d2ecee' : '#ffffff')); }
    }
    // ---- playa
    for (let x = 0; x < W; x++) {
      const s = SHORE(x);
      for (let y = s; y < H; y++) {
        const d = y - s;
        let i = d < 3 ? 2 : d < 7 ? 3 : 5 + (vnoise(x * 0.05, y * 0.12, 45) > 0.55 ? 1 : 0);
        if (d > 6 && ((y + Math.round(Math.sin(x * 0.05) * 3)) % 7) === 0) i -= 1;           // rizos de duna
        if (hash2(x, y, 47) < 0.02) i += 1;
        pb.data[y * W + x] = SAND[clamp(i, 0, 7)];
      }
      V.put(pb, x, s, U('#fff6d8')); V.put(pb, x, s - 1, U('#c6fff2'));
    }
    // ---- arroyo seco (A): cauce de barro agrietado con cantos que desemboca en la playa
    const MUD = V.P32(['#6a4224', '#8a5a34', '#a8784a', '#c8986a', '#e0b888']);
    for (let y = 286; y < H; y++) {
      const cx = 60 + Math.sin(y * 0.06) * 12 + (y - 286) * 0.2, hw = 8 + (H - y) * 0.06;
      for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) {
        const dd = Math.abs(x - cx) / hw;
        let u = MUD[dd > 0.85 ? 0 : 2 + (hash2(x >> 1, y >> 1, 49) < 0.3 ? 1 : 0)];
        if (dd < 0.85 && ((x * 3 + y * 5) % 17 === 0)) u = MUD[1];
        if (hash2(x, y, 51) < 0.03) u = U('#d3ccc5');
        V.put(pb, x, y, u);
      }
    }
    // abanico de sedimentos bajo el agua frente a la desembocadura
    for (let y = 250; y < 286; y++) for (let x = 20; x < 140; x++) {
      const nx = (x - 66) / 60, ny = (y - 286) / 32, e = nx * nx + ny * ny; if (e > 1 || y >= SHORE(x)) continue;
      const i = y * W + x; pb.data[i] = V.mixU(pb.data[i], U('#c8a060'), 0.32 * (1 - e));
    }
    // ---- palmeras vistas desde arriba, matas y pasarela
    const PALM = V.P32(['#242606', '#45450e', '#757528', '#a9943e', '#ccc94a']);
    const palmTop = (cx, cy, R) => {
      for (let f = 0; f < 9; f++) {
        const a = f / 9 * TAU + 0.3;
        for (let q = 2; q < R; q++) {
          const x = Math.round(cx + Math.cos(a) * q), y = Math.round(cy + Math.sin(a) * q * 0.8 + q * q * 0.02);
          V.put(pb, x, y, PALM[q < R * 0.4 ? 3 : q < R * 0.8 ? 2 : 1]);
          if (q % 2) { V.put(pb, x + Math.round(-Math.sin(a)), y + Math.round(Math.cos(a)), PALM[q < R * 0.5 ? 4 : 2]); }
        }
      }
      V.ellipse(pb, cx, cy, 1.5, 1.5, () => U('#6b5020'));
      // sombra de la copa sobre la arena (abajo-derecha)
      for (let y = cy + 4; y < cy + 10; y++) for (let x = cx + 2; x < cx + 12; x++) { const nx = (x - cx - 7) / 6, ny = (y - cy - 7) / 3; if (nx * nx + ny * ny < 1) { const i = y * W + x; if (i < pb.data.length && y > SHORE(x) + 2) pb.data[i] = V.mixU(pb.data[i], U('#7a4a2a'), 0.35); } }
    };
    for (const [x, y, R] of [[170, 320, 10], [214, 336, 12], [430, 322, 11], [480, 340, 12], [560, 318, 10], [610, 338, 11], [130, 344, 9]]) palmTop(x, y, R);
    for (let i = 0; i < 40; i++) { const x = r.int(0, W), y = r.int(318, H - 2); if (Math.abs(x - 60) < 24) continue; PFFlora.tuft(pb, x, y, 6, 4, 600 + i); }
    for (let x = 362; x < 470; x++) for (let y = 300; y < 306; y++) V.put(pb, x, y, U(((x - 362) % 5 === 0) ? '#5a2d21' : y === 300 ? '#cb9772' : '#8e542f'));
    // ---- caseta de bombeo de SYNARA en 3/4 al pie del muelle (techo + fachada sur)
    const CON = V.P32(['#443930', '#6e625b', '#8a8078', '#ac9b82', '#cebaac', '#e2d2c0', '#f5e5c3']);
    for (let y = 290; y < 306; y++) for (let x = 306; x < 362; x++) {
      let u = CON[5 - (((x - 306) % 14) === 0 ? 2 : 0) - (y > 302 ? 1 : 0)];
      if (y === 290) u = CON[6];
      if ((x === 318 || x === 348) && y > 293 && y < 300) u = U('#3a405d');                 // ventiladores
      pb.data[y * W + x] = u;
    }
    for (let y = 306; y < 318; y++) for (let x = 306; x < 362; x++) {
      let u = CON[2 + (y > 315 ? -1 : 0)];
      if (x >= 328 && x < 340 && y > 308) u = U('#1a2a40');                                    // puerta
      if (y === 306) u = CON[1];
      if ((x === 312 || x === 352) && y > 308 && y < 314) u = U('#22c1e7');                    // ventanas
      pb.data[y * W + x] = u;
    }
    for (let x = 304; x < 364; x++) V.put(pb, x, 318, U('#6a4224'));
    V.text(pb, 'SYNARA', 315, 309, '#e6f8fe', { font: 'tiny' });
    // ---- muelle de la toma (C): tablones, barandillas, sombra sobre el agua y plataforma con la toma
    const WD = V.P32(RAMP.woodR);
    for (let y = 120; y < 290; y++) {
      for (let x = 328; x < 340; x++) {
        let u = WD[((y - 120) % 4 === 0) ? 3 : 5 - (x > 336 ? 1 : 0)];
        if (x === 328 || x === 339) u = WD[y % 6 < 2 ? 5 : 2];
        pb.data[y * W + x] = u;
      }
      if (y < SHORE(340)) for (let q = 0; q < 4; q++) { const i = y * W + 340 + q; pb.data[i] = V.mixU(pb.data[i], U('#03203a'), 0.45 - q * 0.09); }
      if (y % 18 === 0 && y < 282) { V.put(pb, 327, y, WD[1]); V.put(pb, 340, y, WD[1]); V.put(pb, 341, y + 1, U('#d2ecee')); }
    }
    // plataforma de la toma con torre de captación y rejilla
    for (let y = 104; y < 122; y++) for (let x = 320; x < 348; x++) {
      let u = CON[4 - (((x - 320) % 7) === 0 ? 1 : 0)];
      if (y === 104 || x === 320) u = CON[6]; if (y > 119 || x === 347) u = CON[1];
      pb.data[y * W + x] = u;
    }
    for (let y = 106; y < 124; y++) for (let q = 0; q < 4; q++) { const i = y * W + 348 + q; pb.data[i] = V.mixU(pb.data[i], U('#03203a'), 0.45 - q * 0.09); }
    V.ellipse(pb, 334, 112, 5.5, 4.5, (nx, ny, d) => U(d > 0.6 ? '#7a7e9e' : ((Math.round((nx + 1) * 6)) % 2 ? '#0e2a48' : '#31b4e2')));
    for (const [x, y] of [[323, 107], [345, 107], [323, 118], [345, 118]]) V.put(pb, x, y, U('#f0c040'));
    // tubería sumergida de la toma (se ve bajo el agua hacia mar adentro)
    for (let y = 60; y < 104; y++) { const x = 334 + Math.round((104 - y) * 0.18); for (let q = -1; q <= 1; q++) { const i = y * W + x + q; pb.data[i] = V.mixU(pb.data[i], U('#0e2a48'), q ? 0.18 : 0.3); } }
    MAP = pb.toCanvas();
    return MAP;
  }
  /* ---------------- dinámicos ---------------- */
  function drawSea(g, t) {
    // borreguitos que derivan (más grandes y lentos cerca de la costa)
    g.fillStyle = '#e6f8fc';
    for (let i = 0; i < 46; i++) {
      const y = Math.round(hash1(i, 3) * 270), len = 2 + Math.round(y / 60) + (i % 3);
      const x = Math.round((hash1(i, 5) * (W + 40) + t * (5 + y * 0.03)) % (W + 40)) - 20;
      if (x < 70 - y * 0.35 + 6) continue;
      const a = 0.5 + 0.5 * Math.sin(t * 1.6 + i * 1.3); if (a < 0.45) continue;
      g.globalAlpha = a * 0.75; g.fillRect(x, y, len, 1);
    }
    // destellos del sol
    g.fillStyle = '#ffffff';
    for (let i = 0; i < 24; i++) { const x = Math.round(hash1(i, 9) * W), y = Math.round(hash1(i, 11) * 260); if ((Math.floor(t * 3) + i) % 7) continue; g.globalAlpha = 0.9; g.fillRect(x, y, 1, 1); }
    g.globalAlpha = 1;
    // espuma de orilla que sube y baja (tramos de 4 px)
    for (let x = 0; x < W; x += 4) {
      const s = SHORE(x), ph = Math.sin(t * 1.1 + x * 0.025), up = Math.round(1 + (ph + 1) * 2.2);
      g.fillStyle = '#ffffff'; g.fillRect(x, s - up, 4, 1);
      g.globalAlpha = 0.6; g.fillStyle = '#bde3ed'; g.fillRect(x, s - up - 2, 4, 1); g.globalAlpha = 1;
      if (ph < -0.3) { g.fillStyle = '#c8a070'; g.fillRect(x, s + 1, 4, 1); }   // arena mojada que queda al retirarse
    }
  }
  /** Pluma de turbidez: lienzo regenerado cuando k cambia (bandas translúcidas con remolinos) */
  let PL = null, PLk = -1;
  function drawPlume(g, k, t) {
    const kq = Math.round(k * 30) / 30;
    if (kq !== PLk) {
      PLk = kq;
      const x0 = 20, y0 = 70, w = 300, h = 220;
      if (!PL) PL = new PixelBuffer(w, h);
      PL.data.fill(0);
      const blobs = [];
      for (let i = 0; i < 6; i++) blobs.push([70 + i * 22 + kq * 40, 250 - i * 18 - kq * 30, 34 + i * 6 + kq * 20, 16 + i * 3]);
      const C = [U('#8a6430'), U('#a07a3a'), U('#b48c4a'), U('#c8a060')];
      const A = [0.14, 0.24, 0.34, 0.42 + 0.1 * kq];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const X = x + x0, Y = y + y0;
        if (Y >= SHORE(X) - 1) continue;
        let m = 0;
        for (const [cx, cy, rx, ry] of blobs) { const e = ((X - cx) / rx) ** 2 + ((Y - cy) / ry) ** 2; if (e < 1.6) m = Math.max(m, 1.6 - e); }
        if (m <= 0) continue;
        const n = (vnoise(X * 0.05, Y * 0.07, 61) - 0.5) * 0.5 + (hash2(X >> 1, Y >> 1, 63) - 0.5) * 0.12;
        const lv = clamp(Math.floor((m + n) * 2.6), 0, 3);
        if (m + n < 0.08) continue;
        let ci = lv;
        if (Math.abs(((m + n) * 6) % 1 - 0.5) < 0.07) ci = 3;                          // vetas de remolino
        PL.data[y * w + x] = ((Math.round(A[lv] * 255) << 24) | (C[ci] & 0xffffff)) >>> 0;
      }
      PL.c = PL.toCanvas(PL.c); PL.x0 = x0; PL.y0 = y0;
    }
    g.drawImage(PL.c, PL.x0 + Math.round(Math.sin(t * 0.4) * 1), PL.y0);
  }
  /* boya: flotador rojo con banda blanca, mástil y bandera; verde si ya se muestreó */
  const BUOY = {};
  function buoySpr(ok) {
    const key = ok ? 'g' : 'r'; if (BUOY[key]) return BUOY[key];
    const pb = new PixelBuffer(13, 18);
    const B = V.P32(ok ? ['#0e4a2a', '#1f854c', '#3fc070', '#86e36f', '#d4ffc0'] : ['#5a0e14', '#9a1e24', '#e83b41', '#ff7a6a', '#ffd0c8']);
    V.ellipse(pb, 6.5, 13.5, 5.5, 3.5, (nx, ny, d) => { if (Math.abs(ny + 0.1) < 0.18) return U('#f4f0e6'); return B[clamp(Math.round(2.4 - nx * 1.2 - ny * 1.4 + (d < 0.25 ? 0.6 : 0)), 0, 4)]; });
    for (let y = 2; y < 11; y++) { V.put(pb, 6, y, U('#e8e4de')); V.put(pb, 7, y, U('#948e91')); }
    const F = V.P32(ok ? ['#1f854c', '#86e36f'] : ['#c09020', '#f5dc5a']);
    for (let y = 2; y < 6; y++) for (let x = 8; x < 12 - (y === 5 ? 1 : 0); x++) V.put(pb, x, y, F[y === 2 ? 1 : 0]);
    V.put(pb, 6, 1, U('#ffffff'));
    BUOY[key] = pb.toCanvas(); return BUOY[key];
  }
  function drawBuoy(g, P, ok, t) {
    const bob = Math.round(Math.sin(t * 2.2 + P.x * 0.1) * 1);
    // sombra y anillos de oleaje (sin tramado: bandas translúcidas)
    g.globalAlpha = 0.35; g.fillStyle = '#03203a'; g.fillRect(P.x - 4, P.y + 4, 11, 2); g.fillRect(P.x - 2, P.y + 6, 7, 1);
    const u = (t * 0.7 + P.x * 0.01) % 1, rr = Math.round(5 + u * 9);
    g.globalAlpha = 0.6 * (1 - u); g.fillStyle = '#e6f8fc';
    g.fillRect(P.x - rr, P.y + 3, Math.round(rr * 0.6), 1); g.fillRect(P.x + Math.round(rr * 0.4), P.y + 3, Math.round(rr * 0.6), 1);
    g.fillRect(P.x - Math.round(rr * 0.5), P.y + 3 - Math.round(rr * 0.35), rr, 1); g.fillRect(P.x - Math.round(rr * 0.5), P.y + 3 + Math.round(rr * 0.35), rr, 1);
    g.globalAlpha = 1;
    g.drawImage(buoySpr(ok), P.x - 6, P.y - 13 + bob);
    // luz del mástil
    if (Math.floor(t * 2 + P.x) % 2) { g.fillStyle = ok ? '#d4ffc0' : '#fff2a0'; g.fillRect(P.x, P.y - 12 + bob, 1, 1); }
  }
  /* dron cuadricóptero visto desde arriba (rotores con desenfoque en 2 cuadros) */
  let DR = null;
  function droneStrip() {
    if (DR) return DR;
    DR = V.strip(2, 23, 17, (pb, f) => {
      const S = V.P32(['#141820', '#262c48', '#3a405d', '#8f8f95', '#d3ccc5', '#f2efea']);
      const cx = 11, cy = 8;
      // brazos en X
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) for (let q = 2; q <= 7; q++) { V.put(pb, cx + dx * q, cy + Math.round(dy * q * 0.6), S[2]); V.put(pb, cx + dx * q, cy + Math.round(dy * q * 0.6) + 1, S[1]); }
      // rotores: discos translúcidos con pala marcada
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const rx = cx + dx * 7, ry = cy + Math.round(dy * 4.2);
        V.ellipse(pb, rx, ry, 4, 2.6, (nx, ny, d) => ((Math.round(Math.atan2(ny, nx) * 2 + f * 1.6) % 2 === 0) && d > 0.2) ? (0x99e8f0f8 >>> 0) : (0x55cfe8ee >>> 0));
        V.put(pb, rx, ry, S[0]); V.put(pb, rx - 3 + f * 2, ry, U('#f4fbff')); V.put(pb, rx + 3 - f * 2, ry, U('#f4fbff'));
      }
      // cuerpo: carcasa blanca con franjas naranjas y cámara/sonda
      V.ellipse(pb, cx + 0.5, cy + 0.5, 4.5, 3.5, (nx, ny, d) => {
        if (Math.abs(nx) < 0.22) return U('#ff8e34');
        return S[clamp(Math.round(4.6 - nx * 1.2 - ny * 1.4 - (d > 0.75 ? 1.2 : 0)), 1, 5)];
      });
      V.put(pb, cx, cy - 3, U('#17f3f7')); V.put(pb, cx + 1, cy - 3, U('#9ff6f8'));
      V.put(pb, cx - 4, cy + 3, U('#e83b41')); V.put(pb, cx + 5, cy + 3, U('#3fe0a0'));
    });
    return DR;
  }
  function drawDrone(g, x, y, t, sampling) {
    const S = droneStrip(), bob = Math.round(Math.sin(t * 6) * 1);
    x = Math.round(x); y = Math.round(y);
    // sombra proyectada sobre el agua (silueta translúcida desplazada)
    g.globalAlpha = 0.3; g.fillStyle = '#021428';
    g.fillRect(x - 6, y + 12, 13, 3); g.fillRect(x - 9, y + 11, 3, 2); g.fillRect(x + 7, y + 11, 3, 2); g.fillRect(x - 9, y + 15, 3, 2); g.fillRect(x + 7, y + 15, 3, 2);
    g.globalAlpha = 1;
    V.drawStrip(g, S, Math.floor(t * 24) % 2, x - 11, y - 10 + bob);
    // luces de navegación
    if (Math.floor(t * 3) % 2) { g.fillStyle = '#ff5a5a'; g.fillRect(x - 7, y - 5 + bob, 1, 1); }
    if (sampling) {
      // sonda que baja al agua con anillos de contacto
      g.fillStyle = '#a6f4ff'; for (let i = 0; i < 10; i++) if ((i + Math.floor(t * 12)) % 3) g.fillRect(x, y + 1 + i, 1, 1);
      const u = (t * 1.5) % 1; g.globalAlpha = 0.8 * (1 - u); g.fillStyle = '#e6fdff';
      const rr = Math.round(2 + u * 8); g.fillRect(x - rr, y + 12, rr * 2 + 1, 1); g.globalAlpha = 1;
    }
  }
  return { map, drawSea, drawPlume, drawBuoy, drawDrone, depth, SHORE };
})();
