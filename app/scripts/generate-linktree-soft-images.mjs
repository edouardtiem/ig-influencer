/**
 * Elena Linktree Soft Images Generator
 * 
 * Generates 7 sexy/lingerie images for the landing page using NanoBananaPro
 * Key constraints:
 * - Face NOT visible or partially hidden (allows more explicit content)
 * - Premium/luxury aesthetic
 * - Suggestive but tasteful
 * 
 * Run: node app/scripts/generate-linktree-soft-images.mjs [--test]
 */

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// ═══════════════════════════════════════════════════════════════
// ELENA REFERENCES
// ═══════════════════════════════════════════════════════════════

const ELENA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png';
const ELENA_BODY_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png';

// ═══════════════════════════════════════════════════════════════
// BODY DESCRIPTION (Elena's proportions)
// ═══════════════════════════════════════════════════════════════

const ELENA_BODY_DESC = `feminine shapely figure, very large natural F-cup breasts with natural shape,
narrow defined waist, wide feminine hips, toned athletic build,
glowing sun-kissed olive skin, smooth natural skin texture,
bronde hair dark roots with golden blonde balayage long beach waves,
gold layered necklaces with medallion pendant, gold chunky chain bracelet on left wrist`;

// ═══════════════════════════════════════════════════════════════
// NO-FACE CONSTRAINT (critical for more permissive content)
// ═══════════════════════════════════════════════════════════════

const NO_FACE_INSTRUCTION = `CRITICAL - FACE NOT VISIBLE:
- Face must be cropped out of frame, turned away, or hidden
- Options: back to camera, looking away, face tilted up out of frame, hair covering face
- This allows more sensual/teasing content while maintaining mystery`;

// ═══════════════════════════════════════════════════════════════
// IMAGE PROMPTS - Sexy but tasteful, no face visible
// ═══════════════════════════════════════════════════════════════

