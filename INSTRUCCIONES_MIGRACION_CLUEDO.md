# Instrucciones para Ejecutar las Migraciones de Cluedo

## Paso 1: Ejecutar las Migraciones SQL

1. Ve a tu dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor** en el menú lateral
4. Haz clic en **New Query**

### Migración 1: Esquema de Tablas

5. Abre el archivo `supabase/migrations/20251116000000_cluedo_game_schema.sql`
6. Copia TODO el contenido del archivo
7. Pégalo en el SQL Editor de Supabase
8. Haz clic en **Run** o presiona `Ctrl+Enter` (o `Cmd+Enter` en Mac)

**Nota:** Si ves errores sobre "publicación realtime" o "tabla ya existe", es normal. El script está diseñado para ser idempotente.

### Migración 2: Datos Iniciales

9. Abre el archivo `supabase/migrations/20251116000001_cluedo_seed_data.sql`
10. Copia TODO el contenido del archivo
11. Pégalo en el SQL Editor de Supabase
12. Haz clic en **Run**

## Paso 2: Verificar que las Tablas se Crearon

1. Ve a **Table Editor** en el menú lateral de Supabase
2. Verifica que existan las siguientes tablas:
   - ✅ `suspects`
   - ✅ `weapons`
   - ✅ `rooms`
   - ✅ `cluedo_games`
   - ✅ `cluedo_players`
   - ✅ `puzzles`
   - ✅ `clues`
   - ✅ `accusations`

## Paso 3: Verificar los Datos Maestros

1. En el **Table Editor**, abre la tabla `suspects`
   - Debe tener 6 sospechosos
2. Abre la tabla `weapons`
   - Debe tener 6 armas
3. Abre la tabla `rooms`
   - Debe tener 9 salas

## Paso 4: Verificar Realtime

1. Ve a **Database** > **Replication** en el dashboard
2. Verifica que las siguientes tablas estén habilitadas para Realtime:
   - `cluedo_games`
   - `cluedo_players`
   - `puzzles`
   - `clues`
   - `accusations`

Si alguna no está habilitada, puedes habilitarla manualmente desde ahí.

## Solución de Problemas

### Error: "relation does not exist"
- Asegúrate de haber ejecutado la primera migración (`20251116000000_cluedo_game_schema.sql`) antes de la segunda

### Error: "type already exists"
- Es normal, el script usa `IF NOT EXISTS` para evitar este error

### Error: "table already exists"
- Es normal si ejecutas el script múltiples veces. El script usa `CREATE TABLE IF NOT EXISTS`

### Error: "publication supabase_realtime does not exist"
- Esto puede ocurrir si Realtime no está habilitado. El script ahora maneja este error automáticamente.

## Verificar con Script

Puedes ejecutar el script de verificación:

```bash
node scripts/check-cluedo-tables.js
```

Este script verificará que todas las tablas existan y tengan datos.

