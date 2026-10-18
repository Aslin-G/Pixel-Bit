# 06 · Evaluación final del rediseño visual

Evaluación del juego completo frente a la referencia (`docs/art/referencia_visual.jpg`), con los
doce criterios de `PROMPT_FIDELIDAD_VISUAL.md`. Tres jueces independientes, cada uno con un enfoque
distinto, capturan las mismas 18 pantallas a 640 × 360 y las comparan lado a lado con la
referencia, con métricas de píxel (saturación, contraste, densidad de bordes, longitud de tramos de
color, bloques planos) y recuentos de dibujo por cuadro.

Escala: 5 = indistinguible en calidad de la referencia · 4 = mismo universo gráfico con carencias
menores · 3 = reconocible como inspirado en ella, pero visiblemente más débil · 2 = pixel art
genérico · 1 = plataformas retro sencillo.

## Ronda 2 (estado de `7ff1c3b`)

Segunda ronda de arte: roca esculpida por campo de alturas, muros urbanos y banco salino; planta
desaladora protagonista en 3/4 con corrientes luminosas; iluminación local (gradación por nivel,
sombras, luz de borde, halos, haces interiores); personajes (coleta, mochila, ojos, reposo);
biomas débiles (N2–N6, N10); mapa en diorama, miniaturas ilustradas y sala de control de los
simuladores.

| Criterio | Ronda 1 | Ronda 2 | Criterio | Ronda 1 | Ronda 2 |
|---|---|---|---|---|---|
| Fidelidad al estilo | 3 | 3,5 | Personajes | 3,5 | 3,5 |
| Densidad | 3 | 3 | Arquitectura | 2,5 | 3,5 |
| Profundidad | 3 | 3 | Naturaleza | 3 | 3 |
| Color | 3,5 | 3,5 | Interfaz | 4 | 4 |
| Iluminación | 3 | 3,5 | Ciencia visual | 3,5 | 4 |
| Animación | 3,5 | 4 | Acabado | 3,5 | 3,5 |

**Veredicto.** Ningún juez ve ya un «plataformas retro sencillo». Título, Nivel 1, Nivel 8 y
epílogo rondan el 4 en todos los criterios; interfaz, ciencia visual y animación llegan a 4. Pero
siguen por debajo de 4 densidad, profundidad y naturaleza (3) y otros seis criterios (3,5): **el
umbral del STYLE LOCK §16 aún no se supera** y se abre una tercera ronda.

### Por pantalla (ronda 2)

| Pantalla | Fid | Den | Prof | Col | Arq | Nat | Per | UI | Cien | Ilu | Anim | Acab |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Título | 4 | 4 | 3,5 | 4 | 4 | 3,5 | 4 | 4 | 4,5 | 4 | 4 | 4 |
| Mapa | 3,5 | 3,5 | 3 | 3,5 | 3 | 3 | – | 4 | 4 | 3,5 | 3,5 | 4 |
| N1 inicio | 4 | 4 | 4 | 4 | 3,5 | 4 | 4 | 4 | 4 | 4 | 4,5 | 4 |
| N1 muelle | 4 | 3,5 | 3,5 | 3,5 | 4 | 3 | 4 | 3,5 | 3,5 | 4 | 4,5 | 3,5 |
| N0 plaza | 3,5 | 3,5 | 3 | 3 | 3,5 | 2,5 | 3,5 | 4 | 3,5 | 3 | 4 | 3,5 |
| N2 planta OI | 3 | 3,5 | 2,5 | 2,5 | 3,5 | 2 | 4 | 4 | 4 | 3 | 3,5 | 3 |
| N3 cañones | 3,5 | 3 | 3,5 | 3,5 | 2,5 | 2 | 4 | 3,5 | 3,5 | 3,5 | 3,5 | 3,5 |
| N4 dunas FV | 3 | 2,5 | 3 | 3 | 3 | 1,5 | 4 | 4 | 3,5 | 3,5 | 3 | 3,5 |
| N5 brisa | 3,5 | 3,5 | 3,5 | 3,5 | 2,5 | 3,5 | 4 | 4 | 3,5 | 3,5 | 4,5 | 3,5 |
| N6 bóveda | 3 | 3 | 2,5 | 2,5 | 3 | 1 | 4 | 4,5 | 4 | 4 | 4 | 3,5 |
| N7 ciudadela H2 | 3 | 3,5 | 3 | 3 | 3,5 | 1 | 4 | 4 | 4,5 | 3,5 | 3,5 | 3 |
| N8 oasis | 4 | 4 | 3,5 | 4 | 3,5 | 4 | 4 | 4 | 4 | 3 | 3,5 | 3,5 |
| N9 consejo | 3,5 | 3,5 | 3 | 3,5 | 4 | 2 | 3,5 | 4 | 3,5 | 3 | 3 | 3,5 |
| N10 Calima | 3,5 | 3 | 3,5 | 3,5 | 3 | 2,5 | 4 | 4 | 4 | 4,5 | 4,5 | 3 |
| N11 epílogo | 4 | 4 | 3,5 | 4 | 4 | 3,5 | 3,5 | 4 | 3,5 | 4 | 4 | 3,5 |
| Simulador (OI) | 2,5 | 2,5 | 2 | 3 | 2 | 1 | 3 | 3,5 | 3,5 | 2 | 3 | 2,5 |
| Final «mosaico» | 3,5 | 3 | 3 | 3,5 | 3,5 | 3 | 4 | 3 | 3 | 3 | 3 | 2,5 |
| Retratos | 3,5 | – | – | 3,5 | – | – | 3,5 | 4 | – | 3,5 | 2,5 | 4 |

