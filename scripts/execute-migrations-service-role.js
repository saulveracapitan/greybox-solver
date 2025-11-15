import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://jdlgpuxwqhdcxteyjyuc.supabase.co';
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
  // Dividir SQL en statements, manteniendo bloques DO $$ juntos
  const statements = [];
  let current = '';
  let inDoBlock = false;
  
  const lines = sql.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('DO $$')) {
      inDoBlock = true;
      current = line + '\n';
      continue;
    }
    
    if (inDoBlock) {
      current += line + '\n';
      if (trimmed === 'END $$;') {
        statements.push(current.trim());
        current = '';
        inDoBlock = false;
      }
      continue;
    }
    
    if (trimmed && !trimmed.startsWith('--')) {
      current += line + '\n';
      if (trimmed.endsWith(';')) {
        statements.push(current.trim());
        current = '';
      }
    }
  }
  
  if (current.trim()) {
    statements.push(current.trim());
  }
  
  console.log(`📝 Ejecutando ${statements.length} statements...\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    if (!statement || statement.trim().length === 0 || statement.trim().startsWith('--')) {
      continue;
    }
    
    try {
      // Intentar usar el endpoint de Management API de Supabase
      // Este endpoint requiere service_role key
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({ sql_query: statement })
      });
      
      const responseText = await response.text();
      
      if (!response.ok) {
        if (response.status === 404 || responseText.includes('function') || responseText.includes('does not exist')) {
          console.log(`⚠️  Statement ${i + 1}: El endpoint RPC no existe`);
          console.log('   Esto significa que necesitas ejecutar el SQL manualmente\n');
          failCount++;
          continue;
        }
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }
      
      console.log(`✅ Statement ${i + 1} ejecutado`);
      successCount++;
    } catch (error) {
      console.log(`❌ Statement ${i + 1} falló: ${error.message}`);
      failCount++;
    }
  }
  
  return { successCount, failCount, total: statements.length };
}

async function main() {
  console.log('🚀 Ejecutando migraciones con service_role key...\n');
  
  // Leer migración 1
  const schemaPath = join(__dirname, '../supabase/migrations/20251116000000_cluedo_game_schema.sql');
  console.log('📄 Migración 1: Esquema de Tablas\n');
  const schemaSQL = readFileSync(schemaPath, 'utf-8');
  
  const result1 = await executeSQL(schemaSQL);
  console.log(`\n📊 Resultado: ${result1.successCount}/${result1.total} statements ejecutados`);
  
  if (result1.failCount > 0) {
    console.log(`\n⚠️  ${result1.failCount} statements fallaron`);
    console.log('   Esto es normal si el endpoint RPC no está disponible');
    console.log('   Ejecuta el SQL manualmente en el SQL Editor de Supabase\n');
  }
  
  // Leer migración 2
  const seedPath = join(__dirname, '../supabase/migrations/20251116000001_cluedo_seed_data.sql');
  console.log('\n📄 Migración 2: Datos Iniciales\n');
  const seedSQL = readFileSync(seedPath, 'utf-8');
  
  const result2 = await executeSQL(seedSQL);
  console.log(`\n📊 Resultado: ${result2.successCount}/${result2.total} statements ejecutados`);
  
  if (result2.failCount > 0) {
    console.log(`\n⚠️  ${result2.failCount} statements fallaron`);
  }
  
  console.log('\n✨ Proceso completado!');
  
  if (result1.failCount > 0 || result2.failCount > 0) {
    console.log('\n💡 Si algunos statements fallaron, ejecuta el SQL manualmente:');
    console.log('   1. Ve a https://supabase.com/dashboard');
    console.log('   2. SQL Editor > New Query');
    console.log('   3. Copia y pega el contenido de los archivos en supabase/migrations/');
    console.log('   4. Ejecuta cada migración\n');
  }
}

main().catch(console.error);

