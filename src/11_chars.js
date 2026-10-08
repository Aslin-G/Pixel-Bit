/* =====================================================================
   11_chars.js — Diseño de personajes (sprites).
   Amaya, KIRU, Naira, Dante, Eliana, LIMEN, MIRAGE/MOSAICO, NPC.
   ===================================================================== */

const MAT = {
  amayaJacket: ['#3e1222', '#6e1f2e', '#a6303a', '#e04a44', '#ff7656', '#ffa57a', '#ffd2a8'],
  amayaShirt: ['#0b3b44', '#0e5a5e', '#138078', '#1aa894', '#20d6c7', '#7ff0dc', '#d0fff2'],
  amayaPants: ['#0d0c26', '#16173e', '#22265a', '#2f3878', '#41509a', '#5c70b8'],
  sneakerY: ['#3a2a10', '#7a5a1e', '#c89a2e', '#f0c840', '#ffe880', '#fff8d0'],
  leather: ['#2a1410', '#4a2418', '#6e3a22', '#94552e', '#b8743e', '#d89a5a'],
  nairaVest: ['#3a1410', '#64241a', '#8e3a24', '#b8562e', '#d8783e', '#eda060', '#f8c890'],
  nairaShirt: ['#0e2a1c', '#164430', '#1f6440', '#2e8a4e', '#4cab5c', '#7ccd76', '#b0ea98'],
  olive: ['#1c1e10', '#2e3218', '#454a22', '#5e642e', '#7a823c', '#98a24e'],
  straw: ['#4a2e10', '#7a5420', '#a87e34', '#d4a84a', '#f0cc6a', '#fbe49a', '#fff4cc'],
  danteOver: ['#0c1638', '#13235a', '#1c3584', '#2a4caa', '#3e68cc', '#6a90e4', '#a4c0f4'],
  tshirtW: ['#3a4a6e', '#6a7a9e', '#a0aecb', '#cfd8ea', '#eef3fa', '#ffffff'],
  hardhat: ['#4a3008', '#8a5c0c', '#c88a14', '#f0b41e', '#ffd84a', '#fff0a0', '#fffbe0'],
  safety: ['#5a1e08', '#9a3a0c', '#d85a10', '#ff7e1e', '#ffa850', '#ffd090'],
  bandana: ['#3a0a12', '#6a141e', '#a0202c', '#d8343c', '#ff5a5a', '#ff9a90'],
  labcoat: ['#4a5878', '#7888a8', '#a8b8d0', '#d0dcea', '#eef4fa', '#ffffff', '#ffffff'],
  violetTop: ['#1a0e3a', '#2c1a5e', '#432a86', '#5e3eac', '#7c58cc', '#a080e4', '#c8b0f4'],
  tealPants: ['#08202a', '#0e3440', '#164c58', '#206870', '#2e868a', '#48a8a4'],
  boots: ['#160c10', '#28161a', '#3e2226', '#583236', '#76464a', '#946060'],
  gloves: ['#3a2a08', '#6a4c10', '#a07418', '#d09c24', '#f0c044', '#fbe084'],
  kiruBody: ['#062a30', '#0a4648', '#0f6a66', '#16948a', '#20c0ae', '#4ce8cc', '#a8fff0'],
  kiruOrange: ['#4a1408', '#7a280e', '#b44414', '#e8661c', '#ff8e34', '#ffbc6c', '#ffe2b0'],
  kiruPanel: ['#060e2a', '#0a1846', '#102a6e', '#1a409a', '#2a5cc4', '#4a86e8', '#9cc8ff'],
  ink: ['#0a0816', '#140d26', '#1f1638', '#2b2150', '#3a2e6a', '#4c3e86'],
};

/* ------------------------------------------------------------------ */
/* AMAYA SERRANO                                                       */
/* ------------------------------------------------------------------ */
const AMAYA_D = {
  thigh: 10.5, shin: 10.5, footH: 2, footL: 5, pelvisH: 4, chestH: 13, torsoW: 15,
  headRX: 9.5, headRY: 9, upperArm: 8, foreArm: 7.5, armW: 2.3, legW: 2.9, handR: 1.9,
  eyeY: 0.5, eye1X: 1, eye2X: 5.5, eyeH: 4, mouthX: 4.5, mouthY: 6, iris: '#6a3a58',
  blush: '#e8806a', sole: '#fff8e8',
  mat: { skin: RAMP.skinA, hair: RAMP.hairA, top: MAT.amayaJacket, sleeve: MAT.amayaJacket, legs: MAT.amayaPants, shoes: MAT.sneakerY },
  foreMat: RAMP.skinA,
  energetic: 1.2,
  torso(R, o) {
    const { cx, hipY, waistY, shoulderY, tw, lx } = o;
    // chaqueta coral
    R.poly(o.torsoPts, { ramp: MAT.amayaJacket, base: 3, z: 30, group: 'torso', bevel: 6.5 });
    // solapas / cuello de la chaqueta
    R.poly([[cx + 1 + lx, shoulderY - 1], [cx + 5 + lx, shoulderY - 1.5], [cx + 3.5 + lx * 0.8, shoulderY + 5]], { ramp: MAT.amayaJacket, base: 4, z: 32, group: 'lapel', bevel: 1.5 });
    // camiseta turquesa en la abertura frontal
    R.poly([[cx + 2 + lx, shoulderY + 1], [cx + 6.5 + lx, shoulderY + 1], [cx + 6 + lx * 0.4, waistY], [cx + 1.5 + lx * 0.3, waistY]], { ramp: MAT.amayaShirt, base: 4, z: 31, group: 'shirt', bevel: 2 });
    // cinturón con bolsa de muestras
    R.box(cx + 0.5, waistY + 1.5, tw * 0.6, 1.6, 0.5, { ramp: MAT.leather, base: 3, z: 33, group: 'belt', bevel: 1 });
    R.box(cx - 5, waistY + 3.5, 2.6, 3, 1, { ramp: MAT.leather, base: 4, z: 34, group: 'pouch', bevel: 1.5 });
    R.stamp((pb) => {
      const bx = Math.round(cx + 4), by = Math.round(waistY + 1);
      pb.rect(bx, by, 2, 2, '#ffe14d'); pb.set(bx, by, '#fff8d0');
      // cremallera / costuras de la chaqueta
      for (let y = Math.round(shoulderY + 3); y < waistY - 1; y += 3) pb.set(Math.round(cx + 1 + lx * 0.6), y, MAT.amayaJacket[5]);
      // pliegues y bolsillo
      pb.line(Math.round(cx - 6 + lx), Math.round(shoulderY + 4), Math.round(cx - 3 + lx * 0.6), Math.round(shoulderY + 8), MAT.amayaJacket[2]);
      pb.hline(Math.round(cx - 6), Math.round(cx - 2), Math.round(waistY - 3), MAT.amayaJacket[2]);
      pb.hline(Math.round(cx - 6), Math.round(cx - 2), Math.round(waistY - 4), MAT.amayaJacket[5]);
      // insignia SYNARA (gota turquesa) en el pecho
      const ix = Math.round(cx - 4 + lx * 0.8), iy = Math.round(shoulderY + 4);
      pb.set(ix, iy, '#7ff0dc'); pb.rect(ix - 1, iy + 1, 3, 2, '#20d6c7'); pb.set(ix, iy + 1, '#d0fff2');
    }, 95);
  },
  hair(R, o) {
    const { hx, hy, rx, ry } = o;
    const sw = (o.pose.hairSwing || 0);
    const curlTex = (x, y, idx, ramp) => coilTexture(x, y, idx, ramp, 3);
    // moño rizado (puff) alto: racimo de rizos, cada uno con su propio volumen
    const px = hx - 4.5 - sw * 0.5, py = hy - 11 - Math.abs(sw) * 0.2;
    const curls = [[0, 0, 4.2], [-4.2, 1.2, 3.2], [4, -1, 3.4], [-1.8, -4, 3.3], [2.6, -4.6, 3], [-5, -2.6, 2.6], [5.6, 2.2, 2.6], [0.5, 3.2, 3.2], [-3, 3.6, 2.6], [3.6, 3.4, 2.4], [-6.2, 1.8, 2.2], [6.6, -2.6, 2.1]];
    curls.forEach(([dx, dy, r], i) => R.circle(px + dx, py + dy, r, { ramp: RAMP.hairA, base: 3, z: 45 + (dy + 6) * 0.01, group: 'curl' + i, bevel: r * 0.95, shiny: true, lineIdx: 1 }));
    // coletero coral
    R.ellipse(hx - 2.2, hy - 6.8, 3.2, 1.7, { ramp: MAT.amayaJacket, base: 4, z: 46, group: 'scrunch', bevel: 1.5 }, -0.35);
    // casquete pegado a la cabeza (sin cubrir la cara)
    const cap = SDF.sub(SDF.ellipse(hx - 1.5, hy - 2.6, rx + 0.6, ry * 0.86), SDF.ellipse(hx + 5.8, hy + 3.8, 7.6, 7.4));
    R.custom(cap, [hx - rx - 3, hy - ry - 3, hx + rx + 3, hy + ry], { ramp: RAMP.hairA, base: 3, z: 55, group: 'hair', bevel: 4, shiny: true });
    // rizos del flequillo y laterales
    [[6.6, -5.6, 2.3], [3.2, -6.6, 2.4], [-0.4, -7.2, 2.2], [-6.4, 2.6, 2.4], [-5.4, 5.6, 2], [-7.4, -1.6, 2.2], [-4.2, -6.2, 2.3]].forEach(([dx, dy, r], i) => R.circle(hx + dx, hy + dy, r, { ramp: RAMP.hairA, base: 3, z: 56 + i * 0.01, group: 'fcurl' + i, bevel: r * 0.95, shiny: true, lineIdx: 1 }));
    R.capsule(hx + 8.6, hy - 3.5, hx + 9.4 + sw * 0.2, hy + 1.5, 1.2, 1, { ramp: RAMP.hairA, base: 4, z: 57, group: 'hair', bevel: 1 });
    // gafas sobre la frente
    R.capsule(hx - 8, hy - 3.5, hx + 6, hy - 7.6, 0.9, 0.9, { ramp: MAT.ink, base: 3, z: 58, group: 'goggle', bevel: 1 });
    R.ellipse(hx + 5.2, hy - 8, 3, 2.3, { ramp: RAMP.metal, base: 4, z: 59, group: 'goggle', bevel: 1.5 });
    R.stamp((pb) => {
      const gx = Math.round(hx + 3.8), gy = Math.round(hy - 9);
      pb.rect(gx, gy, 3, 2, '#22bdd0'); pb.set(gx, gy, '#e6fdff'); pb.set(gx + 2, gy + 1, '#106884');
    }, 96);
  },
  faceStamp(pb, o) {
    // pendiente pequeño
    pb.set(Math.round(o.hx - 4), Math.round(o.hy + 4), '#ffe14d');
  },
  render(anim, t, opts) { return renderHumanoid('amaya', AMAYA_D, anim, t, opts); },
};

