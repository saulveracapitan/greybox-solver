// Retos físicos que aparecen cuando se responde incorrectamente
// Estos son más simples y rápidos que los desafíos entre fases

export interface PenaltyChallenge {
  id: string;
  name: string;
  description: string;
  instruction: string;
  category: "drink" | "physical" | "fun" | "skill";
}

export const penaltyChallenges: PenaltyChallenge[] = [
  // Retos de bebida
  {
    id: "penalty-drink-1",
    name: "El Brindis del Detective",
    description: "Bebe una cerveza entera (o un vaso de agua si no bebes alcohol)",
    instruction: "Debes beber una cerveza entera sin parar. Si no bebes alcohol, bebe un vaso grande de agua.",
    category: "drink",
  },
  {
    id: "penalty-drink-2",
    name: "El Shot de la Verdad",
    description: "Bebe un shot de cualquier bebida (o un sorbo grande si prefieres)",
    instruction: "Toma un shot completo de tu bebida favorita. Si prefieres, un sorbo grande también cuenta.",
    category: "drink",
  },
  {
    id: "penalty-drink-3",
    name: "El Trago del Error",
    description: "Bebe medio vaso de cualquier bebida",
    instruction: "Bebe la mitad de un vaso de tu bebida sin parar.",
    category: "drink",
  },
  
  // Retos físicos
  {
    id: "penalty-physical-1",
    name: "Las Flexiones del Detective",
    description: "Haz 10 flexiones (o 5 si es muy difícil)",
    instruction: "Completa 10 flexiones seguidas. Si es muy difícil, haz 5 flexiones o flexiones de rodillas.",
    category: "physical",
  },
  {
    id: "penalty-physical-2",
    name: "Las Sentadillas del Archivo",
    description: "Haz 15 sentadillas",
    instruction: "Haz 15 sentadillas completas seguidas sin parar.",
    category: "physical",
  },
  {
    id: "penalty-physical-3",
    name: "El Salto del Asesino",
    description: "Haz 20 saltos en el lugar",
    instruction: "Salta en el lugar 20 veces seguidas con ambos pies juntos.",
    category: "physical",
  },
  {
    id: "penalty-physical-4",
    name: "El Equilibrio del Perito",
    description: "Mantén el equilibrio en un pie durante 30 segundos",
    instruction: "Levántate sobre un pie y mantén el equilibrio durante 30 segundos sin tocar el suelo con el otro pie.",
    category: "physical",
  },
  {
    id: "penalty-physical-5",
    name: "El Plancha del Investigador",
    description: "Mantén la posición de plancha durante 20 segundos",
    instruction: "Colócate en posición de plancha (push-up) y mantén la posición durante 20 segundos sin tocar el suelo.",
    category: "physical",
  },
  
  // Retos divertidos
  {
    id: "penalty-fun-1",
    name: "El Baile del Sospechoso",
    description: "Baila durante 30 segundos sin parar",
    instruction: "Ponte de pie y baila durante 30 segundos seguidos. ¡Muévete al ritmo!",
    category: "fun",
  },
  {
    id: "penalty-fun-2",
    name: "La Imitación del Testigo",
    description: "Imita a un animal durante 10 segundos",
    instruction: "Elige un animal e imítalo durante 10 segundos. Los demás deben adivinar qué animal eres.",
    category: "fun",
  },
  {
    id: "penalty-fun-3",
    name: "El Grito del Crimen",
    description: "Grita '¡EUREKA!' lo más fuerte que puedas",
    instruction: "Ponte de pie y grita '¡EUREKA!' lo más fuerte que puedas, como si hubieras encontrado una pista importante.",
    category: "fun",
  },
  {
    id: "penalty-fun-4",
    name: "La Risa del Detective",
    description: "Ríe durante 15 segundos sin parar",
    instruction: "Ríe de forma exagerada durante 15 segundos seguidos sin parar.",
    category: "fun",
  },
  {
    id: "penalty-fun-5",
    name: "El Canto del Archivo",
    description: "Canta una canción durante 20 segundos",
    instruction: "Canta cualquier canción durante 20 segundos. No importa si desafinas, ¡solo canta!",
    category: "fun",
  },
  
  // Retos de habilidad
  {
    id: "penalty-skill-1",
    name: "El Lanzamiento del Dado",
    description: "Lanza un objeto pequeño a un objetivo 3 veces",
    instruction: "Lanza un objeto pequeño (moneda, papel, etc.) a un objetivo (cubo, vaso, etc.) 3 veces. Debes acertar al menos 1 vez.",
    category: "skill",
  },
  {
    id: "penalty-skill-2",
    name: "El Equilibrio del Objeto",
    description: "Equilibra un objeto en tu cabeza durante 10 segundos",
    instruction: "Coloca un objeto pequeño (libro, vaso vacío, etc.) en tu cabeza y mantén el equilibrio durante 10 segundos.",
    category: "skill",
  },
  {
    id: "penalty-skill-3",
    name: "El Truco de Magia",
    description: "Haz un truco de magia simple",
    instruction: "Realiza un truco de magia simple (hacer desaparecer una moneda, adivinar un número, etc.).",
    category: "skill",
  },
  {
    id: "penalty-skill-4",
    name: "El Juego de Palabras",
    description: "Di 5 palabras que empiecen con la misma letra en 10 segundos",
    instruction: "Elige una letra y di 5 palabras diferentes que empiecen con esa letra en menos de 10 segundos.",
    category: "skill",
  },
  
  // Retos de competencia
  {
    id: "penalty-competition-1",
    name: "Piedra, Papel o Tijera",
    description: "Reta a alguien a un piedra-papel-tijera a 3 rondas: el perdedor bebe 2 sorbos",
    instruction: "Elige a otro jugador y jueguen piedra-papel-tijera a 3 rondas. El perdedor debe beber 2 sorbos de su bebida.",
    category: "fun",
  },
  {
    id: "penalty-competition-2",
    name: "Pulso Chino / Chinchón",
    description: "Haz un pulso chino / chinchón: quien se equivoque bebe",
    instruction: "Elige a otro jugador y hagan un pulso chino (chinchón). Ambos deben decir 'chinchón' y mostrar un número del 1 al 5 con los dedos. Si alguien se equivoca o muestra el número incorrecto, debe beber un sorbo.",
    category: "fun",
  },
  {
    id: "penalty-competition-3",
    name: "Duelo de Miradas",
    description: "Duelo de miradas: el primero que parpadee bebe un sorbo",
    instruction: "Elige a otro jugador y mantén contacto visual sin parpadear. El primero que parpadee debe beber un sorbo de su bebida.",
    category: "fun",
  },
  {
    id: "penalty-competition-4",
    name: "Carrera de Animales",
    description: "Carrera de decir cinco animales diferentes: el segundo bebe",
    instruction: "Elige a otro jugador. Ambos deben decir 5 animales diferentes lo más rápido posible. El segundo en terminar debe beber un sorbo.",
    category: "fun",
  },
  
  // Retos de cartas
  {
    id: "penalty-cards-1",
    name: "Alta o Baja",
    description: "Saca una carta. Otro jugador debe decir si la siguiente será más alta o más baja. Si falla → bebe",
    instruction: "Saca una carta de la baraja. Otro jugador debe predecir si la siguiente carta será más alta o más baja que la que acabas de sacar. Si falla, debe beber un sorbo.",
    category: "fun",
  },
  {
    id: "penalty-cards-2",
    name: "Rojo o Negro",
    description: "Antes de revelar la carta, alguien dice si será roja o negra. Falla = sorbo",
    instruction: "Saca una carta de la baraja pero NO la reveles todavía. Otro jugador debe predecir si será roja (corazones o diamantes) o negra (picas o tréboles). Si falla, debe beber un sorbo.",
    category: "fun",
  },
  {
    id: "penalty-cards-3",
    name: "Adivina el Palo",
    description: "1 sorbo por fallar. Si aciertas → repartes 2",
    instruction: "Saca una carta de la baraja pero NO la reveles todavía. Otro jugador debe adivinar el palo (corazones, diamantes, picas o tréboles). Si falla, bebe 1 sorbo. Si acierta, tú debes beber 2 sorbos.",
    category: "fun",
  },
];

// Función para obtener un reto aleatorio
export function getRandomPenaltyChallenge(): PenaltyChallenge {
  const randomIndex = Math.floor(Math.random() * penaltyChallenges.length);
  return penaltyChallenges[randomIndex];
}

// Función para obtener un reto aleatorio de una categoría específica
export function getRandomPenaltyChallengeByCategory(category: PenaltyChallenge["category"]): PenaltyChallenge {
  const challengesInCategory = penaltyChallenges.filter(c => c.category === category);
  const randomIndex = Math.floor(Math.random() * challengesInCategory.length);
  return challengesInCategory[randomIndex];
}

