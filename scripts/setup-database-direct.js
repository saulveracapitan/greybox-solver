// Script para ejecutar SQL directamente usando fetch a la API de Supabase
// Ejecuta: node scripts/setup-database-direct.js

const SUPABASE_URL = 'https://jdlgpuxwqhdcxteyjyuc.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

// Necesitas la service_role key (no la anon key)
// Obténla en: Supabase Dashboard > Settings > API > service_role key

const fs = require('fs');
const path = require('path');

async function executeSQL(sql) {
  // Usar la API REST de Supabase para ejecutar SQL
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return await response.json();
}

async function setupDatabase() {
  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ Error: Necesitas configurar SUPABASE_SERVICE_KEY');
    console.log('💡 Ejecuta: export SUPABASE_SERVICE_KEY="tu_service_role_key"');
    console.log('💡 Obtén la key en: Supabase Dashboard > Settings > API > service_role key');
    process.exit(1);
  }

  try {
    const sqlPath = path.join(__dirname, '../supabase/setup_complete.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf-8');

    console.log('📝 Ejecutando script SQL completo...\n');

    // Ejecutar el script completo
    const result = await executeSQL(sqlScript);
    
    console.log('✅ Script ejecutado exitosamente!');
    console.log('📊 Resultado:', result);
    
    console.log('\n🎉 ¡Base de datos configurada correctamente!');
    console.log('\n💡 Verifica las tablas en: Supabase Dashboard > Table Editor');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('exec_sql')) {
      console.log('\n💡 La función exec_sql no existe. Necesitas ejecutar el SQL manualmente:');
      console.log('   1. Ve a Supabase Dashboard > SQL Editor');
      console.log('   2. Copia el contenido de supabase/setup_complete.sql');
      console.log('   3. Pégalo y ejecuta');
    }
    
    process.exit(1);
  }
}

setupDatabase();

