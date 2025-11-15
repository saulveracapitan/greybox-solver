import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getRandomCase } from "@/lib/gameCases";

const CreateGame = () => {
  const [hostName, setHostName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const generateGameCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hostName.trim()) {
      toast.error("Por favor ingresa tu nombre");
      return;
    }

    setLoading(true);

    try {
      const gameCode = generateGameCode();
      
      // Asignar un caso aleatorio
      const selectedCase = getRandomCase();
      
      // Crear la sesión de juego con el caso asignado
      const { data: gameSession, error: gameError } = await supabase
        .from("game_sessions")
        .insert({
          code: gameCode,
          status: "LOBBY",
          current_phase: 0,
          data: {
            caseId: selectedCase.id,
            caseName: selectedCase.name,
            victim: selectedCase.victim,
            location: selectedCase.location,
          },
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // Crear las 4 fases del juego
      const phases = [1, 2, 3, 4].map((phaseNumber) => ({
        game_session_id: gameSession.id,
        phase_number: phaseNumber,
        status: "LOCKED" as const,
      }));

      const { error: phaseError } = await supabase
        .from("phase_states")
        .insert(phases);

      if (phaseError) throw phaseError;

      // Crear el jugador host
      const { data: player, error: playerError } = await supabase
        .from("players")
        .insert({
          game_session_id: gameSession.id,
          name: hostName,
          is_host: true,
          connected: true,
        })
        .select()
        .single();

      if (playerError) throw playerError;

      // Redirigir al lobby
      navigate(`/lobby/${gameSession.id}?playerId=${player.id}`);
    } catch (error: any) {
      console.error("Error creating game:", error);
      
      // Mostrar error específico
      const errorMessage = error?.message || error?.error_description || "Error desconocido";
      console.error("Detalles del error:", {
        message: errorMessage,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });
      
      // Mensajes de error más específicos
      if (error?.code === 'PGRST116') {
        toast.error("Las tablas no existen. Ejecuta el SQL en Supabase primero.");
      } else if (error?.message?.includes('column "data"')) {
        toast.error("El campo 'data' no existe en game_sessions. Ejecuta la migración.");
      } else if (error?.message?.includes('relation') || error?.message?.includes('does not exist')) {
        toast.error("Las tablas no existen. Verifica que ejecutaste el SQL en Supabase.");
      } else {
        toast.error(`Error al crear la partida: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-primary">CREAR PARTIDA</h1>
          <p className="text-muted-foreground">
            Serás el anfitrión de esta investigación
          </p>
        </div>

        <form onSubmit={handleCreateGame} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hostName">Tu nombre</Label>
            <Input
              id="hostName"
              placeholder="Ej: Detective Silva"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
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
            {loading ? "CREANDO..." : "CREAR PARTIDA"}
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

export default CreateGame;
