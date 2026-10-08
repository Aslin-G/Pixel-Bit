/* =====================================================================
   22a_questions.js — Banco SOLO (parte 1): RA-01, RA-02, RA-03
   Formato compacto: ctx(id, título, contexto, items)
   item: [nivelSOLO, enunciado, [A,B,C,D], clave, justificación, [racional por opción], concepción, extra]
   extra: {retry:{stem, options, key, why, dist}, hints:[3], guide, concepts, ordered, src}
   ===================================================================== */

function ctx(id, title, C, items) {
  const ra = id.slice(0, 5);
  CONTEXTS[id] = Object.assign({ id, ra, title, sim: true }, C);
  items.forEach(([solo, stem, options, key, why, dist, mis, extra = {}]) => {
    QBANK.push(Object.assign({
      id: id + '-Q0' + solo, ra, ctx: id, solo, competency: (extra.concepts || RA_CONCEPTS[ra])[0], concepts: extra.concepts || RA_CONCEPTS[ra],
      claim: RA[ra], evidence: 'Selecciona y justifica la opción coherente con los datos del contexto (' + SOLO_NAMES[solo] + ').', task: SOLO_TASKS[solo],
      stem, options, key, keyRationale: why, why, distractorRationales: dist, dist, misconception: mis, mis,
      source: C.src || 'Datos simulados para fines educativos', isSimulatedData: C.sim !== false,
      retryVariant: extra.retry || null, retry: extra.retry || null, gameTrigger: C.trigger || ('puerta_' + id), difficulty: solo, estimatedTime: 40 + solo * 25,
      hints: extra.hints || null, guide: extra.guide || null, ordered: !!extra.ordered,
    }, extra.meta || {}));
  });
}

/* ============================== RA-01 ============================== */
ctx('RA-01-C1', 'Captación durante floración algal simulada', {
  text: 'Una floración de microalgas se concentra cerca de la superficie. La planta puede captar desde 4 m o desde 12 m. Con la toma de 4 m a 110 m³/h, el ΔP del filtro subió de 0,4 a 0,9 bar en 6 h.',
  table: { head: ['PROF.', 'TURB. NTU', 'SDI', 'T °C', 'CLOROF.'], rows: [['4 m', '6,5', '5,8', '30,5', '8/10'], ['12 m', '2,1', '3,2', '27,0', '2/10']] },
  trigger: 'lv01_variante',
}, [
  [1, '¿Cuál conclusión NO se sostiene con los datos?', [
    'La toma de 12 m capta agua con menos turbidez y menor SDI que la de 4 m.',
    'Como la floración está en la superficie, la profundidad de captación no influye en el agua captada.',
    'El aumento del ΔP del filtro es coherente con una mayor carga de sólidos y materia orgánica.',
    'En este escenario, el agua superficial más cálida coincide con mayor índice de clorofila.'], 1,
    'Los datos muestran diferencias claras entre 4 m y 12 m en turbidez, SDI y clorofila: la profundidad sí cambia la calidad del agua captada.',
    ['Se sostiene: 2,1 < 6,5 NTU y 3,2 < 5,8 de SDI.', '', 'Se sostiene: más sólidos retenidos elevan la pérdida de carga.', 'Se sostiene como asociación en el escenario (no prueba causalidad por sí sola).'],
    'creer que la composición del agua de mar es igual en toda la columna',
    { hints: ['¿Las dos filas de la tabla describen la misma agua?', 'Compara turbidez, SDI y clorofila entre 4 m y 12 m.', 'Una de las opciones contradice directamente la tabla.'] }],
  [2, '¿Qué indicador de la tabla se usa para anticipar el ensuciamiento de las membranas?', [
    'El SDI (índice de densidad de sedimentos).', 'La temperatura del agua.', 'La salinidad (TDS) de la alimentación.', 'La profundidad de la toma.'], 0,
    'El SDI mide la tendencia del agua a taponar un filtro de referencia: es el indicador estándar de potencial de ensuciamiento por partículas.',
    ['', 'La temperatura cambia la permeabilidad y la actividad biológica, pero no mide directamente la carga de partículas.', 'La salinidad determina la presión osmótica, no el ensuciamiento por partículas.', 'La profundidad es una decisión de diseño, no un indicador medido del agua.'],
    'confundir salinidad con ensuciamiento',
    { retry: { stem: 'Un operador quiere saber si el agua pretratada puede taponar las membranas. ¿Qué medición le resulta más directa?', options: ['La temperatura del agua.', 'La conductividad del agua de mar.', 'El índice de densidad de sedimentos (SDI).', 'La presión de la bomba de alta presión.'], key: 2, why: 'El SDI es el ensayo diseñado para el potencial de taponamiento por partículas.', dist: ['La temperatura no mide partículas.', 'La conductividad mide sales disueltas.', '', 'La presión de la bomba es una respuesta del sistema, no del agua.'] } }],
  [3, 'Con el mismo caudal de 110 m³/h, ¿aproximadamente cuántas veces mayor es la carga de sólidos que llega al filtro desde 4 m que desde 12 m? (Use la turbidez como indicador de sólidos.)', [
    'Aproximadamente 1,5 veces.', 'Aproximadamente 3,1 veces.', 'Aproximadamente 4,4 veces más.', 'Es la misma, porque el caudal es igual.'], 1,
    'Carga ≈ turbidez × caudal. Con igual caudal, la razón es 6,5 / 2,1 ≈ 3,1.',
    ['Confunde la razón de SDI parcial o de temperatura.', '', '4,4 es la diferencia en NTU (6,5 − 2,1), no la razón.', 'El caudal igual no anula la diferencia de concentración de sólidos.'],
    'ignorar que la carga depende de concentración y caudal', { ordered: true }],
  [4, 'El ΔP sigue subiendo y la floración continúa. ¿Qué decisión integra mejor calidad, protección de membranas y producción?', [
    'Aumentar el caudal desde 4 m para compensar la menor producción del filtro.',
    'Cambiar a la toma de 12 m, mantener un caudal moderado, ajustar la coagulación y vigilar SDI y ΔP.',
    'Suspender la coagulación para ahorrar químicos mientras dure la floración.',
    'Puentear el filtro para que las membranas reciban más agua.'], 1,
    'Captar donde el agua es mejor reduce la carga; el caudal moderado limita la pérdida de carga; la coagulación y el monitoreo protegen la membrana sin detener la planta.',
    ['Más caudal desde 4 m eleva la carga de sólidos y acelera el colapso del filtro.', '', 'Sin coagulación pasan más finos y materia orgánica: aumenta el ensuciamiento.', 'Puentear el filtro envía sólidos a las membranas y las daña.'],
    'creer que aumentar el caudal siempre mejora la producción'],
  [5, 'Diseña un protocolo transferible para una costa con floraciones recurrentes. ¿Cuál es el más robusto?', [
    'Lavar los filtros siempre a la misma hora, sin importar las mediciones.',
    'Usar umbrales de SDI, ΔP y clorofila para elegir profundidad y caudal, con margen de capacidad y reserva de agua tratada.',
    'Operar siempre al caudal máximo para acumular agua antes de cada floración.',
    'Confiar en un único sensor de turbidez instalado en superficie.'], 1,
    'Un protocolo robusto responde a indicadores medidos, usa la flexibilidad de diseño (profundidad, caudal) y mantiene reservas para absorber la incertidumbre.',
    ['Un calendario fijo ignora la variabilidad del agua.', '', 'El caudal máximo aumenta el riesgo justo cuando el agua empeora.', 'Un solo sensor mal ubicado no representa el agua captada.'],
    'buscar una regla fija para un sistema variable'],
]);

