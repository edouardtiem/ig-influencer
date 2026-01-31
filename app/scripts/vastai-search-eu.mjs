#!/usr/bin/env node
/**
 * Search for European Vast.ai GPU offers
 * Run: node app/scripts/vastai-search-eu.mjs
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
  console.log('🔍 Searching for European RTX 4090/3090 offers...\n');

  const body = {
    limit: 100,
    type: 'on-demand',
    verified: { eq: true },
    rentable: { eq: true },
    rented: { eq: false },
    num_gpus: { eq: 1 },
    gpu_ram: { gte: 24000 }, // 24GB+ VRAM
    dph_total: { lte: 0.50 }, // Max $0.50/hr
    disk_space: { gte: 50 },
    reliability2: { gte: 0.95 },
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

  console.log(`📋 Found ${euOffers.length} European offers:\n`);

  euOffers.slice(0, 15).forEach((offer, i) => {
    const vramGb = Math.round(offer.gpu_ram / 1024);
    console.log(`  ${i + 1}. ${offer.gpu_name} ${vramGb}GB @ $${offer.dph_total.toFixed(3)}/hr (${(offer.reliability2 * 100).toFixed(1)}%) - ${offer.geolocation}`);
    console.log(`     ID: ${offer.id} | ↓${offer.inet_down?.toFixed(0)}Mbps | Disk: ${offer.disk_space}GB`);
  });

  return euOffers;
}

async function main() {
  if (!VAST_API_KEY) {
    console.error('❌ VAST_API_KEY not found');
    process.exit(1);
  }

  try {
    const offers = await searchEuropeanGpus();

    if (offers.length > 0) {
      console.log('\n💡 To create an instance with the best offer:');
      console.log(`   Add offer ID ${offers[0].id} to vastai-connect.mjs`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
