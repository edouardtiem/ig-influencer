#!/usr/bin/env node
/**
 * DM Audit - Find repetitive message loops at end of funnel
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

async function findLoops() {
  console.log('=== RECHERCHE DE BOUCLES EN FIN DE FUNNEL ===\n');
  
  // Get all contacts
  const { data: contacts } = await supabase
    .from('elena_dm_contacts')
    .select('*')
    .order('last_contact_at', { ascending: false });
  
  console.log('Total contacts:', contacts?.length || 0);
  
  let loopsFound = 0;
  const issues = [];
  
  for (const contact of contacts || []) {
    // Get all messages for this contact
    const { data: messages } = await supabase
      .from('elena_dm_messages')
      .select('*')
      .eq('contact_id', contact.id)
      .order('created_at', { ascending: true });
    
    if (!messages?.length) continue;
    
    // Check for repeated outgoing messages at the end
    const outgoing = messages.filter(m => m.direction === 'outgoing');
    if (outgoing.length < 3) continue;
    
    // Look at the last 5 outgoing messages
    const lastOuts = outgoing.slice(-5);
    
    // Count unique contents
    const uniqueContents = new Set(lastOuts.map(m => m.content));
    
    // If less than 2 unique messages in last 4+ → potential loop
    if (uniqueContents.size <= 2 && lastOuts.length >= 4) {
      issues.push({
        type: 'POTENTIAL_LOOP',
        username: contact.ig_username,
        stage: contact.stage,
        message_count: contact.message_count,
        is_stopped: contact.is_stopped,
        messages: lastOuts.map(m => ({
          time: m.created_at,
          content: m.content.substring(0, 60)
        }))
      });
      loopsFound++;
    }
    
    // Check for FINAL_MESSAGE sent multiple times
    const finalMessages = messages.filter(m => 
      m.direction === 'outgoing' && m.content.includes('je vois qu')
    );
    if (finalMessages.length > 1) {
      issues.push({
        type: 'FINAL_MESSAGE_DUPLICATE',
        username: contact.ig_username,
        stage: contact.stage,
        is_stopped: contact.is_stopped,
        count: finalMessages.length,
        messages: finalMessages.map(m => ({
          time: m.created_at,
          content: m.content.substring(0, 60)
        }))
      });
      loopsFound++;
    }
    
    // Check for same response sent multiple times (anywhere)
    const contentCounts = {};
    for (const msg of outgoing) {
      contentCounts[msg.content] = (contentCounts[msg.content] || 0) + 1;
    }
    
    for (const [content, count] of Object.entries(contentCounts)) {
      if (count >= 3) {
        issues.push({
          type: 'REPEATED_MESSAGE',
          username: contact.ig_username,
          stage: contact.stage,
          count: count,
          content: content.substring(0, 60)
        });
        loopsFound++;
      }
    }
  }
  
  // Display results
  console.log('\n=== ISSUES FOUND ===\n');
  
  if (issues.length === 0) {
    console.log('✅ No loops or repetitive patterns found!');
    return;
  }
  
  // Group by type
  const byType = {};
  for (const issue of issues) {
    if (!byType[issue.type]) byType[issue.type] = [];
    byType[issue.type].push(issue);
  }
  
  for (const [type, typeIssues] of Object.entries(byType)) {
    console.log(`\n--- ${type} (${typeIssues.length}) ---\n`);
    
    for (const issue of typeIssues) {
      if (type === 'POTENTIAL_LOOP') {
        console.log(`⚠️ @${issue.username}`);
        console.log(`   Stage: ${issue.stage}, Messages: ${issue.message_count}, Stopped: ${issue.is_stopped}`);
        console.log(`   Last ${issue.messages.length} outgoing:`);
        for (const m of issue.messages) {
          console.log(`     - ${m.content}...`);
        }
      } else if (type === 'FINAL_MESSAGE_DUPLICATE') {
        console.log(`🔴 @${issue.username} - FINAL_MESSAGE sent ${issue.count} times`);
        console.log(`   Stage: ${issue.stage}, Stopped: ${issue.is_stopped}`);
        for (const m of issue.messages) {
          console.log(`     - ${new Date(m.time).toLocaleString('fr-FR')}`);
        }
      } else if (type === 'REPEATED_MESSAGE') {
        console.log(`📋 @${issue.username} - "${issue.content}..." sent ${issue.count} times`);
      }
      console.log('');
    }
  }
  
  console.log('=== SUMMARY ===');
  console.log('Total issues found:', issues.length);
}

findLoops().catch(console.error);

