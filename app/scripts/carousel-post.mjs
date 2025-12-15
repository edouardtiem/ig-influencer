#!/usr/bin/env node
/**
 * Carousel Post Script
 * Runs in GitHub Actions to avoid Vercel timeout limits
 * 
 * Usage: node scripts/carousel-post.mjs [slot] [test]
 * Example: node scripts/carousel-post.mjs morning false
 */

import Replicate from 'replicate';

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

const CAROUSEL_SIZE = 3;
const NANO_BANANA_MODEL = 'thecatservant/nano-banana-pro:894e208243dc8b3e7c9ab7eb590da86e390d85a07aa5dc93fdd2564de813d37f';

// Mila's reference photos for face consistency
const PRIMARY_FACE_URL = 'https://res.cloudinary.com/drbuzwipe/image/upload/v1733692068/mila_1_original_high_res_face_kkdzpz.jpg';
const FACE_REFS = [
  'https://res.cloudinary.com/drbuzwipe/image/upload/v1733692068/mila_2_face_sxwswy.jpg',
  'https://res.cloudinary.com/drbuzwipe/image/upload/v1733692068/mila_3_face_jqhfxi.jpg',
];

// Hero expressions (Photo 1)
const HERO_EXPRESSIONS = [
  'confident sultry gaze, slight smile playing on lips, direct eye contact',
  'warm inviting smile, eyes sparkling, approachable but alluring',
  'confident stare, slight smile, powerful feminine energy',
];

// Secondary expressions (Photos 2, 3)
const SECONDARY_EXPRESSIONS = [
  'soft sensual expression, eyes slightly hooded, natural allure',
  'playful smirk, knowing look, effortless confidence',
  'pensive look with soft smile, gazing slightly away, mysterious charm',
  'genuine laugh, eyes crinkled, natural beauty',
  'candid moment, caught mid-action, authentic',
];

// Location data
const LOCATIONS = {
  home_bedroom: {
    name: 'Chambre Mila',
    setting: 'cozy Parisian bedroom with warm lighting, unmade bed with white linens, morning sunlight through sheer curtains',
    instagramLocationId: '101156775033710',
    actions: [
      'just waking up, stretching arms above head in bed, morning sensuality',
      'sitting on bed scrolling phone, legs tucked under, cozy moment',
      'standing by window looking out at city, contemplative morning',
      'applying skincare at vanity mirror, self-care routine',
      'reading book in bed, propped on pillows, relaxed intimate',
      'stretching after waking, standing by bed, morning routine',
      'brushing hair at mirror, natural beauty routine',
      'taking mirror selfie with phone, typical influencer moment',
    ],
  },
  home_living_room: {
    name: 'Salon Mila',
    setting: 'stylish Parisian living room, mid-century furniture, plants, soft afternoon light',
    instagramLocationId: '101156775033710',
    actions: [
      'curled up on sofa watching something on laptop, cozy evening',
      'doing yoga flow on mat in living room, mid-pose, flexible',
      'watering plants by window, domestic goddess moment',
      'reading magazine on sofa, flipping pages, relaxed',
      'stretching on floor after home workout, recovery mode',
      'working on laptop at coffee table, focused but comfortable',
      'lighting candles on coffee table, setting evening mood',
      'dancing slightly to music, carefree moment, happy',
    ],
  },
  nice_gym: {
    name: "L'Usine Paris",
    setting: 'modern upscale gym, equipment visible, mirrors, professional lighting',
    actions: [
      'mid-squat on smith machine, weights loaded, focused determination',
      'doing cable rows, pulling weight toward body, muscles engaged',
      'on leg press machine, pushing weight, showing strength',
      'stretching on yoga mat between sets, one leg extended',
      'adjusting weight plates on barbell, preparing for next set',
      'walking between machines, towel around neck, post-set glow',
      'doing hip thrusts on bench, demonstrating exercise',
      'sitting on bench catching breath, wiping sweat, satisfied smile',
    ],
  },
  nice_old_town_cafe: {
    name: 'KB CaféShop',
    setting: 'charming Parisian café, marble tables, vintage decor, natural window light',
    actions: [
      'laughing mid-conversation, genuine joy',
      'sipping coffee, cup to lips, savoring the moment',
      'typing on laptop, working remotely, focused',
      'reading book at table, turning page, intellectual vibe',
      'taking photo of coffee for Instagram, content creator mode',
      'looking out window watching people pass, pensive moment',
      'eating croissant, mid-bite, enjoying French pastry',
      'adjusting sunglasses while sitting outside, chic Parisian',
    ],
  },
};

