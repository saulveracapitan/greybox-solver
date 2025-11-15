-- Datos iniciales para sospechosos, armas y salas

-- Insertar sospechosos
INSERT INTO suspects (name, description) VALUES
  ('Profesor Plum', 'Un académico con un pasado oscuro'),
  ('Señorita Scarlet', 'Una actriz de teatro con muchos secretos'),
  ('Coronel Mustard', 'Un militar retirado con conexiones sospechosas'),
  ('Señora White', 'La cocinera con acceso a toda la casa'),
  ('Señor Green', 'Un empresario con negocios turbios'),
  ('Señora Peacock', 'Una socialité con influencias políticas')
ON CONFLICT (name) DO NOTHING;

-- Insertar armas
INSERT INTO weapons (name, description) VALUES
  ('Candelabro', 'Un pesado candelabro de plata'),
  ('Daga', 'Una daga ceremonial antigua'),
  ('Cañón de plomo', 'Un objeto contundente de plomo'),
  ('Revólver', 'Un revólver antiguo'),
  ('Cuerda', 'Una cuerda gruesa'),
  ('Llave inglesa', 'Una herramienta pesada')
ON CONFLICT (name) DO NOTHING;

-- Insertar salas
INSERT INTO rooms (name, description) VALUES
  ('Biblioteca', 'Una biblioteca con estanterías llenas de libros antiguos'),
  ('Cocina', 'Una cocina grande con utensilios de cocina'),
  ('Sala de baile', 'Un salón espacioso con espejos y candelabros'),
  ('Conservatorio', 'Un invernadero con plantas exóticas'),
  ('Comedor', 'Un comedor elegante con una mesa larga'),
  ('Sala de billar', 'Una sala de recreo con mesa de billar'),
  ('Estudio', 'Un estudio privado con escritorio y chimenea'),
  ('Salón', 'El salón principal de la mansión'),
  ('Habitación', 'Una habitación privada con secretos ocultos')
ON CONFLICT (name) DO NOTHING;

