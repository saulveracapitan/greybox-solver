import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PhysicalChallenge as PhysicalChallengeType } from "@/lib/gameCases";
import { AlertCircle, CheckCircle2, Clock, Users } from "lucide-react";

interface PhysicalChallengeProps {
  gameId: string;
  playerId: string;
  isHost: boolean;
  challenge: PhysicalChallengeType;
  onComplete: () => void;
  onPlayerEliminated: (playerId: string) => void;
}

const PhysicalChallenge = ({
  gameId,
  playerId,
  isHost,
  challenge,
  onComplete,
  onPlayerEliminated,
}: PhysicalChallengeProps) => {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    challenge.timeLimit || null
  );
  const [completed, setCompleted] = useState(false);
  const [playersStatus, setPlayersStatus] = useState<
    Record<string, { name: string; completed: boolean; eliminated: boolean }>
  >({});
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    loadPlayersStatus();
  }, []);

  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0 && !completed) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, completed]);

  const loadPlayersStatus = async () => {
    const { data: players } = await supabase
      .from("players")
      .select("id, name, eliminated")
      .eq("game_session_id", gameId)
      .eq("eliminated", false);

    if (players) {
      const status: Record<
        string,
        { name: string; completed: boolean; eliminated: boolean }
      > = {};
      players.forEach((player) => {
        status[player.id] = {
          name: player.name,
          completed: false,
          eliminated: player.eliminated || false,
        };
      });
      setPlayersStatus(status);
    }
  };

  const handleTimeUp = async () => {
    // Eliminar a todos los jugadores que no completaron
    const incompletePlayers = Object.entries(playersStatus)
      .filter(([_, status]) => !status.completed && !status.eliminated)
      .map(([id]) => id);

    for (const playerIdToEliminate of incompletePlayers) {
      await eliminatePlayer(playerIdToEliminate);
    }

    if (incompletePlayers.length > 0) {
      toast.error(
        `${incompletePlayers.length} jugador(es) eliminado(s) por no completar el desafío a tiempo`
      );
    }
  };

  const handleMarkComplete = async () => {
    if (!isHost) {
      toast.error("Solo el anfitrión puede marcar como completado");
      return;
    }

    setConfirming(true);

    try {
      // Verificar que todos los jugadores activos han completado
      const activePlayers = Object.entries(playersStatus).filter(
        ([_, status]) => !status.eliminated
      );

      const incompletePlayers = activePlayers.filter(
        ([_, status]) => !status.completed
      );

      if (incompletePlayers.length > 0) {
        toast.error(
          `Faltan ${incompletePlayers.length} jugador(es) por completar el desafío`
        );
        setConfirming(false);
        return;
      }

      // Todos completaron, avanzar
      setCompleted(true);
      onComplete();
      toast.success("¡Desafío completado! Avanzando a la siguiente fase...");
    } catch (error) {
      console.error("Error completing challenge:", error);
      toast.error("Error al completar el desafío");
    } finally {
      setConfirming(false);
    }
  };

  const handlePlayerCompleted = async (targetPlayerId: string) => {
    if (targetPlayerId === playerId) {
      // El jugador marca su propio desafío como completado
      setPlayersStatus((prev) => ({
        ...prev,
        [playerId]: {
          ...prev[playerId],
          completed: true,
        },
      }));

      // Notificar a otros jugadores (opcional: guardar en base de datos)
      toast.success("Has completado el desafío. Esperando a los demás...");
    } else if (isHost) {
      // El host puede marcar a otros jugadores como completados
      setPlayersStatus((prev) => ({
        ...prev,
        [targetPlayerId]: {
          ...prev[targetPlayerId],
          completed: true,
        },
      }));
    }
  };

  const eliminatePlayer = async (targetPlayerId: string) => {
    try {
      await supabase
        .from("players")
        .update({
          eliminated: true,
          eliminated_at: new Date().toISOString(),
          connected: false,
        })
        .eq("id", targetPlayerId);

      setPlayersStatus((prev) => ({
        ...prev,
        [targetPlayerId]: {
          ...prev[targetPlayerId],
          eliminated: true,
          completed: false,
        },
      }));

      onPlayerEliminated(targetPlayerId);
      toast.error(
        `${playersStatus[targetPlayerId]?.name || "Un jugador"} ha sido eliminado`
      );
    } catch (error) {
      console.error("Error eliminating player:", error);
    }
  };

  const handleEliminatePlayer = async (targetPlayerId: string) => {
    if (!isHost) {
      toast.error("Solo el anfitrión puede eliminar jugadores");
      return;
    }

    if (
      confirm(
        `¿Estás seguro de que quieres eliminar a ${playersStatus[targetPlayerId]?.name}?`
      )
    ) {
      await eliminatePlayer(targetPlayerId);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const activePlayers = Object.entries(playersStatus).filter(
    ([_, status]) => !status.eliminated
  );
  const completedCount = activePlayers.filter(
    ([_, status]) => status.completed
  ).length;
  const allCompleted = activePlayers.length > 0 && completedCount === activePlayers.length;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl p-8 space-y-6">
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-3xl font-bold text-primary">
              {challenge.name}
            </h1>
          </div>

          <p className="text-lg text-muted-foreground">
            {challenge.description}
          </p>

          {timeRemaining !== null && (
            <div className="flex items-center justify-center gap-2 text-2xl font-bold text-red-500">
              <Clock className="h-6 w-6" />
              <span>Tiempo restante: {formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>

        <Card className="p-6 bg-muted">
          <h2 className="text-xl font-bold mb-4">Instrucciones:</h2>
          <p className="text-lg">{challenge.instruction}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5" />
            <h2 className="text-xl font-bold">Estado de los Jugadores:</h2>
          </div>

          <div className="space-y-2">
            {Object.entries(playersStatus).map(([id, status]) => (
              <div
                key={id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  status.eliminated
                    ? "bg-red-100 border-red-300"
                    : status.completed
                    ? "bg-green-100 border-green-300"
                    : "bg-yellow-50 border-yellow-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  {status.eliminated ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : status.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-500" />
                  )}
                  <span className="font-medium">{status.name}</span>
                  {id === playerId && (
                    <span className="text-xs text-muted-foreground">(Tú)</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!status.eliminated && !status.completed && id === playerId && (
                    <Button
                      size="sm"
                      onClick={() => handlePlayerCompleted(id)}
                      variant="outline"
                    >
                      Completé el desafío
                    </Button>
                  )}

                  {isHost && !status.eliminated && !status.completed && (
                    <Button
                      size="sm"
                      onClick={() => handlePlayerCompleted(id)}
                      variant="outline"
                    >
                      Marcar completado
                    </Button>
                  )}

                  {isHost && !status.eliminated && (
                    <Button
                      size="sm"
                      onClick={() => handleEliminatePlayer(id)}
                      variant="destructive"
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            {completedCount} de {activePlayers.length} jugadores completaron
            el desafío
          </div>
        </Card>

        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-sm text-red-800">
            <strong>⚠️ Consecuencia:</strong> {challenge.failureConsequence}
          </p>
        </Card>

        {isHost && allCompleted && (
          <Button
            onClick={handleMarkComplete}
            disabled={confirming}
            size="lg"
            className="w-full"
          >
            {confirming
              ? "Confirmando..."
              : "Todos completaron - Avanzar a siguiente fase"}
          </Button>
        )}

        {!isHost && completed && (
          <div className="text-center text-muted-foreground">
            Esperando a que el anfitrión confirme...
          </div>
        )}
      </Card>
    </div>
  );
};

export default PhysicalChallenge;

