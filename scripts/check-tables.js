// Script para verificar si las tablas existen en Supabase
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jdlgpuxwqhdcxteyjyuc.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbGdwdXh3cWhkY3h0ZXlqeXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTQ0NDMsImV4cCI6MjA3ODY5MDQ0M30.cVDNzXcb7IpPIT787vCH2h0WNcJxyvUMYtzUTHh_fZE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTables() {
  console.log('🔍 Verificando tablas en Supabase...\n');
  console.log(`URL: ${SUPABASE_URL}\n`);

  const tables = [
    'game_sessions',
    'players',
    'phase_states',
    'player_clues',
    'shared_log_entries',
    'hints'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`❌ ${table}: NO EXISTE`);
        } else {
          console.log(`⚠️  ${table}: Error - ${error.message}`);
        }
      } else {
        console.log(`✅ ${table}: Existe`);
      }
    } catch (err) {
      console.log(`❌ ${table}: Error - ${err.message}`);
    }
  }

  console.log('\n💡 Si alguna tabla no existe, ejecuta el SQL en:');
  console.log('   https://supabase.com/dashboard/project/jdlgpuxwqhdcxteyjyuc/sql/new\n');
}

checkTables();

