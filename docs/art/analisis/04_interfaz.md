# UI system analysis and re-skin plan: Aridia Nexus compared with `referencia_visual.jpg`

All coordinates are logical pixels on the 640×360 canvas. The reference is 1125×633, so 1 logical px ≈ 1.758 reference px. I took hex values from the reference by median-cut quantisation and pixel line-scans over each UI element (scripts below). I did not modify any file in the repo; `node tools/build.js` reproduced the committed `index.html` byte for byte (git status stayed clean).

**Validated prototype.** I injected `art_analysis/ui_mock.js` into a level-1 run through `shot.js eval:`. It uses only the game's own primitives plus a bold font built at runtime. The results are `ui_mock2.png` and the side-by-side `ui_cmp.png` (reference on the left, mock on the right), all under `/tmp/claude-0/-home-user-Pixel-Bit/3de6e308-5c98-5496-b62a-c6dd2f26bdb0/scratchpad/art_analysis/`. The frame, typography, hearts, bar, bubble, option-row and procedural-thumbnail specs below come from that mock and read close to the reference.

Current-state screenshots in the same folder: `title.png`, `map.png`, `lv10_dlg.png`, `ui_lv1_dlg.png`, `sim09.png`, `solo_item.png`, `ui_micro.png`, `ui_portraits_z.png`. Reference crops: `ref_{hud,bubble,minimap,question,strip,signs,labels1,labels2}.png` and `ui_z_*.png` (8× zooms of corners, tail, hearts, label).

---

## 1. Current architecture (exact APIs and where things are drawn)

### 1.1 Primitives (`src/01_pixel.js`)
- `frect(g,x,y,w,h,col)`, `fpx`, `fline`, `fdisc`, `fdither(g,x,y,w,h,col,level)` (Bayer 4×4 cached pattern), `fshadow` (dithered ellipse).
- `PixelBuffer`: `rect/hline/vline/line/thick/disc/ellipse/ellipseOutline/poly/dither/vgrad/blit/outline(color|fn,diag)/swap/toCanvas`.
- `outline()` already accepts a function of the neighbour colour, so selective (coloured) outlines are free to adopt.

### 1.2 Fonts (`src/02_font.js`)

| Font | Glyphs | Metrics | Notes |
|---|---|---|---|
| `FONTS.main` | A–Z, a–z, 0–9, áéíóúñü ÁÉÍÓÚÑÜ, ¿¡, punctuation, `→←↑↓ ≈~≤≥<>±× % ° ³ ² ₂ · • … – — « » @ ✓ ♥ ★ ♪ € $ & \| # * Δ η π µ ( ) [ ] /` | Caps 5×7 (I 3w), lowercase x-height 5, descenders 2, cellH 11, top 2, lineH 11, spacing 1 → about 6 px per cap | 1 px stroke only. No Ω. |
| `FONTS.tiny` | Caps only (`upper:true`), 0–9, limited punctuation, accent row for ÁÉÍÓÚÑÜ | 3×5 (M/W 5w), cellH 7, `shift=1`, advance about 4 px | Missing ♥ ★ ✓ « » €. `¿¡` map to `? !`. |
| Title | `drawTitleText(g,text,x,y,scale,ramp,opts)` at L367 | Draws main ×2/×4 with a per-row gradient, outline and shadow | Chunky, reads "retro". |

- Inline colour markup lives in `TEXT_COLORS` (L170): `{y}#ffe14d {c}#56e5ff {o}#ff9f43 {r}#ff4e5d {g}#86e36f {p}#f78acb {v}#b49cff {b}#6cb4ff {w}#fffaf0 {d}#8a8fb8 {k}#140d26 {t}#20d6c7`.
- `drawText(g,text,x,y,{color,shadow,outline,align,font,scale,max})` at L312. The shadow is offset (0,1)+(1,1). L321 hard-codes the y-offset with `font === FONTS.main ? 2*scale : 0`; this must become `font.top===2` once a bold font exists.
- Other helpers: `drawTextBlock` (L346), `textHeight` (L360), `wrapText(text,maxW,font)` (L285).

### 1.3 Panels (`src/06_ui.js`)
`PANEL_STYLES` (L7–18) is only read inside `UIK.panel` and `UIK.header` (grep confirms), so the whole table can be swapped safely.

Style usage across the codebase: `tech`×34, `alert`×23, `green`×22, `glass`×22, `dialog`×11, `mirage`×5, `paper`×3, `mosaic`×3, `limen`×2, `toast`×1.

- `UIK.panel(g,x,y,w,h,style,accent)` (L20–51) draws, in order:
  - a 2 px dithered drop shadow (`#05030f`, 0.6);
  - a rounded ink outline;
  - `bg[0]` fill with a **50 % Bayer checker over the top half**;
  - a 1 px `edge` (top/left) and `edge2` (bottom/right);
  - an 8 % white line;
  - corner pixels, plus per-style extras: L-brackets for tech/glass/limen, gold studs for dialog, a dashed bottom rule for alert, animated dots for mirage.
- `UIK.header(g,x,y,w,title,style,icon)` (L53): a 13 px band with a dithered top half, a 12 px icon and 1 px white text.
- `UIK.frame` (L63): unused anywhere.
- `UIK.bar(g,x,y,w,h,frac,col,bg='#0a0c22',segs)` (L68): black track.

### 1.4 Gui widgets (immediate mode, keyboard navigation; `06_ui.js` L157–363)

| Widget | Lines | Current visuals |
|---|---|---|
| `button(g,id,x,y,w,h,label,{icon,style,disabled,selected,tip,key,align,noDraw,textColor,sfx})` → bool | L203 | Drawn by `drawButton` (L220); palette table at L222–231 |
| Button palettes | L222–231 | `primary #1d346c/#2c4f96/#56e5ff`, `choice #1a1640/#262060/#b49cff`, `danger #4a1428/#7a1f36/#ff9a8a`, `ghost #121736/#1c2350/#8a8fb8`, `good #0f4a3e/#1f854c/#c2f58e`, `tab`, `gold #6a3e0e/#9a5e12/#ffe14d`, `paper`. Dithered top half; the hi colour forms the focus frame; blinking cursor arrow. |
| `choice(g,id,x,y,w,label,letter,{state,disabled})` → `{clicked,h}` | L263 | Letter box sits inside the row (14×11 at x+4); states `selected/correct/wrong/dim`; focus = 18 % violet dither; h = max(18, lines·11+7) |
| `slider(g,id,x,y,w,value,min,max,step,{label,unit,fmt,color,disabled,marks,tip})` | L293 | h 22; 3 px track `#1c2350`; 7×11 knob |
| `toggle(g,id,x,y,label,on,{w})` | L338 | 20×10 pill, red/green |
| `renderTooltip` | L354 | `glass` panel |

