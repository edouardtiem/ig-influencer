#!/usr/bin/env node
/**
 * Generate Fanvue Pack — Elena "Loft Vibes" Starter Pack
 * 
 * Generates high-quality professional photos for Fanvue pack sale
 * Uses professional camera references (Sony A7, Canon EOS R5, etc.)
 * 
 * Usage: 
 *   node scripts/generate-fanvue-pack-elena.mjs test    (generate 1 photo for validation)
 *   node scripts/generate-fanvue-pack-elena.mjs full    (generate all 7 photos)
 */

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

const NANO_BANANA_MODEL = 'google/nano-banana-pro';
const OUTPUT_DIR = path.join(__dirname, '..', 'generated', 'fanvue-packs', 'elena-fanvue-pack1');
const MODE = process.argv[2] || 'test'; // 'test', 'full', or photo index (0-6)

// Elena references
const ELENA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png';
const ELENA_BODY_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png';

// Location references
const LOCATION_REFS = {
  loft_living: 'https://res.cloudinary.com/dily60mr0/image/upload/v1766009920/replicate-prediction-aphj5sddfxrmc0cv5sf8eqe2pw_c0otnl.png',
  loft_bedroom: 'https://res.cloudinary.com/dily60mr0/image/upload/v1766009918/replicate-prediction-nnns47vwgdrme0cv5shbd0b224_d0ghoj.png',
  bathroom_luxe: 'https://res.cloudinary.com/dily60mr0/image/upload/v1766009922/replicate-prediction-cq10n9h3jsrma0cv5sgrn0x5mr_swbswr.png',
};

// ═══════════════════════════════════════════════════════════════
// PROFESSIONAL CAMERA SPECS (for high-quality prompts)
// ═══════════════════════════════════════════════════════════════

const PROFESSIONAL_CAMERA_SPECS = [
  'shot on Sony A7R V with 85mm f/1.4 GM lens, full-frame sensor, 61 megapixels, professional portrait photography',
  'shot on Canon EOS R5 with 50mm f/1.2 L lens, full-frame sensor, 45 megapixels, professional fashion photography',
  'shot on Nikon Z9 with 85mm f/1.4 S lens, full-frame sensor, 45 megapixels, professional editorial photography',
  'shot on Sony A7 IV with 85mm f/1.4 GM lens, full-frame sensor, 33 megapixels, professional lifestyle photography',
];

function getRandomCameraSpec() {
  return PROFESSIONAL_CAMERA_SPECS[Math.floor(Math.random() * PROFESSIONAL_CAMERA_SPECS.length)];
}

// ═══════════════════════════════════════════════════════════════
// PACK STARTER "LOFT VIBES" — 7 Photos Specs
// ═══════════════════════════════════════════════════════════════

