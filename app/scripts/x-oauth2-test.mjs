#!/usr/bin/env node
/**
 * X (Twitter) API OAuth 2.0 Test Script
 *
 * OAuth 2.0 for X API requires a user authorization flow:
 * 1. Generate auth link → User visits and approves
 * 2. User redirected back with code → Exchange for tokens
 * 3. Use access token to post tweets
 *
 * This script handles both:
 * - Generating the auth link (run without args)
 * - Exchanging the code for tokens (run with --callback "code")
 * - Posting a tweet (run with --post after auth)
 */

import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import http from 'http';
import { URL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Token storage file
const TOKEN_FILE = join(__dirname, '.x-oauth2-tokens.json');

// Check required env vars
const required = ['X_CLIENT_ID', 'X_CLIENT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Missing env var: ${key}`);
    console.error('   Add X_CLIENT_ID and X_CLIENT_SECRET to .env.local');
    process.exit(1);
  }
}

console.log('🔑 OAuth 2.0 credentials loaded');

// Callback URL for local testing
const CALLBACK_URL = 'http://127.0.0.1:3333/callback';

// Scopes needed for posting
// Scopes for posting with media upload
const SCOPES = ['tweet.read', 'tweet.write', 'users.read', 'offline.access', 'media.write'];

// Create OAuth 2.0 client
const client = new TwitterApi({
  clientId: process.env.X_CLIENT_ID,
  clientSecret: process.env.X_CLIENT_SECRET,
});

/**
 * Load saved tokens from file
 */
function loadTokens() {
  if (existsSync(TOKEN_FILE)) {
    try {
      return JSON.parse(readFileSync(TOKEN_FILE, 'utf-8'));
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Save tokens to file
 */
function saveTokens(tokens) {
  writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
  console.log(`   💾 Tokens saved to ${TOKEN_FILE}`);
}

/**
 * Step 1: Generate OAuth 2.0 authorization link
 */
async function generateAuthLink() {
  console.log('\n📋 STEP 1: Generate Authorization Link\n');

  const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
    CALLBACK_URL,
    { scope: SCOPES }
  );

  // Save state and codeVerifier for callback
  saveTokens({ codeVerifier, state, step: 'pending_callback' });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔗 AUTHORIZATION REQUIRED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n1. Open this URL in your browser:\n');
  console.log(`   ${url}\n`);
  console.log('2. Log in and authorize the app');
  console.log('3. You will be redirected to a local callback');
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Start local server to catch the callback
  await startCallbackServer();
}

/**
 * Start a local HTTP server to catch the OAuth callback
 */
async function startCallbackServer() {
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, `http://${req.headers.host}`);

      if (url.pathname === '/callback') {
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');

        console.log('\n📥 Callback received!');

        // Exchange code for tokens
        const success = await exchangeCodeForTokens(code, state);

        if (success) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body style="font-family: system-ui; padding: 40px; text-align: center;">
                <h1>✅ Authorization Successful!</h1>
                <p>You can close this window and return to the terminal.</p>
              </body>
            </html>
          `);
        } else {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body style="font-family: system-ui; padding: 40px; text-align: center;">
                <h1>❌ Authorization Failed</h1>
                <p>Check the terminal for details.</p>
              </body>
            </html>
          `);
        }

        // Close server after response
        setTimeout(() => {
          server.close();
          resolve();
        }, 1000);
      }
    });

    server.listen(3333, '127.0.0.1', () => {
      console.log('\n⏳ Waiting for callback on http://127.0.0.1:3333/callback ...\n');
    });
  });
}

/**
 * Step 2: Exchange authorization code for access tokens
 */
async function exchangeCodeForTokens(code, state) {
  console.log('\n📋 STEP 2: Exchange Code for Tokens\n');

  const saved = loadTokens();

  if (!saved || saved.step !== 'pending_callback') {
    console.error('❌ No pending authorization. Run without arguments first.');
    return false;
  }

  if (state !== saved.state) {
    console.error('❌ State mismatch! Possible CSRF attack.');
    return false;
  }

  try {
    console.log('   🔄 Exchanging code for tokens...');

    const { accessToken, refreshToken, client: loggedClient } = await client.loginWithOAuth2({
      code,
      codeVerifier: saved.codeVerifier,
      redirectUri: CALLBACK_URL,
    });

    // Verify by getting user info
    const me = await loggedClient.v2.me();

    console.log(`   ✅ Authenticated as: @${me.data.username}`);

    // Save tokens
    saveTokens({
      accessToken,
      refreshToken,
      username: me.data.username,
      userId: me.data.id,
      step: 'authenticated',
      authenticatedAt: new Date().toISOString(),
    });

    console.log('\n✅ AUTHENTICATION COMPLETE');
    console.log('   Run with --post to test posting a tweet');

    return true;

  } catch (error) {
    console.error('❌ Token exchange failed:', error.message);
    if (error.data) {
      console.error('   Details:', JSON.stringify(error.data, null, 2));
    }
    return false;
  }
}

