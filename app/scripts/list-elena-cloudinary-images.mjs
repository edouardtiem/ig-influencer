#!/usr/bin/env node
/**
 * List Elena images from Cloudinary
 * Useful for finding reference images for Grok generation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('❌ Missing Cloudinary credentials');
  process.exit(1);
}

async function listElenaImages() {
  console.log('🔍 Searching for Elena images in Cloudinary...\n');
  
  const allImages = [];
  
  try {
    // Search all images and filter by "elena" in public_id
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/resources/image?max_results=500`;
    const auth = Buffer.from(`${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`).toString('base64');
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.resources && data.resources.length > 0) {
      // Filter images containing "elena" in public_id or folder
      const elenaImages = data.resources.filter(img => {
        const lowerId = img.public_id.toLowerCase();
        return lowerId.includes('elena') || lowerId.includes('fanvue');
      });
      
      console.log(`📁 Found ${elenaImages.length} Elena images out of ${data.resources.length} total\n`);
      
      elenaImages.forEach(img => {
        const folder = img.public_id.split('/')[0] || 'root';
        allImages.push({
          url: img.secure_url,
          publicId: img.public_id,
          folder,
          createdAt: img.created_at,
          format: img.format,
          width: img.width,
          height: img.height,
        });
      });
    }
  } catch (error) {
    console.error(`❌ Error listing images:`, error.message);
  }
  
  console.log(`\n✅ Found ${allImages.length} total Elena images\n`);
  
  // Group by category
  const categorized = {
    beach: [],
    bedroom: [],
    bathroom: [],
    lifestyle: [],
    other: [],
  };
  
  allImages.forEach(img => {
    const lowerId = img.publicId.toLowerCase();
    
    if (lowerId.includes('beach') || lowerId.includes('pool') || lowerId.includes('piscine') || lowerId.includes('bikini')) {
      categorized.beach.push(img);
    } else if (lowerId.includes('bed') || lowerId.includes('lit') || lowerId.includes('morning') || lowerId.includes('stretch')) {
      categorized.bedroom.push(img);
    } else if (lowerId.includes('bath') || lowerId.includes('shower') || lowerId.includes('douche') || lowerId.includes('mirror')) {
      categorized.bathroom.push(img);
    } else if (lowerId.includes('yoga') || lowerId.includes('sofa') || lowerId.includes('vanity') || lowerId.includes('cozy')) {
      categorized.lifestyle.push(img);
    } else {
      categorized.other.push(img);
    }
  });
  
  // Display categorized
  console.log('📊 Categorized images:\n');
  console.log(`🏖️  Beach/Pool: ${categorized.beach.length}`);
  categorized.beach.slice(0, 3).forEach(img => {
    console.log(`   - ${img.publicId}`);
    console.log(`     ${img.url}`);
  });
  
  console.log(`\n🛏️  Bedroom: ${categorized.bedroom.length}`);
  categorized.bedroom.slice(0, 3).forEach(img => {
    console.log(`   - ${img.publicId}`);
    console.log(`     ${img.url}`);
  });
  
  console.log(`\n🚿 Bathroom: ${categorized.bathroom.length}`);
  categorized.bathroom.slice(0, 3).forEach(img => {
    console.log(`   - ${img.publicId}`);
    console.log(`     ${img.url}`);
  });
  
  console.log(`\n🏠 Lifestyle: ${categorized.lifestyle.length}`);
  categorized.lifestyle.slice(0, 3).forEach(img => {
    console.log(`   - ${img.publicId}`);
    console.log(`     ${img.url}`);
  });
  
  // Generate reference object for grok.ts
  console.log('\n\n📋 Reference URLs for grok.ts:\n');
  console.log('const ELENA_REFERENCES = {');
  console.log(`  beach: [${categorized.beach.slice(0, 5).map(img => `'${img.url}'`).join(',\n    ')}],`);
  console.log(`  bedroom: [${categorized.bedroom.slice(0, 5).map(img => `'${img.url}'`).join(',\n    ')}],`);
  console.log(`  bathroom: [${categorized.bathroom.slice(0, 5).map(img => `'${img.url}'`).join(',\n    ')}],`);
  console.log(`  lifestyle: [${categorized.lifestyle.slice(0, 5).map(img => `'${img.url}'`).join(',\n    ')}],`);
  console.log('};');
}

listElenaImages().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});

