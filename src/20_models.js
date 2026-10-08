/* =====================================================================
   20_models.js — Modelos científicos simplificados, deterministas y
   explicables. Sin dependencias del DOM (se prueban en Node).
   Todas las cifras de escenario son supuestos de simulación salvo
   las constantes físicas y rangos indicados en el Atlas.
   ===================================================================== */

const UNITS = {
  'm³/h': 'caudal', 'g/L': 'concentración', 'bar': 'presión', 'kW': 'potencia', 'kWh': 'energía', 'kWh/m³': 'energía específica',
  'kg': 'masa', 'kg/h': 'flujo másico', 'kWh/kg': 'energía específica', 'W/m²': 'irradiancia', 'm/s': 'velocidad', '%': 'fracción', 'mm/día': 'lámina diaria', 'dS/m': 'conductividad', 'mg/L': 'concentración', 'NTU': 'turbidez',
};
/** Variable con metadatos (sec. 21 de la especificación) */
function V(name, symbol, value, unit, min, max, simulated = true, explanation = '', source = null) { return { name, symbol, value, unit, min, max, simulated, explanation, source }; }

const K_OSM = 0.77;        // bar por g/L (aprox. van 't Hoff para NaCl/agua de mar)
const H2_STOICH_WATER = 18.015 / 2.016; // ≈ 8,936 kg agua / kg H2
const H2_O2_RATIO = 15.999 / 2.016;     // ≈ 7,94 kg O2 / kg H2
const H2_LHV = 33.33;      // kWh/kg

/* =====================================================================
   Toma y pretratamiento
   ===================================================================== */
const IntakeModel = {
  /**
   * p: {Qtoma m³/h, depth m, screens bool, coag 0..1, turbIn NTU, filterDP bar, cap m³/h, dt h}
   * Retorna turbidez de salida, ΔP del filtro, riesgo ecológico, fouling potencial.
   */
  step(p) {
    const depthFactor = clamp(1 - (p.depth - 2) / 14, 0.35, 1);          // tomas más profundas captan menos sedimento resuspendido
    const turbRaw = p.turbIn * depthFactor;
    const capture = p.screens ? 0.15 : 0.0;
    const removal = clamp(0.55 + 0.38 * p.coag + capture, 0, 0.97);        // eficiencia abstracta de coagulación+filtración
    const load = turbRaw * p.Qtoma / 1000;                                 // carga de sólidos relativa
    const overload = Math.max(0, p.Qtoma / p.cap - 1);
    const turbOut = turbRaw * (1 - removal) * (1 + overload * 3);
    const dDP = (0.012 * load * (1 + overload * 4) - (p.backwash ? 0.6 : 0)) * p.dt;
    const filterDP = clamp((p.filterDP ?? 0.3) + dDP, 0.2, 2.5);
    const approachV = p.Qtoma / 3600 / (p.screens ? 2.4 : 1.6);            // m/s sobre área efectiva (m²)
    const ecoRisk = clamp((approachV - 0.15) / 0.25, 0, 1) * (p.screens ? 0.55 : 1) * (p.depth < 4 ? 1.2 : 1);
    const sdi = clamp(1 + turbOut * 0.9 + (filterDP - 0.3) * 1.5, 0, 9);
    const treatable = turbOut < 2.0 && filterDP < 1.2 && overload < 0.05;
    return { turbRaw, turbOut, filterDP, approachV, ecoRisk, sdi, removal, overload, treatable, Qtoma: p.Qtoma };
  },
};

/* =====================================================================
   Ósmosis inversa
   ===================================================================== */
