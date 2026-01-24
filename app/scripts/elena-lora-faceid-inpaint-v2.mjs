/**
 * Elena LoRA + FaceID Inpainting V2
 * 
 * Simplified two-pass approach:
 * Pass 1: Generate with LoRA only
 * Pass 2: Load image, inpaint face area with FaceID
 * 
 * Usage:
 *   node app/scripts/elena-lora-faceid-inpaint-v2.mjs
 */

import { queuePrompt, getHistory, checkConnection } from './comfyui-api.mjs';
import path from 'path';
import fs from 'fs';

const OUTPUT_DIR = path.join(process.env.HOME, 'ComfyUI/output');
const INPUT_DIR = path.join(process.env.HOME, 'ComfyUI/input');

// Pass 1: Generate with LoRA only
function buildLoraOnlyWorkflow(options = {}) {
  const {
    positive,
    negative,
    width = 832,
    height = 1216,
    steps = 30,
    cfg = 3.5,
    seed,
    checkpoint = 'bigLust_v16.safetensors',
    loraName = 'elena_v4_cloud.safetensors',
    loraStrength = 1.0,
    filenamePrefix,
  } = options;

  return {
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": { "ckpt_name": checkpoint }
    },
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
      "inputs": { "width": width, "height": height, "batch_size": 1 }
    },
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

