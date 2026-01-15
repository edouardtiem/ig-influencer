#!/usr/bin/env node
/**
 * Upload Elena face references to Cloudinary + Test face swap
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Replicate from 'replicate';
import { createHash } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

const replicate = new Replicate({ auth: REPLICATE_API_TOKEN });

// Face references to upload
const FACE_REFS_DIR = path.join(__dirname, '../generated/elena-face-references');
const NSFW_DIR = path.join(__dirname, '../generated/venice-nsfw');
const OUTPUT_DIR = path.join(__dirname, '../generated/elena-faceswap');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ═══════════════════════════════════════════════════════════════
// CLOUDINARY UPLOAD
// ═══════════════════════════════════════════════════════════════

async function uploadToCloudinary(imagePath, publicId) {
  console.log(`  📤 Uploading ${path.basename(imagePath)}...`);
  
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');
  const dataUri = `data:image/png;base64,${base64}`;
  
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  const signature = createHash('sha1').update(paramsToSign).digest('hex');
  
  const formData = new URLSearchParams();
  formData.append('file', dataUri);
  formData.append('timestamp', timestamp.toString());
  formData.append('api_key', CLOUDINARY_API_KEY);
  formData.append('signature', signature);
  formData.append('public_id', publicId);
  
  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  if (data.error) throw new Error('Upload failed: ' + JSON.stringify(data.error));
  
  console.log(`  ✅ Uploaded: ${data.secure_url}`);
  return data.secure_url;
}

// ═══════════════════════════════════════════════════════════════
// FACE SWAP WITH REPLICATE
// ═══════════════════════════════════════════════════════════════

async function faceSwap(targetUrl, sourceUrl) {
  console.log('\n🔄 Starting face swap...');
  console.log(`  📸 Target: ...${targetUrl.slice(-40)}`);
  console.log(`  👤 Source: ...${sourceUrl.slice(-40)}`);
  
  const startTime = Date.now();
  
  const output = await replicate.run(
    'lucataco/faceswap:9a4298548422074c3f57258c5d544497314ae4112df80d116f0d2109e843d20d',
    {
      input: {
        target_image: targetUrl,
        swap_image: sourceUrl,
      }
    }
  );
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  ✅ Face swap completed in ${duration}s`);
  
  return output;
}

async function downloadAndSave(data, filename) {
  const filepath = path.join(OUTPUT_DIR, filename);
  
  // Handle ReadableStream
  if (data && typeof data === 'object' && Symbol.asyncIterator in data) {
    const chunks = [];
    for await (const chunk of data) {
      if (chunk instanceof Uint8Array) chunks.push(chunk);
    }
    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    fs.writeFileSync(filepath, Buffer.from(combined));
  } else if (typeof data === 'string' && data.startsWith('http')) {
    const response = await fetch(data);
    fs.writeFileSync(filepath, Buffer.from(await response.arrayBuffer()));
  } else if (Buffer.isBuffer(data)) {
    fs.writeFileSync(filepath, data);
  }
  
  console.log(`  💾 Saved: ${filepath}`);
  return filepath;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🎭 Upload Face References + Test Face Swap');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Step 1: Find latest face references
  const faceRefFiles = fs.readdirSync(FACE_REFS_DIR)
    .filter(f => f.startsWith('elena-face-') && f.endsWith('.png'))
    .sort()
    .reverse();
  
  // Get the latest set (same timestamp)
  const latestTimestamp = faceRefFiles[0]?.match(/-(\d+)\.png$/)?.[1];
  const latestRefs = faceRefFiles.filter(f => f.includes(latestTimestamp));
  
  console.log(`📸 Found ${latestRefs.length} face references to upload:\n`);
  latestRefs.forEach(f => console.log(`  - ${f}`));
  
  // Step 2: Upload to Cloudinary
  console.log('\n📤 STEP 1: Uploading to Cloudinary...\n');
  
  const uploadedUrls = {};
  for (const filename of latestRefs) {
    const filepath = path.join(FACE_REFS_DIR, filename);
    const publicId = `elena-face-refs/${filename.replace('.png', '')}`;
    
    try {
      const url = await uploadToCloudinary(filepath, publicId);
      const type = filename.includes('frontal') ? 'frontal' 
                 : filename.includes('3quarter-left') ? '3quarter-left'
                 : filename.includes('3quarter-right') ? '3quarter-right'
                 : filename.includes('profile') ? 'profile' : 'unknown';
      uploadedUrls[type] = url;
    } catch (e) {
      console.error(`  ❌ Failed: ${e.message}`);
    }
  }
  
  console.log('\n📋 Uploaded URLs:');
  Object.entries(uploadedUrls).forEach(([type, url]) => {
    console.log(`  ${type}: ${url}`);
  });
  
  // Step 3: Find latest NSFW image
  console.log('\n🔍 STEP 2: Finding latest NSFW image...\n');
  
  const nsfwFiles = fs.readdirSync(NSFW_DIR)
    .filter(f => f.startsWith('elena-nsfw-') && f.endsWith('.png'))
    .sort()
    .reverse();
  
  // Find a high quality one (>1MB)
  let targetNsfw = null;
  for (const f of nsfwFiles) {
    const stats = fs.statSync(path.join(NSFW_DIR, f));
    if (stats.size > 1000000) {
      targetNsfw = f;
      console.log(`  ✅ Found HQ image: ${f} (${(stats.size/1024/1024).toFixed(2)}MB)`);
      break;
    }
  }
  
  if (!targetNsfw) {
    console.error('  ❌ No high quality NSFW image found');
    return;
  }
  
  // Upload target NSFW to Cloudinary
  const targetPath = path.join(NSFW_DIR, targetNsfw);
  const targetUrl = await uploadToCloudinary(targetPath, `elena-nsfw-test/${targetNsfw.replace('.png', '')}`);
  
  // Step 4: Face swap with frontal reference
  console.log('\n🔄 STEP 3: Face Swap Test...\n');
  
  const frontalUrl = uploadedUrls['frontal'];
  if (!frontalUrl) {
    console.error('  ❌ No frontal face reference found');
    return;
  }
  
  const swapResult = await faceSwap(targetUrl, frontalUrl);
  
  // Save result
  const timestamp = Date.now();
  const outputPath = await downloadAndSave(swapResult, `elena-swap-v2-${timestamp}.png`);
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  ✅ COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('📋 New Face Reference URLs (add to .env.local):');
  console.log(`\nELENA_FACE_FRONTAL_URL=${uploadedUrls['frontal'] || ''}`);
  console.log(`ELENA_FACE_3QUARTER_LEFT_URL=${uploadedUrls['3quarter-left'] || ''}`);
  console.log(`ELENA_FACE_3QUARTER_RIGHT_URL=${uploadedUrls['3quarter-right'] || ''}`);
  
  console.log(`\n📁 Face swap result: ${outputPath}`);
  
  // Open result
  const { exec } = await import('child_process');
  exec(`open "${outputPath}"`);
}

main().catch(console.error);

