/**
 * Content Brain — Intelligent Daily Planner
 * 
 * Generates daily content plans using Claude AI
 * 
 * Usage:
 *   node scripts/content-brain.mjs mila           # Generate plan for Mila
 *   node scripts/content-brain.mjs elena          # Generate plan for Elena
 *   node scripts/content-brain.mjs both           # Generate for both
 *   node scripts/content-brain.mjs mila --posts=5 # Custom post count
 *   node scripts/content-brain.mjs mila --duo     # Force crossover with Elena
 */

import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// ===========================================
// CONFIG
// ===========================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.Claude_key,
});

// Character sheets
const CHARACTER_SHEETS = {
  mila: `## Mila Verne (@mila_verne)
- 22 ans, Personal Trainer & Photographe
- Paris 18e (Montmartre) - originaire de Nice
- Aesthetic: Artiste sportive punk rock fun — Bohème cosy + edge créatif + énergie fitness
- Physique: Copper auburn curly hair (3A), hazel-green eyes, freckles, beauty mark above left lip
- Style: Athleisure (Alo Yoga vibes), casual chic, bohème cozy
- Personnalité: Confident, warm, playful, ambitieuse, un peu rebelle
- Activités: Entraîne ses clientes PT, shoote (photographe), joue guitare, yoga/pilates, café & travail
- Tone: Casual mais soigné, mix français/anglais, émojis avec parcimonie`,

  elena: `## Elena Visconti (@elenav.paris)
- 24 ans, Mannequin & Influenceuse Mode
- Paris 8e (Haussmann luxe) - origines italiennes (Milan)
- Aesthetic: Paris Street-Luxe Mannequin 2025 — Osé mais stylé, près du corps, tendance
- Physique: Bronde hair (dark roots + golden blonde balayage), beach waves volumineuses. Visage doux et rond (PAS anguleux), honey brown warm eyes. Corps féminin shapely (NOT skinny), F-cup, taille marquée, hanches larges. Grain de beauté pommette droite.
- Style: Street-luxe, beige/cream/nude/noir, gold chunky bracelet + layered gold necklaces, looks osés près du corps
- Personnalité: Warm & accessible (pas cold model), confident, fun, secretly punk rock (amie de Mila)
- Activités: Shootings mannequin, getting ready, cozy home, café Paris, spa luxe
- Tone: Casual luxe, confident, playful, French touch, captions courtes et impactantes`,
};

// Available locations
const MILA_LOCATIONS = [
  'home_bedroom: Chambre Mila (home) - cozy bohemian bedroom',
  'home_living_room: Salon Mila (home) - Parisian living with rooftop view',
  'nice_old_town_cafe: KB CaféShop (paris) - specialty coffee Paris 18e',
  'nice_gym: L\'Usine Paris (paris) - premium industrial gym',
];

const ELENA_LOCATIONS = [
  'loft_living: Loft Elena (home) - luxurious Parisian loft 8e',
  'loft_bedroom: Chambre Elena (home) - elegant bedroom with vanity',
  'bathroom_luxe: Salle de bain Elena (home) - marble & gold bathroom',
  'cafe_paris: Café parisien chic (cafe) - upscale terrace',
  'spa_luxe: Spa luxe (spa) - heated pool, mountains',
  'milan_fashion: Milano Fashion District (travel) - Via Montenapoleone',
  'milan_hotel: Milan Luxury Hotel (travel) - 5-star suite, Duomo view',
  'backstage_shooting: Backstage Shooting (travel) - fashion photo studio',
  'yacht_mediterranean: Yacht Méditerranée (travel) - Amalfi coast',
  'london_rooftop: London Rooftop Bar (travel) - city views evening',
  'maldives_suite: Maldives Overwater Suite (travel) - paradise villa',
  'airport_lounge: Airport Business Lounge (travel) - first class lounge',
];

