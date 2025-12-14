#!/usr/bin/env node
/**
 * Regenerate photos 1, 3, 5 using photo 2 as reference
 * Fixes artifacts/floating objects from initial generation
 */

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Face references
const FACE_REFERENCES = [
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_2_q8kxit.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767098/Photo_3_nopedx.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_4_pna4fo.png',
];

// Apartment reference
const APARTMENT_REFERENCE = 'https://res.cloudinary.com/dily60mr0/image/upload/v1764794600/2._Salon_Paris_ltyd8r.png';

// Photo 2 (the good one) as scene reference
const PHOTO_2_REFERENCE = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765620947/mila-posts/mirror-selfie-carousel/mirror-selfie-02-classic-1765620946710.jpg';

async function urlToBase64(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const contentType = response.headers.get('content-type') || 'image/png';
  return `data:${contentType};base64,${base64}`;
}

const MILA_BASE = `Young French woman Mila, 22 years old, copper auburn curly hair type 3A shoulder-length loose curls, hazel-green eyes with golden flecks, oval elongated face with high cheekbones, light tan Mediterranean skin with healthy glow, small beauty mark above left lip corner, light golden freckles on nose and cheekbones, thin gold necklace with star pendant visible, slim athletic physique 168cm, natural curves, toned body`;

const NEGATIVE = `cartoon, anime, illustration, 3D render, CGI, deformed face, deformed body, blurry, bad anatomy, extra limbs, watermark, text, logo, oversaturated, plastic skin, wrong hair color, straight hair, tattoos, glasses, heavy makeup, floating objects, floating camera, floating book, artifacts, random objects in background`;

// Only regenerate photos 1, 3, 5
const PHOTOS_TO_REGEN = [
  {
    index: 1,
    name: 'mirror-selfie-01-playful-v2',
    prompt: `2025 instagram style, photorealistic Instagram photo, natural lighting, authentic candid feel, amateur photo feel,

${MILA_BASE},

[CLOTHING] oversized grey khaki V-neck knit sweater slightly cropped showing midriff, black pleated tennis mini skirt, barefoot,

[POSE] standing full body mirror selfie, left hand resting on white door frame, right hand holding iPhone taking selfie, eyes closed softly, soft kissy playful expression, weight on one leg, relaxed hip angle,

[SETTING] cozy bright apartment interior exactly like reference, large round black frame floor mirror, white door with gold handle behind, light wooden parquet floor, soft white walls, intercom panel on wall, natural daylight from window, clean background no clutter,

[LIGHTING] soft morning daylight, diffused natural light from window, warm indoor ambient,

[MOOD] confident, playful, flirty, effortless French girl vibe,

[QUALITY] high resolution, sharp focus on face, natural skin texture, Instagram-ready, no text on image, clean simple background,

${NEGATIVE}`
  },
  {
    index: 3,
    name: 'mirror-selfie-03-confident-v2',
    prompt: `2025 instagram style, photorealistic Instagram photo, natural lighting, authentic candid feel, amateur photo feel,

${MILA_BASE},

[CLOTHING] oversized grey khaki V-neck knit sweater over white tee visible at neckline, black pleated tennis mini skirt, barefoot,

[POSE] standing full body mirror selfie, left hand raised touching hair behind head, right hand holding iPhone for selfie, confident intense gaze at phone, lips slightly parted, weight shifted to one hip,

[SETTING] cozy bright apartment interior exactly like reference, large round black frame mirror visible on left edge, white door with gold handle behind, light wooden parquet floor, soft white walls, intercom panel visible, clean background no clutter,

[LIGHTING] soft afternoon daylight, diffused natural light, warm indoor ambient lighting,

[MOOD] confident, sultry, naturally sensual, effortless French girl vibe,

[QUALITY] high resolution, sharp focus on face, natural skin texture, Instagram-ready, no text on image, clean simple background,

${NEGATIVE}`
  },
  {
    index: 5,
    name: 'mirror-selfie-05-elegant-v2',
    prompt: `2025 instagram style, photorealistic Instagram photo, natural lighting, authentic candid feel, amateur photo feel,

${MILA_BASE},

[CLOTHING] oversized grey khaki V-neck knit sweater, black pleated tennis mini skirt, barefoot,

[POSE] standing full body mirror selfie, left arm extended touching large round mirror frame, right hand holding iPhone for selfie, confident soft smile, slight head tilt, elongated elegant pose,

[SETTING] cozy bright apartment interior exactly like reference, leaning on large round black frame floor mirror, white door with gold handle visible, light wooden parquet floor, soft white walls, clean background no clutter,

[LIGHTING] soft afternoon daylight, diffused natural light, warm indoor ambient lighting matching photo 2,

[MOOD] confident, elegant, naturally sensual, effortless French girl vibe,

[QUALITY] high resolution, sharp focus on face, natural skin texture, Instagram-ready, no text on image, clean simple background,

${NEGATIVE}`
  }
];

