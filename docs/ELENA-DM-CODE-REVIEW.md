# Elena DM Automation — Code Review & Refactoring Guide

> Code review session — 20 janvier 2026  
> File reviewed: `app/src/lib/elena-dm.ts` (3320 lines)

---

## 📋 Overview

This document provides a comprehensive code review of the Elena DM automation system. It covers what works well, what needs improvement, and a step-by-step refactoring plan for future development.

**Purpose of `elena-dm.ts`:**
- Handles incoming Instagram DMs via ManyChat webhooks
- Analyzes user intent and sentiment
- Generates AI-powered responses as Elena persona
- Manages lead funnel (cold → warm → hot → pitched → closing → followup)
- Tracks conversation history in Supabase
- Enforces anti-spam and anti-loop protections

---

## ✅ What's Good

### 1. Strong Type System

The file has comprehensive TypeScript types that make the code self-documenting:

```typescript
// Well-defined enums/types
type LeadStage = 'cold' | 'warm' | 'hot' | 'pitched' | 'closing' | 'followup' | 'converted' | 'paid';
type MessageIntent = 'greeting' | 'compliment' | 'question' | 'flirt' | 'wants_more' | 'asking_link' | 'sexual' | ...;
type PersonalityMode = 'warm' | 'playful' | 'curious' | 'mysterious' | 'confident' | 'balanced';

// Comprehensive interfaces
interface DMContact { ... }  // 25+ fields for contact state
interface DMMessage { ... }  // Message metadata
interface IntentAnalysis { ... }  // AI analysis result
```

**Why this matters:** TypeScript catches bugs at compile time. If you rename a field or change a type, the compiler tells you everywhere it breaks.

---

### 2. Intent-Driven Architecture

The system uses a priority-based intent detection:

| Priority | Intent Category | Examples |
|----------|----------------|----------|
| 0 | Special Tokens | `[STICKER_REACTION]`, `[STORY_REACTION]` |
| 1 | Funnel Intents | `wants_more`, `asking_link`, `sexual` |
| 2 | Out of Scope | calls, meetings, dates |
| 3 | AI Question | "Are you real?", "Es-tu un robot?" |
| 4 | Mood Intents | `vulnerable`, `cocky`, `provocative`, `curious` |
| 5 | Standard Intents | `greeting`, `compliment`, `flirt`, `question` |

Each intent triggers a specific response strategy and personality mode adaptation.

---

### 3. Response Validation System (lines 862-1130)

Before sending any response, the validator checks:

| Check | What It Does |
|-------|--------------|
| Generic response blocker | Won't send "hey 🖤" alone — needs substance |
| Minimum length | At least 3 words required |
| Forbidden words | Blocks hallucination indicators ("double", "twice", "masterpiece") |
| ALL CAPS detection | No shouting |
| Language mismatch | French user → French response (validated) |
| Stage alignment | COLD stage → no Fanvue mention |
| Excessive punctuation | No "!!!" or "...." |

If validation fails, the system retries up to 3 times before falling back.

---

### 4. Anti-Loop & Anti-Spam Protections

Multiple layers of deduplication in `processDM()`:

```typescript
// CHECK 1: Same message within 30 seconds (webhook retry)
// CHECK 2: Cooldown if we responded within 20 seconds
// CHECK 3: Exit message spam prevention (5 min window)
// CHECK 4: Rapid-fire incoming detection
// CHECK 5: Semantic similarity (70% overlap = skip)
// CHECK 6: Fanvue link limit (max 3 sends ever)
```

**Why this matters:** Without these, Elena would spam users or get stuck in loops.

---

### 5. User Profile Extraction (lines 2188-2435)

Builds a profile from conversation history:

```typescript
interface UserProfile {
  name: string | null;
  location: string | null;
  country: string | null;
  job: string | null;
  age: string | null;
  interests: string[];
  sports: string[];
  relationshipStatus: string | null;
  tonePreference: 'formal' | 'casual' | 'flirty' | null;
  questionsAlreadyAsked: string[];  // Prevents asking same question twice
}
```

Elena remembers what users told her and doesn't repeat questions.

---

### 6. Language Detection

Multi-language support with confidence tracking:

