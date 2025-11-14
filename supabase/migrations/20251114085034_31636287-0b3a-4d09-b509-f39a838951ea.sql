-- Enum para el estado de las partidas
CREATE TYPE game_status AS ENUM ('LOBBY', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- Enum para el estado de las fases
CREATE TYPE phase_status AS ENUM ('LOCKED', 'ACTIVE', 'COMPLETED');

-- Enum para los roles de jugadores
CREATE TYPE player_role AS ENUM (
  'ANALISTA_TIEMPOS',
  'EXPERTO_HUELLAS', 
  'ENTREVISTADOR',
  'CARTOGRAFO',
  'PERITO_FORENSE',
  'ARCHIVISTA',
  'COMUNICACIONES',
  'TESTIMONIOS',
  'PERFILADOR',
  'INTERPRETE_MENSAJES'
);

-- Tabla de sesiones de juego
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  status game_status NOT NULL DEFAULT 'LOBBY',
  current_phase INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  lockbox_code TEXT DEFAULT '0000'
);

-- Tabla de jugadores
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role player_role,
  is_host BOOLEAN DEFAULT false,
  connected BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de estado de fases
CREATE TABLE phase_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL,
  status phase_status NOT NULL DEFAULT 'LOCKED',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  data JSONB DEFAULT '{}'::jsonb,
  UNIQUE(game_session_id, phase_number)
);

-- Tabla de pistas asignadas a jugadores
CREATE TABLE player_clues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL,
  clue_key TEXT NOT NULL,
  clue_content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de entradas del muro compartido de hallazgos
CREATE TABLE shared_log_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de pistas del sistema
CREATE TABLE hints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL,
  hint_content TEXT NOT NULL,
  shown_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_players_game_session ON players(game_session_id);
CREATE INDEX idx_phase_states_game_session ON phase_states(game_session_id);
CREATE INDEX idx_shared_log_game_session ON shared_log_entries(game_session_id);
CREATE INDEX idx_shared_log_created ON shared_log_entries(created_at DESC);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_game_sessions_updated_at
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar realtime para todas las tablas necesarias
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE phase_states;
ALTER PUBLICATION supabase_realtime ADD TABLE shared_log_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE hints;

-- RLS Policies (permitir acceso público para este juego)
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_clues ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE hints ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para el juego (no requiere autenticación)
CREATE POLICY "Allow all access to game_sessions" ON game_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to players" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to phase_states" ON phase_states FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to player_clues" ON player_clues FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to shared_log_entries" ON shared_log_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to hints" ON hints FOR ALL USING (true) WITH CHECK (true);