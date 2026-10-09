/* =====================================================================
   18i_pf_stations.js — Aspecto de estaciones interactivas y coleccionables (kit PF).
   Cuerpos prerenderizados en 3/4 (acero blanco cálido, contorno selectivo,
   especular, LED) + partes animadas mínimas por cuadro (pantallas, ondas,
   pulsos). Mantiene las huellas y alturas de los sprites anteriores para
   que los avisos de interacción (hY) sigan en su sitio.
   drawStationSprite(g, kind, x, y, st) delega aquí si existe PFStations.
   ===================================================================== */
const PFStations = (() => {
  const cache = new Map();
  const S = () => PFK.P32(PFInfra.STEEL);
  function body(kind) {
    let c = cache.get(kind); if (c) return c;
    let pb, ox, oy;
    if (kind === 'terminal') {
      pb = new PixelBuffer(24, 36); ox = 12; oy = 35;
      PFInfra.box3q(pb, 5, 35, 14, 3, 4, { ramp: PFTerrain.CONC });
      PFInfra.box3q(pb, 6, 32, 12, 18, 4, { ramp: PFInfra.STEEL });
      // cabezal inclinado con pantalla
      PFK.polyFill(pb, [[4, 14], [19, 14], [21, 5], [6, 5]], (x, y) => S()[y < 7 ? 6 : 4]);
      PFK.polyFill(pb, [[6, 13], [17, 13], [19, 7], [8, 7]], U('#06122a'));
      for (let x = 4; x < 20; x++) PFK.put(pb, x, 14, U('#2a282e'));
      // teclado y placa
      for (let x = 8; x < 16; x += 2) PFK.put(pb, x, 18, U('#4f4d51'));
      PFK.put(pb, 9, 22, U('#ff5a4a')); PFK.put(pb, 12, 22, U('#3fe0a0')); PFK.put(pb, 15, 22, U('#ffd84a'));
      PFK.selOut(pb, -0.6, 'lrb');
    } else if (kind === 'sensor') {
      pb = new PixelBuffer(18, 38); ox = 9; oy = 37;
      for (let y = 12; y < 37; y++) { PFK.put(pb, 8, y, S()[5]); PFK.put(pb, 9, y, S()[2]); }
      PFInfra.box3q(pb, 3, 16, 10, 8, 3, { ramp: PFInfra.STEEL });
      for (let y = 10; y < 14; y++) for (let x = 5; x < 11; x++) PFK.put(pb, x, y, U(y === 10 ? '#7cdfec' : '#0a3a5a'));
      PFInfra.pvPanel(pb, 2, 5, 9, 3);
      for (let y = 0; y < 6; y++) PFK.put(pb, 14, y, U('#c8d8e0')); PFK.put(pb, 14, 0, U('#ff4e5d'));
      for (let x = 4; x < 14; x++) PFK.put(pb, x, 37, U('#2a282e'));
      PFK.selOut(pb, -0.6, 'lrb');
    } else if (kind === 'sim') {
      pb = new PixelBuffer(40, 40); ox = 20; oy = 39;
      PFInfra.box3q(pb, 3, 39, 32, 4, 5, { ramp: PFTerrain.CONC });
      PFInfra.box3q(pb, 4, 35, 30, 14, 6, { ramp: ['#141a28', '#22304a', '#34507a', '#4a6ea0', '#7a9cc8', '#b8d0ea'] });
      // monitor grande
      PFK.polyFill(pb, [[5, 21], [33, 21], [35, 3], [7, 3]], (x, y) => PFK.P32(PFInfra.STEEL)[y < 5 ? 6 : 3]);
      PFK.polyFill(pb, [[7, 19], [31, 19], [33, 5], [9, 5]], U('#04102a'));
      for (let x = 10; x < 18; x += 3) { PFK.put(pb, x, 27, U('#ffd84a')); PFK.put(pb, x + 1, 27, U('#c89020')); }
      for (let x = 20; x < 30; x += 3) { PFK.put(pb, x, 27, U('#3fe0a0')); PFK.put(pb, x + 1, 27, U('#1a8a60')); }
      PFK.selOut(pb, -0.6, 'lrb');
    } else if (kind === 'solo') {
      pb = new PixelBuffer(36, 52); ox = 18; oy = 51;
      const ST = ['#120a24', '#1e1238', '#2e1d53', '#433c7b', '#6b5aa8', '#9a8ad0', '#c8bcf0'];
      PFInfra.box3q(pb, 2, 51, 32, 4, 6, { ramp: PFTerrain.CONC });
      // pilares y dintel de piedra violeta
      for (const px of [4, 26]) PFInfra.box3q(pb, px, 47, 6, 40, 4, { ramp: ST });
      PFInfra.box3q(pb, 2, 11, 32, 6, 5, { ramp: ST });
      for (let y = 12; y < 47; y++) for (let x = 10; x < 26; x++) PFK.put(pb, x, y, U(y < 14 ? '#2a1a66' : '#0a0718'));
      for (const [x, y] of [[6, 18], [6, 26], [6, 34], [28, 22], [28, 30], [28, 38]]) { PFK.put(pb, x, y, U('#b49cff')); PFK.put(pb, x + 1, y, U('#e6dcff')); }
      PFK.selOut(pb, -0.6, 'lrb');
    } else if (kind === 'valve') {
      pb = new PixelBuffer(26, 24); ox = 13; oy = 23;
      PFInfra.pipe(pb, [[1, 18], [25, 18]], 3, 'steel', { flange: 0 });
      PFInfra.box3q(pb, 9, 22, 8, 8, 3, { ramp: PFInfra.STEEL });
      for (let y = 6; y < 14; y++) { PFK.put(pb, 12, y, S()[5]); PFK.put(pb, 13, y, S()[2]); }
    } else if (kind === 'book') {
      pb = new PixelBuffer(20, 22); ox = 10; oy = 21;
      const Wd = ['#2a1408', '#4a2a14', '#6e4422', '#8e5e32', '#b07e4a', '#d0a46a'];
      for (let y = 10; y < 21; y++) { PFK.put(pb, 9, y, U(Wd[4])); PFK.put(pb, 10, y, U(Wd[2])); }
      PFK.polyFill(pb, [[2, 11], [18, 11], [16, 4], [4, 4]], (x, y) => U(x < 10 ? '#f4ecdc' : '#e2d8c6'));
      for (let y = 5; y < 11; y++) PFK.put(pb, 10, y, U('#7a1f36'));
      for (let x = 5; x < 9; x++) { PFK.put(pb, x, 7, U('#b8a890')); PFK.put(pb, x, 9, U('#b8a890')); }
      for (let x = 2; x < 19; x++) PFK.put(pb, x, 11, U('#7a1f36'));
      PFK.selOut(pb, -0.6, 'lrb');
    }
    if (!pb) return null;
    c = { c: pb.toCanvas(), ox, oy };
    cache.set(kind, c); return c;
  }
  function draw(g, kind, x, y, st) {
    const t = Game.time, glow = st.glow || '#56e5ff';
    const B = body(kind);
    if (!B) return false;
    g.drawImage(B.c, x - B.ox, y - B.oy);
    if (kind === 'terminal') {
      g.fillStyle = glow; for (let i = 0; i < 3; i++) g.fillRect(x - 4 + i, y - 27 + i * 2, 3 + ((i * 5 + Math.floor(t * 4)) % 7), 1);
      if (!st.done && (Math.floor(t * 2) % 2)) { g.fillStyle = glow; g.fillRect(x + 6, y - 33, 1, 1); PFK.drawGlow(g, x + 6.5, y - 32.5, 3, glow, 0.6); }
    } else if (kind === 'sensor') {
      g.fillStyle = (Math.floor(t * 3) % 2) ? glow : '#106884'; g.fillRect(x - 3, y - 25, 2, 2);
      for (let i = 0; i < 2; i++) { const r = ((t * 14 + i * 6) % 12); g.globalAlpha = 1 - r / 12; g.fillStyle = glow; for (let a = -3; a <= 3; a++) g.fillRect(Math.round(x + 5 + Math.sin(a * 0.3) * r), Math.round(y - 37 - Math.cos(a * 0.3) * r * 0.6), 1, 1); g.globalAlpha = 1; }
    } else if (kind === 'sim') {
      g.fillStyle = glow;
      for (let i = 0; i < 22; i++) g.fillRect(x - 11 + i, Math.round(y - 27 + Math.sin(i * 0.5 + t * 3) * 4), 1, 1);
      g.fillStyle = '#ffd84a'; for (let i = 0; i < 22; i += 2) g.fillRect(x - 11 + i, Math.round(y - 25 + Math.cos(i * 0.3 + t * 2) * 3), 1, 1);
    } else if (kind === 'solo') {
      for (let i = 0; i < 5; i++) { const on = (st.progress || 0) > i; g.fillStyle = on ? '#ffe14d' : '#3f2690'; g.fillRect(x - 9 + i * 4, y - 45, 3, 2); }
      g.fillStyle = st.done ? '#3fe0a0' : '#b49cff';
      for (let i = 0; i < 8; i++) g.fillRect(x - 7 + ((i * 5 + Math.floor(t * 6)) % 14), y - 34 + i * 4, 1, 1);
      g.globalAlpha = 0.18 + 0.1 * Math.sin(t * 2); g.fillStyle = st.done ? '#3fe0a0' : '#8d6bff'; g.fillRect(x - 8, y - 37, 16, 33); g.globalAlpha = 1;
      drawText(g, 'SOLO', x, y - 60, { font: 'tiny', align: 'center', color: '#ffe14d', shadow: '#0a0718' });
    } else if (kind === 'valve') {
      const a = st.done ? 1.2 : 0;
      for (let k = 0; k < 4; k++) { const an = a + k * Math.PI / 2; fline(g, x, y - 18, x + Math.cos(an) * 6, y - 18 + Math.sin(an) * 2.5, '#e04a3a'); }
      fpx(g, x, y - 18, '#ff8a6a');
    }
    return true;
  }
  /** Coleccionable eco de KIRU: cristal facetado violeta con anillo orbital */
  function drawEcho(g, x, y, t) {
    const b = Math.round(Math.sin(t * 3) * 1);
    PFK.drawGlow(g, x, y + b, 9, '#8d6bff', 0.55);
    const pts = [[0, -6], [4, -1], [0, 6], [-4, -1]];
    g.fillStyle = '#3f2690'; g.beginPath(); g.moveTo(x + pts[0][0], y + b + pts[0][1]); for (const p of pts) g.lineTo(x + p[0], y + b + p[1]); g.fill();
    frect(g, x - 2, y + b - 4, 2, 7, '#b49cff'); frect(g, x, y + b - 4, 2, 5, '#8d6bff'); frect(g, x - 1, y + b - 4, 1, 2, '#f4f0ff');
    for (let k = 0; k < 5; k++) { const a = t * 2 + k * 1.256; fpx(g, x + Math.cos(a) * 9, y + b + Math.sin(a) * 3, k % 2 ? '#b49cff' : '#e6dcff'); }
  }
  return { draw, drawEcho, body };
})();
