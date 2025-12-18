#!/usr/bin/env node
/**
 * Refresh Instagram Token for ELENA (60 days)
 * 
 * If existing token is still valid (even close to expiry), 
 * exchanges it for a fresh 60-day token.
 * 
 * If token is completely expired, provides instructions.
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
  console.log('🔄 Refresh Token Elena — 60 jours\n');
  
  const appId = env.FACEBOOK_APP_ID;
  const appSecret = env.FACEBOOK_APP_SECRET;
  const currentToken = env.INSTAGRAM_ACCESS_TOKEN_ELENA;
  
  if (!appId) throw new Error('FACEBOOK_APP_ID manquant dans .env.local');
  if (!appSecret) throw new Error('FACEBOOK_APP_SECRET manquant dans .env.local');
  if (!currentToken) throw new Error('INSTAGRAM_ACCESS_TOKEN_ELENA manquant dans .env.local');
  
  console.log(`✅ App ID: ${appId.slice(0, 8)}...`);
  console.log(`✅ Current Token: ${currentToken.slice(0, 20)}...`);
  
  try {
    // Step 1: Check if current token is still valid
    console.log('\n⏳ Étape 1: Vérification du token actuel...');
    
    const debugUrl = `${GRAPH_API}/debug_token?input_token=${currentToken}&access_token=${appId}|${appSecret}`;
    const debugRes = await fetch(debugUrl);
    const debugData = await debugRes.json();
    
    if (debugData.error) {
      console.log(`   ❌ Erreur debug: ${debugData.error.message}`);
    }
    
    const tokenInfo = debugData.data;
    
    if (tokenInfo) {
      const expiresAt = tokenInfo.expires_at;
      const isValid = tokenInfo.is_valid;
      
      console.log(`   Token valide: ${isValid ? '✅' : '❌'}`);
      
      if (expiresAt === 0) {
        console.log('   ✅ Token PERMANENT (n\'expire jamais)');
        console.log('\n🎉 Ton token Elena est déjà permanent, pas besoin de refresh !');
        return;
      } else if (expiresAt) {
        const expDate = new Date(expiresAt * 1000);
        const now = new Date();
        const daysLeft = Math.round((expDate - now) / (1000 * 60 * 60 * 24));
        
        console.log(`   Expire le: ${expDate.toLocaleDateString()} (${daysLeft} jours restants)`);
        
        if (!isValid || daysLeft < 0) {
          console.log('\n❌ Token expiré ! On va essayer de le récupérer via la Page...');
        }
      }
    }
    
    // Step 2: Try to exchange for long-lived token
    console.log('\n⏳ Étape 2: Tentative de refresh du token...');
    
    const refreshUrl = `${GRAPH_API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${currentToken}`;
    
    const refreshRes = await fetch(refreshUrl);
    const refreshData = await refreshRes.json();
    
    if (refreshData.error) {
      console.log(`   ❌ Refresh échoué: ${refreshData.error.message}`);
      
      // Try alternative: use page token from existing credentials
      console.log('\n⏳ Étape 2b: Tentative via le Page ID existant...');
      
      const pageId = env.FACEBOOK_PAGE_ID_ELENA;
      if (pageId) {
        // Try to get a fresh page token using app token
        const appToken = `${appId}|${appSecret}`;
        
        // This won't work without user token, but let's try
        const pageUrl = `${GRAPH_API}/${pageId}?fields=access_token&access_token=${currentToken}`;
        const pageRes = await fetch(pageUrl);
        const pageData = await pageRes.json();
        
        if (pageData.access_token) {
          console.log('   ✅ Nouveau Page Token obtenu !');
          await updateEnvWithToken(pageData.access_token);
          return;
        }
      }
      
      // If all fails, give instructions
      console.log('\n' + '='.repeat(60));
      console.log('⚠️  TOKEN COMPLÈTEMENT EXPIRÉ');
      console.log('='.repeat(60));
      console.log('\n📋 Pour obtenir un nouveau token:');
      console.log('\n1. Va sur: https://developers.facebook.com/tools/explorer/');
      console.log('2. Sélectionne ton app');
      console.log('3. Clique "Generate Access Token"');
      console.log('4. Ajoute les permissions:');
      console.log('   - pages_show_list');
      console.log('   - pages_read_engagement');
      console.log('   - instagram_basic');
      console.log('   - instagram_content_publish');
      console.log('5. Copie le nouveau token');
      console.log('6. Mets-le dans .env.local à INSTAGRAM_ACCESS_TOKEN_ELENA');
      console.log('7. Relance: node scripts/get-permanent-token-elena.mjs');
      console.log('\n💡 Tip: Le Page Token obtenu sera PERMANENT !');
      process.exit(1);
    }
    
    const newToken = refreshData.access_token;
    const expiresIn = refreshData.expires_in;
    console.log(`   ✅ Nouveau token (expire dans ${Math.round(expiresIn / 86400)} jours)`);
    
    // Step 3: Get permanent page token
    console.log('\n⏳ Étape 3: Récupération du Page Token permanent...');
    
    const pagesUrl = `${GRAPH_API}/me/accounts?access_token=${newToken}`;
    const pagesRes = await fetch(pagesUrl);
    const pagesData = await pagesRes.json();
    
    if (pagesData.error) {
      throw new Error(`Pages error: ${pagesData.error.message}`);
    }
    
    // Find Elena's page
    let elenaPage = null;
    for (const page of pagesData.data || []) {
      const igUrl = `${GRAPH_API}/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`;
      const igRes = await fetch(igUrl);
      const igData = await igRes.json();
      
      if (igData.instagram_business_account) {
        const igUserUrl = `${GRAPH_API}/${igData.instagram_business_account.id}?fields=username&access_token=${page.access_token}`;
        const igUserRes = await fetch(igUserUrl);
        const igUserData = await igUserRes.json();
        
        console.log(`   - ${page.name} → @${igUserData.username || 'unknown'}`);
        
        if (igUserData.username === 'elenav.paris') {
          elenaPage = {
            ...page,
            igAccountId: igData.instagram_business_account.id,
          };
        }
      }
    }
    
    if (!elenaPage) {
      throw new Error('Compte @elenav.paris non trouvé');
    }
    
    await updateEnvWithToken(elenaPage.access_token, elenaPage.id, elenaPage.igAccountId);
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

async function updateEnvWithToken(pageToken, pageId, igAccountId) {
  console.log('\n⏳ Mise à jour de .env.local...');
  
  let newEnvContent = envContent;
  
  // Update INSTAGRAM_ACCESS_TOKEN_ELENA
  if (newEnvContent.includes('INSTAGRAM_ACCESS_TOKEN_ELENA=')) {
    newEnvContent = newEnvContent.replace(
      /INSTAGRAM_ACCESS_TOKEN_ELENA=.*/,
      `INSTAGRAM_ACCESS_TOKEN_ELENA=${pageToken}`
    );
  }
  
  if (pageId && newEnvContent.includes('FACEBOOK_PAGE_ID_ELENA=')) {
    newEnvContent = newEnvContent.replace(
      /FACEBOOK_PAGE_ID_ELENA=.*/,
      `FACEBOOK_PAGE_ID_ELENA=${pageId}`
    );
  }
  
  if (igAccountId && newEnvContent.includes('INSTAGRAM_ACCOUNT_ID_ELENA=')) {
    newEnvContent = newEnvContent.replace(
      /INSTAGRAM_ACCOUNT_ID_ELENA=.*/,
      `INSTAGRAM_ACCOUNT_ID_ELENA=${igAccountId}`
    );
  }
  
  fs.writeFileSync(envPath, newEnvContent);
  console.log('   ✅ .env.local mis à jour');
  
  // Verify new token
  const appId = env.FACEBOOK_APP_ID;
  const appSecret = env.FACEBOOK_APP_SECRET;
  
  const debugUrl = `${GRAPH_API}/debug_token?input_token=${pageToken}&access_token=${appId}|${appSecret}`;
  const debugRes = await fetch(debugUrl);
  const debugData = await debugRes.json();
  
  const expiresAt = debugData.data?.expires_at;
  
  console.log('\n' + '='.repeat(50));
  console.log('🎉 SUCCÈS ! Token Elena mis à jour');
  console.log('='.repeat(50));
  console.log(`\nToken: ${pageToken.slice(0, 30)}...`);
  
  if (expiresAt === 0) {
    console.log('Expiration: JAMAIS ✨ (token permanent)');
  } else if (expiresAt) {
    const expDate = new Date(expiresAt * 1000);
    console.log(`Expiration: ${expDate.toLocaleDateString()}`);
  }
  
  console.log('\n✅ Tu peux maintenant poster sur @elenav.paris !');
}

main();

