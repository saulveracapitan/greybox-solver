import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Settings,
  SkipForward,
  Lightbulb,
  Users,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface HostPanelProps {
  gameId: string;
  currentPhase: number;
  players: Array<{ id: string; name: string; connected: boolean }>;
  hostPlayerId: string;
}

const HostPanel = ({ gameId, currentPhase, players, hostPlayerId }: HostPanelProps) => {
  const [hintMessage, setHintMessage] = useState("");
  const [sendingHint, setSendingHint] = useState(false);
  const [skippingPhase, setSkippingPhase] = useState(false);

  const handleSendHint = async () => {
    if (!hintMessage.trim()) {
      toast.error("Escribe un mensaje de pista");
      return;
    }

    setSendingHint(true);
    try {
      await supabase.from("hints").insert({
        game_session_id: gameId,
        phase_number: currentPhase,
        hint_content: hintMessage,
      });

      // También publicar en el muro de hallazgos como pista del sistema
      await supabase.from("shared_log_entries").insert({
        game_session_id: gameId,
        player_id: hostPlayerId,
        phase_number: currentPhase,
        message: `[PISTA DEL ANFITRIÓN] ${hintMessage}`,
      });

      setHintMessage("");
      toast.success("Pista enviada a todos los jugadores");
    } catch (error) {
      console.error("Error sending hint:", error);
      toast.error("Error al enviar pista");
    } finally {
      setSendingHint(false);
    }
  };

  const handleSkipPhase = async () => {
    setSkippingPhase(true);
    try {
      // Marcar fase actual como completada
      await supabase
        .from("phase_states")
        .update({
          status: "COMPLETED",
          completed_at: new Date().toISOString(),
        })
        .eq("game_session_id", gameId)
        .eq("phase_number", currentPhase);

      // Activar siguiente fase
      if (currentPhase < 4) {
        await supabase
          .from("phase_states")
          .update({
            status: "ACTIVE",
            started_at: new Date().toISOString(),
          })
          .eq("game_session_id", gameId)
          .eq("phase_number", currentPhase + 1);

        // Actualizar código del candado (simular dígitos)
        const { data: session } = await supabase
          .from("game_sessions")
          .select("lockbox_code")
          .eq("id", gameId)
          .single();

        let newCode = session?.lockbox_code || "0000";
        if (currentPhase === 1) {
          newCode = "3XXX";
        } else if (currentPhase === 2) {
          newCode = newCode.replace(/X/, "7");
        } else if (currentPhase === 3) {
          newCode = newCode.replace(/XX/, "24");
        }

        await supabase
          .from("game_sessions")
          .update({
            current_phase: currentPhase + 1,
            lockbox_code: newCode,
          })
          .eq("id", gameId);

        toast.success(`Fase ${currentPhase} saltada. Avanzando a Fase ${currentPhase + 1}`);
      } else {
        // Completar juego
        await supabase
          .from("game_sessions")
          .update({
            status: "COMPLETED",
            finished_at: new Date().toISOString(),
          })
          .eq("id", gameId);

        toast.success("Juego completado");
      }
    } catch (error) {
      console.error("Error skipping phase:", error);
      toast.error("Error al saltar fase");
    } finally {
      setSkippingPhase(false);
    }
  };

  const connectedPlayers = players.filter((p) => p.connected).length;
  const disconnectedPlayers = players.filter((p) => !p.connected).length;

  return (
    <Card className="p-4 bg-card/80 border-2 border-accent">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="h-5 w-5 text-accent" />
        <h3 className="font-bold text-accent">PANEL DE ANFITRIÓN</h3>
      </div>

      <div className="space-y-4">
        {/* Estado de jugadores */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold">Jugadores</span>
          </div>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Conectados:</span>
              <span className="font-bold text-green-500">{connectedPlayers}</span>
            </div>
            {disconnectedPlayers > 0 && (
              <div className="flex justify-between">
                <span>Desconectados:</span>
                <span className="font-bold text-red-500">{disconnectedPlayers}</span>
              </div>
            )}
          </div>
        </div>

        {/* Enviar pista */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full" size="sm">
              <Lightbulb className="mr-2 h-4 w-4" />
              Enviar Pista
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar Pista General</DialogTitle>
              <DialogDescription>
                Esta pista será visible para todos los jugadores en el muro de hallazgos.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="hint">Mensaje de pista</Label>
                <Input
                  id="hint"
                  placeholder="Escribe una pista para ayudar al equipo..."
                  value={hintMessage}
                  onChange={(e) => setHintMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleSendHint();
                  }}
                />
              </div>
              <Button
                onClick={handleSendHint}
                disabled={sendingHint || !hintMessage.trim()}
                className="w-full"
              >
                {sendingHint ? "Enviando..." : "Enviar Pista"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Saltar fase */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full"
              size="sm"
              disabled={skippingPhase}
            >
              <SkipForward className="mr-2 h-4 w-4" />
              Saltar Fase
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                ¿Saltar Fase {currentPhase}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción marcará la fase actual como completada y avanzará
                automáticamente a la siguiente fase. Solo usa esto si el equipo
                está atascado o para propósitos de prueba.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSkipPhase}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {skippingPhase ? "Saltando..." : "Sí, Saltar Fase"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Información de fase */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Fase Actual:</span>
              <span className="font-bold">{currentPhase}/4</span>
            </div>
            <div className="text-muted-foreground text-[10px] mt-2">
              Usa estos controles solo si es necesario. El juego está diseñado
              para resolverse sin intervención del anfitrión.
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default HostPanel;

