#!/usr/bin/env node
/**
 * Elena FaceID Optimized - Phase 1 Optimization
 *
 * Optimized settings to reach ~90% face accuracy:
 * - FaceID weight: 0.75 (lowered from 0.85)
 * - Steps: 40 (increased from 25)
 * - FaceDetailer: denoise 0.4, steps 40, guide size 512
 *
 * Changes from baseline:
 * 1. Lower IPAdapter weight: 0.85 -> 0.75 (better balance)
 * 2. Increase generation steps: 25 -> 40 (more refinement)
 * 3. Add FaceDetailer post-processing (face refinement)
 *
 * Usage:
 *   COMFYUI_URL=https://xxx.proxy.runpod.net node app/scripts/elena-faceid-optimized.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ComfyUI URL - can be local or RunPod proxy
const COMFYUI_URL = process.env.COMFYUI_URL || 'http://127.0.0.1:8188';
const OUTPUT_DIR = path.join(__dirname, '../generated/elena-faceid-test');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Elena face reference image (must be in ComfyUI input folder)
const ELENA_FACE_REF = 'elena_face_ref_v2.png';

/**
 * Check ComfyUI connection
 */
async function checkConnection() {
  try {
    const res = await fetch(`${COMFYUI_URL}/system_stats`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      connected: true,
      version: data.system?.comfyui_version || 'unknown',
    };
  } catch (error) {
    return { connected: false, error: error.message };
  }
}

/**
 * Queue a workflow for generation
 */
async function queuePrompt(workflow) {
  const res = await fetch(`${COMFYUI_URL}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Queue failed: ${JSON.stringify(error)}`);
  }
  return res.json();
}

/**
 * Get generation history
 */
async function getHistory(promptId) {
  const res = await fetch(`${COMFYUI_URL}/history/${promptId}`);
  return res.json();
}

/**
 * Wait for generation to complete (polling)
 */
async function waitForCompletion(promptId, maxWaitMs = 900000) {
  const startTime = Date.now();
  const pollInterval = 3000;

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
      process.stdout.write(`\r  Generating... ${elapsed}s`);
      await new Promise(r => setTimeout(r, pollInterval));
    } catch (error) {
      if (error.message.includes('Generation failed')) throw error;
      await new Promise(r => setTimeout(r, pollInterval));
    }
  }
  throw new Error('Generation timeout');
}

/**
 * Download image from ComfyUI
 */
