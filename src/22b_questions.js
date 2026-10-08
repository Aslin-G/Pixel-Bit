/* =====================================================================
   22b_questions.js — Banco SOLO (parte 2): RA-04, RA-05, RA-06
   ===================================================================== */

/* ============================== RA-04 ============================== */
ctx('RA-04-C1', 'Día con polvo y nubes', {
  text: 'Potencia de un campo FV de 600 kW nominales en un día despejado y en un día con polvo y nubes. Energía diaria: despejado ≈ 3 925 kWh; con polvo y nubes ≈ 2 500 kWh.',
  table: { head: ['HORA', '8', '10', '12', '14', '16'], rows: [['DESPEJADO (KW)', '210', '480', '585', '480', '210'], ['POLVO+NUBES (KW)', '150', '140', '450', '390', '150']] },
  chart: { series: [{ data: [[6, 0], [7, 60], [8, 210], [9, 360], [10, 480], [11, 560], [12, 585], [13, 560], [14, 480], [15, 360], [16, 210], [17, 60], [18, 0]], color: '#ffe14d', label: 'despejado' }, { data: [[6, 0], [7, 45], [8, 150], [9, 250], [10, 140], [11, 420], [12, 450], [13, 180], [14, 390], [15, 280], [16, 150], [17, 45], [18, 0]], color: '#ff9f43', label: 'polvo+nubes' }], opts: { xMin: 6, xMax: 18, yMin: 0, yMax: 650, legend: true, xLabel: 'h', yLabel: 'kW' } },
  trigger: 'lv04_puerta',
}, [
  [1, '¿Cuál conclusión NO se sostiene?', [
    'Como el pico del día con nubes fue 450 kW, la energía diaria fue casi la misma que en el día despejado.',
    'Las caídas bruscas a las 10 y 13 h son coherentes con nubes pasajeras.', 'La energía diaria corresponde al área bajo la curva de potencia.',
    'La potencia es nula de noche en ambos días.'], 0,
    'El pico no determina la energía: 2 500 kWh frente a 3 925 kWh (≈ 64 %).', ['', 'Se sostiene.', 'Se sostiene.', 'Se sostiene.'], 'confundir potencia pico con energía diaria'],
  [2, 'Si el campo entrega 560 kW durante 1,5 h, ¿cuánta energía produce?', ['373 kWh', '560 kWh', '840 kW', '840 kWh'], 3,
    'E = P × t = 560 kW × 1,5 h = 840 kWh. La unidad de energía es kWh, no kW.', ['Divide en lugar de multiplicar.', 'Ignora el tiempo.', 'Unidad incorrecta: kW es potencia.', ''], 'confundir kW y kWh', { ordered: true }],
  [3, '¿Qué fracción de la energía del día despejado se obtuvo el día con polvo y nubes?', ['≈ 36 %', '≈ 64 %', '≈ 77 %', '≈ 157 %'], 1,
    '2 500 / 3 925 ≈ 0,64.', ['Es la pérdida, no la fracción obtenida.', '', 'Compara los picos (450/585).', 'Invierte la razón.'], 'comparar picos en lugar de energías', { ordered: true }],
  [4, 'Con el pronóstico del día con polvo y nubes, ¿qué programación integra mejor energía y agua?', [
    'Operar la OI a plena carga desde las 6 h aunque no haya generación.',
    'Concentrar la OI en las ventanas de mayor generación, reservar batería para la noche, evaluar si el polvo justifica limpiar con poca agua y desplazar el electrolizador.',
    'Usar el pico de 450 kW como dato de diseño para todo el día.', 'Apagar la OI todo el día.'], 1,
    'Ajusta las cargas flexibles a la energía disponible, protege la reserva y distingue suciedad (corregible) de nubes (transitorias).',
    ['Sin generación consume batería crítica.', '', 'El pico es transitorio.', 'Pierde producción posible.'], 'diseñar con el pico'],
  [5, 'Planifica la energía de un día completo en una estación con menor irradiancia y noches más largas. ¿Qué enfoque es más robusto?', [
    'Planificar con el promedio anual de potencia pico.', 'Calcular energía horaria esperada con banda de incertidumbre, dimensionar reserva nocturna y asignar cargas flexibles a ventanas probables.',
    'Instalar más paneles sin cambiar la operación.', 'Suponer que la eólica compensará exactamente el déficit.'], 1,
    'Combina balance de energía (no de potencia), incertidumbre y flexibilidad.', ['Mezcla potencia pico con energía y estación.', '', 'Ayuda, pero no gestiona la noche ni la variabilidad.', 'La complementariedad no es exacta.'], 'planificar con picos y promedios'],
]);

