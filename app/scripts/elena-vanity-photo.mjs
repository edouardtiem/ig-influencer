#!/usr/bin/env node
/**
 * Generate single photo: Elena lingerie vanity from behind
 */

import 'dotenv/config';
import Replicate from 'replicate';
import crypto from 'crypto';

const ELENA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png';
const ELENA_BODY_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png';

const REFERENCE_INSTRUCTION = `You are provided with reference images in order:

**IMAGE 1 (FACE REFERENCE)**: This is Elena's face. Copy this EXACTLY:
- Same soft round pleasant face shape
- Same honey brown warm almond-shaped eyes
- Same naturally full lips nude-pink color
- Same small beauty mark on right cheekbone
- Same bronde hair with golden blonde balayage

**IMAGE 2 (BODY REFERENCE)**: This is Elena's body. Match these proportions EXACTLY.

CRITICAL: Face MUST be identical to Image 1. Body proportions MUST match Image 2.`;

const ELENA_BASE = `soft round pleasant face, warm approachable features,
bronde hair dark roots with golden blonde balayage styled up in elegant messy bun,
honey brown warm eyes, naturally thick eyebrows,
small beauty mark on right cheekbone,
gold chunky chain bracelet on left wrist,
feminine athletic figure, toned silhouette`;

const ELENA_FINAL_CHECK = `FINAL CHECK - MUST MATCH REFERENCES:
- Face: IDENTICAL to Image 1 (soft round face, visible in mirror)
- Body: IDENTICAL to Image 2 (feminine figure)
- Hair: bronde with golden blonde balayage in updo
- Jewelry: gold bracelet on wrist visible`;

const prompt = `${REFERENCE_INSTRUCTION}

SUBJECT: Elena, 24 year old Italian woman,
${ELENA_BASE},

SETTING: Luxurious Parisian bathroom, white marble walls, gold fixtures, large Hollywood vanity mirror with warm globe lights, soft morning light, elegant Parisian apartment aesthetic, beauty products on marble counter,

OUTFIT: matching black athletic set, fitted sports bra top and minimal high-cut athletic briefs brazilian cut style, athletic morning look showing toned figure,

CAMERA ANGLE: Three-quarter back view, showing her silhouette from behind as she faces the mirror, her reflection visible in vanity mirror,

ACTION: Standing at vanity mirror getting ready, one hand raised touching her hair or applying makeup, looking at her reflection, natural candid morning beauty routine moment,

EXPRESSION: soft focused expression visible in mirror reflection, intimate morning moment,

STYLE: lifestyle photography, warm golden lighting from vanity bulbs, morning routine aesthetic, behind-the-scenes getting ready moment, natural and elegant,

${ELENA_FINAL_CHECK}`;

async function urlToBase64(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;
}

async function uploadToCloudinary(imageDataUrl) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'elena-fanvue-free';
  const publicId = `vanity_thong-${timestamp}`;
  const signatureString = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(signatureString).digest('hex');
  const formData = new FormData();
  formData.append('file', imageDataUrl);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  formData.append('folder', folder);
  formData.append('public_id', publicId);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
  const result = await response.json();
  return result.secure_url;
}

async function main() {
  console.log('🖼️ Generating: Elena Vanity Lingerie (from behind)...');
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  console.log('  Loading references...');
  const base64Refs = await Promise.all([urlToBase64(ELENA_FACE_REF), urlToBase64(ELENA_BODY_REF)]);
  
  console.log('  Generating image...');
  const output = await replicate.run('google/nano-banana-pro', {
    input: {
      prompt,
      aspect_ratio: '4:5',
      resolution: '2K',
      output_format: 'jpg',
      safety_filter_level: 'block_only_high',
      image_input: base64Refs,
    }
  });
  
  // Handle streamed output
  const chunks = [];
  for await (const chunk of output) {
    if (chunk instanceof Uint8Array) chunks.push(chunk);
  }
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) { combined.set(chunk, offset); offset += chunk.length; }
  const imageUrl = `data:image/jpeg;base64,${Buffer.from(combined).toString('base64')}`;
  
  console.log('  ✅ Generated! Uploading to Cloudinary...');
  const cloudinaryUrl = await uploadToCloudinary(imageUrl);
  console.log('  ✅ Done!');
  console.log('\n📸 URL:', cloudinaryUrl);
}

main().catch(e => console.error('❌ Error:', e.message));

