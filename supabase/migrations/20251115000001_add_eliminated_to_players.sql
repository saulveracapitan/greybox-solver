-- Añadir campo eliminated a la tabla players
ALTER TABLE players ADD COLUMN IF NOT EXISTS eliminated BOOLEAN DEFAULT false;
ALTER TABLE players ADD COLUMN IF NOT EXISTS eliminated_at TIMESTAMPTZ;