ctx('RA-04-C2', 'Corredor eólico con estelas', {
  text: 'Turbinas con curva por tramos: cut-in 3 m/s, nominal 12 m/s (500 kW), cut-out 25 m/s. En la región parcial: P = 500 · (v³ − 27)/(1 728 − 27) kW. Déficit de estela simplificado: 26 % a 3 diámetros (3D) y 13 % a 7D. Viento libre: 10 m/s.',
  table: { head: ['V (M/S)', '3', '6', '8', '10', '12', '20', '26'], rows: [['P (KW)', '0', '56', '143', '286', '500', '500', '0']] },
}, [
  [1, '¿Cuál conclusión NO se sostiene?', ['Colocar turbinas más juntas siempre aumenta la producción total del parque.', 'La turbina aguas abajo recibe menos viento por la estela.', 'Sobre 12 m/s la potencia queda limitada a la nominal.', 'Sobre 25 m/s la turbina se detiene por seguridad.'], 0,
    'Más cerca implica más déficit de estela; la producción por turbina cae y puede bajar el total para el mismo terreno.', ['', 'Se sostiene.', 'Se sostiene.', 'Se sostiene.'], 'ignorar estelas'],
  [2, '¿Qué potencia entrega una turbina a 8 m/s según la curva?', ['≈ 143 kW', '≈ 296 kW', '500 kW', '0 kW'], 0,
    '500 × (512 − 27)/1 701 ≈ 143 kW.', ['', 'Supone proporcionalidad lineal (8/12 × 500 − …).', 'Supone nominal en toda velocidad.', '8 m/s supera el cut-in.'], 'suponer relación lineal o constante', { ordered: true }],
  [3, 'Dos turbinas en fila con 10 m/s libres: ¿cuál comparación es correcta? (A 3D la segunda recibe 7,4 m/s; a 7D, 8,7 m/s.)', [
    'A 3D: ≈ 286 + 111 = 397 kW; a 7D: ≈ 286 + 186 = 472 kW.', 'A 3D y 7D producen lo mismo: 572 kW.', 'A 3D: 572 kW; a 7D: 286 kW.', 'A 3D: ≈ 286 + 230 = 516 kW; a 7D: ≈ 400 kW.'], 0,
    'Con la curva: P(10) ≈ 286 kW; P(7,4) ≈ 111 kW; P(8,7) ≈ 186 kW.', ['', 'Ignora la estela.', 'Invierte el efecto.', 'Valores sin relación con la curva.'], 'ignorar estelas en el cálculo'],
  [4, 'El terreno solo permite 4 turbinas en una franja alineada con el viento dominante. ¿Qué decisión integra mejor producción y restricciones?', [
    'Ponerlas juntas a 3D para ahorrar cable.', 'Escalonarlas en dos filas o separarlas a ≥ 7D en la dirección dominante, aunque aumente el costo de cableado.',
    'Orientarlas al azar.', 'Instalar solo una turbina para evitar estelas.'], 1,
    'Reduce pérdidas por estela respetando el terreno; el costo adicional se compara con la producción ganada.', ['Aumenta pérdidas por estela.', '', 'Sin criterio.', 'Pierde producción innecesariamente.'], 'optimizar un solo costo'],
  [5, 'Para un nuevo corredor con dos direcciones de viento dominantes, ¿qué enfoque es más transferible?', [
    'Copiar la separación de Aridia.', 'Usar la rosa de vientos local, modelar estelas para ambas direcciones, comparar disposiciones y validar con mediciones de anemómetros.',
    'Usar v³ para estimar la producción a cualquier velocidad.', 'Ubicar las turbinas donde el viento sea máximo, sin considerar cut-out.'], 1,
    'Transfiere el método de análisis a las condiciones del nuevo sitio.', ['Las direcciones cambian.', '', 'v³ no aplica sobre nominal ni sobre cut-out.', 'Más viento no siempre es mejor.'], 'extrapolar sin límites'],
]);

