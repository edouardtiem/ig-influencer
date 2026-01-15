#!/usr/bin/env node
/**
 * Generate Kling Video: Sweater Paris BACK VIEW
 * She turns around toward camera
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import Replicate from 'replicate';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const IMAGE_URL = 'https://res.cloudinary.com/dily60mr0/image/upload/v1767950088/elena-reels/kling-ready-sweater-back-1767950087710.jpg';

async function main() {
  console.log('🎬 KLING VIDEO: Sweater Paris - Back View Turn\n');
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  const prompt = `SETTING: Elegant Parisian apartment, morning light through large French windows, view of Haussmannian rooftops. Herringbone parquet floor, mauve velvet sofa.

ACTION (10 seconds):
- She stands still for 2 seconds, gazing at Paris through the window
- Slowly turns her head over her shoulder toward camera
- Her body follows, rotating 90 degrees gracefully
- Hair swings naturally with the movement
- A soft knowing smile forms as she makes eye contact
- She tilts her head slightly, confident morning glow
- Settles into facing camera position

STYLE: Instagram Reel 2026 aesthetic
- iPhone video quality, authentic vibe
- Intimate Parisian morning energy
- Natural fluid movement, "caught on camera" feel
- Main character energy, cozy confident

SPEED: REAL-TIME only, NO slow motion

MOVEMENTS:
- Hair flowing with turn
- Natural body rotation
- Subtle weight shift on hips
- Sweater fabric moving naturally
- Breathing visible

CAMERA: Static, very subtle push-in allowed`;

  console.log('Image:', IMAGE_URL);
  console.log('\nCalling Kling v2.5...');
  console.log('⏳ This takes ~2-3 minutes...\n');
  
  const output = await replicate.run("kwaivgi/kling-v2.5-turbo-pro", {
    input: {
      prompt: prompt,
      image: IMAGE_URL,
      duration: 10,
      aspect_ratio: "9:16"
    }
  });

  console.log('='.repeat(60));
  console.log('🎉 KLING VIDEO READY!');
  console.log('='.repeat(60));
  console.log(`\n📹 Video URL:\n${output}\n`);
}

main().catch(console.error);
