#!/usr/bin/env node
/**
 * X (Twitter) API Test Script
 * Tests posting a tweet using OAuth 1.0a
 */

import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Check required env vars
const required = ['X_API_KEY', 'X_API_SECRET', 'X_ACCESS_TOKEN', 'X_ACCESS_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Missing env var: ${key}`);
    process.exit(1);
  }
}

console.log('🔑 API keys loaded');

// Create client with OAuth 1.0a (user context)
const client = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET,
});

// Get read-write client
const rwClient = client.readWrite;

async function testAPI() {
  console.log('\n📡 Testing X API connection...\n');

  try {
    // Test 1: Verify credentials
    console.log('1️⃣ Verifying credentials...');
    const me = await rwClient.v2.me();
    console.log(`   ✅ Authenticated as: @${me.data.username} (${me.data.name})`);
    console.log(`   📊 ID: ${me.data.id}`);

    // Test 2: Post a test tweet (optional)
    const testMode = process.argv.includes('--post');

    if (testMode) {
      console.log('\n2️⃣ Posting test tweet...');
      const tweet = await rwClient.v2.tweet('Testing my API connection 🔧');
      console.log(`   ✅ Tweet posted! ID: ${tweet.data.id}`);
      console.log(`   🔗 https://x.com/${me.data.username}/status/${tweet.data.id}`);
    } else {
      console.log('\n2️⃣ Skipping post test (run with --post to test posting)');
    }

    console.log('\n✅ API TEST PASSED\n');

  } catch (error) {
    console.error('\n❌ API TEST FAILED\n');
    console.error('Error:', error.message);

    if (error.data) {
      console.error('Details:', JSON.stringify(error.data, null, 2));
    }

    // Common error hints
    if (error.code === 401) {
      console.error('\n💡 Hint: Check your API keys are correct');
    } else if (error.code === 403) {
      console.error('\n💡 Hint: Your app may need "Read and Write" permissions');
      console.error('   Go to Developer Portal → App → Settings → User authentication');
    } else if (error.code === 429) {
      console.error('\n💡 Hint: Rate limited. Wait and try again.');
    }

    process.exit(1);
  }
}

testAPI();