ctx('RA-01-C2', 'Toma costera con fauna sensible', {
  text: 'Pescadores reportan larvas de peces atrapadas en la rejilla de la toma. La velocidad de aproximación es v = Q / (3 600 · A), con Q en m³/h y A (área efectiva) en m². Como referencia de protección se usa 0,15 m/s, criterio similar al de la regla 316(b) de la EPA de EE. UU. (2014) para tomas de enfriamiento.',
  table: { head: ['CONFIG.', 'Q M³/H', 'A M²', 'V M/S', 'LARVAS'], rows: [['A: rejilla gruesa', '120', '0,20', '0,17', '9'], ['B: rejilla fina amplia', '120', '0,30', '0,11', '4'], ['C: fina + caudal bajo', '90', '0,30', '0,08', '2']] },
  sim: true, src: 'U.S. EPA (2014), Clean Water Act §316(b) (criterio de velocidad de 0,5 ft/s ≈ 0,15 m/s). Resto: datos simulados.',
}, [
  [1, '¿Cuál afirmación NO se sostiene?', [
    'Con el mismo caudal, aumentar el área efectiva de la rejilla reduce la velocidad de aproximación.',
    'La configuración C atrapa menos larvas que la A.',
    'Si el caudal no cambia, el área de la rejilla no puede modificar la velocidad de aproximación.',
    'La configuración A supera el criterio de 0,15 m/s.'], 2,
    'v = Q / (3 600 · A): con Q constante, más área implica menor velocidad (compara A y B).',
    ['Se sostiene por la ecuación y por la tabla (A vs B).', 'Se sostiene: 2 < 9.', '', 'Se sostiene: 0,17 > 0,15 m/s.'],
    'ignorar la relación caudal–área–velocidad'],
  [2, '¿Cuál es la velocidad de aproximación con Q = 120 m³/h y A = 0,25 m²?', ['0,033 m/s', '0,133 m/s', '0,48 m/s', '480 m/s'], 1,
    'v = 120 / (3 600 × 0,25) = 120 / 900 ≈ 0,133 m/s.',
    ['Error de unidades o de orden en la división.', '', 'Olvida convertir horas a segundos de forma correcta (120/250).', 'Olvida convertir m³/h a m³/s.'],
    'no convertir unidades de caudal', { ordered: true, retry: { stem: '¿Cuál es la velocidad con Q = 90 m³/h y A = 0,20 m²?', options: ['0,125 m/s', '0,45 m/s', '18 m/s', '0,0125 m/s'], key: 0, why: '90 / (3 600 × 0,20) = 90 / 720 = 0,125 m/s.', dist: ['', 'Omite el factor 3 600.', 'Multiplica en lugar de dividir.', 'Error de un orden de magnitud.'] } }],
  [3, '¿Qué configuraciones cumplen a la vez v ≤ 0,15 m/s y entregan al menos 100 m³/h?', ['Solo A.', 'Solo B.', 'B y C.', 'A y C.'], 1,
    'A no cumple la velocidad (0,17). C cumple la velocidad pero entrega 90 m³/h (< 100). Solo B cumple ambas.',
    ['A excede el criterio de velocidad.', '', 'C no alcanza el caudal requerido.', 'A no cumple velocidad y C no cumple caudal.'],
    'evaluar un solo criterio a la vez'],
  [4, 'La planta necesita agua y la comunidad pesquera pide proteger las larvas. ¿Qué evaluación integra mejor ambos objetivos?', [
    'Elegir A porque maximiza el caudal; las larvas no son responsabilidad de la planta.',
    'Adoptar B, reducir el caudal en la temporada de desove (como C) usando la reserva, y monitorear larvas con la comunidad.',
    'Cerrar la toma de forma permanente para eliminar cualquier impacto.',
    'Elegir C todo el año aunque no cubra la demanda de agua.'], 1,
    'Combina diseño (área y malla), operación estacional, uso de reservas y monitoreo participativo: reduce el impacto sin abandonar el servicio.',
    ['Ignora el impacto ecológico y la licencia social.', '', 'Elimina el servicio de agua sin buscar alternativas.', 'Protege la fauna pero incumple el servicio esencial sin compensación.'],
    'tratar agua y ecosistema como objetivos excluyentes'],
  [5, 'Para una nueva costa con un arrecife protegido, ¿qué estrategia de captación es más transferible?', [
    'Copiar exactamente la toma de Aridia en la misma ubicación relativa.',
    'Evaluar captación subsuperficial o toma profunda lejos del arrecife, con baja velocidad, rejillas finas y monitoreo comunitario adaptativo.',
    'Ubicar la toma sobre el arrecife porque el agua es más clara.',
    'Decidir solo por el menor costo de tubería.'], 1,
    'La estrategia transferible define criterios (calidad, velocidad, receptores sensibles, monitoreo) y los aplica al nuevo sitio en lugar de copiar una solución.',
    ['Cada sitio tiene geología, corrientes y receptores distintos.', '', 'Agua clara junto al arrecife implica alto impacto sobre larvas y corales.', 'El costo es un criterio, no el único.'],
    'copiar soluciones en lugar de transferir criterios'],
]);

