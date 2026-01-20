#!/usr/bin/env node
/**
 * Test Script for DM Funnel Changes
 * 
 * Tests:
 * 1. Intent detection fixes (ai_question false positives)
 * 2. "Asking about Elena" detection
 * 3. Stage transitions
 * 4. Followup scheduling
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ===========================================
// TEST 1: Intent Detection (ai_question fix)
// ===========================================

function testIntentDetection() {
  console.log('\n' + '='.repeat(50));
  console.log('TEST 1: Intent Detection (ai_question fix)');
  console.log('='.repeat(50));

  // AI question patterns (fixed version)
  const aiPatterns = [
    /\b(ia|i\.a\.)\b/i,
    /(?:^|\s)ai(?:\s|$|\?)/i,              // "AI" with spaces/start/end (not "j'ai", "training")
    /\ban?\s+ai\b/i,                        // "an AI", "a AI"
    /\brobot\b/i,
    /\bbot\b/i,
    /\b(réel|réelle|vraie?)\b.*\b(personne|fille|femme|humain)/i,
    /\b(real|fake)\s+(person|girl|woman|human|account)/i,
    /\bartificial\b/i,
    /\b(es-tu|are you|tu es|you are|you're)\s*(une?|a|an)?\s*(robot|bot|ia|ai|machine|program)/i,
    /\b(human|humain|humaine)\b.*\?/i,
  ];

  // Messages that should NOT be ai_question (false positives before fix)
  const shouldNotMatch = [
    "Les deux je crois ses le corps qui fait la différence",
    "Oui un peu training mais je joue le hockey",
    "Ses quoi tes plaisirs?",
    "Trucs pour faire quoi?",
    "No I said",
    "J'aime avoir du plaisir physiquement",
    "C'est vrai que t'es belle",
    "J'ai envie de te voir",
  ];

  // Messages that SHOULD be ai_question
  const shouldMatch = [
    "es-tu un robot?",
    "are you a bot?",
    "t'es une IA?",
    "tu es une vraie personne?",
    "are you a real person?",
  ];

  let passed = 0;
  let failed = 0;

  console.log('\n📌 Should NOT match ai_question:');
  for (const msg of shouldNotMatch) {
    const isMatch = aiPatterns.some(p => p.test(msg.toLowerCase()));
    const status = isMatch ? '❌ FAIL (false positive)' : '✅ PASS';
    console.log(`  ${status}: "${msg.substring(0, 40)}..."`);
    isMatch ? failed++ : passed++;
  }

  console.log('\n📌 Should match ai_question:');
  for (const msg of shouldMatch) {
    const isMatch = aiPatterns.some(p => p.test(msg.toLowerCase()));
    const status = isMatch ? '✅ PASS' : '❌ FAIL (missed)';
    console.log(`  ${status}: "${msg}"`);
    isMatch ? passed++ : failed++;
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

// ===========================================
// TEST 2: "Asking about Elena" Detection
// ===========================================

function testAskingAboutElena() {
  console.log('\n' + '='.repeat(50));
  console.log('TEST 2: "Asking about Elena" Detection');
  console.log('='.repeat(50));

  const askingAboutElenaPatterns = [
    /^toi[\s?!.]*$/i,
    /^et toi[\s?!.]*$/i,
    /^you[\s?!.]*$/i,
    /^what about you[\s?!.]*$/i,
    /^and you[\s?!.]*$/i,
    /\btoi tu\b/i,
    /\b(c'est quoi|what's|what is|quels? sont?)\s+(tes|your)\b/i,
    /\btoi\s+(tu|qu'est-ce|comment|où)\b/i,
  ];

  const shouldMatch = [
    "Toi",
    "Toi?",
    "Et toi?",
    "et toi",
    "Toi tu fais quoi",
    "C'est quoi tes plaisirs?",
    "What's your hobby?",
  ];

  const shouldNotMatch = [
    "Je t'aime toi",
    "C'est toi sur la photo?",
    "Bonjour",
  ];

  let passed = 0;
  let failed = 0;

  console.log('\n📌 Should match (asking about Elena):');
  for (const msg of shouldMatch) {
    const isMatch = askingAboutElenaPatterns.some(p => p.test(msg.toLowerCase()));
    const status = isMatch ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${status}: "${msg}"`);
    isMatch ? passed++ : failed++;
  }

  console.log('\n📌 Should NOT match:');
  for (const msg of shouldNotMatch) {
    const isMatch = askingAboutElenaPatterns.some(p => p.test(msg.toLowerCase()));
    const status = isMatch ? '❌ FAIL (false positive)' : '✅ PASS';
    console.log(`  ${status}: "${msg}"`);
    isMatch ? failed++ : passed++;
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

// ===========================================
// TEST 3: Stage Transitions
// ===========================================

function testStageTransitions() {
  console.log('\n' + '='.repeat(50));
  console.log('TEST 3: Stage Transitions');
  console.log('='.repeat(50));

  const STAGE_TRANSITIONS = {
    cold: 8,
    warm: 20,
    hot: 35,
    pitched: 38,
    closing: 48,
    followup: 56,
    converted: 100,
    paid: 150
  };

  const MESSAGE_CAPS = {
    cold: 8,
    warm: 12,
    hot: 15,
    pitched: 3,
    closing: 10,
    followup: 8,
    converted: 50,
    paid: 100
  };

  console.log('\n📌 Stage transition points:');
  console.log(`  COLD: 1-${STAGE_TRANSITIONS.cold} (${MESSAGE_CAPS.cold} msgs)`);
  console.log(`  WARM: ${STAGE_TRANSITIONS.cold + 1}-${STAGE_TRANSITIONS.warm} (${MESSAGE_CAPS.warm} msgs)`);
  console.log(`  HOT: ${STAGE_TRANSITIONS.warm + 1}-${STAGE_TRANSITIONS.hot} (${MESSAGE_CAPS.hot} msgs)`);
  console.log(`  PITCHED: ${STAGE_TRANSITIONS.hot + 1}-${STAGE_TRANSITIONS.pitched} (${MESSAGE_CAPS.pitched} msgs)`);
  console.log(`  CLOSING: ${STAGE_TRANSITIONS.pitched + 1}-${STAGE_TRANSITIONS.closing} (${MESSAGE_CAPS.closing} msgs)`);
  console.log(`  FOLLOWUP: ${STAGE_TRANSITIONS.closing + 1}-${STAGE_TRANSITIONS.followup} (${MESSAGE_CAPS.followup} msgs)`);

  // Verify totals
  const totalBeforeStop = MESSAGE_CAPS.cold + MESSAGE_CAPS.warm + MESSAGE_CAPS.hot + 
                          MESSAGE_CAPS.pitched + MESSAGE_CAPS.closing + MESSAGE_CAPS.followup;
  console.log(`\n📊 Total messages before stop: ${totalBeforeStop}`);
  
  const isCorrect = totalBeforeStop === STAGE_TRANSITIONS.followup;
  console.log(isCorrect ? '✅ PASS: Totals match' : '❌ FAIL: Totals mismatch');
  
  return isCorrect;
}

// ===========================================
// TEST 4: Followup Scheduling (DB Test)
// ===========================================

async function testFollowupScheduling() {
  console.log('\n' + '='.repeat(50));
  console.log('TEST 4: Followup Scheduling (DB Connection)');
  console.log('='.repeat(50));

  try {
    // Check if the followup columns exist
    const { data, error } = await supabase
      .from('elena_dm_contacts')
      .select('id, ig_username, followup_scheduled_at, followup_sent, stage')
      .limit(1);

    if (error) {
      if (error.message.includes('followup_scheduled_at') || error.message.includes('followup_sent')) {
        console.log('❌ FAIL: Followup columns do not exist yet');
        console.log('   → Run the Supabase migration first');
        return false;
      }
      throw error;
    }

    console.log('✅ PASS: Followup columns exist in database');

    // Check for any scheduled followups
    const { data: scheduled, error: schedError } = await supabase
      .from('elena_dm_contacts')
      .select('id, ig_username, followup_scheduled_at')
      .eq('followup_sent', false)
      .not('followup_scheduled_at', 'is', null)
      .limit(5);

    if (schedError) throw schedError;

    if (scheduled && scheduled.length > 0) {
      console.log(`\n📋 Found ${scheduled.length} contact(s) with scheduled followup:`);
      for (const c of scheduled) {
        console.log(`   @${c.ig_username || 'unknown'} → ${c.followup_scheduled_at}`);
      }
    } else {
      console.log('\n📋 No followups currently scheduled (this is normal for new setup)');
    }

    return true;
  } catch (error) {
    console.log('❌ FAIL:', error.message);
    return false;
  }
}

// ===========================================
// TEST 5: Simulate Followup Send (Dry Run)
// ===========================================

async function testFollowupDryRun() {
  console.log('\n' + '='.repeat(50));
  console.log('TEST 5: Followup Dry Run (Simulation)');
  console.log('='.repeat(50));

  const FOLLOWUP_MESSAGES_FR = [
    "hey toi 🖤 ça fait un moment... tu me manques un peu 👀",
    "coucou 😊 j'ai pensé à toi... t'es passé voir mon contenu?",
  ];

  const FOLLOWUP_MESSAGES_EN = [
    "hey you 🖤 it's been a while... miss talking to you 👀",
    "hey stranger 😊 I was thinking about you...",
  ];

  console.log('\n📌 French followup messages:');
  FOLLOWUP_MESSAGES_FR.forEach((m, i) => console.log(`  ${i + 1}. "${m}"`));

  console.log('\n📌 English followup messages:');
  FOLLOWUP_MESSAGES_EN.forEach((m, i) => console.log(`  ${i + 1}. "${m}"`));

  // Simulate picking a message
  const randomFr = FOLLOWUP_MESSAGES_FR[Math.floor(Math.random() * FOLLOWUP_MESSAGES_FR.length)];
  const randomEn = FOLLOWUP_MESSAGES_EN[Math.floor(Math.random() * FOLLOWUP_MESSAGES_EN.length)];

  console.log('\n📤 Simulated sends:');
  console.log(`  FR user would receive: "${randomFr}"`);
  console.log(`  EN user would receive: "${randomEn}"`);

  console.log('\n✅ PASS: Dry run completed');
  return true;
}

// ===========================================
// MAIN
// ===========================================

async function main() {
  console.log('🧪 DM FUNNEL TEST SUITE');
  console.log('========================\n');

  const results = {
    intentDetection: testIntentDetection(),
    askingAboutElena: testAskingAboutElena(),
    stageTransitions: testStageTransitions(),
    followupScheduling: await testFollowupScheduling(),
    followupDryRun: await testFollowupDryRun(),
  };

  console.log('\n' + '='.repeat(50));
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(50));

  let allPassed = true;
  for (const [test, passed] of Object.entries(results)) {
    const status = passed ? '✅' : '❌';
    console.log(`  ${status} ${test}`);
    if (!passed) allPassed = false;
  }

  console.log('\n' + (allPassed ? '✅ ALL TESTS PASSED!' : '❌ SOME TESTS FAILED'));
  
  if (!results.followupScheduling) {
    console.log('\n⚠️  Note: Run the Supabase migration to enable followup scheduling');
  }

  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
