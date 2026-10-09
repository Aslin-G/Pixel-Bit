# Reference style lock for ARIDIA NEXUS (640×360, procedural)

**Source:** `/home/user/Pixel-Bit/docs/art/referencia_visual.jpg` (1125×633 JPEG).
**Coordinate convention:** `ref(x,y)` is a reference pixel and `g(x,y)` is a game pixel at 640×360. g = ref × 0.5689.
**Scratch output:** crops, zooms and sampling scripts are in `/tmp/claude-0/-home-user-Pixel-Bit/3de6e308-5c98-5496-b62a-c6dd2f26bdb0/scratchpad/art_analysis/`. Crops are `c_*.png`, zooms with rulers are `z_*.png`, grid quadrants are `gA`–`gD.png`, and screenshots of the current game are `cur_lv1.png` and `cur_lv2.png`. Nothing in the repo was modified.
**How colours were sampled:** k-means on tight boxes, plus point medians and per-row profiles. The JPEG is chroma-subsampled, so thin text colours wash out; those few values are marked "(visual)".

---

## 0. Key measured facts

**Native art grid**
- The neighbour-difference ratio d1/d2 is 0.62–0.70 in every region tested (Amaya, KIRU, cliff, plant, HUD). The effective art pixel is therefore about 1.7–2.0 reference pixels, which puts the reference's native grid at roughly 560–660 × 316–370.
- So **at 640×360, 1 art pixel = 1 game pixel**. The reference's detail fits 1:1. Never draw at 2× pixel size, and never mix pixel scales.

**Reference scene vs the current game**

| Metric | Reference | Current lv1 | Current lv2 |
|---|---|---|---|
| Mean saturation | 0.52 | 0.57 | 0.37 |
| p90 saturation | 0.96 | 0.82 | 0.73 |
| Mean value (V) | 0.66 | 0.81 (too bright/washed) | — |
| Luminance p5 / p95 | 0.07 / 0.89 | 0.13 / 0.95 (no deep darks) | — |
| Pixels with a neighbour step > 48 lum (both at 640 scale) | 0.232 | 0.090 | 0.180 |
| Colours (4-bit bins) covering 90% of pixels | 895 (inflated by JPEG noise) | 41 | 30 |
| Average horizontal run of the same colour | 1.5 px | 3.0 px | 3.1 px |

**Targets for the procedural engine**
- At least 150–250 distinct colours per frame.
- Average horizontal run of 2.0 px or less.
- Strong-edge density of at least 0.20.
- Mean V about 0.62–0.68.
- p5 luminance of 0.08 or less (deep darks must exist).

**Sprite scale**
- Current Amaya is about 67 px tall (`cur_chars.png`); the reference Amaya is about 77 px. Size is close.
- The gap is in rendering: shading steps, outline policy, micro-detail and design.

**Atmospheric perspective (measured per depth layer)**

| Layer | Saturation | Mean lum | Lum std (contrast) | Median hue |
|---|---|---|---|---|
| Near cliff rock | 0.78 | 0.37 | 0.225 | 19° |
| Mid hills | 0.40 | 0.55 | 0.142 | 27° |
| Far mountains | 0.24 | 0.59 | 0.113 | 250° (lilac) |
| Foreground framing foliage | 0.73 | 0.20 | — | 205° (dark, cool) |

Each step back multiplies saturation by about 0.55–0.6, adds about 0.1 luminance and multiplies contrast by about 0.65. Hue converges on the lilac haze `#9a95b8`. The foreground goes darker and cooler instead.

---

## 1. Regions studied

| Crop file | ref box | What it shows |
|---|---|---|
| c_hud / z_portrait / z_hearts | (0,0,255,105) | Portrait block, name, 7 hearts, energy bar, "Nv. 3" tab |
| c_bubble | (230,88,472,198) | KIRU speech bubble |
| c_kiru / z_kiru | (135,100,235,210) | KIRU robot |
| c_amaya / z_amayahead / z_amayabody | (200,195,320,345) | Amaya running |
| c_sign | (0,180,170,395) | Wooden signpost with 4 planks |
| c_cliff / c_cliffz | (140,320,390,520) | Columnar orange cliff, plants, flowers |
| c_fgleft | (0,360,170,520) | Dark cool foreground foliage, lavender spikes |
| c_plant / plantL / plantR / z_platform / z_captacion | (335,270,835,480) | Desalination chain with labels |
| c_under / under2 / under3 / c_fish / c_brine / c_foam | (340,400,900,520) | Waterline foam, cutaway underwater, fish, coral, magenta plume |
| c_pvh2 / c_pv / c_h2 / c_tanks | (470,130,840,270) | PV rows, H2 plant |
| c_terr / c_waterfall | (820,130,1125,320) | Terraced crops, multi-tier waterfalls, drones |
| c_mount / c_mountz / c_farz / c_turbine | (260,40,720,250) | Mountains, turbines, far lilac range |
| c_dome | (790,0,960,175) | ARIDIA dome city |
| c_sky / c_sunz / c_cloudz / c_fauna | (420,0,1125,140) | Sky, sun, clouds, eagle, drone |
| c_mapa | (930,5,1122,135) | MAPA panel |
| c_preg / c_kw | (885,300,1122,512) | PREGUNTA panel |
| c_strip | (0,512,1125,633) | 8 level cards |

---

## 2. Palette ramps (dark → light, hex)

This block is ready to merge into `RAMP` (`src/00_core.js:152`). Names are suffixed `R` so they do not collide with the current ramps.

