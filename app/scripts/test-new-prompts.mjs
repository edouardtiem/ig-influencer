#!/usr/bin/env node
/**
 * Test New Prompts — Generate 2 photos each for Mila & Elena
 * Tests the new explicit IMAGE 1/2 reference mapping
 * 
 * Usage: node scripts/test-new-prompts.mjs
 */

import Replicate from 'replicate';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

const NANO_BANANA_MODEL = 'google/nano-banana-pro';

// ═══════════════════════════════════════════════════════════════
// CHARACTER CONFIGS WITH NEW EXPLICIT PROMPTS
// ═══════════════════════════════════════════════════════════════

const CHARACTERS = {
  mila: {
    name: 'Mila',
    face_ref: 'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png',
    body_ref: 'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_5_kyx12v.png',
    reference_instruction: `You are provided with reference images in order:

**IMAGE 1 (FACE REFERENCE)**: This is Mila's face. Copy this EXACTLY:
- Same oval elongated face shape with high cheekbones
- Same soft feminine jawline (not angular), slightly pointed chin
- Same copper auburn hair with type 3A loose curls, shoulder-length, messy texture
- Same almond-shaped hazel-green eyes with golden flecks
- Same straight nose with slightly upturned tip
- Same naturally full lips with subtle asymmetry
- Same small dark brown beauty mark 2mm above left lip corner (SIGNATURE)
- Same beauty mark on center of right cheekbone
- Same 20-25 light golden-brown freckles on nose and cheekbones

**IMAGE 2 (BODY REFERENCE)**: This is Mila's body. Match these proportions:
- Same slim athletic physique 168cm
- Same natural full feminine curves with defined waist
- Same toned but not muscular Pilates-sculpted shoulders
- Same Mediterranean light tan skin

CRITICAL RULES:
- Face MUST be identical to Image 1 - same person, same features
- Body proportions MUST match Image 2
- Hair MUST be copper auburn with curls (NOT straight, NOT dark brown)
- ALWAYS include the beauty mark above left lip and freckles`,
    face_description: `oval elongated face shape with high naturally defined cheekbones,
soft feminine jawline not angular, chin slightly pointed,
copper auburn hair type 3A loose curls shoulder-length with natural volume and messy texture,
almond-shaped hazel-green eyes with golden flecks, natural full eyebrows slightly arched,
straight nose with slightly upturned tip (cute nose),
naturally full lips medium thickness with subtle asymmetry, rose-nude natural color`,
    marks: `small dark brown beauty mark 2mm above left lip corner (SIGNATURE),
medium brown beauty mark on center of right cheekbone,
20-25 light golden-brown freckles on nose bridge and cheekbones,
thin gold necklace with minimalist star pendant always visible`,
    body_description: `slim athletic physique 168cm, Mediterranean light tan skin,
natural full feminine curves with defined waist,
toned but not muscular, Pilates-sculpted shoulders`,
    final_check: `FINAL CHECK - MUST MATCH REFERENCES:
- Face: IDENTICAL to Image 1 (oval face, copper auburn curly hair)
- Body: IDENTICAL to Image 2 (slim athletic, toned)
- Beauty mark: above left lip corner MUST be visible (SIGNATURE)
- Freckles: on nose and cheekbones
- Jewelry: thin gold necklace with star pendant`,
    cloudinary_folder: 'mila-test-prompts',
  },
  elena: {
    name: 'Elena',
    face_ref: 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png',
    body_ref: 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png',
    reference_instruction: `You are provided with reference images in order:

**IMAGE 1 (FACE REFERENCE)**: This is Elena's face. Copy this EXACTLY:
- Same soft round pleasant face shape (NOT angular, NOT sharp jawline)
- Same smooth feminine jawline and rounded chin
- Same honey brown warm almond-shaped eyes
- Same naturally full lips nude-pink color
- Same small beauty mark on right cheekbone (SIGNATURE MARK)
- Same bronde hair with VISIBLE golden blonde balayage highlights (NOT solid dark brown)
- Same naturally thick well-groomed eyebrows

**IMAGE 2 (BODY REFERENCE)**: This is Elena's body. Match these proportions EXACTLY:
- Same feminine shapely figure (NOT skinny)
- Same very large natural F-cup breasts (prominent, NOT reduced)
- Same narrow defined waist
- Same wide feminine hips
- Same healthy fit Italian body type

CRITICAL RULES:
- Face MUST be identical to Image 1 - same person, same features
- Body proportions MUST match Image 2 - same curves
- Do NOT change face to look more "model-like" or angular
- Hair MUST show visible golden blonde balayage highlights, NOT solid dark brown`,
    face_description: `soft round pleasant face NOT angular, warm approachable features,
smooth feminine jawline, rounded chin, soft cheekbones,
bronde hair dark roots with golden blonde balayage, long voluminous beach waves past shoulders,
honey brown warm almond-shaped eyes, naturally thick eyebrows well-groomed,
small straight nose, naturally full lips nude-pink color`,
    marks: `small beauty mark on right cheekbone (SIGNATURE),
glowing sun-kissed Italian skin tone,
gold chunky chain bracelet on left wrist ALWAYS visible,
layered gold necklaces with medallion pendant ALWAYS visible`,
    body_description: `feminine shapely figure 172cm tall,
very large natural F-cup breasts prominent and natural shape,
narrow defined waist, wide feminine hips,
healthy fit Italian body, confident elegant posture`,
    final_check: `FINAL CHECK - MUST MATCH REFERENCES:
- Face: IDENTICAL to Image 1 (soft round face, NOT angular, warm features)
- Body: IDENTICAL to Image 2 (shapely with very large bust visible)
- Hair: bronde with VISIBLE golden blonde balayage highlights (NOT solid dark brown)
- Beauty mark: on right cheekbone MUST be visible
- Jewelry: gold chunky bracelet on wrist, layered gold necklaces`,
    cloudinary_folder: 'elena-test-prompts',
  },
};

