#!/usr/bin/env node
/**
 * Generate Bali Beach Carousel - 5 photos for Instagram
 * Continuation of the back-view bikini photo already posted
 * 
 * Run with: node scripts/generate-bali-carousel.mjs
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

async function urlToBase64(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const contentType = response.headers.get('content-type') || 'image/png';
  return `data:${contentType};base64,${base64}`;
}

// Character base prompt (Mila traits)
const MILA_BASE = `Young French woman Mila, 22 years old, copper auburn curly hair type 3A shoulder-length loose curls, hazel-green eyes with golden flecks, oval elongated face with high cheekbones, light tan Mediterranean skin with healthy sun-kissed glow, small beauty mark above left lip corner, light golden freckles on nose and cheekbones, thin gold necklace with star pendant visible, slim athletic physique 168cm, natural curves, toned body`;

// 5 Carousel Prompts - Bali Beach Series
const CAROUSEL_PROMPTS = [
  // Photo 1: Front view in water
  {
    name: 'bali-water-front',
    prompt: `Authentic iPhone photo, Instagram aesthetic 2025, travel influencer candid moment,

${MILA_BASE},

[SCENE] Standing in crystal clear shallow Bali water up to her thighs, facing the camera with a playful confident smile, 

[POSE] Both hands running through her wet hair, lifting it up naturally, arms raised showing her toned body, water droplets on her sun-kissed skin, relaxed hip slightly tilted,

[BIKINI] Stylish terracotta burnt orange ribbed triangle bikini top with thin straps, matching high-waisted bikini bottom, the bikini flatters her athletic feminine figure,

[SETTING] Bali beach crystal turquoise water, tropical paradise, palm trees in distance, clear blue sky, late afternoon golden hour lighting,

[MOOD] Playful, carefree, summer vacation energy, effortlessly attractive, beach goddess vibes, travel influencer aesthetic,

[COMPOSITION] Medium shot from thighs up, focus on face and upper body, sun-kissed healthy skin visible,

--no tattoos, --no explicit, --no oversexualized pose, --no fake looking`
  },
  
  // Photo 2: Lying on sand
  {
    name: 'bali-sand-lying',
    prompt: `Authentic iPhone photo, Instagram aesthetic 2025, beach lifestyle candid moment,

${MILA_BASE},

[SCENE] Lying on pristine white Bali sand beach, propped up on one elbow in a relaxed sunbathing pose,

[POSE] Lying on her side, one arm supporting her head, legs slightly bent in a natural relaxed position, looking at camera with soft dreamy smile, full body visible from head to feet,

[BIKINI] Same terracotta burnt orange bikini, triangle top and high-waisted bottom, sand grains on her skin adding authenticity,

[SETTING] White sand Bali beach, turquoise ocean in background, golden hour warm light casting soft shadows, beach towel or sarong partially visible underneath,

[MOOD] Relaxed, serene, summer daydream, beach babe aesthetic, warm vacation vibes,

[COMPOSITION] Full body shot, lying pose, camera angle slightly from above, natural beach setting,

--no tattoos, --no explicit, --no unnatural pose, --no overly posed`
  },
  
  // Photo 3: Selfie
  {
    name: 'bali-selfie',
    prompt: `Authentic iPhone selfie photo, Instagram aesthetic 2025, travel selfie moment,

${MILA_BASE},

[SCENE] Taking a selfie on Bali beach, arm extended holding phone visible in frame edge, big genuine smile,

[POSE] Classic selfie pose, one arm extended forward (phone visible at edge of frame), slightly tilted head, genuine happy smile showing teeth, other hand making peace sign or touching her sunglasses pushed up on her head,

[ACCESSORIES] Oversized cat-eye tortoiseshell sunglasses pushed up on top of her head, showing off her face, terracotta bikini straps visible on shoulders,

[SETTING] Bali beach behind her, palm trees, turquoise water, beautiful sunset sky with warm colors, golden hour selfie lighting,

[MOOD] Happy, excited, vacation joy, sharing the moment, genuine smile not fake, travel influencer authentic selfie,

[COMPOSITION] Selfie angle from above, close-up face and shoulders, beach paradise visible in background,

--no tattoos, --no duck lips, --no fake pose, --no filter heavy look`
  },
  
  // Photo 4: Restaurant with watermelon
  {
    name: 'bali-restaurant-watermelon',
    prompt: `Authentic iPhone photo, Instagram aesthetic 2025, travel lifestyle moment,

${MILA_BASE},

[SCENE] Sitting at a beautiful Bali beach resort restaurant or pool bar, enjoying a fresh watermelon slice,

[POSE] Seated casually on a high stool or lounger, holding a large fresh watermelon slice with both hands, about to take a bite, playful expression, looking at camera with a flirty smile,

[OUTFIT] Still in her terracotta bikini top visible, with a light sarong or beach cover-up loosely draped around her waist, casual beach to restaurant transition look,

[SETTING] Trendy Bali beach club or hotel restaurant, tropical plants, wooden decor, maybe infinity pool visible in background, natural daylight, tropical resort aesthetic,

[FOOD] Large fresh red watermelon slice held up near her face, vibrant red fruit color contrasting with her tan skin,

[MOOD] Playful, fun summer moment, tropical vacation lifestyle, influencer brunch content, fresh and healthy vibes,

[COMPOSITION] Upper body shot, seated pose, watermelon as prop, tropical resort setting,

--no tattoos, --no messy eating, --no unflattering angle, --no explicit`
  },
  
  // Photo 5: Walking out of water
  {
    name: 'bali-water-walking',
    prompt: `Authentic iPhone photo, Instagram aesthetic 2025, candid beach moment,

${MILA_BASE},

[SCENE] Walking out of the ocean toward the beach, water up to her knees, caught mid-stride in a natural walking motion,

[POSE] Three-quarter profile view, walking toward camera, one leg forward mid-step, water splashing slightly around her legs, hair wet and tousled from swimming, looking back over her shoulder toward the ocean with a serene smile,

[BIKINI] Same terracotta burnt orange bikini, wet and clinging to her athletic figure, water droplets glistening on her tan skin,

[SETTING] Bali beach shoreline, crystal clear water, waves gently breaking around her legs, sunset golden hour, dramatic beautiful sky,

[MOOD] Serene, confident, beach goddess emerging from the sea, natural beauty moment, cinematic vacation shot,

[COMPOSITION] Full body shot, three-quarter angle, dynamic walking pose, ocean and sunset in background,

--no tattoos, --no explicit, --no artificial pose, --no overly dramatic`
  }
];

// Engaging Instagram Caption with CTA
const CAPTION = `Ok mais... quelle photo vous préférez ? 👀

De la plage au resto, en passant par un selfie obligatoire 📸 
Bali c'était vraiment un rêve éveillé 🌴✨

Swipe jusqu'à la fin pour la pastèque 🍉
(oui je mange en bikini au resto, no judgment pls 😅)

📍 Bali, Indonesia

Dites-moi votre préférée en commentaire ! 
1, 2, 3, 4 ou 5 ? ⬇️

.
.
.
#bali #balilife #beachvibes #travelgram #summervibes #bikiniseason #tropicalparadise #islandlife #balibabe #beachbabe #goldenhour #wanderlust #travelinfluencer #vacationmode #summermood`;

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
      const outputDir = path.join(__dirname, '..', 'generated', 'bali-carousel');
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
  console.log('🏝️  Starting Bali Beach Carousel generation (5 photos)...\n');
  
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    console.error('❌ REPLICATE_API_TOKEN not found');
    process.exit(1);
  }
  
  const webhookUrl = process.env.MAKE_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('❌ MAKE_WEBHOOK_URL not found');
    process.exit(1);
  }
  
  const replicate = new Replicate({ auth: apiToken });
  
  // Convert references to base64
  console.log('📷 Converting reference images to base64...');
  const base64References = await Promise.all(
    FACE_REFERENCES.map(async (url, i) => {
      const b64 = await urlToBase64(url);
      console.log(`   ✅ Face ref ${i + 1} converted`);
      return b64;
    })
  );
  
  // Generate all 5 images
  const cloudinaryUrls = [];
  const localPaths = [];
  
  for (let i = 0; i < CAROUSEL_PROMPTS.length; i++) {
    try {
      const imageResult = await generateImage(
        replicate, 
        CAROUSEL_PROMPTS[i].prompt, 
        base64References, 
        i
      );
      
      // Upload to Cloudinary
      console.log(`   📤 Uploading to Cloudinary...`);
      const uploadSource = imageResult.type === 'file' ? imageResult.data : imageResult.data;
      const uploadResult = await cloudinary.uploader.upload(uploadSource, {
        folder: 'mila-posts/bali-carousel',
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
  
  // Send to Make.com webhook for Buffer
  // Format for carousel: send images array + individual image fields for compatibility
  console.log('\n📡 Sending carousel to Make.com → Buffer...');
  
  const webhookPayload = {
    // Carousel format
    images: cloudinaryUrls,
    image_count: cloudinaryUrls.length,
    type: 'carousel',
    
    // Individual images for Make.com compatibility (image1, image2, etc.)
    image: cloudinaryUrls[0],
    image1: cloudinaryUrls[0] || null,
    image2: cloudinaryUrls[1] || null,
    image3: cloudinaryUrls[2] || null,
    image4: cloudinaryUrls[3] || null,
    image5: cloudinaryUrls[4] || null,
    
    // Caption
    caption: CAPTION,
  };
  
  console.log('   Payload preview:', JSON.stringify({
    type: webhookPayload.type,
    image_count: webhookPayload.image_count,
    caption: CAPTION.slice(0, 50) + '...'
  }, null, 2));
  
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(webhookPayload),
  });
  
  if (!response.ok) {
    console.error(`❌ Webhook error: ${response.status}`);
    const errorText = await response.text();
    console.error(errorText);
    
    // Still show the URLs so user can post manually
    console.log('\n⚠️  Webhook failed but images are ready!');
    console.log('📸 Copy these URLs to post manually:\n');
    cloudinaryUrls.forEach((url, i) => console.log(`   ${i + 1}. ${url}`));
    process.exit(1);
  }
  
  const responseText = await response.text();
  console.log(`\n✅ Webhook response: ${responseText || '(empty - OK)'}`);
  
  console.log('\n🎉 SUCCESS! Carousel sent to Buffer via Make.com');
  console.log('\n📸 Images URLs:');
  cloudinaryUrls.forEach((url, i) => console.log(`   ${i + 1}. ${url}`));
  console.log(`\n📝 Caption:\n${CAPTION}`);
  
  // Save URLs to file for reference
  const outputFile = path.join(__dirname, '..', 'generated', 'bali-carousel', 'urls.json');
  fs.writeFileSync(outputFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    urls: cloudinaryUrls,
    caption: CAPTION,
    localPaths,
  }, null, 2));
  console.log(`\n💾 URLs saved to: ${outputFile}`);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