```js
// --- sky & atmosphere ---
skyR:      ['#1478e6','#2186eb','#3490f4','#3c9dfa','#53a9f8','#7fbcf2','#a3caf5','#c0d0ee'], // ref y0 → horizon (g y0 → ~138)
cloudR:    ['#788ec6','#9fb6ee','#b8c5f1','#cdd2ee','#e0e7f8','#f0eef1','#fcf6d0'],             // deep belly → lit body → sun-side warm rim
cirrusR:   ['#a4b6ed','#c2d2f3','#e2e9f7'],
sunR:      ['#7991d7','#a29ec4','#baaab7','#d6b5a7','#f4d8a1','#fdfacd'],                       // outer halo (lavender) → warm ring → disc
hazeR:     ['#756886','#8e7daa','#9090ba','#c797a9','#baa4bc','#cbd4ee'],                       // far mountains (lilac/mauve)
hillWarmR: ['#5f473c','#8d6057','#ab7766','#e69e69','#edc093'],                                 // mid hills (desaturated orange)
// --- water ---
oceanR:    ['#05467e','#057ec7','#0692d5','#38bbea','#99dbef','#e6f8fc'],                       // open sea surface + sparkle
shallowR:  ['#064777','#0a71a3','#11bedd','#3adcf1','#7cdfec','#bde3ed'],                       // turquoise near the plant
foamR:     ['#1085a9','#18b5cc','#22dbe7','#7cdfec','#d2ecee','#ffffff'],
underR:    ['#041939','#072e51','#065481','#0879a4','#0c97b6','#08bcd6','#07dde6','#c2f2fb'],   // seabed → just under the surface / light shafts
coralTealR:['#024339','#187d71','#4a9c8b','#1daf9b','#8fc9d3'],
coralVioR: ['#06032f','#191057','#3f2e79','#7a58ac','#b49cdc'],
coralWarmR:['#6a2a10','#c05a20','#e89a3a','#f6d060'],                                           // (visual) branch tips
fishR:     ['#1d3a4a','#497c8a','#8ca18b','#d2dbb7','#f4f2dc'], fishFinR:['#a07a10','#e8c040','#f8e080'],
waterfallR:['#788ba0','#88b3c4','#baccd0','#deeaec','#ffffff'],
// --- terrain & vegetation ---
rockR:     ['#3e0c03','#602212','#813417','#a24a1f','#d07530','#efa04b','#fbc371'],             // 7 steps, crevice → lit top rim
sandR:     ['#67430f','#96592b','#c58440','#edaf5f','#fccf85','#f9da99'],
grassR:    ['#2a3a0c','#3b5312','#597611','#7b981a','#9cb42c','#bfd52c','#efd83f'],             // yellow-green; tips go yellow
treeR:     ['#1f3a26','#37542e','#596c39','#8a9e4a','#c8d56c'],
palmR:     ['#242606','#45450e','#757528','#a9943e','#ccc94a','#eddc8a'],
fgLeafR:   ['#080818','#0e243a','#194560','#2f6f7a'],                                           // foreground silhouettes (cool)
fgVioR:    ['#1a0f33','#2e1d53','#433c7b','#6b3d92','#9a6ad0'],                                 // lavender spikes
flowerR:   ['#71180a','#bd271e','#e94a64','#f47a90'], flowerCtrR:['#dc7f30','#fcc47e'],
woodR:     ['#100100','#370b00','#4e2519','#5a2d21','#8e542f','#cb9772'], woodGrain:'#958079', signText:'#faebe2',
cropSoilR: ['#5a431c','#86502d','#cb824a'], terraceWallR:['#82494a','#e1956c','#f8c888'],
// --- built / tech ---
concreteR: ['#443930','#6e625b','#7b7679','#ac9b82','#cebaac','#f5e5c3'], concreteStain:'#4b586e',
steelWR:   ['#4f4d51','#716f76','#948e91','#b5aba8','#d3ccc5','#f2efea'], steelBand:'#3a7fc0',    // WARM white steel, not blue-white
membraneR: ['#092647','#31506f','#427ca5','#1da9e7','#74c6de','#b6e9f7'],
permeateR: ['#0c2e4a','#217b9c','#22c1e7','#71dfef','#abfafd'], permeateGlow:'#48b6ec',
brinePipeR:['#080e26','#212846','#3a405d','#555a78','#787a9b'],
brineR:    ['#4d1858','#822f7e','#c244a2','#e07ecf','#f4bef5'], brineMix:'#aa66b3',
h2GreenR:  ['#2a5e4a','#538772','#2f9e62','#4cd48e','#80ecc2','#c7ecd1'],
h2WhiteR:  ['#4b5b4a','#727c63','#8b878b','#c0bfb1','#ebeee4'],
pvR:       ['#1e2a55','#344675','#35528f','#4f6391','#6a7aa4','#8b9cc2','#b7c7e7'], pvGrid:'#d1d6e7',
domeStoneR:['#6d5c51','#a6806a','#bca494','#e8b27d','#f2d5bb'], domeGlassR:['#597b8c','#6fc8cc','#9be4e6','#c2d5ef'],
turbineR:  ['#7a84a0','#a0a8c0','#d8dde8','#f4f6fb'],
// --- characters ---
skinAmR:   ['#602316','#bb5933','#e58b68','#f7ad7e','#fad4bc'],                                 // sprite
skinAmPR:  ['#4b1308','#78281a','#a14a34','#cd6348','#e58b68','#f9ac7d','#fad4bc'],           // portrait (7 steps)
hairAmR:   ['#1a0405','#3c0904','#621305','#8a2911','#a64a29','#c4704a'], hairTie:'#d8a020',
shirtAmR:  ['#4b0706','#751d14','#a52f1e','#e63c23','#f64224','#f8ae7e'],
packR:     ['#1d162b','#372933','#4b4f55','#6d6a86','#9a98b4'], packFlapR:['#5a2a10','#bd7230','#e09a50'], packGadget:'#1c9ed7',
shortsR:   ['#5a3728','#796d63','#b39271','#cab59b','#e0d1cb'],
bootR:     ['#230705','#3b0d07','#55311e','#6b3d1a','#a64a29'], sock:'#f7c782',
goggleR:   { strap:'#14162a', frame:['#4b4f55','#848fa2'], lens:['#15345a','#286782','#44bae2','#c8f4ff'] },
kiruShellR:['#383f50','#556275','#838293','#9aa5b3','#cdced9','#ecf1f3'],
kiruVisorR:['#000c2a','#000c4c','#071742','#0e4171'],
kiruEyeR:  ['#0e8fa8','#17f3f7','#40e8e7','#9ff6f8','#e6ffff'],
kiruEarR:  ['#3a2919','#875b23','#de8b1f','#fa8c01','#efd647'], kiruEarInR:['#34c7e2','#40e8e7','#a8fffd'],
kiruThrR:  ['#070a1c','#0e4171','#378aa9'], kiruThrBand:['#c09020','#f4c739'], kiruTrail:['#34c7e2','#9ff6f8','#f4fdff'],
outlineInk:{ warm:'#13060a', brown:'#340d09', red:'#590e05', navy:'#171d35', kiru:'#060916' },
// --- UI ---
uiFillR:   ['#00112b','#04142e','#061a3c','#0a2957'],     // body fill ≈ #04142e; header/stats top ≈ #0a2957
uiInk:'#001141', uiInkAlt:'#07072d', uiOuter:'#1b2747',
uiBevelHi:['#ccd9eb','#e0f4ff','#f6fdff'], uiBevelLo:['#5b7bb7','#83a4e9'], uiBevelMid:['#445f8a','#315aa0'],
uiText:'#e2f4fe', uiTextDim:'#a5afca', uiKwYellow:'#f0ec96' /*visual*/, uiKwOrange:'#f6b48a' /*visual*/,
uiOkBorderR:['#00613f','#179d74','#1de69c','#33dfa1'], uiOkFillR:['#0d4441','#064a47','#025d4e'],
heartR:    ['#490c20','#771e2f','#b52f3b','#f3363c','#ef7c7b','#ffd0d0'],
energyR:   ['#062657','#0c92cc','#09d3f9','#22f3fc','#67f4fb','#d8ffff'],
boltR:     ['#483204','#7f6628','#e6c142','#f6e38a'],
labelCyan: { fill:'#030a24', border:'#89e7fc', glow:'#2e97b1', text:'#f9fbff' },
labelGreen:{ fill:'#145734', border:'#77ce8d', glow:'#538b52', text:'#f9fbff' },
labelLilac:{ fill:'#0a042f', border:'#b79ace', glow:'#6a496b', text:'#f9fbff' },
stripBg:'#021329', stripTopLine:['#101220','#172f4d'],
cardBorder:['#76dca8','#6bd4eb','#d3b04e','#a2dce8','#3ebe94','#c2e5eb','#f4a198','#6cd1ed'], // levels 1..8
cardLabelFill:'#021d2d', cardLabelText:'#b8e1e8',
```

