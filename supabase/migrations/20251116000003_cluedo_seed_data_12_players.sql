-- Datos iniciales para Cluedo con soporte para 12 jugadores
-- 15 sospechosos, 15 armas, 15 habitaciones = 45 cartas totales
-- Con 3 cartas en solución = 42 cartas para repartir
-- 42 / 12 = 3.5 cartas por jugador (algunos tendrán 3, otros 4)

-- ============================================
-- INSERTAR SOSPECHOSOS (15)
-- ============================================

INSERT INTO suspects (name, description) VALUES
  ('Profesor Plum', 'Un académico con un pasado oscuro'),
  ('Señorita Scarlet', 'Una actriz de teatro con muchos secretos'),
  ('Coronel Mustard', 'Un militar retirado con conexiones sospechosas'),
  ('Señora White', 'La cocinera con acceso a toda la casa'),
  ('Señor Green', 'Un empresario con negocios turbios'),
  ('Señora Peacock', 'Una socialité con influencias políticas'),
  ('Doctor Black', 'Un médico con un historial cuestionable'),
  ('Señorita Rose', 'Una heredera con secretos familiares'),
  ('Capitán Brown', 'Un marinero con un pasado violento'),
  ('Señor Gray', 'Un hombre de negocios misterioso'),
  ('Señora Violet', 'Una viuda rica con secretos'),
  ('Inspector Blue', 'Un detective retirado'),
  ('Señorita Gold', 'Una heredera joven'),
  ('Duque Silver', 'Un noble con un pasado oscuro'),
  ('Condesa Crimson', 'Una aristócrata intrigante')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- INSERTAR ARMAS (15)
-- ============================================

INSERT INTO weapons (name, description) VALUES
  ('Candelabro', 'Un pesado candelabro de plata'),
  ('Daga', 'Una daga ceremonial antigua'),
  ('Cañón de plomo', 'Un objeto contundente de plomo'),
  ('Revólver', 'Un revólver antiguo'),
  ('Cuerda', 'Una cuerda gruesa'),
  ('Llave inglesa', 'Una herramienta pesada'),
  ('Veneno', 'Un frasco de veneno letal'),
  ('Hacha', 'Un hacha de leñador'),
  ('Martillo', 'Un martillo pesado'),
  ('Bate de béisbol', 'Un bate de béisbol pesado'),
  ('Destornillador', 'Una herramienta afilada'),
  ('Cuchillo de cocina', 'Un cuchillo grande de cocina'),
  ('Lazo', 'Una cuerda con nudo corredizo'),
  ('Pistola', 'Una pistola automática'),
  ('Mazo', 'Un mazo de guerra')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- INSERTAR HABITACIONES (15)
-- ============================================

INSERT INTO rooms (name, description) VALUES
  ('Biblioteca', 'Una biblioteca con estanterías llenas de libros antiguos'),
  ('Cocina', 'Una cocina grande con utensilios de cocina'),
  ('Sala de baile', 'Un salón espacioso con espejos y candelabros'),
  ('Conservatorio', 'Un invernadero con plantas exóticas'),
  ('Comedor', 'Un comedor elegante con una mesa larga'),
  ('Sala de billar', 'Una sala de recreo con mesa de billar'),
  ('Estudio', 'Un estudio privado con escritorio y chimenea'),
  ('Salón', 'El salón principal de la mansión'),
  ('Habitación', 'Una habitación privada con secretos ocultos'),
  ('Despacho', 'Un despacho privado con escritorio'),
  ('Jardín', 'Un jardín trasero con plantas exóticas'),
  ('Sótano', 'Un sótano oscuro y húmedo'),
  ('Ático', 'Un ático polvoriento con recuerdos'),
  ('Vestíbulo', 'El vestíbulo principal de entrada'),
  ('Terraza', 'Una terraza con vista al jardín')
ON CONFLICT (name) DO NOTHING;

