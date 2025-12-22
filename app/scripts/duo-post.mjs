#!/usr/bin/env node
/**
 * Duo Post Script - Mila × Elena Collaboration Posts
 * Generates a carousel with both characters and posts to both accounts
 * 
 * Scenarios:
 * - shooting: Mila photographs Elena (BTS)
 * - brunch: Friends at café together
 * - workout: Elena tries fitness with Mila
 * - shopping: Shopping trip together
 * 
 * Usage: node scripts/duo-post.mjs [scenario] [test]
 * Scenarios: shooting, brunch, workout, shopping (or random)
 */

import { savePostToSupabase } from './lib/supabase-helper.mjs';

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local for local development
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

const CAROUSEL_SIZE = 3;
const NANO_BANANA_MODEL = 'google/nano-banana-pro';

// Character references
const MILA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png';
const MILA_BODY_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_5_kyx12v.png';
const ELENA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png';
const ELENA_BODY_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png';

// ═══════════════════════════════════════════════════════════════
// CHARACTER DESCRIPTIONS
// ═══════════════════════════════════════════════════════════════

const MILA_DESCRIPTION = `Mila, 22 year old French woman:
oval elongated face with high cheekbones, soft feminine jawline,
copper auburn hair type 3A loose curls shoulder-length,
almond-shaped hazel-green eyes with golden flecks,
small dark brown beauty mark above left lip corner,
slim athletic physique 168cm, Mediterranean tan skin,
thin gold necklace with star pendant`;

const ELENA_DESCRIPTION = `Elena, 24 year old Italian woman:
soft round pleasant face, warm approachable features,
bronde hair dark roots with golden blonde balayage, long beach waves,
honey brown warm almond-shaped eyes, naturally thick eyebrows,
small beauty mark on right cheekbone,
curvy voluptuous figure 172cm, sun-kissed Italian skin,
gold chunky chain bracelet, layered gold necklaces with medallion`;

// ═══════════════════════════════════════════════════════════════
// DUO SCENARIOS - 3x per week content
// ═══════════════════════════════════════════════════════════════

