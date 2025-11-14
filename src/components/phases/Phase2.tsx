import { Card } from "@/components/ui/card";

interface Phase2Props {
  gameId: string;
  playerId: string;
  playerRole: string;
  isHost: boolean;
}

const Phase2 = ({ playerRole }: Phase2Props) => {
  return (
    <div className="text-center space-y-4 py-8">
      <h3 className="text-2xl font-bold text-accent">Fase 2: Los Archivos Rotos</h3>
      <Card className="p-6 bg-muted max-w-2xl mx-auto">
        <p className="text-muted-foreground">
          Esta fase está en desarrollo. Aquí los jugadores reconstruirán documentos
          destruidos usando fragmentos que cada rol ve de forma diferente.
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          Tu rol: <span className="font-bold text-accent">{playerRole}</span>
        </p>
      </Card>
    </div>
  );
};

export default Phase2;