ctx('RA-04-C3', 'Despacho híbrido con error de pronóstico', {
  text: 'Pronóstico de generación renovable para la tarde: 700 kW con banda de ± 150 kW. Cargas: servicios esenciales 180 kW, OI 220 kW, riego 80 kW. Electrolizador flexible hasta 300 kW.',
  table: { head: ['ESCENARIO', 'GENERACIÓN', 'CARGAS FIJAS', 'EXCEDENTE'], rows: [['Optimista', '850 kW', '480 kW', '370 kW'], ['Esperado', '700 kW', '480 kW', '220 kW'], ['Pesimista', '550 kW', '480 kW', '70 kW']] },
}, [
  [1, '¿Cuál afirmación NO se sostiene?', ['El pronóstico promedio basta para decidir la batería sin ningún margen.', 'El excedente disponible para el electrolizador depende del escenario.', 'En el escenario pesimista el excedente es pequeño.', 'La banda expresa incertidumbre del pronóstico.'], 0,
    'Decidir solo con el promedio ignora la posibilidad del escenario pesimista.', ['', 'Se sostiene.', 'Se sostiene.', 'Se sostiene.'], 'ignorar la incertidumbre del pronóstico'],
  [2, '¿Cuál carga es explícitamente flexible?', ['Servicios esenciales', 'Electrolizador', 'Comunicaciones de emergencia', 'Sistema de seguridad'], 1,
    'El electrolizador puede modularse o detenerse sin afectar servicios esenciales.', ['Es crítica.', '', 'Es crítica.', 'Es crítica.'], 'confundir cargas críticas y flexibles'],
  [3, 'Si el electrolizador se programa a 220 kW (excedente esperado) y ocurre el escenario pesimista, ¿cuál es el déficit?', ['0 kW', '70 kW', '150 kW', '220 kW'], 2,
    'Pesimista: excedente 70 kW. Demanda del electrolizador 220 kW → déficit 150 kW, que caería sobre la batería o cargas.', ['Ignora el escenario pesimista.', 'Es el excedente, no el déficit.', '', 'Es la demanda completa.'], 'confundir excedente y déficit', { ordered: true }],
  [4, '¿Qué regla de despacho conecta mejor pronóstico, reserva y prioridades?', [
    'Programar el electrolizador a 300 kW y usar la batería si falta.', 'Asegurar cargas esenciales y OI con el escenario pesimista, operar el electrolizador solo con excedente confirmado y mantener la reserva.',
    'Apagar la OI para garantizar H2.', 'Usar el escenario optimista para todas las cargas.'], 1,
    'Las decisiones críticas usan el escenario conservador; las flexibles siguen el excedente real.', ['Agota reserva por una carga flexible.', '', 'Sacrifica agua por H2.', 'Riesgo alto de déficit.'], 'priorizar la carga flexible'],
  [5, '¿Qué mejora hace más transferible el despacho a otras temporadas?', [
    'Una regla fija basada solo en la hora del día.', 'Usar pronósticos probabilísticos (p. ej., p10 para decisiones críticas), reglas de prioridad declaradas y revisión con datos reales.',
    'Maximizar siempre el H2.', 'Eliminar la batería para simplificar.'], 1,
    'Incorpora incertidumbre, prioridades y aprendizaje continuo.', ['Ignora clima y estación.', '', 'Prioriza mal.', 'Pierde flexibilidad.'], 'reglas fijas en sistemas variables'],
]);

