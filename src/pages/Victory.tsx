import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Clock, Lock, Users, Home } from "lucide-react";
import { toast } from "sonner";
import { getCaseById, GameCase } from "@/lib/gameCases";

interface GameSession {
  id: string;
  code: string;
  lockbox_code: string;
  started_at: string;
  finished_at: string;
}

interface Player {
  id: string;
  name: string;
  role: string;
}

const Victory = () => {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const playerId = searchParams.get("playerId");
  const navigate = useNavigate();

  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [elapsedTime, setElapsedTime] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [gameCase, setGameCase] = useState<GameCase | null>(null);

  useEffect(() => {
    if (!gameId) return;
    loadGameData();
  }, [gameId]);

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

      // Cargar el caso asignado
      if (session?.data?.caseId) {
        const caseData = getCaseById(session.data.caseId);
        if (caseData) {
          setGameCase(caseData);
        }
      }

      // Cargar jugadores
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("id, name, role")
        .eq("game_session_id", gameId)
        .order("created_at", { ascending: true });

      if (playersError) throw playersError;
      setPlayers(playersData);

      // Calcular tiempo transcurrido
      if (session?.started_at && session?.finished_at) {
        const start = new Date(session.started_at);
        const end = new Date(session.finished_at);
        const diff = end.getTime() - start.getTime();
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setElapsedTime(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      }
    } catch (error) {
      console.error("Error loading game data:", error);
      toast.error("Error al cargar datos del juego");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-2xl font-bold text-primary">CARGANDO...</div>
      </div>
    );
  }

  if (!gameSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-xl text-destructive">Error: Sesión no encontrada</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        {/* Header de victoria */}
        <div className="text-center space-y-4">
          <Trophy className="h-24 w-24 text-accent mx-auto animate-bounce" />
          <h1 className="text-5xl font-bold text-accent">¡CASO RESUELTO!</h1>
          <p className="text-xl text-muted-foreground">
            El Último Caso de la Caja Grey
          </p>
        </div>

        {/* Código del candado */}
        <Card className="p-8 bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-accent">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Lock className="h-8 w-8 text-accent" />
              <h2 className="text-2xl font-bold">CÓDIGO DEL CANDADO</h2>
            </div>
            <div className="text-7xl font-bold text-accent tracking-widest font-mono">
              {gameSession.lockbox_code || gameCase?.finalCode || "00000"}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Usa este código para abrir la caja física
            </p>
          </div>
        </Card>

        {/* Resumen del caso */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">RESUMEN DEL CASO</h3>
          {gameCase ? (
            <div className="space-y-3 text-sm">
              <div className="mb-4 p-3 bg-primary/10 rounded-lg">
                <p className="font-bold text-lg">{gameCase.name}</p>
                <p className="text-muted-foreground">Víctima: {gameCase.victim}</p>
                <p className="text-muted-foreground">Ubicación: {gameCase.location}</p>
              </div>
              <p>
                <strong>Fase 1 - La Escena del Crimen:</strong> Reconstruisteis la línea
                temporal del incidente. El momento exacto fue {gameCase.phase1.correctTime}. El primer
                dígito del candado fue revelado: <span className="font-bold text-accent">{gameCase.finalCode[0]}</span>.
              </p>
              <p>
                <strong>Fase 2 - Los Archivos Rotos:</strong> Reconstruisteis el documento
                destruido y descubristeis la palabra clave "{gameCase.phase2.correctKeyword}" relacionada con un
                {gameCase.phase2.documentType.toLowerCase()}. El segundo dígito fue revelado:{" "}
                <span className="font-bold text-accent">{gameCase.phase2.secondDigit}</span>.
              </p>
              <p>
                <strong>Fase 3 - La Ruta del Asesino:</strong> Rastrasteis la ruta exacta
                del asesino a través del edificio. La ruta seguida fue {gameCase.phase3.correctRoute},
                utilizando zonas sin cámaras y puntos ciegos. Los dígitos tercero y cuarto
                fueron revelados: <span className="font-bold text-accent">{gameCase.phase3.thirdDigit}</span> y{" "}
                <span className="font-bold text-accent">{gameCase.phase3.fourthDigit}</span>.
              </p>
              <p>
                <strong>Fase 4 - La Caja Grey:</strong> Sincronizasteis todos los patrones
                y descubristeis el último dígito mediante la combinación de todos los números
                mencionados. El último dígito fue revelado:{" "}
                <span className="font-bold text-accent">{gameCase.phase4.fifthDigit}</span>.
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="font-bold mb-2">La Verdad Final:</p>
                <p>{gameCase.finalNarrative}</p>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">
              Cargando información del caso...
            </div>
          )}
        </Card>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-bold">TIEMPO TOTAL</h3>
            </div>
            <div className="text-3xl font-bold text-primary">
              {elapsedTime || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Tiempo transcurrido</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-bold">EQUIPO</h3>
            </div>
            <div className="text-3xl font-bold text-primary">{players.length}</div>
            <p className="text-xs text-muted-foreground mt-2">Jugadores</p>
          </Card>
        </div>

        {/* Lista de jugadores */}
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">EQUIPO DE INVESTIGACIÓN</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {players.map((player) => (
              <div
                key={player.id}
                className="p-3 bg-muted rounded-lg flex items-center justify-between"
              >
                <span className="font-medium">{player.name}</span>
                <span className="text-xs text-accent">{player.role}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Botón de volver */}
        <div className="flex justify-center">
          <Button
            onClick={() => navigate("/")}
            size="lg"
            className="w-full md:w-auto"
          >
            <Home className="mr-2 h-5 w-5" />
            VOLVER AL INICIO
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Victory;

