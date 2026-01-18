/**
 * ComfyUI API Client
 * 
 * Provides functions to interact with local ComfyUI instance.
 * Base URL: http://127.0.0.1:8188
 * 
 * Usage:
 *   node app/scripts/comfyui-api.mjs --test          # Test connection
 *   node app/scripts/comfyui-api.mjs --generate      # Run test generation
 *   node app/scripts/comfyui-api.mjs --status        # Check queue status
 */

import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import WebSocket from 'ws';

const COMFYUI_URL = 'http://127.0.0.1:8188';
const OUTPUT_DIR = path.join(process.env.HOME, 'ComfyUI/output');

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Check if ComfyUI is running and accessible
 */
export async function checkConnection() {
  try {
    const res = await fetch(`${COMFYUI_URL}/system_stats`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      connected: true,
      version: data.system.comfyui_version,
      device: data.devices[0]?.type || 'unknown',
      ramFree: Math.round(data.system.ram_free / 1024 / 1024 / 1024 * 10) / 10,
      ramTotal: Math.round(data.system.ram_total / 1024 / 1024 / 1024 * 10) / 10,
    };
  } catch (error) {
    return { connected: false, error: error.message };
  }
}

/**
 * Get current queue status
 */
export async function getQueueStatus() {
  const res = await fetch(`${COMFYUI_URL}/queue`);
  const data = await res.json();
  return {
    running: data.queue_running.length,
    pending: data.queue_pending.length,
  };
}

/**
 * Get generation history
 */
export async function getHistory(promptId = null) {
  const url = promptId 
    ? `${COMFYUI_URL}/history/${promptId}`
    : `${COMFYUI_URL}/history`;
  const res = await fetch(url);
  return res.json();
}

/**
 * Queue a prompt for generation
 * @param {Object} workflow - The workflow in ComfyUI API format
 * @returns {Object} - { prompt_id, number, node_errors }
 */
export async function queuePrompt(workflow) {
  const clientId = randomUUID();
  
  const res = await fetch(`${COMFYUI_URL}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: workflow,
      client_id: clientId,
    }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Queue failed: ${JSON.stringify(error)}`);
  }
  
  return res.json();
}

/**
 * Wait for a prompt to complete using WebSocket
 * @param {string} promptId - The prompt ID to wait for
 * @param {Function} onProgress - Optional callback for progress updates
 * @returns {Promise<Object>} - The completed generation result
 */
export async function waitForCompletion(promptId, onProgress = null) {
  return new Promise((resolve, reject) => {
    const clientId = randomUUID();
    const ws = new WebSocket(`ws://127.0.0.1:8188/ws?clientId=${clientId}`);
    
    let timeout = setTimeout(() => {
      ws.close();
      reject(new Error('Generation timeout (10 minutes)'));
    }, 10 * 60 * 1000);
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'progress' && onProgress) {
          onProgress({
            node: message.data.node,
            value: message.data.value,
            max: message.data.max,
          });
        }
        
        if (message.type === 'executing' && message.data.node === null) {
          // Generation complete
          clearTimeout(timeout);
          ws.close();
          
          // Fetch the result
          const history = await getHistory(promptId);
          resolve(history[promptId]);
        }
        
        if (message.type === 'execution_error') {
          clearTimeout(timeout);
          ws.close();
          reject(new Error(`Execution error: ${JSON.stringify(message.data)}`));
        }
      } catch (e) {
        // Ignore parse errors for binary data
      }
    });
    
    ws.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

/**
 * Download a generated image
 * @param {string} filename - The filename from generation output
 * @param {string} subfolder - Optional subfolder
 * @param {string} type - 'output' or 'temp'
 */
export async function downloadImage(filename, subfolder = '', type = 'output') {
  const params = new URLSearchParams({ filename, subfolder, type });
  const res = await fetch(`${COMFYUI_URL}/view?${params}`);
  
  if (!res.ok) throw new Error(`Failed to download: ${res.status}`);
  
  return res.arrayBuffer();
}

/**
 * Save image to local file
 */
