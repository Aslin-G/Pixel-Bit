/* =====================================================================
   14_portraits.js — Retratos pixel 128x128 para diálogos.
   Mismo motor SDF del rig con sombra proyectada del pelo, ojos con iris,
   pupila y brillos, cejas, nariz, labios y expresiones.
   ===================================================================== */

const PEXPR = {
  neutral: { eye: 'open', brow: 'neutral', mouth: 'line' },
  smile: { eye: 'open', brow: 'neutral', mouth: 'smile' },
  happy: { eye: 'happy', brow: 'up', mouth: 'smile', blush: true },
  joy: { eye: 'happy', brow: 'up', mouth: 'grin', blush: true },
  surprised: { eye: 'wide', brow: 'raised', mouth: 'o' },
  worried: { eye: 'open', brow: 'worried', mouth: 'wavy' },
  sad: { eye: 'sad', brow: 'worried', mouth: 'frown' },
  crying: { eye: 'sad', brow: 'worried', mouth: 'frown', tear: true },
  angry: { eye: 'angry', brow: 'angry', mouth: 'frown' },
  determined: { eye: 'angry', brow: 'determined', mouth: 'flat' },
  thinking: { eye: 'half', brow: 'skeptical', mouth: 'flat', look: 0.6 },
  skeptical: { eye: 'half', brow: 'skeptical', mouth: 'smirk' },
  guilty: { eye: 'down', brow: 'worried', mouth: 'flat' },
  calm: { eye: 'half', brow: 'neutral', mouth: 'smile' },
  scared: { eye: 'wide', brow: 'worried', mouth: 'wavy' },
  tired: { eye: 'half', brow: 'worried', mouth: 'flat' },
  proud: { eye: 'happy', brow: 'neutral', mouth: 'smirk', blush: true },
  embarrassed: { eye: 'down', brow: 'worried', mouth: 'wavy', blush: true },
};

const PF = {
  /** Ojo de retrato. (cx,cy) centro; w,h tamaño; iris: rampa; look desplazamiento horizontal */
  eye(pb, cx, cy, w, h, kind, o) {
    const ink = o.ink || '#1a0c18', lid = o.lid || '#2a1420', sk = o.skin;
    const sclera = '#fffaf0', scl2 = '#d8d0ec';
    cx = Math.round(cx); cy = Math.round(cy);
    const hw = w / 2, hh = h / 2;
    const look = o.look || 0;
    const drawOpen = (topCut = 0, wide = 1) => {
      // esclerótica
      for (let y = -hh * wide; y <= hh * wide; y++) for (let x = -hw; x <= hw; x++) {
        const d = (x * x) / (hw * hw) + (y * y) / (hh * hh * wide * wide);
        if (d > 1) continue;
        if (y < -hh * wide + topCut) { pb.set(cx + x, cy + y, sk[3]); continue; }
        pb.set(cx + x, cy + y, y > hh * 0.4 ? scl2 : sclera);
      }
      // iris
      const ir = Math.max(2, w * (wide > 1 ? 0.26 : 0.33)), iy = hh * 0.42 * wide;
      const icx = cx + look * hw * 0.35 + (o.far ? 1 : 0);
      for (let y = -iy - 1; y <= iy + 1; y++) for (let x = -ir; x <= ir; x++) {
        if ((x * x) / (ir * ir) + (y * y) / ((iy + 1) * (iy + 1)) > 1) continue;
        const yy = cy + 1 + y;
        if (yy < cy - hh * wide + topCut) continue;
        const ed = (x * x) / (ir * ir) + (y * y) / ((iy + 1) * (iy + 1));
        const t = (y + iy) / (2 * iy + 2);
        let c = o.iris[t < 0.3 ? 1 : t < 0.65 ? 2 : 3];
        if (ed > 0.75) c = o.iris[0];
        pb.set(Math.round(icx + x), yy, c);
      }
      // pupila
      pb.rect(Math.round(icx - 1), cy, 3, Math.max(2, Math.round(iy * 0.9)), ink);
      // brillos
      pb.rect(Math.round(icx - ir * 0.7), Math.max(cy - Math.round(iy * 0.6), cy - hh * wide + topCut + 1), 2, 2, '#ffffff');
      pb.set(Math.round(icx + ir * 0.5), cy + Math.round(iy * 0.7), '#ffffff');
      // párpado superior grueso + pestaña exterior
      for (let x = -hw - 1; x <= hw + 1; x++) {
        const yv = -Math.sqrt(Math.max(0, 1 - (x * x) / ((hw + 1) * (hw + 1)))) * hh * wide + topCut;
        pb.set(cx + x, Math.round(cy + yv) - 1, lid); pb.set(cx + x, Math.round(cy + yv), lid);
      }
      if (!o.far) { pb.set(cx + hw + 2, cy - hh * wide + topCut + 1, lid); pb.set(cx + hw + 3, cy - hh * wide + topCut, lid); }
      else { pb.set(cx + hw + 1, cy - hh * wide + topCut + 1, lid); }
      // párpado inferior
      for (let x = -hw + 2; x <= hw - 1; x++) { const yv = Math.sqrt(Math.max(0, 1 - (x * x) / (hw * hw))) * hh * wide; pb.set(cx + x, Math.round(cy + yv) + 1, sk[2]); }
    };
    switch (kind) {
      case 'happy': {
        for (let x = -hw; x <= hw; x++) { const yv = -Math.sqrt(Math.max(0, 1 - (x * x) / (hw * hw))) * hh * 0.6; pb.set(cx + x, Math.round(cy + yv + 2), lid); pb.set(cx + x, Math.round(cy + yv + 3), lid); }
        pb.set(cx + hw + 1, cy + 1, lid); pb.set(cx - hw - 1, cy + 2, lid);
        break;
      }
      case 'closed': for (let x = -hw; x <= hw; x++) { const yv = Math.sqrt(Math.max(0, 1 - (x * x) / (hw * hw))) * 2; pb.set(cx + x, Math.round(cy + yv + 1), lid); pb.set(cx + x, Math.round(cy + yv + 2), lid); } pb.set(cx + hw + 1, cy + 1, lid); break;
      case 'half': drawOpen(Math.round(hh * 0.85)); break;
      case 'down': drawOpen(Math.round(hh * 0.95)); break;
      case 'wide': drawOpen(0, 1.12); break;
      case 'angry': {
        drawOpen(Math.round(hh * 0.55));
        // párpado inclinado hacia el lagrimal
        for (let x = -hw; x <= hw; x++) { const inner = o.far ? -1 : 1; const yy = Math.round(cy - hh * 0.4 + (x * inner) / hw * 2.5); pb.set(cx + x, yy, lid); pb.set(cx + x, yy - 1, lid); for (let k = 2; k < 6; k++) pb.set(cx + x, yy - k, sk[3]); }
        break;
      }
      case 'sad': {
        drawOpen(Math.round(hh * 0.45));
        for (let x = -hw; x <= hw; x++) { const outer = o.far ? 1 : -1; const yy = Math.round(cy - hh * 0.45 + (x * outer) / hw * 2.5); pb.set(cx + x, yy, lid); for (let k = 1; k < 5; k++) pb.set(cx + x, yy - k, sk[3]); }
        pb.set(cx - 2, cy + hh - 1, '#a6f4ff');
        break;
      }
      default: drawOpen(0);
    }
  },
  brow(pb, cx, cy, w, kind, col, far) {
    cx = Math.round(cx); cy = Math.round(cy);
    const s = far ? -1 : 1; // interior hacia +x en ojo cercano
    let y0 = 0, y1 = 0, arch = 1.5;
    switch (kind) {
      case 'angry': case 'determined': y0 = -3; y1 = 2.5 * (kind === 'angry' ? 1.2 : 0.8); arch = 0.4; break;
      case 'worried': y0 = 1.5; y1 = -3; arch = 0.6; break;
      case 'raised': y0 = -3; y1 = -3; arch = 2.2; break;
      case 'up': y0 = -1; y1 = -1; arch = 2; break;
      case 'skeptical': y0 = far ? -3 : 0; y1 = far ? -3 : 0; arch = far ? 2.5 : 0.6; break;
    }
    for (let i = 0; i <= w; i++) {
      const t = i / w; // 0 exterior → 1 interior
      const x = cx + (far ? (w / 2 - i) : (i - w / 2));
      const y = cy + lerp(y0, y1, t) - Math.sin(t * Math.PI) * arch;
      const th = t < 0.2 ? 1 : 2;
      for (let k = 0; k < th + 1; k++) pb.set(Math.round(x), Math.round(y) + k, k === 0 ? shade(col, 0.15) : col);
    }
  },
  mouth(pb, cx, cy, w, kind, o) {
    cx = Math.round(cx); cy = Math.round(cy);
    const ink = o.ink || '#3a1218', lip = o.lip || '#a8505a', tongue = '#e2606a', teeth = '#fffaf0';
    const hw = Math.round(w / 2);
    switch (kind) {
      case 'smile':
        for (let x = -hw; x <= hw; x++) { const y = Math.round(-Math.cos((x / hw) * Math.PI / 2) * 2.4); pb.set(cx + x, cy - y, ink); }
        pb.set(cx + hw + 1, cy - 2, ink); pb.set(cx - hw - 1, cy - 1, ink); pb.hline(cx - hw + 2, cx + hw - 2, cy + 3, lip);
        break;
      case 'grin': {
        for (let x = -hw - 1; x <= hw + 1; x++) { const d = Math.round(Math.cos((x / (hw + 1)) * Math.PI / 2) * 5); for (let y = 0; y <= d; y++) pb.set(cx + x, cy - 1 + y, y === 0 ? teeth : y > d - 2 ? tongue : ink); }
        pb.hline(cx - hw - 1, cx + hw + 1, cy - 2, ink); pb.set(cx + hw + 2, cy - 3, ink); pb.set(cx - hw - 2, cy - 3, ink);
        break;
      }
      case 'o': pb.ellipse(cx, cy + 1, 2.6, 3.4, ink); pb.ellipse(cx, cy + 2.5, 1.5, 1.3, tongue); break;
      case 'open': pb.ellipse(cx, cy + 1, hw * 0.7, 3.2, ink); pb.ellipse(cx, cy + 2.6, hw * 0.45, 1.3, tongue); pb.hline(cx - Math.round(hw * 0.5), cx + Math.round(hw * 0.5), cy - 1, teeth); break;
      case 'talkSmall': pb.ellipse(cx, cy + 0.5, hw * 0.55, 2.2, ink); pb.hline(cx - 1, cx + 1, cy + 2, tongue); break;
      case 'frown': for (let x = -hw; x <= hw; x++) { const y = Math.round(-Math.cos((x / hw) * Math.PI / 2) * 2); pb.set(cx + x, cy + 2 + y, ink); } break;
      case 'wavy': for (let x = -hw; x <= hw; x++) pb.set(cx + x, cy + Math.round(Math.sin(x * 0.9) * 1.2), ink); break;
      case 'smirk': for (let x = -hw; x <= hw; x++) pb.set(cx + x, cy - (x > hw * 0.3 ? Math.round((x - hw * 0.3) * 0.5) : 0), ink); pb.hline(cx - hw + 2, cx + hw - 3, cy + 3, lip); break;
      case 'flat': pb.hline(cx - hw + 1, cx + hw - 1, cy, ink); pb.hline(cx - hw + 3, cx + hw - 3, cy + 3, lip); break;
      default: pb.hline(cx - hw + 1, cx + hw - 1, cy, ink); pb.set(cx + hw, cy - 1, ink); pb.hline(cx - hw + 3, cx + hw - 3, cy + 3, lip);
    }
  },
};