`Charts` (L366–547) provides `frame` (flat 1 px black plus fill), `line`, `bars`, `tank`, `battery`, `gauge` and `flow` (FLOW_KINDS at L548). `Charts.frame` is the sub-panel container for every simulator.

### 1.5 Icons (`06_ui.js` L77–154)
- `Icons.def(name,fn)` defines 56 icons: water, sun, wind, battery, h2, leaf, salt, gear, book, map, lens, warn, check, cross, star, lock, person, people, info, clock, flask, plant, bolt, thermo, filter, membrane, tank, hint, question, chart, heart, shield, eye, mirror, puzzle, coin, seed, sensor, drone, kiru, save, music, mosaic, drop_brine, plug, target, play, pause, reset, mangrove, fish, cactus, turbine, panel, scale, ear.
- Each icon is drawn 12×12 into a 14×14 `PixelBuffer` with a **single fixed outline `#140d26`** (L88).
- `Icons.get(name,scale)` upscales nearest-neighbour; `Icons.draw(g,name,x,y,scale)` subtracts `scale` from x and y. Only `40_common.js:54` uses scale 2. There are 35 `Icons.draw` call sites.

### 1.6 Where each on-screen UI element is drawn

| Element | File:function (lines) |
|---|---|
| Chapter card (gold dialog ribbon) | `32_gameplay.js` `renderHUD` L217–226 |
| Objective panel (glass, 236 wide, top-left) | `32_gameplay.js` L228–238 |
| Tool/key slots (24×24, top-right, right to left) | `32_gameplay.js` L240–249 |
| Per-level science gauges | `def.hud(g,sc)` → `40_common.js` `hudGauges(g,items,x=6,y=H-34)` L238–248 (92 px per item, `glass`). Called in 12 levels. |
| Lens overlay label | `32_gameplay.js` `renderLens` L209–211 (bottom-right) |
| Lens tags / boundaries | `40_common.js` `lensTag` L250, `lensBoundary` L257 (59 call sites in levels) |
| Interaction prompts | `30_world.js` `Station.renderPrompt` L424–433; `32_gameplay.js` `drawTalkPrompt` L254–260 |
| In-world ambient bubbles (white, comic style) | `30_world.js` `drawBubble` L363–376 (`Kiru.renderBubble` L359, `Actor.renderBubble` L410; also `42_lv02.js`) |
| Dialogue | `31_story.js` `DialogueScene.render` L86–132: full-width box `UIK.panel(6, H-92, 628, 86)`, a 128 portrait at `py=boxY-94` **with its bottom 34 px hidden behind the box**, a flat colour name plate (L107–113), choices as centred `glass`+`choice` buttons (L116–126) |
| Toasts | `05_engine.js` `renderToasts` L124–136 (bottom-right, stacked upward from H-50) |
| Wooden signs (baked into props `PixelBuffer`) | `40_common.js` `drawSign(pb,x,y,text,col)` L221 (11 px plank, tiny glyphs). About 80 call sites. |
| SOLO gate | `21_learning.js` `SOLOScene.render` L203; `renderContext` L222 (`paper`); `renderItem` L237 (`Gui.choice`); `drawDataTable` L317 |
| Adversary micro-check | `21_learning.js` `MicroCheckScene.render` L359 (full-screen 0.72 dither plus a 500×270 mirage panel) |
| Explain-the-relationship | `40_common.js` `ExplainScene.render` L181 |
| Simulator frame | `40_common.js` `makeSim().render` L129–156: header L135–143, KIRU message L144–153, `renderSafeErr` L157 |
| Level complete | `40_common.js` `LevelCompleteScene` L34–70 (confetti at L39) |
| Title menu | `50_scenes.js` `TitleScene.renderMenu` L116 |
| World map | `50_scenes.js` `WorldMapScene.render` L300–348: info panel L328–339, bottom button bar L343–344 |
| Pause / menu / settings | `32_gameplay.js` `PauseScene` L297; `50_scenes.js` `MapMenuScene` L350, `SettingsScene` L374 |
| Touch buttons | `04_input.js` `Touch.layout` L153–167: pause/lens/hint at (W-22, 22/64/98), which **collides with a top-right minimap** |

### 1.7 Game data available for a reference-style HUD
- **Health:** none. `Player.hurt(dir,power)` (`30_world.js` L203–208) only sets `inv=1.1`, applies knockback and lock, plays the `hit` animation, shakes the camera and emits sparks. It is non-lethal by design. Callers:
  - hazards, `30_world.js:283` (lv06 arcs `46_lv06.js:21`);
  - adversary contact, `30_world.js:526`;
  - failed micro-check, `32_gameplay.js:148`.
  - Respawn already exists: `lastSafe` (L278), and falling out of the world triggers the "Ruta recuperada" toast (L277).
- **Energy/stamina:** none. There is no cost on the Lente (`32_gameplay.js:117`), Barrido (L152–159) or Vela glide (`30_world.js:244–248`).
- **Level/XP:** no explicit XP. What can feed one:
  - `GS.s.mastery` has 20 keys from 0 to 100, updated in `LearningModel.record` (`21_learning.js` L54–84);
  - `GS.s.completed`, `GS.s.badges`, `GS.s.codex`, `GS.s.trust`;
  - `newState()` (`07_state.js` L24) has `player:{name:'Amaya'}` only.
- **Portraits:** `Portraits.get(id,expr,talk,blink)` → 128×128 (`14_portraits.js:493`), 18 expressions (`PEXPR`). There is no small bust; a 2:1 decimation for the HUD (tested in the mock) loses the eyes, so a bust variant is needed.

---

## 2. Reference UI STYLE LOCK (measured)

### 2.1 Geometry (logical px)

