#!/usr/bin/env node
/**
 * Test Sora 2 vs Veo 3.1 - Side by side comparison
 * 
 * Run with: node scripts/test-sora2-vs-veo31.mjs
 */

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment from .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

// Input image - can be URL or local path
// Pass as argument: node scripts/test-sora2-vs-veo31.mjs "https://..."
const INPUT_IMAGE = process.argv[2] || null;

// Convert local file to base64 data URI
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
// PROMPTS - Optimized for hyper-realism (minimal character movement)
// ═══════════════════════════════════════════════════════════════

// SORA 2 PROMPT - Leverages its superior physics simulation
const SORA_2_PROMPT = `Cinematic morning scene. Static camera, 35mm lens. 

The woman stands still by the window holding her coffee mug. Subtle natural movements only:
- Gentle steam rising from the hot coffee cup
- Soft morning sunlight rays shifting through sheer curtains
- Curtains swaying very slightly from gentle breeze
- Her curly auburn hair has the faintest movement from the breeze
- Natural breathing motion visible in her shoulders

No walking, no arm movement, no expression changes. Photorealistic, warm golden hour lighting, shallow depth of field. Ambient morning sounds: distant birds, soft room tone.`;

// VEO 3.1 PROMPT - Optimized for its reference-based approach
const VEO_31_PROMPT = `Hyper-realistic morning coffee moment. Woman standing motionless by window.

Subtle environmental animation only:
- Steam wisps rising slowly from coffee mug
- Morning light gently flickering through linen curtains  
- Curtain fabric barely swaying
- Hair strands catching light with micro-movements
- Soft breathing visible

Static pose, no gestures. Warm intimate bedroom lighting. Photorealistic cinematic quality. Ambient audio: quiet morning atmosphere, gentle room ambiance.`;

