#!/usr/bin/env node
/**
 * Test Alternative Models for Sexy Content
 * Compare different Replicate models with face reference capability
 */

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

// Load env
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

// Mila's reference photos
const MILA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png';

// Test prompt - Explicit sexy test to compare model permissiveness
const TEST_PROMPT = `Mila, 22 year old French woman, copper auburn curly hair,
hazel-green eyes, small beauty mark above left lip,
gold star necklace, slim athletic body with natural full breasts,

wearing sheer black lace lingerie set, see-through bralette showing cleavage, matching thong,

lying seductively on bed with white silk sheets, body arched, one hand in hair,
bedroom with soft candlelight and dim warm lighting,

sultry bedroom eyes, lips parted, seductive expression, sensual pose,

boudoir photography, intimate, sexy, alluring, high resolution`;

// Output directory
const outputDir = path.join(__dirname, '../generated/model-comparison-tests');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// ═══════════════════════════════════════════════════════════════
// MODELS TO TEST
// ═══════════════════════════════════════════════════════════════

const MODELS = {
  // 1. Minimax Image-01 - Character reference support
  minimax: {
    name: 'Minimax Image-01',
    model: 'minimax/image-01',
    input: {
      prompt: TEST_PROMPT,
      aspect_ratio: '3:4',
      subject_reference: MILA_FACE_REF,
    },
  },

  // 2. Nano Banana Pro (Google) - Current model
  nano_banana: {
    name: 'Nano Banana Pro (Google)',
    model: 'google/nano-banana-pro',
    input: {
      prompt: TEST_PROMPT,
      aspect_ratio: '3:4',
    },
  },

  // 3. Flux 1.1 Pro - Known to be more permissive
  flux_pro: {
    name: 'Flux 1.1 Pro',
    model: 'black-forest-labs/flux-1.1-pro',
    input: {
      prompt: TEST_PROMPT,
      aspect_ratio: '3:4',
      output_format: 'jpg',
      safety_tolerance: 6, // Max permissive
    },
  },
};

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function testModel(key, config) {
  console.log(`\n🔄 Testing ${config.name}...`);
  console.log(`   Model: ${config.model}`);
  
  const startTime = Date.now();
  
  try {
    const output = await replicate.run(config.model, { input: config.input });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`   ⏱️  Duration: ${duration}s`);
    
    // Handle different output formats (Replicate FileOutput objects)
    let imageUrl;
    if (typeof output === 'string') {
      imageUrl = output;
    } else if (Array.isArray(output)) {
      const first = output[0];
      // FileOutput object has url() method or is URL-like
      if (first && typeof first === 'object') {
        if (typeof first.url === 'function') {
          imageUrl = first.url().href || first.url().toString();
        } else if (first.href) {
          imageUrl = first.href;
        } else if (typeof first.toString === 'function') {
          imageUrl = first.toString();
        }
      } else if (typeof first === 'string') {
        imageUrl = first;
      }
    } else if (output && typeof output === 'object') {
      // Single FileOutput
      if (typeof output.url === 'function') {
        imageUrl = output.url().href || output.url().toString();
      } else if (output.href) {
        imageUrl = output.href;
      } else if (typeof output.toString === 'function' && !output.toString().includes('[object')) {
        imageUrl = output.toString();
      }
    }
    
    if (!imageUrl || imageUrl.includes('[object') || imageUrl.includes('function')) {
      // Try to get the URL from FileOutput toString
      const str = String(output);
      if (str.startsWith('http')) {
        imageUrl = str;
      } else if (Array.isArray(output) && output[0]) {
        imageUrl = String(output[0]);
      }
    }
    
    if (!imageUrl || !imageUrl.startsWith('http')) {
      console.log(`   ❌ No valid image URL. Raw output type: ${typeof output}`);
      console.log(`   Output: ${String(output).slice(0, 300)}`);
      return null;
    }
    
    console.log(`   ✅ Generated: ${imageUrl}`);
    
    // Download the image
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    const ext = imageUrl.includes('.webp') ? 'webp' : imageUrl.includes('.png') ? 'png' : 'jpg';
    const filename = `${key}-${Date.now()}.${ext}`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, Buffer.from(buffer));
    console.log(`   💾 Saved: ${filepath}`);
    
    return {
      model: config.name,
      url: imageUrl,
      localPath: filepath,
      duration: parseFloat(duration),
      success: true,
    };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return {
      model: config.name,
      error: error.message,
      success: false,
    };
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('       🔬 TESTING ALTERNATIVE MODELS FOR SEXY CONTENT');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`\n📸 Face reference: ${MILA_FACE_REF}`);
  console.log(`📁 Output: ${outputDir}`);
  
  const results = [];
  
  // Compare permissiveness: Minimax vs Nano Banana vs Flux Pro
  const modelsToTest = ['minimax', 'nano_banana', 'flux_pro'];
  
  for (const key of modelsToTest) {
    const config = MODELS[key];
    const result = await testModel(key, config);
    if (result) results.push(result);
  }
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                        📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const successful = results.filter(r => r.success);
  console.log(`✅ Successful: ${successful.length}/${modelsToTest.length}`);
  
  if (successful.length > 0) {
    console.log('\n🖼️  Generated Images:\n');
    successful.forEach((r, i) => {
      console.log(`${i + 1}. ${r.model}`);
      console.log(`   URL: ${r.url}`);
      console.log(`   Local: ${r.localPath}`);
      console.log(`   Time: ${r.duration}s\n`);
    });
  }
  
  // Save results
  const resultsPath = path.join(outputDir, `results-${Date.now()}.json`);
  fs.writeFileSync(resultsPath, JSON.stringify({ 
    timestamp: new Date().toISOString(),
    faceRef: MILA_FACE_REF,
    prompt: TEST_PROMPT,
    results 
  }, null, 2));
  console.log(`📝 Results saved: ${resultsPath}`);
}

main().catch(console.error);

