/* =====================================================================
   18r_pfb_ground.js — Suelo del plano jugable del kit B (niveles 6–10).
   Opt-in: def.pf = { kitB: true, terrain: [{x0,x1,surf,face,depth,...}] }
   · PFBGround.surface(pb, world) → caras superiores (detrás de la línea de
     paso): soil, path, grass, sand, metal, grate, tile, street, deck.
     Filas que se acortan hacia el fondo, labio iluminado, reflejos
     (s.refl: [{x,w,col,k}]) en suelos pulidos.
   · PFBGround.render(world) → caras frontales (bajo la línea de paso):
       terrace  — muros de piedra seca escalonados con bancales inferiores,
                  canal de riego turquesa y corte de suelo al pie
       soilcut  — corte de suelo con horizontes, raíces y piedras
       sandstone— estratos de arenisca cálida con fisuras y barniz
       metal    — canto de forjado: franja de seguridad, viga remachada,
                  bandejas de cable y conductos bajo el suelo
       concrete — zócalo de hormigón con encofrado, berenjenos y manchas
       hall     — canto de mármol con moldura dorada y arcadas inferiores
       curb     — bordillo de granito, muro de contención con imbornales
     y las plataformas con baked:true según p.look (deck, grate, ledge,
     none). def.pf.decorateFace(pb, world, segs) permite añadir detalle.
   · PFBFront.kinds: oclusores frontales (pillar, cables, rail, reeds,
     beam, dark) para PFStage.
   · PFBPond: estanque somero en 3/4 (style:'pond').
   ===================================================================== */
