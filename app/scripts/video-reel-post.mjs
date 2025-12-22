#!/usr/bin/env node
/**
 * Video Reel Post — Animated Reel with Kling
 * 
 * Pipeline:
 * 1. Generate 3 images with Nano Banana Pro
 * 2. Animate each with Kling v2.5 Turbo Pro (REAL-TIME SPEED)
 * 3. Assemble with FFmpeg + music
 * 4. Publish to Instagram as Reel
 * 
 * Usage:
 *   node scripts/video-reel-post.mjs [theme]
 *   Themes: spa, fitness, lifestyle, travel (or auto)
 */

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env
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

const OUTPUT_DIR = path.join(__dirname, '..', 'generated', 'video-reels');
const MUSIC_PATH = path.join(__dirname, '..', 'assets', 'music', 'chill-lofi.mp3');

// Mila face references
const MILA_FACE_REFS = [
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_2_q8kxit.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767098/Photo_3_nopedx.png',
];

// Instruction to match reference images - EXPLICIT IMAGE MAPPING
const REFERENCE_INSTRUCTION = `You are provided with reference images in order:

**IMAGE 1 (FACE REFERENCE)**: This is Mila's face. Copy this EXACTLY:
- Same oval elongated face shape with high cheekbones
- Same soft feminine jawline (not angular), slightly pointed chin
- Same copper auburn hair with type 3A loose curls, shoulder-length
- Same almond-shaped hazel-green eyes with golden flecks
- Same straight nose with slightly upturned tip
- Same naturally full lips with subtle asymmetry
- Same small dark brown beauty mark 2mm above left lip corner (SIGNATURE)
- Same beauty mark on center of right cheekbone
- Same golden-brown freckles on nose and cheekbones

**IMAGE 2+ (ADDITIONAL REFERENCES)**: More angles of Mila for consistency.

CRITICAL RULES:
- Face MUST be identical to Image 1 - same person, same features
- Hair MUST be copper auburn with curls (NOT straight, NOT dark brown)
- ALWAYS include the beauty mark above left lip and freckles`;

const MILA_FACE = `oval elongated face shape with high naturally defined cheekbones,
soft feminine jawline not angular, chin slightly pointed,
copper auburn hair type 3A loose curls shoulder-length with natural volume,
almond-shaped hazel-green eyes with golden flecks,
straight nose with slightly upturned tip,
naturally full lips medium thickness, rose-nude color`;

const MILA_MARKS = `small dark brown beauty mark 2mm above left lip corner (SIGNATURE),
medium brown beauty mark on center of right cheekbone,
light golden-brown freckles on nose bridge and cheekbones,
thin gold necklace with minimalist star pendant always visible`;

const MILA_BODY = `slim athletic physique 168cm, Mediterranean light tan skin,
natural full feminine curves with defined waist`;

const MILA_BASE = `${MILA_FACE}, ${MILA_MARKS}, ${MILA_BODY}`;

// Final check to reinforce reference matching
const MILA_FINAL_CHECK = `FINAL CHECK - MUST MATCH REFERENCES:
- Face: IDENTICAL to Image 1 (oval face, copper auburn curly hair)
- Body: slim athletic, toned with feminine curves
- Beauty mark: above left lip corner MUST be visible (SIGNATURE)
- Freckles: on nose and cheekbones
- Jewelry: thin gold necklace with star pendant`;

const NEGATIVE = `cartoon, anime, illustration, 3D render, CGI, deformed face, deformed body, blurry, bad anatomy, extra limbs, watermark, text, logo, plastic skin, wrong hair color, straight hair, tattoos, glasses, heavy makeup`;

// ═══════════════════════════════════════════════════════════════
// KLING VIDEO PROMPT TEMPLATE
// CRITICAL: Always specify REAL-TIME SPEED, no slow motion
// ═══════════════════════════════════════════════════════════════

const VIDEO_PROMPT_TEMPLATE = (action, setting, mood) => `${setting}

${action}

IMPORTANT SPEED INSTRUCTIONS:
- REAL-TIME SPEED, normal pace, NO SLOW MOTION
- Natural human movement speed
- Quick, energetic transitions
- Instagram Reel pacing

Movements should be:
- Natural and fluid
- At normal human speed
- Dynamic and engaging
- ${mood}`;

// ═══════════════════════════════════════════════════════════════
// THEMES — Different scenarios for variety
// ═══════════════════════════════════════════════════════════════