// Pass 2: Inpaint face with FaceID
function buildFaceIdInpaintWorkflow(options = {}) {
  const {
    inputImage,
    width = 832,
    height = 1216,
    steps = 25,
    cfg = 4.0,
    seed,
    checkpoint = 'bigLust_v16.safetensors',
    faceIdModel = 'faceid.plusv2.sdxl.bin',
    clipVision = 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors',
    faceRefImage = 'elena_face_reference.jpg',
    faceIdWeight = 0.85,
    inpaintDenoise = 0.6,
    filenamePrefix,
  } = options;

  // Height of face mask area (top 40%)
  const maskHeight = Math.round(height * 0.4);

  return {
    // Load checkpoint
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": { "ckpt_name": checkpoint }
    },
    
    // Load generated image
    "2": {
      "class_type": "LoadImage",
      "inputs": { "image": inputImage }
    },
    
    // Create face mask (top portion)
    "3": {
      "class_type": "SolidMask",
      "inputs": { "value": 1.0, "width": width, "height": maskHeight }
    },
    
    // Create body mask (bottom portion - black/no mask)
    "4": {
      "class_type": "SolidMask",
      "inputs": { "value": 0.0, "width": width, "height": height - maskHeight }
    },
    
    // Combine masks vertically
    "5": {
      "class_type": "MaskComposite",
      "inputs": {
        "destination": ["3", 0],
        "source": ["4", 0],
        "x": 0,
        "y": maskHeight,
        "operation": "add"
      }
    },
    
    // Feather mask for smooth transition
    "6": {
      "class_type": "FeatherMask",
      "inputs": {
        "mask": ["5", 0],
        "left": 10,
        "top": 10,
        "right": 10,
        "bottom": 80
      }
    },
    
    // Encode image to latent
    "7": {
      "class_type": "VAEEncode",
      "inputs": { "pixels": ["2", 0], "vae": ["1", 2] }
    },
    
    // Apply mask to latent
    "8": {
      "class_type": "SetLatentNoiseMask",
      "inputs": { "samples": ["7", 0], "mask": ["6", 0] }
    },
    
    // Load FaceID model
    "9": {
      "class_type": "IPAdapterModelLoader",
      "inputs": { "ipadapter_file": faceIdModel }
    },
    
    // Load InsightFace
    "10": {
      "class_type": "IPAdapterInsightFaceLoader",
      "inputs": { "provider": "CPU", "model_name": "antelopev2" }
    },
    
    // Load face reference
    "11": {
      "class_type": "LoadImage",
      "inputs": { "image": faceRefImage }
    },
    
    // Load CLIP Vision
    "12": {
      "class_type": "CLIPVisionLoader",
      "inputs": { "clip_name": clipVision }
    },
    
    // Apply FaceID
    "13": {
      "class_type": "IPAdapterFaceID",
      "inputs": {
        "model": ["1", 0],
        "ipadapter": ["9", 0],
        "image": ["11", 0],
        "insightface": ["10", 0],
        "clip_vision": ["12", 0],
        "weight": faceIdWeight,
        "weight_faceidv2": faceIdWeight,
        "weight_type": "linear",
        "combine_embeds": "concat",
        "start_at": 0.0,
        "end_at": 1.0,
        "embeds_scaling": "V only"
      }
    },
    
    // Face prompt
    "14": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": `elena, 24 year old Italian woman, honey brown warm eyes,
bronde hair with dark roots and golden blonde balayage,
small beauty mark on right cheekbone, soft round face,
photorealistic, detailed face, beautiful face, natural skin`,
        "clip": ["1", 1]
      }
    },
    
    // Negative
    "15": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": "worst quality, low quality, blurry, bad face, deformed, ugly",
        "clip": ["1", 1]
      }
    },
    
    // KSampler for inpainting
    "16": {
      "class_type": "KSampler",
      "inputs": {
        "seed": seed,
        "steps": steps,
        "cfg": cfg,
        "sampler_name": "dpmpp_2m_sde",
        "scheduler": "karras",
        "denoise": inpaintDenoise,
        "model": ["13", 0],
        "positive": ["14", 0],
        "negative": ["15", 0],
        "latent_image": ["8", 0]
      }
    },
    
    // Decode
    "17": {
      "class_type": "VAEDecode",
      "inputs": { "samples": ["16", 0], "vae": ["1", 2] }
    },
    
    // Save
    "18": {
      "class_type": "SaveImage",
      "inputs": { "filename_prefix": filenamePrefix, "images": ["17", 0] }
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
        throw new Error(`Generation failed: ${JSON.stringify(history[promptId]?.status)}`);
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

function getOutputFilename(result) {
  for (const output of Object.values(result.outputs)) {
    if (output.images?.length) {
      return output.images[0].filename;
    }
  }
  return null;
}

async function main() {
  const inpaintDenoise = parseFloat(process.argv[2]) || 0.6;
  const faceIdWeight = parseFloat(process.argv[3]) || 0.85;
  const seed = Math.floor(Math.random() * 1000000000);
  
  console.log('============================================================');
  console.log('ELENA LoRA + FaceID INPAINTING (V2)');
  console.log('============================================================');
  console.log(`LoRA Strength: 1.0`);
  console.log(`FaceID Weight: ${faceIdWeight}`);
  console.log(`Inpaint Denoise: ${inpaintDenoise}`);
  console.log(`Seed: ${seed}`);
  console.log('============================================================\n');
  
  const status = await checkConnection();
  if (!status.connected) {
    console.error('❌ ComfyUI not running');
    process.exit(1);
  }
  console.log(`✅ Connected to ComfyUI ${status.version}\n`);
  
  // ============ PASS 1: Generate with LoRA ============
  console.log('📷 PASS 1: Generating body with LoRA...\n');
  
  const pass1Workflow = buildLoraOnlyWorkflow({
    positive: `elena, 24 year old Italian woman,
honey brown warm eyes, bronde hair with dark roots and golden blonde balayage, long beach waves,
small beauty mark on right cheekbone,
fit athletic toned body, full natural breasts, defined slim waist,
wearing white bikini, standing by infinity pool,
tropical villa, palm trees, blue sky,
masterpiece, best quality, photorealistic, 8k uhd,
natural skin texture, sun-kissed skin,
gold layered necklaces,
shot on Canon EOS R5, natural sunlight`,
    negative: `worst quality, low quality, blurry, cartoon, anime,
bad anatomy, bad hands, extra fingers, deformed,
watermark, text, logo, male, man`,
    seed: seed,
    filenamePrefix: `Elena_Pass1_LoRA`,
  });
  
  const { prompt_id: pass1Id } = await queuePrompt(pass1Workflow);
  console.log(`Pass 1 Prompt ID: ${pass1Id}`);
  
  const pass1Result = await waitForCompletion(pass1Id);
  const pass1Filename = getOutputFilename(pass1Result);
  
  if (!pass1Filename) {
    console.error('\n❌ Pass 1 failed - no output image');
    process.exit(1);
  }
  
  console.log(`\n✅ Pass 1 complete: ${pass1Filename}\n`);
  
  // Copy output to input folder for Pass 2
  const outputPath = path.join(OUTPUT_DIR, pass1Filename);
  const inputPath = path.join(INPUT_DIR, pass1Filename);
  fs.copyFileSync(outputPath, inputPath);
  console.log(`📁 Copied to input folder: ${pass1Filename}\n`);
  
  // ============ PASS 2: Inpaint face with FaceID ============
  console.log('🎭 PASS 2: Inpainting face with FaceID...\n');
  
  const pass2Workflow = buildFaceIdInpaintWorkflow({
    inputImage: pass1Filename,
    seed: seed + 1,
    faceIdWeight: faceIdWeight,
    inpaintDenoise: inpaintDenoise,
    filenamePrefix: `Elena_Pass2_FaceID_d${inpaintDenoise}`,
  });
  
  const { prompt_id: pass2Id } = await queuePrompt(pass2Workflow);
  console.log(`Pass 2 Prompt ID: ${pass2Id}`);
  
  const pass2Result = await waitForCompletion(pass2Id);
  const pass2Filename = getOutputFilename(pass2Result);
  
  if (!pass2Filename) {
    console.error('\n❌ Pass 2 failed - no output image');
    process.exit(1);
  }
  
  const pass1Path = path.join(OUTPUT_DIR, pass1Filename);
  const pass2Path = path.join(OUTPUT_DIR, pass2Filename);
  
  console.log('\n\n✅ Generation complete!\n');
  console.log('📸 Results:');
  console.log(`   Pass 1 (LoRA body):    ${pass1Path}`);
  console.log(`   Pass 2 (FaceID face):  ${pass2Path}`);
  
  // Open both images
  const { exec } = await import('child_process');
  exec(`open "${pass1Path}" "${pass2Path}"`);
  
  console.log('\n============================================================');
  console.log('Compare the two images side by side!');
  console.log('============================================================');
}

main().catch(console.error);
