// Lógica del juego Cluedo tradicional (por turnos)

export type CardType = 'SUSPECT' | 'WEAPON' | 'ROOM';

export interface Card {
  id: string;
  type: CardType;
  name: string;
  shownBy?: string; // ID del jugador que mostró esta carta (si fue mostrada en una refutación)
}

export interface Player {
  id: string;
  name: string;
  cards: Card[];
  isActive: boolean;
  turnOrder: number;
}

export interface Suggestion {
  id: string;
  playerId: string;
  playerName: string;
  suspect: string;
  weapon: string;
  room: string;
  refutedBy?: {
    playerId: string;
    playerName: string;
    cardShown?: Card;
  };
  refutationPath?: Array<{
    playerId: string;
    playerName: string;
    canRefute: boolean | null; // true = refutó, false = no puede, null = pendiente
    turnOrder: number;
  }>;
  createdAt: string;
}

export interface Accusation {
  id: string;
  playerId: string;
  playerName: string;
  suspect: string;
  weapon: string;
  room: string;
  isCorrect: boolean;
  createdAt: string;
}

export interface GameState {
  id: string;
  code: string;
  status: 'LOBBY' | 'PLAYING' | 'FINISHED';
  solution: {
    suspect: string;
    weapon: string;
    room: string;
  };
  players: Player[];
  currentTurnPlayerId: string | null;
  suggestions: Suggestion[];
  accusations: Accusation[];
  turnNumber: number;
  createdAt: string;
}

// Datos maestros del juego (15 sospechosos, 15 armas, 15 habitaciones)
export const SUSPECTS: string[] = [
  'Profesor Plum',
  'Señorita Scarlet',
  'Coronel Mustard',
  'Señora White',
  'Señor Green',
  'Señora Peacock',
  'Doctor Black',
  'Señorita Rose',
  'Capitán Brown',
  'Señor Gray',
  'Señora Violet',
  'Inspector Blue',
  'Señorita Gold',
  'Duque Silver',
  'Condesa Crimson',
];

export const WEAPONS: string[] = [
  'Candelabro',
  'Daga',
  'Cañón de plomo',
  'Revólver',
  'Cuerda',
  'Llave inglesa',
  'Veneno',
  'Hacha',
  'Martillo',
  'Bate de béisbol',
  'Destornillador',
  'Cuchillo de cocina',
  'Lazo',
  'Pistola',
  'Mazo',
];

export const ROOMS: string[] = [
  'Biblioteca',
  'Cocina',
  'Sala de baile',
  'Conservatorio',
  'Comedor',
  'Sala de billar',
  'Estudio',
  'Salón',
  'Habitación',
  'Despacho',
  'Jardín',
  'Sótano',
  'Ático',
  'Vestíbulo',
  'Terraza',
];

// Crear mazo completo de cartas
export function createDeck(): Card[] {
  const cards: Card[] = [];
  
  SUSPECTS.forEach((name, index) => {
    cards.push({
      id: `suspect-${index}`,
      type: 'SUSPECT',
      name,
    });
  });
  
  WEAPONS.forEach((name, index) => {
    cards.push({
      id: `weapon-${index}`,
      type: 'WEAPON',
      name,
    });
  });
  
  ROOMS.forEach((name, index) => {
    cards.push({
      id: `room-${index}`,
      type: 'ROOM',
      name,
    });
  });
  
  return cards;
}

// Mezclar array
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Seleccionar solución secreta
export function selectSolution(deck: Card[]): {
  solution: { suspect: string; weapon: string; room: string };
  remainingCards: Card[];
} {
  const shuffled = shuffle(deck);
  
  const suspect = shuffled.find(c => c.type === 'SUSPECT')!;
  const weapon = shuffled.find(c => c.type === 'WEAPON')!;
  const room = shuffled.find(c => c.type === 'ROOM')!;
  
  const solutionCards = [suspect, weapon, room];
  const remainingCards = shuffled.filter(
    card => !solutionCards.some(sc => sc.id === card.id)
  );
  
  return {
    solution: {
      suspect: suspect.name,
      weapon: weapon.name,
      room: room.name,
    },
    remainingCards: shuffle(remainingCards),
  };
}

// Repartir cartas entre jugadores (con mezcla aleatoria)
export function dealCards(
  cards: Card[],
  numPlayers: number
): Card[][] {
  // Mezclar las cartas antes de repartirlas para asegurar distribución aleatoria
  const shuffledCards = shuffle(cards);
  
  const hands: Card[][] = [];
  const cardsPerPlayer = Math.floor(shuffledCards.length / numPlayers);
  const extraCards = shuffledCards.length % numPlayers;
  
  // Inicializar manos vacías
  for (let i = 0; i < numPlayers; i++) {
    hands.push([]);
  }
  
  // Repartir cartas de manera circular para mejor distribución
  let cardIndex = 0;
  for (let i = 0; i < shuffledCards.length; i++) {
    const playerIndex = i % numPlayers;
    hands[playerIndex].push(shuffledCards[i]);
  }
  
  return hands;
}

// Verificar si un jugador puede refutar una sugerencia
export function canRefuteSuggestion(
  player: Player,
  suggestion: { suspect: string; weapon: string; room: string }
): Card | null {
  // Buscar si el jugador tiene alguna de las cartas sugeridas
  const suspectCard = player.cards.find(
    c => c.type === 'SUSPECT' && c.name === suggestion.suspect
  );
  if (suspectCard) return suspectCard;
  
  const weaponCard = player.cards.find(
    c => c.type === 'WEAPON' && c.name === suggestion.weapon
  );
  if (weaponCard) return weaponCard;
  
  const roomCard = player.cards.find(
    c => c.type === 'ROOM' && c.name === suggestion.room
  );
  if (roomCard) return roomCard;
  
  return null;
}

// Obtener siguiente jugador activo
export function getNextActivePlayer(
  players: Player[],
  currentPlayerId: string
): Player | null {
  const currentIndex = players.findIndex(p => p.id === currentPlayerId);
  if (currentIndex === -1) return null;
  
  // Buscar siguiente jugador activo en orden circular
  for (let i = 1; i < players.length; i++) {
    const nextIndex = (currentIndex + i) % players.length;
    const nextPlayer = players[nextIndex];
    if (nextPlayer.isActive) {
      return nextPlayer;
    }
  }
  
  return null;
}

// Verificar si la partida debe terminar
export function shouldGameEnd(players: Player[]): boolean {
  const activePlayers = players.filter(p => p.isActive);
  return activePlayers.length <= 1;
}

