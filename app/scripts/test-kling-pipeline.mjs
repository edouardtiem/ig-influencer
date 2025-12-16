#!/usr/bin/env node
/**
 * Test Kling Pipeline - Quick validation
 * Tests the kling.ts service with a single image
 */

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
// TEST CONFIG
// ═══════════════════════════════════════════════════════════════

const TEST_IMAGE = '/Users/edouardtiem/Cursor Projects/IG-influencer/app/generated/gym-carousel/gym-04-mirror-selfie-1765706861941.jpg';
const TEST_PROMPT = `Fitness motivation. The woman in athletic wear takes a confident breath, slight body repositioning. Gym ambient lighting.`;

// ═══════════════════════════════════════════════════════════════
// KLING SERVICE (inline test version)
// ═══════════════════════════════════════════════════════════════

function fileToBase64(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const base64 = fileBuffer.toString('base64');
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
}

function extractVideoUrl(output) {
  if (typeof output === 'string') return output;
  if (output?.url) return typeof output.url === 'function' ? output.url().href : String(output.url);
  if (output?.video) return typeof output.video === 'string' ? output.video : output.video?.url;
  if (Array.isArray(output) && output[0]) {
    const first = output[0];
    return typeof first === 'string' ? first : (first?.url || first?.video);
  }
  return null;
}

async function generateVideo(client, { prompt, imagePath, duration = 5, aspectRatio = '9:16' }) {
  if (!fs.existsSync(imagePath)) {
    return { success: false, error: `Image not found: ${imagePath}` };
  }
  
  const imageInput = fileToBase64(imagePath);
  console.log('[Kling] Generating video...');
  console.log('[Kling] Duration:', duration, 's');
  console.log('[Kling] Prompt:', prompt.slice(0, 80) + '...');
  
  const startTime = Date.now();
  
  try {
    const output = await client.run("kwaivgi/kling-v2.5-turbo-pro", {
      input: {
        prompt,
        image: imageInput,
        duration,
        aspect_ratio: aspectRatio,
      }
    });
    
    const durationMs = Date.now() - startTime;
    const videoUrl = extractVideoUrl(output);
    
    if (!videoUrl) {
      return { success: false, error: `No video URL in output`, durationMs };
    }
    
    console.log('[Kling] Generated in', (durationMs / 1000).toFixed(1), 's');
    return { success: true, videoUrl, durationMs };
    
  } catch (error) {
    return { success: false, error: error.message, durationMs: Date.now() - startTime };
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('🎬 KLING PIPELINE TEST');
  console.log('═'.repeat(60) + '\n');
  
  // Check image exists
  if (!fs.existsSync(TEST_IMAGE)) {
    console.log('❌ Test image not found:', TEST_IMAGE);
    process.exit(1);
  }
  console.log('✅ Test image found:', path.basename(TEST_IMAGE));
  
  // Initialize client
  const client = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  // Generate
  console.log('\n⏳ Generating 5s test clip...\n');
  const result = await generateVideo(client, {
    prompt: TEST_PROMPT,
    imagePath: TEST_IMAGE,
    duration: 5,
    aspectRatio: '9:16',
  });
  
  console.log('\n' + '─'.repeat(60));
  if (result.success) {
    console.log('✅ SUCCESS');
    console.log('🔗 Video URL:', result.videoUrl);
    console.log('⏱️  Time:', (result.durationMs / 1000).toFixed(1), 's');
    console.log('💰 Cost: ~$0.40');
  } else {
    console.log('❌ FAILED:', result.error);
  }
  console.log('─'.repeat(60) + '\n');
}

main().catch(console.error);

