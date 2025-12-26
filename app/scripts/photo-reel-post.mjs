#!/usr/bin/env node
/**
 * Vacation Reel Post Script
 * Generates 3 photos of vacation theme, creates slideshow video, posts as Reel
 * 
 * Themes rotate daily: ski → beach → city → ski...
 * Posts at 19h Paris (18h UTC winter)
 * 
 * Usage: node scripts/vacation-reel-post.mjs [theme] [test]
 * Themes: ski, beach, city (or auto for daily rotation)
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

// Mila's reference photos
const PRIMARY_FACE_URL = 'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png';
const FACE_REFS = [
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_2_q8kxit.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767098/Photo_3_nopedx.png',
];

// ═══════════════════════════════════════════════════════════════
// MILA CHARACTER - Ultra detailed with reference instruction
// CRITICAL: Must match provided reference images exactly
// ═══════════════════════════════════════════════════════════════

// Instruction to match reference images - EXPLICIT IMAGE MAPPING
const REFERENCE_INSTRUCTION = `You are provided with reference images in order:

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

**IMAGE 2+ (ADDITIONAL REFERENCES)**: More angles of Mila for consistency.

CRITICAL RULES:
- Face MUST be identical to Image 1 - same person, same features
- Hair MUST be copper auburn with curls (NOT straight, NOT dark brown)
- ALWAYS include the beauty mark above left lip and freckles`;

// Detailed face description (critical for consistency)
const MILA_FACE = `oval elongated face shape with high naturally defined cheekbones,
soft feminine jawline not angular, chin slightly pointed,
copper auburn hair type 3A loose curls shoulder-length with natural volume and messy texture,
almond-shaped hazel-green eyes with golden flecks, natural full eyebrows slightly arched,
straight nose with slightly upturned tip (cute nose),
naturally full lips medium thickness with subtle asymmetry, rose-nude natural color`;

// Distinctive marks (CRITICAL for recognition)
const MILA_MARKS = `small dark brown beauty mark 2mm above left lip corner (SIGNATURE),
medium brown beauty mark on center of right cheekbone,
20-25 light golden-brown freckles on nose bridge and cheekbones,
thin gold necklace with minimalist star pendant always visible`;

// Body description
const MILA_BODY = `slim athletic physique 168cm, Mediterranean light tan skin,
natural full feminine curves with defined waist,
toned but not muscular, Pilates-sculpted shoulders`;

// Combined base (used in prompts)
const MILA_BASE = `${MILA_FACE},
${MILA_MARKS},
${MILA_BODY}`;

// Final check to reinforce reference matching
const MILA_FINAL_CHECK = `FINAL CHECK - MUST MATCH REFERENCES:
- SINGLE IMAGE ONLY - NO collages, NO grids, NO patchwork, NO multiple photos combined
- Face: IDENTICAL to Image 1 (oval face, copper auburn curly hair)
- Body: slim athletic, toned with feminine curves
- Beauty mark: above left lip corner MUST be visible (SIGNATURE)
- Freckles: on nose and cheekbones
- Jewelry: thin gold necklace with star pendant`;

// ═══════════════════════════════════════════════════════════════
// VACATION THEMES - Sexy but filter-safe
// ═══════════════════════════════════════════════════════════════

const VACATION_THEMES = {
  ski: {
    name: 'Ski / Montagne',
    settings: [
      'luxury chalet sauna interior, wooden walls, warm dim lighting, steam visible, relaxed spa atmosphere',
      'outdoor jacuzzi on ski resort terrace, snowy mountains in background, sunset golden hour, steam rising',
      'cozy chalet living room, fireplace roaring, wooden beams, après-ski ambiance, warm lighting',
    ],
    outfits: [
      'white fluffy bathrobe loosely worn showing shoulders, hair damp from sauna, relaxed spa moment',
      'black bikini in outdoor jacuzzi, snow around, contrast of hot and cold, relaxed pose',
      'oversized cream cable knit sweater falling off one shoulder, bare legs tucked on sofa, cozy après-ski',
    ],
    actions: [
      'sitting in sauna, leaning back relaxed, eyes closed peacefully, steam around her',
      'in jacuzzi looking at mountains, arms resting on edge, serene expression, snow in hair',
      'curled up by fireplace with hot chocolate, cozy blanket, soft smile at camera',
    ],
    captions: [
      'Cette fois au sauna après le ski 🎿🔥 Team ski ou snowboard?',
      'Best part of skiing is the après-ski 🧖‍♀️ Agree or disagree?',
      'Chalet vibes & hot chocolate 🏔️☕ Votre boisson chaude préférée?',
      'Ski all day, spa all night ⛷️✨ Your ideal mountain day?',
      'Missing this view already 🏔️ Where\'s your happy place?',
      'Throwback to this cozy moment 🔥 Winter or summer person?',
      'Cette vue >> 🏔️ Alpes ou Pyrénées?',
      'POV: Tu ne veux plus rentrer 😅 Who can relate?',
    ],
  },
  
  beach: {
    name: 'Plage / Tropical',
    settings: [
      'paradise beach at sunset, turquoise water, palm trees, golden hour light, Maldives or Bali vibes',
      'luxury beach club daybed, white curtains flowing, ocean view, Mediterranean summer aesthetic',
      'crystal clear water beach, white sand, tropical island, perfect blue sky, vacation paradise',
    ],
    outfits: [
      'terracotta bikini elegant cut, sun-kissed skin, natural beach hair, simple gold jewelry',
      'white crochet bikini coverup over nude bikini, see-through fabric, beachy bohemian style',
      'sage green string bikini, toned body glistening with water drops, fresh from ocean swim',
    ],
    actions: [
      'walking along shoreline at sunset, water touching feet, looking back over shoulder, hair blowing',
      'lying on beach club daybed, body arched slightly, sipping coconut, relaxed sensual pose',
      'standing in shallow water, hands in wet hair, sun flare, golden hour silhouette',
    ],
    captions: [
      'Miss this view already 🌴 Votre île de rêve?',
      'Vitamin Sea loading ☀️🌊 Beach or pool person?',
      'Island state of mind 🏝️ Où partez-vous cet été?',
      'Sunsets like this >>> everything 🌅 Sunrise or sunset?',
      'Paradise found 🌺 Your bucket list destination?',
      'Salt in my hair, sand on my feet 🌊 Beach essentials?',
      'Ce bleu... 💙 Mediterranean or Caribbean vibes?',
      'POV: Tu ne veux pas rentrer 😅 Longest vacation you\'ve taken?',
    ],
  },
  
  city: {
    name: 'City / Europe',
    settings: [
      'charming Italian street in Rome, cobblestones, warm evening light, Vespa parked, romantic atmosphere',
      'rooftop terrace overlooking Barcelona, sunset colors, city lights beginning to sparkle, sophisticated vibe',
      'elegant Parisian balcony, Haussmann building facade, golden hour, wrought iron railing, romantic Paris',
    ],
    outfits: [
      'backless elegant midi dress terracotta color, strappy back detail, heels, European summer evening style',
      'fitted mini skirt white with cropped top showing midriff, casual chic city exploration look',
      'silk slip dress champagne color, thin straps, figure hugging, sophisticated city dinner outfit',
    ],
    actions: [
      'walking through Italian street, looking back at camera with inviting smile, golden light on face',
      'leaning on rooftop railing, city view behind, wind in hair, contemplative sensual expression',
      'standing on balcony, morning coffee in hand, overlooking Paris rooftops, peaceful moment',
    ],
    captions: [
      'Lost in the streets of Rome 🇮🇹 Votre ville européenne préférée?',
      'Barcelona nights 🌃✨ Best tapas spot recommendations?',
      'Paris, mon amour 🗼 Tourist spots or hidden gems?',
      'Exploring hidden corners 📸 How do you discover new places?',
      'City lights & good nights 🌙 Night owl or early bird traveler?',
      'Wanderlust mode activated ✈️ Next destination on your list?',
      'Cette rue >> 🏛️ Solo travel or with friends?',
      'Living for these moments ✨ What makes a trip memorable for you?',
    ],
  },
};

// ═══════════════════════════════════════════════════════════════
// EXPRESSIONS - Sensual vacation vibes
// ═══════════════════════════════════════════════════════════════

const EXPRESSIONS = [
  'confident relaxed gaze at camera, soft knowing smile, vacation glow',
  'serene peaceful expression, eyes slightly closed, enjoying the moment',
  'playful inviting look over shoulder, subtle smile, carefree energy',
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
  { from: /\bstring\b/gi, to: 'simple' },
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
  // Rotate based on day of year: 0=ski, 1=beach, 2=city
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const themes = ['ski', 'beach', 'city'];
  return themes[dayOfYear % 3];
}

function generateCaption(theme) {
  const captions = VACATION_THEMES[theme].captions;
  const caption = randomFrom(captions);
  const hashtags = [
    '#travel', '#vacation', '#throwback', '#wanderlust', '#travelgram',
    '#explore', '#adventure', '#lifestyle', '#frenchgirl', '#summer',
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
  const folder = 'mila-vacation-reels';
  
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
  const folder = 'mila-vacation-reels';
  
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
          
          const minimalPrompt = `${MILA_BASE},
natural relaxed pose, vacation travel photography,
wearing comfortable travel outfit, beautiful destination,
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
  // Using zoompan filter for Ken Burns effect
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
// INSTAGRAM REEL PUBLISH
// ═══════════════════════════════════════════════════════════════

async function publishReel(videoUrl, caption) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;

  if (!accessToken || !accountId) {
    throw new Error('Missing Instagram credentials');
  }

  log(`📤 Publishing Reel to Instagram...`);

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

SUBJECT: Mila, 22 year old French woman,
${MILA_BASE},

EXPRESSION: ${expression},
ACTION: ${action},
OUTFIT: wearing ${outfit},

SETTING: ${setting},

STYLE: 2026 instagram style picture, ultra realistic vacation photography, authentic travel moment,
8k resolution, professional photography, soft focus background,
Instagram aesthetic, travel influencer style, golden hour lighting,

${MILA_FINAL_CHECK}`;
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
    console.log('Available: ski, beach, city, auto');
    process.exit(1);
  }

  log(`🎬 Starting Vacation Reel generation`);
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
    requiredEnvVars.push('INSTAGRAM_ACCESS_TOKEN', 'INSTAGRAM_ACCOUNT_ID');
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
  const outputDir = path.join(__dirname, '..', 'generated', 'vacation-reels', theme);
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

      // References: face refs + first image for consistency
      const refs = [PRIMARY_FACE_URL, ...FACE_REFS.slice(0, 2)];
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
      const publicId = `${theme}-${photoNum}-${Date.now()}`;
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
    const videoPath = path.join(outputDir, `${theme}-reel-${Date.now()}.mp4`);
    await createSlideshowVideo(localPaths, videoPath);

    // Step 3: Upload video to Cloudinary
    log(`\n☁️ Uploading video to Cloudinary...`);
    const videoPublicId = `${theme}-reel-${Date.now()}`;
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
        theme,
        imageUrls: cloudinaryUrls,
        videoUrl,
        caption,
        localVideoPath: videoPath,
      }, null, 2));
    } else {
      const postId = await publishReel(videoUrl, caption);
      log(`\n✅ PUBLISHED! Reel ID: ${postId}`);
      
      // Save to Supabase
      log('💾 Saving to Supabase...');
      await savePostToSupabase({
        character: 'mila',
        instagramPostId: postId,
        postType: 'reel',
        imageUrls: cloudinaryUrls,
        caption,
        locationName: theme,
        mood: 'adventure',
      });
      
      console.log(JSON.stringify({
        success: true,
        postId,
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

