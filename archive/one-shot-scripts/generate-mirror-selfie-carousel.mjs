#!/usr/bin/env node
/**
 * Generate Mirror Selfie Cozy Carousel - 5 photos for Instagram
 * Inspired by @iamsofiablue carousel style
 * 
 * Run with: node scripts/generate-mirror-selfie-carousel.mjs
 */

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

// Load environment from .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Reference images for Mila's face consistency
const FACE_REFERENCES = [
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_2_q8kxit.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767098/Photo_3_nopedx.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_4_pna4fo.png',
];

// Apartment reference for scene consistency
const APARTMENT_REFERENCE = 'https://res.cloudinary.com/dily60mr0/image/upload/v1764794600/2._Salon_Paris_ltyd8r.png';

async function urlToBase64(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const contentType = response.headers.get('content-type') || 'image/png';
  return `data:${contentType};base64,${base64}`;
}

async function fileToBase64(filePath) {
  const buf = fs.readFileSync(filePath);
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

// Character base prompt (Mila traits)
const MILA_BASE = `Young French woman Mila, 22 years old, copper auburn curly hair type 3A shoulder-length loose curls, hazel-green eyes with golden flecks, oval elongated face with high cheekbones, light tan Mediterranean skin with healthy glow, small beauty mark above left lip corner, light golden freckles on nose and cheekbones, thin gold necklace with star pendant visible, slim athletic physique 168cm, natural curves, toned body`;

// Negative prompt
const NEGATIVE = `cartoon, anime, illustration, 3D render, CGI, painting, drawing, sketch, deformed face, deformed body, asymmetric eyes, blurry, bad anatomy, extra limbs, extra fingers, watermark, text, logo, oversaturated, plastic skin, wrong hair color, straight hair, tattoos, glasses, heavy makeup, 8k text`;

// 5 Carousel Prompts - Mirror Selfie Cozy Series
const CAROUSEL_PROMPTS = [
  // Photo 1: Playful Door Lean
  {
    name: 'mirror-selfie-01-playful',
    prompt: `2025 instagram style, photorealistic Instagram photo, natural lighting, authentic candid feel, amateur photo feel,

${MILA_BASE},

[CLOTHING] oversized grey khaki V-neck knit sweater slightly cropped showing midriff, black pleated tennis mini skirt, barefoot,

[POSE] standing full body mirror selfie, left hand resting on white door frame, right hand holding iPhone taking selfie, eyes closed softly, soft kissy playful expression, weight on one leg, relaxed hip angle,

[SETTING] cozy bright apartment interior, large round black frame floor mirror, white door with gold handle behind, light wooden parquet floor, soft white walls, intercom panel on wall, natural daylight from window,

[LIGHTING] soft morning daylight, diffused natural light from window, warm indoor ambient,

[MOOD] confident, playful, flirty, effortless French girl vibe,

[QUALITY] high resolution, sharp focus on face, natural skin texture, Instagram-ready, no text on image,

${NEGATIVE}`
  },
  
  // Photo 2: Classic Standing Mirror
  {
    name: 'mirror-selfie-02-classic',
    prompt: `2025 instagram style, photorealistic Instagram photo, natural lighting, authentic candid feel, amateur photo feel,

${MILA_BASE},

[CLOTHING] oversized grey khaki V-neck knit sweater slightly cropped, black pleated tennis mini skirt, barefoot,

[POSE] standing straight full body mirror selfie, both hands holding iPhone at chest level, legs together, looking down at phone screen with soft gentle smile, relaxed shoulders,

[SETTING] cozy bright apartment interior, large round black frame mirror visible on left edge, white door with gold handle behind, light wooden parquet floor, soft white walls, natural daylight,

[LIGHTING] soft morning daylight, diffused natural light, bright airy indoor atmosphere,

[MOOD] confident, warm, soft feminine energy, effortless French girl vibe,

[QUALITY] high resolution, sharp focus on face, natural skin texture, Instagram-ready, no text on image,

${NEGATIVE}`
  },
  
  // Photo 3: Hand in Hair Confident
  {
    name: 'mirror-selfie-03-confident',
    prompt: `2025 instagram style, photorealistic Instagram photo, natural lighting, authentic candid feel, amateur photo feel,

${MILA_BASE},

[CLOTHING] oversized grey khaki V-neck knit sweater over white tee visible at neckline, black pleated tennis mini skirt, barefoot,

[POSE] standing full body mirror selfie, left hand raised touching hair behind head, right hand holding iPhone for selfie, confident intense gaze at phone, lips slightly parted, weight shifted to one hip,

[SETTING] cozy bright apartment interior, large round black frame mirror visible on left edge, white door with gold handle behind, light wooden parquet floor, soft white walls, intercom panel visible,

[LIGHTING] soft afternoon daylight, diffused natural light, warm indoor ambient lighting,

[MOOD] confident, sultry, naturally sensual, effortless French girl vibe,

[QUALITY] high resolution, sharp focus on face, natural skin texture, Instagram-ready, no text on image,

${NEGATIVE}`
  },
  
  // Photo 4: Sitting Floor Relaxed
  {
    name: 'mirror-selfie-04-sitting',
    prompt: `2025 instagram style, photorealistic Instagram photo, natural lighting, authentic candid feel, amateur photo feel,

${MILA_BASE},

[CLOTHING] oversized grey khaki V-neck knit sweater, black pleated tennis mini skirt, barefoot with painted nails,

[POSE] sitting on wooden floor, legs folded to the side, one knee up, holding iPhone covering lower face for mirror selfie, eyes looking at phone, relaxed casual pose, hair falling naturally,

[SETTING] cozy bright apartment interior, sitting on light wooden parquet floor, white door with gold handle visible behind, grey couch edge visible, soft white walls, plant in corner,

[LIGHTING] soft morning daylight, diffused natural light from window, warm cozy indoor ambient,

[MOOD] confident, cozy, relaxed, intimate, effortless French girl vibe,

[QUALITY] high resolution, sharp focus on eyes, natural skin texture, Instagram-ready, no text on image,

${NEGATIVE}`
  },
  
  // Photo 5: Mirror Frame Lean
  {
    name: 'mirror-selfie-05-elegant',
    prompt: `2025 instagram style, photorealistic Instagram photo, natural lighting, authentic candid feel, amateur photo feel,

${MILA_BASE},

[CLOTHING] oversized grey khaki V-neck knit sweater, black pleated tennis mini skirt, barefoot,

[POSE] standing full body mirror selfie, left arm extended touching large round mirror frame, right hand holding iPhone for selfie, confident soft smile, slight head tilt, elongated elegant pose,

[SETTING] cozy bright apartment interior, leaning on large round black frame floor mirror, white door with gold handle visible, light wooden parquet floor, soft white walls,

[LIGHTING] soft afternoon daylight, diffused natural light, warm golden indoor ambient,

[MOOD] confident, elegant, naturally sensual, effortless French girl vibe,

[QUALITY] high resolution, sharp focus on face, natural skin texture, Instagram-ready, no text on image,

${NEGATIVE}`
  }
];

// Caption suggestion
const CAPTION = `Simple looks hit the hardest 😌✨

#ootd #mirrorselfieszn #cozyvibes #frenchgirl #parisienne`;

async function generateImage(replicate, prompt, references, index) {
  console.log(`\n📸 Generating image ${index + 1}/5: ${CAROUSEL_PROMPTS[index].name}`);
  
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
  
  // Handle output (URL or binary stream)
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
      // Save locally and return path
      const outputDir = path.join(__dirname, '..', 'generated', 'mirror-selfie-carousel');
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
      const filename = `${CAROUSEL_PROMPTS[index].name}-${Date.now()}.jpg`;
      const imagePath = path.join(outputDir, filename);
      fs.writeFileSync(imagePath, combined);
      console.log(`   💾 Saved locally: ${filename}`);
      return { type: 'file', data: imagePath };
    }
  }
  throw new Error('Could not process output');
}

