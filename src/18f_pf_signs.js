/* =====================================================================
   18f_pf_signs.js — Señalética del plano jugable (kit PF).
   · PFSigns.post(pb, x, yGround, items): poste de madera con tablones
     en flecha (veta, clavos, texto crema con sombra) como en la referencia.
   · WorldLabels.draw(g, sc): etiquetas científicas en el mundo (relleno
     navy, borde 1 px del color del sistema + halo, MAYÚSCULAS de 7 px,
     subtítulo en tipo oración, tallo de 1 px con remache). Dibuja
     sc.def.labels + BIOME_LABELS[sc.def.biome] cada cuadro (texto nítido
     desde lienzos cacheados).
   Contrato de etiqueta: {x, y, f=1, fy?, title, sub?, kind, ax?, ay?}
     · Coordenadas en el espacio de su plano: sx = x − cam.x·f,
       sy = y − cam.y·fy; fy = 1 si f = 1 (mundo); si no, fy = f·0,3
       (igual que Backdrop.layer) salvo que la etiqueta defina fy.
     · (x, y) = centro inferior de la caja. El tallo baja desde el borde
       inferior hasta (ax ?? x, ay ?? y + 8) y termina en un remache.
     · kind: 'water' | 'brine' | 'green' | 'solar' | 'tech' | 'alert'.
     · sub puede ser texto o función (sc) → texto (valores en vivo).
   ===================================================================== */
var BIOME_LABELS = (typeof BIOME_LABELS !== 'undefined') ? BIOME_LABELS : {};

/* r4-labels: cajas de pantalla dibujadas DESPUÉS de las etiquetas en el cuadro anterior, que las etiquetas
   esquivan en el siguiente: instrumentos inferiores (UIK.instrumentPlates, vía hudGauges) y globos de diálogo
   (UIK.speechBubble). Envoltorios transparentes: mismos argumentos y mismo valor devuelto. */
const R4LBL_SEEN = { plates: { f: -99, r: [] }, bubbles: { f: -99, r: [] } };
function R4LBL_record(slot, r) {
  if (!r || typeof Game === 'undefined') return;
  const S = R4LBL_SEEN[slot];
  if (S.f !== Game.frame) { S.f = Game.frame; S.r = []; }
  if (S.r.length < 12) S.r.push({ x: r.x, y: r.y, w: r.w, h: r.h });
}
if (typeof UIK !== 'undefined') for (const [fn, slot] of [['instrumentPlates', 'plates'], ['speechBubble', 'bubbles']]) {
  const f0 = UIK[fn];
  if (typeof f0 !== 'function' || f0.r4lbl) continue;
  const f1 = function () { const r = f0.apply(this, arguments); R4LBL_record(slot, r); return r; };
  f1.r4lbl = 1; UIK[fn] = f1;
}

