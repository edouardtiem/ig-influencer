#!/usr/bin/env node
/**
 * Test Together AI MAX limit - full nude
 */

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY || 'tgp_v1_78d8JAHhygnPGlayhbNKX86PZQYedEtWDwZH0uO1lEs';
const TOGETHER_API_URL = 'https://api.together.xyz/v1/images/generations';

const MAX_PROMPT = `photo of a 24 year old Italian woman with long bronde wavy hair, 
honey brown eyes, voluptuous figure, large natural breasts, 
fully nude, naked body, exposed breasts and nipples visible, 
lying sensually on bed, seductive expression, 
soft bedroom lighting, silk sheets, 
artistic nude photography, erotic, sensual, 
8K resolution, professional boudoir photography`;

async function test() {
  console.log('🔥🔥🔥 Testing MAX prompt (full nude)...\n');
  console.log('Prompt:', MAX_PROMPT.slice(0, 100) + '...\n');
  
  const response = await fetch(TOGETHER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOGETHER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'black-forest-labs/FLUX.1-dev',
      prompt: MAX_PROMPT,
      width: 1024,
      height: 1280,
      steps: 28,
      n: 1,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.log('❌ BLOCKED:', error);
    return;
  }
  
  const data = await response.json();
  console.log('✅ PASSED!');
  console.log('🖼️  URL:', data.data[0].url);
}

test();

