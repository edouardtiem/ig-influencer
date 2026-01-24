/**
 * Elena Luxury Wife Pack - 5 Explicit Voyeur Photos
 * 
 * Concept: "L'Épouse de luxe surprise"
 * - Elena dans des poses ultra explicites
 * - Room service suggéré en arrière-plan (silhouette, ombre)
 * - Elena ne remarque pas la présence
 * 
 * Setup optimisé:
 * - BigLove XL + Elena LoRA @ 0.7
 * - IP-Adapter FaceID v2 @ 0.85
 * - CFG 4.0 + dpmpp_2m_sde
 * - 4x-UltraSharp upscale
 */

import fs from 'fs';
import path from 'path';

const COMFYUI_URL = 'http://127.0.0.1:8188';

const POSES = [
  {
    name: '01_bath_caught',
    prompt: `elena, beautiful woman, natural breasts D cup, naked in luxury freestanding bathtub, lying back in water, one leg raised resting on edge of tub, legs spread, shaved pussy visible above waterline, wet skin glistening, hair in messy bun, eyes closed relaxed expression, luxury marble bathroom, blurred male silhouette in doorway background holding silver tray, door slightly open, warm ambient lighting, steam in air, 8k, photorealistic, detailed skin texture`
  },
  {
    name: '02_morning_awakening',
    prompt: `elena, beautiful woman, natural breasts D cup, lying naked on back in luxury hotel bed, just woken up, stretching arms above head, white silk sheets tangled around one ankle only, legs spread wide apart, shaved pussy fully visible, bare breasts exposed, messy morning hair on pillow, sleepy relaxed face looking at ceiling, luxury suite, morning sunlight through sheer curtains, male shadow cast on wall near open door, room service cart wheel visible at edge of frame, 8k, photorealistic, detailed skin texture`
  },
  {
    name: '03_private_pleasure',
    prompt: `elena, beautiful woman, natural breasts D cup, lying on luxury hotel bed, head on silk pillows, eyes closed in pleasure, lips parted moaning, one hand between spread legs, fingers touching pussy, masturbating, other hand squeezing own breast, back slightly arched, completely naked on white sheets, knees bent feet on mattress, blurred male figure frozen in doorway background holding towels, soft diffused lighting, luxury bedroom, 8k, photorealistic, detailed skin texture`
  },
  {
    name: '04_lotion_ritual',
    prompt: `elena, beautiful woman, natural breasts D cup, lying face down on hotel bed, completely naked, applying body lotion to her own ass with both hands, ass raised slightly, looking down at her hands concentrated on task, bare back, side of breast visible pressed against sheets, legs slightly apart, pussy visible from behind angle, luxury suite, afternoon light, dark male silhouette reflection visible in window glass standing at door, 8k, photorealistic, detailed skin texture`
  },
  {
    name: '05_getting_ready',
    prompt: `elena, beautiful woman, natural breasts D cup, standing naked in front of full length mirror, one leg raised on velvet armchair, bending forward slightly, rolling black stocking up her thigh, completely nude except stocking being put on, breasts hanging, pussy visible, concentrated on dressing, luxury hotel room, warm lighting, room service cart just pushed through door, male hand visible on cart handle at frame edge, mirror reflecting her nude body, 8k, photorealistic, detailed skin texture`
  }
];

const NEGATIVE = `small breasts, flat chest, ugly, deformed, bad anatomy, bad hands, missing fingers, extra fingers, blurry, low quality, watermark, text, logo, cartoon, anime, illustration, painting, cgi, 3d render, looking at camera, eye contact with viewer, aware of being watched, clothed, dressed, covered`;

function createWorkflow(prompt, seed, outputPrefix) {
  return {
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
        "text": prompt,
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
    "30": {
      "class_type": "UpscaleModelLoader",
      "inputs": { "model_name": "4x-UltraSharp.pth" }
    },
    "31": {
      "class_type": "ImageUpscaleWithModel",
      "inputs": {
        "upscale_model": ["30", 0],
        "image": ["21", 0]
      }
    },
    "40": {
      "class_type": "SaveImage",
      "inputs": {
        "images": ["31", 0],
        "filename_prefix": outputPrefix
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

async function getHistory(promptId) {
  const response = await fetch(`${COMFYUI_URL}/history/${promptId}`);
  return response.json();
}

async function waitForCompletion(promptId, maxWaitMs = 300000) {
  const startTime = Date.now();
  
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
    
    await new Promise(r => setTimeout(r, 3000));
    process.stdout.write('.');
  }
  
  return { success: false, error: 'Timeout' };
}

async function main() {
  console.log('💎 Elena Luxury Wife Pack - 5 Photos Voyeur Explicites');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎭 Concept: Épouse de luxe surprise par le room service');
  console.log('📋 Config: LoRA 0.7 | CFG 4.0 | dpmpp_2m_sde | 4x-UltraSharp\n');

  // Check ComfyUI
  try {
    await fetch(`${COMFYUI_URL}/system_stats`);
    console.log('✅ ComfyUI connected\n');
  } catch (e) {
    console.error('❌ ComfyUI not running at', COMFYUI_URL);
    process.exit(1);
  }

  const results = [];

  for (let i = 0; i < POSES.length; i++) {
    const pose = POSES[i];
    const seed = Math.floor(Math.random() * 1000000000);
    
    console.log(`\n📸 [${i + 1}/5] ${pose.name}`);
    console.log(`   Seed: ${seed}`);
    
    const workflow = createWorkflow(pose.prompt, seed, `elena_luxwife_${pose.name}`);
    const result = await queuePrompt(workflow);
    
    if (result.error) {
      console.error(`   ❌ Error:`, result.error);
      results.push({ name: pose.name, success: false, error: result.error });
      continue;
    }

    const promptId = result.prompt_id;
    process.stdout.write('   ⏳ Generating');
    
    const completion = await waitForCompletion(promptId);
    
    if (completion.success) {
      const outputs = completion.history.outputs;
      let filename = '';
      for (const [nodeId, output] of Object.entries(outputs)) {
        if (output.images) {
          filename = output.images[0]?.filename || '';
        }
      }
      console.log(`\n   ✅ Done: ${filename}`);
      results.push({ name: pose.name, success: true, filename });
    } else {
      console.log(`\n   ❌ Failed: ${completion.error}`);
      results.push({ name: pose.name, success: false, error: completion.error });
    }
  }

  // Summary
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RÉSUMÉ - Luxury Wife Pack');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Succès: ${successful.length}/5`);
  successful.forEach(r => console.log(`   - ${r.filename}`));
  
  if (failed.length > 0) {
    console.log(`❌ Échecs: ${failed.length}/5`);
    failed.forEach(r => console.log(`   - ${r.name}: ${r.error}`));
  }
  
  console.log(`\n📁 Output: ~/ComfyUI/output/elena_luxwife_*`);
  console.log('\n💡 Tip: Les silhouettes du room service sont suggérées (floues/ombres)');
}

main().catch(console.error);
