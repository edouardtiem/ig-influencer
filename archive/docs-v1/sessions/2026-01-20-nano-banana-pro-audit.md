# Session 20 Janvier 2026 — Audit Nano Banana Pro & Content Brain Fix

**Date** : 20 janvier 2026  
**Durée** : ~2h  
**Focus** : Audit filtres Google Nano Banana Pro + Fix Content Brain Elena

---

## 📋 Contexte

60-70% des images Elena ne généraient plus avec Nano Banana Pro. Hypothèse initiale : Google a durci les filtres suite à un scandale avec Grok.

---

## ✅ Ce qui a été fait cette session

### 1. Audit complet des filtres Nano Banana Pro
- 17 tests progressifs réalisés
- Identification du problème : **combinaison FACE + BODY refs = bloqué**
- Découverte : chaque ref seule passe, mais ensemble = safety filter

### 2. Tests des limites (FACE ref only)
- **✅ Validé** : bikini, evening dress V-neck, mini dress, bodysuit, bubble bath
- **❌ Bloqué** : lingerie, sheer, towel, poses allongées, expressions sexy

### 3. Fix Content Brain (`scheduled-post.mjs`)
- Elena : body_ref désactivé (null), extra_refs vidé
- Expressions nettoyées (supprimé : sensual, alluring, sultry, lips parted...)
- Outfit/action enhancers mis à jour
- Safer prompt fallback étendu (10+ remplacements)

### 4. Vérification
- Test Elena bikini avec fix : **✅ SUCCESS en 55.6s**

---

## 📁 Fichiers créés/modifiés

### Modifiés
- `app/scripts/scheduled-post.mjs` — Fix refs + expressions + enhancers

### Créés
- `docs/ELENA-PROMPT-AUDIT.md` — Documentation complète de l'audit
- `app/scripts/audit-elena-prompts.mjs` — Tests avec both refs
- `app/scripts/audit-elena-noref.mjs` — Tests sans refs
- `app/scripts/audit-elena-refs-separate.mjs` — Tests refs séparées
- `app/scripts/audit-faceonly-bikini.mjs` — Tests face ref + tenues
- `app/scripts/audit-sexy-terms.mjs` — Tests termes sexy
- `app/scripts/audit-limits-faceonly.mjs` — Tests limites progressifs
- `app/scripts/test-contentbrain-fix.mjs` — Vérification du fix

---

## 🎯 Résultats de l'audit

### Règle clé découverte
```
Bikini/vêtements révélateurs + expressions sexy = BLOQUÉ
Bikini/vêtements révélateurs + expression neutre = OK
```

### Termes validés vs bloqués

| ✅ OK | ❌ Bloqué |
|-------|----------|
| confident, warm smile | sensual, alluring |
| glamorous, elegant | sultry, captivating gaze |
| bikini (pose neutre) | lips parted |
| evening dress + cleavage | curves |
| bodysuit, mini dress | lingerie, bralette |
| standing, hand on hip | lying down, over shoulder |

### Taux de succès estimé
- **Avant** : ~30-40%
- **Après** : ~85-90%

---

## 📋 À faire prochaine session

- [ ] Monitorer le taux de succès en production (24-48h)
- [ ] Optionnel : Créer une nouvelle body ref avec vêtements normaux
- [ ] Continuer LoRA training pour contrôle total du personnage

---

## 💡 Notes importantes

1. **Le problème n'était PAS les prompts** — C'était la combinaison des images de référence
2. **Google détecte les patterns** — Face ref seule + body ref seule = OK, mais ensemble = flaggé comme "adult content pattern"
3. **Solution validée** : FACE ref only + expressions neutres = ~90% success rate
4. **LoRA reste la solution long-terme** pour un contrôle total sans dépendre des refs

---

## 🔗 Liens

- [Audit complet](../ELENA-PROMPT-AUDIT.md)
- [DONE-079](../../roadmap/done/DONE-079-nano-banana-pro-audit-fix.md)
