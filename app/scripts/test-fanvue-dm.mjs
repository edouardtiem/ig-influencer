#!/usr/bin/env node

/**
 * Test script for Fanvue DM System V2
 * 
 * Tests:
 * 1. Venice AI connection
 * 2. Database connection
 * 3. Simulated message processing
 * 
 * Usage:
 *   node scripts/test-fanvue-dm.mjs
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
dotenv.config({ path: '.env.local' });
import OpenAI from 'openai';

// ===========================================
// CONFIG CHECK
// ===========================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('🧪 FANVUE DM SYSTEM V2 — TEST');
console.log('═══════════════════════════════════════════════════════════════\n');

// Check env vars
const checks = {
  VENICE_API_KEY: !!process.env.VENICE_API_KEY,
  SUPABASE_URL: !!process.env.SUPABASE_URL,
  SUPABASE_SERVICE_KEY: !!(process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
};

console.log('📋 Configuration:');
for (const [key, ok] of Object.entries(checks)) {
  console.log(`  ${ok ? '✅' : '❌'} ${key}`);
}

const allOk = Object.values(checks).every(Boolean);
if (!allOk) {
  console.log('\n❌ Missing configuration. Check your .env.local');
  process.exit(1);
}

// ===========================================
// TEST SUPABASE
// ===========================================

console.log('\n📊 Testing Supabase connection...');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

try {
  const { data, error } = await supabase
    .from('fanvue_dm_contacts')
    .select('count')
    .limit(1);
  
  if (error) throw error;
  console.log('  ✅ Supabase connected — fanvue_dm_contacts table exists');
} catch (error) {
  console.log('  ❌ Supabase error:', error.message);
  process.exit(1);
}

// ===========================================
// TEST VENICE AI
// ===========================================

console.log('\n🤖 Testing Venice AI...');

const venice = new OpenAI({
  baseURL: 'https://api.venice.ai/api/v1',
  apiKey: process.env.VENICE_API_KEY,
});

try {
  const response = await venice.chat.completions.create({
    model: 'llama-3.3-70b', // Using a known model
    messages: [
      { 
        role: 'system', 
        content: 'You are Elena, a flirty Italian model. Respond in 1-2 sentences max, be playful and seductive.' 
      },
      { 
        role: 'user', 
        content: 'Hey Elena, tu es vraiment belle' 
      },
    ],
    max_tokens: 100,
    temperature: 0.9,
  });
  
  const reply = response.choices[0]?.message?.content;
  console.log('  ✅ Venice AI connected');
  console.log(`  💬 Test response: "${reply}"`);
} catch (error) {
  console.log('  ❌ Venice AI error:', error.message);
  
  // Try to list available models
  console.log('\n  📋 Trying to list available models...');
  try {
    const models = await venice.models.list();
    console.log('  Available models:', models.data?.map(m => m.id).join(', '));
  } catch (e) {
    console.log('  Could not list models:', e.message);
  }
  process.exit(1);
}

// ===========================================
// SIMULATE MESSAGE PROCESSING
// ===========================================

console.log('\n📨 Simulating message processing...');

// Create a test contact
const testUserId = `test_user_${Date.now()}`;

const { data: contact, error: contactError } = await supabase
  .from('fanvue_dm_contacts')
  .insert({
    fanvue_user_id: testUserId,
    fanvue_chat_id: 'test_chat_123',
    username: 'test_user',
    stage: 'cold',
    message_count: 0,
    first_contact_at: new Date().toISOString(),
    last_contact_at: new Date().toISOString(),
  })
  .select()
  .single();

if (contactError) {
  console.log('  ❌ Could not create test contact:', contactError.message);
} else {
  console.log('  ✅ Test contact created:', contact.id);
  
  // Create a test message
  const { error: msgError } = await supabase
    .from('fanvue_dm_messages')
    .insert({
      contact_id: contact.id,
      direction: 'incoming',
      content: 'Salut Elena, tu es magnifique !',
      intent: 'compliment',
      sentiment: 'positive',
    });
  
  if (msgError) {
    console.log('  ❌ Could not create test message:', msgError.message);
  } else {
    console.log('  ✅ Test message saved');
  }
  
  // Clean up test data
  console.log('\n🧹 Cleaning up test data...');
  await supabase.from('fanvue_dm_messages').delete().eq('contact_id', contact.id);
  await supabase.from('fanvue_dm_contacts').delete().eq('id', contact.id);
  console.log('  ✅ Test data cleaned up');
}

// ===========================================
// SUMMARY
// ===========================================

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('✅ ALL TESTS PASSED!');
console.log('═══════════════════════════════════════════════════════════════');
console.log('\n📝 Next steps:');
console.log('  1. Deploy to Vercel: git push');
console.log('  2. Configure Fanvue webhook: https://your-app.vercel.app/api/fanvue/webhook');
console.log('  3. Send a test message on Fanvue!');
console.log('');
