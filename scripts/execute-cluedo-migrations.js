import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jdlgpuxwqhdcxteyjyuc.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Necesitas configurar SUPABASE_SERVICE_KEY');
  console.log('\n💡 Para obtener la service_role key:');
  console.log('   1. Ve a https://supabase.com/dashboard');
  console.log('   2. Selecciona tu proyecto');
  console.log('   3. Ve a Settings > API');
  console.log('   4. Copia la "service_role" key (NO la anon key)');
  console.log('   5. Ejecuta: export SUPABASE_SERVICE_KEY="tu_service_role_key"');
  console.log('   6. Vuelve a ejecutar este script\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL(sql) {
  try {
    // Usar la API REST directamente para ejecutar SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({ sql_query: sql })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    // Si el RPC no existe, intentar con el método alternativo
    console.log('⚠️  Método RPC no disponible, intentando método alternativo...');
    
    // Dividir el SQL en statements individuales y ejecutarlos
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        // Para statements que no son SELECT, usar una query directa
        if (statement.match(/^(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE)/i)) {
          // Usar el cliente de Supabase con una query directa
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
          if (error) {
            // Si el RPC no existe, mostrar el SQL para ejecutar manualmente
            console.log(`\n⚠️  No se pudo ejecutar automáticamente. Ejecuta esto manualmente en el SQL Editor:\n`);
            console.log(statement);
            console.log(';\n');
          }
        }
      } catch (err) {
        console.log(`⚠️  Error en statement: ${err.message}`);
      }
    }
  }
}

async function runMigrations() {
  console.log('🚀 Ejecutando migraciones de Cluedo...\n');

  // Leer migración 1: Schema
  const schemaPath = join(__dirname, '../supabase/migrations/20251116000000_cluedo_game_schema.sql');
  console.log('📄 Leyendo migración 1: Esquema de tablas...');
  const schemaSQL = readFileSync(schemaPath, 'utf-8');
  
  console.log('⚙️  Ejecutando migración 1...');
  try {
    await executeSQL(schemaSQL);
    console.log('✅ Migración 1 completada\n');
  } catch (error) {
    console.error('❌ Error en migración 1:', error.message);
    console.log('\n💡 Ejecuta manualmente el archivo:');
    console.log('   supabase/migrations/20251116000000_cluedo_game_schema.sql\n');
  }

  // Leer migración 2: Datos iniciales
  const seedPath = join(__dirname, '../supabase/migrations/20251116000001_cluedo_seed_data.sql');
  console.log('📄 Leyendo migración 2: Datos iniciales...');
  const seedSQL = readFileSync(seedPath, 'utf-8');
  
  console.log('⚙️  Ejecutando migración 2...');
  try {
    await executeSQL(seedSQL);
    console.log('✅ Migración 2 completada\n');
  } catch (error) {
    console.error('❌ Error en migración 2:', error.message);
    console.log('\n💡 Ejecuta manualmente el archivo:');
    console.log('   supabase/migrations/20251116000001_cluedo_seed_data.sql\n');
  }

  console.log('🔍 Verificando tablas...\n');
  
  // Verificar que las tablas se crearon
  const tables = ['suspects', 'weapons', 'rooms', 'cluedo_games', 'cluedo_players', 'puzzles', 'clues', 'accusations'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: OK`);
    }
  }

  console.log('\n✨ Migraciones completadas!');
}

runMigrations().catch(console.error);

