# Content Brain

> Automated content scheduling, AI-powered creative decisions, and Instagram posting

**Status**: 🟢 Stable (v3 "Freedom Mode")
**Last updated**: 28 January 2026

---

## Current State

Content Brain v3 is **live and working**. Claude has full creative freedom to decide locations, outfits, poses, and captions. The only constraint is the Nano Banana Pro blocklist. Posts are scheduled at 14h and 21h daily.

### Architecture

```
Perplexity (trending) ──┐
                        ├─→ Claude (Extended Thinking) ─→ Blocklist ─→ Nano Banana Pro ─→ Instagram
Analytics + History ────┘
```

### Active Configuration

| Component | Value |
|-----------|-------|
| **AI Model** | Claude (Extended Thinking) |
| **Image Generation** | Nano Banana Pro (Replicate) |
| **Post Times** | 14h (lifestyle), 21h (sexy) |
| **Format** | Carousel (2-4 images) |
| **Blocklist** | `nano-banana-blocklist.mjs` |
| **Success Rate** | ~90% |

### Layers

| Layer | Purpose |
|-------|---------|
| **History** | Track story arcs, avoid repeating locations (7-day window) |
| **Context** | Real-time events via Perplexity |
| **Trending** | Current trends via Perplexity (no analytics bias) |
| **Analytics** | Only for timing/format, NOT content decisions |

---

## What Works ✅

| What | Details |
|------|---------|
| **Freedom Mode (v3)** | Claude invents locations, outfits, poses freely |
| **Perplexity → Claude flow** | Claude's decisions (based on Perplexity trends) now used directly |
| **Blocklist sanitization** | Pre-sanitize prompts, retry on failure |
| **7-day avoid list** | Prevents repeating same locations |
| **Trending layer** | Perplexity for current trends |
| **90% success rate** | Up from 30% after blocklist fixes |
| **Image ref MIME detection** | Auto-detect PNG/JPEG/WEBP for Nano Banana Pro |
| **Simplified face prompts** | "Copy IMAGE 1" instead of detailed descriptions |

## What Doesn't Work ❌

| What | Details |
|------|---------|
| **Hardcoded locations** | 90 static locations removed |
| **Hardcoded outfit/pose arrays** | Ignored Claude's decisions → Now use Claude directly |
| **Silk pajamas/camisoles** | Outdated style → Removed, modern styles preferred |
| **Analytics in trending** | Caused Bali/Mykonos loop → Removed |
| **3-day avoid list** | Too short → Extended to 7 days |
| **Detailed face descriptions** | Override image refs → Simplified to "copy IMAGE 1" |
| **Hardcoded MIME types** | PNG declared as JPEG broke face consistency |

---

## Next Steps

- [ ] Monitor success rate
- [ ] Add blocklist terms if new failures detected
- [ ] Apply same Freedom Mode to Mila when reactivated

---

## 🔬 Exploration en cours : Google API Direct

**Session 23/01/2026** — Tests pour plus de liberté sur contenu sexy SFW.

| Option | Avantages | Inconvénients |
|--------|-----------|---------------|
| **Google API direct** (`gemini-3-pro-image-preview`) | Plus permissif (curves, towel, thong back OK) | $0.134/img, ref Elena limite |
| **Nano Banana Pro** (Replicate) | Moins cher ($0.08), stable | Filtres stricts |

**Détails** → [Session 23/01/2026](./sessions/2026-01-23-google-api-sexy-limits-exploration.md)

---

## Quick Links

- [Decisions →](./DECISIONS.md)
- [ComfyUI Generation →](../../comfyui-generation-workflow/) — Image generation details

---

## Key Files

| File | Purpose |
|------|---------|
| `app/scripts/cron-scheduler.mjs` | Main scheduler, Freedom prompt |
| `app/scripts/scheduled-post.mjs` | Post execution |
| `app/scripts/lib/nano-banana-blocklist.mjs` | Blocked terms |
| `app/scripts/lib/history-layer.mjs` | Story tracking |
| `app/scripts/lib/trending-layer.mjs` | Perplexity trends |

### GitHub Actions

| Workflow | Purpose |
|----------|---------|
| `content-brain.yml` | Runs scheduler |
| `auto-post-elena.yml` | 14h + 21h posts |
