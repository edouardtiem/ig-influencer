/**
 * Trending Layer — Perplexity-powered trending content discovery
 * 
 * Fetches trending locations, outfits ("petites tenues"), and poses
 * for dynamic Instagram content generation.
 * 
 * Two modes:
 * - EXPERIMENT (14h): Full creative freedom, new trending content
 * - SAFE (21h): Trending but constrained by top performers from analytics
 */

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

// ═══════════════════════════════════════════════════════════════
// SAFE SEXY VOCABULARY (from docs/19-QUALITY-SEXY-STRATEGY.md)
// ═══════════════════════════════════════════════════════════════

export function sanitizePromptFragment(text, level = 'normal') {
  let safe = text;
  
  // Level 1: Normal sanitization
  safe = safe.replace(/\bsensual\b/gi, 'captivating');
  safe = safe.replace(/\bseductive\b/gi, 'alluring');
  safe = safe.replace(/\bsexy\b/gi, 'striking');
  safe = safe.replace(/\bhot\b/gi, 'radiant');
  safe = safe.replace(/\blingerie\b/gi, 'intimate sleepwear');
  safe = safe.replace(/\bunderwear\b/gi, 'delicate loungewear');
  safe = safe.replace(/\bbikini\b/gi, 'elegant swimwear');
  safe = safe.replace(/\bcleavage\b/gi, 'elegant décolleté');
  safe = safe.replace(/\bbare legs\b/gi, 'long toned legs visible');
  safe = safe.replace(/\bnaked\b/gi, 'natural');
  safe = safe.replace(/\bnude\b/gi, 'natural skin');
  
  // Level 2: Safer fallback (more aggressive)
  if (level === 'safer') {
    safe = safe.replace(/\bsheer\b/gi, 'soft');
    safe = safe.replace(/\btransparent\b/gi, 'light');
    safe = safe.replace(/\bsee-through\b/gi, 'delicate');
    safe = safe.replace(/\bsleepwear\b/gi, 'loungewear');
    safe = safe.replace(/\bintimate\b/gi, 'cozy');
    safe = safe.replace(/\bbralette\b/gi, 'soft top');
    safe = safe.replace(/\bbodysuit\b/gi, 'fitted top');
    safe = safe.replace(/\blow-cut\b/gi, 'elegant');
    safe = safe.replace(/\bplunging\b/gi, 'v-neck');
    safe = safe.replace(/\brevealing\b/gi, 'stylish');
    safe = safe.replace(/\bcurves\b/gi, 'silhouette');
    safe = safe.replace(/\bbust\b/gi, 'figure');
    safe = safe.replace(/\bbreasts\b/gi, 'figure');
  }
  
  return safe;
}

// ═══════════════════════════════════════════════════════════════
// FETCH TRENDING CONTENT (EXPERIMENT MODE - Full creative freedom)
// ═══════════════════════════════════════════════════════════════

