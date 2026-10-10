/* =====================================================================
   30_world.js — Mundo de plataformas: terreno por mapa de alturas,
   plataformas, escaleras, agua poco profunda, corrientes de viento,
   jugadora (coyote time, buffer de salto, control aéreo), KIRU,
   NPC, estaciones interactivas, coleccionables y adversarios conceptuales.
   ===================================================================== */

const PHYS = {
  g: 920, maxFall: 430, walk: 92, run: 158, accG: 1300, decG: 1700, accA: 860, jumpV: 335, coyote: 0.1, buffer: 0.13,
  stepH: 7, wadeMul: 0.6, climb: 74, glideFall: 46,
};

/* ---------- Materiales de terreno ---------- */
const TERRAIN_MATS = {
  sand: { ramp: RAMP.sand, top: ['#fff6d8', '#fde8a8'], deco: 'shells', base: 5 },
  beach: { ramp: RAMP.sand, top: ['#fff6d8', '#fde8a8'], deco: 'shells', base: 6, wet: true },
  rock: { ramp: RAMP.mesa, top: ['#ffe0b8', '#f7c08e'], deco: 'strata', base: 5 },
  salt: { ramp: RAMP.salt, top: ['#ffffff', '#fff2f8'], deco: 'crystals', base: 5 },
  soil: { ramp: RAMP.soil, top: ['#86e36f', '#4ccb70'], deco: 'roots', base: 4, grass: true },
  dune: { ramp: RAMP.dune, top: ['#fbdc86', '#f6c35c'], deco: 'ripples', base: 5 },
  metal: { ramp: RAMP.metal, top: ['#cfe8ee', '#98c6d2'], deco: 'plates', base: 4 },
  tile: { ramp: ['#3a2a4a', '#5a3e5e', '#8a5a6e', '#b87a7a', '#d8a08a', '#f0c8a8', '#fff0d8'], top: ['#fff0d8', '#f0c8a8'], deco: 'tiles', base: 4 },
  stone: { ramp: ['#4a2e2e', '#6a4440', '#8a5e50', '#a87a62', '#c69878', '#e2b890', '#f6d8b0'], top: ['#fbe8c8', '#f6d8b0'], deco: 'cobble', base: 5 },
  plaza: { ramp: ['#3a1e2a', '#5a2e32', '#7a4038', '#9a5640', '#b86e4a', '#d48a5a', '#ecb07a'], top: ['#fff4e0', '#f6dcb8'], deco: 'plaza', base: 5 },
  grassland: { ramp: RAMP.soil, top: ['#c2f58e', '#86e36f'], deco: 'roots', base: 4, grass: true },
};

class World {
  constructor(def, scene) {
    this.def = def; this.scene = scene;
    this.w = def.width; this.h = def.height || H;
    this.ground = new Float32Array(this.w + 1);
    const pts = def.ground;
    for (let x = 0; x <= this.w; x++) {
      let i = 0; while (i < pts.length - 2 && pts[i + 1][0] <= x) i++;
      const [x0, y0] = pts[i], [x1, y1] = pts[Math.min(i + 1, pts.length - 1)];
      const t = x1 === x0 ? 0 : clamp((x - x0) / (x1 - x0), 0, 1);
      const st = pts[i][2] === 'step' ? (t < 1 ? 0 : 1) : smooth(t);
      this.ground[x] = Math.round(lerp(y0, y1, pts[i][2] === 'lin' ? t : st));
    }
    this.platforms = (def.platforms || []).map(p => Object.assign({ oneWay: true, type: 'wood' }, p));
    this.solids = (def.solids || []).slice();
    this.ladders = def.ladders || [];
    this.water = def.water || [];
    this.wind = def.wind || [];
    this.hazards = def.hazards || [];
    this.entities = [];
    this.ps = new Particles(1600);
    this.time = 0;
    this.lensData = [];
  }
  groundAt(x) { x = Math.round(clamp(x, 0, this.w)); return this.ground[x]; }
  /** Superficie de apoyo bajo (x, yFeet) considerando plataformas */
  supportAt(x, yPrev, yNow, dropping) {
    let best = this.groundAt(x);
    for (const p of this.platforms) {
      if (x < p.x || x > p.x + p.w) continue;
      const py = p.y + (p.dy || 0);
      if (p.oneWay) { if (!dropping && yPrev <= py + 1 && yNow >= py - 0.01 && py < best) best = py; }
      else if (yPrev <= py + 1 && py < best) best = py;
    }
    return best;
  }
  solidHit(x, y0, y1) {
    for (const s of this.solids) if (x >= s.x && x <= s.x + s.w && y1 > s.y && y0 < s.y + s.h) return s;
    for (const p of this.platforms) if (!p.oneWay && x >= p.x && x <= p.x + p.w && y1 > p.y + 2 && y0 < p.y + (p.h || 8)) return p;
    return null;
  }
  ladderAt(x, y) { return this.ladders.find(l => Math.abs(x - l.x) < 9 && y >= l.y0 - 2 && y <= l.y1 + 4); }
  waterAt(x, y) { return this.water.find(w => x >= w.x0 && x <= w.x1 && y > w.y); }
  windAt(x, y) { let fx = 0, fy = 0; for (const z of this.wind) if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) { fx += z.fx * (z.on === false ? 0 : 1); fy += z.fy * (z.on === false ? 0 : 1); } return [fx, fy]; }
  add(e) { e.world = this; this.entities.push(e); return e; }
  remove(e) { e.dead = true; }
  find(id) { return this.entities.find(e => e.id === id); }
}

