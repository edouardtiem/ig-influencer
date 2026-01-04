#!/usr/bin/env node
/**
 * TEST: Reel Kling Pipeline — Instagram 2026 Style
 * 
 * Génère 1 reel complet:
 * 1. 3 images (Nano Banana Pro) - style Instagram 2026
 * 2. 3 clips animés (Kling v2.5) - real-time speed
 * 3. 1 vidéo assemblée (FFmpeg)
 * 
 * Usage:
 *   node scripts/test-reel-kling-pipeline.mjs
 *   node scripts/test-reel-kling-pipeline.mjs elena  # Test avec Elena
 * 
 * Output: app/generated/test-kling-pipeline/
 */

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

const OUTPUT_DIR = path.join(__dirname, '..', 'generated', 'test-kling-pipeline');

// ═══════════════════════════════════════════════════════════════
// CHARACTER CONFIGS
// ═══════════════════════════════════════════════════════════════

const CHARACTERS = {
  mila: {
    name: 'Mila',
    refs: [
      'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png',
      'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_5_kyx12v.png',
      'https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_2_q8kxit.png',
    ],
    referenceInstruction: `You are provided with reference images. Copy the face EXACTLY from Image 1.

**IMAGE 1 (FACE)**: Mila's face - copy EXACTLY:
- Oval elongated face, high cheekbones, soft feminine jawline
- Copper auburn hair, type 3A loose curls, shoulder-length
- Hazel-green eyes with golden flecks
- Small dark brown beauty mark above left lip (SIGNATURE)
- Golden-brown freckles on nose and cheekbones

**IMAGE 2 (BODY)**: Athletic slim body 168cm, Mediterranean tan skin`,
    
    faceDescription: `oval face, copper auburn curly hair (3A curls), shoulder-length messy texture,
hazel-green eyes, straight nose slightly upturned, naturally full lips,
small beauty mark above left lip (SIGNATURE), freckles on nose and cheekbones`,
    
    bodyDescription: `slim athletic physique 168cm, Mediterranean light tan skin,
natural feminine curves, toned Pilates body`,
    
    testScene: {
      setting: 'Cozy Paris apartment bedroom, morning golden light through sheer curtains, messy white sheets',
      outfit: 'Cream silk camisole with thin straps, messy morning hair, natural no-makeup look',
      action: 'peaceful morning stretch in bed, waking up moment',
      mood: 'cozy, intimate, authentic morning',
    },
  },
  
  elena: {
    name: 'Elena',
    refs: [
      'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png',
      'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png',
    ],
    referenceInstruction: `You are provided with reference images. Copy the face EXACTLY from Image 1.

**IMAGE 1 (FACE)**: Elena's face - copy EXACTLY:
- Soft round pleasant face (NOT angular)
- Bronde hair with visible golden blonde balayage highlights
- Honey brown warm almond-shaped eyes
- Small beauty mark on right cheekbone (SIGNATURE)
- Naturally full lips nude-pink color

**IMAGE 2 (BODY)**: Feminine figure, very large natural bust, narrow waist`,
    
    faceDescription: `soft round face, warm approachable features,
bronde hair with golden blonde balayage, long beach waves,
honey brown eyes, naturally full lips nude-pink,
small beauty mark on right cheekbone (SIGNATURE)`,
    
    bodyDescription: `feminine shapely figure 172cm, very large natural F-cup bust,
narrow defined waist, wide feminine hips, Italian sun-kissed skin`,
    
    testScene: {
      setting: 'Luxury Paris loft bedroom, soft morning light, designer furniture, silk sheets',
      outfit: 'Silk slip dress champagne color, delicate straps, hair down and tousled',
      action: 'lounging elegantly on bed, scrolling phone, relaxed morning',
      mood: 'luxurious, effortless glamour, intimate',
    },
  },
};

// ═══════════════════════════════════════════════════════════════
// STYLE TEMPLATES — Instagram 2026 Aesthetic
// ═══════════════════════════════════════════════════════════════

