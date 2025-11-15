-- Script para añadir el campo current_turn_player_id a cluedo_games
-- Ejecutar este script si ya tienes las tablas creadas y solo necesitas añadir este campo

-- Añadir columna current_turn_player_id si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cluedo_games' 
    AND column_name = 'current_turn_player_id'
  ) THEN
    ALTER TABLE cluedo_games 
    ADD COLUMN current_turn_player_id UUID REFERENCES cluedo_players(id);
  END IF;
END $$;

