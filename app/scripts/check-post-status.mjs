import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkPost() {
  const now = new Date();
  const parisTimeStr = now.toLocaleString('en-US', { timeZone: 'Europe/Paris' });
  const parisTime = new Date(parisTimeStr);
  const today = `${parisTime.getFullYear()}-${String(parisTime.getMonth() + 1).padStart(2, '0')}-${String(parisTime.getDate()).padStart(2, '0')}`;
  
  const { data: posts } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('character', 'elena')
    .eq('scheduled_date', today)
    .order('scheduled_time');
  
  console.log(`📅 Posts for ${today}:\n`);
  for (const post of posts || []) {
    console.log(`⏰ ${post.scheduled_time} - ${post.location_name}`);
    console.log(`   Status: ${post.status}`);
    console.log(`   Images: ${post.image_urls?.length || 0}`);
    if (post.image_urls?.length) {
      post.image_urls.forEach((url, i) => console.log(`     ${i+1}. ${url.substring(0, 80)}...`));
    }
    if (post.generation_started_at) {
      const elapsed = Math.round((Date.now() - new Date(post.generation_started_at).getTime()) / 60000);
      console.log(`   Generating since: ${elapsed} minutes`);
    }
    if (post.error_message) console.log(`   Error: ${post.error_message}`);
    console.log('');
  }
}
checkPost();
