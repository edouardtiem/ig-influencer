# Strategic Pivot: Instagram → X/Twitter

> **Date**: 2026-01-29
> **Status**: CHECKPOINT
> **Decision**: Abandon Instagram, pivot to X/Twitter

---

## What Happened

### Instagram Account Blocked (2026-01-29)

The Elena Instagram account was permanently blocked due to aggressive automation:

| Factor | Detail |
|--------|--------|
| **DM contacts** | 925 |
| **Automation** | ManyChat + Claude AI |
| **Link sends** | Up to 3x per contact (~2775 total) |
| **Response delays** | 15-35 seconds (too fast) |
| **Bug impact** | 2-3 day bug sent repetitive messages |
| **Conversions** | ~$100 on Fanvue |
| **Result** | Account blocked |

### Root Cause Analysis

1. **Volume too high** — 925 contacts with hourly followups
2. **Repetitive patterns** — Bug exposed automation behavior
3. **Link spam** — Linktree sent too frequently
4. **ManyChat constraints** — 24h window forced rushed followups

---

## Decision: Abandon Instagram

**Why not restart on new IG account:**
- Same automation approach = same result
- Device/IP fingerprinting risk
- IG increasingly hostile to NSFW + automation
- Better alternatives exist

**All Instagram automations paused:**
- GitHub Actions schedules commented out
- DM kill switch activated in Supabase
- See [REACTIVATION.md](./REACTIVATION.md) if ever needed

---

## New Strategy: X/Twitter → Fanvue

### Why X/Twitter

| Factor | X/Twitter | Instagram |
|--------|-----------|-----------|
| NSFW content | Allowed | Restricted |
| DM automation | Not needed | Got us banned |
| Ban risk | Lower | Higher |
| API constraints | None (no DMs) | ManyChat 24h window |

### Approach

1. **Post teasers 3-4x/day** on X
2. **No DM automation** — redirect to Fanvue: "I only chat on my private"
3. **Growth via engagement** — like replies on similar accounts
4. **Fanvue handles conversion** — Venice AI chat already built
5. **Reddit as future channel** — investigate later

### Funnel

```
X/Twitter teasers → Profile → Bio link → Fanvue → Venice AI chat → PPV/Tips
```

---

## Blocked: Face Consistency

Before executing new strategy, need to fix **ComfyUI face consistency** issue.
Current blocker: cannot produce coherent face across images.

---

## What's Preserved

| Asset | Status |
|-------|--------|
| Fanvue account | Active |
| Venice AI chat | Working |
| ComfyUI workflows | Need face fix |
| Elena persona | Defined |
| DM logic/prompts | Reusable for Fanvue |

---

## Next Steps

1. Fix face consistency in ComfyUI
2. Set up X/Twitter account for Elena
3. Build content posting workflow (ComfyUI → X)
4. Implement like-engagement automation (safe)
5. Monitor and iterate

---

## Files Modified in This Pivot

- `.github/workflows/content-brain.yml` — Schedules paused
- `.github/workflows/dm-followup.yml` — Schedules paused
- `features/instagram/README.md` — Status updated to PAUSED
- Supabase `elena_settings.dm_system` — Kill switch active

---

## Lessons Learned

1. **DM automation at scale = ban risk** on any platform
2. **Let the paid platform handle chat** (Fanvue, not Instagram)
3. **Social media = traffic source only**, not conversion engine
4. **Diversify channels** — don't depend on one platform
5. **Test conservative first**, scale up gradually

---

*This document marks the end of Instagram strategy and beginning of X/Twitter pivot.*
