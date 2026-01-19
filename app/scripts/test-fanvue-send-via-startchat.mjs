#!/usr/bin/env node
/**
 * Test d'envoi de message Fanvue via startChat
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
console.log('📤 TEST ENVOI MESSAGE VIA STARTCHAT');
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
  headers: { 'Authorization': `Bearer ${accessToken}` },
});

const chatsData = await chatsResponse.json();
const chats = chatsData.data || [];

if (chats.length === 0) {
  console.log('❌ Aucun chat disponible');
  process.exit(1);
}

const testChat = chats[0];
const userId = testChat.user.uuid;
const handle = testChat.user.handle;

console.log(`✅ Chat trouvé: @${handle} (${userId})\n`);

// 2. Créer/obtenir un chat avec startChat
console.log('🔄 2. APPEL DE startChat()\n');

try {
  const startChatResponse = await fetch(`${API_BASE_URL}/chats`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
    }),
  });
  
  console.log('📡 Status:', startChatResponse.status, startChatResponse.statusText);
  
  if (!startChatResponse.ok) {
    const error = await startChatResponse.text();
    console.log('❌ Erreur:', error);
    
    // Si le chat existe déjà, on peut quand même essayer d'envoyer un message
    if (startChatResponse.status === 409 || startChatResponse.status === 400) {
      console.log('⚠️  Le chat existe probablement déjà, on continue...\n');
    } else {
      process.exit(1);
    }
  } else {
    const result = await startChatResponse.json();
    console.log('✅ Chat créé/obtenu');
    console.log('📨 Chat ID:', result.uuid || result.id || 'N/A');
    console.log('');
  }
} catch (error) {
  console.log('❌ Erreur:', error.message);
}

// 3. Envoyer un message
console.log('📤 3. ENVOI D\'UN MESSAGE\n');

const testMessage = `Test automatique 🧪\n\nMessage envoyé à ${new Date().toLocaleString('fr-FR')}`;

console.log(`💬 Message: "${testMessage}"\n`);

// Essayer différents formats pour le chatId
const chatIdFormats = [
  userId, // user_id directement
  `${userId}`, // user_id en string
];

for (const chatId of chatIdFormats) {
  console.log(`🔄 Test avec chatId: ${chatId.slice(0, 20)}...`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: testMessage,
      }),
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('   ✅ Message envoyé avec succès !');
      console.log('   📨 Message:', JSON.stringify(result, null, 2));
      console.log('');
      
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('✅ TEST RÉUSSI !');
      console.log('═══════════════════════════════════════════════════════════════');
      process.exit(0);
    } else {
      const error = await response.text();
      console.log(`   ❌ ${error.slice(0, 150)}`);
    }
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
  }
  console.log('');
}

console.log('⚠️  Aucun format de chatId ne fonctionne');
console.log('');
console.log('💡 Il faut peut-être utiliser un endpoint différent ou vérifier la documentation API');
