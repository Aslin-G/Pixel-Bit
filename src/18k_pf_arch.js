/* =====================================================================
   18k_pf_arch.js — Arquitectura y mobiliario urbano del plano jugable
   (kit PF, rollout A) a escala de personaje ≈ 74 px: mostrador ≈ 34 px,
   toldos ≈ 96–104 px, farolas ≈ 104 px, bancos con asiento a 16 px.
   Todo en 3/4 con cara superior, rampas de material, contorno selectivo
   (sprite temporal + PFK.selOut), sombra proyectada sobre el suelo ya
   pintado (luz arriba-izquierda → sombra hacia arriba-derecha) y sombra
   de contacto. Coordenadas (x, y) = esquina frontal izquierda en el suelo.
   API (PFArch):
     spr(w,h,fn,{out,amt,sides}) → PixelBuffer   · place(dst,spr,x,y)
     castShadow(pb,x,y,w,depth,k,slant) · contact(pb,x0,x1,y,k)
     stall(pb,x,y,w,{c1,c2,goods,seed,sign}) → {x,y,w,top,lamps:[[x,y]]}
     planter(pb,x,y,w,{h,d,kind,seed,ramp})      · lamp(pb,x,y,{h,arms,basket}) → {lx,ly}
     bench(pb,x,y,w,{seed})                       · fountain(pb,cx,y,rx,{seed}) → {jets:[[x,y]],bowls}
     bunting(pb,x0,y0,x1,y1,sag,{cols,step,size}) · crate(pb,x,y,w,h,d,{label})
     sack(pb,x,y,{col}) · barrel(pb,x,y,{r,h,ramp}) · cafeTable(pb,x,y,{umbrella,cols,seed})
     flagpole(pb,x,y,h) → {fx,fy} · poster(pb,x,y,w,h,{cols,seed}) · manhole(pb,cx,cy)
     aframe(pb,x,y,text) · bicycle(pb,x,y,{col}) · pots(pb,x,y,n,seed) · balloonCart(pb,x,y)
   ===================================================================== */
