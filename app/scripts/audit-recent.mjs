#!/usr/bin/env node
/**
 * Audit des messages DM des dernières X minutes
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

const MINUTES = parseInt(process.argv[2]) || 30;

async function auditRecent() {
  const since = new Date(Date.now() - MINUTES * 60 * 1000).toISOString();
  
  console.log('\n' + '═'.repeat(70));
  console.log(`📊 AUDIT DES MESSAGES DES ${MINUTES} DERNIÈRES MINUTES`);
  console.log(`   Depuis: ${new Date(since).toLocaleString('fr-FR')}`);
  console.log('═'.repeat(70));

  // Get recent messages
  const { data: messages, error } = await supabase
    .from('elena_dm_messages')
    .select('*, elena_dm_contacts!inner(ig_username, stage)')
    .gte('created_at', since)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }

  if (!messages || messages.length === 0) {
    console.log('\n⚠️  AUCUN MESSAGE dans les dernières', MINUTES, 'minutes');
    console.log('\n💡 Causes possibles:');
    console.log('   - Aucun DM reçu pendant cette période');
    console.log('   - Le webhook ne sauvegarde plus les messages');
    console.log('   - Problème de connexion Supabase');
    console.log('═'.repeat(70) + '\n');
    process.exit(0);
  }

  // Group by contact
  const byContact = {};
  messages.forEach(m => {
    const key = m.elena_dm_contacts?.ig_username || m.contact_id;
    if (!byContact[key]) {
      byContact[key] = {
        username: m.elena_dm_contacts?.ig_username,
        stage: m.elena_dm_contacts?.stage,
        messages: []
      };
    }
    byContact[key].messages.push(m);
  });

  // Stats
  const incoming = messages.filter(m => m.direction === 'incoming').length;
  const outgoing = messages.filter(m => m.direction === 'outgoing').length;
  const emptyOutgoing = messages.filter(m => m.direction === 'outgoing' && (!m.content || m.content.trim() === '')).length;

  console.log('\n📈 STATS RAPIDES\n');
  console.log('─'.repeat(40));
  console.log(`Total messages:     ${messages.length}`);
  console.log(`Messages entrants:  ${incoming}`);
  console.log(`Réponses Elena:     ${outgoing}`);
  console.log(`Réponses vides:     ${emptyOutgoing}`);
  console.log(`Conversations:      ${Object.keys(byContact).length}`);
  console.log(`Ratio réponse:      ${incoming > 0 ? Math.round(outgoing / incoming * 100) : 0}%`);

  if (outgoing === 0 && incoming > 0) {
    console.log('\n🚨 ALERTE: Aucune réponse envoyée malgré des messages entrants!');
    console.log('   → Le cooldown ou la déduplication bloque peut-être tout');
  }

  if (emptyOutgoing > 0) {
    console.log(`\n⚠️  ${emptyOutgoing} réponses vides (skip/cooldown)`);
  }

  // Show conversations
  console.log('\n\n💬 CONVERSATIONS DÉTAILLÉES\n');
  console.log('─'.repeat(70));

  for (const [key, convo] of Object.entries(byContact)) {
    console.log(`\n👤 @${convo.username || key} [${convo.stage?.toUpperCase() || '?'}]`);
    
    convo.messages.forEach(m => {
      const time = new Date(m.created_at).toLocaleTimeString('fr-FR');
      const icon = m.direction === 'incoming' ? '📩' : '🤖';
      const content = m.content?.substring(0, 80) || '(vide)';
      const strategy = m.response_strategy ? ` [${m.response_strategy}]` : '';
      console.log(`  ${time} ${icon} ${content}${m.content?.length > 80 ? '...' : ''}${strategy}`);
    });
  }

  // Check for issues
  console.log('\n\n🔍 ANALYSE DES PROBLÈMES\n');
  console.log('─'.repeat(70));

  // Check for duplicates
  const outgoingMsgs = messages.filter(m => m.direction === 'outgoing' && m.content);
  const duplicates = [];
  const seen = {};
  outgoingMsgs.forEach(m => {
    const key = m.contact_id + ':' + m.content;
    if (seen[key]) {
      duplicates.push({ contact: m.elena_dm_contacts?.ig_username, content: m.content });
    }
    seen[key] = true;
  });

  if (duplicates.length > 0) {
    console.log(`\n🔴 ${duplicates.length} RÉPONSES DUPLIQUÉES DÉTECTÉES:`);
    duplicates.forEach(d => {
      console.log(`   @${d.contact}: "${d.content?.substring(0, 50)}..."`);
    });
  } else {
    console.log('✅ Aucune réponse dupliquée');
  }

  // Check for very long responses
  const longResponses = outgoingMsgs.filter(m => m.content && m.content.split(' ').length > 15);
  if (longResponses.length > 0) {
    console.log(`\n🟡 ${longResponses.length} réponses > 15 mots:`);
    longResponses.forEach(m => {
      console.log(`   @${m.elena_dm_contacts?.ig_username}: "${m.content?.substring(0, 60)}..." (${m.content.split(' ').length} mots)`);
    });
  } else {
    console.log('✅ Toutes les réponses < 15 mots');
  }

  // Check for hallucination patterns
  const hallucPatterns = ['twice', 'double', 'doppio', 'identical', 'same', 'again', 'répété', 'identique'];
  const hallucinations = outgoingMsgs.filter(m => 
    hallucPatterns.some(p => m.content?.toLowerCase().includes(p))
  );
  if (hallucinations.length > 0) {
    console.log(`\n🔴 ${hallucinations.length} HALLUCINATIONS POTENTIELLES:`);
    hallucinations.forEach(m => {
      console.log(`   @${m.elena_dm_contacts?.ig_username}: "${m.content?.substring(0, 60)}..."`);
    });
  } else {
    console.log('✅ Aucune hallucination de pattern détectée');
  }

  // Check for unanswered incoming
  const contactsWithIncoming = new Set(messages.filter(m => m.direction === 'incoming').map(m => m.contact_id));
  const contactsWithOutgoing = new Set(messages.filter(m => m.direction === 'outgoing').map(m => m.contact_id));
  const unanswered = [...contactsWithIncoming].filter(c => !contactsWithOutgoing.has(c));
  
  if (unanswered.length > 0) {
    console.log(`\n🟡 ${unanswered.length} contacts avec messages entrants mais SANS réponse`);
    for (const cid of unanswered) {
      const incomingMsgs = messages.filter(m => m.contact_id === cid && m.direction === 'incoming');
      const username = incomingMsgs[0]?.elena_dm_contacts?.ig_username;
      console.log(`   @${username}: ${incomingMsgs.length} msgs sans réponse`);
    }
  }

  console.log('\n' + '═'.repeat(70));
  console.log('✅ AUDIT TERMINÉ');
  console.log('═'.repeat(70) + '\n');
}

auditRecent().catch(console.error);

