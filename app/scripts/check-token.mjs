#!/usr/bin/env node
/**
 * Check which Instagram account a token is linked to
 * Supports both User Tokens and Page Tokens
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

const GRAPH_API = 'https://graph.facebook.com/v21.0';

// Known Page IDs for direct access
const KNOWN_PAGES = {
  elena: { id: '883026764900260', name: 'Elena Visconti', ig: '@elenav.paris' },
  mila: { id: '941108822414254', name: 'Mila Verne', ig: '@mila.verne' }
};

async function main() {
  // Check which token to test (use Elena's by default, or pass 'mila' as arg)
  const tokenToCheck = process.argv[2] === 'mila' 
    ? env.INSTAGRAM_ACCESS_TOKEN 
    : env.INSTAGRAM_ACCESS_TOKEN_ELENA;
  
  const tokenName = process.argv[2] === 'mila' ? 'Mila' : 'Elena';
  const knownPage = KNOWN_PAGES[tokenName.toLowerCase()];
  
  console.log(`🔍 Vérification du token ${tokenName}...\n`);
  
  if (!tokenToCheck) {
    console.log(`❌ Token ${tokenName} non trouvé dans .env.local`);
    process.exit(1);
  }
  
  console.log(`Token: ${tokenToCheck.slice(0, 25)}...`);
  
  const appId = env.FACEBOOK_APP_ID;
  const appSecret = env.FACEBOOK_APP_SECRET;
  
  try {
    // First, debug the token to understand its type
    if (appId && appSecret) {
      const debugUrl = `${GRAPH_API}/debug_token?input_token=${tokenToCheck}&access_token=${appId}|${appSecret}`;
      const debugRes = await fetch(debugUrl);
      const debugData = await debugRes.json();
      
      if (debugData.data) {
        const info = debugData.data;
        const tokenType = info.type || 'Unknown';
        
        console.log(`\n📊 Info token:`);
        console.log(`   Type: ${tokenType}`);
        console.log(`   Valide: ${info.is_valid ? '✅' : '❌'}`);
        
        if (info.expires_at === 0) {
          console.log('   Expiration: JAMAIS ✨ (PERMANENT)');
        } else if (info.expires_at) {
          const expDate = new Date(info.expires_at * 1000);
          const now = new Date();
          const daysLeft = Math.round((expDate - now) / (1000 * 60 * 60 * 24));
          console.log(`   Expiration: ${expDate.toLocaleDateString()} (${daysLeft} jours)`);
        }
        
        console.log(`   Scopes: ${info.scopes?.join(', ') || 'N/A'}`);
        
        // If it's a Page token, get Instagram account directly
        if (tokenType === 'PAGE' && knownPage) {
          console.log(`\n📄 Page: ${knownPage.name}`);
          
          // Get Instagram account linked to this page
          const igUrl = `${GRAPH_API}/${knownPage.id}?fields=instagram_business_account&access_token=${tokenToCheck}`;
          const igRes = await fetch(igUrl);
          const igData = await igRes.json();
          
          if (igData.instagram_business_account) {
            const igUserUrl = `${GRAPH_API}/${igData.instagram_business_account.id}?fields=username,name&access_token=${tokenToCheck}`;
            const igUserRes = await fetch(igUserUrl);
            const igUserData = await igUserRes.json();
            
            console.log(`   └─ Instagram: @${igUserData.username} (${igUserData.name || 'N/A'})`);
            console.log(`      IG Account ID: ${igData.instagram_business_account.id}`);
          }
          
          console.log(`\n✅ Token ${tokenName} OK - Prêt à poster !`);
          return;
        }
        
        // If it's a User token, try to get pages
        if (tokenType === 'USER') {
          const pagesUrl = `${GRAPH_API}/me/accounts?access_token=${tokenToCheck}`;
          const pagesRes = await fetch(pagesUrl);
          const pagesData = await pagesRes.json();
          
          if (pagesData.data?.length > 0) {
            console.log(`\n📄 Pages Facebook liées (${pagesData.data.length}):\n`);
            
            for (const page of pagesData.data) {
              console.log(`  • ${page.name} (ID: ${page.id})`);
              
              const igUrl = `${GRAPH_API}/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`;
              const igRes = await fetch(igUrl);
              const igData = await igRes.json();
              
              if (igData.instagram_business_account) {
                const igUserUrl = `${GRAPH_API}/${igData.instagram_business_account.id}?fields=username,name&access_token=${page.access_token}`;
                const igUserRes = await fetch(igUserUrl);
                const igUserData = await igUserRes.json();
                
                console.log(`    └─ Instagram: @${igUserData.username}`);
              }
            }
          } else {
            console.log(`\n⚠️  Aucune Page trouvée via me/accounts`);
            console.log(`   Voir docs/20-TOKEN-REFRESH-GUIDE.md pour la solution`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();

