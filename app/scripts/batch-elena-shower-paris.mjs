/**
 * Elena Shower Masturbation - Paris Haussmannian Bathroom
 * 
 * 10 images: masturbation in shower with fingers and sextoy
 * Location: Paris 8th arrondissement, white Haussmannian bathroom
 * Angles: Someone else takes the photo (not selfie)
 * Face: Hidden/cropped
 * 
 * Usage:
 *   node app/scripts/batch-elena-shower-paris.mjs
 */

import { queuePrompt, getHistory, checkConnection } from './comfyui-api.mjs';
import path from 'path';

const OUTPUT_DIR = path.join(process.env.HOME, 'ComfyUI/output');

const POSES = [
  {
    name: '01_standing_wall_fingers',
    pose: `standing in shower, one hand pressed against white tile wall for support,
other hand between legs, fingers on wet pussy, fingers rubbing clitoris,
water streaming down body, wet hair clinging to shoulders,
head tilted back in pleasure, face turned away from camera, profile view`,
    angle: 'shot from the side, 3/4 angle, photographer standing outside shower'
  },
  {
    name: '02_leaning_glass_sextoy',
    pose: `leaning back against glass shower door, legs slightly apart,
holding pink vibrator between legs, vibrator pressed against pussy,
wet skin glistening, water droplets on body,
head thrown back, face not visible, looking up at ceiling`,
    angle: 'frontal shot from outside shower through glass, steam on glass'
  },
  {
    name: '03_bent_forward_fingers',
    pose: `bent forward in shower, one hand on wall, ass towards camera,
other hand reaching between legs from behind, fingers inside pussy,
water running down back and ass, wet hair falling forward,
face hidden by position, back view`,
    angle: 'shot from behind, low angle looking up at body'
  },
  {
    name: '04_leg_raised_sextoy',
    pose: `standing with one leg raised on shower ledge, knee bent,
holding sleek black dildo, dildo penetrating wet pussy,
water cascading over breasts, wet glistening skin,
face turned to the side, hair covering face`,
    angle: 'shot from 3/4 front angle, full body visible'
  },
  {
    name: '05_sitting_floor_fingers',
    pose: `sitting on white shower floor, back against tile wall,
legs spread wide open, knees bent up,
both hands between legs, fingers spreading pussy lips, two fingers inside,
head tilted back against wall, face partially cropped at top of frame`,
    angle: 'shot from above, looking down at her body, POV of photographer standing'
  },
  {
    name: '06_against_wall_sextoy',
    pose: `pressed against white tile wall, facing wall, ass out,
reaching back with vibrator, vibrator between legs from behind,
water running down back, wet hair stuck to back,
face pressed against tiles, not visible`,
    angle: 'shot from behind and slightly to the side'
  },
  {
    name: '07_squatting_fingers',
    pose: `squatting in shower, thighs spread wide,
one hand on thigh for balance, other hand between legs touching pussy,
fingers on swollen clit, glistening wet aroused pussy visible,
looking down at herself, face hidden by wet hair falling forward`,
    angle: 'frontal shot, low angle from shower floor level'
  },
  {
    name: '08_standing_stream_sextoy',
    pose: `standing directly under shower head, water streaming over face and body,
holding waterproof wand vibrator, pressing vibrator against clit,
eyes closed, mouth slightly open in pleasure, water on face obscuring features,
arms raised slightly, breasts prominent`,
    angle: 'frontal shot, medium close-up on torso and toy'
  },
  {
    name: '09_one_knee_up_fingers',
    pose: `standing with back to wall, one knee raised and foot on wall,
pussy exposed and spread open, fingers deep inside wet pussy,
other hand squeezing breast, pinching nipple,
head back against tiles, face looking up, partially out of frame`,
    angle: 'shot from front, slightly low angle emphasizing open legs'
  },
  {
    name: '10_on_knees_sextoy',
    pose: `on knees in shower, sitting back on heels, thighs spread,
holding realistic dildo, riding dildo, dildo inserted in pussy,
water running down chest between breasts, wet skin,
leaning forward slightly, face cropped out at top of frame`,
    angle: 'frontal shot from photographer kneeling outside shower'
  }
];