| Element | Rect (x, y, w, h) | Internals |
|---|---|---|
| HUD portrait frame | 4, 4, 54, 52 | Square frame, chamfer 3, portrait window about 48×46 |
| HUD info panel | 57, 8, about 90, 46 | Chamfer 2; bottom-right chamfer/step 6. Name bold at +7,+5; 7 hearts at +6,+16 (9×8 each, 1 px gap ≈ 69 px); bolt 6×7 + bar 62×6 at +6,+26; `Nv. 3` at +7,+36 |
| Speech bubble | 134, 53, 133, 57 | Padding 8; name bold at +8,+7; body lineH 12; 4 lines of about 30 chars; tail 7 px at bottom-left (x+8..+16) |
| Minimap | 533, 5, 103, 69 | `MAPA` tab 34×12 at +5,+4; 6 island nodes about 16 px; dashed chain links |
| Question panel | 506, 172, 130, 118 | Icon badge 22×22 overhanging the top-left corner by 2–3 px; header bold at +28,+7; divider at y+21; stem lineH about 11.7; 4 rows, each a 13×13 letter box + 3 px gap + row 13 px tall; 15 px pitch |
| Level strip | 0, 292, 640, 68 | 8 cards of 74×57, gap 5, x0 = 6; thumbnail 70×41; label band 12 px; tiny caps |
| Wooden signpost | 2..92, 105..215 | 4 arrow planks of 85×16, 2 px gaps, post about 6 px wide |
| Science labels | CAPTACIÓN 35×9; PRETRATAMIENTO 53×10; AGUA POTABLE + (Permeado) 45×16; SALMUERA + (Rechazo) 36×18 (violet); H₂/HIDRÓGENO VERDE 46×29 (green) | Tiny-size caps (≈3.6 px per char) with a 1 px pale rim; short stem/legs to the object |

### 2.2 Frame layering (pixel scan of the question panel's left edge, reference x=889→895)
From outside in: **1 px ink `#000633` → 1 px light rim `#a8c8ff` (top/left; bottom/right `#6d9be8`) → 1 px mid rim `#3a64b0` → fill**.
- Fill is flat in two bands, `#072248` on top and `#041533` below (break at about 42 % of height). There is no dither.
- Inner keyline `#12305a`, inset 5 px, on large panels.
- Corners are chamfered 2–3 px (HUD bottom-right 6).
- Corner sparkles: 2–3 dots `#7fb8ff`/`#e8f6ff` at the top-right and bottom-right.
- No dithered drop shadow.

### 2.3 Measured palette

| Token | Hex | Source |
|---|---|---|
| Panel fill top / bottom | `#072248` / `#041533` | HUD info, question body |
| Ink | `#000633` | All frames |
| Rim hi / lo / mid | `#a8c8ff` / `#6d9be8` / `#3a64b0` | Edge scans (`#83abff`, `#d2efff`, `#3258a1`, `#355ca1`) |
| Keyline | `#12305a` | Inner rectangle |
| Body text / header text | `#e2ebfc` / `#e6f8fe` | Cool white, not the current warm `#fffaf0` |
| Hearts: outline / base / shade / highlight | `#801728` / `#e83b41` / `#b42e3c` / `#ffb0a8` | Hearts |
| Empty heart | `#3a1a2a` outline, `#1d1934` fill | — |
| Energy bar: ink / track / fill / top / bottom | `#001a34` / `#0b4b72` / `#1ef4fd` / `#9ffcff` / `#13a3d3` | Bar |
| Bolt | `#f2ce4a`, outline `#a8701a`, highlight `#fff2a0` | — |
| Option row (normal) | rim `#2b3b5d`, fill `#031632`, text `#ceddf8` | Rows A, B, D |
| Letter box (normal) | rim `#9fb0ca`, fill `#05122d`, letter `#ebfaff` | — |
| Correct row | rim `#3fe0a0`, inner `#0f9e6e`, fill `#056050`, text `#eafff6` | Row C |
| Correct letter box | rim `#2ed899`, fill `#0a5a44` | — |
| Minimap content / grid / tab | content `#051a36`, grid `#0a2444` (8 px), tab rim `#94acbf` on `#041d3b` | — |
| Strip | bg `#00152c`, top rule `#1e5a8a`; label band `#011b2b`, label text `#d9f8fe` | — |
| Card accents | green `#54be93`, cyan `#6dd0eb`, gold `#e0cb77`, red `#eb9484`, blue `#54c3e2` | — |
| Label (neutral/water) | pill `#031128`, rim `#b0cbdb` or `#8fdfff` | — |
| Label brine | rim `#a086d0`, fill `#0b0a2e` | — |
| Label green (H₂, agro) | fill `#09513b`, rim `#78ce8d` | — |
| Wood | `#1f0803 #3a1c15 #562820 #74381c #9f6f4d #c08a5c`; post `#572c21`/`#7e5635`; text `#f6e6dc` | — |

### 2.4 Typography
- Body: 7 px caps with about 5 px x-height and 1 px stroke. `FONTS.main` already matches this.
- Headers, names and option letters (KIRU, AMAYA, PREGUNTA, MAPA, A–D) are **bold, about 2 px vertical stroke**. No such font exists today.
- Labels and card captions use tiny-size caps.
- Text inside panels has no drop shadow.

---

## 3. Gap analysis

| Element | Current | Reference | Gap |
|---|---|---|---|
| Frame layering | Shadow dither + ink + checker-dithered fill + single cyan edge `#22bdd0` + L-brackets; violet-indigo fill `#0e1430` | 3-layer bevel (ink / pale rim / mid), flat 2-band navy fill, keyline, chamfer, sparkles | **High.** The checker fill and cyan neon read "retro prototype". Rim hue is wrong (cyan vs periwinkle). |
| Colours | `dialog` indigo+gold, `glass` translucent, warm-cream text | Single navy-steel family; semantic green/red/violet only for state | **High.** Too many unrelated frame families. |
| Headers | 13 px dithered band, 1 px text, 12 px icon inside the band | Octagonal 22 px icon badge **overhanging** the corner, bold title, thin divider | **High** |
| Typography weight | Everything 1 px; titles = main ×2/×4 | Bold headers; normal body | **High.** Needs `FONTS.bold`. |
| Spacing | Padding 10, row gap 3, panels sized to the screen (MicroCheck 500×270, half empty) | Padding 6–8, compact panels sized to content | **Medium** |
| Icons | 12 px, single violet-black outline, flat | 14–22 px, coloured sel-out outlines, highlights, glow halos | **High** for badges and minimap; **medium** elsewhere |
| Portrait framing | 128 portrait clipped by the box; flat name plate | HUD bust in a square frame; full portraits in cinematic moments | **High** |
| Bars | Black track, no caps | Tinted track, 6 px, highlight/shadow rows, rounded caps | **Medium** |
| HUD | Objective text plus key slots only; no identity, health, energy or level | Portrait + name + 7 hearts + energy + Nv | **Missing**, and the data model is missing too |
| Minimap | None in gameplay | Nexus island graph | **Missing** |
| Question panel | Full-screen dither, letter inside the row, violet states | Compact side panel over a visible world, separate letter box, green correct state | **High** |
| Level cards | None (the map has a text button bar) | Strip of 8 thumbnail cards with accent rims | **Missing** |
| Wooden signs | 11 px flat plank, tiny text, no arrows | Thick arrow planks, grain, nails, main-size caps, post | **High** |
| World science labels | Only with the lens (`lensTag`: flat 2 px colour stub) | Always-on framed pills with stems, colour-coded by system | **High.** The prompt's §25 requires science to be visible in-world. |
| Dialogue | Full-width 628×86 generic box (the prompt bans "cajas de texto genéricas") | Anchored speech bubble with tail and name | **High** |
| Reward (level complete) | Confetti, ★ | Restrained (prompt §34–35) | **Medium** |

