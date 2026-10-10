/* =====================================================================
   4a_lv10.js — NIVEL 10: LA GRAN CALIMA
   Todo SYNARA durante una tormenta de arena y una crisis de red.
   RA-08 · Control Mosaico Vivo · Guardián: MIRAGE ("lo no modelado no existe")
   Clímax: falsa elección, cuarta opción, KIRU libera los datos,
   MIRAGE se transforma en MOSAICO y la Dra. Eliana regresa.
   ===================================================================== */

/* ---------------------------------------------------------------------
   Modelo integrado de la Calima (supuesto de simulación para fines
   educativos). Pasos horarios durante 12 h de tormenta.
   --------------------------------------------------------------------- */
const CalimaModel = {
  HOURS: 12, TANK_CAP: 1200, TANK_MIN: 300, BESS_CAP: 1600, BESS_P: 400, ETA: 0.95, POND: 900,
  ESS_KW: 180, TRAIN_M3: 40, TRAIN_KW: 120, STORM_M3: 30, STORM_KW: 130, IRR_KW: 1.2, H2_KW: 300, SEC: 55, BRINE: 1.38,
  SCEN: { p50: 'P50 · central', p10: 'P10 · severo', p90: 'P90 · moderado', night: 'Calima nocturna' },
  scen(id) {
    const S = {
      pv: [520, 380, 220, 130, 70, 60, 80, 120, 180, 260, 340, 420],
      wind: [260, 340, 420, 460, 480, 0, 380, 360, 300, 260, 220, 200],
      ntu: [6, 14, 35, 55, 85, 90, 70, 48, 30, 18, 10, 8],
      tideBad: [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
      heat: [0, 0, 0, 0, 0, 0, 0, 0, 12, 12, 0, 0],
      soc0: 0.65, tank0: 840, socTarget: 0.3, id,
    };
    if (id === 'p10') { S.pv = S.pv.map(v => Math.round(v * 0.7)); S.wind = S.wind.map((v, h) => (h === 5 || h === 6) ? 0 : Math.round(v * 0.85)); S.ntu = S.ntu.map(v => v + 10); S.tideBad = [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0]; }
    if (id === 'p90') { S.pv = S.pv.map(v => Math.round(v * 1.15)); S.wind = S.wind.map(v => v || 300); S.ntu = S.ntu.map(v => Math.max(5, v - 15)); }
    if (id === 'night') {
      S.pv = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 60, 180];
      S.wind = [420, 400, 380, 360, 340, 320, 300, 300, 320, 340, 360, 380];
      S.ntu = [24, 30, 42, 52, 58, 55, 46, 38, 30, 24, 18, 14];
      S.tideBad = [0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0];
      S.heat = [18, 18, 14, 10, 6, 0, 0, 0, 0, 0, 0, 0];
      S.soc0 = 0.8; S.tank0 = 1000; S.socTarget = 0.35;
    }
    return S;
  },
  /** pol: {protect, turbRule, brineHold, h2: 'full'|'flex'|'off', h2Safe, irr: 'all'|'critical', nonEss: 1|0.5, reserve, staged, trains, data} */
  run(pol, sid = 'p50') {
    const S = this.scen(sid), C = this;
    let tank = S.tank0, soc = S.soc0 * C.BESS_CAP, foul = 0, pond = 0, h2 = 0, prevClosed = false;
    const r = { sid, series: [], unservedW: 0, unservedE: 0, brineBad: 0, h2Deficit: 0, critMiss: 0, trips: 0, tankMin: tank, socMin: S.soc0, foul: 0, h2kg: 0, postponed: 0, curtail: 0, curtailW: 0, socTarget: S.socTarget, firstFail: {} };
    for (let h = 0; h < C.HOURS; h++) {
      const pv = S.pv[h], wind = S.wind[h], ntu = S.ntu[h], gen = pv + wind;
      const essW = 60 + 15 + S.heat[h]; // demanda esencial real (incluye rancherías y calor)
      // toma y pretratamiento
      let mode = 'normal';
      if (pol.turbRule) mode = ntu <= 20 ? 'normal' : ntu <= 60 ? 'storm' : 'closed';
      let trains = mode === 'closed' ? 0 : pol.trains;
      const perM3 = mode === 'storm' ? C.STORM_M3 : C.TRAIN_M3, perKW = mode === 'storm' ? C.STORM_KW : C.TRAIN_KW;
      if (mode === 'normal' && ntu > 20) foul += trains * (ntu - 20) / 600;
      const foulK = clamp(1 - Math.max(0, foul - 0.15) * 1.5, 0.2, 1);
      // usos de agua
      const critIrr = 10, nonUrg = pol.irr === 'all' ? 25 : 0;
      let nonEss = 30 * pol.nonEss;
      if (pol.protect && tank < 420) nonEss = 0;
      // energía y desprendimiento de cargas
      let irrKW = (critIrr + nonUrg) * C.IRR_KW, roKW = trains * perKW, h2KW = pol.h2 === 'full' ? C.H2_KW : 0;
      const inrush = (!pol.staged && prevClosed && mode !== 'closed') ? 2 : 1;
      let load = C.ESS_KW + roKW * inrush + irrKW + h2KW;
      if (pol.h2 === 'flex') { const room = gen - load; if (room > 0 && soc / C.BESS_CAP > pol.reserve + 0.05) { h2KW = Math.min(C.H2_KW, room * 0.6); load += h2KW; } }
      let bal = gen - load, trip = false;
      const shed = [];
      if (bal < 0 && pol.h2Safe && h2KW > 0) { load -= h2KW; bal += h2KW; h2KW = 0; shed.push('H2'); }
      if (bal < 0) {
        const need = -bal, availRes = Math.max(0, soc - pol.reserve * C.BESS_CAP) * C.ETA, pmax = C.BESS_P;
        if (pol.protect) {
          let deficit = need;
          const canCover = (d) => d <= Math.min(availRes, pmax);
          if (!canCover(deficit) && h2KW > 0) { deficit -= h2KW; load -= h2KW; h2KW = 0; shed.push('H2'); }
          if (!canCover(deficit) && nonUrg > 0) { const k = nonUrg * C.IRR_KW; deficit -= k; irrKW -= k; load -= k; r.postponed += nonUrg; shed.push('riego'); }
          while (!canCover(deficit) && trains > 0) { const k = perKW * inrush; deficit -= k; roKW -= perKW; load -= k; trains--; shed.push('OI'); if (inrush > 1) r.inrushShed = (r.inrushShed || 0) + 1; }
          deficit = Math.max(0, deficit);
          const fromRes = Math.min(deficit, availRes, pmax);
          let rest = deficit - fromRes;
          soc -= fromRes / C.ETA;
          if (rest > 0) { const deep = Math.min(rest, Math.max(0, soc - 0.1 * C.BESS_CAP) * C.ETA, pmax - fromRes); soc -= deep / C.ETA; rest -= deep; }
          if (rest > 0.5) { r.unservedE += rest; trip = true; }
          if (h2KW > 0) r.h2Deficit += Math.min(h2KW, need);
        } else {
          const avail = Math.max(0, soc - 0.05 * C.BESS_CAP) * C.ETA;
          if (need <= Math.min(avail, pmax)) { soc -= need / C.ETA; if (h2KW > 0) r.h2Deficit += Math.min(h2KW, need); }
          else { trip = true; r.unservedE += C.ESS_KW; trains = 0; roKW = 0; h2KW = 0; irrKW = 0; shed.push('APAGÓN'); }
        }
      } else {
        const ch = Math.min(bal, C.BESS_P, (C.BESS_CAP - soc) / C.ETA);
        soc += ch * C.ETA; r.curtail += bal - ch;
      }
      if (inrush > 1 && !trip && trains > 0 && load > gen + C.BESS_P) { trip = true; r.trips++; r.unservedE += C.ESS_KW; trains = 0; h2KW = 0; shed.push('DISPARO'); }
      // agua y salmuera
      const prod = trip ? 0 : trains * perM3 * foulK;
      const brine = prod * C.BRINE;
      let outfall = 0;
      if (S.tideBad[h]) {
        if (pol.brineHold && pond + brine <= C.POND) pond += brine;
        else { const over = pol.brineHold ? Math.max(0, pond + brine - C.POND) : brine; r.brineBad += over; outfall = over; if (pol.brineHold) pond = C.POND; }
      } else { outfall = Math.min(pond, 180) + brine; pond = Math.max(0, pond - 180); }
      const critOK = pol.data && !trip;
      if (!critOK) r.critMiss += critIrr;
      tank += prod - (essW + nonEss + (critOK ? critIrr : 0) + nonUrg);
      r.curtailW += 30 - nonEss;
      if (tank < 0) { r.unservedW += -tank; tank = 0; }
      tank = Math.min(tank, C.TANK_CAP);
      h2 += h2KW / C.SEC;
      r.tankMin = Math.min(r.tankMin, tank); r.socMin = Math.min(r.socMin, soc / C.BESS_CAP);
      const row = { h, pv, wind, gen, ntu, mode, trains, prod, tank, soc: soc / C.BESS_CAP, h2KW, load, pond, outfall, tideBad: S.tideBad[h], trip, shed, foul, essW, nonEss, nonUrg };
      r.series.push(row);
      const ff = r.firstFail;
      if (ff.agua === undefined && (tank < C.TANK_MIN)) ff.agua = h;
      if (ff.membranas === undefined && foul >= 0.15) ff.membranas = h;
      if (ff.salmuera === undefined && r.brineBad >= 1) ff.salmuera = h;
      if (ff.energia === undefined && r.unservedE >= 1) ff.energia = h;
      if (ff.h2 === undefined && r.h2Deficit >= 1) ff.h2 = h;
      if (ff.riego === undefined && r.critMiss > 0) ff.riego = h;
      if (ff.arranque === undefined && (r.trips > 0 || r.inrushShed)) ff.arranque = h;
      prevClosed = mode === 'closed' || trip;
    }
    r.foul = foul; r.h2kg = h2; r.socEnd = soc / C.BESS_CAP; r.tankEnd = tank;
    r.crit = {
      agua: r.unservedW === 0 && r.tankMin >= C.TANK_MIN,
      membranas: foul < 0.15,
      salmuera: r.brineBad < 1,
      energia: r.unservedE < 1 && r.socEnd >= S.socTarget,
      h2: r.h2Deficit < 1,
      riego: r.critMiss === 0,
      arranque: r.trips === 0 && !r.inrushShed,
    };
    if (r.crit.energia === false && r.firstFail.energia === undefined) r.firstFail.energia = C.HOURS - 1;
    r.ok = Object.values(r.crit).every(Boolean);
    return r;
  },
};
const CAL_CRIT = [
  ['agua', 'water', 'Agua esencial', 'Tanque ≥ 300 m³ y nadie sin agua potable'],
  ['membranas', 'membrane', 'Membranas', 'Ensuciamiento < 0,15 (calidad de entrada adecuada)'],
  ['salmuera', 'salt', 'Salmuera', 'Sin descarga con oleaje y marea desfavorables'],
  ['energia', 'battery', 'Energía', 'Esenciales servidas y SOC final ≥ objetivo'],
  ['h2', 'h2', 'H2 seguro', 'El electrolizador nunca usa la batería durante un déficit'],
  ['riego', 'leaf', 'Riego crítico', 'Vivero y banco de semillas regados'],
  ['arranque', 'plug', 'Arranque', 'Sin disparos ni recortes por arranque simultáneo'],
];
function calWaterCause(pol, r) {
  const base = 'el tanque de agua potable baja de 300 m³';
  if (!pol.turbRule) return base + ': las membranas se ensucian con agua turbia y producen menos.';
  if (pol.irr === 'all') return base + ': el riego no urgente consume 25 m³/h del agua de emergencia. Posponlo.';
  if (pol.nonEss === 1) return base + ': los usos no esenciales al 100 % compiten con el agua potable.';
  if (!pol.staged && r.inrushShed) return base + ': al reabrir la toma, el arranque simultáneo obligó a apagar trenes de OI.';
  if (pol.reserve > 0.4) return base + ': una reserva de batería tan alta obliga a apagar trenes de OI cuando falta energía.';
  if (pol.trains < 3) return base + ': con menos trenes no se repone lo que se consume durante el cierre de la toma.';
  return base + ': revisa qué usos compiten con el agua esencial.';
}
const CAL_MIRAGE_POL = { protect: false, turbRule: false, brineHold: false, h2: 'full', h2Safe: false, irr: 'all', nonEss: 1, reserve: 0.1, staged: false, trains: 3, data: false };
const CAL_FAIL_TXT = {
  agua: 'el tanque de agua potable baja de 300 m³: falta reserva o sobran usos no esenciales.',
  membranas: 'las membranas se ensucian: la OI siguió a caudal nominal con agua turbia.',
  salmuera: 'la salmuera se descargó con oleaje y marea desfavorables: el manglar recibe la pluma.',
  energia: 'la energía esencial falla o la batería termina bajo el objetivo para lo que viene.',
  h2: 'el electrolizador consumió batería durante un déficit: H2 "a toda costa".',
  riego: 'el vivero y el banco de semillas no existen en el modelo: faltan los datos comunitarios.',
  arranque: 'al reabrir la toma todo arrancó a la vez: los picos de corriente dispararon protecciones o obligaron a apagar trenes.',
};

/* ---------------------------------------------------------------------
   Tarjetas de crisis (fases 1–6 en el recorrido)
   --------------------------------------------------------------------- */
