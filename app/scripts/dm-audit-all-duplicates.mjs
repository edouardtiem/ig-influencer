#!/usr/bin/env node
/**
 * DM Audit Script - Find ALL duplicate patterns
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

async function findAllDuplicates() {
  console.log('=== COMPREHENSIVE DUPLICATE AUDIT ===\n');
  
  // Get all contacts with activity
  const { data: contacts } = await supabase
    .from('elena_dm_contacts')
    .select('*')
    .order('last_contact_at', { ascending: false });
  
  console.log('Total contacts:', contacts?.length || 0);
  
  let totalDuplicates = 0;
  const duplicateContacts = [];
  
  for (const contact of contacts || []) {
    // Get all messages for this contact
    const { data: messages } = await supabase
      .from('elena_dm_messages')
      .select('*')
      .eq('contact_id', contact.id)
      .order('created_at', { ascending: true });
    
    if (!messages?.length) continue;
    
    // Check for various duplicate patterns
    const duplicates = [];
    
    for (let i = 1; i < messages.length; i++) {
      const prev = messages[i - 1];
      const curr = messages[i];
      
      // Pattern 1: Same content within 5 minutes (same direction)
      if (curr.content === prev.content && curr.direction === prev.direction) {
        const timeDiff = new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime();
        if (timeDiff < 300000) { // 5 minutes
          duplicates.push({
            type: 'exact_same',
            timeDiff: Math.round(timeDiff / 1000),
            content: curr.content.substring(0, 50),
            direction: curr.direction,
            time: curr.created_at
          });
        }
      }
      
      // Pattern 2: Two outgoing messages in a row without incoming in between
      if (curr.direction === 'outgoing' && prev.direction === 'outgoing') {
        const timeDiff = new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime();
        // Only flag if within 2 minutes (suspicious rapid-fire)
        if (timeDiff < 120000) {
          duplicates.push({
            type: 'double_response',
            timeDiff: Math.round(timeDiff / 1000),
            prevContent: prev.content.substring(0, 40),
            currContent: curr.content.substring(0, 40),
            time: curr.created_at
          });
        }
      }
      
      // Pattern 3: Response that looks like "hey 🖤" repeated (generic response loop)
      if (curr.direction === 'outgoing' && prev.direction === 'outgoing') {
        const isGeneric = (c) => /^hey|^salut|^coucou|^bonjour/i.test(c) && c.length < 20;
        if (isGeneric(curr.content) && isGeneric(prev.content)) {
          duplicates.push({
            type: 'generic_loop',
            prevContent: prev.content,
            currContent: curr.content,
            time: curr.created_at
          });
        }
      }
    }
    
    if (duplicates.length > 0) {
      totalDuplicates += duplicates.length;
      duplicateContacts.push({
        username: contact.ig_username,
        count: duplicates.length,
        duplicates
      });
    }
  }
  
  // Display results
  console.log('\n=== DUPLICATE PATTERNS FOUND ===\n');
  
  if (duplicateContacts.length === 0) {
    console.log('✅ No duplicate patterns found!');
    return;
  }
  
  for (const { username, count, duplicates } of duplicateContacts) {
    console.log(`\n@${username} - ${count} duplicate pattern(s):`);
    for (const dup of duplicates) {
      const time = new Date(dup.time).toLocaleString('fr-FR');
      if (dup.type === 'exact_same') {
        console.log(`  ⚠️ EXACT DUPLICATE (${dup.timeDiff}s later) [${dup.direction}]: "${dup.content}..."`);
      } else if (dup.type === 'double_response') {
        console.log(`  ⚠️ DOUBLE RESPONSE (${dup.timeDiff}s apart):`);
        console.log(`     1: "${dup.prevContent}..."`);
        console.log(`     2: "${dup.currContent}..."`);
      } else if (dup.type === 'generic_loop') {
        console.log(`  ⚠️ GENERIC RESPONSE LOOP:`);
        console.log(`     1: "${dup.prevContent}"`);
        console.log(`     2: "${dup.currContent}"`);
      }
    }
  }
  
  console.log('\n=== SUMMARY ===');
  console.log('Total duplicate patterns:', totalDuplicates);
  console.log('Contacts affected:', duplicateContacts.length);
}

findAllDuplicates().catch(console.error);