const ROModel = {
  defaults: { Qf: 100, Cf: 35, T: 25, P: 60, foul: 0, A: 1.88, etaPump: 0.8, etaERD: 0.95, dPloss: 1.0, aux: 0.25, Pmax: 82, CpMax: 0.4, Rmax: 0.55 },
  /** Resuelve el estado estacionario. p: {Qf, Cf, T, P, foul, A, etaPump, etaERD, dPloss, aux} */
  solve(params) {
    const p = Object.assign({}, this.defaults, params);
    const TCF = Math.exp(0.03 * (p.T - 25));
    const loss = p.dPloss + p.foul * 2.2;
    const Aeff = p.A * TCF * (1 - 0.6 * clamp(p.foul, 0, 1));
    const state = (R) => {
      const Qp = R * p.Qf, Qc = p.Qf - Qp;
      // iteración interna para Cp (paso de sal) y Cc (balance)
      let Cp = 0.005 * p.Cf, Cc = p.Cf;
      let NDP = 0;
      for (let k = 0; k < 6; k++) {
        Cc = Qc > 1e-6 ? (p.Cf * p.Qf - Cp * Qp) / Qc : p.Cf * 50;
        const piAvg = K_OSM * (p.Cf + Cc) / 2;
        NDP = p.P - piAvg + K_OSM * Cp - loss;
        const Jrel = Math.max(0.05, NDP / 22);
        const Cavg = (p.Cf + Cc) / 2;
        Cp = Math.min(Cavg, 0.0045 * Cavg / Jrel * TCF * (1 + 1.5 * clamp(p.foul, 0, 1)));
      }
      return { Qp, Qc, Cp, Cc, NDP };
    };
    // bisección: A·NDP(R) = R·Qf
    let lo = 0, hi = 0.95;
    const f = (R) => Aeff * Math.max(0, state(R).NDP) - R * p.Qf;
    let R;
    if (f(1e-4) <= 0) R = 0;
    else {
      for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (f(m) > 0) lo = m; else hi = m; }
      R = (lo + hi) / 2;
    }
    const s = state(R);
    const Qp = Math.max(0, s.Qp), Qc = p.Qf - Qp;
    const Cc = s.Cc, Cp = R > 0 ? s.Cp : 0;
    const piF = K_OSM * p.Cf, piC = K_OSM * Cc, piAvg = (piF + piC) / 2;
    // energía
    const hydFeed = p.P * p.Qf / 36;                         // kW hidráulicos (bar·m³/h / 36)
    const recov = p.etaERD * Math.max(0, p.P - loss) * Qc / 36;
    const Ppump = Math.max(0, hydFeed - recov) / p.etaPump;
    const Paux = p.aux * p.Qf;                              // pretratamiento y bombeo de toma (kWh/m³ de alimentación)
    const Pel = Ppump + Paux;
    const SEC = Qp > 0.01 ? Pel / Qp : Infinity;
    const scaleIdx = (Cc - 62) / 12 + (p.T - 25) * 0.03;    // >0 → riesgo de incrustación
    const fluxIdx = s.NDP / 22;                              // >1.25 → flujo alto, ensuciamiento acelerado
    const alarms = [];
    if (p.P > p.Pmax) alarms.push({ id: 'pmax', sev: 3, text: 'Presión sobre el límite mecánico de los recipientes' });
    else if (p.P > p.Pmax - 6) alarms.push({ id: 'phigh', sev: 1, text: 'Presión cercana al límite' });
    if (Cp > p.CpMax) alarms.push({ id: 'quality', sev: 3, text: 'Permeado fuera de especificación (conductividad alta)' });
    if (R > p.Rmax) alarms.push({ id: 'recovery', sev: 2, text: 'Recuperación alta: concentrado muy salino' });
    if (scaleIdx > 0) alarms.push({ id: 'scaling', sev: scaleIdx > 0.6 ? 3 : 2, text: 'Riesgo de incrustación en membranas' });
    if (fluxIdx > 1.3) alarms.push({ id: 'flux', sev: 2, text: 'Flujo alto: ensuciamiento acelerado' });
    if (Qp <= 0.01) alarms.push({ id: 'noflow', sev: 2, text: 'Sin presión neta de impulso: no hay permeado' });
    if (Qc < 0.3 * p.Qf) alarms.push({ id: 'qcmin', sev: 2, text: 'Caudal de concentrado bajo el mínimo de arrastre' });
    const ok = !alarms.some(a => a.sev >= 3) && Qp > 0;
    return { Qf: p.Qf, Qp, Qc, R, Cf: p.Cf, Cp, Cc, piF, piC, piAvg, NDP: s.NDP, P: p.P, T: p.T, Pel, Ppump, Paux, recov: recov / p.etaPump, SEC, scaleIdx, fluxIdx, foul: p.foul, alarms, ok,
      saltIn: p.Cf * p.Qf, saltOut: Cp * Qp + Cc * Qc };
  },
  /** Evolución del ensuciamiento por hora */
  foulRate(r, sdi) { return 0.002 * Math.max(0, sdi - 2) + 0.004 * Math.max(0, r.fluxIdx - 1.1) + (r.scaleIdx > 0 ? 0.006 * r.scaleIdx : 0); },
  clean(foul) { return foul * 0.15; },
};

/* =====================================================================
   Pluma de salmuera (advección–difusión 2D, conserva masa)
   ===================================================================== */
