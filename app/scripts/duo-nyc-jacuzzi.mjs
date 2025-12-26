#!/usr/bin/env node
/**
 * Duo Post Script - Mila x Elena NYC Rooftop Jacuzzi
 * Single image post on Mila's account
 * 
 * Usage: node scripts/duo-nyc-jacuzzi.mjs [test]
 */

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length > 0 && !process.env[key]) {
      process.env[key] = val.join('=').trim();
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

const NANO_BANANA_MODEL = 'google/nano-banana-pro';

// Reference photos - 2 per person
const MILA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png';
const MILA_BODY_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_5_kyx12v.png';
const ELENA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png';
const ELENA_BODY_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png';

// ═══════════════════════════════════════════════════════════════
// PROMPT - From SESSION-17-DEC-2024-ELENA-GRAPH-API.md
// ═══════════════════════════════════════════════════════════════

const DUO_PROMPT = `Ultra realistic Instagram photo, two young women best friends relaxing in a rooftop jacuzzi in New York City, afternoon golden hour light, Manhattan skyline in background, steam rising from hot water,

BASED ON THE 4 PROVIDED REFERENCE IMAGES (2 per person), same faces and bodies as references:

PERSON 1 - MILA: Based on reference images 1-2, 23 year old French woman, oval face soft jawline, shoulder-length auburn hair type 3A loose curls natural volume, almond-shaped hazel-green eyes with golden flecks, straight nose slightly upturned tip, naturally full lips medium pink, healthy athletic curvy figure large natural D-cup breasts, narrow waist wide hips, wearing black string bikini,

PERSON 2 - ELENA: Based on reference images 3-4, 24 year old Italian woman, soft round pleasant face not angular, bronde hair dark roots with golden blonde balayage long beach waves wet from steam, honey brown warm eyes, naturally full lips nude-pink, small beauty mark on right cheekbone, feminine shapely figure very large natural F-cup breasts prominent, narrow waist wide hips, wearing cream string bikini, gold chunky chain bracelet on left wrist, layered gold necklaces,

SCENE: luxury rooftop jacuzzi hot tub, New York City Manhattan skyline visible behind them, late afternoon golden sunlight, steam rising, after-work relaxation vibes, champagne glasses on jacuzzi edge,

POSE: both women sitting in bubbling water chest-deep, Mila laughing naturally looking at Elena, Elena with confident relaxed smile looking at camera, intimate best friends moment,

STYLE: Instagram influencer aesthetic 2025, lifestyle photography, natural lighting, high resolution, realistic skin texture`;

// Caption for Mila's account
const CAPTION_MILA = `NYC with my girl @elenav.paris 🗽✨

Best views, best company 💕

#nyc #rooftop #bestfriends #manhattan #girlstrip #newyork #vacaymode`;

// Caption for Elena's account
const CAPTION_ELENA = `NYC avec ma bestie @mila.verne 🗽✨

Rooftop views, best company 💕

#nyc #rooftop #bestfriends #manhattan #girlstrip #newyork #vacaymode`;

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

async function urlToBase64(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch: ${url}`);
  const buffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') || 'image/png';
  return `data:${contentType};base64,${Buffer.from(buffer).toString('base64')}`;
}

// ═══════════════════════════════════════════════════════════════
// CLOUDINARY UPLOAD
// ═══════════════════════════════════════════════════════════════

async function uploadToCloudinary(imageUrl) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Missing Cloudinary credentials');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'mila-duo';
  
  const crypto = await import('crypto');
  const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

  const formData = new FormData();
  formData.append('file', imageUrl);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudinary upload failed: ${error}`);
  }

  const result = await response.json();
  return result.secure_url;
}

// ═══════════════════════════════════════════════════════════════
// IMAGE GENERATION
// ═══════════════════════════════════════════════════════════════

async function generateImage(replicate, prompt, base64Images) {
  const input = {
    prompt,
    aspect_ratio: '4:5',
    resolution: '2K',
    output_format: 'jpg',
    safety_filter_level: 'block_only_high',
  };

  if (base64Images && base64Images.length > 0) {
    input.image_input = base64Images;
  }

  const output = await replicate.run(NANO_BANANA_MODEL, { input });

  if (!output) throw new Error('No output from Nano Banana Pro');

  // Handle streaming response
  if (typeof output === 'object' && Symbol.asyncIterator in output) {
    const chunks = [];
    for await (const chunk of output) {
      if (chunk instanceof Uint8Array) {
        chunks.push(chunk);
      } else if (typeof chunk === 'string') {
        return chunk;
      }
    }
    
    if (chunks.length > 0) {
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      return `data:image/jpeg;base64,${Buffer.from(combined).toString('base64')}`;
    }
  }

  if (typeof output === 'string') return output;
  if (Array.isArray(output) && output[0]) return output[0];

  throw new Error('Could not process API response');
}

// ═══════════════════════════════════════════════════════════════
// INSTAGRAM PUBLISH
// ═══════════════════════════════════════════════════════════════