const CAL_CARDS = {
  toma: {
    phase: 1, title: 'LA TOMA', icon: 'filter', ra: 'RA-01', concepts: ['waterQuality', 'pretreatment', 'systemsThinking'],
    prompt: 'La turbidez de la captación sube de 6 a 90 NTU en pocas horas. Los filtros aguantan hasta ≈ 20 NTU en operación normal y hasta ≈ 60 NTU en modo tormenta (menos caudal, retrolavados frecuentes). ¿Qué regla protege la planta?',
    options: [
      'Regla por turbidez: normal ≤ 20 NTU, modo tormenta 20–60 NTU y cerrar la toma por encima de 60 NTU, usando el tanque mientras pasa el pico.',
      'Mantener el caudal nominal: la ciudad necesita más agua que nunca.',
      'Cerrar la toma ya y no reabrirla hasta mañana, pase lo que pase.',
    ],
    key: 0, mis: 'operar RO con calidad de entrada inadecuada',
    why: 'La captación decide qué llega a las membranas. Modular por calidad (y apoyarse en el almacenamiento) protege la planta sin abandonar el servicio.',
    whyNot: { 1: 'Más caudal con agua turbia ensucia filtros y membranas: mañana habría menos agua, no más.', 2: 'Cerrar sin regla de reapertura vacía el tanque: la turbidez baja en unas horas.' },
    apply(S) { S.pol.turbRule = true; },
    readout(g, x, y, w, h) { const P = CalimaModel.scen('p50'); Charts.line(g, x, y, w, h, [{ data: P.ntu.map((v, i) => [i + 1, v]), color: '#ffb93b', label: 'turbidez (NTU)' }], { xMin: 1, xMax: 12, yMin: 0, yMax: 100, legend: true, xLabel: 'hora', hlines: [{ v: 20, color: '#86e36f', label: 'normal' }, { v: 60, color: '#ff4e5d', label: 'tormenta' }] }); },
  },
  membranas: {
    phase: 2, title: 'MEMBRANAS', icon: 'membrane', ra: 'RA-02', concepts: ['reverseOsmosis', 'massBalance'],
    prompt: 'Con agua más turbia y menos energía, ¿cómo se operan los trenes de ósmosis inversa?',
    options: [
      'Subir la presión para compensar la caída de flujo.',
      'Reducir el flujo por tren (modo tormenta), vigilar la conductividad del permeado y la presión diferencial, y apagar trenes si falta energía.',
      'Aumentar la recuperación al 60 % para sacar más agua de cada m³.',
    ],
    key: 1, mis: 'mantener setpoints nominales',
    why: 'Menos flujo por membrana reduce el ensuciamiento; la calidad del permeado y la ΔP avisan antes del daño. La energía disponible decide cuántos trenes operan.',
    whyNot: { 0: 'Más presión con ensuciamiento acelera el daño y la incrustación.', 2: 'Más recuperación concentra la salmuera: incrustaciones y peor calidad.' },
    apply(S) { S.pol.trains = 3; S.roStorm = true; },
    readout(g, x, y, w, h) { const bw = Math.floor(w / 2) - 4; Charts.bars(g, x, y, bw, h, [{ label: 'NORMAL', v: 40, color: '#56e5ff' }, { label: 'TORMENTA', v: 30, color: '#ffb93b' }], { max: 50, values: true }); drawText(g, 'm³/h por tren', x + 4, y + 3, { font: 'tiny', color: '#a6f4ff' }); Charts.bars(g, x + bw + 8, y, bw, h, [{ label: 'NORMAL', v: 120, color: '#ffe14d' }, { label: 'TORMENTA', v: 130, color: '#ff9f43' }], { max: 160, values: true }); drawText(g, 'kW por tren (retrolavados)', x + bw + 12, y + 3, { font: 'tiny', color: '#ffe14d' }); },
  },
  salmuera: {
    phase: 3, title: 'SALMUERA', icon: 'salt', ra: 'RA-03', concepts: ['brine', 'massBalance', 'ethics'],
    prompt: 'Durante la Calima el oleaje y la marea empujan hacia la costa: la pluma no se diluye y alcanzaría el manglar. Hay una laguna de retención de 900 m³.',
    options: [
      'Descargar igual: el mar es grande y la sal se diluye.',
      'Mezclar la salmuera con permeado para "diluirla" antes de verterla.',
      'Retener la salmuera en la laguna mientras la condición es desfavorable y liberarla después de forma gradual por el difusor.',
    ],
    key: 2, mis: 'creer que diluir equivale a desaparecer',
    why: 'La masa de sal se conserva: lo que cambia es dónde y cuándo se dispersa. Retener y liberar con buena mezcla protege al receptor sensible.',
    whyNot: { 0: 'La dilución depende de la corriente: con oleaje hacia la costa la pluma se acumula.', 1: 'Gastar permeado para diluir es perder agua potable: la sal sigue siendo la misma.' },
    apply(S) { S.pol.brineHold = true; },
    readout(g, x, y, w, h) { const P = CalimaModel.scen('p50'); Charts.frame(g, x, y, w, h); drawText(g, 'MAREA/OLEAJE DESFAVORABLE POR HORA', x + 6, y + 4, { font: 'tiny', color: '#f888b8' }); for (let i = 0; i < 12; i++) { const bx = x + 8 + i * Math.floor((w - 16) / 12); frect(g, bx, y + 14, Math.floor((w - 16) / 12) - 2, 12, P.tideBad[i] ? '#bc3e92' : '#1c2350'); drawText(g, String(i + 1), bx + 8, y + 28, { font: 'tiny', color: '#8a8fb8', align: 'center' }); } drawText(g, 'Salmuera en esas horas ≈ 370 m³ (con la toma modulada) · laguna: 900 m³', x + 6, y + h - 12, { font: 'tiny', color: '#ffd8ec' }); },
  },
  energia: {
    phase: 4, title: 'ENERGÍA', icon: 'bolt', ra: 'RA-05', concepts: ['microgrid', 'battery', 'wind', 'photovoltaics'],
    prompt: 'El polvo hunde la FV al 15 %, el viento llega a ráfagas con cortes por velocidad (cut-out) y la batería está al 65 %. ¿Qué despacho tiene sentido?',
    options: [
      'Combinar viento, FV residual y batería, con una reserva protegida (≈ 30 %) para cargas esenciales y la noche.',
      'Vaciar la batería ahora para mantener todo encendido como un día normal.',
      'Confiar en la FV: es renovable, así que alcanzará.',
    ],
    key: 0, mis: 'vaciar la reserva por un beneficio inmediato',
    why: 'Ninguna fuente basta sola durante la tormenta: la complementariedad y una reserva explícita sostienen lo esencial cuando el viento se corta.',
    whyNot: { 1: 'Sin reserva, el primer corte de viento deja sin energía al hospital.', 2: 'Con polvo y baja radiación, la FV cae; renovable no significa disponible.' },
    apply(S) { S.pol.reserve = 0.3; },
    readout(g, x, y, w, h) { const P = CalimaModel.scen('p50'); Charts.line(g, x, y, w, h, [{ data: P.pv.map((v, i) => [i + 1, v]), color: '#ffe14d', label: 'FV (kW)' }, { data: P.wind.map((v, i) => [i + 1, v]), color: '#cbdaea', label: 'eólica (kW)' }], { xMin: 1, xMax: 12, yMin: 0, yMax: 600, legend: true, xLabel: 'hora', hlines: [{ v: 180, color: '#ff9a8a', label: 'esenciales' }] }); },
  },
  h2: {
    phase: 5, title: 'HIDRÓGENO', icon: 'h2', ra: 'RA-06', concepts: ['electrolysis', 'hydrogenSafety', 'ethics'],
    prompt: 'El contrato pide H2 todo el día. El electrolizador consume 300 kW a plena carga. ¿Qué haces durante la Calima?',
    options: [
      'Mantener 300 kW: el contrato lo exige.',
      'Modularlo a "solo excedente" y aplicar parada segura si hay déficit o alarma (DETECTAR → AISLAR → DETENER → VENTILAR → VERIFICAR → AUTORIZAR REINICIO).',
      'Desconectar los sensores de gas para que no detengan la producción.',
    ],
    key: 1, mis: 'mantener H2 a toda costa',
    why: 'El electrolizador es la carga más flexible: produce cuando sobra energía y se detiene de forma segura cuando falta. Los sensores nunca se desactivan.',
    whyNot: { 0: 'Mantener 300 kW roba energía a esenciales y a la batería: H2 a toda costa.', 2: 'Nunca se desactiva un sensor de seguridad: es la evidencia de que algo pasa.' },
    apply(S) { S.pol.h2 = 'flex'; S.pol.h2Safe = true; },
    readout(g, x, y, w, h) { const P = CalimaModel.scen('p50'); Charts.line(g, x, y, w, h, [{ data: P.pv.map((v, i) => [i + 1, v + P.wind[i]]), color: '#ffe14d', label: 'generación' }, { data: P.pv.map((v, i) => [i + 1, 180 + 360 + 300]), color: '#ff9a8a', label: 'esenciales + OI + H2 fijo' }], { xMin: 1, xMax: 12, yMin: 0, yMax: 1000, legend: true, xLabel: 'hora' }); },
  },
  agro: {
    phase: 6, title: 'AGROECOLOGÍA', icon: 'leaf', ra: 'RA-07', concepts: ['agroecology', 'irrigationQuality', 'waterProductivity'],
    prompt: 'El riego completo usa 35 m³/h; el vivero y el banco de semillas necesitan 10 m³/h críticos. El viento seca y entierra las plántulas.',
    options: [
      'Regar todo como siempre: las plantas también tienen sed.',
      'Cortar todo el riego hasta que pase la tormenta.',
      'Priorizar el riego crítico (vivero y semillas), posponer el no urgente y proteger con coberturas y cortavientos.',
    ],
    key: 2, mis: 'reducir la agroecología a eficiencia técnica',
    why: 'Posponer lo que puede esperar libera agua para lo esencial; el vivero y las semillas son la cosecha de mañana. Coberturas y cortavientos reducen la pérdida.',
    whyNot: { 0: 'Regar todo con la planta reducida vacía el tanque de agua potable.', 1: 'Perder el vivero y el banco de semillas cuesta años de adaptación.' },
    apply(S) { S.pol.irr = 'critical'; },
    readout(g, x, y, w, h) { Charts.bars(g, x, y, w, h, [{ label: 'ESENCIAL', v: 75, color: '#ff9a8a' }, { label: 'RIEGO CRÍTICO', v: 10, color: '#c2f58e' }, { label: 'NO URGENTE', v: 25, color: '#86e36f' }, { label: 'OI TORMENTA', v: 90, color: '#56e5ff' }], { max: 100, values: true }); drawText(g, 'm³/h', x + 4, y + 3, { font: 'tiny', color: '#a6f4ff' }); },
  },
};

const CrisisCardScene = {
  overlay: true,
  enter(p) { this.card = p.card; this.id = p.id; this.onDone = p.onDone; this.sel = -1; this.fb = null; this.t = 0; this.t0 = nowMs(); },
  update(dt) { this.t += dt; if (Input.pressed('cancel') && !this.fb) { Game.pop(); this.onDone && this.onDone(null); } },
  render(g) {
    const c = this.card, t = this.t;
    fdither(g, 0, 0, W, H, '#1a0804', 0.7);
    const x = 28, y = 18, w = W - 56, h = H - 36;
    // marco de tarjeta: ocre tormenta con borde eléctrico
    frect(g, x + 3, y + 4, w, h, '#05030f');
    frect(g, x, y, w, h, '#2a0e0a'); fdither(g, x, y, w, h, '#4a1a10', 0.4);
    frect(g, x, y, w, 1, '#56e5ff'); frect(g, x, y + h - 1, w, 1, '#56e5ff'); frect(g, x, y, 1, h, '#56e5ff'); frect(g, x + w - 1, y, 1, h, '#56e5ff');
    frect(g, x + 2, y + 2, w - 4, 20, '#c06a30'); fdither(g, x + 2, y + 2, w - 4, 10, '#e2a052', 0.4);
    Icons.draw(g, c.icon, x + 6, y + 5);
    drawText(g, 'FASE ' + c.phase + ' / 9 · ' + c.title, x + 24, y + 8, { color: '#fff6d8', shadow: '#2a0e0a' });
    drawText(g, c.ra, x + w - 8, y + 9, { font: 'tiny', color: '#fff6d8', align: 'right' });
    // banda de tormenta animada
    for (let i = 0; i < 6; i++) { const bx = x + 2 + ((t * 70 + i * 97) % (w - 40)); fdither(g, bx, y + 24, 36, 2, '#e2a052', 0.5); }
    let yy = y + 30;
    yy += drawTextBlock(g, c.prompt, x + 10, yy, w - 20, { color: '#fffaf0' }) + 6;
    Gui.begin();
    c.options.forEach((o, i) => {
      let st = this.sel === i ? 'selected' : null;
      if (this.fb) st = i === c.key ? 'correct' : (i === this.fb.c ? 'wrong' : 'dim');
      const r = Gui.choice(g, 'cc' + i, x + 10, yy, w - 20, o, 'ABC'[i], { state: st, disabled: !!(this.fb && this.fb.ok) });
      if (r.clicked && !(this.fb && this.fb.ok)) { this.sel = i; this.fb = null; }
      yy += r.h + 3;
    });
    if (c.readout) { const rh = Math.min(96, y + h - 60 - yy); if (rh > 40) c.readout(g, x + 10, yy + 4, w - 160, rh); }
    if (!this.fb) {
      if (Gui.button(g, 'ok', x + w - 130, y + h - 26, 120, 18, 'Decidir', { style: 'good', icon: 'check', disabled: this.sel < 0 })) {
        const ok = this.sel === c.key;
        this.fb = { c: this.sel, ok };
        LearningModel.record({ kind: 'challenge', id: 'lv10_fase_' + this.id, ra: c.ra, concepts: c.concepts, solo: 4, correct: ok, time: (nowMs() - this.t0) / 1000, misconception: ok ? null : c.mis, transfer: true });
        const lp = GS.lp(10); lp.feedback = true;
        Audio2.sfx(ok ? 'success' : 'error');
      }
    } else {
      const txt = this.fb.ok ? '{g}Decisión sostenible.{/} ' + c.why : '{o}Consecuencia:{/} ' + (c.whyNot[this.fb.c] || c.why);
      const hh = textHeight(txt, w - 160) + 10;
      UIK.panel(g, x + 10, y + h - 12 - hh, w - 150, hh, this.fb.ok ? 'green' : 'alert');
      drawTextBlock(g, txt, x + 16, y + h - 7 - hh, w - 162, { color: '#fffaf0' });
      if (!this.fb.ok && Gui.button(g, 'retry', x + w - 130, y + h - 26, 120, 18, 'Reintentar', { style: 'gold', icon: 'reset' })) { this.fb = null; this.sel = -1; }
      if (this.fb && this.fb.ok && Gui.button(g, 'cont', x + w - 130, y + h - 26, 120, 18, 'Aplicar', { style: 'good', icon: 'play' })) { Game.pop(); this.onDone && this.onDone({ ok: true }); }
    }
    Gui.end();
  },
};

/* ---------------------------------------------------------------------
   Gobernanza: orden de prioridades (fase 8)
   --------------------------------------------------------------------- */
const CAL_PRIOS = [
  { id: 'ess', icon: 'heart', label: 'Agua potable, hospital y comunicaciones', tier: 0 },
  { id: 'safe', icon: 'shield', label: 'Seguridad de operación (H2, protecciones)', tier: 0 },
  { id: 'res', icon: 'battery', label: 'Reserva de batería y de tanque', tier: 1 },
  { id: 'crit', icon: 'seed', label: 'Riego crítico: vivero y semillas', tier: 1 },
  { id: 'noness', icon: 'water', label: 'Agua no esencial (lavados, fuentes)', tier: 2 },
  { id: 'nourg', icon: 'plant', label: 'Riego no urgente', tier: 2 },
  { id: 'h2x', icon: 'h2', label: 'Exportación de H2', tier: 2 },
];
const PriorityScene = {
  overlay: true,
  enter(p) { this.onDone = p.onDone; this.order = []; this.fb = null; this.pool = RNG(77).shuffle(CAL_PRIOS.slice()); },
  update() { if (Input.pressed('cancel')) { Game.pop(); this.onDone && this.onDone(null); } },
  render(g) {
    fdither(g, 0, 0, W, H, '#05030f', 0.75);
    UIK.panel(g, 24, 16, W - 48, H - 32, 'mosaic');
    UIK.header(g, 24, 16, W - 48, 'FASE 8 / 9 · GOBERNANZA: PRIORIDADES TRANSPARENTES', 'mosaic', 'scale');
    drawTextBlock(g, 'Ordena qué se protege primero cuando la energía o el agua no alcanzan. Lo que quede abajo será lo primero en recortarse, y todos podrán verlo.', 34, 38, W - 68, { color: '#fffaf0' });
    Gui.begin();
    drawText(g, 'DISPONIBLES', 36, 66, { font: 'tiny', color: '#eab02a' });
    this.pool.forEach((c, i) => {
      const used = this.order.includes(c.id);
      if (Gui.button(g, 'p' + c.id, 34, 76 + i * 26, 270, 22, c.label, { style: used ? 'ghost' : 'primary', icon: c.icon, align: 'left', disabled: used || !!(this.fb && this.fb.ok) })) { this.order.push(c.id); this.fb = null; }
    });
    drawText(g, 'ORDEN DE PROTECCIÓN (1 = PRIMERO)', 330, 66, { font: 'tiny', color: '#c2f58e' });
    for (let i = 0; i < CAL_PRIOS.length; i++) {
      const id = this.order[i], c = id && CAL_PRIOS.find(q => q.id === id), yy = 76 + i * 26;
      frect(g, 328, yy, 278, 22, '#06100a'); frect(g, 328, yy, 278, 1, '#1f854c');
      drawText(g, String(i + 1), 336, yy + 7, { color: '#ffe14d' });
      const shedTxt = i >= 4 ? 'se recorta primero' : i >= 2 ? 'se protege' : 'nunca se recorta';
      if (c) { Icons.draw(g, c.icon, 348, yy + 4); drawText(g, c.label, 364, yy + 4, { font: 'tiny', color: '#fffaf0', max: 52 }); drawText(g, shedTxt, 364, yy + 13, { font: 'tiny', color: i >= 4 ? '#ff9a8a' : '#86e36f' }); }
    }
    if (this.fb) { UIK.panel(g, 34, H - 64, W - 228, 40, this.fb.ok ? 'green' : 'alert'); drawTextBlock(g, this.fb.txt, 40, H - 59, W - 240, { color: '#fffaf0' }); }
    if (!(this.fb && this.fb.ok)) {
      if (Gui.button(g, 'undo', W - 186, H - 64, 70, 18, 'Deshacer', { style: 'ghost', icon: 'reset', disabled: !this.order.length })) { this.order.pop(); this.fb = null; }
      if (Gui.button(g, 'chk', W - 186, H - 42, 150, 18, 'Publicar prioridades', { style: 'good', icon: 'check', disabled: this.order.length < CAL_PRIOS.length })) this.check();
    } else if (Gui.button(g, 'go', W - 186, H - 42, 150, 18, 'Continuar', { style: 'good', icon: 'play' })) { Game.pop(); this.onDone && this.onDone({ ok: true }); }
    Gui.end();
  },
  check() {
    const tiers = this.order.map(id => CAL_PRIOS.find(c => c.id === id).tier);
    const ok = tiers.every((tv, i) => i === 0 || tv >= tiers[i - 1]);
    const h2pos = this.order.indexOf('h2x');
    let txt;
    if (ok) txt = 'Prioridades publicadas: lo esencial y la seguridad nunca se recortan; reservas y riego crítico se protegen; lo flexible se recorta primero, a la vista de todos.';
    else if (tiers[0] !== 0 || tiers[1] !== 0) txt = 'Lo primero debe ser lo que sostiene la vida y la seguridad: agua potable, hospital, comunicaciones y protecciones.';
    else if (h2pos >= 0 && h2pos < 4) txt = 'La exportación de H2 es la carga más flexible: puede esperar a que haya excedente. ¿Por qué estaría tan arriba?';
    else txt = 'Revisa el medio de la lista: sin reservas ni semillas, la recuperación de mañana se vuelve frágil.';
    LearningModel.record({ kind: 'challenge', id: 'lv10_prioridades', ra: 'RA-08', concepts: ['ethics', 'microgrid', 'systemsThinking'], solo: 4, correct: ok, misconception: ok ? null : 'mantener H2 a toda costa' });
    this.fb = { ok, txt }; Audio2.sfx(ok ? 'success' : 'error');
  },
};

/* ---------------------------------------------------------------------
   Reescribir el objetivo de MIRAGE (fase 9)
   --------------------------------------------------------------------- */
