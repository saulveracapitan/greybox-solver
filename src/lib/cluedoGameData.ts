// Datos maestros para el juego Cluedo
// Estos datos también están en la BD pero los tenemos aquí para referencia rápida

export interface Suspect {
  id: number;
  name: string;
  description?: string;
}

export interface Weapon {
  id: number;
  name: string;
  description?: string;
}

export interface Room {
  id: number;
  name: string;
  description?: string;
}

export interface PuzzleData {
  type: 'CODE' | 'MULTIPLE_CHOICE' | 'ORDER' | 'TEXT_INPUT';
  options?: string[]; // Para MULTIPLE_CHOICE
  correctOrder?: string[]; // Para ORDER
  hint?: string;
}

export interface Puzzle {
  id: string;
  game_id: string;
  room_id?: number;
  type: 'CODE' | 'MULTIPLE_CHOICE' | 'ORDER' | 'TEXT_INPUT';
  title: string;
  question: string;
  data: PuzzleData;
  solution: string;
  solved: boolean;
  solved_at?: string;
  solved_by?: string;
}

export interface Clue {
  id: string;
  game_id: string;
  text: string;
  affects_type: 'SUSPECT' | 'WEAPON' | 'ROOM' | 'NONE';
  affects_id?: number;
  is_private: boolean;
  player_id?: string;
  puzzle_id?: string;
  created_at: string;
}

// Datos por defecto (se cargarán desde la BD pero estos son los valores esperados)
export const DEFAULT_SUSPECTS: Omit<Suspect, 'id'>[] = [
  { name: 'Profesor Plum', description: 'Un académico con un pasado oscuro' },
  { name: 'Señorita Scarlet', description: 'Una actriz de teatro con muchos secretos' },
  { name: 'Coronel Mustard', description: 'Un militar retirado con conexiones sospechosas' },
  { name: 'Señora White', description: 'La cocinera con acceso a toda la casa' },
  { name: 'Señor Green', description: 'Un empresario con negocios turbios' },
  { name: 'Señora Peacock', description: 'Una socialité con influencias políticas' },
];

export const DEFAULT_WEAPONS: Omit<Weapon, 'id'>[] = [
  { name: 'Candelabro', description: 'Un pesado candelabro de plata' },
  { name: 'Daga', description: 'Una daga ceremonial antigua' },
  { name: 'Cañón de plomo', description: 'Un objeto contundente de plomo' },
  { name: 'Revólver', description: 'Un revólver antiguo' },
  { name: 'Cuerda', description: 'Una cuerda gruesa' },
  { name: 'Llave inglesa', description: 'Una herramienta pesada' },
];

export const DEFAULT_ROOMS: Omit<Room, 'id'>[] = [
  { name: 'Biblioteca', description: 'Una biblioteca con estanterías llenas de libros antiguos' },
  { name: 'Cocina', description: 'Una cocina grande con utensilios de cocina' },
  { name: 'Sala de baile', description: 'Un salón espacioso con espejos y candelabros' },
  { name: 'Conservatorio', description: 'Un invernadero con plantas exóticas' },
  { name: 'Comedor', description: 'Un comedor elegante con una mesa larga' },
  { name: 'Sala de billar', description: 'Una sala de recreo con mesa de billar' },
  { name: 'Estudio', description: 'Un estudio privado con escritorio y chimenea' },
  { name: 'Salón', description: 'El salón principal de la mansión' },
  { name: 'Habitación', description: 'Una habitación privada con secretos ocultos' },
];