ctx('RA-01-C3', 'Filtro saturado tras tormenta', {
  text: 'Tras una tormenta, la planta mantuvo 100 m³/h. Límites de operación: ΔP del filtro ≤ 1,0 bar y turbidez de salida ≤ 1,0 NTU hacia las membranas.',
  table: { head: ['HORA', 'TURB. ENTRADA', 'ΔP BAR', 'TURB. SALIDA'], rows: [['0', '3', '0,35', '0,2'], ['2', '8', '0,55', '0,3'], ['4', '30', '1,05', '0,6'], ['6', '42', '1,25', '1,8'], ['8', '25', '1,40', '2,6'], ['10', '10', '1,45', '2,9']] },
  trigger: 'lv01_puerta',
}, [
  [1, '¿Cuál conclusión NO se sostiene?', [
    'Entre las 6 y las 10 h la turbidez de entrada bajó, por lo que el filtro ya se recuperó.',
    'A las 4 h el ΔP ya superaba su límite, aunque la turbidez de salida aún cumplía.',
    'La turbidez de salida empeora a pesar de que la entrada mejora: el filtro está saturado.',
    'Mantener 100 m³/h durante el pulso aumentó la carga sobre el filtro.'], 0,
    'La salida empeora (1,8 → 2,9 NTU) y el ΔP sigue alto (1,45 bar): el filtro no se recuperó aunque la entrada bajó.',
    ['', 'Se sostiene: 1,05 > 1,0 bar con 0,6 NTU de salida.', 'Se sostiene: es la señal típica de ruptura (breakthrough).', 'Se sostiene: carga = turbidez × caudal.'],
    'creer que el sistema se recupera solo cuando la entrada mejora', { hints: ['¿Qué pasa con la columna de turbidez de SALIDA entre las 6 y las 10 h?', 'Mira el ΔP a las 10 h.', 'Una opción infiere recuperación solo mirando la entrada.'] }],
  [2, '¿Qué indicador superó primero su límite de operación?', ['La turbidez de salida, a las 2 h.', 'El ΔP del filtro, a las 4 h.', 'La turbidez de salida, a las 4 h.', 'El ΔP del filtro, a las 6 h.'], 1,
    'A las 4 h el ΔP es 1,05 bar (> 1,0) mientras la salida es 0,6 NTU (< 1,0). El ΔP anticipa la saturación.',
    ['A las 2 h la salida era 0,3 NTU.', '', 'A las 4 h la salida (0,6) cumplía.', 'El ΔP ya excedía a las 4 h.'],
    'mirar solo la calidad final y no los indicadores anticipatorios', { ordered: true }],
  [3, 'Con caudal constante, ¿cuántas veces mayor era la carga de sólidos a las 6 h que a las 0 h (según turbidez de entrada)?', ['1,4 veces', '14 veces', '39 veces', 'Igual, porque el caudal no cambió'], 1,
    '42 NTU / 3 NTU = 14. Con caudal constante, la carga escala con la turbidez.',
    ['Error de cálculo o de lectura.', '', '39 es la diferencia (42 − 3), no la razón.', 'La concentración de sólidos sí cambió.'],
    'confundir diferencia con razón', { ordered: true }],
  [4, 'Desde la hora 4, ¿qué secuencia operativa protege mejor membranas y servicio?', [
    'Mantener el caudal y esperar a que pase la tormenta.',
    'Reducir caudal, lavar el filtro a contracorriente, ajustar coagulación, cubrir la demanda con la reserva y no enviar agua fuera de especificación.',
    'Aumentar la presión de las membranas para compensar la turbidez.',
    'Enviar el agua turbia a las membranas porque luego se pueden limpiar.'], 1,
    'Actúa sobre la causa (carga), recupera el filtro, protege las membranas y sostiene el servicio con almacenamiento.',
    ['Esperar deja colapsar el filtro (ver horas 6–10).', '', 'La presión de membranas no corrige la turbidez y acelera el ensuciamiento.', 'El ensuciamiento severo puede ser irreversible y costoso.'],
    'confundir pretratamiento con desalinización'],
  [5, '¿Qué protocolo resulta más transferible a la temporada de lluvias de otra región?', [
    'Un umbral único de turbidez de entrada para cerrar la toma.',
    'Respuesta escalonada basada en la tasa de cambio del ΔP y el pronóstico, con reservas mínimas, lavado anticipado y comunicación a usuarios.',
    'Operar siempre a caudal mínimo durante toda la temporada.',
    'Duplicar el número de filtros sin cambiar la operación.'], 1,
    'La tasa de cambio del ΔP anticipa la saturación; combinada con pronóstico y reservas permite actuar antes del daño y explicar las decisiones.',
    ['Un umbral único de entrada no anticipa la saturación ni considera el estado del filtro.', '', 'Sacrifica producción innecesariamente.', 'Más capacidad ayuda, pero sin reglas de operación el problema se repite.'],
    'buscar una solución única en vez de una regla adaptativa'],
]);

