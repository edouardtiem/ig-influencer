import Anthropic from '@anthropic-ai/sdk';
import {
  supabase,
  isSupabaseConfigured,
  getRecentPosts,
  getTimelineEvents,
  getActiveArcs,
  getRelationship,
  getCaptionTemplates,
  getAnalyticsInsights,
  saveDailySchedule,
  type CharacterName,
  type PostType,
  type Mood,
  type ScheduledPost,
  type DailySchedule,
} from './supabase';
import { ACTIVE_LOCATIONS, getActiveLocationById } from '../config/locations';
import { ELENA_LOCATIONS, getElenaLocation } from '../config/locations-elena';

// ===========================================
// CONTENT BRAIN — Intelligent Content Engine
// ===========================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.Claude_key,
});

// ===========================================
// CHARACTER SHEETS (Condensed for Claude)
// ===========================================

const CHARACTER_SHEETS: Record<CharacterName, string> = {
  mila: `## Mila Verne (@mila_verne)
- 22 ans, Personal Trainer & Photographe
- Paris 18e (Montmartre) - originaire de Nice
- Aesthetic: Artiste sportive punk rock fun — Bohème cosy + edge créatif + énergie fitness
- Physique: Copper auburn curly hair (3A), hazel-green eyes, freckles, beauty mark above left lip
- Style: Athleisure (Alo Yoga vibes), casual chic, bohème cozy
- Personnalité: Confident, warm, playful, ambitieuse, un peu rebelle
- Activités: Entraîne ses clientes PT, shoote (photographe), joue guitare, yoga/pilates, café & travail
- Lieux récurrents: Son appart Paris 18e, KB CaféShop, L'Usine gym, Paris streets
- Tone of voice: Casual mais soigné, mix français/anglais, émojis avec parcimonie`,

  elena: `## Elena Visconti (@elenav.paris)
- 24 ans, Mannequin & Influenceuse Mode
- Paris 8e (Haussmann luxe) - origines italiennes
- Aesthetic: Sophistiquée jet-set — Luxe discret mais assumé, French-Italian elegance
- Physique: Long dark brown hair, olive skin, striking features, elegant posture
- Style: Designer pieces, minimalist luxe, French girl chic
- Personnalité: Sophistiquée, mystérieuse, jet-set, aspirational mais accessible
- Activités: Shootings mannequin, fittings, voyages travail, Fashion Week, spa/wellness
- Lieux récurrents: Son loft Paris 8e, voyages luxe (Milan, Maldives, yacht), backstage shootings
- Tone of voice: Élégant, inspirational, lifestyle luxe, captions courtes et impactantes`,
};

// ===========================================
// CONTENT BRAIN TYPES
// ===========================================

export interface ContentProposal {
  character: CharacterName;
  postType: PostType;
  locationKey: string;
  locationName: string;
  locationCountry: string;
  mood: Mood;
  outfit: string;
  action: string;
  caption: string;
  hashtags: string[];
  withCharacter?: CharacterName;
  reasoning: string;
  scheduledTime: string;
  promptHints: string;
}

export interface DailyPlanRequest {
  character: CharacterName;
  postsCount?: number; // Default 3
  includeReel?: boolean;
  forceCrossover?: boolean;
}

export interface HistoryContext {
  recentPosts: Array<{
    location: string;
    mood: string;
    type: string;
    withCharacter?: string;
    postedAt: string;
  }>;
  timelineEvents: Array<{
    title: string;
    description: string;
    date: string;
    emotionalTone?: string;
  }>;
  activeArcs: Array<{
    name: string;
    title: string;
    completedPosts: number;
    plannedPosts: number;
  }>;
  relationship?: {
    howTheyMet: string;
    insideJokes: string[];
    sharedMemories: string[];
    activitiesTogether: string[];
  };
  analytics: {
    bestLocation: string | null;
    bestMood: string | null;
    bestPostType: string | null;
    avgEngagement: number;
    recentLocations: string[];
  };
}

// ===========================================
// GATHER CONTEXT
// ===========================================