const PFArch = (() => {
  const put = PFK.put, P32 = PFK.P32;
  const WOOD = ['#1e0e06', '#3a1e10', '#5a3420', '#7a4e30', '#9a6a44', '#c08e60', '#e2b88a', '#f4d8b0'];
  const IRON = ['#0e0c14', '#1e1c26', '#34323e', '#4c4a58', '#6c6a7a', '#9a98a8'];
  const TERRA = ['#3a1408', '#5e2410', '#86381c', '#a8502a', '#c86c3a', '#e08c52', '#f0ac74'];
  const WHITE = ['#5a5466', '#7e7686', '#a39aa4', '#c4bcc0', '#ddd6d4', '#efe9e2', '#faf6ee', '#ffffff'];
  const CREAM = ['#4a3a2c', '#6e5a44', '#94806a', '#b8a48a', '#d4c2a6', '#e8dac2', '#f6eedc'];
  const GLASSW = ['#3a2a10', '#7a5a20', '#c89838', '#f0c860', '#fde8a0', '#fffbe0'];
  const FRUIT = ['#ff8a2a', '#ffc040', '#e8402e', '#8ad040', '#c02a8a', '#ffe060'];

  /* ---------- utilidades ---------- */
  function spr(w, h, fn, o = {}) { const pb = new PixelBuffer(w, h); fn(pb); if (o.out !== false) PFK.selOut(pb, o.amt ?? -0.62, o.sides || 'lrb'); return pb; }
  function place(dst, s, x, y) { PFK.blit(dst, s, Math.round(x), Math.round(y)); }
  /** Sombra proyectada sobre lo ya pintado: paralelogramo que sube hacia la derecha */
  function castShadow(pb, x, y, w, depth, k = -0.26, slant = 0.9) {
    for (let r = 0; r < depth; r++) {
      const yy = Math.round(y) - 1 - r, sh = Math.round(r * slant), kk = k * (1 - (r / depth) * 0.5);
      for (let xx = Math.round(x) + sh; xx < Math.round(x + w) + sh; xx++) { const c = PFK.get(pb, xx, yy); if (c >>> 24) put(pb, xx, yy, PFK.shU(c, kk, 20)); }
    }
  }
  function contact(pb, x0, x1, y, k = -0.4) { for (let xx = Math.round(x0); xx < x1; xx++) { const c = PFK.get(pb, xx, y); if (c >>> 24) put(pb, xx, y, PFK.shU(c, k, 20)); } }
  function rect(pb, x, y, w, h, u) { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) put(pb, xx, yy, u); }
  function vbar(pb, x, y0, y1, R, k = [4, 2, 1]) { for (let yy = y0; yy < y1; yy++) for (let i = 0; i < k.length; i++) put(pb, x + i, yy, R[k[i]]); }
  const box = (...a) => PFInfra.box3q(...a);
  /** Fruta/objeto redondo de 3–4 px con brillo */
  function blob(pb, x, y, r, col) { const c = U(col), d = PFK.shU(c, -0.3, 15), l = PFK.shU(c, 0.25); PFK.ellipseFn(pb, x, y, r, r * 0.9, (nx, ny) => nx + ny < -0.5 ? l : nx + ny > 0.6 ? d : c); }

  /* ---------- puesto de mercado ---------- */
  function stall(pb, x, y, w, o = {}) {
    const r = RNG(o.seed || 7), c1 = o.c1 || '#ff6b6b', d = 14, dx = 7, SH = 124, SW = w + 26, ox = 6, yb = SH - 1;
    const C1 = U(c1), C1d = PFK.shU(C1, -0.32, 0), C1l = PFK.shU(C1, 0.18), CW = U(o.c2 || '#fff4e4'), CWd = U('#d8c8b8');
    const Wd = P32(WOOD);
    const lamps = [];
    const s = spr(SW, SH, (q) => {
      // postes traseros y estantería de fondo (en sombra del toldo)
      for (const px of [ox + 3 + dx, ox + w - 4 + dx]) vbar(q, px, yb - d - 92, yb - d, Wd, [3, 2, 1]);
      for (const sy of [yb - d - 46, yb - d - 66]) {
        for (let xx = ox + 5 + dx; xx < ox + w - 4 + dx; xx++) { put(q, xx, sy, Wd[4]); put(q, xx, sy + 1, Wd[2]); }
        for (let xx = ox + 7 + dx; xx < ox + w - 7 + dx; xx += 4 + r.int(0, 2)) {
          const g = o.goods, hh = 4 + r.int(0, 4), col = g === 'crafts' ? r.pick(['#c86c3a', '#e0b060', '#2e6aa0', '#1aa894', '#c02a8a']) : g === 'water' ? r.pick(['#5edcea', '#9cf0f8', '#1ab8cc']) : r.pick(['#ff8a2a', '#e8402e', '#ffe060', '#8ad040', '#f478b8']);
          const cu = PFK.shU(U(col), -0.22);
          for (let yy = sy - hh; yy < sy; yy++) { put(q, xx, yy, cu); put(q, xx + 1, yy, PFK.shU(cu, -0.2)); put(q, xx + 2, yy, PFK.shU(cu, -0.32)); }
          put(q, xx, sy - hh, PFK.shU(cu, 0.3)); put(q, xx + 1, sy - hh, U('#e8e0d0'));
        }
      }
      // tela de fondo con estampado
      for (let yy = yb - d - 88; yy < yb - d - 70; yy++) for (let xx = ox + 5 + dx; xx < ox + w - 4 + dx; xx++) put(q, xx, yy, ((xx + yy) % 6 < 3) ? PFK.shU(C1d, -0.25) : PFK.shU(CWd, -0.35));
      // mostrador: frente de tablones con zócalo de color
      box(q, ox, yb, w, 34, 12, {
        ramp: WOOD, skew: 0.5,
        front: (xx, yy, u, v) => { const ly = yy - (yb - 34); if (ly >= 26) return ly === 26 ? C1l : ((xx - ox) % 10 < 5 ? C1 : C1d); if (ly < 3) return Wd[ly === 0 ? 7 : 5]; return Wd[(xx - ox) % 7 === 0 ? 2 : 4 - (PFK.cl(xx, yy, 2, 3) < 0.18 ? 1 : 0) - (u > 0.9 ? 1 : 0)]; },
        top: (xx, yy, u, v) => Wd[(xx - ox) % 11 === 0 ? 4 : 6 - Math.round(v * 1.5)],
        side: (xx, yy) => Wd[((yy) % 7 === 0) ? 0 : 2],
      });
      // mercancía sobre el mostrador
      const ty = yb - 34 - 3, g = o.goods || 'fruit';
      if (g === 'juice') {
        for (let k = 0; k < 3; k++) {
          const cx = ox + 10 + k * 15, jc = ['#ff9a2a', '#d0306a', '#9ad040'][k];
          for (let yy = ty - 16; yy < ty; yy++) for (let xx = -4; xx <= 4; xx++) { const f = (xx + 4) / 8; put(q, cx + xx, yy, yy < ty - 13 ? U(f < 0.3 ? '#ffffff' : '#c8e8f0') : PFK.shU(U(jc), f < 0.25 ? 0.25 : f > 0.75 ? -0.3 : 0)); }
          for (let xx = -5; xx <= 5; xx++) { put(q, cx + xx, ty - 17, U('#d3ccc5')); put(q, cx + xx, ty, U('#4f4d51')); }
          put(q, cx + 5, ty - 4, U('#4f4d51')); put(q, cx + 6, ty - 4, U('#d3ccc5'));
        }
        for (let k = 0; k < 5; k++) { const cx = ox + 52 + k * 4; if (cx > ox + w - 4) break; rect(q, cx, ty - 5, 3, 5, U('#f4f0e8')); put(q, cx + 2, ty - 5, U('#c8c0b4')); }
      } else if (g === 'arepas') {
        PFK.ellipseFn(q, ox + 22, ty - 2, 16, 4, (nx, ny, dd) => dd > 0.8 ? U('#141418') : U(ny < -0.2 ? '#3a3a44' : '#26262e'));
        for (let k = 0; k < 5; k++) PFK.ellipseFn(q, ox + 12 + k * 5, ty - 3 + (k % 2), 2.6, 1.4, (nx, ny) => U(ny < 0 ? '#f8e2a8' : '#d8a860'));
        for (let k = 0; k < 4; k++) rect(q, ox + 44, ty - 2 - k * 2, 12, 1, U(k % 2 ? '#e8e0d0' : '#ffffff'));
        PFK.ellipseFn(q, ox + w - 12, ty - 4, 7, 4, (nx, ny, dd) => ((Math.floor((nx + 1) * 5) + Math.floor((ny + 1) * 3)) % 2) ? U('#c89850') : U('#9a6a30'));
        // vapor del budare (estático)
        for (let k = 0; k < 6; k++) put(q, ox + 18 + (k % 3) * 4, ty - 8 - k * 2, U('#f4f4f8'));
      } else if (g === 'crafts') {
        for (let k = 0; k < 4; k++) { const cx = ox + 8 + k * 12; PFK.ellipseFn(q, cx, ty - 5, 5, 5, (nx, ny) => ny > 0.4 ? 0 : U(['#c86c3a', '#e0b060', '#a8502a', '#d8c08a'][k] && (Math.floor((ny + 1) * 4) % 2 ? ['#c86c3a', '#e0b060', '#a8502a', '#d8c08a'][k] : '#5e2410'))); }
        for (let k = 0; k < 3; k++) { const cx = ox + w - 24 + k * 8; PFK.ellipseFn(q, cx, ty - 3, 4, 1.6, (nx, ny) => U(ny < 0 ? '#f0d890' : '#b89040')); rect(q, cx - 2, ty - 7, 5, 4, U(['#2e6aa0', '#1aa894', '#c02a8a'][k])); }
        // tejidos colgantes del toldo
        for (let k = 0; k < 4; k++) { const hx = ox + 8 + k * 14; for (let yy = yb - 92; yy < yb - 70; yy++) for (let xx = 0; xx < 7; xx++) put(q, hx + xx, yy, U((Math.floor((yy) / 3) + k) % 3 === 0 ? '#ffe060' : ['#c02a8a', '#1aa894', '#ff6b6b', '#2e6aa0'][k])); }
      } else if (g === 'water') {
        for (let k = 0; k < 6; k++) { const cx = ox + 6 + k * 7; for (let yy = ty - 12; yy < ty; yy++) for (let xx = 0; xx < 4; xx++) put(q, cx + xx, yy, yy < ty - 10 ? U('#2e6aa0') : U(xx === 0 ? '#e6fdff' : xx === 3 ? '#1ab8cc' : '#5edcea')); }
        PFInfra.cylV(q, ox + w - 14, ty, 6, 18, { ramp: ['#04263c', '#07507a', '#0a7fae', '#11bedd', '#3adcf1', '#9cf0f8', '#e6fdff', '#ffffff'], bands: [{ y: 4, h: 2 }], ell: 0.4 });
      } else { // fruta en cajas
        for (let k = 0; k < 3; k++) {
          const cx = ox + 6 + k * 18;
          box(q, cx, ty + 2, 15, 6, 5, { ramp: WOOD, skew: 0.5 });
          for (let j = 0; j < 9; j++) blob(q, cx + 3 + (j % 4) * 3 + (j > 3 ? 2 : 0), ty - 6 - (j > 3 ? 2 : 0) - (j > 7 ? 2 : 0), 1.8, FRUIT[(k * 2 + (j % 2)) % FRUIT.length]);
        }
      }
      // postes delanteros
      for (const px of [ox + 1, ox + w - 3]) vbar(q, px, yb - 100, yb - 34, Wd, [5, 3, 1]);
      // toldo a rayas (cara superior inclinada) + faldón festoneado
      const yf = yb - 100;
      PFK.polyFill(q, [[ox - 5, yf], [ox + w + 5, yf], [ox + w + 5 + dx + 4, yf - 16], [ox - 5 + dx + 4, yf - 16]], (xx, yy) => {
        const v = (yf - yy) / 16, st = Math.floor((xx - ox + 400 - (yf - yy) * 0.7) / 7) % 2;
        let c = st ? C1 : CW;
        if (v > 0.75) c = PFK.shU(c, -0.12); else if (v < 0.2) c = PFK.shU(c, 0.06);
        if (PFK.cl(xx, yy, 2, 9) < 0.08) c = PFK.shU(c, -0.1);
        return c;
      });
      for (let xx = ox - 5; xx < ox + w + 5; xx++) {
        const st = Math.floor((xx - ox + 400) / 7) % 2, sc = (xx - ox + 400) % 7, depth = 6 - Math.round(Math.abs(sc - 3) * 0.7);
        for (let k = 0; k < depth; k++) put(q, xx, yf + k, k === 0 ? U('#fff8f0') : st ? (k > depth - 2 ? C1d : C1) : (k > depth - 2 ? CWd : CW));
      }
      // letrero sobre el toldo
      if (o.sign) {
        const tw = PFK.measure(o.sign, { font: 'tiny', bold: true }) + 8, sx = ox + Math.round((w - tw) / 2) + 5, sy = yf - 30;
        for (const px of [sx + 3, sx + tw - 4]) vbar(q, px, sy + 10, yf - 10, Wd, [3, 1]);
        box(q, sx, sy + 11, tw, 11, 3, { ramp: WOOD, skew: 0.5, front: (xx, yy, u, v) => Wd[v < 0.15 ? 6 : v > 0.85 ? 2 : 4] });
        PFK.text(q, o.sign, sx + 4, sy + 3, U('#fff4d8'), { font: 'tiny', bold: true, shadow: U('#2a1408') });
      }
      // guirnalda de bombillas bajo el faldón
      for (let k = 0; k < w; k += 8) { const lx = ox + k + 2, ly = yf + 7 + Math.round(Math.sin(k / w * Math.PI) * 3); put(q, lx, ly - 1, U('#2a2420')); put(q, lx, ly, U(['#ffe14d', '#ff9f43', '#7ff0dc', '#ff8ab8'][(k / 8) % 4])); lamps.push([x - ox + lx, y - yb + ly]); }
      // objetos al pie: cajas, saco, taburete, pizarra de precios
      box(q, ox + w - 2, yb, 12, 10, 6, { ramp: WOOD, skew: 0.5, front: (xx, yy) => Wd[(xx - ox) % 4 === 0 ? 2 : 4] });
      for (let j = 0; j < 5; j++) blob(q, ox + w + 1 + j * 2, yb - 12, 1.6, FRUIT[(j + (o.seed | 0)) % FRUIT.length]);
    });
    castShadow(pb, x + 8, y, w, 12, -0.24);
    place(pb, s, x - ox, y - yb);
    contact(pb, x - 2, x + w + 12, y + 1, -0.35);
    return { x, y, w, top: y - 116, lamps };
  }

  /* ---------- jardinera ---------- */
  function planter(pb, x, y, w, o = {}) {
    const h = o.h ?? 14, d = o.d ?? 8, r = RNG(o.seed || 3), ramp = o.ramp || TERRA;
    castShadow(pb, x + 2, y, w, d + 6, -0.2);
    const s = spr(w + 40, h + d + 70, (q) => {
      const ox = 4, yb = h + d + 69;
      const b = box(q, ox, yb, w, h, d, { ramp, skew: 0.5, front: (xx, yy, u, v) => { const R = P32(ramp); if (yy - (yb - h) < 2) return R[R.length - 1]; return R[clamp(4 - Math.round(v * 1.5) + ((xx - ox) % 12 === 0 ? -1 : 0) - (u > 0.92 ? 2 : 0), 0, R.length - 1)]; } });
      // tierra
      for (let rr = 1; rr < d - 1; rr++) { const off = Math.round(rr * 0.5); for (let xx = ox + 2 + off; xx < ox + w - 2 + off; xx++) put(q, xx, yb - h - 1 - rr, U(PFK.cl(xx, rr, 2, 5) < 0.3 ? '#3a2414' : '#5a3a20')); }
      const kind = o.kind || 'flowers', top = yb - h - Math.round(d / 2);
      if (kind === 'palm') PFFlora.palm(q, ox + Math.round(w / 2) + 2, top, 58 + r.int(0, 10), r.pick([-5, 4, 6]), o.seed || 3);
      else if (kind === 'tree') PFFlora.tree(q, ox + Math.round(w / 2) + 2, top, 48 + r.int(0, 10), o.seed || 3, { wide: 0.8 });
      else if (kind === 'agave') { PFFlora.agave(q, ox + Math.round(w * 0.35), top, 9, o.seed); PFFlora.agave(q, ox + Math.round(w * 0.72), top + 1, 7, (o.seed | 0) + 1); }
      else {
        for (let xx = ox + 3; xx < ox + w - 1; xx += 5 + r.int(0, 3)) {
          const k = r();
          if (k < 0.35) PFFlora.hibiscusBush(q, xx + 2, top + r.int(-1, 2), 12 + r.int(0, 5), 9 + r.int(0, 4), xx + (o.seed | 0));
          else if (k < 0.6) PFFlora.flowerPatch(q, xx + 2, top + 1, 9, xx + (o.seed | 0), ['#f6d24a', '#fff2c0', '#f478b8', '#c02a8a']);
          else if (k < 0.8) PFFlora.bush(q, xx + 2, top + 1, 12, 9, RAMP.foliageR, xx + (o.seed | 0));
          else for (let j = 0; j < 3; j++) PFFlora.lupine(q, xx + j * 3, top + 1, 10 + r.int(0, 6), xx + j);
        }
        // buganvilla que desborda por el frente
        if (o.spill !== false) for (let i = 0; i < w * 1.2; i++) { const xx = ox + r.int(0, w - 1), yy = yb - h + Math.floor(Math.pow(r(), 2) * (h - 3)); put(q, xx, yy, U(r() < 0.3 ? '#2e5a1c' : r.pick(RAMP.bougainR))); }
      }
    });
    place(pb, s, x - 4, y - (h + d + 69));
    contact(pb, x - 1, x + w + 2, y + 1, -0.3);
  }

  /* ---------- farola ---------- */
  function lamp(pb, x, y, o = {}) {
    const h = o.h ?? 104, I = P32(IRON);
    const s = spr(40, h + 8, (q) => {
      const cx = 18, yb = h + 7;
      // basa en dos escalones y fuste estriado
      box(q, cx - 5, yb, 11, 4, 4, { ramp: IRON, skew: 0.5 });
      box(q, cx - 3, yb - 4, 7, 6, 3, { ramp: IRON, skew: 0.5 });
      for (let yy = yb - h + 14; yy < yb - 10; yy++) { put(q, cx - 1, yy, I[4]); put(q, cx, yy, I[3]); put(q, cx + 1, yy, I[1]); }
      for (const ry of [yb - 30, yb - h + 26]) { for (let k = -2; k <= 2; k++) { put(q, cx + k, ry, I[k < 0 ? 5 : 2]); put(q, cx + k, ry + 1, I[1]); } }
      // brazos con farolillos
      const arms = o.arms ?? 1;
      const heads = arms === 2 ? [cx - 9, cx + 9] : [cx];
      if (arms === 2) for (let k = -9; k <= 9; k++) { put(q, cx + k, yb - h + 13 - Math.round(Math.abs(k) * 0.2), I[k < 0 ? 4 : 2]); }
      for (const hx of heads) {
        const ty = yb - h + (arms === 2 ? 3 : 2);
        // tejadillo, cristal cálido, base
        for (let k = -4; k <= 4; k++) { put(q, hx + k, ty, I[k < 0 ? 4 : 2]); if (Math.abs(k) < 4) put(q, hx + k, ty - 1, I[3]); }
        put(q, hx, ty - 2, I[5]); put(q, hx, ty - 3, I[4]);
        for (let yy = ty + 1; yy < ty + 10; yy++) for (let k = -3; k <= 3; k++) put(q, hx + k, yy, Math.abs(k) === 3 ? I[1] : U(GLASSW[clamp(5 - Math.abs(k) - (yy > ty + 7 ? 1 : 0), 2, 5)]));
        for (let k = -3; k <= 3; k++) put(q, hx + k, ty + 10, I[2]);
        put(q, hx, ty + 11, I[1]);
      }
      if (o.basket) { const by = yb - h + 34; PFK.ellipseFn(q, cx + 7, by, 5, 3, (nx, ny) => U(ny < 0 ? '#8a5a2c' : '#5a3418')); for (let i = 0; i < 18; i++) put(q, cx + 3 + (i * 7) % 9, by - 3 + (i * 5) % 7, U(['#f478b8', '#c02a8a', '#2e5a1c', '#ffd84a'][i % 4])); for (let k = 0; k < 6; k++) put(q, cx + 1 + k, by - 6 + Math.round(k * 0.3), I[3]); }
    });
    castShadow(pb, x - 4, y, 9, 8, -0.22, 1.2);
    place(pb, s, x - 18, y - (h + 7));
    return { lx: x, ly: y - h + 7, heads: (o.arms ?? 1) === 2 ? [[x - 9, y - h + 8], [x + 9, y - h + 8]] : [[x, y - h + 7]] };
  }

  /* ---------- banco de plaza ---------- */
  function bench(pb, x, y, w = 34, o = {}) {
    const Wd = P32(WOOD), I = P32(IRON);
    castShadow(pb, x, y, w, 7, -0.24);
    const s = spr(w + 10, 36, (q) => {
      const ox = 2, yb = 35;
      // patas de hierro y apoyabrazos
      for (const lx of [ox + 2, ox + w - 4]) { for (let yy = yb - 16; yy <= yb; yy++) { put(q, lx, yy, I[3]); put(q, lx + 1, yy, I[1]); } for (let yy = yb - 30; yy < yb - 16; yy++) { put(q, lx + 3, yy, I[3]); put(q, lx + 4, yy, I[1]); } }
      // asiento en 3/4 (3 listones) y respaldo (3 listones)
      for (let r = 0; r < 6; r++) { const off = Math.round(r * 0.5); for (let xx = ox + off; xx < ox + w + off; xx++) put(q, xx, yb - 16 - r, Wd[r % 2 ? 4 : 6 - (r > 3 ? 1 : 0)]); }
      for (let xx = ox; xx < ox + w; xx++) { put(q, xx, yb - 15, Wd[3]); put(q, xx, yb - 14, Wd[1]); }
      for (let r = 0; r < 3; r++) for (let xx = ox + 4; xx < ox + w + 4; xx++) { put(q, xx, yb - 30 + r * 4, Wd[6 - r]); put(q, xx, yb - 29 + r * 4, Wd[4 - r]); }
    });
    place(pb, s, x - 2, y - 35);
  }

  /* ---------- fuente redonda en 3/4 ---------- */
  function fountain(pb, cx, y, rx, o = {}) {
    const ry = Math.round(rx * 0.3), wallH = 12, St = P32(CREAM), Wt = P32(PFGround.ACEQ);
    castShadow(pb, cx - rx + 6, y, rx * 2, 10, -0.2);
    const SW = rx * 2 + 12, SH = wallH + ry * 2 + 80;
    const jets = [];
    const s = spr(SW, SH, (q) => {
      const c = rx + 6, yb = SH - 1 - ry, top = yb - wallH;
      // pared trasera interior (se ve sobre el agua)
      PFK.ellipseFn(q, c, top, rx, ry, (nx, ny) => St[ny < 0 ? 2 : 3]);
      // agua: elipse interior con reflejos
      PFK.ellipseFn(q, c, top + 2, rx - 3, ry - 1.5, (nx, ny, dd) => {
        let k = 3 + (ny > 0.3 ? 1 : 0) - (ny < -0.6 ? 1 : 0);
        const ripple = Math.sin((nx * rx) * 0.5 + ny * 6) + Math.sin(Math.hypot(nx * rx, ny * ry * 3) * 0.9);
        if (ripple > 1.3) k = 5; else if (ripple < -1.4) k = 2;
        if (dd > 0.85 && ny < 0) k = 1;
        return Wt[clamp(k, 1, 6)];
      });
      // cuerpo frontal (media elipse inferior extruida) con sillares
      for (let i = -rx; i <= rx; i++) {
        const e = Math.round(ry * Math.sqrt(Math.max(0, 1 - (i / (rx + 0.5)) ** 2)));
        const f = (i + rx) / (2 * rx);
        for (let yy = top + e; yy <= yb + e; yy++) {
          const ly = yy - top - e;
          let k = f < 0.15 ? 4 : f < 0.45 ? 5 : f < 0.75 ? 4 : f < 0.9 ? 3 : 2;
          if (ly < 2) k = 6; else if (ly === 2) k = 3;
          if ((i + 200) % 13 === 0 && ly > 2) k = 2;
          if (ly === Math.round(wallH / 2) + 1) k -= 1;
          if (PFK.cl(c + i, yy, 2, 11) < 0.12) k -= 1;
          put(q, c + i, yy, St[clamp(k, 0, 6)]);
        }
        put(q, c + i, yb + e + 1, St[0]);
      }
      // borde superior (anillo) iluminado
      PFK.ellipseFn(q, c, top, rx + 0.5, ry + 0.5, (nx, ny, dd) => dd > 0.78 ? St[ny < 0.2 ? 6 : 5] : 0);
      // pedestal central con dos tazas
      const pcx = c, py = top + 1;
      for (let yy = py - 34; yy < py; yy++) for (let k = -3; k <= 3; k++) put(q, pcx + k, yy, St[k < -1 ? 6 : k < 1 ? 5 : k < 3 ? 3 : 2]);
      const bowl = (by, br) => {
        PFK.ellipseFn(q, pcx, by, br, br * 0.32, (nx, ny) => Wt[ny < 0 ? 3 : 4]);
        for (let i = -br; i <= br; i++) { const e = Math.round(br * 0.32 * Math.sqrt(Math.max(0, 1 - (i / (br + 0.5)) ** 2))); for (let k = 0; k < 4; k++) put(q, pcx + i, by + e + k, St[k === 0 ? 6 : (i < 0 ? 5 : 3) - (k > 2 ? 1 : 0)]); }
        // cortina de agua que cae desde el borde
        for (let i = -br + 1; i <= br - 1; i += 2) { const e = Math.round(br * 0.32 * Math.sqrt(Math.max(0, 1 - (i / (br + 0.5)) ** 2))); for (let k = 4; k < 9 + (i % 3); k++) put(q, pcx + i, by + e + k, Wt[k % 3 === 0 ? 6 : 5]); }
        jets.push([pcx, by]);
      };
      bowl(py - 34, Math.round(rx * 0.4));
      for (let yy = py - 52; yy < py - 36; yy++) for (let k = -2; k <= 2; k++) put(q, pcx + k, yy, St[k < 0 ? 6 : k < 1 ? 4 : 2]);
      bowl(py - 52, Math.round(rx * 0.22));
      // gota escultórica en lo alto (bronce turquesa)
      PFK.ellipseFn(q, pcx, py - 60, 4, 5, (nx, ny) => ny < -0.4 && Math.abs(nx) > 0.35 ? 0 : U(nx + ny < -0.4 ? '#9cf0e0' : nx > 0.3 ? '#127a70' : '#3ab8a4'));
      put(q, pcx, py - 66, U('#3ab8a4')); put(q, pcx, py - 67, U('#9cf0e0'));
      o._c = c; o._yb = yb;
    });
    const ox = cx - (rx + 6), oy = y - (SH - 1 - ry);
    place(pb, s, ox, oy);
    return { jets: jets.map(([jx, jy]) => [jx + ox, jy + oy]), top: oy + (SH - 1 - ry) - wallH, rx, ry };
  }

  /* ---------- banderines ---------- */
  function bunting(pb, x0, y0, x1, y1, sag, o = {}) {
    const cols = o.cols || ['#ff6b6b', '#ffe14d', '#20d6c7', '#8d6bff', '#ff9f43', '#4ccb70'], step = o.step || 10, sz = o.size || 6;
    const n = Math.max(2, Math.round(Math.abs(x1 - x0)));
    let idx = 0;
    for (let i = 0; i <= n; i++) {
      const t = i / n, xx = Math.round(lerp(x0, x1, t)), yy = Math.round(lerp(y0, y1, t) + Math.sin(t * Math.PI) * sag);
      put(pb, xx, yy, U('#3a2a22'));
      if (i % step === 0 && i > 2 && i < n - 2) {
        const c = U(cols[idx++ % cols.length]), dk = PFK.shU(c, -0.28, 0), lt = PFK.shU(c, 0.2);
        for (let k = 0; k < sz + 1; k++) { const half = Math.round((sz - k) / 2); for (let j = -half; j <= half; j++) put(pb, xx + j, yy + 1 + k, j < 0 ? lt : j > 0 ? dk : c); }
      }
    }
  }

  /* ---------- cajas, sacos, barriles ---------- */
  function crate(pb, x, y, w = 18, h = 14, d = 7, o = {}) {
    const Wd = P32(WOOD);
    castShadow(pb, x, y, w, d + 2, -0.22);
    box(pb, x, y, w, h, d, { ramp: WOOD, skew: 0.5, front: (xx, yy, u, v) => { const lx = xx - x, ly = yy - (y - h); if (lx < 2 || lx > w - 3 || ly < 2 || ly > h - 3) return Wd[ly < 2 ? 6 : 3]; return Wd[ly % 4 === 0 ? 2 : 4 - (PFK.cl(xx, yy, 2, 5) < 0.2 ? 1 : 0)]; }, top: (xx, yy, u, v) => Wd[(xx - x) % 5 === 0 ? 3 : 6 - Math.round(v)], side: (xx, yy) => Wd[yy % 4 === 0 ? 0 : 2] });
    if (o.label) { rect(pb, x + 4, y - h + 4, w - 8, 4, U(o.label)); }
  }
  function sack(pb, x, y, o = {}) {
    const c = U(o.col || '#d8c08a'), dk = PFK.shU(c, -0.3, 20), lt = PFK.shU(c, 0.2);
    PFK.ellipseFn(pb, x, y - 6, 7, 6.5, (nx, ny) => nx + ny < -0.6 ? lt : nx + ny > 0.5 ? dk : c);
    for (let k = -2; k <= 2; k++) put(pb, x + k, y - 13, dk); put(pb, x, y - 14, dk); put(pb, x - 1, y - 15, c); put(pb, x + 1, y - 15, c);
    for (let k = -6; k <= 6; k++) put(pb, x + k, y, PFK.shU(dk, -0.2));
  }
  function barrel(pb, x, y, o = {}) {
    const r = o.r ?? 6, h = o.h ?? 18;
    castShadow(pb, x - r, y, r * 2, 6, -0.22);
    PFInfra.cylV(pb, x, y - 1, r, h, { ramp: o.ramp || ['#2a1408', '#4a2a14', '#6e4422', '#8e5e32', '#b07e4a', '#d0a46a', '#ecc890', '#f8e0b0'], band: ['#141418', '#26262e', '#4a4a56', '#8a8a96', '#b0b0bc', '#d8d8e0'], bands: [{ y: 3, h: 2 }, { y: h - 4, h: 2 }], ell: 0.4 });
  }
  /* ---------- mesa de café con sombrilla y sillas ---------- */
  function cafeTable(pb, x, y, o = {}) {
    const I = P32(IRON), r = RNG(o.seed || 5), col = U(o.col || r.pick(['#20d6c7', '#ff6b6b', '#ffe14d', '#8d6bff'])), cw = U('#fff4e4');
    castShadow(pb, x - 10, y, 26, 8, -0.2);
    const s = spr(70, 96, (q) => {
      const cx = 34, yb = 95;
      // sillas a ambos lados
      for (const sx of [cx - 16, cx + 12]) { for (let yy = yb - 14; yy <= yb; yy++) { put(q, sx, yy, I[3]); put(q, sx + 5, yy, I[1]); } for (let k = 0; k < 7; k++) { put(q, sx - 1 + k, yb - 14, I[4]); put(q, sx - 1 + k, yb - 15, I[5]); } const bx = sx < cx ? sx - 1 : sx + 5; for (let yy = yb - 26; yy < yb - 14; yy++) put(q, bx, yy, I[3]); for (let yy = yb - 26; yy < yb - 22; yy++) for (let k = 0; k < 6; k++) put(q, (sx < cx ? sx - 1 : sx) + k, yy, I[(yy % 2) ? 2 : 4]); }
      // mesa redonda (tablero en 3/4)
      for (let yy = yb - 24; yy <= yb; yy++) { put(q, cx, yy, I[4]); put(q, cx + 1, yy, I[2]); }
      for (let k = -4; k <= 5; k++) put(q, cx + k, yb, I[2]);
      PFK.ellipseFn(q, cx + 0.5, yb - 25, 9, 3, (nx, ny, dd) => dd > 0.72 ? U(ny > 0 ? '#8a8296' : '#ffffff') : U(ny < 0 ? '#efe9e2' : '#ddd6d4'));
      // tazas y jarra
      put(q, cx - 4, yb - 27, U('#ffffff')); put(q, cx - 4, yb - 26, U('#c8c0b4')); put(q, cx + 3, yb - 27, U('#ffffff')); put(q, cx + 3, yb - 26, U('#c8c0b4'));
      rect(q, cx - 1, yb - 30, 3, 4, U('#9cf0f8')); put(q, cx - 1, yb - 30, U('#ffffff'));
      if (o.umbrella !== false) {
        for (let yy = yb - 70; yy < yb - 25; yy++) { put(q, cx, yy, I[5]); put(q, cx + 1, yy, I[3]); }
        const uy = yb - 70;
        PFK.polyFill(q, [[cx - 28, uy + 12], [cx + 30, uy + 12], [cx + 18, uy - 2], [cx - 14, uy - 2]], (xx, yy) => { const st = Math.floor((xx - cx + 100 + (yy - uy) * 0.4) / 8) % 2; let c = st ? col : cw; if (yy < uy + 3) c = PFK.shU(c, 0.08); return c; });
        for (let xx = cx - 28; xx < cx + 30; xx++) { const st = Math.floor((xx - cx + 100) / 8) % 2, sc = (xx - cx + 100) % 8; const dep = 4 - Math.round(Math.abs(sc - 3.5) * 0.6); for (let k = 0; k < dep; k++) put(q, xx, uy + 12 + k, st ? PFK.shU(col, k > 1 ? -0.25 : 0) : PFK.shU(cw, k > 1 ? -0.2 : 0)); }
        put(q, cx + 2, uy - 3, I[5]); put(q, cx + 2, uy - 4, I[4]);
      }
    });
    place(pb, s, x - 34, y - 95);
  }
  /* ---------- mástil con bandera (la tela se anima aparte) ---------- */
  function flagpole(pb, x, y, h = 120) {
    const S = P32(PFInfra.STEEL);
    box(pb, x - 4, y, 9, 4, 4, { ramp: PFTerrain.CONC, skew: 0.5 });
    for (let yy = y - h; yy < y - 4; yy++) { put(pb, x, yy, S[6]); put(pb, x + 1, yy, S[3]); }
    put(pb, x, y - h - 1, U('#ffd84a')); put(pb, x + 1, y - h - 1, U('#c89020'));
    return { fx: x + 2, fy: y - h + 2 };
  }
  /* ---------- cartel pegado ---------- */
  function poster(pb, x, y, w, h, o = {}) {
    const r = RNG(o.seed || 9), cols = o.cols || ['#20d6c7', '#ffe14d', '#ff6b6b', '#0e2a5a'];
    rect(pb, x, y, w, h, U(cols[3]));
    rect(pb, x + 2, y + 2, w - 4, Math.round(h * 0.45), U(cols[0]));
    PFK.ellipseFn(pb, x + w / 2, y + h * 0.3, w * 0.18, w * 0.18, () => U(cols[1]));
    for (let k = 0; k < 3; k++) rect(pb, x + 2, y + Math.round(h * 0.6) + k * 3, w - 4 - r.int(0, 6), 1, U('#f4f0e8'));
    for (let xx = x; xx < x + w; xx++) put(pb, xx, y + h, U('#2a2420'));
    put(pb, x + 1, y + 1, U('#c8c0b4')); put(pb, x + w - 2, y + 1, U('#c8c0b4'));
  }
  /* ---------- tapa de registro (sobre la cara superior del suelo) ---------- */
  function manhole(pb, cx, cy) { PFK.ellipseFn(pb, cx, cy, 6, 2, (nx, ny, dd) => dd > 0.7 ? U('#2a2420') : U(((Math.round(nx * 6) + 9) % 2) ? '#5e5048' : '#4a3e38')); }
  /* ---------- pizarra de caballete ---------- */
  function aframe(pb, x, y, text = 'MENÚ') {
    const Wd = P32(WOOD);
    PFK.lineFn(pb, x, y, x + 5, y - 22, () => Wd[4], 2); PFK.lineFn(pb, x + 14, y, x + 9, y - 22, () => Wd[2], 2);
    PFK.polyFill(pb, [[x + 1, y - 4], [x + 13, y - 4], [x + 9, y - 21], [x + 5, y - 21]], U('#1e2a24'));
    for (let k = 0; k < 3; k++) for (let xx = x + 5 - k; xx < x + 9 + k; xx++) put(pb, xx, y - 17 + k * 4, U(k === 0 ? '#ffe14d' : '#e6f4ea'));
  }
  function bicycle(pb, x, y, o = {}) {
    const c = U(o.col || '#20a0c8'), I = P32(IRON);
    for (const wx of [x + 5, x + 25]) PFK.ellipseFn(pb, wx, y - 6, 6, 6, (nx, ny, dd) => dd > 0.7 ? I[1] : dd < 0.08 ? I[4] : 0);
    PFK.lineFn(pb, x + 5, y - 6, x + 13, y - 14, () => c, 2); PFK.lineFn(pb, x + 13, y - 14, x + 23, y - 14, () => c, 2); PFK.lineFn(pb, x + 23, y - 14, x + 25, y - 6, () => c); PFK.lineFn(pb, x + 13, y - 14, x + 15, y - 6, () => c); PFK.lineFn(pb, x + 5, y - 6, x + 15, y - 6, () => c);
    for (let k = 0; k < 5; k++) put(pb, x + 11 + k, y - 17, I[1]); put(pb, x + 23, y - 18, I[3]); put(pb, x + 22, y - 18, I[3]);
    // cesta con flores
    rect(pb, x + 24, y - 21, 6, 4, U('#8a5a2c')); for (let k = 0; k < 6; k++) put(pb, x + 24 + k, y - 22, U(['#f478b8', '#ffe14d', '#4ccb70'][k % 3]));
  }
  /** Macetas sueltas (barro) con plantas */
  function pots(pb, x, y, n = 3, seed = 1) {
    const r = RNG(seed), T = P32(TERRA);
    for (let i = 0; i < n; i++) {
      const px = x + i * 9 + r.int(0, 3), ph = 6 + r.int(0, 4), pw = 6 + r.int(0, 2);
      for (let yy = y - ph; yy < y; yy++) for (let k = 0; k < pw; k++) put(pb, px + k, yy, T[clamp(k === 0 ? 5 : k === pw - 1 ? 1 : 3 + (yy === y - ph ? 2 : 0), 0, 6)]);
      const k = r();
      if (k < 0.4) PFFlora.flowerPatch(pb, px + pw / 2, y - ph, 7, seed + i, ['#f478b8', '#c02a8a', '#ffe14d', '#fff2c0']);
      else if (k < 0.7) PFFlora.agave(pb, px + pw / 2, y - ph, 4, seed + i);
      else PFFlora.bush(pb, px + pw / 2, y - ph, 9, 8, RAMP.foliageR, seed + i);
    }
  }
  /** Carrito de globos y molinillos */
  function balloonCart(pb, x, y) {
    const Wd = P32(WOOD), I = P32(IRON);
    box(pb, x, y - 6, 22, 12, 7, { ramp: ['#0e2a5a', '#1e4a8c', '#2e6aa0', '#3a8ac8', '#7ab4e0', '#c8e4f8'], skew: 0.5 });
    for (const wx of [x + 4, x + 18]) PFK.ellipseFn(pb, wx, y - 3, 3.5, 3.5, (nx, ny, dd) => dd > 0.6 ? I[1] : I[4]);
    for (let yy = y - 40; yy < y - 18; yy++) put(pb, x + 11, yy, Wd[4]);
    const cols = ['#ff6b6b', '#ffe14d', '#20d6c7', '#8d6bff', '#ff9f43', '#4ccb70', '#f478b8'];
    for (let i = 0; i < 7; i++) { const bx = x + 2 + (i % 4) * 6 + (i > 3 ? 3 : 0), by = y - 50 - (i > 3 ? 8 : 0) - (i % 2) * 3; PFK.lineFn(pb, x + 11, y - 38, bx, by + 4, () => U('#e8e0d0')); PFK.ellipseFn(pb, bx, by, 3, 3.6, (nx, ny) => nx + ny < -0.6 ? U('#ffffff') : PFK.shU(U(cols[i]), nx + ny > 0.5 ? -0.25 : 0)); }
  }
  return { spr, place, castShadow, contact, rect, vbar, blob, stall, planter, lamp, bench, fountain, bunting, crate, sack, barrel, cafeTable, flagpole, poster, manhole, aframe, bicycle, pots, balloonCart, WOOD, IRON, TERRA, WHITE, CREAM, GLASSW, FRUIT };
})();

