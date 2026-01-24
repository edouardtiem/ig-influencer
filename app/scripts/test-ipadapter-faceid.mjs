#!/usr/bin/env node
/**
 * Test IP-Adapter FaceID Plus v2 for face variety
 * 
 * Hypothesis: IP-Adapter FaceID extracts face features without copying pose,
 * allowing generation of Elena with different angles/expressions.
 * 
 * Test: Generate 3 images with same face ref but different angle prompts
 */

const COMFYUI_URL = 'http://127.0.0.1:8188';

// Workflow template for IP-Adapter FaceID Plus v2
function createWorkflow(prompt, seed, outputPrefix) {
  return {
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": {
        "ckpt_name": "bigLove_xl1.safetensors"
      }
    },
    "2": {
      "class_type": "LoraLoader",
      "inputs": {
        "model": ["1", 0],
        "clip": ["1", 1],
        "lora_name": "elena_v4_cloud.safetensors",
        "strength_model": 1.0,
        "strength_clip": 1.0
      }
    },
    "3": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "clip": ["2", 1],
        "text": prompt
      }
    },
    "4": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "clip": ["2", 1],
        "text": "ugly, deformed, bad anatomy, bad hands, missing fingers, extra fingers, blurry, low quality, watermark, text"
      }
    },
    "5": {
      "class_type": "EmptyLatentImage",
      "inputs": {
        "width": 832,
        "height": 1216,
        "batch_size": 1
      }
    },
    "6": {
      "class_type": "LoadImage",
      "inputs": {
        "image": "elena_face_ref.jpg"
      }
    },
    "7": {
      "class_type": "CLIPVisionLoader",
      "inputs": {
        "clip_name": "CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors"
      }
    },
    "8": {
      "class_type": "IPAdapterModelLoader",
      "inputs": {
        "ipadapter_file": "faceid.plusv2.sdxl.bin"
      }
    },
    "9": {
      "class_type": "IPAdapterInsightFaceLoader",
      "inputs": {
        "provider": "CPU",
        "model_name": "buffalo_l"
      }
    },
    "10": {
      "class_type": "IPAdapterFaceID",
      "inputs": {
        "model": ["2", 0],
        "ipadapter": ["8", 0],
        "image": ["6", 0],
        "clip_vision": ["7", 0],
        "insightface": ["9", 0],
        "weight": 0.85,
        "weight_faceidv2": 0.85,
        "weight_type": "linear",
        "combine_embeds": "concat",
        "start_at": 0.0,
        "end_at": 1.0,
        "embeds_scaling": "V only"
      }
    },
    "11": {
      "class_type": "KSampler",
      "inputs": {
        "model": ["10", 0],
        "positive": ["3", 0],
        "negative": ["4", 0],
        "latent_image": ["5", 0],
        "seed": seed,
        "steps": 30,
        "cfg": 3.5,
        "sampler_name": "dpmpp_2m_sde",
        "scheduler": "karras",
        "denoise": 1.0
      }
    },
    "12": {
      "class_type": "VAEDecode",
      "inputs": {
        "samples": ["11", 0],
        "vae": ["1", 2]
      }
    },
    "13": {
      "class_type": "SaveImage",
      "inputs": {
        "images": ["12", 0],
        "filename_prefix": outputPrefix
      }
    }
  };
}

async function queuePrompt(workflow) {
  const response = await fetch(`${COMFYUI_URL}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow })
  });
  return await response.json();
}

async function waitForCompletion(promptId, maxWait = 300000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    const response = await fetch(`${COMFYUI_URL}/history/${promptId}`);
    const history = await response.json();
    if (history[promptId]?.outputs) {
      return history[promptId];
    }
    await new Promise(r => setTimeout(r, 2000));
    process.stdout.write('.');
  }
  throw new Error('Timeout waiting for completion');
}

async function main() {
  console.log('🧪 TEST: IP-Adapter FaceID Plus v2 - Face Variety');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Hypothèse: IP-Adapter FaceID permet de varier les angles');
  console.log('           du visage tout en gardant l\'identité d\'Elena');
  console.log('');
  
  const tests = [
    {
      name: 'Elena masturbating - Haussmannian bedroom',
      prompt: `elena, nude, lying on luxurious bed with white silk sheets,
legs spread wide open, one hand touching herself between legs, masturbating,
visible vulva, visible clitoris, fingers on pussy,
exposed breasts, erect nipples,
eyes closed, pleasure expression, mouth slightly open, moaning,
Haussmannian apartment bedroom, ornate moldings, tall windows with sheer curtains,
soft morning light, intimate atmosphere,
8k, photorealistic, detailed skin texture`,
      prefix: 'ipadapter_elena_masturbating'
    }
  ];
  
  const baseSeed = 42;
  
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n[${i + 1}/${tests.length}] ${test.name}`);
    console.log(`    Prompt: "${test.prompt.substring(0, 50)}..."`);
    
    const workflow = createWorkflow(test.prompt, baseSeed + i, test.prefix);
    
    try {
      const result = await queuePrompt(workflow);
      if (result.error) {
        console.log(`    ❌ Erreur: ${result.error}`);
        continue;
      }
      
      console.log(`    ⏳ Génération en cours...`);
      process.stdout.write('    ');
      await waitForCompletion(result.prompt_id);
      console.log(`\n    ✅ Image sauvegardée: ${test.prefix}_*.png`);
    } catch (err) {
      console.log(`    ❌ ${err.message}`);
    }
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Test terminé ! Vérifie les images dans ~/ComfyUI/output/');
  console.log('');
  console.log('Si les 3 images montrent Elena avec des angles différents');
  console.log('mais un visage cohérent → Hypothèse validée ✅');
}

main().catch(console.error);