async function gatherHistoryContext(character: CharacterName): Promise<HistoryContext> {
  // Run all queries in parallel
  const [posts, timeline, arcs, relationship, analytics] = await Promise.all([
    getRecentPosts(character, 10),
    getTimelineEvents([character], true),
    getActiveArcs(character),
    getRelationship('mila', 'elena'),
    getAnalyticsInsights(character),
  ]);

  return {
    recentPosts: posts.map(p => ({
      location: p.location_key || 'unknown',
      mood: p.mood || 'unknown',
      type: p.post_type,
      withCharacter: p.with_character || undefined,
      postedAt: p.posted_at || p.created_at,
    })),
    timelineEvents: timeline.slice(0, 5).map(e => ({
      title: e.title,
      description: e.description,
      date: e.event_date,
      emotionalTone: e.emotional_tone || undefined,
    })),
    activeArcs: arcs.map(a => ({
      name: a.name,
      title: a.title,
      completedPosts: a.completed_posts,
      plannedPosts: a.planned_posts || 0,
    })),
    relationship: relationship ? {
      howTheyMet: relationship.how_they_met,
      insideJokes: relationship.inside_jokes || [],
      sharedMemories: relationship.shared_memories || [],
      activitiesTogether: relationship.activities_together || [],
    } : undefined,
    analytics,
  };
}

// ===========================================
// GET AVAILABLE LOCATIONS
// ===========================================

function getAvailableLocations(character: CharacterName): string[] {
  if (character === 'mila') {
    return ACTIVE_LOCATIONS.map(l => `${l.id}: ${l.name} (${l.category})`);
  } else {
    return Object.values(ELENA_LOCATIONS).map(l => `${l.id}: ${l.name} (${l.category})`);
  }
}

// ===========================================
// BUILD CLAUDE PROMPT
// ===========================================

