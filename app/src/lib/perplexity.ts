/**
 * Perplexity AI Integration
 * Daily trends & hashtags research for Instagram content
 */

import { fetchWithTimeout } from './fetch-utils';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface TrendTopic {
  topic: string;
  relevance: 'high' | 'medium' | 'low';
  context: string;
  captionAngle?: string;
}

export interface DailyTrends {
  date: string;
  topics: TrendTopic[];
  trendingHashtags: string[];
  suggestedHashtags: string[];
  fetchedAt: string;
}

export interface CaptionSuggestion {
  caption: string;
  hashtags: string[];
  mood: string;
}

// ═══════════════════════════════════════════════════════════════
// PERPLEXITY API
// ═══════════════════════════════════════════════════════════════

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

/**
 * Fetch daily trends from Perplexity
 */
export async function fetchDailyTrends(): Promise<DailyTrends | null> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    console.error('[Perplexity] API key not configured');
    return null;
  }
  
  const today = new Date().toISOString().split('T')[0];
  
  const systemPrompt = `You are a social media trends analyst specializing in French lifestyle, fashion, fitness, and wellness content. You analyze what's trending in France for Instagram influencers.`;
  
  const userPrompt = `What are the top 5 trending topics in France today (${today}) relevant to:
- Lifestyle & daily life
- Fashion & style
- Fitness & wellness
- Paris culture & events
- Weather or seasonal events

Also provide:
1. Top 10 trending Instagram hashtags in France for lifestyle content today
2. 5 evergreen hashtags that always work for a French fitness/lifestyle influencer

Format your response as JSON:
{
  "topics": [
    {
      "topic": "Topic name",
      "relevance": "high/medium/low",
      "context": "Brief context about why it's trending",
      "captionAngle": "How an influencer could subtly reference this"
    }
  ],
  "trendingHashtags": ["#hashtag1", "#hashtag2", ...],
  "suggestedHashtags": ["#evergreen1", "#evergreen2", ...]
}

Only return valid JSON, no other text.`;

  try {
    const response = await fetchWithTimeout(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
      timeout: 30000, // 30s timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Perplexity] API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('[Perplexity] No content in response');
      return null;
    }

    // Parse JSON from response (handle potential markdown code blocks)
    let jsonStr = content;
    if (content.includes('```json')) {
      jsonStr = content.split('```json')[1].split('```')[0];
    } else if (content.includes('```')) {
      jsonStr = content.split('```')[1].split('```')[0];
    }

    const parsed = JSON.parse(jsonStr.trim());

    return {
      date: today,
      topics: parsed.topics || [],
      trendingHashtags: parsed.trendingHashtags || [],
      suggestedHashtags: parsed.suggestedHashtags || [],
      fetchedAt: new Date().toISOString(),
    };

  } catch (error) {
    console.error('[Perplexity] Error fetching trends:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// CAPTION GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a caption based on content type and trends
 */
export async function generateCaption(
  contentType: string,
  location: string,
  action: string,
  trends?: DailyTrends
): Promise<CaptionSuggestion | null> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    console.error('[Perplexity] API key not configured');
    return getFallbackCaption(contentType);
  }

  const trendContext = trends?.topics
    ?.filter(t => t.relevance === 'high')
    .map(t => `- ${t.topic}: ${t.captionAngle}`)
    .join('\n') || 'No specific trends today';

  const systemPrompt = `You are Mila, a 22-year-old French fitness influencer and photographer based in Paris. You write Instagram captions in a mix of French and English, casual but polished. Your tone is confident, warm, playful, and subtly sensual without being vulgar.`;

  const userPrompt = `Write an Instagram caption for this post:
- Content type: ${contentType}
- Location: ${location}  
- What I'm doing: ${action}

Current trends I could subtly reference (optional):
${trendContext}

Rules:
- Caption should be 1-2 short sentences max
- Mix French and English naturally
- Include 1-2 emojis max (not at every sentence)
- Be authentic, not salesy
- Subtly confident/sensual vibe
- Don't mention trends explicitly, just vibe with them

Also suggest 8-12 hashtags (mix of trending + evergreen).

Format as JSON:
{
  "caption": "Your caption here",
  "hashtags": ["#tag1", "#tag2", ...],
  "mood": "one word mood"
}

Only return valid JSON.`;

  try {
    const response = await fetchWithTimeout(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
      timeout: 30000, // 30s timeout
    });

    if (!response.ok) {
      console.error('[Perplexity] Caption API error:', response.status);
      return getFallbackCaption(contentType);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return getFallbackCaption(contentType);
    }

    // Parse JSON
    let jsonStr = content;
    if (content.includes('```json')) {
      jsonStr = content.split('```json')[1].split('```')[0];
    } else if (content.includes('```')) {
      jsonStr = content.split('```')[1].split('```')[0];
    }

    return JSON.parse(jsonStr.trim());

  } catch (error) {
    console.error('[Perplexity] Error generating caption:', error);
    return getFallbackCaption(contentType);
  }
}

// ═══════════════════════════════════════════════════════════════
// FALLBACK CAPTIONS (when API unavailable)
// ═══════════════════════════════════════════════════════════════

