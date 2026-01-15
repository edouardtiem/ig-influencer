#!/usr/bin/env node
/**
 * Test Replicate Face Swap v2
 * Using a local base image + Replicate face swap
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
  console.error('❌ REPLICATE_API_TOKEN not found');
  process.exit(1);
}

const replicate = new Replicate({ auth: REPLICATE_API_TOKEN });

// Elena face reference
const ELENA_FACE = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png';

// Use an existing base with visible face (from mila-aitana-method or nsfw-faceswap)
const BASE_IMAGES = [
  'https://res.cloudinary.com/dily60mr0/image/upload/v1767007066/elena-fanvue-daily/morning_bed_stretch-1767007065.jpg', // Elena bedroom ref
];

// Output directory
const OUTPUT_DIR = path.join(__dirname, '../generated/elena-swap-v2');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function testFaceSwap(targetUrl, swapUrl, modelName) {
  console.log(`\n🔄 Testing ${modelName}...`);
  console.log('   Target:', targetUrl.slice(-60));
  console.log('   Swap face:', swapUrl.slice(-60));
  
  try {
    const models = {
      'easel/advanced-face-swap': {
        mode: 'faceswap',
        target_image: targetUrl,
        swap_image: swapUrl,
      },
      'xiankgx/faceswapper': {
        target_image: targetUrl,
        source_image: swapUrl,
        swap_mode: 'face_swapper',
      },
      'xkyun/swap': {
        target_image: targetUrl,
        source_image: swapUrl,
      },
    };
    
    const input = models[modelName] || models['easel/advanced-face-swap'];
    
    const output = await replicate.run(modelName, { input });
    
    const resultUrl = Array.isArray(output) ? output[0] : output;
    console.log('   ✅ Success!');
    console.log('   Result:', resultUrl);
    return resultUrl;
    
  } catch (error) {
    console.log('   ❌ Error:', error.message.slice(0, 100));
    return null;
  }
}

async function listFaceSwapModels() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  📋 Searching for working face swap models on Replicate...');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const modelsToTry = [
    'easel/advanced-face-swap',
    'xiankgx/faceswapper', 
    'xkyun/swap',
    'xinntao/face-swap',
  ];
  
  for (const model of modelsToTry) {
    console.log(`Checking ${model}...`);
    try {
      // Just check if model exists
      const [owner, name] = model.split('/');
      const modelInfo = await replicate.models.get(owner, name);
      console.log(`✅ ${model} exists - ${modelInfo.description?.slice(0, 50) || 'No description'}`);
    } catch (e) {
      console.log(`❌ ${model} - not found`);
    }
  }
}

async function main() {
  console.log('🎨 Replicate Face Swap Test v2\n');
  
  // First list available models
  await listFaceSwapModels();
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  🧪 Testing face swap with existing Elena image');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Use a working base image
  const baseUrl = BASE_IMAGES[0];
  
  // Test each model
  const results = [];
  
  for (const model of ['easel/advanced-face-swap']) {
    const result = await testFaceSwap(baseUrl, ELENA_FACE, model);
    if (result) {
      results.push({ model, url: result });
    }
  }
  
  if (results.length > 0) {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  📊 SUCCESSFUL RESULTS');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    for (const r of results) {
      console.log(`${r.model}:`);
      console.log(`  ${r.url}\n`);
    }
  } else {
    console.log('\n❌ No face swap models worked. Consider using PiAPI instead.');
    console.log('📝 Get API key at: https://piapi.ai');
  }
}

main();

