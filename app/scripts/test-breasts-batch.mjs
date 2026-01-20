/**
 * Test Breast Consistency with IPAdapterBatch
 * 
 * Strategy: Combine all reference images in single IPAdapter pass
 * More efficient than chaining multiple IPAdapters
 * 
 * Usage:
 *   node app/scripts/test-breasts-batch.mjs
 */

import { queuePrompt, getHistory, checkConnection } from './comfyui-api.mjs';
import path from 'path';

const OUTPUT_DIR = path.join(process.env.HOME, 'ComfyUI/output');

// Test configurations - different weights
const TESTS = [
  { name: 'batch_w03', weight: 0.3 },
  { name: 'batch_w04', weight: 0.4 },
  { name: 'batch_w05', weight: 0.5 },
];

function buildBatchIPAdapterWorkflow(config, seed) {
  const positive = `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
24 year old Italian woman named Elena,
honey brown warm eyes, bronde hair with dark roots and golden blonde balayage, long wet hair,
small beauty mark on right cheekbone,
fit athletic toned body, 
large natural breasts, D-cup, natural breast shape, soft natural hanging breasts, realistic breast tissue,
NOT fake breasts, NOT implants, NOT silicone, NOT bolt-on,
defined slim waist, toned stomach, smooth skin,
completely nude, naked, no clothes,
standing in luxury shower, water streaming down body, wet glistening skin,
one hand on white tile wall, sensual pose,
luxury Parisian Haussmannian apartment bathroom, white marble tiles, bright clean,
warm soft lighting, steam,
natural skin texture,
gold layered necklaces,
shot on Canon EOS R5, shallow depth of field, intimate boudoir photography`;

  const negative = `fake breasts, implants, silicone breasts, round fake breasts, bolt-on breasts, plastic breasts,
perfectly round breasts, unnaturally perky breasts,
flat chest, small breasts, A-cup, B-cup,
mirror, selfie, phone,
outdoor, bedroom, pool, mountains,
worst quality, low quality, blurry, cartoon, anime,
bad anatomy, bad hands, extra fingers, deformed,
watermark, censored, mosaic, plastic skin,
male, man`;

  return {
    // Checkpoint
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": { "ckpt_name": "bigLust_v16.safetensors" }
    },
    
    // IP-Adapter model
    "2": {
      "class_type": "IPAdapterModelLoader",
      "inputs": { "ipadapter_file": "ip-adapter-plus_sdxl_vit-h.safetensors" }
    },
    
    // CLIP Vision
    "3": {
      "class_type": "CLIPVisionLoader",
      "inputs": { "clip_name": "CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors" }
    },
    
    // Load breast reference image 1 (better breast ref)
    "4": {
      "class_type": "LoadImage",
      "inputs": { "image": "seins/Elena_Nude_Spread_00001_.png" }
    },
    
    // Text prompts
    "10": {
      "class_type": "CLIPTextEncode",
      "inputs": { "text": positive, "clip": ["1", 1] }
    },
    "11": {
      "class_type": "CLIPTextEncode",
      "inputs": { "text": negative, "clip": ["1", 1] }
    },
    
    // Empty latent
    "12": {
      "class_type": "EmptyLatentImage",
      "inputs": { "width": 832, "height": 1216, "batch_size": 1 }
    },
    
    // Single IP-Adapter with breast reference only (replace body ref)
    "20": {
      "class_type": "IPAdapterAdvanced",
      "inputs": {
        "model": ["1", 0],
        "ipadapter": ["2", 0],
        "image": ["4", 0],
        "weight": config.weight,
        "weight_type": "linear",
        "combine_embeds": "concat",
        "start_at": 0.0,
        "end_at": 1.0,
        "embeds_scaling": "V only",
        "clip_vision": ["3", 0]
      }
    },
    
    // KSampler
    "30": {
      "class_type": "KSampler",
      "inputs": {
        "seed": seed,
        "steps": 30,
        "cfg": 3.5,
        "sampler_name": "dpmpp_2m_sde",
        "scheduler": "karras",
        "denoise": 1.0,
        "model": ["20", 0],
        "positive": ["10", 0],
        "negative": ["11", 0],
        "latent_image": ["12", 0]
      }
    },
    
    // VAE Decode
    "31": {
      "class_type": "VAEDecode",
      "inputs": { "samples": ["30", 0], "vae": ["1", 2] }
    },
    
    // Save
    "32": {
      "class_type": "SaveImage",
      "inputs": { 
        "filename_prefix": `Elena_BreastBatch_${config.name}`, 
        "images": ["31", 0] 
      }
    }
  };
}

