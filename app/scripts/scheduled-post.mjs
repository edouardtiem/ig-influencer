#!/usr/bin/env node
/**
 * Scheduled Post Script — Uses schedule params from Content Brain
 * 
 * This script reads the post parameters from SCHEDULED_POST env var (JSON)
 * and generates content based on those params instead of using hardcoded themes.
 * 
 * Usage:
 *   SCHEDULED_POST='{"character":"mila",...}' node scripts/scheduled-post.mjs
 *   node scripts/scheduled-post.mjs --test  (dry run)
 */

import Replicate from 'replicate';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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

// ===========================================
// CONFIG
// ===========================================

const CAROUSEL_SIZE = 3;
const REEL_SIZE = 3;
const SECONDS_PER_PHOTO = 3;
const NANO_BANANA_MODEL = 'google/nano-banana-pro';

// ===========================================
// CHARACTER CONFIGS
// ===========================================

const CHARACTERS = {
  mila: {
    name: 'Mila',
    face_ref: 'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png',
    body_ref: 'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_5_kyx12v.png',
    extra_refs: [
      'https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_2_q8kxit.png',
      'https://res.cloudinary.com/dily60mr0/image/upload/v1764767098/Photo_3_nopedx.png',
    ],
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
    instagram_token_env: 'INSTAGRAM_ACCESS_TOKEN',
    instagram_account_env: 'INSTAGRAM_ACCOUNT_ID',
    cloudinary_folder: 'mila-scheduled',
  },
  elena: {
    name: 'Elena',
    face_ref: 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png',
    body_ref: 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png',
    extra_refs: [],
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
- Same curvy voluptuous figure (NOT skinny, NOT thin)
- Same very large natural F-cup breasts (prominent, NOT reduced)
- Same narrow defined waist
- Same wide feminine hips
- Same thick thighs
- Same healthy curvy Italian body type

CRITICAL RULES:
- Face MUST be identical to Image 1 - same person, same features
- Body proportions MUST match Image 2 - same curves, same large bust size
- Do NOT change face to look more "model-like" or angular
- Do NOT reduce bust size or body curves
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
    body_description: `curvy voluptuous figure 172cm tall,
very large natural F-cup breasts prominent and natural shape,
narrow defined waist, wide feminine hips, thick thighs,
healthy curvy Italian body, confident posture`,
    final_check: `FINAL CHECK - MUST MATCH REFERENCES:
- Face: IDENTICAL to Image 1 (soft round face, NOT angular)
- Body: IDENTICAL to Image 2 (curvy with very large bust visible)
- Hair: bronde with VISIBLE golden blonde balayage (NOT solid dark brown)
- Beauty mark: on right cheekbone MUST be visible
- Jewelry: gold chunky bracelet + layered gold necklaces`,
    instagram_token_env: 'INSTAGRAM_ACCESS_TOKEN_ELENA',
    instagram_account_env: 'INSTAGRAM_ACCOUNT_ID_ELENA',
    cloudinary_folder: 'elena-scheduled',
  },
};

// ===========================================
// EXPRESSIONS (varied for carousel/reel)
// ===========================================

const EXPRESSIONS = [
  'confident sensual gaze at camera, slight knowing smile, eyes sparkling',
  'soft inviting expression, lips slightly parted, warm feminine energy',
  'playful smirk, direct eye contact, effortless allure',
  'serene confident look, natural beauty radiating, approachable warmth',
  'pensive look gazing away, mysterious charm, caught in thought',
  'genuine relaxed smile, eyes crinkled, authentic moment',
];

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

