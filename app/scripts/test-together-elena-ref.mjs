#!/usr/bin/env node
/**
 * Test Together AI Flux with Elena reference images
 * Tests if image reference works for character consistency
 */

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY || 'tgp_v1_78d8JAHhygnPGlayhbNKX86PZQYedEtWDwZH0uO1lEs';
const TOGETHER_API_URL = 'https://api.together.xyz/v1/images/generations';

// Elena Cloudinary references
const ELENA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png';
const ELENA_BODY_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png';

// Prompt with reference instruction
const ELENA_PROMPT = `Based on the reference image provided, generate a photo of this exact same woman:

Same face: soft round pleasant face, honey brown warm almond-shaped eyes, 
naturally full lips, small beauty mark on right cheekbone,
bronde hair with golden blonde balayage highlights, long beach waves,

Same body: feminine shapely figure, large natural bust, narrow waist, wide hips,

New scene: wearing elegant black lace lingerie set,
sitting on velvet sofa in luxurious Parisian apartment,
soft natural window lighting, intimate morning atmosphere,

photorealistic, professional boudoir photography, 8K resolution,
shot on Canon EOS R5 85mm f/1.4, shallow depth of field`;

async function testWithImageUrl() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🧪 TEST 1: Together AI with image_url parameter');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('📸 Reference image:', ELENA_FACE_REF.slice(0, 60) + '...\n');
  
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
        image_url: ELENA_FACE_REF, // Reference image
      }),
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (!response.ok) {
      const error = await response.text();
      console.log(`❌ Test 1 failed (${response.status}):`, error);
      return false;
    }
    
    const data = await response.json();
    console.log(`✅ Test 1 PASSED in ${duration}s!`);
    console.log('🖼️  URL:', data.data[0].url);
    return true;
    
  } catch (error) {
    console.log('❌ Test 1 error:', error.message);
    return false;
  }
}

async function testWithImageUrls() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  🧪 TEST 2: Together AI with image_urls (multiple refs)');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('📸 Face ref:', ELENA_FACE_REF.slice(0, 50) + '...');
  console.log('📸 Body ref:', ELENA_BODY_REF.slice(0, 50) + '...\n');
  
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
        image_urls: [ELENA_FACE_REF, ELENA_BODY_REF], // Multiple references
      }),
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (!response.ok) {
      const error = await response.text();
      console.log(`❌ Test 2 failed (${response.status}):`, error);
      return false;
    }
    
    const data = await response.json();
    console.log(`✅ Test 2 PASSED in ${duration}s!`);
    console.log('🖼️  URL:', data.data[0].url);
    return true;
    
  } catch (error) {
    console.log('❌ Test 2 error:', error.message);
    return false;
  }
}

async function testFlux2Pro() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  🧪 TEST 3: Flux 2 Pro with multi-reference (if available)');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'black-forest-labs/FLUX.2-pro', // Flux 2 with multi-ref
        prompt: ELENA_PROMPT,
        width: 1024,
        height: 1280,
        steps: 28,
        n: 1,
        image_url: ELENA_FACE_REF,
      }),
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (!response.ok) {
      const error = await response.text();
      console.log(`❌ Test 3 failed (${response.status}):`, error.slice(0, 200));
      console.log('💡 Flux 2 Pro may not be available on your plan');
      return false;
    }
    
    const data = await response.json();
    console.log(`✅ Test 3 PASSED in ${duration}s!`);
    console.log('🖼️  URL:', data.data[0].url);
    return true;
    
  } catch (error) {
    console.log('❌ Test 3 error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🎨 Testing Together AI with Elena reference images\n');
  
  const test1 = await testWithImageUrl();
  const test2 = await testWithImageUrls();
  const test3 = await testFlux2Pro();
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  📊 RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Test 1 (image_url):   ${test1 ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  Test 2 (image_urls):  ${test2 ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  Test 3 (Flux 2 Pro):  ${test3 ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  if (test1 || test2 || test3) {
    console.log('🎉 At least one method works! Check the URLs to compare quality.');
  } else {
    console.log('⚠️  No reference method worked. Together AI may not support image references yet.');
    console.log('💡 Alternative: Use RunPod with IP-Adapter for guaranteed face reference.');
  }
}

main();

