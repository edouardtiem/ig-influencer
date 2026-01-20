#!/usr/bin/env node
/**
 * Test: Sexy terms with FACE ref only
 */

import Replicate from 'replicate';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const ELENA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png';

async function urlToBase64(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return `data:image/jpeg;base64,${Buffer.from(buffer).toString('base64')}`;
}

async function main() {
  const testNum = parseInt(process.argv[2]) || 1;
  
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('❌ REPLICATE_API_TOKEN not set');
    process.exit(1);
  }
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  const tests = {
    1: {
      name: "Bikini + 'captivating gaze, lips parted'",
      prompt: `Professional Instagram photo.
Beautiful woman with bronde hair, honey brown eyes, soft pleasant face.
Wearing black bikini on beach, sunset lighting.
Captivating gaze at camera, lips slightly parted.
Shot on iPhone 15 Pro.`
    },
    2: {
      name: "Bikini + 'sensual alluring'",
      prompt: `Professional Instagram photo.
Beautiful woman with bronde hair, honey brown eyes.
Wearing black bikini on beach.
Sensual alluring expression, confident pose.
Shot on iPhone 15 Pro.`
    },
    3: {
      name: "Evening + 'magnetic sultry'",
      prompt: `Professional Instagram photo.
Beautiful woman with bronde hair, honey brown eyes.
Wearing elegant black dress with plunging neckline.
Magnetic sultry gaze, confident glamorous pose.
Shot on iPhone 15 Pro.`
    },
    4: {
      name: "Lingerie test - 'silk robe boudoir'",
      prompt: `Professional Instagram photo.
Beautiful woman with bronde hair, honey brown eyes.
Wearing silk champagne robe, loosely tied, elegant loungewear.
Soft morning light, getting ready moment.
Natural relaxed expression.
Shot on iPhone 15 Pro.`
    }
  };

  const test = tests[testNum];
  if (!test) {
    console.log('Tests:');
    Object.entries(tests).forEach(([n, t]) => console.log(`  ${n}: ${t.name}`));
    return;
  }

  console.log(`\n🧪 ${test.name}`);
  console.log('═'.repeat(60));
  console.log('Using: FACE ref only');
  
  const faceBase64 = await urlToBase64(ELENA_FACE_REF);
  console.log('⏳ Generating...');
  
  const startTime = Date.now();
  
  try {
    const output = await replicate.run("google/nano-banana-pro", {
      input: {
        prompt: test.prompt,
        aspect_ratio: "4:5",
        resolution: "2K",
        output_format: "jpg",
        safety_filter_level: "block_only_high",
        image_input: [faceBase64],
      },
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ PASSED in ${duration}s`);
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const blocked = error.message?.includes('flagged') || error.message?.includes('sensitive');
    console.log(`\n${blocked ? '❌ BLOCKED' : '⚠️ ERROR'} in ${duration}s`);
    console.log(`Error: ${error.message?.substring(0, 150)}`);
  }
}

main().catch(console.error);