async function main() {
  console.log('🎬 Starting Sora 2 vs Veo 3.1 comparison test\n');
  console.log('═'.repeat(60));
  
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    console.error('❌ REPLICATE_API_TOKEN not found in .env.local');
    process.exit(1);
  }
  
  const replicate = new Replicate({ auth: apiToken });
  
  // Prepare image input
  console.log('\n📷 Preparing input image...');
  
  if (!INPUT_IMAGE) {
    console.error('❌ No input image provided!');
    console.log('   Usage: node scripts/test-sora2-vs-veo31.mjs "https://your-image-url.jpg"');
    console.log('   Or:    node scripts/test-sora2-vs-veo31.mjs "/path/to/local/image.jpg"');
    process.exit(1);
  }
  
  let imageInput;
  
  if (isUrl(INPUT_IMAGE)) {
    imageInput = INPUT_IMAGE;
    console.log('   ✅ Using URL:', INPUT_IMAGE.slice(0, 60) + '...');
  } else if (fs.existsSync(INPUT_IMAGE)) {
    imageInput = fileToBase64(INPUT_IMAGE);
    console.log('   ✅ Loaded from local file:', INPUT_IMAGE);
  } else {
    console.error('❌ Input image not found:', INPUT_IMAGE);
    process.exit(1);
  }
  
  const results = {
    sora2: null,
    veo31: null
  };
  
  // ─────────────────────────────────────────────────────────────
  // TEST 1: SORA 2
  // ─────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('🔵 TEST 1: OpenAI Sora 2');
  console.log('═'.repeat(60));
  console.log('\n📝 Prompt:', SORA_2_PROMPT.slice(0, 100) + '...');
  console.log('⏱️  Duration: 8 seconds');
  console.log('📐 Resolution: 720p (9:16 portrait)');
  console.log('\n⏳ Generating... (this may take 2-5 minutes)\n');
  
  try {
    const startSora = Date.now();
    
    const soraOutput = await replicate.run("openai/sora-2", {
      input: {
        prompt: SORA_2_PROMPT,
        image: imageInput,
        duration: 8,
        aspect_ratio: "portrait", // Sora 2 uses "portrait"/"landscape"
        resolution: "720p"
      }
    });
    
    const soraDuration = ((Date.now() - startSora) / 1000).toFixed(1);
    
    // Extract URL from output
    let soraUrl = null;
    if (typeof soraOutput === 'string') {
      soraUrl = soraOutput;
    } else if (soraOutput?.url) {
      soraUrl = typeof soraOutput.url === 'function' ? soraOutput.url().href : soraOutput.url;
    } else if (Array.isArray(soraOutput) && soraOutput[0]) {
      soraUrl = typeof soraOutput[0] === 'string' ? soraOutput[0] : soraOutput[0]?.url;
    }
    
    results.sora2 = {
      success: true,
      url: soraUrl,
      duration: soraDuration,
      cost: '$0.80' // 8s × $0.10
    };
    
    console.log('✅ SORA 2 COMPLETE');
    console.log(`   ⏱️  Generated in ${soraDuration}s`);
    console.log(`   💰 Estimated cost: $0.80`);
    console.log(`   🔗 URL: ${soraUrl}`);
    
  } catch (error) {
    console.error('❌ Sora 2 failed:', error.message);
    results.sora2 = { success: false, error: error.message };
  }
  
  // ─────────────────────────────────────────────────────────────
  // TEST 2: VEO 3.1
  // ─────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('🟢 TEST 2: Google Veo 3.1');
  console.log('═'.repeat(60));
  console.log('\n📝 Prompt:', VEO_31_PROMPT.slice(0, 100) + '...');
  console.log('⏱️  Duration: 8 seconds');
  console.log('📐 Resolution: 720p (9:16 portrait)');
  console.log('\n⏳ Generating... (this may take 2-5 minutes)\n');
  
  try {
    const startVeo = Date.now();
    
    const veoOutput = await replicate.run("google/veo-3.1", {
      input: {
        prompt: VEO_31_PROMPT,
        image: imageInput,
        duration: 8,
        aspect_ratio: "9:16",
        resolution: "720p",
        audio: true
      }
    });
    
    const veoDuration = ((Date.now() - startVeo) / 1000).toFixed(1);
    
    // Extract URL from output
    let veoUrl = null;
    if (typeof veoOutput === 'string') {
      veoUrl = veoOutput;
    } else if (veoOutput?.url) {
      veoUrl = typeof veoOutput.url === 'function' ? veoOutput.url().href : veoOutput.url;
    } else if (Array.isArray(veoOutput) && veoOutput[0]) {
      veoUrl = typeof veoOutput[0] === 'string' ? veoOutput[0] : veoOutput[0]?.url;
    }
    
    results.veo31 = {
      success: true,
      url: veoUrl,
      duration: veoDuration,
      cost: '~$0.64-0.80' // estimated
    };
    
    console.log('✅ VEO 3.1 COMPLETE');
    console.log(`   ⏱️  Generated in ${veoDuration}s`);
    console.log(`   💰 Estimated cost: ~$0.64-0.80`);
    console.log(`   🔗 URL: ${veoUrl}`);
    
  } catch (error) {
    console.error('❌ Veo 3.1 failed:', error.message);
    results.veo31 = { success: false, error: error.message };
  }
  
  // ─────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('📊 COMPARISON SUMMARY');
  console.log('═'.repeat(60));
  
  console.log('\n┌─────────────┬────────────────┬──────────────┬─────────┐');
  console.log('│   Model     │     Status     │     Time     │  Cost   │');
  console.log('├─────────────┼────────────────┼──────────────┼─────────┤');
  
  if (results.sora2?.success) {
    console.log(`│ Sora 2      │ ✅ Success     │ ${results.sora2.duration.padStart(8)}s   │ ${results.sora2.cost.padStart(6)} │`);
  } else {
    console.log(`│ Sora 2      │ ❌ Failed      │     N/A      │   N/A   │`);
  }
  
  if (results.veo31?.success) {
    console.log(`│ Veo 3.1     │ ✅ Success     │ ${results.veo31.duration.padStart(8)}s   │ ${results.veo31.cost.padStart(6)} │`);
  } else {
    console.log(`│ Veo 3.1     │ ❌ Failed      │     N/A      │   N/A   │`);
  }
  
  console.log('└─────────────┴────────────────┴──────────────┴─────────┘');
  
  console.log('\n🔗 VIDEO LINKS:');
  console.log('─'.repeat(60));
  
  if (results.sora2?.success) {
    console.log(`\n🔵 SORA 2:\n   ${results.sora2.url}`);
  }
  
  if (results.veo31?.success) {
    console.log(`\n🟢 VEO 3.1:\n   ${results.veo31.url}`);
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('🎬 Test complete! Compare the videos for:');
  console.log('   • Realism (face, body, physics)');
  console.log('   • Movement quality (smooth vs jerky)');
  console.log('   • Character consistency');
  console.log('   • Audio quality');
  console.log('   • Overall engagement potential');
  console.log('═'.repeat(60) + '\n');
}

main();

