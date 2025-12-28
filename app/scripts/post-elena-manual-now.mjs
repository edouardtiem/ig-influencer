#!/usr/bin/env node
/**
 * Post manuel Elena avec les paramètres du post prévu à 21h00
 * 
 * Usage: node scripts/post-elena-manual-now.mjs
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { generateImagesForPost, publishCarouselToInstagram } from './scheduled-post.mjs';

// Paramètres du post prévu à 21h00
const postParams = {
  character: 'elena',
  type: 'carousel',
  location_key: 'bali_villa',
  location_name: 'Villa Bali (infinity pool, rizières)',
  mood: 'nostalgic',
  outfit: 'bikini string noir designer avec détails dorés, silhouette mise en valeur parfaitement par le soleil balinais',
  action: 'allongée sur le côté au bord de l\'infinity pool, appuyée sur le coude, regard captivant vers caméra avec rizières en arrière-plan',
  caption: 'Missing these Bali mornings with my favorite person 💕 Vous aussi vous rêvez déjà de votre prochaine escapade au soleil ? ☀️',
  hashtags: [
    '#throwback',
    '#bali',
    '#memories',
    '#missingthissun',
    '#infinitypool',
    '#balivilla',
    '#sunshine',
    '#escape',
    '#dreaming',
    '#paradise',
    '#goodtimes',
    '#favorites',
    '#nostalgia',
    '#weekend',
    '#missing'
  ],
  prompt_hints: 'Elena in designer black bikini with gold details, confident feminine pose lying on side at infinity pool edge, elbow supporting her head, captivating gaze toward camera, lush Balinese rice terraces in background, golden hour lighting, luxury villa setting, two coffee cups visible on nearby table suggesting shared moment, Instagram aesthetic',
};

async function main() {
  console.log('\n📸 ═══════════════════════════════════════════════════════');
  console.log('   POST MANUEL ELENA — Villa Bali');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📍 Location:', postParams.location_name);
  console.log('👗 Outfit:', postParams.outfit.substring(0, 60) + '...');
  console.log('💬 Caption:', postParams.caption.substring(0, 60) + '...\n');

  try {
    // Step 1: Generate images
    console.log('🎨 Generating images...\n');
    const result = await generateImagesForPost(postParams);

    if (!result || !result.imageUrls || result.imageUrls.length === 0) {
      throw new Error('No images generated');
    }

    console.log(`\n✅ Generated ${result.imageUrls.length} images\n`);

    // Step 2: Select only images 1 and 3 (skip image 2 - not similar enough)
    const selectedImages = [result.imageUrls[0], result.imageUrls[2]];
    console.log(`📸 Using images 1 and 3 (skipping image 2)\n`);

    // Step 2: Build caption with hashtags
    const hashtagStr = postParams.hashtags.join(' ');
    const fullCaption = `${postParams.caption}\n\n${hashtagStr}`;

    // Step 3: Publish to Instagram
    console.log('📤 Publishing to Instagram...\n');
    const instagramPostId = await publishCarouselToInstagram(
      postParams.character,
      selectedImages,
      fullCaption
    );

    console.log('\n🎉 SUCCESS!');
    console.log(`   Post ID: ${instagramPostId}`);
    console.log(`   View at: https://www.instagram.com/p/${instagramPostId}/`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);