/* ============================== RA-05 ============================== */
ctx('RA-05-C1', 'Noche con reserva mínima', {
  text: 'Batería: 1 000 kWh de capacidad, 250 kW de potencia máxima, SOC actual 55 %, reserva mínima 30 %, eficiencia de descarga 0,95. Se esperan 12 h de noche con viento débil. Carga crítica: 60 kW.',
  table: { head: ['PARÁMETRO', 'VALOR'], rows: [['Capacidad', '1 000 kWh'], ['Potencia máx.', '250 kW'], ['SOC', '55 %'], ['Reserva', '30 %'], ['η descarga', '0,95'], ['Carga crítica', '60 kW']] },
  trigger: 'lv06_puerta',
}, [
  [1, '¿Cuál afirmación NO se sostiene?', ['Como la batería tiene 250 kW, puede suministrar 250 kW durante toda la noche.', 'La batería almacena energía; no la genera.', 'La potencia máxima limita qué tan rápido puede entregar energía.', 'La reserva protege servicios ante eventos inciertos.'], 0,
    '250 kW durante 12 h serían 3 000 kWh; la batería solo tiene 1 000 kWh de capacidad total.', ['', 'Se sostiene.', 'Se sostiene.', 'Se sostiene.'], 'confundir potencia y capacidad'],
  [2, '¿Cuánta energía se puede entregar por encima de la reserva?', ['25 kWh', '237,5 kWh', '250 kWh', '550 kWh'], 1,
    '(0,55 − 0,30) × 1 000 kWh × 0,95 = 237,5 kWh.', ['Error de escala.', '', 'Ignora la eficiencia.', 'Ignora la reserva.'], 'ignorar reserva o pérdidas', { ordered: true }],
  [3, '¿Cuántas horas puede cubrir la carga crítica solo con la energía sobre la reserva?', ['≈ 1 h', '≈ 4 h', '≈ 9 h', '12 h'], 1,
    '237,5 kWh / 60 kW ≈ 3,96 h.', ['Error de cálculo.', '', 'Usa 550 kWh.', 'Supone suficiente energía.'], 'confundir kWh y horas', { ordered: true }],
  [4, 'Con 12 h de noche y viento débil, ¿qué estrategia es más pertinente?', [
    'Usar toda la batería en las primeras horas para maximizar el H2.', 'Reservar la batería para la carga crítica, posponer cargas flexibles, y usar la reserva solo para servicios esenciales si el viento no llega.',
    'Ignorar el pronóstico y operar normalmente.', 'Desconectar la carga crítica para proteger la batería.'], 1,
    'Prioriza servicios esenciales, gestiona la incertidumbre y evita gastar la reserva en cargas flexibles.', ['Agota reserva en una carga flexible.', '', 'Ignora el riesgo.', 'La reserva existe precisamente para la carga crítica.'], 'usar la reserva para beneficios inmediatos'],
  [5, 'Diseña una regla robusta para dos días con pronóstico incierto.', [
    'Descargar siempre hasta el mínimo físico cada noche.', 'Fijar una reserva dinámica según pronóstico (p10), cargar con excedente diurno, modular cargas flexibles y revisar la regla con datos reales.',
    'Mantener la batería siempre al 100 % sin usarla.', 'Decidir con el pronóstico promedio.'], 1,
    'Una reserva dinámica equilibra el uso de la energía y la resiliencia ante escenarios desfavorables.', ['Deja sin respaldo ante eventos.', '', 'Desaprovecha el almacenamiento y acelera el envejecimiento a SOC alto.', 'Ignora la incertidumbre.'], 'reglas estáticas'],
]);

