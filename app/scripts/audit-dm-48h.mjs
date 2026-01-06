#!/usr/bin/env node
// ===========================================
// DM AUDIT — Last 48h Analysis
// ===========================================
// Checks for:
// 1. Duplicate messages to same contact
// 2. Same message repeated
// 3. Fanvue link spammed
// 4. Race condition patterns
// ===========================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// ===========================================
// SUPABASE CLIENT
// ===========================================

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ===========================================
// AUDIT FUNCTIONS
// ===========================================

async function auditLast48Hours() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 DM AUDIT — Last 48 Hours');
  console.log('='.repeat(60) + '\n');
  
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  console.log(`📅 Analyzing messages since: ${since}\n`);

  // ===========================================
  // 1. FETCH ALL MESSAGES IN LAST 48H
  // ===========================================
  
  const { data: messages, error } = await supabase
    .from('elena_dm_messages')
    .select('*, elena_dm_contacts(ig_username, ig_user_id)')
    .gte('created_at', since)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Error fetching messages:', error);
    return;
  }

  console.log(`📊 Total messages in last 48h: ${messages.length}`);
  
  const incoming = messages.filter(m => m.direction === 'incoming');
  const outgoing = messages.filter(m => m.direction === 'outgoing');
  
  console.log(`   - Incoming: ${incoming.length}`);
  console.log(`   - Outgoing: ${outgoing.length}\n`);

  // ===========================================
  // 2. GROUP BY CONTACT
  // ===========================================
  
  const byContact = {};
  messages.forEach(msg => {
    const contactId = msg.contact_id;
    const username = msg.elena_dm_contacts?.ig_username || 'unknown';
    if (!byContact[contactId]) {
      byContact[contactId] = {
        username,
        messages: [],
        outgoing: [],
        incoming: [],
      };
    }
    byContact[contactId].messages.push(msg);
    if (msg.direction === 'outgoing') {
      byContact[contactId].outgoing.push(msg);
    } else {
      byContact[contactId].incoming.push(msg);
    }
  });

  const contactCount = Object.keys(byContact).length;
  console.log(`👥 Unique contacts in last 48h: ${contactCount}\n`);

  // ===========================================
  // ISSUE 1: DUPLICATE OUTGOING MESSAGES
  // ===========================================
  
  console.log('─'.repeat(60));
  console.log('🔴 ISSUE 1: DUPLICATE OUTGOING MESSAGES');
  console.log('─'.repeat(60));
  
  const duplicateIssues = [];
  
  for (const [contactId, data] of Object.entries(byContact)) {
    const { username, outgoing } = data;
    
    // Check for consecutive identical messages
    for (let i = 1; i < outgoing.length; i++) {
      const prev = outgoing[i - 1];
      const curr = outgoing[i];
      
      if (prev.content === curr.content) {
        const timeDiff = new Date(curr.created_at) - new Date(prev.created_at);
        const timeDiffSec = Math.round(timeDiff / 1000);
        
        duplicateIssues.push({
          username,
          contactId,
          content: curr.content.substring(0, 80),
          timeDiffSec,
          firstSent: prev.created_at,
          secondSent: curr.created_at,
        });
      }
    }
  }
  
  if (duplicateIssues.length === 0) {
    console.log('✅ No consecutive duplicate messages found\n');
  } else {
    console.log(`⚠️ Found ${duplicateIssues.length} duplicate message issues:\n`);
    duplicateIssues.forEach((issue, i) => {
      console.log(`   ${i + 1}. @${issue.username}`);
      console.log(`      Message: "${issue.content}..."`);
      console.log(`      Gap: ${issue.timeDiffSec}s`);
      console.log(`      First: ${issue.firstSent}`);
      console.log(`      Second: ${issue.secondSent}\n`);
    });
  }

  // ===========================================
  // ISSUE 2: SAME MESSAGE REPEATED (non-consecutive)
  // ===========================================
  
  console.log('─'.repeat(60));
  console.log('🔴 ISSUE 2: SAME MESSAGE REPEATED (non-consecutive)');
  console.log('─'.repeat(60));
  
  const repeatIssues = [];
  
  for (const [contactId, data] of Object.entries(byContact)) {
    const { username, outgoing } = data;
    
    // Count occurrences of each message
    const messageCount = {};
    outgoing.forEach(msg => {
      const key = msg.content.trim().toLowerCase();
      if (!messageCount[key]) {
        messageCount[key] = { count: 0, content: msg.content, timestamps: [] };
      }
      messageCount[key].count++;
      messageCount[key].timestamps.push(msg.created_at);
    });
    
    // Find messages sent more than once
    for (const [key, val] of Object.entries(messageCount)) {
      if (val.count > 1) {
        repeatIssues.push({
          username,
          contactId,
          content: val.content.substring(0, 80),
          count: val.count,
          timestamps: val.timestamps,
        });
      }
    }
  }
  
  if (repeatIssues.length === 0) {
    console.log('✅ No repeated messages found\n');
  } else {
    console.log(`⚠️ Found ${repeatIssues.length} repeated message patterns:\n`);
    repeatIssues.forEach((issue, i) => {
      console.log(`   ${i + 1}. @${issue.username} — ${issue.count}x`);
      console.log(`      Message: "${issue.content}..."`);
      console.log(`      Times: ${issue.timestamps.map(t => new Date(t).toLocaleTimeString()).join(', ')}\n`);
    });
  }

  // ===========================================
  // ISSUE 3: FANVUE LINK SPAMMED
  // ===========================================
  
  console.log('─'.repeat(60));
  console.log('🔴 ISSUE 3: FANVUE LINK SPAMMED');
  console.log('─'.repeat(60));
  
  const fanvueLinkPattern = /fanvue\.com/i;
  const fanvueSpamIssues = [];
  
  for (const [contactId, data] of Object.entries(byContact)) {
    const { username, outgoing } = data;
    
    const fanvueMessages = outgoing.filter(msg => fanvueLinkPattern.test(msg.content));
    
    if (fanvueMessages.length > 2) {
      fanvueSpamIssues.push({
        username,
        contactId,
        count: fanvueMessages.length,
        messages: fanvueMessages.map(m => ({
          content: m.content.substring(0, 60),
          time: m.created_at,
        })),
      });
    }
  }
  
  if (fanvueSpamIssues.length === 0) {
    console.log('✅ No Fanvue link spam detected (max 2 per contact)\n');
  } else {
    console.log(`⚠️ Found ${fanvueSpamIssues.length} contacts with Fanvue link spam:\n`);
    fanvueSpamIssues.forEach((issue, i) => {
      console.log(`   ${i + 1}. @${issue.username} — ${issue.count} Fanvue links`);
      issue.messages.forEach((m, j) => {
        console.log(`      ${j + 1}. [${new Date(m.time).toLocaleTimeString()}] "${m.content}..."`);
      });
      console.log();
    });
  }

  // ===========================================
  // ISSUE 4: RAPID-FIRE RESPONSES (Race condition)
  // ===========================================
  
  console.log('─'.repeat(60));
  console.log('🔴 ISSUE 4: RAPID-FIRE RESPONSES (< 5s between outgoing)');
  console.log('─'.repeat(60));
  
  const rapidFireIssues = [];
  
  for (const [contactId, data] of Object.entries(byContact)) {
    const { username, outgoing } = data;
    
    for (let i = 1; i < outgoing.length; i++) {
      const prev = outgoing[i - 1];
      const curr = outgoing[i];
      const timeDiff = new Date(curr.created_at) - new Date(prev.created_at);
      const timeDiffSec = timeDiff / 1000;
      
      if (timeDiffSec < 5 && timeDiffSec > 0) {
        rapidFireIssues.push({
          username,
          contactId,
          timeDiffSec: timeDiffSec.toFixed(1),
          first: prev.content.substring(0, 40),
          second: curr.content.substring(0, 40),
          firstTime: prev.created_at,
          secondTime: curr.created_at,
        });
      }
    }
  }
  
  if (rapidFireIssues.length === 0) {
    console.log('✅ No rapid-fire responses detected\n');
  } else {
    console.log(`⚠️ Found ${rapidFireIssues.length} rapid-fire response patterns:\n`);
    rapidFireIssues.forEach((issue, i) => {
      console.log(`   ${i + 1}. @${issue.username} — ${issue.timeDiffSec}s gap`);
      console.log(`      First: "${issue.first}..."`);
      console.log(`      Second: "${issue.second}..."`);
      console.log(`      Time: ${new Date(issue.firstTime).toLocaleTimeString()} → ${new Date(issue.secondTime).toLocaleTimeString()}\n`);
    });
  }

  // ===========================================
  // ISSUE 5: ANALYZE WORST CONVERSATIONS
  // ===========================================
  
  console.log('─'.repeat(60));
  console.log('📋 DETAILED CONVERSATION ANALYSIS — Worst Cases');
  console.log('─'.repeat(60));
  
  // Find contacts with issues
  const issueContactIds = new Set([
    ...duplicateIssues.map(i => i.contactId),
    ...repeatIssues.map(i => i.contactId),
    ...fanvueSpamIssues.map(i => i.contactId),
    ...rapidFireIssues.map(i => i.contactId),
  ]);
  
  if (issueContactIds.size === 0) {
    console.log('\n✅ No problematic conversations to analyze\n');
  } else {
    console.log(`\n🔍 Analyzing ${issueContactIds.size} problematic conversations:\n`);
    
    for (const contactId of Array.from(issueContactIds).slice(0, 5)) {
      const data = byContact[contactId];
      console.log(`\n${'─'.repeat(50)}`);
      console.log(`👤 @${data.username} (${data.messages.length} messages)`);
      console.log(`${'─'.repeat(50)}`);
      
      // Show conversation timeline
      data.messages.slice(-20).forEach(msg => {
        const time = new Date(msg.created_at).toLocaleTimeString();
        const dir = msg.direction === 'incoming' ? '📨 USER' : '🤖 ELENA';
        const content = msg.content.substring(0, 60);
        const hasFanvue = fanvueLinkPattern.test(msg.content) ? ' [FANVUE]' : '';
        console.log(`   [${time}] ${dir}: "${content}..."${hasFanvue}`);
      });
    }
  }

  // ===========================================
  // SUMMARY
  // ===========================================
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 AUDIT SUMMARY');
  console.log('='.repeat(60));
  
  const totalIssues = duplicateIssues.length + repeatIssues.length + fanvueSpamIssues.length + rapidFireIssues.length;
  
  console.log(`\n   Messages analyzed: ${messages.length}`);
  console.log(`   Contacts in period: ${contactCount}`);
  console.log(`   Total issues found: ${totalIssues}`);
  console.log();
  console.log(`   - Consecutive duplicates: ${duplicateIssues.length}`);
  console.log(`   - Repeated messages: ${repeatIssues.length}`);
  console.log(`   - Fanvue link spam: ${fanvueSpamIssues.length}`);
  console.log(`   - Rapid-fire responses: ${rapidFireIssues.length}`);
  
  if (totalIssues > 0) {
    console.log('\n⚠️ ISSUES DETECTED — Review the logs above for details');
  } else {
    console.log('\n✅ NO ISSUES DETECTED — DM system is healthy');
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

// ===========================================
// RUN
// ===========================================

auditLast48Hours().catch(console.error);