async function urlToBase64(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return `data:image/jpeg;base64,${Buffer.from(buffer).toString('base64')}`;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ===========================================
// GENERATE IMAGE
// ===========================================

async function generateImage(character, setting, outfit, action, promptHints, index) {
  const config = CHARACTERS[character];
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  const expression = EXPRESSIONS[index % EXPRESSIONS.length];

  // Build the prompt using schedule params with explicit reference mapping
  const prompt = `${config.reference_instruction}

SUBJECT (copy from references): ${config.face_description},
${config.marks},
${config.body_description}

SETTING: ${setting}

OUTFIT: ${outfit}

ACTION: ${action}

EXPRESSION: ${expression}

${promptHints ? `ADDITIONAL HINTS: ${promptHints}` : ''}

STYLE: professional Instagram photography, natural lighting, shallow depth of field, 
high-end fashion editorial quality, authentic lifestyle moment, not posed or artificial.
Shot on Sony A7III with 85mm f/1.4 lens.

${config.final_check}`;

  log(`  Generating image ${index + 1}...`);
  log(`  Setting: ${setting.substring(0, 60)}...`);
  log(`  Outfit: ${outfit.substring(0, 60)}...`);

  // Prepare references
  const refs = [config.face_ref, config.body_ref, ...config.extra_refs].filter(Boolean);
  log(`  Converting ${refs.length} references to base64...`);
  const refBase64 = await Promise.all(refs.map(urlToBase64));

  try {
    const output = await replicate.run(NANO_BANANA_MODEL, {
      input: {
        prompt,
        negative_prompt: 'ugly, deformed, noisy, blurry, low quality, cartoon, anime, illustration, painting, drawing, watermark, text, logo, bad anatomy, extra limbs, missing limbs, floating limbs, disconnected limbs, mutation, mutated, disfigured, poorly drawn face, cloned face, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck, username, signature, words, letters',
        width: 1024,
        height: 1440,
        num_outputs: 1,
        guidance_scale: 7.5,
        num_inference_steps: 30,
        subject_images: refBase64,
      },
    });

    const imageUrl = Array.isArray(output) ? output[0] : output;
    log(`  ✅ Generated successfully`);
    return imageUrl;
  } catch (error) {
    // Try with safer prompt if flagged
    if (error.message?.includes('flagged') || error.message?.includes('safety')) {
      log(`  ⚠️ Prompt flagged, trying safer version...`);
      const saferPrompt = prompt
        .replace(/sensual/gi, 'confident')
        .replace(/sexy/gi, 'stylish')
        .replace(/cleavage/gi, 'neckline')
        .replace(/bikini/gi, 'swimwear');

      const output = await replicate.run(NANO_BANANA_MODEL, {
        input: {
          prompt: saferPrompt,
          negative_prompt: 'ugly, deformed, noisy, blurry, low quality, cartoon, anime',
          width: 1024,
          height: 1440,
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 30,
          subject_images: refBase64,
        },
      });

      const imageUrl = Array.isArray(output) ? output[0] : output;
      log(`  ✅ Generated with safer prompt`);
      return imageUrl;
    }
    throw error;
  }
}

// ===========================================
// UPLOAD TO CLOUDINARY
// ===========================================

async function uploadToCloudinary(imageUrl, character, postType, index) {
  const config = CHARACTERS[character];
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `${config.cloudinary_folder}/${postType}-${index + 1}-${timestamp}`;

  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;

  // Generate signature for signed upload
  const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash('sha1')
    .update(paramsToSign + process.env.CLOUDINARY_API_SECRET)
    .digest('hex');

  const formData = new FormData();
  formData.append('file', imageUrl);
  formData.append('public_id', publicId);
  formData.append('timestamp', timestamp.toString());
  formData.append('api_key', process.env.CLOUDINARY_API_KEY);
  formData.append('signature', signature);

  const response = await fetch(cloudinaryUrl, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  
  if (!data.secure_url) {
    throw new Error(`Cloudinary upload failed: ${JSON.stringify(data)}`);
  }
  
  log(`  ☁️ Uploaded: ${data.secure_url}`);
  return data.secure_url;
}

// ===========================================
// CREATE REEL VIDEO (slideshow)
// ===========================================

async function createReelVideo(imageUrls, character) {
  const config = CHARACTERS[character];
  const outputDir = path.join(__dirname, '..', 'generated', config.cloudinary_folder);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Download images
  const localPaths = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const response = await fetch(imageUrls[i]);
    const buffer = Buffer.from(await response.arrayBuffer());
    const localPath = path.join(outputDir, `temp-${i}.jpg`);
    fs.writeFileSync(localPath, buffer);
    localPaths.push(localPath);
  }

  // Create video with FFmpeg
  const outputPath = path.join(outputDir, `reel-${Date.now()}.mp4`);
  const inputList = localPaths.map(p => `file '${p}'`).join('\n');
  const listPath = path.join(outputDir, 'input.txt');
  
  // Each image shown for SECONDS_PER_PHOTO seconds
  const ffmpegInput = localPaths.map(p => `-loop 1 -t ${SECONDS_PER_PHOTO} -i "${p}"`).join(' ');
  const filterComplex = localPaths.map((_, i) => `[${i}:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1[v${i}]`).join(';');
  const concat = localPaths.map((_, i) => `[v${i}]`).join('') + `concat=n=${localPaths.length}:v=1:a=0[outv]`;

  const ffmpegCmd = `ffmpeg -y ${ffmpegInput} -filter_complex "${filterComplex};${concat}" -map "[outv]" -c:v libx264 -pix_fmt yuv420p -r 30 "${outputPath}"`;

  log(`🎬 Creating slideshow video...`);
  await execAsync(ffmpegCmd);
  log(`  ✅ Video created: ${outputPath}`);

  // Cleanup temp files
  localPaths.forEach(p => fs.unlinkSync(p));

  // Upload video to Cloudinary with signed upload
  const timestamp = Math.floor(Date.now() / 1000);
  const videoPublicId = `${config.cloudinary_folder}/reel-${timestamp}`;
  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload`;

  // Generate signature for signed upload
  const paramsToSign = `public_id=${videoPublicId}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash('sha1')
    .update(paramsToSign + process.env.CLOUDINARY_API_SECRET)
    .digest('hex');

  const formData = new FormData();
  formData.append('file', new Blob([fs.readFileSync(outputPath)]));
  formData.append('public_id', videoPublicId);
  formData.append('timestamp', timestamp.toString());
  formData.append('api_key', process.env.CLOUDINARY_API_KEY);
  formData.append('signature', signature);

  const response = await fetch(cloudinaryUrl, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  
  if (!data.secure_url) {
    throw new Error(`Cloudinary video upload failed: ${JSON.stringify(data)}`);
  }
  
  log(`  ☁️ Video uploaded: ${data.secure_url}`);

  // Cleanup local video
  fs.unlinkSync(outputPath);

  return data.secure_url;
}

// ===========================================
// PUBLISH TO INSTAGRAM
// ===========================================

async function publishCarousel(character, imageUrls, caption) {
  const config = CHARACTERS[character];
  const accessToken = process.env[config.instagram_token_env];
  const accountId = process.env[config.instagram_account_env];

  log(`📤 Publishing carousel to Instagram (${config.name})...`);

  // Create media containers for each image
  const containerIds = [];
  for (const url of imageUrls) {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${accountId}/media?image_url=${encodeURIComponent(url)}&is_carousel_item=true&access_token=${accessToken}`,
      { method: 'POST' }
    );
    const data = await response.json();
    if (data.id) containerIds.push(data.id);
  }

  // Create carousel container
  const carouselResponse = await fetch(
    `https://graph.facebook.com/v21.0/${accountId}/media?media_type=CAROUSEL&children=${containerIds.join(',')}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`,
    { method: 'POST' }
  );
  const carouselData = await carouselResponse.json();

  // Publish
  const publishResponse = await fetch(
    `https://graph.facebook.com/v21.0/${accountId}/media_publish?creation_id=${carouselData.id}&access_token=${accessToken}`,
    { method: 'POST' }
  );
  const publishData = await publishResponse.json();

  log(`✅ Carousel published! ID: ${publishData.id}`);
  return publishData.id;
}

async function publishReel(character, videoUrl, caption) {
  const config = CHARACTERS[character];
  const accessToken = process.env[config.instagram_token_env];
  const accountId = process.env[config.instagram_account_env];

  log(`📤 Publishing reel to Instagram (${config.name})...`);

  // Create reel container
  const containerResponse = await fetch(
    `https://graph.facebook.com/v21.0/${accountId}/media?media_type=REELS&video_url=${encodeURIComponent(videoUrl)}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`,
    { method: 'POST' }
  );
  const containerData = await containerResponse.json();
  log(`  Container created: ${containerData.id}`);

  // Wait for video processing
  log(`  ⏳ Waiting for video processing...`);
  let status = 'IN_PROGRESS';
  let attempts = 0;
  while (status === 'IN_PROGRESS' && attempts < 30) {
    await new Promise(r => setTimeout(r, 5000));
    const statusResponse = await fetch(
      `https://graph.facebook.com/v21.0/${containerData.id}?fields=status_code&access_token=${accessToken}`
    );
    const statusData = await statusResponse.json();
    status = statusData.status_code;
    process.stdout.write('.');
    attempts++;
  }
  console.log('');

  if (status !== 'FINISHED') {
    throw new Error(`Video processing failed: ${status}`);
  }
  log(`  ✅ Video processed`);

  // Publish
  const publishResponse = await fetch(
    `https://graph.facebook.com/v21.0/${accountId}/media_publish?creation_id=${containerData.id}&access_token=${accessToken}`,
    { method: 'POST' }
  );
  const publishData = await publishResponse.json();

  log(`✅ Reel published! ID: ${publishData.id}`);
  return publishData.id;
}

// ===========================================
// MAIN
// ===========================================

async function main() {
  // Parse schedule from env
  const scheduleJson = process.env.SCHEDULED_POST;
  if (!scheduleJson) {
    console.error('❌ Missing SCHEDULED_POST environment variable');
    console.error('   Usage: SCHEDULED_POST=\'{"character":"mila",...}\' node scripts/scheduled-post.mjs');
    process.exit(1);
  }

  const post = JSON.parse(scheduleJson);
  const isTest = process.argv.includes('--test');

  log('═'.repeat(60));
  log(`🎯 SCHEDULED POST — ${post.character.toUpperCase()}`);
  log('═'.repeat(60));
  log(`📍 Location: ${post.location_name}`);
  log(`📸 Type: ${post.type} ${post.reel_type ? `(${post.reel_type})` : ''}`);
  log(`👗 Outfit: ${post.outfit?.substring(0, 50)}...`);
  log(`🎬 Action: ${post.action?.substring(0, 50)}...`);
  log(`💬 Caption: ${post.caption?.substring(0, 50)}...`);

  const character = post.character;
  const config = CHARACTERS[character];
  if (!config) {
    console.error(`❌ Unknown character: ${character}`);
    process.exit(1);
  }

  // Determine content count
  const contentCount = post.type === 'reel' ? REEL_SIZE : CAROUSEL_SIZE;

  // Build setting from location
  const setting = post.prompt_hints || post.location_name;

  // Generate images
  const imageUrls = [];
  for (let i = 0; i < contentCount; i++) {
    log(`\n🎨 Generating image ${i + 1}/${contentCount}...`);
    
    // Vary the action slightly for each image
    const actionVariations = [
      post.action,
      `${post.action}, different angle`,
      `${post.action}, candid moment`,
    ];
    const action = actionVariations[i % actionVariations.length];

    const imageUrl = await generateImage(
      character,
      setting,
      post.outfit || 'stylish casual outfit appropriate for the setting',
      action,
      post.prompt_hints,
      i
    );

    // Upload to Cloudinary
    const cloudinaryUrl = await uploadToCloudinary(imageUrl, character, post.type, i);
    imageUrls.push(cloudinaryUrl);
  }

  log(`\n📸 ${contentCount} images ready`);

  // Build caption with hashtags
  let fullCaption = post.caption || 'Enjoying the moment ✨';
  if (post.hashtags && Array.isArray(post.hashtags)) {
    fullCaption += '\n\n' + post.hashtags.join(' ');
  } else {
    // Default hashtags
    const defaultHashtags = character === 'mila'
      ? '#lifestyle #fitness #paris #photography #travel'
      : '#fashion #luxurylifestyle #travel #model #paris';
    fullCaption += '\n\n' + defaultHashtags;
  }

  if (isTest) {
    log('\n🧪 TEST MODE — Not publishing to Instagram');
    log(`   Would publish: ${post.type}`);
    log(`   Images: ${imageUrls.join(', ')}`);
    log(`   Caption: ${fullCaption.substring(0, 100)}...`);
    return { success: true, test: true, imageUrls };
  }

  // Publish based on type
  let postId;
  if (post.type === 'reel') {
    // Create slideshow video and publish as reel
    const videoUrl = await createReelVideo(imageUrls, character);
    postId = await publishReel(character, videoUrl, fullCaption);
  } else {
    // Publish as carousel
    postId = await publishCarousel(character, imageUrls, fullCaption);
  }

  log('\n' + '═'.repeat(60));
  log(`✅ SUCCESS! Post ID: ${postId}`);
  log('═'.repeat(60));

  return {
    success: true,
    postId,
    character,
    type: post.type,
    imageUrls,
    caption: fullCaption,
  };
}

main().catch(err => {
  console.error('❌ ERROR:', err.message);
  process.exit(1);
});

