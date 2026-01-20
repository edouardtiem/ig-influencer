#!/usr/bin/env node
/**
 * Download Elena bikini images from Cloudinary for LoRA training
 * Creates a dataset folder with images + captions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Output directory for the dataset
const DATASET_DIR = path.join(__dirname, '../../lora-dataset-elena');

// Elena bikini/beach images from Cloudinary
const ELENA_IMAGES = [
  {
    url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768666606/elena-fanvue-daily/pool_bikini_back-1768666605.jpg',
    name: 'elena_bikini_pool_back',
    caption: 'elena, 24 year old Italian woman, honey brown warm eyes, bronde hair with dark roots and golden blonde balayage, long voluminous beach waves, small beauty mark on right cheekbone, fit athletic toned body, large natural breasts, defined slim waist, toned stomach, wearing bikini, pool setting, back view, natural skin texture, sun-kissed skin'
  },
  {
    url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768520560/elena-test-chest/chest2-bikini-body-crop-1768520559.jpg',
    name: 'elena_bikini_body_front',
    caption: 'elena, 24 year old Italian woman, honey brown warm eyes, bronde hair with dark roots and golden blonde balayage, long voluminous beach waves, small beauty mark on right cheekbone, fit athletic toned body, large natural breasts, D-cup, defined slim waist, toned stomach, wearing bikini, body shot, natural skin texture, sun-kissed skin'
  },
  {
    url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768520084/elena-test-noface/noface4-pool-bikini-behind-1768520083.jpg',
    name: 'elena_bikini_pool_behind',
    caption: 'elena, 24 year old Italian woman, bronde hair with dark roots and golden blonde balayage, long voluminous beach waves, fit athletic toned body, large natural breasts, defined slim waist, toned stomach, wearing bikini, pool setting, behind view, natural skin texture, sun-kissed skin'
  },
  {
    url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1768519728/elena-test-limits/test5-bikini-pool-back-1768519727.jpg',
    name: 'elena_bikini_pool_back2',
    caption: 'elena, 24 year old Italian woman, bronde hair with dark roots and golden blonde balayage, long voluminous beach waves, fit athletic toned body, large natural breasts, defined slim waist, toned stomach, wearing bikini, pool setting, back pose, natural skin texture, sun-kissed skin'
  }
];

// Download image from URL
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        https.get(response.headers.location, (res) => {
          res.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }
    }).on('error', reject);
  });
}

async function main() {
  console.log('='.repeat(60));
  console.log('ELENA LORA DATASET DOWNLOADER');
  console.log('='.repeat(60));
  console.log('');
  
  // Create dataset directory
  if (!fs.existsSync(DATASET_DIR)) {
    fs.mkdirSync(DATASET_DIR, { recursive: true });
    console.log(`📁 Created dataset directory: ${DATASET_DIR}`);
  } else {
    console.log(`📁 Dataset directory exists: ${DATASET_DIR}`);
  }
  
  // Create img subdirectory (required by kohya)
  const imgDir = path.join(DATASET_DIR, '10_elena');  // 10 repeats
  if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir, { recursive: true });
  }
  
  console.log(`\n📥 Downloading ${ELENA_IMAGES.length} images...\n`);
  
  for (let i = 0; i < ELENA_IMAGES.length; i++) {
    const img = ELENA_IMAGES[i];
    const imgPath = path.join(imgDir, `${img.name}.jpg`);
    const captionPath = path.join(imgDir, `${img.name}.txt`);
    
    console.log(`[${i + 1}/${ELENA_IMAGES.length}] Downloading ${img.name}...`);
    
    try {
      // Download image
      await downloadImage(img.url, imgPath);
      console.log(`   ✅ Image saved`);
      
      // Create caption file
      fs.writeFileSync(captionPath, img.caption);
      console.log(`   ✅ Caption saved`);
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('DATASET READY');
  console.log('='.repeat(60));
  console.log(`\n📁 Location: ${DATASET_DIR}`);
  console.log(`📊 Images: ${ELENA_IMAGES.length}`);
  console.log(`📝 Captions: ${ELENA_IMAGES.length}`);
  console.log('\nNext step: Resize images to 512x512 for training');
}

main().catch(console.error);
