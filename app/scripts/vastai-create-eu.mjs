#!/usr/bin/env node
/**
 * Create European Vast.ai instance at $0.12-0.15/hr
 * Run: node app/scripts/vastai-create-eu.mjs
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const VAST_API_KEY = process.env.VAST_API_KEY;
const API_BASE = 'https://console.vast.ai/api/v0';

// European country codes
const EU_COUNTRIES = ['DE', 'FR', 'NL', 'UK', 'GB', 'PL', 'SE', 'FI', 'NO', 'DK', 'AT', 'CH', 'BE', 'ES', 'IT', 'PT', 'CZ', 'UA', 'IE', 'RO', 'HU', 'SK', 'BG', 'HR', 'SI', 'EE', 'LV', 'LT'];

const CONFIG = {
  instanceLabel: 'elena-comfyui-eu',
  diskGb: 50,
  image: 'runpod/pytorch:2.4.0-py3.11-cuda12.4.1-devel-ubuntu22.04',
  maxPricePerHour: 0.15, // Target $0.12-0.15/hr
  minReliability: 0.95,
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

async function searchEuropeanGpus() {
  console.log('🔍 Searching for cheap European RTX 3090 offers ($0.12-0.15/hr)...\n');

  const body = {
    limit: 100,
    type: 'on-demand',
    verified: { eq: true },
    rentable: { eq: true },
    rented: { eq: false },
    num_gpus: { eq: 1 },
    gpu_ram: { gte: 24000 }, // 24GB+ VRAM
    dph_total: { lte: CONFIG.maxPricePerHour },
    disk_space: { gte: CONFIG.diskGb },
    reliability2: { gte: CONFIG.minReliability },
  };

  const result = await vastRequest('/bundles/', {
    method: 'POST',
    body: JSON.stringify(body)
  });

  const offers = result.offers || [];

  // Filter for European countries
  const euOffers = offers.filter(o => {
    const geo = o.geolocation || '';
    return EU_COUNTRIES.some(code => geo.includes(code));
  });

  // Sort by price
  euOffers.sort((a, b) => a.dph_total - b.dph_total);

  return euOffers;
}

async function createInstance(offerId) {
  console.log(`🚀 Creating instance from offer ${offerId}...`);

  const body = {
    image: CONFIG.image,
    label: CONFIG.instanceLabel,
    disk: CONFIG.diskGb,
    runtype: 'ssh',
    onstart: `#!/bin/bash
echo "Instance started at $(date)"
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

async function getMyInstances() {
  const result = await vastRequest('/instances?owner=me');
  return result.instances || [];
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

async function main() {
  if (!VAST_API_KEY) {
    console.error('❌ VAST_API_KEY not found');
    process.exit(1);
  }

  try {
    // Search for EU offers
    const offers = await searchEuropeanGpus();

    if (offers.length === 0) {
      console.error('❌ No European offers found at this price point');
      process.exit(1);
    }

    console.log(`📋 Found ${offers.length} European offers. Top 5:\n`);
    offers.slice(0, 5).forEach((offer, i) => {
      const vramGb = Math.round(offer.gpu_ram / 1024);
      console.log(`  ${i + 1}. ${offer.gpu_name} ${vramGb}GB @ $${offer.dph_total.toFixed(3)}/hr - ${offer.geolocation}`);
    });

    // Pick the cheapest one
    const bestOffer = offers[0];
    console.log(`\n🎯 Selecting offer ${bestOffer.id} ($${bestOffer.dph_total.toFixed(3)}/hr)\n`);

    // Create instance
    const contractId = await createInstance(bestOffer.id);

    // Wait for it
    console.log('');
    const instance = await waitForInstance(contractId);

    console.log('\n\n✅ Instance ready!\n');
    console.log('📋 Connection Info:');
    console.log(`  SSH: ssh -p ${instance.ssh_port} root@${instance.ssh_host}`);
    console.log(`  GPU: ${instance.gpu_name}`);
    console.log(`  Price: $${instance.dph_total?.toFixed(3)}/hr`);
    console.log(`  Location: ${instance.geolocation || 'Unknown'}`);

    console.log('\n📝 Next steps:');
    console.log(`  1. ssh -p ${instance.ssh_port} root@${instance.ssh_host}`);
    console.log('  2. cd /workspace && git clone https://github.com/comfyanonymous/ComfyUI.git comfyui');
    console.log('  3. cd comfyui && pip install -r requirements.txt');
    console.log('  4. Download models from HuggingFace');
    console.log('  5. python main.py --listen 0.0.0.0 --port 8188');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
