#!/usr/bin/env node
/**
 * Retry the 2 failed posts with adjusted prompts
 * - 13h: Lazy morning (safer prompt)
 * - 16h: Gym recovery (safer prompt)
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

const MILA_BASE = `Young French woman, 22 years old, copper auburn curly hair type 3A shoulder-length, hazel-green eyes with golden flecks, oval face with high cheekbones, light tan Mediterranean skin, small beauty mark above left lip, light freckles on nose, thin gold star necklace, slim athletic physique`;

const INSTAGRAM_2025 = `Amateur iPhone photo, heavy HDR glow, deeply crushed shadows, visible film grain, noise, Instagram 2025 aesthetic, candid moment, imperfect framing, lo-fi quality`;

// Adjusted prompts - safer for filter
const POSTS = [
  // 13h - Cozy morning with coffee (NOT in bed - on sofa instead)
  {
    name: 'cozy-morning-coffee',
    time: '13h',
    prompt: `${INSTAGRAM_2025},

${MILA_BASE},

[SCENE] Cozy late morning at home, Saturday recovery vibes, relaxing with coffee.

[OUTFIT]
Oversized cozy knit sweater in cream color, comfortable loungewear pants, fuzzy socks, messy natural hair with sleep waves, no makeup natural face, casual weekend look.

[POSE]
Sitting curled up on a comfortable sofa with a large mug of coffee held with both hands, legs tucked under her, soft sleepy smile, cozy blanket nearby, relaxed weekend morning pose, looking at camera with tired but content expression.

[SETTING]
Cozy Parisian apartment living room, comfortable sofa with cushions, soft blanket, morning light through windows, coffee table with book or phone, warm homey atmosphere.

[LIGHTING - 13h DECEMBER]
Soft grey winter daylight through windows, overcast December sky outside, gentle diffused natural light, soft indoor shadows, cozy winter morning atmosphere.

[MOOD]
Lazy Saturday, post-party recovery, coffee is life, cozy weekend energy, authentic morning moment.

--no tattoos, --no makeup, --no explicit`,

    caption: `13h. Toujours au lit. No regrets. ☕️

Hier soir c'était... beaucoup 😅
Aujourd'hui c'est mode koala activé 🐨

Le café fait effet dans combien de temps déjà ?

.
.
.
#lazysaturday #weekendmood #postparty #coffeetime #parisienne #cozyvibes #saturdaymorning #recoveryday`
  },

  // 16h - Gym selfie (full coverage gym wear)
  {
    name: 'gym-workout',
    time: '16h',
    prompt: `${INSTAGRAM_2025},

${MILA_BASE},

[SCENE] Workout at the gym, Saturday afternoon fitness session.

[OUTFIT - FULL COVERAGE GYM]
Long sleeve fitted athletic top in dark green or navy blue, high-waisted black leggings, hair in high ponytail, wireless earbuds, light sweat glow, athletic shoes visible.

[POSE]
Standing mirror selfie in gym, holding phone to take photo, other hand on hip, confident athletic stance, slight smile, showing full workout outfit, fitness influencer gym selfie moment.

[SETTING]
Modern gym interior with weight equipment and machines in background, large wall mirrors, rubber flooring, typical fitness center environment.

[LIGHTING - 16h DECEMBER EVENING]
Bright artificial gym lighting, overhead LED lights, it is dark outside visible through gym windows (December evening), harsh indoor fluorescent lighting creating defined shadows.

[MOOD]
Fitness motivation, gym selfie culture, workout complete energy, athletic confidence.

--no tattoos, --no explicit, --no revealing clothing`,

    caption: `16h. "Je vais juste faire une petite séance légère"

*fait 1h30 de sport*

Ok le corps a dit non mais j'ai dit oui 💪
Recovery workout = best workout (non?)

Qui d'autre fait du sport post-soirée ? 
Ou c'est juste moi qui suis folle ? 🙃

.
.
.
#gymlife #recoveryworkout #fitnessgirl #workoutmotivation #gymselfie #saturdayworkout #parisfit #fitfrenchgirl #noexcuses`
  }
];

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
  console.log('🔄 Retrying 2 failed posts...\n');
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  console.log('📷 Converting references...');
  const refs = await Promise.all(FACE_REFERENCES.map(urlToBase64));
  console.log('   ✅ Done');
  
  const results = [];
  
  for (const post of POSTS) {
    try {
      const result = await generateImage(replicate, post, refs);
      
      console.log(`   📤 Uploading...`);
      const upload = await cloudinary.uploader.upload(result.data, {
        folder: 'mila-posts/tomorrow',
        public_id: `${post.name}-${Date.now()}`,
      });
      
      results.push({ ...post, url: upload.secure_url });
      console.log(`   ✅ ${upload.secure_url}`);
      
    } catch (error) {
      console.error(`   ❌ ${error.message}`);
      results.push({ ...post, error: error.message });
    }
  }
  
  // Add the successful apero post from before
  const aperoUrl = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765541605/mila-posts/tomorrow/apero-home-sexy-1765541604044.jpg';
  
  console.log('\n' + '═'.repeat(60));
  console.log('📋 ALL 3 POSTS FOR TOMORROW');
  console.log('═'.repeat(60));
  
  for (const r of results) {
    console.log(`\n⏰ ${r.time} - ${r.name}`);
    if (r.url) {
      console.log(`   📸 ${r.url}`);
      console.log(`   📝 ${r.caption.split('\n')[0]}...`);
    } else {
      console.log(`   ❌ ${r.error}`);
    }
  }
  
  console.log(`\n⏰ 20h - apero-home-sexy`);
  console.log(`   📸 ${aperoUrl}`);
  console.log(`   📝 20h. Apéro time 🍷...`);
  
  // Save all
  const outputFile = path.join(__dirname, '..', 'generated', 'tomorrow-posts', 'all-results.json');
  fs.writeFileSync(outputFile, JSON.stringify({
    generatedAt: new Date().toISOString(),
    posts: [
      ...results,
      {
        name: 'apero-home-sexy',
        time: '20h',
        url: aperoUrl,
        caption: `20h. Apéro time 🍷\n\n"Venez on fait un truc chill à la maison"\n→ 3h plus tard on refait le monde\n\nLe samedi soir parfait c'est celui où tu restes en chaussettes 🧦✨\n\nVous êtes plutôt sortie ou cocooning ce soir ?\n\n.\n.\n.\n#saturdaynight #apero #homeparty #winenight #parisienne #cozynights #weekendvibes`
      }
    ]
  }, null, 2));
  
  console.log(`\n💾 Saved: ${outputFile}`);
}

main().catch(console.error);

