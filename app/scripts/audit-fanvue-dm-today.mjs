#!/usr/bin/env node

/**
 * Audit Fanvue DMs - Today's activity
 * Check why messages weren't responded to
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

// Validate env
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function auditFanvueDMs() {
  console.log('\n🔍 AUDIT DM FANVUE - AUJOURD\'HUI\n');
  console.log('═'.repeat(70));

  // ===========================================
  // 1. Check all contacts
  // ===========================================
  console.log('\n📊 VUE D\'ENSEMBLE DES CONTACTS\n');
  
  const { data: allContacts, error: contactsError } = await supabase
    .from('fanvue_dm_contacts')
    .select('*')
    .order('last_contact_at', { ascending: false });

  if (contactsError) {
    console.error('❌ Erreur contacts:', contactsError.message);
    return;
  }

  console.log(`Total contacts: ${allContacts?.length || 0}`);
  
  // Group by stage
  const byStage = allContacts?.reduce((acc, c) => {
    acc[c.stage] = (acc[c.stage] || 0) + 1;
    return acc;
  }, {}) || {};
  
  console.log('\nPar stage:');
  Object.entries(byStage).forEach(([stage, count]) => {
    console.log(`  - ${stage}: ${count}`);
  });

  // Stopped contacts
  const stoppedCount = allContacts?.filter(c => c.is_stopped).length || 0;
  console.log(`\nContacts stoppés: ${stoppedCount}`);

  // ===========================================
  // 2. Messages récents (24h)
  // ===========================================
  console.log('\n' + '─'.repeat(70));
  console.log('\n📬 MESSAGES DES DERNIÈRES 24H\n');
  
  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);
  
  const { data: recentMessages, error: messagesError } = await supabase
    .from('fanvue_dm_messages')
    .select('*, fanvue_dm_contacts!inner(username, stage, is_stopped)')
    .gte('created_at', yesterday.toISOString())
    .order('created_at', { ascending: false });

  if (messagesError) {
    console.error('❌ Erreur messages:', messagesError.message);
  } else if (!recentMessages || recentMessages.length === 0) {
    console.log('⚠️ Aucun message dans les dernières 24h');
  } else {
    console.log(`Messages trouvés: ${recentMessages.length}`);
    
    const incoming = recentMessages.filter(m => m.direction === 'incoming');
    const outgoing = recentMessages.filter(m => m.direction === 'outgoing');
    
    console.log(`  - Entrants: ${incoming.length}`);
    console.log(`  - Sortants (réponses): ${outgoing.length}`);
    
    if (incoming.length > outgoing.length) {
      console.log('\n⚠️ ATTENTION: Plus de messages entrants que sortants!');
    }
    
    // Show recent messages
    console.log('\n📝 Détail des messages récents:\n');
    
    for (const msg of recentMessages.slice(0, 20)) {
      const time = new Date(msg.created_at).toLocaleString('fr-FR');
      const username = msg.fanvue_dm_contacts?.username || 'inconnu';
      const arrow = msg.direction === 'incoming' ? '📥' : '📤';
      const stopped = msg.fanvue_dm_contacts?.is_stopped ? ' [STOPPÉ]' : '';
      
      console.log(`${time} ${arrow} @${username}${stopped}`);
      console.log(`   "${msg.content?.substring(0, 80)}${msg.content?.length > 80 ? '...' : ''}"`);
      if (msg.intent) console.log(`   Intent: ${msg.intent}`);
      console.log('');
    }
  }

  // ===========================================
  // 3. Messages entrants sans réponse
  // ===========================================
  console.log('─'.repeat(70));
  console.log('\n🚨 MESSAGES ENTRANTS SANS RÉPONSE (24h)\n');
  
  // Get contacts with recent incoming messages
  const { data: contactsWithRecent } = await supabase
    .from('fanvue_dm_contacts')
    .select('id, username, stage, is_stopped, last_user_message_at, last_contact_at')
    .gte('last_user_message_at', yesterday.toISOString())
    .order('last_user_message_at', { ascending: false });

  if (!contactsWithRecent || contactsWithRecent.length === 0) {
    console.log('Aucun contact avec message entrant récent');
  } else {
    for (const contact of contactsWithRecent) {
      // Get last messages for this contact
      const { data: contactMessages } = await supabase
        .from('fanvue_dm_messages')
        .select('direction, content, created_at')
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const lastMsg = contactMessages?.[0];
      
      // Check if last message was incoming (no response)
      if (lastMsg?.direction === 'incoming') {
        const timeSinceLastMsg = Date.now() - new Date(lastMsg.created_at).getTime();
        const minutesAgo = Math.round(timeSinceLastMsg / 60000);
        
        console.log(`❌ @${contact.username || contact.id}`);
        console.log(`   Stage: ${contact.stage}${contact.is_stopped ? ' [STOPPÉ]' : ''}`);
        console.log(`   Dernier message (il y a ${minutesAgo}min): "${lastMsg.content?.substring(0, 60)}..."`);
        console.log('');
      }
    }
  }

  // ===========================================
  // 4. Check Vercel config
  // ===========================================
  console.log('─'.repeat(70));
  console.log('\n🔧 VÉRIFICATION CONFIGURATION\n');
  
  // Check env vars
  const envChecks = {
    'VENICE_API_KEY': !!process.env.VENICE_API_KEY,
    'FANVUE_ACCESS_TOKEN': !!process.env.FANVUE_ACCESS_TOKEN,
    'FANVUE_REFRESH_TOKEN': !!process.env.FANVUE_REFRESH_TOKEN,
    'FANVUE_WEBHOOK_SECRET': !!process.env.FANVUE_WEBHOOK_SECRET,
    'FANVUE_CLIENT_ID': !!process.env.FANVUE_CLIENT_ID,
    'FANVUE_CLIENT_SECRET': !!process.env.FANVUE_CLIENT_SECRET,
  };
  
  console.log('Variables d\'environnement:');
  Object.entries(envChecks).forEach(([key, isSet]) => {
    console.log(`  ${isSet ? '✅' : '❌'} ${key}`);
  });
  
  // ===========================================
  // 5. Test webhook endpoint
  // ===========================================
  console.log('\n🌐 Test endpoint webhook...');
  
  try {
    const response = await fetch('https://ig-influencer.vercel.app/api/fanvue/webhook');
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.veniceEnabled === false) {
      console.log('\n⚠️ PROBLÈME: Venice AI n\'est pas activé sur Vercel!');
      console.log('   → Les DMs ne peuvent pas recevoir de réponse automatique');
    }
  } catch (error) {
    console.error('❌ Erreur test webhook:', error.message);
  }

  // ===========================================
  // Summary
  // ===========================================
  console.log('\n' + '═'.repeat(70));
  console.log('\n📋 RÉSUMÉ\n');
  
  const noResponse = contactsWithRecent?.filter(c => {
    // Would need to check but for now estimate
    return true;
  }) || [];
  
  console.log(`• Total contacts Fanvue: ${allContacts?.length || 0}`);
  console.log(`• Messages 24h: ${recentMessages?.length || 0}`);
  console.log(`• Contacts actifs 24h: ${contactsWithRecent?.length || 0}`);
  
  console.log('\n💡 ACTIONS POSSIBLES:');
  console.log('1. Vérifier les logs Vercel pour les erreurs webhook');
  console.log('2. S\'assurer que VENICE_API_KEY est configuré sur Vercel');
  console.log('3. Vérifier que le webhook Fanvue est bien configuré');
  console.log('4. Tester manuellement avec: curl -X POST https://ig-influencer.vercel.app/api/fanvue/webhook');
}

auditFanvueDMs().catch(console.error);
