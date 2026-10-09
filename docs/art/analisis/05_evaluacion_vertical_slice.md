# 05 · Evaluación del vertical slice (Nivel 1 «La Boca del Mar»)

Comparación de la escena costera del Nivel 1 con `docs/art/referencia_visual.jpg`,
según los criterios de `PROMPT_FIDELIDAD_VISUAL.md`. Imagen comparativa:
`docs/art/slice/comparacion_v1.png` (arriba a la izquierda, la referencia; el resto,
capturas del juego a 640×360 en x = 120, 1250 y 1650).

Capturas reproducibles: `node tools/shot.js "test=level&lv=1&nocard=1&px=X" out.png 1 2500`.

## Puntuación (1–5)

| Criterio | Nota | Lectura frente a la referencia |
|---|---|---|
| Fidelidad al estilo | 4 | Mismo universo gráfico: pixel art denso, contornos de material, rampas con desplazamiento de tono, bandas sin tramado. |
| Densidad visual | 4 | Panorama tan cargado como el primer plano; quedan algunos tramos del suelo con menos props. |
| Profundidad | 4 | 8–10 planos con bruma atmosférica; la referencia recede más en diagonal (limitación natural del desplazamiento lateral). |
| Color | 4 | Saturación y familias de la referencia; las montañas medias tienden algo más al lila que al naranja. |
| Iluminación | 3,5 | Sol focal, luz de borde en personajes y franjas especulares; faltan resplandores emisivos (tuberías de permeado, penacho de salmuera) y un halo solar más intenso. |
| Personajes | 4 | Amaya y KIRU con el diseño canónico (~74 px), cara amable, retratos 96×96 con expresiones y busto del HUD. |
| Arquitectura | 4 | Ciudad de ARIDIA con cúpula, casas en 3/4, muelle, caseta de bombeo y filtros con cara superior. |
| Naturaleza | 4 | Palmeras, matorrales, lupinos, acantilado columnar con cornisas floridas, arrecife y peces. |
| Interfaz | 4,5 | Bloque de retrato con corazones y energía, MAPA, PREGUNTA, globos y tira de capítulos del mapa. |
| Ciencia visual | 4 | Etiquetas in situ (CAPTACIÓN, BOMBEO, PRETRATAMIENTO, REJILLA DE TOMA, MEMBRANAS, SALMUERA, AGUA POTABLE); colores de corriente coherentes. |
| Animación | 4 | Rotores, cascadas, nubes, oleaje, peces, fauna y ciclos de carrera con pelo en movimiento. |
| Acabado general | 4 | Sin tramado Bayer en lo rediseñado; quedan por rehacer los demás biomas, el título y los finales. |

Media ≈ 4,0: se considera alcanzado el estándar mínimo del slice y se autoriza
extender el sistema a los demás niveles, con una pasada de iluminación emisiva pendiente.

## Pendiente detectado

1. Pasada de iluminación: halo solar, resplandor de tuberías de permeado y penacho de salmuera.
2. Integración de tamaño de sprites (~74 px) en accesorios y escenas de los niveles 0 y 2–11.
3. Panoramas VISTA para los biomas plaza, plant, canyon, pvdunes, windcliffs, vault, citadel, oasis, council y calima.
4. Planos jugables con el kit PF en los niveles 0 y 2–11; fondo del título; ilustraciones de los finales.
