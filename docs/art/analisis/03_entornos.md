# Environment art: analysis and plan to match the reference

The current environments miss the reference mainly on composition, value range and how detail is distributed, not on resolution. Scaled down to 640×360, the reference keeps all of its density (`env_ref_640.png`). The game puts its noise in the wrong place. The sky is busy with Bayer checker dither, and the playfield below it is about twice as flat as the reference. The engine already has the hooks a rich renderer needs. The current generators are side-on, use few tones, use cold mint greens and pink rock, and are spread thinly. A new modular kit is needed. The calling code mostly stays as it is.

All my scratch files are in `/tmp/claude-0/-home-user-Pixel-Bit/3de6e308-5c98-5496-b62a-c6dd2f26bdb0/scratchpad/art_analysis/env/`. I built the game there (`build_env.js`, `shot_env.js`), so the repo was not modified. Key files:
- `env_compare_ref_vs_lv1.png`: reference vs Lv1, 2× nearest-neighbour.
- `r_*.png` / `rz_*.png`: reference crops (cliff, water, plant, terraces, mountains, sky, brine outfall, level cards).
- `stats.py`, `stats2.py`: density and colour metrics. `pal.py`: palette extraction. `perf.js`, `perf2.js`: draw-cost measurement. `loadt.js`: prerender timings.
- `lv*_*.png`, `montage_b.png`: screenshots of all levels.

---

## 1. Architecture as it is today (exact APIs)

### 1.1 `src/00_core.js`
- **Colour helpers:**
  - `U(hex)`: hex to u32 ABGR, cached in a Map.
  - `u32ToHex`, `mixHex(h1,h2,t)`, `rgbToHsl`, `hslToHex`.
  - `shade(hex, amt)`. Negative `amt` pulls the hue toward **255° (violet)** by `0.35·amt` and adds saturation. Positive `amt` pulls toward 55° (yellow).
  - `makeRamp(base,n,spread)`.
- **Noise and random:** `hash2/hash1`, `vnoise`, `fbm(x,y,oct,s)`, `noise1`, `fbm1`, `RNG(seed)` (mulberry32 with `.range/.int/.pick/.chance/.shuffle`).
- **Dither:** `BAYER4`, `BAYER8`, `bayer4(x,y)`, `rampDither(ramp,t,x,y,strength)` (Bayer 4×4 between neighbouring ramp entries).
- **Canvas:** `makeCanvas(w,h)` returns a canvas with `.g` and smoothing off.
- **`RAMP` (lines 152–196), all dark to light:**
  - Skies: `skyDay`, `skyDawn`, `skyDusk`, `skyNight`, `skyStorm`, `skyTech`.
  - Land and water: `sea`, `sand`, `dune`, `salt`, `leaf`, `moss`, `mangrove`, `mesa`, `rock`, `soil`.
  - Materials: `metal`, `steelW`, `pv`, `copper`.
  - Colour families: `coral`, `orange`, `yellow`, `cyan`, `violet`, `magenta`, `navy`.
  - Characters: `skin*`, `hair*`, `limen`, `mirage`.
  - Other: `gold`, `brine`, `h2`, `fire`.
  - `16_biomes.js` adds `skyFest`, `skySalt`, `skySolar`, `skyBreeze`, `skyCitadel`, `skyOasis`, `skyCalima`.
- **Accessor:** `R(name,i)`.

### 1.2 `src/01_pixel.js`

**`class PixelBuffer(w,h)`** (line 6) holds `img` (ImageData) and `data` (a Uint32Array view). Methods:
- Basics: `clear`, `inb`, `set(x,y,c)` (accepts a hex string through `U()` or a u32, bounds-checked per pixel), `get`, `alpha`.
- Shapes: `rect`, `hline`, `vline`, `line` (Bresenham), `thick(x0,y0,x1,y1,r,c)`, `disc`, `ellipse`, `ellipseOutline`, `poly(pts,c)` (scanline fill).
- Fills: `dither(x,y,w,h,a,b,t)` (Bayer), `vgrad(x,y,w,h,ramp,t0,t1,strength)`.
- Compositing: `blit(src,dx,dy,flip)`, `outline(colorOrFn, diag)` (exterior outline), `swap(fromU,toU)`, `toCanvas()`.

**Other pixel helpers:**
- `darkOf(u,amt)` (cached), `spriteFromMap(rows,pal,scale)`.

**Context helpers** (each one sets `fillStyle` and calls `fillRect`):
- `frect(g,x,y,w,h,col)`, `fpx(g,x,y,col)`.
- `fline` (Bresenham with per-pixel fillRect, guard 4000).
- `fdisc(g,cx,cy,r,col)` (one fillRect per row).
- `ditherPattern(g,col,level)` (cached 4×4 Bayer `CanvasPattern`), `fdither(g,x,y,w,h,col,level)`.
- `fshadow(g,cx,cy,rx,ry,col,level)` (dithered ellipse).

### 1.3 `src/13_bg.js`: `Backdrop` (line 9)
- **Fields:** `layers[]` (behind gameplay), `front[]` (after particles), `skyC`, `clouds[]`, `weather {wind,dust,clouds,rain}`, `horizon`, `sky`.
- **`layer(f, h, y, drawFn(pb,w,h), opts{fy=f*0.3, dyn(g,cam,L), pre(g,cam,L), front})`**:
  - Width is `ceil(W + max(0,levelW−W)·f) + 2`.
  - `drawFn` paints into a PixelBuffer once, which becomes `L.c`.
  - Each frame it draws `drawImage(L.c, −round(cam.x·f), L.y − round(cam.y·fy))`, then `L.dyn`.
- **`dynLayer(f, dyn, opts)`:** draws per frame only.
- **Clouds:**
  - `addClouds(n, pals, seed, yMin, yMax, f0=.04, f1=.18)` builds sprites with `ART.cloudSprite`, 40–120 px wide, height 0.32–0.45 of the width.
  - `drawClouds(g,cam,wind)` drifts them at `speed·dt·wind` and wraps.
  - `cloudShadowAt(worldX)` returns a shadow factor between 0 and 1. It is used by the PV level.
- **`render(g,cam,'back'|'front')`.**
- **Sky:** `makeSkyCanvas(ramp, horizon, opts{sun, stars, curve, h})` is cached in `BG_CACHE` by key. It is a W×max(horizon+40, H) canvas painted by `ART.sky`.
- **Per-frame water effects, all per-pixel `fillRect` loops:** `drawSeaSparkles(g,x0,y0,w,h,t,density,cols)`, `drawSunGlitter(g,cx,y0,y1,t,col)`, `drawWaveBands(g,x0,y0,w,h,t,col,spacing)`.
- **`ambientParticles(ps, kind, cam, rate, wind)`:** kinds are dust, sand, leaf, firefly, salt and windline.
- **`BIOMES.coast`** is defined here. The other biomes are in `16_biomes.js`:
  - Exterior: `plaza`, `canyon`, `pvdunes`, `windcliffs`, `citadel`, `oasis`, `calima`.
  - Interior: `plant`, `vault`, `council`.