const THEMES = {
  fitness: {
    name: 'Fitness',
    scenes: [
      {
        id: 'gym_warmup',
        setting: 'Modern premium gym, natural light, mirror wall',
        outfit: 'Black sports bra and high-waisted leggings, hair in ponytail',
        action: 'Dynamic stretching, arms reaching up then touching toes',
        videoAction: 'The woman stretches dynamically - reaches arms overhead, then bends to touch toes in one fluid motion. Quick, energetic movement.',
        mood: 'energetic, determined, athletic',
      },
      {
        id: 'gym_workout',
        setting: 'Gym equipment area, weights visible, motivational atmosphere',
        outfit: 'Matching workout set, sneakers visible',
        action: 'Mid-squat position with dumbbells, focused expression',
        videoAction: 'The woman performs a squat rep - down and up in normal speed, controlled but dynamic. Muscles engaged, breathing visible.',
        mood: 'powerful, focused, strong',
      },
      {
        id: 'gym_finish',
        setting: 'Gym locker room or mirror, post-workout glow',
        outfit: 'Sports bra, towel around neck, slight sweat glow',
        action: 'Mirror selfie pose, proud smile, flexing slightly',
        videoAction: 'The woman takes a quick mirror selfie - adjusts hair, smiles at camera, gives a small flex. Playful and confident.',
        mood: 'proud, accomplished, playful',
      },
    ],
    caption: `gym day never skip 💪 who's hitting the gym today?`,
    hashtags: '#gymgirl #fitnessmotivation #legday #workoutmotivation #gymlife #fitnessjourney #strongwomen #workoutinspo #fitgirl #gymmotivation #healthylifestyle #fitnessaddict',
  },

  spa: {
    name: 'Spa & Wellness',
    scenes: [
      {
        id: 'spa_pool',
        setting: 'Outdoor infinity pool or jacuzzi, mountain or garden view',
        outfit: 'Elegant bikini, shoulders visible above water',
        action: 'Relaxed in water, looking at scenic view',
        videoAction: 'The woman turns her head from the view toward camera, gives a serene smile, then looks back. Water ripples gently.',
        mood: 'peaceful, luxurious, serene',
      },
      {
        id: 'spa_relax',
        setting: 'Luxury spa interior, warm ambient lighting',
        outfit: 'White fluffy robe or towel, natural look',
        action: 'Eyes closed in relaxation, peaceful expression',
        videoAction: 'The woman takes a deep breath, opens eyes slowly, smiles contentedly at camera. Relaxed shoulders.',
        mood: 'zen, peaceful, refreshed',
      },
      {
        id: 'spa_cozy',
        setting: 'Cozy lounge area, fireplace or candles, soft textures',
        outfit: 'Oversized sweater or robe, holding warm drink',
        action: 'Curled up with drink, warm smile',
        videoAction: 'The woman brings cup to lips, takes a sip, lowers it and smiles warmly at camera. Cozy atmosphere.',
        mood: 'cozy, warm, content',
      },
    ],
    caption: `spa day was needed 🧖‍♀️ how do you recharge?`,
    hashtags: '#spaday #selfcare #wellness #relaxation #selflove #treatyourself #weekendvibes #pampering #luxurylifestyle #wellbeing #relaxing #selfcaresunday',
  },

  lifestyle: {
    name: 'Lifestyle',
    scenes: [
      {
        id: 'morning_coffee',
        setting: 'Sunny apartment or café terrace, morning light',
        outfit: 'Casual chic - loungewear or simple dress',
        action: 'Enjoying morning coffee, peaceful moment',
        videoAction: 'The woman holds coffee cup, takes a sip, looks out window with a soft smile. Morning light on face.',
        mood: 'peaceful, content, casual',
      },
      {
        id: 'getting_ready',
        setting: 'Bedroom or vanity, natural daylight',
        outfit: 'Casual outfit, doing final touches',
        action: 'Adjusting outfit or hair in mirror',
        videoAction: 'The woman checks herself in mirror, adjusts hair or collar, gives an approving nod and smile. Quick and confident.',
        mood: 'confident, ready, stylish',
      },
      {
        id: 'street_walk',
        setting: 'Paris street, Haussmann buildings, golden hour',
        outfit: 'Chic street style - coat or blazer',
        action: 'Walking confidently, hair moving',
        videoAction: 'The woman walks toward camera with confident stride, hair bouncing slightly. Gives a knowing smile as she passes.',
        mood: 'chic, confident, Parisian',
      },
    ],
    caption: `paris mornings ☀️ what's your morning routine?`,
    hashtags: '#parislife #morningroutine #lifestyleblogger #parisian #dailylife #aesthetic #casualstyle #goodmorning #coffeetime #parisienne #streetstyle #ootd',
  },

  travel: {
    name: 'Travel',
    scenes: [
      {
        id: 'arrival',
        setting: 'Airport or train station, travel atmosphere',
        outfit: 'Chic travel look - comfortable but stylish',
        action: 'Walking through terminal, travel excitement',
        videoAction: 'The woman walks through terminal pulling small luggage, looks around excitedly, smiles at camera. Travel energy.',
        mood: 'excited, adventurous, chic',
      },
      {
        id: 'destination',
        setting: 'Beautiful destination view - beach, mountains, or cityscape',
        outfit: 'Vacation appropriate outfit',
        action: 'Taking in the view, arms open or hands on railing',
        videoAction: 'The woman takes in the stunning view, turns to camera with amazed expression, gestures to the view behind her.',
        mood: 'amazed, grateful, adventurous',
      },
      {
        id: 'vacation_moment',
        setting: 'Resort, beach, or scenic spot',
        outfit: 'Vacation style - sundress or swimwear',
        action: 'Relaxed vacation pose, genuine smile',
        videoAction: 'The woman enjoys the moment - hair in wind, genuine laugh, twirls slightly or adjusts sunglasses playfully.',
        mood: 'happy, carefree, vacation mode',
      },
    ],
    caption: `take me back ✈️ where should I go next?`,
    hashtags: '#travelgram #wanderlust #vacation #travellife #explore #travelphotography #traveladdict #instatravel #travelblogger #adventure #holiday #traveling',
  },
};

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