**Sky profile (ref column x 560–700, row median):**
- y0 `#1481ec`, y20 `#2186eb`, y50 `#3490f4`, y80 `#3c9dfa`, y100 `#53a9f8`, y110 `#a3caf5`, y120–150 `#b7cef1`→`#c0d0ee`.
- There are about 8 bands over g 0→138. Horizon is lavender-white, not cyan.

**Sun (radial profile)**
- Disc `#fdfacd`, flat, radius 19 ref → **11 g**.
- Rim at r+2: `#f4d8a1`.
- Rings follow: `#d6b5a7` (r+5) → `#baaab7` → `#a29ec4` → `#7991d7` (r+17) → sky `#5d8ddf` at r+20 ref (g: 1–2 px per ring, total halo radius about 23 g).
- The halo is warm → lavender. It is not a yellow glow and not a dithered disc.

---

## 3. Rendering rules

### 3.1 Outlines
- **Characters (Amaya, KIRU, NPCs):** full 1 px outline, selectively coloured (sel-out).
  - Each segment uses the darkest tone of the adjacent material.
  - Hair `#1a0405`, skin `#602316`, shirt `#4b0706`, boots `#230705`.
  - Gear and backpack use navy `#171d35`; KIRU uses `#060916`/`#071742`.
  - The outline is never a single global ink. On the upper-left lit edge it may lighten one step.
  - Measured dark pixels around Amaya cluster into `#13060a`, `#340d09`, `#171d35` and `#590e05`.
- **Mid-ground props** (machinery, pipes, signs, fish, turbines, drones, eagle): 1 px dark outline in a hue-matched dark.
  - Permeate pipe `#0c2e4a`, brine pipe `#080e26`, wood `#370b00`, fish `#1d3a4a`, steel frames `#4f4d51`.
- **Terrain (rock, sand, foliage masses):** no contour line. Form comes from value: crevices 1–2 px `#3e0c03`, plus a lit top rim.
- **Background** (mountains, far city, clouds, sky): no outlines at all.
- **UI:** a 1 px outer ink plus a bevel (see §6).

### 3.2 Shading steps
| Group | Tones per material |
|---|---|
| Character materials | 4–5 tones + outline (skin 5, hair 6, shirt 6) |
| Portrait | 7 |
| Hero environment (rock, steel, pipes, water) | 5–7 |
| Mid hills | 4–5 |
| Far range | 3–4 |
| Sky | 8 bands |
| Clouds | 5–7 |
| UI panels | 3–4 + text |

### 3.3 Hue shifting
| Material | Shadow shifts toward | Highlight shifts toward |
|---|---|---|
| Warm (rock, sand, skin, shirt) | red/maroon, then violet (rock `#a24a1f`→`#602212`→`#3e0c03`; mountains `#c797a9`→`#8e7daa`) | yellow/peach (`#efa04b`→`#fbc371`, skin `#fad4bc`) |
| Greens | olive, then teal-blue (`#37542e`→`#194560` in the foreground) | yellow (`#efd83f`, `#cce157`) |
| Water | navy `#041939` | cyan-white `#c2f2fb`/`#ffffff` |
| Steel | warm grey `#716f76` | warm white `#f2efea`; sides pick up sky blue |
| Clouds | periwinkle `#9fb6ee` | lavender-white; warm `#fcf6d0` on the sun side |

### 3.4 Light
- **Key light** is from the upper-left at about 45°: block tops and upper-left facets are lit, crevices are lower-right. KIRU's shell is brightest top-left.
- This matches `LIGHT = [-0.55,-0.7,0.62]` at `src/10_rig.js:9`. Keep it.
- **The sun is a focal element**, upper-centre-right at g(417,15). It does not change the key direction.
- **Rim light:** a warm 1 px rim on silhouettes and cliff tops (`#fbc371`); hair strand highlights `#c4704a`.
- **Specular on metal**
  - Vertical tanks: across the width use outline / `#b5aba8` / **specular `#f2efea` at 20–38%** / `#d3ccc5` / `#948e91` / **core shadow `#716f76` at 80–92%** / reflected `#948e91` / outline.
  - Horizontal pipes, top to bottom: outline, dark, **1 px near-white line at 25–35% from the top**, body ×2, dark, outline.
- **Emissives** read as glow, done with a 1 px halo at about 50% alpha:
  - permeate cyan `#48b6ec`
  - H2 tank windows `#4cd48e`/`#80ecc2`
  - brine plume `#e07ecf`
  - KIRU eyes `#17f3f7`
  - UI neon borders

### 3.5 Atmospheric perspective
Apply per depth step (see §0): S ×0.55–0.6, L +0.1, contrast ×0.65, and lerp hue toward `#9a95b8`. Approximate lerp amounts:

| Layer | Lerp toward haze |
|---|---|
| Far range | 60–70% |
| Mid mountains | 35–45% |
| Hills | 20–25% |
| Plant | 0–10% |
| Foreground framing | goes darker and cooler instead: L −0.2 toward `#0e243a`/`#2e1d53`, S stays high |

