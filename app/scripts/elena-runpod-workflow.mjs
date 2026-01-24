/**
 * Elena RunPod Workflow - BigLove XL + LoRA + IP-Adapter FaceID
 * 
 * Workflow: BigLove → LoRA → IP-Adapter FaceID → Generate → Upscale 4x
 */

const RUNPOD_URL = 'https://dortewt0b3tom3-8188.proxy.runpod.net';

const CONFIG = {
  checkpoint: 'bigLove_xl1.safetensors',
  lora: 'elena_v4_cloud.safetensors',
  loraStrength: 1.0,
  ipadapter: 'ip-adapter-faceid-plusv2_sdxl.bin',
  ipadapterLora: 'ip-adapter-faceid-plusv2_sdxl_lora.safetensors',
  ipadapterWeight: 0.85,
  faceRef: 'elena_face_ref.jpg',
  width: 832,
  height: 1216,
  steps: 30,
  cfg: 3.0,
  sampler: 'dpmpp_2m_sde',
  scheduler: 'karras',
  upscaler: '4x-UltraSharp.pth',
};

const PROMPTS = [
  {
    name: "terrace_morning",
    positive: `elena, 24 year old Italian woman,
honey brown warm eyes, bronde hair with dark roots and golden blonde balayage, long beach waves,
small beauty mark on right cheekbone,
sitting on terrace with coffee, wearing white silk robe loosely tied,
cleavage visible, natural breasts, relaxed morning pose,
mediterranean villa, golden hour sunlight, soft shadows,
masterpiece, best quality, photorealistic, 8k uhd, natural skin texture`,
  },
  {
    name: "bedroom_intimate",
    positive: `elena, 24 year old Italian woman,
honey brown warm eyes, bronde hair messy and tousled,
small beauty mark on right cheekbone,
lying in bed, white sheets, wearing only lace underwear,
breasts visible, soft natural lighting from window,
intimate bedroom setting, morning light,
masterpiece, best quality, photorealistic, 8k uhd, soft skin`,
  },
];

const NEGATIVE = `worst quality, low quality, blurry, cartoon, anime, 3d render,
bad anatomy, bad hands, extra fingers, deformed, disfigured,
watermark, text, logo, male, man, plastic skin, oversaturated`;

function buildWorkflow(positive, negative, seed, filenamePrefix) {
  return {
    // 1. Load BigLove checkpoint
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": { "ckpt_name": CONFIG.checkpoint }
    },
    
    // 2. Load Elena LoRA
    "2": {
      "class_type": "LoraLoader",
      "inputs": {
        "lora_name": CONFIG.lora,
        "strength_model": CONFIG.loraStrength,
        "strength_clip": CONFIG.loraStrength,
        "model": ["1", 0],
        "clip": ["1", 1]
      }
    },
    
    // 3. Load IP-Adapter FaceID LoRA
    "3": {
      "class_type": "LoraLoader",
      "inputs": {
        "lora_name": CONFIG.ipadapterLora,
        "strength_model": CONFIG.ipadapterWeight,
        "strength_clip": CONFIG.ipadapterWeight,
        "model": ["2", 0],
        "clip": ["2", 1]
      }
    },
    
    // 4. Load IP-Adapter model
    "4": {
      "class_type": "IPAdapterModelLoader",
      "inputs": { "ipadapter_file": CONFIG.ipadapter }
    },
    
    // 5. Load CLIP Vision
    "5": {
      "class_type": "CLIPVisionLoader",
      "inputs": { "clip_name": "CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors" }
    },
    
    // 6. Load face reference image
    "6": {
      "class_type": "LoadImage",
      "inputs": { "image": CONFIG.faceRef }
    },
    
    // 7. Apply IP-Adapter
    "7": {
      "class_type": "IPAdapterAdvanced",
      "inputs": {
        "weight": CONFIG.ipadapterWeight,
        "weight_type": "linear",
        "combine_embeds": "concat",
        "start_at": 0.0,
        "end_at": 1.0,
        "embeds_scaling": "V only",
        "model": ["3", 0],
        "ipadapter": ["4", 0],
        "image": ["6", 0],
        "clip_vision": ["5", 0]
      }
    },
    
    // 8. Positive prompt
    "8": {
      "class_type": "CLIPTextEncode",
      "inputs": { "text": positive, "clip": ["3", 1] }
    },
    
    // 9. Negative prompt
    "9": {
      "class_type": "CLIPTextEncode",
      "inputs": { "text": negative, "clip": ["3", 1] }
    },
    
    // 10. Empty latent
    "10": {
      "class_type": "EmptyLatentImage",
      "inputs": { 
        "width": CONFIG.width, 
        "height": CONFIG.height, 
        "batch_size": 1 
      }
    },
    
    // 11. KSampler
    "11": {
      "class_type": "KSampler",
      "inputs": {
        "seed": seed,
        "steps": CONFIG.steps,
        "cfg": CONFIG.cfg,
        "sampler_name": CONFIG.sampler,
        "scheduler": CONFIG.scheduler,
        "denoise": 1.0,
        "model": ["7", 0],
        "positive": ["8", 0],
        "negative": ["9", 0],
        "latent_image": ["10", 0]
      }
    },
    
    // 12. VAE Decode
    "12": {
      "class_type": "VAEDecode",
      "inputs": { "samples": ["11", 0], "vae": ["1", 2] }
    },
    
    // 13. Load Upscaler
    "13": {
      "class_type": "UpscaleModelLoader",
      "inputs": { "model_name": CONFIG.upscaler }
    },
    
    // 14. Upscale 4x
    "14": {
      "class_type": "ImageUpscaleWithModel",
      "inputs": {
        "upscale_model": ["13", 0],
        "image": ["12", 0]
      }
    },
    
    // 15. Save
    "15": {
      "class_type": "SaveImage",
      "inputs": { 
        "filename_prefix": filenamePrefix, 
        "images": ["14", 0] 
      }
    }
  };
}

