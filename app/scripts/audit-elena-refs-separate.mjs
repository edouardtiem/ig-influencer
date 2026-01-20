#!/usr/bin/env node
/**
 * Test: Which Elena reference is flagged? Face or Body?
 */

import Replicate from 'replicate';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const ELENA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png';
const ELENA_BODY_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png';

const PROMPT = `Professional Instagram photo.
Beautiful woman with bronde hair, honey brown eyes, soft pleasant face.
Wearing cream cashmere sweater, sitting on sofa.
Natural warm expression.
Shot on iPhone 15 Pro.`;

async function urlToBase64(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return `data:image/jpeg;base64,${Buffer.from(buffer).toString('base64')}`;
}

async function test(replicate, name, refs) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`TEST: ${name}`);
  console.log(`${'═'.repeat(60)}`);
  
  const startTime = Date.now();
  
  try {
    const refBase64 = refs.length > 0 ? await Promise.all(refs.map(urlToBase64)) : undefined;
    
    const output = await replicate.run("google/nano-banana-pro", {
      input: {
        prompt: PROMPT,
        aspect_ratio: "4:5",
        resolution: "2K", 
        output_format: "jpg",
        safety_filter_level: "block_only_high",
        image_input: refBase64,
      },
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ PASSED in ${duration}s`);
    return 'PASSED';
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const blocked = error.message?.includes('flagged') || error.message?.includes('sensitive');
    console.log(`${blocked ? '❌ BLOCKED' : '⚠️ ERROR'} in ${duration}s`);
    console.log(`Error: ${error.message?.substring(0, 100)}`);
    return blocked ? 'BLOCKED' : 'ERROR';
  }
}

async function main() {
  const testNum = parseInt(process.argv[2]) || 0;
  
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('❌ REPLICATE_API_TOKEN not set');
    process.exit(1);
  }
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  console.log('\n🔍 ELENA REFERENCE AUDIT');
  console.log('Which reference image is flagged?');
  
  const tests = {
    1: { name: "FACE ref only", refs: [ELENA_FACE_REF] },
    2: { name: "BODY ref only", refs: [ELENA_BODY_REF] },
    3: { name: "BOTH refs", refs: [ELENA_FACE_REF, ELENA_BODY_REF] },
    0: { name: "NO refs", refs: [] },
  };
  
  if (testNum && tests[testNum]) {
    await test(replicate, tests[testNum].name, tests[testNum].refs);
  } else {
    console.log('\nUsage: node audit-elena-refs-separate.mjs [0|1|2|3]');
    console.log('  0 = No refs');
    console.log('  1 = Face ref only');
    console.log('  2 = Body ref only'); 
    console.log('  3 = Both refs');
  }
}

main().catch(console.error);
