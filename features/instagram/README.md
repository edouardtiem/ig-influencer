# Instagram

> All Instagram-related features for @elena_verne

**Last updated**: 23 January 2026

---

## Sub-features

| Feature | Status | Description | Link |
|---------|--------|-------------|------|
| **DM** | 🟡 Monitoring | ManyChat + Claude AI funnel | [→](./dm/) |
| **Content Brain** | 🟢 Stable | Scheduling, prompts, posting | [→](./content-brain/) |
| **Comments** | 🟢 Stable | Auto-reply via ManyChat | [→](./comments/) |

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
