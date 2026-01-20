#!/usr/bin/env node
/**
 * RunPod LoRA Training Script
 * Creates a pod, uploads dataset, runs training, downloads result
 * 
 * Usage:
 *   node app/scripts/runpod-lora-training.mjs create    # Create and start pod
 *   node app/scripts/runpod-lora-training.mjs status    # Check pod status
 *   node app/scripts/runpod-lora-training.mjs stop      # Stop pod
 *   node app/scripts/runpod-lora-training.mjs terminate # Terminate pod
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local from project root
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
const GRAPHQL_URL = 'https://api.runpod.io/graphql';

// Training configuration
const CONFIG = {
  // Pod settings
  gpuTypeId: 'NVIDIA GeForce RTX 4090',  // 24GB VRAM, ~$0.44/hr
  gpuCount: 1,
  volumeInGb: 50,  // Storage for model + dataset + output
  containerDiskInGb: 20,
  
  // Docker image with kohya_ss pre-installed
  imageName: 'runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel-ubuntu22.04',
  
  // Training params (optimized for RTX 4090)
  training: {
    resolution: '1024,1024',
    batchSize: 1,
    maxTrainSteps: 400,      // More steps for 35 images
    learningRate: '1e-4',
    networkDim: 32,          // Higher rank for better quality
    networkAlpha: 16,        // Alpha = dim/2
    repeats: 10,             // 10 repeats per image
    outputName: 'elena_v3_cloud'
  }
};

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

async function createPod() {
  console.log('🚀 Creating RunPod for LoRA training...\n');
  console.log('Configuration:');
  console.log(`  GPU: ${CONFIG.gpuTypeId}`);
  console.log(`  Volume: ${CONFIG.volumeInGb}GB`);
  console.log(`  Image: ${CONFIG.imageName}`);
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
      name: 'elena-lora-training',
      imageName: CONFIG.imageName,
      dockerArgs: '',
      ports: '22/tcp,8888/http',  // SSH + Jupyter
      volumeMountPath: '/workspace',
      startSsh: true,
      // Setup script to install kohya_ss
      env: [
        { key: 'JUPYTER_PASSWORD', value: 'runpod' }
      ]
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
    console.log('📋 Next steps:');
    console.log('  1. Wait for pod to be RUNNING (check with: node app/scripts/runpod-lora-training.mjs status)');
    console.log('  2. SSH into pod and run setup script');
    console.log('  3. Upload dataset');
    console.log('  4. Start training');
    return pod;
  } else {
    console.error('❌ Failed to create pod');
    return null;
  }
}

async function getPodStatus() {
  const result = await getMyPods();
  
  if (result.data?.myself?.pods) {
    const pods = result.data.myself.pods;
    
    if (pods.length === 0) {
      console.log('No pods found.');
      return;
    }
    
    console.log('📊 Your RunPod Pods:\n');
    
    for (const pod of pods) {
      console.log(`  ${pod.name} (${pod.id})`);
      console.log(`    Status: ${pod.desiredStatus}`);
      console.log(`    GPU: ${pod.machine?.gpuDisplayName || 'N/A'}`);
      
      if (pod.runtime) {
        const uptime = Math.floor(pod.runtime.uptimeInSeconds / 60);
        console.log(`    Uptime: ${uptime} minutes`);
        
        if (pod.runtime.gpus?.[0]) {
          const gpu = pod.runtime.gpus[0];
          console.log(`    GPU Util: ${gpu.gpuUtilPercent}%`);
          console.log(`    Memory Util: ${gpu.memoryUtilPercent}%`);
        }
      }
      console.log('');
    }
  }
}

async function stopPod(podId) {
  console.log(`⏹️ Stopping pod ${podId}...`);
  
  const query = `
    mutation stopPod($input: PodStopInput!) {
      podStop(input: $input) {
        id
        desiredStatus
      }
    }
  `;
  
  const result = await runpodQuery(query, { input: { podId } });
  
  if (result.data?.podStop) {
    console.log('✅ Pod stopped');
  } else {
    console.error('❌ Failed to stop pod');
  }
}

async function terminatePod(podId) {
  console.log(`🗑️ Terminating pod ${podId}...`);
  
  const query = `
    mutation terminatePod($input: PodTerminateInput!) {
      podTerminate(input: $input)
    }
  `;
  
  const result = await runpodQuery(query, { input: { podId } });
  
  if (result.data?.podTerminate) {
    console.log('✅ Pod terminated');
  } else {
    console.error('❌ Failed to terminate pod');
  }
}

async function resumePod(podId) {
  console.log(`▶️ Resuming pod ${podId}...`);
  
  const query = `
    mutation resumePod($input: PodResumeInput!) {
      podResume(input: $input) {
        id
        desiredStatus
      }
    }
  `;
  
  const result = await runpodQuery(query, { input: { podId } });
  
  if (result.data?.podResume) {
    console.log('✅ Pod resumed');
  } else {
    console.error('❌ Failed to resume pod');
  }
}

function printTrainingScript() {
  const t = CONFIG.training;
  
  console.log('\n' + '='.repeat(60));
  console.log('📜 TRAINING SCRIPT TO RUN ON RUNPOD');
  console.log('='.repeat(60));
  console.log(`
# 1. SSH into your pod (get SSH command from RunPod console)

# 2. Install kohya_ss (run once)
cd /workspace
git clone https://github.com/bmaltais/kohya_ss.git
cd kohya_ss
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install xformers

# 3. Download SDXL base model (or upload your own)
mkdir -p /workspace/models
cd /workspace/models
# Option A: Use SDXL base
wget https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors

# Option B: Upload your custom model (bigLust_v16.safetensors) via SCP

# 4. Upload your dataset to /workspace/dataset/
# From your local machine:
# scp -P <PORT> -r lora-dataset-elena root@<POD_IP>:/workspace/dataset/

# 5. Run training
cd /workspace/kohya_ss
source venv/bin/activate

accelerate launch --num_cpu_threads_per_process=2 sdxl_train_network.py \\
  --pretrained_model_name_or_path="/workspace/models/sd_xl_base_1.0.safetensors" \\
  --train_data_dir="/workspace/dataset" \\
  --output_dir="/workspace/output" \\
  --output_name="${t.outputName}" \\
  --save_model_as="safetensors" \\
  --resolution="${t.resolution}" \\
  --train_batch_size=${t.batchSize} \\
  --max_train_steps=${t.maxTrainSteps} \\
  --learning_rate=${t.learningRate} \\
  --optimizer_type="AdamW8bit" \\
  --lr_scheduler="cosine" \\
  --lr_warmup_steps=50 \\
  --network_module="networks.lora" \\
  --network_dim=${t.networkDim} \\
  --network_alpha=${t.networkAlpha} \\
  --mixed_precision="fp16" \\
  --save_precision="fp16" \\
  --cache_latents \\
  --caption_extension=".txt" \\
  --shuffle_caption \\
  --seed=42 \\
  --xformers \\
  --gradient_checkpointing \\
  --enable_bucket \\
  --min_bucket_reso=512 \\
  --max_bucket_reso=2048 \\
  --logging_dir="/workspace/logs"

# 6. Download your LoRA
# From your local machine:
# scp -P <PORT> root@<POD_IP>:/workspace/output/${t.outputName}.safetensors ~/ComfyUI/models/loras/

echo "✅ Training complete! LoRA saved to /workspace/output/${t.outputName}.safetensors"
`);
  console.log('='.repeat(60));
}

// Main
async function main() {
  if (!RUNPOD_API_KEY) {
    console.error('❌ RUNPOD_API_KEY not found in environment');
    process.exit(1);
  }
  
  const command = process.argv[2] || 'help';
  const podId = process.argv[3];
  
  switch (command) {
    case 'create':
      await createPod();
      printTrainingScript();
      break;
      
    case 'status':
      await getPodStatus();
      break;
      
    case 'stop':
      if (!podId) {
        const result = await getMyPods();
        const pods = result.data?.myself?.pods || [];
        if (pods.length === 1) {
          await stopPod(pods[0].id);
        } else {
          console.log('Please specify pod ID: node app/scripts/runpod-lora-training.mjs stop <POD_ID>');
          await getPodStatus();
        }
      } else {
        await stopPod(podId);
      }
      break;
      
    case 'resume':
      if (!podId) {
        const result = await getMyPods();
        const pods = result.data?.myself?.pods || [];
        if (pods.length === 1) {
          await resumePod(pods[0].id);
        } else {
          console.log('Please specify pod ID');
          await getPodStatus();
        }
      } else {
        await resumePod(podId);
      }
      break;
      
    case 'terminate':
      if (!podId) {
        console.log('Please specify pod ID: node app/scripts/runpod-lora-training.mjs terminate <POD_ID>');
        await getPodStatus();
      } else {
        await terminatePod(podId);
      }
      break;
      
    case 'script':
      printTrainingScript();
      break;
      
    default:
      console.log(`
RunPod LoRA Training Manager

Usage:
  node app/scripts/runpod-lora-training.mjs <command> [podId]

Commands:
  create     Create a new pod for training
  status     Check status of your pods
  stop       Stop a pod (saves state, no GPU cost)
  resume     Resume a stopped pod
  terminate  Delete a pod completely
  script     Print the training script to run on the pod

Examples:
  node app/scripts/runpod-lora-training.mjs create
  node app/scripts/runpod-lora-training.mjs status
  node app/scripts/runpod-lora-training.mjs stop y5x76j71bjrd6s
`);
  }
}

main().catch(console.error);
