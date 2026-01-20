/**
 * Simple NanoBananaPro test - diagnose if API works
 */

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const ELENA_BODY_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png';

async function urlToBase64(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const contentType = response.headers.get('content-type') || 'image/png';
  return `data:${contentType};base64,${base64}`;
}

async function main() {
  console.log('🧪 Simple NanoBananaPro Test\n');
  
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('❌ No API token');
    process.exit(1);
  }
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  console.log('📥 Loading reference...');
  const bodyBase64 = await urlToBase64(ELENA_BODY_REF);
  console.log('✅ Reference loaded\n');
  
  // Very simple, safe prompt
  const prompt = `Instagram lifestyle photo, soft morning light,

Young woman standing by window in a Parisian apartment bedroom.
She wears a cream silk robe, elegant loungewear.
Back partially to camera, looking out the window at the city.

Soft golden morning light through sheer curtains.
Intimate romantic atmosphere, premium lifestyle aesthetic.

--no tattoos`;
  
  console.log('📸 Calling NanoBananaPro with simple prompt...');
  console.log('Prompt preview:', prompt.substring(0, 100) + '...\n');
  
  const startTime = Date.now();
  
  try {
    const output = await replicate.run("google/nano-banana-pro", {
      input: {
        prompt: prompt,
        image_input: [bodyBase64],
        aspect_ratio: "4:5",
        output_format: "jpg",
        safety_filter_level: "block_only_high",
      }
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`⏱️  Completed in ${duration}s`);
    console.log('Output type:', typeof output);
    console.log('Output:', output);
    
    if (typeof output === 'string') {
      console.log('\n✅ SUCCESS! Image URL:', output);
    } else if (Array.isArray(output)) {
      console.log('\n✅ SUCCESS! Array output:', output[0]);
    } else {
      console.log('\n⚠️ Unknown output format');
    }
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`⏱️  Failed after ${duration}s`);
    console.error('❌ Error:', error.message);
  }
}

main().catch(console.error);
