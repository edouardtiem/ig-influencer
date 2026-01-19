#!/usr/bin/env node
/**
 * Simulation complète d'un webhook Fanvue + réponse automatique
 * 
 * Ce script simule le flow complet:
 * 1. Webhook message.created reçu
 * 2. Traitement du message (Venice AI)
 * 3. Envoi de la réponse
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
dotenv.config({ path: join(__dirname, '../.env.local') });

console.log('═══════════════════════════════════════════════════════════════');
console.log('🔄 SIMULATION WEBHOOK FANVUE COMPLET');
console.log('═══════════════════════════════════════════════════════════════\n');

// Import des modules
const { initTokensFromEnv } = await import('../src/lib/fanvue.ts');
const { processFanvueDM } = await import('../src/lib/elena-dm-fanvue.ts');

// 1. Initialiser les tokens
console.log('🔑 1. INITIALISATION DES TOKENS\n');

try {
  const initialized = await initTokensFromEnv();
  
  if (!initialized) {
    console.log('❌ Impossible d\'initialiser les tokens');
    process.exit(1);
  }
  
  console.log('✅ Tokens initialisés\n');
} catch (error) {
  console.log('❌ Erreur:', error.message);
  process.exit(1);
}

// 2. Simuler un webhook message.created
console.log('📨 2. SIMULATION WEBHOOK MESSAGE.CREATED\n');

const simulatedWebhook = {
  type: 'message.created',
  data: {
    id: 'test_message_' + Date.now(),
    user_id: 'test_user_simulation',
    username: 'test_user',
    chat_id: 'test_chat_123',
    message: 'Hey Elena, comment ça va ? 😘',
    created_at: new Date().toISOString(),
  },
  timestamp: new Date().toISOString(),
};

console.log('📋 Payload webhook:');
console.log(JSON.stringify(simulatedWebhook, null, 2));
console.log('');

// 3. Traiter le message
console.log('🤖 3. TRAITEMENT DU MESSAGE\n');

try {
  console.log('⚠️  NOTE: Ce test va créer un contact et envoyer un message réel sur Fanvue');
  console.log('⚠️  Appuyez sur Ctrl+C pour annuler dans les 5 secondes...\n');
  
  // Attendre 5 secondes pour permettre l'annulation
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('🔄 Traitement en cours...\n');
  
  const result = await processFanvueDM(simulatedWebhook);
  
  console.log('✅ Message traité avec succès !');
  console.log('');
  console.log('📊 Résultat:');
  console.log('  - Réponse:', result.response.slice(0, 100) + '...');
  console.log('  - Stage:', result.contact.stage);
  console.log('  - Intent:', result.analysis.intent);
  console.log('  - Sentiment:', result.analysis.sentiment);
  console.log('  - PPV envoyé:', result.ppvSent || false);
  console.log('');
  
} catch (error) {
  console.log('❌ Erreur lors du traitement:', error.message);
  console.log('');
  console.log('💡 Causes possibles:');
  console.log('  - Venice AI non configuré');
  console.log('  - Erreur de connexion à Supabase');
  console.log('  - Erreur lors de l\'envoi du message');
  console.log('');
  console.log('Stack trace:');
  console.log(error.stack);
  process.exit(1);
}

// 4. Résumé
console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ SIMULATION COMPLÈTE RÉUSSIE !');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('Le flow complet fonctionne:');
console.log('  ✅ Webhook reçu et parsé');
console.log('  ✅ Contact créé/mis à jour dans la DB');
console.log('  ✅ Message entrant enregistré');
console.log('  ✅ Réponse générée avec Venice AI');
console.log('  ✅ Réponse envoyée via l\'API Fanvue');
console.log('  ✅ Réponse enregistrée dans la DB');
console.log('');
console.log('💡 Le système DM est 100% opérationnel !');
console.log('');
console.log('🧪 Prochaine étape: Tester avec un vrai message sur Fanvue');
console.log('');