/* ============================== RA-02 ============================== */
ctx('RA-02-C1', 'Tren de OI en operación nominal', {
  text: 'Una planta recibe 100 m³/h de agua con 35 g/L de sales. Produce 42 m³/h de permeado con 0,30 g/L. La potencia eléctrica promedio del tren es 150 kW.',
  table: { head: ['VARIABLE', 'VALOR', 'UNIDAD'], rows: [['Qf', '100', 'm³/h'], ['Cf', '35', 'g/L'], ['Qp', '42', 'm³/h'], ['Cp', '0,30', 'g/L'], ['P eléctrica', '150', 'kW']] },
  trigger: 'lv02_puerta',
}, [
  [1, '¿Cuál conclusión desconoce una relación esencial del sistema?', [
    'El concentrado debe transportar la mayor parte de la sal que no aparece en el permeado.',
    'El caudal de concentrado puede obtenerse restando el permeado al caudal de alimentación.',
    'El aumento de recuperación puede elevar la concentración del rechazo.',
    'La membrana elimina la masa de sal, por lo que no es necesario gestionar un concentrado.'], 3,
    'La membrana separa corrientes; no destruye la masa de sal. Casi toda la sal sale en el concentrado.',
    ['Se sostiene por el balance de sal.', 'Se sostiene: Qc = Qf − Qp.', 'Se sostiene: Cc ≈ Cf/(1 − R).', ''],
    'pensar que la membrana destruye la sal'],
  [2, '¿Cuál es la recuperación?', ['35 %', '42 %', '58 %', '150 %'], 1,
    'R = Qp / Qf = 42 / 100 = 42 %.',
    ['Confunde recuperación con la concentración de alimentación.', '', '58 % es la fracción de concentrado.', 'Mezcla potencia con caudal.'],
    'confundir recuperación con otras magnitudes', { ordered: true, retry: { stem: 'Si Qf = 120 m³/h y Qp = 54 m³/h, ¿cuál es la recuperación?', options: ['45 %', '55 %', '54 %', '66 %'], key: 0, why: '54/120 = 0,45.', dist: ['', 'Es la fracción de concentrado.', 'Confunde caudal con porcentaje.', 'Error de división.'] } }],
  [3, '¿Cuál combinación es correcta?', ['Qc = 42 m³/h y SEC = 2,8 kWh/m³.', 'Qc = 58 m³/h y SEC ≈ 3,57 kWh/m³.', 'Qc = 100 m³/h y SEC = 1,50 kWh/m³.', 'Qc = 58 m³/h y SEC ≈ 6,30 kWh/m³.'], 1,
    'Qc = 100 − 42 = 58 m³/h. SEC = 150 kW / 42 m³/h ≈ 3,57 kWh/m³.',
    ['Confunde Qc con Qp y calcula SEC con otra base.', '', 'Usa el caudal de alimentación para SEC y Qc.', 'Usa 150/(42 × 0,567) o un error de base.'],
    'confundir potencia con energía específica'],
  [4, 'Si se intenta elevar la recuperación manteniendo igual pretratamiento y alimentación, ¿qué evaluación es más pertinente?', [
    'Solo aumentará la producción y ninguna otra variable cambiará.',
    'Disminuirá necesariamente la salinidad del concentrado.',
    'Puede aumentar concentración, riesgo de incrustación y exigencia energética, por lo que deben revisarse límites.',
    'El caudal de alimentación dejará de influir.'], 2,
    'Más recuperación concentra el rechazo (más presión osmótica, más riesgo de incrustación y más presión requerida).',
    ['Ignora el balance de sal y los límites de operación.', 'Es lo contrario: el concentrado se vuelve más salino.', '', 'Qf sigue definiendo los balances.'],
    'asumir que el 100 % de recuperación es deseable'],
  [5, 'Durante un episodio de turbidez alta y menor disponibilidad eléctrica, ¿qué estrategia es más robusta?', [
    'Maximizar presión para mantener la producción nominal.', 'Desactivar el pretratamiento para ahorrar energía.',
    'Mantener la producción de H2 y vaciar el tanque de agua.', 'Reducir carga, proteger membranas, priorizar agua esencial y reprogramar cargas flexibles.'], 3,
    'La estrategia robusta protege equipos y servicios esenciales y desplaza las cargas flexibles.',
    ['Más presión acelera el ensuciamiento y consume más energía justo cuando falta.', 'Sin pretratamiento la turbidez daña las membranas.', 'Sacrifica el agua esencial por una carga flexible.', ''],
    'mantener setpoints nominales en condiciones degradadas'],
]);

