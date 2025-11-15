import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateGameCode } from "@/lib/cluedoGameData";

const CreateCluedoGame = () => {
  const navigate = useNavigate();
  const [hostName, setHostName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(11);
  const [timeLimit, setTimeLimit] = useState(60); // minutos
  const [errorEndsGame, setErrorEndsGame] = useState(false);
  const [errorPenalty, setErrorPenalty] = useState(5); // minutos
  const [creating, setCreating] = useState(false);

  const handleCreateGame = async () => {
    if (!hostName.trim()) {
      toast.error("Por favor, introduce tu nombre");
      return;
    }

    setCreating(true);

    try {
      // Obtener sospechosos, armas y salas de la BD
      const [suspectsRes, weaponsRes, roomsRes] = await Promise.all([
        supabase.from("suspects").select("id"),
        supabase.from("weapons").select("id"),
        supabase.from("rooms").select("id"),
      ]);

      if (suspectsRes.error) {
        console.error("Error loading suspects:", suspectsRes.error);
        if (suspectsRes.error.code === 'PGRST116' || suspectsRes.error.message?.includes('does not exist')) {
          toast.error("Error: Las tablas no están creadas. Ejecuta las migraciones SQL primero.");
        } else {
          toast.error(`Error al cargar sospechosos: ${suspectsRes.error.message}`);
        }
        return;
      }

      if (weaponsRes.error) {
        console.error("Error loading weapons:", weaponsRes.error);
        if (weaponsRes.error.code === 'PGRST116' || weaponsRes.error.message?.includes('does not exist')) {
          toast.error("Error: Las tablas no están creadas. Ejecuta las migraciones SQL primero.");
        } else {
          toast.error(`Error al cargar armas: ${weaponsRes.error.message}`);
        }
        return;
      }

      if (roomsRes.error) {
        console.error("Error loading rooms:", roomsRes.error);
        if (roomsRes.error.code === 'PGRST116' || roomsRes.error.message?.includes('does not exist')) {
          toast.error("Error: Las tablas no están creadas. Ejecuta las migraciones SQL primero.");
        } else {
          toast.error(`Error al cargar salas: ${roomsRes.error.message}`);
        }
        return;
      }

      const suspects = suspectsRes.data || [];
      const weapons = weaponsRes.data || [];
      const rooms = roomsRes.data || [];

      if (suspects.length === 0 || weapons.length === 0 || rooms.length === 0) {
        toast.error("Error: No hay suficientes datos en la base de datos. Ejecuta las migraciones SQL primero.");
        return;
      }

      // Seleccionar solución aleatoria
      const solutionSuspect = suspects[Math.floor(Math.random() * suspects.length)];
      const solutionWeapon = weapons[Math.floor(Math.random() * weapons.length)];
      const solutionRoom = rooms[Math.floor(Math.random() * rooms.length)];

      // Generar código único
      let code = generateGameCode();
      let codeExists = true;
      let attempts = 0;
      
      while (codeExists && attempts < 10) {
        const { data } = await supabase
          .from("cluedo_games")
          .select("id")
          .eq("code", code)
          .single();
        
        if (!data) {
          codeExists = false;
        } else {
          code = generateGameCode();
          attempts++;
        }
      }

      if (codeExists) {
        throw new Error("No se pudo generar un código único");
      }

      // Crear partida
      const { data: game, error: gameError } = await supabase
        .from("cluedo_games")
        .insert({
          code,
          status: "LOBBY",
          solution_suspect_id: solutionSuspect.id,
          solution_weapon_id: solutionWeapon.id,
          solution_room_id: solutionRoom.id,
          max_players: maxPlayers,
          time_limit_seconds: timeLimit * 60,
          error_penalty_seconds: errorPenalty * 60,
          error_ends_game: errorEndsGame,
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // Crear jugador host
      const { data: player, error: playerError } = await supabase
        .from("cluedo_players")
        .insert({
          game_id: game.id,
          name: hostName.trim(),
          is_host: true,
        })
        .select()
        .single();

      if (playerError) throw playerError;

      toast.success(`Partida creada con código: ${code}`);
      navigate(`/cluedo/lobby/${game.id}?playerId=${player.id}`);
    } catch (error: any) {
      console.error("Error creating game:", error);
      toast.error(error.message || "Error al crear la partida");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">🔍 Cluedo Escape Room</h1>
          <p className="text-muted-foreground">Crea una nueva partida</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="hostName">Tu nombre</Label>
            <Input
              id="hostName"
              placeholder="Ej: Detective Holmes"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              maxLength={50}
            />
          </div>

          <div>
            <Label htmlFor="maxPlayers">Máximo de jugadores</Label>
            <Select value={maxPlayers.toString()} onValueChange={(v) => setMaxPlayers(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} jugadores
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="timeLimit">Tiempo límite (minutos)</Label>
            <Input
              id="timeLimit"
              type="number"
              min="15"
              max="120"
              value={timeLimit}
              onChange={(e) => setTimeLimit(parseInt(e.target.value) || 60)}
            />
          </div>

          <div className="space-y-2">
            <Label>Penalización por error</Label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="errorEndsGame"
                checked={errorEndsGame}
                onChange={(e) => setErrorEndsGame(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="errorEndsGame" className="font-normal">
                Un error termina la partida
              </Label>
            </div>
            {!errorEndsGame && (
              <div>
                <Label htmlFor="errorPenalty" className="text-sm">
                  Minutos a restar por error
                </Label>
                <Input
                  id="errorPenalty"
                  type="number"
                  min="1"
                  max="30"
                  value={errorPenalty}
                  onChange={(e) => setErrorPenalty(parseInt(e.target.value) || 5)}
                />
              </div>
            )}
          </div>

          <Button
            onClick={handleCreateGame}
            disabled={creating || !hostName.trim()}
            className="w-full"
            size="lg"
          >
            {creating ? "Creando partida..." : "Crear Partida"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CreateCluedoGame;

