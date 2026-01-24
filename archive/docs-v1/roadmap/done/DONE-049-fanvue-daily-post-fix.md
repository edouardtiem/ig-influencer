# DONE-049: Fanvue Daily Post API Fix

**Date** : 3 janvier 2025  
**Version** : v2.39.0  
**Type** : 🐛 Bug Fix

---

## 🎯 Objectif

Corriger le bug 404 sur le workflow GitHub Actions "Elena Daily Fanvue Post" qui empêchait la publication automatique quotidienne sur Fanvue.

---

## 🐛 Problème

Le workflow GitHub Actions échouait avec l'erreur :
```
❌ Fatal error: Fanvue post failed: 404 Not Found
```

**Root Cause** :
- Endpoint API incorrect : `/v1/posts` (n'existe pas)
- Field names incorrects : camelCase au lieu de snake_case
- Field `audience` n'existe pas dans l'API Fanvue

---

## ✅ Solution

Correction de la fonction `postToFanvue()` dans `daily-fanvue-elena.mjs` :

1. **Endpoint** : `/v1/posts` → `/posts`
2. **Field names** :
   - `text` → `content`
   - `mediaUrls` → `media_urls`
   - `audience: 'subscribers'` → `is_premium: true`

---

## 📁 Fichiers modifiés

- `app/scripts/daily-fanvue-elena.mjs`

---

## ✅ Validation

- ✅ Code corrigé et commité
- ✅ Push vers GitHub effectué
- ⏳ Attente du prochain run automatique pour validation finale

---

## 📝 Notes

Le script est maintenant aligné avec la lib `fanvue.ts` qui utilise les bons endpoints et field names. Le workflow devrait fonctionner correctement pour les prochains runs automatiques (17h Paris).

