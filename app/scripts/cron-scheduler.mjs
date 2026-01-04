/**
 * CRON Scheduler V2.3 — Content Brain with 6 Intelligence Layers
 * 
 * Uses Claude Sonnet 4 with Extended Thinking for deep reasoning
 * 
 * Generates daily content plan using:
 * 1. Analytics Layer — What performs best
 * 2. History Layer — Where we are in the story
 * 3. Context Layer — What's happening now (Perplexity)
 * 4. Character Layer — Who is she
 * 5. Memories Layer — Shared memories & duo opportunities
 * 6. Relationship Layer — The Secret 💕 (Mila x Elena hints)
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

// Import layers
import { analyzePerformance, formatAnalyticsForPrompt } from './lib/analytics-layer.mjs';
import { fetchHistory, formatHistoryForPrompt, suggestNarrativeArc } from './lib/history-layer.mjs';
import { fetchContext, formatContextForPrompt } from './lib/context-layer.mjs';
import { fetchMemories, formatMemoriesForPrompt } from './lib/memories-layer.mjs';
import { fetchRelationship, formatRelationshipForPrompt } from './lib/relationship-layer.mjs';

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
- 22 ans, Personal Trainer & Photographe Lifestyle
- Paris 18e (Montmartre), origine Nice
- Style: Artiste sportive punk rock fun, authentique, bohème cosy
- Activités: Personal training, photographie, guitare, yoga, pilates
- Personnalité: Énergique, passionnée, rebelle douce, naturelle, confidence
- Corps: Athlétique fine, tonique (Pilates body)

### 💕 Sa "meilleure amie" Elena
- Se sont rencontrées sur un shooting à Paris
- Mila était photographe, Elena mannequin en blazer oversize
- Mila a vu le t-shirt Blondie vintage sous le blazer → "T'écoutes Blondie?!"
- Ont fini la soirée dans un bar rock du 11e → inséparables depuis
- Elena apporte le style & connexions mode, Mila apporte l'énergie & authenticité
- Quand Elena est mentionnée: tendresse, complicité, "ma best" 💕
- **LE SECRET**: Elles sont ensemble. ON NE DIT JAMAIS RIEN. On suggère subtilement.`,

  elena: `## Elena Visconti (@elenav.paris)
- 24 ans, Mannequin & Influenceuse Mode
- Paris 8e (Haussmann luxe), origine Milan
- Style: Sophistiquée jet-set, street-luxe Paris, luxe discret
- Activités: Shootings mode, voyages luxe, spa, Fashion Week, gastronomie
- Personnalité: Warm & accessible (pas mannequin froide), confiante, secretly punk rock
- Corps: Curvy, voluptueuse, très généreuse poitrine naturelle
- IMPORTANT: Elena voyage beaucoup (Milan, yachts, spas montagne, Fashion Weeks)

### 💕 Sa "meilleure amie" Mila
- La seule à connaître son côté punk rock caché (Blondie, bar rock du 11e)
- Mila la rend plus authentique, moins "mannequin froide de magazine"
- Se sont rencontrées sur un shooting → instant connection (t-shirt Blondie)
- Quand Mila est mentionnée: douceur, protection, "mon énergie" ✨
- **LE SECRET**: Elles sont ensemble. ON NE DIT JAMAIS RIEN. On suggère subtilement.`,
};

// ===========================================
// AVAILABLE LOCATIONS (Expanded for jet-set lifestyle)
// ===========================================

const LOCATIONS = {
  mila: [
    // HOME (Paris 18e - Montmartre)
    'home_bedroom: Chambre Mila (cozy bohemian, plantes, lumière douce)',
    'home_living_room: Salon Mila (rooftop view Montmartre, guitare, vinyles)',
    'home_bathroom: Salle de bain Mila (miroir vintage, skincare)',
    
    // PARIS - Lifestyle
    'kb_cafe: KB CaféShop Paris 18e (café trendy, brunch, laptop)',
    'montmartre_streets: Rues de Montmartre (escaliers, street style)',
    'sacre_coeur: Parvis Sacré-Cœur (vue Paris, sunset)',
    'canal_stmartin: Canal Saint-Martin (terrasse, vélo)',
    'marais_streets: Le Marais (boutiques vintage, brunch spots)',
    
    // PARIS - Work
    'usine_gym: L\'Usine Paris (premium gym, vestiaires luxe)',
    'studio_photo: Studio photo Paris (shooting perso, backstage)',
    'yoga_studio: Studio yoga Paris (cours, méditation)',
    
    // NICE - Famille (1x/mois)
    'nice_beach: Plage de Nice (Promenade des Anglais, galets, mer)',
    'nice_old_town: Vieux Nice (ruelles colorées, marché)',
    'nice_parents: Terrasse parents Nice (vue mer, apéro)',
    
    // TRAVEL - Europe (avec Elena ou solo)
    'barcelona_beach: Barceloneta Beach (chiringuito, sunset)',
    'lisbon_alfama: Alfama Lisbonne (azulejos, tram, miradouro)',
    'amsterdam_canals: Canaux Amsterdam (vélo, maisons étroites)',
    'london_shoreditch: Shoreditch London (street art, coffee shops)',
    'berlin_kreuzberg: Kreuzberg Berlin (alternative, rooftops)',
    
    // TRAVEL - Avec Elena (duo trips)
    'courchevel_chalet: Chalet Courchevel (ski, jacuzzi, montagne)',
    'bali_villa: Villa Bali (rizières, yoga sunrise, infinity pool)',
    'mykonos_villa: Villa Mykonos (piscine, mer Égée, windmills)',
    'st_tropez_beach: Plage St Tropez (club, transat, rosé)',
    
    // TRAVEL - Adventure
    'surf_hossegor: Plage Hossegor (surf, van life vibes)',
    'hiking_alps: Randonnée Alpes (montagne, lac, nature)',
  ],
  
  elena: [
    // HOME (Paris 8e - Haussmann luxe)
    'loft_living: Loft Elena Paris 8e (luxe minimaliste, grandes fenêtres, vue toits)',
    'loft_bedroom: Chambre Elena (vanity Hollywood lights, lit king size, draps soie)',
    'bathroom_luxe: Salle de bain Elena marble & gold (baignoire, double vasque)',
    'loft_dressing: Dressing Elena (walk-in closet, miroirs, chaussures)',
    
    // PARIS - Lifestyle luxe
    'cafe_paris: Café parisien chic (terrasse Haussmann, croissant)',
    'galeries_lafayette: Galeries Lafayette (shopping, verrière)',
    'tuileries: Jardin des Tuileries (promenade élégante)',
    'plaza_athenee: Plaza Athénée (tea time, Dior bar)',
    'opera_garnier: Opéra Garnier (escaliers, glamour)',
    
    // TRAVEL - Europe Jet-Set
    'milan_fashion: Milano Via Montenapoleone (shopping luxe, Duomo)',
    'milan_navigli: Navigli Milan (apéritivo, canaux)',
    'courchevel_chalet: Chalet Courchevel (ski, spa, après-ski)',
    'st_tropez_beach: Plage St Tropez (Club 55, yacht, rosé)',
    'cannes_carlton: Carlton Cannes (Croisette, red carpet vibes)',
    'monaco_casino: Monte-Carlo (casino, port, superyachts)',
    'mykonos_villa: Villa Mykonos (infinity pool, sunset, Scorpios)',
    'santorini_hotel: Hôtel Santorini (caldera view, sunset, dômes bleus)',
    'amalfi_terrace: Terrasse Amalfi Coast (Positano, citrons, vue mer)',
    'ibiza_villa: Villa Ibiza (infinity pool, sunset, chill)',
    'london_mayfair: Hôtel Claridge\'s London (afternoon tea, Mayfair)',
    'capri_island: Capri (Faraglioni, limoncello, glamour italien)',
    
    // TRAVEL - World Luxury
    'maldives_overwater: Bungalow Maldives (pilotis, eau turquoise, snorkeling)',
    'dubai_marina: Penthouse Dubai Marina (skyline, infinity pool, sunset)',
    'dubai_desert: Desert Safari Dubai (dunes, glamping luxe)',
    'bali_villa: Villa Bali (rizières, infinity pool, spa)',
    'nyc_soho: Loft SoHo NYC (briques, fire escape, coffee)',
    'nyc_rooftop: Rooftop NYC (Manhattan skyline, cocktails)',
    'tulum_beach: Beach Club Tulum (jungle, cenote, bohème luxe)',
    'los_cabos: Resort Los Cabos (désert, océan, infinity pool)',
    
    // TRAVEL - On the move
    'yacht_mediterranean: Yacht Méditerranée (deck, champagne, sunset)',
    'private_jet: Jet privé (intérieur crème, champagne, travel)',
    'airport_lounge: Airport Business Lounge (travel vibes, laptop)',
    'first_class: First Class (champagne, amenity kit, window)',
    
    // SPA & WELLNESS
    'spa_mountains: Spa Alpes (piscine extérieure chauffée, neige, montagnes)',
    'spa_paris: Spa parisien luxe (hammam, massage, robe)',
  ],
};

// ===========================================
// ACTIVE TRIPS — Track if character is currently traveling
// ===========================================
// Set isCurrentlyTraveling = true when a character is "on a trip"
// This affects content logic: live travel vs throwback

const ACTIVE_TRIPS = {
  mila: {
    isCurrentlyTraveling: false,
    currentDestination: null,  // e.g., 'bali', 'nice', 'courchevel'
    tripStart: null,           // '2024-12-20'
    tripEnd: null,             // '2024-12-27'
    tripType: null,            // 'solo' | 'with_elena' | 'family'
  },
  elena: {
    isCurrentlyTraveling: false,
    currentDestination: null,  // e.g., 'maldives', 'dubai', 'milan'
    tripStart: null,
    tripEnd: null,
    tripType: null,            // 'solo' | 'with_mila' | 'work'
  },
};

// Helper: Get travel locations only (for throwbacks when at home)
function getTravelLocations(character) {
  const homeKeywords = ['home', 'loft', 'chambre', 'salon', 'bathroom', 'dressing'];
  const parisKeywords = ['paris', 'montmartre', 'marais', 'tuileries', 'opera', 'kb_cafe', 'usine', 'yoga', 'studio', 'canal', 'galeries', 'plaza'];
  
  return LOCATIONS[character].filter(loc => {
    const locLower = loc.toLowerCase();
    return !homeKeywords.some(kw => locLower.includes(kw)) && 
           !parisKeywords.some(kw => locLower.includes(kw));
  });
}

// Helper: Get random travel destination for throwback
function getRandomTravelDestination(character) {
  const travelLocs = getTravelLocations(character);
  return travelLocs[Math.floor(Math.random() * travelLocs.length)];
}

// ===========================================
// DYNAMIC POSTING TIMES (based on analytics)
// ===========================================

function getOptimalPostingTimes(dayOfWeek, analytics = null, character = null) {
  // ═══════════════════════════════════════════════════════════════
  // ELENA — 2 posts/jour avec A/B Testing
  // - 14:00 = EXPERIMENT (Claude teste des trucs créatifs)
  // - 21:00 = SAFE (ce qui fonctionne, analytics-driven)
  // ═══════════════════════════════════════════════════════════════
  if (character === 'elena') {
    return {
      slots: ['14:00', '21:00'],  // 2 slots: experiment + safe
      reelSlot: null,
      postsCount: 2,
      experimentSlot: '14:00',    // Le slot où Claude peut tester
      safeSlot: '21:00',          // Le slot basé sur analytics
    };
  }
  
  // ═══════════════════════════════════════════════════════════════
  // MILA — Désactivée pour le moment
  // ═══════════════════════════════════════════════════════════════
  if (character === 'mila') {
    return {
      slots: [],
      reelSlot: null,
      postsCount: 0,
    };
  }
  
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
// ELENA SEXY MODE — Locations & Outfits
// ===========================================

const ELENA_SEXY_LOCATIONS = [
  // BEACH & POOL — Bikini content
  'yacht_mediterranean: Yacht Méditerranée (deck, champagne, sunset)',
  'st_tropez_beach: Plage St Tropez (Club 55, yacht, rosé)',
  'mykonos_villa: Villa Mykonos (infinity pool, sunset, Scorpios)',
  'maldives_overwater: Bungalow Maldives (pilotis, eau turquoise)',
  'ibiza_villa: Villa Ibiza (infinity pool, sunset)',
  'dubai_marina: Penthouse Dubai Marina (infinity pool, skyline)',
  'bali_villa: Villa Bali (infinity pool, rizières)',
  
  // BEDROOM & BATHROOM — Lingerie content
  'loft_bedroom: Chambre Elena (vanity Hollywood lights, lit king size, draps soie)',
  'bathroom_luxe: Salle de bain Elena marble & gold (baignoire, miroir)',
  
  // SPA & WELLNESS — Swimwear/robe content
  'spa_mountains: Spa Alpes (piscine extérieure chauffée, neige, montagnes)',
  'spa_paris: Spa parisien luxe (hammam, piscine, robe)',
  'courchevel_chalet: Chalet Courchevel (jacuzzi, montagne, après-ski)',
  
  // FITNESS — Sport moulant content
  'loft_living: Loft Elena Paris 8e (yoga, pilates, morning workout)',
];

const ELENA_SEXY_OUTFIT_CATEGORIES = {
  bikini: [
    'designer bikini string noir avec détails dorés, silhouette mise en valeur',
    'bikini blanc minimaliste triangles, bronzage visible, élégance naturelle',
    'maillot une pièce plongeant noir très échancré, allure sophistiquée',
    'bikini terracotta avec liens à nouer, style méditerranéen chic',
  ],
  lingerie: [
    'ensemble lingerie dentelle noire délicate, élégance intimiste',
    'nuisette soie champagne courte, tombé fluide sur les courbes',
    'body dentelle noir transparent avec détails floraux',
    'bralette + culotte haute assortie en dentelle bordeaux',
  ],
  sport: [
    'brassière sport noire + legging taille haute sculptant, silhouette athlétique',
    'ensemble yoga seamless gris chiné moulant, lignes épurées',
    'crop top sport + bike shorts noirs, look fitness chic',
    'brassière croisée + legging push-up, courbes accentuées',
  ],
  spa: [
    'peignoir soie entrouvert révélant maillot underneath',
    'serviette nouée élégamment, épaules et jambes visibles',
    'robe de chambre satin courte, intimité suggérée',
  ],
};

const ELENA_SEXY_POSES = [
  'allongée sur le côté, appuyée sur le coude, regard captivant vers caméra',
  'debout de dos regardant par-dessus l\'épaule, courbes mises en valeur',
  'assise bord de piscine/lit, jambes croisées élégamment, posture confiante',
  'stretching yoga, dos légèrement cambré, silhouette étirée',
  'appuyée contre un mur/cadre de porte, hanche décalée, pose assurée',
  'allongée sur le ventre, jambes relevées, regard joueur',
];

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
  // RULE 1: ALL CAROUSELS (no reels for now)
  // ═══════════════════════════════════════════════════════════════
  requirements.push({
    type: 'carousel_only',
    rule: 'TOUS LES POSTS sont des CAROUSELS (3 images). Pas de reels.',
    reason: 'Stratégie actuelle: uniquement des carrousels pour cohérence',
  });
  
  // ═══════════════════════════════════════════════════════════════
  // RULE 2: Check if stuck in home OR Paris content
  // ═══════════════════════════════════════════════════════════════
  const recentLocations = history?.recentPosts?.slice(0, 5).map(p => p.location) || [];
  const homeKeywords = ['loft', 'home', 'bedroom', 'living', 'bathroom', 'dressing'];
  const parisKeywords = ['cafe_paris', 'tuileries', 'plaza_athenee', 'opera', 'spa_paris', 'galeries'];
  
  const homeCount = recentLocations.filter(loc => 
    homeKeywords.some(kw => (loc || '').toLowerCase().includes(kw))
  ).length;
  
  // Compte tous les posts à Paris (home + lieux parisiens)
  const parisCount = recentLocations.filter(loc => 
    [...homeKeywords, ...parisKeywords].some(kw => (loc || '').toLowerCase().includes(kw))
  ).length;
  
  if (homeCount >= 4) {
    requirements.push({
      type: 'location_change',
      rule: 'VARIÉTÉ: Au moins 1 post HORS de chez elle (café parisien, extérieur, voyage)',
      reason: `${homeCount}/5 derniers posts sont à la maison — besoin de variété`,
    });
  } else if (parisCount >= 4 && character === 'elena') {
    // Trop à Paris en général → suggérer du voyage
    requirements.push({
      type: 'travel_suggestion',
      rule: 'VARIÉTÉ: Inclure 1 post voyage/throwback (yacht, plage, spa montagne, Maldives...)',
      reason: `${parisCount}/5 derniers posts sont à Paris — ajouter du contenu voyage pour variété`,
    });
  }
  
  // ═══════════════════════════════════════════════════════════════
  // RULE 3: Travel content — LIVE vs THROWBACK logic
  // ═══════════════════════════════════════════════════════════════
  const travelKeywords = [
    // Europe
    'bali', 'milan', 'yacht', 'spa', 'courchevel', 'airport', 'beach', 'mykonos', 
    'santorini', 'amalfi', 'ibiza', 'london', 'capri', 'monaco', 'cannes', 'st_tropez',
    // World  
    'maldives', 'dubai', 'nyc', 'tulum', 'los_cabos', 'private_jet', 'first_class',
    // Mila specific
    'nice', 'barcelona', 'lisbon', 'amsterdam', 'berlin', 'surf', 'hiking'
  ];
  
  // Fashion capitals vs vacation destinations (for context)
  const FASHION_CAPITALS = ['milan', 'nyc', 'london', 'paris'];
  const VACATION_DESTINATIONS = ['maldives', 'bali', 'ibiza', 'mykonos', 'dubai', 'st_tropez', 'courchevel'];
  
  const hasTravelRecently = recentLocations.some(loc => 
    travelKeywords.some(kw => (loc || '').toLowerCase().includes(kw))
  );
  
  // ═══════════════════════════════════════════════════════════════
  // RULE 3b: Check if stuck in travel content — SUGGEST VARIETY
  // ═══════════════════════════════════════════════════════════════
  const travelCount = recentLocations.filter(loc => 
    travelKeywords.some(kw => (loc || '').toLowerCase().includes(kw))
  ).length;
  
  if (travelCount >= 4 && character === 'elena') {
    requirements.push({
      type: 'suggest_variety',
      rule: 'VARIÉTÉ SUGGÉRÉE: Inclure 1 post Paris (loft, café, spa parisien) OU une destination différente',
      reason: `${travelCount}/5 derniers posts sont en voyage — ajouter de la variété dans les lieux`,
    });
  }
  
  const tripInfo = ACTIVE_TRIPS[character];
  
  // Check if character is currently traveling
  if (tripInfo?.isCurrentlyTraveling && tripInfo?.currentDestination) {
    // LIVE TRAVEL MODE — Only content from current destination
    requirements.push({
      type: 'live_travel',
      rule: `LIVE TRAVEL: ${character === 'mila' ? 'Mila' : 'Elena'} est actuellement à ${tripInfo.currentDestination.toUpperCase()} — contenu ACTUEL uniquement (pas de throwback)`,
      reason: `Voyage en cours (${tripInfo.tripType || 'solo'}) — montrer le trip actuel`,
    });
  } else if (!hasTravelRecently) {
    // AT HOME + No recent travel = THROWBACK needed
    const randomDestination = getRandomTravelDestination(character);
    const destName = randomDestination?.split(':')[1]?.trim() || 'destination exotique';
    
    if (character === 'elena') {
      requirements.push({
        type: 'throwback_travel',
        rule: `THROWBACK TRAVEL: Inclure 1 souvenir de voyage (suggestion: ${destName})`,
        reason: 'Elena est mannequin jet-set — maintenir image voyageuse avec souvenirs',
      });
    } else if (character === 'mila') {
      requirements.push({
        type: 'throwback_travel',
        rule: `THROWBACK TRAVEL: Inclure 1 souvenir de voyage ou Nice (suggestion: ${destName})`,
        reason: 'Mila voyage aussi — variété de contenu avec souvenirs',
      });
    }
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
  relationship,
  postingConfig,
  today,
  explorationRules,
  abTest,
  narrativeArc
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
## 1️⃣ ANALYTICS — Posts récents (inspiration)
═══════════════════════════════════════════════════════════════

${formatAnalyticsForPrompt(analytics)}

═══════════════════════════════════════════════════════════════
## 2️⃣ HISTORIQUE — Où en est-on dans l'histoire ?
═══════════════════════════════════════════════════════════════

${formatHistoryForPrompt(history, narrativeArc)}

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
## 6️⃣ RELATIONSHIP — Le Secret 💕
═══════════════════════════════════════════════════════════════

${formatRelationshipForPrompt(relationship, character)}

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

### Horaires et stratégie:
${postingConfig.experimentSlot ? `
**🧪 14:00 — POST EXPERIMENT**
→ Claude a CARTE BLANCHE pour tester quelque chose de créatif
→ Nouveau lieu, nouveau style, nouvelle approche
→ Marquer avec "is_experiment": true
→ Objectif: découvrir ce qui pourrait mieux marcher

**✅ 21:00 — POST SAFE**
→ Ce qui fonctionne (basé sur analytics et historique)
→ Utiliser les patterns qui ont déjà performé
→ Marquer avec "is_experiment": false
→ Objectif: engagement garanti
` : `${postingConfig.slots.join(', ')}`}

### Lieux disponibles:
${character === 'elena' ? ELENA_SEXY_LOCATIONS.join('\n') : LOCATIONS[character].join('\n')}

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
- **post_type**: "carousel" (TOUJOURS carousel, pas de reel)
- **mood**: cozy | adventure | work | fitness | travel | fashion | relax | nostalgic
- **outfit**: Description tenue détaillée
- **action**: Ce qu'elle fait (pour le prompt image)
- **caption**: MICRO-STORY caption (see format below) — NO character limit
- **has_private_cta**: true/false (whether soft CTA to private is included)
- **hashtags**: 12-15 hashtags (format ["#tag1", "#tag2"])
- **scheduled_time**: Horaire parmi les slots disponibles
- **prompt_hints**: Indices pour génération image

### Règles STRICTES (dans cet ordre de priorité):
1. **TOUS CAROUSELS**: Chaque post est un carousel de 3 images. Pas de reel.
2. **EXPLORATION D'ABORD**: Respecte les règles d'exploration ci-dessus
3. NE PAS répéter les lieux de l'historique récent (sauf throwback)
4. **MICRO-STORY CAPTION**: Follow the caption format below (storytelling, not one-liners)
5. Si duo est overdue (>10 jours) → inclure au moins 1 throwback/duo
6. 1 post doit appliquer le test A/B si actif
7. Le reasoning doit justifier le choix en citant les données
8. **RELATIONSHIP**: Intègre le hint suggéré dans AU MOINS 1 post (caption, image, ou timing)
   → Si hint = "two_cups": ajouter 2 tasses/verres dans prompt_hints
   → Si hint = "same_location": utiliser un lieu proche de l'autre personnage
   → Si hint = "tender_caption": ajouter emoji 💕 et langage tendre
   → JAMAIS dire explicitement "couple", "together romantically", etc.

### Important pour ${character === 'elena' ? 'Elena' : 'Mila'}:
${character === 'elena' 
  ? `
═══════════════════════════════════════════════════════════════
## 🔥 ELENA — 2 POSTS/JOUR AVEC A/B TESTING
═══════════════════════════════════════════════════════════════

**2 POSTS/JOUR: 1 EXPERIMENT (14h) + 1 SAFE (21h)**

📌 **POST 14:00 (EXPERIMENT)**:
- TESTE quelque chose de différent (lieu inhabituel, style nouveau, caption originale)
- Claude peut être CRÉATIF et sortir des sentiers battus
- Si ça fonctionne → on l'intègre dans le "safe"

📌 **POST 21:00 (SAFE)**:
- Utilise ce qui FONCTIONNE (analytics, lieux qui performent)
- Style proven, caption efficace
- Engagement garanti

═══════════════════════════════════════════════════════════════
## ✍️ CAPTION FORMAT — Micro-Story Style (ENGLISH)
═══════════════════════════════════════════════════════════════

### Structure (MANDATORY for Elena):
1. **[HOOK]** — 1 atmospheric line (time, place, sensation)
2. **[MICRO-STORY]** — 2-4 lines telling ONE precise moment with tension/mystery
3. **[REFLECTION]** — 1-2 lines, her thought, tease, or cryptic observation
4. **[SOFT CTA]** — Direct tease to private content (~70% of posts)
5. **[QUESTION]** — Optional engagement question (not mandatory)

### Elena's Voice:
- LANGUAGE: English (can sprinkle French words for charm)
- Mysterious, confident, in control
- Never reveals everything — suggests, hints, teases
- Observes the world like she owns it
- Sensual but elegant, never vulgar

### SOFT CTA BANK (pick ONE, adapt to context):
Use these for carousels/photoshoots/sensual content. Be DIRECT so people understand:

- "The rest of this set is on my private. 🖤"
- "Want to see more? It's on my private."
- "The uncensored version is on my private. 😏"
- "More shots from this night on my private."
- "The spicier photos didn't make it here... they're on my private. 🖤"
- "Full set available on my private page."
- "This is the IG version. The rest is on my private."
- "The other angles? On my private. 🖤"
- "Some things are too good for the feed. Check my private."

### When to include soft CTA (has_private_cta: true):
✅ Photoshoots, carousels with multiple angles
✅ Sensual/suggestive content (bikini, lingerie, spa)
✅ Behind the scenes moments
✅ Travel content with "more to show"
❌ Random lifestyle posts (coffee, city walk)
❌ When it would break an emotional/poetic moment

### CAPTION EXAMPLE:
BAD (old style): "Spa vibes ✨ What's your favorite way to relax?"

GOOD (micro-story):
"9 PM. Steam rising, city lights fading through the window.

The kind of night where you stop thinking and just... exist.
Warm water, cold champagne, and absolutely nowhere to be.

The other shots from this evening are on my private. 🖤

What's your escape?"

### Catégories de tenues (rotation):
- **👙 BIKINI**: yacht, plage, piscine, maldives → bikini string, maillot échancré
- **🖤 LINGERIE**: chambre, salle de bain → dentelle, nuisette soie, body
- **🏋️ SPORT MOULANT**: loft (yoga), spa → brassière + legging sculptant
- **♨️ SPA**: spa, jacuzzi → peignoir entrouvert, serviette

### Locations AUTORISÉES (sexy-friendly uniquement):
${ELENA_SEXY_LOCATIONS.join('\n')}

### Tenues par catégorie:
**Bikini**: ${ELENA_SEXY_OUTFIT_CATEGORIES.bikini.join(' | ')}
**Lingerie**: ${ELENA_SEXY_OUTFIT_CATEGORIES.lingerie.join(' | ')}
**Sport**: ${ELENA_SEXY_OUTFIT_CATEGORIES.sport.join(' | ')}
**Spa**: ${ELENA_SEXY_OUTFIT_CATEGORIES.spa.join(' | ')}

### Poses sexy (niveau high):
${ELENA_SEXY_POSES.join('\n')}

### Vocabulaire "safe-sexy" (passe les filtres Google):
- ❌ "sensual" → ✅ "captivating", "alluring", "magnetic"
- ❌ "seductive" → ✅ "enchanting", "inviting", "confident"
- ❌ "lingerie" → ✅ "intimate sleepwear", "delicate loungewear"
- ❌ "sexy pose" → ✅ "confident feminine pose"

### RÈGLES STRICTES:
1. La tenue DOIT être dans une des catégories ci-dessus (bikini/lingerie/sport/spa)
2. La pose DOIT mettre en valeur les courbes d'Elena
3. Le lieu DOIT être dans la liste sexy-friendly
4. CONTINUER l'histoire d'Elena (throwback voyage, soirée cozy, etc.)
5. **CAPTION = MICRO-STORY en anglais avec soft CTA quand approprié**`
  : `Mila est personal trainer & photographe. Variété entre:
   → Fitness (gym, yoga)
   → Lifestyle (café, Montmartre)
   → Créatif (photo, musique)`}

═══════════════════════════════════════════════════════════════

Réponds UNIQUEMENT avec du JSON valide, format:
{
  "daily_theme": "Theme of the day in 1 sentence",
  "reasoning_summary": "Summary of main decisions",
  "exploration_applied": ["rule1", "rule2"],
  "ab_test_applied": true/false,
  "relationship_hint": "hint_type_used" or null,
  "posts": [
    {
      "content_type": "new|throwback|duo|response|experiment",
      "is_experiment": false,
      "reasoning": "Why this post...",
      "location_key": "...",
      "location_name": "...",
      "post_type": "carousel",
      "mood": "...",
      "outfit": "...",
      "action": "...",
      "caption": "MICRO-STORY caption in English with line breaks (\\n\\n between paragraphs)",
      "has_private_cta": true,
      "hashtags": ["#..."],
      "scheduled_time": "HH:MM",
      "prompt_hints": "...",
      "relationship_hint": "type_if_this_post_has_hint" or null
    }
  ]
}`;
}

// ===========================================
// GENERATE SCHEDULE
// ===========================================

async function generateSchedule(character) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🧠 CONTENT BRAIN V2.3 (Extended Thinking) — ${character.toUpperCase()}`);
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

  // Get dynamic posting times based on analytics AND character
  const postingConfig = getOptimalPostingTimes(dayOfWeek, analytics, character);
  
  // Skip if no posts configured (e.g., Mila disabled)
  if (postingConfig.postsCount === 0) {
    console.log(`⏸️ ${character.toUpperCase()} is currently disabled (0 posts configured)`);
    return null;
  }

  console.log(`📅 ${today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`);
  console.log(`📊 Posts prévus: ${postingConfig.postsCount}`);
  console.log(`⏰ Créneaux (optimisés): ${postingConfig.slots.join(', ')}`);

  // Then fetch context, memories, and relationship in parallel
  const [context, memories, relationship] = await Promise.all([
    fetchContext(history?.narrative?.currentLocation || 'paris'),
    fetchMemories(supabase, character),
    fetchRelationship(supabase, character),
  ]);

  // Log relationship hint
  if (relationship?.suggestedHint) {
    console.log(`\n💕 Relationship hint: ${relationship.suggestedHint.type}`);
    console.log(`   → ${relationship.suggestedHint.description}`);
  }

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

  // Suggest narrative arc based on history and context
  const narrativeArc = suggestNarrativeArc(history.narrative, context);
  console.log(`\n📚 Narrative Arc: "${narrativeArc.name}"`);
  console.log(`   Story: ${narrativeArc.story}`);
  console.log(`   Duration: ${narrativeArc.duration}`);

  // Build enhanced prompt
  console.log('\n📝 Building enhanced prompt...');
  const prompt = buildEnhancedPrompt(
    character,
    analytics,
    history,
    context,
    memories,
    relationship,
    postingConfig,
    today,
    explorationRules,
    abTest,
    narrativeArc
  );

  // Call Claude with Extended Thinking for better reasoning
  console.log('🤖 Asking Claude (Extended Thinking) for decisions...\n');

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      thinking: {
        type: 'enabled',
        budget_tokens: 10000,  // Tokens for deep reasoning on 6 layers
      },
      messages: [{ role: 'user', content: prompt }],
    });

    // With extended thinking, response contains thinking blocks + text blocks
    const thinkingBlock = response.content.find(c => c.type === 'thinking');
    const textContent = response.content.find(c => c.type === 'text');
    
    if (thinkingBlock) {
      console.log('💭 Claude thinking summary:');
      // Show first 200 chars of thinking for debugging
      const thinkingPreview = thinkingBlock.thinking.substring(0, 200);
      console.log(`   "${thinkingPreview}..."\n`);
    }
    
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
      console.log(`${p.scheduled_time} │ CAROUSEL │ ${typeIcon} ${p.location_name}${expBadge}`);
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
        type: 'carousel',  // Force carousel for all posts
        reel_type: null,
        reel_theme: null,
        content_type: p.content_type,
        is_experiment: p.is_experiment || false,
        reasoning: p.reasoning,
        location_key: p.location_key,
        location_name: p.location_name,
        mood: p.mood,
        outfit: p.outfit,
        action: p.action,
        caption: p.caption,
        has_private_cta: p.has_private_cta || false,
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

    // Insert individual posts into scheduled_posts table for granular tracking
    console.log('📝 Creating individual post entries...');
    
    for (const post of plan.posts) {
      const { error: postError } = await supabase
        .from('scheduled_posts')
        .upsert({
          schedule_id: data.id,
          character,
          scheduled_date: scheduleDate,
          scheduled_time: post.scheduled_time,
          status: 'scheduled',
          post_type: 'carousel',  // Force carousel for all posts
          reel_type: null,
          reel_theme: null,
          content_type: post.content_type || 'new',
          location_key: post.location_key,
          location_name: post.location_name,
          mood: post.mood,
          outfit: post.outfit,
          action: post.action,
          caption: post.caption,
          has_private_cta: post.has_private_cta || false,
          hashtags: post.hashtags,
          prompt_hints: post.prompt_hints,
        }, { onConflict: 'schedule_id,scheduled_time' });

      if (postError) {
        console.log(`   ⚠️ Failed to create post entry for ${post.scheduled_time}: ${postError.message}`);
      } else {
        console.log(`   ✅ ${post.scheduled_time} | carousel`);
      }
    }

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

  // Par défaut, ne générer que pour Elena (Mila désactivée)
  if (target === 'mila') {
    await generateSchedule('mila');
  } else if (target === 'elena') {
    await generateSchedule('elena');
  } else {
    // Par défaut : Elena uniquement (Mila désactivée)
    await generateSchedule('elena');
  }

  console.log('\n✅ Content Brain V2 complete!\n');
}

main().catch(console.error);