const DUO_SCENARIOS = {
  shooting: {
    name: 'Mila photographie Elena',
    frequency: '1x/semaine',
    setting: `Professional but intimate photo studio or outdoor location in Paris.
Natural daylight streaming in, simple backdrop, photography equipment visible.
Behind-the-scenes atmosphere, creative collaboration energy.`,
    actions: [
      'Mila holding vintage camera, directing Elena who poses naturally in front',
      'Both laughing between shots, genuine friendship moment, camera lowered',
      'Mila adjusting Elena\'s pose, close collaboration, both smiling',
    ],
    outfits: {
      mila: 'casual photographer style - black fitted jeans, simple white tee, leather jacket over shoulders',
      elena: 'elegant photoshoot outfit - silk blouse slightly unbuttoned, tailored pants, model-ready',
    },
    captions: {
      mila: [
        'Shooting day avec ma @elenav.paris préférée 📸 Qui veut voir les résultats?',
        'Behind the lens avec cette beauté ✨ Work wife vibes avec @elenav.paris',
        'Mon modèle préféré depuis toujours @elenav.paris 🤍 Swipe pour les coulisses',
        'Best photoshoot partner = @elenav.paris 📸 Results coming soon...',
      ],
      elena: [
        'Behind the scenes avec @mila_verne 📸 Ma photographe préférée',
        'Quand ta BFF est aussi ton photographe attitré ✨ Thanks @mila_verne',
        'Shooting day >> 🎬 Credit: @mila_verne always',
        'POV: Ta meilleure amie capture tes meilleurs angles @mila_verne 🤍',
      ],
    },
  },

  brunch: {
    name: 'Brunch ensemble',
    frequency: '1x/semaine',
    setting: `Charming Parisian café terrace in Montmartre or Marais.
Marble bistro table with croissants, coffee cups, fresh flowers.
Morning sunlight, bustling but cozy café atmosphere.`,
    actions: [
      'Both seated at café table, laughing together, coffee cups in hands',
      'One whispering to the other, sharing secrets, genuine friendship moment',
      'Both looking at camera, warm smiles, brunch spread visible on table',
    ],
    outfits: {
      mila: 'casual chic - cream knit sweater, high-waisted jeans, minimal jewelry',
      elena: 'Parisian luxe casual - silk blouse, tailored coat over shoulders, gold accessories',
    },
    captions: {
      mila: [
        'Brunch date avec ma @elenav.paris 🥐☕ Vous préférez sucré ou salé?',
        'Meilleure façon de commencer le weekend avec @elenav.paris ✨',
        'Quand elle t\'appelle à 8h pour un brunch improvisé... @elenav.paris 😅',
        'Sunday brunch ritual avec cette queen @elenav.paris 👑',
      ],
      elena: [
        'Brunch avec ma @mila_verne ☕ On parle de tout et de rien pendant des heures',
        'POV: Ta BFF te traîne au brunch à 9h @mila_verne 😴☕',
        'My brunch partner in crime @mila_verne 🥐 Sweet or savory?',
        'Ces moments simples avec @mila_verne >> everything 🤍',
      ],
    },
  },

  workout: {
    name: 'Workout ensemble',
    frequency: '1x/2 semaines',
    setting: `Modern fitness studio or yoga space with natural light.
Clean minimalist design, mirrors, yoga mats, light wood floors.
Morning workout energy, motivating atmosphere.`,
    actions: [
      'Both in workout poses, Elena struggling playfully while Mila guides her',
      'High five moment, post-workout energy, both glowing',
      'Mila demonstrating exercise while Elena watches with humorous expression',
    ],
    outfits: {
      mila: 'professional trainer look - matching sports bra and leggings set in sage green, sporty',
      elena: 'luxury athleisure - oversized crop hoodie over sports bra, high-waisted leggings, looking fashionable but less athletic',
    },
    captions: {
      mila: [
        'Quand tu traînes ta BFF à la salle @elenav.paris 😅💪 Elle tient le coup?',
        'Personal training session spéciale @elenav.paris 🏋️ Swipe pour voir sa tête',
        'Teaching @elenav.paris que fitness peut être fun 😂 Progress loading...',
        'Gym date avec @elenav.paris ✨ She\'s doing amazing sweetie',
      ],
      elena: [
        'POV: @mila_verne te force à faire du sport 😭💪 Help',
        'Quand ta BFF personal trainer ne te lâche pas @mila_verne 😅',
        'Je ne savais pas que ça pouvait faire aussi mal... thanks @mila_verne 🥲',
        'Workout avec @mila_verne = instant regret but also kind of fun? 😂',
      ],
    },
  },

  shopping: {
    name: 'Shopping duo',
    frequency: '1x/2 semaines',
    setting: `Luxury boutique in Paris or charming vintage store.
Beautiful clothing racks, fitting room mirrors, shopping bags.
Afternoon shopping spree atmosphere, trying on clothes.`,
    actions: [
      'Both holding up clothes, asking each other opinions, animated discussion',
      'One trying on outfit while other judges with thumbs up, mirror visible',
      'Walking out of boutique together, shopping bags in hands, satisfied smiles',
    ],
    outfits: {
      mila: 'street style casual - vintage band tee, leather jacket, mom jeans, sneakers',
      elena: 'shopping ready luxe - trench coat, fitted dress underneath, designer bag, heels',
    },
    captions: {
      mila: [
        'Personal stylist @elenav.paris m\'a encore fait acheter un truc 😅 Worth it?',
        'Shopping therapy avec @elenav.paris 🛍️ RIP my bank account',
        'Elle dit toujours \"essaie juste\" @elenav.paris... 3 sacs plus tard 😂',
        'Fashion advisor of the day: @elenav.paris ✨ This or that?',
      ],
      elena: [
        'Quand tu traînes @mila_verne faire du shopping 🛍️ Elle dit non puis achète tout',
        'Shopping date avec ma @mila_verne ✨ She has the best eye actually',
        'POV: Tu convaincs ta BFF qu\'elle a BESOIN de ça @mila_verne 😏',
        'Ma shopping partner préférée @mila_verne 🤍 Swipe pour les achats',
      ],
    },
  },
};

// ═══════════════════════════════════════════════════════════════
// HASHTAG POOLS
// ═══════════════════════════════════════════════════════════════

