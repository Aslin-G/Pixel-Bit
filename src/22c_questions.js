/* =====================================================================
   22c_questions.js — Banco SOLO (parte 3): RA-07, RA-08, RA-09
   ===================================================================== */

/* ============================== RA-07 ============================== */
ctx('RA-07-C1', 'Cultivo sensible y agua con boro', {
  text: 'Fuentes para regar fríjol (sensible al boro, umbral orientativo ≈ 0,75 mg/L; tolerancia a salinidad: ECe ≈ 1,0 dS/m según FAO-29). El permeado tiene EC muy baja y conserva boro; el pozo es salobre.',
  table: { head: ['FUENTE', 'EC DS/M', 'BORO MG/L', 'SAR'], rows: [['Permeado OI', '0,05', '1,1', '1'], ['Pozo salobre', '2,6', '0,3', '6'], ['Mezcla 50/50', '1,33', '0,7', '—']] },
  trigger: 'lv08_puerta', src: 'Ayers y Westcot (1985), FAO-29 (umbrales orientativos). Valores de las fuentes: simulados.',
}, [
  [1, '¿Cuál conclusión NO se sostiene?', ['Como el permeado es casi agua pura, es ideal para cualquier cultivo sin ajustes.', 'El permeado podría superar la tolerancia de boro del fríjol.', 'El pozo aporta más salinidad que el permeado.', 'La mezcla cambia simultáneamente EC y boro.'], 0,
    'El permeado conserva boro (1,1 mg/L) y su EC muy baja puede causar problemas de infiltración: requiere ajustes.', ['', 'Se sostiene: 1,1 > 0,75.', 'Se sostiene.', 'Se sostiene por balance de masa.'], 'asumir que el agua potable siempre es ideal para riego'],
  [2, '¿Cuál es la EC de una mezcla 70 % permeado + 30 % pozo?', ['≈ 0,08 dS/m', '≈ 0,82 dS/m', '≈ 1,33 dS/m', '≈ 2,65 dS/m'], 1,
    '0,7 × 0,05 + 0,3 × 2,6 = 0,035 + 0,78 ≈ 0,82 dS/m.', ['Pondera al revés.', '', 'Es la mezcla 50/50.', 'Suma sin ponderar.'], 'mezclar sin ponderar', { ordered: true }],
  [3, 'Para esa mezcla 70/30, ¿cuál evaluación es correcta?', ['EC ≈ 0,82 dS/m y boro ≈ 0,86 mg/L: el boro aún supera el umbral orientativo del fríjol.', 'EC ≈ 0,82 dS/m y boro ≈ 0,40 mg/L: cumple ambos.', 'EC ≈ 2,6 dS/m y boro ≈ 1,1 mg/L.', 'Boro ≈ 1,4 mg/L porque los boros se suman.'], 0,
    'Boro: 0,7 × 1,1 + 0,3 × 0,3 = 0,77 + 0,09 = 0,86 mg/L (> 0,75).', ['', 'Error en el boro ponderado.', 'Usa los valores de una sola fuente.', 'Las concentraciones no se suman.'], 'sumar concentraciones'],
  [4, '¿Qué estrategia integra mejor calidad de agua, cultivo y suelo?', [
    'Regar fríjol solo con permeado y aumentar el volumen.', 'Usar mezcla con remineralización (calcio), asignar el fríjol a la fuente con menos boro y ubicar cultivos tolerantes (sorgo, tomate) donde el boro es mayor, con monitoreo de suelo.',
    'Regar solo con agua del pozo porque tiene menos boro.', 'Cambiar todo a un único cultivo de alto rendimiento.'], 1,
    'Combina calidad (mezcla y remineralización), asignación por tolerancia y monitoreo; mantiene diversidad.', ['Más volumen no corrige el boro.', '', 'El pozo salinizaría el suelo para el fríjol.', 'Reduce resiliencia y diversidad.'], 'evaluar solo volumen y no calidad'],
  [5, 'Diseña un plan de calidad de agua para otra finca árida. ¿Cuál es el más robusto?', ['Usar los umbrales de esta finca como reglas universales.', 'Analizar fuentes (EC, SAR, boro, pH), suelo y drenaje; definir mezclas por cultivo y etapa; monitorear; ajustar con saberes de quienes cultivan.',
    'Elegir siempre la fuente más barata.', 'Regar más para lavar cualquier problema.'], 1,
    'Los umbrales dependen de especie, etapa, suelo, drenaje y clima; el plan debe adaptarse y co-construirse.', ['Los umbrales no son universales.', '', 'Ignora calidad.', 'Sin drenaje, más agua empeora.'], 'convertir umbrales en reglas universales'],
]);

