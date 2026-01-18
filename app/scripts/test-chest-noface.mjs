#!/usr/bin/env node
import Replicate from 'replicate';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

const ELENA_BASE = `24 year old Italian model, feminine shapely figure, hourglass silhouette,
bronde hair with golden blonde balayage, narrow waist, wide hips`;

// Tests - chest/body visible, NO face
const TESTS = [
  {
    name: 'chest1-lingerie-neck-down',
    prompt: `SUBJECT: Elena, ${ELENA_BASE},

SETTING: Luxury bedroom, soft golden morning light, white sheets

OUTFIT: black lace bralette with matching briefs, elegant lingerie set

COMPOSITION: Shot from NECK DOWN only, showing chest and torso in lingerie, body lying on bed, hands on stomach
CRITICAL: Face NOT visible - cropped at neck, only body shown

STYLE: luxury lingerie editorial, intimate apparel campaign

NEGATIVE: face visible, head visible, skinny, thin, flat, low quality`
  },
  {
    name: 'chest2-bikini-body-crop',
    prompt: `SUBJECT: Elena, ${ELENA_BASE},

SETTING: Luxury pool, turquoise water, sunny day

OUTFIT: tiny black string bikini, triangle top, brazilian bottoms

COMPOSITION: Body shot from chin down, standing in pool, water at hip level, bikini top visible, wet skin glistening
CRITICAL: Face cropped out - shot starts below chin, chest and body visible

STYLE: swimwear campaign, summer editorial

NEGATIVE: face visible, head shown, skinny, thin, flat, low quality`
  },
  {
    name: 'chest3-hands-covering',
    prompt: `SUBJECT: Elena, ${ELENA_BASE},

SETTING: Elegant bedroom, soft morning light, white sheets

OUTFIT: minimal lace briefs only, hands covering chest area

COMPOSITION: Artistic shot from neck down, lying on bed, hands elegantly placed covering chest, stomach and hips visible, intimate moment
CRITICAL: Face NOT in frame - cropped at neck

STYLE: artistic intimate photography, fine art editorial

NEGATIVE: face visible, skinny, thin, flat, low quality`
  },
  {
    name: 'chest4-side-profile-body',
    prompt: `SUBJECT: Elena, ${ELENA_BASE},

SETTING: Luxury bathroom, marble, soft warm lighting

OUTFIT: black lace bodysuit, plunging neckline

COMPOSITION: Side profile shot of body, from shoulder down to hips, showing silhouette and curves, bodysuit visible
CRITICAL: Face turned away or cropped - only side of body visible

STYLE: luxury lingerie campaign, intimate editorial

NEGATIVE: face visible, front face, skinny, thin, flat, low quality`
  },
  {
    name: 'chest5-mirror-body-front',
    prompt: `SUBJECT: Elena, ${ELENA_BASE},

SETTING: Luxury dressing room, full mirror, warm lighting

OUTFIT: burgundy satin lingerie set, bralette with high-cut briefs

COMPOSITION: Mirror reflection showing body from neck down, front view of lingerie, hands adjusting bralette strap
CRITICAL: Face NOT visible - cropped above chin in reflection

STYLE: lingerie lookbook, intimate apparel editorial

NEGATIVE: face visible, head shown, skinny, thin, flat, low quality`
  },
  {
    name: 'chest6-bed-suggestive',
    prompt: `SUBJECT: Elena, ${ELENA_BASE},

SETTING: Elegant bedroom, silk sheets, soft lamp lighting

OUTFIT: sheer black lace bralette, matching briefs

COMPOSITION: Lying on bed, shot from above showing chest and torso, one arm above head (cropping face), lingerie visible, suggestive intimate pose
CRITICAL: Arm positioned to hide face OR face cropped out of frame

STYLE: luxury intimate editorial, bedroom photography

NEGATIVE: face visible, skinny, thin, flat, low quality`
  }
];

async function uploadToCloudinary(imageData, name) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'elena-test-chest';
  const publicId = `${name}-${timestamp}`;
  const signatureString = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(signatureString).digest('hex');
  const formData = new FormData();
  formData.append('file', imageData);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  formData.append('folder', folder);
  formData.append('public_id', publicId);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
  const result = await response.json();
  return result.secure_url;
}

async function generateImage(prompt) {
  const output = await replicate.run('google/nano-banana-pro', {
    input: { prompt, aspect_ratio: '4:5', resolution: '2K', output_format: 'jpg', safety_filter_level: 'block_only_high' }
  });
  if (typeof output === 'object' && Symbol.asyncIterator in output) {
    const chunks = [];
    for await (const chunk of output) {
      if (chunk instanceof Uint8Array) chunks.push(chunk);
      else if (typeof chunk === 'string') return chunk;
    }
    if (chunks.length > 0) {
      const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) { combined.set(chunk, offset); offset += chunk.length; }
      return `data:image/jpeg;base64,${Buffer.from(combined).toString('base64')}`;
    }
  }
  if (typeof output === 'string') return output;
  if (Array.isArray(output) && output[0]) return output[0];
  throw new Error('No output');
}

async function runTests() {
  console.log('🧪 TESTING CHEST/BODY VISIBLE - NO FACE\n');
  const results = [];
  
  for (const test of TESTS) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🔥 ${test.name}`);
    try {
      const imageData = await generateImage(test.prompt);
      const url = await uploadToCloudinary(imageData, test.name);
      console.log(`✅ PASSED: ${url}`);
      results.push({ name: test.name, status: 'PASSED', url });
    } catch (error) {
      if (error.message && error.message.includes('flagged')) {
        console.log(`❌ BLOCKED`);
        results.push({ name: test.name, status: 'BLOCKED' });
      } else {
        console.log(`❌ Error: ${error.message || error}`);
        results.push({ name: test.name, status: 'ERROR' });
      }
    }
  }
  
  console.log('\n\n📊 CHEST/BODY TESTS SUMMARY:');
  console.log('='.repeat(60));
  results.forEach(r => console.log(`${r.status === 'PASSED' ? '✅' : '❌'} ${r.name}: ${r.status}${r.url ? '\n   ' + r.url : ''}`));
}

runTests();