// Outfits by location
const OUTFITS = {
  home_bedroom: [
    'silk slip nightgown, delicate lace trim, effortlessly sexy',
    'oversized boyfriend shirt barely covering thighs, just woke up look',
    'matching loungewear set, cropped top showing midriff, cozy chic',
    'cotton underwear and loose tank top, authentic morning',
  ],
  home_living_room: [
    'yoga set, high-waisted leggings, sports bra, toned midriff visible',
    'silk robe loosely tied, hint of lingerie underneath',
    'cozy oversized sweater, bare legs, comfortable sexy',
    'matching sweatsuit, cropped hoodie, athleisure chic',
  ],
  nice_gym: [
    'matching workout set, high-waisted leggings, sports bra, athletic curves',
    'fitted tank top, booty shorts, serious gym mode',
    'one-piece workout bodysuit, athletic and feminine',
  ],
  nice_old_town_cafe: [
    'fitted sundress, subtle décolletage, Parisian summer style',
    'high-waisted jeans, tucked-in blouse, effortless chic',
    'linen blazer over crop top, casual sophistication',
  ],
};

// Slot configurations
const SLOTS = {
  morning: {
    locations: ['home_bedroom', 'nice_gym'],
    lighting: 'soft golden morning light streaming through windows',
    mood: 'fresh, awakening, sensual morning energy',
  },
  midday: {
    locations: ['nice_gym', 'nice_old_town_cafe'],
    lighting: 'bright natural daylight, clear and vibrant',
    mood: 'energetic, productive, confident',
  },
  evening: {
    locations: ['home_living_room', 'home_bedroom'],
    lighting: 'warm golden hour light, soft shadows, intimate ambiance',
    mood: 'relaxed, intimate, sensual evening vibes',
  },
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// ═══════════════════════════════════════════════════════════════
// CLOUDINARY UPLOAD
// ═══════════════════════════════════════════════════════════════

async function uploadToCloudinary(imageUrl) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Missing Cloudinary credentials');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'mila-carousel';
  
  // Generate signature
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

async function generateImage(replicate, prompt, referenceUrls) {
  log(`  Generating with ${referenceUrls.length} references...`);
  
  const input = {
    prompt,
    negative_prompt: 'ugly, blurry, low quality, distorted face, extra limbs, bad anatomy, text, watermark, signature',
    width: 1024,
    height: 1024,
    num_inference_steps: 30,
    guidance_scale: 7.5,
  };

  // Add reference images
  referenceUrls.forEach((url, i) => {
    input[`img${i + 1}`] = url;
  });

  const output = await replicate.run(NANO_BANANA_MODEL, { input });

  if (!output || !output[0]) {
    throw new Error('No output from Nano Banana Pro');
  }

  return output[0];
}

// ═══════════════════════════════════════════════════════════════
// INSTAGRAM PUBLISH
// ═══════════════════════════════════════════════════════════════

async function publishCarousel(imageUrls, caption, locationId) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;

  if (!accessToken || !accountId) {
    throw new Error('Missing Instagram credentials');
  }

  log(`📤 Publishing carousel with ${imageUrls.length} images...`);

  // Step 1: Create media containers for each image
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

  // Step 2: Create carousel container
  log('  Creating carousel container...');
  const carouselParams = new URLSearchParams({
    media_type: 'CAROUSEL',
    children: containerIds.join(','),
    caption,
    access_token: accessToken,
  });

  if (locationId) {
    carouselParams.append('location_id', locationId);
  }

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

  // Step 3: Publish
  log('  Publishing...');
  const publishParams = new URLSearchParams({
    creation_id: carouselId,
    access_token: accessToken,
  });

  const publishResponse = await fetch(
    `https://graph.facebook.com/v18.0/${accountId}/media_publish?${publishParams}`,
    { method: 'POST' }
  );

  if (!publishResponse.ok) {
    const error = await publishResponse.json();
    throw new Error(`Failed to publish: ${JSON.stringify(error)}`);
  }

  const publishResult = await publishResponse.json();
  return publishResult.id;
}

// ═══════════════════════════════════════════════════════════════
// CAPTION GENERATION (simple fallback)
// ═══════════════════════════════════════════════════════════════