/** Textura de rizos: bucles con lado iluminado arriba-izquierda y sombra abajo-derecha */
function coilTexture(x, y, idx, ramp, cell = 4) {
  const row = Math.floor(y / cell);
  const ox = (row & 1) ? cell / 2 : 0;
  const ccx = Math.floor((x + ox) / cell) * cell + cell / 2 - ox, ccy = row * cell + cell / 2;
  const jx = (hash2(Math.floor((x + ox) / cell), row, 3) - 0.5) * 1.2;
  const dx = x + 0.5 - ccx - jx, dy = y + 0.5 - ccy;
  const d = Math.hypot(dx, dy);
  if (d > cell * 0.36 && d < cell * 0.62 && dx + dy > 0.4) return ramp[clamp(idx - 1, 1, ramp.length - 1)];
  if (d < cell * 0.3 && dx + dy < -0.3 && idx >= 3) return ramp[clamp(idx + 1, 1, ramp.length - 1)];
  return null;
}

function renderHumanoid(id, D, anim, t, opts) {
  const R = new Rig(64, 80);
  const pose = poseFor(anim, t, D);
  if (opts.expr && !pose.expr) pose.expr = opts.expr;
  if (opts.expr && anim === 'idle') pose.expr = opts.expr;
  if (opts.mouth) pose.mouth = opts.mouth;
  if (opts.item) pose.item = opts.item;
  buildHumanoid(R, D, pose, opts);
  const pb = R.render();
  pb.anchors = R.anchors;
  return pb;
}

CHARS.amaya = { name: 'Amaya', render: AMAYA_D.render, ox: 30, oy: 78, shadowR: 9 };

