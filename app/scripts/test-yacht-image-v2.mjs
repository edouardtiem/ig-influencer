#!/usr/bin/env node
/**
 * Generate 2 Kling-Ready Images: Back View + Front View
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import Replicate from 'replicate';
import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Elena references
const ELENA_REFS = {
  face: 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png',
  body: 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png',
  back: 'https://res.cloudinary.com/dily60mr0/image/upload/v1767562505/replicate-prediction-bjnvs97bqxrmy0cvhbpa8cx5f8_daohqh.png',
};

async function urlToBase64(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;
}

async function generateImage(replicate, base64Refs, prompt, name) {
  console.log(`\n🖼️  Generating: ${name}...`);
  
  const output = await replicate.run("google/nano-banana-pro", {
    input: {
      prompt: prompt,
      image_input: base64Refs,
      aspect_ratio: "9:16",
      output_format: "jpg",
      safety_filter_level: "block_only_high"
    }
  });

  // Handle output
  let imageBuffer;
  let imageUrl;
  
  if (typeof output === 'string') {
    imageUrl = output;
  } else if (Array.isArray(output) && typeof output[0] === 'string') {
    imageUrl = output[0];
  } else if (output && typeof output === 'object' && Symbol.asyncIterator in output) {
    const chunks = [];
    for await (const chunk of output) {
      if (chunk instanceof Uint8Array) {
        chunks.push(chunk);
      } else if (typeof chunk === 'string') {
        imageUrl = chunk;
        break;
      }
    }
    if (chunks.length > 0) {
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      imageBuffer = Buffer.from(combined);
    }
  }
  
  // Upload to Cloudinary
  let uploadResult;
  const publicId = `kling-ready-yacht-${name}-${Date.now()}`;
  
  if (imageUrl) {
    uploadResult = await cloudinary.uploader.upload(imageUrl, {
      folder: 'elena-reels',
      public_id: publicId,
    });
  } else if (imageBuffer) {
    const base64Upload = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
    uploadResult = await cloudinary.uploader.upload(base64Upload, {
      folder: 'elena-reels',
      public_id: publicId,
    });
  }
  
  console.log(`✅ ${name}: ${uploadResult.secure_url}`);
  return uploadResult.secure_url;
}

async function main() {
  console.log('🎬 YACHT KLING-READY: Back View + Front View\n');
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  // Load refs
  console.log('Loading Elena references...');
  const base64Refs = await Promise.all([
    urlToBase64(ELENA_REFS.face),
    urlToBase64(ELENA_REFS.body),
    urlToBase64(ELENA_REFS.back),
  ]);
  console.log(`✅ Loaded ${base64Refs.length} references`);

  // ============================================
  // VERSION 1: BACK VIEW (full body, from behind)
  // ============================================
  const promptBack = `Professional lifestyle photograph on luxury yacht.

SCENE: Mediterranean yacht deck at golden hour sunset. Warm orange-pink sky, glittering calm sea, distant mountains.

SUBJECT (from BEHIND - back view):
- Young woman matching reference images
- Shot from BEHIND showing her BACK
- Full body visible from head to feet
- Long bronde wavy hair flowing down her back
- Wearing elegant black bikini with gold hardware
- Gold chunky bracelet visible on wrist
- Standing at yacht railing, weight on one hip
- Looking out at the sunset horizon

CAMERA ANGLE: Behind her, slightly below eye level, capturing full body silhouette against sunset.

FRAMING: 9:16 vertical, full body from behind, her figure silhouetted against golden sunset sky and sea.

STYLE: Cinematic Instagram Reel aesthetic, warm golden backlight, luxury travel vibe.

SINGLE IMAGE ONLY - no collages.`;

  // ============================================
  // VERSION 2: FRONT VIEW (face + upper body)
  // ============================================
  const promptFront = `Professional lifestyle photograph on luxury yacht.

SCENE: Mediterranean yacht deck at golden hour sunset. Warm orange-pink sky reflected on calm sea.

SUBJECT (FRONT facing camera):
- Young woman matching reference images EXACTLY
- Same soft round face as Image 1
- Same shapely figure as Image 2
- FACING CAMERA directly, eye contact
- Shot from waist up (upper body focus)
- Long bronde wavy hair with golden balayage
- Wearing elegant black bikini top with gold hardware
- Layered gold necklaces with medallion pendant visible
- Holding champagne glass near chest level
- Confident subtle smile, warm expression

CAMERA ANGLE: Front-facing, slightly low angle, capturing face and upper body.

FRAMING: 9:16 vertical, from waist up, face and chest prominent, sunset behind her.

STYLE: High-end Instagram content, golden hour glow on skin, luxury lifestyle aesthetic.

SINGLE IMAGE ONLY - no collages.`;

  try {
    const backUrl = await generateImage(replicate, base64Refs, promptBack, 'back');
    const frontUrl = await generateImage(replicate, base64Refs, promptFront, 'front');
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 DONE! Choose your preferred angle for Kling:');
    console.log('='.repeat(60));
    console.log(`\n🍑 BACK VIEW (full body from behind):\n${backUrl}`);
    console.log(`\n👀 FRONT VIEW (face + upper body):\n${frontUrl}`);
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

main();
