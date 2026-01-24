/**
 * Elena LoRA Test - SIMPLE (No FaceID)
 * Just LoRA at high strength to see what it learned
 */

import { queuePrompt, getHistory, checkConnection } from './comfyui-api.mjs';
import path from 'path';

const OUTPUT_DIR = path.join(process.env.HOME, 'ComfyUI/output');

function buildSimpleLoraWorkflow(options = {}) {
  const {
    positive = 'elena, beautiful woman',
    negative = 'worst quality, low quality',
    width = 832,
    height = 1216,
    steps = 30,
    cfg = 3.5,
    seed = Math.floor(Math.random() * 1000000000),
    checkpoint = 'bigLust_v16.safetensors',
    loraName = 'elena_v4_cloud.safetensors',
    loraStrength = 1.0,
    filenamePrefix = 'Elena_V4_Simple',
  } = options;

  return {
    // 1. Load checkpoint
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": { "ckpt_name": checkpoint }
    },
    
    // 2. Load LoRA
    "2": {
      "class_type": "LoraLoader",
      "inputs": {
        "lora_name": loraName,
        "strength_model": loraStrength,
        "strength_clip": loraStrength,
        "model": ["1", 0],
        "clip": ["1", 1]
      }
    },
    
    // 3. Positive prompt
    "3": {
      "class_type": "CLIPTextEncode",
      "inputs": { "text": positive, "clip": ["2", 1] }
    },
    
    // 4. Negative prompt
    "4": {
      "class_type": "CLIPTextEncode",
      "inputs": { "text": negative, "clip": ["2", 1] }
    },
    
    // 5. Empty latent
    "5": {
      "class_type": "EmptyLatentImage",
      "inputs": { "width": width, "height": height, "batch_size": 1 }
    },
    
    // 6. KSampler
    "6": {
      "class_type": "KSampler",
      "inputs": {
        "seed": seed,
        "steps": steps,
        "cfg": cfg,
        "sampler_name": "dpmpp_2m_sde",
        "scheduler": "karras",
        "denoise": 1.0,
        "model": ["2", 0],
        "positive": ["3", 0],
        "negative": ["4", 0],
        "latent_image": ["5", 0]
      }
    },
    
    // 7. VAE Decode
    "7": {
      "class_type": "VAEDecode",
      "inputs": { "samples": ["6", 0], "vae": ["1", 2] }
    },
    
    // 8. Save Image
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
  const loraStrength = parseFloat(process.argv[2]) || 1.0;
  
  console.log('============================================================');
  console.log('ELENA V4 - SIMPLE TEST (NO FaceID)');
  console.log(`LoRA Strength: ${loraStrength}`);
  console.log('============================================================\n');
  
  const status = await checkConnection();
  if (!status.connected) {
    console.error('❌ ComfyUI not running. Start it: cd ~/ComfyUI && python main.py');
    process.exit(1);
  }
  
  const workflow = buildSimpleLoraWorkflow({
    positive: `elena, 24 year old Italian woman,
honey brown warm eyes, bronde hair with dark roots and golden blonde balayage, long beach waves,
small beauty mark on right cheekbone,
wearing white bikini, standing by infinity pool,
tropical villa, palm trees, blue sky,
masterpiece, best quality, photorealistic, 8k uhd,
natural skin texture, sun-kissed skin,
shot on Canon EOS R5, natural sunlight`,
    negative: `worst quality, low quality, blurry, cartoon, anime,
bad anatomy, bad hands, extra fingers, deformed,
watermark, text, logo,
male, man`,
    loraStrength: loraStrength,
    filenamePrefix: `Elena_V4_str${loraStrength}`,
  });
  
  console.log(`Generating with LoRA strength ${loraStrength}...`);
  const { prompt_id } = await queuePrompt(workflow);
  
  const result = await waitForCompletion(prompt_id);
  const saveNode = Object.values(result.outputs).find(o => o.images);
  
  if (saveNode?.images?.length) {
    const image = saveNode.images[0];
    const filepath = path.join(OUTPUT_DIR, image.subfolder || '', image.filename);
    console.log(`\n\n✅ Done! ${filepath}`);
    
    // Open the image
    const { exec } = await import('child_process');
    exec(`open "${filepath}"`);
  }
}

main().catch(console.error);