ctx('RA-05-C2', 'Falla de un módulo BESS', {
  text: 'La batería tiene 4 módulos iguales (1 000 kWh y 250 kW en total). Falla un módulo y queda aislado. El indicador sigue mostrando "SOC 60 %" de los módulos restantes. Reserva mínima: 30 %. Eficiencia de descarga: 0,95.',
  table: { head: ['ESTADO', 'CAPACIDAD', 'POTENCIA'], rows: [['Normal', '1 000 kWh', '250 kW'], ['1 módulo fuera', '750 kWh', '187,5 kW']] },
}, [
  [1, '¿Cuál afirmación NO se sostiene?', ['Si el SOC sigue en 60 %, la energía disponible es la misma que antes de la falla.', 'La potencia máxima disponible disminuyó.', 'La capacidad útil disminuyó.', 'Las cargas deben revisarse ante la nueva potencia.'], 0,
    'El 60 % ahora es de 750 kWh (450 kWh), no de 1 000 kWh (600 kWh).', ['', 'Se sostiene: 187,5 kW.', 'Se sostiene.', 'Se sostiene.'], 'interpretar el SOC sin la capacidad'],
  [2, '¿Cuánta energía almacenada hay ahora con SOC 60 %?', ['250 kWh', '450 kWh', '600 kWh', '750 kWh'], 1,
    '0,60 × 750 kWh = 450 kWh.', ['Usa la capacidad del módulo perdido.', '', 'Usa la capacidad anterior.', 'Supone batería llena.'], 'interpretar el SOC sin la capacidad', { ordered: true }],
  [3, '¿Durante cuántas horas puede abastecer 150 kW hasta llegar a la reserva?', ['≈ 1,4 h', '≈ 2,8 h', '≈ 3 h', '≈ 5 h'], 0,
    '(0,60 − 0,30) × 750 × 0,95 / 150 ≈ 1,43 h.', ['', 'Ignora la reserva.', 'Usa la capacidad anterior sin pérdidas.', 'Error de escala.'], 'ignorar reserva y pérdidas', { ordered: true }],
  [4, 'Antes de la falla, la OI (220 kW) y los servicios esenciales (120 kW) se apoyaban en la batería de noche. ¿Qué evaluación es correcta ahora?', [
    'Nada cambia: la batería sigue igual.', 'La potencia (187,5 kW) ya no cubre ambas cargas: hay que priorizar servicios esenciales y reprogramar la OI a horas con generación.',
    'Conviene apagar los servicios esenciales para operar la OI.', 'Basta con subir el SOC para recuperar la potencia perdida.'], 1,
    'La potencia y la capacidad limitan juntas; hay que replanificar prioridades y horarios.', ['Ignora la falla.', '', 'Prioriza mal.', 'El SOC no aumenta la potencia máxima.'], 'confundir potencia y energía'],
  [5, '¿Qué diseño hace a la microred más resiliente ante fallas de módulos?', [
    'Un único módulo grande para simplificar.', 'Redundancia N+1, operación modular, mantenimiento predictivo, priorización de cargas y procedimientos de arranque por etapas.',
    'Operar siempre a potencia máxima.', 'Eliminar la reserva para tener más energía útil.'], 1,
    'La redundancia y la operación por prioridades conservan funciones esenciales ante fallas.', ['Un punto único de falla.', '', 'Acelera el desgaste.', 'Reduce la resiliencia.'], 'diseñar sin redundancia'],
]);

ctx('RA-05-C3', 'Recuperación de la microred después de un apagón', {
  text: 'Tras un apagón, la batería (600 kWh al 40 %, potencia máx. 200 kW) y el campo FV (250 kW disponibles a mediodía) deben reconectar cargas: servicios críticos 120 kW, bombeo de agua potable 80 kW, OI 220 kW, riego 80 kW, electrolizador 300 kW.',
  table: { head: ['CARGA', 'POTENCIA', 'TIPO'], rows: [['Servicios críticos', '120 kW', 'crítica'], ['Bombeo potable', '80 kW', 'esencial'], ['OI', '220 kW', 'importante'], ['Riego', '80 kW', 'flexible'], ['Electrolizador', '300 kW', 'flexible']] },
}, [
  [1, '¿Cuál afirmación NO se sostiene?', ['Reconectar todas las cargas a la vez acelera la recuperación.', 'La potencia disponible limita cuántas cargas pueden conectarse.', 'Conviene energizar primero una fuente estable.', 'Las cargas críticas tienen prioridad.'], 0,
    'Conectar todo a la vez supera la potencia disponible (880 kW > 450 kW) y provoca otra caída.', ['', 'Se sostiene.', 'Se sostiene.', 'Se sostiene.'], 'reconectar todo a la vez'],
  [2, '¿Qué carga debe reconectarse primero?', ['Electrolizador', 'Riego', 'Servicios críticos', 'OI'], 2,
    'Los servicios críticos garantizan salud, seguridad y comunicaciones.', ['Es flexible.', 'Es flexible.', '', 'Es importante, pero no la primera.'], 'priorizar cargas flexibles'],
  [3, 'Con 450 kW disponibles (FV + batería), ¿qué conjunto puede operar sin exceder la potencia?', ['Críticos + bombeo + OI', 'Críticos + bombeo + OI + riego', 'Críticos + electrolizador + riego', 'Todas las cargas'], 0,
    '120 + 80 + 220 = 420 kW ≤ 450 kW. Añadir riego da 500 kW.', ['', '500 kW > 450 kW.', 'Prioriza mal y suma 500 kW.', '880 kW.'], 'sumar mal las potencias', { ordered: true }],
  [4, '¿Qué secuencia de reconexión integra mejor prioridades, potencia y energía?', [
    'Electrolizador → OI → críticos.', 'Batería estable → críticos → bombeo potable → OI (si hay sol) → riego → electrolizador solo con excedente.',
    'Todo a la vez y luego desconectar lo que falle.', 'OI → riego → críticos.'], 1,
    'Escalona según prioridad y potencia, y condiciona las cargas flexibles al excedente.', ['Invierte prioridades.', '', 'Provoca nuevas caídas.', 'Prioriza mal.'], 'desconocer prioridades'],
  [5, 'Diseña un protocolo de arranque en negro para la noche (sin FV).', [
    'Usar el mismo protocolo del mediodía.', 'Limitar la reconexión a lo que la batería y la eólica sostienen, priorizar críticos y bombeo, posponer OI y flexibles, y definir umbrales de SOC para cada etapa.',
    'Esperar al amanecer sin reconectar nada.', 'Reconectar primero el electrolizador para generar H2 de respaldo.'], 1,
    'Adapta el protocolo a las fuentes disponibles y fija umbrales explícitos por etapa.', ['No considera la ausencia de FV.', '', 'Deja sin servicios críticos.', 'El H2 no es una fuente: consumiría energía escasa.'], 'olvidar que el H2 es vector'],
]);