async function waitForCompletionPolling(promptId, maxWaitMs = 600000) {
  const startTime = Date.now();
  const pollInterval = 5000;
  
  while (Date.now() - startTime < maxWaitMs) {
    try {
      const history = await getHistory(promptId);
      if (history[promptId]) {
        const result = history[promptId];
        if (result.outputs && Object.keys(result.outputs).length > 0) {
          return result;
        }
        if (result.status?.status_str === 'error') {
          throw new Error(`Generation failed: ${JSON.stringify(result.status)}`);
        }
      }
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      process.stdout.write(`\r  ⏳ Generating... ${elapsed}s`);
      await new Promise(r => setTimeout(r, pollInterval));
    } catch (error) {
      if (error.message.includes('Generation failed')) throw error;
      await new Promise(r => setTimeout(r, pollInterval));
    }
  }
  throw new Error(`Timeout`);
}

async function main() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('  BREAST CONSISTENCY TEST — Single IP-Adapter with Breast Ref');
  console.log('════════════════════════════════════════════════════════════\n');
  
  console.log('Reference: seins/Elena_Nude_Spread_00001_.png');
  console.log('Strategy: Use breast ref instead of body ref\n');
  
  const status = await checkConnection();
  if (!status.connected) {
    console.error('❌ ComfyUI not accessible');
    process.exit(1);
  }
  console.log(`✅ Connected to ComfyUI ${status.version}\n`);
  
  const results = [];
  
  for (let i = 0; i < TESTS.length; i++) {
    const config = TESTS[i];
    const seed = 42424242; // Fixed seed for comparison
    
    console.log(`\n[${i + 1}/${TESTS.length}] ${config.name}`);
    console.log(`  Weight: ${config.weight}`);
    
    const workflow = buildBatchIPAdapterWorkflow(config, seed);
    
    try {
      const { prompt_id } = await queuePrompt(workflow);
      const startTime = Date.now();
      const result = await waitForCompletionPolling(prompt_id);
      const duration = Math.round((Date.now() - startTime) / 1000);
      
      const outputs = result.outputs;
      const saveNode = Object.values(outputs).find(o => o.images);
      
      if (saveNode && saveNode.images.length) {
        const image = saveNode.images[0];
        console.log(`\n  ✅ Done (${duration}s) → ${image.filename}`);
        results.push({ config: config.name, file: image.filename, success: true, duration });
      }
    } catch (error) {
      console.log(`\n  ❌ Failed: ${error.message}`);
      results.push({ config: config.name, success: false, error: error.message });
    }
  }
  
  console.log('\n\n════════════════════════════════════════════════════════════');
  console.log('  TEST RESULTS');
  console.log('════════════════════════════════════════════════════════════\n');
  
  results.forEach((r, i) => {
    const status = r.success ? `✅ ${r.duration}s → ${r.file}` : `❌ ${r.error}`;
    console.log(`  ${i + 1}. ${r.config}: ${status}`);
  });
  
  console.log(`\n📁 Images saved to: ${OUTPUT_DIR}`);
  console.log(`\n🔍 Compare with original body ref:`);
  console.log(`   open ~/ComfyUI/output/Elena_BreastBatch_*.png`);
}

main().catch(console.error);
