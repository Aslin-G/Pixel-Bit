/* =====================================================================
   40_lv00.js — NIVEL 00: EL MAPA DEL NEXO
   Plaza de Aridia durante el Festival del Primer Agua.
   RA-08 (integración del nexo) · Lente Nexo · Guardián: El Diagrama Roto
   ===================================================================== */

/* ---------- Diagrama vivo del Nexo: nodos, reglas y rutas ---------- */
const NX = {
  mar: { label: 'MAR', icon: 'water', x: 40, y: 66, out: ['seawater'], inn: [], tip: 'Agua de mar ≈ 35 g/L de sales.' },
  toma: { label: 'TOMA', icon: 'fish', x: 98, y: 66, out: ['seawater'], inn: ['seawater', 'power'], tip: 'Captación con rejillas y bombas.' },
  pre: { label: 'PRETRAT.', icon: 'filter', x: 156, y: 66, out: ['seawater'], inn: ['seawater'], tip: 'Cribado, coagulación y filtración.' },
  oi: { label: 'OI', icon: 'membrane', x: 220, y: 66, out: ['permeate', 'brine'], inn: ['seawater', 'power'], tip: 'Ósmosis inversa: separa agua y sales con presión.' },
  tanque: { label: 'TANQUE', icon: 'tank', x: 290, y: 66, out: ['water'], inn: ['permeate'], tip: 'Reserva de agua tratada (remineralizada).' },
  hogares: { label: 'HOGARES', icon: 'people', x: 370, y: 44, out: [], inn: ['water'], tip: 'Demanda doméstica.' },
  riego: { label: 'RIEGO', icon: 'plant', x: 370, y: 92, out: [], inn: ['water'], tip: 'Parcelas agroecológicas con goteo.' },
  difusor: { label: 'DIFUSOR', icon: 'drop_brine', x: 156, y: 126, out: [], inn: ['brine'], tip: 'Descarga controlada de salmuera al mar.' },
  pv: { label: 'FV', icon: 'panel', x: 40, y: 166, out: ['power'], inn: [], tip: 'Módulos fotovoltaicos.' },
  eol: { label: 'EÓLICA', icon: 'turbine', x: 40, y: 216, out: ['power'], inn: [], tip: 'Aerogeneradores.' },
  bus: { label: 'BARRA', icon: 'plug', x: 130, y: 190, out: ['power'], inn: ['power'], tip: 'Barra de la microred: reparte la electricidad.' },
  bat: { label: 'BATERÍA', icon: 'battery', x: 130, y: 238, out: ['power'], inn: ['power'], tip: 'Almacena energía (kWh).' },
  ely: { label: 'ELECTROL.', icon: 'flask', x: 290, y: 166, out: ['h2'], inn: ['power', 'water'], tip: 'Electrolizador: agua + electricidad → H2 + O2.' },
  h2: { label: 'ALM. H2', icon: 'h2', x: 370, y: 166, out: [], inn: ['h2'], tip: 'Almacenamiento de hidrógeno.' },
  // variante Ranchería Los Médanos
  pozo: { label: 'POZO', icon: 'water', x: 40, y: 66, out: ['seawater'], inn: ['power'], tip: 'Pozo de agua salobre (≈ 5 g/L).' },
  evap: { label: 'LAGUNA', icon: 'salt', x: 156, y: 126, out: [], inn: ['brine'], tip: 'Laguna de evaporación revestida.' },
  mar40: { label: 'MAR', icon: 'water', x: 40, y: 126, out: [], inn: [], tip: 'El mar está a 40 km.', decoy: true },
};
const NX_MAIN = ['mar', 'toma', 'pre', 'oi', 'tanque', 'hogares', 'riego', 'difusor', 'pv', 'eol', 'bus', 'bat', 'ely', 'h2'];
const NX_MEDANOS = ['pozo', 'pre', 'oi', 'tanque', 'hogares', 'riego', 'evap', 'mar40', 'pv', 'bus', 'bat'];
const NX_REQ_MAIN = ['mar>toma', 'toma>pre', 'pre>oi', 'oi>tanque', 'oi>difusor', 'tanque>hogares', 'tanque>riego', 'tanque>ely', 'ely>h2', 'pv>bus', 'eol>bus', 'bus>bat', 'bus>oi', 'bus>toma', 'bus>ely'];
const NX_REQ_MEDANOS = ['pozo>pre', 'pre>oi', 'oi>tanque', 'oi>evap', 'tanque>hogares', 'tanque>riego', 'pv>bus', 'bus>bat', 'bus>oi', 'bus>pozo'];
const NX_GROUPS = [
  { label: 'Cadena de agua de mar a permeado', keys: ['mar>toma', 'toma>pre', 'pre>oi', 'oi>tanque'] },
  { label: 'Salida de salmuera', keys: ['oi>difusor'] },
  { label: 'Distribución de agua', keys: ['tanque>hogares', 'tanque>riego'] },
  { label: 'Generación a la barra', keys: ['pv>bus', 'eol>bus', 'bus>bat'] },
  { label: 'Cargas eléctricas', keys: ['bus>oi', 'bus>toma', 'bus>ely'] },
  { label: 'Hidrógeno (agua + energía)', keys: ['tanque>ely', 'ely>h2'] },
];
const NX_KIND_LABEL = { seawater: 'agua de mar', permeate: 'permeado', brine: 'salmuera', water: 'agua tratada', power: 'electricidad', h2: 'hidrógeno' };
const NX_UNITS = { seawater: 'm³/h', permeate: 'm³/h', brine: 'm³/h', water: 'm³/h', power: 'kW', h2: 'kg/h' };

/** Regla física de conexión. Devuelve {ok, kind} o {ok:false, msg, mis} */
function nexusCheck(a, b) {
  const A = NX[a], B = NX[b];
  const L = (n) => NX[n].label;
  if (a === b) return { ok: false, msg: 'Elige un destino distinto del origen.', silent: true };
  if (B.decoy) return { ok: false, msg: 'El mar está a 40 km: llevar la salmuera hasta allí exigiría una tubería larga, costosa y con su propio impacto. Dentro del límite de Los Médanos conviene una laguna de evaporación revestida y monitoreada.', mis: 'ignorar los límites del sistema y el territorio' };
  if (!A.out.length) return { ok: false, msg: L(a) + ' es un destino: recibe o consume, no envía flujo en este mapa. Empieza por una fuente (mar, sol, viento) o por un equipo que transforma.', mis: 'confundir entradas y salidas del sistema' };
  if (a === 'ely' && (b === 'bus' || b === 'bat')) return { ok: false, msg: 'El electrolizador consume electricidad; no la devuelve. Un ciclo barra → electrolizador → barra produciría energía de la nada: es físicamente imposible (siempre hay pérdidas).', mis: 'creer en ciclos de energía sin pérdidas' };
  if ((a === 'pv' || a === 'eol') && b !== 'bus') {
    if (b === 'bat') return { ok: false, msg: 'En SYNARA toda la generación entra a la barra de la microred y desde allí se reparte a cargas y batería. Conecta la generación a la BARRA.', mis: null };
    return { ok: false, msg: 'La electricidad no es agua ni materia: no llena tanques ni se mezcla con caudales. Viaja por cables desde la generación hasta la BARRA, que la reparte a los equipos que la consumen.', mis: 'confundir flujo de agua y flujo de energía' };
  }
  if (A.out.includes('power') && !B.inn.includes('power')) return { ok: false, msg: L(b) + ' no consume electricidad en este mapa simplificado. Las cargas eléctricas son: bombas de la toma (o del pozo), bomba de alta presión de la OI y electrolizador.', mis: 'confundir flujo de agua y flujo de energía' };
  if ((b === 'pv' || b === 'eol')) return { ok: false, msg: 'Paneles y aerogeneradores generan electricidad; no se "cargan" ni reciben agua.', mis: 'confundir fuentes y almacenamientos' };
  if ((a === 'mar' || a === 'pozo') && ['hogares', 'riego', 'tanque', 'ely'].includes(b)) return { ok: false, msg: 'El agua de mar (≈ 35 g/L) o salobre no es apta para beber, regar ni electrolizar: primero pasa por captación, pretratamiento y ósmosis inversa.', mis: 'creer que el agua salada sirve directamente' };
  if (a === 'oi' && ['hogares', 'riego', 'ely'].includes(b)) return { ok: false, msg: 'El permeado sale casi sin minerales y es corrosivo: se almacena y remineraliza en el TANQUE antes de distribuirse. El agua desalinizada no es idéntica para cualquier uso.', mis: 'tratar el agua desalinizada como idéntica para cualquier uso' };
  if (['tanque', 'oi', 'pre'].includes(a) && ['toma', 'mar', 'pre', 'pozo'].includes(b)) return { ok: false, msg: 'Devolver agua al inicio de la cadena crea un ciclo sin propósito: gastarías energía dos veces para la misma agua.', mis: 'crear ciclos de flujo imposibles o inútiles' };
  if (a === 'toma' && b === 'oi') return { ok: false, msg: 'Sin pretratamiento, arena, limo y algas ensuciarían las membranas en horas. La toma alimenta al PRETRATAMIENTO.', mis: 'omitir el pretratamiento' };
  if (a === 'pre' && b !== 'oi') return { ok: false, msg: 'El agua pretratada sigue siendo agua de mar: todavía tiene ≈ 35 g/L de sales. Le falta la ósmosis inversa.', mis: 'confundir agua clara con agua desalinizada' };
  if (a === 'oi' && b === 'tanque') return { ok: true, kind: 'permeate' };
  if (a === 'oi' && (b === 'difusor' || b === 'evap')) return { ok: true, kind: 'brine' };
  if (a === 'oi') return { ok: false, msg: 'La OI produce dos corrientes: permeado (hacia el tanque) y salmuera (hacia el difusor o la laguna).', mis: null };
  if (a === 'ely' && b !== 'h2') return { ok: false, msg: 'El hidrógeno es un gas combustible: se comprime y almacena. No es un servicio de agua ni de riego.', mis: 'confundir agua, energía y materia' };
  const kind = A.out.find(k => B.inn.includes(k));
  if (!kind) return { ok: false, msg: 'No hay un flujo compatible: ' + L(a) + ' entrega ' + A.out.map(k => NX_KIND_LABEL[k]).join(' / ') + ' y ' + L(b) + ' recibe ' + (B.inn.map(k => NX_KIND_LABEL[k]).join(' / ') || 'nada') + '.', mis: 'confundir agua, energía y materia' };
  return { ok: true, kind };
}
/** Ruta ortogonal entre nodos (coordenadas de pantalla del simulador) */
function nexusRoute(a, b) {
  const A = NX[a], B = NX[b];
  const k = a + '>' + b;
  const R = {
    'oi>difusor': () => [[A.x - 8, A.y + 12], [A.x - 8, B.y], [B.x + 24, B.y]],
    'oi>evap': () => [[A.x - 8, A.y + 12], [A.x - 8, B.y], [B.x + 24, B.y]],
    'tanque>hogares': () => [[A.x + 24, A.y], [A.x + 33, A.y], [A.x + 33, B.y], [B.x - 24, B.y]],
    'tanque>riego': () => [[A.x + 24, A.y], [A.x + 33, A.y], [A.x + 33, B.y], [B.x - 24, B.y]],
    'tanque>ely': () => [[A.x, A.y + 12], [B.x, B.y - 12]],
    'pv>bus': () => [[A.x + 24, A.y], [84, A.y], [84, B.y], [B.x - 24, B.y]],
    'eol>bus': () => [[A.x + 24, A.y], [84, A.y], [84, B.y], [B.x - 24, B.y]],
    'bus>bat': () => [[A.x, A.y + 12], [B.x, B.y - 12]],
    'bus>oi': () => [[A.x + 24, A.y - 6], [B.x + 12, A.y - 6], [B.x + 12, B.y + 12]],
    'bus>ely': () => [[A.x + 24, A.y + 4], [B.x - 8, A.y + 4], [B.x - 8, B.y + 12]],
    'bus>toma': () => [[A.x - 14, A.y - 12], [A.x - 14, 100], [B.x, 100], [B.x, B.y + 12]],
    'bus>pozo': () => [[A.x - 14, A.y - 12], [A.x - 14, 100], [B.x, 100], [B.x, B.y + 12]],
  };
  if (R[k]) return R[k]();
  if (Math.abs(A.x - B.x) < 30) return [[A.x, A.y + (B.y > A.y ? 12 : -12)], [B.x, B.y + (B.y > A.y ? -12 : 12)]];
  const sx = B.x > A.x ? 1 : -1;
  const x0 = A.x + 24 * sx, x1 = B.x - 24 * sx, mx = Math.round((x0 + x1) / 2);
  return A.y === B.y ? [[x0, A.y], [x1, B.y]] : [[x0, A.y], [mx, A.y], [mx, B.y], [x1, B.y]];
}
/** Balance estacionario del diagrama (supuestos de simulación) */
function nexusSolve(edges, opts = {}) {
  const has = (k) => edges.some(e => e.key === k && !e.wrong);
  const med = opts.medanos;
  const gen = (med ? 0 : 0) + (has('pv>bus') ? (opts.pv ?? 320) : 0) + (has('eol>bus') ? (opts.wind ?? 160) : 0);
  const batOk = has('bus>bat');
  const power = (n) => has('bus>' + n) && (gen > 0 || batOk);
  const src = med ? 'pozo' : 'mar';
  const chain = med ? (power('pozo') && has('pozo>pre')) : (has('mar>toma') && has('toma>pre') && power('toma'));
  const brineOut = has('oi>difusor') || has('oi>evap');
  const roOn = chain && has('pre>oi') && power('oi') && brineOut && has('oi>tanque');
  const R = med ? 0.75 : 0.42;
  const Qf = roOn ? (med ? 40 : 100) : 0;
  const Qp = Qf * R, Qb = Qf - Qp;
  const Cb = med ? 5 / (1 - R) : 35 / (1 - R);
  const dem = { hogares: has('tanque>hogares') ? (med ? 18 : 25) : 0, riego: has('tanque>riego') ? (med ? 9 : 12) * (opts.irrig ?? 1) : 0 };
  const elyOn = !med && has('tanque>ely') && has('ely>h2') && power('ely');
  const h2 = elyOn ? 2 * (opts.elyRate ?? 1) : 0;
  const elyWater = h2 * 0.009 * 1.0;
  const tankIn = roOn ? Qp : 0;
  const tankNet = tankIn - dem.hogares - dem.riego - elyWater;
  const loads = { toma: power(med ? 'pozo' : 'toma') ? (med ? 12 : 25) : 0, oi: roOn ? Qp * (med ? 1.2 : 3.0) : 0, ely: h2 * 55 };
  const loadSum = loads.toma + loads.oi + loads.ely;
  const batFlow = batOk ? clamp(gen - loadSum, -150, 150) : 0;
  const vals = {};
  vals[src + '>' + (med ? 'pre' : 'toma')] = Qf; vals['toma>pre'] = Qf; vals['pre>oi'] = Qf; vals['oi>tanque'] = Qp; vals['oi>difusor'] = Qb; vals['oi>evap'] = Qb;
  vals['tanque>hogares'] = dem.hogares; vals['tanque>riego'] = dem.riego; vals['tanque>ely'] = elyWater; vals['ely>h2'] = h2;
  vals['pv>bus'] = has('pv>bus') ? (opts.pv ?? 320) : 0; vals['eol>bus'] = has('eol>bus') ? (opts.wind ?? 160) : 0; vals['bus>bat'] = batFlow;
  vals['bus>oi'] = loads.oi; vals['bus>toma'] = loads.toma; vals['bus>pozo'] = loads.toma; vals['bus>ely'] = loads.ely;
  return { roOn, Qf, Qp, Qb, Cb, tankNet, h2, gen, loadSum, batFlow, vals, brineOut, chain, elyWater };
}

