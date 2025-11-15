// Script para ejecutar SQL usando la service_role key
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://jdlgpuxwqhdcxteyjyuc.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!serviceRoleKey) {
  console.error('❌ Error: Necesitas la SERVICE_ROLE key (no la anon key)');
  console.log('\n💡 Pasos para obtenerla:');
  console.log('   1. Ve a: https://supabase.com/dashboard/project/jdlgpuxwqhdcxteyjyuc/settings/api');
  console.log('   2. Busca "service_role" key (está más abajo que la anon key)');
  console.log('   3. Cópiala (¡CUIDADO! Esta key tiene permisos completos)');
  console.log('   4. Ejecuta: export SUPABASE_SERVICE_KEY="tu_service_role_key"');
  console.log('   5. Vuelve a ejecutar este script\n');
  process.exit(1);
}

// Crear cliente con service_role key
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL() {
  try {
    const sqlPath = path.join(__dirname, '../supabase/setup_complete.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf-8');

    console.log('📝 Ejecutando script SQL en Supabase...\n');
    console.log('⏳ Esto puede tardar unos segundos...\n');

    // Intentar ejecutar usando la API de Supabase
    // Nota: Supabase Management API requiere hacer requests HTTP directos
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({ query: sqlScript })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Script ejecutado exitosamente!');
      console.log('📊 Resultado:', result);
      return;
    }

    // Si falla, intentar método alternativo
    if (response.status === 404 || response.status === 400) {
      console.log('⚠️  La función exec_sql no está disponible.');
      console.log('💡 Esto es normal. Supabase requiere ejecutar DDL manualmente.\n');
      console.log('📋 EJECUTA ESTOS PASOS:\n');
      console.log('1. Abre este enlace:');
      console.log('   https://supabase.com/dashboard/project/jdlgpuxwqhdcxteyjyuc/sql/new\n');
      console.log('2. Copia TODO el contenido del archivo:');
      console.log(`   ${sqlPath}\n`);
      console.log('3. Pégalo en el SQL Editor');
      console.log('4. Haz clic en "Run" o presiona Ctrl+Enter (Cmd+Enter en Mac)\n');
      console.log('📄 Contenido del SQL:\n');
      console.log('-'.repeat(60));
      console.log(sqlScript);
      console.log('-'.repeat(60));
      return;
    }

    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Alternativa: Ejecuta el SQL manualmente en el SQL Editor');
    console.log('   Archivo: supabase/setup_complete.sql\n');
    process.exit(1);
  }
}

executeSQL();

