#!/usr/bin/env node
/**
 * TEST: Trending Carousel Generator for Elena
 * Uses Perplexity to find trending locations/outfits/poses
 * Then generates a carousel with Nano Banana Pro
 * 
 * Usage: node scripts/test-trending-carousel.mjs
 */

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

const CAROUSEL_SIZE = 3;
const NANO_BANANA_MODEL = 'google/nano-banana-pro';
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

// Elena's reference photos
const ELENA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png';
const ELENA_BODY_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png';

// ═══════════════════════════════════════════════════════════════
// ELENA CHARACTER DESCRIPTION
// ═══════════════════════════════════════════════════════════════

const ELENA_FACE = `soft round pleasant face NOT angular, warm approachable features,
smooth feminine jawline, rounded chin, soft cheekbones,
bronde hair dark roots with golden blonde balayage, long voluminous beach waves past shoulders,
honey brown warm almond-shaped eyes, naturally thick eyebrows well-groomed,
small straight nose, naturally full lips nude-pink color`;

const ELENA_MARKS = `small beauty mark on right cheekbone (SIGNATURE),
glowing sun-kissed Italian skin tone,
gold chunky chain bracelet on left wrist ALWAYS visible,
layered gold necklaces with medallion pendant ALWAYS visible`;

const ELENA_BODY = `feminine shapely figure 172cm tall,
very large natural F-cup breasts prominent and natural shape,
narrow defined waist, wide feminine hips,
healthy fit Italian body, confident posture`;

const ELENA_BASE = `${ELENA_FACE},
${ELENA_MARKS},
${ELENA_BODY}`;

const REFERENCE_INSTRUCTION = `You are provided with reference images in order:

**IMAGE 1 (FACE REFERENCE)**: This is Elena's face. Copy this EXACTLY:
- Same soft round pleasant face shape (NOT angular, NOT sharp jawline)
- Same honey brown warm almond-shaped eyes
- Same naturally full lips nude-pink color
- Same small beauty mark on right cheekbone (SIGNATURE MARK)
- Same bronde hair with VISIBLE golden blonde balayage highlights

**IMAGE 2 (BODY REFERENCE)**: This is Elena's body. Match these proportions EXACTLY:
- Same feminine shapely figure (NOT skinny)
- Same very large natural F-cup breasts (prominent)
- Same narrow defined waist
- Same wide feminine hips

CRITICAL RULES:
- Face MUST be identical to Image 1
- Body proportions MUST match Image 2
- Hair MUST show visible golden blonde balayage highlights`;

const ELENA_FINAL_CHECK = `FINAL CHECK - MUST MATCH REFERENCES:
- SINGLE IMAGE ONLY - NO collages, NO grids
- Face: IDENTICAL to Image 1 (soft round face, NOT angular)
- Body: IDENTICAL to Image 2 (shapely with very large bust visible)
- Hair: bronde with VISIBLE golden blonde balayage highlights
- Beauty mark: on right cheekbone MUST be visible
- Jewelry: gold chunky bracelet, layered gold necklaces`;

// ═══════════════════════════════════════════════════════════════
// IPHONE STYLE (from scheduled-post.mjs / Content Brain)
// ═══════════════════════════════════════════════════════════════

const IPHONE_STYLE = `STYLE: Shot on iPhone 15 Pro, RAW unedited authentic look
- NO Instagram filters, NO heavy color grading, natural flat colors
- Real indoor/outdoor lighting mixed naturally (warm lamps, cool daylight)
- Environment VISIBLE around subject - show the room, objects, messy details
- Subject takes 50-70% of frame, NOT perfectly centered, breathing room around
- Natural skin with texture and imperfections (not airbrushed smooth)
- Visible grain/noise in shadows (authentic low-light iPhone feel)
- Candid energy like friend took it without warning
- Show real environment details: furniture, plants, urban backdrop`;

const CANDID_EXPRESSIONS = [
  // NOT looking at camera
  'gazing out window, profile view, lost in thought, contemplative',
  'looking over shoulder caught off-guard, surprised candid moment',
  'eyes closed peaceful smile, enjoying the moment',
  'side profile looking away, unposed natural moment',
  'looking at something off-frame, curious expression, distracted',
  // Natural imperfect moments
  'genuine laugh mid-burst, eyes squeezed, mouth open, authentic joy',
  'scrunched nose smile, silly playful moment, goofy energy',
  'mid-blink, natural imperfect moment, real life',
  'sleepy soft eyes, just woke up, natural morning face',
  'resting face, neutral expression, not posing, authentic',
  // Some camera contact but relaxed
  'soft relaxed gaze, not trying too hard, effortless',
  'slight smirk, knowing look, comfortable confidence',
];