ctx('RA-02-C2', 'Aumento de ensuciamiento y conductividad', {
  text: 'Datos normalizados de un tren de OI durante 6 semanas. El operador subió la presión de 58 a 66 bar para sostener la producción. Criterio típico de fabricantes de membranas: limpiar si el flujo normalizado cae 10–15 % o el ΔP del tren sube ~15 %.',
  table: { head: ['SEMANA', 'FLUJO NORM.', 'ΔP TREN', 'COND. PERM.', 'P ALIM.'], rows: [['1', '100 %', '1,2 bar', '420 µS/cm', '58 bar'], ['3', '95 %', '1,4 bar', '470 µS/cm', '61 bar'], ['6', '86 %', '1,9 bar', '610 µS/cm', '66 bar']] },
  src: 'Criterio de limpieza: manuales técnicos de fabricantes de membranas de OI. Datos del tren: simulados.',
}, [
  [1, '¿Cuál conclusión NO se sostiene?', [
    'El ΔP creciente del tren es coherente con ensuciamiento en los canales de alimentación.',
    'Como el operador subió la presión, el ensuciamiento ya no afecta la operación.',
    'La conductividad del permeado aumentó durante el periodo.',
    'El flujo normalizado disminuyó a pesar del aumento de presión.'], 1,
    'Subir la presión compensa parcialmente el caudal, pero el flujo normalizado, el ΔP y la conductividad siguen empeorando: el ensuciamiento persiste.',
    ['Se sostiene.', '', 'Se sostiene: 420 → 610 µS/cm.', 'Se sostiene: 100 % → 86 %.'],
    'creer que más presión resuelve el ensuciamiento'],
  [2, '¿Qué indicador refleja de forma más directa el ensuciamiento en los canales de alimentación del tren?', ['El ΔP del tren.', 'La temperatura de alimentación.', 'La recuperación de diseño.', 'La salinidad del agua de mar.'], 0,
    'El ΔP entre la entrada y la salida del concentrado aumenta cuando los canales se obstruyen.',
    ['', 'La temperatura afecta la permeabilidad, no la obstrucción de canales.', 'La recuperación de diseño es un parámetro, no un indicador del estado.', 'La salinidad afecta la presión osmótica.'],
    'confundir variables de estado con parámetros de diseño'],
  [3, 'Con los datos de la semana 6, ¿cuál evaluación es correcta?', [
    'El flujo cayó 14 % y el ΔP subió ≈ 58 %: ambos superan criterios típicos de limpieza.',
    'El flujo cayó 86 % y el ΔP subió 0,7 %: no es necesario limpiar.',
    'El flujo cayó 14 % y el ΔP subió 0,7 bar, que es menos del 15 %.',
    'Ningún indicador cambió porque la presión compensó la pérdida.'], 0,
    'Flujo: 100 → 86 % (−14 %). ΔP: (1,9 − 1,2)/1,2 ≈ 58 %. Ambos superan los criterios típicos.',
    ['', 'Confunde el valor normalizado con la caída y el aumento absoluto con el relativo.', '0,7 bar sobre 1,2 bar es ≈ 58 %, no menos del 15 %.', 'Los indicadores normalizados sí cambiaron.'],
    'confundir cambios absolutos y relativos'],
  [4, '¿Por qué subir la presión puede empeorar la situación?', [
    'Porque al subir la presión el agua de mar se vuelve más salina.',
    'Porque aumenta el flujo a través de la membrana, acelera el depósito de ensuciantes y eleva el consumo energético sin atacar la causa.',
    'Porque la presión no tiene relación con el consumo de energía.',
    'Porque la presión reduce la recuperación a cero.'], 1,
    'Más presión → más flujo → más transporte de ensuciantes hacia la membrana y más energía; la causa (pretratamiento/ensuciamiento) sigue sin resolverse.',
    ['La salinidad de alimentación no depende de la presión de la bomba.', '', 'La potencia de bombeo es proporcional a la presión.', 'Al contrario: más presión aumenta la recuperación.'],
    'atacar el síntoma y no la causa'],
  [5, '¿Qué estrategia de gestión es más transferible a otra planta con alimentación variable?', [
    'Limpiar químicamente cada semana por precaución.',
    'Normalizar datos, definir disparadores de limpieza, investigar la causa en el pretratamiento (SDI) y ajustar la operación antes de forzar presión.',
    'Subir la presión hasta el máximo del recipiente y limpiar solo cuando falle.',
    'Ignorar la conductividad mientras haya caudal.'], 1,
    'La normalización separa efectos de temperatura y salinidad de la degradación real; los disparadores y el análisis causal evitan limpiezas innecesarias y daños.',
    ['Limpiar sin indicadores desgasta la membrana y consume químicos.', '', 'Operar al límite aumenta el riesgo mecánico y el ensuciamiento.', 'La calidad del producto es una restricción de operación.'],
    'limpiar por calendario o nunca'],
]);

