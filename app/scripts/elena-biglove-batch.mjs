/**
 * Elena Big Love Batch - Multiple poses
 * Big Love XL + LoRA V4 (no FaceID)
 */

import { queuePrompt, getHistory, checkConnection } from './comfyui-api.mjs';
import path from 'path';

const OUTPUT_DIR = path.join(process.env.HOME, 'ComfyUI/output');

const PROMPTS = [
  {
    name: "lingerie_bed",
    positive: `elena, 24 year old Italian woman,
honey brown warm eyes, bronde hair with dark roots and golden blonde balayage, long beach waves,
small beauty mark on right cheekbone,
lying on silk bed sheets, wearing black lace lingerie,
large natural breasts, cleavage, seductive smile,
soft bedroom lighting, boudoir photography,
masterpiece, best quality, photorealistic, 8k uhd, natural skin texture`,
  },
  {
    name: "topless_pool",
    positive: `elena, 24 year old Italian woman,
honey brown warm eyes, bronde hair wet, slicked back,
small beauty mark on right cheekbone,
sitting on edge of infinity pool, topless, white bikini bottoms,
large natural breasts, nipples visible, sun-kissed skin, tan lines,
tropical villa, palm trees, golden hour,
masterpiece, best quality, photorealistic, 8k uhd, wet skin glistening`,
  },
  {
    name: "shower_nude",
    positive: `elena, 24 year old Italian woman,
honey brown warm eyes, bronde hair wet,
small beauty mark on right cheekbone,
standing in glass shower, water droplets on skin,
nude, full body visible, large natural breasts,
modern bathroom, soft natural light,
masterpiece, best quality, photorealistic, 8k uhd, water droplets`,
  },
  {
    name: "mirror_selfie",
    positive: `elena, 24 year old Italian woman,
honey brown warm eyes, bronde hair messy,
small beauty mark on right cheekbone,
mirror selfie in bedroom, wearing only lace thong,
breasts visible, playful expression, holding phone,
modern apartment, morning light,
masterpiece, best quality, photorealistic, 8k uhd, amateur style`,
  },
  {
    name: "couch_sensual",
    positive: `elena, 24 year old Italian woman,
honey brown warm eyes, bronde hair with dark roots and golden blonde balayage,
small beauty mark on right cheekbone,
lying on white couch, wearing unbuttoned white shirt,
breasts exposed, legs spread suggestively, lace panties,
modern living room, soft natural light,
masterpiece, best quality, photorealistic, 8k uhd, intimate photo`,
  },
];

const NEGATIVE = `worst quality, low quality, blurry, cartoon, anime,
bad anatomy, bad hands, extra fingers, deformed,
watermark, text, logo, male, man, plastic skin`;

function buildWorkflow(positive, negative, seed, filenamePrefix) {
  return {
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": { "ckpt_name": "bigLove_xl1.safetensors" }
    },
    "2": {
      "class_type": "LoraLoader",
      "inputs": {
        "lora_name": "elena_v4_cloud.safetensors",
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
        "cfg": 3.0,
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
      process.stdout.write(`\r  ⏳ ${Math.round((Date.now() - startTime) / 1000)}s`);
      await new Promise(r => setTimeout(r, 3000));
    } catch (e) {
      if (e.message.includes('failed')) throw e;
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  throw new Error('Timeout');
}

async function main() {
  console.log('============================================================');
  console.log('ELENA - BIG LOVE XL + LoRA V4 BATCH');
  console.log('============================================================');
  console.log(`Generating ${PROMPTS.length} images...\n`);
  
  const status = await checkConnection();
  if (!status.connected) {
    console.error('❌ ComfyUI not running');
    process.exit(1);
  }
  
  const baseSeed = Math.floor(Math.random() * 1000000000);
  const results = [];
  
  for (let i = 0; i < PROMPTS.length; i++) {
    const prompt = PROMPTS[i];
    const seed = baseSeed + i;
    
    console.log(`\n[${i + 1}/${PROMPTS.length}] ${prompt.name}`);
    
    const workflow = buildWorkflow(
      prompt.positive,
      NEGATIVE,
      seed,
      `Elena_BigLove_${prompt.name}`
    );
    
    const { prompt_id } = await queuePrompt(workflow);
    
    try {
      const result = await waitForCompletion(prompt_id);
      const output = Object.values(result.outputs).find(o => o.images);
      if (output?.images?.length) {
        const filename = output.images[0].filename;
        const filepath = path.join(OUTPUT_DIR, filename);
        results.push({ name: prompt.name, filepath, success: true });
        console.log(`\n  ✅ ${filename}`);
      }
    } catch (e) {
      results.push({ name: prompt.name, error: e.message, success: false });
      console.log(`\n  ❌ Failed: ${e.message}`);
    }
  }
  
  console.log('\n\n============================================================');
  console.log('RESULTS - BIG LOVE + ELENA LoRA V4');
  console.log('============================================================');
  
  const successful = results.filter(r => r.success);
  console.log(`\n✅ ${successful.length}/${PROMPTS.length} generated\n`);
  
  for (const r of successful) {
    console.log(`  ${r.name}: ${r.filepath}`);
  }
  
  if (successful.length > 0) {
    const { exec } = await import('child_process');
    const paths = successful.map(r => `"${r.filepath}"`).join(' ');
    exec(`open ${paths}`);
  }
}

main().catch(console.error);
