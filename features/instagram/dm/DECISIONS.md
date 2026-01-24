# Decisions — DM System

Chronological log of decisions made and why.

---

## 2026-01-20: Remove hard 12-word limit

**Context**: Elena responses were robotic and unhelpful. Couldn't answer questions properly.

**Options considered**:
1. Keep 12 words strict (current) → Robotic, frustrating
2. Remove limit entirely → Risk of long rambling
3. Soft limit: "be concise" → Natural but controlled

**Decision**: Soft limit with "say what you need with MINIMUM words"

**Reason**: 
- Real humans don't count words
- Some questions need 20+ words to answer
- Validation changed: 15 max → 50 max
- max_tokens: 50 → 150

**Result**: More natural conversations, user questions get answered

---

## 2026-01-20: Use full conversation history (not just last message)

**Context**: Elena kept asking questions users already answered ("tu fais quoi?" after they explained their job)

**Options considered**:
1. Keep "only use last message" (current) → Amnesia, frustrating
2. Use full history → More context, smarter responses

**Decision**: Use full history + extract user profile

**Reason**: 
- The code already passed history but told AI to ignore it
- Profile extraction: name, location, job, interests, sports
- Never ask what user already answered

**Result**: Elena remembers context, references past info naturally

---

## 2026-01-20: Max 3 Fanvue links per conversation

**Context**: Elena was spamming the Fanvue link repeatedly

**Options considered**:
1. No limit → Spam, annoying
2. 1 link only → Too restrictive
3. 3 links max, then reference → Balanced

**Decision**: 3 links max, then reference

**Reason**: 
- First send: natural pitch
- Second send: if they ask again
- Third send: last chance
- After: "tu l'as toujours le lien? 🖤"

**Result**: Less spam, more natural conversations

---

## 2026-01-19: Replace "hey 🖤" fallback with smart fallbacks

**Context**: When API failed, Elena responded "hey 🖤" repeatedly, causing loops

**Options considered**:
1. Keep "hey 🖤" → Loops, bad UX
2. Empty response → Weird silence
3. Smart fallbacks: 12 varied questions → Natural recovery

**Decision**: 12 varied fallback questions (FR/EN)

**Reason**:
- "tu viens d'où? 🖤"
- "where are you from? 👀"
- "what's your day looking like? 😊"
- Keeps conversation going naturally

**Result**: No more loops, API failures are invisible to users

---

## 2026-01-19: Remove English-only default language

**Context**: Elena asked users to speak English even when they wrote in French

**Options considered**:
1. Keep `default: 'en'` → Bad multilingual UX
2. Remove default, detect real-time → Natural language matching

**Decision**: Remove default, mirror user's language in real-time

**Reason**:
- Detect language of current message
- Use detected language in priority
- Never ask user to switch languages

**Result**: Natural multilingual conversations

---

## 2026-01-19: Pitch at message 10 (not 35)

**Context**: Some users had 200-300+ messages without ever receiving a pitch

**Options considered**:
1. Keep msg 35 pitch start → Too late, wasted effort
2. Pitch at msg 10 → Faster conversion attempt
3. Dynamic based on engagement → Complex

**Decision**: Start closing at message 10 for HOT contacts

**Reason**:
- `CLOSING_STARTS_AT[hot]`: 12 → 10
- `MESSAGE_CAPS[hot]`: 35 → 20 (force pitch before cap)
- Users who chat 300+ msgs without converting are time-wasters

**Result**: Faster pitch delivery, less wasted messages

---

## 2026-01-19: Limit post-pitch messages to 5

**Context**: Average 34.8 messages exchanged AFTER the pitch (waste)

**Options considered**:
1. Keep unlimited → Wasted resources
2. Hard stop after pitch → Rude
3. 5 messages max → Handle objections gracefully, then exit

**Decision**: `MESSAGE_CAPS[pitched]`: 10 → 5

**Reason**:
- Enough to handle "c'est quoi Fanvue?" objection
- Natural exit after objection handling
- Users who don't click after 5 msgs won't click after 50

**Result**: Cleaner exits, less wasted computation

---

## 2026-01-19: In-memory lock for race condition

