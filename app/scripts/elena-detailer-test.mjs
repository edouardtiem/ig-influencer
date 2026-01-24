/**
 * Elena Detailer Test - FaceDetailer Integration
 * 
 * Workflow avec Impact Pack FaceDetailer:
 * Checkpoint → LoRA → IP-Adapter → KSampler → VAEDecode → FaceDetailer → 4x-UltraSharp → Save
 * 
 * Test sur une seule image pour valider le setup
 */

const COMFYUI_URL = 'http://127.0.0.1:8188';

const PROMPT = `elena, beautiful woman, natural breasts D cup, lying naked on back in luxury hotel bed, just woken up, stretching arms above head, white silk sheets tangled around one ankle only, legs spread wide apart, shaved pussy fully visible, bare breasts exposed, messy morning hair on pillow, sleepy relaxed face looking at ceiling, luxury suite, morning sunlight through sheer curtains, 8k, photorealistic, detailed skin texture`;

const NEGATIVE = `small breasts, flat chest, ugly, deformed, bad anatomy, bad hands, missing fingers, extra fingers, blurry, low quality, watermark, text, logo, cartoon, anime, illustration, painting, cgi, 3d render, looking at camera, eye contact with viewer`;

function createWorkflowWithDetailer(seed) {
  return {
    // === BASE GENERATION ===
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": { "ckpt_name": "bigLove_xl1.safetensors" }
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
        "text": PROMPT,
        "clip": ["2", 1]
      }
    },
    "4": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": NEGATIVE,
        "clip": ["2", 1]
      }
    },
    "5": {
      "class_type": "EmptyLatentImage",
      "inputs": { "width": 1024, "height": 1024, "batch_size": 1 }
    },
    
    // === IP-ADAPTER FACE ===
    "10": {
      "class_type": "LoadImage",
      "inputs": { "image": "elena_face_ref.jpg" }
    },
    "11": {
      "class_type": "CLIPVisionLoader",
      "inputs": { "clip_name": "CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors" }
    },
    "12": {
      "class_type": "IPAdapterModelLoader",
      "inputs": { "ipadapter_file": "faceid.plusv2.sdxl.bin" }
    },
    "13": {
      "class_type": "IPAdapterInsightFaceLoader",
      "inputs": { "provider": "CPU", "model_name": "buffalo_l" }
    },
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
    
    // === SAMPLING ===
    "20": {
      "class_type": "KSampler",
      "inputs": {
        "model": ["14", 0],
        "positive": ["3", 0],
        "negative": ["4", 0],
        "latent_image": ["5", 0],
        "seed": seed,
        "steps": 25,
        "cfg": 4.0,
        "sampler_name": "dpmpp_2m_sde",
        "scheduler": "karras",
        "denoise": 1.0
      }
    },
    "21": {
      "class_type": "VAEDecode",
      "inputs": {
        "samples": ["20", 0],
        "vae": ["1", 2]
      }
    },
    
    // === FACE DETAILER ===
    "50": {
      "class_type": "UltralyticsDetectorProvider",
      "inputs": {
        "model_name": "bbox/face_yolov8m.pt"
      }
    },
    "51": {
      "class_type": "SAMLoader",
      "inputs": {
        "model_name": "sam_vit_b_01ec64.pth",
        "device_mode": "AUTO"
      }
    },
    "52": {
      "class_type": "FaceDetailer",
      "inputs": {
        "image": ["21", 0],
        "model": ["2", 0],
        "clip": ["2", 1],
        "vae": ["1", 2],
        "positive": ["3", 0],
        "negative": ["4", 0],
        "bbox_detector": ["50", 0],
        "sam_model_opt": ["51", 0],
        "segm_detector_opt": null,
        "guide_size": 512,
        "guide_size_for": true,
        "max_size": 1024,
        "seed": seed,
        "steps": 20,
        "cfg": 4.0,
        "sampler_name": "dpmpp_2m_sde",
        "scheduler": "karras",
        "denoise": 0.4,
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
    
    // === UPSCALE ===
    "30": {
      "class_type": "UpscaleModelLoader",
      "inputs": { "model_name": "4x-UltraSharp.pth" }
    },
    "31": {
      "class_type": "ImageUpscaleWithModel",
      "inputs": {
        "upscale_model": ["30", 0],
        "image": ["52", 0]  // FaceDetailer output
      }
    },
    
    // === SAVE ===
    "40": {
      "class_type": "SaveImage",
      "inputs": {
        "images": ["31", 0],
        "filename_prefix": "elena_detailer_test"
      }
    }
  };
}

async function queuePrompt(prompt) {
  const response = await fetch(`${COMFYUI_URL}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  return response.json();
}

async function waitForCompletion(promptId, maxWaitMs = 600000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(`${COMFYUI_URL}/history/${promptId}`);
    const history = await response.json();
    
    if (history[promptId]) {
      const status = history[promptId].status;
      if (status?.completed) {
        return { success: true, history: history[promptId] };
      }
      if (status?.status_str === 'error') {
        return { success: false, error: 'Generation failed', history: history[promptId] };
      }
    }
    
    await new Promise(r => setTimeout(r, 3000));
    process.stdout.write('.');
  }
  
  return { success: false, error: 'Timeout' };
}

async function main() {
  console.log('🔬 Elena Detailer Test - FaceDetailer Integration');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Workflow: Base → FaceDetailer → 4x-UltraSharp');
  console.log('🎯 Test: Single image with face enhancement\n');

  // Check ComfyUI
  try {
    await fetch(`${COMFYUI_URL}/system_stats`);
    console.log('✅ ComfyUI connected\n');
  } catch (e) {
    console.error('❌ ComfyUI not running at', COMFYUI_URL);
    process.exit(1);
  }

  const seed = Math.floor(Math.random() * 1000000000);
  console.log(`📸 Generating with seed: ${seed}`);
  
  const workflow = createWorkflowWithDetailer(seed);
  const result = await queuePrompt(workflow);
  
  if (result.error) {
    console.error('❌ Queue error:', JSON.stringify(result, null, 2));
    process.exit(1);
  }

  const promptId = result.prompt_id;
  console.log(`⏳ Queued: ${promptId}`);
  process.stdout.write('   Generating');
  
  const completion = await waitForCompletion(promptId);
  
  if (completion.success) {
    const outputs = completion.history.outputs;
    let filename = '';
    for (const [nodeId, output] of Object.entries(outputs)) {
      if (output.images) {
        filename = output.images[0]?.filename || '';
      }
    }
    console.log(`\n\n✅ Done: ${filename}`);
    console.log(`📁 Output: ~/ComfyUI/output/${filename}`);
  } else {
    console.log(`\n\n❌ Failed: ${completion.error}`);
    if (completion.history) {
      console.log('Details:', JSON.stringify(completion.history, null, 2));
    }
  }
}

main().catch(console.error);
