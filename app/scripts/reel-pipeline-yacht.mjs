#!/usr/bin/env node
/**
 * Reel Pipeline - Yacht Golden Hour Scene
 * Generates: Perplexity research + Kling-Ready image + Kling video
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local from app directory
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
import Replicate from 'replicate';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Fallback research data for yacht golden hour scene
function getFallbackResearch() {
  return {
    hooks: [
      "Don't show this to your girlfriend",
      "POV: The sunset she doesn't want you to see",
      "This is why he's not answering your texts",
      "Not everyone gets an invite to watch the sunset",
      "The view from his yacht vs your balcony"
    ],
    caption: {
      hook: "Golden hour hits different on the Mediterranean.",
      body: "The champagne was cold. The sunset, warmer than his promises.\nI watched the coast disappear while the sky turned that perfect shade of rosé.\nSome moments are worth savoring alone.",
      cta: "The rest of this sunset is on my private. 🖤",
      hashtags: ["#yachtlife", "#goldenhour", "#mediterranean", "#luxurylifestyle", "#sunsetvibes", "#champagnemoments", "#travelblogger", "#jetset", "#cotedazur", "#bikinilife", "#summermood", "#influencer", "#lifestyle", "#wanderlust", "#oceanview", "#yachting", "#sunsetlover", "#coastalliving"]
    },
    music: [
      { song: "Lovers In A Past Life", artist: "Calvin Harris ft. Rag'n'Bone Man", vibe: "chill/sensual" },
      { song: "Water", artist: "Tyla", vibe: "sensual/confident" },
      { song: "Snooze", artist: "SZA", vibe: "chill/romantic" }
    ]
  };
}

// Scene context from carousel analysis
const SCENE_CONTEXT = `
Yacht deck at golden hour sunset. Mediterranean setting with distant mountains.
Elena wearing a black designer bikini with gold hardware/buckles.
Heavy gold jewelry: layered chain necklaces with medallion pendant, chunky gold bracelet.
Holding a champagne glass, leaning against yacht railing.
Warm orange-pink sunset sky, calm sea, luxury lifestyle aesthetic.
Jet-set, aspirational, sexy but elegant vibe.
`;

// ============================================================
// STEP 2: PERPLEXITY RESEARCH
// ============================================================
async function perplexityResearch() {
  console.log('\n📍 STEP 2: Perplexity Research...\n');
  
  const prompt = `I'm creating an Instagram Reel for a female lifestyle/travel influencer (Elena, 24yo, jet-set aesthetic).

SCENE: ${SCENE_CONTEXT}

I need:

1. **5 HOOK OPTIONS** (text overlays for the reel):
   - Style: provocative, flirty, "don't tell your girlfriend" energy
   - Format: short, punchy, creates curiosity
   - Mix of: FOMO hooks, question hooks, provocative statements
   - Examples of style I like: "Don't tell your girlfriend you stayed till the end", "POV: The view she doesn't want you to see"

2. **CAPTION** (for the Instagram post):
   - Language: English (can sprinkle French words for charm)
   - Format: Micro-story style
     - [HOOK] - 1 atmospheric line
     - [MICRO-STORY] - 2-4 lines, one precise moment
     - [SOFT CTA] - Tease to private content (e.g., "The rest of this set is on my private. 🖤")
   - Tone: mysterious, confident, sensual but elegant
   - Include 15-20 hashtags (mix trending + evergreen)

3. **3 TRENDING SONGS** that would fit this vibe:
   - Currently trending on Instagram Reels
   - Match the mood (chill, sensual, confident)
   - Include artist + song name

Format response as JSON:
{
  "hooks": ["hook1", "hook2", "hook3", "hook4", "hook5"],
  "caption": {
    "hook": "...",
    "body": "...",
    "cta": "...",
    "hashtags": ["#tag1", "#tag2", ...]
  },
  "music": [
    {"song": "Song Name", "artist": "Artist", "vibe": "chill/sensual/upbeat"},
    ...
  ]
}`;

  if (!process.env.PERPLEXITY_API_KEY) {
    console.log('⚠️  PERPLEXITY_API_KEY not found, using fallback data...');
    return getFallbackResearch();
  }

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [
        { 
          role: 'system', 
          content: 'You are an Instagram Reels trends expert specializing in viral content for female lifestyle influencers. You know what hooks, captions, and music are trending right now. Always respond with valid JSON only.' 
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1500,
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    console.log(`⚠️  Perplexity API error (${response.status}), using fallback data...`);
    return getFallbackResearch();
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0]) {
    console.log('⚠️  Invalid Perplexity response, using fallback data...');
    return getFallbackResearch();
  }
  
  const content = data.choices[0].message.content;
  
  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = content;
  if (content.includes('```json')) {
    jsonStr = content.split('```json')[1].split('```')[0].trim();
  } else if (content.includes('```')) {
    jsonStr = content.split('```')[1].split('```')[0].trim();
  }
  
  const result = JSON.parse(jsonStr);
  console.log('✅ Perplexity Research Complete');
  console.log('\n🪝 HOOKS:');
  result.hooks.forEach((h, i) => console.log(`   ${i+1}. "${h}"`));
  console.log('\n🎵 MUSIC:');
  result.music.forEach((m, i) => console.log(`   ${i+1}. ${m.song} - ${m.artist} (${m.vibe})`));
  
  return result;
}

// ============================================================
// STEP 3: GENERATE KLING-READY IMAGE (Nano Banana Pro)
// ============================================================
async function generateKlingReadyImage() {
  console.log('\n📍 STEP 3: Generating Kling-Ready Image...\n');
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  // Elena face references (from scheduled-post.mjs config)
  const faceRefUrls = [
    'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png', // Face
    'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png', // Body
  ];
  
  // Download face refs as base64 array
  const faceBase64Array = await Promise.all(
    faceRefUrls.map(async (url) => {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      return `data:image/jpeg;base64,${Buffer.from(buffer).toString('base64')}`;
    })
  );
  console.log(`  ✅ Loaded ${faceBase64Array.length} face references`);
  
  const prompt = `PHOTO: Professional lifestyle photography on a luxury yacht at golden hour sunset.

SETTING: Mediterranean yacht deck, warm orange-pink sunset sky, calm sea, distant mountains.

SUBJECT: Young elegant woman matching the reference images EXACTLY:
- Same face, same features as reference
- Long bronde wavy hair with golden balayage highlights
- Wearing elegant black swimwear with gold accents
- Gold jewelry: layered chain necklaces with medallion, chunky gold bracelet
- Natural elegant pose, holding champagne glass
- Standing at yacht railing, golden hour lighting on skin

COMPOSITION: 9:16 vertical portrait, full body from knees up, subject centered with space above head.

STYLE: High-end Instagram travel content, iPhone 15 Pro quality, authentic luxury lifestyle aesthetic, warm golden tones.

SINGLE IMAGE ONLY - no collages or multiple panels.`;

  console.log('Calling Nano Banana Pro...');
  
  const output = await replicate.run("google/nano-banana-pro", {
    input: {
      prompt: prompt,
      image_input: faceBase64Array,
      aspect_ratio: "9:16",
      output_format: "jpg",
      safety_filter_level: "block_only_high"
    }
  });

  // Handle output - can be URL string, array of URLs, or stream
  let imageBuffer;
  let imageUrl;
  
  if (typeof output === 'string') {
    imageUrl = output;
  } else if (Array.isArray(output) && typeof output[0] === 'string') {
    imageUrl = output[0];
  } else if (output && typeof output === 'object' && Symbol.asyncIterator in output) {
    // Stream output - collect chunks
    const chunks = [];
    for await (const chunk of output) {
      if (chunk instanceof Uint8Array) {
        chunks.push(chunk);
      } else if (typeof chunk === 'string') {
        imageUrl = chunk;
        break;
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
      imageBuffer = Buffer.from(combined);
    }
  }
  
  console.log('✅ Kling-Ready Image Generated');
  
  // Upload to Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  let uploadResult;
  if (imageUrl) {
    uploadResult = await cloudinary.uploader.upload(imageUrl, {
      folder: 'elena-reels',
      public_id: `kling-ready-yacht-${Date.now()}`,
    });
  } else if (imageBuffer) {
    const base64Upload = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
    uploadResult = await cloudinary.uploader.upload(base64Upload, {
      folder: 'elena-reels',
      public_id: `kling-ready-yacht-${Date.now()}`,
    });
  } else {
    throw new Error('No image output received from Nano Banana Pro');
  }
  
  console.log('✅ Uploaded to Cloudinary:', uploadResult.secure_url);
  
  return uploadResult.secure_url;
}

// ============================================================
// STEP 4: GENERATE VIDEO (Kling v2.5)
// ============================================================
async function generateKlingVideo(imageUrl) {
  console.log('\n📍 STEP 4: Generating Kling Video...\n');
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  const prompt = `SETTING: Luxury yacht deck at golden hour sunset, Mediterranean coast. Warm orange-pink sky, calm glittering sea.

ACTION (10 seconds):
- She slowly turns her head from looking at the horizon toward the camera
- A subtle confident smile forms on her lips
- Raises the champagne glass slightly, a graceful toast gesture
- Hair moves gently in the sea breeze
- Settles into a knowing look, maintaining eye contact
- Plays with her gold necklace briefly with free hand

STYLE: Instagram Reel 2026 aesthetic
- iPhone video quality, authentic content vibe
- Natural casual movement, "caught on camera" feel
- Main character energy, effortless cool
- Focus on her body and figure, curves emphasized

SPEED CRITICAL:
- REAL-TIME SPEED only, NO slow motion
- Normal human movement pace

MOVEMENTS:
- Gentle breathing visible in chest/shoulders
- Hair flowing naturally in breeze
- Subtle weight shift from hip to hip
- Soft confident micro-expressions
- Water glittering in background

CAMERA:
- Mostly static
- Very subtle slow push-in toward subject
- Frame emphasizes her figure naturally`;

  console.log('Calling Kling v2.5...');
  console.log('Image URL:', imageUrl);
  
  const output = await replicate.run("kwaivgi/kling-v2.5-turbo-pro", {
    input: {
      prompt: prompt,
      image: imageUrl,
      duration: 10,
      aspect_ratio: "9:16"
    }
  });

  console.log('✅ Kling Video Generated:', output);
  
  return output;
}

// ============================================================
// MAIN PIPELINE
// ============================================================
async function main() {
  console.log('🎬 REEL PIPELINE - YACHT GOLDEN HOUR\n');
  console.log('='.repeat(50));
  
  try {
    // Step 2: Perplexity Research
    const research = await perplexityResearch();
    
    // Step 3: Generate Kling-Ready Image
    const klingReadyImageUrl = await generateKlingReadyImage();
    
    // Step 4: Generate Kling Video
    const videoUrl = await generateKlingVideo(klingReadyImageUrl);
    
    // Final Output
    console.log('\n' + '='.repeat(50));
    console.log('🎬 REEL PIPELINE COMPLETE!\n');
    
    console.log('📊 RESULTS:');
    console.log('─'.repeat(40));
    console.log(`🖼️  Kling-Ready Image: ${klingReadyImageUrl}`);
    console.log(`📹 Video: ${videoUrl}`);
    console.log('─'.repeat(40));
    
    console.log('\n🪝 HOOKS (choose 1):');
    research.hooks.forEach((h, i) => console.log(`   ${i+1}. "${h}"`));
    
    console.log('\n📝 CAPTION:');
    console.log(`${research.caption.hook}\n`);
    console.log(`${research.caption.body}\n`);
    console.log(`${research.caption.cta}\n`);
    console.log(research.caption.hashtags.join(' '));
    
    console.log('\n🎵 MUSIC SUGGESTIONS:');
    research.music.forEach((m, i) => console.log(`   ${i+1}. ${m.song} - ${m.artist} (${m.vibe})`));
    
    console.log('\n💰 COSTS:');
    console.log('   - Nano Banana Pro: ~$0.10');
    console.log('   - Kling v2.5: ~$1.00');
    console.log('   - TOTAL: ~$1.10');
    
    // Save results to file
    const results = {
      timestamp: new Date().toISOString(),
      sourceImage: 'https://res.cloudinary.com/dily60mr0/image/upload/v1767899873/elena-scheduled/carousel-1-1767899873.jpg',
      klingReadyImage: klingReadyImageUrl,
      video: videoUrl,
      research,
    };
    
    const outputPath = path.join(process.cwd(), 'generated', `reel-yacht-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Results saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Pipeline Error:', error);
    throw error;
  }
}

main();
