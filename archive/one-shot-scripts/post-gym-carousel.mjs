#!/usr/bin/env node
/**
 * Post gym carousel to Instagram using Meta Graph API
 * Mirror selfie first, then machines
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) process.env[key.trim()] = val.join('=').trim();
});

const INSTAGRAM_GRAPH_API = 'https://graph.facebook.com/v21.0';

// ═══════════════════════════════════════════════════════════════
// CAROUSEL IMAGES - Mirror selfie first!
// ═══════════════════════════════════════════════════════════════

const CAROUSEL_IMAGES = [
  // Photo 1: Mirror selfie (was generated as #4)
  'https://res.cloudinary.com/dily60mr0/image/upload/v1765706863/mila-posts/gym-carousel/gym-04-mirror-selfie-1765706861942.jpg',
  // Photo 2: Cable machine
  'https://res.cloudinary.com/dily60mr0/image/upload/v1765706706/mila-posts/gym-carousel/gym-01-cable-machine-1765706690344.jpg',
  // Photo 3: Leg press
  'https://res.cloudinary.com/dily60mr0/image/upload/v1765706766/mila-posts/gym-carousel/gym-02-leg-press-1765706766039.jpg',
  // Photo 4: Lat pulldown
  'https://res.cloudinary.com/dily60mr0/image/upload/v1765706811/mila-posts/gym-carousel/gym-03-lat-pulldown-1765706810694.jpg',
];

const CAPTION = `Leg day mais en vrai c'est full body 🦵💪

Dimanche = salle vide = bonheur absolu
Pas de queue aux machines, juste moi et mes podcasts 🎧

Qui d'autre profite du dimanche pour s'entraîner tranquille ?

.
.
.
#sundayworkout #gymgirl #legday #fitnessmotivation #parisfit #gymlife #workoutdone`;

// ═══════════════════════════════════════════════════════════════
// INSTAGRAM API FUNCTIONS
// ═══════════════════════════════════════════════════════════════

async function createMediaContainer(imageUrl, isCarouselItem = false) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;

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
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;

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
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
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

    process.stdout.write('.');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error('Media processing timeout');
}

async function publishMedia(containerId) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;

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
  console.log('🏋️ Posting Gym Carousel to Instagram...\n');

  if (!process.env.INSTAGRAM_ACCESS_TOKEN || !process.env.INSTAGRAM_ACCOUNT_ID) {
    console.error('❌ Missing INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_ACCOUNT_ID in .env.local');
    process.exit(1);
  }

  console.log(`📷 Images (${CAROUSEL_IMAGES.length}):`);
  CAROUSEL_IMAGES.forEach((url, i) => {
    console.log(`   ${i + 1}. ${url.split('/').pop()}`);
  });

  try {
    // Step 1: Create containers for each image
    console.log('\n🔨 Creating media containers...');
    const childIds = [];

    for (let i = 0; i < CAROUSEL_IMAGES.length; i++) {
      console.log(`   Image ${i + 1}/${CAROUSEL_IMAGES.length}...`);
      const containerId = await createMediaContainer(CAROUSEL_IMAGES[i], true);
      childIds.push(containerId);
      console.log(`   ✅ Container: ${containerId}`);
      await new Promise(r => setTimeout(r, 500));
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
    const carouselId = await createCarouselContainer(childIds, CAPTION);
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
    console.log(`\n📱 Check Instagram!`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