- **Plane counts:** most biomes have 3–4 prerendered layers (vault and council have 2; calima has 2 plus 1 front dust veil). Each is a horizontal strip 60–160 px tall at f between 0.05 and 0.55. There are no front layers apart from calima's dust.

### 1.4 `ART.*` catalogue

**Static generators** (draw into a PixelBuffer once). In `12_props.js`:
- Haze: `haze(hex,haze,k)`, `hazeRamp(ramp,haze,k)` (plain RGB mix).
- Sky: `sky(pb,ramp,horizonY,{sun,stars,curve})`, `sunDisc(pb,cx,cy,r,cols,halo)` (Bayer halo out to 3.2r), `cloudSprite(w,h,seed,pal4)` (circle blobs, 4 tones, flat base).
- Terrain: `ridge(pb,heightFn,pal,{mesa,baseIdx,strata,fadeTo,fadeLen,fadeIdx})` (1-D profile; slope picks the face; **horizontal strata stripes**), `dunes(pb,yBase,amp,pal,seed,{minW,maxW,lit,shadow,ripples})` returning tops[], `sea(pb,y0,y1,pal,{invert})`.
- Plants: `palm(pb,x,y,hgt,lean,seed,pal)` (7 fronds), `cactus`, `nopal`, `agave`, `shrub(pb,x,y,r0,seed,pal)` (circle blobs), `grass(pb,x,y,n,seed,pal)` (1-px blades), `tree(pb,x,y,hgt,seed,pal,trunk)` (circle blobs).
- Buildings: `house(pb,x,y,w,h,seed,{pal,roof,night,solarRoof,awning})` (front elevation only), with `HOUSE_COLS` as 7 five-tone palettes.
- Infrastructure:
  - `pvRow(pb,x,y,w,seed,{tilt,depth,soil})`: a parallelogram, the only 3/4-ish element in the game.
  - `tank(pb,x,y,w,h,pal,{band,ladder,label,labelCol})`.
  - `pipe(pb,x0,y0,x1,y1,r,kind)`: straight runs only. `PIPE_PAL` has 5-tone sets for water, seawater, brine (**magenta body**), power, h2, steel and irrigation.

In `15_tech.js`:
- Festival and town: `bunting`, `stall`, `crate`, `fountain`, `mural`, `pergolaPV`.
- Water infrastructure: `roRack(pb,x,y,rows,n,{tubeW})`, `hpPump`.
- Energy: `batteryContainer`, `electrolyzer`, `h2tank`, `pole`, `cable`.
- SYNARA and screens: `synaraCore`, `bigScreen`.
- Agriculture and salt: `crop(pb,x,y,kind,stage,seed,stress)`, `dripLine`, `shadeHouse`, `evapPond`, `saltPile`.

Elsewhere: `16_biomes.js` has `mangrove`; `40_common.js` has `drawSign(pb,x,y,text,col)` (tiny-font plate on a post).

**Dynamic (ctx, every frame):**
- `ART.turbine(g,x,y,size,angle,{col,shade,dark,tips,stopped})`: about 2 fillRects per tower row plus 3 `fline` blades, so roughly 170 calls per turbine.
- Fauna: `ART.bird` (6 px), `ART.flamingo`.
- `15_tech.js`: `drawStringLights`, `drawPaperWindmill`, `drawGasBubbles`, `drawSOCStrip`, `drawDrips`.
- Elsewhere: `drawLampPost`, `drawDrone` (41_lv01:408), `drawGoat` (48_lv08:159).
- `Charts.flow(g,pts,kind,rate,width)` (06_ui.js:514): **per-pixel `fpx` along the full pipe length times its width, every frame**.

### 1.5 Terrain (`src/30_world.js`)
- **`TERRAIN_MATS`** (line 14) entries look like `{ramp, top:[c0,c1], deco, base, wet?, grass?}`. Materials:
  - Natural: sand, beach, rock (`RAMP.mesa`, strata), salt, soil, dune, grassland.
  - Built: metal (plates), tile, stone (cobble), plaza (mosaic frieze).
- **`World`:**
  - `ground` is a Float32Array per x, built from `def.ground` points `[x,y,mode]`, where mode is smooth (default), `'lin'` or `'step'`.
  - `platforms`: `{x,y,w,type,post,kind,h,oneWay,dy}`.
  - `ladders`, `water: [{x0,x1,y,tint,deep,caustic,foam,alpha,turbid}]`, `wind`, `hazards`.
  - `ps = new Particles(1600)`.
- **`renderTerrain(world)`** (line 78) draws one world-sized canvas:
  - Row `d=0` is `top[0]` and `d=1` is `top[1]`.
  - Below that it picks a ramp index `base − floor(d/26)`, adds fbm speckle and edge light on slopes, then applies the material's deco.
  - Grass is drawn as 1–4 px blades, then `def.decorate(pb,world)` runs.
  - **There is no top face, no cliff or face geometry, and no ambient occlusion.**
- **`drawPlatform`** (line 142) draws wood, metal, rock, pipe, crate or salt with **per-frame `frect`**.

### 1.6 Water
`drawWaterFront` (`32_gameplay.js:267`) is drawn after the entities. It stacks three alpha rectangles (`tint` 0.55, `deep` 0.45, `#0d3168` 0.35, plus `turbid`), then caustics, then a **per-x `fpx` loop drawn three times** for the surface. Over sand this produces a muddy `#367788` (S 0.55, V 0.53); the reference's water is around `#0098c7` / `#05e5f4` (S near 1.0).

There is no seabed, no fauna, no foam at contact points, and it always runs to the bottom of the screen. Player wading is drawn with `fdither`. The sea in the backdrops is `ART.sea` plus wave bands, sparkles and glitter.

### 1.7 Particles (`05_engine.js:172–252`)
- **`PTYPES`** (22 kinds), each `{cols,g,drag,life,wind,size,fade|sparkle|streak|ring|glow|flutter|wobble|wander|glyph}`:
  - Ground and air: sand, dust, smoke, rain, windline.
  - Water: drop, splash, bubble, vapor, brine.
  - Salt and minerals: salt, crystal.
  - Plants: leaf, petal.
  - Energy and data: spark, energy, h2, o2, glitch, data.
  - Ambient: firefly, confetti.
- **`Particles(max)`** uses struct-of-arrays with `emit(type,x,y,vx,vy,n,spread)`, `update(dt)` and `render(g,ox,oy)`. Render is one `fillRect` per particle, plus glow.
- **Camera** (`05_engine.js:147`): `follow(e,dt,{look,vy})` with `ty = e.y − H·vy`, clamped to `[0, world.h−H]`. **Every level has `height: 360`, so `cam.y` is always 0 and the camera never moves vertically.** All levels use `cam.vy` 0.66.

### 1.8 Render order per frame (`32_gameplay.js:164–201`)
1. Sky (`B.sky` at `−oy·0.05`, or `def.renderSky`), then `def.skyFx`.
2. `B.drawClouds`, then `B.render('back')`.
3. `def.renderBack`.
4. **`propsC`** (world-sized static canvas, f=1, behind the terrain).
5. `def.renderMid`.
6. **`terrainC`**, then platforms (per frame), then ladders (per frame).
7. Entities sorted by `z` (stations, actors), then Kiru, then the player.
8. `drawWaterFront` for each water body.
9. `def.renderFront`.
10. **`propsFrontC`** (static, f=1).
11. Particles.
12. `B.render('front')`.
13. `def.renderGrade`, or a full-screen multiply with `def.grade`.
14. Lens (multiply plus grid).
15. Speech bubbles, interaction prompt, HUD.

