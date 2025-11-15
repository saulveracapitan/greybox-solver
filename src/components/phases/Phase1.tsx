import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, Check } from "lucide-react";
import { getCaseById, GameCase } from "@/lib/gameCases";
import PenaltyChallenge from "@/components/PenaltyChallenge";
import { getRandomPenaltyChallenge, PenaltyChallenge as PenaltyChallengeType } from "@/lib/penaltyChallenges";

interface Phase1Props {
  gameId: string;
  playerId: string;
  playerRole: string;
  isHost: boolean;
}

const Phase1 = ({ gameId, playerId, playerRole, isHost }: Phase1Props) => {
  const [answer, setAnswer] = useState("");
  const [phaseCompleted, setPhaseCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
      if (penaltyData && penaltyData.phase === 1) {
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

  // Pistas específicas por rol para Fase 1 (se usarán del caso si está disponible)
  const cluesByRole: Record<string, string[]> = {
    ANALISTA_TIEMPOS: [
      "Horario de guardia de seguridad: 22:00 - 06:00",
      "Última actividad registrada en el sistema: 23:45",
      "Alarma de emergencia activada: 00:15",
    ],
    EXPERTO_HUELLAS: [
      "Huellas dactilares en la ventana: Coinciden con empleado #4872",
      "Huellas en el escritorio: Parcialmente borradas",
      "Rastros de polvo inusual en el suelo",
    ],
    ENTREVISTADOR: [
      'Testimonio del vigilante: "Escuché un ruido cerca de medianoche"',
      'Declaración del limpiador: "Vi luces encendidas en la oficina a las 23:30"',
      'Vecino reportó: "Oí un coche arrancando rápido a la 1:00 AM"',
    ],
    CARTOGRAFO: [
      "Punto de entrada: Ventana trasera, planta baja",
      "Cámaras deshabilitadas en sector este",
      "Ruta de escape posible: Callejón lateral hacia calle principal",
    ],
    PERITO_FORENSE: [
      "Análisis de sangre: Tipo O negativo",
      "Fibras textiles: Lana oscura, posiblemente de abrigo",
      "Objeto contundente usado: Aproximadamente 30cm de largo",
    ],
    ARCHIVISTA: [
      "Expediente del sospechoso #1: Ex-empleado despedido hace 3 meses",
      "Sospechoso #2: Tiene deudas con la víctima",
      "Sospechoso #3: Fue visto discutiendo con la víctima la semana pasada",
    ],
    COMUNICACIONES: [
      "Última llamada recibida: 23:30 desde número desconocido",
      "SMS enviado a las 23:55: 'Ya está hecho'",
      "Email programado para enviar a las 00:00: 'Lo siento'",
    ],
    TESTIMONIOS: [
      'Testigo A: "Vi a alguien con capucha negra cerca del edificio"',
      'Testigo B: "Escuché gritos alrededor de medianoche"',
      'Testigo C: "Un coche oscuro salió a gran velocidad"',
    ],
    PERFILADOR: [
      "Perfil psicológico: Persona metódica y planificadora",
      "Motivación probable: Venganza o dinero",
      "Conocimiento del lugar: Muy familiarizado con el edificio",
    ],
    INTERPRETE_MENSAJES: [
      "Mensaje críptico encontrado: 'La verdad está en los números'",
      "Código en la pared: '12-00-03'",
      "Nota en escritorio: 'Todo termina donde comenzó'",
    ],
  };

  const checkPhaseStatus = async () => {
    const { data, error } = await supabase
      .from("phase_states")
      .select("status")
      .eq("game_session_id", gameId)
      .eq("phase_number", 1)
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
    const correctAnswer = gameCase.phase1.correctAnswer.toUpperCase().trim();
    const userAnswer = answer.toUpperCase().trim().replace(/\s+/g, "");

    if (userAnswer !== correctAnswer) {
      // Mostrar reto de penalización y guardarlo en la base de datos para que todos lo vean
      const penalty = getRandomPenaltyChallenge();
      
      // Guardar el reto en game_sessions.data para que todos los jugadores lo vean
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
                phase: 1,
                createdAt: new Date().toISOString(),
              },
            },
          })
          .eq("id", gameId);

        // También agregar al log compartido
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
        .eq("phase_number", 1);

      // Activar Fase 2
      await supabase
        .from("phase_states")
        .update({
          status: "ACTIVE",
          started_at: new Date().toISOString(),
        })
        .eq("game_session_id", gameId)
        .eq("phase_number", 2);

      // Obtener código actual y actualizar con primer dígito
      const { data: session } = await supabase
        .from("game_sessions")
        .select("lockbox_code")
        .eq("id", gameId)
        .single();

      const firstDigit = gameCase.finalCode[0];
      const newCode = firstDigit + "XXXX";

      // Actualizar sesión de juego
      await supabase
        .from("game_sessions")
        .update({
          current_phase: 2,
          lockbox_code: newCode,
        })
        .eq("id", gameId);

      toast.success(`¡Fase 1 completada! Primer dígito revelado: ${firstDigit}`);
      setPhaseCompleted(true);
    } catch (error) {
      console.error("Error completing phase:", error);
      toast.error("Error al completar la fase");
    } finally {
      setSubmitting(false);
    }
  };

  // Usar pistas del caso si está disponible, sino usar las por defecto
  const clues = gameCase?.phase1.clues[playerRole] || cluesByRole[playerRole] || [
    "No hay pistas asignadas para este rol.",
  ];

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
    // Limpiar el reto de la base de datos
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

      // Agregar al log compartido
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
          ¡FASE 1 COMPLETADA!
        </h3>
        <p className="text-muted-foreground">
          El primer dígito del candado ha sido revelado: <span className="text-3xl font-bold text-accent">{gameCase.finalCode[0]}</span>
        </p>
        <div className="bg-muted p-4 rounded-lg max-w-2xl mx-auto">
          <p className="text-sm">
            <strong>Narrativa:</strong> Habéis reconstruido la línea temporal del incidente.
            El momento exacto fue {gameCase.phase1.correctTime}. Las pruebas apuntan a que
            el agresor conocía bien el lugar y planificó el ataque meticulosamente.
            Ahora debéis continuar con la siguiente fase de la investigación...
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
          <strong>Caso: {gameCase.name}</strong>
        </p>
        <p className="text-sm mt-2">
          <strong>Víctima:</strong> {gameCase.victim}
        </p>
        <p className="text-sm">
          <strong>Ubicación:</strong> {gameCase.location}
        </p>
        <p className="text-sm mt-2">
          La víctima fue encontrada en circunstancias sospechosas. Vuestra misión es
          reconstruir qué ocurrió usando las pistas que cada uno de vosotros tiene.
          Debéis determinar la hora exacta del incidente. La respuesta debe ser la
          hora escrita en una sola palabra en mayúsculas (ejemplo: DOSCUARENTAYSIETE para 02:47).
        </p>
      </div>

      {/* Pistas del rol */}
      <Card className="p-4 bg-card/50">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-5 w-5 text-clue" />
          <h3 className="font-bold">TUS PISTAS EXCLUSIVAS</h3>
        </div>
        <div className="space-y-2">
          {clues.map((clue, index) => (
            <div
              key={index}
              className="p-3 bg-background rounded border-l-2 border-clue"
            >
              <p className="text-sm">{clue}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Instrucciones */}
      <div className="bg-accent/10 p-4 rounded-lg">
        <p className="text-sm text-accent-foreground">
          <strong>Instrucciones:</strong> Compartid vuestras pistas en el muro de
          hallazgos. Discutid y deducid la hora exacta del ataque. Una vez que tengáis
          la respuesta, introducidla abajo (una sola palabra en mayúsculas).
        </p>
      </div>

      {/* Input de respuesta */}
      {isHost && (
        <Card className="p-4">
          <div className="space-y-4">
            <Label htmlFor="answer" className="text-lg font-bold">
              Introducir respuesta (Solo el anfitrión)
            </Label>
            <Input
              id="answer"
              placeholder="Ej: MEDIANOCHE"
              value={answer}
              onChange={(e) => setAnswer(e.target.value.toUpperCase())}
              className="text-center text-xl font-bold tracking-wider"
            />
            <Button
              onClick={handleSubmitAnswer}
              disabled={submitting || !answer.trim()}
              size="lg"
              className="w-full"
            >
              {submitting ? "VERIFICANDO..." : "VERIFICAR RESPUESTA"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Pista: La respuesta es la hora exacta escrita en una sola palabra en mayúsculas
              (ejemplo: DOSCUARENTAYSIETE para las 02:47). Revisa todas las pistas sobre horarios y tiempos.
            </p>
          </div>
        </Card>
      )}

      {!isHost && (
        <div className="text-center text-muted-foreground">
          Esperando a que el anfitrión introduzca la respuesta...
        </div>
      )}
    </div>
    </>
  );
};

export default Phase1;
