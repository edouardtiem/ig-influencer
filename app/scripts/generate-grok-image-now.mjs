#!/usr/bin/env node
/**
 * Generate an image with Grok NOW
 * Style: Elena at infinity pool, sunset, similar to reference
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

const XAI_API_KEY = process.env.XAI_API_KEY;

if (!XAI_API_KEY) {
  console.error('❌ XAI_API_KEY not found in .env.local');
  process.exit(1);
}

console.log('✅ XAI_API_KEY found:', XAI_API_KEY.slice(0, 15) + '...');

const XAI_API_URL = 'https://api.x.ai/v1';

// Prompt inspiré de l'image de référence (piscine infinity, coucher de soleil, bikini blanc, pose de dos)
const PROMPT = `Beautiful 24 year old Italian woman with long wavy bronde hair with golden blonde balayage highlights, honey brown eyes, natural beauty mark on right cheekbone, feminine shapely figure with large natural bust, narrow waist,

wearing white string bikini thong style,

kneeling on edge of infinity pool with her back to camera, looking to the side over her shoulder, one hand on her thigh,

golden hour sunset, warm orange and yellow hues, sun setting over the ocean in the background, sun reflected in the water, Mediterranean or Greek island setting, luxury resort atmosphere, palm trees in silhouette,

gold chain anklet on ankle visible,

photorealistic, professional photography, Instagram influencer style, high quality, 8K, cinematic lighting`;

async function generateImage() {
  console.log('\n🎨 Generating image with Grok...');
  console.log('📝 Prompt preview:', PROMPT.slice(0, 200) + '...\n');
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${XAI_API_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-2-image',
        prompt: PROMPT,
        n: 1,
        response_format: 'url',
      }),
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ API error (${response.status}):`, error);
      process.exit(1);
    }
    
    const data = await response.json();
    console.log('📊 Response:', JSON.stringify(data, null, 2).slice(0, 500));
    
    const imageUrl = data.data?.[0]?.url;
    
    if (!imageUrl) {
      console.error('❌ No image URL in response');
      process.exit(1);
    }
    
    console.log(`\n✅ Image generated in ${duration}s!`);
    console.log(`\n📸 IMAGE URL:\n${imageUrl}`);
    console.log('\n💡 Ouvre cette URL dans ton navigateur pour voir l\'image');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

generateImage();

