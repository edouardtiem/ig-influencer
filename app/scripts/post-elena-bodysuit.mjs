#!/usr/bin/env node
/**
 * Generate and post Elena with black bodysuit outfit
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { generateImagesForPost, publishCarouselToInstagram } from './scheduled-post.mjs';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('\n🎨 GÉNÉRATION POST ELENA - BODYSUIT NOIR');
  console.log('═'.repeat(60));
  
  // New outfit: Black bodysuit, elegant editorial style
  const postParams = {
    character: 'elena',
    type: 'carousel',
    location_name: 'Boudoir parisien',
    outfit: 'sleek black bodysuit, fitted and elegant, editorial fashion style, sophisticated',
    action: 'standing by ornate mirror in luxurious Paris hotel room, elegant confident pose, warm ambient lighting',
    prompt_hints: 'elegant boudoir suite in luxurious Paris hotel, ornate gilded mirror, warm candlelight ambiance, sophisticated atmosphere',
    mood: 'confident, elegant, sophisticated',
  };
  
  console.log(`\n📋 Paramètres:`);
  console.log(`   Location: ${postParams.location_name}`);
  console.log(`   Outfit: ${postParams.outfit}`);
  console.log(`   Mood: ${postParams.mood}`);
  
  console.log(`\n⏳ Génération des 3 images...`);
  
  try {
    // Generate images
    const { imageUrls } = await generateImagesForPost(postParams);
    
    console.log(`\n✅ ${imageUrls.length} images générées!`);
    imageUrls.forEach((url, i) => console.log(`   ${i+1}. ${url}`));
    
    // Caption from the original post
    const caption = `Whispers of golden light dance across gilded mirrors in my secret Paris boudoir.

A moment stolen from the city's rhythm—slipping into something sleek, tracing shadows in candlelight. The kind of evening that makes you grateful for confidence.

Mila always says these quiet moments are when I'm most myself. Ma personne préférée knows me too well. 💕

The full mirror story is on my private. 🖤`;

    const hashtags = [
      '#ParisianNights',
      '#BoudoirMoments', 
      '#MirrorReflections',
      '#IntimateEvening',
      '#FrenchElegance',
      '#CandlelightMagic',
      '#Bodysuit',
      '#EditorialStyle',
      '#SelfLove',
      '#QuietLuxury'
    ];
    
    const fullCaption = caption + '\n\n' + hashtags.join(' ');
    
    console.log(`\n📤 Publication sur Instagram...`);
    
    const instagramPostId = await publishCarouselToInstagram('elena', imageUrls, fullCaption);
    
    console.log(`\n✅ SUCCÈS! Post publié sur Instagram`);
    console.log(`   Post ID: ${instagramPostId}`);
    
    // Update the original scheduled post record
    await supabase
      .from('scheduled_posts')
      .update({ 
        status: 'posted',
        outfit: postParams.outfit,
        image_urls: imageUrls,
        instagram_post_id: instagramPostId,
        posted_at: new Date().toISOString(),
        error_message: null,
      })
      .eq('id', '54949f73-3dfd-4bf8-9488-b237244f161c');
    
    console.log(`\n🎉 Post bodysuit publié avec succès!`);
    
  } catch (err) {
    console.error(`\n❌ Erreur:`, err.message);
    process.exit(1);
  }
}

main().catch(console.error);
