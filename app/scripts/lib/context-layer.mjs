/**
 * Context Layer — Real-time context from Perplexity/Web
 * 
 * Fetches current events, weather, trends to make content relevant
 */

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

/**
 * Fetch real-time context for content decisions
 * @param {string} location - Current location ('paris', 'milan', etc.)
 * @returns {Promise<ContextData>}
 */
export async function fetchContext(location = 'paris') {
  console.log(`   🌍 Fetching real-time context for ${location}...`);

  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    console.log(`      ⚠️  PERPLEXITY_API_KEY not set — using fallback context`);
    return getFallbackContext(location);
  }

  try {
    const today = new Date();
    const dateStr = today.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });

    const prompt = `Tu es un assistant recherche pour créer du contenu Instagram lifestyle/mode viral.

Date: ${dateStr}
Location: ${location}

Recherche les informations TEMPS RÉEL suivantes:

1. **Instagram Trending Hashtags TODAY** — Les hashtags qui buzzent AUJOURD'HUI en France (lifestyle, mode, beauté). Cherche les vrais trends du jour, pas des génériques.
2. **Viral Content Formats** — Quel format performe le mieux CETTE SEMAINE sur Instagram (photo dump, carousel storytelling, outfit transition, get ready with me, etc.)
3. **Fashion/Lifestyle Events** — Événements mode en cours ou à venir (Fashion Week, lancements marques, collabs, événements Paris)
4. **Weather ${location}** — Météo actuelle (température, conditions)

Format JSON uniquement:
{
  "weather": {
    "temp": 8,
    "condition": "nuageux",
    "suggestion": "indoor" ou "outdoor"
  },
  "trending_hashtags_today": ["#hashtag1", "#hashtag2", "#hashtag3"],
  "viral_format": "carousel storytelling" ou "photo dump" ou "outfit transition" ou autre,
  "fashion_events": ["event1", "event2"],
  "events": ["event contextuel"],
  "content_recommendation": "Ce qui marcherait bien aujourd'hui spécifiquement",
  "seasonalContext": "Contexte saisonnier (Noël, Nouvel An, etc.)"
}`;

    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.log(`      ⚠️  Perplexity API error: ${response.status}`);
      return getFallbackContext(location);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return getFallbackContext(location);
    }

    // Parse JSON from response
    let jsonStr = content;
    if (content.includes('```json')) {
      jsonStr = content.split('```json')[1].split('```')[0];
    } else if (content.includes('```')) {
      jsonStr = content.split('```')[1].split('```')[0];
    } else {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonStr = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonStr.trim());

    console.log(`      ✅ Context fetched: ${parsed.weather?.temp}°C, ${parsed.weather?.condition}`);
    console.log(`      Viral format: ${parsed.viral_format || 'N/A'}`);
    console.log(`      Recommendation: ${parsed.content_recommendation || parsed.recommendation}`);
    if (parsed.trending_hashtags_today?.length > 0) {
      console.log(`      Trending TODAY: ${parsed.trending_hashtags_today.slice(0, 5).join(' ')}`);
    }
    if (parsed.fashion_events?.length > 0) {
      console.log(`      Fashion events: ${parsed.fashion_events.join(', ')}`);
    }

    return {
      weather: parsed.weather || { temp: null, condition: 'unknown', suggestion: 'any' },
      events: parsed.events || [],
      trends: parsed.trending_hashtags_today || parsed.trends || [],
      viralFormat: parsed.viral_format || null,
      fashionEvents: parsed.fashion_events || [],
      recommendation: parsed.content_recommendation || parsed.recommendation || '',
      seasonalContext: parsed.seasonalContext || '',
      fetchedAt: new Date().toISOString(),
      source: 'perplexity',
    };

  } catch (error) {
    console.log(`      ⚠️  Error fetching context: ${error.message}`);
    return getFallbackContext(location);
  }
}

/**
 * Get fallback context based on date and location (no API)
 */
function getFallbackContext(location = 'paris') {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();
  const dayOfWeek = now.getDay();

  // Seasonal context
  let seasonalContext = '';
  let weatherSuggestion = 'any';
  let estimatedTemp = 15;

  if (month === 11) { // December
    seasonalContext = 'Période de Noël — ambiance festive et cozy';
    weatherSuggestion = 'indoor';
    estimatedTemp = 8;
    
    if (day >= 20 && day <= 26) {
      seasonalContext = 'Semaine de Noël — contenu festif recommandé';
    }
    if (day >= 27) {
      seasonalContext = 'Entre Noël et Nouvel An — ambiance fêtes';
    }
  } else if (month === 0) { // January
    seasonalContext = 'Nouvelle année — bonnes résolutions, fresh start';
    weatherSuggestion = 'indoor';
    estimatedTemp = 5;
  } else if (month >= 6 && month <= 8) { // Summer
    seasonalContext = 'Été — vacances, plage, outdoor content';
    weatherSuggestion = 'outdoor';
    estimatedTemp = 25;
  } else if (month >= 3 && month <= 5) { // Spring
    seasonalContext = 'Printemps — renouveau, outdoor, terrasses';
    weatherSuggestion = 'outdoor';
    estimatedTemp = 18;
  } else if (month >= 9 && month <= 10) { // Fall
    seasonalContext = 'Automne — cozy vibes, mode, rentrée';
    weatherSuggestion = 'any';
    estimatedTemp = 12;
  }

  // Day of week context
  let dayContext = '';
  if (dayOfWeek === 0) {
    dayContext = 'Dimanche — contenu relaxation, self-care';
  } else if (dayOfWeek === 6) {
    dayContext = 'Samedi — sortie, brunch, activités';
  } else if (dayOfWeek === 5) {
    dayContext = 'Vendredi — anticipation weekend, soirée';
  } else if (dayOfWeek === 1) {
    dayContext = 'Lundi — motivation, routine, productivité';
  }

  // Events based on date
  const events = [];
  if (month === 11 && day >= 15 && day <= 25) {
    events.push('Marchés de Noël');
  }
  if (month === 11 && day >= 20 && day <= 31) {
    events.push('Préparation fêtes');
  }
  if (month === 0 && day === 1) {
    events.push('Jour de l\'An');
  }
  if (dayContext) {
    events.push(dayContext);
  }

  // Default trends
  const trends = getSeasonalTrends(month);

  const recommendation = generateRecommendation(seasonalContext, dayOfWeek, weatherSuggestion);

  // Default viral formats by season
  const viralFormat = getViralFormat(month, dayOfWeek);
  
  return {
    weather: {
      temp: estimatedTemp,
      condition: weatherSuggestion === 'indoor' ? 'froid' : 'agréable',
      suggestion: weatherSuggestion,
    },
    events,
    trends,
    viralFormat,
    fashionEvents: getFashionEvents(month, day),
    recommendation,
    seasonalContext,
    fetchedAt: new Date().toISOString(),
    source: 'fallback',
  };
}