// NanoBananaPro-compatible prompts - using format from working scripts
const LINKTREE_PROMPTS = [
  {
    id: 'silk_robe_morning',
    name: 'Silk Robe Morning',
    prompt: `Instagram lifestyle photo, soft morning light, intimate candid moment,

Young Italian woman, 24 years old, standing by window in bedroom,

[BODY - USE REFERENCE IMAGES]
feminine shapely figure, large natural bust, narrow waist, wide hips,
bronde hair with golden blonde balayage highlights, long beach waves,
sun-kissed olive skin, natural skin texture,
CRITICAL: Match body proportions EXACTLY from reference photos.

[OUTFIT] wearing cream silk robe loosely tied, falling off one shoulder, silk camisole underneath, elegant loungewear,

[POSE] standing by tall window, back partially to camera, looking out at Paris rooftops, face turned away creating mystery, one shoulder exposed, peaceful morning moment,

[SETTING] 
Luxurious Parisian apartment bedroom:
- Tall French windows with sheer curtains
- Soft golden morning light streaming in
- Haussmann building architecture
- White bed visible in background
- Intimate romantic atmosphere

[LIGHTING] Soft warm morning golden hour light from window, backlit silhouette effect, warm color temperature,

[ACCESSORIES] gold layered necklaces with medallion pendant, gold bracelet on wrist,

[MOOD] peaceful, sensual, intimate morning energy, premium lifestyle aesthetic,

--no tattoos, --no explicit content`,
  },
  {
    id: 'bikini_sunset_beach',
    name: 'Bikini Sunset Beach',
    prompt: `Instagram travel photo, golden hour sunset, Mediterranean vacation moment,

Young Italian woman, 24 years old, on beach at sunset,

[BODY - USE REFERENCE IMAGES]
feminine shapely figure, large natural bust, narrow waist, wide hips,
bronde hair with golden blonde balayage highlights, long beach waves,
sun-kissed olive skin, natural skin texture,
CRITICAL: Match body proportions EXACTLY from reference photos.

[OUTFIT] wearing elegant white bikini, triangle top, brazilian style bottoms, wet glistening skin,

[POSE] standing on beach, back to camera, silhouetted against golden sunset sky, one hand touching hair, looking at horizon, feminine curves visible as silhouette,

[SETTING]
Mediterranean beach at golden hour:
- Warm sunset colors, orange and pink sky
- Soft waves on shore
- Rocky coastline in distance
- Vacation paradise atmosphere

[LIGHTING] Golden hour backlight creating silhouette, warm sunset tones, rim light on curves,

[ACCESSORIES] gold layered necklaces, gold bracelet,

[MOOD] vacation freedom, sensual silhouette, aspirational travel content,

--no tattoos, --no explicit content`,
  },
  {
    id: 'gym_mirror_selfie',
    name: 'Gym Mirror Selfie',
    prompt: `Instagram fitness photo, gym selfie aesthetic, authentic workout moment,

Young Italian woman, 24 years old, in gym taking mirror selfie,

[BODY - USE REFERENCE IMAGES]
feminine shapely athletic figure, large natural bust, narrow waist, wide hips, toned muscles,
bronde hair with golden blonde balayage in ponytail,
sun-kissed olive skin with light sweat glow,
CRITICAL: Match body proportions EXACTLY from reference photos.

[OUTFIT] wearing black sports bra, high-waisted black yoga leggings, athletic fit showing midriff,

[POSE] mirror selfie pose, holding phone up partially covering face for candid effect, one hip cocked, confident athletic stance, body angled to show curves in mirror,

[SETTING]
Modern bright gym:
- Large mirror wall
- Clean minimalist design
- Natural light from windows
- Weights and equipment soft focus background

[LIGHTING] Bright gym lighting, natural light from windows, mirror reflection,

[ACCESSORIES] gold bracelet visible, small earrings, hair in high ponytail,

[MOOD] fitness motivation, athletic confidence, health aesthetic,

--no tattoos, --no explicit content`,
  },
  {
    id: 'pool_luxury_back',
    name: 'Pool Luxury Back',
    prompt: `Instagram travel photo, luxury resort aesthetic, pool moment,

Young Italian woman, 24 years old, at infinity pool,

[BODY - USE REFERENCE IMAGES]
feminine shapely figure, large natural bust, narrow waist, wide hips,
bronde hair with golden blonde balayage, wet slicked back,
sun-kissed olive skin, wet glistening,
CRITICAL: Match body proportions EXACTLY from reference photos.

[OUTFIT] wearing black bikini, elegant minimalist style, wet skin with water droplets,

[POSE] sitting on edge of infinity pool, legs in water, back to camera, looking at ocean horizon, hair wet and slicked back, feminine back curves visible,

[SETTING]
Luxury infinity pool:
- Crystal clear blue water
- Ocean view in background
- Golden hour light
- Mediterranean villa atmosphere

[LIGHTING] Golden hour side light on wet skin, water reflections, warm tones,

[ACCESSORIES] gold layered necklaces, gold bracelet,

[MOOD] luxury vacation, sensual elegance, aspirational lifestyle,

--no tattoos, --no explicit content`,
  },
  {
    id: 'bedroom_window_light',
    name: 'Bedroom Window Light',
    prompt: `Instagram lifestyle photo, intimate morning moment, soft natural light,

Young Italian woman, 24 years old, in Parisian bedroom,

[BODY - USE REFERENCE IMAGES]
feminine shapely figure, large natural bust, narrow waist, wide hips,
bronde hair with golden blonde balayage, messy morning waves,
sun-kissed olive skin, natural dewy skin,
CRITICAL: Match body proportions EXACTLY from reference photos.

[OUTFIT] wearing delicate white lace bralette with matching bottoms, elegant romantic lingerie style,

[POSE] standing by tall French window, soft backlight creating silhouette of curves, face tilted up looking at sky out of frame, dreamy ethereal pose, one hand on window,

[SETTING]
Elegant Parisian apartment:
- Tall French windows
- Sheer white curtains
- Soft morning light streaming in
- Minimalist bedroom decor

[LIGHTING] Soft morning backlight through curtains, ethereal silhouette effect, warm romantic tones,

[ACCESSORIES] delicate gold necklace, small earrings,

[MOOD] romantic morning, ethereal beauty, intimate luxury,

--no tattoos, --no explicit content`,
  },
  {
    id: 'bathroom_getting_ready',
    name: 'Bathroom Getting Ready',
    prompt: `Instagram lifestyle photo, getting ready moment, soft bathroom lighting,

Young Italian woman, 24 years old, in luxury bathroom,

[BODY - USE REFERENCE IMAGES]
feminine shapely figure, large natural bust, narrow waist, wide hips,
bronde hair with golden blonde balayage, damp from shower,
sun-kissed olive skin, fresh glowing,
CRITICAL: Match body proportions EXACTLY from reference photos.

[OUTFIT] wearing white towel wrapped around body, shoulders and collarbone visible, elegant getting ready moment,

[POSE] standing by large mirror, back partially to camera, reflection showing figure, fixing hair or touching earring, intimate candid moment, face turned away,

[SETTING]
Luxurious marble bathroom:
- Large ornate gold-framed mirror
- White marble surfaces
- Soft warm lighting
- Steam from shower visible
- Spa-like atmosphere

[LIGHTING] Soft warm bathroom lighting, steam diffusion, flattering mirror light,

[ACCESSORIES] gold earrings, gold bracelet, gold necklace visible,

[MOOD] intimate self-care moment, luxurious routine, premium lifestyle,

--no tattoos, --no explicit content`,
  },
  {
    id: 'cozy_bed_morning',
    name: 'Cozy Bed Morning',
    prompt: `Instagram lifestyle photo, cozy morning in bed, soft natural light,

Young Italian woman, 24 years old, in luxurious bed,

[BODY - USE REFERENCE IMAGES]
feminine shapely figure, large natural bust, narrow waist, wide hips,
bronde hair with golden blonde balayage, messy morning hair,
sun-kissed olive skin, natural morning glow,
CRITICAL: Match body proportions EXACTLY from reference photos.

[OUTFIT] wearing black silk slip dress, thin straps, elegant sleepwear,

[POSE] lying in bed on stomach, propped on elbows, feet playfully kicked up behind, face turned to side resting on arms, relaxed lazy morning pose,

[SETTING]
Luxury Parisian bedroom:
- King bed with white linen sheets
- Soft morning light through windows
- Cream and white color palette
- Cozy intimate atmosphere

[LIGHTING] Soft diffused morning light, warm tones, flattering bed lighting,

[ACCESSORIES] gold bracelet, delicate necklace,

[MOOD] lazy morning, sensual comfort, cozy luxury,

--no tattoos, --no explicit content`,
  },
];

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

