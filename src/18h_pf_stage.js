/* =====================================================================
   18h_pf_stage.js — Orquestación del plano jugable (kit PF).
   GameplayScene llama a estos ganchos solo si el nivel define def.pf:
     PFStage.build(sc)            → prerender de agua, oclusores frontales
     PFStage.renderBack(g, sc)    → fauna lejana del plano (gaviotas, águila)
     PFStage.renderWaterBack(g,sc)→ cortes submarinos (detrás del terreno)
     PFStage.renderWaterFront(g,sc)→ cresta, espuma y superficie (tras entidades)
     PFStage.renderFrontPlane(g,sc)→ oclusores f≈1,3 en los bordes del encuadre
   ===================================================================== */
const PFStage = (() => {
  function build(sc) {
    const def = sc.def, P = def.pf || {};
    const st = { fg: [], water: [], t0: nowMs() };
    // oclusores del plano frontal
    for (const o of (P.fg || [])) {
      let pb;
      if (o.kind === 'canopy') pb = PFFlora.canopy(o.w || 220, o.h || 70, o.seed || 1, { side: o.side || -1, n: o.n, vines: o.vines });
      else pb = PFFlora.fgClump(o.w || 110, o.h || 80, o.seed || 1, o);
      st.fg.push({ c: pb.toCanvas(), x: o.x, y: o.y ?? 0, f: o.f || 1.3, w: pb.w, h: pb.h, top: o.kind === 'canopy', sway: o.sway ?? 1, ph: (o.seed || 1) * 0.7 });
    }
    if (typeof PFWater !== 'undefined') for (const w of sc.world.water) if (w.pf) st.water.push(PFWater.build(sc.world, w));
    st.ms = Math.round(nowMs() - st.t0);
    return st;
  }
  function renderBack(g, sc) { if (typeof PFFauna !== 'undefined') PFFauna.renderSky(g, sc); }
  function renderWaterBack(g, sc) { if (typeof PFWater === 'undefined' || !sc.pf) return; for (const W_ of sc.pf.water) PFWater.renderBack(g, sc, W_); }
  function renderWaterFront(g, sc) { if (typeof PFWater === 'undefined' || !sc.pf) return; for (const W_ of sc.pf.water) PFWater.renderFront(g, sc, W_); }
  function renderFrontPlane(g, sc) {
    if (!sc.pf) return;
    const cam = sc.cam, t = Game.time;
    for (const o of sc.pf.fg) {
      const sx = Math.round(o.x - cam.x * o.f);
      if (sx > W || sx + o.w < 0) continue;
      const sway = Math.round(Math.sin(t * 2.2 + o.ph) * o.sway);
      // abajo: anclado al borde inferior con leve parallax vertical; arriba: colgando del borde superior
      const sy = o.top ? Math.round(o.y - (cam.y - 60) * 0.3) : Math.round(H - o.h + (o.y || 0) + (cam.y - 60) * 0.3);
      g.drawImage(o.c, sx + sway, sy);
    }
  }
  return { build, renderBack, renderWaterBack, renderWaterFront, renderFrontPlane };
})();