/* ---------- Constructor de retrato humanoide ---------- */
function buildPortraitHumanoid(D, exprName, talk, blink) {
  const R = new Rig(128, 128);
  const E = PEXPR[exprName] || PEXPR.neutral;
  const HX = 60 + (D.dx || 0), HY = 60 + (D.dy || 0);
  const rx = D.headRX || 27.5, ry = D.headRY || 31;
  const skin = D.skin, hair = D.hair;
  const o = { HX, HY, rx, ry, R, D, E };
  // torso / ropa
  D.outfit(R, o);
  // cuello
  R.capsule(HX - 3, HY + 20, HX - 5, HY + 38, 8, 9, { ramp: skin, base: 3, z: 20, group: 'neck', bevel: 6, cast: null });
  R.stamp(pb => { for (let x = HX - 14; x < HX + 8; x++) for (let y = HY + 27; y < HY + 31; y++) { const c = pb.get(x, y); if (c === U(skin[3]) && bayer4(x, y) < 0.5) pb.set(x, y, skin[2]); } }, 60);
  // cabeza
  R.ellipse(HX, HY, rx, ry, { ramp: skin, base: 4, z: 30, group: 'face', bevel: rx * 0.72 }, 0.05);
  R.ellipse(HX + 7, HY + 15, rx * 0.72, ry * 0.52, { ramp: skin, base: 4, z: 31, group: 'face', bevel: 10 }, -0.2);
  // oreja
  R.ellipse(HX - rx * 0.62, HY + 6, 4.5, 7.5, { ramp: skin, base: 3, z: 32, group: 'ear', bevel: 3.5 });
  R.stamp(pb => { const ex = Math.round(HX - rx * 0.62), ey = Math.round(HY + 6); pb.line(ex - 1, ey - 4, ex + 1, ey + 3, skin[2]); pb.line(ex + 1, ey - 3, ex + 2, ey + 1, skin[2]); }, 50);
  // pelo trasero
  if (D.hairBack) D.hairBack(R, o);
  // pelo frontal (proyecta sombra sobre la cara)
  if (D.hairFront) D.hairFront(R, o);
  if (D.accessory) D.accessory(R, o);
  // rasgos
  R.stamp(pb => {
    const eyeY = HY + (D.eyeY ?? 4);
    const e1 = HX - 4 + (D.eyeDX || 0), e2 = HX + 16 + (D.eyeDX || 0);
    const eo = { iris: D.iris, skin, look: E.look || 0.2, lid: D.lid };
    const ek = blink ? 'closed' : E.eye;
    PF.eye(pb, e1, eyeY, D.eyeW || 11, D.eyeH || 12, ek, eo);
    PF.eye(pb, e2, eyeY, (D.eyeW || 11) - 3, (D.eyeH || 12) - 1, ek, Object.assign({}, eo, { far: true }));
    const bc = D.browCol || hair[1];
    PF.brow(pb, e1, eyeY - 11, 11, E.brow, bc, false);
    PF.brow(pb, e2 + 1, eyeY - 11, 8, E.brow, bc, true);
    // nariz
    const nx = HX + 23, ny = HY + 15;
    pb.line(nx - 3, eyeY + 4, nx - 1, ny - 2, skin[3]); pb.set(nx, ny - 1, skin[2]); pb.set(nx - 1, ny, skin[1]); pb.set(nx - 3, ny + 1, skin[2]); pb.set(nx + 1, ny - 3, skin[5]);
    // boca
    let mk = E.mouth;
    if (talk) mk = (E.mouth === 'smile' || E.mouth === 'grin') ? 'open' : (E.mouth === 'o' ? 'o' : 'talkSmall');
    PF.mouth(pb, HX + 12 + (D.mouthDX || 0), HY + 24 + (D.mouthDY || 0), D.mouthW || 11, mk, { lip: D.lip || skin[2] });
    if (E.blush || D.alwaysBlush) { const bcol = D.blush || '#e8806a'; pb.dither(e1 - 6, eyeY + 8, 9, 3, null, bcol, 0.5); pb.dither(e2 + 1, eyeY + 8, 6, 3, null, bcol, 0.5); }
    if (E.tear) { pb.set(e1 - 2, eyeY + 7, '#a6f4ff'); pb.set(e1 - 2, eyeY + 8, '#56e5ff'); pb.set(e1 - 3, eyeY + 9, '#a6f4ff'); }
    if (D.freckles) for (const [fx, fy] of [[-8, 9], [-5, 11], [-2, 9], [19, 10], [22, 12], [-6, 13]]) pb.set(HX + fx, eyeY + fy, skin[2]);
    if (D.faceDetail) D.faceDetail(pb, Object.assign({}, o, { e1, e2, eyeY, mk }));
  }, 200);
  const pb = R.render();
  return pb;
}

