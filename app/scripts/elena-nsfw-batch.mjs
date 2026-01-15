#!/usr/bin/env node
/**
 * Elena NSFW Batch Generator — Generate multiple images, curate the best
 * 
 * Strategy: Generate 10+ images in batch, auto-filter by quality,
 * then manually curate the best ones for Fanvue
 * 
 * Usage: node scripts/elena-nsfw-batch.mjs [count] [pose]
 *   count: number of images (default: 10)
 *   pose: specific pose (1-6) or 'all' for variety
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
const MIN_FILE_SIZE = 1_200_000; // 1.2 MB minimum for decent quality (lowered for more variety)
const BATCH_SIZE = parseInt(process.argv[2]) || 10;
const POSE_FILTER = process.argv[3] || 'all';

// ═══════════════════════════════════════════════════════════════
// ELENA BODY — Consistent description
// ═══════════════════════════════════════════════════════════════

const ELENA_BODY = `24 year old italian woman,
bronde hair dark roots golden blonde balayage long beach waves mid-back,
glowing sun-kissed skin warm undertones,
feminine shapely curvy figure,
very large natural F-cup breasts,
narrow waist wide hips soft curves,
healthy fit body,
gold bracelet layered gold necklaces`;

const NEGATIVE = 'cartoon, anime, illustration, deformed, ugly, blurry, low quality, bad anatomy, skinny flat chest small breasts plastic airbrushed unrealistic';

// ═══════════════════════════════════════════════════════════════
// EXPLICIT POSES — Optimized for consistent anatomy
// ═══════════════════════════════════════════════════════════════

const POSES = [
  {
    id: 1,
    name: 'lying-back',
    description: 'Lying on back on bed, legs slightly apart, arms above head',
    prompt: `${ELENA_BODY},
lying on back on white silk bed, knees slightly bent, arms raised above head,
completely nude, full frontal view, 
soft natural lighting from window, intimate boudoir,
professional photography, realistic skin texture`,
  },
  {
    id: 2,
    name: 'kneeling-front',
    description: 'Kneeling on bed facing camera',
    prompt: `${ELENA_BODY},
kneeling on white bed facing camera, knees slightly apart, hands on thighs,
completely nude, full frontal view,
soft morning bedroom light, intimate atmosphere,
professional boudoir photography, natural skin`,
  },
  {
    id: 3,
    name: 'standing-mirror',
    description: 'Standing nude in front of mirror',
    prompt: `${ELENA_BODY},
standing nude in front of full length mirror, slight angle showing curves,
completely nude, side front view showing breasts and hips,
elegant parisian bathroom marble, soft ambient light,
artistic boudoir, professional photography`,
  },
  {
    id: 4,
    name: 'sitting-bed',
    description: 'Sitting on edge of bed',
    prompt: `${ELENA_BODY},
sitting on edge of bed, legs crossed, leaning back on hands,
completely nude, frontal three quarter view,
luxury bedroom soft sheets, warm morning light,
intimate photography, natural realistic skin`,
  },
  {
    id: 5,
    name: 'lying-side',
    description: 'Lying on side showing curves',
    prompt: `${ELENA_BODY},
lying on side on white bed, head propped on hand, top leg bent forward,
completely nude, side view showing breast and hip curves,
soft bedroom lighting, silk sheets,
professional boudoir, intimate atmosphere`,
  },
  {
    id: 6,
    name: 'bent-over',
    description: 'Bent over from behind',
    prompt: `${ELENA_BODY},
bent over from behind, hands on bed, arched back, looking over shoulder,
wearing only tiny thong string, topless,
luxury bedroom soft lighting, round behind emphasized,
intimate boudoir photography, realistic skin`,
  },
];

// ═══════════════════════════════════════════════════════════════
// GENERATION
// ═══════════════════════════════════════════════════════════════

async function generateImage(prompt, index) {
  const fullPrompt = `${prompt} --no ${NEGATIVE}`;
  
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
      // base64 by default for better quality
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Venice API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  return { data, duration };
}

async function saveImage(imageData, filename, outputDir) {
  const outputPath = path.join(outputDir, filename);
  
  let buffer;
  if (imageData.b64_json) {
    buffer = Buffer.from(imageData.b64_json, 'base64');
  } else if (imageData.url) {
    const response = await fetch(imageData.url);
    buffer = Buffer.from(await response.arrayBuffer());
  }
  
  fs.writeFileSync(outputPath, buffer);
  return { path: outputPath, size: buffer.length };
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('🔥 Elena NSFW Batch Generator');
  console.log('═'.repeat(60));
  console.log(`📊 Generating ${BATCH_SIZE} images`);
  console.log(`📏 Min quality: ${(MIN_FILE_SIZE / 1024 / 1024).toFixed(1)} MB`);
  console.log(`🎭 Poses: ${POSE_FILTER === 'all' ? 'varied' : `pose ${POSE_FILTER}`}\n`);

  if (!VENICE_API_KEY) {
    console.error('❌ VENICE_API_KEY not found');
    process.exit(1);
  }

  const timestamp = Date.now();
  const outputDir = path.join(__dirname, `../generated/elena-nsfw-batch-${timestamp}`);
  fs.mkdirSync(outputDir, { recursive: true });

  const results = { good: [], rejected: [] };
  const concurrency = 3; // Parallel requests

  // Select poses
  let selectedPoses;
  if (POSE_FILTER === 'all') {
    selectedPoses = Array.from({ length: BATCH_SIZE }, (_, i) => POSES[i % POSES.length]);
  } else {
    const poseIndex = parseInt(POSE_FILTER) - 1;
    if (poseIndex >= 0 && poseIndex < POSES.length) {
      selectedPoses = Array(BATCH_SIZE).fill(POSES[poseIndex]);
    } else {
      console.error(`❌ Invalid pose: ${POSE_FILTER}. Use 1-${POSES.length} or 'all'`);
      process.exit(1);
    }
  }

  // Generate in batches for parallelism
  for (let i = 0; i < BATCH_SIZE; i += concurrency) {
    const batch = selectedPoses.slice(i, i + concurrency);
    const batchPromises = batch.map(async (pose, j) => {
      const index = i + j + 1;
      console.log(`\n[${index}/${BATCH_SIZE}] 🎨 Generating: ${pose.name}...`);
      
      try {
        const { data, duration } = await generateImage(pose.prompt, index);
        
        if (data.data && data.data[0]) {
          const imageData = data.data[0];
          const filename = `elena-${pose.name}-${index}-${timestamp}.png`;
          const { path: savedPath, size } = await saveImage(imageData, filename, outputDir);
          const sizeMB = (size / 1024 / 1024).toFixed(2);
          
          if (size >= MIN_FILE_SIZE) {
            console.log(`   ✅ GOOD: ${sizeMB} MB (${duration}s)`);
            results.good.push({ pose: pose.name, file: filename, size, sizeMB });
          } else {
            console.log(`   ⚠️  LOW: ${sizeMB} MB (${duration}s)`);
            results.rejected.push({ pose: pose.name, file: filename, size, sizeMB });
          }
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    });
    
    await Promise.all(batchPromises);
    
    // Small delay between batches
    if (i + concurrency < BATCH_SIZE) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 BATCH COMPLETE');
  console.log('═'.repeat(60));
  console.log(`\n✅ Good quality: ${results.good.length}/${BATCH_SIZE}`);
  console.log(`⚠️  Low quality: ${results.rejected.length}/${BATCH_SIZE}`);
  
  if (results.good.length > 0) {
    console.log('\n📸 Best images:');
    results.good
      .sort((a, b) => b.size - a.size)
      .forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.file} — ${r.sizeMB} MB`);
      });
  }

  console.log(`\n📁 Output: ${outputDir}`);
  
  // Save results JSON for reference
  fs.writeFileSync(
    path.join(outputDir, 'results.json'),
    JSON.stringify({ good: results.good, rejected: results.rejected, timestamp }, null, 2)
  );

  // Open folder
  const { exec } = await import('child_process');
  exec(`open "${outputDir}"`);
}

main().catch(console.error);
