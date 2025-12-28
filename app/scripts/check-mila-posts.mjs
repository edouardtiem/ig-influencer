#!/usr/bin/env node
/**
 * Vérifie les posts Mila non-postés dans Supabase
 * 
 * Usage: node scripts/check-mila-posts.mjs
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function main() {
  console.log('🔍 Vérification des posts Mila non-postés...\n');

  const { data, error } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('character', 'mila')
    .neq('status', 'posted')
    .order('scheduled_date', { ascending: false })
    .order('scheduled_time', { ascending: true });

  if (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }

  if (data && data.length > 0) {
    console.log(`⚠️  ${data.length} posts Mila non-postés trouvés:\n`);
    data.forEach((p) => {
      console.log(
        `  - ${p.scheduled_date} ${p.scheduled_time} | ${p.status} | ${p.location_name}`
      );
      if (p.image_urls && p.image_urls.length > 0) {
        console.log(`    Images générées: ${p.image_urls.length}`);
      }
    });
    console.log(
      '\n💡 Ces posts seront ignorés par l\'executor (Mila désactivée)'
    );
    console.log('   Mais ils restent dans la base de données.\n');
  } else {
    console.log('✅ Aucun post Mila non-posté trouvé\n');
  }
}

main().catch(console.error);