// Plantillas de puzzles por tipo de sala
export const PUZZLE_TEMPLATES: Record<string, Array<{
  title: string;
  question: string;
  type: Puzzle['type'];
  data: PuzzleData;
  solution: string;
}>> = {
  'Biblioteca': [
    {
      title: 'El Código del Libro',
      question: 'Encuentra el código de 4 dígitos oculto en los libros. Pista: La suma de los números de página de los libros marcados es 42.',
      type: 'CODE',
      data: { hint: 'Busca libros con marcas especiales en las páginas 7, 8, 12 y 15' },
      solution: '7812',
    },
    {
      title: 'El Orden de los Volúmenes',
      question: 'Ordena los libros según su fecha de publicación: 1850, 1923, 1945, 1967',
      type: 'ORDER',
      data: { correctOrder: ['1850', '1923', '1945', '1967'] },
      solution: '1850,1923,1945,1967',
    },
  ],
  'Cocina': [
    {
      title: 'La Receta Secreta',
      question: '¿Cuál es el ingrediente principal mencionado en la receta?',
      type: 'MULTIPLE_CHOICE',
      data: { options: ['Azúcar', 'Sal', 'Pimienta', 'Canela'] },
      solution: 'Sal',
    },
    {
      title: 'El Código del Cofre',
      question: 'El código del cofre es el año en que se construyó la cocina (1892)',
      type: 'CODE',
      data: {},
      solution: '1892',
    },
  ],
  'Sala de baile': [
    {
      title: 'El Baile Perdido',
      question: '¿Cuántas parejas bailaban según el cuadro?',
      type: 'MULTIPLE_CHOICE',
      data: { options: ['3', '4', '5', '6'] },
      solution: '4',
    },
  ],
  'Conservatorio': [
    {
      title: 'La Planta Rara',
      question: 'El código es el número de pétalos de la flor rara (8)',
      type: 'CODE',
      data: {},
      solution: '8',
    },
  ],
  'Comedor': [
    {
      title: 'El Menú del Crimen',
      question: 'Ordena los platos según aparecen en el menú: Entrante, Principal, Postre, Bebida',
      type: 'ORDER',
      data: { correctOrder: ['Entrante', 'Principal', 'Postre', 'Bebida'] },
      solution: 'Entrante,Principal,Postre,Bebida',
    },
  ],
  'Sala de billar': [
    {
      title: 'La Bola Perdida',
      question: '¿Qué número tiene la bola que falta?',
      type: 'MULTIPLE_CHOICE',
      data: { options: ['7', '8', '9', '10'] },
      solution: '8',
    },
  ],
  'Estudio': [
    {
      title: 'El Código del Escritorio',
      question: 'El código es la fecha del diario: 15 de marzo de 1923 (150323)',
      type: 'CODE',
      data: {},
      solution: '150323',
    },
  ],
  'Salón': [
    {
      title: 'El Retrato Misterioso',
      question: '¿Quién aparece en el retrato del salón?',
      type: 'MULTIPLE_CHOICE',
      data: { options: ['El dueño', 'La dueña', 'Un desconocido', 'Nadie'] },
      solution: 'El dueño',
    },
  ],
  'Habitación': [
    {
      title: 'El Código del Cofre',
      question: 'El código del cofre es el año de nacimiento del dueño (1875)',
      type: 'CODE',
      data: {},
      solution: '1875',
    },
  ],
};

// Función para generar código de partida único
export function generateGameCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Función para generar pistas privadas
export function generatePrivateClues(
  solution: { suspect_id: number; weapon_id: number; room_id: number },
  allSuspects: Suspect[],
  allWeapons: Weapon[],
  allRooms: Room[],
  numPlayers: number
): string[] {
  const clues: string[] = [];
  const numClues = Math.max(1, Math.floor(12 / numPlayers)); // Al menos 1, máximo 12 pistas totales

  // Generar pistas que descarten sospechosos, armas o salas
  const wrongSuspects = allSuspects.filter(s => s.id !== solution.suspect_id);
  const wrongWeapons = allWeapons.filter(w => w.id !== solution.weapon_id);
  const wrongRooms = allRooms.filter(r => r.id !== solution.room_id);

  for (let i = 0; i < numClues; i++) {
    const clueType = Math.floor(Math.random() * 3);
    
    if (clueType === 0 && wrongSuspects.length > 0) {
      const suspect = wrongSuspects[Math.floor(Math.random() * wrongSuspects.length)];
      clues.push(`El sospechoso NO es ${suspect.name}`);
    } else if (clueType === 1 && wrongWeapons.length > 0) {
      const weapon = wrongWeapons[Math.floor(Math.random() * wrongWeapons.length)];
      clues.push(`El arma NO es ${weapon.name}`);
    } else if (clueType === 2 && wrongRooms.length > 0) {
      const room = wrongRooms[Math.floor(Math.random() * wrongRooms.length)];
      clues.push(`El crimen NO ocurrió en ${room.name}`);
    }
  }

  return clues;
}

