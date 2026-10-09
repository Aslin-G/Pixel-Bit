#!/usr/bin/env node
/* Prueba de humo en navegador: node tools/smoke.js
   Carga el título, el mapa, cada nivel (inicio, centro y final), cada fase de cada
   simulador y las escenas de cierre, ejecutando unos cuadros y registrando cualquier
   error o advertencia de consola. Requiere Playwright (Chromium). */
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const FILE = 'file://' + path.join(__dirname, '..', 'aridia_nexus.html');
const LEVEL_W = { 0: 2600, 1: 2600, 2: 2600, 3: 2600, 4: 2800, 5: 3000, 6: 2600, 7: 2700, 8: 2800, 9: 2400, 10: 3400, 11: 1500 };
const SIMS = { 0: 'NexusSim', 1: 'Sim01', 2: 'Sim02', 3: 'Sim03', 4: 'Sim04', 5: 'Sim05', 6: 'Sim06', 7: 'Sim07', 8: 'Sim08', 9: 'Sim09', 10: 'Sim10' };
const PHASES = ['demo', 'guided', 'auto', 'transfer', 'free'];
const SCENES = ['TitleScene', 'IntroScene', 'CreditsScene', 'PostCreditsScene', 'CodexScene', 'EvidenceScene', 'AnalyticsScene', 'TeacherScene', 'PracticeScene', 'SettingsScene', 'ChainScene', 'PriorityScene', 'ObjectiveScene'];
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
  let errors = [], current = '';
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(current + ' → ' + m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errors.push(current + ' → pageerror: ' + e.message));
  const visit = async (label, query, ms = 700, after) => {
    current = label;
    await page.goto(FILE + (query ? '?' + query : ''));
    await page.waitForTimeout(ms);
    if (after) { try { await page.evaluate(after); await page.waitForTimeout(400); } catch (e) { errors.push(label + ' → eval: ' + e.message); } }
    process.stdout.write('.');
  };
  await visit('título', '', 900);
  await visit('mapa', 'test=map', 700);
  for (const [lv, w] of Object.entries(LEVEL_W)) for (const px of [80, Math.round(w / 2), w - 80]) await visit('nivel ' + lv + ' x=' + px, 'test=level&lv=' + lv + '&nocard=1&px=' + px, 650, 'GameplayScene.lens = true');
  for (const [lv, s] of Object.entries(SIMS)) for (const ph of PHASES) await visit(s + ' ' + ph, 'test=sim&lv=' + lv + '&s=' + s + '&phase=' + ph, 900, 'const t = Game.top(); if (t.runNow) t.runNow(); else if (t.evaluate && !t.verdict) { try { t.evaluate(); } catch (e) { } }');
  for (const sc of SCENES) await visit(sc, 'test=scene&s=' + sc, 700);
  for (const e of ['mosaico', 'pacto', 'tecnica', 'deuda']) await visit('final ' + e, 'test=scene&s=EndingScene&p=' + encodeURIComponent(JSON.stringify({ ending: e })), 700);
  for (const c of ['toma', 'membranas', 'salmuera', 'energia', 'h2', 'agro']) await visit('tarjeta ' + c, 'test=level&lv=10&nocard=1&px=600', 600, 'void GameplayScene.open(CrisisCardScene, { card: CAL_CARDS.' + c + ', id: "' + c + '" })');
  await browser.close();
  console.log('');
  const uniq = [...new Set(errors)];
  if (uniq.length) { console.log(uniq.length + ' problemas:'); for (const e of uniq) console.log('  ' + e); process.exit(1); }
  console.log('Humo OK: título, mapa, 12 niveles × 3 posiciones, 11 simuladores × 5 fases, escenas, finales y tarjetas sin errores.');
})();
