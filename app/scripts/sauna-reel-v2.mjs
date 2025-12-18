#!/usr/bin/env node
/**
 * Sauna Reel V2 - Clean version
 * 
 * - No steam/smoke effects
 * - No snow on hair
 * - Order: Jacuzzi → Sauna → Chalet
 * 
 * 1. Generate 3 images with Nano Banana Pro
 * 2. Generate 3 Kling clips
 * 3. Assemble with FFmpeg + music
 * 4. Publish to Instagram
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

const OUTPUT_DIR = '/Users/edouardtiem/Cursor Projects/IG-influencer/app/generated/sauna-reel-v2';
const MUSIC_PATH = '/Users/edouardtiem/Cursor Projects/IG-influencer/app/assets/music/chill-lofi.mp3';

// Face references
const FACE_REFS = [
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_2_q8kxit.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767098/Photo_3_nopedx.png',
];

// Instruction to match reference images (MUST be at start of prompt)
const REFERENCE_INSTRUCTION = `BASED ON THE PROVIDED REFERENCE IMAGES, generate the EXACT SAME PERSON with identical face features, body proportions, and distinctive marks.`;

// Detailed face description (critical for consistency)
const MILA_FACE = `oval elongated face shape with high naturally defined cheekbones,
soft feminine jawline not angular, chin slightly pointed,
copper auburn hair type 3A loose curls shoulder-length with natural volume,
almond-shaped hazel-green eyes with golden flecks,
straight nose with slightly upturned tip,
naturally full lips medium thickness, rose-nude color`;

// Distinctive marks (CRITICAL for recognition)
const MILA_MARKS = `small dark brown beauty mark 2mm above left lip corner (SIGNATURE),
medium brown beauty mark on center of right cheekbone,
light golden-brown freckles on nose bridge and cheekbones,
thin gold necklace with minimalist star pendant always visible`;

// Body description
const MILA_BODY = `slim athletic physique 168cm, Mediterranean light tan skin,
natural full feminine curves with defined waist`;

// Combined base
const MILA_BASE = `${MILA_FACE}, ${MILA_MARKS}, ${MILA_BODY}`;

const NEGATIVE = `cartoon, anime, illustration, 3D render, CGI, deformed face, deformed body, blurry, bad anatomy, extra limbs, watermark, text, logo, plastic skin, wrong hair color, straight hair, tattoos, glasses, heavy makeup, steam, smoke, fog, mist, vapor, snow on hair, wet hair`;

// ORDER: Jacuzzi → Sauna → Chalet
const SCENES = [
  {
    id: 'jacuzzi',
    imagePrompt: `${REFERENCE_INSTRUCTION}

[SUBJECT] Mila, 22 year old French woman,
${MILA_BASE},

[SETTING] Outdoor jacuzzi on luxury ski resort terrace, crystal clear water, snowy mountain peaks in background, golden hour sunset light, winter Alps landscape,

[OUTFIT] Black elegant bikini, shoulders and décolleté visible above water, dry hair styled naturally, gold star necklace visible,

[POSE] Relaxed in jacuzzi, arms resting on edge, looking at mountain view with serene expression, slight smile, peaceful moment,

[LIGHTING] Warm golden hour sunlight, soft natural lighting, mountains in soft focus behind,

[MOOD] Luxury après-ski relaxation, peaceful mountain moment, elegant wellness,

[QUALITY] ultra realistic, 8k, professional photography, sharp focus, natural skin texture,

CRITICAL: Face must match reference images exactly - same jawline, same cheekbones, same distinctive marks,

NEGATIVE: ${NEGATIVE}`,

    videoPrompt: `Outdoor mountain jacuzzi relaxation. Crystal clear water, snowy mountains behind.

The woman relaxed in the jacuzzi turns her head slowly toward camera, gives a soft peaceful smile, then looks back at the mountain view. Water gently ripples.

Subtle natural movements:
- Slow head turn
- Soft smile forming
- Arms adjusting slightly on edge
- Water surface gently moving
- Serene peaceful expression

Luxury après-ski vibes, wellness moment, golden hour warmth.`
  },
  {
    id: 'sauna',
    imagePrompt: `${REFERENCE_INSTRUCTION}

[SUBJECT] Mila, 22 year old French woman,
${MILA_BASE},

[SETTING] Luxury wooden sauna interior, warm amber lighting, cedar wood walls and benches, large window with mountain view, clean minimal spa aesthetic,

[OUTFIT] White fluffy towel wrapped elegantly, bare shoulders visible, dry hair natural and voluminous, gold star necklace,

[POSE] Seated on wooden bench, leaning back relaxed, eyes peacefully closed, serene expression, one hand resting on bench,

[LIGHTING] Warm amber interior lighting, soft glow on skin, cozy atmosphere,

[MOOD] Pure relaxation, spa wellness, peaceful retreat,

[QUALITY] ultra realistic, 8k, professional photography, sharp focus, natural skin texture,

CRITICAL: Face must match reference images exactly - same jawline, same cheekbones, same distinctive marks,

NEGATIVE: ${NEGATIVE}`,

    videoPrompt: `Luxury sauna relaxation moment. Warm wooden interior, soft amber lighting.

The woman seated in sauna takes a deep relaxed breath, opens her eyes slowly, looks at camera with a soft content smile, then closes eyes again peacefully.

Subtle movements:
- Gentle breathing
- Eyes slowly opening then closing
- Soft smile
- Slight head tilt
- Relaxed shoulders

Spa wellness aesthetic, pure relaxation, warm cozy atmosphere.`
  },
  {
    id: 'chalet',
    imagePrompt: `${REFERENCE_INSTRUCTION}

[SUBJECT] Mila, 22 year old French woman,
${MILA_BASE},

[SETTING] Cozy luxury chalet living room, roaring fireplace with dancing flames, rustic wooden beams, soft fur throws, warm golden lighting, mountain cabin interior,

[OUTFIT] Oversized cream cable knit sweater falling off one shoulder, bare legs tucked on sofa, cozy casual look, gold star necklace,

[POSE] Curled up on plush sofa by fireplace, holding ceramic mug of hot chocolate, soft genuine smile at camera, cozy relaxed posture,

[LIGHTING] Warm fireplace glow, soft golden ambient lighting, intimate cozy atmosphere,

[MOOD] Hygge comfort, après-ski cozy, winter warmth,

[QUALITY] ultra realistic, 8k, professional photography, sharp focus, natural skin texture,

CRITICAL: Face must match reference images exactly - same jawline, same cheekbones, same distinctive marks,

NEGATIVE: ${NEGATIVE}`,

    videoPrompt: `Cozy chalet fireplace moment. Warm golden lighting, crackling fire.

The woman curled up by the fire brings her mug to her lips for a gentle sip, lowers it, looks at camera with a warm cozy smile. Firelight flickers softly on her face.

Subtle movements:
- Bringing mug to lips
- Gentle sip
- Lowering mug
- Warm genuine smile
- Firelight dancing on face

Hygge aesthetic, après-ski comfort, winter cozy vibes.`
  }
];

const CAPTION = `après-ski mood 🧖‍♀️❄️

jacuzzi → sauna → fireplace
the perfect mountain day ✨

could stay here forever honestly 🔥

#aprèsski #mountainlife #skitrip #chaletlife #wellness #wintervibes #cozy #relaxation #alpinelife #luxurytravel`;

const INSTAGRAM_GRAPH_API = 'https://graph.facebook.com/v21.0';

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

async function urlToBase64(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const contentType = response.headers.get('content-type') || 'image/png';
  return `data:${contentType};base64,${base64}`;
}

function fileToBase64(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const base64 = fileBuffer.toString('base64');
  return `data:image/jpeg;base64,${base64}`;
}

function extractVideoUrl(output) {
  if (typeof output === 'string') return output;
  if (output?.url) return typeof output.url === 'function' ? output.url().href : String(output.url);
  if (output?.video) return typeof output.video === 'string' ? output.video : output.video?.url;
  if (Array.isArray(output) && output[0]) {
    const first = output[0];
    return typeof first === 'string' ? first : (first?.url || first?.video);
  }
  return null;
}

async function downloadVideo(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    const proto = url.startsWith('https') ? https : http;
    
    proto.get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          file.close();
          fs.unlinkSync(outputPath);
        downloadVideo(response.headers.location, outputPath).then(resolve).catch(reject);
          return;
        }
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }).on('error', reject);
  });
}

// ═══════════════════════════════════════════════════════════════
// NANO BANANA PRO - Image Generation
// ═══════════════════════════════════════════════════════════════

async function generateImage(client, prompt, references, sceneName) {
  console.log(`\n🎨 Generating image: ${sceneName}...`);
  
  const startTime = Date.now();
  
  const output = await client.run("google/nano-banana-pro", {
    input: {
      prompt,
      image_input: references,
      aspect_ratio: "9:16",
      resolution: "2K",
      output_format: "jpg",
      safety_filter_level: "block_only_high",
    }
  });
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  // Handle streaming output
  if (output && typeof output === 'object' && Symbol.asyncIterator in output) {
    const chunks = [];
    for await (const chunk of output) {
      if (chunk instanceof Uint8Array) chunks.push(chunk);
    }
    if (chunks.length > 0) {
      const combined = new Uint8Array(chunks.reduce((s, c) => s + c.length, 0));
      let offset = 0;
      chunks.forEach(c => { combined.set(c, offset); offset += c.length; });
      
      const imagePath = path.join(OUTPUT_DIR, `${sceneName}-${Date.now()}.jpg`);
      fs.writeFileSync(imagePath, combined);
      console.log(`   ✅ Generated in ${duration}s → ${path.basename(imagePath)}`);
      return imagePath;
    }
  }
  
  throw new Error('Unexpected output from Nano Banana Pro');
}

// ═══════════════════════════════════════════════════════════════
// KLING - Video Generation
// ═══════════════════════════════════════════════════════════════

async function generateClip(client, imagePath, videoPrompt, sceneName) {
  console.log(`\n📹 Generating clip: ${sceneName}...`);
  
  const imageInput = fileToBase64(imagePath);
  const startTime = Date.now();
  
  try {
    const output = await client.run("kwaivgi/kling-v2.5-turbo-pro", {
      input: {
        prompt: videoPrompt,
        image: imageInput,
        duration: 5,
        aspect_ratio: '9:16'
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
// FFMPEG - Assembly with Music
// ═══════════════════════════════════════════════════════════════

async function assembleReelWithMusic(clipPaths, musicPath, outputPath) {
  console.log('\n🎬 Assembling reel with FFmpeg + music...');
  
  // Step 1: Concat videos (no audio)
  const listPath = outputPath.replace('.mp4', '_list.txt');
  const content = clipPaths.map(p => `file '${p}'`).join('\n');
  fs.writeFileSync(listPath, content);
  
  const tempVideo = outputPath.replace('.mp4', '_temp.mp4');
  
  try {
    await execAsync(`ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${tempVideo}"`);
    console.log('   ✅ Videos concatenated');
    
    // Get video duration
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${tempVideo}"`
    );
    const videoDuration = parseFloat(stdout.trim());
    console.log(`   📏 Duration: ${videoDuration.toFixed(1)}s`);
    
    // Add music (video has no audio, so just add music track)
    const fadeStart = Math.max(0, videoDuration - 2);
    await execAsync(
      `ffmpeg -y -i "${tempVideo}" -i "${musicPath}" -filter_complex "[1:a]volume=0.5,afade=t=in:st=0:d=1,afade=t=out:st=${fadeStart}:d=2[aout]" -map 0:v -map "[aout]" -c:v copy -c:a aac -shortest "${outputPath}"`
    );
    
    // Cleanup
    fs.unlinkSync(listPath);
    fs.unlinkSync(tempVideo);
    
    console.log(`   ✅ Reel with music ready!`);
    return { success: true, path: outputPath };
    
  } catch (error) {
    console.log(`   ❌ FFmpeg error: ${error.message}`);
    fs.unlinkSync(listPath);
    if (fs.existsSync(tempVideo)) fs.unlinkSync(tempVideo);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// CLOUDINARY & INSTAGRAM
// ═══════════════════════════════════════════════════════════════

async function uploadToCloudinary(videoPath) {
  console.log('\n📤 Uploading to Cloudinary...');
  
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
  
  console.log('   ✅ Uploaded');
  return result.secure_url;
}

async function publishToInstagram(videoUrl, caption) {
  console.log('\n📱 Publishing to Instagram...');
  
  const params = new URLSearchParams({
    media_type: 'REELS',
    video_url: videoUrl,
    caption: caption,
    access_token: process.env.INSTAGRAM_ACCESS_TOKEN,
  });
  
  const response = await fetch(
    `${INSTAGRAM_GRAPH_API}/${process.env.INSTAGRAM_ACCOUNT_ID}/media?${params}`,
    { method: 'POST' }
  );
  
  const data = await response.json();
  if (data.error) throw new Error(`Instagram API: ${data.error.message}`);
  
  const containerId = data.id;
  console.log('   Container:', containerId);
  
  // Wait for processing
  process.stdout.write('   Processing');
  const startTime = Date.now();
  
  while (Date.now() - startTime < 120000) {
    const statusRes = await fetch(
      `${INSTAGRAM_GRAPH_API}/${containerId}?fields=status_code&access_token=${process.env.INSTAGRAM_ACCESS_TOKEN}`
    );
    const statusData = await statusRes.json();
    
    if (statusData.status_code === 'FINISHED') break;
    if (statusData.status_code === 'ERROR') throw new Error('Processing failed');
    
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 5000));
  }
  console.log(' ✅');
  
  // Publish
  const publishParams = new URLSearchParams({
    creation_id: containerId,
    access_token: process.env.INSTAGRAM_ACCESS_TOKEN,
  });
  
  const publishRes = await fetch(
    `${INSTAGRAM_GRAPH_API}/${process.env.INSTAGRAM_ACCOUNT_ID}/media_publish?${publishParams}`,
    { method: 'POST' }
  );
  
  const publishData = await publishRes.json();
  if (publishData.error) throw new Error(`Instagram API: ${publishData.error.message}`);
  
  console.log('   ✅ Published! ID:', publishData.id);
  return publishData.id;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('\n' + '█'.repeat(60));
  console.log('🧖‍♀️ SAUNA REEL V2 - Clean Version');
  console.log('   No steam/vapor | Order: Jacuzzi → Sauna → Chalet');
  console.log('█'.repeat(60));
  
  // Setup
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  const client = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  // Convert face refs to base64
  console.log('\n📷 Loading face references...');
  const faceRefs = await Promise.all(FACE_REFS.map(urlToBase64));
  console.log('   ✅ Ready');
  
  // ─────────────────────────────────────────────────────────────
  // STEP 1: Generate 3 images with Nano Banana Pro
  // ─────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('STEP 1: Generating 3 images (Nano Banana Pro)');
  console.log('═'.repeat(60));
  
  const imagePaths = [];
  let prevImageBase64 = null;
  
  for (let i = 0; i < SCENES.length; i++) {
    const scene = SCENES[i];
    
    // Use face refs + previous image for consistency
    const refs = [...faceRefs];
    if (prevImageBase64) {
      refs.unshift(prevImageBase64);
    }
    
    const imagePath = await generateImage(client, scene.imagePrompt, refs.slice(0, 4), scene.id);
    imagePaths.push(imagePath);
    
    // Store for next image consistency
    prevImageBase64 = fileToBase64(imagePath);
  }
  
  console.log(`\n✅ ${imagePaths.length}/3 images generated`);
  
  // ─────────────────────────────────────────────────────────────
  // STEP 2: Generate 3 Kling clips in parallel
  // ─────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('STEP 2: Generating 3 Kling clips (parallel)');
  console.log('═'.repeat(60));
  
  const startGen = Date.now();
  const clipUrls = await Promise.all(
    SCENES.map((scene, i) => generateClip(client, imagePaths[i], scene.videoPrompt, scene.id))
  );
  const genTime = ((Date.now() - startGen) / 1000).toFixed(1);
  
  const validClips = clipUrls.filter(url => url !== null);
  console.log(`\n⏱️  Kling time: ${genTime}s`);
  console.log(`📊 ${validClips.length}/3 clips generated`);
  
  if (validClips.length < 2) {
    console.log('\n❌ Not enough clips. Aborting.');
    process.exit(1);
  }
  
  // ─────────────────────────────────────────────────────────────
  // STEP 3: Download clips
  // ─────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('STEP 3: Downloading clips');
  console.log('═'.repeat(60));
  
  const clipPaths = [];
  for (let i = 0; i < validClips.length; i++) {
    const scene = SCENES[i];
    const localPath = path.join(OUTPUT_DIR, `${scene.id}-clip.mp4`);
    console.log(`\n📥 ${scene.id}...`);
    await downloadVideo(validClips[i], localPath);
    clipPaths.push(localPath);
    console.log('   ✅ Done');
  }
  
  // ─────────────────────────────────────────────────────────────
  // STEP 4: Assemble with music
  // ─────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('STEP 4: Assembling with music');
  console.log('═'.repeat(60));
  
  const timestamp = Date.now();
  const finalPath = path.join(OUTPUT_DIR, `sauna-reel-v2-${timestamp}.mp4`);
  const assemblyResult = await assembleReelWithMusic(clipPaths, MUSIC_PATH, finalPath);
  
  if (!assemblyResult.success) {
    console.log('❌ Assembly failed');
    process.exit(1);
  }
  
  // ─────────────────────────────────────────────────────────────
  // STEP 5: Publish
  // ─────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('STEP 5: Publishing to Instagram');
  console.log('═'.repeat(60));
  
  const videoUrl = await uploadToCloudinary(finalPath);
  const postId = await publishToInstagram(videoUrl, CAPTION);
  
  // ─────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────
  console.log('\n' + '█'.repeat(60));
  console.log('✅ SUCCESS!');
  console.log('█'.repeat(60));
  
  console.log(`\n🎨 Images: 3/3 (Nano Banana Pro)`);
  console.log(`🎬 Clips: ${validClips.length}/3 (Kling)`);
  console.log(`🎵 Music: Yes`);
  console.log(`📱 Post ID: ${postId}`);
  console.log(`💰 Cost: ~$${(1.50 + validClips.length * 0.40).toFixed(2)}`);
  console.log(`\n📂 ${finalPath}`);
  console.log('');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