/* ============================== RA-06 ============================== */
ctx('RA-06-C1', 'Electrólisis con excedente renovable', {
  text: 'Entre las 10 y las 16 h hay excedente renovable que puede ir al electrolizador. SEC del sistema: 55 kWh/kg H2 (supuesto, coherente con rangos reportados). Agua estequiométrica ≈ 8,94 kg/kg H2. La purificación rechaza 35 % del agua de entrada.',
  table: { head: ['HORA', '10', '11', '12', '13', '14', '15', '16'], rows: [['EXCEDENTE KWH', '120', '260', '330', '360', '310', '220', '90']] },
  trigger: 'lv07_puerta', src: 'Rangos de SEC: U.S. DOE (Hydrogen Shot, 2024); IRENA (2024). Estequiometría. Datos horarios simulados.',
}, [
  [1, '¿Cuál afirmación NO se sostiene?', ['El hidrógeno producido es una nueva fuente primaria de energía.', 'La producción de H2 está limitada por la energía disponible.', 'Además de electricidad, la electrólisis requiere agua purificada.', 'Parte de la energía se pierde en la conversión.'], 0,
    'El H2 es un vector: almacena energía producida con otra fuente.', ['', 'Se sostiene.', 'Se sostiene.', 'Se sostiene.'], 'confundir vector con fuente'],
  [2, '¿Cuánto H2 se produce con todo el excedente (1 690 kWh)?', ['≈ 3,1 kg', '≈ 30,7 kg', '1 690 kg', '≈ 92 950 kg'], 1,
    '1 690 kWh / 55 kWh/kg ≈ 30,7 kg.', ['Error de escala.', '', 'Confunde kWh con kg.', 'Multiplica en lugar de dividir.'], 'confundir energía y masa', { ordered: true }],
  [3, '¿Qué combinación de agua es correcta para 30,7 kg de H2?', ['Mínimo estequiométrico ≈ 274 kg; con purificación ≈ 422 kg de agua de entrada.', 'Mínimo ≈ 30,7 kg; con purificación ≈ 47 kg.', 'Mínimo ≈ 274 kg; con purificación ≈ 178 kg.', 'No se requiere agua porque el H2 es un gas.'], 0,
    '30,7 × 8,94 ≈ 274 kg; con 35 % de rechazo: 274 / 0,65 ≈ 422 kg.', ['', 'Confunde masa de H2 con masa de agua.', 'Multiplica por 0,65 en lugar de dividir.', 'La electrólisis consume agua.'], 'ignorar el agua de proceso'],
  [4, '¿Qué programación integra mejor energía, agua y servicios?', [
    'Operar el electrolizador a plena carga todo el día, con batería si falta.', 'Operarlo solo con excedente, respetando su carga mínima, usando agua tratada que no compita con el agua esencial y registrando el origen eléctrico.',
    'Priorizar el H2 sobre el tanque de agua potable.', 'Apagarlo siempre para ahorrar agua.'], 1,
    'Acopla el H2 al excedente renovable real, protege el agua esencial y permite trazabilidad.', ['Consume reserva y puede usar electricidad no renovable.', '', 'Prioriza mal.', 'Desaprovecha excedentes que se perderían.'], 'mantener H2 a toda costa'],
  [5, 'En otra región con menos excedente y mayor estrés hídrico, ¿qué evaluación es más transferible?', [
    'Replicar el mismo electrolizador.', 'Dimensionar según horas de excedente y agua disponible, evaluar costos nivelados, impactos hídricos y prioridades comunitarias antes de decidir.',
    'Maximizar H2 porque es energía limpia.', 'Usar electricidad de cualquier origen para mantener la producción.'], 1,
    'La evaluación considera energía, agua, costos y gobernanza del nuevo contexto.', ['Ignora el contexto.', '', 'El H2 no es solución universal.', 'Pierde el atributo renovable.'], 'presentar el H2 como solución universal'],
]);

