#!/usr/bin/env node
/**
 * Test Runware.ai PuLID for Elena face consistency
 * PuLID = Pure identity customization from facial reference
 * 
 * Docs: https://runware.ai/docs/en/image-inference/api-reference
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

const RUNWARE_API_KEY = process.env.RUNWARE_API_KEY;

if (!RUNWARE_API_KEY) {
  console.error('❌ RUNWARE_API_KEY not found in .env.local');
  console.log('\n📝 Get your API key at: https://runware.ai/');
  console.log('Then add to .env.local: RUNWARE_API_KEY=your_key_here\n');
  process.exit(1);
}

console.log('✅ RUNWARE_API_KEY found:', RUNWARE_API_KEY.slice(0, 15) + '...\n');

const RUNWARE_API_URL = 'https://api.runware.ai/v1';

// Elena reference
const ELENA_FACE = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png';

// ═══════════════════════════════════════════════════════════════
// TEST PuLID (Pure Identity)
// ═══════════════════════════════════════════════════════════════

async function testPuLID() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🧪 TEST: Runware.ai PuLID (Face Identity Preservation)');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('📸 Face reference:', ELENA_FACE.slice(-50));
  console.log('🔓 Safety: OFF (default)\n');
  
  const requestBody = [
    {
      taskType: "imageInference",
      taskUUID: crypto.randomUUID(),
      positivePrompt: "photo of woman wearing elegant black lace lingerie, sitting on velvet purple sofa, luxurious Parisian apartment, soft morning light, professional boudoir photography, 8K, feminine curves, intimate atmosphere",
      negativePrompt: "ugly, deformed, blurry, low quality, cartoon, anime",
      model: "runware:100@1", // FLUX.1 Dev
      width: 1024,
      height: 1280,
      numberResults: 1,
      includeCost: true, // See the cost!
      puLID: {
        inputImages: [ELENA_FACE],
        idWeight: 1.2, // 0-3, higher = stronger face match
      },
      // Safety is OFF by default per docs
    }
  ];
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(RUNWARE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNWARE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (!response.ok) {
      const error = await response.text();
      console.log(`❌ API Error (${response.status}):`, error);
      return null;
    }
    
    const data = await response.json();
    console.log(`✅ Generated in ${duration}s`);
    
    if (data.data && data.data[0]) {
      const result = data.data[0];
      console.log('🖼️  URL:', result.imageURL);
      if (result.cost) {
        console.log('💰 Cost:', result.cost);
      }
      return result;
    } else {
      console.log('📊 Response:', JSON.stringify(data, null, 2).slice(0, 500));
      return data;
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// TEST with different idWeight values
// ═══════════════════════════════════════════════════════════════

async function testIdWeights() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  🧪 TEST: Different idWeight values (0.8, 1.5, 2.0)');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const weights = [0.8, 1.5, 2.0];
  const results = [];
  
  for (const weight of weights) {
    console.log(`\nTesting idWeight=${weight}...`);
    
    const requestBody = [
      {
        taskType: "imageInference",
        taskUUID: crypto.randomUUID(),
        positivePrompt: "photo of woman wearing elegant black lace lingerie, sitting on velvet purple sofa, Parisian apartment, morning light, boudoir photography, 8K",
        model: "runware:100@1",
        width: 1024,
        height: 1280,
        numberResults: 1,
        includeCost: true,
        puLID: {
          inputImages: [ELENA_FACE],
          idWeight: weight,
        },
      }
    ];
    
    try {
      const response = await fetch(RUNWARE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RUNWARE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data[0]) {
          console.log(`✅ idWeight=${weight}:`, data.data[0].imageURL);
          results.push({ weight, url: data.data[0].imageURL, cost: data.data[0].cost });
        }
      } else {
        const error = await response.text();
        console.log(`❌ idWeight=${weight} failed:`, error.slice(0, 100));
      }
    } catch (e) {
      console.log(`❌ idWeight=${weight} error:`, e.message);
    }
  }
  
  return results;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('🎨 Testing Runware.ai PuLID for Elena Face Consistency\n');
  console.log('PuLID = Pure identity customization (best for face preservation)\n');
  
  const result1 = await testPuLID();
  
  if (result1) {
    // If first test works, test different weights
    const weightResults = await testIdWeights();
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  📊 SUMMARY - Compare all URLs');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    if (result1.imageURL) console.log('Default (1.2):', result1.imageURL);
    for (const r of weightResults) {
      console.log(`idWeight=${r.weight}: ${r.url} (cost: ${r.cost || 'N/A'})`);
    }
  }
  
  console.log('\n💡 Open URLs and compare which idWeight gives best Elena face match!');
}

main().catch(console.error);

