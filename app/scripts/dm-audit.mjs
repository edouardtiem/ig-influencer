#!/usr/bin/env node
/**
 * DM Audit Script - Check for duplicate messages
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

async function audit() {
  // Get all messages since the commit (2026-01-04 17:21)
  const sinceDate = '2026-01-04T16:21:00.000Z';
  
  console.log('=== DM AUDIT SINCE LAST COMMIT (2026-01-04 17:21) ===\n');
  
  // Get contacts with recent activity
  const { data: contacts, error: contactsError } = await supabase
    .from('elena_dm_contacts')
    .select('id, ig_username')
    .gte('last_contact_at', sinceDate)
    .order('last_contact_at', { ascending: false });
  
  if (contactsError) {
    console.error('Error fetching contacts:', contactsError);
    return;
  }
  
  console.log(`Found ${contacts?.length || 0} contacts with activity since commit\n`);
  
  let totalDuplicates = 0;
  
  for (const contact of contacts || []) {
    // Get messages for this contact since commit
    const { data: messages, error: msgError } = await supabase
      .from('elena_dm_messages')
      .select('*')
      .eq('contact_id', contact.id)
      .gte('created_at', sinceDate)
      .order('created_at', { ascending: true });
    
    if (msgError || !messages?.length) continue;
    
    console.log(`--- @${contact.ig_username || contact.id} (${messages.length} messages) ---\n`);
    
    // Check for duplicates
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const direction = msg.direction === 'incoming' ? '← IN ' : '→ OUT';
      const time = new Date(msg.created_at).toLocaleTimeString('fr-FR');
      
      // Check if this is a duplicate of the previous message
      let isDuplicate = false;
      if (i > 0) {
        const prevMsg = messages[i - 1];
        const timeDiff = new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime();
        if (timeDiff < 60000 && msg.content === prevMsg.content && msg.direction === prevMsg.direction) {
          isDuplicate = true;
          totalDuplicates++;
        }
      }
      
      const duplicateFlag = isDuplicate ? ' ⚠️ DUPLICATE' : '';
      const content = msg.content.substring(0, 80) + (msg.content.length > 80 ? '...' : '');
      console.log(`[${time}] ${direction}: ${content}${duplicateFlag}`);
    }
    console.log('');
  }
  
  console.log('=== SUMMARY ===');
  console.log(`Total duplicates found: ${totalDuplicates}`);
}

audit().catch(console.error);

