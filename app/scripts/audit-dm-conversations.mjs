#!/usr/bin/env node
// ===========================================
// DM CONVERSATION AUDIT — Elena
// ===========================================
// Analyse les conversations DM pour identifier ce qui marche/ne marche pas
// Usage: node scripts/audit-dm-conversations.mjs
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

// ===========================================
// HELPERS
// ===========================================

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}j`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}min`;
  return `${seconds}s`;
}

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// ===========================================
// MAIN AUDIT
// ===========================================

async function auditDMConversations() {
  console.log('\n' + '═'.repeat(60));
  console.log('📊 AUDIT DES CONVERSATIONS DM — ELENA');
  console.log('═'.repeat(60) + '\n');

  // 1. GET ALL CONTACTS
  const { data: contacts, error: contactsError } = await supabase
    .from('elena_dm_contacts')
    .select('*')
    .order('last_contact_at', { ascending: false });

  if (contactsError) {
    console.error('❌ Erreur récupération contacts:', contactsError.message);
    process.exit(1);
  }

  if (!contacts || contacts.length === 0) {
    console.log('⚠️  Aucun contact DM trouvé dans la base.');
    console.log('💡 Les conversations DM doivent être trackées via ManyChat → API webhook.\n');
    process.exit(0);
  }

  // 2. GET ALL MESSAGES
  const { data: allMessages, error: msgError } = await supabase
    .from('elena_dm_messages')
    .select('*')
    .order('created_at', { ascending: true });

  if (msgError) {
    console.error('❌ Erreur récupération messages:', msgError.message);
    process.exit(1);
  }

  // Group messages by contact
  const messagesByContact = {};
  allMessages?.forEach(msg => {
    if (!messagesByContact[msg.contact_id]) {
      messagesByContact[msg.contact_id] = [];
    }
    messagesByContact[msg.contact_id].push(msg);
  });

  // ===========================================
  // SECTION 1: FUNNEL STATS
  // ===========================================

  console.log('📈 FUNNEL DE CONVERSION\n');
  console.log('─'.repeat(40));

  const stageCounts = {
    cold: 0,
    warm: 0,
    hot: 0,
    pitched: 0,
    converted: 0,
    paid: 0
  };

  contacts.forEach(c => {
    stageCounts[c.stage] = (stageCounts[c.stage] || 0) + 1;
  });

  const total = contacts.length;
  const stageLabels = {
    cold: '❄️  Cold (1-3 msgs)',
    warm: '🔥 Warm (4-7 msgs)',
    hot: '🔥🔥 Hot (8+ msgs)',
    pitched: '💰 Pitched (Fanvue mentionné)',
    converted: '✅ Converted (compte créé)',
    paid: '💎 Paid (souscription)'
  };

  Object.entries(stageCounts).forEach(([stage, count]) => {
    const pct = ((count / total) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(pct / 2)) + '░'.repeat(50 - Math.round(pct / 2));
    console.log(`${stageLabels[stage]}`);
    console.log(`   ${bar} ${count} (${pct}%)`);
  });

  // Conversion rates
  console.log('\n📊 TAUX DE CONVERSION');
  console.log('─'.repeat(40));

  const coldTotal = stageCounts.cold + stageCounts.warm + stageCounts.hot + stageCounts.pitched + stageCounts.converted + stageCounts.paid;
  const warmPlus = stageCounts.warm + stageCounts.hot + stageCounts.pitched + stageCounts.converted + stageCounts.paid;
  const hotPlus = stageCounts.hot + stageCounts.pitched + stageCounts.converted + stageCounts.paid;
  const pitchedPlus = stageCounts.pitched + stageCounts.converted + stageCounts.paid;
  const convertedPlus = stageCounts.converted + stageCounts.paid;

  console.log(`Cold → Warm:     ${coldTotal > 0 ? ((warmPlus / coldTotal) * 100).toFixed(1) : 0}%`);
  console.log(`Warm → Hot:      ${stageCounts.warm > 0 ? ((hotPlus / warmPlus) * 100).toFixed(1) : 0}%`);
  console.log(`Hot → Pitched:   ${stageCounts.hot > 0 ? ((pitchedPlus / hotPlus) * 100).toFixed(1) : 0}%`);
  console.log(`Pitched → Converted: ${stageCounts.pitched > 0 ? ((convertedPlus / pitchedPlus) * 100).toFixed(1) : 0}%`);
  console.log(`Converted → Paid:    ${stageCounts.converted > 0 ? ((stageCounts.paid / convertedPlus) * 100).toFixed(1) : 0}%`);
  console.log(`\n🎯 GLOBAL: ${((stageCounts.converted + stageCounts.paid) / total * 100).toFixed(1)}% conversion Fanvue`);

  // ===========================================
  // SECTION 2: CONVERSATION ANALYSIS
  // ===========================================

  console.log('\n\n💬 ANALYSE DES CONVERSATIONS');
  console.log('═'.repeat(60) + '\n');

  // Message counts
  const msgCounts = contacts.map(c => c.message_count || 0);
  console.log('📝 Messages par conversation:');
  console.log(`   Min: ${Math.min(...msgCounts)} | Avg: ${avg(msgCounts).toFixed(1)} | Max: ${Math.max(...msgCounts)}`);

  // Response times
  const responseTimes = allMessages?.filter(m => m.response_time_ms && m.direction === 'outgoing').map(m => m.response_time_ms) || [];
  if (responseTimes.length > 0) {
    console.log(`\n⏱️  Temps de réponse moyen: ${formatDuration(avg(responseTimes))}`);
  }

  // Intent breakdown
  console.log('\n🎯 INTENTIONS DES MESSAGES (entrants):');
  console.log('─'.repeat(40));

  const intentCounts = {};
  allMessages?.filter(m => m.direction === 'incoming' && m.intent).forEach(m => {
    intentCounts[m.intent] = (intentCounts[m.intent] || 0) + 1;
  });

  const intentLabels = {
    greeting: '👋 Salutation',
    compliment: '💖 Compliment',
    question: '❓ Question',
    flirt: '😏 Flirt',
    ai_question: '🤖 Question IA',
    objection: '⚠️  Objection',
    spam: '🚫 Spam',
    other: '📝 Autre'
  };

  Object.entries(intentCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([intent, count]) => {
      console.log(`   ${intentLabels[intent] || intent}: ${count}`);
    });

  // ===========================================
  // SECTION 3: CE QUI MARCHE / NE MARCHE PAS
  // ===========================================

  console.log('\n\n✅ CE QUI MARCHE vs ❌ CE QUI NE MARCHE PAS');
  console.log('═'.repeat(60) + '\n');

  // Analyze successful conversations (converted/paid)
  const successfulContacts = contacts.filter(c => ['converted', 'paid'].includes(c.stage));
  const failedContacts = contacts.filter(c => ['cold'].includes(c.stage) && c.message_count >= 1);

  // Messages that led to success
  const successfulMsgs = [];
  successfulContacts.forEach(c => {
    const msgs = messagesByContact[c.id] || [];
    successfulMsgs.push(...msgs);
  });

  // Messages in failed convos
  const failedMsgs = [];
  failedContacts.forEach(c => {
    const msgs = messagesByContact[c.id] || [];
    failedMsgs.push(...msgs);
  });

  // Compare outgoing messages
  const successOutgoing = successfulMsgs.filter(m => m.direction === 'outgoing');
  const failedOutgoing = failedMsgs.filter(m => m.direction === 'outgoing');

  console.log('📊 Comparaison conversions réussies vs abandons:\n');

  if (successOutgoing.length > 0) {
    const avgLengthSuccess = avg(successOutgoing.map(m => m.content?.length || 0));
    const avgLengthFailed = avg(failedOutgoing.map(m => m.content?.length || 0));
    
    console.log(`📏 Longueur moyenne réponses Elena:`);
    console.log(`   ✅ Conversions: ${avgLengthSuccess.toFixed(0)} caractères`);
    console.log(`   ❌ Abandons: ${avgLengthFailed.toFixed(0)} caractères`);
    console.log(`   💡 ${avgLengthSuccess > avgLengthFailed ? 'Réponses plus longues = meilleur' : 'Réponses courtes = ok'}`);
  }

  // Strategy analysis
  console.log('\n🎯 Stratégies utilisées (conversions vs abandons):');
  
  const stratSuccess = {};
  const stratFailed = {};
  
  successOutgoing.forEach(m => {
    if (m.response_strategy) stratSuccess[m.response_strategy] = (stratSuccess[m.response_strategy] || 0) + 1;
  });
  
  failedOutgoing.forEach(m => {
    if (m.response_strategy) stratFailed[m.response_strategy] = (stratFailed[m.response_strategy] || 0) + 1;
  });

  const allStrategies = [...new Set([...Object.keys(stratSuccess), ...Object.keys(stratFailed)])];
  allStrategies.forEach(s => {
    const sCount = stratSuccess[s] || 0;
    const fCount = stratFailed[s] || 0;
    console.log(`   ${s}: ✅ ${sCount} vs ❌ ${fCount}`);
  });

  // ===========================================
  // SECTION 4: CONVERSATIONS DÉTAILLÉES
  // ===========================================

  console.log('\n\n🔍 CONVERSATIONS RÉCENTES (dernières 10)');
  console.log('═'.repeat(60));

  const recentContacts = contacts.slice(0, 10);

  for (const contact of recentContacts) {
    const msgs = messagesByContact[contact.id] || [];
    const stageEmoji = {
      cold: '❄️',
      warm: '🔥',
      hot: '🔥🔥',
      pitched: '💰',
      converted: '✅',
      paid: '💎'
    }[contact.stage] || '❓';

    console.log(`\n${'─'.repeat(50)}`);
    console.log(`${stageEmoji} @${contact.ig_username || 'unknown'} | Stage: ${contact.stage} | ${contact.message_count || 0} msgs`);
    console.log(`   Premier contact: ${contact.first_contact_at ? new Date(contact.first_contact_at).toLocaleDateString('fr-FR') : 'N/A'}`);
    console.log(`   Dernier contact: ${contact.last_contact_at ? new Date(contact.last_contact_at).toLocaleDateString('fr-FR') : 'N/A'}`);

    if (msgs.length > 0) {
      console.log('\n   Derniers échanges:');
      const lastMsgs = msgs.slice(-6); // Last 6 messages
      lastMsgs.forEach(m => {
        const icon = m.direction === 'incoming' ? '👤' : '🤖';
        const content = m.content?.substring(0, 70) || '';
        console.log(`   ${icon} ${content}${m.content?.length > 70 ? '...' : ''}`);
      });
    }
  }

  // ===========================================
  // SECTION 5: RECOMMANDATIONS
  // ===========================================

  console.log('\n\n💡 RECOMMANDATIONS');
  console.log('═'.repeat(60) + '\n');

  const recommendations = [];

  // Check drop-off points
  if (stageCounts.cold > stageCounts.warm * 3) {
    recommendations.push('⚠️  Trop de drop-off en phase Cold → améliore les premiers messages');
    recommendations.push('   💡 Essaie des questions plus engageantes au lieu de réponses fermées');
  }

  if (stageCounts.warm > stageCounts.hot * 2) {
    recommendations.push('⚠️  Drop-off en phase Warm → crée plus d\'engagement');
    recommendations.push('   💡 Tease du contenu exclusif, pose des questions personnelles');
  }

  if (stageCounts.hot > stageCounts.pitched * 2) {
    recommendations.push('⚠️  Pas assez de pitch Fanvue en phase Hot');
    recommendations.push('   💡 Mentionne Fanvue naturellement après 8+ messages');
  }

  if (stageCounts.pitched > stageCounts.converted * 5) {
    recommendations.push('⚠️  Conversion pitch → signup faible');
    recommendations.push('   💡 Insiste sur le contenu GRATUIT, pas payant');
  }

  // Check if enough data
  if (total < 50) {
    recommendations.push('📊 Pas assez de données (<50 convos) pour tirer des conclusions solides');
    recommendations.push('   💡 Continue à collecter des interactions');
  }

  // Intent-based recommendations
  if (intentCounts.ai_question > total * 0.2) {
    recommendations.push('🤖 Beaucoup de questions sur l\'IA (>20%)');
    recommendations.push('   💡 La disclosure fonctionne - reste authentique');
  }

  if (intentCounts.spam > total * 0.1) {
    recommendations.push('🚫 Spam détecté (>10%) - considère des filtres');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Pas de problème majeur détecté !');
    recommendations.push('📈 Continue comme ça, analyse régulièrement');
  }

  recommendations.forEach(r => console.log(r));

  // ===========================================
  // SECTION 6: BEST/WORST PERFORMERS
  // ===========================================

  console.log('\n\n🏆 TOP CONVERSATIONS (les plus longues)');
  console.log('─'.repeat(40));

  const topByMsgs = [...contacts]
    .sort((a, b) => (b.message_count || 0) - (a.message_count || 0))
    .slice(0, 5);

  topByMsgs.forEach((c, i) => {
    console.log(`${i + 1}. @${c.ig_username || 'unknown'} - ${c.message_count} msgs (${c.stage})`);
  });

  console.log('\n\n📉 CONVERSATIONS À RELANCER (warm/hot sans activité)');
  console.log('─'.repeat(40));

  const toReactivate = contacts
    .filter(c => ['warm', 'hot'].includes(c.stage))
    .filter(c => {
      const lastContact = new Date(c.last_contact_at);
      const daysSinceContact = (Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceContact > 3;
    })
    .slice(0, 5);

  if (toReactivate.length === 0) {
    console.log('Aucune conversation à relancer !');
  } else {
    toReactivate.forEach(c => {
      const daysSince = Math.floor((Date.now() - new Date(c.last_contact_at).getTime()) / (1000 * 60 * 60 * 24));
      console.log(`@${c.ig_username || 'unknown'} - ${c.stage} - ${daysSince}j sans contact`);
    });
  }

  console.log('\n' + '═'.repeat(60));
  console.log('✅ AUDIT TERMINÉ');
  console.log('═'.repeat(60) + '\n');
}

// Run
auditDMConversations().catch(console.error);

