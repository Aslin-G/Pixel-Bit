# ARIDIA NEXUS — Plan de desarrollo (documento vivo)

Entregable: `index.html` (autocontenido, sin dependencias, offline).
Fuentes: `src/*.js` concatenados en orden alfabético por `tools/build.js` dentro de `src/template.html`.

## Arquitectura (src/)
- 00_core.js        utilidades, RNG con semilla, matemáticas, colores, paletas/rampas
- 01_pixel.js       PixelBuffer (ImageData), primitivas, contorno selectivo por material, limpieza, ruido
- 02_font.js        fuente bitmap proporcional con acentos, negrita, fuente diminuta 3×5, glifos científicos y sustitutos tipográficos
- 03_audio.js       Web Audio procedural (ambiente, música por bioma, SFX, voces)
- 04_input.js       teclado remapeable, puntero/táctil, gamepad; búfer de eventos propio para la interfaz
- 05_engine.js      bucle de paso fijo, escenas, cámara, partículas, guardado, avisos
- 06_ui.js          GUI inmediata pixel (paneles navy con bisel, botones, sliders, gráficos, iconos con contorno de color)
- 06c_ui_widgets.js HUD de retrato, minimapa MAPA, globos anclados, panel PREGUNTA, tarjetas de capítulo, bustos
- 07_state.js       estado de partida, herramientas, banderas narrativas, confianza
- 10_rig.js         rig v2 por materiales (lienzos 88×104, KIRU 60×64), luz de borde, plantillas de cara, caché de sprites
- 11_chars.js       Amaya, KIRU, Naira, Dante, Eliana, LIMEN, MIRAGE/MOSAICO, BETA-9 y NPC
- 12_props.js       accesorios: palmeras, cactus, casas, FV, tanques, tuberías, aerogeneradores, aves
- 13_bg.js          generadores de parallax (5–8 capas), cielos, partículas ambientales
- 14_portraits.js   retratos 96 px con expresiones, rasgos propios por personaje y busto 48×46 para el HUD
- 15_tech.js        tecnología integrada a la naturaleza (OI, BESS, electrolizador, cultivos, goteo)
- 16_biomes.js      biomas base (sustituidos por los panoramas 1c/1d/1e)
- 17a_kit_palette   paleta oficial (rampas de la referencia)
- 17b–17r          kit VISTA de panoramas (cielo, nubes, relieve, ciudad, energía, vida, luz, interiores, desierto, acantilados, salinas, agro, H2, polvo)
- 18a–18x          kit PF del plano jugable (terreno 3/4, flora, agua en corte, infraestructura, rótulos y WorldLabels, fauna, estaciones, kits por nivel)
- 19a–19y          escenas ilustradas (título, prólogo, dron, tarjetas, créditos, finales, poscréditos, epílogo)
- 1c/1d/1e_bio_*   panoramas de los once biomas
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
- [x] Fase H rediseño visual según la referencia (docs/art/): análisis medido y STYLE LOCK, vertical slice del Nivel 1 evaluado (≈ 4,0), panoramas VISTA de los once biomas, planos jugables PF de los niveles 0–11, personajes, retratos, interfaz, título, prólogo, finales y poscréditos; auditoría de 105 hallazgos por cuatro revisores y corrección por áreas; evaluación final en docs/art/analisis/06_evaluacion_final.md

## QA
- `node tests/models.test.js` · `node tests/bank.test.js` · `node tests/calima.test.js`
- `node tools/smoke.js`: título, mapa, 12 escenarios × 3 posiciones, 11 simuladores × 5 fases, escenas de cierre, 4 finales y 6 tarjetas de crisis sin errores de consola.
- Flujos de guion verificados con `AUTOPILOT_ON()` (solo en modo prueba) hasta `GS.s.completed` en cada capítulo y hasta el poscréditos.
- Corrección de entrada: la interfaz se procesa en `render()` y ahora recibe sus propios eventos (clic y teclado) una sola vez por cuadro; un control recién aparecido no acepta la misma pulsación de ENTER que lo mostró.

## Ideas futuras
- Más variantes de transferencia generadas por semilla en el modo Práctica.
- Traducción al inglés y al wayuunaiki de los diálogos clave.
- Exportación de rutas de aprendizaje para el docente por grupo.
