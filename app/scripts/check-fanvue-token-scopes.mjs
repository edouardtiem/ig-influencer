#!/usr/bin/env node
/**
 * Vérifier les scopes du token Fanvue
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
console.log('🔍 VÉRIFICATION DES SCOPES DU TOKEN FANVUE');
console.log('═══════════════════════════════════════════════════════════════\n');

// Charger le token depuis Supabase
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

// Décoder le JWT pour voir les scopes
console.log('🔑 Décodage du JWT...\n');

const parts = accessToken.split('.');
if (parts.length !== 3) {
  console.log('❌ Token invalide (pas un JWT)');
  process.exit(1);
}

try {
  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
  
  console.log('📋 Informations du token:\n');
  console.log('  Issuer:', payload.iss || 'N/A');
  console.log('  Subject:', payload.sub || 'N/A');
  console.log('  Audience:', payload.aud || 'N/A');
  console.log('  Expires:', payload.exp ? new Date(payload.exp * 1000).toLocaleString('fr-FR') : 'N/A');
  console.log('  Issued at:', payload.iat ? new Date(payload.iat * 1000).toLocaleString('fr-FR') : 'N/A');
  console.log('');
  
  if (payload.scope || payload.scp) {
    const scopeValue = payload.scope || payload.scp;
    let scopes = [];
    
    if (typeof scopeValue === 'string') {
      scopes = scopeValue.split(' ');
    } else if (Array.isArray(scopeValue)) {
      scopes = scopeValue;
    }
    
    console.log('✅ Scopes du token:\n');
    scopes.forEach(scope => {
      console.log(`  - ${scope}`);
    });
    console.log('');
    
    // Vérifier les scopes critiques
    const criticalScopes = ['write:chat', 'write:message', 'chat:write'];
    const hasWriteChat = criticalScopes.some(s => scopes.includes(s));
    
    if (hasWriteChat) {
      console.log('✅ Le token a les permissions d\'écriture de messages');
    } else {
      console.log('⚠️  Le token n\'a PAS les permissions d\'écriture de messages');
      console.log('   Scopes manquants:', criticalScopes.join(', '));
      console.log('');
      console.log('💡 Solution:');
      console.log('   - Refaire le flow OAuth avec les bons scopes');
      console.log('   - Vérifier FANVUE_SCOPES dans .env.local');
    }
  } else {
    console.log('⚠️  Aucun scope trouvé dans le token');
  }
  
  console.log('\n📝 Payload complet:\n');
  console.log(JSON.stringify(payload, null, 2));
  
} catch (error) {
  console.log('❌ Erreur lors du décodage:', error.message);
}

console.log('\n═══════════════════════════════════════════════════════════════');
