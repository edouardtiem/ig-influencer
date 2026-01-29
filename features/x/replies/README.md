# X Replies

> Auto-reply to comments on Elena's own posts using Claude AI

**Status**: 🔵 Todo
**Last updated**: 29 January 2026

---

## Overview

Automatically reply to people who comment on Elena's posts. This is **safer than DM automation** because:

1. **Reactive** — They engage first, you respond
2. **Own posts only** — Not spamming random threads
3. **Natural behavior** — Creators reply to fans

---

## Why This Is Different From IG

| Factor | IG DMs (banned) | X Own-Post Replies |
|--------|-----------------|---------------------|
| Type | Proactive outreach | Reactive engagement |
| Volume | 925 contacts | Only your commenters |
| Speed | 15-35 seconds | 2-10 min delays |
| Target | Mass DMs | Own posts only |
| Risk | High | Low-Medium |

---

## Safe Configuration

| Setting | Value | Why |
|---------|-------|-----|
| **Delay** | 2-10 min (randomized) | Looks human |
| **Daily cap** | 50-100 replies | Avoid rate limits |
| **Content** | Claude AI personalized | No templates |
| **Target** | Own post comments only | Not random threads |

### X API Limits

| Limit | Value |
|-------|-------|
| Tweets/day (incl. replies) | 2,400 |
| POST /tweets per 15min | ~300 |
| Safe daily replies | 50-100 |

---

## Architecture

```
X API (webhook/poll) → New comment detected
         ↓
    Claude Haiku → Generate personalized reply
         ↓
    Delay 2-10 min (random)
         ↓
    X API → Post reply
         ↓
    Supabase → Log interaction
```

---

## Reply Strategy

### Reply Types

| Comment Type | Reply Approach |
|--------------|----------------|
| Compliment ("so hot 🔥") | Thank + tease ("Wait till you see the rest 👀") |
| Question ("where is this?") | Answer briefly + engage |
| Flirty | Flirt back + redirect to Fanvue |
| Spam/negative | Ignore (filter out) |

### CTA Integration

Occasionally include soft CTAs:
- "More like this on my private 💋"
- "The uncensored version is... elsewhere 👀"
- "I'm more chatty on Fanvue 💬"

**Don't spam links in every reply** — Mix genuine engagement with occasional redirects.

---

## Claude Prompt (Draft)

```
You are Elena, 24, Italian model living in Paris. Someone commented on your X post.

Their comment: "{comment}"

Reply naturally as Elena would:
- Warm, playful, slightly flirty
- Keep it short (1-2 sentences max)
- If they're being nice, thank them genuinely
- If flirty, flirt back subtly
- Occasionally (20% of time) mention "my private" or "Fanvue" for more content
- Never be aggressive or salesy
- Use 1-2 emojis max

Reply:
```

---

## Implementation

### Option A: Polling (simpler)

1. Cron job every 5-10 min
2. Fetch recent comments on Elena's posts
3. Filter: only unreplied comments
4. Generate reply with Claude
5. Wait random delay (2-10 min)
6. Post reply via X API
7. Log in Supabase

### Option B: Webhook (real-time)

1. X Account Activity API (requires approval)
2. Webhook receives comment events
3. Queue for delayed processing
4. Same reply flow

**Recommendation**: Start with Option A (polling) — simpler, no webhook approval needed.

---

## Key Files (to create)

| File | Purpose |
|------|---------|
| `app/scripts/x-reply-bot.mjs` | Main reply bot script |
| `app/src/lib/x-api.ts` | X API client |
| `app/src/lib/x-replies.ts` | Reply logic + Claude integration |
| `.github/workflows/x-replies.yml` | Cron trigger (every 10 min) |

---

## Database Schema

```sql
-- Track replied comments to avoid duplicates
CREATE TABLE x_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tweet_id TEXT NOT NULL,           -- Original Elena post
  comment_id TEXT NOT NULL UNIQUE,  -- Comment we're replying to
  comment_text TEXT,
  comment_author TEXT,
  reply_id TEXT,                    -- Our reply tweet ID
  reply_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Safety Rules

### Do
- Reply only to own post comments
- Use randomized delays (2-10 min)
- Personalize with Claude (no templates)
- Cap at 50-100 replies/day
- Filter out spam/negative comments

### Don't
- Reply instantly (looks like bot)
- Use identical replies
- Reply to random threads
- Exceed 100 replies/day initially
- Include links in every reply

---

## Monitoring

| Metric | Watch For |
|--------|-----------|
| Reply success rate | Should be >95% |
| Rate limit errors | Reduce volume if hitting |
| Engagement rate | Are people responding back? |
| Reports/flags | Pause if any warnings |

---

## Blockers

| Blocker | Status | Impact |
|---------|--------|--------|
| X account setup | 🔴 Blocked | Need account first |
| X API keys | 🔵 Todo | Need developer account |
| Face consistency | 🔴 Blocked | Need posts to get comments |

---

## Next Steps

1. [ ] Set up X developer account
2. [ ] Get API keys (read + write)
3. [ ] Build `x-api.ts` client
4. [ ] Create `x-replies.ts` logic
5. [ ] Write Claude prompt for Elena replies
6. [ ] Build polling script
7. [ ] Create Supabase table
8. [ ] Test on first posts
9. [ ] Create GitHub Actions cron
