/**
 * IP-Adapter Body Reference Test
 * 
 * Uses IP-Adapter Plus SDXL with body reference image for consistency.
 * 
 * Usage:
 *   node app/scripts/test-ipadapter-body.mjs
 */

import { queuePrompt, getHistory, checkConnection } from './comfyui-api.mjs';
import path from 'path';

const OUTPUT_DIR = path.join(process.env.HOME, 'ComfyUI/output');

/**
 * Build IP-Adapter body reference workflow
 */
function buildIPAdapterBodyWorkflow(options = {}) {
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
    ipadapterWeight = 0.7,
    filenamePrefix = 'IPAdapter_Body',
  } = options;

  return {
    // Node 1: Checkpoint Loader
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": {
        "ckpt_name": checkpoint
      }
    },
    // Node 2: IP-Adapter Model Loader
    "2": {
      "class_type": "IPAdapterModelLoader",
      "inputs": {
        "ipadapter_file": ipadapterModel
      }
    },
    // Node 3: CLIP Vision Loader
    "3": {
      "class_type": "CLIPVisionLoader",
      "inputs": {
        "clip_name": clipVision
      }
    },
    // Node 4: Load Body Reference Image
    "4": {
      "class_type": "LoadImage",
      "inputs": {
        "image": bodyRefImage
      }
    },
    // Node 5: CLIP Text Encode (Positive)
    "5": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": positive,
        "clip": ["1", 1]
      }
    },
    // Node 6: CLIP Text Encode (Negative)
    "6": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": negative,
        "clip": ["1", 1]
      }
    },
    // Node 7: Empty Latent Image
    "7": {
      "class_type": "EmptyLatentImage",
      "inputs": {
        "width": width,
        "height": height,
        "batch_size": 1
      }
    },
    // Node 8: IP-Adapter Advanced (with clip_vision)
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
    // Node 9: KSampler
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
    // Node 10: VAE Decode
    "10": {
      "class_type": "VAEDecode",
      "inputs": {
        "samples": ["9", 0],
        "vae": ["1", 2]
      }
    },
    // Node 11: Save Image
    "11": {
      "class_type": "SaveImage",
      "inputs": {
        "filename_prefix": filenamePrefix,
        "images": ["10", 0]
      }
    }
  };
}

/**
 * Wait for completion using polling
 */
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
  console.log('IP-ADAPTER BODY REFERENCE TEST');
  console.log('============================================================\n');
  
  // Check connection
  const status = await checkConnection();
  if (!status.connected) {
    console.error('❌ ComfyUI not accessible:', status.error);
    process.exit(1);
  }
  console.log(`✅ Connected to ComfyUI ${status.version}\n`);
  
  // Build workflow
  const workflow = buildIPAdapterBodyWorkflow({
    positive: `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
24 year old Italian woman named Elena,
honey brown warm eyes, bronde hair with dark roots and golden blonde balayage, long voluminous beach waves,
small beauty mark on right cheekbone,
fit athletic toned body, large natural breasts, defined slim waist, toned stomach,
lying on white silk bed sheets, taking mirror selfie with smartphone,
phone hiding face, face obscured by phone, face not visible,
wearing black lace lingerie, exposed cleavage,
natural skin texture, soft morning light from window,
gold layered necklaces with medallion pendant,
shot on Canon EOS R5, shallow depth of field, intimate bedroom, amateur photo`,
    negative: `visible face, clear face, full face visible, face in frame, looking at camera,
angular face, sharp jawline, curvy body, very wide hips, thick thighs,
flat chest, small breasts, A-cup, B-cup,
worst quality, low quality, blurry, cartoon, anime, illustration,
bad anatomy, bad hands, extra fingers, deformed,
watermark, censored, mosaic, plastic skin,
male, man`,
    bodyRefImage: 'elena_body_reference.png',
    ipadapterWeight: 0.4,
    filenamePrefix: 'Elena_IPAdapter_Body',
  });
  
  console.log('Queueing IP-Adapter generation...');
  console.log('  - Body Ref: elena_body_reference.png');
  console.log('  - Model: ip-adapter-plus_sdxl_vit-h');
  console.log('  - Weight: 0.7');
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
