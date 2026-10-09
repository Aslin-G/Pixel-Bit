/* =====================================================================
   99d_test_portraits.js — Galería de retratos del rediseño.
   ?test=portraits2&page=0|1|2…  (TAB cambia de página)
   · page 0: todos los personajes × expresiones clave + fila de bustos HUD
   · page 1+: un personaje (ids=…) con todas las expresiones
   · &z=2 amplía ×2 · &ids=amaya,kiru · &ex=neutral,happy · &talk=1 · &blink=1
   ===================================================================== */
TESTS.portraits2 = {
  enter() {
    const q = new URLSearchParams(location.search);
    this.page = parseInt(q.get('page') || '0');
    this.z = parseInt(q.get('z') || '1');
    this.ids = (q.get('ids') || 'amaya,kiru,naira,dante,eliana,marea,cobre,alma,nimbo,consejal,operador,pastora,financia,limen,mirage,mosaico,beta9').split(',');
    this.ex = q.get('ex') ? q.get('ex').split(',') : null;
    this.talk = q.get('talk') ? 1 : 0; this.blink = !!q.get('blink');
    this.bg = q.get('bg') || 'navy';
  },
  update() { if (Input.pressed('next')) this.page = (this.page + 1) % (this.ids.length + 2); },
  cell(g, c, x, y, label, z = 1) {
    frect(g, x, y, c.width * z + 2, c.height * z + 2, '#000633');
    frect(g, x + 1, y + 1, c.width * z, c.height * z, this.bg === 'grey' ? '#6a6a7a' : '#041533');
    g.drawImage(c, x + 1, y + 1, c.width * z, c.height * z);
    if (label) drawText(g, label, x + 2, y + c.height * z - 6, { font: 'tiny', color: '#e6f8fe', shadow: '#000633' });
  },
  render(g) {
    frect(g, 0, 0, W, H, '#0b2a52');
    const T0 = performance.now();
    if (this.page === 0) {
      // fila superior: todos los personajes (expresión principal); debajo: bustos del HUD
      const ex = this.ex || ['neutral'];
      const ids = this.ids;
      ids.forEach((id, i) => {
        const c = Portraits.get(id, ex[0], this.talk, this.blink);
        const x = 2 + (i % 6) * 98, y = 2 + Math.floor(i / 6) * 98;
        this.cell(g, c, x, y, id);
      });
      ids.forEach((id, i) => {
        const c = Portraits.bust(id, ex[0] === 'neutral' ? 'smile' : ex[0]);
        const x = 590 - 50 * (i >= 7 ? 0 : 0) + 0, y = 2 + i * 0;
        void x; void y;
        const bx = 2 + (i % 12) * 50, by = 296 + Math.floor(i / 12) * 48;
        if (by < H - 46) this.cell(g, c, bx, by, null);
      });
    } else if (this.page === 1) {
      // expresiones clave × personajes principales
      const ids = ['amaya', 'kiru', 'naira', 'dante', 'eliana', 'limen'];
      const ex = this.ex || ['neutral', 'happy', 'thinking', 'worried', 'surprised', 'angry', 'sad', 'determined', 'relieved', 'scared', 'skeptical'];
      ids.forEach((id, j) => ex.forEach((e, i) => {
        const c = Portraits.bust(id, e);
        this.cell(g, c, 2 + i * 52, 2 + j * 50, null);
      }));
      drawText(g, ex.join(' · '), 4, H - 10, { font: 'tiny', color: '#e6f8fe' });
    } else {
      const id = this.ids[(this.page - 2) % this.ids.length];
      const ex = this.ex || ['neutral', 'smile', 'happy', 'joy', 'surprised', 'worried', 'sad', 'crying', 'angry', 'determined', 'thinking', 'skeptical', 'guilty', 'calm', 'relieved', 'scared', 'tired', 'proud', 'embarrassed', 'curious', 'alert'];
      const z = this.z;
      const per = Math.floor((W - 2) / (98 * z));
      ex.forEach((e, i) => {
        if (Math.floor(i / per) >= Math.floor((H - 50) / (98 * z))) return;
        const c = Portraits.get(id, e, this.talk, this.blink);
        this.cell(g, c, 2 + (i % per) * 98 * z, 2 + Math.floor(i / per) * 98 * z, e, z);
      });
      ex.forEach((e, i) => { if (i < 12) this.cell(g, Portraits.bust(id, e), 2 + i * 50, H - 48, null); });
    }
    this.ms = (this.ms || 0) * 0.9 + (performance.now() - T0) * 0.1;
  },
};
