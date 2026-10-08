/* Valida el banco SOLO y los extras: node tests/bank.test.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
const files = ['00_core.js', '21_learning.js', '22a_questions.js', '22b_questions.js', '22c_questions.js', '22d_extras.js', '22e_finalize.js'];
const src = files.map(f => fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8')).join('\n');
const ctx = { console, Math, Date };
vm.createContext(ctx);
vm.runInContext(src + '\n;this.Q = QBANK; this.C = CONTEXTS; this.D = DIAGNOSTICS; this.K = CALCS; this.DS = DESIGN_TASKS; this.DB = DEBATES; this.CH = CHALLENGES; this.RNG = RNG;', ctx);
const errs = [];
const Q = ctx.Q;
if (Q.length !== 135) errs.push('ítems = ' + Q.length + ' (esperado 135)');
const ids = new Set();
const keys = [0, 0, 0, 0];
const fields = ['id', 'learningOutcome', 'contextId', 'soloLevel', 'competency', 'claim', 'evidence', 'task', 'stem', 'options', 'key', 'keyRationale', 'distractorRationales', 'misconception', 'source', 'isSimulatedData', 'retryVariant', 'gameTrigger', 'difficulty', 'estimatedTime'];
for (const q of Q) {
  if (ids.has(q.id)) errs.push('id duplicado ' + q.id); ids.add(q.id);
  if (!Array.isArray(q.options) || q.options.length !== 4) errs.push(q.id + ': opciones ≠ 4');
  if (!(q.key >= 0 && q.key < 4)) errs.push(q.id + ': clave inválida');
  if (!q.dist || q.dist.length !== 4) errs.push(q.id + ': racionales ≠ 4');
  else q.dist.forEach((d, i) => { if (i !== q.key && !d) errs.push(q.id + ': falta racional de distractor ' + i); });
  if (!q.why) errs.push(q.id + ': sin justificación');
  if (!q.mis) errs.push(q.id + ': sin concepción errónea');
  q.learningOutcome = q.ra; q.contextId = q.ctx; q.soloLevel = q.solo;
  for (const f of fields) if (!(f in q)) errs.push(q.id + ': falta metadato ' + f);
  if (q.retry && (q.retry.options.length !== 4 || !(q.retry.key >= 0 && q.retry.key < 4))) errs.push(q.id + ': variante inválida');
  keys[q.key]++;
}
// 9 RA × 3 contextos × 5 niveles
for (let r = 1; r <= 9; r++) for (let c = 1; c <= 3; c++) {
  const id = 'RA-0' + r + '-C' + c;
  if (!ctx.C[id]) errs.push('falta contexto ' + id);
  const levels = Q.filter(q => q.ctx === id).map(q => q.solo).sort().join('');
  if (levels !== '12345') errs.push(id + ': niveles SOLO ' + levels);
}
// longitudes semejantes: la clave no debe ser sistemáticamente la más larga
let keyLongest = 0, lenCue = [];
for (const q of Q) {
  const L = q.options.map(o => o.length); if (L[q.key] === Math.max(...L) && L.filter(l => l === L[q.key]).length === 1) keyLongest++;
  const avg = L.filter((_, i) => i !== q.key).reduce((a, b) => a + b, 0) / 3;
  if (L[q.key] / avg > 1.35) lenCue.push(q.id + ' (' + (L[q.key] / avg).toFixed(2) + ')');
}
if (lenCue.length) errs.push('clave notablemente más larga (pista por longitud): ' + lenCue.join(', '));
if (keyLongest > Q.length * 0.4) errs.push('la clave es la opción más larga en ' + keyLongest + ' ítems (> 40 %)');
// claves balanceadas
const maxK = Math.max(...keys), minK = Math.min(...keys);
if (maxK - minK > 12) errs.push('claves desbalanceadas ' + keys.join('/'));
// extras
if (ctx.D.length < 20) errs.push('diagnósticos < 20');
if (ctx.K.length < 15) errs.push('cálculos < 15');
if (ctx.DS.length < 15) errs.push('tareas de diseño < 15');
if (ctx.DB.length < 10) errs.push('debates < 10');
if (ctx.CH.length < 45) errs.push('retos manipulativos < 45 (' + ctx.CH.length + ')');
for (const k of ctx.K) { for (let s = 1; s < 20; s++) { const p = k.gen(ctx.RNG(s)); if (!isFinite(p.ans)) errs.push(k.id + ' genera NaN'); } }
console.log('Ítems: ' + Q.length + ' · claves A/B/C/D = ' + keys.join('/') + ' · clave = opción más larga en ' + keyLongest + ' ítems');
console.log('Diagnósticos ' + ctx.D.length + ' · Cálculos ' + ctx.K.length + ' · Diseño ' + ctx.DS.length + ' · Debates ' + ctx.DB.length + ' · Retos manipulativos ' + ctx.CH.length);
if (errs.length) { console.log(errs.slice(0, 40).join('\n')); process.exit(1); }
console.log('Banco válido');