class BrinePlume {
  constructor(nx = 64, ny = 36, cell = 25) {
    this.nx = nx; this.ny = ny; this.cell = cell; // m por celda
    this.s = new Float32Array(nx * ny); this.tmp = new Float32Array(nx * ny);
    this.exported = 0; this.discharged = 0; this.t = 0;
    this.kappa = 0.18; this.U = 0.9; this.tidePeriod = 12.4; this.cross = 0.12;
    this.land = new Uint8Array(nx * ny); // 1 = tierra (no agua)
    this.receptors = []; // {x,y,r,name,sens}
    this.exposure = 0;
  }
  idx(x, y) { return y * this.nx + x; }
  tideU(t = this.t) { return this.U * Math.sin(TAU * t / this.tidePeriod); }
  mass() { let m = 0; for (let i = 0; i < this.s.length; i++) m += this.s[i]; return m; }
  /** Inyecta masa de sal en exceso (kg) en una celda o difusor */
  inject(x, y, massKg, diffuser = 1) {
    const r = Math.max(0, diffuser - 1);
    const cells = [];
    for (let dy = -r; dy <= r; dy++) for (let dx = -r * 2; dx <= r * 2; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < this.nx && yy < this.ny && !this.land[this.idx(xx, yy)]) cells.push(this.idx(xx, yy)); }
    if (!cells.length) return;
    const per = massKg / cells.length;
    for (const i of cells) this.s[i] += per;
    this.discharged += massKg;
  }
  /** Paso de tiempo dt (h). Advección upwind + difusión explícita; frontera mar adentro abierta. */
  step(dt) {
    const { nx, ny, s, tmp, land } = this;
    const u = this.tideU(), v = this.cross;
    const cu = clamp(Math.abs(u) * dt, 0, 0.45), cv = clamp(Math.abs(v) * dt, 0, 0.45), kd = clamp(this.kappa * dt, 0, 0.2);
    tmp.fill(0);
    let out = 0;
    for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
      const i = y * nx + x; const m = s[i]; if (m <= 0) continue;
      if (land[i]) { tmp[i] += m; continue; }
      let stay = m;
      const send = (xx, yy, amt) => {
        if (xx < 0 || xx >= nx || yy >= ny) { out += amt; return true; } // sale por fronteras abiertas (laterales y mar adentro)
        if (yy < 0) return false;
        const j = yy * nx + xx; if (land[j]) return false;
        tmp[j] += amt; return true;
      };
      // advección
      const ax = u > 0 ? 1 : -1, ay = v > 0 ? 1 : -1;
      const mx = m * cu, my = m * cv;
      if (send(x + ax, y, mx)) stay -= mx;
      if (send(x, y + ay, my)) stay -= my;
      // difusión a 4 vecinos
      const md = m * kd;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (send(x + dx, y + dy, md)) stay -= md;
      tmp[i] += stay;
    }
    s.set(tmp);
    this.exported += out;
    this.t += dt;
    // exposición de receptores: celdas con exceso > umbral
    let exp = 0;
    for (const r of this.receptors) { const c = this.concAt(r.x, r.y); r.c = c; if (c > r.th) exp += (c - r.th) * r.sens * dt; }
    this.exposure += exp;
    return exp;
  }
  /** Concentración en exceso (g/L) en celda: masa / volumen de celda (profundidad 2 m) */
  concAt(x, y) { x = clamp(x | 0, 0, this.nx - 1); y = clamp(y | 0, 0, this.ny - 1); return this.s[this.idx(x, y)] / (this.cell * this.cell * 2) ; }
  areaAbove(th) { let n = 0; const vol = this.cell * this.cell * 2; for (let i = 0; i < this.s.length; i++) if (this.s[i] / vol > th) n++; return n * this.cell * this.cell; }
  balanceError() { return Math.abs(this.discharged - (this.mass() + this.exported)) / Math.max(1, this.discharged); }
}

/* =====================================================================
   Fotovoltaica
   ===================================================================== */
const PVModel = {
  /** Potencia (kW). p: {Pnom kW, G W/m², Ta °C, soil 0..1, shade 0..1, inv 0..1, gamma %/°C, avail} */
  power(p) {
    const gamma = p.gamma ?? -0.004; // fracción por °C
    const Tm = (p.Ta ?? 30) + (p.G / 800) * ((p.noct ?? 45) - 20);
    const fT = 1 + gamma * (Tm - 25);
    const P = p.Pnom * (p.G / 1000) * fT * (1 - (p.soil || 0)) * (1 - (p.shade || 0)) * (p.inv ?? 0.97) * (p.avail ?? 1);
    return { P: Math.max(0, P), Tm, fT };
  },
  /** Irradiancia de cielo claro aproximada (W/m²) para la hora h (0–24) */
  clearSky(h, opts = {}) {
    const rise = opts.rise ?? 6, set = opts.set ?? 18, Gmax = opts.Gmax ?? 1000;
    if (h <= rise || h >= set) return 0;
    const x = (h - rise) / (set - rise);
    return Gmax * Math.pow(Math.sin(Math.PI * x), 1.25);
  },
  /** Perfil horario de energía (kWh) y potencia pico; nubes: arreglo de factores 0..1 por hora */
  day(p, clouds = []) {
    const P = [], E = []; let tot = 0, peak = 0;
    for (let h = 0; h < 24; h++) {
      let e = 0, pk = 0;
      for (let k = 0; k < 4; k++) { const hh = h + (k + 0.5) / 4; const G = this.clearSky(hh, p) * (1 - (clouds[h] || 0)); const pw = this.power(Object.assign({}, p, { G })).P; e += pw * 0.25; pk = Math.max(pk, pw); }
      P.push(pk); E.push(e); tot += e; peak = Math.max(peak, pk);
    }
    return { P, E, total: tot, peak };
  },
};

/* =====================================================================
   Eólica
   ===================================================================== */