---

## 4. Re-skin plan

### 4.1 Tokens: `PANEL_STYLES` v2 (keep the keys, change the schema)
Rewrite `06_ui.js` L7–18. Schema: `{ink, hi, lo, mid, fill:[top,bot], key, spark, text, dim}`.

| Style | ink | hi | lo | mid | fill top / bot | key | spark |
|---|---|---|---|---|---|---|---|
| `tech` (default; alias `glass`, `toast`, `dialog`) | `#000633` | `#a8c8ff` | `#6d9be8` | `#3a64b0` | `#072248` / `#041533` | `#12305a` | `#7fb8ff` |
| `hud` (HUD, minimap) | `#000633` | `#b8d4ff` | `#7bacfb` | `#3a64b0` | `#082650` / `#051a3a` | `#12305a` | `#e8f6ff` |
| `green` | `#00140c` | `#7fe6bb` | `#4cc796` | `#1f8a5c` | `#0b513b` / `#073d2e` | `#0f5a40` | `#c2f5de` |
| `alert` | `#1a0010` | `#ff9a8a` | `#e06a6a` | `#a8243c` | `#3a0c1c` / `#2a0814` | `#4a1426` | `#ffc6b4` |
| `mirage` | `#12001e` | `#f6a8f0` | `#d070d0` | `#8a2c9c` | `#24093e` / `#170628` | `#3a1250` | `#56e5ff` |
| `limen` | `#001018` | `#c8f8ff` | `#7ee8f0` | `#2f9ab8` | `#06283a` / `#041c2a` | `#0f3a50` | `#ffffff` |
| `mosaic` | `#00140a` | `#d2f5a0` | `#86e36f` | `#3a8a3a` | `#0c2a1c` / `#081e14` | `#16402a` | `#ffe14d` |
| `violet` (brine) | `#0a0026` | `#b49cff` | `#977ccb` | `#5a44a8` | `#0b0a2e` / `#08082a` | `#1a1650` | `#dcd0ff` |
| `paper` (evidence board only) | `#1f0803` | `#c08a5c` | `#9f6f4d` | `#74381c` | `#f6e6cc` / `#ecd6b0` | `#d8b88a` | `#fff6d8` |
| `sheet` (new; SOLO context and data tables) | `#000633` | `#8fdfff` | `#5ab0d8` | `#1e5a8a` | `#061a36` / `#04142c` | `#12305a` | `#c4fbff` |
| `hc` (`settings.highContrast` override) | `#000000` | `#ffffff` | `#ffffff` | `#000000` | `#000820` / `#000820` | `#3a3a3a` | — |

- **Text tokens** (new `UI_INK`): body `#e2ebfc`, header `#e6f8fe`, dim `#93a6c8`, disabled `#4f5f7f`. Keep `TEXT_COLORS` but soften `{y}` to `#f5dc5a` and `{o}` to `#f5a576`, which are the reference keyword tones.
- **Button palettes** (replace `drawButton` L222–231). Format is fillTop / fillBot / rim / ink / text; draw 1 px ink, 1 px rim, flat 2-band fill, 1 px chamfer, no dither.

| Button style | fillTop | fillBot | rim | ink | text |
|---|---|---|---|---|---|
| `primary` | `#0b2a5a` | `#082048` | `#8fb4ff` | `#000633` | `#e6f0ff` |
| `ghost` | `#061a38` | `#041530` | `#3a5a8a` | `#000633` | `#b8c8e8` |
| `good` | `#0e6e57` | `#0a5646` | `#3fe0a0` | `#00140c` | `#eafff6` |
| `gold` | `#6a4a0e` | `#553a08` | `#ffd23a` | `#1a0f00` | `#fff6d8` |
| `danger` | `#5a1424` | `#46101c` | `#ff8a7a` | `#1a0010` | `#ffe8e4` |
| `choice` | `#0b1c3a` | `#081530` | `#6d8fd0` | `#000633` | `#e6f0ff` |
| `paper` | `#f6e6cc` | `#ecd6b0` | `#74381c` | `#1f0803` | `#3a1a10` |

  - Focus: rim `#e8f6ff` plus the existing blinking cursor.
  - Disabled: `#0a1222` / `#24324a` / text `#4f5f7f`.
  - `tab`: ghost, with a 2 px `#ffd23a` underline when selected.

### 4.2 Primitive changes (same signatures, so every existing call site re-skins automatically)
- **`UIK.panel(g,x,y,w,h,style,accent)`**: implement the frame validated in `ui_mock.js` `frame()`.
  - Chamfer 2 by default, configurable through a new optional 8th parameter `opts={chamfer,cbr,key,spark,badge}`.
  - Draw the keyline only when w≥96 and h≥48.
  - `accent` overrides `hi`.
  - Use only `frect`, with zero `fdither` calls; this is also faster.
- **`UIK.header(g,x,y,w,title,style,icon)`**: if `icon` is set, draw `UIK.badge(icon)` 22×22 at (x−3, y−3), title in `FONTS.bold` at (x+28, y+7), divider 1 px `key` at y+21 from x+26 to x+w−6. Content starts at y+26.
  - Because this moves content down by 4 px, call sites that hard-code `y+22` need a pass. Listed in 4.7.
