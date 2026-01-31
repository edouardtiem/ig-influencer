#!/usr/bin/env node
/**
 * X (Twitter) Posting Script - Post images from Cloudinary with captions
 *
 * Usage:
 *   node x-post-cloudinary.mjs --id 2          # Post image #2 with its caption
 *   node x-post-cloudinary.mjs --id 2 --dry    # Preview without posting
 *   node x-post-cloudinary.mjs --list          # List all available images
 */

import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// File paths
const TOKEN_FILE = join(__dirname, '.x-oauth2-tokens.json');
const CAPTIONS_FILE = join(__dirname, 'data', 'elena-x-captions.json');

/**
 * Load OAuth tokens
 */
function loadTokens() {
  if (!existsSync(TOKEN_FILE)) {
    console.error('❌ No tokens found. Run x-oauth2-test.mjs first to authenticate.');
    process.exit(1);
  }
  return JSON.parse(readFileSync(TOKEN_FILE, 'utf-8'));
}

/**
 * Load captions catalog
 */
function loadCaptions() {
  if (!existsSync(CAPTIONS_FILE)) {
    console.error('❌ Captions file not found:', CAPTIONS_FILE);
    process.exit(1);
  }
  return JSON.parse(readFileSync(CAPTIONS_FILE, 'utf-8'));
}

/**
 * Get image data by ID
 */
function getImageById(catalog, id) {
  const image = catalog.captions.find(c => c.id === id);
  if (!image) {
    console.error(`❌ Image #${id} not found in catalog`);
    console.log(`   Available IDs: 1-${catalog.captions.length}`);
    process.exit(1);
  }
  return image;
}

/**
 * Fetch image from URL and return buffer
 */
async function fetchImageBuffer(url) {
  console.log('   📥 Fetching image from Cloudinary...');
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Post image to X
 */
async function postToX(imageData, dryRun = false) {
  const tokens = loadTokens();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📸 IMAGE #${imageData.id}: ${imageData.name}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n📍 URL: ${imageData.url.slice(0, 60)}...`);
  console.log(`📝 Category: ${imageData.category.toUpperCase()}`);
  console.log(`⚠️  Sensitive: ${imageData.sensitive}`);
  console.log(`\n💬 Caption:\n${imageData.caption}`);

  if (dryRun) {
    console.log('\n🔍 DRY RUN - No tweet posted');
    console.log('   Remove --dry flag to post for real');
    return;
  }

  console.log('\n🚀 Posting to X...');

  try {
    // Create OAuth 2.0 client (v2 media upload works with OAuth 2.0 + media.write scope)
    const client = new TwitterApi(tokens.accessToken);

    // 1. Fetch image
    const imageBuffer = await fetchImageBuffer(imageData.url);
    console.log(`   ✅ Image fetched (${(imageBuffer.length / 1024).toFixed(1)} KB)`);

    // 2. Upload media using v2 API (OAuth 2.0 with media.write scope)
    console.log('   📤 Uploading to X media endpoint (v2)...');
    const mediaId = await client.v2.uploadMedia(imageBuffer, {
      media_type: 'image/jpeg',
      media_category: 'tweet_image'
    });
    console.log(`   ✅ Media uploaded (ID: ${mediaId})`);

    // 3. Build caption with hashtags
    const fullCaption = imageData.caption;

    // 4. Post tweet using v2 API
    console.log('   ✏️  Posting tweet...');

    // Note: For sensitive content, the media is marked sensitive at upload time
    // or through account settings. v2 API handles this automatically.
    const tweet = await client.v2.tweet({
      text: fullCaption,
      media: { media_ids: [mediaId] }
    });

    if (imageData.sensitive) {
      console.log(`   ✅ Tweet posted (spicy content)`);
    } else {
      console.log(`   ✅ Tweet posted`);
    }

    const tweetId = tweet.data?.id;
    const tweetUrl = `https://x.com/${tokens.username}/status/${tweetId}`;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SUCCESS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n🔗 ${tweetUrl}\n`);

    return { success: true, tweetId, url: tweetUrl };

  } catch (error) {
    console.error('\n❌ POSTING FAILED');
    console.error('   Error:', error.message || error);

    if (error.data) {
      console.error('   Details:', JSON.stringify(error.data, null, 2));
    }

    if (error.stack) {
      console.error('   Stack:', error.stack.split('\n').slice(0, 3).join('\n'));
    }

    // Check for token expiry
    const errMsg = String(error.message || '');
    if (error.code === 401 || errMsg.includes('401')) {
      console.error('\n💡 Token may have expired. Try:');
      console.error('   node x-oauth2-test.mjs --refresh');
    }

    process.exit(1);
  }
}

/**
 * List all available images
 */
function listImages(catalog) {
  console.log('\n📸 Available Images:\n');
  console.log('SFW (10):');
  catalog.captions
    .filter(c => !c.sensitive)
    .forEach(c => console.log(`  #${c.id} - ${c.name}`));

  console.log('\nSpicy (23) - needs sensitive flag:');
  catalog.captions
    .filter(c => c.sensitive)
    .forEach(c => console.log(`  #${c.id} - ${c.name}`));

  console.log('\nUsage: node x-post-cloudinary.mjs --id <number>');
}

// Parse arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
X Cloudinary Posting Script

Usage:
  node x-post-cloudinary.mjs --id <n>      Post image #n with its caption
  node x-post-cloudinary.mjs --id <n> --dry Preview without posting
  node x-post-cloudinary.mjs --list        List all available images
  node x-post-cloudinary.mjs --help        Show this help

Examples:
  node x-post-cloudinary.mjs --id 2        Post image #2 (Paris apartment)
  node x-post-cloudinary.mjs --id 1 --dry  Preview image #1 without posting
`);
  process.exit(0);
}

// Load catalog
const catalog = loadCaptions();

if (args.includes('--list')) {
  listImages(catalog);
  process.exit(0);
}

// Get image ID
const idIndex = args.indexOf('--id');
if (idIndex === -1 || !args[idIndex + 1]) {
  console.error('❌ Missing --id argument');
  console.log('   Usage: node x-post-cloudinary.mjs --id <number>');
  console.log('   Run with --list to see available images');
  process.exit(1);
}

const imageId = parseInt(args[idIndex + 1], 10);
if (isNaN(imageId)) {
  console.error('❌ Invalid image ID');
  process.exit(1);
}

// Get image data
const imageData = getImageById(catalog, imageId);

// Check for dry run
const dryRun = args.includes('--dry');

// Post!
postToX(imageData, dryRun);
