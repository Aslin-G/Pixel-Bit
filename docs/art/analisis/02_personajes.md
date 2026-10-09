# Characters, NPCs and dialogue portraits: current rendering vs the reference, and how to close the gap

The current rig is close to the reference on proportions (both about 3.2 heads tall) and on overall saturation. The gap is elsewhere:

- **Size:** sprites are about 22% too small (57 px vs 72–74 px tall).
- **Light:** the key light comes from the wrong side.
- **Outlines:** they are too light and too colored.
- **Hair, eyes, costume:** hair is built from round "grape" circles, eyes are 2×4 rectangles, and costumes have few parts.
- **Silhouettes:** NPCs all share one body.
- **KIRU:** it is a completely different design from the reference.

I ran two quick tests in a sandbox page, with no repo files changed. They show that the SDF rig can reach the reference look once it gets the right primitives, materials and post-processing passes. My recommendation is a **hybrid**: keep the SDF rig and its motion, add new primitives, a material system and image passes, and hand-author small pixel templates for faces and costume details.

Image files from this analysis are in `/tmp/claude-0/-home-user-Pixel-Bit/3de6e308-5c98-5496-b62a-c6dd2f26bdb0/scratchpad/art_analysis/`:
- `ch_sbs_amaya.png`, `ch_sbs_kiru.png`, `ch_sbs_portrait.png`: reference vs current, at the same 640×360 scale.
- `ch_proto.png`: test 1 — current Amaya, then light + outline fix, then reference palette.
- `ch_proto2.png`: test 2 — about 60 lines of rig changes: tapered-strand ponytail and bangs, goggles, backpack, 3×5 eye, warm outline, front light.
- `ch_g2_*.png`: labeled 5 px grid crops of the reference.
- `ch_km_*.png`: palette clusters extracted from the reference.
- `ch_raw_*.png`: current sprites and portraits at 1×.

---

## 0. Reference measurements (the ground truth)

The reference image is 1125×633. One logical pixel at 640×360 equals 1.758 reference pixels (factor 0.569).

I estimated the reference's own pixel size by downsampling it and measuring the error. The error stays flat between 1.25 and 2.0 reference pixels and jumps at 2.5. So one "art pixel" in the reference is about 2 reference pixels, which is about 1.1 logical pixels.

**This means 640×360 already matches the reference's pixel density.** Measurements converted to logical pixels below can be used directly as targets.

| Measure (logical px) | Reference | Current |
|---|---|---|
| Amaya, top of head to sole | **72–74** (+3–4 ponytail = 76) | **57** (head top y≈22 → sole y=79), +11 for the curly puff |
| Head height × width | **23 × 22** | 18 × 19 (`headRY` 9, `headRX` 9.5) |
| Head : torso : legs | 23 : 21 : 28 (1 : 0.92 : 1.25), **3.2 heads** | 18 : 15 : 24 (1 : 0.83 : 1.33), **3.2 heads** |
| Width at run pose / idle | 38 (backpack to fist) / ~30 | 26 (bounding box at idle) |
| Near eye | ~3×5 + lash flick | 2×4 solid rectangle (2 eyes, 4.5 px apart) |
| KIRU total / head / visor / each eye | **48×55** / 33×28 / 18×18 / 3×7 glowing | 33×33 bounding box / 17×14 head / 11×9 screen / 2×4 |
| HUD portrait frame | ~57×52; face about 26 wide; eyes ~5×5 | none (no HUD portrait exists) |
| Character height / screen height | 21% | 19% with the puff, 16% without |

**Reference outline:** near-black and warm, at #120305 / #120509 (V≈0.07). The hair edge is #2d0706. KIRU's outline is #070813 (navy-black).

**Reference light:** key light comes from above and in front, so the face is lit. Lit skin is #f9a879, and shadow on the back of the head is #964831.

**Saturation is not the problem.** Mean saturation / brightness of opaque pixels:

| | Saturation (mean) | Brightness (mean) |
|---|---|---|
| Current Amaya | 0.57 | 0.42 |
| Reference Amaya | 0.63 | 0.47 |
| Current portrait | 0.59 | 0.53 |
| Reference HUD portrait | 0.66 | 0.45 |

The differences are in hue choice, outline brightness, shapes, size and number of parts.

---

## 1. Current architecture (exact)

### 1.1 Rig (`src/10_rig.js`)

**`LIGHT` (L9):** `normalize([-0.55,-0.7,0.62])`. The light comes from the upper-left and front. For a sprite facing right, that is from **behind** it, so the face falls in the shadow band.

**`SDF` (L12–58):** distance functions `circle`, `ellipse(rot)`, `capsule(ra,rb)`, `box(r,rot)`, `poly`, `union`, `smoothUnion`, `sub`, `inter`.

**`class Rig(w,h)` (L66):**
- Holds `parts[]`, `stamps[]` and `anchors{}`.
- `add(sdf,bbox,opts)` takes these part options: `ramp`, `base` (index, default 3), `bevel` (3), `z`, `group`, `shiny`, `flatten`, `dark`, `flat`, `tilt`, `ao(fn)`, `texture(fn)`, `lineIdx`, `lineCol`, `noLine`, `noLineOver`, `cast:{on[],dx,dy,k}`.
- Helpers: `ellipse`, `circle`, `capsule`, `box`, `poly`, `custom`, and `stamp(fn,z)`.

**`Rig.render(opt)` (L82–166)** runs these passes in order:
1. **Shading.** Each pixel inside a part's bounding box costs 5 distance evaluations (the value plus a central-difference gradient). The normal blends from sideways at the edge to facing forward in the interior, using `k = clamp(-d/bevel)`. Then `dd = n·L`, and bands are chosen as:
   - `dd < -0.2` → base−2
   - `dd < 0.36` → base−1
   - `dd > 0.94` and shiny → base+2
   - `dd > 0.74` → base+1

   After that it subtracts `ao` and `dark`, then clamps the index to `[1, n−1]`. Index 0 is reserved for lines. The result is a 3–5 band "pillow" shading.
2. **Cast shadows** (L123–140): darken parts in the target groups by `k` steps, offset by (dx, dy).
3. **Interior lines** (L142–156): a pixel of a rear part next to a front part of a different group is set to `lineCol || ramp[lineIdx??0]`.
4. **Stamps:** sorted by z.
5. **Outer outline** (L161–164): `PixelBuffer.outline` (`01_pixel.js` L106), 4-neighbor, colored `darkOf(nb,-0.62)`, i.e. `shade(-0.62)`, which shifts hue toward 255 (violet).

   Computed outline colors today: jacket #e04a44 → **#770e33** (V 0.47), skin → #59181c, yellow sneaker → **#8c2305** (V 0.55), KIRU body → #06313a. These are 3–7× brighter than the reference outline.