function fileToBase64(filePath) {
  const buffer = fs.readFileSync(filePath);
  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}

function extractVideoUrl(output) {
  if (typeof output === 'string') return output;
  if (Array.isArray(output) && output[0]) return output[0];
  if (output?.output) return output.output;
  return null;
}

async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    proto.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(destPath); });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// NANO BANANA PRO — Image Generation
// ═══════════════════════════════════════════════════════════════

async function generateImage(client, scene, outputDir, sceneName) {
  console.log(`\n📸 Generating image: ${sceneName}...`);
  
  const prompt = `${REFERENCE_INSTRUCTION}

[SUBJECT] Mila, 22 year old French woman,
${MILA_BASE},

[SETTING] ${scene.setting},

[OUTFIT] ${scene.outfit},

[POSE] ${scene.action},

[MOOD] ${scene.mood},

[QUALITY] ultra realistic, 8k, professional photography, sharp focus, natural skin texture,

${MILA_FINAL_CHECK},

NEGATIVE: ${NEGATIVE}`;

  const startTime = Date.now();
  
  const output = await client.run('google/nano-banana-pro', {
    input: {
      prompt,
      negative_prompt: NEGATIVE,
      num_inference_steps: 28,
      guidance_scale: 7,
      image_size: '9:16',
      reference_images: MILA_FACE_REFS,
      reference_strength: 0.85,
    }
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  if (output && output[0]) {
    let imageData;
    if (typeof output[0] === 'string' && output[0].startsWith('data:')) {
      imageData = Buffer.from(output[0].split(',')[1], 'base64');
    } else if (typeof output[0] === 'object' && output[0].data) {
      imageData = Buffer.from(output[0].data, 'base64');
    }

    if (imageData) {
      const imagePath = path.join(outputDir, `${sceneName}-${Date.now()}.jpg`);
      fs.writeFileSync(imagePath, imageData);
      console.log(`   ✅ Generated in ${duration}s → ${path.basename(imagePath)}`);
      return imagePath;
    }
  }

  throw new Error('Unexpected output from Nano Banana Pro');
}

// ═══════════════════════════════════════════════════════════════
// KLING — Video Generation (REAL-TIME SPEED)
// ═══════════════════════════════════════════════════════════════

async function generateClip(client, imagePath, scene, sceneName) {
  console.log(`\n📹 Generating clip: ${sceneName}...`);
  
  const imageInput = fileToBase64(imagePath);
  const startTime = Date.now();
  
  // Build video prompt with REAL-TIME SPEED instruction
  const videoPrompt = VIDEO_PROMPT_TEMPLATE(
    scene.videoAction,
    scene.setting,
    scene.mood
  );
  
  try {
    const output = await client.run("kwaivgi/kling-v2.5-turbo-pro", {
      input: {
        prompt: videoPrompt,
        image: imageInput,
        duration: 5,
        aspect_ratio: '9:16',
        // Note: No slow-motion parameter - Kling defaults to normal speed
      }
    });
    
    const url = extractVideoUrl(output);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (!url) {
      console.log(`   ❌ No URL returned`);
      return null;
    }
    
    console.log(`   ✅ Done in ${duration}s`);
    return url;
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message.slice(0, 50)}`);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// FFMPEG — Assembly with Music
// ═══════════════════════════════════════════════════════════════

async function assembleReelWithMusic(clipPaths, musicPath, outputPath) {
  console.log('\n🎬 Assembling reel with FFmpeg + music...');
  
  const listPath = outputPath.replace('.mp4', '_list.txt');
  const content = clipPaths.map(p => `file '${p}'`).join('\n');
  fs.writeFileSync(listPath, content);
  
  const tempVideo = outputPath.replace('.mp4', '_temp.mp4');
  
  try {
    await execAsync(`ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${tempVideo}"`);
    console.log('   ✅ Videos concatenated');
    
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${tempVideo}"`
    );
    const videoDuration = parseFloat(stdout.trim());
    console.log(`   📏 Duration: ${videoDuration.toFixed(1)}s`);
    
    const fadeStart = Math.max(0, videoDuration - 2);
    await execAsync(
      `ffmpeg -y -i "${tempVideo}" -i "${musicPath}" -filter_complex "[1:a]volume=0.5,afade=t=in:st=0:d=1,afade=t=out:st=${fadeStart}:d=2[aout]" -map 0:v -map "[aout]" -c:v copy -c:a aac -shortest "${outputPath}"`
    );
    
    fs.unlinkSync(listPath);
    fs.unlinkSync(tempVideo);
    
    console.log('   ✅ Reel assembled with music');
    return outputPath;
    
  } catch (error) {
    console.log(`   ❌ FFmpeg error: ${error.message}`);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// CLOUDINARY UPLOAD
// ═══════════════════════════════════════════════════════════════

async function uploadToCloudinary(videoPath) {
  console.log('\n☁️  Uploading to Cloudinary...');
  
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  const result = await cloudinary.uploader.upload(videoPath, {
    folder: 'mila-verne/reels',
    resource_type: 'video',
    unique_filename: true,
  });
  
  console.log(`   ✅ Uploaded: ${result.secure_url}`);
  return result.secure_url;
}

// ═══════════════════════════════════════════════════════════════
// INSTAGRAM POST
// ═══════════════════════════════════════════════════════════════

async function postToInstagram(videoUrl, caption, hashtags) {
  console.log('\n📱 Posting to Instagram...');
  
  const accessToken = process.env.IG_ACCESS_TOKEN;
  const igUserId = process.env.IG_USER_ID;
  
  if (!accessToken || !igUserId) {
    console.log('   ⚠️  Missing Instagram credentials - skipping post');
    return null;
  }
  
  const fullCaption = `${caption}\n\n${hashtags}`;
  
  // Create container
  const createUrl = `https://graph.facebook.com/v21.0/${igUserId}/media`;
  const createParams = new URLSearchParams({
    media_type: 'REELS',
    video_url: videoUrl,
    caption: fullCaption,
    access_token: accessToken,
  });
  
  const createRes = await fetch(createUrl, {
    method: 'POST',
    body: createParams,
  });
  const createData = await createRes.json();
  
  if (!createData.id) {
    console.log(`   ❌ Container error: ${JSON.stringify(createData)}`);
    return null;
  }
  
  const containerId = createData.id;
  console.log(`   📦 Container: ${containerId}`);
  
  // Wait for processing
  console.log('   ⏳ Waiting for video processing...');
  let status = 'IN_PROGRESS';
  let attempts = 0;
  
  while (status === 'IN_PROGRESS' && attempts < 30) {
    await new Promise(r => setTimeout(r, 10000));
    
    const statusRes = await fetch(
      `https://graph.facebook.com/v21.0/${containerId}?fields=status_code&access_token=${accessToken}`
    );
    const statusData = await statusRes.json();
    status = statusData.status_code;
    attempts++;
    console.log(`   Status: ${status} (attempt ${attempts})`);
  }
  
  if (status !== 'FINISHED') {
    console.log(`   ❌ Processing failed: ${status}`);
    return null;
  }
  
  // Publish
  const publishUrl = `https://graph.facebook.com/v21.0/${igUserId}/media_publish`;
  const publishParams = new URLSearchParams({
    creation_id: containerId,
    access_token: accessToken,
  });
  
  const publishRes = await fetch(publishUrl, {
    method: 'POST',
    body: publishParams,
  });
  const publishData = await publishRes.json();
  
  if (publishData.id) {
    console.log(`   ✅ Posted! ID: ${publishData.id}`);
    return publishData.id;
  }
  
  console.log(`   ❌ Publish error: ${JSON.stringify(publishData)}`);
  return null;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('🎬 VIDEO REEL POST — Kling v2.5 (Real-Time Speed)');
  console.log('═'.repeat(60));
  
  // Parse args
  const args = process.argv.slice(2);
  let themeName = args[0]?.toLowerCase() || 'auto';
  const testMode = args.includes('test') || args.includes('--test');
  
  // Auto-select theme based on day
  if (themeName === 'auto') {
    const themes = Object.keys(THEMES);
    const dayIndex = new Date().getDay();
    themeName = themes[dayIndex % themes.length];
  }
  
  const theme = THEMES[themeName];
  if (!theme) {
    console.error(`❌ Unknown theme: ${themeName}`);
    console.error(`Available: ${Object.keys(THEMES).join(', ')}`);
    process.exit(1);
  }
  
  console.log(`\n📋 Theme: ${theme.name}`);
  console.log(`🎯 Scenes: ${theme.scenes.map(s => s.id).join(' → ')}`);
  console.log(`⏱️  Speed: REAL-TIME (no slow motion)`);
  
  // Create output dir
  const timestamp = Date.now();
  const outputDir = path.join(OUTPUT_DIR, `${themeName}-${timestamp}`);
  fs.mkdirSync(outputDir, { recursive: true });
  
  // Initialize Replicate
  const client = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  // STEP 1: Generate images
  console.log('\n' + '─'.repeat(60));
  console.log('STEP 1: Generating 3 images (Nano Banana Pro)');
  console.log('─'.repeat(60));
  
  const imagePaths = [];
  for (const scene of theme.scenes) {
    try {
      const imgPath = await generateImage(client, scene, outputDir, scene.id);
      imagePaths.push({ path: imgPath, scene });
    } catch (err) {
      console.log(`   ❌ Failed: ${err.message}`);
    }
  }
  
  if (imagePaths.length < 3) {
    console.log(`\n⚠️  Only ${imagePaths.length}/3 images generated`);
    if (imagePaths.length === 0) process.exit(1);
  }
  
  // STEP 2: Generate Kling clips
  console.log('\n' + '─'.repeat(60));
  console.log('STEP 2: Generating Kling clips (REAL-TIME SPEED)');
  console.log('─'.repeat(60));
  
  const clipUrls = await Promise.all(
    imagePaths.map(({ path: imgPath, scene }) => 
      generateClip(client, imgPath, scene, scene.id)
    )
  );
  
  const validClips = clipUrls.filter(url => url !== null);
  console.log(`\n📊 ${validClips.length}/${imagePaths.length} clips generated`);
  
  if (validClips.length === 0) {
    console.log('❌ No clips generated - exiting');
    process.exit(1);
  }
  
  // STEP 3: Download clips
  console.log('\n' + '─'.repeat(60));
  console.log('STEP 3: Downloading clips');
  console.log('─'.repeat(60));
  
  const clipPaths = [];
  for (let i = 0; i < validClips.length; i++) {
    const clipPath = path.join(outputDir, `clip-${i + 1}.mp4`);
    await downloadFile(validClips[i], clipPath);
    clipPaths.push(clipPath);
    console.log(`   ✅ Downloaded clip ${i + 1}`);
  }
  
  // STEP 4: Assemble reel
  console.log('\n' + '─'.repeat(60));
  console.log('STEP 4: Assembling reel with music');
  console.log('─'.repeat(60));
  
  const reelPath = path.join(outputDir, `reel-${timestamp}.mp4`);
  await assembleReelWithMusic(clipPaths, MUSIC_PATH, reelPath);
  
  // STEP 5: Upload and post
  if (testMode) {
    console.log('\n' + '─'.repeat(60));
    console.log('TEST MODE — Skipping upload and post');
    console.log('─'.repeat(60));
    console.log(`\n📁 Reel saved: ${reelPath}`);
  } else {
    console.log('\n' + '─'.repeat(60));
    console.log('STEP 5: Upload & Post to Instagram');
    console.log('─'.repeat(60));
    
    const videoUrl = await uploadToCloudinary(reelPath);
    const postId = await postToInstagram(videoUrl, theme.caption, theme.hashtags);
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ VIDEO REEL COMPLETE!');
    console.log('═'.repeat(60));
    console.log(`📁 Local: ${reelPath}`);
    console.log(`☁️  Cloud: ${videoUrl}`);
    if (postId) console.log(`📱 Post ID: ${postId}`);
  }
}

main().catch(console.error);
