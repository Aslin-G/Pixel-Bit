/* =====================================================================
   18g_pf_fauna.js — Fauna y drones del plano jugable (kit PF).
   Tiras prerenderizadas: águila pescadora (28×14, 4 cuadros de aleteo y
   planeo), gaviota (11×6, 4 cuadros), dron de servicio (17×9, rotor de
   2 cuadros + LED). Bandadas en espacio de mundo con parallax leve.
   def.pf.fauna = { gulls:[{x,y,n}], eagle:{x0,x1,y}, drones:[{x,y,r}] }
   ===================================================================== */
const PFFauna = (() => {
  let EAGLE = null, GULL = null, DRONE = null;
  function eagleStrip() {
    const BR = PFK.P32(['#1e0f08', '#3a2010', '#5c3618', '#80522a', '#a8743e', '#d0a060']);
    return PFK.strip(4, 30, 15, (pb, i) => {
      const lift = [-5, -1, 3, -1][i], cx = 15, cy = 8;
      // alas (polígonos con plumas primarias digitadas)
      for (const sd of [-1, 1]) {
        const tipX = cx + sd * 14, tipY = cy + lift;
        PFK.polyFill(pb, [[cx, cy - 1], [cx + sd * 6, cy - 2 + lift * 0.4], [tipX, tipY], [tipX - sd * 2, tipY + 2], [cx + sd * 5, cy + 2]], (x, y) => BR[clamp(Math.round(3.2 - (y - (cy + lift * 0.5)) * 0.5 + (Math.abs(x - cx) > 8 ? -1 : 0)), 0, 5)]);
        for (let f = 0; f < 4; f++) { const fx = tipX - sd * (f * 2), fy = tipY + 1 + f * 0.6; PFK.put(pb, Math.round(fx), Math.round(fy + 1), BR[0]); PFK.put(pb, Math.round(fx + sd), Math.round(fy + 1), BR[1]); }
        // borde de ataque iluminado
        PFK.lineFn(pb, cx + sd * 2, cy - 2, tipX - sd, tipY - 1 + (lift < 0 ? 0 : 0), () => BR[5]);
      }
      // cuerpo, cola y cabeza blanca con pico amarillo
      PFK.ellipseFn(pb, cx, cy + 1, 3, 2, (nx, ny) => BR[ny < 0 ? 4 : 2]);
      for (let k = 0; k < 4; k++) for (let q = -1 - (k >> 1); q <= 1 + (k >> 1); q++) PFK.put(pb, cx + q, cy + 3 + k, BR[k === 3 ? 1 : 3]);
      PFK.put(pb, cx - 1, cy - 2, U('#fff6e8')); PFK.put(pb, cx, cy - 2, U('#ffffff')); PFK.put(pb, cx + 1, cy - 2, U('#e8dcc8')); PFK.put(pb, cx, cy - 3, U('#fff6e8'));
      PFK.put(pb, cx + 1, cy - 3, U('#f0b030')); PFK.put(pb, cx - 1, cy - 1, U('#2a1408'));
    });
  }
  function gullStrip() {
    return PFK.strip(4, 11, 6, (pb, i) => {
      const lift = [-2, 0, 2, 0][i];
      const W_ = U('#f4f6fb'), G = U('#a8b4c8'), K = U('#262a36');
      for (const sd of [-1, 1]) for (let k = 1; k <= 5; k++) { const y = 3 + Math.round(lift * (k / 5)) - (k < 3 ? (lift < 0 ? 0 : 0) : 0); PFK.put(pb, 5 + sd * k, y, k === 5 ? K : k > 2 ? G : W_); if (k < 4) PFK.put(pb, 5 + sd * k, y + 1, G); }
      PFK.put(pb, 5, 3, W_); PFK.put(pb, 5, 4, W_); PFK.put(pb, 6, 3, U('#f0b030'));
    });
  }
  function droneStrip() {
    const S = PFK.P32(['#141820', '#2a3040', '#4a5468', '#8f8f95', '#d3ccc5', '#f2efea']);
    return PFK.strip(2, 19, 10, (pb, i) => {
      // brazos y rotores borrosos
      for (const sd of [-1, 1]) {
        for (let k = 2; k <= 7; k++) PFK.put(pb, 9 + sd * k, 4, S[2]);
        PFK.put(pb, 9 + sd * 7, 3, S[1]);
        const L = i ? 4 : 2;
        for (let k = -L; k <= L; k++) PFK.put(pb, 9 + sd * 7 + k, 2, U(Math.abs(k) === L ? '#9ab0c4' : '#e8f0f8'));
      }
      // cuerpo blanco y naranja con cámara y LED
      for (let y = 3; y < 7; y++) for (let x = 5; x < 14; x++) PFK.put(pb, x, y, y === 3 ? S[5] : y === 6 ? S[2] : (x < 7 ? U('#ff9f43') : S[4]));
      PFK.put(pb, 9, 7, S[1]); PFK.put(pb, 9, 8, U('#17f3f7')); PFK.put(pb, 10, 7, S[0]);
      PFK.put(pb, 12, 4, i ? U('#3fe0a0') : U('#1a6a50'));
    });
  }
  function ensure() { if (!EAGLE) { EAGLE = eagleStrip(); GULL = gullStrip(); DRONE = droneStrip(); } }
  /** Fauna del plano (después del fondo lejano, antes de los accesorios del mundo) */
  function renderSky(g, sc) {
    ensure();
    const P = (sc.def.pf && sc.def.pf.fauna) || {}, cam = sc.cam, t = Game.time;
    const ox = cam.ox, oy = cam.oy;
    // águila: planea en grandes curvas y aletea de vez en cuando
    if (P.eagle) {
      const E = P.eagle, span = E.x1 - E.x0;
      const u = (t * 0.035) % 1, x = E.x0 + (0.5 - 0.5 * Math.cos(u * TAU)) * span, y = E.y + Math.sin(u * TAU * 2) * 14;
      const flap = (t % 6) < 1.2 ? Math.floor(t * 7) % 4 : 1;
      const dir = Math.sin(u * TAU) >= 0 ? 1 : -1;
      PFK.drawStrip(g, EAGLE, flap, Math.round(x - ox * 0.92 - 15), Math.round(y - oy * 0.92), dir < 0);
    }
    // gaviotas en bandadas sueltas
    for (const G of (P.gulls || [])) for (let i = 0; i < (G.n || 3); i++) {
      const sp = 14 + i * 3, ph = i * 1.9 + G.x * 0.01;
      const x = G.x + ((t * sp + i * 37) % 260) - 130, y = G.y + Math.sin(t * 0.9 + ph) * 6 + i * 5;
      PFK.drawStrip(g, GULL, Math.floor(t * 8 + ph * 3), Math.round(x - ox * 0.95), Math.round(y - oy * 0.95), false);
    }
    // drones de servicio (balanceo, LED)
    for (const D of (P.drones || [])) {
      const x = D.x + Math.sin(t * 0.4 + D.x) * (D.r || 20), y = D.y + Math.sin(t * 1.3 + D.x) * 2;
      PFK.drawStrip(g, DRONE, Math.floor(t * 30) % 2, Math.round(x - ox - 9), Math.round(y - oy - 5));
    }
  }
  function drawDroneAt(g, x, y, t, flying) { ensure(); PFK.drawStrip(g, DRONE, flying ? Math.floor(t * 30) % 2 : 0, Math.round(x - 9), Math.round(y - 8 + (flying ? Math.round(Math.sin(t * 6)) : 0))); }
  function gallery(g, t) {
    ensure();
    for (let i = 0; i < 4; i++) { PFK.drawStrip(g, EAGLE, i, 20 + i * 40, 20); PFK.drawStrip(g, GULL, i, 20 + i * 20, 50); }
    PFK.drawStrip(g, DRONE, Math.floor(t * 30) % 2, 200, 20);
  }
  return { renderSky, drawDroneAt, gallery };
})();
