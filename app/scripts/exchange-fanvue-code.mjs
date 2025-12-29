#!/usr/bin/env node

/**
 * Manual Fanvue OAuth Code Exchange
 * Usage: node scripts/exchange-fanvue-code.mjs <code>
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '../.env.local') });

const CODE = process.argv[2] || 'ory_ac_NXjicqhgRc0gfCBdDIwy_yeYDh9Q7H3xhZr2yF_uuy0.jflluHI9lEcIzR0TyBFH52LyhCwHZVr47E6HtZPEfio';

const CLIENT_ID = process.env.FANVUE_CLIENT_ID;
const CLIENT_SECRET = process.env.FANVUE_CLIENT_SECRET;
// Use the actual redirect URI from the callback URL
const REDIRECT_URI = process.argv[3] || 'https://ig-influencer.vercel.app/api/oauth/callback';

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  console.error('❌ Missing FANVUE_CLIENT_ID, FANVUE_CLIENT_SECRET, or FANVUE_REDIRECT_URI');
  process.exit(1);
}

console.log('🔑 Exchanging Fanvue authorization code for tokens...');
console.log(`   Client ID: ${CLIENT_ID.slice(0, 10)}...`);
console.log(`   Redirect URI: ${REDIRECT_URI}`);
console.log(`   Code: ${CODE.slice(0, 20)}...`);

async function exchangeCode() {
  const tokenUrl = 'https://auth.fanvue.com/oauth2/token';
  
  // Use client_secret_basic (credentials in Authorization header)
  const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: CODE,
    redirect_uri: REDIRECT_URI,
  });

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Token exchange failed:', data);
      console.log('\n💡 Le code a peut-être expiré. Refais le flow OAuth:');
      console.log('   1. npm run dev');
      console.log('   2. Ouvre http://localhost:3000/api/oauth/auth');
      return;
    }

    console.log('\n✅ SUCCESS! Voici tes tokens:\n');
    console.log('='.repeat(60));
    console.log(`FANVUE_ACCESS_TOKEN=${data.access_token}`);
    console.log(`FANVUE_REFRESH_TOKEN=${data.refresh_token}`);
    console.log('='.repeat(60));
    
    console.log('\n📋 Copie ces lignes dans .env.local et dans GitHub Secrets');
    
    if (data.expires_in) {
      const expiresAt = new Date(Date.now() + data.expires_in * 1000);
      console.log(`\n⏰ Token expire: ${expiresAt.toLocaleString()}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

exchangeCode();

