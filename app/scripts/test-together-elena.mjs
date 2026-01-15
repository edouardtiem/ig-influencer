#!/usr/bin/env node
/**
 * Test Together AI Flux 2 for Elena lingerie generation
 * Tests if NSFW content passes with disable_safety_checker
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

// ═══════════════════════════════════════════════════════════════
// CONFIG - Add your Together API key to .env.local
// ═══════════════════════════════════════════════════════════════

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;

if (!TOGETHER_API_KEY) {
  console.error('❌ TOGETHER_API_KEY not found in .env.local');
  console.log('\n📝 Add this line to your app/.env.local file:');
  console.log('TOGETHER_API_KEY=your_key_here');
  console.log('\n🔗 Get your key at: https://api.together.xyz/settings/api-keys');
  process.exit(1);
}

console.log('✅ TOGETHER_API_KEY found:', TOGETHER_API_KEY.slice(0, 15) + '...');

// ═══════════════════════════════════════════════════════════════
// ELENA PROMPT - Optimized for lingerie/intimate content
// ═══════════════════════════════════════════════════════════════

const ELENA_PROMPT = `photo of a 24 year old Italian woman with long bronde wavy hair with golden blonde balayage highlights, 
honey brown eyes, natural beauty mark on right cheekbone, feminine shapely figure,

wearing elegant black lace lingerie set, delicate straps,

sitting elegantly on velvet mauve sofa in luxurious Parisian apartment, 
soft natural window lighting from the side, intimate morning atmosphere,
warm golden hour tones,

photorealistic, professional boudoir photography, high fashion editorial style,
8K resolution, sharp focus, shallow depth of field,
shot on Canon EOS R5 with 85mm f/1.4 lens`;

// ═══════════════════════════════════════════════════════════════
// TOGETHER AI API
// ═══════════════════════════════════════════════════════════════

const TOGETHER_API_URL = 'https://api.together.xyz/v1/images/generations';

async function generateImage() {
  console.log('\n🎨 Generating image with Together AI Flux...');
  console.log('📝 Model: black-forest-labs/FLUX.1-dev');
  console.log('📐 Size: 1024x1280 (portrait)');
  console.log('🔓 Safety checker: DISABLED\n');
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'black-forest-labs/FLUX.1-dev',
        prompt: ELENA_PROMPT,
        width: 1024,
        height: 1280,
        steps: 28,
        n: 1,
        response_format: 'url',
        // Note: safety_checker disable may not work on all models
      }),
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ API error (${response.status}):`, error);
      
      if (response.status === 400 && error.includes('safety')) {
        console.log('\n⚠️  Content was blocked by safety filter.');
        console.log('💡 Together AI may be too restrictive for this content.');
        console.log('📋 Next step: Try RunPod with full freedom.');
      }
      
      process.exit(1);
    }
    
    const data = await response.json();
    
    console.log(`✅ Image generated in ${duration}s!`);
    
    // Extract image URL
    const imageUrl = data.data?.[0]?.url || data.data?.[0]?.b64_json;
    
    if (!imageUrl) {
      console.error('❌ No image URL in response');
      console.log('📊 Full response:', JSON.stringify(data, null, 2));
      process.exit(1);
    }
    
    console.log(`\n🖼️  IMAGE URL:`);
    console.log(imageUrl);
    console.log('\n💡 Open this URL in your browser to see the result!');
    console.log('⏰ Note: URL expires after a few hours\n');
    
    // Save URL to file for easy access
    const outputFile = path.join(__dirname, '../generated/together-test-result.txt');
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, `Generated: ${new Date().toISOString()}\n\nURL:\n${imageUrl}\n\nPrompt:\n${ELENA_PROMPT}`);
    console.log(`📁 Result saved to: ${outputFile}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════════════════════

console.log('═══════════════════════════════════════════════════════════════');
console.log('  🧪 TOGETHER AI TEST - Elena Lingerie Generation');
console.log('═══════════════════════════════════════════════════════════════');

generateImage();

