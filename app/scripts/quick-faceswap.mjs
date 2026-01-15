#!/usr/bin/env node
/**
 * Quick face swap on a local image with Elena's face
 * Uses Replicate lucataco/faceswap
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Replicate from 'replicate';

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

if (!REPLICATE_API_TOKEN) {
  console.error('❌ REPLICATE_API_TOKEN not found in .env.local');
  process.exit(1);
}

const replicate = new Replicate({ auth: REPLICATE_API_TOKEN });

// Elena face reference (frontal face on Cloudinary)
const ELENA_FACE = process.env.ELENA_BASE_FACE_URL || 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png';

// Target image - last generated NSFW image
const TARGET_IMAGE = path.join(__dirname, '../generated/venice-nsfw/elena-nsfw-1767816145323.png');

// Output directory
const OUTPUT_DIR = path.join(__dirname, '../generated/elena-faceswap');

async function uploadToCloudinary(imagePath) {
  console.log('📤 Uploading image to Cloudinary...');
  
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials not found in .env.local');
  }
  
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');
  const dataUri = `data:image/png;base64,${base64}`;
  
  const timestamp = Math.floor(Date.now() / 1000);
  const { createHash } = await import('crypto');
  const signature = createHash('sha1')
    .update(`timestamp=${timestamp}${apiSecret}`)
    .digest('hex');
  
  const formData = new URLSearchParams();
  formData.append('file', dataUri);
  formData.append('timestamp', timestamp.toString());
  formData.append('api_key', apiKey);
  formData.append('signature', signature);
  
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  if (data.error) throw new Error('Upload failed: ' + JSON.stringify(data.error));
  
  console.log('✅ Uploaded:', data.secure_url);
  return data.secure_url;
}

async function faceSwap(targetImageUrl, sourceFaceUrl) {
  console.log('\n🔄 Starting face swap with Replicate...');
  console.log('📸 Target:', targetImageUrl.slice(0, 60) + '...');
  console.log('📸 Source (Elena):', sourceFaceUrl.slice(-50));
  
  const startTime = Date.now();
  
  // Try lucataco/faceswap first
  try {
    console.log('\n🔧 Using lucataco/faceswap...');
    
    const output = await replicate.run('lucataco/faceswap:9a4298548422074c3f57258c5d544497314ae4112df80d116f0d2109e843d20d', {
      input: {
        target_image: targetImageUrl,
        swap_image: sourceFaceUrl,
      }
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Face swap completed in ${duration}s`);
    
    return Array.isArray(output) ? output[0] : output;
    
  } catch (e) {
    console.log('❌ lucataco/faceswap failed:', e.message.slice(0, 100));
    
    // Fallback to codeplugtech
    console.log('\n🔧 Trying codeplugtech/face-swap...');
    
    const output = await replicate.run('codeplugtech/face-swap:278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34', {
      input: {
        target_image: targetImageUrl,
        source_image: sourceFaceUrl,
      }
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Face swap completed in ${duration}s`);
    
    return Array.isArray(output) ? output[0] : output;
  }
}

async function downloadResult(url, filename) {
  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  
  return filepath;
}

async function main() {
  console.log('🎭 Quick Face Swap — Elena + Venice NSFW\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`📁 Target: ${path.basename(TARGET_IMAGE)}`);
  console.log(`👤 Source: Elena face reference`);
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  if (!fs.existsSync(TARGET_IMAGE)) {
    console.error('❌ Target image not found:', TARGET_IMAGE);
    process.exit(1);
  }
  
  try {
    // Step 1: Upload target image to get URL
    const targetUrl = await uploadToCloudinary(TARGET_IMAGE);
    
    // Step 2: Face swap
    const resultUrl = await faceSwap(targetUrl, ELENA_FACE);
    console.log('\n🖼️  Result URL:', resultUrl);
    
    // Step 3: Download result
    const timestamp = Date.now();
    const outputPath = await downloadResult(resultUrl, `elena-swap-${timestamp}.png`);
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  ✅ FACE SWAP COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`\n📁 Saved to: ${outputPath}`);
    
    // Open result
    const { exec } = await import('child_process');
    exec(`open "${outputPath}"`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

main();
