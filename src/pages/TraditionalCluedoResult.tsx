import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Trophy, Users, Clock } from "lucide-react";

interface Game {
  id: string;
  code: string;
  status: string;
  started_at: string;
  finished_at: string;
  solution_suspect_id: number;
  solution_weapon_id: number;
  solution_room_id: number;
}

interface Suspect {
  id: number;
  name: string;
}

interface Weapon {
  id: number;
  name: string;
}

interface Room {
  id: number;
  name: string;
}

interface Accusation {
  player_name: string;
  is_correct: boolean;
}

const TraditionalCluedoResult = () => {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const playerId = searchParams.get("playerId");
  const navigate = useNavigate();

  const [game, setGame] = useState<Game | null>(null);
  const [solutionSuspect, setSolutionSuspect] = useState<Suspect | null>(null);
  const [solutionWeapon, setSolutionWeapon] = useState<Weapon | null>(null);
  const [solutionRoom, setSolutionRoom] = useState<Room | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [accusations, setAccusations] = useState<Accusation[]>([]);
  const [timeTaken, setTimeTaken] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) {
      navigate("/");
      return;
    }

    loadResultData();
  }, [gameId]);

  const loadResultData = async () => {
    try {
      // Cargar partida
      const { data: gameData, error: gameError } = await supabase
        .from("cluedo_games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (gameError) throw gameError;
      setGame(gameData);

      // Calcular tiempo transcurrido
      if (gameData.started_at && gameData.finished_at) {
        const start = new Date(gameData.started_at);
        const end = new Date(gameData.finished_at);
        const diff = Math.floor((end.getTime() - start.getTime()) / 1000);
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        setTimeTaken(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      }

      // Cargar solución
      const [suspectsRes, weaponsRes, roomsRes] = await Promise.all([
        supabase.from("suspects").select("*").eq("id", gameData.solution_suspect_id).single(),
        supabase.from("weapons").select("*").eq("id", gameData.solution_weapon_id).single(),
        supabase.from("rooms").select("*").eq("id", gameData.solution_room_id).single(),
      ]);

      if (!suspectsRes.error) setSolutionSuspect(suspectsRes.data);
      if (!weaponsRes.error) setSolutionWeapon(weaponsRes.data);
      if (!roomsRes.error) setSolutionRoom(roomsRes.data);

      // Cargar acusaciones correctas (ganador)
      const { data: accusationsData } = await supabase
        .from("accusations")
        .select(`
          is_correct,
          cluedo_players!inner(name)
        `)
        .eq("game_id", gameId)
        .eq("is_correct", true)
        .limit(1);

      if (accusationsData && accusationsData.length > 0) {
        const winnerName = (accusationsData[0] as any).cluedo_players?.name;
        setWinner(winnerName || null);
      }

      // Cargar todas las acusaciones
      const { data: allAccusations } = await supabase
        .from("accusations")
        .select(`
          is_correct,
          cluedo_players!inner(name)
        `)
        .eq("game_id", gameId)
        .not("is_correct", "is", null) // Solo acusaciones, no sugerencias
        .order("created_at", { ascending: false });

      if (allAccusations) {
        setAccusations(
          allAccusations.map((acc: any) => ({
            player_name: acc.cluedo_players?.name || "Desconocido",
            is_correct: acc.is_correct,
          }))
        );
      }
    } catch (error) {
      console.error("Error loading result data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Cargando resultados...</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Error: No se encontró la partida</div>
      </div>
    );
  }

  const isWin = game.status === "WIN";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 space-y-6">
        <div className="text-center space-y-4">
          {isWin ? (
            <>
              <div className="flex justify-center">
                <div className="rounded-full bg-green-500 p-6">
                  <Trophy className="h-16 w-16 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-green-500">¡VICTORIA!</h1>
              {winner && (
                <p className="text-xl text-muted-foreground">
                  <strong>{winner}</strong> ha resuelto el misterio
                </p>
              )}
            </>
          ) : (
            <>
              <div className="flex justify-center">
                <div className="rounded-full bg-red-500 p-6">
                  <X className="h-16 w-16 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-red-500">FIN DE PARTIDA</h1>
              <p className="text-xl text-muted-foreground">
                Todos los jugadores han sido eliminados
              </p>
            </>
          )}
        </div>

        {/* Solución */}
        <div className="bg-muted p-6 rounded-lg space-y-4">
          <h2 className="text-2xl font-bold text-center">La Solución Era:</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Sospechoso</p>
              <p className="text-lg font-bold">{solutionSuspect?.name || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Arma</p>
              <p className="text-lg font-bold">{solutionWeapon?.name || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Habitación</p>
              <p className="text-lg font-bold">{solutionRoom?.name || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <Clock className="h-8 w-8 mx-auto mb-2" />
            <p className="text-2xl font-bold">{timeTaken}</p>
            <p className="text-sm text-muted-foreground">Tiempo</p>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <Users className="h-8 w-8 mx-auto mb-2" />
            <p className="text-2xl font-bold">{accusations.length}</p>
            <p className="text-sm text-muted-foreground">Acusaciones</p>
          </div>
        </div>

        {/* Historial de acusaciones */}
        {accusations.length > 0 && (
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-bold mb-2">Historial de Acusaciones:</h3>
            <div className="space-y-2">
              {accusations.map((acc, index) => (
                <div
                  key={index}
                  className={`p-2 rounded ${
                    acc.is_correct ? "bg-green-500/20" : "bg-red-500/20"
                  }`}
                >
                  <p className="text-sm">
                    <strong>{acc.player_name}</strong>:{" "}
                    {acc.is_correct ? (
                      <span className="text-green-500">✓ Correcta (Ganador)</span>
                    ) : (
                      <span className="text-red-500">✗ Incorrecta (Eliminado)</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center">
          <Button onClick={() => navigate("/")} size="lg">
            Volver al Inicio
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default TraditionalCluedoResult;