**`limb()` (L170):** two-segment forward kinematics. Angle 0 points down; positive angles point forward.

**`FACE` (L178–228):**
- `eye()`: a 2×(3–4) ink rectangle with a 1 px white highlight and a 1 px iris pixel. States: blink, happy, closed, surprised, half, angry, sad (optional tear), default.
- `brow()`: a 2–3 px line.
- `mouth()`: smile, grin, open, talk, o, frown, flat, wavy, smirk, plus a 2 px default.

**`EXPR` (L231–247):** 15 entries — neutral, happy, joy, smile, surprised, worried, sad, angry, determined, thinking, skeptical, guilty, calm, scared, tired.

### 1.2 Animation

**`ANIMS` (L252–275)**, as `{frames, fps, loop}`:

| Anim | Frames | FPS | Anim | Frames | FPS |
|---|---|---|---|---|---|
| idle | 8 | 6 | talk | 6 | 7 |
| walk | 8 | 11 | celebrate | 8 | 10 |
| run | 8 | 15 | frustrate | 6 | 8 |
| jump | 2 | 8 | tool | 4 | 10 |
| fall | 2 | 8 | hit | 3 | 10 (no loop) |
| land | 3 | 14 (no loop) | help | 4 | 6 (no loop) |
| scan | 6 | 8 | climb | 4 | 8 |
| sample | 6 | 8 (no loop) | sit | 4 | 3 |
| repair | 6 | 10 | point | 4 | 6 |
| program | 6 | 10 | think | 6 | 4 |
| | | | sad | 6 | 4 |
| | | | wade | 8 | 8 |

That is 22 animations and 118 frames per humanoid.

**`poseFor(anim,t,ch)` (L277–405):** returns `{bob, lean, headTilt, headDX/DY, hipF/B, kneeF/B, footF/B, shF/B, elF/B, handF/B, expr, mouth, blink, hairSwing, squash, item, beam, crouch}`.
- Run uses lean 0.14 × `energetic` (Amaya 1.2, so 9.6°), hip ±0.85, shoulder ±0.9, elbow 1.4.
- Hair motion is a single scalar, `hairSwing`.

**Animations used by game code:**
- Player: idle, walk, run, wade, jump, fall, land, hit, climb.
- Scripted: `forcedAnim` scan/tool; `restAnim` repair ×5, scan, idle; celebrate, walk.

### 1.3 `buildHumanoid(R,D,pose,opts)` (L411–503)

Canvas is **64×80**. Body center x = 30 + `D.dx`, foot line y = 78. The key formulas:
- `hipY = 78 − footH − thigh − shin + crouch + bob`
- `waistY = hipY − pelvisH`
- `shoulderY = waistY − chestH + 2`
- `headCY = neckY − headRY + 1`

Draw order (z):

| z | Part |
|---|---|
| 5–7 | back arm (`dark:1`) |
| 10–12 | back leg |
| 29 | neck |
| 30 | torso (`D.torso`) |
| 40–42 | front leg |
| 50 | head ellipse |
| 51 | cheek |
| 52 | ear |
| 55+ | `D.hair` |
| 80–82 | front arm |
| 85+ | item |
| 100 | face stamp |

The face stamp places eyes at `hx+eye1X` and `hx+eye2X`, brows, a mouth at `(mouthX, mouthY)`, blush, freckles, a 1 px nose and `D.faceStamp`.

Other helpers:
- `footPart`: a 5-point polygon with an optional sole stamp.
- `handPart`: a circle of radius ~2, or a pointing finger.
- `itemPart`: scanner (sets `anchors.beam`), vial, wrench, tablet, seeds, anemometer, clipboard.

Anchors produced: `{cx, hipY, waistY, chestY, shoulderY, neckX/Y, head{x,y,rx,ry,tilt}, lean, pose, legF/B, armF/B(+hx,hy), beam}`.

### 1.4 Cache and drawing

**`SpriteCache.get(charId,anim,frame,opts)` (L554–571):**
- Key: `id|anim|frame|expr|mouth|variant`.
- Calls `CHARS[id].render(anim, t=frame/frames, opts)`, converts the result to a canvas and keeps `.anchors`.
- Evicts oldest-first above 2600 entries.

**`drawChar(g,id,anim,time,x,y,facing=1,opts)` (L577–597):**
- Frame = `floor(time·fps·speed)`, wrapped if looping, otherwise clamped.
- Draws a shadow ellipse `fshadow(rx=shadowR, ry=2)`.
- Mirrors via `scale(-1,1)` when facing left.
- Draws the scanner beam from `anchors.beam`.
- Options read: `expr, mouth, item, variant, speed, shadow, beam, beamLen`.

**Measured build cost (headless):**
- Amaya: 118 frames in 384 ms, i.e. **3.25 ms per 64×80 frame**.
- KIRU: 118 frames in 82 ms (0.7 ms per frame).
- Portrait 128²: **26.5 ms** each.

### 1.5 Characters (`src/11_chars.js`)

| id | Canvas | ox, oy | Bounding box (idle) | Colors | Notes |
|---|---|---|---|---|---|
| amaya | 64×80 | 30, 78 | 26×68 | 71 | `AMAYA_D`: skinA, hairA (violet-black), coral jacket over turquoise shirt, navy pants, yellow sneakers; 12-circle curly puff + coral scrunchie; goggles = capsule + 1 lens; belt + pouch; SYNARA badge |
| kiru | 44×36 | 22, 34 | 33×33 | 39 | `renderKiru` (own mini-rig): 4 legs, turquoise `kiruBody`, blue triangle ears with 4 px "solar" stamps, dark screen face, 2×4 cyan LED eyes, orange nose and belly, tail capsule + 3-blade turbine stamp |
| naira / dante / eliana | 64×80 | 30, 78 | 33×65 / 26×64 / 24×61 | 62 / 75 / 54 | straw hat + braid + vest / hard hat + overalls + bandana / lab coat + bun + glasses |
| limen | 72×100 | 36, 96 | 57×78 | 17 | flat faceted crystal, outline #0b2238 |
| mirage / mosaico | 104×136 | 52, 132 | 62×126 | 15 / 25 | iridescent / mosaic texture |
| beta9 | 40×48 | 20, 46 | 28×30 | 21 | battery robot that shows its charge level |
| NPC adults ×8 + crowd ×14 | 64×80 | 30, 78 | **21–25 × 58–63** | 31–50 | children 22–23 × 46–47 |