/* ------------------------------------------------------------------ */
/* KIRU — robot zorro-lagartija                                         */
/* ------------------------------------------------------------------ */
const KIRU_EYES = {
  curioso: 'open', alegre: 'happy', alarmado: 'big', confundido: 'mixed', culpable: 'down', valiente: 'brave', agotado: 'tired', esperanzado: 'star',
  neutral: 'open', happy: 'happy', surprised: 'big', sad: 'down', worried: 'down', determined: 'brave', thinking: 'mixed', scared: 'big', joy: 'happy', tired: 'tired',
};
function renderKiru(anim, t, opts) {
  const R = new Rig(44, 36);
  const S = Math.sin, P = TAU * t;
  let bob = 0, legPh = 0, legAmp = 0, earTw = 0, tailA = 0, hop = 0, lean = 0;
  switch (anim) {
    case 'idle': bob = Math.round(S(P) * 0.6 + 0.4); earTw = (t > 0.6 && t < 0.75) ? 1 : 0; break;
    case 'walk': legPh = P; legAmp = 1.6; bob = Math.round(Math.abs(S(P * 2)) * 1); break;
    case 'run': legPh = P; legAmp = 2.6; bob = Math.round(Math.abs(S(P * 2)) * 2); lean = 0.15; break;
    case 'jump': hop = 0; legAmp = 0; earTw = -1; break;
    case 'fall': earTw = 2; break;
    case 'talk': bob = Math.round(S(P) * 0.6 + 0.4); earTw = Math.floor(t * 6) % 2; break;
    case 'celebrate': bob = -Math.round(Math.max(0, S(P)) * 5); earTw = 1; break;
    case 'scan': bob = 0; earTw = -1; break;
    default: bob = Math.round(S(P) * 0.6 + 0.4);
  }
  const by = 24 + bob + hop;
  const bx = 22;
  // cola con microturbina (detrás)
  const tx0 = bx - 7, ty0 = by + 1;
  const tx1 = bx - 13 + S(P) * 0.8, ty1 = by - 6 + Math.cos(P) * 0.6 - tailA;
  R.capsule(tx0, ty0, tx1, ty1, 2.2, 1.2, { ramp: MAT.kiruBody, base: 3, z: 1, group: 'tail', bevel: 2 });
  R.capsule(tx1, ty1, tx1 - 1, ty1 - 4, 1.2, 0.8, { ramp: MAT.kiruOrange, base: 4, z: 2, group: 'tail2', bevel: 1 });
  // patas traseras (oscuras)
  const leg = (x, ph, z, dark) => {
    const lift = Math.max(0, S(legPh + ph)) * legAmp;
    const fx = x + Math.cos(legPh + ph) * legAmp * 0.6;
    R.capsule(x, by + 3, fx, by + 8 - lift, 1.5, 1.3, { ramp: MAT.kiruBody, base: 3, z, group: 'leg' + z, dark, bevel: 1.2 });
    R.ellipse(fx + 0.5, by + 9 - lift, 2, 1.2, { ramp: MAT.ink, base: 3, z: z + 0.1, group: 'leg' + z, dark, bevel: 1 });
  };
  leg(bx - 5, Math.PI, 3, 1); leg(bx + 3, 0, 4, 1);
  // cuerpo
  R.ellipse(bx - 1, by + 1, 8, 5.4, { ramp: MAT.kiruBody, base: 4, z: 10, group: 'body', bevel: 4 }, lean * 0.5);
  // panel naranja del vientre (compartimento de muestras)
  R.ellipse(bx + 0.5, by + 3, 5, 2.6, { ramp: MAT.kiruOrange, base: 4, z: 11, group: 'belly', bevel: 2 });
  leg(bx - 4, 0, 12, 0); leg(bx + 4, Math.PI, 13, 0);
  // cabeza
  const hx = bx + 5 + lean * 4, hy = by - 7;
  // oreja trasera
  const earB = [[hx - 6, hy - 2], [hx - 9 - earTw, hy - 13 + Math.abs(earTw)], [hx - 1, hy - 5]];
  R.poly(earB, { ramp: MAT.kiruPanel, base: 3, z: 14, group: 'earB', bevel: 1.5, dark: 1 });
  R.ellipse(hx, hy, 8.4, 7, { ramp: MAT.kiruBody, base: 4, z: 20, group: 'head', bevel: 5 });
  // oreja delantera con celdas solares
  const earF = [[hx + 1, hy - 4], [hx + 3 + earTw * 0.5, hy - 15 + Math.abs(earTw)], [hx + 8, hy - 3]];
  R.poly(earF, { ramp: MAT.kiruPanel, base: 4, z: 25, group: 'earF', bevel: 1.5 });
  // pantalla facial
  R.ellipse(hx + 2.2, hy + 1, 5.6, 4.4, { ramp: MAT.ink, base: 2, z: 26, group: 'screen', bevel: 2, flat: true });
  // hocico naranja
  R.ellipse(hx + 7.4, hy + 3, 2.4, 1.8, { ramp: MAT.kiruOrange, base: 4, z: 27, group: 'nose', bevel: 1.5 });
  const mood = opts.expr || (anim === 'celebrate' ? 'alegre' : anim === 'scan' ? 'curioso' : 'curioso');
  const eyeMode = KIRU_EYES[mood] || 'open';
  const blink = anim === 'idle' && t > 0.85;
  R.stamp((pb) => {
    // celdas solares en orejas
    const ex = Math.round(hx + 3), ey = Math.round(hy - 9);
    pb.set(ex + 1, ey, '#9cc8ff'); pb.set(ex, ey + 2, '#4a86e8'); pb.set(ex + 2, ey + 2, '#4a86e8'); pb.set(ex + 1, ey + 4, '#9cc8ff');
    pb.hline(ex - 1, ex + 3, ey + 3, '#0a1846');
    pb.set(Math.round(hx + 3 + earTw * 0.5), Math.round(hy - 14 + Math.abs(earTw)), '#ff8e34');
    // ojos LED
    const c1 = '#56e5ff', c2 = '#e6fdff';
    const lx = Math.round(hx - 0.5), rx = Math.round(hx + 3.5), yy = Math.round(hy - 1);
    const twoEyes = (fn) => { fn(lx); fn(rx); };
    if (blink) twoEyes(x => pb.hline(x, x + 1, yy + 2, c1));
    else switch (eyeMode) {
      case 'happy': twoEyes(x => { pb.set(x, yy + 2, c1); pb.set(x + 1, yy + 1, c2); pb.set(x + 2, yy + 2, c1); }); break;
      case 'big': twoEyes(x => { pb.rect(x, yy, 2, 4, c1); pb.set(x, yy, c2); pb.set(x - 1, yy + 1, c1); pb.set(x + 2, yy + 2, c1); }); break;
      case 'mixed': pb.rect(lx, yy, 2, 4, c1); pb.set(lx, yy, c2); pb.hline(rx, rx + 1, yy + 2, c1); pb.set(rx + 2, yy, '#ffe14d'); break;
      case 'down': twoEyes(x => { pb.rect(x, yy + 2, 2, 2, c1); }); pb.set(lx - 1, yy + 1, c1); pb.set(rx + 2, yy + 1, c1); break;
      case 'brave': twoEyes(x => { pb.rect(x, yy + 1, 2, 3, c1); pb.set(x, yy + 1, c2); }); pb.set(lx - 1, yy, c1); pb.set(rx + 2, yy, c1); break;
      case 'tired': twoEyes(x => { pb.hline(x, x + 1, yy + 2, c1); pb.set(x, yy + 3, '#106884'); }); break;
      case 'star': twoEyes(x => { pb.set(x, yy + 1, '#ffe14d'); pb.set(x + 1, yy + 1, c2); pb.set(x + 1, yy, '#ffe14d'); pb.set(x + 1, yy + 2, '#ffe14d'); pb.set(x + 2, yy + 1, '#ffe14d'); }); break;
      default: twoEyes(x => { pb.rect(x, yy, 2, 4, c1); pb.set(x, yy, c2); });
    }
    if (anim === 'talk' && Math.floor(t * 6) % 2) pb.hline(Math.round(hx + 1), Math.round(hx + 3), Math.round(hy + 3), c1);
    // ventanilla del compartimento de muestras
    pb.rect(Math.round(bx), Math.round(by + 2), 3, 2, '#2a1a10'); pb.set(Math.round(bx + 1), Math.round(by + 2), '#56e5ff');
    // microturbina (aspas)
    const rx2 = Math.round(tx1 - 1), ry2 = Math.round(ty1 - 5);
    const ang = t * TAU * 2 + (anim === "run" ? t * TAU * 2 : 0);
    for (let k = 0; k < 3; k++) { const a = ang + k * TAU / 3; pb.line(rx2, ry2, rx2 + Math.round(Math.cos(a) * 3), ry2 + Math.round(Math.sin(a) * 1.5), '#ffe2b0'); }
    pb.set(rx2, ry2, '#ffffff');
  }, 100);
  const pb = R.render();
  pb.anchors = { head: { x: hx, y: hy } };
  return pb;
}
CHARS.kiru = { name: 'KIRU', render: renderKiru, ox: 22, oy: 34, shadowR: 7 };

/* ------------------------------------------------------------------ */
/* Peinados y accesorios reutilizables                                 */
/* ------------------------------------------------------------------ */
const HAIR = {
  cap(R, o, ramp, opts = {}) {
    const { hx, hy, rx, ry } = o;
    const cap = SDF.sub(SDF.ellipse(hx - 1.2 + (opts.dx || 0), hy - 2.4 + (opts.dy || 0), rx + (opts.grow ?? 0.6), ry * (opts.sy || 0.86)), SDF.ellipse(hx + 5.8 + (opts.faceDX || 0), hy + 3.8 + (opts.faceDY || 0), 7.6, 7.4));
    R.custom(cap, [hx - rx - 4, hy - ry - 4, hx + rx + 4, hy + ry + 2], { ramp, base: 3, z: 55, group: 'hair', bevel: 4, shiny: true, texture: opts.texture });
  },
  strands(R, o, ramp, list, z = 56) {
    list.forEach(([ax, ay, bx, by, r1, r2], i) => R.capsule(o.hx + ax, o.hy + ay, o.hx + bx, o.hy + by, r1, r2 ?? r1 * 0.6, { ramp, base: 3, z: z + i * 0.01, group: 'strand' + i, bevel: r1, shiny: true, lineIdx: 1 }));
  },
  bun(R, o, ramp, dx = -5, dy = -9, r = 4.2) {
    R.circle(o.hx + dx, o.hy + dy, r, { ramp, base: 3, z: 54, group: 'bun', bevel: r, shiny: true });
    R.stamp(pb => { const x = Math.round(o.hx + dx), y = Math.round(o.hy + dy); pb.line(x - 3, y - 1, x + 2, y + 2, ramp[1]); pb.line(x - 2, y - 3, x + 3, y - 1, ramp[1]); }, 97);
  },
  braid(R, o, ramp, pts, tieCol) {
    pts.forEach(([x, y, r], i) => R.circle(x, y, r, { ramp, base: 3, z: 84 + i * 0.01, group: 'braid' + (i % 2), bevel: r, shiny: true, lineIdx: 1 }));
    if (tieCol) { const [x, y] = pts[pts.length - 1]; R.circle(x, y + 2, 1.2, { ramp: tieCol, base: 4, z: 85, group: 'tie', bevel: 1 }); }
  },
  spikes(R, o, ramp, list) {
    list.forEach(([ax, ay, bx, by, w], i) => R.poly([[o.hx + ax - w, o.hy + ay], [o.hx + ax + w, o.hy + ay + 0.5], [o.hx + bx, o.hy + by]], { ramp, base: 3, z: 53 + i * 0.01, group: 'spike' + i, bevel: 1.5, shiny: true, lineIdx: 1 }));
  },
};

