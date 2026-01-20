#!/usr/bin/env node
// ===========================================
// RESET ALL STOPPED CONTACTS — Fresh Start
// ===========================================
// Resets all stopped contacts to:
// - is_stopped = false
// - stage = 'cold'
// - Clear pitch/followup flags
// - Keep message history for context
// ===========================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function resetStoppedContacts() {
  console.log('\n' + '='.repeat(70));
  console.log('🔄 RESET ALL STOPPED CONTACTS — Fresh Start');
  console.log('='.repeat(70) + '\n');

  // 1. Get all stopped contacts
  const { data: stoppedContacts, error: fetchError } = await supabase
    .from('elena_dm_contacts')
    .select('id, ig_username, stage, message_count, stopped_at, fanvue_pitched_at')
    .eq('is_stopped', true)
    .order('stopped_at', { ascending: false });

  if (fetchError) {
    console.error('❌ Error fetching stopped contacts:', fetchError);
    return;
  }

  if (!stoppedContacts || stoppedContacts.length === 0) {
    console.log('✅ No stopped contacts to reset');
    return;
  }

  console.log(`📊 Found ${stoppedContacts.length} stopped contacts to reset\n`);

  // Show what we're about to reset
  console.log('─'.repeat(70));
  console.log('📋 Contacts to reset:');
  console.log('─'.repeat(70));
  console.log('   Username              | Stage    | Msgs | Stopped At');
  console.log('   ' + '─'.repeat(55));
  
  stoppedContacts.slice(0, 30).forEach(c => {
    const stoppedDate = c.stopped_at ? new Date(c.stopped_at).toLocaleDateString('fr-FR') : 'N/A';
    console.log(`   @${(c.ig_username || c.id.substring(0, 8)).padEnd(20)} | ${(c.stage || 'N/A').padEnd(8)} | ${String(c.message_count || 0).padStart(4)} | ${stoppedDate}`);
  });
  
  if (stoppedContacts.length > 30) {
    console.log(`   ... and ${stoppedContacts.length - 30} more`);
  }

  // 2. Perform the reset
  console.log('\n' + '─'.repeat(70));
  console.log('🔄 Resetting contacts...');
  console.log('─'.repeat(70));

  const { data: updated, error: updateError } = await supabase
    .from('elena_dm_contacts')
    .update({
      is_stopped: false,
      stopped_at: null,
      stage: 'cold',
      fanvue_pitched_at: null,
      followup_scheduled_at: null,
      followup_sent: false,
      // Keep message_count to preserve history context
      // Keep detected_language to maintain language preference
    })
    .eq('is_stopped', true)
    .select('id, ig_username');

  if (updateError) {
    console.error('❌ Error resetting contacts:', updateError);
    return;
  }

  console.log(`\n✅ Successfully reset ${updated?.length || 0} contacts!\n`);

  // 3. Verify the reset
  const { data: verification } = await supabase
    .from('elena_dm_contacts')
    .select('stage, is_stopped')
    .in('id', stoppedContacts.map(c => c.id));

  const stillStopped = verification?.filter(c => c.is_stopped).length || 0;
  const nowCold = verification?.filter(c => c.stage === 'cold').length || 0;

  console.log('─'.repeat(70));
  console.log('📊 Verification:');
  console.log('─'.repeat(70));
  console.log(`   Contacts reset: ${updated?.length || 0}`);
  console.log(`   Now in 'cold' stage: ${nowCold}`);
  console.log(`   Still stopped (should be 0): ${stillStopped}`);

  if (stillStopped > 0) {
    console.log('\n⚠️ WARNING: Some contacts are still stopped!');
  } else {
    console.log('\n✅ All contacts successfully reset to cold stage');
  }

  // 4. Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESET SUMMARY');
  console.log('='.repeat(70));
  console.log(`
   🔄 Total contacts reset: ${updated?.length || 0}
   📈 All now in stage: COLD
   ✅ is_stopped: false
   
   📌 What was kept:
   - Message history (for AI context)
   - Detected language preference
   - Message count
   
   📌 What was cleared:
   - Stage → reset to 'cold'
   - fanvue_pitched_at → null
   - followup_scheduled_at → null
   - followup_sent → false
   - is_stopped → false
   
   💡 These contacts will now receive responses again and go through
      the full funnel from the beginning, but the AI will have their
      conversation history for context.
`);
  console.log('='.repeat(70) + '\n');
}

resetStoppedContacts().catch(console.error);
