import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { User, Clock, FileText, Send } from "lucide-react";
import Phase1 from "@/components/phases/Phase1";
import Phase2 from "@/components/phases/Phase2";
import Phase3 from "@/components/phases/Phase3";
import Phase4 from "@/components/phases/Phase4";

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

  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [phaseStates, setPhaseStates] = useState<PhaseState[]>([]);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [newLogMessage, setNewLogMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId || !playerId) return;

    loadGameData();
    setupRealtimeSubscription();
  }, [gameId, playerId]);

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

      // Cargar jugador actual
      const { data: player, error: playerError } = await supabase
        .from("players")
        .select("*")
        .eq("id", playerId)
        .single();

      if (playerError) throw playerError;
      setCurrentPlayer(player);

      // Cargar estados de fases
      const { data: phases, error: phasesError } = await supabase
        .from("phase_states")
        .select("*")
        .eq("game_session_id", gameId)
        .order("phase_number");

      if (phasesError) throw phasesError;
      setPhaseStates(phases);

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

          {/* Muro de hallazgos compartido */}
          <div className="space-y-4">
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
