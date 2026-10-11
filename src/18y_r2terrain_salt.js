/* =====================================================================
   18y_r2terrain_salt.js — Talud salino esculpido (ronda 2, cara 'saltflat').
   Sustituye las bandas planas del talud del Nivel 03 por un CAMPO DE
   ALTURAS sombreado con R2TERRAIN_Urban.shade (luz arriba-izquierda,
   sombra arrojada granate-violeta, oclusión de cavidad):
     · costra de sal en placas poligonales abombadas, con rebordes de
       presión iluminados y grietas; la costra vuela sobre el lodo y
       arroja su sombra;
     · estratos de lodo (6–12 px) con saliente propio que varía con x:
       canto superior redondeado al sol y base socavada en sombra;
     · banda de yeso rosado saliente (cornisa) con juntas;
     · lentes de sal en relieve (nódulos blancos con cresta iluminada);
     · cárcavas verticales en V que cortan los estratos cada 40–90 px
       (rompen la lectura en bandas a 640 px);
     · raíces de salicornia, goteos de salmuera y geodas (colores fijos).
   API: R2TERRAIN_Salt.build(s, world) · pix(s,x,y,gy,world) → u32.
   Por defecto en 'saltflat' (s.r2 === false → versión anterior).
   ===================================================================== */
const R2TERRAIN_Salt = (() => {
  const K = PFK, NONE = -999;
  const SALT = ['#2e2140', '#4a3660', '#6a5280', '#8c74a0', '#ae96ba', '#cab4cc', '#e2d0dc', '#f2e4ea', '#fdf6f6'];
  const MUD = ['#160c1c', '#24142a', '#361e38', '#4c2c44', '#663c4e', '#82525a', '#9c6a66', '#b4846e'];
  const GYPS = ['#4a2a3e', '#6e4656', '#9a6c70', '#c4968c', '#e2bca8', '#f6dcc6'];
  const BRINEP = ['#2a0e3a', '#4a1a5a', '#7a2a7e', '#b04aa0', '#e07ecf', '#f8c8ee'];
  const GEO = ['#2a3a7a', '#4a72b8', '#8ac8ec', '#d8f6ff', '#ffffff'];

  /** Tabla de estratos (grosor 5–14 px por capa) indexada por profundidad + 40 */
  const _lt = new Map();
  function layers(sd) {
    let T = _lt.get(sd); if (T) return T; T = [];
    for (let ti = 0; T.length < 600; ti++) { const th = 5 + Math.floor(hash1(ti, sd + 19) * 10); for (let k = 0; k < th; k++) T.push([ti, k, th]); }
    _lt.set(sd, T); return T;
  }
  function build(s, world) {
    const sd = 141 + ((s.saltSeed ?? 0) % 30);
    const bx0 = Math.floor(s.x0) - 24, bx1 = Math.ceil(s.x1) + 24, w = bx1 - bx0, h = world.h;
    const N = w * h, H = new Float32Array(N).fill(NONE), A = new Float32Array(N), M = new Uint8Array(N), FIX = new Uint32Array(N), F = new Uint8Array(N);
    const gyA = new Int16Array(w);
    for (let i = 0; i < w; i++) gyA[i] = Math.round(world.ground[clamp(bx0 + i, 0, world.w)]);
    const P = SALT.map(U), B = BRINEP.map(U), GE = GEO.map(U);
    const L = (xx, yy) => K.vn(xx * 0.045, yy * 0.13, sd + 2);
    for (let xi = 0; xi < w; xi++) {
      const x = bx0 + xi, gy = gyA[xi];
      const n1 = (K.vn(x * 0.02, 0, sd) - 0.5) * 8 + (K.vn(x * 0.07, 1, sd) - 0.5) * 3;
      const crust = Math.round(11 + n1 * 0.6), gyp = Math.round(40 + n1 * 1.4), deep = Math.round(70 + n1);
      // cárcava: surco en V de anchura variable que baja desde la costra
      const gc = Math.floor((x + 3000) / 64), gx = gc * 64 - 3000 + 10 + Math.floor(hash1(gc, sd + 30) * 40), gw = 4 + Math.floor(hash1(gc, sd + 31) * 6);
      const gd = 30 + Math.floor(hash1(gc, sd + 32) * 70), gdx = Math.abs(x - gx);
      // raíces de salicornia
      const rc = Math.floor((x + 3000) / 23), rx = rc * 23 - 3000 + Math.floor(hash1(rc, sd + 4) * 18), rlen = 14 + Math.floor(hash1(rc, sd + 5) * 22);
      const sc = Math.floor((x + 3000) / 37), sx = sc * 37 - 3000 + Math.floor(hash1(sc, sd + 6) * 30), sl = 6 + Math.floor(hash1(sc, sd + 7) * 14), drip = hash1(sc, sd + 8) < 0.45;
      for (let y = Math.max(0, gy); y < h; y++) {
        const d = y - gy, i = y * w + xi;
        let hg = 0, alb = 1, m = 1, fix = 0, fl = 0;
        if (d < 3) { m = 0; hg = 9 - d * 0.6; alb = 1.32 - d * 0.06; if (d === 0) fl = 1; }
        else if (d < crust) {
          // placas de sal poligonales abombadas, rebordes de presión y grietas
          m = 0;
          const cw = 13, ch = 6, ggx = Math.floor(x / cw), ggy = Math.floor(d / ch);
          let d1 = 1e9, d2 = 1e9, id = 0, px0 = 0, py0 = 0;
          for (let jj = -1; jj <= 1; jj++) for (let ii = -1; ii <= 1; ii++) {
            const cx = ggx + ii, cy = ggy + jj, px = (cx + 0.15 + hash2(cx, cy, sd) * 0.7) * cw, py = (cy + 0.15 + hash2(cx, cy, sd + 1) * 0.7) * ch;
            const ex = (x - px) / cw, ey = (d - py) / ch, dd = ex * ex + ey * ey;
            if (dd < d1) { d2 = d1; d1 = dd; id = cx * 131 + cy; px0 = px; py0 = py; } else if (dd < d2) d2 = dd;
          }
          const e = Math.sqrt(d2) - Math.sqrt(d1);
          hg = 8 + (hash1(id, sd + 3) - 0.5) * 0.5 * (x - px0) * 0.25 + (hash1(id, sd + 9) - 0.5) * 0.6 * (d - py0) * 0.3 - (d >= crust - 2 ? 0.6 : 0);
          if (e < 0.07) { hg -= 2.2; alb = 0.8; } else if (e < 0.16) { hg += 0.9; alb = 1.08; }
          alb += 0.22 + (hash1(id, sd + 10) - 0.5) * 0.1;
        } else if (d >= gyp - 3 && d < gyp + 3) {
          // cornisa de yeso rosado: saliente con canto redondeado, juntas
          m = 2; const ly = d - (gyp - 3), jw = 18 + Math.floor(hash1(Math.floor(x / 24), sd + 2) * 12), j = ((x + sd) % jw + jw) % jw;
          hg = 5.5 - (ly === 0 ? 1.4 : ly === 5 ? 1.2 : 0) + (K.vn(x * 0.05, 3, sd + 11) - 0.5) * 2;
          if (j === 0) hg -= 1.8;
          alb = 1.02 + (hash1(Math.floor((x + sd) / jw), sd + 12) - 0.5) * 0.08;
        } else {
          // estratos de lodo con saliente propio (canto superior redondeado, base socavada)
          m = 1; const dd = d - crust;
          const sv = d + n1 * 0.5 + (K.vn(x * 0.03, 5, sd + 13) - 0.5) * 3;
          const LT = layers(sd), svi = clamp(Math.floor(sv) + 40, 0, LT.length - 1), ti = LT[svi][0], th = LT[svi][2], tb = LT[svi][1] + (sv - Math.floor(sv));
          const pro = (hash1(ti, sd + 14) * 4 + (K.vn(x * 0.018, ti, sd + 15) - 0.5) * 5) * (d < deep ? 1 : 0.6);
          const top = tb, bot = th - 1 - tb;
          hg = pro + (top < 2.5 ? -(2.5 - top) * (2.5 - top) * 0.55 : 0) - (bot < 2 ? (2 - bot) * 1.1 : 0);
          const band = ((ti % 3) + 3) % 3; alb = 1.06 + (band === 1 ? -0.08 : band === 2 ? 0.05 : 0) - Math.min(0.2, dd / 220);
          if (band === 2) fix = 0;
          // lentes de sal en relieve
          const lv = L(x, y);
          if (lv > 0.68 && d < deep + 10) { m = 0; hg += 1.5 + (lv - 0.68) * 14; alb = 1.12 + (lv - 0.68) * 1.6; }
          // juntas de bloque
          const jw = 30 + Math.floor(hash1(ti, sd + 16) * 34), jo = Math.floor(hash1(ti, sd + 17) * 60);
          if (hash2(Math.floor((x + jo + 3000) / jw), ti, sd + 18) < 0.5 && ((x + jo + 3000) % jw) === 0) hg -= 1.6;
          if (d >= deep) { alb -= 0.08; m = 3; }
          // geodas en el lodo profundo
          if (d >= deep) {
            const gcx = Math.floor((x + 3000) / 29), gr = Math.floor((d - deep) / 17), gxx = gcx * 29 - 3000 + 6 + Math.floor(hash2(gcx, gr, sd + 9) * 16), gyy = deep + gr * 17 + 7;
            if (hash2(gcx, gr, sd + 10) < 0.35) { const ex = x - gxx, ey = d - gyy; if (ex >= 0 && ex < 3 && ey >= 0 && ey < 3) { fix = GE[ey === 0 ? (ex === 0 ? 4 : 3) : ex === 2 ? 1 : 2]; hg += 1; } }
          }
          // raíz de salicornia y goteo de salmuera
          if (dd < rlen && x === rx + Math.round(Math.sin(d * 0.28 + rc) * 1.6)) { fix = U(dd < rlen - 3 ? '#5a2238' : '#8a3a50'); hg -= 0.5; }
          if (drip && x === sx && d > gyp + 3 && d < gyp + 3 + sl) { fix = B[d === gyp + 4 ? 5 : 3]; fl = 3; }
        }
        // cárcava en V (corta costra y estratos hasta gd)
        if (gdx < gw && d >= 3 && d < gd) {
          const q = 1 - gdx / gw, fade = Math.min(1, (gd - d) / 18) * Math.min(1, (d - 2) / 4);
          hg -= q * 7 * fade; if (q > 0.7 && fade > 0.5) fl = fl || 2;
        }
        H[i] = hg; A[i] = alb; M[i] = m; FIX[i] = fix; F[i] = fl;
      }
    }
    const R = R2TERRAIN_Rock.ramp17;
    const mats = [R(s.ramp || SALT, '#2a1846'), R(MUD, '#120a24'), R(GYPS, '#2a1438'), R(MUD.slice(0, 6), '#0e0a2a')];
    const buf = R2TERRAIN_Urban.shade({ w, h, bx0, H, A, M, FIX, F, mats, gyA, seed: sd, dark: [70, 120, 0.32], darkHue: '#1a0a2e', noise: 0.05, grain1: true });
    return { bx0, w, h, buf };
  }
  function pix(s, x, y, gy, world) {
    let R = s._r2salt; if (!R) R = s._r2salt = build(s, world);
    const xi = x - R.bx0; if (xi < 0 || xi >= R.w || y < 0 || y >= R.h) return 0;
    return R.buf[y * R.w + xi];
  }
  return { build, pix };
})();
