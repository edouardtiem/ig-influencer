#!/usr/bin/env node
/**
 * Test Grok image generation with Cloudinary reference
 * 
 * Usage:
 *   node scripts/test-grok-image-reference.mjs <reference_url> [variation_prompt]
 * 
 * Example:
 *   node scripts/test-grok-image-reference.mjs "https://res.cloudinary.com/..." "different pose, facing camera"
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
const REFERENCE_URL = process.argv[2];
const VARIATION_PROMPT = process.argv[3];

if (!XAI_API_KEY) {
  console.error('❌ Missing XAI_API_KEY in .env.local');
  process.exit(1);
}

if (!REFERENCE_URL) {
  console.error('❌ Usage: node scripts/test-grok-image-reference.mjs <reference_url> [variation_prompt]');
  console.error('   Example: node scripts/test-grok-image-reference.mjs "https://res.cloudinary.com/..." "different pose"');
  process.exit(1);
}

const XAI_API_URL = 'https://api.x.ai/v1';

async function generateWithReference() {
  console.log('🎨 Testing Grok image generation with reference...\n');
  console.log(`📸 Reference: ${REFERENCE_URL}`);
  if (VARIATION_PROMPT) {
    console.log(`📝 Variation: ${VARIATION_PROMPT}`);
  }
  console.log('');
  
  const basePrompt = `Beautiful 24 year old Italian woman, long bronde hair with golden highlights, honey brown eyes, natural beauty mark on right cheek, feminine curvy figure, gold jewelry`;
  
  const prompt = VARIATION_PROMPT
    ? `${basePrompt}, ${VARIATION_PROMPT}, photorealistic, high quality, professional photography, Instagram influencer style`
    : `${basePrompt}, similar pose and setting as reference, photorealistic, high quality, professional photography, Instagram influencer style`;
  
  // Enhanced prompt with reference description
  const enhancedPrompt = `${prompt}\n\nStyle reference: Match the composition, lighting, mood, and aesthetic quality of the reference image. Maintain similar pose, setting atmosphere, and visual style.`;
  
  console.log('📤 Sending request to Grok API...');
  
  try {
    const response = await fetch(`${XAI_API_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-2-image',
        prompt: enhancedPrompt,
        n: 1,
        size: '1024x1024',
        response_format: 'url',
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ API error:', error);
      process.exit(1);
    }
    
    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;
    
    if (!imageUrl) {
      console.error('❌ No image URL in response:', data);
      process.exit(1);
    }
    
    console.log('\n✅ Image generated successfully!');
    console.log(`\n📸 Image URL: ${imageUrl}`);
    console.log('\n💡 Copy this URL to test in browser or use it as a new reference');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

generateWithReference();

