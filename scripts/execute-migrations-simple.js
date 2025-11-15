import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Leer los archivos SQL
const schemaPath = join(__dirname, '../supabase/migrations/20251116000000_cluedo_game_schema.sql');
const seedPath = join(__dirname, '../supabase/migrations/20251116000001_cluedo_seed_data.sql');

const schemaSQL = readFileSync(schemaPath, 'utf-8');
const seedSQL = readFileSync(seedPath, 'utf-8');

console.log('📋 MIGRACIÓN 1: Esquema de Tablas\n');
console.log('═'.repeat(80));
console.log(schemaSQL);
console.log('═'.repeat(80));
console.log('\n\n');

console.log('📋 MIGRACIÓN 2: Datos Iniciales\n');
console.log('═'.repeat(80));
console.log(seedSQL);
console.log('═'.repeat(80));
console.log('\n');

console.log('💡 INSTRUCCIONES:');
console.log('   1. Ve a https://supabase.com/dashboard');
console.log('   2. Selecciona tu proyecto');
console.log('   3. Ve a SQL Editor > New Query');
console.log('   4. Copia y pega la MIGRACIÓN 1 completa');
console.log('   5. Haz clic en Run (o Ctrl+Enter)');
console.log('   6. Repite con la MIGRACIÓN 2\n');

