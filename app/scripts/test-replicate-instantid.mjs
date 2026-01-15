#!/usr/bin/env node
/**
 * Test Replicate InstantID for Elena face consistency
 * InstantID is THE technology for face preservation
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

if (!process.env.REPLICATE_API_TOKEN) {
  console.error('❌ REPLICATE_API_TOKEN not found');
  process.exit(1);
}

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

// Elena references
const ELENA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png';

// ═══════════════════════════════════════════════════════════════
// TEST 1: InstantID (Best for face preservation)
// ═══════════════════════════════════════════════════════════════

async function testInstantID() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🧪 TEST 1: InstantID (Face Preservation Specialist)');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const prompt = `photo of a woman wearing elegant black lace lingerie,
sitting on velvet purple sofa in luxurious Parisian apartment,
soft morning light, intimate boudoir atmosphere,
professional photography, 8K, Canon 85mm f/1.4`;

  console.log('📸 Face ref:', ELENA_FACE_REF.slice(-50));
  console.log('📝 Prompt:', prompt.slice(0, 100) + '...\n');
  
  const startTime = Date.now();
  
  try {
    const output = await replicate.run(
      "zsxkib/instant-id:bc6e3c5f83e11c9f9a9fd5de12ca60ae57f841e4b0f8a7ffa54ed73876f83597",
      {
        input: {
          image: ELENA_FACE_REF,
          prompt: prompt,
          negative_prompt: "ugly, deformed, noisy, blurry, low contrast, cartoon, anime, sketch, painting",
          ip_adapter_scale: 0.8, // How much to follow face reference
          controlnet_conditioning_scale: 0.8,
          num_inference_steps: 30,
          guidance_scale: 5,
          width: 1024,
          height: 1280,
        }
      }
    );
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ InstantID generated in ${duration}s`);
    console.log('🖼️  URL:', output);
    return output;
    
  } catch (error) {
    console.log('❌ InstantID error:', error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// TEST 2: Flux IP-Adapter (XLabs)
// ═══════════════════════════════════════════════════════════════

async function testFluxIPAdapter() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  🧪 TEST 2: Flux IP-Adapter (XLabs)');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const prompt = `photo of this woman wearing elegant black lace lingerie,
sitting on velvet purple sofa in luxurious Parisian apartment,
soft morning light, intimate boudoir photography, 8K`;

  const startTime = Date.now();
  
  try {
    const output = await replicate.run(
      "xlabs-ai/flux-dev-ip-adapter:edb578b9dfc93d2f6508ab1a0d4a9c4a2c70ff98bf7d3f6ee35a0e13f7a8a0e8",
      {
        input: {
          prompt: prompt,
          image: ELENA_FACE_REF,
          ip_adapter_scale: 0.9, // High scale for strong face similarity
          num_outputs: 1,
          aspect_ratio: "4:5",
          output_format: "jpg",
          guidance_scale: 4,
          num_inference_steps: 28,
        }
      }
    );
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Flux IP-Adapter generated in ${duration}s`);
    
    const url = Array.isArray(output) ? output[0] : output;
    console.log('🖼️  URL:', url);
    return url;
    
  } catch (error) {
    console.log('❌ Flux IP-Adapter error:', error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// TEST 3: PhotoMaker (another face-focused model)
// ═══════════════════════════════════════════════════════════════

async function testPhotoMaker() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  🧪 TEST 3: PhotoMaker (Face-focused generation)');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const prompt = `a woman img wearing elegant black lace lingerie,
sitting on velvet purple sofa in Parisian apartment,
soft morning light, boudoir photography, 8K`;

  const startTime = Date.now();
  
  try {
    const output = await replicate.run(
      "tencentarc/photomaker:ddfc2b08d209f9fa8c1uj0f1f6f5d0d0f0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0",
      {
        input: {
          prompt: prompt,
          input_image: ELENA_FACE_REF,
          style_strength_ratio: 30,
          num_steps: 50,
        }
      }
    );
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ PhotoMaker generated in ${duration}s`);
    console.log('🖼️  URL:', output);
    return output;
    
  } catch (error) {
    console.log('❌ PhotoMaker error:', error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// TEST 4: PuLID Flux (Face + Body consistency)
// ═══════════════════════════════════════════════════════════════

async function testPuLID() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  🧪 TEST 4: PuLID Flux (Face + Body)');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const prompt = `photo of woman wearing elegant black lace lingerie,
sitting on velvet purple sofa in Parisian apartment,
soft morning light, boudoir photography, professional, 8K`;

  const startTime = Date.now();
  
  try {
    const output = await replicate.run(
      "zsxkib/pulid:43d309c37ab4e62361e5e46b8c3d20c7e9e7c6a4b2d1e0f9a8b7c6d5e4f3a2b1",
      {
        input: {
          prompt: prompt,
          main_face_image: ELENA_FACE_REF,
          num_steps: 20,
          id_scale: 0.8,
          guidance_scale: 4,
          width: 1024,
          height: 1280,
        }
      }
    );
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ PuLID generated in ${duration}s`);
    console.log('🖼️  URL:', output);
    return output;
    
  } catch (error) {
    console.log('❌ PuLID error:', error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('🎨 Testing Replicate Face-Lock Models for Elena\n');
  console.log('These models are DESIGNED for face preservation!\n');
  
  const results = {};
  
  results.instantid = await testInstantID();
  results.fluxIP = await testFluxIPAdapter();
  // results.photomaker = await testPhotoMaker(); // May not work
  // results.pulid = await testPuLID(); // May not work
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  📊 RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  if (results.instantid) console.log('InstantID:\n  ', results.instantid);
  if (results.fluxIP) console.log('Flux IP-Adapter:\n  ', results.fluxIP);
  
  console.log('\n💡 These should have MUCH better face consistency than Together AI!');
  console.log('📸 Compare with Elena reference and see which one matches best.');
}

main().catch(console.error);