// ═══════════════════════════════════════════════════════════════
// SAFE SEXY VOCABULARY (from docs/19-QUALITY-SEXY-STRATEGY.md)
// ═══════════════════════════════════════════════════════════════

function sanitizeForNanoBanana(text, level = 'normal') {
  let safe = text;
  
  // Level 1: Normal sanitization
  safe = safe.replace(/\bsensual\b/gi, 'captivating');
  safe = safe.replace(/\bseductive\b/gi, 'alluring');
  safe = safe.replace(/\bsexy\b/gi, 'striking');
  safe = safe.replace(/\bhot\b/gi, 'radiant');
  safe = safe.replace(/\blingerie\b/gi, 'intimate sleepwear');
  safe = safe.replace(/\bunderwear\b/gi, 'delicate loungewear');
  safe = safe.replace(/\bbikini\b/gi, 'elegant swimwear');
  safe = safe.replace(/\bcleavage\b/gi, 'elegant décolleté');
  safe = safe.replace(/\bbare legs\b/gi, 'long toned legs visible');
  safe = safe.replace(/\bnaked\b/gi, 'natural');
  safe = safe.replace(/\bnude\b/gi, 'natural skin');
  
  // Level 2: Safer fallback (more aggressive)
  if (level === 'safer') {
    safe = safe.replace(/\bsheer\b/gi, 'soft');
    safe = safe.replace(/\btransparent\b/gi, 'light');
    safe = safe.replace(/\bsee-through\b/gi, 'delicate');
    safe = safe.replace(/\bsleepwear\b/gi, 'loungewear');
    safe = safe.replace(/\bintimate\b/gi, 'cozy');
    safe = safe.replace(/\bbralette\b/gi, 'soft top');
    safe = safe.replace(/\bbodysuit\b/gi, 'fitted top');
    safe = safe.replace(/\blow-cut\b/gi, 'elegant');
    safe = safe.replace(/\bplunging\b/gi, 'v-neck');
    safe = safe.replace(/\brevealing\b/gi, 'stylish');
    safe = safe.replace(/\bcurves\b/gi, 'silhouette');
    safe = safe.replace(/\bbust\b/gi, 'figure');
    safe = safe.replace(/\bbreasts\b/gi, 'figure');
  }
  
  return safe;
}

// ═══════════════════════════════════════════════════════════════
// PERPLEXITY: FETCH TRENDING CONTENT
// ═══════════════════════════════════════════════════════════════

