/* =====================================================================
   11_chars.js — Diseño de personajes (sprites) del rediseño visual.
   Amaya (canon de la referencia), KIRU (fusión biblia + referencia),
   Naira, Dante, Eliana, LIMEN, MIRAGE/MOSAICO, BETA-9 y NPC generativos
   con registros BODY / OUTFIT / PROP / HAIR2.
   Humanoides: lienzo 88×104, ancla (40,100). KIRU: 60×64, ancla (30,62).
   Pipeline de materiales v2 (10_rig.js): contorno por material V≤0,15,
   luz clave arriba-delante, luz de borde, sombras proyectadas.
   ===================================================================== */

/* Rampas antiguas (los retratos de 14_portraits.js leen estas claves: solo se añaden) */
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

/* Rampas propias del rediseño (a mano, sombras hacia granate/navy, nunca violeta gris) */
const RAMP_CH = {
  glovesAm: ['#140804', '#2a120a', '#3e1a0c', '#5c3016', '#7e4a22', '#a06a34'],
  sockAm: ['#5a3a1a', '#a8784a', '#d8a868', '#f7c782', '#fbe0b0', '#fff4dc'],
  tieAm: ['#3a2606', '#7a5a10', '#b88a18', '#e6b422', '#ffd84a', '#fff08a'],
  strapNavy: ['#08080f', '#14162a', '#1e2340', '#2a3358', '#3a4670', '#56648c'],
  flapAm: ['#1e0a04', '#4a1e0c', '#7a3412', '#a8521e', '#cc7432', '#e8984c', '#f6c07a'],
  denim: ['#0a1428', '#122446', '#1c3866', '#2a5088', '#3e6ca8', '#6a92c8', '#a8c4e4'],
  khaki: ['#2a2010', '#4a3a1e', '#6e5a32', '#94804a', '#b8a468', '#d6c690', '#efe4bc'],
  cream: ['#3a2a1e', '#6a5440', '#9a8264', '#c4ae8c', '#e4d4b4', '#f8eedc', '#ffffff'],
  terracotta: ['#2e0c06', '#56180c', '#842a14', '#b0441e', '#d4642c', '#ec8a48', '#f8b878'],
  mustard: ['#2e2006', '#58400c', '#866414', '#b08a1c', '#d4ae2a', '#ecce4c', '#f8e88a'],
  teal: ['#04221e', '#0a3c36', '#12584e', '#1c7a6a', '#2a9c86', '#48bea4', '#86dcc6'],
  plum: ['#1c0618', '#360c2c', '#561646', '#782464', '#9a3a84', '#bc5ea4', '#dc8cc6'],
  sage: ['#141e10', '#24341c', '#364c2a', '#4c663a', '#66824e', '#88a26a', '#b0c690'],
  charcoal: ['#0c0c12', '#18181f', '#26262f', '#363642', '#4a4a58', '#646474', '#8a8a9a'],
  hivis: ['#3a3604', '#6a6206', '#a09a0c', '#d4d014', '#eef03a', '#f8fa8a'],
  hivisO: ['#4a1804', '#80300a', '#c04e10', '#f06e1a', '#ff9440', '#ffc080'],
  rain: ['#3a2a04', '#6e5208', '#a88010', '#dcb01c', '#f4d240', '#fcec96'],
  pinkTop: ['#2e0a1a', '#561430', '#86224c', '#b8386c', '#e05a8e', '#f48cb2', '#fcc4d8'],
  skyTop: ['#081a30', '#0e2e52', '#164878', '#20669e', '#3488c2', '#5eaedc', '#a0d4f0'],
  greyHair: ['#2a2a36', '#4a4a5a', '#70707e', '#9696a4', '#bcbcc8', '#e2e2ea'],
  blondHair: ['#2e1a06', '#5a360c', '#8a5a16', '#b88224', '#dcac3c', '#f2d270', '#fcecb0'],
  blackHair: ['#06060c', '#101018', '#1c1c28', '#2a2a3a', '#3c3c50', '#56566c'],
  brownHair: ['#140a06', '#2a1408', '#44220e', '#623416', '#844c22', '#a86a34'],
  redHair: ['#1c0604', '#3c0e06', '#62180a', '#8c2810', '#b83e18', '#dc5e26', '#f08a44'],
  // pieles adicionales (7 tonos, sombra hacia el rojizo)
  skinPale: ['#4a1e14', '#8a4430', '#c06e52', '#e09676', '#f4b896', '#fcd2b4', '#fff0e0'],
  skinTan: ['#3a160c', '#6a2e1a', '#9a4c2a', '#c06c3c', '#d88c54', '#eaac74', '#f8d0a0'],
  skinDeep: ['#1a0a08', '#341610', '#4e2418', '#6a3422', '#86462e', '#a25c3e', '#bc7a56'],
};
const SKIN_RAMPS = () => Object.assign({}, RAMP, RAMP_CH);

/* ------------------------------------------------------------------ */
/* Materiales de personaje (perezosos: 17a_kit_palette.js carga después) */
/* ------------------------------------------------------------------ */
let _CM = null;
function charMats() {
  if (_CM) return _CM;
  const R2 = RAMP;
  _CM = {
    hairAm: Mat({ ramp: R2.hairAm, outline: '#1a0405', line: R2.hairAm[1] }),
    skinAm: Mat({ ramp: R2.skinAm, outline: '#602316', line: R2.skinAm[2] }),
    jacketAm: Mat({ ramp: R2.jacketAm, outline: '#4b0706', line: R2.jacketAm[1] }),
    topAm: Mat({ ramp: R2.topAm, outline: '#2a1a20', line: R2.topAm[1] }),
    packAm: Mat({ ramp: R2.packSteel, outline: '#171d35', line: R2.packSteel[1] }),
    leatherAm: Mat({ ramp: R2.leatherAm, outline: '#1e0a04', line: R2.leatherAm[1] }),
    flapAm: Mat({ ramp: RAMP_CH.flapAm, outline: '#1e0a04', line: RAMP_CH.flapAm[1] }),
    shortsAm: Mat({ ramp: R2.shortsAm, outline: '#1e1a18', line: R2.shortsAm[1] }),
    leggingsAm: Mat({ ramp: R2.leggingsAm, outline: '#120808', line: R2.leggingsAm[0] }),
    bootsAm: Mat({ ramp: R2.bootsAm, outline: '#230705', line: R2.bootsAm[1] }),
    glovesAm: Mat({ ramp: RAMP_CH.glovesAm, outline: '#120604', line: RAMP_CH.glovesAm[0] }),
    sockAm: Mat({ ramp: RAMP_CH.sockAm, outline: '#3a1a08', line: RAMP_CH.sockAm[1] }),
    tieAm: Mat({ ramp: RAMP_CH.tieAm, outline: '#2a1404' }),
    gogFrame: Mat({ ramp: R2.gogFrame, outline: '#0e0a14', line: R2.gogFrame[1] }),
    gogStrap: Mat({ ramp: RAMP_CH.strapNavy, outline: '#070813', line: RAMP_CH.strapNavy[0] }),
    // KIRU: todo con contorno navy-negro #070813
    kShell: Mat({ ramp: R2.kiruShell, outline: '#070813', line: R2.kiruShell[3] }),
    kVisor: Mat({ ramp: R2.kiruVisor, outline: '#070813', line: R2.kiruVisor[0], rim: false }),
    kRim: Mat({ ramp: ['#0a0c16', '#2c3344', '#3a4456', '#556275', '#6e7a8e', '#8a96aa'], outline: '#070813', rim: false }),
    kEarO: Mat({ ramp: R2.kiruEarOuter, outline: '#070813', line: '#363c4d' }),
    kTurq: Mat({ ramp: R2.kiruTurq, outline: '#070813', line: R2.kiruTurq[0] }),
    kOrange: Mat({ ramp: R2.kiruOrange, outline: '#070813', line: R2.kiruOrange[0] }),
    kPod: Mat({ ramp: ['#000616', '#000c2a', '#061b4d', '#0e2f66', '#1a4a86', '#3a6aa6', '#6a94c8'], outline: '#070813', line: '#000616' }),
    kJoint: Mat({ ramp: ['#04060e', '#0a0c16', '#161c2c', '#242c40', '#343e56', '#4a566e'], outline: '#070813', rim: false }),
  };
  return _CM;
}

/* =====================================================================
   HAIR2 — pelo por mechones afilados (STYLE LOCK §10; 02_personajes §4.3b)
   o = {hx, hy, rx, ry, pose, tilt}; coordenadas de mechones relativas a la cabeza.
   ===================================================================== */