/* ---------- Render del terreno a lienzo ---------- */
function renderTerrain(world) {
  // kit PF (opt-in): caras frontales en 3/4, acantilados columnares, muelle con corte submarino
  if (world.def.pf && world.def.pf.terrain && typeof PFTerrain !== 'undefined') return PFTerrain.render(world);
  const def = world.def, wd = world.w, hd = world.h;
  const pb = new PixelBuffer(wd, hd);
  const segs = def.terrain || [{ x0: 0, x1: wd, mat: 'sand' }];
  const matAt = (x) => { for (const s of segs) if (x >= s.x0 && x < s.x1) return TERRAIN_MATS[s.mat] || TERRAIN_MATS.sand; return TERRAIN_MATS[segs[segs.length - 1].mat]; };
  for (let x = 0; x < wd; x++) {
    const M = matAt(x);
    const top = world.ground[x];
    const slopeL = world.ground[Math.max(0, x - 1)] - top, slopeR = world.ground[Math.min(wd, x + 1)] - top;
    for (let y = Math.max(0, top); y < hd; y++) {
      const d = y - top;
      let c;
      if (d === 0) c = M.top[0];
      else if (d === 1) c = M.top[1];
      else {
        // profundidad → rampa más oscura; textura sutil (tramado suave entre tonos vecinos)
        const n = fbm(x * 0.035, y * 0.06, 3, 5);
        let k = M.base - Math.floor(d / 26);
        const band = (d % 26) / 26;
        if (band > 0.82 && bayer4(x, y) < (band - 0.82) * 5) k -= 1;
        if (n > 0.72 && bayer4(x, y) < 0.25) k -= 1;
        if (n < 0.26 && bayer4(x, y) < 0.2) k += 1;
        if (slopeL > 1.5 && d < 6) k += 1; // borde iluminado
        if (slopeR > 1.5 && d < 6) k -= 1;
        if (M.deco === 'strata' && ((y + Math.floor(fbm1(x * 0.015, 2, 3) * 8)) % 9 === 0)) k -= 1;
        if (M.deco === 'strata' && ((y + Math.floor(fbm1(x * 0.015, 2, 3) * 8)) % 9 === 1)) k += 1;
        if (M.deco === 'plates') { if (y % 16 === 0 || x % 32 === 0) k = 1; else if ((x % 32 === 3 || x % 32 === 28) && (y % 16 === 3 || y % 16 === 12)) k = 6; else k = 3 + ((y % 16) < 3 ? 1 : 0); }
        if (M.deco === 'tiles') { if (y % 8 === 0 || (x + (Math.floor(y / 8) % 2) * 8) % 16 === 0) k = 2; else k = 4; }
        if (M.deco === 'plaza') {
          const FR = ['#20d6c7', '#ff6b6b', '#ffe14d', '#8d6bff'];
          if (d < 6) { c = (x % 14 === 0) ? '#e8c8a0' : (d < 3 ? '#f6dcb8' : '#eccaa0'); pb.data[y * wd + x] = U(c); continue; }
          if (d < 8) { pb.data[y * wd + x] = U(d === 6 ? '#7a4038' : '#a05a42'); continue; }
          if (d < 18) {
            const cx = Math.floor(x / 12), lx = x % 12 - 5.5, ly = d - 12.5;
            const dm = Math.abs(lx) + Math.abs(ly);
            c = dm < 3 ? FR[(cx + 1) % 4] : dm < 5 ? FR[cx % 4] : dm < 5.6 ? '#fff4e0' : '#f2e2c4';
            if (x % 12 === 0) c = '#d8bc96';
            pb.data[y * wd + x] = U(c); continue;
          }
          if (d < 20) { pb.data[y * wd + x] = U(d === 18 ? '#7a4038' : '#9a5640'); continue; }
          const row = Math.floor((d - 20) / 12), jx = (x + (row % 2) * 12) % 24, jy = (d - 20) % 12;
          k = (jx === 0 || jy === 0) ? 2 : (jy === 1 || jx === 1) ? 5 : 4 - Math.floor((d - 20) / 30) + (hash2(Math.floor((x + (row % 2) * 12) / 24), row, 7) > 0.7 ? -1 : 0);
          if (jx > 2 && jy > 2 && hash2(x, y, 8) < 0.03) k -= 1;
        }
        if (M.deco === 'cobble') { const cx = Math.floor(x / 9), cy = Math.floor(y / 7); const jx = (x + (cy % 2) * 4) % 9, jy = y % 7; k = (jx === 0 || jy === 0) ? 2 : 4 + (hash2(cx, cy, 2) > 0.6 ? 1 : 0); }
        if (M.deco === 'ripples' && d < 30 && ((y * 2 + Math.floor(Math.sin(x * 0.05) * 4)) % 9 === 0)) k -= 1;
        k = clamp(k, 0, M.ramp.length - 1);
        c = M.ramp[k];
        if (M.deco === 'shells' && hash2(x, y, 3) < 0.004 && d > 4) c = hash2(x, y, 4) < 0.5 ? '#fff6d8' : '#f78acb';
        if (M.deco === 'crystals' && hash2(x, y, 5) < 0.01) c = '#ffffff';
        if (M.deco === 'roots' && d > 3 && d < 30 && hash2(x >> 1, y, 6) < 0.02) c = '#c9a46a';
        if (M.wet && d < 4 && world.waterAt && world.water.some(w => x >= w.x0 && x <= w.x1)) c = M.ramp[Math.max(0, k - 1)];
      }
      pb.data[y * wd + x] = U(c);
    }
    // decoraciones de superficie
    if (M.grass && hash2(x, 1, 9) < 0.35) { const gh = 1 + Math.floor(hash2(x, 2, 9) * 4); for (let k = 1; k <= gh; k++) pb.set(x, top - k, k === gh ? '#c2f58e' : '#4ccb70'); }
  }
  // decoraciones definidas por el nivel sobre el terreno (rocas, conchas, etc.)
  if (def.decorate) def.decorate(pb, world);
  return pb.toCanvas();
}