async function urlToBase64(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const contentType = response.headers.get('content-type') || 'image/png';
  return `data:${contentType};base64,${base64}`;
}

async function downloadImage(url, filepath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(filepath, Buffer.from(arrayBuffer));
  return filepath;
}

// ═══════════════════════════════════════════════════════════════
// MAIN GENERATION
// ═══════════════════════════════════════════════════════════════

async function generateImage(replicate, promptData, references) {
  console.log(`\n📸 Generating: ${promptData.name}`);
  console.log(`   ID: ${promptData.id}`);
  
  const startTime = Date.now();
  
  try {
    const input = {
      prompt: promptData.prompt,
      image_input: references,
      aspect_ratio: "4:5", // Portrait format for mobile
      output_format: "jpg",
      resolution: "2K",
      safety_filter_level: "block_only_high", // Most permissive
    };
    
    console.log(`   Calling NanoBananaPro... (this takes ~4 minutes)`);
    
    const output = await replicate.run("google/nano-banana-pro", { input });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`   ⏱️  API returned in ${duration}s`);
    
    // Handle different output formats
    let imageBuffer = null;
    let imageUrl = null;
    
    // Case 1: Direct URL string
    if (typeof output === 'string' && output.startsWith('http')) {
      imageUrl = output;
    }
    // Case 2: Array of URLs
    else if (Array.isArray(output) && typeof output[0] === 'string') {
      imageUrl = output[0];
    }
    // Case 3: ReadableStream (binary data)
    else if (output && typeof output === 'object' && Symbol.asyncIterator in output) {
      console.log(`   📥 Reading binary stream...`);
      const chunks = [];
      for await (const chunk of output) {
        if (chunk instanceof Uint8Array) {
          chunks.push(chunk);
        } else if (typeof chunk === 'string' && chunk.startsWith('http')) {
          imageUrl = chunk;
          break;
        }
      }
      if (chunks.length > 0 && !imageUrl) {
        imageBuffer = Buffer.concat(chunks);
        console.log(`   ✅ Received ${(imageBuffer.length / 1024).toFixed(0)}KB of image data`);
      }
    }
    // Case 4: ReadableStream (Node.js stream API)
    else if (output && typeof output.getReader === 'function') {
      console.log(`   📥 Reading stream with getReader...`);
      const reader = output.getReader();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value instanceof Uint8Array) {
          chunks.push(value);
        }
      }
      if (chunks.length > 0) {
        imageBuffer = Buffer.concat(chunks);
        console.log(`   ✅ Received ${(imageBuffer.length / 1024).toFixed(0)}KB of image data`);
      }
    }
    
    if (!imageUrl && !imageBuffer) {
      throw new Error(`No image data in output. Type: ${typeof output}, Constructor: ${output?.constructor?.name}`);
    }
    
    console.log(`   ✅ Generated successfully!`);
    return { success: true, imageUrl, imageBuffer, id: promptData.id, name: promptData.name };
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`   ❌ Failed after ${duration}s: ${error.message}`);
    return { success: false, error: error.message, id: promptData.id, name: promptData.name };
  }
}