function buildShowerWorkflow(poseConfig, seed) {
  const positive = `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
24 year old Italian woman named Elena,
honey brown warm eyes, bronde hair with dark roots and golden blonde balayage, long wet hair,
small beauty mark on right cheekbone,
fit athletic toned body, large natural breasts, D-cup, defined slim waist, toned stomach, smooth skin,
completely nude, naked, no clothes,
solo female masturbation, touching herself alone,
wet skin, water droplets on skin, glistening wet body,
${poseConfig.pose},
${poseConfig.angle},
luxury Parisian Haussmannian apartment bathroom, 8th arrondissement style,
white marble tiles, white shower, bright white clean bathroom, high ceilings,
warm soft lighting, steam, humid atmosphere,
natural skin texture, wet glistening skin,
gold layered necklaces with medallion pendant,
shot on Canon EOS R5, shallow depth of field, intimate boudoir photography,
professional photo taken by someone else, not a selfie`;

  const negative = `mirror, reflection, mirror visible,
selfie, phone in hand, holding phone, self-shot,
dry skin, dry hair,
flat chest, small breasts, A-cup, B-cup,
outdoor, bedroom, pool, beach, mountains,
worst quality, low quality, blurry, cartoon, anime, illustration,
bad anatomy, bad hands, extra fingers, deformed, mutated,
watermark, censored, mosaic, plastic skin, oversaturated,
male, man, men, penis, cock, couple, two people, sex with partner`;

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
      "inputs": { "filename_prefix": `Elena_Shower_Paris_${poseConfig.name}`, "images": ["10", 0] }
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
      process.stdout.write(`\r  ⏳ Generating... ${elapsed}s`);
      await new Promise(r => setTimeout(r, pollInterval));
    } catch (error) {
      if (error.message.includes('Generation failed')) throw error;
      await new Promise(r => setTimeout(r, pollInterval));
    }
  }
  throw new Error(`Timeout`);
}

async function main() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('  ELENA SHOWER MASTURBATION — PARIS HAUSSMANNIAN BATHROOM');
  console.log('  10 poses: fingers + sextoy variations');
  console.log('════════════════════════════════════════════════════════════\n');
  
  const status = await checkConnection();
  if (!status.connected) {
    console.error('❌ ComfyUI not accessible at http://127.0.0.1:8188');
    console.log('\nStart ComfyUI first:');
    console.log('  cd ~/ComfyUI && python main.py');
    process.exit(1);
  }
  console.log(`✅ Connected to ComfyUI ${status.version}`);
  console.log(`   RAM: ${status.ramFree}GB free / ${status.ramTotal}GB total\n`);
  
  const results = [];
  const totalStart = Date.now();
  
  for (let i = 0; i < POSES.length; i++) {
    const pose = POSES[i];
    const seed = Math.floor(Math.random() * 1000000000);
    
    console.log(`\n[${i + 1}/10] ${pose.name}`);
    console.log(`  📍 ${pose.pose.split(',')[0].trim()}...`);
    console.log(`  📷 ${pose.angle.split(',')[0].trim()}...`);
    
    const workflow = buildShowerWorkflow(pose, seed);
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
        results.push({ pose: pose.name, file: filepath, success: true, duration });
      }
    } catch (error) {
      console.log(`\n  ❌ Failed: ${error.message}`);
      results.push({ pose: pose.name, success: false });
    }
  }
  
  const totalDuration = Math.round((Date.now() - totalStart) / 1000 / 60);
  
  console.log('\n\n════════════════════════════════════════════════════════════');
  console.log('  BATCH COMPLETE');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`\n📊 Results:`);
  results.forEach((r, i) => {
    const status = r.success ? `✅ ${r.duration}s` : '❌';
    console.log(`  ${i + 1}. ${r.pose}: ${status}`);
  });
  
  const successful = results.filter(r => r.success).length;
  console.log(`\n📁 ${successful}/10 images saved to: ${OUTPUT_DIR}`);
  console.log(`⏱️  Total time: ~${totalDuration} minutes`);
  console.log(`\n🔍 View images:`);
  console.log(`   open ~/ComfyUI/output/Elena_Shower_Paris_*.png`);
}

main().catch(console.error);
