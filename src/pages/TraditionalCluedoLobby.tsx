import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, Copy, Play, Users } from "lucide-react";
import {
  createDeck,
  selectSolution,
  dealCards,
  shuffle,
  SUSPECTS,
  WEAPONS,
  ROOMS,
  Card as GameCard,
} from "@/lib/cluedoTraditionalGame";

interface Player {
  id: string;
  name: string;
  is_host: boolean;
  connected: boolean;
  turn_order?: number;
}

interface Game {
  id: string;
  code: string;
  status: string;
  max_players: number;
}

const TraditionalCluedoLobby = () => {
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
        toast.error("Error al cargar los datos de la partida");
        return;
      }
      setGame(gameData);

      if (gameData.status === "RUNNING") {
        navigate(`/cluedo-traditional/game/${gameId}?playerId=${playerId}`);
        return;
      }

      // Cargar jugadores
      const { data: playersData, error: playersError } = await supabase
        .from("cluedo_players")
        .select("*")
        .eq("game_id", gameId)
        .order("created_at", { ascending: true });

      if (playersError) {
        console.error("Error loading players:", playersError);
        return;
      }
      setPlayers(playersData || []);

      // Encontrar jugador actual
      const player = playersData?.find((p) => p.id === playerId);
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
      .channel(`traditional-cluedo-lobby:${gameId}`)
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
            navigate(`/cluedo-traditional/game/${gameId}?playerId=${playerId}`);
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

      // Verificar que hay el número correcto de jugadores
      if (players.length !== game.max_players) {
        toast.error(`Se necesitan exactamente ${game.max_players} jugadores para comenzar`);
        return;
      }

      // Obtener la solución guardada de la partida
      const { data: gameData, error: gameDataError } = await supabase
        .from("cluedo_games")
        .select("solution_suspect_id, solution_weapon_id, solution_room_id")
        .eq("id", gameId)
        .single();

      if (gameDataError || !gameData) {
        console.error("Error loading game solution:", gameDataError);
        toast.error("Error al cargar la solución de la partida");
        return;
      }

      // Obtener los nombres de la solución desde la BD
      const [suspectRes, weaponRes, roomRes] = await Promise.all([
        supabase.from("suspects").select("name").eq("id", gameData.solution_suspect_id).single(),
        supabase.from("weapons").select("name").eq("id", gameData.solution_weapon_id).single(),
        supabase.from("rooms").select("name").eq("id", gameData.solution_room_id).single(),
      ]);

      if (suspectRes.error || weaponRes.error || roomRes.error) {
        console.error("Error loading solution data:", { suspectRes: suspectRes.error, weaponRes: weaponRes.error, roomRes: roomRes.error });
        toast.error("Error al cargar datos del juego. Verifica que las tablas suspects, weapons y rooms estén creadas.");
        return;
      }

      const solutionSuspect = suspectRes.data?.name;
      const solutionWeapon = weaponRes.data?.name;
      const solutionRoom = roomRes.data?.name;

      if (!solutionSuspect || !solutionWeapon || !solutionRoom) {
        toast.error("Error: No se encontraron los datos de la solución");
        return;
      }

      // Crear mazo completo
      const deck = createDeck();
      
      // Filtrar las cartas de la solución del mazo
      const solutionCards = deck.filter(
        card => 
          (card.type === 'SUSPECT' && card.name === solutionSuspect) ||
          (card.type === 'WEAPON' && card.name === solutionWeapon) ||
          (card.type === 'ROOM' && card.name === solutionRoom)
      );

      // Obtener las cartas restantes (sin las de la solución)
      const remainingCards = deck.filter(
        card => !solutionCards.some(sc => sc.id === card.id)
      );

      // Mezclar las cartas restantes antes de repartirlas para mejor distribución
      const shuffledRemainingCards = shuffle(remainingCards);

      // Repartir las cartas restantes (la función dealCards también mezcla, pero mejor hacerlo aquí también)
      const hands = dealCards(shuffledRemainingCards, players.length);

      // Guardar cartas de cada jugador y orden de turno
      for (let i = 0; i < players.length; i++) {
        const player = players[i];
        const playerCards = hands[i];

        // Actualizar orden de turno
        const { error: turnOrderError } = await supabase
          .from("cluedo_players")
          .update({ turn_order: i })
          .eq("id", player.id);

        if (turnOrderError) {
          console.error("Error updating turn order:", turnOrderError);
          throw turnOrderError;
        }

        // Guardar cartas del jugador (usando la tabla clues con formato especial)
        // Primero eliminar cartas antiguas si existen
        await supabase
          .from("clues")
          .delete()
          .eq("game_id", gameId)
          .eq("player_id", player.id)
          .like("text", "CARD:%");

        // Insertar nuevas cartas
        for (const card of playerCards) {
          const { error: insertError } = await supabase.from("clues").insert({
            game_id: gameId!,
            text: `CARD:${card.type}:${card.name}`,
            is_private: true,
            player_id: player.id,
            affects_type: card.type === "SUSPECT" ? "SUSPECT" :
                         card.type === "WEAPON" ? "WEAPON" : "ROOM",
          });

          if (insertError) {
            console.error("Error inserting card:", insertError);
            throw insertError;
          }
        }
      }

      // Establecer el primer jugador como turno inicial
      const firstPlayer = players[0];
      
      // Guardar estado del juego con el turno inicial
      const { error: updateError } = await supabase
        .from("cluedo_games")
        .update({
          status: "RUNNING",
          started_at: new Date().toISOString(),
          current_turn_player_id: firstPlayer.id, // Primer jugador empieza
        })
        .eq("id", gameId);

      if (updateError) {
        console.error("Error updating game status:", updateError);
        throw updateError;
      }

      toast.success("¡Partida iniciada!");
      navigate(`/cluedo-traditional/game/${gameId}?playerId=${playerId}`);
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
              <h1 className="text-3xl font-bold">🕵️ Cluedo Tradicional</h1>
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
                {players.map((player, index) => (
                  <div
                    key={player.id}
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      player.id === playerId ? "bg-primary/10 border-primary" : "bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg w-6">{index + 1}.</span>
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
                  <strong>Jugadores:</strong> {game.max_players}
                </p>
                <p>
                  <strong>Cartas totales:</strong> 21 (6 sospechosos + 6 armas + 9 habitaciones)
                </p>
                <p>
                  <strong>Cartas en solución:</strong> 3 (1 de cada tipo)
                </p>
                <p>
                  <strong>Cartas a repartir:</strong> 18
                </p>
                <p className="text-xs text-muted-foreground mt-4">
                  Las cartas se repartirán equitativamente entre todos los jugadores cuando se inicie la partida.
                </p>
              </div>
            </div>
          </div>

          {currentPlayer.is_host && (
            <div className="mt-6">
              <Button
                onClick={handleStartGame}
                disabled={players.length < 2 || players.length !== game.max_players}
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
              {players.length >= 2 && players.length !== game.max_players && (
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Se necesitan exactamente {game.max_players} jugadores para comenzar
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

export default TraditionalCluedoLobby;

