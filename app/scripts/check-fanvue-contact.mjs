#!/usr/bin/env node
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const searchTerm = process.argv[2] || 'crane';
  
  console.log(`\n🔍 Recherche de contacts Fanvue contenant: "${searchTerm}"\n`);
  
  // Chercher le contact
  const { data: contacts, error: contactError } = await supabase
    .from('fanvue_dm_contacts')
    .select('*')
    .ilike('username', `%${searchTerm}%`)
    .limit(5);
  
  if (contactError) {
    console.log('❌ Erreur contacts:', contactError);
    return;
  }
  
  if (!contacts || contacts.length === 0) {
    console.log('❌ Aucun contact trouvé');
    
    // Essayer de chercher par user_id
    const { data: allContacts } = await supabase
      .from('fanvue_dm_contacts')
      .select('id, user_id, username, stage, is_stopped, message_count, last_message_at')
      .order('last_message_at', { ascending: false })
      .limit(10);
    
    console.log('\n📋 Derniers 10 contacts actifs:');
    console.log(JSON.stringify(allContacts, null, 2));
    return;
  }
  
  console.log('=== CONTACTS TROUVÉS ===');
  contacts.forEach(c => {
    console.log(`\n👤 ${c.username || c.user_id}`);
    console.log(`   ID: ${c.id}`);
    console.log(`   User ID: ${c.user_id}`);
    console.log(`   Stage: ${c.stage}`);
    console.log(`   Messages: ${c.message_count}`);
    console.log(`   Stopped: ${c.is_stopped}`);
    console.log(`   Langue: ${c.detected_language || 'non détectée'}`);
    console.log(`   Dernier message: ${c.last_message_at}`);
  });
  
  const contactId = contacts[0].id;
  
  // Chercher les messages récents
  const { data: messages, error: msgError } = await supabase
    .from('fanvue_dm_messages')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })
    .limit(15);
  
  console.log('\n=== 15 DERNIERS MESSAGES ===');
  if (messages && messages.length > 0) {
    messages.reverse().forEach(m => {
      const direction = m.direction === 'incoming' ? '📥 USER' : '📤 ELENA';
      const time = new Date(m.created_at).toLocaleString('fr-FR');
      console.log(`\n${direction} [${time}]:`);
      console.log(`   "${m.content?.substring(0, 100)}${m.content?.length > 100 ? '...' : ''}"`);
    });
  } else {
    console.log('Aucun message trouvé');
  }
  
  // Vérifier le dernier message incoming sans réponse
  const lastIncoming = messages?.find(m => m.direction === 'incoming');
  const lastOutgoing = messages?.find(m => m.direction === 'outgoing');
  
  if (lastIncoming && lastOutgoing) {
    const incomingTime = new Date(lastIncoming.created_at);
    const outgoingTime = new Date(lastOutgoing.created_at);
    
    if (incomingTime > outgoingTime) {
      console.log('\n⚠️  PROBLÈME DÉTECTÉ: Dernier message incoming SANS réponse!');
      console.log(`   Message reçu: ${incomingTime.toLocaleString('fr-FR')}`);
      console.log(`   Dernière réponse: ${outgoingTime.toLocaleString('fr-FR')}`);
    } else {
      console.log('\n✅ Dernier message a été répondu');
    }
  } else if (lastIncoming && !lastOutgoing) {
    console.log('\n⚠️  PROBLÈME: Messages incoming mais AUCUNE réponse!');
  }
}

check().catch(console.error);
