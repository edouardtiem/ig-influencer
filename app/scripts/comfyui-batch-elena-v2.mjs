/**
 * Elena Batch Generation Script V2 (Polling-based)
 * 
 * More robust version using polling instead of WebSocket.
 * Generates 10 images with different poses using Big Lust via ComfyUI API.
 */

import fs from 'fs';
import path from 'path';

const COMFYUI_URL = 'http://127.0.0.1:8188';
const OUTPUT_DIR = path.join(process.env.HOME, 'ComfyUI/output');

// ============================================================================
// ELENA PROMPTS - 10 DIFFERENT POSES
// ============================================================================

const ELENA_BASE = `24 year old Italian woman named Elena,
honey brown warm eyes, bronde hair with dark roots and golden blonde balayage, long voluminous beach waves,
small beauty mark on right cheekbone,
very large natural F-cup breasts, narrow waist, wide hips,
glowing sun-kissed skin natural texture,
gold layered necklaces with medallion pendant, gold chunky bracelet`;

const NEGATIVE_PROMPT = `visible face, clear face, full face visible, face in frame,
angular face, sharp jawline, skinny body, flat chest, small breasts,
A-cup, B-cup, C-cup, D-cup, curvy,
worst quality, low quality, blurry, cartoon, anime, illustration,
bad anatomy, bad hands, extra fingers, deformed,
watermark, censored, mosaic, plastic skin,
male, man, penis, cock`;

const POSES = [
  {
    name: "02_bed_topless_arm_cover",
    positive: `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
${ELENA_BASE},
face hidden behind raised arm, arm covering face seductively,
topless, breasts exposed, nipples visible, wearing only white lace panties,
lying on white silk bed sheets, one knee bent,
soft warm bedroom lighting, intimate boudoir,
shot on Canon EOS R5, shallow depth of field, amateur photo`,
  },
  {
    name: "03_shower_back_turned",
    positive: `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
${ELENA_BASE},
face turned away from camera, back of head visible, looking over shoulder,
fully nude in luxury shower, water droplets on skin, wet hair,
hands pressed against glass shower door, arched back showing curves,
steam and soft diffused lighting,
shot on Canon EOS 5D, amateur bathroom selfie style`,
  },
  {
    name: "04_explicit_legs_spread_cropped",
    positive: `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
${ELENA_BASE},
face cropped out of frame, head cut off at top of image,
lying on bed, legs spread wide open, explicit pose,
completely nude, pussy visible, detailed anatomy, uncensored,
white silk sheets, soft morning light,
shot on Canon EOS R5, intimate amateur photo, r/gonewild style`,
  },
  {
    name: "05_masturbation_hair_cover",
    positive: `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
${ELENA_BASE},
hair falling over face, face obscured by hair,
nude on bed, one hand between legs, touching herself, masturbation pose,
back arched in pleasure, eyes closed behind hair,
luxurious bedroom, warm ambient lighting,
shot on Canon EOS 5D, amateur intimate photo`,
  },
  {
    name: "06_doggy_position_face_down",
    positive: `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
${ELENA_BASE},
face buried in pillow, face not visible,
on all fours doggy style position, ass up, back arched,
completely nude, pussy visible from behind, explicit rear view,
white bed sheets, soft lighting from side,
shot on Canon EOS R5, amateur bedroom photo`,
  },
  {
    name: "07_bathtub_phone_selfie",
    positive: `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
${ELENA_BASE},
face hidden by smartphone taking selfie, phone covering face,
in luxury bathtub with bubbles, breasts partially visible above water,
wet skin glistening, rose petals floating,
marble bathroom, soft candle lighting,
shot on iPhone, amateur bath selfie`,
  },
  {
    name: "08_riding_position_back_view",
    positive: `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
${ELENA_BASE},
back to camera, face not visible, looking down,
sitting position, knees on bed, back arched, ass prominent,
completely nude, explicit pose from behind,
luxurious hotel bedroom, soft warm lighting,
shot on Canon EOS 5D, intimate amateur style`,
  },
  {
    name: "09_standing_mirror_nude",
    positive: `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
${ELENA_BASE},
face hidden by smartphone taking mirror selfie,
standing fully nude in front of full length mirror, frontal view,
breasts and pussy visible, uncensored, explicit full body,
elegant bedroom with natural light,
shot on iPhone, amateur mirror selfie, r/gonewild style`,
  },
  {
    name: "10_toy_play_face_cropped",
    positive: `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
${ELENA_BASE},
face partially cropped out of frame,
lying on back, using vibrator, toy between legs, masturbation with toy,
nude, legs spread, explicit pose, uncensored,
white bed sheets, soft intimate lighting,
shot on Canon EOS R5, amateur intimate photo`,
  },
];

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function checkConnection() {
  try {
    const res = await fetch(`${COMFYUI_URL}/system_stats`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { connected: true, version: data.system.comfyui_version };
  } catch (error) {
    return { connected: false, error: error.message };
  }
}

async function getQueue() {
  const res = await fetch(`${COMFYUI_URL}/queue`);
  return res.json();
}

async function getHistory(promptId) {
  const res = await fetch(`${COMFYUI_URL}/history/${promptId}`);
  return res.json();
}

async function queuePrompt(workflow) {
  const res = await fetch(`${COMFYUI_URL}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Queue failed: ${JSON.stringify(error)}`);
  }
  return res.json();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForCompletion(promptId, timeoutMs = 600000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    // Check if still in queue
    const queue = await getQueue();
    const inQueue = queue.queue_running.some(q => q[1] === promptId) ||
                    queue.queue_pending.some(q => q[1] === promptId);
    
    if (!inQueue) {
      // Check history for result
      const history = await getHistory(promptId);
      if (history[promptId]) {
        return history[promptId];
      }
    }
    
    // Wait before polling again
    await sleep(2000);
    process.stdout.write('.');
  }
  
  throw new Error('Generation timeout');
}

