#!/usr/bin/env node
/**
 * Face Swap Pipeline V2 — Optimized for realism
 * 
 * 1. yan-ops/face_swap (495M runs - most popular)
 * 2. sczhou/codeformer (face restoration)
 * 3. Angle matching (use 3/4 ref for 3/4 image)
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

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

// URLs from previous upload
const FACE_REFS = {
  frontal: 'https://res.cloudinary.com/dily60mr0/image/upload/v1767820579/elena-face-refs/elena-face-frontal-1767819850733.png',
  '3quarter-left': 'https://res.cloudinary.com/dily60mr0/image/upload/v1767820582/elena-face-refs/elena-face-3quarter-left-1767819850733.png',
  '3quarter-right': 'https://res.cloudinary.com/dily60mr0/image/upload/v1767820580/elena-face-refs/elena-face-3quarter-right-1767819850733.png',
};

// Target NSFW image (the one with face we want to replace)
const TARGET_URL = 'https://res.cloudinary.com/dily60mr0/image/upload/v1767820584/elena-nsfw-test/elena-nsfw-1767816145323.png';

const OUTPUT_DIR = path.join(__dirname, '../generated/elena-faceswap-v2');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ═══════════════════════════════════════════════════════════════
// STEP 1: FACE SWAP — yan-ops/face_swap (495M runs)
// ═══════════════════════════════════════════════════════════════

async function faceSwapYanOps(targetUrl, sourceUrl) {
  console.log('\n🔄 STEP 1: Face Swap (yan-ops/face_swap)...');
  console.log(`  📸 Target: ...${targetUrl.slice(-40)}`);
  console.log(`  👤 Source: ...${sourceUrl.slice(-40)}`);
  
  const startTime = Date.now();
  
  try {
    const output = await replicate.run(
      'yan-ops/face_swap:d5900f9ebed33e7ae08a07f17e0d98b4ebc68ab9528a70462afc3899cfe23bab',
      {
        input: {
          target_image: targetUrl,
          source_image: sourceUrl,
          det_thresh: 0.1,
          weight: 0.5,
        }
      }
    );
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`  ✅ Done in ${duration}s`);
    
    return output;
  } catch (e) {
    console.error('  ❌ Error:', e.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// STEP 2: FACE RESTORATION — CodeFormer
// ═══════════════════════════════════════════════════════════════

async function enhanceWithCodeFormer(imageUrl) {
  console.log('\n✨ STEP 2: Face Enhancement (CodeFormer)...');
  console.log(`  📸 Input: ...${imageUrl.slice(-40)}`);
  
  const startTime = Date.now();
  
  try {
    const output = await replicate.run(
      'sczhou/codeformer:7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56',
      {
        input: {
          image: imageUrl,
          upscale: 1,
          face_upsample: true,
          background_enhance: false,
          codeformer_fidelity: 0.5  // 0 = quality, 1 = fidelity to original
        }
      }
    );
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`  ✅ Done in ${duration}s`);
    
    return output;
  } catch (e) {
    console.error('  ❌ Error:', e.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Save image
// ═══════════════════════════════════════════════════════════════

async function saveImage(data, filename) {
  const filepath = path.join(OUTPUT_DIR, filename);
  
  // Handle yan-ops format: {code, image: ReadableStream, msg, status}
  if (data && typeof data === 'object' && data.image) {
    console.log(`  📥 yan-ops format detected, reading stream...`);
    data = data.image;
  }
  
  // Handle array output (common for Replicate)
  if (Array.isArray(data) && data.length > 0) {
    data = data[0];
  }
  
  if (typeof data === 'string' && data.startsWith('http')) {
    const response = await fetch(data);
    fs.writeFileSync(filepath, Buffer.from(await response.arrayBuffer()));
  } else if (typeof data === 'string' && data.startsWith('data:')) {
    const base64 = data.split(',')[1];
    fs.writeFileSync(filepath, Buffer.from(base64, 'base64'));
  } else if (data && typeof data === 'object' && (Symbol.asyncIterator in data || data.getReader)) {
    // ReadableStream
    const chunks = [];
    
    if (data.getReader) {
      // Web ReadableStream
      const reader = data.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value instanceof Uint8Array) chunks.push(value);
        else if (typeof value === 'string' && value.startsWith('http')) {
          const response = await fetch(value);
          fs.writeFileSync(filepath, Buffer.from(await response.arrayBuffer()));
          const stats = fs.statSync(filepath);
          console.log(`  💾 Saved: ${filename} (${(stats.size/1024).toFixed(0)}KB)`);
          return filepath;
        }
      }
    } else {
      // Async iterator
      for await (const chunk of data) {
        if (chunk instanceof Uint8Array) chunks.push(chunk);
        else if (typeof chunk === 'string' && chunk.startsWith('http')) {
          const response = await fetch(chunk);
          fs.writeFileSync(filepath, Buffer.from(await response.arrayBuffer()));
          const stats = fs.statSync(filepath);
          console.log(`  💾 Saved: ${filename} (${(stats.size/1024).toFixed(0)}KB)`);
          return filepath;
        }
      }
    }
    
    if (chunks.length > 0) {
      const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      fs.writeFileSync(filepath, Buffer.from(combined));
    }
  } else if (Buffer.isBuffer(data)) {
    fs.writeFileSync(filepath, data);
  } else {
    console.log('  ⚠️ Unknown data format:', typeof data, data);
    return null;
  }
  
  if (fs.existsSync(filepath)) {
    const stats = fs.statSync(filepath);
    console.log(`  💾 Saved: ${filename} (${(stats.size/1024).toFixed(0)}KB)`);
    return filepath;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🎭 Face Swap Pipeline V2 — Maximum Realism');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('\nPipeline:');
  console.log('  1. yan-ops/face_swap (495M runs - best quality)');
  console.log('  2. sczhou/codeformer (face restoration)');
  console.log('  3. Using 3/4 angle reference (matching target angle)\n');
  
  const timestamp = Date.now();
  
  // Use 3/4 left reference (target image is roughly 3/4 view)
  const sourceRef = FACE_REFS['3quarter-left'];
  console.log(`📸 Source reference: 3quarter-left`);
  console.log(`🎯 Target: NSFW image elena-nsfw-1767816145323.png\n`);
  
  // STEP 1: Face swap
  const swapResult = await faceSwapYanOps(TARGET_URL, sourceRef);
  
  if (!swapResult) {
    console.error('\n❌ Face swap failed');
    return;
  }
  
  // Save intermediate result
  const swapPath = await saveImage(swapResult, `step1-faceswap-${timestamp}.png`);
  
  // Get URL for step 2 (upload to temp or use direct)
  let swapUrl = swapResult;
  if (typeof swapResult !== 'string') {
    // Need to get URL - for now use file path approach
    // Actually let's upload to cloudinary quickly
    console.log('\n  📤 Uploading swap result for CodeFormer...');
    
    // Read the saved file and upload
    const { createHash } = await import('crypto');
    const imageBuffer = fs.readFileSync(swapPath);
    const base64 = imageBuffer.toString('base64');
    const dataUri = `data:image/png;base64,${base64}`;
    
    const ts = Math.floor(Date.now() / 1000);
    const publicId = `elena-faceswap-temp/swap-${timestamp}`;
    const sig = createHash('sha1')
      .update(`public_id=${publicId}&timestamp=${ts}${process.env.CLOUDINARY_API_SECRET}`)
      .digest('hex');
    
    const formData = new URLSearchParams();
    formData.append('file', dataUri);
    formData.append('timestamp', ts.toString());
    formData.append('api_key', process.env.CLOUDINARY_API_KEY);
    formData.append('signature', sig);
    formData.append('public_id', publicId);
    
    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );
    const uploadData = await uploadRes.json();
    swapUrl = uploadData.secure_url;
    console.log(`  ✅ Uploaded: ${swapUrl}`);
  }
  
  // STEP 2: CodeFormer enhancement
  const enhancedResult = await enhanceWithCodeFormer(swapUrl);
  
  if (!enhancedResult) {
    console.error('\n❌ Enhancement failed');
    return;
  }
  
  // Save final result
  const finalPath = await saveImage(enhancedResult, `final-enhanced-${timestamp}.png`);
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  ✅ PIPELINE COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('📁 Results saved to:', OUTPUT_DIR);
  console.log(`  Step 1 (swap): step1-faceswap-${timestamp}.png`);
  console.log(`  Final (enhanced): final-enhanced-${timestamp}.png`);
  
  // Open results
  const { exec } = await import('child_process');
  exec(`open "${OUTPUT_DIR}"`);
}

main().catch(console.error);

