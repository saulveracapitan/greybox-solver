import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CreateGame from "./pages/CreateGame";
import JoinGame from "./pages/JoinGame";
import Lobby from "./pages/Lobby";
import GamePlay from "./pages/GamePlay";
import Victory from "./pages/Victory";
import CreateCluedoGame from "./pages/CreateCluedoGame";
import JoinCluedoGame from "./pages/JoinCluedoGame";
import CluedoLobby from "./pages/CluedoLobby";
import CluedoGameRoom from "./pages/CluedoGameRoom";
import CluedoResult from "./pages/CluedoResult";
import CreateTraditionalCluedo from "./pages/CreateTraditionalCluedo";
import JoinTraditionalCluedo from "./pages/JoinTraditionalCluedo";
import TraditionalCluedoLobby from "./pages/TraditionalCluedoLobby";
import TraditionalCluedoGame from "./pages/TraditionalCluedoGame";
import TraditionalCluedoResult from "./pages/TraditionalCluedoResult";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* Rutas del juego antiguo (mantener por compatibilidad) */}
          <Route path="/create" element={<CreateGame />} />
          <Route path="/join" element={<JoinGame />} />
          <Route path="/lobby/:gameId" element={<Lobby />} />
          <Route path="/game/:gameId" element={<GamePlay />} />
          <Route path="/game/:gameId/victory" element={<Victory />} />
          {/* Rutas del juego Cluedo Escape Room (antiguo) */}
          <Route path="/cluedo/create" element={<CreateCluedoGame />} />
          <Route path="/cluedo/join" element={<JoinCluedoGame />} />
          <Route path="/cluedo/lobby/:gameId" element={<CluedoLobby />} />
          <Route path="/cluedo/game/:gameId" element={<CluedoGameRoom />} />
          <Route path="/cluedo/result/:gameId" element={<CluedoResult />} />
          {/* Rutas del juego Cluedo Tradicional (nuevo) */}
          <Route path="/cluedo-traditional/create" element={<CreateTraditionalCluedo />} />
          <Route path="/cluedo-traditional/join" element={<JoinTraditionalCluedo />} />
          <Route path="/cluedo-traditional/lobby/:gameId" element={<TraditionalCluedoLobby />} />
          <Route path="/cluedo-traditional/game/:gameId" element={<TraditionalCluedoGame />} />
          <Route path="/cluedo-traditional/result/:gameId" element={<TraditionalCluedoResult />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
