/**
 * Supabase Helper for Post Scripts
 * Saves posts to Supabase after Instagram publication
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = path.join(__dirname, '..', '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

let supabase = null;

function getSupabase() {
  if (!supabase && supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

/**
 * Save a post to Supabase after Instagram publication
 * 
 * @param {Object} params
 * @param {string} params.character - 'mila' | 'elena'
 * @param {string} params.instagramPostId - The IG post ID returned after publish
 * @param {string} params.postType - 'carousel' | 'reel' | 'photo'
 * @param {string[]} params.imageUrls - Array of Cloudinary URLs
 * @param {string} params.caption - The caption used
 * @param {string} params.locationName - Location name
 * @param {string} [params.locationKey] - Location key (e.g., 'paris_loft')
 * @param {string} [params.outfit] - Outfit description
 * @param {string} [params.action] - Action description
 * @param {string} [params.mood] - Mood of the post
 * @param {string} [params.prompt] - Generation prompt used
 * @param {string} [params.withCharacter] - If it's a duo post: 'mila' | 'elena'
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export async function savePostToSupabase({
  character,
  instagramPostId,
  postType,
  imageUrls,
  caption,
  locationName,
  locationKey,
  outfit,
  action,
  mood,
  prompt,
  withCharacter,
}) {
  const client = getSupabase();
  
  if (!client) {
    console.log('⚠️ Supabase not configured - skipping save');
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const postData = {
      character_name: character,
      instagram_post_id: instagramPostId,
      post_type: postType,
      image_urls: imageUrls,
      caption: caption?.substring(0, 2000),
      location_name: locationName,
      location_key: locationKey,
      outfit_description: outfit,
      action_description: action,
      mood: mood,
      prompt: prompt?.substring(0, 5000),
      with_character: withCharacter,
      posted_at: new Date().toISOString(),
      model_used: 'nano-banana-pro',
    };

    const { data, error } = await client
      .from('posts')
      .insert(postData)
      .select('id')
      .single();

    if (error) {
      console.log(`⚠️ Failed to save post to Supabase: ${error.message}`);
      return { success: false, error: error.message };
    }

    console.log(`✅ Post saved to Supabase: ${data.id}`);
    return { success: true, id: data.id };
  } catch (err) {
    console.log(`⚠️ Error saving to Supabase: ${err.message}`);
    return { success: false, error: err.message };
  }
}

export default { savePostToSupabase };

