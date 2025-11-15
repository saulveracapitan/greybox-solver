import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { User, Clock, FileText, Send, Timer } from "lucide-react";
import Phase1 from "@/components/phases/Phase1";
import Phase2 from "@/components/phases/Phase2";
import Phase3 from "@/components/phases/Phase3";
import Phase4 from "@/components/phases/Phase4";
import HostPanel from "@/components/HostPanel";
import PhysicalChallenge from "@/components/PhysicalChallenge";
import { getCaseById, GameCase } from "@/lib/gameCases";

interface Player {
  id: string;
  name: string;
  role: string;
  is_host: boolean;
}

interface GameSession {
  id: string;
  code: string;
  status: string;
  current_phase: number;
  lockbox_code: string;
  started_at: string;
}

interface PhaseState {
  phase_number: number;
  status: string;
}

interface LogEntry {
  id: string;
  player_id: string;
  message: string;
  created_at: string;
  players: { name: string };
}

const GamePlay = () => {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const playerId = searchParams.get("playerId");
  const navigate = useNavigate();

  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [phaseStates, setPhaseStates] = useState<PhaseState[]>([]);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [newLogMessage, setNewLogMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState<string>("00:00");
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [gameCase, setGameCase] = useState<GameCase | null>(null);
  const [showPhysicalChallenge, setShowPhysicalChallenge] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState<any>(null);

  useEffect(() => {
    if (!gameId || !playerId) return;

    loadGameData();
    setupRealtimeSubscription();
  }, [gameId, playerId]);

  // Temporizador
  useEffect(() => {
    if (!gameSession?.started_at || gameSession?.status !== "IN_PROGRESS") return;

    const updateTimer = () => {
      const start = new Date(gameSession.started_at);
      const now = new Date();
      const diff = now.getTime() - start.getTime();
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setElapsedTime(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [gameSession?.started_at, gameSession?.status]);

  const loadGameData = async () => {
    try {
      // Cargar sesión de juego
      const { data: session, error: sessionError } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("id", gameId)
        .single();

      if (sessionError) throw sessionError;
      setGameSession(session);

      // Redirigir a victoria si el juego está completado
      if (session.status === "COMPLETED") {
        navigate(`/game/${gameId}/victory?playerId=${playerId}`);
        return;
      }

      // Cargar jugador actual
      const { data: player, error: playerError } = await supabase
        .from("players")
        .select("*")
        .eq("id", playerId)
        .single();

      if (playerError) throw playerError;
      setCurrentPlayer(player);

      // Cargar todos los jugadores (para el panel de host)
      const { data: allPlayersData, error: allPlayersError } = await supabase
        .from("players")
        .select("id, name, connected, eliminated")
        .eq("game_session_id", gameId);

      if (!allPlayersError && allPlayersData) {
        setAllPlayers(allPlayersData);
      }

      // Cargar estados de fases
      const { data: phases, error: phasesError } = await supabase
        .from("phase_states")
        .select("*")
        .eq("game_session_id", gameId)
        .order("phase_number");

      if (phasesError) throw phasesError;
      setPhaseStates(phases);

      // Cargar caso del juego
      if (session.data?.caseId) {
        const caseData = getCaseById(session.data.caseId);
        if (caseData) {
          setGameCase(caseData);
          // Verificar desafíos físicos después de cargar phaseStates
          setTimeout(() => {
            checkForPhysicalChallenge(caseData, session.current_phase);
          }, 100);
        }
      }

      // Cargar entradas del log
      loadLogEntries();
    } catch (error) {
      console.error("Error loading game data:", error);
      toast.error("Error al cargar datos del juego");
    } finally {
      setLoading(false);
    }
  };

  const loadLogEntries = async () => {
    const { data, error } = await supabase
      .from("shared_log_entries")
      .select(`
        id,
        player_id,
        message,
        created_at,
        players:player_id (name)
      `)
      .eq("game_session_id", gameId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error loading log:", error);
    } else {
      setLogEntries(data as any);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`game:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_sessions",
          filter: `id=eq.${gameId}`,
        },
        () => {
          loadGameData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "phase_states",
          filter: `game_session_id=eq.${gameId}`,
        },
        () => {
          loadGameData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "shared_log_entries",
          filter: `game_session_id=eq.${gameId}`,
        },
        () => {
          loadLogEntries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handlePublishFinding = async () => {
    if (!newLogMessage.trim() || !gameSession) return;

    try {
      await supabase.from("shared_log_entries").insert({
        game_session_id: gameSession.id,
        player_id: playerId,
        phase_number: gameSession.current_phase,
        message: newLogMessage,
      });

      setNewLogMessage("");
      toast.success("Hallazgo publicado");
    } catch (error) {
      console.error("Error publishing finding:", error);
      toast.error("Error al publicar hallazgo");
    }
  };

  const getRoleName = (role: string) => {
    const roleNames: Record<string, string> = {
      ANALISTA_TIEMPOS: "Analista de Tiempos",
      EXPERTO_HUELLAS: "Experto en Huellas",
      ENTREVISTADOR: "Entrevistador",
      CARTOGRAFO: "Cartógrafo",
      PERITO_FORENSE: "Perito Forense",
      ARCHIVISTA: "Archivista",
      COMUNICACIONES: "Comunicaciones",
      TESTIMONIOS: "Testimonios",
      PERFILADOR: "Perfilador",
      INTERPRETE_MENSAJES: "Intérprete de Mensajes",
    };
    return roleNames[role] || role;
  };

  const checkForPhysicalChallenge = (caseData: GameCase, currentPhase: number) => {
    // Buscar desafío entre la fase anterior y la actual
    const challenge = caseData.interPhaseChallenges?.find(
      (ch) => ch.betweenPhases[1] === currentPhase
    );

    if (challenge) {
      // Verificar si la fase anterior está completada
      const previousPhase = phaseStates.find(
        (ps) => ps.phase_number === challenge.betweenPhases[0]
      );

      if (previousPhase?.status === "COMPLETED") {
        setCurrentChallenge(challenge.challenge);
        setShowPhysicalChallenge(true);
      }
    }
  };

  const handleChallengeComplete = async () => {
    setShowPhysicalChallenge(false);
    setCurrentChallenge(null);
    // Recargar datos del juego
    await loadGameData();
  };

  const handlePlayerEliminated = async (eliminatedPlayerId: string) => {
    // Recargar jugadores
    const { data: players } = await supabase
      .from("players")
      .select("id, name, role, is_host, eliminated")
      .eq("game_session_id", gameId);

    if (players) {
      setAllPlayers(players as Player[]);
    }

    // Si el jugador eliminado es el actual, redirigir
    if (eliminatedPlayerId === playerId) {
      toast.error("Has sido eliminado del juego");
      navigate("/");
    }
  };

  const getPhaseTitle = (phase: number) => {
    const titles: Record<number, string> = {
      1: "Fase 1: La Escena del Crimen",
      2: "Fase 2: Los Archivos Rotos",
      3: "Fase 3: La Ruta del Asesino",
      4: "Fase 4: La Caja Grey",
    };
    return titles[phase] || `Fase ${phase}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-2xl font-bold text-primary">CARGANDO INVESTIGACIÓN...</div>
      </div>
    );
  }

  if (!gameSession || !currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-xl text-destructive">Error: Sesión no encontrada</div>
      </div>
    );
  }

  // Mostrar desafío físico si está activo
  if (showPhysicalChallenge && currentChallenge) {
    return (
      <PhysicalChallenge
        gameId={gameId!}
        playerId={playerId!}
        isHost={currentPlayer.is_host}
        challenge={currentChallenge}
        onComplete={handleChallengeComplete}
        onPlayerEliminated={handlePlayerEliminated}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header con información del jugador */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-primary" />
              <div>
                <div className="font-bold text-lg">{currentPlayer.name}</div>
                <div className="text-sm text-accent">
                  {getRoleName(currentPlayer.role)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {gameSession.status === "IN_PROGRESS" && (
                <>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <Timer className="h-3 w-3" />
                      Tiempo
                    </div>
                    <div className="text-xl font-bold text-primary font-mono">
                      {elapsedTime}
                    </div>
                  </div>
                  <Separator orientation="vertical" className="h-12" />
                </>
              )}
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Fase Actual</div>
                <div className="text-xl font-bold text-primary">
                  {gameSession.current_phase}/4
                </div>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Código Sala</div>
                <div className="text-xl font-bold text-accent tracking-wider">
                  {gameSession.code}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Área principal del juego */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-primary mb-4">
                {getPhaseTitle(gameSession.current_phase)}
              </h2>
              <Separator className="my-4" />
              
              {gameSession.current_phase === 1 && (
                <Phase1
                  gameId={gameId!}
                  playerId={playerId!}
                  playerRole={currentPlayer.role}
                  isHost={currentPlayer.is_host}
                />
              )}
              {gameSession.current_phase === 2 && (
                <Phase2
                  gameId={gameId!}
                  playerId={playerId!}
                  playerRole={currentPlayer.role}
                  isHost={currentPlayer.is_host}
                />
              )}
              {gameSession.current_phase === 3 && (
                <Phase3
                  gameId={gameId!}
                  playerId={playerId!}
                  playerRole={currentPlayer.role}
                  isHost={currentPlayer.is_host}
                />
              )}
              {gameSession.current_phase === 4 && (
                <Phase4
                  gameId={gameId!}
                  playerId={playerId!}
                  playerRole={currentPlayer.role}
                  isHost={currentPlayer.is_host}
                />
              )}
            </Card>
          </div>

          {/* Panel lateral derecho */}
          <div className="space-y-4">
            {/* Panel de host (solo visible para anfitrión) */}
            {currentPlayer.is_host && (
              <HostPanel
                gameId={gameId!}
                currentPhase={gameSession.current_phase}
                players={allPlayers}
                hostPlayerId={playerId!}
              />
            )}

            {/* Muro de hallazgos compartido */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-clue" />
                <h3 className="font-bold">MURO DE HALLAZGOS</h3>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                {logEntries.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No hay hallazgos publicados todavía
                  </div>
                ) : (
                  <div className="space-y-3">
                    {logEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-3 bg-muted rounded-lg border-l-4 border-clue"
                      >
                        <div className="text-xs text-muted-foreground mb-1">
                          {entry.players?.name || "Unknown"} •{" "}
                          {new Date(entry.created_at).toLocaleTimeString()}
                        </div>
                        <div className="text-sm">{entry.message}</div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <Separator className="my-4" />

              <div className="space-y-2">
                <Input
                  placeholder="Publicar un hallazgo..."
                  value={newLogMessage}
                  onChange={(e) => setNewLogMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handlePublishFinding();
                  }}
                  className="bg-background"
                />
                <Button
                  onClick={handlePublishFinding}
                  className="w-full"
                  size="sm"
                  disabled={!newLogMessage.trim()}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Publicar
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePlay;