const HAIR2 = {
  /** Casquete del cráneo menos la cara. opts: grow, sy, dx, dy, faceDX, faceDY, faceR, z, base, cast, texture */
  cap(R, o, mat, opts = {}) {
    const { hx, hy, rx, ry } = o;
    const g = opts.grow ?? 1, sy = opts.sy ?? 0.92;
    const fr = opts.faceR ?? 0.72;
    const cap = SDF.sub(SDF.ellipse(hx - 1 + (opts.dx || 0), hy - 2.2 + (opts.dy || 0), rx + g, ry * sy + 0.6), SDF.ellipse(hx + 6.6 + (opts.faceDX || 0), hy + 5.4 + (opts.faceDY || 0), rx * fr, ry * fr));
    R.custom(cap, [hx - rx - 4, hy - ry - 4, hx + rx + 4, hy + ry + 3], { mat, base: opts.base ?? 4, z: opts.z ?? 55, group: opts.group || 'hair', bevel: 2.2, shiny: true, texture: opts.texture,
      cast: opts.cast === false ? undefined : { on: ['head', 'ear'], dx: -1, dy: 2 } });
  },
  /** Mechón en coordenadas locales de la cabeza */
  strand(R, o, mat, pts, r0, r1, opts = {}) {
    return R.strand(pts.map(([x, y]) => [o.hx + x, o.hy + y]), r0, r1, Object.assign({ mat, base: 4, z: 57, group: 'bangs', lineIdx: 1 }, opts));
  },
  /** Flequillo: lista de [[x,y]…, r] en coordenadas locales; proyecta sombra sobre la frente */
  bangs(R, o, mat, list, opts = {}) {
    list.forEach((b, i) => {
      const r = b[b.length - 1], pts = b.slice(0, -1);
      HAIR2.strand(R, o, mat, pts, r, 0.35, Object.assign({ z: (opts.z ?? 57) + i * 0.01, group: opts.group || 'bangs', cast: { on: ['head'], dx: -1, dy: 2 } }, opts));
    });
  },
  /** Mechón lateral delante de la oreja */
  lock(R, o, mat, pts, r, opts = {}) { HAIR2.strand(R, o, mat, pts, r, 0.4, Object.assign({ z: 58, group: 'lock', cast: { on: ['head'], dx: -1, dy: 1 } }, opts)); },
  /**
   * Coleta alta de mechones con movimiento secundario.
   * cfg: root [dx,dy], dir (rad, 0 = delante, π = atrás, π/2 = abajo), clumps [[dθ, len, r0, curl]…], tie mat, z
   */
  ponytail(R, o, mat, cfg) {
    const { hx, hy, pose } = o;
    const hp = pose.hair || { base: 0, amp: 0.08, P: 0, lag: 0.45 };
    const rx0 = hx + cfg.root[0], ry0 = hy + cfg.root[1];
    // dir: arranque (π = atrás, >π = atrás-arriba); curl < 0 dobla hacia abajo.
    // base < 0 (carrera) → menos caída y más hacia atrás; base > 0 (salto) → cae más.
    const lift = -hp.base * 0.25, droop = clamp(1 + hp.base * 0.6, 0.35, 1.8);
    const n = cfg.clumps.length;
    cfg.clumps.forEach(([dth, len, r0, curl], i) => {
      const pts = [[rx0 + (i - n / 2) * 0.3, ry0 + (i - n / 2) * 0.45]];
      const segs = 4, sl = len / segs;
      let a = (cfg.dir ?? 3.55) + dth + lift, x = pts[0][0], y = pts[0][1];
      for (let j = 1; j <= segs; j++) {
        a += (curl || 0) * droop + hp.amp * Math.sin(hp.P - j * hp.lag - i * 0.5) * 0.4;
        x += Math.cos(a) * sl; y += Math.sin(a) * sl;
        pts.push([x, y]);
      }
      R.strand(pts, r0, 0.35, { mat, base: cfg.base ?? 4, z: (cfg.z ?? 45) + i * 0.01 * (cfg.order || 1), group: 'pony' + (i % 2), lineIdx: cfg.lineIdx ?? 2, taper: cfg.taper ?? 1.7, rim: true });
    });
    if (cfg.mass) {
      // volumen en la raíz (la coleta nace gruesa y se abre en mechones)
      const ma = (cfg.dir ?? 3.55) + lift - 0.25 * droop, ml = cfg.mass;
      R.ellipse(rx0 + Math.cos(ma) * ml * 0.55, ry0 + Math.sin(ma) * ml * 0.55, ml * 0.62, ml * 0.42, { mat, base: (cfg.base ?? 4) - 1, z: (cfg.z ?? 45) - 0.5, group: 'pony1', bevel: 2, shiny: true }, ma);
    }
    if (cfg.tie) R.ellipse(rx0, ry0 + 0.5, 1.8, 2.0, { mat: cfg.tie, base: 3, z: 56, group: 'tie', bevel: 0.9, shiny: true }, 0.4);
    o.ponyRoot = [rx0, ry0];
  },
  /** Moño */
  bun(R, o, mat, dx = -5, dy = -10, r = 4.6) {
    R.circle(o.hx + dx, o.hy + dy, r, { mat, base: 4, z: 54, group: 'bun', bevel: r * 0.6, shiny: true });
    R.stamp(pb => { const x = Math.round(o.hx + dx), y = Math.round(o.hy + dy); pb.line(x - 3, y - 1, x + 2, y + 2, mat.ramp[1]); pb.line(x - 2, y - 3, x + 3, y - 1, mat.ramp[1]); pb.set(x - 1, y - 2, mat.ramp[5] || mat.ramp[4]); }, 97);
  },
  /** Trenza (cadena de eslabones) */
  braid(R, o, mat, pts, tie) {
    pts.forEach(([x, y, r], i) => R.circle(x, y, r, { mat, base: 4, z: 84 + i * 0.01, group: 'braid' + (i % 2), bevel: r * 0.7, shiny: true, lineIdx: 1 }));
    if (tie) { const [x, y] = pts[pts.length - 1]; R.circle(x, y + 2.4, 1.4, { mat: tie, base: 4, z: 85, group: 'btie', bevel: 0.8 }); }
  },
  /** Afro / rizos voluminosos (racimo con textura de bucles) */
  puff(R, o, mat, cx, cy, list, opts = {}) {
    const tex = (x, y, idx, ramp) => coilTexture(x, y, idx, ramp, 3);
    list.forEach(([dx, dy, r], i) => R.circle(cx + dx, cy + dy, r, { mat, base: opts.base ?? 3, z: (opts.z ?? 45) + (dy + 8) * 0.01, group: 'curl' + (i % 3), bevel: r * 0.7, shiny: true, lineIdx: 1, texture: tex }));
  },
  /** Arco de brillo de 1 px sobre la coronilla, solo en píxeles de los grupos dados */
  shine(R, o, groups, col, a0 = -2.5, a1 = -1.1, k = 0.72) {
    R.stamp(pb => {
      const zb = R.zbuf, parts = R.zparts; if (!zb) return;
      const c = U(col);
      for (let a = a0; a <= a1; a += 0.04) {
        const x = Math.round(o.hx - 1 + Math.cos(a) * o.rx * k), y = Math.round(o.hy - 2 + Math.sin(a) * o.ry * k * 0.95);
        const i = y * pb.w + x; if (x < 0 || y < 0 || x >= pb.w || y >= pb.h) continue;
        const p = zb[i]; if (p >= 0 && groups.includes(parts[p].group)) pb.data[i] = c;
      }
    }, 97);
  },
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

/** Render común de humanoides (lienzo 88×104, pipeline v2) */
function renderHumanoid(id, D, anim, t, opts) {
  const R = new Rig(HUM_W, HUM_H, { v2: true });
  const pose = poseFor(anim, t, D);
  if (opts.expr && !pose.expr) pose.expr = opts.expr;
  if (opts.expr && (anim === 'idle' || anim === 'talk' || anim === 'walk')) pose.expr = opts.expr;
  if (opts.mouth) pose.mouth = opts.mouth;
  if (opts.item) pose.item = opts.item;
  if (D.prepare) D.prepare();
  buildHumanoid(R, D, pose, opts);
  const pb = R.render({ env: opts.env, rim: D.rimK });
  pb.anchors = R.anchors;
  pb.anchors.shadowR = D.shadowR || 12;
  return pb;
}

/* Ojos de Amaya (perfil casi lateral, mira a la derecha). Columna 0 = remate exterior de la
   pestaña (lado de la oreja); iris hacia delante; brillo blanco arriba; iris que aclara abajo. */
const EYE_AM = {
  open: { oy: -2, rows: ['.KKKK', 'KKhDD', '.wDDM', '.wMLL', '..ss.'] },
  look: { oy: -2, rows: ['.KKKK', 'KKwhD', '.wwDD', '.wwML', '..ss.'] },
  half: { oy: -1, rows: ['.KKKK', 'KKKDD', '.wDLM', '..ss.'] },
  soft: { oy: 0, rows: ['.KKKK', 'K.DLM', '..ss.'] },
  determined: { oy: -2, rows: ['KKKKK', '.KhDD', '.wDDM', '.wMLL', '..ss.'] },
  wide: { oy: -3, rows: ['..KKK', '.KKKK', 'KwhDD', '.wDDM', '.wMLL', '..ww.'] },
  surprised: { oy: -3, rows: ['..KKK', '.K..K', 'Kwwhw', '.wDDw', '.wDDw', '..ww.'] },
  worried: { oy: -2, rows: ['...KK', 'KKKK.', '.whDD', '.wDDM', '.wMLL', '..ss.'] },
  sad: { oy: -2, rows: ['...KK', '.KKK.', 'K.hDD', '.wDDM', '.wMLL', '..ss.'] },
  blink: { oy: 1, rows: ['KKKKK', '..ss.'] },
};

/* ------------------------------------------------------------------ */
/* AMAYA SERRANO — canon de la referencia (STYLE LOCK §10)              */
/* ------------------------------------------------------------------ */
const AMAYA_D = {
  thigh: 13, shin: 13.5, footH: 3, footL: 7.5, pelvisH: 5, chestH: 16, torsoW: 12.8,
  headRX: 10.5, headRY: 11.5, upperArm: 10, foreArm: 9.5, armW: 2.5, legW: 3.1, handR: 2.2, neckR: 2.5,
  // cara amable/decidida como la referencia: ojo grande con brillo e iris castaño claro, sin ojo lejano
  // (perfil casi lateral), boca suave y rubor; sonrisa leve por defecto
  face: { eyeX: 2, eyeY: 0, eye2X: 8.5, mouthX: 5, mouthY: 6, noseX: 10.5, noseY: 3, iris: ['#2a0e04', '#6a3418', '#b06a34'], lash: '#1a0604', lashFar: '#3a0d06', blush: '#ff8a6a', browCol: '#3a0d06', mouthInk: '#7a2416', noFar: true, eyes: EYE_AM },
  defaultExpr: 'smile', earDX: -3.4, earDY: 2.5,
  shortSleeve: 0.55, fingerless: true, wristBand: true, sole: '#1a0a06', laces: '#e48a4a', bootTall: 4, earZ: 56,
  energetic: 1.15, shadowR: 12,
  prepare() {
    if (this.mat) return;
    const M = charMats();
    this.mat = { skin: M.skinAm, hair: M.hairAm, top: M.jacketAm, sleeve: M.jacketAm, legs: M.leggingsAm, shin: M.leggingsAm, shoes: M.bootsAm, gloves: M.glovesAm };
    this.foreMat = M.skinAm;
    this.sock = M.sockAm;
    this.accessories = [
      { kind: 'backpack', body: M.packAm, flap: M.flapAm, strap: M.leatherAm, w: 7.2, h: 9.8 },
      { kind: 'goggles', frame: M.gogFrame, strap: M.gogStrap },
    ];
  },
  torso(R, o) {
    const M = charMats();
    const { cx, hipY, waistY, shoulderY, tw, lx, chestH, torsoPts, pose } = o;
    // top blanco debajo (asoma en el escote y en el bajo)
    R.poly(torsoPts, { mat: M.topAm, base: 4, z: 30, group: 'top', bevel: 2 });
    // camisa-chaqueta roja de manga corta, abierta en V en el cuello, corta hasta la cintura
    const jy = waistY + 0.6, lag = Math.max(0, pose.pack || 0) * 0.5;
    const jacket = [
      [cx - tw * 0.55 + lx * 0.95, shoulderY - 1.5], [cx + tw * 0.06 + lx, shoulderY - 1.2], [cx + tw * 0.3 + lx * 0.85, shoulderY + 3.5],
      [cx + tw * 0.47 + lx * 0.55, waistY - chestH * 0.42], [cx + tw * 0.44 + lx * 0.2, jy + lag], [cx - tw * 0.52 + lx * 0.25, jy + 1 + lag],
      [cx - tw * 0.52 + lx * 0.5, waistY - chestH * 0.45],
    ];
    R.poly(jacket, { mat: M.jacketAm, base: 4, z: 31, group: 'jacket', bevel: 2.4, cast: { on: ['top'], dx: -1, dy: 2 } });
    // cuello levantado (detrás de la nuca) y solapa delantera
    R.poly([[cx - 4.5 + lx, shoulderY - 4.5], [cx - 0.5 + lx, shoulderY - 3.5], [cx + 1.5 + lx, shoulderY + 0.5], [cx - 5.5 + lx, shoulderY + 0.5]], { mat: M.jacketAm, base: 5, z: 28.5, group: 'collar', bevel: 1, lineIdx: 1 });
    R.poly([[cx + tw * 0.06 + lx, shoulderY - 1.4], [cx + tw * 0.28 + lx, shoulderY - 0.6], [cx + tw * 0.24 + lx * 0.85, shoulderY + 4.5]], { mat: M.jacketAm, base: 5, z: 32, group: 'lapel', bevel: 0.8, lineIdx: 1 });
    // cinturón de cuero con hebilla dorada y bolsa trasera
    R.box(cx + 0.3 + lx * 0.1, waistY + 2.6, tw * 0.49, 1.2, 0.4, { mat: M.leatherAm, base: 3, z: 37, group: 'belt', bevel: 0.8, cast: { on: ['shorts'], dx: 0, dy: 1 } });
    R.box(cx - tw * 0.46, waistY + 5.2, 2.5, 2.7, 1, { mat: M.leatherAm, base: 4, z: 38, group: 'pouch', bevel: 1 });
    // mapa doblado metido en el cinturón (delante)
    R.stamp((pb) => {
      const bx = Math.round(cx + tw * 0.3), by = Math.round(waistY + 2);
      pb.stampMap(bx - 1, by - 1, ['.ww', 'wyw', 'yyw', 'wy.', '.y.'], { w: '#fff4dc', y: '#dbaa29' });
      // hebilla
      pb.rect(Math.round(cx + tw * 0.08), Math.round(waistY + 2), 2, 2, '#ffd84a'); pb.set(Math.round(cx + tw * 0.08) + 1, Math.round(waistY + 3), '#a87a10');
      // pliegues de la chaqueta (axila, costado) y costuras
      const ax = Math.round(cx - 1 + lx * 0.8), ay = Math.round(shoulderY + 6);
      pb.set(ax, ay, M.jacketAm.ramp[2]); pb.set(ax + 1, ay + 1, M.jacketAm.ramp[2]); pb.set(ax + 1, ay, M.jacketAm.ramp[5]);
      pb.line(Math.round(cx - tw * 0.3 + lx * 0.6), Math.round(waistY - 5), Math.round(cx - tw * 0.18 + lx * 0.4), Math.round(waistY - 2), M.jacketAm.ramp[2]);
      // bolsillo de pecho con solapa
      const px = Math.round(cx + tw * 0.08 + lx * 0.7), py = Math.round(shoulderY + 7);
      pb.hline(px - 1, px + 2, py, M.jacketAm.ramp[2]); pb.hline(px - 1, px + 2, py - 1, M.jacketAm.ramp[5]);
      // insignia SYNARA: gota turquesa 3×3
      const ix = Math.round(cx + tw * 0.2 + lx * 0.75), iy = Math.round(shoulderY + 3);
      pb.stampMap(ix, iy, ['.a.', 'bcb', '.b.'], { a: '#7ff0dc', b: '#1aa894', c: '#d0fff2' });
      // bajo blanco del top bajo la chaqueta
      pb.hline(Math.round(cx - tw * 0.3), Math.round(cx + tw * 0.38), Math.round(jy + 1 + lag), M.topAm.ramp[3]);
    }, 95);
  },
  legwear(R, o) {
    const M = charMats();
    const { cx, hipY, lf, lb, hipFX, hipBX, legW } = o;
    // pantalón corto cargo caqui-gris sobre mallas oscuras
    R.box(cx - 0.4, hipY + 0.3, 6.2, 3.0, 2, { mat: M.shortsAm, base: 3, z: 36, group: 'shorts', bevel: 1.6 });
    const short = (Lg, hx, z, dark, grp) => {
      const k = 0.55, ex = lerp(hx, Lg.kx, k), ey = lerp(hipY + 1, Lg.ky, k);
      R.capsule(hx, hipY + 1, ex, ey, legW + 1.15, legW + 1.0, { mat: M.shortsAm, base: 3, z, group: grp, dark, bevel: 1.5 });
      // dobladillo 1 px más claro
      const cx2 = lerp(hx, Lg.kx, k - 0.06), cy2 = lerp(hipY + 1, Lg.ky, k - 0.06);
      R.capsule(cx2, cy2, ex, ey, legW + 1.25, legW + 1.1, { mat: M.shortsAm, base: 4, z: z + 0.1, group: grp + 'c', dark, bevel: 0.6, lineIdx: 2 });
      return [ex, ey];
    };
    short(lb, hipBX, 13, 1, 'shortsB');
    const [fx, fy] = short(lf, hipFX, 43, 0, 'shortsF');
    R.stamp(pb => {
      // bolsillo cargo y parche azul pálido 2×2
      const mx = Math.round(lerp(hipFX, fx, 0.45)), my = Math.round(lerp(hipY + 1, fy, 0.45));
      pb.rect(mx - 2, my - 1, 3, 1, M.shortsAm.ramp[2]); pb.set(mx - 2, my, M.shortsAm.ramp[2]);
      pb.rect(mx + 1, my + 1, 2, 2, '#9ab4be'); pb.set(mx + 1, my + 1, '#cfe0e6');
    }, 95);
  },
  hair(R, o) {
    const M = charMats();
    const { hx, hy, rx, ry, pose } = o;
    const H = M.hairAm;
    // casquete + volumen trasero hasta la nuca
    HAIR2.cap(R, o, H, { grow: 0.8, sy: 0.95, faceR: 0.84, faceDX: -1.4, faceDY: -1.0, base: 3 });
    R.ellipse(hx - rx * 0.55, hy + 1, 5, 7.5, { mat: H, base: 3, z: 54, group: 'hair', bevel: 2.2 }, 0.25);
    // coleta alta voluminosa: 6 mechones afilados que se abren hacia atrás
    HAIR2.ponytail(R, o, H, {
      root: [-3.5, -ry + 1.2], dir: 3.12, tie: M.tieAm, z: 45, base: 3, mass: 13,
      clumps: [[0.5, 13, 3.0, -0.16], [0.26, 18, 4.0, -0.24], [0.02, 20, 4.3, -0.3], [-0.2, 18, 4.0, -0.34], [-0.42, 15, 3.4, -0.38], [-0.66, 11, 2.7, -0.4]],
    });
    // flequillo en puntas hasta la línea de las cejas
    // (las puntas terminan sobre la pestaña: la frente y el ojo quedan despejados)
    HAIR2.bangs(R, o, H, [
      [[-1, -10.5], [1.2, -6.5], [2.0, -4.0], 2.8],
      [[2.5, -11], [4.8, -7.2], [6.0, -4.2], 2.7],
      [[6, -10.5], [8.0, -7.2], [9.4, -4.6], 2.3],
      [[8.5, -9.2], [10.3, -6.8], [11.0, -4.6], 1.6],
    ]);
    // mechón lateral delante de la oreja
    HAIR2.lock(R, o, H, [[-1.6, -5], [-1.5, 2], [-0.6, 7.5]], 1.7);
    // brillo en arco sobre la coronilla y en la coleta
    HAIR2.shine(R, o, ['hair', 'bangs'], RAMP.hairAm[6], -2.6, -1.25, 0.74);
    R.stamp(pb => {
      const zb = R.zbuf, parts = R.zparts; if (!zb) return;
      const hl = U(RAMP.hairAm[6]), hl2 = U(RAMP.hairAm[5]);
      // trazos de brillo de 1 px a lo largo de los mechones superiores de la coleta
      if (!o.ponyRoot) return;
      const [px, py] = o.ponyRoot;
      for (let k = 2; k < 9; k++) {
        const hp = pose.hair || { base: 0 };
        const a = 3.12 - hp.base * 0.25 + 0.28 - k * 0.07 * clamp(1 + hp.base * 0.6, 0.35, 1.8);
        const x = Math.round(px + Math.cos(a) * k), y = Math.round(py + Math.sin(a) * k - 1);
        const i = y * pb.w + x; if (i < 0 || i >= zb.length) continue;
        const p = zb[i]; if (p >= 0 && parts[p].group.startsWith('pony')) pb.data[i] = k < 6 ? hl : hl2;
      }
    }, 97);
  },
  render(anim, t, opts) { return renderHumanoid('amaya', AMAYA_D, anim, t, opts); },
};

CHARS.amaya = { name: 'Amaya', render: AMAYA_D.render, ox: HUM_OX, oy: HUM_OY, shadowR: 12 };

/* ------------------------------------------------------------------ */
/* KIRU — robot zorro-lagartija (fusión biblia + referencia)            */
/* Lienzo 60×64, ancla (30,62). Flota: el hueco va dibujado en el sprite */
/* ------------------------------------------------------------------ */
const KIRU_EYES = {
  curioso: 'open', alegre: 'happy', alarmado: 'big', confundido: 'mixed', culpable: 'down', valiente: 'brave', agotado: 'tired', esperanzado: 'star',
  neutral: 'open', happy: 'happy', surprised: 'big', sad: 'down', worried: 'down', determined: 'brave', thinking: 'mixed', scared: 'big', joy: 'happy', tired: 'tired',
  calm: 'calm', smile: 'smile', skeptical: 'skeptical', guilty: 'guilty', crying: 'crying', curious: 'open', focused: 'focus', proud: 'happy', relieved: 'calm',
  frustrated: 'brave', angry: 'brave', embarrassed: 'guilty', alert: 'big',
};
/* Ojos cápsula: c cuerpo cian · w núcleo · b base · g halo · y amarillo (los dos ojos: cercano 3×7, lejano 2×6) */
const KIRU_EYE_TPL = {
  open: { n: ['.c.', 'cwc', 'cwc', 'cwc', 'cwc', 'cwc', 'ccc', '.b.'], f: ['.c', 'cw', 'cw', 'cw', 'cw', 'cc', '.b'] },
  big: { n: ['.cc.', 'cwwc', 'cwwc', 'cwwc', 'cwwc', 'cwwc', 'cccc', '.bb.'], f: ['.c', 'cw', 'cw', 'cw', 'cw', 'cc', 'b.'], dy: -1 },
  happy: { n: ['.c.', 'cwc', 'c.c'], f: ['c.', 'wc', '.c'], dy: 2 },
  calm: { n: ['c.c', 'cwc', '.c.'], f: ['c.', 'wc', '.c'], dy: 3 },
  smile: { n: ['.c.', 'cwc', 'cwc', 'cwc', 'ccc', '.b.'], f: ['cc', 'wc', 'wc', 'cc', 'b.'], dy: 1, mouth: 'smile' },
  down: { n: ['c..', 'cc.', 'cwc', 'ccc', '.b.'], f: ['.c', 'cc', 'b.'], dy: 3 },
  guilty: { n: ['cc.', 'cwc', 'ccc', '.b.'], f: ['cc', 'b.'], dy: 3, dx: -1 },
  crying: { n: ['c..', 'cc.', 'cwc', 'ccc', '.b.', '.t.', '.t.'], f: ['.c', 'cc', 'b.'], dy: 3 },
  brave: { n: ['c..', 'cc.', 'cwc', 'cwc', 'ccc', '.b.'], f: ['c.', 'cc', 'wc', 'cc', 'b.'], dy: 1 },
  focus: { n: ['ccc', 'cwc', 'cwc', 'ccc', '.b.'], f: ['cc', 'wc', 'cc', 'b.'], dy: 2 },
  tired: { n: ['ccc', 'bbb'], f: ['cc', 'bb'], dy: 4 },
  skeptical: { n: ['.c.', 'cwc', 'cwc', 'cwc', 'cwc', 'cwc', 'ccc', '.b.'], f: ['cc', 'bb'], fdy: 4 },
  mixed: { n: ['.c.', 'cwc', 'cwc', 'cwc', 'cwc', 'cwc', 'ccc', '.b.'], f: ['cc', 'cc'], fdy: 4, q: 1 },
  star: { n: ['.y.', 'ywy', '.y.'], f: ['y.', 'wy', 'y.'], dy: 2, star: 1 },
  blink: { n: ['ccc'], f: ['cc'], dy: 4 },
};
/* KIRU flota a la altura de la cabeza de Amaya (como en la referencia): el hueco de levitación
   va en el ancla. Lienzo 60×72; pies del dibujo en y≈59; oy = 70 + KIRU_LIFT (altura de reposo).
   Kiru.render (30_world.js) lo baja hasta KIRU_LIFT_MOVE px al desplazarse. */
const KIRU_LIFT = 48, KIRU_LIFT_MOVE = 32;
function renderKiru(anim, t, opts) {
  const M = charMats();
  const R = new Rig(60, 72, { v2: true });
  const S = Math.sin, C = Math.cos, P = TAU * t;
  const a = ANIM_ALIAS[anim] || anim;
  // flotación ±1,5 px; inclinación hacia delante al moverse
  let bob = Math.round(S(P) * 1.5), lean = 0, earA = 0, earTw = 0, tailA = 0, podTrail = 0, hop = 0;
  switch (a) {
    case 'walk': lean = 1; earA = 0.15; podTrail = 1; bob = Math.round(S(P * 2) * 1); break;
    case 'run': lean = 2; earA = 0.35; podTrail = 2; tailA = -0.25; bob = Math.round(S(P * 2) * 1); break;
    case 'jump': earA = -0.25; hop = -1; bob = -1; podTrail = -1; break;
    case 'fall': earA = -0.45; bob = 1; tailA = 0.2; break;
    case 'talk': earTw = (Math.floor(t * 6) % 2); break;
    case 'celebrate': bob = -Math.round(Math.max(0, S(P)) * 4); earTw = Math.round(S(P * 2)); break;
    case 'scan': earTw = (t > 0.5 ? 1 : 0); earA = 0.05; break;
    case 'hit': lean = -1; earA = -0.5; break;
    case 'sad': case 'worry': earA = 0.55; bob = Math.round(S(P) * 0.5) + 1; break;
    default: earTw = (t > 0.6 && t < 0.75) ? 1 : 0;
  }
  const mood = opts.expr || (a === 'celebrate' ? 'alegre' : a === 'scan' ? 'focused' : a === 'hit' ? 'alarmado' : a === 'sad' ? 'culpable' : 'curioso');
  const eyeMode = KIRU_EYES[mood] || 'open';
  // orejas caídas en culpa/tristeza, aplastadas atrás si hay alarma
  if (eyeMode === 'down' || eyeMode === 'guilty' || eyeMode === 'crying') earA = Math.max(earA, 0.6);
  if (eyeMode === 'big') earA = Math.min(earA, -0.15) + 0.35;
  const hx = 31 + lean * 0.5, hy = 38 + bob + hop + Math.max(0, lean) * 0.5;
  // ---- orejas de zorro en aleta: marco gris, banda naranja→amarilla, panel solar cian con celdas
  const ear = (bx, by, ang, len, w, z, dark, grp) => {
    const dx = Math.cos(ang), dy = Math.sin(ang), px = -dy, py = dx;
    const pt = (u, v) => [bx + dx * u * len + px * v * w, by + dy * u * len + py * v * w];
    const pts = [pt(0, 0.42), pt(0.2, 0.6), pt(0.5, 0.58), pt(0.78, 0.36), pt(1, 0), pt(0.8, -0.3), pt(0.5, -0.48), pt(0.2, -0.5), pt(0, -0.4)];
    R.poly(pts, { mat: M.kEarO, base: 3, z, group: grp, dark, bevel: 1.2, rim: true,
      texture: (x, y, idx, ramp, col, d) => {
        const dep = -d, u = ((x + 0.5 - bx) * dx + (y + 0.5 - by) * dy) / len, v = ((x + 0.5 - bx) * px + (y + 0.5 - by) * py) / w;
        if (dep < 0.9) return dark ? '#2a2f3e' : (v > 0 && u < 0.6 ? '#556275' : '#363c4d');
        if (v < 0.05) {
          if (dep < 2.6) return dark ? '#a8600e' : (u > 0.6 ? '#fa8c01' : u > 0.25 ? '#dc8a1f' : '#875b23');
          if (dep < 3.6) return dark ? '#b09a30' : '#eed546';
        } else if (dep < 1.8) return dark ? '#b09a30' : '#eed546';
        const ER = RAMP.kiruEarInner;
        // celdas solares: líneas cada 3 px a lo largo y una diagonal
        const cu = Math.round(u * len), cv = Math.round(v * w * 1.2);
        if (cu % 6 === 3 && dep > 3.4) return dark ? '#0a2a4a' : (dep > 4.6 ? '#1478a8' : ER[0]);
        if (cv === 0 && cu > 4 && cu < len - 4) return dark ? '#0a2a4a' : '#1478a8';
        const lit = (1 - u) * 0.4 + (v > 0 ? 0.35 : 0) + (dep > 4.5 ? 0.3 : 0) - (dark ? 0.55 : 0);
        return lit > 0.75 ? ER[3] : lit > 0.3 ? ER[2] : ER[1];
      } });
  };
  const eb = earA + earTw * 0.08;
  // orejas largas y separadas (la trasera inclinada atrás, la delantera casi erguida), como en la referencia
  ear(hx - 12, hy - 8, -2.24 - eb, 22, 9, 2, 1, 'earB');
  ear(hx - 3.5, hy - 12, -1.96 - eb * 0.8 + earTw * 0.06, 23, 9, 14, 0, 'earF');
  // ---- cola de lagartija corta con microturbina naranja
  const tb = [hx - 12, hy + 15];
  const tp = [[tb[0], tb[1]], [tb[0] - 4.5, tb[1] + 0.5 + tailA * 3], [tb[0] - 8, tb[1] - 2 + tailA * 5], [tb[0] - 9.5 + S(P) * 0.6, tb[1] - 6 + tailA * 6 + C(P) * 0.6]];
  R.strand(tp, 3, 1.5, { mat: M.kShell, base: 5, z: 1, group: 'tail', shiny: true,
    texture: (x, y, idx, ramp) => { const u = Math.hypot(x - tb[0], y - tb[1]); return (Math.floor(u / 3) % 2 === 1 && idx >= 4) ? RAMP.kiruTurq[idx >= 6 ? 3 : 2] : null; } });
  const turb = tp[3];
  R.circle(turb[0], turb[1] - 2, 1.8, { mat: M.kOrange, base: 2, z: 1.5, group: 'hub', bevel: 0.8, shiny: true });
  // ---- patas magnéticas: cápsulas navy con anillo amarillo y emisor cian (par lejano oscuro)
  const pod = (x, y, z, dark, grp) => {
    R.box(x, y, 3.4, 4.5, 3, { mat: M.kPod, base: 3, z, group: grp, dark, bevel: 1.6, shiny: true }, -0.22 - podTrail * 0.08);
    R.stamp(pb => {
      const X = Math.round(x), Y = Math.round(y);
      pb.hline(X - 3, X + 3, Y, dark ? '#9a6a16' : '#dc8a1f'); pb.hline(X - 3, X + 3, Y - 1, dark ? '#b09a30' : '#eed546');
      if (!dark) pb.set(X + 2, Y - 1, '#fff6b0');
      pb.hline(X - 1, X + 1, Y + 4, dark ? '#2a8aa0' : '#5ee1ef'); if (!dark) { pb.set(X, Y + 4, '#e6fdff'); pb.set(X - 2, Y - 3, '#3a6aa6'); }
    }, 20 + z * 0.01);
    // resplandor del emisor bajo la pata (hueco de levitación, sin contorno)
    if (!dark) R.glow(pb => { const X = Math.round(x), Y = Math.round(y); pb.set(X, Y + 6, '#17f3f7'); pb.set(X - 1 + (bob & 1) * 2, Y + 7, '#2aa9e3'); pb.set(X, Y + 8 + (bob & 1), '#0e6a8a'); }, 30);
  };
  const py = hy + 19.5;
  pod(hx + 7.5, py - 2.2, 3, 1, 'podFB'); pod(hx - 4.5 - podTrail, py - 2.6, 3.5, 1, 'podBB');
  // patas (puntales) y cuerpo pequeño
  R.capsule(hx + 2, hy + 14, hx + 4.5 - podTrail * 0.3, py - 3, 1.5, 1.3, { mat: M.kJoint, base: 3, z: 8, group: 'legs', bevel: 0.8 });
  R.capsule(hx - 6, hy + 14, hx - 8 - podTrail, py - 3, 1.5, 1.3, { mat: M.kJoint, base: 3, z: 8, group: 'legs', bevel: 0.8 });
  R.ellipse(hx - 2.5, hy + 14.5, 9.5, 6.2, { mat: M.kShell, base: 5, z: 10, group: 'body', bevel: 3, shiny: true, cast: { on: ['legs'], dx: 0, dy: 1 } });
  // placa dorsal turquesa
  R.ellipse(hx - 9, hy + 13, 3.8, 4.4, { mat: M.kTurq, base: 2, z: 11, group: 'plate', bevel: 1.4 }, -0.4);
  // escotilla de muestras (borde naranja, ventanilla cian; la tapa se levanta en 'sample')
  const lid = a === 'sample' ? 1 : 0;
  R.box(hx + 1, hy + 17 - lid, 3.4, 2.3, 0.8, { mat: M.kOrange, base: 2, z: 12, group: 'hatch', bevel: 0.8 });
  pod(hx + 4.5 - podTrail * 0.5, py, 13, 0, 'podF'); pod(hx - 8 - podTrail, py - 0.6, 13.5, 0, 'podB');
  // junta oscura cuello-cuerpo
  R.ellipse(hx - 1, hy + 11, 7, 2.2, { mat: M.kJoint, base: 3, z: 15, group: 'joint', bevel: 0.8 });
  // ---- cabeza: concha blanca perla redondeada
  R.add(SDF.smoothUnion(4, SDF.box(hx, hy, 15.5, 13, 10), SDF.ellipse(hx - 1.5, hy - 1.5, 15, 13.5)), [hx - 18, hy - 16, hx + 18, hy + 15], { mat: M.kShell, base: 5, z: 20, group: 'head', bevel: 4.8, shiny: true, cast: { on: ['joint', 'body'], dx: -1, dy: 2 } });
  // cresta dorsal (3 escamas turquesa) en la nuca
  for (let k = 0; k < 3; k++) R.circle(hx - 14.5 + k * 0.4, hy - 3 + k * 4.2, 1.6, { mat: M.kTurq, base: 3, z: 19, group: 'ridge', bevel: 0.8 });
  // visor negro-navy con aro gris y reflejo
  R.ellipse(hx + 5.2, hy + 1.6, 11.2, 10.4, { mat: M.kRim, base: 3, z: 21, group: 'visorRim', bevel: 1, flat: true });
  R.add(SDF.smoothUnion(3, SDF.box(hx + 5.4, hy + 1.7, 10, 9.3, 6.5), SDF.ellipse(hx + 5.4, hy + 1.7, 10.2, 9.5)), [hx - 6, hy - 9, hx + 17, hy + 13], { mat: M.kVisor, base: 2, z: 22, group: 'visor', bevel: 2.5, hiT: 0.8,
    texture: (x, y, idx, ramp) => { const ddx = x + 0.5 - (hx + 5.4), ddy = y + 0.5 - (hy + 1.7); return (ddx + ddy * 1.2 > 8) ? ramp[1] : null; } });
  R.stamp(pb => {
    const vx = hx + 5.4, vy = hy + 1.7;
    // arco de brillo 3 px y punto claro
    for (let k = 0; k < 10; k++) { const an = -2.7 + k * 0.11; pb.set(Math.round(vx + Math.cos(an) * 8.2), Math.round(vy + Math.sin(an) * 7.6), k < 7 ? '#1e3a6a' : '#7a8cb0'); }
    pb.set(Math.round(vx - 7), Math.round(vy - 3), '#c7d8e1');
    // ojos cápsula según el ánimo
    const blink = (a === 'idle' && t >= 0.83) || (a === 'talk' && t > 0.9);
    const T = KIRU_EYE_TPL[blink ? 'blink' : eyeMode] || KIRU_EYE_TPL.open;
    const pal = { c: '#17f3f7', w: '#e6fdff', b: '#2480a3', g: '#0e406e', y: '#ffe14d', t: '#a6f4ff' };
    const ex = Math.round(vx - 4.5 + (T.dx || 0)), ey = Math.round(vy - 5 + (T.dy || 0));
    // halo de 1 px (sin tramado): marco del tamaño de la plantilla en navy
    const halo = (x0, y0, rows) => { for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) if (rows[j][i] !== '.') for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { const X = x0 + i + ox, Y = y0 + j + oy; const r2 = rows[Y - y0], ch = r2 ? r2[X - x0] : undefined; if (!ch || ch === '.') pb.set(X, Y, pal.g); } };
    halo(ex, ey, T.n); pb.stampMap(ex, ey, T.n, pal);
    const fx = Math.round(vx + 2.5), fy = ey + (T.fdy || 0) + (T.n.length - T.f.length > 2 ? 1 : 0);
    halo(fx, fy, T.f); pb.stampMap(fx, fy, T.f, pal);
    if (T.q) { pb.set(fx + 3, fy - 3, '#ffe14d'); pb.set(fx + 4, fy - 4, '#ffe14d'); pb.set(fx + 5, fy - 3, '#ffe14d'); pb.set(fx + 4, fy - 1, '#ffe14d'); }
    // boca: marca de 1–2 px; habla y sonrisa
    const mx = Math.round(vx - 0.5), my = Math.round(vy + 5);
    if (a === 'talk' && Math.floor(t * 6) % 2) { pb.hline(mx - 1, mx + 1, my, '#17f3f7'); pb.set(mx, my + 1, '#2480a3'); }
    else if (T.mouth === 'smile' || eyeMode === 'happy') { pb.set(mx - 1, my, '#17f3f7'); pb.set(mx, my + 1, '#17f3f7'); pb.set(mx + 1, my, '#17f3f7'); }
    else if (eyeMode === 'big') { pb.rect(mx, my, 2, 2, '#17f3f7'); }
    else pb.hline(mx, mx + 1, my, '#2480a3');
    // motas cian en la concha (calcomanías)
    [[-9, -6, '#40e8e7'], [-11, -2, '#378aa9'], [-7, -9, '#378aa9'], [-12, 3, '#40e8e7'], [-4, -11, '#9ff6f8'], [-8, 5, '#378aa9']].forEach(([dx, dy, c]) => pb.set(Math.round(hx + dx), Math.round(hy + dy), c));
    // ventanilla de la escotilla
    pb.rect(Math.round(hx + 0.5), Math.round(hy + 17 - lid), 2, 2, '#56e5ff'); pb.set(Math.round(hx + 0.5), Math.round(hy + 17 - lid), '#e6fdff');
    if (lid) pb.hline(Math.round(hx - 1), Math.round(hx + 4), Math.round(hy + 19), '#2a1a10');
    // microturbina: 3 aspas naranjas (simetría de 120° → bucle continuo)
    const rx2 = Math.round(turb[0]), ry2 = Math.round(turb[1] - 2);
    const spin = (a === 'run' ? 2 : a === 'walk' ? 1.5 : 1) * (t * TAU / 3) + (a === 'run' ? t * TAU * 2 : 0);
    for (let k = 0; k < 3; k++) {
      const an = spin + k * TAU / 3, ca = C(an), sa = S(an);
      const x1 = rx2 + Math.round(ca * 5.5), y1 = ry2 + Math.round(sa * 4);
      pb.line(rx2, ry2, x1, y1, '#ff8e34');
      pb.set(rx2 + Math.round(ca * 2.6 - sa * 1.1), ry2 + Math.round(sa * 2 + ca * 1.1), '#dc8a1f');
      pb.set(rx2 + Math.round(ca * 3.6 - sa * 1.1), ry2 + Math.round(sa * 2.8 + ca * 1.1), '#ff8e34');
      pb.set(x1, y1, '#ffc070');
    }
    pb.set(rx2, ry2, '#fff4dc'); pb.set(rx2 + 1, ry2, '#dc8a1f');
  }, 100);
  // estela de chispas cian al desplazarse (cuadros de walk/run), sin contorno
  R.glow(pb => {
    if (a === 'run' || a === 'walk') {
      const n = a === 'run' ? 6 : 3;
      for (let k = 0; k < n; k++) {
        const ph = (t * (a === 'run' ? 2 : 1) + k / n) % 1;
        const x = Math.round(hx - 10 - ph * 16), y = Math.round(hy + 21 + Math.sin(k * 2.3 + ph * 6) * 2 - ph * 3);
        pb.set(x, y, ph < 0.4 ? '#e6fdff' : ph < 0.7 ? '#5ee1ef' : '#2aa9e3');
        if (ph < 0.35) pb.set(x + 1, y, '#17f3f7');
      }
    }
  }, 100);
  const pb = R.render({ env: opts.env, outlineColor: '#070813' });
  // sombra de contacto pequeña: KIRU vuela alto
  pb.anchors = { head: { x: hx, y: hy }, eye: { x: hx + 5, y: hy }, shadowR: 6 - Math.max(-1, Math.min(1, bob)) };
  return pb;
}
CHARS.kiru = { name: 'KIRU', render: renderKiru, ox: 30, oy: 70 + KIRU_LIFT, shadowR: 6, warmAnims: ['idle', 'walk', 'run', 'jump', 'fall', 'talk'] };

