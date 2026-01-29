# Instagram

> All Instagram-related features for @elena_verne

**Last updated**: 29 January 2026

---

## Status: ABANDONED

> ⛔ **STRATEGIC PIVOT** (2026-01-29): Instagram abandoned after account block. Moving to X/Twitter as primary distribution channel.
>
> See [CHECKPOINT-2026-01-29-STRATEGIC-PIVOT.md](./docs/CHECKPOINT-2026-01-29-STRATEGIC-PIVOT.md) for full analysis.

---

## Sub-features

| Feature | Status | Description | Link |
|---------|--------|-------------|------|
| **DM** | ⛔ ABANDONED | ManyChat + Claude AI funnel | [→](./dm/) |
| **Content Brain** | ⛔ ABANDONED | Scheduling, prompts, posting | [→](./content-brain/) |
| **Comments** | ⛔ ABANDONED | Auto-reply via ManyChat | [→](./comments/) |

> ⚠️ **ACCOUNT BLOCKED** (2026-01-29): All Instagram automations paused. See [REACTIVATION.md](./docs/REACTIVATION.md) for recovery steps (unlikely to use).

---

## Completed Tasks

| Task | Title | Status | Date |
|------|-------|--------|------|
| DONE-001 | Pause All Automations (Account Blocked) | 🟢 Completed | 2026-01-29 |

---

## Quick Stats

| Metric | Value |
|--------|-------|
| **Account** | @elena_verne |
| **Posts** | 2/day (14h lifestyle, 21h sexy) |
| **Format** | Carousel (2-4 images) |
| **DM Contacts** | 925+ |
| **Funnel** | Cold → Warm → Hot → Pitched |

---

## Architecture Overview

```
                    ┌─────────────────────────────────┐
                    │         INSTAGRAM               │
                    ├─────────────────────────────────┤
                    │                                 │
  Content Brain ───→│  Posting (14h + 21h)           │
                    │  • Nano Banana Pro images       │
                    │  • Cloudinary hosting           │
                    │  • Graph API posting            │
                    │                                 │
  ManyChat ────────→│  DM Automation                 │
                    │  • Claude AI responses          │
                    │  • Funnel stages                │
                    │  • Fanvue pitch                 │
                    │                                 │
  ManyChat ────────→│  Comments Auto-reply           │
                    │                                 │
                    └─────────────────────────────────┘
```

---

## Related Features

- [ComfyUI Generation →](../comfyui-generation-workflow/) — Image generation
- [Conversion Tracking →](../conversion-tracking/) — IG DM → Fanvue attribution
- [Elena Persona →](../elena-persona/) — Character definition
