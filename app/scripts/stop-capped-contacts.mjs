#!/usr/bin/env node
/**
 * Mark all contacts that have reached their message cap as is_stopped=true
 */

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

async function stopCappedContacts() {
  console.log('🔍 Finding contacts at message cap...\n');

  // 1. Get all contacts at cap
  const { data: contacts, error: fetchError } = await supabase
    .from('elena_dm_contacts')
    .select('id, ig_username, stage, message_count')
    .or('and(stage.eq.cold,message_count.gte.15),and(stage.eq.warm,message_count.gte.25),and(stage.eq.hot,message_count.gte.35),and(stage.eq.pitched,message_count.gte.10)');

  if (fetchError) {
    console.error('❌ Error fetching contacts:', fetchError.message);
    process.exit(1);
  }

  console.log(`📊 Found ${contacts?.length || 0} contacts at cap\n`);

  if (!contacts || contacts.length === 0) {
    console.log('✅ No contacts to stop');
    return;
  }

  // Show top 10
  console.log('Top 10 most active:');
  const sorted = [...contacts].sort((a, b) => b.message_count - a.message_count);
  sorted.slice(0, 10).forEach(c => {
    console.log(`  @${c.ig_username} | ${c.stage} | ${c.message_count} msgs`);
  });
  console.log('');

  // 2. Update all by IDs
  const ids = contacts.map(c => c.id);
  
  const { error: updateError } = await supabase
    .from('elena_dm_contacts')
    .update({ 
      is_stopped: true, 
      stopped_at: new Date().toISOString() 
    })
    .in('id', ids);

  if (updateError) {
    console.error('❌ Error updating contacts:', updateError.message);
    process.exit(1);
  }

  console.log(`✅ Successfully marked ${ids.length} contacts as is_stopped=true`);
  console.log('   They will no longer receive responses.');
}

stopCappedContacts().catch(console.error);