/* ---------- Plataformas ---------- */
function drawPlatform(g, p, ox, oy) {
  if (p.baked && typeof PFTerrain !== 'undefined') return; // horneada en el lienzo del terreno
  const x = Math.round(p.x - ox), y = Math.round(p.y + (p.dy || 0) - oy), w = p.w;
  if (x > W || x + w < 0) return;
  switch (p.type) {
    case 'wood': {
      frect(g, x, y, w, 5, '#8a5a3c'); frect(g, x, y, w, 1, '#c8925e'); frect(g, x, y + 4, w, 1, '#4a2a1e');
      for (let k = 6; k < w; k += 8) frect(g, x + k, y + 1, 1, 3, '#5a3826');
      for (let k = 8; k < w - 4; k += 34) { frect(g, x + k, y + 5, 3, p.post || 40, '#5a3826'); frect(g, x + k, y + 5, 1, p.post || 40, '#8a5a3c'); }
      break;
    }
    case 'metal': {
      frect(g, x, y, w, 4, '#345a78'); frect(g, x, y, w, 1, '#98c6d2'); frect(g, x, y + 3, w, 1, '#1d2a48');
      for (let k = 2; k < w; k += 4) frect(g, x + k, y + 1, 1, 2, '#1d2a48');
      frect(g, x, y - 10, w, 1, '#ffb93b'); for (let k = 0; k < w; k += 16) frect(g, x + k, y - 10, 1, 10, '#6aa0b4');
      break;
    }
    case 'rock': {
      g.fillStyle = '#b8564b'; g.fillRect(x, y, w, 6); frect(g, x, y, w, 1, '#f7c08e'); frect(g, x + 1, y + 1, w - 2, 1, '#eb9a6c');
      for (let k = 0; k < w; k += 5) frect(g, x + k, y + 6, 4, 2 + (k * 7 % 3), '#933f47');
      break;
    }
    case 'pipe': {
      const K = PIPE_PAL[p.kind || 'steel'];
      frect(g, x, y, w, 6, K[2]); frect(g, x, y, w, 1, K[4]); frect(g, x, y + 1, w, 1, K[3]); frect(g, x, y + 5, w, 1, K[0]);
      for (let k = 10; k < w; k += 30) frect(g, x + k, y - 1, 2, 8, K[1]);
      break;
    }
    case 'crate': {
      frect(g, x, y, w, p.h || 16, '#a8743e'); frect(g, x, y, w, 1, '#e0aa6a'); frect(g, x + 2, y + 2, w - 4, (p.h || 16) - 4, '#8a5a2c');
      fline(g, x + 2, y + 2, x + w - 3, y + (p.h || 16) - 3, '#c8925e'); frect(g, x, y + (p.h || 16) - 1, w, 1, '#4a2a1e');
      break;
    }
    case 'salt': {
      frect(g, x, y, w, 5, '#f78acb'); frect(g, x, y, w, 1, '#ffffff'); frect(g, x, y + 1, w, 1, '#ffd8ec'); frect(g, x, y + 4, w, 1, '#b44d88');
      for (let k = 3; k < w; k += 7) { fpx(g, x + k, y - 1, '#ffffff'); fpx(g, x + k + 1, y - 2, '#fff2f8'); }
      break;
    }
    default: frect(g, x, y, w, 4, '#6aa0b4');
  }
}

/* =====================================================================
   Entidades
   ===================================================================== */
class Entity {
  constructor(o = {}) { Object.assign(this, { x: 0, y: 0, vx: 0, vy: 0, facing: 1, t: 0, dead: false }, o); }
  update(dt) { this.t += dt; }
  render(g, cam) { }
}

