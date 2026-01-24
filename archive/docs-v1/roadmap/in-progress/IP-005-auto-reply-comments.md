# 💬 IP-005 — Auto-Reply Comments avec Claude

> Automatisation des réponses aux commentaires sur les posts Instagram via ManyChat + Claude

**Date** : 15 janvier 2025  
**Status** : ✅ Backend terminé, ManyChat AI configuré  
**Impact** : 🟡 Medium  
**Effort** : 🟡 Medium (2h backend + ManyChat AI setup)  
**Priorité** : 🔴 High

---

## 🎯 Objectif

Pour chaque commentaire reçu sur un post Instagram :
1. Attendre 5 minutes (évite l'aspect "bot")
2. Générer une réponse pertinente avec Claude
3. Poster la réponse automatiquement

---

## 🏗️ Architecture — 2 Options

### Option 1 : ManyChat natif (Plus simple)

ManyChat a une intégration native avec Claude depuis fin 2024.

```
Trigger: "L'utilisateur commente votre publication ou reel"
    ↓
Action: Délai (5 minutes)
    ↓
Action: Claude AI → Génère réponse
    ↓
Action: Reply comment (réponse publique) ou Send DM (message privé)
```

**Avantages :**
- Setup rapide dans l'interface ManyChat
- Pas de code à écrire
- Délai de 5 min facile à configurer

**Inconvénients :**
- Moins de personnalisation du prompt Elena
- Pas de logs dans Supabase
- Coût additionnel ManyChat AI (selon plan)

---

### Option 2 : Webhook ManyChat → Notre API (Plus de contrôle)

Comme le système DM existant (`/api/dm/webhook`), mais pour les commentaires.

```
Trigger: Nouveau commentaire sur post
    ↓
Action: Délai 5 minutes
    ↓
Action: Webhook → POST /api/comment/reply
    ↓
Notre API: 
  - Récupère le commentaire + context
  - Génère réponse Elena via Claude
  - Log dans Supabase
  - Retourne la réponse
    ↓
Action: ManyChat poste la réponse comme reply
```

**Avantages :**
- Utilise le même prompt Elena peaufiné
- Tracking dans Supabase (analytics)
- Contrôle total sur la logique
- Cohérent avec architecture existante

**Inconvénients :**
- Nécessite développement (~2-3h)

---

## 📝 Configuration ManyChat (Option 2)

### 1. Automation Comment Reply

```
Trigger: "User comments on your post or reel"
  → Toutes les publications (ou sélection spécifique)
  
Action 1: Smart Delay
  → 5 minutes

Action 2: External Request (webhook)
  → POST https://ig-influencer.vercel.app/api/comment/reply
  → Headers: Content-Type: application/json
  → Body JSON:
    {
      "comment_id": "{{comment_id}}",
      "comment_text": "{{comment_text}}",
      "username": "{{username}}",
      "user_id": "{{user_id}}",
      "post_id": "{{post_id}}",
      "post_caption": "{{post_caption}}"
    }

Action 3: Reply to Comment
  → Utiliser la variable {{response}} retournée par le webhook
```

### 2. Variables ManyChat nécessaires

| Variable | Description |
|----------|-------------|
| `comment_id` | ID unique du commentaire IG |
| `comment_text` | Texte du commentaire |
| `username` | @username de l'utilisateur |
| `user_id` | ID Instagram de l'utilisateur |
| `post_id` | ID du post commenté |
| `post_caption` | Caption du post (pour contexte) |

---

## 🔧 Implémentation API (Option 2)

### Endpoint : `POST /api/comment/reply`

```typescript
// app/src/app/api/comment/reply/route.ts

interface CommentReplyRequest {
  comment_id: string;
  comment_text: string;
  username: string;
  user_id: string;
  post_id: string;
  post_caption?: string;
}

interface CommentReplyResponse {
  success: boolean;
  response: string;
  error?: string;
}
```

### Prompt Claude (adapté pour commentaires)

```
Tu es Elena Visconti, créatrice de contenu lifestyle et mode.

Tu réponds à un commentaire sur ton post Instagram.

RÈGLES:
- Réponse courte (1-2 phrases max, style commentaire)
- Chaleureux mais pas trop familier
- Peut inclure 1 emoji max (🖤 ✨ 😊)
- Tutoie toujours
- Si compliment → remercie + rebondit avec question ou tease
- Si question → réponds brièvement
- Si critique → reste gracieuse, ne t'énerve jamais
- Si spam/pub → ne réponds pas (retourne skip: true)

CONTEXTE POST:
Caption: {{post_caption}}

COMMENTAIRE DE @{{username}}:
"{{comment_text}}"

Réponds UNIQUEMENT avec le texte de ta réponse, rien d'autre.
```

### Table Supabase (optionnel)

```sql
CREATE TABLE elena_comment_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Instagram data
  comment_id TEXT UNIQUE NOT NULL,
  post_id TEXT NOT NULL,
  username TEXT NOT NULL,
  user_id TEXT,
  
  -- Content
  original_comment TEXT NOT NULL,
  reply_text TEXT NOT NULL,
  
  -- Metadata
  skipped BOOLEAN DEFAULT FALSE,
  skip_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎯 Stratégies de Réponse

| Type de commentaire | Stratégie | Exemple |
|---------------------|-----------|---------|
| Compliment physique | Remercie + tease | "Merci 🖤 Attends de voir demain..." |
| Compliment photo | Remercie + credit | "C'était un sunset parfait ce jour-là ✨" |
| Question simple | Réponds + engage | "Paris ! Tu y es déjà allée ?" |
| Question personnelle | Tease mystère | "Peut-être... tu devines ? 😏" |
| Emoji seul (🔥❤️) | Emoji back | "🖤" ou "✨" |
| Spam/Pub | Skip | Ne pas répondre |
| Critique | Gracieuse | "Chacun ses goûts 😊" |

---

## ⚠️ Points d'attention

### Rate Limiting
- Instagram peut flag si trop de réponses automatiques
- **Solution** : Délai aléatoire 5-10 min + max 20 replies/jour

### Détection spam
- Ne pas répondre aux commentaires spam/pub
- **Solution** : Filtrage dans l'API (keywords, liens, etc.)

### Variété
- Éviter les réponses trop similaires
- **Solution** : Claude génère naturellement des variations

### Compliance Instagram
- ManyChat est autorisé par Instagram Business
- Respecter les Guidelines IG sur l'automation

---

## 💰 Coûts Estimés

| Service | Coût mensuel |
|---------|--------------|
| ManyChat Pro | Inclus (déjà actif) |
| Claude API | ~1-2$ (volume commentaires) |
| **Total additionnel** | **~1-2$/mois** |

---

## 📊 Métriques à Tracker

| Métrique | Target |
|----------|--------|
| Temps de réponse moyen | < 10 min |
| Taux de réponse | > 80% (hors spam) |
| Engagement rate | +10-20% attendu |
| Replies par jour | 10-30 |

---

## ✅ Implémentation Réalisée

### Phase 1 : Backend API ✅
- [x] Créé `/api/comment/reply/route.ts`
- [x] Implémenté génération réponse Claude Sonnet
- [x] Ajouté filtrage spam (patterns: liens, crypto, promotions)
- [x] Validation réponses (max 15 mots, pas Fanvue)
- [x] Prévention doublons (check `comment_id`)
- [x] Logging Supabase (table `elena_comment_replies`)

### Phase 2 : Base de données ✅
- [x] Migration SQL créée : `008_elena_comment_replies.sql`
- [x] Table avec indexes pour performance
- [x] Tracking replies envoyées/skippées

### Phase 3 : Tests ✅
- [x] Test endpoint local : OK
- [x] Test réponse anglaise : "thanks babe 🖤"
- [x] Test réponse française : "paris! et toi? 🖤"
- [x] Test emoji-only : "🖤"
- [x] Test spam detection : skip=true ✅

### Phase 4 : ManyChat Setup ✅
- [x] Guide ManyChat fourni
- [x] Configuration webhook expliquée
- [x] Variables ManyChat mappées
- [x] **Décision finale** : Utilisation ManyChat AI natif (plus simple)

---

## 🚧 Décision Finale

**ManyChat AI utilisé** au lieu du webhook custom car :
- ✅ Plus simple à configurer
- ✅ Intégration Claude native ManyChat
- ✅ Pas besoin de délai 5min (géré automatiquement)
- ✅ Interface ManyChat plus intuitive

**Backend disponible** si besoin futur :
- Endpoint fonctionnel et testé : `/api/comment/reply`
- Peut être utilisé pour d'autres cas d'usage
- Table Supabase prête pour analytics

---

## 🐛 Limitations Découvertes

1. **ManyChat Public Reply** :
   - Se configure uniquement au trigger level
   - Ne peut pas utiliser variables dynamiques après webhook
   - Réponses statiques ou variables simples seulement

2. **Timing** :
   - Public Reply se déclenche AVANT le flow
   - Impossible d'attendre le webhook pour la reply publique

---

## 📚 Références

- [ManyChat Claude Integration](https://help.manychat.com/hc/en-us/articles/19689792833180-Claude-integration)
- [Instagram Graph API - Comments](https://developers.facebook.com/docs/instagram-api/reference/ig-media/comments)
- Système DM existant : `app/src/app/api/dm/webhook/route.ts`
- Prompt Elena DM : `app/src/lib/elena-dm.ts`

---

*Créé le 15 janvier 2025*  
*Passé en dev le 15 janvier 2025*
