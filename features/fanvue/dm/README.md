# Fanvue DM Bot

> Venice AI uncensored chat bot with memory system

**Status**: 🟢 Stable  
**Last updated**: 23 January 2026

---

## Current State

Fanvue DM bot is **live** using Venice AI (uncensored). It can handle explicit conversations that Claude refuses. Memory system tracks conversation history.

### Architecture

```
Fanvue DM → Webhook → /api/fanvue/dm/webhook → Venice AI
                                                   ↓
                                              Supabase
                                              - fanvue_conversations
                                              - fanvue_messages
```

### Active Configuration

| Component | Value |
|-----------|-------|
| **AI Model** | Venice AI (uncensored) |
| **Memory** | Supabase conversation history |
| **Languages** | FR, EN, IT, ES, PT, DE |

---

## What Works ✅

| What | Details |
|------|---------|
| **Venice AI** | Uncensored, handles explicit content |
| **Memory system** | Remembers conversation history |
| **Language matching** | Mirrors user's language |
| **Webhook integration** | Receives Fanvue DMs |

## What Doesn't Work ❌

| What | Details |
|------|---------|
| **Claude for explicit** | Refuses explicit content → Venice AI |

---

## Quick Links

- [Decisions →](./DECISIONS.md)

---

## Key Files

| File | Purpose |
|------|---------|
| `app/src/lib/fanvue-dm.ts` | Fanvue DM logic |
| `app/src/app/api/fanvue/dm/webhook/route.ts` | Webhook handler |

---

## Related Documentation

- `docs/fanvue/FANVUE_DM_FIX_SUMMARY.md`
- `docs/fanvue/FANVUE_MEMORY_SYSTEM.md`
- `docs/fanvue/FANVUE_HARDCORE_MODE.md`
