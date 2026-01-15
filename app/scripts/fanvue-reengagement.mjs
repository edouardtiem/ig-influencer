#!/usr/bin/env node

/**
 * Fanvue Re-engagement CRON Job
 * 
 * Runs every hour to check for users who need re-engagement.
 * Only sends messages during evening hours (21h-1h) in user's local timezone.
 * 
 * Usage:
 *   node scripts/fanvue-reengagement.mjs
 * 
 * Environment:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - FANVUE_ACCESS_TOKEN
 *   - FANVUE_REFRESH_TOKEN
 *   - VENICE_API_KEY
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// ===========================================
// CONFIGURATION
// ===========================================

const EVENING_START_HOUR = 21; // 9 PM
const EVENING_END_HOUR = 1;    // 1 AM
const MIN_HOURS_SINCE_MESSAGE = 24;
const MIN_HOURS_SINCE_REENGAGEMENT = 24;
const MAX_REENGAGEMENTS = 3;
const DEFAULT_TIMEZONE = 'Europe/Paris';
const BATCH_SIZE = 20;

// ===========================================
// CLIENTS
// ===========================================

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ===========================================
// TIMEZONE UTILITIES
// ===========================================

function getLocalHour(timezone) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      hour12: false,
    });
    
    const parts = formatter.formatToParts(new Date());
    const hourPart = parts.find(p => p.type === 'hour');
    return parseInt(hourPart?.value || '0');
  } catch {
    return new Date().getHours();
  }
}

function isInEveningWindow(timezone) {
  const tz = timezone || DEFAULT_TIMEZONE;
  const hour = getLocalHour(tz);
  return hour >= EVENING_START_HOUR || hour < EVENING_END_HOUR;
}

function hoursBetween(date1, date2) {
  return Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60 * 60);
}

// ===========================================
// FANVUE API
// ===========================================

let accessToken = process.env.FANVUE_ACCESS_TOKEN;
const refreshToken = process.env.FANVUE_REFRESH_TOKEN;

async function refreshFanvueToken() {
  const clientId = process.env.FANVUE_CLIENT_ID;
  const clientSecret = process.env.FANVUE_CLIENT_SECRET;
  
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await fetch('https://auth.fanvue.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  });
  
  if (!response.ok) {
    throw new Error(`Token refresh failed: ${await response.text()}`);
  }
  
  const data = await response.json();
  accessToken = data.access_token;
  return accessToken;
}

async function sendFanvueMessage(chatId, text) {
  // Try with current token
  let response = await fetch(`https://api.fanvue.com/chats/${chatId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });
  
  // If 401, refresh token and retry
  if (response.status === 401) {
    console.log('  🔄 Refreshing token...');
    await refreshFanvueToken();
    
    response = await fetch(`https://api.fanvue.com/chats/${chatId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
  }
  
  if (!response.ok) {
    throw new Error(`Fanvue API error: ${await response.text()}`);
  }
  
  return response.json();
}

// ===========================================
// MESSAGE TEMPLATES
// ===========================================

function buildReengagementMessage(profile, language) {
  // French messages
  if (language === 'fr') {
    if (profile?.tone_preference === 'dominant') {
      return "hey toi... tu m'as manqué 🖤 j'ai quelque chose à te montrer ce soir...";
    }
    if (profile?.total_spent > 0) {
      return "hey 🖤 j'ai pensé à toi... j'ai fait un nouveau shooting, encore plus intense...";
    }
    if (profile?.nickname) {
      return `coucou ${profile.nickname}... ça fait un moment 🖤 tu fais quoi ce soir?`;
    }
    return "coucou toi... ça fait un moment 🖤 tu fais quoi ce soir?";
  }
  
  // Italian messages
  if (language === 'it') {
    if (profile?.tone_preference === 'dominant') {
      return "ehi tu... mi sei mancato 🖤 ho qualcosa da mostrarti stasera...";
    }
    return "ciao tesoro... è passato un po' 🖤 cosa fai stasera?";
  }
  
  // Spanish messages
  if (language === 'es') {
    if (profile?.tone_preference === 'dominant') {
      return "hey tú... te extrañé 🖤 tengo algo que mostrarte esta noche...";
    }
    return "hola cariño... hace tiempo 🖤 qué haces esta noche?";
  }
  
  // English (default)
  if (profile?.tone_preference === 'dominant') {
    return "hey you... i missed you 🖤 i have something to show you tonight...";
  }
  if (profile?.total_spent > 0) {
    return "hey 🖤 been thinking about you... did a new shoot, even more intense...";
  }
  if (profile?.nickname) {
    return `hey ${profile.nickname}... it's been a while 🖤 what are you up to tonight?`;
  }
  return "hey you... it's been a while 🖤 what are you up to tonight?";
}

// ===========================================
// MAIN FUNCTIONS
// ===========================================

async function getCandidates() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data: contacts, error } = await supabase
    .from('fanvue_dm_contacts')
    .select(`
      id,
      fanvue_user_id,
      fanvue_chat_id,
      username,
      stage,
      message_count,
      detected_language,
      last_user_message_at,
      last_reengagement_at,
      reengagement_count
    `)
    .eq('is_stopped', false)
    .in('stage', ['warm', 'hot', 'pitched'])
    .lt('last_user_message_at', twentyFourHoursAgo)
    .lt('reengagement_count', MAX_REENGAGEMENTS)
    .not('fanvue_chat_id', 'is', null)
    .order('last_user_message_at', { ascending: true })
    .limit(BATCH_SIZE);
  
  if (error) {
    console.error('❌ Error fetching candidates:', error);
    return [];
  }
  
  // Get profiles
  const contactIds = contacts.map(c => c.id);
  const { data: profiles } = await supabase
    .from('fanvue_user_profiles')
    .select('*')
    .in('contact_id', contactIds);
  
  const profileMap = new Map(profiles?.map(p => [p.contact_id, p]) || []);
  
  return contacts.map(c => ({
    ...c,
    profile: profileMap.get(c.id) || null,
  }));
}

function isEligible(candidate) {
  const now = new Date();
  
  // Check time since last user message
  const lastUserMessage = new Date(candidate.last_user_message_at);
  const hoursSinceMessage = hoursBetween(now, lastUserMessage);
  
  if (hoursSinceMessage < MIN_HOURS_SINCE_MESSAGE) {
    return { eligible: false, reason: `Only ${Math.round(hoursSinceMessage)}h since last message` };
  }
  
  // Check time since last re-engagement
  if (candidate.last_reengagement_at) {
    const lastReengagement = new Date(candidate.last_reengagement_at);
    const hoursSinceReengagement = hoursBetween(now, lastReengagement);
    
    if (hoursSinceReengagement < MIN_HOURS_SINCE_REENGAGEMENT) {
      return { eligible: false, reason: `Only ${Math.round(hoursSinceReengagement)}h since last re-engagement` };
    }
  }
  
  // Check evening window
  const timezone = candidate.profile?.timezone || DEFAULT_TIMEZONE;
  if (!isInEveningWindow(timezone)) {
    const hour = getLocalHour(timezone);
    return { eligible: false, reason: `Not evening (${hour}h in ${timezone})` };
  }
  
  return { eligible: true };
}

async function processCandidate(candidate) {
  console.log(`\n📝 @${candidate.username || candidate.fanvue_user_id}`);
  
  // Check eligibility
  const eligibility = isEligible(candidate);
  if (!eligibility.eligible) {
    console.log(`  ⏭️ ${eligibility.reason}`);
    return { success: false, reason: eligibility.reason };
  }
  
  // Build message
  const message = buildReengagementMessage(
    candidate.profile,
    candidate.detected_language
  );
  
  console.log(`  💬 "${message}"`);
  
  try {
    // Send message
    await sendFanvueMessage(candidate.fanvue_chat_id, message);
    
    // Update database
    await supabase
      .from('fanvue_dm_contacts')
      .update({
        last_reengagement_at: new Date().toISOString(),
        reengagement_count: candidate.reengagement_count + 1,
        last_contact_at: new Date().toISOString(),
      })
      .eq('id', candidate.id);
    
    // Save message
    await supabase
      .from('fanvue_dm_messages')
      .insert({
        contact_id: candidate.id,
        direction: 'outgoing',
        content: message,
        response_strategy: 'reengagement',
      });
    
    console.log(`  ✅ Sent!`);
    return { success: true, message };
    
  } catch (error) {
    console.error(`  ❌ Error:`, error.message);
    return { success: false, error: error.message };
  }
}

// ===========================================
// MAIN
// ===========================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔔 FANVUE RE-ENGAGEMENT');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Check if Fanvue is configured
  if (!accessToken || !refreshToken) {
    console.error('❌ Fanvue tokens not configured');
    process.exit(1);
  }
  
  // Get candidates
  const candidates = await getCandidates();
  console.log(`\n📊 Found ${candidates.length} potential candidates`);
  
  if (candidates.length === 0) {
    console.log('\n✅ No candidates for re-engagement right now');
    return;
  }
  
  // Process each candidate
  let sent = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const candidate of candidates) {
    const result = await processCandidate(candidate);
    
    if (result.success) {
      sent++;
      // Delay between sends
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else if (result.error) {
      errors++;
    } else {
      skipped++;
    }
  }
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Sent: ${sent}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log('\n✅ Re-engagement complete!');
}

main().catch(console.error);
