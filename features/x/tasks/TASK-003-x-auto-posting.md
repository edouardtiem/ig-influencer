# TASK-003: X Auto-Posting (Content Brain for X)

**Status**: 🔵 Todo
**Created**: 2026-01-29
**Feature**: [X](../README.md) > [Posting](../posting/)

---

## Goal

Build an automated posting system for X that adapts the Instagram Content Brain architecture with real-time generation (generate at post time, not in advance).

---

## Acceptance Criteria

- [ ] `x-post-auto.mjs` script generates and posts tweets
- [ ] Uses Claude + Perplexity for intelligent content generation
- [ ] Checks today's post history to avoid repetition
- [ ] Supports 4 daily slots: morning (9h), afternoon (14h), evening (20h), night (22h)
- [ ] GitHub Actions workflow triggers at each post time
- [ ] Supabase `x_post_history` table tracks posted content
- [ ] Text-only posts initially (images via ComfyUI later)
- [ ] Sets `possibly_sensitive: true` for NSFW content
- [ ] No linter errors introduced

---

## Architecture Decision

**Real-time generation** instead of daily scheduler:

```
Instagram Pattern (OLD):
7:00 AM: Scheduler generates 4 posts → saves to Supabase
Every 30 min: Executor checks if any post is due → posts

X Pattern (NEW):
9:00 AM: Script runs → generates tweet based on history → posts immediately
14:00: Script runs → sees morning post → generates afternoon tweet → posts
20:00: Script runs → sees both posts → generates evening tweet → posts
22:00: Script runs → sees all posts → generates night tweet → posts
```

**Benefits:**
- If you change settings/prompts, the next post immediately uses them
- Each post is informed by what was *actually* posted, not what was *planned*
- Simpler architecture (no scheduler + executor split)

---

## Approach

### Phase 1: Core X Posting Script
1. Create `app/scripts/x-post-auto.mjs`
2. Load today's history from Supabase
3. Determine post slot based on current time
4. Call Claude with history + trending context
5. Post to X API
6. Save to history

### Phase 2: X API Client
1. Create `app/src/lib/x-api.ts`
2. Token management (load from `.x-oauth2-tokens.json`, refresh)
3. Tweet posting (text, media later)
4. Error handling

### Phase 3: Supabase Table
1. Create `x_post_history` table with columns:
   - id, posted_at, tweet_id, slot, text, media_urls, persona

### Phase 4: GitHub Actions
1. Create `.github/workflows/x-posting.yml`
2. 4 cron triggers: 8:00, 13:00, 19:00, 21:00 UTC

### Phase 5: ComfyUI Integration (Later)
- Add image generation when face consistency is fixed

---

## Files to Create

| File | Purpose |
|------|---------|
| `app/scripts/x-post-auto.mjs` | Main auto-posting script (generate + post) |
| `app/src/lib/x-api.ts` | X API client (tokens, posting) |
| `app/scripts/lib/x-trending-layer.mjs` | X-specific Perplexity prompts |
| `.github/workflows/x-posting.yml` | GitHub Actions (4 cron triggers) |

---

## X Elena Caption Style

```
[HUSBAND HOOK] + [TEASER] + [SOFT CTA]

Example:
"He's working late in Singapore... 😏
Guess what I'm not wearing to bed
More in bio 💋"
```

- 280 char limit
- 2-3 hashtags max
- More direct than Instagram

---

## Dependencies

- X OAuth 2.0 tokens (already working via `x-oauth2-test.mjs`)
- Supabase (1 new table needed)
- Perplexity API key (already configured)
- Claude API key (already configured)

---

## Blockers

| Blocker | Impact | Workaround |
|---------|--------|------------|
| ComfyUI face consistency | No images | Text-only posts first |

---

## Progress Log

### 2026-01-29
- Planning session completed
- Investigated Instagram Content Brain architecture
- Decided on real-time generation approach (not daily scheduler)
- Created detailed implementation plan in `/Users/edouardtiem/.claude/plans/lovely-toasting-gray.md`
- Next: Implementation

---

## Outcome

_Fill when task is complete, then rename file to DONE-003-x-auto-posting.md_

---

## Ralph Sessions

_Automatically filled when Ralph completes this task_
