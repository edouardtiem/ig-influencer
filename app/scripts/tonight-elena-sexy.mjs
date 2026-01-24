#!/usr/bin/env node
/**
 * TONIGHT POST — Full Content Brain flow, SEXY MAX
 * Mardi soir, 21h30
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { generateImagesForPost, publishCarouselToInstagram } from './scheduled-post.mjs';

// Import layers
import { analyzePerformance, formatAnalyticsForPrompt } from './lib/analytics-layer.mjs';
import { fetchHistory, formatHistoryForPrompt } from './lib/history-layer.mjs';
import { fetchContext, formatContextForPrompt } from './lib/context-layer.mjs';
import { fetchTrendingExperiment } from './lib/trending-layer.mjs';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const anthropic = new Anthropic({ 
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.Claude_key || process.env.CLAUDE_KEY 
});

// ═══════════════════════════════════════════════════════════════
// SEXY MAX CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const SEXY_LOCATIONS = [
  'paris_boudoir: Boudoir parisien luxe (miroirs dorés, velours, lumière intime, chandelles)',
  'loft_bedroom: Chambre Elena Paris 8e (vanity Hollywood lights, draps soie, lit king)',
  'bathroom_luxe: Salle de bain marble & gold (miroir, lumière chaude)',
  'spa_paris: Spa parisien privé (piscine intérieure, vapeur, ambiance intime)',
  'hotel_suite: Suite Palace Parisien (baldaquin, vue toits Paris, luxe)',
];

const SEXY_OUTFITS = [
  'sleek black bodysuit, fitted and elegant, editorial fashion style, confident silhouette',
  'black lace-trimmed silk slip, elegant draping, intimate evening elegance',
  'fitted black two-piece set, crop top and high-waisted bottoms, sophisticated',
  'elegant black bandeau top with matching fitted shorts, minimalist chic',
  'form-fitting black dress, figure-hugging, glamorous evening style',
];

const SEXY_POSES_SAFE = [
  'standing confident pose by mirror, hand on hip, warm gaze at camera',
  'sitting elegantly on velvet chair, legs crossed, sophisticated expression',
  'leaning against doorframe, confident feminine pose, warm smile',
  'standing by window, natural light, elegant silhouette, glamorous expression',
  'sitting on bed edge, relaxed confident pose, warm inviting expression',
];

const SEXY_EXPRESSIONS_SAFE = [
  'confident warm gaze at camera, sophisticated smile, elegant presence',
  'glamorous expression, natural confidence, striking beauty',
  'warm charming smile, confident feminine energy, elegant',
  'soft elegant expression, warm welcoming eyes, effortless glamour',
  'striking confident look, natural beauty radiating, approachable warmth',
];

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('🔥 TONIGHT POST — ELENA SEXY MAX');
  console.log('═'.repeat(60));
  console.log(`Time: ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`);
  
  // ═══════════════════════════════════════════════════════════════
  // LAYER 1: ANALYTICS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📊 Layer 1: Analytics...');
  const analytics = await analyzePerformance(supabase, 'elena');
  console.log(`   Top location type: ${analytics?.patterns?.bestLocationType || 'N/A'}`);
  
  // ═══════════════════════════════════════════════════════════════
  // LAYER 2: HISTORY
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📚 Layer 2: History...');
  const history = await fetchHistory(supabase, 'elena');
  const recentLocations = history?.recentPosts?.slice(0, 5).map(p => p.location) || [];
  console.log(`   Recent locations: ${recentLocations.join(', ') || 'none'}`);
  
  // ═══════════════════════════════════════════════════════════════
  // LAYER 3: CONTEXT (Perplexity)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🌐 Layer 3: Context (Perplexity)...');
  const context = await fetchContext('paris');
  console.log(`   Season: ${context?.seasonalContext || 'winter'}`);
  
  // ═══════════════════════════════════════════════════════════════
  // LAYER 4: TRENDING (Perplexity)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🔥 Layer 4: Trending...');
  const trending = await fetchTrendingExperiment(recentLocations);
  console.log(`   Trending location: ${trending?.location?.name || 'fallback'}`);
  
  // ═══════════════════════════════════════════════════════════════
  // GENERATE POST WITH CLAUDE
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🤖 Generating post with Claude (SEXY MAX)...');
  
  const prompt = `Tu es Elena Visconti, mannequin & influenceuse mode Paris.

## CONTEXT
- Mardi soir, 21h30 à Paris
- Post Instagram carousel (3 images)
- Ambiance: soirée intime, glamour, confidente

## ANALYTICS (posts récents performants)
${formatAnalyticsForPrompt(analytics)}

## HISTORY (éviter répétitions)
Locations récentes: ${recentLocations.join(', ') || 'aucune'}
${formatHistoryForPrompt(history, null)}

## TRENDING
${trending?.promptFragments || 'Boudoir parisien, ambiance intime'}

## LOCATIONS SEXY DISPONIBLES
${SEXY_LOCATIONS.join('\n')}

## OUTFITS SEXY (safe pour IA)
${SEXY_OUTFITS.join('\n')}

## POSES (safe pour IA - éviter: over shoulder, lying down, curves)
${SEXY_POSES_SAFE.join('\n')}

## EXPRESSIONS (safe pour IA - éviter: sensual, alluring, lips parted)
${SEXY_EXPRESSIONS_SAFE.join('\n')}

## MISSION
Génère UN post carousel SEXY MAX pour ce soir.

RÈGLES:
1. Outfit = le plus sexy possible dans la liste (bodysuit ou slip)
2. Location = boudoir ou bedroom (intime)
3. Pose = confiante, élégante (PAS allongée, PAS de dos)
4. Expression = warm, confident, glamorous (PAS sensual/alluring)
5. Caption = MICRO-STORY en anglais, mystérieux, avec soft CTA vers private

Réponds UNIQUEMENT avec ce JSON:
{
  "location_key": "...",
  "location_name": "...",
  "outfit": "description détaillée outfit sexy",
  "action": "pose + setting details",
  "mood": "confident",
  "expression": "expression from safe list",
  "caption": "MICRO-STORY caption en anglais avec \\n\\n entre paragraphes, soft CTA à la fin",
  "hashtags": ["#tag1", "#tag2", ...],
  "prompt_hints": "combined: location details + outfit + pose + lighting"
}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  let jsonStr = response.content[0].text;
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) jsonStr = jsonMatch[0];
  
  const post = JSON.parse(jsonStr);
  
  console.log('\n📋 Post généré:');
  console.log(`   Location: ${post.location_name}`);
  console.log(`   Outfit: ${post.outfit.substring(0, 60)}...`);
  console.log(`   Mood: ${post.mood}`);
  
  // ═══════════════════════════════════════════════════════════════
  // GENERATE IMAGES
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🎨 Generating 3 images (face ref only - audit fix)...');
  
  const { imageUrls } = await generateImagesForPost({
    character: 'elena',
    type: 'carousel',
    location_name: post.location_name,
    outfit: post.outfit,
    action: post.action,
    prompt_hints: post.prompt_hints,
    mood: post.mood,
  });
  
  console.log(`\n✅ ${imageUrls.length} images générées!`);
  imageUrls.forEach((url, i) => console.log(`   ${i+1}. ${url}`));
  
  // ═══════════════════════════════════════════════════════════════
  // PUBLISH TO INSTAGRAM
  // ═══════════════════════════════════════════════════════════════
  const fullCaption = post.caption + '\n\n' + post.hashtags.join(' ');
  
  console.log('\n📤 Publishing to Instagram...');
  
  const instagramPostId = await publishCarouselToInstagram('elena', imageUrls, fullCaption);
  
  console.log('\n' + '═'.repeat(60));
  console.log('✅ SUCCESS!');
  console.log('═'.repeat(60));
  console.log(`   Instagram Post ID: ${instagramPostId}`);
  console.log(`   Location: ${post.location_name}`);
  console.log(`   Outfit: ${post.outfit.substring(0, 50)}...`);
  console.log('\n🔥 Post SEXY MAX publié!\n');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