const WindModel = {
  curve: { cutIn: 3, rated: 12, cutOut: 25, restart: 20, Pnom: 500 },
  /** Potencia por tramos (kW). running=false si estaba en parada por cut-out (histéresis) */
  power(v, c = this.curve, running = true, rho = 1.225) {
    if (!running && v > c.restart) return 0;
    if (v < c.cutIn || v >= c.cutOut) return 0;
    if (v >= c.rated) return c.Pnom;
    const f = (v ** 3 - c.cutIn ** 3) / (c.rated ** 3 - c.cutIn ** 3);
    return c.Pnom * clamp(f * (rho / 1.225), 0, 1);
  },
  /** Extrapolación cúbica ingenua (para mostrar el error conceptual) */
  naiveCubic(v, vRef = 10, c = this.curve) { return this.power(vRef, c) * (v / vRef) ** 3; },
  /** Déficit de estela tipo Jensen a x diámetros aguas abajo */
  wakeDeficit(xD, Ct = 0.8, k = 0.075) { if (xD <= 0) return 0; return (1 - Math.sqrt(1 - Ct)) / Math.pow(1 + 2 * k * xD, 2); },
  /** Parque: turbinas [{x en D}] alineadas con el viento (de izquierda a derecha) */
  farm(v, turbines, c = this.curve) {
    const sorted = turbines.slice().sort((a, b) => a.x - b.x);
    let total = 0;
    const res = sorted.map((t, i) => {
      let def = 0;
      for (let j = 0; j < i; j++) { const dx = t.x - sorted[j].x; const dy = Math.abs((t.y || 0) - (sorted[j].y || 0)); if (dx > 0 && dy < 1.2) def = Math.sqrt(def * def + this.wakeDeficit(dx) ** 2); }
      const vt = v * (1 - def);
      const P = t.stopped ? 0 : this.power(vt, c);
      total += P;
      return Object.assign({}, t, { v: vt, deficit: def, P });
    });
    return { total, turbines: res };
  },
};

/* =====================================================================
   Batería (BESS)
   ===================================================================== */
const BESSModel = {
  make(o = {}) { return Object.assign({ cap: 1000, pmax: 250, soc: 0.6, socMin: 0.1, socMax: 0.95, etaC: 0.95, etaD: 0.95, throughput: 0, health: 1, cycleLife: 4000 }, o); },
  /**
   * Solicitud p (kW): >0 descarga, <0 carga, durante dt (h).
   * Respeta potencia y límites de SOC. Devuelve potencia efectiva entregada (+) o absorbida (−).
   */
  step(b, p, dt) {
    const cap = b.cap * b.health;
    let pe = clamp(p, -b.pmax, b.pmax);
    if (pe > 0) {
      const eAvail = Math.max(0, (b.soc - b.socMin) * cap) * b.etaD;
      pe = Math.min(pe, eAvail / dt);
      b.soc -= pe * dt / (b.etaD * cap);
    } else if (pe < 0) {
      const room = Math.max(0, (b.socMax - b.soc) * cap) / b.etaC;
      pe = -Math.min(-pe, room / dt);
      b.soc += -pe * b.etaC * dt / cap;
    }
    b.soc = clamp(b.soc, 0, 1);
    b.throughput += Math.abs(pe) * dt;
    b.health = Math.max(0.6, 1 - 0.2 * b.throughput / (b.cycleLife * 2 * b.cap));
    return pe;
  },
  energyAbove(b, socLevel) { return Math.max(0, (b.soc - socLevel) * b.cap * b.health) * b.etaD; },
};

/* =====================================================================
   Hidrógeno
   ===================================================================== */
const H2Model = {
  defaults: { SEC: 55, purifyReject: 0.35, cooling: 0, minLoad: 0.1, pmax: 300 },
  /** Agua total necesaria por kg de H2 (kg) */
  waterPerKg(o = {}) { const p = Object.assign({}, this.defaults, o); return H2_STOICH_WATER / (1 - p.purifyReject) + p.cooling; },
  /** Produce con energía E (kWh) y agua disponible (kg). Limita por ambas. */
  produce(E, waterAvail, o = {}) {
    const p = Object.assign({}, this.defaults, o);
    const byEnergy = Math.max(0, E) / p.SEC;
    const wpk = this.waterPerKg(p);
    const byWater = Math.max(0, waterAvail) / wpk;
    const m = Math.min(byEnergy, byWater);
    return { m, limitedBy: byEnergy <= byWater ? 'energía' : 'agua', water: m * wpk, waterStoich: m * H2_STOICH_WATER, energy: m * p.SEC, o2: m * H2_O2_RATIO, lhv: m * H2_LHV };
  },
  /** Verificación de atributo "verde": fracción renovable horaria y frontera */
  greenCheck(renewKWh, totalKWh, boundary = 'horaria') {
    const share = totalKWh > 0 ? renewKWh / totalKWh : 0;
    return { share, green: share >= 0.999 && boundary === 'horaria', boundary };
  },
  SAFETY: ['DETECTAR', 'AISLAR', 'DETENER', 'VENTILAR', 'VERIFICAR', 'AUTORIZAR REINICIO'],
};

/* =====================================================================
   Agroecología
   ===================================================================== */
