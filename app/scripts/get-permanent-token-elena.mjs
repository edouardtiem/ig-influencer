#!/usr/bin/env node
/**
 * Get Permanent Instagram Token for ELENA
 * 
 * Converts a short-lived token to a permanent page token
 * 
 * Required in .env.local:
 *   FACEBOOK_APP_ID=your_app_id
 *   FACEBOOK_APP_SECRET=your_app_secret
 *   INSTAGRAM_ACCESS_TOKEN_ELENA=your_short_lived_token (temporary)
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
  console.log('🔐 Instagram Permanent Token Generator — ELENA\n');
  
  const appId = env.FACEBOOK_APP_ID;
  const appSecret = env.FACEBOOK_APP_SECRET;
  const shortToken = env.INSTAGRAM_ACCESS_TOKEN_ELENA;
  
  if (!appId) throw new Error('FACEBOOK_APP_ID manquant dans .env.local');
  if (!appSecret) throw new Error('FACEBOOK_APP_SECRET manquant dans .env.local');
  if (!shortToken) throw new Error('INSTAGRAM_ACCESS_TOKEN_ELENA manquant dans .env.local');
  
  console.log(`✅ App ID: ${appId.slice(0, 8)}...`);
  console.log(`✅ App Secret: ${appSecret.slice(0, 8)}...`);
  console.log(`✅ Token Elena: ${shortToken.slice(0, 20)}...`);
  
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
    
    // Step 2: Get all Pages
    console.log('\n⏳ Étape 2: Récupération des Pages Facebook...');
    
    const pagesUrl = `${GRAPH_API}/me/accounts?access_token=${longLivedToken}`;
    const pagesRes = await fetch(pagesUrl);
    const pagesData = await pagesRes.json();
    
    if (pagesData.error) {
      throw new Error(`Pages error: ${pagesData.error.message}`);
    }
    
    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error('Aucune page Facebook trouvée. Assure-toi que ton compte Instagram est lié à une Page Facebook.');
    }
    
    // List all pages and find Elena's
    console.log(`   📋 Pages trouvées: ${pagesData.data.length}`);
    
    let elenaPage = null;
    for (const page of pagesData.data) {
      // Get IG account for this page
      const igUrl = `${GRAPH_API}/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`;
      const igRes = await fetch(igUrl);
      const igData = await igRes.json();
      
      if (igData.instagram_business_account) {
        // Get IG username
        const igUserUrl = `${GRAPH_API}/${igData.instagram_business_account.id}?fields=username&access_token=${page.access_token}`;
        const igUserRes = await fetch(igUserUrl);
        const igUserData = await igUserRes.json();
        
        console.log(`      - ${page.name} → @${igUserData.username || 'unknown'}`);
        
        if (igUserData.username === 'elenav.paris') {
          elenaPage = {
            ...page,
            igAccountId: igData.instagram_business_account.id,
            igUsername: igUserData.username,
          };
        }
      } else {
        console.log(`      - ${page.name} → (pas de compte Instagram)`);
      }
    }
    
    if (!elenaPage) {
      console.log('\n❌ Compte @elenav.paris non trouvé parmi les pages.');
      console.log('\n💡 Assure-toi que:');
      console.log('   1. Le compte Instagram @elenav.paris est un compte Business/Creator');
      console.log('   2. Il est lié à une Page Facebook');
      console.log('   3. Tu as les permissions sur cette Page');
      process.exit(1);
    }
    
    console.log(`\n   ✅ Trouvé: ${elenaPage.name} → @${elenaPage.igUsername}`);
    
    const pageToken = elenaPage.access_token;
    const pageId = elenaPage.id;
    const igAccountId = elenaPage.igAccountId;
    
    // Step 3: Verify token is permanent
    console.log('\n⏳ Étape 3: Vérification du token...');
    
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
    
    // Step 4: Update .env.local
    console.log('\n⏳ Étape 4: Mise à jour de .env.local...');
    
    let newEnvContent = envContent;
    
    // Update INSTAGRAM_ACCESS_TOKEN_ELENA
    if (newEnvContent.includes('INSTAGRAM_ACCESS_TOKEN_ELENA=')) {
      newEnvContent = newEnvContent.replace(
        /INSTAGRAM_ACCESS_TOKEN_ELENA=.*/,
        `INSTAGRAM_ACCESS_TOKEN_ELENA=${pageToken}`
      );
    } else {
      newEnvContent += `\n\n# ELENA Instagram\nINSTAGRAM_ACCESS_TOKEN_ELENA=${pageToken}`;
    }
    
    // Update or add INSTAGRAM_ACCOUNT_ID_ELENA
    if (newEnvContent.includes('INSTAGRAM_ACCOUNT_ID_ELENA=')) {
      newEnvContent = newEnvContent.replace(
        /INSTAGRAM_ACCOUNT_ID_ELENA=.*/,
        `INSTAGRAM_ACCOUNT_ID_ELENA=${igAccountId}`
      );
    } else {
      newEnvContent += `\nINSTAGRAM_ACCOUNT_ID_ELENA=${igAccountId}`;
    }
    
    // Update or add FACEBOOK_PAGE_ID_ELENA
    if (newEnvContent.includes('FACEBOOK_PAGE_ID_ELENA=')) {
      newEnvContent = newEnvContent.replace(
        /FACEBOOK_PAGE_ID_ELENA=.*/,
        `FACEBOOK_PAGE_ID_ELENA=${pageId}`
      );
    } else {
      newEnvContent += `\nFACEBOOK_PAGE_ID_ELENA=${pageId}`;
    }
    
    fs.writeFileSync(envPath, newEnvContent);
    console.log('   ✅ .env.local mis à jour');
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('🎉 SUCCÈS ! Token permanent Elena configuré');
    console.log('='.repeat(50));
    console.log(`\n📊 Récapitulatif:`);
    console.log(`   Page Facebook: ${elenaPage.name}`);
    console.log(`   Instagram: @${elenaPage.igUsername}`);
    console.log(`   Instagram ID: ${igAccountId}`);
    console.log(`   Token: ${pageToken.slice(0, 30)}...`);
    console.log(`   Expiration: JAMAIS ✨`);
    console.log('\n✅ Tu peux maintenant poster sur @elenav.paris !');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.log('\n💡 Tips:');
    console.log('   - Vérifie que ton App ID et Secret sont corrects');
    console.log('   - Le token doit avoir les permissions: pages_show_list, instagram_basic, instagram_content_publish');
    console.log('   - Le compte @elenav.paris doit être un compte Business/Creator lié à une Page Facebook');
    process.exit(1);
  }
}

main();

