#!/usr/bin/env node
/**
 * Generate 3 posts for tomorrow (Saturday)
 * - 13h: Lazy morning in bed (post-party recovery)
 * - 16h: Gym recovery workout
 * - 20h: Apéro at home with friends (casual sexy 2025)
 * 
 * Run with: node scripts/generate-tomorrow-posts.mjs
 */

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const FACE_REFERENCES = [
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_2_q8kxit.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767098/Photo_3_nopedx.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_4_pna4fo.png',
];

async function urlToBase64(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const contentType = response.headers.get('content-type') || 'image/png';
  return `data:${contentType};base64,${base64}`;
}

// Mila character base
const MILA_BASE = `Young French woman, 22 years old, copper auburn curly hair type 3A shoulder-length loose curls, hazel-green eyes with golden flecks, oval elongated face with high cheekbones, light tan Mediterranean skin, small beauty mark above left lip corner, light golden freckles on nose and cheekbones, thin gold necklace with star pendant, slim athletic physique, natural curves`;

// Instagram 2025 style - NOT AI-looking
const INSTAGRAM_2025 = `Amateur iPhone photo, heavy HDR glow, deeply crushed shadows, visible film grain, noise, Instagram 2025 aesthetic, candid unposed moment, imperfect framing, lo-fi quality, compression artifacts`;

// ═══════════════════════════════════════════════════════════════
// 3 POSTS FOR TOMORROW
// ═══════════════════════════════════════════════════════════════

