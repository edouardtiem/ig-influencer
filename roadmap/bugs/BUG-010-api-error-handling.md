# BUG-010: Pas de gestion d'erreurs API Instagram

**Date découverte** : 24 décembre 2024  
**Sévérité** : 🔴 High  
**Status** : 🔍 Identifié

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

## 📋 À faire

- [ ] Ajouter vérification `publishData.error` dans `publishCarousel()`
- [ ] Ajouter vérification `publishData.error` dans `publishReel()`
- [ ] Vérifier que `publishData.id` existe avant de marquer "posted"
- [ ] Logger les erreurs API correctement
- [ ] Tester avec token invalide pour vérifier que l'erreur est bien catchée