const STYLE_INSTAGRAM_2026 = `STYLE: 2026 Instagram content, iPhone 15 Pro quality
- Natural lighting (golden hour, window light, soft diffused)
- Authentic influencer aesthetic, casually perfect
- Main character energy, effortlessly cool
- The kind of post that gets organic viral engagement
- Candid vibe like a friend took it, not overly posed

AVOID: Professional studio, magazine editorial, stock photo look, overly retouched, artificial lighting`;

const NEGATIVE_PROMPT = `cartoon, anime, illustration, 3D render, CGI, deformed, blurry, 
bad anatomy, extra limbs, watermark, text, logo, plastic skin, wrong hair color, 
straight hair when should be curly, tattoos, glasses, heavy makeup, studio lighting,
stock photo, magazine cover, overly retouched, artificial look`;

// ═══════════════════════════════════════════════════════════════
// KLING PROMPT — Real-time Speed, No Slow Motion
// ═══════════════════════════════════════════════════════════════

function buildKlingPrompt(action, setting, mood) {
  return `SETTING: ${setting}

ACTION: ${action}

STYLE: Instagram Reel 2026 aesthetic
- iPhone video quality, authentic content vibe
- Natural casual movement (not choreographed)
- "Caught on camera" authentic feel
- The kind of reel that goes viral organically
- Main character energy, effortless cool

SPEED CRITICAL:
- REAL-TIME SPEED only
- NO slow motion whatsoever
- Normal human movement pace
- Instagram Reel pacing (quick, engaging)

MOVEMENTS (subtle and natural):
- Gentle breathing visible in shoulders
- Hair moving slightly with natural air
- Natural eye blinks
- Micro-expressions (slight smile changes)
- Fabric settling naturally

CAMERA: Static or very subtle pan. No dramatic moves.

MOOD: ${mood}

AVOID: Slow motion, cinematic camera moves, CGI look, TikTok transitions, overly produced feel, artificial movements`;
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

function log(msg) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
}

async function urlToBase64(url) {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  return `data:image/jpeg;base64,${Buffer.from(buffer).toString('base64')}`;
}

function fileToBase64(filePath) {
  const buffer = fs.readFileSync(filePath);
  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}

async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    proto.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(destPath); });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// STEP 1: Generate 3 images with Nano Banana Pro
// ═══════════════════════════════════════════════════════════════

async function generateImages(client, character) {
  log(`📸 STEP 1: Generating 3 images for ${character.name} (Nano Banana Pro)...`);
  
  const refBase64 = await Promise.all(character.refs.map(urlToBase64));
  log(`   Loaded ${refBase64.length} reference images`);
  
  const scene = character.testScene;
  
  // 3 variations of the same action (like the real scheduler does)
  const actionVariations = [
    scene.action,
    `${scene.action}, different angle, looking at camera`,
    `${scene.action}, candid moment, genuine smile`,
  ];
  
  const imagePaths = [];
  let firstImageBase64 = null;
  
  for (let i = 0; i < 3; i++) {
    log(`   Image ${i + 1}/3: "${actionVariations[i].slice(0, 50)}..."`);
    const start = Date.now();
    
    // Build prompt
    const prompt = `${character.referenceInstruction}

SUBJECT: ${character.name}, young woman,
${character.faceDescription},
${character.bodyDescription}

SETTING: ${scene.setting}

OUTFIT: ${scene.outfit}

ACTION: ${actionVariations[i]}

MOOD: ${scene.mood}

${STYLE_INSTAGRAM_2026}`;

    // Add first image as scene reference for consistency (images 2 and 3)
    const inputRefs = i > 0 && firstImageBase64 
      ? [firstImageBase64, ...refBase64]
      : refBase64;
    
    try {
      const output = await client.run('google/nano-banana-pro', {
        input: {
          prompt,
          negative_prompt: NEGATIVE_PROMPT,
          aspect_ratio: '9:16',
          resolution: '2K',
          output_format: 'jpg',
          safety_filter_level: 'block_only_high',
          image_input: inputRefs,
        },
      });
      
      const imageUrl = Array.isArray(output) ? output[0] : output;
      
      // Download image
      const imagePath = path.join(OUTPUT_DIR, `image-${i + 1}.jpg`);
      const res = await fetch(imageUrl);
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(imagePath, buffer);
      
      imagePaths.push(imagePath);
      
      // Store first image for scene consistency
      if (i === 0) {
        firstImageBase64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
      }
      
      log(`   ✅ Image ${i + 1} generated in ${((Date.now() - start) / 1000).toFixed(1)}s`);
      
    } catch (err) {
      log(`   ❌ Image ${i + 1} failed: ${err.message}`);
    }
  }
  
  return imagePaths;
}

