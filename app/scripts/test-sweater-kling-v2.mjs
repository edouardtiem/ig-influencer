#!/usr/bin/env node
/**
 * Kling V2: START from FRONT, TURN to show BACK
 * Avoid face invention by ending on back view
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import Replicate from 'replicate';
import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const ELENA_REFS = {
  face: 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png',
  body: 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png',
};

async function urlToBase64(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;
}

async function main() {
  console.log('🎬 KLING V2: Start FRONT → Turn → End BACK\n');
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  // ========================================
  // STEP 1: Generate FRONT image (face visible)
  // ========================================
  console.log('📸 STEP 1: Generating FRONT image...\n');
  
  const base64Refs = await Promise.all([
    urlToBase64(ELENA_REFS.face),
    urlToBase64(ELENA_REFS.body),
  ]);

  const imagePrompt = `Professional lifestyle photograph in Parisian apartment.

SCENE: Elegant Parisian apartment with large French windows, view of Haussmannian rooftops. Soft morning natural light. Herringbone parquet floor, mauve velvet sofa.

SUBJECT (FRONT facing, will turn away):
- Young woman matching reference images EXACTLY
- Same soft round face as Image 1
- Same shapely figure as Image 2
- FACING CAMERA, 3/4 angle
- Full body from knees up
- Long bronde wavy hair with golden balayage
- Wearing oversized cream knit sweater (off-shoulder, cozy)
- Black underwear visible below sweater hem
- Gold chunky bracelet on wrist
- Layered gold necklaces with medallion
- Standing near window, one hand touching window frame
- Soft confident expression, looking at camera

FRAMING: 9:16 vertical, full body from knees up, room to move, window behind her.

STYLE: Intimate Parisian morning aesthetic, soft natural light, cozy lifestyle vibe.

SINGLE IMAGE ONLY - no collages.`;

  const imageOutput = await replicate.run("google/nano-banana-pro", {
    input: {
      prompt: imagePrompt,
      image_input: base64Refs,
      aspect_ratio: "9:16",
      output_format: "jpg",
      safety_filter_level: "block_only_high"
    }
  });

  // Handle output
  let imageBuffer;
  let imageUrl;
  
  if (typeof imageOutput === 'string') {
    imageUrl = imageOutput;
  } else if (Array.isArray(imageOutput) && typeof imageOutput[0] === 'string') {
    imageUrl = imageOutput[0];
  } else if (imageOutput && typeof imageOutput === 'object' && Symbol.asyncIterator in imageOutput) {
    const chunks = [];
    for await (const chunk of imageOutput) {
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
  if (imageUrl) {
    uploadResult = await cloudinary.uploader.upload(imageUrl, {
      folder: 'elena-reels',
      public_id: `kling-sweater-front-${Date.now()}`,
    });
  } else if (imageBuffer) {
    const base64Upload = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
    uploadResult = await cloudinary.uploader.upload(base64Upload, {
      folder: 'elena-reels',
      public_id: `kling-sweater-front-${Date.now()}`,
    });
  }
  
  console.log(`✅ FRONT image: ${uploadResult.secure_url}\n`);

  // ========================================
  // STEP 2: Generate Kling video (turn to back)
  // ========================================
  console.log('🎬 STEP 2: Generating Kling video (turn to show back)...');
  console.log('⏳ ~2-3 minutes...\n');

  const videoPrompt = `SETTING: Elegant Parisian apartment, soft morning light through large French windows, view of Paris rooftops.

ACTION (10 seconds) - REAL-TIME SPEED, NOT SLOW MOTION:
- She looks at camera briefly with soft smile (2 seconds)
- Turns her body away from camera smoothly
- Rotates 180 degrees to face the window
- Hair swings naturally with the turn
- Ends facing AWAY from camera, looking out at Paris
- Final pose: back to camera, contemplating the view

CRITICAL - SPEED:
- NORMAL HUMAN SPEED - NOT slow motion
- Real-time movement like iPhone video
- Natural quick turn, not cinematic slow

MOVEMENTS:
- Quick natural body rotation
- Hair flowing with movement
- Sweater fabric shifting
- Weight transfer between feet

CAMERA: Completely static, no movement

END STATE: She faces AWAY from camera, we see her back and the Paris view.`;

  const videoOutput = await replicate.run("kwaivgi/kling-v2.5-turbo-pro", {
    input: {
      prompt: videoPrompt,
      image: uploadResult.secure_url,
      duration: 10,
      aspect_ratio: "9:16"
    }
  });

  console.log('='.repeat(60));
  console.log('🎉 DONE!');
  console.log('='.repeat(60));
  console.log(`\n📸 Start Image (FRONT): ${uploadResult.secure_url}`);
  console.log(`\n📹 Video (turns to BACK): ${videoOutput}\n`);
}

main().catch(console.error);