/* ------------------------------------------------------------------ */
/* Peinados v1 (se conservan por compatibilidad)                         */
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
  bun(R, o, ramp, dx = -5, dy = -9, r = 4.2) { HAIR2.bun(R, o, asMat(ramp), dx, dy, r); },
  braid(R, o, ramp, pts, tieCol) { HAIR2.braid(R, o, asMat(ramp), pts, tieCol ? asMat(tieCol) : null); },
  spikes(R, o, ramp, list) {
    list.forEach(([ax, ay, bx, by, w], i) => R.poly([[o.hx + ax - w, o.hy + ay], [o.hx + ax + w, o.hy + ay + 0.5], [o.hx + bx, o.hy + by]], { ramp, base: 3, z: 53 + i * 0.01, group: 'spike' + i, bevel: 1.5, shiny: true, lineIdx: 1 }));
  },
};

/* =====================================================================
   Registros para diversidad (02_personajes §4.4)
   ===================================================================== */
const BODY = {
  adult: {},
  tall: { thigh: 2, shin: 2, chestH: 1, torsoW: -1 },
  stocky: { torsoW: 4.5, armW: 0.7, legW: 0.7, belly: true, chestH: -1, neckR: 0.6 },
  elder: { stoop: 0.16, shin: -1.5, thigh: -0.5, headDY: 1, energetic: 0.6, prop: 'cane' },
  teen: { scale: 0.92, headRX: -0.3, headRY: -0.3 },
  child: { scale: 0.62, headRX: -0.8, headRY: -1, torsoW: -2, child: true },
};
const BASE_BODY = { thigh: 13, shin: 13.5, footH: 3, footL: 7, pelvisH: 5, chestH: 16.5, torsoW: 15, headRX: 10.5, headRY: 11, upperArm: 10, foreArm: 9.5, armW: 2.6, legW: 3.1, handR: 2.2, neckR: 2.6 };
function makeBody(kind, extra = {}) {
  const B = Object.assign({}, BASE_BODY), mod = BODY[kind] || {};
  for (const [k, v] of Object.entries(mod)) {
    if (typeof v === 'number' && typeof B[k] === 'number') B[k] += v; else B[k] = v;
  }
  return Object.assign(B, extra);
}
/** Prendas: OUTFIT[kind](R, o, cfg) dibuja el torso (o = anclas de buildHumanoid) */
const OUTFIT = {
  tee(R, o, c) {
    R.poly(o.torsoPts, { mat: c.top, base: 4, z: 30, group: 'torso', bevel: 2.4 });
    R.stamp(pb => { const x = Math.round(o.cx + o.tw * 0.2 + o.lx), y = Math.round(o.shoulderY); pb.hline(x - 2, x + 1, y, c.top.ramp[2]); pb.set(Math.round(o.cx - 1 + o.lx * 0.7), Math.round(o.shoulderY + 7), c.top.ramp[2]); }, 95);
  },
  jacket(R, o, c) {
    R.poly(o.torsoPts, { mat: c.inner || c.top, base: 4, z: 30, group: 'top', bevel: 2 });
    const { cx, shoulderY, waistY, hipY, tw, lx, chestH } = o;
    R.poly([[cx - tw * 0.55 + lx * 0.95, shoulderY - 1.5], [cx + tw * 0.08 + lx, shoulderY - 1], [cx + tw * 0.32 + lx * 0.8, shoulderY + 4], [cx + tw * 0.45 + lx * 0.5, waistY - chestH * 0.4], [cx + tw * 0.46, hipY + 1.5], [cx - tw * 0.55, hipY + 2], [cx - tw * 0.52 + lx * 0.4, waistY - chestH * 0.4]], { mat: c.jacket || c.top, base: 4, z: 31, group: 'jacket', bevel: 2.4, cast: { on: ['top'], dx: -1, dy: 2 } });
    R.poly([[cx - 4 + lx, shoulderY - 4], [cx + lx, shoulderY - 3], [cx + 1.5 + lx, shoulderY + 0.5], [cx - 5 + lx, shoulderY + 0.5]], { mat: c.jacket || c.top, base: 5, z: 28.5, group: 'collar', bevel: 1, lineIdx: 1 });
    R.stamp(pb => { const zx = Math.round(cx + tw * 0.32 + lx * 0.6); for (let y = Math.round(shoulderY + 5); y < hipY; y += 3) pb.set(zx, y, (c.jacket || c.top).ramp[5] || '#fff'); }, 95);
  },
  overalls(R, o, c) {
    OUTFIT.tee(R, o, c);
    const { cx, shoulderY, waistY, hipY, tw, lx } = o, m = c.bib || asMat(MAT.danteOver);
    R.poly([[cx - tw * 0.3 + lx * 0.6, shoulderY + 6], [cx + tw * 0.38 + lx * 0.6, shoulderY + 6], [cx + tw * 0.46, hipY + 2.5], [cx - tw * 0.5, hipY + 2.5]], { mat: m, base: 3, z: 32, group: 'bib', bevel: 2.4 });
    R.capsule(cx - tw * 0.3 + lx * 0.95, shoulderY, cx - tw * 0.25 + lx * 0.6, shoulderY + 7, 1.2, 1.2, { mat: m, base: 3, z: 33, group: 'susp', bevel: 0.8 });
    R.capsule(cx + tw * 0.25 + lx, shoulderY, cx + tw * 0.3 + lx * 0.6, shoulderY + 7, 1.2, 1.2, { mat: m, base: 4, z: 33, group: 'susp', bevel: 0.8 });
    R.stamp(pb => { pb.set(Math.round(cx - tw * 0.25 + lx * 0.6), Math.round(shoulderY + 7), '#ffe14d'); pb.set(Math.round(cx + tw * 0.3 + lx * 0.6), Math.round(shoulderY + 7), '#ffe14d'); pb.rect(Math.round(cx), Math.round(waistY - 4), 3, 2, m.ramp[5] || m.ramp[4]); }, 95);
  },
  labcoat(R, o, c) {
    const { cx, shoulderY, waistY, hipY, tw, lx } = o, m = c.coat || asMat(MAT.labcoat);
    R.poly([[cx + tw * 0.08 + lx, shoulderY], [cx + tw * 0.42 + lx, shoulderY + 0.5], [cx + tw * 0.38 + lx * 0.4, waistY + 2], [cx + tw * 0.1 + lx * 0.3, waistY + 2]], { mat: c.inner || c.top, base: 4, z: 44, group: 'inner', bevel: 1.6 });
    R.poly([[cx - tw * 0.55 + lx * 0.95, shoulderY - 1.5], [cx + tw * 0.48 + lx, shoulderY - 0.5], [cx + tw * 0.52, hipY + 12], [cx - tw * 0.62, hipY + 13]], { mat: m, base: 4, z: 43, group: 'coat', bevel: 2.6 });
    R.poly([[cx + tw * 0.08 + lx, shoulderY - 1.5], [cx + tw * 0.32 + lx, shoulderY - 1], [cx + tw * 0.14 + lx * 0.6, shoulderY + 8]], { mat: m, base: 5, z: 45, group: 'lapel', bevel: 0.8, lineIdx: 1 });
    R.stamp(pb => {
      pb.vline(Math.round(cx + tw * 0.1 + lx * 0.3), Math.round(waistY + 3), Math.round(hipY + 11), m.ramp[2]);
      const px = Math.round(cx - tw * 0.4), py = Math.round(waistY + 4); pb.hline(px, px + 4, py, m.ramp[2]);
      if (c.pens !== false) { pb.vline(Math.round(cx + tw * 0.24 + lx * 0.8), Math.round(shoulderY + 4), Math.round(shoulderY + 6), '#ffe14d'); pb.vline(Math.round(cx + tw * 0.3 + lx * 0.8), Math.round(shoulderY + 3), Math.round(shoulderY + 6), '#ff6b6b'); }
    }, 95);
  },
  poncho(R, o, c) {
    OUTFIT.tee(R, o, c);
    const { cx, shoulderY, hipY, tw, lx } = o, m = c.poncho || c.top;
    R.poly([[cx - 3 + lx, shoulderY - 3], [cx + 4 + lx, shoulderY - 2.5], [cx + tw * 0.75 + lx * 0.5, hipY - 1], [cx - tw * 0.8 + lx * 0.4, hipY]], { mat: m, base: 4, z: 79.5, group: 'poncho', bevel: 2,
      texture: (x, y, idx, ramp) => { const b = (y - Math.round(shoulderY)) % 6; return b === 3 ? (c.stripe || '#ffe14d') : b === 4 ? ramp[clamp(idx - 2, 1, ramp.length - 1)] : null; } });
  },
  dress(R, o, c) {
    const { cx, shoulderY, waistY, hipY, tw, lx, lf, lb } = o;
    R.poly(o.torsoPts, { mat: c.top, base: 4, z: 30, group: 'torso', bevel: 2.4 });
    const ky = Math.max(lf.ky, lb.ky) + 1;
    R.poly([[cx - tw * 0.45 + lx * 0.3, waistY], [cx + tw * 0.42 + lx * 0.2, waistY], [cx + tw * 0.75, ky], [cx - tw * 0.8, ky + 1]], { mat: c.top, base: 4, z: 44, group: 'skirt', bevel: 2.2 });
    R.stamp(pb => { pb.hline(Math.round(cx - tw * 0.4), Math.round(cx + tw * 0.4), Math.round(waistY), c.top.ramp[2]); for (let k = -1; k <= 1; k++) pb.line(Math.round(cx + k * 3), Math.round(waistY + 3), Math.round(cx + k * 5), Math.round(ky - 1), c.top.ramp[3]); }, 95);
  },
  apron(R, o, c) {
    OUTFIT.tee(R, o, c);
    const { cx, shoulderY, hipY, tw, lx } = o, m = c.apron || asMat(RAMP_CH.cream);
    R.poly([[cx - tw * 0.05 + lx * 0.6, shoulderY + 4], [cx + tw * 0.5 + lx * 0.6, shoulderY + 4], [cx + tw * 0.6, hipY + 11], [cx - tw * 0.25, hipY + 11]], { mat: m, base: 4, z: 44, group: 'apron', bevel: 2 });
    R.stamp(pb => pb.hline(Math.round(cx - tw * 0.4), Math.round(cx + tw * 0.4), Math.round(o.waistY), m.ramp[1]), 95);
  },
  hivis(R, o, c) {
    OUTFIT.tee(R, o, c);
    const { cx, shoulderY, waistY, hipY, tw, lx } = o, m = c.vest || asMat(RAMP_CH.hivis);
    R.poly([[cx - tw * 0.55 + lx * 0.95, shoulderY], [cx + tw * 0.1 + lx, shoulderY], [cx + tw * 0.2, hipY + 2], [cx - tw * 0.58, hipY + 2]], { mat: m, base: 4, z: 31, group: 'vest', bevel: 1.8 });
    R.poly([[cx + tw * 0.3 + lx, shoulderY + 0.5], [cx + tw * 0.48 + lx, shoulderY + 1], [cx + tw * 0.46, hipY + 2], [cx + tw * 0.3, hipY + 2]], { mat: m, base: 4, z: 31.5, group: 'vest2', bevel: 1 });
    R.stamp(pb => { for (const dy of [-6, -2]) pb.hline(Math.round(cx - tw * 0.55), Math.round(cx + tw * 0.48), Math.round(waistY + dy), '#e8f0f4'); }, 95);
  },
  raincoat(R, o, c) {
    OUTFIT.jacket(R, o, Object.assign({}, c, { jacket: c.coat || asMat(RAMP_CH.rain) }));
    const { cx, shoulderY, lx } = o, m = c.coat || asMat(RAMP_CH.rain);
    R.ellipse(cx - 5 + lx, shoulderY - 2, 4.5, 3.2, { mat: m, base: 3, z: 28, group: 'hood', bevel: 1.5 });
  },
  vest(R, o, c) {
    OUTFIT.tee(R, o, c);
    const { cx, shoulderY, hipY, tw, lx } = o, m = c.vest;
    R.poly([[cx - tw * 0.55 + lx * 0.95, shoulderY], [cx + tw * 0.05 + lx, shoulderY], [cx + tw * 0.08, hipY + 2.5], [cx - tw * 0.58, hipY + 2.5]], { mat: m, base: 4, z: 31, group: 'vest', bevel: 2,
      texture: c.woven ? (x, y, idx, ramp) => ((x + y) % 4 === 0 ? ramp[clamp(idx - 1, 1, ramp.length - 1)] : ((x - y + 64) % 4 === 0 && idx > 2 ? ramp[clamp(idx + 1, 1, ramp.length - 1)] : null)) : undefined });
    R.poly([[cx + tw * 0.3 + lx, shoulderY + 0.5], [cx + tw * 0.48 + lx, shoulderY + 1], [cx + tw * 0.46, hipY + 2], [cx + tw * 0.3, hipY + 2]], { mat: m, base: 4, z: 31.5, group: 'vest2', bevel: 1 });
  },
};
/** Atrezo de mano o espalda → ACCESSORY */
const PROP = { cane: 'cane', basket: 'basket', crate: 'crate', tablet: 'tablet', net: 'net', hoe: 'hoe', wateringCan: 'wateringCan', toolbox: 'toolbox' };

