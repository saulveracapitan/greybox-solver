import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Timer, Users, DoorOpen, FileText, AlertTriangle } from "lucide-react";
import PuzzleCard from "@/components/cluedo/PuzzleCard";
import ClueBoard from "@/components/cluedo/ClueBoard";
import AccusationPanel from "@/components/cluedo/AccusationPanel";
import { Puzzle, Clue, Suspect, Weapon, Room } from "@/lib/cluedoGameData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Game {
  id: string;
  code: string;
  status: string;
  time_limit_seconds: number;
  started_at: string;
}

interface Player {
  id: string;
  name: string;
  is_host: boolean;
}

const CluedoGameRoom = () => {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const playerId = searchParams.get("playerId");
  const navigate = useNavigate();

  const [game, setGame] = useState<Game | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [suspects, setSuspects] = useState<Suspect[]>([]);
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [globalClues, setGlobalClues] = useState<Clue[]>([]);
  const [privateClues, setPrivateClues] = useState<Clue[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("00:00");
  const [showAccusation, setShowAccusation] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId || !playerId) {
      navigate("/");
      return;
    }

    loadGameData();
    setupRealtimeSubscription();
  }, [gameId, playerId]);

  // Temporizador
  useEffect(() => {
    if (!game?.started_at || game?.status !== "RUNNING") return;

    const updateTimer = () => {
      const start = new Date(game.started_at);
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000);
      const remaining = game.time_limit_seconds - elapsed;

      if (remaining <= 0) {
        setTimeRemaining("00:00");
        // El backend debería marcar como LOSE, pero por si acaso
        return;
      }

      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [game?.started_at, game?.status, game?.time_limit_seconds]);

  const loadGameData = async () => {
    try {
      // Cargar partida
      const { data: gameData, error: gameError } = await supabase
        .from("cluedo_games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (gameError) throw gameError;
      setGame(gameData);

      if (gameData.status === "WIN" || gameData.status === "LOSE") {
        navigate(`/cluedo/result/${gameId}?playerId=${playerId}`);
        return;
      }

      // Cargar jugador actual
      const { data: playerData, error: playerError } = await supabase
        .from("cluedo_players")
        .select("*")
        .eq("id", playerId)
        .single();

      if (playerError) throw playerError;
      setCurrentPlayer(playerData);

      // Cargar todos los jugadores
      const { data: allPlayers, error: allPlayersError } = await supabase
        .from("cluedo_players")
        .select("*")
        .eq("game_id", gameId)
        .order("created_at", { ascending: true });

      if (!allPlayersError) {
        setPlayers(allPlayers || []);
      }

      // Cargar datos maestros
      const [suspectsRes, weaponsRes, roomsRes] = await Promise.all([
        supabase.from("suspects").select("*").order("name"),
        supabase.from("weapons").select("*").order("name"),
        supabase.from("rooms").select("*").order("name"),
      ]);

      if (!suspectsRes.error) setSuspects(suspectsRes.data || []);
      if (!weaponsRes.error) setWeapons(weaponsRes.data || []);
      if (!roomsRes.error) setRooms(roomsRes.data || []);

      // Cargar puzzles
      const { data: puzzlesData, error: puzzlesError } = await supabase
        .from("puzzles")
        .select("*")
        .eq("game_id", gameId)
        .order("created_at", { ascending: true });

      if (!puzzlesError) {
        setPuzzles(puzzlesData || []);
      }

      // Cargar pistas
      const { data: cluesData, error: cluesError } = await supabase
        .from("clues")
        .select("*")
        .eq("game_id", gameId)
        .order("created_at", { ascending: false });

      if (!cluesError && cluesData) {
        setGlobalClues(cluesData.filter((c) => !c.is_private));
        setPrivateClues(cluesData.filter((c) => c.is_private && c.player_id === playerId));
      }
    } catch (error) {
      console.error("Error loading game data:", error);
      toast.error("Error al cargar datos del juego");
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`cluedo-game:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cluedo_games",
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
          table: "puzzles",
          filter: `game_id=eq.${gameId}`,
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
          table: "clues",
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          loadGameData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handlePuzzleSolved = () => {
    loadGameData();
  };

  const handleAccusationResult = (isCorrect: boolean) => {
    if (isCorrect) {
      setTimeout(() => {
        navigate(`/cluedo/result/${gameId}?playerId=${playerId}`);
      }, 2000);
    } else {
      loadGameData();
    }
  };

  const puzzlesInRoom = selectedRoom
    ? puzzles.filter((p) => p.room_id === selectedRoom)
    : [];

  const currentRoom = rooms.find((r) => r.id === selectedRoom);

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
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <Card className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">🔍 Cluedo Escape Room</h1>
              <p className="text-sm text-muted-foreground">
                Jugando como: <strong>{currentPlayer.name}</strong>
                {currentPlayer.is_host && (
                  <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                    Host
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                <span className="text-2xl font-bold">{timeRemaining}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>{players.length} jugadores</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Columna izquierda: Salas y Puzzles */}
          <div className="lg:col-span-2 space-y-4">
            {/* Lista de salas */}
            <Card className="p-4">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <DoorOpen className="h-5 w-5" />
                Salas Disponibles
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {rooms.map((room) => {
                  const roomPuzzles = puzzles.filter((p) => p.room_id === room.id);
                  const solvedCount = roomPuzzles.filter((p) => p.solved).length;
                  const totalCount = roomPuzzles.length;

                  return (
                    <Button
                      key={room.id}
                      variant={selectedRoom === room.id ? "default" : "outline"}
                      onClick={() => setSelectedRoom(room.id)}
                      className="h-auto p-4 flex flex-col items-start"
                    >
                      <span className="font-bold">{room.name}</span>
                      {totalCount > 0 && (
                        <span className="text-xs text-muted-foreground mt-1">
                          {solvedCount}/{totalCount} puzzles
                        </span>
                      )}
                    </Button>
                  );
                })}
              </div>
            </Card>

            {/* Puzzles de la sala seleccionada */}
            {selectedRoom && (
              <Card className="p-4">
                <h2 className="text-xl font-bold mb-4">
                  {currentRoom?.name || "Sala"}
                </h2>
                {puzzlesInRoom.length === 0 ? (
                  <p className="text-muted-foreground">
                    No hay puzzles en esta sala.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {puzzlesInRoom.map((puzzle) => (
                      <PuzzleCard
                        key={puzzle.id}
                        puzzle={puzzle}
                        gameId={gameId!}
                        playerId={playerId!}
                        onSolved={handlePuzzleSolved}
                      />
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Columna derecha: Pistas y Acusación */}
          <div className="space-y-4">
            <ClueBoard
              globalClues={globalClues}
              privateClues={privateClues}
              playerName={currentPlayer.name}
            />

            <Dialog open={showAccusation} onOpenChange={setShowAccusation}>
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full"
                  size="lg"
                >
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Acusación Final
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Acusación Final</DialogTitle>
                  <DialogDescription>
                    Selecciona el sospechoso, el arma y la sala del crimen.
                  </DialogDescription>
                </DialogHeader>
                <AccusationPanel
                  gameId={gameId!}
                  playerId={playerId!}
                  suspects={suspects}
                  weapons={weapons}
                  rooms={rooms}
                  isHost={currentPlayer.is_host}
                  onAccusationResult={handleAccusationResult}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CluedoGameRoom;