const PACK_STARTER_PHOTOS = [
  {
    id: 'cover',
    name: 'Cover - Canapé velours',
    setting: {
      location: 'loft_living',
      description: `Based on the provided location reference image, recreate this exact living room faithfully.

Luxurious bright Parisian loft apartment 8th arrondissement with high Haussmannian ceilings, ornate white crown moldings. Large French windows with natural daylight flooding in, Paris zinc rooftops view. Herringbone chevron parquet floor in light oak honey color. Statement vintage dusty rose mauve velvet sofa with curved armrests 1970s Italian design. Minimalist black metal and glass side table. Large indoor palm tree in terracotta pot, fiddle leaf fig plant, smaller potted plants. Fashion magazines on coffee table, gold candle holders, soft cream throw blanket on sofa. White walls, dusty rose mauve velvet, cream and beige tones, gold accents. Expensive but lived-in, Italian-Parisian luxury aesthetic.`,
    },
    outfit: 'fitted black sports bra covering chest only showing toned midriff and curves, black bikini bottoms, barefoot, casual sporty home look',
    pose: 'lounging on velvet sofa elegantly positioned in left third of frame, legs extended along sofa, body curved gracefully showcasing feminine silhouette, one hand running through hair, confident relaxed pose, full body visible in wide shot with room environment',
    expression: 'magnetic captivating gaze directly at camera, soft natural smile, eyes sparkling with warmth, relaxed confident expression',
  },
  {
    id: 'photo_1',
    name: 'Canapé velours mauve',
    setting: {
      location: 'loft_living',
      description: `Based on the provided location reference image, recreate this exact living room faithfully.

Luxurious bright Parisian loft apartment 8th arrondissement with high Haussmannian ceilings, ornate white crown moldings. Large French windows with natural daylight flooding in, Paris zinc rooftops view. Herringbone chevron parquet floor in light oak honey color. Statement vintage dusty rose mauve velvet sofa with curved armrests 1970s Italian design. Minimalist black metal and glass side table. Large indoor palm tree in terracotta pot, fiddle leaf fig plant, smaller potted plants. Fashion magazines on coffee table, gold candle holders, soft cream throw blanket on sofa. White walls, dusty rose mauve velvet, cream and beige tones, gold accents. Expensive but lived-in, Italian-Parisian luxury aesthetic.`,
    },
    outfit: 'fitted black sports bra covering chest only showing toned midriff and curves, black bikini bottoms, barefoot, casual sporty home look without shirt',
    pose: 'lying back on velvet sofa, head tilted back slightly, legs positioned naturally, body curved gracefully, hands behind head showing off feminine silhouette, confident feminine pose',
    expression: 'enchanting magnetic gaze at camera, lips slightly parted, eyes sparkling with charm, soft charming smile, captivating presence',
  },
  {
    id: 'photo_2',
    name: 'Fenêtre loft - Close up',
    setting: {
      location: 'loft_living',
      description: `Based on the provided location reference image, recreate this exact living room faithfully.

Luxurious bright Parisian loft apartment 8th arrondissement with high Haussmannian ceilings, ornate white crown moldings. Large French windows with natural daylight flooding in, Paris zinc rooftops view. Herringbone chevron parquet floor in light oak honey color. Statement vintage dusty rose mauve velvet sofa with curved armrests 1970s Italian design.`,
    },
    outfit: 'fitted black sports bra covering chest only showing toned midriff and curves, black bikini bottoms, barefoot, hair slightly tousled',
    pose: 'CLOSE UP PORTRAIT from chest up, standing near French window with soft natural backlight, one hand gently touching hair, head slightly tilted, intimate close framing showing face and upper body, shallow depth of field background blurred',
    expression: 'soft intimate gaze directly at camera, natural warm smile, eyes sparkling with genuine warmth, relaxed confident expression',
  },
  {
    id: 'photo_3',
    name: 'Salle de bain marbre',
    setting: {
      location: 'bathroom_luxe',
      description: `Based on the provided location reference image, recreate this exact bathroom faithfully.

Luxurious Parisian apartment bathroom with high ceiling, spacious and elegant. Large single French window with white wooden frame overlooking Paris zinc rooftops and Haussmann building facades, abundant natural daylight streaming in. Floor to ceiling white Calacatta marble with elegant grey veining, polished finish, continuous marble on walls floor and shower area, seamless luxury spa feeling. All brushed gold brass fixtures throughout, vintage-style gold faucet with cross handles on pedestal sink, gold-framed rectangular mirror with subtle art deco lines, glass walk-in shower enclosure with gold hinges and gold rainfall showerhead, gold towel rack.`,
    },
    outfit: 'fitted black sports bra covering chest only showing toned midriff and curves, black bikini bottoms, barefoot, hair slightly wet, skin glowing fresh from shower',
    pose: 'full body shot from low angle looking slightly up, standing confidently in marble bathroom, one hand on hip, other hand running through wet hair, legs apart in powerful stance, dramatic perspective emphasizing height and presence',
    expression: 'confident powerful gaze down at camera, slight knowing smile, eyes intense and captivating, commanding presence',
  },
  {
    id: 'photo_4',
    name: 'Salon - Matin café',
    setting: {
      location: 'loft_living',
      description: `Based on the provided location reference image, recreate this exact living room faithfully.

Luxurious bright Parisian loft apartment 8th arrondissement with high Haussmannian ceilings, ornate white crown moldings. Large French windows with natural daylight flooding in, Paris zinc rooftops view. Herringbone chevron parquet floor in light oak honey color. Statement vintage dusty rose mauve velvet sofa with curved armrests 1970s Italian design.`,
    },
    outfit: 'fitted black sports bra, black athletic shorts, barefoot, cozy morning',
    pose: 'standing by French window holding coffee cup, looking out at Paris view, soft morning light on face, relaxed contemplative moment, three-quarter profile view',
    expression: 'peaceful serene expression, soft natural smile, eyes looking out window dreamily, quiet morning moment',
  },
  {
    id: 'photo_5',
    name: 'Lit luxueux - Relaxed',
    setting: {
      location: 'loft_bedroom',
      description: `Based on the provided location reference image, recreate this exact bedroom faithfully.

Elegant Parisian apartment bedroom in the 8th arrondissement with high Haussmannian ceiling, ornate white crown moldings, herringbone chevron parquet floor light oak. Two tall French windows with sheer white linen curtains gently flowing, view of Paris rooftops. King size bed with cream linen upholstered headboard button-tufted, luxurious white and beige layered bedding with linen duvet, multiple pillows in cream white and dusty rose, cashmere throw blanket in camel color draped at foot of bed.`,
    },
    outfit: 'fitted black sports bra, black athletic shorts, lying on luxurious white bedding, lazy morning',
    pose: 'lying on bed on side, propped up on elbow facing camera, hair flowing on white pillows, one hand supporting head, relaxed lazy morning pose, soft natural light from window, full body visible on white sheets',
    expression: 'soft warm smile, dreamy relaxed eyes, peaceful morning gaze at camera, genuine warmth and comfort',
  },
  {
    id: 'photo_6',
    name: 'Salon - Stretching morning',
    setting: {
      location: 'loft_living',
      description: `Based on the provided location reference image, recreate this exact living room faithfully.

Luxurious bright Parisian loft apartment 8th arrondissement with high Haussmannian ceilings, ornate white crown moldings. Large French windows with natural daylight flooding in, Paris zinc rooftops view. Herringbone chevron parquet floor in light oak honey color. Statement vintage dusty rose mauve velvet sofa with curved armrests 1970s Italian design.`,
    },
    outfit: 'fitted black sports bra, black athletic shorts, barefoot, morning stretch athleisure',
    pose: 'standing in living room doing gentle morning stretch, arms raised above head stretching, body elongated gracefully, natural movement captured mid-stretch, soft morning light, full body visible with apartment in background',
    expression: 'eyes closed peacefully enjoying stretch, serene relaxed expression, natural moment of wellness, soft gentle smile',
  },
];

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

