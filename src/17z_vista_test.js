/* =====================================================================
   17z_vista_test.js — Banco de pruebas del panorama (solo fondo).
   Uso: ?test=scene&s=VISTA_TEST&p={"lv":1,"cx":0,"cy":50,"guide":1}
     cx, cy: cámara del plano jugable; guide: línea del suelo jugable (y 216)
   ===================================================================== */
const VISTA_TEST = {
  enter(p) {
    p = p || {};
    this.p = p;
    const def = LEVELS[p.lv || 1];
    const t0 = nowMs();
    this.B = (BIOMES[p.biome || def.biome] || BIOMES.coast)(def);
    this.ms = Math.round(nowMs() - t0);
    this.cam = { x: p.cx || 0, y: p.cy ?? VISTA.CAMY };
    this.t = 0;
    window.__vistaMs = this.ms; window.__vistaStats = VISTA.stats.ms;
  },
  update(dt) { this.t += dt; if (this.p.pan) this.cam.x = (this.p.cx || 0) + this.t * this.p.pan; },
  render(g) {
    const B = this.B, cam = this.cam;
    if (B.sky) g.drawImage(B.sky, 0, Math.round(-cam.y * 0.05));
    B.drawClouds(g, cam, 1);
    B.render(g, cam, 'back');
    if (typeof WorldLabels !== 'undefined' && this.p.labels) WorldLabels.draw(g, { def: { biome: this.p.biome || LEVELS[this.p.lv || 1].biome, labels: [] }, cam: { ox: cam.x, oy: cam.y }, state: {} });
    if (this.p.guide) { g.fillStyle = 'rgba(255,0,255,0.6)'; g.fillRect(0, 216, W, 1); g.fillRect(0, 198, W, 1); }
    if (this.p.info) drawText(g, 'prerender ' + this.ms + ' ms  cam ' + Math.round(cam.x), 6, 4, { color: '#ffffff', shadow: '#000000' });
  },
};
