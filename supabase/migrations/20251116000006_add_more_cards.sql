-- Script para añadir más personajes, armas y habitaciones
-- Ejecutar este script para expandir el juego con más opciones

-- Añadir nuevos sospechosos
INSERT INTO suspects (name, description) VALUES
  ('Señor Gray', 'Un hombre de negocios misterioso'),
  ('Señora Violet', 'Una viuda rica con secretos'),
  ('Inspector Blue', 'Un detective retirado'),
  ('Señorita Gold', 'Una heredera joven'),
  ('Duque Silver', 'Un noble con un pasado oscuro'),
  ('Condesa Crimson', 'Una aristócrata intrigante')
ON CONFLICT (name) DO NOTHING;

-- Añadir nuevas armas
INSERT INTO weapons (name, description) VALUES
  ('Bate de béisbol', 'Un bate de béisbol pesado'),
  ('Destornillador', 'Una herramienta afilada'),
  ('Cuchillo de cocina', 'Un cuchillo grande de cocina'),
  ('Lazo', 'Una cuerda con nudo corredizo'),
  ('Pistola', 'Una pistola automática'),
  ('Mazo', 'Un mazo de guerra')
ON CONFLICT (name) DO NOTHING;

-- Añadir nuevas habitaciones
INSERT INTO rooms (name, description) VALUES
  ('Despacho', 'Un despacho privado con escritorio'),
  ('Jardín', 'Un jardín trasero con plantas exóticas'),
  ('Sótano', 'Un sótano oscuro y húmedo'),
  ('Ático', 'Un ático polvoriento con recuerdos'),
  ('Vestíbulo', 'El vestíbulo principal de entrada'),
  ('Terraza', 'Una terraza con vista al jardín')
ON CONFLICT (name) DO NOTHING;

