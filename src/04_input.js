/* =====================================================================
   04_input.js — Teclado (remapeable), puntero/táctil y gamepad.
   ===================================================================== */

const DEFAULT_BINDINGS = {
  left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'], up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'],
  jump: ['Space', 'KeyK'], interact: ['KeyE', 'KeyJ'], tool: ['KeyQ', 'KeyL'], reset: ['KeyR'], lens: ['KeyN'],
  codex: ['KeyC'], map: ['KeyM'], hint: ['KeyH'], data: ['Tab'], pause: ['Escape', 'KeyP'],
  confirm: ['Enter', 'Space', 'KeyE', 'NumpadEnter'], cancel: ['Escape', 'Backspace'],
  next: ['Tab'], uiLeft: ['ArrowLeft', 'KeyA'], uiRight: ['ArrowRight', 'KeyD'], uiUp: ['ArrowUp', 'KeyW'], uiDown: ['ArrowDown', 'KeyS'],
  skip: ['KeyX'], teacher: ['F9'], fast: ['ShiftLeft', 'ShiftRight'],
};
const ACTION_LABELS = {
  left: 'Izquierda', right: 'Derecha', up: 'Subir / contextual', down: 'Bajar', jump: 'Saltar', interact: 'Interactuar', tool: 'Herramienta activa',
  reset: 'Reiniciar simulación', lens: 'Lente Nexo', codex: 'Atlas del Nexo', map: 'Mapa', hint: 'Pista', data: 'Datos', pause: 'Pausa',
};
const KEY_NAMES = { Space: 'ESPACIO', Enter: 'ENTER', Escape: 'ESC', Tab: 'TAB', Backspace: 'BORRAR', ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', ShiftLeft: 'SHIFT', ShiftRight: 'SHIFT' };
function keyName(code) { return KEY_NAMES[code] || code.replace(/^Key/, '').replace(/^Digit/, ''); }

const Input = {
  bindings: deepClone(DEFAULT_BINDINGS),
  keys: new Set(), justDown: new Set(), justUp: new Set(),
  virt: new Set(), virtPrev: new Set(), // botones táctiles virtuales
  pad: new Set(), padPrev: new Set(),
  anyKeyPressed: false, lastDevice: 'keyboard', typedKeys: [],
  pointer: { x: -100, y: -100, down: false, pressed: false, released: false, moved: false, wheel: 0, id: null, startX: 0, startY: 0, dragging: false },
  touches: new Map(), touchMode: false,
  listeners: [],
  init(canvas) {
    this.canvas = canvas;
    window.addEventListener('keydown', (e) => {
      if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace', 'F9'].includes(e.code)) e.preventDefault();
      if (!this.keys.has(e.code)) this.justDown.add(e.code);
      this.keys.add(e.code); this.anyKeyPressed = true; this.lastDevice = 'keyboard';
      this.typedKeys.push(e.code);
      if (this.touchMode && !e.repeat) this.touchMode = Game.settings.touch === 'on';
      Audio2.unlock();
    });
    window.addEventListener('keyup', (e) => { this.keys.delete(e.code); this.justUp.add(e.code); });
    window.addEventListener('blur', () => { this.keys.clear(); this.virt.clear(); });
    const toLogical = (e) => {
      const r = canvas.getBoundingClientRect();
      return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H];
    };
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      canvas.focus();
      Audio2.unlock();
      const [x, y] = toLogical(e);
      if (e.pointerType === 'touch') { if (Game.settings.touch !== 'off') this.touchMode = true; this.lastDevice = 'touch'; }
      else this.lastDevice = 'mouse';
      this.touches.set(e.pointerId, { x, y, sx: x, sy: y, t: 0 });
      if (this.touchMode && Touch.hit(x, y, e.pointerId)) return; // consumido por control virtual
      const p = this.pointer;
      p.x = x; p.y = y; p.down = true; p.pressed = true; p.id = e.pointerId; p.startX = x; p.startY = y; p.dragging = false;
      try { canvas.setPointerCapture(e.pointerId); } catch (_) { }
    });
    canvas.addEventListener('pointermove', (e) => {
      const [x, y] = toLogical(e);
      const t = this.touches.get(e.pointerId);
      if (t) { t.x = x; t.y = y; if (this.touchMode) Touch.move(x, y, e.pointerId); }
      const p = this.pointer;
      if (p.id === null || p.id === e.pointerId) {
        p.x = x; p.y = y; p.moved = true;
        if (p.down && dist(p.startX, p.startY, x, y) > 3) p.dragging = true;
      }
    });
    const up = (e) => {
      this.touches.delete(e.pointerId);
      Touch.release(e.pointerId);
      const p = this.pointer;
      if (p.id === e.pointerId) { p.down = false; p.released = true; p.id = null; }
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', (e) => { this.pointer.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  },
  loadBindings(b) { if (b) for (const k in DEFAULT_BINDINGS) if (Array.isArray(b[k])) this.bindings[k] = b[k].slice(); },
  codesFor(action) { return this.bindings[action] || []; },
  down(action) {
    for (const c of this.codesFor(action)) if (this.keys.has(c)) return true;
    return this.virt.has(action) || this.pad.has(action);
  },
  pressed(action) {
    for (const c of this.codesFor(action)) if (this.justDown.has(c)) return true;
    return (this.virt.has(action) && !this.virtPrev.has(action)) || (this.pad.has(action) && !this.padPrev.has(action));
  },
  released(action) {
    for (const c of this.codesFor(action)) if (this.justUp.has(c)) return true;
    return (!this.virt.has(action) && this.virtPrev.has(action)) || (!this.pad.has(action) && this.padPrev.has(action));
  },
  keyPressed(code) { return this.justDown.has(code); },
  pollGamepad() {
    this.padPrev = new Set(this.pad); this.pad.clear();
    const gps = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of gps) {
      if (!gp) continue;
      const b = (i) => gp.buttons[i] && gp.buttons[i].pressed;
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      if (ax < -0.4 || b(14)) { this.pad.add('left'); this.pad.add('uiLeft'); }
      if (ax > 0.4 || b(15)) { this.pad.add('right'); this.pad.add('uiRight'); }
      if (ay < -0.5 || b(12)) { this.pad.add('up'); this.pad.add('uiUp'); }
      if (ay > 0.5 || b(13)) { this.pad.add('down'); this.pad.add('uiDown'); }
      if (b(0)) { this.pad.add('jump'); this.pad.add('confirm'); }
      if (b(1)) { this.pad.add('cancel'); this.pad.add('tool'); }
      if (b(2)) this.pad.add('interact');
      if (b(3)) this.pad.add('lens');
      if (b(9)) this.pad.add('pause');
      if (b(8)) this.pad.add('codex');
      if (b(4)) this.pad.add('hint');
      if (b(5)) this.pad.add('next');
      if (this.pad.size) this.lastDevice = 'gamepad';
    }
  },
  /** Llamar al final de cada paso de actualización */
  endStep() {
    this.justDown.clear(); this.justUp.clear(); this.typedKeys.length = 0;
    this.virtPrev = new Set(this.virt);
    const p = this.pointer; p.pressed = false; p.released = false; p.moved = false; p.wheel = 0;
    this.anyKeyPressed = false;
  },
  anyConfirm() { return this.pressed('confirm') || this.pointer.pressed; },
  consumePointer() { this.pointer.pressed = false; this.pointer.released = false; },
};

