# Configuración de Supabase

## Credenciales de tu instancia

- **URL**: https://jdlgpuxwqhdcxteyjyuc.supabase.co
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbGdwdXh3cWhkY3h0ZXlqeXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTQ0NDMsImV4cCI6MjA3ODY5MDQ0M30.cVDNzXcb7IpPIT787vCH2h0WNcJxyvUMYtzUTHh_fZE

## Pasos para configurar la base de datos

### 1. Ejecutar el script SQL

1. Ve a tu dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor** en el menú lateral
4. Haz clic en **New Query**
5. Copia y pega el contenido completo del archivo `supabase/setup_complete.sql`
6. Haz clic en **Run** o presiona `Ctrl+Enter` (o `Cmd+Enter` en Mac)

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto con:

```env
VITE_SUPABASE_URL=https://jdlgpuxwqhdcxteyjyuc.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbGdwdXh3cWhkY3h0ZXlqeXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTQ0NDMsImV4cCI6MjA3ODY5MDQ0M30.cVDNzXcb7IpPIT787vCH2h0WNcJxyvUMYtzUTHh_fZE
```

### 3. Verificar que las tablas se crearon correctamente

Después de ejecutar el script, verifica en el **Table Editor** de Supabase que se hayan creado las siguientes tablas:

- ✅ `game_sessions`
- ✅ `players`
- ✅ `phase_states`
- ✅ `player_clues`
- ✅ `shared_log_entries`
- ✅ `hints`

### 4. Verificar Realtime

1. Ve a **Database** > **Replication** en el dashboard
2. Verifica que las siguientes tablas estén habilitadas para Realtime:
   - `game_sessions`
   - `players`
   - `phase_states`
   - `shared_log_entries`
   - `hints`

Si alguna no está habilitada, puedes habilitarla manualmente desde ahí.

## Notas importantes

- El script usa `IF NOT EXISTS` y `IF EXISTS` para evitar errores si ejecutas el script múltiples veces
- Las políticas RLS permiten acceso público (sin autenticación) para facilitar el juego
- El campo `data` en `game_sessions` almacena información del caso aleatorio asignado
- El campo `lockbox_code` tiene un valor por defecto de '00000' (5 dígitos)

## Solución de problemas

Si encuentras errores al ejecutar el script:

1. **Error de tipos ENUM**: Los tipos ya existen, es normal. El script usa `IF NOT EXISTS` para evitarlo.

2. **Error de publicación realtime**: Si algunas tablas ya están en la publicación, el script las ignora automáticamente.

3. **Error de políticas**: El script elimina y recrea las políticas, así que no debería haber conflictos.

4. **Verificar permisos**: Asegúrate de tener permisos de administrador en tu proyecto de Supabase.