const PFSigns = (() => {
  const WOOD = ['#100100', '#2a0800', '#370b00', '#4e2519', '#5a2d21', '#6e3a24', '#8e542f', '#ab7448', '#cb9772'];
  const TXT = '#faebe2';
  /** Tablón con punta de flecha a la derecha (dir 1) o izquierda (−1) */
  function plank(pb, x, y, w, h, text, seed, dir = 1, font = 'main') {
    const P = PFK.P32(WOOD), r = RNG(seed), tip = Math.round(h * 0.55);
    const inside = (xx, yy) => {
      const lx = dir > 0 ? xx - x : x + w - 1 - xx;
      if (lx < 0 || lx >= w || yy < y || yy >= y + h) return false;
      if (lx >= w - tip) { const k = lx - (w - tip); const half = h / 2; return Math.abs(yy - (y + half - 0.5)) <= half - k * (half / tip) + 0.3; }
      // esquinas traseras ligeramente desportilladas
      if (lx === 0 && (yy === y || yy === y + h - 1)) return false;
      return true;
    };
    for (let yy = y - 1; yy <= y + h; yy++) for (let xx = x - 1; xx <= x + w; xx++) {
      if (!inside(xx, yy)) { if (inside(xx + 1, yy) || inside(xx - 1, yy) || inside(xx, yy + 1) || inside(xx, yy - 1)) PFK.put(pb, xx, yy, P[1]); continue; }
      const v = (yy - y) / (h - 1);
      // veta horizontal: bandas onduladas con nudos
      const grain = PFK.vn(xx * 0.06, (yy + Math.sin(xx * 0.09 + seed) * 1.2) * 0.9, seed);
      let k = 5 + Math.round((grain - 0.5) * 3);
      if (v < 0.12) k = 8; else if (v < 0.22) k = 7; else if (v > 0.86) k = 3; else if (v > 0.74) k -= 1;
      if (grain > 0.78 && v > 0.2 && v < 0.75) k = 4;
      if (hash2(xx, yy, seed) < 0.03) k -= 1;
      PFK.put(pb, xx, yy, P[clamp(k, 2, 8)]);
    }
    // nudo
    const kx = x + 6 + Math.floor(r() * (w - 20)), ky = y + 3 + Math.floor(r() * (h - 7));
    PFK.put(pb, kx, ky, P[3]); PFK.put(pb, kx + 1, ky, P[2]); PFK.put(pb, kx + 2, ky, P[3]);
    // clavos
    for (const nx of [x + 4, x + w - tip - 4]) { PFK.put(pb, nx, y + 3, U('#d8d0c8')); PFK.put(pb, nx, y + 4, U('#5a5048')); PFK.put(pb, nx, y + h - 4, U('#d8d0c8')); PFK.put(pb, nx, y + h - 3, U('#5a5048')); }
    // texto + flecha (la letra pequeña 'tiny' es la de la referencia: 5 px de alto en tablones de 12)
    const tiny = font === 'tiny', gh = tiny ? 5 : 7;
    const tw = PFK.measure(text, { font });
    const tx = dir > 0 ? x + (tiny ? 5 : 7) : x + tip + 6, ty = y + Math.round((h - gh) / 2) + (tiny ? 1 : 1);
    PFK.text(pb, text, tx, ty, U(TXT), { font, shadow: U('#1a0500') });
    const ax = dir > 0 ? x + w - tip - 4 : x + tip - 4, ay = y + Math.round(h / 2) - (tiny ? 1 : 0);
    const al = tiny ? 5 : 7, ah = tiny ? 2 : 3;
    const arrowX = dir > 0 ? Math.max(tx + tw + 3, ax - al + 1) : tx + tw + 5;
    const tipX = dir > 0 ? arrowX + al - 1 : arrowX;
    for (let k = 0; k < al; k++) { PFK.put(pb, arrowX + k, ay, U(TXT)); PFK.put(pb, arrowX + k + 1, ay + 1, U('#1a0500')); }
    for (let k = 1; k <= ah; k++) { const xx = tipX - dir * k; PFK.put(pb, xx, ay - k, U(TXT)); PFK.put(pb, xx, ay + k, U(TXT)); PFK.put(pb, xx + 1, ay + k + 1, U('#1a0500')); }
    return tw;
  }
  /** Poste con capuchón */
  function postV(pb, x, yTop, yBot, w = 7) {
    const P = PFK.P32(WOOD);
    for (let y = yTop; y < yBot; y++) for (let k = 0; k < w; k++) {
      let ki = k === 0 ? 1 : k === 1 ? 7 : k === 2 ? 6 : k < w - 2 ? 5 : k === w - 2 ? 3 : 1;
      if (PFK.vn(k * 0.5, y * 0.3, 3) > 0.7) ki--;
      PFK.put(pb, x + k, y, P[clamp(ki, 0, 8)]);
    }
    for (let k = -1; k <= w; k++) { PFK.put(pb, x + k, yTop - 2, P[k < 1 ? 7 : 6]); PFK.put(pb, x + k, yTop - 1, P[4]); PFK.put(pb, x + k, yTop, P[2]); }
    for (let k = 0; k < w; k++) PFK.put(pb, x + k, yTop - 3, P[1]);
  }
  /** Grupo de tablones en flecha sobre dos postes. items: [{text, dir}] */
  /** opts: {font:'main'|'tiny', h, gap, base} — 'tiny' = letrero compacto de la referencia (tablones de 12 px) */
  function post(pb, x, yGround, items, seed = 7, opts = {}) {
    const font = opts.font || 'main', tiny = font === 'tiny';
    const h = opts.h ?? (tiny ? 12 : 15), gap = opts.gap ?? (tiny ? 2 : 3), n = items.length, base = opts.base ?? (tiny ? 6 : 21);
    const widths = items.map(it => PFK.measure(it.text, { font }) + (tiny ? 23 : 30));
    const w = Math.max(...widths);
    const top = yGround - base - n * (h + gap) + gap;
    postV(pb, x + 6, top - 4, yGround + 1, tiny ? 6 : 7);
    postV(pb, x + Math.min(w - (tiny ? 24 : 28), 64), top + 6, yGround + 1, tiny ? 5 : 6);
    items.forEach((it, i) => {
      const pw = Math.max(widths[i], w - 6 + (i % 2 ? -4 : 2));
      plank(pb, x + (i % 2 ? 2 : 0), top + i * (h + gap), pw, h, it.text, seed + i * 11, it.dir || 1, font);
    });
    // sombra de contacto en la base
    for (let k = -2; k < w * 0.7; k++) { const c = PFK.get(pb, x + k, yGround - 1); if (c >>> 24) PFK.put(pb, x + k, yGround - 1, PFK.shU(c, -0.3, 15)); }
    return { x, y: top, w, h: yGround - top };
  }
  return { plank, post, postV, WOOD };
})();

