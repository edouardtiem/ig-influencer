/**
 * Elena LoRA Test
 * 
 * Test the newly trained elena_bikini_v1 LoRA
 * with IP-Adapter body reference
 * 
 * Usage:
 *   1. Start ComfyUI: cd ~/ComfyUI && python main.py
 *   2. Run: node app/scripts/test-elena-lora.mjs
 */

import { queuePrompt, getHistory, checkConnection } from './comfyui-api.mjs';
import path from 'path';

const OUTPUT_DIR = path.join(process.env.HOME, 'ComfyUI/output');

/**
 * Build workflow with LoRA + IP-Adapter
 */
function buildLoraWorkflow(options = {}) {
  const {
    positive = 'beautiful woman',
    negative = 'worst quality, low quality',
    width = 832,
    height = 1216,
    steps = 30,
    cfg = 3.5,
    seed = Math.floor(Math.random() * 1000000000),
    checkpoint = 'bigLust_v16.safetensors',
    loraName = 'elena_body_face_v2.safetensors',
    loraStrength = 0.8,  // LoRA strength for body
    faceIdModel = 'faceid.plusv2.sdxl.bin',
    clipVision = 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors',
    faceRefImage = 'elena_face_reference.jpg',
    faceIdWeight = 0.7,  // FaceID weight for face consistency
    filenamePrefix = 'Elena_LoRA_Test',
  } = options;

  return {
    // 1. Load checkpoint
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": { "ckpt_name": checkpoint }
    },
    
    // 2. Load LoRA and apply to model + clip (for body)
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
    
    // 3. IPAdapter FaceID model loader
    "3": {
      "class_type": "IPAdapterModelLoader",
      "inputs": { "ipadapter_file": faceIdModel }
    },
    
    // 4. InsightFace loader (for face analysis)
    "4": {
      "class_type": "IPAdapterInsightFaceLoader",
      "inputs": { "provider": "CPU", "model_name": "antelopev2" }
    },
    
    // 5. Load face reference image
    "5": {
      "class_type": "LoadImage",
      "inputs": { "image": faceRefImage }
    },
    
    // 13. CLIP Vision loader (required for FaceID Plus v2)
    "13": {
      "class_type": "CLIPVisionLoader",
      "inputs": { "clip_name": clipVision }
    },
    
    // 6. Positive prompt - uses LoRA-modified clip
    "6": {
      "class_type": "CLIPTextEncode",
      "inputs": { "text": positive, "clip": ["2", 1] }
    },
    
    // 7. Negative prompt - uses LoRA-modified clip
    "7": {
      "class_type": "CLIPTextEncode",
      "inputs": { "text": negative, "clip": ["2", 1] }
    },
    
    // 8. Empty latent
    "8": {
      "class_type": "EmptyLatentImage",
      "inputs": { "width": width, "height": height, "batch_size": 1 }
    },
    
    // 9. IPAdapter FaceID - applies face from reference to LoRA model
    "9": {
      "class_type": "IPAdapterFaceID",
      "inputs": {
        "model": ["2", 0],  // LoRA model (body)
        "ipadapter": ["3", 0],  // FaceID model
        "image": ["5", 0],  // Face reference
        "insightface": ["4", 0],  // Face analysis
        "clip_vision": ["13", 0],  // CLIP Vision for FaceID Plus v2
        "weight": faceIdWeight,
        "weight_faceidv2": faceIdWeight,
        "weight_type": "linear",
        "combine_embeds": "concat",
        "start_at": 0.0,
        "end_at": 1.0,
        "embeds_scaling": "V only"
      }
    },
    
    // 10. KSampler
    "10": {
      "class_type": "KSampler",
      "inputs": {
        "seed": seed,
        "steps": steps,
        "cfg": cfg,
        "sampler_name": "dpmpp_2m_sde",
        "scheduler": "karras",
        "denoise": 1.0,
        "model": ["9", 0],  // FaceID output (LoRA body + FaceID face)
        "positive": ["6", 0],
        "negative": ["7", 0],
        "latent_image": ["8", 0]
      }
    },
    
    // 11. VAE Decode
    "11": {
      "class_type": "VAEDecode",
      "inputs": { "samples": ["10", 0], "vae": ["1", 2] }
    },
    
    // 12. Save Image
    "12": {
      "class_type": "SaveImage",
      "inputs": { "filename_prefix": filenamePrefix, "images": ["11", 0] }
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
          throw new Error(`Generation failed: ${JSON.stringify(result.status)}`);
        }
      }
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      process.stdout.write(`\rWaiting... ${elapsed}s`);
      await new Promise(r => setTimeout(r, pollInterval));
    } catch (error) {
      if (error.message.includes('Generation failed')) throw error;
      await new Promise(r => setTimeout(r, pollInterval));
    }
  }
  throw new Error(`Timeout after ${maxWaitMs/1000}s`);
}

