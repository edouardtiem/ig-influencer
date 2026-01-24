#!/usr/bin/env node
/**
 * Regenerate and post tonight's Elena post with fixed Content Brain code
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { generateImagesForPost, publishCarouselToInstagram } from './scheduled-post.mjs';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

const POST_ID = '54949f73-3dfd-4bf8-9488-b237244f161c';

async function main() {
  console.log('\n🔄 RÉGÉNÉRATION POST 21H ELENA');
  console.log('═'.repeat(60));
  
  // 1. Get the post
  const { data: post, error } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('id', POST_ID)
    .single();
    
  if (error || !post) {
    console.error('❌ Post non trouvé:', error?.message);
    process.exit(1);
  }
  
  console.log(`\n📋 Post original:`);
  console.log(`   Location: ${post.location_name}`);
  console.log(`   Mood: ${post.mood}`);
  console.log(`   Status: ${post.status}`);
  
  // 2. Fix the parameters (replace blocked terms)
  const fixedParams = {
    ...post,
    // Fix mood: alluring -> elegant
    mood: post.mood.replace(/alluring/gi, 'elegant').replace(/sensual/gi, 'sophisticated'),
    // Fix outfit: curves -> silhouette
    outfit: post.outfit
      .replace(/curves/gi, 'silhouette')
      .replace(/softly draping over curves/gi, 'elegant draping')
      .replace(/slip dress/gi, 'elegant dress'),
    // Fix action: make it safer
    action: post.action
      .replace(/silhouette/gi, 'elegant pose')
      .replace(/adjusting dress straps/gi, 'elegant pose by mirror'),
    // Fix prompt_hints
    prompt_hints: post.prompt_hints
      .replace(/curves/gi, 'silhouette')
      .replace(/slip dress/gi, 'elegant dress'),
  };
  
  console.log(`\n✨ Paramètres corrigés:`);
  console.log(`   Mood: ${fixedParams.mood}`);
  console.log(`   Outfit: ${fixedParams.outfit.substring(0, 60)}...`);
  console.log(`   Action: ${fixedParams.action.substring(0, 60)}...`);
  
  // 3. Update status to generating
  await supabase
    .from('scheduled_posts')
    .update({ 
      status: 'generating',
      error_message: null,
      error_step: null,
      generation_started_at: new Date().toISOString(),
    })
    .eq('id', POST_ID);
  
  console.log(`\n⏳ Génération des images avec le nouveau code (face ref only)...`);
  
  try {
    // 4. Generate images using the fixed Content Brain
    const { imageUrls } = await generateImagesForPost({
      character: 'elena',
      type: 'carousel',
      location_name: fixedParams.location_name,
      outfit: fixedParams.outfit,
      action: fixedParams.action,
      prompt_hints: fixedParams.prompt_hints,
      mood: fixedParams.mood,
    });
    
    console.log(`\n✅ ${imageUrls.length} images générées!`);
    imageUrls.forEach((url, i) => console.log(`   ${i+1}. ${url.substring(0, 60)}...`));
    
    // 5. Update post with images
    await supabase
      .from('scheduled_posts')
      .update({ 
        status: 'images_ready',
        image_urls: imageUrls,
        generation_completed_at: new Date().toISOString(),
      })
      .eq('id', POST_ID);
    
    // 6. Build caption
    const fullCaption = post.caption + '\n\n' + post.hashtags.join(' ');
    
    console.log(`\n📤 Publication sur Instagram...`);
    
    // 7. Publish
    await supabase
      .from('scheduled_posts')
      .update({ 
        status: 'posting',
        posting_started_at: new Date().toISOString(),
      })
      .eq('id', POST_ID);
    
    const instagramPostId = await publishCarouselToInstagram('elena', imageUrls, fullCaption);
    
    // 8. Update final status
    await supabase
      .from('scheduled_posts')
      .update({ 
        status: 'posted',
        instagram_post_id: instagramPostId,
        posted_at: new Date().toISOString(),
      })
      .eq('id', POST_ID);
    
    console.log(`\n✅ SUCCÈS! Post publié sur Instagram`);
    console.log(`   Post ID: ${instagramPostId}`);
    console.log(`\n🎉 Post de 21h régénéré et publié avec succès!`);
    
  } catch (err) {
    console.error(`\n❌ Erreur:`, err.message);
    
    // Update error status
    await supabase
      .from('scheduled_posts')
      .update({ 
        status: 'failed',
        error_message: err.message,
        error_step: 'regeneration',
      })
      .eq('id', POST_ID);
      
    process.exit(1);
  }
}

main().catch(console.error);
