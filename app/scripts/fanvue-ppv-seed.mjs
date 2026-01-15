#!/usr/bin/env node

/**
 * Fanvue PPV Content Seed Script
 * 
 * Populates the fanvue_ppv_content table with content from config.
 * Run after creating the migration.
 * 
 * Usage:
 *   node scripts/fanvue-ppv-seed.mjs
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// ===========================================
// PPV CONTENT CATALOG (copy from config)
// ===========================================

const PPV_CONTENT_CATALOG = [
  // TEASER
  {
    name: 'elena-teaser-lingerie-1',
    description: 'Elena in black lace lingerie, bedroom setting',
    price: 199,
    category: 'teaser',
    cloudinary_url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1/elena-fanvue-ppv/teaser-lingerie-1.jpg',
    teaser_url: 'https://res.cloudinary.com/dily60mr0/image/upload/e_blur:1000/v1/elena-fanvue-ppv/teaser-lingerie-1.jpg',
    tags: ['lingerie', 'bedroom', 'black', 'lace'],
    target_tone: ['playful', 'sweet', 'mysterious'],
  },
  {
    name: 'elena-teaser-bikini-1',
    description: 'Elena in red bikini, pool setting',
    price: 199,
    category: 'teaser',
    cloudinary_url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1/elena-fanvue-ppv/teaser-bikini-1.jpg',
    teaser_url: 'https://res.cloudinary.com/dily60mr0/image/upload/e_blur:1000/v1/elena-fanvue-ppv/teaser-bikini-1.jpg',
    tags: ['bikini', 'pool', 'red', 'summer'],
    target_tone: ['playful', 'bratty'],
  },

  // SOFT
  {
    name: 'elena-soft-silk-robe-1',
    description: 'Elena in silk robe, morning light',
    price: 399,
    category: 'soft',
    cloudinary_url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1/elena-fanvue-ppv/soft-silk-robe-1.jpg',
    teaser_url: 'https://res.cloudinary.com/dily60mr0/image/upload/e_blur:800/v1/elena-fanvue-ppv/soft-silk-robe-1.jpg',
    tags: ['silk', 'robe', 'morning', 'intimate'],
    target_tone: ['sweet', 'mysterious', 'romantic'],
  },
  {
    name: 'elena-soft-white-lingerie-1',
    description: 'Elena in white bridal lingerie',
    price: 499,
    category: 'soft',
    cloudinary_url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1/elena-fanvue-ppv/soft-white-lingerie-1.jpg',
    teaser_url: 'https://res.cloudinary.com/dily60mr0/image/upload/e_blur:800/v1/elena-fanvue-ppv/soft-white-lingerie-1.jpg',
    tags: ['lingerie', 'white', 'bridal', 'innocent'],
    target_tone: ['sweet', 'romantic'],
  },
  {
    name: 'elena-soft-sports-bra-1',
    description: 'Elena in sports bra after workout',
    price: 399,
    category: 'soft',
    cloudinary_url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1/elena-fanvue-ppv/soft-sports-bra-1.jpg',
    teaser_url: 'https://res.cloudinary.com/dily60mr0/image/upload/e_blur:800/v1/elena-fanvue-ppv/soft-sports-bra-1.jpg',
    tags: ['sports', 'fitness', 'athletic', 'casual'],
    target_tone: ['playful', 'bratty'],
  },

  // SPICY
  {
    name: 'elena-spicy-shower-1',
    description: 'Elena in shower, wet and steamy',
    price: 699,
    category: 'spicy',
    cloudinary_url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1/elena-fanvue-ppv/spicy-shower-1.jpg',
    teaser_url: 'https://res.cloudinary.com/dily60mr0/image/upload/e_blur:600/v1/elena-fanvue-ppv/spicy-shower-1.jpg',
    tags: ['shower', 'wet', 'steamy', 'bathroom'],
    target_tone: ['dominant', 'mysterious'],
  },
  {
    name: 'elena-spicy-bed-1',
    description: 'Elena on bed, barely covered',
    price: 799,
    category: 'spicy',
    cloudinary_url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1/elena-fanvue-ppv/spicy-bed-1.jpg',
    teaser_url: 'https://res.cloudinary.com/dily60mr0/image/upload/e_blur:600/v1/elena-fanvue-ppv/spicy-bed-1.jpg',
    tags: ['bed', 'sheets', 'intimate', 'sensual'],
    target_tone: ['sweet', 'romantic', 'mysterious'],
  },
  {
    name: 'elena-spicy-mirror-1',
    description: 'Elena mirror selfie, revealing outfit',
    price: 699,
    category: 'spicy',
    cloudinary_url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1/elena-fanvue-ppv/spicy-mirror-1.jpg',
    teaser_url: 'https://res.cloudinary.com/dily60mr0/image/upload/e_blur:600/v1/elena-fanvue-ppv/spicy-mirror-1.jpg',
    tags: ['mirror', 'selfie', 'revealing', 'casual'],
    target_tone: ['bratty', 'playful'],
  },

  // EXPLICIT
  {
    name: 'elena-explicit-set-1',
    description: 'Elena explicit photo set (5 photos)',
    price: 1299,
    category: 'explicit',
    cloudinary_url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1/elena-fanvue-ppv/explicit-set-1.jpg',
    teaser_url: 'https://res.cloudinary.com/dily60mr0/image/upload/e_blur:500/v1/elena-fanvue-ppv/explicit-set-1.jpg',
    tags: ['explicit', 'set', 'premium', 'full'],
    target_tone: ['dominant', 'bratty'],
  },
  {
    name: 'elena-explicit-video-preview-1',
    description: 'Elena video preview (30s)',
    price: 1499,
    category: 'explicit',
    cloudinary_url: 'https://res.cloudinary.com/dily60mr0/image/upload/v1/elena-fanvue-ppv/explicit-video-preview-1.jpg',
    teaser_url: 'https://res.cloudinary.com/dily60mr0/image/upload/e_blur:500/v1/elena-fanvue-ppv/explicit-video-preview-1.jpg',
    tags: ['video', 'preview', 'premium', 'motion'],
    target_tone: ['dominant', 'mysterious'],
  },
];

// ===========================================
// MAIN
// ===========================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🎬 FANVUE PPV CONTENT SEED');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Check existing content
  const { data: existing, error: checkError } = await supabase
    .from('fanvue_ppv_content')
    .select('name');

  if (checkError) {
    console.error('❌ Error checking existing content:', checkError.message);
    console.log('\n⚠️ Make sure to run the migration first:');
    console.log('   npx supabase db push');
    process.exit(1);
  }

  const existingNames = new Set(existing?.map(e => e.name) || []);
  console.log(`📊 Existing content: ${existingNames.size} items\n`);

  // Insert new content
  let inserted = 0;
  let skipped = 0;

  for (const content of PPV_CONTENT_CATALOG) {
    if (existingNames.has(content.name)) {
      console.log(`  ⏭️ ${content.name} (already exists)`);
      skipped++;
      continue;
    }

    const { error } = await supabase
      .from('fanvue_ppv_content')
      .insert(content);

    if (error) {
      console.error(`  ❌ ${content.name}: ${error.message}`);
    } else {
      console.log(`  ✅ ${content.name} (${content.price / 100}€)`);
      inserted++;
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Total in catalog: ${PPV_CONTENT_CATALOG.length}`);
  console.log('\n✅ Seed complete!');
}

main().catch(console.error);
