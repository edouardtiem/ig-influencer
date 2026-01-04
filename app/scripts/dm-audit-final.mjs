#!/usr/bin/env node
/**
 * DM Audit Script - Find FINAL_MESSAGE duplicates
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load env from app directory
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findFinalMessages() {
  console.log('=== CONTACTS WHO GOT FINAL_MESSAGE ===\n');
  
  // Find messages containing the FINAL_MESSAGE pattern
  const { data: messages, error } = await supabase
    .from('elena_dm_messages')
    .select('*')
    .eq('direction', 'outgoing')
    .like('content', '%je vois qu%')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  if (!messages?.length) {
    console.log('No FINAL_MESSAGE found');
    return;
  }
  
  console.log('Found', messages.length, 'FINAL_MESSAGE instances\n');
  
  // Get contact info for each
  const contactIds = [...new Set(messages.map(m => m.contact_id))];
  
  const { data: contacts } = await supabase
    .from('elena_dm_contacts')
    .select('*')
    .in('id', contactIds);
  
  const contactMap = {};
  for (const c of contacts || []) {
    contactMap[c.id] = c;
  }
  
  // Group by contact
  const byContact = {};
  for (const msg of messages) {
    const contact = contactMap[msg.contact_id];
    const username = contact?.ig_username || msg.contact_id;
    if (!byContact[username]) {
      byContact[username] = {
        count: 0,
        messages: [],
        contact
      };
    }
    byContact[username].count++;
    byContact[username].messages.push({
      time: msg.created_at,
      content: msg.content.substring(0, 80) + '...'
    });
  }
  
  // Display
  for (const [username, data] of Object.entries(byContact)) {
    const status = data.contact?.is_stopped ? '🛑 STOPPED' : '⚠️ NOT STOPPED';
    console.log(`@${username} - ${data.count} FINAL_MESSAGE(s) - ${status}`);
    console.log(`  Stage: ${data.contact?.stage}, Messages: ${data.contact?.message_count}`);
    for (const msg of data.messages) {
      console.log(`  - ${new Date(msg.time).toLocaleString('fr-FR')}`);
    }
    console.log('');
  }
  
  console.log('Total FINAL_MESSAGE sent:', messages.length);
  console.log('Unique contacts:', Object.keys(byContact).length);
  
  // Check for duplicates (same contact got FINAL_MESSAGE more than once)
  const duplicates = Object.entries(byContact).filter(([, data]) => data.count > 1);
  if (duplicates.length > 0) {
    console.log('\n⚠️ DUPLICATES FOUND:');
    for (const [username, data] of duplicates) {
      console.log(`  - @${username}: ${data.count} times`);
    }
  } else {
    console.log('\n✅ No duplicates found');
  }
}

findFinalMessages().catch(console.error);

