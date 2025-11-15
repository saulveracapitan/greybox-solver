# Instrucciones para Recrear las Tablas de Cluedo

## ⚠️ IMPORTANTE: Este script borrará todas las tablas existentes

Este proceso eliminará todas las tablas de Cluedo y las recreará desde cero con:
- Soporte para hasta **12 jugadores**
- **9 sospechosos** (en lugar de 6)
- **9 armas** (en lugar de 6)
- **9 habitaciones** (igual que antes)
- Columna `turn_order` en `cluedo_players`

## 📋 Pasos a Seguir

### Paso 1: Abrir el SQL Editor de Supabase

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor** en el menú lateral

### Paso 2: Ejecutar el Script de Recreación

1. Abre el archivo: `supabase/migrations/20251116000002_recreate_cluedo_tables.sql`
2. Copia **TODO** el contenido del archivo
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **RUN** o presiona `Ctrl+Enter` (o `Cmd+Enter` en Mac)

### Paso 3: Ejecutar el Script de Datos Iniciales

1. Abre el archivo: `supabase/migrations/20251116000003_cluedo_seed_data_12_players.sql`
2. Copia **TODO** el contenido del archivo
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **RUN** o presiona `Ctrl+Enter` (o `Cmd+Enter` en Mac)

### Paso 4 (Opcional): Si ya tienes las tablas creadas

Si ya ejecutaste las migraciones anteriores y solo necesitas añadir el campo `current_turn_player_id`:

1. Abre el archivo: `supabase/migrations/20251116000004_add_current_turn_player.sql`
2. Copia **TODO** el contenido del archivo
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **RUN** o presiona `Ctrl+Enter` (o `Cmd+Enter` en Mac)

## ✅ Verificación

Después de ejecutar ambos scripts, deberías ver:

- ✅ 9 sospechosos en la tabla `suspects`
- ✅ 9 armas en la tabla `weapons`
- ✅ 9 habitaciones en la tabla `rooms`
- ✅ La tabla `cluedo_players` tiene la columna `turn_order`
- ✅ Todas las tablas tienen RLS habilitado
- ✅ Realtime está habilitado para las tablas principales

## 🔍 Verificar en Supabase

Puedes verificar que todo está correcto:

1. Ve a **Table Editor** en Supabase
2. Verifica que existen las tablas:
   - `suspects` (debe tener 9 filas)
   - `weapons` (debe tener 9 filas)
   - `rooms` (debe tener 9 filas)
   - `cluedo_games`
   - `cluedo_players` (verifica que tiene la columna `turn_order`)
   - `puzzles`
   - `clues`
   - `accusations`

## 📊 Nuevos Personajes y Armas

### Nuevos Sospechosos:
- Doctor Black
- Señorita Rose
- Capitán Brown

### Nuevas Armas:
- Veneno
- Hacha
- Martillo

## 🎮 Configuración del Juego

Con esta configuración:
- **Total de cartas**: 27 (9 sospechosos + 9 armas + 9 habitaciones)
- **Cartas en solución**: 3 (1 sospechoso + 1 arma + 1 habitación)
- **Cartas para repartir**: 24
- **Cartas por jugador** (con 12 jugadores): 2 cartas exactas por jugador

## ⚠️ Nota

Si tienes partidas en curso, estas se perderán al ejecutar este script. Asegúrate de que no haya partidas activas importantes antes de ejecutarlo.

