#!/usr/bin/env node
/**
 * DM Kill Switch — Pause/Resume DM automation
 *
 * Usage:
 *   node scripts/dm-pause.mjs          # Pause with default reason
 *   node scripts/dm-pause.mjs "reason" # Pause with custom reason
 *   node scripts/dm-pause.mjs --resume # Resume DM system
 *   node scripts/dm-pause.mjs --status # Check current status
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load env from app directory
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getStatus() {
  const { data, error } = await supabase
    .from('elena_settings')
    .select('value, updated_at')
    .eq('key', 'dm_system')
    .single();

  if (error) {
    console.log('⚪ DM system status: NOT CONFIGURED (defaulting to active)');
    return null;
  }

  return data;
}

async function pause(reason) {
  const { data, error } = await supabase
    .from('elena_settings')
    .upsert({
      key: 'dm_system',
      value: {
        paused: true,
        paused_at: new Date().toISOString(),
        paused_reason: reason,
      },
    })
    .select('value, updated_at')
    .single();

  if (error) {
    console.error('❌ Failed to pause:', error.message);
    process.exit(1);
  }

  console.log('🔴 DM SYSTEM PAUSED');
  console.log(`   Reason: ${reason}`);
  console.log(`   At: ${data.value.paused_at}`);
  return data;
}

async function resume() {
  const { data, error } = await supabase
    .from('elena_settings')
    .upsert({
      key: 'dm_system',
      value: {
        paused: false,
        paused_at: null,
        paused_reason: null,
      },
    })
    .select('value, updated_at')
    .single();

  if (error) {
    console.error('❌ Failed to resume:', error.message);
    process.exit(1);
  }

  console.log('🟢 DM SYSTEM RESUMED');
  return data;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--status')) {
    const status = await getStatus();
    if (status) {
      console.log('\n=== DM SYSTEM STATUS ===');
      console.log(`Status: ${status.value.paused ? '🔴 PAUSED' : '🟢 ACTIVE'}`);
      if (status.value.paused) {
        console.log(`Paused at: ${status.value.paused_at}`);
        console.log(`Reason: ${status.value.paused_reason}`);
      }
      console.log(`Updated: ${status.updated_at}`);
    }
    return;
  }

  if (args.includes('--resume')) {
    await resume();
    return;
  }

  // Default: pause
  const reason = args[0] || 'Instagram account blocked (2026-01-29)';
  await pause(reason);
}

main().catch(console.error);
