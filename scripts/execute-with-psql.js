// Script para ejecutar SQL usando psql directamente
// Necesita: La connection string de Supabase (se puede obtener del dashboard)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// La connection string se puede obtener de:
// Supabase Dashboard > Settings > Database > Connection string > URI
// Formato: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

const DB_URL = process.env.SUPABASE_DB_URL;

if (!DB_URL) {
  console.error('❌ Error: Necesitas configurar SUPABASE_DB_URL');
  console.log('\n💡 Para obtener la connection string:');
  console.log('   1. Ve a: https://supabase.com/dashboard/project/jdlgpuxwqhdcxteyjyuc/settings/database');
  console.log('   2. Busca "Connection string" > "URI"');
  console.log('   3. Copia la connection string (incluye la contraseña)');
  console.log('   4. Ejecuta: export SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@db.jdlgpuxwqhdcxteyjyuc.supabase.co:5432/postgres"');
  console.log('   5. Vuelve a ejecutar este script\n');
  process.exit(1);
}

async function executeSQL() {
  try {
    const sqlPath = path.join(__dirname, '../supabase/setup_complete.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf-8');

    console.log('📝 Ejecutando SQL usando psql...\n');
    console.log('⏳ Esto puede tardar unos segundos...\n');

    // Verificar si psql está instalado
    try {
      await execAsync('which psql');
    } catch {
      console.error('❌ Error: psql no está instalado');
      console.log('\n💡 Instala PostgreSQL client:');
      console.log('   brew install postgresql\n');
      process.exit(1);
    }

    // Ejecutar el SQL usando psql
    const { stdout, stderr } = await execAsync(
      `psql "${DB_URL}" -f "${sqlPath}"`,
      { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer
    );

    if (stdout) {
      console.log('📊 Salida:', stdout);
    }

    if (stderr && !stderr.includes('NOTICE')) {
      console.error('⚠️  Advertencias:', stderr);
    }

    console.log('\n✅ SQL ejecutado exitosamente!');
    console.log('🎉 ¡Base de datos configurada!\n');
    console.log('💡 Verifica las tablas en:');
    console.log('   https://supabase.com/dashboard/project/jdlgpuxwqhdcxteyjyuc/editor\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stderr) {
      console.error('📋 Detalles:', error.stderr);
    }
    process.exit(1);
  }
}

executeSQL();