- **`UIK.bar(...)`**: 1 px ink `shade(col,-0.85)`, track `shade(col,-0.65)`, fill `col`, top row `shade(col,0.45)`, bottom row `shade(col,-0.25)`, corner pixels ink (rounded caps). Keep `segs`.
- **`UIK.frame`**: repurpose as the portrait frame (ink / hi / mid, chamfer 3).
- **`Charts.frame(g,x,y,w,h,bg)`**: make it an inset well — ink `#000633`, fill `bg||'#020e26'`, top inner row `#00081c`, bottom and right inner row `#163a6a`. Grid dots in `Charts.line` move from `#1f2a5a` to `#12305a`; axis text from `#8a8fb8` to `#93a6c8`.
- **`Gui.choice(g,id,x,y,w,label,letter,opts)` → `{clicked,h}`** (signature unchanged), drawn as the reference option row:
  - Separate letter box 13×(13 or row h) at x: ink, 1 px rim `#9fb0ca`, fill `#05122d`, bold letter `#ebfaff`.
  - Row at x+16, width w−16: ink, rim `#2b3b5d`, inner `#031632`, text main `#ceddf8` at +6,+3; wrap width w−26; h = max(13, lines·11+3).
  - States:

| State | Row rim | Row fill | Letter box | Extra |
|---|---|---|---|---|
| focus | `#6d9be8` | — | — | Cursor arrow |
| selected | `#ffd23a` | `#0b2450` | Fill `#ffd23a`, letter `#1a0f00` | — |
| correct | `#3fe0a0` with inner `#0f9e6e` | `#056050` | Rim `#2ed899`, fill `#0a5a44` | `check` icon on the right |
| wrong | `#ff6b6b` | `#3a0c1c` | Rim `#ff9a8a` | `cross` icon |
| dim | `#16243e` | `#020e26` | — | Text `#4f5f7f` |

  - Remove the violet focus dither at L283.
- **`Gui.slider`**: track as an inset well 5 px; fill uses the bar style above; knob 7×11 with ink, rim `#d2efff`, body `#8fb4ff`, bottom `#3a64b0`, grip pixel `#000633`. Label `#93a6c8`, value in `col`.
- **`Gui.toggle`**: pill 20×10. Off: `#0b1c3a`, knob `#8a97b8`, tiny "NO". On: `#0e6e57`, knob `#c2f5de`, tiny "SÍ". Colour, position and text all carry the state.
- **`Gui.renderTooltip`**: `tech` panel; text `#e2ebfc`.
- **Icons**:
  1. In `Icons.get` L88, replace `pb.outline('#140d26')` with `pb.outline(n => darkOf(n, -0.62))` to get coloured selective outlines, then re-outline with `#000633` only on pixels left transparent.
  2. Add `Icons.defBig(name,fn)` for a 22×22 art set drawn into a 24×24 buffer (book open with an orange cover, map, question, warn, target, kiru, sun, turbine, water, h2, plant, battery, salt, membrane, mosaic, gear, eye, hint, lens, star).
  3. Add `Icons.badge(g,name,x,y,size=22,style='tech')`: an octagon with chamfer 5, the frame layers above, and the big icon (falling back to the 12 px icon centred).
  4. Add `Icons.glow(g,name,x,y,col)`: an `fshadow` halo ellipse plus the icon.
  - Keep `Icons.draw` untouched.
- **Fonts** (`02_font.js`):
  - Add `opts.bold` to `BitmapFont`: dilate each glyph row horizontally after accent composition, so width +1 (see `dil()` in the mock).
  - In `initFonts` add `FONTS.bold = new BitmapFont(FONT_SRC,{cellH:11,top:2,lineH:11,accented:ACCENTED,bold:true})`.
  - Change L321 to `font.top===2 ? 2*scale : 0`.
  - Optionally let `drawTitleText` take `opts.font='bold'` for chapter titles at ×2.
  - Panel text default becomes `shadow:null`; keep the shadow only for text drawn over scenery.

### 4.3 New widgets (new file `src/06c_ui_widgets.js`, which sorts after `06_ui.js`)

1. **`UIK.hudPortraitBlock(g, x=4, y=4, d)`**, with `d={name, portrait:canvas48x46, hp, maxHp, energy, rank, rankFrac, hurtFlash, lowEnergy}`.
   - Portrait frame 54×52 (chamfer 3). Window 48×46, bg `#0a1a3a` with an `fdisc` glow `#10284e`, blended to `mixHex(..., SPEAKERS.amaya.color, 0.15)`.
   - Info panel at x+53, y+4, 90×46, style `hud`, `cbr:6`.
   - Name in bold `#edfcfe` at +7,+5.
   - Hearts: 7 sprites of 9×8 at +6,+16, pitch 9. Map (o = outline, h = highlight, b = base, s = shade):
     `.oo.oo.` / `ohhboob` / `ohbbbbo` / `obbbbso` / `.obbso.` / `..oso..` / `...o...`
     Full: o `#801728`, h `#ffb0a8`, b `#e83b41`, s `#b42e3c`. Empty: o `#3a1a2a`, fill `#1d1934`. The heart just lost flashes white for 0.3 s.
   - Bolt 6×7 at +6,+27 (`...oyo/..oyo./.oyyo./oyyyyo/..oyo./.oyo../.oo...`, y `#f2ce4a`, o `#a8701a`) and a bar 62×6 at +14,+27 using the §2.3 colours. When `energy<0.15` the fill turns `#ff9f43` and blinks.
   - `Nv. N` in main `#ebfcff` at +7,+37; XP line 40×2 at +35,+40 (`#ffd23a` on `#3a2a08`).
2. **`Portraits.bust(id, expr, w=48, h=46)`** (in `14_portraits.js`): render the existing rig head at a dedicated small scale, or as an interim use a 2:1 mode-filter downsample of the region (16,8)–(112,100) where an outline pixel wins ties. Cache by `id|expr`. The HUD uses `Player.expr || (hurt ? 'worried' : hp<=2 ? 'tired' : 'smile')`.
3. **`UIK.speechBubble(g, ax, ay, {name, nameCol, text, max, w≤200, side, avoid:[rects]})`** → `{x,y,w,h}`.
   - Panel `tech`, chamfer 3. Name in bold at +8,+7 with a 12×2 accent bar under it in `nameCol` (speaker identity).
   - Body main `#e2ebfc` from +20, lineH 12 (13 when `textScale>1`); typewriter through `max`.
   - Tail: 7 rows of stair-step triangle (ink / hi / fill / lo) aimed at the anchor (ax, ay = speaker head).
   - Clamp into x∈[4,W−4] and y∈[62,H−40], avoiding the minimap and slot rects (532..636 × 4..100).
   - Reuse for `drawBubble` (`30_world.js` L363), keeping its signature `drawBubble(g,x,y,text,edge,t,maxW)`, where `edge` becomes `nameCol`.
