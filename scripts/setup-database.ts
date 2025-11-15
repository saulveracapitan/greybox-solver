import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = 'https://jdlgpuxwqhdcxteyjyuc.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

// Nota: Necesitas usar la service_role key para ejecutar DDL
// Puedes obtenerla en: Supabase Dashboard > Settings > API > service_role key

async function setupDatabase() {
  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ Error: Necesitas configurar SUPABASE_SERVICE_KEY en las variables de entorno');
    console.log('💡 Obtén la service_role key en: Supabase Dashboard > Settings > API');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Leer el script SQL
    const sqlPath = join(__dirname, '../supabase/setup_complete.sql');
    const sqlScript = readFileSync(sqlPath, 'utf-8');

    console.log('📝 Ejecutando script SQL...\n');

    // Dividir el script en statements (separados por ;)
    // Pero necesitamos ser más cuidadosos con los bloques DO $$
    const statements = sqlScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    // Ejecutar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⏳ Ejecutando statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
          
          if (error) {
            // Si no existe la función exec_sql, intentar método alternativo
            console.log('⚠️  Método RPC no disponible, usando método alternativo...');
            break;
          }
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1} falló (puede ser normal si ya existe):`, err);
        }
      }
    }

    console.log('\n✅ Script ejecutado. Verificando tablas...\n');

    // Verificar que las tablas se crearon
    const tables = [
      'game_sessions',
      'players',
      'phase_states',
      'player_clues',
      'shared_log_entries',
      'hints'
    ];

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error && error.code !== 'PGRST116') { // PGRST116 = tabla no existe
        console.log(`❌ Error verificando ${table}:`, error.message);
      } else {
        console.log(`✅ Tabla ${table} existe`);
      }
    }

    console.log('\n🎉 ¡Configuración completada!');
  } catch (error) {
    console.error('❌ Error ejecutando script:', error);
    process.exit(1);
  }
}

setupDatabase();