const FALLBACK_CAPTIONS: Record<string, CaptionSuggestion[]> = {
  fitness: [
    { caption: "Post-workout glow > makeup 💪", hashtags: ["#fitgirl", "#motivation", "#gymlife", "#fitfrenchgirl", "#workout"], mood: "energetic" },
    { caption: "Sore but worth it", hashtags: ["#fitness", "#training", "#strongwomen", "#gymmotivation", "#fitnessmotivation"], mood: "accomplished" },
    { caption: "Morning routine non-négociable", hashtags: ["#morningroutine", "#fitlife", "#parisfit", "#healthylifestyle"], mood: "determined" },
  ],
  lifestyle: [
    { caption: "Coffee first, everything else later ☕", hashtags: ["#parisienne", "#coffeelover", "#lifestyle", "#frenchgirl", "#vieparisienne"], mood: "relaxed" },
    { caption: "Cette lumière... 🤌", hashtags: ["#goldenhour", "#paris", "#lifestyle", "#aesthetic", "#mood"], mood: "dreamy" },
    { caption: "Main character energy", hashtags: ["#ootd", "#streetstyle", "#parisian", "#dailylook", "#style"], mood: "confident" },
  ],
  bedroom: [
    { caption: "Slow mornings are underrated", hashtags: ["#morning", "#cozy", "#selfcare", "#weekend", "#lazy"], mood: "peaceful" },
    { caption: "Mood: unbothered ✨", hashtags: ["#chill", "#vibes", "#aesthetic", "#mood", "#relax"], mood: "relaxed" },
    { caption: "Soft hours only", hashtags: ["#cozy", "#homebody", "#comfort", "#peaceful", "#athome"], mood: "intimate" },
  ],
  cafe: [
    { caption: "Le café d'abord, le reste après", hashtags: ["#cafe", "#paris", "#coffeetime", "#parisienne", "#cafelife"], mood: "content" },
    { caption: "Working from my favorite spot", hashtags: ["#remotework", "#cafelover", "#pariscafe", "#coffeeshop", "#worklife"], mood: "focused" },
    { caption: "Ces moments simples 🤍", hashtags: ["#simplepleasures", "#parislife", "#dailylife", "#moments", "#grateful"], mood: "grateful" },
  ],
  default: [
    { caption: "Feeling myself today ✨", hashtags: ["#mood", "#vibes", "#lifestyle", "#aesthetic", "#daily"], mood: "confident" },
    { caption: "Just vibing", hashtags: ["#goodvibes", "#life", "#moment", "#happy", "#blessed"], mood: "carefree" },
  ],
};

function getFallbackCaption(contentType: string): CaptionSuggestion {
  // Map content types to fallback categories
  const categoryMap: Record<string, string> = {
    workout: 'fitness',
    training_client: 'fitness',
    gym_selfie: 'fitness',
    morning_routine: 'bedroom',
    lazy_morning: 'bedroom',
    cozy_evening: 'bedroom',
    golden_hour_home: 'bedroom',
    café_moment: 'cafe',
    brunch: 'cafe',
    coffee_prep: 'cafe',
  };

  const category = categoryMap[contentType] || 'default';
  const captions = FALLBACK_CAPTIONS[category] || FALLBACK_CAPTIONS.default;
  
  return captions[Math.floor(Math.random() * captions.length)];
}

// ═══════════════════════════════════════════════════════════════
// MILA'S EVERGREEN HASHTAGS
// ═══════════════════════════════════════════════════════════════

export const MILA_HASHTAGS = {
  identity: ['#milaverne', '#frenchgirl', '#parisienne'],
  fitness: ['#fitgirl', '#fitfrenchgirl', '#strongwomen', '#pilatesgirl', '#personaltrainer'],
  lifestyle: ['#lifestyle', '#dailylife', '#vieparisienne', '#parisian'],
  aesthetic: ['#aesthetic', '#mood', '#vibes', '#goldenhour'],
  location: ['#paris', '#montmartre', '#france'],
};

/**
 * Combine trending hashtags with Mila's evergreen ones
 */
export function combineHashtags(
  trending: string[],
  contentType: string,
  maxTotal: number = 12
): string[] {
  const evergreen = [
    ...MILA_HASHTAGS.identity.slice(0, 2),
    ...MILA_HASHTAGS.lifestyle.slice(0, 2),
  ];

  // Add content-specific evergreen
  if (contentType.includes('workout') || contentType.includes('gym') || contentType.includes('fitness')) {
    evergreen.push(...MILA_HASHTAGS.fitness.slice(0, 2));
  }

  // Combine and deduplicate
  const combined = [...new Set([...trending.slice(0, 6), ...evergreen])];
  
  return combined.slice(0, maxTotal);
}

// ═══════════════════════════════════════════════════════════════
// API STATUS CHECK
// ═══════════════════════════════════════════════════════════════

export async function checkPerplexityStatus(): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    return { ok: false, error: 'PERPLEXITY_API_KEY not configured' };
  }

  try {
    // Simple test request
    const response = await fetchWithTimeout(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10,
      }),
      timeout: 10000, // 10s timeout for status check
    });

    if (response.ok) {
      return { ok: true };
    } else {
      return { ok: false, error: `API returned ${response.status}` };
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
