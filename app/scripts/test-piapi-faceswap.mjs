#!/usr/bin/env node
/**
 * Test PiAPI Face Swap workflow
 * 
 * Step 1: Generate body image with Together AI (NSFW lingerie)
 * Step 2: Swap face with Elena reference using PiAPI
 * 
 * Cost: ~$0.015 per face swap
 * Docs: https://piapi.ai/docs/multi-face-swap/create-task
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

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
const PIAPI_KEY = process.env.PIAPI_KEY;

if (!TOGETHER_API_KEY) {
  console.error('❌ TOGETHER_API_KEY not found');
  process.exit(1);
}

if (!PIAPI_KEY) {
  console.error('❌ PIAPI_KEY not found in .env.local');
  console.log('\n📝 Get your API key at: https://piapi.ai');
  console.log('Then add to .env.local: PIAPI_KEY=your_key_here\n');
  process.exit(1);
}

console.log('✅ TOGETHER_API_KEY found');
console.log('✅ PIAPI_KEY found:', PIAPI_KEY.slice(0, 15) + '...\n');

// Elena face reference
const ELENA_FACE = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png';

// ═══════════════════════════════════════════════════════════════
// STEP 1: Generate body image with Together AI
// ═══════════════════════════════════════════════════════════════

async function generateBodyImage() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  STEP 1: Generate body image with Together AI');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const prompt = `photo of a beautiful 24 year old woman with long bronde wavy hair,
wearing elegant black lace lingerie set with thin straps,
sitting seductively on velvet purple sofa,
luxurious Parisian apartment with large windows,
soft morning light, intimate boudoir atmosphere,
professional photography, 8K, Canon 85mm f/1.4,
feminine curves, confident pose`;

  console.log('📝 Generating body image...\n');
  
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
  
  console.log('✅ Body image generated!');
  console.log('🖼️  URL:', imageUrl);
  
  return imageUrl;
}

// ═══════════════════════════════════════════════════════════════
// STEP 2: Swap face with PiAPI
// ═══════════════════════════════════════════════════════════════

async function swapFace(targetImageUrl, sourceFaceUrl) {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  STEP 2: Swap face with PiAPI');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('📸 Target (body):', targetImageUrl.slice(0, 60) + '...');
  console.log('📸 Source (Elena face):', sourceFaceUrl.slice(-50));
  console.log('💰 Cost: ~$0.015\n');
  
  // Create face swap task
  const createResponse = await fetch('https://api.piapi.ai/api/v1/task', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PIAPI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'face-swap',
      task_type: 'face-swap',
      input: {
        target_image: targetImageUrl,
        swap_image: sourceFaceUrl,
      },
    }),
  });
  
  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`PiAPI create task error: ${error}`);
  }
  
  const createData = await createResponse.json();
  console.log('📋 Task created:', createData.data?.task_id || createData);
  
  const taskId = createData.data?.task_id;
  if (!taskId) {
    console.log('Full response:', JSON.stringify(createData, null, 2));
    throw new Error('No task_id in response');
  }
  
  // Poll for result
  console.log('⏳ Waiting for face swap...\n');
  
  let result = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000)); // Wait 2s
    
    const statusResponse = await fetch(`https://api.piapi.ai/api/v1/task/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${PIAPI_KEY}`,
      },
    });
    
    if (!statusResponse.ok) continue;
    
    const statusData = await statusResponse.json();
    const status = statusData.data?.status;
    
    process.stdout.write(`\r  Status: ${status}...`);
    
    if (status === 'completed') {
      result = statusData.data;
      break;
    } else if (status === 'failed') {
      throw new Error('Face swap failed: ' + JSON.stringify(statusData));
    }
  }
  
  if (!result) {
    throw new Error('Timeout waiting for face swap');
  }
  
  console.log('\n\n✅ Face swap completed!');
  console.log('🖼️  Result URL:', result.output?.image_url || result.output);
  
  return result;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('🎨 PiAPI Face Swap Workflow Test\n');
  console.log('Workflow: Together AI (body) → PiAPI (swap Elena face)\n');
  
  try {
    // Step 1: Generate body
    const bodyImageUrl = await generateBodyImage();
    
    // Step 2: Swap face
    const result = await swapFace(bodyImageUrl, ELENA_FACE);
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  📊 FINAL RESULTS');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log('Original (body only):', bodyImageUrl);
    console.log('Final (with Elena face):', result.output?.image_url || result.output);
    
    console.log('\n💡 Compare both URLs to see the face swap quality!');
    console.log('💰 Total cost: ~$0.002 (Together) + $0.015 (PiAPI) = ~$0.017');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

main();

