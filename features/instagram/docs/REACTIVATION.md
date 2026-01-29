# Instagram Reactivation Guide

> **Status**: Account BLOCKED since 2026-01-29
> **Last Updated**: 2026-01-29

This document explains how to reactivate all Instagram automations if the account is recovered.

---

## Quick Checklist

- [ ] 1. Confirm Instagram account is fully recovered and accessible
- [ ] 2. Wait 24-48h after recovery before reactivating automations
- [ ] 3. Disable DM kill switch in Supabase
- [ ] 4. Uncomment GitHub Actions schedules
- [ ] 5. Reconfigure ManyChat flows (if needed)
- [ ] 6. Test with manual triggers before enabling cron
- [ ] 7. Monitor closely for first 48h

---

## Step 1: Disable DM Kill Switch

### Option A: Using the script (recommended)

```bash
cd app
node scripts/dm-pause.mjs --resume
```

### Option B: Direct SQL

```sql
UPDATE elena_settings
SET value = jsonb_build_object(
  'paused', false,
  'paused_at', NULL,
  'paused_reason', NULL
)
WHERE key = 'dm_system';
```

### Option C: Via API

```bash
curl -X POST https://ig-influencer.vercel.app/api/dm/settings \
  -H "Content-Type: application/json" \
  -d '{"paused": false}'
```

### Verify

```bash
node scripts/dm-pause.mjs --status
# Should show: 🟢 ACTIVE
```

---

## Step 2: Reactivate GitHub Actions

### Content Brain (`.github/workflows/content-brain.yml`)

Find this block (around line 14-22):

```yaml
on:
  # ⚠️ PAUSED 2026-01-29 — Instagram account blocked
  # To reactivate: uncomment schedule section below
  # See: features/instagram/docs/REACTIVATION.md
  #
  # schedule:
  #   - cron: '5 6 * * *'
  #   - cron: '0,30 * * * *'
```

**Change to:**

```yaml
on:
  schedule:
    # Scheduler: 6:05 UTC = 7:05 Paris
    - cron: '5 6 * * *'
    # Executor: Every 30 minutes
    - cron: '0,30 * * * *'
```

### DM Followup (`.github/workflows/dm-followup.yml`)

Find this block (around line 3-10):

```yaml
on:
  # ⚠️ PAUSED 2026-01-29 — Instagram account blocked
  # ...
  # schedule:
  #   - cron: '15 * * * *'
```

**Change to:**

```yaml
on:
  schedule:
    - cron: '15 * * * *'
```

### Commit and push

```bash
git add .github/workflows/
git commit -m "chore(instagram): reactivate automations after account recovery"
git push
```

---

## Step 3: Reconfigure ManyChat (if needed)

1. Log into ManyChat dashboard
2. Go to **Automation** > **Flows**
3. Re-enable:
   - DM Response flow (triggers on incoming DM)
   - Comment Reply flow (triggers on comments)
   - Story Reply flow (triggers on story mentions)
4. Verify webhook URLs point to:
   - DM: `https://ig-influencer.vercel.app/api/dm/webhook`
   - Comments: `https://ig-influencer.vercel.app/api/comment/reply`

---

## Step 4: Test Before Full Activation

### Manual test for Content Brain

```bash
# Trigger scheduler manually (dry run)
gh workflow run content-brain.yml -f action=scheduler -f character=elena

# Trigger executor manually (dry run)
gh workflow run content-brain.yml -f action=executor -f character=elena -f dry_run=true
```

### Manual test for DM webhook

Send a test DM to the account and check:
1. Vercel logs show the webhook was called
2. Response includes `should_send: true`
3. Claude generates appropriate response

---

## Step 5: Update Documentation

After reactivation, update `features/instagram/README.md`:

```markdown
| **DM** | 🟢 Stable | ManyChat + Claude AI funnel | [→](./dm/) |
| **Content Brain** | 🟢 Stable | Scheduling, prompts, posting | [→](./content-brain/) |
| **Comments** | 🟢 Stable | Auto-reply via ManyChat | [→](./comments/) |
```

Remove the warning banner.

---

## Recommendations to Avoid Future Blocks

### 1. Reduce DM Volume

**Before (caused block):**
- 925 contacts with 24/7 automated responses
- Linktree sent up to 3x per conversation
- Re-engagement every hour

**Recommended:**
- Limit to 50 new DM responses per day
- Send Linktree max 1x per conversation
- Re-engagement only every 48h (not hourly)

### 2. Increase Response Delays

**Before:**
- 15-35 second random delay
- 20 second cooldown between responses

**Recommended:**
- 2-5 minute random delay
- 5 minute minimum cooldown
- Add variation: sometimes 10-15 minutes

### 3. Humanize Messages

**Add to response generation:**
- Random typos (1 in 20 messages)
- Variable emoji usage
- Sentence length variation
- Occasional grammar mistakes

### 4. Remove Link Spam

**Before:**
- Linktree pushed in pitch stage
- Up to 3 sends per contact

**Recommended:**
- Only send link when explicitly asked
- Max 1 link per conversation ever
- Use "check my bio" instead of direct link

### 5. Monitor for Warnings

Set up alerts for:
- Instagram API errors (rate limits, blocks)
- Sudden drop in DM response rate
- ManyChat delivery failures

---

## What Was Paused (Reference)

| System | File | Schedule | Status |
|--------|------|----------|--------|
| Content Brain Scheduler | `content-brain.yml` | 6:05 UTC daily | PAUSED |
| Content Brain Executor | `content-brain.yml` | Every 30 min | PAUSED |
| DM Followup | `dm-followup.yml` | Every hour at :15 | PAUSED |
| DM Webhook | `/api/dm/webhook` | Real-time | PAUSED (kill switch) |
| Comment Reply | `/api/comment/reply` | Via ManyChat | PAUSED (ManyChat side) |

---

## Files Modified During Pause

- `.github/workflows/content-brain.yml` — Schedules commented
- `.github/workflows/dm-followup.yml` — Schedules commented
- `features/instagram/README.md` — Status updated to PAUSED
- Supabase `elena_settings.dm_system` — `paused: true`

---

## Contact

If you need help reactivating:
1. Check Vercel logs for webhook errors
2. Check GitHub Actions for workflow failures
3. Review ManyChat flow configuration
