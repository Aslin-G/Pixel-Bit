/* Verifica el diseño del modelo integrado de la Gran Calima: node tests/calima.test.js
   - la cuarta opción completa es robusta en P10, P50 y P90;
   - quitar cualquiera de sus piezas falla al menos en un escenario;
   - el plan de MIRAGE (máximo H2) falla en el escenario central;
   - la transferencia nocturna exige adaptar la regla (menos trenes o más reserva). */
const fs = require('fs'), path = require('path'), vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '..', 'src', '4a_lv10.js'), 'utf8');
const block = src.slice(src.indexOf('const CalimaModel = {'), src.indexOf('const CAL_CRIT = ['));
const ctx = { Math };
vm.createContext(ctx);
vm.runInContext('const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);\n' + block + '\nthis.CM = CalimaModel;', ctx);
const CM = ctx.CM;
const good = { protect: true, turbRule: true, brineHold: true, h2: 'flex', h2Safe: true, irr: 'critical', nonEss: 0.5, reserve: 0.3, staged: true, trains: 3, data: true };
const mirage = { protect: false, turbRule: false, brineHold: false, h2: 'full', h2Safe: false, irr: 'all', nonEss: 1, reserve: 0.1, staged: false, trains: 3, data: false };
const robust = (pol) => ['p10', 'p50', 'p90'].every(s => CM.run(pol, s).ok);
const checks = [];
const check = (name, ok) => checks.push([name, !!ok]);
check('cuarta opción robusta (P10/P50/P90)', robust(good));
check('plan MIRAGE falla en P50', !CM.run(mirage, 'p50').ok);
const pieces = { protect: { protect: false }, turbRule: { turbRule: false }, brineHold: { brineHold: false }, h2: { h2: 'full', h2Safe: false }, irr: { irr: 'all' }, nonEss: { nonEss: 1 }, reserve: { reserve: 0.1 }, staged: { staged: false }, trains: { trains: 2 }, data: { data: false } };
for (const [k, v] of Object.entries(pieces)) check('sin "' + k + '" deja de ser robusta', !robust(Object.assign({}, good, v)));
check('H2 máximo sin parada segura viola el criterio H2', !CM.run(Object.assign({}, good, { h2: 'full', h2Safe: false }), 'p50').crit.h2);
check('noche: la regla diurna no basta', !CM.run(good, 'night').ok);
check('noche: con 2 trenes funciona', CM.run(Object.assign({}, good, { trains: 2 }), 'night').ok);
check('noche: con reserva 40 % funciona', CM.run(Object.assign({}, good, { reserve: 0.4 }), 'night').ok);
const r = CM.run(good, 'p50');
check('balance de salmuera ≈ 1,38 × permeado', r.series.every(s => s.prod === 0 || Math.abs(s.prod * 1.38 - (s.prod * CM.BRINE)) < 1e-9));
check('el tanque nunca supera su capacidad', r.series.every(s => s.tank <= CM.TANK_CAP + 1e-9));
check('SOC siempre entre 0 y 1', ['p10', 'p50', 'p90', 'night'].every(s => CM.run(good, s).series.every(q => q.soc >= 0 && q.soc <= 1)));
let fail = 0;
for (const [n, ok] of checks) { if (!ok) { fail++; console.log('✗', n); } }
console.log(`${checks.length - fail}/${checks.length} comprobaciones del modelo de la Calima superadas`);
process.exit(fail ? 1 : 0);
