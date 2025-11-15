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

async function executeSQL(sql) {
  // Dividir el SQL en bloques ejecutables (separados por ;)
  // Pero mantener bloques DO $$ ... END $$ juntos
  const statements = [];
  let currentStatement = '';
  let inDoBlock = false;
  
  const lines = sql.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Detectar inicio de bloque DO
    if (trimmed.startsWith('DO $$')) {
      inDoBlock = true;
      currentStatement += line + '\n';
      continue;
    }
    
    // Detectar fin de bloque DO
    if (inDoBlock && trimmed === 'END $$;') {
      currentStatement += line + '\n';
      if (currentStatement.trim()) {
        statements.push(currentStatement.trim());
      }
      currentStatement = '';
      inDoBlock = false;
      continue;
    }
    
    if (inDoBlock) {
      currentStatement += line + '\n';
      continue;
    }
    
    // Para statements normales
    if (trimmed && !trimmed.startsWith('--')) {
      currentStatement += line + '\n';
      
      if (trimmed.endsWith(';')) {
        if (currentStatement.trim()) {
          statements.push(currentStatement.trim());
        }
        currentStatement = '';
      }
    }
  }
  
  // Ejecutar cada statement usando fetch directo
  console.log(`📝 Ejecutando ${statements.length} statements...\n`);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Saltar statements vacíos o solo comentarios
    if (!statement || statement.trim().length === 0 || statement.trim().startsWith('--')) {
      continue;
    }
    
    try {
      // Usar la API REST de Supabase para ejecutar SQL
      // Nota: Esto requiere una función RPC especial o usar el método directo de PostgREST
      // Intentar usar el endpoint de Management API
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({ sql_query: statement })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        // Si el RPC no existe, mostrar el SQL para ejecutar manualmente
        if (response.status === 404 || errorText.includes('function') || errorText.includes('does not exist')) {
          console.log(`⚠️  Statement ${i + 1} necesita ejecución manual:`);
          console.log('─'.repeat(60));
          console.log(statement);
          console.log('─'.repeat(60));
          console.log('');
          continue;
        }
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log(`✅ Statement ${i + 1} ejecutado`);
    } catch (error) {
      // Si falla, mostrar el SQL para ejecutar manualmente
      console.log(`⚠️  Statement ${i + 1} falló: ${error.message}`);
      console.log('   Ejecuta esto manualmente en el SQL Editor:');
      console.log('─'.repeat(60));
      console.log(statement);
      console.log('─'.repeat(60));
      console.log('');
    }
  }
}

async function runMigrations() {
  console.log('🚀 Ejecutando migraciones de Cluedo...\n');
  console.log('⚠️  Nota: Si el método automático falla, se mostrará el SQL para ejecutar manualmente\n');

  // Leer migración 1: Schema
  const schemaPath = join(__dirname, '../supabase/migrations/20251116000000_cluedo_game_schema.sql');
  console.log('📄 Leyendo migración 1: Esquema de tablas...');
  const schemaSQL = readFileSync(schemaPath, 'utf-8');
  
  console.log('⚙️  Ejecutando migración 1...\n');
  await executeSQL(schemaSQL);
  console.log('✅ Migración 1 procesada\n');

  // Leer migración 2: Datos iniciales
  const seedPath = join(__dirname, '../supabase/migrations/20251116000001_cluedo_seed_data.sql');
  console.log('📄 Leyendo migración 2: Datos iniciales...');
  const seedSQL = readFileSync(seedPath, 'utf-8');
  
  console.log('⚙️  Ejecutando migración 2...\n');
  await executeSQL(seedSQL);
  console.log('✅ Migración 2 procesada\n');

  console.log('\n✨ Proceso completado!');
  console.log('\n💡 Si algunos statements fallaron, cópialos y ejecútalos manualmente en el SQL Editor de Supabase.');
}

runMigrations().catch(console.error);

