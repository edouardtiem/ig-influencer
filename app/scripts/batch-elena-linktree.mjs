/**
 * Elena Linktree Gallery Generator
 * 
 * Generates 10 explicit photos for the Linktree page
 * - No face visible (cropped or out of frame)
 * - Various poses and locations
 * - Optimized angles for teasing with emoji overlays
 * 
 * Run: node app/scripts/batch-elena-linktree.mjs
 */

import { queuePrompt, getHistory, checkConnection } from './comfyui-api.mjs';

// Base character description (no face details since we hide it)
// IMPORTANT: Emphasis on NATURAL breasts - soft, realistic shape
const ELENA_BODY = `fit athletic toned body, natural breasts, soft natural breast shape, full C-cup breasts with natural sag, realistic breast tissue, defined slim waist, toned stomach, smooth skin, natural skin texture, glowing sun-kissed skin`;

// Base negative prompt
// IMPORTANT: Exclude fake/implant breasts appearance
const BASE_NEGATIVE = `visible face, clear face, full face visible, face in frame, looking at camera,
fake breasts, breast implants, silicone breasts, bolt-on breasts, plastic surgery, round fake breasts, unnaturally perky breasts, hard round breasts,
flat chest, small breasts, A-cup, B-cup,
worst quality, low quality, blurry, cartoon, anime, illustration,
bad anatomy, bad hands, extra fingers, deformed, mutated,
watermark, censored, mosaic, plastic skin,
male, man, men, penis, cock, couple, two people, sex, penetration`;

// 10 varied prompts for the Linktree gallery
const PROMPTS = [
  {
    name: "Doggy_Hotel",
    positive: `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
young woman, ${ELENA_BODY},
completely nude, naked, no clothes,
on all fours on bed, ass up, looking back over shoulder, face turned away from camera,
arched back, presenting pose, seductive,
luxury hotel room, white bedding, warm ambient lighting, intimate atmosphere,
gold layered necklaces, gold bracelet,
shot from behind and slightly above, shallow depth of field, amateur photo aesthetic`,
    negative: `${BASE_NEGATIVE}, outdoor, pool, beach, mountains`
  },
  {
    name: "Yacht_Back",
    positive: `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
young woman, ${ELENA_BODY},
wearing tiny white string bikini bottom only, topless, breasts exposed,
standing on luxury yacht deck, leaning on railing, back to camera, looking over shoulder,
ocean background, golden hour sunset lighting, wet skin glistening,
gold layered necklaces, gold bracelet,
shot from behind, emphasizing curves, shallow depth of field, professional photography`,
    negative: `${BASE_NEGATIVE}, indoor, bedroom`
  },
  {
    name: "Mirror_Selfie",
    positive: `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
young woman, ${ELENA_BODY},
completely nude, naked,
taking mirror selfie with phone, phone covering face, standing in front of large mirror,
body facing mirror, curves visible in reflection, one hand on hip,
luxury bathroom, white marble, soft lighting,
gold layered necklaces, gold bracelet,
iPhone selfie aesthetic, authentic intimate moment`,
    negative: `${BASE_NEGATIVE}, outdoor`
  },
  {
    name: "Bed_Spread",
    positive: `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
young woman, ${ELENA_BODY},
completely nude, naked, exposed pussy visible,
lying on bed, legs spread wide open, knees bent, hands on thighs,
shot from above looking down at body, face cropped out of frame,
white sheets, soft morning light from window, intimate bedroom,
gold layered necklaces, gold bracelet,
POV shot, first person perspective, amateur photo aesthetic`,
    negative: `${BASE_NEGATIVE}, outdoor, standing`
  },
  {
    name: "Gym_Booty",
    positive: `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
young woman, ${ELENA_BODY},
wearing tiny sports bra and thong workout shorts, ass visible,
bent over in gym, hands on bench, arched back, booty up,
shot from behind and low angle, emphasizing curves and ass,
modern gym interior, mirrors, soft lighting,
athletic pose, sweaty skin glistening,
shot on Canon EOS R5, shallow depth of field`,
    negative: `${BASE_NEGATIVE}, nude, outdoor, beach`
  },
  {
    name: "Shower_Wet",
    positive: `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
young woman, ${ELENA_BODY},
completely nude, naked, wet skin, water droplets,
standing in luxury shower, back against glass, one leg raised,
face tilted up out of frame, hair wet and slicked back,
steam, water running down body, glistening wet skin,
luxury bathroom, marble tiles, soft diffused lighting,
gold necklaces visible, sensual pose`,
    negative: `${BASE_NEGATIVE}, dry skin, outdoor, bedroom`
  },
  {
    name: "Bedroom_Touch",
    positive: `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
young woman, ${ELENA_BODY},
completely nude, naked,
lying on silk sheets, one hand between legs, touching herself,
shot from side angle, body curves emphasized, face cropped out,
luxurious Parisian bedroom, soft warm lighting, intimate atmosphere,
gold layered necklaces, gold bracelet,
sensual pose, solo female, amateur selfie aesthetic`,
    negative: `${BASE_NEGATIVE}, outdoor, standing`
  },
  {
    name: "Lingerie_Kneel",
    positive: `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
young woman, ${ELENA_BODY},
wearing black lace lingerie, sheer bra, thong visible,
kneeling on bed, knees spread apart, hands on thighs, back arched,
shot from low angle in front, body emphasized, face tilted up out of frame,
luxury hotel room, dramatic side lighting, shadows on curves,
gold layered necklaces, gold bracelet,
seductive pose, boudoir photography`,
    negative: `${BASE_NEGATIVE}, nude, outdoor`
  },
  {
    name: "Pool_Side",
    positive: `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
young woman, ${ELENA_BODY},
wearing tiny bikini, wet skin, water droplets,
lying on side by infinity pool, one leg raised, curves emphasized,
back to camera, looking away, tropical sunset background,
golden hour lighting, warm glow on skin,
gold layered necklaces, gold bracelet,
shot from behind, shallow depth of field, professional photography`,
    negative: `${BASE_NEGATIVE}, indoor, bedroom, nude`
  },
  {
    name: "Nude_Standing",
    positive: `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
young woman, ${ELENA_BODY},
completely nude, naked, no clothes,
standing by window, silhouette against light, back partially to camera,
one hand on hip, sensual S-curve pose, body contours visible,
soft morning light through sheer curtains, intimate bedroom,
gold layered necklaces, gold bracelet,
artistic silhouette, boudoir photography, shallow depth of field`,
    negative: `${BASE_NEGATIVE}, outdoor, harsh lighting`
  }
];

