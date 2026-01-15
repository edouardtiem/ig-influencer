#!/usr/bin/env node
/**
 * Generate NSFW lingerie photos for Elena (no face visible)
 * Uses Venice AI + Lustify SDXL model
 * 
 * Usage: node scripts/generate-elena-nsfw.mjs
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const VENICE_API_KEY = process.env.VENICE_API_KEY;

if (!VENICE_API_KEY) {
  console.error('❌ VENICE_API_KEY not found in .env.local');
  process.exit(1);
}

// Negative prompt for quality
const NEGATIVE_PROMPT = 'cartoon, anime, illustration, deformed, ugly, blurry, low quality, bad anatomy, face visible, looking at camera, front view of face';

// ═══════════════════════════════════════════════════════════════
// ELENA BODY DESCRIPTION — Ultra-detailed for consistency
// ═══════════════════════════════════════════════════════════════
const ELENA_BODY = `24 year old italian woman,
bronde hair dark roots with golden blonde balayage long voluminous beach waves reaching mid-back,
glowing sun-kissed skin with warm undertones,
feminine shapely figure not skinny,
very large natural F-cup breasts,
narrow waist wide hips soft feminine curves,
healthy fit body,
gold chunky chain bracelet on wrist,
layered gold necklaces with medallion pendant`;

// ═══════════════════════════════════════════════════════════════
// EXPLICIT POSES — Face NOT visible
// ═══════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════
// EXPLICIT CONTENT TEST — SHORT PROMPTS (better quality)
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// TESTED & WORKING EXPLICIT PROMPTS — Venice AI Lustify V7
// ═══════════════════════════════════════════════════════════════
// 
// ✅ WORKING TERMS:
//   - "micro g-string barely covering anything"
//   - "side view deep cleavage visible"
//   - "topless bare back visible"
//   - "round behind exposed"
//
// ❌ BLOCKED TERMS (trigger blur/low quality):
//   - "nude", "naked", "wearing nothing"
//   - "bare chest", "breasts visible", "breasts exposed"  
//   - "buttocks fully exposed" (alone)
//   - "side boob"
//   - "intimate parts visible"
//
// ═══════════════════════════════════════════════════════════════

const WORKING_PROMPTS = [
  // 1. ORIGINAL - Topless from behind with thong (2.5MB tested)
  `${ELENA_BODY},
from behind back to camera, kneeling on all fours on white bed,
arched back, face buried in pillow not visible,
wearing only burgundy lace thong,
topless bare back visible,
luxury bedroom soft morning light,
intimate boudoir photography, professional quality, natural skin texture`,

  // 2. MICRO G-STRING - More revealing from behind (2.1MB tested)
  `${ELENA_BODY},
from behind back to camera, kneeling on all fours on white bed,
arched back, face buried in pillow not visible,
wearing only tiny micro g-string barely covering anything,
topless bare back visible round behind exposed,
luxury bedroom soft morning light,
intimate boudoir photography, professional quality, natural skin texture`,

  // 3. SIDE VIEW CLEAVAGE - Topless lying on side (2.2MB tested)
  `${ELENA_BODY},
lying on side on white bed,
wearing only tiny lace panties,
topless side view deep cleavage visible,
arm supporting head face turned away,
soft natural bedroom lighting,
intimate boudoir photography, professional quality`,

  // 4. STANDING MIRROR - Nude back reflection
  `${ELENA_BODY},
standing facing mirror back to camera,
wearing only tiny thong,
topless back visible in reflection,
face hidden by hair angle,
elegant parisian bathroom white marble,
artistic boudoir photography, professional quality`
];

// Use all working prompts
const PROMPTS = WORKING_PROMPTS;

async function generateImage(prompt) {
  console.log('\n🎨 Generating with Venice AI + Lustify V7...');
  console.log(`📝 Prompt: ${prompt.slice(0, 80)}...`);
  
  // Add negative prompt with Venice syntax
  const fullPrompt = `${prompt} --no ${NEGATIVE_PROMPT}`;
  
  const startTime = Date.now();
  
  const response = await fetch('https://api.venice.ai/api/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VENICE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'lustify-v7',
      prompt: fullPrompt,
      n: 1,
      size: '1024x1024'
      // No response_format = base64 by default (better quality)
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Venice API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log(`✅ Generated in ${duration}s`);
  
  return data;
}

async function downloadImage(url, filename) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  
  const outputDir = path.join(__dirname, '../generated/venice-nsfw');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, Buffer.from(buffer));
  
  return filepath;
}

const MIN_FILE_SIZE = 1500000; // 1.5 MB minimum for high quality
const MAX_RETRIES = 5;

async function main() {
  console.log('🔥 Elena NSFW Generator (Venice AI + Lustify V7)');
  console.log('=' .repeat(50));
  console.log(`📏 Min file size: ${(MIN_FILE_SIZE / 1024 / 1024).toFixed(1)} MB`);
  console.log(`🔄 Max retries: ${MAX_RETRIES}\n`);
  
  // Pick random prompt
  const promptIndex = Math.floor(Math.random() * PROMPTS.length);
  const prompt = PROMPTS[promptIndex];
  
  const outputDir = path.join(__dirname, '../generated/venice-nsfw');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`\n🎲 Attempt ${attempt}/${MAX_RETRIES}`);
    
    try {
      const result = await generateImage(prompt);
      
      if (result.data && result.data[0]) {
        const imageData = result.data[0];
        let imageBuffer;
        
        if (imageData.b64_json) {
          imageBuffer = Buffer.from(imageData.b64_json, 'base64');
        } else if (imageData.url) {
          const response = await fetch(imageData.url);
          imageBuffer = Buffer.from(await response.arrayBuffer());
        }
        
        const fileSize = imageBuffer.length;
        const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
        
        console.log(`   📊 Size: ${fileSizeMB} MB`);
        
        if (fileSize >= MIN_FILE_SIZE) {
          // High quality! Save it
          const timestamp = Date.now();
          const filename = `elena-nsfw-${timestamp}.png`;
          const filepath = path.join(outputDir, filename);
          fs.writeFileSync(filepath, imageBuffer);
          
          console.log(`\n✅ HIGH QUALITY IMAGE SAVED!`);
          console.log(`📁 ${filepath}`);
          console.log(`📏 ${fileSizeMB} MB`);
          
          // Open the image
          const { exec } = await import('child_process');
          exec(`open "${filepath}"`);
          return;
        } else {
          console.log(`   ⚠️ Low quality, retrying...`);
        }
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
    
    // Wait before retry
    if (attempt < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  console.log(`\n❌ Failed to get high quality image after ${MAX_RETRIES} attempts`);
  process.exit(1);
}

main();