async function main() {
  console.log('🪞  Starting Mirror Selfie Cozy Carousel generation (5 photos)...\n');
  
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    console.error('❌ REPLICATE_API_TOKEN not found');
    process.exit(1);
  }
  
  const replicate = new Replicate({ auth: apiToken });
  
  // Convert references to base64
  console.log('📷 Converting reference images to base64...');
  const base64FaceRefs = await Promise.all(
    FACE_REFERENCES.map(async (url, i) => {
      const b64 = await urlToBase64(url);
      console.log(`   ✅ Face ref ${i + 1} converted`);
      return b64;
    })
  );
  
  // Convert apartment reference
  console.log('🏠 Converting apartment reference to base64...');
  const apartmentRef = await urlToBase64(APARTMENT_REFERENCE);
  console.log('   ✅ Apartment ref converted');
  
  // Generate all 5 images
  const cloudinaryUrls = [];
  const localPaths = [];
  let firstPhotoBase64 = null; // Will store first generated photo for consistency
  
  for (let i = 0; i < CAROUSEL_PROMPTS.length; i++) {
    try {
      // Build references: face refs + apartment ref + first photo (from photo 2 onwards)
      let references = [...base64FaceRefs, apartmentRef];
      if (i > 0 && firstPhotoBase64) {
        references.push(firstPhotoBase64);
        console.log(`   🔗 Using photo 1 as additional reference for scene consistency`);
      }
      
      const imageResult = await generateImage(
        replicate, 
        CAROUSEL_PROMPTS[i].prompt, 
        references, 
        i
      );
      
      // Store first photo for subsequent generations
      if (i === 0) {
        if (imageResult.type === 'file') {
          firstPhotoBase64 = await fileToBase64(imageResult.data);
        } else if (imageResult.type === 'url') {
          firstPhotoBase64 = await urlToBase64(imageResult.data);
        }
        console.log('   📌 First photo saved as reference for next photos');
      }
      
      // Upload to Cloudinary
      console.log(`   📤 Uploading to Cloudinary...`);
      const uploadSource = imageResult.type === 'file' ? imageResult.data : imageResult.data;
      const uploadResult = await cloudinary.uploader.upload(uploadSource, {
        folder: 'mila-posts/mirror-selfie-carousel',
        public_id: `${CAROUSEL_PROMPTS[i].name}-${Date.now()}`,
        resource_type: 'image',
      });
      
      cloudinaryUrls.push(uploadResult.secure_url);
      if (imageResult.type === 'file') {
        localPaths.push(imageResult.data);
      }
      console.log(`   ✅ Uploaded: ${uploadResult.secure_url}`);
      
    } catch (error) {
      console.error(`   ❌ Error on image ${i + 1}:`, error.message);
      // Continue with other images
    }
  }
  
  if (cloudinaryUrls.length === 0) {
    console.error('\n❌ No images generated successfully');
    process.exit(1);
  }
  
  console.log(`\n✅ Generated ${cloudinaryUrls.length}/5 images`);
  
  // NOT sending to webhook - user will post manually
  console.log('\n📸 Images URLs (for manual posting):');
  cloudinaryUrls.forEach((url, i) => console.log(`   ${i + 1}. ${url}`));
  console.log(`\n📝 Suggested Caption:\n${CAPTION}`);
  
  // Save URLs to file for reference
  const outputDir = path.join(__dirname, '..', 'generated', 'mirror-selfie-carousel');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const outputFile = path.join(outputDir, 'urls.json');
  fs.writeFileSync(outputFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    urls: cloudinaryUrls,
    caption: CAPTION,
    localPaths,
  }, null, 2));
  console.log(`\n💾 URLs saved to: ${outputFile}`);
  
  console.log('\n🎉 Done! Copy the URLs above to post manually on Instagram.');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

