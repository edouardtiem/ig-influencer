#!/usr/bin/env node
/**
 * Generate a clean Elena face reference for InstantID
 * Uses Nano Banana Pro for best quality
 */

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

// Elena references
const ELENA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png';
const ELENA_BODY_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png';

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('🎨 Generating Elena face reference with Nano Banana Pro...');
  console.log('📸 Using face ref:', ELENA_FACE_REF.slice(-50));
  
  const prompt = `Close-up portrait headshot of Elena, 24 year old italian woman,
soft round pleasant face, warm approachable features,
bronde hair dark roots with golden blonde balayage long beach waves,
honey brown warm almond-shaped eyes, naturally thick eyebrows,
small beauty mark on right cheekbone,
natural soft makeup, glowing healthy skin,
neutral light gray background, professional portrait photography,
looking directly at camera with soft warm smile,
face clearly visible, front facing,
high resolution, sharp focus on face, 8K quality`;

  try {
    const output = await replicate.run('google/nano-banana-pro', {
      input: {
        prompt: prompt,
        aspect_ratio: '1:1',
        safety_filter_level: 'block_only_high',
        image_reference_url: ELENA_FACE_REF,
        image_reference_strength: 0.85,
        style_reference_url: ELENA_BODY_REF,
        style_reference_strength: 0.2
      }
    });

    const imageUrl = output.toString();
    console.log('✅ Generated:', imageUrl);
    
    // Create output directory
    const outputDir = path.join(__dirname, '../generated/elena-instantid-refs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Download the image
    const filename = `elena-face-ref-${Date.now()}.png`;
    const filepath = path.join(outputDir, filename);
    
    await downloadImage(imageUrl, filepath);
    console.log('💾 Saved to:', filepath);
    
    // Open the image
    const { exec } = await import('child_process');
    exec(`open "${filepath}"`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();