/**
 * Step 3: Test posting a tweet using saved tokens
 */
async function testPost() {
  console.log('\n📋 STEP 3: Test Posting Tweet\n');

  const saved = loadTokens();

  if (!saved || saved.step !== 'authenticated') {
    console.error('❌ Not authenticated. Run without arguments first to authorize.');
    return;
  }

  try {
    console.log('   🔄 Creating authenticated client...');

    // Create client with access token
    const userClient = new TwitterApi(saved.accessToken);

    // Verify credentials
    console.log('   1️⃣ Verifying credentials...');
    const me = await userClient.v2.me();
    console.log(`   ✅ Authenticated as: @${me.data.username} (${me.data.name})`);

    // Post test tweet
    console.log('\n   2️⃣ Posting test tweet...');
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const tweet = await userClient.v2.tweet(`API test at ${timestamp} 🔧`);

    console.log(`   ✅ Tweet posted! ID: ${tweet.data.id}`);
    console.log(`   🔗 https://x.com/${me.data.username}/status/${tweet.data.id}`);

    console.log('\n✅ POST TEST PASSED\n');

  } catch (error) {
    console.error('\n❌ POST TEST FAILED\n');
    console.error('Error:', error.message);

    if (error.data) {
      console.error('Details:', JSON.stringify(error.data, null, 2));
    }

    // Check if token expired
    if (error.code === 401) {
      console.error('\n💡 Token may have expired. Try refreshing with --refresh');
    }

    process.exit(1);
  }
}

/**
 * Refresh expired access token
 */
async function refreshTokens() {
  console.log('\n📋 Refreshing Access Token\n');

  const saved = loadTokens();

  if (!saved || !saved.refreshToken) {
    console.error('❌ No refresh token available. Re-authenticate from scratch.');
    return;
  }

  try {
    console.log('   🔄 Refreshing tokens...');

    const { accessToken, refreshToken: newRefreshToken, client: refreshedClient } =
      await client.refreshOAuth2Token(saved.refreshToken);

    const me = await refreshedClient.v2.me();

    // Save new tokens
    saveTokens({
      accessToken,
      refreshToken: newRefreshToken,
      username: me.data.username,
      userId: me.data.id,
      step: 'authenticated',
      authenticatedAt: saved.authenticatedAt,
      refreshedAt: new Date().toISOString(),
    });

    console.log('   ✅ Tokens refreshed successfully');
    console.log(`   📊 User: @${me.data.username}`);

  } catch (error) {
    console.error('❌ Token refresh failed:', error.message);
    console.error('   Re-authenticate by running without arguments.');
    process.exit(1);
  }
}

/**
 * Show current authentication status
 */
function showStatus() {
  console.log('\n📊 OAuth 2.0 Status\n');

  const saved = loadTokens();

  if (!saved) {
    console.log('   Status: Not authenticated');
    console.log('   Run without arguments to start authorization.');
    return;
  }

  console.log(`   Status: ${saved.step}`);

  if (saved.step === 'authenticated') {
    console.log(`   User: @${saved.username} (ID: ${saved.userId})`);
    console.log(`   Authenticated: ${saved.authenticatedAt}`);
    if (saved.refreshedAt) {
      console.log(`   Last refresh: ${saved.refreshedAt}`);
    }
    console.log(`   Has refresh token: ${!!saved.refreshToken}`);
  }
}

/**
 * Test Bearer Token (app-only auth)
 */
async function testBearerToken() {
  console.log('\n📋 Testing Bearer Token (App-Only)\n');

  const bearerToken = process.env.X_BEARER_TOKEN;

  if (!bearerToken) {
    console.error('❌ X_BEARER_TOKEN not set in .env.local');
    return;
  }

  try {
    const appClient = new TwitterApi(bearerToken);

    console.log('   🔄 Looking up @xdevelopers...');
    const user = await appClient.v2.userByUsername('xdevelopers');

    console.log(`   ✅ Found: @${user.data.username} (${user.data.name})`);
    console.log(`   📊 ID: ${user.data.id}`);

    console.log('\n✅ BEARER TOKEN WORKS (app-only auth)\n');

  } catch (error) {
    console.error('❌ Bearer token test failed:', error.message);
    process.exit(1);
  }
}

// Main
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
X OAuth 2.0 Test Script

Usage:
  node x-oauth2-test.mjs              Start authorization flow
  node x-oauth2-test.mjs --status     Check current auth status
  node x-oauth2-test.mjs --post       Post a test tweet (after auth)
  node x-oauth2-test.mjs --refresh    Refresh expired tokens
  node x-oauth2-test.mjs --bearer     Test Bearer Token (app-only)
  node x-oauth2-test.mjs --help       Show this help
`);
} else if (args.includes('--status')) {
  showStatus();
} else if (args.includes('--post')) {
  testPost();
} else if (args.includes('--refresh')) {
  refreshTokens();
} else if (args.includes('--bearer')) {
  testBearerToken();
} else {
  // Default: start auth flow
  generateAuthLink();
}
