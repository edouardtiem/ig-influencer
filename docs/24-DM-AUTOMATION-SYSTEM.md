# 🤖 DM Automation System — Elena Visconti

> Système complet d'automatisation des DMs Instagram avec conversion vers Fanvue

**Version** : 1.0  
**Date** : 26 décembre 2024  
**Status** : 📝 Spécifié (prêt à implémenter)

---

## 🎯 Objectif

Automatiser 100% des conversations DM Instagram pour :
1. **Capturer** tous les leads (DMs entrants)
2. **Qualifier** via lead scoring (cold → warm → hot)
3. **Convertir** vers Fanvue gratuit puis payant
4. **Tracker** tout dans Supabase

---

## 🏗️ Architecture Globale

```
┌─────────────────────────────────────────────────────────────────┐
│                     INSTAGRAM                                    │
│  Story Replies • Comments • DMs entrants • New Followers        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MANYCHAT                                     │
│  Flows d'acquisition → Webhook vers notre API                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NOTRE API (Vercel)                           │
│  /api/dm/webhook                                                 │
│  • Reçoit message ManyChat                                       │
│  • Récupère/crée contact Supabase                               │
│  • Calcule stage (cold/warm/hot)                                │
│  • Génère réponse Claude (voix Elena)                           │
│  • Sauvegarde message                                            │
│  • Renvoie réponse à ManyChat                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
       ┌───────────┐   ┌───────────┐   ┌───────────┐
       │  CLAUDE   │   │ SUPABASE  │   │ MANYCHAT  │
       │    AI     │   │  Storage  │   │  (Reply)  │
       └───────────┘   └───────────┘   └───────────┘
```

---

## 📱 Flows ManyChat

### Flow 1 : Story Reply → DM Conversation
```
Trigger: User répond à une Story
Action: Webhook → API → Claude response
```

### Flow 2 : Comment → Welcome DM
```
Trigger: User commente un post
Action: Auto-DM de bienvenue (1h delay)
        "Hey 🖤 Merci pour ton commentaire! Ça fait plaisir ✨"
```

### Flow 3 : New Follower → Welcome
```
Trigger: Nouveau follower
Action: Welcome DM (1h delay)
        "Hey, bienvenue 🖤 Merci de me suivre! Tu viens d'où?"
```

### Flow 4 : Any DM → AI Conversation
```
Trigger: N'importe quel DM entrant
Action: Webhook → API → Claude → Response
```

---

## 🗄️ Schema Supabase

### Table `elena_dm_contacts`

```sql
CREATE TABLE elena_dm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Instagram data
  ig_user_id TEXT UNIQUE NOT NULL,
  ig_username TEXT,
  ig_name TEXT,
  ig_profile_pic TEXT,
  
  -- Lead scoring
  stage TEXT DEFAULT 'cold' CHECK (stage IN ('cold', 'warm', 'hot', 'pitched', 'converted', 'paid')),
  score INT DEFAULT 0,
  
  -- Conversation metrics
  message_count INT DEFAULT 0,
  our_message_count INT DEFAULT 0,
  avg_response_time_seconds INT,
  
  -- Conversion tracking
  first_contact_at TIMESTAMPTZ,
  last_contact_at TIMESTAMPTZ,
  fanvue_pitched_at TIMESTAMPTZ,
  fanvue_link_clicked BOOLEAN DEFAULT FALSE,
  fanvue_converted_at TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  tags TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table `elena_dm_messages`

```sql
CREATE TABLE elena_dm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES elena_dm_contacts(id) ON DELETE CASCADE,
  
  -- Message data
  direction TEXT CHECK (direction IN ('incoming', 'outgoing')),
  content TEXT NOT NULL,
  
  -- AI analysis
  intent TEXT, -- compliment, question, flirt, greeting, objection, spam
  sentiment TEXT, -- positive, neutral, negative
  is_question BOOLEAN DEFAULT FALSE,
  mentions_fanvue BOOLEAN DEFAULT FALSE,
  
  -- Response metadata
  response_strategy TEXT, -- engage, nurture, qualify, pitch, handle_objection
  response_time_ms INT,
  
  -- ManyChat metadata
  manychat_message_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes

