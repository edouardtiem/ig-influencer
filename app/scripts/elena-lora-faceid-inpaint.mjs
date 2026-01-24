/**
 * Elena LoRA + FaceID Inpainting
 * 
 * Two-stage generation:
 * 1. Generate body with LoRA (no FaceID)
 * 2. Inpaint face area with FaceID
 * 
 * Usage:
 *   node app/scripts/elena-lora-faceid-inpaint.mjs
 */

import { queuePrompt, getHistory, checkConnection } from './comfyui-api.mjs';
import path from 'path';

const OUTPUT_DIR = path.join(process.env.HOME, 'ComfyUI/output');

/**
 * Build workflow: LoRA generation + Face inpainting with FaceID
 * 
 * Flow:
 * 1. Load checkpoint + LoRA
 * 2. Generate base image
 * 3. Create face mask (top portion of image)
 * 4. Load FaceID model
 * 5. Inpaint face region with FaceID
 */
function buildLoraFaceIdInpaintWorkflow(options = {}) {
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
    faceIdModel = 'ip-adapter-faceid-plusv2_sdxl.bin',
    clipVision = 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors',
    faceRefImage = 'elena_face_reference.jpg',
    faceIdWeight = 0.85,
    inpaintDenoise = 0.65,  // Lower = keep more of original, Higher = more FaceID
    filenamePrefix = 'Elena_LoRA_FaceID_Inpaint',
  } = options;

  return {
    // ============ STAGE 1: Generate with LoRA ============
    
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
    
    // 3. Positive prompt (LoRA clip)
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
    
    // 6. First KSampler (LoRA only)
    "6": {
      "class_type": "KSampler",
      "inputs": {
        "seed": seed,
        "steps": steps,
        "cfg": cfg,
        "sampler_name": "dpmpp_2m_sde",
        "scheduler": "karras",
        "denoise": 1.0,
        "model": ["2", 0],  // LoRA model
        "positive": ["3", 0],
        "negative": ["4", 0],
        "latent_image": ["5", 0]
      }
    },
    
    // 7. VAE Decode (for intermediate image and mask creation)
    "7": {
      "class_type": "VAEDecode",
      "inputs": { "samples": ["6", 0], "vae": ["1", 2] }
    },
    
    // ============ STAGE 2: Face Inpainting with FaceID ============
    
    // 8. Create solid mask (white rectangle for face area - top 40% of image)
    "8": {
      "class_type": "SolidMask",
      "inputs": {
        "value": 1.0,
        "width": width,
        "height": Math.round(height * 0.45)  // Top 45% for face
      }
    },
    
    // 9. Create black mask for bottom
    "9": {
      "class_type": "SolidMask", 
      "inputs": {
        "value": 0.0,
        "width": width,
        "height": Math.round(height * 0.55)  // Bottom 55%
      }
    },
    
    // 10. Combine masks (face area = white, body = black)
    "10": {
      "class_type": "MaskComposite",
      "inputs": {
        "destination": ["8", 0],
        "source": ["9", 0],
        "x": 0,
        "y": Math.round(height * 0.45),
        "operation": "add"
      }
    },
    
    // 11. Feather the mask for smooth transition
    "11": {
      "class_type": "FeatherMask",
      "inputs": {
        "mask": ["10", 0],
        "left": 20,
        "top": 20,
        "right": 20,
        "bottom": 60  // More feathering at bottom for smooth blend
      }
    },
    
    // 12. VAE Encode the generated image for inpainting
    "12": {
      "class_type": "VAEEncode",
      "inputs": {
        "pixels": ["7", 0],
        "vae": ["1", 2]
      }
    },
    
    // 13. Set latent noise mask
    "13": {
      "class_type": "SetLatentNoiseMask",
      "inputs": {
        "samples": ["12", 0],
        "mask": ["11", 0]
      }
    },
    
    // 14. Load IPAdapter FaceID model
    "14": {
      "class_type": "IPAdapterModelLoader",
      "inputs": { "ipadapter_file": faceIdModel }
    },
    
    // 15. Load InsightFace
    "15": {
      "class_type": "IPAdapterInsightFaceLoader",
      "inputs": { "provider": "CPU", "model_name": "antelopev2" }
    },
    
    // 16. Load face reference image
    "16": {
      "class_type": "LoadImage",
      "inputs": { "image": faceRefImage }
    },
    
    // 17. Load CLIP Vision
    "17": {
      "class_type": "CLIPVisionLoader",
      "inputs": { "clip_name": clipVision }
    },
    
    // 18. Apply FaceID to base model (not LoRA model - we want fresh face)
    "18": {
      "class_type": "IPAdapterFaceID",
      "inputs": {
        "model": ["1", 0],  // Base model, not LoRA!
        "ipadapter": ["14", 0],
        "image": ["16", 0],
        "insightface": ["15", 0],
        "clip_vision": ["17", 0],
        "weight": faceIdWeight,
        "weight_faceidv2": faceIdWeight,
        "weight_type": "linear",
        "combine_embeds": "concat",
        "start_at": 0.0,
        "end_at": 1.0,
        "embeds_scaling": "V only"
      }
    },
    
    // 19. Face-focused positive prompt
    "19": {
      "class_type": "CLIPTextEncode",
      "inputs": { 
        "text": `elena, 24 year old Italian woman,
honey brown warm eyes, bronde hair with dark roots and golden blonde balayage,
small beauty mark on right cheekbone,
soft round face, gentle smile, natural makeup,
photorealistic, 8k, detailed face, beautiful face`,
        "clip": ["1", 1]  // Base clip
      }
    },
    
    // 20. Negative for face
    "20": {
      "class_type": "CLIPTextEncode",
      "inputs": { 
        "text": `worst quality, low quality, blurry,
bad face, deformed face, ugly face, distorted face,
watermark, text`,
        "clip": ["1", 1]
      }
    },
    
    // 21. Second KSampler (Inpaint face with FaceID)
    "21": {
      "class_type": "KSampler",
      "inputs": {
        "seed": seed + 1,  // Different seed for variation
        "steps": 25,
        "cfg": 4.0,
        "sampler_name": "dpmpp_2m_sde",
        "scheduler": "karras",
        "denoise": inpaintDenoise,
        "model": ["18", 0],  // FaceID model
        "positive": ["19", 0],
        "negative": ["20", 0],
        "latent_image": ["13", 0]  // Masked latent
      }
    },
    
    // 22. Final VAE Decode
    "22": {
      "class_type": "VAEDecode",
      "inputs": { "samples": ["21", 0], "vae": ["1", 2] }
    },
    
    // 23. Save intermediate (LoRA only)
    "23": {
      "class_type": "SaveImage",
      "inputs": { "filename_prefix": filenamePrefix + "_1_lora", "images": ["7", 0] }
    },
    
    // 24. Save final (LoRA + FaceID inpaint)
    "24": {
      "class_type": "SaveImage",
      "inputs": { "filename_prefix": filenamePrefix + "_2_final", "images": ["22", 0] }
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
        const errorInfo = history[promptId]?.status || {};
        throw new Error(`Generation failed: ${JSON.stringify(errorInfo)}`);
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
  const inpaintDenoise = parseFloat(process.argv[2]) || 0.65;
  const faceIdWeight = parseFloat(process.argv[3]) || 0.85;
  
  console.log('============================================================');
  console.log('ELENA LoRA + FaceID INPAINTING');
  console.log('============================================================');
  console.log(`LoRA Strength: 1.0 (body)`);
  console.log(`FaceID Weight: ${faceIdWeight} (face)`);
  console.log(`Inpaint Denoise: ${inpaintDenoise}`);
  console.log('============================================================\n');
  
  const status = await checkConnection();
  if (!status.connected) {
    console.error('❌ ComfyUI not running. Start it: cd ~/ComfyUI && python main.py');
    process.exit(1);
  }
  console.log(`✅ Connected to ComfyUI ${status.version}\n`);
  
  const workflow = buildLoraFaceIdInpaintWorkflow({
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
watermark, text, logo,
male, man`,
    loraStrength: 1.0,
    faceIdWeight: faceIdWeight,
    inpaintDenoise: inpaintDenoise,
    filenamePrefix: `Elena_Inpaint_d${inpaintDenoise}_f${faceIdWeight}`,
  });
  
  console.log('Stage 1: Generating body with LoRA...');
  console.log('Stage 2: Inpainting face with FaceID...\n');
  
  const { prompt_id } = await queuePrompt(workflow);
  console.log(`Prompt ID: ${prompt_id}`);
  
  try {
    const result = await waitForCompletion(prompt_id);
    
    console.log('\n\n✅ Generation complete!\n');
    
    // Find saved images
    const outputs = result.outputs;
    const images = [];
    
    for (const [nodeId, output] of Object.entries(outputs)) {
      if (output.images) {
        for (const img of output.images) {
          const filepath = path.join(OUTPUT_DIR, img.subfolder || '', img.filename);
          images.push({ nodeId, filename: img.filename, filepath });
        }
      }
    }
    
    console.log('📸 Images générées:');
    for (const img of images) {
      const stage = img.filename.includes('_1_lora') ? '(LoRA body)' : '(Final avec FaceID)';
      console.log(`   ${stage}: ${img.filepath}`);
    }
    
    // Open final image
    const finalImage = images.find(i => i.filename.includes('_2_final'));
    if (finalImage) {
      const { exec } = await import('child_process');
      exec(`open "${finalImage.filepath}"`);
    }
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
  
  console.log('\n============================================================');
  console.log('Compare: _1_lora (body) vs _2_final (face inpainted)');
  console.log('============================================================');
}

main().catch(console.error);
