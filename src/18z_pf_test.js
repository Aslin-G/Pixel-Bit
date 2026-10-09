/* =====================================================================
   18z_pf_test.js — Galería del kit PF para comparar con la referencia.
   Uso: ?test=scene&s=PF_KIT_TEST&p={"page":"flora"}
   ===================================================================== */
const PF_KIT_TEST = {
  enter(p) { this.page = (p && p.page) || 'flora'; this.c = null; this.t = 0; },
  update(dt) { this.t += dt; },
  build() {
    const pb = new PixelBuffer(W, H);
    pb.rect(0, 0, W, H, '#5d8ddf');
    pb.rect(0, 250, W, H - 250, '#c58440');
    if (this.page === 'flora') {
      PFFlora.palm(pb, 40, 250, 70, -8, 3);
      PFFlora.palm(pb, 110, 250, 55, 6, 5);
      PFFlora.bush(pb, 170, 250, 30, 18, RAMP.foliageR, 7);
      PFFlora.tuft(pb, 210, 250, 12, 12, 9);
      PFFlora.lupine(pb, 230, 250, 22, 11); PFFlora.lupine(pb, 235, 250, 18, 12);
      PFFlora.hibiscusBush(pb, 270, 250, 26, 20, 13);
      PFFlora.fern(pb, 310, 250, 16, 15);
      PFFlora.agave(pb, 340, 250, 12, 17);
      PFFlora.flowerPatch(pb, 370, 250, 18, 19);
      PFFlora.tree(pb, 430, 250, 60, 21);
      const fg = PFFlora.fgClump(120, 90, 23); PFK.blit(pb, fg, 500, 270);
      const cn = PFFlora.canopy(200, 60, 25, { side: -1 }); PFK.blit(pb, cn, 0, 0);
      PFFlora.cluster(pb, 560, 120, 20, 14, RAMP.foliageR, 27);
    }
    if (this.page === 'terrain' && typeof PFTerrain !== 'undefined') PFTerrain.gallery && PFTerrain.gallery(pb);
    if (this.page === 'infra' && typeof PFInfra !== 'undefined') PFInfra.gallery && PFInfra.gallery(pb);
    this.c = pb.toCanvas();
  },
  render(g) {
    if (!this.c) this.build();
    g.drawImage(this.c, 0, 0);
    if (this.page === 'labels' && typeof WorldLabels !== 'undefined') WorldLabels.gallery(g);
    if (this.page === 'fauna' && typeof PFFauna !== 'undefined') PFFauna.gallery(g, this.t);
    if (this.page === 'stations') ['terminal', 'sensor', 'sim', 'solo', 'valve', 'book', 'clue'].forEach((k, i) => { drawStationSprite(g, k, 40 + i * 60, 250, { glow: '#56e5ff', progress: 2 }); if (i === 6) PFStations.drawEcho(g, 40 + 7 * 60, 230, this.t); });
  },
};
