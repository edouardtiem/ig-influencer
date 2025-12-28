#!/usr/bin/env node
// ===========================================
// DM DEEP AUDIT — Analyse des conversations problématiques
// ===========================================

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function deepAudit() {
  console.log('\n🔬 ANALYSE APPROFONDIE DES CONVERSATIONS DM\n');
  console.log('═'.repeat(70));

  // Get all pitched contacts with their messages
  const { data: pitchedContacts } = await supabase
    .from('elena_dm_contacts')
    .select('*')
    .eq('stage', 'pitched')
    .order('message_count', { ascending: false })
    .limit(10);

  console.log('\n📊 TOP 10 CONVERSATIONS PITCHED (qui n\'ont pas converti)\n');

  for (const contact of pitchedContacts) {
    // Get messages for this contact
    const { data: messages } = await supabase
      .from('elena_dm_messages')
      .select('*')
      .eq('contact_id', contact.id)
      .order('created_at', { ascending: true });

    console.log('─'.repeat(70));
    console.log(`\n👤 @${contact.ig_username} | ${contact.message_count} msgs`);
    console.log(`   Premier contact: ${new Date(contact.first_contact_at).toLocaleDateString('fr-FR')}`);
    console.log(`   Dernier contact: ${new Date(contact.last_contact_at).toLocaleDateString('fr-FR')}`);
    
    // Find when Fanvue was mentioned
    const fanvueMsg = messages?.find(m => 
      m.direction === 'outgoing' && 
      m.content?.toLowerCase().includes('fanvue')
    );

    if (fanvueMsg) {
      const msgIndex = messages.findIndex(m => m.id === fanvueMsg.id);
      console.log(`\n   💰 PITCH FANVUE (message #${msgIndex + 1}):`);
      console.log(`   "${fanvueMsg.content}"`);

      // Show 2 messages before and 3 after
      console.log(`\n   📝 Contexte autour du pitch:`);
      const contextMsgs = messages.slice(Math.max(0, msgIndex - 2), msgIndex + 4);
      contextMsgs.forEach((m, i) => {
        const icon = m.direction === 'incoming' ? '   👤' : '   🤖';
        const isPitch = m.id === fanvueMsg.id ? ' <<<< PITCH' : '';
        console.log(`${icon} ${m.content?.substring(0, 100)}${m.content?.length > 100 ? '...' : ''}${isPitch}`);
      });
    }

    // Find if user mentioned objections after pitch
    if (fanvueMsg) {
      const afterPitch = messages?.filter(m => 
        new Date(m.created_at) > new Date(fanvueMsg.created_at) &&
        m.direction === 'incoming'
      ) || [];

      const objections = afterPitch.filter(m => {
        const content = m.content?.toLowerCase() || '';
        return content.includes('no') || 
               content.includes('non') || 
               content.includes('pas') ||
               content.includes('maybe') ||
               content.includes('peut-être') ||
               content.includes('payant') ||
               content.includes('pay') ||
               content.includes('money') ||
               content.includes('argent') ||
               content.includes('?');
      });

      if (objections.length > 0) {
        console.log(`\n   ⚠️  OBJECTIONS DÉTECTÉES après le pitch:`);
        objections.slice(0, 3).forEach(o => {
          console.log(`   - "${o.content?.substring(0, 80)}${o.content?.length > 80 ? '...' : ''}"`);
        });
      }
    }

    // Check if AI question was asked
    const aiQuestions = messages?.filter(m => 
      m.intent === 'ai_question' || 
      (m.direction === 'incoming' && 
       (m.content?.toLowerCase().includes('ai') || 
        m.content?.toLowerCase().includes('ia') || 
        m.content?.toLowerCase().includes('robot') ||
        m.content?.toLowerCase().includes('real') ||
        m.content?.toLowerCase().includes('réel')))
    ) || [];

    if (aiQuestions.length > 0) {
      console.log(`\n   🤖 QUESTIONS IA (${aiQuestions.length}):`);
      aiQuestions.slice(0, 2).forEach(q => {
        console.log(`   - "${q.content?.substring(0, 80)}"`);
      });
    }

    console.log('');
  }

  // ===========================================
  // ANALYSE DES PATTERNS D'ÉCHEC
  // ===========================================

  console.log('\n\n🔍 PATTERNS D\'ÉCHEC IDENTIFIÉS');
  console.log('═'.repeat(70));

  const { data: allPitched } = await supabase
    .from('elena_dm_contacts')
    .select('id')
    .eq('stage', 'pitched');

  const { data: allMsgs } = await supabase
    .from('elena_dm_messages')
    .select('*')
    .in('contact_id', allPitched?.map(c => c.id) || [])
    .order('created_at', { ascending: true });

  // Analyze what happens after Fanvue is mentioned
  const afterPitchResponses = {
    noResponse: 0,
    objection: 0,
    question: 0,
    continued: 0,
    total: 0
  };

  const groupedMsgs = {};
  allMsgs?.forEach(m => {
    if (!groupedMsgs[m.contact_id]) groupedMsgs[m.contact_id] = [];
    groupedMsgs[m.contact_id].push(m);
  });

  Object.values(groupedMsgs).forEach(msgs => {
    const pitchIdx = msgs.findIndex(m => 
      m.direction === 'outgoing' && 
      m.content?.toLowerCase().includes('fanvue')
    );

    if (pitchIdx >= 0) {
      afterPitchResponses.total++;
      const afterPitch = msgs.slice(pitchIdx + 1);
      const userResponses = afterPitch.filter(m => m.direction === 'incoming');
      
      if (userResponses.length === 0) {
        afterPitchResponses.noResponse++;
      } else {
        const firstResponse = userResponses[0]?.content?.toLowerCase() || '';
        if (firstResponse.includes('?')) {
          afterPitchResponses.question++;
        } else if (
          firstResponse.includes('no') || 
          firstResponse.includes('non') ||
          firstResponse.includes('pas')
        ) {
          afterPitchResponses.objection++;
        } else {
          afterPitchResponses.continued++;
        }
      }
    }
  });

  console.log(`\n📊 Réactions après le pitch Fanvue (${afterPitchResponses.total} convos):\n`);
  console.log(`   🔇 Pas de réponse: ${afterPitchResponses.noResponse} (${(afterPitchResponses.noResponse / afterPitchResponses.total * 100).toFixed(1)}%)`);
  console.log(`   ❓ Question: ${afterPitchResponses.question} (${(afterPitchResponses.question / afterPitchResponses.total * 100).toFixed(1)}%)`);
  console.log(`   ❌ Objection: ${afterPitchResponses.objection} (${(afterPitchResponses.objection / afterPitchResponses.total * 100).toFixed(1)}%)`);
  console.log(`   ✅ Conversation continue: ${afterPitchResponses.continued} (${(afterPitchResponses.continued / afterPitchResponses.total * 100).toFixed(1)}%)`);

  // ===========================================
  // ANALYSE DU TIMING DU PITCH
  // ===========================================

  console.log('\n\n⏱️  TIMING DU PITCH');
  console.log('─'.repeat(40));

  const pitchTimings = [];
  Object.values(groupedMsgs).forEach(msgs => {
    const pitchIdx = msgs.findIndex(m => 
      m.direction === 'outgoing' && 
      m.content?.toLowerCase().includes('fanvue')
    );
    if (pitchIdx >= 0) {
      const incomingBefore = msgs.slice(0, pitchIdx).filter(m => m.direction === 'incoming').length;
      pitchTimings.push(incomingBefore);
    }
  });

  if (pitchTimings.length > 0) {
    const avgTiming = pitchTimings.reduce((a, b) => a + b, 0) / pitchTimings.length;
    const tooEarly = pitchTimings.filter(t => t < 5).length;
    const optimal = pitchTimings.filter(t => t >= 5 && t <= 10).length;
    const late = pitchTimings.filter(t => t > 10).length;

    console.log(`   📈 Timing moyen du pitch: après ${avgTiming.toFixed(1)} messages user`);
    console.log(`   ⚠️  Trop tôt (<5 msgs): ${tooEarly} (${(tooEarly / pitchTimings.length * 100).toFixed(1)}%)`);
    console.log(`   ✅ Optimal (5-10 msgs): ${optimal} (${(optimal / pitchTimings.length * 100).toFixed(1)}%)`);
    console.log(`   🐢 Tard (>10 msgs): ${late} (${(late / pitchTimings.length * 100).toFixed(1)}%)`);
  }

  // ===========================================
  // EXEMPLES DE PITCHS
  // ===========================================

  console.log('\n\n📝 EXEMPLES DE PITCHS UTILISÉS');
  console.log('─'.repeat(40));

  const pitchExamples = new Set();
  allMsgs?.filter(m => 
    m.direction === 'outgoing' && 
    m.content?.toLowerCase().includes('fanvue')
  ).forEach(m => {
    pitchExamples.add(m.content);
  });

  let i = 1;
  pitchExamples.forEach(pitch => {
    if (i <= 5) {
      console.log(`\n${i}. "${pitch}"`);
      i++;
    }
  });

  console.log('\n\n═'.repeat(70));
  console.log('✅ ANALYSE TERMINÉE');
  console.log('═'.repeat(70) + '\n');
}

deepAudit().catch(console.error);

