#!/usr/bin/env node
/**
 * Audit Orphan Images — Identifie les photos générées mais non utilisées
 * 
 * Vérifie:
 * - Photos isolées dans Cloudinary (pas dans des carrousels de 3)
 * - Scripts qui génèrent des photos isolées
 * - Posts avec nombre d'images incorrect
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function auditOrphanImages() {
  console.log('🔍 AUDIT PHOTOS ISOLÉES — Génération vs Utilisation\n');
  console.log('═'.repeat(60));

  // Get all posts from last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const dateStr = sevenDaysAgo.toISOString().split('T')[0];

  const { data: posts, error } = await supabase
    .from('scheduled_posts')
    .select('*')
    .gte('scheduled_date', dateStr)
    .order('scheduled_date', { ascending: false })
    .order('scheduled_time', { ascending: false });

  if (error) {
    console.error('❌ Error fetching posts:', error.message);
    return;
  }

  console.log(`📊 Total posts analysés: ${posts.length}\n`);

  // Categorize issues
  const issues = {
    wrongImageCount: [],
    orphanImages: [],
    singleImagePosts: [],
  };

  for (const post of posts) {
    if (!post.image_urls) continue;

    let imgCount = 0;
    let imageUrls = [];

    // Parse image_urls
    try {
      if (Array.isArray(post.image_urls)) {
        imageUrls = post.image_urls;
        imgCount = imageUrls.length;
      } else if (typeof post.image_urls === 'string') {
        // Try JSON parse first
        try {
          const parsed = JSON.parse(post.image_urls);
          if (Array.isArray(parsed)) {
            imageUrls = parsed;
            imgCount = parsed.length;
          } else {
            // Comma-separated string
            imageUrls = post.image_urls.split(',').map(s => s.trim());
            imgCount = imageUrls.length;
          }
        } catch (e) {
          // Comma-separated string
          imageUrls = post.image_urls.split(',').map(s => s.trim());
          imgCount = imageUrls.length;
        }
      }
    } catch (e) {
      console.log(`⚠️  Could not parse image_urls for ${post.scheduled_date} ${post.scheduled_time}`);
      continue;
    }

    // Check for wrong image count (should be 3 for carousels)
    if (post.post_type === 'carousel' && imgCount !== 3 && imgCount > 0) {
      issues.wrongImageCount.push({
        post,
        expected: 3,
        actual: imgCount,
        imageUrls,
      });
    }

    // Check for single image posts
    if (imgCount === 1) {
      issues.singleImagePosts.push({
        post,
        imageUrl: imageUrls[0],
      });
    }
  }

  // Report issues
  console.log('📋 RÉSULTATS DE L\'AUDIT\n');

  if (issues.wrongImageCount.length > 0) {
    console.log(`🔴 CRITIQUE: ${issues.wrongImageCount.length} posts avec nombre d'images incorrect:`);
    issues.wrongImageCount.forEach(({ post, expected, actual, imageUrls }) => {
      console.log(`\n   - ${post.scheduled_date} ${post.scheduled_time} | ${post.character.toUpperCase()} | ${post.post_type}`);
      console.log(`     Attendu: ${expected} images | Trouvé: ${actual} images`);
      console.log(`     Location: ${post.location_name}`);
      console.log(`     Status: ${post.status}`);
      console.log(`     Images:`);
      imageUrls.forEach((url, i) => {
        console.log(`       ${i + 1}. ${url.substring(0, 80)}...`);
      });
    });
    console.log('');
  }

  if (issues.singleImagePosts.length > 0) {
    console.log(`🟡 ATTENTION: ${issues.singleImagePosts.length} posts avec UNE SEULE image:`);
    issues.singleImagePosts.forEach(({ post, imageUrl }) => {
      console.log(`\n   - ${post.scheduled_date} ${post.scheduled_time} | ${post.character.toUpperCase()}`);
      console.log(`     Location: ${post.location_name}`);
      console.log(`     Status: ${post.status}`);
      console.log(`     Image: ${imageUrl.substring(0, 80)}...`);
    });
    console.log('');
  }

  // Scripts qui génèrent des photos isolées
  console.log('📝 SCRIPTS QUI GÉNÈRENT DES PHOTOS ISOLÉES:\n');
  console.log('   ⚠️  Scripts manuels (non automatiques):');
  console.log('      - elena-vanity-photo.mjs → Génère 1 photo isolée');
  console.log('      - elena-fanvue-free.mjs → Génère 6 photos isolées (Fanvue)');
  console.log('      - generate-fanvue-pack-elena.mjs → Génère 7 photos isolées (Fanvue pack)');
  console.log('      - test-*.mjs → Scripts de test (photos isolées)');
  console.log('');
  console.log('   ✅ Scripts automatiques (carrousels uniquement):');
  console.log('      - scheduled-post.mjs → Génère 3 images (carousel)');
  console.log('      - carousel-post.mjs → Génère 3 images (carousel)');
  console.log('      - carousel-post-elena.mjs → Génère 3 images (carousel)');
  console.log('      - duo-post.mjs → Génère 3 images (carousel)');
  console.log('');

  // Summary
  const totalIssues = issues.wrongImageCount.length + issues.singleImagePosts.length;
  if (totalIssues === 0) {
    console.log('✅ Aucun problème détecté ! Tous les posts ont 3 images.');
  } else {
    console.log(`\n📊 TOTAL PROBLÈMES: ${totalIssues}`);
    console.log(`   - Posts avec nombre d'images incorrect: ${issues.wrongImageCount.length}`);
    console.log(`   - Posts avec une seule image: ${issues.singleImagePosts.length}`);
  }

  // Recommendations
  console.log('\n💡 RECOMMANDATIONS:\n');
  console.log('   1. Vérifier si les scripts manuels (Fanvue) sont appelés automatiquement');
  console.log('   2. Vérifier les logs GitHub Actions pour voir quels scripts sont exécutés');
  console.log('   3. Vérifier Cloudinary pour identifier les photos orphelines');
  console.log('   4. S\'assurer que tous les posts automatiques génèrent exactement 3 images');
}

auditOrphanImages().catch(console.error);