/* ------------------------------------------------------------------ */
/* NAIRA VALDÉS — agroecóloga                                          */
/* ------------------------------------------------------------------ */
const NAIRA_D = {
  thigh: 11, shin: 11, footH: 2, footL: 5, pelvisH: 4, chestH: 13.5, torsoW: 14,
  headRX: 9, headRY: 9, upperArm: 8.5, foreArm: 8, armW: 2.2, legW: 2.8, handR: 1.8,
  eyeY: 0.5, eye1X: 1, eye2X: 5.5, eyeH: 4, mouthX: 4.5, mouthY: 6, iris: '#3a2e5a', blush: '#b8604a',
  mat: { skin: RAMP.skinN, hair: RAMP.hairN, top: MAT.nairaShirt, sleeve: MAT.nairaShirt, legs: MAT.olive, shoes: MAT.leather },
  defaultExpr: 'calm', energetic: 0.8,
  torso(R, o) {
    const { cx, hipY, waistY, shoulderY, tw, lx, torsoPts } = o;
    R.poly(torsoPts, { ramp: MAT.nairaShirt, base: 3, z: 30, group: 'torso', bevel: 6 });
    // chaleco terracota tejido
    R.poly([[cx - tw * 0.55 + lx * 0.95, shoulderY], [cx + 1 + lx, shoulderY], [cx + 1 + lx * 0.3, hipY + 3], [cx - tw * 0.6, hipY + 3]], { ramp: MAT.nairaVest, base: 3, z: 31, group: 'vest', bevel: 4,
      texture: (x, y, idx, ramp) => ((x + y) % 4 === 0 ? ramp[clamp(idx - 1, 1, 6)] : ((x - y + 64) % 4 === 0 && idx > 2 ? ramp[clamp(idx + 1, 1, 6)] : null)) });
    R.poly([[cx + 5 + lx, shoulderY + 0.5], [cx + 7.5 + lx, shoulderY + 1], [cx + 7 + lx * 0.4, hipY + 2], [cx + 4.5 + lx * 0.3, hipY + 2]], { ramp: MAT.nairaVest, base: 3, z: 31.5, group: 'vest2', bevel: 2 });
    // correa del morral de semillas
    R.capsule(cx - 6 + lx, shoulderY, cx + 6, waistY + 3, 0.9, 0.9, { ramp: MAT.leather, base: 4, z: 33, group: 'strap', bevel: 1 });
    R.box(cx + 6.5, hipY + 1, 3.2, 3.6, 1.2, { ramp: MAT.straw, base: 3, z: 34, group: 'bag', bevel: 2 });
    R.stamp(pb => { const bx = Math.round(cx + 4), by = Math.round(hipY - 1); pb.hline(bx, bx + 5, by + 2, MAT.straw[1]); pb.set(bx + 2, by + 4, '#86e36f'); pb.set(bx + 3, by + 4, '#ffe14d'); }, 95);
  },
  hair(R, o) {
    HAIR.cap(R, o, RAMP.hairN, { grow: 0.4 });
    HAIR.strands(R, o, RAMP.hairN, [[7, -4, 9, 2, 1.4], [4, -6, 5, -1, 1.3]]);
    // trenza gruesa sobre el hombro cercano
    const { hx, hy } = o; const sw = o.pose.hairSwing || 0;
    const pts = [];
    for (let i = 0; i < 9; i++) pts.push([hx - 2 + i * 0.55 + sw * i * 0.05, hy + 6 + i * 2.6, 2.3 - i * 0.08]);
    HAIR.braid(R, o, RAMP.hairN, pts, RAMP.yellow);
    // sombrero de ala ancha de paja
    R.ellipse(hx - 0.5, hy - 9.5, 7.6, 5, { ramp: MAT.straw, base: 3, z: 70, group: 'hatC', bevel: 4,
      texture: (x, y, idx, ramp) => (y % 2 === 0 && (x + (y >> 1)) % 3 === 0 ? ramp[clamp(idx - 1, 1, 6)] : null) });
    R.ellipse(hx + 0.5, hy - 6.2, 15.5, 2.8, { ramp: MAT.straw, base: 4, z: 71, group: 'hatB', bevel: 2,
      texture: (x, y, idx, ramp) => ((x * 2 + y) % 5 === 0 ? ramp[clamp(idx - 1, 1, 6)] : null) }, -0.04);
    R.box(hx - 0.5, hy - 7.8, 7.2, 1.1, 0.5, { ramp: MAT.nairaVest, base: 4, z: 72, group: 'hatBand', bevel: 1 });
    R.stamp(pb => {
      const fx = Math.round(hx + 4), fy = Math.round(hy - 9);
      pb.set(fx, fy, '#ffe14d'); pb.set(fx - 1, fy, '#fff08a'); pb.set(fx + 1, fy, '#e0b41e'); pb.set(fx, fy - 1, '#fff08a'); pb.set(fx, fy + 1, '#e0b41e'); pb.set(fx, fy, '#ff8e34');
      pb.set(fx + 3, fy + 1, '#86e36f'); pb.set(fx + 2, fy + 1, '#4ccb70');
    }, 98);
  },
  faceStamp(pb, o) { pb.set(Math.round(o.hx - 4), Math.round(o.hy + 4), '#4ccb70'); },
};
CHARS.naira = { name: 'Naira', render: (a, t, op) => renderHumanoid('naira', NAIRA_D, a, t, Object.assign({ expr: op.expr || NAIRA_D.defaultExpr }, op)), ox: 30, oy: 78, shadowR: 9 };

/* ------------------------------------------------------------------ */
/* DANTE VELA — mantenimiento eólico                                   */
/* ------------------------------------------------------------------ */
const DANTE_D = {
  thigh: 11.5, shin: 11.5, footH: 2.5, footL: 5.5, pelvisH: 4, chestH: 13.5, torsoW: 14.5,
  headRX: 9, headRY: 8.8, upperArm: 8.5, foreArm: 8, armW: 2.5, legW: 3, handR: 2.2,
  eyeY: 0.5, eye1X: 1, eye2X: 5.5, eyeH: 3, mouthX: 4.5, mouthY: 5.5, iris: '#2a5a3a', freckles: true,
  mat: { skin: RAMP.skinD, hair: RAMP.hairD, top: MAT.tshirtW, sleeve: MAT.tshirtW, legs: MAT.danteOver, shoes: MAT.boots, gloves: MAT.gloves },
  sole: '#3e2226', foreMat: RAMP.skinD, energetic: 1.3,
  torso(R, o) {
    const { cx, hipY, waistY, shoulderY, tw, lx, torsoPts } = o;
    R.poly(torsoPts, { ramp: MAT.tshirtW, base: 3, z: 30, group: 'torso', bevel: 6 });
    // peto del overol con tirantes
    R.poly([[cx - 5 + lx * 0.6, shoulderY + 5], [cx + 6 + lx * 0.6, shoulderY + 5], [cx + tw * 0.62, hipY + 2], [cx - tw * 0.6, hipY + 2]], { ramp: MAT.danteOver, base: 3, z: 31, group: 'over', bevel: 5 });
    R.capsule(cx - 5 + lx * 0.95, shoulderY, cx - 4 + lx * 0.6, shoulderY + 6, 1.1, 1.1, { ramp: MAT.danteOver, base: 3, z: 32, group: 'suspB', bevel: 1 });
    R.capsule(cx + 4 + lx, shoulderY, cx + 5 + lx * 0.6, shoulderY + 6, 1.1, 1.1, { ramp: MAT.danteOver, base: 4, z: 32, group: 'susp', bevel: 1 });
    // franja reflectiva naranja
    R.box(cx + 0.5, waistY + 1, tw * 0.62, 1.4, 0.3, { ramp: MAT.safety, base: 4, z: 33, group: 'stripe', bevel: 1 });
    // pañoleta roja al cuello
    R.ellipse(o.cx + 1 + lx, shoulderY + 0.5, 5.5, 2, { ramp: MAT.bandana, base: 3, z: 34, group: 'scarf', bevel: 1.5 });
    R.poly([[cx + 2 + lx, shoulderY + 1], [cx + 5 + lx, shoulderY + 1.5], [cx + 3.5 + lx, shoulderY + 5]], { ramp: MAT.bandana, base: 4, z: 34.5, group: 'scarf2', bevel: 1 });
    // llave inglesa en el arnés
    R.capsule(cx - 7, waistY + 1, cx - 6, hipY + 6, 0.9, 0.9, { ramp: RAMP.metal, base: 5, z: 35, group: 'tool', bevel: 1, shiny: true });
    R.stamp(pb => {
      const px = Math.round(cx + 1), py = Math.round(waistY - 4);
      pb.rect(px, py, 3, 2, MAT.danteOver[5]); pb.set(px + 1, py, '#ffe14d');
      pb.set(Math.round(cx - 4 + lx * 0.6), Math.round(shoulderY + 6), '#ffe14d'); pb.set(Math.round(cx + 5 + lx * 0.6), Math.round(shoulderY + 6), '#ffe14d');
    }, 95);
  },
  hair(R, o) {
    const { hx, hy } = o;
    HAIR.cap(R, o, RAMP.hairD, { grow: 0.2, sy: 0.8 });
    HAIR.spikes(R, o, RAMP.hairD, [[-8, -1, -12, 1, 1.6], [-8, 2, -11.5, 5, 1.5], [-6, 5, -8, 9, 1.4], [8, -3, 10.5, 1, 1.2]]);
    // casco amarillo
    R.custom(SDF.sub(SDF.ellipse(hx - 0.5, hy - 5, 9.8, 7.4), SDF.box(hx, hy + 4, 14, 6.5, 0)), [hx - 11, hy - 13, hx + 11, hy - 1], { ramp: MAT.hardhat, base: 3, z: 70, group: 'hat', bevel: 5, shiny: true });
    R.box(hx + 1.5, hy - 2.2, 11.5, 1.2, 0.6, { ramp: MAT.hardhat, base: 3, z: 71, group: 'brim', bevel: 1 });
    R.stamp(pb => { const x = Math.round(hx - 1), y = Math.round(hy - 11); pb.vline(x, y, y + 7, MAT.hardhat[5]); pb.rect(Math.round(hx + 2), Math.round(hy - 8), 3, 3, '#2a4caa'); pb.set(Math.round(hx + 3), Math.round(hy - 7), '#fff'); }, 98);
  },
};
CHARS.dante = { name: 'Dante', render: (a, t, op) => renderHumanoid('dante', DANTE_D, a, t, op), ox: 30, oy: 78, shadowR: 9 };

