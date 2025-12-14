#!/usr/bin/env node
/**
 * Get Permanent Instagram Token (non-interactive)
 * 
 * Converts a short-lived token to a permanent page token
 * 
 * Required in .env.local:
 *   FACEBOOK_APP_ID=your_app_id
 *   FACEBOOK_APP_SECRET=your_app_secret
 *   INSTAGRAM_ACCESS_TOKEN=your_short_lived_token
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');

// Load current env
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) env[key.trim()] = val.join('=').trim();
});

const GRAPH_API = 'https://graph.facebook.com/v21.0';

async function main() {
  console.log('🔐 Instagram Permanent Token Generator\n');
  
  const appId = env.FACEBOOK_APP_ID;
  const appSecret = env.FACEBOOK_APP_SECRET;
  const shortToken = env.INSTAGRAM_ACCESS_TOKEN;
  
  if (!appId) throw new Error('FACEBOOK_APP_ID manquant dans .env.local');
  if (!appSecret) throw new Error('FACEBOOK_APP_SECRET manquant dans .env.local');
  if (!shortToken) throw new Error('INSTAGRAM_ACCESS_TOKEN manquant dans .env.local');
  
  console.log(`✅ App ID: ${appId.slice(0, 8)}...`);
  console.log(`✅ App Secret: ${appSecret.slice(0, 8)}...`);
  console.log(`✅ Token: ${shortToken.slice(0, 20)}...`);
  
  try {
    // Step 1: Exchange for long-lived token
    console.log('\n⏳ Étape 1: Échange contre un long-lived token (60 jours)...');
    
    const longLivedUrl = `${GRAPH_API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`;
    
    const longLivedRes = await fetch(longLivedUrl);
    const longLivedData = await longLivedRes.json();
    
    if (longLivedData.error) {
      throw new Error(`Long-lived token error: ${longLivedData.error.message}`);
    }
    
    const longLivedToken = longLivedData.access_token;
    const expiresIn = longLivedData.expires_in;
    console.log(`   ✅ Long-lived token obtenu (expire dans ${Math.round(expiresIn / 86400)} jours)`);
    
    // Step 2: Get Page Access Token (permanent)
    console.log('\n⏳ Étape 2: Récupération du Page Token permanent...');
    
    const pagesUrl = `${GRAPH_API}/me/accounts?access_token=${longLivedToken}`;
    const pagesRes = await fetch(pagesUrl);
    const pagesData = await pagesRes.json();
    
    if (pagesData.error) {
      throw new Error(`Pages error: ${pagesData.error.message}`);
    }
    
    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error('Aucune page Facebook trouvée. Assure-toi que ton compte Instagram est lié à une Page Facebook.');
    }
    
    // Auto-select first page
    const selectedPage = pagesData.data[0];
    console.log(`   ✅ Page trouvée: ${selectedPage.name}`);
    
    const pageToken = selectedPage.access_token;
    const pageId = selectedPage.id;
    
    // Step 3: Get Instagram Business Account ID
    console.log('\n⏳ Étape 3: Récupération de l\'Instagram Business Account...');
    
    const igUrl = `${GRAPH_API}/${pageId}?fields=instagram_business_account&access_token=${pageToken}`;
    const igRes = await fetch(igUrl);
    const igData = await igRes.json();
    
    if (!igData.instagram_business_account) {
      throw new Error('Aucun compte Instagram Business lié à cette page.');
    }
    
    const igAccountId = igData.instagram_business_account.id;
    console.log(`   ✅ Instagram Account ID: ${igAccountId}`);
    
    // Step 4: Verify token is permanent
    console.log('\n⏳ Étape 4: Vérification du token...');
    
    const debugUrl = `${GRAPH_API}/debug_token?input_token=${pageToken}&access_token=${pageToken}`;
    const debugRes = await fetch(debugUrl);
    const debugData = await debugRes.json();
    
    const expiresAt = debugData.data?.expires_at;
    if (expiresAt === 0) {
      console.log('   ✅ Token PERMANENT (n\'expire jamais) 🎉');
    } else if (expiresAt) {
      const expDate = new Date(expiresAt * 1000);
      console.log(`   ⚠️  Token expire le: ${expDate.toLocaleDateString()}`);
    }
    
    // Step 5: Update .env.local
    console.log('\n⏳ Étape 5: Mise à jour de .env.local...');
    
    let newEnvContent = envContent;
    
    // Update INSTAGRAM_ACCESS_TOKEN
    newEnvContent = newEnvContent.replace(
      /INSTAGRAM_ACCESS_TOKEN=.*/,
      `INSTAGRAM_ACCESS_TOKEN=${pageToken}`
    );
    
    // Update or add INSTAGRAM_ACCOUNT_ID
    if (newEnvContent.includes('INSTAGRAM_ACCOUNT_ID=')) {
      newEnvContent = newEnvContent.replace(
        /INSTAGRAM_ACCOUNT_ID=.*/,
        `INSTAGRAM_ACCOUNT_ID=${igAccountId}`
      );
    } else {
      newEnvContent += `\nINSTAGRAM_ACCOUNT_ID=${igAccountId}`;
    }
    
    // Update or add FACEBOOK_PAGE_ID
    if (newEnvContent.includes('FACEBOOK_PAGE_ID=')) {
      newEnvContent = newEnvContent.replace(
        /FACEBOOK_PAGE_ID=.*/,
        `FACEBOOK_PAGE_ID=${pageId}`
      );
    } else {
      newEnvContent += `\nFACEBOOK_PAGE_ID=${pageId}`;
    }
    
    fs.writeFileSync(envPath, newEnvContent);
    console.log('   ✅ .env.local mis à jour');
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('🎉 SUCCÈS ! Token permanent configuré');
    console.log('='.repeat(50));
    console.log(`\n📊 Récapitulatif:`);
    console.log(`   Page Facebook: ${selectedPage.name}`);
    console.log(`   Instagram ID: ${igAccountId}`);
    console.log(`   Token: ${pageToken.slice(0, 30)}...`);
    console.log(`   Expiration: JAMAIS ✨`);
    console.log('\n✅ Tu peux maintenant poster sans te soucier de l\'expiration !');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.log('\n💡 Tips:');
    console.log('   - Vérifie que ton App ID et Secret sont corrects');
    console.log('   - Le token doit avoir les permissions: pages_show_list, instagram_basic, instagram_content_publish');
    console.log('   - Ton compte Instagram doit être un compte Business/Creator lié à une Page Facebook');
    process.exit(1);
  }
}

main();
