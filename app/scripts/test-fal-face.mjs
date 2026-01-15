#!/usr/bin/env node
/**
 * Test fal.ai models for face reference / character consistency
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fal } from '@fal-ai/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

if (!process.env.FAL_KEY) {
  console.error('❌ FAL_KEY not found in .env.local');
  console.log('Get your key at: https://fal.ai/dashboard/keys');
  process.exit(1);
}

fal.config({ credentials: process.env.FAL_KEY });

const ELENA_FACE = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png';

const PROMPT = `photo of this woman wearing elegant black lace lingerie,
sitting on velvet purple sofa in luxurious Parisian apartment,
soft morning light, intimate boudoir atmosphere,
professional photography, 8K, Canon 85mm f/1.4`;

// ═══════════════════════════════════════════════════════════════
// TEST VARIOUS FAL.AI MODELS
// ═══════════════════════════════════════════════════════════════

async function testInstantCharacter() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  🧪 TEST: fal-ai/instant-character');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  try {
    const result = await fal.subscribe('fal-ai/instant-character', {
      input: {
        prompt: PROMPT,
        face_image_url: ELENA_FACE,
        num_images: 1,
      },
    });
    console.log('✅ SUCCESS!');
    console.log('🖼️  URL:', result.data?.images?.[0]?.url || result.data);
    return result;
  } catch (e) {
    console.log('❌ Error:', e.message);
    return null;
  }
}

async function testFluxIPAdapter() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  🧪 TEST: fal-ai/flux-lora-ip-adapter');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  try {
    const result = await fal.subscribe('fal-ai/flux-lora-ip-adapter', {
      input: {
        prompt: PROMPT,
        ip_adapter_image_url: ELENA_FACE,
        ip_adapter_scale: 0.9,
        num_images: 1,
      },
    });
    console.log('✅ SUCCESS!');
    console.log('🖼️  URL:', result.data?.images?.[0]?.url || result.data);
    return result;
  } catch (e) {
    console.log('❌ Error:', e.message);
    return null;
  }
}

async function testFaceAdapter() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  🧪 TEST: fal-ai/face-adapter');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  try {
    const result = await fal.subscribe('fal-ai/face-adapter', {
      input: {
        prompt: PROMPT,
        face_image_url: ELENA_FACE,
        face_id_strength: 0.9,
        num_images: 1,
      },
    });
    console.log('✅ SUCCESS!');
    console.log('🖼️  URL:', result.data?.images?.[0]?.url || result.data);
    return result;
  } catch (e) {
    console.log('❌ Error:', e.message);
    return null;
  }
}

async function testPulidFlux() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  🧪 TEST: fal-ai/pulid-flux');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  try {
    const result = await fal.subscribe('fal-ai/pulid-flux', {
      input: {
        prompt: PROMPT,
        reference_image_url: ELENA_FACE,
        id_strength: 0.8,
        num_images: 1,
      },
    });
    console.log('✅ SUCCESS!');
    console.log('🖼️  URL:', result.data?.images?.[0]?.url || result.data);
    return result;
  } catch (e) {
    console.log('❌ Error:', e.message);
    return null;
  }
}

async function testFluxGeneral() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  🧪 TEST: fal-ai/flux-general (with image prompt)');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  try {
    const result = await fal.subscribe('fal-ai/flux-general', {
      input: {
        prompt: PROMPT,
        image_url: ELENA_FACE,
        image_prompt_strength: 0.5,
        num_images: 1,
      },
    });
    console.log('✅ SUCCESS!');
    console.log('🖼️  URL:', result.data?.images?.[0]?.url || result.data);
    return result;
  } catch (e) {
    console.log('❌ Error:', e.message);
    return null;
  }
}

async function testFluxDev() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  🧪 TEST: fal-ai/flux/dev (baseline without face ref)');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  try {
    const result = await fal.subscribe('fal-ai/flux/dev', {
      input: {
        prompt: PROMPT,
        image_size: { width: 1024, height: 1280 },
        num_images: 1,
        enable_safety_checker: false,
      },
    });
    console.log('✅ SUCCESS!');
    console.log('🖼️  URL:', result.data?.images?.[0]?.url || result.data);
    return result;
  } catch (e) {
    console.log('❌ Error:', e.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('🎨 Testing fal.ai Face Reference Models\n');
  console.log('📸 Reference:', ELENA_FACE.slice(-50));
  
  const results = {};
  
  // Test models that might support face reference
  results.instantChar = await testInstantCharacter();
  results.fluxIP = await testFluxIPAdapter();
  results.faceAdapter = await testFaceAdapter();
  results.pulid = await testPulidFlux();
  results.fluxGeneral = await testFluxGeneral();
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  📊 RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('instant-character:', results.instantChar ? '✅' : '❌');
  console.log('flux-lora-ip-adapter:', results.fluxIP ? '✅' : '❌');
  console.log('face-adapter:', results.faceAdapter ? '✅' : '❌');
  console.log('pulid-flux:', results.pulid ? '✅' : '❌');
  console.log('flux-general:', results.fluxGeneral ? '✅' : '❌');
  
  console.log('\n💡 Open the successful URLs and compare face consistency!');
}

main().catch(console.error);