**Prerendered:** sky, cloud sprites, backdrop layers, terrain, props, propsFront, `SpriteCache` characters, portraits.

**Drawn every frame:**
- Moving scenery: cloud positions, all `dyn` callbacks (turbines, glitter, waves, boats, flamingos, kites, LEDs).
- World objects: platforms, ladders, station sprites (`drawStationSprite`), water.
- Level hooks, particles and HUD.

### 1.9 Measured costs (headless Chromium, flushed with `getImageData`)

| Measure | Value |
|---|---|
| Frame time now | 2.7–4.0 ms flushed (3–5.3 ms unflushed), 534–2523 `fillRect` and 265–360 `drawImage` per frame |
| 2000 `fpx` | 1.0–1.6 ms (about 0.8 µs each) |
| 12 full-screen 640×360 blits | 1.8–2.0 ms (about 0.15 ms each, roughly 0.65 ns per pixel) |
| 400 small 16×16 `drawImage` | 1.2 ms |
| Level prerender | terrain 30–104 ms, biome 29–150 ms, props 4–18 ms; under 0.25 s per level in total |

**Budget for the redesign, keeping 2× headroom on this machine and well under 16.7 ms:**
- Fills: at most 2000 `fillRect` per frame.
- Sprites: at most 600 small `drawImage` per frame.
- Overdraw: about 14 screens per frame (layer pixels drawn ÷ 230k).
- Composite modes: at most 2 full-screen passes per frame.
- Prerender: up to about 1.5 s per level is acceptable.
- The costly per-frame loops today are `drawWaterFront`, `Charts.flow`, `ART.turbine` (lv5 has 9 turbines, about 1500 calls), `drawSeaSparkles`, `drawSunGlitter`, `drawWaveBands`, `drawPlatform` and `drawStationSprite`.

### 1.10 How levels compose scenes
- **Lv1** (`41_lv01.js`):
  - Ground ranges over y 242–306 (64 px). Water is `{1112–1580, y:293}`, only about 11 px above the bed.
  - `props()` hand-paints with `pb.rect`: Marea's stilt hut (lines 33–50), boats, rock blobs, drone pad, pump house (62–69), intake tower (75–82), pretreatment building with 4 tanks (84–90), and cacti on the cliff path.
  - `propsFront` is only grass. `renderBack` has the turbidity plume and gulls. `renderMid` has shore lines, tower lights, the gate, the drone, a jumping fish and a manometer.
- **Lv8** (`48_lv08.js`): flat ground at 266–286. `props()` has 3 raised beds with `ART.crop` and drip lines, a shade house, an adobe seed bank, the hydraulic node (well, tank, cistern, mixer, pipes), a 1-px flower meadow and one big tree. `renderMid` has drips, the salt roots-view overlay, goats and bees.
- **In general:** everything sits on one baseline around y≈280–290, which is about 80% of screen height. Buildings are front-elevation rectangles. In-world text is `drawSign` with 4-px glyphs. Proper labels exist only in the Lens view (`lensTag`).

---

## 2. Gap analysis against the reference

Metrics come from `stats.py` and `stats2.py`. "REF scene" is the reference scaled to 640 and cropped to (90,40)–(500,290) to exclude its UI. Game frames are cropped to y 36–322.

| Metric | Reference | Game (daylight levels) | Target |
|---|---|---|---|
| 8×8 blocks with luminance std > 10 ("busy") | 0.91–0.93 | 0.61–0.79 (lv5: 0.61, lv6: 0.52) | ≥ 0.85 |
| Flat 8×8 blocks (std < 3) | 0.02–0.04 | 0.03–0.21 | ≤ 0.05 |
| Mean run length between luminance edges, lower playfield | **2.56 px** | 3.7–12 px (lv1 5.4, lv5 9.7–11.9) | ≤ 3 |
| Same, sky area | 3.21 | 1.8–2.7 (Bayer noise) | ≥ 3 (smooth) |
| 1-px checker (ordered dither) pixels | **0.000** | 0.097–0.173 | ≤ 0.02 |
| Pixels with V < 0.5 | **29%** | 3–6% (lv0/1/4/8: 3–5%) | ≥ 25% |
| Pixels with V > 0.9 | 20% | 39–65% | ≤ 25% |
| Mean saturation (full frame) | 0.57 (0.52 scene crop) | 0.34–0.54 (lv2 0.34) | 0.50–0.60 |
| Sky and cloud share of frame | 0.23 | 0.45–0.52 | ≤ 0.30 |
| Depth planes | about 10–11 | 4–6 including sky and clouds | ≥ 8 |

**Per criterion:**

1. **Depth layers.** The reference has these planes:
   1. Sky and a large sun halo.
   2. High cumulus and cirrus.
   3. Lavender far ranges.
   4. Sculpted orange mid mountains.
   5. The hill city (Aridia dome) with turbines on the ridges.
   6. Terraces: crops, H2 plant, PV, waterfalls.
   7. The coast and far sea with whitecaps.
   8. The midground desal plant in 3/4 view.
   9. A wave line with foam over an underwater cutaway (fish, reef, plume).
   10. The playable cliff.
   11. Foreground occluders: signposts, lupines, hibiscus, leaves, overhanging canopy.

   The game has sky, clouds, one far ridge, the sea, one town strip, one dune strip, then props/terrain and grass. There are no front occluders.
