// Script para ejecutar el SQL en Supabase
// Necesitas la service_role key (no la anon key)
// Obténla en: Supabase Dashboard > Settings > API > service_role key

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://jdlgpuxwqhdcxteyjyuc.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function executeSQL(sql) {
  // Usar la API de Supabase Management para ejecutar SQL
  // Esto requiere la service_role key
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
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return await response.json();
}

async function setupDatabase() {
  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ Error: Necesitas configurar SUPABASE_SERVICE_KEY');
    console.log('\n💡 Pasos:');
    console.log('   1. Ve a: https://supabase.com/dashboard/project/jdlgpuxwqhdcxteyjyuc/settings/api');
    console.log('   2. Copia la "service_role" key (NO la anon key)');
    console.log('   3. Ejecuta: export SUPABASE_SERVICE_KEY="tu_service_role_key"');
    console.log('   4. Vuelve a ejecutar este script\n');
    process.exit(1);
  }

  try {
    const sqlPath = path.join(__dirname, '../supabase/setup_complete.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf-8');

    console.log('📝 Ejecutando script SQL en Supabase...\n');
    console.log('⏳ Esto puede tardar unos segundos...\n');

    // Intentar ejecutar el script completo
    try {
      const result = await executeSQL(sqlScript);
      console.log('✅ Script ejecutado exitosamente!');
      console.log('📊 Resultado:', result);
    } catch (error) {
      if (error.message.includes('exec_sql') || error.message.includes('404') || error.message.includes('PGRST')) {
        console.log('⚠️  La función exec_sql no está disponible.');
        console.log('💡 Esto es normal. Necesitas ejecutar el SQL manualmente:\n');
        console.log('   1. Ve a: https://supabase.com/dashboard/project/jdlgpuxwqhdcxteyjyuc/sql/new');
        console.log('   2. Copia el contenido de: supabase/setup_complete.sql');
        console.log('   3. Pégalo en el editor SQL');
        console.log('   4. Haz clic en "Run"\n');
        console.log('📄 O ejecuta este comando para ver el SQL:');
        console.log(`   cat ${sqlPath}\n`);
        return;
      }
      throw error;
    }
    
    console.log('\n🎉 ¡Base de datos configurada correctamente!');
    console.log('\n💡 Verifica las tablas en:');
    console.log('   https://supabase.com/dashboard/project/jdlgpuxwqhdcxteyjyuc/editor\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Alternativa: Ejecuta el SQL manualmente en el SQL Editor de Supabase');
    process.exit(1);
  }
}

setupDatabase();