function buildClaudePrompt(
  character: CharacterName,
  context: HistoryContext,
  postsCount: number,
  includeReel: boolean,
  forceCrossover: boolean
): string {
  const otherCharacter = character === 'mila' ? 'elena' : 'mila';
  const today = new Date();
  const dayOfWeek = today.toLocaleDateString('fr-FR', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const locationsList = getAvailableLocations(character);

  return `Tu es le Content Brain de ${character === 'mila' ? 'Mila Verne' : 'Elena Visconti'}, un système intelligent qui planifie le contenu Instagram quotidien.

${CHARACTER_SHEETS[character]}

## Contexte du Jour
- **Date** : ${dayOfWeek} ${dateStr}
- **Posts à planifier** : ${postsCount}
${includeReel ? '- **Inclure un Reel** : Oui (au moins 1)' : ''}
${forceCrossover ? `- **Crossover obligatoire** : Oui (un post avec ${otherCharacter === 'mila' ? 'Mila' : 'Elena'})` : ''}

## Historique Récent (5 derniers posts)
${context.recentPosts.slice(0, 5).map(p => `- ${p.type} @ ${p.location} (mood: ${p.mood})${p.withCharacter ? ` avec ${p.withCharacter}` : ''}`).join('\n') || '- Aucun post récent'}

## Lieux à éviter (postés récemment)
${context.analytics.recentLocations.join(', ') || 'Aucun'}

## Analytics Insights
- Meilleur lieu : ${context.analytics.bestLocation || 'Pas assez de données'}
- Meilleur mood : ${context.analytics.bestMood || 'Pas assez de données'}
- Meilleur type : ${context.analytics.bestPostType || 'Pas assez de données'}
- Engagement moyen : ${context.analytics.avgEngagement.toFixed(1)}%

## Timeline Lore (souvenirs partagés avec ${otherCharacter === 'mila' ? 'Mila' : 'Elena'})
${context.timelineEvents.map(e => `- ${e.date}: "${e.title}" — ${e.description}`).join('\n') || '- Pas de timeline'}

## Arcs Narratifs Actifs
${context.activeArcs.map(a => `- "${a.title}" (${a.completedPosts}/${a.plannedPosts} posts)`).join('\n') || '- Aucun arc actif'}

## Relation avec ${otherCharacter === 'mila' ? 'Mila' : 'Elena'}
${context.relationship ? `
- Comment elles se sont rencontrées : ${context.relationship.howTheyMet}
- Inside jokes : ${context.relationship.insideJokes.slice(0, 3).join(', ')}
- Activités ensemble : ${context.relationship.activitiesTogether.slice(0, 4).join(', ')}
` : '- Pas de données de relation'}

## Lieux Disponibles
${locationsList.join('\n')}

## Horaires de Publication Recommandés
- Matin : 08:00-09:00 (meilleur pour lifestyle/café)
- Midi : 12:00-13:00 (bon pour fitness/travail)
- Soir : 18:00-19:00 (meilleur pour lifestyle/sortie)
- Nuit : 21:00-22:00 (bon pour cozy/intime)

## Ta Mission

Génère le planning du jour avec ${postsCount} posts. Pour chaque post, fournis :

1. **location_key** : ID du lieu (parmi les lieux disponibles)
2. **post_type** : "carousel" ou "reel"
3. **mood** : cozy | adventure | work | party | relax | fitness | travel | fashion
4. **outfit** : Description courte de la tenue
5. **action** : Ce qu'elle fait (dynamique, pas juste poser)
6. **caption** : Caption engageante avec CTA (max 150 caractères)
   - 80% des posts : CTA engagement ("Tu préfères 1 ou 2 ?", "Save si...", "Double tap si...")
   - 20% des posts : CTA conversion ("Le reste sur mon lien en bio 😈", "La suite en bio 🔗")
7. **hashtags** : 15 hashtags pertinents
8. **scheduled_time** : Horaire (format HH:MM)
9. **prompt_hints** : Indices pour le prompt de génération d'image
10. **with_character** : "${otherCharacter}" si crossover, sinon null
11. **reasoning** : Pourquoi ce choix (1-2 phrases)

## Règles CRITIQUES

1. **Variété** : Ne JAMAIS répéter un lieu des 3 derniers posts
2. **Cohérence narrative** : Si un arc est actif, en tenir compte
3. **CTA Strategy** : 80% engagement (questions, save, vote) / 20% conversion (link in bio)
4. **Horaires** : Espacer les posts d'au moins 4h
5. **Reels** : ${includeReel ? 'Au moins 1 reel obligatoire' : 'Carousels préférés'}
6. **Crossover** : ${forceCrossover ? 'Un post DOIT être avec ' + (otherCharacter === 'mila' ? 'Mila' : 'Elena') : '20% de chance de suggérer un crossover'}

Réponds UNIQUEMENT avec un JSON valide, format :
{
  "daily_theme": "Thème/direction du jour",
  "posts": [
    {
      "location_key": "...",
      "location_name": "...",
      "location_country": "France",
      "post_type": "carousel",
      "mood": "...",
      "outfit": "...",
      "action": "...",
      "caption": "...",
      "hashtags": ["#...", ...],
      "scheduled_time": "08:30",
      "prompt_hints": "...",
      "with_character": null,
      "reasoning": "..."
    }
  ]
}`;
}

// ===========================================
// GENERATE DAILY PLAN
// ===========================================

export async function generateDailyPlan(request: DailyPlanRequest): Promise<DailySchedule | null> {
  const { character, postsCount = 3, includeReel = true, forceCrossover = false } = request;

  // Check if we have Anthropic API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY not set');
    return null;
  }

  console.log(`🧠 Content Brain generating plan for ${character}...`);

  // Gather all context
  const context = await gatherHistoryContext(character);

  // Build the prompt
  const prompt = buildClaudePrompt(character, context, postsCount, includeReel, forceCrossover);

  try {
    // Call Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text response
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      console.error('❌ No text response from Claude');
      return null;
    }

    // Parse JSON from response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ No JSON found in response');
      console.log('Response:', textContent.text);
      return null;
    }

    const plan = JSON.parse(jsonMatch[0]);

    console.log(`✅ Generated plan: "${plan.daily_theme}" with ${plan.posts.length} posts`);

    // Convert to ScheduledPost format
    const scheduledPosts: ScheduledPost[] = plan.posts.map((p: Record<string, unknown>) => ({
      time: p.scheduled_time as string,
      type: p.post_type as PostType,
      location_key: p.location_key as string,
      mood: p.mood as Mood,
      outfit: p.outfit as string,
      action: p.action as string,
      caption_hint: p.caption as string,
      with_character: p.with_character as CharacterName | undefined,
      executed: false,
    }));

    // Create DailySchedule
    const schedule: Omit<DailySchedule, 'id' | 'created_at' | 'updated_at'> = {
      schedule_date: new Date().toISOString().split('T')[0],
      character,
      daily_theme: plan.daily_theme,
      mood: plan.posts[0]?.mood || 'cozy',
      scheduled_posts: scheduledPosts,
      status: 'pending',
      posts_completed: 0,
      posts_total: scheduledPosts.length,
      generated_by: 'content_brain',
      generation_reasoning: plan.posts.map((p: Record<string, unknown>) => p.reasoning).join(' | '),
    };

    // Save to Supabase if configured
    if (isSupabaseConfigured()) {
      const saved = await saveDailySchedule(schedule);
      if (saved) {
        console.log(`✅ Schedule saved to Supabase: ${saved.id}`);
        return saved;
      }
    }

    // Return even if not saved (for testing)
    return {
      ...schedule,
      id: 'temp-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Error generating plan:', error);
    return null;
  }
}