export async function fetchTrendingExperiment(recentLocations = []) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    console.log('   ⚠️ PERPLEXITY_API_KEY not found, using fallback');
    return getFallbackTrending();
  }

  const avoidList = recentLocations.length > 0 
    ? `AVOID these locations (already used): ${recentLocations.join(', ')}`
    : '';

  const systemPrompt = `You are an Instagram content strategist specializing in sexy-but-tasteful model content. You help create trending content that maximizes engagement while staying within IG guidelines. You understand "safe sexy vocabulary" for AI image generation.`;

  const userPrompt = `I need fresh EXPERIMENT content for Elena Visconti (@elenav.paris), a 24yo curvy Italian model in Paris.

Her aesthetic: "Street-luxe Paris Mannequin 2025" - glamorous, warm, confident, curves emphasized tastefully.
Target audience: Men 26-35yo with disposable income.

${avoidList}

This is for the EXPERIMENT slot (14h) — be CREATIVE, try something NEW.

Based on what's trending RIGHT NOW on Instagram (January 2026), give me:

## 1. TRENDING LOCATION (1)
- Something FRESH and visually stunning
- NOT: Bali, yacht, Paris apartment, spa, ski resort, rooftop (overused)
- Can be indoor or outdoor, works for revealing outfits

## 2. TRENDING "PETITE TENUE" (1)
REVEALING but IG-safe outfit. Think:
- Bikini styles (viral cuts/colors for curvy models)
- Lingerie-inspired looks (trending that reads as fashion)
- Sport underwear / athletic intimates
- Bodysuits, bralettes with skirts

IMPORTANT: Return promptFragment using SAFE VOCABULARY:
- "bikini" → "elegant high-cut swimwear"
- "lingerie" → "intimate sleepwear" or "delicate loungewear"
- "underwear" → "athletic loungewear set"

## 3. TRENDING POSE (1)
- Sensual but not explicit
- Good for curvy body types
- NOT always looking at camera (candid moments are trending)

## 4. CAPTION
Write ONE micro-story caption:
- English primarily (can mix French)
- Hook in first line
- 2-3 story lines
- Soft CTA: "The rest of this set is on my private. 🖤"

Format as JSON:
{
  "location": { "name": "...", "promptFragment": "detailed setting for AI", "whyTrending": "..." },
  "outfit": { "name": "...", "promptFragment": "safe vocabulary outfit description", "whyTrending": "..." },
  "pose": { "name": "...", "promptFragment": "pose description, can include not looking at camera", "whyTrending": "..." },
  "caption": "full caption text",
  "mood": "one word mood"
}

Only return valid JSON.`;

  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1500,
        temperature: 0.6, // Higher for creativity
      }),
    });

    if (!response.ok) {
      console.log('   ⚠️ Perplexity API error, using fallback');
      return getFallbackTrending();
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return getFallbackTrending();
    }

    // Parse JSON
    let jsonStr = content;
    if (content.includes('```json')) {
      jsonStr = content.split('```json')[1].split('```')[0];
    } else if (content.includes('```')) {
      jsonStr = content.split('```')[1].split('```')[0];
    }

    const parsed = JSON.parse(jsonStr.trim());
    
    // Sanitize prompt fragments
    parsed.location.promptFragment = sanitizePromptFragment(parsed.location.promptFragment);
    parsed.outfit.promptFragment = sanitizePromptFragment(parsed.outfit.promptFragment);
    parsed.pose.promptFragment = sanitizePromptFragment(parsed.pose.promptFragment);
    
    return {
      ...parsed,
      source: 'perplexity_experiment',
    };

  } catch (error) {
    console.log(`   ⚠️ Trending fetch error: ${error.message}`);
    return getFallbackTrending();
  }
}

// ═══════════════════════════════════════════════════════════════
// FETCH TRENDING CONTENT (SAFE MODE - Constrained by top performers)
// ═══════════════════════════════════════════════════════════════