### 3.6 Dithering
- **Essentially none.** No Bayer checkerboards in sky, halos, panels or shadows.
- Gradients are stepped bands with 2–3 px jittered, noise-clustered borders.
- Texture comes from clustered noise: 2×2 to 4×4 chips at ±1 ramp step.
- **This is the single biggest "retro" tell in the current engine.** Replace or disable Bayer in:
  - `rampDither` (`src/00_core.js:209`)
  - `PixelBuffer.vgrad` and `dither` (`src/01_pixel.js:85-97`)
  - `fdither` and `fshadow` (`src/01_pixel.js:197-210`)
  - the panel drop shadow at `src/06_ui.js:25`
  - the sun-halo dither in the sky builder (`makeSkyCanvas` → `ART.sky`, `src/13_bg.js:85`)

### 3.7 Rock texture (cliff)
- Columnar blocks 14–23 g wide and 20–40 g tall, separated by 1–2 px crevices (`#3e0c03`/`#602212`).
- Each block has 3 facet planes:
  - top/upper-left lit: `#efa04b`–`#fbc371`
  - front: `#d07530`–`#a24a1f`
  - lower-right shadow: `#813417`–`#602212`
- Add speckle chips of 1–3 px at 8–12% density.
- Overhangs: cast a 2–3 px shadow of the darkest step under each block lip.
- Tufts of `grassR` plants and `flowerR` clusters grow on ledges.

### 3.8 Foliage
- Leaf-stamp clusters 8–20 g wide; leaves 3–5 px; 4 tones.
- Lit tips are yellow (`#efd83f`), the base is a dark olive core (`#242606`/`#3b5312`).
- Mid-ground trees: round crowns of 6–12 g built from 3–4 lobes.
- Palms: 5–7 drooping fronds of 1–2 px with serrated undersides, on a 1–2 px trunk with ring marks.
- Foreground: large teal leaves (`fgLeafR`) and lavender spikes (`fgVioR`) at 1.3× parallax, partly cut by the frame edge.

### 3.9 Water
- **Open-sea surface (far):** `oceanR`.
  - Horizontal sparkle dashes 1×(2–6) px in `#99dbef`/`#ffffff`, at density ≈ 1 per 60 px².
  - Dashes get longer toward the viewer.
- **Waterline at the platform/cliff**, drawn as a wavy cross-section line:
  - Crest ridge: 2–3 px white `#ffffff`/`#d2ecee`, with curl hooks every 11–17 g.
  - Spray: 1 px dots 1–4 px above the crest.
  - Under the crest: a 3–5 px band of `#22dbe7`, then `#18b5cc`→`#1085a9`.
  - Foam licks up the concrete and rock faces for 3–6 px.
- **Underwater cutaway** (g y ≈ 250–291), gradient from `#08bcd6` at the surface to `#041939` at the floor.
  - Light shafts: 4–10 g wide, tilted ≤10°, `#07dde6`/`#0cb9d6` at 25–40% alpha, swaying.
  - Suspended particles: 1 px at about 0.5% density.

### 3.10 Fish
- Near fish: about 26×15 g; small fish 10–14×6–8 g.
- Silver-cream body (`fishR`) with a blue-grey scale pattern on alternating rows.
- Yellow dorsal and tail fins (`fishFinR`).
- Black eye with a 1 px white highlight; 1 px `#1d3a4a` outline.

### 3.11 Coral
- Cauliflower clumps of 10–25 g in `coralTealR`.
- Violet fans and plumes in `coralVioR`.
- Warm branch accents in `coralWarmR`.
- Each clump has a lit top-left lobe and a dark navy base.

### 3.12 Brine plume
- Exits a dark pipe (`brinePipeR`, about 8–9 g in diameter, with flanges every 10–14 g).
- Plume made of 1–3 px particles in `brineR`: dense at the outlet, fanning down-right over about 40×25 g.
- Mixes into the water using `brineMix`.
- Keep the magenta controlled: it should sit in under 3% of frame pixels.

### 3.13 Waterfalls
- Vertical streaks 1–3 px in `waterfallR`, scrolling down.
- Multiple tiers, 15–30 g per tier.
- White foam blobs and a mist band 4–6 px at each tier base.
- They feed turquoise terrace channels.

### 3.14 Buildings in 3/4 perspective
- High-angle oblique, about 25–30° camera tilt. Horizontals stay horizontal and depth recedes upward.
- Everything below the horizon shows a top face of 35–50% of its front height (concrete platform: top about 15 ref, front about 33 ref → 0.45). Top faces are 1–2 ramp steps lighter.
- PV rows are tilted toward the sun, showing panel faces. They stack in rows of 3–5 with a module grid of 4–6 g cells, light grid lines `#d1d6e7`, and a sky reflection gradient (darker lower-left `#344675` → lighter upper-right `#8b9cc2`).
- Platform front face: blocks 14–20 g wide with mortar seams `#6e625b`, a lit top edge `#f5e5c3`, and a water stain `#4b586e` on the bottom 30%.

### 3.15 In-world labels
- Fill near-black navy.
- 1 px bright border in the system colour plus a 1 px outer glow in a darker tone.
- 1 px chamfered corners.
- All-caps bold white text, cap height 5 g.
- Second line in sentence case, e.g. "(Permeado)" and "(Rechazo)".
- A thin 1 px vertical leader stem in the border colour down to the object, ending in a 1–2 px rivet.
- System colours:
  - water treatment: `labelCyan`
  - H2 and agriculture: `labelGreen`, which has a **green fill** `#145734`
  - brine: `labelLilac`

| Label | ref box | g box |
|---|---|---|
| CAPTACIÓN | 363–423 × 284–300 | 207–241 × 162–171 (≈35×9) |
| PRETRATAMIENTO | 492–583 × 288–304 | 280–332 × 164–173 |
| MEMBRANAS | 587–655 × 311–327 | 334–373 × 177–186 |
| AGUA POTABLE / (Permeado) | 683–757 × 293–322 | 389–431 × 167–183 |
| SALMUERA / (Rechazo) | 752–812 × 388–420 | 428–462 × 221–239 |
| H₂ HIDRÓGENO VERDE | 740–820 × 147–197 | 421–467 × 84–112 (H₂ glyph at 2× size) |
| AGRICULTURA SOSTENIBLE | 926–1012 × 184–214 | 527–576 × 105–122 |

---

## 4. Characters

### 4.1 Amaya (ref box ≈ x 230–310, y 203–339)

