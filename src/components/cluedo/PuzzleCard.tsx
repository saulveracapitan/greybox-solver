import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, Check, Unlock } from "lucide-react";
import { Puzzle, PuzzleData } from "@/lib/cluedoGameData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PuzzleCardProps {
  puzzle: Puzzle;
  gameId: string;
  playerId: string;
  onSolved: () => void;
}

const PuzzleCard = ({ puzzle, gameId, playerId, onSolved }: PuzzleCardProps) => {
  const [answer, setAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [orderItems, setOrderItems] = useState<string[]>([]);
  const [availableItems, setAvailableItems] = useState<string[]>([]);
  const [solving, setSolving] = useState(false);

  // Inicializar orden si es tipo ORDER
  useEffect(() => {
    if (puzzle.type === "ORDER" && puzzle.data.correctOrder) {
      const shuffled = [...puzzle.data.correctOrder].sort(() => Math.random() - 0.5);
      setAvailableItems(shuffled);
      setOrderItems([]);
    }
  }, [puzzle]);

  const handleSubmit = async () => {
    if (solving) return;

    let userAnswer = "";
    
    if (puzzle.type === "CODE" || puzzle.type === "TEXT_INPUT") {
      userAnswer = answer.trim();
    } else if (puzzle.type === "MULTIPLE_CHOICE") {
      userAnswer = selectedOption;
    } else if (puzzle.type === "ORDER") {
      userAnswer = orderItems.join(",");
    }

    if (!userAnswer) {
      toast.error("Por favor, introduce una respuesta");
      return;
    }

    setSolving(true);

    try {
      const correctAnswer = puzzle.solution.toLowerCase().trim();
      const userAnswerNormalized = userAnswer.toLowerCase().trim();

      if (userAnswerNormalized !== correctAnswer) {
        toast.error("Respuesta incorrecta. Sigue intentando...");
        setSolving(false);
        return;
      }

      // Marcar puzzle como resuelto
      await supabase
        .from("puzzles")
        .update({
          solved: true,
          solved_at: new Date().toISOString(),
          solved_by: playerId,
        })
        .eq("id", puzzle.id);

      // Generar pista global (ejemplo simple)
      const clueText = `Pista liberada: ${puzzle.title} resuelto`;
      
      await supabase.from("clues").insert({
        game_id: gameId,
        text: clueText,
        is_private: false,
        puzzle_id: puzzle.id,
        affects_type: "NONE",
      });

      toast.success("¡Puzzle resuelto! Se ha liberado una nueva pista.");
      onSolved();
    } catch (error) {
      console.error("Error solving puzzle:", error);
      toast.error("Error al resolver el puzzle");
    } finally {
      setSolving(false);
    }
  };

  const handleAddToOrder = (item: string) => {
    if (orderItems.includes(item)) return;
    setOrderItems((prev) => [...prev, item]);
  };

  const handleRemoveFromOrder = (item: string) => {
    setOrderItems((prev) => prev.filter((i) => i !== item));
  };

  if (puzzle.solved) {
    return (
      <Card className="p-4 bg-green-500/10 border-green-500">
        <div className="flex items-center gap-2">
          <Check className="h-5 w-5 text-green-500" />
          <div>
            <h3 className="font-bold">{puzzle.title}</h3>
            <p className="text-sm text-muted-foreground">Resuelto</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          <h3 className="font-bold text-lg">{puzzle.title}</h3>
        </div>

        <p className="text-sm">{puzzle.question}</p>

        {puzzle.type === "CODE" && (
          <div>
            <Label htmlFor={`code-${puzzle.id}`}>Código</Label>
            <Input
              id={`code-${puzzle.id}`}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Introduce el código"
              maxLength={20}
            />
          </div>
        )}

        {puzzle.type === "TEXT_INPUT" && (
          <div>
            <Label htmlFor={`text-${puzzle.id}`}>Respuesta</Label>
            <Input
              id={`text-${puzzle.id}`}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Introduce la respuesta"
            />
          </div>
        )}

        {puzzle.type === "MULTIPLE_CHOICE" && puzzle.data.options && (
          <div>
            <Label>Selecciona una opción</Label>
            <Select value={selectedOption} onValueChange={setSelectedOption}>
              <SelectTrigger>
                <SelectValue placeholder="Elige una opción" />
              </SelectTrigger>
              <SelectContent>
                {puzzle.data.options.map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {puzzle.type === "ORDER" && puzzle.data.correctOrder && (
          <div className="space-y-2">
            <Label>Ordena los elementos</Label>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Orden seleccionado:</p>
                <div className="flex flex-wrap gap-2 min-h-[60px] p-2 bg-muted rounded-lg">
                  {orderItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Haz clic en los elementos de abajo para ordenarlos</p>
                  ) : (
                    orderItems.map((item, index) => (
                      <Button
                        key={`ordered-${index}`}
                        variant="default"
                        size="sm"
                        onClick={() => handleRemoveFromOrder(item)}
                      >
                        {index + 1}. {item} ×
                      </Button>
                    ))
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Elementos disponibles:</p>
                <div className="flex flex-wrap gap-2">
                  {availableItems
                    .filter((item) => !orderItems.includes(item))
                    .map((item, index) => (
                      <Button
                        key={`available-${index}`}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddToOrder(item)}
                      >
                        {item}
                      </Button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={solving || (puzzle.type === "ORDER" && orderItems.length === 0)}
          className="w-full"
        >
          {solving ? "Verificando..." : "Verificar Respuesta"}
        </Button>
      </div>
    </Card>
  );
};

export default PuzzleCard;

