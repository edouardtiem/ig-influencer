#!/usr/bin/env node
/**
 * Test Replicate Face Swap workflow
 * 
 * Step 1: Generate NSFW body image with Together AI (quality body/lingerie)
 * Step 2: Swap face with Elena reference using Replicate lucataco/faceswap
 * 
 * Based on mila-aitana-method workflow
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Replicate from 'replicate';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

if (!TOGETHER_API_KEY) {
  console.error('❌ TOGETHER_API_KEY not found');
  process.exit(1);
}

if (!REPLICATE_API_TOKEN) {
  console.error('❌ REPLICATE_API_TOKEN not found');
  process.exit(1);
}

console.log('✅ TOGETHER_API_KEY found');
console.log('✅ REPLICATE_API_TOKEN found\n');

const replicate = new Replicate({ auth: REPLICATE_API_TOKEN });

// Elena face reference
const ELENA_FACE = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png';

// Output directory
const OUTPUT_DIR = path.join(__dirname, '../generated/elena-faceswap-test');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ═══════════════════════════════════════════════════════════════
// STEP 1: Generate body image with Together AI
// ═══════════════════════════════════════════════════════════════

async function generateBodyImage() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  STEP 1: Generate body image with Together AI');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const prompt = `photo of a beautiful 24 year old woman with long bronde wavy hair with golden highlights,
honey brown eyes, beauty mark on right cheek,
wearing elegant black lace lingerie set with delicate straps,
sitting seductively on velvet purple sofa,
luxurious Parisian apartment with large windows and warm light,
soft morning light creating intimate atmosphere,
professional boudoir photography, 8K resolution,
Canon EOS R5 85mm f/1.4 lens, shallow depth of field,
feminine shapely figure, confident sensual pose,
warm golden tones, high fashion editorial quality`;

  console.log('📝 Generating body image with Together AI FLUX...\n');
  
  const startTime = Date.now();
  
  const response = await fetch('https://api.together.xyz/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOGETHER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'black-forest-labs/FLUX.1-dev',
      prompt: prompt,
      width: 1024,
      height: 1280,
      steps: 28,
      n: 1,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Together AI error: ${error}`);
  }
  
  const data = await response.json();
  const imageUrl = data.data[0].url;
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ Body image generated in ${duration}s`);
  console.log('🖼️  Base URL:', imageUrl);
  
  return imageUrl;
}

// ═══════════════════════════════════════════════════════════════
// STEP 2: Face Swap with Replicate
// ═══════════════════════════════════════════════════════════════

async function faceSwap(targetImageUrl, sourceFaceUrl) {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  STEP 2: Face Swap with Replicate');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('📸 Target (body):', targetImageUrl.slice(0, 60) + '...');
  console.log('📸 Source (Elena face):', sourceFaceUrl.slice(-50));
  
  const startTime = Date.now();
  
  // Try different face swap models
  const models = [
    {
      name: 'lucataco/faceswap',
      input: {
        target_image: targetImageUrl,
        swap_image: sourceFaceUrl,
      }
    },
    {
      name: 'codeplugtech/face-swap',
      input: {
        target_image: targetImageUrl,
        source_image: sourceFaceUrl,
      }
    },
    {
      name: 'omniedgeio/face-swap',
      input: {
        target_image: targetImageUrl,
        source_image: sourceFaceUrl,
      }
    }
  ];
  
  for (const model of models) {
    console.log(`\n🔄 Trying ${model.name}...`);
    
    try {
      const output = await replicate.run(model.name, { input: model.input });
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ Face swap completed in ${duration}s with ${model.name}`);
      
      const resultUrl = Array.isArray(output) ? output[0] : output;
      console.log('🖼️  Result URL:', resultUrl);
      
      return { url: resultUrl, model: model.name };
      
    } catch (e) {
      console.log(`❌ ${model.name} failed:`, e.message.slice(0, 100));
    }
  }
  
  throw new Error('All face swap models failed');
}

// ═══════════════════════════════════════════════════════════════
// DOWNLOAD IMAGE
// ═══════════════════════════════════════════════════════════════

async function downloadImage(url, filename) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, Buffer.from(buffer));
  console.log(`💾 Saved: ${filepath}`);
  return filepath;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('🎨 Elena Face Swap Workflow Test\n');
  console.log('Workflow: Together AI (body) → Replicate (face swap)\n');
  console.log('📸 Elena reference:', ELENA_FACE.slice(-50));
  console.log('📁 Output:', OUTPUT_DIR);
  console.log('');
  
  try {
    // Step 1: Generate body
    const bodyImageUrl = await generateBodyImage();
    
    // Save base image
    const timestamp = Date.now();
    await downloadImage(bodyImageUrl, `base-lingerie-${timestamp}.jpg`);
    
    // Step 2: Face swap
    const result = await faceSwap(bodyImageUrl, ELENA_FACE);
    
    // Save final image
    await downloadImage(result.url, `final-elena-${timestamp}.jpg`);
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  📊 FINAL RESULTS');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log('🎯 Base (body):', bodyImageUrl);
    console.log('🎯 Final (Elena face):', result.url);
    console.log('🔧 Model used:', result.model);
    
    console.log('\n💡 Compare both URLs to see the face swap quality!');
    console.log('📁 Images saved to:', OUTPUT_DIR);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

main();

