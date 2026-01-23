# Decisions — Content Brain

Chronological log of decisions made and why.

---

## 2026-01-23: Fix Elena Face Consistency — Trust Images, Not Text

**Context**: Post de 21h showed a completely different person than Elena. Investigation revealed Nano Banana Pro was ignoring the reference image.

**Root causes found**:
1. **MIME type bug**: Reference PNG was declared as `image/jpeg` in base64 → possible corruption
2. **Prompt overload**: 50+ lines of text descriptions overrode the image reference

**Options considered**:
1. Keep detailed descriptions → Model ignores image
2. Simplify to "copy IMAGE 1" → Model trusts image

**Decision**: 
- Auto-detect MIME type from response headers
- Simplify reference instruction to "Generate the EXACT SAME PERSON as IMAGE 1"
- Remove detailed face descriptions (oval face, honey eyes, etc.)

**Reason**:
- Nano Banana Pro documentation says "trusts images more than words"
- Text descriptions create a "generic interpretation" instead of copying the reference
- Correct MIME type ensures image is properly parsed

**Changes**:
- `scheduled-post.mjs`: `urlToBase64()` now detects content-type
- `scheduled-post.mjs`: Elena `reference_instruction` simplified
- `scheduled-post.mjs`: Elena `face_description` and `final_check` simplified

**Result**: Test generation confirmed - Elena face now matches reference image

---

## 2026-01-23: Elena Art Direction — Direct Flash + Editorial Mess

**Context**: Elena lacked a distinctive, cohesive visual identity. Needed a DA that differentiates from "soft influencer" content AND bridges IG (fashion) to Fanvue (boudoir).

**Options tested**:
1. Polaroid held → Too "cute/lifestyle", rejected
2. Magazine Tear → Good but not distinctive enough
3. Sin City (B&W + color pop) → Strong but limiting
4. Golden Shadow (warm silhouette) → Good but common
5. Intimate Cinema (letterbox) → Interesting but format-dependent
6. **Direct Flash + Editorial Mess** → SELECTED

**Decision**: 
- **80%** of posts: Direct Flash lighting + Editorial Mess setting (indoor/night)
- **20%** of posts: Editorial Mess only (outdoor/day where flash doesn't work)

**Reason**:
- Helmut Newton aesthetic is under-represented on Instagram
- Creates powerful, dominant feminine energy (not "cute" or "friendly")
- Same lighting style works for both fashion (IG) and boudoir (Fanvue)
- High engagement potential: edgy content gets more saves/comments
- Estimated 2-3% ER vs 1.5% fashion average

**Implementation**:
- Add Direct Flash lighting instructions to prompts
- Detect location category (indoor/night vs outdoor/day)
- Apply 80/20 rule based on location
- Always: powerful pose, serious expression, black outfits, gold jewelry

**Result**: DA documented in `/docs/art-direction/ELENA-DA-DIRECT-FLASH.md`

---

## 2026-01-20: Freedom Mode — Remove all hardcoded lists

**Context**: ~665 lines of hardcoded locations, outfits, poses made Claude "fill in boxes" instead of create

**Options considered**:
1. Keep lists, make them longer → More maintenance
2. Keep lists, make them dynamic → Complex
3. Remove everything, give Claude freedom → Simple, creative

**Decision**: Remove all hardcoded lists, give Claude full creative freedom

**Reason**: 
- Claude with Extended Thinking can reason about creative decisions
- Blocklist is the only necessary constraint
- Maintenance reduced from "edit code" to "edit blocklist"

**Result**: 
- Removed ~665 lines of code
- Claude invents locations like "Café Le Marais" or "Loft golden hour"
- More creative, contextual content

---

## 2026-01-20: Centralized blocklist (`nano-banana-blocklist.mjs`)

**Context**: Prompt sanitization was scattered across files

**Options considered**:
1. Keep inline sanitization → Hard to maintain
2. Central blocklist file → Single source of truth

**Decision**: Create `nano-banana-blocklist.mjs` with all blocked terms and functions

**Reason**:
- Single place to add new blocked terms
- Reusable functions: `sanitizePrompt()`, `checkForBlockedTerms()`
- Can be imported by any script

**Result**: Clean separation, easy to update

---

## 2026-01-15: Remove analytics from trending layer

**Context**: Content was stuck in Bali/Mykonos loop

**Problem**:
```
Posts récents = Bali
    ↓
extractTopPerformers() → "Bali performe bien"
    ↓
fetchTrendingSafe() → "contenu similaire à Bali"
    ↓
Perplexity → suggère "Tropical Villa"
    ↓
Nouveau post = encore Bali
```

**Options considered**:
1. Keep analytics, add diversity rules → Complex
2. Remove analytics from trending → Clean break

**Decision**: Remove analytics from trending layer entirely

**Reason**:
- Trending should be about current trends, not past performance
- Analytics still used for timing and format decisions
- Perplexity decides 100% based on real trends

**Result**: No more Bali loop, more diverse content

---

## 2026-01-15: Extend avoid list from 3 to 7 days

**Context**: Same locations were repeating too often

**Options considered**:
1. 3 days (current) → Too short, repetition
2. 7 days → Better variety
3. 14 days → Might be too restrictive

**Decision**: 7-day avoid list

**Reason**: 
- One week is a natural content cycle
- Enough variety without being too restrictive
- Users won't see same location twice in a week

**Result**: Better content variety

---

## 2026-01-15: Force Paris content if 3+ travel posts

**Context**: Even with avoid list, too many tropical/travel posts in a row

**Options considered**:
1. Random selection → Unpredictable
2. Hard rule: force Paris after 3 travel posts → Predictable variety

**Decision**: Add `force_paris_content` rule

**Reason**:
- Elena is a Parisian, her home content should be prominent
- Travel fatigue is real for followers
- Parisian content performs well (lifestyle niche)

**Result**: Better balance between travel and home content

---

## 2026-01-15: "Timeless, classic" trending prompt

**Context**: Trending layer was suggesting overly trendy/flash content

**Options considered**:
1. "Viral content" prompt → Too trendy, ages badly
2. "Timeless, classic" prompt → Evergreen appeal

**Decision**: Change Perplexity prompt to ask for timeless, classic content

**Reason**:
- Trendy content has short shelf life
- Classic content has evergreen appeal
- Matches Elena's sophisticated persona

**Result**: More elegant, timeless content suggestions

---

## 2026-01-09: Add Perplexity trending layer

**Context**: Content was not connected to real-world events/trends

**Options considered**:
1. Manual trend tracking → Not scalable
2. Perplexity API for real-time trends → Automated

**Decision**: Add Perplexity layer for trending topics

**Reason**:
- Perplexity can fetch current events, weather, trends
- Content becomes more relevant and timely
- No manual effort needed

**Result**: Content references current events, seasonal themes

---

## 2024-12: Pre-sanitize prompts before generation

**Context**: 30% of generations were failing due to blocked terms

**Options considered**:
1. Fix after failure → Slow, expensive
2. Pre-sanitize before generation → Prevent failures

**Decision**: Check and sanitize prompts BEFORE sending to Nano Banana Pro

**Reason**:
- Faster (no wasted generation)
- Cheaper (no failed API calls)
- Better success rate (90% vs 30%)

**Result**: Success rate improved dramatically
