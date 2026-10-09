/* =====================================================================
   22d_extras.js — Diagnósticos (20), cálculos paramétricos (15),
   tareas de diseño (15), debates argumentados (10) y catálogo de retos
   manipulativos (≥45). Escenas: NumericScene, DebateScene.
   ===================================================================== */

const DIAGNOSTICS = [
  { id: 'DX01', ra: 'RA-01', title: 'Sensor sereno, mar inquieto', prompt: 'El sensor de turbidez de la toma marca 2 NTU estable, pero el ΔP del filtro sube 0,1 bar/h y los pescadores ven agua color café. ¿Diagnóstico más probable?', options: ['El sensor está mal ubicado o ensuciado y no representa el agua captada.', 'El filtro está defectuoso de fábrica.', 'La salinidad subió y tapona el filtro.', 'El ΔP sube por la temperatura del agua.'], key: 0, why: 'Dos evidencias independientes (ΔP y observación) contradicen un sensor: se debe revisar su representatividad.' },
  { id: 'DX02', ra: 'RA-01', title: 'Peces en la rejilla', prompt: 'Tras aumentar el caudal de toma de 90 a 130 m³/h aparecen más peces juveniles atrapados. ¿Qué variable explica el cambio?', options: ['La salinidad del agua.', 'La velocidad de aproximación en la rejilla.', 'La presión de las membranas.', 'La temperatura del permeado.'], key: 1, why: 'v = Q/(3 600·A): más caudal con igual área eleva la velocidad y el arrastre de organismos.' },
  { id: 'DX03', ra: 'RA-02', title: 'Permeado cristalino, conductividad alta', prompt: 'El permeado del tren B se ve cristalino pero su conductividad pasó de 400 a 900 µS/cm en un día. ¿Qué indica?', options: ['Que el agua está perfecta porque es transparente.', 'Posible daño de membrana o sello (paso de sal), aunque no haya turbidez.', 'Que bajó la temperatura.', 'Que la recuperación disminuyó.'], key: 1, why: 'La conductividad mide sales disueltas, invisibles a simple vista; un salto brusco sugiere fuga interna.' },
  { id: 'DX04', ra: 'RA-02', title: 'Presión que no rinde', prompt: 'Para mantener 42 m³/h hubo que subir la presión de 58 a 64 bar en dos semanas, con ΔP del tren creciente. ¿Diagnóstico?', options: ['Ensuciamiento progresivo en las membranas.', 'El agua de mar se volvió menos salina.', 'La bomba produce demasiada energía.', 'La recuperación de energía mejoró.'], key: 0, why: 'Más presión para el mismo flujo y ΔP creciente son firmas del ensuciamiento.' },
  { id: 'DX05', ra: 'RA-02', title: 'Cristales en el último elemento', prompt: 'Tras subir la recuperación al 62 %, el último elemento muestra caída de flujo y depósitos blancos. ¿Causa más probable?', options: ['Ensuciamiento biológico por algas.', 'Incrustación por sobresaturación del concentrado.', 'Exceso de pretratamiento.', 'Baja presión de alimentación.'], key: 1, why: 'Más recuperación concentra el rechazo al final del tren, donde precipitan sales poco solubles.' },
  { id: 'DX06', ra: 'RA-03', title: 'Pradera que palidece', prompt: 'Una pradera marina a 300 m del difusor muestra estrés solo durante mareas llenantes. ¿Explicación más coherente?', options: ['La salinidad general del mar subió.', 'La corriente llenante transporta la pluma hacia la pradera.', 'El difusor dejó de funcionar siempre.', 'La temperatura del agua bajó.'], key: 1, why: 'La correlación con la fase de marea apunta a transporte de la pluma por la corriente.' },
  { id: 'DX07', ra: 'RA-03', title: 'Estanque que no baja', prompt: 'El estanque de contingencia sube 30 cm/día aunque la evaporación es alta. ¿Qué revisar primero?', options: ['El caudal desviado frente a la evaporación real.', 'El color del revestimiento.', 'La presión de las membranas.', 'La calidad del permeado.'], key: 0, why: 'Un balance de volumen (entrada − evaporación − fugas) explica el aumento.' },
  { id: 'DX08', ra: 'RA-04', title: 'String perezoso', prompt: 'Un string FV produce 30 % menos que sus vecinos a todas horas, incluso con cielo despejado. ¿Causa más probable?', options: ['Una nube pasajera.', 'Suciedad, sombra fija o falla de módulo en ese string.', 'La irradiancia del día.', 'La temperatura del aire, igual para todos.'], key: 1, why: 'Una pérdida persistente y localizada no se explica por factores comunes a todos los strings.' },
  { id: 'DX09', ra: 'RA-04', title: 'Mediodía tibio', prompt: 'En un día despejado y muy caluroso, la potencia FV de mediodía es 8 % menor que en un día despejado templado. ¿Por qué?', options: ['Hay menos irradiancia en días calurosos.', 'La mayor temperatura de módulo reduce la eficiencia.', 'Los inversores producen más de noche.', 'Es un error de medición necesariamente.'], key: 1, why: 'El coeficiente de temperatura negativo reduce la potencia al subir la temperatura del módulo.' },
  { id: 'DX10', ra: 'RA-04', title: 'Turbina quieta en vendaval', prompt: 'Con viento de 27 m/s la turbina 17 está detenida y la planta "pierde" generación. ¿Diagnóstico?', options: ['Falla: debería producir 8 veces más que a 13 m/s.', 'Parada de seguridad por superar el cut-out.', 'Le falta lubricación.', 'La estela de otra turbina la detuvo.'], key: 1, why: 'Sobre cut-out la turbina se detiene por diseño; no es una falla.' },
  { id: 'DX11', ra: 'RA-04', title: 'La fila trasera', prompt: 'Con viento del este, las turbinas de la fila oeste producen 25 % menos que las del este. Con viento del norte la diferencia desaparece. ¿Causa?', options: ['Efecto estela de la fila delantera.', 'Turbinas de distinto fabricante.', 'Suciedad en las aspas.', 'Error del anemómetro.'], key: 0, why: 'La dependencia con la dirección del viento es la firma del efecto estela.' },
  { id: 'DX12', ra: 'RA-05', title: 'SOC que miente', prompt: 'El indicador marca SOC 60 %, pero la batería se agota en la mitad del tiempo esperado. ¿Qué revisar?', options: ['Si cambió la capacidad (módulos fuera o degradación) que da base al SOC.', 'Si el sol salió más tarde.', 'Si el electrolizador está apagado.', 'Nada: es imposible.'], key: 0, why: 'El SOC es relativo a una capacidad: si esta bajó, la energía real es menor.' },
  { id: 'DX13', ra: 'RA-05', title: 'Ciclos fantasma', prompt: 'La batería se carga y descarga varias veces por hora mientras la generación es estable. ¿Qué indica?', options: ['Un controlador con reglas que se contradicen (ciclos ineficientes).', 'Una nube constante.', 'Exceso de capacidad instalada.', 'Que la batería es nueva.'], key: 0, why: 'Ciclar sin necesidad pierde energía en cada conversión y degrada la batería.' },
  { id: 'DX14', ra: 'RA-05', title: 'Caída al reconectar', prompt: 'Tras un apagón, al reconectar todo a la vez la red cae de nuevo. ¿Diagnóstico?', options: ['La demanda instantánea superó la potencia disponible.', 'Faltó energía en los paneles el día anterior.', 'El tanque de agua estaba lleno.', 'El SOC era 100 %.'], key: 0, why: 'La reconexión debe escalonarse según la potencia disponible.' },
  { id: 'DX15', ra: 'RA-06', title: 'Hidrógeno de noche', prompt: 'El registro muestra producción de H2 de 22 h a 4 h, sin viento, etiquetada como "verde". ¿Qué está mal?', options: ['Nada: la electrólisis siempre es verde.', 'El origen eléctrico de esas horas no es renovable; la etiqueta no se sostiene.', 'El hidrógeno nocturno es más puro.', 'La batería genera electricidad renovable.'], key: 1, why: 'El atributo depende del origen eléctrico horario y la frontera de análisis.' },
  { id: 'DX16', ra: 'RA-06', title: 'Electrolizador sediento', prompt: 'El consumo de agua del electrolizador es 3 veces el estequiométrico. ¿Explicación razonable?', options: ['Rechazo de purificación y enfriamiento evaporativo.', 'Fugas de hidrógeno.', 'El hidrógeno contiene agua líquida.', 'Error: debería ser menor que el estequiométrico.'], key: 0, why: 'El retiro real incluye purificación, enfriamiento y pérdidas.' },
  { id: 'DX17', ra: 'RA-07', title: 'Hojas verdes, raíces sedientas', prompt: 'El fríjol se ve verde, pero crece lento y los bordes de las hojas viejas amarillean. Se riega con permeado que conserva 1,1 mg/L de boro. ¿Diagnóstico?', options: ['Falta de agua por volumen insuficiente.', 'Toxicidad por boro (síntoma en bordes de hojas viejas).', 'Exceso de sombra.', 'Exceso de polinizadores.'], key: 1, why: 'El boro se acumula en los bordes de hojas viejas; el volumen no es el problema.' },
  { id: 'DX18', ra: 'RA-07', title: 'Charco persistente', prompt: 'Con agua de EC muy baja y SAR moderado, el suelo forma costra y el agua se encharca. ¿Causa?', options: ['Problema de infiltración por baja salinidad y sodio relativo.', 'Exceso de materia orgánica.', 'Falta de riego.', 'Temperatura baja.'], key: 0, why: 'Agua muy pura con SAR relativo alto dispersa arcillas y reduce la infiltración.' },
  { id: 'DX19', ra: 'RA-08', title: 'Índice perfecto, vecinos sin agua', prompt: 'El tablero marca 98/100 mientras un barrio reporta 3 días sin agua. ¿Qué revisar?', options: ['Los criterios y pesos del índice: puede excluir equidad.', 'La luminosidad de la pantalla.', 'El número de decimales.', 'Nada: el índice es objetivo.'], key: 0, why: 'Un índice agregado puede ocultar criterios con peso nulo.' },
  { id: 'DX20', ra: 'RA-09', title: 'Correlación sospechosa', prompt: 'Cada vez que aparece LIMEN, ocurre un fallo. Un vecino concluye que LIMEN causa los fallos. ¿Qué falta para sostenerlo?', options: ['Nada: la correlación prueba causalidad.', 'Secuencia temporal, mecanismo y descartar que LIMEN responda a una causa común.', 'Más fotos de LIMEN.', 'Una votación.'], key: 1, why: 'Correlación no implica causalidad: LIMEN podría anticipar el riesgo.' },
];

