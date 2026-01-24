/**
 * Elena Gym Series - Gym, Locker Room, Sauna, Jacuzzi
 * 
 * 8 images total:
 * - 2x gym (workout area)
 * - 2x locker room (vestiaires)
 * - 2x sauna
 * - 2x jacuzzi
 * 
 * Elena wears a coral/salmon pink bikini throughout
 * Sometimes bikini shifted to reveal intimate parts
 * 
 * Usage:
 *   node app/scripts/batch-elena-gym.mjs
 */

import { queuePrompt, getHistory, checkConnection } from './comfyui-api.mjs';
import path from 'path';

const OUTPUT_DIR = path.join(process.env.HOME, 'ComfyUI/output');

const BIKINI_COLOR = 'coral salmon pink';

const POSES = [
  // ===== GYM (2 photos) =====
  {
    name: '01_gym_workout_bench',
    location: 'GYM',
    pose: `sitting on weight bench in gym, legs spread wide apart,
bikini top pulled down below breasts, large natural breasts fully exposed, nipples visible,
${BIKINI_COLOR} bikini bottom still on,
sweaty glistening skin, post-workout look,
holding water bottle, looking down at her body`,
    setting: `modern luxury gym, weight equipment, mirrors, bright lighting,
dumbbells and machines in background, rubber floor mats`
  },
  {
    name: '02_gym_stretching_mat',
    location: 'GYM',
    pose: `lying on yoga mat in gym, doing stretching pose, legs spread in butterfly stretch,
wearing ${BIKINI_COLOR} bikini, bikini bottom pushed to the side revealing pussy,
breasts contained in bikini top but nipples poking through thin fabric,
stretching forward, sweaty skin glistening`,
    setting: `modern gym stretching area, mirrors on walls, exercise equipment,
bright fluorescent lighting, clean modern interior`
  },
  
  // ===== LOCKER ROOM (2 photos) =====
  {
    name: '03_locker_room_bench',
    location: 'LOCKER ROOM',
    pose: `sitting on wooden bench in locker room, legs apart,
topless, breasts fully exposed, large natural D-cup breasts,
${BIKINI_COLOR} bikini bottom on but pulled aside showing pussy,
towel draped over shoulder, wet hair from shower,
leaning back with hands on bench behind her`,
    setting: `luxury gym locker room, wooden benches, metal lockers,
soft lighting, steam in air, clean modern changing room`
  },
  {
    name: '04_locker_room_standing',
    location: 'LOCKER ROOM',
    pose: `standing in front of open locker, ${BIKINI_COLOR} bikini on,
bikini top strings untied, top falling down revealing one breast,
one hand adjusting bikini bottom, pulling it slightly showing hip,
looking to the side, wet hair, post-workout glow`,
    setting: `gym locker room, metal lockers open showing bags and clothes,
wooden bench visible, bright clean lighting, tiled floor`
  },
  
  // ===== SAUNA (2 photos) =====
  {
    name: '05_sauna_lying_bench',
    location: 'SAUNA',
    pose: `lying on wooden sauna bench, completely nude, no bikini,
large natural breasts visible, nipples erect from heat,
legs slightly parted showing pussy, smooth skin,
sweating profusely, beads of sweat on skin,
one arm behind head, eyes closed in relaxation`,
    setting: `wooden Finnish sauna, cedar wood benches, hot stones,
dim warm lighting, steam visible, wooden walls and ceiling`
  },
  {
    name: '06_sauna_sitting_spread',
    location: 'SAUNA',
    pose: `sitting on wooden bench in sauna, back against wall,
${BIKINI_COLOR} bikini, bikini top pulled down exposing both breasts,
legs spread wide open, bikini bottom pushed aside revealing wet pussy,
sweating heavily, glistening wet skin, flushed from heat,
looking down at her own body`,
    setting: `traditional wooden sauna, steam rising, warm amber lighting,
wooden slat benches, thermometer on wall, sauna bucket visible`
  },
  
  // ===== JACUZZI (2 photos) =====
  {
    name: '07_jacuzzi_edge_sitting',
    location: 'JACUZZI',
    pose: `sitting on edge of jacuzzi, feet in bubbling water,
${BIKINI_COLOR} bikini, bikini top undone floating in water, topless,
large breasts exposed, water droplets on skin,
legs spread showing bikini bottom, one hand between legs adjusting bikini,
wet hair slicked back, steamy atmosphere`,
    setting: `luxury spa jacuzzi, bubbling water, jets visible,
tiled surroundings, mood lighting, steam rising from water`
  },
  {
    name: '08_jacuzzi_submerged_reveal',
    location: 'JACUZZI',
    pose: `standing in jacuzzi waist deep in water, facing camera,
${BIKINI_COLOR} bikini completely removed, holding bikini in one hand,
completely nude, breasts above water fully visible,
pussy visible through clear water, bubbles around body,
wet skin glistening, sensual smile, looking at camera`,
    setting: `spa jacuzzi hot tub, bubbling water, underwater lights,
steam rising, luxury spa environment, marble tiles around pool`
  }
];

