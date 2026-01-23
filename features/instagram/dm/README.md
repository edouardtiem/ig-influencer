# Instagram DM

> ManyChat + Claude AI automation, funnel stages, and Fanvue pitch

**Status**: 🟡 Monitoring (0% conversion, waiting for data)  
**Last updated**: 23 January 2026 (language clarification added)

---

## Current State

DM automation is **live and functional**. The system processes ~900+ messages/day, handles multiple languages, and routes users through a funnel toward Fanvue. **Main issue: 0% tracked conversions** (attribution ready, needs real data).

### System Overview

```
Instagram DM → ManyChat → Webhook → /api/dm/webhook → Claude AI (Haiku 4.5)
                                                          ↓
                                                     Supabase
                                                     - elena_dm_contacts
                                                     - elena_dm_messages
```

### Active Configuration

| Component | Value |
|-----------|-------|
| **AI Model** | claude-haiku-4-5-20251001 |
| **ManyChat** | 2 automations LIVE |
| **Stages** | Cold → Warm → Hot → Pitched → Converted → Paid |
| **Languages** | EN, FR, IT, ES, PT, DE |
| **Free Trial** | 7 days via Fanvue link |

### Funnel Statistics (925 contacts)

| Stage | Count | % |
|-------|-------|---|
| Cold | 229 | 24.8% |
| Warm | 109 | 11.8% |
| Hot | 333 | 36.0% |
| Pitched | 254 | 27.5% |
| Converted | 0 | 0% |

---

## What Works ✅

| What | Details |
|------|---------|
| **ManyChat integration** | Webhook receives messages reliably |
| **Claude AI responses** | Natural, contextual, multilingual |
| **Stage progression** | Cold → Warm → Hot → Pitched flows |
| **Language detection** | Real-time, mirrors user's language |
| **Language clarification** | Asks user's language on switch or unknown |
| **Anti-spam protection** | Max 3 Fanvue links per conversation |
| **Race condition fix** | In-memory lock prevents duplicate sends |
| **Response validator** | Anti-hallucination with 3 retry attempts |
| **Smart fallbacks** | 12 varied questions when API fails |
| **User profile extraction** | Remembers name, job, location |
| **MESSAGE_CAPS** | Enforced per stage |

## What Doesn't Work ❌

| What | Details |
|------|---------|
| **Hard 12-word limit** | Made Elena robotic → Removed |
| **"hey 🖤" fallback** | Caused spam loops → Replaced |
| **Ignoring history** | "Only use last message" → Now uses full context |
| **English-only default** | Caused language switches → Removed |

---

## Next Steps

- [ ] Monitor for real conversions
- [ ] Improve pitch wording (more emotional)
- [ ] Add 15+ exit message variations
- [ ] Detect time-wasters (50+ msgs without clicking)

---

## Quick Links

- [Decisions →](./DECISIONS.md)
- [Conversion Tracking →](../../conversion-tracking/)

---

## Key Files

| File | Purpose |
|------|---------|
| `app/src/lib/elena-dm.ts` | Main DM logic, AI prompts |
| `app/src/app/api/dm/webhook/route.ts` | ManyChat webhook |

---

## Stage Behavior

| Stage | Cap | Behavior |
|-------|-----|----------|
| Cold | 15 | Detect language, warm up |
| Warm | 20 | Build rapport |
| Hot | 20 | Flirty, pitch at msg 10+ |
| Pitched | 5 | Handle objections, exit |
| Stopped | 0 | No more responses |
