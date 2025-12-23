/**
 * Initialize scheduled_posts table and backfill from daily_schedules
 * 
 * Usage:
 *   node scripts/init-scheduled-posts.mjs          # Create table and backfill today
 *   node scripts/init-scheduled-posts.mjs --check  # Just check status
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS scheduled_posts (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
schedule_id UUID REFERENCES daily_schedules(id) ON DELETE CASCADE,
character VARCHAR(50) NOT NULL,
scheduled_date DATE NOT NULL,
scheduled_time TIME NOT NULL,
status VARCHAR(20) DEFAULT 'scheduled',
post_type VARCHAR(20) NOT NULL,
reel_type VARCHAR(20),
reel_theme VARCHAR(50),
content_type VARCHAR(20),
location_key VARCHAR(100),
location_name TEXT,
mood VARCHAR(50),
outfit TEXT,
action TEXT,
caption TEXT,
hashtags TEXT[],
prompt_hints TEXT,
image_urls TEXT[],
video_url TEXT,
cloudinary_ids TEXT[],
instagram_post_id VARCHAR(100),
instagram_permalink TEXT,
error_message TEXT,
error_step VARCHAR(20),
retry_count INTEGER DEFAULT 0,
max_retries INTEGER DEFAULT 3,
generation_started_at TIMESTAMPTZ,
generation_completed_at TIMESTAMPTZ,
posting_started_at TIMESTAMPTZ,
posted_at TIMESTAMPTZ,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),
UNIQUE(schedule_id, scheduled_time)
);

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_date ON scheduled_posts(scheduled_date, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_character ON scheduled_posts(character);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_schedule ON scheduled_posts(schedule_id);
`;

async function checkTableExists() {
  const { data, error } = await supabase
    .from('scheduled_posts')
    .select('id')
    .limit(1);

  // If error contains "does not exist", table doesn't exist
  if (error && error.message.includes('does not exist')) {
    return false;
  }
  return true;
}

async function backfillFromDailySchedules() {
  const today = new Date().toISOString().split('T')[0];
  
  console.log(`\n📅 Backfilling posts for ${today}...`);

  // Get today's schedules
  const { data: schedules, error: scheduleError } = await supabase
    .from('daily_schedules')
    .select('*')
    .eq('schedule_date', today);

  if (scheduleError || !schedules || schedules.length === 0) {
    console.log('   ⚠️ No schedules found for today');
    return;
  }

  for (const schedule of schedules) {
    console.log(`\n   📋 ${schedule.character.toUpperCase()}: ${schedule.scheduled_posts?.length || 0} posts`);

    if (!schedule.scheduled_posts) continue;

    for (const post of schedule.scheduled_posts) {
      const { error: insertError } = await supabase
        .from('scheduled_posts')
        .upsert({
          schedule_id: schedule.id,
          character: schedule.character,
          scheduled_date: today,
          scheduled_time: post.time,
          status: post.executed ? 'posted' : 'scheduled',
          post_type: post.type,
          reel_type: post.reel_type,
          reel_theme: post.reel_theme,
          content_type: post.content_type || 'new',
          location_key: post.location_key,
          location_name: post.location_name,
          mood: post.mood,
          outfit: post.outfit,
          action: post.action,
          caption: post.caption,
          hashtags: post.hashtags,
          prompt_hints: post.prompt_hints,
          posted_at: post.executed ? new Date().toISOString() : null,
        }, { onConflict: 'schedule_id,scheduled_time' });

      if (insertError) {
        console.log(`      ❌ ${post.time}: ${insertError.message}`);
      } else {
        const status = post.executed ? '✅' : '⏳';
        console.log(`      ${status} ${post.time} | ${post.type}`);
      }
    }
  }
}

async function showStatus() {
  const today = new Date().toISOString().split('T')[0];

  const { data: posts, error } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('scheduled_date', today)
    .order('scheduled_time', { ascending: true });

  if (error) {
    console.log(`❌ Error: ${error.message}`);
    return;
  }

  if (!posts || posts.length === 0) {
    console.log(`📭 No posts in scheduled_posts for today`);
    return;
  }

  console.log(`\n📊 Status for ${today}:`);
  
  const byCharacter = posts.reduce((acc, post) => {
    if (!acc[post.character]) acc[post.character] = [];
    acc[post.character].push(post);
    return acc;
  }, {});

  for (const [char, charPosts] of Object.entries(byCharacter)) {
    console.log(`\n   ${char.toUpperCase()}:`);
    for (const post of charPosts) {
      const statusIcon = {
        scheduled: '⏳',
        generating: '🎨',
        images_ready: '📦',
        posting: '📤',
        posted: '✅',
        failed: '❌',
      }[post.status] || '❓';

      console.log(`   ${statusIcon} ${post.scheduled_time} │ ${post.post_type.padEnd(8)} │ ${post.status}`);
    }

    const posted = charPosts.filter(p => p.status === 'posted').length;
    console.log(`   Progress: ${posted}/${charPosts.length}`);
  }
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   SCHEDULED POSTS TABLE — Initialize & Backfill');
  console.log('═══════════════════════════════════════════════════════');

  const checkOnly = process.argv.includes('--check');

  // Check if table exists
  const tableExists = await checkTableExists();
  console.log(`\n📋 Table scheduled_posts: ${tableExists ? '✅ exists' : '❌ does not exist'}`);

  if (!tableExists) {
    console.log('\n⚠️ Table needs to be created.');
    console.log('   Run this SQL in Supabase SQL Editor:');
    console.log('\n   ' + '─'.repeat(50));
    console.log(CREATE_TABLE_SQL);
    console.log('   ' + '─'.repeat(50));
    console.log('\n   After running the SQL, run this script again.');
    return;
  }

  if (checkOnly) {
    await showStatus();
    return;
  }

  // Backfill from daily_schedules
  await backfillFromDailySchedules();

  // Show status
  await showStatus();

  console.log('\n✅ Done!\n');
}

main().catch(console.error);