const HASHTAG_POOLS = {
  duo: ['#bestfriends', '#bff', '#girlgang', '#friendshipgoals', '#squadgoals', '#besties', '#girlsquad'],
  lifestyle: ['#lifestyle', '#parisienne', '#frenchgirl', '#weekendvibes', '#goodvibes', '#instadaily'],
  paris: ['#paris', '#parisian', '#parislife', '#montmartre', '#iloveparis'],
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function generateHashtags() {
  const hashtags = [];
  for (const pool of Object.values(HASHTAG_POOLS)) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    hashtags.push(...shuffled.slice(0, 2));
  }
  return [...new Set(hashtags)].slice(0, 6).join(' ');
}

// ═══════════════════════════════════════════════════════════════
// CLOUDINARY
// ═══════════════════════════════════════════════════════════════

async function uploadToCloudinary(imageUrl) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Missing Cloudinary credentials');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'duo-carousel';
  
  const crypto = await import('crypto');
  const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

  const formData = new FormData();
  formData.append('file', imageUrl);
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
// IMAGE GENERATION
// ═══════════════════════════════════════════════════════════════

async function urlToBase64(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const contentType = response.headers.get('content-type') || 'image/png';
  return `data:${contentType};base64,${base64}`;
}

async function generateImage(replicate, prompt, referenceUrls) {
  log(`  Generating with ${referenceUrls.length} references...`);
  
  let base64Images = null;
  if (referenceUrls.length > 0) {
    log(`  Converting references to base64...`);
    base64Images = await Promise.all(referenceUrls.map(url => urlToBase64(url)));
  }

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

  if (!output) throw new Error('No output from Nano Banana Pro');

  // Handle async iterator
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
      return `data:image/jpeg;base64,${Buffer.from(combined).toString('base64')}`;
    }
  }

  if (typeof output === 'string') return output;
  if (Array.isArray(output) && output[0]) return output[0];

  throw new Error('Could not process API response');
}

// ═══════════════════════════════════════════════════════════════
// INSTAGRAM PUBLISH
// ═══════════════════════════════════════════════════════════════