function generateCaption(locationName, action) {
  const captions = [
    'Living my best life ✨',
    'Just another day in Paris 🇫🇷',
    'Feeling myself today 💫',
    'Moments like these 🤍',
    'Weekend vibes ☀️',
    'Self-care Sunday 🧖‍♀️',
    'Morning routine 🌅',
    'Café time ☕',
  ];
  
  const hashtags = [
    '#paris', '#parisienne', '#frenchgirl', '#lifestyle',
    '#ootd', '#instadaily', '#selfcare', '#weekendvibes',
  ];

  const caption = randomFrom(captions);
  const selectedHashtags = hashtags.sort(() => Math.random() - 0.5).slice(0, 6);
  
  return `${caption}\n\n${selectedHashtags.join(' ')}`;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  const slot = process.argv[2] || 'morning';
  const isTest = process.argv[3] === 'true';

  log(`🚀 Starting carousel generation (${CAROUSEL_SIZE} images)`);
  log(`📅 Slot: ${slot}`);
  if (isTest) log('🧪 TEST MODE - will not publish');

  // Validate environment
  const requiredEnvVars = [
    'REPLICATE_API_TOKEN',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ];
  
  if (!isTest) {
    requiredEnvVars.push('INSTAGRAM_ACCESS_TOKEN', 'INSTAGRAM_ACCOUNT_ID');
  }

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`❌ Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }

  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  try {
    // Step 1: Select location and content
    const slotConfig = SLOTS[slot] || SLOTS.morning;
    const locationId = randomFrom(slotConfig.locations);
    const location = LOCATIONS[locationId];
    
    if (!location) {
      throw new Error(`Unknown location: ${locationId}`);
    }

    const outfit = randomFrom(OUTFITS[locationId] || OUTFITS.home_bedroom);
    
    // Get 3 different actions
    const shuffledActions = [...location.actions].sort(() => Math.random() - 0.5);
    const actions = shuffledActions.slice(0, CAROUSEL_SIZE);

    log(`📍 Location: ${location.name}`);
    log(`👗 Outfit: ${outfit.slice(0, 50)}...`);
    log(`🎬 Actions: ${actions.length}`);

    // Step 2: Generate images
    const cloudinaryUrls = [];
    let heroImageUrl = null;

    for (let i = 0; i < CAROUSEL_SIZE; i++) {
      const photoNum = i + 1;
      const isHero = i === 0;
      const action = actions[i];
      const expression = isHero
        ? randomFrom(HERO_EXPRESSIONS)
        : randomFrom(SECONDARY_EXPRESSIONS);

      log(`\n🎨 Generating Photo ${photoNum}/${CAROUSEL_SIZE}...`);
      log(`  Action: ${action.slice(0, 50)}...`);
      if (!isHero && heroImageUrl) {
        log(`  ↳ Using Photo 1 as scene reference`);
      }

      // Build prompt
      const prompt = `Mila, a beautiful 25-year-old French woman with long dark hair, ${expression}, ${action}, wearing ${outfit}, ${location.setting}, ${slotConfig.lighting}, ${slotConfig.mood}, ultra realistic, 8k, professional photography, soft focus background`;

      // Build references
      const refs = [PRIMARY_FACE_URL, ...FACE_REFS.slice(0, 2)];
      if (!isHero && heroImageUrl) {
        refs.unshift(heroImageUrl); // Scene ref first for stronger weight
        refs.unshift(heroImageUrl); // Double it for consistency
      }

      const startTime = Date.now();
      const imageUrl = await generateImage(replicate, prompt, refs.slice(0, 5));
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      log(`  ✅ Generated in ${duration}s`);

      // Upload to Cloudinary
      log(`  ☁️ Uploading to Cloudinary...`);
      const cloudinaryUrl = await uploadToCloudinary(imageUrl);
      log(`  ✅ Uploaded: ${cloudinaryUrl}`);

      cloudinaryUrls.push(cloudinaryUrl);

      // Save hero URL for scene reference
      if (isHero) {
        heroImageUrl = cloudinaryUrl;
      }
    }

    log(`\n📸 Carousel ready: ${cloudinaryUrls.length} images`);

    // Step 3: Generate caption
    const caption = generateCaption(location.name, actions[0]);
    log(`📝 Caption: ${caption.split('\n')[0]}`);

    // Step 4: Publish (unless test mode)
    if (isTest) {
      log('\n🧪 TEST MODE - Skipping publish');
      log('\n✅ SUCCESS (test mode)');
      console.log(JSON.stringify({
        success: true,
        test: true,
        imageUrls: cloudinaryUrls,
        caption,
        location: location.name,
      }, null, 2));
    } else {
      const postId = await publishCarousel(
        cloudinaryUrls,
        caption,
        location.instagramLocationId
      );
      log(`\n✅ PUBLISHED! Post ID: ${postId}`);
      console.log(JSON.stringify({
        success: true,
        postId,
        imageUrls: cloudinaryUrls,
        caption,
        location: location.name,
      }, null, 2));
    }

  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main();
