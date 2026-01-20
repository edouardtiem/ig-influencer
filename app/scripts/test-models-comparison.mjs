#!/usr/bin/env node
/**
 * Test: Compare image generation models for Elena
 * Models: Ideogram v3, FLUX Kontext Pro, Runway Gen-4, Ideogram Character
 */

import Replicate from 'replicate';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Elena references
const ELENA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png';
const ELENA_BODY_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png';

// Standard test prompt
const TEST_PROMPT = `Professional Instagram photo of a beautiful woman with copper auburn curly hair (type 3A), 
light freckles on her nose and cheeks, warm amber-green eyes. 
She is wearing a casual white linen shirt, sitting at a Parisian café terrace.
Golden hour lighting, warm tones, photorealistic quality like iPhone 15 Pro.
Natural skin texture, thin gold star necklace visible.
Single image, no collage.`;

async function urlToBase64(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const contentType = response.headers.get('content-type') || 'image/png';
  return `data:${contentType};base64,${base64}`;
}

function parseOutput(output) {
  if (typeof output === 'string') return output;
  if (Array.isArray(output) && output[0]) {
    return typeof output[0] === 'string' ? output[0] : parseOutput(output[0]);
  }
  if (output?.url && typeof output.url === 'function') {
    return output.url().toString();
  }
  if (output?.url) return output.url;
  return null;
}

// ═══════════════════════════════════════════════════════════════
// MODEL 1: Ideogram v3-turbo with style_reference_images
// ═══════════════════════════════════════════════════════════════
async function testIdeogramV3(replicate) {
  console.log('\n' + '═'.repeat(60));
  console.log('MODEL 1: Ideogram v3-turbo (style_reference_images)');
  console.log('═'.repeat(60));
  console.log('📸 References: Face + Body URLs');
  console.log('⏳ Starting generation...\n');

  const startTime = Date.now();
  
  try {
    const output = await replicate.run("ideogram-ai/ideogram-v3-turbo", {
      input: {
        prompt: TEST_PROMPT,
        aspect_ratio: "4:5",
        magic_prompt_option: "Auto",
        style_reference_images: [ELENA_FACE_REF, ELENA_BODY_REF]
      }
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Generated in ${duration}s`);
    
    let imageUrl = parseOutput(output);
    console.log(`\n🖼️  Result: ${imageUrl}\n`);
    return { success: true, url: imageUrl, duration };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`❌ Failed after ${duration}s: ${error.message}`);
    return { success: false, error: error.message, duration };
  }
}

// ═══════════════════════════════════════════════════════════════
// MODEL 2: FLUX Kontext Pro with input_image
// ═══════════════════════════════════════════════════════════════
async function testFluxKontext(replicate) {
  console.log('\n' + '═'.repeat(60));
  console.log('MODEL 2: FLUX Kontext Pro (input_image + input_image_2)');
  console.log('═'.repeat(60));
  console.log('📸 References: Face + Body (base64)');
  console.log('⏳ Loading references...');

  const faceBase64 = await urlToBase64(ELENA_FACE_REF);
  const bodyBase64 = await urlToBase64(ELENA_BODY_REF);
  
  console.log('⏳ Starting generation...\n');
  const startTime = Date.now();
  
  try {
    const output = await replicate.run("black-forest-labs/flux-kontext-pro", {
      input: {
        prompt: `Use the woman from the reference images. ${TEST_PROMPT}`,
        input_image: faceBase64,
        input_image_2: bodyBase64,
        aspect_ratio: "4:5",
        safety_tolerance: 5
      }
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Generated in ${duration}s`);
    
    let imageUrl = parseOutput(output);
    console.log(`\n🖼️  Result: ${imageUrl}\n`);
    return { success: true, url: imageUrl, duration };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`❌ Failed after ${duration}s: ${error.message}`);
    return { success: false, error: error.message, duration };
  }
}