2. **Density.** About 150 distinct objects are visible in the reference frame. Lv1 at x=1400 shows about 15. Vegetation spacing in the game is 22–60 px (`13_bg.js:200`); the reference is effectively continuous.
3. **3/4 perspective.** The reference camera is elevated by roughly 25–35°. Every element shows a top face: the platform, vessel tops, PV surfaces, terrace tops and the path on the cliff. The ground plane spans y≈235–510 of 633 (about 43% of the frame) and objects are spread through that depth. The game is pure side elevation; only `pvRow` has a parallelogram.
4. **Vertical composition.** The reference is a diagonal from the lower-left cliff to the upper-right city, and terrain covers about 85% of the frame height. In the game, gameplay sits on one line at y 280–300, strips are horizontal, the world is 360 px tall and the camera is vertically fixed.
5. **Vegetation.**
   - **Palette:** the reference greens are warm olive-lime:
     - Shadows and mids: `#111908 #232a0c #3b5320 #617517`.
     - Lights and highlights: `#91a229 #c1cd3d #d0d980 #ece355`.

     `RAMP.leaf` is cool mint emerald (`#33a552 #4ccb70 #86e36f`, hue about 135° against the reference's 70–75°).
   - **Rendering and variety:** the reference has 8 or more species, with leaves 3–6 px drawn individually and 5–7 tones. The game uses circle blobs (`shrub`, `tree`), 1-px grass and a 7-frond palm.
6. **Rock and cliffs.**
   - **Reference:** chunky columnar blocks 8–17 px wide and 6–12 px tall, with bevelled light, 1-px darkest cracks and ambient occlusion. The ramp is `#431509 #752f15 #a55320 #e29441 #f7c679` (hue about 22°, shadows red-brown).
   - **Game:** `RAMP.mesa` (pink, red, violet; `shade()` pushes shadows toward 255°). Strata stripe every 9 px in `renderTerrain`, and mesas are a striped layer cake (lv1 promontory, lv3).
7. **Water.**
   - **Reference, from top to bottom:**
     1. Breaking crest: cyan rim `#27e2e8`, foam `#dcf7fd` / `#fff`, shadow under the crest `#174c70`.
     2. Brilliant subsurface `#05e5f4` / `#00dbed`, fading through `#01b8da` and `#0098c7` to `#004274` and `#031b46`.
     3. Vertical light shafts.
     4. Fish 10–16 × 5–8 px, coral and kelp on the bed (`#085682 #0470a5 #16b1c3 #2ba58e`).
     5. Pipe outfalls; the brine plume `#d368bf #793b82 #5868be #e5c8f6` sinks and spreads.
   - **Far sea:** `#0199e1` to `#39b0e8`, with rows of whitecaps.
   - **Game:** translucent teal slabs, no bed, no fauna, no foam at contacts.
8. **Clouds.** The reference has cumulus 90–120 × 40–55 px in at least 5 tones with lavender-blue undersides (`#a9bdee #bdcaee #cad0e6 #e3e2eb #fff`), cirrus streaks, and some clouds occluded by mountains and turbines. The game has 40–120 px clouds in 4 tones with Bayer fringes, all in one band.
9. **Sun and halo.**
   - **Reference:** disc radius about 17 px (core `#fcf8cb`), smooth ring halo `#e8c89f`, `#ccb5b2`, `#acabc5` into sky `#859cd5` out to about 3.5r, and a brighter sky near the sun.
   - **Game:** radius 13 with a visible Bayer checker ring.
10. **Atmospheric perspective.** The reference uses 3–4 steps that keep form: far `#9884ab / #e3a289 / haze #b6c6ee`, mid with violet shadows `#435573 #85859d` and lit `#e7ac78`. The game mixes RGB 0.4–0.55 toward pale blue, which makes flat pastel strips.
11. **Saturation and palette.**
    - **Sky:** reference zenith `#1b65f3` (V 0.95) through `#3383f5`, `#45a8fd` and `#b4cef1` to a horizon of lavender-pink haze `#ae9fb9 / #c5a9b9`. `skyDay` starts at navy `#1a3a8f` and ends in cream `#d2f2ef / #fff3d4`.
    - **Brightness:** the game is high-key and washed out (V>0.9 on 50–65% of pixels).
    - **Per-system families required by the prompt:** lv3 must be deep blue, violet and magenta (it is salmon and pink now); lv6 needs electric blue and magenta; lv7 needs emerald, which is missing.
12. **Lighting.** The reference has rim light on clouds, turbines and cylinders, ambient occlusion in crevices and under objects, cast shadows from equipment on the platform, emissive glows (permeate pipes, Kiru, sun), white specular streaks on metal, and water reflections. The game has fixed left-lit shading, `fshadow` ellipses only for lv4 cloud shadows, `fdither` checker lamp halos, and flat multiply grades.
13. **Machinery.**
    - **Reference steel:** `#21242d #5a5961 #8f8f95 #c7dfdd` with a white specular, blue caps and bands `#245f90 #31b4e2`, dark bolted frames, yellow railings and concrete plinths (`#6c6461 #777a83 #cbbbaf`, lit top `#f5e3bf`).
    - **Reference H2:** `#125c38 #3d926a #54ce8c #85e7b9` with white columns.
    - **Game:** front rectangles in `#e8f0f4 / #a9bbd6`, `tank` with vertical bands, flat `roRack`; no top faces, frames or bolts.
14. **Pipes and stream colours.**
    - **Permeate:** in the reference, glowing cyan tubes (`#1ebde3 #6de1f1`, core `#d0f4f8`) with white chevrons.
    - **Seawater:** steel blue-grey.
    - **Brine:** a **dark graphite-navy pipe** (`#12162f #584f56`, highlight `#9485ac`). Magenta appears only in the plume. The game paints the brine pipe body magenta (`PIPE_PAL.brine`).
15. **Labels in the world.** The reference has 7 permanent labels. Each is a navy box `#030e25` with a 1-px border (`#2c4559`, rim `#4e89a6`, glow `#96e7fc`), white bold caps about 5 px tall, about 35×10 px, with a leader line. Variants: brine has a `#9485ac` border, H2 a green background. The game uses `drawSign` 4-px plates; real labels appear only in the Lens.
16. **Foreground occluders.** The game has only grass in `propsFront`. The reference covers about 15% of the frame with occluders, kept to the edges.
17. **Ambient animation.** The reference implies waves and foam, fish, an eagle (about 28×14 px), drones, turbines, waterfalls, flow chevrons and swaying foliage. The game has drifting clouds, 6-px gulls, sparkles, turbines, flamingos, kites and LEDs.

---

## 3. Art kit plan

### 3.1 Style lock: environment palettes
Put these in a new `17a_kit_palette.js` as `RAMP` additions, dark to light. All values are measured from the reference.

| Ramp | Values |
|---|---|
| `skyRef` | `#1b5fe8 #2068ee #2a78f2 #3486f4 #3f94f6 #46a2f9 #5cb0fa #8cc2f4 #b4cef1`; horizon haze `#ae9fb9 #c5a9b9 #d3c0cc` |
| `cloudRef` | `#7f97d8 #a9bdee #c6d3f2 #e0e6f6 #f3f5fb #ffffff` |
| `sunRef` | core `#fffbe0`, disc `#fcf8cb`, rings `#f4e2a8 #e8c89f #ccb5b2 #acabc5` |
| `mountFar` | `#6f6a94 #8c7fa6 #9884ab #b39aae #d29a8c #e3a289` |
| `mountMid` | `#2f3a58 #435573 #6b5866 #7f5d57 #aa7359 #cf8c63 #e7ac78 #f2c79a` |
| `rockWarm` | `#2a0c04 #431509 #5e2210 #752f15 #a55320 #c8732e #e29441 #f7c679 #fde3a8` |
| `sandPath` | `#361e14 #8e5923 #b8793a #cf9749 #e8b565 #f6c97d #fde2a6` |
| `foliage` | `#111908 #232a0c #3b5320 #617517 #91a229 #c1cd3d #d0d980 #ece355`; `foliageLush` = hue +15°, sat +10%; `foliageStress` = shift toward ochre (use `rampLerp` to show stress gradually) |
| `palmTrunk` | `#191e05 #3c3210 #6b5020 #a57432 #d09a4a #ebbe64` |
| Flowers | hibiscus `#5a0a14 #b71a1e #e5485a #ff8a8a`; lupine `#1d0a23 #311f57 #653693 #9a6ad8 #c9a8f0`; bougainvillea `#6a1450 #c02a8a #f060b8` |
| `seaFar` | `#0a6fb8 #0189d4 #0199e1 #1ea4e9 #39b0e8 #7cc8f0` |
| `seaSurf` | `#00568a #0182ae #027bbe #27cee1 #27e2e8 #c0ebf7 #ffffff`; shadow under crest `#174c70` |
| `underwater` | `#031b46 #003265 #004274 #05638d #0098c7 #01b8da #00dbed #05e5f4` |
| `reef` | `#1b434d #085682 #0470a5 #16b1c3 #2ba58e #368969`; accents `#ff6b6b #f78acb #ffb86b` |
| `brinePlume` | `#241f48 #3a2a80 #5868be #793b82 #d368bf #e5c8f6` |
| `steelRef` | `#141820 #21242d #3a3d48 #5a5961 #8f8f95 #b5c4c8 #c7dfdd #f4fbff`; accents `#163e66 #245f90 #31b4e2` |
| `permGlow` | `#0f273f #106a8a #1ebde3 #6de1f1 #d0f4f8 #ffffff` |
| `brinePipe` | `#0b0e20 #12162f #2a2c44 #584f56 #9485ac` |
| `concrete` | `#2a3444 #324355 #5a5658 #6c6461 #777a83 #a89c92 #cbbbaf #f5e3bf` |
| `h2Ref` | `#0a3a24 #125c38 #2a7a52 #3d926a #54ce8c #85e7b9 #e3e9e1` |
| `pvRef` | `#1c2a58 #374f85 #526796 #7a84a3 #9faccc #d7d8e3` |
| `wood` (signposts) | `#200a04 #422016 #5b2e21 #8f5530 #c39972 #e2c49a` |
| `domeGlass` / `stoneWarm` | `#3e6a80 #5aa0b0 #85cdd4 #92dbdb #cedee7 #fff` / `#4c3b2c #8a6a50 #bd8f70 #ecc8a3 #fbe6c8` |
| `waterfall` | `#4a7a94 #73a8c4 #9cc9df #bedfed #e5f2f3 #ffffff` |
| `labelUI` | bg `#030e25`, border `#2c4559`, rim `#4e89a6`, glow `#96e7fc`, text `#ffffff`/`#daeff9`; brine border `#9485ac`; H2 bg `#0e3a2a` / border `#40d08a`; agriculture bg `#123a1c` / border `#7fd060` |

### 3.2 Rendering rules
- **No Bayer dither on large gradients.** Replace `rampDither` in skies and big fields with `smoothBand(ramp,t,x,y)`: 24–32 interpolated steps, with band edges jittered ±1–2 px by `hash2` clusters 2–3 px wide. Ordered dither is allowed only in transition zones under 6 px.
- **Shadow hue.** Add `shadeTo(hex, amt, hueTarget, satBoost)`. Warm materials shift toward 12–18°; distant and cool ones toward about 250°. The current `shade()` forces violet on everything.
- **Key light** from the upper left, `dir(-0.6,-0.8)`, warm `#fff1c8`.
  - Rim light (1 px, sun-side colour `#fff6d8`) goes on silhouettes at z ≥ 0.3.
  - Ambient occlusion is 1–2 px of the ramp's darkest tone under overhangs, in cracks and at ground contacts.
- **Outline.** Use a selective outline (`darkOf(u,-0.55)`) on bottom and right silhouette edges, only for planes with f ≥ 0.9. Distant planes get no outline.
- **Detail grain.** Every non-sky surface is textured in 1–3 px clusters. No flat run longer than 6–8 px except in sky and water bands, which keeps the mean edge run at or below 3 px.
- **Parallax (physically consistent).**
  - Ground bands: `f = (y_band − y_horizon)/(y_play − y_horizon)` and `fy = f`.
  - Mountains: f between 0.02 and 0.12, with `fy ≈ f`.
  - Front occluders: f between 1.15 and 1.4.
  - Haze per plane: `k = hazeMax·(1−f)^1.4`, with hazeMax 0.45–0.6. Haze is a per-colour mix cached in a Map; it keeps the value relationships and adds about 15% extra at the plane's bottom for mist.
- **Scale at 640×360** (reference ×0.569):

  | Element | Size (game px) |
  |---|---|
  | Big cumulus | 90–120 × 40–55 |
  | Sun | disc r 10–12, halo out to 3.5r in 4 rings |
  | Turbines | midground 45–70 tall; lv5 foreground 160–220 |
  | Far peaks | 60–110 above the horizon |
  | Cliff blocks | 8–17 × 6–12 |
  | Palms | 50–80 tall (foreground 90–120), 9–12 fronds |
  | Tree canopies | 40–70 |
  | Fish | 10–16 × 5–8 |
  | RO vessels | length 60–70, radius 5–6 |
  | PV modules | about 10×6 midground, 30–40 foreground |
  | Wave crest | 6–10 |
  | Visible cutaway depth | 80–140 |
  | Labels | tiny font, about 35×10 box |

### 3.3 File split for parallel work
The build sorts files alphabetically. `const ART` is in 12, and `TERRAIN_MATS` (in 30) reads `RAMP` when the file loads, so palettes must sort before 30. In the sort, `'19_' < '1a_'`, and `'99_main' < '99b_'`.

| File | Owner | Contents |
|---|---|---|
| `17a_kit_palette.js` | Art lead | Ramps from §3.1, `shadeTo`, `rampLerp`, `P32(ramp)` (Uint32 array cache) |
| `17b_kit_core.js` | Engine A | PixelBuffer extensions (`setU`, fast writes), `smoothBand`, post-process passes (fx), `SpriteStrip`, `Patterns`, `VISTA` composer, `Backdrop.prototype.plane/floorBands/cloudDeck` |
| `17c_kit_sky.js` | Environment B | Sky, sun, cumulus, cirrus, god rays |
| `17d_kit_terrain.js` | Environment B | Mountains, cliffs, terraces, dunes, boulders, `TerrainKit.render`, prerendered platforms |
| `17e_kit_flora.js` | Environment C | All vegetation, sway strips |
| `17f_kit_water.js` | Water D | `WATER_KINDS`, `Water.build/renderBack/renderFront`, reef, cutaways, waves and foam, waterfalls, outfalls, plume particle |
| `18a_kit_infra.js` | Tech E | `box3q`, cylinders, plinths, frames, railings, `pipeRun`, `glowPipe`, desal units |
| `18b_kit_energy.js` | Tech E | PV in 3/4, turbines, BESS, H2 |
| `18c_kit_arch.js` | Environment F | Houses in 3/4, Aridia dome, greenhouse, signposts, `WorldLabels` |
| `19_kit_light.js` | Engine A | Light presets, `Glow`, cloud shadows, gradient grade |
| `1a_kit_fauna.js` | D | Fish schools, eagle, gulls, drones, goats and flamingos as strips; new `PTYPES` |
| `1c_bio_<name>.js` (one per biome) | Biome owners | Rewrites of `BIOMES.*` that override the old definitions (the later file wins); remove the old definitions afterwards |
| `99c_kittest_<area>.js` | Each owner | `TESTS.kit_<area>` gallery scene for screenshot comparison against the reference crops |

Edits to shared files should be small and done by one integrator:
- `13_bg.js`: Backdrop render by z and an f>1 front path.
- `30_world.js:78`: delegate to `TerrainKit.render(world)`.
- `32_gameplay.js:164–201`: new render order (§3.6).
- `06_ui.js:514`: `Charts.flow` uses patterns.

### 3.4 New generators
Static generators draw into a PixelBuffer; dynamic ones draw on the context.

**`17b_kit_core.js`**
- `ART.fx.haze(pb, hazeHex, k, {mistBottom, mistLen})`
- `ART.fx.rim(pb, dir=[-1,-1], col, {width:1})`
- `ART.fx.ao(pb, k, r=2)`
- `ART.fx.selOut(pb, amt=-0.55, sides='br')`
- `ART.fx.castShadow(dstPB, maskPB, dx, dy, amt)`: shears the prop mask along the light direction and darkens only opaque destination pixels.
- `ART.fx.clusters(pb, x,y,w,h, ramp, density, size)`: painterly texture.
- `makeStrip(n, w, h, drawFrame(pb,i))` returns `{c,n,w,h}`; `drawStrip(g, s, i, x, y)`.
- `Patterns.get(key, w, h, draw)` and `fillScroll(g, pat, x,y,w,h, offX, offY)`.
- `VISTA.fFromY(y, yh, yPlay)`, `VISTA.hazeK(f)`.
- `B.plane({z|f, y, h, draw, haze, hazeCol, rim, fy, dyn, clouds, front})`.
- `B.floorBands({yh, yPlay, n:6..8, draw(pb, band{f,scale,y}, w)})`: the 3/4 receding floor, with props placed per band at scale `0.25+0.75f`.
- `B.cloudDeck({f, n, w:[30,180], y:[8,110], pal, kind:'cumulus'|'cirrus', behind:planeIdx})`.

**`17c_kit_sky.js`**
- `ART.skyV2(pb, stops[[t,hex]], {horizonY, sun:{x,y}, sunBrighten:0.25, haze:{col,h}})`: banded; replaces `ART.sky` and `makeSkyCanvas`.
- `ART.sunV2(pb, cx, cy, r, {rings:4, haloR:3.5, cols:sunRef})`.
- `ART.cumulus(w, h, seed, {pal:cloudRef, light, rim:'#ffffff', flatBase:0.15, puffs:6..12})`: sphere union with normal-based shading in 6 tones and scalloped edges. Replaces `ART.cloudSprite`.
- `ART.cirrus(w, h, seed, pal)`, `ART.cloudBank(pb, y, w, seed, pal)` (horizon bank partly behind mountains).
- `ART.godRays(w, h, angle, n, col)`: a canvas drawn per frame with `lighter` at alpha 0.06–0.12, drifting slowly.
- `ART.starfield` and `ART.auroraBand` for lv7.

**`17d_kit_terrain.js`**
- `ART.mountains(pb, {baseY, peaks:[{x,h,w}], seed, ramp, light, ridged:0.6, ravineAO:true, veg:{ramp,density}})`: 2-D ridged-fbm relief, normal times light, quantised to the ramp. Replaces `ART.ridge({mesa})` for every range.
- `ART.cliffBlocks(pb, x, y, w, h, {ramp:rockWarm, block:[8,17], rowH:[6,12], bevel:2, crack:'#2a0c04', ledges:true, plants:fn})`.
- `ART.terraceSteps(pb, x, baseY, {steps, stepH:[18,30], stepW, wall:'redrock'|'stone', top:'crops'|'orchard'|'grass', channel:true, falls:[i]})`.
- `ART.dunesV2(pb, {yBase, amp, seed, ramp, shadowHue:270, ripples, veg})`: organic crests, curved slip faces, violet shadow. Replaces the triangular `ART.dunes`.
- `ART.boulder(pb,x,y,rx,ry,ramp,seed)`, `ART.rockScatter(pb, tops, x0,x1, density)`, `ART.headland(pb, x, y, w, h, {foam:true})`.
- `TerrainKit.render(world)` returns `{surfaceC, terrainC, cutaways[]}`; details in §3.7.
- `TerrainKit.platform(pb, p)`: prerenders static platforms with a 3/4 top. Only moving platforms (`p.dy`) stay dynamic.

**`17e_kit_flora.js`**
- `ART.leafCluster(pb, cx, cy, r, ramp, seed, {leaf:[3,6], density, light})`: the base primitive.
- `ART.treeV2(pb,x,y,h,seed,{kind:'broad'|'acacia'|'moringa'|'olive', ramp})`, `ART.palmV2(pb,x,y,h,lean,seed,{fronds:9..12, leaflets:2, fruit})`.
- `ART.bushV2`, `ART.grassTuft(pb,x,y,w,h,ramp,seed)`, `ART.fern`, `ART.agaveV2`, `ART.cactusV2`, `ART.mangroveV2`.
- `ART.flowerPatch(pb,x,y,w,kind,seed)`, `ART.lupine(pb,x,y,h,seed)`, `ART.hibiscus(pb,x,y,r,seed)`.
- `ART.cropBed3q(pb,x,y,w,depth,kind,stage,stress,seed)`: rows in 3/4. It wraps the existing `ART.crop` logic with the new ramps.
- `ART.canopyOverhang(pb, side, w, h, seed)`: for front planes.
- `ART.vegScatter(pb, tops, x0, x1, {density, mix, scale, ramp})`.
- `FLORA.swayStrip(drawFn, w, h, frames=3, amp=1)`.

**`17f_kit_water.js`**
- `WATER_KINDS`, each `{surf, foam[], body[], rays, sparkle, plume?}`. Kinds and colours (none of them scientifically misleading):

  | Kind | Look |
  |---|---|
  | `sea` | underwater + seaSurf ramps |
  | `pretreat` | slightly greener and clearer, with flocs |
  | `permeate` | crystalline light cyan, with sparkles |
  | `brine` | deep blue-violet `#0e1a5a #241f6a #3a2a80`; plume in brinePlume |
  | `irrigation` | turquoise-green |
  | `well` | brackish amber-teal |

- `ART.seaFar(pb, y0, y1, {ramp:seaFar, whitecaps:true})`: static whitecap rows that get denser toward the viewer.
- `Water.build(world)` returns the prerendered body canvases: depth gradient, light shafts, seabed, `ART.coral(pb,x,y,kind,size,ramp)`, kelp, rocks.
- `Water.renderBack(g, sc)`: opaque cutaways plus fish.
- `Water.renderFront(g, sc)`: surface crest strip, contact foam, translucent wade water.
- `ART.waveCrestStrip(kind, w=64, h=18, frames=8)`, `ART.foamSprayStrip(frames=6)`, `ART.waterfallV2(pb,x,y,w,h)` plus `waterfallStrip`.
- `ART.outfall(pb,x,y,dir,kind)` with a `PTYPES.plume` particle that sinks along the bed and dilutes as it travels. This is correct for dense brine.
- `Water.reflect(g, src, yLine, h, k)`: row-offset reflection, 20–40 `drawImage` calls.

**`18a_kit_infra.js` (desalination and water)**
- `ART.box3q(pb,x,y,w,h,d,pal,{shear:0.6, top, side, stains})`: the basis of every 3/4 building and plinth.
- `ART.cylinderH(pb,x,y,len,r,pal,{caps:'#245f90', bands, spec:true})` and `ART.cylinderV(pb,x,y,r,h,pal,{dome,bands,ladder,label})`.
- `ART.concretePlinth(pb,x,y,w,h,d,{blocks,stains,waterline})`, `ART.frameRack`, `ART.railing(pb,x0,x1,y,'#f0c040')`, `ART.catwalk`.
- `ART.pipeRun(pb, pts, r, kind, {flanges:22, elbows:true, supports})`, `ART.glowPipe(pb, pts, r)`.
- Runtime `FlowFX.draw(g, run, rate)`: a scrolling chevron pattern, one fill per segment. It replaces the per-pixel body of `Charts.flow`.
- Desal units: `ART.intakeStructure`, `ART.mediaFilters(pb,x,y,n)`, `ART.roTrain3q(pb,x,y,rows,cols)`, `ART.hpPumpV2`, `ART.erd`, `ART.permeateTank`, `ART.postTreat`, `ART.valveWheel`, `ART.gauge`.

**`18b_kit_energy.js`**
- `ART.pvArray3q(pb,x,y,cols,rows,{tilt,frame:'#d7d8e3',soiling})` and `PV.trackerStrip(angles=5)`.
- `ART.turbineTower(pb,x,y,h)` plus `Turbine.rotorStrip(size, frames=12)`. A 3-blade rotor repeats every 120°, so 12 frames cover a full turn. Blades are 3-tone with red tips. This replaces per-frame `ART.turbine`.
- `ART.bess3q`, `ART.inverterCabinet`, `ART.transformer`, `ART.powerLine`.
- `ART.electrolyzer3q`, `ART.h2TankV(pb,x,y,r,h)` (h2Ref with white caps and an H₂ mark), `ART.compressor`, `ART.ventStack`.

**`18c_kit_arch.js`**
- `ART.houseV2(pb,x,y,w,h,d,seed,{roof:'dome'|'terrace'|'windcatcher', solar, plants, awning})`, `ART.domeCity(pb,x,y,s)` (Aridia), `ART.towerLab`, `ART.greenhouse3q`.
- `ART.signpostCluster(pb,x,y,[texts])`: wood ramp with readable text.
- `WorldLabels.draw(g, cam, list[{x,y,title,sub,theme,anchor}])`: drawn every frame for crisp text, culled off-screen, fading near HUD panels.

**`19_kit_light.js`**
- `LIGHT_PRESETS`: noon, golden, dusk, night, storm and interior, each `{dir, key, shadowHue, rim, amb}`.
- `Glow.sprite(r, col, rings=4)` (cached, banded rings) and `Glow.draw(g,x,y,r,col,a,op='lighter')`. This replaces the `fdither` halos.
- `CloudShadows.draw(g, B, cam)`: prerendered soft ellipses composited with multiply. It must keep driving `cloudShadowAt` for the lv4 science.
- `Grade.apply(g, preset)`: vertical warm-to-cool gradient plus a light vignette, at most 2 full-screen passes.

**`1a_kit_fauna.js`**
- `FishSchool({x0,x1,y0,y1,n,kind,avoid})`: 2-frame tail, boids-lite, avoids an active intake.
- `ART.eagleStrip` (6 frames, 28×14), `ART.gullStrip` (4 frames), `ART.droneStrip` (4 frames, blinking LED); goats and flamingos ported to strips.
- New `PTYPES`: plume, foam, spray, pollen, plankton, heat, leafBig.

### 3.5 Existing code to rewrite or retire
| Rewrite or retire | Replacement |
|---|---|
| `ART.sky`, `sunDisc`, `cloudSprite`, `ridge` (mesa strata), `dunes`, `palm`, `tree`, `shrub`, `grass`, `house` | `*V2` versions in §3.4 |
| `pvRow`, `tank`, `pipe`, `roRack`, `electrolyzer`, `h2tank`, `batteryContainer` | 3/4 versions in §3.4 |
| `drawWaterFront`, `drawSeaSparkles`, `drawWaveBands`, `drawSunGlitter` | `Water` and strips |
| `drawPlatform` | prerendered into the terrain |
| `drawStationSprite` | cached sprites per kind and state |
| `Charts.flow` body | `FlowFX` |
| `PIPE_PAL.brine` | graphite body (magenta only in the plume) |
| `drawSign` | `signpostCluster`, or `WorldLabels` for system names |
| `RAMP.leaf` / `mesa` for natural terrain | `foliage` / `rockWarm` |
| `CLOUD_PALS.day` | `cloudRef` |
| `skyDay` | `skyRef` |

### 3.6 Engine hooks and new render order
1. Sky canvas.
2. God rays.
3. Cloud decks attached to each plane, interleaved with the planes so some clouds sit behind mountains.
4. Back planes in ascending f, each followed by its dyn overlays and strips (turbine rotors, drones, eagle).
5. Floor bands.
6. `renderBack`.
7. **`surfaceC`**: the top-face strip from `gy − surfDepth` up to `gy`.
8. `propsC` with cast shadows baked in.
9. `renderMid`.
10. **`Water.renderBack`**: cutaway bodies, fish and shafts.
11. `terrainC`: from `gy` down, with the lip, front faces and transparent holes over cutaways.
12. Moving platforms, then ladders.
13. Entities.
14. `Water.renderFront`.
15. `renderFront`, then `propsFrontC`.
16. Foreground sway strips.
17. Particles.
18. **Front planes (f>1)**.
19. `Glow` additive pass.
20. `Grade`.
21. Lens, bubbles, prompt, HUD.

Splitting the terrain into `surfaceC` and `terrainC` gives every level a 3/4 ground without changing any level code. Props stay behind the walk line as they do now, but stand on top of the back half of the surface.

### 3.7 Restructuring levels
- **Vertical framing:**
  - Outdoor levels move to **`height: 420–460`** and **`cam.vy: 0.58–0.60`**. Extra height is added below, so existing coordinates are unchanged.
  - With ground at about 282, `cam.y` becomes about 73 and the ground lands at screen y about 209, leaving about 150 px of face below.
  - Before switching, audit every `H` used as a world coordinate: `grep -c "\bH\b"` finds 4–21 per level file.
- **Ground arrays:** add terraces with `'step'` segments of 18–40 px. Jump height is about 74 px and `stepH` is 7, so these are jumpable. Add cliff drops with a `'cliff'` mode, which `TerrainKit` renders as `cliffBlocks` side faces. Spread surface y over 150–300 so the composition reads as a diagonal.
- **`TERRAIN_MATS2`:** `{surf:{ramp, tex:'path'|'grass'|'ripples'|'deck'|'paving', depth:6..10}, lip:[hi,mid], face:'blocks'|'strata'|'soil'|'concrete'|'metal'|'cutaway', faceRamp, ao, plants}`. New materials:
  - `pier`: deck top, cutaway face.
  - `seawall`.
  - `cliffSea`: blocks down to sea level, then the cutaway.
  - `soilSection`: the lv8 roots map with roots, moisture and salt.
- **Cutaway faces as a signature.** Under a pier or sea wall the terrain canvas is transparent between pillars. The water body, seabed and fish show through from `Water.renderBack`. The player walks on the deck and never enters deep water, so no swimming mechanic is needed. Science overlays sit in the same window: the intake screen and approach velocity (lv1), the brine plume sinking along the bed (lv3), and roots (lv8).
- **New level fields:**
  - `vista:{preset, light, planes:[…]}` read by the biome builder.
  - `water[].kind / bed / cutaway / fauna{fish,coral} / outfalls / waves`.
  - `fg:[…]` for occluders on front planes, kept to about 15% of the frame and to the edges (y<40, y>320, x<60, x>580).
  - `labels:[…]`, `lights:[…]`.
  - `propsFront` stays for static grass and flowers in front of the feet.
- **Interactive structures** at f=1 (pump house, tower, filters, RO trains) are redrawn with `box3q`, `cylinder*` and `pipeRun` so they show top faces, as in the reference.

### 3.8 Performance strategy
- **Prerender everything static.** Use `P32` palettes and direct `data[i]` writes in inner loops; avoid `pb.set(hex)` and `U()` per pixel. Blit small tile variants (rock blocks, crop heads, PV modules, foliage clusters) instead of regenerating them.
- **Cache layers** in `BG_CACHE` by `levelId|w|h|ver`, so checkpoint restarts are instant. Evict all but the 2 most recent levels.
- **Animate with strips and patterns.**
  - Strips: wave crests (8 frames), foam (6), waterfalls (4–6), turbine rotors (12), foliage sway (3), fish (2), birds (4–6), flags (4), PV trackers (5).
  - Scrolling patterns: permeate chevrons, waterfall streaks, wind lines.
  - Cached radial glows.
- **Budget** (§1.9): at most 2000 `fillRect` and 600 small `drawImage` per frame, about 14 screens of overdraw, at most 2 composite passes, and at most 1.5 s prerender per level. Expected memory is 30–60 MB of canvases per level (a full-width f≈1 layer at 3400×440 is about 6 MB). Layers with f<0.3 are narrow.
- **Quality tier** `settings.quality`. Low means half the floor bands, no god rays, half the fish and no reflections.
- **Validate on real devices** with the existing `settings.showFps`.

### 3.9 Acceptance tooling
Copy `stats.py` and `stats2.py` into `tools/artmetrics.py`. Gate each biome on the targets in the §2 table: busy ≥ 0.85, flat ≤ 0.05, edge run ≤ 3, checker ≤ 0.02, V<0.5 ≥ 25%, V>0.9 ≤ 25%, mean saturation 0.50–0.60, sky ≤ 0.30, planes ≥ 8. Also do a side-by-side visual review against `env_ref_640.png` and the prompt's §46 1–5 scorecard before rolling out beyond the slice.

---

## 4. Per-level vistas

| Lv | Biome | Redesigned vista (keeping the science content) |
|---|---|---|
| 0 El Mapa del Nexo | plaza | The most literal match to the reference's panorama. Aridia's glass dome city sits on a terraced hill, with waterfalls from its cistern. The whole nexus is visible in depth bands: coast and desal plant, PV, ridge turbines, emerald H2 tanks, crop terraces. The festival plaza is in 3/4 with stalls, bunting and crowds. Foreground has string lights, planters and bougainvillea. |
| 1 La Boca del Mar | coast | **Vertical slice.** Cliff-path start with a signpost cluster, lupines and hibiscus. Beach with Marea's stilt hut and tidal-pool reef. Intake tower and pump house in 3/4 on a concrete pier with a **cutaway**: intake screen, low-velocity fish passage (lens tag `v aprox. m/s`), and the turbidity plume as a brown cloud. Pretreatment media filters as `cylinderV`. Background: headland and lighthouse, sculpted orange mountains, the distant city and turbines. Breaking waves with foam. |
| 2 El Laberinto Osmótico | plant interior | Bright white-steel, aqua, cyan and blue interior in 3/4. The back windows show the coast panorama. A mid row of `roTrain3q`. Foreground manifolds and railings on f>1 planes. Permeate in glowing cyan; concentrate as graphite pipes with violet indicators. Skylight shafts and a reflective grating floor. HP pump and ERD as 3/4 skids. |
| 3 Los Cañones de Sal | canyon | Dusk in deep blue, violet and controlled magenta with clear crystals. Blue-violet canyon walls (`cliffBlocks` with a cool ramp) and salt veins. Evaporation-pond terraces stepping down to the sea. An outfall **cutaway** where the plume sinks along the bed and dilutes, with monitoring buoys and flamingos in the wetland. |
| 4 Las Dunas Fotónicas | pvdunes | Yellow, orange and sky blue with violet shadows. PV tracker rows in 3/4 across floor bands, close-up panels on a front plane (as in the "3. SOLAR" card), cloud shadows sweeping the rows and visibly cutting output, heat shimmer, inverter workshop with cable trays, violet far mesas, golden-hour variant. |
| 5 Las Torres de Brisa | windcliffs | Cyan, white, blue and teal-green. High sea cliffs (the existing 270→430 chasms become block faces) with breaking surf below (height 460). Foreground turbines 160–220 px tall plus a receding wind farm. Wind-swept grass, pink flowering bushes, windsocks and flags, met mast and Nimbo's kites. Fast clouds and wind lines. |
| 6 La Bóveda de Carga | vault | Electric blue, magenta, indicator green and graphite. Rock hall with violet mineral veins. BESS racks receding in depth bands. Cable trays with glow flows (charge and discharge colours). Glass control room at the back with screens, HVAC steam and a reflective floor. |
| 7 La Ciudadela del Hidrógeno | citadel | Blue hour in emerald, cyan, white and electric blue. White-steel citadel with emerald `h2TankV` and white columns (as in the "5." card). Electrolyzer hall with glowing stacks and rising bubbles. UPW lines in bright cyan, H2 in emerald and white. Vent stacks with marked safety zones. Bay with city reflections and a starfield or aurora band. |
| 8 El Oasis de las Raíces | oasis | Rich greens, warm browns, coral flowers and turquoise irrigation. `terraceSteps` with `cropBed3q` rows and turquoise channels feeding small falls between steps (the reference's right side), shade house and greenhouse, palms and broad trees, pollinators and goats. Arid dunes in the distance for contrast. Roots Map as a **soil cutaway** showing salt, moisture and roots. Stress shown gradually with `rampLerp`. |
| 9 La Mesa del Nexo | council interior | Royal blue, gold, coral and emerald. Grand hall whose arched windows frame the full Aridia panorama at dusk. Columns, mosaic frieze, a glowing hologram twin table with the nexus diagram, benches in 3/4, warm pools of light. |
| 10 La Gran Calima | calima | Orange, red, ochre and atmospheric violet. The full SYNARA traverse under a dust wall, with MIRAGE as the storm mass (the "7." card). 5 or more haze steps from orange to violet with silhouettes still readable. Cyan and red emergency glows, dusty PV, feathered turbines, sand streams. Colour families return as the crisis resolves (blue gaps in the sky). |
| 11 La Primera Cosecha | plaza epilogue | Lv0's city, restored. Every chromatic family returns at golden hour: green terraces, clean PV, spinning turbines, mangrove restoration on the coast, flowing water, festival lights. The "NEXO FINAL" floating city with waterfalls forms the back plane as the closing image. |