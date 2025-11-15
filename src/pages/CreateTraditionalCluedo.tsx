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
import {
  createDeck,
  selectSolution,
  dealCards,
  SUSPECTS,
  WEAPONS,
  ROOMS,
} from "@/lib/cluedoTraditionalGame";

const CreateTraditionalCluedo = () => {
  const navigate = useNavigate();
  const [hostName, setHostName] = useState("");
  const [numPlayers, setNumPlayers] = useState(3);
  const [creating, setCreating] = useState(false);

  const handleCreateGame = async () => {
    if (!hostName.trim()) {
      toast.error("Por favor, introduce tu nombre");
      return;
    }

    if (numPlayers < 2 || numPlayers > 12) {
      toast.error("El número de jugadores debe estar entre 2 y 12");
      return;
    }

    setCreating(true);

    try {
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

      // Crear mazo y solución
      const deck = createDeck();
      const { solution, remainingCards } = selectSolution(deck);
      const hands = dealCards(remainingCards, numPlayers);

      // Obtener IDs reales de la base de datos
      const [suspectsRes, weaponsRes, roomsRes] = await Promise.all([
        supabase.from("suspects").select("id, name").eq("name", solution.suspect).single(),
        supabase.from("weapons").select("id, name").eq("name", solution.weapon).single(),
        supabase.from("rooms").select("id, name").eq("name", solution.room).single(),
      ]);

      if (suspectsRes.error) {
        console.error("Error loading suspect:", suspectsRes.error);
        if (suspectsRes.error.code === 'PGRST116' || suspectsRes.error.message?.includes('does not exist')) {
          toast.error("Error: Las tablas no están creadas. Ejecuta las migraciones SQL primero.");
        } else {
          toast.error(`Error al cargar sospechoso: ${suspectsRes.error.message}`);
        }
        return;
      }

      if (weaponsRes.error) {
        console.error("Error loading weapon:", weaponsRes.error);
        if (weaponsRes.error.code === 'PGRST116' || weaponsRes.error.message?.includes('does not exist')) {
          toast.error("Error: Las tablas no están creadas. Ejecuta las migraciones SQL primero.");
        } else {
          toast.error(`Error al cargar arma: ${weaponsRes.error.message}`);
        }
        return;
      }

      if (roomsRes.error) {
        console.error("Error loading room:", roomsRes.error);
        if (roomsRes.error.code === 'PGRST116' || roomsRes.error.message?.includes('does not exist')) {
          toast.error("Error: Las tablas no están creadas. Ejecuta las migraciones SQL primero.");
        } else {
          toast.error(`Error al cargar habitación: ${roomsRes.error.message}`);
        }
        return;
      }

      if (!suspectsRes.data || !weaponsRes.data || !roomsRes.data) {
        toast.error("Error: No se encontraron los datos necesarios en la base de datos");
        return;
      }

      // Crear partida
      const { data: game, error: gameError } = await supabase
        .from("cluedo_games")
        .insert({
          code,
          status: "LOBBY",
          solution_suspect_id: suspectsRes.data.id,
          solution_weapon_id: weaponsRes.data.id,
          solution_room_id: roomsRes.data.id,
          max_players: numPlayers,
          time_limit_seconds: 0, // Sin límite de tiempo
          error_ends_game: false,
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // Crear jugador host con sus cartas
      const hostCards = hands[0];
      const { data: player, error: playerError } = await supabase
        .from("cluedo_players")
        .insert({
          game_id: game.id,
          name: hostName.trim(),
          is_host: true,
          connected: true,
        })
        .select()
        .single();

      if (playerError) throw playerError;

      // Guardar cartas del host en la BD (usaremos un campo JSON)
      await supabase
        .from("cluedo_players")
        .update({
          // Guardar cartas como JSON en un campo adicional
          // Por ahora usaremos la tabla de clues para almacenar las cartas de cada jugador
        })
        .eq("id", player.id);

      // Guardar las cartas del host
      for (const card of hostCards) {
        await supabase.from("clues").insert({
          game_id: game.id,
          text: `CARD:${card.type}:${card.name}`,
          is_private: true,
          player_id: player.id,
          affects_type: card.type === 'SUSPECT' ? 'SUSPECT' : 
                       card.type === 'WEAPON' ? 'WEAPON' : 'ROOM',
        });
      }

      // Guardar información del juego (manos de cartas, solución, etc.)
      await supabase
        .from("cluedo_games")
        .update({
          // Guardar estado del juego en un campo JSON
          // Usaremos el campo data para almacenar información adicional
        })
        .eq("id", game.id);

      toast.success(`Partida creada con código: ${code}`);
      navigate(`/cluedo-traditional/lobby/${game.id}?playerId=${player.id}`);
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
          <h1 className="text-3xl font-bold">🕵️ Cluedo Tradicional</h1>
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
            <Label htmlFor="numPlayers">Número de jugadores</Label>
            <Select value={numPlayers.toString()} onValueChange={(v) => setNumPlayers(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} jugadores
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Las cartas se repartirán equitativamente entre todos los jugadores
            </p>
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

export default CreateTraditionalCluedo;

