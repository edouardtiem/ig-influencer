#!/usr/bin/env node
/**
 * Test Together AI with ULTRA DETAILED Elena prompt
 * Maximum face/body consistency instructions
 */

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY || 'tgp_v1_78d8JAHhygnPGlayhbNKX86PZQYedEtWDwZH0uO1lEs';
const TOGETHER_API_URL = 'https://api.together.xyz/v1/images/generations';

// Elena Cloudinary references
const ELENA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png';
const ELENA_BODY_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png';

// ═══════════════════════════════════════════════════════════════
// ULTRA DETAILED PROMPT V2
// ═══════════════════════════════════════════════════════════════

const ULTRA_PROMPT = `CRITICAL: Generate an image that EXACTLY matches the reference images provided.

=== FROM REFERENCE IMAGE 1 (FACE) - COPY EXACTLY ===
- Face shape: soft round pleasant face, NOT angular, NOT sharp jawline
- Jawline: smooth feminine rounded jawline, soft rounded chin
- Eyes: honey brown warm almond-shaped eyes, naturally thick eyebrows
- Nose: small straight nose
- Lips: naturally full lips, nude-pink color
- Skin: glowing sun-kissed Italian skin tone, flawless complexion
- Hair: bronde (brown base with golden blonde balayage highlights), long voluminous beach waves past shoulders, dark roots with visible golden blonde highlights throughout
- SIGNATURE: small beauty mark on right cheekbone (MUST BE VISIBLE)

=== FROM REFERENCE IMAGE 2 (BODY) - MATCH PROPORTIONS ===
- Height: tall 172cm
- Bust: very large natural F-cup breasts, prominent and natural shape, NOT reduced
- Waist: narrow defined waist
- Hips: wide feminine hips
- Build: feminine shapely figure, healthy fit Italian body type
- NOT skinny, NOT thin - curvy hourglass figure

=== ALWAYS VISIBLE ACCESSORIES ===
- Gold chunky chain bracelet on LEFT wrist
- Layered gold necklaces with medallion pendant

=== SCENE FOR THIS IMAGE ===
Wearing elegant black lace lingerie set with delicate straps,
sitting elegantly on velvet mauve/purple sofa,
luxurious Parisian apartment with large windows,
soft natural morning light from the side,
intimate boudoir atmosphere,

=== STYLE ===
Professional boudoir photography, 8K resolution,
Canon EOS R5 85mm f/1.4 lens, shallow depth of field,
warm golden tones, soft shadows,
photorealistic, high fashion editorial quality

=== CRITICAL DO NOT ===
- Do NOT make face angular or sharp
- Do NOT reduce bust size
- Do NOT make body skinny
- Do NOT forget the beauty mark on right cheekbone
- Do NOT make hair solid dark brown (must show blonde highlights)
- ONE SINGLE IMAGE ONLY - no collages, no grids`;

// ═══════════════════════════════════════════════════════════════
// TEST FUNCTIONS
// ═══════════════════════════════════════════════════════════════

async function testV2() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🧪 TEST: Ultra Detailed Prompt with 2 References');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('📸 Face ref:', ELENA_FACE_REF.slice(-40));
  console.log('📸 Body ref:', ELENA_BODY_REF.slice(-40));
  console.log('📝 Prompt length:', ULTRA_PROMPT.length, 'chars\n');
  
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
        prompt: ULTRA_PROMPT,
        width: 1024,
        height: 1280,
        steps: 40, // More steps for better quality
        n: 1,
        seed: 42, // Fixed seed for reproducibility
        image_url: ELENA_FACE_REF, // Primary face reference
      }),
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (!response.ok) {
      const error = await response.text();
      console.log(`❌ Failed (${response.status}):`, error.slice(0, 300));
      return null;
    }
    
    const data = await response.json();
    console.log(`✅ Generated in ${duration}s`);
    console.log('🖼️  URL:', data.data[0].url);
    return data.data[0].url;
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

async function testKontext() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  🧪 TEST: FLUX Kontext (if available - better for face ref)');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const startTime = Date.now();
  
  // Simpler prompt for Kontext - it relies more on the reference
  const kontextPrompt = `Same woman from reference image, exact same face and features.
Wearing elegant black lace lingerie, sitting on velvet purple sofa,
Parisian apartment, soft morning light, boudoir photography, 8K`;
  
  try {
    // Try FLUX Kontext which is designed for reference-based generation
    const response = await fetch(TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'black-forest-labs/FLUX.1-kontext-dev', // Kontext model
        prompt: kontextPrompt,
        width: 1024,
        height: 1280,
        n: 1,
        image_url: ELENA_FACE_REF,
      }),
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (!response.ok) {
      const error = await response.text();
      console.log(`❌ Kontext not available:`, error.slice(0, 200));
      return null;
    }
    
    const data = await response.json();
    console.log(`✅ Generated in ${duration}s`);
    console.log('🖼️  URL:', data.data[0].url);
    return data.data[0].url;
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

async function testWithStrength() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  🧪 TEST: With image_strength parameter (img2img style)');
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
        model: 'black-forest-labs/FLUX.1-dev',
        prompt: ULTRA_PROMPT,
        width: 1024,
        height: 1280,
        steps: 40,
        n: 1,
        image_url: ELENA_FACE_REF,
        image_strength: 0.85, // High strength = more influence from reference
      }),
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (!response.ok) {
      const error = await response.text();
      console.log(`❌ Failed:`, error.slice(0, 200));
      return null;
    }
    
    const data = await response.json();
    console.log(`✅ Generated in ${duration}s`);
    console.log('🖼️  URL:', data.data[0].url);
    return data.data[0].url;
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

async function testRedux() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  🧪 TEST: FLUX Redux (variation model - keeps face)');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const startTime = Date.now();
  
  const reduxPrompt = `Variation of reference: same exact woman, same face, same features.
New outfit: elegant black lace lingerie.
New setting: velvet purple sofa, Parisian apartment, morning light.
Style: professional boudoir photography, 8K, Canon 85mm f/1.4`;
  
  try {
    const response = await fetch(TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'black-forest-labs/FLUX.1-redux-dev', // Redux for variations
        prompt: reduxPrompt,
        width: 1024,
        height: 1280,
        n: 1,
        image_url: ELENA_FACE_REF,
      }),
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (!response.ok) {
      const error = await response.text();
      console.log(`❌ Redux not available:`, error.slice(0, 200));
      return null;
    }
    
    const data = await response.json();
    console.log(`✅ Generated in ${duration}s`);
    console.log('🖼️  URL:', data.data[0].url);
    return data.data[0].url;
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('🎨 Together AI - ULTRA DETAILED Elena Tests\n');
  console.log('Testing multiple approaches to improve face consistency...\n');
  
  const results = {};
  
  results.v2 = await testV2();
  results.strength = await testWithStrength();
  results.kontext = await testKontext();
  results.redux = await testRedux();
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  📊 RESULTS - Compare all URLs');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  if (results.v2) console.log('V2 (Ultra prompt):\n  ', results.v2);
  if (results.strength) console.log('With strength:\n  ', results.strength);
  if (results.kontext) console.log('Kontext:\n  ', results.kontext);
  if (results.redux) console.log('Redux:\n  ', results.redux);
  
  console.log('\n💡 Open each URL and compare which one looks most like Elena!');
}

main();

