# X (Twitter)

> Distribution channel for @ElenaVisco46970 — traffic source to Fanvue

**Last updated**: 29 January 2026

---

## Status: BLOCKED (API OAuth issue)

> Account created, but API posting blocked by OAuth 1.0a authentication issue. Bearer Token works, user context auth fails.

---

## Sub-features

| Feature | Status | Description | Link |
|---------|--------|-------------|------|
| **Setup** | ❌ Blocked | Account done, API OAuth issue | [→](./setup/) |
| **Posting** | 🔵 Todo | Content scheduling, 3-4 posts/day | [→](./posting/) |
| **Replies** | 🔵 Todo | Auto-reply to comments (Claude AI) | [→](./replies/) |
| **Engagement** | 🔵 Todo | Manual like tactics (NO automation) | [→](./engagement/) |

---

## Strategy Overview

### Why X/Twitter

| Factor | X/Twitter | Instagram |
|--------|-----------|-----------|
| NSFW content | Allowed (labeled) | Restricted |
| DM automation | Not needed | Got us banned |
| API for posting | $0 (free tier) | Via ManyChat |
| Ban risk | Lower | Higher |

### Funnel

```
X teasers (3-4/day) → Profile → Bio link → Fanvue → Venice AI chat → PPV/Tips
```

### Key Rules

| Do | Don't |
|----|-------|
| Post 3-4x/day | Auto-DM |
| Auto-reply to OWN post comments | Auto-reply on others' posts |
| Like manually (100-200/day) | Auto-like |
| Use 2-10 min delays | Reply instantly |
| Redirect to Fanvue occasionally | Spam links in every reply |
| Label sensitive content | Post unlabeled NSFW |

---

## Active Tasks

| Task | Title | Status | Date |
|------|-------|--------|------|
| TASK-001 | Account Setup & API | ❌ Blocked | 2026-01-29 |

---

## Completed Tasks

| Task | Title | Status | Date |
|------|-------|--------|------|

---

## Key Decisions

| Date | Decision | Reason |
|------|----------|--------|
| 2026-01-29 | Auto-reply to OWN post comments OK | Reactive engagement is safer than proactive DMs |
| 2026-01-29 | No mass auto-engagement | Can't auto-like/reply on OTHER accounts' posts |
| 2026-01-29 | No DM automation | Lesson from IG ban |
| 2026-01-29 | Fanvue handles chat | Venice AI already built there |
| 2026-01-29 | 2-10 min delays on replies | Looks human, avoids bot detection |

---

## Quick Stats

| Metric | Value |
|--------|-------|
| **Account** | @ElenaVisco46970 |
| **Name** | Elena Visconti |
| **Posts** | 3-4/day (target) |
| **API Plan** | Pay Per Use ($10 credits) |
| **API Status** | ❌ OAuth 1.0a blocked |

---

## What Works ✅

- X account created and active
- Bio and profile picture set
- Developer Portal account created
- Pay Per Use credits loaded
- Bearer Token authentication (app-only)
- User lookup via API

## What Doesn't Work ❌

- OAuth 1.0a user context authentication
- Posting tweets via API (401 Unauthorized)
- Access Token keeps reporting "Invalid or expired token"

---

## Related Features

- [ComfyUI Generation →](../comfyui-generation-workflow/) — Image generation
- [Fanvue →](../fanvue/) — Conversion destination
- [Elena Persona →](../elena-persona/) — Character definition
- [Instagram →](../instagram/) — ABANDONED, lessons learned
