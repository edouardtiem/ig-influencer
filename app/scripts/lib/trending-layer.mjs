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

⚠️ CRITICAL: We have TOO MUCH beach/pool/vacation content lately. Need VARIETY.

This is for the EXPERIMENT slot (14h) — be CREATIVE, try something NEW and DIFFERENT.

Based on what's trending RIGHT NOW on Instagram (January 2026), give me:

## 1. TRENDING LOCATION (1)
- Something FRESH and visually stunning
- 🚫 BANNED: Bali, Mykonos, Maldives, yacht, St Tropez, Ibiza, Dubai (OVERUSED)
- ✅ PREFERRED: Paris urban, Milan fashion, London exclusive, art/culture, nightlife, hotel interiors, winter destinations
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
// FETCH TRENDING CONTENT (SAFE MODE - Classic/timeless trending, NO analytics bias)
// ═══════════════════════════════════════════════════════════════

export async function fetchTrendingSafe(recentLocations = []) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    console.log('   ⚠️ PERPLEXITY_API_KEY not found, using fallback');
    return getFallbackTrendingSafe();
  }

  // Build avoid list from recent locations
  const avoidList = recentLocations.length > 0 
    ? `🚫 AVOID these locations (already used recently): ${recentLocations.join(', ')}`
    : '';

  const systemPrompt = `You are an Instagram content strategist specializing in timeless, elegant content for female lifestyle influencers. You focus on CLASSIC aesthetics that always perform well, not fleeting trends.`;

  const userPrompt = `I need SAFE/CLASSIC content for Elena Visconti (@elenav.paris), a 24yo curvy Italian model in Paris.

Her aesthetic: "Street-luxe Paris Mannequin 2025" - glamorous, warm, confident, curves emphasized tastefully.
Target audience: Men 26-35yo with disposable income.

${avoidList}

This is for the SAFE slot (21h) — focus on TIMELESS, CLASSIC content that always works.

## STYLE DIRECTION
NOT looking for experimental/edgy content. Looking for:
- Elegant, sophisticated, timeless
- Classic luxury aesthetics (Paris, Milan, elegant interiors)
- Intimate but tasteful (bedroom, boudoir, spa)
- Golden hour, soft lighting, romantic vibes

## 1. CLASSIC LOCATION (1)
Pick something TIMELESS and ELEGANT:
- Paris: rooftops, boudoirs, luxury hotels, elegant apartments
- European cities: Milan, London members clubs, Mediterranean terraces
- Intimate settings: luxury bedrooms, spa, candlelit spaces
- 🚫 NOT: Overused beach/pool destinations (Bali, Mykonos, Maldives, yacht)

## 2. CLASSIC "PETITE TENUE" (1)
Elegant, timeless outfit that always works:
- Silk/satin slip dress or nightwear
- Classic lingerie-inspired looks (lace, delicate)
- Cashmere loungewear, elegant robes

Use SAFE VOCABULARY for AI:
- "lingerie" → "intimate sleepwear" or "delicate loungewear"
- "sexy" → "alluring" or "captivating"

## 3. ELEGANT POSE (1)
Classic, timeless poses:
- Mirror reflection moments
- Window light silhouettes
- Seated elegance, terrace contemplation
- Candid getting-ready moments

## 4. CAPTION
Micro-story format:
- Atmospheric hook + 2-3 story lines + soft CTA to private
- Elegant, mysterious, confident tone

Format as JSON:
{
  "location": { "name": "...", "promptFragment": "detailed setting for AI", "whyTrending": "why this is timeless" },
  "outfit": { "name": "...", "promptFragment": "safe vocabulary outfit description", "whyTrending": "..." },
  "pose": { "name": "...", "promptFragment": "pose description", "whyTrending": "..." },
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
    return getFallbackTrendingSafe();
  }
}

// ═══════════════════════════════════════════════════════════════
// FALLBACKS (when Perplexity unavailable)
// ═══════════════════════════════════════════════════════════════

function getFallbackTrending() {
  // DIVERSE fallback locations — NOT just beaches/pools
  const locations = [
    // Urban/City vibes
    { name: 'Paris Rooftop Champagne', promptFragment: 'elegant Parisian rooftop terrace at golden hour, zinc rooftops stretching to horizon, Eiffel Tower silhouette in distance, champagne glasses, warm amber sunset light, sophisticated evening atmosphere', whyTrending: 'Parisian rooftop content viral for European influencers', category: 'paris' },
    { name: 'Milan Design Hotel Lobby', promptFragment: 'sleek Milan design hotel lobby, Italian marble floors, contemporary furniture, dramatic floor-to-ceiling windows, golden afternoon light, fashion capital elegance', whyTrending: 'Milan fashion content trending during fashion season', category: 'urban' },
    { name: 'London Members Club', promptFragment: 'exclusive London members club interior, Mayfair elegance, dark wood paneling, velvet furniture, warm fireplace glow, intimate sophisticated atmosphere', whyTrending: 'Exclusive club content trending for luxury lifestyle', category: 'urban' },
    { name: 'Art Gallery Private View', promptFragment: 'modern art gallery private viewing, minimalist white walls with bold contemporary art, dramatic spotlight lighting, champagne in hand, sophisticated cultural evening', whyTrending: 'Cultural events content trending for fashion influencers', category: 'paris' },
    { name: 'Parisian Boudoir', promptFragment: 'elegant Parisian boudoir, ornate gilded mirror, soft velvet chaise longue, warm candlelight, romantic intimate atmosphere, Haussmann apartment details', whyTrending: 'Intimate Parisian content viral for European aesthetic', category: 'paris' },
    // Spa/Wellness (different vibe)
    { name: 'Alpine Spa Sunset', promptFragment: 'luxury alpine spa exterior pool, steam rising against snow-capped mountains, warm golden sunset light, cozy winter wellness atmosphere', whyTrending: 'Winter wellness content trending in January', category: 'spa' },
    // Only 1 beach option in fallback
    { name: 'Amalfi Coast Terrace', promptFragment: 'elegant Amalfi Coast terrace overlooking Positano, lemon trees, bougainvillea, pastel village houses cascading to azure sea, golden hour Italian summer', whyTrending: 'Italian Riviera aesthetic always performs', category: 'travel' },
  ];
  
  const outfits = [
    { name: 'Satin Slip Dress', promptFragment: 'elegant satin slip dress in champagne gold, thin straps, flattering silhouette falling to mid-thigh, sophisticated evening aesthetic', whyTrending: 'Satin slip dresses viral for evening content' },
    { name: 'Sheer Bodysuit + Trousers', promptFragment: 'delicate sheer bodysuit in black with high-waisted tailored trousers, elegant evening look, confident feminine silhouette', whyTrending: 'Bodysuit layering trending for fashion-forward content' },
    { name: 'Cashmere Loungewear', promptFragment: 'luxurious cashmere loungewear set in warm camel, cropped sweater with matching wide-leg pants, cozy elegant at-home aesthetic', whyTrending: 'Elevated loungewear trending for cozy content' },
    { name: 'LBD Parisian', promptFragment: 'classic little black dress, elegant cut, subtle décolleté, timeless Parisian chic, sophisticated evening', whyTrending: 'Classic LBD always performs for evening content' },
    { name: 'Athletic Loungewear', promptFragment: 'matching ribbed athletic loungewear set, soft support crop top with high-waist shorts, sporty chic aesthetic', whyTrending: 'Athletic intimates trending as lifestyle content' },
  ];
  
  const poses = [
    { name: 'Terrace Lean', promptFragment: 'leaning elegantly on terrace railing, looking at city view not camera, wind gently moving hair, contemplative sophisticated moment', whyTrending: 'Candid terrace shots trending for storytelling' },
    { name: 'Mirror Reflection', promptFragment: 'caught in ornate mirror reflection, adjusting earring or hair, candid getting-ready moment, intimate behind-the-scenes', whyTrending: 'Mirror content viral for intimate aesthetic' },
    { name: 'Seated Elegance', promptFragment: 'seated elegantly on velvet chair, legs crossed, one hand on armrest, confident knowing expression, sophisticated portrait', whyTrending: 'Seated portrait poses trending for fashion content' },
    { name: 'Walking Away', promptFragment: 'walking away from camera down elegant corridor, looking over shoulder with soft smile, caught mid-movement, dynamic', whyTrending: 'Walk-away shots viral for storytelling' },
    { name: 'Window Light', promptFragment: 'standing by tall window in natural light, profile view, contemplative expression, silhouette partially visible, artistic', whyTrending: 'Window light content trending for artistic aesthetic' },
  ];
  
  const captions = [
    `Some places just feel like they were waiting for you...\n\nParis at golden hour. The kind of light that makes everything look like a memory, even while you're still in it.\n\nThe rest of this set is on my private. 🖤`,
    `Tell me your favorite kind of trouble… and I'll dress for it.\n\nEvening plans that started as "just one drink" and ended somewhere between champagne and chaos. The best nights always do.\n\nThe rest of this set is on my private. 🖤`,
    `The art of doing nothing, but making it look intentional.\n\nSome evenings are meant for thinking. Others are meant for not thinking at all. This was the second kind.\n\nThe rest of this set is on my private. 🖤`,
    `Caught somewhere between yesterday and tomorrow...\n\nThere's something about this light that makes you want to stay a little longer. So I did.\n\nThe rest of this set is on my private. 🖤`,
    `Main character energy hits different when no one's watching.\n\nQuiet moments before the chaos. The calm before whatever comes next. I've learned to love these pauses.\n\nThe rest of this set is on my private. 🖤`,
  ];
  
  // Weighted random selection — prefer Paris/urban content
  const parisLocations = locations.filter(l => l.category === 'paris' || l.category === 'urban');
  const useParisFirst = Math.random() < 0.6; // 60% chance to pick Paris/urban
  
  const selectedLocations = useParisFirst ? parisLocations : locations;
  const locIdx = Math.floor(Math.random() * selectedLocations.length);
  const outfitIdx = Math.floor(Math.random() * outfits.length);
  const poseIdx = Math.floor(Math.random() * poses.length);
  const captionIdx = Math.floor(Math.random() * captions.length);
  
  const moods = ['confident', 'dreamy', 'playful', 'sophisticated', 'cozy'];
  
  return {
    location: selectedLocations[locIdx],
    outfit: outfits[outfitIdx],
    pose: poses[poseIdx],
    caption: captions[captionIdx],
    mood: moods[Math.floor(Math.random() * moods.length)],
    source: 'fallback',
  };
}

