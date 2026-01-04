#!/usr/bin/env node
/**
 * DM Audit Script - Full history for a specific user
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

async function auditUser(username) {
  // Find contact
  const { data: contact } = await supabase
    .from('elena_dm_contacts')
    .select('*')
    .ilike('ig_username', `%${username}%`)
    .single();
  
  if (!contact) {
    console.log('Contact not found for:', username);
    return;
  }
  
  console.log(`=== FULL HISTORY FOR @${contact.ig_username} ===\n`);
  console.log('Contact info:', JSON.stringify({ 
    stage: contact.stage, 
    message_count: contact.message_count, 
    our_message_count: contact.our_message_count,
    is_stopped: contact.is_stopped,
    detected_language: contact.detected_language
  }, null, 2));
  
  // Get ALL messages for this contact
  const { data: messages } = await supabase
    .from('elena_dm_messages')
    .select('*')
    .eq('contact_id', contact.id)
    .order('created_at', { ascending: true });
  
  console.log('\nTotal messages:', messages?.length || 0);
  console.log('\n--- MESSAGE HISTORY ---\n');
  
  let prevContent = null;
  let prevDirection = null;
  let prevTime = null;
  let duplicateCount = 0;
  
  for (const msg of messages || []) {
    const direction = msg.direction === 'incoming' ? '← IN ' : '→ OUT';
    const time = new Date(msg.created_at);
    const timeStr = time.toLocaleString('fr-FR');
    const content = msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : '');
    
    // Check for duplicate pattern
    let flag = '';
    if (prevContent === msg.content && prevDirection === msg.direction && prevTime) {
      const timeDiff = time.getTime() - prevTime.getTime();
      if (timeDiff < 120000) { // Within 2 minutes
        flag = ` ⚠️ DUPLICATE (${Math.round(timeDiff/1000)}s later)`;
        duplicateCount++;
      }
    }
    
    console.log(`[${timeStr}] ${direction}: ${content}${flag}`);
    
    prevContent = msg.content;
    prevDirection = msg.direction;
    prevTime = time;
  }
  
  console.log('\n=== SUMMARY ===');
  console.log('Duplicates found:', duplicateCount);
}

// Get username from command line args
const username = process.argv[2] || 'jonnie';
auditUser(username).catch(console.error);

