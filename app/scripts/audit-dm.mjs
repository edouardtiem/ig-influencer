/**
 * DM Audit Script - Check recent messages for "nonsense" issues
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env from the app
const envPath = '/Users/edouardtiem/Cursor Projects/IG-influencer/app/.env.local';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function auditDMs() {
  console.log('🔍 DM AUDIT - Checking for nonsense messages\n');
  console.log('='.repeat(60));

  // 1. Get recent outgoing messages (last 50)
  const { data: recentMessages, error: msgError } = await supabase
    .from('elena_dm_messages')
    .select(`
      id,
      contact_id,
      direction,
      content,
      intent,
      response_strategy,
      created_at
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (msgError) {
    console.error('Error fetching messages:', msgError);
    return;
  }

  console.log(`\n📊 Total messages fetched: ${recentMessages.length}`);

  // Group by contact to see conversations
  const convos = {};
  for (const msg of recentMessages) {
    if (!convos[msg.contact_id]) {
      convos[msg.contact_id] = [];
    }
    convos[msg.contact_id].push(msg);
  }

  console.log(`\n👥 Unique contacts: ${Object.keys(convos).length}`);

  // Show some recent outgoing messages
  const outgoing = recentMessages.filter(m => m.direction === 'outgoing').slice(0, 30);
  console.log(`\n📤 Recent OUTGOING messages (${outgoing.length}):`);
  console.log('-'.repeat(60));

  for (const msg of outgoing) {
    const date = new Date(msg.created_at).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    console.log(`[${date}] (${msg.response_strategy || '?'}) "${msg.content}"`);
  }

  // Check for patterns that might indicate "nonsense"
  console.log('\n\n🚨 POTENTIAL ISSUES:');
  console.log('-'.repeat(60));

  // Check 1: Very short messages that aren't questions
  const tooShort = outgoing.filter(m =>
    m.content.length < 15 && !m.content.includes('?')
  );
  if (tooShort.length > 0) {
    console.log(`\n⚠️ TOO SHORT (< 15 chars, no question): ${tooShort.length}`);
    tooShort.slice(0, 5).forEach(m => console.log(`  - "${m.content}"`));
  }

  // Check 2: Repeated messages
  const contentCounts = {};
  for (const msg of outgoing) {
    const key = msg.content.toLowerCase().trim();
    contentCounts[key] = (contentCounts[key] || 0) + 1;
  }
  const repeated = Object.entries(contentCounts).filter(([_, count]) => count > 2);
  if (repeated.length > 0) {
    console.log(`\n⚠️ REPEATED MESSAGES (>2x):`);
    repeated.forEach(([content, count]) => console.log(`  - [${count}x] "${content.substring(0, 50)}..."`));
  }

  // Check 3: English responses (if contact detected as French)
  const englishInFrench = outgoing.filter(m =>
    /\b(what|how|where|tell me|i'm|you're|that's)\b/i.test(m.content)
  );
  if (englishInFrench.length > 0) {
    console.log(`\n⚠️ ENGLISH WORDS IN RESPONSES: ${englishInFrench.length}`);
    englishInFrench.slice(0, 5).forEach(m => console.log(`  - "${m.content}"`));
  }

  // Check 4: Generic fallbacks
  const genericFallbacks = outgoing.filter(m =>
    /^(hey|salut|coucou|hello|hi)\s*🖤?\s*$/i.test(m.content.trim())
  );
  if (genericFallbacks.length > 0) {
    console.log(`\n⚠️ GENERIC FALLBACKS: ${genericFallbacks.length}`);
    genericFallbacks.forEach(m => console.log(`  - "${m.content}"`));
  }

  // Show a few full conversations to understand context
  console.log('\n\n📝 SAMPLE CONVERSATIONS (last 3):');
  console.log('='.repeat(60));

  const contactIds = Object.keys(convos).slice(0, 3);
  for (const contactId of contactIds) {
    const msgs = convos[contactId].sort((a, b) =>
      new Date(a.created_at) - new Date(b.created_at)
    ).slice(-10); // Last 10 messages

    // Get contact info
    const { data: contact } = await supabase
      .from('elena_dm_contacts')
      .select('ig_username, stage, message_count, detected_language')
      .eq('id', contactId)
      .single();

    console.log(`\n--- @${contact?.ig_username || 'unknown'} (${contact?.stage}, ${contact?.message_count} msgs, lang: ${contact?.detected_language}) ---`);

    for (const msg of msgs) {
      const prefix = msg.direction === 'incoming' ? '👤 User:' : '🤖 Elena:';
      console.log(`${prefix} "${msg.content}"`);
    }
  }

  // Cost analysis
  console.log('\n\n💰 COST ANALYSIS:');
  console.log('='.repeat(60));

  // Count total messages today
  const today = new Date().toISOString().split('T')[0];
  const { count: todayCount } = await supabase
    .from('elena_dm_messages')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', today);

  const { count: outgoingToday } = await supabase
    .from('elena_dm_messages')
    .select('id', { count: 'exact', head: true })
    .eq('direction', 'outgoing')
    .gte('created_at', today);

  console.log(`📊 Messages today: ${todayCount}`);
  console.log(`📤 Outgoing today: ${outgoingToday}`);
  console.log(`💵 Estimated API calls today: ${outgoingToday} (+ fallback retries)`);

  // Haiku 4.5 pricing (rough estimate)
  // Input: $0.80/1M tokens, Output: $4/1M tokens
  // Average DM prompt: ~2000 tokens input, ~50 tokens output
  const estimatedInputTokens = outgoingToday * 2000;
  const estimatedOutputTokens = outgoingToday * 50;
  const estimatedCost = (estimatedInputTokens * 0.80 / 1000000) + (estimatedOutputTokens * 4 / 1000000);
  console.log(`💰 Estimated daily cost: $${estimatedCost.toFixed(2)} (rough)`);

  // Check for retry patterns (multiple attempts)
  console.log('\n\n🔄 CHECKING RETRY PATTERNS...');

  // Look at contacts with many messages (might indicate loops)
  const { data: highVolumeContacts } = await supabase
    .from('elena_dm_contacts')
    .select('ig_username, message_count, our_message_count, stage')
    .gt('message_count', 40)
    .order('message_count', { ascending: false })
    .limit(10);

  if (highVolumeContacts?.length > 0) {
    console.log(`\n⚠️ HIGH VOLUME CONTACTS (>40 msgs):`);
    for (const c of highVolumeContacts) {
      console.log(`  - @${c.ig_username}: ${c.message_count} total, ${c.our_message_count} from us (${c.stage})`);
    }
  }
}

auditDMs().catch(console.error);
