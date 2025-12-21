/**
 * CRON Scheduler — Generate daily content plan
 * 
 * Run daily at 6:00 UTC (7:00 Paris)
 * Generates the day's posting schedule using Content Brain
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
  console.error('   Or in .env.local for local development');
  process.exit(1);
}

if (!CLAUDE_KEY) {
  console.error('❌ Missing CLAUDE_KEY (or ANTHROPIC_API_KEY)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const anthropic = new Anthropic({
  apiKey: CLAUDE_KEY,
});

// ===========================================
// OPTIMAL POSTING TIMES (Paris timezone)
// ===========================================

function getOptimalPostingTimes(dayOfWeek) {
  // Based on Instagram best practices + our analytics
  // dayOfWeek: 0 = Sunday, 6 = Saturday
  
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  if (isWeekend) {
    // Weekend: people wake up later, more active evening
    return {
      slots: ['10:00', '14:00', '20:00'],
      reelSlot: '14:00', // Best for weekend reels
      postsCount: 3,
    };
  } else if (dayOfWeek === 5) {
    // Friday: anticipation for weekend
    return {
      slots: ['08:30', '12:30', '18:00', '21:00'],
      reelSlot: '18:00', // Friday evening reels perform well
      postsCount: 4,
    };
  } else {
    // Weekdays (Mon-Thu)
    return {
      slots: ['08:00', '12:30', '19:00'],
      reelSlot: '12:30', // Lunch break reels
      postsCount: 3,
    };
  }
}

// ===========================================
// CHARACTER CONFIG
// ===========================================

const CHARACTER_SHEETS = {
  mila: `## Mila Verne (@mila_verne)
- 26 ans, Personal Trainer & Photographe
- Paris 18e (Montmartre)
- Style: Artiste sportive punk rock fun
- Activités: PT, photo, guitare, yoga/pilates`,

  elena: `## Elena Visconti (@elenav.paris)
- 24 ans, Mannequin & Influenceuse Mode
- Paris 8e (Haussmann luxe)
- Style: Sophistiquée jet-set, luxe discret
- Activités: Shootings, voyages, spa, Fashion Week`,
};

const LOCATIONS = {
  mila: [
    'home_bedroom: Chambre Mila (cozy bohemian)',
    'home_living_room: Salon Mila (rooftop view)',
    'nice_old_town_cafe: KB CaféShop Paris 18e',
    'nice_gym: L\'Usine Paris (premium gym)',
  ],
  elena: [
    'loft_living: Loft Elena Paris 8e',
    'loft_bedroom: Chambre Elena (vanity)',
    'bathroom_luxe: Salle de bain marble & gold',
    'cafe_paris: Café parisien chic',
    'spa_luxe: Spa luxe (mountains)',
    'milan_fashion: Milano Fashion District',
    'yacht_mediterranean: Yacht Méditerranée',
    'airport_lounge: Airport Business Lounge',
  ],
};

// ===========================================
// FETCH CONTEXT FROM SUPABASE
// ===========================================

async function fetchContext(character) {
  // Get recent posts (avoid repetition)
  const { data: recentPosts } = await supabase
    .from('posts')
    .select('location_key, mood, post_type, posted_at')
    .eq('character_name', character)
    .order('posted_at', { ascending: false })
    .limit(5);

  // Get analytics insights
  const { data: topPosts } = await supabase
    .from('posts')
    .select('location_key, mood, post_type, likes_count')
    .eq('character_name', character)
    .order('likes_count', { ascending: false })
    .limit(10);

  // Get timeline events
  const { data: timeline } = await supabase
    .from('timeline_events')
    .select('title, description, event_date, emotional_tone')
    .contains('characters', [character])
    .order('event_date', { ascending: false })
    .limit(5);

  // Calculate best performers
  const locationCounts = {};
  const moodCounts = {};
  topPosts?.forEach(p => {
    if (p.location_key) locationCounts[p.location_key] = (locationCounts[p.location_key] || 0) + 1;
    if (p.mood) moodCounts[p.mood] = (moodCounts[p.mood] || 0) + 1;
  });

  const bestLocation = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const bestMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  // Recent locations to avoid
  const recentLocations = [...new Set(recentPosts?.map(p => p.location_key).filter(Boolean))];

  return {
    recentPosts: recentPosts || [],
    recentLocations,
    bestLocation,
    bestMood,
    timeline: timeline || [],
  };
}

// ===========================================
// BUILD CLAUDE PROMPT
// ===========================================

function buildPrompt(character, context, postingConfig, today) {
  const other = character === 'mila' ? 'elena' : 'mila';
  const dayName = today.toLocaleDateString('fr-FR', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return `Tu es le Content Brain de ${character === 'mila' ? 'Mila Verne' : 'Elena Visconti'}.

${CHARACTER_SHEETS[character]}

## Date: ${dayName} ${dateStr}
## Posts à générer: ${postingConfig.postsCount}
## Horaires optimaux: ${postingConfig.slots.join(', ')}
## Slot idéal pour Reel: ${postingConfig.reelSlot}

## Historique récent (éviter ces lieux)
${context.recentLocations.join(', ') || 'Aucun'}

## Analytics Insights
- Meilleur lieu: ${context.bestLocation || 'Pas assez de données'}
- Meilleur mood: ${context.bestMood || 'Pas assez de données'}

## Timeline récente (souvenirs avec ${other})
${context.timeline.map(e => `- ${e.event_date}: ${e.title}`).join('\n') || 'Aucun'}

## Lieux disponibles
${LOCATIONS[character].join('\n')}

## Mission
Génère ${postingConfig.postsCount} posts pour aujourd'hui. Au moins 1 REEL obligatoire.

Pour chaque post:
- location_key: ID du lieu
- location_name: Nom du lieu  
- post_type: "carousel" ou "reel"
- mood: cozy|adventure|work|fitness|travel|fashion|relax
- outfit: Description tenue
- action: Ce qu'elle fait
- caption: Caption avec question (max 150 chars)
- hashtags: 15 hashtags (QUOTED strings like "#fitness")
- scheduled_time: Horaire parmi ${postingConfig.slots.join(', ')}
- prompt_hints: Indices pour génération image

Règles:
1. Ne PAS répéter les lieux récents
2. Le Reel DOIT être à ${postingConfig.reelSlot}
3. Chaque caption DOIT avoir une question

JSON uniquement, format:
{
  "daily_theme": "...",
  "posts": [{ ... }]
}`;
}

// ===========================================
// GENERATE SCHEDULE
// ===========================================

async function generateSchedule(character) {
  console.log(`\n🧠 Generating schedule for ${character.toUpperCase()}...`);

  const today = new Date();
  const dayOfWeek = today.getDay();
  const postingConfig = getOptimalPostingTimes(dayOfWeek);
  const context = await fetchContext(character);

  console.log(`   Day: ${today.toLocaleDateString('fr-FR', { weekday: 'long' })}`);
  console.log(`   Posts: ${postingConfig.postsCount}`);
  console.log(`   Slots: ${postingConfig.slots.join(', ')}`);
  console.log(`   Locations to avoid: ${context.recentLocations.join(', ') || 'none'}`);

  const prompt = buildPrompt(character, context, postingConfig, today);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent) throw new Error('No response');

    // Extract JSON
    let jsonStr = textContent.text;
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) jsonStr = codeBlockMatch[1];
    else {
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonStr = jsonMatch[0];
    }

    // Fix hashtags
    jsonStr = jsonStr.replace(/"hashtags"\s*:\s*\[([\s\S]*?)\]/g, (match, content) => {
      const hashtags = content.match(/"#[\w]+"/g) || [];
      return `"hashtags": [${hashtags.join(', ')}]`;
    });

    const plan = JSON.parse(jsonStr);

    console.log(`   ✅ Generated: "${plan.daily_theme}"`);

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
      generated_by: 'cron_scheduler',
      generation_reasoning: `Day: ${today.toLocaleDateString('fr-FR', { weekday: 'long' })}, Best location: ${context.bestLocation}, Avoided: ${context.recentLocations.join(', ')}`,
    };

    const { data, error } = await supabase
      .from('daily_schedules')
      .upsert(schedule, { onConflict: 'schedule_date,character' })
      .select()
      .single();

    if (error) {
      console.log(`   ❌ Save error: ${error.message}`);
      return null;
    }

    console.log(`   📅 Saved schedule ID: ${data.id}`);

    // Display schedule
    console.log(`\n   📋 Today's Schedule:`);
    plan.posts.forEach((p, i) => {
      console.log(`      ${p.scheduled_time} │ ${p.post_type.toUpperCase().padEnd(8)} │ ${p.location_name}`);
    });

    return data;

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

// ===========================================
// MAIN
// ===========================================

async function main() {
  console.log('\n⏰ ═══════════════════════════════════════════════════════');
  console.log('   CRON SCHEDULER — Daily Content Planning');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   Time: ${new Date().toISOString()}`);

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

  console.log('\n✅ Scheduling complete!\n');
}

main().catch(console.error);

