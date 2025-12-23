/**
 * CRON Executor V2 — Step-based post execution with granular status tracking
 * 
 * Uses the scheduled_posts table for granular status tracking.
 * Each run processes ONE step of ONE post:
 *   - scheduled → generating (generate images)
 *   - images_ready → posting (publish to Instagram)
 *   - failed → retry (if retry_count < max_retries)
 * 
 * Usage:
 *   node scripts/cron-executor.mjs           # Process next post for both accounts
 *   node scripts/cron-executor.mjs mila      # Mila only
 *   node scripts/cron-executor.mjs elena     # Elena only
 *   node scripts/cron-executor.mjs --dry-run # Check without executing
 *   node scripts/cron-executor.mjs --status  # Show status only
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ===========================================
// CONFIG
// ===========================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  if (!SUPABASE_URL) console.error('   - SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) console.error('   - SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Time window for post execution (in hours)
const LOOKAHEAD_HOURS = 1;
const CATCHUP_HOURS = 18;

// ===========================================
// IMPORT GENERATION & PUBLISHING FUNCTIONS
// ===========================================

// Dynamic import to get the functions from scheduled-post.mjs
let generateImagesForPost, publishCarouselToInstagram, publishReelToInstagram;

async function loadPostFunctions() {
  const module = await import('./scheduled-post.mjs');
  generateImagesForPost = module.generateImagesForPost;
  publishCarouselToInstagram = module.publishCarouselToInstagram;
  publishReelToInstagram = module.publishReelToInstagram;
}

// ===========================================
// GET NEXT POST TO PROCESS
// ===========================================

async function getNextPost(character = null) {
  const today = new Date().toISOString().split('T')[0];
  
  // Get current time in Paris
  const now = new Date();
  const parisTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
  const currentMinutes = parisTime.getHours() * 60 + parisTime.getMinutes();
  
  // Build query
  let query = supabase
    .from('scheduled_posts')
    .select('*')
    .eq('scheduled_date', today)
    .in('status', ['scheduled', 'images_ready', 'failed']);

  if (character) {
    query = query.eq('character', character);
  }

  const { data: posts, error } = await query.order('scheduled_time', { ascending: true });

  if (error || !posts || posts.length === 0) {
    return null;
  }

  // Filter posts within time window
  const eligiblePosts = posts.filter(post => {
    // Skip failed posts that have exceeded retries
    if (post.status === 'failed' && post.retry_count >= post.max_retries) {
      return false;
    }

    const [hours, minutes] = post.scheduled_time.split(':').map(Number);
    const postMinutes = hours * 60 + minutes;
    const diff = postMinutes - currentMinutes;

    // Execute if within window or catchup
    const isUpcoming = diff >= 0 && diff <= LOOKAHEAD_HOURS * 60;
    const isCatchup = diff < 0 && diff >= -CATCHUP_HOURS * 60;

    return isUpcoming || isCatchup;
  });

  if (eligiblePosts.length === 0) {
    return null;
  }

  // Prioritize: images_ready first (ready to post), then scheduled, then failed (retry)
  const priorityOrder = { 'images_ready': 0, 'scheduled': 1, 'failed': 2 };
  eligiblePosts.sort((a, b) => {
    const priorityDiff = priorityOrder[a.status] - priorityOrder[b.status];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Same priority: older posts first
    const [aH, aM] = a.scheduled_time.split(':').map(Number);
    const [bH, bM] = b.scheduled_time.split(':').map(Number);
    return (aH * 60 + aM) - (bH * 60 + bM);
  });

  return eligiblePosts[0];
}

// ===========================================
// UPDATE POST STATUS
// ===========================================

async function updatePostStatus(postId, updates) {
  const { error } = await supabase
    .from('scheduled_posts')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId);

  if (error) {
    console.log(`   ⚠️ Failed to update status: ${error.message}`);
  }
}

async function markPostFailed(postId, errorMessage, errorStep) {
  const { data: post } = await supabase
    .from('scheduled_posts')
    .select('retry_count')
    .eq('id', postId)
    .single();

  await updatePostStatus(postId, {
    status: 'failed',
    error_message: errorMessage,
    error_step: errorStep,
    retry_count: (post?.retry_count || 0) + 1,
  });
}

// ===========================================
// SYNC DAILY_SCHEDULES (keep legacy table updated)
// ===========================================

async function syncDailySchedule(scheduleId) {
  // Get all posts for this schedule
  const { data: posts } = await supabase
    .from('scheduled_posts')
    .select('scheduled_time, status')
    .eq('schedule_id', scheduleId);

  if (!posts) return;

  const completedCount = posts.filter(p => p.status === 'posted').length;
  const totalCount = posts.length;
  const newStatus = completedCount >= totalCount ? 'completed' : 
                    completedCount > 0 ? 'in_progress' : 'pending';

  // Update daily_schedules for backward compatibility
  const { data: schedule } = await supabase
    .from('daily_schedules')
    .select('scheduled_posts')
    .eq('id', scheduleId)
    .single();

  if (schedule) {
    const updatedLegacyPosts = schedule.scheduled_posts.map(p => {
      const matchingPost = posts.find(sp => sp.scheduled_time === p.time);
      return matchingPost 
        ? { ...p, executed: matchingPost.status === 'posted' }
        : p;
    });

    await supabase
      .from('daily_schedules')
      .update({
        scheduled_posts: updatedLegacyPosts,
        posts_completed: completedCount,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', scheduleId);
  }
}

// ===========================================
// PROCESS POST: GENERATE IMAGES
// ===========================================

async function processGenerating(post, dryRun) {
  console.log(`\n   🎨 STEP 1: Generating images...`);
  console.log(`      📍 ${post.location_name}`);
  console.log(`      👗 ${post.outfit?.substring(0, 50)}...`);

  if (dryRun) {
    console.log(`      ⏭️ DRY RUN - would generate images`);
    return true;
  }

  try {
    // Update status to generating
    await updatePostStatus(post.id, {
      status: 'generating',
      generation_started_at: new Date().toISOString(),
    });

    // Generate images
    const postParams = {
      character: post.character,
      type: post.post_type,
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

    const result = await generateImagesForPost(postParams);

    if (!result || !result.imageUrls || result.imageUrls.length === 0) {
      throw new Error('No images generated');
    }

    // Update with generated images
    await updatePostStatus(post.id, {
      status: 'images_ready',
      image_urls: result.imageUrls,
      video_url: result.videoUrl || null,
      generation_completed_at: new Date().toISOString(),
    });

    console.log(`      ✅ Generated ${result.imageUrls.length} images`);
    return true;

  } catch (error) {
    console.log(`      ❌ Generation failed: ${error.message}`);
    await markPostFailed(post.id, error.message, 'generating');
    return false;
  }
}

// ===========================================
// PROCESS POST: PUBLISH TO INSTAGRAM
// ===========================================

async function processPosting(post, dryRun) {
  console.log(`\n   📤 STEP 2: Publishing to Instagram...`);
  console.log(`      💬 "${post.caption?.substring(0, 50)}..."`);

  if (dryRun) {
    console.log(`      ⏭️ DRY RUN - would publish ${post.post_type}`);
    return true;
  }

  try {
    // Update status to posting
    await updatePostStatus(post.id, {
      status: 'posting',
      posting_started_at: new Date().toISOString(),
    });

    // Build caption with hashtags
    const hashtagStr = Array.isArray(post.hashtags) 
      ? post.hashtags.join(' ')
      : (post.hashtags || '');
    const fullCaption = `${post.caption}\n\n${hashtagStr}`;

    let instagramPostId;

    if (post.post_type === 'reel' && post.video_url) {
      // Publish as reel
      instagramPostId = await publishReelToInstagram(
        post.character,
        post.video_url,
        fullCaption
      );
    } else {
      // Publish as carousel
      instagramPostId = await publishCarouselToInstagram(
        post.character,
        post.image_urls,
        fullCaption
      );
    }

    // Update as posted
    await updatePostStatus(post.id, {
      status: 'posted',
      instagram_post_id: instagramPostId,
      posted_at: new Date().toISOString(),
    });

    // Sync legacy table
    if (post.schedule_id) {
      await syncDailySchedule(post.schedule_id);
    }

    console.log(`      ✅ Published! ID: ${instagramPostId}`);
    return true;

  } catch (error) {
    console.log(`      ❌ Publishing failed: ${error.message}`);
    await markPostFailed(post.id, error.message, 'posting');
    return false;
  }
}

// ===========================================
// PROCESS POST: RETRY FAILED
// ===========================================

async function processRetry(post, dryRun) {
  console.log(`\n   🔄 RETRY (attempt ${post.retry_count + 1}/${post.max_retries})...`);
  console.log(`      Previous error: ${post.error_message}`);

  if (dryRun) {
    console.log(`      ⏭️ DRY RUN - would retry from ${post.error_step}`);
    return true;
  }

  // Reset status based on where it failed
  if (post.error_step === 'generating' || !post.image_urls || post.image_urls.length === 0) {
    // Retry from generation
    await updatePostStatus(post.id, {
      status: 'scheduled',
      error_message: null,
      error_step: null,
    });
    return await processGenerating(post, dryRun);
  } else {
    // Retry from posting
    await updatePostStatus(post.id, {
      status: 'images_ready',
      error_message: null,
      error_step: null,
    });
    return await processPosting(post, dryRun);
  }
}

// ===========================================
// PROCESS NEXT POST
// ===========================================

async function processNextPost(character, dryRun) {
  const post = await getNextPost(character);

  if (!post) {
    console.log(`   😴 No posts to process right now`);
    return null;
  }

  const reelInfo = post.post_type === 'reel' ? ' (video)' : '';
  console.log(`\n   🎬 Processing ${post.post_type.toUpperCase()}${reelInfo}`);
  console.log(`      📍 ${post.location_name}`);
  console.log(`      ⏰ Scheduled: ${post.scheduled_time}`);
  console.log(`      📊 Status: ${post.status}`);

  switch (post.status) {
    case 'scheduled':
      return await processGenerating(post, dryRun);
    case 'images_ready':
      return await processPosting(post, dryRun);
    case 'failed':
      return await processRetry(post, dryRun);
    default:
      console.log(`   ⚠️ Unknown status: ${post.status}`);
      return false;
  }
}

// ===========================================
// SHOW STATUS
// ===========================================

async function showStatus(character = null) {
  const today = new Date().toISOString().split('T')[0];

  let query = supabase
    .from('scheduled_posts')
    .select('*')
    .eq('scheduled_date', today)
    .order('scheduled_time', { ascending: true });

  if (character) {
    query = query.eq('character', character);
  }

  const { data: posts, error } = await query;

  if (error || !posts || posts.length === 0) {
    console.log(`   📭 No posts scheduled for today`);
    return;
  }

  // Group by character
  const byCharacter = posts.reduce((acc, post) => {
    if (!acc[post.character]) acc[post.character] = [];
    acc[post.character].push(post);
    return acc;
  }, {});

  for (const [char, charPosts] of Object.entries(byCharacter)) {
    console.log(`\n   📅 ${char.toUpperCase()}`);
    console.log('   ' + '─'.repeat(55));

    for (const post of charPosts) {
      const statusIcon = {
        scheduled: '⏳',
        generating: '🎨',
        images_ready: '📦',
        posting: '📤',
        posted: '✅',
        failed: '❌',
      }[post.status] || '❓';

      const retryInfo = post.status === 'failed' 
        ? ` (retry ${post.retry_count}/${post.max_retries})`
        : '';

      console.log(`   ${statusIcon} ${post.scheduled_time} │ ${post.post_type.padEnd(8)} │ ${post.status}${retryInfo}`);
      console.log(`      └─ ${post.location_name}`);

      if (post.status === 'failed' && post.error_message) {
        console.log(`         ⚠️ ${post.error_message.substring(0, 50)}...`);
      }
    }

    const posted = charPosts.filter(p => p.status === 'posted').length;
    console.log(`   ─────────────────────────────────────────────────────`);
    console.log(`   Progress: ${posted}/${charPosts.length} posted`);
  }
}

// ===========================================
// CHECK FOR CHARACTER
// ===========================================

async function checkAndExecute(character, dryRun, showStatusOnly) {
  console.log(`\n📋 Checking ${character ? character.toUpperCase() : 'ALL ACCOUNTS'}...`);

  // Get current Paris time
  const now = new Date();
  const parisTime = now.toLocaleString('en-US', {
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  console.log(`   🕐 Current time (Paris): ${parisTime}`);

  if (showStatusOnly) {
    await showStatus(character);
    return;
  }

  // Show status first
  await showStatus(character);

  // Process next post
  await processNextPost(character, dryRun);
}

// ===========================================
// MAIN
// ===========================================

async function main() {
  console.log('\n⏰ ═══════════════════════════════════════════════════════');
  console.log('   CRON EXECUTOR V2 — Step-based Processing');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   Time: ${new Date().toISOString()}`);

  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const showStatusOnly = args.includes('--status');
  const target = args.find(a => !a.startsWith('--'))?.toLowerCase();

  if (dryRun) {
    console.log('   Mode: DRY RUN (no actual execution)');
  }
  if (showStatusOnly) {
    console.log('   Mode: STATUS ONLY');
  }

  // Load generation/publishing functions
  if (!dryRun && !showStatusOnly) {
    try {
      await loadPostFunctions();
    } catch (err) {
      console.log(`\n❌ Failed to load post functions: ${err.message}`);
      console.log('   Make sure scheduled-post.mjs exports the required functions');
      process.exit(1);
    }
  }

  if (target === 'mila') {
    await checkAndExecute('mila', dryRun, showStatusOnly);
  } else if (target === 'elena') {
    await checkAndExecute('elena', dryRun, showStatusOnly);
  } else {
    await checkAndExecute('mila', dryRun, showStatusOnly);
    await checkAndExecute('elena', dryRun, showStatusOnly);
  }

  console.log('\n✅ Execution check complete!\n');
}

main().catch(console.error);
