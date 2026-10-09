# ARIDIA NEXUS — STYLE LOCK (dirección gráfica obligatoria)

**Fuente de verdad visual:** `docs/art/referencia_visual.jpg` · **Criterios de aceptación:** `docs/art/PROMPT_FIDELIDAD_VISUAL.md`
**Análisis medidos (paletas, escalas, métricas, planes):** `docs/art/analisis/01_referencia.md` (estilo), `02_personajes.md`, `03_entornos.md`, `04_interfaz.md`.

Prioridad en cualquier conflicto: **1. imagen de referencia · 2. coherencia visual · 3. jugabilidad · 4. ciencia · 5. técnica · 6. interpretación propia.**
Pregunta de control: *¿estoy reproduciendo el lenguaje visual de la imagen o solo haciendo otro pixel art?*

---

## 1. ART STYLE
Pixel art ilustrativo, cinematográfico y eco-tecnológico, de alta densidad, con vista de diorama en 3/4 elevado (≈25–30°) en todo lo que está detrás del plano jugable. Textura pictórica con ruido en clusters, rampas con desplazamiento de tono, contorno selectivo **solo** en personajes y objetos de plano medio.
**Prohibido:** tramados Bayer/ajedrez (en cielos, halos, paneles, sombras, fundidos de UI), rellenos planos de 2 tonos, contorno negro único, filas de casas rectangulares, cielos vacíos, paletas pastel lavadas, exceso de beige o gris.

## 2. PIXEL DENSITY
- Resolución lógica **640×360**, 1 píxel de arte = 1 píxel de juego, vecino más cercano, `imageSmoothingEnabled = false`. Nada a 2× ni escalas mezcladas.
- Metas medibles por cuadro (sin UI): ≥150–250 colores distintos; carrera media de color igual ≤ 2 px (actual 3,0); densidad de bordes fuertes ≥ 0,20 (actual 0,09); bloques 8×8 "ocupados" ≥ 85 %; bloques planos ≤ 5 %; píxeles de ajedrez ≤ 2 %; V medio 0,62–0,68; ≥25 % de píxeles con V < 0,5; ≤25 % con V > 0,9; p5 de luminancia ≤ 0,08.

## 3. SPRITE SCALE
- **Amaya ≈ 73–77 px** de alto (cabeza 22–23 px, ≈3,3 cabezas, piernas 36 %). Lienzo 88×104, ancla (40,100).
- **KIRU ≈ 44×50 visibles** (≈0,68 de Amaya), flotando con el hueco ya dibujado en el sprite. Lienzo 60×64, ancla (30,62).
- Adultos 70–84 px; niños 50–56 px. Retrato de HUD 48×46 (marco 54×52). Retratos de diálogo 96×96 (marco 104).
- Objetos de plano medio a 0,5–0,6 de la escala de personaje; turbinas de plano medio 45–70 px; peces 10–16×5–8.

## 4. COLOR SATURATION
- S medio de escena 0,50–0,55; p90 ≥ 0,92. Los picos de saturación son para emisivos, primer plano y plano jugable.
- Familias dominantes: azul `#2186eb`, turquesa `#11bedd`, cian `#22dbe7`, roca cálida `#a24a1f→#fbc371`, verde lima `#9cb42c/#efd83f`, magenta `#c244a2` (<3 % de píxeles), bruma lila `#9a95b8`, UI navy `#04142e`.
- Rampas oficiales: `src/17a_kit_palette.js` (`RAMP.*R`). Paletas por sistema (prompt §20) se respetan por bioma.

## 5. CONTRAST
- Luminancia p5 ≤ 0,08 y p95 ≈ 0,88; desviación ≈ 0,24–0,27. Los planos cercanos usan todo el rango; los lejanos 0,41–0,72. El encuadre de primer plano es lo más oscuro (lum. media ≈ 0,20).

## 6. LIGHTING LANGUAGE
- Luz clave de día desde arriba-izquierda a 45° para el entorno. Para personajes: luz desde arriba y de frente respecto a hacia dónde miran (la cara iluminada), con luz de borde 1 px en espalda y coronilla.
- Sol focal: disco `#fdfacd` r≈11 con anillos suaves cálido→lavanda hasta r≈23 (`sunR`). Sin halo tramado.
- Planos iluminados cálidos (amarillo-melocotón); borde cálido 1 px en siluetas y cornisas `#fbc371`.
- Metal: franja especular 1–2 px casi blanca al 25–35 % del borde iluminado, sombra de núcleo y luz reflejada.
- Emisivos con halo 1 px al 50 %: permeado cian `#48b6ec`, H₂ verde `#4cd48e`, pluma de salmuera `#e07ecf`, ojos de KIRU `#17f3f7`, neones de UI.
- Agua con destellos y haces de luz submarinos.

