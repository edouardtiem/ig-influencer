#!/usr/bin/env node
/**
 * Vast.ai Connect - Manage ComfyUI instances on demand
 *
 * Usage:
 *   node app/scripts/vastai-connect.mjs          # Start/connect to instance
 *   node app/scripts/vastai-connect.mjs --stop   # Destroy instance
 *   node app/scripts/vastai-connect.mjs --status # Check status
 *   node app/scripts/vastai-connect.mjs --ssh    # Get SSH command
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const VAST_API_KEY = process.env.VAST_API_KEY;
const API_BASE = 'https://console.vast.ai/api/v0';

// Configuration
const CONFIG = {
  instanceLabel: 'elena-comfyui',
  gpuName: 'RTX_4090',
  fallbackGpus: ['RTX_3090', 'RTX_A5000', 'RTX_A6000'],
  diskGb: 50,
  image: 'runpod/pytorch:2.4.0-py3.11-cuda12.4.1-devel-ubuntu22.04',
  maxPricePerHour: 0.30, // Max $/hr we're willing to pay
  minReliability: 0.95,
  comfyuiPort: 8188,
};

async function vastRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${VAST_API_KEY}`,
    'Content-Type': 'application/json',
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Vast.ai API error (${response.status}): ${text}`);
  }

  return response.json();
}

async function searchOffers(gpuName = CONFIG.gpuName) {
  console.log(`🔍 Searching for ${gpuName} offers...`);

  const body = {
    limit: 50,
    type: 'on-demand',
    verified: { eq: true },
    rentable: { eq: true },
    rented: { eq: false },
    num_gpus: { eq: 1 },
    reliability2: { gte: CONFIG.minReliability },
    dph_total: { lte: CONFIG.maxPricePerHour },
    disk_space: { gte: CONFIG.diskGb },
    cuda_max_good: { gte: 11.0 }, // CUDA 11+
  };

  // Add GPU filter if specified
  if (gpuName) {
    body.gpu_name = { in: [gpuName] };
  }

  const result = await vastRequest('/bundles/', {
    method: 'POST',
    body: JSON.stringify(body)
  });

  return result.offers || [];
}

async function searchAnyGpu() {
  console.log(`🔍 Searching for any available GPU with 24GB+ VRAM...`);

  const body = {
    limit: 100,
    type: 'on-demand',
    verified: { eq: true },
    rentable: { eq: true },
    rented: { eq: false },
    num_gpus: { eq: 1 },
    gpu_ram: { gte: 24000 }, // At least 24GB VRAM for Z-Image (in MB)
    dph_total: { lte: CONFIG.maxPricePerHour },
    disk_space: { gte: CONFIG.diskGb },
  };

  const result = await vastRequest('/bundles/', {
    method: 'POST',
    body: JSON.stringify(body)
  });

  // Filter out China (CN) - Docker Hub is blocked there
  // Filter out Tesla P40 - older Pascal architecture, no bf16 support
  const offers = result.offers || [];
  return offers.filter(o =>
    !o.geolocation?.includes('CN') &&
    !o.geolocation?.includes('China') &&
    !o.gpu_name?.includes('P40') &&
    !o.gpu_name?.includes('P100')
  );
}

async function getMyInstances() {
  const result = await vastRequest('/instances?owner=me');
  return result.instances || [];
}

async function findExistingInstance() {
  const instances = await getMyInstances();

  // Find instance with our label
  const myInstance = instances.find(i =>
    i.label === CONFIG.instanceLabel ||
    i.actual_status === 'running'
  );

  return myInstance;
}

async function createInstance(offerId) {
  console.log(`🚀 Creating instance from offer ${offerId}...`);

  const body = {
    image: CONFIG.image,
    label: CONFIG.instanceLabel,
    disk: CONFIG.diskGb,
    runtype: 'ssh',  // SSH access
    onstart: `#!/bin/bash
echo "Instance started at $(date)"
# ComfyUI will be installed manually via SSH
`
  };

  const result = await vastRequest(`/asks/${offerId}/`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });

  if (result.success && result.new_contract) {
    console.log(`✅ Instance created: contract ${result.new_contract}`);
    return result.new_contract;
  }

  throw new Error('Failed to create instance: ' + JSON.stringify(result));
}

async function destroyInstance(instanceId) {
  console.log(`🗑️ Destroying instance ${instanceId}...`);

  const result = await vastRequest(`/instances/${instanceId}/`, {
    method: 'DELETE'
  });

  console.log('✅ Instance destroyed');
  return result;
}

async function waitForInstance(instanceId, maxWaitMs = 180000) {
  console.log('⏳ Waiting for instance to be ready...');
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const instances = await getMyInstances();
    const instance = instances.find(i => i.id === instanceId);

    if (instance?.actual_status === 'running' && instance.ssh_host && instance.ssh_port) {
      return instance;
    }

    process.stdout.write('.');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  throw new Error('Instance did not become ready in time');
}

function getSSHCommand(instance) {
  if (!instance?.ssh_host || !instance?.ssh_port) return null;
  return `ssh -p ${instance.ssh_port} root@${instance.ssh_host}`;
}

function formatOffer(offer) {
  // gpu_ram is in MB, convert to GB
  const vramGb = Math.round(offer.gpu_ram / 1024);
  return {
    id: offer.id,
    gpu: offer.gpu_name,
    vram: `${vramGb}GB`,
    price: `$${offer.dph_total.toFixed(3)}/hr`,
    reliability: `${(offer.reliability2 * 100).toFixed(1)}%`,
    location: offer.geolocation || 'Unknown',
    inet: `↓${offer.inet_down?.toFixed(0)}Mbps ↑${offer.inet_up?.toFixed(0)}Mbps`,
    disk: `${offer.disk_space}GB`
  };
}

async function showStatus() {
  const instances = await getMyInstances();

  if (instances.length === 0) {
    console.log('No instances found.');
    return;
  }

  console.log('\n📊 Your Vast.ai Instances:\n');

  for (const inst of instances) {
    console.log(`${inst.label || 'Unnamed'} (ID: ${inst.id})`);
    console.log(`  Status: ${inst.actual_status}`);
    console.log(`  GPU: ${inst.gpu_name} (${inst.num_gpus}x)`);
    console.log(`  Price: $${inst.dph_total?.toFixed(3)}/hr`);
    console.log(`  Image: ${inst.image_uuid || inst.image_runtype}`);

    const sshCmd = getSSHCommand(inst);
    if (sshCmd) {
      console.log(`  SSH: ${sshCmd}`);
    }

    if (inst.public_ipaddr) {
      console.log(`  IP: ${inst.public_ipaddr}`);
      console.log(`  ComfyUI: http://${inst.public_ipaddr}:${CONFIG.comfyuiPort}`);
    }
    console.log('');
  }
}

async function connect() {
  console.log('🔍 Checking for existing instances...\n');

  const existing = await findExistingInstance();

  if (existing) {
    if (existing.actual_status === 'running') {
      console.log(`✅ Found running instance: ${existing.label || existing.id}\n`);

      const sshCmd = getSSHCommand(existing);
      console.log('📋 Connection Info:');
      console.log(`  SSH: ${sshCmd}`);
      console.log(`  GPU: ${existing.gpu_name}`);
      console.log(`  Price: $${existing.dph_total?.toFixed(3)}/hr`);

      if (existing.public_ipaddr) {
        console.log(`  ComfyUI: http://${existing.public_ipaddr}:${CONFIG.comfyuiPort}`);
      }

      return { instance: existing, sshCmd };
    }

    console.log(`⚠️ Found instance ${existing.id} in status: ${existing.actual_status}`);
  }

  // Search for offers
  let offers = await searchOffers();

  if (offers.length === 0) {
    // Try fallback GPUs
    for (const fallbackGpu of CONFIG.fallbackGpus) {
      console.log(`⚠️ No ${CONFIG.gpuName} available, trying ${fallbackGpu}...`);
      offers = await searchOffers(fallbackGpu);
      if (offers.length > 0) break;
    }
  }

  if (offers.length === 0) {
    // Last resort: search for any GPU with enough VRAM
    console.log(`⚠️ No specific GPU available, searching any 20GB+ VRAM GPU...`);
    offers = await searchAnyGpu();
  }

  if (offers.length === 0) {
    throw new Error('No suitable GPU offers found. Try increasing maxPricePerHour or lowering requirements.');
  }

  // Sort by price and pick the cheapest reliable one
  offers.sort((a, b) => a.dph_total - b.dph_total);

  console.log(`\n📋 Found ${offers.length} offers. Top 5:\n`);
  offers.slice(0, 5).forEach((offer, i) => {
    const f = formatOffer(offer);
    console.log(`  ${i + 1}. ${f.gpu} ${f.vram} @ ${f.price} (${f.reliability}) - ${f.location}`);
  });

  const bestOffer = offers[0];
  console.log(`\n🎯 Selecting offer ${bestOffer.id} (${formatOffer(bestOffer).price})\n`);

  // Create instance
  const contractId = await createInstance(bestOffer.id);

  // Wait for it to be ready
  console.log('');
  const instance = await waitForInstance(contractId);

  const sshCmd = getSSHCommand(instance);

  console.log('\n\n✅ Instance ready!\n');
  console.log('📋 Connection Info:');
  console.log(`  SSH: ${sshCmd}`);
  console.log(`  GPU: ${instance.gpu_name}`);
  console.log(`  Price: $${instance.dph_total?.toFixed(3)}/hr`);

  console.log('\n📝 Next steps:');
  console.log(`  1. ${sshCmd}`);
  console.log('  2. cd /workspace && git clone https://github.com/comfyanonymous/ComfyUI.git comfyui');
  console.log('  3. cd comfyui && pip install -r requirements.txt');
  console.log('  4. Download Z-Image models (see RALPH-TASK.md)');
  console.log('  5. python main.py --listen 0.0.0.0 --port 8188');

  return { instance, sshCmd };
}

async function stop() {
  const instances = await getMyInstances();

  if (instances.length === 0) {
    console.log('No instances found.');
    return;
  }

  for (const inst of instances) {
    if (inst.actual_status === 'running' || inst.actual_status === 'loading') {
      await destroyInstance(inst.id);
    }
  }
}

async function showSSH() {
  const existing = await findExistingInstance();

  if (!existing || existing.actual_status !== 'running') {
    console.log('No running instance found.');
    return;
  }

  const sshCmd = getSSHCommand(existing);
  console.log(sshCmd);
}

// Main
async function main() {
  if (!VAST_API_KEY) {
    console.error('❌ VAST_API_KEY not found in .env.local');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const command = args[0] || '';

  try {
    if (command === '--stop' || command === 'stop') {
      await stop();
    } else if (command === '--status' || command === 'status') {
      await showStatus();
    } else if (command === '--ssh' || command === 'ssh') {
      await showSSH();
    } else if (command === '--help' || command === 'help') {
      console.log(`
Vast.ai Connect - Manage ComfyUI instances

Usage:
  node app/scripts/vastai-connect.mjs          # Start/connect to instance
  node app/scripts/vastai-connect.mjs --stop   # Destroy instance (saves $)
  node app/scripts/vastai-connect.mjs --status # Show instance status
  node app/scripts/vastai-connect.mjs --ssh    # Get SSH command only
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
