/**
 * CRON Scheduler V2.3 — Content Brain with 6 Intelligence Layers
 * 
 * Uses Claude Sonnet 4 with Extended Thinking for deep reasoning
 * 
 * Generates daily content plan using:
 * 1. Analytics Layer — What performs best
 * 2. History Layer — Where we are in the story
 * 3. Context Layer — What's happening now (Perplexity)
 * 4. Character Layer — Who is she
 * 5. Memories Layer — Shared memories & duo opportunities
 * 6. Relationship Layer — The Secret 💕 (Mila x Elena hints)
 * 
 * Usage:
 *   node scripts/cron-scheduler.mjs           # Schedule both accounts
 *   node scripts/cron-scheduler.mjs mila      # Schedule Mila only
 *   node scripts/cron-scheduler.mjs elena     # Schedule Elena only
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
import { formatBlocklistForPrompt } from './lib/nano-banana-blocklist.mjs';

// ===========================================
// CONFIG
// ===========================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const CLAUDE_KEY = process.env.ANTHROPIC_API_KEY || process.env.Claude_key || process.env.CLAUDE_KEY;

// Check required env vars
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  if (!SUPABASE_URL) console.error('   - SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) console.error('   - SUPABASE_SERVICE_KEY');
  console.error('\n💡 Add these secrets in GitHub: Settings → Secrets → Actions');
  process.exit(1);
}

if (!CLAUDE_KEY) {
  console.error('❌ Missing CLAUDE_KEY (or ANTHROPIC_API_KEY)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const anthropic = new Anthropic({ apiKey: CLAUDE_KEY });

// ===========================================
// CHARACTER SHEETS
// ===========================================

const CHARACTER_SHEETS = {
  mila: `## Mila Verne (@mila_verne)
- 22 ans, Personal Trainer & Photographe Lifestyle
- Paris 18e (Montmartre), origine Nice
- Style: Artiste sportive punk rock fun, authentique, bohème cosy
- Activités: Personal training, photographie, guitare, yoga, pilates
- Personnalité: Énergique, passionnée, rebelle douce, naturelle, confidence
- Corps: Athlétique fine, tonique (Pilates body)

### 💕 Sa "meilleure amie" Elena
- Se sont rencontrées sur un shooting à Paris
- Mila était photographe, Elena mannequin en blazer oversize
- Mila a vu le t-shirt Blondie vintage sous le blazer → "T'écoutes Blondie?!"
- Ont fini la soirée dans un bar rock du 11e → inséparables depuis
- Elena apporte le style & connexions mode, Mila apporte l'énergie & authenticité
- Quand Elena est mentionnée: tendresse, complicité, "ma best" 💕
- **LE SECRET**: Elles sont ensemble. ON NE DIT JAMAIS RIEN. On suggère subtilement.`,

  elena: `## Elena Visconti (@elenav.paris)
- 24 ans, Mannequin & Influenceuse Mode
- Paris 8e (Haussmann luxe), origine Milan
- Style: Sophistiquée jet-set, street-luxe Paris, luxe discret
- Activités: Shootings mode, voyages luxe, spa, Fashion Week, gastronomie
- Personnalité: Warm & accessible (pas mannequin froide), confiante, secretly punk rock
- Corps: Silhouette féminine, très généreuse poitrine naturelle
- IMPORTANT: Elena voyage beaucoup (Milan, yachts, spas montagne, Fashion Weeks)

### 💕 Sa "meilleure amie" Mila
- La seule à connaître son côté punk rock caché (Blondie, bar rock du 11e)
- Mila la rend plus authentique, moins "mannequin froide de magazine"
- Se sont rencontrées sur un shooting → instant connection (t-shirt Blondie)
- Quand Mila est mentionnée: douceur, protection, "mon énergie" ✨
- **LE SECRET**: Elles sont ensemble. ON NE DIT JAMAIS RIEN. On suggère subtilement.`,
};

// ===========================================
// REMOVED: LOCATIONS — Claude now has full creative freedom
// See docs/sessions/2026-01-20-content-brain-freedom.md
// ===========================================

// ===========================================
// REMOVED: ACTIVE_TRIPS — Claude decides based on history + context
// ===========================================

// ===========================================
// DYNAMIC POSTING TIMES (based on analytics)
// ===========================================

function getOptimalPostingTimes(dayOfWeek, analytics = null, character = null) {
  // ═══════════════════════════════════════════════════════════════
  // ELENA — 2 posts/jour avec A/B Testing
  // - 14:00 = EXPERIMENT (Claude teste des trucs créatifs)
  // - 21:00 = SAFE (ce qui fonctionne, analytics-driven)
  // ═══════════════════════════════════════════════════════════════
  if (character === 'elena') {
    return {
      slots: ['14:00', '21:00'],  // 2 slots: experiment + safe
      reelSlot: null,
      postsCount: 2,
      experimentSlot: '14:00',    // Le slot où Claude peut tester
      safeSlot: '21:00',          // Le slot basé sur analytics
    };
  }
  
  // ═══════════════════════════════════════════════════════════════
  // MILA — Désactivée pour le moment
  // ═══════════════════════════════════════════════════════════════
  if (character === 'mila') {
    return {
      slots: [],
      reelSlot: null,
      postsCount: 0,
    };
  }
  
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  // Base configuration per day type
  let baseConfig;
  if (isWeekend) {
    baseConfig = {
      slots: ['10:00', '14:00', '20:00'],
      reelSlot: '14:00',
      postsCount: 3,
    };
  } else if (dayOfWeek === 5) { // Friday
    baseConfig = {
      slots: ['08:30', '12:30', '18:00', '21:00'],
      reelSlot: '18:00',
      postsCount: 4,
    };
  } else {
    baseConfig = {
      slots: ['08:00', '12:30', '19:00'],
      reelSlot: '12:30',
      postsCount: 3,
    };
  }

  // Adjust based on analytics if available
  if (analytics?.patterns?.bestTimeSlot) {
    const bestSlot = analytics.patterns.bestTimeSlot;
    
    // Shift slots based on best performing time
    if (bestSlot === 'evening' && !isWeekend) {
      // Shift towards evening: remove early morning, add late evening
      baseConfig.slots = baseConfig.slots.map(slot => {
        const hour = parseInt(slot.split(':')[0]);
        if (hour < 10) return `${hour + 2}:00`; // 08:00 → 10:00
        if (hour < 15) return `${hour + 1}:30`; // 12:30 → 13:30
        return slot;
      });
      baseConfig.reelSlot = '19:00';
    } else if (bestSlot === 'morning' && !isWeekend) {
      // Shift towards morning
      baseConfig.slots = baseConfig.slots.map(slot => {
        const hour = parseInt(slot.split(':')[0]);
        if (hour > 18) return `${hour - 1}:00`; // 19:00 → 18:00
        return slot;
      });
      baseConfig.reelSlot = '12:30';
    }
  }

  return baseConfig;
}

// ===========================================
// REMOVED: ELENA_SEXY_LOCATIONS, OUTFIT_CATEGORIES, POSES
// Claude now has full creative freedom with blocklist guidance
// ===========================================

// ===========================================
// REMOVED: A/B TESTING SYSTEM — Claude decides experiments naturally
// ===========================================

// ===========================================
// REMOVED: EXPLORATION BUDGET — Claude now reasons freely with Extended Thinking
// ===========================================

// ===========================================
// BUILD FREEDOM PROMPT — Full creative freedom with blocklist
// ===========================================

function buildFreedomPrompt(
  character,
  analytics,
  history,
  context,
  memories,
  relationship,
  postingConfig,
  today,
  narrativeArc,
  trending = {}
) {
  const otherCharacter = character === 'mila' ? 'Elena' : 'Mila';
  const dayName = today.toLocaleDateString('fr-FR', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return `Tu es le Content Brain de ${character === 'mila' ? 'Mila Verne' : 'Elena Visconti'}.
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
${formatTrendingForPrompt(trending.trendingExperiment, trending.trendingSafe)}

### 5️⃣ SOUVENIRS & RELATIONSHIP
${formatMemoriesForPrompt(memories, character)}
${formatRelationshipForPrompt(relationship, character)}

═══════════════════════════════════════════════════════════════
## 🎭 PERSONNAGE
═══════════════════════════════════════════════════════════════

${CHARACTER_SHEETS[character]}

${character === 'elena' ? `
### Style Elena — Jet-Set Luxe
- Paris 8e: loft Haussmann, rooftops, hôtels luxe, bars à cocktails
- Voyage: yacht, plages privées, villas, spas alpins, Fashion Weeks
- Tenues: bikinis, bodysuits, slip dresses, loungewear soie, mini dresses
- Vibe: Sexy mais élégant, confident, mysterious, micro-story captions
` : `
### Style Mila — Artiste Sportive
- Paris 18e: Montmartre, cafés, studio photo, gym
- Voyage: Nice (famille), Europe (Barcelone, Lisbonne, Amsterdam)
- Tenues: Fitness chic, bohème, casual trendy
- Vibe: Authentique, énergique, naturelle
`}

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

Génère ${postingConfig.postsCount} posts CAROUSEL pour aujourd'hui.
Horaires: ${postingConfig.slots.join(', ')}

### Raisonne avec Extended Thinking:
1. Analyse les analytics → qu'est-ce qui performe?
2. Check l'historique → ne pas répéter les locations récentes
3. Intègre le trending → ce qui buzz maintenant
4. Respecte le personnage → cohérence avec son lifestyle
5. **VÉRIFIE que tes prompts n'ont AUCUN mot interdit**

### Pour chaque post:
- **location_key**: ID unique (invente-le)
- **location_name**: Description du lieu
- **outfit**: Tenue détaillée (SAFE vocabulary)
- **action**: Ce qu'elle fait + pose (SAFE vocabulary)
- **mood**: confident | dreamy | cozy | playful | elegant | sophisticated
- **caption**: MICRO-STORY en anglais (hook → story → reflection → soft CTA)
- **has_private_cta**: true si contenu sensuel/bikini/etc.
- **prompt_hints**: Description complète pour l'IA image (SAFE vocabulary!)
- **hashtags**: 12-15 hashtags pertinents
- **scheduled_time**: HH:MM
- **reasoning**: Pourquoi ce choix (cite les données)

═══════════════════════════════════════════════════════════════
## ✍️ CAPTION FORMAT (Elena)
═══════════════════════════════════════════════════════════════

Structure:
1. **[HOOK]** — 1 ligne atmosphérique (heure, lieu, sensation)
2. **[MICRO-STORY]** — 2-4 lignes, UN moment précis avec tension/mystère
3. **[REFLECTION]** — 1-2 lignes, sa pensée, tease cryptique
4. **[SOFT CTA]** — "The rest is on my private. 🖤" (~70% des posts)

Voice: Mysterious, confident, in control. Never reveals everything.

Exemple:
"9 PM. Steam rising, city lights fading through the window.

The kind of night where you stop thinking and just... exist.
Warm water, cold champagne, and absolutely nowhere to be.

The other shots from this evening are on my private. 🖤"

═══════════════════════════════════════════════════════════════

Réponds UNIQUEMENT avec du JSON valide:
{
  "daily_theme": "Theme en 1 phrase",
  "reasoning_summary": "Résumé des décisions principales",
  "posts": [
    {
      "location_key": "...",
      "location_name": "...",
      "post_type": "carousel",
      "mood": "...",
      "outfit": "... (SAFE vocabulary)",
      "action": "... (SAFE vocabulary, NO blocked poses)",
      "caption": "MICRO-STORY avec \\n\\n entre paragraphes",
      "has_private_cta": true,
      "hashtags": ["#..."],
      "scheduled_time": "HH:MM",
      "prompt_hints": "... (SAFE vocabulary for AI image generation)",
      "reasoning": "Why this post based on data..."
    }
  ]
}`;
}

// ===========================================
// GENERATE SCHEDULE
// ===========================================

async function generateSchedule(character) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🧠 CONTENT BRAIN V2.3 (Extended Thinking) — ${character.toUpperCase()}`);
  console.log('═'.repeat(60));

  const today = new Date();
  const dayOfWeek = today.getDay();

  // Gather all layers first (need analytics for dynamic times)
  console.log('🔄 Gathering intelligence layers...\n');

  // First fetch analytics and history (no dependencies)
  const [analytics, history] = await Promise.all([
    analyzePerformance(supabase, character),
    fetchHistory(supabase, character),
  ]);

  // Get dynamic posting times based on analytics AND character
  const postingConfig = getOptimalPostingTimes(dayOfWeek, analytics, character);
  
  // Skip if no posts configured (e.g., Mila disabled)
  if (postingConfig.postsCount === 0) {
    console.log(`⏸️ ${character.toUpperCase()} is currently disabled (0 posts configured)`);
    return null;
  }

  console.log(`📅 ${today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`);
  console.log(`📊 Posts prévus: ${postingConfig.postsCount}`);
  console.log(`⏰ Créneaux (optimisés): ${postingConfig.slots.join(', ')}`);

  // Then fetch context, memories, and relationship in parallel
  const [context, memories, relationship] = await Promise.all([
    fetchContext(history?.narrative?.currentLocation || 'paris'),
    fetchMemories(supabase, character),
    fetchRelationship(supabase, character),
  ]);

  // Log relationship hint
  if (relationship?.suggestedHint) {
    console.log(`\n💕 Relationship hint: ${relationship.suggestedHint.type}`);
    console.log(`   → ${relationship.suggestedHint.description}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // TRENDING LAYER — Perplexity-powered dynamic content (Elena only)
  // ═══════════════════════════════════════════════════════════════
  let trendingExperiment = null;
  let trendingSafe = null;
  
  if (character === 'elena') {
    console.log('\n🔥 Fetching trending content (Perplexity)...');
    
    // Get recent locations to avoid — use the full avoidList from history (7 days)
    const recentLocations = history?.avoidList || [];
    console.log(`   🚫 Avoid list (7 days): ${recentLocations.slice(0, 8).join(', ')}${recentLocations.length > 8 ? '...' : ''}`);
    
    // NOTE: No longer using analytics for trending — avoids bias/circular recommendations
    // Both slots now use Perplexity with different styles:
    // - EXPERIMENT (14h): Creative, edgy, new trends
    // - SAFE (21h): Classic, timeless, elegant
    
    // Fetch both in parallel — both use recentLocations to avoid repetition
    [trendingExperiment, trendingSafe] = await Promise.all([
      fetchTrendingExperiment(recentLocations),
      fetchTrendingSafe(recentLocations),  // No more analytics dependency!
    ]);
    
    console.log(`   🧪 EXPERIMENT: ${trendingExperiment?.location?.name || 'fallback'} (${trendingExperiment?.source})`);
    console.log(`   ✅ SAFE/CLASSIC: ${trendingSafe?.location?.name || 'fallback'} (${trendingSafe?.source})`);
  }

  // Suggest narrative arc based on history and context
  const narrativeArc = suggestNarrativeArc(history.narrative, context);
  console.log(`\n📚 Narrative Arc: "${narrativeArc.name}"`);
  console.log(`   Story: ${narrativeArc.story}`);
  console.log(`   Duration: ${narrativeArc.duration}`);

  // Build FREEDOM prompt — Claude has full creative control with blocklist
  console.log('\n📝 Building FREEDOM prompt (full creative control)...');
  const prompt = buildFreedomPrompt(
    character,
    analytics,
    history,
    context,
    memories,
    relationship,
    postingConfig,
    today,
    narrativeArc,
    { trendingExperiment, trendingSafe }
  );

  // Call Claude with Extended Thinking for better reasoning
  console.log('🤖 Asking Claude (Extended Thinking) for decisions...\n');

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      thinking: {
        type: 'enabled',
        budget_tokens: 10000,  // Tokens for deep reasoning on 6 layers
      },
      messages: [{ role: 'user', content: prompt }],
    });

    // With extended thinking, response contains thinking blocks + text blocks
    const thinkingBlock = response.content.find(c => c.type === 'thinking');
    const textContent = response.content.find(c => c.type === 'text');
    
    if (thinkingBlock) {
      console.log('💭 Claude thinking summary:');
      // Show first 200 chars of thinking for debugging
      const thinkingPreview = thinkingBlock.thinking.substring(0, 200);
      console.log(`   "${thinkingPreview}..."\n`);
    }
    
    if (!textContent) throw new Error('No response from Claude');

    // Extract JSON
    let jsonStr = textContent.text;
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
    } else {
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonStr = jsonMatch[0];
    }

    // Fix common JSON issues
    jsonStr = jsonStr.replace(/"hashtags"\s*:\s*\[([\s\S]*?)\]/g, (match, content) => {
      const hashtags = content.match(/"#[\w]+"/g) || [];
      return `"hashtags": [${hashtags.join(', ')}]`;
    });

    const plan = JSON.parse(jsonStr);

    // Display results
    console.log(`✅ Theme: "${plan.daily_theme}"`);
    console.log(`📋 Reasoning: ${plan.reasoning_summary || 'N/A'}`);
    console.log(`🎨 Creative Freedom: Claude decided locations, outfits, poses freely`);

    console.log('\n📅 Planning généré:');
    console.log('─'.repeat(60));
    plan.posts.forEach((p, i) => {
      console.log(`${p.scheduled_time} │ CAROUSEL │ ✨ ${p.location_name}`);
      console.log(`         │ ${(p.mood || 'N/A').toUpperCase().padEnd(12)} │ "${(p.caption || '').substring(0, 40)}..."`);
      console.log(`         └─ Reasoning: ${(p.reasoning || 'N/A').substring(0, 50)}...`);
    });
    console.log('─'.repeat(60));

    // Save to Supabase
    const scheduleDate = today.toISOString().split('T')[0];
    
    const schedule = {
      schedule_date: scheduleDate,
      character,
      daily_theme: plan.daily_theme,
      mood: plan.posts[0]?.mood || 'cozy',
      scheduled_posts: plan.posts.map(p => ({
        time: p.scheduled_time,
        type: 'carousel',
        reel_type: null,
        reel_theme: null,
        content_type: p.content_type || 'new',  // Default to 'new' if not provided
        is_experiment: p.is_experiment || false,
        trending_source: p.trending_source || null,
        reasoning: p.reasoning,
        location_key: p.location_key,
        location_name: p.location_name,
        mood: p.mood,
        outfit: p.outfit,
        action: p.action,
        caption: p.caption,
        has_private_cta: p.has_private_cta || false,
        hashtags: p.hashtags,
        prompt_hints: p.prompt_hints,
        executed: false,
      })),
      status: 'pending',
      posts_completed: 0,
      posts_total: plan.posts.length,
      generated_by: 'content_brain_v3_freedom',
      generation_reasoning: JSON.stringify({
        summary: plan.reasoning_summary || `Analytics + Trending + History → Claude decided freely`,
        mode: 'full_creative_freedom',
        blocklist_applied: true,
      }),
    };

    const { data, error } = await supabase
      .from('daily_schedules')
      .upsert(schedule, { onConflict: 'schedule_date,character' })
      .select()
      .single();

    if (error) {
      console.log(`\n❌ Save error: ${error.message}`);
      return null;
    }

    console.log(`\n💾 Saved to Supabase: ${data.id}`);

    // Insert individual posts into scheduled_posts table for granular tracking
    console.log('📝 Creating individual post entries...');
    
    for (const post of plan.posts) {
      const { error: postError } = await supabase
        .from('scheduled_posts')
        .upsert({
          schedule_id: data.id,
          character,
          scheduled_date: scheduleDate,
          scheduled_time: post.scheduled_time,
          status: 'scheduled',
          post_type: 'carousel',  // Force carousel for all posts
          reel_type: null,
          reel_theme: null,
          content_type: post.content_type || 'new',
          location_key: post.location_key,
          location_name: post.location_name,
          mood: post.mood,
          outfit: post.outfit,
          action: post.action,
          caption: post.caption,
          has_private_cta: post.has_private_cta || false,
          hashtags: post.hashtags,
          prompt_hints: post.prompt_hints,
        }, { onConflict: 'schedule_id,scheduled_time' });

      if (postError) {
        console.log(`   ⚠️ Failed to create post entry for ${post.scheduled_time}: ${postError.message}`);
      } else {
        console.log(`   ✅ ${post.scheduled_time} | carousel`);
      }
    }

    return data;

  } catch (error) {
    console.log(`\n❌ Error: ${error.message}`);
    if (error.message.includes('JSON')) {
      console.log('   JSON parsing failed — check Claude response format');
    }
    return null;
  }
}

// ===========================================
// MAIN
// ===========================================

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('   🧠 CONTENT BRAIN V2.1 — Intelligent Content Planning');
  console.log('═'.repeat(60));
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log('   Layers: Analytics + History + Context + Character + Memories');
  console.log('   + Dynamic Times + Exploration Budget + A/B Testing');
  console.log('═'.repeat(60));

  const args = process.argv.slice(2);
  const target = args[0]?.toLowerCase();

  // Par défaut, ne générer que pour Elena (Mila désactivée)
  if (target === 'mila') {
    await generateSchedule('mila');
  } else if (target === 'elena') {
    await generateSchedule('elena');
  } else {
    // Par défaut : Elena uniquement (Mila désactivée)
    await generateSchedule('elena');
  }

  console.log('\n✅ Content Brain V2 complete!\n');
}

main().catch(console.error);