const CROPS = {
  maiz: { name: 'Maíz', Kc: [0.3, 1.2, 0.5], ecT: 1.7, ecB: 12, boron: 2.0, sarSens: 0.5, poll: 0, kgPerM2: 0.8, icon: 'plant', col: '#ffe14d' },
  frijol: { name: 'Fríjol', Kc: [0.4, 1.15, 0.35], ecT: 1.0, ecB: 19, boron: 0.75, sarSens: 0.8, poll: 0.15, kgPerM2: 0.25, fix: true, icon: 'seed', col: '#b86f44' },
  ahuyama: { name: 'Ahuyama', Kc: [0.5, 0.95, 0.75], ecT: 4.7, ecB: 9.4, boron: 2.0, sarSens: 0.4, poll: 0.6, kgPerM2: 2.0, icon: 'plant', col: '#ff9f43' },
  tomate: { name: 'Tomate', Kc: [0.6, 1.15, 0.8], ecT: 2.5, ecB: 9.9, boron: 4.0, sarSens: 0.4, poll: 0.1, kgPerM2: 3.5, icon: 'plant', col: '#ff4e5d' },
  aji: { name: 'Ají', Kc: [0.6, 1.05, 0.9], ecT: 1.5, ecB: 14, boron: 1.5, sarSens: 0.5, poll: 0.2, kgPerM2: 1.2, icon: 'plant', col: '#d8343c' },
  sorgo: { name: 'Sorgo', Kc: [0.3, 1.05, 0.55], ecT: 6.8, ecB: 16, boron: 6.0, sarSens: 0.2, poll: 0, kgPerM2: 0.6, icon: 'plant', col: '#c97c38' },
  nopal: { name: 'Nopal', Kc: [0.25, 0.35, 0.3], ecT: 6.0, ecB: 6, boron: 4.0, sarSens: 0.2, poll: 0.3, kgPerM2: 1.5, icon: 'cactus', col: '#4ccb70', simKc: true },
};
const AgroModel = {
  etc(Kc, ET0) { return Kc * ET0; },
  gross(net, eff) { return net / clamp(eff, 0.05, 1); },
  kcAt(crop, week, weeks = 12) { const C = CROPS[crop]; const f = week / weeks; return f < 0.2 ? C.Kc[0] : f < 0.35 ? lerp(C.Kc[0], C.Kc[1], (f - 0.2) / 0.15) : f < 0.8 ? C.Kc[1] : lerp(C.Kc[1], C.Kc[2], (f - 0.8) / 0.2); },
  /** Mezcla de fuentes (balance de masa de sales y boro) */
  blend(sources) {
    let q = 0, ec = 0, b = 0, na = 0, cam = 0;
    for (const s of sources) { q += s.q; ec += s.q * s.ec; b += s.q * s.boron; na += s.q * (s.na || 0); cam += s.q * (s.cam || 0); }
    if (q <= 0) return { q: 0, ec: 0, boron: 0, sar: 0 };
    const naM = na / q, camM = cam / q;
    const sar = naM / Math.sqrt(Math.max(0.05, camM / 2));
    return { q, ec: ec / q, boron: b / q, sar, na: naM, cam: camM };
  },
  /** Reducción de rendimiento por salinidad (Maas–Hoffman) */
  saltYield(crop, ECe) { const C = CROPS[crop]; return clamp(1 - (C.ecB / 100) * Math.max(0, ECe - C.ecT), 0, 1); },
  /** Riesgo de infiltración por SAR con agua de baja EC (FAO-29, orientativo) */
  infiltrationRisk(ecw, sar) { const lim = 0.2 + sar * 0.12; return clamp((lim - ecw) / Math.max(0.2, lim), 0, 1); },
  /**
   * Semana de parcela. plot:{crop, theta(0..1), ECe, B, health, yieldPot, mulch, drainage}
   * w:{ET0 mm/d, irr mm/semana aplicados (brutos), eff, ecw, boron, sar, rain, pollinators}
   */
  week(plot, w, weekIdx, weeks = 12) {
    const C = CROPS[plot.crop];
    const Kc = this.kcAt(plot.crop, weekIdx, weeks) * (plot.mulch ? 0.85 : 1);
    const ETc = Kc * w.ET0 * 7;                         // mm/semana
    const infilt = 1 - 0.5 * this.infiltrationRisk(w.ecw, w.sar);
    const applied = w.irr * w.eff * infilt + (w.rain || 0);
    const TAW = 80;                                     // agua disponible total en zona radical (mm)
    let store = plot.theta * TAW + applied;
    const drain = Math.max(0, store - TAW) * (plot.drainage ?? 0.7);
    const pond = Math.max(0, store - TAW) - drain;
    store = Math.min(store, TAW + pond * 0.3);
    const Ks = clamp(store / (0.5 * TAW), 0, 1);        // estrés hídrico
    const ETa = Math.min(ETc * Math.max(Ks, 0.2), store);
    store = Math.max(0, store - ETa);
    plot.theta = clamp(store / TAW, 0, 1.2);
    // sales: entrada con el riego, salida con el drenaje (fracción de lavado)
    const saltIn = w.irr * w.eff * w.ecw * 0.008;
    const LF = applied > 0 ? drain / Math.max(1, applied) : 0;
    plot.ECe = clamp(plot.ECe + saltIn - plot.ECe * LF * 0.9 - (pond > 5 ? -0.05 : 0), 0.2, 20);
    plot.B = clamp(plot.B * 0.92 + w.boron * 0.08 * (w.irr > 0 ? 1 : 0), 0, 10);
    const ys = this.saltYield(plot.crop, plot.ECe);
    const yb = plot.B > C.boron ? clamp(1 - (plot.B - C.boron) * 0.25, 0.2, 1) : 1;
    const yp = 1 + (w.pollinators || 0) * C.poll * 0.4;
    const weekHealth = clamp(Math.min(Ks + 0.15, 1) * ys * yb * (pond > 15 ? 0.85 : 1), 0, 1);
    plot.health = lerp(plot.health ?? 1, weekHealth, 0.45);
    plot.visualGreen = clamp(Ks * 1.1, 0, 1);         // la planta puede verse verde con estrés salino
    plot.stress = { water: 1 - Ks, salt: 1 - ys, boron: 1 - yb, infiltration: 1 - infilt, pond };
    plot.water = (plot.water || 0) + w.irr;            // mm brutos aplicados
    plot.yieldAcc = (plot.yieldAcc || 0) + plot.health * yp / weeks;
    return { ETc, ETa, applied, drain, Ks, ys, yb, LF };
  },
  waterProductivity(yieldKg, waterM3) { return waterM3 > 0 ? yieldKg / waterM3 : 0; },
};

