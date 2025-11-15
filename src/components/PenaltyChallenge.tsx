import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check, X } from "lucide-react";
import { PenaltyChallenge as PenaltyChallengeType } from "@/lib/penaltyChallenges";

interface PenaltyChallengeProps {
  challenge: PenaltyChallengeType;
  onComplete: () => void;
  playerName?: string;
  assignedPlayerId?: string;
  currentPlayerId?: string;
}

const PenaltyChallenge = ({ challenge, onComplete, playerName, assignedPlayerId, currentPlayerId }: PenaltyChallengeProps) => {
  const [completed, setCompleted] = useState(false);
  // Si no hay assignedPlayerId definido, permitimos que cualquier jugador complete el reto
  // Si hay assignedPlayerId, solo el jugador asignado puede completarlo
  const isAssignedPlayer = !assignedPlayerId || !currentPlayerId || assignedPlayerId === currentPlayerId;

  const handleComplete = () => {
    setCompleted(true);
    // Pequeño delay para mostrar el estado de completado
    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  const getCategoryIcon = () => {
    switch (challenge.category) {
      case "drink":
        return "🍺";
      case "physical":
        return "💪";
      case "fun":
        return "🎉";
      case "skill":
        return "🎯";
      default:
        return "⚡";
    }
  };

  const getCategoryColor = () => {
    switch (challenge.category) {
      case "drink":
        return "bg-amber-500/20 border-amber-500";
      case "physical":
        return "bg-red-500/20 border-red-500";
      case "fun":
        return "bg-purple-500/20 border-purple-500";
      case "skill":
        return "bg-blue-500/20 border-blue-500";
      default:
        return "bg-gray-500/20 border-gray-500";
    }
  };

  if (completed) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <Card className={`p-8 max-w-md w-full border-2 border-green-500 ${getCategoryColor()}`}>
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-500 p-4">
                <Check className="h-12 w-12 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-green-500">¡RETO COMPLETADO!</h2>
            <p className="text-lg text-muted-foreground">
              {playerName ? `${playerName} ha completado` : "Has completado"} el reto:
            </p>
            <p className="text-xl font-semibold">{challenge.name}</p>
            <p className="text-sm text-muted-foreground">Puedes intentar responder de nuevo...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className={`p-8 max-w-md w-full border-2 ${getCategoryColor()}`}>
        <div className="text-center space-y-6">
          {/* Icono y título */}
          <div className="flex justify-center">
            <div className="text-6xl">{getCategoryIcon()}</div>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold mb-2">¡RESPUESTA INCORRECTA!</h2>
            <div className="bg-destructive/20 border-2 border-destructive rounded-lg p-4 mb-4">
              <p className="text-xl font-bold text-destructive">
                {playerName ? `${playerName.toUpperCase()}` : "EL ANFITRIÓN"} DEBE COMPLETAR UN RETO
              </p>
            </div>
            <p className="text-lg text-muted-foreground">
              {playerName ? `${playerName} debe completar` : "El anfitrión debe completar"} el siguiente reto antes de poder intentar responder de nuevo
            </p>
          </div>

          {/* Información del reto */}
          <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
            <h3 className="text-2xl font-bold">{challenge.name}</h3>
            <p className="text-muted-foreground">{challenge.description}</p>
            <div className="border-t pt-3">
              <p className="font-semibold mb-2">Instrucciones:</p>
              <p className="text-sm">{challenge.instruction}</p>
            </div>
          </div>

          {/* Botón de completar */}
          {isAssignedPlayer ? (
            <>
              <Button
                onClick={handleComplete}
                size="lg"
                className="w-full text-lg"
                variant="default"
              >
                <Check className="mr-2 h-5 w-5" />
                RETO COMPLETADO
              </Button>
              <p className="text-xs text-muted-foreground">
                Solo marca como completado cuando realmente hayas hecho el reto
              </p>
            </>
          ) : (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                Esperando a que {playerName || "el jugador asignado"} complete el reto...
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PenaltyChallenge;

