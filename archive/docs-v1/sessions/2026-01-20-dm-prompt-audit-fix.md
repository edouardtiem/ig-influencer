# 🔍 DM Prompt Audit & Fix — 20 janvier 2026

**Durée** : ~2h  
**Focus** : Audit complet système DM + Corrections majeures prompts

---

## 🎯 Objectif

Audit des conversations DM des 6 dernières heures pour identifier les problèmes de prompts qui rendent Elena "bête" et causent des incompréhensions.

---

## 🔍 Audit des 6 dernières heures

### Résultats
- **Instagram DM** : 909 messages (460 entrants, 449 sortants)
- **Fanvue DM** : 0 messages

### Problèmes identifiés

1. **Changements de langue abrupts**
   - Elena répond en anglais alors que le user parle français
   - Exemple: User "D'où venez-vous?" → Elena "what do you do for fun?"

2. **Ne répond pas aux questions**
   - User demande des infos sur Elena → Elena répond hors-sujet
   - Exemple: "Mais vous ne m'avez rien dit sur vous-même" → "je suis à Paris 🖤 il fait beau"

3. **Ignore le contexte / redemande des infos déjà données**
   - User dit son métier → 5 messages plus tard Elena redemande "tu fais quoi dans la vie?"
   - Exemple: User explique travail fibre optique → Elena "tu fais quoi dans la vie? 👀"

4. **Réponses génériques répétitives**
   - Toujours les mêmes questions: "tu viens d'où?", "tu fais quoi dans la vie?"

---

## 🔬 Analyse du code — Causes racines

### 1. Limite de 12 mots stricte
```typescript
// AVANT
"- Under 12 words TOTAL — COUNT THEM"
"- If you write more than 12 words, you FAIL"
```
**Problème** : Impossible d'avoir des conversations intelligentes avec 12 mots max.

### 2. Instruction contradictoire sur l'historique
```typescript
// AVANT
"- ONLY reference things EXPLICITLY visible in the LAST MESSAGE (not the history)"
```
**Problème** : Le code passe l'historique mais dit à l'IA de l'IGNORER!

### 3. Language matching trop soft
**Problème** : Instructions pas assez fortes, pas de validation.

---

## ✅ Corrections apportées

### A. Limite de mots: 12 strict → "sois concise"
```diff
- Under 12 words TOTAL — COUNT THEM
- If you write more than 12 words, you FAIL
+ NO hard word limit, but say what you need with MINIMUM words
+ Text like a real person: short when appropriate, longer when needed
+ If you can say it in 5 words, don't use 15
+ But if answering a question needs 20 words, that's fine
```
- Validation: 15 mots max → **50 mots max**
- max_tokens Claude: 50 → **150**

### B. Utilisation de l'historique
```diff
- ONLY reference things EXPLICITLY visible in the LAST MESSAGE (not the history)
+ You have access to the FULL conversation history — USE IT
+ REMEMBER what they told you: their job, location, interests, name
+ NEVER ask a question they already answered
+ Reference past info naturally: "ah tu travailles toujours dans [their job]?"
```

### C. Profil utilisateur complet
- Extraction intelligente: nom, localisation, métier, âge, hobbies, sports
- Résumé injecté dans le prompt:
```
👤 PROFIL UTILISATEUR — CE QUE TU SAIS SUR LUI:
• Prénom: Stéphane
• Localisation: Belgique, Breeg
• Métier: fibre optique / télécom
• Sports: gym
💡 UTILISE CES INFOS NATURELLEMENT
```

### D. Détection langue temps réel
- Détecte la langue du message **actuel** (pas juste stocké)
- Utilise la langue détectée en priorité

### E. Validation langue
- Rejette les réponses dans la mauvaise langue
- Régénère automatiquement si langue incorrecte

### F. Feedback loop
- Track l'efficacité des réponses (temps de réponse user)
- Log les patterns qui marchent

### G. Questions contextuelles variées
- **Emoji** = Réaction positive → rebondir sur message précédent
- **"oui/ok"** = Construire sur contexte, pas question générique
- Alterner questions/statements selon contexte
- Ton adapté au stage (cold→flirty)

### H. Limite de 3 liens max
- Track `fanvue_link_sent_count` sur le contact
- Max 3 envois, après ça référence au lieu de renvoyer
- Phrases de référence: "tu l'as toujours le lien? 🖤"

---

## 📁 Fichiers modifiés

- `app/src/lib/elena-dm.ts` (modifications majeures)
- `app/supabase/migrations/010_add_link_sent_count.sql` (nouveau)

---

## 🎯 Impact attendu

1. ✅ Elena peut donner des réponses plus longues quand nécessaire
2. ✅ Elle se souvient de ce que l'utilisateur a dit
3. ✅ Elle ne redemande pas les mêmes questions
4. ✅ Elle reste dans la bonne langue
5. ✅ Moins de spam de liens Fanvue
6. ✅ Conversations plus naturelles et intelligentes

---

## 📝 Notes

- Les changements sont actifs immédiatement pour les nouvelles conversations
- Migration DB nécessaire pour `fanvue_link_sent_count`
- Audit à refaire dans 24h pour vérifier l'amélioration