async function main() {
  console.log('============================================================');
  console.log('ELENA LORA TEST - elena_body_face_v2.safetensors');
  console.log('============================================================\n');
  
  const status = await checkConnection();
  if (!status.connected) {
    console.error('❌ ComfyUI not accessible:', status.error);
    console.error('\n💡 Start ComfyUI first:');
    console.error('   cd ~/ComfyUI && python main.py');
    process.exit(1);
  }
  console.log(`✅ Connected to ComfyUI ${status.version}\n`);
  
  // Test with bikini scene (similar to training data)
  const workflow = buildLoraWorkflow({
    positive: `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
elena, 24 year old Italian woman,
honey brown warm eyes, bronde hair with dark roots and golden blonde balayage, long voluminous beach waves,
small beauty mark on right cheekbone,
fit athletic toned body, full natural breasts, defined slim waist, toned stomach,
wearing white bikini, standing by infinity pool,
tropical villa background, palm trees, blue sky,
natural skin texture, sun-kissed glowing skin,
gold layered necklaces with medallion pendant, gold bracelet,
shot on Canon EOS R5, natural sunlight, vacation photo`,
    negative: `flat chest, tiny breasts, small breasts, huge breasts, enormous breasts,
worst quality, low quality, blurry, cartoon, anime, illustration,
bad anatomy, bad hands, extra fingers, deformed,
watermark, censored, mosaic, plastic skin,
male, man, pale skin`,
    loraStrength: 0.8,  // LoRA for body
    faceIdWeight: 0.7,   // FaceID for face
    filenamePrefix: 'Elena_LoRA_FaceID_Test',
  });
  
  console.log('Queueing LoRA + FaceID test generation...');
  console.log('  - LoRA: elena_body_face_v2.safetensors (body)');
  console.log('  - LoRA Strength: 0.8');
  console.log('  - FaceID: faceid.plusv2.sdxl.bin (face)');
  console.log('  - FaceID Weight: 0.7');
  console.log('  - Scene: Bikini by pool');
  console.log('  - Resolution: 832x1216\n');
  
  const { prompt_id } = await queuePrompt(workflow);
  console.log(`Prompt ID: ${prompt_id}`);
  
  console.log('\nGenerating (this may take 3-5 minutes)...');
  const startTime = Date.now();
  
  try {
    const result = await waitForCompletionPolling(prompt_id);
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log(`\n\n✅ Generation complete! (${duration}s)`);
    
    const outputs = result.outputs;
    const saveNode = Object.values(outputs).find(o => o.images);
    
    if (saveNode && saveNode.images.length) {
      const image = saveNode.images[0];
      const filepath = path.join(OUTPUT_DIR, image.subfolder || '', image.filename);
      console.log(`\n📸 Image saved: ${filepath}`);
      console.log(`\n💡 Open in Finder: open "${OUTPUT_DIR}"`);
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
  
  console.log('\n============================================================');
  console.log('Compare with images WITHOUT LoRA to see the difference!');
  console.log('============================================================');
}

main().catch(console.error);