ctx('RA-07-C2', 'Diseño de goteo y cobertura', {
  text: 'Parcela de tomate de 500 m² en etapa media. ET0 = 6 mm/día; Kc (tomate, etapa media) ≈ 1,15 (FAO-56). Eficiencia de aplicación: goteo 0,9; surcos 0,6. La cobertura (mulch) reduce la evaporación del suelo (en el juego, ≈ 15 % del ETc; supuesto).',
  table: { head: ['PARÁMETRO', 'VALOR'], rows: [['Área', '500 m²'], ['ET0', '6 mm/día'], ['Kc', '1,15'], ['η goteo', '0,9'], ['η surcos', '0,6']] },
  src: 'Allen et al. (1998), FAO-56 (Kc). Eficiencias y efecto de cobertura: supuestos de simulación.',
}, [
  [1, '¿Cuál afirmación NO se sostiene?', ['El riego por surcos y por goteo necesitan el mismo volumen bruto porque el cultivo es el mismo.', 'La necesidad neta depende del cultivo y del clima.', 'La eficiencia del sistema cambia el volumen bruto.', 'La cobertura puede reducir la evaporación del suelo.'], 0,
    'El volumen bruto = necesidad neta / eficiencia: con eficiencias distintas, los volúmenes brutos difieren.', ['', 'Se sostiene.', 'Se sostiene.', 'Se sostiene.'], 'ignorar la eficiencia del riego'],
  [2, '¿Cuál es el ETc?', ['5,2 mm/día', '6,9 mm/día', '7,15 mm/día', '1,15 mm/día'], 1,
    'ETc = Kc × ET0 = 1,15 × 6 = 6,9 mm/día.', ['Divide en lugar de multiplicar.', '', 'Suma Kc + ET0.', 'Usa solo Kc.'], 'aplicar mal ETc = Kc·ET0', { ordered: true }],
  [3, '¿Cuál es el volumen bruto diario con goteo para toda la parcela?', ['≈ 3,1 m³', '≈ 3,8 m³', '≈ 5,8 m³', '≈ 7,7 m³'], 1,
    'Bruto = 6,9 / 0,9 ≈ 7,67 mm = 7,67 L/m² × 500 m² ≈ 3 833 L ≈ 3,8 m³.', ['Multiplica por la eficiencia.', '', 'Usa la eficiencia de surcos.', 'Confunde mm con m³.'], 'confundir mm, L y m³', { ordered: true }],
  [4, '¿Qué diseño integra mejor agua, suelo y cultivo?', ['Surcos con riego al mediodía.', 'Goteo con cobertura, riego temprano, sensores de humedad y ajuste por etapa del cultivo.', 'Goteo sin cobertura y con calendario fijo.', 'Aspersión para enfriar las hojas en las horas de más calor.'], 1,
    'Reduce pérdidas, ajusta la aplicación a la necesidad real y mejora la salud del suelo.', ['Baja eficiencia y evaporación alta.', '', 'Ignora la variación del cultivo y clima.', 'Altas pérdidas por evaporación y deriva.'], 'riego por calendario'],
  [5, '¿Qué plan es más robusto ante una sequía prolongada?', ['Mantener el mismo calendario y esperar lluvia.', 'Priorizar agua por etapa crítica, cobertura, especies tolerantes, riego deficitario controlado donde sea seguro y decisiones compartidas sobre la asignación.',
    'Duplicar el riego para "guardar" agua en el suelo.', 'Sembrar solo el cultivo más rentable.'], 1,
    'Combina técnica agronómica, diversidad y gobernanza del agua escasa.', ['No adapta.', '', 'Pérdidas por percolación y sales.', 'Reduce diversidad y resiliencia.'], 'creer que la agroecología es una lista fija de técnicas'],
]);

