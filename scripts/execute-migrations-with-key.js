import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://jdlgpuxwqhdcxteyjyuc.supabase.co';
// Esta es la anon key, pero intentaremos usarla
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbGdwdXh3cWhkY3h0ZXlqeXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTQ0NDMsImV4cCI6MjA3ODY5MDQ0M30.cVDNzXcb7IpPIT787vCH2h0WNcJxyvUMYtzUTHh_fZE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function executeSQLDirect(sql) {
  // Dividir SQL en statements ejecutables
  // Para bloques DO $$ ... END $$, mantenerlos juntos
  const statements = [];
  let current = '';
  let inDoBlock = false;
  
  const lines = sql.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
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
  
  // Intentar ejecutar usando fetch directo a la API REST
  console.log(`📝 Intentando ejecutar ${statements.length} statements...\n`);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    if (!statement || statement.trim().length === 0 || statement.trim().startsWith('--')) {
      continue;
    }
    
    try {
      // Intentar usar el endpoint de Management API
      // Nota: La anon key probablemente no tenga permisos para esto
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({ sql_query: statement })
      });
      
      const responseText = await response.text();
      
      if (!response.ok) {
        if (response.status === 404 || responseText.includes('function') || responseText.includes('does not exist')) {
          console.log(`⚠️  Statement ${i + 1}: El endpoint RPC no está disponible`);
          console.log('   Esto es normal - necesitas ejecutar el SQL manualmente en el SQL Editor\n');
          return false;
        }
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }
      
      console.log(`✅ Statement ${i + 1} ejecutado`);
    } catch (error) {
      console.log(`❌ Statement ${i + 1} falló: ${error.message}`);
      console.log('   La anon key no tiene permisos para ejecutar DDL');
      console.log('   Necesitas usar la service_role key o ejecutar manualmente\n');
      return false;
    }
  }
  
  return true;
}

async function main() {
  console.log('🚀 Intentando ejecutar migraciones...\n');
  console.log('⚠️  Nota: La anon key probablemente no tenga permisos para ejecutar DDL\n');
  
  // Leer migración 1
  const schemaPath = join(__dirname, '../supabase/migrations/20251116000000_cluedo_game_schema.sql');
  const schemaSQL = readFileSync(schemaPath, 'utf-8');
  
  console.log('📄 Migración 1: Esquema de Tablas\n');
  const result1 = await executeSQLDirect(schemaSQL);
  
  if (!result1) {
    console.log('\n❌ No se pudo ejecutar automáticamente');
    console.log('💡 Necesitas la service_role key para ejecutar SQL automáticamente');
    console.log('   O ejecuta el SQL manualmente en el SQL Editor de Supabase\n');
    console.log('📋 SQL para copiar y pegar:\n');
    console.log('═'.repeat(80));
    console.log(schemaSQL);
    console.log('═'.repeat(80));
    return;
  }
  
  // Leer migración 2
  const seedPath = join(__dirname, '../supabase/migrations/20251116000001_cluedo_seed_data.sql');
  const seedSQL = readFileSync(seedPath, 'utf-8');
  
  console.log('\n📄 Migración 2: Datos Iniciales\n');
  const result2 = await executeSQLDirect(seedSQL);
  
  if (!result2) {
    console.log('\n📋 SQL para copiar y pegar:\n');
    console.log('═'.repeat(80));
    console.log(seedSQL);
    console.log('═'.repeat(80));
  }
  
  console.log('\n✨ Proceso completado!');
}

main().catch(console.error);

