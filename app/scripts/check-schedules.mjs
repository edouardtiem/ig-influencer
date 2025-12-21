/**
 * Check Schedules — View daily schedules in Supabase
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function main() {
  console.log('\n📋 Fetching daily schedules from Supabase...\n');

  const { data, error } = await supabase
    .from('daily_schedules')
    .select('*')
    .order('schedule_date', { ascending: false })
    .limit(10);

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('📭 Aucun planning trouvé dans daily_schedules');
    console.log('\n💡 Le scheduler n\'a peut-être pas encore généré de planning.');
    console.log('   Exécute: node scripts/cron-scheduler.mjs');
    return;
  }

  console.log(`✅ ${data.length} planning(s) trouvé(s):\n`);

  data.forEach(schedule => {
    console.log('═'.repeat(65));
    console.log(`📅 ${schedule.schedule_date} | ${schedule.character.toUpperCase()}`);
    console.log(`🎨 Theme: ${schedule.daily_theme || 'N/A'}`);
    console.log(`📊 Status: ${schedule.status} (${schedule.posts_completed}/${schedule.posts_total} posts)`);
    console.log('─'.repeat(65));
    
    if (schedule.scheduled_posts && schedule.scheduled_posts.length > 0) {
      schedule.scheduled_posts.forEach(p => {
        const status = p.executed ? '✅' : '⏳';
        const type = (p.type || 'carousel').toUpperCase().padEnd(8);
        const location = p.location_name || p.location_key || 'Unknown';
        console.log(`${status} ${p.time} │ ${type} │ ${location}`);
        if (p.caption) {
          const caption = p.caption.length > 50 ? p.caption.substring(0, 50) + '...' : p.caption;
          console.log(`   💬 "${caption}"`);
        }
      });
    } else {
      console.log('   (aucun post programmé)');
    }
    console.log('');
  });
}

main().catch(console.error);

