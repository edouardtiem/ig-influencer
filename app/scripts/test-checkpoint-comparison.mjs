/**
 * Test LoRA with different checkpoints
 * Usage: node app/scripts/test-checkpoint-comparison.mjs [checkpoint_name]
 * 
 * Examples:
 *   node app/scripts/test-checkpoint-comparison.mjs bigLust_v16.safetensors
 *   node app/scripts/test-checkpoint-comparison.mjs bigLoveXL.safetensors
 */

import { queuePrompt, getHistory, checkConnection, getCheckpoints } from './comfyui-api.mjs';
import path from 'path';

const OUTPUT_DIR = path.join(process.env.HOME, 'ComfyUI/output');

function buildWorkflow(checkpoint, loraName, seed, filenamePrefix) {
  const positive = `elena, 24 year old Italian woman,
honey brown warm eyes, bronde hair with dark roots and golden blonde balayage, long beach waves,
small beauty mark on right cheekbone,
wearing white lace lingerie, lying on silk bed sheets,
large natural breasts, cleavage visible, seductive pose,
soft bedroom lighting, boudoir photography,
masterpiece, best quality, photorealistic, 8k uhd,
natural skin texture, detailed skin pores`;

  const negative = `worst quality, low quality, blurry, cartoon, anime,
bad anatomy, bad hands, extra fingers, deformed,
watermark, text, logo, male, man,
plastic skin, oversaturated`;

  return {
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": { "ckpt_name": checkpoint }
    },
    "2": {
      "class_type": "LoraLoader",
      "inputs": {
        "lora_name": loraName,
        "strength_model": 1.0,
        "strength_clip": 1.0,
        "model": ["1", 0],
        "clip": ["1", 1]
      }
    },
    "3": {
      "class_type": "CLIPTextEncode",
      "inputs": { "text": positive, "clip": ["2", 1] }
    },
    "4": {
      "class_type": "CLIPTextEncode",
      "inputs": { "text": negative, "clip": ["2", 1] }
    },
    "5": {
      "class_type": "EmptyLatentImage",
      "inputs": { "width": 832, "height": 1216, "batch_size": 1 }
    },
    "6": {
      "class_type": "KSampler",
      "inputs": {
        "seed": seed,
        "steps": 30,
        "cfg": 3.5,
        "sampler_name": "dpmpp_2m_sde",
        "scheduler": "karras",
        "denoise": 1.0,
        "model": ["2", 0],
        "positive": ["3", 0],
        "negative": ["4", 0],
        "latent_image": ["5", 0]
      }
    },
    "7": {
      "class_type": "VAEDecode",
      "inputs": { "samples": ["6", 0], "vae": ["1", 2] }
    },
    "8": {
      "class_type": "SaveImage",
      "inputs": { "filename_prefix": filenamePrefix, "images": ["7", 0] }
    }
  };
}

async function waitForCompletion(promptId, maxWaitMs = 600000) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    try {
      const history = await getHistory(promptId);
      if (history[promptId]?.outputs && Object.keys(history[promptId].outputs).length > 0) {
        return history[promptId];
      }
      if (history[promptId]?.status?.status_str === 'error') {
        throw new Error(`Generation failed`);
      }
      process.stdout.write(`\r⏳ ${Math.round((Date.now() - startTime) / 1000)}s`);
      await new Promise(r => setTimeout(r, 3000));
    } catch (e) {
      if (e.message.includes('failed')) throw e;
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  throw new Error('Timeout');
}

async function main() {
  const checkpoint = process.argv[2] || 'bigLust_v16.safetensors';
  const loraName = 'elena_v4_cloud.safetensors';
  const seed = Math.floor(Math.random() * 1000000000);
  
  console.log('============================================================');
  console.log('CHECKPOINT COMPARISON TEST');
  console.log('============================================================');
  console.log(`Checkpoint: ${checkpoint}`);
  console.log(`LoRA: ${loraName}`);
  console.log(`Seed: ${seed}`);
  console.log('============================================================\n');
  
  const status = await checkConnection();
  if (!status.connected) {
    console.error('❌ ComfyUI not running');
    process.exit(1);
  }
  
  // Check if checkpoint exists
  const checkpoints = await getCheckpoints();
  if (!checkpoints.includes(checkpoint)) {
    console.error(`❌ Checkpoint not found: ${checkpoint}`);
    console.log('\nAvailable checkpoints:');
    checkpoints.forEach(c => console.log(`  - ${c}`));
    process.exit(1);
  }
  
  const checkpointShort = checkpoint.replace('.safetensors', '');
  const filenamePrefix = `Elena_${checkpointShort}_LoRA`;
  
  console.log(`Generating with ${checkpoint}...`);
  
  const workflow = buildWorkflow(checkpoint, loraName, seed, filenamePrefix);
  const { prompt_id } = await queuePrompt(workflow);
  
  const result = await waitForCompletion(prompt_id);
  const output = Object.values(result.outputs).find(o => o.images);
  
  if (output?.images?.length) {
    const filename = output.images[0].filename;
    const filepath = path.join(OUTPUT_DIR, filename);
    console.log(`\n\n✅ Done: ${filepath}`);
    
    const { exec } = await import('child_process');
    exec(`open "${filepath}"`);
  }
}

main().catch(console.error);
