#!/usr/bin/env node
/**
 * Perplexity Search Helper
 * 
 * Uses Perplexity Sonar Pro with Pro Search for deep, citation-rich answers
 * Designed to help debug and solve coding problems
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load from app/.env.local
const ENV_PATH = path.join(__dirname, '../../.env.local');

function loadEnv() {
  if (fs.existsSync(ENV_PATH)) {
    const envContent = fs.readFileSync(ENV_PATH, 'utf-8');
    for (const line of envContent.split('\n')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

/**
 * Search with Perplexity Sonar Pro
 * 
 * @param {string} query - The search query
 * @param {object} options - Search options
 * @returns {Promise<object>} - Search result with content and citations
 */
export async function searchWithPerplexity(query, options = {}) {
  const {
    model = 'sonar-pro', // Most powerful model
    searchMode = 'web',   // Web search (valid: 'web', 'academic', 'sec')
    maxTokens = 4096,
    temperature = 0.2,    // Lower for factual accuracy
  } = options;

  if (!PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY not found in environment (check app/.env.local)');
  }

  const systemPrompt = `You are a technical research assistant helping debug and solve coding problems.
Your responses should be:
- Precise and actionable
- Include code examples when relevant
- Cite sources with URLs
- Focus on recent/current information (2025-2026)
- Provide step-by-step solutions when applicable`;

  const response = await fetch(PERPLEXITY_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      max_tokens: maxTokens,
      temperature,
      search_mode: searchMode,
      return_citations: true,
      return_related_questions: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Perplexity API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  
  return {
    content: data.choices?.[0]?.message?.content || '',
    citations: data.citations || [],
    relatedQuestions: data.related_questions || [],
    model: data.model,
    usage: data.usage,
  };
}

/**
 * Generate a search document from context and problem
 * 
 * @param {string} problemDescription - Description of the problem
 * @param {string} context - Additional context (code, errors, etc.)
 * @returns {Promise<string>} - Path to the generated markdown file
 */
export async function generateSearchDocument(problemDescription, context = '') {
  const query = context 
    ? `${problemDescription}\n\nContext:\n${context}`
    : problemDescription;

  console.log('🔍 Searching with Perplexity Sonar Pro...');
  console.log(`   Query: ${problemDescription.slice(0, 100)}...`);
  
  const startTime = Date.now();
  const result = await searchWithPerplexity(query);
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log(`   ✅ Search completed in ${duration}s`);
  console.log(`   📚 Citations: ${result.citations?.length || 0}`);

  // Generate filename with timestamp and title
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // 2026-01-21
  const timeStr = now.toTimeString().slice(0, 5).replace(':', ''); // 1430
  const titleSlug = generateTitleSlug(problemDescription);
  
  const filename = `${dateStr}-${timeStr}.${titleSlug}.md`;
  const docsDir = path.join(__dirname, '../../../docs/perplexity-searches');
  
  // Ensure directory exists
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  const filepath = path.join(docsDir, filename);
  
  // Build markdown content
  const markdown = buildMarkdownDocument({
    problemDescription,
    context,
    result,
    duration,
    timestamp: now.toISOString(),
  });
  
  fs.writeFileSync(filepath, markdown);
  console.log(`   📄 Saved to: docs/perplexity-searches/${filename}`);
  
  return filepath;
}

/**
 * Generate a URL-friendly slug from the problem description
 */
function generateTitleSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50)
    .replace(/-+$/, '');
}

/**
 * Build the markdown document
 */
function buildMarkdownDocument({ problemDescription, context, result, duration, timestamp }) {
  const citations = result.citations?.length > 0
    ? result.citations.map((url, i) => `${i + 1}. ${url}`).join('\n')
    : 'No citations available';

  const relatedQuestions = result.relatedQuestions?.length > 0
    ? result.relatedQuestions.map(q => `- ${q}`).join('\n')
    : 'None';

  return `# Perplexity Search Results

> Generated: ${timestamp}
> Model: ${result.model || 'sonar-pro'}
> Duration: ${duration}s

---

## Problem

${problemDescription}

${context ? `## Context\n\n\`\`\`\n${context}\n\`\`\`\n` : ''}
---

## Search Results

${result.content}

---

## Citations

${citations}

---

## Related Questions

${relatedQuestions}

---

## Suggested Next Steps

Based on the search results above:

1. Review the most relevant citations for deeper understanding
2. Try the suggested solutions in order of relevance
3. If the problem persists, refine the search with more specific details

---

*Search powered by Perplexity Sonar Pro*
`;
}

// CLI interface
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const query = process.argv[2];
  
  if (!query) {
    console.log('Usage: node perplexity-search.mjs "your search query"');
    process.exit(1);
  }
  
  generateSearchDocument(query)
    .then(filepath => {
      console.log(`\n✅ Search document created: ${filepath}`);
    })
    .catch(error => {
      console.error(`\n❌ Error: ${error.message}`);
      process.exit(1);
    });
}

export default { searchWithPerplexity, generateSearchDocument };