// ===========================================
// GET TODAY'S NEXT POST
// ===========================================

export async function getNextScheduledPost(character: CharacterName): Promise<ScheduledPost | null> {
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase not configured');
    return null;
  }

  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('daily_schedules')
    .select('*')
    .eq('schedule_date', today)
    .eq('character', character)
    .single();

  const schedule = data as DailySchedule | null;

  if (!schedule) {
    console.log('📅 No schedule found for today');
    return null;
  }

  // Find next unexecuted post
  const nextPost = schedule.scheduled_posts.find((p: ScheduledPost) => !p.executed);

  if (!nextPost) {
    console.log('✅ All posts for today have been executed');
    return null;
  }

  return nextPost;
}

// ===========================================
// MARK POST AS EXECUTED
// ===========================================

export async function markPostExecuted(
  character: CharacterName,
  scheduledTime: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('daily_schedules')
    .select('*')
    .eq('schedule_date', today)
    .eq('character', character)
    .single();

  const schedule = data as DailySchedule | null;

  if (!schedule) return false;

  // Update the executed flag
  const updatedPosts = schedule.scheduled_posts.map((p: ScheduledPost) =>
    p.time === scheduledTime ? { ...p, executed: true } : p
  );

  const completedCount = updatedPosts.filter((p: ScheduledPost) => p.executed).length;
  const newStatus = completedCount === updatedPosts.length ? 'completed' : 'in_progress';

  const { error } = await supabase
    .from('daily_schedules')
    .update({
      scheduled_posts: updatedPosts,
      posts_completed: completedCount,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', schedule.id);

  return !error;
}

// ===========================================
// QUICK GENERATE (No Supabase required)
// ===========================================

export async function quickGeneratePlan(
  character: CharacterName,
  postsCount: number = 3
): Promise<ContentProposal[] | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY not set');
    return null;
  }

  console.log(`🧠 Quick generating ${postsCount} posts for ${character}...`);

  // Minimal context (no Supabase)
  const context: HistoryContext = {
    recentPosts: [],
    timelineEvents: [],
    activeArcs: [],
    relationship: {
      howTheyMet: 'Sur un shooting photo à Paris. Mila était photographe, Elena mannequin.',
      insideJokes: ['Le fameux croissant volé', 'Mila toujours en retard'],
      sharedMemories: ['Ski trip Courchevel', 'Bali août 2024'],
      activitiesTogether: ['brunch', 'shopping', 'workout', 'shooting'],
    },
    analytics: {
      bestLocation: null,
      bestMood: null,
      bestPostType: null,
      avgEngagement: 5,
      recentLocations: [],
    },
  };

  const prompt = buildClaudePrompt(character, context, postsCount, true, false);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') return null;

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const plan = JSON.parse(jsonMatch[0]);

    return plan.posts.map((p: Record<string, unknown>) => ({
      character,
      postType: p.post_type as PostType,
      locationKey: p.location_key as string,
      locationName: p.location_name as string,
      locationCountry: p.location_country as string || 'France',
      mood: p.mood as Mood,
      outfit: p.outfit as string,
      action: p.action as string,
      caption: p.caption as string,
      hashtags: p.hashtags as string[],
      withCharacter: p.with_character as CharacterName | undefined,
      reasoning: p.reasoning as string,
      scheduledTime: p.scheduled_time as string,
      promptHints: p.prompt_hints as string,
    }));
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}

// ===========================================
// EXPORTS
// ===========================================

export {
  gatherHistoryContext,
  buildClaudePrompt,
  CHARACTER_SHEETS,
};