/** Jugadora */
class Player extends Entity {
  constructor(o) {
    super(o);
    this.charId = 'amaya';
    this.onGround = false; this.coyote = 0; this.buffer = 0; this.anim = 'idle'; this.animT = 0; this.runT = 0;
    this.climbing = null; this.wading = false; this.gliding = false; this.inv = 0; this.lock = 0; this.forcedAnim = null;
    this.lastSafe = { x: this.x, y: this.y }; this.stepT = 0; this.expr = null;
    this.w = 12; this.h = 56;
    // integridad (7 corazones, no letal) y carga del traje/KIRU (0..1, no bloquea acciones)
    this.maxHp = 7; this.hp = 7; this.regenT = 0; this.hurtT = 0; this.lostIdx = -1; this.energy = 1; this.lowWarned = false;
  }
  setAnim(a) { if (this.anim !== a) { this.anim = a; this.animT = 0; } }
  hurt(dir, power = 160) {
    if (this.inv > 0) return;
    this.inv = 1.1; this.vx = dir * power; this.vy = -180; this.onGround = false; this.lock = 0.35;
    this.setAnim('hit'); Audio2.sfx('hit'); this.world.scene.cam.shake(3, 0.25);
    this.world.ps.emit('spark', this.x, this.y - 30, 0, -40, 8, 6);
    this.hp = Math.max(0, (this.hp ?? 7) - 1); this.lostIdx = this.hp; this.hurtT = 1.5; this.regenT = 0;
    if (this.hp <= 0) { // sin muerte: vuelve al último punto seguro con la integridad restaurada
      this.x = this.lastSafe.x; this.y = this.lastSafe.y; this.vx = 0; this.vy = 0; this.hp = this.maxHp; this.lostIdx = -1;
      Game.toast('Ruta recuperada · integridad restaurada', 'reset', '#ffe14d', 2);
    }
  }
  update(dt) {
    const W_ = this.world, inp = W_.scene.inputEnabled() ? Input : null;
    this.t += dt; this.animT += dt;
    if (this.inv > 0) this.inv -= dt;
    if (this.lock > 0) this.lock -= dt;
    // integridad: un corazón cada 6 s sin daño · carga: gasto por Lente, Barrido y planeo; recarga en suelo
    if (this.hurtT > 0) this.hurtT -= dt;
    if (this.hp < this.maxHp && this.inv <= 0) { this.regenT += dt; if (this.regenT > 6) { this.regenT = 0; this.hp++; } }
    { const sc = W_.scene, lensOn = !!(sc && sc.lens), scanning = this.forcedAnim === 'scan';
      const drain = (lensOn ? 0.02 : 0) + (scanning ? 0.14 : 0) + (this.gliding ? 0.10 : 0);
      if (drain > 0) this.energy = Math.max(0, this.energy - drain * dt);
      else if (this.onGround) this.energy = Math.min(1, this.energy + 0.15 * dt);
      if (this.energy < 0.12 && !this.lowWarned) { this.lowWarned = true; if (sc && sc.kiru && sc.kiru.say) sc.kiru.say('Carga baja: descansa un momento en suelo firme para recargar.', 'alarmado', 3); }
      if (this.energy > 0.4) this.lowWarned = false; }
    const left = inp && this.lock <= 0 && inp.down('left'), right = inp && this.lock <= 0 && inp.down('right');
    const up = inp && inp.down('up'), down = inp && inp.down('down');
    const jumpP = inp && inp.pressed('jump'), jumpD = inp && inp.down('jump');
    if (jumpP) this.buffer = PHYS.buffer; else this.buffer -= dt;
    // ---- escaleras
    const lad = W_.ladderAt(this.x, this.y - 4);
    if (!this.climbing && lad && ((up && this.y > lad.y0 + 2) || (down && this.y < lad.y1 && this.onGround && this.y <= lad.y0 + 6))) { this.climbing = lad; this.vx = 0; this.vy = 0; }
    if (this.climbing) {
      const L = this.climbing;
      this.x = approach(this.x, L.x, 120 * dt);
      this.vy = (up ? -PHYS.climb : 0) + (down ? PHYS.climb : 0);
      this.y += this.vy * dt;
      if (this.y < L.y0) { this.y = L.y0; this.climbing = null; this.onGround = true; this.vy = 0; }
      else if (this.y > L.y1) { this.y = L.y1; this.climbing = null; }
      if (this.buffer > 0) { this.climbing = null; this.vy = -PHYS.jumpV * 0.8; this.buffer = 0; this.vx = (right ? 1 : left ? -1 : 0) * 80; Audio2.sfx('jump'); }
      this.setAnim('climb'); if (!this.vy) this.animT = 0;
      return;
    }
    // ---- horizontal
    const water = W_.waterAt(this.x, this.y - 2);
    this.wading = !!water && this.onGround;
    const dir = (right ? 1 : 0) - (left ? 1 : 0);
    if (dir) { this.facing = dir; this.runT += dt; } else this.runT = 0;
    let maxV = (this.runT > 0.45 || Input.down('fast')) ? PHYS.run : PHYS.walk;
    if (this.wading) maxV *= PHYS.wadeMul;
    const acc = this.onGround ? (dir ? PHYS.accG : PHYS.decG) : PHYS.accA;
    this.vx = approach(this.vx, dir * maxV, acc * dt);
    // ---- viento
    const [wfx, wfy] = W_.windAt(this.x, this.y - 30);
    // ---- vertical
    this.gliding = !this.onGround && jumpD && this.vy > 0 && GS.hasTool('vela');
    const grav = this.gliding ? PHYS.g * 0.22 : (jumpD && this.vy < 0 ? PHYS.g * 0.82 : PHYS.g * 1.08);
    this.vy += grav * dt + wfy * dt * (this.gliding ? 2.2 : 0.6);
    this.vx += wfx * dt * (this.gliding ? 1.8 : this.onGround ? 0.25 : 0.7);
    if (this.gliding) this.vy = Math.min(this.vy, PHYS.glideFall);
    this.vy = Math.min(this.vy, PHYS.maxFall);
    if (this.onGround) this.coyote = PHYS.coyote; else this.coyote -= dt;
    if (this.buffer > 0 && this.coyote > 0) {
      this.vy = -PHYS.jumpV * (this.wading ? 0.85 : 1); this.onGround = false; this.coyote = 0; this.buffer = 0;
      Audio2.sfx('jump'); W_.ps.emit(this.wading ? 'splash' : 'sand', this.x, this.y, 0, -40, 6, 4);
    }
    // ---- integrar x con colisión
    const nx = clamp(this.x + this.vx * dt, 8, W_.w - 8);
    const gNow = W_.groundAt(this.x), gNew = W_.groundAt(nx);
    let blocked = false;
    if (this.onGround && gNew < this.y - PHYS.stepH && !this._onPlatform) blocked = true;
    if (!this.onGround && gNew < this.y - 2) blocked = true;
    if (W_.solidHit(nx + sign(this.vx) * 6, this.y - this.h, this.y - 2)) blocked = true;
    if (blocked) this.vx = 0; else this.x = nx;
    // ---- integrar y
    const yPrev = this.y;
    this.y += this.vy * dt;
    if (this.vy < 0 && W_.solidHit(this.x, this.y - this.h, this.y - this.h + 4)) { this.vy = 0; }
    const dropping = down && jumpP;
    let sup = W_.supportAt(this.x, yPrev, this.y, down && this.onGround && Input.pressed('jump'));
    this._onPlatform = sup < W_.groundAt(this.x) - 0.5;
    const wasGround = this.onGround;
    if (this.y >= sup && this.vy >= 0) {
      // ajusta a rampas descendentes
      this.y = sup; this.vy = 0; this.onGround = true;
      if (!wasGround) { Audio2.sfx('land'); if (yPrev < sup - 20) { this.setAnim('land'); this.landT = 0.14; W_.ps.emit(water ? 'splash' : 'sand', this.x, this.y, 0, -30, 8, 6); } }
    } else if (this.onGround && this.vy >= 0 && sup - this.y < PHYS.stepH + 2 && sup > this.y) { this.y = sup; }
    else this.onGround = false;
    if (this.y > (W_.def.fallY ?? W_.h + 60)) { this.x = this.lastSafe.x; this.y = this.lastSafe.y; this.vy = 0; this.inv = 1; Game.toast('Ruta recuperada', 'reset', '#ffe14d', 1.6); }
    if (this.onGround && !water) { this.stepT += dt; if (this.stepT > 0.5) { this.stepT = 0; this.lastSafe = { x: this.x, y: this.y }; } }
    // ---- peligros (no letales)
    for (const hz of W_.hazards) {
      if (this.x > hz.x && this.x < hz.x + hz.w && this.y > hz.y && this.y - this.h < hz.y + hz.h) {
        if (hz.kind === 'slow') { this.vx *= 0.9; if (Math.random() < 0.2) W_.ps.emit('salt', this.x, this.y - 2, 0, -20, 1, 4); }
        else if (hz.on !== false) this.hurt(this.x < hz.x + hz.w / 2 ? -1 : 1, hz.power || 160);
      }
    }
    // ---- animación
    if (this.landT > 0) this.landT -= dt;
    if (this.forcedAnim) this.setAnim(this.forcedAnim);
    else if (this.lock > 0 && this.anim === 'hit') { }
    else if (!this.onGround) this.setAnim(this.gliding ? 'glide' : this.vy < 0 ? 'jump' : 'fall');
    else if (this.landT > 0) this.setAnim('land');
    else if (Math.abs(this.vx) > 8) this.setAnim(this.wading ? 'wade' : Math.abs(this.vx) > PHYS.walk + 10 ? 'run' : 'walk');
    else this.setAnim('idle');
    // pasos y partículas
    if (this.onGround && Math.abs(this.vx) > 20) {
      this.footT = (this.footT || 0) + dt * Math.abs(this.vx) / 60;
      if (this.footT > 1) { this.footT = 0; Audio2.sfx(water ? 'splash' : (W_.def.metalFloor ? 'stepMetal' : 'step'), { vol: water ? 0.3 : 0.6 }); W_.ps.emit(water ? 'splash' : (W_.def.dustKind || 'sand'), this.x - this.facing * 4, this.y - 1, -this.facing * 20, -25, water ? 3 : 2, 2); }
    }
    if (this.gliding && Math.random() < 0.4) W_.ps.emit('windline', this.x - this.facing * 10, this.y - 40 + Math.random() * 20, -this.facing * 60, 0, 1);
  }
  render(g, cam) {
    if (this.inv > 0 && (Math.floor(this.inv * 20) % 2) && this.anim !== 'hit') return;
    const x = this.x - cam.ox, y = this.y - cam.oy;
    if (this.gliding) drawGlider(g, x + this.facing * 2, y - 102, this.facing); // vela sobre la cabeza (sprite de 74 px, puños en alto ≈ y−76)
    drawChar(g, this.charId, this.anim, this.animT, x, y, this.facing, { expr: this.expr, item: this.item });
    if (this.wading) { const wy = Math.round(this.world.waterAt(this.x, this.y - 2).y - cam.oy), dh = Math.max(0, Math.round(this.y - cam.oy) - wy); frect(g, x - 12, wy, 24, 1, '#d2ecee'); g.globalAlpha = 0.55; frect(g, x - 11, wy + 1, 22, dh, '#11bedd'); g.globalAlpha = 0.35; frect(g, x - 11, wy + 3, 22, Math.max(0, dh - 2), '#0a71a3'); g.globalAlpha = 1; fpx(g, x - 12 + ((Game.frame >> 3) % 24), wy, '#ffffff'); fpx(g, x - 13 + ((Game.frame >> 2) % 3), wy - 1, '#ffffff'); fpx(g, x + 11 - ((Game.frame >> 2) % 3), wy - 1, '#ffffff'); }
  }
}
/** Vela de Brisa: lona curva prerenderizada (3 cuadros de flameo) con franjas cian, luz arriba,
    sombra en la panza y contorno navy; cuerdas hasta las manos en alto (y + 26). */
