# DONE-083 — AI Response Generation (Remplace Hardcodé)

**Date** : 20 janvier 2026  
**Status** : ✅ Terminé  
**Impact** : Créativité et naturel des réponses Elena

---

## 📋 Problème

Les réponses Elena étaient souvent répétitives car basées sur des arrays hardcodés:
- `EXIT_MESSAGES` (6 phrases)
- `SMART_FALLBACKS` (~12 phrases)
- `LINK_REFERENCE_PHRASES` (8 phrases)
- `FANVUE_FOLLOWUP_QUESTIONS` (7 phrases)

**Total: ~33 réponses hardcodées** qui tuaient la créativité et rendaient Elena robotique.

---

## ✅ Solution

### Architecture: Templates + AI Generation

```typescript
// Templates avec exemples (guidance, pas outputs)
RESPONSE_TEMPLATES = {
  exit_message: {
    description: "Natural excuse to leave + redirect to Fanvue",
    guidelines: "Excuse crédible, mentionne Fanvue, inclus le lien",
    examples_fr: ["shooting dans 5 min...", "je file bébé..."],
    examples_en: ["got a shoot in 5...", "gotta run babe..."],
    fallbacks_fr: [...],  // ONLY si AI échoue
    fallbacks_en: [...],
  },
  link_reference: { ... },
  link_followup: { ... },
  fallback_engage: { ... },
};

// AI génère des réponses uniques
generateContextualResponse(type, {
  language,      // fr/en
  stage,         // cold/warm/hot/...
  userName,      // prénom si connu
  recentMessages // éviter répétitions
});
```

### Fonctions créées

| Fonction | Usage |
|----------|-------|
| `getExitMessage(lang, name)` | Message de sortie AI-généré |
| `getFallbackEngageMessage(lang, stage, name, recent)` | Fallback engagement |
| `getLinkReferenceMessage(lang, name, recent)` | Référence au lien (sans le renvoyer) |
| `getLinkFollowupMessage(lang, name, recent)` | Follow-up après envoi lien |

### Comment ça marche

1. **L'IA reçoit:**
   - Description de l'objectif
   - Guidelines de style
   - Exemples (à ne PAS copier, juste pour le ton)
   - Contexte utilisateur (prénom, langue, stage)

2. **L'IA génère** une réponse unique via Claude Haiku (rapide, 60 tokens max)

3. **Si l'IA échoue** → fallback sur les exemples hardcodés

---

## 📁 Fichiers modifiés

- `app/src/lib/elena-dm.ts` (+304/-110 lignes)
  - `RESPONSE_TEMPLATES` object
  - `generateContextualResponse()` function
  - `getExitMessage()`, `getFallbackEngageMessage()`, etc.
  - Mise à jour des usages dans `processDM()` et `generateElenaResponse()`

---

## ✅ Avantages

| Avant | Après |
|-------|-------|
| Mêmes 6 excuses de sortie | Excuses uniques à chaque fois |
| Fallbacks génériques | Fallbacks contextuels (langue, ton, prénom) |
| Répétitions fréquentes | Réponses variées |
| Robotique | Naturel |

---

## 🔗 Liens

- Session: [2026-01-20-ai-response-generation.md](../../docs/sessions/2026-01-20-ai-response-generation.md)
- PR: Commit direct sur main