/* ---------- oclusores del primer plano (f ≈ 1,3) para plazas y ciudad ---------- */
if (typeof PFStage !== 'undefined') {
  /** Guirnalda de banderines grandes que cuelga del borde superior (oscura y fría: plano frontal) */
  PFStage.FG.garland = (o) => {
    const w = o.w || 300, h = o.h || 40, pb = new PixelBuffer(w, h), r = RNG(o.seed || 1);
    const cols = o.cols || ['#c8384a', '#d8b030', '#14a090', '#6a4ac8', '#d87020', '#3a9a48'];
    const sag = h * 0.45;
    for (let x = 0; x < w; x++) {
      const t = x / (w - 1), y = Math.round(3 + Math.sin(t * Math.PI) * sag);
      PFK.put(pb, x, y, U('#1a1018')); PFK.put(pb, x, y - 1, U('#3a2a30'));
      if (x % 14 === 6 && x > 4 && x < w - 8) {
        const c = U(cols[r.int(0, cols.length - 1)]), dk = PFK.shU(c, -0.38, 240), md = PFK.shU(c, -0.18, 240), lt = PFK.shU(c, 0.05);
        const fh = 12 + r.int(0, 3), tilt = Math.round((t - 0.5) * 3);
        for (let k = 0; k < fh; k++) { const half = Math.round((fh - k) * 0.42); for (let j = -half; j <= half; j++) PFK.put(pb, x + j + Math.round(k * tilt / fh), y + 1 + k, j < -half + 2 ? lt : j > half - 2 ? dk : md); }
      }
      if (x % 14 === 13) { PFK.put(pb, x, y + 1, U('#ffe8a0')); PFK.put(pb, x, y + 2, U('#c89040')); }
    }
    return pb;
  };
  /** Mata de buganvilla oscura con brácteas magenta (abajo, en el borde del encuadre) */
  PFStage.FG.bougain = (o) => {
    const w = o.w || 120, h = o.h || 80, pb = PFFlora.fgClump(w, h, o.seed || 1, { spikes: 0, leaves: o.leaves ?? 10 }), r = RNG((o.seed || 1) + 5);
    const BR = ['#3a0a2a', '#5a1440', '#80205a', '#a83078', '#c84a98'];
    for (let i = 0; i < Math.round(w / 6); i++) {
      const cx = w * (0.06 + r() * 0.88), cy = h * (0.25 + r() * 0.5), rr = 3 + r() * 4;
      PFK.ellipseFn(pb, cx, cy, rr, rr * 0.8, (nx, ny, d) => { if (PFK.cl(cx + nx * 9, cy + ny * 9, 1, i) < 0.25) return 0; return U(BR[clamp(Math.round(2.6 - nx * 0.8 - ny * 1.2 + (d > 0.7 ? -1 : 0)), 0, 4)]); });
    }
    return pb;
  };
}

