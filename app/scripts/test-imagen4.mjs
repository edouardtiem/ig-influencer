#!/usr/bin/env node
/**
 * Test Google Imagen 4 via Gemini API
 * 
 * Alternative to Replicate's Nano Banana Pro
 * Requires: GEMINI_API_KEY with billing enabled (~$0.03/image)
 * 
 * Usage: node scripts/test-imagen4.mjs [prompt]
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env.local');
  console.error('   Get one at: https://aistudio.google.com/apikey');
  process.exit(1);
}

console.log('🔑 GEMINI_API_KEY found');
console.log(`   Key preview: ${GEMINI_API_KEY.substring(0, 15)}...`);

/**
 * Generate image with Imagen 4 via REST API
 */
async function generateWithImagen4(prompt) {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('   🎨 Google Imagen 4 (imagen-4.0-generate-001)');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📝 Prompt:', prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt);
  console.log('\n🔄 Generating image...\n');

  // Imagen 4 uses a different endpoint
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: '9:16', // Portrait for Instagram
        }
      })
    }
  );

  const data = await response.json();

  if (data.error) {
    throw new Error(JSON.stringify(data.error, null, 2));
  }

  console.log('✅ Response received!');

  if (data.predictions && data.predictions.length > 0) {
    const imageData = data.predictions[0].bytesBase64Encoded;
    const outputPath = 'test_imagen4_output.png';
    fs.writeFileSync(outputPath, Buffer.from(imageData, 'base64'));
    console.log(`📷 Image saved to: ${outputPath}`);
    return outputPath;
  }

  return data;
}

/**
 * Alternative: Gemini 2.0 Flash with native image generation
 */
async function generateWithGeminiFlash(prompt) {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('   🎨 Gemini 2.0 Flash (Native Image Gen)');
  console.log('═══════════════════════════════════════════════════════════\n');

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  
  // gemini-2.0-flash-exp supports image generation
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
  });

  console.log('📝 Prompt:', prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt);
  console.log('\n🔄 Generating with Gemini Flash...\n');

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: `Generate an image: ${prompt}` }] }],
    generationConfig: {
      responseModalities: ['image', 'text'],
    }
  });

  const response = result.response;
  console.log('✅ Response received!');

  // Check for image in response
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const outputPath = 'test_gemini_flash_output.png';
      fs.writeFileSync(outputPath, Buffer.from(part.inlineData.data, 'base64'));
      console.log(`📷 Image saved to: ${outputPath}`);
      return outputPath;
    }
  }

  console.log('   Text response:', response.text?.()?.substring(0, 200));
  return response;
}

/**
 * List available image models
 */
async function listImageModels() {
  console.log('\n📋 Checking available image models...\n');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
  );
  const data = await response.json();

  if (data.error) {
    console.log('   ⚠️ Error:', data.error.message);
    return;
  }

  const imageModels = data.models?.filter(m => 
    m.name.includes('imagen') || 
    m.supportedGenerationMethods?.includes('generateImages')
  ) || [];

  if (imageModels.length > 0) {
    console.log('Available image models:');
    imageModels.forEach(m => console.log(`   🎨 ${m.name}`));
  } else {
    console.log('   No dedicated image models found (may need billing)');
  }

  // Also show flash models that support image gen
  const flashModels = data.models?.filter(m => m.name.includes('flash')) || [];
  if (flashModels.length > 0) {
    console.log('\nFlash models (may support image gen):');
    flashModels.slice(0, 5).forEach(m => console.log(`   ⚡ ${m.name}`));
  }
}

// Main
async function main() {
  const customPrompt = process.argv[2];
  
  const prompt = customPrompt || `Elegant young woman with long dark hair in a luxurious Parisian loft, 
wearing a cream silk slip dress, standing by tall French windows with morning light, 
warm confident smile, sophisticated atmosphere, iPhone photo style, natural lighting`;

  await listImageModels();

  try {
    await generateWithImagen4(prompt);
  } catch (error) {
    console.error('❌ Imagen 4 error:', error.message);
    console.log('\n💡 Trying Gemini Flash alternative...');
    
    try {
      await generateWithGeminiFlash(prompt);
    } catch (flashError) {
      console.error('❌ Gemini Flash error:', flashError.message);
    }
  }
}

main().catch(console.error);
