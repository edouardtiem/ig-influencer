#!/usr/bin/env node
/**
 * Generate Mila in Bali beach photo (back view with bikini & sunglasses)
 * Then post to Instagram via Make.com + Buffer
 * 
 * Run with: node scripts/generate-bali-beach.mjs
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

// Convert URL to base64
async function urlToBase64(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const contentType = response.headers.get('content-type') || 'image/png';
  return `data:${contentType};base64,${base64}`;
}

// Bali Beach Prompt - Back view with bikini and sunglasses
const PROMPT = `Authentic iPhone photo, Instagram aesthetic 2025, travel influencer content, real candid beach moment,

Young French woman Mila, 22 years old, standing at a beautiful Bali beach, shot from behind showing her back,

[SUBJECT - BACK VIEW]
She is standing at the edge of the water, facing the ocean, photographed from behind. She turns her head slightly to the side in a natural pose, showing her profile with trendy oversized cat-eye sunglasses visible on her face. Her copper auburn curly hair type 3A shoulder-length loose curls is blowing gently in the ocean breeze, sun-kissed highlights visible.

[FACE PROFILE - USE REFERENCE IMAGES]
When showing her face in profile, maintain: oval face, high cheekbones, straight nose slightly upturned tip, naturally full lips, light tan Mediterranean skin with sun-kissed glow, light golden freckles on nose and cheekbones. 
CRITICAL: Use the EXACT face features from the reference photos. Maintain her distinctive beauty marks and freckles visible on cheek.

[BODY - ATHLETIC BACK VIEW]
Slim athletic physique 168cm, toned back muscles visible, feminine hourglass silhouette from behind, natural curves, toned legs, healthy summer tan.

[BIKINI - CHIC MINIMALIST]
Wearing a stylish terracotta/burnt orange ribbed bikini, triangle top with thin straps crossing her tanned back, high-waisted bikini bottom flattering her figure, the bikini shows off her toned athletic body tastefully.

[SUNGLASSES - TRENDING 2024]
Large oversized cat-eye sunglasses in tortoiseshell/amber color, visible on her face as she turns her head to the side, trendy summer 2024 style, designer look.

[SETTING - BALI BEACH]
Pristine Bali beach, crystal clear turquoise water, gentle waves lapping at her ankles, white sand beach, tropical paradise vibe, palm trees visible in distance, maybe a traditional Balinese fishing boat (jukung) in background, clear blue sky with few wispy clouds, late afternoon golden hour sun.

[ACCESSORIES]
Thin gold necklace with minimalist star pendant visible on her neck from behind/side, delicate gold anklet on left ankle, natural beach look.

[LIGHTING - GOLDEN HOUR BALI]
Beautiful golden hour sunset lighting from behind camera, warm sun rays highlighting her silhouette, golden glow on her skin, lens flare optional, dreamy summer vacation lighting.

[MOOD]
Peaceful, serene, summer vacation vibes, wanderlust, living her best life, travel influencer aesthetic, Bali summer memories, freedom, natural beauty, effortlessly chic beach goddess moment.

[COMPOSITION]
Full body shot from behind, she's standing naturally at water's edge, one foot slightly forward in the shallow water, relaxed confident pose, the vast ocean and Bali coastline stretching before her, aspirational travel content.

[INSTAGRAM AESTHETIC]
This should look like a real travel influencer photo - warm tones, slightly saturated tropical colors, authentic candid moment, not overly posed, could be from last summer's Bali trip.

--no tattoos, --no excessive editing, --no fake looking, --no plastic surgery look, --no unnatural proportions`;

// Instagram Caption
const CAPTION = `Missing these Bali sunsets 🌅🌊

Last summer was magic. The warm sand between my toes, the sound of the waves, and those golden hour moments that made time stand still.

Already dreaming of when I can go back ✨

#bali #balilife #balivibes #beachlife #travelgram #wanderlust #summervibes #goldenhour #beachbabe #islandlife #travelblogger #summermemories #balibabe #tropicalparadise #vacationmode #beachdays #sunsetlover #travelphotography`;

async function main() {
  console.log('🏝️  Starting Bali Beach photo generation...\n');
  
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    console.error('❌ REPLICATE_API_TOKEN not found in .env.local');
    process.exit(1);
  }
  
  const webhookUrl = process.env.MAKE_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('❌ MAKE_WEBHOOK_URL not found in .env.local');
    process.exit(1);
  }
  
  const replicate = new Replicate({ auth: apiToken });
  
  // Convert reference images to base64
  console.log('📷 Converting reference images to base64...');
  
  try {
    const base64Images = await Promise.all(
      FACE_REFERENCES.map(async (url, i) => {
        const b64 = await urlToBase64(url);
        console.log(`  ✅ Face ref ${i + 1}: converted`);
        return b64;
      })
    );
    
    console.log(`\n📝 Prompt: Bali beach, back view, bikini, trendy sunglasses`);
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
    
    let imagePath = null;
    let imageUrl = null;
    
    // Handle output
    if (typeof output === 'string') {
      imageUrl = output;
      console.log('\n✅ Got image URL directly');
    } else if (Array.isArray(output) && typeof output[0] === 'string') {
      imageUrl = output[0];
      console.log('\n✅ Got image URL from array');
    } else if (output && typeof output === 'object' && Symbol.asyncIterator in output) {
      // Handle binary stream
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
        
        // Save to file
        const outputDir = path.join(__dirname, '..', 'generated');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const filename = `bali-beach-${Date.now()}.jpg`;
        imagePath = path.join(outputDir, filename);
        fs.writeFileSync(imagePath, combined);
        
        console.log('\n✅ Image saved to:', imagePath);
      }
    }
    
    if (!imagePath && !imageUrl) {
      console.error('\n❌ Failed to get image output');
      process.exit(1);
    }
    
    // Upload to Cloudinary
    console.log('\n📤 Uploading to Cloudinary...');
    
    const uploadSource = imagePath || imageUrl;
    const uploadResult = await cloudinary.uploader.upload(uploadSource, {
      folder: 'mila-posts',
      public_id: `bali-beach-${Date.now()}`,
      resource_type: 'image',
    });
    
    const cloudinaryUrl = uploadResult.secure_url;
    console.log('✅ Uploaded to Cloudinary:', cloudinaryUrl);
    
    // Post to Instagram via Make.com
    console.log('\n📡 Sending to Make.com webhook → Buffer → Instagram...');
    console.log(`   Caption: ${CAPTION.slice(0, 50)}...`);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: cloudinaryUrl,
        caption: CAPTION,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Webhook error: ${response.status}`);
      console.error(errorText);
      process.exit(1);
    }
    
    const responseText = await response.text();
    console.log('\n🎉 SUCCESS! Post sent to Buffer via Make.com');
    console.log(`   Response: ${responseText || '(empty - OK)'}`);
    console.log('\n✨ Done! Check Buffer to see the scheduled post.');
    console.log(`\n📸 Image URL: ${cloudinaryUrl}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

main();



