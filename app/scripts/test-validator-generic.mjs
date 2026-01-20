#!/usr/bin/env node
// ===========================================
// TEST VALIDATOR — Generic Response Blocker
// ===========================================

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Copy of the validator logic for testing
const GENERIC_PATTERNS = [
  /^hey\s*🖤?\s*\.{0,3}$/i,
  /^salut\s*🖤?\s*\.{0,3}$/i,
  /^coucou\s*🖤?\s*\.{0,3}$/i,
  /^hello\s*🖤?\s*\.{0,3}$/i,
  /^hi\s*🖤?\s*\.{0,3}$/i,
  /^bonjour\s*🖤?\s*\.{0,3}$/i,
  /^hola\s*🖤?\s*\.{0,3}$/i,
  /^🖤\s*$/,
  /^👀\s*$/,
  /^😏\s*$/,
];

function testValidatorGeneric(response) {
  const trimmedResponse = response.trim();
  const wordCount = response.split(/\s+/).filter(w => w.length > 0).length;
  const hasQuestion = trimmedResponse.includes('?');
  const hasEmoji = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(response);
  
  // Check generic patterns
  for (const pattern of GENERIC_PATTERNS) {
    if (pattern.test(trimmedResponse)) {
      return { isValid: false, reason: `Generic response blocked: "${trimmedResponse}"` };
    }
  }
  
  // Check too short
  if (wordCount < 3 && !hasQuestion) {
    return { isValid: false, reason: `Response too short: ${wordCount} words` };
  }
  
  // Check no engagement
  if (wordCount <= 4 && !hasQuestion && !hasEmoji) {
    return { isValid: false, reason: `Low engagement: no question, no emoji, ${wordCount} words` };
  }
  
  return { isValid: true, reason: 'PASS' };
}

// Test cases
const testCases = [
  // Should FAIL (generic)
  { input: "hey 🖤", expected: false, description: "Basic generic greeting" },
  { input: "hey 🖤...", expected: false, description: "Generic with dots" },
  { input: "salut 🖤", expected: false, description: "French generic" },
  { input: "coucou 🖤", expected: false, description: "French coucou" },
  { input: "hello 🖤", expected: false, description: "English generic" },
  { input: "hi 🖤", expected: false, description: "Short hi" },
  { input: "🖤", expected: false, description: "Just emoji" },
  { input: "hey", expected: false, description: "Just hey (too short)" },
  { input: "ok cool", expected: false, description: "Too short no emoji" },
  
  // Should PASS (good responses)
  { input: "hey 🖤 tu viens d'où?", expected: true, description: "Greeting with question" },
  { input: "qu'est-ce que tu fais? 😊", expected: true, description: "French question" },
  { input: "what's your vibe today? 👀", expected: true, description: "English question" },
  { input: "je suis à Paris 🖤 il fait beau", expected: true, description: "Statement with substance" },
  { input: "tu me plais beaucoup 😏", expected: true, description: "Engaging statement" },
  { input: "where are you from?", expected: true, description: "Question without emoji" },
  { input: "j'aime bien ton énergie 🖤", expected: true, description: "Compliment with substance" },
  { input: "raconte-moi un peu 👀", expected: true, description: "French request" },
];

console.log('\n' + '='.repeat(70));
console.log('🧪 VALIDATOR TEST — Generic Response Blocker');
console.log('='.repeat(70) + '\n');

let passed = 0;
let failed = 0;

for (const test of testCases) {
  const result = testValidatorGeneric(test.input);
  const success = result.isValid === test.expected;
  
  if (success) {
    passed++;
    console.log(`✅ PASS: "${test.input}"`);
    console.log(`   ${test.description} → ${result.isValid ? 'VALID' : 'BLOCKED'}`);
  } else {
    failed++;
    console.log(`❌ FAIL: "${test.input}"`);
    console.log(`   ${test.description}`);
    console.log(`   Expected: ${test.expected ? 'VALID' : 'BLOCKED'}, Got: ${result.isValid ? 'VALID' : 'BLOCKED'}`);
    console.log(`   Reason: ${result.reason}`);
  }
  console.log('');
}

console.log('─'.repeat(70));
console.log(`\n📊 Results: ${passed}/${testCases.length} tests passed`);

if (failed > 0) {
  console.log(`⚠️ ${failed} tests failed`);
} else {
  console.log('✅ All tests passed! Generic response blocker is working.');
}

console.log('\n' + '='.repeat(70) + '\n');