/* ------------------------------------------------------------------ */
/* DRA. ELIANA ROJAS — mentora                                          */
/* ------------------------------------------------------------------ */
const ELIANA_D = {
  thigh: 10.5, shin: 10.5, footH: 2, footL: 5, pelvisH: 4, chestH: 13.5, torsoW: 15,
  headRX: 9, headRY: 9, upperArm: 8, foreArm: 7.5, armW: 2.4, legW: 2.8, handR: 1.9,
  eyeY: 0.5, eye1X: 1, eye2X: 5.5, eyeH: 3, mouthX: 4.5, mouthY: 6, iris: '#4a3020',
  mat: { skin: RAMP.skinE, hair: RAMP.hairE, top: MAT.labcoat, sleeve: MAT.labcoat, legs: MAT.tealPants, shoes: MAT.boots },
  browCol: '#5c5e80', energetic: 0.7,
  torso(R, o) {
    const { cx, hipY, waistY, shoulderY, tw, lx, torsoPts } = o;
    // bata blanca larga (cubre muslos)
    const coat = [[cx - tw * 0.55 + lx * 0.95, shoulderY - 1], [cx + tw * 0.62 + lx, shoulderY], [cx + tw * 0.66, hipY + 9], [cx - tw * 0.7, hipY + 10]];
    R.poly(coat, { ramp: MAT.labcoat, base: 3, z: 43, group: 'coat', bevel: 6 });
    R.poly([[cx + 1.5 + lx, shoulderY], [cx + 6 + lx, shoulderY + 0.5], [cx + 5.5 + lx * 0.4, waistY + 2], [cx + 2 + lx * 0.3, waistY + 2]], { ramp: MAT.violetTop, base: 4, z: 44, group: 'turtle', bevel: 2 });
    R.poly([[cx + 1 + lx, shoulderY - 1], [cx + 5 + lx, shoulderY - 1.5], [cx + 2.5 + lx * 0.6, shoulderY + 7]], { ramp: MAT.labcoat, base: 4, z: 45, group: 'lapel', bevel: 1.5 });
    R.stamp(pb => {
      // cordón con credencial
      pb.line(Math.round(cx + 2 + lx), Math.round(shoulderY + 1), Math.round(cx + 4 + lx * 0.5), Math.round(waistY - 1), '#56e5ff');
      const bx = Math.round(cx + 3 + lx * 0.4), by = Math.round(waistY - 1);
      pb.rect(bx, by, 3, 4, '#f4fdff'); pb.hline(bx, bx + 2, by + 1, '#2c63c0');
      // bolsillo con lápices
      pb.rect(Math.round(cx - 7), Math.round(shoulderY + 4), 4, 1, MAT.labcoat[2]);
      pb.vline(Math.round(cx - 6), Math.round(shoulderY + 2), Math.round(shoulderY + 3), '#ffe14d');
      pb.vline(Math.round(cx - 5), Math.round(shoulderY + 1), Math.round(shoulderY + 3), '#ff6b6b');
      pb.vline(Math.round(cx + 1 + lx * 0.3), Math.round(waistY + 3), Math.round(hipY + 8), MAT.labcoat[2]);
    }, 95);
  },
  hair(R, o) {
    const { hx, hy } = o;
    HAIR.bun(R, o, RAMP.hairE, -6, -7.5, 4.2);
    HAIR.cap(R, o, RAMP.hairE, { grow: 0.3, sy: 0.82,
      texture: (x, y, idx, ramp) => ((x * 3 + y) % 6 === 0 ? ramp[clamp(idx - 1, 1, 5)] : null) });
    HAIR.strands(R, o, RAMP.hairE, [[7.5, -4, 9, 1, 1.1]]);
    R.stamp(pb => {
      // lápiz en el moño
      pb.line(Math.round(hx - 10), Math.round(hy - 11), Math.round(hx - 3), Math.round(hy - 6), '#ffd84a');
      pb.set(Math.round(hx - 10), Math.round(hy - 11), '#ff6b6b');
      // mechón gris oscuro
      pb.line(Math.round(hx - 2), Math.round(hy - 9), Math.round(hx + 5), Math.round(hy - 7), RAMP.hairE[1]);
    }, 97);
  },
  faceStamp(pb, o) {
    // gafas redondas
    const col = '#8a5e14', y = o.eyeY - 1;
    for (const ex of [o.e1x, o.e2x]) {
      pb.hline(ex - 1, ex + 2, y, col); pb.hline(ex - 1, ex + 2, y + 4, col); pb.vline(ex - 2, y + 1, y + 3, col); pb.vline(ex + 3, y + 1, y + 3, col);
      pb.set(ex + 2, y + 1, '#e6fdff');
    }
    pb.hline(o.e1x + 3, o.e2x - 2, y + 1, col);
  },
};
CHARS.eliana = { name: 'Dra. Eliana', render: (a, t, op) => renderHumanoid('eliana', ELIANA_D, a, t, op), ox: 30, oy: 78, shadowR: 9 };