async function generateImage(replicate, prompt, references, name) {
  console.log(`\n📸 Generating: ${name}`);
  const startTime = Date.now();
  
  const output = await replicate.run("google/nano-banana-pro", {
    input: {
      prompt: prompt,
      image_input: references,
      aspect_ratio: "4:5",
      resolution: "2K",
      output_format: "jpg",
      safety_filter_level: "block_only_high",
    }
  });
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`   ⏱️  Generated in ${duration}s`);
  
  if (typeof output === 'string') {
    return { type: 'url', data: output };
  } else if (Array.isArray(output) && typeof output[0] === 'string') {
    return { type: 'url', data: output[0] };
  } else if (output && typeof output === 'object' && Symbol.asyncIterator in output) {
    const chunks = [];
    for await (const chunk of output) {
      if (chunk instanceof Uint8Array) chunks.push(chunk);
    }
    if (chunks.length > 0) {
      const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      const outputDir = path.join(__dirname, '..', 'generated', 'mirror-selfie-carousel');
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
      const filename = `${name}-${Date.now()}.jpg`;
      const imagePath = path.join(outputDir, filename);
      fs.writeFileSync(imagePath, combined);
      console.log(`   💾 Saved locally: ${filename}`);
      return { type: 'file', data: imagePath };
    }
  }
  throw new Error('Could not process output');
}

async function main() {
  console.log('🔧 Regenerating photos 1, 3, 5 using photo 2 as reference...\n');
  
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    console.error('❌ REPLICATE_API_TOKEN not found');
    process.exit(1);
  }
  
  const replicate = new Replicate({ auth: apiToken });
  
  // Convert all references to base64
  console.log('📷 Converting references to base64...');
  const base64FaceRefs = await Promise.all(
    FACE_REFERENCES.map(async (url, i) => {
      const b64 = await urlToBase64(url);
      console.log(`   ✅ Face ref ${i + 1}`);
      return b64;
    })
  );
  
  const apartmentRef = await urlToBase64(APARTMENT_REFERENCE);
  console.log('   ✅ Apartment ref');
  
  const photo2Ref = await urlToBase64(PHOTO_2_REFERENCE);
  console.log('   ✅ Photo 2 (scene reference)');
  
  // Combine all references: face + apartment + photo 2
  const allReferences = [...base64FaceRefs, apartmentRef, photo2Ref];
  console.log(`\n📦 Total references: ${allReferences.length} (4 face + 1 apartment + 1 photo 2)`);
  
  const results = [];
  
  for (const photo of PHOTOS_TO_REGEN) {
    try {
      const imageResult = await generateImage(replicate, photo.prompt, allReferences, photo.name);
      
      console.log(`   📤 Uploading to Cloudinary...`);
      const uploadResult = await cloudinary.uploader.upload(
        imageResult.type === 'file' ? imageResult.data : imageResult.data,
        {
          folder: 'mila-posts/mirror-selfie-carousel',
          public_id: `${photo.name}-${Date.now()}`,
          resource_type: 'image',
        }
      );
      
      results.push({
        index: photo.index,
        name: photo.name,
        url: uploadResult.secure_url,
      });
      console.log(`   ✅ ${uploadResult.secure_url}`);
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ REGENERATION COMPLETE');
  console.log('='.repeat(60));
  console.log('\n📸 New URLs:');
  results.forEach(r => console.log(`   Photo ${r.index}: ${r.url}`));
  
  console.log('\n📸 Photo 2 (kept): https://res.cloudinary.com/dily60mr0/image/upload/v1765620947/mila-posts/mirror-selfie-carousel/mirror-selfie-02-classic-1765620946710.jpg');
  console.log('📸 Photo 4 (kept): https://res.cloudinary.com/dily60mr0/image/upload/v1765621083/mila-posts/mirror-selfie-carousel/mirror-selfie-04-sitting-1765621082227.jpg');
  
  console.log('\n🎉 Done! Check the new photos.');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