/* ---------- Controles táctiles virtuales ---------- */
const Touch = {
  owners: new Map(), // pointerId → acción
  layout() {
    // botones en coordenadas lógicas
    const s = Game.settings.touchScale || 1;
    const r = 15 * s;
    return [
      { a: 'left', x: 34, y: H - 40, r, icon: '←' },
      { a: 'right', x: 34 + 2.3 * r, y: H - 40, r, icon: '→' },
      { a: 'up', x: 34 + 1.15 * r, y: H - 40 - 2.1 * r, r: r * 0.8, icon: '↑' },
      { a: 'jump', x: W - 36, y: H - 42, r: r * 1.1, icon: 'A' },
      { a: 'interact', x: W - 36 - 2.4 * r, y: H - 36, r, icon: 'E' },
      { a: 'tool', x: W - 36 - 1.1 * r, y: H - 42 - 2.2 * r, r: r * 0.85, icon: 'Q' },
      { a: 'lens', x: W - 22, y: 64, r: 11, icon: 'N' },
      { a: 'pause', x: W - 22, y: 22, r: 11, icon: 'II' },
      { a: 'hint', x: W - 22, y: 98, r: 10, icon: '?' },
    ];
  },
  enabledFor() { const sc = Game.top(); return Input.touchMode && sc && sc.touchControls; },
  hit(x, y, id) {
    if (!this.enabledFor()) return false;
    for (const b of this.layout()) {
      if (dist(x, y, b.x, b.y) <= b.r + 4) { this.owners.set(id, b.a); Input.virt.add(b.a); if (b.a === 'pause') Input.virt.add('cancel'); if (b.a === 'jump') Input.virt.add('confirm'); return true; }
    }
    return false;
  },
  move(x, y, id) {
    if (!this.owners.has(id)) return;
    const prev = this.owners.get(id);
    if (prev !== 'left' && prev !== 'right') return;
    // permite deslizar entre izquierda y derecha
    for (const b of this.layout()) if ((b.a === 'left' || b.a === 'right') && dist(x, y, b.x, b.y) <= b.r + 8 && b.a !== prev) {
      Input.virt.delete(prev); Input.virt.add(b.a); this.owners.set(id, b.a);
    }
  },
  release(id) {
    const a = this.owners.get(id);
    if (a) {
      this.owners.delete(id);
      let still = false; for (const v of this.owners.values()) if (v === a) still = true;
      if (!still) { Input.virt.delete(a); if (a === 'pause') Input.virt.delete('cancel'); if (a === 'jump') Input.virt.delete('confirm'); }
    }
  },
  render(g) {
    if (!this.enabledFor()) return;
    for (const b of this.layout()) {
      const on = Input.virt.has(b.a);
      fdisc(g, b.x, b.y + 2, b.r, 'rgba(20,13,38,0.45)');
      fdisc(g, b.x, b.y, b.r, on ? 'rgba(86,229,255,0.55)' : 'rgba(255,250,240,0.18)');
      fdisc(g, b.x, b.y, b.r - 2, on ? 'rgba(32,214,199,0.5)' : 'rgba(20,13,38,0.35)');
      drawText(g, b.icon, b.x, b.y - 4, { align: 'center', color: on ? '#140d26' : '#fffaf0' });
    }
  },
};
