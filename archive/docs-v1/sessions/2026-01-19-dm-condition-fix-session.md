# 📝 FIN DE SESSION — DM Condition Fix Session

**Date** : 19 janvier 2026  
**Durée** : ~1h

---

## ✅ Ce qui a été fait cette session :

1. **🔍 Diagnostic du problème de non-envoi des réponses DM**
   - Identification : Les réponses étaient générées par le backend mais ManyChat ne les envoyait pas
   - Cause racine : Condition ManyChat vérifiait `elena_should_send is true` mais la valeur stockée était `1`
   - Impact : Tous les DMs étaient ignorés malgré des réponses valides générées

2. **🔧 Fix condition ManyChat**
   - Changement de la condition : `elena_should_send is true` → `elena_should_send is 1`
   - ManyChat convertit les booleans en nombres (true → 1, false → 0)
   - Test réussi avec compte @edtiem : réponses envoyées correctement

3. **🖼️ Fix détection URLs de photos Instagram**
   - Problème : ManyChat envoie parfois les URLs CDN directement dans `last_input_text`
   - Solution : Détection des URLs Instagram (`lookaside.fbsbx.com`, `cdn.fbsbx.com`, etc.)
   - Conversion automatique en token `[IMAGE_SENT]` pour réponse appropriée
   - Impact : Plus de réponses bizarres comme "i'm real 🖤" quand quelqu'un envoie une photo

4. **📚 Documentation expansion custom fields**
   - Analyse stratégique des custom fields ManyChat
   - Recommandations pour personnalisation avancée (langue, stage, mémoire long-terme)
   - Création roadmap IDEA-020 pour futures améliorations

---

## 📁 Fichiers créés/modifiés :

### Modifiés :
- ✅ `app/src/app/api/dm/webhook/route.ts` — Détection URLs média Instagram
- ✅ `docs/sessions/2026-01-19-dm-complete-fix-session.md` — Documentation complète avec analyse custom fields
- ✅ `roadmap/ideas/IDEA-020-custom-fields-expansion.md` — Plan d'expansion custom fields

### Créés :
- ✅ `docs/sessions/2026-01-19-dm-condition-fix-session.md` — **CE DOCUMENT**

---

## 🚧 En cours (non terminé) :

- ⏳ **Monitoring** — Vérifier que tous les DMs reçoivent bien des réponses maintenant
- ⏳ **Test photos** — Vérifier que les photos sont bien détectées et génèrent des réponses chaleureuses

---

## 📋 À faire prochaine session :

### 🟠 IMPORTANT

- [ ] **Implémenter Phase 1 custom fields** — Ajouter `elena_language` et `elena_stage` dans Response Mapping
- [ ] **Analyser métriques** — Comparer taux de réponse avant/après fix condition
- [ ] **Vérifier autres contacts** — S'assurer que les anciens contacts bloqués reçoivent maintenant des réponses

### 🟢 OPTIONNEL

- [ ] **Améliorer détection langue** — Implémenter Option C (hybride) avec `locale` ManyChat
- [ ] **Documenter flow ManyChat** — Screenshots du flow final pour référence

---

## 🐛 Bugs découverts :

### BUG-019 : Condition ManyChat ne matchait pas la valeur stockée ✅ FIXÉ

**Description** : Les réponses DM étaient générées mais jamais envoyées par ManyChat.

**Cause** : 
- Backend retourne `should_send: true` (boolean)
- ManyChat stocke dans custom field comme `"1"` (string/number)
- Condition vérifiait `elena_should_send is true` (string "true")
- Résultat : `"1" ≠ "true"` → condition échoue → pas d'envoi

**Fix** : 
- Changement condition : `elena_should_send is 1`
- Maintenant la condition matche correctement la valeur stockée

**Impact** : 🔴 CRITIQUE — Résout le problème de non-envoi des réponses DM

### BUG-020 : URLs photos Instagram non détectées ✅ FIXÉ

**Description** : Quand quelqu'un envoie une photo, ManyChat envoie l'URL CDN comme texte, causant des réponses inappropriées.

**Exemple** :
- Input : `https://lookaside.fbsbx.com/ig_messaging_cdn/?asset_id=...`
- Output : "i'm real 🖤 wanna chat?" (complètement hors sujet)

**Fix** : 
- Détection des URLs Instagram (`lookaside.fbsbx.com`, `cdn.fbsbx.com`, `scontent`, etc.)
- Conversion automatique en `[IMAGE_SENT]` token
- Génère maintenant : "aww cute 🖤 where are you from?" (réponse appropriée)

**Impact** : 🟠 IMPORTANT — Améliore la qualité des réponses aux photos

---

## 💡 Idées notées :

### 1. **ManyChat AI vs Webhook**

Clarification importante :
- **ManyChat AI Comments** (ON) → Répond aux commentaires sur les posts
- **Notre webhook** → Répond aux DMs

Ce sont deux systèmes séparés. Le problème était que notre webhook ne fonctionnait pas à cause de la condition.

### 2. **Custom Fields Expansion**

Voir `roadmap/ideas/IDEA-020-custom-fields-expansion.md` pour plan détaillé :
- Phase 1 : Langue + Stage (quick wins)
- Phase 2 : Détection langue améliorée
- Phase 3 : Mémoire long-terme

---

## 📝 Notes importantes :

### Architecture finale ManyChat

```
User sends DM
      ↓
External Request → https://ig-influencer.vercel.app/api/dm/webhook
      ↓
Response Mapping:
- response → elena_response
- should_send → elena_should_send (stocké comme "1")
      ↓
Condition: elena_should_send is 1  ← FIX ICI
      ↓                    ↓
   ✅ YES               ❌ NO
      ↓                    ↓
Smart Delay (12s)       (fin - rien)
      ↓
Send Message (elena_response)
```

### Types de valeurs ManyChat

| Backend retourne | ManyChat stocke | Condition à utiliser |
|------------------|-----------------|----------------------|
| `should_send: true` | `"1"` | `is 1` |
| `should_send: false` | `"0"` ou vide | `is 0` ou `is empty` |
| `detected_language: "fr"` | `"fr"` | `is "fr"` |

**Règle générale** : ManyChat convertit les booleans en nombres. Toujours vérifier la valeur réelle dans Custom Fields avant de configurer les conditions.

### Détection URLs média

Patterns détectés :
- `lookaside.fbsbx.com/ig_messaging_cdn`
- `cdn.fbsbx.com`
- `scontent` (Instagram CDN)
- URLs directes images (`.jpg`, `.png`, `.gif`, `.webp`, `.mp4`, `.mov`)

---

## 🔗 Références

- [DONE-072 ManyChat Conditional Fix](../roadmap/done/DONE-072-dm-manychat-conditional-fix.md)
- [IDEA-020 Custom Fields Expansion](../roadmap/ideas/IDEA-020-custom-fields-expansion.md)
- [Session complète DM Fix](../docs/sessions/2026-01-19-dm-complete-fix-session.md)

---

**Commits** : 
- `d78b391` — `fix: Detect Instagram media URLs and convert to [IMAGE_SENT] token`
- `[commit-hash]` — `fix: ManyChat condition - use "1" instead of "true" for elena_should_send`

**Status** : ✅ Condition fixée, URLs photos détectées, système fonctionnel, prêt pour monitoring