/* ---------- Definiciones de retrato ---------- */
const PORTRAIT_DEFS = {};
PORTRAIT_DEFS.amaya = {
  skin: RAMP.skinA, hair: RAMP.hairA, iris: ['#2a1420', '#5a3020', '#8a5030', '#c08048'], blush: '#e86a5a', lip: '#9a4a40',
  outfit(R, o) {
    const { HX, HY } = o;
    R.poly([[4, 128], [10, 108], [34, 96], [86, 94], [112, 104], [124, 128]], { ramp: MAT.amayaJacket, base: 3, z: 10, group: 'jacket', bevel: 12 });
    R.poly([[46, 128], [52, 98], [70, 98], [78, 128]], { ramp: MAT.amayaShirt, base: 4, z: 11, group: 'shirt', bevel: 5 });
    R.poly([[40, 100], [56, 96], [58, 120], [44, 128]], { ramp: MAT.amayaJacket, base: 4, z: 12, group: 'lapelL', bevel: 3 });
    R.poly([[70, 96], [86, 98], [82, 128], [72, 120]], { ramp: MAT.amayaJacket, base: 4, z: 12, group: 'lapelR', bevel: 3 });
    R.stamp(pb => {
      for (let y = 104; y < 128; y += 4) pb.set(62, y, '#d0fff2');
      // insignia SYNARA
      pb.ellipse(30, 114, 4, 4, '#0e5a5e'); pb.poly([[30, 108], [34, 115], [26, 115]], '#20d6c7'); pb.ellipse(30, 115, 3, 3, '#20d6c7'); pb.set(29, 113, '#d0fff2');
      pb.line(14, 112, 24, 104, MAT.amayaJacket[2]); pb.line(98, 104, 108, 114, MAT.amayaJacket[2]);
    }, 60);
  },
  hairBack(R, o) {
    const { HX, HY } = o;
    const curls = [[-14, -36, 12], [0, -40, 12], [14, -36, 10], [-26, -26, 10], [24, -26, 8], [-8, -28, 11], [8, -30, 10], [-30, -12, 9], [-20, -48, 9], [-4, -52, 9], [12, -48, 8], [-32, -36, 7], [26, -40, 7]];
    curls.forEach(([dx, dy, r], i) => R.circle(HX + dx - 4, HY + dy - 4, r, { ramp: RAMP.hairA, base: 3, z: 5 + (dy + 60) * 0.001, group: 'curl' + i, bevel: r * 0.95, shiny: true, lineIdx: 1 }));
    R.ellipse(HX - 6, HY - 26, 9, 4, { ramp: MAT.amayaJacket, base: 4, z: 34, group: 'scrunch', bevel: 3 }, -0.3);
  },
  hairFront(R, o) {
    const { HX, HY, rx } = o;
    const cap = SDF.sub(SDF.ellipse(HX - 3, HY - 10, rx + 2, 24), SDF.ellipse(HX + 13, HY + 12, 26, 26));
    R.custom(cap, [HX - rx - 6, HY - 40, HX + rx + 6, HY + 20], { ramp: RAMP.hairA, base: 3, z: 40, group: 'hair', bevel: 8, shiny: true, cast: { on: ['face', 'ear'], dx: 2, dy: 3 } });
    [[18, -20, 6], [8, -24, 6.5], [-2, -26, 6], [26, -12, 5], [-18, 2, 6.5], [-16, 14, 5.5], [-22, -12, 6]].forEach(([dx, dy, r], i) => R.circle(HX + dx, HY + dy, r, { ramp: RAMP.hairA, base: 3, z: 41 + i * 0.01, group: 'fc' + i, bevel: r, shiny: true, lineIdx: 1, cast: { on: ['face', 'ear'], dx: 1, dy: 3 } }));
    R.capsule(HX + 27, HY - 10, HX + 30, HY + 6, 3, 2.5, { ramp: RAMP.hairA, base: 4, z: 42, group: 'lock', bevel: 2.5, shiny: true });
  },
  accessory(R, o) {
    const { HX, HY } = o;
    R.capsule(HX - 26, HY - 12, HX + 22, HY - 26, 2.4, 2.4, { ramp: MAT.ink, base: 3, z: 45, group: 'strap', bevel: 2 });
    R.ellipse(HX + 6, HY - 26, 7, 6, { ramp: RAMP.metal, base: 4, z: 46, group: 'g1', bevel: 3, shiny: true });
    R.ellipse(HX + 20, HY - 24, 5.5, 5.5, { ramp: RAMP.metal, base: 4, z: 46.5, group: 'g2', bevel: 3, shiny: true });
    R.stamp(pb => {
      pb.ellipse(HX + 6, HY - 26, 4.5, 3.8, '#1491aa'); pb.ellipse(HX + 6, HY - 26.5, 3.5, 2.6, '#22bdd0'); pb.rect(HX + 3, HY - 29, 2, 2, '#e6fdff');
      pb.ellipse(HX + 20, HY - 24, 3.4, 3.4, '#1491aa'); pb.ellipse(HX + 20, HY - 24.5, 2.4, 2.2, '#22bdd0'); pb.set(HX + 18, HY - 26, '#e6fdff');
      // pendiente
      pb.ellipse(HX - 16, HY + 16, 2, 2, '#ffd84a'); pb.set(HX - 17, HY + 15, '#fff09a');
    }, 120);
  },
};
PORTRAIT_DEFS.naira = {
  skin: RAMP.skinN, hair: RAMP.hairN, iris: ['#100c18', '#2a2040', '#463a66', '#6a5a90'], blush: '#b05040', lip: '#7a3a2e', eyeH: 11,
  outfit(R, o) {
    R.poly([[4, 128], [12, 106], [36, 96], [86, 94], [112, 104], [124, 128]], { ramp: MAT.nairaShirt, base: 3, z: 10, group: 'shirt', bevel: 12 });
    R.poly([[4, 128], [12, 106], [36, 96], [50, 98], [54, 128]], { ramp: MAT.nairaVest, base: 3, z: 11, group: 'vest', bevel: 6, texture: (x, y, idx, ramp) => ((x + y) % 5 === 0 ? ramp[clamp(idx - 1, 1, 6)] : ((x - y + 128) % 5 === 0 && idx > 2 ? ramp[clamp(idx + 1, 1, 6)] : null)) });
    R.poly([[80, 96], [100, 100], [112, 128], [86, 128]], { ramp: MAT.nairaVest, base: 3, z: 11, group: 'vest2', bevel: 6, texture: (x, y, idx, ramp) => ((x + y) % 5 === 0 ? ramp[clamp(idx - 1, 1, 6)] : null) });
    R.capsule(30, 100, 96, 128, 2.6, 2.6, { ramp: MAT.leather, base: 4, z: 12, group: 'strap', bevel: 2 });
  },
  hairBack(R, o) {
    const { HX, HY } = o;
    R.ellipse(HX - 6, HY - 4, 30, 32, { ramp: RAMP.hairN, base: 3, z: 6, group: 'hairB', bevel: 10, shiny: true });
    // trenza al frente
    for (let i = 0; i < 9; i++) R.circle(HX - 18 + i * 1.6, HY + 22 + i * 7, 6.2 - i * 0.2, { ramp: RAMP.hairN, base: 3, z: 50 + i * 0.01, group: 'br' + (i % 2), bevel: 5, shiny: true, lineIdx: 1 });
    R.circle(HX - 4, HY + 88, 3, { ramp: RAMP.yellow, base: 4, z: 51, group: 'tie', bevel: 2 });
  },
  hairFront(R, o) {
    const { HX, HY, rx } = o;
    const cap = SDF.sub(SDF.ellipse(HX - 2, HY - 8, rx + 1, 24), SDF.ellipse(HX + 14, HY + 12, 26, 25));
    R.custom(cap, [HX - rx - 6, HY - 40, HX + rx + 6, HY + 20], { ramp: RAMP.hairN, base: 3, z: 40, group: 'hair', bevel: 7, shiny: true, cast: { on: ['face', 'ear'], dx: 2, dy: 3 } });
    R.capsule(HX + 22, HY - 14, HX + 28, HY + 10, 3.5, 2, { ramp: RAMP.hairN, base: 3, z: 41, group: 'lock', bevel: 3, shiny: true });
  },
  accessory(R, o) {
    const { HX, HY } = o;
    const straw = (x, y, idx, ramp) => ((y % 3 === 0 && (x + (y >> 1)) % 4 < 2) ? ramp[clamp(idx - 1, 1, 6)] : ((x * 2 + y) % 7 === 0 ? ramp[clamp(idx + 1, 1, 6)] : null));
    R.ellipse(HX - 2, HY - 34, 25, 14, { ramp: MAT.straw, base: 3, z: 60, group: 'crown', bevel: 10, texture: straw });
    R.ellipse(HX + 2, HY - 24, 54, 9, { ramp: MAT.straw, base: 4, z: 61, group: 'brim', bevel: 6, texture: straw, cast: { on: ['face', 'ear', 'hair'], dx: 3, dy: 6, k: 1 } }, -0.06);
    R.box(HX - 2, HY - 28, 24, 3.4, 1.5, { ramp: MAT.nairaVest, base: 4, z: 62, group: 'band', bevel: 2 });
    R.stamp(pb => {
      const fx = HX + 14, fy = HY - 32;
      for (let k = 0; k < 5; k++) { const a = k * TAU / 5; pb.ellipse(fx + Math.cos(a) * 4, fy + Math.sin(a) * 4, 3, 3, k % 2 ? '#ffe14d' : '#fff08a'); }
      pb.ellipse(fx, fy, 2.5, 2.5, '#ff8e34'); pb.set(fx - 1, fy - 1, '#ffbc6c');
      pb.ellipse(fx + 9, fy + 3, 4, 2, '#4ccb70'); pb.line(fx + 6, fy + 3, fx + 12, fy + 3, '#1f854c');
      pb.set(HX - 16, HY + 16, '#4ccb70'); pb.set(HX - 16, HY + 17, '#33a552');
    }, 130);
  },
};
PORTRAIT_DEFS.dante = {
  skin: RAMP.skinD, hair: RAMP.hairD, iris: ['#0c2414', '#1a4a2a', '#2a7040', '#4a9a5a'], freckles: true, lip: '#b06050', eyeH: 11,
  outfit(R, o) {
    R.poly([[4, 128], [12, 106], [36, 96], [86, 94], [112, 104], [124, 128]], { ramp: MAT.tshirtW, base: 3, z: 10, group: 'tee', bevel: 12 });
    R.poly([[26, 128], [30, 112], [96, 112], [100, 128]], { ramp: MAT.danteOver, base: 3, z: 11, group: 'over', bevel: 6 });
    R.capsule(32, 98, 34, 116, 4, 4, { ramp: MAT.danteOver, base: 3, z: 12, group: 'su1', bevel: 3 });
    R.capsule(90, 98, 92, 116, 4, 4, { ramp: MAT.danteOver, base: 4, z: 12, group: 'su2', bevel: 3 });
    R.ellipse(62, 98, 26, 7, { ramp: MAT.bandana, base: 3, z: 13, group: 'scarf', bevel: 4 });
    R.poly([[60, 100], [76, 100], [66, 116]], { ramp: MAT.bandana, base: 4, z: 14, group: 'scarf2', bevel: 3 });
    R.stamp(pb => { pb.ellipse(33, 116, 2.5, 2.5, '#ffe14d'); pb.ellipse(91, 116, 2.5, 2.5, '#ffe14d'); for (let x = 30; x < 98; x++) { pb.set(x, 122, MAT.safety[4]); pb.set(x, 123, MAT.safety[3]); } }, 60);
  },
  hairBack(R, o) { const { HX, HY } = o; [[-30, -10, -44, -2, 5], [-30, 0, -42, 10, 4.5], [-24, 10, -32, 22, 4], [-8, -28, -20, -40, 4], [22, -12, 32, -4, 3.5]].forEach(([ax, ay, bx, by, w], i) => R.poly([[HX + ax - w, HY + ay], [HX + ax + w, HY + ay + 2], [HX + bx, HY + by]], { ramp: RAMP.hairD, base: 3, z: 7 + i * 0.01, group: 'sp' + i, bevel: 3, shiny: true, lineIdx: 1 })); },
  hairFront(R, o) {
    const { HX, HY, rx } = o;
    const cap = SDF.sub(SDF.ellipse(HX - 3, HY - 6, rx + 1, 22), SDF.ellipse(HX + 14, HY + 12, 26, 26));
    R.custom(cap, [HX - rx - 6, HY - 40, HX + rx + 6, HY + 20], { ramp: RAMP.hairD, base: 3, z: 40, group: 'hair', bevel: 6, shiny: true, cast: { on: ['face', 'ear'], dx: 2, dy: 3 } });
    [[24, -16, 30, -2, 3], [16, -18, 20, -6, 3], [6, -20, 8, -8, 3]].forEach(([ax, ay, bx, by, w], i) => R.poly([[HX + ax - w, HY + ay], [HX + ax + w, HY + ay], [HX + bx, HY + by]], { ramp: RAMP.hairD, base: 4, z: 41 + i * 0.01, group: 'bang' + i, bevel: 2, shiny: true, lineIdx: 1, cast: { on: ['face'], dx: 1, dy: 2 } }));
  },
  accessory(R, o) {
    const { HX, HY } = o;
    R.custom(SDF.sub(SDF.ellipse(HX - 2, HY - 20, 31, 24), SDF.box(HX, HY + 6, 50, 14, 0)), [HX - 36, HY - 46, HX + 36, HY - 6], { ramp: MAT.hardhat, base: 3, z: 60, group: 'hat', bevel: 14, shiny: true });
    R.box(HX + 6, HY - 9, 38, 3.4, 2, { ramp: MAT.hardhat, base: 3, z: 61, group: 'brim', bevel: 2, cast: { on: ['face', 'ear', 'hair'], dx: 2, dy: 5 } });
    R.stamp(pb => { pb.vline(HX - 6, HY - 42, HY - 13, MAT.hardhat[5]); pb.vline(HX - 5, HY - 42, HY - 13, MAT.hardhat[4]); pb.rect(HX + 10, HY - 30, 9, 8, '#2a4caa'); pb.rect(HX + 12, HY - 28, 5, 4, '#6a90e4'); pb.set(HX + 13, HY - 27, '#fff'); }, 130);
  },
};
PORTRAIT_DEFS.eliana = {
  skin: RAMP.skinE, hair: RAMP.hairE, iris: ['#1a100a', '#3a2214', '#5a3820', '#7a5030'], lip: '#9a5a48', browCol: '#6a6c8c', eyeH: 10,
  outfit(R, o) {
    R.poly([[4, 128], [12, 104], [36, 94], [86, 92], [112, 102], [124, 128]], { ramp: MAT.labcoat, base: 3, z: 10, group: 'coat', bevel: 12 });
    R.poly([[44, 128], [48, 96], [76, 96], [80, 128]], { ramp: MAT.violetTop, base: 3, z: 11, group: 'turtle', bevel: 6 });
    R.ellipse(62, 96, 16, 6, { ramp: MAT.violetTop, base: 4, z: 12, group: 'collar', bevel: 4 });
    R.poly([[36, 96], [50, 94], [54, 128], [40, 128]], { ramp: MAT.labcoat, base: 4, z: 13, group: 'lap1', bevel: 3 });
    R.poly([[76, 94], [90, 96], [84, 128], [72, 128]], { ramp: MAT.labcoat, base: 4, z: 13, group: 'lap2', bevel: 3 });
    R.stamp(pb => { pb.line(54, 100, 60, 124, '#56e5ff'); pb.rect(56, 118, 9, 10, '#f4fdff'); pb.hline(57, 63, 121, '#2c63c0'); pb.vline(22, 108, 116, '#ffe14d'); pb.vline(25, 106, 116, '#ff6b6b'); pb.hline(18, 30, 116, MAT.labcoat[2]); }, 60);
  },
  hairBack(R, o) { const { HX, HY } = o; R.circle(HX - 20, HY - 30, 13, { ramp: RAMP.hairE, base: 3, z: 6, group: 'bun', bevel: 11, shiny: true }); R.stamp(pb => { pb.line(HX - 40, HY - 46, HX - 6, HY - 20, '#ffd84a'); pb.line(HX - 40, HY - 45, HX - 6, HY - 19, '#eab02a'); pb.rect(HX - 42, HY - 48, 3, 3, '#ff6b6b'); pb.line(HX - 28, HY - 36, HX - 12, HY - 26, RAMP.hairE[1]); }, 20); },
  hairFront(R, o) {
    const { HX, HY, rx } = o;
    const cap = SDF.sub(SDF.ellipse(HX - 3, HY - 8, rx + 1.5, 23), SDF.ellipse(HX + 15, HY + 13, 26, 26));
    R.custom(cap, [HX - rx - 6, HY - 40, HX + rx + 6, HY + 20], { ramp: RAMP.hairE, base: 3, z: 40, group: 'hair', bevel: 7, shiny: true, cast: { on: ['face', 'ear'], dx: 2, dy: 3 }, texture: (x, y, idx, ramp) => ((x * 2 + y * 3) % 11 === 0 ? ramp[clamp(idx - 1, 1, 5)] : null) });
    R.capsule(HX + 22, HY - 14, HX + 26, HY + 4, 3, 2, { ramp: RAMP.hairE, base: 3, z: 41, group: 'lock', bevel: 2.5, shiny: true });
    R.stamp(pb => { pb.line(HX - 10, HY - 30, HX + 12, HY - 24, RAMP.hairE[1]); pb.line(HX - 10, HY - 29, HX + 12, HY - 23, RAMP.hairE[2]); }, 45);
  },
  faceDetail(pb, o) {
    const col = '#8a5e14', hi = '#ffd84a';
    for (const [ex, w] of [[o.e1, 9], [o.e2, 7]]) {
      for (let a = 0; a < 48; a++) { const an = a / 48 * TAU; pb.set(Math.round(ex + Math.cos(an) * w), Math.round(o.eyeY + Math.sin(an) * (w - 1)), a < 10 ? hi : col); }
      pb.set(ex + w - 3, o.eyeY - w + 3, '#e6fdff'); pb.set(ex + w - 4, o.eyeY - w + 4, '#e6fdff');
    }
    pb.hline(o.e1 + 9, o.e2 - 7, o.eyeY - 2, col);
    pb.line(o.e1 - 9, o.eyeY - 1, o.e1 - 16, o.eyeY - 3, col);
    pb.set(o.e1 - 6, o.eyeY + 9, o.D.skin[2]); pb.set(o.e2 + 6, o.eyeY + 8, o.D.skin[2]);
  },
};

