import { Card } from "@/components/ui/card";

interface Phase3Props {
  gameId: string;
  playerId: string;
  playerRole: string;
  isHost: boolean;
}

const Phase3 = ({ playerRole }: Phase3Props) => {
  return (
    <div className="text-center space-y-4 py-8">
      <h3 className="text-2xl font-bold text-accent">Fase 3: La Ruta del Asesino</h3>
      <Card className="p-6 bg-muted max-w-2xl mx-auto">
        <p className="text-muted-foreground">
          Esta fase está en desarrollo. Aquí los jugadores deducirán el movimiento del
          culpable usando un mapa y diferentes pistas sobre cámaras, zonas y rutas.
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          Tu rol: <span className="font-bold text-accent">{playerRole}</span>
        </p>
      </Card>
    </div>
  );
};

export default Phase3;