const _gliderStrip = { c: null };
function drawGlider(g, x, y, f) {
  const t = Game.time;
  if (!_gliderStrip.c) {
    const fw = 46, fh = 16;
    _gliderStrip.c = PFK.strip(3, fw, fh, (pb, i) => {
      const cx = fw / 2, P = PFK.P32(['#1d2a48', '#7a8aa8', '#b8c8d8', '#e8f0f4', '#fffaf0', '#ffffff']), C = PFK.P32(['#0c4560', '#1491aa', '#22bdd0', '#56e5ff', '#a6f4ff']);
      for (let xx = 1; xx < fw - 1; xx++) {
        const u = (xx - cx) / (cx - 1), arc = Math.round(Math.abs(u) * Math.abs(u) * 7 + Math.sin(u * 5 + i * 2.1) * 0.7);
        const th = Math.round(4 - Math.abs(u) * 2.2);
        for (let k = 0; k < th; k++) {
          const stripe = Math.floor((xx + 2) / 6) % 2 === 0;
          let col = k === 0 ? (stripe ? C[4] : P[5]) : k === th - 1 ? (stripe ? C[1] : P[2]) : (stripe ? C[3] : P[4]);
          if (u > 0.55 && k > 0) col = stripe ? C[2] : P[3];
          PFK.put(pb, xx, 2 + arc + k, col);
        }
        PFK.put(pb, xx, 1 + arc, P[0]); PFK.put(pb, xx, 2 + arc + th, P[0]);
      }
      PFK.put(pb, 0, 9, P[0]); PFK.put(pb, fw - 1, 9, P[0]);
    });
  }
  const S = _gliderStrip.c, sway = Math.round(Math.sin(t * 3) * 1);
  PFK.drawStrip(g, S, Math.floor(t * 7) % 3, x - (S.w >> 1), y - 3 + sway);
  fline(g, x - 21, y + 5 + sway, x - 4, y + 26, '#cfe8ee'); fline(g, x + 21, y + 5 + sway, x + 4, y + 26, '#cfe8ee');
  fline(g, x - 10, y + 2 + sway, x - 3, y + 26, '#8aa8c0'); fline(g, x + 10, y + 2 + sway, x + 3, y + 26, '#8aa8c0');
}