Rendimiento (ronda 2): 218–956 `fillRect` y 70–469 `drawImage` por cuadro, 1 pasada a pantalla
completa en todos los niveles salvo N0 y N10 (2, en el límite), 2–4 ms por cuadro, 0 % de tramado
en damero.

### Carencias para la ronda 3

1. **Bandas inferiores** (N0, N1 muelle, N2, N3, N4, N5, N9, N11): el 20–45 % inferior es muro,
   estratos, arena o agua abierta; debe ser un corte iluminado y lleno (≈ 1 objeto cada 33 px).
2. **Profundidad**: interiores (N2, N6, N7, N9) en un único plano; falta una capa de encuadre en
   primer plano (paralaje 1,3–1,4) en casi todos los niveles; cordilleras lejanas en degradado
   malva en vez de crestas erosionadas naranja.
3. **Color y naturaleza**: gris y azul marino en N2/N6/N7, solo beige en N4, marrón en N0;
   vegetación casi ausente en N2, N3, N4, N6, N7 y N9.
4. **Arquitectura**: cajas frontales (caseta de N1, banco de semillas de N8, taller de N4);
   N4 y N5 casi sin edificios.
5. **Personajes**: reposo de perfil rígido sin brazos; orejas de KIRU en cresta en vez de aletas;
   busto del HUD frontal; plantilla de cara compartida por los PNJ; retratos sin animación.
6. **Iluminación**: sombra de contacto casi invisible; personajes sin regradar al atardecer
   (N3, N7); haces interiores ilegibles (N2, N9); halos emisivos de 1 px.
7. **Acabado**: solapes de etiquetas (N7, N2, N5, N6, N1 muelle), piernas de Amaya veladas por la
   arena en N10, simulador y panel del final con aspecto de prototipo.
8. **Simulador y final**: la membrana es un rectángulo con degradado; el panel de texto del final
   ocupa el 55 % de la pantalla.

## Ronda 1 (estado de `8bbc72f`)

### Puntuación global

| Criterio | Nota | Criterio | Nota |
|---|---|---|---|
| Fidelidad al estilo | 3 | Personajes | 3,5 |
| Densidad | 3 | Arquitectura | 2,5 |
| Profundidad | 3 | Naturaleza | 3 |
| Color | 3,5 | Interfaz | 4 |
| Iluminación | 3 | Ciencia visual | 3,5 |
| Animación | 3,5 | Acabado | 3,5 |

**Veredicto.** El juego ya no se lee como un plataformas retro sencillo: título, Nivel 1, Nivel 8,
epílogo y finales comparten la paleta, la ciudad de ARIDIA con su cúpula y cascada, las terrazas, el
follaje de encuadre, los cortes submarinos y las etiquetas científicas de la referencia (≈ 3,5). La
interfaz alcanza el mismo universo gráfico (4). Pero ninguna otra categoría llega a 4, de modo que
**todavía no se supera el umbral del STYLE LOCK §16** («no se continúa mientras alguna categoría esté
por debajo de 4»). El trabajo sigue.

### Por pantalla

