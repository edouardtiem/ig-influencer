#!/usr/bin/env node
/**
 * Prepare LoRA Dataset from Cloudinary URLs
 * Downloads images, resizes to 1024x1024, creates captions
 * 
 * Usage:
 *   node app/scripts/prepare-lora-dataset-cloud.mjs
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATASET_DIR = path.join(__dirname, '../../lora-dataset-elena-cloud');

// ============================================================
// ELENA IMAGES - 35 images avec classification angle/shot
// ============================================================

const ELENA_IMAGES = [
  // 1-10: Rooftop Paris / Balcony
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768847547/elena-scheduled/carousel-2-1768847547.jpg', angle: '3/4', shot: 'medium' },
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768847319/elena-scheduled/carousel-1-1768847318.jpg', angle: 'profile', shot: 'medium' },
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768844736/elena-scheduled/carousel-1-1768844735.jpg', angle: 'front', shot: 'medium' },
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768763692/elena-scheduled/carousel-3-1768763692.jpg', angle: '3/4', shot: 'medium' },
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768763641/elena-scheduled/carousel-2-1768763641.jpg', angle: 'front', shot: 'medium' },
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768763588/elena-scheduled/carousel-1-1768763588.jpg', angle: '3/4', shot: 'medium' },
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768739598/elena-scheduled/carousel-3-1768739597.jpg', angle: '3/4', shot: 'full' },
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768677268/elena-scheduled/carousel-2-1768677268.jpg', angle: '3/4', shot: 'medium' },
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768677197/elena-scheduled/carousel-1-1768677196.jpg', angle: 'profile', shot: 'medium' },
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768656524/elena-scheduled/carousel-2-1768656524.jpg', angle: '3/4', shot: 'medium' },
  
  // 11-15: Indoor / Window views
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768656426/elena-scheduled/carousel-1-1768656426.jpg', angle: '3/4', shot: 'full' },
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768653117/elena-scheduled/carousel-1-1768653117.jpg', angle: '3/4', shot: 'full' },
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768591221/elena-scheduled/carousel-3-1768591221.jpg', angle: 'front', shot: 'medium' },
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768591177/elena-scheduled/carousel-2-1768591177.jpg', angle: '3/4', shot: 'medium' },
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768591118/elena-scheduled/carousel-1-1768591118.jpg', angle: 'front', shot: 'medium' },
  
  // 16-17: Bedroom / Yoga
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768518016/elena-fanvue-daily/morning_selfie_above-1768518015.jpg', angle: 'front', shot: 'closeup' },
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768517864/elena-fanvue-daily/yoga_from_above-1768517863.jpg', angle: 'front', shot: 'medium' },
  
  // 18-19: Gallery / Passage
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768511997/elena-scheduled/carousel-2-1768511997.jpg', angle: 'front', shot: 'medium' },
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768511907/elena-scheduled/carousel-1-1768511906.jpg', angle: '3/4', shot: 'full' },
  
  // 20-24: Pool / Tropical
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768506296/elena-scheduled/carousel-1-1768506295.jpg', angle: 'front', shot: 'medium' },
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768484265/elena-scheduled/carousel-1-1768484265.jpg', angle: '3/4', shot: 'medium' },
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768418450/elena-scheduled/carousel-2-1768418450.jpg', angle: '3/4', shot: 'medium' },
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768418393/elena-scheduled/carousel-1-1768418392.jpg', angle: 'profile', shot: 'medium' },
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768394526/elena-scheduled/carousel-2-1768394525.jpg', angle: '3/4', shot: 'medium' },
  
  // 25-29: Mixed locations
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768332035/elena-scheduled/carousel-3-1768332034.jpg', angle: '3/4', shot: 'medium' },
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768331913/elena-scheduled/carousel-1-1768331913.jpg', angle: 'front', shot: 'medium' },
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768307935/elena-scheduled/carousel-2-1768307935.jpg', angle: '3/4', shot: 'medium' },
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768245687/elena-scheduled/carousel-3-1768245686.jpg', angle: '3/4', shot: 'medium' },
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768245583/elena-scheduled/carousel-1-1768245582.jpg', angle: 'front', shot: 'medium' },
  
  // 30-35: Final images
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768234884/elena-fanvue-daily/morning_bed_stretch-1768234884.jpg', angle: 'front', shot: 'medium' },
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768158808/elena-scheduled/carousel-1-1768158807.jpg', angle: '3/4', shot: 'medium' },
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1767954077/elena-trending-test/bozekkek0rc8nrrotr6w.jpg', angle: 'front', shot: 'medium' },
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1767951368/elena-trending-test/ljnvpscynjz5qutszpn8.jpg', angle: '3/4', shot: 'medium' },
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1767554094/elena-scheduled/carousel-3-1767554094.jpg', angle: '3/4', shot: 'medium' },
  { url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1767554047/elena-scheduled/carousel-2-1767554046.jpg', angle: 'profile', shot: 'medium' },
];

// =============================================================
// ELENA CAPTION CONFIGURATION (OPTIMIZED FOR FACE CONSISTENCY)
// =============================================================

const ELENA_BASE = {
  trigger: 'elena',
  identity: '24 year old Italian woman',
  eyes: 'honey brown warm eyes',
  hair: 'bronde hair with dark roots and golden blonde balayage, long voluminous beach waves',
  face: 'small beauty mark on right cheekbone',
  body: 'fit athletic toned body, natural breasts, defined slim waist',
  skin: 'sun-kissed Mediterranean skin, natural skin texture'
};

function generateCaption(angle, index, shotType = 'medium') {
  const e = ELENA_BASE;
  
  let angleDesc = '';
  let faceVisible = true;
  let includeBody = true;
  
  switch (angle) {
    case 'front':
      angleDesc = 'front view, facing camera';
      break;
    case '3/4':
      angleDesc = 'three-quarter angle, slight turn';
      break;
    case 'profile':
      angleDesc = 'side profile view';
      break;
    case 'back':
      angleDesc = 'back view, from behind';
      faceVisible = false;
      break;
    default:
      angleDesc = 'natural angle';
  }
  
  if (shotType === 'closeup') {
    includeBody = false;
    angleDesc += ', close-up portrait';
  } else if (shotType === 'full') {
    angleDesc += ', full body shot';
  }
  
  let parts = [e.trigger];
  parts.push(e.identity);
  
  if (faceVisible) {
    parts.push(e.eyes);
    parts.push(e.face);
  }
  
  parts.push(e.hair);
  
  if (includeBody) {
    parts.push(e.body);
  }
  
  parts.push(angleDesc);
  parts.push(e.skin);
  parts.push('photo');
  
  return parts.join(', ');
}

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    const request = (targetUrl) => {
      https.get(targetUrl, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          request(response.headers.location);
        } else if (response.statusCode === 200) {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        } else {
          reject(new Error(`HTTP ${response.statusCode}`));
        }
      }).on('error', reject);
    };
    
    request(url);
  });
}

function resizeImage(inputPath, outputPath, size = 1024) {
  try {
    execSync(`sips -Z ${size} "${inputPath}" --out "${outputPath}" 2>/dev/null`, { stdio: 'pipe' });
    return true;
  } catch {
    try {
      execSync(`convert "${inputPath}" -resize ${size}x${size}^ -gravity center -extent ${size}x${size} "${outputPath}"`, { stdio: 'pipe' });
      return true;
    } catch {
      console.warn(`  ⚠️ Could not resize ${inputPath}, using original`);
      fs.copyFileSync(inputPath, outputPath);
      return false;
    }
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('ELENA LORA DATASET PREPARATION (CLOUD)');
  console.log('='.repeat(60));
  console.log('');
  
  console.log(`📊 Images to process: ${ELENA_IMAGES.length}`);
  console.log(`📁 Output directory: ${DATASET_DIR}`);
  console.log('');
  
  const imgDir = path.join(DATASET_DIR, '10_elena');
  fs.mkdirSync(imgDir, { recursive: true });
  
  const tempDir = path.join(DATASET_DIR, 'temp');
  fs.mkdirSync(tempDir, { recursive: true });
  
  console.log('📥 Downloading and processing images...\n');
  
  let successCount = 0;
  
  for (let i = 0; i < ELENA_IMAGES.length; i++) {
    const img = ELENA_IMAGES[i];
    const idx = String(i + 1).padStart(2, '0');
    const tempPath = path.join(tempDir, `elena_${idx}_temp.jpg`);
    const finalPath = path.join(imgDir, `elena_${idx}.jpg`);
    const captionPath = path.join(imgDir, `elena_${idx}.txt`);
    
    process.stdout.write(`[${i + 1}/${ELENA_IMAGES.length}] elena_${idx} (${img.angle}, ${img.shot || 'medium'})... `);
    
    try {
      await downloadImage(img.url, tempPath);
      resizeImage(tempPath, finalPath, 1024);
      const caption = generateCaption(img.angle, i, img.shot || 'medium');
      fs.writeFileSync(captionPath, caption);
      console.log('✅');
      successCount++;
    } catch (error) {
      console.log(`❌ ${error.message}`);
    }
  }
  
  fs.rmSync(tempDir, { recursive: true, force: true });
  
  console.log('\n' + '='.repeat(60));
  console.log('DATASET READY');
  console.log('='.repeat(60));
  console.log(`\n📁 Location: ${DATASET_DIR}`);
  console.log(`📊 Images: ${successCount}/${ELENA_IMAGES.length}`);
  console.log(`📏 Resolution: 1024x1024`);
  console.log(`🔁 Repeats: 10 (folder name)`);
  
  console.log('\n📋 Next steps:');
  console.log('  1. Create RunPod: node app/scripts/runpod-lora-training.mjs create');
  console.log('  2. Upload dataset via SCP to /workspace/dataset/');
  console.log('  3. Run training script on the pod');
}

main().catch(console.error);
