// Sistema de casos procedurales para el juego
// Cada caso tiene diferentes sospechosos, horarios, rutas y códigos

export interface SubPuzzle {
  id: string;
  question: string;
  correctAnswer: string;
  hints: string[];
  unlocksNext: boolean;
}

export interface PhysicalChallenge {
  id: string;
  name: string;
  description: string;
  instruction: string;
  timeLimit?: number; // Tiempo límite en segundos (opcional)
  requiresConfirmation: boolean; // Si requiere confirmación del host u otros jugadores
  failureConsequence: string; // Qué pasa si falla
}

export interface GameCase {
  id: string;
  name: string;
  victim: string;
  location: string;
  
  // Fase 1: La Escena del Crimen (EXPANDIDA)
  phase1: {
    correctTime: string; // Hora exacta del crimen
    correctAnswer: string; // Respuesta final para Fase 1
    suspects: Array<{
      id: string;
      name: string;
      alibi: string;
      motive: string;
      timeline: string;
      physicalEvidence: string[];
    }>;
    clues: Record<string, string[]>; // Pistas por rol
    subPuzzles: SubPuzzle[]; // Sub-acertijos que deben resolverse primero
    intermediateAnswers: string[]; // Respuestas intermedias requeridas
    physicalChallenge?: PhysicalChallenge; // Desafío físico antes de completar la fase
  };
  
  // Fase 2: Los Archivos Rotos (EXPANDIDA)
  phase2: {
    documentType: string;
    correctKeyword: string; // Respuesta final para Fase 2
    fragments: Record<string, string[]>; // Fragmentos por rol
    secondDigit: string; // Segundo dígito del candado
    subPuzzles: SubPuzzle[]; // Sub-acertijos de reconstrucción
    requiredFragments: number; // Número mínimo de fragmentos que deben publicarse
    codeToUnlock: string; // Código intermedio para desbloquear siguiente paso
    physicalChallenge?: PhysicalChallenge; // Desafío físico antes de completar la fase
  };
  
  // Fase 3: La Ruta del Asesino (EXPANDIDA)
  phase3: {
    correctRoute: string; // Respuesta final para Fase 3
    mapPoints: Array<{
      id: string;
      name: string;
      x: number;
      y: number;
      hasCamera: boolean;
      isDark: boolean;
      evidence: string[];
    }>;
    routeClues: Record<string, string[]>; // Pistas por rol
    thirdDigit: string; // Tercer dígito
    fourthDigit: string; // Cuarto dígito
    subPuzzles: SubPuzzle[]; // Sub-acertijos sobre la ruta
    timeConstraints: Array<{ from: string; to: string; point: string }>; // Restricciones de tiempo
    physicalChallenge?: PhysicalChallenge; // Desafío físico antes de completar la fase
  };
  
  // Fase 4: La Caja Grey (EXPANDIDA)
  phase4: {
    patterns: Record<string, { visual: string; audio: string; hint: string }>;
    correctAnswer: string; // Último dígito
    fifthDigit: string;
    subPuzzles: SubPuzzle[]; // Sub-acertijos de sincronización
    requiredPatterns: number; // Número de patrones que deben combinarse
    finalCalculation: string; // Fórmula final para obtener el dígito
    physicalChallenge?: PhysicalChallenge; // Desafío físico antes de completar la fase
  };
  
  // Desafíos físicos entre fases
  interPhaseChallenges: Array<{
    betweenPhases: [number, number]; // Entre qué fases (ej: [1, 2] = entre fase 1 y 2)
    challenge: PhysicalChallenge;
  }>;
  
  // Código final del candado
  finalCode: string;
  
  // Narrativa final
  finalNarrative: string;
}

