#!/usr/bin/env node
/**
 * Regenerate ONLY photo 3 - exact same scene as photo 2
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

// Photo 2 (the good one) - use as PRIMARY scene reference
const PHOTO_2_REFERENCE = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765620947/mila-posts/mirror-selfie-carousel/mirror-selfie-02-classic-1765620946710.jpg';

async function urlToBase64(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const contentType = response.headers.get('content-type') || 'image/png';
  return `data:${contentType};base64,${base64}`;
}

const MILA_BASE = `Young French woman Mila, 22 years old, copper auburn curly hair type 3A shoulder-length loose curls, hazel-green eyes with golden flecks, oval elongated face with high cheekbones, light tan Mediterranean skin with healthy glow, small beauty mark above left lip corner, light golden freckles on nose and cheekbones, thin gold necklace with star pendant visible, slim athletic physique 168cm, natural curves, toned body`;

const NEGATIVE = `cartoon, anime, illustration, 3D render, CGI, deformed face, deformed body, blurry, bad anatomy, extra limbs, watermark, text, logo, oversaturated, plastic skin, wrong hair color, straight hair, tattoos, glasses, heavy makeup, floating objects, artifacts, different room, different background, different setting`;

// Photo 3 prompt - EXACT same scene as photo 2, only pose changes
const PHOTO_3_PROMPT = `2025 instagram style, photorealistic Instagram photo, natural lighting, authentic candid feel,

CRITICAL: Use EXACT SAME ROOM and BACKGROUND as reference image. Same mirror, same door, same floor, same walls, same lighting, same angle. Only the pose changes.

${MILA_BASE},

[CLOTHING] oversized grey khaki V-neck knit sweater over white tee visible at neckline, black pleated tennis mini skirt, barefoot - EXACT same outfit as reference,

[POSE] standing full body mirror selfie in SAME POSITION as reference, left hand raised touching hair behind head, right hand holding iPhone for selfie, confident intense gaze at phone, lips slightly parted, weight shifted to one hip,

[SETTING] EXACT SAME ROOM as reference photo: same large round black frame mirror on left, same white door with gold handle behind, same light wooden parquet floor, same soft white walls, same intercom panel, same angle, same distance from mirror,

[LIGHTING] EXACT SAME LIGHTING as reference: soft daylight, same warmth, same shadows,

[MOOD] confident, sultry, naturally sensual, effortless French girl vibe,

[QUALITY] high resolution, sharp focus, match reference photo quality exactly,

${NEGATIVE}`;

async function main() {
  console.log('🔧 Regenerating ONLY photo 3 - matching photo 2 scene exactly...\n');
  
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    console.error('❌ REPLICATE_API_TOKEN not found');
    process.exit(1);
  }
  
  const replicate = new Replicate({ auth: apiToken });
  
  console.log('📷 Converting references to base64...');
  
  // Face refs
  const base64FaceRefs = await Promise.all(
    FACE_REFERENCES.map(async (url, i) => {
      const b64 = await urlToBase64(url);
      console.log(`   ✅ Face ref ${i + 1}`);
      return b64;
    })
  );
  
  // Photo 2 as scene reference (put it FIRST for stronger influence)
  const photo2Ref = await urlToBase64(PHOTO_2_REFERENCE);
  console.log('   ✅ Photo 2 (PRIMARY scene reference)');
  
  // Put photo 2 first, then face refs - this gives scene more weight
  const allReferences = [photo2Ref, photo2Ref, ...base64FaceRefs]; // Double photo2 for extra weight
  console.log(`\n📦 Total references: ${allReferences.length} (2x photo2 + 4 face)`);
  
  console.log('\n📸 Generating photo 3 (hand in hair)...');
  const startTime = Date.now();
  
  const output = await replicate.run("google/nano-banana-pro", {
    input: {
      prompt: PHOTO_3_PROMPT,
      image_input: allReferences,
      aspect_ratio: "4:5",
      resolution: "2K",
      output_format: "jpg",
      safety_filter_level: "block_only_high",
    }
  });
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`   ⏱️  Generated in ${duration}s`);
  
  // Handle output
  let imageData;
  if (typeof output === 'string') {
    imageData = output;
  } else if (Array.isArray(output) && typeof output[0] === 'string') {
    imageData = output[0];
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
      const filename = `mirror-selfie-03-confident-v3-${Date.now()}.jpg`;
      const imagePath = path.join(outputDir, filename);
      fs.writeFileSync(imagePath, combined);
      console.log(`   💾 Saved locally: ${filename}`);
      imageData = imagePath;
    }
  }
  
  console.log('   📤 Uploading to Cloudinary...');
  const uploadResult = await cloudinary.uploader.upload(imageData, {
    folder: 'mila-posts/mirror-selfie-carousel',
    public_id: `mirror-selfie-03-confident-v3-${Date.now()}`,
    resource_type: 'image',
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ PHOTO 3 REGENERATED');
  console.log('='.repeat(60));
  console.log(`\n📸 New Photo 3: ${uploadResult.secure_url}`);
  console.log('\n🎉 Done! This should match photo 2 scene exactly.');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