// ═══════════════════════════════════════════════════════════════
// TEST SCENARIOS — 2 per character
// ═══════════════════════════════════════════════════════════════

const TEST_SCENARIOS = {
  mila: [
    {
      id: 'mila_morning_coffee',
      setting: 'Cozy Parisian café interior, warm morning light through windows, rustic wooden table with espresso cup and fresh croissant',
      outfit: 'Cream oversized knit sweater, natural minimal makeup, hair in natural waves, thin gold star necklace visible',
      action: 'Holding warm coffee cup with both hands close to face, soft genuine smile, looking at camera, relaxed cozy moment',
      expression: 'warm genuine smile, relaxed morning energy, eyes sparkling with joy',
    },
    {
      id: 'mila_yoga_studio',
      setting: 'Bright minimalist yoga studio with natural light streaming in, yoga mat on light wooden floor, green plants in corner',
      outfit: 'Sage green fitted workout top and matching high-waisted leggings, hair pulled back, athletic sporty look',
      action: 'Standing in balanced yoga pose, hands together at heart center, peaceful centered expression, healthy glow',
      expression: 'serene confident look, peaceful meditative energy, gentle smile',
    },
  ],
  elena: [
    {
      id: 'elena_loft_morning',
      setting: 'Luxurious bright Parisian loft apartment, tall French windows with morning sunlight, modern minimalist decor, herringbone oak parquet floor, view of Paris rooftops',
      outfit: 'Elegant cream cashmere sweater off one shoulder, layered gold necklaces with medallion, chunky gold bracelet on wrist, hair in soft beach waves',
      action: 'Standing by window holding coffee cup, looking thoughtfully at Paris rooftops view, elegant morning routine moment',
      expression: 'serene peaceful look, elegant confidence, soft gentle smile',
    },
    {
      id: 'elena_rooftop_sunset',
      setting: 'Paris rooftop terrace at golden hour sunset, Eiffel Tower visible in soft focus background, small bistro table with champagne glass, warm orange sunset light',
      outfit: 'Black elegant fitted dress, gold layered necklaces, chunky gold bracelet, hair styled in glamorous soft waves',
      action: 'Standing by rooftop railing with Paris view behind, looking at camera with warm confident smile, golden hour lighting on face',
      expression: 'confident warm gaze at camera, knowing smile, natural charm and elegance',
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function log(message) {
  console.log(`[${new Date().toISOString().split('T')[1].split('.')[0]}] ${message}`);
}

async function urlToBase64(url) {
  log(`    Fetching: ${url.split('/').pop()}`);
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }
  
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  log(`    ✓ Converted (${Math.round(base64.length / 1024)}KB)`);
  return `data:image/png;base64,${base64}`;
}

// ═══════════════════════════════════════════════════════════════
// CLOUDINARY UPLOAD
// ═══════════════════════════════════════════════════════════════

async function uploadToCloudinary(imageData, folder) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto
    .createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex');

  const formData = new FormData();
  
  // Handle base64 or URL
  if (imageData.startsWith('data:')) {
    formData.append('file', imageData);
  } else {
    formData.append('file', imageData);
  }
  
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudinary upload failed: ${error}`);
  }

  const result = await response.json();
  return result.secure_url;
}

// ═══════════════════════════════════════════════════════════════
// IMAGE GENERATION
// ═══════════════════════════════════════════════════════════════

async function generateImage(replicate, character, scenario) {
  const config = CHARACTERS[character];
  
  // Build the prompt with explicit reference instructions
  const prompt = `${config.reference_instruction}

SUBJECT: ${config.name}, ${character === 'mila' ? '22' : '24'} year old ${character === 'mila' ? 'French' : 'Italian'} woman,

FACE (COPY FROM IMAGE 1): ${config.face_description},

DISTINCTIVE MARKS: ${config.marks},

BODY (COPY FROM IMAGE 2): ${config.body_description},

EXPRESSION: ${scenario.expression},

ACTION: ${scenario.action},

OUTFIT: ${scenario.outfit},

SETTING: ${scenario.setting},

STYLE: ultra realistic Instagram photo, lifestyle content, high fashion aesthetic,
shot on professional camera, natural photography, 8k quality, detailed skin texture, realistic lighting,

${config.final_check}`;

  log(`  Converting references to base64...`);
  const refs = [config.face_ref, config.body_ref];
  const base64Refs = [];
  for (const ref of refs) {
    const b64 = await urlToBase64(ref);
    base64Refs.push(b64);
  }
  
  log(`  ✅ Got ${base64Refs.length} references, lengths: ${base64Refs.map(b => b ? b.length : 'null').join(', ')}`);
  log(`  Calling Nano Banana Pro...`);
  const startTime = Date.now();
  
  const output = await replicate.run(NANO_BANANA_MODEL, {
    input: {
      prompt,
      aspect_ratio: '4:5',
      resolution: '2K',
      output_format: 'jpg',
      safety_filter_level: 'block_only_high',
      image_input: base64Refs,
    },
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  log(`  ✅ Generated in ${duration}s`);

  // Handle output format
  if (!output) throw new Error('No output from Nano Banana Pro');
  
  // Handle async iterator
  if (typeof output === 'object' && Symbol.asyncIterator in output) {
    const chunks = [];
    for await (const chunk of output) {
      if (chunk instanceof Uint8Array) {
        chunks.push(chunk);
      } else if (typeof chunk === 'string') {
        return chunk;
      }
    }
    if (chunks.length > 0) {
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      return `data:image/jpeg;base64,${Buffer.from(combined).toString('base64')}`;
    }
  }
  
  if (typeof output === 'string') return output;
  if (Array.isArray(output) && output[0]) return output[0];
  
  throw new Error('Could not process API response');
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🧪 TEST NEW PROMPTS — 2 photos Mila + 2 photos Elena');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  const results = {
    mila: [],
    elena: [],
  };

  // Generate for both characters
  for (const character of ['mila', 'elena']) {
    const config = CHARACTERS[character];
    const scenarios = TEST_SCENARIOS[character];
    
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`👤 ${config.name.toUpperCase()} — Generating ${scenarios.length} photos`);
    console.log(`${'─'.repeat(60)}`);

    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];
      log(`\n📸 [${i + 1}/${scenarios.length}] ${scenario.id}`);
      log(`  Setting: ${scenario.setting.substring(0, 50)}...`);
      
      try {
        // Generate image
        const imageData = await generateImage(replicate, character, scenario);
        
        // Upload to Cloudinary
        log(`  ☁️  Uploading to Cloudinary...`);
        const cloudinaryUrl = await uploadToCloudinary(imageData, config.cloudinary_folder);
        log(`  ✅ Uploaded!`);
        
        results[character].push({
          id: scenario.id,
          url: cloudinaryUrl,
        });
        
      } catch (error) {
        log(`  ❌ Error: ${error.message}`);
        results[character].push({
          id: scenario.id,
          error: error.message,
        });
      }
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📋 RESULTS — Cloudinary URLs');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('🔵 MILA:');
  for (const result of results.mila) {
    if (result.url) {
      console.log(`  ✅ ${result.id}:`);
      console.log(`     ${result.url}`);
    } else {
      console.log(`  ❌ ${result.id}: ${result.error}`);
    }
  }

  console.log('\n🟣 ELENA:');
  for (const result of results.elena) {
    if (result.url) {
      console.log(`  ✅ ${result.id}:`);
      console.log(`     ${result.url}`);
    } else {
      console.log(`  ❌ ${result.id}: ${result.error}`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ TEST COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Return URLs for easy copy
  const allUrls = [...results.mila, ...results.elena]
    .filter(r => r.url)
    .map(r => r.url);
  
  if (allUrls.length > 0) {
    console.log('\n📎 ALL URLS (copy-paste ready):');
    allUrls.forEach(url => console.log(url));
  }
}

main().catch(console.error);

