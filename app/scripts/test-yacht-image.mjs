#!/usr/bin/env node
/**
 * Test: Generate Kling-Ready Image for Yacht Scene
 * Step 3 only - Nano Banana Pro generation
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import Replicate from 'replicate';
import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Elena references from scheduled-post.mjs
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
  console.log('🖼️  TEST: Yacht Kling-Ready Image Generation\n');
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  // Load face refs as base64
  console.log('Loading Elena references...');
  const base64Refs = await Promise.all([
    urlToBase64(ELENA_REFS.face),
    urlToBase64(ELENA_REFS.body),
  ]);
  console.log(`✅ Loaded ${base64Refs.length} references\n`);
  
  // Prompt adapted from working scripts
  const prompt = `Professional travel lifestyle photograph.

SCENE: Luxury yacht deck at Mediterranean golden hour sunset. Warm orange-pink sky, calm glittering sea, distant coastline mountains.

SUBJECT matching reference images EXACTLY:
- Same soft round pleasant face as Image 1
- Same bronde hair with visible golden blonde balayage highlights
- Same shapely feminine figure as Image 2
- Wearing elegant black two-piece swimwear with gold hardware accents
- Gold jewelry: layered chain necklaces with medallion pendant, chunky gold bracelet on wrist
- Holding champagne flute elegantly

POSE: Standing at yacht railing, 3/4 angle to camera, one hand on railing, natural relaxed pose. Looking toward horizon with soft confident expression.

FRAMING: 9:16 vertical portrait format, full body from knees up, subject centered, space above head for cropping.

STYLE: High-end Instagram travel content 2026, iPhone 15 Pro quality, warm golden hour lighting, luxury lifestyle aesthetic.

CRITICAL: Single image only - NO collages, NO grids, NO multiple panels.`;

  console.log('Calling Nano Banana Pro...');
  console.log('Prompt:', prompt.substring(0, 200) + '...\n');
  
  try {
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
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    
    let uploadResult;
    if (imageUrl) {
      console.log('Uploading URL to Cloudinary...');
      uploadResult = await cloudinary.uploader.upload(imageUrl, {
        folder: 'elena-reels',
        public_id: `kling-ready-yacht-${Date.now()}`,
      });
    } else if (imageBuffer) {
      console.log('Uploading buffer to Cloudinary...');
      const base64Upload = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
      uploadResult = await cloudinary.uploader.upload(base64Upload, {
        folder: 'elena-reels',
        public_id: `kling-ready-yacht-${Date.now()}`,
      });
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 SUCCESS!');
    console.log('='.repeat(50));
    console.log(`\n📸 Cloudinary URL:\n${uploadResult.secure_url}\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('E006')) {
      console.log('\n⚠️  Safety filter triggered - prompt needs adjustment');
    }
    throw error;
  }
}

main();