async function urlToBase64(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;
}

// ═══════════════════════════════════════════════════════════════
// CLOUDINARY UPLOAD
// ═══════════════════════════════════════════════════════════════

async function uploadToCloudinary(imageUrl, publicId) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Missing Cloudinary credentials');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'elena-fanvue-pack1';
  
  // Build signature (alphabetical order: folder, overwrite, public_id, timestamp)
  const signatureString = `folder=${folder}&overwrite=true&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

  const formData = new FormData();
  
  // Handle base64 data URI or URL
  if (imageUrl.startsWith('data:')) {
    formData.append('file', imageUrl);
  } else {
    // For URL, fetch and create blob
    const imgResponse = await fetch(imageUrl);
    const buffer = await imgResponse.arrayBuffer();
    const blob = new Blob([buffer], { type: 'image/jpeg' });
    formData.append('file', blob);
  }
  
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  formData.append('folder', folder);
  formData.append('public_id', publicId);
  formData.append('overwrite', 'true');

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

function buildPrompt(photoSpec) {
  const cameraSpec = getRandomCameraSpec();
  
  return `You are provided with reference images in order:

**IMAGE 1 (FACE REFERENCE)**: THIS IS THE MOST IMPORTANT REFERENCE. Copy Elena's face EXACTLY pixel by pixel:
- IDENTICAL soft round pleasant face shape (NOT angular, NOT sharp jawline, NOT different person)
- IDENTICAL honey brown warm almond-shaped eyes - same eye shape and color
- MANDATORY small beauty mark on right cheekbone (SIGNATURE MARK - must be visible)
- IDENTICAL bronde hair with VISIBLE golden blonde balayage highlights (NOT solid dark brown, NOT different hair)
- IDENTICAL naturally full lips nude-pink color
- FACE MUST BE RECOGNIZABLE AS THE SAME PERSON IN IMAGE 1

