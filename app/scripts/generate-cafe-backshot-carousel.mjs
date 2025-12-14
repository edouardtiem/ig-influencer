#!/usr/bin/env node
/**
 * Generate Café Backshot Carousel - 3 photos for Instagram
 * Inspired by @margauxbtn - woman from behind at café counter
 * 
 * Run with: node scripts/generate-cafe-backshot-carousel.mjs
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

// Character description for back view (no face details needed)
const MILA_BACK = `Young French woman Mila, 22 years old, copper auburn curly hair type 3A shoulder-length loose curls with natural volume, slim athletic physique 168cm, toned back and shoulders, light tan Mediterranean skin`;

// Negative prompt
const NEGATIVE = `cartoon, anime, illustration, 3D render, CGI, deformed body, blurry, bad anatomy, extra limbs, watermark, text, logo, oversaturated, plastic skin, wrong hair color, straight hair, tattoos, coat, jacket, face visible, front view, 8k text`;

// 3 Carousel Prompts - Café Backshot Series (like @margauxbtn)
const CAROUSEL_PROMPTS = [
  // Photo 1: Full body from behind at counter
  {
    name: 'cafe-backshot-01-full',
    prompt: `2025 instagram style, photorealistic Instagram photo, natural warm indoor lighting, authentic candid feel, amateur photo feel,

${MILA_BACK},

[CLOTHING] oversized grey knit V-neck sweater with deep open back revealing bare skin and shoulder blades, thin gold necklace with star pendant visible on neck from behind, dark grey slim jeans, black platform ankle boots,

[POSE] standing at café counter from BEHIND, full body back view, weight on one leg creating natural hip angle, right hand resting on wooden counter, copper curly hair falling naturally on shoulders, head slightly tilted looking at pastry display,

[SETTING] cozy Parisian café interior, rustic exposed stone wall, warm wood paneled counter, vintage espresso machine on left, glass pastry display case with croissants and pastries, warm Edison bulb lighting, afternoon golden light,

[LIGHTING] warm indoor ambient light, soft golden afternoon glow from window, cozy café atmosphere,

[MOOD] effortless French girl vibe, casual elegance, candid moment,

[QUALITY] high resolution, sharp focus, natural skin texture, Instagram-ready, no text on image,

${NEGATIVE}`
  },
  
  // Photo 2: Medium shot, more focus on the open back detail
  {
    name: 'cafe-backshot-02-medium',
    prompt: `2025 instagram style, photorealistic Instagram photo, natural warm indoor lighting, authentic candid feel, amateur photo feel,

${MILA_BACK},

[CLOTHING] oversized grey knit V-neck sweater with deep open back revealing bare skin and shoulder blades, thin gold necklace with star pendant visible on neck, dark grey slim jeans,

[POSE] standing at café counter from BEHIND, medium shot waist up, back muscles subtly visible through open back sweater, both hands on counter, copper curly hair swept to one side showing neck and open back detail, relaxed shoulders,

[SETTING] cozy Parisian café interior, rustic exposed stone wall background, warm wood counter, glass pastry display with macarons and croissants visible, vintage café decor,

[LIGHTING] warm indoor ambient light, soft afternoon glow, intimate café atmosphere,

[MOOD] effortless French girl vibe, casual elegance, intimate moment,

[QUALITY] high resolution, sharp focus on back and hair details, natural skin texture, Instagram-ready, no text on image,

CRITICAL: Use EXACT SAME CAFÉ and BACKGROUND as previous image. Same stone wall, same counter, same pastry display, same lighting. Only framing changes to medium shot.

${NEGATIVE}`
  },
  
  // Photo 3: Upper body, artistic angle
  {
    name: 'cafe-backshot-03-close',
    prompt: `2025 instagram style, photorealistic Instagram photo, natural warm indoor lighting, authentic candid feel, amateur photo feel,

${MILA_BACK},

[CLOTHING] oversized grey knit V-neck sweater with deep open back showing bare upper back and shoulder blades, thin gold necklace with star pendant catching light,

[POSE] standing at café counter from BEHIND, upper body shot, slight angle showing profile silhouette, one hand touching copper curly hair, elegant neck and shoulder line visible, natural relaxed posture,

[SETTING] cozy Parisian café interior, rustic exposed stone wall soft focus background, warm wood tones, hint of pastry display, vintage ambiance,

[LIGHTING] warm golden indoor light, soft backlighting creating subtle glow on hair edges, intimate café mood,

[MOOD] effortless French girl vibe, naturally sensual, artistic candid moment,

[QUALITY] high resolution, sharp focus on hair and back silhouette, natural skin texture, Instagram-ready, no text on image,

CRITICAL: Use EXACT SAME CAFÉ and BACKGROUND as previous images. Same stone wall, same warm tones, same lighting mood. Only framing changes to close upper body.

${NEGATIVE}`
  }
];

// Caption - innovative, not about the sweater
const CAPTION = `Indécise devant les pâtisseries > indécise dans la vie 🥐

Ça fait 10 min que je fixe ce pain au chocolat.
Il me regarde aussi.
C'est tendu.

📍 Mon QG du dimanche

.
.
.
#sundayvibes #parisienne #cafelife #patisserie #frenchgirl #weekendmood #cozyvibes #parisianlife`;

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

async function generateImage(replicate, prompt, references, index) {
  console.log(`\n📸 Generating image ${index + 1}/3: ${CAROUSEL_PROMPTS[index].name}`);
  
  const startTime = Date.now();
  
  const input = {
    prompt: prompt,
    aspect_ratio: "4:5",
    resolution: "2K",
    output_format: "jpg",
    safety_filter_level: "block_only_high",
  };
  
  // Add references if we have them (for scene consistency)
  if (references && references.length > 0) {
    input.image_input = references;
  }
  
  const output = await replicate.run("google/nano-banana-pro", { input });
  
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
      const outputDir = path.join(__dirname, '..', 'generated', 'cafe-backshot-carousel');
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
  console.log('☕ Starting Café Backshot Carousel generation (3 photos)...\n');
  console.log('📝 Concept: Mila de dos dans un café parisien, pull dos nu\n');
  
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    console.error('❌ REPLICATE_API_TOKEN not found');
    process.exit(1);
  }
  
  const replicate = new Replicate({ auth: apiToken });
  
  // Generate all 3 images
  const cloudinaryUrls = [];
  const localPaths = [];
  let firstPhotoBase64 = null;
  
  for (let i = 0; i < CAROUSEL_PROMPTS.length; i++) {
    try {
      // Build references: use first photo for scene consistency (from photo 2 onwards)
      let references = [];
      if (i > 0 && firstPhotoBase64) {
        // Double the reference for stronger scene consistency
        references = [firstPhotoBase64, firstPhotoBase64];
        console.log(`   🔗 Using photo 1 as scene reference (doubled for consistency)`);
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
        console.log('   📌 Photo 1 saved as reference for scene consistency');
      }
      
      // Upload to Cloudinary
      console.log(`   📤 Uploading to Cloudinary...`);
      const uploadSource = imageResult.type === 'file' ? imageResult.data : imageResult.data;
      const uploadResult = await cloudinary.uploader.upload(uploadSource, {
        folder: 'mila-posts/cafe-backshot-carousel',
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
    }
  }
  
  if (cloudinaryUrls.length === 0) {
    console.error('\n❌ No images generated successfully');
    process.exit(1);
  }
  
  console.log(`\n✅ Generated ${cloudinaryUrls.length}/3 images`);
  
  // Save results for scheduling script
  const outputDir = path.join(__dirname, '..', 'generated', 'cafe-backshot-carousel');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  
  const result = {
    timestamp: new Date().toISOString(),
    concept: 'Café backshot - Mila de dos dans café parisien',
    urls: cloudinaryUrls,
    caption: CAPTION,
    localPaths,
  };
  
  const outputFile = path.join(outputDir, 'latest.json');
  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
  
  console.log('\n📸 Images URLs:');
  cloudinaryUrls.forEach((url, i) => console.log(`   ${i + 1}. ${url}`));
  console.log(`\n📝 Caption:\n${CAPTION}`);
  console.log(`\n💾 Results saved to: ${outputFile}`);
  console.log('\n🎉 Done! Run schedule-cafe-carousel.mjs to schedule for tomorrow 14:22');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
