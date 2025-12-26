#!/usr/bin/env node
/**
 * Elena Vacation Reel Post Script
 * Generates 3 photos of vacation theme, creates slideshow video, posts as Reel
 * 
 * Themes rotate: spa → city → yacht → spa...
 * Posts at 21h Paris (20h UTC winter)
 * 
 * Usage: node scripts/vacation-reel-post-elena.mjs [theme] [test]
 * Themes: spa, city, yacht (or auto for daily rotation)
 */

import Replicate from 'replicate';
import { exec } from 'child_process';
import { promisify } from 'util';
import { savePostToSupabase } from './lib/supabase-helper.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local for local development
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

const SLIDESHOW_SIZE = 3; // 3 photos per reel
const SECONDS_PER_PHOTO = 3; // 3 seconds per photo = 9 seconds total
const NANO_BANANA_MODEL = 'google/nano-banana-pro';

// Elena's reference photos
const ELENA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png';
const ELENA_BODY_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png';

// ═══════════════════════════════════════════════════════════════
// ELENA CHARACTER - Ultra detailed with reference instruction
// CRITICAL: Must match provided reference images exactly
// ═══════════════════════════════════════════════════════════════

// Instruction to match reference images - EXPLICIT IMAGE MAPPING
const REFERENCE_INSTRUCTION = `You are provided with reference images in order:

**IMAGE 1 (FACE REFERENCE)**: This is Elena's face. Copy this EXACTLY:
- Same soft round pleasant face shape (NOT angular, NOT sharp jawline)
- Same smooth feminine jawline and rounded chin
- Same honey brown warm almond-shaped eyes
- Same naturally full lips nude-pink color
- Same small beauty mark on right cheekbone (SIGNATURE MARK)
- Same bronde hair with VISIBLE golden blonde balayage highlights (NOT solid dark brown)
- Same naturally thick well-groomed eyebrows

**IMAGE 2 (BODY REFERENCE)**: This is Elena's body. Match these proportions EXACTLY:
- Same feminine shapely figure (NOT skinny, NOT thin)
- Same very large natural F-cup breasts (prominent, NOT reduced)
- Same narrow defined waist
- Same wide feminine hips
- Same healthy fit Italian body type

CRITICAL RULES:
- Face MUST be identical to Image 1 - same person, same features
- Body proportions MUST match Image 2 - same curves, same large bust size
- Do NOT change face to look more "model-like" or angular
- Do NOT reduce bust size or body curves
- Hair MUST show visible golden blonde balayage highlights, NOT solid dark brown`;

// Detailed face description (critical for consistency)
const ELENA_FACE = `soft round pleasant face NOT angular, warm approachable features,
smooth feminine jawline, rounded chin, soft cheekbones,
bronde hair dark roots with golden blonde balayage, long voluminous beach waves past shoulders,
honey brown warm almond-shaped eyes, naturally thick eyebrows well-groomed,
small straight nose, naturally full lips nude-pink color`;

// Distinctive marks (CRITICAL for recognition)
const ELENA_MARKS = `small beauty mark on right cheekbone (SIGNATURE),
glowing sun-kissed Italian skin tone,
gold chunky chain bracelet on left wrist ALWAYS visible,
layered gold necklaces with medallion pendant ALWAYS visible`;

// Body description
const ELENA_BODY = `feminine shapely figure 172cm tall,
very large natural F-cup breasts prominent and natural shape,
narrow defined waist, wide feminine hips,
healthy fit Italian body, confident posture`;

// Combined base (used in prompts)
const ELENA_BASE = `${ELENA_FACE},
${ELENA_MARKS},
${ELENA_BODY}`;

// Final check to reinforce reference matching
const ELENA_FINAL_CHECK = `FINAL CHECK - MUST MATCH REFERENCES:
- Face: IDENTICAL to Image 1 (soft round face, NOT angular, warm features)
- Body: IDENTICAL to Image 2 (shapely with very large bust visible)
- Hair: bronde with VISIBLE golden blonde balayage highlights (NOT solid dark brown)
- Beauty mark: on right cheekbone MUST be visible
- Jewelry: gold chunky bracelet on wrist, layered gold necklaces`;