- **Supported:** FR, EN, IT, ES, PT, DE, RU
- **Explicit detection:** "je parle français" → instant 100% confidence
- **Pattern detection:** Accumulates confidence over 3+ messages
- **Stored per contact:** Language persists across sessions

---

## ❌ What Needs Improvement

### 1. File Size (3320 lines)

**Problem:** Everything is in one file:
- Types/interfaces
- Constants
- Response templates
- AI generation
- Validation
- Database CRUD
- Language detection
- Intent analysis
- Main processing

**Impact:**
- Hard to navigate
- AI agents make more mistakes on large files
- Can't work on features in parallel
- Slower IDE performance

**Recommended split:**
```
app/src/lib/elena/
├── types.ts              # ~100 lines
├── constants.ts          # ~100 lines
├── templates.ts          # ~150 lines
├── validator.ts          # ~250 lines
├── database.ts           # ~400 lines
├── language.ts           # ~200 lines
├── intent-analyzer.ts    # ~350 lines
├── response-generator.ts # ~700 lines
├── handler.ts            # ~600 lines
└── index.ts              # Re-exports
```

---

### 2. Magic Numbers

**Problem:** Hardcoded values scattered throughout:

```typescript
// These appear in multiple places:
.gte('created_at', new Date(Date.now() - 30000).toISOString())  // 30 seconds
.gte('created_at', new Date(Date.now() - 20000).toISOString())  // 20 seconds
.gte('created_at', new Date(Date.now() - 300000).toISOString()) // 5 minutes

// Stage limits hardcoded in MESSAGE_CAPS and STAGE_TRANSITIONS
const MESSAGE_CAPS = { cold: 8, warm: 12, hot: 15, ... };
```

**Fix:** Extract to named constants:

```typescript
// constants.ts
export const DUPLICATE_MESSAGE_WINDOW_MS = 30_000;
export const RESPONSE_COOLDOWN_MS = 20_000;
export const EXIT_MESSAGE_SPAM_WINDOW_MS = 300_000;
export const CONTACT_REACTIVATION_DAYS = 7;
```

---

### 3. Massive Functions

**Problem:** Some functions are too long to reason about:

| Function | Lines | Responsibility |
|----------|-------|----------------|
| `generateElenaResponse()` | ~660 | User profile, context building, language detection, API call, validation, retry, fallback |
| `processDM()` | ~530 | Deduplication, limits, analysis, message saving, response generation, anti-loop |
| `ELENA_SYSTEM_PROMPT` | ~255 | Entire personality (string literal) |

**Impact:**
- Hard to test individual pieces
- Hard to understand flow
- High bug risk when modifying

---

### 4. Embedded System Prompt

**Problem:** 255-line prompt hardcoded as a string literal in the code.

```typescript
const ELENA_SYSTEM_PROMPT = `You are Elena Visconti, 24, model in Paris...
// 255 lines of personality, rules, examples
`;
```

**Impact:**
- Can't A/B test prompts easily
- Git diffs mix prompt changes with logic changes
- Non-developers can't safely edit personality

**Fix:** Move to separate file:
```
app/src/lib/elena/prompts/
├── system-prompt.md      # Main personality
├── intent-strategies.ts  # Per-intent instructions
└── closing-techniques.md # Sales psychology
```

---

### 5. No Dependency Injection

**Problem:** Direct calls to Supabase and Anthropic:

```typescript
// Tightly coupled to specific implementations
const { data } = await supabase.from('elena_dm_contacts')...
const response = await anthropic.messages.create(...);
```

**Impact:**
- Can't unit test without real database
- Can't mock AI responses for testing
- Hard to switch providers

---

### 6. Duplicate Patterns

**Problem:** Language detection patterns appear in multiple places:
- `LANGUAGE_PATTERNS` (line 1544)
- `EXPLICIT_LANGUAGE_STATEMENTS` (line 1572)
- `detectCurrentLanguage()` inline function (line 2120)

Same regex patterns are duplicated, leading to potential inconsistencies.

---

### 7. Inconsistent Error Handling

**Problem:** Some errors are logged and swallowed:

```typescript
if (error) {
  console.error('Error fetching history:', error);
  return [];  // Silent failure — caller doesn't know it failed
}
```

**Fix:** Either throw (let caller handle) or return explicit error types.

