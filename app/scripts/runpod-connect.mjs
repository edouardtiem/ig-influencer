#!/usr/bin/env node
/**
 * RunPod Connect - Manage ComfyUI pods on demand
 * 
 * Usage:
 *   node app/scripts/runpod-connect.mjs          # Start/connect to pod
 *   node app/scripts/runpod-connect.mjs --stop   # Stop pod
 *   node app/scripts/runpod-connect.mjs --status # Check status
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
const GRAPHQL_URL = 'https://api.runpod.io/graphql';

// Configuration - Update these after creating a volume-connected pod
const CONFIG = {
  podName: 'elena-comfyui-tx',
  gpuType: 'NVIDIA GeForce RTX 4090',
  fallbackGpuTypes: ['NVIDIA RTX A5000', 'NVIDIA GeForce RTX 3090'],
  imageName: 'runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel-ubuntu22.04',
  ports: '22/tcp,8188/http',
  comfyuiPort: 8188,
  // Network volume for persistent storage (US-TX-3 datacenter)
  networkVolumeId: 'aml40rql5h',  // elena-comfyui-US-TX-3 volume with Qwen installed
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
            ports {
              ip
              isIpPublic
              privatePort
              publicPort
              type
            }
          }
          machine {
            gpuDisplayName
            dataCenterId
          }
          networkVolume {
            id
            name
          }
        }
      }
    }
  `;
  return runpodQuery(query);
}

async function findExistingPod() {
  const result = await getMyPods();
  const pods = result.data?.myself?.pods || [];
  
  // Find any running pod with ComfyUI
  const runningPod = pods.find(p => 
    p.desiredStatus === 'RUNNING' && 
    p.runtime?.ports?.some(port => port.privatePort === CONFIG.comfyuiPort)
  );
  
  if (runningPod) {
    return runningPod;
  }
  
  // Find any stopped pod that can be resumed
  const stoppedPod = pods.find(p => p.desiredStatus === 'EXITED');
  return stoppedPod;
}

function getComfyUIUrl(pod) {
  if (!pod?.runtime?.ports) return null;
  
  const comfyPort = pod.runtime.ports.find(p => p.privatePort === CONFIG.comfyuiPort);
  if (!comfyPort) return null;
  
  // RunPod proxy URL format
  return `https://${pod.id}-${CONFIG.comfyuiPort}.proxy.runpod.net`;
}

function getSSHCommand(pod) {
  if (!pod?.runtime?.ports) return null;
  
  const sshPort = pod.runtime.ports.find(p => p.privatePort === 22 && p.isIpPublic);
  if (!sshPort) return null;
  
  return `ssh -i ~/.runpod/ssh/RunPod-Key-Go root@${sshPort.ip} -p ${sshPort.publicPort}`;
}

async function createPod(gpuType = CONFIG.gpuType) {
  console.log(`🚀 Creating pod with ${gpuType}...`);
  
  const query = `
    mutation createPod($input: PodFindAndDeployOnDemandInput!) {
      podFindAndDeployOnDemand(input: $input) {
        id
        name
        desiredStatus
        imageName
      }
    }
  `;
  
  const input = {
    cloudType: 'ALL',
    gpuCount: 1,
    volumeInGb: CONFIG.networkVolumeId ? 0 : 50,
    containerDiskInGb: 20,
    gpuTypeId: gpuType,
    name: CONFIG.podName,
    imageName: CONFIG.imageName,
    dockerArgs: '',
    ports: CONFIG.ports,
    volumeMountPath: '/workspace',
    startSsh: true,
    supportPublicIp: true,
  };
  
  if (CONFIG.networkVolumeId) {
    input.networkVolumeId = CONFIG.networkVolumeId;
  }
  
  const result = await runpodQuery(query, { input });
  
  if (result.data?.podFindAndDeployOnDemand) {
    return result.data.podFindAndDeployOnDemand;
  }
  
  // If primary GPU failed, try fallbacks
  if (result.errors?.[0]?.message?.includes('no longer any instances')) {
    for (const fallbackGpu of CONFIG.fallbackGpuTypes) {
      if (fallbackGpu !== gpuType) {
        console.log(`⚠️ ${gpuType} not available, trying ${fallbackGpu}...`);
        return createPod(fallbackGpu);
      }
    }
  }
  
  throw new Error(result.errors?.[0]?.message || 'Failed to create pod');
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
  return result.data?.podResume;
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
    console.log('✅ Pod stopped (data preserved, no GPU cost)');
    return true;
  }
  return false;
}

async function waitForPodReady(podId, maxWaitMs = 300000) {
  console.log('⏳ Waiting for pod to be ready...');
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    const result = await getMyPods();
    const pod = result.data?.myself?.pods?.find(p => p.id === podId);
    
    if (pod?.desiredStatus === 'RUNNING' && pod.runtime?.ports?.length > 0) {
      // Check if ComfyUI port is exposed
      const comfyPort = pod.runtime.ports.find(p => p.privatePort === CONFIG.comfyuiPort);
      if (comfyPort) {
        return pod;
      }
    }
    
    process.stdout.write('.');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  throw new Error('Pod did not become ready in time');
}

async function showStatus() {
  const result = await getMyPods();
  const pods = result.data?.myself?.pods || [];
  
  if (pods.length === 0) {
    console.log('No pods found.');
    return;
  }
  
  console.log('\n📊 Your RunPod Pods:\n');
  
  for (const pod of pods) {
    console.log(`${pod.name} (${pod.id})`);
    console.log(`  Status: ${pod.desiredStatus}`);
    console.log(`  GPU: ${pod.machine?.gpuDisplayName || 'N/A'}`);
    console.log(`  Datacenter: ${pod.machine?.dataCenterId || 'N/A'}`);
    
    if (pod.networkVolume) {
      console.log(`  Volume: ${pod.networkVolume.name} (${pod.networkVolume.id})`);
    } else {
      console.log(`  Volume: None (data not persistent)`);
    }
    
    if (pod.runtime) {
      const uptime = Math.floor(pod.runtime.uptimeInSeconds / 60);
      console.log(`  Uptime: ${uptime} minutes`);
      
      const comfyUrl = getComfyUIUrl(pod);
      if (comfyUrl) {
        console.log(`  ComfyUI: ${comfyUrl}`);
      }
      
      const sshCmd = getSSHCommand(pod);
      if (sshCmd) {
        console.log(`  SSH: ${sshCmd}`);
      }
    }
    console.log('');
  }
}

async function connect() {
  console.log('🔍 Checking for existing pods...\n');
  
  const existingPod = await findExistingPod();
  
  if (existingPod) {
    if (existingPod.desiredStatus === 'RUNNING') {
      console.log(`✅ Found running pod: ${existingPod.name}\n`);
      
      const comfyUrl = getComfyUIUrl(existingPod);
      const sshCmd = getSSHCommand(existingPod);
      
      console.log('📋 Connection Info:');
      console.log(`  ComfyUI: ${comfyUrl}`);
      console.log(`  SSH: ${sshCmd}`);
      console.log(`  GPU: ${existingPod.machine?.gpuDisplayName}`);
      
      if (!existingPod.networkVolume) {
        console.log('\n⚠️ Warning: No network volume attached. Data will be lost when pod is terminated.');
      }
      
      return { pod: existingPod, comfyUrl, sshCmd };
    }
    
    // Resume stopped pod
    console.log(`Found stopped pod: ${existingPod.name}, resuming...`);
    await resumePod(existingPod.id);
    const pod = await waitForPodReady(existingPod.id);
    
    const comfyUrl = getComfyUIUrl(pod);
    const sshCmd = getSSHCommand(pod);
    
    console.log('\n✅ Pod resumed!\n');
    console.log('📋 Connection Info:');
    console.log(`  ComfyUI: ${comfyUrl}`);
    console.log(`  SSH: ${sshCmd}`);
    
    return { pod, comfyUrl, sshCmd };
  }
  
  // Create new pod
  console.log('No existing pod found, creating new one...\n');
  const newPod = await createPod();
  const pod = await waitForPodReady(newPod.id);
  
  const comfyUrl = getComfyUIUrl(pod);
  const sshCmd = getSSHCommand(pod);
  
  console.log('\n✅ Pod created!\n');
  console.log('📋 Connection Info:');
  console.log(`  ComfyUI: ${comfyUrl}`);
  console.log(`  SSH: ${sshCmd}`);
  
  console.log('\n⚠️ New pod created. You may need to start ComfyUI manually:');
  console.log(`  ${sshCmd}`);
  console.log('  Then run: bash /workspace/startup.sh');
  
  return { pod, comfyUrl, sshCmd };
}

async function stop() {
  const existingPod = await findExistingPod();
  
  if (!existingPod) {
    console.log('No running pod found.');
    return;
  }
  
  if (existingPod.desiredStatus !== 'RUNNING') {
    console.log(`Pod ${existingPod.name} is already stopped.`);
    return;
  }
  
  await stopPod(existingPod.id);
}

// Main
async function main() {
  if (!RUNPOD_API_KEY) {
    console.error('❌ RUNPOD_API_KEY not found in .env.local');
    process.exit(1);
  }
  
  const args = process.argv.slice(2);
  const command = args[0] || '';
  
  try {
    if (command === '--stop' || command === 'stop') {
      await stop();
    } else if (command === '--status' || command === 'status') {
      await showStatus();
    } else if (command === '--help' || command === 'help') {
      console.log(`
RunPod Connect - Manage ComfyUI pods

Usage:
  node app/scripts/runpod-connect.mjs          # Start/connect to pod
  node app/scripts/runpod-connect.mjs --stop   # Stop pod (saves data, no GPU cost)
  node app/scripts/runpod-connect.mjs --status # Show pod status
`);
    } else {
      await connect();
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