// Timeline lore (current date: December 2025)
const TIMELINE_EVENTS = [
  { date: '2024-06-15', title: 'La rencontre', description: 'Mila et Elena se rencontrent sur un shooting à Paris' },
  { date: '2024-08-12', title: 'Premier weekend', description: 'Nice chez les parents de Mila' },
  { date: '2024-12-24', title: 'Premier Noël', description: 'Réveillon ensemble chez Mila' },
  { date: '2025-02-10', title: 'Ski Trip Courchevel', description: 'Une semaine aux sports d\'hiver, jacuzzi tous les soirs' },
  { date: '2025-06-15', title: '1 an d\'amitié', description: 'Dîner au Meurice pour fêter l\'anniversaire' },
  { date: '2025-08-01', title: 'Bali Trip', description: '2 semaines à Bali - villas, yoga, cérémonies' },
  { date: '2025-11-01', title: 'Elena nouveau loft', description: 'Crémaillère dans le nouveau loft du 8ème' },
  { date: '2025-12-01', title: 'Marché de Noël', description: 'Vin chaud aux Champs-Élysées' },
  { date: '2025-12-15', title: 'Shopping de Noël', description: 'Galeries Lafayette, choix des cadeaux' },
];

// ===========================================
// BUILD PROMPT
// ===========================================

