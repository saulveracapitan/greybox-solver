// Script para ejecutar SQL en Supabase usando el cliente
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://jdlgpuxwqhdcxteyjyuc.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseKey) {
  console.error('❌ Error: Necesitas configurar SUPABASE_KEY o SUPABASE_SERVICE_KEY');
  console.log('\n💡 Para ejecutar DDL (CREATE TABLE, etc.) necesitas la SERVICE_ROLE key');
  console.log('   Obténla en: https://supabase.com/dashboard/project/jdlgpuxwqhdcxteyjyuc/settings/api');
  console.log('   Luego ejecuta: export SUPABASE_KEY="tu_service_role_key"\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL() {
  try {
    const sqlPath = path.join(__dirname, '../supabase/setup_complete.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf-8');

    console.log('📝 Leyendo script SQL...\n');

    // Dividir el script en statements individuales
    // Necesitamos ser cuidadosos con los bloques DO $$
    const statements = [];
    let currentStatement = '';
    let inDoBlock = false;
    let doBlockDepth = 0;

    const lines = sqlScript.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detectar inicio de bloque DO $$
      if (line.startsWith('DO $$')) {
        inDoBlock = true;
        doBlockDepth = 0;
        currentStatement = line + '\n';
        continue;
      }
      
      // Detectar fin de bloque DO $$
      if (inDoBlock) {
        currentStatement += lines[i] + '\n';
        
        // Contar BEGIN/END para saber cuándo termina el bloque
        if (line.includes('BEGIN')) doBlockDepth++;
        if (line.includes('END')) doBlockDepth--;
        if (line.includes('END $$') && doBlockDepth === 0) {
          inDoBlock = false;
          statements.push(currentStatement.trim());
          currentStatement = '';
        }
        continue;
      }
      
      // Ignorar comentarios y líneas vacías
      if (!line || line.startsWith('--')) {
        continue;
      }
      
      currentStatement += lines[i] + '\n';
      
      // Si la línea termina con ; y no estamos en un bloque, es el fin de un statement
      if (line.endsWith(';') && !inDoBlock) {
        if (currentStatement.trim()) {
          statements.push(currentStatement.trim());
        }
        currentStatement = '';
      }
    }

    console.log(`📊 Encontrados ${statements.length} statements SQL\n`);
    console.log('⏳ Ejecutando statements...\n');

    // Intentar ejecutar cada statement
    // Nota: Supabase no permite ejecutar DDL directamente desde la API REST
    // Necesitamos usar el SQL Editor o la Management API
    
    console.log('⚠️  Supabase no permite ejecutar DDL (CREATE TABLE, etc.) desde la API REST.');
    console.log('💡 Necesitas ejecutar el SQL manualmente en el SQL Editor.\n');
    console.log('📋 Sigue estos pasos:\n');
    console.log('1. Abre: https://supabase.com/dashboard/project/jdlgpuxwqhdcxteyjyuc/sql/new');
    console.log('2. Copia el contenido de: supabase/setup_complete.sql');
    console.log('3. Pégalo en el editor');
    console.log('4. Haz clic en "Run"\n');
    
    // Intentar verificar conexión
    console.log('🔍 Verificando conexión con Supabase...\n');
    
    try {
      // Intentar una query simple para verificar la conexión
      const { data, error } = await supabase.from('game_sessions').select('count').limit(1);
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('✅ Conexión exitosa! (La tabla game_sessions aún no existe, es normal)');
        } else {
          console.log('⚠️  Conexión verificada, pero:', error.message);
        }
      } else {
        console.log('✅ Conexión exitosa!');
      }
    } catch (err) {
      console.log('⚠️  No se pudo verificar la conexión:', err.message);
    }
    
    console.log('\n📄 El SQL está listo en: supabase/setup_complete.sql');
    console.log('   Ejecútalo manualmente en el SQL Editor de Supabase.\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

executeSQL();

