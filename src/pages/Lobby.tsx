import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Copy, Play } from "lucide-react";

interface Player {
  id: string;
  name: string;
  is_host: boolean;
  connected: boolean;
}

interface GameSession {
  id: string;
  code: string;
  status: string;
}

const Lobby = () => {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const playerId = searchParams.get("playerId");
  const navigate = useNavigate();

  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId || !playerId) {
      navigate("/");
      return;
    }

    loadGameData();
    setupRealtimeSubscription();
  }, [gameId, playerId]);

  const loadGameData = async () => {
    try {
      // Cargar datos de la sesión
      const { data: session, error: sessionError } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("id", gameId)
        .single();

      if (sessionError) throw sessionError;
      setGameSession(session);

      // Cargar jugadores
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("*")
        .eq("game_session_id", gameId)
        .order("created_at", { ascending: true });

      if (playersError) throw playersError;
      setPlayers(playersData);

      // Encontrar el jugador actual
      const player = playersData.find((p) => p.id === playerId);
      setCurrentPlayer(player || null);
    } catch (error) {
      console.error("Error loading game data:", error);
      toast.error("Error al cargar los datos de la partida");
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`lobby:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `game_session_id=eq.${gameId}`,
        },
        () => {
          loadGameData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_sessions",
          filter: `id=eq.${gameId}`,
        },
        (payload: any) => {
          if (payload.new.status === "IN_PROGRESS") {
            navigate(`/game/${gameId}?playerId=${playerId}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleCopyCode = () => {
    if (gameSession) {
      navigator.clipboard.writeText(gameSession.code);
      toast.success("Código copiado al portapapeles");
    }
  };

  const handleStartGame = async () => {
    if (!currentPlayer?.is_host) {
      toast.error("Solo el anfitrión puede iniciar la partida");
      return;
    }

    if (players.length < 3) {
      toast.error("Se necesitan al menos 3 jugadores para comenzar");
      return;
    }

    try {
      // Asignar roles a los jugadores
      const roles: Array<"ANALISTA_TIEMPOS" | "EXPERTO_HUELLAS" | "ENTREVISTADOR" | "CARTOGRAFO" | "PERITO_FORENSE" | "ARCHIVISTA" | "COMUNICACIONES" | "TESTIMONIOS" | "PERFILADOR" | "INTERPRETE_MENSAJES"> = [
        "ANALISTA_TIEMPOS",
        "EXPERTO_HUELLAS",
        "ENTREVISTADOR",
        "CARTOGRAFO",
        "PERITO_FORENSE",
        "ARCHIVISTA",
        "COMUNICACIONES",
        "TESTIMONIOS",
        "PERFILADOR",
        "INTERPRETE_MENSAJES",
      ];

      const shuffledRoles = [...roles].sort(() => Math.random() - 0.5);

      for (let i = 0; i < players.length; i++) {
        await supabase
          .from("players")
          .update({ role: shuffledRoles[i % shuffledRoles.length] })
          .eq("id", players[i].id);
      }

      // Actualizar estado de la primera fase
      await supabase
        .from("phase_states")
        .update({ status: "ACTIVE", started_at: new Date().toISOString() })
        .eq("game_session_id", gameId)
        .eq("phase_number", 1);

      // Iniciar la partida
      await supabase
        .from("game_sessions")
        .update({
          status: "IN_PROGRESS",
          current_phase: 1,
          started_at: new Date().toISOString(),
        })
        .eq("id", gameId);

      toast.success("¡Partida iniciada!");
    } catch (error) {
      console.error("Error starting game:", error);
      toast.error("Error al iniciar la partida");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="text-2xl font-bold text-primary">CARGANDO...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-background">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        {/* Header */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-primary">SALA DE ESPERA</h1>
              <p className="text-muted-foreground">
                {currentPlayer?.is_host
                  ? "Esperando a que se unan más jugadores..."
                  : "Esperando a que el anfitrión inicie la partida..."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Código de sala</div>
                <div className="text-3xl font-bold text-accent tracking-widest">
                  {gameSession?.code}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyCode}
                className="hover:bg-accent/10"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Lista de jugadores */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">
              JUGADORES ({players.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      player.connected ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></div>
                  <span className="font-medium">{player.name}</span>
                </div>
                {player.is_host && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                    ANFITRIÓN
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Botón de inicio */}
        {currentPlayer?.is_host && (
          <Button
            onClick={handleStartGame}
            size="lg"
            className="w-full"
            disabled={players.length < 3}
          >
            <Play className="mr-2 h-5 w-5" />
            INICIAR PARTIDA
          </Button>
        )}

        {!currentPlayer?.is_host && (
          <div className="text-center text-muted-foreground">
            Esperando a que el anfitrión inicie...
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;
