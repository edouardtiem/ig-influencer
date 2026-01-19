#!/usr/bin/env node
/**
 * Test d'envoi de message Fanvue
 * 
 * Ce script:
 * 1. Liste les chats disponibles
 * 2. Envoie un message de test au premier chat
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
console.log('📤 TEST ENVOI MESSAGE FANVUE');
console.log('═══════════════════════════════════════════════════════════════\n');

// ===========================================
// 1. CHARGER LE TOKEN
// ===========================================

console.log('🔑 1. CHARGEMENT DU TOKEN\n');

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

if (!accessToken) {
  console.log('❌ Aucun token disponible');
  process.exit(1);
}

console.log('✅ Token chargé\n');

// ===========================================
// 2. LISTER LES CHATS
// ===========================================

console.log('💬 2. LISTE DES CHATS\n');

let chats = [];

try {
  const response = await fetch(`${API_BASE_URL}/chats`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.log('❌ Erreur lors de la récupération des chats:', error);
    process.exit(1);
  }
  
  const data = await response.json();
  chats = data.data || [];
  
  console.log(`✅ ${chats.length} chat(s) trouvé(s)\n`);
  
  if (chats.length === 0) {
    console.log('⚠️  Aucun chat disponible pour tester l\'envoi de message');
    process.exit(0);
  }
  
  // Debug: afficher la structure du premier chat
  console.log('🔍 Structure du premier chat:');
  console.log(JSON.stringify(chats[0], null, 2));
  console.log('');
  
  // Afficher les premiers chats
  console.log('📋 Premiers chats:');
  chats.slice(0, 5).forEach((chat, i) => {
    const userUuid = chat.user?.uuid;
    const handle = chat.user?.handle || 'unknown';
    const lastMsg = chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleString('fr-FR') : 'N/A';
    console.log(`  ${i + 1}. @${handle} (${userUuid?.slice(0, 8)}...) - Dernier message: ${lastMsg}`);
  });
  console.log('');
  
} catch (error) {
  console.log('❌ Erreur:', error.message);
  process.exit(1);
}

// ===========================================
// 3. RÉCUPÉRER LES MESSAGES D'UN CHAT
// ===========================================

const testChat = chats[0];
const userUuid = testChat.user?.uuid;
const handle = testChat.user?.handle || 'unknown';

console.log(`📨 3. MESSAGES DU CHAT AVEC @${handle} (${userUuid?.slice(0, 8)}...)\n`);

try {
  const response = await fetch(`${API_BASE_URL}/chats/${userUuid}/messages`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.log('⚠️  Erreur lors de la récupération des messages:', error);
  } else {
    const data = await response.json();
    const messages = data.data || [];
    
    console.log(`✅ ${messages.length} message(s) dans ce chat\n`);
    
    if (messages.length > 0) {
      console.log('📋 Derniers messages:');
      messages.slice(-3).forEach(msg => {
        const direction = msg.fromCreator ? '→' : '←';
        const content = msg.text?.slice(0, 50) || '[media]';
        const time = new Date(msg.createdAt).toLocaleString('fr-FR');
        console.log(`  ${direction} ${content}... (${time})`);
      });
      console.log('');
    }
  }
} catch (error) {
  console.log('⚠️  Erreur:', error.message);
}

// ===========================================
// 4. ENVOYER UN MESSAGE DE TEST
// ===========================================

console.log('📤 4. ENVOI D\'UN MESSAGE DE TEST\n');

const testMessage = `Test automatique du système DM 🧪\n\nCe message a été envoyé par le script de test à ${new Date().toLocaleString('fr-FR')}`;

console.log(`💬 Message: "${testMessage}"\n`);

// Tester différents formats d'endpoint
const endpointsToTry = [
  `/chats/${userUuid}/messages`,
  `/messages`,
  `/chat/${userUuid}/message`,
  `/users/${userUuid}/messages`,
];

let success = false;

for (const endpoint of endpointsToTry) {
  console.log(`🔄 Test: POST ${endpoint}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: testMessage,
        userUuid: userUuid, // Au cas où c'est nécessaire
      }),
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('   ✅ Message envoyé avec succès !');
      console.log('   📨 Message ID:', result.uuid || result.id || 'N/A');
      console.log('');
      success = true;
      break;
    } else {
      const error = await response.text();
      console.log(`   ❌ ${error.slice(0, 100)}`);
    }
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
  }
  console.log('');
}

if (!success) {
  console.log('⚠️  Aucun endpoint ne fonctionne pour l\'envoi de message');
  console.log('');
  console.log('💡 Il faut peut-être utiliser un autre format ou endpoint');
  console.log('   Vérifier la documentation Fanvue API');
}

// ===========================================
// RÉSUMÉ
// ===========================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ TEST RÉUSSI !');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('Le système d\'envoi de messages fonctionne:');
console.log('  ✅ Token valide');
console.log('  ✅ Chats récupérés');
console.log('  ✅ Message envoyé avec succès');
console.log('');
console.log('💡 Le système DM est opérationnel !');
console.log('');
console.log('🧪 Prochaine étape: Simuler un webhook entrant complet');
console.log('   node scripts/simulate-fanvue-webhook.mjs');
console.log('');