/* ------------------------------------------------------------------ */
/* NAIRA VALDÉS — agroecóloga                                          */
/* ------------------------------------------------------------------ */
const NAIRA_D = Object.assign(makeBody('adult', { headRX: 10.5, headRY: 11 }), {
  face: { eyeX: 2.5, eyeY: 0.5, eye2X: 8.5, mouthX: 6.5, mouthY: 7, noseX: 10.5, noseY: 3.5, iris: ['#160a14', '#3a2440', '#6a4a6e'], lash: '#0a0816', blush: '#b8604a', browCol: '#15132a' },
  defaultExpr: 'calm', energetic: 0.8, shortSleeve: 0, sole: '#2a1410', laces: null, bootTall: 3, shadowR: 12,
  prepare() {
    if (this.mat) return;
    const leather = Mat({ ramp: MAT.leather, outline: '#1a0a06' });
    this.mat = { skin: Mat({ ramp: RAMP.skinN, outline: '#1a0a08' }), hair: Mat({ ramp: RAMP.hairN, outline: '#06050e' }), top: Mat({ ramp: MAT.nairaShirt, outline: '#06140c' }), legs: Mat({ ramp: MAT.olive, outline: '#0e1008' }), shoes: leather, gloves: Mat({ ramp: RAMP.skinN, outline: '#1a0a08' }) };
    this.vest = Mat({ ramp: MAT.nairaVest, outline: '#240a06' });
    this.straw = Mat({ ramp: MAT.straw, outline: '#2a1606' });
    this.accessories = [{ kind: 'satchel', mat: this.straw, strap: leather, badge: '#86e36f' }];
  },
  torso(R, o) { OUTFIT.vest(R, o, { top: this.mat.top, vest: this.vest, woven: true }); },
  hair(R, o) {
    const H = this.mat.hair, { hx, hy, rx, ry, pose } = o;
    HAIR2.cap(R, o, H, { grow: 0.6, sy: 0.9 });
    HAIR2.lock(R, o, H, [[8, -5], [10, 0], [9.6, 3]], 1.8);
    // trenza gruesa sobre el hombro
    const sw = (pose.hair && pose.hair.base) || 0, pts = [];
    for (let i = 0; i < 9; i++) pts.push([hx - 3 + i * 0.6 - sw * i * 0.25, hy + 7 + i * 3.1, 2.8 - i * 0.12]);
    HAIR2.braid(R, o, H, pts, asMat(RAMP.yellow));
    // sombrero de paja de ala ancha
    const tex = (x, y, idx, ramp) => (y % 2 === 0 && (x + (y >> 1)) % 3 === 0 ? ramp[clamp(idx - 1, 1, 6)] : null);
    R.ellipse(hx - 0.5, hy - 11.5, 9.4, 6, { mat: this.straw, base: 3, z: 70, group: 'hatC', bevel: 3, texture: tex });
    R.ellipse(hx + 0.6, hy - 7.6, 19, 3.2, { mat: this.straw, base: 4, z: 71, group: 'hatB', bevel: 1.6, texture: (x, y, idx, ramp) => ((x * 2 + y) % 5 === 0 ? ramp[clamp(idx - 1, 1, 6)] : null), cast: { on: ['head', 'hair', 'ear', 'lock'], dx: -1, dy: 3 } }, -0.04);
    R.box(hx - 0.5, hy - 9.6, 9, 1.3, 0.5, { mat: this.vest, base: 4, z: 72, group: 'hatBand', bevel: 0.8 });
    R.stamp(pb => {
      const fx = Math.round(hx + 5), fy = Math.round(hy - 11);
      pb.stampMap(fx - 1, fy - 1, ['.a.', 'aba', '.a.'], { a: '#fff08a', b: '#ff8e34' }); pb.set(fx + 3, fy + 1, '#86e36f'); pb.set(fx + 2, fy + 1, '#4ccb70');
    }, 98);
  },
  faceStamp(pb, o) { pb.set(Math.round(o.hx - 3), Math.round(o.hy + 5), '#4ccb70'); },
});
CHARS.naira = { name: 'Naira', render: (a, t, op) => renderHumanoid('naira', NAIRA_D, a, t, Object.assign({ expr: op.expr || NAIRA_D.defaultExpr }, op)), ox: HUM_OX, oy: HUM_OY, shadowR: 12 };