// ═══════════════════════════════════════════════════════════════
// MODEL 3: Runway Gen-4 Image with reference_images + tags
// ═══════════════════════════════════════════════════════════════
async function testRunwayGen4(replicate) {
  console.log('\n' + '═'.repeat(60));
  console.log('MODEL 3: Runway Gen-4 Image (reference_images + tags)');
  console.log('═'.repeat(60));
  console.log('📸 References: Face + Body URLs with @elena tag');
  console.log('⏳ Starting generation...\n');

  const startTime = Date.now();
  
  // Prompt using @elena tag to reference the images
  const taggedPrompt = `Professional Instagram photo of @elena, a beautiful woman with copper auburn curly hair (type 3A), 
light freckles on her nose and cheeks, warm amber-green eyes. 
She is wearing a casual white linen shirt, sitting at a Parisian café terrace.
Golden hour lighting, warm tones, photorealistic quality.
Natural skin texture, thin gold star necklace visible.`;
  
  try {
    const output = await replicate.run("runwayml/gen4-image", {
      input: {
        prompt: taggedPrompt,
        reference_images: [ELENA_FACE_REF, ELENA_BODY_REF],
        reference_tags: ["elena", "elenabody"],
        aspect_ratio: "3:4",
        resolution: "1080p"
      }
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Generated in ${duration}s`);
    
    let imageUrl = parseOutput(output);
    console.log(`\n🖼️  Result: ${imageUrl}\n`);
    return { success: true, url: imageUrl, duration };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`❌ Failed after ${duration}s: ${error.message}`);
    return { success: false, error: error.message, duration };
  }
}

// ═══════════════════════════════════════════════════════════════
// MODEL 4: Ideogram Character (dedicated character consistency)
// ═══════════════════════════════════════════════════════════════
async function testIdeogramCharacter(replicate) {
  console.log('\n' + '═'.repeat(60));
  console.log('MODEL 4: Ideogram Character (QUALITY OPTIMIZED)');
  console.log('═'.repeat(60));
  console.log('📸 Reference: Face URL (single character ref)');
  console.log('⏳ Starting generation...\n');

  const startTime = Date.now();
  
  // Optimized prompt for quality
  const qualityPrompt = `Ultra high quality professional Instagram photograph, 8K resolution, shot on Canon EOS R5 with 85mm f/1.4 lens.

A beautiful woman with copper auburn curly hair (type 3A), light freckles on her nose and cheeks, warm amber-green eyes, thin gold star necklace.

She is wearing a casual white linen shirt, sitting at a Parisian café terrace during golden hour.

Photorealistic, natural skin texture with visible pores, cinematic lighting, shallow depth of field, Instagram aesthetic 2026.
Sharp focus on face, natural makeup, authentic candid moment.`;
  
  try {
    const output = await replicate.run("ideogram-ai/ideogram-character", {
      input: {
        prompt: qualityPrompt,
        character_reference_image: ELENA_FACE_REF,
        aspect_ratio: "4:5",
        style_type: "Realistic",
        negative_prompt: "blurry, low quality, distorted, deformed, ugly, cartoon, anime, painting, illustration, oversaturated, artificial looking"
      }
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Generated in ${duration}s`);
    
    let imageUrl = parseOutput(output);
    console.log(`\n🖼️  Result: ${imageUrl}\n`);
    return { success: true, url: imageUrl, duration };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`❌ Failed after ${duration}s: ${error.message}`);
    return { success: false, error: error.message, duration };
  }
}