async function fetchTrendingContent() {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    console.error('❌ PERPLEXITY_API_KEY not found');
    return null;
  }

  // Locations to avoid (simulate last 5 posts)
  const avoidList = ['Bali villa', 'Paris apartment', 'yacht deck', 'spa bathroom', 'Courchevel ski resort', 'rooftop helipad'];

  const systemPrompt = `You are an Instagram content strategist specializing in sexy-but-tasteful model content. You help create content that maximizes engagement while staying within IG guidelines. You understand "safe sexy vocabulary" for AI image generation.`;

  const userPrompt = `I need fresh content ideas for Elena Visconti (@elenav.paris), a 24yo curvy Italian model based in Paris.

Her aesthetic: "Street-luxe Paris Mannequin 2025" - glamorous, warm, confident, curves emphasized tastefully.
Target audience: Men 26-35yo with disposable income.
Goal: Build audience for premium content monetization.

AVOID these locations (already used): ${avoidList.join(', ')}

Based on what's trending RIGHT NOW on Instagram (January 2026), give me:

## 1. TRENDING LOCATIONS (3)
- Visually stunning, aspirational
- Works well for revealing outfits
- Think FRESH: NOT Bali, yacht, Paris apartment, spa, ski resort, rooftop

## 2. TRENDING "PETITES TENUES" (3)
I want REVEALING but IG-safe outfits. Think:
- Bikini styles (what cuts/colors are viral for curvy models?)
- Lingerie-inspired looks (what's trending that reads as fashion?)
- Sport underwear / athletic intimates
- Bodysuits, bralettes with skirts, etc.

IMPORTANT: Return promptFragment using SAFE VOCABULARY for AI generation:
- "bikini" → "elegant high-cut swimwear"
- "lingerie" → "intimate sleepwear" or "delicate loungewear"
- "underwear" → "athletic loungewear set"
- "bra" → "soft support top" or "sculpted bralette"

## 3. TRENDING POSES (3)
- Sensual but not explicit
- Good for curvy body types
- Currently viral

## 4. CAPTION
Write ONE caption for Elena for this photoshoot:
- English primarily (can mix French for charm)
- Hook in first line
- Mini-story format (2-3 lines)
- End with soft CTA toward her private like: "The rest of this set is on my private. 🖤"

Format as JSON:
{
  "locations": [
    { "name": "...", "description": "...", "whyTrending": "...", "promptFragment": "..." }
  ],
  "outfits": [
    { "name": "...", "description": "...", "whyTrending": "...", "promptFragment": "safe vocabulary description for AI" }
  ],
  "poses": [
    { "name": "...", "description": "...", "whyTrending": "...", "promptFragment": "..." }
  ],
  "caption": "full caption text here"
}

Only return valid JSON.`;

  try {
    console.log('🔍 Fetching trending content from Perplexity...\n');
    
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 2500,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Perplexity API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('❌ No content in response');
      return null;
    }

    // Parse JSON from response
    let jsonStr = content;
    if (content.includes('```json')) {
      jsonStr = content.split('```json')[1].split('```')[0];
    } else if (content.includes('```')) {
      jsonStr = content.split('```')[1].split('```')[0];
    }

    const parsed = JSON.parse(jsonStr.trim());
    console.log('✅ Perplexity returned trending content\n');
    return parsed;

  } catch (error) {
    console.error('❌ Perplexity Error:', error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// BUILD ELENA PROMPT
// ═══════════════════════════════════════════════════════════════

function buildPrompt(location, outfit, pose, photoIndex, saferMode = false) {
  // Pick candid expression (mostly NOT looking at camera)
  const expression = CANDID_EXPRESSIONS[photoIndex % CANDID_EXPRESSIONS.length];

  const prompt = `${REFERENCE_INSTRUCTION}

Instagram photo, young woman 24 years old Italian origin living in Paris successful model,

${ELENA_BASE},

OUTFIT: ${outfit.promptFragment},

SETTING: ${location.promptFragment},

ACTION: ${pose.promptFragment}
This is a dynamic moment, NOT a static pose. Capture her mid-action, natural movement, authentic moment.

EXPRESSION: ${expression}

${IPHONE_STYLE}

EXPRESSION AUTHENTICITY (CRITICAL):
- NOT always looking at camera - can look out window, away, down, at something off-frame
- Natural imperfect moments: mid-blink, mid-laugh are GOOD
- NO forced smiles - relaxed authentic expressions
- Can be caught off-guard, distracted, absorbed in thought

AVOID: Professional studio look, magazine editorial, stock photo vibes, heavy retouching, perfect centering, overly clean backgrounds, saturated colors, forced posed expressions

QUALITY: high resolution, 4:5 aspect ratio Instagram format,

${ELENA_FINAL_CHECK}`;

  return sanitizeForNanoBanana(prompt, saferMode ? 'safer' : 'normal');
}

// ═══════════════════════════════════════════════════════════════
// CLOUDINARY UPLOAD
// ═══════════════════════════════════════════════════════════════

async function uploadToCloudinary(imageData) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Missing Cloudinary credentials');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'elena-trending-test';
  
  const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

  const formData = new FormData();
  formData.append('file', imageData);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudinary upload failed: ${error}`);
  }

  const result = await response.json();
  return result.secure_url;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

async function urlToBase64(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;
}

function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// ═══════════════════════════════════════════════════════════════
// IMAGE GENERATION
// ═══════════════════════════════════════════════════════════════

async function generateImage(replicate, prompt, base64Images) {
  const input = {
    prompt,
    aspect_ratio: '4:5',
    resolution: '2K',
    output_format: 'jpg',
    safety_filter_level: 'block_only_high',
  };

  if (base64Images && base64Images.length > 0) {
    input.image_input = base64Images;
  }

  const output = await replicate.run(NANO_BANANA_MODEL, { input });

  if (!output) {
    throw new Error('No output from Nano Banana Pro');
  }

  // Handle async iterator (streamed output)
  if (typeof output === 'object' && Symbol.asyncIterator in output) {
    const chunks = [];
    for await (const chunk of output) {
      if (chunk instanceof Uint8Array) {
        chunks.push(chunk);
      } else if (typeof chunk === 'string') {
        return chunk;
      }
    }
    
    if (chunks.length > 0) {
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      const base64 = Buffer.from(combined).toString('base64');
      return `data:image/jpeg;base64,${base64}`;
    }
  }

  if (typeof output === 'string') return output;
  if (Array.isArray(output) && output[0]) return output[0];

  throw new Error('Unexpected output format');
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('🔥 ELENA TRENDING CAROUSEL TEST');
  console.log('════════════════════════════════════════════════════════════\n');

  // 1. Fetch trending content from Perplexity
  const trending = await fetchTrendingContent();
  
  if (!trending) {
    console.error('❌ Failed to fetch trending content');
    process.exit(1);
  }

  // Display what Perplexity found
  console.log('📍 TRENDING LOCATION:', trending.locations[0].name);
  console.log('   ', trending.locations[0].whyTrending);
  console.log('\n👙 PETITE TENUE 1:', trending.outfits[0].name);
  console.log('   ', trending.outfits[0].whyTrending);
  console.log('\n👙 PETITE TENUE 2:', trending.outfits[1]?.name || 'N/A');
  console.log('\n👙 PETITE TENUE 3:', trending.outfits[2]?.name || 'N/A');
  console.log('\n💃 TRENDING POSE:', trending.poses[0].name);
  console.log('   ', trending.poses[0].whyTrending);
  
  if (trending.caption) {
    console.log('\n✍️  CAPTION:');
    console.log('─'.repeat(50));
    console.log(trending.caption);
    console.log('─'.repeat(50));
  }
  console.log('\n');

  // 2. Initialize Replicate
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  // 3. Prepare Elena's reference images
  console.log('🖼️  Loading Elena reference images...');
  const faceBase64 = await urlToBase64(ELENA_FACE_REF);
  const bodyBase64 = await urlToBase64(ELENA_BODY_REF);
  const base64Images = [faceBase64, bodyBase64];
  console.log('✅ References loaded\n');

  // 4. Generate carousel images
  const cloudinaryUrls = [];
  
  // Pick one location, but vary outfits and poses for carousel variety
  const location = trending.locations[0];
  
  for (let i = 0; i < CAROUSEL_SIZE; i++) {
    const outfit = trending.outfits[i % trending.outfits.length];
    const pose = trending.poses[i % trending.poses.length];
    
    console.log(`🎨 Generating image ${i + 1}/${CAROUSEL_SIZE}...`);
    console.log(`   Location: ${location.name}`);
    console.log(`   Outfit: ${outfit.name}`);
    console.log(`   Pose: ${pose.name}`);
    
    // Try normal mode first
    let prompt = buildPrompt(location, outfit, pose, i, false);
    
    try {
      const imageData = await generateImage(replicate, prompt, base64Images);
      console.log('   ✅ Image generated');
      
      // Upload to Cloudinary
      console.log('   📤 Uploading to Cloudinary...');
      const cloudinaryUrl = await uploadToCloudinary(imageData);
      cloudinaryUrls.push(cloudinaryUrl);
      console.log('   ✅ Uploaded\n');
      
    } catch (error) {
      // If flagged, retry with safer mode
      if (error.message.includes('flagged') || error.message.includes('sensitive')) {
        console.log('   ⚠️  Flagged! Retrying with safer prompt...');
        
        try {
          prompt = buildPrompt(location, outfit, pose, i, true); // safer mode
          const imageData = await generateImage(replicate, prompt, base64Images);
          console.log('   ✅ Image generated (safer mode)');
          
          console.log('   📤 Uploading to Cloudinary...');
          const cloudinaryUrl = await uploadToCloudinary(imageData);
          cloudinaryUrls.push(cloudinaryUrl);
          console.log('   ✅ Uploaded\n');
          
        } catch (retryError) {
          console.error(`   ❌ Safer mode also failed: ${retryError.message}\n`);
        }
      } else {
        console.error(`   ❌ Error: ${error.message}\n`);
      }
    }
  }

  // 5. Output results
  console.log('════════════════════════════════════════════════════════════');
  console.log('📸 CLOUDINARY URLS');
  console.log('════════════════════════════════════════════════════════════\n');
  
  cloudinaryUrls.forEach((url, i) => {
    console.log(`${i + 1}. ${url}`);
  });
  
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('✍️  CAPTION');
  console.log('════════════════════════════════════════════════════════════\n');
  console.log(trending.caption || 'No caption generated');
  
  console.log('\n════════════════════════════════════════════════════════════');
  console.log(`✅ Generated ${cloudinaryUrls.length}/${CAROUSEL_SIZE} images`);
  console.log('════════════════════════════════════════════════════════════\n');

  // Return just the URLs array for easy copy-paste
  console.log('\n📋 JSON OUTPUT:');
  console.log(JSON.stringify({
    urls: cloudinaryUrls,
    caption: trending.caption,
    location: trending.locations[0].name,
    outfits: trending.outfits.map(o => o.name),
  }, null, 2));
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