/* ------------------------------------------------------------------ */
/* DANTE VELA — mantenimiento eólico (complexión ancha)                 */
/* ------------------------------------------------------------------ */
const DANTE_D = Object.assign(makeBody('adult', { thigh: 14, shin: 14, torsoW: 18, chestH: 17, armW: 3.0, legW: 3.5, headRX: 10.5, headRY: 10.8, footL: 7.5, handR: 2.5 }), {
  face: { eyeX: 2.5, eyeY: 0.5, eye2X: 8.5, mouthX: 6.5, mouthY: 6.5, noseX: 10.5, noseY: 3, iris: ['#0e2a16', '#2a5a3a', '#5a8a5a'], lash: '#1a0806', browCol: '#46180f' },
  freckles: true, energetic: 1.3, sole: '#1a0c08', laces: '#c8a070', bootTall: 4.5, shortSleeve: 0.6, jaw: 'square', noseSize: 1.4, shadowR: 13,
  prepare() {
    if (this.mat) return;
    const skin = Mat({ ramp: RAMP.skinD, outline: '#3a160e' });
    this.mat = { skin, hair: Mat({ ramp: RAMP.hairD, outline: '#1c0604' }), top: Mat({ ramp: MAT.tshirtW, outline: '#1a2236' }), legs: Mat({ ramp: MAT.danteOver, outline: '#060a1c' }), shoes: Mat({ ramp: MAT.boots, outline: '#0a0608' }), gloves: Mat({ ramp: MAT.gloves, outline: '#1e1404' }) };
    this.foreMat = skin;
    this.bib = Mat({ ramp: MAT.danteOver, outline: '#060a1c' });
    this.accessories = [{ kind: 'hardhat', mat: Mat({ ramp: MAT.hardhat, outline: '#2a1a04' }) }];
  },
  torso(R, o) {
    OUTFIT.overalls(R, o, { top: this.mat.top, bib: this.bib });
    const { cx, waistY, hipY, shoulderY, tw, lx } = o;
    // franja reflectante, pañuelo rojo al cuello y llave en el arnés
    R.box(cx + 0.5, waistY + 1, tw * 0.5, 1.5, 0.3, { mat: MAT.safety, base: 4, z: 34, group: 'stripe', bevel: 0.8 });
    R.ellipse(cx + 1 + lx, shoulderY + 0.5, 6.5, 2.4, { mat: MAT.bandana, base: 3, z: 35, group: 'scarf', bevel: 1.2, cast: { on: ['torso', 'bib'], dx: -1, dy: 2 } });
    R.poly([[cx + 2 + lx, shoulderY + 1], [cx + 6 + lx, shoulderY + 1.5], [cx + 4 + lx, shoulderY + 6]], { mat: MAT.bandana, base: 4, z: 35.5, group: 'scarf2', bevel: 0.8 });
    R.capsule(cx - 9, waistY + 1, cx - 8, hipY + 7, 1.1, 1.1, { mat: RAMP.metal, base: 5, z: 36, group: 'tool', bevel: 0.8, shiny: true });
    R.circle(cx - 8, hipY + 8.5, 2.2, { mat: RAMP.metal, base: 5, z: 36.1, group: 'tool', bevel: 0.8 });
  },
  hair(R, o) {
    const H = this.mat.hair;
    HAIR2.cap(R, o, H, { grow: 0.4, sy: 0.84 });
    HAIR2.lock(R, o, H, [[-4, -3], [-6.5, 1], [-6, 4]], 1.8, { z: 56 });
    HAIR2.strand(R, o, H, [[-7, -1], [-11, 1.5]], 1.8, 0.35, { z: 53, group: 'spike' });
    HAIR2.strand(R, o, H, [[-7, 3], [-10.5, 6.5]], 1.6, 0.35, { z: 53, group: 'spike' });
  },
});
CHARS.dante = { name: 'Dante', render: (a, t, op) => renderHumanoid('dante', DANTE_D, a, t, op), ox: HUM_OX, oy: HUM_OY, shadowR: 13 };

/* ------------------------------------------------------------------ */
/* DRA. ELIANA ROJAS — mentora (alta y delgada, bata a la rodilla)       */
/* ------------------------------------------------------------------ */
const ELIANA_D = Object.assign(makeBody('tall', { torsoW: 14, armW: 2.4, legW: 2.8, headRX: 10.2, headRY: 10.8 }), {
  face: { eyeX: 2.5, eyeY: 0.5, eye2X: 8.5, mouthX: 6.5, mouthY: 7, noseX: 10.5, noseY: 3.5, iris: ['#1a0e06', '#4a3020', '#7a5a3a'], lash: '#1a0e0a', browCol: '#3a3c5c' },
  energetic: 0.7, sole: '#1a0c10', bootTall: 2.5, jaw: 'long', shadowR: 12,
  prepare() {
    if (this.mat) return;
    const skin = Mat({ ramp: RAMP.skinE, outline: '#1e100a' });
    this.coat = Mat({ ramp: ['#2e3c5a', '#56688e', '#8aa0c4', '#bccce4', '#e2ecf8', '#f6faff', '#ffffff'], outline: '#141c30', line: '#56688e' });
    this.mat = { skin, hair: Mat({ ramp: RAMP.hairE, outline: '#1a1c30' }), top: Mat({ ramp: MAT.violetTop, outline: '#0c0620' }), sleeve: this.coat, legs: Mat({ ramp: MAT.tealPants, outline: '#04121a' }), shoes: Mat({ ramp: MAT.boots, outline: '#0a0608' }) };
    this.foreMat = this.coat;
    this.accessories = [{ kind: 'glasses', col: '#8a5e14', round: true }];
  },
  torso(R, o) {
    OUTFIT.labcoat(R, o, { top: this.mat.top, inner: this.mat.top, coat: this.coat });
    const { cx, shoulderY, waistY, tw, lx } = o;
    R.stamp(pb => {
      // cordón con credencial
      pb.line(Math.round(cx + tw * 0.15 + lx), Math.round(shoulderY + 1), Math.round(cx + tw * 0.28 + lx * 0.5), Math.round(waistY - 1), '#56e5ff');
      const bx = Math.round(cx + tw * 0.24 + lx * 0.4), by = Math.round(waistY - 1);
      pb.rect(bx, by, 3, 4, '#f4fdff'); pb.hline(bx, bx + 2, by + 1, '#2c63c0'); pb.set(bx + 1, by + 3, '#ffe14d');
    }, 96);
  },
  hair(R, o) {
    const H = this.mat.hair, { hx, hy } = o;
    HAIR2.bun(R, o, H, -6.5, -9, 5);
    HAIR2.cap(R, o, H, { grow: 0.5, sy: 0.86, texture: (x, y, idx, ramp) => ((x * 3 + y) % 7 === 0 ? ramp[clamp(idx - 1, 1, 5)] : null) });
    HAIR2.bangs(R, o, H, [[[5, -10], [8.5, -6], [10, -2.5], 2.2], [[1, -11], [4, -7.5], [5, -4], 2.2]]);
    R.stamp(pb => {
      pb.line(Math.round(hx - 13), Math.round(hy - 14), Math.round(hx - 4), Math.round(hy - 7), '#ffd84a');
      pb.set(Math.round(hx - 13), Math.round(hy - 14), '#ff6b6b'); pb.set(Math.round(hx - 4), Math.round(hy - 7), '#3a2a20');
    }, 97);
    HAIR2.shine(R, o, ['hair'], RAMP.hairE[5], -2.4, -1.4, 0.7);
  },
});
CHARS.eliana = { name: 'Dra. Eliana', render: (a, t, op) => renderHumanoid('eliana', ELIANA_D, a, t, op), ox: HUM_OX, oy: HUM_OY, shadowR: 12 };

