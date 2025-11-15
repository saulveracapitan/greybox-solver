# 🚀 Instrucciones para Ejecutar las Migraciones

## ⚠️ IMPORTANTE: Orden de Ejecución

**DEBES ejecutar las migraciones en este orden:**

1. **PRIMERO**: Esquema de tablas (crea las tablas)
2. **SEGUNDO**: Datos iniciales (inserta datos en las tablas)

## 📋 Paso a Paso

### Paso 1: Ejecutar el Esquema de Tablas

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor** en el menú lateral
4. Haz clic en **New Query**
5. Abre el archivo: `supabase/migrations/20251116000000_cluedo_game_schema.sql`
6. **Copia TODO el contenido** del archivo (desde la línea 1 hasta el final)
7. Pégalo en el SQL Editor de Supabase
8. Haz clic en **Run** (o presiona `Ctrl+Enter` / `Cmd+Enter`)
9. **Espera a que termine completamente** - deberías ver "Success" o un mensaje de éxito

### Paso 2: Ejecutar los Datos Iniciales

10. En el mismo SQL Editor, haz clic en **New Query** (o limpia el editor)
11. Abre el archivo: `supabase/migrations/20251116000001_cluedo_seed_data.sql`
12. **Copia TODO el contenido** del archivo
13. Pégalo en el SQL Editor
14. Haz clic en **Run**
15. Deberías ver "Success" o mensajes de inserción

## ✅ Verificación

Después de ejecutar ambas migraciones, verifica que funcionó:

```bash
node scripts/check-cluedo-tables.js
```

Deberías ver:
- ✅ suspects: OK
- ✅ weapons: OK
- ✅ rooms: OK
- ✅ cluedo_games: OK
- ✅ cluedo_players: OK
- ✅ puzzles: OK
- ✅ clues: OK
- ✅ accusations: OK

Y también deberías ver que hay datos:
- ✅ suspects: 6 registros
- ✅ weapons: 6 registros
- ✅ rooms: 9 registros

## ❌ Si Obtienes Errores

### Error: "relation 'suspects' does not exist"
- **Causa**: Ejecutaste la migración 2 antes de la migración 1
- **Solución**: Ejecuta primero `20251116000000_cluedo_game_schema.sql` y luego `20251116000001_cluedo_seed_data.sql`

### Error: "type already exists"
- **Causa**: Ya ejecutaste parte de la migración antes
- **Solución**: Es normal, el script usa `IF NOT EXISTS` para evitar duplicados. Continúa.

### Error: "table already exists"
- **Causa**: Ya ejecutaste la migración antes
- **Solución**: Es normal, el script usa `CREATE TABLE IF NOT EXISTS`. Continúa con la migración 2.

## 📝 Notas

- Las migraciones están diseñadas para ser **idempotentes** (puedes ejecutarlas varias veces sin problemas)
- Si ves errores sobre "ya existe", es normal y seguro ignorarlos
- Asegúrate de ejecutar el **esquema completo** antes de los datos

