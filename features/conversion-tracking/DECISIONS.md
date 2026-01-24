# Decisions — Conversion Tracking

Chronological log of decisions made and why.

---

## 2026-01-18: 3-level attribution (exact → fuzzy → timing)

**Context**: Need to attribute IG DM leads to Fanvue conversions

**Options considered**:
1. Exact match only → Miss variations (@john.doe vs johndoe)
2. Fuzzy match only → False positives possible
3. 3-level system → Best of both worlds

**Decision**: 3-level attribution

**Levels**:
1. **Exact**: IG username = Fanvue handle
2. **Fuzzy**: Levenshtein distance for similar usernames
3. **Timing**: Conversion within 24h of pitch

**Reason**:
- Catches exact matches first (most reliable)
- Fuzzy catches variations (john.doe → johndoe)
- Timing as fallback for completely different usernames

**Result**: System ready, waiting for real data

---

## 2026-01-18: Combined tracking link (/fv-2 + free trial)

**Context**: Need to track clicks AND provide free trial

**Options considered**:
1. Free trial link only → No tracking
2. Tracking link only → No free trial benefit
3. Combined → Both

**Decision**: Combined link: `/fv-2?free_trial={uuid}`

**Reason**:
- Fanvue dashboard tracks clicks on `/fv-2`
- Our system tracks conversions via webhook
- User gets 7-day free trial

**Result**: Double tracking enabled

---

## 2026-01-18: Fanvue webhook for real-time attribution

**Context**: Need to know when IG leads convert

**Options considered**:
1. Manual checking → Not scalable
2. Polling Fanvue API → Rate limits, delay
3. Webhook → Real-time, reliable

**Decision**: Configure Fanvue webhook

**Events**:
- `follower.created` — Free account created
- `subscriber.created` — Paid subscription

**Reason**: Real-time notification, no polling needed

**Result**: Webhook configured in Fanvue Developer Portal
