#!/usr/bin/env node
/**
 * Check impressions data in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function main() {
  // Get all posts
  const { data: stats } = await supabase
    .from('posts')
    .select('character_name, impressions, reach, likes_count, posted_at')
    .order('posted_at', { ascending: false });

  console.log('\n📊 DONNÉES DANS SUPABASE:');
  console.log('═'.repeat(60));

  // Group by character
  const mila = stats.filter(p => p.character_name === 'mila');
  const elena = stats.filter(p => p.character_name === 'elena');

  console.log('\n👩 MILA:');
  console.log('   Posts total:', mila.length);
  console.log('   Total impressions:', mila.reduce((s, p) => s + (p.impressions || 0), 0));
  console.log('   Total reach:', mila.reduce((s, p) => s + (p.reach || 0), 0));
  console.log('   Posts avec impressions > 0:', mila.filter(p => p.impressions > 0).length);

  console.log('\n✨ ELENA:');
  console.log('   Posts total:', elena.length);
  console.log('   Total impressions:', elena.reduce((s, p) => s + (p.impressions || 0), 0));
  console.log('   Total reach:', elena.reduce((s, p) => s + (p.reach || 0), 0));
  console.log('   Posts avec impressions > 0:', elena.filter(p => p.impressions > 0).length);

  console.log('\n📅 MILA - Derniers posts avec impressions:');
  mila.filter(p => p.impressions > 0).slice(0, 15).forEach(p => {
    const date = p.posted_at ? new Date(p.posted_at).toLocaleDateString('fr-FR') : 'N/A';
    console.log(`   ${date} | views: ${p.impressions} | reach: ${p.reach} | likes: ${p.likes_count}`);
  });

  console.log('\n📅 ELENA - Derniers posts avec impressions:');
  elena.filter(p => p.impressions > 0).slice(0, 15).forEach(p => {
    const date = p.posted_at ? new Date(p.posted_at).toLocaleDateString('fr-FR') : 'N/A';
    console.log(`   ${date} | views: ${p.impressions} | reach: ${p.reach} | likes: ${p.likes_count}`);
  });

  // Check posts without impressions
  const milaNoImpressions = mila.filter(p => !p.impressions || p.impressions === 0);
  const elenaNoImpressions = elena.filter(p => !p.impressions || p.impressions === 0);

  console.log('\n⚠️  POSTS SANS IMPRESSIONS (besoin re-sync):');
  console.log(`   Mila: ${milaNoImpressions.length} posts`);
  console.log(`   Elena: ${elenaNoImpressions.length} posts`);

  if (milaNoImpressions.length > 0) {
    console.log('\n   Mila posts sans views:');
    milaNoImpressions.slice(0, 5).forEach(p => {
      const date = p.posted_at ? new Date(p.posted_at).toLocaleDateString('fr-FR') : 'N/A';
      console.log(`     ${date} | likes: ${p.likes_count}`);
    });
  }
}

main().catch(console.error);