function getFallbackTrendingSafe() {
  // SAFE fallback — classic, timeless content (no analytics bias)
  // Weighted random selection for variety

  const safeOptions = [
    // Option 1: Paris Evening (high weight — need more Paris content)
    {
      weight: 3,
      location: { 
        name: 'Paris Evening Glow', 
        promptFragment: 'elegant Parisian terrace at golden hour, warm amber light, zinc rooftops stretching to horizon, Eiffel Tower silhouette, romantic evening atmosphere',
        whyTrending: 'Golden hour Paris content consistently performs',
        similarTo: 'Golden hour top performers'
      },
      outfit: { 
        name: 'Satin Slip Evening', 
        promptFragment: 'elegant satin slip dress in warm champagne, thin straps, flattering silhouette falling elegantly, sophisticated evening aesthetic',
        whyTrending: 'Evening intimate content matches audience preferences'
      },
      pose: { 
        name: 'Terrace Contemplation', 
        promptFragment: 'leaning elegantly on terrace railing, looking at city view not camera, wind gently in hair, contemplative sophisticated moment',
        whyTrending: 'Candid terrace shots match successful patterns'
      },
      caption: `Golden hour in Paris hits different...\n\nThere's something about this light that makes everything feel possible. And maybe a little dangerous. The city doesn't ask questions at this hour.\n\nThe rest of this set is on my private. 🖤`,
      mood: 'romantic',
    },
    // Option 2: Cozy Bedroom (medium weight)
    {
      weight: 2,
      location: { 
        name: 'Parisian Bedroom Morning', 
        promptFragment: 'elegant Parisian bedroom, soft morning light through tall windows, white linen sheets, warm intimate atmosphere, Haussmann apartment details',
        whyTrending: 'Intimate bedroom content performs well for engagement',
        similarTo: 'Cozy intimate top performers'
      },
      outfit: { 
        name: 'Delicate Loungewear', 
        promptFragment: 'delicate silk camisole and shorts set in soft blush, intimate loungewear aesthetic, elegant at-home moment',
        whyTrending: 'Loungewear content matches cozy aesthetic preferences'
      },
      pose: { 
        name: 'Bed Stretch', 
        promptFragment: 'stretching lazily in bed, arms above head, soft smile, morning light on face, candid waking up moment',
        whyTrending: 'Morning stretch content viral for intimate aesthetic'
      },
      caption: `Some mornings deserve to be slow...\n\nThe ones where the light is too perfect to rush through. Where the sheets are warm and the coffee can wait. This was one of those.\n\nThe rest of this set is on my private. 🖤`,
      mood: 'cozy',
    },
    // Option 3: Spa/Wellness (medium weight)
    {
      weight: 2,
      location: { 
        name: 'Luxury Spa Evening', 
        promptFragment: 'luxury spa interior, steam rising, warm ambient lighting, marble surfaces, peaceful wellness atmosphere, champagne nearby',
        whyTrending: 'Spa wellness content trending for self-care aesthetic',
        similarTo: 'Wellness top performers'
      },
      outfit: { 
        name: 'Spa Robe Elegance', 
        promptFragment: 'plush white spa robe slightly open, elegant confident posture, fresh glowing skin, post-treatment radiance',
        whyTrending: 'Robe content performs well for spa aesthetic'
      },
      pose: { 
        name: 'Spa Relaxation', 
        promptFragment: 'seated by spa pool edge, robe draped elegantly, looking away in peaceful contemplation, steam atmosphere',
        whyTrending: 'Relaxation poses match wellness content patterns'
      },
      caption: `Self-care isn't selfish, it's survival...\n\nSome evenings you need to disappear. Steam, silence, and absolutely no notifications. The kind of reset that makes tomorrow feel possible.\n\nThe rest of this set is on my private. 🖤`,
      mood: 'relaxed',
    },
    // Option 4: Urban Night (lower weight — variety)
    {
      weight: 1,
      location: { 
        name: 'Cocktail Bar Evening', 
        promptFragment: 'sophisticated cocktail bar interior, warm ambient lighting, velvet seating, elegant glassware, intimate evening atmosphere',
        whyTrending: 'Evening out content trending for lifestyle aesthetic',
        similarTo: 'Evening lifestyle content'
      },
      outfit: { 
        name: 'Little Black Dress', 
        promptFragment: 'elegant little black dress, subtle décolleté, timeless Parisian chic, sophisticated evening out aesthetic',
        whyTrending: 'LBD content classic performer for evening'
      },
      pose: { 
        name: 'Bar Lean', 
        promptFragment: 'leaning elegantly at bar, cocktail in hand, soft knowing smile, looking slightly away from camera, candid evening out',
        whyTrending: 'Candid bar shots trending for nightlife content'
      },
      caption: `The best conversations happen after midnight...\n\nWhen the music gets quieter and the questions get realer. Some people are better in low light. I think I'm one of them.\n\nThe rest of this set is on my private. 🖤`,
      mood: 'confident',
    },
  ];
  
  // Weighted random selection
  const totalWeight = safeOptions.reduce((sum, opt) => sum + opt.weight, 0);
  let random = Math.random() * totalWeight;
  
  let selected = safeOptions[0];
  for (const option of safeOptions) {
    random -= option.weight;
    if (random <= 0) {
      selected = option;
      break;
    }
  }
  
  return {
    location: selected.location,
    outfit: selected.outfit,
    pose: selected.pose,
    caption: selected.caption,
    mood: selected.mood,
    source: 'fallback_safe',
  };
}

