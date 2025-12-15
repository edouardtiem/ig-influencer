#!/usr/bin/env node
/**
 * Quick Sora 2 test only
 * Run with: node scripts/test-sora2-only.mjs "image-url-or-path"
 */

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

const INPUT_IMAGE = process.argv[2] || null;

function fileToBase64(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const base64 = fileBuffer.toString('base64');
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
}

function isUrl(str) {
  return str && (str.startsWith('http://') || str.startsWith('https://'));
}

const SORA_2_PROMPT = `Cinematic morning scene. Static camera, 35mm lens. 

The woman stands still by the window holding her coffee mug. Subtle natural movements only:
- Gentle steam rising from the hot coffee cup
- Soft morning sunlight rays shifting through sheer curtains
- Curtains swaying very slightly from gentle breeze
- Her curly auburn hair has the faintest movement from the breeze
- Natural breathing motion visible in her shoulders

No walking, no arm movement, no expression changes. Photorealistic, warm golden hour lighting, shallow depth of field. Ambient morning sounds: distant birds, soft room tone.`;

async function main() {
  console.log('🔵 SORA 2 TEST\n');
  
  if (!INPUT_IMAGE) {
    console.error('❌ Usage: node scripts/test-sora2-only.mjs "image-url-or-path"');
    process.exit(1);
  }
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  let imageInput;
  if (isUrl(INPUT_IMAGE)) {
    imageInput = INPUT_IMAGE;
    console.log('📷 Using URL:', INPUT_IMAGE.slice(0, 60) + '...');
  } else if (fs.existsSync(INPUT_IMAGE)) {
    imageInput = fileToBase64(INPUT_IMAGE);
    console.log('📷 Loaded local file');
  } else {
    console.error('❌ Image not found:', INPUT_IMAGE);
    process.exit(1);
  }
  
  console.log('📝 Prompt:', SORA_2_PROMPT.slice(0, 80) + '...');
  console.log('⏱️  Duration: 8 seconds | Resolution: 720p portrait');
  console.log('\n⏳ Generating... (2-5 minutes)\n');
  
  const start = Date.now();
  
  try {
    const output = await replicate.run("openai/sora-2", {
      input: {
        prompt: SORA_2_PROMPT,
        image: imageInput,
        duration: 8,
        aspect_ratio: "portrait",
        resolution: "720p"
      }
    });
    
    const duration = ((Date.now() - start) / 1000).toFixed(1);
    
    let url = null;
    if (typeof output === 'string') {
      url = output;
    } else if (output?.url) {
      url = typeof output.url === 'function' ? output.url().href : output.url;
    } else if (Array.isArray(output) && output[0]) {
      url = typeof output[0] === 'string' ? output[0] : output[0]?.url;
    }
    
    console.log('✅ SUCCESS!');
    console.log(`⏱️  Time: ${duration}s`);
    console.log(`💰 Cost: ~$0.80`);
    console.log(`\n🔗 VIDEO URL:\n${url}\n`);
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

main();