ctx('RA-02-C3', 'Reducción de energía disponible', {
  text: 'Por nubes persistentes, la potencia disponible para la OI baja de 160 kW a 110 kW durante 6 h. La planta opera con SEC = 3,6 kWh/m³. La demanda es 40 m³/h y el tanque tiene 180 m³ al inicio.',
  table: { head: ['CONDICIÓN', 'POTENCIA', 'SEC', 'DEMANDA'], rows: [['Normal', '160 kW', '3,6 kWh/m³', '40 m³/h'], ['Nublado (6 h)', '110 kW', '3,6 kWh/m³', '40 m³/h']] },
}, [
  [1, '¿Cuál afirmación NO se sostiene?', [
    'Con menos potencia, la producción de permeado disminuye si el SEC se mantiene.',
    'El tanque puede amortiguar temporalmente la diferencia entre producción y demanda.',
    'Con menos potencia, la planta producirá la misma agua aumentando la recuperación sin costo.',
    'Las cargas flexibles podrían desplazarse para liberar potencia.'], 2,
    'Aumentar la recuperación exige más presión y eleva riesgos (incrustación, calidad); no crea energía ni agua gratis.',
    ['Se sostiene: Qp = P/SEC.', 'Se sostiene.', '', 'Se sostiene.'],
    'creer que la recuperación compensa la falta de energía'],
  [2, '¿Cuánto permeado se produce con 110 kW?', ['3,6 m³/h', '30,6 m³/h', '44,4 m³/h', '396 m³/h'], 1,
    'Qp = 110 kW / 3,6 kWh/m³ ≈ 30,6 m³/h.',
    ['Confunde SEC con caudal.', '', 'Es la producción con 160 kW.', 'Multiplica en lugar de dividir.'],
    'confundir potencia con energía específica', { ordered: true }],
  [3, 'Tras las 6 h nubladas, ¿cuánta agua queda en el tanque (sin otras entradas)?', ['80 m³', '123,6 m³', '180 m³', '236,4 m³'], 1,
    '180 + (30,6 − 40) × 6 = 180 − 56,4 = 123,6 m³.',
    ['Resta toda la demanda sin sumar la producción.', '', 'Ignora el balance.', 'Suma el déficit en lugar de restarlo.'],
    'errores de signo en balances', { ordered: true }],
  [4, '¿Qué estrategia integra mejor energía, agua y límites operativos?', [
    'Subir la recuperación al máximo para producir más con menos energía.',
    'Operar dentro de límites a menor carga, usar el tanque, desplazar cargas flexibles (como el electrolizador) y recuperar el nivel cuando vuelva el sol.',
    'Apagar la OI y esperar sin usar la reserva.',
    'Mantener 44 m³/h tomando energía de la reserva crítica de la batería.'], 1,
    'Acopla la producción a la energía disponible, protege la reserva crítica y usa el almacenamiento de agua como amortiguador.',
    ['Más recuperación no reduce el SEC de forma garantizada y aumenta riesgos.', '', 'Desperdicia producción posible y pone en riesgo el suministro.', 'Compromete servicios esenciales.'],
    'confundir almacenamiento de agua y de energía'],
  [5, 'Diseña una regla para futuros días nublados.', [
    'Producir siempre al máximo hasta que falle la energía.',
    'Usar el pronóstico para llenar el tanque antes del evento, alinear la OI con ventanas renovables y fijar un nivel mínimo de agua con prioridades declaradas.',
    'Desconectar la OI cada vez que pase una nube.',
    'Elegir siempre la recuperación máxima.'], 1,
    'La regla robusta anticipa (pronóstico), aprovecha la flexibilidad (tanque, horario) y declara mínimos y prioridades.',
    ['Reactiva y sin reservas.', '', 'Las nubes pasajeras no justifican paradas: pierden producción y desgastan equipos.', 'Ignora límites y energía.'],
    'reglas reactivas sin anticipación'],
]);

