import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jdlgpuxwqhdcxteyjyuc.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Leer los archivos SQL
const schemaPath = join(__dirname, '../supabase/migrations/20251116000000_cluedo_game_schema.sql');
const seedPath = join(__dirname, '../supabase/migrations/20251116000001_cluedo_seed_data.sql');

const schemaSQL = readFileSync(schemaPath, 'utf-8');
const seedSQL = readFileSync(seedPath, 'utf-8');

async function executeViaSupabase(sql) {
  if (!SUPABASE_SERVICE_KEY) {
    return { success: false, error: 'No service_role key' };
  }

  try {
    // Intentar usar la API REST de Supabase
    // Nota: Supabase no tiene un endpoint directo para ejecutar SQL arbitrario
    // Necesitamos usar el método de Management API o crear una función RPC
    
    // Método alternativo: usar fetch directo con el endpoint de PostgREST
    // Pero esto no funciona para DDL, solo para DML
    
    // La mejor opción es mostrar el SQL para ejecutar manualmente
    return { success: false, error: 'Requires manual execution' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Ejecutando migraciones de Cluedo...\n');

  if (!SUPABASE_SERVICE_KEY) {
    console.log('⚠️  No se encontró SUPABASE_SERVICE_KEY');
    console.log('   Ejecutando en modo manual...\n');
  }

  // Intentar ejecutar automáticamente
  console.log('📄 Migración 1: Esquema de Tablas');
  const result1 = await executeViaSupabase(schemaSQL);
  
  if (!result1.success) {
    console.log('❌ No se pudo ejecutar automáticamente');
    console.log('\n📋 EJECUTA ESTO MANUALMENTE EN EL SQL EDITOR DE SUPABASE:\n');
    console.log('═'.repeat(80));
    console.log(schemaSQL);
    console.log('═'.repeat(80));
  } else {
    console.log('✅ Migración 1 ejecutada correctamente');
  }

  console.log('\n');

  console.log('📄 Migración 2: Datos Iniciales');
  const result2 = await executeViaSupabase(seedSQL);
  
  if (!result2.success) {
    console.log('❌ No se pudo ejecutar automáticamente');
    console.log('\n📋 EJECUTA ESTO MANUALMENTE EN EL SQL EDITOR DE SUPABASE:\n');
    console.log('═'.repeat(80));
    console.log(seedSQL);
    console.log('═'.repeat(80));
  } else {
    console.log('✅ Migración 2 ejecutada correctamente');
  }

  console.log('\n💡 INSTRUCCIONES MANUALES:');
  console.log('   1. Ve a https://supabase.com/dashboard');
  console.log('   2. Selecciona tu proyecto');
  console.log('   3. Ve a SQL Editor > New Query');
  console.log('   4. Copia y pega cada migración (una a la vez)');
  console.log('   5. Haz clic en Run (o Ctrl+Enter / Cmd+Enter)');
  console.log('   6. Verifica que no haya errores');
  console.log('   7. Repite con la siguiente migración\n');
}

main().catch(console.error);