export async function saveImage(filename, destPath, subfolder = '', type = 'output') {
  const buffer = await downloadImage(filename, subfolder, type);
  fs.writeFileSync(destPath, Buffer.from(buffer));
  return destPath;
}

/**
 * Get list of available checkpoints
 */
export async function getCheckpoints() {
  const res = await fetch(`${COMFYUI_URL}/object_info/CheckpointLoaderSimple`);
  const data = await res.json();
  return data.CheckpointLoaderSimple.input.required.ckpt_name[0];
}

/**
 * Get list of available LoRAs
 */
export async function getLoras() {
  const res = await fetch(`${COMFYUI_URL}/object_info/LoraLoader`);
  const data = await res.json();
  return data.LoraLoader.input.required.lora_name[0];
}

// ============================================================================
// WORKFLOW BUILDERS
// ============================================================================

/**
 * Build a basic txt2img workflow for Big Lust
 * This is the Checkpoint 1 baseline workflow
 */
export function buildBigLustWorkflow(options = {}) {
  const {
    positive = 'masterpiece, best quality, photorealistic, beautiful woman',
    negative = 'worst quality, low quality, blurry, cartoon, anime',
    width = 1024,
    height = 1024,
    steps = 30,
    cfg = 3.5,
    seed = Math.floor(Math.random() * 1000000000),
    checkpoint = 'bigLust_v16.safetensors',
    filenamePrefix = 'ComfyUI_BigLust',
  } = options;
  
  return {
    // Node 1: Checkpoint Loader
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": {
        "ckpt_name": checkpoint
      }
    },
    // Node 2: CLIP Text Encode (Positive)
    "2": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": positive,
        "clip": ["1", 1]
      }
    },
    // Node 3: CLIP Text Encode (Negative)
    "3": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": negative,
        "clip": ["1", 1]
      }
    },
    // Node 4: Empty Latent Image
    "4": {
      "class_type": "EmptyLatentImage",
      "inputs": {
        "width": width,
        "height": height,
        "batch_size": 1
      }
    },
    // Node 5: KSampler
    "5": {
      "class_type": "KSampler",
      "inputs": {
        "seed": seed,
        "steps": steps,
        "cfg": cfg,
        "sampler_name": "dpmpp_2m_sde",
        "scheduler": "karras",
        "denoise": 1.0,
        "model": ["1", 0],
        "positive": ["2", 0],
        "negative": ["3", 0],
        "latent_image": ["4", 0]
      }
    },
    // Node 6: VAE Decode
    "6": {
      "class_type": "VAEDecode",
      "inputs": {
        "samples": ["5", 0],
        "vae": ["1", 2]
      }
    },
    // Node 7: Save Image
    "7": {
      "class_type": "SaveImage",
      "inputs": {
        "filename_prefix": filenamePrefix,
        "images": ["6", 0]
      }
    }
  };
}

/**
 * Generate an image with Big Lust and wait for completion
 * @returns {Promise<{filename: string, filepath: string}>}
 */