4. **`UIK.questionPanel(g, x, y, w, {title='PREGUNTA', icon='book', stem, style})`** → `{contentY}`. Badge, header and divider as in 4.2; stem main `#d5dcf5`, lineH 11; option rows drawn by the caller through `Gui.choice` (pitch h+3).
   - **Minimum width 200**: the main font is about 5.2 px per char against the reference's about 3.6, and at w=130 the options overflowed in the mock. Use w=214 at x=420 for in-world side panels.
5. **`UIK.minimapPanel(g, x=532, y=4, w=104, h=70, {mode:'nexus'|'level', sc})`**.
   - Style `hud`; content well `#051a36` with an 8 px grid `#0a2444`; `MAPA` tab 34×12 (ink, rim `#94acbf`, fill `#041d3b`, bold `#e8fdff`).
   - `nexus` mode draws 8 system islands from a new `SYSTEM_NODES` table:
     water {1,2} ring `#56e5ff` · brine {3} `#e050c8` · solar {4} `#ffd23a` · wind {5} `#9fe6ff` · BESS {6} `#b6f05a` · H₂ {7} `#40d0d4` · agro {8} `#4ccb70` · core {0,9,10} `#b49cff`.
     Positions: core centred, others on an ellipse rx 38, ry 18. Each island is a cached 20×12 `PixelBuffer` (grass cap from RAMP.leaf, soil `#8a5a3c`/`#5a3826`, tapering rock `#4a3048`) plus an `fshadow` glow ring (0.5) plus a 12 px icon.
     Links (from `MAP_LINKS` collapsed to systems) are dashed: 3×3 ink with a `#e8f6ff` centre, 2 of every 3 steps.
     The current chapter pulses a gold ring. Locked nodes get a `#000633` dither at 0.5.
   - Bottom 4 px is a level progress strip: track `#0b2444`, station ticks in `st.glow`, checkpoints `#86e36f`, player `#ffd23a` 2×4 at `P.x/world.w`.
   - Cache the static layer per `unlocked/completed` hash.
6. **`UIK.levelCard(g, x, y, w=74, h=57, {id, label, accent, state:'done'|'open'|'locked'|'current', selected})`**.
   - Ink, 1 px accent rim, inner `#011b2b`.
   - Thumbnail `LevelThumbs.get(id)` 70×41 at +2,+2.
   - Label band 12 px `#011b2b` with a top rule `shade(accent,-0.4)` and tiny `n. NAME` `#d9f8fe`.
   - Locked: thumbnail dither `#000633` 0.55 plus `lock` icon. Done: `check` at the top-right. Selected: 2 px rim `#fff2a0` plus a sparkle.
   - Accent per chapter: 0 `#54c3e2`, 1–2 `#6dd0eb`, 3 `#a086d0`, 4 `#e0cb77`, 5 `#9fe6ff`, 6 `#e070d0`, 7 `#54be93`, 8 `#86e36f`, 9 `#8fb4ff`, 10 `#eb9484`, 11 `#ffd23a`.
7. **`LevelThumbs.get(id)`**: a procedural 70×41 vignette composed from existing `ART.*` primitives at 1:1, validated for chapters 1–3 in `ui_mock2.png`. Cache in `BG_CACHE`; generate lazily, one per frame.
   - Base: `ART.sky(pb, RAMP.skyDay|skyDusk, hz=26, {sun})` + `ART.ridge` + `ART.sea` or dune ramp.
   - Subject per chapter:

| Chapter | Subject |
|---|---|
| 0 | houses + `ART.bunting` + SYNARA tower |
| 1 | `ART.palm` ×2 + `ART.house` + sea |
| 2 | `ART.tank` ×4 + `ART.roRack` |
| 3 | `ART.evapPond` + `ART.saltPile` + mesa |
| 4 | `ART.pvRow` ×4 at dusk |
| 5 | `ART.turbine` on g, drawn after `toCanvas` |
| 6 | `ART.batteryContainer` at night |
| 7 | `ART.electrolyzer` + green tanks |
| 8 | `ART.crop`, `ART.shadeHouse`, `ART.dripLine` |
| 9 | `ART.bigScreen` + people |
| 10 | ochre sky `#c97c38` with silhouettes |
| 11 | harvest |

8. **`drawSign(pb, x, y, text, col='#8a5a3c', opts={})`** (keep the signature; about 80 call sites) and new **`drawSignpost(pb, x, y, items:[{text,dir}], opts)`**.
   - Wood mode applies when `col` is the default or earthy: plank 15–17 px using the §2.3 wood ramp (row 0 and last = `#1f0803`, row 1 `#9f6f4d`, row h−2 `#3a1c15`, body `#562820`); 6 grain lines `#3a1c15`, 4 highlights `#74381c`; nail `#c8b8a0` over a `#1f0803` shadow; 5 px arrow tip when `dir`. Text is uppercase **main** font `#f6e6dc` with a 1 px shadow `#2a120a`, about 6 px per char. Post 4–6 px `#572c21`, with `#7e5635` left highlight and `#1f0803` outline.
   - Coloured `col` (for example `#1491aa`, `#8d6bff`) switches to painted-tech mode and renders a `worldLabel` pill into the buffer.
   - Needs a helper `textToPB(text,font,col)` (canvas `drawText` → `getImageData` → `PixelBuffer`) because signs are baked at props time.
9. **`drawWorldLabel(g, sx, sy, L)`** with `L={text, sub, kind:'water'|'brine'|'green'|'solar'|'alert'|'tech', stem:6, ax, ay, hero:{formula:'H₂'}}`.
   - Pill: ink, 1 px rim per kind (§2.3), fill, tiny caps `#e8fcff`, padding 4/3; the sub line is tiny `#b0cbdb` at +7.
   - Stem 1 px rim + 1 px ink, plus a 3×2 foot at the anchor.
   - The `hero` variant (H₂ HIDRÓGENO VERDE) draws the formula in bold ×2 and is 46×30.
   - Data lives in a new per-level `def.labels:[{x,y,text,sub,kind,ax,ay,flag}]`, drawn in `GameplayScene.render` after `renderGrade` (`32_gameplay.js` L193–194) and before the lens (L196), so labels are not darkened by the grade.
   - `lensTag(g,x,y,text,col,icon)` (L250, 59 sites) keeps its signature but adopts the pill look (rim = `col`, fill `#031128`, icon via `Icons.draw` at x+2).
10. **`UIK.instrumentPlate`** (inside `hudGauges`, same signature): each 96×30 — badge 16 px, label tiny `#93a6c8`, value main in `color`, bar 84×5 using the new `UIK.bar`. One `hud` frame containing all plates, with keyline separators.
11. **`UIK.keycap(g,x,y,key)`**: 11×11, ink, rim `#d2efff`, fill `#0b2a5a`, bold key. Use in `Station.renderPrompt` and `drawTalkPrompt`; the label becomes a `tech` pill.