function buildWorkflow(positive, negative, filenamePrefix) {
  const seed = Math.floor(Math.random() * 1000000000);
  
  return {
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": { "ckpt_name": "bigLust_v16.safetensors" }
    },
    "2": {
      "class_type": "CLIPTextEncode",
      "inputs": { "text": positive, "clip": ["1", 1] }
    },
    "3": {
      "class_type": "CLIPTextEncode",
      "inputs": { "text": negative, "clip": ["1", 1] }
    },
    "4": {
      "class_type": "EmptyLatentImage",
      "inputs": { "width": 1024, "height": 1024, "batch_size": 1 }
    },
    "5": {
      "class_type": "KSampler",
      "inputs": {
        "seed": seed,
        "steps": 30,
        "cfg": 3.5,
        "sampler_name": "dpmpp_2m_sde",
        "scheduler": "karras",
        "denoise": 1.0,
        "model": ["1", 0],
        "positive": ["2", 0],
        "negative": ["3", 0],
        "latent_image": ["4", 0]
      }
    },
    "6": {
      "class_type": "VAEDecode",
      "inputs": { "samples": ["5", 0], "vae": ["1", 2] }
    },
    "7": {
      "class_type": "SaveImage",
      "inputs": { "filename_prefix": filenamePrefix, "images": ["6", 0] }
    }
  };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('='.repeat(60));
  console.log('ELENA BATCH GENERATION V2 - 9 REMAINING POSES');
  console.log('='.repeat(60));
  console.log(`Started: ${new Date().toISOString()}\n`);
  
  // Check connection
  const status = await checkConnection();
  if (!status.connected) {
    console.error('❌ ComfyUI not accessible:', status.error);
    process.exit(1);
  }
  console.log(`✅ Connected to ComfyUI ${status.version}\n`);
  
  const results = [];
  
  for (let i = 0; i < POSES.length; i++) {
    const pose = POSES[i];
    console.log('-'.repeat(60));
    console.log(`[${i + 1}/${POSES.length}] Generating: ${pose.name}`);
    
    try {
      const workflow = buildWorkflow(pose.positive, NEGATIVE_PROMPT, `Elena_${pose.name}`);
      const { prompt_id } = await queuePrompt(workflow);
      console.log(`Queued: ${prompt_id.slice(0, 8)}...`);
      
      const startTime = Date.now();
      process.stdout.write('Generating');
      
      const result = await waitForCompletion(prompt_id);
      
      const duration = Math.round((Date.now() - startTime) / 1000);
      console.log(` Done! (${duration}s)`);
      
      // Get output filename
      const outputs = result.outputs;
      const saveNode = Object.values(outputs).find(o => o.images);
      
      if (saveNode && saveNode.images.length > 0) {
        const image = saveNode.images[0];
        const filepath = path.join(OUTPUT_DIR, image.subfolder || '', image.filename);
        console.log(`📁 ${image.filename}`);
        
        results.push({
          name: pose.name,
          filename: image.filename,
          filepath,
          duration,
          success: true,
        });
      }
    } catch (error) {
      console.error(`\n❌ Failed: ${error.message}`);
      results.push({ name: pose.name, success: false, error: error.message });
    }
    
    console.log('');
  }
  
  // Summary
  console.log('='.repeat(60));
  console.log('COMPLETE');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  console.log(`\n✅ Generated: ${successful.length}/${results.length} images`);
  
  console.log('\nFiles:');
  successful.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.filename}`);
  });
  
  console.log(`\n📁 Output: ${OUTPUT_DIR}`);
  console.log(`Finished: ${new Date().toISOString()}`);
  
  // Save log
  const logPath = path.join(OUTPUT_DIR, `elena_batch_v2_${Date.now()}.json`);
  fs.writeFileSync(logPath, JSON.stringify(results, null, 2));
  console.log(`📄 Log: ${logPath}`);
}

main().catch(console.error);