export async function generateBigLust(options = {}) {
  const workflow = buildBigLustWorkflow(options);
  
  console.log('Queueing prompt...');
  const { prompt_id } = await queuePrompt(workflow);
  console.log(`Prompt ID: ${prompt_id}`);
  
  console.log('Waiting for generation...');
  const result = await waitForCompletion(prompt_id, (progress) => {
    const pct = Math.round((progress.value / progress.max) * 100);
    process.stdout.write(`\rProgress: ${pct}% (${progress.value}/${progress.max})`);
  });
  console.log('\nGeneration complete!');
  
  // Get output filename
  const outputs = result.outputs;
  const saveNode = Object.values(outputs).find(o => o.images);
  
  if (!saveNode || !saveNode.images.length) {
    throw new Error('No images in output');
  }
  
  const image = saveNode.images[0];
  const filepath = path.join(OUTPUT_DIR, image.subfolder || '', image.filename);
  
  return {
    filename: image.filename,
    filepath,
    promptId: prompt_id,
  };
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--test') || args.includes('-t')) {
    console.log('Testing ComfyUI connection...\n');
    
    const status = await checkConnection();
    if (!status.connected) {
      console.error('❌ ComfyUI not accessible:', status.error);
      console.log('\nMake sure ComfyUI is running:');
      console.log('  cd ~/ComfyUI && source venv/bin/activate && python main.py --force-fp16');
      process.exit(1);
    }
    
    console.log('✅ ComfyUI Connected');
    console.log(`   Version: ${status.version}`);
    console.log(`   Device: ${status.device}`);
    console.log(`   RAM: ${status.ramFree}GB free / ${status.ramTotal}GB total`);
    
    const queue = await getQueueStatus();
    console.log(`   Queue: ${queue.running} running, ${queue.pending} pending`);
    
    const checkpoints = await getCheckpoints();
    console.log(`\n📦 Available Checkpoints (${checkpoints.length}):`);
    checkpoints.slice(0, 5).forEach(c => console.log(`   - ${c}`));
    if (checkpoints.length > 5) console.log(`   ... and ${checkpoints.length - 5} more`);
    
    return;
  }
  
  if (args.includes('--status') || args.includes('-s')) {
    const status = await checkConnection();
    if (!status.connected) {
      console.error('❌ ComfyUI not accessible');
      process.exit(1);
    }
    
    const queue = await getQueueStatus();
    console.log(`Queue: ${queue.running} running, ${queue.pending} pending`);
    
    if (queue.running > 0 || queue.pending > 0) {
      const history = await getHistory();
      const recent = Object.entries(history).slice(-3);
      console.log('\nRecent generations:');
      recent.forEach(([id, data]) => {
        const status = data.status?.status_str || 'unknown';
        console.log(`  ${id.slice(0, 8)}... - ${status}`);
      });
    }
    return;
  }
  
  if (args.includes('--generate') || args.includes('-g')) {
    console.log('🎨 Running test generation with Big Lust...\n');
    
    const status = await checkConnection();
    if (!status.connected) {
      console.error('❌ ComfyUI not accessible');
      process.exit(1);
    }
    
    const result = await generateBigLust({
      positive: `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
24 year old Italian woman, soft round pleasant face with gentle smile,
honey brown warm eyes, bronde hair dark roots golden blonde balayage long beach waves,
very large natural F-cup breasts, narrow waist, wide hips, feminine shapely body,
wearing black lace lingerie, sitting on luxurious bed,
glowing sun-kissed skin natural texture, small beauty mark on right cheekbone,
gold layered necklaces,
soft warm bedroom lighting, elegant boudoir setting,
shot on Canon EOS 5D, shallow depth of field,
r/gonewild style, amateur photo`,
      negative: `angular face, sharp jawline, skinny body, flat chest, small breasts,
A-cup, B-cup, C-cup, D-cup,
worst quality, low quality, blurry, cartoon, anime, illustration,
bad anatomy, bad hands, extra fingers, deformed,
watermark, censored, mosaic, plastic skin, male, man`,
      filenamePrefix: 'API_Test_BigLust',
    });
    
    console.log(`\n✅ Image saved: ${result.filepath}`);
    console.log(`   Filename: ${result.filename}`);
    return;
  }
  
  // Default: show help
  console.log(`
ComfyUI API Client
==================

Commands:
  --test, -t      Test connection and show system info
  --status, -s    Show queue status
  --generate, -g  Run a test generation with Big Lust

Examples:
  node app/scripts/comfyui-api.mjs --test
  node app/scripts/comfyui-api.mjs --generate

API Usage (import in other scripts):
  import { generateBigLust, queuePrompt, checkConnection } from './comfyui-api.mjs';
  
  // Simple generation
  const result = await generateBigLust({ positive: '...', negative: '...' });
  
  // Custom workflow
  const workflow = buildBigLustWorkflow({ ... });
  const { prompt_id } = await queuePrompt(workflow);
  const result = await waitForCompletion(prompt_id);
`);
}

main().catch(console.error);