/* ---------- etiquetas científicas en el mundo ---------- */
const WorldLabels = (() => {
  const KINDS = {
    water: { fill: '#030e25', border: '#89e7fc', glow: '#2e97b1', rim: '#4e89a6', text: '#f9fbff', sub: '#bfeaf6' },
    brine: { fill: '#0a042f', border: '#b79ace', glow: '#6a496b', rim: '#7a5a8e', text: '#f9fbff', sub: '#e2d2f2' },
    green: { fill: '#0f4a2c', border: '#77ce8d', glow: '#2f6b3a', rim: '#4a9a5c', text: '#f9fbff', sub: '#d4f5dc' },
    solar: { fill: '#2a1404', border: '#ffc861', glow: '#8a5a12', rim: '#c08a2a', text: '#fffaf0', sub: '#ffe6b0' },
    tech: { fill: '#06132e', border: '#a8c8ff', glow: '#3a64b0', rim: '#5a7ab8', text: '#f4f8ff', sub: '#c8d8f4' },
    alert: { fill: '#2a0610', border: '#ff7a6a', glow: '#8a2030', rim: '#c04a4a', text: '#fff4f0', sub: '#ffd0c8' },
  };
  const cache = new Map();
  /* Mayúsculas de rótulo 4×7 (trazo de 1 px, contraformas abiertas, tilde en su propia fila): el ancho por letra
     es el de la antigua negrita diminuta (5 px con el espacio), así que las cajas no crecen en horizontal. Las letras
     que piden 5 columnas (M, Q, T, V, W, X, Y) y las cifras/símbolos salen de FONTS.main. */
  const CAPS = {
    'A': ['.##.', '#..#', '#..#', '####', '#..#', '#..#', '#..#'], 'B': ['###.', '#..#', '#..#', '###.', '#..#', '#..#', '###.'],
    'C': ['.##.', '#..#', '#...', '#...', '#...', '#..#', '.##.'], 'D': ['###.', '#..#', '#..#', '#..#', '#..#', '#..#', '###.'],
    'E': ['####', '#...', '#...', '###.', '#...', '#...', '####'], 'F': ['####', '#...', '#...', '###.', '#...', '#...', '#...'],
    'G': ['.##.', '#..#', '#...', '#.##', '#..#', '#..#', '.###'], 'H': ['#..#', '#..#', '#..#', '####', '#..#', '#..#', '#..#'],
    'I': ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'], 'J': ['..##', '...#', '...#', '...#', '#..#', '#..#', '.##.'],
    'K': ['#..#', '#..#', '#.#.', '##..', '#.#.', '#..#', '#..#'], 'L': ['#...', '#...', '#...', '#...', '#...', '#...', '####'],
    'N': ['#..#', '##.#', '##.#', '#.##', '#.##', '#..#', '#..#'], 'O': ['.##.', '#..#', '#..#', '#..#', '#..#', '#..#', '.##.'],
    'P': ['###.', '#..#', '#..#', '###.', '#...', '#...', '#...'], 'R': ['###.', '#..#', '#..#', '###.', '#.#.', '#..#', '#..#'],
    'S': ['.##.', '#..#', '#...', '.##.', '...#', '#..#', '.##.'], 'U': ['#..#', '#..#', '#..#', '#..#', '#..#', '#..#', '.##.'],
    'Z': ['####', '...#', '..#.', '.##.', '.#..', '#...', '####'],
  };
  function capsFont() {
    if (!FONTS.labelCaps) FONTS.labelCaps = new BitmapFont(Object.assign({}, FONT_SRC, CAPS), { cellH: 11, top: 2, lineH: 11, accented: ACCENTED });
    return 'labelCaps';
  }
  /** Lienzo de la caja (sin tallo) */
  function box(title, sub, kind) {
    const key = title + '|' + (sub || '') + '|' + kind;
    let c = cache.get(key); if (c) return c;
    if (cache.size > 80) cache.clear();
    const K = KINDS[kind] || KINDS.water;
    // título en mayúsculas limpias de 7 px (sin dilatar: contraformas abiertas, acentos en su fila)
    const TF = capsFont();
    const tw = PFK.measure(title, { font: TF }), sw = sub ? PFK.measure(sub, { font: 'main' }) : 0;
    const w = Math.max(tw, sw) + 10, h = sub ? 23 : 13;
    const pb = new PixelBuffer(w + 2, h + 2);
    const ox = 1, oy = 1;
    // halo exterior 1 px (oscuro del sistema), chaflanes de 1 px
    for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) {
      const corner = (x === -1 || x === w) && (y === -1 || y === h);
      if (corner) continue;
      const edge = x === -1 || x === w || y === -1 || y === h;
      const inner = x === 0 || x === w - 1 || y === 0 || y === h - 1;
      const cornerIn = (x === 0 || x === w - 1) && (y === 0 || y === h - 1);
      let col;
      if (edge) col = K.glow;
      else if (cornerIn) col = K.rim;
      else if (inner) col = K.border;
      else col = (y < 3 ? mixHex(K.fill, K.border, 0.08) : K.fill);
      PFK.put(pb, x + ox, y + oy, U(col));
    }
    PFK.text(pb, title, ox + Math.round((w - tw) / 2), oy + 3, U(K.text), { font: TF, shadow: U(mixHex(K.fill, '#000633', 0.6)) });
    if (sub) PFK.text(pb, sub, ox + Math.round((w - sw) / 2), oy + 13, U(K.sub), { font: 'main' });
    c = { c: pb.toCanvas(), w: w + 2, h: h + 2, K };
    cache.set(key, c); return c;
  }
  /* r4-labels: def.labelOffsets = {TÍTULO: {dx, dy, adx, ady, hide}} ajusta, desde el nivel, la caja (dx, dy) y el
     ancla (adx, ady) de una etiqueta del nivel o de su bioma (las del bioma se comparten y no se tocan: se deriva
     una copia por prototipo, cacheada, que conserva when/camX/sub) */
  const tweaks = new WeakMap();
  function tweak(L, d) {
    const o = d.labelOffsets && d.labelOffsets[L.title];
    if (!o) return L;
    if (o.hide) return null;
    let T = tweaks.get(L);
    if (!T || T._r4o !== o) {
      T = Object.create(L);
      T._r4o = o;
      T.x = L.x + (o.dx || 0); T.y = L.y + (o.dy || 0);
      T.ax = (L.ax ?? L.x) + (o.adx || 0); T.ay = (L.ay ?? (L.y + 8)) + (o.ady || 0);
      tweaks.set(L, T);
    }
    return T;
  }
  function list(sc) {
    const out = [];
    const d = sc.def;
    if (!d) return out;
    const add = (L) => { const T = tweak(L, d); if (T) out.push(T); };
    if (d.labels) for (const L of d.labels) add(L);
    const bl = typeof BIOME_LABELS !== 'undefined' ? BIOME_LABELS[d.biome] : null;
    if (bl) for (const L of bl) add(L);
    return out;
  }
  /** Rectángulo en pantalla de la caja de una etiqueta (o null si está fuera o no aplica) */
  function rectOf(L, cam, sc) {
    const f = L.f ?? 1, fy = L.fy ?? (f === 1 ? 1 : f * 0.3);
    const sx = Math.round(L.x - cam.x * f), sy = Math.round(L.y - cam.y * fy);
    if (sx < -120 || sx > W + 120 || sy < -40 || sy > H + 60) return null;
    if (L.when && sc && !L.when(sc)) return null;
    const sub = typeof L.sub === 'function' ? L.sub(sc) : L.sub;
    const B = box(L.title, sub, L.kind || 'water');
    return { x: sx - Math.floor(B.w / 2), y: sy - B.h, w: B.w, h: B.h, B, sub };
  }
  function drawOne(g, L, cam, sc, alpha = 1, dy = 0, dx = 0) {
    const f = L.f ?? 1, fy = L.fy ?? (f === 1 ? 1 : f * 0.3);
    const sx0 = Math.round(L.x - cam.x * f), sy = Math.round(L.y - cam.y * fy) + dy;
    if (sx0 < -120 || sx0 > W + 120 || sy < -40 || sy > H + 60) return;
    if (L.when && !L.when(sc)) return;
    const sub = typeof L.sub === 'function' ? L.sub(sc) : L.sub;
    const B = box(L.title, sub, L.kind || 'water');
    const sx = sx0 + dx, bx = sx - Math.floor(B.w / 2), by = sy - B.h;
    // tallo de 1 px hacia el objeto con remache (si la caja se desplazó en x, el tallo dobla en codo a la altura del ancla)
    const ax = Math.round((L.ax ?? L.x) - cam.x * f), ay = Math.round((L.ay ?? (L.y + 8)) - cam.y * fy);
    if (alpha < 1) g.globalAlpha = alpha;
    if (ay > sy) {
      const stx = clamp(ax, bx + 3, bx + B.w - 4);
      g.fillStyle = B.K.glow; g.fillRect(stx + 1, sy, 1, ay - sy);
      g.fillStyle = B.K.border; g.fillRect(stx, sy, 1, ay - sy);
      if (stx !== ax) { g.fillRect(Math.min(stx, ax), ay, Math.abs(ax - stx) + 1, 1); }
      g.fillStyle = B.K.border; g.fillRect(ax - 1, ay - 1, 3, 3); g.fillStyle = '#ffffff'; g.fillRect(ax, ay - 1, 1, 1);
    }
    g.drawImage(B.c, bx, by);
    if (alpha < 1) g.globalAlpha = 1;
  }
  const hit = (a, b, m = 2) => a.x < b.x + b.w + m && b.x < a.x + a.w + m && a.y < b.y + b.h + m && b.y < a.y + a.h + m;
  /** Segmentos del tallo (vertical + codo) como rectángulos de pantalla para una caja R desplazada (dx, dy) */
  function stemRects(L, cam, R, dx, dy) {
    const f = L.f ?? 1, fy = L.fy ?? (f === 1 ? 1 : f * 0.3);
    const ax = Math.round((L.ax ?? L.x) - cam.x * f), ay = Math.round((L.ay ?? (L.y + 8)) - cam.y * fy);
    const bx = R.x + dx, sy = R.y + dy + R.h - 1;
    if (ay <= sy) return [];
    const stx = clamp(ax, bx + 4, bx + R.w - 3);
    const out = [{ x: stx - 1, y: sy, w: 3, h: ay - sy + 2 }];
    if (stx !== ax) out.push({ x: Math.min(stx, ax) - 1, y: ay - 1, w: Math.abs(ax - stx) + 3, h: 3 });
    return out;
  }
  /** Cajas en pantalla de la jugadora, KIRU y los actores visibles (obstáculos blandos: se evitan si se puede) */
  function actorRects(sc, cam) {
    const out = [];
    if (!sc || !sc.world || !sc.world.entities) return out;
    for (const e of sc.world.entities) {
      if (e.hidden || e.dead) continue;
      const isK = (typeof Kiru !== 'undefined' && e instanceof Kiru), isP = (typeof Player !== 'undefined' && e instanceof Player);
      if (!isK && !isP && !(typeof Actor !== 'undefined' && e instanceof Actor)) continue;
      const x = Math.round(e.x - cam.x), y = Math.round(e.y - cam.y) + (isK ? (e.dropY || 0) : 0);
      if (x < -40 || x > W + 40) continue;
      if (isK) out.push({ x: x - 22, y: y - 114, w: 44, h: 62 });
      else out.push({ x: x - 16, y: y - 74, w: 32, h: 72 });
    }
    return out;
  }
  // desplazamientos candidatos [dx, dy]: primero en vertical (las lejanas solo suben), luego en horizontal
  const NEAR_TRY = [[0, 0]], FAR_TRY = [[0, 0]];
  for (let d = -3; d >= -18; d -= 3) { NEAR_TRY.push([0, d]); FAR_TRY.push([0, d]); }
  for (let d = 3; d <= 30; d += 3) NEAR_TRY.push([0, d]);
  for (let k = 8; k <= 80; k += 8) for (const sgn of [1, -1]) {
    for (const d of [0, -9, 9, 18]) NEAR_TRY.push([k * sgn, d]);
    if (k <= 40) for (const d of [0, -9]) FAR_TRY.push([k * sgn, d]);
  }
  /** Punto de anclaje del tallo en pantalla */
  function anchorOf(L, cam) {
    const f = L.f ?? 1, fy = L.fy ?? (f === 1 ? 1 : f * 0.3);
    return { x: Math.round((L.ax ?? L.x) - cam.x * f), y: Math.round((L.ay ?? (L.y + 8)) - cam.y * fy) };
  }
  /** r4-labels: zonas del HUD de este cuadro (las del cuadro anterior, que es cuando se dibujaron): retrato, objetivo,
      minimapa y botones (UIK._hudRects), instrumentos inferiores (hudGauges) y avisos del Atlas abajo a la derecha */
  function hudZones() {
    const out = (typeof UIK !== 'undefined' && UIK._hudRects) ? UIK._hudRects.map(r => ({ x: r.x, y: r.y, w: r.w, h: r.h, hud: 1 })) : [];
    const fr = typeof Game !== 'undefined' ? Game.frame : 0;
    if (R4LBL_SEEN.plates.f >= fr - 3) for (const r of R4LBL_SEEN.plates.r) out.push({ x: r.x - 2, y: r.y - 2, w: r.w + 4, h: r.h + 4, hud: 1 });
    const n = (typeof Game !== 'undefined' && Game.toasts) ? Game.toasts.length : 0;
    if (n) out.push({ x: W - 310, y: H - 30 - 23 * (n - 1), w: 310, h: 23 * (n - 1) + 24, hud: 1 });
    return out;
  }
  /**
   * Dibuja todas las etiquetas sin solapes: primero las del plano jugable (f = 1), luego las lejanas.
   * Obstáculos duros (caja y tallo): el HUD (también instrumentos inferiores y avisos), las cajas y los tallos ya
   * colocados y los rótulos horneados del nivel (def.labelAvoid: [{x, y, w, h}] en coordenadas de mundo).
   * Obstáculos blandos (solo la caja): la jugadora, KIRU, los NPC y los globos de diálogo del cuadro anterior.
   * Cada etiqueta prueba su sitio, el desplazamiento del cuadro anterior (histéresis) y luego desplazamientos
   * verticales y horizontales (±8..±80 px; ±40 las lejanas); toma el primero libre de todo; si no lo hay, el primero
   * libre de obstáculos duros; si tampoco, no se dibuja. La caja nunca baja hasta su ancla (el tallo se ve siempre)
   * y una etiqueta cuyo objeto queda fuera del encuadre o bajo el HUD no se dibuja (su tallo no señalaría nada).
   * L.camX = [x0, x1] limita una etiqueta a un tramo de cámara (fundido de 40 px en los bordes).
   * Títulos repetidos en pantalla se dibujan una sola vez.
   */
  function draw(g, sc) {
    const cam = sc.cam ? { x: sc.cam.ox, y: sc.cam.oy } : { x: 0, y: 0 };
    const all = list(sc).slice().sort((a, b) => ((b.f ?? 1) === 1) - ((a.f ?? 1) === 1) || (b.prio || 0) - (a.prio || 0));
    const hud = hudZones(), placed = hud.slice();
    const soft = actorRects(sc, cam);
    const fr = typeof Game !== 'undefined' ? Game.frame : 0;
    if (R4LBL_SEEN.bubbles.f >= fr - 3) for (const r of R4LBL_SEEN.bubbles.r) soft.push(r);
    // rótulos horneados en el mundo que las etiquetas (caja y tallo) no deben tapar
    const signs = [];
    if (sc.def && sc.def.labelAvoid) for (const r of sc.def.labelAvoid) { const x = Math.round(r.x - cam.x), y = Math.round(r.y - cam.y); if (x < W && x + r.w > 0 && y < H && y + r.h > 0) signs.push({ x, y, w: r.w, h: r.h }); }
    const underHud = (p) => hud.some(z => p.x >= z.x - 1 && p.x <= z.x + z.w && p.y >= z.y - 1 && p.y <= z.y + z.h);
    const seen = new Set();
    for (const L of all) {
      let alpha = 1;
      if (L.camX) {
        const [c0, c1] = L.camX;
        if (cam.x < c0 - 40 || cam.x > c1 + 40) continue;
        alpha = clamp(Math.min(cam.x - (c0 - 40), (c1 + 40) - cam.x) / 40, 0, 1);
        if (alpha <= 0.05) continue;
      }
      const R = rectOf(L, cam, sc); if (!R) continue;
      if (R.x < 1 || R.x + R.w > W - 1) continue; // cortada por el borde del encuadre: no se dibuja a medias
      if (seen.has(L.title)) continue;
      // el ancla (lo que la etiqueta nombra) debe verse: dentro del encuadre y fuera del HUD
      const A = anchorOf(L, cam), stem = A.y > R.y + R.h;
      if (stem && (A.x < 2 || A.x > W - 3 || A.y > H - 3 || underHud(A))) { L._fixlaOff = null; continue; }
      const far = (L.f ?? 1) !== 1, m = far ? 4 : 2;
      let best = null, fallback = null;
      // histéresis: tras su sitio se prueba el desplazamiento del cuadro anterior (evita saltos entre opciones equivalentes)
      const base = far ? FAR_TRY : NEAR_TRY;
      const tries = L._fixlaOff ? [base[0], L._fixlaOff].concat(base.slice(1)) : base;
      for (const [dx, dy] of tries) {
        const R2 = { x: R.x + dx, y: R.y + dy, w: R.w, h: R.h };
        if (R2.x < 1 || R2.x + R2.w > W - 1 || R2.y < 1 || R2.y + R2.h > H - 2) continue;
        if (stem && R2.y + R2.h > A.y - 4) continue; // la caja no tapa su ancla: queda un tallo visible
        if (placed.some(p => hit(R2, p, p.hud ? 2 : m))) continue;
        if (signs.some(s => hit(R2, s, 1))) continue;
        const st = stemRects(L, cam, R, dx, dy);
        if (st.some(s => placed.some(p => hit(s, p, 0)) || signs.some(q => hit(s, q, 0)))) continue;
        if (!fallback) fallback = { dx, dy, R2, st };
        if (!soft.some(a => hit(R2, a, 1))) { best = { dx, dy, R2, st }; break; }
      }
      const P_ = best || fallback;
      if (!P_) { L._fixlaOff = null; continue; }
      L._fixlaOff = (P_.dx || P_.dy) ? [P_.dx, P_.dy] : null;
      placed.push(P_.R2);
      for (const s of P_.st) placed.push(s);
      seen.add(L.title);
      drawOne(g, L, cam, sc, alpha, P_.dy, P_.dx);
    }
  }
  function gallery(g) {
    const kinds = Object.keys(KINDS);
    kinds.forEach((k, i) => drawOne(g, { x: 60 + i * 100, y: 300, title: k === 'water' ? 'CAPTACIÓN' : k === 'brine' ? 'SALMUERA' : k === 'green' ? 'HIDRÓGENO VERDE' : k.toUpperCase(), sub: i % 2 ? '(Permeado)' : null, kind: k, ay: 330 }, { x: 0, y: 0 }, null));
  }
  return { draw, drawOne, box, KINDS, gallery };
})();