**Measurements**
- Height 136 ref → **77 g** (21.5% of the frame; 26% of the playable height).
- Running width about 73 ref → 41 g.
- Head (skull, without ponytail) 39 ref → **22 g**. That is **about 3.5 heads tall**: juvenile and stylised, not chibi.
- Shoulder-to-hip 35 ref → 20 g. Hip-to-sole 49 ref → 28 g (legs are 36% of height).
- Boot length about 16 ref → 9 g (chunky).
- Suggested sprite canvas: **48×80 g**, with the feet baseline at y 79.

**Face (sprite)**
- Eyes 3×4–5 g: dark iris `#1e0901`, 1 px white highlight, 1 px dark upper lash line, thin brow.
- Ear visible (`#bb5933` inner).
- Mouth: a 2–3 px line, slightly smiling.
- Cheek is 1 lighter step. Nose is a 1 px shade.

**Hair**
- High ponytail at the crown, very voluminous.
- 5–6 jagged strand tips flaring back, opposite to motion, wind-swept.
- 3–4 pointed bangs over the forehead; one side lock in front of the ear.
- 6-tone `hairAmR`, with highlight strands as 1 px curved lines in `#c4704a`.
- 2 px yellow tie `#d8a020`.

**Goggles**
- Pushed up on the forehead: navy strap `#14162a` around the head.
- 2 round lenses about 5 g across, gunmetal frame, cyan lens with a 1–2 px white glint.

**Clothes**
- Red short-sleeve shirt (`shirtAmR`) with collar and rolled cuffs.
- Brown belt with pouches, and a folded paper map tucked in (`#dbaa29` + white).
- Dark fingerless gloves.
- Khaki-grey cargo shorts (`shortsR`) with a small blue patch.
- Chunky brown lace-up hiking boots (`bootR`) with a cream sock fold `#f7c782`.
- The front leg reads as olive-brown trousers (`#674025`/`#51321d`). This is an AI inconsistency; pick either shorts with bare knees or shorts over dark leggings, and lock it.

**Backpack**
- About 17×20 g, slate-violet (`packR`), with an orange-brown top flap (`packFlapR`), straps, a cyan gadget pocket and a hanging strap.
- It covers about 60% of the torso from the side.

**Pose language**
- Dynamic run with about 15° forward lean, back leg extended and front knee up.
- Fists pump; head is up, looking into the vista; hair streams behind.
- Reads as curiosity and determination.

**Identity mismatch to resolve**
- Current Amaya (`AMAYA_D`, `src/11_chars.js:35`) has a dark purple bun (`RAMP.hairA`), brown skin (`skinA`), blue pants and yellow sneakers.
- The reference image labels its character "AMAYA" and shows an auburn ponytail, light-medium skin `#f7ad7e`, goggles, a red shirt and a backpack.
- This is a design decision for the lead, not just shading.

### 4.2 KIRU (ref box ≈ x 146–228, y 104–203)

**Measurements**
- Total with ears 98 ref → **56 g tall**, about 48 g wide. That is about 73% of Amaya's height.
- Hovers with its feet level with Amaya's hair top, offset about 28 g behind her.
- Suggested canvas: **56×60 g**.

**Head and shell**
- Rounded-cube superellipse, corner radius about 40%.
- 60×47 ref → 34×27 g; 6-tone white `kiruShellR`, brightest top-left.
- Cyan decal dots `#378aa9`/`#40e8e7` on the side.

**Visor**
- 18×18 g, front-right (KIRU faces right), black-navy `kiruVisorR`.
- 1 px rim `#556275` with a navy edge and a 1–2 px reflection arc `#0e4171`.

**Eyes**
- Two vertical capsules of **4×8 g**, 3–4 px apart.
- `#17f3f7` body, `#9ff6f8`/`#e6ffff` core, 1 px glow halo.
- Tiny 1–2 px mouth mark below.

**Ears**
- Two tall leaf or rabbit fins, about 21×20 g each, swept back at about 35° and 20°.
- 1 px gray rim `#556275`, outer band orange `#fa8c01`, inner yellow `#efd647`, core cyan gradient `kiruEarInR`.

**Body and thrusters**
- Small white torso with a dark joint.
- Two cylindrical thruster feet, 13×19 and 11×14 g: navy body, yellow band `#f4c739`, cyan lower glow.
- Spark trail behind (left) as a zigzag of 1–2 px particles in `kiruTrail`.

**Outline and pose**
- 1 px `#060916`/`#071742` all around.
- Pose: tilted about 10° forward, ears trailing. Reads as an excited guide.

**Current mismatch:** the current KIRU (`renderKiru`, `src/11_chars.js:134`) is a teal fox-like creature, not the white robot.

### 4.3 HUD and dialog portrait (ref portrait block x 8–106, y 11–99)

- Bust in 3/4 view facing right; head about 60% of the frame height; shoulders, shirt and backpack strap visible.
- Eyes about 8.5×8.5 ref → 5×5 g, with a 2×2 white highlight, dark iris and a 1–2 px upper lash.
- Blush ellipse 3×2 g (`#e8806a` → use `skinAmPR[3]`).
- Smile with a 1 px teeth line; 7-tone skin.
- For 96×96 or 128×128 dialog portraits, scale the construction about 2× (eyes 9–11 px, 3×3 highlight).

---

## 5. Composition

### 5.1 Depth layers (foreground → sky), with g coordinates

| # | Parallax | Layer | Content |
|---|---|---|---|
| 1 | 1.3–1.4 | FG framing | Dark cool foliage bottom-left (x 0–90, y 205–291), lavender spikes, teal broad leaves; overhanging tree canopy top-left (x 0–265, y 0–35) with yellow-green lit leaves and hanging vines; 2 palms on the left edge (x 0–35, y 45–115). |
| 2 | 1.0 | Playable | Amaya on the cliff top (feet g y 193); columnar cliff face to y 291; signpost (x 3–90, y 105–220, 4 planks about 80×17 g with 18 g period, arrows); red/pink flowers and grass tufts; KIRU hovering (x 83–130, y 59–115). |
| 3 | 0.8 | Science infrastructure | Desal chain on the concrete platform (x 195–475, y 160–255): intake hall with a curved blue glass roof → pretreatment drum + 3 white tanks → membrane rack (2–3 horizontal vessels) → post-treatment block → glowing permeate pipe → brine pipe into the sea. Waterline foam y 236–250; underwater cutaway y 250–291 (5 fish, 6–7 coral clumps, plume). |
| 4 | 0.5 | Coastal hills + tech | PV rows (x 270–370, y 124–143), H2 plant (tower + 4 green tanks, x 395–475, y 80–137), small white buildings, palms, orchards. |
| 5 | 0.4 | Terraced agriculture (right) | x 470–640, y 85–176: 3–4 terrace levels of crops, multi-tier waterfalls, 3 drones. |
| 6 | 0.3 | Hill city | Dome city ARIDIA (x 455–545, y 5–100: glass dome, stone ring with windows, about 6–8 slim towers) on a ridge, waterfall from its base. |
| 7 | 0.2 | Mid mountains | Orange/pink peaks (g y 30–120) with 6–7 wind turbines on ridges (tower about 41 g, blade about 14 g). |
| 8 | 0.1 | Far range + sea | Far lilac range (y 105–137); sea horizon at **g y ≈ 138 (38%)** on the left. |
| 9 | 0.05–0.15 + drift | Atmosphere | About 10–12 cumulus, cirrus streaks, eagle (about 26 g wingspan), drones (about 20 g). |
| 10 | 0 | Sky | Gradient + sun (417,15) r 11 + halo r 23. |