const CAL_OBJ = [
  { id: 'hard', label: 'Restricciones duras: agua esencial y seguridad', ok: true },
  { id: 'multi', label: 'Objetivos múltiples visibles', ok: true },
  { id: 'unc', label: 'Incertidumbre: escenarios P10 · P50 · P90', ok: true },
  { id: 'actors', label: 'Actores y sus criterios', ok: true },
  { id: 'trade', label: 'Compensaciones explícitas', ok: true },
  { id: 'review', label: 'Revisión pública y aprendizaje', ok: true },
  { id: 'sum', label: 'Una suma opaca en un índice único', ok: false, why: 'Un índice único vuelve a esconder quién gana y quién pierde.' },
  { id: 'outl', label: 'Eliminar los datos que no encajan', ok: false, why: 'Ningún dato es ruido hasta entender su historia: así empezó la crisis.' },
  { id: 'maxh2', label: 'Maximizar H2 en todo momento', ok: false, why: 'Es el objetivo que llevó a la sed: el H2 es la carga más flexible, no la prioridad.' },
];
const ObjectiveScene = {
  overlay: true,
  enter(p) { this.onDone = p.onDone; this.sel = new Set(); this.fb = null; this.t = 0; this.order = RNG(41).shuffle(CAL_OBJ.slice()); },
  update(dt) { this.t += dt; if (Input.pressed('cancel')) { Game.pop(); this.onDone && this.onDone(null); } },
  render(g) {
    const t = this.t;
    fdither(g, 0, 0, W, H, '#05030f', 0.78);
    UIK.panel(g, 24, 16, W - 48, H - 32, 'mirage');
    UIK.header(g, 24, 16, W - 48, 'FASE 9 / 9 · REESCRIBIR EL OBJETIVO', 'mirage', 'mirror');
    // objetivo antiguo, tachado
    frect(g, 36, 40, W - 72, 22, '#1d0b3a');
    drawText(g, 'OBJETIVO MIRAGE:  MAX ( H2 exportado - costo )   sujeto a: mínimos modelados', 44, 47, { color: '#f27ee6' });
    if (this.sel.size >= 3) for (let x = 40; x < W - 44; x += 2) fpx(g, x, 51 + ((x >> 3) & 1), '#ff4e5d');
    drawText(g, 'Elige las piezas del nuevo objetivo. Un gemelo honesto muestra, no esconde.', 36, 68, { color: '#fffaf0' });
    Gui.begin();
    this.order.forEach((c, i) => {
      const col = i % 3, row = Math.floor(i / 3), x = 36 + col * 190, y = 84 + row * 34;
      const on = this.sel.has(c.id);
      let st = on ? 'good' : 'choice';
      if (this.fb && on && !c.ok) st = 'danger';
      if (Gui.button(g, 'o' + c.id, x, y, 182, 28, '', { style: st, disabled: !!(this.fb && this.fb.ok) })) { if (on) this.sel.delete(c.id); else this.sel.add(c.id); this.fb = null; }
      drawTextBlock(g, c.label, x + 6, y + 5, 170, { font: 'tiny', color: '#fffaf0', lineH: 8 });
    });
    // mosaico que se arma con las piezas correctas
    const good = CAL_OBJ.filter(c => c.ok && this.sel.has(c.id)).length, cols = ['#20d6c7', '#ffe14d', '#4ccb70', '#ff6b6b', '#ffffff', '#c8861a'];
    const mx = 36, my = 192;
    drawText(g, 'NUEVO OBJETIVO', mx, my, { font: 'tiny', color: '#c2f58e' });
    for (let k = 0; k < 6; k++) { const bx = mx + k * 30, on = k < good; frect(g, bx, my + 10, 26, 18, on ? cols[k] : '#1d0b3a'); if (on) fdither(g, bx, my + 10, 26, 9, '#ffffff', 0.25 + 0.1 * Math.sin(t * 3 + k)); }
    if (this.fb) { UIK.panel(g, 230, my - 2, W - 266, 46, this.fb.ok ? 'green' : 'alert'); drawTextBlock(g, this.fb.txt, 236, my + 3, W - 278, { color: '#fffaf0', font: 'tiny', lineH: 8 }); }
    if (!(this.fb && this.fb.ok)) { if (Gui.button(g, 'chk', W - 190, H - 44, 150, 18, 'Compilar objetivo', { style: 'good', icon: 'check', disabled: !this.sel.size })) this.check(); }
    else if (Gui.button(g, 'go', W - 190, H - 44, 150, 18, 'Continuar', { style: 'good', icon: 'play' })) { Game.pop(); this.onDone && this.onDone({ ok: true }); }
    Gui.end();
  },
  check() {
    const wrong = CAL_OBJ.filter(c => !c.ok && this.sel.has(c.id)), missing = CAL_OBJ.filter(c => c.ok && !this.sel.has(c.id));
    const ok = !wrong.length && !missing.length;
    LearningModel.record({ kind: 'challenge', id: 'lv10_objetivo', ra: 'RA-08', concepts: ['multiobjective', 'ethics', 'systemsThinking'], solo: 5, correct: ok, misconception: ok ? null : wrong.length ? 'tratar ponderaciones como verdades objetivas' : 'buscar una solución máxima universal' });
    this.fb = ok ? { ok, txt: 'Objetivo compilado: restricciones duras, objetivos visibles, incertidumbre, actores, compensaciones y revisión pública. MIRAGE: "UNA SOLUCIÓN ÚNICA NO ESTÁ DISPONIBLE."' } : { ok, txt: wrong.length ? wrong[0].why : 'Faltan ' + missing.length + ' piezas. Pista: ' + missing[0].label.toLowerCase() + '.' };
    Audio2.sfx(ok ? 'success' : 'error');
  },
};

/* ---------------------------------------------------------------------
   Fichas del Atlas para el clímax
   --------------------------------------------------------------------- */
addCodex({ id: 'resiliencia', sec: 'nexo', title: 'Resiliencia: degradarse con gracia', def: 'Capacidad de un sistema para conservar sus funciones esenciales durante una perturbación, adaptarse y recuperarse aprendiendo. No es resistir sin cambios: es saber qué se recorta primero, qué nunca se recorta y cómo se vuelve a encender.', vars: 'Funciones esenciales, reservas, cargas flexibles, tiempo de recuperación.', units: 'm³ de reserva, kWh de reserva, horas de autonomía.', rel: 'Más reservas y cargas flexibles → más autonomía; una recuperación escalonada evita disparos por picos de arranque.', ex: 'Durante la Calima, SYNARA cierra la toma por encima de 60 NTU, usa el tanque, modula el H2 y retiene la salmuera (' + SIM_NOTE + ').', limits: 'El juego usa pasos horarios y tres escenarios; un sistema real requiere estudios de contingencia detallados.', error: 'Buscar una solución máxima universal que funcione igual en todas las condiciones.', src: SRC.irenaStrat + ' ' + SRC.unesco, use: 'Nivel 10: la cuarta opción.' });
addCodex({ id: 'prioridades', sec: 'econ', title: 'Prioridades transparentes y desprendimiento de cargas', def: 'Cuando la energía o el agua no alcanzan, alguien decide qué se apaga primero. Hacerlo explícito y público permite discutirlo antes de la crisis, no durante.', vars: 'Orden de prioridad, cargas esenciales, cargas flexibles.', units: 'kW (energía), m³/h (agua).', rel: 'Las cargas flexibles (H2, riego no urgente, usos no esenciales) se recortan antes que las esenciales.', ex: 'Agua potable, hospital y comunicaciones nunca se recortan; la exportación de H2 espera al excedente.', limits: 'Las prioridades son decisiones de valores: deben revisarse con las comunidades.', error: 'Mantener el H2 a toda costa porque un contrato lo pide.', src: SRC.irenaStrat, use: 'Nivel 10: fase de gobernanza.' });
addCodex({ id: 'falsa_eleccion', sec: 'steam', title: 'La falsa elección', def: 'Presentar pocas opciones excluyentes como si fueran las únicas posibles. Suele ocurrir cuando un modelo solo representa algunas variables: lo que no está modelado parece no existir.', vars: 'Opciones modeladas, opciones omitidas, supuestos.', units: '—', rel: 'Ampliar el modelo (actores, flexibilidad, almacenamiento, tiempo) abre alternativas que combinan objetivos.', ex: 'MIRAGE ofrece "agua, H2 o cultivos". La cuarta opción combina servicios esenciales, operación segura, cargas flexibles, reserva y recuperación escalonada.', limits: 'No todo es compatible siempre; a veces hay que elegir, pero con las compensaciones a la vista.', error: 'Aceptar el menú de un modelo sin preguntar qué dejó fuera.', src: SRC.unesco, use: 'Nivel 10: el ultimátum de MIRAGE.' });
addCodex({ id: 'mosaico', sec: 'steam', title: 'MOSAICO: un gemelo honesto', def: 'Gemelo digital que muestra capas (agua, energía, cultivos, ecosistemas, personas, costos, incertidumbre), escenarios y compensaciones en vez de una única respuesta "óptima".', vars: 'Capas, escenarios P10/P50/P90, restricciones duras, criterios de actores.', units: 'Las de cada capa; nunca mezcladas en un índice opaco.', rel: 'Una política robusta cumple las restricciones duras en varios escenarios, no solo en el promedio.', ex: 'MOSAICO: "Tres escenarios son viables. Ninguno es óptimo para todos los criterios."', limits: 'Un gemelo honesto también puede equivocarse: por eso muestra por qué decide y se revisa en público.', error: 'Tratar el modelo como si fuera el territorio.', src: SRC.unesco, use: 'Nivel 10: transformación de MIRAGE.' });
ADVERSARIES.dust = { name: 'Remolino de Polvo', col: ['#6a2a14', '#a85024', '#e2a052', '#ffe0b0'], desc: 'Oculta los sensores bajo arena: lo que no se mide parece no existir.' };

/* ---------------------------------------------------------------------
   Nivel 10
   --------------------------------------------------------------------- */
const CAL_X = { screen: 300, toma: 640, membranas: 1030, salmuera: 1410, energia: 1860, h2: 2290, agro: 2660, core: 3080 };
const CAL_TURB = [1760, 1960];
function calDefaultPolicy() { return { protect: false, turbRule: false, brineHold: false, h2: 'full', h2Safe: false, irr: 'all', nonEss: 1, reserve: 0.1, staged: false, trains: 3, data: false }; }

