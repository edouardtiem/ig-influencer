# X Posting

> Automated content scheduling and posting to X/Twitter

**Status**: 🔵 Todo
**Last updated**: 29 January 2026

---

## Overview

Schedule and post 3-4 teasers per day to X. Use X API (free tier) for posting — no third-party service needed.

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

### Architecture

```
ComfyUI → Image ready → X API → Posted
                    ↓
              GitHub Actions (scheduler)
```

### Workflow

1. **Generate**: ComfyUI produces image
2. **Caption**: Claude generates tweet text
3. **Post**: X API posts with media
4. **Track**: Log in Supabase

---

## Key Files (to create)

| File | Purpose |
|------|---------|
| `app/scripts/x-post.mjs` | Post to X via API |
| `app/scripts/x-scheduler.mjs` | Schedule posts |
| `.github/workflows/x-posting.yml` | Cron trigger |
| `app/src/lib/x-api.ts` | X API client |

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
| X account setup | 🔴 Blocked | Need account before posting |
| X API keys | 🔵 Todo | Need developer account |

---

## Next Steps

1. [ ] Set up X developer account
2. [ ] Get API keys
3. [ ] Build `x-api.ts` client
4. [ ] Build `x-post.mjs` script
5. [ ] Create GitHub Actions workflow
6. [ ] Test posting flow