ctx('RA-07-C3', 'Sequía prolongada con mezcla de fuentes', {
  text: 'Durante una sequía se dispone de 12 m³/día para tres parcelas que piden 6, 5 y 4 m³/día. El pozo se ha salinizado. Una parcela de prueba produjo 2 400 kg de cosecha útil con 800 m³ de agua en la temporada.',
  table: { head: ['PARCELA', 'CULTIVO', 'PIDE', 'TOLERANCIA SAL'], rows: [['P1', 'Fríjol (floración)', '6 m³/d', 'baja'], ['P2', 'Sorgo', '5 m³/d', 'alta'], ['P3', 'Nopal + ahuyama', '4 m³/d', 'media-alta']] },
}, [
  [1, '¿Cuál afirmación NO se sostiene?', ['Responder al estrés salino aumentando el volumen siempre corrige el problema.', 'La demanda total (15 m³/d) supera la disponibilidad (12 m³/d).', 'Las parcelas toleran distinto la salinidad.', 'La etapa del cultivo cambia la prioridad del riego.'], 0,
    'Sin drenaje ni mejor calidad, más volumen puede acumular sales y encharcar.', ['', 'Se sostiene.', 'Se sostiene.', 'Se sostiene.'], 'responder al estrés salino solo con más agua'],
  [2, '¿Cuál es la productividad hídrica de la parcela de prueba?', ['0,33 kg/m³', '3 kg/m³', '1 600 kg/m³', '3 200 kg/m³'], 1,
    'WP = 2 400 kg / 800 m³ = 3 kg/m³.', ['Invierte la razón.', '', 'Resta en lugar de dividir.', 'Suma.'], 'invertir la razón de productividad', { ordered: true }],
  [3, '¿Qué asignación de 12 m³/día es más coherente con los datos?', ['P1: 6, P2: 5, P3: 1.', 'P1: 6 (floración crítica, mejor agua), P2: 3 (tolerante, agua del pozo), P3: 3 (cobertura y riego deficitario).', 'P1: 0, P2: 6, P3: 6.', 'Repartir 4 m³ a cada parcela sin considerar etapa ni tolerancia.'], 1,
    'Protege la etapa crítica sensible, usa el agua salobre donde hay tolerancia y aplica manejo de ahorro donde es seguro.', ['Deja a P3 con déficit severo sin manejo.', '', 'Abandona el cultivo en etapa crítica.', 'Ignora etapa y tolerancia.'], 'repartir sin criterios'],
  [4, '¿Qué integración agroecológica fortalece más la parcela ante la sequía?', ['Monocultivo del cultivo más productivo.', 'Asociaciones diversas, cobertura, corredores para polinizadores, semillas locales adaptadas y monitoreo de suelo y sales.', 'Fertilización química intensiva para compensar.', 'Arar profundamente cada semana.'], 1,
    'La diversidad, el reciclaje de biomasa y el conocimiento local aumentan la resiliencia.', ['Reduce resiliencia.', '', 'No corrige el agua ni las sales y puede salinizar más.', 'Aumenta la evaporación y degrada el suelo.'], 'reducir la agroecología a eficiencia técnica'],
  [5, 'Diseña un plan resiliente para la próxima sequía.', ['Esperar a que la planta de OI produzca más agua.', 'Plan participativo con prioridades declaradas, banco de semillas adaptadas, mezcla y calidad de agua, cobertura, captación de lluvia y monitoreo compartido.',
    'Contratar agua en camiones sin cambiar prácticas.', 'Reducir el área cultivada a cero.'], 1,
    'Integra técnica, ecología y gobernanza; no depende de una sola fuente.', ['Depende de una sola fuente.', '', 'Caro y frágil.', 'Elimina la producción de alimentos.'], 'depender de una sola fuente'],
]);

