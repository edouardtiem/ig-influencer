#!/usr/bin/env node
/**
 * DM Bug Audit 2026-01-09
 * 
 * Bug 1: Fanvue link sent infinitely after funnel end
 * Bug 2: Duplicates when user sends multiple messages in a row
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function auditBugs() {
  console.log('=== DM BUG AUDIT 2026-01-09 ===\n');
  
  // ========================================
  // BUG 1: Fanvue link spam after is_stopped
  // ========================================
  console.log('\n📌 BUG 1: Fanvue link sent after contact was stopped\n');
  
  // Get all stopped contacts
  const { data: stoppedContacts } = await supabase
    .from('elena_dm_contacts')
    .select('id, ig_username, is_stopped, stopped_at, message_count')
    .eq('is_stopped', true);
  
  console.log(`Stopped contacts: ${stoppedContacts?.length || 0}`);
  
  let fanvueBugs = [];
  
  for (const contact of stoppedContacts || []) {
    if (!contact.stopped_at) continue;
    
    // Get messages sent AFTER the contact was stopped
    const { data: messagesAfterStop } = await supabase
      .from('elena_dm_messages')
      .select('*')
      .eq('contact_id', contact.id)
      .gt('created_at', contact.stopped_at)
      .order('created_at', { ascending: true });
    
    if (messagesAfterStop?.length > 0) {
      const fanvueMessages = messagesAfterStop.filter(m => 
        m.direction === 'outgoing' && m.content.toLowerCase().includes('fanvue')
      );
      
      if (fanvueMessages.length > 0) {
        fanvueBugs.push({
          username: contact.ig_username,
          stopped_at: contact.stopped_at,
          messages_after_stop: messagesAfterStop.length,
          fanvue_messages_after_stop: fanvueMessages.length,
          all_after_stop: messagesAfterStop.map(m => ({
            direction: m.direction,
            content: m.content.substring(0, 80),
            time: m.created_at
          }))
        });
      }
    }
  }
  
  if (fanvueBugs.length === 0) {
    console.log('✅ No Fanvue spam after stop found');
  } else {
    console.log(`❌ Found ${fanvueBugs.length} contacts with Fanvue spam after stop:`);
    for (const bug of fanvueBugs) {
      console.log(`\n@${bug.username}:`);
      console.log(`  Stopped at: ${new Date(bug.stopped_at).toLocaleString('fr-FR')}`);
      console.log(`  Messages after stop: ${bug.messages_after_stop}`);
      console.log(`  Fanvue links after stop: ${bug.fanvue_messages_after_stop}`);
      console.log('  Timeline:');
      for (const m of bug.all_after_stop) {
        console.log(`    ${m.direction === 'incoming' ? '→' : '←'} ${new Date(m.time).toLocaleString('fr-FR')}: "${m.content}..."`);
      }
    }
  }
  
  // ========================================
  // BUG 2: Rapid-fire duplicates when user sends multiple messages
  // ========================================
  console.log('\n\n📌 BUG 2: Duplicates when user sends multiple messages quickly\n');
  
  // Get all recent contacts
  const { data: recentContacts } = await supabase
    .from('elena_dm_contacts')
    .select('id, ig_username')
    .gte('last_contact_at', '2026-01-07T00:00:00.000Z');
  
  console.log(`Recent contacts (since Jan 7): ${recentContacts?.length || 0}`);
  
  let rapidFireBugs = [];
  
  for (const contact of recentContacts || []) {
    const { data: messages } = await supabase
      .from('elena_dm_messages')
      .select('*')
      .eq('contact_id', contact.id)
      .gte('created_at', '2026-01-07T00:00:00.000Z')
      .order('created_at', { ascending: true });
    
    if (!messages?.length) continue;
    
    // Look for pattern: IN, IN, OUT, OUT (rapid fire messages getting double responses)
    for (let i = 0; i < messages.length - 3; i++) {
      const m1 = messages[i];
      const m2 = messages[i + 1];
      const m3 = messages[i + 2];
      const m4 = messages[i + 3];
      
      // Pattern: IN, IN within 60s, followed by OUT, OUT within 60s
      if (m1.direction === 'incoming' && m2.direction === 'incoming' && 
          m3.direction === 'outgoing' && m4.direction === 'outgoing') {
        
        const inDiff = new Date(m2.created_at).getTime() - new Date(m1.created_at).getTime();
        const outDiff = new Date(m4.created_at).getTime() - new Date(m3.created_at).getTime();
        
        if (inDiff < 60000 && outDiff < 120000) { // User sent 2 within 1min, we responded 2x within 2min
          rapidFireBugs.push({
            username: contact.ig_username,
            in1: { content: m1.content.substring(0, 40), time: m1.created_at },
            in2: { content: m2.content.substring(0, 40), time: m2.created_at },
            out1: { content: m3.content.substring(0, 40), time: m3.created_at },
            out2: { content: m4.content.substring(0, 40), time: m4.created_at },
            inDiff: Math.round(inDiff / 1000),
            outDiff: Math.round(outDiff / 1000)
          });
        }
      }
    }
    
    // Also look for: Multiple INs followed by single OUT (correct behavior) vs multiple OUTs
    // Check if IN IN IN gets multiple OUTs
    let consecutiveIns = [];
    let consecutiveOuts = [];
    let lastDirection = null;
    
    for (const m of messages) {
      if (m.direction !== lastDirection) {
        // Direction changed
        if (consecutiveIns.length >= 2 && consecutiveOuts.length >= 2) {
          // BUG: Multiple INs got multiple OUTs
          const firstIn = new Date(consecutiveIns[0]).getTime();
          const lastIn = new Date(consecutiveIns[consecutiveIns.length - 1]).getTime();
          if (lastIn - firstIn < 300000) { // All INs within 5 min
            rapidFireBugs.push({
              username: contact.ig_username,
              type: 'MULTI_IN_MULTI_OUT',
              inCount: consecutiveIns.length,
              outCount: consecutiveOuts.length,
              firstIn: consecutiveIns[0],
              lastIn: consecutiveIns[consecutiveIns.length - 1]
            });
          }
        }
        
        if (m.direction === 'incoming') {
          consecutiveIns = [m.created_at];
          consecutiveOuts = [];
        } else {
          consecutiveOuts = [m.created_at];
        }
      } else {
        // Same direction
        if (m.direction === 'incoming') {
          consecutiveIns.push(m.created_at);
        } else {
          consecutiveOuts.push(m.created_at);
        }
      }
      lastDirection = m.direction;
    }
  }
  
  if (rapidFireBugs.length === 0) {
    console.log('✅ No rapid-fire duplicate bugs found');
  } else {
    console.log(`❌ Found ${rapidFireBugs.length} rapid-fire duplicate cases:`);
    for (const bug of rapidFireBugs) {
      if (bug.type === 'MULTI_IN_MULTI_OUT') {
        console.log(`\n@${bug.username}: ${bug.inCount} INs → ${bug.outCount} OUTs`);
      } else {
        console.log(`\n@${bug.username}:`);
        console.log(`  IN1 (${bug.in1.time}): "${bug.in1.content}..."`);
        console.log(`  IN2 (+${bug.inDiff}s): "${bug.in2.content}..."`);
        console.log(`  OUT1: "${bug.out1.content}..."`);
        console.log(`  OUT2 (+${bug.outDiff}s): "${bug.out2.content}..."`);
      }
    }
  }
  
  // ========================================
  // Check contacts with excessive Fanvue links
  // ========================================
  console.log('\n\n📌 Contacts with >2 Fanvue links sent:\n');
  
  const { data: allContacts } = await supabase
    .from('elena_dm_contacts')
    .select('id, ig_username, message_count');
  
  let excessiveFanvue = [];
  
  for (const contact of allContacts || []) {
    const { data: fanvueMessages } = await supabase
      .from('elena_dm_messages')
      .select('content, created_at')
      .eq('contact_id', contact.id)
      .eq('direction', 'outgoing')
      .ilike('content', '%fanvue.com%');
    
    if (fanvueMessages && fanvueMessages.length > 2) {
      excessiveFanvue.push({
        username: contact.ig_username,
        fanvueCount: fanvueMessages.length,
        totalMessages: contact.message_count,
        messages: fanvueMessages.map(m => ({
          content: m.content.substring(0, 60),
          time: m.created_at
        }))
      });
    }
  }
  
  if (excessiveFanvue.length === 0) {
    console.log('✅ No contacts with >2 Fanvue links');
  } else {
    console.log(`⚠️ Found ${excessiveFanvue.length} contacts with >2 Fanvue links:`);
    for (const c of excessiveFanvue.sort((a, b) => b.fanvueCount - a.fanvueCount).slice(0, 10)) {
      console.log(`\n@${c.username}: ${c.fanvueCount} Fanvue links (${c.totalMessages} total msgs)`);
      for (const m of c.messages) {
        console.log(`  ${new Date(m.time).toLocaleString('fr-FR')}: "${m.content}..."`);
      }
    }
  }
  
  // ========================================
  // Summary
  // ========================================
  console.log('\n\n=== SUMMARY ===');
  console.log(`Bug 1 (Fanvue after stop): ${fanvueBugs.length} cases`);
  console.log(`Bug 2 (Rapid-fire dupes): ${rapidFireBugs.length} cases`);
  console.log(`Excessive Fanvue (>2): ${excessiveFanvue.length} contacts`);
}

auditBugs().catch(console.error);
