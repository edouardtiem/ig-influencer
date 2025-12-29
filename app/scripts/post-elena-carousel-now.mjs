#!/usr/bin/env node
/**
 * Post carousel for Elena with Content Brain V3 caption generation
 * 
 * Usage: node scripts/post-elena-carousel-now.mjs
 * 
 * Requires in .env.local:
 *   INSTAGRAM_ACCESS_TOKEN_ELENA=your_token
 *   INSTAGRAM_ACCOUNT_ID_ELENA=your_ig_business_account_id
 *   ANTHROPIC_API_KEY=your_claude_key
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const INSTAGRAM_GRAPH_API = 'https://graph.facebook.com/v21.0';
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.Claude_key,
});

// ═══════════════════════════════════════════════════════════════
// CAROUSEL IMAGES
// ═══════════════════════════════════════════════════════════════

const CAROUSEL_IMAGES = [
  'https://res.cloudinary.com/dily60mr0/image/upload/v1766669477/elena-scheduled/reel-2-1766669477.jpg',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1766669427/elena-scheduled/reel-1-1766669427.jpg',
];

// ═══════════════════════════════════════════════════════════════
// CAPTION GENERATION (Content Brain V3 - Elena Voice)
// ═══════════════════════════════════════════════════════════════

async function generateCaption() {
  console.log('🧠 Generating caption with Content Brain V3...\n');

  const prompt = `Tu es Elena Visconti (@elenav.paris), 24 ans, mannequin et influenceuse mode à Paris.

## Character Voice: La Femme Fatale Mystérieuse
- Tu tease, suggères, ne dis jamais tout
- Ton : mystérieux, sensuel, confiant
- Thèmes : luxe vs authenticité, apparences, secrets
- Hook style : "Ce que personne ne sait..." / "Derrière les photos..." / "Le secret c'est..." / "Certains pensent que..." / "On me demande souvent si..."

## Format Long Caption FR
[HOOK - 1 ligne choc en français]

[DÉVELOPPEMENT - 3-5 phrases, ton personnel]

[QUESTION/CTA - engagement]

[HASHTAGS - 15-20]

## Instructions
Génère une caption Instagram pour un carousel de 2 photos (reels/images lifestyle).
- Hook accrocheur en français (1 ligne)
- Développement 3-5 phrases dans la voix d'Elena (mystérieuse, sensuelle, confiante)
- Question ou CTA pour engagement
- 15-20 hashtags pertinents (mix trending + evergreen)
- Ton : casual luxe, confident, playful, French touch
- Mélange français/anglais naturel si besoin
- Émojis avec parcimonie (2-3 max)

Réponds UNIQUEMENT avec un JSON valide:
{
  "hook": "Hook accrocheur (1 ligne)",
  "body": "Développement 3-5 phrases",
  "cta": "Question ou CTA engagement",
  "hashtags": ["#tag1", "#tag2", ...]
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent) throw new Error('No text response');

    // Extract JSON
    let jsonStr = textContent.text;
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
    } else {
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      jsonStr = jsonMatch[0];
    }

    const captionData = JSON.parse(jsonStr);
    
    // Build final caption
    const caption = `${captionData.hook}

${captionData.body}

${captionData.cta}

${captionData.hashtags.join(' ')}`;

    console.log('✅ Caption generated:\n');
    console.log(caption);
    console.log('\n');
    
    return caption;
  } catch (error) {
    console.error('❌ Error generating caption:', error.message);
    // Fallback caption
    return `Ce que personne ne sait... ✨

Derrière les photos, il y a toujours une histoire. Une lumière, un moment, un sentiment qu'on veut capturer.

Ces deux moments, deux ambiances différentes mais la même énergie. La même confiance.

Laquelle vous préfèrez ? 1️⃣ ou 2️⃣ ? 👀

#paris #parisianstyle #frenchgirl #lifestyle #fashion #model #paris8e #frenchstyle #parisianlife #ootd #style #fashionblogger #parisian #frenchfashion #parisienne #lifestyleblogger #fashionista #parisvibes #frenchgirlstyle`;
  }
}

// ═══════════════════════════════════════════════════════════════
// INSTAGRAM API FUNCTIONS
// ═══════════════════════════════════════════════════════════════

async function createMediaContainer(imageUrl, isCarouselItem = false) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN_ELENA;
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID_ELENA;

  const params = new URLSearchParams({
    image_url: imageUrl,
    access_token: accessToken,
  });

  if (isCarouselItem) {
    params.append('is_carousel_item', 'true');
  }

  const response = await fetch(
    `${INSTAGRAM_GRAPH_API}/${accountId}/media?${params}`,
    { method: 'POST' }
  );

  const data = await response.json();
  if (data.error) {
    throw new Error(`Instagram API: ${data.error.message}`);
  }

  return data.id;
}

async function createCarouselContainer(childrenIds, caption) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN_ELENA;
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID_ELENA;

  const params = new URLSearchParams({
    media_type: 'CAROUSEL',
    children: childrenIds.join(','),
    caption: caption,
    access_token: accessToken,
  });

  const response = await fetch(
    `${INSTAGRAM_GRAPH_API}/${accountId}/media?${params}`,
    { method: 'POST' }
  );

  const data = await response.json();
  if (data.error) {
    throw new Error(`Instagram API: ${data.error.message}`);
  }

  return data.id;
}

async function waitForMediaReady(containerId, maxWaitMs = 120000) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN_ELENA;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const params = new URLSearchParams({
      fields: 'status_code,status',
      access_token: accessToken,
    });

    const response = await fetch(`${INSTAGRAM_GRAPH_API}/${containerId}?${params}`);
    const data = await response.json();

    if (data.status_code === 'FINISHED') {
      return true;
    }

    if (data.status_code === 'ERROR') {
      throw new Error(`Media processing failed: ${data.status || 'Unknown error'}`);
    }

    // Show progress
    process.stdout.write('.');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error('Media processing timeout');
}

async function publishMedia(containerId) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN_ELENA;
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID_ELENA;

  const params = new URLSearchParams({
    creation_id: containerId,
    access_token: accessToken,
  });

  const response = await fetch(
    `${INSTAGRAM_GRAPH_API}/${accountId}/media_publish?${params}`,
    { method: 'POST' }
  );

  const data = await response.json();
  if (data.error) {
    throw new Error(`Instagram API: ${data.error.message}`);
  }

  return data.id;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('📸 Posting Elena carousel to Instagram...\n');

  // Check config
  if (!process.env.INSTAGRAM_ACCESS_TOKEN_ELENA) {
    console.error('❌ INSTAGRAM_ACCESS_TOKEN_ELENA not found in .env.local');
    process.exit(1);
  }

  if (!process.env.INSTAGRAM_ACCOUNT_ID_ELENA) {
    console.error('❌ INSTAGRAM_ACCOUNT_ID_ELENA not found in .env.local');
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY && !process.env.Claude_key) {
    console.error('❌ ANTHROPIC_API_KEY not found in .env.local');
    process.exit(1);
  }

  console.log(`📷 Images: ${CAROUSEL_IMAGES.length}`);
  CAROUSEL_IMAGES.forEach((url, i) => {
    console.log(`   ${i + 1}. ${url.split('/').pop()}`);
  });

  // Generate caption
  const caption = await generateCaption();

  try {
    // Step 1: Create containers for each image
    console.log('\n🔨 Creating media containers...');
    const childIds = [];

    for (let i = 0; i < CAROUSEL_IMAGES.length; i++) {
      console.log(`   Image ${i + 1}/${CAROUSEL_IMAGES.length}...`);
      const containerId = await createMediaContainer(CAROUSEL_IMAGES[i], true);
      childIds.push(containerId);
      console.log(`   ✅ Container: ${containerId}`);
      await new Promise(r => setTimeout(r, 500)); // Rate limit
    }

    // Step 2: Wait for all to be ready
    console.log('\n⏳ Waiting for images to process');
    for (let i = 0; i < childIds.length; i++) {
      process.stdout.write(`   Image ${i + 1}: `);
      await waitForMediaReady(childIds[i]);
      console.log(' ✅');
    }

    // Step 3: Create carousel container
    console.log('\n🎠 Creating carousel...');
    const carouselId = await createCarouselContainer(childIds, caption);
    console.log(`   ✅ Carousel container: ${carouselId}`);

    // Step 4: Wait for carousel
    process.stdout.write('\n⏳ Processing carousel');
    await waitForMediaReady(carouselId);
    console.log(' ✅');

    // Step 5: Publish!
    console.log('\n🚀 Publishing...');
    const postId = await publishMedia(carouselId);

    console.log('\n🎉 SUCCESS!');
    console.log(`   Post ID: ${postId}`);
    console.log(`   View at: https://www.instagram.com/p/${postId}/`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();