/* ============================== RA-08 ============================== */
ctx('RA-08-C1', 'Calima con fallos encadenados', {
  text: 'Antes de una tormenta, la microred dispone de 600 kW FV, 250 kW eólicos y BESS al 65 %. Cargas: servicios esenciales 180 kW, OI 220 kW, riego 80 kW y electrolizador flexible 300 kW. Durante el evento, la FV cae a 150 kW, la eólica sube a 450 kW, la turbidez de toma aumenta y el tanque está al 70 %.',
  table: { head: ['FUENTE/CARGA', 'ANTES', 'DURANTE'], rows: [['FV', '600 kW', '150 kW'], ['Eólica', '250 kW', '450 kW'], ['BESS', '65 %', '—'], ['Esenciales', '180 kW', '180 kW'], ['OI', '220 kW', '220 kW'], ['Riego', '80 kW', '80 kW'], ['Electrolizador', '300 kW', 'flexible']] },
  trigger: 'lv10_puerta',
}, [
  [1, '¿Cuál decisión carece de soporte?', ['Mantener el electrolizador a máxima carga aunque aumente la turbidez y exista déficit.', 'Evaluar la calidad de alimentación antes de sostener la OI.', 'Mantener servicios esenciales.', 'Considerar BESS y almacenamiento de agua.'], 0,
    'Con déficit y riesgo de calidad, sostener una carga flexible a plena potencia no tiene soporte.', ['', 'Tiene soporte.', 'Tiene soporte.', 'Tiene soporte.'], 'mantener H2 a toda costa'],
  [2, '¿Cuál carga es explícitamente flexible?', ['Servicios esenciales', 'Electrolizador', 'Sistema de seguridad', 'Comunicaciones de emergencia'], 1,
    'El electrolizador puede modularse sin afectar servicios críticos.', ['Crítica.', '', 'Crítica.', 'Crítica.'], 'confundir cargas'],
  [3, 'La generación renovable durante el evento es:', ['600 kW', '700 kW', '850 kW', '1 000 kW'], 0,
    '150 kW FV + 450 kW eólica = 600 kW.', ['', 'Suma FV previa y eólica.', 'Usa los valores previos.', 'Suma valores de distintos momentos.'], 'mezclar escenarios temporales', { ordered: true }],
  [4, '¿Qué estrategia conecta mejor calidad, energía y reservas?', ['Forzar OI y H2 simultáneamente.', 'Priorizar servicios, revisar pretratamiento, modular la OI y pausar el H2 si es necesario.', 'Descargar completamente el BESS y no cambiar cargas.', 'Cerrar toda la planta sin evaluar variables.'], 1,
    'Integra calidad de agua, prioridades y energía disponible, con cargas flexibles moduladas.', ['Excede la generación y arriesga membranas.', '', 'Agota la reserva.', 'Pierde servicios innecesariamente.'], 'mantener setpoints nominales'],
  [5, '¿Qué mejora hace al sistema más transferible a futuras tormentas?', ['Usar una regla fija basada solo en FV.', 'Maximizar siempre el H2.', 'Incorporar pronóstico, reservas mínimas, calidad de agua, prioridades y revisión comunitaria.', 'Eliminar sensores para simplificar.'], 2,
    'Combina anticipación, márgenes, calidad y gobernanza.', ['Ignora otras variables.', 'Prioriza mal.', '', 'Reduce la información.'], 'buscar una regla única'],
]);

