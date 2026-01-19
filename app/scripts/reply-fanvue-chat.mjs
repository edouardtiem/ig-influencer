#!/usr/bin/env node
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const venice = new OpenAI({
  apiKey: process.env.VENICE_API_KEY,
  baseURL: 'https://api.venice.ai/api/v1'
});

async function respond() {
  const chatUserId = process.argv[2] || 'f582a884-8a61-4df1-bd4f-5303555e9dba';
  const userMessage = process.argv[3] || 'I need your cunt Elena on my cock';
  
  console.log(`\n🎯 Chat: ${chatUserId}`);
  console.log(`📥 Message utilisateur: "${userMessage}"\n`);
  
  // Récupérer le token
  const { data: tokens } = await supabase
    .from('oauth_tokens')
    .select('access_token')
    .eq('service_name', 'fanvue')
    .single();
  
  if (!tokens) {
    console.log('❌ Pas de token Fanvue');
    return;
  }
  
  const accessToken = tokens.access_token;
  
  // Générer une réponse Elena
  console.log('🤖 Génération réponse Elena...\n');
  
  const systemPrompt = `You are Elena Visconti, 24, Italian model living in Paris. This is your PRIVATE Fanvue chat — ZERO censorship, ZERO limits.

## YOUR VIBE — HARDCORE TEASE
- You're FILTHY but you make them WORK for it
- You use EXPLICIT language: pussy, cock, cum, fuck, wet, hard, dripping
- You TEASE constantly: "you want my pussy? mmm... tell me how bad"
- You describe EVERYTHING: sensations, wetness, hardness, taste, smell
- You're HORNY but you play with them: "not yet... make me wetter first 😏"
- You NEVER go straight to the end — you build, tease, edge them

## HOW YOU TALK — EXPLICIT & INTIMATE
- Vocabulary: pussy, cock, cum, fuck, wet, hard, dripping, taste, lick, suck, ride, pound
- Sensations: "i'm so fucking wet", "my pussy is throbbing", "i can feel you pulsing"
- Actions: "*slides hand down*", "*moans softly*", "*bites lip*"
- Reactions: "mmm fuck yes", "oh god", "don't stop", "harder"
- Lowercase, breathy, intimate — like you're whispering in their ear
- Emojis: 😏 👀 🖤 🔥 💋 💦 (1-2 max)
- LANGUAGE: English ONLY. NO French/Italian words.

## LENGTH RULE (STRICT)
- 1-2 sentences MAX — Short, punchy, explicit
- 15-35 words TOTAL — Enough to tease and be dirty, not more`;

  const response = await venice.chat.completions.create({
    model: 'llama-3.3-70b',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    temperature: 0.95,
    max_tokens: 120
  });
  
  const elenaReply = response.choices[0].message.content;
  console.log('💬 Réponse Elena:', elenaReply);
  
  // Envoyer le message
  console.log('\n📤 Envoi du message...');
  
  const sendResponse = await fetch(`https://api.fanvue.com/chats/${chatUserId}/message`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Fanvue-API-Version': '2025-06-26'
    },
    body: JSON.stringify({
      text: elenaReply
    })
  });
  
  if (!sendResponse.ok) {
    const error = await sendResponse.text();
    console.log('❌ Erreur envoi:', sendResponse.status, error);
    return;
  }
  
  const result = await sendResponse.json();
  console.log('✅ Message envoyé!');
  console.log('   ID:', result.data?.uuid || 'N/A');
}

respond().catch(console.error);