// ═══════════════════════════════════════════════════════════════
// FORMAT FOR PROMPT (used in Content Brain)
// ═══════════════════════════════════════════════════════════════

/**
 * Sanitize string to remove invalid Unicode surrogates that break JSON
 */
function sanitizeString(str) {
  if (!str) return '';
  // Remove unpaired surrogates that cause JSON errors
  return str.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
}

export function formatTrendingForPrompt(trendingExperiment, trendingSafe) {
  let output = '';
  
  if (trendingExperiment) {
    const te = trendingExperiment;
    output += `### 🧪 TRENDING CONTENT (14h EXPERIMENT)
**Location**: ${sanitizeString(te.location?.name)}
→ ${sanitizeString(te.location?.whyTrending)}
→ Prompt: "${sanitizeString(te.location?.promptFragment || '').substring(0, 100)}..."

**Outfit (Petite Tenue)**: ${sanitizeString(te.outfit?.name)}
→ ${sanitizeString(te.outfit?.whyTrending)}
→ Prompt: "${sanitizeString(te.outfit?.promptFragment || '').substring(0, 100)}..."

**Pose**: ${sanitizeString(te.pose?.name)}
→ ${sanitizeString(te.pose?.whyTrending)}

**Suggested Caption**:
"${sanitizeString(te.caption || '').substring(0, 150)}..."

**Mood**: ${sanitizeString(te.mood)}
**Source**: ${te.source}

`;
  }
  
  if (trendingSafe) {
    const ts = trendingSafe;
    output += `### ✅ TRENDING CONTENT (21h SAFE/CLASSIC)
**Location**: ${sanitizeString(ts.location?.name)}
→ ${sanitizeString(ts.location?.whyTrending)}
${ts.location?.similarTo ? `→ Similar to: ${sanitizeString(ts.location.similarTo)}` : ''}
→ Prompt: "${sanitizeString(ts.location?.promptFragment || '').substring(0, 100)}..."

**Outfit (Petite Tenue)**: ${sanitizeString(ts.outfit?.name)}
→ ${sanitizeString(ts.outfit?.whyTrending)}
→ Prompt: "${sanitizeString(ts.outfit?.promptFragment || '').substring(0, 100)}..."

**Pose**: ${sanitizeString(ts.pose?.name)}
→ ${sanitizeString(ts.pose?.whyTrending)}

**Suggested Caption**:
"${sanitizeString(ts.caption || '').substring(0, 150)}..."

**Mood**: ${sanitizeString(ts.mood)}
**Source**: ${ts.source}
`;
  }
  
  return output || 'No trending content available.';
}

// NOTE: extractTopPerformers() was removed to avoid analytics bias
// The trending layer now uses Perplexity 100% for both EXPERIMENT and SAFE slots
// This prevents the circular "Bali performs well → more Bali → Bali performs well" loop