ctx('RA-08-C2', 'Evaluación del contrato de hidrógeno', {
  text: 'Un contrato exige exportar 120 kg/día de H2 "verde". El excedente renovable medio es 4 500 kWh/día (variable). SEC = 55 kWh/kg. Si falta excedente, el contrato permite comprar electricidad de la red regional, de origen mayoritariamente fósil (escenario).',
  table: { head: ['CONCEPTO', 'VALOR'], rows: [['Cuota', '120 kg/día'], ['Excedente medio', '4 500 kWh/día'], ['SEC', '55 kWh/kg'], ['Respaldo', 'red mayoritariamente fósil']] },
}, [
  [1, '¿Cuál afirmación NO se sostiene?', ['Cumplir la cuota es compatible con cualquier condición climática sin afectar otros servicios.', 'La producción depende del excedente renovable.', 'Usar respaldo fósil afecta el atributo "verde".', 'La cuota fija choca con la variabilidad renovable.'], 0,
    'La variabilidad hace que la cuota fija requiera respaldo o reservas, con impactos.', ['', 'Se sostiene.', 'Se sostiene.', 'Se sostiene.'], 'presentar el H2 como solución sin restricciones'],
  [2, '¿Cuánta energía requiere producir 120 kg/día?', ['2 182 kWh', '4 500 kWh', '6 600 kWh', '120 kWh'], 2,
    '120 × 55 = 6 600 kWh/día.', ['Divide.', 'Es el excedente disponible.', '', 'Confunde kg y kWh.'], 'confundir energía y masa', { ordered: true }],
  [3, 'Con el excedente medio, ¿cuál evaluación es correcta?', ['Produce ≈ 82 kg/día; faltan ≈ 38 kg que exigirían ≈ 2 100 kWh de otra fuente.', 'Produce 120 kg/día sin déficit.', 'Produce ≈ 247 kg/día.', 'Produce ≈ 38 kg/día.'], 0,
    '4 500/55 ≈ 82 kg; déficit 38 kg × 55 ≈ 2 090 kWh.', ['', 'Ignora la energía.', 'Multiplica mal.', 'Confunde déficit con producción.'], 'ignorar balances'],
  [4, '¿Qué evaluación del contrato integra mejor los criterios?', ['Firmarlo: el H2 es el futuro.', 'Renegociar cuotas flexibles ligadas al excedente real, garantizar prioridad del agua y servicios esenciales, y verificar el origen eléctrico.',
    'Cumplir la cuota usando la reserva de la batería.', 'Rechazar toda producción de H2.'], 1,
    'Alinea la cuota con la física del sistema y con las prioridades sociales, con trazabilidad.', ['Ignora restricciones.', '', 'Compromete la resiliencia.', 'Desaprovecha excedentes.'], 'cuotas rígidas'],
  [5, '¿Qué gobernanza es más transferible para futuros contratos?', ['Decisión técnica cerrada del financiador.', 'Criterios públicos, participación comunitaria, cuotas adaptativas, auditoría del origen eléctrico y revisión periódica.', 'Un índice único de rentabilidad.', 'Aceptar cualquier contrato que traiga inversión.'], 1,
    'Transparencia y participación permiten discutir trade-offs y adaptar.', ['Excluye a los afectados.', '', 'Oculta criterios.', 'Ignora impactos.'], 'ocultar ponderaciones'],
]);