/* ------------------------------------------------------------------ */
/* LIMEN — protocolo cristalino de agua, sal y píxeles                 */
/* ------------------------------------------------------------------ */
function renderLimen(anim, t, opts) {
  const R = new Rig(72, 100);
  const P = TAU * t;
  const cx = 36, cy = 46 + Math.round(Math.sin(P) * 1.5);
  const mood = opts.expr || 'calm'; // calm | alert | warn | speak | soft
  const L = RAMP.limen;
  const facet = (pts, base, z, group) => R.poly(pts, { ramp: L, base, z, group, flat: true, lineCol: '#0e2b4a' });
  const off = (i) => Math.sin(P + i * 1.3) * 1.2;
  // brazos flotantes (fragmentos)
  for (const side of [-1, 1]) {
    const ax = cx + side * 17, ay = cy - 2 + off(side + 2);
    facet([[ax, ay - 9], [ax + side * 3, ay - 1], [ax, ay + 10], [ax - side * 2, ay]], side < 0 ? 4 : 2, 2, 'arm' + side);
    facet([[ax, ay - 9], [ax - side * 2, ay], [ax, ay + 10]], side < 0 ? 5 : 3, 2.1, 'armb' + side);
    facet([[ax + side * 1, ay + 13], [ax + side * 3, ay + 17], [ax + side * 1, ay + 21], [ax - side, ay + 17]], 3, 2.2, 'armc' + side);
  }
  // corona de fragmentos alrededor del núcleo
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + i * TAU / 7 + Math.sin(P) * 0.05;
    const r0 = 6, r1 = 15 + (i % 2) * 2;
    const x0 = cx + Math.cos(a) * r0, y0 = cy + Math.sin(a) * r0 * 1.1;
    const x1 = cx + Math.cos(a) * r1, y1 = cy + Math.sin(a) * r1 * 1.25;
    const nx = -Math.sin(a) * 3, ny = Math.cos(a) * 3;
    const light = Math.cos(a + 2.3) > 0 ? 4 : 2;
    facet([[x0 + nx * 0.4, y0 + ny * 0.4], [lerp(x0, x1, 0.55) + nx, lerp(y0, y1, 0.55) + ny], [x1, y1], [lerp(x0, x1, 0.55), lerp(y0, y1, 0.55)]], light + 1, 5 + i * 0.01, 's' + i);
    facet([[x0 - nx * 0.4, y0 - ny * 0.4], [lerp(x0, x1, 0.55) - nx, lerp(y0, y1, 0.55) - ny], [x1, y1], [lerp(x0, x1, 0.55), lerp(y0, y1, 0.55)]], light, 5.005 + i * 0.01, 'sb' + i);
  }
  // cabeza: diamante facetado
  const hy = cy - 27 + Math.round(off(5));
  facet([[cx, hy - 10], [cx + 7, hy], [cx, hy + 3]], 3, 20, 'h1');
  facet([[cx, hy - 10], [cx - 7, hy], [cx, hy + 3]], 5, 20.1, 'h2');
  facet([[cx - 7, hy], [cx, hy + 3], [cx, hy + 9]], 4, 20.2, 'h3');
  facet([[cx + 7, hy], [cx, hy + 3], [cx, hy + 9]], 1, 20.3, 'h4');
  // cuerpo inferior en cola de cristal
  const by = cy + 16;
  facet([[cx - 6, by], [cx, by - 3], [cx, by + 26 + off(7)]], 5, 8, 'b1');
  facet([[cx + 6, by], [cx, by - 3], [cx, by + 26 + off(7)]], 2, 8.1, 'b2');
  facet([[cx - 9, by + 14 + off(8)], [cx - 6, by + 12], [cx - 5, by + 20 + off(8)]], 4, 8.2, 'b3');
  facet([[cx + 9, by + 16 + off(9)], [cx + 6, by + 13], [cx + 6, by + 22 + off(9)]], 3, 8.3, 'b4');
  // núcleo-ojo
  const coreCol = mood === 'alert' ? RAMP.coral : mood === 'warn' ? RAMP.yellow : RAMP.cyan;
  R.circle(cx, cy, 5.2, { ramp: MAT.ink, base: 2, z: 30, group: 'coreRing', flat: true });
  R.circle(cx, cy, 4, { ramp: coreCol, base: 5, z: 31, group: 'core', bevel: 4, shiny: true });
  R.stamp(pb => {
    // pupila vertical
    const blink = anim === 'idle' && t > 0.88;
    if (blink) pb.hline(cx - 2, cx + 2, cy, '#0e2b4a');
    else { pb.vline(cx, cy - 2, cy + 2, '#0e2b4a'); if (mood === 'speak') pb.vline(cx + 1, cy - 1, cy + 1, '#0e2b4a'); }
    pb.set(cx - 2, cy - 2, '#ffffff');
    // brillos de arista
    pb.line(cx - 6, hy - 1, cx - 1, hy - 8, '#ffffff');
    pb.set(cx - 5, cy - 13, '#ffffff'); pb.set(cx + 10, cy - 6, '#c4fbff');
    // gotas orbitando
    for (let i = 0; i < 4; i++) {
      const a = P + i * TAU / 4;
      const x = Math.round(cx + Math.cos(a) * 24), y = Math.round(cy + 6 + Math.sin(a) * 6);
      pb.set(x, y, '#56e5ff'); pb.set(x, y - 1, '#e6fdff'); pb.set(x, y + 1, '#1491aa');
    }
    // cristales de sal (blancos)
    for (let i = 0; i < 3; i++) { const a = -P * 0.7 + i * 2.1; pb.set(Math.round(cx + Math.cos(a) * 30), Math.round(cy - 12 + Math.sin(a) * 9), '#fff2f8'); }
    // glitch de píxel
    const gy = Math.round(cy - 20 + ((t * 7) % 1) * 50);
    for (let x = 0; x < 72; x++) if (pb.alpha(x, gy) && hash2(x, gy, Math.floor(t * 8)) < 0.4) pb.set(x + 1, gy, '#b49cff');
  }, 100);
  const pb = R.render({ outlineColor: '#0b2238' });
  pb.anchors = { head: { x: cx, y: hy }, core: { x: cx, y: cy } };
  return pb;
}
CHARS.limen = { name: 'LIMEN', render: renderLimen, ox: 36, oy: 96, shadowR: 10 };

/* ------------------------------------------------------------------ */
/* MIRAGE / MOSAICO — gemelo digital                                    */
/* ------------------------------------------------------------------ */
const MOSAIC_LAYERS = ['#56e5ff', '#ffe14d', '#86e36f', '#20d6c7', '#ff7656', '#eab02a', '#8d6bff'];
function renderTwin(anim, t, opts, mosaic) {
  const R = new Rig(104, 136);
  const P = TAU * t;
  const cx = 52, hov = Math.round(Math.sin(P) * 2);
  const hy = 24 + hov;
  const iri = (x, y, idx, ramp) => {
    if (mosaic) {
      const cxl = Math.floor(x / 4), cyl = Math.floor((y - hov) / 4);
      if (x % 4 === 0 || (y - hov) % 4 === 0) return '#0e1a2a';
      const c = MOSAIC_LAYERS[Math.floor(hash2(cxl, cyl, 11) * MOSAIC_LAYERS.length)];
      return idx <= 2 ? shade(c, -0.25) : idx >= 5 ? shade(c, 0.15) : c;
    }
    const band = Math.floor((y * 0.5 + Math.sin(x * 0.15 + P) * 4 + t * 16) / 3) % 6;
    const cols = ['#a830b8', '#e050c8', '#ff8ad0', '#56e5ff', '#ffd0e8', '#6a1c94'];
    let c = cols[(band + 6) % 6];
    // curvas de nivel (mapa)
    const iso = Math.sin(x * 0.21 + y * 0.09) + Math.sin(y * 0.17 - x * 0.05 + P);
    if (Math.abs(iso) < 0.08) c = '#fff6ff';
    if ((x + y) % 9 === 0 && idx > 3) c = '#ffd84a';
    if (idx <= 1) c = shade(c, -0.35);
    return c;
  };
  // vestido amplio
  const gown = [[cx - 9, hy + 18], [cx + 9, hy + 18], [cx + 14, hy + 40], [cx + 30 + Math.sin(P) * 2, 128 + hov * 0.3], [cx - 30 - Math.sin(P) * 2, 128 + hov * 0.3], [cx - 14, hy + 40]];
  R.poly(gown, { ramp: RAMP.mirage, base: 4, z: 10, group: 'gown', bevel: 10, texture: iri });
  // brazos-cinta
  const armUp = anim === 'talk' || anim === 'point' ? Math.max(0, Math.sin(P)) : 0.2;
  for (const side of [-1, 1]) {
    const sx = cx + side * 10, sy = hy + 20;
    const ex = cx + side * (22 + armUp * 6), ey = sy + 22 - armUp * 18;
    R.capsule(sx, sy, ex, ey, 3, 2, { ramp: RAMP.mirage, base: side < 0 ? 4 : 3, z: side < 0 ? 5 : 20, group: 'arm' + side, bevel: 3, texture: iri });
    R.capsule(ex, ey, ex + side * 4, ey + 14 - armUp * 10, 2, 1, { ramp: RAMP.mirage, base: side < 0 ? 4 : 3, z: side < 0 ? 5.1 : 20.1, group: 'hand' + side, bevel: 2, texture: iri });
  }
  // cuello y cabeza-espejo
  R.capsule(cx, hy + 8, cx, hy + 19, 3.5, 5, { ramp: RAMP.mirage, base: 4, z: 12, group: 'neck', bevel: 3, texture: iri });
  R.ellipse(cx, hy, 10, 13, { ramp: mosaic ? RAMP.cyan : RAMP.mirage, base: 5, z: 15, group: 'head', bevel: 5,
    texture: mosaic ? iri : (x, y, idx) => {
      const k = (y - hy + 13) / 26;
      const sky = ['#ffd0e8', '#fff6ff', '#c4fbff', '#56e5ff', '#e050c8', '#6a1c94'];
      let c = sky[clamp(Math.floor(k * 6 + Math.sin(x * 0.4 + P) * 0.4), 0, 5)];
      if (Math.abs((x - cx) + (y - hy) * 0.6 + 3) < 1.2) c = '#ffffff';
      return idx <= 2 ? shade(c, -0.3) : c;
    } });
  // halo de datos (corona)
  R.stamp(pb => {
    for (let i = 0; i < 11; i++) {
      const a = -Math.PI + i * Math.PI / 10;
      const x = Math.round(cx + Math.cos(a) * 17), y = Math.round(hy - 2 + Math.sin(a) * 18);
      pb.set(x, y, mosaic ? MOSAIC_LAYERS[i % 7] : (i % 2 ? '#56e5ff' : '#ffd84a'));
    }
    if (mosaic) {
      // rostro amable visible
      pb.rect(cx - 5, hy - 1, 2, 3, '#0e1a2a'); pb.rect(cx + 3, hy - 1, 2, 3, '#0e1a2a');
      pb.set(cx - 5, hy - 1, '#ffffff'); pb.set(cx + 3, hy - 1, '#ffffff');
      pb.set(cx - 2, hy + 5, '#0e1a2a'); pb.hline(cx - 1, cx + 1, hy + 6, '#0e1a2a'); pb.set(cx + 2, hy + 5, '#0e1a2a');
    } else {
      // líneas de escaneo desplazadas (glitch)
      for (let k = 0; k < 3; k++) {
        const gy = Math.round(30 + ((t * 3 + k * 0.37) % 1) * 96);
        const row = []; for (let x = 0; x < 104; x++) row.push(pb.get(x, gy));
        for (let x = 0; x < 104; x++) if (row[x] >>> 24) pb.set(x + 2, gy, row[x]);
      }
    }
  }, 100);
  const pb = R.render({ outlineColor: mosaic ? '#06100a' : '#1d0b3a' });
  pb.anchors = { head: { x: cx, y: hy } };
  return pb;
}
CHARS.mirage = { name: 'MIRAGE', render: (a, t, o) => renderTwin(a, t, o, false), ox: 52, oy: 132, shadowR: 22 };
CHARS.mosaico = { name: 'MOSAICO', render: (a, t, o) => renderTwin(a, t, o, true), ox: 52, oy: 132, shadowR: 22 };