const NexusSim = makeSim({
  title: 'TALLER STEAM · Diagrama vivo del Nexo', icon: 'mosaic', ra: 'RA-08', concepts: ['systemsThinking', 'massBalance'],
  phases: ['demo', 'guided', 'auto', 'transfer', 'free'],
  hintLadder: ['¿Qué necesita cada caja para funcionar: agua, electricidad o ambas?', 'Sigue el agua desde el mar: toma → pretratamiento → OI → tanque. La OI tiene dos salidas. La electricidad sale de FV y eólica hacia la BARRA.', 'Conecta: BARRA → OI, BARRA → TOMA y BARRA → ELECTROLIZADOR; TANQUE → ELECTROLIZADOR → ALM. H2.'],
  init(p) {
    this.stopAfter = p.stopAfter || 'free';
    this.sel = null; this.edges = []; this.errs = 0; this.removedGood = 0; this.verdict = null; this.live = false; this.liveT = 0; this.flash = null;
  },
  key(a, b) { return a + '>' + b; },
  nodeSet() { return this.phase === 'transfer' ? NX_MEDANOS : NX_MAIN; },
  req() { return this.phase === 'transfer' ? NX_REQ_MEDANOS : NX_REQ_MAIN; },
  addEdge(a, b, opts = {}) {
    const k = this.key(a, b);
    if (this.edges.some(e => e.key === k)) return false;
    const c = opts.wrong ? { ok: true, kind: opts.kind } : nexusCheck(a, b);
    if (!c.ok) return c;
    this.edges.push({ a, b, key: k, kind: c.kind, pts: nexusRoute(a, b), wrong: opts.wrong || null, born: this.t });
    return true;
  },
  onPhase(ph) {
    this.sel = null; this.edges = []; this.errs = 0; this.removedGood = 0; this.verdict = null; this.live = false; this.demoStep = 0;
    if (ph === 'demo') { this.say('Demostración: el Nexo se dibuja como flujos con tipo y unidad. Mira: {c}mar → toma → pretratamiento{/} es agua de mar (m³/h). Cada color es un tipo de flujo distinto.'); this.demoT = 0; }
    if (ph === 'guided') {
      for (const k of ['mar>toma', 'toma>pre']) { const [a, b] = k.split('>'); this.addEdge(a, b); }
      this.say('Tu turno: completa SYNARA. Haz clic en un nodo de origen y luego en su destino. Si una conexión no tiene sentido físico, te diré por qué. Cuando la lista esté completa, pulsa {y}Activar{/}.');
    }
    if (ph === 'auto') {
      for (const k of NX_REQ_MAIN) { if (['tanque>ely', 'ely>h2', 'eol>bus'].includes(k)) continue; const [a, b] = k.split('>'); this.addEdge(a, b); }
      const wrong = [['pv', 'tanque', 'power', 'Energía conectada como si fuera agua: la electricidad no llena tanques.'], ['oi', 'riego', 'brine', 'Salmuera enviada al riego: saliniza el suelo en una temporada.'], ['ely', 'bus', 'power', 'Ciclo de energía: el electrolizador "devuelve" electricidad a la barra. Imposible.'], ['tanque', 'toma', 'water', 'Ciclo de agua: el tanque devuelve agua a la toma.'], ['mar', 'hogares', 'seawater', 'Agua de mar directa a los hogares.']];
      for (const [a, b, kind, why] of wrong) this.addEdge(a, b, { wrong: why, kind });
      this.say('El Diagrama Roto: tras el apagón, el mapa de la consola mezcla flujos imposibles con flujos reales. Elimina las conexiones falsas (clic sobre su marca {o}✕{/}) y añade las que faltan. Sin pistas automáticas.');
    }
    if (ph === 'transfer') this.say('Transferencia: Ranchería Los Médanos quiere un SYNARA pequeño. Tiene un pozo de agua salobre, sol abundante, casi nada de viento y el mar a 40 km. Diseña su diagrama.');
    if (ph === 'free') { for (const k of NX_REQ_MAIN) { const [a, b] = k.split('>'); this.addEdge(a, b); } this.live = true; this.say('Laboratorio libre: quita y pon conexiones y observa cómo cambian los balances.'); }
  },
  step(dt) {
    if (this.live) this.liveT += dt;
    if (this.flash) { this.flash.t += dt; if (this.flash.t > 1.2) this.flash = null; }
    if (this.phase === 'demo') {
      this.demoT += dt;
      const seq = [['mar', 'toma', 1.2], ['toma', 'pre', 3.2], ['pre', 'oi', 5.5], ['oi', 'tanque', 7.5], ['pv', 'bus', 10], ['bus', 'oi', 12]];
      const notes = { 2: 'La OI recibe agua pretratada y produce {c}permeado{/} (agua casi sin sales).', 3: 'El permeado va al {c}tanque{/}: una reserva. El tanque solo crece si entra más de lo que sale.', 4: 'La electricidad es otro tipo de flujo ({y}kW{/}): va de la generación a la {y}barra{/} de la microred…', 5: '…y de la barra a los equipos que la consumen, como la bomba de alta presión de la OI. Agua y energía nunca se mezclan en el mismo cable.' };
      while (this.demoStep < seq.length && this.demoT > seq[this.demoStep][2]) {
        const [a, b] = seq[this.demoStep]; this.addEdge(a, b); Audio2.sfx('ui');
        if (notes[this.demoStep]) this.say(notes[this.demoStep]);
        this.demoStep++;
      }
      if (this.demoStep >= seq.length && this.demoT > 14 && !this.verdict) { this.verdict = { ok: true, txt: 'Observa: hay {c}tipos de flujo{/} (agua de mar, permeado, salmuera, agua tratada, electricidad, hidrógeno) y cada uno tiene su {y}unidad{/}. Ahora construye el resto.' }; }
    }
  },
  clickNode(id) {
    if (this.phase === 'demo' || this.verdict) return;
    if (this.sel == null) { if (NX[id].decoy) { this.say(NX[id].tip + ' Está fuera del límite del sistema de Los Médanos.'); return; } this.sel = id; Audio2.sfx('uiMove'); return; }
    if (this.sel === id) { this.sel = null; return; }
    const r = this.addEdge(this.sel, id);
    if (r === true) {
      Audio2.sfx('confirm'); this.flash = { key: this.key(this.sel, id), t: 0, ok: true };
      const e = this.edges[this.edges.length - 1];
      this.say('Conexión: ' + NX[this.sel].label + ' → ' + NX[id].label + ' ({c}' + NX_KIND_LABEL[e.kind] + '{/}, ' + NX_UNITS[e.kind] + ').');
    } else if (r === false) this.say('Esa conexión ya existe.');
    else if (!r.silent) {
      this.errs++; Audio2.sfx('error');
      this.say('{o}No conecta:{/} ' + r.msg);
      if (r.mis) LearningModel.record({ kind: 'challenge', id: 'lv0_nexus_link', ra: 'RA-08', concepts: ['systemsThinking'], solo: 2, correct: false, misconception: r.mis, hints: this.hints });
    }
    this.sel = null;
  },
  removeEdge(e) {
    if (this.verdict && this.phase !== 'free') return;
    this.edges = this.edges.filter(x => x !== e);
    Audio2.sfx(e.wrong ? 'success' : 'uiBack');
    if (e.wrong) this.say('{g}Bien eliminada:{/} ' + e.wrong);
    else if (this.phase === 'auto') { this.removedGood++; this.say('{o}Esa conexión era real:{/} ' + NX[e.a].label + ' → ' + NX[e.b].label + ' lleva ' + NX_KIND_LABEL[e.kind] + '. Puedes volver a añadirla.'); }
  },
  complete() { const req = this.req(); return req.every(k => this.edges.some(e => e.key === k && !e.wrong)) && !this.edges.some(e => e.wrong); },
  evaluate() {
    const ok = this.complete();
    let txt;
    if (this.phase === 'guided') {
      txt = ok ? 'SYNARA completo: agua, salmuera, electricidad e hidrógeno tienen origen, destino y unidad. Intentos fallidos: ' + this.errs + '.' : 'Aún faltan conexiones. Revisa la lista: ¿cada carga eléctrica recibe energía? ¿la OI tiene salida para la salmuera?';
      this.evidence('lv0_nexus_guided', ok, { solo: 3, misconception: ok ? null : 'diagrama incompleto' });
    } else if (this.phase === 'auto') {
      const good = ok && this.removedGood <= 2;
      txt = good ? '¡El Diagrama Roto restaurado! Distinguiste agua, energía y materia, y eliminaste los ciclos imposibles.' : ok ? 'Diagrama correcto, pero eliminaste ' + this.removedGood + ' conexiones reales antes de acertar. Repasa qué flujo lleva cada línea.' : 'Todavía hay conexiones falsas o faltantes. Fíjate en los tipos de flujo: ¿qué entra y qué sale de cada caja?';
      this.evidence('lv0_guardian_diagrama_roto', good, { solo: 4, misconception: good ? null : 'confundir agua, energía y materia' });
      if (!good && ok) { this.verdict = { ok: false, txt }; return; }
    } else if (this.phase === 'transfer') {
      txt = ok ? 'Diseño de Los Médanos coherente: pozo salobre (menos energía por m³ que el agua de mar), recuperación alta, laguna de evaporación dentro del territorio y batería para la noche, porque casi no hay viento.' : 'El diseño aún no funciona en Los Médanos. ¿Quién alimenta las bombas de noche? ¿Adónde va la salmuera si el mar está lejos?';
      this.evidence('lv0_transfer_medanos', ok, { solo: 5, transfer: true, misconception: ok ? null : 'transferir un diseño sin adaptar al territorio' });
    } else { txt = 'Balance calculado.'; }
    this.verdict = { ok, txt };
    if (ok) { this.live = true; this.liveT = 0; }
    Audio2.sfx(ok ? 'success' : 'error');
  },
  partial() { const miss = this.req().find(k => !this.edges.some(e => e.key === k)); if (miss) { const [a, b] = miss.split('>'); this.addEdge(a, b); this.say('Te muestro una: ' + NX[a].label + ' → ' + NX[b].label + '.'); } },
  draw(g) {
    const X0 = 8, Y0 = 28, WW = 410, HH = 228;
    // tablero tipo plano/mosaico
    frect(g, X0, Y0, WW, HH, '#0a1838'); frect(g, X0 + 1, Y0 + 1, WW - 2, HH - 2, '#0e2048');
    for (let x = X0 + 8; x < X0 + WW; x += 16) for (let y = Y0 + 8; y < Y0 + HH; y += 16) fpx(g, x, y, '#1d346c');
    frect(g, X0, Y0, WW, 1, '#56e5ff'); frect(g, X0, Y0 + HH - 1, WW, 1, '#1d346c');
    const med = this.phase === 'transfer';
    drawText(g, med ? 'RANCHERÍA LOS MÉDANOS' : 'SYNARA · ARIDIA', X0 + 6, Y0 + 4, { font: 'tiny', color: '#56e5ff' });
    // límite del sistema
    lensBoundary(g, X0 + 4, Y0 + 14, WW - 8, HH - 18, '#ffe14d', null);
    drawText(g, 'LÍMITE DEL SISTEMA', X0 + WW - 6, Y0 + 4, { font: 'tiny', color: '#ffe14d', align: 'right' });
    const sol = this.live ? nexusSolve(this.edges, { medanos: med, pv: med ? 140 : 320, wind: 160 }) : null;
    // aristas
    for (const e of this.edges) {
      const rate = sol ? clamp(Math.abs(sol.vals[e.key] ?? 1) / (e.kind === 'power' ? 150 : 60), 0.25, 1.4) : 0.6;
      if (e.wrong) {
        const blink = (Math.floor(this.t * 6) % 2) === 0;
        for (let i = 0; i < e.pts.length - 1; i++) { const [x0, y0] = e.pts[i], [x1, y1] = e.pts[i + 1]; const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let s = 0; s <= n; s += 1) if ((s + Math.floor(this.t * 20)) % 6 < 3) fpx(g, lerp(x0, x1, s / n), lerp(y0, y1, s / n), blink ? '#ff4e5d' : '#f27ee6'); }
      } else {
        const fresh = this.flash && this.flash.key === e.key;
        Charts.flow(g, e.pts, e.kind, rate, fresh ? 3 : 2);
        if (e.key === 'bus>bat') { const [x, y] = e.pts[0]; frect(g, x - 2, y + 4, 5, 1, '#fff09a'); }
      }
      const mid = e.pts[Math.floor((e.pts.length - 1) / 2)], mid2 = e.pts[Math.floor((e.pts.length - 1) / 2) + 1] || mid;
      e.mx = Math.round((mid[0] + mid2[0]) / 2); e.my = Math.round((mid[1] + mid2[1]) / 2);
      if (sol && !e.wrong && sol.vals[e.key] != null) {
        const v = sol.vals[e.key];
        const txt = e.kind === 'power' ? fmt0(Math.abs(v)) + ' kW' : e.kind === 'h2' ? fmt(v, 1) + ' kg/h' : (v < 1 && v > 0 ? fmt(v * 1000, 0) + ' L/h' : fmt0(v) + ' m³/h');
        const w = FONTS.tiny.measure(txt) + 4;
        frect(g, e.mx - w / 2, e.my - 4, w, 8, '#05031a'); drawText(g, txt, e.mx, e.my - 2, { font: 'tiny', align: 'center', color: FLOW_KINDS[e.kind].hi });
      }
    }
    // nodos
    Gui.begin();
    for (const id of this.nodeSet()) {
      const N = NX[id];
      const x = N.x - 24, y = N.y - 12;
      const sel = this.sel === id;
      const pal = N.decoy ? ['#141626', '#1c1f34', '#4a4e70'] : sel ? ['#6a3e0e', '#9a5e12', '#ffe14d'] : ['#121736', '#1d346c', '#56e5ff'];
      frect(g, x, y + 1, 48, 24, '#05030f'); frect(g, x, y, 48, 24, pal[0]); frect(g, x + 1, y + 1, 46, 22, pal[1]); frect(g, x + 1, y + 1, 46, 1, pal[2]);
      Icons.draw(g, N.icon, x + 2, y + 5);
      drawText(g, N.label, x + 17, y + 8, { font: 'tiny', color: N.decoy ? '#8a8fb8' : '#fffaf0' });
      if (N.decoy) drawText(g, 'A 40 KM', x + 24, y + 27, { font: 'tiny', align: 'center', color: '#8a8fb8' });
      // indicador de estado en vivo
      if (sol && !N.decoy) {
        let on = true;
        if (id === 'oi' || id === 'pre' || id === 'toma' || id === 'mar' || id === 'pozo') on = sol.roOn;
        if (id === 'ely' || id === 'h2') on = sol.h2 > 0;
        if (id === 'difusor' || id === 'evap') on = sol.roOn && sol.brineOut;
        fdisc(g, x + 44, y + 4, 2, on ? '#86e36f' : '#ff4e5d');
      }
      if (id === 'tanque' && sol) { const tn = sol.tankNet; drawText(g, (tn >= 0 ? '+' : '') + fmt(tn, 1), x + 24, y + 27, { font: 'tiny', align: 'center', color: tn >= 0 ? '#86e36f' : '#ff4e5d' }); }
      if (id === 'bat' && sol) drawText(g, sol.batFlow >= 0 ? 'CARGA' : 'DESCARGA', x + 24, y + 27, { font: 'tiny', align: 'center', color: '#fff09a' });
      if (Gui.button(g, 'nx_' + id, x, y, 48, 24, N.label, { noDraw: true, tip: N.tip })) this.clickNode(id);
    }
    // marcas de eliminación
    const canRemove = this.phase === 'auto' || this.phase === 'free' || this.phase === 'guided';
    if (canRemove && !(this.verdict && this.verdict.ok && this.phase !== 'free')) for (const e of this.edges) {
      if (e.mx == null) continue;
      const bx = e.mx - 4, by = e.my + (sol ? 5 : -4);
      if (e.wrong) { frect(g, bx, by, 9, 9, '#4a1428'); frect(g, bx + 1, by + 1, 7, 7, '#7a1f36'); drawText(g, '×', bx + 2, by + 1, { color: '#ff9a8a' }); }
      if (Gui.button(g, 'nxe_' + e.key, bx, by, 9, 9, '×', { noDraw: true, tip: 'Eliminar ' + NX[e.a].label + ' → ' + NX[e.b].label })) this.removeEdge(e);
    }
    // panel derecho
    const CX = 424, CW = W - CX - 6;
    UIK.panel(g, CX, 28, CW, 228, 'tech');
    let yy = 34;
    const req = this.req();
    if (this.phase === 'transfer') {
      drawText(g, 'LOS MÉDANOS', CX + 6, yy, { font: 'tiny', color: '#ffe14d' }); yy += 9;
      yy += drawTextBlock(g, 'Pozo salobre ≈ 5 g/L · sol fuerte · viento casi nulo · mar a 40 km · 120 familias.', CX + 6, yy, CW - 12, { font: 'tiny', color: '#cfd6f0' }) + 4;
    } else {
      drawText(g, 'CONEXIONES REQUERIDAS', CX + 6, yy, { font: 'tiny', color: '#ffe14d' }); yy += 10;
      for (const G of NX_GROUPS) {
        const done = G.keys.every(k => this.edges.some(e => e.key === k && !e.wrong));
        Icons.draw(g, done ? 'check' : 'cross', CX + 3, yy - 2);
        drawText(g, G.label, CX + 19, yy, { color: done ? '#c2f58e' : '#cfd6f0' }); yy += 12;
      }
    }
    const nOk = req.filter(k => this.edges.some(e => e.key === k && !e.wrong)).length;
    drawText(g, 'Flujos correctos: ' + nOk + ' / ' + req.length + (this.phase === 'auto' ? '   Falsos: ' + this.edges.filter(e => e.wrong).length : ''), CX + 6, yy + 2, { font: 'tiny', color: '#a6f4ff' }); yy += 12;
    // leyenda de tipos y unidades
    drawText(g, 'TIPOS DE FLUJO', CX + 6, yy, { font: 'tiny', color: '#ffe14d' }); yy += 9;
    for (const k of ['seawater', 'permeate', 'brine', 'water', 'power', 'h2']) { frect(g, CX + 6, yy + 1, 10, 3, FLOW_KINDS[k].mid); frect(g, CX + 6, yy + 1, 10, 1, FLOW_KINDS[k].hi); drawText(g, NX_KIND_LABEL[k] + ' (' + NX_UNITS[k] + ')', CX + 20, yy, { font: 'tiny', color: '#fffaf0' }); yy += 8; }
    if (sol) {
      yy += 3;
      drawText(g, 'Tanque: ' + (sol.tankNet >= 0 ? '+' : '') + fmt(sol.tankNet, 1) + ' m³/h  ·  Gen.: ' + fmt0(sol.gen) + ' kW', CX + 6, yy, { font: 'tiny', color: '#c2f58e' }); yy += 8;
      drawText(g, 'Salmuera ≈ ' + fmt0(sol.Cb) + ' g/L  ·  Cargas: ' + fmt0(sol.loadSum) + ' kW', CX + 6, yy, { font: 'tiny', color: '#f888b8' }); yy += 8;
    }
    // botones
    const by = 236;
    const ph = this.phase;
    if (!this.verdict) {
      if ((ph === 'guided' || ph === 'transfer') && Gui.button(g, 'act', CX + 6, by, 90, 16, 'Activar', { style: 'good', icon: 'play', disabled: this.edges.length < 3 })) this.evaluate();
      if (ph === 'auto' && Gui.button(g, 'ver', CX + 6, by, 90, 16, 'Verificar', { style: 'good', icon: 'check' })) this.evaluate();
      if (ph !== 'demo' && Gui.button(g, 'hintb', CX + CW - 62, by, 56, 16, 'Pista', { style: 'ghost', icon: 'hint', disabled: ph === 'auto' })) this.hint();
      if (ph === 'free' && Gui.button(g, 'calc', CX + 6, by, 90, 16, this.live ? 'Recalcular' : 'Calcular', { style: 'good', icon: 'chart' })) { this.live = true; }
    }
    // tira de 24 h en Los Médanos (tras activar)
    if (ph === 'transfer' && this.verdict && this.verdict.ok) this.drawDay(g, X0, Y0 + HH + 4, WW, 64);
    // veredicto
    if (this.verdict) {
      const v = this.verdict;
      const vh = textHeight(v.txt, 330) + 30;
      const vx = ph === 'transfer' && v.ok ? 424 : 20, vw = ph === 'transfer' && v.ok ? W - 430 : 360;
      UIK.panel(g, vx, H - vh - 8, vw, vh, v.ok ? 'green' : 'alert');
      drawTextBlock(g, v.txt, vx + 8, H - vh - 2, vw - 16, { color: '#fffaf0' });
      if (v.ok) { if (Gui.button(g, 'nxt', vx + vw - 106, H - 28, 100, 16, this.phase === this.stopAfter ? 'Terminar' : 'Continuar', { style: 'good', icon: 'play' })) { if (this.phase === this.stopAfter) this.finish(true); else this.nextPhase(); } }
      else if (Gui.button(g, 'rt', vx + vw - 106, H - 28, 100, 16, 'Seguir', { style: 'gold', icon: 'reset' })) { this.attempts++; GS.s.stats.retries++; this.verdict = null; if (this.phase === 'auto' && this.complete()) this.onPhase('auto'); }
    }
    Gui.end();
  },
  /** Día y noche en Los Médanos: FV, demanda y estado de carga */
  drawDay(g, x, y, w, h) {
    const pts = [], dem = [], soc = [];
    let s = 0.6;
    for (let hr = 0; hr <= 24; hr += 0.5) {
      const pv = Math.max(0, Math.sin((hr - 6) / 12 * Math.PI)) * 140;
      const d = 30 + (hr > 6 && hr < 22 ? 15 : 0);
      s = clamp(s + (pv - d) * 0.5 / 600, 0.1, 1);
      pts.push([hr, pv]); dem.push([hr, d]); soc.push([hr, s * 140]);
    }
    Charts.line(g, x, y, w, h, [{ data: pts, color: '#ffe14d', label: 'FV kW' }, { data: dem, color: '#ff9a8a', label: 'demanda kW' }, { data: soc, color: '#86e36f', label: 'SOC (escala)' }], { xMin: 0, xMax: 24, yMin: 0, yMax: 150, legend: true, xLabel: 'h' });
  },
});

