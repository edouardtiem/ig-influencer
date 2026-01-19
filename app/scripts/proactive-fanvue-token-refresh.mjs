#!/usr/bin/env node
/**
 * Proactive Fanvue Token Refresh
 * 
 * Runs every hour via GitHub Actions to ensure the Fanvue token is always valid.
 * This prevents webhook failures due to expired tokens.
 * 
 * The token is refreshed if it expires in less than 2 hours.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function refreshToken() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔄 FANVUE TOKEN PROACTIVE REFRESH');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // 1. Load current tokens from Supabase
  const { data: tokens, error: loadError } = await supabase
    .from('oauth_tokens')
    .select('*')
    .eq('service_name', 'fanvue')
    .single();
  
  if (loadError || !tokens) {
    console.error('❌ Failed to load tokens from Supabase:', loadError?.message || 'No tokens found');
    process.exit(1);
  }
  
  const expiresAt = new Date(tokens.expires_at);
  const now = new Date();
  const diffMin = (expiresAt - now) / 1000 / 60;
  
  console.log('📋 Current token status:');
  console.log(`   Expires: ${expiresAt.toISOString()}`);
  console.log(`   Now: ${now.toISOString()}`);
  console.log(`   Time remaining: ${diffMin.toFixed(0)} minutes`);
  
  // 2. Check if refresh is needed (less than 2 hours remaining)
  const REFRESH_THRESHOLD_MIN = 120; // 2 hours
  
  if (diffMin > REFRESH_THRESHOLD_MIN) {
    console.log(`\n✅ Token still valid for ${diffMin.toFixed(0)} minutes (threshold: ${REFRESH_THRESHOLD_MIN}min)`);
    console.log('   No refresh needed.\n');
    return;
  }
  
  console.log(`\n⚠️ Token expires in ${diffMin.toFixed(0)} minutes - REFRESHING...\n`);
  
  // 3. Refresh the token
  const clientId = process.env.FANVUE_CLIENT_ID;
  const clientSecret = process.env.FANVUE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.error('❌ FANVUE_CLIENT_ID or FANVUE_CLIENT_SECRET not configured');
    process.exit(1);
  }
  
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await fetch('https://auth.fanvue.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Token refresh failed:', response.status, error);
    process.exit(1);
  }
  
  const newTokens = await response.json();
  console.log('✅ New tokens received from Fanvue');
  
  // 4. Save new tokens to Supabase
  const newExpiresAt = Date.now() + (newTokens.expires_in * 1000);
  
  const { error: updateError } = await supabase
    .from('oauth_tokens')
    .update({
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token || tokens.refresh_token,
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString()
    })
    .eq('service_name', 'fanvue');
  
  if (updateError) {
    console.error('❌ Failed to save tokens to Supabase:', updateError.message);
    process.exit(1);
  }
  
  const newExpiry = new Date(newExpiresAt);
  const newDiffMin = (newExpiry - now) / 1000 / 60;
  
  console.log('✅ Tokens saved to Supabase');
  console.log(`   New expiry: ${newExpiry.toISOString()}`);
  console.log(`   Valid for: ${newDiffMin.toFixed(0)} minutes\n`);
  
  // 5. Verify the new token works
  console.log('🧪 Verifying new token...');
  
  const verifyResponse = await fetch('https://api.fanvue.com/chats?limit=1', {
    headers: {
      'Authorization': `Bearer ${newTokens.access_token}`,
      'X-Fanvue-API-Version': '2025-06-26'
    }
  });
  
  if (!verifyResponse.ok) {
    const errorText = await verifyResponse.text();
    console.error('❌ New token verification failed:', verifyResponse.status, errorText);
    process.exit(1);
  }
  
  console.log(`✅ Token verified - API accessible\n`);
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🎉 FANVUE TOKEN REFRESH COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

refreshToken().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