/* NPC con retratos genéricos parametrizados */
function npcPortrait(cfg) {
  return {
    skin: RAMP[cfg.skin], hair: cfg.hair, iris: cfg.iris || ['#100808', '#2a1a14', '#4a3020', '#6a4a30'], lip: cfg.lip, browCol: cfg.brow, eyeH: cfg.eyeH || 11, eyeW: cfg.eyeW, freckles: cfg.freckles, blush: cfg.blush, alwaysBlush: cfg.child,
    headRX: cfg.child ? 28.5 : 27.5, headRY: cfg.child ? 29 : 31,
    outfit(R, o) {
      R.poly([[4, 128], [12, 106], [36, 96], [86, 94], [112, 104], [124, 128]], { ramp: cfg.top, base: 3, z: 10, group: 'top', bevel: 12 });
      if (cfg.apron) R.poly([[38, 128], [42, 104], [82, 104], [86, 128]], { ramp: cfg.apron, base: 3, z: 11, group: 'apron', bevel: 6 });
      if (cfg.scarf) { R.ellipse(62, 98, 28, 8, { ramp: cfg.scarf, base: 3, z: 12, group: 'scarf', bevel: 5 }); R.poly([[54, 100], [70, 100], [60, 124]], { ramp: cfg.scarf, base: 4, z: 13, group: 'scarf2', bevel: 3 }); }
      if (cfg.collar) R.poly([[40, 96], [58, 96], [52, 112]], { ramp: cfg.collar, base: 4, z: 12, group: 'col', bevel: 3 }), R.poly([[66, 96], [84, 96], [74, 112]], { ramp: cfg.collar, base: 4, z: 12, group: 'col2', bevel: 3 });
    },
    hairBack(R, o) {
      const { HX, HY } = o;
      if (cfg.style === 'bun') R.circle(HX - 18, HY - 30, 12, { ramp: cfg.hair, base: 3, z: 6, group: 'bun', bevel: 10, shiny: true });
      if (cfg.style === 'long' || cfg.style === 'braid') R.ellipse(HX - 8, HY + 4, 28, 38, { ramp: cfg.hair, base: 3, z: 6, group: 'long', bevel: 10, shiny: true });
      if (cfg.style === 'braid') for (let i = 0; i < 7; i++) R.circle(HX - 22 + i, HY + 30 + i * 7, 5.5 - i * 0.2, { ramp: cfg.hair, base: 3, z: 50 + i * 0.01, group: 'b' + (i % 2), bevel: 4, shiny: true, lineIdx: 1 });
      if (cfg.style === 'curly' || cfg.child) [[-24, -24, 11], [-6, -34, 11], [12, -32, 9], [-30, -6, 9]].forEach(([dx, dy, r], i) => R.circle(HX + dx, HY + dy, r, { ramp: cfg.hair, base: 3, z: 6 + i * 0.01, group: 'c' + i, bevel: r, shiny: true, lineIdx: 1 }));
      if (cfg.child && cfg.pigtails) { R.circle(HX - 34, HY - 2, 10, { ramp: cfg.hair, base: 3, z: 5, group: 'pt1', bevel: 8, shiny: true }); R.circle(HX - 30, HY + 18, 9, { ramp: cfg.hair, base: 3, z: 5, group: 'pt2', bevel: 7, shiny: true }); }
    },
    hairFront(R, o) {
      const { HX, HY, rx } = o;
      if (cfg.style === 'bald') { R.ellipse(HX - 18, HY + 2, 8, 14, { ramp: cfg.hair, base: 3, z: 40, group: 'side', bevel: 5, shiny: true }); return; }
      const cap = SDF.sub(SDF.ellipse(HX - 3, HY - 8, rx + 1.5, cfg.style === 'short' ? 21 : 24), SDF.ellipse(HX + 14, HY + 12, 26, 26));
      R.custom(cap, [HX - rx - 6, HY - 40, HX + rx + 6, HY + 20], { ramp: cfg.hair, base: 3, z: 40, group: 'hair', bevel: 7, shiny: true, cast: { on: ['face', 'ear'], dx: 2, dy: 3 } });
    },
    accessory(R, o) {
      const { HX, HY } = o;
      if (cfg.hat === 'bucket') {
        R.ellipse(HX - 2, HY - 32, 25, 14, { ramp: cfg.hatCol, base: 3, z: 60, group: 'crown', bevel: 9 });
        R.ellipse(HX + 2, HY - 22, 36, 8, { ramp: cfg.hatCol, base: 2, z: 61, group: 'brim', bevel: 5, cast: { on: ['face', 'ear', 'hair'], dx: 2, dy: 5 } }, -0.08);
      }
      if (cfg.hat === 'cap') {
        R.custom(SDF.sub(SDF.ellipse(HX - 2, HY - 18, 29, 20), SDF.box(HX, HY + 6, 50, 15, 0)), [HX - 34, HY - 42, HX + 34, HY - 8], { ramp: cfg.hatCol, base: 3, z: 60, group: 'cap', bevel: 10 });
        R.box(HX + 26, HY - 10, 16, 3, 2, { ramp: cfg.hatCol, base: 2, z: 61, group: 'visor', bevel: 2, cast: { on: ['face'], dx: 1, dy: 4 } });
      }
      if (cfg.hat === 'aviator') {
        R.custom(SDF.sub(SDF.ellipse(HX - 3, HY - 10, 30, 30), SDF.ellipse(HX + 14, HY + 12, 26, 26)), [HX - 36, HY - 44, HX + 36, HY + 24], { ramp: MAT.leather, base: 3, z: 60, group: 'av', bevel: 9 });
        R.ellipse(HX + 4, HY - 28, 7, 5.5, { ramp: RAMP.metal, base: 5, z: 62, group: 'g1', bevel: 3, shiny: true }); R.ellipse(HX + 18, HY - 27, 5, 5, { ramp: RAMP.metal, base: 5, z: 62, group: 'g2', bevel: 3, shiny: true });
      }
      if (cfg.flowers) R.stamp(pb => { [[-14, -30, '#f78acb'], [-2, -36, '#ffe14d'], [10, -34, '#56e5ff'], [20, -28, '#86e36f']].forEach(([dx, dy, c]) => { pb.ellipse(HX + dx, HY + dy, 3, 3, c); pb.set(HX + dx, HY + dy, '#fffaf0'); }); }, 130);
      if (cfg.goggles) { R.capsule(HX - 24, HY - 14, HX + 22, HY - 24, 2, 2, { ramp: MAT.leather, base: 3, z: 61, group: 'gstrap', bevel: 2 }); R.ellipse(HX + 6, HY - 26, 6, 5, { ramp: RAMP.copper, base: 4, z: 62, group: 'gg', bevel: 3, shiny: true }); R.ellipse(HX + 19, HY - 25, 5, 5, { ramp: RAMP.copper, base: 4, z: 62, group: 'gg2', bevel: 3, shiny: true }); }
    },
    faceDetail(pb, o) {
      if (cfg.mustache) { pb.ellipse(o.HX + 16, o.HY + 20, 9, 3, cfg.mustache); pb.ellipse(o.HX + 10, o.HY + 21, 5, 2.5, cfg.mustache); pb.hline(o.HX + 8, o.HX + 22, o.HY + 18, shade(cfg.mustache, 0.2)); }
      if (cfg.glasses) for (const [ex, w] of [[o.e1, 8], [o.e2, 6]]) { pb.rect(ex - w, o.eyeY - 6, w * 2, 1, cfg.glasses); pb.rect(ex - w, o.eyeY + 6, w * 2, 1, cfg.glasses); pb.vline(ex - w, o.eyeY - 6, o.eyeY + 6, cfg.glasses); pb.vline(ex + w, o.eyeY - 6, o.eyeY + 6, cfg.glasses); }
      if (cfg.wrinkles) { pb.line(o.e1 - 9, o.eyeY + 2, o.e1 - 12, o.eyeY + 4, o.D.skin[2]); pb.line(o.HX + 2, o.HY + 22, o.HX + 0, o.HY + 28, o.D.skin[2]); pb.line(o.HX + 26, o.HY + 20, o.HX + 27, o.HY + 26, o.D.skin[2]); }
    },
  };
}
PORTRAIT_DEFS.marea = npcPortrait({ skin: 'skinM', hair: RAMP.hairE, style: 'braid', top: MAT.danteOver, hat: 'bucket', hatCol: MAT.kiruBody, wrinkles: true, collar: MAT.tshirtW });
PORTRAIT_DEFS.cobre = npcPortrait({ skin: 'skinE', hair: RAMP.hairE, style: 'bald', top: MAT.tshirtW, apron: RAMP.copper, mustache: '#cdcfe2', goggles: true, wrinkles: true, brow: '#a8aac6' });
PORTRAIT_DEFS.alma = npcPortrait({ skin: 'skinA', hair: RAMP.hairA, style: 'curly', child: true, pigtails: true, top: MAT.nairaShirt, flowers: true, eyeH: 13, eyeW: 12, blush: '#ff8a7a' });
PORTRAIT_DEFS.nimbo = npcPortrait({ skin: 'skinD', hair: RAMP.hairE, style: 'short', top: NPC_CLOTH[5], hat: 'aviator', mustache: '#a8aac6', scarf: RAMP.coral, wrinkles: true });
PORTRAIT_DEFS.consejal = npcPortrait({ skin: 'skinN', hair: RAMP.hairN, style: 'bun', top: NPC_CLOTH[0], glasses: '#8a5e14', collar: NPC_CLOTH[2] });
PORTRAIT_DEFS.operador = npcPortrait({ skin: 'skinM', hair: RAMP.hairN, style: 'short', top: MAT.safety, hat: 'cap', hatCol: NPC_CLOTH[1] });
PORTRAIT_DEFS.pastora = npcPortrait({ skin: 'skinA', hair: RAMP.hairE, style: 'long', top: NPC_CLOTH[7], scarf: NPC_CLOTH[2], wrinkles: true });
PORTRAIT_DEFS.financia = npcPortrait({ skin: 'skinE', hair: RAMP.hairN, style: 'short', top: NPC_CLOTH[5], glasses: '#263442', collar: MAT.tshirtW });

