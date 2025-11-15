# 🚀 Migraciones SQL Listas para Ejecutar

## ⚠️ IMPORTANTE
Supabase no permite ejecutar SQL arbitrario vía API por seguridad. Debes ejecutar estas migraciones **manualmente** en el SQL Editor.

## 📋 Pasos para Ejecutar

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor** en el menú lateral
4. Haz clic en **New Query**

### Migración 1: Esquema de Tablas

5. Abre el archivo: `supabase/migrations/20251116000000_cluedo_game_schema.sql`
6. **Copia TODO el contenido** del archivo
7. Pégalo en el SQL Editor
8. Haz clic en **Run** (o presiona `Ctrl+Enter` / `Cmd+Enter`)

### Migración 2: Datos Iniciales

9. Abre el archivo: `supabase/migrations/20251116000001_cluedo_seed_data.sql`
10. **Copia TODO el contenido** del archivo
11. Pégalo en el SQL Editor
12. Haz clic en **Run**

## ✅ Verificación

Después de ejecutar las migraciones, verifica que funcionó:

```bash
node scripts/check-cluedo-tables.js
```

Deberías ver todas las tablas como ✅ OK.

## 📝 Notas

- Si ves errores sobre "ya existe", es normal. El script usa `IF NOT EXISTS` para evitar duplicados.
- Si ves errores sobre "publicación realtime", también es normal. El script maneja estos errores automáticamente.
- Las políticas RLS permiten acceso público para facilitar el juego.

## 🔍 Archivos SQL

Los archivos SQL están en:
- `supabase/migrations/20251116000000_cluedo_game_schema.sql`
- `supabase/migrations/20251116000001_cluedo_seed_data.sql`

