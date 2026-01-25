#!/usr/bin/env node
/**
 * Elena InstantID Test - Phase 2 (95%+ Face Accuracy)
 *
 * Uses InstantID for highest face identity preservation.
 * InstantID combines IP-Adapter + ControlNet for superior results.
 *
 * Requirements:
 * - ComfyUI_InstantID custom node installed
 * - InstantID models downloaded:
 *   - instantid/ip-adapter.bin
 *   - controlnet/diffusion_pytorch_model.safetensors
 *
 * Settings:
 * - InstantID weight: 0.8
 * - ControlNet strength: 1.0
 * - Steps: 50
 * - CFG: 4.0
 *
 * Install instructions (run on RunPod):
 *   cd /workspace/comfyui/custom_nodes
 *   git clone https://github.com/cubiq/ComfyUI_InstantID
 *   pip install -r ComfyUI_InstantID/requirements.txt
 *
 *   cd /workspace/comfyui/models
 *   mkdir -p instantid controlnet
 *   wget -O instantid/ip-adapter.bin "https://huggingface.co/InstantX/InstantID/resolve/main/ip-adapter.bin"
 *   wget -O controlnet/diffusion_pytorch_model.safetensors "https://huggingface.co/InstantX/InstantID/resolve/main/ControlNetModel/diffusion_pytorch_model.safetensors"
 *
 * Usage:
 *   COMFYUI_URL=https://xxx.proxy.runpod.net node app/scripts/elena-instantid-test.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ComfyUI URL - can be local or RunPod proxy
const COMFYUI_URL = process.env.COMFYUI_URL || 'http://127.0.0.1:8188';
const OUTPUT_DIR = path.join(__dirname, '../generated/elena-instantid-test');

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
 * Check if InstantID nodes are available
 */
