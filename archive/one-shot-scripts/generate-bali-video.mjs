#!/usr/bin/env node
/**
 * Generate hyper-realistic 8s video from Bali beach image using Veo 3.1
 * Then schedule post to Instagram in 1 hour via Make.com + Buffer
 * 
 * Run with: node scripts/generate-bali-video.mjs
 */

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

// Load environment from .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Input image from previous generation
const INPUT_IMAGE_PATH = '/Users/edouardtiem/Cursor Projects/IG-influencer/app/generated/bali-beach-1765466353836.jpg';
const INPUT_IMAGE_URL = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765466354/mila-posts/bali-beach-1765466353838.jpg';

// Convert local file to base64 data URI
function fileToBase64(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const base64 = fileBuffer.toString('base64');
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
}

/**
 * MiniMax (Hailuo) Video Prompt - MINIMAL REALISTIC MOVEMENT
 * 
 * Best practices for hyper-realism:
 * - Subtle, natural movements only
 * - Gentle walking (few steps)
 * - Hair moving in breeze
 * - Waves lapping gently
 * - Static or slow tracking camera
 */
const VIDEO_PROMPT = `Cinematic beach scene at golden hour. The woman takes a few slow graceful steps forward along the water's edge. Her curly auburn hair sways gently in the ocean breeze. Gentle waves lap at the shore with realistic water movement. The boat floats calmly on the sea. Warm sunset lighting. Palm trees sway slightly in background. Camera mostly static with subtle movement. Photorealistic, cinematic quality, smooth natural motion.`;

// Instagram Reel Caption
const CAPTION = `Bali on my mind 🌴✨

These golden hour walks along the beach... nothing compares 🌅

Sound on for the vibes 🎧

#bali #balilife #beachvibes #goldenhour #reels #travelreels #beachlife #wanderlust #summervibes #tropicalparadise #islandlife #travelblogger #beachwalk #sundowner #balibabe #vacationmode`;

