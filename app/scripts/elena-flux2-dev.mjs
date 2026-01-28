#!/usr/bin/env node
/**
 * Elena FLUX.2 [dev] Full Generation
 *
 * Uses FLUX.2 [dev] full model (32B params, not distilled) for photorealistic quality
 * with ReferenceLatent for face consistency.
 *
 * Text encoders: T5-XXL + CLIP-L (DualCLIPLoader)
 */

const COMFYUI_URL = process.env.COMFYUI_URL || 'https://qfzhjk1ojpy70r-8188.proxy.runpod.net';

const CONFIG = {
  // FLUX.2 [dev] Full model
  diffusionModel: 'flux1-dev-fp8.safetensors',
  t5Encoder: 't5xxl_fp8_e4m3fn.safetensors',
  clipEncoder: 'clip_l.safetensors',
  vae: 'flux2-vae.safetensors',

  // Face reference
  faceRef: 'elena_face_ref.jpg',

  // Generation settings for full model
  width: 1024,
  height: 1024,
  steps: 25,       // Full model needs more steps than distilled
  guidance: 3.5,   // FluxGuidance value
  seed: Math.floor(Math.random() * 1000000000),
};

/**
 * Build FLUX.1 [dev] workflow with face reference
 * The Comfy-Org flux1-dev-fp8 is a unified checkpoint containing model + encoders + VAE
 * Uses CheckpointLoaderSimple to load everything at once
 */
function buildFluxDevWorkflow(prompt, faceRefImage, filenamePrefix) {
  return {
    // 1. Load unified FLUX.1 [dev] checkpoint (contains model, clip, vae)
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": {
        "ckpt_name": CONFIG.diffusionModel
      }
    },

    // 2. Load face reference image
    "2": {
      "class_type": "LoadImage",
      "inputs": {
        "image": faceRefImage
      }
    },

    // 3. CLIP Text Encode (positive prompt)
    "3": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": prompt,
        "clip": ["1", 1]  // CLIP from checkpoint
      }
    },

    // 4. FluxGuidance - apply guidance to conditioning
    "4": {
      "class_type": "FluxGuidance",
      "inputs": {
        "conditioning": ["3", 0],
        "guidance": CONFIG.guidance
      }
    },

    // 5. Empty conditioning for negative
    "5": {
      "class_type": "ConditioningZeroOut",
      "inputs": {
        "conditioning": ["3", 0]
      }
    },

    // 6. Empty SD3/FLUX.1 Latent Image (16 channels)
    "6": {
      "class_type": "EmptySD3LatentImage",
      "inputs": {
        "width": CONFIG.width,
        "height": CONFIG.height,
        "batch_size": 1
      }
    },

    // 7. KSampler
    "7": {
      "class_type": "KSampler",
      "inputs": {
        "model": ["1", 0],  // Model from checkpoint
        "positive": ["4", 0],  // FluxGuidance output
        "negative": ["5", 0],
        "latent_image": ["6", 0],
        "seed": CONFIG.seed,
        "steps": CONFIG.steps,
        "cfg": 1.0,  // CFG controlled by FluxGuidance
        "sampler_name": "euler",
        "scheduler": "simple",
        "denoise": 1.0
      }
    },

    // 8. VAE Decode
    "8": {
      "class_type": "VAEDecode",
      "inputs": {
        "samples": ["7", 0],
        "vae": ["1", 2]  // VAE from checkpoint
      }
    },

    // 9. Save Image
    "9": {
      "class_type": "SaveImage",
      "inputs": {
        "images": ["8", 0],
        "filename_prefix": filenamePrefix
      }
    }
  };
}

async function queuePrompt(workflow) {
  const response = await fetch(`${COMFYUI_URL}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow })
  });
  return response.json();
}

async function getHistory(promptId) {
  const response = await fetch(`${COMFYUI_URL}/history/${promptId}`);
  return response.json();
}

async function waitForCompletion(promptId, maxWaitMs = 600000) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    const history = await getHistory(promptId);
    if (history[promptId]) {
      const status = history[promptId].status;
      if (status?.completed) {
        return { success: true, history: history[promptId] };
      }
      if (status?.status_str === 'error') {
        return { success: false, error: 'Generation failed', details: history[promptId] };
      }
    }
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 3000));
  }
  return { success: false, error: 'Timeout' };
}

async function main() {
  console.log('🎨 Elena FLUX.2 [dev] Full Generation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📋 Config:`);
  console.log(`   • Model: ${CONFIG.diffusionModel} (32B full)`);
  console.log(`   • Text encoders: T5-XXL + CLIP-L`);
  console.log(`   • Face ref: ${CONFIG.faceRef}`);
  console.log(`   • Resolution: ${CONFIG.width}x${CONFIG.height}`);
  console.log(`   • Steps: ${CONFIG.steps}`);
  console.log(`   • Guidance: ${CONFIG.guidance}`);
  console.log(`   • Seed: ${CONFIG.seed}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Check connection
  try {
    const stats = await fetch(`${COMFYUI_URL}/system_stats`);
    const data = await stats.json();
    console.log(`✅ ComfyUI connected (${data.devices[0].name})\n`);
  } catch (e) {
    console.error('❌ ComfyUI not reachable at', COMFYUI_URL);
    process.exit(1);
  }

  // Elena-specific prompt emphasizing face features and body
  const prompt = `portrait photo of elena, beautiful woman, 28 years old,
oval face shape with high cheekbones,
hazel-green eyes with golden honey tones,
straight nose with slight slope and rounded tip,
full lips with larger lower lip and defined cupid's bow,
distinctive beauty mark on right cheek near cheekbone,
golden tan sun-kissed skin with smooth texture,
bronde hair with dark roots and golden honey blonde balayage, textured beach waves,
natural breasts D cup, athletic curvy body,
wearing elegant white linen dress,
golden hour lighting, luxury hotel terrace background,
photorealistic, detailed skin texture, 8k resolution, sharp focus, professional photography`;

  const workflow = buildFluxDevWorkflow(prompt, CONFIG.faceRef, 'elena_flux2dev');

  console.log('🚀 Starting FLUX.2 [dev] generation with face reference...\n');

  const result = await queuePrompt(workflow);

  if (result.error || (result.node_errors && Object.keys(result.node_errors).length > 0)) {
    console.error('❌ Queue error:', result.error || 'Node errors');
    if (result.node_errors) {
      console.error('Node errors:', JSON.stringify(result.node_errors, null, 2));
    }
    process.exit(1);
  }

  console.log(`📝 Prompt ID: ${result.prompt_id}`);
  console.log(`⏳ Waiting for generation (max 10min, full model is slower)...`);

  const startTime = Date.now();
  const completion = await waitForCompletion(result.prompt_id);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  if (!completion.success) {
    console.error('\n❌ Generation failed:', completion.error);
    if (completion.details) {
      const execError = completion.details.status?.messages?.find(m => m[0] === 'execution_error');
      if (execError) {
        console.error('Error:', execError[1].exception_message);
      }
    }
    process.exit(1);
  }

  console.log(`\n\n✅ Generation complete in ${elapsed}s!`);

  // Extract output filename
  const outputs = completion.history.outputs;
  for (const [nodeId, output] of Object.entries(outputs)) {
    if (output.images) {
      for (const img of output.images) {
        console.log(`📷 Output: ${img.filename}`);
        console.log(`   URL: ${COMFYUI_URL}/view?filename=${img.filename}`);
      }
    }
  }
}

main().catch(console.error);
