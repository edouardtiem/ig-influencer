#!/usr/bin/env node
/**
 * DM Followup Script
 * 
 * Runs hourly via GitHub Action to send followup messages
 * to contacts who haven't converted after +20h since closing stage.
 * 
 * Flow:
 * 1. Get contacts with followup_scheduled_at <= NOW and followup_sent = false
 * 2. Send a re-engagement message via ManyChat API
 * 3. Mark followup_sent = true and stage = 'followup'
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load env
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const manychatApiToken = process.env.MANYCHAT_API_TOKEN;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Followup messages - soft re-engagement
const FOLLOWUP_MESSAGES_FR = [
  "hey toi 🖤 ça fait un moment... tu me manques un peu 👀",
  "coucou 😊 j'ai pensé à toi... t'es passé voir mon contenu?",
  "hey 🖤 tu t'es perdu? je t'attends toujours là-bas 👀",
  "salut toi 😏 tu reviens quand me voir?",
];

const FOLLOWUP_MESSAGES_EN = [
  "hey you 🖤 it's been a while... miss talking to you 👀",
  "hey stranger 😊 I was thinking about you...",
  "hey 🖤 did you get lost? I'm still waiting for you 👀",
  "hi you 😏 when are you coming back to see me?",
];

/**
 * Get a random followup message based on language
 */
function getFollowupMessage(language) {
  const messages = language === 'fr' ? FOLLOWUP_MESSAGES_FR : FOLLOWUP_MESSAGES_EN;
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Send message via ManyChat API
 * Uses the "Send Content" endpoint to send a text message
 * 
 * @param {string} subscriberId - ManyChat subscriber ID (ig_user_id)
 * @param {string} message - The message to send
 * @returns {Promise<boolean>} - Success status
 */
async function sendManyChatMessage(subscriberId, message) {
  if (!manychatApiToken) {
    console.log(`⚠️ MANYCHAT_API_TOKEN not set - simulating send for subscriber ${subscriberId}`);
    console.log(`   Message: "${message}"`);
    return true; // Simulate success for testing
  }

  try {
    // ManyChat API endpoint for sending content
    // Docs: https://api.manychat.com/docs/send-content
    const response = await fetch('https://api.manychat.com/fb/sending/sendContent', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${manychatApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriber_id: subscriberId,
        data: {
          version: 'v2',
          content: {
            messages: [
              {
                type: 'text',
                text: message,
              }
            ]
          }
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ ManyChat API error for ${subscriberId}: ${error}`);
      return false;
    }

    const result = await response.json();
    console.log(`✅ Message sent to ${subscriberId}: "${message.substring(0, 40)}..."`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send to ${subscriberId}:`, error.message);
    return false;
  }
}

/**
 * Mark contact as followup sent
 */
async function markFollowupSent(contactId) {
  const { error } = await supabase
    .from('elena_dm_contacts')
    .update({
      followup_sent: true,
      stage: 'followup',
    })
    .eq('id', contactId);

  if (error) {
    console.error(`❌ Failed to mark followup sent for ${contactId}:`, error.message);
    return false;
  }
  return true;
}

/**
 * Save the followup message to message history
 */
async function saveFollowupMessage(contactId, message) {
  const { error } = await supabase
    .from('elena_dm_messages')
    .insert({
      contact_id: contactId,
      direction: 'outgoing',
      content: message,
      response_strategy: 'followup',
      stage_at_time: 'followup',
    });

  if (error) {
    console.error(`❌ Failed to save followup message for ${contactId}:`, error.message);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(50));
  console.log('📤 DM FOLLOWUP SCRIPT');
  console.log(`🕐 ${new Date().toISOString()}`);
  console.log('='.repeat(50));

  // Get contacts ready for followup
  const now = new Date().toISOString();
  
  const { data: contacts, error } = await supabase
    .from('elena_dm_contacts')
    .select('*')
    .eq('followup_sent', false)
    .eq('is_stopped', false)
    .not('followup_scheduled_at', 'is', null)
    .lte('followup_scheduled_at', now)
    .limit(50); // Process max 50 per run

  if (error) {
    console.error('❌ Error fetching contacts:', error.message);
    process.exit(1);
  }

  if (!contacts || contacts.length === 0) {
    console.log('✅ No contacts ready for followup');
    return;
  }

  console.log(`📋 Found ${contacts.length} contact(s) ready for followup\n`);

  let successCount = 0;
  let failCount = 0;

  for (const contact of contacts) {
    console.log(`\n--- Processing @${contact.ig_username || contact.ig_user_id} ---`);
    console.log(`   Stage: ${contact.stage}`);
    console.log(`   Messages: ${contact.message_count}`);
    console.log(`   Language: ${contact.detected_language || 'en'}`);
    console.log(`   Scheduled at: ${contact.followup_scheduled_at}`);

    // Get followup message based on language
    const message = getFollowupMessage(contact.detected_language || 'en');
    
    // Send via ManyChat
    const sent = await sendManyChatMessage(contact.ig_user_id, message);
    
    if (sent) {
      // Mark as sent and save message
      await markFollowupSent(contact.id);
      await saveFollowupMessage(contact.id, message);
      successCount++;
      console.log(`   ✅ Followup sent successfully`);
    } else {
      failCount++;
      console.log(`   ❌ Failed to send followup`);
    }

    // Small delay between sends to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log('='.repeat(50));
}

main().catch(console.error);