/* ============================== RA-03 ============================== */
ctx('RA-03-C1', 'Descarga costera con marea variable', {
  text: 'El exceso de salinidad (ΔS) se mide en dos receptores al descargar en distintas fases de marea. Umbral del escenario: ΔS ≤ 2 g/L (supuesto de simulación; los umbrales reales dependen de especies y normativa).',
  table: { head: ['VENTANA', 'CORRIENTE', 'ΔS MANGLAR', 'ΔS 500 M'], rows: [['Llenante', 'hacia manglar', '3,2', '0,6'], ['Vaciante', 'mar adentro', '0,8', '2,4'], ['Repunte', 'débil', '1,6', '1,0']] },
  trigger: 'lv03_puerta',
}, [
  [1, '¿Cuál conclusión NO se sostiene?', [
    'Descargar en vaciante elimina la sal del sistema costero.', 'La fase de marea cambia qué receptor recibe la mayor exposición.',
    'En llenante el manglar supera el umbral del escenario.', 'El repunte mantiene ambos receptores bajo el umbral.'], 0,
    'La vaciante traslada la pluma mar adentro (2,4 g/L a 500 m); la masa de sal se conserva y cambia de lugar.',
    ['', 'Se sostiene.', 'Se sostiene: 3,2 > 2.', 'Se sostiene: 1,6 y 1,0 < 2.'],
    'creer que mover la pluma la elimina'],
  [2, '¿En qué ventana se supera el umbral en el manglar?', ['Llenante', 'Vaciante', 'Repunte', 'En ninguna'], 0,
    'Solo en llenante el ΔS del manglar (3,2 g/L) supera 2 g/L.', ['', '0,8 g/L está bajo el umbral.', '1,6 g/L está bajo el umbral.', 'La llenante lo supera.'], 'leer un solo receptor'],
  [3, '¿Qué ventana mantiene ambos receptores bajo el umbral?', ['Llenante', 'Vaciante', 'Repunte', 'Llenante y repunte'], 2,
    'Repunte: 1,6 y 1,0 g/L. La vaciante excede a 500 m (2,4) y la llenante en el manglar (3,2).',
    ['Excede en el manglar.', 'Excede mar adentro.', '', 'La llenante excede en el manglar.'], 'evaluar un solo criterio'],
  [4, 'La planta produce de forma continua, pero el repunte dura pocas horas. ¿Qué evaluación integra mejor las restricciones?', [
    'Descargar siempre en llenante porque la corriente diluye más rápido.',
    'Almacenar temporalmente el concentrado y descargarlo en repunte (y parte en vaciante con difusor), verificando la capacidad del estanque y monitoreando ambos receptores.',
    'Descargar todo de golpe en vaciante para terminar pronto.',
    'Detener la planta durante toda la llenante sin usar almacenamiento.'], 1,
    'Combina almacenamiento, ventanas favorables, mejora de mezcla y monitoreo, reconociendo la restricción de capacidad.',
    ['La corriente lleva la pluma al manglar.', '', 'Concentra la exposición mar adentro.', 'Pierde producción sin necesidad si existe almacenamiento.'],
    'trasladar el problema fuera de la vista'],
  [5, 'Para otro litoral con praderas marinas y corrientes distintas, ¿qué propuesta es más transferible?', [
    'Usar exactamente las mismas ventanas de Aridia.',
    'Monitoreo adaptativo: sensores en receptores, umbrales por especie, ventanas según corrientes locales, revisión periódica con la comunidad y reglas de parada.',
    'Descargar siempre lo más lejos posible sin medir.', 'Usar solo dilución con agua de mar adicional.'], 1,
    'Transfiere el método (medir, umbralar, adaptar, revisar), no la receta local.',
    ['Las corrientes y receptores cambian.', '', 'Sin monitoreo no se conoce el impacto.', 'La dilución no reduce la masa de sal.'],
    'copiar ventanas en lugar de transferir el método'],
]);

ctx('RA-03-C2', 'Almacenamiento temporal en temporada seca', {
  text: 'El concentrado sale a 58 m³/h. Un estanque de contingencia revestido tiene 900 m³ de capacidad útil y 1 500 m² de superficie. Evaporación en temporada seca: 8 mm/día.',
  table: { head: ['PARÁMETRO', 'VALOR'], rows: [['Caudal de concentrado', '58 m³/h'], ['Capacidad útil', '900 m³'], ['Área del estanque', '1 500 m²'], ['Evaporación', '8 mm/día']] },
}, [
  [1, '¿Cuál afirmación NO se sostiene?', [
    'El estanque puede recibir salmuera indefinidamente porque el agua se evapora.', 'Al evaporarse el agua, la sal permanece y se concentra en el estanque.',
    'El estanque es una medida temporal que requiere gestión del volumen y del residuo.', 'Una falla del revestimiento podría afectar el suelo o el acuífero.'], 0,
    'La evaporación (≈ 12 m³/día) es mucho menor que la entrada; además la sal no se evapora y se acumula.',
    ['', 'Se sostiene: la masa de sal se conserva.', 'Se sostiene.', 'Se sostiene.'],
    'creer que la evaporación hace desaparecer la salmuera'],
  [2, '¿En cuántas horas se llena el estanque si recibe todo el concentrado?', ['0,06 h', '15,5 h', '58 h', '52 200 h'], 1,
    '900 m³ / 58 m³/h ≈ 15,5 h.', ['Divide al revés.', '', 'Confunde caudal con tiempo.', 'Multiplica en lugar de dividir.'], 'errores de unidades', { ordered: true }],
  [3, 'Si se desvían 6 h/día de concentrado al estanque, ¿cuántos días tarda en llenarse considerando la evaporación?', ['≈ 2,7 días', '≈ 75 días', '≈ 15,5 días', 'Nunca se llena'], 0,
    'Entrada: 58 × 6 = 348 m³/día. Evaporación: 1 500 m² × 0,008 m = 12 m³/día. Neto ≈ 336 m³/día → 900/336 ≈ 2,7 días.',
    ['', 'Usa solo la evaporación.', 'Confunde días con horas.', 'Sobreestima la evaporación.'], 'sobreestimar la evaporación', { ordered: true }],
  [4, '¿Qué evaluación es más pertinente para la temporada seca?', [
    'Usar el estanque como destino final de toda la salmuera.',
    'Usarlo para desplazar descargas hacia ventanas favorables, con límites de llenado, monitoreo de fugas, manejo de la costra salina y reducción de picos de producción.',
    'Prescindir del revestimiento para que el suelo absorba la salmuera.',
    'Llenarlo al máximo cada día para evitar descargas.'], 1,
    'El almacenamiento es una herramienta temporal de gestión, con riesgos y capacidades que deben controlarse.',
    ['Se llena en pocos días.', '', 'Contamina suelo y acuífero.', 'Agota la capacidad de contingencia.'],
    'tratar el almacenamiento como solución definitiva'],
  [5, 'Diseña un plan de temporada seca transferible a otra planta.', [
    'Construir el estanque más grande posible sin otras medidas.',
    'Estimar volúmenes y balances, combinar reducción de volumen, ventanas de descarga y almacenamiento, instalar pozos de monitoreo y acordar umbrales con la comunidad.',
    'Detener la desalinización toda la temporada seca.', 'Mezclar la salmuera con agua dulce para "neutralizarla".'], 1,
    'Integra cuantificación, combinación de alternativas, monitoreo y gobernanza.',
    ['El tamaño solo no resuelve la acumulación de sal.', '', 'Elimina el servicio en la temporada de mayor necesidad.', 'La dilución no elimina la masa de sal y desperdicia agua dulce.'],
    'buscar una única medida'],
]);

