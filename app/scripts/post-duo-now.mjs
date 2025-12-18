#!/usr/bin/env node
/**
 * Post the already-generated duo image to Mila's account
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length > 0 && !process.env[key]) {
      process.env[key] = val.join('=').trim();
    }
  });
}

// The already-generated image
const IMAGE_URL = 'https://res.cloudinary.com/dily60mr0/image/upload/v1766054885/mila-duo/ubndjs4itjqce5v1nt3c.jpg';

const CAPTION = `NYC with my girl @elenav.paris 🗽✨

Best views, best company 💕

#nyc #rooftop #bestfriends #manhattan #girlstrip #newyork #vacaymode`;

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function waitForMediaReady(containerId, accessToken, maxWaitMs = 120000) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    const res = await fetch(`https://graph.facebook.com/v18.0/${containerId}?fields=status_code&access_token=${accessToken}`);
    const data = await res.json();
    if (data.status_code === 'FINISHED') return true;
    if (data.status_code === 'ERROR') throw new Error('Media processing failed');
    log(`  ⏳ Status: ${data.status_code || 'processing'}...`);
    await new Promise(r => setTimeout(r, 3000));
  }
  throw new Error('Timeout');
}

async function main() {
  log('🗽 Posting NYC Duo to @mila.verne...\n');

  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;

  if (!accessToken || !accountId) {
    console.error('❌ Missing INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_ACCOUNT_ID');
    process.exit(1);
  }

  // Create container
  log('📤 Creating media container...');
  const params = new URLSearchParams({
    image_url: IMAGE_URL,
    caption: CAPTION,
    access_token: accessToken,
  });

  const res = await fetch(`https://graph.facebook.com/v18.0/${accountId}/media?${params}`, { method: 'POST' });
  const data = await res.json();

  if (data.error) {
    console.error('❌ Error:', data.error.message);
    process.exit(1);
  }

  const containerId = data.id;
  log(`   ✅ Container: ${containerId}`);

  // Wait for ready
  log('⏳ Waiting for media to be ready...');
  await waitForMediaReady(containerId, accessToken);

  // Publish
  log('📤 Publishing...');
  const publishRes = await fetch(
    `https://graph.facebook.com/v18.0/${accountId}/media_publish?creation_id=${containerId}&access_token=${accessToken}`,
    { method: 'POST' }
  );
  const publishData = await publishRes.json();

  if (publishData.error) {
    console.error('❌ Publish error:', publishData.error.message);
    process.exit(1);
  }

  log(`\n✅ PUBLISHED! Post ID: ${publishData.id}`);
  log(`\n🔗 https://www.instagram.com/p/${publishData.id}/`);
}

main().catch(e => {
  console.error('❌', e.message);
  process.exit(1);
});

