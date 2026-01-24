/**
 * Elena Simple Test - Workflow Simplifié
 * 
 * Setup:
 * - BigLove XL checkpoint
 * - Elena LoRA @ 0.7
 * - IP-Adapter FaceID v2 @ 0.85 (face only, no style)
 * - CFG 4.0 (low for SDXL)
 * - Sampler: dpmpp_2m_sde
 * - 4x-UltraSharp upscale
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COMFYUI_URL = 'http://127.0.0.1:8188';

// Simple workflow - no style IP-Adapter
const workflow = {
  "1": {
    "class_type": "CheckpointLoaderSimple",
    "inputs": {
      "ckpt_name": "bigLove_xl1.safetensors"
    }
  },
  "2": {
    "class_type": "LoraLoader",
    "inputs": {
      "lora_name": "elena_v4_cloud.safetensors",
      "strength_model": 0.7,
      "strength_clip": 0.7,
      "model": ["1", 0],
      "clip": ["1", 1]
    }
  },
  "3": {
    "class_type": "CLIPTextEncode",
    "inputs": {
      "text": "elena, beautiful woman, natural breasts, D cup, completely naked, lying flat on back on bed, head on pillow, legs wide open spread apart, white silk sheet draped over torso and one leg, uncovered vulva visible, hands covering face, both hands hiding face completely, face not visible, shy pose, soft diffused daylight from window, intimate bedroom, detailed skin texture, photorealistic, 8k, high quality",
      "clip": ["2", 1]
    }
  },
  "4": {
    "class_type": "CLIPTextEncode",
    "inputs": {
      "text": "small breasts, flat chest, petite bust, visible face, face visible, looking at camera, eye contact, staring at viewer, sitting, standing, ugly, deformed, bad anatomy, bad hands, missing fingers, extra fingers, blurry, low quality, watermark, text, logo, cartoon, anime, illustration, painting, drawing, cgi, 3d render, doll, plastic, mannequin",
      "clip": ["2", 1]
    }
  },
  "5": {
    "class_type": "EmptyLatentImage",
    "inputs": {
      "width": 1024,
      "height": 1024,
      "batch_size": 1
    }
  },
  // Face reference
  "10": {
    "class_type": "LoadImage",
    "inputs": {
      "image": "elena_face_ref.jpg"
    }
  },
  // CLIP Vision for IP-Adapter
  "11": {
    "class_type": "CLIPVisionLoader",
    "inputs": {
      "clip_name": "CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors"
    }
  },
  // IP-Adapter FaceID model
  "12": {
    "class_type": "IPAdapterModelLoader",
    "inputs": {
      "ipadapter_file": "faceid.plusv2.sdxl.bin"
    }
  },
  // InsightFace loader
  "13": {
    "class_type": "IPAdapterInsightFaceLoader",
    "inputs": {
      "provider": "CPU",
      "model_name": "buffalo_l"
    }
  },
  // IP-Adapter FaceID - SINGLE, no style adapter
  "14": {
    "class_type": "IPAdapterFaceID",
    "inputs": {
      "model": ["2", 0],
      "ipadapter": ["12", 0],
      "image": ["10", 0],
      "clip_vision": ["11", 0],
      "insightface": ["13", 0],
      "weight": 0.85,
      "weight_faceidv2": 0.85,
      "weight_type": "linear",
      "combine_embeds": "concat",
      "start_at": 0,
      "end_at": 1,
      "embeds_scaling": "V only"
    }
  },
  // KSampler with new settings
  "20": {
    "class_type": "KSampler",
    "inputs": {
      "model": ["14", 0],
      "positive": ["3", 0],
      "negative": ["4", 0],
      "latent_image": ["5", 0],
      "seed": Math.floor(Math.random() * 1000000000),
      "steps": 25,
      "cfg": 4.0,
      "sampler_name": "dpmpp_2m_sde",
      "scheduler": "karras",
      "denoise": 1.0
    }
  },
  // VAE Decode
  "21": {
    "class_type": "VAEDecode",
    "inputs": {
      "samples": ["20", 0],
      "vae": ["1", 2]
    }
  },
  // Upscale model loader
  "30": {
    "class_type": "UpscaleModelLoader",
    "inputs": {
      "model_name": "4x-UltraSharp.pth"
    }
  },
  // Upscale image
  "31": {
    "class_type": "ImageUpscaleWithModel",
    "inputs": {
      "upscale_model": ["30", 0],
      "image": ["21", 0]
    }
  },
  // Save final image
  "40": {
    "class_type": "SaveImage",
    "inputs": {
      "images": ["31", 0],
      "filename_prefix": "elena_simple_test"
    }
  }
};

async function queuePrompt(prompt) {
  const response = await fetch(`${COMFYUI_URL}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  return response.json();
}

async function getHistory(promptId) {
  const response = await fetch(`${COMFYUI_URL}/history/${promptId}`);
  return response.json();
}

async function waitForCompletion(promptId, maxWaitMs = 300000) {
  const startTime = Date.now();
  console.log(`⏳ Waiting for generation (max ${maxWaitMs/1000}s)...`);
  
  while (Date.now() - startTime < maxWaitMs) {
    const history = await getHistory(promptId);
    
    if (history[promptId]) {
      const status = history[promptId].status;
      if (status?.completed) {
        return { success: true, history: history[promptId] };
      }
      if (status?.status_str === 'error') {
        return { success: false, error: 'Generation failed', history: history[promptId] };
      }
    }
    
    await new Promise(r => setTimeout(r, 2000));
    process.stdout.write('.');
  }
  
  return { success: false, error: 'Timeout' };
}

async function main() {
  console.log('🎨 Elena Simple Test - Workflow Simplifié');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Config:');
  console.log('   • LoRA weight: 0.7');
  console.log('   • CFG: 4.0');
  console.log('   • Sampler: dpmpp_2m_sde');
  console.log('   • No style IP-Adapter (face only)');
  console.log('   • Upscale: 4x-UltraSharp');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Check ComfyUI
  try {
    await fetch(`${COMFYUI_URL}/system_stats`);
    console.log('✅ ComfyUI connected\n');
  } catch (e) {
    console.error('❌ ComfyUI not running at', COMFYUI_URL);
    process.exit(1);
  }

  // Queue the prompt
  console.log('🚀 Queueing generation...');
  const result = await queuePrompt(workflow);
  
  if (result.error) {
    console.error('❌ Queue error:', result.error);
    if (result.node_errors) {
      console.error('Node errors:', JSON.stringify(result.node_errors, null, 2));
    }
    process.exit(1);
  }

  const promptId = result.prompt_id;
  console.log(`📝 Prompt ID: ${promptId}\n`);

  // Wait for completion
  const completion = await waitForCompletion(promptId);
  console.log('\n');

  if (completion.success) {
    console.log('✅ Generation complete!');
    
    // Find output files
    const outputs = completion.history.outputs;
    for (const [nodeId, output] of Object.entries(outputs)) {
      if (output.images) {
        for (const img of output.images) {
          console.log(`📷 Output: ~/ComfyUI/output/${img.filename}`);
        }
      }
    }
  } else {
    console.error('❌ Generation failed:', completion.error);
    if (completion.history) {
      console.error('Details:', JSON.stringify(completion.history, null, 2));
    }
  }
}

main().catch(console.error);
