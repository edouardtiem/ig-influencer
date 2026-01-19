#!/usr/bin/env node
/**
 * Test final d'envoi de message Fanvue avec le bon endpoint
 * POST /chats/:userUuid/message (singular!)
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
dotenv.config({ path: join(__dirname, '../.env.local') });

const API_BASE_URL = 'https://api.fanvue.com';

console.log('═══════════════════════════════════════════════════════════════');
console.log('📤 TEST FINAL ENVOI MESSAGE FANVUE');
console.log('═══════════════════════════════════════════════════════════════\n');

// Charger le token
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: tokenData } = await supabase
  .from('oauth_tokens')
  .select('access_token')
  .eq('service_name', 'fanvue')
  .single();

const accessToken = tokenData?.access_token || process.env.FANVUE_ACCESS_TOKEN;

// 1. Récupérer un chat existant
console.log('💬 1. RÉCUPÉRATION D\'UN CHAT EXISTANT\n');

const chatsResponse = await fetch(`${API_BASE_URL}/chats`, {
  headers: { 
    'Authorization': `Bearer ${accessToken}`,
    'X-Fanvue-API-Version': '2025-06-26',
  },
});

const chatsData = await chatsResponse.json();
const chats = chatsData.data || [];

if (chats.length === 0) {
  console.log('❌ Aucun chat disponible');
  process.exit(1);
}

const testChat = chats[0];
const userUuid = testChat.user.uuid;
const handle = testChat.user.handle;

console.log(`✅ Chat trouvé: @${handle} (${userUuid})\n`);

// 2. Envoyer un message avec le BON endpoint
console.log('📤 2. ENVOI D\'UN MESSAGE\n');

const testMessage = `✅ Test système DM réussi !\n\nCe message a été envoyé automatiquement à ${new Date().toLocaleString('fr-FR')} pour vérifier que le système fonctionne correctement.`;

console.log(`💬 Message: "${testMessage}"\n`);
console.log(`📍 Endpoint: POST /chats/${userUuid}/message\n`);

try {
  const response = await fetch(`${API_BASE_URL}/chats/${userUuid}/message`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Fanvue-API-Version': '2025-06-26',
    },
    body: JSON.stringify({
      text: testMessage,
    }),
  });
  
  console.log('📡 Status:', response.status, response.statusText);
  
  if (response.ok) {
    const result = await response.json();
    console.log('✅ Message envoyé avec succès !');
    console.log('📨 Message UUID:', result.messageUuid || result.uuid || 'N/A');
    console.log('');
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎉 TEST RÉUSSI !');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log('Le système DM Fanvue est maintenant opérationnel:');
    console.log('  ✅ Token valide et refreshé automatiquement');
    console.log('  ✅ Endpoint correct: POST /chats/:userUuid/message');
    console.log('  ✅ Header X-Fanvue-API-Version ajouté');
    console.log('  ✅ Message envoyé avec succès');
    console.log('');
    console.log('💡 Les réponses automatiques devraient maintenant fonctionner !');
    console.log('');
    console.log('🧪 Prochaine étape: Envoyer un message sur Fanvue et vérifier la réponse auto');
    console.log('');
    
  } else {
    const error = await response.text();
    console.log('❌ Erreur:', error);
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Erreur:', error.message);
  process.exit(1);
}
