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
// OPTIMAL POSTING TIMES
// ===========================================

function getOptimalPostingTimes(dayOfWeek) {
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  if (isWeekend) {
    return {
      slots: ['10:00', '14:00', '20:00'],
      reelSlot: '14:00',
      postsCount: 3,
    };
  } else if (dayOfWeek === 5) {
    return {
      slots: ['08:30', '12:30', '18:00', '21:00'],
      reelSlot: '18:00',
      postsCount: 4,
    };
  } else {
    return {
      slots: ['08:00', '12:30', '19:00'],
      reelSlot: '12:30',
      postsCount: 3,
    };
  }
}

// ===========================================
// BUILD ENHANCED PROMPT (5 LAYERS)
// ===========================================

function buildEnhancedPrompt(
  character,
  analytics,
  history,
  context,
  memories,
  postingConfig,
  today
) {
  const otherCharacter = character === 'mila' ? 'Elena' : 'Mila';
  const dayName = today.toLocaleDateString('fr-FR', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

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
## 🎯 MISSION
═══════════════════════════════════════════════════════════════

Génère ${postingConfig.postsCount} posts pour aujourd'hui.

### Horaires disponibles:
${postingConfig.slots.join(', ')}
(Reel idéalement à ${postingConfig.reelSlot})

### Lieux disponibles:
${LOCATIONS[character].join('\n')}

### Types de contenu possibles:
1. **NOUVEAU** — Contenu du jour (le plus courant)
2. **THROWBACK** — Rappel d'un arc passé (#throwback, souvenir)
3. **DUO** — Contenu avec/sur ${otherCharacter} (si opportunité)
4. **RÉPONSE** — Réaction au post récent de ${otherCharacter}

### Pour chaque post, fournis:
- **content_type**: "new" | "throwback" | "duo" | "response"
- **reasoning**: POURQUOI ce choix (1-2 phrases, basé sur les layers ci-dessus)
- **location_key**: ID du lieu
- **location_name**: Nom complet du lieu
- **post_type**: "carousel" | "reel"
- **mood**: cozy | adventure | work | fitness | travel | fashion | relax | nostalgic
- **outfit**: Description tenue détaillée
- **action**: Ce qu'elle fait (pour le prompt image)
- **caption**: Caption engageante AVEC question (max 150 chars)
- **hashtags**: 12-15 hashtags (format ["#tag1", "#tag2"])
- **scheduled_time**: Horaire parmi les slots disponibles
- **prompt_hints**: Indices pour génération image

### Règles STRICTES:
1. Au moins 1 REEL obligatoire
2. NE PAS répéter les lieux de l'historique récent
3. Chaque caption DOIT avoir une question pour l'engagement
4. Si analytics montrent que travel performe bien → privilégier travel
5. Si duo est overdue (>10 jours) → inclure au moins 1 throwback/duo
6. Le reasoning doit justifier le choix en citant les données

═══════════════════════════════════════════════════════════════

Réponds UNIQUEMENT avec du JSON valide, format:
{
  "daily_theme": "Thème du jour en 1 phrase",
  "reasoning_summary": "Résumé des décisions principales",
  "posts": [
    {
      "content_type": "new|throwback|duo|response",
      "reasoning": "Pourquoi ce post...",
      "location_key": "...",
      "location_name": "...",
      "post_type": "carousel|reel",
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
  console.log(`🧠 CONTENT BRAIN V2 — ${character.toUpperCase()}`);
  console.log('═'.repeat(60));

  const today = new Date();
  const dayOfWeek = today.getDay();
  const postingConfig = getOptimalPostingTimes(dayOfWeek);

  console.log(`📅 ${today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`);
  console.log(`📊 Posts prévus: ${postingConfig.postsCount}`);
  console.log(`⏰ Créneaux: ${postingConfig.slots.join(', ')}\n`);

  // Gather all layers
  console.log('🔄 Gathering intelligence layers...\n');

  // First fetch analytics and history (no dependencies)
  const [analytics, history] = await Promise.all([
    analyzePerformance(supabase, character),
    fetchHistory(supabase, character),
  ]);

  // Then fetch context (needs history for location) and memories in parallel
  const [context, memories] = await Promise.all([
    fetchContext(history?.narrative?.currentLocation || 'paris'),
    fetchMemories(supabase, character),
  ]);

  // Build enhanced prompt
  console.log('\n📝 Building enhanced prompt...');
  const prompt = buildEnhancedPrompt(
    character,
    analytics,
    history,
    context,
    memories,
    postingConfig,
    today
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
    console.log(`📋 Reasoning: ${plan.reasoning_summary || 'N/A'}\n`);

    console.log('📅 Planning généré:');
    console.log('─'.repeat(60));
    plan.posts.forEach((p, i) => {
      const typeIcon = p.content_type === 'throwback' ? '📸' : 
                       p.content_type === 'duo' ? '👯' : 
                       p.content_type === 'response' ? '💬' : '✨';
      console.log(`${p.scheduled_time} │ ${p.post_type.toUpperCase().padEnd(8)} │ ${typeIcon} ${p.location_name}`);
      console.log(`         │ ${p.content_type.toUpperCase()} │ "${p.caption?.substring(0, 45)}..."`);
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
        content_type: p.content_type,
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
      generated_by: 'content_brain_v2',
      generation_reasoning: plan.reasoning_summary || `Analytics: ${analytics.patterns?.bestLocationType}, Context: ${context.seasonalContext}`,
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
  console.log('   🧠 CONTENT BRAIN V2 — Intelligent Content Planning');
  console.log('═'.repeat(60));
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log('   Layers: Analytics + History + Context + Character + Memories');
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

