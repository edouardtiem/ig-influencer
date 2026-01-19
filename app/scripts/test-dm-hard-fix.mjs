#!/usr/bin/env node
// ===========================================
// TEST SCRIPT — Hard Fix DM Bugs
// ===========================================
// Tests various scenarios to identify bugs
// Usage: node scripts/test-dm-hard-fix.mjs
// ===========================================

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

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ig-influencer.vercel.app';

// ===========================================
// TEST UTILITIES
// ===========================================

function log(emoji, msg) {
  console.log(`${emoji} ${msg}`);
}

function section(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 ${title}`);
  console.log('='.repeat(60));
}

// ===========================================
// TEST 1: Check contacts with high message count
// ===========================================

async function testHighMessageCountContacts() {
  section('TEST 1: Contacts avec 100+ messages');
  
  const { data: contacts, error } = await supabase
    .from('elena_dm_contacts')
    .select('id, ig_username, stage, message_count, our_message_count, is_stopped, stopped_at')
    .gte('message_count', 100)
    .order('message_count', { ascending: false })
    .limit(10);
  
  if (error) {
    log('❌', `Erreur: ${error.message}`);
    return;
  }
  
  if (contacts.length === 0) {
    log('✅', 'Aucun contact avec 100+ messages');
    return;
  }
  
  log('⚠️', `${contacts.length} contacts avec 100+ messages:`);
  
  for (const c of contacts) {
    const status = c.is_stopped ? '🛑 STOPPED' : '⚠️ ACTIF';
    log('  ', `@${c.ig_username}: ${c.message_count} msgs, stage=${c.stage}, ${status}`);
    
    // Vérifier le vrai nombre de messages dans la DB
    const { count } = await supabase
      .from('elena_dm_messages')
      .select('*', { count: 'exact', head: true })
      .eq('contact_id', c.id);
    
    if (count !== c.message_count) {
      log('🐛', `  BUG: message_count=${c.message_count} mais DB a ${count} messages`);
    }
  }
}

// ===========================================
// TEST 2: Check STOPPED contacts still receiving messages
// ===========================================

async function testStoppedContactsReceivingMessages() {
  section('TEST 2: Contacts STOPPED avec messages récents');
  
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  // Get stopped contacts
  const { data: stoppedContacts } = await supabase
    .from('elena_dm_contacts')
    .select('id, ig_username, is_stopped, stopped_at')
    .eq('is_stopped', true)
    .limit(50);
  
  if (!stoppedContacts || stoppedContacts.length === 0) {
    log('ℹ️', 'Aucun contact STOPPED');
    return;
  }
  
  log('ℹ️', `${stoppedContacts.length} contacts STOPPED trouvés`);
  
  let bugsFound = 0;
  for (const c of stoppedContacts) {
    // Check for messages AFTER stopped_at
    if (c.stopped_at) {
      const { data: messagesAfterStop } = await supabase
        .from('elena_dm_messages')
        .select('id, direction, content, created_at')
        .eq('contact_id', c.id)
        .gt('created_at', c.stopped_at)
        .eq('direction', 'outgoing')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (messagesAfterStop && messagesAfterStop.length > 0) {
        log('🐛', `@${c.ig_username}: ${messagesAfterStop.length} messages envoyés APRÈS stop!`);
        messagesAfterStop.forEach(m => {
          log('  ', `"${m.content.substring(0, 50)}..." à ${new Date(m.created_at).toLocaleString()}`);
        });
        bugsFound++;
      }
    }
  }
  
  if (bugsFound === 0) {
    log('✅', 'Aucun contact STOPPED n\'a reçu de message après stop');
  }
}

// ===========================================
// TEST 3: Check exit message loops
// ===========================================

async function testExitMessageLoops() {
  section('TEST 3: Exit messages en boucle');
  
  // Find contacts with multiple exit messages
  const { data: contacts } = await supabase
    .from('elena_dm_contacts')
    .select('id, ig_username')
    .limit(100);
  
  let loopsFound = 0;
  const exitPatterns = [
    'shooting dans 5 min',
    'je file bébé',
    'mon manager m\'appelle',
    'je dois y aller',
    'plus le temps ici',
    'désolée je dois filer'
  ];
  
  for (const c of contacts || []) {
    const { data: messages } = await supabase
      .from('elena_dm_messages')
      .select('content, created_at')
      .eq('contact_id', c.id)
      .eq('direction', 'outgoing')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (!messages) continue;
    
    // Count exit messages
    const exitMessages = messages.filter(m => 
      exitPatterns.some(p => m.content.toLowerCase().includes(p))
    );
    
    if (exitMessages.length > 1) {
      log('🐛', `@${c.ig_username}: ${exitMessages.length} exit messages!`);
      exitMessages.forEach(m => {
        log('  ', `"${m.content.substring(0, 50)}..."`);
      });
      loopsFound++;
    }
  }
  
  if (loopsFound === 0) {
    log('✅', 'Aucune boucle d\'exit messages détectée');
  } else {
    log('⚠️', `${loopsFound} contacts avec exit messages en boucle`);
  }
}

// ===========================================
// TEST 4: Check "hey 🖤" loops
// ===========================================

async function testHeyLoops() {
  section('TEST 4: Boucles "hey 🖤"');
  
  const { data: contacts } = await supabase
    .from('elena_dm_contacts')
    .select('id, ig_username')
    .limit(100);
  
  let loopsFound = 0;
  
  for (const c of contacts || []) {
    const { data: messages } = await supabase
      .from('elena_dm_messages')
      .select('content, created_at')
      .eq('contact_id', c.id)
      .eq('direction', 'outgoing')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (!messages) continue;
    
    // Count "hey 🖤" messages
    const heyMessages = messages.filter(m => 
      /^hey\s*🖤?\s*$/i.test(m.content.trim())
    );
    
    if (heyMessages.length >= 3) {
      log('🐛', `@${c.ig_username}: ${heyMessages.length}x "hey 🖤"!`);
      loopsFound++;
    }
  }
  
  if (loopsFound === 0) {
    log('✅', 'Aucune boucle "hey 🖤" détectée');
  } else {
    log('⚠️', `${loopsFound} contacts avec "hey 🖤" en boucle`);
  }
}

// ===========================================
// TEST 5: Check MESSAGE_CAPS consistency
// ===========================================

async function testMessageCapsConsistency() {
  section('TEST 5: Vérification MESSAGE_CAPS');
  
  const MESSAGE_CAPS = {
    cold: 15,
    warm: 20,
    hot: 20,
    pitched: 5,
    converted: 50,
    paid: 100
  };
  
  for (const [stage, cap] of Object.entries(MESSAGE_CAPS)) {
    const { data: contacts } = await supabase
      .from('elena_dm_contacts')
      .select('id, ig_username, message_count, is_stopped')
      .eq('stage', stage)
      .gt('message_count', cap)
      .eq('is_stopped', false)
      .limit(10);
    
    if (contacts && contacts.length > 0) {
      log('🐛', `Stage ${stage}: ${contacts.length} contacts > cap (${cap}) mais pas STOPPED:`);
      contacts.forEach(c => {
        log('  ', `@${c.ig_username}: ${c.message_count} msgs`);
      });
    } else {
      log('✅', `Stage ${stage}: OK (cap=${cap})`);
    }
  }
}

// ===========================================
// TEST 6: Simulate webhook for STOPPED contact
// ===========================================

async function testWebhookForStoppedContact() {
  section('TEST 6: Webhook pour contact STOPPED');
  
  // Find a STOPPED contact
  const { data: stoppedContact } = await supabase
    .from('elena_dm_contacts')
    .select('*')
    .eq('is_stopped', true)
    .limit(1)
    .single();
  
  if (!stoppedContact) {
    log('ℹ️', 'Aucun contact STOPPED pour tester');
    return;
  }
  
  log('ℹ️', `Test avec @${stoppedContact.ig_username} (STOPPED)`);
  
  // Simulate webhook call
  const payload = {
    subscriber: {
      id: stoppedContact.ig_user_id,
      ig_username: stoppedContact.ig_username,
      name: stoppedContact.ig_name
    },
    last_input_text: 'test message'
  };
  
  try {
    const response = await fetch(`${API_URL}/api/dm/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (result.skip === true && result.response === '') {
      log('✅', 'Webhook retourne skip=true, response="" (correct)');
    } else {
      log('🐛', `Webhook retourne: ${JSON.stringify(result)}`);
      if (result.response) {
        log('🐛', `RESPONSE ENVOYÉE: "${result.response}"`);
      }
    }
  } catch (error) {
    log('❌', `Erreur: ${error.message}`);
  }
}

