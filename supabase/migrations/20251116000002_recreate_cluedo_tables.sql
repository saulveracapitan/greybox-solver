-- Script para borrar y recrear todas las tablas de Cluedo con soporte para 12 jugadores
-- Ejecutar este script completo en el SQL Editor de Supabase

-- ============================================
-- PASO 1: BORRAR TODAS LAS TABLAS EXISTENTES
-- ============================================

-- Deshabilitar Realtime primero
DROP PUBLICATION IF EXISTS supabase_realtime CASCADE;

-- Borrar tablas en orden (respetando foreign keys)
DROP TABLE IF EXISTS accusations CASCADE;
DROP TABLE IF EXISTS clues CASCADE;
DROP TABLE IF EXISTS puzzles CASCADE;
DROP TABLE IF EXISTS cluedo_players CASCADE;
DROP TABLE IF EXISTS cluedo_games CASCADE;
DROP TABLE IF EXISTS suspects CASCADE;
DROP TABLE IF EXISTS weapons CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;

-- Borrar tipos ENUM si existen
DROP TYPE IF EXISTS game_status_cluedo CASCADE;
DROP TYPE IF EXISTS puzzle_type CASCADE;
DROP TYPE IF EXISTS clue_affects_type CASCADE;

-- ============================================
-- PASO 2: CREAR TIPOS ENUM
-- ============================================

CREATE TYPE game_status_cluedo AS ENUM ('LOBBY', 'RUNNING', 'WIN', 'LOSE', 'FINISHED');
CREATE TYPE puzzle_type AS ENUM ('CODE', 'MULTIPLE_CHOICE', 'ORDER', 'TEXT_INPUT');
CREATE TYPE clue_affects_type AS ENUM ('SUSPECT', 'WEAPON', 'ROOM', 'NONE');

-- ============================================
-- PASO 3: CREAR TABLAS MAESTRAS
-- ============================================

-- Tabla de sospechosos (9 para soportar 12 jugadores)
CREATE TABLE suspects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de armas (9 para soportar 12 jugadores)
CREATE TABLE weapons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de habitaciones (9)
CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PASO 4: CREAR TABLA DE PARTIDAS
-- ============================================

CREATE TABLE cluedo_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) NOT NULL UNIQUE,
  status game_status_cluedo DEFAULT 'LOBBY',
  solution_suspect_id INTEGER REFERENCES suspects(id),
  solution_weapon_id INTEGER REFERENCES weapons(id),
  solution_room_id INTEGER REFERENCES rooms(id),
  max_players INTEGER DEFAULT 12 CHECK (max_players >= 2 AND max_players <= 12),
  time_limit_seconds INTEGER DEFAULT 0,
  error_ends_game BOOLEAN DEFAULT FALSE,
  current_turn_player_id UUID, -- Jugador con el turno actual (referencia añadida después)
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PASO 5: CREAR TABLA DE JUGADORES (CON turn_order)
-- ============================================

CREATE TABLE cluedo_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES cluedo_games(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  is_host BOOLEAN DEFAULT FALSE,
  connected BOOLEAN DEFAULT TRUE,
  turn_order INTEGER, -- Orden de turno en el juego
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(game_id, name)
);

-- Añadir referencia de current_turn_player_id después de crear cluedo_players
ALTER TABLE cluedo_games 
ADD CONSTRAINT fk_current_turn_player 
FOREIGN KEY (current_turn_player_id) 
REFERENCES cluedo_players(id) 
ON DELETE SET NULL;

-- ============================================
-- PASO 6: CREAR TABLA DE PUZZLES
-- ============================================

CREATE TABLE puzzles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES cluedo_games(id) ON DELETE CASCADE,
  room_id INTEGER REFERENCES rooms(id),
  type puzzle_type NOT NULL,
  title VARCHAR(200),
  question TEXT,
  data JSONB,
  solution TEXT,
  solved BOOLEAN DEFAULT FALSE,
  solved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PASO 6.5: CREAR TABLA DE REFUTACIONES
-- ============================================