export async function fetchTrendingSafe(topPerformers = {}) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    console.log('   ⚠️ PERPLEXITY_API_KEY not found, using fallback');
    return getFallbackTrendingSafe(topPerformers);
  }

  // Extract top performers info
  const topLocations = topPerformers.locations || ['golden hour', 'Bali', 'travel'];
  const topThemes = topPerformers.themes || ['vacation nostalgia', 'golden light', 'intimate moments'];
  const topOutfitStyles = topPerformers.outfitStyles || ['swimwear', 'loungewear'];

  const systemPrompt = `You are an Instagram content strategist. You help create trending content that's SIMILAR to what already works, but fresh.`;

  const userPrompt = `I need SAFE content for Elena Visconti (@elenav.paris), a 24yo curvy Italian model in Paris.

This is for the SAFE slot (21h) — stick to what WORKS but make it fresh.

## TOP PERFORMERS (from analytics):
- Best locations/themes: ${topLocations.join(', ')}
- Best content themes: ${topThemes.join(', ')}
- Best outfit styles: ${topOutfitStyles.join(', ')}

Based on these top performers, give me:

## 1. SIMILAR TRENDING LOCATION
Something that has the SAME VIBE as the top performers but fresh
(e.g., if Bali works → suggest similar tropical/resort destination)

## 2. SIMILAR "PETITE TENUE"
Outfit style similar to what works, but current trending version
Use SAFE VOCABULARY for AI:
- "bikini" → "elegant high-cut swimwear"
- "lingerie" → "intimate sleepwear"

## 3. TRENDING POSE
Similar to successful poses but with current trending twist
Include some candid/not-looking-at-camera options

## 4. CAPTION
Micro-story format that matches the winning style:
- Hook + 2-3 story lines + soft CTA to private

Format as JSON:
{
  "location": { "name": "...", "promptFragment": "...", "whyTrending": "...", "similarTo": "which top performer" },
  "outfit": { "name": "...", "promptFragment": "safe vocabulary", "whyTrending": "..." },
  "pose": { "name": "...", "promptFragment": "...", "whyTrending": "..." },
  "caption": "full caption",
  "mood": "one word"
}

Only return valid JSON.`;

  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1500,
        temperature: 0.3, // Lower for safer choices
      }),
    });

    if (!response.ok) {
      return getFallbackTrendingSafe(topPerformers);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return getFallbackTrendingSafe(topPerformers);
    }

    // Parse JSON
    let jsonStr = content;
    if (content.includes('```json')) {
      jsonStr = content.split('```json')[1].split('```')[0];
    } else if (content.includes('```')) {
      jsonStr = content.split('```')[1].split('```')[0];
    }

    const parsed = JSON.parse(jsonStr.trim());
    
    // Sanitize
    parsed.location.promptFragment = sanitizePromptFragment(parsed.location.promptFragment);
    parsed.outfit.promptFragment = sanitizePromptFragment(parsed.outfit.promptFragment);
    parsed.pose.promptFragment = sanitizePromptFragment(parsed.pose.promptFragment);
    
    return {
      ...parsed,
      source: 'perplexity_safe',
    };

  } catch (error) {
    console.log(`   ⚠️ Trending safe fetch error: ${error.message}`);
    return getFallbackTrendingSafe(topPerformers);
  }
}

// ═══════════════════════════════════════════════════════════════
// FALLBACKS (when Perplexity unavailable)
// ═══════════════════════════════════════════════════════════════

function getFallbackTrending() {
  const locations = [
    { name: 'Luxury Hotel Pool Lounge', promptFragment: 'luxury hotel rooftop pool with city skyline view, cabanas, lounge chairs, warm golden hour light, aspirational resort atmosphere', whyTrending: 'Hotel pool content trending for European influencers' },
    { name: 'Mediterranean Terrace', promptFragment: 'elegant Mediterranean villa terrace overlooking azure sea, white architecture, bougainvillea, soft evening light', whyTrending: 'Mediterranean aesthetic viral for luxury lifestyle' },
    { name: 'Art Gallery Opening', promptFragment: 'modern art gallery with minimalist white walls, dramatic spotlight lighting, sophisticated evening atmosphere', whyTrending: 'Cultural events content trending for fashion influencers' },
  ];
  
  const outfits = [
    { name: 'Metallic High-Cut Swimwear', promptFragment: 'elegant metallic high-cut swimwear in champagne gold, flattering V-front silhouette emphasizing curves, luxe resort aesthetic', whyTrending: 'Metallic swimwear trending for curvy models' },
    { name: 'Satin Slip Set', promptFragment: 'coordinated satin bralette and bias-cut slip skirt in warm nude tone, delicate intimate sleepwear aesthetic, elegant loungewear', whyTrending: 'Satin co-ords viral for evening content' },
    { name: 'Athletic Loungewear', promptFragment: 'matching ribbed athletic loungewear set, soft support crop top with high-waist shorts, sporty chic aesthetic', whyTrending: 'Athletic intimates trending as lifestyle content' },
  ];
  
  const poses = [
    { name: 'Seated Edge Lean', promptFragment: 'seated on edge, leaning back on hands, one leg extended, body arched naturally, looking away from camera lost in thought', whyTrending: 'Candid seated poses viral for pool/lounge content' },
    { name: 'Over-Shoulder Glance', promptFragment: 'walking away from camera, looking over shoulder with soft knowing smile, caught mid-movement candid moment', whyTrending: 'Walk-away shots trending for storytelling' },
    { name: 'Window Silhouette', promptFragment: 'standing by window in backlight, silhouette emphasized, profile view, contemplative expression not looking at camera', whyTrending: 'Silhouette content viral for intimate aesthetic' },
  ];
  
  const captions = [
    `Some views are better without explanation. ✨\n\nI found this corner by accident, stayed for the light, left with memories I'll probably post tomorrow.\n\nThe rest of this set is on my private. 🖤`,
    `Tell me your favorite kind of trouble… and I'll dress for it.\n\nGolden hour, soft fabric, and a city that doesn't ask questions. Paris taught me that some moments are meant to be felt, not planned.\n\nThe rest of this set is on my private. 🖤`,
    `Not all who wander are lost… some of us are just looking for better lighting.\n\nThis morning I woke up and chose chaos. The good kind. The kind that looks effortless but took three outfit changes.\n\nThe rest of this set is on my private. 🖤`,
  ];
  
  const idx = Math.floor(Math.random() * 3);
  
  return {
    location: locations[idx],
    outfit: outfits[idx],
    pose: poses[idx],
    caption: captions[idx],
    mood: ['dreamy', 'confident', 'playful'][idx],
    source: 'fallback',
  };
}