## 7. SHADOW LANGUAGE
Sombras siempre con desplazamiento de tono, nunca grises ni negras: roca → granate `#602212/#3e0c03`; montañas → violeta `#8e7daa`; follaje → verde azulado `#194560`; agua → navy `#041939`; piel → `#bb5933`; nubes → pervinca `#9fb6ee`. Sombras de contacto y de saliente: bandas sólidas de 1–3 px del tono más oscuro; oclusión ambiental en grietas. **Retirar** las elipses tramadas (`fshadow`) en arte nuevo.

## 8. ENVIRONMENT DENSITY
- ≈150–200 elementos distintos por pantalla (uno cada ~33×33 px); espacio negativo ≤ 15 %.
- Cada pantalla, según el bioma: vegetación de encuadre en primer plano, ≥6 alturas de suelo, ≥5 módulos de infraestructura con tuberías, etiquetas, cúmulos de vegetación cada ~30 px, fauna (≥1 ave/dron; peces si hay agua), microdetalle (válvulas, LED, remaches, barandas, manchas).

## 9. PARALLAX DEPTH
- 8–10 planos: primer plano 1,3–1,4 · jugable 1,0 · infraestructura 0,8 · colinas/tecnología 0,5 · terrazas 0,4 · ciudad/cresta 0,3 · montañas medias 0,2 · cordillera lejana y mar 0,1 · nubes 0,05–0,15 + deriva · cielo y sol 0.
- Perspectiva atmosférica por paso: S ×0,58, L +0,1, contraste ×0,65, tono hacia `#9a95b8` (cordillera lejana ≈65 %). El primer plano se oscurece y enfría (hacia `#0e243a`/`#2e1d53`).
- Horizonte ≈ 38 % de la altura en exteriores. Composición en diagonal (abajo-izquierda → arriba-derecha), nunca todo sobre una línea.

## 10. CHARACTER PROPORTIONS
- ≈3,3 cabezas; juvenil/universitario, **no chibi**. Ojos de sprite 3×5 con pestaña y brillo de 1 px; retrato HUD 5×5; retrato de diálogo 9–11 px con brillo 2–3 px.
- Contorno selectivo 1 px de valor ≤ 0,15 por material (pelo `#1a0405`, piel `#602316`, camisa `#4b0706`, botas `#230705`, equipo `#171d35`, KIRU `#070813`). 4–6 tonos por material (piel de retrato 7). Sin sombreado "almohada".
- **Amaya (canónica según la referencia):** pelo castaño rojizo con coleta alta voluminosa (5–6 mechones afilados con movimiento secundario), flequillo en punta, gafas de aviador sobre la frente (lentes cian con brillo), camisa/chaqueta roja de manga corta remangada sobre top blanco, cinturón con bolsillo y mapa, guantes sin dedos, short cargo caqui sobre mallas oscuras, botas de montaña marrones con calcetín crema, mochila pizarra con solapa de cuero, hebilla amarilla y LED cian. El diseño anterior (piel oscura, pelo rizado) pasa a un NPC para mantener la diversidad del elenco.
- **KIRU (fusión biblia + referencia):** cabeza de concha blanco perla redondeada con visor negro-navy y dos ojos cápsula cian brillantes; orejas de zorro en aleta con borde naranja/amarillo y celdas solares cian (biblia: orejas solares); cola de lagartija con microturbina naranja; patas magnéticas que levitan con anillo amarillo y emisor cian; acentos turquesa en la espalda (biblia: turquesa y naranja); compartimento de muestras con escotilla naranja. Estela de chispas cian al moverse.

