# X (Twitter)

> Distribution channel for @ElenaVisco46970 — traffic source to Fanvue

**Last updated**: 29 January 2026

---

## Status: ✅ READY (API working)

> Account created, OAuth 2.0 authentication working, can post tweets via API.

---

## Sub-features

| Feature | Status | Description | Link |
|---------|--------|-------------|------|
| **Setup** | ✅ Done | Account + API working | [→](./setup/) |
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
| TASK-001 | Account Setup & API | ✅ Done | 2026-01-29 |

---

## Completed Tasks

| Task | Title | Status | Date |
|------|-------|--------|------|
| DONE-002 | X API OAuth 2.0 Connection | ✅ Complete | 2026-01-29 |

---

## Key Decisions

| Date | Decision | Reason |
|------|----------|--------|
| 2026-01-29 | Use OAuth 2.0 instead of OAuth 1.0a | OAuth 1.0a doesn't work with Pay Per Use tier |
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
| **API Status** | ✅ OAuth 2.0 working |

---

## What Works ✅

- X account created and active
- Bio and profile picture set
- Developer Portal account created
- Pay Per Use credits loaded
- **OAuth 2.0 authentication (user context)**
- **Posting tweets via API**
- User lookup via API
- Token refresh for long-term use

## What Doesn't Work ❌

- OAuth 1.0a (legacy, broken with Pay Per Use)

---

## API Usage

```bash
# Check auth status
node app/scripts/x-oauth2-test.mjs --status

# Post a tweet
node app/scripts/x-oauth2-test.mjs --post

# Refresh tokens (if expired)
node app/scripts/x-oauth2-test.mjs --refresh
```

---

## Related Features

- [ComfyUI Generation →](../comfyui-generation-workflow/) — Image generation
- [Fanvue →](../fanvue/) — Conversion destination
- [Elena Persona →](../elena-persona/) — Character definition
- [Instagram →](../instagram/) — ABANDONED, lessons learned
