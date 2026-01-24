# 📝 Session 29 Décembre 2024 — Intent-Driven DM System

**Date** : 29 décembre 2024  
**Durée** : ~30min

---

## 🎯 Objectif de la Session

Implémenter un système d'**intent-driven personality** pour les DMs d'Elena :
1. Adapter la personnalité d'Elena en fonction de l'**intent** du message
2. Déclencher le pitch Fanvue quand l'intent montre que la personne **en veut plus**

---

## ✅ Ce qui a été fait cette session

### 1. Nouveaux Types d'Intent

Ajout de types d'intent spécifiques pour le funnel et l'adaptation de personnalité :

| Catégorie | Intent | Description |
|-----------|--------|-------------|
| **Funnel** | `wants_more` | "t'as d'autres photos ?" → Tease Fanvue |
| **Funnel** | `asking_link` | "où ça ?" → Donne le lien |
| **Mood** | `vulnerable` | "bad day" → Mode WARM |
| **Mood** | `cocky` | Overconfident → Mode PLAYFUL |
| **Mood** | `provocative` | Testing → Mode CONFIDENT |
| **Mood** | `curious` | Questions sur elle → Mode CURIOUS |

### 2. Système de PersonalityMode

Chaque intent déclenche un **mode de personnalité** qui ajuste les % :

| Mode | Effet |
|------|-------|
| `warm` | 60% warmth, moins de tease |
| `playful` | 60% teasing, challenge |
| `curious` | 60% questions, engagement |
| `mysterious` | Réponses courtes, intrigue |
| `confident` | Unbothered, pas défensive |
| `balanced` | Mix normal (35/25/20/15/5) |

### 3. Intent-Driven Fanvue Pitch

**AVANT** : Pitch basé sur le nombre de messages (stage = HOT après 8 messages)

**APRÈS** : Pitch basé sur l'**intent du message** :

```
👤 "T'as d'autres photos ?"
   ↓ Intent: WANTS_MORE
   
🤖 "y'a des trucs que je poste pas ici 👀"
   
👤 "Ah où ça ?"
   ↓ Intent: ASKING_LINK
   
🤖 "fanvue.com/elenav.paris 🖤"
```

### 4. Patterns de Détection

**Wants More** (tease Fanvue) :
- "see more" / "voir plus" / "more photos"
- "other pics" / "d'autres photos"
- "exclusive" / "private" / "behind the scenes"
- "plus sexy" / "spicy" / "nsfw"
- Emoji lourds : 🔥🔥, 😍😍, 👀👀, 🤤

**Asking Link** (donne le lien) :
- "où" / "where" / "show me" / "link"
- "oui" / "yes" / "please" / "i want"

**Vulnerable** (mode warm) :
- "bad day" / "sad" / "stressed" / "tired"
- "lonely" / "need someone"

**Cocky** (mode playful) :
- "i bet" / "i could" / "easy"
- "obviously" / "watch me"

---

## 📁 Fichiers modifiés

| Fichier | Type | Description |
|---------|------|-------------|
| `app/src/lib/elena-dm.ts` | Modifié | Refonte complète avec intent system |
| `docs/sessions/2024-12-29-intent-driven-dm-system.md` | Créé | Ce fichier |

---

## 🔧 Détails Techniques

### Nouvelles Structures

```typescript
// Types d'intent étendus
export type MessageIntent = 
  | 'greeting' | 'compliment' | 'question' | 'flirt' | 'ai_question'
  | 'wants_more' | 'asking_link'  // Funnel
  | 'vulnerable' | 'cocky' | 'curious' | 'provocative';  // Mood

// Mode de personnalité
export type PersonalityMode = 'warm' | 'playful' | 'curious' | 'mysterious' | 'confident' | 'balanced';

// Résultat d'analyse enrichi
interface IntentAnalysis {
  intent: MessageIntent;
  sentiment: MessageSentiment;
  recommendedMode: PersonalityMode;
  modeReason: string;
  triggerFanvuePitch: boolean;  // 🎯 Key flag
}
```

### Flow de Décision

```
Message entrant
     │
     ▼
analyzeMessageIntent()
     │
     ├─ Intent = wants_more?
     │       │
     │       ▼ YES
     │   triggerFanvuePitch = true
     │   recommendedMode = 'mysterious'
     │       │
     │       ▼
     │   Elena tease Fanvue (si pas déjà pitched)
     │
     ├─ Intent = asking_link?
     │       │
     │       ▼ YES
     │   Elena donne le lien
     │
     └─ Autre intent?
             │
             ▼
         Adapter personnalité selon recommendedMode
```

---

## 📊 Comparaison Avant/Après

| Aspect | Avant | Après |
|--------|-------|-------|
| **Trigger pitch** | Stage = HOT (8+ msgs) | Intent = WANTS_MORE |
| **Personnalité** | Statique (mix fixe) | Dynamique (par intent) |
| **Logging** | Basic | Mode + Intent + Pitch flag |
| **Stratégies** | 6 | 8 (+ tease_fanvue, give_link) |

---

## 🚧 Points d'Attention

### Déploiement

Les changements sont dans `elena-dm.ts`. Après push, Vercel redéploie automatiquement.

### Tester

Envoyer des DMs avec différents intents pour vérifier :
- "t'as d'autres photos ?" → Devrait tease Fanvue
- "j'ai eu une journée de merde" → Devrait être warm
- "je parie que t'oserais pas" → Devrait être playful/confident

---

## 💡 Prochaines Étapes

1. [ ] Tester en production avec quelques DMs
2. [ ] Monitorer les logs pour voir les intents détectés
3. [ ] Ajuster les patterns si faux positifs/négatifs
4. [ ] Potentiellement ajouter AI-based intent detection (upgrade)

---

## 📝 Notes Importantes

1. **Priority des intents** : Les funnel intents (wants_more, asking_link) ont priorité sur les mood intents

2. **Stage COLD protégé** : Même avec wants_more détecté, si stage = COLD on ne pitch pas encore

3. **Stage PITCHED protégé** : Si déjà pitched, on ne re-pitch pas sauf si ils demandent

4. **Le système est rule-based** : Peut être upgradé vers AI-based plus tard si nécessaire

---

*Session documentée le 29 décembre 2024*