function getFallbackTrendingSafe(topPerformers) {
  // Use top performers to guide fallback
  const hasTravel = topPerformers.locations?.some(l => 
    l.toLowerCase().includes('bali') || l.toLowerCase().includes('travel') || l.toLowerCase().includes('golden')
  );
  
  if (hasTravel) {
    return {
      location: { 
        name: 'Tropical Villa Morning', 
        promptFragment: 'luxury tropical villa with infinity pool overlooking rice terraces, soft morning golden light, paradise atmosphere, Bali-inspired setting',
        whyTrending: 'Similar to top performer: Bali/travel content',
        similarTo: 'Bali morning content'
      },
      outfit: { 
        name: 'Resort Swimwear', 
        promptFragment: 'elegant high-cut swimwear in warm neutral tone, flattering silhouette, luxury resort aesthetic',
        whyTrending: 'Swimwear performs well in travel content'
      },
      pose: { 
        name: 'Poolside Contemplation', 
        promptFragment: 'sitting at pool edge, feet in water, looking at horizon not camera, peaceful morning moment',
        whyTrending: 'Candid pool moments match top performers'
      },
      caption: `Missing these mornings... ✨\n\nThe ones where the only sound is water and the only plan is none. Bali taught me that some of the best moments come when you stop trying to capture them.\n\nThe rest of this set is on my private. 🖤`,
      mood: 'nostalgic',
      source: 'fallback_safe',
    };
  }
  
  // Default safe fallback
  return {
    location: { 
      name: 'Golden Hour Terrace', 
      promptFragment: 'elegant Parisian terrace at golden hour, warm amber light, city rooftops in background, romantic evening atmosphere',
      whyTrending: 'Golden hour content consistently performs',
      similarTo: 'Golden hour top performers'
    },
    outfit: { 
      name: 'Evening Loungewear', 
      promptFragment: 'elegant satin slip dress in warm nude, thin straps, flattering silhouette, intimate evening aesthetic',
      whyTrending: 'Evening intimate content matches audience preferences'
    },
    pose: { 
      name: 'Terrace Lean', 
      promptFragment: 'leaning on terrace railing, looking at city view not camera, wind in hair, contemplative elegant moment',
      whyTrending: 'Candid terrace shots match successful patterns'
    },
    caption: `Golden hour in Paris hits different...\n\nThere's something about this light that makes everything feel possible. And maybe a little dangerous.\n\nThe rest of this set is on my private. 🖤`,
    mood: 'romantic',
    source: 'fallback_safe',
  };
}

// ═══════════════════════════════════════════════════════════════
// FORMAT FOR PROMPT (used in Content Brain)
// ═══════════════════════════════════════════════════════════════

