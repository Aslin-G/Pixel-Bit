/* =====================================================================
   18f_pf_signs.js — Señalética del plano jugable (kit PF).
   · PFSigns.post(pb, x, yGround, items): poste de madera con tablones
     en flecha (veta, clavos, texto crema con sombra) como en la referencia.
   · WorldLabels.draw(g, sc): etiquetas científicas en el mundo (relleno
     navy, borde 1 px del color del sistema + halo, MAYÚSCULAS en negrita,
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
  /** Lienzo de la caja (sin tallo) */
  function box(title, sub, kind) {
    const key = title + '|' + (sub || '') + '|' + kind;
    let c = cache.get(key); if (c) return c;
    if (cache.size > 80) cache.clear();
    const K = KINDS[kind] || KINDS.water;
    const tw = PFK.measure(title, { font: 'tiny', bold: true }), sw = sub ? PFK.measure(sub, { font: 'main' }) : 0;
    const w = Math.max(tw, sw) + 10, h = sub ? 21 : 11;
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
    PFK.text(pb, title, ox + Math.round((w - tw) / 2), oy + 3, U(K.text), { font: 'tiny', bold: true });
    if (sub) PFK.text(pb, sub, ox + Math.round((w - sw) / 2), oy + 11, U(K.sub), { font: 'main' });
    c = { c: pb.toCanvas(), w: w + 2, h: h + 2, K };
    cache.set(key, c); return c;
  }
  function list(sc) {
    const out = [];
    const d = sc.def;
    if (d && d.labels) for (const L of d.labels) out.push(L);
    const bl = (typeof BIOME_LABELS !== 'undefined' && d) ? BIOME_LABELS[d.biome] : null;
    if (bl) for (const L of bl) out.push(L);
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
  function drawOne(g, L, cam, sc, alpha = 1, dy = 0) {
    const f = L.f ?? 1, fy = L.fy ?? (f === 1 ? 1 : f * 0.3);
    const sx = Math.round(L.x - cam.x * f), sy = Math.round(L.y - cam.y * fy) + dy;
    if (sx < -120 || sx > W + 120 || sy < -40 || sy > H + 60) return;
    if (L.when && !L.when(sc)) return;
    const sub = typeof L.sub === 'function' ? L.sub(sc) : L.sub;
    const B = box(L.title, sub, L.kind || 'water');
    const bx = sx - Math.floor(B.w / 2), by = sy - B.h;
    // tallo de 1 px hacia el objeto con remache
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
  /**
   * Dibuja todas las etiquetas sin solapes: primero las del plano jugable (f = 1), luego las lejanas.
   * Una etiqueta lejana que choca con otra ya colocada o con el HUD sube hasta 18 px; si aún choca, se omite.
   * L.camX = [x0, x1] limita una etiqueta a un tramo de cámara (fundido de 40 px en los bordes).
   * Títulos repetidos en pantalla se dibujan una sola vez.
   */
  function draw(g, sc) {
    const cam = sc.cam ? { x: sc.cam.ox, y: sc.cam.oy } : { x: 0, y: 0 };
    const all = list(sc).slice().sort((a, b) => ((b.f ?? 1) === 1) - ((a.f ?? 1) === 1) || (b.prio || 0) - (a.prio || 0));
    const placed = (typeof UIK !== 'undefined' && UIK._hudRects) ? UIK._hudRects.map(r => ({ x: r.x, y: r.y, w: r.w, h: r.h, hud: 1 })) : [];
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
      const far = (L.f ?? 1) !== 1;
      let dy = 0, ok = !placed.some(p => hit(R, p));
      if (!ok && far) for (dy = -3; dy >= -18; dy -= 3) { const R2 = Object.assign({}, R, { y: R.y + dy }); if (!placed.some(p => hit(R2, p))) { ok = true; break; } }
      if (!ok && far) continue;
      // las del plano jugable se dibujan siempre (son del guion): si chocan, bajan hacia su objeto
      if (!ok) { ok = false; for (dy = 3; dy <= 30; dy += 3) { const R2 = Object.assign({}, R, { y: R.y + dy }); if (!placed.some(p => hit(R2, p))) { ok = true; break; } } if (!ok) dy = 0; }
      placed.push({ x: R.x, y: R.y + dy, w: R.w, h: R.h });
      seen.add(L.title);
      drawOne(g, L, cam, sc, alpha, dy);
    }
  }
  function gallery(g) {
    const kinds = Object.keys(KINDS);
    kinds.forEach((k, i) => drawOne(g, { x: 60 + i * 100, y: 300, title: k === 'water' ? 'CAPTACIÓN' : k === 'brine' ? 'SALMUERA' : k === 'green' ? 'HIDRÓGENO VERDE' : k.toUpperCase(), sub: i % 2 ? '(Permeado)' : null, kind: k, ay: 330 }, { x: 0, y: 0 }, null));
  }
  return { draw, drawOne, box, KINDS, gallery };
})();
