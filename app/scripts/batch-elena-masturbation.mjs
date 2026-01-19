/**
 * Elena Masturbation Selfie Batch Generation
 * 
 * 4 images with varied selfie angles, wet pussy, hand touching
 * 
 * Usage:
 *   node app/scripts/batch-elena-masturbation.mjs
 */

import { queuePrompt, getHistory, checkConnection } from './comfyui-api.mjs';
import path from 'path';

const OUTPUT_DIR = path.join(process.env.HOME, 'ComfyUI/output');

const POSES = [
  {
    name: 'POV_selfie_above',
    pose: `lying on back on white bed, holding phone above with one hand taking selfie,
other hand between spread legs, fingers touching wet pussy, fingers on clitoris,
knees bent up, legs spread wide, looking up at camera with pleasure expression,
moaning face, eyes half closed, biting lip`,
    angle: 'POV selfie from above, phone held at arms length looking down at body'
  },
  {
    name: 'mirror_selfie_spread',
    pose: `sitting on floor in front of large mirror, legs spread wide apart facing mirror,
one hand holding phone taking mirror selfie, other hand fingers inside pussy,
reflection shows wet glistening pussy and fingers penetrating,
leaning back slightly, pleasured expression`,
    angle: 'mirror reflection shot, phone visible in reflection, intimate bedroom'
  },
  {
    name: 'closeup_pussy_selfie',
    pose: `lying on bed, phone pointed down between spread legs taking closeup selfie,
fingers spreading pussy lips apart, two fingers inside wet pussy,
glistening wet aroused pussy, swollen labia, visible wetness,
thighs spread wide, intimate self-shot`,
    angle: 'extreme closeup POV, shot from above looking down between legs, focus on pussy and hand'
  },
  {
    name: 'side_angle_bed',
    pose: `lying on side on silk sheets, one leg raised high,
holding phone with one hand taking side angle selfie,
other hand reaching down between legs touching wet pussy,
fingers rubbing clitoris, sensual masturbation pose`,
    angle: 'side angle selfie, phone held to the side, body in profile showing curves'
  }
];

function buildMasturbationWorkflow(poseConfig, seed) {
  const positive = `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
24 year old Italian woman named Elena,
honey brown warm eyes, bronde hair with dark roots and golden blonde balayage, long voluminous beach waves,
small beauty mark on right cheekbone,
fit athletic toned body, large natural breasts, D-cup, defined slim waist, toned stomach, smooth skin,
completely nude, naked, no clothes,
masturbating, touching herself, fingers on pussy, hand between legs,
wet pussy, glistening wet aroused pussy, dripping wet, visible wetness and arousal,
${poseConfig.pose},
${poseConfig.angle},
amateur selfie, self-shot, phone in hand, authentic intimate moment,
luxury hotel room, white bedding, warm ambient lighting, intimate atmosphere,
natural skin texture, soft warm lighting,
gold layered necklaces with medallion pendant, gold bracelet,
shot on iPhone, shallow depth of field, amateur photo aesthetic`;

  const negative = `dry pussy, clothes, dressed, bikini, swimsuit, lingerie, underwear,
flat chest, small breasts, A-cup, B-cup,
mountains, snow, outdoor, pool, beach, public place,
worst quality, low quality, blurry, cartoon, anime, illustration,
bad anatomy, bad hands, extra fingers, deformed, mutated,
watermark, censored, mosaic, plastic skin, oversaturated,
male, man, multiple people, professional photo`;

  return {
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": { "ckpt_name": "bigLust_v16.safetensors" }
    },
    "2": {
      "class_type": "IPAdapterModelLoader",
      "inputs": { "ipadapter_file": "ip-adapter-plus_sdxl_vit-h.safetensors" }
    },
    "3": {
      "class_type": "CLIPVisionLoader",
      "inputs": { "clip_name": "CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors" }
    },
    "4": {
      "class_type": "LoadImage",
      "inputs": { "image": "elena_body_reference.png" }
    },
    "5": {
      "class_type": "CLIPTextEncode",
      "inputs": { "text": positive, "clip": ["1", 1] }
    },
    "6": {
      "class_type": "CLIPTextEncode",
      "inputs": { "text": negative, "clip": ["1", 1] }
    },
    "7": {
      "class_type": "EmptyLatentImage",
      "inputs": { "width": 832, "height": 1216, "batch_size": 1 }
    },
    "8": {
      "class_type": "IPAdapterAdvanced",
      "inputs": {
        "model": ["1", 0],
        "ipadapter": ["2", 0],
        "image": ["4", 0],
        "weight": 0.3,
        "weight_type": "linear",
        "combine_embeds": "concat",
        "start_at": 0.0,
        "end_at": 1.0,
        "embeds_scaling": "V only",
        "clip_vision": ["3", 0]
      }
    },
    "9": {
      "class_type": "KSampler",
      "inputs": {
        "seed": seed,
        "steps": 30,
        "cfg": 3.5,
        "sampler_name": "dpmpp_2m_sde",
        "scheduler": "karras",
        "denoise": 1.0,
        "model": ["8", 0],
        "positive": ["5", 0],
        "negative": ["6", 0],
        "latent_image": ["7", 0]
      }
    },
    "10": {
      "class_type": "VAEDecode",
      "inputs": { "samples": ["9", 0], "vae": ["1", 2] }
    },
    "11": {
      "class_type": "SaveImage",
      "inputs": { "filename_prefix": `Elena_Masturbation_${poseConfig.name}`, "images": ["10", 0] }
    }
  };
}

