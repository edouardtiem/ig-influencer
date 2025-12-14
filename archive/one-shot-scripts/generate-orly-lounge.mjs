#!/usr/bin/env node
/**
 * Generate Mila at Orly Airport First Class Lounge
 * Mirror selfie with fruit salad
 * 
 * Run with: node scripts/generate-orly-lounge.mjs
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

// Mila character base
const MILA_BASE = `Young French woman, 22 years old, copper auburn curly hair type 3A shoulder-length loose curls, hazel-green eyes with golden flecks, oval elongated face with high cheekbones, light tan Mediterranean skin, small beauty mark above left lip corner, light golden freckles on nose and cheekbones, thin gold necklace with star pendant, slim athletic physique`;

// Instagram 2025 style (NOT AI-looking)
const INSTAGRAM_STYLE = `Amateur iPhone photo, heavy HDR glow, deeply crushed shadows, visible film grain, noise, Instagram 2025 aesthetic, candid moment, imperfect framing, lo-fi quality, slight overexposure on highlights`;

// Orly First Class Lounge prompt
const PROMPT = `${INSTAGRAM_STYLE},

${MILA_BASE},

[SCENE] Mirror selfie in a luxurious airport first class lounge at Paris Orly airport. She is sitting in front of a large wall mirror, taking a photo of herself visible in the reflection.

[OUTFIT - TRAVEL CHIC]
- Long elegant camel/beige wool coat, open and draped over her shoulders
- Cozy oversized grey hoodie underneath, casual comfort
- Tight black athletic shorts (bike shorts style), showing off her toned legs
- White sneakers or slides
- Travel outfit mixing luxury with comfort

[POSE] 
Sitting casually on a plush lounge chair or sofa in front of a large mirror. One hand holding her iPhone taking the mirror selfie (phone visible in reflection), other hand holding a clear container of fresh fruit salad with colorful fruits (strawberries, mango, kiwi, grapes). Relaxed confident pose, slight smile, looking at phone screen.

[SETTING - FIRST CLASS LOUNGE]
Elegant airport lounge interior, soft ambient lighting, modern minimalist decor, large mirror on wall, comfortable seating area, maybe glimpse of runway or planes through windows in background, premium lounge atmosphere, early morning or daytime light.

[FOOD]
Fresh colorful fruit salad in a clear plastic container - bright red strawberries, orange mango cubes, green kiwi slices, purple grapes. Healthy travel snack.

[MIRROR REFLECTION]
The mirror shows her reflection taking the photo, phone screen visible, creating that classic mirror selfie composition. Her full outfit visible in the mirror reflection.

[MOOD]
Jet-setter vibes, travel day aesthetic, mixing casual athletic wear with luxury lounge, effortlessly chic, healthy lifestyle, early flight energy, "ready for takeoff" moment.

[COMPOSITION]
Mirror selfie composition - she is sitting facing the mirror, we see both her back/side and her reflection. Phone in hand capturing the moment. Fruit salad as a prop adding color and lifestyle element.

--no tattoos, --no heavy makeup, --no fake looking, --no overly posed, --no perfect lighting, --no studio look`;

// Caption
const CAPTION = `Gate 42. Boarding dans 2h. 
Premier salon, première salade de fruits 🍓✈️

Le combo hoodie + manteau + short = mon uniforme de vol officiel
(oui même en décembre, j'assume)

On part où à votre avis ? 👀

.
.
.
#airportlife #travelday #orlyairport #firstclasslounge #traveloutfit #jetsetterlife #frenchgirl #parisienne #healthysnack #morningflight #travelstyle #ootd #comfytravel`;

async function main() {
  console.log('✈️  Generating Orly Airport Lounge photo...\n');
  
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    console.error('❌ REPLICATE_API_TOKEN not found');
    process.exit(1);
  }
  
  const webhookUrl = process.env.MAKE_WEBHOOK_URL;
  
  const replicate = new Replicate({ auth: apiToken });
  
  // Convert references
  console.log('📷 Converting reference images...');
  const base64References = await Promise.all(
    FACE_REFERENCES.map(async (url, i) => {
      const b64 = await urlToBase64(url);
      console.log(`   ✅ Face ref ${i + 1}`);
      return b64;
    })
  );
  
  console.log('\n🎨 Generating image...');
  console.log('   Style: Instagram 2025 (amateur, HDR glow, crushed shadows)');
  console.log('   Scene: Orly First Class Lounge, mirror selfie');
  
  const startTime = Date.now();
  
  try {
    const output = await replicate.run("google/nano-banana-pro", {
      input: {
        prompt: PROMPT,
        image_input: base64References,
        aspect_ratio: "4:5",
        resolution: "2K",
        output_format: "jpg",
        safety_filter_level: "block_only_high",
      }
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n⏱️  Generated in ${duration}s`);
    
    let imagePath = null;
    let imageUrl = null;
    
    if (typeof output === 'string') {
      imageUrl = output;
    } else if (Array.isArray(output) && typeof output[0] === 'string') {
      imageUrl = output[0];
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
        const outputDir = path.join(__dirname, '..', 'generated');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
        const filename = `orly-lounge-${Date.now()}.jpg`;
        imagePath = path.join(outputDir, filename);
        fs.writeFileSync(imagePath, combined);
        console.log(`\n💾 Saved: ${filename}`);
      }
    }
    
    if (!imagePath && !imageUrl) {
      console.error('❌ No image output');
      process.exit(1);
    }
    
    // Upload to Cloudinary
    console.log('\n📤 Uploading to Cloudinary...');
    const uploadSource = imagePath || imageUrl;
    const uploadResult = await cloudinary.uploader.upload(uploadSource, {
      folder: 'mila-posts',
      public_id: `orly-lounge-${Date.now()}`,
      resource_type: 'image',
    });
    
    const cloudinaryUrl = uploadResult.secure_url;
    console.log(`✅ Uploaded: ${cloudinaryUrl}`);
    
    // Post to Buffer via Make.com
    if (webhookUrl) {
      console.log('\n📡 Sending to Make.com → Buffer...');
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: cloudinaryUrl,
          caption: CAPTION,
        }),
      });
      
      if (response.ok) {
        console.log('✅ Sent to Buffer!');
      } else {
        console.log('⚠️  Webhook failed, but image is ready');
      }
    }
    
    console.log('\n🎉 SUCCESS!');
    console.log(`\n📸 Image: ${cloudinaryUrl}`);
    console.log(`\n📝 Caption:\n${CAPTION}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