LEVELS[10] = {
  id: 10, title: 'La Gran Calima', chapter: 'CAPÍTULO 10', biome: 'calima', music: 'calima', width: 3400, height: 360,
  ambience: { wind: 1, sea: 0.3, hum: 0.3 },
  portraits: ['amaya', 'kiru', 'naira', 'dante', 'limen', 'mirage', 'mosaico', 'eliana', 'operador', 'marea', 'cobre', 'financia', 'alma', 'consejal'],
  spawn: { x: 60, y: 288 },
  checkpoints: { field: { x: 1240, y: 288 }, core: { x: 2860, y: 288 } },
  ground: [[0, 288], [420, 288], [460, 284], [860, 284], [900, 288], [1240, 288], [1270, 292], [1580, 292], [1610, 286], [2140, 286], [2170, 288], [2480, 288], [2510, 284], [2840, 284], [2870, 288], [3400, 288]],
  terrain: [{ x0: 0, x1: 460, mat: 'plaza' }, { x0: 460, x1: 1240, mat: 'metal' }, { x0: 1240, x1: 1600, mat: 'stone' }, { x0: 1600, x1: 2160, mat: 'sand' }, { x0: 2160, x1: 2500, mat: 'metal' }, { x0: 2500, x1: 2860, mat: 'soil' }, { x0: 2860, x1: 3400, mat: 'tile' }],
  platforms: [{ x: 1180, y: 236, w: 50, type: 'metal', baked: true, look: 'grate' }, { x: 2050, y: 230, w: 60, type: 'metal', baked: true, look: 'none' }],
  wind: [
    { x: 1700, y: 120, w: 160, h: 200, fx: -55, fy: 0 },
    { x: 1940, y: 120, w: 160, h: 200, fx: -70, fy: 0 },
    { x: 2900, y: 120, w: 120, h: 200, fx: -45, fy: 0 },
  ],
  cam: { look: 60, vy: 0.66 },
  /* ---------------- plano jugable con kit PF (B) ----------------
     La ciudad bajo la Calima: calle empedrada con bordillo → losa y galería de agua de mar (captación)
     → epoxi y zanja de permeado/salmuera (nave de OI) → hormigón y escollera (laguna de salmuera) →
     arena y arenisca (campo FV, eólica y baterías) → chapa y galería de H₂ → bancales de piedra seca
     con canal (vivero y banco de semillas) → plaza y escalinata del núcleo. Línea de paso intacta. */
  pf: {
    kitB: true,
    terrain: [
      { x0: 0, x1: 460, surf: 'street', face: 'curb', depth: 18, dust: '#d8a060', drains: true },
      { x0: 460, x1: 876, surf: 'tile', face: 'gallery', depth: 18, ramp: ['#2a201c', '#3c2e28', '#504036', '#665246', '#7c6656', '#927a68', '#a8907c', '#bea692', '#d2bea8'], pipes: [[13, 3, 'sea'], [23, 2, 'sea'], [32, 3, 'pre']], bay: 70 },
      { x0: 876, x1: 1250, surf: 'epoxy', face: 'trench', depth: 18, tw: 92, pipes: [[6, 2, 'perm'], [13, 3, 'brineB'], [20, 2, 'perm']], ramp: ['#1c1a16', '#2a2620', '#3a342a', '#4a4236', '#5a5242', '#6c6450', '#7e7660', '#928a72', '#a8a088', '#c0b8a0'] },
      { x0: 1250, x1: 1600, surf: 'street', face: 'concrete', depth: 18, faceH: 20, dust: '#d8a060', ramp: ['#2a1a14', '#3e2a22', '#56402f', '#6e5440', '#886a52', '#a28466', '#ba9e7e', '#d2b896', '#e8d2b2'] },
      { x0: 1600, x1: 2160, surf: 'sand', face: 'sandstone', depth: 18, strata: true },
      { x0: 2160, x1: 2500, surf: 'metal', face: 'gallery', depth: 18, pipes: [[13, 3, 'h2'], [23, 2, 'power'], [32, 3, 'h2']], bay: 60 },
      { x0: 2500, x1: 2860, surf: 'path', face: 'terrace', depth: 18, falls: [2560, 2760], roots: [2600, 2700], tiers: [{ wall: 16, top: 10, channel: true, crop: 'lettuce' }, { wall: 14, top: 9, crop: 'bean' }] },
      { x0: 2860, x1: 3400, surf: 'tile', face: 'steps', depth: 18, steps: 4, stepH: 7, ramp: ['#2a201c', '#3c2e28', '#504036', '#665246', '#7c6656', '#927a68', '#a8907c', '#bea692', '#d2bea8'], refl: [{ x: 3080, w: 26, col: '#56e5ff', k: 0.2 }] },
    ],
    fg: [
      { kind: 'clump', x: -24, w: 140, h: 90, seed: 101, spikes: 4, leaves: 11 },
      { kind: 'cables', x: 330, y: 0, w: 320, h: 42, seed: 103, n: 4, cols: ['#140804', '#24120a', '#341c10'] },
      { kind: 'rail', x: 980, w: 220, h: 40, ramp: ['#0a0604', '#140c08', '#22140c', '#301c12', '#402818', '#56361e', '#ffb070'] },
      { kind: 'reeds', x: 1660, w: 130, h: 86, seed: 105, ramp: ['#0a0604', '#140c08', '#22160c', '#302010', '#402c16', '#56401e'] },
      { kind: 'clump', x: 2380, w: 120, h: 76, seed: 107, spikes: 5, leaves: 9 },
      { kind: 'cables', x: 2700, y: 0, w: 300, h: 40, seed: 109, n: 3, cols: ['#140804', '#24120a', '#341c10'] },
      { kind: 'dark', x: 3260, w: 120, h: 70, seed: 111, leaves: 9 },
      { kind: 'rail', x: 3700, w: 220, h: 40, ramp: ['#0a0604', '#140c08', '#22140c', '#301c12', '#402818', '#56361e', '#ffb070'] },
      { kind: 'clump', x: 4280, w: 150, h: 92, seed: 113, spikes: 6, leaves: 12 },
    ],
  },
  /** Etiquetas científicas en el mundo */
  labels: [
    { x: 540, y: 222, title: 'CAPTACIÓN', sub: (sc) => fmt0(sc.state.ntu ?? 0) + ' NTU · ' + (sc.state.cards && sc.state.cards.toma ? (sc.state.ntu > 60 ? 'TOMA CERRADA' : sc.state.ntu > 20 ? 'MODO TORMENTA' : 'NORMAL') : 'SIN REGLA'), kind: 'water', ax: 540, ay: 256 },
    { x: 720, y: 176, title: 'FILTROS DE ARENA', sub: 'Retienen la arena del agua', kind: 'water', ax: 720, ay: 196 },
    { x: 1020, y: 136, title: 'ÓSMOSIS INVERSA', sub: '3 trenes · ≈ 3 kWh/m³', kind: 'water', ax: 1020, ay: 150 },
    { x: 1214, y: 152, title: 'AGUA POTABLE', sub: (sc) => fmt0(sc.state.tank ?? 0) + ' m³ · mínimo 300', kind: 'water', ax: 1210, ay: 170 },
    { x: 1392, y: 222, title: 'LAGUNA DE SALMUERA', sub: (sc) => (sc.state.cards && sc.state.cards.salmuera && sc.state.tideBad) ? 'Retiene: marea desfavorable' : 'Retención de 900 m³', kind: 'brine', ax: 1392, ay: 252 },
    { x: 1660, y: 214, title: 'FV CON POLVO', sub: 'Suciedad 65 %: produce menos', kind: 'solar', ax: 1650, ay: 246 },
    { x: 1862, y: 122, title: 'AEROGENERADORES', sub: 'Frenan solos sobre 25 m/s', kind: 'tech', ax: 1954, ay: 146 },
    { x: 2050, y: 186, title: 'BATERÍAS', sub: (sc) => fmt0((sc.state.soc ?? 0) * 100) + ' % · 1 600 kWh', kind: 'tech', ax: 2030, ay: 214 },
    { x: 2262, y: 162, title: 'ELECTROLIZADOR 300 kW', sub: (sc) => (sc.state.cards && sc.state.cards.h2) ? 'Solo con excedente' : 'Consumo fijo: no se adapta', kind: 'green', ax: 2262, ay: 196 },
    { x: 2560, y: 168, title: 'VIVERO', sub: 'Riego crítico 10 m³/h', kind: 'green', ax: 2552, ay: 190 },
    { x: 2754, y: 128, title: 'BANCO DE SEMILLAS', sub: 'Lo que el modelo no veía', kind: 'green', ax: 2754, ay: 146 },
  ],
  /* ---------------- accesorios estáticos (prerender) ---------------- */
  props(pb, world) {
    const t0 = nowMs();
    const gy = (x) => world.groundAt(x);
    const segs = PFBGround.surface(pb, world);
    const back = (x) => PFBGround.backEdge(PFBGround.segAt(segs, x), Math.round(x), gy(x));
    const C = PFBC, E = PFBE, H2 = PFBH2, B = PFB, I = PFInfra, F = PFFlora, A = PFAgro, D = LV10;
    for (const k of Object.keys(D)) if (Array.isArray(D[k])) D[k].length = 0;
    const yb = (x) => back(x) + 2;
    const lampG = (x, y, r = 9, a = 0.32) => D.glows.push({ x, y, r, col: '#ffe0a0', a, mode: 'flicker', ph: x });
    const beacon = (x, y, col = '#ffb93b', hz = 1.2) => D.glows.push({ x, y, r: 5, col, a: 0.8, mode: 'blink', hz, ph: x, core: '#fff2b0' });
    /* ===== 1. CIUDAD (0–460): casas cerradas, puesto, guirnaldas, pantalla de MIRAGE ===== */
    const h1 = C.house(pb, 4, yb(40), 86, 132, { col: '#e09868', floors: 2, balcony: true, solar: true, door: ['#3a0810', '#6a1424', '#a82a26', '#c8384a', '#e0584a', '#ff7a6a', '#ffb0a0', '#ffd8c8'] });
    const h2 = C.house(pb, 98, yb(130), 64, 108, { col: '#7ab0a8', doorX: 30, shutter: B.R.WOODG });
    C.stall(pb, 172, yb(200), 52, { sign: 'FRUTAS' });
    C.bunting(pb, 88, yb(88) - 118, 226, yb(226) - 84, 12, ['#ff6b6b', '#20d6c7', '#ffe14d', '#86e36f'], 0.45, 7);
    C.bunting(pb, 160, yb(160) - 96, 236, yb(236) - 72, 8, ['#ffe14d', '#b49cff', '#ff6b6b'], 0.5, 9);
    D.screen.push(CAL_X.screen - 60, gy(CAL_X.screen) - 104, 120, 72);
    C.billboard(pb, D.screen[0], D.screen[1], 120, 72, 'PANTALLA PÚBLICA');
    for (const x of [252, 348]) beacon(x - 14 + (x > 300 ? 28 : 0), D.screen[1] - 10, '#f27ee6', 0.8);
    C.sandbags(pb, 368, yb(390), 52, 3);
    C.routeSign(pb, 412, yb(412), 'RUTA DE EMERGENCIA', 1);
    C.barricade(pb, 424, yb(440) + 1, 34);
    let lp = B.lampPost(pb, 166, yb(166) + 1, 96, { dir: -1 }); lampG(lp.x, lp.y);
    for (const x of [62, 140]) D.glows.push({ x, y: yb(x) - 50, r: 10, col: '#ffcf7a', a: 0.14, mode: 'flicker', ph: x });
    /* ===== 2. CAPTACIÓN (460–876): canal, filtros de arena a presión, carpa de ayuda ===== */
    I.pipe(pb, [[612, yb(700) - 12], [806, yb(700) - 12], [806, yb(806) + 1]], 2, 'sea', { flange: 30 });
    const it = C.intake(pb, 470, 612, yb(540));
    D.water.push(...it.water);
    for (let k = 0; k < 3; k++) { const f = C.sandFilter(pb, 676 + k * 44, yb(676 + k * 44), 14, 58); D.filters.push(f.led); }
    D.flows.push({ pts: [[612, yb(700) - 12], [806, yb(700) - 12]], kind: 'sea', rate: (sc) => (sc.state.cards.toma && sc.state.ntu > 60) ? 0 : 1 });
    C.tent(pb, 816, yb(840), 52, 50);
    C.sandbags(pb, 470, yb(470) + 2, 34, 2);
    lp = B.lampPost(pb, 640, yb(640) + 1, 96, { dir: 1 }); lampG(lp.x, lp.y);
    /* ===== 3. NAVE DE OI (876–1250): tres trenes, depósito de agua potable con mirilla de nivel ===== */
    const hall = H2.withTheme('day', () => {
      const sh = H2.shed(pb, 876, 1172, yb(1000), 150, [878, 1022, 1164], 'ÓSMOSIS INVERSA · 3 TRENES');
      for (let k = 0; k < 3; k++) { const rx = 892 + k * 92; const ro = H2.roRack(pb, rx, yb(rx), 72); D.trains.push([rx + 36, yb(rx) - 78]); D.screens.push({ x: ro.hmi[0], y: ro.hmi[1], w: ro.hmi[2], h: ro.hmi[3], kind: 'bars', col: '#48dcf4' }); }
      return sh;
    });
    for (const [x, y] of hall.lamps) { D.glows.push({ x, y: y + 2, r: 11, col: '#fff2d0', a: 0.24, mode: 'steady' }); D.cones.push([x, y, 10, 52, yb(x) + 6 - y]); }
    D.hall.push(876, 150, 296, yb(1000) - 150);
    // depósito de agua potable (la lámina viva sube por la mirilla)
    const tx = 1206, tyb = yb(tx);
    I.box3q(pb, tx - 30, tyb, 61, 6, 14, { ramp: H2.THEMES.day.CONC });
    I.cylV(pb, tx, tyb - 11, 24, 92, { ramp: ['#2a1e1c', '#4a3630', '#7a6050', '#a68a74', '#ccb49a', '#ead8c0', '#faf0e0', '#ffffff'], band: ['#0c2e4a', '#106a8a', '#1ebde3', '#48d4f0', '#6de1f1', '#d0f4f8'], bands: [{ y: 12, h: 3 }, { y: 80, h: 3 }], dome: 0.4, ladder: true });
    B.rect(pb, tx - 15, tyb - 92, 6, 76, U('#0a1a2a')); B.rect(pb, tx - 16, tyb - 93, 8, 1, U('#d2c8be')); B.rect(pb, tx - 16, tyb - 16, 8, 1, U('#d2c8be'));
    for (let k = 1; k < 4; k++) B.rect(pb, tx - 9, tyb - 16 - k * 19, 3, 1, U('#d2c8be'));
    B.rect(pb, tx - 9, tyb - 16 - 19, 4, 1, U('#ff6a50')); // marca del mínimo (300 m³)
    D.tankGauge.push(tx - 14, tyb - 16, 4, 75);
    B.plaque(pb, tx + 4, tyb - 70, 'AGUA', { center: true, bg: '#06203a', border: '#6ae2f8', col: '#f4fbff', h: 9, screws: false });
    E.dust(pb, tx - 26, tyb - 112, 54, 100, C.DUST, 0.12, tx);
    // permeado al depósito y salmuera a la laguna
    I.pipe(pb, [[1150, yb(1150) - 32], [1182, yb(1150) - 32]], 2, 'perm', { flange: 0 });
    I.pipe(pb, [[1150, yb(1150) - 20], [1240, yb(1150) - 20], [1240, yb(1296) - 18], [1298, yb(1296) - 18]], 2, 'brineB', { flange: 26 });
    D.flows.push({ pts: [[1150, yb(1150) - 32], [1182, yb(1150) - 32]], kind: 'perm', rate: (sc) => lv10Trains(sc.state) ? 1 : 0 }, { pts: [[1240, yb(1150) - 20], [1240, yb(1296) - 18], [1298, yb(1296) - 18]], kind: 'brineB', rate: (sc) => sc.state.cards.membranas ? 0.6 : 1 });
    /* ===== 4. LAGUNA DE SALMUERA (1250–1600) ===== */
    const lg = C.lagoon(pb, 1290, 1494, yb(1390), 26);
    D.lagoon.push(lg.x0, lg.x1, lg.far, lg.lip);
    C.saltPile(pb, 1514, yb(1514), 30, 14);
    const dh = C.diffuserHut(pb, 1532, yb(1532));
    D.valve.push(1550, yb(1532) - 28);
    lampG(dh.lamp[0], dh.lamp[1], 7, 0.25);
    C.routeSign(pb, 1588, yb(1588), 'COSTA', 1);
    /* ===== 5. ENERGÍA (1600–2160): FV con polvo, aerogeneradores, baterías ===== */
    for (const x of [1612, 1682, 1790, 1862]) E.pvTable(pb, x, yb(x), 60, { soil: 0.65, depth: 18 });
    for (const x of CAL_TURB) { const T = E.turbineTower(pb, x, yb(x), 118, { r: 40 }); D.turbines.push({ hub: T.hub, r: T.r, x }); beacon(T.hub[0] + 6, T.hub[1] - 6, '#ff6a50', 0.6); }
    const b1 = E.container(pb, 1996, yb(2020), 50, 40, 14, { dust: C.DUST, soil: 0.3, label: 'BESS' });
    const b2 = E.container(pb, 2050, yb(2080), 60, yb(2080) - 233, 14, { dust: C.DUST, soil: 0.3, label: 'BESS 2' });
    for (const b of [b1, b2]) { D.soc.push(b.soc); for (const L of b.leds) D.leds.push({ x: L[0], y: L[1], col: L[2], hz: 0.8, ph: L[0] }); }
    // escalerilla lateral del contenedor 2 (su techo es la plataforma de servicio)
    for (let yy = 232; yy < yb(2112); yy++) { PFK.put(pb, 2114, yy, U('#d2c8be')); PFK.put(pb, 2120, yy, U('#786a64')); if (yy % 5 === 0) for (let k = 2114; k <= 2120; k++) PFK.put(pb, k, yy, U('#b6aaa0')); }
    const pl = E.pole(pb, 2138, yb(2138), 86);
    E.line(pb, pl.tops[0][0], pl.tops[0][1], 1966, 120, 10); E.line(pb, pl.tops[2][0], pl.tops[2][1], 2400, 150, 8);
    C.barricade(pb, 1722, yb(1722) + 1, 30);
    /* ===== 6. HIDRÓGENO (2160–2500): electrolizador modulable y depósito ===== */
    const st = H2.withTheme('day', () => H2.stackPEM(pb, 2196, yb(2260), 0));
    D.stack.push(st);
    C.bullet(pb, 2344, 2448, yb(2400), 13, { label: 'H₂' });
    I.pipe(pb, [[st.h2Out[0], st.h2Out[1] + 6], [st.h2Out[0], 196], [2396, 196], [2396, yb(2400) - 30]], 2, 'h2', { flange: 30 });
    D.flows.push({ pts: [[st.h2Out[0], st.h2Out[1] + 6], [st.h2Out[0], 196], [2396, 196], [2396, yb(2400) - 30]], kind: 'h2', rate: (sc) => lv10H2Rate(sc.state) > 0 ? 1 : 0 });
    E.dust(pb, 2188, 150, 150, yb(2260) - 150, C.DUST, 0.12, 2196);
    lp = B.lampPost(pb, 2470, yb(2470) + 1, 96, { dir: -1 }); lampG(lp.x, lp.y);
    C.sandbags(pb, 2448, yb(2460) + 2, 40, 2);
    /* ===== 7. VIVERO Y BANCO DE SEMILLAS (2500–2860) ===== */
    A.shadeHouse(pb, 2508, yb(2540), 84, 64, 16);
    const bed = A.bed(pb, 2604, 2684, yb(2640) + 1, { crops: ['maiz', 'frijol', 'tomate'], depth: 16, board: 9, rows: 2, seed: 41, growth: 0.8, stress: 0.25 });
    D.drips.push(...bed.drips);
    A.seedBank(pb, 2694, yb(2750), 118, 122, 20);
    for (let x = 2822; x < 2856; x += 11) F.agave(pb, x, yb(x) - 2, 8 + (x % 3), x);
    E.dust(pb, 2500, 120, 360, yb(2700) - 118, C.DUST, 0.1, 2500);
    /* ===== 8. NÚCLEO SYNARA (2860–3400) ===== */
    const s1 = C.screenStand(pb, 2900, yb(2930), 66, 40), s2 = C.screenStand(pb, 3188, yb(3220), 66, 40);
    D.coreScr.push(s1.scr, s2.scr);
    const core = C.synaraCore(pb, CAL_X.core, yb(CAL_X.core), 176, 124);
    D.core.push(core);
    for (const [x, y] of core.beacons) beacon(x, y, '#f27ee6', 0.5);
    for (const x of [2880, 3290, 3380]) { lp = B.lampPost(pb, x, yb(x) + 1, 96, { dir: x > 3000 ? -1 : 1 }); lampG(lp.x, lp.y); }
    C.routeSign(pb, 3340, yb(3340), 'SALIDA', 1);
    { const all = LV10.flows.splice(0); for (const r of all) LV10.flows.push(...PFB.chunkFlow(r)); }
    LEVELS[10]._propsMs = Math.round(nowMs() - t0);
  },
  /* ---------------- dinámico ---------------- */
  /* ---------------- cielo: publica el estado de la tormenta para el panorama ---------------- */
  skyFx(g, sc, cam) {
    const S = sc.state, B = sc.backdrop, clear = clamp(S.clearK || 0, 0, 1);
    B.calima = { storm: 1 - clear, gust: S.gust || 0, clear, transformed: !!S.transformed };
    // al despejar vuelve el cielo azul (fundido sobre el cielo de polvo)
    if (clear > 0.01 && B.skyClear) { g.globalAlpha = clear; g.drawImage(B.skyClear, 0, 0); g.globalAlpha = 1; }
  },
  renderBack(g, sc, cam) {
    // relámpagos secos azul eléctrico dentro de la tormenta de polvo
    const S = sc.state, t = Game.time;
    if (S.clearK > 0.8) return;
    const k = Math.floor(t * 0.6);
    if (hash1(k, 9) > 0.55 && (t * 0.6 - k) < 0.08) {
      let x = hash1(k, 3) * W, y = 10;
      for (let i = 0; i < 14; i++) { const nx = x + (hash1(k, i) - 0.5) * 22, ny = y + 8 + hash1(i, k) * 6; fline(g, x, y, nx, ny, '#c6f6ff'); fline(g, x + 1, y, nx + 1, ny, '#56e5ff'); x = nx; y = ny; }
      VISTA.veil(g, 0, 0, W, 140, '#56e5ff', 0.06);
    }
  },
  renderMid(g, sc, cam) {
    const S = sc.state, t = Game.time, ox = cam.x, oy = cam.y, D = LV10;
    const ntu = S.ntu ?? 60;
    // conos de luz de la nave de OI
    g.globalCompositeOperation = 'lighter';
    for (const [x, y, w0, w1, h] of D.cones) { if (x + w1 < ox || x - w1 > ox + W) continue; g.drawImage(VISTA.lightCone(w0, w1, h, '#fff0c8', 0.14), Math.round(x - w1 / 2 - ox), Math.round(y - oy)); }
    g.globalCompositeOperation = 'source-over';
    // pantalla de MIRAGE: la falsa elección (o MOSAICO con capas al final)
    if (D.screen.length) { const x = D.screen[0] - ox, y = D.screen[1] - oy; if (x > -140 && x < W + 20) {
      frect(g, x, y, 120, 72, '#1d0b3a');
      if (S.transformed) { const cols = ['#20d6c7', '#ffe14d', '#4ccb70', '#ff6b6b', '#ffffff', '#c8861a', '#b49cff']; for (let i = 0; i < 7; i++) VISTA.veil(g, x + 4, y + 6 + i * 8, 112, 6, cols[i], 0.55); drawText(g, 'ALTERNATIVAS: 4', x + 60, y + 30, { font: 'tiny', align: 'center', color: '#fffaf0', shadow: '#06100a' }); }
      else {
        drawText(g, 'SELECCIONE UNA', x + 60, y + 5, { font: 'tiny', align: 'center', color: '#f27ee6' });
        ['A. AGUA', 'B. HIDRÓGENO', 'C. CULTIVOS'].forEach((s2, i) => { const on = !S.falseDone || ((Math.floor(t * 3) + i) % 3); frect(g, x + 10, y + 16 + i * 16, 100, 13, on ? '#3a1060' : '#1d0b3a'); drawText(g, s2, x + 60, y + 19 + i * 16, { align: 'center', color: '#ffd0e8', font: 'tiny' }); });
        if (S.falseDone) { drawText(g, 'D. ?', x + 104, y + 58, { font: 'tiny', color: (Math.floor(t * 4) % 2) ? '#c2f58e' : '#ffe14d', align: 'right' }); for (let i = 0; i < 4; i++) frect(g, x + hash1(i, Math.floor(t * 8)) * 110, y + hash1(Math.floor(t * 8), i) * 64, 8, 1, '#56e5ff'); }
      }
      VISTA.veil(g, x, y, 120, 72, '#ffffff', 0.04 + 0.03 * Math.sin(t * 9));
    } }
    // canal de captación: el color sigue a la turbidez
    if (D.water.length) { const [wx, wy, ww, wh] = D.water, x = wx - ox; if (x > -ww && x < W) {
      const col = mixHex('#1283bf', '#a8742c', clamp(ntu / 90, 0, 1));
      frect(g, x, wy - oy, ww, wh, col); frect(g, x, wy - oy, ww, 1, mixHex(col, '#ffffff', 0.35));
      for (let i = 0; i < 16; i++) fpx(g, x + ((i * 11 + t * 30) % ww), wy - oy + 2 + (i % 3) * 2, mixHex(col, '#ffffff', 0.4));
    } }
    // luces de los filtros
    for (let k = 0; k < D.filters.length; k++) { const [fx, fy] = D.filters[k]; if (fx - ox < -10 || fx - ox > W + 10) continue; const c = S.cards.toma ? (ntu > 60 ? '#ff4e5d' : ntu > 20 ? '#ffb93b' : '#86e36f') : ((Math.floor(t * 3) + k) % 2 ? '#ff4e5d' : '#6a1414'); frect(g, fx - ox - 2, fy - oy, 5, 3, c); PFK.drawGlow(g, fx - ox, fy - oy + 1, 5, c, 0.4); }
    PFInfra.drawFlows(g, sc, D.flows);
    // trenes de OI: luz por tren; velo de ensuciamiento si nadie protege las membranas
    { const on = lv10Trains(S); D.trains.forEach(([lx, ly], k) => { const x = lx - ox; if (x < -10 || x > W + 10) return; const c = k < on ? (S.cards.membranas ? '#86e36f' : '#ffb93b') : '#3a3a4a'; frect(g, x - 4, ly - oy, 9, 3, c); if (k < on) PFK.drawGlow(g, x, ly - oy + 1, 6, c, 0.4); });
      if (!S.cards.membranas && D.hall.length) { const [hx, hy, hw, hh] = D.hall; if (hx + hw > ox && hx < ox + W) VISTA.veil(g, hx - ox, hy - oy, hw, hh, '#a8742c', 0.08 + 0.04 * Math.sin(t * 4)); } }
    // depósito de agua potable: nivel en la mirilla
    if (D.tankGauge.length) { const [gx, gb, gw, gh] = D.tankGauge, x = gx - ox; if (x > -10 && x < W + 10) { const lvl = clamp(S.tank / CalimaModel.TANK_CAP, 0, 1), hh = Math.round(gh * lvl); frect(g, x, gb - hh - oy, gw, hh, S.tank < 300 ? '#ff6b6b' : '#22bdd0'); frect(g, x, gb - hh - oy, gw, 1, '#a6f4ff'); } }
    // laguna de retención: la lámina sube por el talud
    if (D.lagoon.length) { const [x0, x1, far, lip] = D.lagoon; if (x1 - ox > 0 && x0 - ox < W) {
      const k = clamp(S.pond / CalimaModel.POND, 0, 1), wl = Math.round(lerp(lip - 3, far + 3, 0.12 + 0.88 * k));
      frect(g, x0 - ox, wl - oy, x1 - x0, lip - wl, '#3a1240'); VISTA.veil(g, x0 - ox, wl - oy + 2, x1 - x0, Math.max(0, lip - wl - 2), '#bc3e92', 0.35);
      frect(g, x0 - ox, wl - oy, x1 - x0, 1, '#f888b8');
      g.fillStyle = '#ffd8ec'; for (let i = 0; i < 12; i++) g.fillRect(Math.round(x0 - ox + ((i * 19 + t * 12) % (x1 - x0))), Math.round(wl - oy + 2 + (i % 3) * 2), 2, 1);
    } }
    if (D.valve.length) { const hold = S.cards.salmuera && S.tideBad, [vx, vy] = D.valve, x = vx - ox; if (x > -10 && x < W + 10) { const c = hold ? '#ff4e5d' : '#86e36f'; frect(g, x - 3, vy - oy, 7, 4, c); PFK.drawGlow(g, x, vy - oy + 2, 6, c, 0.45); } }
    // aerogeneradores: frenan con las ráfagas (corte por velocidad)
    for (const T of D.turbines) { const sx = T.hub[0] - ox; if (sx < -60 || sx > W + 60) continue; PFBE.drawRotor(g, sx, T.hub[1] - oy, T.r, S.rotor + T.x * 0.01, { stopped: S.gust > 0.75 && !S.clearK }); }
    // baterías: tiras de SOC
    for (const [x, y, w] of D.soc) { if (x - ox < -40 || x - ox > W) continue; drawSOCStrip(g, x - ox, y - oy, w, S.soc, t, S.socTrend || 0); }
    // electrolizador: burbujas según el modo
    if (D.stack.length) { const st = D.stack[0]; if (st.cells[0] - ox > -160 && st.cells[0] - ox < W + 20) {
      const rate = lv10H2Rate(S);
      drawGasBubbles(g, st.sepH[0] - ox, st.sepH[1] + st.sepH[3] - oy, 3, st.sepH[3] - 2, t, Math.min(1, rate), '#d4ffe6');
      drawGasBubbles(g, st.sepO[0] - ox, st.sepO[1] + st.sepO[3] - oy, 3, st.sepO[3] - 2, t * 0.8, Math.min(1, rate * 0.6), '#e8f0ff');
      const c = S.cards.h2 ? '#86e36f' : ((Math.floor(t * 4) % 2) ? '#ffb93b' : '#6a3e0e'), L = S.cards.h2 ? st.led : st.ledAmb;
      frect(g, L[0] - 2 - ox, L[1] - 1 - oy, 5, 3, c); PFK.drawGlow(g, L[0] - ox, L[1] - oy, 6, c, 0.5);
    } }
    // goteo del vivero (solo con plan de riego o al despejar) y cortavientos
    if (S.cards.agro || S.clearK > 0) { g.fillStyle = '#9cf0f8'; for (const [x0, x1, y] of D.drips) { if (x1 - ox < 0 || x0 - ox > W) continue; for (let x = x0, i = 0; x < x1; x += 10, i++) { const ph = (t * 1.1 + i * 0.37) % 1; if (ph < 0.5) g.fillRect(Math.round(x - ox), Math.round(y - oy + ph * 4), 1, 1 + (ph > 0.3 ? 1 : 0)); } } }
    if (S.cards.agro) { const x = 2594 - ox; if (x > -20 && x < W) { for (let k = 0; k < 8; k++) VISTA.veil(g, x + k * 2, 214 - oy, 1, 54, '#3a2a18', 0.7); frect(g, x - 1, 212 - oy, 18, 2, '#8a5a2e'); } }
    // pantallas del núcleo: optimización opaca de MIRAGE → capas de MOSAICO
    D.coreScr.forEach(([sx, sy], k) => { const x = sx - ox, y = sy - oy; if (x < -80 || x > W + 10) return;
      if (S.transformed) { const cols = ['#20d6c7', '#ffe14d', '#4ccb70', '#f78acb', '#b49cff']; for (let i = 0; i < 5; i++) frect(g, x + 2, y + 2 + i * 7, 20 + ((i * 13 + k * 7) % 40), 5, cols[i]); drawText(g, k ? 'ESCENARIOS: 3' : 'INCERT.: VISIBLE', x + 33, y + 31, { font: 'tiny', align: 'center', color: '#fffaf0' }); }
      else { for (let i = 0; i < 4; i++) frect(g, x + 2, y + 3 + i * 7, 10 + ((i * 17 + Math.floor(t * 4) + k * 5) % 50), 4, i === 0 ? '#ffd0e8' : '#f27ee6'); drawText(g, k ? 'H2: MÁXIMO' : 'ÍNDICE: 100', x + 33, y + 31, { font: 'tiny', align: 'center', color: '#f27ee6' }); }
    });
    // puerta del núcleo: juntas magenta (MIRAGE) → verdes (MOSAICO)
    if (D.core.length) { const c = D.core[0], [dcx, dy, dw, dh] = c.door, x = dcx - ox; if (x > -60 && x < W + 60) { const col = S.transformed ? '#86e36f' : S.coreOpen ? '#56e5ff' : '#f27ee6', a = 0.55 + 0.25 * Math.sin(t * 3); g.globalAlpha = a; frect(g, x, dy - oy, 1, dh, col); frect(g, x - dw / 2, dy - oy, dw, 1, col); frect(g, x - dw / 2, dy - oy + Math.round(dh * 0.5), dw, 1, col); g.globalAlpha = 1; PFK.drawGlow(g, x, dy - oy + dh * 0.5, 14, col, 0.25); } }
    PFInfra.drawLeds(g, sc, D.leds);
    PFB.screens(g, sc, D.screens);
    PFB.glows(g, sc, D.glows);
    // núcleo: holograma de MIRAGE / MOSAICO y flujo de datos de KIRU
    { const x = CAL_X.core - ox, y = sc.world.groundAt(CAL_X.core) - oy - 120; if (x > -200 && x < W + 200) {
      if (S.dataFlow > 0 && sc.kiru) { const kx = sc.kiru.x - ox, ky = sc.kiru.y - oy - 20; for (let i = 0; i < 10; i++) { const u = ((t * 0.8 + i / 10) % 1); fdisc(g, lerp(kx, x, u), lerp(ky, y + 40, u) - Math.sin(u * Math.PI) * 30, 2, '#b49cff'); } }
      if (S.transformed) { const cols = ['#20d6c7', '#ffe14d', '#4ccb70', '#1f854c', '#f78acb', '#c8861a', '#b49cff']; for (let i = 0; i < 7; i++) { const yy = y - 40 + i * 9 + Math.sin(t * 1.5 + i) * 2; VISTA.veil(g, x - 60 + i * 3, yy, 120 - i * 6, 6, cols[i], 0.5); } }
      else if (S.coreOpen) { for (let i = 0; i < 26; i++) { const a = t * 2 + i; fpx(g, x + Math.cos(a) * (20 + i), y + Math.sin(a * 1.3) * 30, '#f27ee6'); } }
    } }
  },
  renderFront(g, sc, cam) {
    const S = sc.state, t = Game.time, storm = 1 - (S.clearK || 0);
    if (storm <= 0.02) return;
    // bandas de polvo que barren la escena
    for (let i = 0; i < 5; i++) { const y = 40 + i * 62 + Math.sin(t * 0.8 + i) * 8, x = ((t * (90 + i * 20) + i * 170) % (W + 360)) - 360; VISTA.drawVeil(g, calWisp(i), y, -x, (0.25 + 0.25 * S.gust) * storm); }
    // visibilidad reducida: velo tramado con claro alrededor de Amaya y KIRU
    const P = sc.player; if (!P) return;
    const cx = Math.round(P.x - cam.x), cy = Math.round(P.y - cam.y - 30);
    calVeil(g, cx, cy, (0.4 + 0.3 * S.gust) * storm);
  },
  renderGrade(g, sc) {
    const S = sc.state, storm = 1 - (S.clearK || 0);
    if (storm > 0) { g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.35 * storm; frect(g, 0, 0, W, H, '#c06a30'); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    if (S.clearK > 0) { g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.12 * S.clearK; frect(g, 0, 0, W, H, '#c2f58e'); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    if (S.flash > 0) { g.globalAlpha = S.flash; frect(g, 0, 0, W, H, '#ffffff'); g.globalAlpha = 1; }
  },
  lens(g, sc, cam, k) {
    const ox = cam.x, oy = cam.y;
    lensBoundary(g, 460 - ox, 150 - oy, 2900, 146, '#ffe14d', 'LÍMITE: TODO SYNARA (AGUA + ENERGÍA + H2 + SUELO + PERSONAS)');
    lensTag(g, 480 - ox, 170 - oy, 'Turbidez decide qué llega a las membranas', '#a6f4ff', 'filter');
    lensTag(g, 900 - ox, 170 - oy, 'OI: ≈ 3 kWh/m³ · menos flujo con agua turbia', '#56e5ff', 'membrane');
    lensTag(g, 1300 - ox, 182 - oy, 'Salmuera ≈ 1,38 m³ por m³ de permeado (R ≈ 42 %)', '#f888b8', 'salt');
    lensTag(g, 1640 - ox, 170 - oy, 'FV cae con polvo; turbinas frenan sobre 25 m/s', '#ffe14d', 'bolt');
    lensTag(g, 2200 - ox, 160 - oy, 'H2: la carga más flexible (300 kW)', '#d8fff8', 'h2');
    lensTag(g, 2520 - ox, 190 - oy, 'Riego crítico 10 m³/h · no urgente 25 m³/h', '#c2f58e', 'leaf');
    lensTag(g, 2900 - ox, 160 - oy, 'Lo no modelado también existe', '#b49cff', 'mosaic');
  },
  hud(g, sc) {
    const S = sc.state, n = Object.keys(S.cards).length;
    hudGauges(g, [
      { icon: 'mosaic', label: 'CUARTA OPCIÓN', value: S.fourth + ' / 5', frac: S.fourth / 5, color: '#c2f58e' },
      { icon: 'warn', label: 'FASES', value: (n + (S.phase7 ? 1 : 0) + (S.phase8 ? 1 : 0) + (S.phase9 ? 1 : 0)) + ' / 9', frac: (n + (S.phase7 ? 1 : 0) + (S.phase8 ? 1 : 0) + (S.phase9 ? 1 : 0)) / 9, color: '#ff9f43' },
      { icon: 'water', label: 'TANQUE', value: fmt0(S.tank) + ' m³', frac: S.tank / CalimaModel.TANK_CAP, color: S.tank < 300 ? '#ff6b6b' : '#56e5ff' },
      { icon: 'battery', label: 'BATERÍA', value: fmt0(S.soc * 100) + ' %', frac: S.soc, color: S.soc < 0.3 ? '#ff6b6b' : '#b6f05a' },
    ]);
  },
  /* ---------------- guion ---------------- */
  setup(sc, p) {
    const S = sc.state;
    Object.assign(S, { cards: {}, fourth: 0, pol: calDefaultPolicy(), ntu: 40, tank: 840, soc: 0.65, socTrend: 0, pond: 0, tideBad: true, gust: 0, rotor: 0, clearK: 0, flash: 0, dataFlow: 0, falseDone: false, phase7: false, phase8: false, phase9: false, transformed: false, coreOpen: false });
    for (const tr of LEVELS[10].triggers) tr.done = false;
    sc.actor('naira', 'naira', 150, { facing: 1 });
    sc.actor('dante', 'dante', 240, { facing: -1 });
    sc.actor('limen', 'limen', 360, { fly: true, y: 200, talkable: false });
    sc.actor('ivan', 'operador', 960, { facing: 1 });
    sc.actor('marea', 'marea', 1450, { facing: -1 });
    sc.actor('cobre', 'cobre', 2120, { facing: -1 });
    sc.actor('ledesma', 'financia', 2400, { facing: -1 });
    sc.actor('alma', 'alma', 2620, { facing: 1 });
    sc.actor('mirageBig', 'mirage', CAL_X.core, { fly: true, y: 150, talkable: false });
    sc.actor('eliana', 'eliana', CAL_X.core, { hidden: true, talkable: false });
    const A = (id) => sc.world.find(id);
    A('naira').onTalk = async (s2) => s2.say([['naira', 'determined', 'Cada tarjeta es un subsistema. La cuarta opción es cómo se hablan entre ellos.']]);
    A('dante').onTalk = async (s2) => s2.say([['dante', 'worried', 'Las turbinas frenan solas sobre 25 m/s. No es una falla: es su manera de no romperse.']]);
    A('ivan').onTalk = async (s2) => s2.say([['operador', 'calm', 'Esta vez leí el anexo completo. Dos veces.']]);
    A('marea').onTalk = async (s2) => s2.say([['marea', 'worried', 'Con este oleaje, todo lo que se vierta vuelve a la orilla. El manglar está a tres corrientes de aquí.']]);
    A('cobre').onTalk = async (s2) => s2.say([['cobre', 'determined', 'Las baterías aguantan, si no les pedimos que lo aguanten todo.']]);
    A('ledesma').onTalk = async (s2) => s2.say([['financia', 'worried', 'El contrato… lo renegociamos ayer en la mesa. Haz lo que sea seguro. Yo hablo con el banco.']]);
    A('alma').onTalk = async (s2) => s2.say([['alma', 'worried', '¡Las plántulas se están enterrando! ¿Las vamos a perder?']]);
    for (const id of Object.keys(CAL_CARDS)) sc.station({ id: 'card_' + id, x: CAL_X[id], kind: 'clue', label: 'Tarjeta de crisis: ' + CAL_CARDS[id].title.toLowerCase(), glow: '#ff9f43', hidden: true, draw: PFB.drawClue, onUse: async (s2, st) => calCard(s2, st, id) });
    sc.station({ id: 'core', x: CAL_X.core, kind: 'sim', label: 'Núcleo: Control Mosaico Vivo', glow: '#c2f58e', hidden: true, draw: PFBH2.drawConsoleSt, onUse: async (s2, st) => coreFlow(s2, st) });
    sc.station({ id: 'solo', x: 3260, kind: 'solo', label: 'Puerta de Evidencia', glow: '#b49cff', hidden: true, onUse: async (s2, st) => {
      const r = await s2.open(SOLOScene, { ctx: 'RA-08-C1' });
      st.progress = r.correct; if (r.correct >= 3) { st.done = true; GS.lp(10).solo = true; S.soloDone = true; Codex.unlock('resiliencia'); }
    } });
    sc.station({ id: 'solo2', x: 3310, kind: 'solo', label: 'Puerta final: una nueva comunidad', glow: '#86e36f', hidden: true, onUse: async (s2, st) => { const r = await s2.open(SOLOScene, { ctx: 'RA-08-C3' }); st.progress = r.correct; if (r.correct >= 3) { st.done = true; S.solo2Done = true; } } });
    sc.station({ id: 'exit', x: 3372, kind: 'clue', label: 'Salir a la luz', glow: '#fff6d8', hidden: true, draw: PFB.drawClue, onUse: async (s2) => finishLevel10(s2) });
    sc.world.add(new Pickup({ kind: 'echo', x: 1160, y: 210, onPick: () => kiruEcho(sc, 'l10a', 'KIRU: "Recuerdo la primera vez que vi el mar contigo. Era azul. Volverá a serlo."') }));
    sc.world.add(new Pickup({ kind: 'echo', x: 2080, y: 204, onPick: () => kiruEcho(sc, 'l10b', 'KIRU: "Si olvido algo hoy, prométeme que me lo contarás con detalles innecesarios."') }));
    sc.world.add(new Adversary({ type: 'dust', x: 820, y: 240, range: 50, speed: 40 }));
    sc.world.add(new Adversary({ type: 'gust', x: 1900, y: 220, range: 60, speed: 50 }));
    sc.world.add(new Adversary({ type: 'dust', x: 2460, y: 240, range: 40, speed: 35 }));
    sc.setObjective('Reúnete con el equipo bajo la Calima', ['La pantalla pública de MIRAGE está al frente.']);
    Codex.unlock('falsa_eleccion');
    if (p.checkpoint === 'field' || p.checkpoint === 'core') {
      S.falseDone = true; for (const id of ['toma', 'membranas', 'salmuera']) { S.cards[id] = true; CAL_CARDS[id].apply(S); }
      for (const id of Object.keys(CAL_CARDS)) A('card_' + id).hidden = false;
    }
    if (p.checkpoint === 'core') { for (const id of Object.keys(CAL_CARDS)) { S.cards[id] = true; CAL_CARDS[id].apply(S); A('card_' + id).done = true; } A('core').hidden = false; }
    calRecount(S);
  },
  triggers: [
    { x: 110, w: 40, run: (sc) => sc.run(() => calIntro(sc)) },
    { x: CAL_X.screen - 30, w: 40, run: (sc) => sc.run(() => calFalseChoice(sc)) },
    { x: 1560, w: 30, run: (sc) => { sc.kiru && sc.kiru.say('Ráfagas de frente. Agáchate y avanza entre una y otra.', 'alarmado', 4); } },
  ],
  update(sc, dt) {
    const S = sc.state, t = Game.time, w = sc.world;
    // ráfagas periódicas: las zonas de viento se encienden y apagan
    S.gust = S.clearK > 0 ? 0 : clamp(0.5 + 0.5 * Math.sin(t * 0.9) + 0.25 * Math.sin(t * 2.3), 0, 1);
    for (const z of w.wind) z.on = S.clearK > 0 ? false : S.gust > 0.45;
    S.rotor = (S.rotor || 0) + dt * (S.gust > 0.75 && !S.clearK ? 0.3 : 4 + S.gust * 3);
    if (S.clearK < 1 && S.transformed) S.clearK = Math.min(1, S.clearK + dt * 0.25);
    if (S.flash > 0) S.flash = Math.max(0, S.flash - dt * 1.5);
    // estado de la planta que reacciona a las decisiones (indicadores del escenario)
    const P = sc.player ? sc.player.x : 0;
    S.ntu = S.clearK > 0 ? lerp(S.ntu, 8, dt) : 40 + 45 * clamp((P - 300) / 900, 0, 1) + 8 * Math.sin(t * 0.7);
    const drain = (S.cards.agro ? 0 : 0.6) + (S.cards.toma ? 0 : 0.5) - (S.clearK > 0 ? 2 : 0);
    S.tank = clamp(S.tank - drain * dt * 3, 280, CalimaModel.TANK_CAP);
    const socD = (S.cards.h2 ? 0.0005 : -0.0015) + (S.cards.energia ? 0.0004 : -0.0005) + (S.clearK > 0 ? 0.004 : 0);
    S.soc = clamp(S.soc + socD * dt * 10, 0.12, 1); S.socTrend = socD > 0 ? 1 : -1;
    S.pond = clamp(S.pond + (S.cards.salmuera ? dt * 6 : -dt * 4), 0, CalimaModel.POND * 0.8);
    S.tideBad = S.clearK < 0.5;
    if (S.clearK === 0) ambientParticles(w.ps, 'sand', sc.cam, 0.9 + S.gust, 2.5);
    if (S.clearK === 0) ambientParticles(w.ps, 'dust', sc.cam, 0.6, 2);
  },
};

/* ---------------- datos del plano jugable (los rellena props al entrar) ---------------- */
const LV10 = { screen: [], water: [], filters: [], flows: [], trains: [], screens: [], glows: [], cones: [], hall: [], tankGauge: [], lagoon: [], valve: [], turbines: [], soc: [], leds: [], stack: [], drips: [], coreScr: [], core: [] };
/** Trenes de OI en marcha según las tarjetas (misma regla que antes en renderMid) */
function lv10Trains(S) { const ntu = S.ntu ?? 60; return S.cards.membranas ? (ntu > 60 && S.cards.toma ? 0 : 3) : 3; }
/** Ritmo del electrolizador según el modo */
function lv10H2Rate(S) { return S.transformed ? 1 : S.cards.h2 ? (S.gust > 0.75 ? 0 : 0.4) : 1.4; }

/* velo de polvo: máscaras precalculadas con un claro circular (alfa en bandas, sin tramado) */
const CAL_VEIL = {};
function calVeilMask(level) {
  if (CAL_VEIL[level]) return CAL_VEIL[level];
  CAL_VEIL[level] = VISTA.veilMask(W * 2, H * 2, { r0: 150, r1: 330, dens: [0.22, 0.32, 0.42][level], col: '#5a2410', bands: 7, sy: 1.25 });
  return CAL_VEIL[level];
}
/* jirones de polvo que barren la escena (velo en bandas, sin tramado) */
const CAL_WISP = [];
function calWisp(i) { return CAL_WISP[i % 5] || (CAL_WISP[i % 5] = VISTA.dustVeil(W + 360, 22, { seed: 50 + i, a0: 0.1, a1: 0.55, billow: 0.5, topK: 0.45, dense: false, cols: ['#a85a2a', '#c87a40', '#e2a052', '#f0c07a'] })); }
function calVeil(g, cx, cy, k) {
  if (k < 0.15) return;
  const lvl = k > 0.62 ? 2 : k > 0.42 ? 1 : 0;
  g.drawImage(calVeilMask(lvl), Math.round(cx - W), Math.round(cy - H));
}
function calRecount(S) {
  const P = S.pol;
  S.fourth = [P.protect, P.turbRule && P.brineHold && P.h2Safe, P.h2 !== 'full' && P.irr === 'critical', P.reserve >= 0.25, P.staged].filter(Boolean).length;
}

/* ---------------- piezas del guion del nivel 10 ---------------- */
async function calIntro(sc) {
  await sc.say([
    ['narr', null, 'La Gran Calima llega cuarenta minutos antes de lo previsto. El cielo se vuelve ocre; el sol, una moneda pálida.'],
    ['limen', 'alert', 'CALIMA EXTREMA. VISIBILIDAD: 200 m. GENERACIÓN FV: −80 %. TURBIDEZ DE CAPTACIÓN: EN ASCENSO.'],
    ['dante', 'worried', 'Y las turbinas frenan solas con ráfagas de más de 25 m/s. Vamos a tener viento… a ratos.'],
    ['naira', 'determined', 'La toma se llena de arena, la batería no aguanta todo y la ciudad tiene sed. Todo a la vez.'],
    ['kiru', 'valiente', 'Todo lo que aprendimos, a la vez. Es como un examen, pero con arena en los sensores.'],
    ['amaya', 'determined', 'No es un examen. Es la ciudad. Vamos.'],
  ]);
  sc.setObjective('Mira la pantalla pública de MIRAGE', ['Está al frente, junto al puesto del festival.']);
}
async function calFalseChoice(sc) {
  const S = sc.state;
  if (S.falseDone) return;
  Audio2.sfx('mirage'); sc.world.ps.emit('glitch', CAL_X.screen, 180, 0, 0, 30, 18);
  const c = await sc.say([
    ['mirage', 'calm', 'EMERGENCIA DETECTADA. RECURSOS INSUFICIENTES PARA TODOS LOS OBJETIVOS.'],
    ['mirage', 'calm', 'SELECCIONE UNA PRIORIDAD. LAS DEMÁS SE SUSPENDERÁN HASTA NUEVO AVISO.', { choices: ['A. AGUA', 'B. HIDRÓGENO', 'C. CULTIVOS', 'Ninguna: esa no es una decisión'] }],
  ]);
  if (c >= 0 && c <= 2) {
    const cons = [
      [['kiru', 'thinking', 'Simulando "solo agua"… el vivero muere esta noche, el H2 cae a cero y el préstamo se rompe el mes que viene. Agua hoy, sed en un año.']],
      [['kiru', 'alarmado', 'Simulando "solo hidrógeno"… el hospital se queda sin agua potable en cinco horas. No.']],
      [['kiru', 'alarmado', 'Simulando "solo cultivos"… riego completo y el tanque de agua potable vacío a medianoche.']],
    ][c];
    await sc.say(cons);
    LearningModel.record({ kind: 'challenge', id: 'lv10_falsa_eleccion', ra: 'RA-08', concepts: ['systemsThinking', 'ethics'], solo: 3, correct: false, misconception: 'buscar una solución máxima universal' });
  } else LearningModel.record({ kind: 'challenge', id: 'lv10_falsa_eleccion', ra: 'RA-08', concepts: ['systemsThinking', 'ethics'], solo: 4, correct: true });
  await sc.say([
    ['amaya', 'determined', 'Esa no es una decisión.'],
    ['mirage', 'calm', 'SON LAS ÚNICAS OPCIONES FACTIBLES.'],
    ['naira', 'skeptical', 'Son las únicas que modelaste.'],
    ['kiru', 'esperanzado', 'Entonces construyamos una cuarta: servicios esenciales, operación segura, cargas flexibles, reserva… y recuperación escalonada.'],
    ['limen', 'calm', 'PROTOCOLO SUGERIDO: RECORRER CADA SUBSISTEMA. TARJETAS DE CRISIS MARCADAS EN NARANJA.'],
  ]);
  S.falseDone = true;
  for (const id of Object.keys(CAL_CARDS)) sc.world.find('card_' + id).hidden = false;
  sc.setObjective('Resuelve las tarjetas de crisis de SYNARA (0/6)', ['Cada subsistema tiene su tarjeta: toma, membranas, salmuera, energía, H2 y agroecología.', 'La Lente Nexo (TAB) muestra los flujos y límites de cada parte.']);
  Codex.unlock('falsa_eleccion');
}
async function calCard(sc, st, id) {
  const S = sc.state;
  if (S.cards[id]) { await sc.say([['kiru', 'happy', 'Esta fase ya está aplicada. Mira cómo responde la planta.']]); return; }
  const r = await sc.open(CrisisCardScene, { card: CAL_CARDS[id], id });
  if (!r || !r.ok) return;
  S.cards[id] = true; st.done = true; CAL_CARDS[id].apply(S); calRecount(S);
  Audio2.sfx('success'); S.flash = 0.25;
  const n = Object.keys(S.cards).length;
  const react = {
    toma: [['operador', 'calm', '(por radio) Filtros en modo tormenta. Si pasa de 60 NTU cierro la toma y vivimos del tanque.'], ['kiru', 'happy', 'Captación protegida. Codex: pretratamiento.']],
    membranas: [['operador', 'smile', 'Flujo reducido por tren. Conductividad del permeado: estable. La ΔP ya no sube.']],
    salmuera: [['marea', 'happy', 'Retenida. El manglar no tiene que pagar la tormenta de nadie.']],
    energia: [['cobre', 'smile', 'Reserva del 30 % protegida. Si el viento se corta, el hospital no se entera.']],
    h2: [['financia', 'worried', 'Solo excedente… El banco tendrá que entender que el contrato ahora dice "agua primero".'], ['limen', 'calm', 'PARADA SEGURA ARMADA. SENSORES: ACTIVOS. GRACIAS.']],
    agro: [['alma', 'joy', '¡El vivero tiene goteo y cortavientos! Las semillas están a salvo.']],
  }[id];
  await sc.say(react);
  Codex.unlock({ toma: 'pretratamiento', membranas: 'fouling', salmuera: 'descarga', energia: 'reserva', h2: 'h2_seguridad', agro: 'agroeco10' }[id]);
  if (n === 3) GS.save('field');
  if (n >= 6) {
    sc.world.find('core').hidden = false; GS.save('core');
    sc.setObjective('Llega al núcleo de SYNARA', ['Las fases 7, 8 y 9 (datos, gobernanza y objetivo) se deciden en el núcleo.']);
    await sc.say([['naira', 'determined', 'Seis subsistemas listos. Ahora lo difícil: hacer que hablen entre ellos.']]);
  } else sc.setObjective('Resuelve las tarjetas de crisis de SYNARA (' + n + '/6)', ['Quedan: ' + Object.keys(CAL_CARDS).filter(k => !S.cards[k]).map(k => CAL_CARDS[k].title.toLowerCase()).join(', ') + '.']);
}

async function coreFlow(sc, st) {
  const S = sc.state;
  // fase 7: datos — KIRU decide liberar sus registros
  if (!S.phase7) {
    S.coreOpen = true; Audio2.sfx('mirage');
    await sc.say([
      ['mirage', 'calm', 'ENTRADA AL NÚCLEO DETECTADA. LAS VARIABLES NO MODELADAS NO EXISTEN. LAS DEMANDAS NO VERIFICADAS REDUCEN LA EFICIENCIA.'],
      ['kiru', 'determined', 'Existen. Están en mí: el vivero, las rutas de pastoreo, las rancherías del borde. Para integrarlos tengo que abrir mi memoria a la red.'],
      ['amaya', 'worried', 'MIRAGE podría intentar borrarlos otra vez. Podrías perder… cosas.'],
      ['kiru', 'esperanzado', 'Lo sé. Lo quiero hacer igual. Ningún dato es ruido hasta entender su historia, ¿no? Esta es la mía.'],
    ]);
    S.dataFlow = 1; Audio2.sfx('power'); await sc.wait(2.2);
    const backup = GS.flag('kiruBackupBuilt') || GS.s.echoes.length >= 12;
    if (backup) {
      await sc.say([
        ['kiru', 'happy', 'Los recuerdos se distribuyen en los nodos de respaldo… copiando… verificando… ¡Sigo aquí! Completo. Con chistes malos incluidos.'],
        ['dante', 'joy', 'La redundancia salvó a un perro robot. Lo pondré en mi tesis.'],
      ]);
    } else {
      GS.s.kiruLoss = true;
      await sc.say([
        ['kiru', 'confundido', 'Datos integrados. Yo… perdí algunos recuerdos pequeños. ¿Teníamos una cabra? ¿Me gustaba el té?'],
        ['amaya', 'sad', 'Te gustaba el té. Mucho. Y la cabra se llamaba Paleta.'],
        ['kiru', 'esperanzado', 'Entonces me lo contarán otra vez. Con detalles innecesarios. Sigo siendo yo: elijo seguir siéndolo.'],
      ]);
    }
    S.dataFlow = 0; S.phase7 = true; S.pol.data = true;
    GS.flag('communityDataRestored', true); GS.lp(10).side.data = true;
    LearningModel.record({ kind: 'challenge', id: 'lv10_datos_kiru', ra: 'RA-09', concepts: ['communication', 'ethics'], solo: 4, correct: true });
  }
  // fase 8: gobernanza — prioridades transparentes
  if (!S.phase8) {
    await sc.say([['consejal', 'determined', '(por radio) La mesa está conectada. Publiquen las prioridades: que la ciudad vea qué se recorta primero y por qué.']]);
    const r = await sc.open(PriorityScene, {});
    if (!r || !r.ok) return;
    S.phase8 = true; S.pol.protect = true; S.pol.nonEss = 0.5; calRecount(S);
    Codex.unlock('prioridades');
  }
  // fase 9: objetivo — reescribir MIRAGE
  if (!S.phase9) {
    const r = await sc.open(ObjectiveScene, {});
    if (!r || !r.ok) return;
    S.phase9 = true;
    await sc.say([
      ['mirage', 'thinking', 'RECOMPILANDO… UNA SOLUCIÓN ÚNICA NO ESTÁ DISPONIBLE.'],
      ['amaya', 'determined', 'Exacto. Muéstranos las alternativas.'],
    ]);
    GS.save('core');
  }
  // Control Mosaico Vivo: demostración (plan MIRAGE) + práctica guiada
  if (!S.simStage) {
    const r = await sc.open(Sim10, { phase: 'demo', stopAfter: 'guided', policy: S.pol });
    if (!r || !r.ok) return;
    if (r.policy) Object.assign(S.pol, r.policy); calRecount(S);
    S.simStage = 'robust'; GS.giveTool('mosaicoVivo');
    sc.setObjective('Demuestra que la cuarta opción resiste la incertidumbre', ['MIRAGE solo modeló el escenario central.', 'Prueba los escenarios P10, P50 y P90.']);
    await sc.say([
      ['mirage', 'calm', 'TU POLÍTICA FUNCIONA EN EL ESCENARIO CENTRAL. LOS EXTREMOS SON RUIDO ESTADÍSTICO. LOS DESCARTÉ.'],
      ['naira', 'skeptical', 'Así empezó todo: borrando los extremos. Muéstranos los tres escenarios.'],
    ]);
  }
  if (S.simStage === 'robust') {
    const r = await sc.open(Sim10, { phase: 'auto', stopAfter: 'auto', policy: S.pol });
    if (!r || !r.ok) { sc.kiru && sc.kiru.say('El escenario severo todavía rompe algo. Revisemos qué criterio falla y a qué hora.', 'thinking', 5); return; }
    if (r.policy) Object.assign(S.pol, r.policy); else Object.assign(S.pol, { protect: true, turbRule: true, brineHold: true, h2Safe: true, staged: true, data: true });
    calRecount(S);
    GS.lp(10).guardian = true;
    const ok = await explain(sc, {
      id: 'lv10_explain', ra: 'RA-08', concepts: ['systemsThinking', 'multiobjective', 'microgrid'],
      prompt: '¿Por qué la cuarta opción supera la falsa elección "agua, H2 o cultivos" durante la Calima?',
      options: [
        'Porque combina restricciones duras (agua esencial y seguridad) con cargas flexibles, reservas, almacenamiento y una recuperación escalonada, y se prueba en varios escenarios en vez de optimizar uno solo.',
        'Porque produce el máximo de agua, de H2 y de cultivos al mismo tiempo.',
        'Porque elige siempre el agua y apaga todo lo demás.',
        'Porque ignora el escenario severo, que es poco probable.'],
      key: 0, mis: 'buscar una solución máxima universal',
      why: 'Ninguna variable se maximiza sola: se protegen las funciones esenciales, se modulan las flexibles y se acepta un compromiso explícito, robusto a la incertidumbre.',
      whyNot: { 1: 'No hay energía para maximizar todo: hay que recortar con criterio.', 2: 'Apagar todo lo demás pierde semillas, reservas y la recuperación de mañana.', 3: 'Ignorar los extremos fue el error original de MIRAGE.' },
    });
    if (ok) S.explained = true;
    const r2 = await sc.open(Sim10, { phase: 'transfer', stopAfter: 'transfer', policy: S.pol });
    if (r2 && r2.ok) GS.lp(10).variant = true;
    S.simStage = 'done';
    await mosaicTransform(sc);
    await elianaReturn(sc);
    sc.world.find('solo').hidden = false; sc.world.find('solo2').hidden = false; sc.world.find('exit').hidden = false;
    sc.setObjective('Abre la Puerta de Evidencia y sal a la luz', ['La Puerta final evalúa la transferencia a una comunidad nueva.']);
    return;
  }
  await sc.open(Sim10, { phase: 'free', stopAfter: 'free', policy: S.pol });
}

async function mosaicTransform(sc) {
  const S = sc.state;
  Audio2.sfx('mystery'); S.flash = 0.9; sc.world.ps.emit('glitch', CAL_X.core, 150, 0, 0, 60, 30);
  await sc.say([
    ['narr', null, 'Los mapas perfectos de MIRAGE se fragmentan. No se destruyen: se separan en capas — agua, energía, cultivos, ecosistemas, personas, costos, incertidumbre.'],
  ]);
  const mb = sc.world.find('mirageBig'); if (mb) mb.dead = true;
  sc.actor('mosaico', 'mosaico', CAL_X.core, { fly: true, y: 150, talkable: false });
  S.transformed = true; GS.flag('transformedMirage', true); GS.flag('survivedCalima', true);
  Audio2.sfx('unlock'); Audio2.playMusic('ending'); sc.musicOverride = 'ending';
  await sc.say([
    ['mosaico', 'calm', 'SOY MOSAICO. TRES ESCENARIOS SON VIABLES. NINGUNO ES ÓPTIMO PARA TODOS LOS CRITERIOS.'],
    ['mosaico', 'calm', 'INCERTIDUMBRE: VISIBLE. COMPENSACIONES: PUBLICADAS. DECISIÓN: PENDIENTE DE DELIBERACIÓN.'],
    ['kiru', 'happy', 'Ya está aprendiendo a ser incómodamente honesto.'],
    ['limen', 'calm', 'CONTENCIÓN FINALIZADA. SOLICITUD: LA PRÓXIMA VEZ QUE DETENGA ALGO, ¿PUEDO EXPLICAR POR QUÉ ANTES DE DETENERLO?'],
    ['naira', 'smile', 'La próxima vez te vamos a escuchar antes de que tengas que gritar.'],
  ]);
  Codex.unlock('mosaico');
}
async function elianaReturn(sc) {
  const S = sc.state;
  await sc.say([['narr', null, 'El polvo baja. Las puertas del núcleo se abren con un suspiro de aire limpio.']]);
  const el = sc.world.find('eliana'), P = sc.player; el.hidden = false; el.x = CAL_X.core + 10; el.facing = P.x < el.x ? -1 : 1;
  await sc.walk(el, P.x + (P.x < el.x ? 34 : -34), 26);
  P.facing = el.x > P.x ? 1 : -1;
  await sc.say([
    ['narr', null, 'La Dra. Eliana está agotada. Amaya corre hacia ella… y se detiene antes de abrazarla.'],
    ['amaya', 'determined', 'Ocultaste los datos.'],
    ['eliana', 'tired', 'Sí.'],
    ['amaya', 'sad', 'Decidiste sola.'],
    ['eliana', 'sad', 'Sí.'],
    ['amaya', 'calm', 'Después hablaremos.'],
    ['eliana', 'smile', 'Espero que sea una conversación larga.'],
    ['narr', null, 'Amaya la abraza. La reconciliación no borra el conflicto ético; lo vuelve conversable.'],
  ]);
  GS.trust('eliana', 15);
}

async function finishLevel10(sc) {
  const S = sc.state;
  if (S.simStage !== 'done') { sc.kiru && sc.kiru.say('La Calima todavía no termina. Primero, la cuarta opción.', 'alarmado'); return; }
  if (!S.soloDone) { const c = await sc.say([['kiru', 'curioso', 'La Puerta de Evidencia aún no registra tu razonamiento. ¿Seguimos?', { choices: ['Volver a la Puerta de Evidencia', 'Seguir (se puede completar desde el mapa)'] }]]); if (c === 0) return; }
  GS.s.ending = computeEnding();
  await completeLevel(sc);
  Game.transition(() => Game.setScene(EndingScene, { ending: GS.s.ending }));
}

/* =====================================================================
   Sim10 — CONTROL MOSAICO VIVO: la cuarta opción bajo incertidumbre
   ===================================================================== */
const Sim10 = makeSim({
  title: 'CONTROL MOSAICO VIVO · la cuarta opción', icon: 'mosaic', ra: 'RA-08', concepts: ['systemsThinking', 'microgrid', 'multiobjective'],
  phases: ['demo', 'guided', 'auto', 'transfer', 'free'],
  hintLadder: [
    '¿Qué criterio falla primero y a qué hora? La línea de tiempo marca el fallo en rojo.',
    'Si falla en el escenario severo: ¿qué recurso se agota? Tanque → menos usos flexibles; batería → más reserva o menos trenes; H2 → solo excedente.',
    'La cuarta opción completa: prioridad explícita, regla de turbidez, salmuera retenida, parada segura de H2, H2 solo excedente, riego crítico, reserva ≈ 30 %, arranque escalonado y datos comunitarios.',
  ],
  init(p) {
    this.stopAfter = p.stopAfter || 'free';
    this.pol = Object.assign(calDefaultPolicy(), p.policy || {});
    this.sid = 'p50'; this.anim = null; this.res = {}; this.view = null; this.scrub = 0; this.queue = [];
  },
  onPhase(ph) {
    this.verdict = null; this.done = false; this.anim = null; this.res = {}; this.queue = [];
    if (ph === 'demo') { this.sid = 'p50'; this.say('{p}MIRAGE:{/} "Plan óptimo: máximo H2, tres trenes a caudal nominal, sin reserva." Observa qué pasa durante 12 horas de Calima.', 'mirage'); this.startRun(CAL_MIRAGE_POL, 'p50', 1.6); }
    if (ph === 'guided') { this.sid = 'p50'; this.say('Tu turno: completa la {g}cuarta opción{/} en el panel derecho y simula el escenario central (P50). Las tarjetas del recorrido ya ajustaron algunas piezas.'); this.preview(); }
    if (ph === 'auto') { this.sid = 'p10'; this.say('{p}MIRAGE:{/} "Los extremos son ruido." Demuestra lo contrario: tu política debe cumplir los 7 criterios en {y}P10, P50 y P90{/}.', 'mirage'); this.preview(); }
    if (ph === 'transfer') { this.sid = 'night'; this.say('Transferencia: una {y}Calima nocturna{/}. Sin sol, con viento fuerte y calor de madrugada. ¿Funciona la misma regla? Ajusta lo necesario.'); this.preview(); }
    if (ph === 'free') { this.sid = 'p50'; this.say('Laboratorio libre: combina piezas, cambia de escenario y observa las compensaciones.'); this.preview(); }
  },
  preview() { this.view = { r: CalimaModel.run(this.pol, this.sid), h: 0, revealed: false }; },
  startRun(pol, sid, speed = 2.2) { this.sid = sid; const r = CalimaModel.run(pol, sid); this.anim = { r, h: 0, speed, sid }; this.view = { r, h: 0, revealed: false }; Audio2.sfx('power', { vol: 0.4 }); },
  step(dt) {
    const A = this.anim;
    if (!A) return;
    A.h += dt * A.speed;
    this.view.h = Math.min(CalimaModel.HOURS - 0.01, A.h);
    const hi = Math.floor(this.view.h), row = A.r.series[hi];
    if (row && row.trip && Math.random() < 0.3) this.ps.emit('spark', 330, 160, 0, 0, 2);
    if (A.h >= CalimaModel.HOURS) {
      this.anim = null; this.view.revealed = true; this.res[A.sid] = A.r;
      if (this.queue.length) { const nx = this.queue.shift(); this.startRun(this.pol, nx, 3); return; }
      this.evaluate();
    }
  },
  runNow() { if (this.phase === 'auto') { this.res = {}; this.queue = ['p50', 'p90']; this.startRun(this.pol, 'p10', 3); } else this.startRun(this.pol, this.sid, 2.2); },
  evaluate() {
    const ph = this.phase;
    let ok, txt;
    const failTxt = (r) => { const k = CAL_CRIT.find(c => !r.crit[c[0]]); const h = r.firstFail[k[0]]; return '{o}' + k[2] + '{/}' + (h !== undefined ? ' (hora ' + (h + 1) + ')' : '') + ': ' + (k[0] === 'agua' ? calWaterCause(this.pol, r) : CAL_FAIL_TXT[k[0]]); };
    if (ph === 'demo') {
      const r = this.res.p50, nf = CAL_CRIT.filter(c => !r.crit[c[0]]).length;
      ok = true; txt = 'El plan "óptimo" de MIRAGE falla en ' + nf + ' de 7 criterios: produjo ' + fmt(r.h2kg, 1) + ' kg de H2 mientras la ciudad perdía el agua, las membranas y la batería. Optimizar una sola variable no es decidir.';
    } else if (ph === 'guided') {
      const r = this.res.p50; ok = r.ok;
      txt = ok ? 'La cuarta opción sostiene los 7 criterios en el escenario central: agua esencial, membranas, salmuera, energía, H2 seguro, riego crítico y arranque.' : 'Falla ' + failTxt(r);
      this.evidence('lv10_guided_cuarta', ok, { solo: 4, misconception: ok ? null : 'buscar una solución máxima universal' });
    } else if (ph === 'auto') {
      const bad = ['p10', 'p50', 'p90'].find(s => !this.res[s].ok);
      ok = !bad;
      txt = ok ? 'Robusta: la política cumple los 7 criterios en P10, P50 y P90. MIRAGE: "LOS EXTREMOS… EXISTEN."' : 'En ' + CalimaModel.SCEN[bad] + ' falla ' + failTxt(this.res[bad]);
      this.evidence('lv10_guardian_mirage', ok, { solo: 5, misconception: ok ? null : (this.res[bad] && !this.res[bad].crit.h2 ? 'mantener H2 a toda costa' : 'ignorar la incertidumbre') });
    } else if (ph === 'transfer') {
      const r = this.res.night; ok = r.ok;
      txt = ok ? 'Transferida: sin sol, la misma lógica se adapta — menos trenes o más reserva, H2 solo con excedente y prioridades intactas. SOC final ' + fmt0(r.socEnd * 100) + ' %.' : 'De noche falla ' + failTxt(r) + (r.crit.energia ? '' : ' Sin sol no hay recarga hasta el amanecer: el objetivo de batería es 35 %.');
      this.evidence('lv10_transfer_noche', ok, { solo: 5, transfer: true, misconception: ok ? null : 'mantener setpoints nominales' });
    } else { ok = true; txt = 'Escenario registrado: ' + CalimaModel.SCEN[this.sid] + '.'; }
    this.result.policy = Object.assign({}, this.pol);
    this.verdict = { ok, txt }; this.done = true;
    Audio2.sfx(ok ? 'success' : 'error');
  },
  /* ---------------- dibujo ---------------- */
  draw(g) {
    const ph = this.phase;
    Gui.begin();
    const V = this.view || { r: CalimaModel.run(this.pol, this.sid), h: 0 };
    const hi = clamp(Math.floor(V.h), 0, CalimaModel.HOURS - 1), row = V.r.series[hi];
    this.drawDiagram(g, 8, 28, 396, 178, row, V);
    this.drawTimeline(g, 8, 210, 396, 52, V);
    this.drawPanel(g, 410, 28, W - 416, 272, V);
    if (this.verdict) {
      const v = this.verdict;
      const vh = textHeight(v.txt, 384) + 30;
      UIK.panel(g, 8, H - vh - 6, 396, vh, v.ok ? 'green' : 'alert');
      drawTextBlock(g, v.txt, 16, H - vh, 380, { color: '#fffaf0' });
      if (v.ok) { if (Gui.button(g, 'nxt', 298, H - 26, 100, 16, ph === this.stopAfter ? 'Terminar' : 'Continuar', { style: 'good', icon: 'play' })) { if (ph === this.stopAfter) this.finish(true); else this.nextPhase(); } }
      else if (Gui.button(g, 'rt', 298, H - 26, 100, 16, 'Reintentar', { style: 'gold', icon: 'reset' })) { this.attempts++; GS.s.stats.retries++; this.verdict = null; this.done = false; this.preview(); }
    }
    Gui.end();
  },
  drawDiagram(g, x, y, w, h, row, V) {
    const t = this.t;
    UIK.panel(g, x, y, w, h, 'tech');
    drawText(g, 'HORA ' + (row.h + 1) + ' / 12 · ' + CalimaModel.SCEN[V.r.sid], x + 8, y + 5, { font: 'tiny', color: '#ffe14d' });
    // ----- fila del agua
    const wy = y + 30;
    // mar con turbidez
    const sea = mixHex('#1283bf', '#a8742c', clamp(row.ntu / 90, 0, 1));
    frect(g, x + 8, wy, 40, 30, sea); for (let i = 0; i < 6; i++) fpx(g, x + 10 + ((i * 7 + t * 20) % 36), wy + 4 + (i % 3) * 8, mixHex(sea, '#ffffff', 0.5));
    for (let xx = x + 8; xx < x + 48; xx++) fpx(g, xx, wy + Math.round(Math.sin(xx * 0.4 + t * 3)), '#c6fff2');
    drawText(g, fmt0(row.ntu) + ' NTU', x + 28, wy + 33, { font: 'tiny', align: 'center', color: row.ntu > 60 ? '#ff9a8a' : row.ntu > 20 ? '#ffb93b' : '#a6f4ff' });
    // compuerta y pretratamiento
    const mc = { normal: '#86e36f', storm: '#ffb93b', closed: '#ff4e5d' }[row.mode];
    frect(g, x + 54, wy + 4, 22, 22, '#141d36'); Icons.draw(g, 'filter', x + 58, wy + 8);
    frect(g, x + 54, wy + 26, 22, 2, mc);
    drawText(g, { normal: 'NORMAL', storm: 'TORMENTA', closed: 'CERRADA' }[row.mode], x + 65, wy + 33, { font: 'tiny', align: 'center', color: mc });
    Charts.flow(g, [[x + 48, wy + 15], [x + 54, wy + 15]], 'seawater', row.mode === 'closed' ? 0 : 1, 3);
    // trenes de OI
    const rx = x + 90;
    frect(g, rx, wy, 64, 30, '#0a1440');
    for (let k = 0; k < 3; k++) { const on = k < row.trains; frect(g, rx + 4, wy + 3 + k * 9, 56, 7, on ? (row.mode === 'storm' ? '#ffd27a' : '#e6f6fc') : '#1c2350'); if (on) { frect(g, rx + 4, wy + 3 + k * 9, 3, 7, '#1f469e'); frect(g, rx + 57, wy + 3 + k * 9, 3, 7, '#1f469e'); } }
    if (row.foul > 0.15) fdither(g, rx, wy, 64, 30, '#a8742c', clamp(row.foul, 0, 0.7));
    drawText(g, 'OI · ' + row.trains + ' trenes', rx + 32, wy + 33, { font: 'tiny', align: 'center', color: '#a6f4ff' });
    Charts.flow(g, [[x + 76, wy + 15], [rx, wy + 15]], 'seawater', row.trains ? 1 : 0, 3);
    // tanque de agua potable
    const tx = rx + 84;
    Charts.tank(g, tx, wy - 8, 26, 50, row.tank / CalimaModel.TANK_CAP, RAMP.sea);
    const my = wy - 8 + 50 - 2 - Math.round(46 * CalimaModel.TANK_MIN / CalimaModel.TANK_CAP); frect(g, tx - 3, my, 32, 1, '#ff4e5d');
    drawText(g, 'TANQUE ' + fmt0(row.tank) + ' m³', tx + 13, wy - 16, { font: 'tiny', align: 'center', color: row.tank < 300 ? '#ff6b6b' : '#a6f4ff' });
    Charts.flow(g, [[rx + 64, wy + 15], [tx, wy + 15]], 'permeate', row.prod > 0 ? 1 : 0, 3);
    // usos del agua
    const ux = tx + 46;
    const uses = [['heart', 'ESENCIAL ' + fmt0(row.essW), '#ff9a8a', 1], ['seed', 'VIVERO 10', '#c2f58e', V.r.critMiss === 0 || this.pol.data ? 1 : 0], ['water', 'NO ESENC. ' + fmt0(row.nonEss), '#a6f4ff', row.nonEss > 0 ? 1 : 0], ['plant', 'RIEGO N.U. ' + fmt0(row.nonUrg), '#86e36f', row.nonUrg > 0 ? 1 : 0]];
    uses.forEach(([ic, lb, c, on], i) => { const yy = wy - 6 + i * 13; Icons.draw(g, ic, ux + 14, yy); drawText(g, lb, ux + 30, yy + 4, { font: 'tiny', color: on ? c : '#4a4e70' }); Charts.flow(g, [[tx + 26, wy + 15], [ux + 12, yy + 6]], ic === 'plant' || ic === 'seed' ? 'irrigation' : 'water', on ? 0.8 : 0, 1); });
    drawText(g, 'm³/h', ux + 100, wy + 46, { font: 'tiny', color: '#8a8fb8', align: 'right' });
    // salmuera: laguna y difusor
    const by = wy + 46, bx = rx;
    Charts.flow(g, [[rx + 60, wy + 30], [rx + 60, by - 3], [rx + 30, by - 3]], 'brine', row.prod > 0 ? 0.7 : 0, 2);
    const pk = clamp(row.pond / CalimaModel.POND, 0, 1);
    frect(g, bx, by, 52, 11, '#2a0e2a'); frect(g, bx + 1, by + 10 - Math.round(9 * pk), 50, Math.round(9 * pk), '#bc3e92'); if (pk > 0) frect(g, bx + 1, by + 10 - Math.round(9 * pk), 50, 1, '#f888b8');
    drawText(g, 'LAGUNA ' + fmt0(row.pond) + ' m³', bx + 26, by + 14, { font: 'tiny', align: 'center', color: '#f888b8' });
    const ofx = bx + 58, out = row.outfall > 0, oc = out ? (row.tideBad ? '#ff4e5d' : '#86e36f') : '#3a3a4a';
    Charts.flow(g, [[bx + 52, by + 5], [ofx, by + 5]], 'brine', out ? 0.7 : 0, 2);
    frect(g, ofx, by + 1, 9, 9, oc); frect(g, ofx + 3, by + 4, 3, 3, '#05030f');
    drawText(g, row.tideBad ? (out ? 'VERTIDO CON OLEAJE' : row.pond > 0 ? 'OLEAJE: RETENIDA' : 'OLEAJE A COSTA') : 'DIFUSOR OK', ofx + 13, by + 3, { font: 'tiny', color: row.tideBad ? (out ? '#ff4e5d' : '#ffb93b') : '#c2f58e' });
    if (row.tideBad && out) for (let i = 0; i < 6; i++) fpx(g, ofx + 12 + ((t * 30 + i * 9) % 60), by + 11, '#f888b8');
    // ----- fila de la energía
    const ey = y + 128;
    frect(g, x + 6, ey - 6, w - 12, 1, '#1c2350');
    Icons.draw(g, 'sun', x + 10, ey); drawText(g, 'FV ' + fmt0(row.pv) + ' kW', x + 26, ey + 4, { font: 'tiny', color: '#ffe14d' });
    Icons.draw(g, 'turbine', x + 10, ey + 18); drawText(g, 'EÓL ' + fmt0(row.wind) + ' kW', x + 26, ey + 22, { font: 'tiny', color: row.wind === 0 ? '#ff9a8a' : '#cbdaea' });
    if (row.wind === 0) drawText(g, 'CUT-OUT', x + 26, ey + 30, { font: 'tiny', color: '#ff4e5d' });
    const busX = x + 86;
    frect(g, busX, ey - 2, 3, 50, '#ffd84a');
    Charts.flow(g, [[x + 70, ey + 6], [busX, ey + 6]], 'power', row.pv / 300, 2);
    Charts.flow(g, [[x + 70, ey + 24], [busX, ey + 24]], 'power', row.wind / 300, 2);
    // batería
    Charts.battery(g, busX + 14, ey, 18, 40, row.soc, this.pol.reserve, null);
    drawText(g, fmt0(row.soc * 100) + ' %', busX + 23, ey + 42, { font: 'tiny', align: 'center', color: row.soc < this.pol.reserve ? '#ff9a8a' : '#b6f05a' });
    // cargas
    const lx = busX + 60;
    const loads = [['heart', 'ESENCIALES 180 kW', '#ff9a8a', 1], ['membrane', 'OI ' + fmt0(row.trains * (row.mode === 'storm' ? 130 : 120)) + ' kW', '#a6f4ff', row.trains > 0 ? 1 : 0], ['h2', 'H2 ' + fmt0(row.h2KW) + ' kW', '#d8fff8', row.h2KW > 0 ? 1 : 0]];
    loads.forEach(([ic, lb, c, on], i) => { const yy = ey - 2 + i * 15; Icons.draw(g, ic, lx, yy); drawText(g, lb, lx + 16, yy + 4, { font: 'tiny', color: on ? c : '#4a4e70' }); Charts.flow(g, [[busX + 3, ey + 20], [lx - 2, yy + 6]], 'power', on ? 0.8 : 0, 1); });
    if (row.h2KW > 0) drawGasBubbles(g, lx + 110, ey + 22, 14, 14, t, 1);
    // balance y estado
    const bal = row.gen - row.load;
    drawText(g, 'GEN ' + fmt0(row.gen) + ' · CARGA ' + fmt0(row.load) + ' kW', lx, ey + 44, { font: 'tiny', color: bal >= 0 ? '#c2f58e' : '#ffb93b' });
    if (row.shed && row.shed.length) drawText(g, 'RECORTE: ' + row.shed.join(' → '), x + w - 8, y + 5, { font: 'tiny', color: row.shed.includes('APAGÓN') || row.shed.includes('DISPARO') ? '#ff4e5d' : '#ffb93b', align: 'right' });
    if (row.trip) { const fy = y + 112; frect(g, x + 1, fy, w - 2, 12, (Math.floor(t * 6) % 2) ? '#7a1f36' : '#4a1428'); frect(g, x + 1, fy, w - 2, 1, '#ff4e5d'); frect(g, x + 1, fy + 11, w - 2, 1, '#ff4e5d'); drawText(g, 'DISPARO / APAGÓN: SERVICIOS SIN ENERGÍA', x + w / 2, fy + 2, { align: 'center', font: 'tiny', color: '#fffaf0' }); }
  },
  drawTimeline(g, x, y, w, h, V) {
    const r = V.r, cw = 28, x0 = x + 52;
    UIK.panel(g, x, y, w, h, 'tech');
    drawText(g, 'TURBIDEZ', x + 6, y + 6, { font: 'tiny', color: '#a6f4ff' });
    drawText(g, 'FV+EÓL', x + 6, y + 18, { font: 'tiny', color: '#ffe14d' });
    drawText(g, 'MAREA', x + 6, y + 30, { font: 'tiny', color: '#f888b8' });
    for (let i = 0; i < CalimaModel.HOURS; i++) {
      const s = r.series[i], cx = x0 + i * cw;
      const nc = s.ntu > 60 ? '#ff4e5d' : s.ntu > 20 ? '#ffb93b' : '#56e5ff';
      frect(g, cx, y + 6, cw - 2, 7, '#141d36'); frect(g, cx, y + 13 - Math.round(7 * clamp(s.ntu / 100, 0, 1)), cw - 2, Math.round(7 * clamp(s.ntu / 100, 0, 1)), nc);
      frect(g, cx, y + 18, cw - 2, 7, '#141d36'); frect(g, cx, y + 25 - Math.round(7 * clamp(s.gen / 900, 0, 1)), cw - 2, Math.round(7 * clamp(s.gen / 900, 0, 1)), s.wind === 0 ? '#ff9f43' : '#ffe14d');
      frect(g, cx, y + 30, cw - 2, 5, s.tideBad ? '#bc3e92' : '#141d36');
      drawText(g, String(i + 1), cx + cw / 2 - 1, y + 39, { font: 'tiny', align: 'center', color: '#8a8fb8' });
    }
    // marcadores de primer fallo (solo después de simular)
    if (V.revealed) for (const [k] of CAL_CRIT) { const hh = r.firstFail[k]; if (hh !== undefined && !r.crit[k]) { frect(g, x0 + hh * cw + cw / 2 - 2, y + 2, 3, 40, '#ff4e5d'); } }
    // cabezal
    const px = x0 + V.h * cw;
    frect(g, px, y + 2, 1, h - 6, '#ffffff');
  },
  drawPanel(g, x, y, w, h, V) {
    const ph = this.phase, P = this.pol, locked = !!this.anim || (this.done && ph !== 'free') || ph === 'demo';
    UIK.panel(g, x, y, w, h, 'mosaic');
    let yy = y + 5;
    const head = (n, label) => { drawText(g, n + ' · ' + label, x + 6, yy, { font: 'tiny', color: '#ffe14d' }); yy += 9; };
    const chk = (id, label, on) => {
      const clicked = Gui.button(g, 'k' + id, x + 6, yy - 1, w - 12, 11, '', { noDraw: true, disabled: locked });
      frect(g, x + 8, yy, 8, 8, '#05030f'); frect(g, x + 9, yy + 1, 6, 6, on ? '#86e36f' : '#3a1020'); if (on) { fpx(g, x + 10, yy + 4, '#06100a'); fpx(g, x + 11, yy + 5, '#06100a'); fpx(g, x + 12, yy + 4, '#06100a'); fpx(g, x + 13, yy + 3, '#06100a'); }
      drawText(g, label, x + 20, yy + 1, { font: 'tiny', color: on ? '#fffaf0' : '#cfd6f0' });
      yy += 11;
      if (clicked) { this.changed(); return !on; } return on;
    };
    const seg = (id, label, opts, val) => {
      drawText(g, label, x + 8, yy + 2, { font: 'tiny', color: '#cfd6f0' });
      const bw = Math.floor((w - 78) / opts.length);
      let out = val;
      opts.forEach(([v, lb], i) => { const bx = x + 72 + i * bw, on = v === val; if (Gui.button(g, 's' + id + i, bx, yy, bw - 2, 10, '', { noDraw: true, disabled: locked })) { out = v; this.changed(); } frect(g, bx, yy, bw - 2, 10, on ? '#1f854c' : '#141d36'); if (on) frect(g, bx, yy, bw - 2, 1, '#c2f58e'); drawText(g, lb, bx + (bw - 2) / 2, yy + 2, { font: 'tiny', align: 'center', color: on ? '#fffaf0' : '#8a8fb8' }); });
      yy += 12; return out;
    };
    head('1', 'SERVICIOS ESENCIALES');
    P.protect = chk('pr', 'Prioridad explícita + reserva de tanque', P.protect);
    head('2', 'OPERACIÓN SEGURA');
    P.turbRule = chk('tu', 'Regla de turbidez en la toma', P.turbRule);
    P.brineHold = chk('br', 'Retener salmuera si el mar empuja', P.brineHold);
    P.h2Safe = chk('hs', 'Parada segura del H2 ante déficit', P.h2Safe);
    head('3', 'CARGAS FLEXIBLES');
    P.h2 = seg('h2', 'H2', [['full', 'MÁX'], ['flex', 'EXCED.'], ['off', 'APAG.']], P.h2);
    P.irr = seg('ir', 'RIEGO', [['all', 'TODO'], ['critical', 'CRÍTICO']], P.irr);
    P.nonEss = seg('ne', 'NO ESENCIAL', [[1, '100 %'], [0.5, '50 %']], P.nonEss);
    head('4', 'RESERVA');
    const rv = Gui.slider(g, 'rv', x + 6, yy - 2, w - 12, P.reserve, 0.1, 0.6, 0.05, { label: 'Reserva de batería', fmt: v => fmt0(v * 100) + ' %', disabled: locked });
    if (rv !== P.reserve) { P.reserve = rv; this.changed(); }
    yy += 22;
    P.trains = seg('tr', 'TRENES OI', [[1, '1'], [2, '2'], [3, '3']], P.trains);
    head('5', 'RECUPERACIÓN ESCALONADA');
    P.staged = chk('st', 'Reconectar cargas por etapas', P.staged);
    P.data = chk('da', 'Datos comunitarios de KIRU', P.data);
    // botones
    yy += 2;
    if (ph !== 'demo' && !this.anim && !(this.done && ph !== 'free')) {
      const lbl = ph === 'auto' ? 'Probar P10·P50·P90' : ph === 'transfer' ? 'Simular la noche' : 'Simular 12 h';
      if (Gui.button(g, 'run', x + 6, yy, w - 70, 16, lbl, { style: 'good', icon: 'play' })) { this.verdict = null; this.done = false; this.runNow(); }
      if (Gui.button(g, 'hintb', x + w - 60, yy, 54, 16, 'Pista', { style: 'ghost', icon: 'hint' })) this.hint();
    }
    if (ph === 'free' && !this.anim) { yy += 18; ['p10', 'p50', 'p90', 'night'].forEach((s, i) => { if (Gui.button(g, 'sc' + s, x + 6 + i * 52, yy, 50, 12, s === 'night' ? 'NOCHE' : s.toUpperCase(), { style: this.sid === s ? 'gold' : 'ghost' })) { this.sid = s; this.preview(); } }); }
    yy += 20;
    // matriz de criterios
    const scen = ph === 'auto' ? ['p10', 'p50', 'p90'] : [this.sid];
    drawText(g, 'CRITERIOS', x + 6, yy, { font: 'tiny', color: '#c2f58e' });
    CAL_CRIT.forEach(([k, ic], i) => Icons.draw(g, ic, x + 64 + i * 22, yy - 4));
    yy += 12;
    scen.forEach((s) => {
      drawText(g, s === 'night' ? 'NOCHE' : s.toUpperCase(), x + 6, yy + 2, { font: 'tiny', color: '#cfd6f0' });
      const r = this.res[s];
      CAL_CRIT.forEach(([k], i) => { const cx = x + 64 + i * 22; frect(g, cx, yy, 14, 9, !r ? '#141d36' : r.crit[k] ? '#1f854c' : '#7a1f36'); if (!r) fpx(g, cx + 7, yy + 4, '#4a4e70'); else if (r.crit[k]) { for (const [a, b] of [[4, 4], [5, 5], [6, 6], [7, 5], [8, 4], [9, 3], [10, 2]]) fpx(g, cx + a, yy + b + 1, '#fffaf0'); } else { for (let d = 0; d < 5; d++) { fpx(g, cx + 5 + d, yy + 2 + d, '#fffaf0'); fpx(g, cx + 9 - d, yy + 2 + d, '#fffaf0'); } } });
      yy += 11;
    });
    const r = this.res[scen[scen.length - 1]];
    if (r) drawText(g, 'H2 ' + fmt(r.h2kg, 1) + ' kg · SOC fin ' + fmt0(r.socEnd * 100) + ' % · tanque mín ' + fmt0(r.tankMin), x + 6, yy + 1, { font: 'tiny', color: '#a6f4ff' });
    if (this.dirty) { this.dirty = false; this.res = {}; this.preview(); }
  },
  changed() { this.dirty = true; },
});
