/* Ejecuta la suite de validación científica en Node: node tests/models.test.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
const src = ['00_core.js', '20_models.js'].map(f => fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8')).join('\n');
const ctx = { console, Math, module: undefined };
vm.createContext(ctx);
vm.runInContext(src + '\n;this.__R = ValidationSuite.run(); this.__RO = ROModel.solve({});', ctx);
let fail = 0;
for (const r of ctx.__R) { if (!r.ok) { fail++; console.log('✗', r.name, r.detail); } }
const nom = ctx.__RO;
console.log(`OI nominal: R=${(nom.R * 100).toFixed(1)}% Qp=${nom.Qp.toFixed(1)} Cc=${nom.Cc.toFixed(1)} Cp=${nom.Cp.toFixed(3)} SEC=${nom.SEC.toFixed(2)} kWh/m³ NDP=${nom.NDP.toFixed(1)}`);
console.log(`${ctx.__R.length - fail}/${ctx.__R.length} pruebas científicas superadas`);
process.exit(fail ? 1 : 0);