/* ---------- Cálculos paramétricos ---------- */
const CALCS = [
  { id: 'CA01', ra: 'RA-02', title: 'Recuperación', gen: r => { const qf = r.int(80, 160), R = r.int(35, 50) / 100, qp = Math.round(qf * R); return { text: `Qf = ${qf} m³/h, Qp = ${qp} m³/h. ¿Recuperación en %?`, ans: 100 * qp / qf, unit: '%', tol: 0.6, steps: `R = Qp/Qf = ${qp}/${qf} = ${fmt(100 * qp / qf, 1)} %` }; } },
  { id: 'CA02', ra: 'RA-02', title: 'Caudal de concentrado', gen: r => { const qf = r.int(80, 160), qp = r.int(30, 60); return { text: `Qf = ${qf} m³/h y Qp = ${qp} m³/h. ¿Qc en m³/h?`, ans: qf - qp, unit: 'm³/h', tol: 0.5, steps: `Qc = Qf − Qp = ${qf} − ${qp}` }; } },
  { id: 'CA03', ra: 'RA-02', title: 'Concentración del rechazo', gen: r => { const cf = r.int(33, 38), R = r.int(35, 55) / 100; return { text: `Cf = ${cf} g/L, R = ${fmt(R * 100, 0)} %, Cp ≈ 0. ¿Cc aproximada en g/L?`, ans: cf / (1 - R), unit: 'g/L', tol: 1, steps: `Cc ≈ Cf/(1 − R) = ${cf}/${fmt(1 - R, 2)}` }; } },
  { id: 'CA04', ra: 'RA-02', title: 'Consumo específico', gen: r => { const P = r.int(110, 200), qp = r.int(30, 55); return { text: `Potencia ${P} kW, permeado ${qp} m³/h. ¿SEC en kWh/m³?`, ans: P / qp, unit: 'kWh/m³', tol: 0.08, steps: `SEC = ${P}/${qp}` }; } },
  { id: 'CA05', ra: 'RA-01', title: 'Velocidad de aproximación', gen: r => { const q = r.int(60, 160), a = r.int(15, 40) / 100; return { text: `Q = ${q} m³/h, área efectiva ${fmt(a, 2)} m². ¿v en m/s?`, ans: q / 3600 / a, unit: 'm/s', tol: 0.006, steps: `v = ${q}/(3 600 × ${fmt(a, 2)})` }; } },
  { id: 'CA06', ra: 'RA-03', title: 'Masa de sal en exceso', gen: r => { const qc = r.int(40, 80), dc = r.int(15, 35); return { text: `Qc = ${qc} m³/h con ${dc} g/L sobre el ambiente. ¿Exceso de sal en kg/h?`, ans: qc * dc, unit: 'kg/h', tol: 2, steps: `${qc} m³/h × ${dc} kg/m³` }; } },
  { id: 'CA07', ra: 'RA-03', title: 'Llenado de estanque', gen: r => { const v = r.int(5, 15) * 100, q = r.int(40, 80); return { text: `Estanque de ${v} m³ recibe ${q} m³/h. ¿Horas hasta llenarse?`, ans: v / q, unit: 'h', tol: 0.2, steps: `${v}/${q}` }; } },
  { id: 'CA08', ra: 'RA-04', title: 'Energía FV', gen: r => { const P = r.int(200, 600), h = r.int(2, 8) / 2; return { text: `Un campo entrega ${P} kW constantes durante ${fmt(h, 1)} h. ¿Energía en kWh?`, ans: P * h, unit: 'kWh', tol: 1, steps: `E = ${P} × ${fmt(h, 1)}` }; } },
  { id: 'CA09', ra: 'RA-04', title: 'Potencia FV con pérdidas', gen: r => { const P = r.int(4, 8) * 100, G = r.int(5, 10) * 100, s = r.int(5, 20); return { text: `Pnom ${P} kW, G = ${G} W/m², suciedad ${s} % (ignora temperatura e inversor). ¿P en kW?`, ans: P * G / 1000 * (1 - s / 100), unit: 'kW', tol: 1, steps: `P = ${P}·(${G}/1000)·(1 − ${s / 100})` }; } },
  { id: 'CA10', ra: 'RA-04', title: 'Curva eólica', gen: r => { const v = r.int(5, 11); return { text: `Curva: P = 500·(v³ − 27)/1 701 kW entre 3 y 12 m/s. ¿P a ${v} m/s?`, ans: 500 * (v ** 3 - 27) / 1701, unit: 'kW', tol: 2, steps: `500·(${v ** 3} − 27)/1 701` }; } },
  { id: 'CA11', ra: 'RA-05', title: 'Energía sobre reserva', gen: r => { const cap = r.int(5, 15) * 100, soc = r.int(45, 90), res = r.int(20, 35); return { text: `Batería ${cap} kWh, SOC ${soc} %, reserva ${res} %, η descarga 0,95. ¿kWh entregables sobre la reserva?`, ans: (soc - res) / 100 * cap * 0.95, unit: 'kWh', tol: 2, steps: `(${soc} − ${res})% × ${cap} × 0,95` }; } },
  { id: 'CA12', ra: 'RA-05', title: 'Autonomía de carga crítica', gen: r => { const e = r.int(150, 500), p = r.int(40, 150); return { text: `Hay ${e} kWh disponibles y una carga crítica de ${p} kW. ¿Horas de autonomía?`, ans: e / p, unit: 'h', tol: 0.05, steps: `${e}/${p}` }; } },
  { id: 'CA13', ra: 'RA-06', title: 'Masa de H2', gen: r => { const E = r.int(10, 60) * 100, sec = r.int(50, 58); return { text: `Energía ${E} kWh al electrolizador con SEC ${sec} kWh/kg. ¿kg de H2?`, ans: E / sec, unit: 'kg', tol: 0.3, steps: `${E}/${sec}` }; } },
  { id: 'CA14', ra: 'RA-06', title: 'Agua estequiométrica', gen: r => { const m = r.int(10, 200); return { text: `¿Agua estequiométrica mínima para ${m} kg de H2? (8,94 kg/kg)`, ans: m * 8.94, unit: 'kg', tol: 2, steps: `${m} × 8,94` }; } },
  { id: 'CA15', ra: 'RA-07', title: 'Riego bruto', gen: r => { const kc = [0.95, 1.05, 1.15, 1.2][r.int(0, 3)], et0 = r.int(4, 8), eff = [0.6, 0.75, 0.9][r.int(0, 2)], a = r.int(2, 10) * 100; return { text: `Kc ${fmt(kc, 2)}, ET0 ${et0} mm/día, eficiencia ${fmt(eff, 2)}, área ${a} m². ¿m³/día brutos?`, ans: kc * et0 / eff * a / 1000, unit: 'm³/día', tol: 0.05, steps: `(${fmt(kc, 2)}×${et0}/${fmt(eff, 2)}) mm × ${a} m² / 1 000` }; } },
];