export const gameCases: GameCase[] = [
  {
    id: "case-001",
    name: "El Robo del Diamante",
    victim: "Dr. Elena Martínez",
    location: "Museo de Arte Moderno",
    phase1: {
      correctTime: "02:47",
      correctAnswer: "DOSCUARENTAYSIETE",
      suspects: [
        {
          id: "suspect-1",
          name: "Marco Valdez",
          alibi: "En casa, según su esposa",
          motive: "Deuda de juego con la víctima",
          timeline: "Última vez visto: 02:30 en el bar cercano",
          physicalEvidence: [
            "ADN encontrado en el bar: Coincide parcialmente",
            "Huellas en el bar: Talla 42, zapatos deportivos",
            "Registro de llamadas: Llamó a un número desconocido a las 02:35",
          ],
        },
        {
          id: "suspect-2",
          name: "Isabella Chen",
          alibi: "Trabajando en el museo",
          motive: "Despedida reciente, acceso a llaves",
          timeline: "Registro de entrada: 02:15, salida: 03:00",
          physicalEvidence: [
            "Huellas en el museo: Coinciden con empleados",
            "ADN en la vitrina: Parcial, tipo A positivo",
            "Registro de tarjeta de acceso: Usada a las 02:42",
          ],
        },
        {
          id: "suspect-3",
          name: "Roberto Silva",
          alibi: "Sin confirmar",
          motive: "Coleccionista conocido, interés en el diamante",
          timeline: "Visto cerca del museo a las 02:20",
          physicalEvidence: [
            "Huellas cerca del museo: Talla 43, zapatos de cuero",
            "ADN en la entrada trasera: Coincide con muestras previas",
            "Registro de vehículo: Coche negro visto a las 02:25 y 02:55",
          ],
        },
      ],
      subPuzzles: [
        {
          id: "puzzle-1-1",
          question: "¿Quién tiene el alibi más débil basado en las pruebas físicas? (Nombre completo)",
          correctAnswer: "ISABELLA CHEN",
          hints: [
            "Revisa las pruebas de ADN y huellas",
            "El alibi puede ser falso si las pruebas físicas no coinciden",
            "Las huellas en la vitrina son clave",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-1-2",
          question: "¿Cuál es la diferencia en minutos entre la desactivación de la alarma y su reactivación?",
          correctAnswer: "7",
          hints: [
            "Alarma desactivada: 02:45",
            "Alarma reactivada: 02:52",
            "Calcula la diferencia",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-1-3",
          question: "Basado en los testimonios, ¿a qué hora exacta ocurrió el robo? (Formato: HH:MM)",
          correctAnswer: "02:47",
          hints: [
            "El guardia escuchó un ruido sordo",
            "El testigo B escuchó un zumbido eléctrico",
            "Ambos coinciden en el mismo momento",
          ],
          unlocksNext: true,
        },
      ],
      intermediateAnswers: ["ISABELLA CHEN", "7", "02:47"],
      clues: {
        ANALISTA_TIEMPOS: [
          "Cierre del museo: 22:00",
          "Alarma desactivada: 02:45",
          "Alarma reactivada: 02:52",
          "Tiempo de ventana: 7 minutos",
        ],
        EXPERTO_HUELLAS: [
          "Huellas en la vitrina: Guantes de látex",
          "Huellas en la puerta trasera: Talla 42",
          "Sin huellas en el suelo (alfombra limpiada)",
        ],
        ENTREVISTADOR: [
          'Guardia nocturno: "Escuché un ruido sordo a las 02:47"',
          'Limpiador: "Vi una sombra en el pasillo este a las 02:50"',
          'Vecino: "Un coche arrancó rápido a las 02:53"',
        ],
        CARTOGRAFO: [
          "Punto A: Entrada de servicio (sin cámara)",
          "Punto B: Sala principal (cámara deshabilitada 02:40-02:50)",
          "Punto C: Pasillo este (zona sin luz)",
          "Punto D: Vitrina del diamante",
          "Punto E: Salida trasera (cámara funcionando)",
        ],
        PERITO_FORENSE: [
          "Herramienta usada: Taladro de diamante",
          "Vidrio cortado con precisión quirúrgica",
          "Sin rastros de fuerza bruta",
        ],
        ARCHIVISTA: [
          "Expediente Marco Valdez: Historial de deudas",
          "Expediente Isabella Chen: Despedida hace 2 semanas",
          "Expediente Roberto Silva: Sin antecedentes",
        ],
        COMUNICACIONES: [
          "Última llamada del guardia: 02:44 a su esposa",
          "SMS recibido a las 02:46: 'Ya está hecho'",
          "Email programado: 'Lo siento por todo' a las 03:00",
        ],
        TESTIMONIOS: [
          'Testigo A: "Vi a alguien con mochila negra cerca de la entrada trasera"',
          'Testigo B: "Escuché un zumbido eléctrico alrededor de las 02:47"',
          'Testigo C: "Un coche negro salió a gran velocidad"',
        ],
        PERFILADOR: [
          "Perfil: Conocimiento técnico avanzado",
          "Motivación: Financiera o venganza personal",
          "Planificación: Meticulosa, conocía el sistema de seguridad",
        ],
        INTERPRETE_MENSAJES: [
          "Código en la pared: '02-47-03'",
          "Nota encontrada: 'El tiempo es clave'",
          "Mensaje críptico: 'Todo a su hora'",
        ],
      },
    },
    phase2: {
      documentType: "Contrato de seguro",
      correctKeyword: "DIAMANTE",
      secondDigit: "8",
      requiredFragments: 15, // Mínimo de fragmentos que deben publicarse
      codeToUnlock: "MU-2023-892", // Código del expediente que desbloquea siguiente paso
      subPuzzles: [
        {
          id: "puzzle-2-1",
          question: "¿Cuál es el número de expediente mencionado en los fragmentos? (Formato: MU-YYYY-XXX)",
          correctAnswer: "MU-2023-892",
          hints: [
            "Busca en los fragmentos del Archivista",
            "Formato: Letras-GUION-Año-GUION-Números",
            "Aparece en uno de los fragmentos publicados",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-2-2",
          question: "¿Cuál es el valor del objeto asegurado en millones? (Solo el número)",
          correctAnswer: "2",
          hints: [
            "Busca en los fragmentos del Entrevistador",
            "El valor está en millones de euros",
            "Es un número de un solo dígito",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-2-3",
          question: "¿Cuál es la palabra clave que aparece en todos los fragmentos relacionados con el objeto?",
          correctAnswer: "DIAMANTE",
          hints: [
            "Aparece en los fragmentos del Intérprete de Mensajes",
            "Es el objeto principal del caso",
            "Está relacionado con el valor del seguro",
          ],
          unlocksNext: true,
        },
      ],
      fragments: {
        ANALISTA_TIEMPOS: [
          "El documento fue destruido el...",
          "...15 de diciembre de 2023...",
          "...a las 14:30 según el registro del sistema...",
        ],
        EXPERTO_HUELLAS: [
          "...papel de alta calidad, marca...",
          "...Premium Bond 80gsm...",
          "...impreso con impresora láser color...",
        ],
        ENTREVISTADOR: [
          "...contenía información sobre...",
          "...una póliza de seguro valuada en...",
          "...€2,500,000 para un objeto específico...",
        ],
        CARTOGRAFO: [
          "...el documento mencionaba...",
          "...una ubicación de almacenamiento...",
          "...Bóveda 7, Nivel 3 del museo...",
        ],
        PERITO_FORENSE: [
          "...fue cortado con precisión...",
          "...usando una herramienta de corte profesional...",
          "...probablemente una cuchilla de afeitar o bisturí...",
        ],
        ARCHIVISTA: [
          "...pertenecía al expediente...",
          "...número de caso: MU-2023-892...",
          "...clasificado como ALTA SEGURIDAD...",
        ],
        COMUNICACIONES: [
          "...había una nota escrita a mano...",
          "...decía: 'El DIAMANTE está en peligro'...",
          "...firmada con las iniciales 'E.M.'...",
        ],
        TESTIMONIOS: [
          "...un testigo vio el documento...",
          "...antes de ser destruido...",
          "...en las manos de alguien con guantes blancos...",
        ],
        PERFILADOR: [
          "...el estilo de escritura sugiere...",
          "...una persona con formación legal o financiera...",
          "...posiblemente con conocimiento de seguros...",
        ],
        INTERPRETE_MENSAJES: [
          "...había números escritos: 8-2-5-0...",
          "...y una palabra clave: 'DIAMANTE'...",
          "...todo relacionado con el valor del objeto...",
        ],
      },
    },
    phase3: {
      correctRoute: "ACFGHDE",
      thirdDigit: "1",
      fourthDigit: "6",
      mapPoints: [
        { 
          id: "A", 
          name: "Entrada de Servicio", 
          x: 5, 
          y: 90, 
          hasCamera: false, 
          isDark: true,
          evidence: ["Huellas de barro talla 42", "Rastro de herramienta especializada", "Fibra textil negra (algodón)", "Marca de neumático en el suelo", "Restos de cinta adhesiva"],
        },
        { 
          id: "B", 
          name: "Sala Principal", 
          x: 30, 
          y: 20, 
          hasCamera: true, 
          isDark: false,
          evidence: ["Sin evidencia física", "Cámara deshabilitada 02:40-02:50", "Sensor de movimiento activo", "Alfombra recién limpiada"],
        },
        { 
          id: "C", 
          name: "Pasillo Este", 
          x: 30, 
          y: 50, 
          hasCamera: false, 
          isDark: true,
          evidence: ["Rastros de barro húmedo", "Objeto metálico encontrado (herramienta)", "Fibras de guantes de látex", "Marca de arrastre en el suelo", "Restos de polvo blanco"],
        },
        { 
          id: "D", 
          name: "Vitrina del Diamante", 
          x: 70, 
          y: 50, 
          hasCamera: false, 
          isDark: false,
          evidence: ["Vidrio cortado con precisión láser", "Herramienta de corte abandonada", "ADN parcial tipo A+", "Huellas dactilares parciales", "Fragmentos de vidrio en el suelo"],
        },
        { 
          id: "E", 
          name: "Salida Trasera", 
          x: 95, 
          y: 10, 
          hasCamera: true, 
          isDark: false,
          evidence: ["Sin huellas (limpiado profesionalmente)", "Cámara grabó salida 02:51", "Rastro de vehículo (marca específica)", "Restos de líquido limpiador"],
        },
        { 
          id: "F", 
          name: "Almacén de Mantenimiento", 
          x: 50, 
          y: 70, 
          hasCamera: false, 
          isDark: true,
          evidence: ["Herramientas robadas del almacén", "Caja de herramientas abierta", "Huellas en el polvo", "Cable eléctrico cortado", "Rastro de aceite"],
        },
        { 
          id: "G", 
          name: "Sala de Control", 
          x: 60, 
          y: 30, 
          hasCamera: true, 
          isDark: false,
          evidence: ["Sistema de seguridad manipulado", "Registro de acceso no autorizado", "Código de desactivación usado", "Sin evidencia física", "Logs del sistema borrados"],
        },
        { 
          id: "H", 
          name: "Pasillo Norte", 
          x: 50, 
          y: 40, 
          hasCamera: false, 
          isDark: true,
          evidence: ["Rastros de movimiento reciente", "Fibras de ropa oscura", "Marca de mochila en la pared", "Restos de pegamento", "Huellas parciales"],
        },
        { 
          id: "I", 
          name: "Oficina de Seguridad", 
          x: 20, 
          y: 60, 
          hasCamera: true, 
          isDark: false,
          evidence: ["Sin evidencia de entrada", "Cámara funcionando normalmente", "No visitado por el asesino"],
        },
        { 
          id: "J", 
          name: "Vestíbulo Principal", 
          x: 40, 
          y: 10, 
          hasCamera: true, 
          isDark: false,
          evidence: ["Sin actividad sospechosa", "Cámara grabó actividad normal", "No parte de la ruta"],
        },
      ],
      timeConstraints: [
        { from: "02:40", to: "02:42", point: "A" },
        { from: "02:42", to: "02:45", point: "C" },
        { from: "02:45", to: "02:47", point: "F" },
        { from: "02:47", to: "02:49", point: "G" },
        { from: "02:49", to: "02:50", point: "H" },
        { from: "02:50", to: "02:52", point: "D" },
        { from: "02:52", to: "02:55", point: "E" },
      ],
      subPuzzles: [
        {
          id: "puzzle-3-1",
          question: "¿Cuántos puntos tienen evidencia de ADN, huellas o herramientas? (Solo el número)",
          correctAnswer: "6",
          hints: [
            "Revisa la evidencia en cada punto del mapa",
            "Cuenta los puntos con ADN, huellas o herramientas",
            "No cuentes los que solo tienen evidencia de cámaras o sin evidencia",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-3-2",
          question: "¿Qué punto tiene herramientas robadas y está en zona oscura? (Solo la letra)",
          correctAnswer: "F",
          hints: [
            "Revisa la evidencia en cada punto",
            "Busca el punto con herramientas robadas",
            "Debe estar en zona oscura (isDark: true)",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-3-3",
          question: "¿Qué punto tiene el sistema de seguridad manipulado? (Solo la letra)",
          correctAnswer: "G",
          hints: [
            "Revisa la evidencia en cada punto",
            "Busca el punto relacionado con seguridad",
            "Debe tener evidencia de manipulación",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-3-4",
          question: "¿Cuántos puntos NO tienen cámaras y están en zona oscura? (Solo el número)",
          correctAnswer: "3",
          hints: [
            "Revisa las propiedades de cada punto",
            "Cuenta los que tienen hasCamera: false e isDark: true",
            "Son puntos clave para pasar desapercibido",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-3-5",
          question: "¿Qué punto tiene evidencia de ADN tipo A+? (Solo la letra)",
          correctAnswer: "D",
          hints: [
            "Revisa la evidencia en cada punto",
            "Busca el punto con ADN",
            "El tipo de sangre es A+",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-3-6",
          question: "Basado en las restricciones de tiempo y evidencia, ¿cuál es la ruta completa del asesino? (Letras sin espacios, ejemplo: ACFGHDE)",
          correctAnswer: "ACFGHDE",
          hints: [
            "La ruta debe permitir llegar de A a E en el tiempo disponible",
            "Debe pasar por el punto con herramientas (F)",
            "Debe pasar por el punto con seguridad manipulado (G)",
            "Debe pasar por el punto con ADN (D)",
            "Evita puntos con cámaras activas",
            "Considera las zonas oscuras para pasar desapercibido",
          ],
          unlocksNext: true,
        },
      ],
      routeClues: {
        ANALISTA_TIEMPOS: [
          "El asesino llegó al museo a las 02:40 exactamente",
          "Tiempo de desplazamiento entre puntos: 2-3 minutos",
          "Tiempo total de la operación: 15 minutos",
          "La alarma se activó a las 02:52, momento de escape",
          "Ventana de tiempo crítica: 02:40-02:55",
          "Punto A: Llegada 02:40, salida 02:42",
          "Punto C: Llegada 02:42, salida 02:45",
          "Punto F: Llegada 02:45, salida 02:47",
          "Punto G: Llegada 02:47, salida 02:49",
          "Punto H: Llegada 02:49, salida 02:50",
          "Punto D: Llegada 02:50, salida 02:52",
          "Punto E: Llegada 02:52, salida 02:55",
        ],
        EXPERTO_HUELLAS: [
          "Huellas en la entrada de servicio (Punto A): Talla 42, zapatos deportivos",
          "Rastros de barro húmedo en el pasillo este (Punto C)",
          "Huellas en el polvo del almacén (Punto F): Mismo tipo de calzado",
          "Sin huellas en la sala de control (Punto G): Usó guantes",
          "Huellas parciales en el pasillo norte (Punto H)",
          "ADN en la vitrina (Punto D): Tipo A+",
          "Sin huellas en la salida trasera (Punto E): Limpiado profesionalmente",
          "Rastro de arrastre desde el punto F hasta el punto D",
          "Fibras de guantes de látex encontradas en múltiples puntos",
        ],
        ENTREVISTADOR: [
          "Testigo 1 (guardia nocturno): 'Escuché un ruido sordo a las 02:40 cerca de la entrada de servicio'",
          "Testigo 2 (limpiador): 'Vi una sombra moverse en el pasillo este a las 02:45'",
          "Testigo 3 (vecino): 'Un coche arrancó rápido a las 02:53'",
          "Testigo 4 (vigilante): 'Las cámaras del pasillo este no funcionaban'",
          "Testigo 5 (empleado): 'Escuché ruidos en el almacén alrededor de las 02:46'",
          "Testigo 6 (seguridad): 'El sistema de alarmas se desactivó brevemente a las 02:47'",
          "Testigo 7 (guardia): 'Escuché pasos cerca de la vitrina a las 02:51'",
          "Testigo 8 (limpieza): 'Encontré restos de herramientas en el pasillo norte'",
        ],
        CARTOGRAFO: [
          "Mapa completo del museo: 10 puntos clave identificados",
          "Ruta directa más corta: A → B → D → E (pero expuesta)",
          "Ruta alternativa 1: A → C → D → E (evita B, pero incompleta)",
          "Ruta alternativa 2: A → C → F → G → H → D → E (completa y discreta)",
          "Zonas sin cámaras: Pasillo Este (C), Almacén (F), Pasillo Norte (H)",
          "Zonas con cámaras deshabilitadas: Sala Principal (B) 02:40-02:50",
          "Puntos de acceso: Entrada de Servicio (A) y Salida Trasera (E)",
          "Punto crítico: Almacén (F) contiene herramientas necesarias",
          "Punto crítico: Sala de Control (G) permite desactivar alarmas",
          "Distancia total de la ruta correcta: Aproximadamente 180 metros",
        ],
        PERITO_FORENSE: [
          "Evidencia de herramientas especializadas en el Punto D",
          "Herramientas robadas del almacén (Punto F): Taladro de diamante, cortador láser",
          "Objeto metálico encontrado en el Punto C: Parte de una herramienta",
          "Fibras textiles negras en el Punto A: Ropa del asesino",
          "ADN parcial tipo A+ en el Punto D: Coincide con sospechoso",
          "Huellas dactilares parciales en el Punto D: Guantes dañados",
          "Fragmentos de vidrio en el Punto D: Cortado con precisión láser",
          "Rastro de aceite desde el Punto F hasta el Punto D",
          "Cable eléctrico cortado en el Punto F: Herramienta usada",
          "Restos de pegamento en el Punto H: Mochila o equipo",
        ],
        ARCHIVISTA: [
          "Expediente del sospechoso principal: Conocía el museo en detalle",
          "Planos antiguos muestran acceso por Punto A (entrada de servicio)",
          "Registro de visitas previas al Punto D (vitrina del diamante)",
          "Historial de acceso al almacén (Punto F): Última vez hace 2 semanas",
          "Registro de acceso a la sala de control (Punto G): No autorizado",
          "Expediente de seguridad: El punto G requiere código especial",
          "Archivo de mantenimiento: Herramientas reportadas como faltantes",
          "Registro de alarmas: Desactivación no autorizada a las 02:47",
          "Expediente de personal: Conocimiento del sistema de seguridad",
        ],
        COMUNICACIONES: [
          "Cámara en Punto A: Sin registro (deshabilitada desde 02:38)",
          "Cámara en Punto B: Deshabilitada 02:40-02:50 (manipulación remota)",
          "Cámara en Punto C: Sin cámaras instaladas (zona ciega)",
          "Cámara en Punto F: Sin cámaras (almacén interno)",
          "Cámara en Punto G: Grabó acceso no autorizado 02:47-02:49",
          "Cámara en Punto H: Sin cámaras (pasillo de servicio)",
          "Cámara en Punto D: Sin cámaras (vitrina aislada)",
          "Cámara en Punto E: Grabó salida a las 02:51 (vehículo no identificado)",
          "Sistema de alarmas: Desactivado brevemente 02:47-02:49",
          "Logs del sistema: Borrados desde el Punto G",
        ],
        TESTIMONIOS: [
          "Testigo A: 'Vi una sombra moverse hacia el este alrededor de las 02:42'",
          "Testigo B: 'Escuché ruidos metálicos en el pasillo este a las 02:43'",
          "Testigo C: 'Nadie salió por la entrada principal durante toda la noche'",
          "Testigo D: 'Escuché algo caer en el almacén a las 02:46'",
          "Testigo E: 'Las luces del pasillo norte parpadearon a las 02:49'",
          "Testigo F: 'Vi un destello de luz cerca de la vitrina a las 02:51'",
          "Testigo G: 'Un coche negro salió a gran velocidad a las 02:53'",
          "Testigo H: 'Escuché un zumbido eléctrico alrededor de las 02:47'",
        ],
        PERFILADOR: [
          "Perfil del asesino: Conocimiento técnico avanzado",
          "Preferencia por rutas con cobertura y zonas oscuras",
          "Planificación meticulosa: Conocía puntos ciegos del sistema",
          "Comportamiento: Evitó áreas con alta visibilidad (B, I, J)",
          "Método: Usó herramientas especializadas (requiere acceso previo)",
          "Motivación: Financiera o venganza personal",
          "Conocimiento: Familiarizado con el sistema de seguridad",
          "Preparación: Trajo herramientas pero también robó del almacén",
          "Escape: Limpió evidencia en puntos críticos",
        ],
        INTERPRETE_MENSAJES: [
          "Código encontrado en la pared del Punto C: 'A-C-F-G-H-D-E'",
          "Nota encontrada en el Punto F: 'Evitar B, I, J - demasiado expuesto'",
          "Mensaje en el Punto G: 'La salida está en E, tiempo limitado'",
          "Código numérico en el Punto H: '02:40-02:55' (ventana de tiempo)",
          "Mensaje críptico: 'Seguir la ruta de las herramientas'",
          "Nota en el Punto D: 'El diamante está aquí, pero cuidado con las alarmas'",
          "Código de acceso encontrado: Relacionado con el Punto G",
        ],
      },
    },
    phase4: {
      requiredPatterns: 8, // Mínimo de patrones que deben combinarse
      finalCalculation: "Suma todos los números únicos (2+4+7+1+6=20), último dígito es 0",
      subPuzzles: [
        {
          id: "puzzle-4-1",
          question: "¿Cuántos números únicos aparecen en todos los patrones combinados? (Solo el número)",
          correctAnswer: "5",
          hints: [
            "Combina todos los patrones visuales",
            "Cuenta los números únicos (sin repetir)",
            "Los números son: 2, 4, 7, 1, 6",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-4-2",
          question: "¿Cuál es la suma de todos los números únicos mencionados en los patrones?",
          correctAnswer: "20",
          hints: [
            "Suma: 2 + 4 + 7 + 1 + 6",
            "El resultado es un número de dos dígitos",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-4-3",
          question: "¿Cuál es el último dígito de la suma de todos los números únicos?",
          correctAnswer: "0",
          hints: [
            "La suma es 20",
            "El último dígito de 20 es 0",
            "Este es el último dígito del candado",
          ],
          unlocksNext: true,
        },
      ],
      patterns: {
        ANALISTA_TIEMPOS: {
          visual: "Patrón temporal: 2-4-7-1-6",
          audio: "Sonido: TIC-TAC-TIC-TAC-TIC",
          hint: "El patrón sigue una secuencia temporal",
        },
        EXPERTO_HUELLAS: {
          visual: "Secuencia: A-B-C-D-E",
          audio: "Sonido: TON-TON-TON-TON-TON",
          hint: "Cada elemento tiene un valor numérico",
        },
        ENTREVISTADOR: {
          visual: "Código: 6-1-7-4-2",
          audio: "Sonido: BEEP-BEEP-BEEP-BEEP-BEEP",
          hint: "La secuencia está reorganizada",
        },
        CARTOGRAFO: {
          visual: "Orden: 4-2-1-6-7",
          audio: "Sonido: DING-DONG-DING-DONG-DING",
          hint: "Los números están mezclados",
        },
        PERITO_FORENSE: {
          visual: "Secuencia: 7-2-4-1-6",
          audio: "Sonido: CLICK-CLICK-CLICK-CLICK-CLICK",
          hint: "Hay un patrón oculto en el orden",
        },
        ARCHIVISTA: {
          visual: "Código: 1-4-6-2-7",
          audio: "Sonido: POP-POP-POP-POP-POP",
          hint: "Sigue una secuencia alternada",
        },
        COMUNICACIONES: {
          visual: "Patrón: 4-6-7-1-2",
          audio: "Sonido: BUZZ-BUZZ-BUZZ-BUZZ-BUZZ",
          hint: "El orden es importante",
        },
        TESTIMONIOS: {
          visual: "Secuencia: 2-7-1-6-4",
          audio: "Sonido: CHIME-CHIME-CHIME-CHIME-CHIME",
          hint: "Suma todos los números únicos",
        },
        PERFILADOR: {
          visual: "Código: 7-1-4-6-2",
          audio: "Sonido: TONE-TONE-TONE-TONE-TONE",
          hint: "El último dígito es la suma módulo 10",
        },
        INTERPRETE_MENSAJES: {
          visual: "Patrón: 2+4+7+1+6 = 20 → último dígito: 0",
          audio: "Sonido: FINAL-FINAL-FINAL-FINAL-FINAL",
          hint: "Suma todos los números únicos y toma el último dígito",
        },
      },
      correctAnswer: "0",
      fifthDigit: "0",
    },
    finalCode: "28160",
    finalNarrative:
      "El caso del Robo del Diamante ha sido resuelto. Isabella Chen, la ex-empleada del museo, utilizó su conocimiento del sistema de seguridad para desactivar las cámaras y robar el diamante valuado en €2.5 millones. El documento destruido contenía información sobre la póliza de seguro, y la ruta A-C-D-E le permitió evitar las áreas más vigiladas. El código 28160 abre la caja que contiene la evidencia final que la conecta con una red internacional de tráfico de arte.",
    interPhaseChallenges: [
      {
        betweenPhases: [1, 2],
        challenge: {
          id: "challenge-1-2",
          name: "El Brindis del Detective",
          description: "Para avanzar a la siguiente fase, cada jugador debe beberse una cerveza entera (o bebida equivalente).",
          instruction: "Cada jugador debe beberse completamente una cerveza (o bebida no alcohólica equivalente). El host debe confirmar que todos han completado el desafío.",
          timeLimit: 300, // 5 minutos
          requiresConfirmation: true,
          failureConsequence: "El jugador que no complete el desafío será eliminado y perderá todas sus pistas.",
        },
      },
      {
        betweenPhases: [2, 3],
        challenge: {
          id: "challenge-2-3",
          name: "El Juramento del Archivo",
          description: "Para acceder a la ruta del asesino, todos deben hacer 20 flexiones (o sentadillas si no pueden hacer flexiones).",
          instruction: "Cada jugador debe completar 20 flexiones (o 30 sentadillas como alternativa). Los demás jugadores deben contar y confirmar.",
          timeLimit: 180, // 3 minutos
          requiresConfirmation: true,
          failureConsequence: "El jugador que no complete el desafío será eliminado y perderá todas sus pistas.",
        },
      },
      {
        betweenPhases: [3, 4],
        challenge: {
          id: "challenge-3-4",
          name: "La Prueba Final",
          description: "Antes de abrir la Caja Grey, todos deben mantener el equilibrio en un pie durante 30 segundos.",
          instruction: "Cada jugador debe mantenerse en equilibrio sobre un pie durante 30 segundos consecutivos. Los demás deben cronometrar y confirmar.",
          timeLimit: 240, // 4 minutos
          requiresConfirmation: true,
          failureConsequence: "El jugador que no complete el desafío será eliminado y perderá todas sus pistas.",
        },
      },
    ],
  },
  
  {
    id: "case-002",
    name: "El Asesinato en el Laboratorio",
    victim: "Prof. James Whitaker",
    location: "Instituto de Investigación Biológica",
    phase1: {
      correctTime: "23:18",
      correctAnswer: "VEINTITRESDIECIOCHO",
      suspects: [
        {
          id: "suspect-1",
          name: "Dr. Sarah Mitchell",
          alibi: "En el laboratorio hasta las 23:00",
          motive: "Disputa sobre patente de investigación",
          timeline: "Última vez vista: 23:15 en el pasillo 3",
          physicalEvidence: [
            "ADN en el laboratorio: Tipo O positivo",
            "Huellas en el teclado: Parcialmente borradas",
            "Registro de acceso: Tarjeta usada a las 23:00",
          ],
        },
        {
          id: "suspect-2",
          name: "Michael Torres",
          alibi: "Sin confirmar",
          motive: "Despedido hace 1 mes, acceso a códigos",
          timeline: "Tarjeta de acceso usada: 23:10",
          physicalEvidence: [
            "ADN en la puerta: Tipo AB positivo (coincide con sangre)",
            "Huellas en el pasillo: Talla 43, zapatos deportivos",
            "Registro de tarjeta: Usada a las 23:10 (despedido)",
          ],
        },
        {
          id: "suspect-3",
          name: "Dr. Lisa Park",
          alibi: "En casa, según su marido",
          motive: "Rivalidad académica, publicación robada",
          timeline: "Email enviado a las 23:20 desde su cuenta",
          physicalEvidence: [
            "ADN en el archivo: Tipo A positivo",
            "Huellas en documentos: Guantes de laboratorio",
            "Registro de email: Enviado desde IP del laboratorio",
          ],
        },
      ],
      subPuzzles: [
        {
          id: "puzzle-1-1",
          question: "¿Quién tiene ADN que coincide con la sangre encontrada en la escena? (Nombre completo)",
          correctAnswer: "MICHAEL TORRES",
          hints: [
            "Revisa el tipo de sangre encontrado en la escena",
            "Compara con el ADN de los sospechosos",
            "El tipo AB positivo es clave",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-1-2",
          question: "¿Cuál es la diferencia en minutos entre la desactivación y reactivación de la alarma?",
          correctAnswer: "10",
          hints: [
            "Alarma desactivada: 23:15",
            "Alarma reactivada: 23:25",
            "Calcula la diferencia",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-1-3",
          question: "Basado en los testimonios, ¿a qué hora exacta ocurrió el asesinato? (Formato: HH:MM)",
          correctAnswer: "23:18",
          hints: [
            "El guardia escuchó un grito",
            "El testigo B escuchó algo romperse",
            "Ambos coinciden en el mismo momento",
          ],
          unlocksNext: true,
        },
      ],
      intermediateAnswers: ["MICHAEL TORRES", "10", "23:18"],
      clues: {
        ANALISTA_TIEMPOS: [
          "Cierre del laboratorio: 20:00",
          "Sistema de seguridad activado: 20:15",
          "Alarma desactivada: 23:15",
          "Alarma reactivada: 23:25",
          "Tiempo de ventana: 10 minutos",
        ],
        EXPERTO_HUELLAS: [
          "Huellas en la puerta del laboratorio: Guantes de nitrilo",
          "Huellas en el teclado: Parcialmente borradas con alcohol",
          "Rastros de sangre tipo AB positivo",
        ],
        ENTREVISTADOR: [
          'Guardia de seguridad: "Escuché un grito a las 23:18"',
          'Investigador nocturno: "Vi luces en el laboratorio 3 a las 23:16"',
          'Limpieza: "Encontré la puerta abierta a las 23:30"',
        ],
        CARTOGRAFO: [
          "Punto A: Entrada principal (cámara funcionando)",
          "Punto B: Laboratorio 3 (cámara deshabilitada 23:10-23:20)",
          "Punto C: Pasillo de emergencia (sin cámara, salida de emergencia)",
          "Punto D: Archivo de datos (cámara funcionando)",
          "Punto E: Salida trasera (cámara deshabilitada 23:15-23:25)",
        ],
        PERITO_FORENSE: [
          "Arma: Objeto contundente, posiblemente tubo de ensayo de vidrio",
          "Herida: Impacto en la parte posterior del cráneo",
          "Sin signos de lucha, ataque por sorpresa",
        ],
        ARCHIVISTA: [
          "Expediente Dr. Sarah Mitchell: Disputa legal en curso",
          "Expediente Michael Torres: Despedido por acceso no autorizado",
          "Expediente Dr. Lisa Park: Publicación conjunta con víctima",
        ],
        COMUNICACIONES: [
          "Última llamada de la víctima: 23:12 a su esposa",
          "SMS recibido a las 23:17: 'Necesitamos hablar'",
          "Email enviado a las 23:19: 'Tengo la evidencia'",
        ],
        TESTIMONIOS: [
          'Testigo A: "Vi a alguien con bata de laboratorio salir corriendo"',
          'Testigo B: "Escuché algo romperse alrededor de las 23:18"',
          'Testigo C: "Un coche blanco salió del estacionamiento trasero"',
        ],
        PERFILADOR: [
          "Perfil: Conocimiento del laboratorio y protocolos",
          "Motivación: Venganza o protección de secretos",
          "Planificación: Conocía los puntos ciegos del sistema",
        ],
        INTERPRETE_MENSAJES: [
          "Código en la pantalla: '23-18-03'",
          "Nota encontrada: 'El momento exacto'",
          "Mensaje críptico: 'Todo tiene su hora'",
        ],
      },
    },
    phase2: {
      documentType: "Registro de experimentos",
      correctKeyword: "PROTOCOLO",
      secondDigit: "3",
      requiredFragments: 15,
      codeToUnlock: "LAB-2024-156",
      subPuzzles: [
        {
          id: "puzzle-2-1",
          question: "¿Cuál es el número de expediente mencionado en los fragmentos? (Formato: LAB-YYYY-XXX)",
          correctAnswer: "LAB-2024-156",
          hints: [
            "Busca en los fragmentos del Archivista",
            "Formato: Letras-GUION-Año-GUION-Números",
            "Aparece en uno de los fragmentos publicados",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-2-2",
          question: "¿Qué tipo de documento fue destruido según los fragmentos?",
          correctAnswer: "PROTOCOLO",
          hints: [
            "Busca en los fragmentos del Entrevistador",
            "Es una palabra relacionada con experimentos",
            "Aparece en mayúsculas en los fragmentos",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-2-3",
          question: "¿Cuál es la palabra clave que aparece en todos los fragmentos relacionados con el documento?",
          correctAnswer: "PROTOCOLO",
          hints: [
            "Aparece en los fragmentos del Intérprete de Mensajes",
            "Es el tipo de documento principal",
            "Está relacionado con la investigación",
          ],
          unlocksNext: true,
        },
      ],
      fragments: {
        ANALISTA_TIEMPOS: [
          "El documento fue destruido el...",
          "...18 de enero de 2024...",
          "...a las 21:45 según el registro del sistema...",
        ],
        EXPERTO_HUELLAS: [
          "...papel de laboratorio, marca...",
          "...Scientific Grade A4...",
          "...impreso con impresora de laboratorio...",
        ],
        ENTREVISTADOR: [
          "...contenía información sobre...",
          "...un PROTOCOLO experimental clasificado...",
          "...relacionado con investigación genética...",
        ],
        CARTOGRAFO: [
          "...el documento mencionaba...",
          "...una ubicación específica...",
          "...Laboratorio 3, Sección B...",
        ],
        PERITO_FORENSE: [
          "...fue cortado con precisión...",
          "...usando una herramienta de corte quirúrgico...",
          "...probablemente un escalpelo o bisturí...",
        ],
        ARCHIVISTA: [
          "...pertenecía al expediente...",
          "...número de caso: LAB-2024-156...",
          "...clasificado como CONFIDENCIAL...",
        ],
        COMUNICACIONES: [
          "...había una nota escrita a mano...",
          "...decía: 'El PROTOCOLO debe ser destruido'...",
          "...firmada con las iniciales 'J.W.'...",
        ],
        TESTIMONIOS: [
          "...un testigo vio el documento...",
          "...antes de ser destruido...",
          "...en las manos de alguien con guantes de laboratorio...",
        ],
        PERFILADOR: [
          "...el estilo de escritura sugiere...",
          "...una persona con formación científica...",
          "...posiblemente con conocimiento de protocolos de laboratorio...",
        ],
        INTERPRETE_MENSAJES: [
          "...había números escritos: 3-1-8-5...",
          "...y una palabra clave: 'PROTOCOLO'...",
          "...todo relacionado con el experimento...",
        ],
      },
    },
    phase3: {
      correctRoute: "ABFGHCE",
      thirdDigit: "9",
      fourthDigit: "2",
      mapPoints: [
        { 
          id: "A", 
          name: "Entrada Principal", 
          x: 5, 
          y: 90, 
          hasCamera: true, 
          isDark: false,
          evidence: ["Cámara grabó entrada 23:10", "Huellas en la puerta talla 43", "Tarjeta de acceso usada (despedido)", "Restos de barro en el suelo", "Marca de herramienta"],
        },
        { 
          id: "B", 
          name: "Laboratorio 3", 
          x: 30, 
          y: 30, 
          hasCamera: false, 
          isDark: false,
          evidence: ["Sangre tipo AB+ en el suelo", "Objeto contundente (tubo de ensayo)", "Evidencia de lucha", "ADN del asesino", "Fragmentos de vidrio"],
        },
        { 
          id: "C", 
          name: "Pasillo de Emergencia", 
          x: 70, 
          y: 50, 
          hasCamera: false, 
          isDark: true,
          evidence: ["Fibras de bata de laboratorio", "Rastros de guantes de nitrilo", "Sin cámaras", "Marca de arrastre", "Restos de sangre seca"],
        },
        { 
          id: "D", 
          name: "Archivo de Datos", 
          x: 80, 
          y: 20, 
          hasCamera: true, 
          isDark: false,
          evidence: ["Cámara funcionando normalmente", "Sin evidencia física", "No visitado por el asesino", "Sistema de seguridad activo"],
        },
        { 
          id: "E", 
          name: "Salida Trasera", 
          x: 95, 
          y: 10, 
          hasCamera: false, 
          isDark: true,
          evidence: ["Sin huellas (limpiado profesionalmente)", "Cámara deshabilitada 23:15-23:25", "Rastro de vehículo blanco", "Restos de líquido limpiador", "Fibras de guantes"],
        },
        { 
          id: "F", 
          name: "Almacén de Reactivos", 
          x: 50, 
          y: 70, 
          hasCamera: false, 
          isDark: true,
          evidence: ["Reactivos químicos robados", "Caja de herramientas abierta", "Huellas en el polvo", "Cable eléctrico manipulado", "Rastro de productos químicos"],
        },
        { 
          id: "G", 
          name: "Sala de Control de Seguridad", 
          x: 60, 
          y: 40, 
          hasCamera: true, 
          isDark: false,
          evidence: ["Sistema de seguridad manipulado", "Registro de acceso no autorizado", "Código de desactivación usado", "Logs del sistema borrados", "Sin evidencia física"],
        },
        { 
          id: "H", 
          name: "Pasillo Norte", 
          x: 50, 
          y: 50, 
          hasCamera: false, 
          isDark: true,
          evidence: ["Rastros de movimiento reciente", "Fibras de ropa de laboratorio", "Marca de mochila en la pared", "Restos de productos químicos", "Huellas parciales"],
        },
        { 
          id: "I", 
          name: "Oficina de Administración", 
          x: 20, 
          y: 60, 
          hasCamera: true, 
          isDark: false,
          evidence: ["Sin evidencia de entrada", "Cámara funcionando normalmente", "No visitado por el asesino"],
        },
        { 
          id: "J", 
          name: "Vestíbulo Principal", 
          x: 40, 
          y: 10, 
          hasCamera: true, 
          isDark: false,
          evidence: ["Sin actividad sospechosa", "Cámara grabó actividad normal", "No parte de la ruta"],
        },
      ],
      timeConstraints: [
        { from: "23:10", to: "23:12", point: "A" },
        { from: "23:12", to: "23:18", point: "B" },
        { from: "23:18", to: "23:20", point: "F" },
        { from: "23:20", to: "23:22", point: "G" },
        { from: "23:22", to: "23:23", point: "H" },
        { from: "23:23", to: "23:25", point: "C" },
        { from: "23:25", to: "23:30", point: "E" },
      ],
      subPuzzles: [
        {
          id: "puzzle-3-1",
          question: "¿Cuántos puntos tienen evidencia de sangre, ADN o herramientas? (Solo el número)",
          correctAnswer: "5",
          hints: [
            "Revisa la evidencia en cada punto del mapa",
            "Cuenta los puntos con sangre, ADN o herramientas",
            "No cuentes los que solo tienen evidencia de cámaras o sin evidencia",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-3-2",
          question: "¿Qué punto tiene reactivos químicos robados y está en zona oscura? (Solo la letra)",
          correctAnswer: "F",
          hints: [
            "Revisa la evidencia en cada punto",
            "Busca el punto con reactivos químicos",
            "Debe estar en zona oscura (isDark: true)",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-3-3",
          question: "¿Qué punto tiene el sistema de seguridad manipulado? (Solo la letra)",
          correctAnswer: "G",
          hints: [
            "Revisa la evidencia en cada punto",
            "Busca el punto relacionado con seguridad",
            "Debe tener evidencia de manipulación",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-3-4",
          question: "¿Cuántos puntos NO tienen cámaras y están en zona oscura? (Solo el número)",
          correctAnswer: "3",
          hints: [
            "Revisa las propiedades de cada punto",
            "Cuenta los que tienen hasCamera: false e isDark: true",
            "Son puntos clave para pasar desapercibido",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-3-5",
          question: "¿Qué punto tiene evidencia de sangre tipo AB+? (Solo la letra)",
          correctAnswer: "B",
          hints: [
            "Revisa la evidencia en cada punto",
            "Busca el punto con sangre",
            "El tipo de sangre es AB+",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-3-6",
          question: "Basado en las restricciones de tiempo y evidencia, ¿cuál es la ruta completa del asesino? (Letras sin espacios, ejemplo: ABFGHCE)",
          correctAnswer: "ABFGHCE",
          hints: [
            "La ruta debe permitir llegar de A a E en el tiempo disponible",
            "Debe pasar por el punto con sangre (B)",
            "Debe pasar por el punto con reactivos (F)",
            "Debe pasar por el punto con seguridad manipulado (G)",
            "Evita puntos con cámaras activas",
            "Considera las zonas oscuras para pasar desapercibido",
          ],
          unlocksNext: true,
        },
      ],
      routeClues: {
        ANALISTA_TIEMPOS: [
          "El asesino llegó al instituto a las 23:10 exactamente",
          "Tiempo de desplazamiento entre puntos: 2-6 minutos",
          "Tiempo total de la operación: 20 minutos",
          "La alarma se activó a las 23:25, momento de escape",
          "Ventana de tiempo crítica: 23:10-23:30",
          "Punto A: Llegada 23:10, salida 23:12",
          "Punto B: Llegada 23:12, salida 23:18 (6 minutos en el laboratorio)",
          "Punto F: Llegada 23:18, salida 23:20",
          "Punto G: Llegada 23:20, salida 23:22",
          "Punto H: Llegada 23:22, salida 23:23",
          "Punto C: Llegada 23:23, salida 23:25",
          "Punto E: Llegada 23:25, salida 23:30",
        ],
        EXPERTO_HUELLAS: [
          "Huellas en la entrada principal (Punto A): Talla 43, zapatos deportivos",
          "Rastros de guantes de nitrilo en el laboratorio (Punto B)",
          "Huellas en el polvo del almacén (Punto F): Mismo tipo de calzado",
          "Sin huellas en la sala de control (Punto G): Usó guantes",
          "Huellas parciales en el pasillo norte (Punto H)",
          "ADN tipo AB+ en el Punto B: Coincide con sangre",
          "Sin huellas en la salida trasera (Punto E): Limpiado profesionalmente",
          "Rastro de productos químicos desde el Punto F hasta el Punto C",
          "Fibras de guantes de nitrilo encontradas en múltiples puntos",
        ],
        ENTREVISTADOR: [
          "Testigo 1 (guardia): 'Escuché un ruido sordo a las 23:10 cerca de la entrada'",
          "Testigo 2 (investigador): 'Vi luces en el laboratorio 3 a las 23:16'",
          "Testigo 3 (limpieza): 'Encontré la puerta abierta a las 23:30'",
          "Testigo 4 (vigilante): 'Las cámaras del pasillo de emergencia no funcionaban'",
          "Testigo 5 (empleado): 'Escuché ruidos en el almacén alrededor de las 23:19'",
          "Testigo 6 (seguridad): 'El sistema de alarmas se desactivó brevemente a las 23:20'",
          "Testigo 7 (guardia): 'Escuché pasos en el pasillo de emergencia a las 23:24'",
          "Testigo 8 (limpieza): 'Encontré restos de productos químicos en el pasillo norte'",
        ],
        CARTOGRAFO: [
          "Mapa completo del instituto: 10 puntos clave identificados",
          "Ruta directa más corta: A → B → D → E (pero expuesta)",
          "Ruta alternativa 1: A → B → C → E (evita D, pero incompleta)",
          "Ruta alternativa 2: A → B → F → G → H → C → E (completa y discreta)",
          "Zonas sin cámaras: Almacén de Reactivos (F), Pasillo Norte (H), Pasillo de Emergencia (C)",
          "Zonas con cámaras deshabilitadas: Salida Trasera (E) 23:15-23:25",
          "Puntos de acceso: Entrada Principal (A) y Salida Trasera (E)",
          "Punto crítico: Almacén de Reactivos (F) contiene productos químicos necesarios",
          "Punto crítico: Sala de Control de Seguridad (G) permite desactivar alarmas",
          "Distancia total de la ruta correcta: Aproximadamente 200 metros",
        ],
        PERITO_FORENSE: [
          "Evidencia de objeto contundente en el Punto B",
          "Reactivos químicos robados del almacén (Punto F): Productos específicos",
          "Objeto metálico encontrado en el Punto B: Tubo de ensayo roto",
          "Fibras de bata de laboratorio en el Punto A: Ropa del asesino",
          "ADN parcial tipo AB+ en el Punto B: Coincide con sangre",
          "Huellas dactilares parciales en el Punto B: Guantes dañados",
          "Fragmentos de vidrio en el Punto B: Objeto contundente",
          "Rastro de productos químicos desde el Punto F hasta el Punto C",
          "Cable eléctrico manipulado en el Punto F: Herramienta usada",
          "Restos de productos químicos en el Punto H: Mochila o equipo",
        ],
        ARCHIVISTA: [
          "Expediente del sospechoso principal: Conocía el instituto en detalle",
          "Planos antiguos muestran acceso por Punto A (entrada principal)",
          "Registro de visitas previas al Punto B (laboratorio 3)",
          "Historial de acceso al almacén (Punto F): Última vez hace 1 mes",
          "Registro de acceso a la sala de control (Punto G): No autorizado",
          "Expediente de seguridad: El punto G requiere código especial",
          "Archivo de reactivos: Productos químicos reportados como faltantes",
          "Registro de alarmas: Desactivación no autorizada a las 23:20",
          "Expediente de personal: Conocimiento del sistema de seguridad",
        ],
        COMUNICACIONES: [
          "Cámara en Punto A: Grabó entrada a las 23:10",
          "Cámara en Punto B: Deshabilitada 23:10-23:20",
          "Cámara en Punto F: Sin cámaras (almacén interno)",
          "Cámara en Punto G: Grabó acceso no autorizado 23:20-23:22",
          "Cámara en Punto H: Sin cámaras (pasillo de servicio)",
          "Cámara en Punto C: Sin cámaras (pasillo de emergencia)",
          "Cámara en Punto D: Funcionando normalmente (no visitado)",
          "Cámara en Punto E: Deshabilitada 23:15-23:25",
          "Sistema de alarmas: Desactivado brevemente 23:20-23:22",
          "Logs del sistema: Borrados desde el Punto G",
        ],
        TESTIMONIOS: [
          "Testigo A: 'Vi a alguien con bata de laboratorio entrar a las 23:10'",
          "Testigo B: 'Escuché algo romperse en el laboratorio a las 23:18'",
          "Testigo C: 'Un coche blanco salió del estacionamiento trasero a las 23:28'",
          "Testigo D: 'Escuché ruidos en el almacén alrededor de las 23:19'",
          "Testigo E: 'Las luces del pasillo norte parpadearon a las 23:22'",
          "Testigo F: 'Vi un destello de luz cerca del pasillo de emergencia a las 23:24'",
          "Testigo G: 'Un coche blanco salió a gran velocidad a las 23:28'",
          "Testigo H: 'Escuché un zumbido eléctrico alrededor de las 23:20'",
        ],
        PERFILADOR: [
          "Perfil del asesino: Conocimiento técnico avanzado",
          "Preferencia por rutas con cobertura y zonas oscuras",
          "Planificación meticulosa: Conocía puntos ciegos del sistema",
          "Comportamiento: Evitó áreas con alta visibilidad (D, I, J)",
          "Método: Usó objeto contundente y productos químicos",
          "Motivación: Venganza o protección de secretos",
          "Conocimiento: Familiarizado con el sistema de seguridad",
          "Preparación: Trajo herramientas pero también robó reactivos",
          "Escape: Limpió evidencia en puntos críticos",
        ],
        INTERPRETE_MENSAJES: [
          "Código encontrado en la pared del Punto B: 'A-B-F-G-H-C-E'",
          "Nota encontrada en el Punto F: 'Evitar D, I, J - demasiado expuesto'",
          "Mensaje en el Punto G: 'La salida está en E, tiempo limitado'",
          "Código numérico en el Punto H: '23:10-23:30' (ventana de tiempo)",
          "Mensaje críptico: 'Seguir la ruta de los reactivos'",
          "Nota en el Punto B: 'El protocolo está aquí, pero cuidado con las alarmas'",
          "Código de acceso encontrado: Relacionado con el Punto G",
        ],
      },
    },
    phase4: {
      requiredPatterns: 8,
      finalCalculation: "Suma todos los números únicos (2+3+1+8+9=23), último dígito es 3",
      subPuzzles: [
        {
          id: "puzzle-4-1",
          question: "¿Cuántos números únicos aparecen en todos los patrones combinados? (Solo el número)",
          correctAnswer: "5",
          hints: [
            "Combina todos los patrones visuales",
            "Cuenta los números únicos (sin repetir)",
            "Los números son: 2, 3, 1, 8, 9",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-4-2",
          question: "¿Cuál es la suma de todos los números únicos mencionados en los patrones?",
          correctAnswer: "23",
          hints: [
            "Suma: 2 + 3 + 1 + 8 + 9",
            "El resultado es un número de dos dígitos",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-4-3",
          question: "¿Cuál es el último dígito de la suma de todos los números únicos?",
          correctAnswer: "3",
          hints: [
            "La suma es 23",
            "El último dígito de 23 es 3",
            "Este es el último dígito del candado",
          ],
          unlocksNext: true,
        },
      ],
      patterns: {
        ANALISTA_TIEMPOS: {
          visual: "Patrón temporal: 2-3-1-8-9",
          audio: "Sonido: TIC-TAC-TIC-TAC-TIC",
          hint: "El patrón sigue una secuencia temporal",
        },
        EXPERTO_HUELLAS: {
          visual: "Secuencia: A-B-C-D-E",
          audio: "Sonido: TON-TON-TON-TON-TON",
          hint: "Cada elemento tiene un valor numérico",
        },
        ENTREVISTADOR: {
          visual: "Código: 9-1-8-3-2",
          audio: "Sonido: BEEP-BEEP-BEEP-BEEP-BEEP",
          hint: "La secuencia está reorganizada",
        },
        CARTOGRAFO: {
          visual: "Orden: 3-2-1-9-8",
          audio: "Sonido: DING-DONG-DING-DONG-DING",
          hint: "Los números están mezclados",
        },
        PERITO_FORENSE: {
          visual: "Secuencia: 8-2-3-1-9",
          audio: "Sonido: CLICK-CLICK-CLICK-CLICK-CLICK",
          hint: "Hay un patrón oculto en el orden",
        },
        ARCHIVISTA: {
          visual: "Código: 1-3-9-2-8",
          audio: "Sonido: POP-POP-POP-POP-POP",
          hint: "Sigue una secuencia alternada",
        },
        COMUNICACIONES: {
          visual: "Patrón: 3-9-8-1-2",
          audio: "Sonido: BUZZ-BUZZ-BUZZ-BUZZ-BUZZ",
          hint: "El orden es importante",
        },
        TESTIMONIOS: {
          visual: "Secuencia: 2-8-1-9-3",
          audio: "Sonido: CHIME-CHIME-CHIME-CHIME-CHIME",
          hint: "Suma todos los números únicos",
        },
        PERFILADOR: {
          visual: "Código: 8-1-3-9-2",
          audio: "Sonido: TONE-TONE-TONE-TONE-TONE",
          hint: "El último dígito es la suma módulo 10",
        },
        INTERPRETE_MENSAJES: {
          visual: "Patrón: 2+3+1+8+9 = 23 → último dígito: 3",
          audio: "Sonido: FINAL-FINAL-FINAL-FINAL-FINAL",
          hint: "Suma todos los números únicos y toma el último dígito",
        },
      },
      correctAnswer: "3",
      fifthDigit: "3",
    },
    finalCode: "23392",
    finalNarrative:
      "El caso del Asesinato en el Laboratorio ha sido resuelto. Michael Torres, el ex-empleado despedido, utilizó su conocimiento de los códigos de acceso y puntos ciegos del sistema para entrar al instituto y asesinar al Prof. Whitaker. El motivo fue una disputa sobre acceso a datos de investigación. El protocolo experimental destruido contenía información que podría haber expuesto actividades ilegales. La ruta A-B-C-E le permitió usar la entrada principal (confiando en su conocimiento del sistema) y escapar por la salida de emergencia. El código 23392 abre la caja que contiene la evidencia final: un USB con los datos robados y la confesión grabada.",
    interPhaseChallenges: [
      {
        betweenPhases: [1, 2],
        challenge: {
          id: "challenge-1-2-lab",
          name: "El Brindis del Científico",
          description: "Para avanzar a la siguiente fase, cada jugador debe beberse una cerveza entera (o bebida equivalente).",
          instruction: "Cada jugador debe beberse completamente una cerveza (o bebida no alcohólica equivalente). El host debe confirmar que todos han completado el desafío.",
          timeLimit: 300,
          requiresConfirmation: true,
          failureConsequence: "El jugador que no complete el desafío será eliminado y perderá todas sus pistas.",
        },
      },
      {
        betweenPhases: [2, 3],
        challenge: {
          id: "challenge-2-3-lab",
          name: "La Prueba de Resistencia",
          description: "Para acceder a la ruta del asesino, todos deben hacer 25 flexiones (o 40 sentadillas si no pueden hacer flexiones).",
          instruction: "Cada jugador debe completar 25 flexiones (o 40 sentadillas como alternativa). Los demás jugadores deben contar y confirmar.",
          timeLimit: 180,
          requiresConfirmation: true,
          failureConsequence: "El jugador que no complete el desafío será eliminado y perderá todas sus pistas.",
        },
      },
      {
        betweenPhases: [3, 4],
        challenge: {
          id: "challenge-3-4-lab",
          name: "El Equilibrio del Perito",
          description: "Antes de abrir la Caja Grey, todos deben mantener el equilibrio en un pie durante 45 segundos.",
          instruction: "Cada jugador debe mantenerse en equilibrio sobre un pie durante 45 segundos consecutivos. Los demás deben cronometrar y confirmar.",
          timeLimit: 300,
          requiresConfirmation: true,
          failureConsequence: "El jugador que no complete el desafío será eliminado y perderá todas sus pistas.",
        },
      },
    ],
  },
  
  {
    id: "case-003",
    name: "La Desaparición del Director",
    victim: "Director Carlos Mendoza",
    location: "Sede Corporativa TechCorp",
    phase1: {
      correctTime: "01:33",
      correctAnswer: "UNATREINTAYTRES",
      suspects: [
        {
          id: "suspect-1",
          name: "Ana Rodríguez",
          alibi: "En reunión hasta las 01:00",
          motive: "Ascenso denegado, resentimiento",
          timeline: "Última vez vista: 01:25 en el ascensor",
          physicalEvidence: [
            "ADN en el ascensor: Tipo B positivo",
            "Huellas en el botón del piso 15: Parciales",
            "Registro de tarjeta: Usada a las 01:25",
          ],
        },
        {
          id: "suspect-2",
          name: "David Kim",
          alibi: "Trabajando desde casa",
          motive: "Acceso a sistemas financieros, posible fraude",
          timeline: "Login remoto registrado: 01:20",
          physicalEvidence: [
            "ADN en el escritorio: Tipo O positivo",
            "Huellas en el teclado: Borradas con paño",
            "Registro de login: IP del edificio a las 01:20",
          ],
        },
        {
          id: "suspect-3",
          name: "Elena Vasquez",
          alibi: "Sin confirmar",
          motive: "Relación personal con la víctima, posible chantaje",
          timeline: "Tarjeta de acceso usada: 01:28",
          physicalEvidence: [
            "ADN en la oficina: Tipo A positivo",
            "Huellas en el teléfono: Guantes de cuero",
            "Registro de tarjeta: Usada a las 01:28",
          ],
        },
      ],
      subPuzzles: [
        {
          id: "puzzle-1-1",
          question: "¿Quién tiene evidencia física que coincide con el momento exacto del crimen? (Nombre completo)",
          correctAnswer: "ELENA VASQUEZ",
          hints: [
            "Revisa las huellas en el teléfono",
            "Compara los tiempos de acceso",
            "La tarjeta usada a las 01:28 es clave",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-1-2",
          question: "¿Cuál es la diferencia en minutos entre la desactivación y reactivación de la alarma?",
          correctAnswer: "10",
          hints: [
            "Alarma desactivada: 01:30",
            "Alarma reactivada: 01:40",
            "Calcula la diferencia",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-1-3",
          question: "Basado en los testimonios, ¿a qué hora exacta ocurrió el crimen? (Formato: HH:MM)",
          correctAnswer: "01:33",
          hints: [
            "El guardia escuchó una discusión",
            "El testigo B escuchó un golpe sordo",
            "Ambos coinciden en el mismo momento",
          ],
          unlocksNext: true,
        },
      ],
      intermediateAnswers: ["ELENA VASQUEZ", "10", "01:33"],
      clues: {
        ANALISTA_TIEMPOS: [
          "Cierre de oficinas: 20:00",
          "Sistema de seguridad activado: 20:30",
          "Alarma desactivada: 01:30",
          "Alarma reactivada: 01:40",
          "Tiempo de ventana: 10 minutos",
        ],
        EXPERTO_HUELLAS: [
          "Huellas en el escritorio: Guantes de cuero",
          "Huellas en el teléfono: Borradas con paño",
          "Rastros de cera de vela en el suelo",
        ],
        ENTREVISTADOR: [
          'Guardia de seguridad: "Escuché una discusión a las 01:33"',
          'Limpieza nocturna: "Vi luces en el piso 15 a las 01:31"',
          'Recepción: "Una persona salió corriendo a las 01:38"',
        ],
        CARTOGRAFO: [
          "Punto A: Entrada principal (cámara funcionando)",
          "Punto B: Ascensor principal (cámara funcionando)",
          "Punto C: Pasillo del piso 15 (cámara deshabilitada 01:25-01:35)",
          "Punto D: Oficina del director (sin cámara interior)",
          "Punto E: Escalera de emergencia (sin cámara)",
        ],
        PERITO_FORENSE: [
          "Arma: Objeto contundente, posiblemente trofeo de escritorio",
          "Herida: Impacto en la sien izquierda",
          "Sin signos de resistencia, posiblemente drogado",
        ],
        ARCHIVISTA: [
          "Expediente Ana Rodríguez: Evaluación negativa reciente",
          "Expediente David Kim: Investigación de fraude en curso",
          "Expediente Elena Vasquez: Relación personal documentada",
        ],
        COMUNICACIONES: [
          "Última llamada del director: 01:25 a su abogado",
          "SMS recibido a las 01:32: 'Tenemos que hablar ahora'",
          "Email enviado a las 01:35: 'Es urgente'",
        ],
        TESTIMONIOS: [
          'Testigo A: "Vi a alguien con maletín negro entrar al ascensor"',
          'Testigo B: "Escuché un golpe sordo alrededor de las 01:33"',
          'Testigo C: "Un coche deportivo salió del estacionamiento"',
        ],
        PERFILADOR: [
          "Perfil: Conocimiento interno de la empresa",
          "Motivación: Venganza, chantaje o protección de secretos",
          "Planificación: Conocía los horarios y protocolos",
        ],
        INTERPRETE_MENSAJES: [
          "Código en la pantalla: '01-33-05'",
          "Nota encontrada: 'El momento perfecto'",
          "Mensaje críptico: 'Todo a su tiempo'",
        ],
      },
    },
    phase2: {
      documentType: "Contrato de confidencialidad",
      correctKeyword: "CONFIDENCIAL",
      secondDigit: "5",
      requiredFragments: 15,
      codeToUnlock: "TC-2024-334",
      subPuzzles: [
        {
          id: "puzzle-2-1",
          question: "¿Cuál es el número de expediente mencionado en los fragmentos? (Formato: TC-YYYY-XXX)",
          correctAnswer: "TC-2024-334",
          hints: [
            "Busca en los fragmentos del Archivista",
            "Formato: Letras-GUION-Año-GUION-Números",
            "Aparece en uno de los fragmentos publicados",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-2-2",
          question: "¿Qué tipo de documento fue destruido según los fragmentos?",
          correctAnswer: "CONFIDENCIAL",
          hints: [
            "Busca en los fragmentos del Entrevistador",
            "Es una palabra relacionada con secretos corporativos",
            "Aparece en mayúsculas en los fragmentos",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-2-3",
          question: "¿Cuál es la palabra clave que aparece en todos los fragmentos relacionados con el documento?",
          correctAnswer: "CONFIDENCIAL",
          hints: [
            "Aparece en los fragmentos del Intérprete de Mensajes",
            "Es el tipo de documento principal",
            "Está relacionado con acuerdos corporativos",
          ],
          unlocksNext: true,
        },
      ],
      fragments: {
        ANALISTA_TIEMPOS: [
          "El documento fue destruido el...",
          "...22 de febrero de 2024...",
          "...a las 19:15 según el registro del sistema...",
        ],
        EXPERTO_HUELLAS: [
          "...papel corporativo, marca...",
          "...TechCorp Premium 90gsm...",
          "...impreso con impresora de red corporativa...",
        ],
        ENTREVISTADOR: [
          "...contenía información sobre...",
          "...un acuerdo CONFIDENCIAL de alto nivel...",
          "...relacionado con fusiones empresariales...",
        ],
        CARTOGRAFO: [
          "...el documento mencionaba...",
          "...una ubicación específica...",
          "...Piso 15, Oficina del Director...",
        ],
        PERITO_FORENSE: [
          "...fue cortado con precisión...",
          "...usando una herramienta de corte profesional...",
          "...probablemente una cuchilla de oficina...",
        ],
        ARCHIVISTA: [
          "...pertenecía al expediente...",
          "...número de caso: TC-2024-334...",
          "...clasificado como ULTRA CONFIDENCIAL...",
        ],
        COMUNICACIONES: [
          "...había una nota escrita a mano...",
          "...decía: 'Este documento CONFIDENCIAL debe desaparecer'...",
          "...firmada con las iniciales 'C.M.'...",
        ],
        TESTIMONIOS: [
          "...un testigo vio el documento...",
          "...antes de ser destruido...",
          "...en las manos de alguien con traje ejecutivo...",
        ],
        PERFILADOR: [
          "...el estilo de escritura sugiere...",
          "...una persona con formación ejecutiva...",
          "...posiblemente con conocimiento legal corporativo...",
        ],
        INTERPRETE_MENSAJES: [
          "...había números escritos: 5-2-1-7...",
          "...y una palabra clave: 'CONFIDENCIAL'...",
          "...todo relacionado con el acuerdo...",
        ],
      },
    },
    phase3: {
      correctRoute: "ABFGHCDE",
      thirdDigit: "7",
      fourthDigit: "4",
      mapPoints: [
        { 
          id: "A", 
          name: "Entrada Principal", 
          x: 5, 
          y: 90, 
          hasCamera: true, 
          isDark: false,
          evidence: ["Cámara grabó entrada 01:28", "Huellas en la puerta talla 40", "Tarjeta de acceso usada", "Restos de perfume", "Marca de maletín ejecutivo"],
        },
        { 
          id: "B", 
          name: "Ascensor Principal", 
          x: 30, 
          y: 30, 
          hasCamera: true, 
          isDark: false,
          evidence: ["Cámara grabó uso 01:29-01:31", "Huellas en botones del piso 15", "Rastro de maletín negro", "Fibras de traje ejecutivo", "Restos de cera de vela"],
        },
        { 
          id: "C", 
          name: "Pasillo Piso 15", 
          x: 70, 
          y: 50, 
          hasCamera: false, 
          isDark: false,
          evidence: ["Cámara deshabilitada 01:25-01:35", "Fibras de alfombra corporativa", "Sin cámaras", "Marca de arrastre", "Restos de cera de vela"],
        },
        { 
          id: "D", 
          name: "Oficina del Director", 
          x: 80, 
          y: 50, 
          hasCamera: false, 
          isDark: false,
          evidence: ["Evidencia de lucha", "Objeto contundente (trofeo)", "ADN tipo A+", "Huellas dactilares parciales", "Fragmentos de vidrio"],
        },
        { 
          id: "E", 
          name: "Escalera de Emergencia", 
          x: 95, 
          y: 10, 
          hasCamera: false, 
          isDark: true,
          evidence: ["Sin huellas (limpiado profesionalmente)", "Sin cámaras", "Rastro de escape", "Restos de líquido limpiador", "Fibras de guantes"],
        },
        { 
          id: "F", 
          name: "Sala de Archivos", 
          x: 50, 
          y: 70, 
          hasCamera: false, 
          isDark: true,
          evidence: ["Documentos robados del archivo", "Caja de archivos abierta", "Huellas en el polvo", "Cable eléctrico manipulado", "Rastro de papel"],
        },
        { 
          id: "G", 
          name: "Sala de Servidores", 
          x: 60, 
          y: 40, 
          hasCamera: true, 
          isDark: false,
          evidence: ["Sistema de seguridad manipulado", "Registro de acceso no autorizado", "Código de desactivación usado", "Logs del sistema borrados", "Sin evidencia física"],
        },
        { 
          id: "H", 
          name: "Pasillo Norte", 
          x: 50, 
          y: 50, 
          hasCamera: false, 
          isDark: true,
          evidence: ["Rastros de movimiento reciente", "Fibras de traje ejecutivo", "Marca de maletín en la pared", "Restos de documentos", "Huellas parciales"],
        },
        { 
          id: "I", 
          name: "Oficina de Recursos Humanos", 
          x: 20, 
          y: 60, 
          hasCamera: true, 
          isDark: false,
          evidence: ["Sin evidencia de entrada", "Cámara funcionando normalmente", "No visitado por el asesino"],
        },
        { 
          id: "J", 
          name: "Vestíbulo Principal", 
          x: 40, 
          y: 10, 
          hasCamera: true, 
          isDark: false,
          evidence: ["Sin actividad sospechosa", "Cámara grabó actividad normal", "No parte de la ruta"],
        },
      ],
      timeConstraints: [
        { from: "01:28", to: "01:29", point: "A" },
        { from: "01:29", to: "01:31", point: "B" },
        { from: "01:31", to: "01:32", point: "F" },
        { from: "01:32", to: "01:33", point: "G" },
        { from: "01:33", to: "01:33", point: "H" },
        { from: "01:33", to: "01:34", point: "C" },
        { from: "01:34", to: "01:36", point: "D" },
        { from: "01:36", to: "01:40", point: "E" },
      ],
      subPuzzles: [
        {
          id: "puzzle-3-1",
          question: "¿Cuántos puntos tienen evidencia de ADN, huellas o documentos? (Solo el número)",
          correctAnswer: "6",
          hints: [
            "Revisa la evidencia en cada punto del mapa",
            "Cuenta los puntos con ADN, huellas o documentos",
            "No cuentes los que solo tienen evidencia de cámaras o sin evidencia",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-3-2",
          question: "¿Qué punto tiene documentos robados y está en zona oscura? (Solo la letra)",
          correctAnswer: "F",
          hints: [
            "Revisa la evidencia en cada punto",
            "Busca el punto con documentos robados",
            "Debe estar en zona oscura (isDark: true)",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-3-3",
          question: "¿Qué punto tiene el sistema de seguridad manipulado? (Solo la letra)",
          correctAnswer: "G",
          hints: [
            "Revisa la evidencia en cada punto",
            "Busca el punto relacionado con seguridad",
            "Debe tener evidencia de manipulación",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-3-4",
          question: "¿Cuántos puntos NO tienen cámaras y están en zona oscura? (Solo el número)",
          correctAnswer: "3",
          hints: [
            "Revisa las propiedades de cada punto",
            "Cuenta los que tienen hasCamera: false e isDark: true",
            "Son puntos clave para pasar desapercibido",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-3-5",
          question: "¿Qué punto tiene evidencia de ADN tipo A+? (Solo la letra)",
          correctAnswer: "D",
          hints: [
            "Revisa la evidencia en cada punto",
            "Busca el punto con ADN",
            "El tipo de sangre es A+",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-3-6",
          question: "Basado en las restricciones de tiempo y evidencia, ¿cuál es la ruta completa del asesino? (Letras sin espacios, ejemplo: ABFGHCDE)",
          correctAnswer: "ABFGHCDE",
          hints: [
            "La ruta debe permitir llegar de A a E en el tiempo disponible",
            "Debe pasar por el punto con documentos (F)",
            "Debe pasar por el punto con seguridad manipulado (G)",
            "Debe pasar por el punto con ADN (D)",
            "Evita puntos con cámaras activas",
            "Considera las zonas oscuras para pasar desapercibido",
          ],
          unlocksNext: true,
        },
      ],
      routeClues: {
        ANALISTA_TIEMPOS: [
          "El asesino llegó al edificio a las 01:28 exactamente",
          "Tiempo de desplazamiento entre puntos: 1-2 minutos",
          "Tiempo total de la operación: 12 minutos",
          "La alarma se activó a las 01:40, momento de escape",
          "Ventana de tiempo crítica: 01:28-01:40",
          "Punto A: Llegada 01:28, salida 01:29",
          "Punto B: Llegada 01:29, salida 01:31",
          "Punto F: Llegada 01:31, salida 01:32",
          "Punto G: Llegada 01:32, salida 01:33",
          "Punto H: Llegada 01:33, salida 01:33",
          "Punto C: Llegada 01:33, salida 01:34",
          "Punto D: Llegada 01:34, salida 01:36",
          "Punto E: Llegada 01:36, salida 01:40",
        ],
        EXPERTO_HUELLAS: [
          "Huellas en la entrada principal (Punto A): Talla 40, zapatos de cuero",
          "Rastros en el ascensor (Punto B): Huellas en botones del piso 15",
          "Huellas en el polvo del archivo (Punto F): Mismo tipo de calzado",
          "Sin huellas en la sala de servidores (Punto G): Usó guantes",
          "Huellas parciales en el pasillo norte (Punto H)",
          "ADN tipo A+ en el Punto D: Coincide con sospechoso",
          "Sin huellas en la escalera de emergencia (Punto E): Limpiado profesionalmente",
          "Rastro de documentos desde el Punto F hasta el Punto H",
          "Fibras de guantes de cuero encontradas en múltiples puntos",
        ],
        ENTREVISTADOR: [
          "Testigo 1 (guardia): 'Escuché una discusión a las 01:33'",
          "Testigo 2 (limpieza nocturna): 'Vi luces en el piso 15 a las 01:31'",
          "Testigo 3 (recepción): 'Una persona salió corriendo a las 01:38'",
          "Testigo 4 (vigilante): 'Las cámaras del pasillo del piso 15 no funcionaban'",
          "Testigo 5 (empleado): 'Escuché ruidos en la sala de archivos alrededor de las 01:32'",
          "Testigo 6 (seguridad): 'El sistema de alarmas se desactivó brevemente a las 01:33'",
          "Testigo 7 (guardia): 'Escuché pasos en el pasillo del piso 15 a las 01:34'",
          "Testigo 8 (limpieza): 'Encontré restos de documentos en el pasillo norte'",
        ],
        CARTOGRAFO: [
          "Mapa completo del edificio: 10 puntos clave identificados",
          "Ruta directa más corta: A → B → C → D → E (pero expuesta)",
          "Ruta alternativa 1: A → B → D → E (evita C, pero incompleta)",
          "Ruta alternativa 2: A → B → F → G → H → C → D → E (completa y discreta)",
          "Zonas sin cámaras: Sala de Archivos (F), Pasillo Norte (H), Escalera de Emergencia (E)",
          "Zonas con cámaras deshabilitadas: Pasillo Piso 15 (C) 01:25-01:35",
          "Puntos de acceso: Entrada Principal (A) y Escalera de Emergencia (E)",
          "Punto crítico: Sala de Archivos (F) contiene documentos necesarios",
          "Punto crítico: Sala de Servidores (G) permite desactivar alarmas",
          "Distancia total de la ruta correcta: Aproximadamente 150 metros",
        ],
        PERITO_FORENSE: [
          "Evidencia de objeto contundente en el Punto D",
          "Documentos robados del archivo (Punto F): Contratos confidenciales",
          "Objeto metálico encontrado en el Punto D: Trofeo de escritorio",
          "Fibras de traje ejecutivo en el Punto A: Ropa del asesino",
          "ADN parcial tipo A+ en el Punto D: Coincide con sospechoso",
          "Huellas dactilares parciales en el Punto D: Guantes dañados",
          "Fragmentos de vidrio en el Punto D: Objeto contundente",
          "Rastro de documentos desde el Punto F hasta el Punto H",
          "Cable eléctrico manipulado en el Punto F: Herramienta usada",
          "Restos de documentos en el Punto H: Maletín o equipo",
        ],
        ARCHIVISTA: [
          "Expediente del sospechoso principal: Conocía el edificio en detalle",
          "Planos antiguos muestran acceso por Punto A (entrada principal)",
          "Registro de visitas previas al Punto D (oficina del director)",
          "Historial de acceso a la sala de archivos (Punto F): Última vez hace 3 días",
          "Registro de acceso a la sala de servidores (Punto G): No autorizado",
          "Expediente de seguridad: El punto G requiere código especial",
          "Archivo de documentos: Contratos confidenciales reportados como faltantes",
          "Registro de alarmas: Desactivación no autorizada a las 01:33",
          "Expediente de personal: Conocimiento del sistema de seguridad",
        ],
        COMUNICACIONES: [
          "Cámara en Punto A: Grabó entrada a las 01:28",
          "Cámara en Punto B: Grabó uso del ascensor 01:29-01:31",
          "Cámara en Punto F: Sin cámaras (sala de archivos interna)",
          "Cámara en Punto G: Grabó acceso no autorizado 01:32-01:33",
          "Cámara en Punto H: Sin cámaras (pasillo de servicio)",
          "Cámara en Punto C: Deshabilitada 01:25-01:35",
          "Cámara en Punto D: Sin cámaras (oficina privada)",
          "Cámara en Punto E: Sin cámaras (escalera de emergencia)",
          "Sistema de alarmas: Desactivado brevemente 01:33-01:34",
          "Logs del sistema: Borrados desde el Punto G",
        ],
        TESTIMONIOS: [
          "Testigo A: 'Vi a alguien con maletín negro entrar al ascensor a las 01:29'",
          "Testigo B: 'Escuché un golpe sordo alrededor de las 01:33'",
          "Testigo C: 'Un coche deportivo salió del estacionamiento a las 01:39'",
          "Testigo D: 'Escuché ruidos en la sala de archivos alrededor de las 01:32'",
          "Testigo E: 'Las luces del pasillo norte parpadearon a las 01:33'",
          "Testigo F: 'Vi un destello de luz cerca de la oficina del director a las 01:35'",
          "Testigo G: 'Un coche deportivo salió a gran velocidad a las 01:39'",
          "Testigo H: 'Escuché un zumbido eléctrico alrededor de las 01:33'",
        ],
        PERFILADOR: [
          "Perfil del asesino: Conocimiento técnico avanzado",
          "Preferencia por rutas con cobertura y zonas oscuras",
          "Planificación meticulosa: Conocía puntos ciegos del sistema",
          "Comportamiento: Evitó áreas con alta visibilidad (I, J)",
          "Método: Usó objeto contundente y documentos",
          "Motivación: Venganza, chantaje o protección de secretos",
          "Conocimiento: Familiarizado con el sistema de seguridad",
          "Preparación: Trajo herramientas pero también robó documentos",
          "Escape: Limpió evidencia en puntos críticos",
        ],
        INTERPRETE_MENSAJES: [
          "Código encontrado en la pared del Punto B: 'A-B-F-G-H-C-D-E'",
          "Nota encontrada en el Punto F: 'Evitar I, J - demasiado expuesto'",
          "Mensaje en el Punto G: 'La salida está en E, tiempo limitado'",
          "Código numérico en el Punto H: '01:28-01:40' (ventana de tiempo)",
          "Mensaje críptico: 'Seguir la ruta de los documentos'",
          "Nota en el Punto D: 'El contrato está aquí, pero cuidado con las alarmas'",
          "Código de acceso encontrado: Relacionado con el Punto G",
        ],
      },
    },
    phase4: {
      requiredPatterns: 8,
      finalCalculation: "Suma todos los números únicos (1+3+5+7=16), último dígito es 6",
      subPuzzles: [
        {
          id: "puzzle-4-1",
          question: "¿Cuántos números únicos aparecen en todos los patrones combinados? (Solo el número)",
          correctAnswer: "4",
          hints: [
            "Combina todos los patrones visuales",
            "Cuenta los números únicos (sin repetir)",
            "Los números son: 1, 3, 5, 7",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-4-2",
          question: "¿Cuál es la suma de todos los números únicos mencionados en los patrones?",
          correctAnswer: "16",
          hints: [
            "Suma: 1 + 3 + 5 + 7",
            "El resultado es un número de dos dígitos",
          ],
          unlocksNext: true,
        },
        {
          id: "puzzle-4-3",
          question: "¿Cuál es el último dígito de la suma de todos los números únicos?",
          correctAnswer: "6",
          hints: [
            "La suma es 16",
            "El último dígito de 16 es 6",
            "Este es el último dígito del candado",
          ],
          unlocksNext: true,
        },
      ],
      patterns: {
        ANALISTA_TIEMPOS: {
          visual: "Patrón temporal: 1-3-3-5-7",
          audio: "Sonido: TIC-TAC-TIC-TAC-TIC",
          hint: "El patrón sigue una secuencia temporal",
        },
        EXPERTO_HUELLAS: {
          visual: "Secuencia: A-B-C-D-E",
          audio: "Sonido: TON-TON-TON-TON-TON",
          hint: "Cada elemento tiene un valor numérico",
        },
        ENTREVISTADOR: {
          visual: "Código: 7-5-3-1-3",
          audio: "Sonido: BEEP-BEEP-BEEP-BEEP-BEEP",
          hint: "La secuencia está reorganizada",
        },
        CARTOGRAFO: {
          visual: "Orden: 3-1-5-7-3",
          audio: "Sonido: DING-DONG-DING-DONG-DING",
          hint: "Los números están mezclados",
        },
        PERITO_FORENSE: {
          visual: "Secuencia: 5-1-3-7-3",
          audio: "Sonido: CLICK-CLICK-CLICK-CLICK-CLICK",
          hint: "Hay un patrón oculto en el orden",
        },
        ARCHIVISTA: {
          visual: "Código: 1-5-7-3-3",
          audio: "Sonido: POP-POP-POP-POP-POP",
          hint: "Sigue una secuencia alternada",
        },
        COMUNICACIONES: {
          visual: "Patrón: 3-7-5-1-3",
          audio: "Sonido: BUZZ-BUZZ-BUZZ-BUZZ-BUZZ",
          hint: "El orden es importante",
        },
        TESTIMONIOS: {
          visual: "Secuencia: 3-3-1-7-5",
          audio: "Sonido: CHIME-CHIME-CHIME-CHIME-CHIME",
          hint: "Suma todos los números únicos",
        },
        PERFILADOR: {
          visual: "Código: 7-1-3-5-3",
          audio: "Sonido: TONE-TONE-TONE-TONE-TONE",
          hint: "El último dígito es la suma módulo 10",
        },
        INTERPRETE_MENSAJES: {
          visual: "Patrón: 1+3+3+5+7 = 19 → último dígito: 9",
          audio: "Sonido: FINAL-FINAL-FINAL-FINAL-FINAL",
          hint: "Suma todos los números únicos y toma el último dígito",
        },
      },
      correctAnswer: "9",
      fifthDigit: "9",
    },
    finalCode: "13574",
    finalNarrative:
      "El caso de la Desaparición del Director ha sido resuelto. Ana Rodríguez, la empleada con el ascenso denegado, utilizó su conocimiento interno de la empresa y acceso a las oficinas para asesinar al Director Mendoza. El motivo fue una combinación de resentimiento personal y conocimiento de información confidencial sobre fusiones empresariales que la habrían beneficiado. El documento destruido contenía un acuerdo confidencial que podría haber expuesto actividades ilegales. La ruta A-B-C-D-E fue la más directa, usando el ascensor principal y el pasillo del piso 15 donde las cámaras estaban deshabilitadas. El código 13574 abre la caja que contiene la evidencia final: grabaciones de seguridad adicionales y documentos que prueban el motivo del asesinato.",
    interPhaseChallenges: [
      {
        betweenPhases: [1, 2],
        challenge: {
          id: "challenge-1-2-corp",
          name: "El Brindis Ejecutivo",
          description: "Para avanzar a la siguiente fase, cada jugador debe beberse una cerveza entera (o bebida equivalente).",
          instruction: "Cada jugador debe beberse completamente una cerveza (o bebida no alcohólica equivalente). El host debe confirmar que todos han completado el desafío.",
          timeLimit: 300,
          requiresConfirmation: true,
          failureConsequence: "El jugador que no complete el desafío será eliminado y perderá todas sus pistas.",
        },
      },
      {
        betweenPhases: [2, 3],
        challenge: {
          id: "challenge-2-3-corp",
          name: "La Prueba Corporativa",
          description: "Para acceder a la ruta del asesino, todos deben hacer 30 flexiones (o 50 sentadillas si no pueden hacer flexiones).",
          instruction: "Cada jugador debe completar 30 flexiones (o 50 sentadillas como alternativa). Los demás jugadores deben contar y confirmar.",
          timeLimit: 240,
          requiresConfirmation: true,
          failureConsequence: "El jugador que no complete el desafío será eliminado y perderá todas sus pistas.",
        },
      },
      {
        betweenPhases: [3, 4],
        challenge: {
          id: "challenge-3-4-corp",
          name: "El Equilibrio del Director",
          description: "Antes de abrir la Caja Grey, todos deben mantener el equilibrio en un pie durante 60 segundos.",
          instruction: "Cada jugador debe mantenerse en equilibrio sobre un pie durante 60 segundos consecutivos. Los demás deben cronometrar y confirmar.",
          timeLimit: 360,
          requiresConfirmation: true,
          failureConsequence: "El jugador que no complete el desafío será eliminado y perderá todas sus pistas.",
        },
      },
    ],
  },
];

// Función para obtener un caso aleatorio
export function getRandomCase(): GameCase {
  const randomIndex = Math.floor(Math.random() * gameCases.length);
  return gameCases[randomIndex];
}

// Función para obtener un caso por ID
export function getCaseById(caseId: string): GameCase | undefined {
  return gameCases.find((c) => c.id === caseId);
}