### 4.4 Game state to add, and where to wire it

| Datum | Definition | Wiring |
|---|---|---|
| Hearts | `Player.hp` / `Player.maxHp = 7`, reset per level (non-lethal) | `30_world.js` Player ctor L195–200: add `this.maxHp=7; this.hp=7; this.regenT=0; this.energy=1;`. **`hurt()` L203**: `this.hp=Math.max(0,this.hp-1); this.hurtT=1.5;` and when it reaches 0: `this.x=this.lastSafe.x; this.y=this.lastSafe.y; this.hp=this.maxHp; Game.toast('Ruta recuperada · integridad restaurada','reset','#ffe14d',2)`. Regen in `update` (after L212): when `inv<=0`, `regenT+=dt`; at >6 s gain +1 heart. |
| Energy | `Player.energy` 0..1 ("carga del traje / KIRU"). Non-gating by default (`ENERGY_GATE=false`). | Drains: lens on, −0.02/s (`32_gameplay.js` `update` near L92); Barrido scan, −0.12 per use (`useTool` L152); glide, −0.10/s (`30_world.js` L244). Regen +0.15/s on the ground with nothing active. At 0 while gliding, apply `glideFall*1.5` only if the gate is on. **Verify lv05 glide routes before enabling the gate.** KIRU warns once below 0.12. |
| Nv (rank) | `GS.xp() = Σ mastery (0–2000) + 20·completed.length + 2·codex.length`; `GS.rank() = min(15, 1 + floor(xp/150))`; `rankFrac = (xp % 150)/150` | `07_state.js` GS: add `xp()` and `rank()`, and `lastRank:1` in `newState`. At the end of `LearningModel.record` (`21_learning.js` L83) call `GS.checkRank()`, which toasts `Nv. N · dominio en aumento` with `star` / `#ffd23a` and sfx `unlock`. No "¡¡SUPER!!" (prompt §35). |
| Portrait expression | Derived | `hudPortraitBlock` picks: `hurtT>0` → `worried`; `hp<=2` → `tired`; rank-up for 2 s → `happy`; else `smile`. |

### 4.5 Screen layouts and restyle order

**Gameplay layout** (`32_gameplay.js` `renderHUD`, L213–251):
- Portrait block at (4,4)–(147,56).
- Objective card at (4,60), w 200, using the `hud` style with a `target` badge, tiny "OBJETIVO" `#ffd23a` and main body text. Only after the chapter card has finished.
- Chapter card as a centred ribbon, x 158..482, ≤4.2 s; bold title ×2 with a `#000633` outline, no box.
- Minimap at (532,4,104,70).
- Tool slots: 5 slots of 20×20 at x=532+21i, y=78; active rim `#ffd23a`; key tiny in `#ffd23a` on a 1 px ink pill.
- Science plates bottom-left at (4, H−36).
- Lens label moves to top-centre (228,6).
- Toasts bottom-right, at H−28 and stacking upward. On the world map their base y must stay ≥ 70 px above the strip (see phase 6).
- Touch: move pause/lens/hint in `Touch.layout` (`04_input.js` L164–166) to y = 104/138/172, below the minimap.

**Order** (each phase is shippable and keeps all 11 levels and 11 simulators running):
1. **Foundation**, in `06_ui.js` and `02_font.js`: PANEL_STYLES v2, `UIK.panel/header/bar/frame`, `Charts.frame`, `drawButton`, `choice`, `slider`, `toggle`, the tooltip, the icon outline, `FONTS.bold`. This re-skins about 200 call sites with no edits at those sites. Add `TESTS.ui` to `99_main.js` as a widget gallery (all styles, buttons, every option-row state, bars, icons ×1 and ×big) for screenshot QA.
2. **Gameplay HUD**: `renderHUD`, `hudGauges`, `renderLens`, `drawTalkPrompt`, `Station.renderPrompt`, `renderToasts`, plus the state from 4.4 and the touch positions.
3. **Dialogue**: `DialogueScene.render` (`31_story.js` L86–132) gets two modes.
   - **Bubble mode**: used when the speaker entity is on screen, `!L.choices` and text ≤ 160 chars. Resolve `who`: `amaya` → `sc.player`, `kiru` → `sc.kiru`, else `world.entities.find(Actor with id===who || charId===who || charId===SPEAKERS[who].portrait)`. The anchor is the head at `y − (bubbleH||74)`. Find the GameplayScene with `Game.scenes.find(s=>s===GameplayScene)`.
   - **Cinematic mode**: used otherwise, or when `L.mode==='portrait'`. Portrait frame 134×134 at (6, H−140), **with the whole 128 portrait visible**; bg tinted to `mixHex('#041533', sp.color, 0.18)`. Text panel `tech` at x 146..634, h 86, y H−92, name bold with an accent bar, X-skip hint tiny `#93a6c8` (current `#5a5e80` fails contrast).
   - Choices become `Gui.choice` rows A, B, C… at x W−266, w 260, stacked above the panel, replacing L116–126.
   - `limen`, `mirage` and `mosaico` keep their themed styles.
   - Also `drawBubble` → `speechBubble` (dark style).
4. **In-world**: `drawSign`, `drawSignpost`, `textToPB`, `lensTag`, `lensBoundary` (rim colours only), `drawWorldLabel`, and `def.labels` for the **lv01 vertical slice first**:
   - TOMA COSTERA becomes a wood signpost (`41_lv01.js:31`);
   - PRETRATAMIENTO becomes a tech label (`41_lv01.js:89`, the colour `#1491aa` routes it automatically);
   - PLANTA OI becomes a violet label (`:93`);
   - new labels: CAPTACIÓN near the intake (x≈1100–1236), FILTROS / ΔP at the filters checkpoint (x≈1600), SENSOR at x=735.
5. **Question UIs**:
   - `MicroCheckScene.render` (`21_learning.js` L359–384): drop the full-screen dither at L360, replace it with a dither 0.35 only behind the panel plus a vignette; `questionPanel` at x 420, y 96, w 214, with style `mirage` kept for adversaries.
   - `ExplainScene` (`40_common.js` L181–216): `questionPanel` 540 wide; confidence buttons as `ghost`/`gold`.
   - `SOLOScene`: header badge `question`; progress pills become 18×6 using `UIK.bar`; context moves from `paper` to `sheet`; `drawDataTable` header `#1e5a8a` with `#e6f8fe` text, rows `#061a36`/`#082248`, text `#ceddf8`; options as the new `choice`; feedback in `green`/`alert`.
   - `NumericScene` and `DebateScene` (`22d_extras.js`); `CrisisCardScene`, `PriorityScene`, `ObjectiveScene` (`4a_lv10.js`); `ChainScene` (`49_lv09.js`).
