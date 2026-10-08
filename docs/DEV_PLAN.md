# ARIDIA NEXUS — Plan de desarrollo (documento vivo)

Entregable: `aridia_nexus.html` (autocontenido, sin dependencias, offline).
Fuentes: `src/*.js` concatenados en orden por `tools/build.js`.

## Arquitectura (src/)
- 00_core.js       utilidades, RNG con semilla, matemáticas, colores, paletas/rampas
- 01_pixel.js      PixelBuffer (ImageData), dither Bayer, primitivas, contorno selectivo, ruido
- 02_font.js       fuente bitmap proporcional con acentos (5x7 + descendentes) + fuente de títulos
- 03_audio.js      Web Audio procedural (ambiente, música, SFX)
- 04_input.js      teclado, puntero/táctil, gamepad, remapeo
- 05_engine.js     loop, escenas, cámara, partículas, tweens, guardado
- 06_ui.js         GUI inmediata pixel (paneles, botones, sliders, gráficos, iconos)
- 10_rig.js        rig SDF de personajes (sprites 48x64 / 64x80) + retratos 128x128
- 11_chars.js      definiciones de personajes (Amaya, KIRU, Naira, Dante, Eliana, LIMEN, MIRAGE/MOSAICO, NPC)
- 12_props.js      PV, aerogeneradores, RO, tanques, tuberías, electrolizadores, cultivos…
- 13_bg.js         generadores de parallax (5–8 capas) por bioma, cielo por hora/clima
- 20_models.js     modelos científicos puros (RO, salmuera, PV, eólica, BESS, H2, agro, nexo)
- 21_learning.js   dominio, SOLO, pistas, feedback, analítica, metacognición
- 22_questions.js  banco 135 ítems + extras
- 23_codex.js      Atlas del Nexo
- 30_world.js      mundo de plataformas (heightfield, plataformas, escaleras, agua, viento)
- 31_story.js      director narrativo, diálogos, banderas, tablero de evidencias
- 40_lvXX_*.js     niveles 00–10 (escena + simulador + guion)
- 50_scenes.js     título, menú, mapa, codex, pausa, ajustes, docente, finales, créditos
- 99_main.js       arranque

## Estado
- [ ] Fase A motor + pixel toolkit + fuente + build + capturas
- [ ] Fase B rig de personajes + fondo costero + plataformas
- [ ] Fase C modelos científicos + tests
- [ ] Fase D aprendizaje + preguntas + codex + diálogo + guardado
- [ ] Fase E niveles 00–10
- [ ] Fase F título, mapa, finales, docente, accesibilidad, audio
- [ ] Fase G QA (tests node + playwright)