CREATE TABLE refutations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES cluedo_games(id) ON DELETE CASCADE,
  suggestion_id UUID NOT NULL REFERENCES accusations(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES cluedo_players(id) ON DELETE CASCADE,
  can_refute BOOLEAN, -- true = puede refutar, false = no puede, null = aún no ha respondido
  card_shown_id UUID, -- ID de la carta mostrada (si refutó)
  turn_order INTEGER NOT NULL, -- Orden en el que debe responder
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PASO 7: CREAR TABLA DE PISTAS
-- ============================================

CREATE TABLE clues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES cluedo_games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES cluedo_players(id) ON DELETE CASCADE,
  puzzle_id UUID REFERENCES puzzles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  affects_type clue_affects_type,
  affects_id INTEGER,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PASO 8: CREAR TABLA DE ACUSACIONES
-- ============================================

CREATE TABLE accusations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES cluedo_games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES cluedo_players(id) ON DELETE CASCADE,
  suspect_id INTEGER NOT NULL REFERENCES suspects(id),
  weapon_id INTEGER NOT NULL REFERENCES weapons(id),
  room_id INTEGER NOT NULL REFERENCES rooms(id),
  is_correct BOOLEAN, -- null = sugerencia, true/false = acusación
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PASO 9: CREAR ÍNDICES
-- ============================================

CREATE INDEX idx_cluedo_games_code ON cluedo_games(code);
CREATE INDEX idx_cluedo_games_status ON cluedo_games(status);
CREATE INDEX idx_cluedo_players_game_id ON cluedo_players(game_id);
CREATE INDEX idx_cluedo_players_turn_order ON cluedo_players(game_id, turn_order);
CREATE INDEX idx_clues_game_id ON clues(game_id);
CREATE INDEX idx_clues_player_id ON clues(player_id);
CREATE INDEX idx_puzzles_game_id ON puzzles(game_id);
CREATE INDEX idx_accusations_game_id ON accusations(game_id);
CREATE INDEX idx_accusations_player_id ON accusations(player_id);
CREATE INDEX idx_refutations_game_id ON refutations(game_id);
CREATE INDEX idx_refutations_suggestion_id ON refutations(suggestion_id);
CREATE INDEX idx_refutations_player_id ON refutations(player_id);
CREATE INDEX idx_refutations_turn_order ON refutations(suggestion_id, turn_order);

-- ============================================
-- PASO 10: CREAR TRIGGER PARA updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cluedo_games_updated_at
  BEFORE UPDATE ON cluedo_games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PASO 11: HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE cluedo_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE cluedo_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clues ENABLE ROW LEVEL SECURITY;
ALTER TABLE accusations ENABLE ROW LEVEL SECURITY;
ALTER TABLE refutations ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspects ENABLE ROW LEVEL SECURITY;
ALTER TABLE weapons ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Políticas básicas: permitir lectura y escritura a todos (ajustar según seguridad)
DROP POLICY IF EXISTS "Allow all on cluedo_games" ON cluedo_games;
CREATE POLICY "Allow all on cluedo_games" ON cluedo_games FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on cluedo_players" ON cluedo_players;
CREATE POLICY "Allow all on cluedo_players" ON cluedo_players FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on puzzles" ON puzzles;
CREATE POLICY "Allow all on puzzles" ON puzzles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on clues" ON clues;
CREATE POLICY "Allow all on clues" ON clues FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on accusations" ON accusations;
CREATE POLICY "Allow all on accusations" ON accusations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on refutations" ON refutations;
CREATE POLICY "Allow all on refutations" ON refutations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on suspects" ON suspects;
CREATE POLICY "Allow all on suspects" ON suspects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on weapons" ON weapons;
CREATE POLICY "Allow all on weapons" ON weapons FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on rooms" ON rooms;
CREATE POLICY "Allow all on rooms" ON rooms FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- PASO 12: HABILITAR REALTIME
-- ============================================

-- Crear publicación Realtime si no existe (con manejo de errores)
DO $$ 
BEGIN
  -- Intentar crear la publicación si no existe
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Si ya existe, ignorar el error
  NULL;
END $$;

-- Añadir tablas a Realtime (con manejo de errores)
DO $$ 
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE cluedo_games;
  EXCEPTION WHEN OTHERS THEN
    -- La tabla ya está en la publicación, ignorar
    NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE cluedo_players;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE puzzles;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE clues;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE accusations;
ALTER PUBLICATION supabase_realtime ADD TABLE refutations;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

