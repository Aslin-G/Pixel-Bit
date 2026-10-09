#!/usr/bin/env node
/* Captura del canvas: node tools/shot.js "test=sprites&char=amaya" out.png [scale] [waitMs] [keys...] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
(async () => {
  const query = process.argv[2] || '';
  const out = process.argv[3] || 'shot.png';
  const scale = parseFloat(process.argv[4] || '2');
  const wait = parseInt(process.argv[5] || '600');
  const keys = process.argv.slice(6);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 640 * scale, height: 360 * scale } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  const file = 'file://' + path.join(__dirname, '..', 'index.html') + (query ? '?' + query : '');
  await page.goto(file);
  await page.waitForTimeout(wait);
  for (const k of keys) {
    if (k.startsWith('wait:')) { await page.waitForTimeout(parseInt(k.slice(5))); continue; }
    if (k.startsWith('click:')) { const [x, y] = k.slice(6).split(',').map(Number); await page.mouse.click(x * scale, y * scale); await page.waitForTimeout(120); continue; }
    if (k.startsWith('hold:')) { const [key, ms] = k.slice(5).split(','); await page.keyboard.down(key); await page.waitForTimeout(parseInt(ms)); await page.keyboard.up(key); continue; }
    if (k.startsWith('log:')) { const v = await page.evaluate(k.slice(4)); console.log('LOG', JSON.stringify(v)); continue; }
    if (k.startsWith('eval:')) { await page.evaluate(k.slice(5)); await page.waitForTimeout(60); continue; }
    await page.keyboard.press(k); await page.waitForTimeout(140);
  }
  const canvas = await page.$('#game');
  await canvas.screenshot({ path: out });
  if (errors.length) console.log(errors.join('\n')); else console.log('OK sin errores de consola');
  await browser.close();
})();
