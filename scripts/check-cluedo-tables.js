import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jdlgpuxwqhdcxteyjyuc.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbGdwdXh3cWhkY3h0ZXlqeXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTQ0NDMsImV4cCI6MjA3ODY5MDQ0M30.cVDNzXcb7IpPIT787vCH2h0WNcJxyvUMYtzUTHh_fZE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const tablesToCheck = [
  'suspects',
  'weapons',
  'rooms',
  'cluedo_games',
  'cluedo_players',
  'puzzles',
  'clues',
  'accusations'
];

async function checkTables() {
  console.log('🔍 Verificando tablas de Cluedo...\n');

  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${table}: ERROR - ${error.message}`);
      } else {
        console.log(`✅ ${table}: OK`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ERROR - ${err.message}`);
    }
  }

  console.log('\n📊 Verificando datos maestros...\n');

  // Verificar datos maestros
  const [suspectsRes, weaponsRes, roomsRes] = await Promise.all([
    supabase.from('suspects').select('*'),
    supabase.from('weapons').select('*'),
    supabase.from('rooms').select('*'),
  ]);

  if (suspectsRes.error) {
    console.log(`❌ suspects: ${suspectsRes.error.message}`);
  } else {
    console.log(`✅ suspects: ${suspectsRes.data?.length || 0} registros`);
  }

  if (weaponsRes.error) {
    console.log(`❌ weapons: ${weaponsRes.error.message}`);
  } else {
    console.log(`✅ weapons: ${weaponsRes.data?.length || 0} registros`);
  }

  if (roomsRes.error) {
    console.log(`❌ rooms: ${roomsRes.error.message}`);
  } else {
    console.log(`✅ rooms: ${roomsRes.data?.length || 0} registros`);
  }
}

checkTables().catch(console.error);

