import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const JoinCluedoGame = () => {
  const navigate = useNavigate();
  const [gameCode, setGameCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [joining, setJoining] = useState(false);

  const handleJoinGame = async () => {
    if (!gameCode.trim() || !playerName.trim()) {
      toast.error("Por favor, introduce el código y tu nombre");
      return;
    }

    setJoining(true);

    try {
      // Buscar partida por código
      const { data: game, error: gameError } = await supabase
        .from("cluedo_games")
        .select("*")
        .eq("code", gameCode.toUpperCase().trim())
        .single();

      if (gameError || !game) {
        toast.error("Código de partida no válido");
        return;
      }

      if (game.status !== "LOBBY") {
        toast.error("Esta partida ya ha comenzado");
        return;
      }

      // Verificar número de jugadores
      const { data: players, error: playersError } = await supabase
        .from("cluedo_players")
        .select("id")
        .eq("game_id", game.id);

      if (playersError) throw playersError;

      if (players && players.length >= game.max_players) {
        toast.error("La partida está llena");
        return;
      }

      // Verificar que el nombre no esté en uso
      const { data: existingPlayer } = await supabase
        .from("cluedo_players")
        .select("id")
        .eq("game_id", game.id)
        .eq("name", playerName.trim())
        .single();

      if (existingPlayer) {
        toast.error("Este nombre ya está en uso en esta partida");
        return;
      }

      // Crear jugador
      const { data: player, error: playerError } = await supabase
        .from("cluedo_players")
        .insert({
          game_id: game.id,
          name: playerName.trim(),
          is_host: false,
        })
        .select()
        .single();

      if (playerError) throw playerError;

      toast.success("Te has unido a la partida");
      navigate(`/cluedo/lobby/${game.id}?playerId=${player.id}`);
    } catch (error: any) {
      console.error("Error joining game:", error);
      toast.error(error.message || "Error al unirse a la partida");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">🔍 Cluedo Escape Room</h1>
          <p className="text-muted-foreground">Únete a una partida</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="gameCode">Código de partida</Label>
            <Input
              id="gameCode"
              placeholder="Ej: ABC123"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              maxLength={6}
              className="text-center text-2xl font-bold tracking-wider"
            />
          </div>

          <div>
            <Label htmlFor="playerName">Tu nombre</Label>
            <Input
              id="playerName"
              placeholder="Ej: Detective Watson"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={50}
            />
          </div>

          <Button
            onClick={handleJoinGame}
            disabled={joining || !gameCode.trim() || !playerName.trim()}
            className="w-full"
            size="lg"
          >
            {joining ? "Uniéndose..." : "Unirse a la Partida"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default JoinCluedoGame;