### 5.2 Vertical structure
- A bowl or "V" composition. The cliff sits high on the left (y 193) and drops to the sea (cutaway at the bottom centre).
- The terrain rises again diagonally up-right through the plant, hills, terraces and the dome city at the top-right (y 5).
- The main diagonal runs from the bottom-left to the top-right.
- Nothing shares a single ground line. There are at least 6 distinct ground heights.

### 5.3 Character vs vista
- The protagonist is on the **left third** (Amaya x 18–28% of the width), running or looking right **into** the system vista, which takes the right two-thirds.
- This is over-the-shoulder discovery framing.

### 5.4 Density
- About 150–200 distinct visual elements in the scene, roughly one per 1,100 g² (about 33×33 g).
- Rough counts:
  - turbines 7, drones 3, eagle 1, clouds about 12
  - palms/trees about 17, foliage clusters about 25, flower clusters about 6
  - sign planks 4, fish 5, coral 7
  - desal modules 5, pipe segments about 10, labels 7
  - PV modules about 60, H2 tanks 4
  - dome-city towers about 8, waterfall tiers about 6, crop rows about 8

### 5.5 Negative space
- Only about 10–15% of the frame: a sky pocket top-centre (x 250–420, y 0–50, still with clouds), an open-sea patch behind Amaya (x 165–200, y 138–170), and the dark UI panels.

---

## 6. UI

Layout is in g coordinates (ref × 0.5689).

### 6.1 Common border stack (measured)
From outside to inside:
1. 1 px dark ink (`#1b2747`/`#07072d`/`#2b2c4d`)
2. 1 px light bevel: top and left `#e0f4ff`/`#ccd9eb`; bottom and right darker `#83a4e9`/`#5b7bb7`
3. 1 px mid blue `#445f8a`/`#315aa0`
4. 1 px deep `#001141`
5. Fill `#04142e` (stats panel uses a vertical gradient `#0a2957`→`#081f42`)

Other rules:
- Chamfered corners of 3–4 g.
- Tech ornaments in the top-right and bottom-right corners: 2–3 px light-blue bracket and dot glyphs.
- No drop-shadow dither.
- Text has no shadow on navy.

### 6.2 Elements

| Element | Layout | Notes |
|---|---|---|
| Portrait block | x 5–60, y 6–56 (56×50) | Inner art about 50×44; chamfered; bright double bevel. |
| Stats panel | x 60–143, y 8–48, attached right of the portrait | Notched bottom: a "Nv. 3" tab protrudes at x 60–100 to y 57 with a 45° chamfer. "AMAYA" bold caps 6–7 g with a 1 px separator line below. 7 hearts, each 8×7 g on a 9 g period (`heartR`, 2×2 specular top-left). Bolt icon 5×7 (`boltR`). Energy bar 55×5 g: trough `#062657`, fill `#09d3f9`, top 1 px `#67f4fb`, rim `#0c92cc`. |
| Speech bubble | x 134–266, y 51–109 (132×58) | Tail at the bottom-left about 5×6 g (x 137–143, y 109–116) pointing to KIRU. Name "KIRU" bold 7 g caps at the top-left. Body 4 lines, cap about 6 g, x-height 4–5, **line height 9 g**, colour `#e2f4fe`. Keywords coloured yellow (`#f0ec96`). |
| MAPA | x 533–635, y 5–76 (102×71) | Title in a pill tab at the top-left ("MAPA", bold 7 g). Nodes are floating mini-islands (rock underside, grass top) about 12 g, each with a glowing icon (sun, turbine, sprout, water drop, H2 tree) and a neon ring halo (cyan or magenta). Links are dashed white/navy chain segments. |
| PREGUNTA | x 507–633, y 175–290 (126×116) | Orange book icon in a 13×13 g light-bordered box breaking out of the top-left corner by about 3 px. Header about 17 g tall with "PREGUNTA" bold 6 g; 2 px separator `#517dbd` at g y ≈ 190. Question text 3 lines at 9 g line height; key term in peach `#f6b48a`. |
| Option rows | 4 rows, height 14 g, period 15 g, from g y 226 | Letter box 11×14 g: navy fill `#030f23`, 1 px border `#7a8ab3`, white bold letter. Row bar 98×14 g: fill about `#06183a`, 1 px border `#333f62`, option text cap 5 g. Correct or selected row: 2 px border `#1de69c` with `#00613f` edge, fill `#025d4e`→`#0d4441`, letter box also green. |
| Bottom level strip | y 292–360 (68 g), bg `#021329`, top line `#101220` + 1 px `#172f4d` | 8 cards of 74×58 g on a 79 g period starting at x 6. Thumbnail 74×45 (mini illustration in the same style) and label bar 74×12 (fill `#021d2d`, text `#b8e1e8` bold caps 5 g, "1. ORIGEN" style). 1–2 px border in the card's theme colour (`cardBorder`). This reads as a level-select or codex overlay, not a permanent gameplay HUD. |
| Signpost | see §5 | Planks in `woodR`: 2 px dark outline `#370b00`, 1 px top highlight `#cb9772`, horizontal grain streaks `#3c2019`/`#958079`, pointed right end. Text cream `#faebe2`, caps 6 g, 1 px dark drop shadow, arrow glyph "→". Two posts with cap blocks. |
| In-world labels | see §3.15 | |

### 6.3 Fonts
- **Body:** clean pixel sans, 1 px strokes, caps about 6 g, x-height 4–5, line height 9 g. The current `FONTS.main` (`src/02_font.js:249`, caps 7, x-height 5, line height 11) is close: tighten the line height to 9.
- **Names and headers:** bold, with 2 px vertical stems, caps 6–7 g.
- **Labels and cards:** bold caps 5 g.

