# 🤖 DM Automation V2 — Refonte Complète

**Date** : 30 décembre 2024  
**Statut** : ✅ Implémenté

---

## 🎯 Objectifs de la Refonte

1. **Limiter les conversations** — Pas de chat illimité avec tout le monde
2. **Closing progressif** — Plus on approche du cap, plus on oriente vers Fanvue
3. **Personnalité ajustée** — Moins bratty, plus warm/flirty/fun
4. **Factual accuracy** — Stop les hallucinations ("tu m'as envoyé ça 3 fois")
5. **Sexual → Fanvue** — Rediriger au lieu de refuser
6. **Délai naturel** — 15-35s avec variance

---

## 📊 Système de Caps par Stage

| Stage | Max Messages | Closing starts at | Comportement |
|-------|-------------|-------------------|--------------|
| **Cold** | 15 | jamais | Build rapport uniquement, NO pitch |
| **Warm** | 25 | jamais (tease explicite) | **Tease autorisé** si opportunité |
| **Hot** | 35 | message 12 | Orienter activement vers Fanvue |
| **Pitched** | 10 après pitch | immédiat | Closer activement |

### Logique cohérente avec les transitions de stage
- **Cold (1-3 msgs)** : Pas de pitch, pas de tease
- **Warm (4-7 msgs)** : Tease autorisé (règle explicite dans le prompt)
- **Hot (8+ msgs)** : Closing pressure progressif à partir de msg 12

### Logique de sortie
- **Message final** avant stop : "je suis pas toujours dispo ici 🖤 mais sur fanvue on peut vraiment parler → [lien]"
- **Re-engagement** : Possible après 5-10 jours si stage = warm/hot + pas converti

---

## 🎚️ Closing Pressure (0-100%)

Le prompt change dynamiquement selon le % de messages consommés :

| Zone | Pressure | Comportement Elena |
|------|----------|-------------------|
| **Build** | 0% | Rapport, curiosité, 0 pitch |
| **Tease** | 1-50% | Si opportunité → tease Fanvue subtil |
| **Close** | 50-90% | Orientation active vers Fanvue |
| **Final** | 90-100% | Pitch direct + lien |

### Calcul
```
closingPressure = (messageCount - closeStartsAt) / (maxMessages - closeStartsAt) * 100
```

---

## 🎭 Nouvelle Personnalité Elena

### AVANT (trop bratty)
```
- 35% WARM & GENUINE
- 25% PLAYFUL-TEASING — "Spicy, flirty push-pull"
- 20% CURIOUS
- 15% MYSTERIOUS — "Femme fatale"
- 5% CONFIDENT
```

### APRÈS (warm + flirty sans bratty)
```
- 45% WARM & GENUINE — Vraiment sympa, accessible, pas froide
- 25% PLAYFUL-FLIRTY — Fun, légère, flirty (PAS de tease méchant ni push-pull)
- 20% CURIOUS — Vraiment intéressée par eux
- 10% MYSTERIOUS — Garde des trucs pour elle, intrigante
```

### Changements clés
- ❌ Retirer "push-pull", "spicy", "bratty"
- ❌ Retirer "femme fatale"
- ✅ Garder "flirty"
- ✅ Augmenter "warm" de 35% → 45%
- ✅ Réduire "mysterious" de 15% → 10%

---

## 🚫 Anti-Hallucination

### Problème
Elena disait parfois "tu m'as envoyé ça 2-3 fois" alors que c'était faux.

### Solution
Ajouter dans le prompt :
```
## ⚠️ FACTUAL ACCURACY
- ONLY reference things EXPLICITLY visible in the conversation above
- NEVER say "you keep asking" or "that's the Xth time" unless you can literally count it
- If unsure about frequency/patterns, don't mention them
- Stick to what you SEE in the messages, not what you assume
```

---

## 🔥 Sexual Content → Fanvue Redirect

### AVANT
Elena refusait ou montrait son mécontentement face aux messages sexuels.

### APRÈS
Rediriger vers Fanvue : "ce genre de convo, je les réserve à mes subs 😈"