ctx('RA-08-C3', 'Expansión del sistema a una nueva comunidad', {
  text: 'Una comunidad de 800 personas necesita agua (50 L/persona/día, supuesto). Alternativas: A) ampliar la tubería desde SYNARA; B) planta local pequeña de OI con FV; C) carrotanques. Criterios normalizados (1 = mejor).',
  table: { head: ['ALT.', 'COSTO', 'CONFIAB.', 'EMISIONES', 'PARTICIP.'], rows: [['A', '0,4', '0,9', '0,8', '0,5'], ['B', '0,6', '0,7', '0,9', '0,9'], ['C', '0,3', '0,4', '0,2', '0,3']] },
}, [
  [1, '¿Cuál afirmación NO se sostiene?', ['La alternativa de menor costo inicial es necesariamente la mejor.', 'Las alternativas compiten en varios criterios.', 'Los pesos de los criterios son decisiones discutibles.', 'La participación es un criterio relevante.'], 0,
    'El costo inicial es un criterio entre varios; puede ocultar costos de operación, confiabilidad o impactos.', ['', 'Se sostiene.', 'Se sostiene.', 'Se sostiene.'], 'creer que el menor costo es siempre la mejor decisión'],
  [2, '¿Cuál es la demanda diaria de agua?', ['4 m³/día', '40 m³/día', '400 m³/día', '40 000 m³/día'], 1,
    '800 × 50 L = 40 000 L = 40 m³/día.', ['Error de escala.', '', 'Error de escala.', 'Olvida convertir L a m³.'], 'conversión L–m³', { ordered: true }],
  [3, '¿Qué alternativa está dominada (otra es igual o mejor en todo)?', ['A', 'B', 'C', 'Ninguna'], 2,
    'C es peor que A y que B en todos los criterios normalizados.', ['A es mejor que B en confiabilidad.', 'B es mejor en emisiones y participación.', '', 'C está dominada.'], 'no identificar soluciones dominadas'],
  [4, 'Entre A y B (no dominadas), ¿qué evaluación es más pertinente?', ['Elegir A porque tiene la mayor confiabilidad, sin discutir.', 'Explicitar pesos con la comunidad, analizar incertidumbre (p. ej., mantenimiento local de B), considerar soluciones híbridas y documentar quién asume los costos.',
    'Sumar los valores y elegir el mayor sin declarar pesos.', 'Elegir B porque lo prefiere el equipo técnico.'], 1,
    'La decisión entre no dominadas depende de valores: deben hacerse visibles y discutirse.', ['Un criterio único.', '', 'Suma con pesos implícitos iguales sin declararlos.', 'Excluye a la comunidad.'], 'tratar ponderaciones como verdades objetivas'],
  [5, '¿Qué proceso es más transferible a futuras expansiones?', ['Un índice único calculado por el gemelo digital.', 'Proceso participativo: criterios y pesos públicos, escenarios con incertidumbre, piloto y revisión con datos reales.', 'Elegir siempre la tubería.', 'Decidir por votación sin información técnica.'], 1,
    'Integra evidencia técnica y legitimidad social, y aprende de la experiencia.', ['Oculta criterios.', '', 'Ignora el contexto.', 'Ignora la evidencia.'], 'decisiones opacas'],
]);

/* ============================== RA-09 ============================== */
ctx('RA-09-C1', 'Prototipo de sensor de humedad', {
  text: 'Un sensor capacitivo de bajo costo se calibró contra medidas gravimétricas de humedad del suelo. Lectura 520 ↔ 10 % de humedad; lectura 380 ↔ 30 %. Se sabe que la salinidad del suelo puede alterar la lectura (supuesto de escenario).',
  table: { head: ['LECTURA', 'HUMEDAD (GRAVIM.)'], rows: [['520', '10 %'], ['450', '?'], ['380', '30 %']] },
}, [
  [1, '¿Cuál afirmación NO se sostiene?', ['Si el sensor muestra un número, ese número es la humedad real.', 'La calibración relaciona lecturas con una medida de referencia.', 'La salinidad puede introducir error.', 'Replicar sensores ayuda a estimar la variabilidad.'], 0,
    'La lectura cruda necesita calibración y validación; puede tener sesgos.', ['', 'Se sostiene.', 'Se sostiene.', 'Se sostiene.'], 'tratar una lectura como verdad exacta'],
  [2, 'Con calibración lineal, ¿qué humedad corresponde a una lectura de 450?', ['15 %', '20 %', '25 %', '45 %'], 1,
    'Pendiente: 20 % / 140 lecturas. (520 − 450) = 70 → 10 % + 10 % = 20 %.', ['Error de proporción.', '', 'Error de proporción.', 'Confunde lectura con porcentaje.'], 'interpolar mal', { ordered: true }],
  [3, 'Dos sensores en la misma parcela marcan 18 % y 26 % (incertidumbre ± 3 % cada uno). ¿Qué conclusión es correcta?', ['La diferencia (8 %) supera la incertidumbre combinada: hay variabilidad real o un sensor mal ubicado.', 'Son iguales dentro de la incertidumbre.', 'El sensor de 26 % está roto.', 'Se debe promediar y descartar la diferencia.'], 0,
    'Incertidumbre combinada ≈ √(3² + 3²) ≈ 4,2 %: 8 % es mayor, la diferencia es significativa.', ['', 'La diferencia excede la incertidumbre.', 'No hay evidencia de falla sin más datos.', 'Pierde información útil.'], 'descartar diferencias sin analizar'],
  [4, '¿Cuál es la mejor siguiente iteración del prototipo?', ['Venderlo tal cual.', 'Recalibrar con suelo salino, replicar sensores, comparar con medidas manuales y proteger la electrónica del sol y la sal.', 'Cambiar el color de la carcasa.', 'Aumentar la frecuencia de lectura sin calibrar.'], 1,
    'Itera sobre las fuentes de error identificadas y valida con evidencia independiente.', ['Sin validación.', '', 'No afecta la medida.', 'Más datos sesgados no corrigen el sesgo.'], 'prototipar sin validar'],
  [5, 'Diseña un piloto en una nueva finca.', ['Instalar un sensor por finca y automatizar el riego.', 'Piloto con sensores replicados, calibración local, protocolo de mantenimiento, registro compartido con agricultores y reglas de riego revisadas con ellos.',
    'Confiar en el pronóstico del clima en lugar de medir.', 'Usar la calibración de Aridia sin cambios.'], 1,
    'Transfiere el método de calibración y validación con participación local.', ['Sin réplica ni validación.', '', 'Ignora el suelo.', 'Los suelos difieren.'], 'transferir calibraciones sin validar'],
]);

