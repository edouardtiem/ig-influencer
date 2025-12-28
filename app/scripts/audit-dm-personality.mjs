#!/usr/bin/env node
// ===========================================
// DM PERSONALITY AUDIT — Est-ce que la perso Elena marche ?
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

async function analyzePersonality() {
  console.log('\n🎭 AUDIT PERSONNALITÉ ELENA — Réactions des users\n');
  console.log('═'.repeat(70));

  // Get all messages with Elena's responses
  const { data: messages } = await supabase
    .from('elena_dm_messages')
    .select('*, elena_dm_contacts!inner(ig_username, stage, message_count)')
    .order('created_at', { ascending: true });

  if (!messages || messages.length === 0) {
    console.log('Aucun message trouvé.');
    return;
  }

  // Group by contact
  const convos = {};
  messages.forEach(m => {
    const contactId = m.contact_id;
    if (!convos[contactId]) {
      convos[contactId] = {
        username: m.elena_dm_contacts?.ig_username,
        stage: m.elena_dm_contacts?.stage,
        messages: []
      };
    }
    convos[contactId].messages.push(m);
  });

  // ===========================================
  // ANALYSE DES RÉPONSES ELENA (pushy/bratty)
  // ===========================================

  console.log('\n🔥 ANALYSE DU STYLE ELENA\n');
  console.log('─'.repeat(70));

  // Identify bratty/pushy Elena messages
  const brattyPatterns = [
    /😏/,
    /👀/,
    /💀/,
    /lol/i,
    /make me/i,
    /prove it/i,
    /and\?/i,
    /so\?/i,
    /basic/i,
    /jk/i,
    /smooth talker/i,
    /wait actually/i,
    /guilty/i,
    /💀/,
    /dying/i,
    /deceased/i,
    /i'm (?:literally )?(?:dying|dead|ascending)/i,
  ];

  const nicePatterns = [
    /that's so sweet/i,
    /i really appreciate/i,
    /thank you so much/i,
    /i'd love to/i,
    /that sounds amazing/i,
    /aww/i,
    /🥰/,
    /💕/,
  ];

  let brattyCount = 0;
  let niceCount = 0;
  let totalElenaMsg = 0;

  const elenaMessages = messages.filter(m => m.direction === 'outgoing');
  totalElenaMsg = elenaMessages.length;

  elenaMessages.forEach(m => {
    const content = m.content || '';
    if (brattyPatterns.some(p => p.test(content))) brattyCount++;
    if (nicePatterns.some(p => p.test(content))) niceCount++;
  });

  const brattyPct = ((brattyCount / totalElenaMsg) * 100).toFixed(1);
  const nicePct = ((niceCount / totalElenaMsg) * 100).toFixed(1);

  console.log(`📊 Messages Elena analysés: ${totalElenaMsg}`);
  console.log(`\n   🔥 Style bratty/pushy: ${brattyCount} msgs (${brattyPct}%)`);
  console.log(`   🥰 Style gentil/nice: ${niceCount} msgs (${nicePct}%)`);
  console.log(`\n   → Ratio bratty/nice: ${(brattyCount / (niceCount || 1)).toFixed(1)}x plus bratty`);

  // ===========================================
  // RÉACTIONS POSITIVES vs NÉGATIVES
  // ===========================================

  console.log('\n\n👥 RÉACTIONS DES USERS AU STYLE\n');
  console.log('─'.repeat(70));

  // Positive reactions
  const positivePatterns = [
    /haha/i, /lol/i, /mdr/i, /😂/, /🤣/, /😏/, /👀/,
    /j'aime/i, /i like/i, /i love/i,
    /t'es (?:drôle|marrante|fun)/i,
    /you're (?:funny|fun|cool)/i,
    /😍/, /🥰/, /❤️/, /🔥/,
    /interesting/i, /intéressant/i,
    /haha/i, /ahah/i,
    /tu me plais/i, /i like you/i,
    /cute/i, /mignon/i,
    /spicy/i, /saucy/i,
  ];

  // Negative reactions
  const negativePatterns = [
    /rude/i, /méchant/i,
    /pas gentil/i, /not nice/i,
    /wtf/i,
    /stop/i, /arrête/i,
    /bye/i, /ciao/i, /adieu/i,
    /blocked/i, /bloqué/i,
    /reported/i, /signalé/i,
    /weird/i, /bizarre/i,
    /annoying/i, /énervant/i,
    /too much/i, /trop/i,
    /calm down/i, /calme/i,
  ];

  // Confusion reactions (people not getting the vibe)
  const confusedPatterns = [
    /\?{2,}/, // Multiple question marks
    /what\?/i, /quoi\s*\?/i,
    /i don't understand/i, /je comprends pas/i,
    /huh/i,
    /que veux-tu dire/i, /what do you mean/i,
  ];

  let positiveReactions = 0;
  let negativeReactions = 0;
  let confusedReactions = 0;

  const userMessages = messages.filter(m => m.direction === 'incoming');
  
  userMessages.forEach(m => {
    const content = m.content || '';
    if (positivePatterns.some(p => p.test(content))) positiveReactions++;
    if (negativePatterns.some(p => p.test(content))) negativeReactions++;
    if (confusedPatterns.some(p => p.test(content))) confusedReactions++;
  });

  const totalUserMsg = userMessages.length;
  console.log(`📊 Messages users analysés: ${totalUserMsg}`);
  console.log(`\n   ✅ Réactions positives: ${positiveReactions} (${((positiveReactions / totalUserMsg) * 100).toFixed(1)}%)`);
  console.log(`   ❌ Réactions négatives: ${negativeReactions} (${((negativeReactions / totalUserMsg) * 100).toFixed(1)}%)`);
  console.log(`   ❓ Confusion: ${confusedReactions} (${((confusedReactions / totalUserMsg) * 100).toFixed(1)}%)`);

  // ===========================================
  // ENGAGEMENT APRÈS RÉPONSE BRATTY
  // ===========================================

  console.log('\n\n📈 ENGAGEMENT APRÈS RÉPONSES BRATTY\n');
  console.log('─'.repeat(70));

  // Find conversations where Elena was particularly bratty
  let brattyConvos = 0;
  let brattyConvosThatProgressed = 0;
  let niceConvos = 0;
  let niceConvosThatProgressed = 0;

  Object.values(convos).forEach(convo => {
    const elenaInConvo = convo.messages.filter(m => m.direction === 'outgoing');
    const brattyInConvo = elenaInConvo.filter(m => 
      brattyPatterns.some(p => p.test(m.content || ''))
    ).length;
    
    const isBrattyConvo = brattyInConvo > elenaInConvo.length * 0.3; // 30%+ bratty
    const progressed = ['warm', 'hot', 'pitched', 'converted', 'paid'].includes(convo.stage);

    if (isBrattyConvo) {
      brattyConvos++;
      if (progressed) brattyConvosThatProgressed++;
    } else {
      niceConvos++;
      if (progressed) niceConvosThatProgressed++;
    }
  });

  console.log(`🔥 Conversations bratty (30%+ msgs bratty):`);
  console.log(`   Total: ${brattyConvos}`);
  console.log(`   Progressé (warm+): ${brattyConvosThatProgressed} (${((brattyConvosThatProgressed / brattyConvos) * 100 || 0).toFixed(1)}%)`);
  
  console.log(`\n🥰 Conversations nice:`);
  console.log(`   Total: ${niceConvos}`);
  console.log(`   Progressé (warm+): ${niceConvosThatProgressed} (${((niceConvosThatProgressed / niceConvos) * 100 || 0).toFixed(1)}%)`);

  // ===========================================
  // EXEMPLES CONCRETS
  // ===========================================

  console.log('\n\n🎬 EXEMPLES CONCRETS DE RÉACTIONS\n');
  console.log('═'.repeat(70));

  // Find exchanges where Elena was bratty and user reacted
  let examples = [];

  Object.values(convos).forEach(convo => {
    for (let i = 0; i < convo.messages.length - 1; i++) {
      const elenaMsg = convo.messages[i];
      const userResponse = convo.messages[i + 1];
      
      if (elenaMsg.direction === 'outgoing' && userResponse.direction === 'incoming') {
        const isBratty = brattyPatterns.some(p => p.test(elenaMsg.content || ''));
        const isPositive = positivePatterns.some(p => p.test(userResponse.content || ''));
        const isNegative = negativePatterns.some(p => p.test(userResponse.content || ''));
        
        if (isBratty && (isPositive || isNegative)) {
          examples.push({
            username: convo.username,
            elena: elenaMsg.content,
            user: userResponse.content,
            reaction: isPositive ? '✅ POSITIF' : '❌ NÉGATIF'
          });
        }
      }
    }
  });

  // Show positive examples
  console.log('\n✅ RÉACTIONS POSITIVES AU STYLE BRATTY:\n');
  const positiveExamples = examples.filter(e => e.reaction === '✅ POSITIF').slice(0, 5);
  positiveExamples.forEach((ex, i) => {
    console.log(`${i + 1}. @${ex.username}`);
    console.log(`   🤖 Elena: "${ex.elena?.substring(0, 100)}${ex.elena?.length > 100 ? '...' : ''}"`);
    console.log(`   👤 User: "${ex.user?.substring(0, 80)}${ex.user?.length > 80 ? '...' : ''}"`);
    console.log('');
  });

  // Show negative examples
  console.log('\n❌ RÉACTIONS NÉGATIVES AU STYLE BRATTY:\n');
  const negativeExamples = examples.filter(e => e.reaction === '❌ NÉGATIF').slice(0, 5);
  if (negativeExamples.length === 0) {
    console.log('   Aucune réaction négative détectée ! 🎉');
  } else {
    negativeExamples.forEach((ex, i) => {
      console.log(`${i + 1}. @${ex.username}`);
      console.log(`   🤖 Elena: "${ex.elena?.substring(0, 100)}${ex.elena?.length > 100 ? '...' : ''}"`);
      console.log(`   👤 User: "${ex.user?.substring(0, 80)}${ex.user?.length > 80 ? '...' : ''}"`);
      console.log('');
    });
  }

  // ===========================================
  // LONGUEUR DES CONVERSATIONS
  // ===========================================

  console.log('\n📏 LONGUEUR MOYENNE DES CONVERSATIONS\n');
  console.log('─'.repeat(70));

  const convoLengths = Object.values(convos).map(c => c.messages.length);
  const avgLength = convoLengths.reduce((a, b) => a + b, 0) / convoLengths.length;
  const longConvos = convoLengths.filter(l => l > 20).length;

  console.log(`   Moyenne: ${avgLength.toFixed(1)} messages`);
  console.log(`   Conversations longues (>20 msgs): ${longConvos} (${((longConvos / convoLengths.length) * 100).toFixed(1)}%)`);
  console.log(`   → Les gens restent engagés !`);

  // ===========================================
  // VERDICT FINAL
  // ===========================================

  console.log('\n\n🏆 VERDICT FINAL\n');
  console.log('═'.repeat(70));

  const verdict = [];
  
  if (positiveReactions > negativeReactions * 3) {
    verdict.push('✅ La personnalité bratty FONCTIONNE — réactions positives >> négatives');
  } else if (positiveReactions > negativeReactions) {
    verdict.push('🟡 La personnalité bratty marche mais pourrait être ajustée');
  } else {
    verdict.push('❌ Trop de réactions négatives — à revoir');
  }

  if (avgLength > 15) {
    verdict.push('✅ Engagement fort — convos longues (avg ' + avgLength.toFixed(0) + ' msgs)');
  }

  if (brattyConvosThatProgressed / brattyConvos > 0.5) {
    verdict.push('✅ Les convos bratty progressent bien dans le funnel');
  }

  if (negativeReactions < totalUserMsg * 0.05) {
    verdict.push('✅ Très peu de réactions négatives (<5%)');
  }

  verdict.forEach(v => console.log(`\n${v}`));

  console.log('\n' + '═'.repeat(70) + '\n');
}

analyzePersonality().catch(console.error);

