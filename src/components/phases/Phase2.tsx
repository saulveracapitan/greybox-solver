import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Check, Share2, Scissors } from "lucide-react";
import { getCaseById, GameCase } from "@/lib/gameCases";
import PenaltyChallenge from "@/components/PenaltyChallenge";
import { getRandomPenaltyChallenge, PenaltyChallenge as PenaltyChallengeType } from "@/lib/penaltyChallenges";

interface Phase2Props {
  gameId: string;
  playerId: string;
  playerRole: string;
  isHost: boolean;
}

const Phase2 = ({ gameId, playerId, playerRole, isHost }: Phase2Props) => {
  const [answer, setAnswer] = useState("");
  const [phaseCompleted, setPhaseCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [publishedFragments, setPublishedFragments] = useState<string[]>([]);
  const [gameCase, setGameCase] = useState<GameCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPenaltyChallenge, setShowPenaltyChallenge] = useState(false);
  const [currentPenaltyChallenge, setCurrentPenaltyChallenge] = useState<PenaltyChallengeType | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [assignedPlayerId, setAssignedPlayerId] = useState<string>("");

  // Cargar el caso asignado a esta partida
  useEffect(() => {
    loadGameCase();
    checkPhaseStatus();
    loadPlayerName();
    checkActivePenaltyChallenge();
    setupPenaltyRealtime();
  }, []);

  const setupPenaltyRealtime = () => {
    const channel = supabase
      .channel(`penalty-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_sessions",
          filter: `id=eq.${gameId}`,
        },
        () => {
          checkActivePenaltyChallenge();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const checkActivePenaltyChallenge = async () => {
    try {
      const { data: session, error } = await supabase
        .from("game_sessions")
        .select("data")
        .eq("id", gameId)
        .single();

      if (error) throw error;

      const penaltyData = session?.data?.activePenaltyChallenge;
      if (penaltyData && penaltyData.phase === 2) {
        setCurrentPenaltyChallenge(penaltyData.challenge);
        setShowPenaltyChallenge(true);
        if (penaltyData.playerName) {
          setPlayerName(penaltyData.playerName);
        }
        if (penaltyData.playerId) {
          setAssignedPlayerId(penaltyData.playerId);
        }
      } else {
        setShowPenaltyChallenge(false);
        setCurrentPenaltyChallenge(null);
      }
    } catch (error) {
      console.error("Error checking penalty challenge:", error);
    }
  };

  const loadPlayerName = async () => {
    try {
      const { data, error } = await supabase
        .from("players")
        .select("name")
        .eq("id", playerId)
        .single();
      
      if (!error && data) {
        setPlayerName(data.name);
      }
    } catch (error) {
      console.error("Error loading player name:", error);
    }
  };

  const loadGameCase = async () => {
    try {
      const { data: session, error } = await supabase
        .from("game_sessions")
        .select("data")
        .eq("id", gameId)
        .single();

      if (error) throw error;

      if (session?.data?.caseId) {
        const caseData = getCaseById(session.data.caseId);
        if (caseData) {
          setGameCase(caseData);
        }
      }
    } catch (error) {
      console.error("Error loading game case:", error);
      toast.error("Error al cargar el caso");
    } finally {
      setLoading(false);
    }
  };

  // Fragmentos de documentos por rol - cada rol ve partes diferentes
  const documentFragmentsByRole: Record<string, string[]> = {
    ANALISTA_TIEMPOS: [
      "El documento fue destruido el...",
      "...23 de noviembre de 2023...",
      "...a las 23:47 según el registro...",
    ],
    EXPERTO_HUELLAS: [
      "...papel de alta calidad, marca...",
      "...OfficeMax Premium...",
      "...impreso con tinta láser negra...",
    ],
    ENTREVISTADOR: [
      "...contenía información sobre...",
      "...una transferencia bancaria...",
      "...por un monto de $50,000...",
    ],
    CARTOGRAFO: [
      "...el documento mencionaba...",
      "...una dirección en el barrio...",
      "...Calle Victoria, número 47...",
    ],
    PERITO_FORENSE: [
      "...fue cortado con precisión...",
      "...usando una herramienta afilada...",
      "...probablemente una navaja o cuchillo...",
    ],
    ARCHIVISTA: [
      "...pertenecía al expediente...",
      "...número de caso: GR-2023-487...",
      "...clasificado como CONFIDENCIAL...",
    ],
    COMUNICACIONES: [
      "...había una nota escrita a mano...",
      "...decía: 'Todo está listo'...",
      "...firmada con las iniciales 'M.G.'...",
    ],
    TESTIMONIOS: [
      "...un testigo vio el documento...",
      "...antes de ser destruido...",
      "...en las manos de alguien con guantes...",
    ],
    PERFILADOR: [
      "...el estilo de escritura sugiere...",
      "...una persona metódica y cuidadosa...",
      "...posiblemente con formación legal...",
    ],
    INTERPRETE_MENSAJES: [
      "...había números escritos: 4-7-2-1...",
      "...y una palabra clave: 'GREYBOX'...",
      "...todo encriptado con código simple...",
    ],
  };

  const checkPhaseStatus = async () => {
    const { data, error } = await supabase
      .from("phase_states")
      .select("status")
      .eq("game_session_id", gameId)
      .eq("phase_number", 2)
      .single();

    if (data && data.status === "COMPLETED") {
      setPhaseCompleted(true);
    }
  };

  const handlePublishFragment = async (fragment: string) => {
    if (publishedFragments.includes(fragment)) {
      toast.info("Este fragmento ya fue publicado");
      return;
    }

    try {
      await supabase.from("shared_log_entries").insert({
        game_session_id: gameId,
        player_id: playerId,
        phase_number: 2,
        message: `[FRAGMENTO DE DOCUMENTO] ${fragment}`,
      });

      setPublishedFragments([...publishedFragments, fragment]);
      toast.success("Fragmento publicado en el muro de hallazgos");
    } catch (error) {
      console.error("Error publishing fragment:", error);
      toast.error("Error al publicar fragmento");
    }
  };

  const handleSubmitAnswer = async () => {
    if (!gameCase) {
      toast.error("Caso no cargado. Intenta de nuevo...");
      return;
    }

    // La respuesta correcta viene del caso asignado
    const correctAnswer = gameCase.phase2.correctKeyword.toUpperCase().trim();
    const userAnswer = answer.toUpperCase().trim();

    if (userAnswer !== correctAnswer) {
      // Mostrar reto de penalización y guardarlo en la base de datos para que todos lo vean
      const penalty = getRandomPenaltyChallenge();
      
      try {
        const { data: session } = await supabase
          .from("game_sessions")
          .select("data")
          .eq("id", gameId)
          .single();

        const currentData = session?.data || {};
        await supabase
          .from("game_sessions")
          .update({
            data: {
              ...currentData,
              activePenaltyChallenge: {
                challenge: penalty,
                playerId: playerId,
                playerName: playerName,
                phase: 2,
                createdAt: new Date().toISOString(),
              },
            },
          })
          .eq("id", gameId);

        await supabase.from("shared_log_entries").insert({
          game_session_id: gameId,
          player_id: playerId,
          message: `❌ Respuesta incorrecta. ${playerName} debe completar el reto: "${penalty.name}"`,
        });
      } catch (error) {
        console.error("Error saving penalty challenge:", error);
      }

      setCurrentPenaltyChallenge(penalty);
      setShowPenaltyChallenge(true);
      toast.error("Respuesta incorrecta. Debes completar un reto...");
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
        .eq("phase_number", 2);

      // Activar Fase 3
      await supabase
        .from("phase_states")
        .update({
          status: "ACTIVE",
          started_at: new Date().toISOString(),
        })
        .eq("game_session_id", gameId)
        .eq("phase_number", 3);

      // Obtener código actual y actualizar con segundo dígito
      const { data: session } = await supabase
        .from("game_sessions")
        .select("lockbox_code")
        .eq("id", gameId)
        .single();

      const currentCode = session?.lockbox_code || "XXXXX";
      const secondDigit = gameCase.phase2.secondDigit;
      const newCode = currentCode.replace(/X/, secondDigit);

      await supabase
        .from("game_sessions")
        .update({
          current_phase: 3,
          lockbox_code: newCode,
        })
        .eq("id", gameId);

      toast.success(`¡Fase 2 completada! Segundo dígito revelado: ${secondDigit}`);
      setPhaseCompleted(true);
    } catch (error) {
      console.error("Error completing phase:", error);
      toast.error("Error al completar la fase");
    } finally {
      setSubmitting(false);
    }
  };

  // Usar fragmentos del caso si está disponible
  const fragments = gameCase?.phase2.fragments[playerRole] || documentFragmentsByRole[playerRole] || [
    "No hay fragmentos asignados para este rol.",
  ];

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">Cargando caso...</div>
      </div>
    );
  }

  if (!gameCase) {
    return (
      <div className="text-center py-8">
        <div className="text-destructive">Error: No se pudo cargar el caso</div>
      </div>
    );
  }

  const handlePenaltyComplete = async () => {
    try {
      const { data: session } = await supabase
        .from("game_sessions")
        .select("data")
        .eq("id", gameId)
        .single();

      const currentData = session?.data || {};
      const updatedData = { ...currentData };
      delete updatedData.activePenaltyChallenge;

      await supabase
        .from("game_sessions")
        .update({ data: updatedData })
        .eq("id", gameId);

      await supabase.from("shared_log_entries").insert({
        game_session_id: gameId,
        player_id: playerId,
        message: `✅ ${playerName} ha completado el reto: "${currentPenaltyChallenge?.name}"`,
      });
    } catch (error) {
      console.error("Error clearing penalty challenge:", error);
    }

    setShowPenaltyChallenge(false);
    setCurrentPenaltyChallenge(null);
    toast.info("Reto completado. Puedes intentar responder de nuevo.");
  };

  if (phaseCompleted) {
  return (
    <div className="text-center space-y-4 py-8">
        <Check className="h-16 w-16 text-green-500 mx-auto" />
        <h3 className="text-2xl font-bold text-green-500">
          ¡FASE 2 COMPLETADA!
        </h3>
        <p className="text-muted-foreground">
          El segundo dígito del candado ha sido revelado: <span className="text-3xl font-bold text-accent">{gameCase.phase2.secondDigit}</span>
        </p>
        <div className="bg-muted p-4 rounded-lg max-w-2xl mx-auto">
          <p className="text-sm">
            <strong>Narrativa:</strong> Habéis reconstruido el documento destruido.
            La palabra clave "{gameCase.phase2.correctKeyword}" aparece en todos los fragmentos.
            El documento era un {gameCase.phase2.documentType} que contenía información crucial
            relacionada con el caso. Ahora debéis rastrear la ruta del asesino...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showPenaltyChallenge && currentPenaltyChallenge && (
        <PenaltyChallenge
          challenge={currentPenaltyChallenge}
          onComplete={handlePenaltyComplete}
          playerName={playerName}
          assignedPlayerId={assignedPlayerId}
          currentPlayerId={playerId}
        />
      )}
      <div className="space-y-6">
      {/* Narrativa de introducción */}
      <div className="bg-muted p-4 rounded-lg border-l-4 border-primary">
        <p className="text-sm">
          <strong>Contexto:</strong> Durante el allanamiento, se encontraron restos de
          un documento destruido. Los fragmentos están dispersos y cada uno de vosotros
          tiene acceso a diferentes partes. Deberéis publicar vuestros fragmentos en el
          muro de hallazgos y reconstruir el mensaje clave que contiene el documento.
        </p>
      </div>

      {/* Fragmentos del rol */}
      <Card className="p-4 bg-card/50">
        <div className="flex items-center gap-2 mb-3">
          <Scissors className="h-5 w-5 text-clue" />
          <h3 className="font-bold">TUS FRAGMENTOS DE DOCUMENTO</h3>
        </div>
        <div className="space-y-2">
          {fragments.map((fragment, index) => (
            <div
              key={index}
              className="p-3 bg-background rounded border-l-2 border-clue flex items-center justify-between gap-3"
            >
              <p className="text-sm flex-1">{fragment}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePublishFragment(fragment)}
                disabled={publishedFragments.includes(fragment)}
                className="shrink-0"
              >
                <Share2 className="h-4 w-4 mr-1" />
                {publishedFragments.includes(fragment) ? "Publicado" : "Publicar"}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Instrucciones */}
      <div className="bg-accent/10 p-4 rounded-lg">
        <p className="text-sm text-accent-foreground">
          <strong>Instrucciones:</strong> Publicad vuestros fragmentos en el muro de
          hallazgos (botón "Publicar" en cada fragmento). Una vez que todos los fragmentos
          estén publicados, discutid y reconstruid el mensaje clave. La respuesta es una
          sola palabra en mayúsculas que aparece en el documento reconstruido.
        </p>
      </div>

      {/* Input de respuesta */}
      {isHost && (
        <Card className="p-4">
          <div className="space-y-4">
            <Label htmlFor="answer" className="text-lg font-bold">
              Introducir palabra clave (Solo el anfitrión)
            </Label>
            <Input
              id="answer"
              placeholder="Ej: GREYBOX"
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
              Pista: La palabra clave aparece en los fragmentos publicados. Busca la palabra
              que todos los fragmentos mencionan o que es central al {gameCase.phase2.documentType.toLowerCase()}.
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
    </>
  );
};

export default Phase2;