// ═══════════════════════════════════════════════════════════════
// VACATION THEMES - Luxury vibes
// ═══════════════════════════════════════════════════════════════

const VACATION_THEMES = {
  spa: {
    name: 'Spa / Alps Luxury',
    settings: [
      'luxury alpine spa with floor-to-ceiling windows, snowy mountains panoramic view, steam rising, wooden accents, premium atmosphere',
      'outdoor infinity pool at luxury ski resort, steaming water, snow-capped Alps backdrop, sunset golden hour, exclusive spa',
      'cozy luxury chalet lounge, roaring fireplace, fur throws, warm amber lighting, après-ski elegance',
    ],
    outfits: [
      'cream one-piece swimsuit plunging neckline showing generous cleavage, wet hair slicked back, dewy skin',
      'black designer bikini in heated pool, contrast of steam and snow, water droplets on skin',
      'oversized cream cashmere sweater slipping off one shoulder, showing bare legs, cozy luxury',
    ],
    actions: [
      'relaxing in spa looking out at mountain view, serene expression, steam around her',
      'in infinity pool edge, arms resting on ledge, gazing at snowy peaks, peaceful moment',
      'curled up on chalet sofa with wine glass, fireplace glow on face, soft smile',
    ],
    captions: [
      'Spa days in the Alps 🏔️✨ Votre spa préféré?',
      'This view > everything 🎿 Mountains or beach for you?',
      'Après-ski is my sport ♨️ Agree? 😅',
      'Mandatory mountain escape 🏔️ When was your last getaway?',
      'Living for these moments ✨ Your definition of self-care?',
      'Cozy season at its finest 🔥 Indoor or outdoor spa?',
      'Cette vue après une journée de ski >> 🏔️ Best ski resort?',
      'POV: Tu ne veux plus bouger 😌 Relatable?',
    ],
  },
  
  city: {
    name: 'City / European Capitals',
    settings: [
      'elegant Milan rooftop terrace, Duomo in background, golden hour sunset, aperitivo atmosphere, Italian luxury',
      'charming Parisian street, Haussmann buildings, café terraces, romantic evening light, Paris 8e vibes',
      'stylish Rome piazza at dusk, ancient architecture, fountain in background, warm Italian atmosphere',
    ],
    outfits: [
      'silk midi dress champagne color with deep V-neck showing cleavage, thin straps, figure-hugging, designer heels',
      'cropped blazer cream color open over bralette, high-waisted wide pants, street-luxe Parisian style',
      'backless satin top terracotta color, elegant midi skirt, Italian summer evening chic',
    ],
    actions: [
      'standing on Milan rooftop, spritz in hand, wind in hair, confident city-girl expression',
      'walking through Paris street, looking back at camera with warm smile, golden light on face',
      'sitting at Rome café terrace, espresso in hand, people-watching with knowing smile',
    ],
    captions: [
      'Milano nights 🇮🇹✨ Fashion week or just vibes?',
      'Paris mon amour 🗼 Your favourite European city?',
      'Rome state of mind 🏛️ Pizza or pasta first?',
      'Aperitivo hour is sacred 🥂 Spritz or Negroni?',
      'City lights & good nights 🌙 Best rooftop bar you\'ve been to?',
      'European summer never ends ☀️ What\'s on your bucket list?',
      'Cette terrasse >> 🌅 Recommend me a spot!',
      'Living la dolce vita ✨ Solo trip or avec les copines?',
    ],
  },
  
  yacht: {
    name: 'Yacht / Mediterranean',
    settings: [
      'luxury yacht deck in Mediterranean Sea, crystal clear turquoise water, Amalfi coast cliffs in background, golden hour',
      'yacht bow at sunset, pristine white deck, deep blue sea, Capri island silhouette, exclusive summer vibes',
      'yacht interior lounge, panoramic windows showing ocean, champagne on table, minimalist luxury décor',
    ],
    outfits: [
      'white bikini elegant cut showing curves, gold chain belt, sun-kissed skin glistening with oil, yacht luxury',
      'terracotta bikini top with matching sarong loosely wrapped, wind catching fabric, Mediterranean goddess',
      'sheer white coverup over nude bikini, barefoot on deck, effortless yacht elegance',
    ],
    actions: [
      'lying on yacht sundeck, one knee raised, sunbathing with serene expression, sea sparkling behind',
      'standing at yacht bow, arms open, hair flying in wind, looking at horizon, freedom pose',
      'lounging in yacht interior, champagne glass in hand, looking through window at sea, relaxed luxury',
    ],
    captions: [
      'Yacht life chose me ⛵ Dream vacation or reality?',
      'Mediterranean state of mind 🌊 Amalfi or Côte d\'Azur?',
      'Sea, sun, repeat ☀️ What\'s your summer anthem?',
      'Living the dream 🛥️ Boat day essentials?',
      'Salty hair, don\'t care 🌴 Beach read recommendations?',
      'Summer forever 🌅 Last trip that changed you?',
      'Cette eau turquoise >> 💙 Capri, Sardaigne ou Mykonos?',
      'POV: Tu refuses de rentrer à la réalité 😅 Who relates?',
    ],
  },
};

