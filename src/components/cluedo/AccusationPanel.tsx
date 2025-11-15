import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Check, X } from "lucide-react";
import { Suspect, Weapon, Room } from "@/lib/cluedoGameData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AccusationPanelProps {
  gameId: string;
  playerId: string;
  suspects: Suspect[];
  weapons: Weapon[];
  rooms: Room[];
  isHost: boolean;
  onAccusationResult: (isCorrect: boolean) => void;
}

const AccusationPanel = ({
  gameId,
  playerId,
  suspects,
  weapons,
  rooms,
  isHost,
  onAccusationResult,
}: AccusationPanelProps) => {
  const [selectedSuspect, setSelectedSuspect] = useState<string>("");
  const [selectedWeapon, setSelectedWeapon] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitAccusation = async () => {
    if (!selectedSuspect || !selectedWeapon || !selectedRoom) {
      toast.error("Por favor, selecciona un sospechoso, un arma y una sala");
      return;
    }

    if (!isHost) {
      toast.error("Solo el host puede hacer la acusación final");
      return;
    }

    setSubmitting(true);

    try {
      // Registrar acusación
      await supabase.from("accusations").insert({
        game_id: gameId,
        player_id: playerId,
        suspect_id: parseInt(selectedSuspect),
        weapon_id: parseInt(selectedWeapon),
        room_id: parseInt(selectedRoom),
      });

      // Verificar si es correcta
      const { data: game } = await supabase
        .from("cluedo_games")
        .select("solution_suspect_id, solution_weapon_id, solution_room_id, error_ends_game, error_penalty_seconds, time_limit_seconds, started_at")
        .eq("id", gameId)
        .single();

      if (!game) throw new Error("Error al obtener datos de la partida");

      const isCorrect =
        game.solution_suspect_id === parseInt(selectedSuspect) &&
        game.solution_weapon_id === parseInt(selectedWeapon) &&
        game.solution_room_id === parseInt(selectedRoom);

      if (isCorrect) {
        // Victoria
        await supabase
          .from("cluedo_games")
          .update({
            status: "WIN",
            finished_at: new Date().toISOString(),
          })
          .eq("id", gameId);

        toast.success("¡Acusación correcta! ¡Habéis ganado!");
        onAccusationResult(true);
      } else {
        // Error
        if (game.error_ends_game) {
          await supabase
            .from("cluedo_games")
            .update({
              status: "LOSE",
              finished_at: new Date().toISOString(),
            })
            .eq("id", gameId);

          toast.error("Acusación incorrecta. La partida ha terminado.");
          onAccusationResult(false);
        } else {
          // Restar tiempo
          const startedAt = new Date(game.started_at);
          const now = new Date();
          const elapsed = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
          const remaining = game.time_limit_seconds - elapsed - game.error_penalty_seconds;

          if (remaining <= 0) {
            await supabase
              .from("cluedo_games")
              .update({
                status: "LOSE",
                finished_at: new Date().toISOString(),
              })
              .eq("id", gameId);

            toast.error("Acusación incorrecta. Se ha agotado el tiempo.");
            onAccusationResult(false);
          } else {
            toast.error(`Acusación incorrecta. Se han restado ${game.error_penalty_seconds / 60} minutos.`);
            // El tiempo se calcula dinámicamente, no necesitamos actualizar nada
            onAccusationResult(false);
          }
        }
      }
    } catch (error: any) {
      console.error("Error submitting accusation:", error);
      toast.error(error.message || "Error al procesar la acusación");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <h3 className="font-bold text-lg">Acusación Final</h3>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="suspect">Sospechoso</Label>
          <Select value={selectedSuspect} onValueChange={setSelectedSuspect}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un sospechoso" />
            </SelectTrigger>
            <SelectContent>
              {suspects.map((suspect) => (
                <SelectItem key={suspect.id} value={suspect.id.toString()}>
                  {suspect.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="weapon">Arma</Label>
          <Select value={selectedWeapon} onValueChange={setSelectedWeapon}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un arma" />
            </SelectTrigger>
            <SelectContent>
              {weapons.map((weapon) => (
                <SelectItem key={weapon.id} value={weapon.id.toString()}>
                  {weapon.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="room">Sala</Label>
          <Select value={selectedRoom} onValueChange={setSelectedRoom}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una sala" />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((room) => (
                <SelectItem key={room.id} value={room.id.toString()}>
                  {room.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isHost ? (
          <Button
            onClick={handleSubmitAccusation}
            disabled={submitting || !selectedSuspect || !selectedWeapon || !selectedRoom}
            className="w-full"
            variant="destructive"
            size="lg"
          >
            {submitting ? "Procesando..." : "Hacer Acusación Final"}
          </Button>
        ) : (
          <div className="text-center text-sm text-muted-foreground">
            Solo el host puede hacer la acusación final
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          ⚠️ Una acusación incorrecta puede tener consecuencias. Asegúrate de tener suficientes pistas.
        </p>
      </div>
    </Card>
  );
};

export default AccusationPanel;