async function waitForMediaReady(containerId, accessToken, maxWaitMs = 120000) {
  const startTime = Date.now();
  const pollInterval = 3000;
  
  while (Date.now() - startTime < maxWaitMs) {
    const statusUrl = `https://graph.facebook.com/v18.0/${containerId}?fields=status_code,status&access_token=${accessToken}`;
    
    try {
      const response = await fetch(statusUrl);
      const data = await response.json();
      
      if (data.status_code === 'FINISHED') {
        log('  ✅ Media ready!');
        return true;
      }
      
      if (data.status_code === 'ERROR') {
        throw new Error(`Media processing failed: ${data.status || 'Unknown error'}`);
      }
      
      log(`  ⏳ Status: ${data.status_code || 'processing'}...`);
    } catch (error) {
      log(`  ⏳ Checking status...`);
    }
    
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  throw new Error('Media processing timeout');
}

async function publishCarousel(imageUrls, caption, accessToken, accountId) {
  if (!accessToken || !accountId) {
    throw new Error('Missing Instagram credentials');
  }

  log(`📤 Publishing carousel with ${imageUrls.length} images...`);

  const containerIds = [];
  for (let i = 0; i < imageUrls.length; i++) {
    log(`  Creating container ${i + 1}/${imageUrls.length}...`);
    
    const params = new URLSearchParams({
      image_url: imageUrls[i],
      is_carousel_item: 'true',
      access_token: accessToken,
    });

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${accountId}/media?${params}`,
      { method: 'POST' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create container: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    containerIds.push(result.id);
  }

  log('  Creating carousel container...');
  const carouselParams = new URLSearchParams({
    media_type: 'CAROUSEL',
    children: containerIds.join(','),
    caption,
    access_token: accessToken,
  });

  const carouselResponse = await fetch(
    `https://graph.facebook.com/v18.0/${accountId}/media?${carouselParams}`,
    { method: 'POST' }
  );

  if (!carouselResponse.ok) {
    const error = await carouselResponse.json();
    throw new Error(`Failed to create carousel: ${JSON.stringify(error)}`);
  }

  const carouselResult = await carouselResponse.json();
  const carouselId = carouselResult.id;

  log('  Waiting for media to be ready...');
  await waitForMediaReady(carouselId, accessToken);

  // Retry publishing
  const maxRetries = 5;
  const baseDelay = 5000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    log(`  Publishing... (attempt ${attempt}/${maxRetries})`);
    
    const publishParams = new URLSearchParams({
      creation_id: carouselId,
      access_token: accessToken,
    });

    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${accountId}/media_publish?${publishParams}`,
      { method: 'POST' }
    );

    const result = await publishResponse.json();
    
    if (result.id) {
      return result.id;
    }
    
    if (result.error?.error_subcode === 2207027 && attempt < maxRetries) {
      const delay = baseDelay * attempt;
      log(`  ⏳ Media not ready, waiting ${delay/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    
    throw new Error(`Failed to publish: ${JSON.stringify(result)}`);
  }
  
  throw new Error('Max retries reached');
}

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════

function buildDuoPrompt(scenario, action, scenarioConfig) {
  return `You are provided with reference images in order:

**IMAGES 1-2 (MILA REFERENCES)**: Face and body references for Mila
- Oval elongated face with high cheekbones
- Copper auburn curly hair (NOT straight, NOT dark brown)
- Beauty mark above left lip corner (SIGNATURE)
- Slim athletic physique

**IMAGES 3-4 (ELENA REFERENCES)**: Face and body references for Elena  
- Soft round pleasant face (NOT angular)
- Bronde hair with golden blonde balayage highlights (NOT solid dark brown)
- Beauty mark on right cheekbone
- Curvy voluptuous figure with large bust

Generate a scene with TWO DIFFERENT WOMEN together.

SCENE: ${action}

FIRST PERSON (LEFT SIDE - MILA):
${MILA_DESCRIPTION}
wearing ${scenarioConfig.outfits.mila}

SECOND PERSON (RIGHT SIDE - ELENA):
${ELENA_DESCRIPTION}
wearing ${scenarioConfig.outfits.elena}

SETTING: ${scenarioConfig.setting}

INTERACTION: Both women are clearly interacting as close friends, genuine warmth and chemistry between them.

STYLE: ultra realistic Instagram photo, lifestyle content, friendship goals aesthetic,
8k resolution, professional photography, natural lighting, candid authentic moment,

FINAL CHECK - MUST MATCH REFERENCES:
- MILA (left): oval face, copper auburn CURLY hair, beauty mark above left lip
- ELENA (right): soft round face, bronde hair with BLONDE BALAYAGE, beauty mark on right cheekbone, curvy body
- TWO distinct women - do NOT merge their features
- Natural interaction between friends, not posed mannequins`;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  const scenarioArg = process.argv[2] || 'random';
  const isTest = process.argv[3] === 'true' || process.argv.includes('test');
  
  // Pick scenario
  const scenarios = Object.keys(DUO_SCENARIOS);
  const scenarioKey = scenarioArg === 'random' 
    ? randomFrom(scenarios) 
    : scenarioArg;
  
  if (!DUO_SCENARIOS[scenarioKey]) {
    console.error(`❌ Unknown scenario: ${scenarioKey}`);
    console.log('Available: ' + scenarios.join(', ') + ', random');
    process.exit(1);
  }

  const scenario = DUO_SCENARIOS[scenarioKey];
  
  log('═══════════════════════════════════════════════════════════════');
  log(`👯 DUO POST - MILA × ELENA`);
  log(`📍 Scenario: ${scenario.name}`);
  log('═══════════════════════════════════════════════════════════════');
  
  if (isTest) log('🧪 TEST MODE - will not publish');

  // Check env vars
  const requiredEnvVars = [
    'REPLICATE_API_TOKEN',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ];
  
  if (!isTest) {
    requiredEnvVars.push(
      'INSTAGRAM_ACCESS_TOKEN', 'INSTAGRAM_ACCOUNT_ID',
      'INSTAGRAM_ACCESS_TOKEN_ELENA', 'INSTAGRAM_ACCOUNT_ID_ELENA'
    );
  }

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`❌ Missing: ${envVar}`);
      process.exit(1);
    }
  }

  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  try {
    // Step 1: Generate images
    const cloudinaryUrls = [];
    let firstImageUrl = null;
    
    // References: all 4 character refs
    const allRefs = [MILA_FACE_REF, MILA_BODY_REF, ELENA_FACE_REF, ELENA_BODY_REF];

    for (let i = 0; i < CAROUSEL_SIZE; i++) {
      log(`\n🎨 Generating Photo ${i + 1}/${CAROUSEL_SIZE}...`);
      
      const action = scenario.actions[i];
      log(`  Action: ${action.slice(0, 60)}...`);
      
      const prompt = buildDuoPrompt(scenarioKey, action, scenario);
      
      // Add first image for consistency on subsequent images
      const refs = [...allRefs];
      if (firstImageUrl && i > 0) {
        refs.push(firstImageUrl);
        log(`  📌 Including first image for consistency`);
      }

      const startTime = Date.now();
      const imageUrl = await generateImage(replicate, prompt, refs.slice(0, 5));
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      log(`  ✅ Generated in ${duration}s`);

      // Store first image
      if (i === 0) {
        firstImageUrl = imageUrl;
      }

      // Upload to Cloudinary
      log(`  ☁️ Uploading to Cloudinary...`);
      const cloudinaryUrl = await uploadToCloudinary(imageUrl);
      cloudinaryUrls.push(cloudinaryUrl);
      log(`  ✅ Uploaded: ${cloudinaryUrl}`);
    }

    log(`\n📸 Carousel ready: ${cloudinaryUrls.length} images`);

    // Step 2: Generate captions
    const captionMila = randomFrom(scenario.captions.mila) + '\n\n' + generateHashtags();
    const captionElena = randomFrom(scenario.captions.elena) + '\n\n' + generateHashtags();
    
    log(`\n📝 Caption Mila: ${captionMila.split('\n')[0]}`);
    log(`📝 Caption Elena: ${captionElena.split('\n')[0]}`);

    // Step 3: Publish to both accounts
    if (isTest) {
      log('\n🧪 TEST MODE - Skipping publish');
      log('\n✅ SUCCESS (test mode)');
      console.log(JSON.stringify({
        success: true,
        test: true,
        scenario: scenarioKey,
        imageUrls: cloudinaryUrls,
        captionMila,
        captionElena,
      }, null, 2));
    } else {
      // Post to Mila's account
      log('\n📤 Publishing to Mila\'s account...');
      const milaPostId = await publishCarousel(
        cloudinaryUrls,
        captionMila,
        process.env.INSTAGRAM_ACCESS_TOKEN,
        process.env.INSTAGRAM_ACCOUNT_ID
      );
      log(`  ✅ Mila Post ID: ${milaPostId}`);

      // Post to Elena's account
      log('\n📤 Publishing to Elena\'s account...');
      const elenaPostId = await publishCarousel(
        cloudinaryUrls,
        captionElena,
        process.env.INSTAGRAM_ACCESS_TOKEN_ELENA,
        process.env.INSTAGRAM_ACCOUNT_ID_ELENA
      );
      log(`  ✅ Elena Post ID: ${elenaPostId}`);

      // Save both posts to Supabase
      log('\n💾 Saving to Supabase...');
      await savePostToSupabase({
        character: 'mila',
        instagramPostId: milaPostId,
        postType: 'carousel',
        imageUrls: cloudinaryUrls,
        caption: captionMila,
        locationName: scenario.setting.name,
        mood: 'playful',
        withCharacter: 'elena',
      });
      await savePostToSupabase({
        character: 'elena',
        instagramPostId: elenaPostId,
        postType: 'carousel',
        imageUrls: cloudinaryUrls,
        caption: captionElena,
        locationName: scenario.setting.name,
        mood: 'playful',
        withCharacter: 'mila',
      });

      log('\n✅ PUBLISHED TO BOTH ACCOUNTS!');
      console.log(JSON.stringify({
        success: true,
        scenario: scenarioKey,
        milaPostId,
        elenaPostId,
        imageUrls: cloudinaryUrls,
        captionMila,
        captionElena,
      }, null, 2));
    }

  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main();

