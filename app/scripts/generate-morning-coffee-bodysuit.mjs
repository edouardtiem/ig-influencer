#!/usr/bin/env node
/**
 * Generation script - Morning Coffee Bodysuit
 * Reproducing reference aesthetic with Mila
 * Run with: cd app && node scripts/generate-morning-coffee-bodysuit.mjs
 */

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

// Mila face references
const FACE_REFERENCES = [
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_2_q8kxit.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767098/Photo_3_nopedx.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_4_pna4fo.png',
];

async function urlToBase64(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const contentType = response.headers.get('content-type') || 'image/png';
  return `data:${contentType};base64,${base64}`;
}

// Prompt inspired by reference - morning coffee bodysuit scene (conservative version)
const PROMPT = `Instagram lifestyle photo, natural morning light, candid authentic moment,

Young French woman, 22 years old, standing by window in bedroom holding coffee cup,

[FACE - USE REFERENCE IMAGES] 
oval face, high cheekbones, copper auburn curly hair type 3A shoulder-length loose curls, hazel-green eyes with golden flecks, straight nose slightly upturned tip, naturally full lips, light tan Mediterranean skin, light golden freckles on nose and cheekbones, small dark beauty mark above left lip corner, beauty mark on right cheekbone.
CRITICAL: Use the EXACT face from the reference photos provided.

[BODY] slim athletic feminine physique, toned, healthy natural figure,

[OUTFIT] wearing light gray cotton tank top bodysuit, simple minimalist loungewear, comfortable morning outfit,

[POSE] standing by window, three-quarter view, holding white ceramic coffee mug, one hand on hip, relaxed confident posture, soft smile, looking toward camera, peaceful morning moment,

[SETTING] 
Parisian apartment bedroom:
- Large window with soft sheer curtains
- Warm golden morning light streaming in
- Stone wall texture (rustic Parisian)
- White bed with linen sheets in soft focus background
- Cozy intimate atmosphere

[LIGHTING]
Soft warm morning golden hour light from window, gentle side lighting on face, warm color temperature, natural soft shadows,

[ACCESSORIES] thin gold necklace with small star pendant on neck, hair loose with natural curls,

[MOOD] peaceful, confident, calm morning energy, French girl aesthetic, natural candid moment,

--no tattoos, --no glasses, --no heavy makeup`;

async function main() {
  console.log('🚀 Starting Morning Coffee Bodysuit generation...\n');
  
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    console.error('❌ REPLICATE_API_TOKEN not found in .env.local');
    process.exit(1);
  }
  
  const replicate = new Replicate({ auth: apiToken });
  
  console.log('📷 Converting reference images to base64...');
  const selectedFaces = FACE_REFERENCES.slice(0, 4);
  
  try {
    const base64Images = await Promise.all(
      selectedFaces.map(async (url, i) => {
        const b64 = await urlToBase64(url);
        console.log(`  ✅ Face ref ${i + 1}: converted`);
        return b64;
      })
    );
    
    console.log(`\n📝 Prompt preview:\n${PROMPT.substring(0, 600)}...\n`);
    console.log('🎨 Calling Nano Banana Pro...');
    console.log(`   References: ${base64Images.length} face images`);
    
    const startTime = Date.now();
    
    const output = await replicate.run("google/nano-banana-pro", {
      input: {
        prompt: PROMPT,
        image_input: base64Images,
        aspect_ratio: "4:5",
        resolution: "2K",
        output_format: "jpg",
        safety_filter_level: "block_only_high",
      }
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n⏱️  Generation completed in ${duration}s`);
    
    if (typeof output === 'string') {
      console.log('\n✅ SUCCESS! Image URL:');
      console.log(output);
      return output;
    }
    
    if (Array.isArray(output) && typeof output[0] === 'string') {
      console.log('\n✅ SUCCESS! Image URL:');
      console.log(output[0]);
      return output[0];
    }
    
    if (output && typeof output === 'object' && Symbol.asyncIterator in output) {
      const chunks = [];
      for await (const chunk of output) {
        if (chunk instanceof Uint8Array) {
          chunks.push(chunk);
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
        
        const outputDir = path.join(__dirname, '..', 'generated', 'morning-coffee-bodysuit');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const filename = `morning-coffee-${Date.now()}.jpg`;
        const filepath = path.join(outputDir, filename);
        fs.writeFileSync(filepath, combined);
        
        console.log('\n✅ SUCCESS! Image saved to:');
        console.log(filepath);
        console.log('\n⚠️  Note: Image generated locally, NOT posted to Instagram.');
        return filepath;
      }
    }
    
    console.log('\n⚠️ Unexpected output format:', typeof output);
    console.log(output);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('safety')) {
      console.log('\n💡 Tip: The safety filter may have blocked this. Try adjusting the prompt.');
    }
    process.exit(1);
  }
}

main();

