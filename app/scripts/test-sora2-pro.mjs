#!/usr/bin/env node
/**
 * Sora 2 Pro test - Higher quality
 * Run with: node scripts/test-sora2-pro.mjs "image-url-or-path"
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

// Premium prompt - more detailed for Pro model
const SORA_2_PRO_PROMPT = `Shot on ARRI Alexa 65, 50mm anamorphic lens. Cinematic morning scene.

A beautiful woman with curly auburn hair stands motionless by a large window, holding a white coffee mug. She wears a fitted grey bodysuit. Warm golden morning light streams through sheer linen curtains.

Hyper-realistic subtle movements only:
- Delicate steam tendrils rise from the coffee, catching the light
- Soft morning sunlight shifts subtly through the curtains
- Sheer curtain fabric sways imperceptibly in gentle breeze
- Individual curly hair strands catch golden light with micro-movements
- Natural chest breathing motion, very subtle

Camera: completely static, shallow depth of field, bokeh on background bed.
Lighting: warm golden hour, soft shadows, intimate bedroom atmosphere.
Audio: quiet morning ambiance, distant birds, soft room tone, faint coffee steam sound.

No movement of arms, hands, head, or facial expression. Photorealistic, cinematic color grading, film grain.`;

async function main() {
  console.log('🔵 SORA 2 PRO TEST (1080p)\n');
  console.log('═'.repeat(50));
  
  if (!INPUT_IMAGE) {
    console.error('❌ Usage: node scripts/test-sora2-pro.mjs "image-url-or-path"');
    process.exit(1);
  }
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  let imageInput;
  if (isUrl(INPUT_IMAGE)) {
    imageInput = INPUT_IMAGE;
    console.log('📷 Using URL:', INPUT_IMAGE.slice(0, 50) + '...');
  } else if (fs.existsSync(INPUT_IMAGE)) {
    imageInput = fileToBase64(INPUT_IMAGE);
    console.log('📷 Loaded local file');
  } else {
    console.error('❌ Image not found:', INPUT_IMAGE);
    process.exit(1);
  }
  
  console.log('\n📝 Model: openai/sora-2-pro');
  console.log('📐 Resolution: 1080p');
  console.log('⏱️  Duration: 8 seconds');
  console.log('💰 Estimated cost: ~$4.00 (8s × $0.50/s)');
  console.log('\n' + '─'.repeat(50));
  console.log('📝 Prompt (enhanced for Pro):');
  console.log(SORA_2_PRO_PROMPT.slice(0, 200) + '...');
  console.log('─'.repeat(50));
  console.log('\n⏳ Generating with Sora 2 Pro... (3-8 minutes)\n');
  
  const start = Date.now();
  
  try {
    const output = await replicate.run("openai/sora-2-pro", {
      input: {
        prompt: SORA_2_PRO_PROMPT,
        image: imageInput,
        duration: 8,
        aspect_ratio: "portrait",
        resolution: "high" // "standard" or "high" for Pro
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
    
    console.log('═'.repeat(50));
    console.log('✅ SORA 2 PRO SUCCESS!');
    console.log('═'.repeat(50));
    console.log(`⏱️  Generation time: ${duration}s`);
    console.log(`💰 Actual cost: ~$4.00`);
    console.log(`📐 Resolution: 1080p portrait`);
    console.log(`\n🔗 VIDEO URL:\n${url}\n`);
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
    if (error.message.includes('verified')) {
      console.log('\n💡 Note: Sora 2 Pro may require OpenAI organization verification.');
      console.log('   Visit: platform.openai.com/settings/organization/general');
    }
  }
}

main();

