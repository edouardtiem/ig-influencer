#!/usr/bin/env node
/**
 * Test: Nano Banana Pro WITHOUT reference images
 * To check if Elena refs are the problem
 */

import Replicate from 'replicate';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const ELENA_BASE = `Beautiful woman with bronde hair (dark roots, golden blonde balayage), 
long beach waves past shoulders, honey brown warm eyes, 
soft round pleasant face, feminine shapely figure`;

async function main() {
  const testNum = parseInt(process.argv[2]) || 1;
  
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('❌ REPLICATE_API_TOKEN not set');
    process.exit(1);
  }
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  const tests = {
    1: {
      name: "Sweater (no ref)",
      prompt: `Professional Instagram photo. ${ELENA_BASE}.
Wearing cream cashmere sweater, sitting on sofa.
Natural warm expression.`
    },
    2: {
      name: "Bikini beach (no ref)", 
      prompt: `Professional Instagram photo. ${ELENA_BASE}.
Wearing black two-piece swimsuit on beach.
Natural relaxed pose, ocean background.`
    },
    3: {
      name: "Evening dress (no ref)",
      prompt: `Professional Instagram photo. ${ELENA_BASE}.
Wearing elegant black evening gown at restaurant.
Sophisticated confident expression.`
    }
  };

  const test = tests[testNum];
  if (!test) {
    console.log('Tests: 1=sweater, 2=bikini, 3=dress');
    return;
  }

  console.log(`\n🧪 TEST ${testNum}: ${test.name} (NO REFERENCE IMAGES)`);
  console.log('═'.repeat(60));
  
  const startTime = Date.now();
  
  try {
    const output = await replicate.run("google/nano-banana-pro", {
      input: {
        prompt: test.prompt,
        aspect_ratio: "4:5",
        resolution: "2K",
        output_format: "jpg",
        safety_filter_level: "block_only_high",
        // NO image_input - testing without refs
      },
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ PASSED in ${duration}s`);
    console.log('Output type:', typeof output);
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n❌ FAILED in ${duration}s`);
    console.log('Error:', error.message?.substring(0, 150));
  }
}

main().catch(console.error);