async function checkInstantIDAvailable() {
  try {
    const res = await fetch(`${COMFYUI_URL}/object_info`);
    if (!res.ok) return { available: false, error: 'Failed to fetch node info' };
    const data = await res.json();

    const hasInstantIDApply = 'ApplyInstantID' in data || 'InstantIDModelLoader' in data;
    const hasInstantIDFaceAnalysis = 'InstantIDFaceAnalysis' in data;

    return {
      available: hasInstantIDApply,
      hasFaceAnalysis: hasInstantIDFaceAnalysis,
      nodes: Object.keys(data).filter(k => k.toLowerCase().includes('instant')),
    };
  } catch (error) {
    return { available: false, error: error.message };
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
 * Build InstantID workflow for 95%+ face accuracy
 *
 * InstantID combines:
 * - Face embedding (InsightFace)
 * - IP-Adapter for identity
 * - ControlNet for face structure/keypoints
 */
function buildInstantIDWorkflow(options = {}) {
  const {
    positive = 'beautiful woman portrait',
    negative = 'worst quality, low quality, blurry',
    seed = Math.floor(Math.random() * 1000000000),
    width = 832,
    height = 1216,
    steps = 50,
    cfg = 4.0,
    instantIdWeight = 0.8,
    controlNetStrength = 1.0,
    faceRefImage = ELENA_FACE_REF,
    filenamePrefix = 'Elena_InstantID',
  } = options;

  return {
    // ========== MODEL LOADING ==========

    // Node 1: Load Checkpoint (SDXL-based)
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": {
        "ckpt_name": "bigLove_xl1.safetensors"
      }
    },
    // Node 2: Load InstantID Model
    "2": {
      "class_type": "InstantIDModelLoader",
      "inputs": {
        "instantid_file": "ip-adapter.bin"
      }
    },
    // Node 3: Load InstantID ControlNet
    "3": {
      "class_type": "ControlNetLoader",
      "inputs": {
        "control_net_name": "diffusion_pytorch_model.safetensors"
      }
    },
    // Node 4: Load InsightFace for face analysis
    "4": {
      "class_type": "InstantIDFaceAnalysis",
      "inputs": {
        "provider": "CUDA"
      }
    },
    // Node 5: Load face reference image
    "5": {
      "class_type": "LoadImage",
      "inputs": {
        "image": faceRefImage
      }
    },

    // ========== TEXT ENCODING ==========

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

    // ========== LATENT ==========

    // Node 8: Empty latent image
    "8": {
      "class_type": "EmptyLatentImage",
      "inputs": {
        "width": width,
        "height": height,
        "batch_size": 1
      }
    },

    // ========== INSTANTID APPLICATION ==========

    // Node 9: Apply InstantID
    "9": {
      "class_type": "ApplyInstantID",
      "inputs": {
        "instantid": ["2", 0],
        "insightface": ["4", 0],
        "control_net": ["3", 0],
        "image": ["5", 0],
        "model": ["1", 0],
        "positive": ["6", 0],
        "negative": ["7", 0],
        "weight": instantIdWeight,
        "start_at": 0.0,
        "end_at": 1.0
      }
    },

    // ========== GENERATION ==========

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
        "positive": ["9", 1],
        "negative": ["9", 2],
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
 * Build alternative InstantID workflow (cubiq node variant)
 */
function buildInstantIDWorkflowAlt(options = {}) {
  const {
    positive = 'beautiful woman portrait',
    negative = 'worst quality, low quality, blurry',
    seed = Math.floor(Math.random() * 1000000000),
    width = 832,
    height = 1216,
    steps = 50,
    cfg = 4.0,
    instantIdWeight = 0.8,
    controlNetStrength = 1.0,
    faceRefImage = ELENA_FACE_REF,
    filenamePrefix = 'Elena_InstantID',
  } = options;

  return {
    // Node 1: Load Checkpoint
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": {
        "ckpt_name": "bigLove_xl1.safetensors"
      }
    },
    // Node 2: Load InstantID pipeline (cubiq variant)
    "2": {
      "class_type": "InstantIDModelLoader",
      "inputs": {
        "instantid_file": "ip-adapter.bin"
      }
    },
    // Node 3: Load ControlNet for InstantID
    "3": {
      "class_type": "ControlNetLoader",
      "inputs": {
        "control_net_name": "diffusion_pytorch_model.safetensors"
      }
    },
    // Node 4: InsightFace loader
    "4": {
      "class_type": "InsightFaceLoader",
      "inputs": {
        "provider": "CUDA"
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
    // Node 9: Apply InstantID Advanced
    "9": {
      "class_type": "ApplyInstantIDAdvanced",
      "inputs": {
        "instantid": ["2", 0],
        "insightface": ["4", 0],
        "control_net": ["3", 0],
        "image": ["5", 0],
        "model": ["1", 0],
        "positive": ["6", 0],
        "negative": ["7", 0],
        "ip_weight": instantIdWeight,
        "cn_strength": controlNetStrength,
        "start_at": 0.0,
        "end_at": 1.0,
        "noise": 0.0
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
        "positive": ["9", 1],
        "negative": ["9", 2],
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
 * Print InstantID installation instructions
 */
function printInstallInstructions() {
  console.log(`
============================================================
  INSTANTID NOT FOUND - Installation Required
============================================================

SSH to your RunPod instance and run:

  # SSH command
  ssh -i ~/.runpod/ssh/RunPod-Key-Go root@<POD_IP> -p <PORT>

  # Install InstantID custom node
  cd /workspace/comfyui/custom_nodes
  git clone https://github.com/cubiq/ComfyUI_InstantID
  pip install -r ComfyUI_InstantID/requirements.txt

  # Download InstantID models (~4GB total)
  cd /workspace/comfyui/models
  mkdir -p instantid controlnet

  # IP-Adapter model
  wget -O instantid/ip-adapter.bin \\
    "https://huggingface.co/InstantX/InstantID/resolve/main/ip-adapter.bin"

  # ControlNet model
  wget -O controlnet/diffusion_pytorch_model.safetensors \\
    "https://huggingface.co/InstantX/InstantID/resolve/main/ControlNetModel/diffusion_pytorch_model.safetensors"

  # Restart ComfyUI
  # Then re-run this script

============================================================
`);
}

/**
 * Main function
 */
async function main() {
  console.log('============================================================');
  console.log('  ELENA INSTANTID TEST - PHASE 2 (95%+ Accuracy)');
  console.log('  InstantID Weight: 0.8 | ControlNet: 1.0 | Steps: 50');
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

  // Check if InstantID is available
  const instantIdStatus = await checkInstantIDAvailable();

  if (!instantIdStatus.available) {
    console.error('InstantID nodes not found in ComfyUI!\n');
    if (instantIdStatus.nodes?.length > 0) {
      console.log('Found related nodes:', instantIdStatus.nodes);
    }
    printInstallInstructions();
    process.exit(1);
  }

  console.log('InstantID nodes available');
  if (instantIdStatus.nodes?.length > 0) {
    console.log(`  Found nodes: ${instantIdStatus.nodes.join(', ')}\n`);
  }

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

  console.log('Building InstantID workflow...');
  console.log('  SETTINGS:');
  console.log('  - InstantID Weight: 0.8');
  console.log('  - ControlNet Strength: 1.0');
  console.log('  - Steps: 50');
  console.log('  - CFG: 4.0');
  console.log('  - Resolution: 832x1216\n');

  const workflowOptions = {
    positive,
    negative,
    instantIdWeight: 0.8,
    controlNetStrength: 1.0,
    steps: 50,
    cfg: 4.0,
    filenamePrefix: 'Elena_InstantID',
  };

  // Try primary workflow first
  let workflow = buildInstantIDWorkflow(workflowOptions);

  console.log('Queueing generation...');

  try {
    const { prompt_id } = await queuePrompt(workflow);
    console.log(`Prompt ID: ${prompt_id}\n`);

    const startTime = Date.now();
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
      const localPath = path.join(OUTPUT_DIR, `elena-instantid-${Date.now()}.png`);
      fs.writeFileSync(localPath, buffer);
      console.log(`Saved to: ${localPath}`);
    }

    console.log('\n============================================================');
    console.log('  PHASE 2 INSTANTID TEST COMPLETE');
    console.log('============================================================');
    console.log('\nExpected result: 95%+ face identity accuracy');
    console.log('Compare with Phase 1 results and original Elena reference.');

  } catch (error) {
    // Try alternative workflow
    console.error(`\nPrimary workflow failed: ${error.message}`);
    console.log('\nTrying alternative InstantID workflow...\n');

    workflow = buildInstantIDWorkflowAlt(workflowOptions);

    try {
      const { prompt_id } = await queuePrompt(workflow);
      console.log(`Retry Prompt ID: ${prompt_id}\n`);

      const startTime = Date.now();
      const result = await waitForCompletion(prompt_id);
      const duration = Math.round((Date.now() - startTime) / 1000);

      console.log(`\n\nGeneration complete! (${duration}s)`);

      const outputs = result.outputs;
      const saveNode = Object.values(outputs).find(o => o.images);

      if (saveNode && saveNode.images.length) {
        const image = saveNode.images[0];
        console.log(`\nOutput: ${image.filename}`);

        const buffer = await downloadImage(image.filename, image.subfolder || '');
        const localPath = path.join(OUTPUT_DIR, `elena-instantid-${Date.now()}.png`);
        fs.writeFileSync(localPath, buffer);
        console.log(`Saved to: ${localPath}`);
      }

      console.log('\n============================================================');
      console.log('  PHASE 2 INSTANTID TEST COMPLETE');
      console.log('============================================================');

    } catch (retryError) {
      console.error(`\nAlternative workflow also failed: ${retryError.message}`);
      console.log('\nPossible issues:');
      console.log('1. InstantID models not downloaded correctly');
      console.log('2. Face reference image not in ComfyUI input folder');
      console.log('3. Node configuration mismatch');
      printInstallInstructions();
      process.exit(1);
    }
  }
}

main().catch(console.error);
