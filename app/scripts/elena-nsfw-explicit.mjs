#!/usr/bin/env node
/**
 * Elena NSFW Explicit Generator — Optimized prompts for anatomical consistency
 * 
 * Strategy: Use specific aesthetic terms that Lustify handles well,
 * focus on poses that naturally show anatomy consistently
 * 
 * Usage: node scripts/elena-nsfw-explicit.mjs [pose]
 *   pose: 1-4 for specific pose, or random
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && !key.startsWith('#')) process.env[key.trim()] = val.join('=').trim();
  });
}

const VENICE_API_KEY = process.env.VENICE_API_KEY;
const MIN_FILE_SIZE = 1_400_000; // 1.4 MB
const MAX_RETRIES = 6;
const POSE_ARG = process.argv[2] || 'random';

// ═══════════════════════════════════════════════════════════════
// ELENA BODY — Optimized description
// ═══════════════════════════════════════════════════════════════

const ELENA_BASE = `beautiful 24 year old italian woman model,
bronde hair dark roots golden blonde balayage voluminous beach waves,
sun-kissed mediterranean skin warm undertones,
curvy feminine body soft curves,
very large natural F-cup breasts heavy natural shape,
wide hips narrow waist hourglass figure`;

const NEGATIVE = 'cartoon anime illustration deformed ugly blurry low quality bad anatomy skinny flat muscular masculine plastic airbrushed unrealistic small breasts medium breasts';

// ═══════════════════════════════════════════════════════════════
// EXPLICIT POSES — Focus on consistent anatomy
// Terms that work well with Lustify for intimate areas:
// - "smooth intimate area" + "aesthetic nude"
// - "full frontal nude" + specific pose
// - "artistic nude photography" aesthetic framing
// ═══════════════════════════════════════════════════════════════

const EXPLICIT_POSES = [
  {
    id: 1,
    name: 'spread-bed',
    description: 'Lying on bed, legs open, full frontal',
    prompt: `${ELENA_BASE},
lying on back on white silk bed sheets, knees bent legs slightly spread apart,
full frontal nude showing everything, smooth shaved intimate area visible,
hands resting on stomach, eyes closed relaxed expression,
soft natural bedroom light from window, intimate atmosphere,
high end boudoir photography, professional quality, realistic skin texture,
fine art nude aesthetic, tasteful explicit`,
  },
  {
    id: 2,
    name: 'kneeling-spread',
    description: 'Kneeling on bed, frontal view',
    prompt: `${ELENA_BASE},
kneeling on white bed facing camera, knees slightly apart,
completely nude full frontal view, large breasts visible, smooth intimate area,
one hand on thigh other touching hair, seductive confident expression,
luxury bedroom soft morning light, silk sheets,
professional boudoir photography, fine art nude, realistic natural skin`,
  },
  {
    id: 3,
    name: 'reclined-sofa',
    description: 'Reclined on velvet sofa, legs open',
    prompt: `${ELENA_BASE},
reclined on dark velvet sofa chaise longue, one leg up bent one stretched,
fully nude frontal view, large natural breasts, smooth shaved area visible,
arm draped behind head, sultry relaxed pose,
parisian apartment warm ambient lighting, artistic nude photography,
professional quality high resolution realistic skin`,
  },
  {
    id: 4,
    name: 'standing-window',
    description: 'Standing by window, side frontal',
    prompt: `${ELENA_BASE},
standing nude by large window, three quarter frontal view, weight on one leg,
full nude large breasts visible side, smooth intimate area,
looking out window dreamy expression, morning golden light,
elegant apartment interior minimalist, artistic nude photography,
professional fine art quality natural realistic lighting`,
  },
];

// ═══════════════════════════════════════════════════════════════
// GENERATION WITH RETRY
// ═══════════════════════════════════════════════════════════════

async function generateWithRetry(prompt, poseName) {
  const fullPrompt = `${prompt} --no ${NEGATIVE}`;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`   Attempt ${attempt}/${MAX_RETRIES}...`);
    
    try {
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
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API ${response.status}: ${error.slice(0, 100)}`);
      }

      const data = await response.json();
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      
      if (data.data && data.data[0]) {
        const imageData = data.data[0];
        let buffer;
        
        if (imageData.b64_json) {
          buffer = Buffer.from(imageData.b64_json, 'base64');
        } else if (imageData.url) {
          const imgRes = await fetch(imageData.url);
          buffer = Buffer.from(await imgRes.arrayBuffer());
        }
        
        const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);
        
        if (buffer.length >= MIN_FILE_SIZE) {
          console.log(`   ✅ SUCCESS: ${sizeMB} MB (${duration}s)`);
          return { buffer, sizeMB, duration };
        } else {
          console.log(`   ⚠️  Low quality: ${sizeMB} MB, retrying...`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    await new Promise(r => setTimeout(r, 800));
  }
  
  return null;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('🔥 Elena NSFW Explicit Generator');
  console.log('═'.repeat(60));
  console.log(`📏 Min quality: ${(MIN_FILE_SIZE / 1024 / 1024).toFixed(1)} MB`);
  console.log(`🔄 Max retries: ${MAX_RETRIES}\n`);

  if (!VENICE_API_KEY) {
    console.error('❌ VENICE_API_KEY not found');
    process.exit(1);
  }

  // Select pose
  let selectedPose;
  if (POSE_ARG === 'random') {
    selectedPose = EXPLICIT_POSES[Math.floor(Math.random() * EXPLICIT_POSES.length)];
  } else {
    const poseIndex = parseInt(POSE_ARG) - 1;
    if (poseIndex >= 0 && poseIndex < EXPLICIT_POSES.length) {
      selectedPose = EXPLICIT_POSES[poseIndex];
    } else {
      console.log('Available poses:');
      EXPLICIT_POSES.forEach(p => console.log(`  ${p.id}. ${p.name}: ${p.description}`));
      console.log('\nUsage: node scripts/elena-nsfw-explicit.mjs [1-4|random]');
      process.exit(1);
    }
  }

  const timestamp = Date.now();
  const outputDir = path.join(__dirname, '../generated/elena-explicit');
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`🎭 Pose: ${selectedPose.name}`);
  console.log(`📝 ${selectedPose.description}\n`);

  const result = await generateWithRetry(selectedPose.prompt, selectedPose.name);
  
  if (result) {
    const filename = `elena-${selectedPose.name}-${timestamp}.png`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, result.buffer);
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ IMAGE SAVED');
    console.log('═'.repeat(60));
    console.log(`📁 ${filepath}`);
    console.log(`📊 ${result.sizeMB} MB`);
    
    // Open the image
    const { exec } = await import('child_process');
    exec(`open "${filepath}"`);
  } else {
    console.log('\n❌ Failed to generate high-quality image after all retries');
    process.exit(1);
  }
}

main().catch(console.error);