**Context**: ManyChat sometimes sent 2 webhooks simultaneously → same message sent 2-3x

**Options considered**:
1. Database lock → Slow, complex
2. In-memory lock with timeout → Fast, simple
3. Accept duplicates → Bad UX

**Decision**: In-memory lock with 5s timeout

**Reason**:
- Simple Map with conversation_id as key
- Check lock before processing
- Release after response sent
- Timeout prevents deadlocks

**Result**: No more duplicate messages

---

## 2026-01-18: Fuzzy matching for attribution

**Context**: Need to track which IG DM leads convert to Fanvue

**Options considered**:
1. Exact username match only → Miss variations
2. Fuzzy match + timing → Catch more
3. Manual tracking → Not scalable

**Decision**: 3-level attribution: exact → fuzzy → timing

**Reason**:
- Level 1: Exact IG username = Fanvue handle
- Level 2: Similar usernames (Levenshtein distance)
- Level 3: Timing-based (conversion within 24h of pitch)

**Result**: Attribution system ready, waiting for conversions

---

## 2025-01-03: Response validator for anti-hallucination

**Context**: Claude sometimes hallucinated links, prices, or said "as an AI"

**Options considered**:
1. Trust Claude → Risk hallucinations
2. Validate every response → Safer
3. Regenerate if invalid (max 3 tries) → Best of both

**Decision**: Validate + regenerate up to 3 times

**Reason**:
- Check for blocked phrases: "as an AI", "je suis une IA"
- Check for fake links
- Check language matches
- Regenerate with stricter prompt if invalid

**Result**: No more hallucinations reaching users

---

## 2026-01-23: Language clarification on switch or unknown

**Context**: Users sometimes switch languages mid-conversation or write in languages we don't detect (Arabic, Turkish, etc.)

**Options considered**:
1. Ignore and keep responding in original language → Frustrating for user
2. Silently switch to detected language → Confusing, might be wrong
3. Ask the user what language they speak → Explicit, user-friendly

**Decision**: Ask for language preference when:
- User switches language mid-conversation (after we had confidence in one)
- We can't detect their language after 5+ messages (unknown language)

**Implementation**:
- `LanguageUpdateResult` type with `needsClarification` flag
- `LANGUAGE_CLARIFICATION_MESSAGES` for switch/unknown cases
- If unknown language: "sorry i don't understand your language 😅 i speak english and french 🖤"
- If language switch: "hey, what language do you speak? i thought you were speaking [X] 🤔"
- Uses negative `language_confidence` as flag to prevent asking repeatedly (-1 = asked about unknown, -2 = asked about switch)

**Result**: Better UX for non-supported languages, clearer communication

---

## 2026-01-23: Gleeful Wife Persona Sync

**Context**: Instagram bio and content were updated to "Gleeful Luxury Wife" persona (married to rich absent husband, enjoying freedom). DM system still used old "mannequin/model" persona, creating inconsistency.

**Options considered**:
1. Keep old persona → Inconsistent, confusing for users who see bio vs DMs
2. Update DM to match new persona → Consistent experience, better conversion potential

**Decision**: Full persona sync to "Gleeful Luxury Wife"

**Changes**:
- System prompts: "model in Paris" → "married to wealthy older man, enjoying freedom"
- Personality mix: old (45% warm, 25% playful, 20% curious, 10% mysterious) → new (25% free, 25% gleeful, 20% warm, 20% flirty, 10% complice)
- Intent strategies: Updated `curious`, `greeting`, `compliment`, `flirt`, `wants_more`, `asking_link`, `sexual` with persona elements
- Exit messages: 5 variations → 15+ variations with persona flavor (spa, shopping, driver, brunch, etc.)
- Pitch templates: More emotional, using "what I do when he's away" angle
- Personality modes: Updated descriptions to reflect "gleeful wife" psychology

**Reason**:
- Consistency between bio/captions and DMs
- More emotional connection → better conversion potential
- Clear character = more engaging conversations
- "Married" status as natural excuse for refusing calls/meetings

**Result**: DM persona now aligned with Instagram content. Monitoring for conversion improvement.
