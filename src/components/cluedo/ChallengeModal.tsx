import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ChallengeModalProps {
  isOpen: boolean;
  playerName: string;
  playerId: string;
  challengeType: string;
  allPlayers: Array<{ id: string; name: string }>;
  onComplete: () => void;
}

const ChallengeModal = ({ isOpen, playerName, playerId, challengeType, allPlayers, onComplete }: ChallengeModalProps) => {
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [opponentName, setOpponentName] = useState<string | null>(null);

  // Retos que requieren dos personas
  const twoPlayerChallenges = ["pulso_chino", "piedra_papel_tijera", "duelo_miradas"];

  useEffect(() => {
    if (isOpen && twoPlayerChallenges.includes(challengeType)) {
      // Seleccionar un oponente aleatorio (diferente al jugador actual)
      const otherPlayers = allPlayers.filter(p => p.id !== playerId);
      if (otherPlayers.length > 0) {
        const randomOpponent = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
        setOpponentName(randomOpponent.name);
      } else {
        setOpponentName(null);
      }
    } else {
      setOpponentName(null);
    }
  }, [isOpen, challengeType, playerId, allPlayers]);

  const getChallengeDescription = () => {
    switch (challengeType) {
      case "alta_o_baja":
        return {
          title: "🔹 Alta o Baja",
          description: "Saca una carta. Otro jugador debe decir si la siguiente será más alta o más baja.",
          rules: "Si falla → bebe.",
        };
      case "rojo_o_negro":
        return {
          title: "🔹 Rojo o Negro",
          description: "Antes de revelar la carta, alguien dice si será roja o negra.",
          rules: "Falla = sorbo.",
        };
      case "adivina_palo":
        return {
          title: "🔹 Adivina el Palo",
          description: "Adivina el palo de la carta (corazones, diamantes, picas, tréboles).",
          rules: "1 sorbo por fallar. Si aciertas → repartes 2.",
        };
      case "carta_mas_alta":
        return {
          title: "🔹 La Carta Más Alta",
          description: "Cada uno roba una carta boca abajo y todos la revelan a la vez.",
          rules: "Quien tenga la carta más baja → bebe.",
        };
      case "suma_cartas":
        return {
          title: "🔹 Suma de Cartas",
          description: "Saca 3 cartas. Debes adivinar si la suma es par o impar.",
          rules: "Si fallas → bebe.",
        };
      case "carta_medio":
        return {
          title: "🔹 Carta del Medio",
          description: "Saca 3 cartas y ordénalas. Debes adivinar cuál es la del medio.",
          rules: "Si aciertas → no bebes. Si fallas → bebe.",
        };
      case "secuencia":
        return {
          title: "🔹 Secuencia",
          description: "Saca 2 cartas. Debes adivinar si la siguiente completa una secuencia.",
          rules: "Si aciertas → no bebes. Si fallas → bebe.",
        };
      case "color_mayoritario":
        return {
          title: "🔹 Color Mayoritario",
          description: "Saca 5 cartas. Debes adivinar si hay más rojas o negras.",
          rules: "Si aciertas → no bebes. Si fallas → bebe.",
        };
      case "piedra_papel_tijera":
        return {
          title: "🔹 Piedra, Papel o Tijera",
          description: opponentName 
            ? `Reta a ${opponentName} a un piedra-papel-tijera a 3 rondas.`
            : "Reta a alguien a un piedra-papel-tijera a 3 rondas.",
          rules: "El perdedor bebe 2 sorbos.",
        };
      case "pulso_chino":
        return {
          title: "🔹 Pulso Chino / Chinchón",
          description: opponentName
            ? `Haz un pulso chino / chinchón con ${opponentName}: quien se equivoque bebe.`
            : "Haz un pulso chino / chinchón: quien se equivoque bebe.",
          rules: "Si completas la secuencia → no bebes. Si fallas → bebe.",
        };
      case "duelo_miradas":
        return {
          title: "🔹 Duelo de Miradas",
          description: opponentName
            ? `Duelo de miradas con ${opponentName}: el primero que parpadee bebe un sorbo.`
            : "Duelo de miradas: el primero que parpadee bebe un sorbo.",
          rules: "Si completas → no bebes. Si parpadeas antes → bebe 1 sorbo.",
        };
      case "memoria_cartas":
        return {
          title: "🔹 Memoria de Cartas",
          description: "Se muestran 4 cartas durante 5 segundos. Luego debes recordar cuáles eran.",
          rules: "Si aciertas todas → no bebes. Si fallas alguna → bebe.",
        };
      case "moneda_vaso":
        return {
          title: "🔹 Moneda en el Vaso",
          description: "Intenta hacer rebotar una moneda contra la mesa para que acabe en el interior de un vaso.",
          rules: "Si lo consigues → no bebes. Si fallas → bebe 2 sorbos.",
        };
      case "vaso_flotante":
        return {
          title: "🔹 Vaso Flotante",
          description: "Coge un vaso, llénalo de cerveza, vino o lo que te apetezca, y colócalo en el centro de la mesa. A continuación, coge otro, pero de chupito vacío y colócalo en el que contiene líquido para que flote. Cada jugador debe verter una pequeña cantidad de su bebida en el vaso de chupito.",
          rules: "El que lo hunda, tiene que tomarse todo.",
        };
      case "regla_bob":
        return {
          title: "🔹 Regla de Bob",
          description: "La única regla de este pequeño juego es que debes añadir el nombre Bob al de cualquier persona cuando te dirijas a ella. Por ejemplo, en lugar de decir: 'Sara, ¿puedes servirme otro chupito?', tendrías que decir: 'Bob Sara, ¿puedes servirme otro chupito?'.",
          rules: "Si fallas → bebe.",
        };
      default:
        return {
          title: "Reto",
          description: "",
          rules: "",
        };
    }
  };

  const challengeInfo = getChallengeDescription();

  useEffect(() => {
    if (isOpen) {
      setChallengeCompleted(false);
    } else {
      setChallengeCompleted(false);
    }
  }, [isOpen, challengeType]);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">{challengeInfo.title}</DialogTitle>
          <DialogDescription className="text-base mt-2">
            <strong>{playerName}</strong> debe completar este reto antes de avanzar el turno.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Card className="p-4 bg-muted">
            <p className="text-sm mb-2">{challengeInfo.description}</p>
            <p className="text-sm font-semibold text-red-600">{challengeInfo.rules}</p>
          </Card>

          {!challengeCompleted && (
            <Button
              onClick={() => setChallengeCompleted(true)}
              className="w-full"
              size="lg"
            >
              ✓ Reto Completado
            </Button>
          )}

          {challengeCompleted && (
            <Button
              onClick={onComplete}
              className="w-full"
              size="lg"
            >
              Continuar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengeModal;