ctx('RA-03-C3', 'Propuesta de valorización mineral', {
  text: 'Una empresa propone extraer sal de la salmuera (55 kg/m³ de NaCl) del caudal de concentrado de 58 m³/h durante 8 000 h/año. Supuestos del escenario: energía de cristalización 300 kWh/t, electricidad 0,15 USD/kWh, precio de venta local 30 USD/t.',
  table: { head: ['SUPUESTO', 'VALOR'], rows: [['NaCl en salmuera', '55 kg/m³'], ['Caudal', '58 m³/h'], ['Horas/año', '8 000'], ['Energía', '300 kWh/t'], ['Electricidad', '0,15 USD/kWh'], ['Precio', '30 USD/t']] },
}, [
  [1, '¿Cuál afirmación NO se sostiene?', [
    'Cualquier mineral presente en la salmuera es rentable de extraer.', 'La rentabilidad depende de energía, precio, escala y pureza.',
    'La valorización puede reducir el volumen a descargar, pero genera otros residuos.', 'Concentrar la salmuera requiere energía adicional.'], 0,
    'La presencia de un mineral no garantiza viabilidad económica ni ambiental.', ['', 'Se sostiene.', 'Se sostiene.', 'Se sostiene.'],
    'asumir que toda valorización mineral es rentable'],
  [2, '¿Cuánta sal (NaCl) contiene el concentrado en un año?', ['≈ 2 552 t', '≈ 25 520 t', '≈ 464 t', '≈ 255 200 t'], 1,
    '58 m³/h × 55 kg/m³ × 8 000 h = 25 520 000 kg ≈ 25 520 t.', ['Error de un orden de magnitud.', '', 'Omite las horas o la concentración.', 'Error de un orden de magnitud.'], 'conversión kg–t', { ordered: true }],
  [3, 'Con estos supuestos, ¿cómo se compara el costo energético por tonelada con el precio?', [
    'Costo energético 45 USD/t > precio 30 USD/t: no es rentable solo con energía.', 'Costo energético 4,5 USD/t < 30 USD/t: muy rentable.',
    'Costo energético 300 USD/t: imposible de calcular.', 'El costo energético es cero porque la sal ya está en la salmuera.'], 0,
    '300 kWh/t × 0,15 USD/kWh = 45 USD/t, mayor que el precio de 30 USD/t (sin contar otros costos).',
    ['', 'Error de un orden de magnitud.', 'Confunde kWh con USD.', 'Ignora la energía de concentración.'], 'ignorar la energía de valorización'],
  [4, '¿Qué evaluación integra mejor la propuesta?', [
    'Aprobarla porque convierte un residuo en producto.',
    'Evaluarla con energía, mercado, residuos secundarios, escala y riesgos; considerar pilotos pequeños o productos de mayor valor y mantener la gestión de descarga.',
    'Rechazar cualquier valorización por principio.', 'Aprobarla si se vende el oxígeno de la electrólisis para financiarla.'], 1,
    'Requiere un análisis multicriterio; la valorización puede ser parte de la gestión, no una solución garantizada.',
    ['Ignora costos y nuevos impactos.', '', 'Cierra opciones sin evaluar.', 'Mezcla cadenas de valor sin evidencia.'], 'confundir circularidad con viabilidad'],
  [5, '¿Qué criterio de evaluación es más transferible a otra región?', [
    'Precio internacional de la sal únicamente.',
    'Balance de masa y energía, mercado local, madurez tecnológica, impactos residuales y aceptación social, con incertidumbre declarada.',
    'Tamaño de la planta de OI únicamente.', 'Número de minerales disponibles en la salmuera.'], 1,
    'Un conjunto de criterios explícitos y verificables permite comparar propuestas en contextos distintos.',
    ['Un único criterio.', '', 'Un único criterio.', 'La presencia no es viabilidad.'], 'reducir la decisión a un número'],
]);
