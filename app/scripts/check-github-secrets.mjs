#!/usr/bin/env node
/**
 * Vérifie que les tokens locaux (.env.local) correspondent aux secrets GitHub
 * 
 * Usage: node scripts/check-github-secrets.mjs
 * 
 * Ce script affiche les tokens locaux (masqués) pour que tu puisses les comparer
 * manuellement avec les secrets GitHub Actions.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');

// Load env
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) env[key.trim()] = val.join('=').trim();
});

console.log('🔍 Vérification synchronisation tokens GitHub ↔ Local\n');
console.log('📋 Compare ces valeurs avec tes secrets GitHub Actions:\n');
console.log('   GitHub → Settings → Secrets and variables → Actions\n\n');

// Elena tokens
const elenaToken = env.INSTAGRAM_ACCESS_TOKEN_ELENA;
const elenaAccountId = env.INSTAGRAM_ACCOUNT_ID_ELENA;

if (elenaToken) {
  console.log('📸 ELENA:');
  console.log(`   Secret GitHub: INSTAGRAM_ACCESS_TOKEN_ELENA`);
  console.log(`   Token local:    ${elenaToken.slice(0, 20)}...${elenaToken.slice(-10)}`);
  console.log(`   Longueur:      ${elenaToken.length} caractères`);
  console.log(`   Début:         ${elenaToken.slice(0, 10)}`);
  console.log(`   Fin:           ...${elenaToken.slice(-10)}\n`);
  
  console.log(`   Secret GitHub: INSTAGRAM_ACCOUNT_ID_ELENA`);
  console.log(`   Account ID:    ${elenaAccountId || '❌ MANQUANT'}\n`);
} else {
  console.log('❌ INSTAGRAM_ACCESS_TOKEN_ELENA non trouvé dans .env.local\n');
}

// Mila tokens
const milaToken = env.INSTAGRAM_ACCESS_TOKEN;
const milaAccountId = env.INSTAGRAM_ACCOUNT_ID;

if (milaToken) {
  console.log('📸 MILA:');
  console.log(`   Secret GitHub: INSTAGRAM_ACCESS_TOKEN`);
  console.log(`   Token local:    ${milaToken.slice(0, 20)}...${milaToken.slice(-10)}`);
  console.log(`   Longueur:      ${milaToken.length} caractères`);
  console.log(`   Début:         ${milaToken.slice(0, 10)}`);
  console.log(`   Fin:           ...${milaToken.slice(-10)}\n`);
  
  console.log(`   Secret GitHub: INSTAGRAM_ACCOUNT_ID`);
  console.log(`   Account ID:    ${milaAccountId || '❌ MANQUANT'}\n`);
} else {
  console.log('❌ INSTAGRAM_ACCESS_TOKEN non trouvé dans .env.local\n');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📝 Instructions:\n');
console.log('1. Va sur: https://github.com/edouardtiem/ig-influencer/settings/secrets/actions');
console.log('2. Compare les valeurs affichées ci-dessus avec les secrets GitHub');
console.log('3. Si les tokens ne correspondent PAS, mets à jour les secrets GitHub\n');
console.log('💡 Astuce: Les tokens doivent être identiques (même longueur, même début/fin)');
console.log('   Si le token local fonctionne mais pas GitHub, c\'est que GitHub est désynchronisé.\n');

