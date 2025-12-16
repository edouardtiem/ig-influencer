#!/usr/bin/env node
/**
 * Post Reel to Instagram
 * 
 * 1. Upload video to Cloudinary
 * 2. Create Instagram Reel container
 * 3. Publish
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

const REEL_PATH = '/Users/edouardtiem/Cursor Projects/IG-influencer/app/generated/multishot-test/reel-1765810344188.mp4';

const CAPTION = `gym day never skip 💪

just 3 exercises but feeling it already 🔥

who else is hitting the gym today? 

#gymgirl #fitnessmotivation #legday #workoutmotivation #gymlife #fitnessjourney #strongwomen #mondaymotivation`;

const INSTAGRAM_GRAPH_API = 'https://graph.facebook.com/v21.0';

// ═══════════════════════════════════════════════════════════════
// CLOUDINARY UPLOAD
// ═══════════════════════════════════════════════════════════════

async function uploadToCloudinary(videoPath) {
  console.log('\n📤 Uploading to Cloudinary...');
  
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  const result = await cloudinary.uploader.upload(videoPath, {
    folder: 'mila-verne/reels',
    resource_type: 'video',
    unique_filename: true,
  });
  
  console.log('✅ Uploaded:', result.secure_url);
  return result.secure_url;
}

// ═══════════════════════════════════════════════════════════════
// INSTAGRAM REEL POSTING
// ═══════════════════════════════════════════════════════════════

async function createReelContainer(videoUrl, caption) {
  console.log('\n📱 Creating Instagram Reel container...');
  
  const params = new URLSearchParams({
    media_type: 'REELS',
    video_url: videoUrl,
    caption: caption,
    access_token: process.env.INSTAGRAM_ACCESS_TOKEN,
  });
  
  const response = await fetch(
    `${INSTAGRAM_GRAPH_API}/${process.env.INSTAGRAM_ACCOUNT_ID}/media?${params}`,
    { method: 'POST' }
  );
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Instagram API error: ${data.error.message}`);
  }
  
  console.log('✅ Container created:', data.id);
  return data.id;
}

async function waitForReelReady(containerId, maxWaitMs = 120000) {
  console.log('\n⏳ Waiting for Reel processing...');
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    const params = new URLSearchParams({
      fields: 'status_code,status',
      access_token: process.env.INSTAGRAM_ACCESS_TOKEN,
    });
    
    const response = await fetch(
      `${INSTAGRAM_GRAPH_API}/${containerId}?${params}`
    );
    
    const data = await response.json();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    
    console.log(`   Status: ${data.status_code} (${elapsed}s)`);
    
    if (data.status_code === 'FINISHED') {
      return true;
    }
    
    if (data.status_code === 'ERROR') {
      throw new Error(`Reel processing failed: ${data.status || 'Unknown error'}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  throw new Error('Reel processing timeout');
}

async function publishReel(containerId) {
  console.log('\n🚀 Publishing Reel...');
  
  const params = new URLSearchParams({
    creation_id: containerId,
    access_token: process.env.INSTAGRAM_ACCESS_TOKEN,
  });
  
  const response = await fetch(
    `${INSTAGRAM_GRAPH_API}/${process.env.INSTAGRAM_ACCOUNT_ID}/media_publish?${params}`,
    { method: 'POST' }
  );
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Instagram API error: ${data.error.message}`);
  }
  
  console.log('✅ Published! Post ID:', data.id);
  return data.id;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('\n' + '█'.repeat(60));
  console.log('🎬 POST REEL TO INSTAGRAM');
  console.log('█'.repeat(60));
  
  // Check file exists
  if (!fs.existsSync(REEL_PATH)) {
    console.log('❌ Reel not found:', REEL_PATH);
    process.exit(1);
  }
  
  const fileSize = (fs.statSync(REEL_PATH).size / 1024 / 1024).toFixed(2);
  console.log(`\n📹 Reel: ${path.basename(REEL_PATH)} (${fileSize} MB)`);
  console.log(`📝 Caption: ${CAPTION.slice(0, 50)}...`);
  
  try {
    // Step 1: Upload to Cloudinary
    const videoUrl = await uploadToCloudinary(REEL_PATH);
    
    // Step 2: Create Instagram container
    const containerId = await createReelContainer(videoUrl, CAPTION);
    
    // Step 3: Wait for processing
    await waitForReelReady(containerId);
    
    // Step 4: Publish
    const postId = await publishReel(containerId);
    
    console.log('\n' + '█'.repeat(60));
    console.log('✅ REEL POSTED SUCCESSFULLY!');
    console.log('█'.repeat(60));
    console.log(`\n🔗 https://www.instagram.com/reel/${postId}/`);
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