/* =====================================================================
   Microred: despacho horario con prioridades y tanque de agua
   ===================================================================== */
const MicrogridModel = {
  /**
   * cfg: {hours, pv[], wind[], crit[], bess:{...}, tank:{cap, level, min}, roKW, roM3perKWh, demandM3[],
   *       schedule:{ro:[0/1], irr:[0/1], h2:[0..1]}, irrKW, h2KW, rules:{reserve, h2OnlySurplus}}
   */
  run(cfg) {
    const b = BESSModel.make(cfg.bess);
    const tank = Object.assign({ cap: 2000, level: 1200, min: 400 }, cfg.tank);
    const n = cfg.hours || 24, out = [];
    let unserved = 0, unservedCrit = 0, curtailed = 0, h2kg = 0, waterDeficit = 0, socMinSeen = 1, roM3 = 0, h2KWh = 0, renewToH2 = 0;
    for (let h = 0; h < n; h++) {
      const gen = (cfg.pv[h] || 0) + (cfg.wind[h] || 0);
      const crit = cfg.crit[h] || 0;
      let ro = (cfg.schedule.ro[h] ? cfg.roKW : 0);
      if (tank.level >= tank.cap - 1) ro = 0;
      const irr = cfg.schedule.irr[h] ? (cfg.irrKW || 0) : 0;
      let h2 = (cfg.schedule.h2[h] || 0) * (cfg.h2KW || 0);
      const reserve = cfg.rules?.reserve ?? b.socMin;
      // H2 solo con excedente si la regla lo exige
      if (cfg.rules?.h2OnlySurplus) {
        let surplus = Math.max(0, gen - crit - ro - irr);
        // regla opcional: el excedente carga primero la batería hasta el objetivo de SOC
        if (cfg.rules.chargeFirst) { const room = Math.max(0, (Math.min(b.socMax, cfg.rules.socTarget ?? 0.9) - b.soc) * b.cap * b.health) / b.etaC; surplus = Math.max(0, surplus - Math.min(room, b.pmax)); }
        h2 = Math.min(h2, surplus);
      }
      let load = crit + ro + irr + h2;
      let net = gen - load; // >0 excedente
      let pb = 0;
      if (net > 0) pb = BESSModel.step(b, -net, 1);
      else {
        // descarga respetando reserva para cargas no críticas
        const needNonCrit = Math.max(0, -net - Math.max(0, crit - gen));
        const needCrit = -net - needNonCrit;
        let delivered = 0;
        const availAboveReserve = BESSModel.energyAbove(b, reserve);
        const nc = Math.min(needNonCrit, availAboveReserve);
        if (nc > 0) delivered += BESSModel.step(b, nc, 1);
        if (needCrit > 0) delivered += BESSModel.step(b, needCrit, 1);
        pb = delivered;
      }
      let balance = net + pb; // >0 sobra (vertimiento), <0 falta
      if (balance > 0.01) curtailed += balance;
      if (balance < -0.01) {
        // desprende cargas flexibles primero: H2 → riego → RO → críticas
        let deficit = -balance;
        const shed = (amt) => { const d = Math.min(deficit, amt); deficit -= d; return d; };
        const sh2 = shed(h2); h2 -= sh2;
        const sirr = shed(irr);
        const sro = shed(ro); ro -= sro;
        const scrit = shed(crit);
        unserved += sh2 + sirr + sro + scrit; unservedCrit += scrit;
      }
      if (h2 > 0) { h2KWh += h2; h2kg += h2 / H2Model.defaults.SEC; renewToH2 += h2; }
      const prodM3 = ro * (cfg.roM3perKWh || 0.33);
      roM3 += prodM3;
      tank.level = clamp(tank.level + prodM3 - (cfg.demandM3[h] || 0), 0, tank.cap);
      if (tank.level <= tank.min) waterDeficit += (tank.min - tank.level) * 0 + (tank.level <= 0 ? (cfg.demandM3[h] || 0) : 0);
      socMinSeen = Math.min(socMinSeen, b.soc);
      out.push({ h, gen, crit, ro, irr, h2, soc: b.soc, tank: tank.level, curtail: Math.max(0, balance) });
    }
    return { series: out, unserved, unservedCrit, curtailed, h2kg, h2KWh, roM3, waterDeficit, socMin: socMinSeen, socEnd: b.soc, tankEnd: tank.level, tankMin: Math.min(...out.map(o => o.tank)), bess: b };
  },
};