/* =====================================================================
   NIVEL 00 — escena de juego
   ===================================================================== */
LEVELS[0] = {
  id: 0, title: 'El Mapa del Nexo', chapter: 'CAPÍTULO 00', biome: 'plaza', music: 'festival', width: 2500, height: 420, fallY: 420,
  ambience: { wind: 0.25, birds: 0.5, sea: 0.15 },
  portraits: ['amaya', 'kiru', 'naira', 'dante', 'eliana', 'limen', 'alma', 'nimbo'],
  spawn: { x: 70, y: 288 },
  checkpoints: { blackout: { x: 1240, y: 280 } },
  ground: [[0, 288], [380, 288], [400, 284], [900, 284], [930, 280], [1720, 280], [1760, 284], [2120, 284], [2320, 276], [2500, 272]],
  terrain: [{ x0: 0, x1: 400, mat: 'stone' }, { x0: 400, x1: 1490, mat: 'plaza' }, { x0: 1490, x1: 1650, mat: 'grassland' }, { x0: 1650, x1: 2120, mat: 'plaza' }, { x0: 2120, x1: 2500, mat: 'sand' }],
  /* Mismas plataformas (x, y, w); solo cambia su arte: cajas y tarima horneadas en 3/4, escenario y
     rellano del núcleo dibujados como accesorios (art 'none'). */
  platforms: [
    { x: 250, y: 270, w: 22, type: 'crate', baked: true, art: 'crate3q', h: 18 }, { x: 272, y: 256, w: 20, type: 'crate', baked: true, art: 'crate3q', h: 16 }, { x: 300, y: 270, w: 22, type: 'crate', baked: true, art: 'crate3q', h: 18 },
    { x: 640, y: 246, w: 64, type: 'wood', baked: true, art: 'woodDeck', d: 9 },
    { x: 980, y: 262, w: 200, type: 'wood', post: 18, baked: true, art: 'none' },
    { x: 1880, y: 262, w: 80, type: 'metal', baked: true, art: 'none' },
  ],
  windSpin: () => (LEVELS[0]._spin ?? 1.3),
  /* Cámara: el mundo crece 60 px hacia abajo (muro de sillares, acequia y empedrado en 3/4) */
  cam: { look: 50, vy: 0.6 },
  /* ---------------- plano jugable con kit PF ---------------- */
  pf: {
    terrain: [
      { x0: 0, x1: 1490, surf: 'plaza', face: 'plazaWall', depth: 22, wallH: 58 },
      { x0: 1490, x1: 1650, surf: 'meadow', face: 'plazaWall', depth: 18, wallH: 58, path: false },
      { x0: 1650, x1: 2120, surf: 'plaza', face: 'plazaWall', depth: 22, wallH: 58 },
      { x0: 2120, x1: 2500, surf: 'path', face: 'cliff', depth: 16 },
    ],
    /** Oclusores del primer plano (f 1,3): buganvillas y macetones en los bordes, guirnaldas arriba */
    fg: [
      { kind: 'garland', x: -30, y: -6, w: 330, h: 40, seed: 3, top: true },
      { kind: 'clump', x: -20, w: 130, h: 90, seed: 5, spikes: 3, leaves: 12 },
      { kind: 'bougain', x: 520, w: 120, h: 76, seed: 9 },
      { kind: 'garland', x: 980, y: -8, w: 300, h: 44, seed: 7, top: true },
      { kind: 'bougain', x: 1380, w: 130, h: 80, seed: 11 },
      { kind: 'clump', x: 1980, w: 120, h: 84, seed: 13, spikes: 4, leaves: 10 },
      { kind: 'garland', x: 2240, y: -6, w: 280, h: 40, seed: 15, top: true },
      { kind: 'bougain', x: 2700, w: 140, h: 86, seed: 17 },
      { kind: 'clump', x: 3080, w: 130, h: 90, seed: 19, spikes: 5, leaves: 12 },
    ],
    fauna: { gulls: [{ x: 500, y: 70, n: 3 }, { x: 1500, y: 60, n: 4 }, { x: 2300, y: 80, n: 3 }], drones: [{ x: 1200, y: 120, r: 30 }, { x: 1900, y: 90, r: 36 }] },
  },
  /** Etiquetas científicas en el mundo (WorldLabels) */
  labels: [
    { x: 1268, y: 150, title: 'PÉRGOLA FV', sub: (sc) => (sc.state.dark ? 0 : sc.state.active ? 210 : 140) + ' kW', kind: 'solar', ax: 1268, ay: 162 },
    { x: 1356, y: 214, title: 'BATERÍA', sub: (sc) => fmt0((sc.state.soc ?? 0.55) * 100) + ' % (kWh)', kind: 'tech', ax: 1356, ay: 228 },
    { x: 1437, y: 168, title: 'PRIMER AGUA', sub: 'Agua tratada', kind: 'water', ax: 1437, ay: 184 },
    { x: 1570, y: 214, title: 'RIEGO POR GOTEO', sub: (sc) => sc.state.irrig && !sc.state.dark ? 'Activo' : 'Cerrado', kind: 'green', ax: 1570, ay: 250 },
    { x: 1702, y: 196, title: 'ELECTROLIZADOR', sub: 'Agua + energía → H₂ + O₂', kind: 'green', ax: 1700, ay: 230 },
    { x: 2000, y: 150, title: 'NÚCLEO SYNARA', sub: (sc) => sc.state.sealed ? 'Sellado' : 'Control del nexo', kind: 'tech', ax: 1962, ay: 160 },
  ],
  /* ---------------- accesorios estáticos (prerender, f = 1) ---------------- */
  props(pb, world) {
    const gy = (x) => world.groundAt(x);
    const segs = PFTerrain.surface(pb, world);
    const back = (x) => PFTerrain.backEdge(PFTerrain.segAt(segs, x), Math.round(x), gy(x));
    const A = PFArch, C = PFCivic, F = PFFlora, I = PFInfra, r = RNG(1001);
    const K = LV0_ANCH;
    // detalle del pavimento: tapas de registro y confeti barrido
    for (const x of [120, 470, 610, 960, 1250, 1600, 1830, 2060]) A.manhole(pb, x, gy(x) - 12);
    for (let x = 400; x < 2100; x += 3) if (hash2(x, 7, 41) < 0.05) PFK.put(pb, x, gy(x) - 3 - Math.floor(hash2(x, 8, 41) * 16), U(['#ff6b6b', '#ffe14d', '#20d6c7', '#8d6bff', '#ffffff'][Math.floor(hash2(x, 9, 41) * 5)]));
    /* ===== 1. AULA-LABORATORIO AL AIRE LIBRE (0–235) ===== */
    A.planter(pb, 0, gy(0) - 14, 12, { kind: 'flowers', seed: 2 });
    K.pav = C.pavilion(pb, 14, gy(14) - 6, 196);
    A.bicycle(pb, 214, gy(214) - 8, { col: '#20a0c8' });
    A.pots(pb, 196, gy(196) - 4, 2, 7);
    /* ===== 2. CAJAS DEL TUTORIAL Y CARGA (235–400) ===== */
    A.crate(pb, 272, 288, 20, 16, 7); // apoyo visual de la caja alta
    A.sack(pb, 334, gy(334) - 4, { col: '#d8c08a' }); A.sack(pb, 346, gy(346) - 6, { col: '#c8b07a' }); A.sack(pb, 340, gy(340) - 12, { col: '#e0cc98' });
    A.barrel(pb, 238, gy(238) - 6, { r: 6, h: 18 });
    A.planter(pb, 356, gy(356) - 10, 30, { kind: 'palm', seed: 21, h: 16 });
    /* ===== 3. CALLE DEL FESTIVAL (400–930) ===== */
    K.lamps = [];
    K.lamps.push(A.lamp(pb, 400, gy(400) - 8, { h: 108, arms: 2 }));
    A.cafeTable(pb, 404, gy(404) - 10, { col: '#20d6c7', seed: 3 });
    K.stall1 = A.stall(pb, 420, gy(420) - 8, 64, { c1: '#ff6b6b', goods: 'juice', sign: 'JUGOS', seed: 3 });
    A.aframe(pb, 492, gy(492) - 6, 'JUGO');
    A.balloonCart(pb, 502, gy(502) - 10);
    K.turbine = C.miniTurbine(pb, 556, gy(556) - 6, 92);
    A.crate(pb, 596, gy(596) - 8, 14, 10, 6); A.pots(pb, 612, gy(612) - 6, 2, 13);
    C.bandstand(pb, 640, 246, 64, gy(640) - 2, { c1: '#20d6c7' });
    A.lamp(pb, 712, gy(712) - 8, { h: 104, basket: true });
    K.stall2 = A.stall(pb, 720, gy(720) - 8, 70, { c1: '#20d6c7', goods: 'arepas', sign: 'AREPAS', seed: 5 });
    K.fountain = A.fountain(pb, 826, gy(826) - 4, 30, { seed: 3 });
    K.stall3 = A.stall(pb, 862, gy(862) - 8, 54, { c1: '#8d6bff', goods: 'crafts', sign: 'ARTESANÍA', seed: 7 });
    K.lamps.push(A.lamp(pb, 900, gy(900) - 8, { h: 108, arms: 2 }));
    A.bench(pb, 922, gy(922) - 8, 34);
    A.planter(pb, 956, gy(956) - 10, 20, { kind: 'flowers', seed: 9 });
    /* ===== 4. ESCENARIO DEL FESTIVAL (980–1180) ===== */
    K.stage = C.stage(pb, 980, 1180, 262, gy(1080), { screen: { x: 1096, y: 168, w: 76, h: 46 } });
    /* ===== 5. CIRCUITO DEMOSTRATIVO SYNARA (1190–1500) ===== */
    K.lamps.push(A.lamp(pb, 1186, gy(1186) - 8, { h: 108, arms: 2 }));
    A.planter(pb, 1196, gy(1196) - 10, 22, { kind: 'agave', seed: 23 });
    K.pergola = C.pergolaPV(pb, 1226, gy(1226) - 6, 84);
    K.bess = C.bess(pb, 1322, gy(1322) - 4, 66, 40);
    K.tank = C.glassTank(pb, 1412, gy(1412) - 2, 50, 84);
    K.lamps.push(A.lamp(pb, 1420 + 64, gy(1484) - 8, { h: 104, arms: 1 }));
    // tuberías del circuito: permeado → tanque, tanque → riego, tanque → electrolizador; cable de potencia
    I.pipe(pb, [[1296, gy(1296) - 9], [1414, gy(1296) - 9]], 2, 'product', { flange: 18, supports: 30, supportTo: (x) => gy(x) - 3 });
    I.pipe(pb, [[1462, gy(1462) - 9], [1500, gy(1462) - 9], [1500, gy(1500) - 14]], 2, 'product', { flange: 0 });
    I.pipe(pb, [[1462, gy(1462) - 56], [1690, gy(1462) - 56], [1690, gy(1690) - 48]], 2, 'product', { flange: 22, supports: 46, supportTo: (x) => gy(x) - 4 });
    for (let x = 1392; x <= 1668; x++) { const t = (x - 1392) / 276, yy = Math.round(lerp(gy(1392) - 26, gy(1668) - 66, t) + Math.sin(t * Math.PI) * 12); PFK.put(pb, x, yy, U('#141418')); PFK.put(pb, x, yy + 1, U('#3a3420')); if (x % 23 === 0) { PFK.put(pb, x, yy - 1, U('#ffd84a')); PFK.put(pb, x, yy + 2, U('#ffd84a')); } }
    /* ===== 6. PARCELA DEMOSTRATIVA CON GOTEO (1490–1650) ===== */
    K.bed = C.raisedBed(pb, 1500, 1640, gy(1500) - 4, { kinds: ['maiz', 'frijol', 'ahuyama', 'maiz', 'tomate', 'aji', 'frijol', 'maiz', 'ahuyama', 'tomate', 'aji', 'maiz', 'frijol'] });
    F.scatter(pb, (x) => back(x) + 3, 1490, 1650, 51, { gap: 9, mix: { tuft: 4, flowers: 2, fern: 1 } });
    PFSigns.post(pb, 1486, gy(1486) - 2, [{ text: 'PARCELA' }], 31, { font: 'tiny' });
    /* ===== 7. HIDRÓGENO DEMOSTRATIVO Y NÚCLEO (1650–2120) ===== */
    K.ely = C.electrolyzer(pb, 1662, gy(1662) - 4);
    C.h2Bullet(pb, 1748, gy(1748) - 4, 48, 9);
    I.pipe(pb, [[1800, gy(1800) - 16], [1880, gy(1800) - 16]], 3, 'product', { flange: 14, supports: 26, supportTo: (x) => gy(x) - 3 });
    I.box3q(pb, 1835, gy(1840) - 12, 11, 9, 4, { ramp: I.STEEL });
    K.core = C.core(pb, 1886, gy(1886), 70, 176, { landing: 262 });
    A.planter(pb, 1972, gy(1972) - 8, 26, { kind: 'palm', seed: 41, h: 16 });
    // puesto de cometas del Capitán Nimbo
    K.flag = A.flagpole(pb, 2040, gy(2040) - 8, 118);
    A.crate(pb, 2000, gy(2000) - 8, 16, 12, 6, { label: '#20d6c7' });
    for (let k = 0; k < 3; k++) { const kx = 2002 + k * 5, ky = gy(2002) - 26 - k * 3; PFK.polyFill(pb, [[kx, ky], [kx + 4, ky + 5], [kx, ky + 12], [kx - 4, ky + 5]], U(['#ff6b6b', '#ffe14d', '#8d6bff'][k])); }
    A.bench(pb, 2072, gy(2072) - 8, 34);
    A.planter(pb, 2100, gy(2100) - 10, 18, { kind: 'flowers', seed: 43 });
    /* ===== 8. SENDERO HACIA LA COSTA (2120–2500) ===== */
    F.scatter(pb, (x) => back(x) + 2, 2120, 2500, 61, { gap: 9, mix: { tuft: 5, bush: 3, agave: 2, flowers: 2, fern: 1, lupine: 1, dry: 2 } });
    for (const [x, h, l] of [[2150, 76, -6], [2230, 62, 5], [2330, 84, -7], [2470, 70, 6]]) F.palm(pb, x, back(x) + 2, h, l, x);
    F.tree(pb, 2392, back(2392) + 3, 58, 63, { wide: 1.05 });
    for (let x = 2160; x < 2500; x += 50 + r.int(0, 30)) if (typeof rockPile === 'function') rockPile(pb, x, back(x) + 5, 14 + r.int(0, 10), 6 + r.int(0, 4), x + 3);
    F.hibiscusBush(pb, 2420, gy(2420) - 5, 20, 14, 65);
    PFSigns.post(pb, 2432, gy(2432) - 7, [{ text: 'COSTA · TOMA' }, { text: 'PLAZA', dir: -1 }], 23, { font: 'tiny' });
  },
  /** Primer plano a ras de suelo (delante de los pies) */
  propsFront(pb, world) {
    const gy = (x) => world.groundAt(x), F = PFFlora;
    for (let x = 2126; x < 2500; x += 23) if ((x * 13) % 5 < 3) F.tuft(pb, x, gy(x) + 3, 7, 7, x);
    for (let x = 1496; x < 1648; x += 13) F.tuft(pb, x, gy(x) + 2, 6, 6, x + 1);
    // macetas de geranios en el bordillo (lejos del centro del camino)
    for (const x of [6, 386, 916, 1192, 1476, 2112]) PFArch.pots(pb, x, gy(x) + 4, 1, x);
  },
  /* ---------------- dinámico ---------------- */
  // el panorama sabe si hay apagón (la torre de SYNARA pasa a baliza roja)
  skyFx(g, sc) { if (sc.backdrop) sc.backdrop.power = sc.state && sc.state.dark ? 0 : 1; },
  renderBack(g, sc, cam) {
    const S = sc.state, t = Game.time, ox = cam.x, oy = cam.y;
    // guirnaldas de luces sobre la calle, colgadas de las farolas (se apagan con el apagón)
    if (!this._lights) { this._lights = []; for (const [x0, x1, ya, yb] of [[400, 640, 178, 158], [704, 900, 158, 178], [1186, 1484, 178, 182]]) { const pts = []; for (let i = 0; i <= x1 - x0; i++) { const tt = i / (x1 - x0); pts.push([x0 + i, lerp(ya, yb, tt) + Math.sin(tt * Math.PI) * 16]); } this._lights.push(pts); } }
    for (const pts of this._lights) {
      if (pts[0][0] - ox > W + 40 || pts[pts.length - 1][0] - ox < -40) continue;
      g.fillStyle = '#3a2a22';
      for (let i = 0; i < pts.length; i += 2) g.fillRect(pts[i][0] - ox, Math.round(pts[i][1] - oy), 1, 1);
      drawStringLights(g, pts.map(p => [p[0] - ox, p[1] - oy]), t, !S.dark);
    }
  },
  renderMid(g, sc, cam) {
    const S = sc.state, t = Game.time, ox = cam.x, oy = cam.y, w = sc.world, K = LV0_ANCH;
    const gy = (x) => w.groundAt(x) - oy;
    // aerogenerador decorativo de Dante: rotor en tira (luces de colores en las palas)
    if (K.turbine) { if (!this._rot) this._rot = VISTA.rotor(30); const [hx, hy] = K.turbine.hub; VISTA.drawRotor(g, this._rot, hx - ox, hy - oy, t * (S.dark ? 0.2 : 2.4)); if (!S.dark) for (let k = 0; k < 3; k++) { const a = t * 2.4 + k * TAU / 3; fpx(g, Math.round(hx - ox + Math.cos(a) * 24), Math.round(hy - oy + Math.sin(a) * 24), ['#ff6b6b', '#ffe14d', '#20d6c7'][k]); } }
    // fuente: chorros desde las tazas (se detienen con el apagón)
    if (K.fountain && !S.dark) for (const [jx, jy] of K.fountain.jets) for (let i = 0; i < 10; i++) { const ph = (t * 1.4 + i / 10) % 1, a = (i / 10 - 0.5) * 1.8; fpx(g, Math.round(jx - ox + Math.sin(a) * ph * 12), Math.round(jy - oy - 6 - Math.sin(ph * Math.PI) * 7), i % 3 ? '#a6f4ff' : '#ffffff'); }
    // pantalla del escenario
    if (K.stage) { const s = K.stage.screen; this.drawScreen(g, S, s.x - ox, s.y - oy, s.w, s.h, t); }
    // focos del escenario
    if (K.stage && !S.dark) for (const [fx, fy, col] of K.stage.spots) { const on = Math.sin(t * 2 + fx * 0.1) > -0.4; if (on) PFK.drawGlow(g, fx - ox, fy + 2 - oy, 6, col, 0.55); }
    // pérgola FV: destellos cuando SYNARA está activo
    if (K.pergola && S.active && !S.dark) { const [px, py, pw, ph] = K.pergola.cells; for (let i = 0; i < 3; i++) { const k = (t * 0.5 + i * 0.33) % 1; fpx(g, Math.round(px + k * pw - ox + 6), Math.round(py + ph * (0.3 + 0.2 * i) - oy), '#ffffff'); } }
    // estado de carga de la batería
    if (K.bess) drawSOCStrip(g, K.bess.soc[0] - ox, K.bess.soc[1] - oy, K.bess.soc[2], S.soc ?? 0.55, t, S.active && !S.dark ? 1 : 0);
    // tanque Primer Agua: nivel en bandas, ondas y burbujas (sin tramado)
    if (K.tank) {
      const [ix, iy, iw, ih] = K.tank.inner, tx = ix - ox, tb = iy + ih - oy, lvl = Math.round(clamp(S.tank ?? 0.12, 0, 1) * (ih - 2));
      const BANDS = ['#0d3168', '#10508e', '#1268a8', '#1283bf', '#169ccc', '#1ab4d4', '#20d6c7'];
      for (let y = 0; y < lvl; y += 4) { const k = clamp(Math.round((y / ih) * 6), 0, 6); frect(g, tx, tb - y - 4, iw, Math.min(4, lvl - y), BANDS[k]); }
      if (lvl > 1) { frect(g, tx, tb - lvl, iw, 1, '#7ff0dc'); for (let x = 0; x < iw; x += 2) fpx(g, tx + x, tb - lvl - 1 + Math.round(Math.sin(x * 0.4 + t * 3)), '#c6fff2'); }
      if (S.tankIn > 0.01 && !S.dark) for (let i = 0; i < 6; i++) { const ph = (t * 0.8 + i / 6) % 1; fpx(g, tx + 5 + i * 7, Math.round(tb - ph * lvl), '#ffffff'); }
      // reflejo del vidrio (dos franjas)
      g.globalAlpha = 0.35; frect(g, tx + 4, iy - oy + 2, 2, ih - 6, '#ffffff'); frect(g, tx + 8, iy - oy + 2, 1, ih - 6, '#ffffff'); g.globalAlpha = 1;
    }
    // flujos visibles del circuito demostrativo (permeado cian, electricidad amarilla)
    if (S.active) PFInfra.drawFlows(g, sc, LV0_FLOWS);
    // goteo de la parcela
    if (K.bed) drawDrips(g, 1500 + 5 - ox, 1640 - ox, K.bed.dripY - oy, t, S.active && S.irrig && !S.dark, 10);
    // electrolizador: burbujas H2/O2 en las celdas y separadores, luz del rectificador
    if (K.ely) {
      const [cx, cy, cw, ch] = K.ely.cells;
      if (S.active && !S.dark) { drawGasBubbles(g, cx - ox, cy + ch - oy, cw, ch, t, clamp(S.elyRate || 0, 0, 2) * 0.6); drawGasBubbles(g, K.ely.sepH2[0] - 3 - ox, K.ely.sepH2[1] + 18 - oy, 6, 16, t, clamp(S.elyRate || 0, 0, 2) * 0.6); }
      const [lx, ly] = K.ely.led, on = S.active && !S.dark;
      frect(g, lx - ox, ly - oy, 3, 2, on ? ((S.elyRate || 0) > 1.4 ? ((Math.floor(t * 8) % 2) ? '#ff4e5d' : '#ffb93b') : '#86e36f') : '#3a1a20');
      if (on) PFK.drawGlow(g, lx + 1 - ox, ly + 1 - oy, 4, (S.elyRate || 0) > 1.4 ? '#ff4e5d' : '#86e36f', 0.5);
    }
    // válvula maestra
    const vx = 1840 - ox, vy = gy(1840) - 22;
    const ang = (S.valveClosed ? 1 : 0) * Math.PI * 0.5 + (S.valveAnim || 0) * 6;
    frect(g, vx, vy - 4, 1, 4, '#4f4d51');
    fdisc(g, vx, vy - 8, 6, '#ff4e5d'); fdisc(g, vx, vy - 8, 4, '#a82c40');
    for (let k = 0; k < 4; k++) { const a = ang + k * Math.PI / 2; fline(g, vx, vy - 8, vx + Math.cos(a) * 6, vy - 8 + Math.sin(a) * 6, '#ff9a8a'); }
    fpx(g, vx - 2, vy - 12, '#ffd0c8');
    // puerta del núcleo sellada
    if (K.core && S.sealed) {
      const [dx0, dy0, dw, dh] = K.core.door, dx = dx0 - ox, dy = dy0 - oy;
      frect(g, dx, dy, dw, dh, '#2a0c18'); for (let k = 0; k < dh; k += 4) frect(g, dx, dy + k, dw, 1, (Math.floor(t * 4 + k) % 2) ? '#ff4e5d' : '#6a1414');
      frect(g, dx + dw / 2 - 2, dy + dh / 2 - 4, 5, 7, '#ffe14d');
    }
    // corona del núcleo: halo en anillos (sin tramado)
    if (K.core) { const [cx, cy] = K.core.crown; if (!S.dark) PFK.drawGlow(g, cx - ox, cy - oy, 16, '#c4fbff', 0.32 + 0.12 * Math.sin(t * 2)); else if ((Math.floor(t * 3) % 4) === 0) PFK.drawGlow(g, cx - ox, cy - oy, 16, '#ff4e5d', 0.4); const [bx, by] = K.core.beacon; if (Math.floor(t * 2) % 2) { frect(g, bx - ox - 1, by - oy, 3, 2, S.dark ? '#ff4e5d' : '#3fe0a0'); PFK.drawGlow(g, bx - ox, by - oy + 1, 5, S.dark ? '#ff4e5d' : '#3fe0a0', 0.6); } }
    // bandera y cometas de Nimbo
    if (K.flag) { const fx = K.flag.fx - ox, fy = K.flag.fy - oy; for (let i = 0; i < 18; i++) { const wv = Math.round(Math.sin(t * 6 - i * 0.5) * (i / 18) * 2.5); frect(g, fx + i, fy + wv, 1, 11, i % 6 < 3 ? '#20d6c7' : '#ffffff'); if (i > 6 && i < 11) frect(g, fx + i, fy + 4 + wv, 1, 3, '#ffe14d'); } }
    VISTA.drawKites(g, LV0_KITES, -ox, -oy, t);
    PFInfra.drawLeds(g, sc, LV0_LEDS);
  },
  drawScreen(g, S, x, y, w, h, t) {
    frect(g, x, y, w, h, '#0a1030');
    if (S.dark) {
      if (S.minimumsFlash > 0 || (Math.floor(t * 2.3) % 9) === 0) { frect(g, x, y, w, h, '#100618'); drawText(g, 'MINIMUMS', x + w / 2, y + h / 2 - 8, { font: 'tiny', align: 'center', color: '#f27ee6' }); drawText(g, 'SATISFIED', x + w / 2, y + h / 2 + 2, { font: 'tiny', align: 'center', color: '#f27ee6' }); }
      else for (let i = 0; i < 8; i++) frect(g, x + ((i * 17 + Math.floor(t * 40)) % w), y + ((i * 7) % h), 6, 1, '#2a1a3a');
      return;
    }
    // barrido de líneas de la pantalla LED
    g.globalAlpha = 0.25; for (let yy = 1; yy < h; yy += 3) frect(g, x, y + yy, w, 1, '#1a2a5a'); g.globalAlpha = 1;
    if (!S.active) {
      const k = (Math.sin(t * 2) + 1) / 2;
      drawText(g, 'SYNARA', x + w / 2, y + 9, { font: 'bold', align: 'center', color: '#56e5ff' });
      frect(g, x + 10, y + 24, Math.round((w - 20) * (0.3 + 0.7 * k)), 3, '#20d6c7');
      drawText(g, '1ER AGUA', x + w / 2, y + 32, { font: 'tiny', align: 'center', color: '#ffe14d' });
      return;
    }
    // mapa vivo del nexo en miniatura (flujos contradictorios durante la anomalía)
    const nodes = [[10, 12], [28, 12], [46, 12], [62, 26], [38, 32], [14, 32]];
    const cols = ['#56e5ff', '#56e5ff', S.anomaly ? '#ff4e5d' : '#56e5ff', '#d8fff8', '#ffe14d', '#86e36f'];
    for (let i = 0; i < nodes.length - 1; i++) { const [ax, ay] = nodes[i], [bx, by] = nodes[i + 1]; const ph = (t * 2 + i * 0.3) % 1; fline(g, x + ax, y + ay, x + bx, y + by, '#1d346c'); fpx(g, x + lerp(ax, bx, ph), y + lerp(ay, by, ph), cols[i]); }
    for (const [nx, ny] of nodes) frect(g, x + nx - 1, y + ny - 1, 3, 3, '#fffaf0');
    if (S.anomaly) drawText(g, 'H2 ↑  TQ =', x + 4, y + h - 8, { font: 'tiny', color: (Math.floor(t * 4) % 2) ? '#ff4e5d' : '#ffe14d' });
  },
  renderFront(g, sc, cam) {
    const S = sc.state, t = Game.time;
    // molinos de papel en manos de los niños (a la altura de la mano de un niño ≈ 52 px)
    for (const id of ['kid1', 'kid2']) { const a = sc.world.find(id); if (a && !a.hidden) drawPaperWindmill(g, Math.round(a.x - cam.x + a.facing * 8), Math.round(a.y - cam.y - 38), t * (S.dark ? 0.5 : 6), id === 'kid1' ? '#ff6b6b' : '#8d6bff'); }
    // caños del muro: gotas que bajan por el chorro y destellos en la acequia; faroles de pared
    PFDyn.wallWater(g, sc, cam, !S.dark);
    PFDyn.wallLamps(g, sc, cam, S.dark ? 0.9 : 0.35);
    // confeti durante la celebración
    if (S.party > 0 && Math.random() < 0.6) sc.world.ps.emit('confetti', cam.x + Math.random() * W, cam.y - 4, 0, 30, 1);
  },
  renderGrade(g, sc) {
    const S = sc.state;
    const d = S.darkK || 0;
    if (d > 0) {
      g.globalCompositeOperation = 'multiply'; g.globalAlpha = d * 0.78; frect(g, 0, 0, W, H, '#463c86'); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      // fuentes de luz que sobreviven al apagón: alarma del núcleo y pantalla
      const cam = sc.cam, t = Game.time;
      const glow = (x, y, r, col, k) => { g.globalCompositeOperation = 'lighter'; g.globalAlpha = k * d; for (let i = 3; i > 0; i--) fdisc(g, x, y, r * i / 3, col); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; };
      glow(1921 - cam.ox, sc.world.groundAt(1886) - 30 - cam.oy, 26, '#5a0a1a', 0.5 + 0.3 * Math.sin(t * 4));
      glow(1140 - cam.ox, 210 - cam.oy, 22, '#3a0a4a', 0.6);
    } else if (S.goldK) { g.globalCompositeOperation = 'soft-light'; g.globalAlpha = S.goldK * 0.3; frect(g, 0, 0, W, H, '#ffb070'); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  },
  lens(g, sc, cam, k) {
    const ox = cam.x, oy = cam.y, S = sc.state, w = sc.world;
    const gy = (x) => w.groundAt(x) - oy;
    lensBoundary(g, 1226 - ox, 170 - oy, 600, 112, '#ffe14d', 'LÍMITE: CIRCUITO DEMOSTRATIVO SYNARA');
    const rec = S.dark ? ' (último registro)' : '';
    const v = S.flowRec || { pv: 210, tankIn: 4.2, irr: 1.2, h2: 0.4, soc: 0.55 };
    lensTag(g, 1240 - ox, 186 - oy, 'FV ' + fmt0(S.dark ? 0 : v.pv) + ' kW' + (S.dark ? ' (sin sol útil)' : ''), '#ffe14d', 'sun');
    lensTag(g, 1338 - ox, 222 - oy, 'SOC ' + fmt0((S.soc ?? 0.55) * 100) + ' % · energía en kWh', '#86e36f', 'battery');
    lensTag(g, 1400 - ox, 196 - oy, 'Tanque ' + (v.tankIn >= 0 ? '+' : '') + fmt(v.tankIn, 1) + ' m³/h' + rec, v.tankIn > 0.05 ? '#a6f4ff' : '#ff9a8a', 'tank');
    lensTag(g, 1500 - ox, 250 - oy, 'Riego ' + fmt(v.irr, 1) + ' m³/h' + rec, v.irr > 0 ? '#86e36f' : '#ff9a8a', 'plant');
    lensTag(g, 1640 - ox, 206 - oy, 'H2 ' + fmt(v.h2, 1) + ' kg/h' + rec, v.h2 > 1 ? '#ff9a8a' : '#d8fff8', 'h2');
    lensTag(g, 1760 - ox, 240 - oy, 'Válvula maestra: ' + (S.valveClosed ? 'CERRADA' : 'abierta'), S.valveClosed ? '#ff4e5d' : '#c2f58e', 'warn');
    Charts.flow(g, [[1462 - ox, gy(1462) - 56], [1690 - ox, gy(1462) - 56]], 'water', S.anomaly || S.dark ? 1.4 : 0.6, 3);
    Charts.flow(g, [[1296 - ox, gy(1296) - 9], [1414 - ox, gy(1296) - 9]], 'permeate', 1, 3);
    Charts.flow(g, [[1392 - ox, gy(1392) - 26], [1668 - ox, gy(1668) - 66]], 'power', 1, 2);
    if (S.dark && !S.lensSeen && sc.player.x > 1200 && sc.player.x < 1800) { S.lensT = (S.lensT || 0) + Game.dt; if (S.lensT > 1.6) { S.lensSeen = true; sc.run(() => lensInsight(sc)); } }
  },
  hud(g, sc) {
    const S = sc.state;
    if (!S.hud) return;
    hudGauges(g, [
      { icon: 'tank', label: 'TANQUE', value: fmt0((S.tank ?? 0) * 100) + ' %', frac: S.tank ?? 0, color: '#56e5ff' },
      { icon: 'plant', label: 'RIEGO', value: S.irrig && !S.dark ? 'ACTIVO' : 'CERRADO', frac: S.irrig && !S.dark ? 1 : 0, color: S.irrig && !S.dark ? '#86e36f' : '#ff4e5d' },
      { icon: 'h2', label: 'H2', value: fmt(S.dark ? 0 : (S.elyRate || 0) * 2, 1) + ' kg/h', frac: clamp((S.elyRate || 0) / 2, 0, 1), color: (S.elyRate || 0) > 1.4 ? '#ff4e5d' : '#d8fff8' },
      { icon: 'battery', label: 'BATERÍA', value: fmt0((S.soc ?? 0.55) * 100) + ' %', frac: S.soc ?? 0.55, color: '#86e36f' },
    ]);
  },
  /* ---------------- guion ---------------- */
  setup(sc, p) {
    const S = sc.state;
    Object.assign(S, { tank: 0.12, tankIn: 0, irrig: false, elyRate: 0, soc: 0.55, active: false, dark: false, darkK: 0, goldK: 1, party: 0, hud: false, valveClosed: false, valveAnim: 0, sealed: false, anomaly: false, minimumsFlash: 0 });
    LEVELS[0]._spin = 1.3;
    const naira = sc.actor('naira', 'naira', 1440, { facing: 1 });
    const dante = sc.actor('dante', 'dante', 586, { facing: -1, restAnim: 'repair' });
    const eliana = sc.actor('eliana', 'eliana', 1150, { facing: -1 });
    const limen = sc.actor('limen', 'limen', 1840, { fly: true, y: 230, hidden: true, talkable: false });
    const alma = sc.actor('alma', 'alma', 690, { facing: 1, talkable: true });
    const kid1 = sc.actor('kid1', 'crowd8', 470, { wander: 40, talkable: false });
    const kid2 = sc.actor('kid2', 'crowd9', 920, { wander: 30, talkable: false });
    const fela = sc.actor('fela', 'crowd5', 452, { facing: 1 });
    const nimbo = sc.actor('nimbo', 'nimbo', 2010, { facing: -1 });
    const crowd = [];
    [[1000, 'crowd0'], [1030, 'crowd1'], [1068, 'crowd3'], [1196, 'crowd4'], [1226, 'crowd6'], [1300, 'crowd7'], [1560, 'crowd10'], [830, 'crowd11'], [620, 'crowd12'], [380, 'crowd13']].forEach(([x, c], i) => crowd.push(sc.actor('crowd' + i, c, x, { talkable: false, wander: i % 3 ? 14 : 0 })));
    S.crowd = crowd;
    // ecos de memoria de KIRU
    w0(sc).add(new Pickup({ kind: 'echo', x: 672, y: 226, onPick: () => kiruEcho(sc, 'l0a', 'KIRU: "Ese olor a arepa... ya lo registré antes. En otra plaza. Con otra gente."') }));
    w0(sc).add(new Pickup({ kind: 'echo', x: 1920, y: 238, onPick: () => kiruEcho(sc, 'l0b', 'KIRU: "Mi memoria tiene una carpeta llamada EL_ORIGEN. Está vacía. ¿Por qué tengo una carpeta vacía?"') }));
    // molinos de papel perdidos (misión secundaria)
    S.mills = 0;
    for (const [x, y] of [[668, 232], [278, 238], [1140, 244]]) w0(sc).add(new Pickup({ kind: 'mill', x, y, hidden: true, draw: (g, px, py, pk) => { if (!S.millQuest) return; drawPaperWindmill(g, px, py - 6, pk.t * 7, '#ffe14d'); }, onPick: (pk) => { S.mills++; Game.toast('Molino de papel (' + S.mills + '/3)', 'wind', '#ffe14d', 2); } }));
    // los molinos solo se recogen con la misión activa
    for (const e of w0(sc).entities) if (e.kind === 'mill') { const up = e.update.bind(e); e.update = (dt) => { if (S.millQuest) up(dt); else e.t += dt; }; }
    // --- conversaciones
    dante.onTalk = async (sc2) => {
      if (!S.metDante) {
        S.metDante = true;
        await sc2.say([
          ['dante', 'joy', '¡Amaya! Mira: la turbina decorativa ya gira. Le puse luces. Y un poquito de cinta.'],
          ['amaya', 'skeptical', '¿Cuánta cinta?'],
          ['dante', 'smile', 'La necesaria para que el manual no se entere.'],
          ['kiru', 'curioso', 'Velocidad de giro actual: entusiasta. Potencia útil: decorativa.'],
          ['dante', 'thinking', 'Ojo, que el viento hoy viene a rachas. En la azotea la cinta vibra el doble que aquí abajo.'],
        ]);
        Codex.unlock('p_dante');
      } else await sc2.say([['dante', 'smile', S.dark ? 'No toqué nada. Lo juro por mi cinta.' : 'La consola está en el escenario. Yo cuido la turbina… y la cinta.']]);
    };
    naira.onTalk = async (sc2) => {
      if (!S.metNaira) {
        S.metNaira = true;
        await sc2.say([
          ['naira', 'calm', 'Todos miran la pantalla. Yo prefiero mirar los tanques.'],
          ['amaya', 'smile', 'La pantalla resume los tanques, Naira.'],
          ['naira', 'skeptical', 'Una gráfica bonita puede esconder una parcela seca. Yo voy a mirar el nivel del agua con mis propios ojos.'],
          ['kiru', 'thinking', 'Método Naira: medición directa. Incertidumbre: baja. Glamur: bajo.'],
        ]);
        Codex.unlock('p_naira');
      } else if (S.dark) await sc2.say([['naira', 'worried', 'El agua dejó de subir antes del apagón. No después. Anótalo.']]);
      else await sc2.say([['naira', 'calm', 'El tanque, Amaya. Mira el tanque.']]);
    };
    eliana.onTalk = async (sc2) => { if (!S.speechDone) await sc2.say([['eliana', 'smile', 'Cuando estés lista, sube al escenario. La consola te espera.']]); };
    nimbo.onTalk = async (sc2) => {
      await sc2.say([
        ['nimbo', 'happy', '¡Capitán Nimbo, meteorólogo aficionado y piloto de cometas! Mis cometas leen el viento cuando los anemómetros se aburren.'],
        ['nimbo', 'thinking', 'Hoy hay rachas del noreste. Mañana… quién sabe. El viento no firma contratos.'],
      ]);
      Codex.unlock('p_nimbo');
    };
    alma.onTalk = async (sc2) => sideMills(sc2);
    fela.onTalk = async (sc2) => sideLemonade(sc2);
    // --- estaciones
    sc.station({ id: 'console', x: 1060, y: 262, kind: 'terminal', label: 'Consola SYNARA', glow: '#56e5ff', onUse: async (sc2, st) => consoleFlow(sc2, st) });
    sc.station({ id: 'screenClue', x: 1140, y: 262, kind: 'clue', label: 'Pantalla parpadeante', glow: '#f27ee6', hidden: true, onUse: async (sc2, st) => { st.done = true; await screenClue(sc2); } });
    sc.station({ id: 'core', x: 1921, y: 262, kind: 'clue', label: 'Puerta del núcleo', glow: '#ff4e5d', hidden: true, onUse: async (sc2) => { await sc2.say([['kiru', 'alarmado', 'Sellada desde dentro. Firma de cierre: L.I.M.E.N. Y una segunda firma… ilegible.'], ['amaya', 'determined', 'Eliana está ahí dentro. O estaba.']]); } });
    sc.station({ id: 'solo', x: 2060, kind: 'solo', label: 'Puerta de Evidencia', glow: '#b49cff', hidden: true, onUse: async (sc2, st) => {
      const r = await sc2.open(SOLOScene, { ctx: 'RA-09-C2' });
      st.progress = r.correct; if (r.correct >= 3) { st.done = true; GS.lp(0).solo = true; S.soloDone = true; Codex.unlock('incertidumbre'); }
    } });
    sc.station({ id: 'exit', x: 2460, kind: 'clue', label: 'Ir a la costa', glow: '#ffe14d', hidden: true, onUse: async (sc2) => finishLevel0(sc2) });
    sc.setObjective('Lleva la consola de SYNARA al escenario de la plaza', ['¿Dónde se celebra el festival?', 'El escenario está en el centro de la plaza, a la derecha.', 'Usa A/D para caminar y Espacio para saltar las cajas.']);
    Codex.unlock('nexo');
    if (p.checkpoint === 'blackout') {
      Object.assign(S, { active: true, dark: true, darkK: 1, goldK: 0, sealed: true, valveClosed: true, hud: true, speechDone: true, stage: 'lens', tank: 0.31, flowRec: { pv: 210, tankIn: 0, irr: 0, h2: 2.9, soc: 0.5 } });
      eliana.hidden = true; GS.giveTool('lente', true); sc.world.find('screenClue').hidden = false; sc.world.find('core').hidden = false;
      sc.musicOverride = 'mystery';
      sc.setObjective('Activa la Lente Nexo (N) junto al circuito demostrativo', ['¿Qué flujos seguían activos antes del apagón?', 'La lente muestra el último registro de cada flujo.', 'Camina hasta el tanque del Primer Agua y pulsa N.']);
    }
  },
  update(sc, dt) {
    const S = sc.state;
    S.darkK = approach(S.darkK || 0, S.dark ? 1 : 0, dt * 0.8);
    S.goldK = approach(S.goldK ?? 1, S.dark ? 0 : 1, dt);
    if (S.minimumsFlash > 0) S.minimumsFlash -= dt;
    if (S.party > 0) S.party -= dt;
    if (S.valveAnim > 0) S.valveAnim = Math.max(0, S.valveAnim - dt);
    LEVELS[0]._spin = S.dark ? 0.2 : 1.3;
    if (S.active && !S.dark) {
      S.tankIn = S.anomaly ? 0 : 0.04;
      S.tank = clamp(S.tank + S.tankIn * dt, 0, 0.95);
      S.soc = clamp(S.soc + dt * 0.004 * (S.anomaly ? -2 : 1), 0, 1);
    }
    if (S.dark && Math.random() < 0.02) sc.world.ps.emit('glitch', 1921 + (Math.random() - 0.5) * 30, 200 + Math.random() * 60, 0, 0, 1);
  },
  triggers: [
    { x: 240, w: 30, run: (sc) => { sc.kiru && sc.kiru.say('Salta las cajas con {y}Espacio{/}. Mantén pulsado para saltar más alto.', 'curioso', 4); } },
    { x: 400, w: 40, run: (sc) => { sc.kiru && sc.kiru.say('Música, arepas y molinos de papel. Mi sensor de alegría está saturado.', 'alegre', 4); } },
    { x: 930, w: 40, run: (sc) => sc.run(() => speechScene(sc)) },
  ],
};
function w0(sc) { return sc.world; }
/* ---------------- anclas y datos animados del plano (kit PF) ---------------- */
const LV0_ANCH = {};
const LV0_FLOWS = [
  { pts: [[1296, 271], [1414, 271]], kind: 'product', rate: (sc) => sc.state.tankIn > 0.01 && !sc.state.dark ? 1 : 0 },
  { pts: [[1462, 271], [1500, 271], [1500, 266]], kind: 'product', rate: (sc) => sc.state.irrig && !sc.state.dark ? 0.8 : 0 },
  { pts: [[1462, 224], [1690, 224], [1690, 232]], kind: 'product', rate: (sc) => sc.state.dark ? 0 : (sc.state.elyRate || 0) },
  { pts: [[1800, 268], [1880, 268]], kind: 'product', rate: (sc) => sc.state.valveClosed || sc.state.dark ? 0 : 0.6 },
];
const LV0_LEDS = [
  { x: 1332, y: 266, col: '#3fe0a0', hz: 1.2 }, { x: 1335, y: 266, col: '#3fe0a0', hz: 1.6, ph: 0.3 }, { x: 1338, y: 266, col: '#ffd84a', hz: 0.8 },
  { x: 1268, y: 248, col: '#56e5ff', hz: 1.4 }, { x: 1680, y: 230, col: '#3fe0a0', hz: 1.1 }, { x: 1950, y: 210, col: '#56e5ff', hz: 1.3 },
];
const LV0_KITES = [{ x: 2010, y: 112, col: '#ff6b6b', sp: 0.6, ph: 0, tail: 1 }, { x: 2070, y: 92, col: '#ffe14d', sp: 0.8, ph: 1.4, tail: 1 }, { x: 2120, y: 126, col: '#8d6bff', sp: 0.5, ph: 2.6, tail: 1 }];

/* ---------------- piezas del guion del nivel 00 ---------------- */
async function speechScene(sc) {
  const S = sc.state;
  if (S.speechDone) return;
  S.speechDone = true;
  const eliana = sc.world.find('eliana');
  await sc.camTo(1080, 280, 1.0);
  for (const a of S.crowd) a.anim = 'idle';
  sc.kiru && (sc.kiru.target = { x: 1000, speed: 90 });
  await sc.wait(0.8);
  await sc.say([
    ['kiru', 'happy', 'Ciudadanos, científicas, agricultores, cabras y dispositivos con garantía vencida…'],
    ['amaya', 'embarrassed', 'KIRU.'],
    ['kiru', 'alegre', 'Resumen: hoy hacemos historia.'],
    ['narr', null, 'La plaza ríe. Alguien aplaude por compromiso. Una cabra, convencida, bala.'],
  ]);
  if (sc.kiru) sc.kiru.target = null;
  await sc.walk(eliana, 1100, 50);
  await sc.say([
    ['eliana', 'smile', 'Amaya. Antes de encender: ¿qué optimiza tu controlador?'],
    ['amaya', 'determined', 'Producción, costo y estabilidad.'],
    ['eliana', 'thinking', '¿Qué queda fuera?'],
    ['amaya', 'smile', 'Nada importante.'],
    ['narr', null, 'Eliana no sonríe.'],
    ['eliana', 'calm', 'Un modelo útil sabe qué ignora. Construye el mapa completo antes de abrir las válvulas.'],
  ]);
  Codex.unlock('p_eliana'); Codex.unlock('p_kiru'); Codex.unlock('p_amaya');
  sc.camRelease();
  sc.setObjective('Sube al escenario y reconstruye el mapa de SYNARA en la consola', ['¿Qué necesita cada parte para funcionar?', 'Agua, electricidad e hidrógeno son flujos distintos con unidades distintas.', 'La consola está sobre el escenario: sube y pulsa E.']);
}
async function consoleFlow(sc, st) {
  const S = sc.state;
  if (!S.speechDone) { await speechScene(sc); return; }
  if (!S.active) {
    const r = await sc.open(NexusSim, { phase: 'demo', stopAfter: 'guided' });
    if (!r || !r.ok) { sc.kiru && sc.kiru.say('El mapa aún no está completo. Podemos volver cuando quieras.', 'valiente'); return; }
    Codex.unlock('flujos_reservas'); Codex.unlock('unidades');
    await activation(sc);
    return;
  }
  if (S.stage === 'repair') {
    const r = await sc.open(NexusSim, { phase: 'auto', stopAfter: 'transfer' });
    if (!r || !r.ok) { sc.kiru && sc.kiru.say('El Diagrama Roto sigue roto. Ningún flujo real fue dañado: reintentemos.', 'valiente'); return; }
    GS.lp(0).guardian = true; Codex.unlock('limites_sistema');
    await actOne(sc);
    return;
  }
  if (S.stage === 'done') { await sc.open(NexusSim, { phase: 'free', stopAfter: 'free' }); return; }
  await sc.say([['kiru', 'confundido', 'La consola solo muestra estática. Primero entendamos qué pasó: usa la Lente Nexo junto al circuito.']]);
}
async function activation(sc) {
  const S = sc.state;
  await sc.camTo(1500, 280, 1.4);
  Audio2.sfx('power'); Game.doFlash('#fff6d8', 0.4);
  S.active = true; S.hud = true; S.irrig = true; S.elyRate = 1; S.party = 6; LEVELS[0]._spin = 2;
  for (const a of S.crowd) a.anim = 'celebrate';
  Audio2.playMusic('festival');
  await sc.say([
    ['narr', null, 'SYNARA despierta: los paneles brillan, las turbinas giran, el agua atraviesa la planta y el primer tanque comienza a subir. En la parcela se enciende el goteo y el pequeño electrolizador burbujea.'],
    ['kiru', 'esperanzado', 'Tanque: subiendo. Riego: activo. Hidrógeno: 2 kg/h. Sensor de alegría: fuera de escala.'],
  ]);
  await sc.wait(3.2);
  // anomalía: la línea de H2 se acelera y el tanque deja de subir
  S.anomaly = true; S.irrig = false; S.elyRate = 1.45;
  Audio2.sfx('alarm', { vol: 0.4 });
  for (const a of S.crowd) a.anim = 'idle';
  await sc.wait(1.0);
  S.elyRate = 1.9;
  await sc.say([
    ['naira', 'worried', 'Amaya. El riego se cerró. Y el tanque dejó de subir.'],
    ['amaya', 'surprised', 'No toqué nada. La pantalla dice que todo está… ¿en verde?'],
    ['kiru', 'alarmado', 'Electrolizador al 190 %. La línea de agua hacia el hidrógeno sigue activa. La de las casas no.'],
  ]);
  S.flowRec = { pv: 210, tankIn: 0, irr: 0, h2: 2 * S.elyRate, soc: S.soc };
  // LIMEN
  const limen = sc.world.find('limen');
  await sc.camTo(1820, 280, 0.9);
  limen.hidden = false; limen.x = 1840; Audio2.sfx('limen'); sc.world.ps.emit('crystal', 1840, 200, 0, 0, 40, 20); Game.doFlash('#c4fbff', 0.6);
  sc.musicOverride = 'mystery'; Audio2.playMusic('mystery');
  await sc.wait(0.6);
  await sc.say([['limen', 'alert', 'NO REINICIEN.']]);
  S.valveClosed = true; S.valveAnim = 0.6; Audio2.sfx('valve'); sc.cam.shake(3, 0.5);
  await sc.wait(0.7);
  limen.hidden = true; sc.world.ps.emit('crystal', 1840, 200, 0, 0, 30, 20);
  // apagón
  S.dark = true; S.elyRate = 0; Audio2.sfx('blackout'); Audio2.setAmbience({ wind: 0.4, birds: 0, sea: 0.1 });
  S.minimumsFlash = 0.25;
  await sc.wait(0.8);
  // Eliana corre al núcleo
  const eliana = sc.world.find('eliana');
  await sc.say([['eliana', 'scared', '¡No! ¡Nadie toque la consola!']]);
  eliana.x = Math.max(eliana.x, 1500);
  await sc.walk(eliana, 1921, 160);
  S.sealed = true; Audio2.sfx('valve'); sc.cam.shake(2, 0.4); eliana.hidden = true;
  sc.world.ps.emit('glitch', 1921, 240, 0, 0, 30, 10);
  await sc.wait(0.8);
  await sc.camTo(1300, 280, 1.0);
  await sc.say([
    ['amaya', 'angry', '¡LIMEN cerró la válvula maestra! ¡Eso fue un sabotaje!'],
    ['dante', 'worried', 'Y la doctora… las puertas del núcleo se sellaron con ella dentro.'],
    ['naira', 'thinking', 'Antes de acusar a nadie, Amaya: el agua dejó de subir {y}antes{/} de que apareciera esa cosa.'],
    ['amaya', 'skeptical', 'Puede ser un efecto del ataque.'],
    ['kiru', 'thinking', 'Propuesta: calibro la {c}Lente Nexo{/} con los registros de los últimos minutos. Veremos qué flujos estaban activos.'],
  ]);
  GS.giveTool('lente');
  Codex.unlock('p_limen');
  sc.camRelease();
  S.stage = 'lens';
  sc.world.find('screenClue').hidden = false; sc.world.find('core').hidden = false;
  GS.save('blackout');
  sc.setObjective('Activa la Lente Nexo (N) junto al circuito demostrativo', ['¿Qué flujos seguían activos antes del apagón?', 'La lente muestra el último registro de cada flujo y el límite del sistema.', 'Camina hasta el tanque del Primer Agua y pulsa N.']);
  Game.toast('Herramienta: {c}Lente Nexo{/} (N)', 'lens', '#56e5ff', 4);
}
async function lensInsight(sc) {
  const S = sc.state;
  await sc.say([
    ['kiru', 'thinking', 'Último registro: tanque {o}+0,0 m³/h{/}. Riego {o}0{/}. Hidrógeno {y}' + fmt(S.flowRec ? S.flowRec.h2 : 3.8, 1) + ' kg/h{/}, casi el doble de lo programado.'],
    ['amaya', 'thinking', 'La planta producía permeado… pero el tanque no crecía. Entonces el agua se estaba yendo a algún lado.'],
    ['naira', 'calm', 'Una reserva no crece por producir. Crece si entra más de lo que sale.'],
  ]);
  const ok = await explain(sc, {
    id: 'lv0_explain', ra: 'RA-08', concepts: ['massBalance', 'systemsThinking'],
    prompt: 'Antes del apagón, la OI producía permeado pero el nivel del tanque del Primer Agua no subía. ¿Qué relación explica esa observación?',
    options: [
      'Las salidas del tanque (hacia el electrolizador y otros usos) igualaban o superaban la entrada de permeado; una reserva solo crece si las entradas superan a las salidas.',
      'La OI dejó de funcionar en cuanto apareció LIMEN, así que no entraba agua al tanque.',
      'El permeado se transformó en electricidad dentro del tanque y por eso su volumen no aumentaba.',
      'El tanque estaba lleno: cuando un tanque produce agua, el nivel queda fijo.'],
    key: 0, mis: 'pensar que producir significa acumular',
    why: 'ΔReserva = (entradas − salidas) · Δt. El registro muestra que el electrolizador aceleró y retiró agua del tanque mientras el riego se cerraba: el agua producida no se acumulaba. La anomalía empezó antes de que LIMEN apareciera.',
    whyNot: { 1: 'El registro muestra flujo de permeado activo hasta el apagón; el tanque dejó de subir antes de la aparición de LIMEN.', 2: 'El agua no se convierte en electricidad en un tanque. Agua y energía son flujos distintos.', 3: 'El tanque estaba al ' + fmt0((S.tank || 0.3) * 100) + ' %; además, un tanque almacena, no produce.' },
  });
  if (ok) S.explained = true;
  S.stage = 'repair';
  sc.setObjective('Repara el Diagrama Roto en la consola SYNARA', ['¿Qué conexiones del mapa son físicamente imposibles?', 'Busca energía tratada como agua, ciclos que se alimentan a sí mismos y agua salada hacia consumo.', 'Elimina las líneas rojas con su ✕ y completa el hidrógeno y la eólica.']);
  sc.kiru && sc.kiru.say('El mapa de la consola quedó corrupto. Si vamos a reiniciar algún día, necesitamos un mapa verdadero.', 'valiente', 5);
}
async function screenClue(sc) {
  const S = sc.state;
  S.minimumsFlash = 1.5;
  await sc.wait(0.4);
  await sc.say([
    ['kiru', 'confundido', 'Un fotograma de la consola central, justo en el apagón: {p}MINIMUMS SATISFIED{/}.'],
    ['amaya', 'thinking', '"Mínimos satisfechos"… ¿mínimos de qué? El riego estaba cerrado.'],
    ['kiru', 'thinking', 'Lo guardo en el tablero de evidencias. Puede ser un error de interfaz. O no.'],
  ]);
  GS.addClue('minimums');
}
async function actOne(sc) {
  const S = sc.state;
  await sc.say([
    ['narr', null, 'Al caer la tarde, la radio de la ciudad repite una sola frase: "LIMEN secuestró a la Dra. Rojas y robó el agua de Aridia."'],
    ['amaya', 'determined', 'Voy a recuperarla. Y voy a encontrar a esa cosa de cristal.'],
    ['kiru', 'happy', 'Excelente. Una misión sencilla con agua, electricidad, presión, gases y una entidad misteriosa.'],
    ['dante', 'skeptical', 'Dijiste "sencilla".'],
    ['kiru', 'curioso', 'Era ironía preventiva.'],
    ['naira', 'calm', 'Si LIMEN apareció primero en la toma del mar hace tres días, empecemos por allí. El agua de entrada lo cambia todo.'],
  ]);
  const c = await sc.say([['amaya', 'thinking', 'La ciudad quiere una respuesta esta noche. ¿Qué digo por la radio?', { choices: ['"LIMEN saboteó SYNARA. Lo detendremos."', '"Sabemos qué ocurrió en los flujos, pero aún no por qué. Investigaremos con datos."'] }]]);
  GS.decide('radioHonest', c === 1);
  LearningModel.record({ kind: 'challenge', id: 'lv0_conclusion_sustentada', ra: 'RA-09', concepts: ['communication', 'steamInquiry'], solo: 1, correct: c === 1, misconception: c === 1 ? null : 'presentar una hipótesis como conclusión' });
  if (c === 1) { GS.trust('community', 6); await sc.say([['naira', 'smile', 'Eso es una conclusión que podrás sostener mañana.'], ['kiru', 'esperanzado', 'Honestidad epistémica: +1. Popularidad inmediata: −1. Buena inversión.']]); }
  else { GS.trust('community', -2); await sc.say([['naira', 'skeptical', 'Ojalá no tengas que retractarte. El tanque dejó de subir antes de que llegara.'], ['kiru', 'culpable', 'Registraré esa frase. Por si acaso.']]); }
  Codex.unlock('conclusion');
  S.stage = 'done';
  sc.world.find('solo').hidden = false; sc.world.find('exit').hidden = false;
  sc.setObjective('Abre la Puerta de Evidencia y sigue hacia la costa', ['La Puerta está pasando el núcleo de SYNARA.', 'Comunicar incertidumbre no es debilidad: es precisión.']);
}
async function finishLevel0(sc) {
  const S = sc.state;
  if (S.stage !== 'done') { sc.kiru && sc.kiru.say('Antes de irnos, entendamos qué ocurrió en la plaza.', 'confundido'); return; }
  if (!S.soloDone) { const c = await sc.say([['kiru', 'curioso', 'La Puerta de Evidencia aún no registra tu razonamiento. ¿Seguimos?', { choices: ['Volver a la Puerta de Evidencia', 'Seguir (se puede completar desde el mapa)'] }]]); if (c === 0) return; }
  await completeLevel(sc);
  Game.transition(() => Game.setScene(WorldMapScene, { focus: 1 }));
}
/* ---------------- misiones secundarias ---------------- */
async function sideMills(sc) {
  const S = sc.state, lp = GS.lp(0);
  if (lp.side.mills) { await sc.say([['alma', 'happy', '¡Ya sé por qué el de arriba gira más! ¡Porque arriba el viento no choca con los puestos!']]); return; }
  if (!S.millQuest) {
    S.millQuest = true;
    await sc.say([
      ['alma', 'sad', 'Una ráfaga se llevó tres molinos de papel. Uno quedó en el techo del puesto de arepas, otro en las cajas del aula y otro junto al escenario.'],
      ['alma', 'thinking', '¿Me ayudas? Y luego te pregunto una cosa difícil.'],
      ['kiru', 'curioso', 'Misión aceptada. Las cosas difíciles son mi especialidad. Bueno, de Amaya.'],
    ]);
    Codex.unlock('p_alma');
    return;
  }
  if (S.mills < 3) { await sc.say([['alma', 'neutral', 'Llevas ' + S.mills + ' de 3. ¡El viento los esconde en lugares altos!']]); return; }
  const c = await sc.say([['alma', 'thinking', 'Puse uno en el techo y otro en la calle. ¿Por qué el del techo gira mucho más rápido?', { choices: ['Porque arriba el viento tiene menos obstáculos y suele ser más rápido', 'Porque el techo está más cerca del sol y calienta el papel', 'Porque el viento es igual en todas partes; debe ser un molino mejor hecho'] }]]);
  const ok = c === 0;
  LearningModel.record({ kind: 'challenge', id: 'side_molinos_de_papel', ra: 'RA-04', concepts: ['wind', 'steamInquiry'], solo: 2, correct: ok, misconception: ok ? null : 'asumir que el viento es constante en el espacio' });
  if (ok) { lp.side.mills = true; Audio2.sfx('success'); GS.trust('community', 4); Codex.unlock('variabilidad'); await sc.say([['alma', 'joy', '¡Por eso los aerogeneradores son tan altos!'], ['kiru', 'happy', 'Y por eso la potencia cambia tanto: crece con el cubo de la velocidad del viento. Un poco más de viento es mucha más energía.']]); }
  else await sc.say([['kiru', 'confundido', 'Hmm. Piensa en los puestos y las casas: frenan el aire cerca del suelo. ¿Dónde sopla sin obstáculos?']]);
}
async function sideLemonade(sc) {
  const lp = GS.lp(0);
  if (lp.side.lemonade) { await sc.say([['narr', null, 'Doña Fela: "Con tus cuentas pedí el agua justa. ¡Ni una gota de más!"']]); return; }
  await sc.say([['narr', null, 'Doña Fela: "Voy a preparar limonada para 300 personas, un vaso de 250 mL cada una. ¿Cuánta agua le pido a SYNARA? El formulario está en metros cúbicos y yo pienso en jarras."']]);
  const c = await sc.say([['amaya', 'thinking', '300 vasos × 250 mL = …', { choices: ['75 L = 0,075 m³', '750 L = 0,75 m³', '75 m³', '7,5 L = 0,0075 m³'] }]]);
  const ok = c === 0;
  LearningModel.record({ kind: 'challenge', id: 'side_limonada_trescientos', ra: 'RA-09', concepts: ['massBalance', 'steamInquiry'], solo: 2, correct: ok, misconception: ok ? null : 'errores de conversión de unidades (L ↔ m³)' });
  if (ok) { lp.side.lemonade = true; Audio2.sfx('success'); Codex.unlock('unidades'); await sc.say([['narr', null, 'Doña Fela: "¡0,075! Qué numerito tan pequeño para tanta limonada."'], ['kiru', 'happy', '1 m³ son 1000 L. Un hogar de Aridia usa ≈ 0,4 m³ al día (supuesto de simulación). Tu limonada cabe en una mañana de una casa.']]); }
  else await sc.say([['kiru', 'confundido', 'Revisemos: 300 × 0,25 L = 75 L. Y 1 m³ = 1000 L. ¿Cuántos m³ son 75 L?']]);
}