/* ---------- Tareas de diseño (se ejecutan en simuladores y misiones) ---------- */
const DESIGN_TASKS = [
  ['DS01', 'RA-08', 'Diagrama vivo del Nexo (Nivel 00)', 'Conectar agua, energía e hidrógeno sin ciclos imposibles.'],
  ['DS02', 'RA-08', 'Frontera de sistema para una comunidad pequeña (Nivel 00)', 'Elegir y justificar límites del sistema.'],
  ['DS03', 'RA-01', 'Protocolo de captación estacional (Nivel 01)', 'Diseñar reglas para temporada de floración.'],
  ['DS04', 'RA-02', 'Operación de OI con menos energía (Nivel 02)', 'Mantener calidad con potencia reducida.'],
  ['DS05', 'RA-03', 'Plan de descarga y monitoreo adaptativo (Nivel 03)', 'Combinar ventanas, difusor, almacenamiento y sensores.'],
  ['DS06', 'RA-04', 'Programación diaria de cargas flexibles (Nivel 04)', 'Asignar OI, H2 y BESS a ventanas de generación.'],
  ['DS07', 'RA-04', 'Disposición de turbinas en nuevo corredor (Nivel 05)', 'Minimizar estelas con restricciones de terreno.'],
  ['DS08', 'RA-05', 'Regla de reserva para dos días (Nivel 06)', 'Definir SOC mínimo dinámico.'],
  ['DS09', 'RA-05', 'Secuencia de arranque en negro (Nivel 06)', 'Ordenar reconexión según potencia y prioridad.'],
  ['DS10', 'RA-06', 'Programación de electrólisis con trazabilidad (Nivel 07)', 'Producir solo con excedente verificado.'],
  ['DS11', 'RA-07', 'Diseño de parcela agroecológica (Nivel 08)', 'Asociar cultivos, mezclar fuentes, cobertura y corredor.'],
  ['DS12', 'RA-09', 'Prototipo de sensor de humedad (Nivel 08)', 'Calibrar, replicar y validar.'],
  ['DS13', 'RA-08', 'Tablero Mosaico participativo (Nivel 09)', 'Criterios, pesos declarados y afectados visibles.'],
  ['DS14', 'RA-08', 'Política operativa adaptativa para la Calima (Nivel 10)', 'Construir la cuarta opción.'],
  ['DS15', 'RA-08', 'Rediseño del objetivo de MIRAGE (Nivel 10)', 'Restricciones duras, objetivos, incertidumbre y actores.'],
];

