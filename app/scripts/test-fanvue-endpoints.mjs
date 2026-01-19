#!/usr/bin/env node
/**
 * Test des différents endpoints Fanvue pour trouver lesquels fonctionnent
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
console.log('🔍 TEST DES ENDPOINTS FANVUE');
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

console.log('🔑 Token chargé:', accessToken.slice(0, 30) + '...\n');

// Liste des endpoints à tester
const endpoints = [
  { method: 'GET', path: '/creator', description: 'Profil créateur' },
  { method: 'GET', path: '/me', description: 'Mon profil' },
  { method: 'GET', path: '/profile', description: 'Profil' },
  { method: 'GET', path: '/user', description: 'Utilisateur' },
  { method: 'GET', path: '/chats', description: 'Liste des chats' },
  { method: 'GET', path: '/messages', description: 'Messages' },
  { method: 'GET', path: '/posts', description: 'Posts' },
  { method: 'GET', path: '/analytics', description: 'Analytics' },
  { method: 'GET', path: '/subscribers', description: 'Abonnés' },
  { method: 'GET', path: '/followers', description: 'Followers' },
];

console.log('🧪 Test des endpoints...\n');

for (const endpoint of endpoints) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint.path}`, {
      method: endpoint.method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    const status = response.status;
    const statusText = response.statusText;
    
    let result = '';
    if (status === 200) {
      result = '✅';
      const data = await response.json();
      const preview = JSON.stringify(data).slice(0, 100);
      console.log(`${result} ${endpoint.method} ${endpoint.path} (${status}) - ${endpoint.description}`);
      console.log(`   Preview: ${preview}...\n`);
    } else if (status === 404) {
      result = '❌';
      console.log(`${result} ${endpoint.method} ${endpoint.path} (${status}) - Endpoint n'existe pas\n`);
    } else if (status === 401) {
      result = '🔒';
      console.log(`${result} ${endpoint.method} ${endpoint.path} (${status}) - Non autorisé\n`);
    } else {
      result = '⚠️ ';
      const error = await response.text();
      console.log(`${result} ${endpoint.method} ${endpoint.path} (${status}) - ${statusText}`);
      console.log(`   Error: ${error.slice(0, 100)}...\n`);
    }
  } catch (error) {
    console.log(`❌ ${endpoint.method} ${endpoint.path} - Erreur: ${error.message}\n`);
  }
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ TEST TERMINÉ');
console.log('═══════════════════════════════════════════════════════════════');