**`KIRU_EYES` (L130):** curioso→open, alegre→happy, alarmado→big, confundido→mixed, culpable→down, valiente→brave, agotado→tired, esperanzado→star, plus English aliases. `calm`, `smile`, `skeptical` and `guilty` are missing, so they fall back to `open`.

**`HAIR` (L224):** `cap` (a head ellipse minus a face ellipse), `strands` (capsules), `bun`, `braid` (a chain of circles), `spikes` (triangles).

**`makeNPC(id,cfg)` (L581–639):**
- Randomness: `RNG(seed)` picks from `SKINS` (5), `NPC_HAIRS` (5), `NPC_CLOTH` (8 ramps) and 7 hairstyles.
- Body: thigh and shin get ±0.5–1, chest ±, `torsoW × wide`, and the `child` flag.
- Options: hats cap/bucket/aviator; apron/vest/raincoat; mustache, glasses, wrinkles, flowers.
- It always uses the **same skeleton, head ellipse 9×9, eyes and stance**.
- Registers `CHARS[id] = {name, render, ox:30, oy:78, shadowR, D}`.

**Registered NPCs:** marea, cobre, alma, nimbo, consejal, operador, pastora, financia, crowd0–13.

### 1.6 Portraits (`src/14_portraits.js`)

**`PEXPR` (L7–26):** 18 entries, each `{eye, brow, mouth, blush?, tear?, look?}`.

