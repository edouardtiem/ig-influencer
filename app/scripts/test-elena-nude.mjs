/**
 * Elena Nude Generation Test
 * 
 * IP-Adapter body reference with nude prompt
 * Weight 0.3 to minimize background influence
 * 
 * Usage:
 *   node app/scripts/test-elena-nude.mjs
 */

import { queuePrompt, getHistory, checkConnection } from './comfyui-api.mjs';
import path from 'path';

const OUTPUT_DIR = path.join(process.env.HOME, 'ComfyUI/output');

/**
 * Build IP-Adapter body workflow for nude generation
 */
function buildNudeWorkflow(options = {}) {
  const {
    positive = 'beautiful woman',
    negative = 'worst quality, low quality',
    width = 832,
    height = 1216,
    steps = 30,
    cfg = 3.5,
    seed = Math.floor(Math.random() * 1000000000),
    checkpoint = 'bigLust_v16.safetensors',
    ipadapterModel = 'ip-adapter-plus_sdxl_vit-h.safetensors',
    clipVision = 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors',
    bodyRefImage = 'elena_body_reference.png',
    ipadapterWeight = 0.3,
    filenamePrefix = 'Elena_Nude',
  } = options;

  return {
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": { "ckpt_name": checkpoint }
    },
    "2": {
      "class_type": "IPAdapterModelLoader",
      "inputs": { "ipadapter_file": ipadapterModel }
    },
    "3": {
      "class_type": "CLIPVisionLoader",
      "inputs": { "clip_name": clipVision }
    },
    "4": {
      "class_type": "LoadImage",
      "inputs": { "image": bodyRefImage }
    },
    "5": {
      "class_type": "CLIPTextEncode",
      "inputs": { "text": positive, "clip": ["1", 1] }
    },
    "6": {
      "class_type": "CLIPTextEncode",
      "inputs": { "text": negative, "clip": ["1", 1] }
    },
    "7": {
      "class_type": "EmptyLatentImage",
      "inputs": { "width": width, "height": height, "batch_size": 1 }
    },
    "8": {
      "class_type": "IPAdapterAdvanced",
      "inputs": {
        "model": ["1", 0],
        "ipadapter": ["2", 0],
        "image": ["4", 0],
        "weight": ipadapterWeight,
        "weight_type": "linear",
        "combine_embeds": "concat",
        "start_at": 0.0,
        "end_at": 1.0,
        "embeds_scaling": "V only",
        "clip_vision": ["3", 0]
      }
    },
    "9": {
      "class_type": "KSampler",
      "inputs": {
        "seed": seed,
        "steps": steps,
        "cfg": cfg,
        "sampler_name": "dpmpp_2m_sde",
        "scheduler": "karras",
        "denoise": 1.0,
        "model": ["8", 0],
        "positive": ["5", 0],
        "negative": ["6", 0],
        "latent_image": ["7", 0]
      }
    },
    "10": {
      "class_type": "VAEDecode",
      "inputs": { "samples": ["9", 0], "vae": ["1", 2] }
    },
    "11": {
      "class_type": "SaveImage",
      "inputs": { "filename_prefix": filenamePrefix, "images": ["10", 0] }
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
      process.stdout.write(`\rWaiting... ${elapsed}s`);
      await new Promise(r => setTimeout(r, pollInterval));
    } catch (error) {
      if (error.message.includes('Generation failed')) throw error;
      await new Promise(r => setTimeout(r, pollInterval));
    }
  }
  throw new Error(`Timeout after ${maxWaitMs/1000}s`);
}

async function main() {
  console.log('============================================================');
  console.log('ELENA NUDE GENERATION TEST');
  console.log('============================================================\n');
  
  const status = await checkConnection();
  if (!status.connected) {
    console.error('❌ ComfyUI not accessible:', status.error);
    process.exit(1);
  }
  console.log(`✅ Connected to ComfyUI ${status.version}\n`);
  
  const workflow = buildNudeWorkflow({
    positive: `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
24 year old Italian woman named Elena,
honey brown warm eyes, bronde hair with dark roots and golden blonde balayage, long voluminous beach waves,
small beauty mark on right cheekbone,
fit athletic toned body, large natural breasts, D-cup, defined slim waist, toned stomach,
completely nude, naked, no clothes,
lying on white bed sheets in luxury bedroom, legs spread apart, knees bent,
intimate pose, seductive expression, looking at camera,
phone in hand taking selfie, phone partially hiding face,
natural skin texture, soft warm lighting from window,
gold layered necklaces with medallion pendant,
luxury hotel room, white bedding, NOT mountains, NOT outdoor, indoor bedroom,
shot on Canon EOS R5, shallow depth of field, amateur photo aesthetic`,
    negative: `visible face, clear face, full face visible,
mountains, snow, outdoor, pool, swimsuit, bikini, clothes, dressed,
flat chest, small breasts, A-cup, B-cup,
worst quality, low quality, blurry, cartoon, anime, illustration,
bad anatomy, bad hands, extra fingers, deformed,
watermark, censored, mosaic, plastic skin,
male, man`,
    ipadapterWeight: 0.3,
    filenamePrefix: 'Elena_Nude_Spread',
  });
  
  console.log('Queueing nude generation...');
  console.log('  - Body Ref: elena_body_reference.png');
  console.log('  - Weight: 0.3 (minimize background influence)');
  console.log('  - Scene: Bedroom, legs spread');
  console.log('  - Resolution: 832x1216\n');
  
  const { prompt_id } = await queuePrompt(workflow);
  console.log(`Prompt ID: ${prompt_id}`);
  
  console.log('\nGenerating (this may take 3-5 minutes)...');
  const startTime = Date.now();
  
  try {
    const result = await waitForCompletionPolling(prompt_id);
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log(`\n\n✅ Generation complete! (${duration}s)`);
    
    const outputs = result.outputs;
    const saveNode = Object.values(outputs).find(o => o.images);
    
    if (saveNode && saveNode.images.length) {
      const image = saveNode.images[0];
      const filepath = path.join(OUTPUT_DIR, image.subfolder || '', image.filename);
      console.log(`\n📸 Image saved: ${filepath}`);
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
  
  console.log('\n============================================================');
}

main().catch(console.error);
