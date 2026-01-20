#!/usr/bin/env node
// ===========================================
// DM QUALITY AUDIT — Deep Analysis 48h
// ===========================================
// Focus on:
// 1. Response quality & coherence issues
// 2. Memory/context problems
// 3. AI "stupidity" detection
// 4. Conversations that need reset
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

async function qualityAudit() {
  console.log('\n' + '='.repeat(80));
  console.log('🧠 DM QUALITY & COHERENCE AUDIT — Full 48h Analysis');
  console.log('='.repeat(80) + '\n');
  
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  
  // Fetch all messages with contact info
  const { data: messages, error } = await supabase
    .from('elena_dm_messages')
    .select('*, elena_dm_contacts(ig_username, stage, message_count, is_stopped, detected_language, created_at)')
    .gte('created_at', fortyEightHoursAgo.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  // Group by contact
  const conversations = {};
  messages.forEach(msg => {
    const contactId = msg.contact_id;
    if (!conversations[contactId]) {
      conversations[contactId] = {
        username: msg.elena_dm_contacts?.ig_username || 'unknown',
        stage: msg.elena_dm_contacts?.stage,
        isStopped: msg.elena_dm_contacts?.is_stopped,
        language: msg.elena_dm_contacts?.detected_language,
        messages: [],
        issues: [],
      };
    }
    conversations[contactId].messages.push(msg);
  });

  console.log(`📊 Analyzing ${Object.keys(conversations).length} conversations...\n`);

  // ===========================================
  // ISSUE DETECTION
  // ===========================================
  
  const allIssues = {
    repeatedQuestions: [],       // Elena asks same question multiple times
    ignoredAnswers: [],          // User answers, Elena ignores and asks again
    genericFallbacks: [],        // "hey 🖤" or very short responses
    languageMismatch: [],        // Wrong language response
    contextLoss: [],             // Elena forgot something user said
    irrelevantResponse: [],      // Response doesn't match user's message
    exitMessageLoop: [],         // Exit messages sent multiple times
    fanvueSpam: [],              // Fanvue link sent too many times
    noEngagement: [],            // Elena doesn't ask questions or engage
  };

  for (const [contactId, conv] of Object.entries(conversations)) {
    const msgs = conv.messages;
    const outgoing = msgs.filter(m => m.direction === 'outgoing');
    const incoming = msgs.filter(m => m.direction === 'incoming');
    
    // ===========================================
    // CHECK 1: Repeated Questions
    // ===========================================
    const questionPatterns = [
      /tu (fais|fait|vis|habite|viens|es|a)/i,
      /what do you do/i,
      /where are you/i,
      /how old/i,
      /t'as quel/i,
      /quel âge/i,
      /tu viens d'où/i,
      /d'où tu viens/i,
      /c'est quoi ton/i,
      /what's your/i,
    ];
    
    const askedQuestions = {};
    outgoing.forEach(m => {
      questionPatterns.forEach((pattern, idx) => {
        if (pattern.test(m.content)) {
          askedQuestions[idx] = askedQuestions[idx] || [];
          askedQuestions[idx].push({
            time: m.created_at,
            content: m.content,
          });
        }
      });
    });
    
    for (const [patternIdx, occurrences] of Object.entries(askedQuestions)) {
      if (occurrences.length > 1) {
        allIssues.repeatedQuestions.push({
          username: conv.username,
          pattern: questionPatterns[patternIdx].toString(),
          count: occurrences.length,
          examples: occurrences.slice(0, 3).map(o => o.content.substring(0, 60)),
        });
      }
    }

    // ===========================================
    // CHECK 2: User answers, Elena ignores (Memory issue)
    // ===========================================
    // Pattern: User provides info → Elena asks same question later
    const userAnswers = {};
    const infoPatterns = [
      { key: 'age', pattern: /\b(\d{2})\s*(ans?|years?|yo)\b/i },
      { key: 'location', pattern: /\b(paris|lyon|london|usa|france|uk|canada|australia|spain|italy|germany|portugal|morocco|algeria|belgium)\b/i },
      { key: 'job', pattern: /\b(work|travail|boulot|job|developer|engineer|student|étudiant|entrepreneur|businessman|doctor|nurse|teacher|lawyer)\b/i },
    ];
    
    incoming.forEach(m => {
      infoPatterns.forEach(({ key, pattern }) => {
        const match = m.content?.match(pattern);
        if (match) {
          userAnswers[key] = {
            value: match[0],
            time: m.created_at,
            message: m.content,
          };
        }
      });
    });
    
    // Check if Elena asked about something user already answered
    outgoing.forEach(m => {
      if (userAnswers.age && m.created_at > userAnswers.age.time) {
        if (/quel âge|how old|t'as quel âge/i.test(m.content)) {
          allIssues.ignoredAnswers.push({
            username: conv.username,
            info: 'age',
            userSaid: userAnswers.age.message.substring(0, 40),
            elenaAsked: m.content.substring(0, 40),
          });
        }
      }
      if (userAnswers.location && m.created_at > userAnswers.location.time) {
        if (/tu viens d'où|where.*from|d'où tu viens|tu habites/i.test(m.content)) {
          allIssues.ignoredAnswers.push({
            username: conv.username,
            info: 'location',
            userSaid: userAnswers.location.message.substring(0, 40),
            elenaAsked: m.content.substring(0, 40),
          });
        }
      }
      if (userAnswers.job && m.created_at > userAnswers.job.time) {
        if (/tu fais quoi|what do you do|c'est quoi ton travail/i.test(m.content)) {
          allIssues.ignoredAnswers.push({
            username: conv.username,
            info: 'job',
            userSaid: userAnswers.job.message.substring(0, 40),
            elenaAsked: m.content.substring(0, 40),
          });
        }
      }
    });

    // ===========================================
    // CHECK 3: Generic fallbacks
    // ===========================================
    const genericPatterns = [
      /^hey\s*🖤?\s*$/i,
      /^salut\s*🖤?\s*$/i,
      /^coucou\s*🖤?\s*$/i,
      /^hi\s*🖤?\s*$/i,
      /^🖤\s*$/,
    ];
    
    outgoing.forEach(m => {
      genericPatterns.forEach(pattern => {
        if (pattern.test(m.content?.trim())) {
          allIssues.genericFallbacks.push({
            username: conv.username,
            response: m.content,
            time: new Date(m.created_at).toLocaleString('fr-FR'),
          });
        }
      });
    });

    // ===========================================
    // CHECK 4: Language mismatch
    // ===========================================
    for (let i = 0; i < msgs.length - 1; i++) {
      if (msgs[i].direction === 'incoming' && msgs[i + 1].direction === 'outgoing') {
        const userMsg = msgs[i].content || '';
        const elenaMsg = msgs[i + 1].content || '';
        
        // Detect French in user message
        const userFrench = /\b(je|tu|il|nous|vous|ils|suis|est|sont|avoir|être|faire|ça|c'est|merci|bonjour|salut|oui|non|bien|très|pas|plus|peut|veux|aime)\b/i.test(userMsg);
        // Detect English in Elena's response (when user speaks French)
        const elenaEnglish = /\b(I'm|I am|you're|you are|what's|how are|let me|do you|are you|that's|would you|could you|should|about you)\b/i.test(elenaMsg);
        
        if (userFrench && elenaEnglish && !userMsg.match(/\b(hi|hello|hey)\b/i)) {
          allIssues.languageMismatch.push({
            username: conv.username,
            userMsg: userMsg.substring(0, 50),
            elenaMsg: elenaMsg.substring(0, 50),
          });
        }
      }
    }

    // ===========================================
    // CHECK 5: Exit message loop
    // ===========================================
    const exitPatterns = [
      /je dois filer/i,
      /shooting dans/i,
      /mon manager/i,
      /je file/i,
      /je dois y aller/i,
      /plus le temps/i,
    ];
    
    const exitMsgs = outgoing.filter(m => 
      exitPatterns.some(p => p.test(m.content))
    );
    
    if (exitMsgs.length > 1) {
      allIssues.exitMessageLoop.push({
        username: conv.username,
        count: exitMsgs.length,
        messages: exitMsgs.map(m => m.content.substring(0, 50)),
      });
    }

    // ===========================================
    // CHECK 6: Fanvue spam
    // ===========================================
    const fanvueMsgs = outgoing.filter(m => /fanvue\.com/i.test(m.content));
    if (fanvueMsgs.length > 3) {
      allIssues.fanvueSpam.push({
        username: conv.username,
        count: fanvueMsgs.length,
        stage: conv.stage,
      });
    }

    // ===========================================
    // CHECK 7: No engagement (Elena doesn't ask questions)
    // ===========================================
    const elenaQuestions = outgoing.filter(m => m.content?.includes('?'));
    if (outgoing.length > 5 && elenaQuestions.length === 0) {
      allIssues.noEngagement.push({
        username: conv.username,
        totalResponses: outgoing.length,
        questionsAsked: 0,
      });
    }
  }

  // ===========================================
  // DISPLAY RESULTS
  // ===========================================
  
  console.log('─'.repeat(80));
  console.log('🚨 ISSUES FOUND');
  console.log('─'.repeat(80));

  const issueTypes = [
    { key: 'repeatedQuestions', label: '🔁 REPEATED QUESTIONS (Elena asks same thing multiple times)', critical: true },
    { key: 'ignoredAnswers', label: '🧠 MEMORY LOSS (User answered, Elena asks again)', critical: true },
    { key: 'genericFallbacks', label: '📝 GENERIC FALLBACKS (hey 🖤 only)', critical: false },
    { key: 'languageMismatch', label: '🌍 LANGUAGE MISMATCH (wrong language response)', critical: true },
    { key: 'exitMessageLoop', label: '🚪 EXIT MESSAGE LOOP (sent multiple times)', critical: true },
    { key: 'fanvueSpam', label: '🔗 FANVUE SPAM (link sent >3 times)', critical: false },
    { key: 'noEngagement', label: '💬 NO ENGAGEMENT (Elena never asks questions)', critical: false },
  ];

  let criticalCount = 0;
  let totalIssues = 0;

  for (const { key, label, critical } of issueTypes) {
    const issues = allIssues[key];
    if (issues.length > 0) {
      totalIssues += issues.length;
      if (critical) criticalCount += issues.length;
      
      console.log(`\n${critical ? '🔴' : '🟠'} ${label}: ${issues.length}`);
      console.log('─'.repeat(60));
      
      issues.slice(0, 8).forEach((issue, i) => {
        console.log(`   ${i + 1}. @${issue.username}`);
        
        if (key === 'repeatedQuestions') {
          console.log(`      Asked ${issue.count}x: ${issue.examples[0]}...`);
        } else if (key === 'ignoredAnswers') {
          console.log(`      User said: "${issue.userSaid}..."`);
          console.log(`      Elena asked: "${issue.elenaAsked}..."`);
        } else if (key === 'genericFallbacks') {
          console.log(`      Response: "${issue.response}" at ${issue.time}`);
        } else if (key === 'languageMismatch') {
          console.log(`      User (FR): "${issue.userMsg}..."`);
          console.log(`      Elena (EN): "${issue.elenaMsg}..."`);
        } else if (key === 'exitMessageLoop') {
          console.log(`      Exit msg sent ${issue.count}x`);
        } else if (key === 'fanvueSpam') {
          console.log(`      Fanvue link sent ${issue.count}x (stage: ${issue.stage})`);
        } else if (key === 'noEngagement') {
          console.log(`      ${issue.totalResponses} responses, 0 questions asked`);
        }
      });
      
      if (issues.length > 8) {
        console.log(`   ... and ${issues.length - 8} more`);
      }
    }
  }

  // ===========================================
  // SAMPLE PROBLEMATIC CONVERSATIONS
  // ===========================================
  
  console.log('\n' + '─'.repeat(80));
  console.log('📋 SAMPLE PROBLEMATIC CONVERSATIONS (Full transcripts)');
  console.log('─'.repeat(80));

  // Find conversations with most issues
  const convIssueCount = {};
  for (const [key, issues] of Object.entries(allIssues)) {
    issues.forEach(i => {
      convIssueCount[i.username] = (convIssueCount[i.username] || 0) + 1;
    });
  }
  
  const worstConversations = Object.entries(convIssueCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  for (const [username, issueCount] of worstConversations) {
    const conv = Object.values(conversations).find(c => c.username === username);
    if (!conv) continue;
    
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`👤 @${username} — ${issueCount} issues | Stage: ${conv.stage} | ${conv.isStopped ? '🛑 STOPPED' : '🟢 Active'}`);
    console.log(`${'═'.repeat(70)}`);
    
    // Show last 20 messages
    conv.messages.slice(-20).forEach(m => {
      const time = new Date(m.created_at).toLocaleTimeString('fr-FR');
      const dir = m.direction === 'incoming' ? '📥 USER' : '📤 ELENA';
      const content = m.content?.substring(0, 80) || '[empty]';
      console.log(`[${time}] ${dir}: "${content}${m.content?.length > 80 ? '...' : ''}"`);
    });
  }

  // ===========================================
  // CONTACTS TO RESET
  // ===========================================
  
  console.log('\n' + '─'.repeat(80));
  console.log('🔄 CONTACTS RECOMMENDED FOR FUNNEL RESET');
  console.log('─'.repeat(80));
  
  const contactsToReset = Object.entries(conversations)
    .filter(([id, conv]) => {
      const hasIssues = convIssueCount[conv.username] >= 2;
      const notConverted = !['converted', 'paid'].includes(conv.stage);
      const notStopped = !conv.isStopped;
      const hasMsgs = conv.messages.length >= 5;
      return hasIssues && notConverted && notStopped && hasMsgs;
    })
    .map(([id, conv]) => ({
      id,
      username: conv.username,
      stage: conv.stage,
      msgCount: conv.messages.length,
      issueCount: convIssueCount[conv.username] || 0,
    }));

  if (contactsToReset.length === 0) {
    console.log('\n✅ No contacts require immediate reset\n');
  } else {
    console.log(`\n⚠️ ${contactsToReset.length} contacts would benefit from a funnel reset:\n`);
    console.log('   Username          | Stage    | Msgs | Issues');
    console.log('   ' + '─'.repeat(50));
    contactsToReset.slice(0, 20).forEach(c => {
      console.log(`   @${c.username.padEnd(16)} | ${c.stage.padEnd(8)} | ${String(c.msgCount).padStart(4)} | ${c.issueCount}`);
    });
    
    if (contactsToReset.length > 20) {
      console.log(`   ... and ${contactsToReset.length - 20} more`);
    }
  }

  // ===========================================
  // SUMMARY
  // ===========================================
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 AUDIT SUMMARY');
  console.log('='.repeat(80));
  
  console.log(`
   📬 Total messages analyzed: ${messages.length}
   👥 Conversations analyzed: ${Object.keys(conversations).length}
   
   🚨 Total issues found: ${totalIssues}
   🔴 Critical issues: ${criticalCount}
   🟠 Minor issues: ${totalIssues - criticalCount}
   
   📋 Breakdown:
   - Repeated questions: ${allIssues.repeatedQuestions.length}
   - Memory loss (ignored answers): ${allIssues.ignoredAnswers.length}
   - Generic fallbacks: ${allIssues.genericFallbacks.length}
   - Language mismatches: ${allIssues.languageMismatch.length}
   - Exit message loops: ${allIssues.exitMessageLoop.length}
   - Fanvue spam: ${allIssues.fanvueSpam.length}
   - No engagement: ${allIssues.noEngagement.length}
   
   🔄 Contacts to reset: ${contactsToReset.length}
`);

  console.log('='.repeat(80) + '\n');
  
  // Return data for further processing
  return {
    conversations,
    allIssues,
    contactsToReset,
    totalIssues,
    criticalCount,
  };
}

qualityAudit().catch(console.error);