/* ------------------------------------------------------------------ */
/* BETA-9 — robot batería que expresa su SOC                            */
/* ------------------------------------------------------------------ */
function renderBeta(anim, t, opts) {
  const R = new Rig(40, 48);
  const P = TAU * t;
  const soc = (opts.variant ?? 6) / 10;
  const bob = Math.round(Math.sin(P) * 0.6 + 0.4);
  const cx = 20, by = 30 + bob;
  R.box(cx, 41, 9, 3, 2, { ramp: MAT.ink, base: 3, z: 1, group: 'tread', bevel: 1.5 });
  R.box(cx, by, 9, 11, 2.5, { ramp: RAMP.metal, base: 4, z: 5, group: 'body', bevel: 4 });
  R.box(cx, by - 12, 4, 1.6, 0.6, { ramp: RAMP.metal, base: 5, z: 6, group: 'cap', bevel: 1, shiny: true });
  for (const s of [-1, 1]) R.capsule(cx + s * 9, by - 2, cx + s * 12, by + 4 + (anim === 'talk' && s > 0 ? -Math.max(0, Math.sin(P)) * 6 : 0), 1.3, 1.1, { ramp: RAMP.metal, base: 3, z: s > 0 ? 8 : 0, group: 'arm' + s, bevel: 1 });
  R.stamp(pb => {
    // pantalla de SOC
    pb.rect(cx - 6, by - 8, 12, 8, '#0a1030');
    const col = soc < 0.2 ? '#ff4e5d' : soc < 0.4 ? '#ffb83e' : '#86e36f';
    const n = Math.round(soc * 10);
    for (let i = 0; i < 10; i++) pb.set(cx - 5 + i, by - 2, i < n ? col : '#1c2350');
    // carita
    if (soc < 0.25) { pb.set(cx - 3, by - 6, col); pb.set(cx + 2, by - 6, col); pb.hline(cx - 2, cx + 1, by - 4, col); pb.set(cx - 3, by - 3, col); pb.set(cx + 2, by - 3, col); }
    else { pb.set(cx - 3, by - 6, col); pb.set(cx + 2, by - 6, col); pb.set(cx - 3, by - 4, col); pb.hline(cx - 2, cx + 1, by - 3, col); pb.set(cx + 2, by - 4, col); }
    // franjas de módulo
    for (let y = by + 2; y < by + 9; y += 2) pb.hline(cx - 7, cx + 7, y, RAMP.metal[2]);
    pb.set(cx, by - 14, anim === 'talk' && (Math.floor(t * 6) % 2) ? '#ff4e5d' : '#ffe14d');
    pb.vline(cx, by - 13, by - 13, '#98c6d2');
  }, 100);
  const pb = R.render();
  pb.anchors = { head: { x: cx, y: by - 8 } };
  return pb;
}
CHARS.beta9 = { name: 'BETA-9', render: renderBeta, ox: 20, oy: 46, shadowR: 9 };