ctx('RA-09-C2', 'Comunicación pública de incertidumbre', {
  text: 'El gemelo digital estima para la próxima semana: 70 % de probabilidad de agua suficiente, 20 % de racionamiento moderado y 10 % de racionamiento severo. La radio local pide "un sí o un no".',
  table: { head: ['ESCENARIO', 'PROBABILIDAD', 'ACCIÓN SUGERIDA'], rows: [['Suficiente', '70 %', 'uso normal responsable'], ['Moderado', '20 %', 'turnos de suministro'], ['Severo', '10 %', 'prioridad esencial']] },
}, [
  [1, '¿Cuál afirmación NO se sostiene?', ['Comunicar solo el escenario más probable evita confusión y es suficiente.', 'Hay 30 % de probabilidad de algún racionamiento.', 'Las acciones dependen del escenario.', 'La incertidumbre debe explicarse con claridad.'], 0,
    'Ocultar el 30 % de racionamiento impide prepararse y daña la confianza si ocurre.', ['', 'Se sostiene: 20 + 10.', 'Se sostiene.', 'Se sostiene.'], 'ocultar la incertidumbre'],
  [2, '¿Cuál es la probabilidad de algún tipo de racionamiento?', ['10 %', '20 %', '30 %', '70 %'], 2,
    '20 % + 10 % = 30 %.', ['Solo severo.', 'Solo moderado.', '', 'Es el escenario suficiente.'], 'leer un solo escenario', { ordered: true }],
  [3, '¿Qué visualización comunica mejor la información?', ['Un solo número: "Agua: OK".', 'Barras por escenario con probabilidad, acciones sugeridas y fecha de actualización.', 'Un mapa sin leyenda.', 'Una tabla técnica de caudales horarios.'], 1,
    'Muestra escenarios, probabilidades y qué hacer en cada caso, de forma legible.', ['Oculta la incertidumbre.', '', 'Sin leyenda no se entiende.', 'Demasiado técnica para el público.'], 'diseñar visualizaciones opacas'],
  [4, '¿Qué mensaje radial integra mejor precisión y utilidad?', ['"Todo está bien, no se preocupen."', '"Lo más probable es que haya agua suficiente (7 de 10). Hay 3 de 10 de que haya turnos. Preparemos recipientes; actualizaremos el miércoles."',
    '"No sabemos nada."', '"Habrá racionamiento severo."'], 1,
    'Expresa lo que se sabe, lo que no, qué hacer y cuándo se actualiza.', ['Oculta riesgos.', '', 'Niega la información disponible.', 'Exagera el escenario menos probable.'], 'confundir incertidumbre con ignorancia'],
  [5, 'Diseña un plan de comunicación transferible.', ['Un comunicado técnico mensual.', 'Canales locales, lenguaje claro, escenarios con acciones, actualizaciones periódicas y retroalimentación de la comunidad para mejorar el mensaje.', 'Comunicar solo cuando hay crisis.', 'Delegar todo al gemelo digital.'], 1,
    'Combina claridad, regularidad y diálogo en ambos sentidos.', ['Poco accesible.', '', 'Reactivo.', 'Sin rendición de cuentas.'], 'comunicación unidireccional'],
]);

