/**
 * Elena Nude Batch Generation
 * 
 * 5 images with varied poses, legs spread, luxury hotel room
 * 
 * Usage:
 *   node app/scripts/batch-elena-nude.mjs
 */

import { queuePrompt, getHistory, checkConnection } from './comfyui-api.mjs';
import path from 'path';

const OUTPUT_DIR = path.join(process.env.HOME, 'ComfyUI/output');

const POSES = [
  {
    name: 'POV_from_above',
    pose: `lying on back on white bed, legs spread wide open, knees bent up,
POV shot from above, looking up at camera with seductive eyes,
arms above head on pillow, arching back slightly`,
    angle: 'POV from above, birds eye view angle'
  },
  {
    name: 'sitting_edge_bed',
    pose: `sitting on edge of luxury bed, legs spread wide apart,
leaning back on hands, chest pushed forward,
looking over shoulder at camera, teasing smile`,
    angle: 'shot from front low angle, between her legs perspective'
  },
  {
    name: 'on_knees_spread',
    pose: `kneeling on bed with knees spread wide apart,
sitting back on heels, hands on thighs,
upper body leaning slightly forward, sensual pose`,
    angle: 'front view, slightly low angle'
  },
  {
    name: 'lying_side_leg_up',
    pose: `lying on side on silk sheets, one leg raised high,
legs spread showing pussy, supporting head with one hand,
sultry bedroom eyes, relaxed seductive pose`,
    angle: 'shot from front, eye level with body'
  },
  {
    name: 'doggy_looking_back',
    pose: `on all fours on bed, ass up, looking back over shoulder,
legs apart, back arched, inviting pose,
playful seductive expression`,
    angle: 'shot from behind and slightly to the side, low angle'
  }
];

function buildNudeWorkflow(poseConfig, seed) {
  const positive = `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
24 year old Italian woman named Elena,
honey brown warm eyes, bronde hair with dark roots and golden blonde balayage, long voluminous beach waves,
small beauty mark on right cheekbone,
fit athletic toned body, large natural breasts, D-cup, defined slim waist, toned stomach, smooth skin,
completely nude, naked, no clothes, exposed pussy visible,
${poseConfig.pose},
${poseConfig.angle},
luxury hotel room, white bedding, warm ambient lighting, intimate atmosphere,
natural skin texture, soft warm golden hour lighting,
gold layered necklaces with medallion pendant, gold bracelet,
shot on Canon EOS R5, shallow depth of field, professional boudoir photography`;

  const negative = `clothes, dressed, bikini, swimsuit, lingerie, underwear,
flat chest, small breasts, A-cup, B-cup,
mountains, snow, outdoor, pool, beach, public place,
worst quality, low quality, blurry, cartoon, anime, illustration,
bad anatomy, bad hands, extra fingers, deformed, mutated,
watermark, censored, mosaic, plastic skin, oversaturated,
male, man, multiple people`;

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
      "inputs": { "filename_prefix": `Elena_Nude_${poseConfig.name}`, "images": ["10", 0] }
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
  console.log('ELENA NUDE BATCH GENERATION — 5 POSES');
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
    
    console.log(`\n[${i + 1}/5] ${pose.name}`);
    console.log(`  Pose: ${pose.pose.split(',')[0]}...`);
    console.log(`  Angle: ${pose.angle}`);
    
    const workflow = buildNudeWorkflow(pose, seed);
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
