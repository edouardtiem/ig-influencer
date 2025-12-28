/**
 * Reset a failed post to retry it
 * 
 * Usage:
 *   node scripts/reset-failed-post.mjs elena 21:00
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function resetFailedPost(character, scheduledTime) {
  const today = new Date().toISOString().split('T')[0];
  
  console.log(`\n🔄 Resetting failed post for ${character.toUpperCase()}`);
  console.log(`   Date: ${today}`);
  console.log(`   Time: ${scheduledTime}`);

  // Find the post
  const { data: posts, error: findError } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('scheduled_date', today)
    .eq('character', character)
    .eq('scheduled_time', scheduledTime);

  if (findError) {
    console.error(`❌ Error finding post: ${findError.message}`);
    return false;
  }

  if (!posts || posts.length === 0) {
    console.error(`❌ No post found for ${character} at ${scheduledTime} on ${today}`);
    return false;
  }

  const post = posts[0];
  console.log(`\n   Found post: ${post.id}`);
  console.log(`   Current status: ${post.status}`);
  console.log(`   Retry count: ${post.retry_count}/${post.max_retries}`);
  if (post.error_message) {
    console.log(`   Error: ${post.error_message.substring(0, 80)}...`);
  }

  // Reset the post
  const { error: updateError } = await supabase
    .from('scheduled_posts')
    .update({
      status: 'scheduled',
      retry_count: 0,
      error_message: null,
      error_step: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', post.id);

  if (updateError) {
    console.error(`❌ Error resetting post: ${updateError.message}`);
    return false;
  }

  console.log(`\n✅ Post reset successfully!`);
  console.log(`   Status: scheduled`);
  console.log(`   Retry count: 0/${post.max_retries}`);
  console.log(`\n   You can now run: node scripts/cron-executor.mjs ${character}`);

  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const character = args[0]?.toLowerCase();
  const scheduledTime = args[1];

  if (!character || !scheduledTime) {
    console.error('Usage: node scripts/reset-failed-post.mjs <character> <scheduled_time>');
    console.error('Example: node scripts/reset-failed-post.mjs elena 21:00');
    process.exit(1);
  }

  // Normalize time format (add :00 if needed)
  const normalizedTime = scheduledTime.includes(':') && scheduledTime.split(':').length === 2
    ? `${scheduledTime}:00`
    : scheduledTime;

  await resetFailedPost(character, normalizedTime);
}

main().catch(console.error);

