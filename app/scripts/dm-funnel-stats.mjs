#!/usr/bin/env node
// ===========================================
// DM FUNNEL STATS — Conversations & Conversions
// ===========================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function getFunnelStats() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 DM FUNNEL STATS — Elena');
  console.log('='.repeat(60) + '\n');

  // ===========================================
  // 1. TOTAL CONTACTS BY STAGE
  // ===========================================
  
  const { data: contacts, error } = await supabase
    .from('elena_dm_contacts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  const stages = {
    cold: contacts.filter(c => c.stage === 'cold'),
    warm: contacts.filter(c => c.stage === 'warm'),
    hot: contacts.filter(c => c.stage === 'hot'),
    pitched: contacts.filter(c => c.stage === 'pitched'),
    converted: contacts.filter(c => c.stage === 'converted'),
    paid: contacts.filter(c => c.stage === 'paid'),
  };

  console.log('📈 CONTACTS PAR STAGE');
  console.log('─'.repeat(40));
  console.log(`   COLD:      ${stages.cold.length} (messages 1-3)`);
  console.log(`   WARM:      ${stages.warm.length} (messages 4-7)`);
  console.log(`   HOT:       ${stages.hot.length} (messages 8+)`);
  console.log(`   PITCHED:   ${stages.pitched.length} (Fanvue link envoyé)`);
  console.log(`   CONVERTED: ${stages.converted.length} (compte Fanvue créé)`);
  console.log(`   PAID:      ${stages.paid.length} (abonné payant)`);
  console.log(`   ─────────────────────────`);
  console.log(`   TOTAL:     ${contacts.length} contacts`);
  console.log();

  // ===========================================
  // 2. CONVERSION RATES
  // ===========================================
  
  console.log('📊 TAUX DE CONVERSION');
  console.log('─'.repeat(40));
  
  const totalContacts = contacts.length;
  const pitchedOrBetter = stages.pitched.length + stages.converted.length + stages.paid.length;
  const convertedOrBetter = stages.converted.length + stages.paid.length;
  const paid = stages.paid.length;
  
  // Cold → Pitched (a reçu le lien Fanvue)
  const coldToPitched = totalContacts > 0 ? ((pitchedOrBetter / totalContacts) * 100).toFixed(1) : 0;
  console.log(`   Cold → Pitched:    ${coldToPitched}% (${pitchedOrBetter}/${totalContacts})`);
  
  // Pitched → Converted (a créé un compte)
  const pitchedToConverted = pitchedOrBetter > 0 ? ((convertedOrBetter / pitchedOrBetter) * 100).toFixed(1) : 0;
  console.log(`   Pitched → Converted: ${pitchedToConverted}% (${convertedOrBetter}/${pitchedOrBetter})`);
  
  // Converted → Paid (a payé)
  const convertedToPaid = convertedOrBetter > 0 ? ((paid / convertedOrBetter) * 100).toFixed(1) : 0;
  console.log(`   Converted → Paid:  ${convertedToPaid}% (${paid}/${convertedOrBetter})`);
  
  // Overall
  const overallConversion = totalContacts > 0 ? ((paid / totalContacts) * 100).toFixed(2) : 0;
  console.log(`   ─────────────────────────`);
  console.log(`   Overall (Cold → Paid): ${overallConversion}% (${paid}/${totalContacts})`);
  console.log();

  // ===========================================
  // 3. COHORT ANALYSIS (by week)
  // ===========================================
  
  console.log('📅 ANALYSE PAR COHORT (par semaine)');
  console.log('─'.repeat(40));
  
  const cohorts = {};
  contacts.forEach(c => {
    const date = new Date(c.created_at);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!cohorts[weekKey]) {
      cohorts[weekKey] = {
        total: 0,
        cold: 0,
        warm: 0,
        hot: 0,
        pitched: 0,
        converted: 0,
        paid: 0,
      };
    }
    cohorts[weekKey].total++;
    cohorts[weekKey][c.stage]++;
  });
  
  // Sort by date descending
  const sortedWeeks = Object.keys(cohorts).sort((a, b) => new Date(b) - new Date(a));
  
  console.log('   Week           | Total | Cold | Warm | Hot | Pitched | Conv | Paid | Conv%');
  console.log('   ' + '─'.repeat(75));
  
  sortedWeeks.forEach(week => {
    const c = cohorts[week];
    const convRate = c.total > 0 ? (((c.converted + c.paid) / c.total) * 100).toFixed(0) : 0;
    const pitchedRate = c.total > 0 ? (((c.pitched + c.converted + c.paid) / c.total) * 100).toFixed(0) : 0;
    console.log(`   ${week} | ${String(c.total).padStart(5)} | ${String(c.cold).padStart(4)} | ${String(c.warm).padStart(4)} | ${String(c.hot).padStart(3)} | ${String(c.pitched).padStart(7)} | ${String(c.converted).padStart(4)} | ${String(c.paid).padStart(4)} | ${pitchedRate}%`);
  });
  console.log();

  // ===========================================
  // 4. MESSAGE STATS
  // ===========================================
  
  const { data: messages } = await supabase
    .from('elena_dm_messages')
    .select('direction, created_at');
  
  const totalMessages = messages?.length || 0;
  const incoming = messages?.filter(m => m.direction === 'incoming').length || 0;
  const outgoing = messages?.filter(m => m.direction === 'outgoing').length || 0;
  
  console.log('💬 STATS MESSAGES');
  console.log('─'.repeat(40));
  console.log(`   Total messages:     ${totalMessages}`);
  console.log(`   Incoming (users):   ${incoming}`);
  console.log(`   Outgoing (Elena):   ${outgoing}`);
  console.log(`   Ratio Out/In:       ${incoming > 0 ? (outgoing / incoming).toFixed(2) : 'N/A'}`);
  console.log();

  // ===========================================
  // 5. AVERAGE MESSAGES PER STAGE
  // ===========================================
  
  console.log('📊 MESSAGES MOYENS PAR STAGE');
  console.log('─'.repeat(40));
  
  const avgMessages = (arr) => arr.length > 0 
    ? (arr.reduce((sum, c) => sum + (c.message_count || 0), 0) / arr.length).toFixed(1) 
    : 0;
  
  console.log(`   Cold:      ${avgMessages(stages.cold)} messages en moyenne`);
  console.log(`   Warm:      ${avgMessages(stages.warm)} messages en moyenne`);
  console.log(`   Hot:       ${avgMessages(stages.hot)} messages en moyenne`);
  console.log(`   Pitched:   ${avgMessages(stages.pitched)} messages en moyenne`);
  console.log(`   Converted: ${avgMessages(stages.converted)} messages en moyenne`);
  console.log(`   Paid:      ${avgMessages(stages.paid)} messages en moyenne`);
  console.log();

  // ===========================================
  // 6. CONTACTS WITH FANVUE LINK SENT
  // ===========================================
  
  const contactsWithFanvuePitched = contacts.filter(c => c.fanvue_pitched_at);
  
  console.log('🎯 FANVUE PITCH STATS');
  console.log('─'.repeat(40));
  console.log(`   Contacts qui ont reçu le lien: ${contactsWithFanvuePitched.length}`);
  console.log(`   Taux de pitch: ${totalContacts > 0 ? ((contactsWithFanvuePitched.length / totalContacts) * 100).toFixed(1) : 0}%`);
  console.log();

  // ===========================================
  // 7. RECENT ACTIVITY (Last 7 days)
  // ===========================================
  
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const recentContacts = contacts.filter(c => c.created_at >= sevenDaysAgo);
  const recentPitched = recentContacts.filter(c => ['pitched', 'converted', 'paid'].includes(c.stage));
  
  console.log('📅 ACTIVITÉ 7 DERNIERS JOURS');
  console.log('─'.repeat(40));
  console.log(`   Nouveaux contacts:  ${recentContacts.length}`);
  console.log(`   Nouveaux pitched:   ${recentPitched.length}`);
  console.log(`   Taux pitch (7j):    ${recentContacts.length > 0 ? ((recentPitched.length / recentContacts.length) * 100).toFixed(1) : 0}%`);
  console.log();

  // ===========================================
  // 8. STOPPED CONTACTS
  // ===========================================
  
  const stoppedContacts = contacts.filter(c => c.is_stopped);
  
  console.log('🛑 CONTACTS STOPPED (cap atteint)');
  console.log('─'.repeat(40));
  console.log(`   Total stopped: ${stoppedContacts.length}`);
  console.log(`   % du total:    ${totalContacts > 0 ? ((stoppedContacts.length / totalContacts) * 100).toFixed(1) : 0}%`);
  console.log();

  // ===========================================
  // SUMMARY
  // ===========================================
  
  console.log('='.repeat(60));
  console.log('📊 RÉSUMÉ EXÉCUTIF');
  console.log('='.repeat(60));
  console.log(`
   👥 ${totalContacts} contacts DM total
   🎯 ${pitchedOrBetter} ont reçu le lien Fanvue (${coldToPitched}%)
   💰 ${paid} abonnés payants (${overallConversion}% conversion globale)
   
   📈 Funnel:
   ${totalContacts} → ${stages.warm.length + stages.hot.length + pitchedOrBetter} engagés → ${pitchedOrBetter} pitched → ${convertedOrBetter} converted → ${paid} paid
`);
  console.log('='.repeat(60) + '\n');
}

getFunnelStats().catch(console.error);

