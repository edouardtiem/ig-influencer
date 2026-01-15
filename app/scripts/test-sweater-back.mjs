#!/usr/bin/env node
/**
 * Generate BACK VIEW: Oversized Sweater Paris Apartment
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
  back: 'https://res.cloudinary.com/dily60mr0/image/upload/v1767562505/replicate-prediction-bjnvs97bqxrmy0cvhbpa8cx5f8_daohqh.png',
};

async function urlToBase64(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;
}

async function main() {
  console.log('🖼️  BACK VIEW: Oversized Sweater Paris Apartment\n');
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  console.log('Loading Elena references...');
  const base64Refs = await Promise.all([
    urlToBase64(ELENA_REFS.face),
    urlToBase64(ELENA_REFS.body),
    urlToBase64(ELENA_REFS.back),
  ]);
  console.log(`✅ Loaded ${base64Refs.length} references\n`);

  const prompt = `Professional lifestyle photograph in Parisian apartment.

SCENE: Elegant Parisian apartment with large French windows, view of Haussmannian rooftops. Soft morning natural light flooding in. Herringbone parquet floor, mauve velvet sofa visible.

SUBJECT (from BEHIND - back view):
- Young woman matching reference images
- Shot from BEHIND showing her BACK
- Full body visible from head to feet
- Long bronde wavy hair flowing down her back
- Wearing oversized cream knit sweater (off-shoulder, cozy)
- Black underwear visible below sweater hem
- Gold chunky bracelet on wrist
- Standing at the window, looking out at Paris rooftops
- Weight on one hip, relaxed morning pose
- One hand touching the window frame

CAMERA ANGLE: Behind her, capturing full body silhouette against the bright window light.

FRAMING: 9:16 vertical, full body from behind, figure silhouetted against Paris morning light through windows.

STYLE: Intimate Parisian morning aesthetic, soft natural backlight, cozy lifestyle vibe, iPhone quality.

SINGLE IMAGE ONLY - no collages.`;

  console.log('Calling Nano Banana Pro...');
  
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
  
  console.log('✅ Image generated!');
  
  // Upload to Cloudinary
  let uploadResult;
  const publicId = `kling-ready-sweater-back-${Date.now()}`;
  
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
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 BACK VIEW READY!');
  console.log('='.repeat(60));
  console.log(`\n🍑 Image URL:\n${uploadResult.secure_url}\n`);
}

main().catch(console.error);
