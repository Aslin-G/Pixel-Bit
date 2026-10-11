# 06 · Evaluación final del rediseño visual

Evaluación del juego completo frente a la referencia (`docs/art/referencia_visual.jpg`), con los
doce criterios de `PROMPT_FIDELIDAD_VISUAL.md`. Tres jueces independientes, cada uno con un enfoque
distinto, capturaron las mismas 19 pantallas a 640 × 360 y las compararon lado a lado con la
referencia, con métricas de píxel (saturación, contraste, densidad de bordes, longitud de tramos de
color, bloques planos) y recuentos de dibujo por cuadro.

Escala: 5 = indistinguible en calidad de la referencia · 4 = mismo universo gráfico con carencias
menores · 3 = reconocible como inspirado en ella, pero visiblemente más débil · 2 = pixel art
genérico · 1 = plataformas retro sencillo.

## Puntuación global

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

## Por pantalla (estilo · personajes/interfaz/ciencia · luz/animación/acabado)

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

## Carencias principales (orden de prioridad)

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
- Esta evaluación: jueces independientes sobre el estado de `8bbc72f`.