/* ---------- Debates argumentados ---------- */
const DEBATES = [
  { id: 'DB01', ra: 'RA-03', title: '¿Valorizar la salmuera?', prompt: 'Una empresa ofrece instalar cristalizadores para vender sal. ¿Qué posición defiendes ante el consejo?', positions: ['Aprobar un piloto pequeño con condiciones', 'Rechazar por ahora y priorizar la descarga bien gestionada'],
    args: [['La energía de cristalización (≈ 45 USD/t con los supuestos) supera el precio local; un piloto permite medir sin comprometer recursos.', 2], ['Convertir residuos en productos siempre es bueno.', 0], ['Las comunidades costeras deben participar en definir umbrales y riesgos del piloto.', 2], ['La sal desaparece si se cristaliza.', -1]],
    tradeoffs: ['El piloto consume energía que podría ir a agua.', 'Rechazar puede perder aprendizaje tecnológico.'] },
  { id: 'DB02', ra: 'RA-06', title: '¿Cuota fija de H2?', prompt: 'El financiador exige 120 kg/día de H2. ¿Cómo argumentas?', positions: ['Renegociar cuota flexible', 'Aceptar con respaldo de red'],
    args: [['El excedente medio solo permite ≈ 82 kg/día; una cuota fija obligaría a usar respaldo fósil o la reserva.', 2], ['El H2 es la energía del futuro y resuelve todo.', -1], ['Una cuota ligada al excedente real mantiene el atributo verde y la prioridad del agua.', 2], ['El contrato trae inversión, así que cualquier condición vale.', 0]],
    tradeoffs: ['La flexibilidad puede reducir ingresos.', 'El respaldo fósil quita el atributo verde.'] },
  { id: 'DB03', ra: 'RA-01', title: 'Toma barata o toma protectora', prompt: '¿Mantener la toma actual (barata) o mover la captación mar adentro (más cara, menos impacto)?', positions: ['Mover mar adentro por etapas', 'Mantener y mejorar rejillas'],
    args: [['Los datos del dron muestran menor turbidez y menor riesgo ecológico mar adentro.', 2], ['El costo de tubería es un criterio, pero no el único; puede compensarse con menos lavados y paradas.', 2], ['Los peces se adaptarán.', -1], ['Lo más barato siempre es lo mejor.', 0]],
    tradeoffs: ['Mayor inversión inicial.', 'Mejorar rejillas no resuelve la turbidez de los pulsos.'] },
  { id: 'DB04', ra: 'RA-04', title: 'Limpiar paneles con agua escasa', prompt: '¿Usar 2 m³ de agua para limpiar el campo FV durante la sequía?', positions: ['Limpiar solo los strings más sucios', 'No limpiar hasta que llueva'],
    args: [['La suciedad del 15 % reduce la energía diaria; limpiar los strings críticos recupera energía para producir más agua que la usada.', 2], ['Limpiar siempre es bueno.', 0], ['El agua de limpieza compite con riego y consumo: debe compararse el balance neto agua–energía.', 2], ['Los paneles se limpian solos con el viento siempre.', -1]],
    tradeoffs: ['Usa agua en temporada crítica.', 'No limpiar reduce la producción de agua.'] },
  { id: 'DB05', ra: 'RA-05', title: 'Batería para H2 o para la noche', prompt: 'MIRAGE propone vaciar la batería en el electrolizador para cumplir la cuota diaria.', positions: ['Proteger la reserva nocturna', 'Usar la batería para el H2'],
    args: [['El pronóstico indica viento débil de noche: la reserva cubre servicios esenciales.', 2], ['La batería es una fuente que genera energía.', -1], ['El H2 es flexible; la carga crítica no lo es.', 2], ['El indicador diario mejora si se vacía la batería.', 0]],
    tradeoffs: ['Menos H2 hoy.', 'Riesgo de déficit nocturno si se vacía.'] },
  { id: 'DB06', ra: 'RA-07', title: '¿Monocultivo rentable o diversidad?', prompt: 'Un comprador ofrece buen precio por tomate en toda la parcela.', positions: ['Mantener diversidad con tomate como parte', 'Sembrar solo tomate'],
    args: [['La diversidad reduce riesgos de plagas, sequía y mercado, y sostiene polinizadores.', 2], ['El rendimiento máximo es el único indicador importante.', 0], ['El banco de semillas y la cultura alimentaria local dependen de la diversidad.', 2], ['El tomate no necesita agua.', -1]],
    tradeoffs: ['Menor ingreso inmediato.', 'Más riesgo concentrado en monocultivo.'] },
  { id: 'DB07', ra: 'RA-08', title: '¿Quién decide los pesos?', prompt: 'El gemelo digital puede calcular los pesos "óptimos" automáticamente.', positions: ['Pesos deliberados con actores', 'Pesos automáticos del algoritmo'],
    args: [['Los pesos expresan valores y prioridades: no son hechos técnicos.', 2], ['El algoritmo es neutral por definición.', -1], ['Hacer visibles los pesos permite discutir quién asume los costos.', 2], ['Es más rápido dejarlo al algoritmo.', 0]],
    tradeoffs: ['La deliberación toma tiempo.', 'La automatización oculta valores.'] },
  { id: 'DB08', ra: 'RA-09', title: '¿Publicar la incertidumbre?', prompt: 'La radio prefiere un mensaje simple: "Hay agua".', positions: ['Comunicar escenarios', 'Mensaje simple'],
    args: [['Hay 30 % de probabilidad de racionamiento: conocerlo permite prepararse.', 2], ['La gente no entiende probabilidades nunca.', -1], ['Un mensaje claro con escenarios y acciones mantiene la confianza si algo cambia.', 2], ['Es más tranquilizador.', 0]],
    tradeoffs: ['Mensaje más largo.', 'Riesgo de pérdida de confianza si se oculta.'] },
  { id: 'DB09', ra: 'RA-08', title: '¿Responsabilidad o culpa?', prompt: 'El consejo busca "al culpable" del modelo defectuoso.', positions: ['Analizar la cadena de decisiones', 'Señalar un único responsable'],
    args: [['La crisis surgió de presiones de financiación, datos incompletos, decisiones técnicas y poca participación.', 2], ['Encontrar un culpable resuelve el problema.', 0], ['Asumir responsabilidades permite cambiar procesos para no repetir el error.', 2], ['La culpa es siempre de la IA.', -1]],
    tradeoffs: ['Análisis más largo.', 'Señalar a una persona oculta fallas sistémicas.'] },
  { id: 'DB10', ra: 'RA-06', title: '¿H2 en una región árida?', prompt: '¿Debe Aridia producir hidrógeno?', positions: ['Sí, condicionado a excedentes y agua no competitiva', 'No por ahora'],
    args: [['Solo con excedente renovable verificado y agua desalinizada con salmuera gestionada.', 2], ['El H2 resuelve todos los problemas energéticos.', -1], ['Debe evaluarse frente a otras opciones de almacenamiento y prioridades hídricas.', 2], ['Porque otros países lo hacen.', 0]],
    tradeoffs: ['Inversión e infraestructura de seguridad.', 'Oportunidades de exportación y almacenamiento estacional.'] },
];