async function main() {
  console.log('🎬 Starting Veo 3.1 video generation from Bali image...\n');
  
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    console.error('❌ REPLICATE_API_TOKEN not found in .env.local');
    process.exit(1);
  }
  
  const webhookUrl = process.env.MAKE_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('❌ MAKE_WEBHOOK_URL not found in .env.local');
    process.exit(1);
  }
  
  // Check if input image exists
  if (!fs.existsSync(INPUT_IMAGE_PATH)) {
    console.error('❌ Input image not found:', INPUT_IMAGE_PATH);
    console.log('   Using Cloudinary URL instead...');
  }
  
  const replicate = new Replicate({ auth: apiToken });
  
  try {
    // Convert image to base64 for Veo 3.1
    console.log('📷 Preparing input image...');
    let imageInput;
    
    if (fs.existsSync(INPUT_IMAGE_PATH)) {
      imageInput = fileToBase64(INPUT_IMAGE_PATH);
      console.log('   ✅ Loaded from local file');
    } else {
      imageInput = INPUT_IMAGE_URL;
      console.log('   ✅ Using Cloudinary URL');
    }
    
    console.log(`\n📝 Video prompt: Subtle walking, hair in breeze, gentle waves`);
    console.log('🎬 Calling MiniMax video-01 (Hailuo) on Replicate...');
    console.log('   Duration: 6 seconds');
    console.log('   Resolution: 720p');
    console.log('   Model: minimax/video-01\n');
    
    const startTime = Date.now();
    
    // Call MiniMax video-01 (Hailuo) image-to-video
    const output = await replicate.run("minimax/video-01", {
      input: {
        prompt: VIDEO_PROMPT,
        first_frame_image: imageInput,
      }
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`⏱️  Generation completed in ${duration}s`);
    
    // Handle output - MiniMax returns a FileOutput object
    let videoUrl = null;
    let videoPath = null;
    
    console.log('\n📦 Processing output...');
    console.log('   Output type:', typeof output);
    
    if (typeof output === 'string') {
      videoUrl = output;
      console.log('✅ Got video URL (string):', videoUrl);
    } else if (output && typeof output === 'object') {
      // MiniMax returns a FileOutput object with url() method
      if (typeof output.url === 'function') {
        const urlObj = output.url();
        videoUrl = urlObj.href || urlObj.toString();
        console.log('✅ Got video URL from url() method:', videoUrl);
      } else if (typeof output.url === 'string') {
        videoUrl = output.url;
        console.log('✅ Got video URL from output.url:', videoUrl);
      } else if (output.video) {
        videoUrl = typeof output.video === 'function' ? output.video().href : output.video;
        console.log('✅ Got video URL from output.video:', videoUrl);
      } else if (Array.isArray(output) && output[0]) {
        const firstItem = output[0];
        if (typeof firstItem === 'string') {
          videoUrl = firstItem;
        } else if (typeof firstItem.url === 'function') {
          videoUrl = firstItem.url().href;
        } else if (firstItem.url) {
          videoUrl = firstItem.url;
        }
        console.log('✅ Got video URL from array:', videoUrl);
      } else if (output.href) {
        videoUrl = output.href;
        console.log('✅ Got video URL from output.href:', videoUrl);
      } else if (output.toString && output.toString().startsWith('http')) {
        videoUrl = output.toString();
        console.log('✅ Got video URL from toString():', videoUrl);
      } else {
        // Try to stringify and find URL
        console.log('   Raw output keys:', Object.keys(output));
        const outputStr = JSON.stringify(output, (key, value) => {
          if (typeof value === 'function') return '[Function]';
          return value;
        }, 2);
        console.log('   Output structure:', outputStr);
        
        const urlMatch = outputStr.match(/https?:\/\/[^\s"]+/);
        if (urlMatch) {
          videoUrl = urlMatch[0];
          console.log('✅ Extracted video URL:', videoUrl);
        }
      }
    }
    
    if (!videoUrl) {
      console.error('\n❌ Failed to get video URL from output');
      console.log('Output type:', typeof output);
      console.log('Output:', output);
      process.exit(1);
    }
    
    // Download video locally
    console.log('\n📥 Downloading video...');
    const videoResponse = await fetch(videoUrl);
    const videoBuffer = await videoResponse.arrayBuffer();
    
    const outputDir = path.join(__dirname, '..', 'generated');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const filename = `bali-beach-video-${Date.now()}.mp4`;
    videoPath = path.join(outputDir, filename);
    fs.writeFileSync(videoPath, Buffer.from(videoBuffer));
    console.log('✅ Video saved to:', videoPath);
    
    // Upload video to Cloudinary
    console.log('\n📤 Uploading video to Cloudinary...');
    
    const uploadResult = await cloudinary.uploader.upload(videoPath, {
      folder: 'mila-posts',
      public_id: `bali-beach-video-${Date.now()}`,
      resource_type: 'video',
    });
    
    const cloudinaryVideoUrl = uploadResult.secure_url;
    console.log('✅ Uploaded to Cloudinary:', cloudinaryVideoUrl);
    
    // Calculate schedule time (1 hour from now)
    const scheduleTime = new Date(Date.now() + 60 * 60 * 1000);
    const scheduleTimeStr = scheduleTime.toISOString();
    
    // Post to Instagram via Make.com (scheduled for 1 hour)
    console.log('\n📡 Sending to Make.com webhook → Buffer → Instagram...');
    console.log(`   Scheduled for: ${scheduleTime.toLocaleString()}`);
    console.log(`   Caption: ${CAPTION.slice(0, 50)}...`);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: cloudinaryVideoUrl,  // Buffer/Make can handle video URLs too
        video: cloudinaryVideoUrl,
        caption: CAPTION,
        scheduled_at: scheduleTimeStr,
        type: 'video',  // Indicate this is a video/reel
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Webhook error: ${response.status}`);
      console.error(errorText);
      process.exit(1);
    }
    
    const responseText = await response.text();
    console.log('\n🎉 SUCCESS! Video reel scheduled for Instagram');
    console.log(`   Response: ${responseText || '(empty - OK)'}`);
    console.log(`\n⏰ Will be posted at: ${scheduleTime.toLocaleString()}`);
    console.log(`\n🎬 Video URL: ${cloudinaryVideoUrl}`);
    console.log(`📁 Local file: ${videoPath}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

main();



