-- Añadir campo data JSONB a game_sessions para almacenar información del caso asignado
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;

