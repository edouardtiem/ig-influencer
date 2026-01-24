/**
 * Perplexity API Search
 * Usage: node app/scripts/perplexity-search.mjs "your question"
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

async function askPerplexity(question) {
  if (!PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY not found in environment');
  }

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant specialized in AI image generation models, particularly Stable Diffusion XL (SDXL) models. Provide detailed, accurate information with sources when possible.'
        },
        {
          role: 'user',
          content: question
        }
      ],
      temperature: 0.2,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Perplexity API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function main() {
  const question = process.argv[2] || `
I'm looking for information about:

1. Is there a model called "BigLoveXL" for Stable Diffusion XL on CivitAI? What is its exact name and ID?

2. What are the best SDXL checkpoint models for NSFW/adult realistic photo generation in January 2026? 
   - Compare to BigLust v16 which I currently use
   - Looking for models with better face quality and skin texture
   - Must be compatible with SDXL LoRAs

3. Any recommended alternatives to BigLust for photorealistic adult content generation?

Please provide CivitAI model names and IDs if available.
`;

  console.log('🔍 Asking Perplexity...\n');
  console.log('Question:', question.trim());
  console.log('\n' + '='.repeat(60) + '\n');

  try {
    const answer = await askPerplexity(question);
    console.log('📝 Answer:\n');
    console.log(answer);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
