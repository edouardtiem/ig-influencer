#!/usr/bin/env node
/**
 * Benchmark: Top 5 Image-to-Video Models for Instagram Reels
 * 
 * Models tested:
 * 1. google/veo-3.1 (reference)
 * 2. minimax/hailuo-2.3 (best for human motion)
 * 3. wan-video/wan-2.5-i2v (open-source, audio, cheap)
 * 4. kwaivgi/kling-v2.5-turbo-pro (most popular)
 * 5. luma/ray (Dream Machine, fast)
 * 
 * Run: node scripts/benchmark-i2v-models.mjs "image-path-or-url"
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

// ═══════════════════════════════════════════════════════════════
// STANDARDIZED PROMPT - Same for all models
// ═══════════════════════════════════════════════════════════════

const STANDARD_PROMPT = `Cinematic portrait, warm golden morning light streaming through window.

A woman with curly auburn hair stands peacefully by a sunlit window, holding a white coffee mug. She wears a fitted grey bodysuit.

Subtle natural movements only:
- Gentle steam wisps rising from the hot coffee
- Soft hair strands moving slightly in light breeze from window
- Natural breathing motion visible in shoulders
- Sheer curtains swaying gently in background
- Warm light rays shifting subtly

Static pose, no walking, no arm movements, no expression changes.
Photorealistic, shallow depth of field, intimate bedroom atmosphere.
Ambient audio: quiet morning, distant birds, soft room tone.`;

// ═══════════════════════════════════════════════════════════════
// MODEL CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════

const MODELS = [
  {
    id: 'veo-3.1',
    name: 'Google Veo 3.1',
    model: 'google/veo-3.1',
    emoji: '🟢',
    getInput: (image, prompt) => ({
      prompt,
      image,
      duration: 8,
      aspect_ratio: '9:16',
      resolution: '720p',
      audio: true
    }),
    estimatedCost: '$0.70'
  },
  {
    id: 'hailuo-2.3',
    name: 'MiniMax Hailuo 2.3',
    model: 'minimax/hailuo-2.3',
    emoji: '🔵',
    getInput: (image, prompt) => ({
      prompt,
      image,
      duration: 6,
      aspect_ratio: '9:16',
      quality: 'standard' // standard (768p) or pro (1080p)
    }),
    estimatedCost: '$0.90'
  },
  {
    id: 'wan-2.5-i2v',
    name: 'Wan 2.5 I2V (Alibaba)',
    model: 'wan-video/wan-2.5-i2v',
    emoji: '🟡',
    getInput: (image, prompt) => ({
      prompt,
      image,
      num_frames: 81, // ~3s at 24fps, or use more
      enable_audio: true
    }),
    estimatedCost: '$0.30'
  },
  {
    id: 'kling-2.5',
    name: 'Kling 2.5 Turbo Pro',
    model: 'kwaivgi/kling-v2.5-turbo-pro',
    emoji: '🟣',
    getInput: (image, prompt) => ({
      prompt,
      image,
      duration: 5,
      aspect_ratio: '9:16'
    }),
    estimatedCost: '$0.50'
  },
  {
    id: 'luma-ray',
    name: 'Luma Ray (Dream Machine)',
    model: 'luma/ray',
    emoji: '🔴',
    getInput: (image, prompt) => ({
      prompt,
      start_image: image,
      duration: '5s',
      aspect_ratio: '9:16'
    }),
    estimatedCost: '$0.40'
  }
];

// ═══════════════════════════════════════════════════════════════
// MAIN BENCHMARK FUNCTION
// ═══════════════════════════════════════════════════════════════

async function runBenchmark(replicate, imageInput, model) {
  const startTime = Date.now();
  
  try {
    const input = model.getInput(imageInput, STANDARD_PROMPT);
    const output = await replicate.run(model.model, { input });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    // Extract URL from various output formats
    let url = null;
    if (typeof output === 'string') {
      url = output;
    } else if (output?.url) {
      url = typeof output.url === 'function' ? output.url().href : output.url;
    } else if (output?.video) {
      url = typeof output.video === 'string' ? output.video : output.video?.url;
    } else if (Array.isArray(output) && output[0]) {
      const first = output[0];
      url = typeof first === 'string' ? first : (first?.url || first?.video);
    } else if (output?.href) {
      url = output.href;
    }
    
    // Try toString as last resort
    if (!url && output?.toString) {
      const str = output.toString();
      if (str.startsWith('http')) url = str;
    }
    
    return {
      success: true,
      url,
      duration,
      cost: model.estimatedCost
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      duration: ((Date.now() - startTime) / 1000).toFixed(1)
    };
  }
}

async function main() {
  console.log('\n' + '═'.repeat(70));
  console.log('🎬 IMAGE-TO-VIDEO BENCHMARK - Top 5 Models for Instagram Reels');
  console.log('═'.repeat(70));
  
  if (!INPUT_IMAGE) {
    console.error('\n❌ Usage: node scripts/benchmark-i2v-models.mjs "image-path-or-url"');
    process.exit(1);
  }
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  // Prepare image
  console.log('\n📷 Preparing input image...');
  let imageInput;
  
  if (isUrl(INPUT_IMAGE)) {
    imageInput = INPUT_IMAGE;
    console.log('   ✅ Using URL:', INPUT_IMAGE.slice(0, 50) + '...');
  } else if (fs.existsSync(INPUT_IMAGE)) {
    imageInput = fileToBase64(INPUT_IMAGE);
    console.log('   ✅ Loaded local file:', path.basename(INPUT_IMAGE));
  } else {
    console.error('❌ Image not found:', INPUT_IMAGE);
    process.exit(1);
  }
  
  console.log('\n📝 Standardized prompt:');
  console.log('─'.repeat(70));
  console.log(STANDARD_PROMPT.slice(0, 200) + '...');
  console.log('─'.repeat(70));
  
  // Run benchmarks sequentially to avoid rate limits
  const results = {};
  
  for (const model of MODELS) {
    console.log(`\n${model.emoji} Testing: ${model.name}`);
    console.log(`   Model: ${model.model}`);
    console.log(`   Est. cost: ${model.estimatedCost}`);
    console.log('   ⏳ Generating...');
    
    results[model.id] = await runBenchmark(replicate, imageInput, model);
    
    if (results[model.id].success) {
      console.log(`   ✅ Done in ${results[model.id].duration}s`);
    } else {
      console.log(`   ❌ Failed: ${results[model.id].error?.slice(0, 80)}...`);
    }
  }
  
  // ─────────────────────────────────────────────────────────────
  // RESULTS SUMMARY
  // ─────────────────────────────────────────────────────────────
  
  console.log('\n' + '═'.repeat(70));
  console.log('📊 BENCHMARK RESULTS');
  console.log('═'.repeat(70));
  
  console.log('\n┌────────────────────────────┬──────────┬──────────┬─────────┐');
  console.log('│         Model              │  Status  │   Time   │  Cost   │');
  console.log('├────────────────────────────┼──────────┼──────────┼─────────┤');
  
  for (const model of MODELS) {
    const r = results[model.id];
    const status = r.success ? '✅ OK    ' : '❌ Failed';
    const time = r.success ? `${r.duration.padStart(5)}s` : '   N/A';
    const cost = r.success ? r.cost.padStart(6) : '   N/A';
    const name = `${model.emoji} ${model.name}`.padEnd(26);
    console.log(`│ ${name} │ ${status} │  ${time}  │ ${cost} │`);
  }
  
  console.log('└────────────────────────────┴──────────┴──────────┴─────────┘');
  
  // Video links
  console.log('\n🔗 VIDEO LINKS (copy to browser to view):');
  console.log('─'.repeat(70));
  
  for (const model of MODELS) {
    const r = results[model.id];
    if (r.success && r.url) {
      console.log(`\n${model.emoji} ${model.name}:`);
      console.log(`   ${r.url}`);
    } else if (!r.success) {
      console.log(`\n${model.emoji} ${model.name}: ❌ ${r.error?.slice(0, 60)}...`);
    }
  }
  
  // Summary
  const successful = MODELS.filter(m => results[m.id].success);
  const totalCost = successful.reduce((sum, m) => {
    const cost = parseFloat(results[m.id].cost.replace('$', ''));
    return sum + cost;
  }, 0);
  
  console.log('\n' + '═'.repeat(70));
  console.log(`📈 SUMMARY: ${successful.length}/${MODELS.length} models succeeded`);
  console.log(`💰 Total benchmark cost: ~$${totalCost.toFixed(2)}`);
  console.log('═'.repeat(70));
  
  console.log('\n🎯 Compare videos for:');
  console.log('   • Face/body consistency (no morphing?)');
  console.log('   • Movement quality (natural physics?)');
  console.log('   • Audio quality (if applicable)');
  console.log('   • Overall "scroll-stopping" potential');
  console.log('   • Best value for daily Reels production\n');
}

main();

