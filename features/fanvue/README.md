# Fanvue

> All Fanvue-related features: DM bot, posting, and content pipeline

**Last updated**: 23 January 2026

---

## Sub-features

| Feature | Status | Description | Link |
|---------|--------|-------------|------|
| **DM** | 🟢 Stable | Venice AI bot, memory system | [→](./dm/) |
| **Posting** | 🟢 Stable | Daily posts at 17h | [→](./posting/) |
| **Pipeline** | 📋 Planned | BigLust → Fanvue automation | [→](./pipeline/) |

---

## Quick Stats

| Metric | Value |
|--------|-------|
| **Platform** | Fanvue |
| **Daily Posts** | 1/day (17h) |
| **DM Bot** | Venice AI (uncensored) |
| **Vaults** | elena-feed, elena-ppv, elena-archive |
| **Free Trial** | 7 days |

---

## Architecture Overview

```
                    ┌─────────────────────────────────┐
                    │           FANVUE                │
                    ├─────────────────────────────────┤
                    │                                 │
  GitHub Actions ──→│  Daily Posting (17h)           │
                    │  • ComfyUI images               │
                    │  • Fanvue API upload            │
                    │                                 │
  Webhook ─────────→│  DM Bot                        │
                    │  • Venice AI (uncensored)       │
                    │  • Memory system                │
                    │                                 │
  (Planned) ───────→│  Content Pipeline              │
                    │  • MediaPipe face crop          │
                    │  • Vault management             │
                    │  • PPV tracking                 │
                    │                                 │
                    └─────────────────────────────────┘
```

---

## Related Features

- [ComfyUI Generation →](../comfyui-generation-workflow/) — Image generation
- [Conversion Tracking →](../conversion-tracking/) — IG DM → Fanvue attribution
- [Instagram DM →](../instagram/dm/) — IG funnel that pitches Fanvue
