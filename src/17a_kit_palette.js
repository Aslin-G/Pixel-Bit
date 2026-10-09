/* =====================================================================
   17a_kit_palette.js — Paleta oficial del rediseño (STYLE LOCK §4).
   Rampas medidas sobre docs/art/referencia_visual.jpg, de oscuro a claro.
   Sufijo R para no chocar con las rampas antiguas. Utilidades de color
   sin tramado Bayer: bandas suaves con borde de ruido, desplazamiento de
   tono hacia un objetivo, interpolación de rampas y bruma atmosférica.
   ===================================================================== */
Object.assign(RAMP, {
  // --- cielo y atmósfera ---
  skyR: ['#1478e6', '#2186eb', '#3490f4', '#3c9dfa', '#53a9f8', '#7fbcf2', '#a3caf5', '#c0d0ee'],
  skyHorizonR: ['#ae9fb9', '#c5a9b9', '#d3c0cc'],
  cloudR: ['#788ec6', '#9fb6ee', '#b8c5f1', '#cdd2ee', '#e0e7f8', '#f0eef1', '#fcf6d0'],
  cirrusR: ['#a4b6ed', '#c2d2f3', '#e2e9f7'],
  sunR: ['#7991d7', '#a29ec4', '#baaab7', '#d6b5a7', '#f4d8a1', '#fdfacd'],
  hazeR: ['#756886', '#8e7daa', '#9090ba', '#c797a9', '#baa4bc', '#cbd4ee'],
  mountFarR: ['#6f6a94', '#8c7fa6', '#9884ab', '#b39aae', '#d29a8c', '#e3a289'],
  mountMidR: ['#2f3a58', '#435573', '#6b5866', '#7f5d57', '#aa7359', '#cf8c63', '#e7ac78', '#f2c79a'],
  hillWarmR: ['#5f473c', '#8d6057', '#ab7766', '#e69e69', '#edc093'],
  // --- agua ---
  seaFarR: ['#0a6fb8', '#0189d4', '#0199e1', '#1ea4e9', '#39b0e8', '#7cc8f0'],
  oceanR: ['#05467e', '#057ec7', '#0692d5', '#38bbea', '#99dbef', '#e6f8fc'],
  shallowR: ['#064777', '#0a71a3', '#11bedd', '#3adcf1', '#7cdfec', '#bde3ed'],
  seaSurfR: ['#00568a', '#0182ae', '#027bbe', '#27cee1', '#27e2e8', '#c0ebf7', '#ffffff'],
  foamR: ['#1085a9', '#18b5cc', '#22dbe7', '#7cdfec', '#d2ecee', '#ffffff'],
  underR: ['#041939', '#072e51', '#065481', '#0879a4', '#0c97b6', '#08bcd6', '#07dde6', '#c2f2fb'],
  coralTealR: ['#024339', '#187d71', '#4a9c8b', '#1daf9b', '#8fc9d3'],
  coralVioR: ['#06032f', '#191057', '#3f2e79', '#7a58ac', '#b49cdc'],
  coralWarmR: ['#6a2a10', '#c05a20', '#e89a3a', '#f6d060'],
  fishR: ['#1d3a4a', '#497c8a', '#8ca18b', '#d2dbb7', '#f4f2dc'],
  fishFinR: ['#a07a10', '#e8c040', '#f8e080'],
  waterfallR: ['#4a7a94', '#73a8c4', '#9cc9df', '#bedfed', '#e5f2f3', '#ffffff'],
  // --- terreno y vegetación ---
  rockR: ['#3e0c03', '#602212', '#813417', '#a24a1f', '#d07530', '#efa04b', '#fbc371'],
  rockWarmR: ['#2a0c04', '#431509', '#5e2210', '#752f15', '#a55320', '#c8732e', '#e29441', '#f7c679', '#fde3a8'],
  sandR: ['#67430f', '#96592b', '#c58440', '#edaf5f', '#fccf85', '#f9da99'],
  grassR: ['#2a3a0c', '#3b5312', '#597611', '#7b981a', '#9cb42c', '#bfd52c', '#efd83f'],
  foliageR: ['#111908', '#232a0c', '#3b5320', '#617517', '#91a229', '#c1cd3d', '#d0d980', '#ece355'],
  treeR: ['#1f3a26', '#37542e', '#596c39', '#8a9e4a', '#c8d56c'],
  palmR: ['#242606', '#45450e', '#757528', '#a9943e', '#ccc94a', '#eddc8a'],
  palmTrunkR: ['#191e05', '#3c3210', '#6b5020', '#a57432', '#d09a4a', '#ebbe64'],
  fgLeafR: ['#080818', '#0e243a', '#194560', '#2f6f7a'],
  fgVioR: ['#1a0f33', '#2e1d53', '#433c7b', '#6b3d92', '#9a6ad0'],
  flowerR: ['#71180a', '#bd271e', '#e94a64', '#f47a90'],
  flowerCtrR: ['#dc7f30', '#fcc47e'],
  lupineR: ['#1d0a23', '#311f57', '#653693', '#9a6ad8', '#c9a8f0'],
  bougainR: ['#6a1450', '#c02a8a', '#f060b8'],
  woodR: ['#100100', '#370b00', '#4e2519', '#5a2d21', '#8e542f', '#cb9772'],
  cropSoilR: ['#5a431c', '#86502d', '#cb824a'],
  terraceWallR: ['#82494a', '#e1956c', '#f8c888'],
  // --- construido y tecnología ---
  concreteR: ['#443930', '#6e625b', '#7b7679', '#ac9b82', '#cebaac', '#f5e5c3'],
  steelWR: ['#4f4d51', '#716f76', '#948e91', '#b5aba8', '#d3ccc5', '#f2efea'],
  steelRefR: ['#141820', '#21242d', '#3a3d48', '#5a5961', '#8f8f95', '#b5c4c8', '#c7dfdd', '#f4fbff'],
  steelBandR: ['#163e66', '#245f90', '#31b4e2'],
  membraneR: ['#092647', '#31506f', '#427ca5', '#1da9e7', '#74c6de', '#b6e9f7'],
  permeateR: ['#0c2e4a', '#217b9c', '#22c1e7', '#71dfef', '#abfafd'],
  brinePipeR: ['#080e26', '#212846', '#3a405d', '#555a78', '#787a9b'],
  brineR: ['#4d1858', '#822f7e', '#c244a2', '#e07ecf', '#f4bef5'],
  h2GreenR: ['#2a5e4a', '#538772', '#2f9e62', '#4cd48e', '#80ecc2', '#c7ecd1'],
  h2WhiteR: ['#4b5b4a', '#727c63', '#8b878b', '#c0bfb1', '#ebeee4'],
  pvR: ['#1e2a55', '#344675', '#35528f', '#4f6391', '#6a7aa4', '#8b9cc2', '#b7c7e7'],
  domeStoneR: ['#6d5c51', '#a6806a', '#bca494', '#e8b27d', '#f2d5bb'],
  domeGlassR: ['#597b8c', '#6fc8cc', '#9be4e6', '#c2d5ef'],
  turbineR: ['#7a84a0', '#a0a8c0', '#d8dde8', '#f4f6fb'],
  // --- personajes (STYLE LOCK §10; docs/art/analisis/02_personajes.md §3) ---
  hairAm: ['#1c0503', '#3a0d06', '#5f1a0b', '#842d12', '#a8461d', '#c9652c', '#e88c4a'],
  skinAm: ['#4a160e', '#8a3a24', '#b85a3a', '#e07f58', '#f9a879', '#ffc69c', '#ffe2c8'],
  jacketAm: ['#240503', '#4e0d06', '#7d1a0c', '#ad2814', '#de3f22', '#ff6a3a', '#ffa070'],
  topAm: ['#3a2a30', '#7a6a70', '#b4a8a8', '#ddd2cc', '#f2ece4', '#ffffff'],
  packSteel: ['#0c1a26', '#18334a', '#245066', '#3f6c80', '#6a8e9c', '#9ab4be', '#cfe0e6'],
  leatherAm: ['#1e0a04', '#3e1a0c', '#5c3016', '#7e4a22', '#a06a34', '#c48e50', '#e0b478'],
  shortsAm: ['#1e1a18', '#3a3430', '#5e5650', '#857c70', '#aca08c', '#cfc4ac', '#ece4d0'],
  leggingsAm: ['#120808', '#24120e', '#3a201a', '#54301f', '#704428', '#8c5a36'],
  bootsAm: ['#160604', '#360f06', '#5a1c0a', '#7f2e12', '#a4461e', '#c8642e', '#e48a4a'],
  gogFrame: ['#0e0a14', '#22131f', '#3a3446', '#4a4f5d', '#7a8290', '#a3acb0', '#d8dee2'],
  gogLens: ['#06202e', '#0c3e5c', '#16608a', '#1f86b8', '#2aa9e3', '#7fd8f6', '#e6fdff'],
  kiruShell: ['#0a0c16', '#2c3344', '#4c596b', '#6e7587', '#a9b1ba', '#c7d8e1', '#ebf1f3', '#ffffff'],
  kiruVisor: ['#000c2a', '#050e2f', '#061b4d', '#0e4171', '#7a8cb0'],
  kiruEye: ['#0e406e', '#2480a3', '#17f3f7', '#5ee1ef', '#9ff6f8', '#e6fdff'],
  kiruEarOuter: ['#363c4d', '#875b23', '#dc8a1f', '#fa8c01', '#eed546'],
  kiruEarInner: ['#0e406e', '#29cae1', '#5ee1ef', '#a8fffd'],
  kiruTurq: ['#0b4a44', '#16948a', '#20c0ae', '#4ce8cc'],
  kiruOrange: ['#7a3a08', '#dc8a1f', '#ff8e34', '#ffc070'],
  // --- UI (ver STYLE LOCK §11) ---
  uiFillR: ['#000633', '#041533', '#072248', '#0a2957'],
  uiRimR: ['#12305a', '#3a64b0', '#6d9be8', '#a8c8ff', '#e8f6ff'],
});
const PAL_REF = {
  outlineAm: '#1a0604', outlineKiru: '#070813', blush: '#ff8a6a', hairTie: '#e6b422',
  glowPermeate: '#48b6ec', glowH2: '#4cd48e', glowBrine: '#e07ecf', glowKiru: '#17f3f7',
  haze: '#9a95b8', fgCool: '#0e243a', rimWarm: '#fbc371', crack: '#3e0c03',
  label: { water: { fill: '#030a24', border: '#89e7fc', glow: '#2e97b1', text: '#f9fbff' },
           green: { fill: '#145734', border: '#77ce8d', glow: '#538b52', text: '#f9fbff' },
           brine: { fill: '#0a042f', border: '#b79ace', glow: '#6a496b', text: '#f9fbff' } },
};

