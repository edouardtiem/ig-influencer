#!/usr/bin/env node
/**
 * Test Instagram Graph API connection
 * Usage: node scripts/test-instagram-connection.mjs
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

const INSTAGRAM_GRAPH_API = 'https://graph.facebook.com/v21.0';

async function testConnection() {
  console.log('🔍 Testing Instagram Graph API connection...\n');

  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;

  // Check config
  if (!accessToken) {
    console.error('❌ INSTAGRAM_ACCESS_TOKEN not found in .env.local');
    process.exit(1);
  }
  console.log('✅ INSTAGRAM_ACCESS_TOKEN found');

  if (!accountId) {
    console.error('❌ INSTAGRAM_ACCOUNT_ID not found in .env.local');
    process.exit(1);
  }
  console.log(`✅ INSTAGRAM_ACCOUNT_ID: ${accountId}`);

  // Test API call
  console.log('\n📡 Calling Instagram API...');

  try {
    const params = new URLSearchParams({
      fields: 'username,name,profile_picture_url,followers_count,media_count',
      access_token: accessToken,
    });

    const response = await fetch(`${INSTAGRAM_GRAPH_API}/${accountId}?${params}`);
    const data = await response.json();

    if (data.error) {
      console.error('\n❌ API Error:', data.error.message);
      console.error('   Code:', data.error.code);
      console.error('   Type:', data.error.type);
      process.exit(1);
    }

    console.log('\n🎉 SUCCESS! Connected to Instagram account:\n');
    console.log(`   👤 Username: @${data.username || 'N/A'}`);
    console.log(`   📛 Name: ${data.name || 'N/A'}`);
    console.log(`   👥 Followers: ${data.followers_count?.toLocaleString() || 'N/A'}`);
    console.log(`   📸 Posts: ${data.media_count || 'N/A'}`);
    
    if (data.profile_picture_url) {
      console.log(`   🖼️  Profile pic: ${data.profile_picture_url.slice(0, 50)}...`);
    }

    console.log('\n✅ Your Instagram API is ready to use!');
    console.log('   You can now post images and carousels directly.');

  } catch (error) {
    console.error('\n❌ Network error:', error.message);
    process.exit(1);
  }
}

testConnection();
