#!/usr/bin/env node
/**
 * Schedule Café Backshot Carousel to Instagram
 * Uses Instagram Graph API scheduled publishing
 * 
 * Run with: node scripts/schedule-cafe-carousel.mjs
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

// Load generated images from latest.json
function loadGeneratedImages() {
  const latestPath = path.join(__dirname, '..', 'generated', 'cafe-backshot-carousel', 'latest.json');
  
  if (!fs.existsSync(latestPath)) {
    console.error('❌ No generated images found. Run generate-cafe-backshot-carousel.mjs first.');
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(latestPath, 'utf-8'));
  console.log(`📷 Found ${data.urls.length} images from ${data.timestamp}`);
  return data;
}

// Get tomorrow at 14:22 Paris time
function getScheduledTime() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Set to 14:22 Paris time (UTC+1 in winter, UTC+2 in summer)
  // For December, Paris is UTC+1
  tomorrow.setUTCHours(13, 22, 0, 0); // 13:22 UTC = 14:22 Paris
  
  return tomorrow;
}

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

async function createScheduledCarouselContainer(childrenIds, caption, scheduledTime) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
  
  const scheduledTimestamp = Math.floor(scheduledTime.getTime() / 1000);

  const params = new URLSearchParams({
    media_type: 'CAROUSEL',
    children: childrenIds.join(','),
    caption: caption,
    access_token: accessToken,
    // Scheduling parameters
    published: 'false',
    scheduled_publish_time: scheduledTimestamp.toString(),
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

async function main() {
  console.log('📅 Scheduling Café Backshot Carousel to Instagram...\n');

  // Check config
  if (!process.env.INSTAGRAM_ACCESS_TOKEN) {
    console.error('❌ INSTAGRAM_ACCESS_TOKEN not found in .env.local');
    process.exit(1);
  }

  if (!process.env.INSTAGRAM_ACCOUNT_ID) {
    console.error('❌ INSTAGRAM_ACCOUNT_ID not found in .env.local');
    process.exit(1);
  }

  // Load generated images
  const generated = loadGeneratedImages();
  const { urls: CAROUSEL_IMAGES, caption: CAPTION } = generated;

  // Calculate scheduled time
  const scheduledTime = getScheduledTime();
  console.log(`\n⏰ Scheduled for: ${scheduledTime.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })} (Paris)`);
  console.log(`   Unix timestamp: ${Math.floor(scheduledTime.getTime() / 1000)}`);

  console.log(`\n📷 Images: ${CAROUSEL_IMAGES.length}`);
  CAROUSEL_IMAGES.forEach((url, i) => {
    console.log(`   ${i + 1}. ${url.split('/').pop()}`);
  });

  console.log(`\n📝 Caption preview:\n   "${CAPTION.split('\n')[0]}..."`);

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

    // Step 3: Create SCHEDULED carousel container
    console.log('\n🎠 Creating scheduled carousel...');
    const carouselId = await createScheduledCarouselContainer(childIds, CAPTION, scheduledTime);
    console.log(`   ✅ Scheduled carousel ID: ${carouselId}`);

    // Step 4: Wait for carousel to be ready
    process.stdout.write('\n⏳ Processing carousel');
    await waitForMediaReady(carouselId);
    console.log(' ✅');

    // Success!
    console.log('\n' + '═'.repeat(50));
    console.log('🎉 SUCCESS! Post scheduled!');
    console.log('═'.repeat(50));
    console.log(`\n📅 Will be published: ${scheduledTime.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`);
    console.log(`📱 Container ID: ${carouselId}`);
    console.log('\n💡 You can view scheduled posts in Instagram Creator Studio');
    console.log('   https://business.facebook.com/creatorstudio/');

    // Save scheduling info
    const scheduleInfo = {
      ...generated,
      scheduled: true,
      scheduledFor: scheduledTime.toISOString(),
      scheduledForParis: scheduledTime.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
      carouselContainerId: carouselId,
      childContainerIds: childIds,
    };
    
    const outputPath = path.join(__dirname, '..', 'generated', 'cafe-backshot-carousel', 'scheduled.json');
    fs.writeFileSync(outputPath, JSON.stringify(scheduleInfo, null, 2));
    console.log(`\n💾 Schedule info saved to: scheduled.json`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    // Common error handling
    if (error.message.includes('scheduled_publish_time')) {
      console.log('\n💡 Scheduling error. Make sure:');
      console.log('   - Time is at least 10 minutes in the future');
      console.log('   - Time is less than 75 days away');
      console.log('   - Your access token has instagram_content_publish permission');
    }
    
    process.exit(1);
  }
}

main();