/** KIRU: compañero que sigue, comenta y reacciona */
class Kiru extends Entity {
  constructor(o) { super(o); this.anim = 'idle'; this.animT = 0; this.mood = 'curioso'; this.bubble = null; this.hopVy = 0; this.air = false; this.follow = true; this.scanT = 0; }
  say(text, mood = null, dur = 3.5) { this.bubble = { text, t: 0, dur }; if (mood) this.mood = mood; Audio2.sfx('voice', { voice: 'kiru' }); }
  update(dt) {
    this.t += dt; this.animT += dt;
    const W_ = this.world, P = W_.scene.player;
    if (this.bubble) { this.bubble.t += dt; if (this.bubble.t > this.bubble.dur) this.bubble = null; }
    if (this.scanT > 0) this.scanT -= dt;
    if (this.target) {
      const d = this.target.x - this.x;
      this.vx = Math.abs(d) > 2 ? sign(d) * (this.target.speed || 80) : 0;
      if (Math.abs(d) <= 2) { this.target.done = true; this.target = null; }
    } else if (this.follow && P) {
      const tx = P.x - P.facing * KIRU_FOLLOW;
      const d = tx - this.x;
      if (Math.abs(P.x - this.x) > 340 || Math.abs(P.y - this.y) > 220) { this.x = P.x - P.facing * 24; this.y = P.y - 10; W_.ps.emit('energy', this.x, this.y - 10, 0, 0, 10, 8); }
      const sp = Math.abs(d) > 70 ? 170 : Math.abs(d) > 20 ? 95 : 0;
      this.vx = approach(this.vx, sign(d) * sp, 600 * dt);
      if (Math.abs(d) > 6) this.facing = sign(d); else this.facing = P.facing;
      // salta si la jugadora está más arriba
      if (!this.air && P.onGround && P.y < this.y - 18 && Math.abs(P.x - this.x) < 90) { this.hopVy = -300; this.air = true; }
    }
    this.x += this.vx * dt;
    this.x = clamp(this.x, 6, W_.w - 6);
    const ground = W_.supportAt(this.x, this.y - 2, this.y + 1, false);
    if (this.air || this.y < ground - 1) {
      this.hopVy += PHYS.g * dt; this.y += this.hopVy * dt;
      if (this.y >= ground && this.hopVy > 0) { this.y = ground; this.air = false; this.hopVy = 0; }
      else this.air = true;
    } else { this.y = ground; }
    if (this.y > W_.h + 40 && P) { this.x = P.x; this.y = P.y; }
    let a = this.air ? (this.hopVy < 0 ? 'jump' : 'fall') : Math.abs(this.vx) > 100 ? 'run' : Math.abs(this.vx) > 6 ? 'walk' : (this.bubble ? 'talk' : 'idle');
    if (this.scanT > 0) a = 'scan';
    if (this.forced) a = this.forced;
    if (a !== this.anim) { this.anim = a; this.animT = 0; }
    // altura de vuelo: reposa a la altura de la cabeza de Amaya y baja un poco al desplazarse (solo visual)
    const moving = Math.abs(this.vx) > 6 || this.air;
    this.lift = approach(this.lift ?? KIRU_LIFT, moving ? KIRU_LIFT_MOVE : KIRU_LIFT, (moving ? 60 : 24) * dt);
  }
  /** Desplazamiento vertical de dibujo respecto al ancla del sprite (que ya incluye KIRU_LIFT) */
  get dropY() { return Math.round(KIRU_LIFT - (this.lift ?? KIRU_LIFT)); }
  render(g, cam) {
    const x = this.x - cam.ox, y = this.y - cam.oy, dy = this.dropY;
    drawChar(g, 'kiru', this.anim, this.animT, x, y + dy, this.facing, { expr: this.mood, shadow: false });
    // sombra de contacto en el suelo (KIRU flota): pequeña y más tenue cuanto más alto
    const sh = charShadow(5); g.globalAlpha = 0.75; g.drawImage(sh, Math.round(x) - (sh.width >> 1), Math.round(y) - 2); g.globalAlpha = 1;
    if (this.scanT > 0) {
      // anillos de escaneo centrados en el visor (ancla del ojo del sprite)
      const ey = Math.round(y + dy - (CHARS.kiru.oy - 38));
      for (let i = 0; i < 3; i++) { const r = ((Game.time * 30 + i * 8) % 24); g.globalAlpha = 1 - r / 24; for (let a = 0; a < 16; a++) fpx(g, x + this.facing * 6 + Math.cos(a / 16 * TAU) * r, ey + Math.sin(a / 16 * TAU) * r * 0.5, '#56e5ff'); g.globalAlpha = 1; }
    }
  }
  renderBubble(g, cam) { if (this.bubble) drawBubble(g, this.x - cam.ox, this.y - cam.oy - 36, this.bubble.text, '#20d6c7', this.bubble.t); }
}
/** Distancia de seguimiento de KIRU detrás de Amaya (px): deja libre la coleta y la mochila */
const KIRU_FOLLOW = 36;

/** Globo de diálogo ambiental (navy de la referencia, con nombre y cola hacia la cabeza del hablante).
    (x,y) = punto sobre el personaje en pantalla; si coincide con un KIRU/actor del nivel se ancla a su cabeza real. */
function drawBubble(g, x, y, text, edge = '#e2ebfc', t = 1, maxW = 150) {
  let ax = x, ay = y, name = null;
  const gp = (typeof GameplayScene !== 'undefined' && GameplayScene.world && GameplayScene.cam) ? GameplayScene : null;
  if (gp) {
    const cam = gp.cam;
    for (const e of gp.world.entities) {
      if (!(e instanceof Kiru) && !(e instanceof Actor)) continue;
      if (Math.abs((e.x - cam.ox) - x) > 0.6) continue;
      const cid = e instanceof Kiru ? 'kiru' : e.charId;
      ay = Math.round(e.y - cam.oy - Math.max(e.bubbleH || 0, UIK.headTop(cid)) - 3);
      const sp = e instanceof Kiru ? SPEAKERS.kiru : (SPEAKERS[e.id] || (SPEAKERS[e.charId] && SPEAKERS[e.charId].portrait === e.charId ? SPEAKERS[e.charId] : null));
      name = e.name || (sp && sp.name) || null;
      break;
    }
  }
  UIK.speechBubble(g, ax, ay, { name: name ? String(name).toUpperCase() : null, nameCol: edge, text, max: Math.floor(t * 50), w: Math.min(220, maxW + 22), avoid: UIK._hudRects || [], minY: 4 });
}

/** NPC / actor de escena */
class Actor extends Entity {
  constructor(o) {
    super(Object.assign({ charId: 'crowd0', anim: 'idle', animT: 0, wander: 0, home: null, expr: null, talkable: true, name: null, solid: false, faceP: true }, o));
    this.home = this.home ?? this.x; this.bubble = null; this.animT = Math.random() * 3;
  }
  say(text, dur = 3.5) { this.bubble = { text, t: 0, dur }; }
  update(dt) {
    this.t += dt; this.animT += dt;
    if (this.bubble) { this.bubble.t += dt; if (this.bubble.t > this.bubble.dur) this.bubble = null; }
    const P = this.world.scene.player;
    if (this.target) {
      const d = this.target.x - this.x;
      const sp = this.target.speed || 70;
      if (Math.abs(d) > 2) { this.x += sign(d) * Math.min(Math.abs(d), sp * dt); this.facing = sign(d); this.anim = sp > 100 ? 'run' : 'walk'; }
      else { this.target.done = true; this.target = null; this.anim = this.restAnim || 'idle'; }
    } else if (this.wander && !this.busy) {
      this.wt = (this.wt || 0) - dt;
      if (this.wt <= 0) { this.wt = 2 + Math.random() * 4; this.wdir = Math.random() < 0.5 ? 0 : (Math.random() < 0.5 ? -1 : 1); }
      if (this.wdir) { this.x += this.wdir * 28 * dt; this.facing = this.wdir; this.anim = 'walk'; if (Math.abs(this.x - this.home) > this.wander) { this.wdir = -sign(this.x - this.home); } }
      else this.anim = this.restAnim || 'idle';
    }
    if (!this.target && this.faceP && P && Math.abs(P.x - this.x) < 70 && !this.wdir) this.facing = sign(P.x - this.x) || this.facing;
    if (!this.fly) this.y = this.world.supportAt(this.x, this.y - 2, this.y + 1, false);
  }
  render(g, cam) {
    if (this.hidden) return;
    const x = this.x - cam.ox, y = this.y - cam.oy;
    if (x < -80 || x > W + 80) return;
    if (this.preDraw) this.preDraw(g, x, y);
    drawChar(g, this.charId, this.anim, this.animT, x, y, this.facing, { expr: this.expr, item: this.item, variant: this.variant });
  }
  renderBubble(g, cam) { if (this.bubble) drawBubble(g, this.x - cam.ox, this.y - cam.oy - (this.bubbleH || 92), this.bubble.text, '#ffe14d', this.bubble.t); }
}