/* =====================================================================
   Multiobjetivo
   ===================================================================== */
const MOModel = {
  /** alts: [{name, crit:{k:valor}}], dirs: {k: 'min'|'max'} → normalizados 0..1 (1 = mejor) */
  normalize(alts, dirs) {
    const keys = Object.keys(dirs);
    const range = {};
    for (const k of keys) { const vs = alts.map(a => a.crit[k]); range[k] = [Math.min(...vs), Math.max(...vs)]; }
    return alts.map(a => { const n = {}; for (const k of keys) { const [lo, hi] = range[k]; const t = hi === lo ? 1 : (a.crit[k] - lo) / (hi - lo); n[k] = dirs[k] === 'max' ? t : 1 - t; } return Object.assign({}, a, { norm: n }); });
  },
  score(normAlt, weights) { let s = 0, wsum = 0; for (const k in weights) { s += (normAlt.norm[k] || 0) * weights[k]; wsum += weights[k]; } return wsum ? s / wsum : 0; },
  dominates(a, b, dirs) {
    let better = false;
    for (const k in dirs) {
      const av = a.crit[k], bv = b.crit[k];
      const aBetter = dirs[k] === 'max' ? av > bv : av < bv, aWorse = dirs[k] === 'max' ? av < bv : av > bv;
      if (aWorse) return false; if (aBetter) better = true;
    }
    return better;
  },
  pareto(alts, dirs) { return alts.map(a => Object.assign({}, a, { dominated: alts.some(b => b !== a && this.dominates(b, a, dirs)) })); },
};

/* =====================================================================
   Suite de validación científica (sec. 59)
   ===================================================================== */
