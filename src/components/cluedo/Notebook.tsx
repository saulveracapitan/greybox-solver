import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Minus } from "lucide-react";
import { SUSPECTS, WEAPONS, ROOMS, Card as GameCard } from "@/lib/cluedoTraditionalGame";

interface NotebookProps {
  playerCards: GameCard[];
  onMarkCard: (cardName: string, status: 'yes' | 'no' | 'maybe') => void;
  markedCards: Record<string, 'yes' | 'no' | 'maybe'>;
}

const Notebook = ({ playerCards, onMarkCard, markedCards }: NotebookProps) => {
  const [activeTab, setActiveTab] = useState<'suspects' | 'weapons' | 'rooms'>('suspects');

  const getCardStatus = (cardName: string): 'yes' | 'no' => {
    // Si el jugador tiene la carta, automáticamente está marcada como "no" (no está en la solución)
    const hasCard = playerCards.some(c => c.name === cardName);
    if (hasCard) return 'no';
    
    // Si no está marcada, por defecto es "yes" (posible)
    return markedCards[cardName] || 'yes';
  };

  const handleCardClick = (cardName: string) => {
    const currentStatus = getCardStatus(cardName);
    
    // Solo alterna entre 'no' (descartada) y 'yes' (posible)
    if (currentStatus === 'no') {
      onMarkCard(cardName, 'yes');
    } else {
      onMarkCard(cardName, 'no');
    }
  };

  const renderCardList = (items: string[], type: 'SUSPECT' | 'WEAPON' | 'ROOM') => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {items.map((item) => {
          const status = getCardStatus(item);
          const hasCard = playerCards.some(c => c.name === item && c.type === type);
          
          return (
            <div
              key={item}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                hasCard
                  ? 'bg-red-100 border-red-300'
                  : status === 'yes'
                  ? 'bg-green-100 border-green-500'
                  : 'bg-gray-100 border-gray-300 line-through'
              }`}
              onClick={() => !hasCard && handleCardClick(item)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-black">{item}</span>
                <div className="flex items-center gap-1">
                  {hasCard && (
                    <span className="text-xs text-red-600 font-bold">EN MI MANO</span>
                  )}
                  {status === 'yes' && <Check className="h-4 w-4 text-green-600" />}
                  {status === 'no' && !hasCard && <X className="h-4 w-4 text-gray-400" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="text-xl font-bold mb-2">📓 Mi Libreta</h3>
        <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
          <p className="text-sm font-semibold mb-1 text-gray-900">¿Cómo funciona?</p>
          <p className="text-xs text-muted-foreground">
            Haz <strong>clic</strong> en una carta para marcarla. Cada clic alterna entre:
            <br />
            <span className="text-gray-600">Descartada (❌) ↔ Posible (✓)</span>
          </p>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === 'suspects' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('suspects')}
          >
            Sospechosos
          </Button>
          <Button
            variant={activeTab === 'weapons' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('weapons')}
          >
            Armas
          </Button>
          <Button
            variant={activeTab === 'rooms' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('rooms')}
          >
            Habitaciones
          </Button>
        </div>
      </div>

      {/* Leyenda mejorada */}
      <div className="mb-4 p-3 bg-muted rounded-lg space-y-2">
        <p className="text-xs font-semibold mb-2">Leyenda:</p>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-red-100 border-2 border-red-300 rounded flex items-center justify-center">
              <span className="text-red-600 font-bold">!</span>
            </div>
            <span className="text-black"><strong>En mi mano:</strong> Esta carta NO está en la solución (la tengo yo)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-green-100 border-2 border-green-500 rounded flex items-center justify-center">
              <Check className="h-3 w-3 text-green-600" />
            </div>
            <span className="text-black"><strong>Posible:</strong> Podría estar en la solución (marca con ✓)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-100 border-2 border-gray-300 rounded flex items-center justify-center line-through">
              <X className="h-3 w-3 text-gray-400" />
            </div>
            <span className="text-black"><strong>Descartada:</strong> NO está en la solución (marca con ❌)</span>
          </div>
        </div>
      </div>

      {/* Contenido de las tabs */}
      <div className="min-h-[300px]">
        {activeTab === 'suspects' && renderCardList(SUSPECTS, 'SUSPECT')}
        {activeTab === 'weapons' && renderCardList(WEAPONS, 'WEAPON')}
        {activeTab === 'rooms' && renderCardList(ROOMS, 'ROOM')}
      </div>
    </Card>
  );
};

export default Notebook;

