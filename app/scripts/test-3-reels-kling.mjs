#!/usr/bin/env node
/**
 * 3 Reels Test with Kling v2.5 Turbo Pro
 * 
 * Reel 1: Workout / Fitness
 * Reel 2: Morning Coffee / Lifestyle  
 * Reel 3: Mirror Selfie / Getting Ready
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

function fileToBase64(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const base64 = fileBuffer.toString('base64');
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
}

// ═══════════════════════════════════════════════════════════════
// 3 REELS CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const REELS = [
  {
    id: 'workout',
    name: '💪 Reel 1: Workout Energy',
    image: '/Users/edouardtiem/Cursor Projects/IG-influencer/app/generated/gym-carousel/gym-04-mirror-selfie-1765706861941.jpg',
    prompt: `Fitness motivation reel. Cinematic gym lighting.

The woman in athletic wear takes a confident breath, adjusts her position slightly, then flexes subtly while looking at her reflection. 

Natural gym movements:
- Slight body repositioning, weight shift
- Confident posture adjustment
- Hair slightly moving as she moves
- Mirror reflection shows her full form
- Determined focused expression

Athletic energy, empowering vibe. Gym ambient sounds, equipment in background.
Professional fitness content aesthetic, Instagram Reel quality.`,
    duration: 5
  },
  {
    id: 'morning-coffee',
    name: '☕ Reel 2: Paris Morning',
    image: '/Users/edouardtiem/Cursor Projects/IG-influencer/app/generated/morning-coffee-bodysuit/morning-coffee-1765786282957.jpg',
    prompt: `Intimate morning moment. Soft golden light streaming through window.

The woman holds her coffee mug, brings it slowly toward her lips for a gentle sip, then lowers it with a soft satisfied expression. She gazes peacefully toward the window light.

Subtle natural movements:
- Steam rising from hot coffee
- Gentle breathing visible
- Hair catches the morning light
- Curtains sway softly in background
- Serene peaceful expression

Cozy morning aesthetic, dreamy atmosphere. Quiet ambient sounds, soft room tone.
French girl morning vibes, aspirational lifestyle content.`,
    duration: 5
  },
  {
    id: 'mirror-selfie',
    name: '✨ Reel 3: Confidence Check',
    image: '/Users/edouardtiem/Cursor Projects/IG-influencer/app/generated/mirror-selfie-carousel/mirror-selfie-03-confident-1765620623378.jpg',
    prompt: `Getting ready confidence moment. Bedroom mirror scene.

The woman checks herself in the mirror with a confident expression. She does a subtle hair flip, adjusts her pose slightly, and gives a satisfied smile at her reflection.

Natural getting-ready movements:
- Running fingers through curly hair
- Slight body turn to check different angles
- Confident smile forming
- Eyes meeting her reflection
- Natural feminine body language

Self-assured energy, "feeling myself" vibe. Soft bedroom ambient sounds.
Instagram-ready aesthetic, empowering feminine content.`,
    duration: 5
  }
];

// ═══════════════════════════════════════════════════════════════
// GENERATION FUNCTION
// ═══════════════════════════════════════════════════════════════

async function generateReel(replicate, reel) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`${reel.name}`);
  console.log(`${'═'.repeat(60)}`);
  
  if (!fs.existsSync(reel.image)) {
    console.log(`❌ Image not found: ${reel.image}`);
    return { success: false, error: 'Image not found' };
  }
  
  const imageInput = fileToBase64(reel.image);
  console.log(`📷 Image: ${path.basename(reel.image)}`);
  console.log(`📝 Prompt: ${reel.prompt.slice(0, 80)}...`);
  console.log(`⏱️  Duration: ${reel.duration}s`);
  console.log(`\n⏳ Generating with Kling v2.5 Turbo Pro...\n`);
  
  const startTime = Date.now();
  
  try {
    const output = await replicate.run("kwaivgi/kling-v2.5-turbo-pro", {
      input: {
        prompt: reel.prompt,
        image: imageInput,
        duration: reel.duration,
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
    
    return { success: true, url, duration, id: reel.id, name: reel.name };
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`❌ FAILED after ${duration}s`);
    console.log(`   Error: ${error.message.slice(0, 100)}`);
    return { success: false, error: error.message, duration, id: reel.id, name: reel.name };
  }
}

async function main() {
  console.log('\n' + '█'.repeat(60));
  console.log('🎬 3 REELS TEST - Kling v2.5 Turbo Pro');
  console.log('█'.repeat(60));
  console.log('\nGenerating 3 Instagram Reels concepts...\n');
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  const results = [];
  
  for (const reel of REELS) {
    const result = await generateReel(replicate, reel);
    results.push(result);
  }
  
  // Summary
  console.log('\n' + '█'.repeat(60));
  console.log('📊 RESULTS SUMMARY');
  console.log('█'.repeat(60));
  
  let totalCost = 0;
  
  for (const result of results) {
    console.log(`\n${result.name}`);
    if (result.success) {
      console.log(`   ✅ Generated in ${result.duration}s`);
      console.log(`   🔗 ${result.url}`);
      totalCost += 0.50;
    } else {
      console.log(`   ❌ Failed: ${result.error?.slice(0, 50)}...`);
    }
  }
  
  const successful = results.filter(r => r.success).length;
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📈 ${successful}/3 reels generated`);
  console.log(`💰 Total cost: ~$${totalCost.toFixed(2)}`);
  console.log(`${'─'.repeat(60)}`);
  
  console.log('\n🎯 Check videos in Replicate dashboard or use the URLs above');
  console.log('   Compare for: movement quality, face consistency, engagement potential\n');
}

main();

