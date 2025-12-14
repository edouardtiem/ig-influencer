#!/usr/bin/env node
/**
 * Use Perplexity to find engaging caption for mirror selfie carousel
 * + Research engagement techniques
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

async function callPerplexity(systemPrompt, userPrompt, maxTokens = 2000) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    console.error('❌ PERPLEXITY_API_KEY not found');
    process.exit(1);
  }
  
  const response = await fetch(PERPLEXITY_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Perplexity API error:', response.status, errorText);
    process.exit(1);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function main() {
  console.log('🔍 Researching engagement techniques for mirror selfie carousels...\n');
  
  // Step 1: Research engagement techniques
  console.log('📚 STEP 1: Researching best practices...\n');
  
  const researchPrompt = `What are the most effective Instagram caption techniques for mirror selfie carousels in 2024-2025?

Focus on:
1. Hook techniques that stop the scroll
2. Caption structures that drive comments
3. CTAs that actually work for fashion/lifestyle posts
4. Optimal caption length for carousels
5. Engagement patterns for "cozy outfit" type posts
6. French influencer caption style trends

Give me specific techniques with examples. Be concrete and actionable.`;

  const research = await callPerplexity(
    'You are an Instagram growth expert specializing in fashion and lifestyle influencers. Provide data-driven insights.',
    researchPrompt
  );
  
  console.log('━'.repeat(60));
  console.log('📊 ENGAGEMENT TECHNIQUES RESEARCH:\n');
  console.log(research);
  console.log('\n' + '━'.repeat(60));
  
  // Step 2: Generate captions based on research
  console.log('\n✍️  STEP 2: Generating captions for mirror selfie carousel...\n');
  
  const captionPrompt = `Generate 5 Instagram captions for this specific post:

POST DESCRIPTION:
- Carousel of 5 mirror selfies
- Setting: Cozy apartment, large round mirror, wooden floor
- Outfit: Oversized grey sweater + black pleated mini skirt
- Vibe: Effortless, cozy, confident, French girl aesthetic
- Influencer: Mila, 22yo French fitness/lifestyle influencer

REQUIREMENTS:
- Mix French and English naturally (like real French Gen-Z)
- Maximum 1-2 emojis
- Include a hook or question to drive comments
- Use techniques that maximize engagement based on current best practices
- Keep it authentic, not salesy
- Caption should feel like she's talking to her close friends

For each caption provide:
1. The caption itself
2. Why it works (which technique)
3. Expected engagement type (comments, saves, shares)
4. Suggested hashtags (8-12)

Format as clear numbered list.`;

  const captions = await callPerplexity(
    `You are Mila, a 22-year-old French fitness/lifestyle influencer based in Paris. You write in your authentic voice - confident, warm, playful. You mix French and English naturally like real French Gen-Z influencers do.`,
    captionPrompt
  );
  
  console.log('━'.repeat(60));
  console.log('📝 GENERATED CAPTIONS:\n');
  console.log(captions);
  console.log('\n' + '━'.repeat(60));
  
  // Step 3: Get trending hashtags
  console.log('\n#️⃣  STEP 3: Fetching trending hashtags...\n');
  
  const hashtagPrompt = `What are the most effective Instagram hashtags for a mirror selfie carousel post in December 2024?

Context: French lifestyle influencer, cozy outfit vibes, apartment mirror selfie

Provide:
1. Top 10 trending hashtags for this type of content right now
2. 5 niche hashtags that increase reach
3. 5 evergreen hashtags that always perform well
4. Hashtags to AVOID (overused, shadowbanned, etc.)

Be specific to December 2024 trends.`;

  const hashtags = await callPerplexity(
    'You are a social media hashtag strategist with access to current Instagram data.',
    hashtagPrompt
  );
  
  console.log('━'.repeat(60));
  console.log('#️⃣  HASHTAG RECOMMENDATIONS:\n');
  console.log(hashtags);
  console.log('\n' + '━'.repeat(60));
  
  console.log('\n🎉 Research complete! Use the captions and hashtags above.');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

