import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const JoinGame = () => {
  const [gameCode, setGameCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gameCode.trim() || !playerName.trim()) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setLoading(true);

    try {
      // Buscar la sesión de juego por código
      const { data: gameSession, error: gameError } = await supabase
        .from("game_sessions")
        .select("id, status")
        .eq("code", gameCode.toUpperCase())
        .single();

      if (gameError || !gameSession) {
        toast.error("Código de partida no encontrado");
        setLoading(false);
        return;
      }

      if (gameSession.status !== "LOBBY") {
        toast.error("Esta partida ya ha comenzado o finalizado");
        setLoading(false);
        return;
      }

      // Crear el jugador
      const { data: player, error: playerError } = await supabase
        .from("players")
        .insert({
          game_session_id: gameSession.id,
          name: playerName,
          is_host: false,
          connected: true,
        })
        .select()
        .single();

      if (playerError) throw playerError;

      // Redirigir al lobby
      navigate(`/lobby/${gameSession.id}?playerId=${player.id}`);
    } catch (error) {
      console.error("Error joining game:", error);
      toast.error("Error al unirse a la partida");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-primary">UNIRSE A PARTIDA</h1>
          <p className="text-muted-foreground">
            Introduce el código de la sala
          </p>
        </div>

        <form onSubmit={handleJoinGame} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gameCode">Código de sala</Label>
            <Input
              id="gameCode"
              placeholder="Ej: ABC123"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="bg-muted border-border text-center text-2xl tracking-widest font-bold"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="playerName">Tu nombre</Label>
            <Input
              id="playerName"
              placeholder="Ej: Detective López"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={30}
              className="bg-muted border-border"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
            size="lg"
          >
            {loading ? "UNIÉNDOSE..." : "UNIRSE"}
          </Button>
        </form>

        <Button
          variant="ghost"
          className="w-full"
          onClick={() => navigate("/")}
        >
          Volver
        </Button>
      </Card>
    </div>
  );
};

export default JoinGame;
