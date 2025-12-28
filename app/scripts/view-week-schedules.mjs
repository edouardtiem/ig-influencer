/**
 * View Week Schedules — Affiche les scénarios de la semaine pour un personnage
 * 
 * Usage: node scripts/view-week-schedules.mjs [character]
 *        node scripts/view-week-schedules.mjs elena
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function main() {
  const character = process.argv[2]?.toLowerCase() || 'elena';
  
  console.log(`\n📅 Scénarios ${character.toUpperCase()} pour la semaine prochaine\n`);

  // Get today's date and next 7 days
  const today = new Date();
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }

  // Fetch schedules
  const { data: schedules, error: scheduleError } = await supabase
    .from('daily_schedules')
    .select('*')
    .eq('character', character)
    .in('schedule_date', dates)
    .order('schedule_date', { ascending: true });

  if (scheduleError) {
    console.error('❌ Error:', scheduleError.message);
    return;
  }

  // Fetch scheduled_posts for more details
  const { data: posts, error: postsError } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('character', character)
    .in('scheduled_date', dates)
    .order('scheduled_date', { ascending: true })
    .order('scheduled_time', { ascending: true });

  if (postsError) {
    console.error('❌ Error:', postsError.message);
    return;
  }

  // Group posts by date
  const postsByDate = {};
  if (posts) {
    posts.forEach(post => {
      if (!postsByDate[post.scheduled_date]) {
        postsByDate[post.scheduled_date] = [];
      }
      postsByDate[post.scheduled_date].push(post);
    });
  }

  // Display for each date
  dates.forEach(date => {
    const dateObj = new Date(date + 'T00:00:00');
    const dayName = dateObj.toLocaleDateString('fr-FR', { weekday: 'long' });
    const dayNum = dateObj.getDate();
    const month = dateObj.toLocaleDateString('fr-FR', { month: 'long' });
    
    const schedule = schedules?.find(s => s.schedule_date === date);
    const dayPosts = postsByDate[date] || [];

    console.log('═'.repeat(70));
    console.log(`📅 ${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNum} ${month} (${date})`);
    
    if (schedule) {
      console.log(`🎨 Thème: ${schedule.daily_theme || 'N/A'}`);
      console.log(`😊 Mood: ${schedule.mood || 'N/A'}`);
      console.log(`📊 Status: ${schedule.status} (${schedule.posts_completed || 0}/${schedule.posts_total || 0} posts)`);
    } else {
      console.log(`⚠️ Aucun schedule généré pour ce jour`);
    }
    console.log('');

    if (dayPosts.length > 0) {
      dayPosts.forEach((post, idx) => {
        const statusIcon = {
          scheduled: '⏳',
          generating: '🎨',
          images_ready: '📦',
          posting: '📤',
          posted: '✅',
          failed: '❌'
        }[post.status] || '❓';

        console.log(`  ${statusIcon} ${post.scheduled_time} │ ${post.post_type || 'carousel'} │ ${post.status}`);
        console.log(`     📍 ${post.location_name || post.location_key || 'N/A'}`);
        if (post.outfit) {
          console.log(`     👗 ${post.outfit.substring(0, 65)}...`);
        }
        if (post.action) {
          console.log(`     🎬 ${post.action.substring(0, 65)}...`);
        }
        if (post.caption) {
          console.log(`     💬 ${post.caption.substring(0, 75)}...`);
        }
        if (post.content_type) {
          console.log(`     📌 Type: ${post.content_type}`);
        }
        if (post.mood) {
          console.log(`     😊 Mood: ${post.mood}`);
        }
        if (post.status === 'failed' && post.error_message) {
          const errorMsg = post.error_message.length > 100 
            ? post.error_message.substring(0, 100) + '...'
            : post.error_message;
          console.log(`     ⚠️ Error: ${errorMsg}`);
        }
        console.log('');
      });
    } else {
      if (!schedule) {
        console.log('  💡 Le schedule sera généré automatiquement demain matin à 7h (Paris)');
        console.log('  Ou générez-le manuellement: node scripts/cron-scheduler.mjs ' + character);
      } else {
        console.log('  ⚠️ Aucun post programmé pour ce jour');
      }
      console.log('');
    }
  });

  console.log('═'.repeat(70));
  console.log(`\n📝 Total: ${schedules?.length || 0} schedule(s) généré(s) sur ${dates.length} jours`);
  console.log(`📸 Total: ${posts?.length || 0} post(s) programmé(s)\n`);
}

main().catch(console.error);

