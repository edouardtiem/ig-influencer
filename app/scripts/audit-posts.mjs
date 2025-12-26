#!/usr/bin/env node
/**
 * Audit Script — Vérifie l'état des posts générés vs publiés
 * 
 * Identifie:
 * - Posts avec images générées mais non publiés
 * - Posts marqués "posted" mais sans instagram_post_id
 * - Problèmes de format image_urls
 * - Posts bloqués en "generating" ou "images_ready"
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function auditPosts() {
  console.log('🔍 AUDIT DES POSTS — Génération vs Publication\n');
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

  // Categorize posts
  const issues = {
    imagesButNotPosted: [],
    postedButNoId: [],
    stuckGenerating: [],
    stuckImagesReady: [],
    formatIssues: [],
  };

  for (const post of posts) {
    // Check 1: Images générées mais pas publiées
    if (post.image_urls && post.status !== 'posted') {
      issues.imagesButNotPosted.push(post);
    }

    // Check 2: Marqué "posted" mais pas d'instagram_post_id
    if (post.status === 'posted' && !post.instagram_post_id) {
      issues.postedButNoId.push(post);
    }

    // Check 3: Bloqué en "generating"
    if (post.status === 'generating') {
      const started = post.generation_started_at ? new Date(post.generation_started_at) : null;
      if (started) {
        const hoursAgo = (Date.now() - started.getTime()) / (1000 * 60 * 60);
        if (hoursAgo > 1) {
          issues.stuckGenerating.push(post);
        }
      }
    }

    // Check 4: Bloqué en "images_ready"
    if (post.status === 'images_ready') {
      const completed = post.generation_completed_at ? new Date(post.generation_completed_at) : null;
      if (completed) {
        const hoursAgo = (Date.now() - completed.getTime()) / (1000 * 60 * 60);
        if (hoursAgo > 1) {
          issues.stuckImagesReady.push(post);
        }
      }
    }

    // Check 5: Format image_urls
    if (post.image_urls) {
      let isValid = false;
      if (Array.isArray(post.image_urls)) {
        isValid = true;
      } else if (typeof post.image_urls === 'string') {
        try {
          const parsed = JSON.parse(post.image_urls);
          isValid = Array.isArray(parsed);
        } catch (e) {
          isValid = false;
        }
      }

      if (!isValid) {
        issues.formatIssues.push(post);
      }
    }
  }

  // Report issues
  console.log('📋 RÉSULTATS DE L\'AUDIT\n');

  if (issues.postedButNoId.length > 0) {
    console.log(`🔴 CRITIQUE: ${issues.postedButNoId.length} posts marqués "posted" mais sans instagram_post_id:`);
    issues.postedButNoId.forEach(p => {
      console.log(`   - ${p.scheduled_date} ${p.scheduled_time} | ${p.character} | ${p.location_name}`);
      console.log(`     Status: ${p.status}, Instagram ID: ${p.instagram_post_id || 'NULL'}`);
      if (p.error_message) {
        console.log(`     Error: ${p.error_message.substring(0, 100)}`);
      }
    });
    console.log('');
  }

  if (issues.imagesButNotPosted.length > 0) {
    console.log(`🟡 ATTENTION: ${issues.imagesButNotPosted.length} posts avec images générées mais non publiés:`);
    issues.imagesButNotPosted.forEach(p => {
      const imgCount = Array.isArray(p.image_urls) 
        ? p.image_urls.length 
        : (typeof p.image_urls === 'string' ? '?' : 0);
      console.log(`   - ${p.scheduled_date} ${p.scheduled_time} | ${p.character} | ${p.status} | ${imgCount} images`);
      console.log(`     Location: ${p.location_name}`);
      if (p.error_message) {
        console.log(`     Error: ${p.error_message.substring(0, 100)}`);
      }
    });
    console.log('');
  }

  if (issues.stuckGenerating.length > 0) {
    console.log(`🟠 BLOQUÉ: ${issues.stuckGenerating.length} posts bloqués en "generating":`);
    issues.stuckGenerating.forEach(p => {
      console.log(`   - ${p.scheduled_date} ${p.scheduled_time} | ${p.character} | ${p.location_name}`);
    });
    console.log('');
  }

  if (issues.stuckImagesReady.length > 0) {
    console.log(`🟠 BLOQUÉ: ${issues.stuckImagesReady.length} posts bloqués en "images_ready":`);
    issues.stuckImagesReady.forEach(p => {
      const imgCount = Array.isArray(p.image_urls) 
        ? p.image_urls.length 
        : (typeof p.image_urls === 'string' ? '?' : 0);
      console.log(`   - ${p.scheduled_date} ${p.scheduled_time} | ${p.character} | ${imgCount} images | ${p.location_name}`);
    });
    console.log('');
  }

  if (issues.formatIssues.length > 0) {
    console.log(`⚠️ FORMAT: ${issues.formatIssues.length} posts avec format image_urls invalide:`);
    issues.formatIssues.forEach(p => {
      console.log(`   - ${p.scheduled_date} ${p.scheduled_time} | ${p.character}`);
      console.log(`     Type: ${typeof p.image_urls}, Value: ${String(p.image_urls).substring(0, 100)}`);
    });
    console.log('');
  }

  // Summary
  const totalIssues = Object.values(issues).reduce((sum, arr) => sum + arr.length, 0);
  if (totalIssues === 0) {
    console.log('✅ Aucun problème détecté !');
  } else {
    console.log(`\n📊 TOTAL PROBLÈMES: ${totalIssues}`);
  }

  // Today's status
  console.log('\n📅 STATUT AUJOURD\'HUI:');
  const today = new Date().toISOString().split('T')[0];
  const todayPosts = posts.filter(p => p.scheduled_date === today);
  const todayByStatus = {};
  todayPosts.forEach(p => {
    todayByStatus[p.status] = (todayByStatus[p.status] || 0) + 1;
  });
  
  Object.entries(todayByStatus).forEach(([status, count]) => {
    const icon = status === 'posted' ? '✅' : status === 'scheduled' ? '⏳' : status === 'images_ready' ? '📸' : '🔄';
    console.log(`   ${icon} ${status}: ${count}`);
  });
}

auditPosts().catch(console.error);

