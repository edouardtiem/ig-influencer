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

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Time window: execute posts scheduled within this many minutes
const TIME_WINDOW_MINUTES = 30;

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
    
    // Execute if the post time is within the window (past or upcoming 30 min)
    const diff = postMinutes - currentMinutes;
    return diff >= -15 && diff <= TIME_WINDOW_MINUTES;
  });

  return { schedule, pendingPosts };
}

// ===========================================
// EXECUTE POST
// ===========================================

async function executePost(character, post, scheduleId, dryRun = false) {
  console.log(`\n   🎬 Executing ${post.type.toUpperCase()} for ${character}...`);
  console.log(`      📍 ${post.location_name}`);
  console.log(`      💬 "${post.caption?.substring(0, 50)}..."`);

  if (dryRun) {
    console.log(`      ⏭️  DRY RUN - would execute ${post.type}`);
    return true;
  }

  // Determine which script to run
  let scriptName;
  let args = [];

  if (post.type === 'reel') {
    scriptName = character === 'mila' 
      ? 'vacation-reel-post.mjs' 
      : 'vacation-reel-post-elena.mjs';
  } else {
    scriptName = character === 'mila' 
      ? 'carousel-post.mjs' 
      : 'carousel-post-elena.mjs';
  }

  const scriptPath = path.join(__dirname, scriptName);

  console.log(`      📜 Running: ${scriptName}`);

  return new Promise((resolve) => {
    const child = spawn('node', [scriptPath, ...args], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env },
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

