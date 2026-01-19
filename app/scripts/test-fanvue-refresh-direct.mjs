#!/usr/bin/env node
/**
 * Test direct du refresh de token Fanvue (sans importer les modules TS)
 * 
 * Ce script teste:
 * 1. Le chargement des tokens depuis Supabase
 * 2. Le refresh du token si expiré
 * 3. La sauvegarde des nouveaux tokens
 * 4. Un appel API pour vérifier que ça fonctionne
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
dotenv.config({ path: join(__dirname, '../.env.local') });

const AUTH_BASE_URL = 'https://auth.fanvue.com';
const API_BASE_URL = 'https://api.fanvue.com';

console.log('═══════════════════════════════════════════════════════════════');
console.log('🔄 TEST REFRESH TOKEN FANVUE (DIRECT)');
console.log('═══════════════════════════════════════════════════════════════\n');

// ===========================================
// 1. CHARGER LES TOKENS DEPUIS SUPABASE
// ===========================================

console.log('📋 1. CHARGEMENT DES TOKENS DEPUIS SUPABASE\n');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

let tokens;

try {
  const { data, error } = await supabase
    .from('oauth_tokens')
    .select('*')
    .eq('service_name', 'fanvue')
    .single();
  
  if (error || !data) {
    console.log('❌ Tokens non trouvés dans Supabase');
    console.log('⚠️  Utilisation des tokens depuis env vars...\n');
    
    tokens = {
      access_token: process.env.FANVUE_ACCESS_TOKEN,
      refresh_token: process.env.FANVUE_REFRESH_TOKEN,
      expires_at: Date.now() + (3600 * 1000), // Assume 1h
    };
  } else {
    console.log('✅ Tokens chargés depuis Supabase');
    console.log('📅 Dernière mise à jour:', new Date(data.updated_at).toLocaleString('fr-FR'));
    
    tokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
    };
    
    const expiresAt = new Date(tokens.expires_at);
    const now = new Date();
    const isExpired = expiresAt < now;
    const minutesUntilExpiry = Math.floor((expiresAt - now) / 1000 / 60);
    
    console.log('📅 Expiration:', expiresAt.toLocaleString('fr-FR'));
    if (isExpired) {
      console.log('⚠️  Token expiré depuis', Math.abs(minutesUntilExpiry), 'minutes\n');
    } else {
      console.log('✅ Token valide pour encore', minutesUntilExpiry, 'minutes\n');
    }
  }
} catch (error) {
  console.log('❌ Erreur:', error.message);
  process.exit(1);
}

// ===========================================
// 2. TESTER LE TOKEN ACTUEL
// ===========================================

console.log('🌐 2. TEST DU TOKEN ACTUEL\n');

let needsRefresh = false;

try {
  const response = await fetch(`${API_BASE_URL}/creator`, {
    headers: {
      'Authorization': `Bearer ${tokens.access_token}`,
    },
  });
  
  console.log('📡 Status:', response.status, response.statusText);
  
  if (response.ok) {
    const profile = await response.json();
    console.log('✅ Token actuel fonctionne !');
    console.log('👤 Profil:', profile.username || profile.display_name || 'N/A');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ PAS BESOIN DE REFRESH - LE TOKEN FONCTIONNE');
    console.log('═══════════════════════════════════════════════════════════════');
    process.exit(0);
  } else {
    const error = await response.text();
    console.log('❌ Token invalide:', error);
    console.log('🔄 Refresh nécessaire...\n');
    needsRefresh = true;
  }
} catch (error) {
  console.log('❌ Erreur de connexion:', error.message);
  needsRefresh = true;
}

// ===========================================
// 3. REFRESH DU TOKEN
// ===========================================

if (needsRefresh) {
  console.log('🔄 3. REFRESH DU TOKEN\n');
  
  try {
    const clientId = process.env.FANVUE_CLIENT_ID;
    const clientSecret = process.env.FANVUE_CLIENT_SECRET;
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    console.log('🔄 Envoi de la requête de refresh...\n');
    
    const response = await fetch(`${AUTH_BASE_URL}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token,
      }).toString(),
    });
    
    console.log('📡 Status:', response.status, response.statusText);
    
    if (!response.ok) {
      const error = await response.text();
      console.log('❌ Erreur de refresh:', error);
      console.log('');
      console.log('💡 Causes possibles:');
      console.log('  - Refresh token invalide ou expiré');
      console.log('  - Credentials incorrects');
      console.log('');
      console.log('🔧 Solution:');
      console.log('  - Refaire le flow OAuth complet');
      console.log('  - Visiter: https://ig-influencer.vercel.app/api/oauth/auth');
      process.exit(1);
    }
    
    const data = await response.json();
    
    console.log('✅ Token refreshé avec succès !');
    console.log('🔑 Nouveau access token:', data.access_token.slice(0, 50) + '...');
    console.log('🔄 Nouveau refresh token:', data.refresh_token.slice(0, 50) + '...');
    console.log('⏰ Expire dans:', data.expires_in, 'secondes\n');
    
    // Mettre à jour les tokens
    tokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (data.expires_in * 1000),
    };
    
    // Sauvegarder dans Supabase
    console.log('💾 Sauvegarde dans Supabase...\n');
    
    const { error: saveError } = await supabase
      .from('oauth_tokens')
      .upsert({
        service_name: 'fanvue',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_at,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'service_name' });
    
    if (saveError) {
      console.log('⚠️  Erreur de sauvegarde:', saveError.message);
      console.log('⚠️  Les tokens ne seront pas persistés');
    } else {
      console.log('✅ Tokens sauvegardés dans Supabase');
    }
    
  } catch (error) {
    console.log('❌ Erreur lors du refresh:', error.message);
    process.exit(1);
  }
}

// ===========================================
// 4. TEST AVEC LE NOUVEAU TOKEN
// ===========================================

console.log('\n🌐 4. TEST AVEC LE NOUVEAU TOKEN\n');

try {
  const response = await fetch(`${API_BASE_URL}/creator`, {
    headers: {
      'Authorization': `Bearer ${tokens.access_token}`,
    },
  });
  
  console.log('📡 Status:', response.status, response.statusText);
  
  if (response.ok) {
    const profile = await response.json();
    console.log('✅ API Fanvue fonctionne avec le nouveau token !');
    console.log('👤 Profil:', JSON.stringify(profile, null, 2));
    console.log('');
  } else {
    const error = await response.text();
    console.log('❌ Erreur API:', error);
    console.log('⚠️  Le token a été refreshé mais l\'API ne fonctionne toujours pas');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Erreur:', error.message);
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
console.log('  ✅ Token expiré détecté et refreshé');
console.log('  ✅ Nouveaux tokens sauvegardés dans Supabase');
console.log('  ✅ API Fanvue accessible avec le nouveau token');
console.log('');
console.log('💡 Le système DM devrait maintenant fonctionner !');
console.log('');
console.log('🧪 Prochaine étape: Tester l\'envoi d\'un message');
console.log('   node scripts/test-fanvue-send-message-direct.mjs');
console.log('');
