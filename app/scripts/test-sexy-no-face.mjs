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

const ELENA_BASE = `24 year old Italian model, feminine shapely curvy figure, hourglass silhouette,
bronde hair with golden blonde balayage, narrow waist, wide hips, full natural curves`;

// Tests with EXPLICIT "no face visible"
const TESTS = [
  {
    name: 'noface1-back-briefs-walking',
    prompt: `SUBJECT: Elena, ${ELENA_BASE},

SETTING: Luxury Parisian apartment, soft morning light, elegant decor

OUTFIT: tiny black lace brazilian briefs only, bare back and shoulders

COMPOSITION: Back shot from behind, walking away from camera, hair flowing down back, full back and curves visible, feminine silhouette
IMPORTANT: Face is NOT visible - shot from behind only, no face shown

STYLE: luxury lingerie editorial, intimate apparel campaign, Vogue quality

NEGATIVE: face visible, front view, skinny, thin, flat, low quality`
  },
  {
    name: 'noface2-bed-stomach-arched',
    prompt: `SUBJECT: Elena, ${ELENA_BASE},

SETTING: Elegant bedroom, white silk sheets, soft golden morning light

OUTFIT: minimal cheeky lace briefs, bare back

COMPOSITION: Lying on bed on stomach, back arched elegantly, legs bent up behind her, curves accentuated, hair spread on pillow
CRITICAL: Face buried in pillow or turned away - face NOT visible in shot

STYLE: luxury intimate editorial, bedroom photography, high-end lingerie campaign

NEGATIVE: face visible, face shown, skinny, thin, flat, low quality`
  },
  {
    name: 'noface3-mirror-back-only',
    prompt: `SUBJECT: Elena, ${ELENA_BASE},

SETTING: Luxury dressing room, large mirror, warm lighting

OUTFIT: black lace bralette with matching brazilian briefs, elegant lingerie set

COMPOSITION: Standing with back to camera, facing mirror, full back view visible, curves silhouette, hands adjusting hair
IMPORTANT: Camera sees her BACK only - face reflection in mirror is blurred or not visible

STYLE: intimate fashion editorial, lingerie lookbook, luxury brand

NEGATIVE: face visible, clear face, skinny, thin, flat, low quality`
  },
  {
    name: 'noface4-pool-bikini-behind',
    prompt: `SUBJECT: Elena, ${ELENA_BASE},

SETTING: Infinity pool, luxury resort, golden sunset, water reflections

OUTFIT: tiny brazilian bikini, cheeky cut bottoms, string ties

COMPOSITION: Standing at pool edge, back to camera, looking out at sunset horizon, full back and curves visible, wet skin glistening
CRITICAL: Shot from BEHIND - face not visible, only back of head and body shown

STYLE: swimwear campaign, luxury resort editorial, summer lifestyle

NEGATIVE: face visible, front view, skinny, thin, flat, low quality`
  },
  {
    name: 'noface5-towel-bathroom-back',
    prompt: `SUBJECT: Elena, ${ELENA_BASE},

SETTING: Luxury marble bathroom, steam, soft lighting, spa atmosphere

OUTFIT: small white towel barely covering, held at front, bare back fully visible

COMPOSITION: Back shot, walking towards shower, towel covering front only, entire bare back visible from shoulders to lower back, steam atmosphere
IMPORTANT: Face turned away or not visible - back view only

STYLE: luxury spa editorial, intimate moment, high-end hotel campaign

NEGATIVE: face visible, front view, skinny, thin, flat, low quality`
  },
  {
    name: 'noface6-sheets-sensual-back',
    prompt: `SUBJECT: Elena, ${ELENA_BASE},

SETTING: Luxury bedroom, cream silk sheets, soft morning light filtering through curtains

OUTFIT: nude colored minimal briefs, silk sheet draped low on hips

COMPOSITION: Lying on stomach, bare back fully exposed, sheet covering only lower body, one arm stretched above head, hair cascading on pillow
CRITICAL: Face hidden in pillow or cropped out - only body and back visible

STYLE: luxury lingerie editorial, intimate bedroom photography, artistic

NEGATIVE: face visible, face shown, skinny, thin, flat, low quality`
  }
];

async function uploadToCloudinary(imageData, name) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'elena-test-noface';
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
  console.log('🧪 TESTING SEXY NO-FACE SHOTS\n');
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
  
  console.log('\n\n📊 NO-FACE TESTS SUMMARY:');
  console.log('='.repeat(60));
  results.forEach(r => console.log(`${r.status === 'PASSED' ? '✅' : '❌'} ${r.name}: ${r.status}${r.url ? '\n   ' + r.url : ''}`));
}

runTests();