/* ------------------------------------------------------------------ */
/* LIMEN — protocolo cristalino (re-rasterizado ×1,28, lienzo 92×128)    */
/* ------------------------------------------------------------------ */
const CH_SCALE = 1.28;
function renderLimen(anim, t, opts) {
  const R = new Rig(92, 128, { v2: true }).scaled(CH_SCALE);
  const P = TAU * t;
  const cx = 36, cy = 46 + Math.round(Math.sin(P) * 1.5);
  const mood = opts.expr || 'calm';
  // cristal de 8 tonos (navy → cian → blanco) con matiz violeta en la sombra
  const L = ['#120a34', '#0e2b4a', '#165a7a', '#1f8aa8', '#3cc0d6', '#7ee8f0', '#c4fbff', '#ffffff'];
  let fseed = 0;
  /** Faceta de cristal: degradado hacia la luz (arriba-izquierda), arista iluminada, veta de refracción
      diagonal y reflejo violeta en la parte baja (STYLE LOCK §6: rampas con desplazamiento de tono) */
  const facet = (pts, base, z, group) => {
    let mx = 0, my = 0; pts.forEach(p => { mx += p[0]; my += p[1]; }); mx /= pts.length; my /= pts.length;
    let ext = 1; pts.forEach(p => { ext = Math.max(ext, Math.hypot(p[0] - mx, p[1] - my)); });
    const sd = (fseed++ * 3.7) % 9, streak = (fseed % 3) !== 0;
    R.poly(pts, { ramp: L, base, z, group, bevel: 0.9, lineCol: '#165a7a',
      texture: (x, y, idx, ramp, col, d) => {
        const X = x / CH_SCALE, Y = y / CH_SCALE;
        const g = ((mx - X) * 0.6 + (my - Y) * 0.8) / ext;
        let k = base + Math.round(g * 1.4);
        if (-d < 1.3 * CH_SCALE && g > 0.05) k += 1;                                   // arista iluminada
        if (streak && Math.abs(((X + Y * 0.55 + sd) % 10) - 5) < 0.55) k += 2;          // veta de refracción
        if (g < -0.55 && hash2(x >> 1, y >> 1, 41) < 0.35) return '#3a2a7a';           // reflejo violeta
        return L[clamp(k, 1, 7)];
      } });
  };
  const off = (i) => Math.sin(P + i * 1.3) * 1.2;
  for (const side of [-1, 1]) {
    const ax = cx + side * 17, ay = cy - 2 + off(side + 2);
    facet([[ax, ay - 9], [ax + side * 3, ay - 1], [ax, ay + 10], [ax - side * 2, ay]], side < 0 ? 4 : 2, 2, 'arm' + side);
    facet([[ax, ay - 9], [ax - side * 2, ay], [ax, ay + 10]], side < 0 ? 5 : 3, 2.1, 'armb' + side);
    facet([[ax + side * 1, ay + 13], [ax + side * 3, ay + 17], [ax + side * 1, ay + 21], [ax - side, ay + 17]], 3, 2.2, 'armc' + side);
  }
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + i * TAU / 7 + Math.sin(P) * 0.05;
    const r0 = 6, r1 = 15 + (i % 2) * 2;
    const x0 = cx + Math.cos(a) * r0, y0 = cy + Math.sin(a) * r0 * 1.1;
    const x1 = cx + Math.cos(a) * r1, y1 = cy + Math.sin(a) * r1 * 1.25;
    const nx = -Math.sin(a) * 3, ny = Math.cos(a) * 3;
    const light = Math.cos(a - 0.9) > 0 ? 4 : 2;
    facet([[x0 + nx * 0.4, y0 + ny * 0.4], [lerp(x0, x1, 0.55) + nx, lerp(y0, y1, 0.55) + ny], [x1, y1], [lerp(x0, x1, 0.55), lerp(y0, y1, 0.55)]], light + 1, 5 + i * 0.01, 's' + i);
    facet([[x0 - nx * 0.4, y0 - ny * 0.4], [lerp(x0, x1, 0.55) - nx, lerp(y0, y1, 0.55) - ny], [x1, y1], [lerp(x0, x1, 0.55), lerp(y0, y1, 0.55)]], light, 5.005 + i * 0.01, 'sb' + i);
  }
  const hy = cy - 27 + Math.round(off(5));
  facet([[cx, hy - 10], [cx + 7, hy], [cx, hy + 3]], 5, 20, 'h1');
  facet([[cx, hy - 10], [cx - 7, hy], [cx, hy + 3]], 3, 20.1, 'h2');
  facet([[cx - 7, hy], [cx, hy + 3], [cx, hy + 9]], 2, 20.2, 'h3');
  facet([[cx + 7, hy], [cx, hy + 3], [cx, hy + 9]], 4, 20.3, 'h4');
  const by = cy + 16;
  facet([[cx - 6, by], [cx, by - 3], [cx, by + 26 + off(7)]], 3, 8, 'b1');
  facet([[cx + 6, by], [cx, by - 3], [cx, by + 26 + off(7)]], 5, 8.1, 'b2');
  facet([[cx - 9, by + 14 + off(8)], [cx - 6, by + 12], [cx - 5, by + 20 + off(8)]], 4, 8.2, 'b3');
  facet([[cx + 9, by + 16 + off(9)], [cx + 6, by + 13], [cx + 6, by + 22 + off(9)]], 3, 8.3, 'b4');
  const coreCol = mood === 'alert' ? RAMP.coral : mood === 'warn' ? RAMP.yellow : RAMP.cyan;
  R.circle(cx, cy, 5.2, { ramp: MAT.ink, base: 2, z: 30, group: 'coreRing', flat: true });
  R.circle(cx, cy, 4, { ramp: coreCol, base: 5, z: 31, group: 'core', bevel: 2.4, shiny: true });
  R.stamp(pb => {
    const blink = anim === 'idle' && t > 0.83;
    if (blink) pb.hline(cx - 2, cx + 2, cy, '#0e2b4a');
    else { pb.vline(cx, cy - 2, cy + 2, '#0e2b4a'); if (mood === 'speak') pb.vline(cx + 1, cy - 1, cy + 1, '#0e2b4a'); }
    pb.set(cx - 2, cy - 2, '#ffffff');
    pb.line(cx + 1, hy - 8, cx + 6, hy - 1, '#ffffff');
    pb.set(cx + 5, cy - 13, '#ffffff'); pb.set(cx - 10, cy - 6, '#c4fbff');
    for (let i = 0; i < 4; i++) {
      const a = P + i * TAU / 4;
      const x = Math.round(cx + Math.cos(a) * 24), y = Math.round(cy + 6 + Math.sin(a) * 6);
      pb.set(x, y, '#56e5ff'); pb.set(x, y - 1, '#e6fdff'); pb.set(x, y + 1, '#1491aa');
    }
    for (let i = 0; i < 3; i++) { const a = -P * 0.7 + i * 2.1; pb.set(Math.round(cx + Math.cos(a) * 30), Math.round(cy - 12 + Math.sin(a) * 9), '#fff2f8'); }
    // glitch de píxel sobre el buffer real
    const B = pb.base || pb, gy = Math.round((cy - 20 + ((t * 7) % 1) * 50) * CH_SCALE);
    for (let x = 0; x < B.w - 1; x++) if (B.alpha(x, gy) && hash2(x, gy, Math.floor(t * 8)) < 0.4) B.set(x + 1, gy, '#b49cff');
  }, 100);
  // halo emisivo del núcleo en anillos (sin tramado, sin contorno) y destellos de borde
  R.glow(pb => {
    const B = pb.base || pb, s = CH_SCALE, X0 = cx * s, Y0 = cy * s;
    const cc = mood === 'alert' ? [255, 107, 107] : mood === 'warn' ? [255, 225, 77] : [86, 229, 255];
    const pulse = 0.5 + 0.5 * Math.sin(P * 2);
    for (let yy = Math.floor(Y0 - 13); yy <= Y0 + 13; yy++) for (let xx = Math.floor(X0 - 13); xx <= X0 + 13; xx++) {
      const dd = Math.hypot(xx + 0.5 - X0, yy + 0.5 - Y0); if (dd < 7.2 || dd > 12.5) continue;
      const ring = dd < 9 ? 0.55 : dd < 11 ? 0.3 : 0.14;
      const a = Math.round(255 * ring * (0.75 + 0.25 * pulse));
      const cur = B.data[yy * B.w + xx];
      if (cur >>> 24 === 255) { // sobre el cristal: aclara hacia el color del núcleo
        const r0 = cur & 255, g0 = (cur >>> 8) & 255, b0 = (cur >>> 16) & 255, k = ring * 0.7;
        B.data[yy * B.w + xx] = ((255 << 24) | (Math.round(b0 + (cc[2] - b0) * k) << 16) | (Math.round(g0 + (cc[1] - g0) * k) << 8) | Math.round(r0 + (cc[0] - r0) * k)) >>> 0;
      } else if (!(cur >>> 24)) B.data[yy * B.w + xx] = ((a << 24) | (cc[2] << 16) | (cc[1] << 8) | cc[0]) >>> 0;
    }
  });
  const pb = R.render({ env: opts.env, outlineColor: '#0b2238', outlineAll: '#0b2238', rim: 0.2 });
  pb.anchors = { head: { x: cx * CH_SCALE, y: hy * CH_SCALE }, core: { x: cx * CH_SCALE, y: cy * CH_SCALE } };
  return pb;
}
CHARS.limen = { name: 'LIMEN', render: renderLimen, ox: 46, oy: 123, shadowR: 13, warmAnims: ['idle', 'talk'] };

/* ------------------------------------------------------------------ */
/* MIRAGE / MOSAICO — gemelo digital (×1,28, lienzo 132×172)             */
/* ------------------------------------------------------------------ */
const MOSAIC_LAYERS = ['#56e5ff', '#ffe14d', '#86e36f', '#20d6c7', '#ff7656', '#eab02a', '#8d6bff'];
const _shadeMemo = new Map();
function shadeM(c, a) { const k = c + a; let v = _shadeMemo.get(k); if (!v) { v = shade(c, a); _shadeMemo.set(k, v); } return v; }
function renderTwin(anim, t, opts, mosaic) {
  const R = new Rig(132, 172, { v2: true }).scaled(CH_SCALE);
  const P = TAU * t;
  const cx = 52, hov = Math.round(Math.sin(P) * 2);
  const hy = 24 + hov;
  const iri = (x, y, idx, ramp) => {
    if (mosaic) {
      const cxl = Math.floor(x / 5), cyl = Math.floor((y - hov) / 5);
      if (x % 5 === 0 || (y - hov) % 5 === 0) return '#0e1a2a';
      const c = MOSAIC_LAYERS[Math.floor(hash2(cxl, cyl, 11) * MOSAIC_LAYERS.length)];
      return idx <= 2 ? shadeM(c, -0.25) : idx >= 5 ? shadeM(c, 0.15) : c;
    }
    const band = Math.floor((y * 0.5 + Math.sin(x * 0.12 + P) * 4 + t * 16) / 3) % 6;
    const cols = ['#a830b8', '#e050c8', '#ff8ad0', '#56e5ff', '#ffd0e8', '#6a1c94'];
    let c = cols[(band + 6) % 6];
    const iso = Math.sin(x * 0.16 + y * 0.07) + Math.sin(y * 0.13 - x * 0.04 + P);
    if (Math.abs(iso) < 0.08) c = '#fff6ff';
    if ((x + y) % 11 === 0 && idx > 3) c = '#ffd84a';
    // volumen: costados en sombra violeta, centro iluminado, pliegues verticales y líneas de barrido holográfico
    const X = x / CH_SCALE, fold = Math.sin((X - cx) * 0.55 + Math.sin(y * 0.03) * 1.5);
    if (idx <= 1) c = shadeM(c, -0.45); else if (idx === 2) c = shadeM(c, -0.25); else if (idx >= 5) c = shadeM(c, 0.12);
    if (fold > 0.86 && y > hy * CH_SCALE + 30) c = shadeM(c, -0.3);
    if ((Math.floor(y) + Math.floor(t * 24)) % 4 === 0) c = shadeM(c, 0.18);
    return c;
  };
  const gown = [[cx - 9, hy + 18], [cx + 9, hy + 18], [cx + 14, hy + 40], [cx + 30 + Math.sin(P) * 2, 128 + hov * 0.3], [cx - 30 - Math.sin(P) * 2, 128 + hov * 0.3], [cx - 14, hy + 40]];
  R.poly(gown, { ramp: RAMP.mirage, base: 4, z: 10, group: 'gown', bevel: 6, texture: iri });
  const armUp = anim === 'talk' || anim === 'point' ? Math.max(0, Math.sin(P)) : 0.2;
  for (const side of [-1, 1]) {
    const sx = cx + side * 10, sy = hy + 20;
    const ex = cx + side * (22 + armUp * 6), ey = sy + 22 - armUp * 18;
    R.capsule(sx, sy, ex, ey, 3, 2, { ramp: RAMP.mirage, base: side < 0 ? 4 : 3, z: side < 0 ? 5 : 20, group: 'arm' + side, bevel: 2, texture: iri });
    R.capsule(ex, ey, ex + side * 4, ey + 14 - armUp * 10, 2, 1, { ramp: RAMP.mirage, base: side < 0 ? 4 : 3, z: side < 0 ? 5.1 : 20.1, group: 'hand' + side, bevel: 1.4, texture: iri });
  }
  R.capsule(cx, hy + 8, cx, hy + 19, 3.5, 5, { ramp: RAMP.mirage, base: 4, z: 12, group: 'neck', bevel: 2, texture: iri });
  R.ellipse(cx, hy, 10, 13, { ramp: mosaic ? RAMP.cyan : RAMP.mirage, base: 5, z: 15, group: 'head', bevel: 4,
    texture: mosaic ? iri : (x, y, idx) => {
      const k = (y / CH_SCALE - hy + 13) / 26;
      const sky = ['#ffd0e8', '#fff6ff', '#c4fbff', '#56e5ff', '#e050c8', '#6a1c94'];
      let c = sky[clamp(Math.floor(k * 6 + Math.sin(x * 0.3 + P) * 0.4), 0, 5)];
      if (Math.abs((x / CH_SCALE - cx) + (y / CH_SCALE - hy) * 0.6 + 3) < 1) c = '#ffffff';
      return idx <= 2 ? shadeM(c, -0.3) : c;
    } });
  R.stamp(pb => {
    for (let i = 0; i < 11; i++) {
      const a = -Math.PI + i * Math.PI / 10;
      const x = Math.round(cx + Math.cos(a) * 17), y = Math.round(hy - 2 + Math.sin(a) * 18);
      pb.set(x, y, mosaic ? MOSAIC_LAYERS[i % 7] : (i % 2 ? '#56e5ff' : '#ffd84a'));
    }
    if (mosaic) {
      pb.rect(cx - 5, hy - 1, 2, 3, '#0e1a2a'); pb.rect(cx + 3, hy - 1, 2, 3, '#0e1a2a');
      pb.set(cx - 5, hy - 1, '#ffffff'); pb.set(cx + 3, hy - 1, '#ffffff');
      pb.set(cx - 2, hy + 5, '#0e1a2a'); pb.hline(cx - 1, cx + 1, hy + 6, '#0e1a2a'); pb.set(cx + 2, hy + 5, '#0e1a2a');
    } else {
      const B = pb.base || pb;
      for (let k = 0; k < 3; k++) {
        const gy = Math.round((30 + ((t * 3 + k * 0.37) % 1) * 96) * CH_SCALE);
        const row = []; for (let x = 0; x < B.w; x++) row.push(B.get(x, gy));
        for (let x = 0; x < B.w; x++) if (row[x] >>> 24) B.set(x + 2, gy, row[x]);
      }
    }
  }, 100);
  // el bajo del vestido se deshace en píxeles que suben (holograma), sin contorno
  R.glow(pb => {
    const B = pb.base || pb, s = CH_SCALE, yh = Math.round((128 + hov * 0.3) * s), fr = Math.floor(t * 8);
    for (let y = yh - 20; y <= yh + 3; y++) for (let x = 0; x < B.w; x++) {
      const i = y * B.w + x; if (y < 0 || y >= B.h || !(B.data[i] >>> 24)) continue;
      if (hash2(x >> 1, y >> 1, fr) < (y - (yh - 20)) / 23 * 0.8) B.data[i] = 0;
    }
    const pal = mosaic ? MOSAIC_LAYERS : ['#ff8ad0', '#56e5ff', '#fff6ff', '#e050c8'];
    for (let k = 0; k < 14; k++) {
      const ph = (t * (1 + hash1(k, 6)) + k / 14) % 1;
      const x = Math.round((cx - 28 + hash1(k, 5) * 56) * s), y = Math.round((130 - ph * 34) * s);
      if (ph < 0.85) B.rect(x, y, ph < 0.4 ? 2 : 1, ph < 0.4 ? 2 : 1, pal[k % pal.length]);
    }
  });
  const oc = mosaic ? '#06100a' : '#1d0b3a';
  const pb = R.render({ env: opts.env, outlineColor: oc, outlineAll: oc, rim: 0.15 });
  pb.anchors = { head: { x: cx * CH_SCALE, y: hy * CH_SCALE } };
  return pb;
}
CHARS.mirage = { name: 'MIRAGE', render: (a, t, o) => renderTwin(a, t, o, false), ox: 66, oy: 168, shadowR: 26, warmAnims: ['idle', 'talk'] };
CHARS.mosaico = { name: 'MOSAICO', render: (a, t, o) => renderTwin(a, t, o, true), ox: 66, oy: 168, shadowR: 26, warmAnims: ['idle', 'talk'] };

