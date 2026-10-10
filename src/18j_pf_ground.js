/* =====================================================================
   18j_pf_ground.js — Materiales de suelo adicionales del plano jugable
   (kit PF, rollout A). Se registran en PFTerrain (PFTerrain.register) y
   se usan desde def.pf.terrain igual que los del vertical slice:
     { x0, x1, surf, face, depth, … }
   Superficies (cara superior en 3/4, detrás de la línea de paso):
     'plaza'   losas de arenisca con bordillo de caliza y franja de mosaico
     'floor'   suelo interior de resina con juntas, reflejos y franja de seguridad
     'dune'    arena con rizos de viento y sombras violetas
     'meadow'  pradera peinada por el viento con sendero y flores
     'saltcrust' costra salina en placas poligonales con charcos rosados
   Caras frontales (bajo la línea de paso):
     'plazaWall' muro de sillares con albardilla, acequia y empedrado inferior
     'slab'      losa de hormigón con canto de acero y galería de servicio abajo
     'dune'      ladera de arena esculpida (normal de un campo de alturas)
     'saltflat'  costra salina estratificada sobre lodo y salmuera
   Plataformas horneadas (PFTerrain.PLAT_EXT): 'crate3q', 'woodDeck'.
   Sin tramado: bandas con borde desplazado por clusters.
   ===================================================================== */
