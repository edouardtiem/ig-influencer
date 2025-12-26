# BUG-010: Pas de gestion d'erreurs API Instagram

**Date découverte** : 24 décembre 2024  
**Date fixée** : 26 décembre 2024  
**Sévérité** : 🔴 High  
**Status** : ✅ Fixé dans `scheduled-post.mjs` | 🔧 À appliquer dans autres scripts

---

## 🐛 Description

Le code `publishCarousel()` et `publishReel()` dans `scheduled-post.mjs` ne vérifie pas les erreurs retournées par l'API Instagram. Si l'API retourne une erreur (token invalide, rate limit, etc.), le code marque quand même le post comme "posted" avec `instagram_post_id: null`.

---

## 🔍 Symptômes

- Post marqué `status: 'posted'` dans la base de données
- Mais `instagram_post_id: null` et `instagram_permalink: null`
- Les images sont générées et uploadées sur Cloudinary ✅
- Mais la publication Instagram échoue silencieusement ❌

---

## 📍 Fichiers concernés

- `app/scripts/scheduled-post.mjs`
  - Fonction `publishCarousel()` (ligne ~762)
  - Fonction `publishReel()` (ligne ~798)

---

## 💡 Solution proposée

1. **Vérifier les erreurs API** avant de marquer "posted"
   ```javascript
   const publishData = await publishResponse.json();
   
   if (publishData.error) {
     throw new Error(`Instagram API error: ${publishData.error.message}`);
   }
   
   if (!publishData.id) {
     throw new Error('Instagram API returned no post ID');
   }
   ```

2. **Logger les erreurs** correctement pour debugging
3. **Ne pas marquer "posted"** si `instagram_post_id` est null

---

## 🔗 Références

- [Session Documentation](../docs/SESSION-24-DEC-2024-CAROUSEL-ONLY.md)

---

## ✅ Fix appliqué

**Date** : 26 décembre 2024  
**Fichier** : `app/scripts/scheduled-post.mjs`

### Changements

- ✅ Ajout vérification `publishData.error` dans `publishCarousel()`
- ✅ Ajout vérification `publishData.error` dans `publishReel()`
- ✅ Vérification que `publishData.id` existe avant de retourner
- ✅ Vérification erreurs à chaque étape (containers, carousel container, publication)
- ✅ Messages d'erreur descriptifs avec code d'erreur API

### Documentation

- ✅ Guide de migration créé : `docs/BUG-010-FIX-GUIDE.md`
- ✅ Template de code fourni pour les autres scripts

## 📋 À faire (autres scripts)

- [ ] Appliquer le fix dans `carousel-post.mjs` (Mila auto-post)
- [ ] Appliquer le fix dans `carousel-post-elena.mjs` (Elena auto-post)
- [ ] Appliquer le fix dans `duo-post.mjs` (Duo posts)
- [ ] Tester tous les scripts avec token invalide
- [ ] Corriger les 9 posts existants marqués "posted" mais non publiés