// ═══════════════════════════════════════════════════════════════
// EXPRESSIONS - Warm and confident
// ═══════════════════════════════════════════════════════════════

const EXPRESSIONS = [
  'warm confident gaze at camera, genuine soft smile, vacation glow',
  'serene peaceful expression, eyes gently closed, enjoying luxury moment',
  'playful inviting look, subtle knowing smile, Italian warmth',
  'soft alluring expression, lips slightly parted, dreamy atmosphere',
];

// ═══════════════════════════════════════════════════════════════
// FALLBACK - Safer versions when flagged
// ═══════════════════════════════════════════════════════════════

const SENSITIVE_REPLACEMENTS = [
  { from: /\bbare legs\b/gi, to: 'legs visible' },
  { from: /\bbare shoulders\b/gi, to: 'shoulders visible' },
  { from: /\bbackless\b/gi, to: 'elegant back detail' },
  { from: /\bbikini\b/gi, to: 'swimwear' },
  { from: /\bslipping off\b/gi, to: 'relaxed on' },
  { from: /\bsensual\b/gi, to: 'confident' },
  { from: /\bsexy\b/gi, to: 'stylish' },
  { from: /\bintimate\b/gi, to: 'cozy' },
  { from: /\bcurves\b/gi, to: 'silhouette' },
  { from: /\bsee-through\b/gi, to: 'lightweight' },
  { from: /\bglistening\b/gi, to: 'fresh' },
  { from: /\bcleavage\b/gi, to: 'neckline' },
  { from: /\bplunging\b/gi, to: 'elegant' },
];

function makeSaferPrompt(prompt) {
  let saferPrompt = prompt;
  for (const { from, to } of SENSITIVE_REPLACEMENTS) {
    saferPrompt = saferPrompt.replace(from, to);
  }
  saferPrompt = saferPrompt.replace(
    'ultra realistic',
    'ultra realistic, tasteful travel photography, editorial style'
  );
  return saferPrompt;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

function getTodayTheme() {
  // Rotate based on day of year: 0=spa, 1=city, 2=yacht
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const themes = ['spa', 'city', 'yacht'];
  return themes[dayOfYear % 3];
}

function generateCaption(theme) {
  const captions = VACATION_THEMES[theme].captions;
  const caption = randomFrom(captions);
  const hashtags = [
    '#travel', '#luxurylifestyle', '#wanderlust', '#travelgram',
    '#explore', '#lifestyle', '#italianstyle', '#summer', '#vacation', '#europeansummer',
  ];
  const selectedHashtags = hashtags.sort(() => Math.random() - 0.5).slice(0, 6);
  return `${caption}\n\n${selectedHashtags.join(' ')}`;
}

// ═══════════════════════════════════════════════════════════════
// CLOUDINARY
// ═══════════════════════════════════════════════════════════════

async function uploadToCloudinary(imageUrl, publicId) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Missing Cloudinary credentials');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'elena-vacation-reels';
  
  const crypto = await import('crypto');
  const signatureString = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

  const formData = new FormData();
  formData.append('file', imageUrl);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  formData.append('folder', folder);
  formData.append('public_id', publicId);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudinary upload failed: ${error}`);
  }

  const result = await response.json();
  return result;
}

async function uploadVideoToCloudinary(videoPath, publicId) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'elena-vacation-reels';
  
  const crypto = await import('crypto');
  const signatureString = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

  const formData = new FormData();
  const videoBuffer = fs.readFileSync(videoPath);
  formData.append('file', new Blob([videoBuffer]), 'reel.mp4');
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  formData.append('folder', folder);
  formData.append('public_id', publicId);
  formData.append('resource_type', 'video');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudinary video upload failed: ${error}`);
  }

  const result = await response.json();
  return result.secure_url;
}