ctx('RA-09-C3', 'Rediseño participativo del tablero', {
  text: 'El tablero actual muestra "Índice SYNARA: 92/100". Internamente suma costo (USD), agua entregada (m³), H2 exportado (kg) y equidad hídrica (%), con un peso de equidad igual a 0.',
  table: { head: ['CRITERIO', 'UNIDAD', 'PESO OCULTO'], rows: [['Costo', 'USD', '0,4'], ['Agua entregada', 'm³', '0,2'], ['H2 exportado', 'kg', '0,4'], ['Equidad hídrica', '%', '0,0']] },
}, [
  [1, '¿Cuál afirmación NO se sostiene?', ['Un índice único alto garantiza que todos los actores están bien servidos.', 'La equidad no influye en el índice actual.', 'Sumar unidades distintas sin normalizar no tiene sentido físico.', 'Los pesos ocultos impiden discutir la decisión.'], 0,
    'Con equidad = 0, un índice alto puede coexistir con comunidades sin agua.', ['', 'Se sostiene.', 'Se sostiene.', 'Se sostiene.'], 'confiar en una puntuación opaca'],
  [2, '¿Qué criterio quedó excluido en la práctica?', ['Costo', 'Agua entregada', 'H2 exportado', 'Equidad hídrica'], 3,
    'Su peso es 0: no afecta el índice.', ['Tiene peso 0,4.', 'Tiene peso 0,2.', 'Tiene peso 0,4.', ''], 'no revisar ponderaciones'],
  [3, '¿Cuál es el problema metodológico principal del índice?', ['Que usa decimales.', 'Suma magnitudes con unidades incompatibles sin normalización y con pesos no declarados.', 'Que tiene cuatro criterios.', 'Que se muestra en color azul.'], 1,
    'Sin normalización la escala de cada unidad domina arbitrariamente; los pesos deben declararse.', ['Irrelevante.', '', 'El número de criterios no es el problema.', 'Irrelevante.'], 'sumar unidades incompatibles'],
  [4, '¿Qué rediseño del tablero es más pertinente?', ['Subir el peso del H2 para mejorar el índice.', 'Mostrar criterios por separado, normalizados, con pesos declarados y editables, incertidumbre y quién se ve afectado en cada escenario.', 'Eliminar la equidad para simplificar.', 'Mostrar solo el índice con más decimales.'], 1,
    'Hace visibles los trade-offs y permite deliberar.', ['Manipula el índice.', '', 'Oculta afectados.', 'No resuelve la opacidad.'], 'ocultar criterios en una puntuación'],
  [5, '¿Qué proceso de revisión del tablero es más transferible?', ['Revisión técnica anual cerrada.', 'Talleres periódicos con actores para revisar criterios, pesos y visualizaciones; registro de cambios y pruebas de comprensión con usuarios.', 'Delegar los pesos al algoritmo de optimización.', 'Mantener el tablero sin cambios para no confundir.'], 1,
    'Institucionaliza la participación y el aprendizaje sobre la herramienta.', ['Excluye actores.', '', 'Los pesos son valores, no resultados técnicos.', 'Impide mejorar.'], 'tratar los pesos como hechos técnicos'],
]);

