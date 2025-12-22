/**
 * CRON Executor — Execute scheduled posts
 * 
 * Run every 30 minutes
 * Checks if there's a post scheduled within the next 30 minutes and executes it
 * 
 * Usage:
 *   node scripts/cron-executor.mjs           # Check and execute for both accounts
 *   node scripts/cron-executor.mjs mila      # Mila only
 *   node scripts/cron-executor.mjs elena     # Elena only
 *   node scripts/cron-executor.mjs --dry-run # Check without executing
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ===========================================
// CONFIG
// ===========================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Check required env vars
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  if (!SUPABASE_URL) console.error('   - SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) console.error('   - SUPABASE_SERVICE_KEY');
  console.error('\n💡 Add these secrets in GitHub: Settings → Secrets → Actions');
  console.error('   Or in .env.local for local development');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Time window: execute posts scheduled within this many minutes
// Increased to 60 minutes for more reliability with GitHub Actions cron
const TIME_WINDOW_MINUTES = 60;

// Catchup window: also execute posts that were missed up to this many hours ago
const CATCHUP_HOURS = 3;

// ===========================================
// GET PENDING POSTS
// ===========================================

async function getPendingPosts(character) {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: schedule, error } = await supabase
    .from('daily_schedules')
    .select('*')
    .eq('schedule_date', today)
    .eq('character', character)
    .single();

  if (error || !schedule) {
    return { schedule: null, pendingPosts: [] };
  }

  // Get current time in Paris
  const now = new Date();
  const parisTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
  const currentMinutes = parisTime.getHours() * 60 + parisTime.getMinutes();

  // Find posts that should be executed now
  const pendingPosts = schedule.scheduled_posts.filter(post => {
    if (post.executed) return false;
    
    const [hours, minutes] = post.time.split(':').map(Number);
    const postMinutes = hours * 60 + minutes;
    
    // Calculate time difference
    const diff = postMinutes - currentMinutes;
    
    // Execute if:
    // 1. Post time is upcoming within TIME_WINDOW_MINUTES, OR
    // 2. Post was missed but within CATCHUP_HOURS (catchup mode)
    const catchupMinutes = CATCHUP_HOURS * 60;
    const isUpcoming = diff >= 0 && diff <= TIME_WINDOW_MINUTES;
    const isCatchup = diff < 0 && diff >= -catchupMinutes;
    
    return isUpcoming || isCatchup;
  });

  // Sort: prioritize older missed posts first (catchup), then upcoming
  pendingPosts.sort((a, b) => {
    const [aH, aM] = a.time.split(':').map(Number);
    const [bH, bM] = b.time.split(':').map(Number);
    return (aH * 60 + aM) - (bH * 60 + bM);
  });

  return { schedule, pendingPosts };
}

// ===========================================
// EXECUTE POST
// ===========================================

async function executePost(character, post, scheduleId, dryRun = false) {
  const reelInfo = post.type === 'reel' ? ` (${post.reel_type || 'photo'})` : '';
  console.log(`\n   🎬 Executing ${post.type.toUpperCase()}${reelInfo} for ${character}...`);
  console.log(`      📍 ${post.location_name}`);
  console.log(`      👗 ${post.outfit?.substring(0, 40)}...`);
  console.log(`      💬 "${post.caption?.substring(0, 50)}..."`);

  if (dryRun) {
    console.log(`      ⏭️  DRY RUN - would execute ${post.type}${reelInfo}`);
    return true;
  }

  // Use the unified scheduled-post.mjs script
  // Pass schedule params via SCHEDULED_POST env var
  const scriptName = 'scheduled-post.mjs';
  const scriptPath = path.join(__dirname, scriptName);

  // Prepare post data with character included
  const postData = {
    character,
    type: post.type,
    reel_type: post.reel_type,
    location_key: post.location_key,
    location_name: post.location_name,
    mood: post.mood,
    outfit: post.outfit,
    action: post.action,
    caption: post.caption,
    hashtags: post.hashtags,
    prompt_hints: post.prompt_hints,
  };

  console.log(`      📜 Running: ${scriptName} with schedule params`);

  return new Promise((resolve) => {
    const child = spawn('node', [scriptPath], {
      cwd: path.join(__dirname, '..'),
      env: { 
        ...process.env,
        SCHEDULED_POST: JSON.stringify(postData),
      },
      stdio: 'inherit',
    });

    child.on('close', async (code) => {
      if (code === 0) {
        console.log(`      ✅ Post executed successfully`);
        
        // Mark as executed in Supabase
        await markPostExecuted(scheduleId, post.time);
        resolve(true);
      } else {
        console.log(`      ❌ Script exited with code ${code}`);
        resolve(false);
      }
    });

    child.on('error', (err) => {
      console.log(`      ❌ Error: ${err.message}`);
      resolve(false);
    });
  });
}

// ===========================================
// MARK POST AS EXECUTED
// ===========================================

async function markPostExecuted(scheduleId, postTime) {
  const { data: schedule } = await supabase
    .from('daily_schedules')
    .select('scheduled_posts, posts_completed, posts_total')
    .eq('id', scheduleId)
    .single();

  if (!schedule) return;

  const updatedPosts = schedule.scheduled_posts.map(p => 
    p.time === postTime ? { ...p, executed: true } : p
  );

  const completedCount = updatedPosts.filter(p => p.executed).length;
  const newStatus = completedCount >= schedule.posts_total ? 'completed' : 'in_progress';

  await supabase
    .from('daily_schedules')
    .update({
      scheduled_posts: updatedPosts,
      posts_completed: completedCount,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', scheduleId);
}

// ===========================================
// CHECK AND EXECUTE FOR CHARACTER
// ===========================================

async function checkAndExecute(character, dryRun) {
  console.log(`\n📋 Checking schedule for ${character.toUpperCase()}...`);

  const { schedule, pendingPosts } = await getPendingPosts(character);

  if (!schedule) {
    console.log(`   ⚠️  No schedule found for today`);
    console.log(`   💡 Run: node scripts/cron-scheduler.mjs ${character}`);
    return;
  }

  console.log(`   📅 Theme: "${schedule.daily_theme}"`);
  console.log(`   📊 Progress: ${schedule.posts_completed}/${schedule.posts_total} posts`);

  // Get current Paris time
  const now = new Date();
  const parisTime = now.toLocaleString('en-US', { 
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  console.log(`   🕐 Current time (Paris): ${parisTime}`);

  // Show all scheduled posts with status
  console.log(`\n   📋 Today's posts:`);
  schedule.scheduled_posts.forEach(p => {
    const status = p.executed ? '✅' : '⏳';
    const isPending = pendingPosts.some(pp => pp.time === p.time);
    const marker = isPending ? ' ← NOW' : '';
    console.log(`      ${status} ${p.time} │ ${p.type.padEnd(8)} │ ${p.location_name}${marker}`);
  });

  if (pendingPosts.length === 0) {
    console.log(`\n   😴 No posts to execute right now`);
    return;
  }

  console.log(`\n   🚀 ${pendingPosts.length} post(s) to execute:`);

  for (const post of pendingPosts) {
    await executePost(character, post, schedule.id, dryRun);
  }
}

// ===========================================
// MAIN
// ===========================================

async function main() {
  console.log('\n⏰ ═══════════════════════════════════════════════════════');
  console.log('   CRON EXECUTOR — Post Execution Check');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   Time: ${new Date().toISOString()}`);

  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const target = args.find(a => !a.startsWith('--'))?.toLowerCase();

  if (dryRun) {
    console.log('   Mode: DRY RUN (no actual posts)');
  }

  if (target === 'mila') {
    await checkAndExecute('mila', dryRun);
  } else if (target === 'elena') {
    await checkAndExecute('elena', dryRun);
  } else {
    await checkAndExecute('mila', dryRun);
    await checkAndExecute('elena', dryRun);
  }

  console.log('\n✅ Execution check complete!\n');
}

main().catch(console.error);

