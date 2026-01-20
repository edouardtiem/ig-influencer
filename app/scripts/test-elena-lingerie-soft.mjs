/**
 * Elena Lingerie Soft - Landing Page Test
 * 
 * Generates elegant lingerie photos for a softer landing page
 * - Suggestive but not explicit
 * - Premium/luxury aesthetic
 * - More teasing, less hardcore
 * 
 * Run: node app/scripts/test-elena-lingerie-soft.mjs
 */

import { queuePrompt, getHistory, checkConnection } from './comfyui-api.mjs';

// Elena body description - consistent with other scripts
const ELENA_BODY = `fit athletic toned body, natural breasts, soft natural breast shape, full C-cup breasts with natural sag, realistic breast tissue, defined slim waist, toned stomach, smooth skin, natural skin texture, glowing sun-kissed skin`;

// Negative prompt for soft/elegant content
const BASE_NEGATIVE = `nude, naked, exposed nipples, exposed pussy, explicit, pornographic,
fake breasts, breast implants, silicone breasts, bolt-on breasts,
flat chest, small breasts, A-cup, B-cup,
worst quality, low quality, blurry, cartoon, anime, illustration,
bad anatomy, bad hands, extra fingers, deformed, mutated,
watermark, censored, mosaic, plastic skin,
male, man, men, penis, cock, couple, two people, sex, penetration,
cheap, trashy, slutty, vulgar`;

// Soft/elegant lingerie prompts
const PROMPTS = [
  {
    name: "Silk_Robe_Morning",
    positive: `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
young woman, ${ELENA_BODY},
wearing elegant cream silk robe loosely tied, matching silk camisole underneath, delicate lace trim,
standing by window, soft morning light, peaceful expression, looking away from camera,
luxurious Parisian apartment, sheer curtains, golden hour light,
gold layered necklaces, messy bed hair,
intimate but tasteful, boudoir photography, shallow depth of field`,
    negative: `${BASE_NEGATIVE}, outdoor, harsh lighting, fully dressed`
  },
  {
    name: "Black_Lace_Elegant",
    positive: `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
young woman, ${ELENA_BODY},
wearing elegant black lace bodysuit, delicate floral lace pattern, tasteful coverage,
sitting on edge of bed, one hand in hair, confident elegant pose, soft smile,
luxury hotel suite, white bedding, warm ambient lighting,
gold layered necklaces, gold bracelet,
classy boudoir photography, soft focus, intimate atmosphere`,
    negative: `${BASE_NEGATIVE}, outdoor, explicit pose, spread legs`
  },
  {
    name: "White_Lingerie_Mirror",
    positive: `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
young woman, ${ELENA_BODY},
wearing white bridal-style lingerie set, delicate lace bralette and high-waisted panties,
standing in front of full length mirror, back partially to camera, looking over shoulder,
luxury boutique hotel bathroom, soft diffused lighting, marble surfaces,
gold layered necklaces,
elegant sensual pose, artistic photography, tasteful teasing`,
    negative: `${BASE_NEGATIVE}, explicit, vulgar, cheap lingerie`
  },
  {
    name: "Satin_Slip_Bed",
    positive: `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
young woman, ${ELENA_BODY},
wearing dusty rose satin slip dress, thin straps, knee length, elegant cut,
lying on luxury bed, silk sheets, relaxed pose, peaceful expression, eyes closed,
soft morning light through curtains, dreamy atmosphere,
gold layered necklaces,
intimate lifestyle photography, soft aesthetic, premium vibe`,
    negative: `${BASE_NEGATIVE}, outdoor, standing, explicit pose`
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
    
    await new Promise(r => setTimeout(r, 3000));
  }
  
  throw new Error(`Timeout waiting for prompt ${promptId}`);
}

async function main() {
  console.log('🎀 Elena Lingerie Soft - Landing Page Test');
  console.log('==========================================\n');

  // Check ComfyUI connection
  const status = await checkConnection();
  if (!status.connected) {
    console.error('❌ ComfyUI is not running!');
    console.error('Start it with: cd ~/ComfyUI && python main.py');
    process.exit(1);
  }
  console.log('✅ ComfyUI connected\n');

  // Generate just the first 2 prompts as a test
  const testPrompts = PROMPTS.slice(0, 2);
  const results = [];

  for (let i = 0; i < testPrompts.length; i++) {
    const prompt = testPrompts[i];
    const seed = Math.floor(Math.random() * 1000000000);
    const filenamePrefix = `Elena_Lingerie_Soft_${prompt.name}`;

    console.log(`\n📸 [${i + 1}/${testPrompts.length}] Generating: ${prompt.name}`);
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

  console.log('\n==========================================');
  console.log('📊 RESULTS');
  console.log('==========================================');
  console.log(`Success: ${results.filter(r => r.success).length}/${testPrompts.length}`);
  
  console.log('\nGenerated files:');
  results.filter(r => r.success).forEach(r => {
    console.log(`  ✅ ~/ComfyUI/output/${r.filename}`);
  });

  console.log('\n💡 These are SOFT/ELEGANT images for a premium landing page.');
  console.log('   Compare with your current hardcore images to see the difference.');
  console.log('\n   open ~/ComfyUI/output/');
}

main().catch(console.error);