## 11. UI LANGUAGE
- Paneles navy: tinta 1 px `#000633`, bisel claro 1 px (arriba/izquierda `#a8c8ff`, abajo/derecha `#6d9be8`), medio 1 px `#3a64b0`, relleno plano en dos bandas `#072248`/`#041533`, línea interior `#12305a` en paneles grandes, chaflanes 2–3 px, destellos de esquina `#7fb8ff`/`#e8f6ff`. **Sin sombras tramadas ni rellenos tramados.**
- Texto `#e2ebfc` (cuerpo) / `#e6f8fe` (títulos); palabras clave `#f5dc5a` y `#f5a576`. Fuente negrita (trazo de 2 px) solo para nombres, títulos, letras de opción y `Nv.`.
- Acentos semánticos: correcto `#3fe0a0` sobre `#056050`; corazones `#e83b41`; energía `#1ef4fd`; salmuera violeta; H₂/agro verde.
- Elementos: bloque de retrato HUD (retrato + nombre + 7 corazones + energía + Nv), globo de diálogo anclado con cola y nombre, minimapa "MAPA" con islas-nodo, panel "PREGUNTA" con insignia que desborda la esquina y filas A–D con caja de letra separada, tira de tarjetas de capítulo con miniatura, letreros de madera con flecha, etiquetas científicas en el mundo (relleno navy, borde de color del sistema + brillo, mayúsculas, tallo hacia el objeto).

## 12. SCIENCE VISUALIZATION LANGUAGE
- El orden espacial es el orden del proceso (izquierda → derecha): CAPTACIÓN → PRETRATAMIENTO → BOMBEO → MEMBRANAS → AGUA POTABLE (permeado) → almacenamiento; RECHAZO → SALMUERA → gestión/descarga. Una silueta distinta por etapa y una etiqueta por etapa.
- Fluidos codificados por tubería y brillo: agua de mar azul/turquesa natural; agua en pretratamiento acero + azul claro; **permeado: tubería cian brillante con chevrones blancos que se desplazan**; **salmuera: tubería grafito-índigo y pluma magenta controlada de partículas que se hunde y diluye**; H₂ esmeralda sobre tanques blancos; riego turquesa en canales y cascadas.
- Cortes transversales muestran lo invisible (descarga, membranas, almacenamiento, raíces).
- La energía está donde la física la pone (FV inclinada al sol, turbinas en crestas); las sombras de nubes recorren las filas FV y bajan la generación visiblemente.

## 13. ANIMATION DENSITY
Protagonistas: idle 6 · walk 8 · run 8 · jump 3 · fall 2 · land 2 · interact 4–6 · analyze 6 · emociones 2–4 (sorpresa, preocupación, miedo, determinación, celebración, victoria), a 6–12 fps; movimiento secundario de pelo, coleta y mochila con 1 cuadro de retraso. KIRU: flotación continua ±2 px (1,2 s), parpadeo, pulso de brillo de ojos, partículas de estela. ≥8 sistemas ambientales animados a la vez en pantalla.

## 14. ENVIRONMENTAL MOTION
Turbinas 0,3–0,6 rev/s; olas (cresta 6–10 px/s, rizos de 4 cuadros, espuma y rocío); destellos del mar; cascadas 30–60 px/s; peces con cola de 4 cuadros; haces submarinos que se mecen (4–6 s); pluma de salmuera 20–40 partículas; chevrones de permeado 20 px/s; LED 1–2 Hz; nubes 2–4 px/s + parallax; follaje ±1 px (2–3 s); águila de 4 cuadros; drones con rotor y balanceo. Partículas (polvo, polen, sal, gotas) ≤ 15–40 por sistema. La escena se ve viva con el jugador quieto.

## 15. RENDIMIENTO
Todo lo estático se prerenderiza (capas, terreno, props, sprites). Animación con tiras de cuadros y patrones, no con bucles de píxel por cuadro. Presupuesto por cuadro: ≤ 2000 `fillRect`, ≤ 600 `drawImage` pequeños, ≈14 pantallas de sobre-dibujo, ≤ 2 pasadas de composición a pantalla completa. Prerender ≤ 1,5 s por nivel.

## 16. PROCEDIMIENTO
1. Vertical slice (Nivel 01, costa con planta desaladora) con protagonista, compañero, primer plano, escena jugable, infraestructura, naturaleza, fondo, iluminación, agua, partículas, UI, interacción científica, NPC y una animación técnica.
2. Comparación con la referencia y puntuación 1–5 (fidelidad, densidad, profundidad, color, iluminación, personajes, arquitectura, naturaleza, UI, ciencia visual, animación, acabado). No se continúa con la producción masiva mientras alguna categoría esté por debajo de 4.
3. Aplicación del sistema al resto: biomas 0–11, NPC, retratos, simuladores, mapa, título.