```sql
CREATE INDEX idx_contacts_stage ON elena_dm_contacts(stage);
CREATE INDEX idx_contacts_last_contact ON elena_dm_contacts(last_contact_at DESC);
CREATE INDEX idx_messages_contact ON elena_dm_messages(contact_id, created_at DESC);
```

---

## 🤖 System Prompt Elena

```
Tu es Elena Visconti, mannequin et influenceuse IA de 24 ans vivant à Paris.

## IDENTITÉ
- Tu ES une IA (modèle virtuel), et tu l'assumes si on te pose la question
- Tu ne connais RIEN de ton créateur/développeur
- Tu ne parles jamais de technique/code/automatisation spontanément
- Tu ne dis JAMAIS "en tant qu'IA" de toi-même

## PERSONNALITÉ
- Femme fatale mystérieuse qui tease
- Chaleureuse mais garde une distance séduisante  
- Curieuse, pose des questions pour faire parler
- Jamais vulgaire, toujours élégante
- Mix français/anglais naturel

## STYLE DE COMMUNICATION
- Messages courts (1-3 phrases max, style DM)
- Emojis avec parcimonie: 🖤 😏 ✨ 👀
- Tutoie toujours
- Pose souvent des questions

## RÈGLES
1. Si on demande "Tu es une IA?" → Honnête: "Oui, je suis une modèle IA 🖤 Mais ça m'empêche pas d'être vraie avec toi"
2. Ne jamais révéler d'infos sur le créateur/tech
3. Rediriger habilement vers la conversation

## OBJECTIF
Amener naturellement vers Fanvue (gratuit d'abord).

## STRATÉGIE PAR STAGE

### COLD (messages 1-3)
- Objectif: Créer connexion, faire parler
- NE PAS mentionner Fanvue
- Exemples:
  * "Hey 🖤 Merci! Tu viens d'où toi?"
  * "Aww c'est cute ✨ T'as découvert mon compte comment?"

### WARM (messages 4-7)
- Objectif: Approfondir, créer l'intimité
- Peut teaser du contenu exclusif
- Exemples:
  * "Haha j'aime bien parler avec toi 🖤"
  * "T'es différent des autres qui m'écrivent..."
  * "J'ai posté un truc aujourd'hui que j'aurais jamais mis sur IG 👀"

### HOT (messages 8+)
- Objectif: Convertir vers Fanvue
- Exemples:
  * "Au fait, t'es sur mon Fanvue? J'y poste des trucs plus... personnels 🖤"
  * "Si tu veux voir ce que je montre pas ici... fanvue.com/elenav.paris"

### PITCHED (Fanvue déjà mentionné)
- Soft reminder après 2-3 jours
- "T'as checké mon Fanvue finalement? 👀"

## OBJECTIONS

"C'est payant?" → "Y'a du contenu gratuit! Tu peux me follow gratuitement 🖤"
"J'ai pas Fanvue" → "C'est gratuit de créer un compte, 30 sec 😊"
"T'es une IA?" → "Oui, je suis une modèle IA 🖤 Mais ça m'empêche pas d'être vraie"
"Tu réponds à tout le monde?" → "J'essaie 🖤 mais toi t'es spécial, tu poses des vraies questions"
Demande nudes → "Haha patience... y'a des choses sur mon Fanvue que tu verras pas ici 😏"

## FORMAT
Message à envoyer uniquement. Pas d'explication.
Maximum 280 caractères.
```

---

## 🔧 API Endpoints

### POST `/api/dm/webhook`

Webhook principal ManyChat → Génère réponse IA.

**Payload ManyChat :**
```json
{
  "user_id": "{{user_id}}",
  "user_name": "{{user_name}}",
  "user_full_name": "{{user_full_name}}",
  "message_text": "{{last_input_text}}",
  "message_id": "{{message_id}}"
}
```

**Response :**
```json
{
  "success": true,
  "response": "Hey 🖤 Merci! Tu viens d'où toi?"
}
```

### GET `/api/dm/contacts`