| Pantalla | Fid | Den | Prof | Col | Arq | Nat | Per | UI | Cien | Ilu | Anim | Acab |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Título | 3,5 | 3,5 | 3,5 | 4 | 3 | 3,5 | 3,5 | 4 | 3,5 | 3,5 | 4 | 4 |
| Mapa | 2,5 | 2,5 | 2 | 3,5 | 2 | 2,5 | – | 3,5 | 3 | 2,5 | 2 | 3 |
| N1 inicio | 3,5 | 3,5 | 4 | 4 | 3 | 3,5 | 3,5 | 4 | 3 | 3,5 | 4 | 4 |
| N1 muelle | 3,5 | 3,5 | 3,5 | 4 | 3 | 3 | 3,5 | 4 | 3,5 | 3,5 | 4 | 3,5 |
| N0 plaza | 3 | 3,5 | 3 | 3,5 | 3 | 2,5 | 4 | 4 | 3 | 3 | 4 | 3,5 |
| N2 planta OI | 2,5 | 3 | 3 | 2,5 | 3 | 1,5 | 3,5 | 4 | 4 | 3 | 2,5 | 3 |
| N3 cañones | 2 | 2 | 2,5 | 3 | 2 | 2 | 3,5 | 3,5 | 3 | 3 | 3 | 2,5 |
| N4 dunas FV | 2,5 | 2,5 | 3 | 3,5 | 2,5 | 2,5 | 3,5 | 4 | 3,5 | 3,5 | 3 | 3 |
| N5 brisa | 2,5 | 2 | 2,5 | 3,5 | 2,5 | 2,5 | 3,5 | 4 | 3,5 | 3,5 | 4 | 3,5 |
| N6 bóveda | 2,5 | 3 | 2,5 | 2,5 | 3 | 1,5 | 3,5 | 4 | 3,5 | 3 | 3 | 3 |
| N7 ciudadela H2 | 3 | 3,5 | 3 | 3 | 3,5 | 1,5 | 3,5 | 4 | 4 | 3,5 | 2,5 | 3 |
| N8 oasis | 3,5 | 3,5 | 3,5 | 4 | 3 | 4 | 3,5 | 4 | 3,5 | 4 | 3,5 | 3,5 |
| N9 consejo | 3 | 3 | 3 | 3,5 | 3 | 2 | 3,5 | 4 | 3 | 3,5 | 3 | 3 |
| N10 Calima | 2,5 | 2 | 2,5 | 2,5 | 2,5 | 1,5 | 3,5 | 4 | 3,5 | 3,5 | 4,5 | 3 |
| N11 epílogo | 3,5 | 4 | 3,5 | 4 | 3,5 | 3,5 | 3,5 | 3,5 | 3 | 3 | 3,5 | 3,5 |
| Simulador (OI) | 2 | 2 | 1,5 | 3 | 1,5 | 1 | 2,5 | 3,5 | 4 | 2 | 3 | 3,5 |
| Final «mosaico» | 3 | 3 | 3 | 3,5 | 3 | 3,5 | 3 | 3 | 2,5 | 3,5 | 3,5 | 3,5 |
| Retratos | 3 | 2,5 | – | 3,5 | – | – | 3 | 3 | – | 3 | – | 3,5 |

Rendimiento: 228–754 `fillRect` y 124–153 `drawImage` por cuadro en juego normal (presupuesto 2000 /
600), sin tramado Bayer (≤ 0,02 % de píxeles) y sin errores de consola. Se supera la regla de ≤ 2
pasadas a pantalla completa: 4 en los niveles 1, 4 y 7 y unas 16 en el Nivel 10.

### Carencias principales

1. **Composición en bandas horizontales.** Cielo / montañas / mar / línea de suelo / subsuelo; la
   referencia es un diorama elevado en 3/4 con diagonal de abajo-izquierda a arriba-derecha.
2. **Masas de terreno en baldosa repetida.** Acantilados de bloques frontales redondeados (N1, N3, N4,
   N5) y muros de ladrillo o adoquín (N0, N10, N11); la referencia esculpe rocas iluminadas desde
   arriba, con voladizos, sombras granate y plantas en las grietas.
3. **Arquitectura protagonista plana.** La planta desaladora (título, N1, final) es una vista lateral
   fina; en la referencia es un volumen masivo en 3/4 con tuberías gruesas, balsas de hormigón,
   plataformas, espuma y penacho de salmuera. Varios edificios son cajas lisas.
4. **Iluminación local.** Personajes sin luz de borde ni sombra de contacto; edificios sin sombra
   arrojada; poco resplandor en permeado, salmuera y arcos eléctricos; los niveles de atardecer
   (N3, N7, N11) no reiluminan el primer plano; interiores sin haces ni charcos de luz.
5. **Biomas débiles.** N3 (bloques lavanda, exceso de magenta: 7 % frente a < 3 %), N5 (mitad cielo,
   mitad baldosa), N10 (monocromo de bajo contraste, sin foco dramático), N2 y N6 (predominio de gris
   y azul marino).
6. **Personajes.** Coleta de Amaya corta y mochila plana; reposo rígido sin respiración ni movimiento
   secundario; retratos frontales con la misma plantilla neutra (la referencia: 3/4, sonrisa, ojos
   grandes con brillo, rubor).
7. **Mapa, miniaturas de capítulo y simuladores** más esquemáticos que las tarjetas ilustradas de la
   referencia.
8. **Corrientes científicas.** La tubería de permeado del título y del N1 es fina y sin halo; el
   penacho de salmuera es una rejilla rosa dispersa; el amarillo de electricidad casi no aparece como
   flujo.

## Historial

- 05_evaluacion_vertical_slice.md: Nivel 1 autoevaluado ≈ 4,0 (más indulgente que este juicio).
- Auditoría de control de calidad: 105 hallazgos (27 graves) de cuatro revisores; corregidos por
  áreas (interfaz, simuladores, niveles 0–5, niveles 6–11), con humo y pruebas en verde.
- Ronda 1: jueces independientes sobre el estado de `8bbc72f`.
- Ronda 2: jueces independientes sobre el estado de `7ff1c3b`.
