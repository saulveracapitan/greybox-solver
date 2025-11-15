-- Migración para el nuevo juego tipo Cluedo Escape Room
-- Eliminar tablas antiguas si existen (opcional, comentado para no romper datos existentes)
-- DROP TABLE IF EXISTS phase_states CASCADE;
-- DROP TABLE IF EXISTS player_clues CASCADE;
-- DROP TABLE IF EXISTS shared_log_entries CASCADE;
-- DROP TABLE IF EXISTS hints CASCADE;
-- DROP TABLE IF EXISTS players CASCADE;
-- DROP TABLE IF EXISTS game_sessions CASCADE;

-- Crear tipos ENUM
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'game_status_cluedo') THEN
    CREATE TYPE game_status_cluedo AS ENUM ('LOBBY', 'RUNNING', 'WIN', 'LOSE');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'puzzle_type') THEN
    CREATE TYPE puzzle_type AS ENUM ('CODE', 'MULTIPLE_CHOICE', 'ORDER', 'TEXT_INPUT');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'clue_affects_type') THEN
    CREATE TYPE clue_affects_type AS ENUM ('SUSPECT', 'WEAPON', 'ROOM', 'NONE');
  END IF;
END $$;

-- Tabla de sospechosos (datos maestros)
CREATE TABLE IF NOT EXISTS suspects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de armas (datos maestros)
CREATE TABLE IF NOT EXISTS weapons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de salas (datos maestros)
CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de partidas
CREATE TABLE IF NOT EXISTS cluedo_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) NOT NULL UNIQUE,
  status game_status_cluedo DEFAULT 'LOBBY',
  solution_suspect_id INTEGER REFERENCES suspects(id),
  solution_weapon_id INTEGER REFERENCES weapons(id),
  solution_room_id INTEGER REFERENCES rooms(id),
  max_players INTEGER DEFAULT 11 CHECK (max_players >= 2 AND max_players <= 11),
  time_limit_seconds INTEGER DEFAULT 3600, -- 60 minutos por defecto
  error_penalty_seconds INTEGER DEFAULT 300, -- 5 minutos de penalización
  error_ends_game BOOLEAN DEFAULT FALSE, -- Si true, un error termina la partida
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de jugadores
CREATE TABLE IF NOT EXISTS cluedo_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES cluedo_games(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  is_host BOOLEAN DEFAULT FALSE,
  connected BOOLEAN DEFAULT TRUE,
  turn_order INTEGER, -- Orden de turno en el juego
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(game_id, name)
);

-- Tabla de puzzles
CREATE TABLE IF NOT EXISTS puzzles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES cluedo_games(id) ON DELETE CASCADE,
  room_id INTEGER REFERENCES rooms(id),
  type puzzle_type NOT NULL,
  title VARCHAR(200) NOT NULL,
  question TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb, -- Para almacenar opciones, solución, etc.
  solution TEXT NOT NULL,
  solved BOOLEAN DEFAULT FALSE,
  solved_at TIMESTAMP,
  solved_by UUID REFERENCES cluedo_players(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de pistas
CREATE TABLE IF NOT EXISTS clues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES cluedo_games(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  affects_type clue_affects_type DEFAULT 'NONE',
  affects_id INTEGER, -- ID del sospechoso/arma/sala afectado
  is_private BOOLEAN DEFAULT FALSE,
  player_id UUID REFERENCES cluedo_players(id), -- Solo si es privada
  puzzle_id UUID REFERENCES puzzles(id), -- Pista liberada por resolver un puzzle
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de acusaciones
CREATE TABLE IF NOT EXISTS accusations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES cluedo_games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES cluedo_players(id),
  suspect_id INTEGER NOT NULL REFERENCES suspects(id),
  weapon_id INTEGER NOT NULL REFERENCES weapons(id),
  room_id INTEGER NOT NULL REFERENCES rooms(id),
  is_correct BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_cluedo_games_code ON cluedo_games(code);
CREATE INDEX IF NOT EXISTS idx_cluedo_games_status ON cluedo_games(status);
CREATE INDEX IF NOT EXISTS idx_cluedo_players_game_id ON cluedo_players(game_id);
CREATE INDEX IF NOT EXISTS idx_puzzles_game_id ON puzzles(game_id);
CREATE INDEX IF NOT EXISTS idx_puzzles_room_id ON puzzles(room_id);
CREATE INDEX IF NOT EXISTS idx_puzzles_solved ON puzzles(solved);
CREATE INDEX IF NOT EXISTS idx_clues_game_id ON clues(game_id);
CREATE INDEX IF NOT EXISTS idx_clues_player_id ON clues(player_id);
CREATE INDEX IF NOT EXISTS idx_clues_is_private ON clues(is_private);
CREATE INDEX IF NOT EXISTS idx_accusations_game_id ON accusations(game_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_cluedo_games_updated_at ON cluedo_games;
CREATE TRIGGER update_cluedo_games_updated_at
  BEFORE UPDATE ON cluedo_games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Realtime para las tablas principales (con manejo de errores)
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
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- RLS Policies (permitir todo por ahora, ajustar según necesidades)
ALTER TABLE cluedo_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE cluedo_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clues ENABLE ROW LEVEL SECURITY;
ALTER TABLE accusations ENABLE ROW LEVEL SECURITY;
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

DROP POLICY IF EXISTS "Allow all on suspects" ON suspects;
CREATE POLICY "Allow all on suspects" ON suspects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on weapons" ON weapons;
CREATE POLICY "Allow all on weapons" ON weapons FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on rooms" ON rooms;
CREATE POLICY "Allow all on rooms" ON rooms FOR ALL USING (true) WITH CHECK (true);

