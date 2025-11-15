import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, Lock, Volume2, Eye, Hash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCaseById, GameCase } from "@/lib/gameCases";
import PenaltyChallenge from "@/components/PenaltyChallenge";
import { getRandomPenaltyChallenge, PenaltyChallenge as PenaltyChallengeType } from "@/lib/penaltyChallenges";

interface Phase4Props {
  gameId: string;
  playerId: string;
  playerRole: string;
  isHost: boolean;
}

const Phase4 = ({ gameId, playerId, playerRole, isHost }: Phase4Props) => {
  const [answer, setAnswer] = useState("");
  const [phaseCompleted, setPhaseCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const [gameCase, setGameCase] = useState<GameCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPenaltyChallenge, setShowPenaltyChallenge] = useState(false);
  const [currentPenaltyChallenge, setCurrentPenaltyChallenge] = useState<PenaltyChallengeType | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [assignedPlayerId, setAssignedPlayerId] = useState<string>("");

  // Cargar el caso asignado a esta partida
  useEffect(() => {
    loadGameCase();
    checkPhaseStatus();
    loadPlayerName();
    checkActivePenaltyChallenge();
    setupPenaltyRealtime();
  }, []);

  const setupPenaltyRealtime = () => {
    const channel = supabase
      .channel(`penalty-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_sessions",
          filter: `id=eq.${gameId}`,
        },
        () => {
          checkActivePenaltyChallenge();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const checkActivePenaltyChallenge = async () => {
    try {
      const { data: session, error } = await supabase
        .from("game_sessions")
        .select("data")
        .eq("id", gameId)
        .single();

      if (error) throw error;

      const penaltyData = session?.data?.activePenaltyChallenge;
      if (penaltyData && penaltyData.phase === 4) {
        setCurrentPenaltyChallenge(penaltyData.challenge);
        setShowPenaltyChallenge(true);
        if (penaltyData.playerName) {
          setPlayerName(penaltyData.playerName);
        }
        if (penaltyData.playerId) {
          setAssignedPlayerId(penaltyData.playerId);
        }
      } else {
        setShowPenaltyChallenge(false);
        setCurrentPenaltyChallenge(null);
      }
    } catch (error) {
      console.error("Error checking penalty challenge:", error);
    }
  };

  const loadPlayerName = async () => {
    try {
      const { data, error } = await supabase
        .from("players")
        .select("name")
        .eq("id", playerId)
        .single();
      
      if (!error && data) {
        setPlayerName(data.name);
      }
    } catch (error) {
      console.error("Error loading player name:", error);
    }
  };

  const loadGameCase = async () => {
    try {
      const { data: session, error } = await supabase
        .from("game_sessions")
        .select("data")
        .eq("id", gameId)
        .single();

      if (error) throw error;

      if (session?.data?.caseId) {
        const caseData = getCaseById(session.data.caseId);
        if (caseData) {
          setGameCase(caseData);
        }
      }
    } catch (error) {
      console.error("Error loading game case:", error);
      toast.error("Error al cargar el caso");
    } finally {
      setLoading(false);
    }
  };

  // Patrones sincronizados por rol (fallback si no hay caso)
  const synchronizedPatternsByRole: Record<string, { visual: string; audio: string; hint: string }> = {
    ANALISTA_TIEMPOS: {
      visual: "Patrón temporal: 1-2-3-4-5",
      audio: "Sonido: TIC-TAC-TIC-TAC-TIC",
      hint: "El patrón sigue una secuencia numérica",
    },
    EXPERTO_HUELLAS: {
      visual: "Secuencia: A-B-C-D-E",
      audio: "Sonido: TON-TON-TON-TON-TON",
      hint: "Cada elemento tiene un valor",
    },
    ENTREVISTADOR: {
      visual: "Código: 5-4-3-2-1",
      audio: "Sonido: BEEP-BEEP-BEEP-BEEP-BEEP",
      hint: "La secuencia está invertida",
    },
    CARTOGRAFO: {
      visual: "Orden: 2-4-1-5-3",
      audio: "Sonido: DING-DONG-DING-DONG-DING",
      hint: "Los números están mezclados",
    },
    PERITO_FORENSE: {
      visual: "Secuencia: 3-1-4-2-5",
      audio: "Sonido: CLICK-CLICK-CLICK-CLICK-CLICK",
      hint: "Hay un patrón oculto en el orden",
    },
    ARCHIVISTA: {
      visual: "Código: 1-3-5-2-4",
      audio: "Sonido: POP-POP-POP-POP-POP",
      hint: "Sigue una secuencia alternada",
    },
    COMUNICACIONES: {
      visual: "Patrón: 4-2-5-1-3",
      audio: "Sonido: BUZZ-BUZZ-BUZZ-BUZZ-BUZZ",
      hint: "El orden es importante",
    },
    TESTIMONIOS: {
      visual: "Secuencia: 2-5-1-4-3",
      audio: "Sonido: CHIME-CHIME-CHIME-CHIME-CHIME",
      hint: "Suma todos los números",
    },
    PERFILADOR: {
      visual: "Código: 5-1-3-4-2",
      audio: "Sonido: TONE-TONE-TONE-TONE-TONE",
      hint: "El último dígito es la suma módulo 10",
    },
    INTERPRETE_MENSAJES: {
      visual: "Patrón: 1+2+3+4+5 = 15 → último dígito: 5",
      audio: "Sonido: FINAL-FINAL-FINAL-FINAL-FINAL",
      hint: "Suma todos los números y toma el último dígito",
    },
  };

  const checkPhaseStatus = async () => {
    const { data, error } = await supabase
      .from("phase_states")
      .select("status")
      .eq("game_session_id", gameId)
      .eq("phase_number", 4)
      .single();

    if (data && data.status === "COMPLETED") {
      setPhaseCompleted(true);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!gameCase) {
      toast.error("Caso no cargado. Intenta de nuevo...");
      return;
    }

    // La respuesta correcta viene del caso asignado
    const correctAnswer = gameCase.phase4.correctAnswer;
    const userAnswer = answer.trim();

    if (userAnswer !== correctAnswer) {
      // Mostrar reto de penalización y guardarlo en la base de datos para que todos lo vean
      const penalty = getRandomPenaltyChallenge();
      
      try {
        const { data: session } = await supabase
          .from("game_sessions")
          .select("data")
          .eq("id", gameId)
          .single();

        const currentData = session?.data || {};
        await supabase
          .from("game_sessions")
          .update({
            data: {
              ...currentData,
              activePenaltyChallenge: {
                challenge: penalty,
                playerId: playerId,
                playerName: playerName,
                phase: 4,
                createdAt: new Date().toISOString(),
              },
            },
          })
          .eq("id", gameId);

        await supabase.from("shared_log_entries").insert({
          game_session_id: gameId,
          player_id: playerId,
          message: `❌ Respuesta incorrecta. ${playerName} debe completar el reto: "${penalty.name}"`,
        });
      } catch (error) {
        console.error("Error saving penalty challenge:", error);
      }

      setCurrentPenaltyChallenge(penalty);
      setShowPenaltyChallenge(true);
      toast.error("Respuesta incorrecta. Debes completar un reto...");
      return;
    }

    setSubmitting(true);

    try {
      // Marcar fase como completada
      await supabase
        .from("phase_states")
        .update({
          status: "COMPLETED",
          completed_at: new Date().toISOString(),
        })
        .eq("game_session_id", gameId)
        .eq("phase_number", 4);

      // Obtener código actual y actualizar con último dígito
      const { data: session } = await supabase
        .from("game_sessions")
        .select("lockbox_code, started_at")
        .eq("id", gameId)
        .single();

      const currentCode = session?.lockbox_code || "XXXXX";
      const fifthDigit = gameCase.phase4.fifthDigit;
      const finalCode = currentCode.replace(/X/, fifthDigit);

      // Marcar partida como completada
      await supabase
        .from("game_sessions")
        .update({
          status: "COMPLETED",
          current_phase: 4,
          lockbox_code: finalCode,
          finished_at: new Date().toISOString(),
        })
        .eq("id", gameId);

      toast.success("¡Fase 4 completada! Código completo: " + finalCode);
      setPhaseCompleted(true);

      // Redirigir a pantalla de victoria después de 2 segundos
      setTimeout(() => {
        navigate(`/game/${gameId}/victory?playerId=${playerId}`);
      }, 2000);
    } catch (error) {
      console.error("Error completing phase:", error);
      toast.error("Error al completar la fase");
    } finally {
      setSubmitting(false);
    }
  };

  // Usar patrones del caso si está disponible
  const pattern = gameCase?.phase4.patterns[playerRole] || synchronizedPatternsByRole[playerRole] || {
    visual: "Sin patrón asignado",
    audio: "Sin audio asignado",
    hint: "Sin pista",
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">Cargando caso...</div>
      </div>
    );
  }

  if (!gameCase) {
    return (
      <div className="text-center py-8">
        <div className="text-destructive">Error: No se pudo cargar el caso</div>
      </div>
    );
  }

  const handlePenaltyComplete = async () => {
    try {
      const { data: session } = await supabase
        .from("game_sessions")
        .select("data")
        .eq("id", gameId)
        .single();

      const currentData = session?.data || {};
      const updatedData = { ...currentData };
      delete updatedData.activePenaltyChallenge;

      await supabase
        .from("game_sessions")
        .update({ data: updatedData })
        .eq("id", gameId);

      await supabase.from("shared_log_entries").insert({
        game_session_id: gameId,
        player_id: playerId,
        message: `✅ ${playerName} ha completado el reto: "${currentPenaltyChallenge?.name}"`,
      });
    } catch (error) {
      console.error("Error clearing penalty challenge:", error);
    }

    setShowPenaltyChallenge(false);
    setCurrentPenaltyChallenge(null);
    toast.info("Reto completado. Puedes intentar responder de nuevo.");
  };

  if (phaseCompleted) {
  return (
    <div className="text-center space-y-4 py-8">
        <Check className="h-16 w-16 text-green-500 mx-auto" />
        <h3 className="text-2xl font-bold text-green-500">
          ¡FASE 4 COMPLETADA!
        </h3>
        <p className="text-muted-foreground">
          El último dígito del candado ha sido revelado: <span className="text-3xl font-bold text-accent">{gameCase.phase4.fifthDigit}</span>
        </p>
        <div className="bg-muted p-4 rounded-lg max-w-2xl mx-auto">
          <p className="text-sm">
            <strong>Narrativa:</strong> Habéis sincronizado todos los patrones y descubierto
            el último dígito. El código completo del candado es {gameCase.finalCode}. Ahora podéis abrir
            la Caja Grey y descubrir la verdad final del caso...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showPenaltyChallenge && currentPenaltyChallenge && (
        <PenaltyChallenge
          challenge={currentPenaltyChallenge}
          onComplete={handlePenaltyComplete}
          playerName={playerName}
          assignedPlayerId={assignedPlayerId}
          currentPlayerId={playerId}
        />
      )}
      <div className="space-y-6">
      {/* Narrativa de introducción */}
      <div className="bg-muted p-4 rounded-lg border-l-4 border-primary">
        <p className="text-sm">
          <strong>Contexto:</strong> Todos los dispositivos se han sincronizado. Cada uno
          de vosotros ve y escucha un patrón diferente. Estos patrones, cuando se combinan
          correctamente, revelan el último dígito del candado. Deberéis compartir vuestros
          patrones y encontrar la clave que los une.
        </p>
      </div>

      {/* Patrón sincronizado del rol */}
      <Card className="p-4 bg-card/50">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="h-5 w-5 text-clue" />
          <h3 className="font-bold">TU PATRÓN SINCRONIZADO</h3>
        </div>
        <div className="space-y-4">
          <div className="p-3 bg-background rounded border-l-2 border-clue">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-clue" />
              <span className="text-xs font-bold text-muted-foreground">VISUAL</span>
            </div>
            <p className="text-sm font-mono">{pattern.visual}</p>
          </div>
          <div className="p-3 bg-background rounded border-l-2 border-clue">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="h-4 w-4 text-clue" />
              <span className="text-xs font-bold text-muted-foreground">AUDIO</span>
            </div>
            <p className="text-sm font-mono">{pattern.audio}</p>
          </div>
          <div className="p-3 bg-background rounded border-l-2 border-accent/20 border-l-accent">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="h-4 w-4 text-accent" />
              <span className="text-xs font-bold text-accent">PISTA</span>
            </div>
            <p className="text-sm text-accent-foreground">{pattern.hint}</p>
          </div>
        </div>
      </Card>

      {/* Instrucciones */}
      <div className="bg-accent/10 p-4 rounded-lg">
        <p className="text-sm text-accent-foreground">
          <strong>Instrucciones:</strong> Compartid vuestros patrones en el muro de hallazgos.
          Todos los patrones contienen números del 1 al 5. La clave está en cómo se relacionan
          estos números. El último dígito del candado es el resultado de una operación matemática
          simple con todos los números mencionados en los patrones.
        </p>
      </div>

      {/* Input de respuesta */}
      {isHost && (
        <Card className="p-4">
          <div className="space-y-4">
            <Label htmlFor="answer" className="text-lg font-bold">
              Introducir último dígito (Solo el anfitrión)
            </Label>
            <Input
              id="answer"
              placeholder="Ej: 5"
              value={answer}
              onChange={(e) => setAnswer(e.target.value.replace(/\D/g, "").slice(0, 1))}
              className="text-center text-4xl font-bold tracking-wider"
              maxLength={1}
            />
            <Button
              onClick={handleSubmitAnswer}
              disabled={submitting || !answer.trim()}
              size="lg"
              className="w-full"
            >
              {submitting ? "VERIFICANDO..." : "VERIFICAR CÓDIGO FINAL"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Pista: Suma todos los números del 1 al 5 que aparecen en los patrones y toma el último dígito del resultado
            </p>
          </div>
        </Card>
      )}

      {!isHost && (
        <div className="text-center text-muted-foreground">
          Esperando a que el anfitrión introduzca el último dígito...
        </div>
      )}
    </div>
    </>
  );
};

export default Phase4;
