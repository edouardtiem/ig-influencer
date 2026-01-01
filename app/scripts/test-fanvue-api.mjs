#!/usr/bin/env node
/**
 * Quick Fanvue API Test
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

const FANVUE_API_URL = 'https://api.fanvue.com';

async function testFanvue() {
  console.log('🔄 Testing Fanvue API...\n');
  
  const accessToken = process.env.FANVUE_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.log('❌ No FANVUE_ACCESS_TOKEN found');
    return;
  }
  
  console.log('📋 Token found:', accessToken.slice(0, 50) + '...\n');
  
  // Test get posts
  console.log('📋 Getting existing posts...');
  try {
    const postsResponse = await fetch(`${FANVUE_API_URL}/posts`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    
    console.log('   Status:', postsResponse.status);
    
    if (!postsResponse.ok) {
      const error = await postsResponse.text();
      console.log('❌ Posts API failed:', error);
    } else {
      const posts = await postsResponse.json();
      console.log('✅ Posts API works! Found', posts.data?.length || 0, 'posts');
      if (posts.data?.[0]) {
        console.log('   Latest post:', posts.data[0].content?.slice(0, 50) || 'No content');
      }
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  // Test create post with existing image
  console.log('\n📤 Testing post creation...');
  try {
    const response = await fetch(`${FANVUE_API_URL}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Test post from API 🧪 (will delete)',
        mediaUrls: ['https://res.cloudinary.com/dily60mr0/image/upload/v1767306563/elena-fanvue-daily/morning_bed_stretch-1767306562.jpg'],
        audience: 'subscribers',
      }),
    });
    
    console.log('   Status:', response.status);
    
    if (!response.ok) {
      const error = await response.text();
      console.log('❌ Post creation failed:', error);
    } else {
      const result = await response.json();
      console.log('✅ Post created!');
      console.log('   Post ID:', result.data?.uuid || result.uuid || 'Unknown');
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

testFanvue();

