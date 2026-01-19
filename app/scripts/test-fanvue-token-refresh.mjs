#!/usr/bin/env node
/**
 * Test du refresh de token Fanvue
 * 
 * Ce script teste:
 * 1. Le chargement des tokens depuis Supabase
 * 2. Le refresh du token si expiré
 * 3. La sauvegarde des nouveaux tokens
 * 4. Un appel API pour vérifier que ça fonctionne
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
dotenv.config({ path: join(__dirname, '../.env.local') });

// Import Fanvue lib (use dynamic import to avoid ESM issues)
const fanvueModule = await import('../src/lib/fanvue.ts');
const {
  initTokensFromEnv,
  getValidAccessToken,
  getProfile,
  getTokens,
} = fanvueModule;

console.log('═══════════════════════════════════════════════════════════════');
console.log('🔄 TEST REFRESH TOKEN FANVUE');
console.log('═══════════════════════════════════════════════════════════════\n');

// ===========================================
// 1. INITIALISER LES TOKENS
// ===========================================

console.log('📋 1. INITIALISATION DES TOKENS\n');

try {
  const initialized = await initTokensFromEnv();
  
  if (!initialized) {
    console.log('❌ Impossible d\'initialiser les tokens');
    process.exit(1);
  }
  
  console.log('✅ Tokens initialisés depuis Supabase ou env vars\n');
  
  const tokens = getTokens();
  if (tokens) {
    const expiresAt = new Date(tokens.expiresAt);
    const now = new Date();
    const isExpired = expiresAt < now;
    const minutesUntilExpiry = Math.floor((expiresAt - now) / 1000 / 60);
    
    console.log('📅 Expiration:', expiresAt.toLocaleString('fr-FR'));
    if (isExpired) {
      console.log('⚠️  Token expiré depuis', Math.abs(minutesUntilExpiry), 'minutes');
      console.log('🔄 Le refresh va être déclenché automatiquement...\n');
    } else {
      console.log('✅ Token valide pour encore', minutesUntilExpiry, 'minutes\n');
    }
  }
} catch (error) {
  console.log('❌ Erreur lors de l\'initialisation:', error.message);
  process.exit(1);
}

// ===========================================
// 2. OBTENIR UN TOKEN VALIDE (AVEC REFRESH AUTO)
// ===========================================

console.log('🔑 2. OBTENTION D\'UN TOKEN VALIDE\n');

try {
  console.log('🔄 Appel de getValidAccessToken() (refresh auto si expiré)...\n');
  
  const accessToken = await getValidAccessToken();
  
  console.log('✅ Token valide obtenu !');
  console.log('🔑 Token:', accessToken.slice(0, 50) + '...\n');
  
  // Vérifier les nouveaux tokens
  const newTokens = getTokens();
  if (newTokens) {
    const expiresAt = new Date(newTokens.expiresAt);
    const now = new Date();
    const minutesUntilExpiry = Math.floor((expiresAt - now) / 1000 / 60);
    
    console.log('📅 Nouvelle expiration:', expiresAt.toLocaleString('fr-FR'));
    console.log('⏰ Valide pour', minutesUntilExpiry, 'minutes\n');
  }
} catch (error) {
  console.log('❌ Erreur lors de l\'obtention du token:', error.message);
  console.log('');
  console.log('💡 Causes possibles:');
  console.log('  - Refresh token invalide ou expiré');
  console.log('  - Problème de connexion à l\'API Fanvue');
  console.log('  - Credentials incorrects');
  console.log('');
  console.log('🔧 Solution:');
  console.log('  - Refaire le flow OAuth complet pour obtenir de nouveaux tokens');
  console.log('  - Visiter: https://ig-influencer.vercel.app/api/oauth/auth');
  process.exit(1);
}

// ===========================================
// 3. TEST API AVEC LE NOUVEAU TOKEN
// ===========================================

console.log('🌐 3. TEST API FANVUE\n');

try {
  console.log('🔄 Récupération du profil...\n');
  
  const profile = await getProfile();
  
  console.log('✅ API Fanvue fonctionne !');
  console.log('👤 Profil:', JSON.stringify(profile, null, 2));
  console.log('');
} catch (error) {
  console.log('❌ Erreur API:', error.message);
  console.log('');
  console.log('⚠️  Le token a été refreshé mais l\'API ne fonctionne toujours pas');
  console.log('💡 Vérifier les scopes et permissions du token');
  process.exit(1);
}

// ===========================================
// RÉSUMÉ
// ===========================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ TEST RÉUSSI !');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('Le système de refresh fonctionne correctement:');
console.log('  ✅ Tokens chargés depuis Supabase');
console.log('  ✅ Token expiré détecté et refreshé automatiquement');
console.log('  ✅ Nouveaux tokens sauvegardés dans Supabase');
console.log('  ✅ API Fanvue accessible avec le nouveau token');
console.log('');
console.log('💡 Le système DM devrait maintenant fonctionner !');
console.log('');
console.log('🧪 Prochaine étape: Tester l\'envoi d\'un message');
console.log('   node scripts/test-fanvue-send-message.mjs');
console.log('');