const POSTS = [
  // ─────────────────────────────────────────────────────────────
  // 13h - Lazy morning in bed (post-party recovery)
  // Light: Soft winter daylight through window (grey December day)
  // ─────────────────────────────────────────────────────────────
  {
    name: 'lazy-morning-bed',
    time: '13h',
    prompt: `${INSTAGRAM_2025},

${MILA_BASE},

[SCENE] Lazy morning in bed, post-party recovery vibes, still waking up around noon.

[OUTFIT - COZY MORNING]
Oversized vintage band t-shirt or soft cotton shirt as pajama top, messy bedhead hair (curls slightly tangled and wild from sleep), bare shoulders visible, no makeup, natural morning face, sleepy eyes.

[POSE]
Lying in bed propped up on pillows, holding a large mug of coffee or tea with both hands near her face, cozy blanket pulled up, one shoulder peeking out of oversized shirt, soft sleepy smile, just woke up expression, phone nearby on bed taking lazy selfie.

[SETTING - BEDROOM]
Cozy Parisian apartment bedroom, white rumpled sheets and duvet, soft pillows, maybe a book or phone on the nightstand, warm cozy atmosphere.

[LIGHTING - 13h DECEMBER PARIS]
Soft diffused winter daylight coming through window with sheer curtains, grey overcast sky visible outside, gentle natural light on her face, soft shadows, cozy indoor atmosphere, NOT bright sunny - it's a grey December day in Paris.

[MOOD]
Post-party recovery, lazy Saturday, "I'm not moving today" energy, cozy and vulnerable, authentic morning moment, no filter no makeup realness.

--no tattoos, --no heavy makeup, --no perfect hair, --no fake looking, --no studio lighting, --no bright sunlight`,

    caption: `13h. Toujours au lit. No regrets. ☕️

Hier soir c'était... beaucoup 😅
Aujourd'hui c'est mode koala activé 🐨

Le café fait effet dans combien de temps déjà ?

.
.
.
#lazysaturday #weekendmood #postparty #coffeeinbed #parisienne #cozyvibes #bedhead #nofilter #saturdaymorning #recoveryday`
  },

  // ─────────────────────────────────────────────────────────────
  // 16h - Gym recovery workout
  // Light: Artificial gym lighting (it's almost dark outside)
  // ─────────────────────────────────────────────────────────────
  {
    name: 'gym-recovery',
    time: '16h',
    prompt: `${INSTAGRAM_2025},

${MILA_BASE},

[SCENE] Recovery workout at the gym, getting back on track after last night's party.

[OUTFIT - GYM WEAR]
Matching workout set - sports bra in dark burgundy or forest green color, high-waisted leggings same color, hair tied up in messy bun or ponytail, AirPods in ears, light sweat glow on skin, minimal gym makeup.

[POSE]
Standing in front of gym mirror taking a mirror selfie, one hand holding phone, other hand on hip or adjusting hair, confident but tired expression, "forcing myself to be here" energy, showing off toned athletic figure in gym wear.

[SETTING - GYM]
Modern fitness gym interior, weight machines and equipment visible in background, large mirrors, rubber flooring, other gym members blurred in background, typical commercial gym atmosphere.

[LIGHTING - 16h DECEMBER (ALMOST DARK)]
Artificial gym lighting - bright overhead fluorescent/LED lights, maybe glimpse of dark evening sky through gym windows (it's already getting dark at 16h in December Paris), harsh indoor lighting creating strong shadows, typical gym lighting aesthetic.

[MOOD]
Recovery workout energy, "sweating out the toxins", determined but exhausted, gym selfie culture, fitness influencer moment, back to routine after party.

--no tattoos, --no perfect skin, --no studio lighting, --no outdoor daylight, --no sunset glow`,

    caption: `16h. "Je vais juste faire une petite séance légère"

*fait 1h30 de sport*

Ok le corps a dit non mais j'ai dit oui 💪
Recovery workout = best workout (non?)

Qui d'autre fait du sport post-soirée ? 
Ou c'est juste moi qui suis folle ? 🙃

.
.
.
#gymlife #recoveryworkout #fitnessgirl #workoutmotivation #gymselfie #saturdayworkout #parisfit #fitfrenchgirl #legday #noexcuses`
  },

  // ─────────────────────────────────────────────────────────────
  // 20h - Apéro at home with friends (casual sexy 2025)
  // Light: Warm artificial indoor lighting, candles, cozy evening
  // ─────────────────────────────────────────────────────────────
  {
    name: 'apero-home-sexy',
    time: '20h',
    prompt: `${INSTAGRAM_2025},

${MILA_BASE},

[SCENE] Hosting apéro at her apartment, casual but sexy Saturday evening with friends.

[OUTFIT - CASUAL SEXY 2025]
Effortlessly sexy home hosting look: 
- Silky slip dress in champagne/nude color OR fitted ribbed tank top that shows her figure
- Maybe a cozy oversized cardigan draped off one shoulder
- Hair down and natural, soft waves
- Light natural makeup, glowy skin
- Barefoot or fuzzy slippers
- The vibe is "I just threw this on" but looks incredible

[POSE]
Sitting casually on her sofa or floor cushions, holding a glass of wine (red or rosé), relaxed confident pose, one leg tucked under, leaning back, looking at camera with a flirty knowing smile, hosting queen energy, maybe friends visible blurred in background or just their wine glasses on the coffee table.

[SETTING - PARISIAN APARTMENT EVENING]
Cozy Parisian apartment living room, warm ambient lighting from lamps, maybe some candles lit on coffee table, wine bottles and glasses visible, cheese board or snacks on table, fairy lights or soft lighting, intimate hosting atmosphere, Saturday night at home vibes.

[LIGHTING - 20h NIGHT (INDOOR)]
Warm artificial indoor lighting - soft lamp light, maybe candlelight glow, golden warm tones, cozy evening atmosphere, absolutely NO daylight (it's 20h in December = pitch black outside), windows showing dark night outside or curtains closed, intimate warm lighting on her face and body.

[MOOD]
Hosting apéro queen, casual but magnetic, effortlessly sexy without trying too hard, "come over I'm opening wine" energy, intimate Saturday night, French girl hosting aesthetic, confident and relaxed.

[SEXY 2025 VIBE]
Subtly alluring - the slip dress or tank shows her figure naturally, skin looks glowy and touchable, pose is relaxed but shows her body confidently, eye contact with camera is warm and inviting, sexy without being explicit - just naturally attractive woman having wine at home.

--no tattoos, --no heavy makeup, --no daylight, --no outdoor light, --no explicit, --no lingerie`,

    caption: `20h. Apéro time 🍷

"Venez on fait un truc chill à la maison"
→ 3h plus tard on refait le monde

Le samedi soir parfait c'est celui où tu restes en chaussettes 🧦✨

Vous êtes plutôt sortie ou cocooning ce soir ?

.
.
.
#saturdaynight #apero #homeparty #winenight #parisienne #cozynights #hostesswiththemostess #weekendvibes #frenchgirl #chillnight`
  }
];

