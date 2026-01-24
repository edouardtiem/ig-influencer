# Decisions — Fanvue DM

Chronological log of decisions made and why.

---

## 2026-01-15: Venice AI for uncensored DM bot

**Context**: Claude refuses explicit content in Fanvue DMs

**Options considered**:
1. Claude with jailbreak prompts → Unreliable
2. Venice AI (uncensored) → Reliable explicit content
3. Grok → Less explicit

**Decision**: Use Venice AI for Fanvue DM bot

**Reason**:
- Explicitly designed for uncensored content
- Reliable explicit responses
- Good at roleplay/flirting

**Result**: Fanvue DM bot can handle explicit conversations

---

## 2026-01-15: Memory system for conversations

**Context**: Bot had no memory of previous conversations

**Options considered**:
1. No memory → Every conversation starts fresh
2. Supabase memory → Track conversation history

**Decision**: Store conversation history in Supabase

**Reason**:
- Remember what user told Elena
- Continue conversations naturally
- Extract useful info (preferences)

**Result**: More natural, continuous conversations

---

## 2026-01-19: Language consistency fix

**Context**: Bot sometimes switched languages mid-conversation

**Options considered**:
1. Force one language → Bad UX
2. Mirror user's language → Natural

**Decision**: Detect and mirror user's language

**Reason**: Same as Instagram DM system

**Result**: Consistent language throughout conversation
