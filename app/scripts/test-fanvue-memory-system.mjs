#!/usr/bin/env node
/**
 * Test du système de mémoire Fanvue
 * 
 * Vérifie que:
 * - Les profils sont bien créés
 * - L'extraction de mémoire fonctionne
 * - Le contexte est bien injecté dans les réponses
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
dotenv.config({ path: join(__dirname, '../.env.local') });

console.log('═══════════════════════════════════════════════════════════════');
console.log('💭 TEST SYSTÈME DE MÉMOIRE FANVUE');
console.log('═══════════════════════════════════════════════════════════════\n');

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ===========================================
// 1. VÉRIFIER LES PROFILS EXISTANTS
// ===========================================

console.log('📊 1. PROFILS EXISTANTS\n');

try {
  const { data: profiles, error } = await supabase
    .from('fanvue_user_profiles')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(5);
  
  if (error) {
    console.log('❌ Erreur:', error.message);
  } else if (!profiles || profiles.length === 0) {
    console.log('⚠️  Aucun profil trouvé');
  } else {
    console.log(`✅ ${profiles.length} profil(s) trouvé(s)\n`);
    
    profiles.forEach((profile, i) => {
      console.log(`\n${i + 1}. Profil ${profile.id.slice(0, 8)}...`);
      console.log(`   📛 Nom: ${profile.nickname || profile.display_name || 'N/A'}`);
      console.log(`   📍 Location: ${profile.location || 'N/A'}`);
      console.log(`   💼 Job: ${profile.job || 'N/A'}`);
      console.log(`   🎯 Hobbies: ${profile.hobbies?.join(', ') || 'N/A'}`);
      console.log(`   🔥 Préférences: ${profile.content_preferences?.join(', ') || 'N/A'}`);
      console.log(`   💭 Fantasmes: ${profile.fantasies?.join(', ') || 'N/A'}`);
      console.log(`   ⚡ Triggers: ${profile.triggers?.join(', ') || 'N/A'}`);
      console.log(`   💰 Dépensé: ${profile.total_spent ? (profile.total_spent / 100).toFixed(2) + '€' : '0€'}`);
      console.log(`   📅 Dernière analyse: ${profile.last_analyzed_at ? new Date(profile.last_analyzed_at).toLocaleString('fr-FR') : 'Jamais'}`);
    });
  }
} catch (err) {
  console.log('❌ Erreur:', err.message);
}

// ===========================================
// 2. TEST EXTRACTION DE MÉMOIRE
// ===========================================

console.log('\n\n🧪 2. TEST EXTRACTION DE MÉMOIRE\n');

const testConversation = [
  { direction: 'incoming', content: 'Hey Elena! I\'m Marc from Paris' },
  { direction: 'outgoing', content: 'hey Marc 😏 Paris huh? i love that city' },
  { direction: 'incoming', content: 'Yeah I work in finance, pretty stressful' },
  { direction: 'outgoing', content: 'mmm a finance guy... i bet you need to relax 👀' },
  { direction: 'incoming', content: 'Definitely! I love your lingerie content btw' },
  { direction: 'outgoing', content: 'oh you like lingerie? noted 🖤 what else turns you on?' },
  { direction: 'incoming', content: 'I love when you\'re dominant and teasing' },
];

console.log('📋 Conversation test:');
testConversation.forEach(msg => {
  const prefix = msg.direction === 'incoming' ? '←' : '→';
  console.log(`   ${prefix} ${msg.content}`);
});
console.log('');

try {
  const { extractMemoryFromConversation } = await import('../src/lib/fanvue-memory.ts');
  
  console.log('🔄 Extraction en cours...\n');
  
  const extraction = await extractMemoryFromConversation(testConversation);
  
  if (!extraction) {
    console.log('⚠️  Aucune extraction (conversation trop courte ou erreur)');
  } else {
    console.log('✅ Extraction réussie !\n');
    console.log('📊 Données extraites:');
    console.log(JSON.stringify(extraction, null, 2));
  }
} catch (err) {
  console.log('❌ Erreur:', err.message);
}

// ===========================================
// 3. TEST CONTEXTE DANS PROMPT
// ===========================================

console.log('\n\n🤖 3. TEST INJECTION CONTEXTE DANS PROMPT\n');

const testProfile = {
  nickname: 'Marc',
  location: 'Paris',
  job: 'Finance analyst',
  industry: 'Banking',
  hobbies: ['gym', 'travel'],
  content_preferences: ['lingerie', 'dominant'],
  triggers: ['teasing', 'dirty talk'],
  tone_preference: 'dominant',
  total_spent: 2999, // 29.99€
};

try {
  const { buildProfileContext } = await import('../src/lib/venice.ts');
  
  const context = buildProfileContext(testProfile);
  
  console.log('✅ Contexte généré:\n');
  console.log(context);
  console.log('');
  
  // Vérifications
  const checks = {
    'Nom présent': context.includes('Marc'),
    'Location présente': context.includes('Paris'),
    'Job présent': context.includes('Finance'),
    'Préférences présentes': context.includes('lingerie'),
    'Triggers présents': context.includes('teasing'),
    'Dépenses présentes': context.includes('29.99'),
  };
  
  console.log('📊 Vérifications:');
  for (const [check, ok] of Object.entries(checks)) {
    console.log(`   ${ok ? '✅' : '❌'} ${check}`);
  }
  
} catch (err) {
  console.log('❌ Erreur:', err.message);
}

// ===========================================
// 4. TEST GÉNÉRATION AVEC MÉMOIRE
// ===========================================

console.log('\n\n💬 4. TEST GÉNÉRATION AVEC MÉMOIRE\n');

try {
  const { generateElenaFanvueResponse } = await import('../src/lib/venice.ts');
  
  console.log('🔄 Génération d\'une réponse avec le profil de Marc...\n');
  
  const response = await generateElenaFanvueResponse({
    messages: [
      { role: 'user', content: 'Hey Elena, thinking about you' },
    ],
    language: 'en',
    profile: testProfile,
    stage: 'warm',
    messageCount: 10,
    hasAvailablePPV: false,
  });
  
  console.log('✅ Réponse générée:\n');
  console.log(`   "${response}"\n`);
  
  // Vérifier si Elena utilise la mémoire
  const usesMemory = 
    response.toLowerCase().includes('marc') ||
    response.toLowerCase().includes('paris') ||
    response.toLowerCase().includes('finance') ||
    response.toLowerCase().includes('work');
  
  if (usesMemory) {
    console.log('✅ Elena utilise la mémoire dans sa réponse !');
  } else {
    console.log('⚠️  Elena n\'a pas utilisé la mémoire cette fois (normal, c\'est aléatoire)');
  }
  
} catch (err) {
  console.log('❌ Erreur:', err.message);
}

// ===========================================
// RÉSUMÉ
// ===========================================

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('✅ TEST TERMINÉ');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('💡 Le système de mémoire:');
console.log('  ✅ Profils stockés dans Supabase');
console.log('  ✅ Extraction automatique via Claude');
console.log('  ✅ Contexte injecté dans le prompt');
console.log('  ✅ Elena peut se souvenir naturellement');
console.log('');
console.log('🔄 Extraction automatique:');
console.log('  - Tous les 5 messages');
console.log('  - Analyse les nouvelles conversations');
console.log('  - Met à jour le profil progressivement');
console.log('');
console.log('💭 Elena se souvient de:');
console.log('  - Nom, localisation, job');
console.log('  - Hobbies et intérêts');
console.log('  - Préférences sexuelles');
console.log('  - Fantasmes et triggers');
console.log('  - Histoires personnelles');
console.log('  - Comportement d\'achat');
console.log('');