**IMAGE 2 (BODY REFERENCE)**: This is Elena's body. Match these proportions EXACTLY:
- Same feminine shapely figure (NOT skinny, NOT thin)
- Same very large natural F-cup breasts (prominent, NOT reduced)
- Same narrow defined waist
- Same wide feminine hips
- Same healthy fit Italian body type

**IMAGE 3 (LOCATION REFERENCE)**: Based on the provided location reference image, place the subject in this exact room/location.

CONTEXT: Professional fashion photography for luxury lifestyle brand. Editorial content for fashion magazine. This is professional modeling work.

SUBJECT: Elena, 24 year old Italian fashion model living in Paris

SETTING: ${photoSpec.setting.description}

OUTFIT: ${photoSpec.outfit}

POSE: ${photoSpec.pose}

EXPRESSION: ${photoSpec.expression}

ACCESSORIES: gold chunky chain bracelet on left wrist ALWAYS visible, layered gold necklaces with medallion pendant ALWAYS visible

CAMERA & QUALITY: ${cameraSpec}, RAW format, professional color grading, shallow depth of field f/1.4 bokeh background, ultra-high resolution 8K, sharp focus on face and body, natural skin texture with fine details visible

PHOTOGRAPHY STYLE: Shot by Mario Testino for Vogue magazine editorial, professional studio lighting with natural window light fill, rule of thirds composition, subject positioned off-center for dynamic framing, leading lines from environment directing eye to subject, negative space used artistically, low angle slightly looking up at subject for powerful feminine presence, cinematic wide shot showing full environment and subject interaction

STYLE: Professional fashion photography for lingerie modeling agency, editorial aesthetic, luxury fashion brand campaign, 
professional modeling portfolio content, tasteful and elegant, soft warm tones, professional color grading, 
high-end commercial fashion photography quality, magazine editorial style,
alluring and captivating, magnetic presence, elegant and refined, professional model portfolio

QUALITY: ultra-high resolution 8K, extremely sharp focus on face and body, 
natural realistic skin texture with pores and fine details visible, 
realistic hair rendering with individual strands, professional color grading, 
Instagram-ready but optimized for print quality, no compression artifacts

EMPHASIS: feminine silhouette elegantly displayed in wide cinematic frame, graceful curves visible, 
alluring presence, captivating charm, magnetic appeal, elegant femininity,
luxury Parisian apartment atmosphere fully visible, tasteful and sophisticated, Vogue editorial quality

FACE CHECK: The face in this image MUST be identical to Image 1 reference - same person, same features, same beauty mark on right cheekbone

