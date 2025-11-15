import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapPin, Check, Camera, Moon, Route } from "lucide-react";
import { getCaseById, GameCase } from "@/lib/gameCases";
import PenaltyChallenge from "@/components/PenaltyChallenge";
import { getRandomPenaltyChallenge, PenaltyChallenge as PenaltyChallengeType } from "@/lib/penaltyChallenges";

interface Phase3Props {
  gameId: string;
  playerId: string;
  playerRole: string;
  isHost: boolean;
}

const Phase3 = ({ gameId, playerId, playerRole, isHost }: Phase3Props) => {
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
      if (penaltyData && penaltyData.phase === 3) {
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

  // Pistas sobre la ruta por rol (fallback si no hay caso)
  const routeCluesByRole: Record<string, string[]> = {
    ANALISTA_TIEMPOS: [
      "El asesino llegó al edificio a las 23:30",
      "Tiempo de desplazamiento entre puntos: 5-7 minutos",
      "La alarma se activó a las 00:15, momento de escape",
    ],
    EXPERTO_HUELLAS: [
      "Huellas encontradas en la entrada trasera (Punto A)",
      "Rastros de barro en el pasillo central (Punto C)",
      "Sin huellas en la salida principal (Punto E)",
    ],
    ENTREVISTADOR: [
      "Testigo vio movimiento en el ala este a las 23:45",
      "Nadie reportó actividad en el ala oeste",
      "Un guardia escuchó pasos cerca del almacén (Punto D)",
    ],
    CARTOGRAFO: [
      "Mapa del edificio: 5 puntos clave identificados",
      "Ruta más corta: A → B → C → D → E",
      "Ruta alternativa: A → C → D → E (evita B)",
      "Zona sin cámaras: Corredor entre C y D",
    ],
    PERITO_FORENSE: [
      "Evidencia de sangre en el Punto B",
      "Objeto contundente encontrado en el Punto D",
      "Fibras textiles en el Punto C",
    ],
    ARCHIVISTA: [
      "Expediente del sospechoso: Conocía el edificio",
      "Planos antiguos muestran acceso por Punto A",
      "Registro de visitas previas al Punto D",
    ],
    COMUNICACIONES: [
      "Cámara en Punto A: Activada 23:30-23:35",
      "Cámara en Punto B: Deshabilitada 23:40-23:50",
      "Cámara en Punto E: Sin actividad registrada",
    ],
    TESTIMONIOS: [
      "Testigo A: 'Vi una sombra moverse hacia el este'",
      "Testigo B: 'Escuché ruidos en el pasillo central'",
      "Testigo C: 'Nadie salió por la puerta principal'",
    ],
    PERFILADOR: [
      "El asesino evitó áreas con alta visibilidad",
      "Preferencia por rutas con cobertura",
      "Conocimiento de puntos ciegos del sistema",
    ],
    INTERPRETE_MENSAJES: [
      "Código encontrado: 'A-C-D-E'",
      "Nota: 'Evitar B, demasiado expuesto'",
      "Mensaje: 'La salida está en E'",
    ],
  };

  const checkPhaseStatus = async () => {
    const { data, error } = await supabase
      .from("phase_states")
      .select("status")
      .eq("game_session_id", gameId)
      .eq("phase_number", 3)
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
    const correctAnswer = gameCase.phase3.correctRoute.toUpperCase().trim().replace(/\s+/g, "");
    const userAnswer = answer.toUpperCase().trim().replace(/\s+/g, "");

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
                phase: 3,
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
        .eq("phase_number", 3);

      // Activar Fase 4
      await supabase
        .from("phase_states")
        .update({
          status: "ACTIVE",
          started_at: new Date().toISOString(),
        })
        .eq("game_session_id", gameId)
        .eq("phase_number", 4);

      // Obtener código actual y actualizar con tercer y cuarto dígito
      const { data: session } = await supabase
        .from("game_sessions")
        .select("lockbox_code")
        .eq("id", gameId)
        .single();

      const currentCode = session?.lockbox_code || "XXXXX";
      const thirdDigit = gameCase.phase3.thirdDigit;
      const fourthDigit = gameCase.phase3.fourthDigit;
      // Reemplazar las X restantes con los dígitos
      let newCode = currentCode;
      newCode = newCode.replace(/X/, thirdDigit);
      newCode = newCode.replace(/X/, fourthDigit);

      await supabase
        .from("game_sessions")
        .update({
          current_phase: 4,
          lockbox_code: newCode,
        })
        .eq("id", gameId);

      toast.success(`¡Fase 3 completada! Tercer y cuarto dígito revelados: ${thirdDigit} y ${fourthDigit}`);
      setPhaseCompleted(true);
    } catch (error) {
      console.error("Error completing phase:", error);
      toast.error("Error al completar la fase");
    } finally {
      setSubmitting(false);
    }
  };

  // Usar pistas del caso si está disponible
  const clues = gameCase?.phase3.routeClues[playerRole] || routeCluesByRole[playerRole] || [
    "No hay pistas asignadas para este rol.",
  ];

  // Usar mapa del caso si está disponible
  const mapLocations = gameCase?.phase3.mapPoints || [
    { id: "A", name: "Entrada Trasera", x: 10, y: 80 },
    { id: "B", name: "Oficina Principal", x: 50, y: 30 },
    { id: "C", name: "Pasillo Central", x: 50, y: 50 },
    { id: "D", name: "Almacén", x: 80, y: 50 },
    { id: "E", name: "Salida Principal", x: 90, y: 20 },
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
          ¡FASE 3 COMPLETADA!
        </h3>
        <p className="text-muted-foreground">
          El tercer y cuarto dígito del candado han sido revelados: <span className="text-3xl font-bold text-accent">{gameCase.phase3.thirdDigit}</span> y <span className="text-3xl font-bold text-accent">{gameCase.phase3.fourthDigit}</span>
        </p>
        <div className="bg-muted p-4 rounded-lg max-w-2xl mx-auto">
          <p className="text-sm">
            <strong>Narrativa:</strong> Habéis rastreado la ruta exacta del asesino.
            La ruta {gameCase.phase3.correctRoute} fue la utilizada, aprovechando las zonas
            sin cámaras y los puntos ciegos del sistema. Ahora solo falta el último dígito
            para abrir la Caja Grey...
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
          <strong>Contexto:</strong> El edificio tiene 5 puntos clave identificados en el
          mapa. El asesino entró por la entrada trasera y salió por la salida principal,
          pero evitó ciertas áreas. Cada uno de vosotros tiene información sobre cámaras,
          zonas sin luz, rutas posibles y testimonios. Deberéis deducir la secuencia exacta
          de puntos que siguió el asesino (sin espacios, solo letras, ejemplo: ACDE).
        </p>
      </div>

      {/* Mapa simplificado */}
      <Card className="p-4 bg-card/50">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-clue" />
          <h3 className="font-bold">MAPA DEL EDIFICIO</h3>
        </div>
        <div className="relative bg-background rounded-lg p-6 border-2 border-clue min-h-[300px]">
          {mapLocations.map((loc) => (
            <div
              key={loc.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
            >
              <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg border-2 border-accent shadow-lg">
                {loc.id}
              </div>
              <div className="text-xs text-center mt-1 text-muted-foreground whitespace-nowrap">
                {loc.name}
              </div>
            </div>
          ))}
          {/* Líneas de conexión (simplificadas) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <line
              x1="10%"
              y1="80%"
              x2="50%"
              y2="50%"
              stroke="hsl(var(--clue))"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.5"
            />
            <line
              x1="50%"
              y1="50%"
              x2="80%"
              y2="50%"
              stroke="hsl(var(--clue))"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.5"
            />
            <line
              x1="80%"
              y1="50%"
              x2="90%"
              y2="20%"
              stroke="hsl(var(--clue))"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.5"
            />
            <line
              x1="10%"
              y1="80%"
              x2="50%"
              y2="30%"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity="0.3"
            />
            <line
              x1="50%"
              y1="30%"
              x2="80%"
              y2="50%"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity="0.3"
            />
          </svg>
        </div>
        <div className="mt-4 text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <Camera className="h-3 w-3" />
            <span>Puntos con cámaras activas</span>
          </div>
          <div className="flex items-center gap-2">
            <Moon className="h-3 w-3" />
            <span>Zonas sin luz / puntos ciegos</span>
          </div>
          <div className="flex items-center gap-2">
            <Route className="h-3 w-3" />
            <span>Rutas posibles (líneas punteadas)</span>
          </div>
        </div>
      </Card>

      {/* Pistas del rol */}
      <Card className="p-4 bg-card/50">
        <div className="flex items-center gap-2 mb-3">
          <Route className="h-5 w-5 text-clue" />
          <h3 className="font-bold">TUS PISTAS SOBRE LA RUTA</h3>
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
          <strong>Instrucciones:</strong> Compartid vuestras pistas en el muro de hallazgos.
          Discutid y deducid la secuencia exacta de puntos que siguió el asesino. La respuesta
          es una secuencia de letras sin espacios (ejemplo: ACDE). El asesino empezó en A y
          terminó en E, pero evitó el punto B porque estaba demasiado expuesto.
        </p>
      </div>

      {/* Input de respuesta */}
      {isHost && (
        <Card className="p-4">
          <div className="space-y-4">
            <Label htmlFor="answer" className="text-lg font-bold">
              Introducir secuencia de ruta (Solo el anfitrión)
            </Label>
            <Input
              id="answer"
              placeholder="Ej: ACFGHDE"
              value={answer}
              onChange={(e) => setAnswer(e.target.value.toUpperCase().replace(/[^A-J]/g, ""))}
              className="text-center text-xl font-bold tracking-wider"
              maxLength={10}
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
              Pista: La ruta debe pasar por 7 puntos, incluyendo el almacén (F) y la sala de control (G). Evita los puntos B, I y J.
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

export default Phase3;
