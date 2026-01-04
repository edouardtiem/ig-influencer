#!/usr/bin/env node
/**
 * DM Deep Audit - Find true duplicate outgoing messages
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deepAudit() {
  console.log('=== DEEP DUPLICATE AUDIT (since 2026-01-04) ===\n');
  
  const sinceDate = '2026-01-04T00:00:00.000Z';
  
  // Get all contacts with recent activity
  const { data: contacts } = await supabase
    .from('elena_dm_contacts')
    .select('id, ig_username')
    .gte('last_contact_at', sinceDate);
  
  console.log('Contacts analyzed:', contacts?.length || 0);
  
  let issuesFound = 0;
  const issues = [];
  
  for (const contact of contacts || []) {
    const { data: messages } = await supabase
      .from('elena_dm_messages')
      .select('*')
      .eq('contact_id', contact.id)
      .gte('created_at', sinceDate)
      .order('created_at', { ascending: true });
    
    if (!messages?.length) continue;
    
    // Look for TRUE duplicates: same OUT content sent twice (not just double response)
    for (let i = 1; i < messages.length; i++) {
      const prev = messages[i - 1];
      const curr = messages[i];
      
      // TRUE DUPLICATE: Same outgoing message content within 5 minutes
      if (curr.direction === 'outgoing' && prev.direction === 'outgoing' && curr.content === prev.content) {
        const timeDiff = new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime();
        if (timeDiff < 300000) { // 5 minutes
          issuesFound++;
          issues.push({
            username: contact.ig_username,
            type: 'TRUE_DUPLICATE',
            content: curr.content.substring(0, 60),
            timeDiff: Math.round(timeDiff / 1000),
            time1: prev.created_at,
            time2: curr.created_at
          });
        }
      }
      
      // SUSPICIOUS: Two OUT messages with no IN between them
      if (curr.direction === 'outgoing' && prev.direction === 'outgoing') {
        const timeDiff = new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime();
        issues.push({
          username: contact.ig_username,
          type: 'DOUBLE_OUT',
          content1: prev.content.substring(0, 40),
          content2: curr.content.substring(0, 40),
          timeDiff: Math.round(timeDiff / 1000),
          time: curr.created_at
        });
      }
    }
  }
  
  // Display TRUE duplicates first
  const trueDuplicates = issues.filter(i => i.type === 'TRUE_DUPLICATE');
  console.log('\n=== TRUE DUPLICATES (same content sent twice) ===\n');
  
  if (trueDuplicates.length === 0) {
    console.log('✅ No true duplicates found!');
  } else {
    for (const issue of trueDuplicates) {
      console.log(`⚠️ @${issue.username} - "${issue.content}..." sent twice (${issue.timeDiff}s apart)`);
      console.log(`   T1: ${new Date(issue.time1).toLocaleString('fr-FR')}`);
      console.log(`   T2: ${new Date(issue.time2).toLocaleString('fr-FR')}`);
    }
  }
  
  // Display double OUTs
  const doubleOuts = issues.filter(i => i.type === 'DOUBLE_OUT');
  console.log('\n=== DOUBLE RESPONSES (2 OUT without IN between) ===\n');
  
  if (doubleOuts.length === 0) {
    console.log('✅ No double responses found!');
  } else {
    for (const issue of doubleOuts) {
      console.log(`📋 @${issue.username} (${issue.timeDiff}s apart) at ${new Date(issue.time).toLocaleString('fr-FR')}`);
      console.log(`   1: "${issue.content1}..."`);
      console.log(`   2: "${issue.content2}..."`);
    }
  }
  
  console.log('\n=== SUMMARY ===');
  console.log('True duplicates:', trueDuplicates.length);
  console.log('Double responses:', doubleOuts.length);
}

deepAudit().catch(console.error);

