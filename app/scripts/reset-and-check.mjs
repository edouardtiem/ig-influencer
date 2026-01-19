import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function resetPost() {
  const now = new Date();
  const parisTimeStr = now.toLocaleString('en-US', { timeZone: 'Europe/Paris' });
  const parisTime = new Date(parisTimeStr);
  const today = `${parisTime.getFullYear()}-${String(parisTime.getMonth() + 1).padStart(2, '0')}-${String(parisTime.getDate()).padStart(2, '0')}`;
  
  console.log(`📅 Resetting Elena's 14:00 post for ${today}...\n`);
  
  const { data: posts, error: findError } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('character', 'elena')
    .eq('scheduled_date', today)
    .eq('scheduled_time', '14:00:00');
  
  if (findError || !posts?.length) {
    console.error('❌ Post not found');
    process.exit(1);
  }
  
  const post = posts[0];
  console.log(`Found: ${post.location_name}`);
  console.log(`Current status: ${post.status}`);
  
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
    console.error('❌ Failed to reset:', updateError.message);
    process.exit(1);
  }
  
  console.log(`\n✅ Post reset to 'scheduled'`);
}

resetPost();
