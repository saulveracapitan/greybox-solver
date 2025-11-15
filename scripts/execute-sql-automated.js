// Script automatizado para ejecutar SQL en Supabase
// Requiere: SUPABASE_SERVICE_KEY (la service_role key, NO la anon key)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://jdlgpuxwqhdcxteyjyuc.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SERVICE_KEY) {
  console.error('❌ Error: Necesitas configurar SUPABASE_SERVICE_KEY');
  console.log('\n💡 Para obtener la service_role key:');
  console.log('   1. Ve a: https://supabase.com/dashboard/project/jdlgpuxwqhdcxteyjyuc/settings/api');
  console.log('   2. Busca "service_role" key (está más abajo, en la sección "Project API keys")');
  console.log('   3. Cópiala (¡CUIDADO! Esta key tiene permisos completos)');
  console.log('   4. Ejecuta: export SUPABASE_SERVICE_KEY="tu_service_role_key"');
  console.log('   5. Vuelve a ejecutar este script\n');
  process.exit(1);
}

async function executeSQL() {
  try {
    const sqlPath = path.join(__dirname, '../supabase/setup_complete.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf-8');

    console.log('📝 Ejecutando SQL en Supabase...\n');
    console.log('⏳ Esto puede tardar unos segundos...\n');

    // Método 1: Intentar usar la API REST de Supabase con service_role
    // Supabase no tiene una API directa para ejecutar SQL arbitrario,
    // pero podemos intentar usar el endpoint de Management API
    
    // Dividir el SQL en statements más pequeños para mejor manejo
    const statements = sqlScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📊 Procesando ${statements.length} statements...\n`);

    // Intentar ejecutar usando fetch directo a la API de Supabase
    // Nota: Esto puede no funcionar porque Supabase no expone un endpoint
    // para ejecutar SQL arbitrario desde la API REST
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ sql: sqlScript })
    });

    if (response.ok) {
      console.log('✅ SQL ejecutado exitosamente!\n');
      console.log('🎉 ¡Base de datos configurada!\n');
      return;
    }

    // Si el método anterior falla, intentar método alternativo
    if (response.status === 404) {
      console.log('⚠️  Método RPC no disponible. Intentando método alternativo...\n');
      
      // Intentar crear una función temporal que ejecute SQL
      // Esto requiere ejecutar SQL primero, así que es circular
      console.log('💡 Supabase requiere ejecutar DDL manualmente desde el SQL Editor.\n');
      console.log('📋 PERO, puedo ayudarte de otra forma:\n');
      console.log('   1. Abre: https://supabase.com/dashboard/project/jdlgpuxwqhdcxteyjyuc/sql/new');
      console.log('   2. El SQL ya está listo en: supabase/setup_complete.sql');
      console.log('   3. Copia y pega el contenido');
      console.log('   4. Haz clic en "Run"\n');
      
      // Mostrar el SQL completo para fácil copia
      console.log('📄 Aquí está el SQL completo para copiar:\n');
      console.log('='.repeat(70));
      console.log(sqlScript);
      console.log('='.repeat(70));
      return;
    }

    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Supabase no permite ejecutar DDL desde la API REST.');
    console.log('   Necesitas ejecutarlo manualmente en el SQL Editor.\n');
    console.log('📋 Pasos:');
    console.log('   1. https://supabase.com/dashboard/project/jdlgpuxwqhdcxteyjyuc/sql/new');
    console.log('   2. Copia: supabase/setup_complete.sql');
    console.log('   3. Pega y ejecuta\n');
  }
}

executeSQL();

