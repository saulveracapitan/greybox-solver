-- ============================================
-- SCRIPT COMPLETO DE CONFIGURACIÓN DE BASE DE DATOS
-- Para ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Crear los ENUMs necesarios (con verificación de existencia)
DO $$
BEGIN
  -- Crear game_status si no existe
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'game_status') THEN
    CREATE TYPE game_status AS ENUM ('LOBBY', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
  END IF;
  
  -- Crear phase_status si no existe
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'phase_status') THEN
    CREATE TYPE phase_status AS ENUM ('LOCKED', 'ACTIVE', 'COMPLETED');
  END IF;
  
  -- Crear player_role si no existe
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'player_role') THEN
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
  END IF;
END $$;

-- 2. Crear tabla de sesiones de juego
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  status game_status NOT NULL DEFAULT 'LOBBY',
  current_phase INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  lockbox_code TEXT DEFAULT '00000',
  data JSONB DEFAULT '{}'::jsonb
);

-- 3. Crear tabla de jugadores
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role player_role,
  is_host BOOLEAN DEFAULT false,
  connected BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Crear tabla de estado de fases
CREATE TABLE IF NOT EXISTS phase_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL,
  status phase_status NOT NULL DEFAULT 'LOCKED',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  data JSONB DEFAULT '{}'::jsonb,
  UNIQUE(game_session_id, phase_number)
);

-- 5. Crear tabla de pistas asignadas a jugadores
CREATE TABLE IF NOT EXISTS player_clues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL,
  clue_key TEXT NOT NULL,
  clue_content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Crear tabla de entradas del muro compartido de hallazgos
CREATE TABLE IF NOT EXISTS shared_log_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Crear tabla de pistas del sistema
CREATE TABLE IF NOT EXISTS hints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL,
  hint_content TEXT NOT NULL,
  shown_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_players_game_session ON players(game_session_id);
CREATE INDEX IF NOT EXISTS idx_phase_states_game_session ON phase_states(game_session_id);
CREATE INDEX IF NOT EXISTS idx_shared_log_game_session ON shared_log_entries(game_session_id);
CREATE INDEX IF NOT EXISTS idx_shared_log_created ON shared_log_entries(created_at DESC);

-- 9. Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Crear trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_game_sessions_updated_at ON game_sessions;
CREATE TRIGGER update_game_sessions_updated_at
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 11. Habilitar realtime para todas las tablas necesarias
-- Nota: Esto puede fallar si las tablas ya están en la publicación, es normal
DO $$
BEGIN
  -- Intentar añadir tablas a la publicación de realtime
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE players;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE phase_states;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE shared_log_entries;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE hints;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- 12. Habilitar Row Level Security (RLS)
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_clues ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE hints ENABLE ROW LEVEL SECURITY;

-- 13. Crear políticas públicas (permitir acceso sin autenticación)
-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Allow all access to game_sessions" ON game_sessions;
DROP POLICY IF EXISTS "Allow all access to players" ON players;
DROP POLICY IF EXISTS "Allow all access to phase_states" ON phase_states;
DROP POLICY IF EXISTS "Allow all access to player_clues" ON player_clues;
DROP POLICY IF EXISTS "Allow all access to shared_log_entries" ON shared_log_entries;
DROP POLICY IF EXISTS "Allow all access to hints" ON hints;

-- Crear nuevas políticas
CREATE POLICY "Allow all access to game_sessions" ON game_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to players" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to phase_states" ON phase_states FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to player_clues" ON player_clues FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to shared_log_entries" ON shared_log_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to hints" ON hints FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