/** Estación interactiva (terminal, sensor, válvula, simulador, evidencia) */
class Station extends Entity {
  constructor(o) { super(Object.assign({ label: 'Interactuar', icon: 'info', r: 26, kind: 'terminal', active: true, glow: '#56e5ff', done: false, hidden: false }, o)); }
  near(P) { return this.active && !this.hidden && Math.abs(P.x - this.x) < this.r && Math.abs((P.y - 20) - (this.y - (this.hY || 16))) < 46; }
  render(g, cam) {
    if (this.hidden) return;
    const x = Math.round(this.x - cam.ox), y = Math.round(this.y - cam.oy);
    if (x < -60 || x > W + 60) return;
    if (this.draw) { this.draw(g, x, y, this); return; }
    drawStationSprite(g, this.kind, x, y, this);
  }
  renderPrompt(g, cam, P) {
    if (!this.near(P)) return;
    const x = Math.round(this.x - cam.ox), y = Math.round(this.y - cam.oy - (this.hY || 30) - 22 + Math.sin(Game.time * 4) * 1.5);
    const label = this.label;
    const w = FONTS.main.measure(label) + 30;
    UIK.panel(g, x - w / 2, y, w, 17, this.done ? 'green' : 'glass');
    const key = Input.touchMode ? 'E' : keyName(Input.codesFor('interact')[0]);
    frect(g, Math.round(x - w / 2 + 4), y + 3, 11, 11, '#fffaf0'); drawText(g, key, Math.round(x - w / 2 + 10), y + 5, { color: '#140d26', align: 'center' });
    drawText(g, label, Math.round(x - w / 2 + 19), y + 5, { color: this.done ? '#c2f58e' : '#fffaf0', shadow: '#070a1c' });
  }
}
/** Sprites genéricos de estaciones */
function drawStationSprite(g, kind, x, y, st) {
  if (typeof PFStations !== 'undefined' && PFStations.draw(g, kind, x, y, st)) return; // aspecto en 3/4 del kit PF
  const t = Game.time, glow = st.glow;
  switch (kind) {
    case 'terminal': {
      frect(g, x - 8, y - 30, 16, 30, '#1d2a48'); frect(g, x - 7, y - 29, 14, 28, '#345a78'); frect(g, x - 7, y - 29, 2, 28, '#6aa0b4');
      frect(g, x - 6, y - 27, 12, 9, '#0a1030');
      for (let i = 0; i < 3; i++) frect(g, x - 5, y - 26 + i * 3, 2 + ((i * 5 + Math.floor(t * 4)) % 8), 1, glow);
      frect(g, x - 5, y - 15, 3, 2, '#ff6b6b'); frect(g, x - 1, y - 15, 3, 2, '#86e36f'); frect(g, x + 3, y - 15, 2, 2, '#ffe14d');
      frect(g, x - 9, y - 1, 18, 1, '#140d26');
      if (!st.done && (Math.floor(t * 2) % 2)) fpx(g, x + 6, y - 32, glow);
      break;
    }
    case 'sensor': {
      frect(g, x - 1, y - 22, 2, 22, '#98c6d2'); frect(g, x - 5, y - 28, 10, 7, '#27405e'); frect(g, x - 4, y - 27, 8, 5, '#0a1030');
      frect(g, x - 3, y - 26, 2, 2, (Math.floor(t * 3) % 2) ? glow : '#106884'); frect(g, x + 1, y - 26, 2, 2, '#86e36f');
      for (let i = 0; i < 2; i++) { const r = ((t * 14 + i * 6) % 12); g.globalAlpha = 1 - r / 12; for (let a = -3; a <= 3; a++) fpx(g, x + Math.sin(a * 0.3) * r, y - 30 - Math.cos(a * 0.3) * r, glow); g.globalAlpha = 1; }
      break;
    }
    case 'valve': {
      frect(g, x - 10, y - 10, 20, 6, '#345a78'); frect(g, x - 10, y - 10, 20, 1, '#98c6d2');
      frect(g, x - 1, y - 18, 2, 8, '#6aa0b4');
      const a = st.done ? 1.2 : 0;
      for (let k = 0; k < 4; k++) { const an = a + k * Math.PI / 2; fline(g, x, y - 20, x + Math.cos(an) * 6, y - 20 + Math.sin(an) * 3, '#ff4e5d'); }
      fdisc(g, x, y - 20, 2, '#ff9a8a');
      break;
    }
    case 'clue': {
      const b = Math.round(Math.sin(t * 3) * 2);
      for (let k = 0; k < 4; k++) fpx(g, x + Math.cos(t * 2 + k * 1.57) * 9, y - 18 + b + Math.sin(t * 2 + k * 1.57) * 4, '#b49cff');
      frect(g, x - 4, y - 22 + b, 8, 8, '#3f2690'); frect(g, x - 3, y - 21 + b, 6, 6, '#8d6bff'); frect(g, x - 2, y - 20 + b, 2, 2, '#dcd0ff');
      drawText(g, '?', x, y - 22 + b, { align: 'center', color: '#ffffff', font: 'tiny' });
      break;
    }
    case 'solo': {
      // Puerta de Evidencia (supercontexto SOLO)
      frect(g, x - 14, y - 44, 28, 44, '#1a1040'); frect(g, x - 12, y - 42, 24, 42, '#2a1a66');
      for (let i = 0; i < 5; i++) { const on = st.progress > i; frect(g, x - 10 + i * 4.5, y - 38, 3, 3, on ? '#ffe14d' : '#3f2690'); }
      frect(g, x - 8, y - 30, 16, 26, st.done ? '#1f854c' : '#0a0718');
      for (let i = 0; i < 6; i++) fpx(g, x - 7 + ((i * 5 + Math.floor(t * 6)) % 14), y - 28 + i * 4, st.done ? '#c2f58e' : '#b49cff');
      drawText(g, 'SOLO', x, y - 52, { font: 'tiny', align: 'center', color: '#ffe14d', shadow: '#0a0718' });
      break;
    }
    case 'sim': {
      frect(g, x - 16, y - 34, 32, 34, '#102a43'); frect(g, x - 15, y - 33, 30, 32, '#1d346c');
      frect(g, x - 13, y - 31, 26, 15, '#0a1030');
      for (let i = 0; i < 26; i++) fpx(g, x - 13 + i, y - 23 + Math.round(Math.sin(i * 0.5 + t * 3) * 4), glow);
      frect(g, x - 12, y - 12, 6, 3, '#ffe14d'); frect(g, x - 4, y - 12, 6, 3, '#56e5ff'); frect(g, x + 4, y - 12, 6, 3, '#86e36f');
      frect(g, x - 17, y - 1, 34, 1, '#140d26');
      break;
    }
    case 'book': {
      frect(g, x - 8, y - 14, 16, 14, '#7a1f36'); frect(g, x - 7, y - 13, 14, 11, '#d8434a'); frect(g, x - 5, y - 11, 10, 3, '#ffe14d');
      break;
    }
    default: frect(g, x - 6, y - 12, 12, 12, glow);
  }
}

