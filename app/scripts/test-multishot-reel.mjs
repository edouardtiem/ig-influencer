#!/usr/bin/env node
/**
 * Multi-Shot Reel Test
 * 
 * 1. Génère 3 clips Kling en parallèle
 * 2. Télécharge les clips
 * 3. Assemble avec FFmpeg + transition fade
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
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

// ═══════════════════════════════════════════════════════════════
// CONFIG - 3 CLIPS FROM GYM CAROUSEL
// ═══════════════════════════════════════════════════════════════

const CLIPS = [
  {
    id: 'clip-1',
    image: '/Users/edouardtiem/Cursor Projects/IG-influencer/app/generated/gym-carousel/gym-01-cable-machine-1765706690342.jpg',
    prompt: `Gym workout scene. The woman performs a smooth cable machine exercise, pulling the handle toward her with controlled form. Natural gym movements, focused expression, athletic energy. Professional fitness content.`
  },
  {
    id: 'clip-2', 
    image: '/Users/edouardtiem/Cursor Projects/IG-influencer/app/generated/gym-carousel/gym-02-leg-press-1765706766038.jpg',
    prompt: `Gym leg day. The woman pushes the leg press with power, extending her legs fully then returning with control. Determined expression, strong form. Fitness motivation aesthetic.`
  },
  {
    id: 'clip-3',
    image: '/Users/edouardtiem/Cursor Projects/IG-influencer/app/generated/gym-carousel/gym-04-mirror-selfie-1765706861941.jpg',
    prompt: `Post-workout selfie moment. The woman checks herself in the gym mirror, does a subtle flex, confident smile. "Feeling myself" energy, Instagram-ready moment.`
  }
];

const OUTPUT_DIR = '/Users/edouardtiem/Cursor Projects/IG-influencer/app/generated/multishot-test';

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
      protocol.get(currentUrl, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          file.close();
          fs.unlinkSync(outputPath);
          const newFile = fs.createWriteStream(outputPath);
          const newProtocol = response.headers.location.startsWith('https') ? https : http;
          newProtocol.get(response.headers.location, (res) => {
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

async function generateClip(client, clip, index) {
  console.log(`\n📹 Generating ${clip.id}...`);
  console.log(`   Image: ${path.basename(clip.image)}`);
  console.log(`   Prompt: ${clip.prompt.slice(0, 60)}...`);
  
  const imageInput = fileToBase64(clip.image);
  const startTime = Date.now();
  
  try {
    const output = await client.run("kwaivgi/kling-v2.5-turbo-pro", {
      input: {
        prompt: clip.prompt,
        image: imageInput,
        duration: 5,
        aspect_ratio: '9:16'
      }
    });
    
    const url = extractVideoUrl(output);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (!url) {
      console.log(`   ❌ No URL returned`);
      return { success: false, id: clip.id };
    }
    
    console.log(`   ✅ Done in ${duration}s`);
    return { success: true, id: clip.id, url, duration };
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message.slice(0, 50)}`);
    return { success: false, id: clip.id, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// FFMPEG ASSEMBLY
// ═══════════════════════════════════════════════════════════════

async function assembleReel(clipPaths, outputPath) {
  console.log('\n🎬 Assembling reel with FFmpeg...');
  
  // Simple concat (fastest, no re-encoding)
  const listPath = outputPath.replace('.mp4', '_list.txt');
  const content = clipPaths.map(p => `file '${p}'`).join('\n');
  fs.writeFileSync(listPath, content);
  
  try {
    await execAsync(`ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`);
    fs.unlinkSync(listPath);
    console.log(`✅ Reel assembled: ${path.basename(outputPath)}`);
    return { success: true, path: outputPath };
  } catch (error) {
    console.log(`❌ FFmpeg error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('\n' + '█'.repeat(60));
  console.log('🎬 MULTI-SHOT REEL TEST');
  console.log('   3 clips → 1 reel (~15s)');
  console.log('█'.repeat(60));
  
  // Setup
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const client = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  // ─────────────────────────────────────────────────────────────
  // STEP 1: Generate 3 clips in parallel
  // ─────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('STEP 1: Generating 3 clips in parallel...');
  console.log('═'.repeat(60));
  
  const startGen = Date.now();
  const results = await Promise.all(
    CLIPS.map((clip, i) => generateClip(client, clip, i))
  );
  const genTime = ((Date.now() - startGen) / 1000).toFixed(1);
  
  console.log(`\n⏱️  Total generation time: ${genTime}s`);
  
  const successful = results.filter(r => r.success);
  console.log(`📊 ${successful.length}/${CLIPS.length} clips generated`);
  
  if (successful.length < 2) {
    console.log('\n❌ Not enough clips to assemble. Aborting.');
    return;
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
    console.log(`   ✅ Saved: ${path.basename(localPath)}`);
  }
  
  // ─────────────────────────────────────────────────────────────
  // STEP 3: Assemble with FFmpeg
  // ─────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('STEP 3: Assembling final reel...');
  console.log('═'.repeat(60));
  
  const timestamp = Date.now();
  const finalPath = path.join(OUTPUT_DIR, `reel-${timestamp}.mp4`);
  const assemblyResult = await assembleReel(clipPaths, finalPath);
  
  // ─────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────
  console.log('\n' + '█'.repeat(60));
  console.log('📊 SUMMARY');
  console.log('█'.repeat(60));
  
  console.log(`\n✅ Clips generated: ${successful.length}/3`);
  successful.forEach(r => {
    console.log(`   - ${r.id}: ${r.url.slice(0, 60)}...`);
  });
  
  if (assemblyResult.success) {
    console.log(`\n🎬 Final reel: ${finalPath}`);
    console.log(`💰 Total cost: ~$${(successful.length * 0.40).toFixed(2)}`);
  }
  
  console.log('\n' + '─'.repeat(60));
  console.log('🎯 Open the reel in Finder or VLC to preview!');
  console.log('─'.repeat(60) + '\n');
}

main().catch(console.error);

