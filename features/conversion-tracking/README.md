# Conversion Tracking

> Attribution system: IG DM → Fanvue subscriber tracking

**Status**: 🟡 Monitoring (system ready, waiting for data)  
**Last updated**: 23 January 2026

---

## Current State

Attribution system is **implemented and ready**. Webhooks are configured, fuzzy matching works. **Main issue: 0% tracked conversions** — waiting for real data to validate.

### How It Works

```
IG DM funnel pitches Fanvue link
           ↓
User clicks, creates Fanvue account
           ↓
Fanvue webhook → /api/fanvue/webhook
           ↓
Attribution logic (3 levels):
  1. Exact match: IG username = Fanvue handle
  2. Fuzzy match: Similar usernames (Levenshtein)
  3. Timing match: Conversion within 24h of pitch
           ↓
Update Supabase: contact → converted/paid
```

### Active Configuration

| Component | Value |
|-----------|-------|
| **Webhook events** | `follower.created`, `subscriber.created` |
| **Attribution levels** | 3 (exact, fuzzy, timing) |
| **Tracking link** | `/fv-2` + free trial UUID |
| **Free trial** | 7 days |

---

## What Works ✅

| What | Details |
|------|---------|
| **Fanvue webhook** | Receives `follower.created`, `subscriber.created` |
| **Fuzzy matching** | Levenshtein distance for similar usernames |
| **3-level attribution** | Exact → Fuzzy → Timing |
| **Database updates** | Marks contacts as `converted` or `paid` |
| **Combined tracking link** | `/fv-2` + free trial for double tracking |

## What Doesn't Work ❌

| What | Details |
|------|---------|
| **0% conversions tracked** | System ready but no real conversions yet |

## Open Questions ❓

- Is the free trial link actually working?
- Are users clicking but not converting?
- Is fuzzy matching too strict or too loose?

---

## Next Steps

- [ ] Wait for real conversions to validate system
- [ ] Test free trial link manually
- [ ] Add UTM tracking: `?utm_source=ig_dm&utm_campaign={username}`
- [ ] Dashboard to visualize conversion funnel

---

## Quick Links

- [Decisions →](./DECISIONS.md)
- [Instagram DM →](../instagram/dm/) — Where funnel starts
- [Fanvue →](../fanvue/) — Where conversions happen

---

## Key Files

| File | Purpose |
|------|---------|
| `app/src/lib/fanvue-attribution.ts` | Fuzzy matching & attribution |
| `app/src/app/api/fanvue/webhook/route.ts` | Webhook handler |

---

## Attribution Logic

### Level 1: Exact Match
```
IG username: @john_doe
Fanvue handle: john_doe
→ Match!
```

### Level 2: Fuzzy Match
```
IG username: @john.doe.123
Fanvue handle: johndoe
→ Levenshtein distance < threshold → Match!
```

### Level 3: Timing Match
```
@john_doe pitched at 14:00
Fanvue account created at 14:30
→ Within 24h window → Match!
```

---

## Metrics to Track

| Metric | Current | Goal |
|--------|---------|------|
| Pitched contacts | 254 | - |
| Tracked conversions | 0 | 10%+ |
| Free trial signups | ? | Track |
| Paid conversions | 0 | 2-5% |
