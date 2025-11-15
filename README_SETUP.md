# Configuración de Base de Datos - Supabase

## ¿Qué necesito para que ejecutes el SQL automáticamente?

Para que pueda ejecutar el SQL directamente en tu instancia de Supabase, necesitas darme:

### 🔑 La SERVICE_ROLE KEY

**NO la anon key** (esa ya la tienes), sino la **service_role key** que tiene permisos completos.

### Cómo obtenerla:

1. Ve a tu dashboard de Supabase:
   ```
   https://supabase.com/dashboard/project/jdlgpuxwqhdcxteyjyuc/settings/api
   ```

2. Busca la sección **"Project API keys"**

3. Encuentra la key llamada **"service_role"** (está más abajo que la anon key)

4. **⚠️ IMPORTANTE**: Esta key tiene permisos completos. No la compartas públicamente.

5. Una vez que la tengas, ejecuta:
   ```bash
   export SUPABASE_SERVICE_KEY="tu_service_role_key_aqui"
   node scripts/execute-sql-automated.js
   ```

### Alternativa: Ejecutar manualmente

Si prefieres no compartir la service_role key (recomendado por seguridad), puedes ejecutar el SQL manualmente:

1. Abre el SQL Editor:
   ```
   https://supabase.com/dashboard/project/jdlgpuxwqhdcxteyjyuc/sql/new
   ```

2. Copia el contenido de `supabase/setup_complete.sql`

3. Pégalo en el editor

4. Haz clic en "Run"

### Verificación

Después de ejecutar, verifica que las tablas se crearon:
- Ve a: https://supabase.com/dashboard/project/jdlgpuxwqhdcxteyjyuc/editor
- Deberías ver: `game_sessions`, `players`, `phase_states`, `player_clues`, `shared_log_entries`, `hints`