/* ------------------------------------------------------------------ */
/* BETA-9 — robot batería que expresa su SOC (×1,28, lienzo 52×60)       */
/* ------------------------------------------------------------------ */
function renderBeta(anim, t, opts) {
  const R = new Rig(52, 60, { v2: true }).scaled(CH_SCALE);
  const P = TAU * t;
  const soc = (opts.variant ?? 6) / 10;
  const bob = Math.round(Math.sin(P) * 0.6 + 0.4);
  const cx = 20, by = 30 + bob;
  const steel = RAMP.steelRefR || RAMP.metal;
  R.box(cx, 41, 9, 3, 2, { ramp: MAT.ink, base: 3, z: 1, group: 'tread', bevel: 1.2 });
  R.box(cx, by, 9, 11, 2.5, { ramp: steel, base: 5, z: 5, group: 'body', bevel: 2.2, shiny: true });
  R.box(cx, by - 12, 4, 1.6, 0.6, { ramp: steel, base: 6, z: 6, group: 'cap', bevel: 0.8, shiny: true });
  for (const s of [-1, 1]) R.capsule(cx + s * 9, by - 2, cx + s * 12, by + 4 + (anim === 'talk' && s > 0 ? -Math.max(0, Math.sin(P)) * 6 : 0), 1.3, 1.1, { ramp: steel, base: 4, z: s > 0 ? 8 : 0, group: 'arm' + s, bevel: 0.8, dark: s < 0 ? 1 : 0 });
  R.stamp(pb => {
    pb.rect(cx - 6, by - 8, 12, 8, '#0a1030');
    const col = soc < 0.2 ? '#ff4e5d' : soc < 0.4 ? '#ffb83e' : '#86e36f';
    const n = Math.round(soc * 10);
    for (let i = 0; i < 10; i++) pb.set(cx - 5 + i, by - 2, i < n ? col : '#1c2350');
    if (soc < 0.25) { pb.set(cx - 3, by - 6, col); pb.set(cx + 2, by - 6, col); pb.hline(cx - 2, cx + 1, by - 4, col); pb.set(cx - 3, by - 3, col); pb.set(cx + 2, by - 3, col); }
    else { pb.set(cx - 3, by - 6, col); pb.set(cx + 2, by - 6, col); pb.set(cx - 3, by - 4, col); pb.hline(cx - 2, cx + 1, by - 3, col); pb.set(cx + 2, by - 4, col); }
    for (let y = by + 2; y < by + 9; y += 2) pb.hline(cx - 7, cx + 7, y, steel[2]);
    pb.set(cx, by - 14, anim === 'talk' && (Math.floor(t * 6) % 2) ? '#ff4e5d' : '#ffe14d');
    pb.set(cx - 7, by - 9, '#ffffff');
    // reflejo de la pantalla, franja de aviso amarilla/negra, tornillos, aletas de disipación y LED de estado
    pb.line(cx - 5, by - 7, cx - 3, by - 7, '#2a3a6a'); pb.set(cx + 4, by - 7, '#2a3a6a');
    for (let k = 0; k < 14; k++) pb.set(cx - 7 + k, by + 10, ((k >> 1) % 2) ? '#1a1418' : '#ffd84a');
    for (const [bx, by2] of [[-8, -10], [8, -10], [-8, 9], [8, 9]]) { pb.set(cx + bx, by + by2, '#f4fbff'); pb.set(cx + bx, by + by2 + 1, steel[1]); }
    for (let y = by - 4; y < by + 8; y += 2) { pb.set(cx + 9, y, steel[1]); pb.set(cx - 9, y, steel[6]); }
    pb.set(cx + 6, by + 3, Math.floor(t * 4) % 2 ? '#56e5ff' : '#1491aa');
    // borne + (terminal de batería) en la tapa
    pb.set(cx + 4, by - 13, '#ff4e5d'); pb.set(cx + 3, by - 13, '#ff4e5d'); pb.set(cx + 5, by - 13, '#ff4e5d'); pb.set(cx + 4, by - 14, '#ff4e5d');
    // ruedas de la oruga
    for (let k = -6; k <= 6; k += 4) { pb.set(cx + k, 41, '#5a5961'); pb.set(cx + k + ((Math.floor(t * 8)) % 2), 42, '#8f8f95'); }
  }, 100);
  // halo del panel de SOC (emisivo, sin contorno)
  R.glow(pb => {
    const col = soc < 0.2 ? '#ff4e5d' : soc < 0.4 ? '#ffb83e' : '#86e36f', n = Math.round(soc * 10);
    for (let i = 0; i < n; i++) pb.set(cx - 5 + i, by - 1, mixHex(col, '#0a1030', 0.55));
  });
  const pb = R.render({ env: opts.env, outlineColor: '#0a0c16' });
  pb.anchors = { head: { x: cx * CH_SCALE, y: (by - 8) * CH_SCALE } };
  return pb;
}
CHARS.beta9 = { name: 'BETA-9', render: renderBeta, ox: 26, oy: 58, shadowR: 11, warmAnims: ['idle', 'talk'] };

