#!/usr/bin/env node
/**
 * Upload Mila Tesla Red test images to Cloudinary
 */

import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Images to upload
const imagesToUpload = [
  {
    path: path.join(__dirname, '../generated/mila-color-tests/mila-tesla-red-exact-1766360418752.jpg'),
    name: 'mila-tesla-red-exact',
  },
  {
    path: path.join(__dirname, '../generated/mila-color-tests/mila-cherry-burgundy-gloss-1766360487396.jpg'),
    name: 'mila-cherry-burgundy-gloss',
  },
];

async function uploadImage(imagePath, publicId) {
  console.log(`\n📤 Uploading: ${path.basename(imagePath)}`);
  
  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'mila-tesla-red',
      public_id: publicId,
      resource_type: 'image',
      overwrite: true,
    });
    
    console.log(`   ✅ Uploaded!`);
    console.log(`   📎 URL: ${result.secure_url}`);
    
    return {
      success: true,
      name: publicId,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, name: publicId, error: error.message };
  }
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║     ☁️  UPLOAD MILA TESLA RED TO CLOUDINARY                     ║
╚════════════════════════════════════════════════════════════════╝
`);

  const results = [];
  
  for (const img of imagesToUpload) {
    if (fs.existsSync(img.path)) {
      results.push(await uploadImage(img.path, img.name));
    } else {
      console.log(`\n⚠️  File not found: ${img.path}`);
    }
  }
  
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`                    📊 SUMMARY`);
  console.log(`${'═'.repeat(60)}\n`);
  
  const successful = results.filter(r => r.success);
  console.log(`✅ ${successful.length}/${results.length} uploaded\n`);
  
  console.log(`📎 CLOUDINARY URLs:\n`);
  successful.forEach(r => {
    console.log(`   ${r.name}:`);
    console.log(`   ${r.url}\n`);
  });
}

main().catch(console.error);