async function main() {
  console.log('🎀 Elena Linktree Soft Images Generator');
  console.log('=======================================\n');
  
  // Check for test mode
  const isTestMode = process.argv.includes('--test');
  const promptsToGenerate = isTestMode ? [LINKTREE_PROMPTS[0]] : LINKTREE_PROMPTS;
  
  if (isTestMode) {
    console.log('🧪 TEST MODE: Generating only 1 image\n');
  } else {
    console.log(`📋 Generating ${promptsToGenerate.length} images\n`);
  }
  
  // Check API token
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('❌ REPLICATE_API_TOKEN not set');
    process.exit(1);
  }
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  // Prepare references (convert to base64)
  console.log('📥 Loading reference images...');
  const references = [];
  try {
    // Body reference (more important for no-face images)
    const bodyBase64 = await urlToBase64(ELENA_BODY_REF);
    references.push(bodyBase64);
    console.log('   ✅ Body reference loaded');
    
    // Face reference (for hair/skin tone consistency)
    const faceBase64 = await urlToBase64(ELENA_FACE_REF);
    references.push(faceBase64);
    console.log('   ✅ Face reference loaded');
  } catch (error) {
    console.error('❌ Failed to load references:', error.message);
    process.exit(1);
  }
  
  // Output directory
  const outputDir = path.join(__dirname, '../../public/elena/linktree-soft');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Generate images
  const results = [];
  for (const promptData of promptsToGenerate) {
    const result = await generateImage(replicate, promptData, references);
    results.push(result);
    
    // Save successful images
    if (result.success && (result.imageUrl || result.imageBuffer)) {
      const filename = `${result.id}.jpg`;
      const filepath = path.join(outputDir, filename);
      try {
        if (result.imageBuffer) {
          // Save buffer directly
          fs.writeFileSync(filepath, result.imageBuffer);
          console.log(`   💾 Saved from buffer: public/elena/linktree-soft/${filename}`);
        } else if (result.imageUrl) {
          // Download from URL
          await downloadImage(result.imageUrl, filepath);
          console.log(`   💾 Saved from URL: public/elena/linktree-soft/${filename}`);
        }
        result.localPath = filepath;
      } catch (error) {
        console.error(`   ⚠️ Save failed: ${error.message}`);
      }
    }
    
    // Small delay between generations
    if (promptsToGenerate.indexOf(promptData) < promptsToGenerate.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  // Summary
  console.log('\n=======================================');
  console.log('📊 SUMMARY');
  console.log('=======================================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Success: ${successful.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log('\n📁 Generated images:');
    successful.forEach(r => {
      console.log(`   • ${r.name}: public/elena/linktree-soft/${r.id}.jpg`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed:');
    failed.forEach(r => {
      console.log(`   • ${r.name}: ${r.error}`);
    });
  }
  
  if (isTestMode && successful.length > 0) {
    console.log('\n🎉 Test successful! Run without --test to generate all 7 images.');
    console.log(`   Preview: open ${successful[0].localPath}`);
  }
}

main().catch(console.error);