/* ------------------------------------------------------------------ */
/* NPC generativos (BODY × OUTFIT × PROP × HAIR2)                       */
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
  // añadidos del rediseño
  RAMP_CH.denim, RAMP_CH.khaki, RAMP_CH.terracotta, RAMP_CH.mustard, RAMP_CH.teal, RAMP_CH.plum, RAMP_CH.sage, RAMP_CH.pinkTop, RAMP_CH.skyTop,
];
const SKINS = ['skinA', 'skinN', 'skinD', 'skinE', 'skinM', 'skinPale', 'skinTan', 'skinDeep'];
const NPC_HAIRS = [RAMP.hairA, RAMP.hairN, RAMP.hairD, RAMP.hairE, ['#1a1010', '#2e1c18', '#4a2e24', '#6a4432', '#8c5c42', '#ae7a56'], RAMP_CH.blackHair, RAMP_CH.brownHair, RAMP_CH.blondHair, RAMP_CH.redHair, RAMP_CH.greyHair];
/** Peinados de NPC: (R, o, H, cfg, r) */
const NPC_STYLES = {
  short(R, o, H) { HAIR2.cap(R, o, H, { grow: 0.5, sy: 0.82 }); HAIR2.bangs(R, o, H, [[[3, -10], [7, -7], [9.5, -4], 2.2], [[0, -10.5], [3, -7.5], [4.5, -5], 2]]); },
  buzz(R, o, H) { HAIR2.cap(R, o, H, { grow: 0.1, sy: 0.78, faceR: 0.76, texture: (x, y, idx, ramp) => ((x + y * 2) % 3 === 0 ? ramp[clamp(idx - 1, 1, ramp.length - 1)] : null) }); },
  bald(R, o, H) { HAIR2.strand(R, o, H, [[-8, -2], [-9, 3], [-7.5, 6]], 2, 0.6, { z: 56, group: 'fringe' }); },
  bun(R, o, H) { HAIR2.bun(R, o, H, -6, -9.5, 4.4); HAIR2.cap(R, o, H, { grow: 0.5, sy: 0.88 }); HAIR2.bangs(R, o, H, [[[4, -10], [8, -6], [9.6, -3], 2]]); },
  long(R, o, H) {
    HAIR2.cap(R, o, H, { grow: 1.2, sy: 0.95 });
    const sw = (o.pose.hair && o.pose.hair.base) || 0;
    R.strand([[o.hx - 4, o.hy - 6], [o.hx - 7 - sw * 2, o.hy + 6], [o.hx - 6.5 - sw * 3, o.hy + 17]], 5.2, 2.2, { mat: H, base: 3, z: 3, group: 'longhair', taper: 0.7 });
    HAIR2.bangs(R, o, H, [[[2, -11], [6, -7], [8, -2.5], 2.6], [[6.5, -9.5], [9.5, -5.5], [10.8, -1.5], 2]]);
    HAIR2.lock(R, o, H, [[-1, -5], [-1.5, 3], [-0.5, 10]], 2.2);
  },
  ponytail(R, o, H, cfg, r) {
    HAIR2.cap(R, o, H, { grow: 0.9, sy: 0.92 });
    HAIR2.ponytail(R, o, H, { root: [-5, -o.ry + 3], dir: 3.35, tie: asMat(cfg.tie || RAMP.coral), z: 45, clumps: [[0.2, 13, 2.8, -0.28], [-0.05, 15, 3, -0.34], [-0.3, 12, 2.5, -0.4]] });
    HAIR2.bangs(R, o, H, [[[3, -11], [6.5, -7], [8.2, -3], 2.4]]);
  },
  curly(R, o, H) {
    HAIR2.cap(R, o, H, { grow: 1.4, sy: 0.95, texture: (x, y, idx, ramp) => coilTexture(x, y, idx, ramp, 3) });
    HAIR2.puff(R, o, H, o.hx, o.hy, [[-6, -8, 3.6], [-9, -2, 3.4], [-2, -11, 3.4], [3, -10, 3], [-9, 4, 3], [6.5, -8, 2.6]], { z: 56, base: 4 });
  },
  afro(R, o, H) {
    HAIR2.puff(R, o, H, o.hx - 2, o.hy - 4, [[0, -4, 6.5], [-6, 0, 5.5], [5, -5, 5], [-4, -8, 5], [3, -10, 4.4], [-8, 5, 4.2], [7, -1, 3.6]], { z: 54, base: 3 });
    HAIR2.cap(R, o, H, { grow: 1.2, sy: 0.9, z: 55, texture: (x, y, idx, ramp) => coilTexture(x, y, idx, ramp, 3) });
  },
  braid(R, o, H, cfg) {
    HAIR2.cap(R, o, H, { grow: 0.8, sy: 0.9 });
    HAIR2.bangs(R, o, H, [[[3, -10.5], [7, -7], [9, -3], 2.2]]);
    const pts = []; for (let i = 0; i < (cfg.child ? 4 : 7); i++) pts.push([o.hx - 7 - i * 0.4, o.hy + 4 + i * 3, 2.3 - i * 0.08]);
    HAIR2.braid(R, o, H, pts, asMat(cfg.tie || RAMP.coral));
  },
  doubleBraids(R, o, H, cfg) {
    HAIR2.cap(R, o, H, { grow: 0.8, sy: 0.9 });
    HAIR2.bangs(R, o, H, [[[3, -10.5], [7, -7], [9, -3], 2.2], [[0, -11], [3, -7], [4, -4], 2]]);
    for (const [dx, z] of [[-7, 0], [-3, 1]]) { const pts = []; for (let i = 0; i < 6; i++) pts.push([o.hx + dx - i * 0.3, o.hy + 5 + i * 3, 2 - i * 0.08]); HAIR2.braid(R, o, H, pts, asMat(cfg.tie || RAMP.yellow)); }
  },
  puff(R, o, H) {
    // diseño anterior de Amaya: moño rizado alto (se conserva para la diversidad del elenco)
    HAIR2.cap(R, o, H, { grow: 0.9, sy: 0.9, texture: (x, y, idx, ramp) => coilTexture(x, y, idx, ramp, 3) });
    const px = o.hx - 5.5, py = o.hy - 13.5;
    HAIR2.puff(R, o, H, px, py, [[0, 0, 5.2], [-5.2, 1.5, 4], [5, -1.2, 4.2], [-2.2, -5, 4.1], [3.2, -5.6, 3.8], [-6.2, -3.2, 3.2], [7, 2.8, 3.2], [0.6, 4, 4]], { z: 45 });
    HAIR2.puff(R, o, H, o.hx, o.hy, [[8.2, -7, 2.8], [4, -8.2, 3], [-0.5, -9, 2.8], [-7.6, 3.2, 3], [-6.6, 7, 2.4]], { z: 56, base: 4 });
    R.ellipse(o.hx - 2.8, o.hy - 8.5, 4, 2.1, { mat: asMat(MAT.amayaJacket), base: 4, z: 46, group: 'scrunch', bevel: 1 }, -0.35);
  },
  cap(R, o, H) { NPC_STYLES.short(R, o, H); },
};
const NPC_IRIS = [['#1a0a06', '#3a2010', '#6a4422'], ['#0a0a14', '#2a2a3e', '#545470'], ['#0e2014', '#2a5034', '#5a8a5a'], ['#06142a', '#1c3a66', '#4a7ab0']];
function makeNPC(id, cfg) {
  const r = RNG(cfg.seed || 1);
  const SR = SKIN_RAMPS();
  const skinR = SR[cfg.skin || r.pick(SKINS)] || RAMP.skinA;
  const hairR = cfg.hair || r.pick(NPC_HAIRS);
  const top = cfg.top || r.pick(NPC_CLOTH), legs = cfg.legs || r.pick(NPC_CLOTH.concat([MAT.amayaPants, MAT.olive, MAT.tealPants, RAMP_CH.denim, RAMP_CH.khaki, RAMP_CH.charcoal]));
  const child = !!cfg.child;
  const bodyKind = cfg.body || (child ? 'child' : r.pick(['adult', 'adult', 'tall', 'stocky', 'teen']));
  const style = cfg.style || r.pick(['short', 'bun', 'long', 'curly', 'braid', 'ponytail', 'afro', 'buzz', 'doubleBraids', 'bald']);
  const outfit = cfg.outfit || (cfg.apron ? 'apron' : cfg.raincoat ? 'raincoat' : cfg.vest ? 'vest' : r.pick(['tee', 'tee', 'jacket', 'overalls', 'dress', 'poncho', 'tee']));
  const B = makeBody(bodyKind);
  if (cfg.wide) B.torsoW *= cfg.wide;
  const out = r.pick(['#1a0a08', '#0e0a10']);
  const lineOf = (ramp) => Mat({ ramp, outline: outlineOf(ramp[0], 0.12) });
  const D = Object.assign(B, {
    face: {
      eyeX: child ? 2.5 : 2.5, eyeY: child ? 1 : 0.5, eye2X: child ? 8 : 8.5, mouthX: child ? 6 : 6.5, mouthY: child ? 6.5 : 7, noseX: B.headRX - 0.2, noseY: 3.5,
      iris: cfg.iris || r.pick(NPC_IRIS), lash: out, browCol: hairR[1], blush: child ? '#e07a6a' : (cfg.blush || null),
    },
    jaw: cfg.jaw || r.pick(['round', 'round', 'square', 'long']), noseSize: cfg.nose ?? r.pick([0.6, 1, 1, 1.4, 1.8]),
    shortSleeve: cfg.shortSleeve ? 0.55 : 0, energetic: child ? 1.4 : (B.energetic ?? 1), shadowR: child ? 9 : bodyKind === 'stocky' ? 13 : 12,
    sole: '#1a0c08', bootTall: cfg.shoesLow ? 2 : 3, earZ: 56,
    prepare() {
      if (this.mat) return;
      const skin = Mat({ ramp: skinR, outline: outlineOf(skinR[0], 0.16) });
      const topM = lineOf(top), legM = lineOf(legs);
      this.mat = { skin, hair: lineOf(hairR), top: topM, sleeve: topM, legs: legM, shoes: lineOf(cfg.shoes || MAT.boots) };
      this.foreMat = cfg.shortSleeve ? skin : null;
      this.oc = { top: topM, inner: cfg.inner ? lineOf(cfg.inner) : topM, pens: cfg.pens, jacket: cfg.jacket ? lineOf(cfg.jacket) : null, vest: cfg.vest ? lineOf(cfg.vest) : null, apron: cfg.apron ? lineOf(cfg.apron) : null, coat: cfg.coat ? lineOf(cfg.coat) : null, poncho: cfg.poncho ? lineOf(cfg.poncho) : null, bib: cfg.bib ? lineOf(cfg.bib) : null, stripe: cfg.stripe };
      const acc = [];
      const hat = cfg.hat === 'cap' || style === 'cap' ? 'cap' : cfg.hat;
      if (hat) acc.push({ kind: hat === 'hard' ? 'hardhat' : hat, mat: lineOf(cfg.hatCol || r.pick(NPC_CLOTH)) });
      if (cfg.glasses) acc.push({ kind: 'glasses', col: cfg.glasses, round: !!cfg.roundGlasses });
      if (cfg.headscarf) acc.push({ kind: 'headscarf', mat: lineOf(cfg.headscarf), dot: cfg.scarfDot });
      const prop = cfg.prop || B.prop;
      if (prop && PROP[prop] && ACCESSORY[PROP[prop]]) acc.push({ kind: PROP[prop], mat: cfg.propMat ? lineOf(cfg.propMat) : undefined });
      if (cfg.satchel) acc.push({ kind: 'satchel', mat: lineOf(cfg.satchel), strap: lineOf(MAT.leather) });
      if (cfg.backpack) acc.push({ kind: 'backpack', body: lineOf(cfg.backpack), flap: lineOf(MAT.leather), strap: lineOf(MAT.leather), w: 5, h: 7 });
      this.accessories = acc;
    },
    hair(R, o) {
      const H = this.mat.hair;
      if (cfg.headscarf) { HAIR2.cap(R, o, H, { grow: 0.2, sy: 0.75 }); return; }
      (NPC_STYLES[style] || NPC_STYLES.short)(R, o, H, Object.assign({ child }, cfg), r);
      if (child && cfg.pigtails) { R.circle(o.hx - 10, o.hy - 1, 3, { mat: H, base: 4, z: 3, group: 'pt1', bevel: 1.5 }); R.circle(o.hx - 8, o.hy + 6, 2.8, { mat: H, base: 3, z: 3, group: 'pt2', bevel: 1.5 }); }
      if (cfg.flowers) R.stamp(pb => { [[-4, -11, '#f78acb'], [0, -12, '#ffe14d'], [4, -11, '#56e5ff'], [-8, -7, '#86e36f']].forEach(([dx, dy, c]) => { pb.set(Math.round(o.hx + dx), Math.round(o.hy + dy), c); pb.set(Math.round(o.hx + dx + 1), Math.round(o.hy + dy), '#fff'); }); }, 98);
      if (style !== 'bald' && style !== 'buzz' && !cfg.hat) HAIR2.shine(R, o, ['hair'], H.ramp[Math.min(H.ramp.length - 1, 5)], -2.4, -1.4, 0.7);
    },
    torso(R, o) { (OUTFIT[outfit] || OUTFIT.tee)(R, o, this.oc); },
    faceStamp(pb, o) {
      const sk = this.mat.skin.ramp;
      if (cfg.mustache) { pb.hline(Math.round(o.hx + 5), Math.round(o.hx + 9), Math.round(o.hy + 5.5), cfg.mustache); pb.set(Math.round(o.hx + 4), Math.round(o.hy + 6.5), cfg.mustache); }
      if (cfg.beard) { for (let y = 0; y < 4; y++) pb.hline(Math.round(o.hx + 1 + y), Math.round(o.hx + 8 - (y >> 1)), Math.round(o.hy + 7 + y), (y + o.hx) % 2 ? cfg.beard : shade(cfg.beard, -0.2)); }
      if (cfg.wrinkles) { pb.set(o.e1x - 2, o.eyeY + 1, sk[2]); pb.set(o.e1x - 2, o.eyeY + 2, sk[3]); pb.set(Math.round(o.hx + 5), Math.round(o.hy + 5), sk[3]); }
      if (cfg.earring) pb.set(Math.round(o.hx - 2), Math.round(o.hy + 5), cfg.earring);
    },
  });
  if (cfg.posture === 'stoop') D.stoop = 0.16;
  CHARS[id] = { name: cfg.name || id, render: (a, t, op) => renderHumanoid(id, D, a, t, op), ox: HUM_OX, oy: HUM_OY, shadowR: D.shadowR, D };
  return D;
}
makeNPC('marea', { name: 'Tía Marea', seed: 11, skin: 'skinM', hair: RAMP.hairE, style: 'braid', top: MAT.danteOver, legs: MAT.tealPants, hat: 'bucket', hatCol: MAT.kiruBody, outfit: 'raincoat', coat: RAMP_CH.rain, wrinkles: true, body: 'elder', prop: 'net', shoes: MAT.boots });
makeNPC('cobre', { name: 'Don Cobre', seed: 22, skin: 'skinE', hair: RAMP.hairE, style: 'bald', top: MAT.tshirtW, legs: MAT.amayaPants, outfit: 'apron', apron: RAMP.copper, mustache: '#cdcfe2', glasses: '#c8861a', wrinkles: true, body: 'stocky', prop: 'toolbox' });
makeNPC('alma', { name: 'Alma Semilla', seed: 33, skin: 'skinA', hair: RAMP.hairA, style: 'curly', child: true, pigtails: true, top: MAT.nairaShirt, legs: MAT.kiruBody, flowers: true, shoes: MAT.sneakerY, outfit: 'tee', shortSleeve: true });
makeNPC('nimbo', { name: 'Capitán Nimbo', seed: 44, skin: 'skinD', hair: RAMP.hairE, style: 'short', top: NPC_CLOTH[5], legs: MAT.olive, hat: 'aviator', hatCol: MAT.leather, mustache: '#a8aac6', outfit: 'vest', vest: RAMP.coral, body: 'tall', wrinkles: true });
makeNPC('consejal', { name: 'Consejera Ruth', seed: 55, skin: 'skinN', hair: RAMP.hairN, style: 'bun', top: NPC_CLOTH[0], legs: MAT.amayaPants, glasses: '#8a5e14', outfit: 'jacket', jacket: RAMP_CH.plum, body: 'adult', earring: '#ffd84a' });
makeNPC('operador', { name: 'Operador Iván', seed: 66, skin: 'skinM', style: 'short', hair: RAMP_CH.blackHair, hat: 'cap', hatCol: NPC_CLOTH[1], top: NPC_CLOTH[6], legs: MAT.danteOver, outfit: 'hivis', vest: RAMP_CH.hivisO, body: 'adult', prop: 'tablet' });
makeNPC('pastora', { name: 'Doña Celia', seed: 77, skin: 'skinA', hair: RAMP.hairE, style: 'long', top: NPC_CLOTH[7], legs: NPC_CLOTH[4], wrinkles: true, body: 'elder', outfit: 'poncho', poncho: RAMP_CH.terracotta, stripe: '#ffe14d', prop: 'cane' });
makeNPC('financia', { name: 'Sr. Ledesma', seed: 88, skin: 'skinE', hair: RAMP.hairN, style: 'short', top: NPC_CLOTH[5], legs: NPC_CLOTH[5], glasses: '#263442', outfit: 'jacket', jacket: RAMP_CH.charcoal, inner: MAT.tshirtW, body: 'tall', jaw: 'long' });
/* Público de la plaza (nivel 00) y del puerto: diversidad de edad, talla, ropa y oficio.
   crowd1 conserva el diseño anterior de Amaya (piel oscura, moño rizado, chaqueta coral y
   camiseta turquesa) para mantener la diversidad del elenco. */
const CROWD_CFG = [
  { body: 'tall', style: 'short', skin: 'skinDeep', hair: RAMP_CH.blackHair, outfit: 'tee', top: RAMP_CH.teal, legs: RAMP_CH.denim, beard: '#140a08', shortSleeve: true },
  { body: 'adult', style: 'puff', skin: 'skinA', hair: RAMP.hairA, outfit: 'jacket', top: MAT.amayaShirt, jacket: MAT.amayaJacket, legs: MAT.amayaPants, shoes: MAT.sneakerY, iris: ['#1a0f20', '#5a3354', '#8a5a7a'], earring: '#ffe14d' },
  { body: 'stocky', style: 'short', skin: 'skinTan', hair: RAMP_CH.greyHair, hat: 'bucket', hatCol: RAMP_CH.sage, outfit: 'overalls', top: NPC_CLOTH[6], bib: RAMP_CH.mustard, legs: RAMP_CH.mustard, beard: '#9696a4', prop: 'net', wrinkles: true },
  { child: true, style: 'ponytail', skin: 'skinPale', hair: RAMP_CH.redHair, outfit: 'dress', top: RAMP_CH.skyTop, legs: RAMP_CH.skyTop, pigtails: true, tie: RAMP.yellow },
  { body: 'elder', style: 'long', skin: 'skinM', hair: RAMP_CH.greyHair, headscarf: RAMP_CH.plum, scarfDot: '#ffe14d', outfit: 'poncho', top: NPC_CLOTH[4], poncho: RAMP_CH.teal, stripe: '#f4a050', legs: RAMP_CH.charcoal, prop: 'cane', wrinkles: true },
  { body: 'adult', style: 'bun', skin: 'skinN', hair: RAMP.hairN, outfit: 'apron', top: RAMP_CH.pinkTop, apron: RAMP_CH.cream, legs: RAMP_CH.khaki, prop: 'basket', earring: '#56e5ff' },
  { body: 'teen', style: 'afro', skin: 'skinDeep', hair: RAMP_CH.blackHair, outfit: 'jacket', top: NPC_CLOTH[2], jacket: RAMP_CH.skyTop, legs: RAMP_CH.charcoal, backpack: RAMP_CH.terracotta },
  { child: true, style: 'short', skin: 'skinTan', hair: RAMP_CH.brownHair, hat: 'cap', hatCol: NPC_CLOTH[7], outfit: 'tee', top: NPC_CLOTH[3], legs: RAMP_CH.denim, shortSleeve: true },
  { child: true, style: 'ponytail', skin: 'skinE', hair: RAMP_CH.blondHair, outfit: 'tee', top: NPC_CLOTH[0], legs: RAMP_CH.teal, shortSleeve: true, tie: RAMP.cyan },
  { child: true, style: 'buzz', skin: 'skinD', hair: RAMP.hairD, outfit: 'overalls', top: NPC_CLOTH[11], bib: RAMP_CH.denim, legs: RAMP_CH.denim },
  { body: 'stocky', style: 'buzz', skin: 'skinDeep', hair: RAMP_CH.blackHair, hat: 'hard', hatCol: MAT.hardhat, outfit: 'hivis', top: NPC_CLOTH[6], vest: RAMP_CH.hivis, legs: RAMP_CH.denim, prop: 'toolbox' },
  { body: 'tall', style: 'long', skin: 'skinPale', hair: RAMP_CH.brownHair, outfit: 'dress', top: RAMP_CH.terracotta, legs: RAMP_CH.terracotta, prop: 'wateringCan', earring: '#ffd84a' },
  { body: 'elder', style: 'buzz', skin: 'skinE', hair: RAMP_CH.greyHair, outfit: 'labcoat', top: NPC_CLOTH[1], coat: RAMP_CH.cream, legs: RAMP_CH.charcoal, glasses: '#3a2a20', roundGlasses: true, mustache: '#bcbcc8', wrinkles: true, pens: false },
  { body: 'adult', style: 'doubleBraids', skin: 'skinM', hair: RAMP_CH.blackHair, outfit: 'overalls', top: RAMP_CH.mustard, bib: RAMP_CH.sage, legs: RAMP_CH.sage, prop: 'hoe', tie: RAMP.coral },
];
CROWD_CFG.forEach((c, i) => makeNPC('crowd' + i, Object.assign({ seed: 100 + i * 7 }, c)));
