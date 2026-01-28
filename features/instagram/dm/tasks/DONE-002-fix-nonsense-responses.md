# TASK-002: Fix Nonsense Responses & API Costs

**Status**: ✅ Done
**Created**: 2026-01-28
**Completed**: 2026-01-28
**Feature**: [Instagram DM](../README.md)

---

## Goal

Fix the Instagram DM automation that sends context-blind responses (e.g., user says "je t'aime" and Elena asks "tu fais quoi dans la vie?"). Also fix sexual content detection and reduce API costs.

---

## Acceptance Criteria

- [x] Sexual content triggers Fanvue redirect (test: "C'est ma bite" → redirect)
- [x] Context-aware fallbacks (goodbye → goodbye response, love → love response)
- [x] System prompt simplified (< 500 tokens core prompt)
- [x] No linter errors introduced
- [x] Audit script shows improvement (fewer repeated generic messages)

---

## Approach

1. **Fix sexual detection** (Line 2268) — Remove `hasEnoughMessages` requirement
2. **Add missing sexual keywords** (Lines 1970-1983) — French slang
3. **Add context-aware fallback selector** (After line 366) — Pattern matching
4. **Update fallback trigger** (Lines 2838-2852) — Use context-aware first
5. **Simplify ELENA_SYSTEM_PROMPT** (Lines 549-810) — Condense to essentials

---

## Files Involved

- `app/src/lib/elena-dm.ts` — All changes in this file

---

## Constraints

- Must not break existing functionality
- Keep Haiku 4.5 model (don't switch models)
- Maintain multilingual support

---

## Progress Log

### 2026-01-28
- Task created based on audit findings
- Root causes identified: fallback pool is context-blind, sexual detection blocked by message count

### 2026-01-28 - Ralph Execution
- **Iteration 1**: Fixed sexual detection - removed `hasEnoughMessages` requirement (line 2268)
- **Iteration 2**: Added `selectContextualFallback()` function with goodbye/love/thanks/emoji patterns
- **Iteration 3**: Condensed ELENA_SYSTEM_PROMPT from ~260 lines to ~30 lines (~400 tokens)
- **Iteration 4**: Verified no linter errors (only pre-existing warnings)
- **Iteration 5**: Ran audit - no more repeated generic messages

---

## Outcome

All acceptance criteria met:
1. Sexual content now always triggers Fanvue redirect (no message count requirement)
2. Added 30+ French sexual keywords and regex patterns for context detection
3. New `selectContextualFallback()` handles goodbye, love, thanks, emoji messages
4. System prompt reduced from ~800 tokens to ~400 tokens
5. Audit shows improvement: no repeated generic messages in recent output

---

## Ralph Sessions

### 2026-01-28 — COMPLETED
**Iterations**: 5
**Summary**: Fixed nonsense responses by adding context-aware fallbacks and simplified system prompt. Sexual content detection now works regardless of message count.

**Problems Encountered**:
- None (straightforward implementation)

**Decisions Made**:
- Keep detailed stage instructions in contextPrompt (dynamic) rather than system prompt (static)
- Use simple pattern matching for fallback selection (fast, no AI call needed)

**Files Modified**:
- `app/src/lib/elena-dm.ts` — Sexual detection, fallback selector, system prompt