function buildGymWorkflow(poseConfig, seed) {
  const positive = `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
24 year old Italian woman named Elena,
honey brown warm eyes, bronde hair with dark roots and golden blonde balayage, long hair,
small beauty mark on right cheekbone,
fit athletic toned body, large natural breasts, D-cup, defined slim waist, toned stomach, smooth skin,
${poseConfig.pose},
${poseConfig.setting},
natural skin texture, realistic skin pores, realistic lighting,
gold layered necklaces with medallion pendant,
shot on Canon EOS R5, shallow depth of field, professional photography,
professional photo taken by someone else, not a selfie`;

  const negative = `mirror reflection selfie, phone in hand, holding phone,
flat chest, small breasts, A-cup, B-cup,
outdoor, beach, pool outside, mountains, forest,
worst quality, low quality, blurry, cartoon, anime, illustration,
bad anatomy, bad hands, extra fingers, deformed, mutated,
watermark, censored, mosaic, plastic skin, oversaturated,
male, man, men, penis, cock, couple, two people, sex with partner,
clothes, dress, shirt, pants, jeans, fully clothed`;

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
      "inputs": { "filename_prefix": `Elena_Gym_${poseConfig.name}`, "images": ["10", 0] }
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
  console.log('  ELENA GYM SERIES — Gym, Locker Room, Sauna, Jacuzzi');
  console.log('  8 photos: 2 per location, coral pink bikini theme');
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
  let currentLocation = '';
  
  for (let i = 0; i < POSES.length; i++) {
    const pose = POSES[i];
    const seed = Math.floor(Math.random() * 1000000000);
    
    // Print location header when it changes
    if (pose.location !== currentLocation) {
      currentLocation = pose.location;
      console.log(`\n${'─'.repeat(50)}`);
      console.log(`📍 ${currentLocation}`);
      console.log(`${'─'.repeat(50)}`);
    }
    
    console.log(`\n[${i + 1}/8] ${pose.name}`);
    console.log(`  🎯 ${pose.pose.split(',')[0].trim()}...`);
    
    const workflow = buildGymWorkflow(pose, seed);
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
        results.push({ pose: pose.name, location: pose.location, file: filepath, success: true, duration });
      }
    } catch (error) {
      console.log(`\n  ❌ Failed: ${error.message}`);
      results.push({ pose: pose.name, location: pose.location, success: false });
    }
  }
  
  const totalDuration = Math.round((Date.now() - totalStart) / 1000 / 60);
  
  console.log('\n\n════════════════════════════════════════════════════════════');
  console.log('  BATCH COMPLETE');
  console.log('════════════════════════════════════════════════════════════');
  
  // Summary by location
  const locations = ['GYM', 'LOCKER ROOM', 'SAUNA', 'JACUZZI'];
  for (const loc of locations) {
    const locResults = results.filter(r => r.location === loc);
    const success = locResults.filter(r => r.success).length;
    console.log(`\n📍 ${loc}: ${success}/${locResults.length} images`);
    locResults.forEach(r => {
      const status = r.success ? `✅ ${r.duration}s` : '❌';
      console.log(`   - ${r.pose}: ${status}`);
    });
  }
  
  const successful = results.filter(r => r.success).length;
  console.log(`\n📁 ${successful}/8 images saved to: ${OUTPUT_DIR}`);
  console.log(`⏱️  Total time: ~${totalDuration} minutes`);
  console.log(`\n🔍 View images:`);
  console.log(`   open ~/ComfyUI/output/Elena_Gym_*.png`);
}

main().catch(console.error);
