#!/usr/bin/env node
// ===========================================
// DM AUDIT — Last 4h + 48h Comparison (Deep Analysis)
// ===========================================
// Focus areas:
// 1. Messages since the fix (4h ago)
// 2. Conversations that started BEFORE the fix
// 3. Response coherence/quality analysis
// 4. Memory usage issues
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

// ===========================================
// AUDIT FUNCTIONS
// ===========================================

async function deepAudit() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 DEEP DM AUDIT — 4h Focus + 48h Context');
  console.log('='.repeat(70) + '\n');
  
  const now = new Date();
  const fourHoursAgo = new Date(now - 4 * 60 * 60 * 1000);
  const fortyEightHoursAgo = new Date(now - 48 * 60 * 60 * 1000);
  
  console.log(`⏰ Current time: ${now.toISOString()}`);
  console.log(`📅 4h window: ${fourHoursAgo.toISOString()} → ${now.toISOString()}`);
  console.log(`📅 48h window: ${fortyEightHoursAgo.toISOString()} → ${now.toISOString()}\n`);

  // ===========================================
  // 1. FETCH ALL DATA
  // ===========================================
  
  // Messages 48h
  const { data: messages48h, error: err1 } = await supabase
    .from('elena_dm_messages')
    .select('*, elena_dm_contacts(ig_username, ig_user_id, stage, message_count, is_stopped, created_at, detected_language)')
    .gte('created_at', fortyEightHoursAgo.toISOString())
    .order('created_at', { ascending: true });

  if (err1) {
    console.error('❌ Error fetching messages:', err1);
    return;
  }

  // All contacts
  const { data: contacts, error: err2 } = await supabase
    .from('elena_dm_contacts')
    .select('*')
    .order('last_contact_at', { ascending: false });

  if (err2) {
    console.error('❌ Error fetching contacts:', err2);
    return;
  }

  // Split by time window
  const messages4h = messages48h.filter(m => new Date(m.created_at) >= fourHoursAgo);
  const messagesBefore4h = messages48h.filter(m => new Date(m.created_at) < fourHoursAgo);

  // ===========================================
  // 2. OVERVIEW
  // ===========================================
  
  console.log('─'.repeat(70));
  console.log('📊 OVERVIEW');
  console.log('─'.repeat(70));
  
  console.log(`\n📈 Last 48h:`);
  console.log(`   Total messages: ${messages48h.length}`);
  console.log(`   Incoming: ${messages48h.filter(m => m.direction === 'incoming').length}`);
  console.log(`   Outgoing: ${messages48h.filter(m => m.direction === 'outgoing').length}`);
  
  console.log(`\n📈 Last 4h (SINCE FIX):`);
  console.log(`   Total messages: ${messages4h.length}`);
  console.log(`   Incoming: ${messages4h.filter(m => m.direction === 'incoming').length}`);
  console.log(`   Outgoing: ${messages4h.filter(m => m.direction === 'outgoing').length}`);
  
  console.log(`\n📈 Before fix (4h-48h):`);
  console.log(`   Total messages: ${messagesBefore4h.length}`);
  console.log(`   Incoming: ${messagesBefore4h.filter(m => m.direction === 'incoming').length}`);
  console.log(`   Outgoing: ${messagesBefore4h.filter(m => m.direction === 'outgoing').length}`);

  // ===========================================
  // 3. CONTACTS WITH ACTIVITY IN BOTH WINDOWS
  // ===========================================
  
  console.log('\n' + '─'.repeat(70));
  console.log('🔄 CONTACTS WITH ACTIVITY BEFORE AND AFTER FIX');
  console.log('─'.repeat(70));
  
  // Find contacts who had messages before fix AND after fix
  const contactsBefore = new Set(messagesBefore4h.map(m => m.contact_id));
  const contactsAfter = new Set(messages4h.map(m => m.contact_id));
  const contactsBoth = [...contactsBefore].filter(c => contactsAfter.has(c));
  
  console.log(`\n   Contacts active before fix: ${contactsBefore.size}`);
  console.log(`   Contacts active after fix: ${contactsAfter.size}`);
  console.log(`   Contacts active in BOTH windows: ${contactsBoth.length}`);
  
  if (contactsBoth.length > 0) {
    console.log('\n   ⚠️ These conversations SPAN the fix - may have inconsistencies:\n');
    
    for (const contactId of contactsBoth.slice(0, 10)) {
      const contactMsgs = messages48h.filter(m => m.contact_id === contactId);
      const msgsBefore = contactMsgs.filter(m => new Date(m.created_at) < fourHoursAgo);
      const msgsAfter = contactMsgs.filter(m => new Date(m.created_at) >= fourHoursAgo);
      const username = contactMsgs[0]?.elena_dm_contacts?.ig_username || 'unknown';
      const stage = contactMsgs[0]?.elena_dm_contacts?.stage || 'unknown';
      const isStopped = contactMsgs[0]?.elena_dm_contacts?.is_stopped;
      
      console.log(`   👤 @${username} (${stage}${isStopped ? ' - STOPPED' : ''})`);
      console.log(`      Before fix: ${msgsBefore.length} msgs | After fix: ${msgsAfter.length} msgs`);
      
      // Show last 3 messages before fix and first 3 after
      console.log(`      --- BEFORE FIX (last 3) ---`);
      msgsBefore.slice(-3).forEach(m => {
        const dir = m.direction === 'incoming' ? '📥' : '📤';
        const time = new Date(m.created_at).toLocaleTimeString('fr-FR');
        console.log(`      [${time}] ${dir} ${m.content?.substring(0, 50)}...`);
      });
      
      console.log(`      --- AFTER FIX (first 3) ---`);
      msgsAfter.slice(0, 3).forEach(m => {
        const dir = m.direction === 'incoming' ? '📥' : '📤';
        const time = new Date(m.created_at).toLocaleTimeString('fr-FR');
        console.log(`      [${time}] ${dir} ${m.content?.substring(0, 50)}...`);
      });
      console.log('');
    }
  }

  // ===========================================
  // 4. RESPONSE QUALITY ANALYSIS (4h window)
  // ===========================================
  
  console.log('─'.repeat(70));
  console.log('🧠 RESPONSE QUALITY ANALYSIS (Last 4h)');
  console.log('─'.repeat(70));
  
  const outgoingMessages4h = messages4h.filter(m => m.direction === 'outgoing');
  const incomingMessages4h = messages4h.filter(m => m.direction === 'incoming');
  
  // Categorize responses
  const shortResponses = outgoingMessages4h.filter(m => m.content?.length < 20);
  const genericResponses = outgoingMessages4h.filter(m => 
    /^hey\s*🖤?$/i.test(m.content?.trim()) ||
    /^salut\s*🖤?$/i.test(m.content?.trim()) ||
    m.content?.trim() === '🖤'
  );
  const fanvueResponses = outgoingMessages4h.filter(m => /fanvue/i.test(m.content));
  const questionResponses = outgoingMessages4h.filter(m => m.content?.includes('?'));
  
  console.log(`\n📤 Outgoing messages analysis (${outgoingMessages4h.length} total):`);
  console.log(`   - Very short (<20 chars): ${shortResponses.length} (${(shortResponses.length/outgoingMessages4h.length*100 || 0).toFixed(1)}%)`);
  console.log(`   - Generic greetings: ${genericResponses.length} (${(genericResponses.length/outgoingMessages4h.length*100 || 0).toFixed(1)}%)`);
  console.log(`   - Mentions Fanvue: ${fanvueResponses.length} (${(fanvueResponses.length/outgoingMessages4h.length*100 || 0).toFixed(1)}%)`);
  console.log(`   - Contains questions: ${questionResponses.length} (${(questionResponses.length/outgoingMessages4h.length*100 || 0).toFixed(1)}%)`);
  
  if (genericResponses.length > 0) {
    console.log('\n   ⚠️ Generic responses found:');
    genericResponses.slice(0, 5).forEach(m => {
      const username = m.elena_dm_contacts?.ig_username || 'unknown';
      const time = new Date(m.created_at).toLocaleTimeString('fr-FR');
      console.log(`      [${time}] @${username}: "${m.content}"`);
    });
  }
  
  if (shortResponses.length > 0) {
    console.log('\n   ⚠️ Very short responses:');
    shortResponses.slice(0, 5).forEach(m => {
      const username = m.elena_dm_contacts?.ig_username || 'unknown';
      const time = new Date(m.created_at).toLocaleTimeString('fr-FR');
      console.log(`      [${time}] @${username}: "${m.content}"`);
    });
  }

  // ===========================================
  // 5. CONVERSATION CONTEXT ANALYSIS
  // ===========================================
  
  console.log('\n' + '─'.repeat(70));
  console.log('💬 FULL CONVERSATION ANALYSIS (Last 4h - Active Contacts)');
  console.log('─'.repeat(70));
  
  // Group messages by contact
  const byContact = {};
  messages4h.forEach(msg => {
    const contactId = msg.contact_id;
    if (!byContact[contactId]) {
      byContact[contactId] = {
        username: msg.elena_dm_contacts?.ig_username || 'unknown',
        stage: msg.elena_dm_contacts?.stage || 'unknown',
        isStopped: msg.elena_dm_contacts?.is_stopped,
        totalMsgCount: msg.elena_dm_contacts?.message_count || 0,
        language: msg.elena_dm_contacts?.detected_language,
        contactCreated: msg.elena_dm_contacts?.created_at,
        messages: [],
      };
    }
    byContact[contactId].messages.push(msg);
  });
  
  const sortedContacts = Object.entries(byContact)
    .sort((a, b) => b[1].messages.length - a[1].messages.length);
  
  console.log(`\n📊 ${sortedContacts.length} contacts active in last 4h\n`);
  
  // Show top 10 most active
  for (const [contactId, data] of sortedContacts.slice(0, 15)) {
    const incoming = data.messages.filter(m => m.direction === 'incoming');
    const outgoing = data.messages.filter(m => m.direction === 'outgoing');
    
    // Check if conversation started before fix
    const contactCreatedDate = new Date(data.contactCreated);
    const startedBeforeFix = contactCreatedDate < fourHoursAgo;
    
    console.log(`${'─'.repeat(60)}`);
    console.log(`👤 @${data.username} | Stage: ${data.stage} | Lang: ${data.language || 'N/A'}`);
    console.log(`   Total msgs: ${data.totalMsgCount} | This window: ${data.messages.length} (📥${incoming.length}/📤${outgoing.length})`);
    console.log(`   ${startedBeforeFix ? '⚠️ STARTED BEFORE FIX' : '✅ Started after fix'} | ${data.isStopped ? '🛑 STOPPED' : '🟢 Active'}`);
    console.log('');
    
    // Show conversation
    data.messages.forEach(m => {
      const time = new Date(m.created_at).toLocaleTimeString('fr-FR');
      const dir = m.direction === 'incoming' ? '📥 USER' : '📤 ELENA';
      const content = m.content?.substring(0, 70) || '[empty]';
      const intent = m.intent ? ` [${m.intent}]` : '';
      console.log(`   [${time}] ${dir}: "${content}..."${intent}`);
    });
    console.log('');
  }

  // ===========================================
  // 6. INCOHERENCE DETECTION
  // ===========================================
  
  console.log('─'.repeat(70));
  console.log('🚨 POTENTIAL INCOHERENCES DETECTED');
  console.log('─'.repeat(70));
  
  const issues = [];
  
  for (const [contactId, data] of Object.entries(byContact)) {
    const messages = data.messages;
    
    // Issue 1: Same response repeated
    const outgoingMsgs = messages.filter(m => m.direction === 'outgoing');
    const contentCounts = {};
    outgoingMsgs.forEach(m => {
      const key = m.content?.toLowerCase().trim();
      contentCounts[key] = (contentCounts[key] || 0) + 1;
    });
    
    for (const [content, count] of Object.entries(contentCounts)) {
      if (count > 1) {
        issues.push({
          type: 'REPEATED_RESPONSE',
          username: data.username,
          content: content?.substring(0, 50),
          count,
        });
      }
    }
    
    // Issue 2: User asked something and Elena didn't answer
    for (let i = 0; i < messages.length - 1; i++) {
      const userMsg = messages[i];
      const elenaMsg = messages[i + 1];
      
      if (userMsg.direction === 'incoming' && elenaMsg.direction === 'outgoing') {
        // Check if user asked a question and Elena didn't address it
        const userAsked = userMsg.content?.includes('?') || 
          /\b(where|what|how|when|who|why|quoi|où|comment|quand|qui|pourquoi)\b/i.test(userMsg.content);
        
        const elenaGeneric = /^(hey|salut|coucou)\s*🖤?$/i.test(elenaMsg.content?.trim());
        
        if (userAsked && elenaGeneric) {
          issues.push({
            type: 'IGNORED_QUESTION',
            username: data.username,
            userQuestion: userMsg.content?.substring(0, 50),
            elenaResponse: elenaMsg.content?.substring(0, 50),
          });
        }
      }
    }
    
    // Issue 3: Language mismatch
    for (let i = 0; i < messages.length - 1; i++) {
      const userMsg = messages[i];
      const elenaMsg = messages[i + 1];
      
      if (userMsg.direction === 'incoming' && elenaMsg.direction === 'outgoing') {
        // Simple heuristic: user writes in French, Elena responds in English
        const userFrench = /\b(je|tu|il|elle|nous|vous|ils|elles|est|sont|avoir|être|faire|ça|c'est|merci)\b/i.test(userMsg.content);
        const elenaEnglish = /\b(I'm|you're|I am|you are|what's|how are|tell me|let me|do you|are you)\b/i.test(elenaMsg.content);
        
        if (userFrench && elenaEnglish) {
          issues.push({
            type: 'LANGUAGE_MISMATCH',
            username: data.username,
            userMsg: userMsg.content?.substring(0, 40),
            elenaMsg: elenaMsg.content?.substring(0, 40),
          });
        }
      }
    }
  }
  
  if (issues.length === 0) {
    console.log('\n✅ No major incoherences detected in the 4h window\n');
  } else {
    console.log(`\n⚠️ Found ${issues.length} potential issues:\n`);
    
    // Group by type
    const byType = {};
    issues.forEach(i => {
      byType[i.type] = byType[i.type] || [];
      byType[i.type].push(i);
    });
    
    for (const [type, typeIssues] of Object.entries(byType)) {
      console.log(`\n   🔴 ${type} (${typeIssues.length} occurrences):`);
      typeIssues.slice(0, 5).forEach(i => {
        if (type === 'REPEATED_RESPONSE') {
          console.log(`      @${i.username}: "${i.content}..." repeated ${i.count}x`);
        } else if (type === 'IGNORED_QUESTION') {
          console.log(`      @${i.username}:`);
          console.log(`         User: "${i.userQuestion}..."`);
          console.log(`         Elena: "${i.elenaResponse}..."`);
        } else if (type === 'LANGUAGE_MISMATCH') {
          console.log(`      @${i.username}:`);
          console.log(`         User (FR): "${i.userMsg}..."`);
          console.log(`         Elena (EN): "${i.elenaMsg}..."`);
        }
      });
    }
  }

  // ===========================================
  // 7. RECOMMENDATIONS
  // ===========================================
  
  console.log('\n' + '='.repeat(70));
  console.log('💡 RECOMMENDATIONS');
  console.log('='.repeat(70));
  
  console.log(`
Based on the audit:

1. CONVERSATIONS THAT SPAN THE FIX (${contactsBoth.length} contacts):
   - These had state from before the fix that may cause issues
   - Consider: Reset their stage to 'cold' but keep message history
   - This gives them a fresh funnel experience

2. RESPONSE QUALITY:
   - Generic responses: ${genericResponses.length}
   - Short responses: ${shortResponses.length}
   - These may indicate the AI is not engaging properly

3. INCOHERENCES FOUND: ${issues.length}
   - Repeated responses: ${issues.filter(i => i.type === 'REPEATED_RESPONSE').length}
   - Ignored questions: ${issues.filter(i => i.type === 'IGNORED_QUESTION').length}
   - Language mismatches: ${issues.filter(i => i.type === 'LANGUAGE_MISMATCH').length}

4. CONTACTS TO POTENTIALLY RESET:
`);

  // List contacts that should be reset
  const contactsToReset = contacts.filter(c => {
    // Criteria: active before fix, not converted, has issues
    const hadMsgsBefore = messagesBefore4h.some(m => m.contact_id === c.id);
    const hadMsgsAfter = messages4h.some(m => m.contact_id === c.id);
    const hasIssues = issues.some(i => i.username === c.ig_username);
    
    return hadMsgsBefore && hadMsgsAfter && !c.is_stopped && 
      !['converted', 'paid'].includes(c.stage);
  });
  
  console.log(`   Found ${contactsToReset.length} contacts that may benefit from a funnel reset:`);
  contactsToReset.slice(0, 10).forEach(c => {
    console.log(`   - @${c.ig_username} (${c.stage}, ${c.message_count} msgs)`);
  });
  
  console.log('\n' + '='.repeat(70) + '\n');
}

// ===========================================
// RUN
// ===========================================

deepAudit().catch(console.error);
