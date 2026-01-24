# Perplexity Search - AI-Powered Research Assistant

When you're stuck on a problem, this command searches Perplexity with an optimized query and saves the results.

## Your Mission

1. **Analyze the current conversation** to identify the problem or blocker
2. **Craft an optimal search query** for Perplexity
3. **Execute the search** using the Perplexity API
4. **Save results** to `docs/perplexity-searches/`

## Workflow

### Phase 1: Problem Identification

Review the conversation and identify:
- What is the specific problem/error/blocker?
- What has already been tried?
- What technologies/libraries are involved?
- What would solve this problem?

Output your analysis:
```
🔍 PROBLEM ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 Issue: [concise problem statement]
🛠️ Tech Stack: [relevant technologies]
❌ Already Tried: [what didn't work]
🎯 Looking For: [what we need to find]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Phase 2: Query Optimization

Craft an effective Perplexity query following these principles:

**Good queries are:**
- Specific and technical (include versions, error messages)
- Focused on solutions (not just explanations)
- Time-bounded when relevant ("2025-2026", "latest")
- Include relevant context (framework, platform)

**Example transformations:**
- ❌ "react error" → ✅ "React 19 hydration mismatch error with Next.js 15 App Router - solution"
- ❌ "api not working" → ✅ "Perplexity API 429 rate limit error - how to implement exponential backoff"
- ❌ "deployment issue" → ✅ "Vercel deployment failing with 'FUNCTION_INVOCATION_TIMEOUT' for Next.js API routes 2026"

### Phase 3: Execute Search

Run the Perplexity search using the helper script:

```bash
cd app && node scripts/lib/perplexity-search.mjs "YOUR_OPTIMIZED_QUERY"
```

Or programmatically:

```javascript
import { generateSearchDocument } from './scripts/lib/perplexity-search.mjs';

await generateSearchDocument(
  "Your problem description",
  "Optional context: error messages, code snippets, etc."
);
```

### Phase 4: Present Results

After the search completes:

1. **Read the generated file** from `docs/perplexity-searches/`
2. **Summarize key findings** for the user
3. **Suggest actionable next steps** based on the results

Output format:
```
✅ PERPLEXITY SEARCH COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 Saved: docs/perplexity-searches/[filename].md

🔑 KEY FINDINGS:
1. [Most relevant finding]
2. [Second finding]
3. [Third finding]

📚 TOP CITATIONS:
- [url1] - [what it covers]
- [url2] - [what it covers]

🎯 RECOMMENDED NEXT STEPS:
1. [First action to try]
2. [Second action if first fails]
3. [Alternative approach]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Important Notes

- The API key is in `app/.env.local` as `PERPLEXITY_API_KEY`
- Uses `sonar-pro` model with Pro Search for best results
- Results are saved in `docs/perplexity-searches/` with format: `YYYY-MM-DD-HHMM.title-slug.md`
- Each search costs ~$0.01-0.05 depending on complexity

## When to Use

Use this command when:
- You've tried multiple solutions that didn't work
- You need current/recent information (API changes, new features)
- Error messages are unclear or undocumented
- You need to understand best practices or patterns

**Start by analyzing the conversation and identifying the problem.**