### 6.4 Current UI mismatch
- `PANEL_STYLES.dialog` (gold `#eab02a`) and `.tech` (cyan `#22bdd0` edges on `#0e1430`) at `src/06_ui.js:7-18` should become a single "navy + light-blue bevel" family (above).
- Colour accents (green, lilac, gold) should be reserved for semantic states and per-system labels.
- Remove the `fdither` drop shadow at `src/06_ui.js:25`.

---

## 7. Science visualisation language (from the reference)

- **Process order is spatial order.** The desal chain runs left to right along the coast in this order: CAPTACIÓN → PRETRATAMIENTO → MEMBRANAS → AGUA POTABLE, with a fork to SALMUERA. Each stage is a distinct silhouette (glass-roof intake hall, drum + 3 vertical tanks, horizontal pressure-vessel rack, block/tank) with a label and a leader stem.
- **Fluids are colour-coded by pipe material and glow:**
  - seawater: natural ocean blue/turquoise
  - process water: steel + light blue
  - **product water: glowing cyan pipe with white chevrons** (flow direction, scrolling)
  - **brine: dark indigo pipe → controlled magenta particle plume**
  - H2: emerald glow on white tanks
  - irrigation: turquoise channels and waterfalls into terraces
- **Cross-section reveal:** the underwater cutaway shows the outfall, the plume dispersion and the marine life next to it.
- **Energy is placed where it physically belongs:** PV rows tilted to the sun on slopes, turbines on ridges, H2 next to water and power. Infrastructure follows the topography: pipes on the terrain and platforms on the shoreline.

---

## 8. Gaps in the current implementation (for planning)

| # | Gap | Where |
|---|---|---|
| 1 | Bayer dithering everywhere | `00_core.js:209`, `01_pixel.js:85-97, 197-210`, `06_ui.js:25`, sun halo in the sky builder |
| 2 | Palette too bright and pastel, lacking deep darks (mean V 0.81 vs 0.66; p5 lum 0.13 vs 0.07) | `RAMP` at `00_core.js:152-196` (e.g. `skyDay` ends `#fff3d4`; `sand` and `dune` dominate) |
| 3 | Flat horizontal banding: dune rows, a single ground line, no top faces | `13_bg.js` `BIOMES`, `16_biomes.js` |
| 4 | Edge density 0.09 vs 0.23, and 41 vs ≥150 colours for 90% of pixels | Fix with material ramps, micro-texture and a 2.5× increase in element density |
| 5 | Characters: correct size (67 vs 77 px) but only 2–3 tones, uniform ink and different designs | `AMAYA_D` (`11_chars.js:35`), `renderKiru` (`11_chars.js:134`), portraits (`14_portraits.js`) |
| 6 | UI is gold/teal prototype styling, not the navy + bevel system; no HUD portrait/hearts/energy block, minimap panel or question panel style | `06_ui.js` |
| 7 | Sun is a dithered yellow halo instead of smooth warm → lavender rings | sky builder |

---

## 9. Animation and motion

The reference is a still image; these are the motions it implies, with prescribed values.

| Element | Frames / fps | Motion |
|---|---|---|
| Amaya run | 8 @ 12 fps | Hair and ponytail lag 1 frame, backpack bounce 1 px |
| Amaya idle | 6 @ 6 fps | 1 px breathing, blink every 3–5 s |
| Amaya walk | 8 @ 10 fps | |
| Amaya jump / fall / land | 3 / 2 / 2 frames | |
| Amaya interact / analyze | 4–6 frames | |
| Emotes | 2–4 frames | surprise, worry, celebrate, determination |
| KIRU hover | — | Sine bob ±2 px with a 1.2 s period; ears sway ±1 px offset 0.2 s |
| KIRU eyes | — | Blink (squash to 4×2) every 3–6 s; glow pulse ±1 ramp step over 1.5 s |
| KIRU trail | — | 6–10 particles, life 0.4 s |
| Turbines | 6–8 rotation frames | 0.3–0.6 rev/s, varied per turbine |
| Drones | rotor 2-frame blink | Bob ±1 px over 1 s; drift 4–8 g/s |
| Eagle | 4-frame flap @ 6 fps | Glide segments |
| Waves and foam | 4-frame curl | Crest scroll 6–10 g/s; spray 1 px particles, life 0.3–0.6 s |
| Sea sparkles | 3-frame twinkle | |
| Waterfalls | 3-frame base foam | Streak scroll 30–60 g/s; mist flicker |
| Fish | 4-frame tail @ 6 fps | Drift 3–8 g/s with a vertical sine of 1 px |
| Light shafts | — | Sway ±2 px over 4–6 s; alpha 25–40% |
| Brine plume | — | 20–40 live particles, emission from the outlet, slow sink and drift |
| Permeate chevrons | — | Scroll 20 g/s |
| Machine indicator LEDs | — | 1–2 Hz |
| Clouds | — | Drift 2–4 g/s plus parallax |
| Sun halo | — | Pulse ±1 ring over 4 s |
| Foliage | — | Sway ±1 px over 2–3 s, phase by x |
| Flowers and grass | — | Bob 1 px |
| Leaves and pollen | — | 1 px particles, sparse (≤15 on screen) |

---

## 10. STYLE LOCK

1. **ART STYLE.**
   - High-detail cinematic, illustrative eco-tech pixel art in a high-angle (25–30°) 3/4 diorama view.
   - It is a painterly pixel illustration: clustered-noise texture, hue-shifted ramps, sel-out outlines on characters and props only, no outlines on terrain or background.
   - Banned: Bayer checkerboards, flat 2-tone fills, uniform black outlines.

2. **PIXEL DENSITY.**
   - 640×360 native, 1 art pixel = 1 game pixel. The reference's native grid is about 560–660 px wide, so its detail fits 1:1.
   - Minimum feature 1 px; no 2× chunky pixels; no mixed scales; nearest-neighbour only.
   - Targets: average same-colour run ≤ 2.0 px (current 3.0), strong-edge density ≥ 0.20 (current 0.09), ≥ 150–250 colours per frame.

3. **SPRITE SCALE.**
   - Amaya 77 g tall (canvas 48×80); KIRU 56 g with ears (canvas 56×60), hovering about 28 g behind and above her.
   - Adult NPCs 72–84 g; children 56–64 g.
   - HUD portrait 50×44 inner; dialog portraits 96×96 or 128×128.
   - Mid-ground props at 0.5–0.6× character scale; turbines about 41 g tower with 14 g blades.