/* ---------- Catálogo de retos manipulativos (implementados en niveles) ---------- */
const CHALLENGES = [];
[['00', ['Diagrama: demostración', 'Conectar flujos de agua', 'Conectar flujos de energía', 'Frontera del sistema', 'Transferencia a comunidad pequeña']],
 ['01', ['Dron: muestreo guiado', 'Elegir punto de captación', 'Gemelo de toma: práctica guiada', 'El Filtro Ciego', 'Protocolo estacional', 'Sensor bajo arena', 'La rejilla que cantaba']],
 ['02', ['Banco de OI guiado', 'Balance de caudal y sal', 'Ajuste de presión y recuperación', 'Sincronización del recuperador', 'Limpieza justificada', 'OSMORA', 'Operar con menos energía']],
 ['03', ['Pluma en miniatura', 'Trazadores de masa', 'Ventanas de descarga', 'Comparar alternativas', 'La Pluma Invisible', 'Monitoreo adaptativo']],
 ['04', ['Potencia vs energía', 'Sombras sobre strings', 'Limpieza con presupuesto de agua', 'Despacho horario', 'El Espejismo de Mediodía']],
 ['05', ['Curva de potencia', 'Anemómetros', 'Disposición y estelas', 'Ráfaga Umbral', 'Vela de Brisa']],
 ['06', ['Actualizar SOC', 'Reserva ante falla', 'Arranque en negro', 'El Devorador de Reserva']],
 ['07', ['Electrólisis guiada', 'Agua ultrapura', 'Sincronizar stacks', 'Verificar origen verde', 'La Llama que No se Ve']],
 ['08', ['Parcela guiada', 'Mezcla de fuentes', 'Programar goteo', 'La Cosecha Transparente', 'Corredor polinizador']],
 ['09', ['Escenarios del consejo', 'Soluciones dominadas', 'El Índice Único']],
 ['10', ['Fases de la Calima (9)', 'La cuarta opción']],
].forEach(([lv, list]) => list.forEach((t, i) => CHALLENGES.push({ id: 'MC' + lv + '-' + (i + 1), level: parseInt(lv), title: t })));

