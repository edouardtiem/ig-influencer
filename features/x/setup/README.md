# X Setup

> Account creation, profile optimization, and initial configuration

**Status**: 🟡 In Progress
**Last updated**: 29 January 2026

---

## Profile Configuration

### Account Details

| Field | Value |
|-------|-------|
| **Username** | @elena_verne |
| **Display Name** | Elena |
| **Account Type** | Creator (enable sensitive content) |

### Bio (160 chars max)

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

### Profile Picture

- High-quality face shot
- Soft, inviting expression
- Recognizable (same as other platforms)
- From: ComfyUI generation (once face consistency fixed)

### Banner Image

- Lifestyle shot (Paris café, loft, or mirror selfie)
- Teases aesthetic without being explicit
- Dimensions: 1500x500px

### Pinned Tweet

Best-performing teaser with CTA:
```
More where this came from 💋
Link in bio
```

---

## Account Settings

### Sensitive Content Setup

1. **Settings > Privacy and Safety > Your Posts**
2. Check "Mark media you post as containing material that may be sensitive"
3. This ensures:
   - 18+ audience only sees content
   - No accidental ban for unlabeled NSFW

### Per-Post Flagging

When posting sensitive content:
1. Compose tweet with media
2. Click Edit icon (paintbrush)
3. Select "Nudity" or "Sensitive"
4. Post

---

## Link in Bio

**Primary**: Direct Fanvue link
```
https://fanvue.com/elena_verne
```

**Alternative**: Linktree (if multiple links needed later)
```
https://elenav.link/x
```

---

## CTA Templates

For tweets redirecting to Fanvue:

| Type | Template |
|------|----------|
| Soft | "More in bio 💋" |
| Medium | "Full version on my private 👀" |
| Direct | "I only chat on Fanvue 💬" |
| Teaser | "The rest is for subscribers only" |

---

## Checklist

- [ ] Create X account (@elena_verne)
- [ ] Write bio (choose option A or B)
- [ ] Upload profile picture
- [ ] Upload banner image
- [ ] Enable sensitive content setting
- [ ] Add Fanvue link to bio
- [ ] Create pinned tweet
- [ ] Set account to "Creator" mode

---

## Blockers

| Blocker | Status | Impact |
|---------|--------|--------|
| Face consistency (ComfyUI) | 🔴 Blocked | Need coherent face for profile pic |

---

## Key Files

| File | Purpose |
|------|---------|
| `app/src/config/character-elena.ts` | Elena persona definition |
