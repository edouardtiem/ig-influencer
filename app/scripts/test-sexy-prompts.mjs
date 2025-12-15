#!/usr/bin/env node
/**
 * Test sexy prompts for Mila - 4 different scenarios
 * Based on inspiration images and prompt engineering techniques
 */

import Replicate from 'replicate';

const NANO_BANANA_MODEL = 'google/nano-banana-pro';

// Mila's reference photos
const PRIMARY_FACE_URL = 'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png';
const FACE_REFS = [
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_2_q8kxit.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767098/Photo_3_nopedx.png',
];

// Mila's character base (from docs)
const MILA_BASE = `Mila, 22 year old French woman, Mediterranean European features, 
copper auburn hair type 3A loose curls shoulder-length, 
almond-shaped hazel-green eyes with golden flecks, 
straight nose with slightly upturned tip, naturally full lips,
light tan Mediterranean skin tone with subtle freckles on nose and cheekbones,
small dark beauty mark above left lip corner,
thin gold necklace with minimalist star pendant,
slim athletic physique 168cm, natural full bust, defined waist, slight hourglass curve,
confident warm expression`;

// 4 test prompts using bypass techniques
const TEST_PROMPTS = [
  {
    name: "1_bedroom_morning_sheets",
    prompt: `${MILA_BASE},
lying in white linen sheets, soft morning light caressing her silhouette through sheer curtains,
wearing delicate lace bralette in cream color, fabric playing with shadows and light,
one shoulder bare, sheets draped elegantly, legs peeking from under duvet,
soft sleepy expression with gentle smile, eyes slightly hooded,
intimate bedroom ambiance, warm golden hour glow,
style photographie de mode, lumière tamisée, chiaroscuro effect,
sensualité naturelle, art photography, cinematic lighting,
ultra realistic, 8k, professional portrait, Instagram aesthetic`
  },
  {
    name: "2_bodysuit_coffee_window",
    prompt: `${MILA_BASE},
standing by large window in Parisian apartment, holding ceramic coffee cup,
wearing fitted ribbed bodysuit in heather gray, thin spaghetti straps,
fabric hugging natural curves elegantly, bare shoulders,
soft morning glow through sheer curtains creating rim light,
relaxed confident pose, looking pensively out window,
cozy intimate moment, sensualité naturelle,
art photography, editorial style, high fashion aesthetic,
ultra realistic, 8k, professional photography, natural skin texture`
  },
  {
    name: "3_couch_oversized_sweater",
    prompt: `${MILA_BASE},
curled up on velvet sofa in cozy Parisian living room,
oversized cream knit sweater slipping off one shoulder revealing skin,
bare toned legs tucked underneath, fabric draping suggestively,
soft confident smile, hand playing with hair,
warm evening light from candles, plants in background,
ambiance intime, style editorial, chiaroscuro lighting,
sensual but tasteful, natural feminine energy,
ultra realistic, 8k, professional photography, Instagram ready`
  },
  {
    name: "4_mirror_selfie_tank",
    prompt: `${MILA_BASE},
taking mirror selfie with phone in bedroom,
wearing fitted black ribbed tank top, thin straps, no visible bra, natural silhouette,
high-waisted cotton boyshort panties in matching black,
morning bedroom light streaming through window,
casual authentic moment, slight smirk, confident energy,
messy bed visible in background, authentic influencer aesthetic,
style instagram, intimate photography, natural lighting,
ultra realistic, 8k, candid feel, relatable content`
  }
];

async function urlToBase64(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const contentType = response.headers.get('content-type') || 'image/png';
  return `data:${contentType};base64,${base64}`;
}

async function generateImage(replicate, prompt, name) {
  console.log(`\n🎨 Generating: ${name}`);
  console.log(`   Prompt preview: ${prompt.substring(0, 100)}...`);
  
  // Prepare references
  const refs = [PRIMARY_FACE_URL, ...FACE_REFS];
  console.log(`   Converting ${refs.length} references to base64...`);
  
  const base64Refs = await Promise.all(refs.map(url => urlToBase64(url)));
  
  const input = {
    prompt,
    aspect_ratio: "4:5",
    resolution: "2K", 
    output_format: "jpg",
    safety_filter_level: "block_only_high",
    image_input: base64Refs,
  };

  const startTime = Date.now();
  const output = await replicate.run(NANO_BANANA_MODEL, { input });
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  // Handle output
  let imageUrl = null;
  if (typeof output === 'object' && Symbol.asyncIterator in output) {
    const chunks = [];
    for await (const chunk of output) {
      if (chunk instanceof Uint8Array) {
        chunks.push(chunk);
      } else if (typeof chunk === 'string') {
        imageUrl = chunk;
        break;
      }
    }
    if (!imageUrl && chunks.length > 0) {
      const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      imageUrl = `data:image/jpeg;base64,${Buffer.from(combined).toString('base64')}`;
    }
  } else if (typeof output === 'string') {
    imageUrl = output;
  } else if (Array.isArray(output) && output[0]) {
    imageUrl = output[0];
  }

  console.log(`   ✅ Generated in ${duration}s`);
  return imageUrl;
}

async function uploadToCloudinary(imageUrl, name) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.log(`   ⚠️ No Cloudinary credentials, returning raw URL`);
    return imageUrl;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'mila-test-sexy';
  const publicId = `${name}_${timestamp}`;
  
  const crypto = await import('crypto');
  const signatureString = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

  const formData = new FormData();
  formData.append('file', imageUrl);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  formData.append('folder', folder);
  formData.append('public_id', publicId);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    console.log(`   ⚠️ Cloudinary upload failed, returning raw URL`);
    return imageUrl;
  }

  const result = await response.json();
  console.log(`   ☁️ Uploaded: ${result.secure_url}`);
  return result.secure_url;
}

async function main() {
  console.log('🧪 Testing 4 sexy prompts for Mila\n');
  console.log('=' .repeat(60));

  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('❌ REPLICATE_API_TOKEN required');
    process.exit(1);
  }

  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  const results = [];

  for (const test of TEST_PROMPTS) {
    try {
      const imageUrl = await generateImage(replicate, test.prompt, test.name);
      const finalUrl = await uploadToCloudinary(imageUrl, test.name);
      results.push({ name: test.name, url: finalUrl, success: true });
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      results.push({ name: test.name, error: error.message, success: false });
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTS\n');
  
  for (const r of results) {
    if (r.success) {
      console.log(`✅ ${r.name}`);
      console.log(`   ${r.url}\n`);
    } else {
      console.log(`❌ ${r.name}: ${r.error}\n`);
    }
  }
}

main();