6. **Menus**:
   - `WorldMapScene`: draw `mapC` and nodes at y−36; strip at y 292 with 8 visible of 11 cards (carousel keeping `sel` visible, `levelCard`); the 5 bottom buttons move to icon slots top-right (W−110, 6) with tooltips; info panel `tech` at (px, 34, 220, 250) with a chapter-icon badge.
   - `TitleScene.renderMenu`: vertical list panel.
   - `PauseScene`, `MapMenuScene`, `SettingsScene`: `tech` + badge headers.
   - `LevelCompleteScene`: remove confetti at L39 and use `crystal`/`firefly` sparkles ≤ 0.1/frame; the medal becomes a 48 px badge.
   - Codex, Evidence (keep `paper` cork), Analytics, Teacher, Practice, Credits.
7. **Simulators**: `makeSim.render` header becomes `UIK.panel(4,4,W−8,22,def.style||'hud')` plus a badge at (2,1), bold title, phase pill gold 13 px, phase dots 10×6 green/navy, RA chip. The message L144–153 becomes `speechBubble` with name KIRU and the tail toward a 24 px KIRU bust at the bottom-left. `renderSafeErr` uses the `alert` header badge `warn`. The sim backdrop (L130–131: `#070a1c` + dither 0.5) becomes flat `#041026` with a 16 px grid `#0a1e3a` (no checker).

### 4.6 Legibility constraints
- **Main font** for every sentence, option, value and stem. lineH 11 in panels, 12 in bubbles, 13 when `textScale>1`. Line length ≤ 230 px (about 44 chars).
- **Bold** only for names, headers, option letters and `Nv.` (≤ 20 chars). Never for body text.
- **Tiny** only for caps labels ≤ 22 chars, axis/unit numbers, card captions and key hints, and always on a solid pill (never over scenery or dither). Convert these 19 tiny-paragraph sites to main:
  `21_learning.js:422`, `40_lv00.js:291`, `43_lv03.js:513`, `47_lv07.js:461`, `48_lv08.js:414`, `49_lv09.js:472,502,504,521,523`, `4a_lv10.js:393,400`, `4b_epilogue.js:126,127,187`, `51_teacher.js:49,82,83,155`. The simulator 09 right panel in `sim09.png` is an example.
- No dither under text: delete `fdither` at `06_ui.js` L30, L240 and L283.
- Contrast: body `#e2ebfc` on `#041533` is about 15:1; dim text `#93a6c8` is ≥ 6:1. Never use `#5a5e80` on navy.
- Every state uses colour, icon and word together (correct → green + check + "Correcto").
- Hit targets ≥ 13 px tall (option rows 13, buttons 18–22), touch × `touchScale`.
- `highContrast` setting → `hc` style.

### 4.7 Call sites that need edits (everything else inherits through compatible APIs)
- **`06_ui.js`**: L7–18, L20–73, L77–95 (outline), L203–362.
- **`02_font.js`**: L170 (`{y}`/`{o}` tones), L174–195 (bold option), L248–266, L321.
- **`05_engine.js`**: L124–136.
- **`04_input.js`**: L164–166.
- **`07_state.js`**: `newState` L24–41 (`lastRank`), GS (`xp`, `rank`, `checkRank`).
- **`14_portraits.js`**: add `bust()`.
- **`21_learning.js`**: L83 (rank), L203–309 (SOLO header L206–214, L224, L250, L270, L276, L297), L317–332, L359–384, L397–406.
- **`22d_extras.js`**: L148, 149, 178, 179, 188.
- **`23_codex.js`**: L140.
- **`30_world.js`**: L195–212, L244–248, L203–208, L359, L363–376, L410, L424–433.
- **`31_story.js`**: L86–132.
- **`32_gameplay.js`**:
  - L92 and L117–159: energy;
  - L193–200: labels pass;
  - L209–211, L213–251, L254–260;
  - L304–305: Pause header.
- **`40_common.js`**: L34–70, L129–172, L181–216, L221–232, L238–262.
- **`50_scenes.js`**: L116–138, L300–348 (plus the y−36 offset in `build` L265 links and in `MAP_NODES` hit-testing L285), L357–358, L388–391.
- **`51_teacher.js`**: L11, 12, 29, 105, 106.
- **Header +4 px content shift** (wherever the content y follows `UIK.header`):
  - `21_learning.js` L207, L363→L364 (y+22), L398;
  - `22d_extras.js` L149, L179;
  - `32_gameplay.js` L305 (`_y=y+26`);
  - `40_common.js` L164→L165 (yy=y+22), L186→L187;
  - `41_lv01.js`, `42_lv02.js`, `4a_lv10.js` (2 sites);
  - `50_scenes.js` L358 (y=96), L389 (tabs at y 36);
  - `51_teacher.js` (2 sites).
- **Level files**: none required for phase 1. `def.labels` is opt-in per level (lv01 first); `drawSign` routing is automatic by colour.

### 4.8 Risks and QA notes
- Bubble mode needs placement rules so it never covers the speaker or the player. Prefer above the head, flip below when y<62, and keep the minimap and slot exclusion rects.
- `Gui.choice` keeps `{clicked,h}`, but row h changes from max(18,…) to max(13,…). Callers that stack options with `y += r.h + 3` are fine; check fixed-height layouts in lv10 `CrisisCardScene` L277–293 and `ChainScene`.
- The `drawText` offset fix is required before any `font:'bold'` call, or bold text renders 2 px low.
- Thumbnails must be built lazily (≤ 1 per frame) with a gradient placeholder taken from `LEVEL_META[id].pal`.
- Verify with `tools/smoke.js` and with shots of `test=ui` (new), `test=level&lv=1&nocard=1&px=600`, `test=map`, `test=sim&lv=2&s=Sim02&phase=guided`, and the SOLO query (use `%22ctx%22%3A%22RA-01-C1%22`). When pushing a dialogue through `shot.js`, use `eval:void talk(...)`, because `talk()` returns a promise that never resolves and the evaluate call hangs.

One side effect to know about: while clearing my own hung screenshot job I ran `pkill -f tools/shot.js`, which would also have killed any other agent's screenshot running at that moment (around 02:44). An agent with a failed shot from then only needs to re-run it.