async function queuePrompt(workflow) {
  const response = await fetch(`${RUNPOD_URL}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow })
  });
  return response.json();
}

async function getHistory(promptId) {
  const response = await fetch(`${RUNPOD_URL}/history/${promptId}`);
  return response.json();
}

async function waitForCompletion(promptId, maxWaitMs = 600000) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    const history = await getHistory(promptId);
    if (history[promptId]?.outputs && Object.keys(history[promptId].outputs).length > 0) {
      return history[promptId];
    }
    if (history[promptId]?.status?.status_str === 'error') {
      console.error(history[promptId].status);
      throw new Error('Generation failed');
    }
    process.stdout.write(`\r  ⏳ ${Math.round((Date.now() - startTime) / 1000)}s`);
    await new Promise(r => setTimeout(r, 3000));
  }
  throw new Error('Timeout');
}

async function main() {
  console.log('============================================================');
  console.log('ELENA RUNPOD - BigLove XL + LoRA + IP-Adapter FaceID');
  console.log('============================================================');
  console.log(`Config:`);
  console.log(`  Checkpoint: ${CONFIG.checkpoint}`);
  console.log(`  LoRA: ${CONFIG.lora} @ ${CONFIG.loraStrength}`);
  console.log(`  IP-Adapter: ${CONFIG.ipadapter} @ ${CONFIG.ipadapterWeight}`);
  console.log(`  Resolution: ${CONFIG.width}x${CONFIG.height}`);
  console.log(`  Steps: ${CONFIG.steps}, CFG: ${CONFIG.cfg}`);
  console.log(`  Upscaler: ${CONFIG.upscaler} (4x)`);
  console.log('');
  
  // Check connection
  try {
    const response = await fetch(`${RUNPOD_URL}/system_stats`);
    const stats = await response.json();
    console.log(`✅ ComfyUI ${stats.system.comfyui_version} connected\n`);
  } catch (e) {
    console.error('❌ Cannot connect to ComfyUI');
    process.exit(1);
  }
  
  const baseSeed = Math.floor(Math.random() * 1000000000);
  
  for (let i = 0; i < PROMPTS.length; i++) {
    const prompt = PROMPTS[i];
    const seed = baseSeed + i;
    
    console.log(`\n[${i + 1}/${PROMPTS.length}] ${prompt.name}`);
    
    const workflow = buildWorkflow(
      prompt.positive,
      NEGATIVE,
      seed,
      `elena_biglove_${prompt.name}`
    );
    
    try {
      const { prompt_id, node_errors } = await queuePrompt(workflow);
      
      if (node_errors && Object.keys(node_errors).length > 0) {
        console.error('  ❌ Node errors:', JSON.stringify(node_errors, null, 2));
        continue;
      }
      
      console.log(`  📤 Queued: ${prompt_id}`);
      
      const result = await waitForCompletion(prompt_id);
      const output = Object.values(result.outputs).find(o => o.images);
      
      if (output?.images?.length) {
        const filename = output.images[0].filename;
        console.log(`\n  ✅ ${filename}`);
        
        // Download image
        const imageUrl = `${RUNPOD_URL}/view?filename=${filename}&type=output`;
        console.log(`  📥 ${imageUrl}`);
      }
    } catch (e) {
      console.log(`\n  ❌ Failed: ${e.message}`);
    }
  }
  
  console.log('\n============================================================');
  console.log('DONE');
  console.log('============================================================');
}

main().catch(console.error);
