/* =====================================================================
   18l_pf_civic.js — Piezas cívicas y demostrativas del plano jugable
   (kit PF, rollout A): pabellón-aula, escenario con torres de truss y
   pantalla, quiosco de música, pérgola FV, contenedor de baterías,
   tanque de vidrio, bancal con cultivos y goteo, electrolizador en
   patín, tanque de H₂, núcleo de SYNARA, aerogenerador decorativo.
   Escala de personaje ≈ 74 px (puertas ≥ 84 px, techos ≥ 110 px).
   API (PFCivic): pavilion · stage · bandstand · pergolaPV · bess ·
     glassTank · raisedBed · crop · electrolyzer · h2Bullet · core ·
     miniTurbine · truss · speaker · screenFrame
   Cada función devuelve anclas para lo dinámico (pantallas, LED, halos).
   ===================================================================== */
const PFCivic = (() => {
  const put = PFK.put, P32 = PFK.P32, A = PFArch, box = (...a) => PFInfra.box3q(...a);
  const S = () => P32(PFInfra.STEEL);
  const TEAL = ['#06302e', '#0b4e4a', '#127a70', '#1aa894', '#4ccdb8', '#9cecdc', '#d8fff4'];
  const NAVY = ['#050a1a', '#0a1430', '#122048', '#1c3264', '#2a4a86', '#3e66a8'];
  const BLUEC = ['#0a1a3a', '#122c5a', '#1c4282', '#2c63c0', '#4a86dc', '#8ab8f0', '#d0e4fc'];
  const H2W = ['#3a4256', '#56607a', '#76809a', '#98a2b8', '#bcc4d4', '#dce2ec', '#f0f4f8', '#ffffff'];
  const H2G = ['#06301e', '#0c4a2e', '#146a40', '#1f8a52', '#2fae68', '#46cc82', '#74e6aa', '#b4f6d2'];
  const PV = ['#16214a', '#1e2a55', '#2a3a6c', '#344675', '#3f5590', '#4f6391', '#6a7aa4', '#8b9cc2', '#b7c7e7'];

  /* ---------- truss de aluminio (torre vertical o viga) ---------- */
  function truss(pb, x, y0, y1, w = 8, horiz = false) {
    const s = S();
    if (!horiz) {
      for (let yy = y0; yy < y1; yy++) { put(pb, x, yy, s[6]); put(pb, x + 1, yy, s[3]); put(pb, x + w - 1, yy, s[4]); put(pb, x + w, yy, s[2]); }
      for (let yy = y0; yy < y1 - w; yy += w) { PFK.lineFn(pb, x + 1, yy, x + w - 1, yy + w, () => s[4]); PFK.lineFn(pb, x + w - 1, yy, x + 1, yy + w, () => s[2]); for (let k = 0; k <= w; k++) put(pb, x + k, yy, s[5]); }
    } else {
      // viga horizontal entre x (=x0) y y0 (=x1) a la altura y1
      const xa = x, xb = y0, yy = y1;
      for (let xx = xa; xx < xb; xx++) { put(pb, xx, yy, s[6]); put(pb, xx, yy + 1, s[3]); put(pb, xx, yy + w - 1, s[4]); put(pb, xx, yy + w, s[1]); }
      for (let xx = xa; xx < xb - w; xx += w) { PFK.lineFn(pb, xx, yy + 1, xx + w, yy + w - 1, () => s[4]); PFK.lineFn(pb, xx, yy + w - 1, xx + w, yy + 1, () => s[2]); }
    }
  }
  /** Altavoz de pie (caja negra con conos) */
  function speaker(pb, x, y, w = 16, h = 26) {
    box(pb, x, y, w, h, 6, { ramp: ['#08080c', '#121218', '#1c1c24', '#2a2a34', '#3a3a46', '#56566a'], skew: 0.5 });
    for (const [cy, r] of [[y - h + 7, 4], [y - 9, 5.5]]) PFK.ellipseFn(pb, x + w / 2, cy, r, r, (nx, ny, d) => d > 0.75 ? U('#5a5a6a') : d < 0.15 ? U('#8a8a9a') : U(nx + ny < 0 ? '#2a2a34' : '#0e0e14'));
  }
  /** Marco de pantalla LED (el contenido se pinta por cuadro) */
  function screenFrame(pb, x, y, w, h) {
    const s = S();
    for (let yy = y - 3; yy < y + h + 3; yy++) for (let xx = x - 3; xx < x + w + 3; xx++) { const edge = yy < y || yy >= y + h || xx < x || xx >= x + w; if (edge) put(pb, xx, yy, U(yy === y - 3 ? '#5a5a6a' : xx === x - 3 ? '#4a4a58' : '#16161e')); else put(pb, xx, yy, U('#060a18')); }
    for (let xx = x - 3; xx < x + w + 3; xx++) put(pb, xx, y + h + 3, U('#08080c'));
    return { x, y, w, h };
  }

  /* ---------- pabellón-aula al aire libre ---------- */
  function pavilion(pb, x, y, w, o = {}) {
    const h = o.h ?? 122, d = 18, dx = 9, s = S(), Wh = P32(A.WHITE), T = P32(TEAL), Wd = P32(A.WOOD);
    A.castShadow(pb, x + 10, y, w, 16, -0.2);
    // tarima de piedra
    box(pb, x - 4, y + 1, w + 8, 4, d + 2, { ramp: PFGround.KERB, skew: 0.5 });
    // muro bajo trasero con pizarra
    box(pb, x + 6 + dx, y - d + 2, w - 12, 30, 4, { ramp: A.CREAM, skew: 0.5 });
    const bx = x + 30 + dx, by = y - d - 76;
    for (let yy = by; yy < by + 46; yy++) for (let xx = bx; xx < bx + 92; xx++) { const e = yy < by + 3 || yy > by + 42 || xx < bx + 3 || xx > bx + 88; put(pb, xx, yy, e ? Wd[yy < by + 3 ? 5 : 3] : U(PFK.cl(xx, yy, 3, 7) < 0.15 ? '#24503e' : '#1c4434')); }
    // el nexo dibujado con tiza
    const ch = U('#e6f4ea'), cy = U('#56e5ff'), cyl = U('#ffe14d'), cg = U('#86e36f');
    const nodes = [[bx + 14, by + 16], [bx + 34, by + 16], [bx + 54, by + 16], [bx + 74, by + 10], [bx + 74, by + 24], [bx + 34, by + 33], [bx + 54, by + 33]];
    for (const [nx, ny] of nodes) PFK.ellipseFn(pb, nx, ny, 5, 3.2, (a, b, dd) => dd > 0.55 ? ch : 0);
    PFK.lineFn(pb, bx + 19, by + 16, bx + 29, by + 16, () => cy); PFK.lineFn(pb, bx + 39, by + 16, bx + 49, by + 16, () => cy);
    PFK.lineFn(pb, bx + 59, by + 15, bx + 69, by + 11, () => cy); PFK.lineFn(pb, bx + 59, by + 17, bx + 69, by + 23, () => cg);
    PFK.lineFn(pb, bx + 34, by + 29, bx + 34, by + 20, () => cyl); PFK.lineFn(pb, bx + 54, by + 29, bx + 54, by + 20, () => cyl);
    PFK.text(pb, 'NEXO', bx + 6, by + 37, ch, { font: 'tiny' });
    PFK.text(pb, 'H2O+E', bx + 62, by + 37, U('#ffe14d'), { font: 'tiny' });
    // columnas (2 traseras, 2 delanteras) blancas con capitel turquesa
    const col = (cx, base, hh, back) => {
      for (let yy = base - hh; yy < base; yy++) for (let k = 0; k < 10; k++) put(pb, cx + k, yy, Wh[clamp([4, 6, 7, 7, 6, 5, 5, 4, 3, 2][k] - back - ((yy - base) % 4 === 0 && k > 1 && k < 8 ? 0 : 0), 0, 7)]);
      for (let k = 2; k < 8; k += 3) for (let yy = base - hh + 6; yy < base - 8; yy++) put(pb, cx + k, yy, Wh[clamp(4 - back, 0, 7)]); // estrías
      for (let k = -2; k < 12; k++) { put(pb, cx + k, base - hh, T[5]); put(pb, cx + k, base - hh + 1, T[4]); put(pb, cx + k, base - hh + 2, T[3]); put(pb, cx + k, base - hh + 3, T[1]); for (let q = 1; q < 6; q++) put(pb, cx + k, base - q, Wh[clamp((q === 5 ? 6 : 3) - back - (k > 8 ? 1 : 0), 0, 7)]); }
    };
    col(x + 6 + dx, y - d, h - d, 2); col(x + w - 14 + dx, y - d, h - d, 2);
    // mesas de trabajo con prototipos y taburetes (dentro del pabellón)
    for (const tx of [x + 22, x + w - 74]) {
      box(pb, tx, y - 4, 50, 30, 9, { ramp: A.WOOD, skew: 0.5, front: (xx, yy, u, v) => { const ly = yy - (y - 34); if (ly < 3) return Wd[ly === 0 ? 7 : 5]; return (xx - tx) % 24 < 3 ? Wd[3] : U('#2a3a50'); }, top: (xx, yy, u, v) => Wd[6 - Math.round(v)] });
    }
    // prototipos sobre las mesas
    const t1 = x + 22, t2 = x + w - 74, ty = y - 37;
    PFInfra.cylV(pb, t1 + 10, ty, 5, 14, { ramp: ['#04263c', '#07507a', '#0a7fae', '#11bedd', '#3adcf1', '#9cf0f8', '#e6fdff', '#ffffff'], bands: [{ y: 3, h: 1 }], ell: 0.4 }); // módulo de membrana
    PFInfra.pvPanel(pb, t1 + 20, ty - 2, 14, 5);
    for (let yy = ty - 12; yy < ty; yy++) for (let xx = t1 + 38; xx < t1 + 48; xx++) put(pb, xx, yy, yy === ty - 12 ? U('#d3ccc5') : U(yy < ty - 9 ? '#56e5ff' : '#1c3264')); // portátil con gráfica
    PFFlora.bush(pb, t2 + 8, ty, 12, 10, RAMP.foliageR, 33); A.pots(pb, t2 + 1, ty + 1, 1, 34);
    PFInfra.cylV(pb, t2 + 26, ty, 4, 10, { ramp: H2W, band: H2G, bands: [{ y: 4, h: 2 }], ell: 0.4 });
    for (let k = 0; k < 3; k++) { const fx = t2 + 36 + k * 4; for (let yy = ty - 8; yy < ty; yy++) put(pb, fx, yy, U(yy < ty - 5 ? '#e8e0d0' : ['#56e5ff', '#86e36f', '#ff9f43'][k])); }
    for (const sx of [x + 30, x + 56, x + w - 66, x + w - 40]) { for (let yy = y - 18; yy < y; yy++) { put(pb, sx, yy, P32(A.IRON)[3]); put(pb, sx + 6, yy, P32(A.IRON)[1]); } PFK.ellipseFn(pb, sx + 3, y - 19, 5, 1.6, () => Wd[5]); }
    // columnas delanteras
    col(x, y, h, 0); col(x + w - 10, y, h, 0);
    // losa de cubierta: canto turquesa con lunares amarillos y cara superior con módulos FV
    const ry = y - h;
    box(pb, x - 8, ry, w + 16, 10, d + 4, {
      ramp: TEAL, skew: 0.5,
      front: (xx, yy, u, v) => { const ly = yy - (ry - 10); if (ly === 0) return T[6]; if (ly === 9) return T[1]; if (ly === 5 && (xx - x) % 10 === 5) return U('#ffe14d'); return T[ly < 3 ? 4 : 3]; },
      top: (xx, yy, u, v) => s[4],
    });
    for (let rr = 0; rr < 3; rr++) PFInfra.pvPanel(pb, x - 4 + rr * 6 + 2, ry - 12 - rr * 5, w + 6, 4);
    // canalón con cadena de lluvia
    for (let yy = ry; yy < y - 6; yy += 3) { put(pb, x + w + 6, yy, U('#c89020')); put(pb, x + w + 7, yy + 1, U('#7a5a10')); }
    return { boardX: bx, boardY: by, roofY: ry };
  }

  /* ---------- escenario del festival ---------- */
  function stage(pb, x0, x1, top, ground, o = {}) {
    const w = x1 - x0, d = 12, Wd = P32(A.WOOD), N = P32(NAVY);
    A.castShadow(pb, x0 + 10, ground, w, 14, -0.22);
    // telón de fondo bajo (detrás del suelo del escenario)
    const bk = top - d, bh = 64;
    for (let yy = bk - bh; yy < bk; yy++) for (let xx = x0 + 10 + 6; xx < x1 - 10 + 6; xx++) {
      const fold = (xx - x0) % 12, k = fold < 2 ? 1 : fold < 6 ? 3 : fold < 9 ? 2 : 1;
      put(pb, xx, yy, yy < bk - bh + 4 ? U('#e8c040') : N[clamp(k + (yy > bk - 8 ? -1 : 0), 0, 5)]);
    }
    // gota de agua estampada en el telón
    PFK.ellipseFn(pb, x0 + 40 + 6, bk - 30, 9, 11, (nx, ny) => (ny < -0.3 && Math.abs(nx) > 0.5 + ny * 0.6) ? 0 : U(nx + ny < -0.3 ? '#9cecdc' : '#1aa894'));
    // suelo del escenario (cara superior) + faldón frontal
    box(pb, x0, ground, w, ground - top, d, {
      ramp: A.WOOD, skew: 0.5,
      front: (xx, yy, u, v) => { const ly = yy - top; if (ly < 2) return Wd[ly === 0 ? 7 : 5]; if (ly === 2) return Wd[1]; const sc = (xx - x0) % 16, dep = 6 - Math.round(Math.abs(sc - 7.5) * 0.6); if (ly < 3 + dep) return U(((xx - x0) >> 4) % 2 ? '#ff6b6b' : '#ffe14d'); return N[clamp(2 + ((xx - x0) % 8 === 0 ? -1 : 0) - (ly > 14 ? 1 : 0), 0, 5)]; },
      top: (xx, yy, u, v) => Wd[(xx - x0) % 9 === 0 ? 3 : 6 - Math.round(v * 2)],
      side: (xx, yy) => N[1],
    });
    // escalera lateral izquierda
    for (let k = 0; k < 3; k++) box(pb, x0 - 16 + k * 5, ground, 8, Math.round((ground - top) * (k + 1) / 4), 8, { ramp: A.WOOD, skew: 0.5 });
    // torres de truss y viga superior
    const tt = top - (o.trussH ?? 132);
    truss(pb, x0 + 2, tt, top - 1, 8); truss(pb, x1 - 10, tt, top - 1, 8);
    truss(pb, x0 + 2, x1 - 2, tt, 8, true);
    // banderines entre las torres y bajo la viga
    A.bunting(pb, x0 + 10, tt + 10, x1 - 10, tt + 10, 14, { step: 9, size: 6 });
    // cabezas móviles sobre las torres
    for (const hx of [x0 + 6, x1 - 6]) { for (let yy = tt - 8; yy < tt; yy++) for (let q = -4; q <= 4; q++) put(pb, hx + q, yy, U(Math.abs(q) === 4 || yy === tt - 8 ? '#16161e' : yy < tt - 4 ? '#3a3a46' : '#2a2a34')); put(pb, hx, tt - 4, U('#fff6c8')); }
    // focos colgados de la viga (los halos se animan)
    const spots = [];
    for (let k = 0; k < 7; k++) {
      const fx = x0 + 22 + k * Math.round((w - 44) / 6), fy = tt + 10;
      for (let yy = fy; yy < fy + 4; yy++) put(pb, fx, yy, S()[2]);
      for (let yy = fy + 4; yy < fy + 10; yy++) for (let q = -3; q <= 3; q++) put(pb, fx + q, yy, U(Math.abs(q) === 3 ? '#16161e' : yy > fy + 7 ? ['#ffe14d', '#20d6c7', '#ff6b6b', '#8d6bff'][k % 4] : '#2a2a34'));
      spots.push([fx, fy + 10, ['#ffe14d', '#20d6c7', '#ff6b6b', '#8d6bff'][k % 4]]);
    }
    // pancarta del festival colgada de la viga
    const txt = o.banner || 'FESTIVAL DEL PRIMER AGUA', tw = PFK.measure(txt, { font: 'tiny', bold: true }) + 14, bxx = x0 + Math.round((w - tw) / 2) - 26, byy = tt + 22;
    for (let yy = byy; yy < byy + 13; yy++) for (let xx = bxx; xx < bxx + tw; xx++) { const e = yy === byy || yy === byy + 12 || xx === bxx || xx === bxx + tw - 1; put(pb, xx, yy, e ? U('#e8c040') : U(yy < byy + 3 ? '#c83a4a' : '#a82a3a')); }
    for (const sx of [bxx + 4, bxx + tw - 5]) for (let yy = tt + 8; yy < byy; yy++) put(pb, sx, yy, U('#2a2420'));
    PFK.text(pb, txt, bxx + 7, byy + 4, U('#fff4d8'), { font: 'tiny', bold: true, shadow: U('#4a0a14') });
    // altavoces sobre el escenario
    speaker(pb, x0 + 14, top - 2, 16, 30); speaker(pb, x1 - 30, top - 2, 16, 30);
    speaker(pb, x0 + 14, top - 32, 16, 18); speaker(pb, x1 - 30, top - 32, 16, 18);
    // monitores de cuña y pie de micrófono en el centro
    for (const mx of [x0 + 60, x0 + 150]) PFK.polyFill(pb, [[mx, top - 2], [mx + 14, top - 2], [mx + 12, top - 9], [mx + 3, top - 7]], (xx, yy) => U(yy < top - 6 ? '#3a3a46' : '#16161e'));
    for (let yy = top - 38; yy < top - 2; yy++) put(pb, x0 + 100, yy, S()[3]);
    PFK.lineFn(pb, x0 + 100, top - 38, x0 + 106, top - 42, () => S()[4]); put(pb, x0 + 107, top - 43, U('#2a2a34')); put(pb, x0 + 108, top - 43, U('#5a5a6a'));
    for (let k = -4; k <= 4; k++) put(pb, x0 + 100 + k, top - 2, S()[2]);
    // pantalla de SYNARA (marco) sobre patas
    const scr = o.screen || { x: x0 + 118, y: top - 92, w: 72, h: 44 };
    for (const lx of [scr.x + 8, scr.x + scr.w - 10]) for (let yy = scr.y + scr.h + 3; yy < top - 2; yy++) { put(pb, lx, yy, S()[4]); put(pb, lx + 1, yy, S()[1]); }
    screenFrame(pb, scr.x, scr.y, scr.w, scr.h);
    // cables por el suelo del escenario
    for (let xx = x0 + 30; xx < x1 - 30; xx++) if (hash2(xx, 3, 9) < 0.7) put(pb, xx, top - 4 + Math.round(Math.sin(xx * 0.05) * 1.5), U('#14141c'));
    return { spots, screen: scr, trussTop: tt };
  }

  /* ---------- quiosco de música sobre una tarima (plataforma de un solo sentido) ---------- */
  function bandstand(pb, x, y, w, ground, o = {}) {
    const Wd = P32(A.WOOD), I = P32(A.IRON), c1 = U(o.c1 || '#20d6c7'), cw = U('#fff4e4');
    A.castShadow(pb, x + 6, ground, w, 10, -0.2);
    // pilares de la tarima y riostras
    for (const px of [x + 2, x + w - 5, x + Math.round(w / 2) - 1]) for (let yy = y + 4; yy < ground; yy++) { put(pb, px, yy, Wd[5]); put(pb, px + 1, yy, Wd[3]); put(pb, px + 2, yy, Wd[1]); }
    PFK.lineFn(pb, x + 4, y + 6, x + Math.round(w / 2) - 1, ground - 4, () => Wd[2]); PFK.lineFn(pb, x + w - 5, y + 6, x + Math.round(w / 2) + 2, ground - 4, () => Wd[2]);
    // columnas del templete y cubierta a rayas
    const rt = y - 96;
    for (const px of [x + 3, x + w - 6]) for (let yy = rt; yy < y; yy++) { put(pb, px, yy, I[4]); put(pb, px + 1, yy, I[3]); put(pb, px + 2, yy, I[1]); }
    PFK.polyFill(pb, [[x - 8, rt + 6], [x + w + 8, rt + 6], [x + w / 2 + 6, rt - 22], [x + w / 2 - 4, rt - 22]], (xx, yy) => { const st = Math.floor((xx - x - w / 2 + 200 + (rt - yy) * 0.2) / 7) % 2; let c = st ? c1 : cw; if (xx > x + w / 2 + 4) c = PFK.shU(c, -0.14); return c; });
    for (let xx = x - 8; xx < x + w + 8; xx++) { const sc = (xx - x + 200) % 8, dep = 5 - Math.round(Math.abs(sc - 3.5) * 0.7); for (let k = 0; k < dep; k++) put(pb, xx, rt + 6 + k, ((xx - x + 200) >> 3) % 2 ? PFK.shU(c1, k > 2 ? -0.25 : 0) : PFK.shU(cw, k > 2 ? -0.2 : 0)); }
    put(pb, x + w / 2 + 1, rt - 23, U('#ffd84a')); put(pb, x + w / 2 + 1, rt - 24, U('#ffd84a'));
    // instrumentos: tambor y guitarra apoyada (atrás, sobre la tarima)
    PFInfra.cylV(pb, x + w - 18, y - 6, 6, 10, { ramp: ['#3a0a14', '#6a1424', '#a82a3a', '#d8485a', '#f0808a', '#ffd0d4', '#ffffff', '#ffffff'], band: ['#4a3a10', '#8a6a20', '#c8a040', '#f0d060', '#fff0a0', '#ffffff'], bands: [{ y: 1, h: 1 }, { y: 9, h: 1 }], ell: 0.4 });
    PFK.lineFn(pb, x + 12, y - 6, x + 16, y - 30, () => Wd[2], 2);
    PFK.ellipseFn(pb, x + 11, y - 9, 4, 5, (nx, ny, d) => d < 0.2 ? U('#1a0a04') : U(nx < 0 ? '#e0a050' : '#a86a28'));
    return { roofY: rt };
  }

  /* ---------- pérgola FV con bancos ---------- */
  function pergolaPV(pb, x, y, w, o = {}) {
    const h = o.h ?? 106, s = S(), d = 16;
    A.castShadow(pb, x + 8, y, w + 6, 18, -0.24);
    // postes traseros
    for (const px of [x + 8, x + w - 2]) for (let yy = y - d - h + 10; yy < y - d; yy++) { put(pb, px, yy, s[5]); put(pb, px + 1, yy, s[3]); put(pb, px + 2, yy, s[1]); }
    // bancos bajo la pérgola y punto de carga
    A.bench(pb, x + 12, y - 6, 30); A.bench(pb, x + w - 44, y - 6, 30);
    box(pb, x + Math.round(w / 2) - 5, y - 4, 10, 30, 5, { ramp: ['#1a2230', '#2a3a50', '#3e5878', '#5a7aa0', '#86a4c8', '#bcd2ea'], skew: 0.5 });
    for (let k = 0; k < 4; k++) put(pb, x + Math.round(w / 2) - 3 + k * 2, y - 26, U(['#3fe0a0', '#3fe0a0', '#ffd84a', '#56e5ff'][k]));
    // postes delanteros
    for (const px of [x, x + w - 8]) for (let yy = y - h; yy < y; yy++) { put(pb, px, yy, s[6]); put(pb, px + 1, yy, s[4]); put(pb, px + 2, yy, s[2]); }
    // vigas y paneles FV inclinados hacia el sol (cara superior visible)
    for (let xx = x - 6; xx < x + w + 8; xx++) { put(pb, xx, y - h, s[6]); put(pb, xx, y - h + 1, s[3]); put(pb, xx, y - h + 2, s[1]); }
    const Pv = P32(PV);
    const ph = 22, pw = w + 14;
    for (let r = 0; r < ph; r++) for (let k = 0; k < pw; k++) {
      const xx = x - 6 + k + Math.round(r * 0.45), yy = y - h - 1 - r;
      const cellX = k % 9, cellY = r % 6;
      let c;
      if (cellX === 0 || cellY === 0) c = U('#c8d0e0');
      else { let kk = 2 + Math.round((k / pw) * 1.5 + (r / ph) * 2.5); if ((k + r * 2) % 37 < 3) kk += 3; c = Pv[clamp(kk, 0, 8)]; }
      if (r === ph - 1 || k === 0 || k === pw - 1) c = U('#e8ecf4');
      put(pb, xx, yy, c);
    }
    for (let k = 0; k < pw; k++) { put(pb, x - 6 + k, y - h, U('#2a2e3a')); }
    return { cells: [x, y - h - ph, pw, ph] };
  }

  /* ---------- contenedor de baterías (BESS) ---------- */
  function bess(pb, x, y, w = 72, h = 40, o = {}) {
    const R = o.ramp || BLUEC, B = P32(R), d = 14;
    A.castShadow(pb, x + 6, y, w, 16, -0.26);
    box(pb, x - 3, y + 1, w + 6, 4, d + 2, { ramp: PFTerrain.CONC, skew: 0.5 });
    box(pb, x, y - 3, w, h, d, {
      ramp: R, skew: 0.5,
      front: (xx, yy, u, v) => { const lx = xx - x, ly = yy - (y - 3 - h); if (ly < 2) return B[6]; if (ly > h - 3) return B[1]; if (lx % 4 === 0) return B[2]; if (lx % 4 === 1) return B[4]; return B[3 - (u > 0.94 ? 1 : 0)]; },
      top: (xx, yy, u, v) => B[(xx - x) % 6 === 0 ? 3 : 5 - Math.round(v)],
      side: (xx, yy) => B[(yy % 4 === 0) ? 0 : 1],
    });
    // puertas dobles con manillas, rótulo y rombos de seguridad
    const dx0 = x + 6;
    for (let yy = y - 3 - h + 5; yy < y - 5; yy++) { put(pb, dx0 + 15, yy, B[0]); put(pb, dx0 + 31, yy, B[0]); }
    for (const hx of [dx0 + 13, dx0 + 18]) for (let yy = y - 26; yy < y - 18; yy++) put(pb, hx, yy, U('#d3ccc5'));
    for (let yy = y - 3 - h + 8; yy < y - 3 - h + 15; yy++) for (let xx = x + w - 30; xx < x + w - 6; xx++) put(pb, xx, yy, U(yy === y - 3 - h + 8 ? '#ffffff' : '#e8f0f8'));
    PFK.text(pb, 'BESS', x + w - 26, y - 3 - h + 9, U('#1c4282'), { font: 'tiny', bold: true });
    for (const [cx, col] of [[x + w - 22, '#ffd84a'], [x + w - 12, '#ff5a4a']]) for (let yy = 0; yy < 7; yy++) for (let xx = 0; xx < 7; xx++) if (Math.abs(xx - 3) + Math.abs(yy - 3) <= 3) put(pb, cx + xx, y - 22 + yy, U(Math.abs(xx - 3) + Math.abs(yy - 3) === 3 ? '#2a282e' : col));
    // equipo de clima en el lateral
    box(pb, x + w + 6, y - 3, 10, 22, 5, { ramp: PFInfra.STEEL, skew: 0.5 });
    for (let yy = y - 22; yy < y - 6; yy += 2) for (let xx = x + w + 7; xx < x + w + 15; xx++) put(pb, xx, yy, U('#4f4d51'));
    return { soc: [x + 8, y - 3 - h - 6, w - 16], leds: [[x + 10, y - 10], [x + 13, y - 10], [x + 16, y - 10]] };
  }

  /* ---------- tanque de vidrio del Primer Agua (el agua es dinámica) ---------- */
  function glassTank(pb, x, y, w = 54, h = 84, o = {}) {
    const s = S(), d = 10;
    A.castShadow(pb, x + 6, y, w, 14, -0.22);
    box(pb, x - 4, y, w + 8, 8, d + 4, { ramp: PFTerrain.CONC, skew: 0.5 });
    const y0 = y - 8 - h, y1 = y - 8;
    // fondo del tanque (pared trasera vista a través del vidrio)
    for (let yy = y0 + 4; yy < y1; yy++) for (let xx = x + 3; xx < x + w - 3; xx++) put(pb, xx, yy, U(PFK.cl(xx, yy, 3, 4) < 0.1 ? '#a8d8e4' : '#bfe6ee'));
    // escala graduada
    for (let k = 0; k <= 8; k++) { const yy = y1 - Math.round(k * (h - 8) / 8); for (let q = 0; q < (k % 2 ? 3 : 6); q++) put(pb, x + w - 6 - q, yy, U('#2a4a6a')); }
    // marco de acero: aros, montantes y tapa en 3/4
    for (let xx = x; xx < x + w; xx++) for (const [yy, k] of [[y0, 7], [y0 + 1, 5], [y0 + 2, 3], [y1 - 2, 6], [y1 - 1, 4], [y1, 2]]) put(pb, xx, yy, s[k]);
    for (const px of [x, x + w - 3, x + Math.round(w / 2) - 1]) for (let yy = y0; yy <= y1; yy++) { put(pb, px, yy, s[6]); put(pb, px + 1, yy, s[4]); put(pb, px + 2, yy, s[2]); }
    for (let r = 0; r < d; r++) { const off = Math.round(r * 0.5); for (let xx = x + off; xx < x + w + off; xx++) put(pb, xx, y0 - 1 - r, s[r === d - 1 ? 3 : 5 - Math.round(r / d)]); }
    // escalerilla, válvulas, rótulo
    for (let yy = y0 - 6; yy < y1; yy++) { put(pb, x + w + 2, yy, s[3]); put(pb, x + w + 6, yy, s[2]); if (yy % 4 === 0) for (let k = 3; k < 6; k++) put(pb, x + w + k, yy, s[4]); }
    PFInfra.valve(pb, x - 6, y1 - 6); PFInfra.valve(pb, x + w + 12, y1 - 6, { wheel: ['#06302e', '#127a70', '#1aa894', '#9cecdc'] });
    return { inner: [x + 3, y0 + 3, w - 6, h - 4], y0, y1 };
  }

  /* ---------- bancal elevado con cultivos ---------- */
  function crop(pb, x, y, kind, seed = 1) {
    const r = RNG(seed), G = P32(RAMP.foliageR);
    if (kind === 'maiz') {
      const h = 30 + r.int(0, 10);
      for (let yy = y - h; yy < y; yy++) { put(pb, x, yy, G[4]); put(pb, x + 1, yy, G[3]); }
      for (let k = 0; k < 4; k++) { const ly = y - 6 - k * 7, dir = k % 2 ? 1 : -1; PFK.lineFn(pb, x, ly, x + dir * 9, ly - 4 + (k % 3), (t) => G[t < 0.5 ? 5 : 4], 1); PFK.lineFn(pb, x, ly + 1, x + dir * 8, ly - 2, () => G[2]); }
      for (let k = 0; k < 4; k++) put(pb, x + (k % 2), y - h - 1 - k, U('#e8c860'));
      put(pb, x + 2, y - 16, U('#f0d870')); put(pb, x + 2, y - 15, U('#d8b040')); put(pb, x + 2, y - 14, U('#c8a030'));
    } else if (kind === 'frijol') {
      for (let yy = y - 24; yy < y; yy++) put(pb, x, yy, U('#8a6a40'));
      for (let k = 0; k < 9; k++) PFFlora.leaf(pb, x + (k % 2 ? 1 : -1), y - 3 - k * 2.5, k % 2 ? -0.4 : Math.PI + 0.4, 4, 3, G, 4);
      for (let k = 0; k < 3; k++) put(pb, x + 2, y - 8 - k * 6, U('#f0e0f8'));
    } else if (kind === 'ahuyama') {
      for (let k = 0; k < 5; k++) PFFlora.leaf(pb, x + k * 3 - 6, y - 2, -Math.PI / 2 + (k - 2) * 0.5, 7, 6, G, 4);
      PFArch.blob(pb, x + 4, y - 3, 4, '#f08a20'); PFArch.blob(pb, x - 5, y - 2, 3, '#e8a030');
    } else if (kind === 'tomate' || kind === 'aji') {
      for (let yy = y - 20; yy < y; yy++) put(pb, x, yy, U('#a88a5a'));
      PFFlora.cluster(pb, x, y - 11, 6, 9, RAMP.foliageR, seed, { density: 0.55, leaf: [3, 4] });
      for (let k = 0; k < 5; k++) PFArch.blob(pb, x - 3 + r.int(0, 6), y - 16 + r.int(0, 12), kind === 'aji' ? 1.2 : 1.8, kind === 'aji' ? r.pick(['#e8402e', '#ff8a2a']) : '#e8402e');
    } else PFFlora.bush(pb, x, y, 10, 9, RAMP.foliageR, seed);
  }
  function raisedBed(pb, x0, x1, y, o = {}) {
    const w = x1 - x0, d = 12, Wd = P32(A.WOOD);
    A.castShadow(pb, x0 + 4, y, w, 12, -0.2);
    box(pb, x0, y, w, 10, d, { ramp: A.WOOD, skew: 0.5, front: (xx, yy, u, v) => Wd[(xx - x0) % 20 === 0 ? 2 : (yy - y) % 5 === 0 ? 3 : 4], top: (xx, yy, u, v) => { const r = Math.round(v * d); return U(r % 4 === 0 ? '#3a2414' : r % 4 === 1 ? '#6a4628' : '#52341c'); } });
    // línea de goteo (la animación de gotas va aparte)
    for (let xx = x0 + 3; xx < x1 - 1; xx++) { put(pb, xx + 2, y - 14, U('#141418')); if ((xx - x0) % 10 === 4) put(pb, xx + 2, y - 13, U('#3a8ac8')); }
    const kinds = o.kinds || ['maiz', 'frijol', 'ahuyama', 'maiz', 'tomate', 'aji'];
    let i = 0;
    for (let xx = x0 + 6; xx < x1 - 4; xx += 10) crop(pb, xx + 3, y - 14, kinds[i++ % kinds.length], xx * 3 + 1);
    return { dripY: y - 13 };
  }

  /* ---------- electrolizador demostrativo en patín ---------- */
  function electrolyzer(pb, x, y, o = {}) {
    const s = S(), w = 74;
    A.castShadow(pb, x + 6, y, w, 16, -0.24);
    box(pb, x - 4, y, w + 8, 6, 16, { ramp: PFTerrain.CONC, skew: 0.5 });
    // rectificador (armario) atrás a la izquierda
    box(pb, x + 2, y - 6, 18, 40, 9, { ramp: ['#1a2230', '#2a3a50', '#3e5878', '#5a7aa0', '#86a4c8', '#bcd2ea'], skew: 0.5 });
    for (let yy = y - 40; yy < y - 12; yy += 3) for (let xx = x + 5; xx < x + 17; xx++) put(pb, xx, yy, U('#24324a'));
    for (let k = 0; k < 3; k++) put(pb, x + 6 + k * 3, y - 42, U(['#3fe0a0', '#ffd84a', '#56e5ff'][k]));
    // pila de celdas: placas alternas entre placas terminales con tirantes
    const sx = x + 22, sy = y - 8;
    box(pb, sx, sy, 30, 22, 10, { ramp: H2W, skew: 0.5, front: (xx, yy, u, v) => { const lx = xx - sx; if (lx < 3 || lx > 26) return P32(H2W)[lx < 3 ? 6 : 2]; return P32(H2G)[lx % 3 === 0 ? 2 : lx % 3 === 1 ? 5 : 4]; }, top: (xx, yy, u, v) => P32(H2G)[(xx - sx) % 3 === 0 ? 3 : 6] });
    for (const ty of [sy - 18, sy - 4]) for (let xx = sx - 2; xx < sx + 33; xx++) put(pb, xx, ty, U('#d3ccc5'));
    // separadores de gas H₂ (blanco-verde) y O₂ (blanco-rojo)
    PFInfra.cylV(pb, x + 60, y - 8, 6, 34, { ramp: H2W, band: H2G, bands: [{ y: 8, h: 3 }, { y: 26, h: 2 }], dome: 0.5, ell: 0.35 });
    PFInfra.cylV(pb, x + 74, y - 8, 4, 26, { ramp: H2W, band: ['#3a0a14', '#6a1424', '#a82a3a', '#d8485a', '#f0808a', '#ffd0d4'], bands: [{ y: 6, h: 2 }], dome: 0.5, ell: 0.35 });
    PFK.text(pb, 'H2', x + 56, y - 30, U('#0c4a2e'), { font: 'tiny', bold: true });
    PFK.text(pb, 'O2', x + 71, y - 24, U('#6a1424'), { font: 'tiny' });
    // tuberías: agua (azul) a la pila, H₂ (verde) y O₂ (rojo) a los separadores
    PFInfra.pipe(pb, [[sx + 14, sy - 26], [sx + 14, sy - 30], [x + 60, sy - 30], [x + 60, y - 40]], 1, 'product', { flange: 0 });
    PFInfra.pipe(pb, [[sx + 30, sy - 12], [x + 54, sy - 12]], 1, 'steel', { flange: 0 });
    for (let xx = sx + 31; xx < x + 54; xx++) put(pb, xx, sy - 12, U('#4cd48e'));
    for (let xx = sx + 31; xx < x + 70; xx++) put(pb, xx, sy - 6, U('#e8485a'));
    // rombo de inflamable
    for (let yy = 0; yy < 7; yy++) for (let xx = 0; xx < 7; xx++) if (Math.abs(xx - 3) + Math.abs(yy - 3) <= 3) put(pb, x + 8 + xx, y - 28 + yy, U(Math.abs(xx - 3) + Math.abs(yy - 3) === 3 ? '#2a282e' : '#ff5a4a'));
    return { cells: [sx + 3, sy - 20, 24, 18], led: [x + 6, y - 42], sepH2: [x + 60, y - 42], sepO2: [x + 74, y - 34] };
  }
  /** Tanque horizontal de H₂ sobre cunas */
  function h2Bullet(pb, x, y, len = 62, r = 10) {
    A.castShadow(pb, x + 4, y, len, 12, -0.22);
    for (const cx of [x + 12, x + len - 14]) box(pb, cx - 4, y, 9, 8, 6, { ramp: PFTerrain.CONC, skew: 0.5 });
    PFInfra.cylH(pb, x, x + len, y - 8 - r, r, { ramp: H2W, band: H2G, bands: [8, len - 11] });
    for (let xx = x + 18; xx < x + len - 16; xx++) { put(pb, xx, y - 8 - r + 2, U('#2fae68')); put(pb, xx, y - 8 - r + 3, U('#1f8a52')); }
    PFK.text(pb, 'H2', x + Math.round(len / 2) - 4, y - 8 - r - 3, U('#0c4a2e'), { font: 'tiny', bold: true });
    PFInfra.valve(pb, x + len - 6, y - 8 - 2 * r - 2, { wheel: ['#06301e', '#146a40', '#2fae68', '#b4f6d2'] });
  }

  /* ---------- núcleo de SYNARA (torre con puerta ≥ 84 px) ---------- */
  function core(pb, x, y, w, h, o = {}) {
    const Wh = P32(A.WHITE), T = P32(TEAL), d = 16;
    A.castShadow(pb, x + 8, y, w, 20, -0.26);
    // escalinata de acceso hasta el rellano (o.landing = y del rellano)
    const L = o.landing ?? y;
    if (L < y) for (let k = 0; k < 4; k++) box(pb, x - 22 + k * 6, y, 10, Math.round((y - L) * (k + 1) / 4), 8, { ramp: PFGround.KERB, skew: 0.5 });
    box(pb, x - 6, y, w + 12, y - L + 4, d + 4, { ramp: PFGround.KERB, skew: 0.5 });
    // cuerpo: fuste blanco ahusado con franjas turquesa y acristalamiento
    const top = L - 4 - h;
    box(pb, x, L - 4, w, h, d, {
      ramp: A.WHITE, skew: 0.5,
      front: (xx, yy, u, v) => {
        const ly = yy - top, lx = xx - x;
        if ((ly % 34) < 3) return T[ly % 34 === 0 ? 5 : 3];
        if (lx > w * 0.3 && lx < w * 0.7 && ly > 8 && ly < h - 100 && (ly % 34) > 6) { const k = 3 + Math.round((1 - v) * 2) + ((lx + ly) % 11 === 0 ? 2 : 0); return P32(PFInfra.GLASS)[clamp(k, 0, 5)]; }
        let k = 5 + (lx < 3 ? 2 : lx > w - 4 ? -2 : 0) - Math.round(v * 0.8);
        if (PFK.cl(xx, yy, 2, 21) < 0.1) k--;
        return Wh[clamp(k, 1, 7)];
      },
      top: () => Wh[6],
    });
    // aletas laterales, ventanas altas y logotipo de la gota
    for (const fx of [x - 4, x + w]) for (let yy = top + 6; yy < L - 4; yy++) for (let k = 0; k < 4; k++) put(pb, fx + k, yy, Wh[clamp((fx < x ? [6, 7, 5, 3] : [4, 3, 2, 1])[k] - ((yy - top) % 34 < 3 ? 2 : 0), 0, 7)]);
    for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) { const wx = x + 8 + k * 15, wy = top + 14 + r * 12; for (let yy = wy; yy < wy + 7; yy++) for (let xx = wx; xx < wx + 8; xx++) put(pb, xx, yy, xx === wx || yy === wy ? Wh[2] : P32(PFInfra.GLASS)[clamp(4 - ((xx + yy) % 7 === 0 ? -1 : 0) - (yy - wy > 4 ? 1 : 0), 0, 5)]); }
    const lx = x + Math.round(w / 2), ly = L - 4 - 104;
    PFK.ellipseFn(pb, lx, ly, 7, 8, (nx, ny) => (ny < -0.3 && Math.abs(nx) > 0.45 + ny * 0.5) ? 0 : U(nx + ny < -0.4 ? '#9cecdc' : nx > 0.35 ? '#127a70' : '#1aa894'));
    PFK.text(pb, 'SYNARA', lx - 14, ly + 11, U('#127a70'), { font: 'tiny', bold: true });
    // puerta de servicio (≥ 84 px) con marco turquesa
    const dw = 26, dh = 86, dxx = x + Math.round((w - dw) / 2), dyy = L - 4 - dh;
    for (let yy = dyy - 4; yy < L - 4; yy++) for (let xx = dxx - 4; xx < dxx + dw + 4; xx++) {
      const inF = xx >= dxx && xx < dxx + dw && yy >= dyy;
      if (!inF) { put(pb, xx, yy, T[xx < dxx ? 4 : 2]); continue; }
      const lx = xx - dxx; put(pb, xx, yy, U(lx === Math.round(dw / 2) ? '#0a1430' : ((yy - dyy) % 12 === 0 ? '#2a4a6a' : lx < 3 ? '#4a6a8a' : '#1c3a5a')));
    }
    for (let k = 0; k < 3; k++) put(pb, dxx + dw + 6, dyy + 30 + k * 4, U(['#3fe0a0', '#56e5ff', '#ffd84a'][k]));
    // corona: anillo de cristal y antena
    PFK.ellipseFn(pb, x + w / 2 + 4, top - 2, w / 2 + 6, 6, (nx, ny, dd) => dd > 0.6 ? U(ny < 0 ? '#e6fdff' : '#7ab8e8') : U('#3a7ab8'));
    PFK.ellipseFn(pb, x + w / 2 + 4, top - 12, 9, 10, (nx, ny) => ny > 0.6 ? 0 : U(nx + ny < -0.4 ? '#e6fdff' : nx > 0.3 ? '#1aa894' : '#71dfef'));
    for (let yy = top - 40; yy < top - 20; yy++) { put(pb, x + w / 2 + 4, yy, Wh[6]); put(pb, x + w / 2 + 5, yy, Wh[3]); }
    return { door: [dxx, dyy, dw, dh], crown: [x + w / 2 + 4, top - 12], beacon: [x + w / 2 + 4, top - 41], top };
  }

  /* ---------- aerogenerador decorativo (torre; el rotor es dinámico) ---------- */
  function miniTurbine(pb, x, y, h = 92) {
    const Wh = P32(A.WHITE);
    A.castShadow(pb, x - 4, y, 10, 12, -0.2, 1.4);
    box(pb, x - 9, y, 20, 8, 10, { ramp: PFTerrain.CONC, skew: 0.5 });
    for (let yy = y - 8 - h; yy < y - 8; yy++) { const t = (yy - (y - 8 - h)) / h, ww = t > 0.5 ? 4 : 3; for (let k = 0; k < ww; k++) put(pb, x - 1 + k, yy, Wh[[7, 5, 3, 2][k]]); }
    // góndola
    box(pb, x - 4, y - 8 - h + 4, 12, 6, 4, { ramp: A.WHITE, skew: 0.5 });
    // caja de herramientas y cinta de Dante
    box(pb, x + 12, y, 14, 7, 6, { ramp: ['#3a0a0a', '#6a1414', '#a82a2a', '#d8483a', '#f08060', '#ffc0a0'], skew: 0.5 });
    for (let k = 0; k < 6; k++) put(pb, x - 2 + (k % 2) * 3, y - 30 - k * 9, U('#c0c0c8'));
    return { hub: [x + 1, y - 8 - h + 1] };
  }
  return { truss, speaker, screenFrame, pavilion, stage, bandstand, pergolaPV, bess, glassTank, raisedBed, crop, electrolyzer, h2Bullet, core, miniTurbine, TEAL, NAVY, BLUEC, H2W, H2G, PV };
})();
