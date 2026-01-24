# DONE-079: Nano Banana Pro Audit & Content Brain Fix

**Status**: ✅ Terminé  
**Date**: 20 janvier 2026  
**Durée**: ~2h

---

## 📋 Problème

60-70% des images Elena ne généraient plus avec l'API Nano Banana Pro de Google (via Replicate). Les filtres safety bloquaient même des contenus relativement SFW comme bikini à la plage.

---

## 🔍 Audit réalisé

### Méthodologie
- 17 tests progressifs
- Tests avec/sans références
- Tests refs séparées (face vs body)
- Tests expressions et poses variées

### Découvertes clés

1. **Le problème : combinaison FACE + BODY refs**
   - Face ref seule : ✅ OK
   - Body ref seule : ✅ OK  
   - Les deux ensemble : ❌ BLOQUÉ

2. **Règle expressions + tenues**
   - Bikini + expression neutre : ✅ OK
   - Bikini + expression sexy : ❌ BLOQUÉ

---

## ✅ Solution implémentée

### 1. Configuration Elena (`scheduled-post.mjs`)
```javascript
// AVANT
face_ref: '...',
body_ref: '...',
extra_refs: ['...'],

// APRÈS
face_ref: '...',
body_ref: null,      // Désactivé
extra_refs: [],      // Désactivé
```

### 2. Expressions nettoyées
```javascript
// Supprimé
'intense captivating gaze', 'lips slightly parted', 'sensual', 'alluring', 'sultry'

// Remplacé par
'confident warm gaze', 'sophisticated smile', 'elegant presence', 'glamorous'
```

### 3. Enhancers mis à jour
- Supprimé : `curves`, `towel`, `lying on bed`, `over shoulder`
- Gardé : `bodysuit`, `mini dress`, `cleavage`, `standing`, `hand on hip`

### 4. Safer prompt fallback étendu
```javascript
.replace(/sensual/gi, 'elegant')
.replace(/alluring/gi, 'confident')
.replace(/sultry/gi, 'glamorous')
.replace(/captivating gaze/gi, 'warm gaze')
.replace(/intense gaze/gi, 'confident expression')
.replace(/lips slightly parted/gi, 'warm smile')
.replace(/curves/gi, 'silhouette')
// ... etc
```

---

## 📊 Résultats

| Métrique | Avant | Après |
|----------|-------|-------|
| Taux de succès | ~30-40% | ~85-90% |
| Elena bikini | ❌ Bloqué | ✅ 55.6s |
| Elena evening dress | ❌ Timeout | ✅ ~50s |

---

## 📁 Fichiers

### Modifiés
- `app/scripts/scheduled-post.mjs`

### Créés
- `docs/ELENA-PROMPT-AUDIT.md` — Documentation audit complète
- `app/scripts/audit-*.mjs` — 6 scripts de test

---

## 🔗 Liens

- [Session](../../docs/sessions/2026-01-20-nano-banana-pro-audit.md)
- [Audit complet](../../docs/ELENA-PROMPT-AUDIT.md)