ctx('RA-06-C2', 'Producción en región con estrés hídrico', {
  text: 'Un proyecto quiere producir 100 kg de H2 por día. Agua estequiométrica ≈ 8,94 kg/kg; la purificación rechaza 35 %; el enfriamiento evaporativo consume 15 kg/kg H2 (supuesto). Consumo doméstico de referencia: 50 L por persona por día (supuesto de escenario).',
  table: { head: ['CONCEPTO', 'VALOR'], rows: [['H2 diario', '100 kg'], ['Estequiometría', '8,94 kg/kg'], ['Rechazo purificación', '35 %'], ['Enfriamiento', '15 kg/kg'], ['Consumo doméstico', '50 L/pers./día']] },
  src: 'IRENA y Bluerisk (2023), Water for hydrogen production. Valores del escenario: simulados.',
}, [
  [1, '¿Cuál afirmación NO se sostiene?', ['El agua para hidrógeno es despreciable en cualquier contexto.', 'El retiro real de agua supera el mínimo estequiométrico.', 'El enfriamiento puede ser un consumo importante.', 'El impacto depende de la disponibilidad local de agua.'], 0,
    'En regiones áridas el agua de proceso puede competir con otros usos.', ['', 'Se sostiene.', 'Se sostiene.', 'Se sostiene.'], 'ignorar el agua de proceso'],
  [2, '¿Cuál es el agua estequiométrica mínima para 100 kg de H2?', ['8,94 kg', '100 kg', '894 kg', '89 400 kg'], 2,
    '100 × 8,94 = 894 kg (≈ 0,9 m³).', ['Es por kg de H2.', 'Confunde masas.', '', 'Error de escala.'], 'errores de escala', { ordered: true }],
  [3, '¿Cuál es el retiro total diario aproximado con purificación y enfriamiento?', ['≈ 0,9 m³', '≈ 1,4 m³', '≈ 2,9 m³', '≈ 15 m³'], 2,
    'Purificación: 894/0,65 ≈ 1 375 kg; enfriamiento: 15 × 100 = 1 500 kg; total ≈ 2 875 kg ≈ 2,9 m³.', ['Solo estequiometría.', 'Omite el enfriamiento.', '', 'Error de escala.'], 'omitir componentes del balance', { ordered: true }],
  [4, 'El retiro equivale al consumo doméstico de unas 58 personas. ¿Qué evaluación es más pertinente?', [
    'Es poco en términos absolutos: no requiere discusión.', 'Debe evaluarse frente a la disponibilidad local, transparentarse con la comunidad y priorizar agua esencial, considerando enfriamiento seco y fuentes no competitivas.',
    'Debe prohibirse cualquier producción de H2.', 'Se resuelve vendiendo el oxígeno.'], 1,
    'El impacto relativo depende del contexto y requiere gobernanza y alternativas técnicas.', ['Ignora el contexto de escasez.', '', 'Cierra opciones sin análisis.', 'El oxígeno no es un ingreso garantizado ni resuelve el agua.'], 'ignorar contexto y gobernanza'],
  [5, '¿Qué estrategia de abastecimiento de agua es más sostenible y transferible?', [
    'Extraer agua del acuífero local sin límites.', 'Usar agua desalinizada con gestión de salmuera, enfriamiento seco o híbrido, medición del retiro y acuerdos de prioridad con usuarios.',
    'Usar agua potable de la red porque ya está tratada.', 'Ignorar el agua y enfocarse en la electricidad.'], 1,
    'Reduce la competencia por el agua, gestiona impactos y deja trazabilidad.', ['Riesgo de sobreexplotación.', '', 'Compite con el consumo humano.', 'Omite una restricción clave.'], 'omitir restricciones hídricas'],
]);

