#!/usr/bin/env node
/**
 * Post carousel directly to Instagram using Meta Graph API
 * 
 * Usage: node scripts/post-carousel-instagram.mjs
 * 
 * Requires in .env.local:
 *   INSTAGRAM_ACCESS_TOKEN=your_token
 *   INSTAGRAM_ACCOUNT_ID=your_ig_business_account_id
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

const INSTAGRAM_GRAPH_API = 'https://graph.facebook.com/v21.0';

// ═══════════════════════════════════════════════════════════════
// CAROUSEL IMAGES - From previous generation
// ═══════════════════════════════════════════════════════════════

const CAROUSEL_IMAGES = [
  'https://res.cloudinary.com/dily60mr0/image/upload/v1765536077/mila-posts/bali-carousel/bali-water-front-1765536076868.jpg',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1765536409/mila-posts/bali-carousel/bali-restaurant-watermelon-1765536408832.jpg',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1765536464/mila-posts/bali-carousel/bali-water-walking-1765536463789.jpg',
];

// Caption with engagement hooks
const CAPTION = `Ok mais... quelle photo vous préférez ? 👀

De la plage au resto, en passant par les pieds dans l'eau 🌊
Bali c'était vraiment un rêve éveillé 🌴✨

La pastèque au bord de la piscine > everything 🍉
(oui je mange en bikini au resto, no judgment pls 😅)

📍 Bali, Indonesia

Dites-moi votre préférée en commentaire ! 
1️⃣, 2️⃣ ou 3️⃣ ? ⬇️

.
.
.
#bali #balilife #beachvibes #travelgram #summervibes #bikiniseason #tropicalparadise #islandlife #balibabe #beachbabe #goldenhour #wanderlust #travelinfluencer #vacationmode #summermood`;

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

    // Show progress
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
  console.log('📸 Posting Bali carousel to Instagram...\n');

  // Check config
  if (!process.env.INSTAGRAM_ACCESS_TOKEN) {
    console.error('❌ INSTAGRAM_ACCESS_TOKEN not found in .env.local');
    console.log('\n📝 To get your token:');
    console.log('   1. Go to https://developers.facebook.com/tools/explorer/');
    console.log('   2. Select your app');
    console.log('   3. Get User Token with permissions: instagram_basic, instagram_content_publish, pages_read_engagement');
    console.log('   4. Add to .env.local: INSTAGRAM_ACCESS_TOKEN=your_token');
    process.exit(1);
  }

  if (!process.env.INSTAGRAM_ACCOUNT_ID) {
    console.error('❌ INSTAGRAM_ACCOUNT_ID not found in .env.local');
    console.log('\n📝 To get your Instagram Business Account ID:');
    console.log('   1. Go to Graph API Explorer');
    console.log('   2. Query: me/accounts?fields=instagram_business_account');
    console.log('   3. Copy the instagram_business_account.id');
    console.log('   4. Add to .env.local: INSTAGRAM_ACCOUNT_ID=your_id');
    process.exit(1);
  }

  console.log(`📷 Images: ${CAROUSEL_IMAGES.length}`);
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
    console.log(`   View at: https://www.instagram.com/p/${postId}/`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