---

## 🔧 Refactoring Plan

### Phase 1: Low Risk, High Value (~1-2 hours)

1. **Extract `types.ts`**
   - Move all `type`, `interface`, and `export type` declarations
   - Zero logic change, just organization
   - TypeScript will validate nothing breaks

2. **Extract `constants.ts`**
   - Move `MESSAGE_CAPS`, `STAGE_TRANSITIONS`, `CLOSING_STARTS_AT`
   - Replace magic numbers with named constants
   - Add `LINKTREE_LINK` and timeout values

3. **Externalize system prompt**
   - Move `ELENA_SYSTEM_PROMPT` to `prompts/system-prompt.ts`
   - Export as string constant
   - Enables easier editing and A/B testing

### Phase 2: Medium Effort (~2-3 hours)

4. **Extract `database.ts`**
   - Move all Supabase functions: `getOrCreateContact`, `saveMessage`, `getConversationHistory`, etc.
   - ~400 lines of clearly bounded code

5. **Extract `validator.ts`**
   - Move `validateResponse()`, `FORBIDDEN_WORDS`, `FORBIDDEN_PATTERNS`
   - ~250 lines

6. **Extract `intent-analyzer.ts`**
   - Move `analyzeMessageIntent()` and pattern constants
   - ~350 lines

### Phase 3: For Scale (optional, ~3-4 hours)

7. **Add dependency injection**
   - Create interfaces for database and AI client
   - Inject via constructor or factory function
   - Enables unit testing with mocks

8. **Add unit tests**
   - Test `validateResponse()` with various inputs
   - Test `analyzeMessageIntent()` pattern matching
   - Test stage progression logic

9. **Add caching**
   - Cache conversation history (invalidate on new message)
   - Cache user profile per contact

---

## 🛡️ Safe Refactoring Checklist

Before any refactor:

- [ ] Create a new branch: `git checkout -b refactor/elena-modules`
- [ ] Ensure all existing tests pass (if any)
- [ ] Make ONE small change at a time
- [ ] Run `npm run build` after each change (TypeScript catches breaks)
- [ ] Test manually with a real DM
- [ ] Commit each successful step

If anything breaks:

```bash
git checkout main  # Back to working code instantly
```

---

## 📊 Impact on AI Agent Development

Working with 3320-line file vs modular files:

| Aspect | Single File | Modular Files |
|--------|-------------|---------------|
| Context usage | ~15-20k tokens (30% of window) | Only load what's needed |
| Edit precision | Risk of wrong placement | Clean, isolated edits |
| Agent mistakes | Higher (attention drift on long input) | Lower |
| Feature addition | Touch 4+ locations, easy to miss one | Each file is self-contained |
| Debug time | Scroll 3320 lines | Look at 200-400 lines |

**Recommendation:** If you're using AI agents to code, modular files significantly reduce errors and speed up iterations.

---

## 📁 Recommended File Structure

```
app/src/lib/elena/
├── index.ts                 # Main export: processDM, getDMFunnelStats, etc.
├── types.ts                 # All types and interfaces
├── constants.ts             # MESSAGE_CAPS, timeouts, limits
├── templates.ts             # RESPONSE_TEMPLATES
├── prompts/
│   ├── system-prompt.ts     # ELENA_SYSTEM_PROMPT
│   └── intent-strategies.ts # INTENT_STRATEGIES, PERSONALITY_MODES
├── database.ts              # All Supabase operations
├── validator.ts             # validateResponse, forbidden words
├── language.ts              # Language detection and patterns
├── intent-analyzer.ts       # analyzeMessageIntent
├── response-generator.ts    # generateElenaResponse
├── user-profile.ts          # Profile extraction logic
└── handler.ts               # processDM main function
```

---

## 🔗 Related Documentation

- [03-PERSONNAGE-ELENA.md](./03-PERSONNAGE-ELENA.md) — Elena's personality and backstory
- [ELENA-PROMPT-AUDIT.md](./ELENA-PROMPT-AUDIT.md) — Prompt optimization history
- [characters/elena/PERSONNAGE.md](./characters/elena/PERSONNAGE.md) — Detailed character sheet

---

## 📝 Version History

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-20 | AI Review | Initial code review and refactoring guide |
