#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function auditColdWarm() {
  console.log('\n' + '═'.repeat(60));
  console.log('❄️🔥 AUDIT COLD & WARM CONVERSATIONS');
  console.log('═'.repeat(60));

  // Get cold contacts with most messages (stuck in cold)
  const { data: cold } = await supabase
    .from('elena_dm_contacts')
    .select('id, ig_username, message_count')
    .eq('stage', 'cold')
    .order('message_count', { ascending: false })
    .limit(10);

  // Get warm contacts with most messages
  const { data: warm } = await supabase
    .from('elena_dm_contacts')
    .select('id, ig_username, message_count')
    .eq('stage', 'warm')
    .order('message_count', { ascending: false })
    .limit(10);

  console.log('\n❄️  TOP COLD CONTACTS (les plus de messages sans progresser)\n');
  console.log('─'.repeat(60));

  for (const c of cold || []) {
    const { data: msgs } = await supabase
      .from('elena_dm_messages')
      .select('direction, content')
      .eq('contact_id', c.id)
      .order('created_at', { ascending: true })
      .limit(6);

    console.log(`\n@${c.ig_username || 'unknown'} | ${c.message_count} msgs (COLD)`);
    
    if (msgs && msgs.length > 0) {
      msgs.forEach(m => {
        const icon = m.direction === 'incoming' ? '👤' : '🤖';
        const content = m.content?.substring(0, 75) || '';
        console.log(`  ${icon} ${content}${m.content?.length > 75 ? '...' : ''}`);
      });
    }
  }

  console.log('\n\n🔥 TOP WARM CONTACTS (bloqués en warm)\n');
  console.log('─'.repeat(60));

  for (const c of warm || []) {
    const { data: msgs } = await supabase
      .from('elena_dm_messages')
      .select('direction, content')
      .eq('contact_id', c.id)
      .order('created_at', { ascending: true })
      .limit(8);

    console.log(`\n@${c.ig_username || 'unknown'} | ${c.message_count} msgs (WARM)`);
    
    if (msgs && msgs.length > 0) {
      msgs.forEach(m => {
        const icon = m.direction === 'incoming' ? '👤' : '🤖';
        const content = m.content?.substring(0, 75) || '';
        console.log(`  ${icon} ${content}${m.content?.length > 75 ? '...' : ''}`);
      });
    }
  }

  // Stats
  const { count: coldCount } = await supabase.from('elena_dm_contacts').select('*', { count: 'exact', head: true }).eq('stage', 'cold');
  const { count: warmCount } = await supabase.from('elena_dm_contacts').select('*', { count: 'exact', head: true }).eq('stage', 'warm');
  
  const coldAvg = cold?.reduce((a, c) => a + c.message_count, 0) / (cold?.length || 1);
  const warmAvg = warm?.reduce((a, c) => a + c.message_count, 0) / (warm?.length || 1);

  console.log('\n\n📊 STATS\n');
  console.log('─'.repeat(60));
  console.log(`Total COLD: ${coldCount} contacts`);
  console.log(`Total WARM: ${warmCount} contacts`);
  console.log(`Avg messages COLD (top 10): ${coldAvg.toFixed(1)}`);
  console.log(`Avg messages WARM (top 10): ${warmAvg.toFixed(1)}`);

  console.log('\n' + '═'.repeat(60));
  console.log('✅ AUDIT TERMINÉ');
  console.log('═'.repeat(60) + '\n');
}

auditColdWarm().catch(console.error);