/* ---------- Retratos no humanoides ---------- */
function portraitKiru(expr, talk, blink) {
  const R = new Rig(128, 128);
  const mood = KIRU_EYES[expr] || (PEXPR[expr] ? ({ happy: 'happy', joy: 'happy', surprised: 'big', sad: 'down', worried: 'down', determined: 'brave', thinking: 'mixed', scared: 'big', tired: 'tired', guilty: 'down', smile: 'happy', calm: 'open' }[expr] || 'open') : 'open');
  const HX = 62, HY = 70;
  R.poly([[HX - 20, HY - 12], [HX - 44, HY - 66], [HX - 4, HY - 26]], { ramp: MAT.kiruPanel, base: 3, z: 5, group: 'earB', bevel: 4, dark: 1 });
  R.ellipse(HX, HY + 44, 34, 18, { ramp: MAT.kiruBody, base: 3, z: 6, group: 'body', bevel: 12 });
  R.ellipse(HX, HY, 42, 36, { ramp: MAT.kiruBody, base: 4, z: 10, group: 'head', bevel: 24 });
  R.poly([[HX + 2, HY - 24], [HX + 18, HY - 78], [HX + 40, HY - 14]], { ramp: MAT.kiruPanel, base: 4, z: 12, group: 'earF', bevel: 4 });
  R.ellipse(HX + 8, HY + 4, 30, 23, { ramp: MAT.ink, base: 2, z: 14, group: 'screen', bevel: 6, flat: true });
  R.ellipse(HX + 40, HY + 16, 10, 8, { ramp: MAT.kiruOrange, base: 4, z: 15, group: 'nose', bevel: 6 });
  R.ellipse(HX + 4, HY + 48, 18, 7, { ramp: MAT.kiruOrange, base: 4, z: 8, group: 'belly', bevel: 4 });
  R.stamp(pb => {
    // celdas solares
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const x = HX + 12 + i * 5 + j * 1.5, y = HY - 52 + j * 9 + i * 1; pb.rect(Math.round(x), Math.round(y), 4, 7, '#2a5cc4'); pb.set(Math.round(x), Math.round(y), '#9cc8ff'); }
    pb.ellipse(HX + 18, HY - 76, 3, 3, '#ff8e34');
    const c1 = '#56e5ff', c2 = '#e6fdff', c3 = '#106884';
    const lx = HX - 6, rx = HX + 18, yy = HY - 2;
    const eye = (x) => {
      if (blink) { pb.rect(x - 5, yy + 4, 10, 2, c1); return; }
      switch (mood) {
        case 'happy': for (let k = -5; k <= 5; k++) { const y = Math.round(yy + 4 - Math.sqrt(25 - k * k) * 0.8); pb.rect(x + k, y, 1, 2, c1); } break;
        case 'big': pb.ellipse(x, yy + 2, 7, 9, c1); pb.ellipse(x, yy + 2, 4, 6, c3); pb.rect(x - 4, yy - 4, 3, 3, c2); break;
        case 'down': pb.rect(x - 5, yy + 2, 10, 6, c1); pb.rect(x - 5, yy + 2, 10, 2, c3); pb.line(x - 6, yy - 2, x + 5, yy, c1); break;
        case 'brave': pb.rect(x - 5, yy, 10, 9, c1); pb.line(x - 6, yy - 1, x + 5, yy + 2, '#0a0816'); pb.line(x - 6, yy, x + 5, yy + 3, '#0a0816'); pb.rect(x - 3, yy + 3, 2, 2, c2); break;
        case 'tired': pb.rect(x - 5, yy + 5, 10, 2, c1); pb.rect(x - 4, yy + 7, 8, 1, c3); break;
        case 'mixed': if (x === lx) { pb.ellipse(x, yy + 2, 5, 7, c1); pb.rect(x - 2, yy - 2, 2, 2, c2); } else { pb.rect(x - 4, yy + 3, 8, 2, c1); pb.rect(x + 6, yy - 6, 2, 4, '#ffe14d'); pb.set(x + 7, yy - 1, '#ffe14d'); } break;
        case 'star': for (let k = -5; k <= 5; k++) { pb.set(x + k, yy + 2, '#ffe14d'); pb.set(x, yy + 2 + k, '#ffe14d'); } pb.rect(x - 1, yy + 1, 3, 3, c2); break;
        default: pb.ellipse(x, yy + 2, 5, 7.5, c1); pb.rect(x - 3, yy - 3, 3, 3, c2); pb.rect(x + 1, yy + 6, 2, 2, c3);
      }
    };
    eye(lx); eye(rx);
    if (talk) { pb.rect(HX + 2, HY + 16, 10, 3, c1); pb.rect(HX + 4, HY + 19, 6, 1, c3); }
    else if (mood === 'happy') { pb.set(HX + 2, HY + 15, c1); pb.hline(HX + 3, HX + 9, HY + 16, c1); pb.set(HX + 10, HY + 15, c1); }
    // ventanilla del compartimento
    pb.rect(HX - 2, HY + 46, 10, 5, '#2a1a10'); pb.rect(HX, HY + 47, 3, 2, '#56e5ff');
    // scanline de pantalla
    for (let y = HY - 16; y < HY + 24; y += 3) for (let x = HX - 18; x < HX + 34; x++) if (pb.get(x, y) === U(MAT.ink[2])) pb.set(x, y, '#191230');
  }, 100);
  return R.render();
}
function portraitLimen(expr, talk, blink) {
  const R = new Rig(128, 128);
  const L = RAMP.limen, cx = 64, cy = 66;
  const facet = (pts, base, z, gname) => R.poly(pts, { ramp: L, base, z, group: gname, flat: true, lineCol: '#0e2b4a' });
  facet([[cx, cy - 58], [cx + 30, cy - 10], [cx, cy + 2]], 3, 10, 'a'); facet([[cx, cy - 58], [cx - 30, cy - 10], [cx, cy + 2]], 5, 10.1, 'b');
  facet([[cx - 30, cy - 10], [cx, cy + 2], [cx, cy + 40]], 4, 10.2, 'c'); facet([[cx + 30, cy - 10], [cx, cy + 2], [cx, cy + 40]], 1, 10.3, 'd');
  for (const s of [-1, 1]) { facet([[cx + s * 30, cy + 20], [cx + s * 56, cy + 46], [cx + s * 36, cy + 70], [cx + s * 16, cy + 52]], s < 0 ? 5 : 2, 5, 'sh' + s); facet([[cx + s * 16, cy + 52], [cx + s * 36, cy + 70], [cx + s * 10, cy + 70]], s < 0 ? 4 : 1, 5.1, 'sh2' + s); }
  const mood = expr === 'alert' || expr === 'angry' ? 'alert' : expr === 'worried' || expr === 'warn' ? 'warn' : 'calm';
  const coreR = mood === 'alert' ? RAMP.coral : mood === 'warn' ? RAMP.yellow : RAMP.cyan;
  R.circle(cx, cy - 12, 13, { ramp: MAT.ink, base: 2, z: 20, group: 'ring', flat: true });
  R.circle(cx, cy - 12, 10, { ramp: coreR, base: 5, z: 21, group: 'core', bevel: 9, shiny: true });
  R.stamp(pb => {
    if (blink) pb.rect(cx - 7, cy - 13, 14, 2, '#0e2b4a');
    else { pb.rect(cx - 1, cy - 19, 3, 14, '#0e2b4a'); if (talk) pb.rect(cx - 3, cy - 15, 7, 6, '#0e2b4a'); }
    pb.rect(cx - 6, cy - 18, 3, 3, '#ffffff');
    pb.line(cx - 26, cy - 12, cx - 4, cy - 52, '#ffffff'); pb.line(cx + 4, cy + 30, cx + 20, cy + 6, '#c4fbff');
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + 0.4; const x = Math.round(cx + Math.cos(a) * 50), y = Math.round(cy - 10 + Math.sin(a) * 26); pb.rect(x, y, 2, 3, '#56e5ff'); pb.set(x, y, '#e6fdff'); }
  }, 100);
  return R.render({ outlineColor: '#0b2238' });
}
function portraitTwin(expr, talk, blink, mosaic) {
  const R = new Rig(128, 128);
  const cx = 64, cy = 58;
  const tex = mosaic ? (x, y, idx) => { if (x % 6 === 0 || y % 6 === 0) return '#0e1a2a'; const c = MOSAIC_LAYERS[Math.floor(hash2(x / 6 | 0, y / 6 | 0, 11) * 7)]; return idx <= 2 ? shade(c, -0.25) : idx >= 5 ? shade(c, 0.15) : c; }
    : (x, y, idx) => { const cols = ['#a830b8', '#e050c8', '#ff8ad0', '#56e5ff', '#ffd0e8', '#6a1c94']; const b = Math.floor((y * 0.5 + Math.sin(x * 0.12) * 5) / 4) % 6; let c = cols[b]; if (Math.abs(Math.sin(x * 0.2 + y * 0.08) + Math.sin(y * 0.15 - x * 0.04)) < 0.06) c = '#fff6ff'; return idx <= 1 ? shade(c, -0.35) : c; };
  R.poly([[4, 128], [20, 100], [44, 92], [84, 92], [108, 100], [124, 128]], { ramp: RAMP.mirage, base: 4, z: 5, group: 'body', bevel: 14, texture: tex });
  R.capsule(cx, cy + 24, cx, cy + 46, 9, 12, { ramp: RAMP.mirage, base: 4, z: 6, group: 'neck', bevel: 8, texture: tex });
  R.ellipse(cx, cy, 30, 38, { ramp: RAMP.mirage, base: 5, z: 10, group: 'head', bevel: 14, texture: mosaic ? tex : (x, y, idx) => {
    const k = (y - cy + 38) / 76; const sky = ['#ffd0e8', '#fff6ff', '#c4fbff', '#56e5ff', '#e050c8', '#6a1c94'];
    let c = sky[clamp(Math.floor(k * 6 + Math.sin(x * 0.2) * 0.5), 0, 5)];
    if (Math.abs((x - cx) + (y - cy) * 0.55 + 8) < 2.4) c = '#ffffff';
    if (Math.abs((x - cx) + (y - cy) * 0.55 + 16) < 1) c = '#fff6ff';
    return idx <= 2 ? shade(c, -0.3) : c;
  } });
  R.stamp(pb => {
    for (let i = 0; i < 17; i++) { const a = -Math.PI + i * Math.PI / 16; const x = Math.round(cx + Math.cos(a) * 42), y = Math.round(cy - 4 + Math.sin(a) * 46); pb.rect(x, y, 2, 2, mosaic ? MOSAIC_LAYERS[i % 7] : (i % 2 ? '#56e5ff' : '#ffd84a')); }
    if (mosaic) {
      if (blink) { pb.rect(cx - 14, cy, 8, 2, '#0e1a2a'); pb.rect(cx + 6, cy, 8, 2, '#0e1a2a'); }
      else { pb.ellipse(cx - 10, cy, 4, 5, '#0e1a2a'); pb.ellipse(cx + 10, cy, 4, 5, '#0e1a2a'); pb.rect(cx - 12, cy - 3, 2, 2, '#fff'); pb.rect(cx + 8, cy - 3, 2, 2, '#fff'); }
      if (talk) pb.ellipse(cx, cy + 18, 5, 3, '#0e1a2a'); else { pb.set(cx - 6, cy + 16, '#0e1a2a'); pb.hline(cx - 5, cx + 5, cy + 17, '#0e1a2a'); pb.set(cx + 6, cy + 16, '#0e1a2a'); }
    } else {
      // reflejo de un mapa perfecto (sin personas)
      for (let i = 0; i < 5; i++) pb.hline(cx - 14 + i * 2, cx + 10 - i, cy + 6 + i * 3, '#e050c8');
      if (talk) for (let i = 0; i < 3; i++) pb.hline(cx - 8, cx + 8, cy + 20 + i * 2, (Game.frame >> 2) % 2 ? '#56e5ff' : '#ffd84a');
    }
  }, 100);
  return R.render({ outlineColor: mosaic ? '#06100a' : '#1d0b3a' });
}
function portraitBeta(expr, talk) {
  const R = new Rig(128, 128);
  R.box(64, 84, 40, 42, 10, { ramp: RAMP.metal, base: 4, z: 5, group: 'body', bevel: 16 });
  R.box(64, 38, 16, 6, 3, { ramp: RAMP.metal, base: 5, z: 6, group: 'cap', bevel: 4, shiny: true });
  R.stamp(pb => {
    pb.rect(36, 56, 56, 34, '#0a1030');
    const soc = expr === 'sad' || expr === 'worried' ? 0.22 : 0.65;
    const col = soc < 0.25 ? '#ff4e5d' : '#86e36f';
    for (let i = 0; i < 10; i++) pb.rect(40 + i * 5, 82, 4, 4, i < soc * 10 ? col : '#1c2350');
    if (soc < 0.25) { pb.rect(48, 64, 5, 5, col); pb.rect(75, 64, 5, 5, col); pb.rect(54, 76, 20, 2, col); pb.rect(51, 78, 3, 2, col); pb.rect(74, 78, 3, 2, col); }
    else { pb.rect(48, 62, 5, 7, col); pb.rect(75, 62, 5, 7, col); pb.rect(54, 74, 20, 2, col); pb.rect(51, 72, 3, 2, col); pb.rect(74, 72, 3, 2, col); }
    if (talk) pb.rect(58, 76, 12, 3, col);
    for (let y = 96; y < 122; y += 5) pb.hline(28, 100, y, RAMP.metal[2]);
  }, 100);
  return R.render();
}

const Portraits = {
  cache: new Map(),
  get(id, expr = 'neutral', talk = 0, blink = false) {
    const k = id + '|' + expr + '|' + talk + '|' + (blink ? 1 : 0);
    let c = this.cache.get(k);
    if (c) return c;
    let pb;
    if (id === 'kiru') pb = portraitKiru(expr, talk, blink);
    else if (id === 'limen') pb = portraitLimen(expr, talk, blink);
    else if (id === 'mirage') pb = portraitTwin(expr, talk, blink, false);
    else if (id === 'mosaico') pb = portraitTwin(expr, talk, blink, true);
    else if (id === 'beta9') pb = portraitBeta(expr, talk);
    else pb = buildPortraitHumanoid(PORTRAIT_DEFS[id] || PORTRAIT_DEFS.amaya, expr, talk, blink);
    c = pb.toCanvas();
    this.cache.set(k, c);
    if (this.cache.size > 400) this.cache.delete(this.cache.keys().next().value);
    return c;
  },
  /** precalienta retratos frecuentes (llamar en carga de nivel) */
  warm(ids, exprs = ['neutral', 'smile']) { for (const id of ids) for (const e of exprs) { this.get(id, e, 0); this.get(id, e, 1); } },
};