const ValidationSuite = {
  run() {
    const R = [];
    const t = (name, ok, detail = '') => R.push({ name, ok: !!ok, detail });
    // RO
    for (const P of [45, 55, 60, 70, 80]) for (const Qf of [60, 100, 140]) {
      const r = ROModel.solve({ P, Qf });
      t(`OI P=${P} Qf=${Qf}: Qf = Qp + Qc`, Math.abs(r.Qf - r.Qp - r.Qc) < 1e-6);
      t(`OI P=${P} Qf=${Qf}: balance de sal`, Math.abs(r.saltIn - r.saltOut) / r.saltIn < 0.01, `${r.saltIn.toFixed(1)} vs ${r.saltOut.toFixed(1)} kg/h`);
      t(`OI P=${P} Qf=${Qf}: sin producción negativa`, r.Qp >= 0 && r.Qc >= 0 && r.Cp >= 0);
    }
    const nom = ROModel.solve({ P: 60, Qf: 100 });
    t('OI nominal: recuperación ≈ 42 %', Math.abs(nom.R - 0.42) < 0.04, (nom.R * 100).toFixed(1) + ' %');
    t('OI nominal: SEC en rango 2–4,5 kWh/m³', nom.SEC > 2 && nom.SEC < 4.5, nom.SEC.toFixed(2));
    t('OI: más presión → más recuperación', ROModel.solve({ P: 70 }).R > nom.R);
    t('OI: más recuperación → concentrado más salino', ROModel.solve({ P: 70 }).Cc > nom.Cc);
    t('OI: sin presión suficiente no hay permeado', ROModel.solve({ P: 25 }).Qp === 0);
    t('OI: sin ERD el SEC aumenta', ROModel.solve({ etaERD: 0 }).SEC > nom.SEC);
    // Salmuera
    const pl = new BrinePlume(32, 20, 25);
    for (let i = 0; i < 200; i++) { pl.inject(16, 2, 1000, 2); pl.step(0.25); }
    t('Pluma: conservación de masa (descargada = dentro + exportada)', pl.balanceError() < 1e-3, (pl.balanceError() * 100).toFixed(4) + ' %');
    t('Pluma: concentración no negativa', Array.from(pl.s).every(v => v >= 0));
    // FV
    const pv = PVModel.power({ Pnom: 600, G: 1000, Ta: 25, noct: 20 });
    t('FV: STC sin pérdidas ≈ nominal·η_inv', Math.abs(pv.P - 600 * 0.97) < 1);
    t('FV: la suciedad reduce potencia', PVModel.power({ Pnom: 600, G: 900, soil: 0.2 }).P < PVModel.power({ Pnom: 600, G: 900 }).P);
    t('FV: de noche no produce', PVModel.day({ Pnom: 600 }).E[2] === 0);
    // Eólica
    const C = WindModel.curve;
    t('Eólica: bajo cut-in = 0', WindModel.power(2.5) === 0);
    t('Eólica: sobre nominal = Pnom', WindModel.power(18) === C.Pnom);
    t('Eólica: sobre cut-out = 0', WindModel.power(26) === 0);
    t('Eólica: la extrapolación v³ supera la curva real a 20 m/s', WindModel.naiveCubic(20) > WindModel.power(20));
    t('Eólica: estela reduce viento aguas abajo', WindModel.farm(10, [{ x: 0 }, { x: 3 }]).turbines[1].v < 10);
    // BESS
    const b = BESSModel.make({ soc: 0.5 });
    let okSoc = true, okPow = true;
    for (let i = 0; i < 100; i++) { const pe = BESSModel.step(b, (i % 7 < 3 ? 400 : -400), 1); if (b.soc < b.socMin - 1e-9 || b.soc > b.socMax + 1e-9) okSoc = false; if (Math.abs(pe) > b.pmax + 1e-9) okPow = false; }
    t('BESS: SOCmin ≤ SOC ≤ SOCmax', okSoc); t('BESS: potencia dentro de límites', okPow);
    const b2 = BESSModel.make({ soc: 0.5, socMin: 0, socMax: 1 }); BESSModel.step(b2, -100, 1);
    t('BESS: ida y vuelta pierde energía (100 kWh cargados → < 100 kWh recuperables)', BESSModel.energyAbove(b2, 0.5) < 100, BESSModel.energyAbove(b2, 0.5).toFixed(1) + ' kWh');
    // H2
    const h = H2Model.produce(5500, 1e9);
    t('H2: limitado por energía', Math.abs(h.m - 100) < 1e-6 && h.limitedBy === 'energía');
    const hw = H2Model.produce(1e9, 2000);
    t('H2: limitado por agua', hw.limitedBy === 'agua' && hw.water <= 2000 + 1e-6);
    t('H2: agua ≥ estequiométrica (≈ 8,94 kg/kg)', H2Model.waterPerKg() >= H2_STOICH_WATER);
    t('H2: con electricidad fósil no es verde', !H2Model.greenCheck(0, 100).green);
    // Agro
    t('Agro: ETc = Kc·ET0', Math.abs(AgroModel.etc(1.15, 6) - 6.9) < 1e-9);
    t('Agro: riego bruto ≥ neto', AgroModel.gross(7, 0.85) >= 7);
    const mix = AgroModel.blend([{ q: 1, ec: 0.05, boron: 1.2 }, { q: 1, ec: 3.0, boron: 0.2 }]);
    t('Agro: mezcla conserva sales (EC media ponderada)', Math.abs(mix.ec - 1.525) < 1e-9);
    t('Agro: Maas–Hoffman fríjol a ECe 3 → 62 %', Math.abs(AgroModel.saltYield('frijol', 3) - 0.62) < 1e-9);
    // Microred
    const mgCfg = (h2) => ({ hours: 24, pv: Array.from({ length: 24 }, (_, i) => PVModel.clearSky(i + 0.5) * 0.6), wind: Array(24).fill(80), crit: Array(24).fill(120), bess: { soc: 0.5 }, tank: { cap: 2000, level: 1000, min: 300 }, roKW: 200, roM3perKWh: 0.33, demandM3: Array(24).fill(40), schedule: { ro: Array(24).fill(1), irr: Array(24).fill(0), h2: Array(24).fill(h2) }, irrKW: 0, h2KW: 150, rules: { reserve: 0.3, h2OnlySurplus: true } });
    const mg = MicrogridModel.run(mgCfg(1)), mg0 = MicrogridModel.run(mgCfg(0));
    t('Microred: SOC dentro de límites', mg.series.every(s => s.soc >= 0.1 - 1e-6 && s.soc <= 0.95 + 1e-6));
    t('Microred: con regla de excedente el H2 no agrava el déficit crítico', mg.unservedCrit <= mg0.unservedCrit * 1.001 + 1e-6, mg.unservedCrit.toFixed(1) + ' vs ' + mg0.unservedCrit.toFixed(1) + ' kWh');
    t('Microred: balance de energía (generación ≥ consumo servido − aporte neto BESS)', mg.series.every(s => s.gen + 1e-6 >= 0));
    t('Microred: el tanque no excede capacidad ni es negativo', mg.series.every(s => s.tank >= 0 && s.tank <= 2000));
    // Multiobjetivo
    const dirs = { costo: 'min', agua: 'max' };
    const alts = [{ name: 'A', crit: { costo: 10, agua: 5 } }, { name: 'B', crit: { costo: 8, agua: 7 } }, { name: 'C', crit: { costo: 6, agua: 4 } }];
    const par = MOModel.pareto(alts, dirs);
    t('Multiobjetivo: A está dominada por B', par[0].dominated && !par[1].dominated && !par[2].dominated);
    return R;
  },
};
if (typeof module !== 'undefined') module.exports = { ROModel, BrinePlume, PVModel, WindModel, BESSModel, H2Model, AgroModel, MicrogridModel, MOModel, IntakeModel, ValidationSuite, CROPS, H2_STOICH_WATER };
