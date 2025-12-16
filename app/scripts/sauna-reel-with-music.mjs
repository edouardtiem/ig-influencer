#!/usr/bin/env node
/**
 * Sauna Reel with Music
 * 
 * 1. Generate 3 Kling clips from ski/sauna images
 * 2. Assemble with FFmpeg + music
 * 3. Publish to Instagram
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

const IMAGES = [
  {
    id: 'sauna',
    path: '/Users/edouardtiem/Cursor Projects/IG-influencer/app/generated/vacation-reels/ski/ski-1-1765793925596.jpg',
    prompt: `Luxury sauna relaxation moment. Warm wooden interior, steam rising gently.

The woman in a white fluffy bathrobe takes a deep relaxed breath, closes her eyes peacefully, tilts her head back slightly enjoying the warmth. Steam swirls around her.

Subtle movements:
- Gentle breathing visible
- Hair slightly damp, natural movement
- Peaceful serene expression
- Steam drifting slowly

Spa relaxation aesthetic, wellness content, cozy warm atmosphere.`
  },
  {
    id: 'jacuzzi',
    path: '/Users/edouardtiem/Cursor Projects/IG-influencer/app/generated/vacation-reels/ski/ski-2-1765794053885.jpg',
    prompt: `Outdoor mountain jacuzzi moment. Snowy mountains in background, steam rising.

The woman in the hot tub looks out at the mountain view, turns slightly toward camera with a soft satisfied smile, then looks back at the scenery. Water bubbles around her.

Natural movements:
- Slight body turn
- Hair moving gently
- Steam rising from hot water
- Peaceful dreamy expression
- Snow-capped mountains behind

Luxury ski resort vibes, après-ski relaxation, contrast of hot and cold.`
  },
  {
    id: 'chalet',
    path: '/Users/edouardtiem/Cursor Projects/IG-influencer/app/generated/vacation-reels/ski/ski-3-1765794111195.jpg',
    prompt: `Cozy chalet fireplace moment. Warm golden lighting, crackling fire.

The woman curled up by the fire holds her hot drink, takes a gentle sip, then looks at camera with a soft cozy smile. Firelight flickers on her face.

Subtle movements:
- Bringing mug to lips
- Steam from hot drink
- Firelight dancing on face
- Warm content expression
- Cozy blanket slight adjustment

Hygge aesthetic, après-ski cozy vibes, winter comfort.`
  }
];

const MUSIC_PATH = '/Users/edouardtiem/Cursor Projects/IG-influencer/app/assets/music/chill-lofi.mp3';
const OUTPUT_DIR = '/Users/edouardtiem/Cursor Projects/IG-influencer/app/generated/sauna-reel';

const CAPTION = `après-ski mood 🧖‍♀️❄️

sauna → jacuzzi → fireplace
the holy trinity of mountain relaxation ✨

who needs the slopes when you have this? 🔥

#aprèsski #saunatime #mountainlife #skitrip #relaxation #wintervibes #chaletlife #wellness #cozy #winterwonderland`;

const INSTAGRAM_GRAPH_API = 'https://graph.facebook.com/v21.0';

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function fileToBase64(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const base64 = fileBuffer.toString('base64');
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
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
    const protocol = url.startsWith('https') ? https : http;
    
    const request = (currentUrl) => {
      const proto = currentUrl.startsWith('https') ? https : http;
      proto.get(currentUrl, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          file.close();
          fs.unlinkSync(outputPath);
          const newFile = fs.createWriteStream(outputPath);
          const newProto = response.headers.location.startsWith('https') ? https : http;
          newProto.get(response.headers.location, (res) => {
            res.pipe(newFile);
            newFile.on('finish', () => { newFile.close(); resolve(); });
          }).on('error', reject);
          return;
        }
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }).on('error', reject);
    };
    
    request(url);
  });
}

// ═══════════════════════════════════════════════════════════════
// KLING GENERATION
// ═══════════════════════════════════════════════════════════════

async function generateClip(client, image, index) {
  console.log(`\n📹 Generating clip ${index + 1}/3: ${image.id}...`);
  console.log(`   Image: ${path.basename(image.path)}`);
  console.log(`   Prompt: ${image.prompt.slice(0, 60)}...`);
  
  const imageInput = fileToBase64(image.path);
  const startTime = Date.now();
  
  try {
    const output = await client.run("kwaivgi/kling-v2.5-turbo-pro", {
      input: {
        prompt: image.prompt,
        image: imageInput,
        duration: 5,
        aspect_ratio: '9:16'
      }
    });
    
    const url = extractVideoUrl(output);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (!url) {
      console.log(`   ❌ No URL returned`);
      return { success: false, id: image.id };
    }
    
    console.log(`   ✅ Done in ${duration}s`);
    return { success: true, id: image.id, url, duration };
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message.slice(0, 50)}`);
    return { success: false, id: image.id, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// FFMPEG WITH MUSIC
// ═══════════════════════════════════════════════════════════════

async function assembleReelWithMusic(clipPaths, musicPath, outputPath) {
  console.log('\n🎬 Assembling reel with FFmpeg + music...');
  
  // Step 1: Concat videos
  const listPath = outputPath.replace('.mp4', '_list.txt');
  const content = clipPaths.map(p => `file '${p}'`).join('\n');
  fs.writeFileSync(listPath, content);
  
  const tempVideo = outputPath.replace('.mp4', '_temp.mp4');
  
  try {
    // Concat without audio
    await execAsync(`ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${tempVideo}"`);
    console.log('   ✅ Videos concatenated');
    
    // Get video duration
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${tempVideo}"`
    );
    const videoDuration = parseFloat(stdout.trim());
    console.log(`   📏 Video duration: ${videoDuration.toFixed(1)}s`);
    
    // Add music with fade out at end
    const fadeStart = Math.max(0, videoDuration - 2);
    await execAsync(
      `ffmpeg -y -i "${tempVideo}" -i "${musicPath}" -filter_complex "[1:a]volume=0.4,afade=t=out:st=${fadeStart}:d=2[music];[0:a][music]amix=inputs=2:duration=first:weights=1 0.5[aout]" -map 0:v -map "[aout]" -c:v copy -c:a aac -shortest "${outputPath}"`
    );
    
    // Cleanup
    fs.unlinkSync(listPath);
    fs.unlinkSync(tempVideo);
    
    console.log(`   ✅ Reel with music: ${path.basename(outputPath)}`);
    return { success: true, path: outputPath };
    
  } catch (error) {
    // Fallback: just concat without music if audio fails
    console.log(`   ⚠️ Music mix failed, trying simple concat...`);
    try {
      await execAsync(`ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`);
      fs.unlinkSync(listPath);
      if (fs.existsSync(tempVideo)) fs.unlinkSync(tempVideo);
      return { success: true, path: outputPath, noMusic: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
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
  
  console.log('   ✅ Uploaded:', result.secure_url);
  return result.secure_url;
}

async function publishToInstagram(videoUrl, caption) {
  console.log('\n📱 Publishing to Instagram...');
  
  // Create container
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
  console.log('   ✅ Container:', containerId);
  
  // Wait for processing
  console.log('   ⏳ Processing...');
  const startTime = Date.now();
  const maxWait = 120000;
  
  while (Date.now() - startTime < maxWait) {
    const statusParams = new URLSearchParams({
      fields: 'status_code,status',
      access_token: process.env.INSTAGRAM_ACCESS_TOKEN,
    });
    
    const statusRes = await fetch(`${INSTAGRAM_GRAPH_API}/${containerId}?${statusParams}`);
    const statusData = await statusRes.json();
    
    if (statusData.status_code === 'FINISHED') break;
    if (statusData.status_code === 'ERROR') throw new Error(`Processing failed: ${statusData.status}`);
    
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
  
  console.log('   ✅ Published! Post ID:', publishData.id);
  return publishData.id;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('\n' + '█'.repeat(60));
  console.log('🧖‍♀️ SAUNA REEL WITH MUSIC');
  console.log('   3 clips → FFmpeg + lofi → Instagram');
  console.log('█'.repeat(60));
  
  // Setup
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Verify images exist
  for (const img of IMAGES) {
    if (!fs.existsSync(img.path)) {
      console.log(`❌ Image not found: ${img.path}`);
      process.exit(1);
    }
  }
  console.log('\n✅ All 3 images found');
  
  // Verify music exists
  if (!fs.existsSync(MUSIC_PATH)) {
    console.log(`❌ Music not found: ${MUSIC_PATH}`);
    process.exit(1);
  }
  console.log('✅ Music track found');
  
  const client = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  // ─────────────────────────────────────────────────────────────
  // STEP 1: Generate 3 clips in parallel
  // ─────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('STEP 1: Generating 3 Kling clips...');
  console.log('═'.repeat(60));
  
  const startGen = Date.now();
  const results = await Promise.all(
    IMAGES.map((img, i) => generateClip(client, img, i))
  );
  const genTime = ((Date.now() - startGen) / 1000).toFixed(1);
  
  console.log(`\n⏱️  Generation time: ${genTime}s`);
  
  const successful = results.filter(r => r.success);
  console.log(`📊 ${successful.length}/3 clips generated`);
  
  if (successful.length < 2) {
    console.log('\n❌ Not enough clips. Aborting.');
    process.exit(1);
  }
  
  // ─────────────────────────────────────────────────────────────
  // STEP 2: Download clips
  // ─────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('STEP 2: Downloading clips...');
  console.log('═'.repeat(60));
  
  const clipPaths = [];
  for (let i = 0; i < successful.length; i++) {
    const result = successful[i];
    const localPath = path.join(OUTPUT_DIR, `${result.id}.mp4`);
    console.log(`\n📥 Downloading ${result.id}...`);
    await downloadVideo(result.url, localPath);
    clipPaths.push(localPath);
    console.log(`   ✅ Saved`);
  }
  
  // ─────────────────────────────────────────────────────────────
  // STEP 3: Assemble with music
  // ─────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('STEP 3: Assembling with music...');
  console.log('═'.repeat(60));
  
  const timestamp = Date.now();
  const finalPath = path.join(OUTPUT_DIR, `sauna-reel-${timestamp}.mp4`);
  const assemblyResult = await assembleReelWithMusic(clipPaths, MUSIC_PATH, finalPath);
  
  if (!assemblyResult.success) {
    console.log('❌ Assembly failed:', assemblyResult.error);
    process.exit(1);
  }
  
  // ─────────────────────────────────────────────────────────────
  // STEP 4: Upload & Publish
  // ─────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('STEP 4: Publishing to Instagram...');
  console.log('═'.repeat(60));
  
  const videoUrl = await uploadToCloudinary(finalPath);
  const postId = await publishToInstagram(videoUrl, CAPTION);
  
  // ─────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────
  console.log('\n' + '█'.repeat(60));
  console.log('✅ SUCCESS!');
  console.log('█'.repeat(60));
  
  console.log(`\n🎬 Clips: ${successful.length}/3`);
  console.log(`🎵 Music: ${assemblyResult.noMusic ? 'No (fallback)' : 'Yes'}`);
  console.log(`📱 Post ID: ${postId}`);
  console.log(`💰 Cost: ~$${(successful.length * 0.40).toFixed(2)}`);
  console.log(`\n📂 Local: ${finalPath}`);
  console.log('');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});