export function formatTrendingForPrompt(trendingExperiment, trendingSafe) {
  let output = '';
  
  if (trendingExperiment) {
    output += `### 🧪 TRENDING CONTENT (14h EXPERIMENT)
**Location**: ${trendingExperiment.location.name}
→ ${trendingExperiment.location.whyTrending}
→ Prompt: "${trendingExperiment.location.promptFragment.substring(0, 100)}..."

**Outfit (Petite Tenue)**: ${trendingExperiment.outfit.name}
→ ${trendingExperiment.outfit.whyTrending}
→ Prompt: "${trendingExperiment.outfit.promptFragment.substring(0, 100)}..."

**Pose**: ${trendingExperiment.pose.name}
→ ${trendingExperiment.pose.whyTrending}

**Suggested Caption**:
"${trendingExperiment.caption.substring(0, 150)}..."

**Mood**: ${trendingExperiment.mood}
**Source**: ${trendingExperiment.source}

`;
  }
  
  if (trendingSafe) {
    output += `### ✅ TRENDING CONTENT (21h SAFE)
**Location**: ${trendingSafe.location.name}
→ ${trendingSafe.location.whyTrending}
${trendingSafe.location.similarTo ? `→ Similar to: ${trendingSafe.location.similarTo}` : ''}
→ Prompt: "${trendingSafe.location.promptFragment.substring(0, 100)}..."

**Outfit (Petite Tenue)**: ${trendingSafe.outfit.name}
→ ${trendingSafe.outfit.whyTrending}
→ Prompt: "${trendingSafe.outfit.promptFragment.substring(0, 100)}..."

**Pose**: ${trendingSafe.pose.name}
→ ${trendingSafe.pose.whyTrending}

**Suggested Caption**:
"${trendingSafe.caption.substring(0, 150)}..."

**Mood**: ${trendingSafe.mood}
**Source**: ${trendingSafe.source}
`;
  }
  
  return output || 'No trending content available.';
}

// ═══════════════════════════════════════════════════════════════
// EXTRACT TOP PERFORMERS FROM ANALYTICS
// ═══════════════════════════════════════════════════════════════

export function extractTopPerformers(analytics) {
  if (!analytics?.posts?.length) {
    return {
      locations: ['golden hour', 'Bali', 'travel'],
      themes: ['vacation nostalgia', 'intimate moments'],
      outfitStyles: ['swimwear', 'loungewear'],
    };
  }
  
  // Sort by engagement
  const sorted = [...analytics.posts].sort((a, b) => 
    ((b.like_count || 0) + (b.comments_count || 0) * 2) - 
    ((a.like_count || 0) + (a.comments_count || 0) * 2)
  );
  
  // Take top 5
  const top5 = sorted.slice(0, 5);
  
  // Extract patterns
  const locations = [];
  const themes = [];
  const outfitStyles = [];
  
  top5.forEach(post => {
    const caption = (post.caption || '').toLowerCase();
    
    // Location patterns
    if (caption.includes('bali') || caption.includes('rice')) locations.push('Bali');
    if (caption.includes('golden hour') || caption.includes('golden')) locations.push('golden hour');
    if (caption.includes('paris') || caption.includes('parisian')) locations.push('Paris');
    if (caption.includes('spa') || caption.includes('pool')) locations.push('spa/pool');
    if (caption.includes('beach') || caption.includes('ocean')) locations.push('beach');
    if (caption.includes('hotel') || caption.includes('suite')) locations.push('hotel');
    
    // Theme patterns
    if (caption.includes('missing') || caption.includes('throwback')) themes.push('vacation nostalgia');
    if (caption.includes('morning') || caption.includes('sunrise')) themes.push('morning moments');
    if (caption.includes('night') || caption.includes('evening')) themes.push('evening vibes');
    if (caption.includes('cozy') || caption.includes('cosy')) themes.push('cozy intimate');
    
    // Outfit patterns (from prompt_hints if available)
    const hints = (post.prompt_hints || '').toLowerCase();
    if (hints.includes('swimwear') || hints.includes('bikini')) outfitStyles.push('swimwear');
    if (hints.includes('loungewear') || hints.includes('robe')) outfitStyles.push('loungewear');
    if (hints.includes('dress') || hints.includes('slip')) outfitStyles.push('slip dress');
  });
  
  return {
    locations: [...new Set(locations)].slice(0, 5) || ['golden hour', 'Bali'],
    themes: [...new Set(themes)].slice(0, 3) || ['vacation nostalgia'],
    outfitStyles: [...new Set(outfitStyles)].slice(0, 3) || ['swimwear', 'loungewear'],
  };
}
