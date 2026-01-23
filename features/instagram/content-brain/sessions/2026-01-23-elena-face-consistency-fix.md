# Elena Face Consistency Fix — Session 2026-01-23

## Summary

Fixed critical bug where Elena's face didn't match the reference image in generated posts. Root cause: MIME type mismatch + prompt overload.

---

## Problem

Post de 21h showed a completely different person than Elena (blonde generic woman instead of Elena's bronde hair and specific features).

## Investigation

1. Checked `scheduled-post.mjs` — found Elena's reference configuration
2. Found reference image URL: `replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png`
3. Verified reference image shows correct Elena
4. Checked Replicate output — completely different face

## Root Causes

### Bug #1: MIME Type Mismatch

```javascript
// BEFORE (wrong)
async function urlToBase64(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return `data:image/jpeg;base64,${...}`; // Always JPEG!
}
```

The reference image is PNG but was declared as JPEG. This can corrupt image interpretation.

### Bug #2: Prompt Overload

The prompt contained 50+ lines of detailed face descriptions:
- "Same soft round pleasant face shape (NOT angular)"
- "Same honey brown warm almond-shaped eyes"
- etc.

According to Nano Banana Pro documentation: **"trusts images more than words"**

The text descriptions were overriding the image reference, making the model generate a "generic interpretation" instead of copying the reference.

---

## Fix Applied

### MIME Type Detection

```javascript
// AFTER (correct)
async function urlToBase64(url) {
  const response = await fetch(url);
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const mimeType = contentType.includes('png') ? 'image/png' 
    : contentType.includes('webp') ? 'image/webp' 
    : 'image/jpeg';
  const buffer = await response.arrayBuffer();
  return `data:${mimeType};base64,${...}`;
}
```

### Simplified Reference Instruction

**Before** (50+ lines):
```
**IMAGE 1 (FACE REFERENCE)**: This is Elena's face. Copy this EXACTLY:
- Same soft round pleasant face shape (NOT angular, NOT sharp jawline)
- Same smooth feminine jawline and rounded chin
- Same honey brown warm almond-shaped eyes
... (50 more lines)
```

**After** (simple):
```
IMPORTANT: Generate the EXACT SAME PERSON as shown in IMAGE 1.

The woman in IMAGE 1 is Elena. Every generated image MUST show this same person.

DO NOT reinterpret or reimagine her face. Copy it exactly from IMAGE 1.
```

---

## Test Result

Generated test image with fixed code — Elena's face now matches the reference.

---

## Files Changed

- `app/scripts/scheduled-post.mjs`:
  - `urlToBase64()` — auto-detect MIME type
  - Elena `reference_instruction` — simplified
  - Elena `face_description` — simplified
  - Elena `final_check` — simplified
  - Elena `body_description` — removed explicit terms

---

## Key Learning

Nano Banana Pro best practice: **Don't overprompt**. The model trusts images more than text. Instead of describing every facial feature in text, just reference "the person in IMAGE 1" and let the model copy it.