async function downloadImage(filename, subfolder = '') {
  const params = new URLSearchParams({ filename, subfolder, type: 'output' });
  const res = await fetch(`${COMFYUI_URL}/view?${params}`);
  if (!res.ok) throw new Error(`Failed to download: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Build Optimized FaceID + FaceDetailer workflow
 *
 * Phase 1 Optimizations:
 * - FaceID weight: 0.75 (was 0.85)
 * - Generation steps: 40 (was 25)
 * - FaceDetailer: denoise 0.4, steps 40, guide_size 512
 */
function buildOptimizedFaceIDWorkflow(options = {}) {
  const {
    positive = 'beautiful woman portrait',
    negative = 'worst quality, low quality, blurry',
    seed = Math.floor(Math.random() * 1000000000),
    width = 832,
    height = 1216,
    steps = 40, // INCREASED from 25
    cfg = 4.0,
    faceIdWeight = 0.75, // LOWERED from 0.85
    faceRefImage = ELENA_FACE_REF,
    filenamePrefix = 'Elena_FaceID_Optimized',
    // FaceDetailer settings
    faceDetailerDenoise = 0.4,
    faceDetailerSteps = 40,
    faceDetailerGuideSize = 512,
  } = options;

  return {
    // ========== BASE GENERATION ==========

    // Node 1: Load Checkpoint
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": {
        "ckpt_name": "bigLove_xl1.safetensors"
      }
    },
    // Node 2: Load IP-Adapter FaceID v2
    "2": {
      "class_type": "IPAdapterModelLoader",
      "inputs": {
        "ipadapter_file": "ip-adapter-faceid-plusv2_sdxl.bin"
      }
    },
    // Node 3: Load CLIP Vision
    "3": {
      "class_type": "CLIPVisionLoader",
      "inputs": {
        "clip_name": "CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors"
      }
    },
    // Node 4: Load InsightFace for face embedding
    "4": {
      "class_type": "IPAdapterInsightFaceLoader",
      "inputs": {
        "provider": "CUDA",
        "model_name": "buffalo_l"
      }
    },
    // Node 5: Load face reference image
    "5": {
      "class_type": "LoadImage",
      "inputs": {
        "image": faceRefImage
      }
    },
    // Node 6: Encode positive prompt
    "6": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": positive,
        "clip": ["1", 1]
      }
    },
    // Node 7: Encode negative prompt
    "7": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": negative,
        "clip": ["1", 1]
      }
    },
    // Node 8: Empty latent image
    "8": {
      "class_type": "EmptyLatentImage",
      "inputs": {
        "width": width,
        "height": height,
        "batch_size": 1
      }
    },
    // Node 9: IP-Adapter FaceID Apply (LOWERED WEIGHT)
    "9": {
      "class_type": "IPAdapterFaceID",
      "inputs": {
        "model": ["1", 0],
        "ipadapter": ["2", 0],
        "image": ["5", 0],
        "clip_vision": ["3", 0],
        "insightface": ["4", 0],
        "weight": faceIdWeight,
        "weight_faceidv2": faceIdWeight,
        "weight_type": "linear",
        "combine_embeds": "concat",
        "start_at": 0.0,
        "end_at": 1.0,
        "embeds_scaling": "V only"
      }
    },
    // Node 10: KSampler (INCREASED STEPS)
    "10": {
      "class_type": "KSampler",
      "inputs": {
        "seed": seed,
        "steps": steps,
        "cfg": cfg,
        "sampler_name": "dpmpp_2m_sde",
        "scheduler": "karras",
        "denoise": 1.0,
        "model": ["9", 0],
        "positive": ["6", 0],
        "negative": ["7", 0],
        "latent_image": ["8", 0]
      }
    },
    // Node 11: VAE Decode (for base image)
    "11": {
      "class_type": "VAEDecode",
      "inputs": {
        "samples": ["10", 0],
        "vae": ["1", 2]
      }
    },

    // ========== FACEDETAILER POST-PROCESSING ==========

    // Node 12: Load face detection model (BBOX)
    "12": {
      "class_type": "UltralyticsDetectorProvider",
      "inputs": {
        "model_name": "bbox/face_yolov8m.pt"
      }
    },
    // Node 13: Load SAM model for segmentation
    "13": {
      "class_type": "SAMLoader",
      "inputs": {
        "model_name": "sam_vit_b_01ec64.pth",
        "device_mode": "AUTO"
      }
    },
    // Node 14: FaceDetailer - refines face with better details
    "14": {
      "class_type": "FaceDetailer",
      "inputs": {
        "image": ["11", 0],
        "model": ["9", 0],
        "clip": ["1", 1],
        "vae": ["1", 2],
        "positive": ["6", 0],
        "negative": ["7", 0],
        "bbox_detector": ["12", 0],
        "sam_model_opt": ["13", 0],
        "guide_size": faceDetailerGuideSize,
        "guide_size_for": true,
        "max_size": 1024,
        "seed": seed,
        "steps": faceDetailerSteps,
        "cfg": cfg,
        "sampler_name": "dpmpp_2m_sde",
        "scheduler": "karras",
        "denoise": faceDetailerDenoise,
        "feather": 5,
        "noise_mask": true,
        "force_inpaint": true,
        "bbox_threshold": 0.5,
        "bbox_dilation": 10,
        "bbox_crop_factor": 3.0,
        "sam_detection_hint": "center-1",
        "sam_dilation": 0,
        "sam_threshold": 0.93,
        "sam_bbox_expansion": 0,
        "sam_mask_hint_threshold": 0.7,
        "sam_mask_hint_use_negative": "False",
        "drop_size": 10,
        "wildcard": "",
        "cycle": 1
      }
    },
    // Node 15: Save Final Image
    "15": {
      "class_type": "SaveImage",
      "inputs": {
        "filename_prefix": filenamePrefix,
        "images": ["14", 0]
      }
    }
  };
}

/**
 * Build simplified workflow without FaceDetailer (fallback if nodes not available)
 */
function buildSimplifiedOptimizedWorkflow(options = {}) {
  const {
    positive = 'beautiful woman portrait',
    negative = 'worst quality, low quality, blurry',
    seed = Math.floor(Math.random() * 1000000000),
    width = 832,
    height = 1216,
    steps = 40,
    cfg = 4.0,
    faceIdWeight = 0.75,
    faceRefImage = ELENA_FACE_REF,
    filenamePrefix = 'Elena_FaceID_Optimized',
  } = options;

  return {
    // Node 1: Load Checkpoint
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": {
        "ckpt_name": "bigLove_xl1.safetensors"
      }
    },
    // Node 2: Load IP-Adapter FaceID v2
    "2": {
      "class_type": "IPAdapterModelLoader",
      "inputs": {
        "ipadapter_file": "ip-adapter-faceid-plusv2_sdxl.bin"
      }
    },
    // Node 3: Load CLIP Vision
    "3": {
      "class_type": "CLIPVisionLoader",
      "inputs": {
        "clip_name": "CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors"
      }
    },
    // Node 4: Load InsightFace
    "4": {
      "class_type": "IPAdapterInsightFaceLoader",
      "inputs": {
        "provider": "CUDA",
        "model_name": "buffalo_l"
      }
    },
    // Node 5: Load face reference
    "5": {
      "class_type": "LoadImage",
      "inputs": {
        "image": faceRefImage
      }
    },
    // Node 6: Positive prompt
    "6": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": positive,
        "clip": ["1", 1]
      }
    },
    // Node 7: Negative prompt
    "7": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": negative,
        "clip": ["1", 1]
      }
    },
    // Node 8: Empty latent
    "8": {
      "class_type": "EmptyLatentImage",
      "inputs": {
        "width": width,
        "height": height,
        "batch_size": 1
      }
    },
    // Node 9: IP-Adapter FaceID Apply
    "9": {
      "class_type": "IPAdapterFaceID",
      "inputs": {
        "model": ["1", 0],
        "ipadapter": ["2", 0],
        "image": ["5", 0],
        "clip_vision": ["3", 0],
        "insightface": ["4", 0],
        "weight": faceIdWeight,
        "weight_faceidv2": faceIdWeight,
        "weight_type": "linear",
        "combine_embeds": "concat",
        "start_at": 0.0,
        "end_at": 1.0,
        "embeds_scaling": "V only"
      }
    },
    // Node 10: KSampler
    "10": {
      "class_type": "KSampler",
      "inputs": {
        "seed": seed,
        "steps": steps,
        "cfg": cfg,
        "sampler_name": "dpmpp_2m_sde",
        "scheduler": "karras",
        "denoise": 1.0,
        "model": ["9", 0],
        "positive": ["6", 0],
        "negative": ["7", 0],
        "latent_image": ["8", 0]
      }
    },
    // Node 11: VAE Decode
    "11": {
      "class_type": "VAEDecode",
      "inputs": {
        "samples": ["10", 0],
        "vae": ["1", 2]
      }
    },
    // Node 12: Save Image
    "12": {
      "class_type": "SaveImage",
      "inputs": {
        "filename_prefix": filenamePrefix,
        "images": ["11", 0]
      }
    }
  };
}

/**
 * Check if FaceDetailer nodes are available
 */
async function checkFaceDetailerAvailable() {
  try {
    const res = await fetch(`${COMFYUI_URL}/object_info`);
    if (!res.ok) return false;
    const data = await res.json();
    // Check for all required FaceDetailer dependencies
    const hasFaceDetailer = 'FaceDetailer' in data;
    const hasDetector = 'UltralyticsDetectorProvider' in data;
    const hasSAM = 'SAMLoader' in data;
    return hasFaceDetailer && hasDetector && hasSAM;
  } catch {
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('============================================================');
  console.log('  ELENA FACEID OPTIMIZED - PHASE 1');
  console.log('  FaceID Weight: 0.75 | Steps: 40 | FaceDetailer');
  console.log('============================================================\n');

  console.log(`ComfyUI URL: ${COMFYUI_URL}\n`);

  // Check connection
  const status = await checkConnection();
  if (!status.connected) {
    console.error('ComfyUI not accessible:', status.error);
    console.log('\nMake sure:');
    console.log('1. ComfyUI is running on RunPod');
    console.log('2. COMFYUI_URL is set correctly');
    process.exit(1);
  }
  console.log(`Connected to ComfyUI ${status.version}\n`);

  // Check if FaceDetailer is available
  const hasFaceDetailer = await checkFaceDetailerAvailable();
  console.log(`FaceDetailer available: ${hasFaceDetailer ? 'Yes' : 'No (using simplified workflow)'}\n`);

  // Elena prompt
  const positive = `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
24 year old Italian woman named Elena,
soft round pleasant face, warm approachable features,
honey brown warm eyes, bronde hair with dark roots and golden blonde balayage, long voluminous beach waves,
small beauty mark on right cheekbone,
fit athletic toned body, large natural breasts, defined slim waist,
wearing elegant black lace lingerie,
sitting on luxury velvet sofa in Parisian apartment,
soft morning light from window, intimate boudoir atmosphere,
natural skin texture, glowing sun-kissed skin,
gold layered necklaces with medallion pendant,
shot on Canon EOS R5, shallow depth of field, professional photography`;

  const negative = `deformed face, distorted face, ugly, disfigured,
bad anatomy, bad hands, extra fingers, mutated,
worst quality, low quality, blurry, cartoon, anime, illustration,
watermark, text, logo, censored, mosaic,
male, man, multiple people`;

  console.log('Building optimized workflow...');
  console.log('  OPTIMIZATIONS:');
  console.log('  - FaceID Weight: 0.75 (was 0.85)');
  console.log('  - Steps: 40 (was 25)');
  if (hasFaceDetailer) {
    console.log('  - FaceDetailer: denoise=0.4, steps=40, guide=512');
  }
  console.log('  - CFG: 4.0');
  console.log('  - Resolution: 832x1216\n');

  const workflowOptions = {
    positive,
    negative,
    faceIdWeight: 0.75,
    steps: 40,
    cfg: 4.0,
    faceDetailerDenoise: 0.4,
    faceDetailerSteps: 40,
    faceDetailerGuideSize: 512,
    filenamePrefix: 'Elena_FaceID_Optimized',
  };

  const workflow = hasFaceDetailer
    ? buildOptimizedFaceIDWorkflow(workflowOptions)
    : buildSimplifiedOptimizedWorkflow(workflowOptions);

  console.log('Queueing generation...');
  const { prompt_id } = await queuePrompt(workflow);
  console.log(`Prompt ID: ${prompt_id}\n`);

  const startTime = Date.now();

  try {
    const result = await waitForCompletion(prompt_id);
    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log(`\n\nGeneration complete! (${duration}s)`);

    // Get output image
    const outputs = result.outputs;
    const saveNode = Object.values(outputs).find(o => o.images);

    if (saveNode && saveNode.images.length) {
      const image = saveNode.images[0];
      console.log(`\nOutput: ${image.filename}`);

      // Download and save locally
      const buffer = await downloadImage(image.filename, image.subfolder || '');
      const localPath = path.join(OUTPUT_DIR, `elena-faceid-optimized-${Date.now()}.png`);
      fs.writeFileSync(localPath, buffer);
      console.log(`Saved to: ${localPath}`);
    }
  } catch (error) {
    console.error(`\n\nGeneration failed: ${error.message}`);

    // If FaceDetailer workflow failed, try simplified version
    if (hasFaceDetailer) {
      console.log('\nRetrying with simplified workflow (without FaceDetailer)...\n');
      const simpleWorkflow = buildSimplifiedOptimizedWorkflow(workflowOptions);

      const { prompt_id: retryId } = await queuePrompt(simpleWorkflow);
      console.log(`Retry Prompt ID: ${retryId}\n`);

      try {
        const retryResult = await waitForCompletion(retryId);
        const retryDuration = Math.round((Date.now() - startTime) / 1000);

        console.log(`\n\nRetry complete! (${retryDuration}s)`);

        const outputs = retryResult.outputs;
        const saveNode = Object.values(outputs).find(o => o.images);

        if (saveNode && saveNode.images.length) {
          const image = saveNode.images[0];
          const buffer = await downloadImage(image.filename, image.subfolder || '');
          const localPath = path.join(OUTPUT_DIR, `elena-faceid-optimized-${Date.now()}.png`);
          fs.writeFileSync(localPath, buffer);
          console.log(`Saved to: ${localPath}`);
        }
      } catch (retryError) {
        console.error(`\nRetry also failed: ${retryError.message}`);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }

  console.log('\n============================================================');
  console.log('  PHASE 1 OPTIMIZATION TEST COMPLETE');
  console.log('============================================================');
  console.log('\nCompare with baseline results:');
  console.log('  - If face accuracy ~90%: Phase 1 SUCCESS');
  console.log('  - If still ~85%: Proceed to Phase 2 (InstantID)');
  console.log('\nNext step if needed:');
  console.log('  node app/scripts/elena-instantid-test.mjs');
}

main().catch(console.error);
