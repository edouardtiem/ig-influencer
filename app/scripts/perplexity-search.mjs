#!/usr/bin/env node
/**
 * Recherche Perplexity sur un sujet donné
 * Usage: node scripts/perplexity-search.mjs "votre sujet de recherche"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');

// Charger les variables d'environnement depuis .env.local
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

async function searchPerplexity(query, model = 'sonar-pro') {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    console.error('❌ PERPLEXITY_API_KEY not found in .env.local');
    process.exit(1);
  }
  
  console.log(`🔍 Recherche Perplexity: "${query}"\n`);
  
  const response = await fetch(PERPLEXITY_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { 
          role: 'system', 
          content: 'You are a helpful research assistant. Provide comprehensive, accurate, and well-structured answers based on the latest information available.' 
        },
        { 
          role: 'user', 
          content: query 
        },
      ],
      max_tokens: 2000,
      temperature: 0.2,
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
  const query = process.argv[2];
  
  if (!query) {
    console.error('❌ Usage: node scripts/perplexity-search.mjs "votre sujet de recherche"');
    console.error('   Exemple: node scripts/perplexity-search.mjs "tendances Instagram France janvier 2025"');
    process.exit(1);
  }

  try {
    const result = await searchPerplexity(query);
    console.log('📝 Résultat:\n');
    console.log(result);
    console.log('\n✅ Recherche terminée');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();

