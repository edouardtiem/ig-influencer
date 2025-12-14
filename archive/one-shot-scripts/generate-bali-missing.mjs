#!/usr/bin/env node
/**
 * Regenerate the 2 missing Bali photos that got blocked
 * With adjusted prompts to pass safety filter
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

const MILA_BASE = `Young French woman Mila, 22 years old, copper auburn curly hair type 3A shoulder-length loose curls, hazel-green eyes with golden flecks, oval elongated face with high cheekbones, light tan Mediterranean skin with healthy sun-kissed glow, small beauty mark above left lip corner, light golden freckles on nose and cheekbones, thin gold necklace with star pendant visible, slim athletic physique 168cm`;

// Adjusted prompts - more conservative to pass safety filter
const MISSING_PROMPTS = [
  // Photo 2: Beach towel relaxing (adjusted from lying)
  {
    name: 'bali-beach-relaxing',
    prompt: `Authentic iPhone photo, Instagram aesthetic 2025, beach lifestyle candid moment,

${MILA_BASE},

[SCENE] Sitting casually on a colorful beach towel on pristine Bali white sand beach, relaxed vacation pose,

[POSE] Sitting upright on beach towel, knees bent, arms wrapped around her knees, looking at camera with soft happy smile, relaxed natural pose, beach day vibes,

[OUTFIT] Terracotta burnt orange bikini visible, triangle top, sitting naturally on colorful sarong or beach towel,

[SETTING] White sand Bali beach, turquoise ocean in background, golden hour warm light, palm trees visible, tropical paradise,

[MOOD] Relaxed, happy, beach day vibes, vacation memories, serene summer moment,

[COMPOSITION] Full body shot, sitting pose, beach towel and ocean visible, natural warm lighting,

--no tattoos, --no explicit, --no provocative pose, --no lying down`
  },
  
  // Photo 3: Standing selfie (adjusted)
  {
    name: 'bali-standing-selfie',
    prompt: `Authentic iPhone selfie photo, Instagram aesthetic 2025, travel selfie moment,

${MILA_BASE},

[SCENE] Taking a standing selfie on Bali beach at sunset, arm extended, genuine happy expression,

[POSE] Standing upright on beach, one arm extended forward taking selfie, head slightly tilted, big genuine smile, other hand making a peace sign, relaxed standing pose,

[ACCESSORIES] Oversized cat-eye tortoiseshell sunglasses pushed up on top of her head, terracotta bikini straps visible on shoulders, thin gold star necklace,

[SETTING] Bali beach sunset behind her, palm trees silhouettes, beautiful orange pink sky, golden hour lighting, tropical paradise background,

[MOOD] Happy, excited, vacation selfie moment, genuine joy, sharing travel memories,

[COMPOSITION] Selfie angle, face and upper body visible, stunning Bali sunset background,

--no tattoos, --no explicit, --no duck face, --no filter heavy look`
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
      const outputDir = path.join(__dirname, '..', 'generated', 'bali-carousel');
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
      const filename = `${name}-${Date.now()}.jpg`;
      const imagePath = path.join(outputDir, filename);
      fs.writeFileSync(imagePath, combined);
      console.log(`   💾 Saved: ${filename}`);
      return { type: 'file', data: imagePath };
    }
  }
  throw new Error('Could not process output');
}

async function main() {
  console.log('🏝️  Regenerating 2 missing Bali photos...\n');
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  console.log('📷 Converting references...');
  const base64References = await Promise.all(
    FACE_REFERENCES.map(url => urlToBase64(url))
  );
  console.log('   ✅ Done');
  
  const newUrls = [];
  
  for (const item of MISSING_PROMPTS) {
    try {
      const result = await generateImage(replicate, item.prompt, base64References, item.name);
      
      console.log(`   📤 Uploading to Cloudinary...`);
      const uploadResult = await cloudinary.uploader.upload(result.data, {
        folder: 'mila-posts/bali-carousel',
        public_id: `${item.name}-${Date.now()}`,
        resource_type: 'image',
      });
      
      newUrls.push(uploadResult.secure_url);
      console.log(`   ✅ ${uploadResult.secure_url}`);
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n📸 New images URLs:');
  newUrls.forEach((url, i) => console.log(`   ${i + 1}. ${url}`));
  
  // Load existing URLs and merge
  const urlsFile = path.join(__dirname, '..', 'generated', 'bali-carousel', 'urls.json');
  if (fs.existsSync(urlsFile)) {
    const existing = JSON.parse(fs.readFileSync(urlsFile, 'utf-8'));
    const allUrls = [...existing.urls, ...newUrls];
    console.log('\n📦 All carousel URLs (5 total):');
    allUrls.forEach((url, i) => console.log(`   ${i + 1}. ${url}`));
    
    // Update file
    existing.urls = allUrls;
    existing.updatedAt = new Date().toISOString();
    fs.writeFileSync(urlsFile, JSON.stringify(existing, null, 2));
  }
}

main().catch(console.error);