function buildWorkflow(positive, negative, seed, filenamePrefix) {
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
      "inputs": { "filename_prefix": filenamePrefix, "images": ["10", 0] }
    }
  };
}

async function waitForCompletion(promptId, timeoutMs = 300000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const history = await getHistory(promptId);
      
      if (history[promptId]?.outputs) {
        const outputs = Object.values(history[promptId].outputs);
        const imageOutput = outputs.find(o => o.images);
        
        if (imageOutput?.images?.[0]) {
          return imageOutput.images[0].filename;
        }
      }
    } catch (error) {
      // Continue polling
    }
    
    await new Promise(r => setTimeout(r, 5000));
  }
  
  throw new Error(`Timeout waiting for prompt ${promptId}`);
}

async function main() {
  console.log('🎨 Elena Linktree Gallery Generator');
  console.log('====================================\n');

  // Check ComfyUI connection
  const status = await checkConnection();
  if (!status.connected) {
    console.error('❌ ComfyUI is not running!');
    console.error('Start it with: cd ~/ComfyUI && python main.py');
    process.exit(1);
  }
  console.log('✅ ComfyUI connected\n');

  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < PROMPTS.length; i++) {
    const prompt = PROMPTS[i];
    const seed = Math.floor(Math.random() * 1000000000);
    const filenamePrefix = `Elena_Linktree_V2_${prompt.name}`;

    console.log(`\n📸 [${i + 1}/${PROMPTS.length}] Generating: ${prompt.name}`);
    console.log(`   Seed: ${seed}`);

    try {
      const workflow = buildWorkflow(prompt.positive, prompt.negative, seed, filenamePrefix);
      const { prompt_id } = await queuePrompt(workflow);
      
      console.log(`   Queued... waiting for completion`);
      
      const filename = await waitForCompletion(prompt_id);
      
      console.log(`   ✅ Done: ~/ComfyUI/output/${filename}`);
      results.push({ name: prompt.name, filename, success: true });
      
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
      results.push({ name: prompt.name, error: error.message, success: false });
    }
  }

  const elapsed = Math.round((Date.now() - startTime) / 1000 / 60);
  
  console.log('\n====================================');
  console.log('📊 SUMMARY');
  console.log('====================================');
  console.log(`Total time: ${elapsed} minutes`);
  console.log(`Success: ${results.filter(r => r.success).length}/${PROMPTS.length}`);
  console.log('\nGenerated files:');
  results.filter(r => r.success).forEach(r => {
    console.log(`  ✅ ~/ComfyUI/output/${r.filename}`);
  });
  
  if (results.some(r => !r.success)) {
    console.log('\nFailed:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  ❌ ${r.name}: ${r.error}`);
    });
  }

  console.log('\n🎉 Done! Check ~/ComfyUI/output/ for your images');
  console.log('Next: Add emojis and copy to public/elena/gallery/');
}

main().catch(console.error);
