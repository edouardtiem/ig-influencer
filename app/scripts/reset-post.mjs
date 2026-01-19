import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function resetPost() {
  // Get today's date in Paris timezone
  const now = new Date();
  const parisTimeStr = now.toLocaleString('en-US', { timeZone: 'Europe/Paris' });
  const parisTime = new Date(parisTimeStr);
  const year = parisTime.getFullYear();
  const month = String(parisTime.getMonth() + 1).padStart(2, '0');
  const day = String(parisTime.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${day}`;
  
  console.log(`📅 Looking for Elena's 14:00 post on ${today}...`);
  
  // Find the post
  const { data: posts, error: findError } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('character', 'elena')
    .eq('scheduled_date', today)
    .eq('scheduled_time', '14:00:00');
  
  if (findError) {
    console.error('❌ Error finding post:', findError.message);
    process.exit(1);
  }
  
  if (!posts || posts.length === 0) {
    console.log('❌ No post found for 14:00');
    process.exit(1);
  }
  
  const post = posts[0];
  console.log(`✅ Found post: ${post.location_name}`);
  console.log(`   Current status: ${post.status}`);
  console.log(`   Images: ${post.image_urls?.length || 0}`);
  
  // Reset the post
  const { error: updateError } = await supabase
    .from('scheduled_posts')
    .update({
      status: 'scheduled',
      image_urls: null,
      video_url: null,
      generation_started_at: null,
      generation_completed_at: null,
      posting_started_at: null,
      error_message: null,
      error_step: null,
      retry_count: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', post.id);
  
  if (updateError) {
    console.error('❌ Error resetting post:', updateError.message);
    process.exit(1);
  }
  
  console.log(`\n🔄 Post reset to 'scheduled' status`);
  console.log(`   Images cleared - will regenerate all 3 images`);
  console.log(`   Ready for executor to pick up`);
}

resetPost().catch(console.error);
