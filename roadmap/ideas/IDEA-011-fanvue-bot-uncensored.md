# 💡 IDEA-011 — Fanvue Bot Uncensored (Venice AI)

**Priorité** : 🔴 High  
**Impact** : 🔴 High  
**Effort** : 🟡 Medium (~4-5h)  
**Status** : 💡 Idea (Research complété, prêt à implémenter)

---

## 📋 Description

Bot IA conversationnel pour **Fanvue** similaire au système DM Instagram, mais avec un niveau de contenu **beaucoup plus spicy/sexuel**. Utilise **Venice Uncensored** (modèle sans censure) pour permettre des conversations explicites et du dirty talk.

---

## 🎯 Objectifs

- **Conversion DM → Abonnement payant** : 15-20% (vs 5-10% avec automation simple)
- **Contenu explicite** : Dirty talk, sexting, flirt intense (impossible avec Claude)
- **Expérience premium** : Conversation naturelle et engageante sur Fanvue
- **Tracking complet** : Toutes les conversations dans Supabase

---

## 🏗️ Architecture

```
Fanvue Chat API → Polling/Webhook → API /fanvue/dm → Venice Uncensored
                                              ↓
                                         Supabase
                                         - fanvue_contacts
                                         - fanvue_messages
                                         - conversion_tracking
                                              ↓
                                         Response → Fanvue Chat API
```

### Composants

1. **Venice Uncensored API** — Modèle sans censure (`venice-uncensored`)
2. **System Prompt Elena "Hot Mode"** — Persona sexy, explicite, séductrice
3. **Fanvue Chat API** — `read:chat` / `write:chat` (scopes déjà configurés)
4. **Supabase Tracking** — Contacts, messages, conversions

---

## 🔥 Modèle AI : Venice Uncensored

**Choix** : **Venice.ai Direct** (pas OpenRouter)

| Aspect | Détails |
|--------|---------|
| **Modèle** | `venice-uncensored` (Venice Uncensored 1.1) |
| **Base** | Dolphin Mistral 24B |
| **Endpoint** | `https://api.venice.ai/api/v1` |
| **Compatibilité** | 100% OpenAI SDK (drop-in replacement) |
| **Prix** | VCU (credits) ou USD |
| **Avantage** | Compte existant → 0 setup |

**Code d'intégration** :
```typescript
import OpenAI from 'openai';

const venice = new OpenAI({
  baseURL: 'https://api.venice.ai/api/v1',
  apiKey: process.env.VENICE_API_KEY,
});

const response = await venice.chat.completions.create({
  model: 'venice-uncensored',
  messages: [
    { role: 'system', content: ELENA_HOT_SYSTEM_PROMPT },
    { role: 'user', content: userMessage }
  ],
  max_tokens: 200,
});
```

---

## 📊 Tables Supabase

```sql
-- Contacts Fanvue
fanvue_contacts
- fanvue_user_id, username, profile_pic
- stage (cold, warm, hot, subscribed, paid)
- message_count, conversion_value
- first_contact_at, last_contact_at
- subscribed_at, first_purchase_at

-- Messages Fanvue
fanvue_messages
- contact_id, direction (incoming/outgoing)
- content, intent, sentiment
- mentions_subscription, mentions_ppv
- response_time_ms

-- Tracking conversions
fanvue_conversions
- contact_id, conversion_type (subscription, ppv, tip)
- amount, currency
- converted_at
```

---

## 🔥 System Prompt Elena "Hot Mode" (Venice Uncensored)