/** Coleccionable (fragmento de eco de KIRU, semilla, sensor) */
class Pickup extends Entity {
  constructor(o) { super(Object.assign({ kind: 'echo', col: '#b49cff' }, o)); this.by = this.y; }
  update(dt) {
    this.t += dt;
    this.y = this.by + Math.sin(this.t * 3) * 2;
    const P = this.world.scene.player;
    if (P && Math.abs(P.x - this.x) < 12 && Math.abs(P.y - 24 - this.y) < 30) { this.dead = true; Audio2.sfx('collect'); this.world.ps.emit('spark', this.x, this.y, 0, 0, 12, 6); this.onPick && this.onPick(this); }
    if (Math.random() < 0.1) this.world.ps.emit(this.kind === 'echo' ? 'data' : 'spark', this.x, this.y, 0, -10, 1, 4);
  }
  render(g, cam) {
    const x = Math.round(this.x - cam.ox), y = Math.round(this.y - cam.oy);
    if (this.draw) { this.draw(g, x, y, this); return; }
    if (this.kind === 'echo' && typeof PFStations !== 'undefined') { PFStations.drawEcho(g, x, y, this.t); return; }
    if (this.kind === 'echo') {
      const r = 4 + Math.sin(this.t * 5);
      fdisc(g, x, y, r + 2, '#3f2690'); fdisc(g, x, y, r, '#8d6bff'); fdisc(g, x - 1, y - 1, r * 0.45, '#dcd0ff');
      for (let k = 0; k < 4; k++) { const a = this.t * 2 + k * 1.57; fpx(g, x + Math.cos(a) * 9, y + Math.sin(a) * 9, '#b49cff'); }
    } else if (this.kind === 'seed') { Icons.draw(g, 'seed', x - 7, y - 7); }
    else if (this.kind === 'sensor') { Icons.draw(g, 'sensor', x - 7, y - 7); }
    else Icons.draw(g, this.icon || 'star', x - 7, y - 7);
  }
}

/** Adversario conceptual (definiciones en 21_learning.js) */
class Adversary extends Entity {
  constructor(o) { super(Object.assign({ type: 'fouler', range: 60, speed: 30, hp: 1, quizId: null }, o)); this.bx = this.x; this.by = this.y; this.phase = Math.random() * 6; }
  update(dt) {
    this.t += dt;
    if (this.calm) { this.calmT = (this.calmT || 0) + dt; if (this.calmT > 1.2) this.dead = true; return; }
    this.x = this.bx + Math.sin(this.t * this.speed / this.range + this.phase) * this.range;
    this.y = this.by + Math.sin(this.t * 2.3) * 6;
    const P = this.world.scene.player;
    if (P && Math.abs(P.x - this.x) < 12 && Math.abs(P.y - 28 - this.y) < 26) P.hurt(sign(P.x - this.x) || 1, 150);
    if (Math.random() < 0.2) this.world.ps.emit(this.type === 'scale' || this.type === 'saltMirage' ? 'salt' : this.type === 'peak' ? 'spark' : this.type === 'gust' ? 'windline' : 'glitch', this.x + (Math.random() - 0.5) * 14, this.y + (Math.random() - 0.5) * 14, 0, 0, 1);
  }
  render(g, cam) {
    const x = Math.round(this.x - cam.ox), y = Math.round(this.y - cam.oy);
    if (x < -40 || x > W + 40) return;
    const A = ADVERSARIES[this.type], c = A.col, t = this.t;
    const k = this.calm ? 1 - (this.calmT || 0) / 1.2 : 1;
    // cuerpo de partículas en espiral con "ojo"
    for (let i = 0; i < 26; i++) {
      const a = t * 2 + i * 0.7, r = (4 + (i % 7) * 1.6) * k;
      fpx(g, x + Math.cos(a) * r, y + Math.sin(a * 1.3) * r * 0.8, c[i % 4]);
    }
    fdisc(g, x, y, 5 * k, c[1]); fdisc(g, x - 1, y - 1, 3 * k, c[2]);
    if (!this.calm) { frect(g, x - 2, y - 1, 2, 2, '#140d26'); frect(g, x + 1, y - 1, 2, 2, '#140d26'); fpx(g, x - 2, y - 1, '#fff'); }
    if (this.type === 'monoscore') drawText(g, '100', x, y - 14, { font: 'tiny', align: 'center', color: '#ffd84a', shadow: '#140d26' });
    if (this.type === 'peak') drawText(g, 'kW!', x, y - 14, { font: 'tiny', align: 'center', color: '#ffe14d', shadow: '#140d26' });
  }
}