// ═══════════════════════════════════════════════════════════════
// GENERATION
// ═══════════════════════════════════════════════════════════════

async function generateImage(replicate, post, references) {
  console.log(`\n📸 Generating: ${post.name} (${post.time})`);
  
  const startTime = Date.now();
  
  const output = await replicate.run("google/nano-banana-pro", {
    input: {
      prompt: post.prompt,
      image_input: references,
      aspect_ratio: "4:5",
      resolution: "2K",
      output_format: "jpg",
      safety_filter_level: "block_only_high",
    }
  });
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`   ⏱️  Generated in ${duration}s`);
  
  // Handle output
  if (typeof output === 'string') {
    return { type: 'url', data: output };
  } else if (Array.isArray(output) && typeof output[0] === 'string') {
    return { type: 'url', data: output[0] };
  } else if (output && typeof output === 'object' && Symbol.asyncIterator in output) {
    const chunks = [];
    for await (const chunk of output) {
      if (chunk instanceof Uint8Array) chunks.push(chunk);
    }
    if (chunks.length > 0) {
      const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      const outputDir = path.join(__dirname, '..', 'generated', 'tomorrow-posts');
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
      const filename = `${post.name}-${Date.now()}.jpg`;
      const imagePath = path.join(outputDir, filename);
      fs.writeFileSync(imagePath, combined);
      console.log(`   💾 Saved: ${filename}`);
      return { type: 'file', data: imagePath };
    }
  }
  throw new Error('Could not process output');
}

async function main() {
  console.log('📅 Generating 3 posts for tomorrow (Saturday)...\n');
  console.log('   13h - Lazy morning in bed (post-party)');
  console.log('   16h - Gym recovery workout');
  console.log('   20h - Apéro at home (casual sexy 2025)');
  
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    console.error('❌ REPLICATE_API_TOKEN not found');
    process.exit(1);
  }
  
  const replicate = new Replicate({ auth: apiToken });
  
  // Convert references
  console.log('\n📷 Converting reference images...');
  const base64References = await Promise.all(
    FACE_REFERENCES.map(async (url) => {
      return await urlToBase64(url);
    })
  );
  console.log('   ✅ Done');
  
  const results = [];
  
  for (const post of POSTS) {
    try {
      const imageResult = await generateImage(replicate, post, base64References);
      
      // Upload to Cloudinary
      console.log(`   📤 Uploading to Cloudinary...`);
      const uploadResult = await cloudinary.uploader.upload(imageResult.data, {
        folder: 'mila-posts/tomorrow',
        public_id: `${post.name}-${Date.now()}`,
        resource_type: 'image',
      });
      
      results.push({
        name: post.name,
        time: post.time,
        url: uploadResult.secure_url,
        caption: post.caption,
      });
      
      console.log(`   ✅ ${uploadResult.secure_url}`);
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      results.push({
        name: post.name,
        time: post.time,
        error: error.message,
      });
    }
  }
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📋 SUMMARY - Posts for tomorrow');
  console.log('═'.repeat(60));
  
  for (const r of results) {
    console.log(`\n⏰ ${r.time} - ${r.name}`);
    if (r.url) {
      console.log(`   📸 ${r.url}`);
      console.log(`   📝 ${r.caption.split('\n')[0]}...`);
    } else {
      console.log(`   ❌ Failed: ${r.error}`);
    }
  }
  
  // Save results
  const outputFile = path.join(__dirname, '..', 'generated', 'tomorrow-posts', 'results.json');
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  
  fs.writeFileSync(outputFile, JSON.stringify({
    generatedAt: new Date().toISOString(),
    forDate: 'Saturday (tomorrow)',
    posts: results,
  }, null, 2));
  
  console.log(`\n💾 Results saved to: ${outputFile}`);
  console.log('\n🎉 Done! Schedule these on Buffer for tomorrow.');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

