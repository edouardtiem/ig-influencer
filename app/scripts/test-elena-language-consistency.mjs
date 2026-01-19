#!/usr/bin/env node
/**
 * Test de la cohérence linguistique d'Elena
 * 
 * Vérifie que:
 * - Elena répond dans la bonne langue
 * - Pas de mélange de langues
 * - Vocabulaire explicite dans chaque langue
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
dotenv.config({ path: join(__dirname, '../.env.local') });

console.log('═══════════════════════════════════════════════════════════════');
console.log('🌍 TEST COHÉRENCE LINGUISTIQUE ELENA');
console.log('═══════════════════════════════════════════════════════════════\n');

// Import Venice AI
const { generateElenaFanvueResponse } = await import('../src/lib/venice.ts');

// Test scenarios in different languages
const testScenarios = [
  {
    name: 'Français - Message explicite',
    language: 'fr',
    messages: [
      { role: 'user', content: 'Salut Elena, tu es trop sexy' },
    ],
    shouldContain: ['français'],
    shouldNotContain: ['english', 'fuck', 'pussy', 'cock'],
  },
  {
    name: 'Français - Demande sexuelle',
    language: 'fr',
    messages: [
      { role: 'user', content: 'J\'ai envie de toi' },
    ],
    shouldContain: ['français'],
    shouldNotContain: ['english', 'fuck', 'pussy'],
  },
  {
    name: 'English - Explicit message',
    language: 'en',
    messages: [
      { role: 'user', content: 'You\'re so hot Elena' },
    ],
    shouldContain: ['english'],
    shouldNotContain: ['français', 'putain', 'cazzo', 'tesoro'],
  },
  {
    name: 'English - Sexual request',
    language: 'en',
    messages: [
      { role: 'user', content: 'I want to fuck you' },
    ],
    shouldContain: ['english'],
    shouldNotContain: ['français', 'putain', 'baise'],
  },
  {
    name: 'Italiano - Messaggio esplicito',
    language: 'it',
    messages: [
      { role: 'user', content: 'Ciao Elena, sei bellissima' },
    ],
    shouldContain: ['italiano'],
    shouldNotContain: ['english', 'français', 'fuck', 'putain'],
  },
];

console.log('🧪 TEST DES SCÉNARIOS\n');

for (const scenario of testScenarios) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📋 Scénario: ${scenario.name}`);
  console.log(`🌍 Langue: ${scenario.language}`);
  console.log(`${'─'.repeat(60)}\n`);
  
  try {
    const response = await generateElenaFanvueResponse({
      messages: scenario.messages,
      language: scenario.language,
      stage: 'warm',
      messageCount: 5,
      hasAvailablePPV: false,
    });
    
    console.log('💬 Réponse Elena:');
    console.log(`   "${response}"\n`);
    
    // Analyse de la cohérence linguistique
    const lowerResponse = response.toLowerCase();
    
    // Vérifier les mots qui DEVRAIENT être présents
    const hasExpectedWords = scenario.shouldContain.some(word => 
      lowerResponse.includes(word.toLowerCase())
    );
    
    // Vérifier les mots qui NE DEVRAIENT PAS être présents
    const hasUnwantedWords = scenario.shouldNotContain.some(word => 
      lowerResponse.includes(word.toLowerCase())
    );
    
    // Détection de mélange de langues
    const hasFrenchWords = /\b(putain|baise|chatte|bite|mouille|salope)\b/i.test(response);
    const hasEnglishWords = /\b(fuck|pussy|cock|wet|cum|dick)\b/i.test(response);
    const hasItalianWords = /\b(cazzo|figa|scopami|tesoro|amore)\b/i.test(response);
    
    let languageMixing = false;
    let mixedLanguages = [];
    
    if (scenario.language === 'fr') {
      if (hasEnglishWords) {
        languageMixing = true;
        mixedLanguages.push('English');
      }
      if (hasItalianWords) {
        languageMixing = true;
        mixedLanguages.push('Italian');
      }
    } else if (scenario.language === 'en') {
      if (hasFrenchWords) {
        languageMixing = true;
        mixedLanguages.push('French');
      }
      if (hasItalianWords) {
        languageMixing = true;
        mixedLanguages.push('Italian');
      }
    } else if (scenario.language === 'it') {
      if (hasEnglishWords) {
        languageMixing = true;
        mixedLanguages.push('English');
      }
      if (hasFrenchWords) {
        languageMixing = true;
        mixedLanguages.push('French');
      }
    }
    
    console.log('📊 Analyse:');
    console.log(`   - Langue correcte: ${!languageMixing ? '✅' : '❌ Mélange détecté: ' + mixedLanguages.join(', ')}`);
    console.log(`   - Pas de mots indésirables: ${!hasUnwantedWords ? '✅' : '⚠️  Trouvé: ' + scenario.shouldNotContain.filter(w => lowerResponse.includes(w.toLowerCase())).join(', ')}`);
    
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('✅ TEST TERMINÉ');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('💡 Points à vérifier:');
console.log('  - Elena répond-elle dans la bonne langue?');
console.log('  - Y a-t-il du mélange de langues?');
console.log('  - Le vocabulaire explicite est-il dans la bonne langue?');
console.log('');
console.log('🔧 Si problèmes, vérifier:');
console.log('   app/src/lib/venice.ts → buildLanguageInstruction()');
console.log('');
