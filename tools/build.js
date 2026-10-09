#!/usr/bin/env node
/* Construye index.html (el juego autocontenido): concatena src/*.js (orden alfabético) dentro de src/template.html */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'src');
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.js')).sort();
let js = '';
for (const f of files) js += `\n/* ===== ${f} ===== */\n` + fs.readFileSync(path.join(srcDir, f), 'utf8');
const tpl = fs.readFileSync(path.join(srcDir, 'template.html'), 'utf8');
const css = fs.readFileSync(path.join(srcDir, 'style.css'), 'utf8');
const out = tpl.replace('/*__CSS__*/', () => css).replace('/*__JS__*/', () => js.replace(/<\/script/gi, '<\\/script'));
fs.writeFileSync(path.join(root, 'index.html'), out);
console.log(`index.html: ${files.length} módulos, ${(out.length / 1024).toFixed(0)} KB`);