/* ---------- capa dinámica ligera del plano (kit PF, rollout A) ---------- */
const PFDyn = {
  /** Gotas que bajan por los caños del muro y destellos en la acequia (world.pfSpouts) */
  wallWater(g, sc, cam, on = true) {
    const L = sc.world.pfSpouts; if (!L || !on) return;
    const t = Game.time, ox = cam.x, oy = cam.y;
    g.fillStyle = '#ffffff';
    for (const [x, y0, y1] of L) {
      const sx = x - ox; if (sx < -10 || sx > W + 10) continue;
      for (let i = 0; i < 3; i++) { const ph = (t * 1.6 + i / 3) % 1, yy = y0 + ph * (y1 - y0), off = Math.round(Math.sqrt(yy - y0) * 0.8); g.fillRect(sx + off, Math.round(yy - oy), 1, 2); }
      const k = Math.floor(t * 8) % 3; g.fillRect(sx + 2 + k * 2, y1 - oy, 1, 1); g.fillRect(sx + 7 - k, y1 - oy + 1, 1, 1);
    }
  },
  /** Halo cálido de los faroles de pared (world.pfLamps) */
  wallLamps(g, sc, cam, a = 0.4) {
    const L = sc.world.pfLamps; if (!L) return;
    for (const [x, y] of L) { const sx = x - cam.x; if (sx < -12 || sx > W + 12) continue; PFK.drawGlow(g, sx, y - cam.y, 9, '#ffd890', a); }
  },
  /** Halos de una lista [[x,y,col?,r?]] en mundo */
  glows(g, cam, list, col = '#ffd890', r = 8, a = 0.4) {
    for (const p of list) { const sx = p[0] - cam.x; if (sx < -20 || sx > W + 20) continue; PFK.drawGlow(g, sx, p[1] - cam.y, p[3] || r, p[2] || col, a); }
  },
};