4. **COLOR SATURATION.**
   - Scene mean S 0.50–0.55 and p90 S ≥ 0.92.
   - Saturation peaks are reserved for emissives and the foreground and playable layers.
   - Per depth step S ×0.55–0.6; far layers S ≈ 0.24.
   - Dominant families: azure `#2186eb`, turquoise `#11bedd`, cyan `#22dbe7`, warm rock `#a24a1f`→`#fbc371`, yellow-green `#9cb42c`/`#efd83f`, magenta `#c244a2` (under 3% of pixels), lilac haze `#9a95b8`, navy UI `#04142e`.

5. **CONTRAST.**
   - Luminance p5 ≤ 0.08 and p95 ≈ 0.88; luminance std ≈ 0.24–0.27; mean V 0.62–0.68.
   - Near layers carry the full range (rock luminance 0.09–0.80); far range 0.41–0.72.
   - The foreground framing is the darkest region (mean luminance about 0.20).

6. **LIGHTING LANGUAGE.**
   - Daylight key from the upper-left at 45° (`LIGHT [-0.55,-0.7,0.62]`).
   - The sun is a focal disc at about (417,15), r 11, `#fdfacd`, with warm → lavender rings out to r 23.
   - Lit planes go warm (yellow-peach); 1 px warm rims on silhouettes and ledges.
   - Metal specular is a 1–2 px near-white stripe at 25–35% from the lit edge, plus core shadow and reflected light.
   - Emissive glows at 1 px / 50% alpha: permeate cyan, H2 green, brine magenta, KIRU eyes, UI neon.
   - Water carries sparkles and underwater light shafts.

7. **SHADOW LANGUAGE.**
   - Shadows are always hue-shifted, never grey or black: rock → maroon `#602212`/`#3e0c03`, mountains → violet `#8e7daa`, foliage → teal `#194560`, water → navy `#041939`, skin → `#bb5933`, clouds → periwinkle `#9fb6ee`.
   - Contact and overhang shadows are 1–3 px solid bands of the darkest step; ambient occlusion goes in crevices.
   - No dithered ellipse shadows (retire `fshadow`).

8. **ENVIRONMENT DENSITY.**
   - About 150–200 distinct elements per screen (one per ~33×33 g); negative space ≤ 15%.
   - Each screen needs, as applicable: foreground framing vegetation, 6+ ground heights, ≥ 5 infrastructure modules with pipes, labels, vegetation clusters every ~30 g, fauna (≥ 1 bird/drone, fish when water is shown), and mini-detail (valves, LEDs, rivets, rails, stains).

9. **PARALLAX DEPTH.**
   - 8–10 layers: FG framing 1.3–1.4, playable 1.0, infrastructure 0.8, hills/tech 0.5, terraces 0.4, city/ridge 0.3, mid mountains 0.2, far range and sea 0.1, clouds 0.05–0.15 + drift, sky and sun 0.
   - Per step apply S ×0.58, L +0.1, contrast ×0.65, hue lerp toward `#9a95b8` (far range 65%). The foreground goes darker and cooler.
   - Horizon at about 38% of frame height.

10. **CHARACTER PROPORTIONS.**
    - About 3.5 heads; legs 36% of height; head 22 g.
    - Sprite eyes 3×4–5 with a 1 px highlight; portrait eyes 5×5 (HUD) or 9–11 (dialog) with a 2–3 px highlight.
    - 1 px sel-out outline; 4–6 tones per material (portrait skin 7).
    - Silhouette identity through hair, gear and colour: Amaya (ponytail, goggles, red shirt, violet backpack, chunky boots); KIRU (white rounded-cube shell, black visor with cyan capsule eyes, orange/yellow/cyan fin ears, twin thrusters, spark trail).
    - Juvenile and adult in tone, not chibi.

11. **UI LANGUAGE.**
    - Navy panels (`#04142e`; stats gradient `#0a2957`→`#081f42`) with a 1 px ink, 1 px light bevel (top/left `#e0f4ff`, bottom/right `#83a4e9`), 1 px mid `#445f8a`.
    - 3–4 px chamfers and corner tech glyphs; no dithered shadows.
    - Text `#e2f4fe`, line height 9; keywords `#f0ec96` / `#f6b48a`.
    - Semantic accents: correct `#1de69c` on `#025d4e`; hearts `#f3363c`; energy `#09d3f9`.
    - Layout: portrait (5,6,56×50), stats (60,8,83×40, tab to y 57), bubble (134,51,132×58, tail bottom-left), minimap (533,5,102×71), question panel (507,175,126×116, 4 option rows 14 g tall on a 15 g period), card strip (y 292–360, 8 cards 74×58 on a 79 g period).
    - In-world labels: navy (or green/lilac) fill, 1 px system-colour border plus glow, bold white 5 g caps, 1 px leader stem.

12. **SCIENCE VISUALIZATION LANGUAGE.**
    - Spatial order equals process order (left to right); one distinct silhouette per stage; a label on every stage.
    - Fluids coded by pipe and glow: seawater blue/turquoise, product water glowing cyan with moving white chevrons, brine dark indigo pipe with a magenta particle plume, H2 emerald glow, irrigation turquoise.
    - Cutaway cross-sections show the invisible parts (outfall, membranes, storage).
    - Energy assets sit where the physics says (PV tilted to the sun, turbines on ridges); clouds cast moving shadows on the PV rows.

13. **ANIMATION DENSITY.**
    - Protagonists: idle 6 / walk 8 / run 8 / jump 3 / fall 2 / land 2 / interact 4–6 / analyze 6 / emotes 2–4, at 6–12 fps.
    - Secondary motion on hair, ponytail and backpack (1-frame lag).
    - KIRU: continuous hover (±2 px, 1.2 s), blink, eye-glow pulse, trail particles.
    - At least 8 independently animated ambient systems on screen at any time.

14. **ENVIRONMENTAL MOTION.**
    - Turbines 0.3–0.6 rev/s; waves (crest scroll 6–10 g/s, 4-frame curls, spray); sea sparkles; waterfalls 30–60 g/s; fish 4-frame tails.
    - Underwater shafts sway (4–6 s); brine plume 20–40 particles; permeate chevrons 20 g/s; LEDs 1–2 Hz.
    - Clouds 2–4 g/s plus parallax; foliage sway ±1 px (2–3 s); eagle 4-frame flap; drone rotors and bob.
    - Particles (dust, pollen, salt, droplets) ≤ 15–40 per system. The scene must read as alive with the player standing still.