/* ------------------------------------------------------------------ */
/* NPC generativos                                                      */
/* ------------------------------------------------------------------ */
const NPC_CLOTH = [
  ['#2a0c22', '#4a1a3a', '#7a2a58', '#a83e78', '#d0609a', '#ec8cbc'],
  ['#0c2232', '#123a52', '#1a5a78', '#287ca0', '#3ea2c4', '#72c8e2'],
  ['#2a2006', '#4a3a0a', '#7a6010', '#a88818', '#d6b42a', '#f4dc5a'],
  ['#0e2a18', '#16442a', '#226640', '#328a56', '#4cae6c', '#7ed090'],
  ['#2a1006', '#4e200c', '#7c3814', '#ac5420', '#d87430', '#f4a050'],
  ['#1a1240', '#2a2066', '#3e3290', '#5648b6', '#7466d6', '#9a90ee'],
  ['#3a3a4a', '#5a5a70', '#7e7e96', '#a4a4ba', '#cacade', '#ececf8'],
  ['#3a0a0a', '#6a1414', '#9a2020', '#c83030', '#f04a40', '#ff8070'],
];
const SKINS = ['skinA', 'skinN', 'skinD', 'skinE', 'skinM'];
const NPC_HAIRS = [RAMP.hairA, RAMP.hairN, RAMP.hairD, RAMP.hairE, ['#1a1010', '#2e1c18', '#4a2e24', '#6a4432', '#8c5c42', '#ae7a56']];
function makeNPC(id, cfg) {
  const r = RNG(cfg.seed || 1);
  const skin = RAMP[cfg.skin || r.pick(SKINS)];
  const hairR = cfg.hair || r.pick(NPC_HAIRS);
  const top = cfg.top || r.pick(NPC_CLOTH), legs = cfg.legs || r.pick(NPC_CLOTH.concat([MAT.amayaPants, MAT.olive, MAT.tealPants]));
  const child = !!cfg.child;
  const style = cfg.style || r.pick(['short', 'bun', 'long', 'curly', 'cap', 'braid', 'bald']);
  const D = {
    thigh: child ? 6.5 : 10.5 + r.range(-0.5, 1), shin: child ? 6.5 : 10.5 + r.range(-0.5, 1), footH: 2, footL: child ? 4 : 5, pelvisH: child ? 3 : 4,
    chestH: child ? 9 : 13 + r.range(-0.5, 1), torsoW: (child ? 11 : 14 + r.range(-1, 2)) * (cfg.wide || 1),
    headRX: child ? 8.5 : 9, headRY: child ? 8.5 : 9, upperArm: child ? 5.5 : 8, foreArm: child ? 5 : 7.5, armW: child ? 1.9 : 2.3 * (cfg.wide || 1), legW: child ? 2.2 : 2.8, handR: 1.8,
    eyeY: 0.5, eye1X: 1, eye2X: 5.5, eyeH: child ? 4 : 3, mouthX: 4.5, mouthY: 6, iris: '#3a2a30', blush: child ? '#e07a6a' : null,
    mat: { skin, hair: hairR, top, sleeve: top, legs, shoes: cfg.shoes || MAT.boots },
    foreMat: cfg.shortSleeve ? skin : null,
    energetic: child ? 1.4 : 1,
    hair(R, o) {
      const { hx, hy } = o;
      if (style === 'bald') { HAIR.strands(R, o, hairR, [[-7, -1, -8, 4, 1.6]]); }
      else if (style === 'cap' || cfg.hat === 'cap') {
        HAIR.cap(R, o, hairR, { grow: 0.1, sy: 0.75 });
        const hc = cfg.hatCol || r.pick(NPC_CLOTH);
        R.custom(SDF.sub(SDF.ellipse(hx - 0.5, hy - 4.5, 9.5, 6.4), SDF.box(hx, hy + 4, 14, 6, 0)), [hx - 11, hy - 12, hx + 11, hy - 1], { ramp: hc, base: 3, z: 70, group: 'hat', bevel: 4 });
        R.box(hx + 7, hy - 2.4, 5, 1, 0.5, { ramp: hc, base: 2, z: 71, group: 'brim', bevel: 1 });
      } else {
        HAIR.cap(R, o, hairR, { grow: style === 'long' || style === 'curly' ? 1.2 : 0.4, sy: style === 'short' ? 0.8 : 0.9 });
        if (style === 'bun') HAIR.bun(R, o, hairR, -5, -8, 3.6);
        if (style === 'long') R.capsule(hx - 5, hy, hx - 6, hy + 14, 4, 3, { ramp: hairR, base: 3, z: 3, group: 'longhair', bevel: 3, shiny: true });
        if (style === 'curly') [[-6, -6, 3], [-8, 0, 3], [-2, -9, 3], [3, -8, 2.6], [-7, 5, 2.6]].forEach(([dx, dy, rr], i) => R.circle(hx + dx, hy + dy, rr, { ramp: hairR, base: 3, z: 56 + i * 0.01, group: 'c' + i, bevel: rr, shiny: true, lineIdx: 1 }));
        if (style === 'braid') { const pts = []; for (let i = 0; i < (child ? 4 : 6); i++) pts.push([hx - 6 - i * 0.3, hy + 4 + i * 2.4, 1.9]); HAIR.braid(R, o, hairR, pts, RAMP.coral); }
        if (child && cfg.pigtails) { R.circle(hx - 9, hy - 1, 2.6, { ramp: hairR, base: 3, z: 3, group: 'pt1', bevel: 2 }); R.circle(hx - 7, hy + 5, 2.4, { ramp: hairR, base: 3, z: 3, group: 'pt2', bevel: 2 }); }
      }
      if (cfg.hat === 'bucket') {
        const hc = cfg.hatCol || NPC_CLOTH[1];
        R.ellipse(hx - 0.5, hy - 7.5, 8, 4.5, { ramp: hc, base: 3, z: 70, group: 'hatC', bevel: 3 });
        R.ellipse(hx + 0.5, hy - 4.6, 11.5, 2.2, { ramp: hc, base: 2, z: 71, group: 'hatB', bevel: 1.5 });
      }
      if (cfg.hat === 'aviator') {
        R.custom(SDF.sub(SDF.ellipse(hx - 0.5, hy - 3, 10, 8), SDF.ellipse(hx + 6, hy + 4, 7.6, 7.2)), [hx - 12, hy - 12, hx + 12, hy + 8], { ramp: MAT.leather, base: 3, z: 70, group: 'av', bevel: 3 });
        R.ellipse(hx + 3, hy - 7.5, 2.4, 1.8, { ramp: RAMP.metal, base: 5, z: 72, group: 'g1', bevel: 1, shiny: true });
        R.ellipse(hx - 2, hy - 8.5, 2.4, 1.8, { ramp: RAMP.metal, base: 4, z: 72, group: 'g2', bevel: 1, shiny: true });
      }
      if (cfg.flowers) R.stamp(pb => { [[-4, -9, '#f78acb'], [0, -10, '#ffe14d'], [4, -9, '#56e5ff'], [-7, -6, '#86e36f']].forEach(([dx, dy, c]) => { pb.set(Math.round(hx + dx), Math.round(hy + dy), c); pb.set(Math.round(hx + dx + 1), Math.round(hy + dy), '#fff'); }); }, 98);
    },
    torso: cfg.apron || cfg.vest || cfg.raincoat ? (R, o) => {
      const { cx, hipY, waistY, shoulderY, tw, lx, torsoPts } = o;
      R.poly(torsoPts, { ramp: top, base: 3, z: 30, group: 'torso', bevel: 6 });
      if (cfg.apron) R.poly([[cx - 3 + lx * 0.6, shoulderY + 3], [cx + 7 + lx * 0.6, shoulderY + 3], [cx + 8, hipY + 9], [cx - 5, hipY + 9]], { ramp: cfg.apron, base: 3, z: 44, group: 'apron', bevel: 3 });
      if (cfg.vest) R.poly([[cx - tw * 0.55 + lx * 0.95, shoulderY], [cx + 1 + lx, shoulderY], [cx + 1, hipY + 2], [cx - tw * 0.6, hipY + 2]], { ramp: cfg.vest, base: 3, z: 31, group: 'vest', bevel: 3 });
      if (cfg.raincoat) R.stamp(pb => { pb.hline(Math.round(cx - 6), Math.round(cx + 7), Math.round(waistY - 2), '#fff08a'); pb.hline(Math.round(cx - 6), Math.round(cx + 7), Math.round(waistY - 1), '#c8d8e8'); }, 95);
    } : null,
    faceStamp(pb, o) {
      if (cfg.mustache) { pb.hline(Math.round(o.hx + 2), Math.round(o.hx + 7), Math.round(o.hy + 4.5), cfg.mustache); pb.set(Math.round(o.hx + 1), Math.round(o.hy + 5.5), cfg.mustache); }
      if (cfg.glasses) { const y = o.eyeY - 1; for (const ex of [o.e1x, o.e2x]) { pb.rect(ex - 1, y, 4, 1, cfg.glasses); pb.rect(ex - 1, y + 4, 4, 1, cfg.glasses); } }
      if (cfg.wrinkles) { pb.set(o.e1x - 2, o.eyeY + 1, skin[2]); pb.set(o.e2x + 3, o.eyeY + 1, skin[2]); }
    },
  };
  CHARS[id] = { name: cfg.name || id, render: (a, t, op) => renderHumanoid(id, D, a, t, op), ox: 30, oy: 78, shadowR: child ? 7 : 9, D };
  return D;
}
makeNPC('marea', { name: 'Tía Marea', seed: 11, skin: 'skinM', hair: RAMP.hairE, style: 'braid', top: MAT.danteOver, legs: MAT.tealPants, hat: 'bucket', hatCol: MAT.kiruBody, raincoat: true, wrinkles: true, shoes: MAT.boots });
makeNPC('cobre', { name: 'Don Cobre', seed: 22, skin: 'skinE', hair: RAMP.hairE, style: 'bald', top: MAT.tshirtW, legs: MAT.amayaPants, apron: RAMP.copper, mustache: '#cdcfe2', glasses: '#c8861a', wrinkles: true, wide: 1.12 });
makeNPC('alma', { name: 'Alma Semilla', seed: 33, skin: 'skinA', hair: RAMP.hairA, style: 'curly', child: true, pigtails: true, top: MAT.nairaShirt, legs: MAT.kiruBody, flowers: true, shoes: MAT.sneakerY });
makeNPC('nimbo', { name: 'Capitán Nimbo', seed: 44, skin: 'skinD', hair: RAMP.hairE, style: 'short', top: NPC_CLOTH[5], legs: MAT.olive, hat: 'aviator', mustache: '#a8aac6', vest: RAMP.coral });
makeNPC('consejal', { name: 'Consejera Ruth', seed: 55, skin: 'skinN', hair: RAMP.hairN, style: 'bun', top: NPC_CLOTH[0], legs: MAT.amayaPants, glasses: '#8a5e14' });
makeNPC('operador', { name: 'Operador Iván', seed: 66, skin: 'skinM', style: 'cap', hat: 'cap', hatCol: NPC_CLOTH[1], top: NPC_CLOTH[6], legs: MAT.danteOver, vest: MAT.safety });
makeNPC('pastora', { name: 'Doña Celia', seed: 77, skin: 'skinA', hair: RAMP.hairE, style: 'long', top: NPC_CLOTH[7], legs: NPC_CLOTH[4], wrinkles: true });
makeNPC('financia', { name: 'Sr. Ledesma', seed: 88, skin: 'skinE', hair: RAMP.hairN, style: 'short', top: NPC_CLOTH[5], legs: NPC_CLOTH[5], glasses: '#263442' });
for (let i = 0; i < 14; i++) makeNPC('crowd' + i, { seed: 100 + i * 7, child: i % 4 === 3, pigtails: i % 8 === 3, shortSleeve: i % 2 === 0, hat: i % 5 === 1 ? 'cap' : null });