async function waitForMediaReady(containerId, accessToken, maxWaitMs = 120000) {
  const startTime = Date.now();
  const pollInterval = 3000;
  
  while (Date.now() - startTime < maxWaitMs) {
    const statusUrl = `https://graph.facebook.com/v18.0/${containerId}?fields=status_code,status&access_token=${accessToken}`;
    
    try {
      const response = await fetch(statusUrl);
      const data = await response.json();
      
      if (data.status_code === 'FINISHED') {
        log('  ✅ Media ready!');
        return true;
      }
      
      if (data.status_code === 'ERROR') {
        throw new Error(`Media processing failed: ${data.status || 'Unknown error'}`);
      }
      
      log(`  ⏳ Status: ${data.status_code || 'processing'}...`);
    } catch {
      log(`  ⏳ Checking status...`);
    }
    
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  throw new Error('Media processing timeout');
}

async function publishSingleImage(imageUrl, caption, account = 'elena') {
  // Use Elena's credentials (since Mila's token is expired)
  const accessToken = account === 'elena' 
    ? process.env.INSTAGRAM_ACCESS_TOKEN_ELENA 
    : process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = account === 'elena'
    ? process.env.INSTAGRAM_ACCOUNT_ID_ELENA
    : process.env.INSTAGRAM_ACCOUNT_ID;

  if (!accessToken || !accountId) {
    throw new Error(`Missing Instagram credentials (${account})`);
  }

  log(`📤 Publishing single image to ${account === 'elena' ? 'Elena' : 'Mila'}'s account...`);

  // Create media container
  const params = new URLSearchParams({
    image_url: imageUrl,
    caption,
    access_token: accessToken,
  });

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${accountId}/media?${params}`,
    { method: 'POST' }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create container: ${JSON.stringify(error)}`);
  }

  const result = await response.json();
  const containerId = result.id;

  // Wait for ready
  log('  Waiting for media to be ready...');
  await waitForMediaReady(containerId, accessToken);

  // Publish
  const maxRetries = 5;
  const baseDelay = 5000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    log(`  Publishing... (attempt ${attempt}/${maxRetries})`);
    
    const publishParams = new URLSearchParams({
      creation_id: containerId,
      access_token: accessToken,
    });

    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${accountId}/media_publish?${publishParams}`,
      { method: 'POST' }
    );

    const publishResult = await publishResponse.json();
    
    if (publishResult.id) {
      return publishResult.id;
    }
    
    if (publishResult.error?.error_subcode === 2207027) {
      const delay = baseDelay * attempt;
      log(`  ⏳ Media not ready, waiting ${delay/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    
    throw new Error(`Failed to publish: ${JSON.stringify(publishResult)}`);
  }
  
  throw new Error('Max retries reached');
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  const isTest = process.argv[2] === 'test';

  log('═══════════════════════════════════════════════════════════════');
  log('🗽 DUO POST: MILA x ELENA - NYC ROOFTOP JACUZZI');
  log('═══════════════════════════════════════════════════════════════');
  
  if (isTest) log('🧪 TEST MODE - will not publish');

  // Check env vars
  const requiredEnvVars = [
    'REPLICATE_API_TOKEN',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ];
  
  if (!isTest) {
    requiredEnvVars.push('INSTAGRAM_ACCESS_TOKEN', 'INSTAGRAM_ACCOUNT_ID');
  }

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`❌ Missing: ${envVar}`);
      process.exit(1);
    }
  }

  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  try {
    // Step 1: Convert references to base64
    log('\n📸 Loading reference images...');
    const refs = [MILA_FACE_REF, MILA_BODY_REF, ELENA_FACE_REF, ELENA_BODY_REF];
    const base64Images = await Promise.all(refs.map(url => urlToBase64(url)));
    log(`  ✅ Loaded ${base64Images.length} references`);

    // Step 2: Generate image
    log('\n🎨 Generating duo image...');
    const startTime = Date.now();
    const imageUrl = await generateImage(replicate, DUO_PROMPT, base64Images);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`  ✅ Generated in ${duration}s`);

    // Step 3: Upload to Cloudinary
    log('\n☁️ Uploading to Cloudinary...');
    const cloudinaryUrl = await uploadToCloudinary(imageUrl);
    log(`  ✅ Uploaded: ${cloudinaryUrl}`);

    // Step 4: Publish to Mila's account
    if (isTest) {
      log('\n🧪 TEST MODE - Skipping publish');
      log(`\n📝 Caption:\n${CAPTION_MILA}`);
      log(`\n🖼️ Image URL: ${cloudinaryUrl}`);
    } else {
      const postId = await publishSingleImage(cloudinaryUrl, CAPTION_MILA, 'mila');
      log(`\n✅ PUBLISHED on @mila.verne! Post ID: ${postId}`);
    }

    log('\n═══════════════════════════════════════════════════════════════');
    log('✨ DUO POST COMPLETE');
    log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main();

