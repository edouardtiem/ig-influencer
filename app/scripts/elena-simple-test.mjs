#!/usr/bin/env node
/**
 * Elena Simple Test - Baseline FaceID Test
 *
 * Uses IP-Adapter FaceID v2 for face preservation.
 * This is the baseline script for testing face identity accuracy.
 *
 * Current settings:
 * - FaceID weight: 0.85
 * - Steps: 25
 *
 * Usage:
 *   COMFYUI_URL=https://xxx.proxy.runpod.net node app/scripts/elena-simple-test.mjs
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
async function waitForCompletion(promptId, maxWaitMs = 600000) {
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
 * Build FaceID workflow
 *
 * Settings:
 * - IP-Adapter FaceID v2 weight: 0.85 (baseline)
 * - Steps: 25 (baseline)
 * - CFG: 4.0
 */
function buildFaceIDWorkflow(options = {}) {
  const {
    positive = 'beautiful woman portrait',
    negative = 'worst quality, low quality, blurry',
    seed = Math.floor(Math.random() * 1000000000),
    width = 832,
    height = 1216,
    steps = 25,
    cfg = 4.0,
    faceIdWeight = 0.85,
    faceRefImage = ELENA_FACE_REF,
    filenamePrefix = 'Elena_FaceID_Test',
  } = options;

  return {
    // Node 1: Load Checkpoint (BigLove XL or similar)
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
    // Node 3: Load CLIP Vision for FaceID
    "3": {
      "class_type": "CLIPVisionLoader",
      "inputs": {
        "clip_name": "CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors"
      }
    },
    // Node 4: Load InsightFace model for face embedding
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
 * Main function
 */
async function main() {
  console.log('============================================================');
  console.log('  ELENA FACEID BASELINE TEST');
  console.log('  FaceID Weight: 0.85 | Steps: 25');
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

  console.log('Building FaceID workflow...');
  console.log('  - FaceID Weight: 0.85');
  console.log('  - Steps: 25');
  console.log('  - CFG: 4.0');
  console.log('  - Resolution: 832x1216\n');

  const workflow = buildFaceIDWorkflow({
    positive,
    negative,
    faceIdWeight: 0.85,
    steps: 25,
    cfg: 4.0,
    filenamePrefix: 'Elena_FaceID_Baseline',
  });

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
      const localPath = path.join(OUTPUT_DIR, `elena-faceid-baseline-${Date.now()}.png`);
      fs.writeFileSync(localPath, buffer);
      console.log(`Saved to: ${localPath}`);
    }
  } catch (error) {
    console.error(`\n\nGeneration failed: ${error.message}`);
    process.exit(1);
  }

  console.log('\n============================================================');
  console.log('  BASELINE TEST COMPLETE');
  console.log('  Next: Run elena-faceid-optimized.mjs for Phase 1 test');
  console.log('============================================================');
}

main().catch(console.error);
