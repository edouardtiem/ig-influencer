#!/usr/bin/env node
/**
 * Post single image to Elena's Instagram
 * 
 * Usage: node scripts/post-single-elena.mjs
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
// IMAGE & CAPTION
// ═══════════════════════════════════════════════════════════════

const IMAGE_URL = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967074/replicate-prediction-1202s2ejr5rma0cv533b9k1ctr_fzrons.png';

const CAPTION = `Cette lumière ✨

Parfois les meilleurs moments arrivent quand on s'y attend le moins

#paris #parisienne #lifestyle #ootd #frenchgirl #goldenhour #aesthetic`;

// ═══════════════════════════════════════════════════════════════
// INSTAGRAM API FUNCTIONS
// ═══════════════════════════════════════════════════════════════

async function createMediaContainer(imageUrl, caption) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN_ELENA;
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID_ELENA;

  const params = new URLSearchParams({
    image_url: imageUrl,
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
  console.log('📸 Posting to Elena\'s Instagram...\n');

  if (!process.env.INSTAGRAM_ACCESS_TOKEN_ELENA) {
    console.error('❌ INSTAGRAM_ACCESS_TOKEN_ELENA not found in .env.local');
    process.exit(1);
  }

  if (!process.env.INSTAGRAM_ACCOUNT_ID_ELENA) {
    console.error('❌ INSTAGRAM_ACCOUNT_ID_ELENA not found in .env.local');
    process.exit(1);
  }

  console.log(`📷 Image: ${IMAGE_URL.split('/').pop()}`);
  console.log(`📝 Caption: ${CAPTION.split('\n')[0]}...\n`);

  try {
    // Step 1: Create container
    console.log('🔨 Creating media container...');
    const containerId = await createMediaContainer(IMAGE_URL, CAPTION);
    console.log(`   ✅ Container: ${containerId}`);

    // Step 2: Wait for processing
    process.stdout.write('⏳ Processing');
    await waitForMediaReady(containerId);
    console.log(' ✅');

    // Step 3: Publish!
    console.log('🚀 Publishing...');
    const postId = await publishMedia(containerId);

    console.log('\n🎉 SUCCESS!');
    console.log(`   Post ID: ${postId}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