const PFBGround = (() => {
  const K = PFK;
  const SOILT = ['#24130a', '#36200f', '#4c2f18', '#634020', '#7b532a', '#946836', '#ad7f44', '#c69956', '#ddb46e', '#f0d090'];
  const GRASS = ['#1e2c0a', '#2e420e', '#425c12', '#5a7618', '#76921e', '#94ac2a', '#b4c43a', '#d2d856', '#ece67a'];
  const METALT = ['#12161e', '#1c222c', '#28303c', '#36404e', '#485364', '#5e6a7e', '#7a8698', '#9ca8b8', '#c2ccd8', '#e8eef6'];
  const STREET = ['#2a1a14', '#3e2a22', '#56402f', '#6e5440', '#886a52', '#a28466', '#ba9e7e', '#d2b896', '#e8d2b2'];
  const SANDT = PFTerrain.SANDF;
  const DECKW = ['#1e1008', '#341e10', '#4e2e18', '#6a4222', '#86582e', '#a2703c', '#bc8a4e', '#d4a666', '#e8c488'];

  function depthOf(s) { return s.depth ?? ({ soil: 16, path: 14, grass: 14, sand: 12, metal: 18, grate: 16, tile: 22, street: 18, deck: 16 }[s.surf] || 14); }
  function segAt(segs, x) { for (const s of segs) if (x >= s.x0 && x < s.x1) return s; return segs[segs.length - 1]; }
  function prep(world) {
    const P = world.def.pf || {};
    const segs = (P.terrain || []).map((s, i) => Object.assign({ seed: 211 + i * 41 }, s));
    for (const s of segs) { s._bk = buildBlocks(s.x0 - 30, s.x1 + 30, s.seed + 5, s.blocks || {}); s._st = { ci: 0 }; s._tst = (s.tiers || []).map(() => ({ ci: 0 })); s._tbk = (s.tiers || []).map((T, i) => buildBlocks(s.x0 - 30, s.x1 + 30, s.seed + 31 * (i + 1), { wMin: 10, wMax: 26 })); }
    return segs;
  }
  function backEdge(s, x, gy) {
    const D = depthOf(s), flat = ['metal', 'grate', 'tile', 'street', 'deck'].includes(s.surf);
    return gy - D - (flat ? 0 : Math.round((K.vn(x * 0.07, 0, s.seed) - 0.5) * 6));
  }
  /** Filas en perspectiva: índice de fila y posición dentro de la fila para dz (1 = frente) */
  function rowOf(dz, D, n) {
    // filas que se acortan hacia el fondo (progresión geométrica)
    let acc = 0, h = Math.max(2, Math.round(D / (n * 0.7))), i = 0;
    while (i < 40) { const hh = Math.max(1, Math.round(h * Math.pow(0.82, i))); if (dz - 1 < acc + hh) return [i, dz - 1 - acc, hh]; acc += hh; i++; }
    return [i, 0, 1];
  }
  /** Reflejos verticales en suelos pulidos */
  function reflect(s, x, y, u, t) {
    if (!s.refl) return u;
    for (const r of s.refl) {
      const dx = Math.abs(x - r.x); if (dx > r.w) continue;
      const k = (r.k ?? 0.35) * (1 - dx / r.w) * (0.5 + t * 0.5);
      u = K.mixU(u, U(r.col), clamp(k, 0, 0.8));
    }
    return u;
  }
  function surfPix(s, x, y, gy, D, back) {
    const dz = gy - y, t = dz / D;
    switch (s.surf) {
      case 'soil': case 'path': {
        const S = K.P32(s.surf === 'soil' ? SOILT : (s.ramp || SANDT));
        if (dz === 1) return S[S.length - 1];
        if (dz === 2) return S[S.length - 2];
        if (y - back < 2) return S[2];
        let tt = 0.74 - t * 0.3 + (K.vn(x * 0.09, y * 0.3, 21) - 0.5) * 0.22 + (K.cl(x, y, 2, 22) - 0.5) * 0.12;
        if (s.surf === 'soil') { const [ri, rp] = rowOf(dz, D, 5); if (rp === 0) tt -= 0.14; else if (rp === 1) tt += 0.06; }
        else if (t > 0.25 && t < 0.62) tt += 0.06; // sendero gastado
        const hh = hash2(x, y, 23);
        if (hh < 0.03) return S[clamp(Math.round(tt * 9) + 2, 0, S.length - 1)];
        if (hh > 0.985) return S[1];
        return S[clamp(Math.round(tt * (S.length - 1)), 1, S.length - 1)];
      }
      case 'grass': {
        const G = K.P32(GRASS);
        if (dz === 1) return G[7];
        let tt = 0.78 - t * 0.35 + (K.cl(x, y, 2, 61) - 0.5) * 0.36 + (K.vn(x * 0.05, y * 0.2, 62) - 0.5) * 0.2;
        const hh = hash2(x, y, 63);
        if (hh < 0.012) return U(['#ffe14d', '#f47a90', '#b49cff', '#fff6e0'][Math.floor(hh * 333) % 4]);
        // sendero de tierra que serpentea por el centro
        if (s.trail) { const c = D * 0.5 + Math.sin(x * 0.03 + s.seed) * D * 0.18; if (Math.abs(dz - c) < D * 0.2 + (K.cl(x, y, 2, 64) - 0.5) * 2) { const S = K.P32(SOILT); return S[clamp(Math.round(6 - t * 2 + (K.cl(x, y, 2, 65) - 0.5) * 2), 2, 8)]; } }
        return G[clamp(Math.round(tt * 8), 1, 8)];
      }
      case 'sand': {
        const S = K.P32(SANDT);
        if (dz === 1) return S[9];
        let tt = 0.9 - t * 0.22 + (K.vn(x * 0.05, y * 0.3, 31) - 0.5) * 0.16;
        if (((y * 1.6 + Math.sin(x * 0.045 + y * 0.1) * 4) % 5) < 1) tt -= 0.1;
        return S[clamp(Math.round(tt * 9), 3, 9)];
      }
      case 'metal': case 'grate': {
        const M = K.P32(s.ramp || METALT), n = M.length;
        if (dz === 1) return M[n - 1];
        if (dz === 2 && s.stripe !== false) return U('#f0c040');
        if (dz === 3 && s.stripe !== false) return U((Math.floor((x + y) / 4) % 2) ? '#f0c040' : '#1e1e26');
        const [ri, rp, rh] = rowOf(dz - 3, D - 3, 4);
        const pw = Math.max(10, 34 - ri * 5), jx = ((x + ri * 13) % pw + pw) % pw;
        let k = Math.round(n * 0.5 - t * 1.8 + (hash2(Math.floor((x + ri * 13) / pw), ri, 51) - 0.5) * 1.2);
        if (rp === 0) k = 1; else if (rp === 1) k += 1;
        if (jx === 0) k = 1; else if (jx === 1) k += 1;
        if (s.surf === 'grate') { if ((x % 3 === 0) || (dz % 2 === 0)) k = 1; }
        else if (((x + dz * 2) % 4) === 0 && rp > 0) k += 1; // relieve de chapa lagrimada
        if (y - back < 1) k = 1;
        let u = M[clamp(k, 0, n - 1)];
        return reflect(s, x, y, u, 1 - t);
      }
      case 'tile': {
        const T = K.P32(s.ramp || STREET), n = T.length;
        if (dz === 1) return T[n - 1];
        if (dz === 2 && s.trim) return U(s.trim);
        const [ri, rp] = rowOf(dz - (s.trim ? 2 : 1), D - 2, 4);
        const pw = Math.max(12, 40 - ri * 6), jx = ((x + (ri % 2) * (pw >> 1)) % pw + pw) % pw;
        const cell = Math.floor((x + (ri % 2) * (pw >> 1)) / pw);
        let k = Math.round(n * 0.62 - t * 2 + ((cell + ri) % 2 && s.checker ? -1.2 : 0) + (K.vn(x * 0.07, y * 0.3, 71) - 0.5) * 0.8);
        if (rp === 0) k -= 2; else if (jx === 0) k -= 2;
        let u = T[clamp(k, 0, n - 1)];
        return reflect(s, x, y, u, 1 - t);
      }
      case 'street': {
        const S = K.P32(s.ramp || STREET), n = S.length;
        if (dz === 1) return S[n - 1];
        const [ri, rp] = rowOf(dz, D, 5);
        const pw = Math.max(6, 16 - ri * 2), off = (ri % 2) * (pw >> 1), jx = ((x + off) % pw + pw) % pw;
        let k = 5 - Math.round(t * 2) + Math.round((hash2(Math.floor((x + off) / pw), ri, 81) - 0.5) * 2);
        if (rp === 0 || jx === 0) k = 2; else if (rp === 1 || jx === 1) k += 1;
        let u = S[clamp(k, 0, n - 1)];
        if (s.dust) { const d = K.vn(x * 0.02, y * 0.2, 82); if (d > 0.55) u = K.mixU(u, U(s.dust), clamp((d - 0.55) * 2.2, 0, 0.75)); }
        return u;
      }
      case 'deck': {
        const Dk = K.P32(s.ramp || DECKW), n = Dk.length;
        if (dz === 1) return Dk[n - 1];
        const [ri, rp] = rowOf(dz, D, 5);
        const pl = 30 + (ri % 3) * 7, jx = ((x + ri * 17) % pl + pl) % pl;
        let k = n - 3 - Math.round(t * 2) + ((K.vn(x * 0.04, ri, 91) - 0.5) * 1.6 | 0);
        if (rp === 0) k = 1; else if (jx === 0) k = 2;
        return Dk[clamp(k, 0, n - 1)];
      }
    }
    return 0;
  }
  /** Caras superiores → pb (normalmente al principio de props) */
  function surface(pb, world) {
    const segs = prep(world), wd = world.w;
    for (let x = 0; x < wd; x++) {
      const s = segAt(segs, x), gy = world.ground[x], back = backEdge(s, x, gy), D = gy - back;
      for (let y = Math.max(0, back); y < gy; y++) { const u = surfPix(s, x, y, gy, D, back); if (u) pb.data[y * pb.w + x] = u; }
    }
    // AO al pie de escalones
    for (let x = 1; x < wd - 1; x++) {
      const g0 = world.ground[x - 1], g1 = world.ground[x];
      if (g0 < g1 - 4) for (let k = 0; k < 5; k++) for (let y = g1 - 10; y < g1; y++) { const c = K.get(pb, x + k, y); if (c >>> 24) K.put(pb, x + k, y, K.shU(c, -0.22 + k * 0.04, 235)); }
      if (g1 < g0 - 4) for (let k = 0; k < 4; k++) for (let y = g0 - 8; y < g0; y++) { const c = K.get(pb, x - 1 - k, y); if (c >>> 24) K.put(pb, x - 1 - k, y, K.shU(c, -0.18 + k * 0.04, 235)); }
    }
    return segs;
  }

  /* ---------- caras frontales ---------- */
  /** Piedra seca / sillería irregular: devuelve [idPiedra, lx, ly, w, h] o null si es junta */
  function stoneCell(x, ly, seed, rh = 6, sw = 12) {
    const row = Math.floor(ly / rh), py = ly - row * rh;
    const off = Math.floor(hash1(row, seed) * sw);
    const xx = x + off, col = Math.floor(xx / sw);
    let b0 = col * sw + Math.floor(hash2(col, row, seed) * (sw * 0.45));
    let c = col;
    if (xx < b0) { c = col - 1; b0 = c * sw + Math.floor(hash2(c, row, seed) * (sw * 0.45)); }
    const b1 = (c + 1) * sw + Math.floor(hash2(c + 1, row, seed) * (sw * 0.45));
    const px = xx - b0, w = b1 - b0;
    if (py === rh - 1 || px === 0) return null;
    return [c * 977 + row * 31, px, py, w, rh - 1];
  }
  function wallPix(x, ly, wallH, seed, P, o = {}) {
    const n = P.length, rh = o.rh || 6, sw = o.sw || 12;
    if (ly === 0) return P[n - 1];
    if (ly === 1) return P[n - 2];
    const st = stoneCell(x, ly - 2, seed, rh, sw);
    if (!st) return P[1];
    const [id, px, py, w, h] = st;
    let k = Math.round(n * 0.55 + (hash1(id, seed + 3) - 0.5) * 2.4);
    if (py === 0) k += 2; else if (py === h - 1) k -= 2;
    if (px === 1) k += 1; else if (px >= w - 2) k -= 1;
    k += Math.round((K.cl(x, ly, 2, seed + id) - 0.5) * 1.2);
    // sombra bajo el labio y oscurecimiento hacia el pie
    if (ly < 5) k -= 2 - Math.floor(ly / 3);
    k -= Math.floor(ly / Math.max(8, wallH)) ;
    if (o.moss && py === 0 && hash2(x, ly, seed + 9) < 0.35) return U(hash2(x, ly, 4) < 0.5 ? '#5a7618' : '#425c12');
    return P[clamp(k, 0, n - 1)];
  }
  function soilPix(x, d, seed, o = {}) {
    const S = K.P32(SOILT), n = S.length;
    // horizontes ondulados: humus (O/A), suelo (B), subsuelo arcilloso con piedras (C)
    const h1 = 7 + Math.round((K.vn(x * 0.03, 1, seed) - 0.5) * 6), h2 = 24 + Math.round((K.vn(x * 0.02, 2, seed) - 0.5) * 10);
    let k;
    if (d < h1) k = 2 + (K.cl(x, d, 2, seed) < 0.3 ? -1 : 0);
    else if (d < h2) k = 4 + Math.round((K.vn(x * 0.08, d * 0.12, seed + 1) - 0.5) * 2);
    else k = 6 + Math.round((K.vn(x * 0.05, d * 0.08, seed + 2) - 0.5) * 2) - Math.floor((d - h2) / 30);
    if (d === h1 || d === h2) k -= 1;
    // piedras del subsuelo
    if (d > h2 - 4) { const b = PFTerrain.boulderPix(x, d, seed + 7, 13, 9, K.P32(PFB.R.STONE)); if (b !== -1 && hash2(Math.floor(x / 13), Math.floor(d / 9), seed) < 0.35) return K.shU(b, -0.15, 15); }
    if (hash2(x, d, seed + 5) < 0.02) k += 2;
    if (o.wet && d > 4 && d < h2) k -= 1;
    return S[clamp(k - (d > 70 ? 1 : 0), 0, n - 1)];
  }
  function sandstonePix(x, d, seed) {
    const S = K.P32(PFB.R.STONE), n = S.length;
    const yy = d + Math.round((K.vn(x * 0.012, 0, seed) - 0.5) * 10);
    const band = Math.floor(yy / 9), lb = yy - band * 9;
    let k = 5 + Math.round((hash1(band, seed) - 0.5) * 3) + Math.round((K.vn(x * 0.06, yy * 0.1, seed + 1) - 0.5) * 1.6);
    if (lb === 0) k -= 2; else if (lb === 1) k += 1;
    // estratificación cruzada
    if (((x * 0.35 + yy * 1.1 + band * 7) % 11) < 1 && lb > 2) k -= 1;
    // fisuras verticales
    const fx = Math.floor(x / 23), fpos = fx * 23 + Math.floor(hash1(fx, seed + 2) * 18);
    if (Math.abs(x - fpos) < 1 && hash2(fx, band, seed) < 0.6) k = 1;
    else if (x - fpos === 1 && hash2(fx, band, seed) < 0.6) k += 1;
    // barniz del desierto
    if (K.vn(x * 0.3, d * 0.02, seed + 3) > 0.74) k -= 1;
    k -= Math.floor(d / 34);
    return S[clamp(k, 0, n - 1)];
  }
  function metalFace(s, x, d) {
    const M = K.P32(s.ramp || METALT), n = M.length;
    if (d === 0) return M[n - 1];
    if (d === 1) return M[n - 2];
    if (d < 4) return U((Math.floor((x - d) / 5) % 2) ? '#f0c040' : '#1e1e26');
    if (d < 12) { // viga de canto con remaches
      let k = n - 3 - (d > 9 ? 2 : 0) - (d === 4 ? -1 : 0);
      if ((x % 16) === 4 && (d === 6 || d === 9)) k = n - 1;
      if ((x % 64) === 0) k = 2;
      return M[clamp(k, 0, n - 1)];
    }
    if (d === 12) return M[1];
    // bajo el forjado: penumbra azulada con vigas IPE, bandeja de cables y conductos
    const dd = d - 13;
    let k = 2 - Math.floor(dd / 26);
    const bx = ((x % (s.bay || 48)) + (s.bay || 48)) % (s.bay || 48);
    if (bx < 4) k = bx === 0 ? 1 : 3 + (bx === 1 ? 1 : 0); // montante
    if (dd >= 4 && dd < 8) k = dd === 4 ? 4 : dd === 7 ? 1 : 3; // bandeja de cables
    if (dd >= 5 && dd < 7 && x % 5 < 3 && bx >= 4) return U(['#c8384a', '#2c6cc8', '#ecc030'][(Math.floor(x / 5) + dd) % 3]);
    if (dd >= 14 && dd < 18) return K.P32(PFInfra.PIPES[s.pipe || 'cool'].ramp)[[1, 4, 3, 1][dd - 14]];
    if (dd > 30 && (x % 9) === 0 && (dd % 6) < 3) k += 1; // rejilla de ventilación
    return M[clamp(k, 0, n - 1)];
  }
  function concreteFace(s, x, d) {
    const C = K.P32(s.ramp || PFTerrain.CONC), n = C.length;
    if (d === 0) return C[n - 1];
    if (d === 1) return C[n - 2];
    const pw = 32, ph = 16, jx = ((x + Math.floor(d / ph) * 16) % pw + pw) % pw, jy = (d - 2) % ph;
    let k = Math.round(n * 0.55 + (K.vn(x * 0.09, d * 0.09, s.seed) - 0.5) * 2.2 + (K.cl(x, d, 2, 3) - 0.5));
    if (jx === 0 || jy === 0) k = 2; else if (jy === 1) k += 1;
    if ((jx === 8 || jx === 24) && (jy === 5 || jy === 11)) k = 1; // berenjenos
    if (K.vn(x * 0.5, d * 0.03, s.seed + 9) > 0.8 && jy > 1) k -= 1; // chorreones
    k -= Math.floor(d / 40);
    return C[clamp(k, 0, n - 1)];
  }
  function hallFace(s, x, d) {
    const T = K.P32(s.ramp || PFB.R.STUCCO), Gd = K.P32(PFB.R.GOLD), n = T.length;
    if (d === 0) return T[n - 1];
    if (d < 4) return T[n - 2 - (d === 3 ? 2 : 0)];
    if (d < 6) return Gd[d === 4 ? 6 : 3];
    if (d < 7) return Gd[1];
    // zócalo de piedra con arcadas ciegas
    const dd = d - 7, aw = s.arch || 40, ax = ((x % aw) + aw) % aw;
    const cx = aw / 2, inArch = dd > 6 && Math.abs(ax - cx) < aw * 0.32 && (dd > 14 || Math.hypot(ax - cx, (dd - 14) * 1.2) < aw * 0.32);
    if (inArch) { const R_ = K.P32(s.inner || PFB.R.ROYAL); return R_[clamp(2 - Math.floor(dd / 22) + (Math.abs(ax - cx) < aw * 0.32 - 2 ? 0 : 1), 0, 8)]; }
    let k = n - 4 - Math.floor(dd / 18) + Math.round((K.vn(x * 0.05, dd * 0.1, 3) - 0.5) * 1.4);
    if (Math.abs(ax - cx) < aw * 0.32 + 1.5 && dd > 6) k += 1; // moldura del arco
    if (ax === 0 || ax === 1) k -= 2; // pilastra
    return T[clamp(k, 0, n - 1)];
  }
  function curbFace(s, x, d) {
    const S = K.P32(s.ramp || PFB.R.STONE), n = S.length;
    if (d === 0) return S[n - 1];
    if (d < 5) { let k = n - 2 - d; if ((x % 26) === 0) k = 2; return S[clamp(k, 0, n - 1)]; }
    if (d === 5) return S[1];
    const ly = d - 6;
    const u = wallPix(x, ly + 2, 80, s.seed, S, { rh: 9, sw: 18 });
    // imbornales
    if (s.drains) { const dx = ((x % 120) + 120) % 120; if (dx > 40 && dx < 58 && ly > 2 && ly < 12) return U(((dx - 40) % 3 === 0) ? '#5a5658' : '#140e10'); }
    return K.shU(u, -0.06 * Math.floor(ly / 20), 235);
  }
  /* ---------- bloques de roca redondeados (como el acantilado de la referencia) ---------- */
  const LVB = (() => { const l = [-0.55, -0.72, 0.46], m = Math.hypot(...l); return l.map(v => v / m); })();
  /** Columnas de bloques deterministas por semilla: [{x0,x1,p,seed,rows:[{y,h,alb,pro}]}] */
  function buildBlocks(x0, x1, seed, o = {}) {
    const r = RNG(seed), cols = [];
    let x = x0 - r.int(4, 14);
    const wMin = o.wMin || 13, wMax = o.wMax || 30, hMin = o.hMin || 16, hMax = o.hMax || 40;
    while (x < x1 + 30) {
      const w = r.int(wMin, wMax), rows = [];
      let y = -r.int(0, 10);
      while (y < 400) { const h = r.int(hMin, hMax); rows.push({ y, h, alb: (r() - 0.5) * 0.16, pro: r() < 0.45, tilt: (r() - 0.5) * 0.3 }); y += h; }
      cols.push({ x0: x, x1: x + w, p: r(), seed: r.int(1, 1e6), rows });
      x += w;
    }
    return cols;
  }
  function blockEdge(c, ly) { return c.x0 + Math.round((K.vn(ly * 0.05, c.seed * 0.001, 3) - 0.5) * 6); }
  /** Píxel de una pared de bloques. ly = y local desde el borde superior, H = alto de la pared (o 999),
      cols = buildBlocks(...), st = estado de cursor {ci}. P = rampa u32 (9 tonos claro al final). */
  function blockPix(cols, st, x, ly, H, P, o = {}) {
    let ci = st.ci || 0;
    while (ci > 0 && cols[ci].x0 > x + 4) ci--;
    while (ci < cols.length - 1 && cols[ci + 1].x0 <= x - 4) ci++;
    if (ci < cols.length - 1 && x >= blockEdge(cols[ci + 1], ly)) ci++; else if (ci > 0 && x < blockEdge(cols[ci], ly)) ci--;
    st.ci = ci;
    const c = cols[ci], n = P.length;
    const left = blockEdge(c, ly), right = ci < cols.length - 1 ? blockEdge(cols[ci + 1], ly) : c.x1;
    const w = Math.max(6, right - left), dl = x - left, dr = right - 1 - x;
    // fila del bloque (filas escalonadas por columna); en paredes bajas un solo bloque
    let bt = 0, bb = H, alb = 0, pro = c.p > 0.5;
    if (H > 60) { for (const rw of c.rows) { const off = Math.round(rw.tilt * (x - left - w / 2)); if (ly >= rw.y + off && ly < rw.y + rw.h + off) { bt = rw.y + off; bb = rw.y + rw.h + off; alb = rw.alb; pro = rw.pro; break; } } }
    const dt = ly - Math.max(0, bt), db = Math.min(H, bb) - 1 - ly;
    // grietas y juntas
    if (dl <= 0 || (dl === 1 && K.cl(x, ly, 2, c.seed) < 0.5)) return P[ly < 3 ? 3 : 0];
    if (dr <= 0 && K.cl(x, ly, 2, c.seed + 1) < 0.6) return P[1];
    if (bt > 0 && dt <= 0) return P[0];
    if (bt > 0 && dt === 1 && K.cl(x, ly, 2, c.seed + 3) < 0.55) return P[1];
    // cara superior del bloque (banda clara de 2–4 px)
    const capH = pro ? 4 : 2;
    if (dt >= (bt > 0 ? 1 : 0) && dt < capH + (bt > 0 ? 1 : 0) && dl > 1 && dr > 1) {
      let k = dt === (bt > 0 ? 1 : 0) ? n - 1 : n - 2;
      if (K.cl(x, ly, 2, c.seed + 5) < 0.3) k--;
      if (dr < 3) k -= 2;
      return P[clamp(k - (ly > 120 ? 2 : 0), 2, n - 1)];
    }
    // normal de caja redondeada → Lambert
    const rc = Math.min(8, w * 0.42), rT = pro ? 6 : 3, rB = 6;
    let nx = 0, ny = 0;
    if (dl < rc) nx = -(1 - dl / rc); else if (dr < rc + 1) nx = 1 - dr / (rc + 1);
    if (dt < rT) ny = -(1 - dt / rT) * 0.9; else if (db < rB) ny = (1 - db / rB) * 0.9;
    const nz = Math.sqrt(Math.max(0.02, 1 - nx * nx - ny * ny));
    let t = 0.24 + Math.max(-0.2, nx * LVB[0] + ny * LVB[1] + nz * LVB[2]) * 0.82 + alb + (c.p - 0.5) * 0.18;
    if (c.p < 0.3) t -= 0.1;
    if (dl <= 3) t -= (4 - dl) * 0.05;
    if (dl === 2 && dt > capH + 1) t += 0.12;
    if (dr < 3) t -= (3 - dr) * 0.07;
    if (!pro && dt < 4 && bt > 0) t -= 0.2 - dt * 0.05;
    // textura pictórica: manchas, vetas verticales (chorreones), picaduras
    t += (K.vn(x * 0.11, ly * 0.09, c.seed & 255) - 0.5) * 0.22 + (K.cl(x, ly, 2, c.seed + 9) - 0.5) * 0.12;
    if (K.vn(x * 0.45, ly * 0.035, c.seed & 127) > 0.74) t -= 0.12;
    const h = hash2(x, ly, c.seed); if (h < 0.025) t += 0.12; else if (h > 0.975) t -= 0.2;
    t -= clamp((ly - (o.darkFrom ?? 60)) / 170, 0, 0.3);
    return P[clamp(Math.round(t * (n - 0.6)), 0, n - 1)];
  }
  /** Pila de bancales: niveles de muro + franja de cultivo + corte de suelo */
  function terracePix(s, x, d) {
    const tiers = s.tiers || [{ wall: 18, top: 9 }, { wall: 14, top: 8 }];
    let dd = d;
    for (let i = 0; i < tiers.length; i++) {
      const T = tiers[i];
      const wh = Math.max(4, T.wall + Math.round((K.vn(x * 0.025, i * 3, s.seed) - 0.5) * (T.wave ?? 6)));
      if (dd < wh) {
        if (T.style === 'stone') return wallPix(x, dd, wh, s.seed + i * 17, K.P32(T.ramp || s.wallRamp || PFB.R.STONE), { moss: true });
        const P_ = K.P32(T.ramp || s.wallRamp || RAMP.rockWarmR);
        if (dd === 0) return U('#fde3a8');
        return blockPix(s._tbk[i], s._tst[i], x, dd, wh, P_, { darkFrom: 30 });
      }
      dd -= wh;
      const th = T.top;
      if (dd < th) {
        if (T.channel && dd >= th - 3) { const Wc = K.P32(['#065481', '#0a8ab0', '#11bedd', '#3adcf1', '#bde9f2']); return Wc[dd === th - 3 ? 4 : dd === th - 2 ? 2 : 1]; }
        const S = K.P32(SOILT), rp = dd % 3;
        let k = 6 - Math.round(dd / th * 2) + (rp === 0 ? -2 : rp === 1 ? 1 : 0) + Math.round((K.cl(x, dd, 2, s.seed) - 0.5) * 1.2);
        if (dd === 0) k = 3;
        return S[clamp(k, 0, 9)];
      }
      dd -= th;
    }
    return soilPix(x, dd, s.seed, { wet: true });
  }
  function facePix(s, x, y, gy) {
    const d = y - gy;
    switch (s.face) {
      case 'terrace': return terracePix(s, x, d);
      case 'soilcut': {
        if (d === 0) return U(s.lip || '#ddb46e');
        if (d === 1) return K.P32(SOILT)[7];
        return soilPix(x, d - 2, s.seed);
      }
      case 'sandstone': if (d === 0) return U('#fde3a8'); if (d === 1 && hash2(x, 1, 3) < 0.6) return U('#f7c679'); return s.strata ? sandstonePix(x, d, s.seed) : blockPix(s._bk, s._st, x, d, 999, K.P32(s.ramp || RAMP.rockWarmR), { darkFrom: 50 });
      case 'blocks': if (d === 0) return U('#fde3a8'); return blockPix(s._bk, s._st, x, d, 999, K.P32(s.ramp || RAMP.rockWarmR), { darkFrom: 50 });
      case 'metal': return metalFace(s, x, d);
      case 'concrete': if (s.faceH && d >= s.faceH) return blockPix(s._bk, s._st, x, d - s.faceH, 999, K.P32(s.ramp2 || RAMP.rockWarmR), { darkFrom: 30 }); return concreteFace(s, x, d);
      case 'hall': return hallFace(s, x, d);
      case 'curb': return curbFace(s, x, d);
    }
    return K.P32(SOILT)[4];
  }
  /** Lienzo del terreno: caras frontales + plataformas horneadas + decoración */
  function render(world) {
    const def = world.def, wd = world.w, hd = world.h;
    const pb = new PixelBuffer(wd, hd), segs = prep(world);
    for (let x = 0; x < wd; x++) {
      const s = segAt(segs, x), gy = world.ground[x];
      const nearB = segs.some(o => o !== s && (Math.abs(x - o.x0) < 10 || Math.abs(x - o.x1) < 10));
      for (let y = Math.max(0, gy); y < hd; y++) {
        let ss = s;
        if (nearB && s.blend !== false) { const o = segAt(segs, clamp(x + Math.round((K.vn(y * 0.07, 0.5, 13) - 0.5) * 14), 0, wd - 1)); if (o.blend !== false) ss = o; }
        const u = facePix(ss, x, y, gy);
        if (u) pb.data[y * wd + x] = u;
      }
    }
    // sombra de contacto en escalones del suelo
    for (let x = 1; x < wd; x++) {
      const gl = world.ground[x - 1], gy = world.ground[x];
      if (gl < gy - 3) for (let y = gl; y < gy + 26; y++) { const c = K.get(pb, x - 1, y); if (c >>> 24) K.put(pb, x - 1, y, K.shU(c, -0.3, 235)); }
      if (gy < gl - 3) for (let y = gy; y < gl + 26; y++) { const c = K.get(pb, x, y); if (c >>> 24) K.put(pb, x, y, K.mixU(c, U('#fff1c8'), 0.25)); }
    }
    for (const s of segs) if (s.face === 'terrace' || s.face === 'soilcut') decorateSoil(pb, world, s);
    for (const p of world.platforms) if (p.baked) platform(pb, world, p);
    if (def.pf && def.pf.decorateFace) def.pf.decorateFace(pb, world, segs);
    return pb.toCanvas();
  }
  /** Pasto que cuelga del labio, raíces en el corte, cultivos bajos en los bancales y cascaditas */
  function decorateSoil(pb, world, s) {
    const r = RNG(s.seed + 3), G = K.P32(GRASS);
    for (let x = s.x0; x < s.x1; x++) {
      const gy = world.ground[x];
      if (hash2(x, 1, s.seed) < 0.5) { const L = 1 + Math.floor(hash2(x, 2, s.seed) * 4); for (let k = 0; k < L; k++) K.put(pb, x, gy + 1 + k, G[clamp(5 - k, 1, 8)]); }
    }
    if (s.face === 'terrace') {
      const tiers = s.tiers || [{ wall: 18, top: 9 }, { wall: 14, top: 8 }];
      for (let x = s.x0 + 3; x < s.x1 - 3; x += 4 + r.int(0, 3)) {
        let d = 0; const gy = world.ground[x];
        for (let i = 0; i < tiers.length; i++) {
          const T = tiers[i], wh = Math.max(4, T.wall + Math.round((K.vn(x * 0.025, i * 3, s.seed) - 0.5) * (T.wave ?? 6)));
          d += wh;
          const yTop = gy + d + Math.max(2, T.top - (T.channel ? 4 : 1));
          if (T.crop !== false && hash2(x >> 3, i, s.seed + 4) < 0.92) lowCrop(pb, x, yTop, T.crop || ['lettuce', 'bean', 'chard', 'onion'][Math.floor(hash2(x >> 4, i, 5) * 4)], x * 7 + i, Math.min(T.wall - 2, 13));
          d += T.top;
        }
      }
      // cascaditas entre bancales (estáticas; el brillo animado lo pone el nivel)
      for (const fx of (s.falls || [])) {
        const gy = world.ground[fx]; let d = 0;
        for (let i = 0; i < tiers.length; i++) {
          const T = tiers[i], wh = Math.max(4, T.wall + Math.round((K.vn(fx * 0.025, i * 3, s.seed) - 0.5) * (T.wave ?? 6)));
          if (i > 0 && tiers[i - 1].channel) for (let y = gy + d - 3; y < gy + d + wh; y++) for (let k = 0; k < 4; k++) K.put(pb, fx + k, y, U(['#bde9f2', '#3adcf1', '#11bedd', '#0a8ab0'][(k + y) % 4 === 0 ? 0 : k]));
          d += wh + T.top;
        }
      }
    }
    // raíces en el corte de suelo
    for (const rx of (s.roots || [])) roots(pb, rx, world.ground[rx] + (s.face === 'terrace' ? 12 : 4), 18 + r.int(0, 18), rx);
  }
  /** Sistema radicular: raíz principal y laterales que se ramifican (tonos tierra claros) */
  function roots(pb, x, y, depth, seed) {
    const r = RNG(seed), C = [U('#5a3a22'), U('#a07a4e'), U('#c9a46a')];
    const branch = (x0, y0, a, L, w) => {
      let xx = x0, yy = y0;
      for (let i = 0; i < L; i++) {
        a += (r() - 0.5) * 0.35; xx += Math.cos(a) * 1; yy += Math.sin(a) * 1;
        K.put(pb, Math.round(xx), Math.round(yy), C[w > 1 ? 1 : 2]);
        if (w > 1) K.put(pb, Math.round(xx) + 1, Math.round(yy), C[0]);
        if (L > 6 && r() < 0.08) branch(xx, yy, a + (r() < 0.5 ? -1 : 1) * (0.6 + r() * 0.5), L * 0.45, 1);
      }
    };
    branch(x, y, Math.PI / 2, depth, 2);
    for (let k = 0; k < 4; k++) branch(x, y + 2 + k * 3, Math.PI / 2 + (k % 2 ? -1 : 1) * (0.7 + r() * 0.4), depth * 0.5, 1);
  }
  /** Cultivo bajo de bancal inferior (lechuga, frijol, acelga, cebolla) que no supera hMax */
  function lowCrop(pb, x, y, kind, seed, hMax = 10) {
    const r = RNG(seed);
    const RAMPS = {
      lettuce: ['#1e3a10', '#2e5418', '#467a22', '#64a02e', '#8cc43e', '#b4dc58', '#e2ee90'],
      chard: ['#12240c', '#1e3a12', '#2e561a', '#447a22', '#64a02c', '#90c040', '#c4dc6a'],
      bean: ['#14280c', '#22401a', '#345e22', '#4a7e2a', '#66a034', '#92c048', '#c4dc70'],
      cabbage: ['#12242e', '#1e3a44', '#2e5a5c', '#467a72', '#68a08a', '#98c4a4', '#cce6c8'],
      onion: ['#1a3010', '#2a4a18', '#3e6a22', '#58902c', '#7ab03c', '#a6cc5a', '#d4e88a'],
      marigold: ['#14280c', '#22401a', '#345e22', '#4a7e2a', '#66a034', '#92c048', '#c4dc70'],
    };
    const ramp = RAMPS[kind] || RAMPS.lettuce, ry = Math.min(hMax / 2, kind === 'bean' || kind === 'onion' ? 5.5 : 4.2);
    PFFlora.cluster(pb, x, y - ry, kind === 'cabbage' ? 4.5 : 5.2, ry, ramp, seed, { density: 0.95, leaf: [3, 4], core: true, bias: 0.08 });
    if (kind === 'chard') for (let k = 0; k < 3; k++) K.put(pb, x - 1 + k, y - 1, U(k === 1 ? '#ff6a4a' : '#c8281e'));
    else if (kind === 'bean' && r() < 0.5) { K.put(pb, x + 1, y - ry * 2 + 1, U('#f6f0ff')); K.put(pb, x - 2, y - ry - 1, U('#f6f0ff')); }
    else if (kind === 'marigold') for (let k = 0; k < 3; k++) { const fx = x - 3 + k * 3, fy = y - ry * 2 + 1 + (k % 2); K.put(pb, fx, fy, U('#ffb020')); K.put(pb, fx + 1, fy, U('#ff7a10')); K.put(pb, fx, fy - 1, U('#ffe070')); }
    else if (kind === 'cabbage') K.put(pb, x - 1, y - ry - 1, U('#e6f6e0'));
  }
  /** Geometría de los bancales inferiores en x: [{wallTop, wallH, topY, topH, channel}] (y de mundo) */
  function tierInfo(s, x, gy) {
    const tiers = s.tiers || [{ wall: 18, top: 9 }, { wall: 14, top: 8 }], out = [];
    let d = 0;
    for (let i = 0; i < tiers.length; i++) {
      const T = tiers[i], wh = Math.max(4, T.wall + Math.round((K.vn(x * 0.025, i * 3, s.seed) - 0.5) * (T.wave ?? 6)));
      out.push({ wallTop: gy + d, wallH: wh, topY: gy + d + wh, topH: T.top, channel: !!T.channel });
      d += wh + T.top;
    }
    return out;
  }
  /* ---------- plataformas horneadas ---------- */
  function platform(pb, world, p) {
    const x = Math.round(p.x), y = Math.round(p.y), w = p.w, look = p.look || ({ wood: 'deck', metal: 'grate', rock: 'ledge' }[p.type] || 'none');
    if (look === 'none') return;
    if (look === 'deck') {
      const Wd = K.P32(p.ramp || DECKW);
      // pilares hasta el suelo
      for (let px = x + 4; px < x + w - 2; px += p.postGap || 34) { const gb = world.groundAt(px); for (let yy = y + 5; yy < gb; yy++) { K.put(pb, px, yy, Wd[6]); K.put(pb, px + 1, yy, Wd[4]); K.put(pb, px + 2, yy, Wd[2]); K.put(pb, px + 3, yy, Wd[1]); } for (let k = 0; k < 10 && y + 6 + k < gb; k++) { K.put(pb, px + 4 + k, y + 6 + k, Wd[3]); } }
      for (let xx = x; xx < x + w; xx++) {
        for (let yy = y - 4; yy < y; yy++) K.put(pb, xx, yy, Wd[(xx - x + (y - yy) * 3) % 23 === 0 ? 2 : yy === y - 4 ? 5 : 6 - (y - yy) % 2]);
        K.put(pb, xx, y, Wd[7]); K.put(pb, xx, y + 1, Wd[5]); K.put(pb, xx, y + 2, Wd[4]); K.put(pb, xx, y + 3, Wd[3]); K.put(pb, xx, y + 4, Wd[1]);
      }
      if (p.railing) PFB.rail(pb, x + 1, x + w - 2, y - 4, 24, { ramp: ['#1a0c06', '#4a2a14', '#8a5a2e', '#c89458', '#e8c488'], gap: 14 });
      return;
    }
    if (look === 'grate') {
      const M = K.P32(METALT);
      for (let xx = x; xx < x + w; xx++) {
        for (let yy = y - 4; yy < y; yy++) K.put(pb, xx, yy, ((xx % 3 === 0) || ((y - yy) % 2 === 0)) ? M[2] : M[6]);
        K.put(pb, xx, y - 1, M[8]); K.put(pb, xx, y, M[7]); K.put(pb, xx, y + 1, M[5]); K.put(pb, xx, y + 2, (Math.floor(xx / 4) % 2) ? U('#f0c040') : U('#1e1e26')); K.put(pb, xx, y + 3, M[2]); K.put(pb, xx, y + 4, M[1]);
      }
      for (let px = x + 6; px < x + w - 4; px += 40) { const gb = world.groundAt(px); for (let yy = y + 5; yy < gb; yy++) { K.put(pb, px, yy, M[7]); K.put(pb, px + 1, yy, M[4]); K.put(pb, px + 2, yy, M[2]); } }
      if (p.railing !== false) PFB.rail(pb, x, x + w - 1, y - 5, 22, { gap: 12 });
      return;
    }
    if (look === 'ledge') {
      const S = K.P32(PFB.R.STONE);
      for (let xx = x - 2; xx < x + w + 2; xx++) {
        const dep = 7 + Math.round(Math.sin(clamp((xx - x) / w, 0, 1) * Math.PI) * 5);
        for (let yy = y - 4; yy < y; yy++) K.put(pb, xx, yy, S[clamp(8 - (y - yy), 5, 9)]);
        for (let yy = y; yy < y + dep; yy++) K.put(pb, xx, yy, S[clamp(7 - Math.round((yy - y) / dep * 5) + (xx > x + w - 4 ? -2 : 0), 1, 9)]);
      }
    }
  }
  return { surface, render, segAt, backEdge, depthOf, tierInfo, prep, buildBlocks, blockPix, roots, lowCrop, stoneCell, wallPix, soilPix, SOILT, GRASS, METALT, STREET, DECKW };
})();

