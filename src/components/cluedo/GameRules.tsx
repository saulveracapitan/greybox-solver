import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GameRulesProps {
  open: boolean;
  onClose: () => void;
}

const GameRules = ({ open, onClose }: GameRulesProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Cómo Jugar a Cluedo
          </DialogTitle>
          <DialogDescription>
            Guía completa de las reglas del juego
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Objetivo */}
          <section>
            <h3 className="text-xl font-bold mb-2">🎯 Objetivo del Juego</h3>
            <p className="text-muted-foreground">
              Descubre la combinación secreta del crimen:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-4">
              <li><strong>Quién</strong> lo cometió (sospechoso)</li>
              <li><strong>Con qué arma</strong></li>
              <li><strong>En qué habitación</strong></li>
            </ul>
          </section>

          {/* Preparación */}
          <section>
            <h3 className="text-xl font-bold mb-2">🃏 Preparación</h3>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Se elige una combinación secreta (1 sospechoso + 1 arma + 1 habitación)</li>
              <li>Las cartas restantes se reparten entre todos los jugadores</li>
              <li>Cada jugador ve solo sus propias cartas</li>
              <li>Las cartas que tienes <strong>NO</strong> están en la solución</li>
            </ol>
          </section>

          {/* Turnos */}
          <section>
            <h3 className="text-xl font-bold mb-2">🔄 Turnos</h3>
            <p className="text-muted-foreground mb-2">
              El juego se juega por turnos en orden circular. En tu turno puedes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Hacer una Sugerencia:</strong> Propones un sospechoso, un arma y una habitación.
                Los demás jugadores (en orden) intentan refutarla mostrando una carta si la tienen.
              </li>
              <li>
                <strong>Hacer una Acusación Final:</strong> Si crees saber la solución, puedes acusar.
                Si aciertas, ganas. Si fallas, quedas eliminado.
              </li>
            </ul>
          </section>

          {/* Sugerencias */}
          <section>
            <h3 className="text-xl font-bold mb-2">💡 Sugerencias</h3>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>En tu turno, eliges un sospechoso, un arma y una habitación</li>
              <li>Los jugadores siguientes (en orden) intentan refutar tu sugerencia</li>
              <li>
                Si un jugador tiene alguna de las cartas sugeridas, debe mostrarte <strong>una</strong> de ellas
                (solo tú la ves)
              </li>
              <li>
                Si nadie puede refutar, significa que esas tres cartas podrían estar en la solución
                (pero no es seguro)
              </li>
              <li>Usa tu libreta para anotar qué cartas has visto o descartado</li>
            </ol>
          </section>

          {/* Acusación Final */}
          <section>
            <h3 className="text-xl font-bold mb-2">⚖️ Acusación Final</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Si aciertas:</strong> ¡Ganas la partida! Se revela la solución a todos.
              </li>
              <li>
                <strong>Si fallas:</strong> Quedas eliminado. Ya no puedes hacer sugerencias ni acusaciones,
                pero sigues viendo la partida.
              </li>
              <li>
                <strong>Estrategia:</strong> Solo acusa cuando estés muy seguro. Una acusación incorrecta
                te elimina del juego.
              </li>
            </ul>
          </section>

          {/* La Libreta */}
          <section>
            <h3 className="text-xl font-bold mb-2">📓 Tu Libreta</h3>
            <p className="text-muted-foreground mb-2">
              Usa tu libreta para llevar un registro de las cartas:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Cartas en tu mano:</strong> Automáticamente marcadas como "no" (no están en la solución)</li>
              <li><strong>Descartadas:</strong> Cartas que sabes que no están en la solución (márcalas con X)</li>
              <li><strong>Posibles:</strong> Cartas que podrían estar en la solución (márcalas con ✓)</li>
            </ul>
          </section>

          {/* Consejos */}
          <section>
            <h3 className="text-xl font-bold mb-2">💡 Consejos</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Presta atención a qué cartas muestran otros jugadores</li>
              <li>Si un jugador no puede refutar una sugerencia, anótalo en tu libreta</li>
              <li>Usa la lógica deductiva: si sabes que X no está, entonces Y podría estar</li>
              <li>No acuses demasiado pronto: una acusación incorrecta te elimina</li>
              <li>Observa el comportamiento de otros jugadores para obtener pistas</li>
            </ul>
          </section>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={onClose}>Entendido</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameRules;