async function waitForCompletionPolling(promptId, maxWaitMs = 600000) {
  const startTime = Date.now();
  const pollInterval = 5000;
  
  while (Date.now() - startTime < maxWaitMs) {
    try {
      const history = await getHistory(promptId);
      if (history[promptId]) {
        const result = history[promptId];
        if (result.outputs && Object.keys(result.outputs).length > 0) {
          return result;
        }
        if (result.status?.status_str === 'error') {
          throw new Error(`Generation failed`);
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
  throw new Error(`Timeout`);
}

async function main() {
  console.log('============================================================');
  console.log('ELENA MASTURBATION SELFIE BATCH — 4 POSES');
  console.log('============================================================\n');
  
  const status = await checkConnection();
  if (!status.connected) {
    console.error('❌ ComfyUI not accessible');
    process.exit(1);
  }
  console.log(`✅ Connected to ComfyUI ${status.version}\n`);
  
  const results = [];
  
  for (let i = 0; i < POSES.length; i++) {
    const pose = POSES[i];
    const seed = Math.floor(Math.random() * 1000000000);
    
    console.log(`\n[${i + 1}/4] ${pose.name}`);
    console.log(`  Pose: ${pose.pose.split(',')[0]}...`);
    console.log(`  Angle: ${pose.angle.split(',')[0]}...`);
    
    const workflow = buildMasturbationWorkflow(pose, seed);
    const { prompt_id } = await queuePrompt(workflow);
    
    const startTime = Date.now();
    try {
      const result = await waitForCompletionPolling(prompt_id);
      const duration = Math.round((Date.now() - startTime) / 1000);
      
      const outputs = result.outputs;
      const saveNode = Object.values(outputs).find(o => o.images);
      
      if (saveNode && saveNode.images.length) {
        const image = saveNode.images[0];
        const filepath = path.join(OUTPUT_DIR, image.subfolder || '', image.filename);
        console.log(`\n  ✅ Done (${duration}s) → ${image.filename}`);
        results.push({ pose: pose.name, file: filepath, success: true });
      }
    } catch (error) {
      console.log(`\n  ❌ Failed: ${error.message}`);
      results.push({ pose: pose.name, success: false });
    }
  }
  
  console.log('\n\n============================================================');
  console.log('BATCH COMPLETE');
  console.log('============================================================');
  console.log(`\nResults:`);
  results.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.pose}: ${r.success ? '✅' : '❌'}`);
  });
  console.log(`\nImages saved to: ${OUTPUT_DIR}`);
}

main().catch(console.error);
