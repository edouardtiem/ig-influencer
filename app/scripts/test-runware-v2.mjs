#!/usr/bin/env node
/**
 * Test Runware PuLID with higher idWeight for better face match
 */

const RUNWARE_API_KEY = process.env.RUNWARE_API_KEY || 'UfgIsSqSuWRbStHcHLzDGSOajXJ0Lyeg';
const RUNWARE_API_URL = 'https://api.runware.ai/v1';
const ELENA_FACE = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png';

async function test(name, idWeight, extraPrompt = '') {
  console.log(`\n🧪 Testing: ${name} (idWeight=${idWeight})...`);
  
  const prompt = `photo of woman wearing elegant black lace lingerie set, 
sitting seductively on velvet purple sofa, 
luxurious Parisian apartment with large windows,
soft natural morning light, intimate boudoir atmosphere,
professional photography, 8K resolution, Canon 85mm f/1.4,
feminine curves, confident sensual pose ${extraPrompt}`;

  const body = [{
    taskType: 'imageInference',
    taskUUID: crypto.randomUUID(),
    positivePrompt: prompt,
    negativePrompt: 'ugly, deformed, blurry, low quality, cartoon, anime, painting, sketch, 3d render',
    model: 'runware:100@1', // FLUX.1 Dev
    width: 1024,
    height: 1280,
    numberResults: 1,
    includeCost: true,
    puLID: { 
      inputImages: [ELENA_FACE], 
      idWeight: idWeight 
    }
  }];
  
  try {
    const res = await fetch(RUNWARE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNWARE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      const err = await res.text();
      console.log(`❌ ${name}:`, err.slice(0, 200));
      return null;
    }
    
    const data = await res.json();
    if (data.data?.[0]?.imageURL) {
      console.log(`✅ ${name}:`, data.data[0].imageURL);
      console.log(`   💰 Cost: $${data.data[0].cost}`);
      return data.data[0].imageURL;
    }
    
    console.log('Response:', JSON.stringify(data).slice(0, 300));
    return null;
  } catch (e) {
    console.log(`❌ ${name} error:`, e.message);
    return null;
  }
}

async function main() {
  console.log('🎨 Testing Runware PuLID with Higher idWeight\n');
  console.log('Goal: Find the idWeight that gives best Elena face match\n');
  
  const results = [];
  
  // Test higher idWeight values
  results.push(await test('idWeight 2.5', 2.5));
  results.push(await test('idWeight 3.0 (MAX)', 3.0));
  
  // Test with more specific face description in prompt
  results.push(await test('idWeight 2.0 + face description', 2.0, 
    ', bronde hair with golden highlights, honey brown eyes, beauty mark on right cheek'));
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  📊 RESULTS - Compare face similarity to Elena reference');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  results.forEach((url, i) => {
    if (url) console.log(`Result ${i + 1}: ${url}`);
  });
  
  console.log('\n💡 Higher idWeight = stronger face identity preservation');
  console.log('📸 Reference Elena: ' + ELENA_FACE);
}

main().catch(console.error);

