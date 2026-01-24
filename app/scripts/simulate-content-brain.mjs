#!/usr/bin/env node
/**
 * Simulate Content Brain V3 — Full flow without posting
 * 
 * Runs the entire Content Brain pipeline:
 * 1. Fetches all intelligence layers (Analytics, History, Context, Trending, etc.)
 * 2. Asks Claude (Extended Thinking) to decide content
 * 3. Generates images via Nano Banana Pro
 * 4. Shows results without posting to Instagram
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// Import layers
import { analyzePerformance, formatAnalyticsForPrompt } from './lib/analytics-layer.mjs';
import { fetchHistory, formatHistoryForPrompt, suggestNarrativeArc } from './lib/history-layer.mjs';
import { fetchContext, formatContextForPrompt } from './lib/context-layer.mjs';
import { fetchMemories, formatMemoriesForPrompt } from './lib/memories-layer.mjs';
import { fetchRelationship, formatRelationshipForPrompt } from './lib/relationship-layer.mjs';
import { fetchTrendingExperiment, fetchTrendingSafe, formatTrendingForPrompt } from './lib/trending-layer.mjs';
import { formatBlocklistForPrompt, sanitizePrompt, checkForBlockedTerms } from './lib/nano-banana-blocklist.mjs';

// Import image generation
import { generateImagesForPost } from './scheduled-post.mjs';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || process.env.Claude_key });

// Character Sheet
const CHARACTER_SHEET = `## Elena Visconti (@elenav.paris)
- 24 ans, Mannequin & Influenceuse Mode
- Paris 8e (Haussmann luxe), origine Milan
- Style: Sophistiquée jet-set, street-luxe Paris, luxe discret
- Activités: Shootings mode, voyages luxe, spa, Fashion Week, gastronomie
- Personnalité: Warm & accessible (pas mannequin froide), confiante, secretly punk rock
- Corps: Silhouette féminine, très généreuse poitrine naturelle
- IMPORTANT: Elena voyage beaucoup (Milan, yachts, spas montagne, Fashion Weeks)`;

async function simulateContentBrain() {
  console.log('\n' + '═'.repeat(70));
  console.log('   🧠 CONTENT BRAIN V3 "FREEDOM MODE" — SIMULATION COMPLÈTE');
  console.log('═'.repeat(70));
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log('   Mode: Simulation (génère images, ne poste PAS)');
  console.log('═'.repeat(70));

  const character = 'elena';
  const today = new Date();
  const dayName = today.toLocaleDateString('fr-FR', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  // ═══════════════════════════════════════════════════════════════
  // STEP 1: Gather all intelligence layers
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📊 STEP 1: Gathering intelligence layers...\n');

  const [analytics, history] = await Promise.all([
    analyzePerformance(supabase, character),
    fetchHistory(supabase, character),
  ]);

  const [context, memories, relationship] = await Promise.all([
    fetchContext(history?.narrative?.currentLocation || 'paris'),
    fetchMemories(supabase, character),
    fetchRelationship(supabase, character),
  ]);

  // Trending content from Perplexity
  console.log('🔥 Fetching trending content (Perplexity)...');
  const recentLocations = history?.avoidList || [];
  const [trendingExperiment, trendingSafe] = await Promise.all([
    fetchTrendingExperiment(recentLocations),
    fetchTrendingSafe(recentLocations),
  ]);

  console.log(`   🧪 EXPERIMENT: ${trendingExperiment?.location?.name || 'fallback'}`);
  console.log(`   ✅ SAFE: ${trendingSafe?.location?.name || 'fallback'}`);

  // Narrative arc
  const narrativeArc = suggestNarrativeArc(history?.narrative, context);
  console.log(`\n📚 Narrative Arc: "${narrativeArc.name}"`);
  console.log(`   Story: ${narrativeArc.story}`);

  // ═══════════════════════════════════════════════════════════════
  // STEP 2: Build FREEDOM prompt for Claude
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📝 STEP 2: Building FREEDOM prompt...\n');

  const prompt = `Tu es le Content Brain d'Elena Visconti.
Tu as LIBERTÉ TOTALE pour créer du contenu. Utilise ton Extended Thinking pour raisonner en profondeur.

═══════════════════════════════════════════════════════════════
## 📊 DONNÉES DYNAMIQUES — Analyse et décide
═══════════════════════════════════════════════════════════════

### 1️⃣ ANALYTICS — Ce qui performe
${formatAnalyticsForPrompt(analytics)}

### 2️⃣ HISTORIQUE — Posts récents (NE PAS répéter)
${formatHistoryForPrompt(history, narrativeArc)}

### 3️⃣ CONTEXTE TEMPS RÉEL (Perplexity)
Date: ${dayName} ${dateStr}
${formatContextForPrompt(context)}

### 4️⃣ TRENDING (Perplexity) — Inspiration
${formatTrendingForPrompt(trendingExperiment, trendingSafe)}

### 5️⃣ SOUVENIRS & RELATIONSHIP
${formatMemoriesForPrompt(memories, character)}
${formatRelationshipForPrompt(relationship, character)}

═══════════════════════════════════════════════════════════════
## 🎭 PERSONNAGE
═══════════════════════════════════════════════════════════════

${CHARACTER_SHEET}

### Style Elena — Jet-Set Luxe
- Paris 8e: loft Haussmann, rooftops, hôtels luxe, bars à cocktails
- Voyage: yacht, plages privées, villas, spas alpins, Fashion Weeks
- Tenues: bikinis, bodysuits, slip dresses, loungewear soie, mini dresses
- Vibe: Sexy mais élégant, confident, mysterious, micro-story captions

═══════════════════════════════════════════════════════════════
${formatBlocklistForPrompt()}

═══════════════════════════════════════════════════════════════
## 🎨 TA LIBERTÉ CRÉATIVE
═══════════════════════════════════════════════════════════════

Tu as LIBERTÉ TOTALE sur:
- **LOCATIONS** — Invente le lieu parfait (cohérent avec le personnage)
- **OUTFITS** — Crée la tenue idéale (sexy mais avec vocabulaire safe)
- **POSES** — Décide la pose (évite la blocklist ci-dessus)
- **CAPTIONS** — Micro-story format, English, mysterious

### Ta seule contrainte: ÉVITER LES MOTS INTERDITS ci-dessus
→ Si tu veux dire "sensual", dis "elegant" ou "sophisticated"
→ Si tu veux "lying on bed", dis "sitting on bed edge"
→ Si bikini, utilise expression NEUTRE (warm smile, confident)

═══════════════════════════════════════════════════════════════
## 🎯 MISSION
═══════════════════════════════════════════════════════════════

Génère UN SEUL post CAROUSEL pour MAINTENANT.
C'est une simulation — sois créatif et SEXY AU MAX (dans les limites safe).

### Raisonne avec Extended Thinking:
1. Analyse les analytics → qu'est-ce qui performe?
2. Check l'historique → ne pas répéter les locations récentes
3. Intègre le trending → ce qui buzz maintenant
4. Respecte le personnage → cohérence avec son lifestyle
5. **VÉRIFIE que ton prompt n'a AUCUN mot interdit**

### Pour le post:
- **location_key**: ID unique (invente-le)
- **location_name**: Description du lieu
- **outfit**: Tenue détaillée (SAFE vocabulary) — SEXY AU MAX
- **action**: Ce qu'elle fait + pose (SAFE vocabulary) — SEXY AU MAX
- **mood**: confident | dreamy | cozy | playful | elegant | sophisticated
- **caption**: MICRO-STORY en anglais (hook → story → reflection → soft CTA)
- **has_private_cta**: true (c'est du contenu sexy)
- **prompt_hints**: Description COMPLÈTE pour l'IA image (SAFE vocabulary!)
- **hashtags**: 12-15 hashtags pertinents
- **reasoning**: Pourquoi ce choix (cite les données)

═══════════════════════════════════════════════════════════════
## ✍️ CAPTION FORMAT
═══════════════════════════════════════════════════════════════

Structure:
1. **[HOOK]** — 1 ligne atmosphérique (heure, lieu, sensation)
2. **[MICRO-STORY]** — 2-4 lignes, UN moment précis avec tension/mystère
3. **[REFLECTION]** — 1-2 lignes, sa pensée, tease cryptique
4. **[SOFT CTA]** — "The rest is on my private. 🖤"

Voice: Mysterious, confident, in control. Never reveals everything.

═══════════════════════════════════════════════════════════════

Réponds UNIQUEMENT avec du JSON valide:
{
  "reasoning_summary": "Résumé des décisions (1-2 phrases)",
  "post": {
    "location_key": "...",
    "location_name": "...",
    "mood": "...",
    "outfit": "... (SAFE vocabulary, SEXY)",
    "action": "... (SAFE vocabulary, NO blocked poses)",
    "caption": "MICRO-STORY avec \\n\\n entre paragraphes",
    "has_private_cta": true,
    "hashtags": ["#..."],
    "prompt_hints": "... (SAFE vocabulary for AI image generation, DETAILED)",
    "reasoning": "Why this post based on data..."
  }
}`;

  // ═══════════════════════════════════════════════════════════════
  // STEP 3: Ask Claude with Extended Thinking
  // ═══════════════════════════════════════════════════════════════
  console.log('🤖 STEP 3: Asking Claude (Extended Thinking)...\n');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    thinking: {
      type: 'enabled',
      budget_tokens: 10000,
    },
    messages: [{ role: 'user', content: prompt }],
  });

  const thinkingBlock = response.content.find(c => c.type === 'thinking');
  const textContent = response.content.find(c => c.type === 'text');

  if (thinkingBlock) {
    console.log('💭 Claude thinking (preview):');
    console.log(`   "${thinkingBlock.thinking.substring(0, 300)}..."\n`);
  }

  // Parse JSON
  let jsonStr = textContent.text;
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1];
  } else {
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];
  }

  const plan = JSON.parse(jsonStr.trim());

  console.log('═'.repeat(70));
  console.log('📋 CLAUDE\'S DECISION');
  console.log('═'.repeat(70));
  console.log(`\n🎯 Reasoning: ${plan.reasoning_summary}`);
  console.log(`\n📍 Location: ${plan.post.location_name}`);
  console.log(`👗 Outfit: ${plan.post.outfit}`);
  console.log(`🎭 Mood: ${plan.post.mood}`);
  console.log(`📸 Action: ${plan.post.action}`);
  console.log(`\n📝 Caption:\n${plan.post.caption}`);
  console.log(`\n🔑 Prompt hints: ${plan.post.prompt_hints?.substring(0, 150)}...`);
  console.log('═'.repeat(70));

  // ═══════════════════════════════════════════════════════════════
  // STEP 4: Generate images
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🎨 STEP 4: Generating 3 carousel images...\n');

  const postParams = {
    character: 'elena',
    type: 'carousel',
    location_name: plan.post.location_name,
    outfit: plan.post.outfit,
    action: plan.post.action,
    prompt_hints: plan.post.prompt_hints,
    mood: plan.post.mood,
  };

  try {
    const images = await generateImagesForPost(postParams);

    console.log('\n' + '═'.repeat(70));
    console.log('✅ SIMULATION COMPLETE — Images générées:');
    console.log('═'.repeat(70));
    images.forEach((url, i) => {
      console.log(`\n📷 Image ${i + 1}: ${url}`);
    });

    console.log('\n📝 Caption à utiliser:');
    console.log('─'.repeat(50));
    console.log(plan.post.caption);
    console.log('─'.repeat(50));

    console.log('\n#️⃣ Hashtags:');
    console.log(plan.post.hashtags?.join(' '));

    console.log('\n' + '═'.repeat(70));
    console.log('🚫 MODE SIMULATION — Rien n\'a été posté sur Instagram');
    console.log('═'.repeat(70) + '\n');

    return { images, plan };
  } catch (error) {
    console.error(`\n❌ Image generation failed: ${error.message}`);
    throw error;
  }
}

// Run
simulateContentBrain().catch(console.error);
