# X Posting

> Automated content scheduling and posting to X/Twitter

**Status**: 🟡 Planning Complete
**Last updated**: 29 January 2026

---

## Overview

Post 3-4 teasers per day to X using real-time generation (generate at post time, not in advance).

### Architecture Decision (2026-01-29)

**Real-time generation** instead of daily scheduler:
- Each post time (4x/day), script generates tweet based on today's history
- If you change settings/prompts, the next post immediately uses them
- Simpler than Instagram's scheduler + executor pattern

See [TASK-003](../tasks/TASK-003-x-auto-posting.md) for implementation details.

---

## Posting Schedule

| Time (CET) | Slot | Content Type |
|------------|------|--------------|
| 9-10 AM | Morning | Lifestyle teaser (cozy, getting ready) |
| 2-3 PM | Afternoon | Engagement post (poll, question) |
| 7-9 PM | Evening | Spicier teaser (more revealing) |
| 10-11 PM | Night | Optional 4th post |

---

## Content Strategy

### Content Types (by performance)

| Type | Priority | Notes |
|------|----------|-------|
| **Short video clips** | Best | 10-15s teasers outperform photos |
| **Photos** | Good | Single image with strong hook |
| **Polls** | Good | "What should I wear tomorrow?" |
| **Questions** | Medium | "Where should I travel next?" |

### Hashtag Strategy

**Use 2-3 hashtags per post:**

| Type | Examples |
|------|----------|
| Niche | `#parismodel` `#italianmodel` `#fashionparis` |
| Avoid | `#NSFW` `#OnlyFans` (often filtered) |

### Tweet Templates

**Teaser posts:**
```
[Lifestyle context] ✨
[Hint at more content]
More in bio 💋
```

**Poll posts:**
```
What should I wear tomorrow? 👀
```

**Question posts:**
```
Where should I travel next? 🌍
Tell me your favorite city ⬇️
```

---

## Technical Implementation

### X API (Free Tier)

| Feature | Limit |
|---------|-------|
| Posts per month | 1,500 |
| Posts per day | ~50 (safe: 10-20) |
| Media uploads | Included |

### Architecture (Real-Time Generation)

```
GitHub Actions (4 cron triggers)
         ↓
   x-post-auto.mjs
         ↓
┌────────────────────────────┐
│ 1. Load today's history    │
│ 2. Get trending (Perplexity)│
│ 3. Generate tweet (Claude)  │
│ 4. Post to X API           │
│ 5. Save to Supabase        │
└────────────────────────────┘
```

### Workflow

1. **History**: Check what was posted today (avoid repetition)
2. **Trending**: Get current topics via Perplexity
3. **Generate**: Claude creates tweet (280 chars, Elena persona)
4. **Post**: X API posts (text now, images when ComfyUI ready)
5. **Track**: Log in Supabase `x_post_history`

---

## Key Files (to create)

| File | Purpose |
|------|---------|
| `app/scripts/x-post-auto.mjs` | Main auto-posting script (generate + post) |
| `app/src/lib/x-api.ts` | X API client (tokens, posting) |
| `app/scripts/lib/x-trending-layer.mjs` | X-specific Perplexity prompts |
| `.github/workflows/x-posting.yml` | GitHub Actions (4 cron triggers) |

---

## Dependencies

- X Developer account (free tier)
- API keys in `.env.local`:
  - `X_API_KEY`
  - `X_API_SECRET`
  - `X_ACCESS_TOKEN`
  - `X_ACCESS_SECRET`

---

## Sensitive Content

**Every NSFW post must be flagged:**

```typescript
// When posting via API, include:
const params = {
  text: "Tweet text",
  media: { media_ids: [mediaId] },
  possibly_sensitive: true  // ← Required for NSFW
};
```

---

## Blockers

| Blocker | Status | Impact |
|---------|--------|--------|
| Face consistency (ComfyUI) | 🔴 Blocked | Need coherent images to post |
| ~~X account setup~~ | ✅ Done | Account @ElenaVisco46970 ready |
| ~~X API keys~~ | ✅ Done | OAuth 2.0 fonctionne |

---

## Next Steps

1. [x] Set up X developer account
2. [x] Get API keys (OAuth 2.0)
3. [x] Build `x-api.ts` client
4. [x] Build posting script
5. [ ] Create GitHub Actions workflow _(blocked by ComfyUI)_
6. [x] Test posting flow