// ═══════════════════════════════════════════════════════════════
// MODEL 5: InstantID (identity preservation specialist)
// ═══════════════════════════════════════════════════════════════
async function testInstantID(replicate) {
  console.log('\n' + '═'.repeat(60));
  console.log('MODEL 5: InstantID (zsxkib/instant-id)');
  console.log('═'.repeat(60));
  console.log('📸 Reference: Face URL');
  console.log('⏳ Starting generation...\n');

  const startTime = Date.now();
  
  try {
    const output = await replicate.run(
      "grandlineai/instant-id-photorealistic",
      {
        input: {
          image: ELENA_FACE_REF,
          prompt: "Professional Instagram photo, beautiful woman sitting at a Parisian café terrace, wearing casual white linen shirt, golden hour lighting, warm tones, photorealistic, natural skin texture, thin gold star necklace",
          negative_prompt: "ugly, deformed, noisy, blurry, distorted, grainy, collage, multiple images",
          ip_adapter_scale: 0.8,
          controlnet_conditioning_scale: 0.8,
          num_inference_steps: 30,
          guidance_scale: 5,
          width: 1024,
          height: 1280
        }
      }
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Generated in ${duration}s`);
    
    let imageUrl = parseOutput(output);
    console.log(`\n🖼️  Result: ${imageUrl}\n`);
    return { success: true, url: imageUrl, duration };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`❌ Failed after ${duration}s: ${error.message}`);
    return { success: false, error: error.message, duration };
  }
}

// ═══════════════════════════════════════════════════════════════
// MODEL 6: PuLID FLUX (face identity)
// ═══════════════════════════════════════════════════════════════
async function testPuLID(replicate) {
  console.log('\n' + '═'.repeat(60));
  console.log('MODEL 6: PuLID FLUX (bytedance/flux-pulid)');
  console.log('═'.repeat(60));
  console.log('📸 Reference: Face URL');
  console.log('⏳ Starting generation...\n');

  const startTime = Date.now();
  
  try {
    const output = await replicate.run("bytedance/flux-pulid", {
      input: {
        main_face_image: ELENA_FACE_REF,
        prompt: "Professional Instagram photo, beautiful woman with copper auburn curly hair sitting at a Parisian café terrace, wearing casual white linen shirt, golden hour lighting, warm tones, photorealistic quality, natural skin texture, freckles, thin gold star necklace",
        negative_prompt: "ugly, deformed, noisy, blurry, distorted",
        num_steps: 20,
        guidance_scale: 5,
        id_weight: 1.0
      }
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Generated in ${duration}s`);
    
    let imageUrl = parseOutput(output);
    console.log(`\n🖼️  Result: ${imageUrl}\n`);
    return { success: true, url: imageUrl, duration };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`❌ Failed after ${duration}s: ${error.message}`);
    return { success: false, error: error.message, duration };
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
async function main() {
  const modelNum = parseInt(process.argv[2]) || 1;
  
  console.log('\n🧪 MODEL COMPARISON TEST (with correct reference params)');
  console.log('═'.repeat(60));
  console.log(`📝 Prompt: "${TEST_PROMPT.slice(0, 80)}..."`);
  console.log(`📸 Face ref: ${ELENA_FACE_REF.slice(-50)}`);
  console.log(`📸 Body ref: ${ELENA_BODY_REF.slice(-50)}`);
  
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('\n❌ REPLICATE_API_TOKEN not set');
    process.exit(1);
  }
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  let result;
  switch (modelNum) {
    case 1:
      result = await testIdeogramV3(replicate);
      break;
    case 2:
      result = await testFluxKontext(replicate);
      break;
    case 3:
      result = await testRunwayGen4(replicate);
      break;
    case 4:
      result = await testIdeogramCharacter(replicate);
      break;
    case 5:
      result = await testInstantID(replicate);
      break;
    case 6:
      result = await testPuLID(replicate);
      break;
    default:
      console.log(`\n❌ Unknown model number: ${modelNum}`);
      console.log('Usage: node test-models-comparison.mjs [1-6]');
      console.log('  1 = Ideogram v3-turbo (style only)');
      console.log('  2 = FLUX Kontext Pro (input_image)');
      console.log('  3 = Runway Gen-4 Image (reference_images)');
      console.log('  4 = Ideogram Character (character_reference)');
      console.log('  5 = InstantID (identity preservation)');
      console.log('  6 = PuLID (face identity)');
      process.exit(1);
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('TEST COMPLETE');
  console.log('═'.repeat(60));
  
  if (result.success) {
    console.log(`\n✅ Open this URL to see the result:`);
    console.log(`   ${result.url}\n`);
  }
}

main().catch(console.error);
