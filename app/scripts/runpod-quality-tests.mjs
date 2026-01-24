#!/usr/bin/env node
/**
 * RunPod Quality Tests Script
 * 
 * Automates quality testing on RunPod with GPU:
 * - Test A: Upscale (4x-UltraSharp)
 * - Test B: Face restoration (CodeFormer via FaceDetailer)
 * - Test C: Upscale + Face restoration
 * - Test D: High-res generation with sharp prompt
 * 
 * Usage:
 *   node app/scripts/runpod-quality-tests.mjs create         # Create pod + setup
 *   node app/scripts/runpod-quality-tests.mjs status         # Check pod status
 *   node app/scripts/runpod-quality-tests.mjs setup          # Setup ComfyUI on existing pod
 *   node app/scripts/runpod-quality-tests.mjs upload <image> # Upload test image
 *   node app/scripts/runpod-quality-tests.mjs test-upscale   # Run upscale test (A)
 *   node app/scripts/runpod-quality-tests.mjs test-face      # Run face restoration (B)
 *   node app/scripts/runpod-quality-tests.mjs test-both      # Run upscale+face (C)
 *   node app/scripts/runpod-quality-tests.mjs test-highres   # Run high-res gen (D)
 *   node app/scripts/runpod-quality-tests.mjs test-all       # Run all tests
 *   node app/scripts/runpod-quality-tests.mjs download       # Download results
 *   node app/scripts/runpod-quality-tests.mjs stop           # Stop pod (keeps data)
 *   node app/scripts/runpod-quality-tests.mjs resume <id>    # Resume stopped pod
 *   node app/scripts/runpod-quality-tests.mjs terminate      # Terminate pod (deletes data)
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
const GRAPHQL_URL = 'https://api.runpod.io/graphql';
const OUTPUT_DIR = path.join(__dirname, '../../output/runpod-quality-tests');

// Pod configuration
const CONFIG = {
  gpuTypeId: 'NVIDIA GeForce RTX 4090',
  gpuCount: 1,
  volumeInGb: 50,
  containerDiskInGb: 40,
  imageName: 'runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel-ubuntu22.04',
  podName: 'elena-quality-tests',
  comfyuiPort: 8188,
  sshKeyPath: path.join(process.env.HOME, '.runpod/ssh/RunPod-Key-Go'),
};

// ============================================================================
// RUNPOD API
// ============================================================================

async function runpodQuery(query, variables = {}) {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RUNPOD_API_KEY}`
    },
    body: JSON.stringify({ query, variables })
  });
  
  const result = await response.json();
  if (result.errors) {
    console.error('GraphQL Errors:', JSON.stringify(result.errors, null, 2));
  }
  return result;
}

async function getMyPods() {
  const query = `
    query {
      myself {
        pods {
          id
          name
          desiredStatus
          runtime {
            uptimeInSeconds
            ports {
              ip
              isIpPublic
              privatePort
              publicPort
            }
            gpus {
              id
              gpuUtilPercent
              memoryUtilPercent
            }
          }
          machine {
            gpuDisplayName
          }
        }
      }
    }
  `;
  return runpodQuery(query);
}

async function findQualityTestPod() {
  const result = await getMyPods();
  const pods = result.data?.myself?.pods || [];
  return pods.find(p => p.name === CONFIG.podName || p.name.includes('quality'));
}

async function getPodConnectionInfo(pod) {
  if (!pod?.runtime?.ports) return null;
  
  const sshPort = pod.runtime.ports.find(p => p.privatePort === 22);
  const comfyPort = pod.runtime.ports.find(p => p.privatePort === CONFIG.comfyuiPort);
  
  return {
    podId: pod.id,
    sshIp: sshPort?.ip,
    sshPort: sshPort?.publicPort,
    comfyIp: comfyPort?.ip || sshPort?.ip,
    comfyPort: comfyPort?.publicPort || CONFIG.comfyuiPort,
    isPublic: sshPort?.isIpPublic,
  };
}

async function createPod() {
  console.log('🚀 Creating RunPod for quality tests...\n');
  console.log('Configuration:');
  console.log(`  GPU: ${CONFIG.gpuTypeId}`);
  console.log(`  Volume: ${CONFIG.volumeInGb}GB`);
  console.log(`  Ports: 22 (SSH), ${CONFIG.comfyuiPort} (ComfyUI)`);
  console.log('');
  
  const query = `
    mutation createPod($input: PodFindAndDeployOnDemandInput!) {
      podFindAndDeployOnDemand(input: $input) {
        id
        name
        desiredStatus
        imageName
        machineId
      }
    }
  `;
  
  const variables = {
    input: {
      cloudType: 'ALL',
      gpuCount: CONFIG.gpuCount,
      volumeInGb: CONFIG.volumeInGb,
      containerDiskInGb: CONFIG.containerDiskInGb,
      gpuTypeId: CONFIG.gpuTypeId,
      name: CONFIG.podName,
      imageName: CONFIG.imageName,
      dockerArgs: '',
      ports: `22/tcp,${CONFIG.comfyuiPort}/http`,
      volumeMountPath: '/workspace',
      startSsh: true,
      supportPublicIp: true,
      env: []
    }
  };
  
  const result = await runpodQuery(query, variables);
  
  if (result.data?.podFindAndDeployOnDemand) {
    const pod = result.data.podFindAndDeployOnDemand;
    console.log('✅ Pod created successfully!\n');
    console.log(`  ID: ${pod.id}`);
    console.log(`  Name: ${pod.name}`);
    console.log(`  Status: ${pod.desiredStatus}`);
    console.log('');
    console.log('⏳ Waiting for pod to be ready...');
    return pod;
  }
  
  console.error('❌ Failed to create pod');
  return null;
}

async function terminatePod(podId) {
  console.log(`🗑️ Terminating pod ${podId}... (⚠️ Data will be DELETED)`)
  
  const query = `
    mutation terminatePod($input: PodTerminateInput!) {
      podTerminate(input: $input)
    }
  `;
  
  const result = await runpodQuery(query, { input: { podId } });
  
  if (result.data?.podTerminate) {
    console.log('✅ Pod terminated (data deleted)');
  } else {
    console.error('❌ Failed to terminate pod');
  }
}

async function stopPod(podId) {
  console.log(`⏸️ Stopping pod ${podId}... (data will be PRESERVED)`);
  
  const query = `
    mutation stopPod($input: PodStopInput!) {
      podStop(input: $input)
    }
  `;
  
  const result = await runpodQuery(query, { input: { podId } });
  
  if (result.data?.podStop) {
    console.log('✅ Pod stopped (data preserved, ~$0.10/GB/month storage)');
    console.log('   To resume: node app/scripts/runpod-quality-tests.mjs resume <podId>');
  } else {
    console.error('❌ Failed to stop pod');
  }
}

async function resumePod(podId) {
  console.log(`▶️ Resuming pod ${podId}...`);
  
  const query = `
    mutation resumePod($input: PodResumeInput!) {
      podResume(input: $input)
    }
  `;
  
  const result = await runpodQuery(query, { input: { podId, gpuCount: 1 } });
  
  if (result.data?.podResume) {
    console.log('✅ Pod resuming...');
    // Wait for it to be ready
    await new Promise(r => setTimeout(r, 30000));
    const status = await getPodStatus(podId);
    if (status?.runtime) {
      console.log(`✅ Pod ready!`);
      console.log(`   SSH: ssh -i ${CONFIG.sshKeyPath} -p ${status.runtime.ports.find(p => p.privatePort === 22)?.publicPort} root@${status.runtime.gpus[0]?.ip || 'IP'}`);
    }
  } else {
    console.error('❌ Failed to resume pod');
  }
}

// ============================================================================
// SSH/SCP UTILITIES
// ============================================================================

async function sshCommand(ip, port, command, timeout = 120000) {
  const sshCmd = `ssh -i "${CONFIG.sshKeyPath}" -o StrictHostKeyChecking=no -o ConnectTimeout=10 -p ${port} root@${ip} "${command.replace(/"/g, '\\"')}"`;
  
  try {
    const { stdout, stderr } = await execAsync(sshCmd, { timeout });
    return { success: true, stdout, stderr };
  } catch (error) {
    return { success: false, error: error.message, stdout: error.stdout, stderr: error.stderr };
  }
}

async function scpUpload(ip, port, localPath, remotePath) {
  const scpCmd = `scp -i "${CONFIG.sshKeyPath}" -o StrictHostKeyChecking=no -P ${port} "${localPath}" root@${ip}:${remotePath}`;
  
  try {
    await execAsync(scpCmd, { timeout: 300000 });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function scpDownload(ip, port, remotePath, localPath) {
  const scpCmd = `scp -i "${CONFIG.sshKeyPath}" -o StrictHostKeyChecking=no -P ${port} root@${ip}:${remotePath} "${localPath}"`;
  
  try {
    await execAsync(scpCmd, { timeout: 300000 });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// COMFYUI REMOTE API
// ============================================================================

class RemoteComfyUI {
  constructor(ip, port) {
    this.baseUrl = `http://${ip}:${port}`;
    this.wsUrl = `ws://${ip}:${port}/ws`;
  }
  
  async checkConnection() {
    try {
      const res = await fetch(`${this.baseUrl}/system_stats`, { 
        signal: AbortSignal.timeout(10000) 
      });
      if (!res.ok) return { connected: false };
      const data = await res.json();
      return {
        connected: true,
        version: data.system?.comfyui_version,
        device: data.devices?.[0]?.type || 'unknown',
      };
    } catch {
      return { connected: false };
    }
  }
  
  async queuePrompt(workflow) {
    const res = await fetch(`${this.baseUrl}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow }),
    });
    
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Queue failed: ${error}`);
    }
    
    return res.json();
  }
  
  async getHistory(promptId) {
    const res = await fetch(`${this.baseUrl}/history/${promptId}`);
    return res.json();
  }
  
  async waitForCompletion(promptId, maxWaitMs = 600000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitMs) {
      try {
        const history = await this.getHistory(promptId);
        
        if (history[promptId]?.outputs && Object.keys(history[promptId].outputs).length > 0) {
          return history[promptId];
        }
        
        if (history[promptId]?.status?.status_str === 'error') {
          throw new Error(`Generation failed: ${JSON.stringify(history[promptId]?.status)}`);
        }
        
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        process.stdout.write(`\r⏳ Waiting... ${elapsed}s`);
        
        await new Promise(r => setTimeout(r, 5000));
      } catch (e) {
        if (e.message.includes('failed')) throw e;
        await new Promise(r => setTimeout(r, 5000));
      }
    }
    
    throw new Error('Timeout waiting for generation');
  }
  
  async uploadImage(localPath, remoteName) {
    const imageData = fs.readFileSync(localPath);
    const formData = new FormData();
    formData.append('image', new Blob([imageData]), remoteName);
    formData.append('overwrite', 'true');
    
    const res = await fetch(`${this.baseUrl}/upload/image`, {
      method: 'POST',
      body: formData,
    });
    
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json();
  }
  
  async downloadImage(filename, destPath, subfolder = '') {
    const params = new URLSearchParams({ filename, subfolder, type: 'output' });
    const res = await fetch(`${this.baseUrl}/view?${params}`);
    
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(destPath, buffer);
    return destPath;
  }
}

// ============================================================================
// WORKFLOWS
// ============================================================================

const WORKFLOWS = {
  // Test A: Upscale with 4x-UltraSharp
  upscale: (imageName) => ({
    "1": {
      "class_type": "LoadImage",
      "inputs": { "image": imageName }
    },
    "2": {
      "class_type": "UpscaleModelLoader",
      "inputs": { "model_name": "4x-UltraSharp.pth" }
    },
    "3": {
      "class_type": "ImageUpscaleWithModel",
      "inputs": {
        "upscale_model": ["2", 0],
        "image": ["1", 0]
      }
    },
    "4": {
      "class_type": "SaveImage",
      "inputs": {
        "filename_prefix": "quality_tests/test1_upscale_4x",
        "images": ["3", 0]
      }
    }
  }),
  
  // Test B: Face restoration with FaceDetailer (CodeFormer)
  faceRestore: (imageName, checkpoint = 'bigLove_xl1.safetensors') => ({
    "1": {
      "class_type": "LoadImage",
      "inputs": { "image": imageName }
    },
    "2": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": { "ckpt_name": checkpoint }
    },
    "3": {
      "class_type": "CLIPTextEncode",
      "inputs": { 
        "text": "high quality face, detailed skin, sharp features", 
        "clip": ["2", 1] 
      }
    },
    "4": {
      "class_type": "CLIPTextEncode",
      "inputs": { 
        "text": "blurry, low quality, deformed", 
        "clip": ["2", 1] 
      }
    },
    "5": {
      "class_type": "FaceDetailer",
      "inputs": {
        "image": ["1", 0],
        "model": ["2", 0],
        "clip": ["2", 1],
        "vae": ["2", 2],
        "positive": ["3", 0],
        "negative": ["4", 0],
        "bbox_detector": "face_yolov8m.pt",
        "sam_model_opt": "None",
        "segm_detector_opt": "None",
        "detailer_hook": "None",
        "guide_size": 384,
        "guide_size_for": true,
        "max_size": 1024,
        "seed": 42,
        "steps": 20,
        "cfg": 4.0,
        "sampler_name": "dpmpp_2m_sde",
        "scheduler": "karras",
        "denoise": 0.4,
        "feather": 5,
        "noise_mask": true,
        "force_inpaint": true,
        "bbox_threshold": 0.5,
        "bbox_dilation": 10,
        "bbox_crop_factor": 3.0,
        "sam_detection_hint": "center-1",
        "sam_dilation": 0,
        "sam_threshold": 0.93,
        "sam_bbox_expansion": 0,
        "sam_mask_hint_threshold": 0.7,
        "sam_mask_hint_use_negative": "False",
        "drop_size": 10,
        "wildcard": "",
        "cycle": 1,
        "inpaint_model": false,
        "noise_mask_feather": 20
      }
    },
    "6": {
      "class_type": "SaveImage",
      "inputs": {
        "filename_prefix": "quality_tests/test2_facefix",
        "images": ["5", 0]
      }
    }
  }),
  
  // Test C: Upscale then Face restoration
  upscaleThenFace: (imageName, checkpoint = 'bigLove_xl1.safetensors') => ({
    "1": {
      "class_type": "LoadImage",
      "inputs": { "image": imageName }
    },
    // Upscale first
    "2": {
      "class_type": "UpscaleModelLoader",
      "inputs": { "model_name": "4x-UltraSharp.pth" }
    },
    "3": {
      "class_type": "ImageUpscaleWithModel",
      "inputs": {
        "upscale_model": ["2", 0],
        "image": ["1", 0]
      }
    },
    // Scale down for face processing (4x is too big)
    "4": {
      "class_type": "ImageScale",
      "inputs": {
        "image": ["3", 0],
        "upscale_method": "lanczos",
        "width": 2048,
        "height": 3072,
        "crop": "disabled"
      }
    },
    // Then face restoration
    "5": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": { "ckpt_name": checkpoint }
    },
    "6": {
      "class_type": "CLIPTextEncode",
      "inputs": { 
        "text": "high quality face, detailed skin, sharp features", 
        "clip": ["5", 1] 
      }
    },
    "7": {
      "class_type": "CLIPTextEncode",
      "inputs": { 
        "text": "blurry, low quality, deformed", 
        "clip": ["5", 1] 
      }
    },
    "8": {
      "class_type": "FaceDetailer",
      "inputs": {
        "image": ["4", 0],
        "model": ["5", 0],
        "clip": ["5", 1],
        "vae": ["5", 2],
        "positive": ["6", 0],
        "negative": ["7", 0],
        "bbox_detector": "face_yolov8m.pt",
        "sam_model_opt": "None",
        "segm_detector_opt": "None",
        "detailer_hook": "None",
        "guide_size": 512,
        "guide_size_for": true,
        "max_size": 1536,
        "seed": 42,
        "steps": 20,
        "cfg": 4.0,
        "sampler_name": "dpmpp_2m_sde",
        "scheduler": "karras",
        "denoise": 0.35,
        "feather": 5,
        "noise_mask": true,
        "force_inpaint": true,
        "bbox_threshold": 0.5,
        "bbox_dilation": 10,
        "bbox_crop_factor": 3.0,
        "sam_detection_hint": "center-1",
        "sam_dilation": 0,
        "sam_threshold": 0.93,
        "sam_bbox_expansion": 0,
        "sam_mask_hint_threshold": 0.7,
        "sam_mask_hint_use_negative": "False",
        "drop_size": 10,
        "wildcard": "",
        "cycle": 1,
        "inpaint_model": false,
        "noise_mask_feather": 20
      }
    },
    "9": {
      "class_type": "SaveImage",
      "inputs": {
        "filename_prefix": "quality_tests/test3_upscale_then_facefix",
        "images": ["8", 0]
      }
    }
  }),
  
  // Test D: High-res generation with sharp prompt
  highresGen: (faceRefImage, loraName = 'elena_v4_cloud.safetensors') => ({
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": { "ckpt_name": "bigLove_xl1.safetensors" }
    },
    "2": {
      "class_type": "LoraLoader",
      "inputs": {
        "lora_name": loraName,
        "strength_model": 1.0,
        "strength_clip": 1.0,
        "model": ["1", 0],
        "clip": ["1", 1]
      }
    },
    "3": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": `elena, masterpiece, best quality, ultra sharp, 8k uhd, photorealistic,
24 year old Italian woman, honey brown eyes, bronde hair with golden highlights,
sun-kissed skin, natural beauty mark on right cheek,
detailed skin texture, skin pores visible, natural lighting,
sharp focus, no grain, no noise, crisp details,
shot on Canon EOS R5, 85mm lens, f/1.4`,
        "clip": ["2", 1]
      }
    },
    "4": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": `worst quality, low quality, blurry, grainy, noisy, soft focus,
cartoon, anime, illustration, bad anatomy, deformed,
watermark, text, signature, oversaturated`,
        "clip": ["2", 1]
      }
    },
    "5": {
      "class_type": "EmptyLatentImage",
      "inputs": {
        "width": 1024,
        "height": 1536,
        "batch_size": 1
      }
    },
    "6": {
      "class_type": "KSampler",
      "inputs": {
        "seed": Math.floor(Math.random() * 1000000000),
        "steps": 40,
        "cfg": 3.5,
        "sampler_name": "dpmpp_2m_sde",
        "scheduler": "karras",
        "denoise": 1.0,
        "model": ["2", 0],
        "positive": ["3", 0],
        "negative": ["4", 0],
        "latent_image": ["5", 0]
      }
    },
    "7": {
      "class_type": "VAEDecode",
      "inputs": {
        "samples": ["6", 0],
        "vae": ["1", 2]
      }
    },
    "8": {
      "class_type": "SaveImage",
      "inputs": {
        "filename_prefix": "quality_tests/test4_highres_sharp",
        "images": ["7", 0]
      }
    }
  }),
};

// ============================================================================
// SETUP COMMANDS
// ============================================================================

async function setupComfyUI(ip, port) {
  console.log('\n📦 Setting up ComfyUI on RunPod...\n');
  
  const setupScript = `
# Clone ComfyUI if not exists
if [ ! -d "/workspace/ComfyUI" ]; then
  cd /workspace
  git clone https://github.com/comfyanonymous/ComfyUI.git
  cd ComfyUI
  pip install -r requirements.txt
  pip install xformers
else
  echo "ComfyUI already installed"
fi

# Install Impact Pack for FaceDetailer
if [ ! -d "/workspace/ComfyUI/custom_nodes/ComfyUI-Impact-Pack" ]; then
  cd /workspace/ComfyUI/custom_nodes
  git clone https://github.com/ltdrdata/ComfyUI-Impact-Pack.git
  cd ComfyUI-Impact-Pack
  pip install -r requirements.txt
  python install.py
else
  echo "Impact Pack already installed"
fi

# Create output directories
mkdir -p /workspace/ComfyUI/output/quality_tests
mkdir -p /workspace/ComfyUI/models/upscale_models

# Download upscale model if not exists
if [ ! -f "/workspace/ComfyUI/models/upscale_models/4x-UltraSharp.pth" ]; then
  wget -P /workspace/ComfyUI/models/upscale_models https://huggingface.co/Kim2091/UltraSharp/resolve/main/4x-UltraSharp.pth
else
  echo "4x-UltraSharp already downloaded"
fi

echo "Setup complete!"
`;

  console.log('Running setup script (this may take 5-10 minutes)...\n');
  
  const result = await sshCommand(ip, port, setupScript, 600000);
  
  if (result.success) {
    console.log(result.stdout);
    console.log('\n✅ Setup complete!');
  } else {
    console.error('❌ Setup failed:', result.error);
    if (result.stderr) console.error(result.stderr);
  }
  
  return result.success;
}

async function startComfyUI(ip, port) {
  console.log('\n🚀 Starting ComfyUI server...\n');
  
  // Start in background
  const startCmd = `cd /workspace/ComfyUI && nohup python main.py --listen 0.0.0.0 --port ${CONFIG.comfyuiPort} > /workspace/comfyui.log 2>&1 &`;
  
  await sshCommand(ip, port, startCmd);
  
  console.log('Waiting for ComfyUI to start...');
  
  // Wait for server to be ready
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 5000));
    
    const checkResult = await sshCommand(ip, port, `curl -s http://localhost:${CONFIG.comfyuiPort}/system_stats`);
    
    if (checkResult.success && checkResult.stdout.includes('comfyui_version')) {
      console.log('✅ ComfyUI is running!');
      return true;
    }
    
    process.stdout.write(`\r⏳ Waiting... ${(i + 1) * 5}s`);
  }
  
  console.error('\n❌ ComfyUI failed to start');
  return false;
}

// ============================================================================
// TEST COMMANDS
// ============================================================================

async function runTest(comfyui, testName, workflow) {
  console.log(`\n🧪 Running ${testName}...\n`);
  
  try {
    const { prompt_id } = await comfyui.queuePrompt(workflow);
    console.log(`Prompt ID: ${prompt_id}`);
    
    const result = await comfyui.waitForCompletion(prompt_id);
    
    const outputs = Object.values(result.outputs).find(o => o.images);
    if (outputs?.images?.length) {
      const filename = outputs.images[0].filename;
      console.log(`\n✅ ${testName} complete: ${filename}`);
      return { success: true, filename };
    }
    
    return { success: false, error: 'No output image' };
  } catch (error) {
    console.error(`\n❌ ${testName} failed:`, error.message);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// MAIN COMMANDS
// ============================================================================

async function cmdCreate() {
  const pod = await createPod();
  if (!pod) return;
  
  // Wait for pod to be running
  console.log('\nWaiting for pod to be fully ready (2-3 minutes)...');
  
  for (let i = 0; i < 36; i++) {
    await new Promise(r => setTimeout(r, 5000));
    
    const currentPod = await findQualityTestPod();
    const conn = await getPodConnectionInfo(currentPod);
    
    if (conn?.sshIp && conn?.sshPort) {
      console.log('\n✅ Pod is ready!\n');
      console.log(`SSH: ssh -i ${CONFIG.sshKeyPath} -p ${conn.sshPort} root@${conn.sshIp}`);
      console.log(`ComfyUI will be at: http://${conn.comfyIp}:${conn.comfyPort}`);
      console.log('');
      console.log('📋 Next steps:');
      console.log('  1. Run setup: node app/scripts/runpod-quality-tests.mjs setup');
      console.log('  2. Upload image: node app/scripts/runpod-quality-tests.mjs upload <image.jpg>');
      console.log('  3. Run tests: node app/scripts/runpod-quality-tests.mjs test-all');
      return;
    }
    
    process.stdout.write(`\r⏳ ${(i + 1) * 5}s...`);
  }
  
  console.error('\n❌ Pod did not become ready in time');
}

async function cmdStatus() {
  const pod = await findQualityTestPod();
  
  if (!pod) {
    console.log('No quality test pod found.');
    console.log('Create one with: node app/scripts/runpod-quality-tests.mjs create');
    return;
  }
  
  console.log('📊 Quality Test Pod Status:\n');
  console.log(`  Name: ${pod.name}`);
  console.log(`  ID: ${pod.id}`);
  console.log(`  Status: ${pod.desiredStatus}`);
  console.log(`  GPU: ${pod.machine?.gpuDisplayName || 'N/A'}`);
  
  if (pod.runtime) {
    const uptime = Math.floor(pod.runtime.uptimeInSeconds / 60);
    console.log(`  Uptime: ${uptime} minutes`);
    
    const conn = await getPodConnectionInfo(pod);
    if (conn) {
      console.log('');
      console.log('  Connection:');
      console.log(`    SSH: ssh -i ${CONFIG.sshKeyPath} -p ${conn.sshPort} root@${conn.sshIp}`);
      console.log(`    ComfyUI: http://${conn.comfyIp}:${conn.comfyPort}`);
    }
  }
}

async function cmdSetup() {
  const pod = await findQualityTestPod();
  if (!pod) {
    console.error('❌ No pod found. Create one first.');
    return;
  }
  
  const conn = await getPodConnectionInfo(pod);
  if (!conn?.sshIp) {
    console.error('❌ Pod not ready yet');
    return;
  }
  
  const setupOk = await setupComfyUI(conn.sshIp, conn.sshPort);
  if (setupOk) {
    await startComfyUI(conn.sshIp, conn.sshPort);
  }
}

async function cmdUpload(imagePath) {
  if (!imagePath) {
    console.error('Usage: node app/scripts/runpod-quality-tests.mjs upload <image.jpg>');
    return;
  }
  
  const fullPath = path.isAbsolute(imagePath) ? imagePath : path.join(process.cwd(), imagePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ File not found: ${fullPath}`);
    return;
  }
  
  const pod = await findQualityTestPod();
  const conn = await getPodConnectionInfo(pod);
  
  if (!conn?.sshIp) {
    console.error('❌ Pod not ready');
    return;
  }
  
  const remotePath = `/workspace/ComfyUI/input/${path.basename(imagePath)}`;
  console.log(`📤 Uploading ${path.basename(imagePath)}...`);
  
  const result = await scpUpload(conn.sshIp, conn.sshPort, fullPath, remotePath);
  
  if (result.success) {
    console.log(`✅ Uploaded to ${remotePath}`);
    console.log(`   Use image name: ${path.basename(imagePath)}`);
  } else {
    console.error('❌ Upload failed:', result.error);
  }
}

async function cmdRunTest(testType, imageName = 'test_image.jpg') {
  const pod = await findQualityTestPod();
  const conn = await getPodConnectionInfo(pod);
  
  if (!conn?.comfyIp) {
    console.error('❌ Pod not ready');
    return;
  }
  
  // Try to connect via public port or SSH tunnel
  const comfyui = new RemoteComfyUI(conn.comfyIp, conn.comfyPort);
  
  const status = await comfyui.checkConnection();
  if (!status.connected) {
    console.error('❌ Cannot connect to ComfyUI');
    console.log('Make sure ComfyUI is running: node app/scripts/runpod-quality-tests.mjs setup');
    return;
  }
  
  console.log(`✅ Connected to ComfyUI ${status.version}`);
  
  let workflow;
  
  switch (testType) {
    case 'upscale':
      workflow = WORKFLOWS.upscale(imageName);
      break;
    case 'face':
      workflow = WORKFLOWS.faceRestore(imageName);
      break;
    case 'both':
      workflow = WORKFLOWS.upscaleThenFace(imageName);
      break;
    case 'highres':
      workflow = WORKFLOWS.highresGen(imageName);
      break;
    default:
      console.error(`Unknown test type: ${testType}`);
      return;
  }
  
  await runTest(comfyui, `Test ${testType}`, workflow);
}

async function cmdTestAll(imageName = 'test_image.jpg') {
  const pod = await findQualityTestPod();
  const conn = await getPodConnectionInfo(pod);
  
  if (!conn?.comfyIp) {
    console.error('❌ Pod not ready');
    return;
  }
  
  const comfyui = new RemoteComfyUI(conn.comfyIp, conn.comfyPort);
  
  const status = await comfyui.checkConnection();
  if (!status.connected) {
    console.error('❌ Cannot connect to ComfyUI');
    return;
  }
  
  console.log('============================================================');
  console.log('RUNNING ALL QUALITY TESTS');
  console.log(`ComfyUI: ${status.version}`);
  console.log(`Test image: ${imageName}`);
  console.log('============================================================\n');
  
  const results = [];
  
  // Test A: Upscale
  results.push(await runTest(comfyui, 'Test A: Upscale 4x', WORKFLOWS.upscale(imageName)));
  
  // Test B: Face restoration
  results.push(await runTest(comfyui, 'Test B: Face Restoration', WORKFLOWS.faceRestore(imageName)));
  
  // Test C: Upscale + Face
  results.push(await runTest(comfyui, 'Test C: Upscale + Face', WORKFLOWS.upscaleThenFace(imageName)));
  
  // Test D: High-res generation
  results.push(await runTest(comfyui, 'Test D: High-res Generation', WORKFLOWS.highresGen(imageName)));
  
  console.log('\n============================================================');
  console.log('RESULTS SUMMARY');
  console.log('============================================================');
  results.forEach((r, i) => {
    const status = r.success ? '✅' : '❌';
    console.log(`  ${status} Test ${String.fromCharCode(65 + i)}: ${r.success ? r.filename : r.error}`);
  });
  console.log('');
  console.log('Download results: node app/scripts/runpod-quality-tests.mjs download');
}

async function cmdDownload() {
  const pod = await findQualityTestPod();
  const conn = await getPodConnectionInfo(pod);
  
  if (!conn?.sshIp) {
    console.error('❌ Pod not ready');
    return;
  }
  
  // Create local output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  console.log(`📥 Downloading results to ${OUTPUT_DIR}...\n`);
  
  // List remote files
  const listResult = await sshCommand(conn.sshIp, conn.sshPort, 'ls -la /workspace/ComfyUI/output/quality_tests/');
  
  if (!listResult.success || !listResult.stdout) {
    console.log('No results found yet.');
    return;
  }
  
  console.log('Remote files:');
  console.log(listResult.stdout);
  
  // Download all files
  const downloadResult = await scpDownload(
    conn.sshIp, 
    conn.sshPort,
    '/workspace/ComfyUI/output/quality_tests/*',
    OUTPUT_DIR
  );
  
  if (downloadResult.success) {
    console.log(`\n✅ Downloaded to ${OUTPUT_DIR}`);
    
    // List downloaded files
    const files = fs.readdirSync(OUTPUT_DIR);
    console.log(`\nDownloaded ${files.length} files:`);
    files.forEach(f => console.log(`  - ${f}`));
  } else {
    console.error('❌ Download failed:', downloadResult.error);
  }
}

async function cmdTerminate() {
  const pod = await findQualityTestPod();
  
  if (!pod) {
    console.log('No quality test pod found.');
    return;
  }
  
  await terminatePod(pod.id);
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  if (!RUNPOD_API_KEY) {
    console.error('❌ RUNPOD_API_KEY not found in .env.local');
    process.exit(1);
  }
  
  const command = process.argv[2] || 'help';
  const arg = process.argv[3];
  
  switch (command) {
    case 'create':
      await cmdCreate();
      break;
      
    case 'status':
      await cmdStatus();
      break;
      
    case 'setup':
      await cmdSetup();
      break;
      
    case 'upload':
      await cmdUpload(arg);
      break;
      
    case 'test-upscale':
      await cmdRunTest('upscale', arg || 'test_image.jpg');
      break;
      
    case 'test-face':
      await cmdRunTest('face', arg || 'test_image.jpg');
      break;
      
    case 'test-both':
      await cmdRunTest('both', arg || 'test_image.jpg');
      break;
      
    case 'test-highres':
      await cmdRunTest('highres', arg || 'elena_face_ref.jpg');
      break;
      
    case 'test-all':
      await cmdTestAll(arg || 'test_image.jpg');
      break;
      
    case 'download':
      await cmdDownload();
      break;
      
    case 'terminate':
      await cmdTerminate();
      break;
    
    case 'stop':
      if (arg) {
        await stopPod(arg);
      } else {
        const status = loadPodStatus();
        if (status?.podId) {
          await stopPod(status.podId);
        } else {
          console.error('No pod ID provided. Usage: stop <podId>');
        }
      }
      break;
    
    case 'resume':
      if (arg) {
        await resumePod(arg);
      } else {
        console.error('Pod ID required. Usage: resume <podId>');
      }
      break;
      
    default:
      console.log(`
RunPod Quality Tests
====================

Automate quality testing on RunPod with GPU for upscaling,
face restoration, and high-res generation.

Commands:
  create              Create new pod for testing
  status              Check pod status and connection info
  setup               Install ComfyUI + Impact Pack + models
  upload <image>      Upload test image to pod
  test-upscale [img]  Run upscale test (4x-UltraSharp)
  test-face [img]     Run face restoration test (CodeFormer)
  test-both [img]     Run upscale + face restoration
  test-highres [img]  Run high-res generation with LoRA
  test-all [img]      Run all tests
  download            Download all results
  stop [podId]        Stop pod (KEEPS data, ~$0.10/GB/month)
  resume <podId>      Resume a stopped pod
  terminate           Terminate pod (DELETES all data)

Workflow:
  1. node app/scripts/runpod-quality-tests.mjs create
  2. node app/scripts/runpod-quality-tests.mjs setup
  3. node app/scripts/runpod-quality-tests.mjs upload temp-images/img01.jpg
  4. node app/scripts/runpod-quality-tests.mjs test-all img01.jpg
  5. node app/scripts/runpod-quality-tests.mjs download
  6. node app/scripts/runpod-quality-tests.mjs terminate

Estimated cost: ~$0.15-$0.30 (RTX A5000 @ $0.30/hr for 30-60 min)
`);
  }
}

main().catch(console.error);