// ═══════════════════════════════════════════════════════════════
// IMAGE GENERATION
// ═══════════════════════════════════════════════════════════════

async function urlToBase64(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const contentType = response.headers.get('content-type') || 'image/png';
  return `data:${contentType};base64,${base64}`;
}

async function generateImageInternal(replicate, prompt, base64Images) {
  const input = {
    prompt,
    aspect_ratio: "9:16", // Vertical for Reels
    resolution: "2K",
    output_format: "jpg",
    safety_filter_level: "block_only_high",
  };

  if (base64Images && base64Images.length > 0) {
    input.image_input = base64Images;
  }

  const output = await replicate.run(NANO_BANANA_MODEL, { input });

  if (!output) throw new Error('No output from Nano Banana Pro');

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
      const base64 = Buffer.from(combined).toString('base64');
      return `data:image/jpeg;base64,${base64}`;
    }
  }

  if (typeof output === 'string') return output;
  if (Array.isArray(output) && output[0]) return output[0];

  throw new Error('Could not process API response');
}

async function generateImage(replicate, prompt, referenceUrls) {
  log(`  Generating with ${referenceUrls.length} references...`);
  
  let base64Images = null;
  if (referenceUrls.length > 0) {
    log(`  Converting references to base64...`);
    base64Images = await Promise.all(referenceUrls.map(url => urlToBase64(url)));
  }

  try {
    return await generateImageInternal(replicate, prompt, base64Images);
  } catch (error) {
    const isSensitiveError = error.message.includes('flagged') || 
                            error.message.includes('sensitive') ||
                            error.message.includes('E005');
    
    if (isSensitiveError) {
      log(`  ⚠️ Prompt flagged, trying safer version...`);
      const saferPrompt = makeSaferPrompt(prompt);
      
      try {
        return await generateImageInternal(replicate, saferPrompt, base64Images);
      } catch (retryError) {
        if (retryError.message.includes('flagged')) {
          log(`  ⚠️ Still flagged, trying minimal prompt...`);
          
          const minimalPrompt = `${ELENA_BASE},
natural relaxed pose, luxury vacation travel photography,
wearing elegant travel outfit, beautiful destination,
soft natural lighting, authentic lifestyle moment,
ultra realistic, 8k, professional photography`;
          
          return await generateImageInternal(replicate, minimalPrompt, base64Images);
        }
        throw retryError;
      }
    }
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// SLIDESHOW VIDEO CREATION (FFmpeg)
// ═══════════════════════════════════════════════════════════════

async function createSlideshowVideo(imagePaths, outputPath) {
  log(`🎬 Creating slideshow video with FFmpeg...`);
  
  // Create a temporary file list for FFmpeg
  const listFile = path.join(path.dirname(outputPath), 'ffmpeg_list.txt');
  const listContent = imagePaths.map(p => `file '${p}'\nduration ${SECONDS_PER_PHOTO}`).join('\n');
  // Add last image again (FFmpeg concat needs it for the last duration)
  const fullContent = listContent + `\nfile '${imagePaths[imagePaths.length - 1]}'`;
  fs.writeFileSync(listFile, fullContent);

  // FFmpeg command to create slideshow with smooth transitions
  const ffmpegCmd = `ffmpeg -y -f concat -safe 0 -i "${listFile}" \
    -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30" \
    -c:v libx264 -pix_fmt yuv420p -preset fast -crf 23 \
    -t ${SLIDESHOW_SIZE * SECONDS_PER_PHOTO} \
    "${outputPath}"`;

  try {
    await execAsync(ffmpegCmd);
    log(`  ✅ Video created: ${outputPath}`);
    
    // Cleanup
    fs.unlinkSync(listFile);
    
    return outputPath;
  } catch (error) {
    log(`  ❌ FFmpeg error: ${error.message}`);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// INSTAGRAM REEL PUBLISH (ELENA)
// ═══════════════════════════════════════════════════════════════

async function publishReel(videoUrl, caption) {
  // Use ELENA credentials
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN_ELENA;
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID_ELENA;

  if (!accessToken || !accountId) {
    throw new Error('Missing Instagram ELENA credentials');
  }

  log(`📤 Publishing Reel to Instagram (Elena)...`);

  // Step 1: Create media container for Reel
  const createParams = new URLSearchParams({
    media_type: 'REELS',
    video_url: videoUrl,
    caption: caption,
    access_token: accessToken,
  });

  const createResponse = await fetch(
    `https://graph.facebook.com/v21.0/${accountId}/media?${createParams}`,
    { method: 'POST' }
  );

  const createData = await createResponse.json();
  if (createData.error) {
    throw new Error(`Instagram API: ${createData.error.message}`);
  }

  const containerId = createData.id;
  log(`  Container created: ${containerId}`);

  // Step 2: Wait for video to process
  log(`  ⏳ Waiting for video processing...`);
  const maxWaitMs = 300000; // 5 minutes for video
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const statusParams = new URLSearchParams({
      fields: 'status_code,status',
      access_token: accessToken,
    });

    const statusResponse = await fetch(
      `https://graph.facebook.com/v21.0/${containerId}?${statusParams}`
    );
    const statusData = await statusResponse.json();

    if (statusData.status_code === 'FINISHED') {
      log(`  ✅ Video processed`);
      break;
    }

    if (statusData.status_code === 'ERROR') {
      throw new Error(`Video processing failed: ${statusData.status || 'Unknown'}`);
    }

    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 5000));
  }

  // Step 3: Publish
  const publishParams = new URLSearchParams({
    creation_id: containerId,
    access_token: accessToken,
  });

  const publishResponse = await fetch(
    `https://graph.facebook.com/v21.0/${accountId}/media_publish?${publishParams}`,
    { method: 'POST' }
  );

  const publishData = await publishResponse.json();
  if (publishData.error) {
    throw new Error(`Instagram API: ${publishData.error.message}`);
  }

  return publishData.id;
}

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDER - With reference instruction for face consistency
// ═══════════════════════════════════════════════════════════════

function buildPrompt(expression, action, outfit, setting) {
  return `${REFERENCE_INSTRUCTION}

SUBJECT: Elena, 24 year old Italian woman living in Paris,
${ELENA_BASE},

EXPRESSION: ${expression},
ACTION: ${action},
OUTFIT: wearing ${outfit},

SETTING: ${setting},

STYLE: 2026 instagram style picture, ultra realistic luxury vacation photography, authentic travel moment,
8k resolution, professional photography, soft focus background,
Instagram model aesthetic, street-luxe European style, golden hour lighting,

${ELENA_FINAL_CHECK}`;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  const themeArg = process.argv[2] || 'auto';
  const isTest = process.argv[3] === 'true';
  
  const theme = themeArg === 'auto' ? getTodayTheme() : themeArg;
  
  if (!VACATION_THEMES[theme]) {
    console.error(`❌ Unknown theme: ${theme}`);
    console.log('Available: spa, city, yacht, auto');
    process.exit(1);
  }

  log(`🌟 Starting Elena Vacation Reel generation`);
  log(`🏖️ Theme: ${theme} (${VACATION_THEMES[theme].name})`);
  log(`📸 Photos: ${SLIDESHOW_SIZE}`);
  if (isTest) log('🧪 TEST MODE - will not publish');

  // Check env vars
  const requiredEnvVars = [
    'REPLICATE_API_TOKEN',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ];
  
  if (!isTest) {
    requiredEnvVars.push('INSTAGRAM_ACCESS_TOKEN_ELENA', 'INSTAGRAM_ACCOUNT_ID_ELENA');
  }

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`❌ Missing: ${envVar}`);
      process.exit(1);
    }
  }

  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  const themeConfig = VACATION_THEMES[theme];
  
  // Output directory
  const outputDir = path.join(__dirname, '..', 'generated', 'elena-vacation-reels', theme);
  fs.mkdirSync(outputDir, { recursive: true });

  try {
    // Step 1: Generate images
    const localPaths = [];
    const cloudinaryUrls = [];
    let firstImageBase64 = null;

    for (let i = 0; i < SLIDESHOW_SIZE; i++) {
      const photoNum = i + 1;
      log(`\n🎨 Generating Photo ${photoNum}/${SLIDESHOW_SIZE}...`);

      const setting = themeConfig.settings[i];
      const outfit = themeConfig.outfits[i];
      const action = themeConfig.actions[i];
      const expression = randomFrom(EXPRESSIONS);

      log(`  Setting: ${setting.slice(0, 50)}...`);
      log(`  Outfit: ${outfit.slice(0, 50)}...`);

      const prompt = buildPrompt(expression, action, outfit, setting);

      // References: face + body + first image for consistency
      const refs = [ELENA_FACE_REF, ELENA_BODY_REF];
      if (i > 0 && firstImageBase64) {
        refs.unshift(firstImageBase64);
      }

      const startTime = Date.now();
      const imageUrl = await generateImage(replicate, prompt, refs.slice(0, 4));
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      log(`  ✅ Generated in ${duration}s`);

      // Save locally for FFmpeg
      const localPath = path.join(outputDir, `${theme}-${photoNum}-${Date.now()}.jpg`);
      
      if (imageUrl.startsWith('data:')) {
        const base64Data = imageUrl.split(',')[1];
        fs.writeFileSync(localPath, Buffer.from(base64Data, 'base64'));
      } else {
        const imgResponse = await fetch(imageUrl);
        const imgBuffer = await imgResponse.arrayBuffer();
        fs.writeFileSync(localPath, Buffer.from(imgBuffer));
      }
      localPaths.push(localPath);
      log(`  💾 Saved: ${localPath}`);

      // Upload to Cloudinary
      log(`  ☁️ Uploading to Cloudinary...`);
      const publicId = `elena-${theme}-${photoNum}-${Date.now()}`;
      const cloudResult = await uploadToCloudinary(
        imageUrl.startsWith('data:') ? imageUrl : localPath,
        publicId
      );
      cloudinaryUrls.push(cloudResult.secure_url);
      log(`  ✅ Uploaded: ${cloudResult.secure_url}`);

      // Store first image for scene consistency
      if (i === 0) {
        firstImageBase64 = imageUrl.startsWith('data:') 
          ? imageUrl 
          : await urlToBase64(cloudResult.secure_url);
      }
    }

    log(`\n📸 ${localPaths.length} photos ready`);

    // Step 2: Create slideshow video with FFmpeg
    const videoPath = path.join(outputDir, `elena-${theme}-reel-${Date.now()}.mp4`);
    await createSlideshowVideo(localPaths, videoPath);

    // Step 3: Upload video to Cloudinary
    log(`\n☁️ Uploading video to Cloudinary...`);
    const videoPublicId = `elena-${theme}-reel-${Date.now()}`;
    const videoUrl = await uploadVideoToCloudinary(videoPath, videoPublicId);
    log(`  ✅ Video URL: ${videoUrl}`);

    // Step 4: Generate caption
    const caption = generateCaption(theme);
    log(`\n📝 Caption: ${caption.split('\n')[0]}`);

    // Step 5: Publish (unless test mode)
    if (isTest) {
      log('\n🧪 TEST MODE - Skipping publish');
      log('\n✅ SUCCESS (test mode)');
      console.log(JSON.stringify({
        success: true,
        test: true,
        character: 'elena',
        theme,
        imageUrls: cloudinaryUrls,
        videoUrl,
        caption,
        localVideoPath: videoPath,
      }, null, 2));
    } else {
      const postId = await publishReel(videoUrl, caption);
      log(`\n✅ PUBLISHED! Elena Reel ID: ${postId}`);
      
      // Save to Supabase
      log('💾 Saving to Supabase...');
      await savePostToSupabase({
        character: 'elena',
        instagramPostId: postId,
        postType: 'reel',
        imageUrls: cloudinaryUrls,
        caption,
        locationName: theme,
        mood: 'glamorous',
      });
      
      console.log(JSON.stringify({
        success: true,
        postId,
        character: 'elena',
        theme,
        imageUrls: cloudinaryUrls,
        videoUrl,
        caption,
      }, null, 2));
    }

  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main();