/* =====================================================================
   NumericScene — ejercicio de cálculo con teclado numérico pixel
   ===================================================================== */
const NumericScene = {
  overlay: true,
  enter(p) {
    this.C = p.calc; this.onDone = p.onDone; this.seed = p.seed || (Date.now() & 0xffff); this.prob = this.C.gen(RNG(this.seed));
    this.input = ''; this.fb = null; this.t0 = nowMs(); this.tries = 0;
  },
  update() {
    if (this.fb && this.fb.ok) { if (Input.pressed('confirm')) this.close(); return; }
    for (let d = 0; d <= 9; d++) if (Input.keyPressed('Digit' + d) || Input.keyPressed('Numpad' + d)) this.type(String(d));
    if (Input.keyPressed('Comma') || Input.keyPressed('Period') || Input.keyPressed('NumpadDecimal')) this.type(',');
    if (Input.keyPressed('Backspace')) this.input = this.input.slice(0, -1);
    if (Input.keyPressed('Enter') || Input.keyPressed('NumpadEnter')) this.check();
    if (Input.keyPressed('Escape')) this.close();
  },
  type(ch) { if (this.input.length < 10 && !(ch === ',' && this.input.includes(','))) { this.input += ch; Audio2.sfx('uiMove'); } },
  check() {
    const v = parseFloat(this.input.replace(',', '.'));
    if (!isFinite(v)) return;
    const ok = Math.abs(v - this.prob.ans) <= Math.max(this.prob.tol, Math.abs(this.prob.ans) * 0.01);
    this.tries++;
    this.fb = { ok, v };
    LearningModel.record({ kind: 'challenge', id: this.C.id, ra: this.C.ra, solo: 3, correct: ok, time: (nowMs() - this.t0) / 1000, retry: this.tries > 1, misconception: ok ? null : 'error de cálculo o de unidades: ' + this.C.title });
    Audio2.sfx(ok ? 'success' : 'error');
  },
  close() { Game.pop(); this.onDone && this.onDone(this.fb && this.fb.ok); },
  render(g) {
    UIK.scrim(g, 0.68);
    const x = 120, w = W - 240;
    UIK.panel(g, x, 40, w, H - 80, 'tech');
    UIK.header(g, x, 40, w, 'CÁLCULO · ' + this.C.title, 'tech', 'chart');
    const th = drawTextBlock(g, this.prob.text, x + 12, 66, w - 24, { color: UI_INK.body });
    UIK.pill(g, x + 12, Math.max(94, 68 + th), 'DATOS SIMULADOS PARA FINES EDUCATIVOS', { rim: '#ff8a7a', fill: '#3a0c1c', color: '#ffd8d0' });
    Charts.frame(g, x + 12, 110, w - 24, 22);
    drawText(g, (this.input || '_') + ((Game.frame >> 4) & 1 ? '|' : '') + '  ' + this.prob.unit, x + 20, 117, { color: '#56e5ff' });
    Gui.begin();
    const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', ',', '0', '←'];
    keys.forEach((k, i) => { if (Gui.button(g, 'k' + k, x + 12 + (i % 3) * 40, 140 + Math.floor(i / 3) * 22, 36, 18, k, { style: 'ghost' })) { if (k === '←') this.input = this.input.slice(0, -1); else this.type(k); } });
    if (Gui.button(g, 'chk', x + 140, 140, 110, 20, 'Comprobar', { style: 'good', icon: 'check', disabled: !this.input || (this.fb && this.fb.ok) })) this.check();
    if (this.fb) {
      const t = this.fb.ok ? '{g}Correcto.{/} ' + this.prob.steps + ' ≈ ' + fmt(this.prob.ans, 2) + ' ' + this.prob.unit : '{o}Revisa:{/} tu valor ' + fmt(this.fb.v, 2) + ' no coincide. Pista: ' + this.prob.steps.split('=')[0] + '… revisa unidades.';
      UIK.panel(g, x + 136, 164, w - 148, Math.min(H - 110 - 164, textHeight(t, w - 164) + 12), this.fb.ok ? 'green' : 'alert', null, { chamfer: 2, key: false, spark: false });
      drawTextBlock(g, t, x + 142, 170, w - 160, { color: this.fb.ok ? '#eafff6' : '#ffe8e4' });
    }
    if (Gui.button(g, 'cls', x + w - 92, H - 66, 80, 18, this.fb && this.fb.ok ? 'Continuar' : 'Cerrar', { style: this.fb && this.fb.ok ? 'good' : 'ghost' })) this.close();
    Gui.end();
  },
};