function getViralFormat(month, dayOfWeek) {
  // Carousel storytelling is generally safe and performs well
  const formats = [
    'carousel storytelling',
    'photo dump aesthetic',
    'outfit of the day carousel',
    'day in my life carousel',
  ];
  
  // Weekend = more lifestyle content
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return 'photo dump aesthetic';
  }
  
  // Winter = cozy content
  if (month >= 11 || month <= 1) {
    return 'carousel storytelling';
  }
  
  // Summer = travel/outdoor
  if (month >= 6 && month <= 8) {
    return 'photo dump aesthetic';
  }
  
  return formats[Math.floor(Math.random() * formats.length)];
}

function getFashionEvents(month, day) {
  const events = [];
  
  // Fashion Weeks (approximate dates)
  if (month === 1 && day >= 20) events.push('New York Fashion Week (soon)');
  if (month === 2 && day <= 10) events.push('New York Fashion Week');
  if (month === 2 && day >= 20) events.push('Milan Fashion Week');
  if (month === 2 && day >= 25 || month === 3 && day <= 5) events.push('Paris Fashion Week');
  
  if (month === 8 && day >= 5) events.push('New York Fashion Week SS (soon)');
  if (month === 8 && day >= 20) events.push('Milan Fashion Week SS');
  if (month === 9 && day <= 10) events.push('Paris Fashion Week SS');
  
  return events;
}

function getSeasonalTrends(month) {
  const winterTrends = ['#cozy', '#wintervibes', '#hygge', '#cozyhome', '#winterstyle'];
  const springTrends = ['#springvibes', '#freshstart', '#terrace', '#parisspring', '#blooming'];
  const summerTrends = ['#summervibes', '#beachlife', '#vacationmode', '#summerstyle', '#sunkissed'];
  const fallTrends = ['#autumnvibes', '#fallstyle', '#cozyseason', '#pumpkinseason', '#sweaterweather'];
  const christmasTrends = ['#christmas', '#christmasvibes', '#holidayseason', '#merrychristmas', '#festive'];

  if (month === 11 || month === 0) return christmasTrends;
  if (month >= 1 && month <= 2) return winterTrends;
  if (month >= 3 && month <= 5) return springTrends;
  if (month >= 6 && month <= 8) return summerTrends;
  return fallTrends;
}

function generateRecommendation(seasonalContext, dayOfWeek, weatherSuggestion) {
  const parts = [];

  if (weatherSuggestion === 'indoor') {
    parts.push('Privilégier contenu intérieur (home, cozy)');
  } else if (weatherSuggestion === 'outdoor') {
    parts.push('Bon moment pour contenu extérieur');
  }

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    parts.push('Weekend = engagement élevé');
  }

  if (seasonalContext.includes('Noël')) {
    parts.push('Ambiance festive recommandée');
  }

  return parts.join(' — ') || 'Contenu lifestyle standard';
}

/**
 * Format context for prompt inclusion
 */
export function formatContextForPrompt(context) {
  if (!context) {
    return `Pas de contexte temps réel disponible.`;
  }

  let output = `### Météo:\n`;
  output += `${context.weather.temp}°C, ${context.weather.condition}\n`;
  output += `→ Suggestion: contenu ${context.weather.suggestion}\n`;

  if (context.events.length > 0) {
    output += `\n### Événements/Contexte:\n`;
    context.events.forEach(e => {
      output += `- ${e}\n`;
    });
  }

  if (context.fashionEvents?.length > 0) {
    output += `\n### 🎀 Fashion Events:\n`;
    context.fashionEvents.forEach(e => {
      output += `- ${e}\n`;
    });
  }

  if (context.seasonalContext) {
    output += `\n### Contexte saisonnier:\n`;
    output += `${context.seasonalContext}\n`;
  }

  if (context.viralFormat) {
    output += `\n### 🔥 Format viral du moment:\n`;
    output += `→ ${context.viralFormat}\n`;
  }

  if (context.trends.length > 0) {
    output += `\n### Hashtags trending TODAY:\n`;
    output += context.trends.slice(0, 10).join(' ') + '\n';
  }

  if (context.recommendation) {
    output += `\n### Recommandation:\n`;
    output += `→ ${context.recommendation}\n`;
  }

  return output;
}