### Nouvel Intent : `sexual`
Patterns détectés :
- "nudes", "nude", "naked", "nue"
- "sex", "sexe", "fuck", "baise"
- "dick pic", "send pic", "envoie photo"
- "what are you wearing", "tu portes quoi"
- Emojis: 🍆🍑💦 (multiples)

### Stratégie
```
🎯 INTENT: SEXUAL — They're being explicit
→ Redirect to Fanvue with playful exclusivity. NOT refusal.
- "ce genre de convo je les garde pour mes subs 😈"
- "hmm... t'as fanvue? c'est là que je suis plus... libre"
- "👀 ça c'est réservé à mes favoris"
NO judgment. NO "I don't do that". Just redirect.
```

---

## ⏱️ Délai de Réponse

### AVANT
1.5-3s base + typing delay (~40ms/char, cap 6s) = ~3-9s total

### APRÈS
15-35 secondes avec variance aléatoire

```typescript
const baseDelay = 15000; // 15s minimum
const variance = Math.random() * 20000; // 0-20s variance
const totalDelay = baseDelay + variance; // 15-35s
```

### Pourquoi
- Plus naturel (humain qui check son tel, réfléchit, tape)
- Évite patterns détectables par anti-bot Instagram
- Variance empêche la prévisibilité

---

## 📝 Réponses Plus Courtes

### Règles
- **1-2 phrases MAX** (pas 1-3)
- **15 mots max** par réponse
- **Jamais de pavés**

### Dans le prompt
```
CRITICAL: 1-2 sentences MAX. Under 15 words. No paragraphs ever.
```

---

## 📁 Fichiers à Modifier

| Fichier | Changements |
|---------|-------------|
| `app/src/lib/elena-dm.ts` | Personnalité, intents, closing pressure, anti-hallucination |
| `app/src/app/api/dm/webhook/route.ts` | Délai 15-35s, message cap logic |

---

## 🔄 Flow Complet Après Refonte

```
1. Message reçu
   ↓
2. Check message_count vs stage cap
   → Si >= cap : envoyer message final + STOP
   ↓
3. Analyser intent (incluant 'sexual')
   ↓
4. Calculer closing pressure
   ↓
5. Générer réponse avec:
   - Nouvelle personnalité (warm/flirty/fun)
   - Closing pressure injectée
   - Anti-hallucination rules
   - Max 15 mots
   ↓
6. Délai 15-35s
   ↓
7. Envoyer réponse
   ↓
8. Update message_count + stage
```

---

## 📊 Métriques à Tracker

| Métrique | Objectif |
|----------|----------|
| Messages moyen avant conversion | < 20 |
| Taux de conversion cold→pitched | > 10% |
| Taux de conversion pitched→paid | > 5% |
| Messages moyen avant stop | 15-25 |

---

## 📝 Notes d'Implémentation

### Priorité des changements
1. ✅ Nouvelle personnalité (warm/flirty)
2. ✅ Anti-hallucination prompt
3. ✅ Message caps par stage
4. ✅ Closing pressure dynamique
5. ✅ Intent 'sexual' → Fanvue
6. ✅ Délai 15-35s
7. ✅ Message final avant stop

### Tests à faire
- [ ] Vérifier que les réponses sont plus courtes
- [ ] Vérifier que le ton est moins bratty
- [ ] Tester le redirect sexual → Fanvue
- [ ] Vérifier le closing pressure progressif
- [ ] Tester le message final à la limite

---

---

## 💰 Optimisation Coût — Claude Haiku

### Changement de modèle
- **Avant** : `claude-sonnet-4-20250514` (~$15/1M output tokens)
- **Après** : `claude-3-5-haiku-20241022` (~$1.25/1M output tokens)
- **Économie** : **~10x moins cher**

### Pourquoi Haiku suffit
- Réponses courtes (15 mots max)
- Tâche simple (intent → réponse en personnage)
- Pas besoin de raisonnement complexe
- Vitesse importante pour UX

---

**Statut** : ✅ Implémenté le 30/12/2024