NEGATIVE: different face, different person, angular face, sharp jawline, square face, 
classic model face, skinny thin body, flat chest, small breasts, medium breasts, 
A-cup, B-cup, C-cup, D-cup, average bust, conservative outfit, covered up, 
modest clothing, dark room, cheap decor, stiff pose, cold expression, 
airbrushed skin, fake looking, oversaturated, plastic skin, explicit nudity, 
adult content, low quality, blurry, pixelated, compression artifacts, 
watermark, logo, text, signature, amateur photography, phone camera quality,
vulgar, provocative, inappropriate, explicit, adult content, NSFW, pornographic`;
}

async function generateWithMinimax(replicate, prompt, faceRefUrl) {
  log('  🔥 Using Minimax Image-01 fallback (more permissive for lingerie content)...');
  
  const input = {
    prompt,
    aspect_ratio: '3:4',
    subject_reference: faceRefUrl,
  };

  const output = await replicate.run('minimax/image-01', { input });

  if (typeof output === 'string') return output;
  if (Array.isArray(output) && output[0]) {
    const first = output[0];
    if (typeof first === 'string') return first;
    if (first && typeof first.toString === 'function') {
      const str = first.toString();
      if (str.startsWith('http')) return str;
    }
  }
  if (output && typeof output.toString === 'function') {
    const str = output.toString();
    if (str.startsWith('http')) return str;
  }

  throw new Error('Could not parse Minimax output');
}

async function generateImage(replicate, photoSpec) {
  log(`\n🎨 Generating: ${photoSpec.name}...`);
  
  // Build references array
  const refs = [ELENA_FACE_REF, ELENA_BODY_REF];
  if (photoSpec.setting.location && LOCATION_REFS[photoSpec.setting.location]) {
    refs.push(LOCATION_REFS[photoSpec.setting.location]);
  }
  
  log(`  📸 References: ${refs.length} (face, body${photoSpec.setting.location ? ', location' : ''})`);
  
  // Convert to base64
  const base64Images = await Promise.all(refs.map(url => urlToBase64(url)));
  
  const prompt = buildPrompt(photoSpec);
  
  log(`  📝 Camera: ${getRandomCameraSpec().split(',')[0]}`);
  log(`  🎯 Setting: ${photoSpec.setting.location || 'custom'}`);
  
  const startTime = Date.now();
  
  const output = await replicate.run(NANO_BANANA_MODEL, {
    input: {
      prompt,
      image_input: base64Images,
      aspect_ratio: '16:9',
      resolution: '2K', // Highest available
      output_format: 'jpg',
      safety_filter_level: 'block_only_high',
    },
  });
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  log(`  ✅ Generated in ${duration}s`);
  
  // Handle output (Nano Banana Pro can return async iterator or direct URL)
  let imageUrl;
  
  // Handle async iterator (streamed output)
  if (typeof output === 'object' && Symbol.asyncIterator in output) {
    const chunks = [];
    for await (const chunk of output) {
      if (chunk instanceof Uint8Array) {
        chunks.push(chunk);
      } else if (typeof chunk === 'string') {
        imageUrl = chunk;
        break;
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
      const base64 = Buffer.from(combined).toString('base64');
      imageUrl = `data:image/jpeg;base64,${base64}`;
    }
  } else if (typeof output === 'string') {
    imageUrl = output;
  } else if (Array.isArray(output) && output[0]) {
    imageUrl = typeof output[0] === 'string' ? output[0] : String(output[0]);
  }
  
  if (!imageUrl) {
    log(`  ❌ Output type: ${typeof output}`);
    log(`  ❌ Output: ${JSON.stringify(output).slice(0, 200)}`);
    throw new Error('Could not extract image URL from output');
  }
  
  return imageUrl;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  const isTestMode = MODE === 'test';
  const photoIndex = parseInt(MODE, 10);
  const isSinglePhoto = !isNaN(photoIndex) && photoIndex >= 0 && photoIndex < PACK_STARTER_PHOTOS.length;
  
  let photosToGenerate;
  let modeLabel;
  
  if (isSinglePhoto) {
    photosToGenerate = [PACK_STARTER_PHOTOS[photoIndex]];
    modeLabel = `SINGLE PHOTO ${photoIndex} (${PACK_STARTER_PHOTOS[photoIndex].name})`;
  } else if (isTestMode) {
    photosToGenerate = [PACK_STARTER_PHOTOS[0]];
    modeLabel = 'TEST (cover photo only)';
  } else {
    photosToGenerate = PACK_STARTER_PHOTOS;
    modeLabel = 'FULL (7 photos)';
  }
  
  log('═══════════════════════════════════════════════════════════════');
  log(`📦 FANVUE PACK GENERATOR — Elena "Loft Vibes" Pack 1`);
  log(`   Mode: ${modeLabel}`);
  log('═══════════════════════════════════════════════════════════════');
  
  // Check env
  if (!process.env.REPLICATE_API_TOKEN) {
    log('❌ ERROR: REPLICATE_API_TOKEN not found');
    process.exit(1);
  }
  
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    log('❌ ERROR: Cloudinary credentials not found');
    process.exit(1);
  }
  
  // Create output dir
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  // Load existing pack data if in full mode
  let packData;
  const packJsonPath = path.join(OUTPUT_DIR, 'pack-data.json');
  
  if (isTestMode && !isSinglePhoto) {
    packData = {
      packType: 'starter',
      packName: 'Loft Vibes',
      price: 3,
      currency: 'EUR',
      photos: [],
      coverPhoto: null,
      miniStory: "Chez moi 🏠",
      generatedAt: new Date().toISOString(),
    };
  } else {
    // Try to load existing data (from test mode)
    if (fs.existsSync(packJsonPath)) {
      packData = JSON.parse(fs.readFileSync(packJsonPath, 'utf-8'));
      log(`📂 Loaded existing pack data (${packData.photos.length} photos already generated)`);
    } else {
      packData = {
        packType: 'starter',
        packName: 'Loft Vibes',
        price: 3,
        currency: 'EUR',
        photos: [],
        coverPhoto: null,
        miniStory: "Chez moi 🏠",
        generatedAt: new Date().toISOString(),
      };
    }
  }
  
  try {
    // Generate photos
    for (let i = 0; i < photosToGenerate.length; i++) {
      const photoSpec = photosToGenerate[i];
      
      // Skip if already generated (in full mode, not single photo mode)
      if (!isTestMode && !isSinglePhoto && packData.photos.find(p => p.id === photoSpec.id)) {
        log(`\n⏭️  Skipping ${photoSpec.name} (already generated)`);
        continue;
      }
      
      log(`\n📸 Photo ${i + 1}/${photosToGenerate.length}: ${photoSpec.name}`);
      
      const imageUrl = await generateImage(replicate, photoSpec);
      
      // Upload to Cloudinary
      log(`  ☁️ Uploading to Cloudinary...`);
      const publicId = `elena-pack1-${photoSpec.id}-${Date.now()}`;
      const cloudinaryUrl = await uploadToCloudinary(imageUrl, publicId);
      log(`  ✅ Uploaded: ${cloudinaryUrl}`);
      
      // Save locally
      const localPath = path.join(OUTPUT_DIR, `${photoSpec.id}.jpg`);
      const imgResponse = await fetch(imageUrl);
      const imgBuffer = await imgResponse.arrayBuffer();
      fs.writeFileSync(localPath, Buffer.from(imgBuffer));
      log(`  💾 Saved locally: ${localPath}`);
      
      // Add to pack data
      const photoData = {
        id: photoSpec.id,
        name: photoSpec.name,
        cloudinaryUrl,
        localPath,
        order: packData.photos.length + 1,
      };
      
      packData.photos.push(photoData);
      
      // First photo is cover
      if (photoSpec.id === 'cover' || !packData.coverPhoto) {
        packData.coverPhoto = photoData;
      }
      
      // Save pack data after each photo (for recovery)
      fs.writeFileSync(packJsonPath, JSON.stringify(packData, null, 2));
      
      // Small delay between generations
      if (i < photosToGenerate.length - 1) {
        log(`  ⏳ Waiting 2s before next generation...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Final summary
    log('\n═══════════════════════════════════════════════════════════════');
    log('✨ GENERATION COMPLETE');
    log('═══════════════════════════════════════════════════════════════');
    log(`📦 Pack: ${packData.packName}`);
    log(`💰 Price: ${packData.price}${packData.currency}`);
    log(`📸 Photos generated: ${packData.photos.length}`);
    log(`📁 Output: ${OUTPUT_DIR}`);
    
    if (isTestMode) {
      log(`\n✅ Test photo generated! Review it and run with 'full' to generate the rest:`);
      log(`   node scripts/generate-fanvue-pack-elena.mjs full`);
      log(`\n📋 Cover photo: ${packData.coverPhoto.cloudinaryUrl}`);
    } else {
      log(`\n📋 Next steps:`);
      log(`1. Review all photos in: ${OUTPUT_DIR}`);
      log(`2. Upload cover to Fanvue: ${packData.coverPhoto.cloudinaryUrl}`);
      log(`3. Create PTV post on Fanvue with all ${packData.photos.length} photos`);
      log(`4. Use pack-data.json for reference`);
    }
    
  } catch (error) {
    log(`\n❌ ERROR: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main();