// ===========================================
// TEST 7: Check language detection issues
// ===========================================

async function testLanguageIssues() {
  section('TEST 7: Problèmes de langue');
  
  // Find messages asking to speak English
  const { data: messages } = await supabase
    .from('elena_dm_messages')
    .select('id, content, contact:contact_id(ig_username, detected_language)')
    .eq('direction', 'outgoing')
    .or('content.ilike.%speak english%,content.ilike.%in english%,content.ilike.%write in english%')
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (!messages || messages.length === 0) {
    log('✅', 'Aucun message demandant de parler anglais');
    return;
  }
  
  log('⚠️', `${messages.length} messages demandant l'anglais:`);
  messages.forEach(m => {
    const user = m.contact?.ig_username || 'unknown';
    const lang = m.contact?.detected_language || 'unknown';
    log('  ', `@${user} (lang=${lang}): "${m.content.substring(0, 60)}..."`);
  });
}

// ===========================================
// TEST 8: Recent conversations analysis
// ===========================================

async function testRecentConversations() {
  section('TEST 8: Analyse conversations récentes (12h)');
  
  const since = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  
  const { data: messages } = await supabase
    .from('elena_dm_messages')
    .select('direction, content, contact:contact_id(ig_username, is_stopped)')
    .gte('created_at', since)
    .order('created_at', { ascending: false });
  
  if (!messages || messages.length === 0) {
    log('ℹ️', 'Aucun message dans les 12 dernières heures');
    return;
  }
  
  const outgoing = messages.filter(m => m.direction === 'outgoing');
  const incoming = messages.filter(m => m.direction === 'incoming');
  
  log('📊', `Total: ${messages.length} (${outgoing.length} out, ${incoming.length} in)`);
  
  // Patterns problématiques
  const patterns = {
    'hey 🖤 seul': outgoing.filter(m => /^hey\s*🖤?\s*$/i.test(m.content.trim())),
    'exit messages': outgoing.filter(m => m.content.includes('fanvue') && (m.content.includes('je file') || m.content.includes('shooting') || m.content.includes('manager'))),
    'réponses vides': outgoing.filter(m => !m.content || m.content.trim() === ''),
    'demande anglais': outgoing.filter(m => m.content.toLowerCase().includes('speak english') || m.content.toLowerCase().includes('write in english')),
    'messages à contacts STOPPED': outgoing.filter(m => m.contact?.is_stopped)
  };
  
  for (const [name, msgs] of Object.entries(patterns)) {
    if (msgs.length > 0) {
      log('⚠️', `${msgs.length}x ${name}`);
    } else {
      log('✅', `0x ${name}`);
    }
  }
}

// ===========================================
// MAIN
// ===========================================

async function main() {
  console.log('\n🔬 TESTS DE DIAGNOSTIC — DM HARD FIX\n');
  console.log(`API: ${API_URL}`);
  console.log(`Date: ${new Date().toLocaleString()}`);
  
  await testHighMessageCountContacts();
  await testStoppedContactsReceivingMessages();
  await testExitMessageLoops();
  await testHeyLoops();
  await testMessageCapsConsistency();
  await testWebhookForStoppedContact();
  await testLanguageIssues();
  await testRecentConversations();
  
  section('RÉSUMÉ');
  console.log('Tests terminés. Vérifier les 🐛 ci-dessus.');
}

main().catch(console.error);
