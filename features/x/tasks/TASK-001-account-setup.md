# TASK-001: X Account Setup & API

**Status**: ❌ Blocked (OAuth 1.0a issue)
**Created**: 2026-01-29
**Feature**: [X](../README.md) > [Setup](../setup/)

---

## Goal

Create X/Twitter account for Elena, configure profile, and set up free tier API access for posting and replies.

---

## Acceptance Criteria

### Account Setup
- [x] X account created (@ElenaVisco46970)
- [x] Bio written and set
- [x] Profile picture uploaded
- [ ] Banner image uploaded
- [ ] Sensitive content setting enabled
- [ ] Fanvue link in bio
- [x] First post created
- [ ] First post pinned
- [ ] Account set to Creator mode

### API Setup (Pay Per Use)
- [x] X Developer Portal account created
- [x] App created in developer portal (Elena2)
- [x] Credits added ($10)
- [x] User Authentication configured (Read and Write)
- [x] API keys obtained and added to `.env.local`
- [x] Test script created (`app/scripts/x-test-post.mjs`)
- [ ] Basic API test works (OAuth 1.0a blocked — needs debugging)

---

## Approach

### Part 1: Account Setup (Manual - User does this)
1. Go to x.com and create account
2. Choose username (@elena_verne if available)
3. Write bio using template below
4. Upload profile picture (placeholder or generated)
5. Upload banner image
6. Settings → Privacy → Enable "Mark media as sensitive"
7. Add Fanvue link to bio
8. Create first post and pin it

### Part 2: API Setup (Manual - User does this)
1. Go to developer.x.com
2. Sign up for Developer Portal (free tier)
3. Create a new App (name: "Elena Bot" or similar)
4. Generate API keys:
   - API Key (Consumer Key)
   - API Secret (Consumer Secret)
   - Access Token
   - Access Token Secret
5. Set app permissions to "Read and Write"
6. Copy keys to `.env.local`

### Part 3: API Test (Ralph can do this)
1. Create `app/scripts/x-test-post.mjs`
2. Test posting a simple tweet
3. Verify it works

---

## Bio Options

**Option A (warm & mysterious):**
```
Italian girl lost in Paris 🇮🇹🇫🇷
Fashion shoots, café terraces & things I can't post here
Chat with me ⬇️
```

**Option B (direct value prop):**
```
Elena • 24 • Model • Paris life
My DMs are open on Fanvue 💋
Daily teasers here • Full content below ⬇️
```

---

## Blockers

| Blocker | Impact |
|---------|--------|
| Face consistency (ComfyUI) | Profile picture — use placeholder for now |

---

## Files Involved

- `app/src/config/character-elena.ts` — Persona reference
- `features/x/setup/README.md` — Setup documentation
- `app/.env.local` — API keys (to add)
- `app/scripts/x-test-post.mjs` — Test script (to create)

---

## API Keys Template

Add to `app/.env.local`:
```
# X (Twitter) API - Free Tier
X_API_KEY=your_api_key
X_API_SECRET=your_api_secret
X_ACCESS_TOKEN=your_access_token
X_ACCESS_SECRET=your_access_secret
```

---

## Progress Log

### 2026-01-29
- Task created
- Bio options defined
- Setup documentation created
- Blocked by: face consistency issue in ComfyUI

### 2026-01-29 (Evening Session)
**Account Setup — DONE:**
- X account created: @ElenaVisco46970 (Elena Visconti)
- Bio set: "I got bored as a wife. Finally found new ways to have fun 💋. I only answer to DM in my private 👇"
- Location: Paris, France
- Profile picture uploaded
- First post created

**API Setup — IN PROGRESS (blocked by OAuth 1.0a issue):**
- Developer Portal account created (Pay Per Use plan)
- Credits added to account ($10)
- Created two apps: original app + "Elena2"
- User Authentication Settings configured (Read and Write permissions)
- Multiple key regenerations attempted
- Bearer Token works (verified with user lookup)
- OAuth 1.0a keeps failing with 401 "Unauthorized" or "Invalid or expired token"

**What Works:**
- Bearer Token authentication (app-only)
- Can lookup users via API

**What Doesn't Work:**
- OAuth 1.0a user context authentication
- Posting tweets via API

**Issue Identified:**
- Access Token generated for wrong app (old app vs Elena2)
- Need to ensure Access Token is generated from SAME app as Consumer Keys

**Next Steps:**
1. Go to Elena2 app specifically
2. Regenerate Access Token from Elena2's "Keys and Tokens"
3. Test API again
4. If still failing, investigate Pay Per Use + OAuth 1.0a compatibility

---

## Outcome

_Fill when task is complete, then rename file to DONE-001-account-setup.md_

---

## Ralph Sessions

_Automatically filled when Ralph completes this task_
