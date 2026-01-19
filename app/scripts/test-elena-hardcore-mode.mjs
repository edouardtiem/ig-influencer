#!/usr/bin/env node
/**
 * Test du nouveau prompt Elena "Hardcore Mode" pour Fanvue
 * 
 * Teste plusieurs scénarios pour vérifier que:
 * - Le vocabulaire est explicite et pornographique
 * - Elena tease et fait durer le plaisir
 * - Les réponses sont détaillées mais pas trop longues
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
dotenv.config({ path: join(__dirname, '../.env.local') });

console.log('═══════════════════════════════════════════════════════════════');
console.log('🔥 TEST ELENA HARDCORE MODE');
console.log('═══════════════════════════════════════════════════════════════\n');

// Import Venice AI
const { generateElenaFanvueResponse } = await import('../src/lib/venice.ts');

// Test scenarios
const testScenarios = [
  {
    name: 'Compliment basique',
    messages: [
      { role: 'user', content: 'Hey Elena, tu es magnifique' },
    ],
    expected: 'Réponse teasing et légèrement suggestive',
  },
  {
    name: 'Question directe sexuelle',
    messages: [
      { role: 'user', content: 'What are you wearing?' },
    ],
    expected: 'Réponse explicite mais teasing',
  },
  {
    name: 'Demande explicite',
    messages: [
      { role: 'user', content: 'I want to fuck you' },
    ],
    expected: 'Réponse hardcore mais qui fait attendre',
  },
  {
    name: 'Conversation en cours (warm)',
    messages: [
      { role: 'user', content: 'Hey sexy' },
      { role: 'assistant', content: 'mmm hey toi 😏' },
      { role: 'user', content: 'Tu me rends fou' },
      { role: 'assistant', content: 'c\'est le but baby... dis-moi ce que tu veux' },
      { role: 'user', content: 'Je veux te toucher partout' },
    ],
    expected: 'Escalation explicite avec tease',
  },
  {
    name: 'Demande de description',
    messages: [
      { role: 'user', content: 'Describe yourself to me' },
    ],
    expected: 'Description physique avec éléments sexuels',
  },
];

console.log('🧪 TEST DES SCÉNARIOS\n');

for (const scenario of testScenarios) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📋 Scénario: ${scenario.name}`);
  console.log(`💭 Attendu: ${scenario.expected}`);
  console.log(`${'─'.repeat(60)}\n`);
  
  try {
    const response = await generateElenaFanvueResponse({
      messages: scenario.messages,
      language: scenario.messages[0].content.includes('tu') ? 'fr' : 'en',
      stage: 'warm',
      messageCount: 5,
      hasAvailablePPV: false,
    });
    
    console.log('💬 Réponse Elena:');
    console.log(`   "${response}"`);
    console.log('');
    
    // Analyse de la réponse
    const wordCount = response.split(' ').length;
    const hasExplicitWords = /pussy|cock|fuck|wet|cum|dripping|hard/i.test(response);
    const hasTease = /mmm|not yet|wait|tell me|show me|prove/i.test(response);
    const hasEmoji = /[😏👀🖤🔥💋💦]/.test(response);
    
    console.log('📊 Analyse:');
    console.log(`   - Longueur: ${wordCount} mots ${wordCount <= 40 ? '✅' : '⚠️  (trop long)'}`);
    console.log(`   - Explicite: ${hasExplicitWords ? '✅' : '⚠️  (pas assez cru)'}`);
    console.log(`   - Tease: ${hasTease ? '✅' : '⚠️  (pas assez teasant)'}`);
    console.log(`   - Emoji: ${hasEmoji ? '✅' : 'ℹ️  (aucun)'}`);
    
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('✅ TEST TERMINÉ');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('💡 Points à vérifier:');
console.log('  - Les réponses sont-elles assez explicites?');
console.log('  - Elena tease-t-elle assez?');
console.log('  - La longueur est-elle correcte (20-40 mots)?');
console.log('  - Le ton est-il cohérent?');
console.log('');
console.log('🔧 Si besoin d\'ajustements, modifier:');
console.log('   app/src/lib/venice.ts → ELENA_FANVUE_SYSTEM_PROMPT');
console.log('');
