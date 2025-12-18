#!/usr/bin/env node
/**
 * Refresh ALL Instagram Tokens (Mila + Elena) in ONE session
 * 
 * This script takes a fresh User Token and generates BOTH Page Tokens
 * from the same session, so they don't invalidate each other.
 * 
 * Usage: node scripts/refresh-all-tokens.mjs USER_TOKEN
 * 
 * Required:
 *   - FACEBOOK_APP_ID in .env.local
 *   - FACEBOOK_APP_SECRET in .env.local
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

// Known Page IDs
const PAGES = {
  mila: {
    name: 'Mila Verne',
    pageId: '941108822414254',
    tokenVar: 'INSTAGRAM_ACCESS_TOKEN',
    accountVar: 'INSTAGRAM_ACCOUNT_ID',
  },
  elena: {
    name: 'Elena Visconti',
    pageId: '883026764900260',
    tokenVar: 'INSTAGRAM_ACCESS_TOKEN_ELENA',
    accountVar: 'INSTAGRAM_ACCOUNT_ID_ELENA',
  },
};

async function main() {
  const userToken = process.argv[2];
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔐 REFRESH ALL TOKENS — Mila + Elena');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  if (!userToken) {
    console.log('❌ Usage: node scripts/refresh-all-tokens.mjs USER_TOKEN\n');
    console.log('📋 Comment obtenir le User Token:');
    console.log('   1. Va sur https://developers.facebook.com/tools/explorer/');
    console.log('   2. Sélectionne l\'app "828334456494374"');
    console.log('   3. Clique "Generate Access Token"');
    console.log('   4. ⚠️  COCHE LES DEUX PAGES (Mila Verne ET Elena Visconti)');
    console.log('   5. Permissions: pages_show_list, pages_read_engagement,');
    console.log('      instagram_basic, instagram_content_publish');
    console.log('   6. Copie le token et relance ce script avec');
    process.exit(1);
  }
  
  const appId = env.FACEBOOK_APP_ID;
  const appSecret = env.FACEBOOK_APP_SECRET;
  
  if (!appId || !appSecret) {
    console.error('❌ FACEBOOK_APP_ID et FACEBOOK_APP_SECRET requis dans .env.local');
    process.exit(1);
  }
  
  console.log(`✅ App ID: ${appId.slice(0, 8)}...`);
  console.log(`✅ App Secret: ${appSecret.slice(0, 8)}...`);
  console.log(`✅ User Token: ${userToken.slice(0, 20)}...\n`);
  
  try {
    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Convert to Long-Lived Token
    // ═══════════════════════════════════════════════════════════════
    console.log('⏳ Étape 1: Conversion en Long-Lived Token...');
    
    const longLivedUrl = `${GRAPH_API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${userToken}`;
    
    const longLivedRes = await fetch(longLivedUrl);
    const longLivedData = await longLivedRes.json();
    
    if (longLivedData.error) {
      throw new Error(`Long-lived token error: ${longLivedData.error.message}`);
    }
    
    const longLivedToken = longLivedData.access_token;
    console.log(`   ✅ Long-lived token obtenu\n`);
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Get Page Tokens for BOTH pages
    // ═══════════════════════════════════════════════════════════════
    const results = {};
    
    for (const [key, page] of Object.entries(PAGES)) {
      console.log(`⏳ Étape 2.${key === 'mila' ? '1' : '2'}: Token pour ${page.name}...`);
      
      // Get Page Token directly from Page ID
      const pageUrl = `${GRAPH_API}/${page.pageId}?fields=access_token&access_token=${longLivedToken}`;
      const pageRes = await fetch(pageUrl);
      const pageData = await pageRes.json();
      
      if (pageData.error) {
        console.log(`   ❌ Erreur: ${pageData.error.message}`);
        console.log(`   💡 As-tu coché la page "${page.name}" lors de l'autorisation?`);
        continue;
      }
      
      const pageToken = pageData.access_token;
      
      // Get Instagram Business Account
      const igUrl = `${GRAPH_API}/${page.pageId}?fields=instagram_business_account&access_token=${pageToken}`;
      const igRes = await fetch(igUrl);
      const igData = await igRes.json();
      
      if (!igData.instagram_business_account) {
        console.log(`   ⚠️  Pas de compte Instagram lié à ${page.name}`);
        continue;
      }
      
      const igAccountId = igData.instagram_business_account.id;
      
      // Verify token is permanent
      const debugUrl = `${GRAPH_API}/debug_token?input_token=${pageToken}&access_token=${appId}|${appSecret}`;
      const debugRes = await fetch(debugUrl);
      const debugData = await debugRes.json();
      
      const isPermanent = debugData.data?.expires_at === 0;
      
      results[key] = {
        ...page,
        pageToken,
        igAccountId,
        isPermanent,
      };
      
      console.log(`   ✅ ${page.name}`);
      console.log(`      Page Token: ${pageToken.slice(0, 25)}...`);
      console.log(`      Instagram ID: ${igAccountId}`);
      console.log(`      Permanent: ${isPermanent ? '✅ OUI' : '⚠️ NON'}\n`);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Update .env.local
    // ═══════════════════════════════════════════════════════════════
    console.log('⏳ Étape 3: Mise à jour de .env.local...');
    
    let newEnvContent = envContent;
    
    for (const [key, data] of Object.entries(results)) {
      // Update token
      const tokenRegex = new RegExp(`${data.tokenVar}=.*`);
      if (newEnvContent.match(tokenRegex)) {
        newEnvContent = newEnvContent.replace(tokenRegex, `${data.tokenVar}=${data.pageToken}`);
      } else {
        newEnvContent += `\n${data.tokenVar}=${data.pageToken}`;
      }
      
      // Update account ID
      const accountRegex = new RegExp(`${data.accountVar}=.*`);
      if (newEnvContent.match(accountRegex)) {
        newEnvContent = newEnvContent.replace(accountRegex, `${data.accountVar}=${data.igAccountId}`);
      } else {
        newEnvContent += `\n${data.accountVar}=${data.igAccountId}`;
      }
    }
    
    fs.writeFileSync(envPath, newEnvContent);
    console.log('   ✅ .env.local mis à jour\n');
    
    // ═══════════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎉 SUCCÈS ! Les deux tokens sont configurés');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log('📊 Récapitulatif:\n');
    for (const [key, data] of Object.entries(results)) {
      console.log(`   ${data.name} (@${key === 'mila' ? 'mila.verne' : 'elenav.paris'})`);
      console.log(`   └─ Token: ${data.pageToken.slice(0, 20)}...`);
      console.log(`   └─ Instagram ID: ${data.igAccountId}`);
      console.log(`   └─ Permanent: ${data.isPermanent ? '✅' : '⚠️'}\n`);
    }
    
    console.log('✅ Tu peux maintenant poster sur les DEUX comptes !');
    console.log('   Les tokens ne s\'invalideront plus mutuellement 🎉\n');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.log('\n💡 Tips:');
    console.log('   - Vérifie que tu as coché LES DEUX PAGES lors de l\'autorisation');
    console.log('   - Permissions requises: pages_show_list, instagram_basic, instagram_content_publish');
    process.exit(1);
  }
}

main();