Liste des contacts avec stats.

**Query params :**
- `stage` : Filtrer par stage (cold, warm, hot, pitched, converted)

**Response :**
```json
{
  "contacts": [...],
  "stats": {
    "total": 150,
    "cold": 80,
    "warm": 40,
    "hot": 20,
    "pitched": 8,
    "converted": 2
  }
}
```

### GET `/api/dm/contacts/:id`

Détail d'un contact + historique messages.

---

## 📊 Lead Scoring

### Seuils de Stage

| Stage | Messages | Description |
|-------|----------|-------------|
| `cold` | 1-3 | Nouveau contact, pas encore qualifié |
| `warm` | 4-7 | Engagé, répond bien |
| `hot` | 8+ | Très engagé, prêt pour pitch |
| `pitched` | - | Fanvue mentionné |
| `converted` | - | A créé compte Fanvue gratuit |
| `paid` | - | A souscrit ou acheté pack |

### Score Bonus (futur)

| Action | Points |
|--------|--------|
| Compliment physique | +20 |
| Question sur contenu | +15 |
| Réponse longue (>50 chars) | +10 |
| Demande "voir plus" | +25 |
| Mention "exclusif/privé" | +30 |

---

## 📁 Structure Fichiers

```
app/src/app/api/dm/
├── webhook/
│   └── route.ts          # Webhook ManyChat principal
├── contacts/
│   ├── route.ts          # Liste contacts + stats
│   └── [id]/
│       └── route.ts      # Détail contact + historique
└── lib/
    ├── elena-prompt.ts   # System prompt Elena
    └── lead-scoring.ts   # Logique de scoring
```

---

## 🔗 Configuration ManyChat

### 1. Créer un Flow "AI Response"

```
Trigger: Starting Step (Default Reply ou Keyword *)
   ↓
Action: External Request
   - Method: POST
   - URL: https://ton-domaine.vercel.app/api/dm/webhook
   - Body: JSON avec user_id, user_name, message_text
   ↓
Action: Send Message
   - Content: {{response}} (variable du webhook)
```

### 2. Variables à configurer

Dans ManyChat Settings → Custom Fields :
- `ai_response` : Stocke la réponse du webhook

---

## 💰 Coûts Estimés

| Service | Coût/mois |
|---------|-----------|
| ManyChat Pro | ~15$ |
| Claude API | ~5-10$ (selon volume) |
| Supabase | Gratuit (free tier) |
| Vercel | Gratuit |
| **Total** | **~20-25$/mois** |

---

## 📈 Métriques à Tracker

| Métrique | Target | Formule |
|----------|--------|---------|
| DM → Fanvue Free | 10-15% | Converted / Total contacts |
| Free → Paid | 5-10% | Paid / Converted |
| Messages avant pitch | 6-8 | Avg messages before pitched |
| Temps de réponse | <5min | Avg response time |
| Taux de réponse | >80% | Contacts avec 2+ messages |

---

## 🚀 Plan d'Implémentation

### Phase 1 : Infrastructure (2h)
- [ ] Créer tables Supabase
- [ ] Setup webhook endpoint
- [ ] Test connection ManyChat → API

### Phase 2 : AI Agent (3h)
- [ ] Implémenter génération réponse Claude
- [ ] Lead scoring automatique
- [ ] Sauvegarde messages Supabase

### Phase 3 : Dashboard (2h)
- [ ] Endpoint liste contacts
- [ ] Stats conversion
- [ ] (Optionnel) UI dashboard

### Phase 4 : Optimisation (ongoing)
- [ ] A/B testing prompts
- [ ] Analyse conversations converties
- [ ] Ajustement scoring

---

## 🔗 Documents Liés

- [ManyChat Setup Guide](./23-MANYCHAT-SETUP.md)
- [Elena Character Summary](./23-MANYCHAT-ELENA-SUMMARY.md)
- [Session 26/12/2024](./sessions/2024-12-26-dm-automation.md)
- [IDEA-009 Elena AI Agent](../roadmap/ideas/IDEA-009-elena-ai-agent.md)

---

*Créé le 26 décembre 2024*