/* ---------- oclusores del plano frontal ---------- */
const PFBFront = (() => {
  const K = PFK;
  const kinds = {
    /** Columna de interior en contraluz (borde iluminado por el lado de la sala) */
    pillar(o) {
      const w = o.w || 40, h = o.h || 360, pb = new PixelBuffer(w, h), C = K.P32(o.ramp || PFB.R.DARKFG), n = C.length;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const f = x / (w - 1);
        let k = f < 0.08 ? 3 : f < 0.2 ? 2 : f > 0.92 ? 3 : 1;
        if (o.capital && (y < 14 || (y > 18 && y < 22))) k += 1;
        if (o.fluted && x % 6 === 0 && y > 22) k -= 1;
        if (o.lit && f > 0.86) k = n - 2;
        K.put(pb, x, y, C[clamp(k, 0, n - 1)]);
      }
      return pb;
    },
    /** Cables y mangueras que cuelgan del techo (catenarias) */
    cables(o) {
      const w = o.w || 240, h = o.h || 60, pb = new PixelBuffer(w, h), r = RNG(o.seed || 3);
      const cols = (o.cols || ['#080a12', '#141a26', '#1e2a3a']).map(c => U(c));
      for (let i = 0; i < (o.n || 4); i++) {
        const x0 = r() * w * 0.3, x1 = w * (0.7 + r() * 0.3), sag = h * (0.4 + r() * 0.5), th = 1 + (i % 2);
        for (let x = Math.floor(x0); x < x1; x++) { const t = (x - x0) / (x1 - x0), y = Math.round(sag * 4 * t * (1 - t)); for (let k = 0; k < th + 1; k++) K.put(pb, x, y + k, cols[k === 0 ? 2 : k === th ? 0 : 1]); }
      }
      for (let x = 0; x < w; x++) for (let y = 0; y < 4; y++) K.put(pb, x, y, cols[y === 3 ? 2 : 0]);
      return pb;
    },
    /** Barandilla en primer plano (abajo) */
    rail(o) {
      const w = o.w || 200, h = o.h || 46, pb = new PixelBuffer(w, h), C = K.P32(o.ramp || PFB.R.DARKFG);
      for (let x = 0; x < w; x++) { for (let k = 0; k < 4; k++) K.put(pb, x, 6 + k, C[k === 0 ? 4 : k === 3 ? 0 : 2]); for (let k = 0; k < 3; k++) K.put(pb, x, 24 + k, C[k === 0 ? 3 : 1]); }
      for (let x = 4; x < w; x += o.gap || 40) for (let y = 6; y < h; y++) for (let k = 0; k < 5; k++) K.put(pb, x + k, y, C[k === 0 ? 4 : k === 4 ? 0 : 2]);
      return pb;
    },
    /** Juncos y eneas oscuros (humedal) */
    reeds(o) {
      const w = o.w || 120, h = o.h || 90, pb = new PixelBuffer(w, h), r = RNG(o.seed || 5);
      const C = K.P32(o.ramp || ['#04080a', '#0a1614', '#12241e', '#1c362a', '#2a4c36', '#3e6646']);
      for (let i = 0; i < (o.n || Math.round(w / 3)); i++) {
        const bx = r() * w, bh = h * (0.4 + r() * 0.6), lean = (r() - 0.5) * 14;
        for (let j = 0; j < bh; j++) { const t = j / bh, x = Math.round(bx + lean * t * t), y = h - 1 - j; K.put(pb, x, y, C[clamp(1 + Math.round(t * 3) + (lean < 0 ? 1 : 0), 0, 5)]); if (t < 0.4) K.put(pb, x + 1, y, C[1]); }
        if (r() < 0.35) { const tx = Math.round(bx + lean), ty = Math.round(h - 1 - bh); for (let k = 0; k < 7; k++) { K.put(pb, tx, ty + k, U(k < 1 ? '#3a2410' : '#5a3418')); K.put(pb, tx + 1, ty + k, U('#2a1608')); } }
      }
      return pb;
    },
    /** Viga/conducto horizontal en contraluz arriba */
    beam(o) {
      const w = o.w || 320, h = o.h || 22, pb = new PixelBuffer(w, h), C = K.P32(o.ramp || PFB.R.DARKFG);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let k = y < 3 ? 1 : y > h - 3 ? 3 : 2; if (x % 40 < 2) k = 1; if (o.bolts && x % 20 === 10 && (y === 5 || y === h - 6)) k = 4; K.put(pb, x, y, C[k]); }
      return pb;
    },
    /** Follaje oscuro-frío alternativo (hojas de higuera/plátano) */
    dark(o) { return PFFlora.fgClump(o.w || 110, o.h || 80, o.seed || 1, Object.assign({ spikes: 0, leaves: 10 }, o)); },
  };
  return { kinds };
})();