const PFGround = (() => {
  const T = PFTerrain;
  const PSTONE = ['#2e1a12', '#4a2c1e', '#6e4630', '#946446', '#b6835c', '#cfa076', '#e2bc92', '#f2d6ae', '#fdeccc'];
  const KERB = ['#3a2e2a', '#5e504a', '#8a7a6e', '#b2a290', '#d2c4ae', '#e8dcc6', '#faf2e0'];
  const ASHLAR = ['#24140e', '#3e2418', '#5e3826', '#82513a', '#a46c4c', '#c08a62', '#d8a87c', '#ecc89c', '#f8e2bc'];
  const COBBLE = ['#14121a', '#262230', '#3c3640', '#56504e', '#746a60', '#908476', '#ac9e8a', '#c8baa2'];
  const ACEQ = ['#06304a', '#0a5a78', '#0f8aa6', '#1ab8cc', '#5edcea', '#b8f4fa', '#ffffff'];
  const MOSAIC = [['#a24a2a', '#c8643a'], ['#e8d6b0', '#f6ead0'], ['#127a70', '#1aa894'], ['#e8d6b0', '#f6ead0'], ['#2e5a9a', '#3e7ac0'], ['#e8d6b0', '#f6ead0']];
  const AZUL = ['#0e2a5a', '#1e4a8c', '#3a72b8', '#7aa8dc', '#e8f0fa', '#ffffff'];
  const FLOOR = ['#141c26', '#1e2a38', '#2c3c4e', '#3e5266', '#56708a', '#7290a8', '#90b0c4', '#b0cede', '#d0e6f0', '#eef8fc'];
  const SLABC = ['#1a1c22', '#2c2e36', '#44464e', '#5e5e64', '#7a7876', '#98948c', '#b8b2a6', '#d6d0c2'];
  const GAL = ['#03070f', '#060d1a', '#0a1426', '#0f1d34', '#162844', '#203756', '#2c4868'];
  const STEEL = PFInfra.STEEL;
  const SANDF = T.SANDF;
  const VIO = ['#2a1c46', '#3e2a5e', '#583e78', '#74568e', '#8e6c9c', '#a884a6'];
  const SALT = ['#2e2140', '#4a3660', '#6a5280', '#8c74a0', '#ae96ba', '#cab4cc', '#e2d0dc', '#f2e4ea', '#fdf6f6'];
  const MUD = ['#1a1020', '#2a1a2c', '#3e2838', '#583a44', '#74504e', '#8e6a5c'];
  const BRINEP = ['#2a0e3a', '#4a1a5a', '#7a2a7e', '#b04aa0', '#e07ecf', '#f8c8ee'];

  /* ---------- utilidades ---------- */
  /** Fila (índice y desplazamiento) en una lista de alturas acumuladas desde el frente */
  function rowOf(z, rows) { let i = 0, a = 0; while (i < rows.length - 1 && z >= a + rows[i]) { a += rows[i]; i++; } return [i, z - a, rows[i]]; }

  /* ================= PLAZA ================= */
  const PROWS = [6, 5, 4, 4, 3, 3, 3, 2, 2, 2, 2, 2, 2];
  const PW = [26, 22, 5, 18, 16, 14, 13, 12, 11, 10, 10, 9, 9];
  function plazaSurf(s, x, y, gy, D, back, t, dz) {
    const P = PFK.P32(s.ramp || PSTONE), K = PFK.P32(KERB);
    if (y - back < 1) return P[2];
    if (dz === 1) return K[6];
    if (dz <= 4) { const j = (x + 400) % 28; if (j === 0) return K[2]; if (j === 1) return K[5]; let k = dz === 2 ? 5 : 4; if (PFK.cl(x, y, 2, 7) < 0.16) k--; return K[k]; }
    if (dz === 5) return P[1];
    const [ri, ly, rh] = rowOf(dz - 6, PROWS);
    if (ri === 2 && s.mosaic !== false) { // franja de mosaico (teselas de 5 px)
      if (ly === rh - 1) return P[2];
      const c = MOSAIC[Math.floor((x + 600) / 5) % MOSAIC.length];
      if ((x + 600) % 5 === 0) return P[3];
      return U(c[ly === 0 ? 1 : 0]);
    }
    const sw = PW[ri], off = ri * 11, jx = (x + off + 600) % sw, slab = Math.floor((x + off + 600) / sw);
    if (ly === rh - 1) return P[3];
    if (jx === 0) return P[3];
    let k = 6 + Math.round((hash2(slab, ri, 51 + (s.seed | 0)) - 0.5) * 2.2 - t * 1.4 + (PFK.cl(x, y, 2, 52) - 0.5) * 0.8);
    if (ri <= 1) k += PFK.vn(x * 0.03, 0, 53) > 0.45 ? 1 : 0;          // banda gastada y pulida
    if (jx === 1) k += 1;                                               // canto iluminado de la junta
    if (hash2(x, y, 54) < 0.015) k -= 2;                                 // grietas y manchas
    return P[clamp(k, 2, 8)];
  }
  /** Muro de sillares con albardilla de caliza, gárgolas, azulejos, acequia y empedrado inferior */
  function plazaWall(s, x, y, gy, world) {
    const d = y - gy, A = PFK.P32(s.wallRamp || ASHLAR), K = PFK.P32(KERB), C = PFK.P32(COBBLE);
    const wallH = s.wallH ?? 56, gut = s.gutter === false ? 0 : 8;
    if (d === 0) return K[6];
    if (d <= 5) { // albardilla (canto frontal de la losa del bordillo)
      const j = (x + 400) % 28; if (j === 0) return K[1];
      let k = d === 1 ? 5 : d <= 3 ? 4 : 3; if (PFK.cl(x, y, 2, 61) < 0.15) k--; if (j === 1) k++;
      return K[clamp(k, 1, 6)];
    }
    if (d === 6) return A[0];
    if (d < wallH) {
      const yy = d - 7, row = Math.floor(yy / 12), ry = yy % 12;
      const bw = [30, 24, 34, 26, 28][row % 5], off = (row * 13 + 7) % bw, bx = (x + off + 900) % bw, blk = Math.floor((x + off + 900) / bw);
      // panel de azulejos (cada ~360 px, en las dos primeras hiladas)
      if (s.tiles !== false && row < 2) {
        const px = ((x + 900) % 360) - 40;
        if (px >= 0 && px < 26) {
          const tx = Math.floor(px / 5), ty = Math.floor((yy - 2) / 5), lx = px % 5, lyy = (yy - 2) % 5;
          if (yy < 2 || yy > 21) return A[1];
          if (lx === 4 || lyy === 4) return U('#c8c0b4');
          const Z = PFK.P32(AZUL), cx = lx - 1.5, cy = lyy - 1.5, star = Math.abs(cx) + Math.abs(cy) < 1.6;
          return (tx + ty) % 2 ? (star ? Z[2] : Z[4]) : (star ? Z[4] : Z[1]);
        }
      }
      if (ry === 0 || bx === 0) return A[1];
      let k = 5 + Math.round((hash2(blk, row, 63) - 0.5) * 2.4 + (PFK.cl(x, y, 2, 64) - 0.5) * 1.1 + (PFK.vn(x * 0.1, y * 0.12, 65) - 0.5) * 0.9);
      if (ry === 1) k += 2; else if (ry === 11) k -= 2;
      if (bx === 1) k += 1; else if (bx === bw - 1) k -= 2;
      if (ry === 2 && bx > 1 && bx < bw - 2) k += 1;
      // gárgola de desagüe y su chorreón
      const gx = (x + 900) % 190;
      if (row === 0 && gx >= 120 && gx < 124 && ry >= 4 && ry <= 6) return A[0];
      if (gx >= 120 && gx < 124 && row >= 1 && PFK.vn(x * 0.5, y * 0.05, 66) > 0.35) k -= 2;
      // humedad y musgo hacia la base
      if (d > wallH - 10) { k -= 1; if (PFK.cl(x, y, 2, 67) < 0.14) return U(PFK.cl(x, y, 1, 68) < 0.5 ? '#4a5a24' : '#6a7a2e'); }
      if (hash2(x, y, 69) < 0.02) k -= 2;
      return A[clamp(k, 1, 8)];
    }
    const e = d - wallH;
    if (e < 2) return e === 0 ? C[0] : C[1];                             // sombra de contacto del muro
    if (gut && e < 2 + gut) {                                            // acequia con agua turquesa
      const q = e - 2, W_ = PFK.P32(ACEQ);
      if (q === 0) return K[5]; if (q === gut - 1) return K[2];
      if (q === 1) return W_[1];
      const ripple = Math.sin(x * 0.21 + q * 1.7) + (PFK.vn(x * 0.05, q, 71) - 0.5) * 2;
      let k = 3 + (q > gut - 3 ? -1 : 0) + (ripple > 1.1 ? 2 : ripple < -0.9 ? -1 : 0);
      if (hash2(x, q, 72) < 0.03) k = 6;
      return W_[clamp(k, 1, 6)];
    }
    // empedrado inferior (cantos redondeados que crecen hacia la cámara) con banda central gastada
    const z = e - 2 - gut, sc = 1 + z / 70;
    if (z < 3) return z === 0 ? K[3] : C[2];                               // bordillo de la acequia
    const u = T.boulderPix(x, y, (s.seed | 0) + 77, Math.round(9 * sc), Math.round(6 * sc), C);
    let col = u === -1 ? C[1] : u;
    const wear = Math.max(0, 1 - Math.abs(z - 26) / 14) * (0.5 + PFK.vn(x * 0.02, 0, 79) * 0.6);
    if (u !== -1 && wear > 0.25) col = PFK.shU(col, wear * 0.14);
    const dark = clamp((z - 8) / 110, 0, 0.42);
    if (dark > 0.02) col = PFK.shU(col, -dark, 250);
    return col;
  }
  /** Decoración del muro: buganvillas que cuelgan, caños que vierten a la acequia, faroles de pared,
      rejillas, macetas al pie, pilastras en los extremos. Anclas dinámicas en world.pfSpouts / world.pfLamps. */
  function plazaWallPost(pb, world, s) {
    const r = RNG((s.seed | 0) + 401), wallH = s.wallH ?? 56, gut = s.gutter === false ? 0 : 8;
    world.pfSpouts = world.pfSpouts || []; world.pfLamps = world.pfLamps || [];
    const K = PFK.P32(KERB), A = PFK.P32(ASHLAR), I = PFK.P32(['#0e0c14', '#1e1c26', '#34323e', '#4c4a58', '#6c6a7a', '#9a98a8']);
    const LF = PFK.P32(['#0e1c0a', '#1a3414', '#2a4f1e', '#3f6a26', '#5f8a2c']), BR = PFK.P32(RAMP.bougainR.concat(['#ff8ad0']));
    const gyAt = (x) => world.ground[clamp(Math.round(x), 0, world.w)];
    const cascade = (x0) => {
      const w = 14 + r.int(0, 18), L = 18 + r.int(0, 26), gy = gyAt(x0 + w / 2);
      for (let i = 0; i < w * L * 0.55; i++) {
        const fx = r(), fy = Math.pow(r(), 1.4), xx = Math.round(x0 + fx * w + Math.sin(fy * 6 + x0) * 2), yy = Math.round(gy - 3 + fy * L * (1 - Math.abs(fx - 0.5) * 0.9));
        const c = r() < 0.42 ? BR[clamp(Math.round(1.6 - fy * 1.2 + (r() - 0.5) * 1.6 + (fx < 0.4 ? 1 : 0)), 0, 3)] : LF[clamp(Math.round(3 - fy * 2 + (r() - 0.5) * 1.5), 0, 4)];
        PFK.put(pb, xx, yy, c); if (r() < 0.4) PFK.put(pb, xx + 1, yy, c);
      }
    };
    const spout = (x) => {
      const gy = gyAt(x), sy = gy + 22;
      for (let yy = sy - 4; yy < sy + 4; yy++) for (let xx = x - 5; xx < x + 6; xx++) PFK.put(pb, xx, yy, K[clamp(yy === sy - 4 ? 6 : 4 - (xx > x + 2 ? 2 : 0) + (yy > sy + 1 ? -1 : 0), 0, 6)]);
      for (let xx = x - 2; xx < x + 3; xx++) PFK.put(pb, xx, sy + 4, A[0]);
      PFK.put(pb, x, sy + 1, U('#0a1a24')); PFK.put(pb, x + 1, sy + 1, U('#0a1a24'));
      // chorro estático que cae en la acequia
      const yb = gy + wallH + 3;
      for (let yy = sy + 2; yy < yb; yy++) { const off = Math.round(Math.sqrt(yy - sy) * 0.8); PFK.put(pb, x + off, yy, U((yy % 3) ? '#9cf0f8' : '#e6fdff')); PFK.put(pb, x + off + 1, yy, U('#3adcf1')); }
      for (let k = -4; k <= 6; k++) PFK.put(pb, x + 4 + k, yb + 1, U(Math.abs(k) < 3 ? '#ffffff' : '#b8f4fa'));
      world.pfSpouts.push([x, sy + 2, yb]);
    };
    const sconce = (x) => {
      const gy = gyAt(x), ly = gy + 14;
      for (let k = 0; k < 6; k++) PFK.put(pb, x + k, ly + 6 - Math.round(k * 0.4), I[3]);
      for (let yy = ly; yy < ly + 9; yy++) for (let k = -2; k <= 2; k++) PFK.put(pb, x + 6 + k, yy, Math.abs(k) === 2 || yy === ly || yy === ly + 8 ? I[1] : U(['#fde8a0', '#f0c860', '#c89838'][Math.min(2, Math.abs(k) + (yy > ly + 5 ? 1 : 0))]));
      PFK.put(pb, x + 6, ly - 1, I[4]); PFK.put(pb, x + 6, ly - 2, I[3]);
      world.pfLamps.push([x + 6, ly + 4]);
    };
    const grate = (x) => {
      const gy = gyAt(x), y0 = gy + wallH - 14;
      for (let yy = y0; yy < gy + wallH; yy++) for (let xx = x - 6; xx <= x + 6; xx++) { const dx = xx - x, dy = yy - y0; if (dy < 6 && dx * dx / 36 + (6 - dy) * (6 - dy) / 36 > 1) continue; PFK.put(pb, xx, yy, (Math.abs(dx) === 6 || dy === 0) ? K[5] : (dx % 3 === 0 ? I[3] : U('#05080e'))); }
    };
    const potsAt = (x) => {
      const gy = gyAt(x), yb = gy + wallH + gut + 9;
      PFArch.pots(pb, x, yb, 2 + r.int(0, 2), x);
    };
    const cat = (x) => { // gato naranja dormido sobre el bordillo de la acequia
      const gy = gyAt(x), yb = gy + wallH + gut + 4, O = ['#5a2a0a', '#a8501a', '#e08a3a', '#f8c070'];
      PFK.ellipseFn(pb, x, yb - 3, 6, 3, (nx, ny) => U(O[clamp(Math.round(2 - ny * 1.2 - nx * 0.4), 0, 3)]));
      PFK.ellipseFn(pb, x - 6, yb - 4, 2.6, 2.4, (nx, ny) => U(O[clamp(Math.round(2.4 - ny - nx * 0.4), 0, 3)]));
      PFK.put(pb, x - 7, yb - 7, U(O[2])); PFK.put(pb, x - 5, yb - 7, U(O[2])); PFK.put(pb, x - 7, yb - 4, U('#2a1408'));
      for (let k = 0; k < 6; k++) PFK.put(pb, x + 5 + k, yb - 1 - (k > 3 ? 1 : 0), U(O[k % 2 ? 1 : 2]));
    };
    for (let x = s.x0 + 30 + r.int(0, 40); x < s.x1 - 30; x += 70 + r.int(0, 70)) {
      const k = r();
      if (k < 0.34) cascade(x); else if (k < 0.5) spout(x); else if (k < 0.68) sconce(x); else if (k < 0.8) grate(x); else potsAt(x);
      if (r() < 0.35) potsAt(x + 30 + r.int(0, 20));
      if (r() < 0.06) cat(x + 40);
    }
    // pilastras en los extremos del muro
    for (const xe of [s.x0, s.x1]) {
      if (xe <= 0 || xe >= world.w) continue;
      const gy = gyAt(xe), px0 = xe === s.x0 ? xe : xe - 10;
      for (let yy = gy; yy < gy + wallH + gut + 4; yy++) for (let xx = px0; xx < px0 + 10; xx++) { const lx = xx - px0; PFK.put(pb, xx, yy, yy < gy + 5 ? K[yy === gy ? 6 : 5] : A[clamp((lx < 2 ? 7 : lx > 7 ? 2 : 5) - ((yy - gy) % 14 === 0 ? 3 : 0), 0, 8)]); }
    }
  }

  /* ================= INTERIOR: suelo de resina y losa con galería ================= */
  const FROWS = [6, 5, 4, 4, 3, 3, 3, 3, 2, 2, 2, 2];
  function floorSurf(s, x, y, gy, D, back, t, dz) {
    const F = PFK.P32(s.ramp || FLOOR), S = PFK.P32(STEEL);
    if (y - back < 1) return F[1];
    if (y - back < 2) return F[3];
    if (dz === 1) return S[7];
    if (dz === 2) return S[5];
    if (dz <= 5) return ((x + dz) % 8 < 4) ? U('#f0c040') : U('#24242c');      // franja de seguridad
    if (dz === 6) return F[2];
    const [ri, ly, rh] = rowOf(dz - 7, FROWS);
    const sw = [40, 36, 32, 30, 28, 26, 24, 22, 20, 19, 18, 17][ri], off = ri * 9, jx = (x + off + 800) % sw, tile = Math.floor((x + off + 800) / sw);
    if (ly === rh - 1 || jx === 0) return F[4];
    let k = 7 - Math.round(t * 1.6) + Math.round((hash2(tile, ri, 81) - 0.5) * 1.2);
    // reflejos de ventanales y luminarias: bandas verticales suaves
    const refl = PFK.vn(x * 0.018 + 3, 0, 82 + (s.seed | 0));
    if (refl > 0.62) k += 1; if (refl > 0.74 && (x % 3 !== 0)) k += 1;
    if (jx === 1) k += 1;
    if (PFK.cl(x, y, 3, 83) < 0.06) k -= 1;
    return F[clamp(k, 3, 9)];
  }
  /** Losa con canto de acero + sección de hormigón + galería de servicio (los tubos los pinta el nivel) */
  function slabFace(s, x, y, gy, world) {
    const d = y - gy, S = PFK.P32(STEEL), C = PFK.P32(SLABC), G = PFK.P32(GAL);
    const slabH = s.slabH ?? 16, floorY = (world.h - (s.galFloor ?? 16));
    if (d === 0) return S[7];
    if (d <= 3) return S[[6, 4, 2][d - 1]];
    if (d === 4) return S[0];
    if (d < slabH) { // hormigón cortado con árido y armaduras
      if (d === slabH - 1) return C[1];
      const rb = (x + 600) % 16;
      if (d === 9 && rb >= 7 && rb <= 8) return U('#3a2a22');
      let k = 5 + Math.round((PFK.cl(x, y, 1, 91) - 0.5) * 2.2 - (d - 5) * 0.08);
      if (hash2(x, y, 92) < 0.08) k -= 2; else if (hash2(x, y, 93) < 0.05) k += 1;
      return C[clamp(k, 2, 7)];
    }
    const e = d - slabH;
    // pilares de la galería
    const pp = s.pier ?? 150, px = (x + (s.pierOff ?? 40) + 3000) % pp;
    if (px < 14) {
      if (px === 0) return C[1]; if (px === 13) return C[0];
      let k = px < 3 ? 6 : px < 6 ? 5 : px < 10 ? 4 : 3;
      if (e < 4) k -= 2;
      if (PFK.cl(x, y, 2, 94) < 0.12) k--;
      return C[clamp(k, 1, 7)];
    }
    if (px < 16) return G[0];                                            // sombra del pilar
    if (y >= floorY) { // suelo de rejilla de la galería
      const q = y - floorY;
      if (q === 0) return S[4];
      return ((x % 4 === 0) || (q % 3 === 0)) ? G[3] : G[1];
    }
    // muro del fondo: paneles con juntas, más claro bajo las luminarias de la galería
    const lamp = (x + 75 + 3000) % pp, near = Math.max(0, 1 - Math.abs(lamp - pp / 2) / 46);
    let k = 1 + (e > 6 ? 1 : 0) + Math.round(near * 2.2 * clamp((e - 2) / 20, 0, 1));
    if ((x + 3000) % 30 === 0) k -= 1;
    if (e === 0) return G[0];
    if (e === 1 && lamp > pp / 2 - 6 && lamp < pp / 2 + 6) return U('#fff2c8');   // luminaria bajo la losa
    return G[clamp(k, 0, 6)];
  }

  /* ================= DUNAS ================= */
  function duneSurf(s, x, y, gy, D, back, t, dz) {
    const S = PFK.P32(SANDF), V = PFK.P32(VIO);
    if (dz === 1) return S[9];
    let tt = 0.88 - t * 0.2 + (PFK.vn(x * 0.04, y * 0.25, 101) - 0.5) * 0.14;
    const rip = (y * 1.4 + Math.sin(x * 0.06 + y * 0.12) * 3.5 + PFK.vn(x * 0.015, y * 0.1, 102) * 7) % 5;
    if (rip < 1) { if (PFK.vn(x * 0.05, y * 0.2, 103) > 0.55) return V[4]; tt -= 0.14; } else if (rip < 2) tt += 0.05;
    if (hash2(x, y, 104) < 0.006) return S[3];
    return S[clamp(Math.round(tt * 9), 3, 9)];
  }
  /** Ladera de arena esculpida: campo de alturas con luz arriba-izquierda; sotavento violeta */
  function hgt(x, y, sd) { return PFK.vn(x * 0.018, y * 0.03, sd) * 18 + PFK.vn(x * 0.05, y * 0.07, sd + 1) * 5; }
  function duneFace(s, x, y, gy, world) {
    const d = y - gy, S = PFK.P32(SANDF), V = PFK.P32(VIO), sd = 110 + (s.seed | 0) % 50;
    if (d === 0) return S[9];
    if (d === 1) return S[8];
    const hx = hgt(x + 1, y, sd) - hgt(x - 1, y, sd), hy = hgt(x, y + 1, sd) - hgt(x, y - 1, sd);
    let lam = 0.5 - hx * 0.13 - hy * 0.1 - d * 0.0035;
    const rip = (y * 0.9 + Math.sin(x * 0.04) * 4 + hgt(x, y, sd) * 0.6) % 6;
    if (rip < 1) lam -= 0.12; else if (rip < 2) lam += 0.04;
    lam += (PFK.cl(x, y, 2, sd + 3) - 0.5) * 0.06;
    // piedras semienterradas y matas secas (puntos)
    const hh = hash2(x >> 2, y >> 2, sd + 4);
    if (hh < 0.012 && d > 10) { const u = T.boulderPix(x, y, sd + 5, 7, 5, PFK.P32(RAMP.rockWarmR)); if (u !== -1) return u; }
    if (lam < 0.3) { const k = clamp(Math.round((lam + 0.15) * 9), 0, 5); return V[k]; }
    return S[clamp(Math.round(lam * 10), 3, 9)];
  }

  /* ================= PRADERA (acantilados eólicos) ================= */
  function meadowSurf(s, x, y, gy, D, back, t, dz) {
    const G = PFK.P32(RAMP.grassR), F = PFK.P32(RAMP.foliageR), S = PFK.P32(SANDF);
    if (dz === 1) return G[6];
    if (y - back < 1) return F[2];
    // sendero de tierra gastado en la franja media
    const pathC = 0.45 + (PFK.vn(x * 0.01, 0, 121) - 0.5) * 0.3, pw = 0.16 + PFK.vn(x * 0.02, 1, 122) * 0.08;
    if (s.path !== false && Math.abs(t - pathC) < pw) {
      let k = 7 - Math.round(Math.abs(t - pathC) / pw * 2) + (PFK.cl(x, y, 2, 123) < 0.2 ? -1 : 0);
      if (hash2(x, y, 124) < 0.03) k -= 2;
      return S[clamp(k, 3, 9)];
    }
    // briznas inclinadas por el viento (columnas desplazadas por fila)
    const bl = (x + Math.floor(dz * 0.6)) % 3;
    let k = 4 - Math.round(t * 2) + (bl === 0 ? 1 : bl === 2 ? -1 : 0) + Math.round((PFK.vn(x * 0.08, y * 0.3, 125) - 0.5) * 2);
    const hh = hash2(x, y, 126);
    if (hh < 0.012) return U(['#f478b8', '#fff2c0', '#ffd84a', '#c9a8f0'][Math.floor(hh * 333) % 4]);
    if (hh > 0.985) return F[1];
    return G[clamp(k, 1, 6)];
  }

  /* ================= SALINAS ================= */
  function cellPix(x, y, cw, ch, seed) {
    const gx = Math.floor(x / cw), gyc = Math.floor(y / ch);
    let d1 = 9, d2 = 9, id = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const cx = gx + i, cy = gyc + j;
      const px = (cx + 0.15 + hash2(cx, cy, seed) * 0.7) * cw, py = (cy + 0.15 + hash2(cx, cy, seed + 1) * 0.7) * ch;
      const dd = Math.hypot((x - px) / cw, (y - py) / ch);
      if (dd < d1) { d2 = d1; d1 = dd; id = cx * 131 + cy; } else if (dd < d2) d2 = dd;
    }
    return [d2 - d1, id];
  }
  function saltSurf(s, x, y, gy, D, back, t, dz) {
    const P = PFK.P32(s.ramp || SALT), B = PFK.P32(BRINEP);
    if (dz === 1) return P[8];
    if (y - back < 1) return P[3];
    const [e, id] = cellPix(x, y * 2.2, 15, 15, 131 + (s.seed | 0));
    if (e < 0.06) return P[8];                                             // cresta de la placa (sal recristalizada)
    if (e < 0.12) return P[4];                                             // sombra de la cresta
    // charcos de salmuera rosada en algunas placas
    if (hash2(id, 3, 132) < (s.pools ?? 0.12)) { const k = 3 + Math.round((1 - t) * 1.5 + (PFK.cl(x, y, 2, 133) - 0.5)); return B[clamp(k, 2, 5)]; }
    let k = 6 - Math.round(t * 1.5) + Math.round((hash2(id, 1, 134) - 0.5) * 2 + (PFK.cl(x, y, 2, 135) - 0.5));
    if (hash2(x, y, 136) < 0.02) k = 8;
    return P[clamp(k, 3, 8)];
  }
  /** Costra salina estratificada: capas blancas de sal, lodo violeta, vetas rosadas y filtraciones */
  function saltFlatFace(s, x, y, gy, world) {
    const d = y - gy, P = PFK.P32(SALT), M = PFK.P32(MUD), B = PFK.P32(BRINEP);
    if (d === 0) return P[8];
    if (d < 4) return P[7 - d];
    const wav = Math.round((PFK.vn(x * 0.03, 0, 141) - 0.5) * 6 + Math.sin(x * 0.02) * 2);
    const z = d + wav, band = Math.floor(z / 9), by = z % 9;
    const salt = band % 3 === 0;
    let col;
    if (salt) { let k = 6 - (by > 6 ? 2 : 0) + (by === 0 ? 1 : 0) + Math.round((PFK.cl(x, y, 2, 142) - 0.5) * 1.6); col = P[clamp(k - Math.floor(d / 40), 2, 8)]; }
    else { let k = 3 - (by > 6 ? 1 : 0) + Math.round((PFK.cl(x, y, 2, 143) - 0.5) * 1.6) - Math.floor(d / 50); col = M[clamp(k, 0, 5)]; if (by === 0) col = P[3]; }
    // cristales que brillan y filtraciones de salmuera
    if (hash2(x, y, 144) < 0.012) col = P[8];
    if (PFK.vn(x * 0.4, y * 0.02, 145) > 0.84 && !salt) col = B[2 + (hash2(x, y, 146) < 0.3 ? 1 : 0)];
    return col;
  }

  /* ================= plataformas horneadas ================= */
  /** Caja de madera grande en 3/4 (top = p.y), alto p.h (16) */
  function crate3q(pb, p) {
    const x = Math.round(p.x), y = Math.round(p.y), w = p.w, h = p.h || 16, d = p.d ?? 7;
    const Wd = ['#2a1408', '#4a2a14', '#6e4422', '#8e5e32', '#b07e4a', '#d0a46a', '#ecc890'];
    const P = PFK.P32(Wd);
    PFInfra.box3q(pb, x, y + h, w, h, d, {
      ramp: Wd, skew: 0.5,
      front: (xx, yy, u, v) => { const lx = xx - x, ly = yy - y; if (lx < 2 || lx > w - 3 || ly < 2 || ly > h - 3) return P[ly < 2 ? 5 : 3]; if (Math.abs((lx - 2) / (w - 5) - (ly - 2) / (h - 5)) < 0.09) return P[4]; return P[(ly % 4 === 0) ? 2 : 3 + (PFK.cl(xx, yy, 2, 5) < 0.2 ? -1 : 0)]; },
      top: (xx, yy, u, v) => P[((xx - x) % 5 === 0) ? 4 : 6 - Math.round(v)],
      side: (xx, yy) => P[((yy) % 4 === 0) ? 0 : 1],
    });
    // estarcido de la cooperativa
    for (let k = 0; k < 3; k++) PFK.put(pb, x + Math.round(w / 2) - 1 + k, y + Math.round(h / 2), U('#3a1e0c'));
  }
  /** Tarima de madera en 3/4 (balcón/estrado): tablones con cara superior y montantes */
  function woodDeck(pb, p) {
    const x = Math.round(p.x), y = Math.round(p.y), w = p.w, d = p.d ?? 8;
    const Wd = ['#1e0e06', '#3a1e10', '#5a3420', '#7a4e30', '#9a6a44', '#c08e60', '#e2b88a'];
    const P = PFK.P32(Wd);
    for (let r = 0; r < d; r++) { const off = Math.round(r * 0.5); for (let xx = x + off; xx < x + w + off; xx++) PFK.put(pb, xx, y - 1 - r, P[(xx - x - off) % 9 === 0 ? 3 : 6 - Math.round(r / d * 2)]); }
    for (let xx = x; xx < x + w; xx++) { PFK.put(pb, xx, y, P[6]); PFK.put(pb, xx, y + 1, P[4]); PFK.put(pb, xx, y + 2, P[4]); PFK.put(pb, xx, y + 3, P[2]); PFK.put(pb, xx, y + 4, P[0]); }
    if (p.post) for (let k = 8; k < w - 4; k += 34) for (let yy = y + 5; yy < y + 5 + p.post; yy++) { PFK.put(pb, x + k, yy, P[4]); PFK.put(pb, x + k + 1, yy, P[2]); PFK.put(pb, x + k + 2, yy, P[1]); }
  }

  T.register('plaza', { surf: plazaSurf, depth: 22, flat: true });
  T.register('plazaWall', { face: plazaWall, post: plazaWallPost });
  T.register('floor', { surf: floorSurf, depth: 24, flat: true });
  T.register('slab', { face: slabFace });
  T.register('dune', { surf: duneSurf, face: duneFace, depth: 16 });
  T.register('meadow', { surf: meadowSurf, depth: 14 });
  T.register('saltcrust', { surf: saltSurf, depth: 14 });
  T.register('saltflat', { face: saltFlatFace });
  T.PLAT_EXT.crate3q = crate3q;
  T.PLAT_EXT.woodDeck = woodDeck;
  T.PLAT_EXT.none = () => { };
  return { PSTONE, KERB, ASHLAR, COBBLE, ACEQ, FLOOR, SLABC, GAL, VIO, SALT, MUD, BRINEP, MOSAIC, AZUL, crate3q, woodDeck, cellPix };
})();