/** Desplaza el tono de un color hacia hueTarget (grados) mientras lo oscurece/aclara amt (−1..1). */
function shadeTo(hex, amt, hueTarget = null, satBoost = 0) {
  const [h, s, l] = rgbToHsl(...hexToRgb(hex));
  let nh = h;
  if (hueTarget !== null) { let d = ((hueTarget - h + 540) % 360) - 180; nh = (h + d * Math.min(1, Math.abs(amt) * 0.6) + 360) % 360; }
  return hslToHex(nh, clamp(s + satBoost, 0, 1), clamp(l + amt * (amt < 0 ? l : 1 - l), 0, 1));
}
/** Interpola dos rampas de igual longitud (p. ej. follaje sano → estresado) */
function rampLerp(a, b, t) { const n = Math.min(a.length, b.length); const out = []; for (let i = 0; i < n; i++) out.push(mixHex(a[i], b[i], t)); return out; }
/** Mezcla atmosférica que conserva relaciones de valor: S×(1−k)^1,3, L+0,1k, tono hacia la bruma */
const _hazeCache = new Map();
function hazeColor(hex, k, haze = PAL_REF.haze) {
  const key = hex + '|' + k.toFixed(3) + '|' + haze; let v = _hazeCache.get(key); if (v) return v;
  const [h, s, l] = rgbToHsl(...hexToRgb(hex)), [hh, hs, hl] = rgbToHsl(...hexToRgb(haze));
  let d = ((hh - h + 540) % 360) - 180;
  const nl = l + (hl - l) * k * 0.55 + 0.1 * k * (1 - l);
  v = hslToHex((h + d * k + 360) % 360, clamp(s * Math.pow(1 - k, 1.3) + hs * k * 0.8, 0, 1), clamp(nl, 0, 1));
  _hazeCache.set(key, v); return v;
}
function hazeRampR(ramp, k, haze) { return ramp.map(c => hazeColor(c, k, haze)); }
/**
 * Banda suave sin Bayer: elige un tono de la rampa con t (0..1) desplazando el borde
 * de cada banda con ruido en clusters de 2–3 px (STYLE LOCK §3.6 del análisis).
 */
function smoothBand(ramp, t, x, y, jitter = 0.06) {
  const n = ramp.length - 1;
  const j = (hash2((x / 3) | 0, (y / 2) | 0) - 0.5) * jitter * 2;
  return ramp[clamp(Math.round((t + j) * n), 0, n)];
}
