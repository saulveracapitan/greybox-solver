import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, Check } from "lucide-react";

interface Phase1Props {
  gameId: string;
  playerId: string;
  playerRole: string;
  isHost: boolean;
}

const Phase1 = ({ gameId, playerId, playerRole, isHost }: Phase1Props) => {
  const [answer, setAnswer] = useState("");
  const [phaseCompleted, setPhaseCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Pistas específicas por rol para Fase 1
  const cluesByRole: Record<string, string[]> = {
    ANALISTA_TIEMPOS: [
      "Horario de guardia de seguridad: 22:00 - 06:00",
      "Última actividad registrada en el sistema: 23:45",
      "Alarma de emergencia activada: 00:15",
    ],
    EXPERTO_HUELLAS: [
      "Huellas dactilares en la ventana: Coinciden con empleado #4872",
      "Huellas en el escritorio: Parcialmente borradas",
      "Rastros de polvo inusual en el suelo",
    ],
    ENTREVISTADOR: [
      'Testimonio del vigilante: "Escuché un ruido cerca de medianoche"',
      'Declaración del limpiador: "Vi luces encendidas en la oficina a las 23:30"',
      'Vecino reportó: "Oí un coche arrancando rápido a la 1:00 AM"',
    ],
    CARTOGRAFO: [
      "Punto de entrada: Ventana trasera, planta baja",
      "Cámaras deshabilitadas en sector este",
      "Ruta de escape posible: Callejón lateral hacia calle principal",
    ],
    PERITO_FORENSE: [
      "Análisis de sangre: Tipo O negativo",
      "Fibras textiles: Lana oscura, posiblemente de abrigo",
      "Objeto contundente usado: Aproximadamente 30cm de largo",
    ],
    ARCHIVISTA: [
      "Expediente del sospechoso #1: Ex-empleado despedido hace 3 meses",
      "Sospechoso #2: Tiene deudas con la víctima",
      "Sospechoso #3: Fue visto discutiendo con la víctima la semana pasada",
    ],
    COMUNICACIONES: [
      "Última llamada recibida: 23:30 desde número desconocido",
      "SMS enviado a las 23:55: 'Ya está hecho'",
      "Email programado para enviar a las 00:00: 'Lo siento'",
    ],
    TESTIMONIOS: [
      'Testigo A: "Vi a alguien con capucha negra cerca del edificio"',
      'Testigo B: "Escuché gritos alrededor de medianoche"',
      'Testigo C: "Un coche oscuro salió a gran velocidad"',
    ],
    PERFILADOR: [
      "Perfil psicológico: Persona metódica y planificadora",
      "Motivación probable: Venganza o dinero",
      "Conocimiento del lugar: Muy familiarizado con el edificio",
    ],
    INTERPRETE_MENSAJES: [
      "Mensaje críptico encontrado: 'La verdad está en los números'",
      "Código en la pared: '12-00-03'",
      "Nota en escritorio: 'Todo termina donde comenzó'",
    ],
  };

  useEffect(() => {
    checkPhaseStatus();
  }, []);

  const checkPhaseStatus = async () => {
    const { data, error } = await supabase
      .from("phase_states")
      .select("status")
      .eq("game_session_id", gameId)
      .eq("phase_number", 1)
      .single();

    if (data && data.status === "COMPLETED") {
      setPhaseCompleted(true);
    }
  };

  const handleSubmitAnswer = async () => {
    // La respuesta correcta para la Fase 1 (ejemplo)
    const correctAnswer = "MEDIANOCHE";

    if (answer.toUpperCase().trim() !== correctAnswer) {
      toast.error("Respuesta incorrecta. Sigan investigando...");
      return;
    }

    setSubmitting(true);

    try {
      // Marcar fase como completada
      await supabase
        .from("phase_states")
        .update({
          status: "COMPLETED",
          completed_at: new Date().toISOString(),
        })
        .eq("game_session_id", gameId)
        .eq("phase_number", 1);

      // Activar Fase 2
      await supabase
        .from("phase_states")
        .update({
          status: "ACTIVE",
          started_at: new Date().toISOString(),
        })
        .eq("game_session_id", gameId)
        .eq("phase_number", 2);

      // Actualizar sesión de juego
      await supabase
        .from("game_sessions")
        .update({
          current_phase: 2,
          lockbox_code: "3XXX", // Revelar primer dígito: 3
        })
        .eq("id", gameId);

      toast.success("¡Fase 1 completada! Primer dígito revelado: 3");
      setPhaseCompleted(true);
    } catch (error) {
      console.error("Error completing phase:", error);
      toast.error("Error al completar la fase");
    } finally {
      setSubmitting(false);
    }
  };

  const clues = cluesByRole[playerRole] || [
    "No hay pistas asignadas para este rol.",
  ];

  if (phaseCompleted) {
    return (
      <div className="text-center space-y-4 py-8">
        <Check className="h-16 w-16 text-green-500 mx-auto" />
        <h3 className="text-2xl font-bold text-green-500">
          ¡FASE 1 COMPLETADA!
        </h3>
        <p className="text-muted-foreground">
          El primer dígito del candado ha sido revelado: <span className="text-3xl font-bold text-accent">3</span>
        </p>
        <div className="bg-muted p-4 rounded-lg max-w-2xl mx-auto">
          <p className="text-sm">
            <strong>Narrativa:</strong> Habéis reconstruido la línea temporal del crimen.
            La víctima fue atacada exactamente a medianoche. Las pruebas apuntan a que
            el agresor conocía bien el lugar y planificó el ataque meticulosamente.
            Ahora debéis continuar con la siguiente fase de la investigación...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Narrativa de introducción */}
      <div className="bg-muted p-4 rounded-lg border-l-4 border-primary">
        <p className="text-sm">
          <strong>Contexto:</strong> La víctima, el Dr. Marcus Grey, fue encontrado
          inconsciente en su oficina a primera hora de la mañana. Vuestra misión es
          reconstruir qué ocurrió la noche del crimen usando las pistas que cada uno
          de vosotros tiene. Debéis determinar la hora exacta del ataque.
        </p>
      </div>

      {/* Pistas del rol */}
      <Card className="p-4 bg-card/50">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-5 w-5 text-clue" />
          <h3 className="font-bold">TUS PISTAS EXCLUSIVAS</h3>
        </div>
        <div className="space-y-2">
          {clues.map((clue, index) => (
            <div
              key={index}
              className="p-3 bg-background rounded border-l-2 border-clue"
            >
              <p className="text-sm">{clue}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Instrucciones */}
      <div className="bg-accent/10 p-4 rounded-lg">
        <p className="text-sm text-accent-foreground">
          <strong>Instrucciones:</strong> Compartid vuestras pistas en el muro de
          hallazgos. Discutid y deducid la hora exacta del ataque. Una vez que tengáis
          la respuesta, introducidla abajo (una sola palabra en mayúsculas).
        </p>
      </div>

      {/* Input de respuesta */}
      {isHost && (
        <Card className="p-4">
          <div className="space-y-4">
            <Label htmlFor="answer" className="text-lg font-bold">
              Introducir respuesta (Solo el anfitrión)
            </Label>
            <Input
              id="answer"
              placeholder="Ej: MEDIANOCHE"
              value={answer}
              onChange={(e) => setAnswer(e.target.value.toUpperCase())}
              className="text-center text-xl font-bold tracking-wider"
            />
            <Button
              onClick={handleSubmitAnswer}
              disabled={submitting || !answer.trim()}
              size="lg"
              className="w-full"
            >
              {submitting ? "VERIFICANDO..." : "VERIFICAR RESPUESTA"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Pista: La respuesta es una palabra en mayúsculas relacionada con la hora
            </p>
          </div>
        </Card>
      )}

      {!isHost && (
        <div className="text-center text-muted-foreground">
          Esperando a que el anfitrión introduzca la respuesta...
        </div>
      )}
    </div>
  );
};

export default Phase1;