// ═══════════════════════════════════════════════════════════════
// STEP 2: Animate with Kling v2.5 (parallel)
// ═══════════════════════════════════════════════════════════════

async function animateWithKling(client, imagePaths, character) {
  log(`🎬 STEP 2: Animating ${imagePaths.length} images with Kling v2.5 (parallel)...`);
  
  const scene = character.testScene;
  
  // Kling action variations for each clip (narrative progression)
  const klingActions = [
    `${scene.action}, subtle movement, holds position naturally`,
    `${scene.action}, transitions smoothly, natural body adjustment`,
    `${scene.action}, finishes movement, warm smile toward camera`,
  ];
  
  const startAll = Date.now();
  
  const clipPromises = imagePaths.map(async (imgPath, i) => {
    log(`   Clip ${i + 1}/${imagePaths.length}: Starting Kling...`);
    const start = Date.now();
    
    const imageBase64 = fileToBase64(imgPath);
    const prompt = buildKlingPrompt(klingActions[i], scene.setting, scene.mood);
    
    try {
      const output = await client.run('kwaivgi/kling-v2.5-turbo-pro', {
        input: {
          prompt,
          image: imageBase64,
          duration: 5,
          aspect_ratio: '9:16',
        },
      });
      
      // Debug: log raw output type
      log(`   📦 Clip ${i + 1} raw output type: ${typeof output}, isArray: ${Array.isArray(output)}`);
      
      // Extract URL from various Replicate output formats
      let videoUrl = null;
      
      if (typeof output === 'string') {
        videoUrl = output;
      } else if (output && typeof output === 'object') {
        // Check if it's a FileOutput with href() method
        if (typeof output.url === 'function') {
          const urlObj = output.url();
          videoUrl = urlObj?.href || String(urlObj);
        } else if (output.url) {
          videoUrl = String(output.url);
        } else if (output.href) {
          videoUrl = String(output.href);
        } else if (output.video) {
          videoUrl = typeof output.video === 'string' ? output.video : output.video?.url;
        }
      }
      
      // Array output
      if (!videoUrl && Array.isArray(output) && output[0]) {
        const first = output[0];
        if (typeof first === 'string') {
          videoUrl = first;
        } else if (first && typeof first === 'object') {
          if (typeof first.url === 'function') {
            const urlObj = first.url();
            videoUrl = urlObj?.href || String(urlObj);
          } else {
            videoUrl = first.url || first.href || first.video;
          }
        }
      }
      
      // Last resort: try to stringify and extract URL
      if (!videoUrl) {
        const outputStr = JSON.stringify(output);
        const urlMatch = outputStr.match(/https?:\/\/[^\s"]+\.mp4[^"']*/);
        if (urlMatch) {
          videoUrl = urlMatch[0];
        }
        log(`   📦 Clip ${i + 1} output: ${outputStr.slice(0, 200)}`);
      }
      
      if (!videoUrl || typeof videoUrl !== 'string') {
        log(`   ❌ Clip ${i + 1}: No valid URL found`);
        return null;
      }
      
      log(`   📥 Clip ${i + 1} URL: ${videoUrl.slice(0, 80)}...`);
      
      // Download clip
      const clipPath = path.join(OUTPUT_DIR, `clip-${i + 1}.mp4`);
      await downloadFile(videoUrl, clipPath);
      
      const duration = ((Date.now() - start) / 1000).toFixed(1);
      log(`   ✅ Clip ${i + 1} generated in ${duration}s`);
      return clipPath;
      
    } catch (err) {
      log(`   ❌ Clip ${i + 1} error: ${err.message?.slice(0, 80) || err}`);
      return null;
    }
  });
  
  const clipPaths = await Promise.all(clipPromises);
  const validClips = clipPaths.filter(Boolean);
  
  const totalTime = ((Date.now() - startAll) / 1000).toFixed(1);
  log(`   📊 ${validClips.length}/${imagePaths.length} clips generated in ${totalTime}s total`);
  
  return validClips;
}

// ═══════════════════════════════════════════════════════════════
// STEP 3: Assemble with FFmpeg
// ═══════════════════════════════════════════════════════════════

async function assembleReel(clipPaths) {
  log(`🎞️ STEP 3: Assembling ${clipPaths.length} clips with FFmpeg...`);
  
  const listPath = path.join(OUTPUT_DIR, 'clips.txt');
  const content = clipPaths.map(p => `file '${p}'`).join('\n');
  fs.writeFileSync(listPath, content);
  
  const outputPath = path.join(OUTPUT_DIR, `final-reel-${Date.now()}.mp4`);
  
  try {
    await execAsync(`ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`);
    
    // Get duration
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outputPath}"`
    );
    const duration = parseFloat(stdout.trim()).toFixed(1);
    
    fs.unlinkSync(listPath);
    
    log(`   ✅ Reel assembled: ${duration}s → ${path.basename(outputPath)}`);
    return outputPath;
    
  } catch (err) {
    log(`   ❌ FFmpeg error: ${err.message}`);
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('🧪 TEST: Reel Kling Pipeline — Instagram 2026 Style');
  console.log('═'.repeat(60));
  
  // Parse args
  const args = process.argv.slice(2);
  const characterName = args[0]?.toLowerCase() || 'mila';
  
  const character = CHARACTERS[characterName];
  if (!character) {
    console.error(`❌ Unknown character: ${characterName}`);
    console.error(`   Available: ${Object.keys(CHARACTERS).join(', ')}`);
    process.exit(1);
  }
  
  // Check env
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('❌ Missing REPLICATE_API_TOKEN in .env.local');
    process.exit(1);
  }
  
  // Create output dir
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  console.log(`\n📋 Character: ${character.name}`);
  console.log(`📁 Output: ${OUTPUT_DIR}`);
  console.log(`🎬 Scene: ${character.testScene.setting.slice(0, 50)}...`);
  
  const client = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  const startTotal = Date.now();
  
  try {
    // Step 1: Images
    console.log('\n' + '─'.repeat(60));
    const imagePaths = await generateImages(client, character);
    
    if (imagePaths.length === 0) {
      throw new Error('No images generated');
    }
    
    // Step 2: Kling animation
    console.log('\n' + '─'.repeat(60));
    const clipPaths = await animateWithKling(client, imagePaths, character);
    
    if (clipPaths.length === 0) {
      throw new Error('No clips generated - check Kling output');
    }
    
    // Step 3: Assembly
    console.log('\n' + '─'.repeat(60));
    const reelPath = await assembleReel(clipPaths);
    
    // Summary
    const totalTime = ((Date.now() - startTotal) / 1000 / 60).toFixed(1);
    const estimatedCost = (imagePaths.length * 0.05 + clipPaths.length * 0.45).toFixed(2);
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ TEST COMPLETE!');
    console.log('═'.repeat(60));
    console.log(`📁 Final reel: ${reelPath}`);
    console.log(`📸 Images: ${imagePaths.length}/3`);
    console.log(`🎬 Clips: ${clipPaths.length}/3`);
    console.log(`⏱️  Total time: ${totalTime} minutes`);
    console.log(`💰 Estimated cost: ~$${estimatedCost}`);
    console.log('');
    console.log('👀 Check the generated files:');
    console.log(`   open ${OUTPUT_DIR}`);
    console.log('');
    console.log('🎥 Play the reel:');
    console.log(`   open "${reelPath}"`);
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.log('\n📁 Partial files may be in:', OUTPUT_DIR);
    process.exit(1);
  }
}

main();

