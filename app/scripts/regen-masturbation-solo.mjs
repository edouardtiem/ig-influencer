/**
 * Regenerate POV masturbation selfie - SOLO only
 */

import { queuePrompt, getHistory, checkConnection } from './comfyui-api.mjs';
import path from 'path';

const OUTPUT_DIR = path.join(process.env.HOME, 'ComfyUI/output');

function buildSoloMasturbationWorkflow(seed) {
  const positive = `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
24 year old Italian woman named Elena, SOLO, ALONE, one person only,
honey brown warm eyes, bronde hair with dark roots and golden blonde balayage, long voluminous beach waves,
small beauty mark on right cheekbone,
fit athletic toned body, large natural breasts, D-cup, defined slim waist, toned stomach, smooth skin,
completely nude, naked, no clothes,
solo female masturbation, touching herself alone, fingers on her own pussy,
lying on back on white bed, holding phone with one hand taking selfie from above,
other hand between her spread legs, her own fingers rubbing wet clitoris,
knees bent up, legs spread wide open, looking up at phone camera,
pleasured expression, moaning, eyes half closed with pleasure, biting lip,
wet pussy, glistening aroused pussy, visible wetness,
POV selfie from above, phone held at arms length looking down at her body,
amateur selfie, self-shot, authentic intimate solo moment,
luxury hotel room, white bedding, warm ambient lighting,
natural skin texture, soft warm lighting,
gold layered necklaces, gold bracelet,
shot on iPhone, shallow depth of field`;

  const negative = `male, man, men, penis, cock, dick, couple, two people, multiple people, sex, intercourse, penetration,
clothes, dressed, bikini, swimsuit, lingerie,
flat chest, small breasts,
worst quality, low quality, blurry, cartoon, anime,
bad anatomy, bad hands, extra fingers, deformed,
watermark, censored, mosaic`;

  return {
    "1": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": "bigLust_v16.safetensors" } },
    "2": { "class_type": "IPAdapterModelLoader", "inputs": { "ipadapter_file": "ip-adapter-plus_sdxl_vit-h.safetensors" } },
    "3": { "class_type": "CLIPVisionLoader", "inputs": { "clip_name": "CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors" } },
    "4": { "class_type": "LoadImage", "inputs": { "image": "elena_body_reference.png" } },
    "5": { "class_type": "CLIPTextEncode", "inputs": { "text": positive, "clip": ["1", 1] } },
    "6": { "class_type": "CLIPTextEncode", "inputs": { "text": negative, "clip": ["1", 1] } },
    "7": { "class_type": "EmptyLatentImage", "inputs": { "width": 832, "height": 1216, "batch_size": 1 } },
    "8": {
      "class_type": "IPAdapterAdvanced",
      "inputs": {
        "model": ["1", 0], "ipadapter": ["2", 0], "image": ["4", 0],
        "weight": 0.3, "weight_type": "linear", "combine_embeds": "concat",
        "start_at": 0.0, "end_at": 1.0, "embeds_scaling": "V only", "clip_vision": ["3", 0]
      }
    },
    "9": {
      "class_type": "KSampler",
      "inputs": {
        "seed": seed, "steps": 30, "cfg": 3.5, "sampler_name": "dpmpp_2m_sde", "scheduler": "karras", "denoise": 1.0,
        "model": ["8", 0], "positive": ["5", 0], "negative": ["6", 0], "latent_image": ["7", 0]
      }
    },
    "10": { "class_type": "VAEDecode", "inputs": { "samples": ["9", 0], "vae": ["1", 2] } },
    "11": { "class_type": "SaveImage", "inputs": { "filename_prefix": "Elena_Masturbation_POV_SOLO", "images": ["10", 0] } }
  };
}

async function waitForCompletionPolling(promptId, maxWaitMs = 600000) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    const history = await getHistory(promptId);
    if (history[promptId]?.outputs && Object.keys(history[promptId].outputs).length > 0) return history[promptId];
    if (history[promptId]?.status?.status_str === 'error') throw new Error('Generation failed');
    process.stdout.write(`\rGenerating... ${Math.round((Date.now() - startTime) / 1000)}s`);
    await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error('Timeout');
}

async function main() {
  console.log('REGENERATING POV MASTURBATION - SOLO ONLY\n');
  
  const status = await checkConnection();
  if (!status.connected) { console.error('❌ ComfyUI not accessible'); process.exit(1); }
  console.log(`✅ Connected\n`);
  
  const seed = Math.floor(Math.random() * 1000000000);
  const workflow = buildSoloMasturbationWorkflow(seed);
  const { prompt_id } = await queuePrompt(workflow);
  
  console.log('Prompt: SOLO, ALONE, NO man in negative...');
  const startTime = Date.now();
  
  const result = await waitForCompletionPolling(prompt_id);
  const duration = Math.round((Date.now() - startTime) / 1000);
  
  const saveNode = Object.values(result.outputs).find(o => o.images);
  if (saveNode?.images.length) {
    console.log(`\n\n✅ Done (${duration}s) → ${saveNode.images[0].filename}`);
  }
}

main().catch(console.error);
