/**
 * ComfyUI ControlNet OpenPose Test
 * 
 * Tests generation with ControlNet OpenPose to control pose composition.
 * Uses pre-made OpenPose skeleton images (no preprocessing needed).
 * 
 * Usage:
 *   node app/scripts/comfyui-controlnet-test.mjs
 */

import { queuePrompt, waitForCompletion, checkConnection, getHistory } from './comfyui-api.mjs';
import path from 'path';

const COMFYUI_URL = 'http://127.0.0.1:8188';
const OUTPUT_DIR = path.join(process.env.HOME, 'ComfyUI/output');

/**
 * Build a ControlNet OpenPose workflow for Big Lust
 */
function buildControlNetWorkflow(options = {}) {
  const {
    positive = 'masterpiece, best quality, photorealistic, beautiful woman',
    negative = 'worst quality, low quality, blurry, cartoon, anime',
    width = 1024,
    height = 1024,
    steps = 30,
    cfg = 3.5,
    seed = Math.floor(Math.random() * 1000000000),
    checkpoint = 'bigLust_v16.safetensors',
    controlnetModel = 'xinsir-openpose-sdxl-1.0.safetensors',
    poseImage = 'elena_pose_bed_selfie.png',
    controlnetStrength = 0.8,
    filenamePrefix = 'ControlNet_OpenPose',
  } = options;

  return {
    // Node 1: Checkpoint Loader
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": {
        "ckpt_name": checkpoint
      }
    },
    // Node 2: CLIP Text Encode (Positive)
    "2": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": positive,
        "clip": ["1", 1]
      }
    },
    // Node 3: CLIP Text Encode (Negative)
    "3": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": negative,
        "clip": ["1", 1]
      }
    },
    // Node 4: Empty Latent Image
    "4": {
      "class_type": "EmptyLatentImage",
      "inputs": {
        "width": width,
        "height": height,
        "batch_size": 1
      }
    },
    // Node 5: ControlNet Loader
    "5": {
      "class_type": "ControlNetLoader",
      "inputs": {
        "control_net_name": controlnetModel
      }
    },
    // Node 6: Load Pose Image
    "6": {
      "class_type": "LoadImage",
      "inputs": {
        "image": poseImage
      }
    },
    // Node 7: Apply ControlNet
    "7": {
      "class_type": "ControlNetApply",
      "inputs": {
        "conditioning": ["2", 0],
        "control_net": ["5", 0],
        "image": ["6", 0],
        "strength": controlnetStrength
      }
    },
    // Node 8: KSampler
    "8": {
      "class_type": "KSampler",
      "inputs": {
        "seed": seed,
        "steps": steps,
        "cfg": cfg,
        "sampler_name": "dpmpp_2m_sde",
        "scheduler": "karras",
        "denoise": 1.0,
        "model": ["1", 0],
        "positive": ["7", 0],  // Use ControlNet-enhanced conditioning
        "negative": ["3", 0],
        "latent_image": ["4", 0]
      }
    },
    // Node 9: VAE Decode
    "9": {
      "class_type": "VAEDecode",
      "inputs": {
        "samples": ["8", 0],
        "vae": ["1", 2]
      }
    },
    // Node 10: Save Image
    "10": {
      "class_type": "SaveImage",
      "inputs": {
        "filename_prefix": filenamePrefix,
        "images": ["9", 0]
      }
    }
  };
}

/**
 * Wait for completion using polling (more reliable than WebSocket)
 */
async function waitForCompletionPolling(promptId, maxWaitMs = 600000) {
  const startTime = Date.now();
  const pollInterval = 5000; // 5 seconds
  
  while (Date.now() - startTime < maxWaitMs) {
    try {
      const history = await getHistory(promptId);
      
      if (history[promptId]) {
        const result = history[promptId];
        
        // Check if completed
        if (result.outputs && Object.keys(result.outputs).length > 0) {
          return result;
        }
        
        // Check for error
        if (result.status?.status_str === 'error') {
          throw new Error(`Generation failed: ${JSON.stringify(result.status)}`);
        }
      }
      
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      process.stdout.write(`\rWaiting... ${elapsed}s`);
      
      await new Promise(r => setTimeout(r, pollInterval));
    } catch (error) {
      if (error.message.includes('Generation failed')) throw error;
      // Network error, continue polling
      await new Promise(r => setTimeout(r, pollInterval));
    }
  }
  
  throw new Error(`Timeout after ${maxWaitMs/1000}s`);
}

async function main() {
  console.log('============================================================');
  console.log('CONTROLNET OPENPOSE TEST');
  console.log('============================================================\n');
  
  // Check connection
  console.log('Checking ComfyUI connection...');
  const status = await checkConnection();
  if (!status.connected) {
    console.error('❌ ComfyUI not accessible:', status.error);
    process.exit(1);
  }
  console.log(`✅ Connected to ComfyUI ${status.version} (${status.device})\n`);
  
  // Build workflow
  const workflow = buildControlNetWorkflow({
    positive: `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
24 year old Italian woman named Elena,
honey brown warm eyes, bronde hair with dark roots and golden blonde balayage, long voluminous beach waves,
small beauty mark on right cheekbone,
very large natural F-cup breasts, narrow waist, wide hips,
lying on white silk bed sheets, taking mirror selfie with smartphone,
phone hiding face, face obscured by phone, face not visible,
wearing black lace lingerie, exposed cleavage,
natural skin texture, soft morning light from window,
gold layered necklaces with medallion pendant,
shot on Canon EOS R5, shallow depth of field, intimate bedroom, amateur photo`,
    negative: `visible face, clear face, full face visible, face in frame, looking at camera,
angular face, sharp jawline, skinny body, flat chest, small breasts,
A-cup, B-cup, C-cup, D-cup,
worst quality, low quality, blurry, cartoon, anime, illustration,
bad anatomy, bad hands, extra fingers, deformed,
watermark, censored, mosaic, plastic skin,
male, man`,
    width: 832,  // Adjusted for portrait-ish
    height: 1216,
    controlnetStrength: 0.75,
    poseImage: 'elena_pose_bed_selfie.png',
    filenamePrefix: 'Elena_ControlNet_BedSelfie',
  });
  
  console.log('Queueing ControlNet generation...');
  console.log(`  - Pose: elena_pose_bed_selfie.png`);
  console.log(`  - ControlNet: xinsir-openpose-sdxl-1.0`);
  console.log(`  - Strength: 0.75`);
  console.log(`  - Resolution: 832x1216\n`);
  
  const { prompt_id } = await queuePrompt(workflow);
  console.log(`Prompt ID: ${prompt_id}`);
  
  console.log('\nGenerating (this may take 3-5 minutes)...');
  const startTime = Date.now();
  
  try {
    const result = await waitForCompletionPolling(prompt_id);
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log(`\n\n✅ Generation complete! (${duration}s)`);
    
    // Get output filename
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
  console.log('TEST COMPLETE');
  console.log('============================================================');
}

main().catch(console.error);
