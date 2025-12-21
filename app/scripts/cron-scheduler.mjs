/**
 * CRON Scheduler V2 — Content Brain with 5 Intelligence Layers
 * 
 * Generates daily content plan using:
 * 1. Analytics Layer — What performs best
 * 2. History Layer — Where we are in the story
 * 3. Context Layer — What's happening now (Perplexity)
 * 4. Character Layer — Who is she
 * 5. Memories Layer — Shared memories & duo opportunities
 * 
 * Usage:
 *   node scripts/cron-scheduler-v2.mjs           # Schedule both accounts
 *   node scripts/cron-scheduler-v2.mjs mila      # Schedule Mila only
 *   node scripts/cron-scheduler-v2.mjs elena     # Schedule Elena only
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// Import layers
import { analyzePerformance, formatAnalyticsForPrompt } from './lib/analytics-layer.mjs';
import { fetchHistory, formatHistoryForPrompt } from './lib/history-layer.mjs';
import { fetchContext, formatContextForPrompt } from './lib/context-layer.mjs';
import { fetchMemories, formatMemoriesForPrompt } from './lib/memories-layer.mjs';

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
- 26 ans, Personal Trainer & Photographe
- Paris 18e (Montmartre)
- Style: Artiste sportive punk rock fun, authentique
- Activités: Personal training, photographie, guitare, yoga, pilates
- Personnalité: Énergique, passionnée, rebelle douce, naturelle
- Corps: Athlétique, petite poitrine, tonique
- Meilleure amie: Elena Visconti (mannequin, se sont rencontrées sur un shooting)`,

  elena: `## Elena Visconti (@elenav.paris)
- 24 ans, Mannequin & Influenceuse Mode
- Paris 8e (Haussmann luxe), origine Milan
- Style: Sophistiquée jet-set, street-luxe Paris, luxe discret
- Activités: Shootings mode, voyages luxe, spa, Fashion Week, gastronomie
- Personnalité: Warm, accessible (pas froide comme mannequin typique), confiante, secretly punk
- Corps: Curvy, voluptueuse, très généreuse poitrine naturelle
- Meilleure amie: Mila Verne (photographe, se sont rencontrées sur un shooting)
- IMPORTANT: Elena voyage beaucoup (Milan, yachts, spas montagne, Fashion Weeks)`,
};

// ===========================================
// AVAILABLE LOCATIONS
// ===========================================

const LOCATIONS = {
  mila: [
    'home_bedroom: Chambre Mila (cozy bohemian, plantes, lumière douce)',
    'home_living_room: Salon Mila (rooftop view Montmartre, guitare)',
    'kb_cafe: KB CaféShop Paris 18e (café trendy, brunch)',
    'usine_gym: L\'Usine Paris (premium gym, vestiaires luxe)',
    'montmartre_streets: Rues de Montmartre (escaliers, street style)',
    'studio_photo: Studio photo Paris (shooting perso)',
  ],
  elena: [
    'loft_living: Loft Elena Paris 8e (luxe minimaliste, grandes fenêtres)',
    'loft_bedroom: Chambre Elena (vanity Hollywood, lit king size)',
    'bathroom_luxe: Salle de bain marble & gold (baignoire, miroirs)',
    'cafe_paris: Café parisien chic (terrasse, Haussmann)',
    'spa_mountains: Spa luxe montagne (piscine extérieure, neige)',
    'milan_fashion: Milano Fashion District (shopping, Via Montenapoleone)',
    'yacht_mediterranean: Yacht Méditerranée (deck, sunset)',
    'airport_lounge: Airport Business Lounge (travel vibes)',
    'courchevel_chalet: Chalet Courchevel (ski, après-ski)',
    'bali_villa: Villa Bali (piscine infinity, rizières)',
  ],
};

// ===========================================
// DYNAMIC POSTING TIMES (based on analytics)
// ===========================================

function getOptimalPostingTimes(dayOfWeek, analytics = null) {
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
// A/B TESTING SYSTEM
// ===========================================

const AB_EXPERIMENTS = [
  {
    id: 'reel_timing',
    hypothesis: 'Les reels à 21h ont plus de reach que ceux de 14h',
    variable: 'reel_time',
    variants: ['14:00', '21:00'],
  },
  {
    id: 'travel_vs_home',
    hypothesis: 'Le contenu travel a plus d\'engagement même si home récent performe',
    variable: 'location_type',
    variants: ['travel', 'home'],
  },
  {
    id: 'carousel_length',
    hypothesis: 'Les carousels de 5+ images performent mieux que 3',
    variable: 'carousel_count',
    variants: ['3-4', '5-7'],
  },
  {
    id: 'caption_style',
    hypothesis: 'Les captions avec emoji en premier ont plus d\'engagement',
    variable: 'caption_format',
    variants: ['emoji_first', 'text_first'],
  },
];

function getWeeklyExperiment() {
  // Rotate experiments weekly based on week number
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const experiment = AB_EXPERIMENTS[weekNumber % AB_EXPERIMENTS.length];
  
  // Pick a random variant for this run
  const variant = experiment.variants[Math.floor(Math.random() * experiment.variants.length)];
  
  return {
    ...experiment,
    activeVariant: variant,
  };
}

// ===========================================
// EXPLORATION BUDGET
// ===========================================

function getExplorationRequirements(character, history, analytics, postsCount) {
  const requirements = [];
  
  // ═══════════════════════════════════════════════════════════════
  // RULE 1: MINIMUM 2 REELS PER DAY (Option B)
  // ═══════════════════════════════════════════════════════════════
  if (postsCount >= 3) {
    requirements.push({
      type: 'minimum_reels',
      rule: 'OBLIGATOIRE: Minimum 2 REELS par jour (1 photo-reel + 1 video-reel idéalement)',
      reason: 'Les reels ont 4x plus de reach — stratégie de croissance',
    });
  } else {
    requirements.push({
      type: 'minimum_reels',
      rule: 'OBLIGATOIRE: Minimum 1 REEL par jour',
      reason: 'Les reels ont 4x plus de reach — stratégie de croissance',
    });
  }
  
  // ═══════════════════════════════════════════════════════════════
  // RULE 2: Check if stuck in home content
  // ═══════════════════════════════════════════════════════════════
  const recentLocations = history?.recentPosts?.slice(0, 5).map(p => p.location) || [];
  const homeKeywords = ['loft', 'home', 'bedroom', 'living', 'bathroom'];
  const homeCount = recentLocations.filter(loc => 
    homeKeywords.some(kw => (loc || '').toLowerCase().includes(kw))
  ).length;
  
  if (homeCount >= 4) {
    requirements.push({
      type: 'location_change',
      rule: 'OBLIGATOIRE: Au moins 1 post HORS de chez elle (café, extérieur, voyage)',
      reason: `${homeCount}/5 derniers posts sont à la maison — besoin de variété`,
    });
  }
  
  // ═══════════════════════════════════════════════════════════════
  // RULE 3: Travel content for Elena (jet-set mannequin)
  // ═══════════════════════════════════════════════════════════════
  const travelKeywords = ['bali', 'milan', 'yacht', 'spa', 'courchevel', 'airport', 'beach'];
  const hasTravelRecently = recentLocations.some(loc => 
    travelKeywords.some(kw => (loc || '').toLowerCase().includes(kw))
  );
  
  if (!hasTravelRecently && character === 'elena') {
    requirements.push({
      type: 'travel_content',
      rule: 'OBLIGATOIRE: Inclure du contenu travel (throwback ou nouveau lieu voyage)',
      reason: 'Elena est mannequin jet-set — aucun travel content depuis 5+ posts',
    });
  }
  
  // ═══════════════════════════════════════════════════════════════
  // RULE 4: Video reel variety (at least 1 animated reel per week)
  // ═══════════════════════════════════════════════════════════════
  // Check day of week - suggest video reel on specific days
  const dayOfWeek = new Date().getDay();
  const videoReelDays = [2, 4, 6]; // Tuesday, Thursday, Saturday
  
  if (videoReelDays.includes(dayOfWeek)) {
    requirements.push({
      type: 'video_reel',
      rule: 'RECOMMANDÉ: Inclure 1 video-reel animé (Kling) pour plus d\'engagement',
      reason: 'Les video-reels animés ont +30% d\'engagement vs photo-reels',
    });
  }
  
  return requirements;
}

// ===========================================
// BUILD ENHANCED PROMPT (5 LAYERS + EXPLORATION + A/B)
// ===========================================

function buildEnhancedPrompt(
  character,
  analytics,
  history,
  context,
  memories,
  postingConfig,
  today,
  explorationRules,
  abTest
) {
  const otherCharacter = character === 'mila' ? 'Elena' : 'Mila';
  const dayName = today.toLocaleDateString('fr-FR', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  // Format exploration rules
  const explorationSection = explorationRules.length > 0 
    ? explorationRules.map(r => `⚠️ ${r.rule}\n   (Raison: ${r.reason})`).join('\n\n')
    : 'Aucune contrainte d\'exploration spécifique.';

  // Format A/B test
  const abTestSection = abTest 
    ? `🧪 **TEST EN COURS**: ${abTest.hypothesis}
   Variable testée: ${abTest.variable}
   Variant actif: **${abTest.activeVariant}**
   → Pour 1 post, applique ce variant et marque-le avec "is_experiment": true`
    : 'Pas de test A/B cette semaine.';

  return `Tu es le Content Brain de ${character === 'mila' ? 'Mila Verne' : 'Elena Visconti'}.
Ta mission: créer un planning de posts intelligent, cohérent et engageant.

═══════════════════════════════════════════════════════════════
## 1️⃣ ANALYTICS — Ce qui FONCTIONNE
═══════════════════════════════════════════════════════════════

${formatAnalyticsForPrompt(analytics)}

═══════════════════════════════════════════════════════════════
## 2️⃣ HISTORIQUE — Où en est-on dans l'histoire ?
═══════════════════════════════════════════════════════════════

${formatHistoryForPrompt(history)}

═══════════════════════════════════════════════════════════════
## 3️⃣ CONTEXTE TEMPS RÉEL — Que se passe-t-il ?
═══════════════════════════════════════════════════════════════

Date: ${dayName} ${dateStr}

${formatContextForPrompt(context)}

═══════════════════════════════════════════════════════════════
## 4️⃣ PERSONNAGE
═══════════════════════════════════════════════════════════════

${CHARACTER_SHEETS[character]}

═══════════════════════════════════════════════════════════════
## 5️⃣ SOUVENIRS PARTAGÉS — Opportunités avec ${otherCharacter}
═══════════════════════════════════════════════════════════════

${formatMemoriesForPrompt(memories, character)}

═══════════════════════════════════════════════════════════════
## 🔬 EXPLORATION & EXPÉRIMENTATION
═══════════════════════════════════════════════════════════════

### Règles d'exploration (PRIORITAIRES):
${explorationSection}

### A/B Test de la semaine:
${abTestSection}

═══════════════════════════════════════════════════════════════
## 🎯 MISSION
═══════════════════════════════════════════════════════════════

Génère ${postingConfig.postsCount} posts pour aujourd'hui.

### Horaires optimisés (basés sur analytics):
${postingConfig.slots.join(', ')}
(Reel idéalement à ${postingConfig.reelSlot})

### Lieux disponibles:
${LOCATIONS[character].join('\n')}

### Types de contenu possibles:
1. **NOUVEAU** — Contenu du jour (le plus courant)
2. **THROWBACK** — Rappel d'un arc passé (#throwback, souvenir)
3. **DUO** — Contenu avec/sur ${otherCharacter} (si opportunité)
4. **RÉPONSE** — Réaction au post récent de ${otherCharacter}
5. **EXPERIMENT** — Post expérimental pour tester une hypothèse

### Pour chaque post, fournis:
- **content_type**: "new" | "throwback" | "duo" | "response" | "experiment"
- **is_experiment**: true/false (true si c'est le post A/B test)
- **reasoning**: POURQUOI ce choix (1-2 phrases, cite les données)
- **location_key**: ID du lieu
- **location_name**: Nom complet du lieu
- **post_type**: "carousel" | "reel"
- **reel_type**: "photo" | "video" (SEULEMENT si post_type = "reel")
  • "photo" = slideshow de 3 photos (rapide, ~2min génération)
  • "video" = 3 clips animés Kling (premium, ~10min génération, plus engageant)
- **mood**: cozy | adventure | work | fitness | travel | fashion | relax | nostalgic
- **outfit**: Description tenue détaillée
- **action**: Ce qu'elle fait (pour le prompt image)
- **caption**: Caption engageante AVEC question (max 150 chars)
- **hashtags**: 12-15 hashtags (format ["#tag1", "#tag2"])
- **scheduled_time**: Horaire parmi les slots disponibles
- **prompt_hints**: Indices pour génération image

### Règles STRICTES (dans cet ordre de priorité):
1. **EXPLORATION D'ABORD**: Respecte les règles d'exploration ci-dessus
2. **MINIMUM 2 REELS** par jour si 3+ posts
3. Au moins 1 reel devrait être "video" (animé) si recommandé dans exploration
4. NE PAS répéter les lieux de l'historique récent (sauf throwback)
5. Chaque caption DOIT avoir une question pour l'engagement
6. Si duo est overdue (>10 jours) → inclure au moins 1 throwback/duo
7. 1 post doit appliquer le test A/B si actif
8. Le reasoning doit justifier le choix en citant les données

### Important pour ${character === 'elena' ? 'Elena' : 'Mila'}:
${character === 'elena' 
  ? `Elena est MANNEQUIN JET-SET. Elle DOIT voyager régulièrement!
   Si elle n'a pas eu de contenu travel/voyage depuis 4+ posts:
   → OBLIGATOIRE: au moins 1 post travel (même throwback)`
  : `Mila est personal trainer & photographe. Variété entre:
   → Fitness (gym, yoga)
   → Lifestyle (café, Montmartre)
   → Créatif (photo, musique)`}

═══════════════════════════════════════════════════════════════

Réponds UNIQUEMENT avec du JSON valide, format:
{
  "daily_theme": "Thème du jour en 1 phrase",
  "reasoning_summary": "Résumé des décisions principales",
  "exploration_applied": ["rule1", "rule2"],
  "ab_test_applied": true/false,
  "posts": [
    {
      "content_type": "new|throwback|duo|response|experiment",
      "is_experiment": false,
      "reasoning": "Pourquoi ce post...",
      "location_key": "...",
      "location_name": "...",
      "post_type": "carousel|reel",
      "reel_type": "photo|video",
      "reel_theme": "fitness|spa|lifestyle|travel",
      "mood": "...",
      "outfit": "...",
      "action": "...",
      "caption": "... question?",
      "hashtags": ["#..."],
      "scheduled_time": "HH:MM",
      "prompt_hints": "..."
    }
  ]
}`;
}

// ===========================================
// GENERATE SCHEDULE
// ===========================================

async function generateSchedule(character) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🧠 CONTENT BRAIN V2.1 — ${character.toUpperCase()}`);
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

  // Get dynamic posting times based on analytics
  const postingConfig = getOptimalPostingTimes(dayOfWeek, analytics);

  console.log(`📅 ${today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`);
  console.log(`📊 Posts prévus: ${postingConfig.postsCount}`);
  console.log(`⏰ Créneaux (optimisés): ${postingConfig.slots.join(', ')}`);

  // Then fetch context (needs history for location) and memories in parallel
  const [context, memories] = await Promise.all([
    fetchContext(history?.narrative?.currentLocation || 'paris'),
    fetchMemories(supabase, character),
  ]);

  // Get exploration requirements (pass postsCount for min reels rule)
  const explorationRules = getExplorationRequirements(character, history, analytics, postingConfig.postsCount);
  if (explorationRules.length > 0) {
    console.log(`\n🔬 Exploration rules detected:`);
    explorationRules.forEach(r => console.log(`   → ${r.type}: ${r.reason}`));
  }

  // Get weekly A/B test
  const abTest = getWeeklyExperiment();
  console.log(`\n🧪 A/B Test: "${abTest.hypothesis}"`);
  console.log(`   Variant: ${abTest.activeVariant}`);

  // Build enhanced prompt
  console.log('\n📝 Building enhanced prompt...');
  const prompt = buildEnhancedPrompt(
    character,
    analytics,
    history,
    context,
    memories,
    postingConfig,
    today,
    explorationRules,
    abTest
  );

  // Call Claude
  console.log('🤖 Asking Claude for decisions...\n');

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find(c => c.type === 'text');
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
    
    if (plan.exploration_applied?.length > 0) {
      console.log(`🔬 Exploration applied: ${plan.exploration_applied.join(', ')}`);
    }
    if (plan.ab_test_applied) {
      console.log(`🧪 A/B Test applied: ${abTest.hypothesis}`);
    }

    console.log('\n📅 Planning généré:');
    console.log('─'.repeat(60));
    plan.posts.forEach((p, i) => {
      const typeIcon = p.content_type === 'throwback' ? '📸' : 
                       p.content_type === 'duo' ? '👯' : 
                       p.content_type === 'response' ? '💬' :
                       p.content_type === 'experiment' ? '🧪' : '✨';
      const expBadge = p.is_experiment ? ' [A/B TEST]' : '';
      const reelInfo = p.post_type === 'reel' ? ` (${p.reel_type || 'photo'})` : '';
      console.log(`${p.scheduled_time} │ ${p.post_type.toUpperCase()}${reelInfo.padEnd(6)} │ ${typeIcon} ${p.location_name}${expBadge}`);
      console.log(`         │ ${p.content_type.toUpperCase().padEnd(10)} │ "${p.caption?.substring(0, 40)}..."`);
      console.log(`         └─ Reasoning: ${p.reasoning?.substring(0, 50)}...`);
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
        type: p.post_type,
        reel_type: p.post_type === 'reel' ? (p.reel_type || 'photo') : null,
        reel_theme: p.post_type === 'reel' ? (p.reel_theme || 'lifestyle') : null,
        content_type: p.content_type,
        is_experiment: p.is_experiment || false,
        reasoning: p.reasoning,
        location_key: p.location_key,
        location_name: p.location_name,
        mood: p.mood,
        outfit: p.outfit,
        action: p.action,
        caption: p.caption,
        hashtags: p.hashtags,
        prompt_hints: p.prompt_hints,
        executed: false,
      })),
      status: 'pending',
      posts_completed: 0,
      posts_total: plan.posts.length,
      generated_by: 'content_brain_v2.1',
      generation_reasoning: JSON.stringify({
        summary: plan.reasoning_summary || `Analytics: ${analytics.patterns?.bestLocationType}, Context: ${context.seasonalContext}`,
        exploration_rules: explorationRules.map(r => r.type),
        ab_test: plan.ab_test_applied ? {
          experiment_id: abTest.id,
          hypothesis: abTest.hypothesis,
          variant: abTest.activeVariant,
        } : null,
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

  if (target === 'mila') {
    await generateSchedule('mila');
  } else if (target === 'elena') {
    await generateSchedule('elena');
  } else {
    await generateSchedule('mila');
    await generateSchedule('elena');
  }

  console.log('\n✅ Content Brain V2 complete!\n');
}

main().catch(console.error);

