import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, BookOpen, AlertTriangle, Check, X, Clock } from "lucide-react";
import Notebook from "@/components/cluedo/Notebook";
import GameRules from "@/components/cluedo/GameRules";
import ChallengeModal from "@/components/cluedo/ChallengeModal";
import {
  Player,
  Card as GameCard,
  Suggestion,
  Accusation,
  SUSPECTS,
  WEAPONS,
  ROOMS,
  canRefuteSuggestion,
  getNextActivePlayer,
} from "@/lib/cluedoTraditionalGame";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Game {
  id: string;
  code: string;
  status: string;
  solution_suspect_id: number;
  solution_weapon_id: number;
  solution_room_id: number;
  current_turn_player_id: string | null;
  started_at: string;
}

const TraditionalCluedoGame = () => {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const playerId = searchParams.get("playerId");
  const navigate = useNavigate();

  const [game, setGame] = useState<Game | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [myCards, setMyCards] = useState<(GameCard & { shownBy?: string })[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState<string | null>(null);
  const [markedCards, setMarkedCards] = useState<Record<string, 'yes' | 'no' | 'maybe'>>({});
  const [showRules, setShowRules] = useState(false);
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
  const [showAccusationDialog, setShowAccusationDialog] = useState(false);
  const [selectedSuspect, setSelectedSuspect] = useState<string>("");
  const [selectedWeapon, setSelectedWeapon] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [refutingSuggestion, setRefutingSuggestion] = useState<Suggestion | null>(null);
  const [cardToShow, setCardToShow] = useState<GameCard | null>(null);
  const [currentRefutationState, setCurrentRefutationState] = useState<{
    suggestionId: string;
    currentRefutingPlayerId: string | null;
    refutations: Array<{ playerId: string; canRefute: boolean | null; cardShown?: GameCard }>;
  } | null>(null);
  const [showChallenge, setShowChallenge] = useState(false);
  const [challengeType, setChallengeType] = useState<string>("");
  const [challengePlayerId, setChallengePlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId || !playerId) {
      navigate("/");
      return;
    }

    loadGameData();
    setupRealtimeSubscription();
  }, [gameId, playerId]);

  const loadGameData = async () => {
    try {
      // Cargar partida
      const { data: gameData, error: gameError } = await supabase
        .from("cluedo_games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (gameError) throw gameError;
      setGame(gameData);

      if (gameData.status === "FINISHED" || gameData.status === "WIN" || gameData.status === "LOSE") {
        navigate(`/cluedo-traditional/result/${gameId}?playerId=${playerId}`);
        return;
      }

      // Cargar jugadores
      const { data: playersData, error: playersError } = await supabase
        .from("cluedo_players")
        .select("*")
        .eq("game_id", gameId)
        .order("turn_order", { ascending: true });

      if (playersError) throw playersError;

      const playersList: Player[] = (playersData || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        cards: [], // Se cargarán después
        isActive: p.connected !== false,
        turnOrder: p.turn_order || 0,
      }));

      setPlayers(playersList);

      // Encontrar jugador actual
      const player = playersList.find((p) => p.id === playerId);
      if (!player) {
        toast.error("Jugador no encontrado");
        return;
      }
      setCurrentPlayer(player);

      // Cargar cartas del jugador actual (tanto las que tiene como las que le han mostrado)
      const { data: cluesData, error: cluesError } = await supabase
        .from("clues")
        .select("*")
        .eq("game_id", gameId)
        .eq("player_id", playerId)
        .or("text.like.CARD:%,text.like.SHOWN_CARD:%");

      if (!cluesError && cluesData) {
        const cards: (GameCard & { shownBy?: string })[] = cluesData.map((clue: any) => {
          if (clue.text.startsWith("CARD:")) {
            // Carta propia
            const [, type, name] = clue.text.split(":");
            return {
              id: clue.id,
              type: type as 'SUSPECT' | 'WEAPON' | 'ROOM',
              name,
              shownBy: undefined,
            };
          } else if (clue.text.startsWith("SHOWN_CARD:")) {
            // Carta mostrada por otro jugador
            const [, type, name, shownByPlayerId] = clue.text.split(":");
            return {
              id: clue.id,
              type: type as 'SUSPECT' | 'WEAPON' | 'ROOM',
              name,
              shownBy: shownByPlayerId,
            };
          }
          return null;
        }).filter((c) => c !== null) as (GameCard & { shownBy?: string })[];
        setMyCards(cards);
        player.cards = cards;
      }

      // Cargar sugerencias (desde accusations o una tabla separada)
      // Por ahora usaremos la tabla accusations para almacenar sugerencias también
      const { data: suggestionsData } = await supabase
        .from("accusations")
        .select("*")
        .eq("game_id", gameId)
        .is("is_correct", null) // Las sugerencias tienen is_correct = null
        .order("created_at", { ascending: false })
        .limit(20);

      if (suggestionsData) {
        // Convertir a formato Suggestion
        const suggestionsList: Suggestion[] = await Promise.all(
          suggestionsData.map(async (acc: any) => {
            try {
              const [playerRes, suspectRes, weaponRes, roomRes] = await Promise.all([
                supabase
                  .from("cluedo_players")
                  .select("name")
                  .eq("id", acc.player_id)
                  .maybeSingle(),
                supabase
                  .from("suspects")
                  .select("name")
                  .eq("id", acc.suspect_id)
                  .maybeSingle(),
                supabase
                  .from("weapons")
                  .select("name")
                  .eq("id", acc.weapon_id)
                  .maybeSingle(),
                supabase
                  .from("rooms")
                  .select("name")
                  .eq("id", acc.room_id)
                  .maybeSingle(),
              ]);

              // Buscar todas las refutaciones de esta sugerencia (ordenadas por turn_order)
              const { data: allRefutationsData } = await supabase
                .from("refutations")
                .select("player_id, can_refute, turn_order")
                .eq("suggestion_id", acc.id)
                .order("turn_order", { ascending: true });

              let refutedBy = undefined;
              let refutationPath: Array<{
                playerId: string;
                playerName: string;
                canRefute: boolean | null;
                turnOrder: number;
              }> = [];

              if (allRefutationsData && allRefutationsData.length > 0) {
                // Cargar los nombres de todos los jugadores que intentaron refutar
                const playerIds = allRefutationsData.map(r => r.player_id);
                const { data: playersData } = await supabase
                  .from("cluedo_players")
                  .select("id, name")
                  .in("id", playerIds);

                const playersMap = new Map(
                  (playersData || []).map(p => [p.id, p.name])
                );

                // Construir el recorrido de refutaciones
                refutationPath = allRefutationsData.map(r => ({
                  playerId: r.player_id,
                  playerName: playersMap.get(r.player_id) || "Desconocido",
                  canRefute: r.can_refute,
                  turnOrder: r.turn_order,
                }));

                // Encontrar quién refutó (si alguien lo hizo)
                const refutationData = allRefutationsData.find(r => r.can_refute === true);
                if (refutationData) {
                  refutedBy = {
                    playerId: refutationData.player_id,
                    playerName: playersMap.get(refutationData.player_id) || "Desconocido",
                  };
                }
              }

              return {
                id: acc.id,
                playerId: acc.player_id,
                playerName: playerRes.data?.name || "Desconocido",
                suspect: suspectRes.data?.name || "",
                weapon: weaponRes.data?.name || "",
                room: roomRes.data?.name || "",
                refutedBy,
                refutationPath: refutationPath.length > 0 ? refutationPath : undefined,
                createdAt: acc.created_at,
              };
            } catch (error) {
              console.error("Error loading suggestion data:", error);
              // Retornar una sugerencia con datos por defecto si hay error
              return {
                id: acc.id,
                playerId: acc.player_id,
                playerName: "Desconocido",
                suspect: "",
                weapon: "",
                room: "",
                createdAt: acc.created_at,
              };
            }
          })
        );
        setSuggestions(suggestionsList);
      }

      // Cargar estado de refutación activo (si hay alguna sugerencia sin completar)
      const { data: latestSuggestionData, error: latestSuggestionError } = await supabase
        .from("accusations")
        .select("id, player_id")
        .eq("game_id", gameId)
        .is("is_correct", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const latestSuggestion = latestSuggestionError ? null : latestSuggestionData;

      if (latestSuggestion) {
        const { data: refutationsData } = await supabase
          .from("refutations")
          .select("*")
          .eq("suggestion_id", latestSuggestion.id)
          .order("turn_order", { ascending: true });

        if (refutationsData && refutationsData.length > 0) {
          // Verificar si alguien ya refutó (can_refute = true)
          const someoneRefuted = refutationsData.some(r => r.can_refute === true);
          
          if (!someoneRefuted) {
            // Encontrar el primer jugador que aún no ha respondido
            const pendingRefutation = refutationsData.find(r => r.can_refute === null);
            const currentRefutingPlayerId = pendingRefutation 
              ? pendingRefutation.player_id 
              : null; // Si todos respondieron que no pueden, la refutación está completa

            setCurrentRefutationState({
              suggestionId: latestSuggestion.id,
              currentRefutingPlayerId,
              refutations: refutationsData.map(r => ({
                playerId: r.player_id,
                canRefute: r.can_refute,
                cardShown: r.card_shown_id ? { id: r.card_shown_id } as GameCard : undefined,
              })),
            });
          } else {
            // Alguien ya refutó - la refutación está completa, limpiar estado
            // El turno se avanzará cuando se carguen los datos del juego
            setCurrentRefutationState(null);
            
            // Verificar si el juego terminó (por si alguien ganó mientras estábamos cargando)
            if (gameData.status === "WIN" || gameData.status === "FINISHED") {
              navigate(`/cluedo-traditional/result/${gameId}?playerId=${playerId}`);
              return;
            }
          }
        }
      } else {
        setCurrentRefutationState(null);
      }

      // Determinar turno actual desde la BD o usar el primero
      if (gameData.current_turn_player_id) {
        // Verificar que el jugador con el turno sigue activo
        const turnPlayer = playersList.find(p => p.id === gameData.current_turn_player_id && p.isActive);
        if (turnPlayer) {
          setCurrentTurnPlayerId(gameData.current_turn_player_id);
        } else {
          // Si el jugador con el turno está inactivo, buscar el siguiente
          const activePlayers = playersList.filter((p) => p.isActive).sort((a, b) => a.turnOrder - b.turnOrder);
          if (activePlayers.length > 0) {
            setCurrentTurnPlayerId(activePlayers[0].id);
            // Actualizar en BD
            await supabase
              .from("cluedo_games")
              .update({ current_turn_player_id: activePlayers[0].id })
              .eq("id", gameId);
          }
        }
      } else {
        // Si no hay turno establecido, empezar con el primero
        const activePlayers = playersList.filter((p) => p.isActive).sort((a, b) => a.turnOrder - b.turnOrder);
        if (activePlayers.length > 0) {
          const firstPlayer = activePlayers[0];
          setCurrentTurnPlayerId(firstPlayer.id);
          // Guardar en BD
          await supabase
            .from("cluedo_games")
            .update({ current_turn_player_id: firstPlayer.id })
            .eq("id", gameId);
        }
      }
    } catch (error: any) {
      console.error("Error loading game data:", error);
      // Solo mostrar error si no es un error de "no encontrado" (que es normal cuando no hay sugerencias)
      if (error?.code !== 'PGRST116' && !error?.message?.includes('does not exist')) {
        toast.error(`Error al cargar datos del juego: ${error?.message || 'Error desconocido'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`traditional-cluedo-game:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cluedo_games",
          filter: `id=eq.${gameId}`,
        },
        () => {
          loadGameData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "accusations",
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          loadGameData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cluedo_players",
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          loadGameData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "clues",
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          // Recargar datos cuando se añade una nueva pista (incluyendo cartas mostradas)
          loadGameData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "refutations",
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          // Recargar datos cuando cambia el estado de refutación
          loadGameData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleMakeSuggestion = async () => {
    if (!selectedSuspect || !selectedWeapon || !selectedRoom) {
      toast.error("Por favor, selecciona un sospechoso, un arma y una habitación");
      return;
    }

    if (!game || !currentPlayer) return;

    try {
      // Obtener IDs de las cartas
      const { data: suspectData } = await supabase
        .from("suspects")
        .select("id")
        .eq("name", selectedSuspect)
        .single();

      const { data: weaponData } = await supabase
        .from("weapons")
        .select("id")
        .eq("name", selectedWeapon)
        .single();

      const { data: roomData } = await supabase
        .from("rooms")
        .select("id")
        .eq("name", selectedRoom)
        .single();

      if (!suspectData || !weaponData || !roomData) {
        toast.error("Error al obtener datos de las cartas");
        return;
      }

      // Guardar sugerencia (usando accusations con is_correct = null)
      const { data: suggestionData, error: suggestionError } = await supabase
        .from("accusations")
        .insert({
          game_id: gameId!,
          player_id: currentPlayer.id,
          suspect_id: suspectData.id,
          weapon_id: weaponData.id,
          room_id: roomData.id,
          is_correct: null, // null = sugerencia, true/false = acusación
        })
        .select()
        .single();

      if (suggestionError || !suggestionData) {
        throw new Error("Error al guardar la sugerencia");
      }

      // Crear entradas de refutación para cada jugador (excepto el que hizo la sugerencia)
      // Empezar desde el siguiente jugador en orden
      const suggestingPlayerIndex = players.findIndex(p => p.id === currentPlayer.id);
      const activePlayers = players.filter(p => p.isActive).sort((a, b) => a.turnOrder - b.turnOrder);
      
      // Encontrar el índice del jugador que hizo la sugerencia en la lista activa
      const suggestingPlayerActiveIndex = activePlayers.findIndex(p => p.id === currentPlayer.id);
      
      // Crear refutaciones para los jugadores siguientes (en orden circular)
      const refutationEntries = [];
      for (let i = 1; i < activePlayers.length; i++) {
        const refutingPlayerIndex = (suggestingPlayerActiveIndex + i) % activePlayers.length;
        const refutingPlayer = activePlayers[refutingPlayerIndex];
        
        refutationEntries.push({
          game_id: gameId!,
          suggestion_id: suggestionData.id,
          player_id: refutingPlayer.id,
          can_refute: null, // Aún no ha respondido
          turn_order: i, // Orden de refutación (1 = primero, 2 = segundo, etc.)
        });
      }

      if (refutationEntries.length > 0) {
        await supabase.from("refutations").insert(refutationEntries);
      }

      // NO avanzar el turno todavía - esperar a que se complete la refutación
      toast.success("Sugerencia realizada. Esperando refutaciones...");
      setShowSuggestionDialog(false);
      setSelectedSuspect("");
      setSelectedWeapon("");
      setSelectedRoom("");
      
      // Recargar datos para mostrar el estado de refutación
      await loadGameData();
    } catch (error: any) {
      console.error("Error making suggestion:", error);
      toast.error(error.message || "Error al hacer la sugerencia");
    }
  };

  // Función auxiliar para mostrar reto antes de avanzar turno
  const showChallengeBeforeAdvancing = (playerId: string) => {
    const challengeTypes = [
      "alta_o_baja",
      "rojo_o_negro",
      "adivina_palo",
      "carta_mas_alta",
      "suma_cartas",
      "carta_medio",
      "secuencia",
      "color_mayoritario",
      "piedra_papel_tijera",
      "pulso_chino",
      "duelo_miradas",
      "memoria_cartas",
      "moneda_vaso",
      "vaso_flotante",
      "regla_bob",
    ];
    const randomChallenge = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];
    setChallengeType(randomChallenge);
    setChallengePlayerId(playerId);
    setShowChallenge(true);
  };

  // Función auxiliar para completar la refutación y avanzar el turno
  const completeRefutationAndAdvanceTurn = async (suggestionId: string, skipChallenge: boolean = false) => {
    if (!game || !gameId) return;

    // Obtener la sugerencia para saber quién la hizo
    const { data: suggestionData } = await supabase
      .from("accusations")
      .select("player_id")
      .eq("id", suggestionId)
      .single();

    if (!suggestionData) return;

    const suggestingPlayerId = suggestionData.player_id;
    const suggestingPlayer = players.find(p => p.id === suggestingPlayerId);
    
    if (!suggestingPlayer) return;

    // Avanzar turno al siguiente jugador activo
    const nextPlayer = getNextActivePlayer(players, suggestingPlayerId);
    if (nextPlayer) {
      // Mostrar reto antes de avanzar el turno
      if (!skipChallenge) {
        showChallengeBeforeAdvancing(nextPlayer.id);
        // El turno se avanzará después de completar el reto
        return;
      }

      await supabase
        .from("cluedo_games")
        .update({ current_turn_player_id: nextPlayer.id })
        .eq("id", gameId);
      
      setCurrentTurnPlayerId(nextPlayer.id);
    }

    // Limpiar estado de refutación
    setCurrentRefutationState(null);
  };

  // Función para completar el reto y avanzar el turno
  const handleChallengeComplete = async () => {
    if (!challengePlayerId || !gameId) return;

    setShowChallenge(false);

    // Avanzar turno al jugador que completó el reto
    await supabase
      .from("cluedo_games")
      .update({ current_turn_player_id: challengePlayerId })
      .eq("id", gameId);
    
    setCurrentTurnPlayerId(challengePlayerId);
    setChallengePlayerId(null);
    setChallengeType("");
    
    // Recargar datos del juego
    await loadGameData();
  };

  // Manejar cuando un jugador indica si puede refutar o no
  const handleRespondToRefutation = async (canRefute: boolean) => {
    if (!currentRefutationState || !currentPlayer || !gameId) return;

    // Verificar que es el turno de este jugador para refutar
    if (currentRefutationState.currentRefutingPlayerId !== currentPlayer.id) {
      toast.error("No es tu turno para refutar");
      return;
    }

    try {
      // Buscar la entrada de refutación para este jugador
      const { data: refutationData } = await supabase
        .from("refutations")
        .select("*")
        .eq("suggestion_id", currentRefutationState.suggestionId)
        .eq("player_id", currentPlayer.id)
        .single();

      if (!refutationData) {
        toast.error("No se encontró la entrada de refutación");
        return;
      }

      if (canRefute) {
        // El jugador puede refutar - necesita seleccionar una carta
        const playerWithCards: Player = {
          ...currentPlayer,
          cards: myCards,
        };

        // Obtener la sugerencia para verificar qué cartas puede mostrar
        const suggestion = suggestions.find(s => s.id === currentRefutationState.suggestionId);
        if (!suggestion) {
          toast.error("No se encontró la sugerencia");
          return;
        }

        const refutingCard = canRefuteSuggestion(playerWithCards, {
          suspect: suggestion.suspect,
          weapon: suggestion.weapon,
          room: suggestion.room,
        });

        if (!refutingCard) {
          toast.error("No tienes ninguna carta de esta sugerencia");
          return;
        }

        // Mostrar diálogo para seleccionar carta
        setRefutingSuggestion(suggestion);
        setCardToShow(refutingCard);
      } else {
        // El jugador no puede refutar
        await supabase
          .from("refutations")
          .update({ can_refute: false })
          .eq("id", refutationData.id);

        toast.success("Has indicado que no puedes refutar");

        // Verificar si hay más jugadores pendientes o si todos han respondido
        const { data: allRefutations } = await supabase
          .from("refutations")
          .select("*")
          .eq("suggestion_id", currentRefutationState.suggestionId)
          .order("turn_order", { ascending: true });

        if (allRefutations) {
          const someoneRefuted = allRefutations.some(r => r.can_refute === true);
          if (someoneRefuted) {
            // Alguien ya refutó - completar refutación
            await completeRefutationAndAdvanceTurn(currentRefutationState.suggestionId, false);
          } else {
            const pendingRefutation = allRefutations.find(r => r.can_refute === null);
            if (pendingRefutation) {
              // Hay más jugadores pendientes
              setCurrentRefutationState({
                ...currentRefutationState,
                currentRefutingPlayerId: pendingRefutation.player_id,
                refutations: allRefutations.map(r => ({
                  playerId: r.player_id,
                  canRefute: r.can_refute,
                  cardShown: r.card_shown_id ? { id: r.card_shown_id } as GameCard : undefined,
                })),
              });
            } else {
              // Todos respondieron que no pueden refutar - verificar si la sugerencia es correcta
              // Si nadie puede refutar, significa que la sugerencia es la solución correcta
              const suggestion = suggestions.find(s => s.id === currentRefutationState.suggestionId);
              if (!suggestion) {
                toast.error("No se encontró la sugerencia");
                return;
              }

              // Obtener IDs de las cartas de la sugerencia
              const { data: suspectData } = await supabase
                .from("suspects")
                .select("id")
                .eq("name", suggestion.suspect)
                .single();

              const { data: weaponData } = await supabase
                .from("weapons")
                .select("id")
                .eq("name", suggestion.weapon)
                .single();

              const { data: roomData } = await supabase
                .from("rooms")
                .select("id")
                .eq("name", suggestion.room)
                .single();

              if (!suspectData || !weaponData || !roomData) {
                toast.error("Error al obtener datos de las cartas");
                return;
              }

              // Verificar si la sugerencia coincide con la solución
              const isCorrect =
                game.solution_suspect_id === suspectData.id &&
                game.solution_weapon_id === weaponData.id &&
                game.solution_room_id === roomData.id;

              if (isCorrect) {
                // ¡El jugador ha ganado!
                await supabase
                  .from("accusations")
                  .update({ is_correct: true })
                  .eq("id", currentRefutationState.suggestionId);

                await supabase
                  .from("cluedo_games")
                  .update({
                    status: "WIN",
                    finished_at: new Date().toISOString(),
                    current_turn_player_id: null,
                  })
                  .eq("id", gameId);

                toast.success(`¡${suggestion.playerName} ha ganado! La sugerencia era correcta.`);
                
                // Redirigir a la pantalla de resultados después de un breve delay
                setTimeout(() => {
                  navigate(`/cluedo-traditional/result/${gameId}?playerId=${playerId}`);
                }, 2000);
              } else {
                // La sugerencia no es correcta, pero nadie pudo refutarla
                // Esto no debería pasar en un juego normal, pero manejamos el caso
                await completeRefutationAndAdvanceTurn(currentRefutationState.suggestionId, false);
              }
            }
          }
        }

        await loadGameData();
      }
    } catch (error: any) {
      console.error("Error responding to refutation:", error);
      toast.error("Error al responder a la refutación");
    }
  };

  const handleConfirmRefutation = async () => {
    if (!refutingSuggestion || !cardToShow || !currentPlayer || !gameId || !currentRefutationState) return;

    try {
      // Buscar la entrada de refutación
      const { data: refutationData } = await supabase
        .from("refutations")
        .select("*")
        .eq("suggestion_id", currentRefutationState.suggestionId)
        .eq("player_id", currentPlayer.id)
        .single();

      if (!refutationData) {
        toast.error("No se encontró la entrada de refutación");
        return;
      }

      // Guardar la carta mostrada en la BD para el jugador que hizo la sugerencia
      const { data: shownCardData, error: insertError } = await supabase.from("clues").insert({
        game_id: gameId,
        text: `SHOWN_CARD:${cardToShow.type}:${cardToShow.name}:${currentPlayer.id}`,
        is_private: true,
        player_id: refutingSuggestion.playerId, // El jugador que hizo la sugerencia verá esta carta
        affects_type: cardToShow.type === "SUSPECT" ? "SUSPECT" :
                     cardToShow.type === "WEAPON" ? "WEAPON" : "ROOM",
      }).select().single();

      if (insertError || !shownCardData) {
        console.error("Error saving shown card:", insertError);
        throw insertError;
      }

      // Actualizar la refutación indicando que sí puede refutar y qué carta mostró
      await supabase
        .from("refutations")
        .update({ 
          can_refute: true,
          card_shown_id: shownCardData.id,
        })
        .eq("id", refutationData.id);
      
      toast.success(`Has mostrado la carta: ${cardToShow.name} a ${refutingSuggestion.playerName}`);
      
      // Completar la refutación y avanzar el turno
      await completeRefutationAndAdvanceTurn(currentRefutationState.suggestionId);
      
      setRefutingSuggestion(null);
      setCardToShow(null);
      await loadGameData();
    } catch (error: any) {
      console.error("Error confirming refutation:", error);
      toast.error("Error al confirmar la refutación");
    }
  };

  const handleMakeAccusation = async () => {
    if (!selectedSuspect || !selectedWeapon || !selectedRoom) {
      toast.error("Por favor, selecciona un sospechoso, un arma y una habitación");
      return;
    }

    if (!game || !currentPlayer) return;

    try {
      // Obtener IDs
      const { data: suspectData } = await supabase
        .from("suspects")
        .select("id")
        .eq("name", selectedSuspect)
        .single();

      const { data: weaponData } = await supabase
        .from("weapons")
        .select("id")
        .eq("name", selectedWeapon)
        .single();

      const { data: roomData } = await supabase
        .from("rooms")
        .select("id")
        .eq("name", selectedRoom)
        .single();

      if (!suspectData || !weaponData || !roomData) {
        toast.error("Error al obtener datos de las cartas");
        return;
      }

      // Verificar si es correcta
      const isCorrect =
        game.solution_suspect_id === suspectData.id &&
        game.solution_weapon_id === weaponData.id &&
        game.solution_room_id === roomData.id;

      // Guardar acusación
      await supabase.from("accusations").insert({
        game_id: gameId!,
        player_id: currentPlayer.id,
        suspect_id: suspectData.id,
        weapon_id: weaponData.id,
        room_id: roomData.id,
        is_correct: isCorrect,
      });

      if (isCorrect) {
        // Victoria
        await supabase
          .from("cluedo_games")
          .update({
            status: "WIN",
            finished_at: new Date().toISOString(),
            current_turn_player_id: null,
          })
          .eq("id", gameId);

        toast.success("¡Acusación correcta! ¡Has ganado!");
        setTimeout(() => {
          navigate(`/cluedo-traditional/result/${gameId}?playerId=${playerId}`);
        }, 2000);
      } else {
        // Eliminar jugador
        await supabase
          .from("cluedo_players")
          .update({ connected: false })
          .eq("id", currentPlayer.id);

        // Obtener las cartas iniciales del jugador eliminado (solo las que tienen "CARD:")
        const { data: eliminatedPlayerCards } = await supabase
          .from("clues")
          .select("*")
          .eq("game_id", gameId)
          .eq("player_id", currentPlayer.id)
          .like("text", "CARD:%");

        if (eliminatedPlayerCards && eliminatedPlayerCards.length > 0) {
          // Convertir las cartas a formato Card
          const cardsToRedistribute: GameCard[] = eliminatedPlayerCards.map((clue: any) => {
            const [, type, name] = clue.text.split(":");
            return {
              id: clue.id,
              type: type as 'SUSPECT' | 'WEAPON' | 'ROOM',
              name,
            };
          });

          // Obtener jugadores activos (excluyendo al eliminado)
          const activePlayers = players.filter(p => p.id !== currentPlayer.id && p.isActive);
          
          if (activePlayers.length > 0 && cardsToRedistribute.length > 0) {
            // Mezclar las cartas antes de repartirlas
            const shuffledCards = cardsToRedistribute.sort(() => Math.random() - 0.5);
            
            // Repartir las cartas de manera circular entre los jugadores activos
            for (let i = 0; i < shuffledCards.length; i++) {
              const targetPlayer = activePlayers[i % activePlayers.length];
              const card = shuffledCards[i];
              
              // Insertar la carta en la mano del jugador objetivo
              await supabase.from("clues").insert({
                game_id: gameId!,
                text: `CARD:${card.type}:${card.name}`,
                is_private: true,
                player_id: targetPlayer.id,
                affects_type: card.type === "SUSPECT" ? "SUSPECT" :
                             card.type === "WEAPON" ? "WEAPON" : "ROOM",
              });
            }

            // Eliminar las cartas del jugador eliminado
            await supabase
              .from("clues")
              .delete()
              .eq("game_id", gameId)
              .eq("player_id", currentPlayer.id)
              .like("text", "CARD:%");

            toast.success(`Las cartas de ${currentPlayer.name} se han repartido entre los jugadores activos.`);
          }
        }

        toast.error("Acusación incorrecta. Has sido eliminado.");

        // Avanzar turno al siguiente jugador activo
        const nextPlayer = getNextActivePlayer(players, currentPlayer.id);
        if (nextPlayer) {
          // Guardar el turno en la BD
          await supabase
            .from("cluedo_games")
            .update({ current_turn_player_id: nextPlayer.id })
            .eq("id", gameId);
          
          setCurrentTurnPlayerId(nextPlayer.id);
        } else {
          // Si no hay más jugadores activos, terminar partida
          await supabase
            .from("cluedo_games")
            .update({
              status: "LOSE",
              finished_at: new Date().toISOString(),
              current_turn_player_id: null,
            })
            .eq("id", gameId);
        }

        // Recargar datos del juego para reflejar los cambios
        await loadGameData();
      }

      setShowAccusationDialog(false);
      setSelectedSuspect("");
      setSelectedWeapon("");
      setSelectedRoom("");
    } catch (error: any) {
      console.error("Error making accusation:", error);
      toast.error(error.message || "Error al hacer la acusación");
    }
  };

  const handleMarkCard = (cardName: string, status: 'yes' | 'no' | 'maybe') => {
    setMarkedCards((prev) => ({
      ...prev,
      [cardName]: status,
    }));
  };

  const isMyTurn = currentTurnPlayerId === playerId;
  const currentTurnPlayer = players.find((p) => p.id === currentTurnPlayerId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  if (!game || !currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Error: No se encontró la partida</div>
      </div>
    );
  }

  if (!currentPlayer.isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <X className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Has sido eliminado</h2>
          <p className="text-muted-foreground mb-4">
            Tu acusación fue incorrecta. Puedes seguir observando la partida.
          </p>
          <Button onClick={() => navigate("/")}>Volver al inicio</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <Card className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">🕵️ Cluedo Tradicional</h1>
              <p className="text-sm text-muted-foreground">
                Jugando como: <strong>{currentPlayer.name}</strong>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setShowRules(true)}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Reglas
              </Button>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>{players.filter((p) => p.isActive).length} jugadores activos</span>
              </div>
            </div>
          </div>

          {/* Turno actual */}
          <div className="mt-4 p-3 bg-primary/10 rounded-lg">
            <p className="text-sm text-muted-foreground">Turno de:</p>
            <p className="text-xl font-bold">
              {currentTurnPlayer?.name || "Cargando..."}
              {isMyTurn && " (TÚ)"}
            </p>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Columna izquierda: Mis cartas y acciones */}
          <div className="lg:col-span-2 space-y-4">
            {/* Mis cartas */}
            <Card className="p-4">
              <h2 className="text-xl font-bold mb-4">🃏 Mis Cartas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {myCards.length === 0 ? (
                  <p className="text-sm text-muted-foreground col-span-2">
                    Aún no tienes cartas. Las recibirás cuando se inicie la partida.
                  </p>
                ) : (
                  myCards.map((card) => {
                    const isShownCard = card.shownBy !== undefined;
                    const shownByPlayer = isShownCard ? players.find(p => p.id === card.shownBy) : null;
                    
                    return (
                      <div
                        key={card.id}
                        className={`p-4 rounded-lg border-2 ${
                          isShownCard
                            ? "bg-blue-100 border-blue-400"
                            : "bg-red-100 border-red-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-bold text-black">{card.name}</h3>
                          <span className={`text-xs px-2 py-1 rounded ${
                            isShownCard
                              ? "bg-blue-500 text-white"
                              : "bg-red-500 text-white"
                          }`}>
                            {card.type === "SUSPECT" ? "Sospechoso" :
                             card.type === "WEAPON" ? "Arma" : "Habitación"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {isShownCard ? (
                            <>
                              <span className="font-semibold">Mostrada por {shownByPlayer?.name || "otro jugador"}</span>
                              <br />
                              Esta carta NO está en la solución
                            </>
                          ) : (
                            "Esta carta NO está en la solución (la tengo yo)"
                          )}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

            {/* Estado de refutación activo */}
            {currentRefutationState && currentRefutationState.currentRefutingPlayerId && (
              <Card className="p-4 border-2 border-yellow-500 bg-yellow-50">
                <h2 className="text-xl font-bold mb-4 text-gray-900">🔄 Refutación en Curso</h2>
                {(() => {
                  const suggestion = suggestions.find(s => s.id === currentRefutationState.suggestionId);
                  const currentRefutingPlayer = players.find(p => p.id === currentRefutationState.currentRefutingPlayerId);
                  const isMyRefutationTurn = currentRefutationState.currentRefutingPlayerId === currentPlayer?.id;
                  
                  return (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-900">
                        <strong className="text-gray-900">{suggestion?.playerName}</strong> sugirió:{" "}
                        <strong className="text-gray-900">{suggestion?.suspect}</strong> con{" "}
                        <strong className="text-gray-900">{suggestion?.weapon}</strong> en{" "}
                        <strong className="text-gray-900">{suggestion?.room}</strong>
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {isMyRefutationTurn 
                          ? "🎯 Es tu turno para refutar"
                          : `Esperando a que ${currentRefutingPlayer?.name || "otro jugador"} responda...`}
                      </p>
                      {isMyRefutationTurn && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleRespondToRefutation(true)}
                            className="flex-1"
                            variant="default"
                          >
                            Sí, puedo refutar
                          </Button>
                          <Button
                            onClick={() => handleRespondToRefutation(false)}
                            className="flex-1"
                            variant="outline"
                          >
                            No puedo refutar
                          </Button>
                        </div>
                      )}
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-semibold mb-2 text-gray-900">Estado de refutaciones:</p>
                        <div className="space-y-1">
                          {currentRefutationState.refutations.map((ref, idx) => {
                            const refPlayer = players.find(p => p.id === ref.playerId);
                            return (
                              <div key={idx} className="text-xs flex items-center gap-2">
                                <span className="text-gray-900">{refPlayer?.name || "Jugador"}:</span>
                                {ref.canRefute === null ? (
                                  <span className="text-yellow-600">⏳ Pendiente</span>
                                ) : ref.canRefute === true ? (
                                  <span className="text-green-600">✓ Refutó</span>
                                ) : (
                                  <span className="text-gray-600">✗ No puede refutar</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </Card>
            )}

            {/* Acciones (solo en mi turno y si no hay refutación activa) */}
            {isMyTurn && !currentRefutationState?.currentRefutingPlayerId && (
              <Card className="p-4">
                <h2 className="text-xl font-bold mb-4">🎯 Acciones</h2>
                <div className="space-y-3">
                  <Button
                    onClick={() => setShowSuggestionDialog(true)}
                    className="w-full"
                    size="lg"
                  >
                    Hacer Sugerencia
                  </Button>
                  <Button
                    onClick={() => setShowAccusationDialog(true)}
                    variant="destructive"
                    className="w-full"
                    size="lg"
                  >
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Acusación Final
                  </Button>
                </div>
              </Card>
            )}

            {/* Historial de sugerencias */}
            <Card className="p-4">
              <h2 className="text-xl font-bold mb-4">📜 Historial de Sugerencias</h2>
              <div className="h-64 overflow-y-auto space-y-3">
                {suggestions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aún no se han hecho sugerencias
                  </p>
                ) : (
                  suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="p-3 bg-muted rounded-lg border-l-4 border-primary"
                    >
                      <p className="font-bold text-gray-900">{suggestion.playerName}</p>
                      <p className="text-sm text-gray-800">
                        Sugirió: <strong className="text-gray-900">{suggestion.suspect}</strong> con{" "}
                        <strong className="text-gray-900">{suggestion.weapon}</strong> en{" "}
                        <strong className="text-gray-900">{suggestion.room}</strong>
                      </p>
                      {suggestion.refutationPath && suggestion.refutationPath.length > 0 ? (
                        <div className="mt-2">
                          <p className="text-xs text-gray-700 font-semibold mb-1">Recorrido de refutación:</p>
                          <div className="flex flex-wrap items-center gap-1 text-xs">
                            <span className="font-semibold text-gray-900">{suggestion.playerName}</span>
                            {suggestion.refutationPath.map((ref, index) => (
                              <span key={ref.playerId} className="flex items-center gap-1">
                                <span className="text-gray-500">→</span>
                                <span className={`font-medium ${
                                  ref.canRefute === true 
                                    ? "text-green-600" 
                                    : ref.canRefute === false 
                                    ? "text-red-600" 
                                    : "text-yellow-600"
                                }`}>
                                  {ref.playerName}
                                  {ref.canRefute === true && " ✓"}
                                  {ref.canRefute === false && " ✗"}
                                  {ref.canRefute === null && " ⏳"}
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-yellow-600 mt-1">
                          ⏳ Sin refutar
                        </p>
                      )}
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(suggestion.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Columna derecha: Libreta */}
          <div>
            <Notebook
              playerCards={myCards}
              onMarkCard={handleMarkCard}
              markedCards={markedCards}
            />
          </div>
        </div>
      </div>

      {/* Dialog de reglas */}
      <GameRules open={showRules} onClose={() => setShowRules(false)} />

      {/* Dialog de sugerencia */}
      <Dialog open={showSuggestionDialog} onOpenChange={setShowSuggestionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hacer Sugerencia</DialogTitle>
            <DialogDescription>
              Propón un sospechoso, un arma y una habitación
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Sospechoso</Label>
              <Select value={selectedSuspect} onValueChange={setSelectedSuspect}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un sospechoso" />
                </SelectTrigger>
                <SelectContent>
                  {SUSPECTS.filter(suspect => {
                    // Solo mostrar sospechosos que NO están en la mano del jugador
                    // (excluir cartas propias, no las mostradas por otros)
                    return !myCards.some(card => 
                      card.type === 'SUSPECT' && 
                      card.name === suspect && 
                      card.shownBy === undefined
                    );
                  }).map((suspect) => (
                    <SelectItem key={suspect} value={suspect}>
                      {suspect}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Arma</Label>
              <Select value={selectedWeapon} onValueChange={setSelectedWeapon}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un arma" />
                </SelectTrigger>
                <SelectContent>
                  {WEAPONS.filter(weapon => {
                    // Solo mostrar armas que NO están en la mano del jugador
                    return !myCards.some(card => 
                      card.type === 'WEAPON' && 
                      card.name === weapon && 
                      card.shownBy === undefined
                    );
                  }).map((weapon) => (
                    <SelectItem key={weapon} value={weapon}>
                      {weapon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Habitación</Label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una habitación" />
                </SelectTrigger>
                <SelectContent>
                  {ROOMS.filter(room => {
                    // Solo mostrar habitaciones que NO están en la mano del jugador
                    return !myCards.some(card => 
                      card.type === 'ROOM' && 
                      card.name === room && 
                      card.shownBy === undefined
                    );
                  }).map((room) => (
                    <SelectItem key={room} value={room}>
                      {room}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleMakeSuggestion}
              disabled={!selectedSuspect || !selectedWeapon || !selectedRoom}
              className="w-full"
            >
              Hacer Sugerencia
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de acusación */}
      <Dialog open={showAccusationDialog} onOpenChange={setShowAccusationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Acusación Final
            </DialogTitle>
            <DialogDescription>
              Si aciertas, ganas. Si fallas, quedas eliminado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Sospechoso</Label>
              <Select value={selectedSuspect} onValueChange={setSelectedSuspect}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un sospechoso" />
                </SelectTrigger>
                <SelectContent>
                  {SUSPECTS.filter(suspect => {
                    // Solo mostrar sospechosos que NO están en la mano del jugador
                    // (excluir cartas propias, no las mostradas por otros)
                    return !myCards.some(card => 
                      card.type === 'SUSPECT' && 
                      card.name === suspect && 
                      card.shownBy === undefined
                    );
                  }).map((suspect) => (
                    <SelectItem key={suspect} value={suspect}>
                      {suspect}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Arma</Label>
              <Select value={selectedWeapon} onValueChange={setSelectedWeapon}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un arma" />
                </SelectTrigger>
                <SelectContent>
                  {WEAPONS.filter(weapon => {
                    // Solo mostrar armas que NO están en la mano del jugador
                    return !myCards.some(card => 
                      card.type === 'WEAPON' && 
                      card.name === weapon && 
                      card.shownBy === undefined
                    );
                  }).map((weapon) => (
                    <SelectItem key={weapon} value={weapon}>
                      {weapon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Habitación</Label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una habitación" />
                </SelectTrigger>
                <SelectContent>
                  {ROOMS.filter(room => {
                    // Solo mostrar habitaciones que NO están en la mano del jugador
                    return !myCards.some(card => 
                      card.type === 'ROOM' && 
                      card.name === room && 
                      card.shownBy === undefined
                    );
                  }).map((room) => (
                    <SelectItem key={room} value={room}>
                      {room}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleMakeAccusation}
              disabled={!selectedSuspect || !selectedWeapon || !selectedRoom}
              variant="destructive"
              className="w-full"
            >
              Hacer Acusación
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de refutación */}
      <Dialog open={!!refutingSuggestion} onOpenChange={() => setRefutingSuggestion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refutar Sugerencia</DialogTitle>
            <DialogDescription>
              Tienes una carta que puede refutar esta sugerencia
            </DialogDescription>
          </DialogHeader>
          {refutingSuggestion && (
            <div className="space-y-4">
              <p className="text-sm">
                <strong>{refutingSuggestion.playerName}</strong> sugirió:{" "}
                {refutingSuggestion.suspect} con {refutingSuggestion.weapon} en{" "}
                {refutingSuggestion.room}
              </p>
              {cardToShow && (
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="font-bold">Mostrarás esta carta:</p>
                  <p className="text-lg">{cardToShow.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Solo {refutingSuggestion.playerName} la verá
                  </p>
                </div>
              )}
              <Button onClick={handleConfirmRefutation} className="w-full">
                Confirmar Refutación
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Reto */}
      {challengePlayerId && (
        <ChallengeModal
          isOpen={showChallenge}
          playerName={players.find(p => p.id === challengePlayerId)?.name || "Jugador"}
          playerId={challengePlayerId}
          challengeType={challengeType}
          allPlayers={players.map(p => ({ id: p.id, name: p.name }))}
          onComplete={handleChallengeComplete}
        />
      )}
    </div>
  );
};

export default TraditionalCluedoGame;