/* ---------- estanque somero en 3/4 ---------- */
const PFBPond = (() => {
  const K = PFK;
  const WAT = ['#063a4a', '#0a5262', '#0e6c78', '#14888c', '#22a4a0', '#40c0b4', '#76dcc8', '#c4f4e6'];
  function build(world, w) {
    const x0 = Math.round(w.x0) - 6, x1 = Math.round(w.x1) + 6, wy = Math.round(w.y), wd = x1 - x0, hh = w.depth3q || 22;
    const pb = new PixelBuffer(wd, hh), Wt = K.P32(w.ramp || WAT), r = RNG(91);
    // lámina de agua que se aleja (cara superior) con orilla irregular, reflejo del cielo y hojas de nenúfar
    for (let x = 0; x < wd; x++) {
      const e = Math.round(Math.sin(Math.PI * clamp(x / wd, 0, 1)) * 2), back = 2 + Math.round((K.vn((x0 + x) * 0.08, 0, 3) - 0.5) * 3) - e;
      for (let y = back; y < hh; y++) {
        const t = (y - back) / (hh - back);
        let k = 5 - Math.round(t * 3) + (((y * 3 + Math.round(Math.sin((x0 + x) * 0.1) * 2)) % 7) === 0 ? 1 : 0);
        if (y === back) k = 7;
        K.put(pb, x, y, Wt[clamp(k, 0, 7)]);
      }
      if (x < 4 || x >= wd - 4) for (let y = back; y < hh; y++) K.put(pb, x, y, U(['#5a3a22', '#7a5232', '#9a6e44'][Math.min(2, x < 4 ? x : wd - 1 - x)]));
    }
    for (let i = 0; i < Math.round(wd / 16); i++) { const lx = 8 + r() * (wd - 16), ly = 6 + r() * (hh - 12); K.ellipseFn(pb, lx, ly, 3.2, 1.6, (nx, ny, d) => d > 0.8 && nx > 0.3 && Math.abs(ny) < 0.3 ? 0 : U(ny < -0.2 ? '#7aa83c' : '#4f7a22')); if (r() < 0.4) { K.put(pb, Math.round(lx), Math.round(ly) - 1, U('#f6c8e0')); K.put(pb, Math.round(lx) + 1, Math.round(ly) - 1, U('#ffffff')); } }
    return { pond: true, w, x0, x1, wy, c: pb.toCanvas(), hh };
  }
  /** Lámina que se aleja: detrás de las entidades (sustituye la cara superior del suelo en el tramo) */
  function renderBack(g, sc, Wt) {
    const ox = sc.cam.ox, oy = sc.cam.oy, x = Wt.x0 - ox; if (x > W || x + (Wt.x1 - Wt.x0) < 0) return;
    g.drawImage(Wt.c, Math.round(x), Math.round(Wt.wy - oy - Wt.hh + 4));
    const t = Game.time; g.fillStyle = '#e8fff8';
    for (let i = 0; i < 7; i++) { const xx = Wt.x0 + 10 + ((i * 37 + t * 9) % (Wt.x1 - Wt.x0 - 20)); g.fillRect(Math.round(xx - ox), Math.round(Wt.wy - oy - 4 - (i % 4) * 4), 2 + (i % 2), 1); }
  }
  /** Delante de los pies: solo una franja translúcida fina con ondas */
  function renderFront(g, sc, Wt) {
    const ox = sc.cam.ox, oy = sc.cam.oy, xa = Math.max(0, Math.round(Wt.x0 + 6 - ox)), xb = Math.min(W, Math.round(Wt.x1 - 6 - ox)); if (xb <= xa) return;
    const y = Math.round(Wt.wy - oy), t = Game.time;
    g.globalAlpha = 0.5; g.fillStyle = '#22a4a0'; g.fillRect(xa, y, xb - xa, 3); g.globalAlpha = 1;
    g.fillStyle = '#c4f4e6';
    for (let x = xa; x < xb; x += 5) if (((x + ox + Math.floor(t * 8)) % 15) < 4) g.fillRect(x, y + (Math.floor(x / 5) % 2), 3, 1);
  }
  return { build, renderBack, renderFront };
})();
