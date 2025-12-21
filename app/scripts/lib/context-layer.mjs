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

    const prompt = `Tu es un assistant qui aide à créer du contenu Instagram lifestyle/mode.

Date: ${dateStr}
Location: ${location}

Donne-moi des informations contextuelles pour créer du contenu pertinent:

1. **Météo** à ${location} aujourd'hui (température, conditions)
2. **Événements** actuels ou à venir (fêtes, événements mode, culturels)
3. **Trends Instagram** France actuels (hashtags lifestyle/mode)
4. **Ambiance** recommandée pour le contenu aujourd'hui

Format JSON uniquement:
{
  "weather": {
    "temp": 8,
    "condition": "nuageux",
    "suggestion": "indoor" ou "outdoor"
  },
  "events": ["event1", "event2"],
  "trends": ["#hashtag1", "#hashtag2"],
  "recommendation": "Type de contenu recommandé",
  "seasonalContext": "Contexte saisonnier (Noël, été, etc.)"
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
    console.log(`      Recommendation: ${parsed.recommendation}`);

    return {
      weather: parsed.weather || { temp: null, condition: 'unknown', suggestion: 'any' },
      events: parsed.events || [],
      trends: parsed.trends || [],
      recommendation: parsed.recommendation || '',
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

  return {
    weather: {
      temp: estimatedTemp,
      condition: weatherSuggestion === 'indoor' ? 'froid' : 'agréable',
      suggestion: weatherSuggestion,
    },
    events,
    trends,
    recommendation,
    seasonalContext,
    fetchedAt: new Date().toISOString(),
    source: 'fallback',
  };
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

  if (context.seasonalContext) {
    output += `\n### Contexte saisonnier:\n`;
    output += `${context.seasonalContext}\n`;
  }

  if (context.trends.length > 0) {
    output += `\n### Trends actuels:\n`;
    output += context.trends.slice(0, 8).join(' ') + '\n';
  }

  if (context.recommendation) {
    output += `\n### Recommandation:\n`;
    output += `→ ${context.recommendation}\n`;
  }

  return output;
}

