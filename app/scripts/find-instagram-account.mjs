#!/usr/bin/env node
/**
 * Find Instagram Business Account ID
 * Usage: node scripts/find-instagram-account.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');

// Load environment variables
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const GRAPH_API = 'https://graph.facebook.com/v21.0';

async function findInstagramAccount() {
  console.log('🔍 Finding Instagram Business Account...\n');

  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!accessToken) {
    console.error('❌ INSTAGRAM_ACCESS_TOKEN not found');
    process.exit(1);
  }

  try {
    // Step 1: Get Facebook Pages
    console.log('📄 Getting Facebook Pages...');
    const pagesParams = new URLSearchParams({
      fields: 'id,name,instagram_business_account{id,username,name,profile_picture_url,followers_count}',
      access_token: accessToken,
    });

    const pagesResponse = await fetch(`${GRAPH_API}/me/accounts?${pagesParams}`);
    const pagesData = await pagesResponse.json();

    if (pagesData.error) {
      console.error('❌ Error getting pages:', pagesData.error.message);
      
      // Try getting user info instead
      console.log('\n📱 Trying to get user info...');
      const userParams = new URLSearchParams({
        fields: 'id,name',
        access_token: accessToken,
      });
      const userResponse = await fetch(`${GRAPH_API}/me?${userParams}`);
      const userData = await userResponse.json();
      
      if (userData.error) {
        console.error('❌ Error:', userData.error.message);
      } else {
        console.log('User ID:', userData.id);
        console.log('User Name:', userData.name);
      }
      process.exit(1);
    }

    if (!pagesData.data || pagesData.data.length === 0) {
      console.error('❌ No Facebook Pages found');
      console.log('\n💡 Make sure your Facebook account has a Page connected to an Instagram Business account.');
      process.exit(1);
    }

    console.log(`\n✅ Found ${pagesData.data.length} Facebook Page(s):\n`);

    let instagramFound = false;

    for (const page of pagesData.data) {
      console.log(`📄 Page: ${page.name} (ID: ${page.id})`);
      
      if (page.instagram_business_account) {
        const ig = page.instagram_business_account;
        instagramFound = true;
        
        console.log(`   📸 Instagram Business Account:`);
        console.log(`      👤 Username: @${ig.username || 'N/A'}`);
        console.log(`      📛 Name: ${ig.name || 'N/A'}`);
        console.log(`      👥 Followers: ${ig.followers_count?.toLocaleString() || 'N/A'}`);
        console.log(`      🆔 ID: ${ig.id}`);
        console.log('');
        console.log('   ─────────────────────────────────────');
        console.log(`   📋 Add this to your .env.local:`);
        console.log(`   INSTAGRAM_ACCOUNT_ID=${ig.id}`);
        console.log('   ─────────────────────────────────────');
      } else {
        console.log('   ⚠️  No Instagram Business account connected to this page');
      }
      console.log('');
    }

    if (!instagramFound) {
      console.log('❌ No Instagram Business Account found on any page.');
      console.log('\n💡 To connect Instagram to a Facebook Page:');
      console.log('   1. Go to your Facebook Page settings');
      console.log('   2. Click "Linked Accounts"');
      console.log('   3. Connect your Instagram Professional account');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

findInstagramAccount();
