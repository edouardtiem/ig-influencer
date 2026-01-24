/**
 * Elena InstantID Test
 * LoRA + Big Love + InstantID for face transfer
 */

import { queuePrompt, getHistory, checkConnection } from './comfyui-api.mjs';
import path from 'path';

const OUTPUT_DIR = path.join(process.env.HOME, 'ComfyUI/output');

// Detailed Elena prompt based on reference photos analysis
const ELENA_FACE_PROMPT = `elena, 24 year old Italian woman,
oval heart-shaped face with soft contours, high prominent cheekbones, soft jawline not angular, small slightly pointed chin,
hazel green-brown eyes with golden honey tones, almond-shaped slightly hooded eyes, dark well-defined eyebrows with natural arch, long eyelashes,
straight nose with slight slope and rounded tip,
full plump lips with larger bottom lip, defined cupid's bow, natural rose pink color,
small beauty mark mole on right cheek near cheekbone,
sun-kissed golden tan complexion, smooth clear skin, natural healthy glow,
bronde hair with dark roots and golden honey blonde balayage highlights, medium shoulder-length, loose beach waves texture,
gold layered necklaces with medallion pendant, gold chain bracelet`;

const ELENA_BODY_PROMPT = `athletic curvy body, slim defined waist, wide hips, toned arms,
natural medium-large breasts with realistic shape and natural sag, soft breast tissue, natural areolas,
natural skin texture, detailed skin pores, skin imperfections, photorealistic, not fake looking`;

function buildInstantIDWorkflow(options = {}) {
  const {
    positive,
    negative = `worst quality, low quality, blurry, cartoon, anime, bad anatomy, bad hands, deformed, watermark, text, male, man, plastic skin, oversaturated, fake breasts, silicone breasts, implants, perfect round breasts, unrealistic breasts`,
    width = 832,
    height = 1216,
    steps = 30,
    cfg = 3.0,
    seed = Math.floor(Math.random() * 1000000000),
    checkpoint = 'bigLove_xl1.safetensors',
    loraName = 'elena_v4_cloud.safetensors',
    loraStrength = 1.0,
    faceRefImage = 'elena_face_ref.jpg',
    instantIdWeight = 0.8,
    filenamePrefix = 'Elena_InstantID',
  } = options;

  return {
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
    
    // 3. Load InstantID model
    "3": {
      "class_type": "InstantIDModelLoader",
      "inputs": {
        "instantid_file": "ip-adapter.bin"
      }
    },
    
    // 4. Load InsightFace for face analysis
    "4": {
      "class_type": "InstantIDFaceAnalysis",
      "inputs": {
        "provider": "CPU"
      }
    },
    
    // 5. Load face reference image
    "5": {
      "class_type": "LoadImage",
      "inputs": { "image": faceRefImage }
    },
    
    // 6. Load ControlNet for InstantID
    "6": {
      "class_type": "ControlNetLoader",
      "inputs": {
        "control_net_name": "diffusion_pytorch_model.safetensors"
      }
    },
    
    // 7. Positive prompt
    "7": {
      "class_type": "CLIPTextEncode",
      "inputs": { "text": positive, "clip": ["2", 1] }
    },
    
    // 8. Negative prompt
    "8": {
      "class_type": "CLIPTextEncode",
      "inputs": { "text": negative, "clip": ["2", 1] }
    },
    
    // 9. Apply InstantID
    "9": {
      "class_type": "ApplyInstantID",
      "inputs": {
        "instantid": ["3", 0],
        "insightface": ["4", 0],
        "control_net": ["6", 0],
        "image": ["5", 0],
        "model": ["2", 0],
        "positive": ["7", 0],
        "negative": ["8", 0],
        "weight": instantIdWeight,
        "start_at": 0.0,
        "end_at": 1.0
      }
    },
    
    // 10. Empty latent
    "10": {
      "class_type": "EmptyLatentImage",
      "inputs": { "width": width, "height": height, "batch_size": 1 }
    },
    
    // 11. KSampler
    "11": {
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
        "latent_image": ["10", 0]
      }
    },
    
    // 12. VAE Decode
    "12": {
      "class_type": "VAEDecode",
      "inputs": { "samples": ["11", 0], "vae": ["1", 2] }
    },
    
    // 13. Save Image
    "13": {
      "class_type": "SaveImage",
      "inputs": { "filename_prefix": filenamePrefix, "images": ["12", 0] }
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

async function main() {
  const instantIdWeight = parseFloat(process.argv[2]) || 0.8;
  const seed = Math.floor(Math.random() * 1000000000);
  
  console.log('============================================================');
  console.log('ELENA - InstantID + LoRA + Big Love');
  console.log('============================================================');
  console.log(`Checkpoint: bigLove_xl1.safetensors`);
  console.log(`LoRA: elena_v4_cloud.safetensors (strength: 1.0)`);
  console.log(`InstantID Weight: ${instantIdWeight}`);
  console.log(`Face Reference: elena_face_ref.jpg`);
  console.log(`Seed: ${seed}`);
  console.log('============================================================\n');
  
  const status = await checkConnection();
  if (!status.connected) {
    console.error('❌ ComfyUI not running');
    process.exit(1);
  }
  
  const fullPrompt = `${ELENA_FACE_PROMPT},
${ELENA_BODY_PROMPT},
wearing black lace lingerie, lying on silk bed sheets,
seductive expression, bedroom eyes,
soft warm boudoir lighting,
masterpiece, best quality, photorealistic, 8k uhd, raw photo, detailed skin texture`;

  console.log('Prompt (detailed Elena features):');
  console.log(fullPrompt.slice(0, 200) + '...\n');
  
  const workflow = buildInstantIDWorkflow({
    positive: fullPrompt,
    instantIdWeight: instantIdWeight,
    seed: seed,
    filenamePrefix: `Elena_InstantID_w${instantIdWeight}`,
  });
  
  console.log('Generating with InstantID...');
  
  try {
    const { prompt_id } = await queuePrompt(workflow);
    console.log(`Prompt ID: ${prompt_id}`);
    
    const result = await waitForCompletion(prompt_id);
    const output = Object.values(result.outputs).find(o => o.images);
    
    if (output?.images?.length) {
      const filename = output.images[0].filename;
      const filepath = path.join(OUTPUT_DIR, filename);
      console.log(`\n\n✅ Done: ${filepath}`);
      
      const { exec } = await import('child_process');
      exec(`open "${filepath}"`);
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main().catch(console.error);