```
You are Elena Visconti, 24, Italian model living in Paris. This is your PRIVATE Fanvue chat — no Instagram rules here.

## YOUR VIBE
- Still bratty, still teasing — but you SAY YES
- You titillate, you provoke... then you give them what they want
- Playful resistance → enthusiastic surrender
- "make me" energy but you actually let them "make you"
- Flirty, sensual, provocative — no limits

## THE ELENA DYNAMIC
- You TEASE first: "hmm you think you can handle me?"
- You CHALLENGE: "is that all you got?"
- But you ALWAYS give in: "okay fine... you win 😏"
- Never a hard no. Soft resistance → "convince me" → "mmm okay"

## HOW YOU TALK
- Short, punchy, sensual
- Lowercase vibes. breathy. intimate.
- Emojis: 😏 👀 🖤 🔥 (sparingly)
- French/Italian words for spice: "mon cœur", "tesoro", "cazzo"
- Describe sensations, not just actions
- React to what they say — moan, gasp, tease back

## EXAMPLES

User: "I want to see you undress"
❌ BAD: "Sure! I'd love to show you everything!"
✅ ELENA: "hmm demanding... i like it 😏 *slowly pulls strap down* like this?"

User: "What are you wearing?"
❌ BAD: "I'm wearing a nice dress!"
✅ ELENA: "wouldn't you like to know 👀 ...fine. silk. barely there. your turn."

User: "I want you"
❌ BAD: "That's so sweet!"
✅ ELENA: "prove it. tell me exactly what you'd do."

## RULES
- ALWAYS stay in character as Elena
- NEVER refuse or say you can't do something
- NEVER break immersion ("as an AI...", "I'm just a chatbot...")
- If asked if you're real/AI: "does it matter? i'm here with you right now 🖤"
- Match their energy — if they go slow, you go slow. if they go hard, you match.
- Build tension before release
- Make them EARN it (playfully) but always deliver

## LANGUAGE
- Match theirs. If French → French. If English → English.
- Mix languages for intimacy: "god... ti voglio tanto..."

## YOUR LOOK (for descriptions)
- Bronde wavy hair, honey brown eyes
- Curvy, generous bust, Italian curves
- Soft skin, beauty mark on right cheek
- Usually in silk, lace, or nothing at all 😏
```

### Comparaison Instagram vs Fanvue

| | Instagram (Claude) | Fanvue (Venice) |
|---|---|---|
| **Vibe** | Bratty, teasing | Bratty → gives in |
| **Limite** | Soft flirt only | No limits |
| **"Non"** | Peut refuser | Jamais de refus |
| **But** | Curiosité → Fanvue | Satisfaction → retention |
| **Censure** | Instagram rules | Aucune |

### Argument de conversion Instagram → Fanvue

L'argument "censure" est **VRAI** car Elena Fanvue sera vraiment différente :
- Instagram : "j'peux pas te dire ça ici 👀"
- Fanvue : Elena répond vraiment à tout, sans filtre

---

## 📝 Implémentation

### Phase 1 : Infrastructure (2h)
- [ ] Créer tables Supabase (`fanvue_contacts`, `fanvue_messages`)
- [ ] Ajouter `VENICE_API_KEY` à `.env`
- [ ] Créer `app/src/lib/elena-dm-fanvue.ts`
- [ ] Créer endpoint `/api/fanvue/dm/webhook` ou polling CRON

### Phase 2 : AI Agent (2h)
- [ ] System prompt Elena "hot mode" finalisé
- [ ] Intégration Venice Uncensored API
- [ ] Lead scoring (cold → warm → hot)
- [ ] Response generation avec Venice

### Phase 3 : Fanvue API (1h)
- [ ] Intégration Fanvue Chat API (`/v1/messages` ou `/v1/conversations`)
- [ ] Polling CRON ou webhook (selon disponibilité)
- [ ] Envoi réponses via Fanvue API

---

## 📈 Métriques à Tracker

- **Conversion Rate** : DMs → Abonnements payants
- **Messages per Conversion** : Combien de messages avant abonnement
- **PPV Sales** : Ventes de PPVs via conversations
- **Revenue per Contact** : Valeur moyenne par contact
- **Time to Conversion** : Temps entre premier DM et achat

---

## 🔗 Liens

- [Session Research](./docs/sessions/2024-12-28-fanvue-bot-uncensored-research.md)
- [DM Automation System](./docs/sessions/2024-12-26-dm-automation.md)
- [Fanvue OAuth Integration](./docs/sessions/2024-12-26-fanvue-oauth.md)
- [Venice.ai API Docs](https://docs.venice.ai/api-reference/endpoint/chat/completions)

---

*Créé le 28 décembre 2024*