ctx('RA-06-C3', 'Evento de seguridad y parada', {
  text: 'En la sala de electrólisis, un detector reporta H2 en aumento: 6 % del límite inferior de inflamabilidad (LEL) a las 10:00, 14 % a las 10:02. Alarma del escenario: 10 % LEL. La ventilación forzada está apagada por mantenimiento. (Representación conceptual; no son instrucciones operativas.)',
  table: { head: ['HORA', 'H2 (% LEL)', 'VENTILACIÓN'], rows: [['10:00', '6', 'apagada'], ['10:02', '14', 'apagada']] },
  src: 'U.S. DOE, Hydrogen Production: Electrolysis (seguridad general). Datos del escenario: simulados.',
}, [
  [1, '¿Cuál afirmación NO se sostiene?', ['Si no se ve llama, no hay riesgo.', 'La concentración superó el umbral de alarma del escenario.', 'La ventilación apagada aumenta el riesgo de acumulación.', 'La respuesta debe seguir un protocolo.'], 0,
    'La llama de hidrógeno puede ser poco visible y el riesgo existe antes de cualquier ignición.', ['', 'Se sostiene: 14 % > 10 %.', 'Se sostiene.', 'Se sostiene.'], 'evaluar el riesgo por apariencia'],
  [2, '¿Cuál es el orden correcto del protocolo abstracto?', ['DETENER → VENTILAR → DETECTAR → AISLAR → VERIFICAR → AUTORIZAR REINICIO', 'DETECTAR → AISLAR → DETENER → VENTILAR → VERIFICAR → AUTORIZAR REINICIO', 'DETECTAR → AUTORIZAR REINICIO → VENTILAR', 'VENTILAR → AUTORIZAR REINICIO → AISLAR'], 1,
    'Se detecta, se aísla la fuente, se detiene el equipo, se ventila, se verifica y solo entonces se autoriza el reinicio.', ['Detener antes de detectar no tiene sentido como secuencia.', '', 'Omite pasos y reinicia sin verificar.', 'Reinicia antes de aislar.'], 'improvisar el orden'],
  [3, 'Con 14 % LEL y ventilación apagada, ¿qué conjunto de acciones corresponde al protocolo?', ['Aislar el suministro, detener el electrolizador, activar ventilación, alejar al personal y verificar lecturas.', 'Seguir produciendo y abrir una ventana.', 'Apagar el detector para evitar falsas alarmas.', 'Reiniciar el electrolizador para "purgar" el gas.'], 0,
    'Aislar, detener, ventilar y verificar reducen la acumulación sin introducir nuevos riesgos.', ['', 'No aísla ni detiene.', 'Desactivar sensores está prohibido.', 'Agrava el riesgo.'], 'puentear sensores'],
  [4, 'Las lecturas bajan a 2 % LEL tras ventilar. ¿Por qué no reiniciar de inmediato?', ['Porque el hidrógeno nunca desaparece de una sala.', 'Porque falta verificar la causa (fuga, sello, conexión), confirmar lecturas estables y obtener autorización antes de reiniciar.', 'Porque la ventilación consume mucha energía.', 'Porque el reinicio solo se permite de noche.'], 1,
    'Sin identificar la causa, la condición insegura puede repetirse.', ['El H2 se dispersa con ventilación.', '', 'La energía no es el criterio de seguridad.', 'No hay tal regla.'], 'reiniciar sin verificar'],
  [5, '¿Qué elemento fortalece más la cultura de seguridad de la Ciudadela?', ['Confiar en la experiencia del operador más antiguo.', 'Sensores redundantes, interlocks no anulables, mantenimiento coordinado con ventilación, simulacros y comunicación clara de riesgos.', 'Reducir sensores para evitar alarmas.', 'Trabajar más rápido para salir antes de una fuga.'], 1,
    'La seguridad es sistémica: redundancia, diseño, procedimientos, entrenamiento y comunicación.', ['La experiencia no sustituye el sistema.', '', 'Aumenta el riesgo.', 'La prisa no es una medida de seguridad.'], 'tratar la seguridad como algo individual'],
]);
