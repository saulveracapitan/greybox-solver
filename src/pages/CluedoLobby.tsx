import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, Copy, Play, Users } from "lucide-react";
import { generatePrivateClues } from "@/lib/cluedoGameData";

interface Player {
  id: string;
  name: string;
  is_host: boolean;
  connected: boolean;
}

interface Game {
  id: string;
  code: string;
  status: string;
  max_players: number;
  time_limit_seconds: number;
}

const CluedoLobby = () => {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const playerId = searchParams.get("playerId");
  const navigate = useNavigate();

  const [game, setGame] = useState<Game | null>(null);
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
      // Cargar partida
      const { data: gameData, error: gameError } = await supabase
        .from("cluedo_games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (gameError) {
        console.error("Error loading game:", gameError);
        if (gameError.code === 'PGRST116' || gameError.message?.includes('does not exist')) {
          toast.error("Error: Las tablas no están creadas. Ejecuta las migraciones SQL primero.");
        } else {
          toast.error(`Error al cargar partida: ${gameError.message}`);
        }
        throw gameError;
      }
      setGame(gameData);

      // Cargar jugadores
      const { data: playersData, error: playersError } = await supabase
        .from("cluedo_players")
        .select("*")
        .eq("game_id", gameId)
        .order("created_at", { ascending: true });

      if (playersError) {
        console.error("Error loading players:", playersError);
        if (playersError.code === 'PGRST116' || playersError.message?.includes('does not exist')) {
          toast.error("Error: Las tablas no están creadas. Ejecuta las migraciones SQL primero.");
        } else {
          toast.error(`Error al cargar jugadores: ${playersError.message}`);
        }
        throw playersError;
      }
      setPlayers(playersData || []);

      // Encontrar jugador actual
      const player = playersData?.find((p) => p.id === playerId);
      setCurrentPlayer(player || null);
    } catch (error: any) {
      console.error("Error loading game data:", error);
      if (!error.message?.includes('tablas no están creadas')) {
        toast.error(`Error al cargar los datos de la partida: ${error.message || 'Error desconocido'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`cluedo-lobby:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cluedo_players",
          filter: `game_id=eq.${gameId}`,
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
          table: "cluedo_games",
          filter: `id=eq.${gameId}`,
        },
        (payload: any) => {
          if (payload.new.status === "RUNNING") {
            navigate(`/cluedo/game/${gameId}?playerId=${playerId}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleCopyCode = () => {
    if (game) {
      navigator.clipboard.writeText(game.code);
      toast.success("Código copiado al portapapeles");
    }
  };

  const handleStartGame = async () => {
    if (!game || !currentPlayer || !currentPlayer.is_host) return;

    try {
      // Verificar que hay al menos 2 jugadores
      if (players.length < 2) {
        toast.error("Se necesitan al menos 2 jugadores para comenzar");
        return;
      }

      // Obtener datos maestros
      const [suspectsRes, weaponsRes, roomsRes] = await Promise.all([
        supabase.from("suspects").select("*"),
        supabase.from("weapons").select("*"),
        supabase.from("rooms").select("*"),
      ]);

      if (suspectsRes.error || weaponsRes.error || roomsRes.error) {
        throw new Error("Error al cargar datos del juego");
      }

      const suspects = suspectsRes.data || [];
      const weapons = weaponsRes.data || [];
      const rooms = roomsRes.data || [];

      // Obtener solución de la partida
      const { data: gameData } = await supabase
        .from("cluedo_games")
        .select("solution_suspect_id, solution_weapon_id, solution_room_id")
        .eq("id", gameId)
        .single();

      if (!gameData) throw new Error("Error al obtener solución");

      const solution = {
        suspect_id: gameData.solution_suspect_id,
        weapon_id: gameData.solution_weapon_id,
        room_id: gameData.solution_room_id,
      };

      // Generar y asignar pistas privadas a cada jugador
      for (const player of players) {
        const privateClues = generatePrivateClues(
          solution,
          suspects,
          weapons,
          rooms,
          players.length
        );

        // Crear pistas privadas para este jugador
        for (const clueText of privateClues) {
          await supabase.from("clues").insert({
            game_id: gameId!,
            text: clueText,
            is_private: true,
            player_id: player.id,
            affects_type: clueText.includes("sospechoso") ? "SUSPECT" :
                         clueText.includes("arma") ? "WEAPON" :
                         clueText.includes("ocurrió") ? "ROOM" : "NONE",
          });
        }
      }

      // Crear puzzles para cada sala
      const puzzleTemplates = (await import("@/lib/cluedoGameData")).PUZZLE_TEMPLATES;
      
      for (const room of rooms) {
        const templates = puzzleTemplates[room.name] || [];
        for (const template of templates) {
          await supabase.from("puzzles").insert({
            game_id: gameId!,
            room_id: room.id,
            type: template.type,
            title: template.title,
            question: template.question,
            data: template.data,
            solution: template.solution,
            solved: false,
          });
        }
      }

      // Iniciar partida
      await supabase
        .from("cluedo_games")
        .update({
          status: "RUNNING",
          started_at: new Date().toISOString(),
        })
        .eq("id", gameId);

      toast.success("¡Partida iniciada!");
      navigate(`/cluedo/game/${gameId}?playerId=${playerId}`);
    } catch (error: any) {
      console.error("Error starting game:", error);
      toast.error(error.message || "Error al iniciar la partida");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  if (!game || !currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Error: No se encontró la partida</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">🔍 Cluedo Escape Room</h1>
              <p className="text-muted-foreground">Lobby de la partida</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Código de partida</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{game.code}</p>
                <Button variant="ghost" size="icon" onClick={handleCopyCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Jugadores ({players.length}/{game.max_players})
              </h2>
              <div className="space-y-2">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      player.id === playerId ? "bg-primary/10 border-primary" : "bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{player.name}</span>
                      {player.is_host && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                          Host
                        </span>
                      )}
                    </div>
                    {player.connected && (
                      <div className="h-2 w-2 bg-green-500 rounded-full" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4">Configuración</h2>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Tiempo límite:</strong> {Math.floor(game.time_limit_seconds / 60)} minutos
                </p>
                <p>
                  <strong>Máximo de jugadores:</strong> {game.max_players}
                </p>
              </div>
            </div>
          </div>

          {currentPlayer.is_host && (
            <div className="mt-6">
              <Button
                onClick={handleStartGame}
                disabled={players.length < 2}
                className="w-full"
                size="lg"
              >
                <Play className="mr-2 h-5 w-5" />
                Iniciar Partida
              </Button>
              {players.length < 2 && (
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Se necesitan al menos 2 jugadores para comenzar
                </p>
              )}
            </div>
          )}

          {!currentPlayer.is_host && (
            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                Esperando a que el host inicie la partida...
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CluedoLobby;

