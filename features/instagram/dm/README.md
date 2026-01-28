# Instagram DM

> ManyChat + Claude AI automation, funnel stages, and Fanvue pitch

**Status**: 🟢 Stable
**Last updated**: 26 January 2026 (ManyChat billing outage resolved)

---

## Current State

DM automation is **live and functional**. The system processes ~900+ messages/day, handles multiple languages, and routes users through a funnel toward Fanvue. **Main issue: 0% tracked conversions** (attribution ready, needs real data).

### Persona: Gleeful Luxury Wife

Elena is now a **24-year-old married woman** whose rich husband is always traveling. She enjoys her freedom, spends his money, and lives her best life — shopping, spa, travel. She's **gleeful and happy**, not sad or bored.

**Personality mix**:
- 25% FREE — Does what she wants
- 25% GLEEFUL — Always happy, enjoying life
- 20% WARM — Nice, accessible
- 20% FLIRTY — Playful, suggestive hints (IG-safe)
- 10% COMPLICE — "Just between us" energy

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

## Active Tasks

| # | Task | Status | Link |
|---|------|--------|------|
| — | (none) | — | — |

## Completed Tasks

| # | Task | Completed | Link |
|---|------|-----------|------|
| 002 | Fix nonsense responses & API costs | 28 Jan 2026 | [→](./tasks/DONE-002-fix-nonsense-responses.md) |
| 001 | Gleeful wife persona sync | 23 Jan 2026 | [→](./tasks/DONE-001-gleeful-wife-persona-sync.md) |

## Next Steps

- [ ] Monitor for real conversions (persona change may improve)
- [x] ~~Improve pitch wording (more emotional)~~ — Done 23 Jan 2026
- [x] ~~Add 15+ exit message variations~~ — Done 23 Jan 2026 (15+ FR/EN)
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

---

## Troubleshooting

### DM system not responding

**Symptoms**: No new messages in Supabase, users not getting replies

**Diagnosis steps**:
1. Check if system is paused: Query `elena_settings` table for `dm_system.paused`
2. Test webhook directly: `curl -X POST https://ig-influencer.vercel.app/api/dm/webhook -H "Content-Type: application/json" -d '{"subscriber":{"id":"test"},"last_input_text":"test"}'`
3. If webhook works → Problem is ManyChat, not backend

**Common causes**:
| Cause | Solution |
|-------|----------|
| ManyChat billing issue | Pay invoice, automations resume automatically |
| ManyChat automation unpublished | Re-publish the automation |
| Instagram disconnected ManyChat | Reconnect in ManyChat settings |
| Kill switch enabled | Set `dm_system.paused = false` in Supabase |

**Incident log**:
- 26 Jan 2026: ManyChat billing issue caused ~18h outage (no backend changes needed)