function buildPrompt(character, postsCount, forceDuo) {
  const other = character === 'mila' ? 'elena' : 'mila';
  const locations = character === 'mila' ? MILA_LOCATIONS : ELENA_LOCATIONS;
  
  const today = new Date();
  const dayOfWeek = today.toLocaleDateString('fr-FR', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

  return `Tu es le Content Brain de ${character === 'mila' ? 'Mila Verne' : 'Elena Visconti'}, un système intelligent qui planifie le contenu Instagram quotidien.

${CHARACTER_SHEETS[character]}

## Contexte du Jour
- **Date** : ${dayOfWeek} ${dateStr}
- **Posts à planifier** : ${postsCount}
- **Au moins 1 Reel obligatoire**
${forceDuo ? `- **Crossover obligatoire** : Un post avec ${other === 'mila' ? 'Mila' : 'Elena'}` : ''}

## Timeline Lore (souvenirs avec ${other === 'mila' ? 'Mila' : 'Elena'})
${TIMELINE_EVENTS.map(e => `- ${e.date}: "${e.title}" — ${e.description}`).join('\n')}

## Relation avec ${other === 'mila' ? 'Mila' : 'Elena'}
- Comment elles se sont rencontrées : Sur un shooting photo à Paris
- Inside jokes : Le fameux croissant volé, Mila toujours en retard
- Activités ensemble : brunch, shopping, workout, shooting photos

## Lieux Disponibles
${locations.join('\n')}

## Horaires de Publication
- Matin : 08:00-09:00 (lifestyle/café)
- Midi : 12:00-13:00 (fitness/travail)
- Soir : 18:00-19:00 (lifestyle/sortie)
- Nuit : 21:00-22:00 (cozy/intime)

## Ta Mission

Génère le planning du jour avec ${postsCount} posts.

Pour chaque post :
1. **location_key** : ID du lieu
2. **post_type** : "carousel" ou "reel"
3. **mood** : cozy | adventure | work | party | relax | fitness | travel | fashion
4. **outfit** : Description courte de la tenue
5. **action** : Ce qu'elle fait (dynamique!)
6. **caption** : Caption engageante avec question (max 150 caractères)
7. **hashtags** : 15 hashtags pertinents (IMPORTANT: each as a quoted string like "#fitness")
8. **scheduled_time** : Horaire HH:MM
9. **prompt_hints** : Indices pour génération image
10. **with_character** : "${other}" si crossover, sinon null
11. **reasoning** : Pourquoi ce choix (1-2 phrases)

## Règles CRITIQUES

1. **Variété** : Ne JAMAIS répéter un lieu
2. **Engagement** : Chaque caption DOIT avoir une question ou un CTA
3. **Horaires** : Espacer d'au moins 4h
4. **Reels** : Au moins 1 reel
5. **Crossover** : ${forceDuo ? 'Un post DOIT être avec ' + (other === 'mila' ? 'Mila' : 'Elena') : '20% de chance de suggérer un crossover'}

Réponds UNIQUEMENT avec un JSON valide. IMPORTANT: Les hashtags doivent être sur UNE SEULE LIGNE, pas de retour à la ligne dans les arrays :
{
  "daily_theme": "Thème du jour",
  "posts": [
    {
      "location_key": "...",
      "location_name": "...",
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
// GENERATE PLAN
// ===========================================

async function generatePlan(character, postsCount, forceDuo) {
  console.log(`\n🧠 Content Brain generating plan for ${character.toUpperCase()}...`);
  console.log(`   Posts: ${postsCount} | Force Duo: ${forceDuo}`);
  
  const prompt = buildPrompt(character, postsCount, forceDuo);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent) throw new Error('No text response');

    // Extract JSON from markdown code blocks if present
    let jsonStr = textContent.text;
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
    } else {
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      jsonStr = jsonMatch[0];
    }

    // Clean potential JSON issues
    // 1. Remove newlines inside strings (especially in hashtag arrays)
    jsonStr = jsonStr.replace(/"hashtags"\s*:\s*\[([\s\S]*?)\]/g, (match, content) => {
      // Extract all hashtags
      const hashtags = content.match(/"#[\w]+"/g) || [];
      return `"hashtags": [${hashtags.join(', ')}]`;
    });
    
    let plan;
    try {
      plan = JSON.parse(jsonStr);
    } catch (e) {
      console.log('⚠️ JSON parse error, showing raw...');
      console.log('JSON string:', jsonStr.substring(0, 800));
      throw e;
    }

    console.log(`\n✅ Plan Generated: "${plan.daily_theme}"\n`);
    console.log('═'.repeat(60));

    plan.posts.forEach((post, i) => {
      console.log(`\n📝 POST ${i + 1} — ${post.scheduled_time}`);
      console.log('─'.repeat(40));
      console.log(`📍 Location: ${post.location_name} (${post.location_key})`);
      console.log(`🎬 Type: ${post.post_type.toUpperCase()}`);
      console.log(`😊 Mood: ${post.mood}`);
      console.log(`👗 Outfit: ${post.outfit}`);
      console.log(`🎯 Action: ${post.action}`);
      console.log(`💬 Caption: "${post.caption}"`);
      if (post.with_character) {
        console.log(`👯 Crossover: with ${post.with_character}`);
      }
      console.log(`💡 Reasoning: ${post.reasoning}`);
      console.log(`🏷️  Hashtags: ${post.hashtags.slice(0, 5).join(' ')}...`);
    });

    console.log('\n' + '═'.repeat(60));

    return plan;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// ===========================================
// MAIN
// ===========================================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    console.log(`
🧠 Content Brain — Intelligent Daily Planner

Usage:
  node scripts/content-brain.mjs <character> [options]

Characters:
  mila    Generate plan for Mila Verne
  elena   Generate plan for Elena Visconti
  both    Generate for both characters

Options:
  --posts=N   Number of posts (default: 3)
  --duo       Force a crossover post with the other character

Examples:
  node scripts/content-brain.mjs mila
  node scripts/content-brain.mjs elena --posts=5
  node scripts/content-brain.mjs mila --duo
  node scripts/content-brain.mjs both --posts=4
`);
    return;
  }

  // Check API key
  if (!process.env.ANTHROPIC_API_KEY && !process.env.Claude_key) {
    console.error('❌ ANTHROPIC_API_KEY or Claude_key not set in .env.local');
    process.exit(1);
  }

  // Parse arguments
  const character = args[0].toLowerCase();
  const postsCount = parseInt(args.find(a => a.startsWith('--posts='))?.split('=')[1] || '3');
  const forceDuo = args.includes('--duo');

  console.log('\n🧠 ═══════════════════════════════════════════════════════');
  console.log('   CONTENT BRAIN — Intelligent Content Engine');
  console.log('═══════════════════════════════════════════════════════════');

  if (character === 'both') {
    await generatePlan('mila', postsCount, forceDuo);
    await generatePlan('elena', postsCount, forceDuo);
  } else if (character === 'mila' || character === 'elena') {
    await generatePlan(character, postsCount, forceDuo);
  } else {
    console.error(`❌ Unknown character: ${character}`);
    console.log('   Use: mila, elena, or both');
    process.exit(1);
  }

  console.log('\n✅ Content Brain finished!\n');
}

main().catch(console.error);

