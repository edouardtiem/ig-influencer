#!/usr/bin/env node
/**
 * Gemini 3 Pro Image Generator
 * 
 * Uses Gemini 3 Pro Image with Elena reference images for consistent character
 * Outputs 2K resolution images
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Elena reference images directory
const ELENA_REF_DIR = path.join(__dirname, '../../../lora-dataset-elena/10_elena');

// Load Elena reference images (cached)
let cachedRefImages = null;

function loadElenaReferences() {
  if (cachedRefImages) return cachedRefImages;
  
  const refFiles = ['elena_01.jpg', 'elena_02.jpg', 'elena_03.jpg', 'elena_04.jpg'];
  cachedRefImages = refFiles.map(name => {
    const imgPath = path.join(ELENA_REF_DIR, name);
    if (!fs.existsSync(imgPath)) {
      console.warn(`⚠️ Reference image not found: ${name}`);
      return null;
    }
    const data = fs.readFileSync(imgPath);
    return {
      inlineData: {
        mimeType: 'image/jpeg',
        data: data.toString('base64')
      }
    };
  }).filter(Boolean);
  
  return cachedRefImages;
}

/**
 * Generate image with Gemini 3 Pro Image + Elena references
 * 
 * @param {string} prompt - The image generation prompt
 * @param {object} options - Generation options
 * @returns {Promise<Buffer>} - Image buffer
 */
export async function generateWithGemini3Pro(prompt, options = {}) {
  const {
    aspectRatio = '9:16',
    imageSize = '2K',
    character = 'elena',
  } = options;

  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not found in environment');
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-3-pro-image-preview',
  });

  // Load reference images
  const refImages = character === 'elena' ? loadElenaReferences() : [];
  
  // Build prompt with reference instruction
  const fullPrompt = refImages.length > 0 
    ? `Using these reference images of Elena, generate a NEW high-quality image of the SAME person (Elena) in this scenario:

${prompt}

CRITICAL REQUIREMENTS:
- The generated image MUST show the EXACT same person as in the reference images
- Same face structure, same features, same hair color and style
- Professional photography quality, sharp focus, high detail
- Natural lighting, iPhone photo style`
    : prompt;

  // Generate
  const result = await model.generateContent({
    contents: [{ 
      role: 'user', 
      parts: [
        ...refImages,
        { text: fullPrompt }
      ] 
    }],
    generationConfig: {
      responseModalities: ['image', 'text'],
      imageConfig: {
        imageSize,
        aspectRatio
      }
    }
  });

  // Extract image
  for (const part of result.response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return Buffer.from(part.inlineData.data, 'base64');
    }
  }

  throw new Error('No image generated');
}

/**
 * Generate multiple carousel images
 * 
 * @param {object} postParams - Post parameters from Content Brain
 * @param {number} count - Number of images to generate
 * @returns {Promise<string[]>} - Array of Cloudinary URLs
 */
export async function generateCarouselImages(postParams, count = 3) {
  const { 
    location_name, 
    outfit, 
    action, 
    prompt_hints, 
    mood,
    character = 'elena'
  } = postParams;

  console.log(`🎨 Generating ${count} images with Gemini 3 Pro Image (2K)...`);
  console.log(`   📍 Location: ${location_name}`);
  console.log(`   👗 Outfit: ${outfit}`);
  console.log(`   🎭 Mood: ${mood}`);

  const variations = [
    'medium shot, looking at camera with warm smile',
    'full body shot, elegant pose, looking slightly away',
    'close-up portrait, soft expression, beautiful lighting'
  ];

  const images = [];
  
  for (let i = 0; i < count; i++) {
    const variation = variations[i] || variations[0];
    
    const prompt = `Elena, ${outfit}, at ${location_name}.
${action}. ${variation}.
Mood: ${mood}, sophisticated, confident.
${prompt_hints || ''}
Style: Professional Instagram photo, natural lighting, sharp focus.`;

    console.log(`\n   🔄 Generating image ${i + 1}/${count}...`);
    
    try {
      const buffer = await generateWithGemini3Pro(prompt, {
        aspectRatio: '9:16',
        imageSize: '2K',
        character
      });
      
      // Save locally for now (can integrate with Cloudinary later)
      const filename = `carousel_${i + 1}_${Date.now()}.png`;
      const filepath = path.join(__dirname, '../../', filename);
      fs.writeFileSync(filepath, buffer);
      
      console.log(`   ✅ Image ${i + 1} saved: ${filename} (${(buffer.length/1024).toFixed(0)} KB)`);
      images.push(filepath);
      
      // Small delay between generations
      if (i < count - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (error) {
      console.error(`   ❌ Image ${i + 1} failed: ${error.message}`);
      throw error;
    }
  }

  return images;
}

export default { generateWithGemini3Pro, generateCarouselImages };
