import { Card } from "@/components/ui/card";
import { FileText, User, Lock } from "lucide-react";
import { Clue } from "@/lib/cluedoGameData";

interface ClueBoardProps {
  globalClues: Clue[];
  privateClues: Clue[];
  playerName?: string;
}

const ClueBoard = ({ globalClues, privateClues, playerName }: ClueBoardProps) => {
  return (
    <div className="space-y-4">
      {/* Pistas globales */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5" />
          <h3 className="font-bold text-lg">Pizarra de Pistas (Globales)</h3>
        </div>
        <div className="h-64 overflow-y-auto space-y-2">
          {globalClues.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay pistas globales. Resuelve puzzles para liberarlas.
            </p>
          ) : (
            globalClues.map((clue) => (
              <div
                key={clue.id}
                className="p-3 bg-muted rounded-lg border-l-4 border-primary"
              >
                <p className="text-sm">{clue.text}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(clue.created_at).toLocaleTimeString()}
                </p>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Pistas privadas */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-5 w-5" />
          <h3 className="font-bold text-lg">Tus Pistas Privadas</h3>
        </div>
        <div className="h-48 overflow-y-auto space-y-2">
          {privateClues.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no tienes pistas privadas.
            </p>
          ) : (
            privateClues.map((clue) => (
              <div
                key={clue.id}
                className="p-3 bg-accent/10 rounded-lg border-l-4 border-accent"
              >
                <p className="text-sm">{clue.text}</p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default ClueBoard;