/* =====================================================================
   DebateScene — posición + argumento con evidencia + reconocer trade-off
   ===================================================================== */
const DebateScene = {
  overlay: true,
  enter(p) { this.D = p.debate; this.onDone = p.onDone; this.step = 0; this.pos = -1; this.arg = -1; this.trade = -1; this.score = 0; this.t0 = nowMs(); this.order = RNG(this.D.id.length * 97).shuffle(this.D.args.map((_, i) => i)); },
  update() { },
  render(g) {
    const D = this.D;
    UIK.scrim(g, 0.7);
    const x = 40, w = W - 80;
    UIK.panel(g, x, 20, w, H - 40, 'tech');
    UIK.header(g, x, 20, w, 'DEBATE ARGUMENTADO · ' + D.title, 'tech', 'scale');
    let y = 44;
    y += drawTextBlock(g, D.prompt, x + 12, y, w - 24, { color: '#d5dcf5' }) + 6;
    Gui.begin();
    if (this.step === 0) {
      drawText(g, '1. Elige tu posición (no hay una única correcta; se evalúa tu argumentación):', x + 12, y, { color: '#ffd23a' }); y += 14;
      D.positions.forEach((ps, i) => { const r = Gui.choice(g, 'p' + i, x + 12, y, w - 24, ps, 'ABCDEF'[i], {}); if (r.clicked) { this.pos = i; this.step = 1; } y += r.h + 3; });
    } else if (this.step === 1) {
      y += drawTextBlock(g, '{c}Posición:{/} ' + D.positions[this.pos] + '. {y}2. ¿Qué argumento la sostiene MEJOR con evidencia?{/}', x + 12, y, w - 24, { color: UI_INK.body }) + 3;
      this.order.forEach((k, i) => { const r = Gui.choice(g, 'a' + i, x + 12, y, w - 24, D.args[k][0], 'ABCD'[i], {}); if (r.clicked) { this.arg = k; this.step = 2; } y += r.h + 2; });
    } else if (this.step === 2) {
      drawText(g, '3. ¿Qué costo o compromiso reconoces de tu posición?', x + 12, y, { color: '#ffd23a' }); y += 14;
      D.tradeoffs.forEach((t, i) => { const r = Gui.choice(g, 't' + i, x + 12, y, w - 24, t, 'ABCDEF'[i], {}); if (r.clicked) { this.trade = i; this.step = 3; this.evaluate(); } y += r.h + 3; });
      if (Gui.button(g, 'tn', x + 12, y + 2, w - 24, 18, 'Mi posición no tiene costos', { style: 'danger', align: 'left' })) { this.trade = -1; this.step = 3; this.evaluate(); }
    } else {
      const q = D.args[this.arg][1];
      const t = (q === 2 ? '{g}Argumento basado en evidencia y relaciones del sistema.{/} ' : q === 0 ? '{y}Argumento débil:{/} apela a un valor o a una generalización sin datos. ' : '{o}Argumento con un error conceptual.{/} ') + (this.trade >= 0 ? '{g}Reconociste un compromiso:{/} eso hace tu posición discutible y honesta.' : '{o}Toda decisión en el Nexo tiene costos:{/} nombrarlos permite negociarlos.');
      const fh = textHeight(t, w - 48) + 12;
      UIK.panel(g, x + 12, y, w - 24, fh, q === 2 && this.trade >= 0 ? 'green' : q < 0 ? 'alert' : 'sheet', null, { chamfer: 2, key: false, spark: false });
      drawTextBlock(g, t, x + 20, y + 6, w - 40, { color: UI_INK.body }); y += fh + 8;
      if (Gui.button(g, 'ok', x + w / 2 - 60, H - 52, 120, 20, 'Continuar', { style: 'good' })) { Game.pop(); this.onDone && this.onDone(this.score >= 2); }
    }
    Gui.end();
  },
  evaluate() {
    const q = this.D.args[this.arg][1];
    this.score = (q === 2 ? 2 : q === 0 ? 1 : 0) + (this.trade >= 0 ? 1 : 0);
    LearningModel.record({ kind: 'challenge', id: this.D.id, ra: this.D.ra, concepts: ['ethics', 'communication', 'multiobjective'], solo: 4, correct: this.score >= 3, time: (nowMs() - this.t0) / 1000, misconception: q < 0 ? 'argumento con error conceptual: ' + this.D.title : null });
    Audio2.sfx(this.score >= 3 ? 'success' : 'soft');
  },
};
