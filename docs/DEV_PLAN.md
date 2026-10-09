# ARIDIA NEXUS — Plan de desarrollo (documento vivo)

Entregable: `aridia_nexus.html` (autocontenido, sin dependencias, offline).
Fuentes: `src/*.js` concatenados en orden alfabético por `tools/build.js` dentro de `src/template.html`.

## Arquitectura (src/)
- 00_core.js        utilidades, RNG con semilla, matemáticas, colores, paletas/rampas
- 01_pixel.js       PixelBuffer (ImageData), tramado Bayer, primitivas, contorno selectivo, ruido
- 02_font.js        fuente bitmap proporcional con acentos, fuente diminuta 3×5 con tildes y símbolos, títulos
- 03_audio.js       Web Audio procedural (ambiente, música por bioma, SFX, voces)
- 04_input.js       teclado remapeable, puntero/táctil, gamepad; búfer de eventos propio para la interfaz
- 05_engine.js      bucle de paso fijo, escenas, cámara, partículas, guardado, avisos
- 06_ui.js          GUI inmediata pixel (paneles, botones, sliders, gráficos, iconos procedurales)
- 07_state.js       estado de partida, herramientas, banderas narrativas, confianza
- 10_rig.js         rig por capas de personajes (sprites 48×64 / 64×80) y caché de sprites
- 11_chars.js       Amaya, KIRU, Naira, Dante, Eliana, LIMEN, MIRAGE/MOSAICO, BETA-9 y NPC
- 12_props.js       accesorios: palmeras, cactus, casas, FV, tanques, tuberías, aerogeneradores, aves
- 13_bg.js          generadores de parallax (5–8 capas), cielos, partículas ambientales
- 14_portraits.js   retratos 128 px con expresiones
- 15_tech.js        tecnología integrada a la naturaleza (OI, BESS, electrolizador, cultivos, goteo)
- 16_biomes.js      biomas por capítulo (plaza, planta, cañones, dunas, acantilados, bóveda, ciudadela, oasis, consejo, calima)
- 20_models.js      modelos científicos (OI, salmuera, FV, eólica, BESS, H2, agro, microrred, multiobjetivo) + validación
- 21_learning.js    dominio por concepto, SOLO, pistas, feedback, analítica, adversarios conceptuales
- 22a–22e           banco de 135 ítems por contexto (RA-01…RA-09), cálculos, debates y extras
- 23_codex.js, 24_codex_more.js   Atlas del Nexo (más de 60 fichas con fuente)
- 30_world.js       mundo de plataformas (alturas, plataformas, escaleras, agua, viento, estaciones)
- 31_story.js       diálogos, hablantes, pistas y tablero de evidencias
- 32_gameplay.js    escena de juego, Lente Nexo, herramientas, HUD, guiones asíncronos
- 40_common.js      makeSim (5 fases), explicar relaciones, cierre de nivel, decoración compartida
- 40_lv00 … 4a_lv10 once capítulos con guion, simulador, guardián y misiones secundarias
- 4b_epilogue.js    finales, epílogo "La Primera Cosecha", créditos finales y poscréditos
- 50_scenes.js      título, introducción, mapa, menús, ajustes y accesibilidad
- 51_teacher.js     modo docente, práctica, créditos
- 99_main.js        arranque y escenas de prueba (?test=…)

## Estado
- [x] Fase A motor + pixel toolkit + fuente + build + capturas
- [x] Fase B rig de personajes + fondos parallax + plataformas
- [x] Fase C modelos científicos + tests (77 pruebas)
- [x] Fase D aprendizaje + banco de 135 ítems + Atlas + diálogo + guardado
- [x] Fase E niveles 00–10 (cada uno con simulador de 5 fases, guardián, explicación, transferencia y SOLO)
- [x] Fase F título, mapa, finales (4), epílogo, créditos, poscréditos, docente, accesibilidad, audio
- [x] Fase G QA: tests de modelos, banco y Calima en Node; prueba de humo en navegador (tools/smoke.js)

## QA
- `node tests/models.test.js` · `node tests/bank.test.js` · `node tests/calima.test.js`
- `node tools/smoke.js`: título, mapa, 12 escenarios × 3 posiciones, 11 simuladores × 5 fases, escenas de cierre, 4 finales y 6 tarjetas de crisis sin errores de consola.
- Flujos de guion verificados con `AUTOPILOT_ON()` (solo en modo prueba) hasta `GS.s.completed` en cada capítulo y hasta el poscréditos.
- Corrección de entrada: la interfaz se procesa en `render()` y ahora recibe sus propios eventos (clic y teclado) una sola vez por cuadro; un control recién aparecido no acepta la misma pulsación de ENTER que lo mostró.

## Ideas futuras
- Más variantes de transferencia generadas por semilla en el modo Práctica.
- Traducción al inglés y al wayuunaiki de los diálogos clave.
- Exportación de rutas de aprendizaje para el docente por grupo.
