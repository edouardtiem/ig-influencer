#!/usr/bin/env node
/**
 * Check Elena posts scheduled for today
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const today = new Date().toISOString().split('T')[0];
  
  console.log(`\n📅 Posts Elena programmés pour aujourd'hui (${today}):\n`);

  const { data, error } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('character', 'elena')
    .eq('scheduled_date', today)
    .order('scheduled_time', { ascending: true });

  if (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('❌ Aucun post programmé pour aujourd\'hui');
    return;
  }

  data.forEach((p) => {
    const time = p.scheduled_time ? p.scheduled_time.substring(0, 5) : 'N/A';
    
    console.log(`⏰ ${time} — ${p.status.toUpperCase()}`);
    console.log(`   Type: ${p.type}`);
    console.log(`   Location: ${p.location_name || 'N/A'}`);
    if (p.outfit) console.log(`   Outfit: ${p.outfit.substring(0, 60)}...`);
    if (p.image_urls) console.log(`   Images: ${p.image_urls.length} générées`);
    if (p.instagram_post_id) console.log(`   ✅ IG Post ID: ${p.instagram_post_id}`);
    if (p.error_message) console.log(`   ❌ Error: ${p.error_message}`);
    console.log('');
  });
}

main().catch(console.error);
