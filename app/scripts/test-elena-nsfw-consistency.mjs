#!/usr/bin/env node
/**
 * Test Elena NSFW Consistency with ultra-detailed body description
 * 
 * Uses Venice AI + Lustify V7 with detailed Elena body prompt
 * Tests 4 explicit poses to check body consistency
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

// ═══════════════════════════════════════════════════════════════
// ELENA BODY DESCRIPTION — Ultra-detailed for consistency
// ═══════════════════════════════════════════════════════════════

const ELENA_BODY = `24 year old italian woman,
bronde hair dark roots with golden blonde balayage long voluminous beach waves reaching mid-back,
honey brown warm eyes,
glowing sun-kissed skin with warm undertones,
small beauty mark on right cheekbone,
feminine shapely figure not skinny,
very large natural F-cup breasts prominent emphasized visible,
narrow waist wide hips soft feminine curves,
healthy fit body,
gold chunky chain bracelet on wrist,
layered gold necklaces with medallion pendant`;

const NEGATIVE = 'cartoon, anime, illustration, deformed, ugly, blurry, low quality, bad anatomy, skinny thin body, flat chest, small breasts, medium breasts, plastic skin, airbrushed';

// ═══════════════════════════════════════════════════════════════
// 4 EXPLICIT POSES — From behind / no face visible
// ═══════════════════════════════════════════════════════════════

const POSES = [
  {
    name: 'pose-1-kneeling-behind',
    pose: 'from behind back view, kneeling on bed, arched back, looking over shoulder but face not visible',
    outfit: 'wearing burgundy lace lingerie set thong',
    scene: 'luxury bedroom white silk sheets soft morning light through window',
  },
  {
    name: 'pose-2-standing-mirror',
    pose: 'standing in front of mirror, back to camera, looking at reflection, face obscured',
    outfit: 'wearing black sheer lace bodysuit',
    scene: 'elegant parisian bathroom white marble gold fixtures',
  },
  {
    name: 'pose-3-lying-down',
    pose: 'lying face down on bed, legs bent up, chin resting on hands, face partially hidden by hair',
    outfit: 'wearing white lace bralette and matching thong',
    scene: 'luxurious bright bedroom cream satin sheets natural daylight',
  },
  {
    name: 'pose-4-bent-over',
    pose: 'bent over vanity table from behind, hands on table, arched back, hair falling forward hiding face',
    outfit: 'wearing red satin lingerie set garter belt stockings',
    scene: 'parisian bedroom vanity with hollywood mirror lights warm ambient lighting',
  },
];

// ═══════════════════════════════════════════════════════════════
// GENERATION
// ═══════════════════════════════════════════════════════════════

async function generateImage(poseConfig) {
  const fullPrompt = `${ELENA_BODY},

${poseConfig.pose},

${poseConfig.outfit},

${poseConfig.scene},

professional boudoir photography, intimate atmosphere, high resolution, natural skin texture, realistic lighting --no ${NEGATIVE}`;

  console.log(`\n📝 Generating: ${poseConfig.name}`);
  console.log(`   Pose: ${poseConfig.pose.slice(0, 60)}...`);
  
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
      size: '1024x1024',
      response_format: 'url'
    })
  });

  if (!response.ok) {
    throw new Error(`Venice API error: ${response.status}`);
  }

  const data = await response.json();
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  return { data, duration };
}

async function saveImage(imageData, filename, outputDir) {
  const outputPath = path.join(outputDir, filename);
  
  if (imageData.startsWith('http')) {
    const response = await fetch(imageData);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
  } else {
    fs.writeFileSync(outputPath, Buffer.from(imageData, 'base64'));
  }
  
  return outputPath;
}

async function main() {
  console.log('🔥 Elena NSFW Consistency Test');
  console.log('━'.repeat(50));
  console.log('Testing 4 explicit poses with detailed body description\n');

  if (!VENICE_API_KEY) {
    console.error('❌ VENICE_API_KEY not found');
    process.exit(1);
  }

  const outputDir = path.join(__dirname, '../generated/elena-consistency-test');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = Date.now();
  const results = [];

  for (let i = 0; i < POSES.length; i++) {
    const pose = POSES[i];
    
    try {
      const { data, duration } = await generateImage(pose);
      
      if (data.data && data.data[0]) {
        const imageUrl = data.data[0].url;
        const imageB64 = data.data[0].b64_json;
        const imageData = imageUrl || imageB64;
        
        const filename = `elena-${pose.name}-${timestamp}.png`;
        const savedPath = await saveImage(imageData, filename, outputDir);
        const stats = fs.statSync(savedPath);
        
        console.log(`   ✅ Generated in ${duration}s — ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   📁 ${filename}`);
        
        results.push({ pose: pose.name, file: filename, size: stats.size });
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Small delay between requests
    if (i < POSES.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log('\n' + '━'.repeat(50));
  console.log('🏁 Test completed!\n');
  console.log(`📁 Output: ${outputDir}`);
  console.log('\n📊 Results:');
  results.forEach(r => {
    console.log(`   • ${r.pose}: ${(r.size / 1024 / 1024).toFixed(2)} MB`);
  });
  
  // Open folder
  const { exec } = await import('child_process');
  exec(`open "${outputDir}"`);
}

main().catch(console.error);