**`PF.eye(cx,cy,w,h,kind)`:**
- Elliptical white of the eye (lower part tinted #d8d0ec).
- Iris: 4-tone ramp, radius ≈ 0.33w.
- Pupil 3 px wide, 2 highlights.
- Thick 2 px upper lid plus lash, 1 px lower lid.
- Kinds: open, happy, closed, half, down, wide, angry, sad.

**`buildPortraitHumanoid(D,expr,talk,blink)` (L143):**
- `Rig(128,128)`, head center HX=60, HY=60, rx 27.5, ry 31 (head **55×62**), plus a jaw ellipse.
- Neck capsule radius 8–9, 18 px long.
- Outfit polygons cover y≥94.
- Near eye 11×12 at HX−4; far eye 8×11 at HX+16.
- Talking swaps the mouth to open/talkSmall; blinking uses closed eyes.

**Definitions:**
- `PORTRAIT_DEFS`: amaya, naira, dante, eliana.
- `npcPortrait(cfg)` used for marea, cobre, alma, nimbo, consejal, operador, pastora, financia.
- Separate builders: `portraitKiru`, `portraitLimen`, `portraitTwin(mosaic)`, `portraitBeta`.

**`Portraits.get(id,expr='neutral',talk=0,blink=false)`:** cache key `id|expr|talk|blink`, capped at 400. `warm(ids, exprs=['neutral','smile'])` is called from `32_gameplay.js:36`.

**Dialogue drawing (`31_story.js` L89–101):**
- Draws the 128×128 portrait directly at x=10 (left) or x=W−138 (right), y=`boxY−94`, with **no frame**.
- Amaya and KIRU go on the left, everyone else on the right.
- The text starts at x=146 when the portrait is on the left.

### 1.7 Who depends on this code

| File:line | Dependency |
|---|---|
| `30_world.js:305` Player | `drawChar(...,{expr,item})` |
| `30_world.js:356` KIRU | `{expr: mood}` |
| `30_world.js:408` Actor | `{expr,item,variant}` |
| `50_scenes.js:103-104`, `4b_epilogue.js:292-293` | fixed positions |
| `99_main.js` TESTS sprites/zoom/portraits | — |
| `14_portraits.js` | uses `MAT`, `NPC_CLOTH[0,1,2,5,7]`, `KIRU_EYES`, `RAMP` |
| `30_world.js:200` | Player hitbox `h=56` |
| `30_world.js:410`, `32_gameplay.js:255` | `bubbleH` default 74 |
| `30_world.js:358` | KIRU speech bubble at `y−36` |
| `30_world.js:357` | KIRU scan rings at `y−22` |
| `30_world.js:306` | wading overlay ±9 px |

### 1.8 Latent bugs found

1. The `SpriteCache` key leaves out `opts.item` (L557). If `item` ever varies, the cache returns a stale sprite.
2. The right-hand dialogue portrait is never mirrored, so NPCs on the right look off-screen.
3. `alma`'s expression `curious` is not in `PEXPR` or `EXPR`, so it falls back to neutral. `crying`, `proud` and `embarrassed` are not in sprite `EXPR` either.
4. KIRU's sprite maps `calm`, `smile` and `skeptical` to `open`.

---

## 2. Gap analysis vs the reference

| Criterion | Reference | Current | What to do |
|---|---|---|---|
| **Scale** | 72–74 px tall; head 23 | 57 px; head 18 | Scale ×1.28 (canvas 88×104, see §4.2) |
| **Proportions** | 3.2 heads; legs 1.25× head; torso 0.92× head; slim limbs, long shins | 3.2 heads; torso slightly short | Keep the head ratio; make the torso +2 px longer. The childish feel comes from round shapes, not from proportions |
| **Face / eyes** | One prominent 3×5 anime eye with a thick lash line, brown iris getting lighter at the bottom, 1 px white highlight; far eye compressed; small nose and mouth; blush | Two 2×4 dark rectangles ("two pixels as eyes" is listed as an anti-pattern in prompt §9); 1 px nose | Pixel templates for eyes and mouths per expression (§4.3c) |
| **Hair** | Auburn chestnut (hue 5–20°, saturation 0.6–0.95); high ponytail of 5–6 tapered pointed clumps; pointed bangs; side lock; 1 px highlight band; yellow hair tie | Violet-black `hairA` (hue ≈290°); 12 circles + 7 fringe circles, which reads as a bunch of grapes | Tapered-strand primitive with secondary motion (§4.3b). Test 2 proves it works |
| **Clothing** | About 30 parts: popped collar, rolled short sleeves, white top hem, belt + buckle, hip pouch, cargo shorts with a light patch, dark leggings, cuffed laced boots, fingerless gloves | About 18 parts: jacket polygon, lapel, shirt, belt, pouch + 4 stamps | Clothing panels + fold stamps tied to joint anchors + costume decals |
| **Accessories** | Goggles (strap, 2 lenses, steel rim, cyan lens); big backpack (steel canvas + leather flap + yellow buckle + cyan LED + straps across the chest) | Goggles = capsule + 1 lens; no backpack | Accessory registry (`back`, `head`, `hip`, `wrist` anchors) |
| **Outlines** | 1 px near-black warm everywhere (V≈0.07–0.15); dark interior contours | `darkOf(-0.62)`, V 0.35–0.55, colored | Per-material outline color with V≤0.15 (§4.3a) |
| **Shading** | Directional key light from above and in front, 4–5 tones, cast shadows (bangs on forehead, collar on neck, backpack on jacket), almost no pillow shading | Light from **upper-left behind**, so faces sit in shadow; large `bevel` gives concentric pillow bands | `LIGHT=[+0.5,−0.8,0.45]`; `bevel` ≈ 0.4–0.6 × radius; standard cast shadows (dx −1…−2, dy +2…+3) |
| **Hue of shadows** | Warm materials shift toward maroon (jacket shadow #320803, hue 6°); cool ones toward navy; highlights toward orange (#ffa070) | `shade()` pushes every shadow toward violet (jacket shadow #3e1222, hue 339°) | Hand-author ramps per material (§3) instead of `makeRamp`/`shade` |
| **Rim light** | Subtle bright or cool 1 px edge on the top and back (top of backpack, crown of hair) | None | Rim pass, tinted per environment (§4.3a) |
| **Saturation** | Saturation mean 0.63 | 0.57 (Eliana 0.31) | Mostly fine; fix hue and value. Give Eliana's coat a cooler blue-white with saturated accents |
| **Expressiveness** | Strong pose: run lean ~17°, back foot kicked high, elbows ~100°, trailing hair | Run lean 9.6°, short arm swing, faces unreadable | Larger pose amplitudes (§4.5) + 6 new animations |
| **Silhouette** | Ponytail + goggle bump + backpack hump read without color | Amaya, Dante, Eliana and NPCs share one silhouette apart from hats | Body archetypes + accessory silhouettes |
| **NPC diversity** | (not shown in reference; prompt §36 requires age, height, build, clothing, posture, occupation) | All adults 21–25 × 58–63 px, same skeleton, face and stance | `BODY`, `OUTFIT` and `PROP` registries (§4.4) |
| **Portrait style** | Framed bust (1 px #030d26 → 2 px #e7f7ff/#daedfe → 1 px #486082, background #021631); head fills ~75% of frame height; anime eyes ~1/5 of face height with large iris; bangs; blush; slight smile | 128² with no frame; head 55×62 with a long, thick neck (~16 px wide); smallish iris with a lot of white; "grape" hair; never mirrored | 96² builder + new eye module + strand hair + frame + mirroring (§5) |
| **KIRU** | Floating pearl-white robot; round 33×28 head; dark navy visor; 3×7 glowing cyan eye capsules; long fin ears (orange/yellow rim, cyan inside, dark frame); two thruster pods with yellow bands; cyan trail; outline #070813 | Turquoise 4-legged lizard-fox, 33×33, blue triangle ears, 2×4 eyes | Merged redesign (§3.2) |

**Test results:**
- **Test 1** (`ch_proto.png`): front light, warm outline and the reference palette alone still give a recolored retro sprite. This shows that palette and light are necessary but far from enough.
- **Test 2** (`ch_proto2.png`): about 60 lines adding tapered-capsule ponytail and bangs, goggles, a backpack, a 3×5 eye and the warm outline. The result is visibly in the reference's visual language. What it still lacks: size (still 57 px), face template polish, run-pose amplitude, the shorts/leggings split. Also, giving each strand its own group drew dark seams between them, which reads as dreadlocks; strands need fewer groups and `lineIdx:1`.

---

## 3. Bible constraints and canonical designs

### 3.1 Amaya (the reference becomes canonical)

The bible (§9) gives only personality. Visual canon from the reference:

**Silhouette:** high ponytail, goggles on the head, backpack hump, red cropped jacket, shorts over dark leggings, hiking boots.

**Ramps** (index 0 = line/outline). Add them as new keys. Do **not** edit `RAMP.skinA`/`hairA`, which are shared with alma, pastora and crowd NPCs.

| Key | Colors (dark → light) |
|---|---|
| `hairAm` | #1c0503 #3a0d06 #5f1a0b #842d12 #a8461d #c9652c #e88c4a |
| `skinAm` | #4a160e #8a3a24 #b85a3a #e07f58 **#f9a879** #ffc69c #ffe2c8 |
| `jacketAm` | #240503 #4e0d06 #7d1a0c #ad2814 **#de3f22** #ff6a3a #ffa070 |
| `topAm` (white top) | #3a2a30 #7a6a70 #b4a8a8 #ddd2cc #f2ece4 #ffffff |
| `packSteel` | #0c1a26 #18334a #245066 #3f6c80 #6a8e9c #9ab4be #cfe0e6 |
| `leatherAm` | #1e0a04 #3e1a0c #5c3016 #7e4a22 #a06a34 #c48e50 #e0b478 |
| `shortsAm` (khaki-grey) | #1e1a18 #3a3430 #5e5650 #857c70 #aca08c #cfc4ac #ece4d0 |
| `leggingsAm` | #120808 #24120e #3a201a #54301f #704428 #8c5a36 |
| `bootsAm` | #160604 #360f06 #5a1c0a #7f2e12 #a4461e #c8642e #e48a4a |
| `gogFrame` | #0e0a14 #22131f #3a3446 #4a4f5d #7a8290 #a3acb0 #d8dee2 |
| `gogLens` | #06202e #0c3e5c #16608a #1f86b8 #2aa9e3 #7fd8f6 #e6fdff |

Other fixed colors: hair tie #e6b422 / #ffd84a; blush #ff8a6a (2-row dither); outline **#1a0604**.

**Parts at the 88×104 target canvas** (head 23 px; sizes in px):

| Area | Spec |
|---|---|
| Hair | Ponytail root at crown-back (hx−3, hy−10); 5–6 clumps, 14–18 long, radius 3.2 → 0.4; tie 2×3. Bangs: 4 pointed clumps reaching the brow line. Side lock in front of the ear, 6–7 long. 1 px highlight arc in `hairAm[6]` along the crown |
| Goggles | Strap 2 px (`gogFrame[1..2]`) around the head above the bangs. Near lens 6×5, far lens 4×4 partly hidden. Rim `gogFrame[5]`; lens `gogLens[4]`→`[5]`; highlight 1–2 px #e6fdff |
| Jacket | Cropped to the waist. Popped collar 3 px. Short rolled sleeves (2 px lighter cuff band) ending mid-upper-arm, so forearms show skin. Open front shows a 3–4 px strip of white top; 2 px white hem below the jacket. Fold stamps at elbow and armpit |
| Belt and pouch | Belt 2 px `leatherAm`, gold buckle 2×2. Hip pouch 4×4 at the back hip |
| Shorts and legs | Shorts 7 px long, cuff 1 px lighter, pale-blue 2×2 patch (#9ab4be). Dark leggings down to the boots |
| Boots | 8×7, 1 px lighter cuff fold, lace dots `bootsAm[6]`, sole #1a0a06 + 1 px toe highlight |
| Hands | Fingerless gloves in `leatherAm`; 2 px wrist band; hand 3×3 with 1 px thumb |
| Backpack | 11×14: `packSteel` body, `leatherAm` top flap 11×4, yellow buckle 1×2, cyan LED 2×2 #56e5ff, side bottle pocket. Two 1–2 px leather straps visible on the chest front |
| Keep / drop | Keep the SYNARA drop badge (3×3 turquoise) on the chest. The earring is optional; the reference doesn't show one |

**Diversity note:** the current dark-skinned, curly-haired Amaya design should be reused for an NPC (or Alma) so the cast's diversity is kept.

### 3.2 KIRU: merged design (bible identity + reference look)

| Bible requirement | Reference look | Merged spec (canvas 60×64, ox 30, oy 62) |
|---|---|---|
| Desert-fox ears + "solar ears" | Long fin ears: orange/yellow outer, cyan inside, dark frame | Two fox ears 16–18 long, base 7 wide, swept back 25–35°. Layers: 1 px frame #363c4d; 2 px outer band #dc8a1f → #eed546; inner cyan PV panel #29cae1/#5ee1ef with #0e406e grid lines every 2 px (solar cells). Twitch ±2 px; droop 40° for sad/culpable; flatten back for alarmado |
| Big eyes | Dark visor, 3×7 glowing capsule eyes | Head: ellipse 30×27 centered (33,24), pearl shell. Visor 20×18 at the front: #050e2f / #061b4d, with a 3 px gloss arc #7a8cb0 and a 1 px #c7d8e1 dot. Near eye 3×7, far eye 2×6: #5ee1ef body, #e6fdff 1 px center column, #2480a3 bottom, 1 px #0e406e glow dither. Expressions = eye templates (open capsule, happy ^, big 4×8, down, brave with slanted top cut, tired bars, star = yellow +, mixed = capsule + "?", culpable = lowered and shorter) |
| Turquoise + orange body | White shell, light-blue spots | Shell #0a0c16 #2c3344 #4c596b #6e7587 #a9b1ba #c7d8e1 #ebf1f3 #ffffff. Turquoise accents from current `kiruBody` (#16948a / #20c0ae / #4ce8cc) on the back plate, 3 dorsal ridge scales (lizard) and 3–4 1 px spots. Orange #dc8a1f / #ff8e34 on ears, paw rings, hatch trim and turbine |
| Magnetic paws | Two thruster pods with yellow bands | Four mag-lev paw pods 7×6 (navy #061b4d / #0e406e + 1 px #dc8a1f / #eed546 coil ring + 1 px #5ee1ef emitter). Far pair `dark:1`, mostly hidden, so the profile shows 2, matching the reference |
| Micro-turbine tail | Cyan energy trail | Lizard tail of 3 tapering capsules (radius 2.6 → 1.2), white with turquoise bands, curving up behind; 3-blade orange turbine (keep the existing rotation stamp). The cyan wake is particles drawn in `Kiru.render` while moving, not baked into the sprite |
| Sample compartment | — | Belly hatch 6×4, orange trim, cyan 2×2 window. The `sample` animation lifts the lid 1 px |
| Small size | KIRU ≈ 0.73 × Amaya | Visible ~44×50 (≈ 0.68 × the 74 px Amaya). Hover gap 10–12 px is **baked into the sprite** (pods end at y≈oy−11), bobbing ±1.5 px over 1.5 s. This keeps the `Kiru` entity's physics unchanged. Shadow rx pulses 7–9 |

KIRU outline color for every part: **#070813**.

### 3.3 Supporting cast (no reference image: apply the same rules)

Same outline, light and ramp rules, and the same size class:
- **Naira:** wide-brim straw hat, thick braid, woven vest, seed satchel.
- **Dante:** hard hat, overalls, bandana, wrench on the harness; give him a broader build (`torsoW +3`).
- **Eliana:** lab coat to the knee, bun with pencil, round glasses, lanyard; taller and slimmer.

Ramps must be hand-authored (no violet shadow shift).

---

## 4. Implementation plan

### 4.1 Decision: **hybrid — extend the SDF rig and add hand-authored micro-templates**

Fully hand-authored frames are not practical. 22–28 animations × ~6 frames × 9 main characters × expression variants comes to thousands of frames, and LLM-written character maps lose consistency across animation.

The rig already gives poses, kinematics, expressions, procedural NPCs and consistent lighting. Test 2 shows that what's missing is (a) material and outline passes, (b) a tapered-strand primitive, (c) templates for faces and small details, (d) accessory and clothing modules, (e) a bigger canvas and stronger poses.

Hand-author only static, high-frequency detail: eyes, mouths, buckles, lens glints and badges, as character maps through `spriteFromMap` (already in `01_pixel.js:146`, currently unused).

### 4.2 Target sizes

**Humanoid canvas 88×104, ox 40, oy 100.** Amaya dimensions:

| Field | Value | Field | Value |
|---|---|---|---|
| `thigh` | 13.5 | `headRY` | 11.5 |
| `shin` | 13.5 | `upperArm` | 10 |
| `footH` | 3 | `foreArm` | 9.5 |
| `footL` | 7 | `armW` | 2.8 |
| `pelvisH` | 5 | `legW` | 3.3 |
| `chestH` | 17 | `handR` | 2.3 |
| `torsoW` | 18 | `headRX` | 11 |

Resulting landmarks: hipY 70, shoulderY 50, head top y 27, chin y 50. Top of head to sole = **73 px**, head 23.

Archetype ranges: tall 80, stocky 70, elder 66 (stooped), teen 66, child 50–54.

| Character | Canvas | ox, oy | shadowR |
|---|---|---|---|
| Humanoids | 88×104 | 40, 100 | 12 (child 9) |
| KIRU | 60×64 | 30, 62 | 8 |
| LIMEN | 92×128 | 46, 123 | — |
| MIRAGE / MOSAICO | 132×172 | 66, 168 | — |
| BETA-9 | 52×60 | 26, 58 | — |

(LIMEN, MIRAGE/MOSAICO and BETA-9 are ×1.28.)

**Cross-team dependency:** props and buildings are currently sized for a 57 px character. Doors need to be about 84 px, steps and ladders rescaled. Tell the environment lead.

### 4.3 Engine changes (`src/10_rig.js`, `src/01_pixel.js`)

**a) Material system and image passes**

Light vectors (characters face right; mirrored when facing left):
```js
const LIGHT = norm([0.5, -0.8, 0.45]);   // key light from upper-front
const RIM   = [-1, -1];                   // rim from back and top
```

Material definition:
```js
function Mat({ ramp, outline, line, rim = true, spec = false, tex = null })
// ramp: 6–8 hand-authored tones; outline: V≤0.15 (default: shade toward the material's
//       own hue with V 0.10, saturation 0.8); line: interior line color (ramp[0], or ramp[1] for hair)
Rig.add(sdf, bbox, { mat, ... })   // `ramp` still accepted for backward compatibility
                                   // (it gets wrapped into a Mat)
```

New pass order inside `Rig.render(opt)`:
1. Shading, with retuned thresholds: `dd < -0.15` → −2; `< 0.25` → −1; `> 0.7` → +1; `> 0.9` and spec → +2. Default `bevel = 0.5 × min radius` (torso 3–4).
2. Cast shadows. Use `dx −1…−2, dy +2…+3` (the sign flips with the new `LIGHT`). Standard casters: hair/bangs → face, chin → neck, collar → top, backpack → jacket, hat brim → face.
3. Interior lines, using `mat.line`.
4. Stamps and decals.
5. **Rim pass:** an opaque pixel whose (−1,0) or (0,−1) neighbor is transparent, whose `mat.rim` is set and whose band index ≤ base gets `mix(ramp[n−1], opt.env.rim)`. 1 px only, on hair, head, shoulders, backpack and back.
6. **Material outline:** a transparent pixel with an opaque 4-neighbor gets `parts[zbuf[nb]].mat.outline`. Uses `zbuf`, so `PixelBuffer.outline` needs a new mode, `outlineByPart(zb, parts)`.
7. **Cleanup:**
   - Drop orphan outline pixels (≥3 transparent 4-neighbors and a single diagonal contact).
   - Apply a "pixel-perfect" rule that removes the redundant corner of L-shaped staircase steps.
   - Merge shading-band islands under 2 px into the surrounding majority band.

Environment rim colors (`opt.env`): coast #9fe8ff, dawn/dusk #ffb38a, Gran Calima #ffa060, night #5a7ac8, tech #7fd8ff.

**b) Tapered strands and hair module**
```js
Rig.strand(pts, r0, r1, opts)   // chain of capsules with tapering radius, one group; pointed tip when r1≈0.35
HAIR2.ponytail(R, o, mat, { root:[dx,dy], len, clumps:5, spread:0.9, tie })
HAIR2.bangs(R, o, mat, [[ax,ay,ex,ey,r], ...])   // head-local coordinates
HAIR2.lock(R, o, mat, pts, r)
HAIR2.shine(pb, o, mat)                          // 1 px highlight arc stamp
```

Group the ponytail into 2–3 groups, not one per clump, and use `lineIdx:1`. This avoids the dreadlock seams seen in Test 2.

**Secondary motion:** `poseFor` returns `pose.hair = { base, amp, P, lag: 0.35 }`. Clump segment *i* gets angle `base + amp·sin(P − i·lag)`.

| Anim | base (rad) | amp (rad) |
|---|---|---|
| idle | 0 | 0.08 |
| walk | −0.25 | 0.25 |
| run | −0.6 | 0.45 |
| jump | +0.5 | — |
| fall | −0.4 | — |
| land | overshoot of 0.3 decaying with (1−t) | — |

The jacket hem and backpack get a 1 px lag bob. Motion depends only on phase, so it caches deterministically.

**c) Face templates**

Replace `FACE` with `FACE2`:
```js
FACE2.draw(pb, A /*anchors*/, exprName, D.face)
// D.face = { tpl:'anime', iris:[dark,mid,light], lash:'#1a0604', brow, mouth:3, nose:1, blush }
```

Near-eye template, 3×5 plus lash row. Legend: K = lash, h = white highlight, w = white of the eye, D/M/L = iris dark/mid/light, s = `skin[2]`.
```
row-1: "KKKK"  (+ flick pixel at x+4, y-2)
row 0: "hDD"
row 1: "wDD"
row 2: "wMM"
row 3: ".ML"
row 4: ".ss"
```
- Far eye: 2×4.
- Per-expression templates: open, happy ^, closed, wide, half, angry (slanted lid), sad (drooping lid + optional tear #a6f4ff), look-side, scared (small pupil).
- Brows: 3 px, hidden by the bangs except in angry, sad, surprised and skeptical states, where they are drawn over the bangs.
- Mouths: 2–4 px templates.

Add `pb.stampMap(x, y, rows, pal, flip)` to `01_pixel.js`. Palette tokens can point to ramp indices so one template works for every skin tone.

**d) Clothing and accessories**
```js
D.accessories = [{ kind:'backpack'|'goggles'|'satchel'|'hardhat'|..., mat, anchor:'back'|'head'|'hip'|'wrist'|'neck', z }]
ACCESSORY[kind](R, A, pose, cfg)
```
- Fold stamps placed from anchors (`armF.kx/ky`, `legF.kx/ky`, waist): a 1 px `ramp[idx−1]` line plus a 1 px `ramp[idx+1]` line beside it. They move with the pose.
- `footPart` → boot polygon with cuff, laces and sole.
- `handPart` → 3×3 hand with a thumb, plus glove material.

### 4.4 NPC diversity (`makeNPC`)

Add three registries:
```js
BODY = {
  adult:  {},
  tall:   { thigh:+2, shin:+2, chestH:+1, torsoW:-1 },
  stocky: { torsoW:+5, armW:+.8, legW:+.8, belly:true, chestH:-1 },
  elder:  { stoop:.18, shin:-1.5, headDY:+1, energetic:.6, prop:'cane' },
  teen:   { scale:.92 },
  child:  { headRX:10, headRY:10, scale:.62 },
}
OUTFIT = { tee, overalls, labcoat, poncho, dress /* flared to the knee */, apron, hivis, raincoat, jacket }
PROP   = { cane, basket, crate, tablet, net, hoe, wateringCan, toolbox }
```

New `cfg` fields: `body`, `outfit`, `prop`, `posture` (stoop / lean / `arms: 'crossed' | 'behind' | 'hips'`), `jaw` ('round' | 'square' | 'long'), `nose` (1–3), `beard`, extra hairstyles (ponytail, afro, buzz, headscarf, double braids).

Keep the existing `cfg` keys and the order of `NPC_CLOTH` (portraits read indices 0, 1, 2, 5, 7); only append. Give each NPC its own `restAnim`.

### 4.5 Animations

| Change | Spec |
|---|---|
| New: observe | Hand shading the eyes, lean forward |
| New: surprise | Recoil, 2 frames |
| New: worry | Hand to chest, weight shift |
| New: fear | Cower, forearms raised |
| New: determined | Fist chamber + stance |
| New: victory | Hold arm raised; distinct from celebrate |
| Aliases | interact → help/tool, analyze → scan, operate → program, anger → frustrate, sadness → sad |
| Run | lean 0.28, hip ±1.0, back-leg kick knee −2.0 at push-off, shoulder ±1.1, elbow 1.6, bob −2..+1 |
| Walk | lean 0.06, arm swing ±0.55 |

### 4.6 SpriteCache cost and memory

| Item | Value |
|---|---|
| Pixels per humanoid frame | 9,152 (88×104) vs 5,120 today (1.79×) |
| Estimated cost per frame | 5.5–7.5 ms (3.25 ms today, +25% for the new passes) |
| Full Amaya set (~150 frames) | ≈1.0 s |
| Memory per frame | 36.6 KB (KIRU 15.4 KB) |
| Cap → worst case | 1,600 entries → ≤59 MB |
| Typical level (~400 entries) | ≈15 MB |

Changes:
- Key becomes `id|anim|frame|expr|mouth|variant|item|env`. This fixes bug 1 in §1.8.
- Add `SpriteCache.warm(id, anims, exprs)` plus `SpriteCache.pump(budgetMs=4)`, called from the game loop.
- In `GameplayScene` enter (`32_gameplay.js:36`), warm the movement set (idle, walk, run, jump, fall, land = 31 frames ≈ 0.2 s per main character) for amaya, kiru and the level's actors. Everything else stays lazy. Without this, a single new frame can cost up to 7 ms, which risks visible stutter when several NPCs appear at once.

### 4.7 Compatibility contract (must not change)

- `drawChar(g, charId, anim, time, x, y, facing=1, opts={expr, mouth, item, variant, speed, shadow, beam, beamLen})` — same meaning.
- `CHARS[id] = { name, render(anim,t,opts) → PixelBuffer with .anchors, ox, oy, shadowR, shadow?, D? }`.
- `SpriteCache.get(id, anim, frame, opts)` → canvas with `.anchors.beam = {x, y, ux, uy, on}`.
- `ANIMS[name] = {frames, fps, loop}` — existing names kept.
- `EXPR`, `KIRU_EYES` and `MAT.*` keys used by `14_portraits.js` stay (adding is fine).
- `NPC_CLOTH` (indices 0–7 stable), `RAMP.skin*`/`hair*` unchanged.
- `makeNPC(id, cfg)` returns `D` and accepts all current `cfg` keys.
- `Portraits.get(id, expr, talk, blink)`, `Portraits.warm(ids, exprs)`, `PORTRAIT_DEFS[id]`, `npcPortrait(cfg)`.
- `SPEAKERS[*].portrait` ids.

### 4.8 Files and functions to change

**`src/10_rig.js`:**
- L9 `LIGHT`; add `RIM`.
- L66–167 `Rig`: `add` gets `mat`; new `strand`; `render` with the new passes (L111 thresholds, L142–156 lines, L161–164 outline → by part, plus rim and cleanup).
- L178–228 `FACE` → `FACE2`; L231 `EXPR` (+ crying, proud, embarrassed, curious, relieved, frustrated).
- L252 `ANIMS` (+6); L277 `poseFor` (amplitudes, `pose.hair`, new animations).
- L411–503 `buildHumanoid` (cx 30→40, foot line 78→100, cast-shadow signs, face, accessories, folds).
- L505–522 `footPart` / `handPart`; L523–551 `itemPart` (×1.3, new props).
- L554–571 `SpriteCache` (key, cap, `warm`/`pump`).
- L577–597 `drawChar`: same signature; shadow defaults.

**`src/01_pixel.js`:** L106 `outline` (by-part mode); new `stampMap`, `cleanup`, `rimPass`.

**`src/00_core.js`:** L152 `RAMP`: add the Amaya and KIRU ramps, or put them in `MAT`.

**`src/11_chars.js`:**
- L6 `MAT` (append only).
- L35–97 `AMAYA_D` (rewrite); L112 `renderHumanoid` (`Rig(88,104)`); L125 `CHARS.amaya` ox/oy/shadowR.
- L130–219 `KIRU_EYES` (+ calm, smile, skeptical, guilty, crying) and `renderKiru` (rewrite); L219 `CHARS.kiru`.
- L224 `HAIR` (+ `HAIR2`).
- L249 / L294 / L335 `NAIRA_D` / `DANTE_D` / `ELIANA_D`.
- L389 / L462 / L536 `renderLimen` / `renderTwin` / `renderBeta` (scale and outline).
- L569–580 `NPC_CLOTH` / `SKINS` / `NPC_HAIRS` (append); L581 `makeNPC`; L640–648 registrations.

**`src/14_portraits.js`:** all of it (§5).

**`src/31_story.js`:** L89–108, `DialogueScene.render` portrait (frame, mirroring, x offsets 146 / 140 / `tw`).

**`src/30_world.js`:**
- L200 keep hitbox `h=56`–60 (do not grow it to 74 without a level audit of ceilings, `solidHit` and hazards).
- L306 wading overlay ±9 → ±12.
- L357 KIRU scan rings y−22 → y−34.
- L358 KIRU bubble y−36 → y−58.
- L410 `bubbleH` default 74 → 92.

**`src/32_gameplay.js`:** L36 add `SpriteCache.warm`; L255 `bubbleH` default 74 → 92; `renderHUD` HUD player panel with mini portrait (UI lead's area).

**`src/99_main.js`:** TESTS.sprites grid 76/100 → 96/112; TESTS.portraits grid 128 → 104; add `test=charsheet&char=…` (every animation × frame at 2×).

**Check placement:** `50_scenes.js:103-104`, `4b_epilogue.js:292-293`.

### 4.9 Order of work and acceptance checks

1. Engine passes plus Amaya at 88×104. Compare against `ch_sbs_amaya` at the same scale. Pass if: outline V≤0.15, face lit, ponytail motion visible, readable eye at 1×.
2. KIRU redesign.
3. Portrait builder plus Amaya and KIRU portraits.
4. Naira, Dante and Eliana; NPC archetypes.
5. Update the tests.

For each step, repeat the side-by-side with the reference (the method in `ch_sbs.py`). Per prompt §45–46, go no further while the character criterion scores below 4/5.

---

## 5. Portraits

### 5.1 Format

**Recommendation: 96×96 artwork inside a 104×104 frame, plus a 44×44 HUD mini version inside a 52×52 frame.**

- The 96 format scales the reference HUD portrait by about 1.85. That gives a face ~48–52 px wide, eyes ~10×10 near and 8×9 far, eye centers ~17 px apart, head and hair ~74×78, shoulders from y≈76.
- It has 44% fewer pixels than 128², so about 15–20 ms per portrait instead of 26.5.
- The detail density matches the reference.
- The builder takes the size as a parameter (`S = size/96`), so 128 stays available. Coordinates are in a 96-unit space; only the eye and mouth templates change for the 44 px mini version.

**Frame:** 1 px #030d26, 2 px #e7f7ff / #daedfe (inner bevel), 1 px #486082, background #021631 with a dithered vertical gradient to #0b2a52.

**Dialogue changes (`31_story.js`):**
- Panel at (8, boxY−70) or (W−112, boxY−70).
- **Mirror** the portrait for right-side speakers, using `g.scale(-1,1)` (none of the portraits contain text).
- Text x: 146 → 122.

### 5.2 Builder changes (`buildPortraitHumanoid`)

| Area | Change |
|---|---|
| Head | Cranium ellipse plus a cheek/jaw polygon with a softened pointed chin. Neck 0.55× its current width; jaw shadow cast onto the neck. Same 3/4 view facing right |
| Light | Key light from upper-right; shadow on the left of the face (#964831 tone); rim on the hair edge |
| Hair | 10–16 `strand` clumps with pointed tips; bangs cast onto the forehead (dx −1, dy +3); anime "angel ring" highlight stamp on the crown; 2–3 flyaway strands |
| Outline | `#1a0604`-class material outline |
| `PF.eye` | Height ≈ 1/5 of face height; iris fills ~70% of eye height, getting lighter toward the bottom (dark → mid → light); white only at the sides (#fff4ea, lower edge #e8c8b8); pupil 2–3 px; highlights 2×2 (top-left) + 1 px (bottom-right); 2 px upper lash with a 2–3 px outer flick; 1 px lower lash in `skin[1]` |
| Brows | 1–2 px, partly hidden by bangs |
| Nose | 1 px shadow + 1 px highlight |
| Mouth | 4–6 px |
| Blush | Two dithered rows in #ff8a70 |
| Talk / blink | Keep the mouth-swap and blink frames |

### 5.3 Expression mapping

Expression names used in dialogue today, from grepping all `['speaker','expr',…]` lines and `kiru.say` moods:

| Speaker (lines) | Expressions (count) |
|---|---|
| amaya (108) | thinking 31, determined 21, sad 9, skeptical 6, smile 6, angry 4, surprised 4, calm 3, tired 3, worried 3, crying 2, embarrassed 1, proud 1, scared 1 |
| kiru (156 + 54 say) | happy 35, thinking 30, curioso 25+9, confundido 19+13, esperanzado 12+4, alarmado 10+10, determined 6, worried 6, valiente 2+14, neutral 3, culpable 2, tired 2, alegre 1+1, calm 1, sad 1, surprised 1 |
| naira (57) | calm 19, skeptical 11, smile 8, thinking 8, determined 5, worried 3, angry 1, happy 1, surprised 1 |
| dante (48) | joy 10, smile 9, surprised 8, worried 8, thinking 7, skeptical 4, sad 1, tired 1 |
| others | LIMEN: calm / alert / speak; MIRAGE: calm / happy / thinking; alma: **curious** (missing); beta9: happy / sad / calm / scared / tired / worried |

Prompt expression set mapped to portrait keys:

| Prompt | Portrait key | Existing names that use it | KIRU eye mode | Visual spec |
|---|---|---|---|---|
| neutral | `neutral` | neutral | open | Iris centered; relaxed brows; small upturned line mouth |
| alegría | `happy` / `joy` / `smile` | happy, joy, smile, proud, alegre | happy | happy = ^ eyes + open smile + blush; joy adds teeth and a 1 px head tilt; smile keeps eyes open |
| concentración | `thinking` (alias `focused`) | thinking, curious (alma), curioso (sprite) | mixed (rename `focus`) | Half-lidded eyes looking sideways (look 0.6); one brow lower; mouth flat, pursed to one side |
| preocupación | `worried` | worried, embarrassed (+ blush) | down | Smaller iris highlights; brows raised at the inner end; small wavy mouth; optional sweat drop |
| sorpresa | `surprised` | surprised | big | Eye white all around a smaller iris; brows high; "o" mouth |
| frustración | `frustrated` (new; `angry` → alias) | angry, frustrate animation | brave + red tint | Upper lid slanted inward; brows down and in; clenched-teeth row; no anger-vein symbol (avoids childish look) |
| tristeza | `sad` / `crying` / `guilty` | sad, crying, guilty, culpable | down (culpable = lowered) | Downward look; outer lids drooping; frown; crying adds a tear line and larger highlights |
| temor | `scared` | scared, alarmado (shared with surprise) | big + small pupil | Wide eyes, tiny pupils; brows up at the inner end; wavy open mouth; skin −1 band dither |
| duda | `skeptical` | skeptical, confundido | mixed | One brow raised, one low; half eyes; side smirk |
| determinación | `determined` | determined, valiente | brave | Flat lowered lid (not angry); brows mildly down and in; firm mouth; 2×2 highlight |
| alivio | `relieved` (new) | calm (Naira's default), esperanzado | star (esperanzado) / soft ‿ | Softly closed downward-curved eyes; relaxed raised brows; soft smile or small exhale "o"; light blush |
| (extras kept) | `tired`, `calm`, `proud`, `embarrassed`; LIMEN `calm` / `alert` / `speak` / `warn` | — | tired | — |

Add aliases in `PEXPR` and `EXPR`: `curious → thinking`, `focused → thinking`, `frustrated ↔ angry`. Then fix `KIRU_EYES` and the inline map in `portraitKiru` (L388) to cover every name above.

### 5.4 KIRU portrait

Use the §3.2 palette:
- White shell head ~70×62 filling the frame, visor ~44×40.
- Eye capsules ~7×16 with #e6fdff center, #5ee1ef body and #0e406e glow halo.
- Fin ears entering from the top corners (orange rim + cyan PV grid).
- One row of turquoise back plate and the orange-trim sample hatch at the bottom edge.
- Keep the existing scan-line effect at a subtle level, every 3rd row.

### 5.5 HUD mini portrait

`Portraits.mini(id, expr)` builds the same definition at S=0.46 (44×44) with mini eye templates (near 4×5, far 3×4). It is used by the reference-style HUD player panel (portrait + name + hearts + energy + level). Cache key is `id|expr|mini`.