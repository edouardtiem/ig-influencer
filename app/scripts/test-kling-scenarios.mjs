#!/usr/bin/env node
/**
 * Kling 2.5 Turbo Pro - 3 Different Scenarios Test
 * 
 * Test the limits and capabilities with different creative directions
 * 
 * Run: node scripts/test-kling-scenarios.mjs "image-path-or-url"
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
// 3 DIFFERENT SCENARIOS - Testing Kling's capabilities
// ═══════════════════════════════════════════════════════════════

const SCENARIOS = [
  {
    id: 'subtle-ambient',
    name: '🌅 Scène 1: Subtile & Atmosphérique',
    description: 'Mouvements minimaux, focus sur ambiance et lumière',
    prompt: `Peaceful morning moment. Static cinematic shot.

The woman stands still, holding her coffee. Only subtle environmental movements:
- Delicate steam rising from the cup, catching golden light
- Soft sunbeams shifting through sheer curtains
- Gentle dust particles floating in the light
- Natural breathing, shoulders rising slightly

No other movement. Dreamy atmosphere, warm tones, soft focus background.
Quiet ambient audio: distant morning sounds, gentle room tone.`
  },
  {
    id: 'gentle-action',
    name: '☕ Scène 2: Action Douce',
    description: 'Petit mouvement naturel (boire café, toucher cheveux)',
    prompt: `Intimate morning coffee moment. Cinematic portrait shot.

The woman brings the coffee mug slowly to her lips for a small sip, then lowers it. 
Her curly hair sways gently as she moves.
She glances softly toward the window light.
Steam rises from the warm cup.

Smooth, graceful motion. Natural and unhurried.
Warm golden morning light, shallow depth of field.
Soft ambient sounds, perhaps a gentle sigh of contentment.`
  },
  {
    id: 'dynamic-camera',
    name: '🎬 Scène 3: Mouvement Caméra Cinématique',
    description: 'Camera movement (dolly/pan) autour du sujet statique',
    prompt: `Cinematic reveal shot. Slow camera movement.

Camera slowly dollies in toward the woman standing by the window.
She remains still, holding her coffee, bathed in golden morning light.
As camera moves closer, we see:
- Steam curling up from her cup
- Sunlight creating a soft halo in her curly hair
- Curtains gently swaying in background

Dramatic shallow depth of field, bokeh transitions as camera moves.
Professional cinematography, film grain, warm color grade.
Subtle ambient score, morning atmosphere.`
  }
];

// ═══════════════════════════════════════════════════════════════
// TEST FUNCTION
// ═══════════════════════════════════════════════════════════════

async function runScenario(replicate, imageInput, scenario) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`${scenario.name}`);
  console.log(`📝 ${scenario.description}`);
  console.log(`${'─'.repeat(60)}`);
  console.log(`\nPrompt:\n${scenario.prompt.slice(0, 150)}...`);
  console.log('\n⏳ Generating with Kling 2.5 Turbo Pro...\n');
  
  const startTime = Date.now();
  
  try {
    const output = await replicate.run("kwaivgi/kling-v2.5-turbo-pro", {
      input: {
        prompt: scenario.prompt,
        image: imageInput,
        duration: 5,
        aspect_ratio: '9:16'
      }
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    // Extract URL
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
    }
    
    console.log(`✅ SUCCESS in ${duration}s`);
    console.log(`🔗 ${url}`);
    
    return { success: true, url, duration, scenario: scenario.id };
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`❌ FAILED after ${duration}s: ${error.message.slice(0, 100)}`);
    return { success: false, error: error.message, duration, scenario: scenario.id };
  }
}

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('🟣 KLING 2.5 TURBO PRO - 3 Scenarios Test');
  console.log('═'.repeat(60));
  
  if (!INPUT_IMAGE) {
    console.error('\n❌ Usage: node scripts/test-kling-scenarios.mjs "image-path-or-url"');
    process.exit(1);
  }
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  // Prepare image
  console.log('\n📷 Input image:');
  let imageInput;
  
  if (isUrl(INPUT_IMAGE)) {
    imageInput = INPUT_IMAGE;
    console.log(`   URL: ${INPUT_IMAGE.slice(0, 50)}...`);
  } else if (fs.existsSync(INPUT_IMAGE)) {
    imageInput = fileToBase64(INPUT_IMAGE);
    console.log(`   File: ${path.basename(INPUT_IMAGE)}`);
  } else {
    console.error('❌ Image not found:', INPUT_IMAGE);
    process.exit(1);
  }
  
  // Run all 3 scenarios
  const results = [];
  
  for (const scenario of SCENARIOS) {
    const result = await runScenario(replicate, imageInput, scenario);
    results.push(result);
  }
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESULTS SUMMARY');
  console.log('═'.repeat(60));
  
  for (let i = 0; i < SCENARIOS.length; i++) {
    const scenario = SCENARIOS[i];
    const result = results[i];
    
    console.log(`\n${scenario.name}`);
    if (result.success) {
      console.log(`   ✅ Time: ${result.duration}s | Cost: ~$0.50`);
      console.log(`   🔗 ${result.url}`);
    } else {
      console.log(`   ❌ Failed: ${result.error?.slice(0, 60)}...`);
    }
  }
  
  const successful = results.filter(r => r.success).length;
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📈 ${successful}/${SCENARIOS.length} scenarios completed`);
  console.log(`💰 Total cost: ~$${(successful * 0.5).toFixed(2)}`);
  console.log('═'.repeat(60));
  
  console.log('\n🎯 Évalue chaque scénario pour:');
  console.log('   Scène 1: Qualité des détails subtils (steam, lumière)');
  console.log('   Scène 2: Naturel du mouvement (boire café)');
  console.log('   Scène 3: Qualité du mouvement caméra');
  console.log('\n');
}

main();

