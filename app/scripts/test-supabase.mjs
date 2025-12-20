/**
 * Test Supabase Connection
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function test() {
  console.log('\n🔌 Testing Supabase connection...');
  console.log('   URL:', process.env.SUPABASE_URL?.substring(0, 35) + '...');
  
  // Test 1: fetch characters
  const { data: characters, error } = await supabase
    .from('characters')
    .select('name, full_name, instagram_handle');
  
  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }
  
  console.log('\n✅ Connected! Characters found:');
  characters.forEach(c => console.log('   -', c.full_name, '(' + c.instagram_handle + ')'));
  
  // Test 2: fetch timeline
  const { data: timeline } = await supabase
    .from('timeline_events')
    .select('title, event_date')
    .order('event_date', { ascending: false })
    .limit(5);
  
  console.log('\n📅 Timeline events:', timeline?.length || 0);
  timeline?.forEach(e => console.log('   -', e.event_date, ':', e.title));
  
  // Test 3: fetch relationship
  const { data: rel } = await supabase
    .from('relationships')
    .select('*')
    .single();
  
  if (rel) {
    console.log('\n💕 Relationship:', rel.character_1, 'x', rel.character_2);
    console.log('   How they met:', rel.how_they_met?.substring(0, 50) + '...');
    console.log('   Inside jokes:', rel.inside_jokes?.length || 0);
    console.log('   Shared memories:', rel.shared_memories?.length || 0);
  }

  // Test 4: fetch caption templates
  const { data: templates } = await supabase
    .from('caption_templates')
    .select('character, category')
    .limit(10);
  
  console.log('\n📝 Caption templates:', templates?.length || 0);
  
  console.log('\n✅ Supabase is ready!\n');
}

test().catch(console.error);

