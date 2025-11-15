-- Script para añadir la tabla de refutaciones
-- Ejecutar este script si ya tienes las tablas creadas y solo necesitas añadir la tabla de refutaciones

-- Crear tabla de refutaciones
CREATE TABLE IF NOT EXISTS refutations (
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

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_refutations_game_id ON refutations(game_id);
CREATE INDEX IF NOT EXISTS idx_refutations_suggestion_id ON refutations(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_refutations_player_id ON refutations(player_id);
CREATE INDEX IF NOT EXISTS idx_refutations_turn_order ON refutations(suggestion_id, turn_order);

-- Habilitar RLS
ALTER TABLE refutations ENABLE ROW LEVEL SECURITY;

-- Política básica: permitir lectura y escritura a todos
DROP POLICY IF EXISTS "Allow all on refutations" ON refutations;
CREATE POLICY "Allow all on refutations" ON refutations FOR ALL USING (true) WITH CHECK (true);

-- Añadir a Realtime
DO $$ 
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE refutations;
  EXCEPTION WHEN OTHERS THEN
    -- La tabla ya está en la publicación, ignorar
    NULL;
  END;
END $$;

